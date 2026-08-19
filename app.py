from flask import Flask
from flask_cors import CORS
#from flask_sqlalchemy import SQLAlchemy 
import os
from backend.controllers.auth_controller import signup, login
from backend.extensions import db
from backend.models.user import User
from backend.controllers.content_controller import create_post_controller, get_posts_controller


app = Flask(__name__)


app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///bluegreen.db"
db.init_app(app)

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
    users = User.query.all()

    for user in users:
        print(user.username)


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
    return "green: OK\n"

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




if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)