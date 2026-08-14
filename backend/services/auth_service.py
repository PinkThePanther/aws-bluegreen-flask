from backend.extensions import db
from backend.models.user import User
from werkzeug.security import generate_password_hash,check_password_hash
from sqlalchemy import select
#class AuthService:
def register_user(username, email, password):
    user = User(
     username = username,
     email = email,
     password_hash = generate_password_hash(password)
     )
    db.session.add(user)
    db.session.commit()
    return {
        "message": "User created successfully"
    }, 201


def authenticate_user(email, password):
    stmt = select(User).where(User.email == email)
    user = db.session.scalar(stmt)

    if user is None:
        return False

    return check_password_hash(user.password_hash, password)
    