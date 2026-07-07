"""Mini ERP backend — Flask + SQLAlchemy + PostgreSQL (Supabase).

Independent service from the Node.js proxy (../server.js). Runs on port 5001.
Database schema is managed with Flask-Migrate (Alembic) — run `flask db upgrade`.
"""
import os

from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv

# Import all models so Flask-Migrate can detect them for autogenerate.
from models import db, Project, FinancialTracking, MaterialMarketPrice  # noqa: F401

load_dotenv()

# Local dev default; override with DATABASE_URL (Supabase) in .env.
DEFAULT_DB_URI = "postgresql://postgres:postgres@localhost:5432/erp_db"


def normalize_db_uri(uri):
    """Make a connection string SQLAlchemy/Supabase-friendly."""
    if not uri:
        return DEFAULT_DB_URI
    # SQLAlchemy needs the 'postgresql://' dialect (some providers give 'postgres://').
    if uri.startswith("postgres://"):
        uri = uri.replace("postgres://", "postgresql://", 1)
    # Supabase (and most managed Postgres) require SSL; skip only for local.
    is_local = "localhost" in uri or "127.0.0.1" in uri
    if not is_local and "sslmode=" not in uri:
        uri += ("&" if "?" in uri else "?") + "sslmode=require"
    return uri


migrate = Migrate()


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config["SQLALCHEMY_DATABASE_URI"] = normalize_db_uri(
        os.getenv("DATABASE_URL", DEFAULT_DB_URI)
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    # pool_pre_ping keeps connections healthy behind Supabase's pooler.
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"pool_pre_ping": True}

    db.init_app(app)
    migrate.init_app(app, db)

    @app.route("/api/erp/health")
    def health():
        return jsonify({"status": "ok", "service": "erp-backend"})

    @app.route("/api/erp/projects")
    def list_projects():
        return jsonify([p.to_dict() for p in Project.query.all()])

    @app.route("/api/erp/materials")
    def list_materials():
        return jsonify([m.to_dict() for m in MaterialMarketPrice.query.all()])

    return app


app = create_app()


if __name__ == "__main__":
    # Schema is created/updated via migrations — run `flask db upgrade` first.
    app.run(host="0.0.0.0", port=5001, debug=True)
