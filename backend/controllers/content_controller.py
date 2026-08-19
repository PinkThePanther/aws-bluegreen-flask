# backend/controllers/content_controller.py
from flask import request
from backend.services.post_service import create_post, get_posts

def get_posts_controller():
    posts = get_posts()

    return [
        {
            "id": post.id,
            "user_id": post.user_id,
            "image_url": post.image_url,
            "caption": post.caption,
            "created_at": post.created_at
        }
        for post in posts
    ]


def create_post_controller():
    data = request.get_json()

    user_id = data.get("user_id")
    image_url = data.get("image_url")
    caption = data.get("caption")

    return create_post(user_id, image_url, caption)


def like_post():
    pass


def comment_post():
    pass