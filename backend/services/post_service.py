from backend.extensions import db
from backend.models.user import Post, User
from backend.services.auth_service import DEMO_EMAIL
from datetime import datetime, timezone
from flask import current_app
from pathlib import Path
from uuid import uuid4
from werkzeug.utils import secure_filename
from sqlalchemy.exc import SQLAlchemyError


ALLOWED_IMAGE_EXTENSIONS = {"gif", "jpeg", "jpg", "png", "webp"}


def save_uploaded_image(image):
    if image is None or not image.filename:
        return None

    original_name = secure_filename(image.filename)
    extension = Path(original_name).suffix.lower().lstrip(".")

    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValueError("Choose a GIF, JPEG, PNG, or WebP image")

    upload_folder = Path(current_app.config["UPLOAD_FOLDER"])
    upload_folder.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid4().hex}.{extension}"
    image.save(upload_folder / stored_name)

    return f"/uploads/{stored_name}"


def create_post(user_id, image_url, caption, image=None):
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return {"message": "A valid user is required"}, 400

    user = db.session.get(User, user_id)

    if user is None:
        return {"message": "User not found"}, 404

    if user.email == DEMO_EMAIL:
        return {"message": "Demo posts are temporary and stay in the browser"}, 403

    try:
        uploaded_image_url = save_uploaded_image(image)
    except ValueError as error:
        return {"message": str(error)}, 400
    except OSError:
        current_app.logger.exception("post_image_upload_failed")
        return {"message": "Unable to upload that image. Please try again"}, 500

    caption = (caption or "").strip()
    image_url = uploaded_image_url or image_url or ""

    if not caption and not image_url:
        return {"message": "Write something or add a photo"}, 400

    post = Post(
        user_id=user_id,
        image_url=image_url,
        caption=caption,
        created_at=datetime.now(timezone.utc).replace(tzinfo=None),
    )

    db.session.add(post)
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("post_database_write_failed")
        return {"message": "Unable to save that post. Please try again"}, 500

    return {
        "message": "Post created successfully",
        "post": {
            "id": post.id,
            "user_id": post.user_id,
            "image_url": post.image_url,
            "caption": post.caption,
            "created_at": post.created_at.isoformat(),
        },
    }, 201


def get_posts():
    return (
        Post.query
        .order_by(Post.created_at.desc(), Post.id.desc())
        .limit(20)
        .all()
    )
