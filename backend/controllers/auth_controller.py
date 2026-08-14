from flask import request, jsonify
from backend.services.auth_service import (register_user,authenticate_user,
)


def signup():
    """
    Handle user signup requests.
    """
    data = request.get_json()

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    return register_user(username, email, password)


def login():
    """
    Handle user login requests.
    """
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")


    if authenticate_user(email, password):
        return {
            "message": "Login successful"
        }, 200

    return {
        "message": "Invalid email or password"
    }, 401

    