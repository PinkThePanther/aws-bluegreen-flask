from backend.extensions import db
from backend.models.user import Comment
from sqlalchemy import select


def save_comment(comment):
    db.session.add(comment)
    db.session.commit()
    return comment


def find_comments_by_post(post_id):
    return db.session.scalars(
        select(Comment)
        .where(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc(), Comment.id.asc())
    ).all()
