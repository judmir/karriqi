-- Program dedupe must ignore soft-deleted tombstones so reset / top-up can re-seed
-- slots without violating uniqueness (see soft-delete partial unique pattern).

drop index if exists public.rehab_plan_events_program_dedupe_idx;

create unique index rehab_plan_events_program_dedupe_idx
  on public.rehab_plan_events (user_id, program_id, start_at, event_kind)
  where program_id is not null and deleted_at is null;
