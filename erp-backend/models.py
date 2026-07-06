"""SQLAlchemy models for the Mini ERP backend.

The `db` instance is created here and initialized against the Flask app in
app.py (`db.init_app(app)`), which keeps model definitions free of app/config
imports and avoids circular imports.
"""
from datetime import datetime

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Project(db.Model):
    """A client construction project."""

    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    # e.g. "กำลังประเมินราคา" | "ระหว่างก่อสร้าง" | "ส่งมอบแล้ว"
    status = db.Column(db.String(50), nullable=False, default="กำลังประเมินราคา")

    financials = db.relationship(
        "FinancialTracking",
        backref="project",
        lazy=True,
        cascade="all, delete-orphan",
    )

    def to_dict(self):
        return {"id": self.id, "name": self.name, "status": self.status}


class FinancialTracking(db.Model):
    """Per-project financial tracking: BOQ budget vs actual cost + payments."""

    __tablename__ = "financial_tracking"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(
        db.Integer, db.ForeignKey("projects.id"), nullable=False
    )
    boq_budget = db.Column(db.Numeric(14, 2), nullable=False, default=0)
    actual_cost = db.Column(db.Numeric(14, 2), nullable=False, default=0)
    total_installment_paid = db.Column(
        db.Numeric(14, 2), nullable=False, default=0
    )

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "boq_budget": float(self.boq_budget or 0),
            "actual_cost": float(self.actual_cost or 0),
            "total_installment_paid": float(self.total_installment_paid or 0),
        }


class MaterialMarketPrice(db.Model):
    """Reference market price for a construction material."""

    __tablename__ = "material_market_prices"

    id = db.Column(db.Integer, primary_key=True)
    material_name = db.Column(db.String(255), nullable=False)
    current_price = db.Column(db.Numeric(12, 2), nullable=False)
    last_updated = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "material_name": self.material_name,
            "current_price": float(self.current_price or 0),
            "last_updated": (
                self.last_updated.isoformat() if self.last_updated else None
            ),
        }
