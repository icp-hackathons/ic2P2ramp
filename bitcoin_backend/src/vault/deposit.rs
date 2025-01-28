use crate::{
    memory::stable::vault::{OFFRAMPER_VAULTS, RUNES_VAULTS},
    model::types::{
        errors::{Result, VaultError},
        Address, Runes,
    },
};

pub fn deposit_to_vault(address: Address, amount: u64, rune: Option<Runes>) -> Result<()> {
    if let Some(rune_data) = rune {
        RUNES_VAULTS.with_borrow_mut(|vaults| {
            let rune_balance = vaults
                .get(&(address.clone(), rune_data.symbol.clone()))
                .unwrap_or(0);
            let updated_balance = rune_balance + amount;
            vaults.insert((address, rune_data.symbol), updated_balance);
        });
    } else {
        OFFRAMPER_VAULTS.with_borrow_mut(|vaults| {
            let updated_balance = vaults.get(&address).unwrap_or(0) + amount;
            vaults.insert(address, updated_balance);
        });
    }

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
