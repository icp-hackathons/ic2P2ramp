use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};

use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod,
};
use ic_cdk::api::time;

use crate::{
    errors::{RampError, Result},
    state::{paypal, read_state},
};

#[derive(Serialize, Deserialize)]
struct AccessTokenResponse {
    access_token: String,
    token_type: String,
    expires_in: u64,
}

pub async fn get_paypal_access_token() -> Result<String> {
    if let Some((token, expiration)) = paypal::get_paypal_token() {
        let current_time = time() / 1_000_000_000;
        ic_cdk::println!(
            "[get_paypal_access_token] Cached token expiration: {}",
            expiration
        );
        ic_cdk::println!("[get_paypal_access_token] current_time = {}", current_time);
        if current_time < expiration {
            return Ok(token);
        }
    }

    ic_cdk::println!("[get_paypal_access_token] Fetching new token from PayPal");
    let (client_id, client_secret, api_url) = read_state(|s| {
        (
            s.paypal.client_id.clone(),
            s.paypal.client_secret.clone(),
            s.paypal.api_url.clone(),
        )
    });
    ic_cdk::println!(
        "[get_paypal_access_token] client_id = {}, client_secret = {}, api_url = {}",
        client_id,
        client_secret,
        api_url
    );
    let credentials = general_purpose::STANDARD.encode(format!("{}:{}", client_id, client_secret));

    let request_headers = vec![
        HttpHeader {
            name: "Authorization".to_string(),
            value: format!("Basic {}", credentials),
        },
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/x-www-form-urlencoded".to_string(),
        },
    ];

    let request = CanisterHttpRequestArgument {
        url: format!("{}/v1/oauth2/token", api_url),
        method: HttpMethod::POST,
        body: Some("grant_type=client_credentials".as_bytes().to_vec()),
        max_response_bytes: None,
        transform: None,
        headers: request_headers,
    };

    ic_cdk::println!("[get_paypal_access_token] request = {:?}", request);

    let cycles: u128 = 10_000_000_000;
    match http_request(request, cycles).await {
        Ok((response,)) => {
            let str_body = String::from_utf8(response.body).map_err(|_| RampError::Utf8Error)?;
            ic_cdk::println!("[get_paypal_access_token] Response body: {}", str_body);

            let access_token_response: AccessTokenResponse = serde_json::from_str(&str_body)
                .map_err(|e| RampError::ParseError(e.to_string()))?;

            // Store the token and its expiration time in the state
            let current_time = time() / 1_000_000_000;
            let expiration_time = current_time + access_token_response.expires_in;
            ic_cdk::println!(
                "[get_paypal_access_token] New token expiration time: {}",
                expiration_time
            );
            paypal::set_paypal_token(access_token_response.access_token.clone(), expiration_time);

            Ok(access_token_response.access_token)
        }
        Err((r, m)) => Err(RampError::HttpRequestError(r as u64, m)),
    }
}
