use bitcoin::{address::ParseError, amount::ParseAmountError};
use candid::CandidType;
use ic_cdk::api::call::RejectionCode;
use thiserror::Error;

pub type Result<T> = std::result::Result<T, BitcoinError>;

#[derive(Error, Debug, Clone, CandidType)]
pub enum BitcoinError {
    #[error(transparent)]
    VaultError(#[from] VaultError),

    #[error("Rejection Code: {0:?}, Error: {1}")]
    CallRejectionError(RejectionCode, String),

    #[error("Address parsing error: {0}")]
    ParsingError(String),

    #[error("Parse amount error: {0}")]
    ParseAmountError(String),

    #[error("Internal Error: {0}")]
    InternalError(String),

    #[error(transparent)]
    InsufficientBalance(#[from] InsufficientBalanceError),

    #[error("Unsupported Address Type: {0}")]
    UnsupportedAddressType(String),
}

#[derive(Error, Debug, Clone, CandidType)]
pub enum VaultError {
    #[error("Address Vault not found")]
    AddressVaultNotFound,

    #[error("Insufficient Balance to Lock")]
    InsufficientBalance,

    #[error("Insufficient Locked Balance")]
    InsufficientLockedBalance,
}

impl From<ParseError> for BitcoinError {
    fn from(error: ParseError) -> Self {
        // Convert the `ParseError` to a string to retain compatibility with `CandidType`
        BitcoinError::ParsingError(error.to_string())
    }
}

impl From<ParseAmountError> for BitcoinError {
    fn from(error: ParseAmountError) -> Self {
        BitcoinError::ParsingError(error.to_string())
    }
}

#[derive(Debug, Error, Clone, CandidType)]
#[error("Insufficient balance: {current_balance} satoshi, trying to transfer {transfer_amount} satoshi with fee {fee}")]
pub struct InsufficientBalanceError {
    pub current_balance: u64,
    pub transfer_amount: u64,
    pub fee: u64,
}
