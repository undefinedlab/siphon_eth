from flask_sqlalchemy import SQLAlchemy
import uuid
from sqlalchemy.types import JSON  # optional but recommended

# ✅ Initialize db first
db = SQLAlchemy()

class Strategy(db.Model):
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String, nullable=False)
    strategy_type = db.Column(db.String, nullable=False)
    asset_in = db.Column(db.String, nullable=False)
    asset_out = db.Column(db.String, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    price_feed_id = db.Column(db.String, nullable=True)
    recipient_address = db.Column(db.String, nullable=False)
    zkp_data = db.Column(JSON, nullable=True)
    encrypted_upper_bound = db.Column(JSON, nullable=False)
    encrypted_lower_bound = db.Column(JSON, nullable=False)
    server_key = db.Column(db.Text, nullable=False)
    encrypted_client_key = db.Column(db.Text, nullable=False)
    status = db.Column(db.String, default='PENDING', nullable=False)

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
