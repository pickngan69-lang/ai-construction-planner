"""Mini ERP backend — Flask + SQLAlchemy + PostgreSQL.

Independent service from the Node.js proxy (../server.js). Runs on port 5001
to avoid conflicts with the Node backend (5000) and Vite dev server (5173).
"""
import os

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from models import db, Project, FinancialTracking, MaterialMarketPrice

load_dotenv()

# Default is a local dev URI; override with DATABASE_URL in .env for real use.
DEFAULT_DB_URI = "postgresql://postgres:postgres@localhost:5432/erp_db"


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", DEFAULT_DB_URI
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    @app.route("/api/erp/health")
    def health():
        return jsonify({"status": "ok", "service": "erp-backend"})

    @app.route("/api/erp/projects")
    def list_projects():
        projects = Project.query.all()
        return jsonify([p.to_dict() for p in projects])

    @app.route("/api/erp/materials")
    def list_materials():
        materials = MaterialMarketPrice.query.all()
        return jsonify([m.to_dict() for m in materials])

    return app


app = create_app()


if __name__ == "__main__":
    # Create tables on first run (requires a reachable PostgreSQL instance).
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5001, debug=True)
