# Syphon Trade Executor (Python Backend)

This service, named the **Trade Executor**, is the central control plane for the Syphon Money protocol. It handles all business logic, order persistence, external data retrieval (Oracle), and transaction finalization. It offloads all cryptographic processing to the dedicated **Rust FHE Engine**.

## Architecture Role

The Executor is the central backend in a four-part distributed architecture:

1.  **Frontend dApp (Next.js @ `localhost:3000`):** The user-facing interface. It accepts plaintext strategy inputs from the user.
2.  **Payload Generator (Rust @ `localhost:5003`):** A client-side server that receives plaintext from the dApp, generates FHE keys, encrypts the strategy, and forwards the encrypted payload.
3.  **Trade Executor (This Service @ `localhost:5000`):** Manages the persistent Order Book, orchestrates the workflow, fetches market data, and triggers executions.
4.  **Rust FHE Engine (@ `localhost:5001`):** A dedicated microservice that performs computationally intensive homomorphic comparisons.

## Core Features

* **API Gateway:** Exposes a secure REST endpoint (`/createStrategy`) for the **Rust Payload Generator** to submit fully encrypted strategies.
* **Order Persistence:** Stores the complete, encrypted Order Book in a SQLite database (`strategies.db`), ensuring reliable tracking of all active trading strategies.
* **Real-Time Oracle:** Runs a background scheduler that fetches live price data from the Pyth Network Hermes API on a fixed interval.
* **FHE Orchestration:** Passes the live market price (plaintext) and the encrypted strategy bounds (ciphertext) to the Rust FHE Engine (`localhost:5001`) for a secure, private comparison.
* **Transaction Finalization:** Upon receiving a `true` signal from the Rust engine, it simulates and finalizes the authorized, on-chain swap transaction via a local Anvil node.

## Technology Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Server/API** | Python 3.9, Flask, Gunicorn | Main application framework and production server. |
| **Database** | SQLite + SQLAlchemy | Persistent storage for encrypted strategies. |
| **Environment Mgmt** | Conda | Manages Python version and dependencies. |
| **Network** | Requests | Client for the Pyth Oracle and Rust FHE Engine. |
| **Blockchain** | Web3.py | For interacting Onchain. |

---

## Setup & Running the Full Demo

This project is configured for a stable local development environment using Conda.

### Prerequisites

* WSL2/Linux
* Conda environment manager
* Node.js/npm (for the Next.js frontend)
* Rust toolchain (for the FHE Engine & Payload Generator)

### Environment Setup (Conda)

You must create and activate the correct Python environment:

1.  **Navigate to the executor directory**
    ```bash
    cd trade-executor
    ```
2.  **Create the environment (if not done already)**
    ```bash
    conda create --name siphon python=3.9 -y
    ```
3.  **Activate the environment**
    ```bash
    conda activate siphon
    ```
4.  **Install all dependencies**
    ```bash
    pip install -r requirements.txt
    ```

### Configuration & Initialization

Before starting the server, you must provide your network addresses and initialize the database.

**python init_db.py**
    

**A. Update Configuration**

Edit the `.env` file in the project root with your local Anvil blockchain settings:

```dotenv
# CRITICAL: Address for the Rust FHE Engine
FHE_ENGINE_URL="http://localhost:5001/evaluateStrategy"

# Local Anvil Node
SEPOLIA_RPC_URL="[http://127.0.0.1:8545](http://127.0.0.1:8545)"

# Deployed Contract Addresses
SYPHON_VAULT_CONTRACT_ADDRESS="[Your Deployed Vault Address]"
VERIFIER_CONTRACT_ADDRESS="[Your Deployed Verifier Address]"