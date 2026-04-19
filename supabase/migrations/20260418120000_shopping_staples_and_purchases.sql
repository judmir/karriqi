-- Shopping: staples catalog per user + purchase_events when items are checked off.
-- Apply in Supabase SQL editor or: supabase db push / migration run

create table public.staples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text,
  unit text,
  typical_interval_days integer,
  last_purchased_at timestamptz,
  created_at timestamptz not null default now(),
  constraint staples_name_not_blank check (length(trim(name)) > 0)
);

create index staples_user_id_idx on public.staples (user_id);
create unique index staples_user_name_lower_idx on public.staples (user_id, (lower(trim(name))));

create table public.purchase_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  staple_id uuid references public.staples (id) on delete set null,
  item_name text not null,
  purchased_at timestamptz not null default now(),
  constraint purchase_item_name_not_blank check (length(trim(item_name)) > 0)
);

create index purchase_events_user_id_idx on public.purchase_events (user_id);
create index purchase_events_staple_id_idx on public.purchase_events (staple_id);
create index purchase_events_purchased_at_idx on public.purchase_events (purchased_at desc);

alter table public.staples enable row level security;
alter table public.purchase_events enable row level security;

create policy "staples_select_own" on public.staples
  for select using (auth.uid() = user_id);

create policy "staples_insert_own" on public.staples
  for insert with check (auth.uid() = user_id);

create policy "staples_update_own" on public.staples
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "staples_delete_own" on public.staples
  for delete using (auth.uid() = user_id);

create policy "purchase_events_select_own" on public.purchase_events
  for select using (auth.uid() = user_id);

create policy "purchase_events_insert_own" on public.purchase_events
  for insert with check (auth.uid() = user_id);

create policy "purchase_events_update_own" on public.purchase_events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "purchase_events_delete_own" on public.purchase_events
  for delete using (auth.uid() = user_id);
