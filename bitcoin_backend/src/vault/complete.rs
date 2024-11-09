use crate::{
    memory::stable::vault::ONRAMPER_VAULTS,
    types::{
        errors::{Result, VaultError},
        Address,
    },
};

pub fn complete_order(onramper: Address, amount: u64) -> Result<()> {
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
