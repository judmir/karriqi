-- Kanban-style todos: items, comments, checklist subtasks. Per-user RLS.

create table public.todo_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'backlog',
  position integer not null default 0,
  due_at timestamptz,
  progress_percent smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint todo_items_title_not_blank check (length(trim(title)) > 0),
  constraint todo_items_status_valid check (status in ('backlog', 'in_progress', 'done')),
  constraint todo_items_progress_range check (
    progress_percent is null
    or (progress_percent >= 0 and progress_percent <= 100)
  )
);

create table public.todo_comments (
  id uuid primary key default gen_random_uuid(),
  todo_item_id uuid not null references public.todo_items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint todo_comments_body_not_blank check (length(trim(body)) > 0)
);

create table public.todo_subtasks (
  id uuid primary key default gen_random_uuid(),
  todo_item_id uuid not null references public.todo_items (id) on delete cascade,
  label text not null,
  done boolean not null default false,
  position integer not null default 0,
  constraint todo_subtasks_label_not_blank check (length(trim(label)) > 0)
);

create index todo_items_user_status_position_idx on public.todo_items (user_id, status, position);
create index todo_comments_todo_item_created_idx on public.todo_comments (todo_item_id, created_at);
create index todo_subtasks_todo_item_position_idx on public.todo_subtasks (todo_item_id, position);

create or replace function public.todo_items_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger todo_items_set_updated_at
  before update on public.todo_items
  for each row
  execute function public.todo_items_touch_updated_at();

alter table public.todo_items enable row level security;
alter table public.todo_comments enable row level security;
alter table public.todo_subtasks enable row level security;

create policy "todo_items_select_own" on public.todo_items
  for select using (auth.uid() = user_id);

create policy "todo_items_insert_own" on public.todo_items
  for insert with check (auth.uid() = user_id);

create policy "todo_items_update_own" on public.todo_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "todo_items_delete_own" on public.todo_items
  for delete using (auth.uid() = user_id);

create policy "todo_comments_select_own" on public.todo_comments
  for select using (
    exists (
      select 1 from public.todo_items i
      where i.id = todo_item_id and i.user_id = auth.uid()
    )
  );

create policy "todo_comments_insert_own" on public.todo_comments
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.todo_items i
      where i.id = todo_item_id and i.user_id = auth.uid()
    )
  );

create policy "todo_comments_update_own" on public.todo_comments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "todo_comments_delete_own" on public.todo_comments
  for delete using (auth.uid() = user_id);

create policy "todo_subtasks_select_own" on public.todo_subtasks
  for select using (
    exists (
      select 1 from public.todo_items i
      where i.id = todo_item_id and i.user_id = auth.uid()
    )
  );

create policy "todo_subtasks_insert_own" on public.todo_subtasks
  for insert with check (
    exists (
      select 1 from public.todo_items i
      where i.id = todo_item_id and i.user_id = auth.uid()
    )
  );

create policy "todo_subtasks_update_own" on public.todo_subtasks
  for update using (
    exists (
      select 1 from public.todo_items i
      where i.id = todo_item_id and i.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.todo_items i
      where i.id = todo_item_id and i.user_id = auth.uid()
    )
  );

create policy "todo_subtasks_delete_own" on public.todo_subtasks
  for delete using (
    exists (
      select 1 from public.todo_items i
      where i.id = todo_item_id and i.user_id = auth.uid()
    )
  );
