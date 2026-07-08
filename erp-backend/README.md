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

**หรือ (ทางเลือกที่เร็วกว่า):** วางไฟล์ [`migrations/001_init_erp.sql`](../migrations/001_init_erp.sql) ใน **Supabase → SQL Editor → Run** — สร้างตารางครบ + เปิด RLS + ใส่ข้อมูลตัวอย่างให้เลย โดยข้ามขั้น Flask-Migrate (เลือกอย่างใดอย่างหนึ่ง) · ดู [`migrations/README.md`](../migrations/README.md) สำหรับกติกาการเพิ่มไฟล์ของทีม

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
| POST | `/api/erp/materials` | Add a material price `{material_name, current_price}` |
| PUT | `/api/erp/materials/<id>` | Update a material price |
| DELETE | `/api/erp/materials/<id>` | Delete a material price |

## Models (`models.py`)

- **Project** — `id`, `name`, `status`
- **FinancialTracking** — `id`, `project_id`, `boq_budget`, `actual_cost`, `total_installment_paid`
- **MaterialMarketPrice** — `id`, `material_name`, `current_price`, `last_updated`

## Deploy (Render — Python Web Service แยกอีก 1 service)

Frontend (Node/`server.js`) กับ ERP นี้เป็นคนละ service — ให้สร้าง **Web Service ใหม่**
ชี้ root directory มาที่ `erp-backend/`:

- **Build:** `pip install -r requirements.txt`
- **Start:** `gunicorn app:app --bind 0.0.0.0:$PORT` (มี `gunicorn` ใน requirements แล้ว · หรือใช้ `Procfile`)
- **Env `DATABASE_URL`** = Supabase pooler URI (`app.py` เติม `sslmode=require` ให้เอง)
- รัน migrations ครั้งแรก: `flask db upgrade` (หรือ `Procfile` มี `release: flask db upgrade`)
  — หรือถ้าใช้ SQL Editor ก็รัน `migrations/001` + `002` แทน

### ให้ frontend ออนไลน์คุยกับ ERP นี้
ERP เปิด **CORS** ไว้แล้ว → ที่ **frontend service** (Node) ตั้ง env:
```
VITE_ERP_API_URL=https://<erp-service-name>.onrender.com
```
แล้ว rebuild frontend — หน้าเว็บจะเรียก `${VITE_ERP_API_URL}/api/erp/*` ข้าม origin ได้
(ถ้าไม่ตั้ง → frontend จะ fallback ใช้แคตตาล็อกราคาในเครื่อง)

> 🔒 หมายเหตุความปลอดภัย: endpoint เขียน (POST/PUT/DELETE) ยังเปิด public (ไม่มี auth)
> — เหมาะกับช่วงทดสอบ · ก่อนใช้จริงควรเพิ่มการยืนยันตัวตน (เช่น API key / Supabase Auth)
