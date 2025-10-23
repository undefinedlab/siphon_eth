# Local Development

## For Vault Smart Contract Development
All code & configuration for contract build is under `contract/` folder.
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