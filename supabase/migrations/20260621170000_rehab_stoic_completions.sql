-- Daily Stoic Rehab Path completions (84-day attention/resilience layer).

create table public.rehab_stoic_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id text not null,
  completed_at timestamptz not null default now(),
  journal_text text,
  process_score smallint,
  adapted boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint rehab_stoic_completions_exercise_id_not_blank check (
    length(trim(exercise_id)) > 0
  ),
  constraint rehab_stoic_completions_process_score_range check (
    process_score is null or process_score between 0 and 3
  ),
  constraint rehab_stoic_completions_user_exercise_unique unique (user_id, exercise_id)
);

create index rehab_stoic_completions_user_idx
  on public.rehab_stoic_completions (user_id);

create index rehab_stoic_completions_user_completed_idx
  on public.rehab_stoic_completions (user_id, completed_at desc);

create trigger rehab_stoic_completions_set_updated_at
  before update on public.rehab_stoic_completions
  for each row
  execute function public.calendar_events_touch_updated_at();

alter table public.rehab_stoic_completions enable row level security;

create policy "rehab_stoic_completions_select_own" on public.rehab_stoic_completions
  for select using (auth.uid() = user_id);

create policy "rehab_stoic_completions_insert_own" on public.rehab_stoic_completions
  for insert with check (auth.uid() = user_id);

create policy "rehab_stoic_completions_update_own" on public.rehab_stoic_completions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "rehab_stoic_completions_delete_own" on public.rehab_stoic_completions
  for delete using (auth.uid() = user_id);
