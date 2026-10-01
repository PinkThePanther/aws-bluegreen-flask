from backend.extensions import db
from backend.models.user import Like
from sqlalchemy import func, select


def find_like(user_id, post_id):
    return db.session.scalar(
        select(Like).where(
            Like.user_id == user_id,
            Like.post_id == post_id,
        )
    )


def save_like(like):
    db.session.add(like)
    db.session.commit()
    return like


def delete_like(like):
    db.session.delete(like)
    db.session.commit()


def count_likes(post_id):
    return db.session.scalar(
        select(func.count(Like.id)).where(Like.post_id == post_id)
    )
