import os
import json
from web3 import Web3
from config import (
    SEPOLIA_RPC_URL, 
    SYPHON_VAULT_CONTRACT_ADDRESS, 
    EXECUTOR_PRIVATE_KEY
)

# --- MOCK TOKEN ADDRESSES (for local Anvil testing) ---
TOKEN_ADDRESSES = {
    "ETH": Web3.to_checksum_address("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"), 
    "USDC": Web3.to_checksum_address("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"), 
    "WETH": Web3.to_checksum_address("0x7b79995e5f793A07Bc00c21412e50Eaae098E7f9")  
}

try:
    with open("SyphonVault.abi.json", "r") as f:
        CONTRACT_ABI = json.load(f)
except FileNotFoundError:
    print("CRITICAL ERROR: SyphonVault.abi.json not found.")
    CONTRACT_ABI = None

def execute_trade(strategy, current_price):
    """
    Connects to the blockchain, builds, signs, and sends the final
    'swap' transaction to the Entrypoint contract.
    """
    print("\n" + "="*60)
    print(f"✅ EXECUTION: Trigger met for strategy '{strategy['id']}'")
    print(f"   User: {strategy['user_id']}")
    print(f"   Recipient: {strategy['recipient_address']}") # Added log
    print(f"   Strategy Type: {strategy['strategy_type']}")
    print(f"   Current Price: ${current_price:,.2f}")
    print(f"\n   Preparing ON-CHAIN execution...")

    if not all([SEPOLIA_RPC_URL, SYPHON_VAULT_CONTRACT_ADDRESS, CONTRACT_ABI, EXECUTOR_PRIVATE_KEY]):
        print("   ❌ [Executor] CRITICAL ERROR: Missing .env config.")
        return

    try:
        # 1. Connect to the blockchain
        w3 = Web3(Web3.HTTPProvider(SEPOLIA_RPC_URL))
        executor_account = w3.eth.account.from_key(EXECUTOR_PRIVATE_KEY)
        w3.eth.default_account = executor_account.address
        print(f"   [Executor] Wallet loaded: {executor_account.address}")

        # 2. Load the Entrypoint/Vault contract
        vault_contract = w3.eth.contract(
            address=SYPHON_VAULT_CONTRACT_ADDRESS, 
            abi=CONTRACT_ABI
        )

        # 3. Parse the ZKP data
        try:
            zk_payload = json.loads(strategy['zkp_data'])
            _proof_bytes = zk_payload['proof'] 
            _nullifier = int(zk_payload['publicInputs']['nullifier'])
            _newCommitment = int(zk_payload['publicInputs']['newCommitment'])
            _asset_in_address = Web3.to_checksum_address(zk_payload['publicInputs']['asset'])
            _amountIn = int(zk_payload['publicInputs']['amount'])
        except Exception as e:
            print(f"   ❌ [Executor] Failed to parse zkp_data JSON: {e}.")
            return

        _asset_out_address = TOKEN_ADDRESSES.get(strategy['asset_out'])
        
        _recipient = Web3.to_checksum_address(strategy['recipient_address'])
    
        
        _minAmountOut = 0 # For a demo, we can set slippage to 0
        _fee = 3000 # Uniswap V3 0.3% fee tier
        
        if not all([_asset_in_address, _asset_out_address, _recipient]):
             print(f"   ❌ [Executor] Invalid token symbols ('{strategy['asset_in']}', '{strategy['asset_out']}') or recipient address.")
             return

        print(f"   [Executor] Building transaction for swap...")

        # 5. Build the transaction
        tx = vault_contract.functions.swap(
            _asset_in_address,
            _asset_out_address,
            _recipient,
            _amountIn,
            _minAmountOut,
            _fee,
            _nullifier,
            _newCommitment,
            _proof_bytes
        ).build_transaction({
            'from': executor_account.address,
            'nonce': w3.eth.get_transaction_count(executor_account.address),
            'gas': 2000000,
            'gasPrice': w3.eth.gas_price
        })

        # 6. Sign and send the transaction
        signed_tx = w3.eth.account.sign_transaction(tx, private_key=EXECUTOR_PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        print(f"   [Executor] ✅ Swap transaction sent! Hash: {tx_hash.hex()}")
        
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        if receipt['status'] == 1:
            print("   [Executor] ✅ Transaction successful!")
        else:
            print("   [Executor] ❌ Transaction FAILED on-chain.")
        
        print("="*60)

    except Exception as e:
        print(f"   ❌ [Executor] An error occurred during on-chain execution: {e}")
        print("="*60)