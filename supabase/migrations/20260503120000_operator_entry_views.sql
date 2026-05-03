-- Per-user viewed state for operator_entries (e.g. apartment findings list "New" badge).

create table public.operator_entry_views (
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_id uuid not null references public.operator_entries (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  constraint operator_entry_views_pkey primary key (user_id, entry_id)
);

comment on table public.operator_entry_views is
  'Tracks which operator_entries a user has opened; first insert wins (Hermes/other kinds may opt in UI).';

create index operator_entry_views_user_idx
  on public.operator_entry_views (user_id);

create index operator_entries_user_kind_updated_desc_idx
  on public.operator_entries (user_id, kind, updated_at desc);

alter table public.operator_entry_views enable row level security;

create policy "operator_entry_views_select_own"
  on public.operator_entry_views for select
  using (user_id = (select auth.uid()));

create policy "operator_entry_views_insert_own"
  on public.operator_entry_views for insert
  with check (user_id = (select auth.uid()));

grant select, insert on public.operator_entry_views to authenticated;
