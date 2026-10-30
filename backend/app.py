import hmac
import io
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from PIL import Image, UnidentifiedImageError

if __package__:
    from .model_service import ModelService
else:
    from model_service import ModelService


BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent
load_dotenv(PROJECT_DIR / ".env")

app = Flask(__name__)
app.config.update(
    SECRET_KEY=os.getenv("FLASK_SECRET_KEY", "local-demo-only-change-before-sharing"),
    MAX_CONTENT_LENGTH=12 * 1024 * 1024,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False,
)
CORS(
    app,
    resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}},
    supports_credentials=True,
)

model_service = ModelService(PROJECT_DIR / "backend" / "models")
DATABASE_PATH = BACKEND_DIR / "history.sqlite3"
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}


def get_database():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute(
        """CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            filename TEXT NOT NULL,
            predicted_class TEXT NOT NULL,
            model_name TEXT NOT NULL,
            created_at TEXT NOT NULL
        )"""
    )
    return connection


@contextmanager
def database_connection():
    connection = get_database()
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def require_login():
    if not session.get("user_email"):
        return jsonify(error="Please log in to continue.", code="login_required"), 401
    return None


def valid_image_upload(file_storage):
    filename = file_storage.filename or ""
    suffix = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if suffix not in ALLOWED_EXTENSIONS:
        return None, ("Use a JPG, JPEG, or PNG image.", 400)

    image_bytes = file_storage.read()
    if not image_bytes:
        return None, ("The selected image is empty.", 400)

    try:
        with Image.open(io.BytesIO(image_bytes)) as image:
            image.verify()
    except (UnidentifiedImageError, OSError, ValueError):
        return None, ("The selected file is not a readable image.", 400)

    return image_bytes, None


@app.get("/api/health")
def health():
    model_status = model_service.status()
    return jsonify(
        status="ready" if model_status["ready"] else "model_unavailable",
        backend="ready",
        model=model_status,
    )


@app.get("/api/session")
def get_session():
    email = session.get("user_email")
    return jsonify(authenticated=bool(email), user={"email": email} if email else None)


@app.post("/api/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))
    expected_email = os.getenv("DEMO_EMAIL", "reviewer@example.com").strip().lower()
    expected_password = os.getenv("DEMO_PASSWORD", "demo1234")

    if not email or not password:
        return jsonify(error="Enter both your email and password."), 400
    if not hmac.compare_digest(email, expected_email) or not hmac.compare_digest(password, expected_password):
        return jsonify(error="Those login details do not match the local demo account."), 401

    session.clear()
    session["user_email"] = email
    return jsonify(message="Login successful.", user={"email": email})


@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify(message="You have been logged out.")


@app.get("/api/history")
def history():
    login_error = require_login()
    if login_error:
        return login_error

    with database_connection() as connection:
        rows = connection.execute(
            """SELECT id, filename, predicted_class, model_name, created_at
               FROM predictions WHERE user_email = ? ORDER BY id DESC LIMIT 100""",
            (session["user_email"],),
        ).fetchall()
    return jsonify(items=[dict(row) for row in rows])


@app.post("/api/predict")
def predict():
    login_error = require_login()
    if login_error:
        return login_error

    image_file = request.files.get("image")
    if image_file is None or not image_file.filename:
        return jsonify(error="Choose an image to analyze."), 400
    image_bytes, upload_error = valid_image_upload(image_file)
    if upload_error:
        message, status_code = upload_error
        return jsonify(error=message), status_code

    status = model_service.status()
    if not status["ready"]:
        return jsonify(
            error="Prediction is disabled because a compatible trained colon model is not installed.",
            code="model_unavailable",
            model=status,
        ), 503

    try:
        result = model_service.predict(image_bytes)
    except Exception:
        app.logger.exception("Model inference failed")
        return jsonify(error="The model could not process this image."), 500

    timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with database_connection() as connection:
        connection.execute(
            """INSERT INTO predictions
               (user_email, filename, predicted_class, model_name, created_at)
               VALUES (?, ?, ?, ?, ?)""",
            (
                session["user_email"],
                Path(image_file.filename).name,
                result["predicted_class"],
                result["classifier_name"],
                timestamp,
            ),
        )

    return jsonify(
        filename=Path(image_file.filename).name,
        predicted_class=result["predicted_class"],
        confidence=result.get("confidence"),
        classifier_name=result["classifier_name"],
        pipeline="SimpleColonCNN (128x128 RGB, float32 / 255)",
        created_at=timestamp,
    )


@app.errorhandler(413)
def file_too_large(_error):
    return jsonify(error="Image exceeds the 12 MB upload limit."), 413


@app.errorhandler(500)
def internal_error(_error):
    return jsonify(error="The server could not complete the request."), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("FLASK_PORT", "5001")), debug=os.getenv("FLASK_DEBUG") == "1")