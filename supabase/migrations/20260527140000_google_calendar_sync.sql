-- Google Calendar OAuth connections (server-only via service role; no user RLS policies).

create table public.google_calendar_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  google_email text,
  calendar_id text not null default 'primary',
  refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,
  sync_token text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.google_calendar_connections_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger google_calendar_connections_set_updated_at
  before update on public.google_calendar_connections
  for each row
  execute function public.google_calendar_connections_touch_updated_at();

alter table public.google_calendar_connections enable row level security;

-- calendar_events: link rows to Google Calendar for two-way sync.

alter table public.calendar_events
  add column if not exists google_event_id text,
  add column if not exists google_calendar_id text,
  add column if not exists google_etag text,
  add column if not exists source text not null default 'local';

alter table public.calendar_events
  drop constraint if exists calendar_events_source_valid;

alter table public.calendar_events
  add constraint calendar_events_source_valid check (source in ('local', 'google'));

create unique index if not exists calendar_events_user_google_event_idx
  on public.calendar_events (user_id, google_event_id)
  where google_event_id is not null;
