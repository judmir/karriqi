-- Assignees are other auth users the list owner may pick; stored by UUID.
-- Populate with: insert into public.household_members (owner_user_id, member_user_id, display_name)
-- values ('<your-auth-uuid>', '<their-auth-uuid>', 'Savina');

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  member_user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  constraint household_members_owner_not_self check (owner_user_id <> member_user_id),
  constraint household_members_owner_member_unique unique (owner_user_id, member_user_id)
);

create index household_members_owner_idx on public.household_members (owner_user_id);

comment on table public.household_members is
  'Users the todo list owner may assign tasks to (plus the owner themselves, implied).';

alter table public.household_members enable row level security;

create policy "household_members_select_own"
  on public.household_members for select
  using (owner_user_id = (select auth.uid()));

create policy "household_members_insert_own"
  on public.household_members for insert
  with check (owner_user_id = (select auth.uid()));

create policy "household_members_update_own"
  on public.household_members for update
  using (owner_user_id = (select auth.uid()));

create policy "household_members_delete_own"
  on public.household_members for delete
  using (owner_user_id = (select auth.uid()));

-- UUID assignee; migrate from legacy assigned_email when possible.
alter table public.todo_items
  add column assigned_user_id uuid references auth.users (id) on delete set null;

update public.todo_items ti
set assigned_user_id = au.id
from auth.users au
where ti.assigned_email is not null
  and lower(trim(ti.assigned_email)) = lower(au.email::text);

alter table public.todo_items drop column assigned_email;

comment on column public.todo_items.assigned_user_id is
  'auth.users id of assignee; null = unassigned.';
