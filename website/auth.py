from flask import Blueprint, current_app, render_template, request, redirect, url_for, flash
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.security import check_password_hash, generate_password_hash
import os
import shutil

from . import db
from .models import User

auth = Blueprint("auth", __name__)


@auth.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        user_name = request.form.get("user_name")
        email = request.form.get("email")
        passwordA = request.form.get("passwordA")
        passwordB = request.form.get("passwordB")

        user = User.query.filter_by(email=email).first()

        if user:
            flash("Email is already signed up.", category="error")

        # Placeholder validation
        elif len(email) <= 0:
            flash("Email must be greater than 0 characters.", category="error")
        elif passwordA != passwordB:
            flash("Passwords do not match.", category="error")
        elif len(passwordA) < 8:
            flash("Password must be at least 8 characters.", category="error")

        # Create new user
        else:
            new_user = User(
                email=email,
                user_name=user_name,
                password=generate_password_hash(passwordA)
            )

            # Add User to Database
            db.session.add(new_user)
            db.session.commit()

            # Create the user-specific directories
            user_dir = os.path.join(
                current_app.root_path,
                "filesystem",
                str(new_user.id)
            )
            img_dir = os.path.join(user_dir, "img")
            text_dir = os.path.join(user_dir, "text")

            # Create the directories if they don't exist
            os.makedirs(user_dir, exist_ok=True)
            os.makedirs(img_dir, exist_ok=True)
            os.makedirs(text_dir, exist_ok=True)

            # Create a session right after signing up
            login_user(new_user, remember=True)
            flash("Account created.", category="success")

            return redirect(url_for("views.home"))

    return render_template("signup.html", user=current_user)


@auth.route("/signout", methods=["GET", "POST"])
@login_required
def signout():
    # User Deletion
    if request.method == "POST":
        email = request.form.get("email")
        user_name = request.form.get("user_name")
        passwordA = request.form.get("passwordA")
        passwordB = request.form.get("passwordB")

        # Check Username and Email Adress
        if user_name != current_user.user_name:
            flash("Unexpected Username", category="error")
        elif email != current_user.email:
            flash("Unexpected Email Adress", category="error")
        # Check passwords
        elif passwordA != passwordB:
            flash("Passwords do not match.", category="error")
        elif not check_password_hash(current_user.password, passwordA):
            flash("Incorrect Password.", category="error")
        else:
            user_dir = os.path.join(
                current_app.root_path,
                "filesystem",
                str(current_user.id)
            )
            if os.path.exists(user_dir):
                shutil.rmtree(user_dir)

            db.session.delete(current_user)
            db.session.commit()

            logout_user()

            flash("Your account has been deleted.", category="success")
            return redirect(url_for("auth.login"))

    return render_template("signout.html", user=current_user)


@auth.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        passwordA = request.form.get("passwordA")

        # Query Database
        user = User.query.filter_by(email=email).first()
        if user:
            if check_password_hash(user.password, passwordA):
                # Create a session
                login_user(user, remember=True)

                # Flashing login message
                flash("Logged in successfully.", category="success")
                return redirect(url_for("views.home"))

            else:
                flash("Incorrect credentials.", category="error")
        else:
            flash("Account not found.", category="error")

    return render_template("login.html", user=current_user)


@auth.route("/logout")
@login_required
def logout():
    # Ending users session
    logout_user()
    flash("Logout successful.", category="success")
    return redirect(url_for("auth.login"))
