mod api;
mod memory;
mod types;
mod vault;
mod wallet;

use ic_cdk::api::management_canister::bitcoin::BitcoinNetwork;

use api::bitcoin;
use memory::{
    heap::config::{DERIVATION_PATH, KEY_NAME, NETWORK},
    stable::vault::{OFFRAMPER_VAULTS, ONRAMPER_VAULTS},
};
use types::{
    errors::{Result, VaultError},
    wallet::SendRequest,
};

#[ic_cdk::init]
pub fn init(network: BitcoinNetwork) {
    NETWORK.with(|n| n.set(network));

    KEY_NAME.with(|key_name| {
        key_name.replace(String::from(match network {
            BitcoinNetwork::Regtest => "dfx_test_key",
            BitcoinNetwork::Mainnet | BitcoinNetwork::Testnet => "test_key_1",
        }))
    });
}

// ----
// TEST
// ----

/// Returns the balance of the given bitcoin address.
#[ic_cdk::update]
pub async fn get_balance(address: String) -> Result<u64> {
    let network = NETWORK.with(|n| n.get());
    bitcoin::get_balance(network, address).await
}

/// Returns the P2PKH address of this canister at a specific derivation path.
#[ic_cdk::update]
pub async fn get_p2pkh_address() -> String {
    let derivation_path = DERIVATION_PATH.with(|d| d.clone());
    let key_name = KEY_NAME.with(|kn| kn.borrow().to_string());
    let network = NETWORK.with(|n| n.get());
    wallet::p2pkh::get_address(network, key_name, derivation_path).await
}

/// Sends the given amount of bitcoin from this canister's p2pkh address to the given address.
/// Returns the transaction ID.
#[ic_cdk::update]
pub async fn send_from_p2pkh(request: SendRequest) -> Result<String> {
    let derivation_path = DERIVATION_PATH.with(|d| d.clone());
    let network = NETWORK.with(|n| n.get());
    let key_name = KEY_NAME.with(|kn| kn.borrow().to_string());
    let tx_id = wallet::p2pkh::send(
        network,
        derivation_path,
        key_name,
        request.destination_address,
        request.amount_in_satoshi,
    )
    .await?;

    Ok(tx_id.to_string())
}

// --------
// END TEST
// --------

// -----
// VAULT
// -----

#[ic_cdk::query]
pub fn get_offramper_deposits(offramper: String) -> Result<u64> {
    OFFRAMPER_VAULTS
        .with_borrow(|vaults| vaults.get(&offramper))
        .ok_or_else(|| VaultError::AddressVaultNotFound.into())
}

#[ic_cdk::query]
pub fn get_onramper_deposits(onramper: String) -> Result<u64> {
    ONRAMPER_VAULTS
        .with_borrow(|vaults| vaults.get(&onramper))
        .ok_or_else(|| VaultError::AddressVaultNotFound.into())
}

#[ic_cdk::update]
pub fn deposit_to_address_vault(offramper: String, amount: u64) -> Result<()> {
    vault::deposit::deposit_to_vault(offramper, amount)
}

#[ic_cdk::update]
pub fn cancel_deposit(offramper: String, amount: u64) -> Result<()> {
    vault::deposit::cancel_deposit(offramper, amount)
}

#[ic_cdk::update]
pub fn lock_funds(offramper: String, onramper: String, amount: u64) -> Result<()> {
    vault::lock::lock_funds(offramper, onramper, amount)
}

#[ic_cdk::update]
pub fn unlock_funds(offramper: String, onramper: String, amount: u64) -> Result<()> {
    vault::lock::unlock_funds(offramper, onramper, amount)
}

#[ic_cdk::update]
pub async fn complete_order_and_send(onramper_address: String, amount: u64) -> Result<String> {
    // Step 1: Retrieve network configuration details
    let derivation_path = DERIVATION_PATH.with(|d| d.clone());
    let network = NETWORK.with(|n| n.get());
    let key_name = KEY_NAME.with(|kn| kn.borrow().to_string());

    // Step 2: Call the wallet function to send Bitcoin
    let tx_id = wallet::p2pkh::send(
        network,
        derivation_path,
        key_name,
        onramper_address.clone(),
        amount,
    )
    .await?;

    // Step 3: Clear the locked funds in the vault
    vault::complete::complete_order(onramper_address, amount)?;

    Ok(tx_id.to_string())
}

ic_cdk::export_candid!();
