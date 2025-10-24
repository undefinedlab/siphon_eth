import os
import json
from web3 import Web3
# FIX: Import the single, correct address
from config import SEPOLIA_RPC_URL, SYPHON_VAULT_CONTRACT_ADDRESS

try:
    with open("SyphonVault.abi.json", "r") as f:
        CONTRACT_ABI = json.load(f)
except FileNotFoundError:
    print("⚠️  Warning: SyphonVault.abi.json not found. ZK verification will be skipped.")
    CONTRACT_ABI = None

def verify_strategy_offchain(strategy):
    """
    Performs a free, off-chain static call to the Entrypoint contract's verifyProof function.
    """
    
    # 1. Configuration Check
    if not all([SEPOLIA_RPC_URL, SYPHON_VAULT_CONTRACT_ADDRESS, CONTRACT_ABI]):
        print("   -> [Verifier] SKIPPING off-chain ZK check (Missing .env config or ABI file).")
        return False

    try:
        w3 = Web3(Web3.HTTPProvider(SEPOLIA_RPC_URL))
        if not w3.is_connected():
            print(f"   ❌ [Verifier] Error: Could not connect to RPC at {SEPOLIA_RPC_URL}")
            return False

        # FIX: Use the single Vault address for the verification call
        entrypoint_contract = w3.eth.contract(
            address=SYPHON_VAULT_CONTRACT_ADDRESS, 
            abi=CONTRACT_ABI
        )

        # 3. Parse the structured ZKP data from the payload (assuming it's in a single field)
        try:
            zk_payload = json.loads(strategy['zkp_data'])
            _proof_array = zk_payload['proof']       
            _public_signals = zk_payload['publicSignals']
        except Exception as e:
            print(f"   ❌ [Verifier] Failed to parse zkp_data JSON: {e}.")
            return False

        print("   -> [Verifier] Making static call to verifyProof...")
        
        is_valid = entrypoint_contract.functions.verifyProof(
            _proof_array,
            _public_signals
        ).call() 
        
        if is_valid:
            print("   -> [Verifier] ✅ ZK Proof passed off-chain validity check.")
        else:
            print("   -> [Verifier] ⚠️ ZK Proof FAILED off-chain validity check.")
        
        return is_valid
    
    except Exception as e:
        print(f"   ❌ An error occurred during off-chain verification: {e}")
        return False