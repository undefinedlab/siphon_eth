Siphon Payload Generator (Rust FHE Service)

This service is a crucial component of the Siphon protocol, acting as a local, trusted client-side server. Its sole purpose is to perform the FHE key generation and encryption, protecting the user's secrets before they are submitted to the main Python orchestrator.

It functions as an "encryption-as-a-service" server that runs on the user's local machine, providing a secure, reliable bridge between the web-based dApp and the backend.

Architectural Role

This service exists as a pragmatic solution to the current challenges of client-side cryptography. The data flow for creating a strategy is as follows:

Frontend dApp (Next.js): The user enters their plaintext strategy (e.g., upper_bound: 4000, lower_bound: 3800) into the UI running on localhost:3000.

API Call 1 (dApp -> Payload Generator): The dApp's strategy.ts SDK sends this plaintext data to this Rust server's /generatePayload endpoint (running on localhost:5003).

FHE Encryption (This Server): This service:

Generates a new FHE ClientKey and ServerKey using the tfhe-rs library.

Encrypts the upper_bound and lower_bound into ciphertexts.

Assembles the final, private StrategyPayload, including the hex-encoded encrypted data and keys.

API Call 2 (Payload Generator -> Orchestrator): This service immediately forwards the fully encrypted payload to the Python Trade Executor (running on localhost:5000) for processing.

+----------------+      (1. Plaintext Input)      +-------------------------+
|                |  POST /generatePayload         |                         |
|  Next.js dApp  | -----------------------------> |  Rust Payload Server    |
| (localhost:3000) |                                |  (This Service @ 5003)  |
|                |                                |                         |
+----------------+      (4. Encrypted Payload)     |  (2. FHE Encryption)    |
                        <---------------------     |  (3. Forwarding)        |
                                                   +-----------|-------------+
                                                               | (Encrypted Payload)
                                                               | POST /createStrategy
                                                               v
                                                   +-------------------------+
                                                   |  Python Orchestrator    |
                                                   |  (localhost:5000)       |
                                                   +-------------------------+


API Endpoint

POST /generatePayload

This endpoint receives the user's raw strategy, encrypts it, and forwards it to the orchestrator.

Request Body (StrategyInput):

{
  "user_id": "0x123...",
  "strategy_type": "BRACKET_ORDER_LONG",
  "asset_in": "ETH",
  "asset_out": "USDC",
  "amount": 1.5,
  "upper_bound": 4000.0,
  "lower_bound": 3800.0
}


Success Response (StrategyPayload):
(This is also the payload forwarded to the Python server)

{
  "user_id": "0x123...",
  "strategy_type": "BRACKET_ORDER_LONG",
  "asset_in": "ETH",
  "asset_out": "USDC",
  "amount": 
  "zkp_data": 
  "encrypted_upper_bound":
  "encrypted_lower_bound": 
  "server_key": 
  "encrypted_client_key": 
  "payload_id":
}


Setup & Running

This server must be running locally alongside the other backend services.

Navigate to the directory:

cd syphon-payload-generator


Build and Run:

# This will download all Rust dependencies (axum, tfhe, etc.) and compile
cargo run


The server will start and listen on http://127.0.0.1:5003.

Academic Observation & Suggestions for Improvement

This service is a pragmatic architectural choice driven by the current landscape of web-based cryptography.

The WASM Instability Problem: The primary motivation for this server is the current unreliability of the Rust-to-WebAssembly toolchain for complex cryptographic libraries. As of mid-2025, the official rustwasm GitHub organization is being sunset (see: [Sunsetting the rustwasm GitHub org](https://blog.rust-lang.org/inside-rust/2025/07/21/sunsetting-the-rustwasm-github-org/)). This has created ecosystem instability, making it difficult to reliably compile and run advanced libraries like Zama's tfhe-rs in a browser environment (like our Next.js dApp). This local Rust server "aborts" the need for direct frontend encryption, providing a stable, native Rust environment for the task.

Performance (Computation Time): FHE key generation and encryption are computationally non-trivial. Offloading this from the browser's single JavaScript thread to a dedicated, multi-threaded native Rust process (even locally) ensures the dApp remains fast, responsive, and does not freeze the user's UI.

Needs for Optimization: The core FHE logic (in the other Rust FHE Engine service) is the primary performance bottleneck. The tfhe-rs parameters currently in use are for correctness, not speed. A production-ready system would require significant benchmarking and parameter tuning to reduce homomorphic computation time.

Architectural Complexity: This 4-service architecture (dApp -> Payload Server -> Python Orchestrator -> FHE Engine) is robust but introduces operational complexity and network latency between multiple local services. The system relies on not just Rust, but also Python and TypeScript, each handling a different part of the logic.

Ideal Future State: The ultimate goal remains true client-side encryption. Once the tfhe-rs WASM toolchain (or a viable alternative) stabilizes, this payload generator's logic should be compiled to WASM and moved entirely into the Next.js dApp. This would eliminate this server, remove a network hop, and create a true two-service architecture (dApp -> Backend).