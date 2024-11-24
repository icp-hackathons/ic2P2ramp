use bitcoin::{
    consensus::serialize,
    hashes::Hash,
    script::{Builder, PushBytesBuf},
    sighash::SighashCache,
    Address, AddressType, Amount, EcdsaSighashType, PublicKey, Script, SegwitV0Sighash,
    Transaction, Txid,
};
use ic_cdk::api::management_canister::bitcoin::{
    BitcoinNetwork, MillisatoshiPerByte, Satoshi, Utxo,
};
use std::str::FromStr;

use crate::{
    api,
    model::types::errors::{BitcoinError, Result},
};

use super::helpers::transform_network;

const ECDSA_SIG_HASH_TYPE: EcdsaSighashType = EcdsaSighashType::All;

/// Returns the P2PKH address of this canister at the given derivation path.
pub async fn get_address(
    network: BitcoinNetwork,
    key_name: String,
    derivation_path: Vec<Vec<u8>>,
) -> Result<String> {
    let public_key = api::ecdsa::get_ecdsa_public_key(key_name, derivation_path).await;
    public_key_to_p2pkh_address(network, &public_key)
}

// Converts a public key to a P2PKH address.
fn public_key_to_p2pkh_address(network: BitcoinNetwork, public_key: &[u8]) -> Result<String> {
    Ok(Address::p2pkh(
        &PublicKey::from_slice(public_key).map_err(BitcoinError::from)?,
        transform_network(network),
    )
    .to_string())
}

/// Sends a transaction to the network that transfers the given amount to the
/// given destination, where the source of the funds is the canister itself
/// at the given derivation path.
pub async fn send(
    network: BitcoinNetwork,
    derivation_path: Vec<Vec<u8>>,
    key_name: String,
    dst_address: String,
    amount: Satoshi,
) -> Result<Txid> {
    let fee_per_byte = super::helpers::get_fee_per_byte(network).await?;

    // Fetch our public key, P2PKH address, and UTXOs.
    let own_public_key =
        api::ecdsa::get_ecdsa_public_key(key_name.clone(), derivation_path.clone()).await;
    let own_address = public_key_to_p2pkh_address(network, &own_public_key)?;

    ic_cdk::println!("Fetching UTXOs...");
    // Get utxos up to necessary amount HERE?
    let own_utxos = api::bitcoin::get_utxos(network, own_address.clone()).await?;

    let own_address = Address::from_str(&own_address)
        .map_err(BitcoinError::from)?
        .require_network(super::helpers::transform_network(network))
        .map_err(BitcoinError::from)?;
    let dst_address = Address::from_str(&dst_address)
        .map_err(BitcoinError::from)?
        .require_network(super::helpers::transform_network(network))
        .map_err(BitcoinError::from)?;

    // Build the transaction that sends `amount` to the destination address.
    let transaction = build_p2pkh_spend_tx(
        &own_public_key,
        &own_address,
        &own_utxos,
        &dst_address,
        amount,
        fee_per_byte,
    )
    .await?;

    let tx_bytes = serialize(&transaction);
    ic_cdk::println!("Transaction to sign: {}", hex::encode(tx_bytes));

    // Sign the transaction.
    let signed_transaction = ecdsa_sign_transaction(
        &own_public_key,
        &own_address,
        transaction,
        &own_utxos,
        key_name,
        derivation_path,
        api::ecdsa::get_ecdsa_signature,
    )
    .await?;

    let signed_transaction_bytes = serialize(&signed_transaction);
    ic_cdk::println!(
        "Signed transaction: {}",
        hex::encode(&signed_transaction_bytes)
    );

    ic_cdk::println!("Sending transaction...");
    api::bitcoin::send_transaction(network, signed_transaction_bytes).await?;
    ic_cdk::println!("Done");

    Ok(signed_transaction.compute_txid())
}

// Builds a transaction to send the given `amount` of satoshis to the
// destination address.
async fn build_p2pkh_spend_tx(
    own_public_key: &[u8],
    own_address: &Address,
    own_utxos: &[Utxo],
    dst_address: &Address,
    amount: Satoshi,
    fee_per_vbyte: MillisatoshiPerByte,
) -> Result<Transaction> {
    // We have a chicken-and-egg problem where we need to know the length
    // of the transaction in order to compute its proper fee, but we need
    // to know the proper fee in order to figure out the inputs needed for
    // the transaction.
    //
    // We solve this problem iteratively. We start with a fee of zero, build
    // and sign a transaction, see what its size is, and then update the fee,
    // rebuild the transaction, until the fee is set to the correct amount.
    ic_cdk::println!("Building transaction...");
    let mut total_fee = 0;
    loop {
        let (transaction, _prevouts) = super::helpers::build_transaction_with_fee(
            own_utxos,
            own_address,
            dst_address,
            amount,
            total_fee,
        )?;

        // Sign the transaction. In this case, we only care about the size
        // of the signed transaction, so we use a mock signer here for efficiency.
        let signed_transaction = ecdsa_sign_transaction(
            own_public_key,
            own_address,
            transaction.clone(),
            own_utxos,
            String::from(""), // mock key name
            vec![],           // mock derivation path
            super::helpers::mock_signer,
        )
        .await?;

        let tx_vsize = signed_transaction.vsize() as u64;
        if (tx_vsize * fee_per_vbyte) / 1000 == total_fee {
            ic_cdk::println!("Transaction built with fee {}.", total_fee);
            return Ok(transaction);
        } else {
            total_fee = (tx_vsize * fee_per_vbyte) / 1000;
        }
    }
}

