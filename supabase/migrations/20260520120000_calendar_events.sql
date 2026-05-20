-- Household calendar events. Per-user RLS.

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  color text not null default 'blue',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_events_title_not_blank check (length(trim(title)) > 0),
  constraint calendar_events_end_after_start check (end_at >= start_at),
  constraint calendar_events_color_valid check (
    color in ('blue', 'green', 'orange', 'purple', 'red')
  )
);

create index calendar_events_user_start_idx
  on public.calendar_events (user_id, start_at);

create or replace function public.calendar_events_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger calendar_events_set_updated_at
  before update on public.calendar_events
  for each row
  execute function public.calendar_events_touch_updated_at();

alter table public.calendar_events enable row level security;

create policy "calendar_events_select_own" on public.calendar_events
  for select using (auth.uid() = user_id);

create policy "calendar_events_insert_own" on public.calendar_events
  for insert with check (auth.uid() = user_id);

create policy "calendar_events_update_own" on public.calendar_events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "calendar_events_delete_own" on public.calendar_events
  for delete using (auth.uid() = user_id);
