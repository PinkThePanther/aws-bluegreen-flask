from datetime import datetime, timezone

from backend.dao.like_dao import count_likes, delete_like, find_like, save_like
from backend.extensions import db
from backend.models.user import Like, Post, User
from backend.services.auth_service import DEMO_EMAIL


def toggle_like(user_id, post_id):
    try:
        user_id = int(user_id)
        post_id = int(post_id)
    except (TypeError, ValueError):
        return {"message": "A valid user and post are required"}, 400

    user = db.session.get(User, user_id)
    post = db.session.get(Post, post_id)

    if user is None:
        return {"message": "User not found"}, 404

    if post is None:
        return {"message": "Post not found"}, 404

    if user.email == DEMO_EMAIL:
        return {"message": "Demo likes are temporary and stay in the browser"}, 403

    existing_like = find_like(user_id, post_id)

    if existing_like is None:
        save_like(
            Like(
                user_id=user_id,
                post_id=post_id,
                created_at=datetime.now(timezone.utc).replace(tzinfo=None),
            )
        )
        liked = True
    else:
        delete_like(existing_like)
        liked = False

    return {
        "message": "Post liked" if liked else "Like removed",
        "liked": liked,
        "likes": count_likes(post_id),
    }, 200
