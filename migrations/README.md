# Database Migrations (SQL)

โฟลเดอร์รวมไฟล์ SQL migration ของ **ทุกโมดูล** ที่ใช้ Supabase (ฐานข้อมูลเดียวร่วมกันทั้งทีม)
รันใน **Supabase → SQL Editor** เรียงตามลำดับเลข

## วิธีใช้

1. เปิด Supabase → **SQL Editor**
2. รันไฟล์**ตามลำดับเลข** (`001` → `002` → …) ทีละไฟล์
3. รันเฉพาะไฟล์ที่**ยังไม่เคยรัน** (ไฟล์เขียนแบบ idempotent — รันซ้ำไม่พัง แต่ seed อาจซ้ำ)

## กติกาการตั้งชื่อ (สำหรับทีม)

- **`NNN_<คำอธิบายสั้น>.sql`** — เลข 3 หลักเรียงลำดับ เช่น `002_add_users_table.sql`, `003_add_schedule_module.sql`
- **1 ไฟล์ = 1 การเปลี่ยนแปลง** (สร้างตาราง / เพิ่มคอลัมน์ / เพิ่ม index ของโมดูลนั้น)
- **ห้ามแก้ไฟล์ที่รันไปแล้ว** — ถ้าต้องแก้ ให้สร้างไฟล์ใหม่เลขถัดไป (ทุกคนจะได้ sync ตรงกัน)
- ใช้ `create table if not exists` / `alter table ... add column if not exists` ให้รันซ้ำได้ปลอดภัย
- **เปิด RLS ให้ตารางใหม่เสมอ**: `alter table public.<table> enable row level security;`

## ไฟล์ปัจจุบัน

| ไฟล์ | โมดูล | สร้างอะไร |
|---|---|---|
| `001_init_erp.sql` | ERP core | `projects`, `financial_tracking`, `material_market_prices` + RLS + trigger + seed |
| `002_seed_material_brands.sql` | ERP core | seed ราคาแบรนด์ 57 รายการเข้า `material_market_prices` (ใช้กับ autocomplete เกรด "ราคาที่กำหนด") |

> โมดูลอื่นของทีม: สร้างไฟล์ `002_...`, `003_...` ต่อได้เลย
>
> หมายเหตุ: นี่คือแนวทาง **manual SQL migration** (คู่กับ Supabase SQL Editor) — เป็นทางเลือกแทน Flask-Migrate/Alembic ของ `erp-backend/` เลือกใช้แนวทางเดียวทั้งทีมเพื่อไม่ให้ schema ชนกัน
