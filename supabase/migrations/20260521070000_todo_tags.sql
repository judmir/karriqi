-- Per-user todo tag registry (label + lucide icon key).

create table public.todo_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  icon text not null default 'tag',
  created_at timestamptz not null default now(),
  constraint todo_tags_label_not_blank check (length(trim(label)) > 0),
  constraint todo_tags_icon_not_blank check (length(trim(icon)) > 0)
);

create unique index todo_tags_user_label_lower_idx
  on public.todo_tags (user_id, lower(label));

create index todo_tags_user_id_idx on public.todo_tags (user_id);

alter table public.todo_tags enable row level security;

create policy "todo_tags_select_own" on public.todo_tags
  for select using (auth.uid() = user_id);

create policy "todo_tags_insert_own" on public.todo_tags
  for insert with check (auth.uid() = user_id);

create policy "todo_tags_update_own" on public.todo_tags
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "todo_tags_delete_own" on public.todo_tags
  for delete using (auth.uid() = user_id);
