-- Per-occurrence reminder dedupe for recurring rehab events.
--
-- Non-recurring rows (standalone + per-occurrence override rows) dedupe via
-- rehab_plan_events.reminder_sent_at (one row -> one reminder). Recurring
-- masters expand into many *virtual* occurrences that are never stored as rows,
-- so a single column cannot track "which occurrence was already reminded".
--
-- This table records one row per (master event, occurrence start) that has been
-- pushed, so the every-minute reminder cron sends each recurring occurrence
-- exactly once. Written only by the service role (cron); never read by clients.

create table public.rehab_event_reminders (
  master_id uuid not null references public.rehab_plan_events (id) on delete cascade,
  occurrence_at timestamptz not null,
  sent_at timestamptz not null default now(),
  primary key (master_id, occurrence_at)
);

-- Cheap range scan for "already sent in this window?" lookups.
create index rehab_event_reminders_occurrence_idx
  on public.rehab_event_reminders (occurrence_at);

-- Lock down: only the service role (which bypasses RLS) may touch this table.
-- No policies => anon/authenticated have no access.
alter table public.rehab_event_reminders enable row level security;
