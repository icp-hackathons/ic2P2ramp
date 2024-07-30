use base64::{engine::general_purpose, Engine as _};
use rand::{rngs::StdRng, RngCore, SeedableRng};
use rsa::{pkcs8::DecodePrivateKey, PaddingScheme, RsaPrivateKey};
use serde::Serialize;
use sha2::{Digest, Sha256};

use crate::errors::Result;
use crate::model::errors::RampError;
use crate::model::state::read_state;

#[derive(Serialize)]
pub struct JWSHeader {
    alg: String,
    kid: String,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    crit: Vec<String>,
    #[serde(skip_serializing_if = "String::is_empty")]
    #[serde(rename = "http://openbanking.org.uk/tan")]
    tan: String,
}

impl JWSHeader {
    pub fn new(kid: &str, tan: &str) -> Self {
        JWSHeader {
            alg: "PS256".to_string(),
            kid: kid.to_string(),
            crit: vec!["http://openbanking.org.uk/tan".to_string()],
            tan: tan.to_string(),
        }
    }
    pub fn new_simple(kid: &str) -> Self {
        JWSHeader {
            alg: "PS256".to_string(),
            kid: kid.to_string(),
            crit: vec![],
            tan: "".to_string(),
        }
    }
}

async fn get_random_bytes() -> Result<[u8; 32]> {
    let management_canister = candid::Principal::management_canister();
    let rnd_buffer: (Vec<u8>,) = match ic_cdk::call(management_canister, "raw_rand", ()).await {
        Ok(result) => result,
        Err((code, msg)) => {
            ic_cdk::println!("Error invoking raw_rand: {:?} {}", code, msg);
            return Err(RampError::ICRejectionError(code, msg));
        }
    };

    let mut seed = [0u8; 32];
    seed.copy_from_slice(&rnd_buffer.0[..32]);
    Ok(seed)
}

pub async fn create_jws_signature(payload: &str, jws_header: &JWSHeader) -> Result<String> {
    let private_key_der = read_state(|s| s.revolut.private_key_der.clone());

    // Encode the JWS header and payload
    let jws_header_json = serde_json::to_string(&jws_header)?;
    ic_cdk::println!("jws_header_json = {:?}", jws_header_json);
    let jws_header_encoded = general_purpose::URL_SAFE_NO_PAD.encode(jws_header_json.as_bytes());
    let payload_encoded = general_purpose::URL_SAFE_NO_PAD.encode(payload.as_bytes());
    let signing_input = format!("{}.{}", jws_header_encoded, payload_encoded);

    // Sign the payload
    let mut hasher = Sha256::new();
    hasher.update(signing_input.as_bytes());
    let hashed = hasher.finalize();

    let seed = get_random_bytes().await?; // onchain pseudorandom seed from raw_rand
    let mut rng = StdRng::from_seed(seed);
    let mut salt = [0u8; 32];
    rng.fill_bytes(&mut salt);
    let padding = PaddingScheme::new_pss_with_salt::<Sha256, _>(Box::new(rng), 32);

    let private_key_pem = String::from_utf8(private_key_der).map_err(|_| RampError::Utf8Error)?;
    let private_key = RsaPrivateKey::from_pkcs8_pem(&private_key_pem)?;
    let signature = private_key.sign(padding, &hashed)?;

    let signature_encoded = general_purpose::URL_SAFE_NO_PAD.encode(signature);
    let jws_signature = format!(
        "{}.{}.{}",
        jws_header_encoded, payload_encoded, signature_encoded
    );

    Ok(jws_signature)
}
