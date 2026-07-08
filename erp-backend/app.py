"""Mini ERP backend — Flask + SQLAlchemy + PostgreSQL (Supabase).

Independent service from the Node.js proxy (../server.js). Runs on port 5001.
Database schema is managed with Flask-Migrate (Alembic) — run `flask db upgrade`.
"""
import os

from flask import Flask, jsonify, request
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
        items = MaterialMarketPrice.query.order_by(
            MaterialMarketPrice.material_name
        ).all()
        return jsonify([m.to_dict() for m in items])

    def _parse_price(value):
        """Return (price, error). price is float when valid."""
        try:
            return float(value), None
        except (TypeError, ValueError):
            return None, "current_price must be a number"

    @app.route("/api/erp/materials", methods=["POST"])
    def create_material():
        data = request.get_json(silent=True) or {}
        name = (data.get("material_name") or "").strip()
        if not name:
            return jsonify({"error": "material_name is required"}), 400
        price, err = _parse_price(data.get("current_price", 0))
        if err:
            return jsonify({"error": err}), 400
        m = MaterialMarketPrice(material_name=name, current_price=price)
        db.session.add(m)
        db.session.commit()
        return jsonify(m.to_dict()), 201

    @app.route("/api/erp/materials/<int:material_id>", methods=["PUT", "PATCH"])
    def update_material(material_id):
        m = db.session.get(MaterialMarketPrice, material_id)
        if m is None:
            return jsonify({"error": "not found"}), 404
        data = request.get_json(silent=True) or {}
        if "material_name" in data:
            name = (data.get("material_name") or "").strip()
            if not name:
                return jsonify({"error": "material_name cannot be empty"}), 400
            m.material_name = name
        if "current_price" in data:
            price, err = _parse_price(data.get("current_price"))
            if err:
                return jsonify({"error": err}), 400
            m.current_price = price
        db.session.commit()
        return jsonify(m.to_dict())

    @app.route("/api/erp/materials/<int:material_id>", methods=["DELETE"])
    def delete_material(material_id):
        m = db.session.get(MaterialMarketPrice, material_id)
        if m is None:
            return jsonify({"error": "not found"}), 404
        db.session.delete(m)
        db.session.commit()
        return jsonify({"deleted": material_id})

    return app


app = create_app()


if __name__ == "__main__":
    # Schema is created/updated via migrations — run `flask db upgrade` first.
    app.run(host="0.0.0.0", port=5001, debug=True)
