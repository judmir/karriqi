-- File attachments on todo cards. Metadata lives in public.todo_attachments;
-- the file bytes live in the private 'todo-attachments' storage bucket under
-- the path '<owner_user_id>/<todo_item_id>/<attachment_id>-<filename>'.

create table public.todo_attachments (
  id uuid primary key default gen_random_uuid(),
  todo_item_id uuid not null references public.todo_items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  storage_path text not null,
  created_at timestamptz not null default now(),
  constraint todo_attachments_file_name_not_blank check (length(trim(file_name)) > 0),
  constraint todo_attachments_storage_path_not_blank check (length(trim(storage_path)) > 0),
  constraint todo_attachments_storage_path_unique unique (storage_path)
);

create index todo_attachments_todo_item_created_idx
  on public.todo_attachments (todo_item_id, created_at);

alter table public.todo_attachments enable row level security;

create policy "todo_attachments_select_own" on public.todo_attachments
  for select using (
    exists (
      select 1 from public.todo_items i
      where i.id = todo_item_id and i.user_id = auth.uid()
    )
  );

create policy "todo_attachments_insert_own" on public.todo_attachments
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.todo_items i
      where i.id = todo_item_id and i.user_id = auth.uid()
    )
  );

create policy "todo_attachments_delete_own" on public.todo_attachments
  for delete using (
    exists (
      select 1 from public.todo_items i
      where i.id = todo_item_id and i.user_id = auth.uid()
    )
  );

-- Private storage bucket for the actual files.
insert into storage.buckets (id, name, public)
values ('todo-attachments', 'todo-attachments', false)
on conflict (id) do nothing;

-- Owners may manage objects under their own folder (first path segment = user id).
create policy "todo_attachments_storage_select"
  on storage.objects for select
  using (
    bucket_id = 'todo-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "todo_attachments_storage_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'todo-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "todo_attachments_storage_delete"
  on storage.objects for delete
  using (
    bucket_id = 'todo-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
