use std::{
    cell::{Cell, RefCell},
    collections::HashMap,
};

use ic_cdk::api::management_canister::bitcoin::BitcoinNetwork;

use crate::model::types::{
    errors::{BitcoinError, Result},
    runes::RuneMetadata,
};

thread_local! {
    // The bitcoin network to connect to.
    //
    // When developing locally this should be `Regtest`.
    // When deploying to the IC this should be `Testnet`.
    // `Mainnet` is currently unsupported.
    pub static NETWORK: Cell<BitcoinNetwork> = Cell::new(BitcoinNetwork::Testnet);

    // The derivation path to use for the threshold key.
    pub static DERIVATION_PATH: Vec<Vec<u8>> = vec![];

    // The ECDSA key name.
    pub static KEY_NAME: RefCell<String> = RefCell::new(String::from(""));

    // Registered Runes
    pub static RUNES: RefCell<HashMap<String, RuneMetadata>> = RefCell::new(HashMap::new());
}

pub async fn register_runes(rune_list: Vec<RuneMetadata>) -> Result<()> {
    RUNES.with_borrow_mut(|runes| {
        for rune in rune_list {
            runes.insert(rune.symbol.clone(), rune);
        }
    });

    Ok(())
}

pub fn is_rune_supported(symbol: &str) -> Result<()> {
    RUNES.with_borrow(|runes| {
        if !runes.contains_key(symbol) {
            Err(BitcoinError::UnsupportedRune(symbol.to_string()))
        } else {
            Ok(())
        }
    })
}

pub fn get_rune_metadata(symbol: &str) -> Result<RuneMetadata> {
    let runes = RUNES.with(|runes| runes.borrow().clone());
    runes.get(symbol).cloned().ok_or_else(|| {
        BitcoinError::InvalidInput(format!("Rune symbol {} is not supported", symbol))
    })
}
