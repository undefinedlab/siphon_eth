use axum::{http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use tfhe::integer::{RadixClientKey, RadixCiphertext, ServerKey};
use crate::fhe_engine::core as fhe_core;


#[derive(Deserialize)]
pub struct EvaluationPayload {
    strategy_type: String,
    encrypted_upper_bound: String,
    encrypted_lower_bound: String,
    server_key: String,
    current_price_cents: u32,
    encrypted_client_key: String, 
}

#[derive(Serialize)]
pub struct EvaluationResponse {
    is_triggered: bool,
}

/// This function simulates a Trusted Execution Environment (TEE).
fn simulate_tee_decryption(encrypted_result: &RadixCiphertext, client_key_hex: &str) -> bool {
    println!("[TEE Simulation] Performing secure decryption inside the enclave...");
    // The TEE can safely deserialize the client key to use it for the one-time decryption.
    let client_key_bytes = hex::decode(client_key_hex).unwrap();
    let client_key: RadixClientKey = bincode::deserialize(&client_key_bytes).unwrap();
    client_key.decrypt::<u64>(encrypted_result) == 1
}


pub async fn evaluate_strategy(
    Json(payload): Json<EvaluationPayload>,
) -> (StatusCode, Json<EvaluationResponse>) {
    
    println!("[Rust FHE Engine] Received REAL evaluation request from Python orchestrator.");

    // 1. Deserialize the raw byte data from the JSON payload into real FHE objects.
    let server_key: ServerKey = bincode::deserialize(&hex::decode(payload.server_key).unwrap()).unwrap();
    
    // 2. Perform the real homomorphic computation based on the strategy type.
    let encrypted_result = match payload.strategy_type.as_str() {
        "BRACKET_ORDER_LONG" | "BRACKET_ORDER_SHORT" => {
            let enc_upper: RadixCiphertext = bincode::deserialize(&hex::decode(payload.encrypted_upper_bound).unwrap()).unwrap();
            let enc_lower: RadixCiphertext = bincode::deserialize(&hex::decode(payload.encrypted_lower_bound).unwrap()).unwrap();
            
            let is_above = fhe_core::homomorphic_check(&server_key, &enc_upper, "GTE", payload.current_price_cents);
            let is_below = fhe_core::homomorphic_check(&server_key, &enc_lower, "LTE", payload.current_price_cents);

            fhe_core::homomorphic_or(&server_key, &is_above, &is_below)
        },
        "LIMIT_BUY_DIP" => {
             let enc_lower: RadixCiphertext = bincode::deserialize(&hex::decode(payload.encrypted_lower_bound).unwrap()).unwrap();
             fhe_core::homomorphic_check(&server_key, &enc_lower, "LTE", payload.current_price_cents)
        },
        "LIMIT_SELL_RALLY" => {
             let enc_upper: RadixCiphertext = bincode::deserialize(&hex::decode(payload.encrypted_upper_bound).unwrap()).unwrap();
             fhe_core::homomorphic_check(&server_key, &enc_upper, "GTE", payload.current_price_cents)
        },
        _ => {
            println!("[Rust FHE Engine] ❌ Error: Unknown strategy type '{}'", payload.strategy_type);
            return (StatusCode::BAD_REQUEST, Json(EvaluationResponse { is_triggered: false }));
        }
    };
    
    let is_triggered = simulate_tee_decryption(&encrypted_result, &payload.encrypted_client_key);

    println!("[Rust FHE Engine] Real FHE evaluation complete. Responding with 'is_triggered: {}'", is_triggered);
    (StatusCode::OK, Json(EvaluationResponse { is_triggered }))
}