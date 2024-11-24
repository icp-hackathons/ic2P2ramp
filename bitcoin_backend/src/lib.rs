mod api;
mod memory;
mod model;
mod ordinals;
mod vault;
mod wallet;

use ic_cdk::api::management_canister::bitcoin::BitcoinNetwork;

use api::bitcoin;
use memory::{
    heap::config::{DERIVATION_PATH, KEY_NAME, NETWORK},
    stable::vault::{OFFRAMPER_VAULTS, ONRAMPER_VAULTS},
};
use model::types::{
    errors::{Result, VaultError},
    runes::RuneMetadata,
    wallet::SendRequest,
    Runes,
};
use ordinals::inscription;

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

// ---------
// ADDRESSES
// ---------

/// Returns the P2PKH address of this canister at a specific derivation path.
#[ic_cdk::update]
pub async fn get_p2pkh_address() -> Result<String> {
    let derivation_path = DERIVATION_PATH.with(|d| d.clone());
    let key_name = KEY_NAME.with(|kn| kn.borrow().to_string());
    let network = NETWORK.with(|n| n.get());
    wallet::p2pkh::get_address(network, key_name, derivation_path).await
}

/// Returns the P2TR address of this canister at a specific derivation path.
#[ic_cdk::update]
pub async fn get_p2tr_script_spend_address() -> Result<String> {
    let mut derivation_path = DERIVATION_PATH.with(|d| d.clone());
    derivation_path.push(b"script_spend".to_vec());
    let key_name = KEY_NAME.with(|kn| kn.borrow().to_string());
    let network = NETWORK.with(|n| n.get());

    wallet::p2tr_script_spend::get_address(network, key_name, derivation_path)
        .await
        .map(|addr| addr.to_string())
}

#[ic_cdk::update]
pub async fn get_p2tr_raw_key_spend_address() -> Result<String> {
    let mut derivation_path = DERIVATION_PATH.with(|d| d.clone());
    derivation_path.push(b"key_spend".to_vec());
    let key_name = KEY_NAME.with(|kn| kn.borrow().to_string());
    let network = NETWORK.with(|n| n.get());

    wallet::p2tr_raw_key_spend::get_address(network, key_name, derivation_path)
        .await
        .map(|addr| addr.to_string())
}

// -------
// CONFIGS
// -------

#[ic_cdk::update]
async fn register_runes(runes: Vec<RuneMetadata>) -> Result<()> {
    memory::heap::config::register_runes(runes).await
}

#[ic_cdk::query]
pub async fn get_serialized_rune_metadata(symbol: String) -> Result<(RuneMetadata, String)> {
    let rune_metadata = memory::heap::config::get_rune_metadata(&symbol)?; // Fetch RuneMetadata
    let serialized_metadata = rune_metadata.to_string(); // Serialize the metadata
    Ok((rune_metadata, serialized_metadata))
}

#[ic_cdk::update]
pub async fn validate_rune_metadata(rune_data: String) -> Result<()> {
    let rune_metadata = RuneMetadata::from_string(&rune_data)?;
    memory::heap::config::is_rune_supported(&rune_metadata.symbol)?;

    Ok(())
}

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
pub fn deposit_to_address_vault(
    offramper: String,
    amount: u64,
    runes: Option<Runes>,
) -> Result<()> {
    vault::deposit::deposit_to_vault(offramper, amount, runes)
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
pub fn unlock_funds(
    offramper: String,
    onramper: String,
    amount: u64,
    runes: Option<Runes>,
) -> Result<()> {
    vault::lock::unlock_funds(offramper, onramper, amount, runes)
}

#[ic_cdk::update]
pub async fn complete_order_and_send(
    onramper_address: String,
    amount: u64,
    rune: Option<Runes>,
    taproot: bool,
) -> Result<String> {
    // Step 1: Retrieve network configuration details
    let derivation_path = DERIVATION_PATH.with(|d| d.clone());
    let network = NETWORK.with(|n| n.get());
    let key_name = KEY_NAME.with(|kn| kn.borrow().to_string());

    // Step 2: Call the wallet function to send Bitcoin or Runes
    let tx_id = wallet::send::send_btc_or_rune(
        network,
        derivation_path,
        key_name,
        onramper_address.clone(),
        amount,
        rune.clone(),
        taproot,
    )
    .await?;

    // Step 3: Clear the locked funds in the vault
    vault::complete::complete_order(onramper_address, amount, rune)?;

    Ok(tx_id.to_string())
}

#[ic_cdk::update]
pub async fn send_ordinals_inscription(
    content: String,
    content_type: String,
    metadata: Option<String>,
    dst_address: String,
    amount: u64,
) -> Result<String> {
    let network = NETWORK.with(|n| n.get());
    let key_name = KEY_NAME.with(|k| k.borrow().to_string());
    let derivation_path = DERIVATION_PATH.with(|d| d.clone());

    let inscription = format!(
        "{}\n\n{}\n{}",
        content,
        content_type,
        metadata.unwrap_or_default()
    )
    .into_bytes();
    let tx_id = inscription::send_inscription(
        network,
        key_name,
        derivation_path,
        inscription,
        dst_address,
        amount,
    )
    .await?;

    Ok(tx_id.to_string())
}

ic_cdk::export_candid!();
