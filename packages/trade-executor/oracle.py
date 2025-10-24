import requests
from config import PYTH_HERMES_URL

def get_live_prices(price_feed_ids):
    price_data = {}
    if not price_feed_ids: return {}
    try:
        ids_query = "&".join([f"ids[]={id}" for id in price_feed_ids])
        url = f"{PYTH_HERMES_URL}/api/latest_price_feeds?{ids_query}"
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        for feed in data:
            feed_id_from_api = feed.get("id")
            if feed_id_from_api:
                price_info = feed.get("price", {})
                price_val = int(price_info.get("price", 0))
                expo = int(price_info.get("expo", 0))
                full_feed_id = "0x" + feed_id_from_api
                price_data[full_feed_id] = price_val * (10 ** expo)
        
        print(f"[Oracle] Fetched prices from Pyth: {price_data}")
        return price_data
    except Exception as e:
        print(f"[Oracle] Warning: Pyth Oracle failed: {e}.")
        return {}