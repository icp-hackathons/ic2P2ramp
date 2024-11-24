use candid::{CandidType, Deserialize};

use super::errors::{BitcoinError, Result};

#[derive(CandidType, Deserialize, Clone, Debug, PartialEq, Eq, Hash)]
pub struct RuneMetadata {
    pub symbol: String,
    pub divisibility: u8,
    pub cap: u128,
    pub premine: u128,
}

impl RuneMetadata {
    /// Serialize `RuneMetadata` to a string.
    pub fn to_string(&self) -> String {
        format!(
            "{}:{}:{}:{}",
            self.symbol, self.divisibility, self.cap, self.premine
        )
    }

    /// Deserialize a string into `RuneMetadata`.
    pub fn from_string(data: &str) -> Result<Self> {
        let parts: Vec<&str> = data.split(':').collect();
        if parts.len() != 4 {
            return Err(BitcoinError::InvalidInput(
                "Invalid rune metadata".to_string(),
            ));
        }

        Ok(Self {
            symbol: parts[0].to_string(),
            divisibility: parts[1]
                .parse::<u8>()
                .map_err(|_| BitcoinError::InvalidInput("Invalid divisibility".to_string()))?,
            cap: parts[2]
                .parse::<u128>()
                .map_err(|_| BitcoinError::InvalidInput("Invalid cap".to_string()))?,
            premine: parts[3]
                .parse::<u128>()
                .map_err(|_| BitcoinError::InvalidInput("Invalid premine".to_string()))?,
        })
    }
}
