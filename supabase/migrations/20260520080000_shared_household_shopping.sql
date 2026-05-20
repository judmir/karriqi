-- Shared household shopping: makes shopping_list_items / staples / purchase_events
-- visible and editable to both users in a household_members pair, in real time.
--
-- Strategy:
--   1. Define household_owner_for(uid) — canonical owner uuid for a given user.
--      If the user appears as `member_user_id` in household_members, the canonical
--      owner is that row's `owner_user_id`. Otherwise the user is their own owner.
--      SECURITY DEFINER so members (who can't SELECT their own row) still resolve.
--   2. Replace the per-user RLS policies on shopping tables with policies keyed on
--      household_owner_for(auth.uid()), so both partners read/write the same rows.
--   3. Backfill: re-own existing rows from members onto the canonical owner, with
--      best-effort deduping for staples (unique on (user_id, lower(name))).
--   4. Enable Supabase Realtime + REPLICA IDENTITY FULL on shopping_list_items so
--      DELETE events carry enough info for clients to remove rows by id.

----------------------------------------------------------------------
-- 1. household_owner_for(uid)
----------------------------------------------------------------------

create or replace function public.household_owner_for(uid uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select hm.owner_user_id
      from public.household_members hm
      where hm.member_user_id = uid
      limit 1
    ),
    uid
  );
$$;

comment on function public.household_owner_for(uuid) is
  'Returns the canonical household owner uuid for a given auth user. '
  'Members of a household_members row resolve to the owner; everyone else resolves to themselves.';

revoke all on function public.household_owner_for(uuid) from public;
grant execute on function public.household_owner_for(uuid) to authenticated;

----------------------------------------------------------------------
-- 2. Migration helper + backfill existing per-user rows to canonical owner
----------------------------------------------------------------------

