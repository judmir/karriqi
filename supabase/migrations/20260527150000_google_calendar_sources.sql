-- Google Calendar list entries (colors, visibility, per-calendar sync tokens).

create table public.google_calendar_sources (
  user_id uuid not null references auth.users (id) on delete cascade,
  google_calendar_id text not null,
  summary text not null,
  background_color text not null default '#039be5',
  foreground_color text,
  selected boolean not null default true,
  primary_calendar boolean not null default false,
  access_role text,
  sync_token text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, google_calendar_id)
);

create or replace function public.google_calendar_sources_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger google_calendar_sources_set_updated_at
  before update on public.google_calendar_sources
  for each row
  execute function public.google_calendar_sources_touch_updated_at();

alter table public.google_calendar_sources enable row level security;

create policy google_calendar_sources_select_own
  on public.google_calendar_sources
  for select
  to authenticated
  using (user_id = auth.uid());

create policy google_calendar_sources_update_own
  on public.google_calendar_sources
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
