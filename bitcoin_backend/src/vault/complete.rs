use crate::{
    memory::stable::vault::{ONRAMPER_VAULTS, RUNES_VAULTS},
    model::types::{
        errors::{Result, VaultError},
        Address, Runes,
    },
};

pub fn complete_order(onramper: Address, amount: u64, rune: Option<Runes>) -> Result<()> {
    if let Some(rune_data) = rune {
        RUNES_VAULTS.with_borrow_mut(|vaults| {
            let balance = vaults
                .get(&(onramper.clone(), rune_data.symbol.clone()))
                .unwrap_or(0);
            if balance < amount {
                return Err(VaultError::InsufficientLockedBalance.into());
            }
            let updated_balance = balance - amount;
            vaults.insert((onramper, rune_data.symbol), updated_balance);
            Ok(())
        })
    } else {
        ONRAMPER_VAULTS.with_borrow_mut(|vaults| {
            let balance = vaults.get(&onramper).unwrap_or(0);
            if balance < amount {
                Err(VaultError::InsufficientLockedBalance.into())
            } else {
                let updated_balance = balance - amount;
                vaults.insert(onramper, updated_balance);
                Ok(())
            }
        })
    }
}
