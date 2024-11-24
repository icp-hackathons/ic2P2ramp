use bitcoin::{
    consensus::serialize,
    hashes::Hash,
    key::Secp256k1,
    secp256k1::schnorr::Signature,
    sighash::SighashCache,
    taproot::{ControlBlock, LeafVersion, TaprootBuilder, TaprootSpendInfo},
    Address, AddressType, ScriptBuf, Sequence, TapLeafHash, TapSighashType, Transaction, TxOut,
    Txid, Witness, XOnlyPublicKey,
};
use ic_cdk::api::management_canister::bitcoin::{
    BitcoinNetwork, MillisatoshiPerByte, Satoshi, Utxo,
};
use std::str::FromStr;

use crate::{
    api::schnorr::schnorr_public_key,
    model::types::errors::{BitcoinError, Result},
};

use super::helpers::transform_network;

/// Returns the P2TR address for this canister at the given derivation path.
pub async fn get_address(
    network: BitcoinNetwork,
    key_name: String,
    derivation_path: Vec<Vec<u8>>,
) -> Result<Address> {
    let public_key = schnorr_public_key(key_name.clone(), derivation_path.clone()).await?;

    let taproot_spend_info = compute_taproot_spend_info(&public_key)?;
    Ok(Address::p2tr_tweaked(
        taproot_spend_info.output_key(),
        transform_network(network),
    ))
}

/// Sends BTC or Runes using a Taproot script-spend address.
pub async fn send_script_spend(
    network: BitcoinNetwork,
    key_name: String,
    derivation_path: Vec<Vec<u8>>,
    script: ScriptBuf,
    dst_address: String,
    amount: Satoshi,
) -> Result<Txid> {
    // Step 1: Generate Taproot address.
    let public_key =
        crate::api::schnorr::schnorr_public_key(key_name.clone(), derivation_path.clone()).await?;
    let (address, taproot_spend_info) =
        generate_taproot_address(network, &public_key, script.clone())?;

    // Get the control block from the spend info
    let script_map = taproot_spend_info.script_map();
    let (leaf_script, leaf_version) = script_map
        .keys()
        .next()
        .ok_or_else(|| BitcoinError::InternalError("No script found in script map".to_string()))?;
    let control_block = taproot_spend_info
        .control_block(&(leaf_script.clone(), *leaf_version))
        .ok_or_else(|| BitcoinError::InternalError("Missing ControlBlock".to_string()))?;

    // Step 2: Fetch UTXOs for the Taproot address.
    let own_utxos = crate::api::bitcoin::get_utxos(network, address.to_string()).await?;

    // Step 3: Construct the transaction.
    let dst_address = Address::from_str(&dst_address)
        .map_err(BitcoinError::from)?
        .require_network(crate::wallet::transform_network(network))
        .map_err(|e| BitcoinError::UnsupportedAddressType(e.to_string()))?;
    let fee_per_byte = crate::wallet::get_fee_per_byte(network).await?;
    let (transaction, prevouts) = build_p2tr_transaction(
        &address,
        &control_block,
        &script,
        &own_utxos,
        &dst_address,
        amount,
        fee_per_byte,
    )
    .await?;

    // Step 4: Sign the transaction.
    let signed_transaction = schnorr_sign_transaction(
        transaction,
        &prevouts,
        &address,
        &control_block,
        &script,
        key_name,
        derivation_path,
        crate::api::schnorr::sign_with_schnorr,
    )
    .await?;

    // Step 5: Broadcast the transaction.
    let signed_transaction_bytes = serialize(&signed_transaction);
    crate::api::bitcoin::send_transaction(network, signed_transaction_bytes).await?;

    Ok(signed_transaction.compute_txid())
}

/// Sends BTC or Runes using a Taproot script-spend address.
// pub async fn send_script_spend(
//     network: BitcoinNetwork,
//     key_name: String,
//     derivation_path: Vec<Vec<u8>>,
//     script: ScriptBuf,
//     dst_address: String,
//     amount: Satoshi,
// ) -> Result<Txid> {
//     // Step 1: Generate Taproot address.
//     let public_key =
//         crate::api::schnorr::schnorr_public_key(key_name.clone(), derivation_path.clone()).await?;
//     let (address, taproot_spend_info, control_block) =
//         generate_taproot_address(network, &public_key, script.clone())?;

