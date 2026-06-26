-- Karriqi Pulse: private decision/intelligence feed (Hermes cron ingest).

create table public.pulse_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  title text not null,
  summary text not null,
  why_it_matters text,
  suggested_action text,

  category text not null,
  impact text not null,
  urgency text not null,
  status text not null default 'new',

  source_type text not null default 'cron',
  source_url text,
  source_title text,

  starts_at timestamptz,
  due_at timestamptz,
  expires_at timestamptz,

  dedupe_key text not null,
  confidence numeric,

  payload jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pulse_items_category_check check (
    category in ('berlin_life')
  ),
  constraint pulse_items_impact_check check (
    impact in ('low', 'medium', 'high')
  ),
  constraint pulse_items_urgency_check check (
    urgency in ('watch', 'this_month', 'this_week', 'now')
  ),
  constraint pulse_items_status_check check (
    status in ('new', 'saved', 'dismissed', 'acted')
  ),
  constraint pulse_items_source_type_check check (
    source_type in ('web', 'document', 'contract', 'manual', 'cron')
  ),
  constraint pulse_items_confidence_check check (
    confidence is null or (confidence >= 0 and confidence <= 1)
  ),
  constraint pulse_items_user_dedupe_key_unique unique (user_id, dedupe_key)
);

comment on table public.pulse_items is
  'Private intelligence feed rows; Hermes upserts via service role using dedupe_key.';

create index pulse_items_user_status_idx on public.pulse_items (user_id, status);
create index pulse_items_user_category_idx on public.pulse_items (user_id, category);
create index pulse_items_user_impact_idx on public.pulse_items (user_id, impact);
create index pulse_items_user_urgency_idx on public.pulse_items (user_id, urgency);
create index pulse_items_user_created_desc_idx
  on public.pulse_items (user_id, created_at desc);

create or replace function public.pulse_items_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger pulse_items_set_updated_at
  before update on public.pulse_items
  for each row
  execute function public.pulse_items_touch_updated_at();

alter table public.pulse_items enable row level security;

create policy "pulse_items_select_own"
  on public.pulse_items for select
  using (user_id = (select auth.uid()));

create policy "pulse_items_update_own"
  on public.pulse_items for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "pulse_items_delete_own"
  on public.pulse_items for delete
  using (user_id = (select auth.uid()));

grant select, update, delete on public.pulse_items to authenticated;
