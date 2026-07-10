-- Subscription/Billing module v2
-- Clean schema for a fresh Supabase project.
-- Run after ERP migrations. Prices are before VAT; VAT 7% is calculated and stored per payment.

CREATE TABLE IF NOT EXISTS app_users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  billing_type VARCHAR(30) NOT NULL CHECK (billing_type IN ('trial', 'one_time', 'subscription')),
  billing_interval VARCHAR(30) CHECK (billing_interval IN ('month', 'year')),
  price_subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.07,
  ai_credits INTEGER NOT NULL DEFAULT 0,
  project_limit INTEGER,
  seat_limit INTEGER NOT NULL DEFAULT 1,
  feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  plan_code VARCHAR(50) NOT NULL REFERENCES subscription_plans(code),
  status VARCHAR(40) NOT NULL DEFAULT 'trialing',
  provider VARCHAR(40),
  provider_customer_id VARCHAR(255),
  provider_subscription_id VARCHAR(255),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id
  ON user_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_provider_subscription
  ON user_subscriptions(provider_subscription_id);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  source_type VARCHAR(40) NOT NULL,
  source_id VARCHAR(255),
  delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_id_created_at
  ON credit_ledger(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  plan_code VARCHAR(50) REFERENCES subscription_plans(code),
  provider VARCHAR(40) NOT NULL,
  provider_payment_id VARCHAR(255),
  provider_checkout_id VARCHAR(255),
  currency CHAR(3) NOT NULL DEFAULT 'THB',
  subtotal_amount NUMERIC(12, 2) NOT NULL,
  vat_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id_created_at
  ON payments(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id
  ON payments(provider, provider_payment_id);

CREATE TABLE IF NOT EXISTS receipt_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  receipt_name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(30),
  branch VARCHAR(120),
  address TEXT,
  billing_email VARCHAR(255),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_receipt_profiles_user_id
  ON receipt_profiles(user_id);

CREATE TABLE IF NOT EXISTS receipts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  payment_id BIGINT REFERENCES payments(id) ON DELETE SET NULL,
  receipt_no VARCHAR(80) NOT NULL UNIQUE,
  receipt_period CHAR(6),
  receipt_profile_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  amount NUMERIC(12, 2) NOT NULL,
  subtotal_amount NUMERIC(12, 2) NOT NULL,
  vat_amount NUMERIC(12, 2) NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  receipt_url TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_user_id_issued_at
  ON receipts(user_id, issued_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_receipts_receipt_no_unique
  ON receipts(receipt_no);

CREATE TABLE IF NOT EXISTS receipt_number_counters (
  period CHAR(6) PRIMARY KEY,
  last_sequence INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION next_receipt_no(issue_time TIMESTAMPTZ DEFAULT NOW())
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  receipt_period TEXT;
  next_sequence INTEGER;
BEGIN
  receipt_period := TO_CHAR(issue_time AT TIME ZONE 'Asia/Bangkok', 'YYYYMM');

  INSERT INTO receipt_number_counters (period, last_sequence, updated_at)
  VALUES (receipt_period, 1, NOW())
  ON CONFLICT (period)
  DO UPDATE SET
    last_sequence = receipt_number_counters.last_sequence + 1,
    updated_at = NOW()
  RETURNING last_sequence INTO next_sequence;

  RETURN 'RC-' || receipt_period || '-' || LPAD(next_sequence::TEXT, 6, '0');
END;
$$;

CREATE TABLE IF NOT EXISTS usage_events (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  event_type VARCHAR(60) NOT NULL,
  credit_delta INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_id_created_at
  ON usage_events(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(40) NOT NULL,
  provider_event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(120) NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_event_id)
);

INSERT INTO subscription_plans (
  code,
  name,
  billing_type,
  billing_interval,
  price_subtotal,
  vat_rate,
  ai_credits,
  project_limit,
  seat_limit,
  feature_flags
) VALUES
  (
    'trial',
    'ทดลองใช้',
    'trial',
    NULL,
    0,
    0.07,
    3,
    1,
    1,
    '{"pdfWatermark": true, "customerShare": false, "contract": false, "miniErp": false}'::jsonb
  ),
  (
    'credit_once',
    'รายครั้ง',
    'one_time',
    NULL,
    199,
    0.07,
    1,
    NULL,
    1,
    '{"pdfWatermark": false, "customerShare": false, "contract": false, "miniErp": false, "projectRetentionDays": 30}'::jsonb
  ),
  (
    'pro_monthly',
    'Pro รายเดือน',
    'subscription',
    'month',
    1490,
    0.07,
    50,
    30,
    1,
    '{"pdfWatermark": false, "customerShare": true, "contract": true, "miniErp": true}'::jsonb
  ),
  (
    'pro_yearly',
    'Pro รายปี',
    'subscription',
    'year',
    14900,
    0.07,
    50,
    30,
    1,
    '{"pdfWatermark": false, "customerShare": true, "contract": true, "miniErp": true, "creditsResetMonthly": true}'::jsonb
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  billing_type = EXCLUDED.billing_type,
  billing_interval = EXCLUDED.billing_interval,
  price_subtotal = EXCLUDED.price_subtotal,
  vat_rate = EXCLUDED.vat_rate,
  ai_credits = EXCLUDED.ai_credits,
  project_limit = EXCLUDED.project_limit,
  seat_limit = EXCLUDED.seat_limit,
  feature_flags = EXCLUDED.feature_flags,
  is_active = TRUE;