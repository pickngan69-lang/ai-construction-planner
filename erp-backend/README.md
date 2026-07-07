# ERP Backend (Mini ERP Core)

Independent Python/Flask service for the ERP module — **PostgreSQL on Supabase**.
Separate from the Node.js proxy (`../server.js`). Runs on **port 5001**.
Schema is managed with **Flask-Migrate (Alembic)**.

## 1. Setup

```bash
cd erp-backend
python -m venv venv
# Windows:  venv\Scripts\activate    |  macOS/Linux:  source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # แล้วใส่ DATABASE_URL (ดูข้อ 2)
```

## 2. ต่อ Supabase (DATABASE_URL)

Supabase Dashboard → **Project Settings → Database → Connection string → URI**

- **Direct connection** (port `5432`) — ใช้ตอนรัน **migrations** และ dev ทั่วไป
- **Connection Pooler / Supavisor** (port `6543`, Transaction mode) — ใช้เป็น **runtime ตอน production** (ทน connection เยอะ)

ใส่ลง `erp-backend/.env`:
```
DATABASE_URL=postgresql://postgres.xxxx:[PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres
```
> `app.py` เติม `sslmode=require` ให้อัตโนมัติสำหรับ host ที่ไม่ใช่ localhost และแปลง `postgres://` → `postgresql://` ให้ · มี `pool_pre_ping` กัน connection หลุด

## 3. Migrations (Flask-Migrate)

```bash
flask db init                          # ครั้งแรกครั้งเดียว — สร้างโฟลเดอร์ migrations/
flask db migrate -m "initial schema"   # สร้าง migration จาก models.py
flask db upgrade                       # apply เข้า Supabase
```
> ครั้งต่อไปที่แก้ `models.py`: `flask db migrate -m "..."` แล้ว `flask db upgrade`
> (flask ตรวจเจอ `app.py` อัตโนมัติ; ถ้าไม่เจอให้ตั้ง `FLASK_APP=app.py`)

## 4. Run

```bash
python app.py            # http://localhost:5001
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

## Deploy (Render Web Service, Python)

- Build: `pip install -r requirements.txt`
- Pre-deploy / release: `flask db upgrade`
- Start: `gunicorn app:app` (เพิ่ม `gunicorn` ใน requirements) หรือ `python app.py`
- Env: `DATABASE_URL` = Supabase pooler URI
