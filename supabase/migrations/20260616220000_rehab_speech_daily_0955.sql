-- Daily speech practice at 09:55 Europe/Berlin for neuro-rehab program users.
-- Reschedules legacy Tue/Thu afternoon slots and inserts missing calendar days.

-- 1) Move existing speech rows to 09:55–10:10 on their local calendar day.
update public.rehab_plan_events e
set
  start_at = (
    ((e.start_at at time zone 'Europe/Berlin')::date + time '09:55')
    at time zone 'Europe/Berlin'
  ),
  end_at = (
    ((e.start_at at time zone 'Europe/Berlin')::date + time '10:10')
    at time zone 'Europe/Berlin'
  ),
  updated_at = now()
where e.program_id = 'neuro-rehab-2026-v1'
  and e.event_kind = 'speech'
  and e.deleted_at is null
  and e.recurrence_rule is null;

-- 2) Soft-delete duplicate speech rows on the same day (keep completed, else oldest).
with ranked as (
  select
    id,
    row_number() over (
      partition by
        user_id,
        program_id,
        ((start_at at time zone 'Europe/Berlin')::date)
      order by
        case when completed_at is not null then 0 else 1 end,
        created_at asc
    ) as rn
  from public.rehab_plan_events
  where program_id = 'neuro-rehab-2026-v1'
    and event_kind = 'speech'
    and deleted_at is null
    and recurrence_rule is null
)
update public.rehab_plan_events e
set deleted_at = now()
from ranked r
where e.id = r.id
  and r.rn > 1;

-- 3) Insert speech practice for program days that still have no row.
with program_users as (
  select distinct user_id
  from public.rehab_plan_events
  where program_id = 'neuro-rehab-2026-v1'
    and deleted_at is null
),
program_days as (
  select generate_series(
    date '2026-06-14',
    date '2026-06-14' + 89,
    interval '1 day'
  )::date as day
),
expected as (
  select u.user_id, d.day
  from program_users u
  cross join program_days d
),
existing_days as (
  select
    user_id,
    (start_at at time zone 'Europe/Berlin')::date as day
  from public.rehab_plan_events
  where program_id = 'neuro-rehab-2026-v1'
    and event_kind = 'speech'
    and deleted_at is null
    and recurrence_rule is null
),
missing as (
  select e.user_id, e.day
  from expected e
  left join existing_days x
    on x.user_id = e.user_id
   and x.day = e.day
  where x.user_id is null
)
insert into public.rehab_plan_events (
  id,
  user_id,
  title,
  description,
  start_at,
  end_at,
  all_day,
  color,
  event_kind,
  program_id,
  plan_week
)
select
  gen_random_uuid(),
  m.user_id,
  'Speech practice',
  E'10–15 min:\n- 1 min reading aloud\n- 1 min spontaneous speech\n- Note effort 0–10\n- Note saliva/swallow difficulty 0–10\n- Practice slower pacing and breath pauses',
  ((m.day + time '09:55') at time zone 'Europe/Berlin'),
  ((m.day + time '10:10') at time zone 'Europe/Berlin'),
  false,
  'red',
  'speech',
  'neuro-rehab-2026-v1',
  least(
    floor((m.day - date '2026-06-14') / 7)::int + 1,
    12
  )
from missing m;
