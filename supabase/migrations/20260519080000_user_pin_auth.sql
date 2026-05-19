-- PIN-based sign-in.
--
-- A user sets a numeric PIN (4-8 digits). The PIN is stored two ways:
--   1. `pin_lookup_hash` = HMAC-SHA256(pin, server pepper) — fast, deterministic,
--      enforced UNIQUE so we can identify which auth user a typed PIN belongs to
--      *without* the user picking a profile first. The pepper is a server-only
--      env var (`AUTH_PIN_PEPPER`); the DB alone cannot reveal the PIN.
--   2. `pin_hash` = a slow scrypt-style hash (`<salt>:<derived>`) used to verify
--      the PIN once we've found the candidate row.
--
-- Online brute-force is mitigated by per-user lockouts (column on this table)
-- AND a per-IP lockout in `pin_ip_attempts`. Service-role only RLS keeps both
-- tables out of reach of anon/auth clients; the user manages their PIN through
-- a server action that runs with `auth.uid()`.

create extension if not exists pgcrypto;

create table public.user_pins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  pin_lookup_hash text not null unique,
  pin_hash text not null,
  failed_count integer not null default 0,
  lockout_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_pins is
  'Per-user numeric PIN credentials. lookup hash is HMAC(pin, AUTH_PIN_PEPPER); verification hash is scrypt.';

alter table public.user_pins enable row level security;

-- Only the service-role key (server-only) can read/write the PIN table.
-- Authenticated users never need direct access; they go through server actions
-- and the /api/auth/pin route.

create policy "user_pins_service_only_select"
  on public.user_pins for select
  to service_role
  using (true);

create policy "user_pins_service_only_insert"
  on public.user_pins for insert
  to service_role
  with check (true);

create policy "user_pins_service_only_update"
  on public.user_pins for update
  to service_role
  using (true)
  with check (true);

create policy "user_pins_service_only_delete"
  on public.user_pins for delete
  to service_role
  using (true);

create table public.pin_ip_attempts (
  ip text primary key,
  failed_count integer not null default 0,
  lockout_until timestamptz,
  last_attempt_at timestamptz not null default now()
);

comment on table public.pin_ip_attempts is
  'Per-IP rate limiting for PIN sign-in attempts.';

alter table public.pin_ip_attempts enable row level security;

create policy "pin_ip_attempts_service_only_select"
  on public.pin_ip_attempts for select
  to service_role
  using (true);

create policy "pin_ip_attempts_service_only_insert"
  on public.pin_ip_attempts for insert
  to service_role
  with check (true);

create policy "pin_ip_attempts_service_only_update"
  on public.pin_ip_attempts for update
  to service_role
  using (true)
  with check (true);

create policy "pin_ip_attempts_service_only_delete"
  on public.pin_ip_attempts for delete
  to service_role
  using (true);
