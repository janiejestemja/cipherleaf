from os import path, getenv

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

db = SQLAlchemy()
DB_NAME = "database.db"

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = getenv("FLASK_SECRET_KEY", "fallback_secret_key")
    app.config.update(
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
    )

    from .views import views
    from .auth import auth
    from .textfiles import textfiles

    app.register_blueprint(views, url_prefix="/")
    app.register_blueprint(auth, url_prefix="/")
    app.register_blueprint(textfiles, url_prefix="/")

    # Initialise database
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_NAME}"
    db.init_app(app)
    from .models import User
    # Creation of database if it does not exist
    if not path.exists("instance/" + DB_NAME):
        with app.app_context():
            db.create_all()
        print("Database created.")

    # Manage not logged in users
    login_manager = LoginManager()
    login_manager.login_view = "auth.login"
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(id):
        return User.query.get(int(id))

    return app

