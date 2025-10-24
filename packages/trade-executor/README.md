Syphon Trade Executor (Python Backend)

This service, named the Trade Executor, is the central control plane for the Syphon Money protocol. It handles all business logic, order persistence, external data retrieval (Oracle), and transaction finalization. It offloads all cryptographic processing to the dedicated Rust FHE Engine.

Architecture Role

The Executor is the middle layer in a three-part distributed architecture:

DApp (Frontend): Handles client-side key generation and encryption.

Trade Executor (This Service): Manages the persistent Order Book and orchestrates the workflow.

Rust FHE Engine: Performs the computationally intensive homomorphic comparisons.

Core Features

API Gateway: Exposes a secure REST endpoint (/createStrategy) for the Next.js dApp to submit encrypted strategies.

Order Persistence: Stores the complete, encrypted Order Book in a SQLite database (strategies.db), ensuring reliable tracking of all active trading strategies.

Real-Time Oracle: Runs a background scheduler that fetches live price data from the Pyth Network Hermes API on a fixed interval.

FHE Orchestration: Passes the live market price and the encrypted bounds to the Rust FHE Engine (localhost:5001) for the secure, private comparison.

Transaction Finalization: Upon receiving a true signal from the Rust engine, it simulates the final, authorized, on-chain swap transaction.

Technology Stack

Component

Technology

Role

Server/API

Python 3.9, Flask, Gunicorn

Main application framework and production server.

Database

SQLite + SQLAlchemy

Persistent storage for encrypted strategies.

Environment Mgmt

Conda

Manages Python version and dependencies.

Network

Requests

Client for the Pyth Oracle and Rust FHE Engine.

Blockchain

Web3.py

For interacting with the local Anvil node (e.g., final swap calls).

Setup & Running the Full Demo

This project is configured for a stable local development environment using Conda.

Prerequisites

WSL2/Linux

Conda environment manager

Node.js/npm (for the Next.js frontend)

Rust toolchain (for the FHE Engine)

1. Environment Setup (Conda)

You must create and activate the correct Python environment:

# 1. Navigate to the executor directory
cd syphon-executor

# 2. Create the environment (if not done already)
conda create --name siphon python=3.9 -y

# 3. Activate the environment
conda activate siphon

# 4. Install all dependencies
pip install -r requirements.txt


2. Configuration & Initialization

Before starting the server, you must provide your network addresses and initialize the database.

A. Update Configuration

Edit the .env file in the project root with your local Anvil blockchain settings:

# CRITICAL: Address for the Rust FHE Engine
FHE_ENGINE_URL="http://localhost:5001/evaluateStrategy"
SEPOLIA_RPC_URL="[http://127.0.0.1:8545](http://127.0.0.1:8545)" 
SYPHON_VAULT_CONTRACT_ADDRESS="[Your Deployed Vault Address]"
VERIFIER_CONTRACT_ADDRESS="[Your Deployed Verifier Address]"


B. Initialize Database (Crucial Step)

To prevent the database is locked error, you must create the database tables manually before Gunicorn starts the server's threads.

# This runs the init_db.py script
python3 init_db.py


3. Launch Sequence

This server must be run concurrently with your Rust FHE Engine and your Next.js frontend.

# Run the server on port 5002.
# The `--timeout 120` is a safety feature for the FHE calculation.
gunicorn --bind 0.0.0.0:5002 --workers 1 --timeout 120 "app:app"
