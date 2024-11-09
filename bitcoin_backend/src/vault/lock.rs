use crate::{
    memory::stable::vault::ONRAMPER_VAULTS,
    types::{errors::Result, Address},
};

pub fn lock_funds(offramper: Address, onramper: Address, amount: u64) -> Result<()> {
    super::deposit::cancel_deposit(offramper, amount)?;

    ONRAMPER_VAULTS.with_borrow_mut(|vaults| {
        let updated_balance = vaults.get(&onramper).unwrap_or(0) + amount;
        vaults.insert(onramper, updated_balance);
    });

    Ok(())
}

pub fn unlock_funds(offramper: Address, onramper: Address, amount: u64) -> Result<()> {
    super::complete::complete_order(onramper, amount)?;

    super::deposit::deposit_to_vault(offramper, amount)?;

    Ok(())
}
