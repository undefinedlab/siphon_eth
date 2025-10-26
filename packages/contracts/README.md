# Siphon Vault Contract
## About
Our model acts as a privacy vault and asset relayer, allowing users to securely and anonymously exchange any asset they hold in the EVM environment with the rest of the world. 

## 🛠️ Architecture
The contract structure is designed with 3-main layers: Entrypoint - Vault - Verifier 
### Entrypoint
Beginning of all vaults and endpoint of the Siphon contract system
- Initializes vaults based on given asset at the time of deployment
- Provide external functions that Dapp/servers can hook on
- Relay the incoming request to corresponding vault instance

### Vault
Main asset holding instance with Merkle-tree based commitment history management
- Each vault is an instance holding one type of asset
- Each vault manages its own Merkle-Tree which saves the commitment history of users

### Verifier
ZK Verifier that has only one job: To verify the incoming withdraw request
- Utilize SnarkJS based generated algorithm to calculate the verification process
- Verifies that the given proof matches public inputs (nullifier, stateRoot, etc..)


## 📁 Project Structure
```
siphon/
├── 📂 ignition/              # Hardhat Ignition deployment files
│
├── 📂 test/                  # Deployment test script
│
├── 📂 src/                   # Contract source code folder
│   │
│   ├── 📂 interfaces/        # All Interface source codes 
│   ├── 📂 abstracts/         # Vault abstract contract
│   ├── 📂 states/            # Actual instances of each vault
│   ├── 📂 verifiers/         # ZK Verifier contract
│   ├── 📄 Entrypoint.sol     # Entrypoint of all incoming function calls
│
├── 📄 hardhat.config.ts     # Hardhat deployment configuration
```



## 🚀 Local Development

### Installation
1. Install Hardhat and dependency modules
```
cd ./packages/contracts
npm install
```
2. Compiling contracts
```
npx hardhat compile
```
3. Insert configurations
```
cp .env.example .env
// Now edit .env file with your configuration 
```
4. Run local deployment
```
npm run deploy:vault
```
5. Run testnet deployment (Will connect to your configured RPC network)
```
npm run deploy:vault:sepolia
```
Contract's address will appear on the console log.