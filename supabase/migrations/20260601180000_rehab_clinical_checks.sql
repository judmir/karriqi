-- Simple before/after clinical baseline checklist (separate from the full plan catalog).

create table public.rehab_clinical_catalog (
  id text primary key,
  phase text not null,
  title text not null,
  body text not null default '',
  sort_order integer not null default 0,
  calendar_event_kind text,
  created_at timestamptz not null default now(),
  constraint rehab_clinical_catalog_phase_valid check (phase in ('before', 'after')),
  constraint rehab_clinical_catalog_title_not_blank check (length(trim(title)) > 0),
  constraint rehab_clinical_catalog_calendar_event_kind_valid check (
    calendar_event_kind is null
    or calendar_event_kind in ('day0', 'retest')
  )
);

create index rehab_clinical_catalog_phase_sort_idx
  on public.rehab_clinical_catalog (phase, sort_order);

alter table public.rehab_clinical_catalog enable row level security;

create policy "rehab_clinical_catalog_select_authenticated" on public.rehab_clinical_catalog
  for select to authenticated using (true);

create table public.rehab_clinical_item_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null references public.rehab_clinical_catalog (id) on delete cascade,
  completed_at timestamptz,
  notes text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create index rehab_clinical_item_state_user_idx
  on public.rehab_clinical_item_state (user_id);

create trigger rehab_clinical_item_state_set_updated_at
  before update on public.rehab_clinical_item_state
  for each row
  execute function public.calendar_events_touch_updated_at();

alter table public.rehab_clinical_item_state enable row level security;

create policy "rehab_clinical_item_state_select_own" on public.rehab_clinical_item_state
  for select using (auth.uid() = user_id);

create policy "rehab_clinical_item_state_insert_own" on public.rehab_clinical_item_state
  for insert with check (auth.uid() = user_id);

create policy "rehab_clinical_item_state_update_own" on public.rehab_clinical_item_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "rehab_clinical_item_state_delete_own" on public.rehab_clinical_item_state
  for delete using (auth.uid() = user_id);
