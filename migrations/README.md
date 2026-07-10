# Database Migrations

Run these files in Supabase SQL Editor in order. This set is cleaned for a fresh Supabase project.

## Current Files

| File | Module | Purpose |
|---|---|---|
| `001_init_erp.sql` | ERP core | Creates core ERP/project/material tables, RLS, trigger, and starter seed data. |
| `002_seed_material_brands.sql` | ERP core | Seeds material brand prices for autocomplete and material price references. |
| `003_subscription_billing.sql` | Subscription/Billing | Creates member, subscription, payment, VAT 7%, receipt/tax invoice, and receipt number tables. |

## Run Order

1. `001_init_erp.sql`
2. `002_seed_material_brands.sql`
3. `003_subscription_billing.sql`

## Note

Files `004`-`006` were old patch migrations used during local development. Their final changes are now included in `003_subscription_billing.sql`, so they are intentionally removed for a clean Supabase setup.