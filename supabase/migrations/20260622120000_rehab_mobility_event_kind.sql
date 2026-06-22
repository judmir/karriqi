-- Add the 'mobility' rehab event kind (daily 5-exercise mobility routine).

alter table public.rehab_plan_events
  drop constraint rehab_plan_events_event_kind_valid;

alter table public.rehab_plan_events
  add constraint rehab_plan_events_event_kind_valid check (
    event_kind in (
      'gym_a', 'gym_b', 'gym_c', 'gym_d',
      'run_walk', 'hand', 'speech', 'football',
      'meditation', 'journal', 'supplement',
      'weekly_review', 'retest', 'day0', 'recovery',
      'mobility', 'stoic', 'custom',
      'push_up', 'squat', 'crunch'
    )
  );
