# Deploy ERP backend บน Render (ให้เว็บออนไลน์ใช้ราคาสดจาก DB)

ERP เป็น **service ที่ 2** แยกจาก frontend (Node/`server.js`) — ทำ 4 ขั้นนี้ตามลำดับ

---

## ขั้น 1 — Supabase: เตรียม DB + connection string

1. เปิด Supabase project → **SQL Editor** → รัน (ถ้ายังไม่ได้รัน):
   - `migrations/001_init_erp.sql`
   - `migrations/002_seed_material_brands.sql`
2. **Table Editor** → เห็นตาราง `material_market_prices` มีข้อมูล = พร้อม
3. **Connect** (ปุ่มบนสุด) → **Connection string → URI** → คัดลอกไว้
   - แนะนำใช้ **Session pooler** หรือ **Direct** (พอร์ต 5432) สำหรับ Flask+gunicorn
   - หน้าตา: `postgresql://postgres.xxxx:[PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres`

---

## ขั้น 2 — Render: สร้าง Web Service ใหม่ (Python)

Render Dashboard → **New +** → **Web Service** → เลือก repo เดียวกัน แล้วตั้งค่า:

| ช่อง | ค่า |
|---|---|
| **Root Directory** | `erp-backend` |
| **Language / Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn app:app --bind 0.0.0.0:$PORT` |
| **Instance Type** | Free ก็ได้ |

**Environment Variables** → Add:
```
DATABASE_URL = <URI ที่คัดลอกจาก Supabase ขั้น 1.3>
```
(ไม่ต้องใส่ `sslmode` — `app.py` เติมให้เอง)

กด **Create Web Service** → รอ build/deploy เสร็จ จะได้ URL เช่น
`https://ai-erp-backend.onrender.com`

---

## ขั้น 3 — ทดสอบ ERP service

เปิดในเบราว์เซอร์:
- `https://<erp-url>.onrender.com/api/erp/health` → ควรได้ `{"status":"ok","service":"erp-backend"}`
- `https://<erp-url>.onrender.com/api/erp/materials` → ควรได้ JSON รายการราคา

> ⏱️ Free tier จะ "หลับ" เมื่อไม่มีคนใช้ — request แรกอาจช้า ~30 วินาที (ปกติ)
> ❌ ถ้า build fail เรื่อง Python version: เพิ่ม env `PYTHON_VERSION = 3.12.6`

---

## ขั้น 4 — ต่อ frontend เข้ากับ ERP

ที่ **frontend service** (ตัวเดิมที่ deploy อยู่) → **Environment** → Add:
```
VITE_ERP_API_URL = https://<erp-url>.onrender.com
```
กด **Save Changes** → Render จะ **rebuild frontend อัตโนมัติ** (ค่า URL ถูก bake เข้า build)

> `VITE_ERP_API_URL` เป็น **build-time** — ต้อง rebuild ถึงจะมีผล (การ save env ทำให้ redeploy ให้เอง)

---

## ✅ ตรวจผลลัพธ์

เปิดเว็บจริง → เมนู **🏷️ ราคากลางวัสดุ** (`/materials`):
- ป้ายเปลี่ยนเป็น **🟢 เชื่อมต่อฐานข้อมูล** + เห็นราคาจาก DB
- แก้ราคา → กด 💾 บันทึก → ไปหน้าวิเคราะห์ > แท็บวัสดุ > **"✏️ ราคาที่กำหนด"** > พิมพ์แบรนด์ → **ราคาล่าสุดเด้งมา** 🎉

---

## 🔒 หมายเหตุความปลอดภัย
Endpoint เขียน (`POST/PUT/DELETE /api/erp/materials`) ยังเปิด public (ไม่มี auth) —
เหมาะกับช่วงทดสอบ ก่อนใช้จริงควรเพิ่ม API key หรือ Supabase Auth
