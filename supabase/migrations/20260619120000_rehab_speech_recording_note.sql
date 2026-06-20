-- Optional context for why a speech recording was made.

alter table public.rehab_speech_recordings
  add column if not exists note text;

comment on column public.rehab_speech_recordings.note is
  'Optional user note explaining why this recording was made.';