// Sign a bitcoin transaction.
//
// IMPORTANT: This method is for demonstration purposes only and it only
// supports signing transactions if all the inputs are referencing outpoints
// that are owned by `own_address`.
// Sign a bitcoin transaction.
async fn ecdsa_sign_transaction<SignFun, Fut>(
    own_public_key: &[u8],
    own_address: &Address,
    mut transaction: Transaction,
    own_utxos: &[Utxo],
    key_name: String,
    derivation_path: Vec<Vec<u8>>,
    signer: SignFun,
) -> Result<Transaction>
where
    SignFun: Fn(String, Vec<Vec<u8>>, Vec<u8>) -> Fut,
    Fut: std::future::Future<Output = Vec<u8>>,
{
    let txclone = transaction.clone();
    for (index, input) in transaction.input.iter_mut().enumerate() {
        let sighash_bytes = match own_address.address_type() {
            Some(AddressType::P2pkh) => Ok(SighashCache::new(&txclone)
                .legacy_signature_hash(
                    index,
                    &own_address.script_pubkey(),
                    ECDSA_SIG_HASH_TYPE.to_u32(),
                )
                .map_err(|e| BitcoinError::InternalError(format!("Legacy sighash error: {:?}", e)))?
                .as_byte_array()
                .to_vec()),
            Some(AddressType::P2wpkh) => {
                let amount_sat = own_utxos.get(index).map(|utxo| utxo.value).ok_or_else(|| {
                    BitcoinError::InternalError(format!("Missing UTXO for input index {}", index))
                })?;
                let amount = Amount::from_sat(amount_sat);

                let mut enc = SegwitV0Sighash::engine();
                SighashCache::new(&txclone)
                    .segwit_v0_encode_signing_data_to(
                        &mut enc,
                        index,
                        &own_address.script_pubkey(),
                        amount,
                        ECDSA_SIG_HASH_TYPE,
                    )
                    .map_err(|e| {
                        BitcoinError::InternalError(format!("Segwit sighash error: {:?}", e))
                    })?;

                Ok(SegwitV0Sighash::from_engine(enc).as_byte_array().to_vec())
            }
            Some(addr) => Err(BitcoinError::UnsupportedAddressType(addr.to_string())),
            None => Err(BitcoinError::InternalError(
                "Address Type is None".to_string(),
            )),
        }?;

        let signature = signer(key_name.clone(), derivation_path.clone(), sighash_bytes).await;

        // Convert signature to DER.
        let der_signature = sec1_to_der(signature);
        let mut sig_with_hashtype: Vec<u8> = der_signature;
        sig_with_hashtype.push(ECDSA_SIG_HASH_TYPE.to_u32() as u8);

        // Apply signature to the correct field based on address type
        match own_address.address_type() {
            Some(AddressType::P2pkh) => {
                let sig_with_hashtype_push_bytes =
                    PushBytesBuf::try_from(sig_with_hashtype).unwrap();
                let own_public_key_push_bytes =
                    PushBytesBuf::try_from(own_public_key.to_vec()).unwrap();
                input.script_sig = Builder::new()
                    .push_slice(&sig_with_hashtype_push_bytes)
                    .push_slice(own_public_key_push_bytes)
                    .into_script();
                input.witness.clear();
            }
            Some(AddressType::P2wpkh) => {
                input.witness.push(sig_with_hashtype);
                input.witness.push(own_public_key.to_vec());
                input.script_sig = Script::new().into();
            }
            _ => {}
        }
    }

    Ok(transaction)
}

// Converts a SEC1 ECDSA signature to the DER format.
fn sec1_to_der(sec1_signature: Vec<u8>) -> Vec<u8> {
    let r: Vec<u8> = if sec1_signature[0] & 0x80 != 0 {
        // r is negative. Prepend a zero byte.
        let mut tmp = vec![0x00];
        tmp.extend(sec1_signature[..32].to_vec());
        tmp
    } else {
        // r is positive.
        sec1_signature[..32].to_vec()
    };

    let s: Vec<u8> = if sec1_signature[32] & 0x80 != 0 {
        // s is negative. Prepend a zero byte.
        let mut tmp = vec![0x00];
        tmp.extend(sec1_signature[32..].to_vec());
        tmp
    } else {
        // s is positive.
        sec1_signature[32..].to_vec()
    };

    // Convert signature to DER.
    vec![
        vec![0x30, 4 + r.len() as u8 + s.len() as u8, 0x02, r.len() as u8],
        r,
        vec![0x02, s.len() as u8],
        s,
    ]
    .into_iter()
    .flatten()
    .collect()
}
