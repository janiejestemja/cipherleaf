from flask_login import UserMixin
from sqlalchemy.sql import func

from . import db

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(150))
    user_name = db.Column(db.String(100))
    # Setup a relationship to Notes
    notes = db.relationship("Note", backref="author" ,cascade="all, delete-orphan")
    # Setup a relationship to EncNotes (ciphertext)
    cipher_notes = db.relationship("CipherNote", backref="author" ,cascade="all, delete-orphan")


class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(10_000))
    date = db.Column(db.DateTime(timezone=True), default=func.now())
    # One to many relationship between user to notes
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

class CipherNote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ciphertext = db.Column(db.String(10_000), nullable=False)
    date = db.Column(db.DateTime(timezone=True), default=func.now())
    # One to many relationship between user to notes
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

