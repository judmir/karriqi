-- Track completion for rehab plan items (Today view checkboxes).

alter table public.rehab_plan_events
  add column completed_at timestamptz;

create index rehab_plan_events_user_completed_idx
  on public.rehab_plan_events (user_id, completed_at);
