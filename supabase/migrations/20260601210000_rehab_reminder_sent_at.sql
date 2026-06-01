-- Track when a timed-reminder push was sent for a rehab plan event, so the
-- every-minute reminder cron sends at most one push per event (dedupe).

alter table public.rehab_plan_events
  add column reminder_sent_at timestamptz;

-- Partial index for cheap polling: only rows that are still candidates for a
-- reminder (not yet sent, timed, not completed).
create index rehab_plan_events_reminder_due_idx
  on public.rehab_plan_events (start_at)
  where reminder_sent_at is null
    and all_day = false
    and completed_at is null;
