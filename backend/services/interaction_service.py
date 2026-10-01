from datetime import datetime, timezone

from backend.dao.comment_dao import find_comments_by_post, save_comment
from backend.dao.like_dao import count_likes, delete_like, find_like, save_like
from backend.extensions import db
from backend.models.user import Comment, Like, Post, User
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


def serialize_comment(comment):
    user = db.session.get(User, comment.user_id)
    return {
        "id": comment.id,
        "post_id": comment.post_id,
        "user_id": comment.user_id,
        "username": user.username if user else "Unknown user",
        "content": comment.content,
        "created_at": comment.created_at.isoformat(),
    }


def get_comments(post_id):
    return [
        serialize_comment(comment)
        for comment in find_comments_by_post(post_id)
    ]


def add_comment(user_id, post_id, content):
    try:
        user_id = int(user_id)
        post_id = int(post_id)
    except (TypeError, ValueError):
        return {"message": "A valid user and post are required"}, 400

    user = db.session.get(User, user_id)
    post = db.session.get(Post, post_id)
    content = (content or "").strip()

    if user is None:
        return {"message": "User not found"}, 404

    if post is None:
        return {"message": "Post not found"}, 404

    if user.email == DEMO_EMAIL:
        return {"message": "Demo comments are temporary and stay in the browser"}, 403

    if not content:
        return {"message": "Write a comment before posting"}, 400

    if len(content) > 500:
        return {"message": "Comments must be 500 characters or fewer"}, 400

    comment = save_comment(
        Comment(
            user_id=user_id,
            post_id=post_id,
            content=content,
            created_at=datetime.now(timezone.utc).replace(tzinfo=None),
        )
    )

    return {
        "message": "Comment added",
        "comment": serialize_comment(comment),
    }, 201
