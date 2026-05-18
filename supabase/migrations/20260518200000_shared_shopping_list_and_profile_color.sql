-- Make the shopping list shared across household members and add a per-row
-- snapshot of the creator's profile color so the UI can tint items by who
-- added them.
--
-- Background: `shopping_list_items` was previously per-user (RLS:
-- `auth.uid() = user_id`). `household_members` already links accounts (used
-- for todo assignees + push notifications) but nothing on shopping consumed
-- it, so two paired accounts could not see each other's list.
--
-- This migration:
--   1. Adds `is_household_peer(uuid)` / `household_user_ids(uuid)` helpers
--      that resolve symmetric household membership (owner→member AND
--      member→owner). These are SECURITY DEFINER because the RLS on
--      `household_members` hides rows where the user is the member.
--   2. Replaces the four per-user RLS policies on `shopping_list_items`
--      with household-scoped versions. INSERT still pins `user_id` to
--      `auth.uid()` so each row tracks its real creator; SELECT / UPDATE /
--      DELETE allow any household peer.
--   3. Adds `shopping_list_items.created_by_color` for the creator's
--      profile color slug (see PROFILE_COLORS in `lib/profile/colors.ts`).

-- 1. Household resolution helpers
--------------------------------------------------------------------------------

create or replace function public.household_user_ids(p_user uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_user
  union
  select hm.member_user_id
    from public.household_members hm
   where hm.owner_user_id = p_user
  union
  select hm.owner_user_id
    from public.household_members hm
   where hm.member_user_id = p_user;
$$;

comment on function public.household_user_ids(uuid) is
  'Returns the user id plus every household peer (both owner→member and member→owner edges). SECURITY DEFINER so the caller sees edges even when they are only the member side.';

revoke execute on function public.household_user_ids(uuid) from public;
grant execute on function public.household_user_ids(uuid) to authenticated;

create or replace function public.is_household_peer(p_target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.household_user_ids((select auth.uid())) as h(user_id)
     where h.user_id = p_target_user
  );
$$;

comment on function public.is_household_peer(uuid) is
  'True when the target user is in the current actor''s household (self counts). Used by row level security policies for shared resources.';

revoke execute on function public.is_household_peer(uuid) from public;
grant execute on function public.is_household_peer(uuid) to authenticated;

-- 2. Shared RLS on shopping_list_items
--------------------------------------------------------------------------------

drop policy if exists "shopping_list_select_own" on public.shopping_list_items;
drop policy if exists "shopping_list_insert_own" on public.shopping_list_items;
drop policy if exists "shopping_list_update_own" on public.shopping_list_items;
drop policy if exists "shopping_list_delete_own" on public.shopping_list_items;

create policy "shopping_list_select_household"
  on public.shopping_list_items for select
  using (public.is_household_peer(user_id));

-- Members may only insert rows owned by themselves so we keep a truthful
-- record of who added each item (used for the per-creator color highlight).
create policy "shopping_list_insert_self"
  on public.shopping_list_items for insert
  with check (user_id = (select auth.uid()));

create policy "shopping_list_update_household"
  on public.shopping_list_items for update
  using (public.is_household_peer(user_id))
  with check (public.is_household_peer(user_id));

create policy "shopping_list_delete_household"
  on public.shopping_list_items for delete
  using (public.is_household_peer(user_id));

-- 3. Creator color snapshot
--------------------------------------------------------------------------------

alter table public.shopping_list_items
  add column if not exists created_by_color text;

comment on column public.shopping_list_items.created_by_color is
  'Snapshot of the creator''s profile color slug at the time the row was inserted (e.g. "rose"). See PROFILE_COLORS in lib/profile/colors.ts. The slug is also backfilled on existing rows when a user changes their profile color.';
