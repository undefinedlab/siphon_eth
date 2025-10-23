# Syphon FHE AutoTrader Server

This is the off-chain, Rust-based FHE (Fully Homomorphic Encryption) server for the Siphon Money protocol. It acts as a specialized co-processor responsible for privately evaluating user-defined trading strategies against live market data.

This server is designed to work in tandem with a primary trade executor backend (e.g., the Python server), which handles user requests, manages the order book, Fetches Price and triggers on-chain execution.

## Features

- **Private Strategy Evaluation:** Uses the `tfhe-rs` library to homomorphically check if trading conditions are met without decrypting the user's secret price targets.
- **High Performance:** Built with Rust, Tokio, and Axum for a fast, safe, and concurrent architecture.
- **Modular Design:** Code is separated by concern into handlers, a cryptographic core, and a background worker.

## How to Run

### Using Cargo (for development)

1.  Navigate to the `syphon-fhe-server` directory.
2.  Build and run the server in release mode for optimal performance:
    ```bash
    cargo run --release
    ```
3.  The server will start and listen on `http://localhost:5001`.
