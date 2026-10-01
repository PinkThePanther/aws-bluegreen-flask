from flask import Flask, current_app, send_from_directory
from flask_cors import CORS
#from flask_sqlalchemy import SQLAlchemy 
import os
from pathlib import Path
from backend.controllers.auth_controller import signup, login
from backend.extensions import db
from backend.models.user import User
from backend.services.auth_service import ensure_demo_posts, ensure_demo_user
from backend.controllers.content_controller import (
    comments_controller,
    create_post_controller,
    get_posts_controller,
    like_post,
)
from backend.observability import configure_observability


PROJECT_ROOT = Path(__file__).resolve().parent
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"
DEFAULT_UPLOAD_FOLDER = (
    Path("/data/uploads")
    if Path("/data").is_dir()
    else PROJECT_ROOT / "instance" / "uploads"
)

app = Flask(__name__, static_folder=None)
configure_observability(app)


app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL",
    "sqlite:///bluegreen.db"
)
app.config["UPLOAD_FOLDER"] = os.getenv(
    "UPLOAD_FOLDER",
    str(DEFAULT_UPLOAD_FOLDER),
)
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024
db.init_app(app)


@app.errorhandler(413)
def upload_too_large(_error):
    return {"message": "Choose an image smaller than 8 MB"}, 413

#db = SQLAlchemy(app)

CORS(app)




# class User(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     username = db.Column(db.String(80), unique=True, nullable=False)
#     email = db.Column(db.String(120), unique=True, nullable=False)
#     password_hash = db.Column(db.String(255), nullable=False)
#     created_at = db.Column(db.DateTime)




# class Post(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
#     image_url = db.Column(db.String(255), nullable=False)
#     caption = db.Column(db.Text)
#     created_at = db.Column(db.DateTime)



# class Comment(db.Model):
#   id = db.Column(db.Integer, primary_key=True)
#   post_id = db.Column(db.Integer, db.ForeignKey("post.id"), nullable=False)
#   user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
#   content = db.Column(db.Text, nullable=False)
#   created_at = db.Column(db.DateTime)



with app.app_context():
    db.create_all()

    if os.getenv("DEMO_MODE", "false").lower() == "true":
        demo_account_action = ensure_demo_user()
        demo_posts_action = ensure_demo_posts()
        app.logger.info(
            "demo_content_ready account_action=%s posts_action=%s",
            demo_account_action,
            demo_posts_action,
        )


    # user = User (
    # username="testuser",
    # email="test@example.com",clear
    
    # password_hash="password"
    # )

    # db.session.add(user)
    # db.session.commit()
   

#users = User.query.all()

#for user in users:
    #print(user.username)

@app.get("/")
def home():
    if FRONTEND_DIST.is_dir():
        return send_from_directory(FRONTEND_DIST, "index.html")
    return "bluegreen api: OK\n"

@app.get("/health")
def health():
    # flip this later for green failures
    if os.getenv("FAIL_HEALTH") == "1":
        return ("unhealthy\n", 500)
    return "healthy\n", 200




# Routes
app.add_url_rule("/signup", view_func=signup, methods=["POST"])
app.add_url_rule("/login", view_func=login, methods=["POST"])
app.add_url_rule("/posts",view_func=create_post_controller,methods=["POST"])
app.add_url_rule("/posts", view_func=get_posts_controller, methods=["GET"])
app.add_url_rule("/posts/<int:post_id>/like", view_func=like_post, methods=["POST"])
app.add_url_rule(
    "/posts/<int:post_id>/comments",
    view_func=comments_controller,
    methods=["GET", "POST"],
)


@app.get("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)


@app.get("/<path:path>")
def frontend_files(path):
    """Serve built React assets and fall back to the SPA entry point."""
    requested_file = FRONTEND_DIST / path

    if requested_file.is_file():
        return send_from_directory(FRONTEND_DIST, path)

    if FRONTEND_DIST.is_dir():
        return send_from_directory(FRONTEND_DIST, "index.html")

    return {"message": "Frontend build not found"}, 404




if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