//     // Step 2: Fetch UTXOs for the Taproot address.
//     let own_utxos = crate::api::bitcoin::get_utxos(network, address.to_string()).await?;

//     // Step 3: Construct the transaction.
//     let dst_address = Address::from_str(&dst_address)
//         .map_err(BitcoinError::from)?
//         .require_network(crate::wallet::transform_network(network))
//         .map_err(|e| BitcoinError::UnsupportedAddressType(e.to_string()))?;
//     let fee_per_byte = crate::wallet::get_fee_per_byte(network).await?;
//     let (transaction, prevouts) = build_p2tr_transaction(
//         &address,
//         &control_block,
//         &script,
//         &own_utxos,
//         &dst_address,
//         amount,
//         fee_per_byte,
//     )
//     .await?;

//     // Step 4: Sign the transaction.
//     let signed_transaction = schnorr_sign_transaction(
//         transaction,
//         &prevouts,
//         &address,
//         &control_block,
//         &script,
//         key_name,
//         derivation_path,
//         crate::api::schnorr::sign_with_schnorr,
//     )
//     .await?;

//     // Step 5: Broadcast the transaction.
//     let signed_transaction_bytes = serialize(&signed_transaction);
//     crate::api::bitcoin::send_transaction(network, signed_transaction_bytes).await?;

//     Ok(signed_transaction.compute_txid())
// }

/// Builds a P2TR transaction to send the given amount to the destination.
pub async fn build_p2tr_transaction(
    own_address: &Address,
    control_block: &ControlBlock,
    script: &ScriptBuf,
    utxos: &[Utxo],
    dst_address: &Address,
    amount: Satoshi,
    fee_per_byte: MillisatoshiPerByte,
) -> Result<(Transaction, Vec<TxOut>)> {
    let mut total_fee = 0;

    loop {
        let (transaction, prevouts) = super::helpers::build_transaction_with_fee(
            utxos,
            own_address,
            dst_address,
            amount,
            total_fee,
        )?;

        let signed_transaction = schnorr_sign_transaction(
            transaction.clone(),
            prevouts.as_slice(),
            own_address,
            control_block,
            script,
            String::from("mock_key"),
            vec![], // mock derivation path
            |_, _, _| async { Ok(vec![0; 64]) },
        )
        .await?;

        let tx_vsize = signed_transaction.vsize() as u64;
        let estimated_fee = (tx_vsize * fee_per_byte) / 1000;

        if estimated_fee == total_fee {
            return Ok((transaction, prevouts));
        } else {
            total_fee = estimated_fee;
        }
    }
}

/// Generates a Taproot address and spend info for an inscription.
///
/// # Arguments
/// - `network`: The Bitcoin network.
/// - `public_key`: The Schnorr public key.
/// - `inscription`: The Ordinals data to embed.
///
/// # Returns
/// - `(Address, TaprootSpendInfo)`: The generated Taproot address and spend info.
// fn generate_taproot_address(
//     network: BitcoinNetwork,
//     public_key: &[u8],
//     script: ScriptBuf,
// ) -> Result<(Address, TaprootSpendInfo, ControlBlock)> {
//     let secp_engine = Secp256k1::new();
//     let x_only_public_key = XOnlyPublicKey::from_slice(public_key).map_err(BitcoinError::from)?;

//     let taproot_spend_info = TaprootBuilder::new()
//         .add_leaf(0, script.clone())
//         .map_err(|e| BitcoinError::InternalError(format!("Taproot builder error: {:?}", e)))?
//         .finalize(&secp_engine, x_only_public_key)
//         .map_err(|_| BitcoinError::TaprootNotFinalizable)?;

//     let control_block = taproot_spend_info
//         .control_block(&(script.clone(), LeafVersion::TapScript))
//         .ok_or_else(|| BitcoinError::InternalError("Control block is missing".to_string()))?;

