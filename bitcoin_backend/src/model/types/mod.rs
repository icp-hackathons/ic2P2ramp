use candid::{CandidType, Deserialize};

pub mod errors;
pub mod runes;
pub mod schnorr;
pub mod wallet;

pub type Address = String;

#[derive(CandidType, Deserialize, Clone)]
pub struct Runes {
    pub symbol: String, // Symbol of the Rune (e.g., "RUNE123")
    pub decimals: u8,   // Number of decimals for divisibility
}
