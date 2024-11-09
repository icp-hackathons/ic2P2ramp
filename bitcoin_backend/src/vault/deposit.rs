use crate::{
    memory::stable::vault::OFFRAMPER_VAULTS,
    types::{
        errors::{Result, VaultError},
        Address,
    },
};

pub fn deposit_to_vault(address: Address, amount: u64) -> Result<()> {
    OFFRAMPER_VAULTS.with_borrow_mut(|vaults| {
        let updated_balance = vaults.get(&address).unwrap_or(0) + amount;
        vaults.insert(address, updated_balance);
    });

    Ok(())
}

pub fn cancel_deposit(address: Address, amount: u64) -> Result<()> {
    OFFRAMPER_VAULTS.with_borrow_mut(|vaults| {
        let balance = vaults.get(&address).unwrap_or(0);
        if balance < amount {
            Err(VaultError::InsufficientBalance.into())
        } else {
            let updated_balance = balance - amount;
            vaults.insert(address, updated_balance);
            Ok(())
        }
    })
}
