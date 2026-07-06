# ERP Backend (Mini ERP Core)

Independent Python/Flask/PostgreSQL service for the ERP module. Separate from
the Node.js proxy (`../server.js`) — runs on **port 5001**.

## Setup

```bash
cd erp-backend
python -m venv venv
# Windows:  venv\Scripts\activate    |  macOS/Linux:  source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then edit DATABASE_URL
python app.py                 # http://localhost:5001
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/erp/health` | Health check |
| GET | `/api/erp/projects` | List projects |
| GET | `/api/erp/materials` | List material market prices |

## Models (`models.py`)

- **Project** — `id`, `name`, `status`
- **FinancialTracking** — `id`, `project_id`, `boq_budget`, `actual_cost`, `total_installment_paid`
- **MaterialMarketPrice** — `id`, `material_name`, `current_price`, `last_updated`

> `db.create_all()` runs on startup and needs a reachable PostgreSQL instance
> (configured via `DATABASE_URL`).
