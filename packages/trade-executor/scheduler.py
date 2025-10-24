import time
from database import db, Strategy
from oracle import get_live_prices
from fhe_client import is_condition_met
from trade_executor import execute_trade
from config import CHECK_INTERVAL_SECONDS, PYTH_PRICE_FEED_IDS

def worker_loop(app):
    print("[Scheduler] Starting worker loop..")
    while True:
        try:
            with app.app_context():
                pending_strategies = Strategy.query.filter_by(status='PENDING').all()
                if not pending_strategies:
                    time.sleep(CHECK_INTERVAL_SECONDS)
                    continue

                strategies_to_process = [s.to_dict() for s in pending_strategies]
                
                eth_feed_id = PYTH_PRICE_FEED_IDS.get("ETH")
                if not eth_feed_id:
                    print("[Scheduler] Error: ETH Price Feed ID not found in config.")
                    time.sleep(CHECK_INTERVAL_SECONDS)
                    continue

                live_prices = get_live_prices([eth_feed_id])
                
                if eth_feed_id not in live_prices:
                    print("[Scheduler] Warning: ETH price not available from oracle this cycle. Retrying.")
                    continue

                current_eth_price = live_prices[eth_feed_id]
                print(f"[Scheduler] Current ETH price: ${current_eth_price:,.2f}")

                for strategy_dict in strategies_to_process:
                    if is_condition_met(strategy_dict, current_eth_price):
                        execute_trade(strategy_dict, current_eth_price)
                        strategy_to_update = Strategy.query.get(strategy_dict['id'])
                        if strategy_to_update:
                            strategy_to_update.status = 'EXECUTED'
                            db.session.commit()

        except Exception as e:
            print(f"[Scheduler] An error occurred: {e}")
        time.sleep(CHECK_INTERVAL_SECONDS)