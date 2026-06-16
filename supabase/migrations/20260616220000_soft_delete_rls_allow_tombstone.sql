-- Soft-delete UPDATE fails when SELECT RLS requires deleted_at IS NULL: Postgres
-- re-checks SELECT on the new row (WHERE / RETURNING). Tombstones stay hidden in
-- the app via explicit .is('deleted_at', null) on reads; RLS only scopes by owner.

-- ---------------------------------------------------------------------------
-- SELECT: owner/household scope only (no deleted_at filter at RLS layer)
-- ---------------------------------------------------------------------------

drop policy if exists "calendar_events_select_own" on public.calendar_events;
create policy "calendar_events_select_own" on public.calendar_events
  for select using (auth.uid() = user_id);

drop policy if exists "rehab_plan_events_select_own" on public.rehab_plan_events;
create policy "rehab_plan_events_select_own" on public.rehab_plan_events
  for select using (auth.uid() = user_id);

drop policy if exists "rehab_speech_recordings_select_own" on public.rehab_speech_recordings;
create policy "rehab_speech_recordings_select_own" on public.rehab_speech_recordings
  for select using (
    exists (
      select 1 from public.rehab_plan_events e
      where e.id = rehab_plan_event_id
        and e.user_id = auth.uid()
        and e.deleted_at is null
    )
    and auth.uid() = user_id
  );

drop policy if exists "rehab_journal_entries_select_own" on public.rehab_journal_entries;
create policy "rehab_journal_entries_select_own" on public.rehab_journal_entries
  for select using (auth.uid() = user_id);

drop policy if exists "rehab_clinical_item_state_select_own" on public.rehab_clinical_item_state;
create policy "rehab_clinical_item_state_select_own" on public.rehab_clinical_item_state
  for select using (auth.uid() = user_id);

drop policy if exists "rehab_plan_item_state_select_own" on public.rehab_plan_item_state;
create policy "rehab_plan_item_state_select_own" on public.rehab_plan_item_state
  for select using (auth.uid() = user_id);

drop policy if exists "todo_items_select_own" on public.todo_items;
create policy "todo_items_select_own" on public.todo_items
  for select using (auth.uid() = user_id);

drop policy if exists "todo_subtasks_select_own" on public.todo_subtasks;
create policy "todo_subtasks_select_own" on public.todo_subtasks
  for select using (
    exists (
      select 1 from public.todo_items ti
      where ti.id = todo_subtasks.todo_item_id
        and ti.user_id = auth.uid()
        and ti.deleted_at is null
    )
  );

drop policy if exists "todo_comments_select_own" on public.todo_comments;
create policy "todo_comments_select_own" on public.todo_comments
  for select using (
    exists (
      select 1 from public.todo_items ti
      where ti.id = todo_comments.todo_item_id
        and ti.user_id = auth.uid()
        and ti.deleted_at is null
    )
  );

drop policy if exists "todo_tags_select_own" on public.todo_tags;
create policy "todo_tags_select_own" on public.todo_tags
  for select using (auth.uid() = user_id);

drop policy if exists "todo_attachments_select_own" on public.todo_attachments;
create policy "todo_attachments_select_own" on public.todo_attachments
  for select using (
    exists (
      select 1 from public.todo_items ti
      where ti.id = todo_attachments.todo_item_id
        and ti.user_id = auth.uid()
        and ti.deleted_at is null
    )
  );

drop policy if exists "shopping_list_select_household" on public.shopping_list_items;
create policy "shopping_list_select_household" on public.shopping_list_items
  for select using (user_id = public.household_owner_for(auth.uid()));

drop policy if exists "staples_select_household" on public.staples;
create policy "staples_select_household" on public.staples
  for select using (user_id = public.household_owner_for(auth.uid()));

drop policy if exists "purchase_events_select_household" on public.purchase_events;
create policy "purchase_events_select_household" on public.purchase_events
  for select using (user_id = public.household_owner_for(auth.uid()));

drop policy if exists "rule_of_3_days_select_own" on public.rule_of_3_days;
create policy "rule_of_3_days_select_own" on public.rule_of_3_days
  for select using (auth.uid() = user_id);

drop policy if exists "rule_of_3_items_select_own" on public.rule_of_3_items;
create policy "rule_of_3_items_select_own" on public.rule_of_3_items
  for select using (
    exists (
      select 1 from public.rule_of_3_days d
      where d.id = rule_of_3_items.day_id
        and d.user_id = auth.uid()
        and d.deleted_at is null
    )
  );

drop policy if exists "household_members_select_own" on public.household_members;
create policy "household_members_select_own" on public.household_members
  for select using (owner_user_id = (select auth.uid()));

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- UPDATE: may only touch active rows; WITH CHECK allows setting deleted_at
-- ---------------------------------------------------------------------------

drop policy if exists "calendar_events_update_own" on public.calendar_events;
create policy "calendar_events_update_own" on public.calendar_events
  for update
  using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

