-- ============================================================================
-- Mini ERP — Database schema (PostgreSQL / Supabase)
-- วิธีใช้: เปิด Supabase → SQL Editor → วางทั้งไฟล์นี้ → Run
-- ตรงกับ models.py: Project, FinancialTracking, MaterialMarketPrice
-- (เป็นทางเลือกแทนการรัน `flask db upgrade` — เลือกอย่างใดอย่างหนึ่ง)
-- ============================================================================

-- 1) projects -----------------------------------------------------------------
create table if not exists public.projects (
  id      serial       primary key,
  name    varchar(255) not null,
  status  varchar(50)  not null default 'กำลังประเมินราคา'
);

-- 2) financial_tracking (BOQ vs ต้นทุนจริง + ค่างวด) --------------------------
create table if not exists public.financial_tracking (
  id                      serial        primary key,
  project_id              integer       not null
                          references public.projects(id) on delete cascade,
  boq_budget              numeric(14,2) not null default 0,
  actual_cost             numeric(14,2) not null default 0,
  total_installment_paid  numeric(14,2) not null default 0
);
create index if not exists idx_financial_tracking_project_id
  on public.financial_tracking(project_id);

-- 3) material_market_prices (ราคาวัสดุตลาด) -----------------------------------
create table if not exists public.material_market_prices (
  id            serial        primary key,
  material_name varchar(255)  not null,
  current_price numeric(12,2) not null,
  last_updated  timestamp     default now()
);

-- ============================================================================
-- (แนะนำ) เปิด Row Level Security — กัน anon/public API ของ Supabase อ่าน-เขียนตรง
-- Flask backend ต่อผ่าน DATABASE_URL (role postgres = เจ้าของตาราง) จึงยัง bypass RLS
-- เข้าถึงข้อมูลได้ตามปกติ ไม่ต้องเพิ่ม policy
-- ============================================================================
alter table public.projects              enable row level security;
alter table public.financial_tracking    enable row level security;
alter table public.material_market_prices enable row level security;

-- ============================================================================
-- (ทางเลือก) auto-update last_updated เมื่อแก้ row ผ่าน SQL ตรง
-- (ถ้าเข้าผ่าน Flask/SQLAlchemy จะตั้งค่าให้เองผ่าน onupdate อยู่แล้ว)
-- ============================================================================
create or replace function public.set_last_updated()
returns trigger as $$
begin
  new.last_updated = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_material_last_updated on public.material_market_prices;
create trigger trg_material_last_updated
  before update on public.material_market_prices
  for each row execute function public.set_last_updated();

-- ============================================================================
-- (ทางเลือก) ข้อมูลตัวอย่าง — สำหรับฐานข้อมูลเปล่า รันครั้งเดียว (ลบส่วนนี้ได้)
-- ============================================================================
insert into public.projects (name, status) values
  ('บ้านคุณสมชาย', 'กำลังประเมินราคา'),
  ('บ้านคุณวิภา',  'ระหว่างก่อสร้าง'),
  ('วิลล่าคุณนภา',  'ส่งมอบแล้ว');

insert into public.financial_tracking (project_id, boq_budget, actual_cost, total_installment_paid) values
  (1, 2500000, 0,       0),
  (2, 3800000, 2100000, 1900000),
  (3, 5500000, 5150000, 5500000);

insert into public.material_market_prices (material_name, current_price) values
  ('ปูนซีเมนต์ปอร์ตแลนด์ (ถุง)',   185),
  ('เหล็กเส้นข้ออ้อย DB12 (เส้น)', 255),
  ('อิฐมวลเบา Q-CON (ตร.ม.)',      320);
