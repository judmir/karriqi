-- Add the 'stoic' rehab event kind (Stoicism layer of the 12-week program).
-- Stoic events are delivered as recurring masters, so they reuse the existing
-- recurrence columns (series_id / recurrence_rule) added in 20260601200000.

alter table public.rehab_plan_events
  drop constraint rehab_plan_events_event_kind_valid;

alter table public.rehab_plan_events
  add constraint rehab_plan_events_event_kind_valid check (
    event_kind in (
      'gym_a', 'gym_b', 'gym_c', 'gym_d',
      'run_walk', 'hand', 'speech', 'football',
      'meditation', 'journal', 'supplement',
      'weekly_review', 'retest', 'day0', 'recovery',
      'stoic', 'custom'
    )
  );
