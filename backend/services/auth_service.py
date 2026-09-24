from backend.extensions import db
from backend.models.user import User
from werkzeug.security import generate_password_hash,check_password_hash
from sqlalchemy import select,or_


DEMO_USERNAME = "demo"
DEMO_EMAIL = "demo@bluegreen.app"
DEMO_PASSWORD = "DemoOnly123!"


def ensure_demo_user():
    """Create or refresh the disposable demo account when demo mode is enabled."""
    stmt = select(User).where(
        or_(
            User.email == DEMO_EMAIL,
            User.username == DEMO_USERNAME
        )
    )
    user = db.session.scalar(stmt)

    if user is None:
        user = User(
            username=DEMO_USERNAME,
            email=DEMO_EMAIL,
            password_hash=generate_password_hash(DEMO_PASSWORD)
        )
        db.session.add(user)
        action = "created"
    else:
        user.username = DEMO_USERNAME
        user.email = DEMO_EMAIL
        user.password_hash = generate_password_hash(DEMO_PASSWORD)
        action = "refreshed"

    db.session.commit()
    return action


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


def authenticate_user(identifier, password):
    stmt = select(User).where(
        or_(
            User.email == identifier,
            User.username == identifier
        )
    )

    user = db.session.scalar(stmt)

    if user is None:
        return False

    return check_password_hash(user.password_hash, password)
