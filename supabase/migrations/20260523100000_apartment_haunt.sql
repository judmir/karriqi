-- Apartment Haunt: household-shared apartment listings with per-user view tracking
-- and comments. Uses household_owner_for() for RLS (same pattern as shopping).

create table public.apartment_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  price_cents bigint,
  rooms numeric(3, 1),
  area_sqm numeric(6, 1),
  location text,
  source_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint apartment_listings_has_content check (
    length(trim(coalesce(title, ''))) > 0
    or price_cents is not null
    or rooms is not null
    or area_sqm is not null
    or length(trim(coalesce(location, ''))) > 0
    or length(trim(coalesce(source_url, ''))) > 0
  )
);

create table public.apartment_views (
  apartment_id uuid not null references public.apartment_listings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (apartment_id, user_id)
);

create table public.apartment_comments (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references public.apartment_listings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint apartment_comments_body_not_blank check (length(trim(body)) > 0)
);

create index apartment_listings_user_created_idx
  on public.apartment_listings (user_id, created_at desc);

create index apartment_views_apartment_idx
  on public.apartment_views (apartment_id);

create index apartment_comments_apartment_created_idx
  on public.apartment_comments (apartment_id, created_at);

create or replace function public.apartment_listings_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger apartment_listings_set_updated_at
  before update on public.apartment_listings
  for each row
  execute function public.apartment_listings_touch_updated_at();

alter table public.apartment_listings enable row level security;
alter table public.apartment_views enable row level security;
alter table public.apartment_comments enable row level security;

-- apartment_listings: household-shared
create policy "apartment_listings_select_household"
  on public.apartment_listings
  for select
  using (user_id = public.household_owner_for(auth.uid()));

create policy "apartment_listings_insert_household"
  on public.apartment_listings
  for insert
  with check (user_id = public.household_owner_for(auth.uid()));

create policy "apartment_listings_update_household"
  on public.apartment_listings
  for update
  using (user_id = public.household_owner_for(auth.uid()))
  with check (user_id = public.household_owner_for(auth.uid()));

create policy "apartment_listings_delete_household"
  on public.apartment_listings
  for delete
  using (user_id = public.household_owner_for(auth.uid()));

-- apartment_views: household members can read/write views on shared listings
create policy "apartment_views_select_household"
  on public.apartment_views
  for select
  using (
    exists (
      select 1
      from public.apartment_listings l
      where l.id = apartment_id
        and l.user_id = public.household_owner_for(auth.uid())
    )
  );

create policy "apartment_views_insert_household"
  on public.apartment_views
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.apartment_listings l
      where l.id = apartment_id
        and l.user_id = public.household_owner_for(auth.uid())
    )
  );

create policy "apartment_views_update_household"
  on public.apartment_views
  for update
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.apartment_listings l
      where l.id = apartment_id
        and l.user_id = public.household_owner_for(auth.uid())
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.apartment_listings l
      where l.id = apartment_id
        and l.user_id = public.household_owner_for(auth.uid())
    )
  );

create policy "apartment_views_delete_household"
  on public.apartment_views
  for delete
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.apartment_listings l
      where l.id = apartment_id
        and l.user_id = public.household_owner_for(auth.uid())
    )
  );

-- apartment_comments: household members can read/write on shared listings
create policy "apartment_comments_select_household"
  on public.apartment_comments
  for select
  using (
    exists (
      select 1
      from public.apartment_listings l
      where l.id = apartment_id
        and l.user_id = public.household_owner_for(auth.uid())
    )
  );

create policy "apartment_comments_insert_household"
  on public.apartment_comments
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.apartment_listings l
      where l.id = apartment_id
        and l.user_id = public.household_owner_for(auth.uid())
    )
  );

create policy "apartment_comments_delete_household"
  on public.apartment_comments
  for delete
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.apartment_listings l
      where l.id = apartment_id
        and l.user_id = public.household_owner_for(auth.uid())
    )
  );
