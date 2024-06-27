use std::str::FromStr;
use std::time::Duration;

use ethers_core::types::{Address, U256};

use super::fees::{self, FeeEstimates};
use super::rpc::SendRawTransactionStatus;
use super::signer::{self, SignRequest};
use super::transaction::{self, spawn_transaction_checker};
use crate::management;
use crate::state::{increment_nonce, mutate_state, read_state, storage::OrderState};

pub struct Ic2P2ramp;

impl Ic2P2ramp {
    fn get_vault_manager_address(chain_id: u64) -> Result<String, String> {
        read_state(|state| {
            state
                .chains
                .get(&chain_id)
                .map(|chain_state| chain_state.vault_manager_address.clone())
                .ok_or_else(|| "Chain ID or vault address not found".to_string())
        })
    }

    pub async fn check_and_approve_token(
        chain_id: u64,
        token_address: String,
        gas: U256,
        fee_estimates: FeeEstimates,
    ) -> Result<bool, String> {
        let already_approved = read_state(|state| {
            state
                .chains
                .get(&chain_id)
                .map(|chain_state| {
                    ic_cdk::println!(
                        "[check_and_approve_token] approved_tokens = {:?}",
                        chain_state.approved_tokens
                    );
                    chain_state
                        .approved_tokens
                        .get(&token_address)
                        .cloned()
                        .unwrap_or(false)
                })
                .unwrap_or(false)
        });

        if !already_approved {
            let tx_hash = Self::approve_infinite_allowance(
                chain_id,
                token_address.clone(),
                gas,
                fee_estimates,
            )
            .await?;

            ic_cdk::println!("[check_and_approve_token] going to spawn_transaction_checker");
            spawn_transaction_checker(tx_hash, chain_id, 60, Duration::from_secs(4), move || {
                // Mark token as approved
                mutate_state(|state| {
                    if let Some(chain_state) = state.chains.get_mut(&chain_id) {
                        chain_state
                            .approved_tokens
                            .insert(token_address.clone(), true);
                    }
                });
                ic_cdk::println!(
                    "[check_and_approve_token::spawn_transaction_checker] Added token: {} for chain_id: {}",
                    token_address,
                    chain_id
                );
            });
        }

        Ok(true)
    }

    pub async fn deposit_funds(
        chain_id: u64,
        amount: u64,
        token_address: Option<String>,
        gas: Option<String>,
    ) -> Result<String, String> {
        let gas = U256::from_str(gas.unwrap_or("21000".to_string()).as_str())
            .unwrap_or(U256::from(21_000));

        let fee_estimates = fees::get_fee_estimates(9, chain_id).await;
        ic_cdk::println!(
            "[deposit_funds] gas = {:?}, max_fee_per_gas = {:?}, max_priority_fee_per_gas = {:?}",
            gas,
            fee_estimates.max_fee_per_gas,
            fee_estimates.max_priority_fee_per_gas
        );

        let vault_manager_address = Self::get_vault_manager_address(chain_id)?;

        let request: SignRequest;
        if let Some(token_address) = token_address {
            let token_approved = Self::check_and_approve_token(
                chain_id,
                token_address.clone(),
                gas,
                fee_estimates.clone(),
            )
            .await?;
            if !token_approved {
                return Err("Failed to approve token".to_string());
            }

            request = Self::sign_request_deposit_token(
                gas,
                fee_estimates,
                chain_id,
                amount,
                token_address,
                vault_manager_address,
            )
            .await?;
        } else {
            request = Self::sign_request_deposit_base_currency(
                gas,
                fee_estimates,
                chain_id,
                amount,
                vault_manager_address,
            )
            .await?;
        }

        Self::send_signed_transaction(request, chain_id).await
    }

