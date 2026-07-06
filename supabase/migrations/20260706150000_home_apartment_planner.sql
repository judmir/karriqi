-- Home apartment planner.
--
--   * user_openai_keys   — per-user OpenAI API key, encrypted at rest with a
--                          server-only master key (HOME_SECRETS_ENCRYPTION_KEY).
--                          Service-role only, like user_pins. Hard-delete is an
--                          allowed exception (credential row keyed by user_id).
--   * home_room_designs  — AI/user furnishing plans for a fixed apartment room.
--                          Owner RLS + soft delete (deleted_at).
--   * home_design_renders — generated inspiration render metadata; bytes live in
--                          the private 'home-renders' storage bucket. Soft delete.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- user_openai_keys (service-role only)
-- ---------------------------------------------------------------------------
create table public.user_openai_keys (
  user_id uuid primary key references auth.users (id) on delete cascade,
  encrypted_key text not null,
  key_hint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_openai_keys is
  'Per-user OpenAI API key, AES-256-GCM encrypted with HOME_SECRETS_ENCRYPTION_KEY. Service-role only.';

alter table public.user_openai_keys enable row level security;

create policy "user_openai_keys_service_only_select"
  on public.user_openai_keys for select
  to service_role
  using (true);

create policy "user_openai_keys_service_only_insert"
  on public.user_openai_keys for insert
  to service_role
  with check (true);

create policy "user_openai_keys_service_only_update"
  on public.user_openai_keys for update
  to service_role
  using (true)
  with check (true);

create policy "user_openai_keys_service_only_delete"
  on public.user_openai_keys for delete
  to service_role
  using (true);

-- ---------------------------------------------------------------------------
-- home_room_designs (owner RLS + soft delete)
-- ---------------------------------------------------------------------------
create table public.home_room_designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  apartment_id text not null default 'cicerostrasse-we28',
  room_id text not null,

  title text not null,
  style_prompt text not null default '',
  layout jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  status text not null default 'draft',

  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint home_room_designs_status_check check (status in ('draft', 'saved')),
  constraint home_room_designs_title_not_blank check (length(trim(title)) > 0)
);

comment on table public.home_room_designs is
  'Furnishing plans for a fixed apartment room. layout holds validated furniture items in cm.';

create index home_room_designs_user_room_idx
  on public.home_room_designs (user_id, room_id)
  where deleted_at is null;
create index home_room_designs_user_created_desc_idx
  on public.home_room_designs (user_id, created_at desc)
  where deleted_at is null;

create or replace function public.home_room_designs_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger home_room_designs_set_updated_at
  before update on public.home_room_designs
  for each row
  execute function public.home_room_designs_touch_updated_at();

alter table public.home_room_designs enable row level security;

create policy "home_room_designs_select_own"
  on public.home_room_designs for select
  using (user_id = (select auth.uid()) and deleted_at is null);

create policy "home_room_designs_insert_own"
  on public.home_room_designs for insert
  with check (user_id = (select auth.uid()));

create policy "home_room_designs_update_own"
  on public.home_room_designs for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.home_room_designs to authenticated;

-- ---------------------------------------------------------------------------
-- home_design_renders (owner RLS + soft delete)
-- ---------------------------------------------------------------------------
create table public.home_design_renders (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.home_room_designs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,

  prompt text not null default '',
  storage_path text not null,

  deleted_at timestamptz,
  created_at timestamptz not null default now(),

  constraint home_design_renders_storage_path_not_blank check (length(trim(storage_path)) > 0),
  constraint home_design_renders_storage_path_unique unique (storage_path)
);

comment on table public.home_design_renders is
  'Metadata for AI inspiration renders; bytes live in the home-renders bucket.';

create index home_design_renders_design_created_idx
  on public.home_design_renders (design_id, created_at desc)
  where deleted_at is null;

alter table public.home_design_renders enable row level security;

create policy "home_design_renders_select_own"
  on public.home_design_renders for select
  using (user_id = (select auth.uid()) and deleted_at is null);

create policy "home_design_renders_insert_own"
  on public.home_design_renders for insert
  with check (user_id = (select auth.uid()));

create policy "home_design_renders_update_own"
  on public.home_design_renders for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.home_design_renders to authenticated;

-- ---------------------------------------------------------------------------
-- Private storage bucket for render images.
-- Path convention: '<owner_user_id>/<design_id>/<render_id>.png'
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('home-renders', 'home-renders', false)
on conflict (id) do nothing;

create policy "home_renders_storage_select"
  on storage.objects for select
  using (
    bucket_id = 'home-renders'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "home_renders_storage_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'home-renders'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "home_renders_storage_delete"
  on storage.objects for delete
  using (
    bucket_id = 'home-renders'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
