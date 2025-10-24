import os
from app import app, db
from config import DATABASE_URI

# This script is for one-time database initialization.
# It ensures the 'strategies.db' file and tables exist before the server starts.

if not DATABASE_URI or not DATABASE_URI.startswith('sqlite:'):
    raise ValueError("DATABASE_URI is not set or not a valid sqlite path in your .env file.")

print(f"Initializing database at: {app.config['SQLALCHEMY_DATABASE_URI']}")

# Create the database and all tables within the app context
with app.app_context():
    db.create_all()

print("✅ Database tables created/verified successfully.")