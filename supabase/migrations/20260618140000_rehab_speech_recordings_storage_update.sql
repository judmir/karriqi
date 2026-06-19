-- Trim/replace overwrites an existing object in rehab-speech-recordings.
-- upsert and metadata updates need UPDATE policies (insert-only was not enough).

drop policy if exists "rehab_speech_recordings_storage_update"
  on storage.objects;

create policy "rehab_speech_recordings_storage_update"
  on storage.objects for update
  using (
    bucket_id = 'rehab-speech-recordings'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'rehab-speech-recordings'
    and auth.uid()::text = (storage.foldername(name))[1]
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
