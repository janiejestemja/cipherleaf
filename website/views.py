import json
from flask import Blueprint, render_template, request, flash, jsonify
from flask_login import current_user, login_required

from . import db
from .models import Note, CipherNote

views = Blueprint("views", __name__)

@views.route("/", methods=["GET"])
@login_required
def home():
    return render_template("home.html", user=current_user)

@views.route("/demo", methods=["GET"])
def demo():
    return render_template("demo.html", user=current_user)

@views.route("/lorem-cipher", methods=["GET"])
def lorem_cipher():
    return render_template("lorem_cipher.html", user=current_user)

@views.route("/notes", methods=["GET", "POST"])
@login_required
def notes():
    # Creation of a Note by the user
    if request.method == "POST":
        note = request.form.get("note")

        if len(note) < 1:
            flash("Note is too short.", category="error")

        else:
            new_note = Note(text=note, user_id=current_user.id)

            db.session.add(new_note)
            db.session.commit()

            flash("Note added.", category="success")

    return render_template("notes.html", user=current_user)

@views.route("/delete-note", methods=["POST"])
@login_required
def delete_note():
    # Extracting noteId
    note = json.loads(request.data)
    noteId = note["noteId"]
    note = Note.query.get(noteId)
    if note:
        if note.user_id == current_user.id:
            db.session.delete(note)
            db.session.commit()
            flash("Note deleted.", category="info")

    # Returning empty response
    return jsonify({})

@views.route("/save-cipher-hex", methods=["GET", "POST"])
@login_required
def save_cipher_hex():
    if request.method == "POST":
        note = json.loads(request.data)
        cipher_hex = note["cipherHex"]
        print("CipherHex recieved: ", cipher_hex)

        if len(cipher_hex) < 1:
            flash("Note is too short.", category="error")
        else:
            new_cipher_hex = CipherNote(ciphertext=cipher_hex, user_id=current_user.id)
            db.session.add(new_cipher_hex)
            db.session.commit()

            flash("CipherHex added.", category="success")

    return jsonify({})

@views.route("/delete-cipher-hex", methods=["POST"])
@login_required
def delete_cipher_hex():
    # Extracting noteId
    note = json.loads(request.data)
    noteId = note["noteId"]
    note = CipherNote.query.get(noteId)
    if note:
        if note.user_id == current_user.id:
            db.session.delete(note)
            db.session.commit()
            flash("CipherHex deleted.", category="info")

    # Returning empty response
    return jsonify({})

