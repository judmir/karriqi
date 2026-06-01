-- Prevent duplicate neuro-rehab program materialization per user.

-- Remove existing duplicate seeded rows (keep oldest per user/program/slot).
delete from public.rehab_plan_events a
using public.rehab_plan_events b
where a.program_id is not null
  and b.program_id is not null
  and a.user_id = b.user_id
  and a.program_id = b.program_id
  and a.start_at = b.start_at
  and a.event_kind = b.event_kind
  and a.created_at > b.created_at;

create table public.rehab_user_programs (
  user_id uuid not null references auth.users (id) on delete cascade,
  program_id text not null,
  materialized_at timestamptz not null default now(),
  primary key (user_id, program_id)
);

alter table public.rehab_user_programs enable row level security;

create policy "rehab_user_programs_select_own" on public.rehab_user_programs
  for select using (auth.uid() = user_id);

create unique index rehab_plan_events_program_dedupe_idx
  on public.rehab_plan_events (user_id, program_id, start_at, event_kind)
  where program_id is not null;
