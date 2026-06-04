-- Rule of 3 daily planning (private per-user). Each day has up to 3 ranked items.
-- A day row exists per (user, plan_date); items are positions 1-3 within a day.

create table public.rule_of_3_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_date date not null,
  reflection text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

create index rule_of_3_days_user_date_idx
  on public.rule_of_3_days (user_id, plan_date desc);

create trigger rule_of_3_days_set_updated_at
  before update on public.rule_of_3_days
  for each row
  execute function public.calendar_events_touch_updated_at();

alter table public.rule_of_3_days enable row level security;

create policy "rule_of_3_days_select_own" on public.rule_of_3_days
  for select using (auth.uid() = user_id);

create policy "rule_of_3_days_insert_own" on public.rule_of_3_days
  for insert with check (auth.uid() = user_id);

create policy "rule_of_3_days_update_own" on public.rule_of_3_days
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "rule_of_3_days_delete_own" on public.rule_of_3_days
  for delete using (auth.uid() = user_id);

create table public.rule_of_3_items (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.rule_of_3_days (id) on delete cascade,
  position integer not null,
  title text not null default '',
  notes text not null default '',
  completed_at timestamptz,
  blocked_reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rule_of_3_items_position_valid check (position between 1 and 3),
  unique (day_id, position)
);

create index rule_of_3_items_day_idx on public.rule_of_3_items (day_id);

create trigger rule_of_3_items_set_updated_at
  before update on public.rule_of_3_items
  for each row
  execute function public.calendar_events_touch_updated_at();

alter table public.rule_of_3_items enable row level security;

create policy "rule_of_3_items_select_own" on public.rule_of_3_items
  for select using (
    exists (
      select 1 from public.rule_of_3_days d
      where d.id = rule_of_3_items.day_id and d.user_id = auth.uid()
    )
  );

create policy "rule_of_3_items_insert_own" on public.rule_of_3_items
  for insert with check (
    exists (
      select 1 from public.rule_of_3_days d
      where d.id = rule_of_3_items.day_id and d.user_id = auth.uid()
    )
  );

create policy "rule_of_3_items_update_own" on public.rule_of_3_items
  for update using (
    exists (
      select 1 from public.rule_of_3_days d
      where d.id = rule_of_3_items.day_id and d.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.rule_of_3_days d
      where d.id = rule_of_3_items.day_id and d.user_id = auth.uid()
    )
  );

create policy "rule_of_3_items_delete_own" on public.rule_of_3_items
  for delete using (
    exists (
      select 1 from public.rule_of_3_days d
      where d.id = rule_of_3_items.day_id and d.user_id = auth.uid()
    )
  );