//     let address = Address::p2tr_tweaked(
//         taproot_spend_info.output_key(),
//         crate::wallet::transform_network(network),
//     );

//     Ok((address, taproot_spend_info, control_block))
// }

fn generate_taproot_address(
    network: BitcoinNetwork,
    public_key: &[u8],
    script: ScriptBuf,
) -> Result<(Address, TaprootSpendInfo)> {
    let secp_engine = Secp256k1::new();
    let x_only_public_key = XOnlyPublicKey::from_slice(public_key)
        .map_err(|_| BitcoinError::CryptoError("Malformed public key".to_string()))?;

    let taproot_spend_info = TaprootBuilder::new()
        .add_leaf(0, script.clone())
        .map_err(|e| BitcoinError::InternalError(format!("Taproot builder error: {:?}", e)))?
        .finalize(&secp_engine, x_only_public_key)
        .map_err(|_| BitcoinError::TaprootNotFinalizable)?;

    let address = Address::p2tr_tweaked(
        taproot_spend_info.output_key(),
        crate::wallet::transform_network(network),
    );

    Ok((address, taproot_spend_info))
}

// Sign a P2TR script spend transaction.
//
// IMPORTANT: This method is for demonstration purposes only and it only
// supports signing transactions if:
//
// 1. All the inputs are referencing outpoints that are owned by `own_address`.
// 2. `own_address` is a P2TR script path spend address.
pub async fn schnorr_sign_transaction<SignFun, Fut>(
    mut transaction: Transaction,
    prevouts: &[TxOut],
    own_address: &Address,
    control_block: &ControlBlock,
    script: &ScriptBuf,
    key_name: String,
    derivation_path: Vec<Vec<u8>>,
    signer: SignFun,
) -> Result<Transaction>
where
    SignFun: Fn(String, Vec<Vec<u8>>, Vec<u8>) -> Fut,
    Fut: std::future::Future<Output = Result<Vec<u8>>>,
{
    assert_eq!(own_address.address_type(), Some(AddressType::P2tr),);

    for input in transaction.input.iter_mut() {
        input.script_sig = ScriptBuf::default();
        input.witness = Witness::default();
        input.sequence = Sequence::ENABLE_RBF_NO_LOCKTIME;
    }

    let num_inputs = transaction.input.len();

    for i in 0..num_inputs {
        let mut sighasher = SighashCache::new(&mut transaction);

        let leaf_hash = TapLeafHash::from_script(&script, LeafVersion::TapScript);
        let sighash = sighasher
            .taproot_script_spend_signature_hash(
                i,
                &bitcoin::sighash::Prevouts::All(prevouts),
                leaf_hash,
                TapSighashType::Default,
            )
            .map_err(BitcoinError::from)?;

        let raw_signature = signer(
            key_name.clone(),
            derivation_path.clone(),
            sighash.as_byte_array().to_vec(),
        )
        .await?;

        let signature = bitcoin::taproot::Signature {
            signature: Signature::from_slice(&raw_signature).map_err(BitcoinError::from)?,
            sighash_type: TapSighashType::Default,
        };

        let witness = sighasher.witness_mut(i).unwrap();
        witness.push(signature.to_vec());
        witness.push(&script.to_bytes());
        witness.push(control_block.serialize());
    }

    Ok(transaction)
}

/// Computes Taproot spend info for the given public key.
fn compute_taproot_spend_info(public_key: &[u8]) -> Result<TaprootSpendInfo> {
    let x_only_public_key = XOnlyPublicKey::from_slice(public_key).map_err(BitcoinError::from)?;
    let spend_script = bitcoin::blockdata::script::Builder::new()
        .push_x_only_key(&x_only_public_key.clone())
        .push_opcode(bitcoin::blockdata::opcodes::all::OP_CHECKSIG)
        .into_script();

    let secp_engine = Secp256k1::new();
    TaprootBuilder::new()
        .add_leaf(0, spend_script)
        .map_err(BitcoinError::from)?
        .finalize(&secp_engine, x_only_public_key)
        .map_err(BitcoinError::from)
}
