mod fhe_core; // Ensure src/fhe_core.rs exists

use axum::{http::StatusCode, response::IntoResponse, routing::post, Json, Router};
use bincode;
use hex::encode;
use reqwest;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use uuid::Uuid;

#[derive(Deserialize)]
struct StrategyInput {
    user_id: String,
    strategy_type: String,
    asset_in: String,
    asset_out: String,
    amount: f64,
    upper_bound: f64,
    lower_bound: f64,
}

#[derive(Serialize)]
struct StrategyPayload {
    user_id: String,
    strategy_type: String,
    asset_in: String,
    asset_out: String,
    amount: f64,
    zkp_data: String,
    encrypted_upper_bound: String,
    encrypted_lower_bound: String,
    server_key: String,
    encrypted_client_key: String,
    payload_id: String,
}

#[tokio::main]
async fn main() {
    // 1️⃣ Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any) // Accept requests from any origin
        .allow_methods([axum::http::Method::POST, axum::http::Method::GET])
        .allow_headers(Any);

    // 2️⃣ Build router
    let app = Router::new()
        .route("/generatePayload", post(handle_generate_payload))
        .layer(cors);

    let addr = SocketAddr::from(([127, 0, 0, 1], 5003));
    println!("🚀 Payload Generator listening at http://{}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn handle_generate_payload(Json(input): Json<StrategyInput>) -> impl IntoResponse {
    println!(
        "🧠 Generating encrypted payload for user: {}",
        input.user_id
    );

    // 1️⃣ Generate FHE keys
    let (client_key, server_key) = fhe_core::generate_fhe_keys();

    // 2️⃣ Encrypt bounds
    let encrypted_upper = fhe_core::encrypt_price((input.upper_bound * 100.0) as u32, &client_key);
    let encrypted_lower = fhe_core::encrypt_price((input.lower_bound * 100.0) as u32, &client_key);

    // 3️⃣ Mock ZKP data
    let proof_array: Vec<u8> = vec![0; 24];
    let zkp_data_string = serde_json::to_string(&json!({
        "proof": proof_array,
        "publicSignals": [12345, 67890, 0, 0]
    }))
    .unwrap();

    // 4️⃣ Construct final payload
    let payload = StrategyPayload {
        user_id: input.user_id.clone(),
        strategy_type: input.strategy_type.clone(),
        asset_in: input.asset_in.clone(),
        asset_out: input.asset_out.clone(),
        amount: input.amount,
        zkp_data: zkp_data_string,
        encrypted_upper_bound: encode(bincode::serialize(&encrypted_upper).unwrap()),
        encrypted_lower_bound: encode(bincode::serialize(&encrypted_lower).unwrap()),
        server_key: encode(bincode::serialize(&server_key).unwrap()),
        encrypted_client_key: encode(bincode::serialize(&client_key).unwrap()),
        payload_id: Uuid::new_v4().to_string(),
    };

    // 5️⃣ Send to Python orchestrator
    let orchestrator_url = "http://localhost:5000/createStrategy";
    let client = reqwest::Client::new();

    match client.post(orchestrator_url).json(&payload).send().await {
        Ok(res) => {
            let status = res.status();
            let text = res.text().await.unwrap_or_default();

            if status.is_success() {
                println!("✅ Forwarded to Python orchestrator");
                (
                    StatusCode::OK,
                    Json(json!({
                        "status": "success",
                        "message": "Payload forwarded to orchestrator",
                        "payload": payload
                    })),
                )
            } else {
                eprintln!("❌ Orchestrator error ({}): {}", status, text);
                (
                    status,
                    Json(json!({
                        "status": "error",
                        "message": format!("Orchestrator responded with error: {}", text)
                    })),
                )
            }
        }

        Err(e) => {
            eprintln!("❌ Failed to reach orchestrator: {}", e);
            (
                StatusCode::BAD_GATEWAY,
                Json(json!({
                    "status": "error",
                    "message": "Failed to reach orchestrator",
                    "details": e.to_string()
                })),
            )
        }
    }
}
