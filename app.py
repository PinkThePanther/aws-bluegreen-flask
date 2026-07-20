from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy 
import os

app = Flask(__name__)


app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///bluegreen.db"

db = SQLAlchemy(app)

CORS(app)



class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

with app.app_context():
    db.create_all()
   

@app.get("/")
def home():
    return "green: OK\n"

@app.get("/health")
def health():
    # flip this later for green failures
    if os.getenv("FAIL_HEALTH") == "1":
        return ("unhealthy\n", 500)
    return "healthy\n", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)