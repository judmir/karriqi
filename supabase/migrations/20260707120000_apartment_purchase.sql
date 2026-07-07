-- Apartment purchase dashboard (Cicerostraße WE28).
-- Persists user-editable state: gallery images (bytes in the private
-- 'apartment-images' bucket under '<user_id>/<image_id>.<ext>'), free-form
-- case notes, per-step status overrides (progress / post-closing / rental
-- notice checklists) and the editable room list for the floorplan section.
-- Static facts (price, loan figures, document categories) stay in code:
-- lib/apartment/cicerostrasse-we28-data.ts

create or replace function public.apartment_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Gallery images
-- ---------------------------------------------------------------------------

create table public.apartment_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  title text not null default '',
  caption text,
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint apartment_images_storage_path_not_blank check (length(trim(storage_path)) > 0)
);

create unique index apartment_images_storage_path_unique
  on public.apartment_images (storage_path)
  where deleted_at is null;

create index apartment_images_user_sort_idx
  on public.apartment_images (user_id, sort_order)
  where deleted_at is null;

create trigger apartment_images_set_updated_at
  before update on public.apartment_images
  for each row execute function public.apartment_touch_updated_at();

alter table public.apartment_images enable row level security;

create policy "apartment_images_select_own" on public.apartment_images
  for select using (user_id = auth.uid() and deleted_at is null);

create policy "apartment_images_insert_own" on public.apartment_images
  for insert with check (user_id = auth.uid());

create policy "apartment_images_update_own" on public.apartment_images
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Case notes (one active row per user)
-- ---------------------------------------------------------------------------

create table public.apartment_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  -- Full unique (not partial): rows are state, never tombstoned, and
  -- PostgREST upsert (on_conflict=user_id) needs a matching constraint.
  constraint apartment_notes_user_unique unique (user_id)
);

create trigger apartment_notes_set_updated_at
  before update on public.apartment_notes
  for each row execute function public.apartment_touch_updated_at();

alter table public.apartment_notes enable row level security;

create policy "apartment_notes_select_own" on public.apartment_notes
  for select using (user_id = auth.uid() and deleted_at is null);

create policy "apartment_notes_insert_own" on public.apartment_notes
  for insert with check (user_id = auth.uid());

create policy "apartment_notes_update_own" on public.apartment_notes
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Step states — overrides seed defaults per step key.
-- kind: 'progress' (path to keys), 'closing' (post-closing checklist),
--       'rental' (rental apartment notice checklist)
-- ---------------------------------------------------------------------------

create table public.apartment_step_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('progress', 'closing', 'rental')),
  step_key text not null,
  status text not null check (status in ('done', 'current', 'todo', 'blocked')),
  date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint apartment_step_states_step_key_not_blank check (length(trim(step_key)) > 0),
  -- Full unique (not partial): rows are state, never tombstoned, and
  -- PostgREST upsert (on_conflict=user_id,kind,step_key) needs a constraint.
  constraint apartment_step_states_user_kind_step_unique unique (user_id, kind, step_key)
);

create trigger apartment_step_states_set_updated_at
  before update on public.apartment_step_states
  for each row execute function public.apartment_touch_updated_at();

alter table public.apartment_step_states enable row level security;

create policy "apartment_step_states_select_own" on public.apartment_step_states
  for select using (user_id = auth.uid() and deleted_at is null);

create policy "apartment_step_states_insert_own" on public.apartment_step_states
  for insert with check (user_id = auth.uid());

create policy "apartment_step_states_update_own" on public.apartment_step_states
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Editable room list (floorplan section; dimensions are manual/approximate)
-- ---------------------------------------------------------------------------

create table public.apartment_rooms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  area_m2 numeric(8, 2),
  width_m numeric(6, 2),
  length_m numeric(6, 2),
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint apartment_rooms_name_not_blank check (length(trim(name)) > 0)
);

create index apartment_rooms_user_sort_idx
  on public.apartment_rooms (user_id, sort_order)
  where deleted_at is null;

create trigger apartment_rooms_set_updated_at
  before update on public.apartment_rooms
  for each row execute function public.apartment_touch_updated_at();

alter table public.apartment_rooms enable row level security;

create policy "apartment_rooms_select_own" on public.apartment_rooms
  for select using (user_id = auth.uid() and deleted_at is null);

create policy "apartment_rooms_insert_own" on public.apartment_rooms
  for insert with check (user_id = auth.uid());

create policy "apartment_rooms_update_own" on public.apartment_rooms
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage bucket for gallery photos (private; path prefix = user id)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values ('apartment-images', 'apartment-images', false, 26214400)
on conflict (id) do nothing;

create policy "apartment_images_storage_select"
  on storage.objects for select
  using (
    bucket_id = 'apartment-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "apartment_images_storage_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'apartment-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "apartment_images_storage_update"
  on storage.objects for update
  using (
    bucket_id = 'apartment-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'apartment-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "apartment_images_storage_delete"
  on storage.objects for delete
  using (
    bucket_id = 'apartment-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
