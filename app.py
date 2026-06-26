from flask import Flask
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

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