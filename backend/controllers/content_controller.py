# backend/controllers/content_controller.py
from flask import request
from backend.dao.like_dao import count_likes, find_like
from backend.services.interaction_service import toggle_like
from backend.services.post_service import create_post, get_posts

def get_posts_controller():
    posts = get_posts()
    user_id = request.args.get("user_id", type=int)

    return [
        {
            "id": post.id,
            "user_id": post.user_id,
            "image_url": post.image_url,
            "caption": post.caption,
            "created_at": post.created_at,
            "likes": count_likes(post.id),
            "liked": bool(user_id and find_like(user_id, post.id)),
        }
        for post in posts
    ]


def create_post_controller():
    if request.files or request.form:
        data = request.form
        image = request.files.get("image")
        image_url = None
    else:
        data = request.get_json(silent=True) or {}
        image = None
        image_url = data.get("image_url")

    user_id = data.get("user_id")
    caption = data.get("caption")

    return create_post(user_id, image_url, caption, image=image)


def like_post(post_id):
    data = request.get_json(silent=True) or {}
    return toggle_like(data.get("user_id"), post_id)


def comment_post():
    pass
