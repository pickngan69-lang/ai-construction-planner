-- ============================================================================
-- Migration 004 — App persistence (ย้ายจาก file store / localStorage → Postgres)
-- แก้ปัญหา "ข้อมูลหายทุก deploy" + ใช้ข้ามอุปกรณ์ได้
-- รันใน Supabase SQL Editor (รันซ้ำได้ — ใช้ IF NOT EXISTS)
-- ============================================================================

-- ผู้ใช้ (สมาชิก) — แทน server/.data/auth.json
create table if not exists app_users (
  id                  text primary key,
  name                text not null,
  email               text unique not null,
  company_name        text default '',
  password_hash       text not null,
  plan_code           text default 'trial',
  status              text default 'trialing',
  ai_credits          integer default 3,
  projects_used       integer default 0,
  trial_ends_at       bigint,
  subscription_ends_at bigint,
  last_payment_at     bigint,
  last_payment_id     text,
  created_at          bigint,
  updated_at          bigint
);

-- Session tokens (login) — แทน sessions ใน auth.json
create table if not exists app_sessions (
  token       text primary key,
  user_id     text references app_users(id) on delete cascade,
  created_at  bigint,
  expires_at  bigint
);
create index if not exists idx_app_sessions_user on app_sessions(user_id);

-- ข้อมูลบริษัท/ผู้รับเหมา (หัวกระดาษเอกสาร) — แทน localStorage 'acp-company'
create table if not exists app_company_profiles (
  user_id         text primary key references app_users(id) on delete cascade,
  name            text default '',
  logo            text default '',
  tax_id          text default '',
  registration_no text default '',
  address         text default '',
  phone           text default '',
  email           text default '',
  website         text default '',
  updated_at      bigint
);

-- โปรเจกต์ + ผลวิเคราะห์ (เก็บทั้งก้อนเป็น JSONB — ยืดหยุ่นตาม shape ที่มีอยู่)
-- แทน localStorage 'acp-projects' / 'acp-project-overrides'
create table if not exists app_projects (
  id          text primary key,
  user_id     text references app_users(id) on delete cascade,
  data        jsonb not null,
  created_at  bigint,
  updated_at  bigint
);
create index if not exists idx_app_projects_user on app_projects(user_id);
