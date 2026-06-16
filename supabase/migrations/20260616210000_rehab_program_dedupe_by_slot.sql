-- Remove duplicate neuro-rehab program rows created by repeated materialization.
-- Duplicates often differ by ~2h (local vs UTC generation) so epoch-only dedupe missed them.
-- Keep rows with user progress (completed_at), otherwise the oldest row per logical slot.

-- Daily / standalone program rows: one per title on each local calendar day.
with ranked as (
  select
    id,
    row_number() over (
      partition by
        user_id,
        program_id,
        event_kind,
        title,
        ((start_at at time zone 'Europe/Berlin')::date)
      order by
        case when completed_at is not null then 0 else 1 end,
        created_at asc
    ) as rn
  from public.rehab_plan_events
  where program_id is not null
    and deleted_at is null
    and recurrence_rule is null
)
update public.rehab_plan_events e
set deleted_at = now()
from ranked r
where e.id = r.id
  and r.rn > 1;

-- Recurring masters: one per program block (plan_week) and title.
with ranked as (
  select
    id,
    row_number() over (
      partition by
        user_id,
        program_id,
        event_kind,
        title,
        coalesce(plan_week, 0)
      order by created_at asc
    ) as rn
  from public.rehab_plan_events
  where program_id is not null
    and deleted_at is null
    and recurrence_rule is not null
    and recurrence_at is null
)
update public.rehab_plan_events e
set deleted_at = now()
from ranked r
where e.id = r.id
  and r.rn > 1;

-- Per-occurrence override rows tied to a series.
with ranked as (
  select
    id,
    row_number() over (
      partition by
        user_id,
        series_id,
        recurrence_at
      order by
        case when completed_at is not null then 0 else 1 end,
        created_at asc
    ) as rn
  from public.rehab_plan_events
  where program_id is not null
    and deleted_at is null
    and recurrence_at is not null
    and series_id is not null
)
update public.rehab_plan_events e
set deleted_at = now()
from ranked r
where e.id = r.id
  and r.rn > 1;