drop policy if exists "rehab_plan_events_update_own" on public.rehab_plan_events;
create policy "rehab_plan_events_update_own" on public.rehab_plan_events
  for update
  using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

drop policy if exists "rehab_journal_entries_update_own" on public.rehab_journal_entries;
create policy "rehab_journal_entries_update_own" on public.rehab_journal_entries
  for update
  using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

drop policy if exists "rehab_clinical_item_state_update_own" on public.rehab_clinical_item_state;
create policy "rehab_clinical_item_state_update_own" on public.rehab_clinical_item_state
  for update
  using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

drop policy if exists "rehab_plan_item_state_update_own" on public.rehab_plan_item_state;
create policy "rehab_plan_item_state_update_own" on public.rehab_plan_item_state
  for update
  using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

drop policy if exists "todo_items_update_own" on public.todo_items;
create policy "todo_items_update_own" on public.todo_items
  for update
  using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

drop policy if exists "todo_tags_update_own" on public.todo_tags;
create policy "todo_tags_update_own" on public.todo_tags
  for update
  using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

drop policy if exists "rule_of_3_days_update_own" on public.rule_of_3_days;
create policy "rule_of_3_days_update_own" on public.rule_of_3_days
  for update
  using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

drop policy if exists "rule_of_3_items_update_own" on public.rule_of_3_items;
create policy "rule_of_3_items_update_own" on public.rule_of_3_items
  for update
  using (
    deleted_at is null
    and exists (
      select 1 from public.rule_of_3_days d
      where d.id = rule_of_3_items.day_id
        and d.user_id = auth.uid()
        and d.deleted_at is null
    )
  )
  with check (
    exists (
      select 1 from public.rule_of_3_days d
      where d.id = rule_of_3_items.day_id
        and d.user_id = auth.uid()
        and d.deleted_at is null
    )
  );

drop policy if exists "todo_subtasks_update_own" on public.todo_subtasks;
create policy "todo_subtasks_update_own" on public.todo_subtasks
  for update
  using (
    deleted_at is null
    and exists (
      select 1 from public.todo_items i
      where i.id = todo_subtasks.todo_item_id
        and i.user_id = auth.uid()
        and i.deleted_at is null
    )
  )
  with check (
    exists (
      select 1 from public.todo_items i
      where i.id = todo_subtasks.todo_item_id
        and i.user_id = auth.uid()
        and i.deleted_at is null
    )
  );

drop policy if exists "todo_comments_update_own" on public.todo_comments;
create policy "todo_comments_update_own" on public.todo_comments
  for update
  using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

drop policy if exists "todo_attachments_update_own" on public.todo_attachments;
create policy "todo_attachments_update_own" on public.todo_attachments
  for update
  using (
    deleted_at is null
    and exists (
      select 1 from public.todo_items i
      where i.id = todo_attachments.todo_item_id
        and i.user_id = auth.uid()
        and i.deleted_at is null
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.todo_items i
      where i.id = todo_attachments.todo_item_id
        and i.user_id = auth.uid()
        and i.deleted_at is null
    )
  );

drop policy if exists "rehab_speech_recordings_update_own" on public.rehab_speech_recordings;
create policy "rehab_speech_recordings_update_own" on public.rehab_speech_recordings
  for update
  using (
    auth.uid() = user_id
    and deleted_at is null
    and exists (
      select 1 from public.rehab_plan_events e
      where e.id = rehab_plan_event_id
        and e.user_id = auth.uid()
        and e.deleted_at is null
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.rehab_plan_events e
      where e.id = rehab_plan_event_id
        and e.user_id = auth.uid()
        and e.deleted_at is null
    )
  );

drop policy if exists "shopping_list_update_household" on public.shopping_list_items;
create policy "shopping_list_update_household"
  on public.shopping_list_items
  for update
  using (
    user_id = public.household_owner_for(auth.uid())
    and deleted_at is null
  )
  with check (user_id = public.household_owner_for(auth.uid()));

drop policy if exists "staples_update_household" on public.staples;
create policy "staples_update_household"
  on public.staples
  for update
  using (
    user_id = public.household_owner_for(auth.uid())
    and deleted_at is null
  )
  with check (user_id = public.household_owner_for(auth.uid()));

drop policy if exists "purchase_events_update_household" on public.purchase_events;
create policy "purchase_events_update_household"
  on public.purchase_events
  for update
  using (
    user_id = public.household_owner_for(auth.uid())
    and deleted_at is null
  )
  with check (user_id = public.household_owner_for(auth.uid()));

drop policy if exists "household_members_update_own" on public.household_members;
create policy "household_members_update_own"
  on public.household_members
  for update
  using (owner_user_id = (select auth.uid()) and deleted_at is null)
  with check (owner_user_id = (select auth.uid()));

drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own"
  on public.push_subscriptions
  for update
  using (user_id = (select auth.uid()) and deleted_at is null)
  with check (user_id = (select auth.uid()));

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications
  for update
  using (user_id = (select auth.uid()) and deleted_at is null)
  with check (user_id = (select auth.uid()));
