-- Soft delete: add deleted_at to user data tables, hide tombstones in RLS,
-- drop hard-delete policies so rows are retained for history.

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'calendar_events',
    'rehab_plan_events',
    'rehab_speech_recordings',
    'rehab_journal_entries',
    'rehab_clinical_item_state',
    'rehab_plan_item_state',
    'todo_items',
    'todo_subtasks',
    'todo_comments',
    'todo_tags',
    'todo_attachments',
    'shopping_list_items',
    'staples',
    'purchase_events',
    'rule_of_3_days',
    'rule_of_3_items',
    'household_members',
    'push_subscriptions',
    'google_calendar_connections',
    'notifications',
    'operator_entries',
    'apartment_listings',
    'apartment_views',
    'apartment_comments'
  ]
  loop
    execute format(
      'alter table public.%I add column if not exists deleted_at timestamptz',
      t
    );
  end loop;
end $$;

-- Partial indexes for active-row lookups
create index if not exists calendar_events_active_user_start_idx
  on public.calendar_events (user_id, start_at)
  where deleted_at is null;

create index if not exists rehab_plan_events_active_user_start_idx
  on public.rehab_plan_events (user_id, start_at)
  where deleted_at is null;

create index if not exists todo_items_active_user_idx
  on public.todo_items (user_id)
  where deleted_at is null;

create index if not exists shopping_list_items_active_user_idx
  on public.shopping_list_items (user_id)
  where deleted_at is null;

-- rule_of_3_items: allow re-use of position after soft delete
alter table public.rule_of_3_items
  drop constraint if exists rule_of_3_items_day_id_position_key;

create unique index if not exists rule_of_3_items_day_position_active_idx
  on public.rule_of_3_items (day_id, position)
  where deleted_at is null;

-- calendar_events: google id unique only among active rows
drop index if exists calendar_events_user_google_event_idx;

create unique index if not exists calendar_events_user_google_event_active_idx
  on public.calendar_events (user_id, google_event_id)
  where google_event_id is not null and deleted_at is null;

-- ---------------------------------------------------------------------------
-- 2. RLS: hide soft-deleted rows; remove hard-delete policies
-- ---------------------------------------------------------------------------

-- calendar_events
drop policy if exists "calendar_events_select_own" on public.calendar_events;
create policy "calendar_events_select_own" on public.calendar_events
  for select using (auth.uid() = user_id and deleted_at is null);
drop policy if exists "calendar_events_delete_own" on public.calendar_events;

-- rehab_plan_events
drop policy if exists "rehab_plan_events_select_own" on public.rehab_plan_events;
create policy "rehab_plan_events_select_own" on public.rehab_plan_events
  for select using (auth.uid() = user_id and deleted_at is null);
drop policy if exists "rehab_plan_events_delete_own" on public.rehab_plan_events;

-- rehab_speech_recordings
drop policy if exists "rehab_speech_recordings_select_own" on public.rehab_speech_recordings;
create policy "rehab_speech_recordings_select_own" on public.rehab_speech_recordings
  for select using (
    exists (
      select 1 from public.rehab_plan_events e
      where e.id = rehab_plan_event_id
        and e.user_id = auth.uid()
        and e.deleted_at is null
    )
    and deleted_at is null
  );
drop policy if exists "rehab_speech_recordings_delete_own" on public.rehab_speech_recordings;

-- rehab_journal_entries
drop policy if exists "rehab_journal_entries_select_own" on public.rehab_journal_entries;
create policy "rehab_journal_entries_select_own" on public.rehab_journal_entries
  for select using (auth.uid() = user_id and deleted_at is null);
drop policy if exists "rehab_journal_entries_delete_own" on public.rehab_journal_entries;

-- rehab_clinical_item_state
drop policy if exists "rehab_clinical_item_state_select_own" on public.rehab_clinical_item_state;
create policy "rehab_clinical_item_state_select_own" on public.rehab_clinical_item_state
  for select using (auth.uid() = user_id and deleted_at is null);
drop policy if exists "rehab_clinical_item_state_delete_own" on public.rehab_clinical_item_state;

-- rehab_plan_item_state
drop policy if exists "rehab_plan_item_state_select_own" on public.rehab_plan_item_state;
create policy "rehab_plan_item_state_select_own" on public.rehab_plan_item_state
  for select using (auth.uid() = user_id and deleted_at is null);
drop policy if exists "rehab_plan_item_state_delete_own" on public.rehab_plan_item_state;

