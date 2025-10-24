import requests
import json
from config import FHE_ENGINE_URL

def is_condition_met(strategy, current_price):
    print(f"   -> [FHE Client] Consulting REAL Rust FHE Engine for strategy '{strategy['id']}'...")
    try:
        payload = {
            "strategy_type": strategy["strategy_type"],
            "encrypted_upper_bound": json.loads(strategy["encrypted_upper_bound"]),
            "encrypted_lower_bound": json.loads(strategy["encrypted_lower_bound"]),
            "server_key": json.loads(strategy["server_key"]),
            "current_price_cents": int(current_price * 100),
            "encrypted_client_key": json.loads(strategy['encrypted_client_key']),
        }
        
        response = requests.post(FHE_ENGINE_URL, json=payload, timeout=3000)
        response.raise_for_status()
        result = response.json()
        
        if result.get("is_triggered", False):
            print(f"   <- [FHE Client] Response from Rust: Condition MET.")
            return True
        else:
            print(f"   <- [FHE Client] Response from Rust: Condition NOT met.")
            return False
    except Exception as e:
        print(f"   <- [FHE Client] ❌ An error occurred: {e}")
        return False