-- Recurring rehab events: rule-based master rows + per-occurrence override rows.
-- Master row: recurrence_rule set (JSON), series_id = its own id, recurrence_at null.
-- Override row: series_id = master's series_id, recurrence_at = original occurrence
--   start; carries its own fields, or recurrence_cancelled = true to skip the occurrence.

alter table public.rehab_plan_events
  add column series_id uuid,
  add column recurrence_rule text,
  add column recurrence_at timestamptz,
  add column recurrence_cancelled boolean not null default false;

-- Look up a whole series quickly (master + overrides) and an occurrence by date.
create index rehab_plan_events_series_idx
  on public.rehab_plan_events (user_id, series_id, recurrence_at);