-- todo_items
drop policy if exists "todo_items_select_own" on public.todo_items;
create policy "todo_items_select_own" on public.todo_items
  for select using (auth.uid() = user_id and deleted_at is null);
drop policy if exists "todo_items_delete_own" on public.todo_items;

-- todo_subtasks
drop policy if exists "todo_subtasks_select_own" on public.todo_subtasks;
create policy "todo_subtasks_select_own" on public.todo_subtasks
  for select using (
    exists (
      select 1 from public.todo_items ti
      where ti.id = todo_subtasks.todo_item_id
        and ti.user_id = auth.uid()
        and ti.deleted_at is null
    )
    and deleted_at is null
  );
drop policy if exists "todo_subtasks_delete_own" on public.todo_subtasks;

-- todo_comments
drop policy if exists "todo_comments_select_own" on public.todo_comments;
create policy "todo_comments_select_own" on public.todo_comments
  for select using (
    exists (
      select 1 from public.todo_items ti
      where ti.id = todo_comments.todo_item_id
        and ti.user_id = auth.uid()
        and ti.deleted_at is null
    )
    and deleted_at is null
  );
drop policy if exists "todo_comments_delete_own" on public.todo_comments;

-- todo_tags
drop policy if exists "todo_tags_select_own" on public.todo_tags;
create policy "todo_tags_select_own" on public.todo_tags
  for select using (auth.uid() = user_id and deleted_at is null);
drop policy if exists "todo_tags_delete_own" on public.todo_tags;

-- todo_attachments
drop policy if exists "todo_attachments_select_own" on public.todo_attachments;
create policy "todo_attachments_select_own" on public.todo_attachments
  for select using (
    exists (
      select 1 from public.todo_items ti
      where ti.id = todo_attachments.todo_item_id
        and ti.user_id = auth.uid()
        and ti.deleted_at is null
    )
    and deleted_at is null
  );
drop policy if exists "todo_attachments_delete_own" on public.todo_attachments;

-- shopping_list_items (household)
drop policy if exists "shopping_list_select_household" on public.shopping_list_items;
create policy "shopping_list_select_household" on public.shopping_list_items
  for select using (
    user_id = public.household_owner_for(auth.uid())
    and deleted_at is null
  );
drop policy if exists "shopping_list_delete_household" on public.shopping_list_items;

-- staples (household)
drop policy if exists "staples_select_household" on public.staples;
create policy "staples_select_household" on public.staples
  for select using (
    user_id = public.household_owner_for(auth.uid())
    and deleted_at is null
  );
drop policy if exists "staples_delete_household" on public.staples;

-- purchase_events (household)
drop policy if exists "purchase_events_select_household" on public.purchase_events;
create policy "purchase_events_select_household" on public.purchase_events
  for select using (
    user_id = public.household_owner_for(auth.uid())
    and deleted_at is null
  );
drop policy if exists "purchase_events_delete_household" on public.purchase_events;

-- rule_of_3
drop policy if exists "rule_of_3_days_select_own" on public.rule_of_3_days;
create policy "rule_of_3_days_select_own" on public.rule_of_3_days
  for select using (auth.uid() = user_id and deleted_at is null);
drop policy if exists "rule_of_3_days_delete_own" on public.rule_of_3_days;

drop policy if exists "rule_of_3_items_select_own" on public.rule_of_3_items;
create policy "rule_of_3_items_select_own" on public.rule_of_3_items
  for select using (
    exists (
      select 1 from public.rule_of_3_days d
      where d.id = rule_of_3_items.day_id
        and d.user_id = auth.uid()
        and d.deleted_at is null
    )
    and deleted_at is null
  );
drop policy if exists "rule_of_3_items_delete_own" on public.rule_of_3_items;

-- household_members: partial unique so re-pairing works after soft delete
alter table public.household_members
  drop constraint if exists household_members_owner_member_unique;

create unique index if not exists household_members_owner_member_active_idx
  on public.household_members (owner_user_id, member_user_id)
  where deleted_at is null;

-- household_members
drop policy if exists "household_members_select_own" on public.household_members;
create policy "household_members_select_own" on public.household_members
  for select using (
    owner_user_id = (select auth.uid())
    and deleted_at is null
  );
drop policy if exists "household_members_delete_own" on public.household_members;

-- push_subscriptions
drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select using (auth.uid() = user_id and deleted_at is null);
drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;

-- notifications
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id and deleted_at is null);
