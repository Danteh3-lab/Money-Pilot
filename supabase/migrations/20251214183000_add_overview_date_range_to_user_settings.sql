-- Add overview date range fields to user_settings table
-- Stores the user's preferred "Overzicht" date range (per account).
--
-- Notes:
-- - Using DATE (not timestamptz) because the UI is day-based.
-- - This migration is idempotent (safe to run multiple times).

begin;

alter table public.user_settings
  add column if not exists overview_start_date date,
  add column if not exists overview_end_date date;

-- Optional: basic validation to prevent inverted ranges.
-- Supabase/Postgres supports adding this constraint even if columns already exist,
-- but it may already be present; so guard it.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_settings_overview_date_range_check'
      and conrelid = 'public.user_settings'::regclass
  ) then
    alter table public.user_settings
      add constraint user_settings_overview_date_range_check
      check (
        overview_start_date is null
        or overview_end_date is null
        or overview_start_date <= overview_end_date
      );
  end if;
end $$;

comment on column public.user_settings.overview_start_date is
  'Preferred overview range start (DATE) used for dashboard/workdays filtering.';

comment on column public.user_settings.overview_end_date is
  'Preferred overview range end (DATE) used for dashboard/workdays filtering.';

commit;