    async fn sign_request_deposit_token(
        gas: U256,
        fee_estimates: FeeEstimates,
        chain_id: u64,
        amount: u64,
        token_address: String,
        vault_manager_address: String,
    ) -> Result<SignRequest, String> {
        let abi = r#"
            [
                {
                    "inputs": [
                        {"internalType": "address", "name": "_token", "type": "address"},
                        {"internalType": "uint256", "name": "_amount", "type": "uint256"}
                    ],
                    "name": "depositToken",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ]
        "#;

        let contract = ethers_core::abi::Contract::load(abi.as_bytes()).unwrap();
        let function = contract.function("depositToken").unwrap();
        let data = function
            .encode_input(&[
                ethers_core::abi::Token::Address(token_address.parse().unwrap()),
                ethers_core::abi::Token::Uint(ethers_core::types::U256::from(amount)),
            ])
            .unwrap();

        Ok(signer::create_sign_request(
            U256::from(0),
            chain_id.into(),
            Some(vault_manager_address.clone()),
            None,
            gas,
            Some(data),
            fee_estimates,
        )
        .await)
    }

    async fn sign_request_deposit_base_currency(
        gas: U256,
        fee_estimates: FeeEstimates,
        chain_id: u64,
        amount: u64,
        vault_manager_address: String,
    ) -> Result<SignRequest, String> {
        let abi = r#"
            [
                {
                    "inputs": [],
                    "name": "depositBaseCurrency",
                    "outputs": [],
                    "stateMutability": "payable",
                    "type": "function"
                }
            ]
        "#;

        let contract = ethers_core::abi::Contract::load(abi.as_bytes()).unwrap();
        let function = contract.function("depositBaseCurrency").unwrap();
        let data = function.encode_input(&[]).unwrap();

        Ok(signer::create_sign_request(
            U256::from(amount),
            chain_id.into(),
            Some(vault_manager_address.clone()),
            None,
            gas,
            Some(data),
            fee_estimates,
        )
        .await)
    }

    pub async fn commit_deposit(
        chain_id: u64,
        offramper_address: String,
        token_address: Option<String>,
        amount: u64,
        gas: Option<String>,
    ) -> Result<String, String> {
        let gas = U256::from_str(gas.unwrap_or("21000".to_string()).as_str())
            .unwrap_or(U256::from(21_000));

        let fee_estimates = fees::get_fee_estimates(9, chain_id).await;
        ic_cdk::println!(
            "[commit_deposit] gas = {:?}, max_fee_per_gas = {:?}, max_priority_fee_per_gas = {:?}",
            gas,
            fee_estimates.max_fee_per_gas,
            fee_estimates.max_priority_fee_per_gas
        );

        let vault_manager_address = Self::get_vault_manager_address(chain_id)?;
        let token_address = token_address.unwrap_or(Address::zero().to_string());
        let request = Self::sign_request_commit_deposit(
            gas,
            fee_estimates,
            chain_id,
            offramper_address,
            token_address,
            amount,
            vault_manager_address,
        )
        .await?;

        Self::send_signed_transaction(request, chain_id).await
    }

    async fn sign_request_commit_deposit(
        gas: U256,
        fee_estimates: FeeEstimates,
        chain_id: u64,
        offramper_address: String,
        token_address: String,
        amount: u64,
        vault_manager_address: String,
    ) -> Result<SignRequest, String> {
        let abi = r#"
            [
                {
                    "inputs": [
                        {"internalType": "address", "name": "_offramper", "type": "address"},
                        {"internalType": "address", "name": "_token", "type": "address"},
                        {"internalType": "uint256", "name": "_amount", "type": "uint256"}
                    ],
                    "name": "commitDeposit",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ]
        "#;

        let contract = ethers_core::abi::Contract::load(abi.as_bytes()).unwrap();
        let function = contract.function("commitDeposit").unwrap();
        let data = function
            .encode_input(&[
                ethers_core::abi::Token::Address(offramper_address.parse().unwrap()),
                ethers_core::abi::Token::Address(token_address.parse().unwrap()),
                ethers_core::abi::Token::Uint(ethers_core::types::U256::from(amount)),
            ])
            .unwrap();

        Ok(signer::create_sign_request(
            U256::from(0),
            chain_id.into(),
            Some(vault_manager_address.clone()),
            None,
            gas,
            Some(data),
            fee_estimates,
        )
        .await)
    }

    pub async fn uncommit_deposit(
        chain_id: u64,
        offramper_address: String,
        token_address: Option<String>,
        amount: u64,
        gas: Option<u64>,
    ) -> Result<String, String> {
        let gas = U256::from(gas.unwrap_or(21_000));

        let fee_estimates = fees::get_fee_estimates(9, chain_id).await;
        ic_cdk::println!(
            "[commit_deposit] gas = {:?}, max_fee_per_gas = {:?}, max_priority_fee_per_gas = {:?}",
            gas,
            fee_estimates.max_fee_per_gas,
            fee_estimates.max_priority_fee_per_gas
        );

        let vault_manager_address = Self::get_vault_manager_address(chain_id)?;
        let token_address = token_address.unwrap_or(Address::zero().to_string());
        let request = Self::sign_request_uncommit_deposit(
            gas,
            fee_estimates,
            chain_id,
            offramper_address,
            token_address,
            amount,
            vault_manager_address,
        )
        .await?;

        Self::send_signed_transaction(request, chain_id).await
    }

    async fn sign_request_uncommit_deposit(
        gas: U256,
        fee_estimates: FeeEstimates,
        chain_id: u64,
        offramper_address: String,
        token_address: String,
        amount: u64,
        vault_manager_address: String,
    ) -> Result<SignRequest, String> {
        let abi = r#"
            [
                {
                    "inputs": [
                        {"internalType": "address", "name": "_offramper", "type": "address"},
                        {"internalType": "address", "name": "_token", "type": "address"},
                        {"internalType": "uint256", "name": "_amount", "type": "uint256"}
                    ],
                    "name": "uncommitDeposit",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ]
        "#;

        let contract = ethers_core::abi::Contract::load(abi.as_bytes()).unwrap();
        let function = contract.function("uncommitDeposit").unwrap();
        let data = function
            .encode_input(&[
                ethers_core::abi::Token::Address(offramper_address.parse().unwrap()),
                ethers_core::abi::Token::Address(token_address.parse().unwrap()),
                ethers_core::abi::Token::Uint(ethers_core::types::U256::from(amount)),
            ])
            .unwrap();

        Ok(signer::create_sign_request(
            U256::from(0),
            chain_id.into(),
            Some(vault_manager_address.clone()),
            None,
            gas,
            Some(data),
            fee_estimates,
        )
        .await)
    }

    pub async fn release_funds(order_id: &str, gas: Option<String>) -> Result<String, String> {
        let order_state = management::order::get_order_state_by_id(&order_id.to_string())?;
        let order = match order_state {
            OrderState::Locked(locked_order) => locked_order,
            _ => return Err("Order is not in a locked state".to_string()),
        };

        let gas = U256::from_str(gas.unwrap_or("21000".to_string()).as_str())
            .unwrap_or(U256::from(21_000));
        let fee_estimates = fees::get_fee_estimates(9, order.base.chain_id).await;
        ic_cdk::println!(
            "[release_funds] gas = {:?}, max_fee_per_gas = {:?}, max_priority_fee_per_gas = {:?}",
            gas,
            fee_estimates.max_fee_per_gas,
            fee_estimates.max_priority_fee_per_gas
        );
        let vault_manager_address = Self::get_vault_manager_address(order.base.chain_id)?;

        let request: SignRequest;
        if let Some(token_address) = order.base.token_address {
            let token_approved = Self::check_and_approve_token(
                order.base.chain_id,
                token_address.clone(),
                gas,
                fee_estimates.clone(),
            )
            .await?;
            if !token_approved {
                return Err("Failed to approve token".to_string());
            }

            request = Self::sign_request_release_token(
                gas,
                fee_estimates,
                order.base.chain_id,
                order.base.offramper_address,
                order.base.onramper_address.unwrap(), // assuming onramper_address is always set in LockedOrder
                token_address,
                order.base.crypto_amount,
                vault_manager_address,
            )
            .await?;
        } else {
            request = Self::sign_request_release_base_currency(
                gas,
                fee_estimates,
                order.base.chain_id,
                order.base.crypto_amount,
                order.base.offramper_address,
                order.base.onramper_address.unwrap(), // assuming onramper_address is always set in LockedOrder
                vault_manager_address,
            )
            .await?;
        }

        Self::send_signed_transaction(request, order.base.chain_id).await
    }

    async fn sign_request_release_token(
        gas: U256,
        fee_estimates: FeeEstimates,
        chain_id: u64,
        offramper_address: String,
        onramper_address: String,
        token_address: String,
        amount: u64,
        vault_manager_address: String,
    ) -> Result<SignRequest, String> {
        let abi = r#"
            [
                {
                    "inputs": [
                        {"internalType": "address", "name": "_offramper", "type": "address"},
                        {"internalType": "address", "name": "_onramper", "type": "address"},
                        {"internalType": "address", "name": "_token", "type": "address"},
                        {"internalType": "uint256", "name": "_amount", "type": "uint256"}
                    ],
                    "name": "releaseFunds",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ]
        "#;

        let contract = ethers_core::abi::Contract::load(abi.as_bytes()).unwrap();
        let function = contract.function("releaseFunds").unwrap();
        let data = function
            .encode_input(&[
                ethers_core::abi::Token::Address(offramper_address.parse().unwrap()),
                ethers_core::abi::Token::Address(onramper_address.parse().unwrap()),
                ethers_core::abi::Token::Address(token_address.parse().unwrap()),
                ethers_core::abi::Token::Uint(ethers_core::types::U256::from(amount)),
            ])
            .unwrap();

        Ok(signer::create_sign_request(
            U256::from(0),
            chain_id.into(),
            Some(vault_manager_address.clone()),
            None,
            gas,
            Some(data),
            fee_estimates,
        )
        .await)
    }

    async fn sign_request_release_base_currency(
        gas: U256,
        fee_estimates: FeeEstimates,
        chain_id: u64,
        amount: u64,
        offramper_address: String,
        onramper_address: String,
        vault_manager_address: String,
    ) -> Result<SignRequest, String> {
        let abi = r#"
            [
                {
                    "inputs": [
                        {"internalType": "address", "name": "_offramper", "type": "address"},
                        {"internalType": "address", "name": "_onramper", "type": "address"},
                        {"internalType": "uint256", "name": "_amount", "type": "uint256"}
                    ],
                    "name": "releaseBaseCurrency",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ]
        "#;

        let contract = ethers_core::abi::Contract::load(abi.as_bytes()).unwrap();
        let function = contract.function("releaseBaseCurrency").unwrap();
        let data = function
            .encode_input(&[
                ethers_core::abi::Token::Address(offramper_address.parse().unwrap()),
                ethers_core::abi::Token::Address(onramper_address.parse().unwrap()),
                ethers_core::abi::Token::Uint(ethers_core::types::U256::from(amount)),
            ])
            .unwrap();

        Ok(signer::create_sign_request(
            U256::from(0),
            chain_id.into(),
            Some(vault_manager_address.clone()),
            None,
            gas,
            Some(data),
            fee_estimates,
        )
        .await)
    }

    async fn approve_infinite_allowance(
        chain_id: u64,
        token_address: String,
        gas: U256,
        fee_estimates: FeeEstimates,
    ) -> Result<String, String> {
        let abi = r#"
            [
                {
                    "constant": false,
                    "inputs": [
                        {"name": "spender", "type": "address"},
                        {"name": "value", "type": "uint256"}
                    ],
                    "name": "approve",
                    "outputs": [{"name": "success", "type": "bool"}],
                    "type": "function"
                }
            ]
        "#;

        let contract = ethers_core::abi::Contract::load(abi.as_bytes()).unwrap();
        let function = contract.function("approve").unwrap();
        let data = function
            .encode_input(&[
                ethers_core::abi::Token::Address(
                    Self::get_vault_manager_address(chain_id)?.parse().unwrap(),
                ),
                ethers_core::abi::Token::Uint(U256::max_value()),
            ])
            .unwrap();

        let request = signer::create_sign_request(
            U256::from(0),
            chain_id.into(),
            Some(token_address.clone()),
            None,
            gas,
            Some(data),
            fee_estimates,
        )
        .await;

        Self::send_signed_transaction(request, chain_id).await
    }

    async fn send_signed_transaction(
        request: SignRequest,
        chain_id: u64,
    ) -> Result<String, String> {
        let tx = signer::sign_transaction(request).await;
        ic_cdk::println!("Transaction sent: {:?}", tx);

        match transaction::send_raw_transaction(tx.clone(), chain_id).await {
            SendRawTransactionStatus::Ok(transaction_hash) => {
                ic_cdk::println!("[send_signed_transactions] tx_hash = {transaction_hash:?}");
                increment_nonce(chain_id);
                transaction_hash.ok_or("Transaction Hash is empty".to_string())
            }
            SendRawTransactionStatus::NonceTooLow => {
                let msg = "Nonce too low".to_string();
                ic_cdk::println!("{}", msg);
                Err(msg)
            }
            SendRawTransactionStatus::NonceTooHigh => {
                let msg = "Nonce too high".to_string();
                ic_cdk::println!("{}", msg);
                Err(msg)
            }
            SendRawTransactionStatus::InsufficientFunds => {
                let msg = "Insufficient funds".to_string();
                ic_cdk::println!("{}", msg);
                Err(msg)
            }
        }
    }
}
