from backend.extensions import db
from backend.models.user import Post


def create_post(user_id, image_url, caption):
    post = Post(
        user_id=user_id,
        image_url=image_url,
        caption=caption
    )

    db.session.add(post)
    db.session.commit()

    return {
        "message": "Post created successfully"
    }, 201


def get_posts():
    posts = Post.query.all()

    return posts