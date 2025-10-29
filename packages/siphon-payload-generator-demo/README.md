# 🧠 Siphon Payload Generator (Rust FHE Service)

## Overview

The **Siphon Payload Generator** is a crucial component of the **Siphon protocol**, acting as a **local, trusted client-side encryption server**.  
Its sole purpose is to perform **Fully Homomorphic Encryption (FHE)** key generation and encryption, ensuring user secrets are securely protected before being submitted to the main **Python Orchestrator**.

This service functions as an **"Encryption-as-a-Service"** layer running on the user's local machine, creating a secure, reliable bridge between the web-based dApp (Next.js) and the backend computation layer (Python).

---

## 🏗️ Architectural Role

This service exists as a pragmatic solution to the challenges of **client-side cryptography** in the current web ecosystem.

### Data Flow Overview

1. **Frontend dApp (Next.js)**
   - Runs on: `localhost:3000`
   - The user enters a plaintext trading strategy (e.g. `upper_bound: 4000`, `lower_bound: 3800`)
   - The dApp’s `strategy.ts` SDK sends this plaintext data to the Rust Payload Generator

2. **Payload Generator (Rust FHE Service)**
   - Runs on: `localhost:5003`
   - Generates **FHE ClientKey** and **ServerKey** using the `tfhe-rs` library  
   - Encrypts the upper and lower bounds into ciphertexts  
   - Assembles the encrypted payload with metadata and keys  
   - Forwards the payload to the Orchestrator for computation

3. **Python Orchestrator**
   - Runs on: `localhost:5000`
   - Receives the encrypted payload for trade execution, validation, and state update

---






## Setup & Running

This server must be running locally alongside the other backend services.

Navigate to the directory:

cd syphon-payload-generator


Build and Run:

This will download all Rust dependencies (axum, tfhe, etc.) and compile

**cargo run**

The server will start and listen on http://127.0.0.1:5003.

# Academic Observation & Suggestions for Improvement

This service is a pragmatic architectural choice driven by the current landscape of web-based cryptography.

1) The WASM Instability Problem: The primary motivation for this server is the current unreliability of the Rust-to-WebAssembly toolchain for complex cryptographic libraries. As of mid-2025, the official rustwasm GitHub organization is being sunset (see: [Sunsetting the rustwasm GitHub org](https://blog.rust-lang.org/inside-rust/2025/07/21/sunsetting-the-rustwasm-github-org/)). This has created ecosystem instability, making it difficult to reliably compile and run advanced libraries like Zama's tfhe-rs in a browser environment (like our Next.js dApp). This local Rust server "aborts" the need for direct frontend encryption, providing a stable, native Rust environment for the task.

2) Performance (Computation Time): FHE key generation and encryption are computationally non-trivial. Offloading this from the browser's single JavaScript thread to a dedicated, multi-threaded native Rust process (even locally) ensures the dApp remains fast, responsive, and does not freeze the user's UI.

3) Needs for Optimization: The core FHE logic (in the other Rust FHE Engine service) is the primary performance bottleneck. The tfhe-rs parameters currently in use are for correctness, not speed. A production-ready system would require significant benchmarking and parameter tuning to reduce homomorphic computation time.

4) Architectural Complexity: This 4-service architecture (dApp -> Payload Server -> Python Orchestrator -> FHE Engine) is robust but introduces operational complexity and network latency between multiple local services. The system relies on not just Rust, but also Python and TypeScript, each handling a different part of the logic.

5) Ideal Future State: The ultimate goal remains true client-side encryption. Once the tfhe-rs WASM toolchain (or a viable alternative) stabilizes, this payload generator's logic should be compiled to WASM and moved entirely into the Next.js dApp. This would eliminate this server, remove a network hop, and create a true two-service architecture (dApp -> Backend).


## 🔁 Data Flow Diagram

```text
+----------------+       (1. Plaintext Input)       +-------------------------+
|                |  POST /generatePayload           |                         |
|  Next.js dApp  | -------------------------------> |  Rust Payload Server    |
| (localhost:3000) |                                |  (This Service @ 5003)  |
|                |                                |                         |
+----------------+                                     |  (2. FHE Encryption)    |
                                                       |  (3. Forwarding)        |
                                                    +-----------|-------------+
                                                                | (Encrypted Payload)
                                                                | POST /createStrategy
                                                                v
                                                    +-------------------------+
                                                    |  Python Orchestrator    |
                                                    |  (localhost:5000)       |
                                                    +-------------------------+
---