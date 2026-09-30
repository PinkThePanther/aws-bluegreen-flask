from backend.extensions import db
from backend.models.user import Post, User
from werkzeug.security import generate_password_hash,check_password_hash
from sqlalchemy import select,or_


DEMO_USERNAME = "demo"
DEMO_EMAIL = "demo@bluegreen.app"
DEMO_PASSWORD = "DemoOnly123!"
DEMO_POSTS = (
    {
        "caption": "Testing the stable Blue release before previewing Green.",
        "image_url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "caption": "The same account and feed stay visible across the deployment demo.",
        "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    },
)


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


def ensure_demo_posts():
    """Seed a predictable portfolio feed without duplicating it on restart."""
    user = db.session.scalar(select(User).where(User.email == DEMO_EMAIL))

    if user is None:
        raise RuntimeError("Demo user must exist before demo posts are seeded")

    existing_post = db.session.scalar(
        select(Post.id).where(Post.user_id == user.id).limit(1)
    )
    if existing_post is not None:
        return "existing"

    db.session.add_all(
        Post(user_id=user.id, **post_data)
        for post_data in DEMO_POSTS
    )
    db.session.commit()
    return "created"


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
        return None

    if not check_password_hash(user.password_hash, password):
        return None

    return user
