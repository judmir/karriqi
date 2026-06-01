-- Structured 12-week neuro-rehab plan checklist (catalog + per-user state).

create table public.rehab_plan_catalog (
  id text primary key,
  parent_id text references public.rehab_plan_catalog (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint rehab_plan_catalog_kind_valid check (
    kind in ('section', 'task', 'guide')
  ),
  constraint rehab_plan_catalog_title_not_blank check (length(trim(title)) > 0)
);

create index rehab_plan_catalog_parent_sort_idx
  on public.rehab_plan_catalog (parent_id, sort_order);

alter table public.rehab_plan_catalog enable row level security;

create policy "rehab_plan_catalog_select_authenticated" on public.rehab_plan_catalog
  for select to authenticated using (true);

create table public.rehab_plan_item_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null references public.rehab_plan_catalog (id) on delete cascade,
  completed_at timestamptz,
  notes text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create index rehab_plan_item_state_user_idx
  on public.rehab_plan_item_state (user_id);

create trigger rehab_plan_item_state_set_updated_at
  before update on public.rehab_plan_item_state
  for each row
  execute function public.calendar_events_touch_updated_at();

alter table public.rehab_plan_item_state enable row level security;

create policy "rehab_plan_item_state_select_own" on public.rehab_plan_item_state
  for select using (auth.uid() = user_id);

create policy "rehab_plan_item_state_insert_own" on public.rehab_plan_item_state
  for insert with check (auth.uid() = user_id);

create policy "rehab_plan_item_state_update_own" on public.rehab_plan_item_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "rehab_plan_item_state_delete_own" on public.rehab_plan_item_state
  for delete using (auth.uid() = user_id);
