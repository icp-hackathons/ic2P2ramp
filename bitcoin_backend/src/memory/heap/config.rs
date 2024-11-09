use std::cell::{Cell, RefCell};

use ic_cdk::api::management_canister::bitcoin::BitcoinNetwork;

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
}
