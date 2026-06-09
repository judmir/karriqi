-- Speech practice recordings. Metadata lives in public.rehab_speech_recordings;
-- audio bytes live in the private 'rehab-speech-recordings' storage bucket under
-- the path '<owner_user_id>/<rehab_plan_event_id>/<recording_id>.<ext>'.

create table public.rehab_speech_recordings (
  id uuid primary key default gen_random_uuid(),
  rehab_plan_event_id uuid not null references public.rehab_plan_events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  duration_seconds numeric(10, 3),
  storage_path text not null,
  created_at timestamptz not null default now(),
  constraint rehab_speech_recordings_file_name_not_blank check (length(trim(file_name)) > 0),
  constraint rehab_speech_recordings_storage_path_not_blank check (length(trim(storage_path)) > 0),
  constraint rehab_speech_recordings_storage_path_unique unique (storage_path),
  constraint rehab_speech_recordings_duration_non_negative check (
    duration_seconds is null or duration_seconds >= 0
  )
);

create index rehab_speech_recordings_event_created_idx
  on public.rehab_speech_recordings (rehab_plan_event_id, created_at desc);

alter table public.rehab_speech_recordings enable row level security;

create policy "rehab_speech_recordings_select_own" on public.rehab_speech_recordings
  for select using (
    exists (
      select 1 from public.rehab_plan_events e
      where e.id = rehab_plan_event_id and e.user_id = auth.uid()
    )
  );

create policy "rehab_speech_recordings_insert_own" on public.rehab_speech_recordings
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.rehab_plan_events e
      where e.id = rehab_plan_event_id
        and e.user_id = auth.uid()
        and e.event_kind = 'speech'
    )
  );

create policy "rehab_speech_recordings_delete_own" on public.rehab_speech_recordings
  for delete using (
    exists (
      select 1 from public.rehab_plan_events e
      where e.id = rehab_plan_event_id and e.user_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public)
values ('rehab-speech-recordings', 'rehab-speech-recordings', false)
on conflict (id) do nothing;

create policy "rehab_speech_recordings_storage_select"
  on storage.objects for select
  using (
    bucket_id = 'rehab-speech-recordings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "rehab_speech_recordings_storage_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'rehab-speech-recordings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "rehab_speech_recordings_storage_delete"
  on storage.objects for delete
  using (
    bucket_id = 'rehab-speech-recordings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
