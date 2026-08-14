from backend.extensions import db



class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime)






class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    image_url = db.Column(db.String(255), nullable=False)
    caption = db.Column(db.Text)
    created_at = db.Column(db.DateTime)



    class Comment(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        post_id = db.Column(db.Integer, db.ForeignKey("post.id"), nullable=False)
        user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
        content = db.Column(db.Text, nullable=False)
        created_at = db.Column(db.DateTime)



