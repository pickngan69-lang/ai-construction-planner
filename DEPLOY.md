# 🚀 Deploy Runbook — AI Construction Planner (เวอร์ชันปัจจุบัน)

> รวมขั้นตอน deploy เวอร์ชันปัจจุบัน (branch `feat/erp-and-catalog`: auth + billing + ERP + catalog)
> ขึ้น **Render** ตามเดิม. ตรวจแล้ว build ผ่าน ✅

โครงสร้างมี **3 ส่วน**: (1) Frontend+Node · (2) ERP backend · (3) Supabase DB

---

## ⚠️ อ่านก่อน — ข้อจำกัดที่ต้องรู้

1. **Auth/Payments เก็บเป็นไฟล์ (`server/.data/*.json`)** ซึ่ง Render จะ **ล้างทุกครั้งที่ redeploy/restart**
   → ผู้ใช้ที่สมัคร + ประวัติการจ่ายเงินจะ **หายเมื่อ deploy ใหม่**. โอเคสำหรับ demo แต่ก่อนใช้จริง
   ต้องย้ายไปเก็บใน DB (Supabase) หรือ Render Persistent Disk (เสียเงิน)
2. **secret ทุกตัวกรอกใน Render dashboard เอง** — ไม่ commit ขึ้น git (`.env.local` อยู่ใน `.gitignore`)

---

## ขั้น 0 — เอาโค้ดขึ้น GitHub (ตัว trigger deploy)

Render deploy โดยดึงจาก GitHub. working copy ปัจจุบัน remote ชี้ไปโฟลเดอร์ในเครื่อง จึงต้องต่อ GitHub ก่อน:

```bash
git remote add github https://github.com/<user>/<repo>.git
git push github feat/erp-and-catalog        # หรือ merge เข้า branch ที่ Render watch (มัก main)
```

> ถ้า Render service เดิม auto-deploy จาก `main` → ต้อง merge/push เข้า `main` ถึงจะ redeploy
> Render จะเริ่ม build + deploy อัตโนมัติเมื่อเห็น commit ใหม่บน branch ที่ตั้งไว้

---

## ขั้น 1 — Frontend + Node service (ตัวหลัก)

Render Web Service (Node) — ตั้งค่า (หรือใช้ `render.yaml`):

| ช่อง | ค่า |
|---|---|
| Runtime | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |

**Environment Variables** (กรอกใน dashboard):

| ตัวแปร | จำเป็น? | ค่า |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ ใช่ | คีย์ Anthropic (ขึ้นต้น `sk-ant-`) |
| `APP_URL` | 🟠 ถ้าใช้ billing | URL เว็บจริง เช่น `https://ai-construction-planner.onrender.com` |
| `OMISE_SECRET_KEY` | 🟠 ถ้าใช้ billing | คีย์ลับ Omise (`skey_...`) — ไม่ใส่ = ปุ่มชำระเงินขึ้น 503 |
| `VITE_ERP_API_URL` | 🟡 ถ้าใช้ ERP | URL ของ ERP service (ขั้น 2) — **build-time** ต้อง rebuild ถึงมีผล |

> ⚠️ ถ้า service เดิมยังตั้ง `VITE_ANTHROPIC_API_KEY` (ของเก่า) → **ลบทิ้ง** แล้วใช้ `ANTHROPIC_API_KEY` แทน

---

## ขั้น 2 — ERP backend (ถ้าต้องการราคาวัสดุสดจาก DB)

Render Web Service (Python) แยกอีกตัว:

| ช่อง | ค่า |
|---|---|
| Root Directory | `erp-backend` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn app:app --bind 0.0.0.0:$PORT` |
| Env: `DATABASE_URL` | Supabase connection string (URI, port 5432) |
| Env: `PYTHON_VERSION` | `3.12.6` (กัน build fail) |

เสร็จแล้วเทส: `https://<erp-url>.onrender.com/api/erp/health` → `{"status":"ok"}`
จากนั้นเอา URL ไปใส่ `VITE_ERP_API_URL` ที่ service ขั้น 1 แล้ว rebuild

> รายละเอียดเต็ม: [erp-backend/DEPLOY_RENDER.md](erp-backend/DEPLOY_RENDER.md)

---

## ขั้น 3 — Supabase (ฐานข้อมูล ERP)

Supabase → SQL Editor → รัน migrations ตามลำดับ:
- `migrations/001_init_erp.sql`
- `migrations/002_seed_material_brands.sql`
- `migrations/003_subscription_billing.sql`

แล้ว copy connection string (URI) ไปใส่ `DATABASE_URL` ที่ ERP service (ขั้น 2)

---

## ✅ ตรวจหลัง deploy

1. เปิด URL เว็บ → เจอหน้า login/register (ไม่ error)
2. สมัครสมาชิก → login ได้
3. อัปโหลดแบบบ้าน → กด "วิเคราะห์" → AI ตอบ (ยืนยัน `ANTHROPIC_API_KEY` ใช้ได้)
4. (ถ้าต่อ ERP) เมนู "ราคากลางวัสดุ" ขึ้น 🟢 เชื่อมต่อฐานข้อมูล
