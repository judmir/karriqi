-- Hermes-ingested operator content (generic rows; Weekend Planner UI uses kind = weekend_planner).
-- Writes use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS). Authenticated clients may SELECT own rows only.

create table public.operator_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  summary text,
  dedupe_key text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  payload jsonb not null,
  source text not null default 'hermes',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operator_entries_kind_not_blank check (length(trim(kind)) > 0)
);

comment on table public.operator_entries is
  'Inbound operator payloads (Hermes etc.); keyed by dedupe_key per user for stable upserts.';

create unique index operator_entries_user_dedupe_idx
  on public.operator_entries (user_id, dedupe_key);

create index operator_entries_user_kind_starts_desc_idx
  on public.operator_entries (user_id, kind, starts_at desc nulls last);

create or replace function public.operator_entries_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger operator_entries_set_updated_at
  before update on public.operator_entries
  for each row
  execute function public.operator_entries_touch_updated_at();

alter table public.operator_entries enable row level security;

create policy "operator_entries_select_own"
  on public.operator_entries for select
  using (user_id = (select auth.uid()));

grant select on public.operator_entries to authenticated;
