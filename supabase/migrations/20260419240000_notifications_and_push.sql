-- In-app notification feed + Web Push subscription storage.
-- Inserts into public.notifications from app servers use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  href text,
  metadata jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

comment on table public.notifications is
  'Per-user notification rows; delivery via in-app list and optional Web Push.';

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = (select auth.uid()));

create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = (select auth.uid()));

-- No client insert/delete — service role only for insert from backend.

grant select, update on public.notifications to authenticated;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  updated_at timestamptz not null default now(),
  unique (endpoint)
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

comment on table public.push_subscriptions is
  'Web Push subscription keys per device; one row per endpoint.';

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  using (user_id = (select auth.uid()));

create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  with check (user_id = (select auth.uid()));

create policy "push_subscriptions_update_own"
  on public.push_subscriptions for update
  using (user_id = (select auth.uid()));

create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- Dedupe for scheduled “task stale” push (cleared when the task is edited).
alter table public.todo_items
  add column last_stale_notification_at timestamptz;

comment on column public.todo_items.last_stale_notification_at is
  'Set when a stale-task reminder was sent; reset on user activity via app.';
