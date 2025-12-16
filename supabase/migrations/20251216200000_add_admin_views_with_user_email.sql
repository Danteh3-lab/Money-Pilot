-- Add admin reporting views joined with auth.users email for easier attribution
--
-- Notes:
-- - Intended for admin use in Supabase Dashboard (SQL Editor / Table Editor).
-- - Does NOT change any RLS policies on base tables.
-- - Joins against auth.users to expose user email for attribution.
-- - If a user has no email (rare) or row is missing, user_email will be NULL.
--
-- Creates:
-- - public.admin_transactions_with_user_email
-- - public.admin_work_day_earnings_with_user_email
-- - public.admin_monthly_salary_expenses_with_user_email
--
-- Depends on existing views from prior migration:
-- - public.admin_work_day_earnings
-- - public.admin_monthly_salary_expenses

BEGIN;

-- Transactions with user attribution (email)
CREATE OR REPLACE VIEW public.admin_transactions_with_user_email AS
SELECT
  t.*,
  u.email AS user_email
FROM public.transactions t
LEFT JOIN auth.users u
  ON u.id = t.user_id;

-- Work day earnings with user attribution (email)
CREATE OR REPLACE VIEW public.admin_work_day_earnings_with_user_email AS
SELECT
  e.*,
  u.email AS user_email
FROM public.admin_work_day_earnings e
LEFT JOIN auth.users u
  ON u.id = e.user_id;

-- Monthly salary + expenses with user attribution (email)
CREATE OR REPLACE VIEW public.admin_monthly_salary_expenses_with_user_email AS
SELECT
  m.*,
  u.email AS user_email
FROM public.admin_monthly_salary_expenses m
LEFT JOIN auth.users u
  ON u.id = m.user_id;

COMMIT;