-- Helper to migrate one member's shopping data onto a specific owner's bucket.
-- Used here for backfill, and re-used by the app's "pair partner" flow.
create or replace function public.migrate_shopping_to_household_owner(
  p_member_id uuid,
  p_owner_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_member_id is null or p_owner_id is null or p_member_id = p_owner_id then
    return;
  end if;

  -- Re-point FKs from member's duplicate staples (by name) to owner's twin
  -- BEFORE deleting the duplicates, so links survive the merge.
  update public.shopping_list_items sli
  set staple_id = so.id
  from public.staples sm, public.staples so
  where sli.staple_id = sm.id
    and sm.user_id = p_member_id
    and so.user_id = p_owner_id
    and lower(trim(sm.name)) = lower(trim(so.name));

  update public.purchase_events pe
  set staple_id = so.id
  from public.staples sm, public.staples so
  where pe.staple_id = sm.id
    and sm.user_id = p_member_id
    and so.user_id = p_owner_id
    and lower(trim(sm.name)) = lower(trim(so.name));

  -- Drop member's staples that collide with owner's by name (unique index).
  delete from public.staples sm
  where sm.user_id = p_member_id
    and exists (
      select 1
      from public.staples so
      where so.user_id = p_owner_id
        and lower(trim(so.name)) = lower(trim(sm.name))
    );

  -- Re-own remaining member staples.
  update public.staples
  set user_id = p_owner_id
  where user_id = p_member_id;

  -- Re-own shopping list items (uuid PK, no name uniqueness).
  update public.shopping_list_items
  set user_id = p_owner_id
  where user_id = p_member_id;

  -- Re-own purchase events.
  update public.purchase_events
  set user_id = p_owner_id
  where user_id = p_member_id;
end
$$;

comment on function public.migrate_shopping_to_household_owner(uuid, uuid) is
  'Moves shopping_list_items / staples / purchase_events from a member to the household owner, '
  'deduping staples by name. Safe to run multiple times.';

revoke all on function public.migrate_shopping_to_household_owner(uuid, uuid) from public;
grant execute on function public.migrate_shopping_to_household_owner(uuid, uuid) to authenticated;

-- Backfill: apply the helper for every existing household_members row.
do $$
declare
  r record;
begin
  for r in
    select owner_user_id, member_user_id from public.household_members
  loop
    perform public.migrate_shopping_to_household_owner(r.member_user_id, r.owner_user_id);
  end loop;
end
$$;

----------------------------------------------------------------------
-- 3. RLS: shared-household policies on shopping tables
----------------------------------------------------------------------

-- shopping_list_items
drop policy if exists "shopping_list_select_own" on public.shopping_list_items;
drop policy if exists "shopping_list_insert_own" on public.shopping_list_items;
drop policy if exists "shopping_list_update_own" on public.shopping_list_items;
drop policy if exists "shopping_list_delete_own" on public.shopping_list_items;
drop policy if exists "shopping_list_select_household" on public.shopping_list_items;
drop policy if exists "shopping_list_insert_household" on public.shopping_list_items;
drop policy if exists "shopping_list_update_household" on public.shopping_list_items;
drop policy if exists "shopping_list_delete_household" on public.shopping_list_items;

create policy "shopping_list_select_household"
  on public.shopping_list_items
  for select
  using (user_id = public.household_owner_for(auth.uid()));

create policy "shopping_list_insert_household"
  on public.shopping_list_items
  for insert
  with check (user_id = public.household_owner_for(auth.uid()));

create policy "shopping_list_update_household"
  on public.shopping_list_items
  for update
  using (user_id = public.household_owner_for(auth.uid()))
  with check (user_id = public.household_owner_for(auth.uid()));

create policy "shopping_list_delete_household"
  on public.shopping_list_items
  for delete
  using (user_id = public.household_owner_for(auth.uid()));

-- staples
drop policy if exists "staples_select_own" on public.staples;
drop policy if exists "staples_insert_own" on public.staples;
drop policy if exists "staples_update_own" on public.staples;
drop policy if exists "staples_delete_own" on public.staples;
drop policy if exists "staples_select_household" on public.staples;
drop policy if exists "staples_insert_household" on public.staples;
drop policy if exists "staples_update_household" on public.staples;
drop policy if exists "staples_delete_household" on public.staples;

create policy "staples_select_household"
  on public.staples
  for select
  using (user_id = public.household_owner_for(auth.uid()));

create policy "staples_insert_household"
  on public.staples
  for insert
  with check (user_id = public.household_owner_for(auth.uid()));

create policy "staples_update_household"
  on public.staples
  for update
  using (user_id = public.household_owner_for(auth.uid()))
  with check (user_id = public.household_owner_for(auth.uid()));

create policy "staples_delete_household"
  on public.staples
  for delete
  using (user_id = public.household_owner_for(auth.uid()));

-- purchase_events
drop policy if exists "purchase_events_select_own" on public.purchase_events;
drop policy if exists "purchase_events_insert_own" on public.purchase_events;
drop policy if exists "purchase_events_update_own" on public.purchase_events;
drop policy if exists "purchase_events_delete_own" on public.purchase_events;
drop policy if exists "purchase_events_select_household" on public.purchase_events;
drop policy if exists "purchase_events_insert_household" on public.purchase_events;
drop policy if exists "purchase_events_update_household" on public.purchase_events;
drop policy if exists "purchase_events_delete_household" on public.purchase_events;

create policy "purchase_events_select_household"
  on public.purchase_events
  for select
  using (user_id = public.household_owner_for(auth.uid()));

create policy "purchase_events_insert_household"
  on public.purchase_events
  for insert
  with check (user_id = public.household_owner_for(auth.uid()));

create policy "purchase_events_update_household"
  on public.purchase_events
  for update
  using (user_id = public.household_owner_for(auth.uid()))
  with check (user_id = public.household_owner_for(auth.uid()));

create policy "purchase_events_delete_household"
  on public.purchase_events
  for delete
  using (user_id = public.household_owner_for(auth.uid()));

----------------------------------------------------------------------
-- 4. Realtime: enable replication on shopping_list_items
----------------------------------------------------------------------

-- Ensure DELETE events carry the full old row so clients can match by id.
alter table public.shopping_list_items replica identity full;

-- Add to the realtime publication if not already present.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'shopping_list_items'
  ) then
    execute 'alter publication supabase_realtime add table public.shopping_list_items';
  end if;
end
$$;
