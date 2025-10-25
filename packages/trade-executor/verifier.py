import os
import json
from web3 import Web3
from config import SEPOLIA_RPC_URL, SYPHON_VAULT_CONTRACT_ADDRESS

try:
    with open("SyphonVault.abi.json", "r") as f:
        CONTRACT_ABI = json.load(f)
except FileNotFoundError:
    print("⚠️  Warning: SyphonVault.abi.json not found. ZK verification will be skipped.")
    CONTRACT_ABI = None

def verify_strategy_offchain(strategy):
    """
    Performs a free, off-chain static call to the Entrypoint contract's 
    verify(_asset, _amount, _nullifier, _newCommitment, _proof) function.
    """
    
    # 1. Configuration Check
    if not all([SEPOLIA_RPC_URL, SYPHON_VAULT_CONTRACT_ADDRESS, CONTRACT_ABI]):
        print("   -> [Verifier] SKIPPING off-chain ZK check (Missing .env config or ABI file).")
        return True 

    try:
        w3 = Web3(Web3.HTTPProvider(SEPOLIA_RPC_URL))
        if not w3.is_connected():
            print(f"   ❌ [Verifier] Error: Could not connect to RPC at {SEPOLIA_RPC_URL}")
            return False

        entrypoint_contract = w3.eth.contract(
            address=SYPHON_VAULT_CONTRACT_ADDRESS, 
            abi=CONTRACT_ABI
        )

        # 2. Parse the ZKP data
        try:
            zk_payload = json.loads(strategy['zkp_data'])
            
            
            # Get the proof bytes
            _proof_bytes = zk_payload['proof'] 
            
            # Get the public inputs dictionary
            public_inputs_dict = zk_payload['publicInputs']

            # Extract each argument individually in the
            # EXACT order of your verify function 
            _asset = Web3.to_checksum_address(public_inputs_dict['asset'])
            _amount = int(public_inputs_dict['amount'])
            _nullifier = int(public_inputs_dict['nullifier'])
            _newCommitment = int(public_inputs_dict['newCommitment'])
        
        except Exception as e:
            print(f"   ❌ [Verifier] Failed to parse zkp_data JSON: {e}.")
            return False

        print("   -> [Verifier] Making static call to verify(...)")
        
        # 3. Call the 'verify' function with the 5 arguments
        is_valid = entrypoint_contract.functions.verify(
            _asset,
            _amount,
            _nullifier,
            _newCommitment,
            _proof_bytes
        ).call() # .call() makes this a free, off-chain check
        
        if is_valid:
            print("   -> [Verifier] ✅ ZK Proof passed validity check.")
        else:
            print("   -> [Verifier] ⚠️ ZK Proof FAILED validity check.")
        
        return is_valid
    
    except Exception as e:
        # This will catch errors if the ABI or function name is wrong
        print(f"   ❌ An error occurred during verification: {e}")
        return False