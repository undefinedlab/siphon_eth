from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import os
import json
from database import db, Strategy
from scheduler import worker_loop
from config import DATABASE_URI, PYTH_PRICE_FEED_IDS
from verifier import verify_strategy_offchain

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# This check ensures the scheduler starts in Gunicorn and not twice in Flask debug mode.
if not app.debug or os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
    
    print("--- Starting the background scheduler thread ---")
    scheduler_thread = threading.Thread(target=worker_loop, args=(app,), daemon=True)
    scheduler_thread.start()

@app.route('/createStrategy', methods=['POST'])
def create_strategy():
    data = request.json
    if not data: return jsonify({"error": "Invalid JSON"}), 400

    if not verify_strategy_offchain(data):
        return jsonify({"status": "error", "message": "Strategy failed initial ZKP check."}), 400
    
    try:
        strategy_type = data.get("strategy_type", "")
        token_symbol = data.get('asset_in') if "LONG" in strategy_type or "SELL" in strategy_type else data.get('asset_out')

        new_strategy = Strategy(
            user_id=data['user_id'],
            strategy_type=strategy_type,
            asset_in=data['asset_in'],
            asset_out=data['asset_out'],
            amount=data['amount'],
            recipient_address=data['recipient_address'],
            encrypted_upper_bound=json.dumps(data.get('encrypted_upper_bound')),
            encrypted_lower_bound=json.dumps(data.get('encrypted_lower_bound')),
            server_key=json.dumps(data.get('server_key')),
            encrypted_client_key=json.dumps(data.get('encrypted_client_key')),
            zkp_data=data['zkp_data']
        )
        db.session.add(new_strategy)
        db.session.commit()
        return jsonify({"status": "success", "strategy_id": new_strategy.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500