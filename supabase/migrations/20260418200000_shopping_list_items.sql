-- Active shopping list rows per user (survives reload / new session).
-- Run in Supabase SQL Editor after earlier shopping migrations.

create table public.shopping_list_items (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  staple_id uuid references public.staples (id) on delete set null,
  name text not null,
  quantity text,
  checked boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint shopping_list_name_not_blank check (length(trim(name)) > 0)
);

create index shopping_list_items_user_id_idx on public.shopping_list_items (user_id);
create index shopping_list_items_user_position_idx on public.shopping_list_items (user_id, position);

alter table public.shopping_list_items enable row level security;

create policy "shopping_list_select_own" on public.shopping_list_items
  for select using (auth.uid() = user_id);

create policy "shopping_list_insert_own" on public.shopping_list_items
  for insert with check (auth.uid() = user_id);

create policy "shopping_list_update_own" on public.shopping_list_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "shopping_list_delete_own" on public.shopping_list_items
  for delete using (auth.uid() = user_id);
