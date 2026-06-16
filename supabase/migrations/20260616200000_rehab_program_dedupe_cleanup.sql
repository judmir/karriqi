-- Remove duplicate active neuro-rehab program rows created when top-up re-inserted
-- slots that already existed under a slightly different start_at. Keep the row with
-- user progress (completed_at) when present, otherwise the oldest row.

with ranked as (
  select
    id,
    row_number() over (
      partition by
        user_id,
        program_id,
        event_kind,
        (floor(extract(epoch from start_at) * 1000))
      order by
        case when completed_at is not null then 0 else 1 end,
        created_at asc
    ) as rn
  from public.rehab_plan_events
  where program_id is not null
    and deleted_at is null
)
update public.rehab_plan_events e
set deleted_at = now()
from ranked r
where e.id = r.id
  and r.rn > 1;

-- Dedupe by exact start_at as well (legacy duplicates before epoch matching).
delete from public.rehab_plan_events a
using public.rehab_plan_events b
where a.program_id is not null
  and b.program_id is not null
  and a.deleted_at is null
  and b.deleted_at is null
  and a.user_id = b.user_id
  and a.program_id = b.program_id
  and a.start_at = b.start_at
  and a.event_kind = b.event_kind
  and a.created_at > b.created_at;

-- Unique active program slot (partial index ignores soft-deleted tombstones).
drop index if exists public.rehab_plan_events_program_dedupe_idx;

create unique index rehab_plan_events_program_dedupe_idx
  on public.rehab_plan_events (user_id, program_id, start_at, event_kind)
  where program_id is not null and deleted_at is null;
