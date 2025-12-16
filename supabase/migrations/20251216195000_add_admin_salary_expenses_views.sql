-- Add admin reporting views for monthly salary and expenses
--
-- Notes:
-- - These views are intended for admin inspection in the Supabase dashboard / SQL editor.
-- - They do not change RLS policies on base tables.
-- - "Paid" statuses are counted as earnings days: worked, vacation, sick, holiday
-- - "absent" is treated as unpaid (0 earnings)
--
-- Objects created:
-- - admin_work_day_earnings: per-user, per-day derived earnings
-- - admin_monthly_salary_expenses: per-user, per-month aggregated salary + expenses + net

BEGIN;

-- Helper view: derive effective daily rate and per-day earnings
CREATE OR REPLACE VIEW public.admin_work_day_earnings AS
SELECT
  wd.user_id,
  wd.date,
  wd.status,
  wd.hours_worked,
  COALESCE(wd.daily_rate, us.daily_rate, 0) AS effective_daily_rate,
  CASE
    WHEN wd.status IN ('worked', 'vacation', 'sick', 'holiday')
      THEN COALESCE(wd.daily_rate, us.daily_rate, 0)
    ELSE 0
  END AS earned
FROM public.work_days wd
LEFT JOIN public.user_settings us
  ON us.user_id = wd.user_id;

-- Monthly rollup: salary + expenses + net per user
CREATE OR REPLACE VIEW public.admin_monthly_salary_expenses AS
WITH earnings AS (
  SELECT
    user_id,
    date_trunc('month', date::timestamp) AS month,
    COUNT(*) FILTER (WHERE status IN ('worked', 'vacation', 'sick', 'holiday')) AS paid_days,
    COUNT(*) FILTER (WHERE status = 'worked') AS work_days_worked,
    SUM(hours_worked) FILTER (WHERE status = 'worked') AS hours_worked,
    AVG(effective_daily_rate) FILTER (WHERE status IN ('worked', 'vacation', 'sick', 'holiday')) AS avg_daily_rate,
    SUM(earned) AS salary_total
  FROM public.admin_work_day_earnings
  GROUP BY 1, 2
),
expenses AS (
  SELECT
    user_id,
    date_trunc('month', date) AS month,
    SUM(amount)::numeric(10,2) AS expenses_total,
    COUNT(*) AS expense_count
  FROM public.transactions
  WHERE type = 'expense'
  GROUP BY 1, 2
)
SELECT
  COALESCE(e.user_id, x.user_id) AS user_id,
  COALESCE(e.month, x.month) AS month,
  COALESCE(e.paid_days, 0) AS paid_days,
  COALESCE(e.work_days_worked, 0) AS work_days_worked,
  COALESCE(e.hours_worked, 0) AS hours_worked,
  COALESCE(e.avg_daily_rate, 0) AS avg_daily_rate,
  COALESCE(e.salary_total, 0) AS salary_total,
  COALESCE(x.expenses_total, 0) AS expenses_total,
  COALESCE(x.expense_count, 0) AS expense_count,
  (COALESCE(e.salary_total, 0) - COALESCE(x.expenses_total, 0)) AS net_total
FROM earnings e
FULL OUTER JOIN expenses x
  ON x.user_id = e.user_id AND x.month = e.month;

COMMIT;
