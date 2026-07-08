# Database Migrations

Run these files in Supabase SQL Editor in order. Each file is written to be safe for repeated local testing where possible.

## Current Files

| File | Module | Purpose |
|---|---|---|
| `001_init_erp.sql` | ERP core | Creates core ERP/project/material tables, RLS, trigger, and starter seed data. |
| `002_seed_material_brands.sql` | ERP core | Seeds material brand prices for autocomplete and material price references. |
| `003_subscription_billing.sql` | Subscription/Billing | Adds member subscription, payment, invoice/tax, and billing support tables. |

## Team Rule

Use the next available number for new migration files. Do not edit a migration that has already been run by the team; create a new numbered file instead.