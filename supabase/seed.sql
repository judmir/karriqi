-- Local dev fixtures for `supabase db reset` (worktree local Supabase only).
--
-- Sign in: /auth/sign-in
--   Local dev picker: one-click Judi or Savina
--   PIN: judikarriqi@gmail.com → 123456 | savinakarriqi@gmail.com → 654321
--   Email fallback: devpassword123 for either account
--
-- Fixed UUIDs (stable across resets; match production accounts):
--   judi    e18a4b29-ed05-4140-99af-9f6a8c906074
--   savina  fbf3f6b3-2aff-4a72-9c1d-22cda9cdf398

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Auth users
-- ---------------------------------------------------------------------------

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'judikarriqi@gmail.com',
    crypt('devpassword123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Judi","avatar_preset":"preset-1"}',
    now(),
    now(),
    '', '', '', ''
  ),
  (
    'fbf3f6b3-2aff-4a72-9c1d-22cda9cdf398',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'savinakarriqi@gmail.com',
    crypt('devpassword123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Savina","avatar_preset":"preset-2"}',
    now(),
    now(),
    '', '', '', ''
  )
on conflict (id) do nothing;

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    '{"sub":"e18a4b29-ed05-4140-99af-9f6a8c906074","email":"judikarriqi@gmail.com"}'::jsonb,
    'email',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    now(),
    now(),
    now()
  ),
  (
    'fbf3f6b3-2aff-4a72-9c1d-22cda9cdf398',
    'fbf3f6b3-2aff-4a72-9c1d-22cda9cdf398',
    '{"sub":"fbf3f6b3-2aff-4a72-9c1d-22cda9cdf398","email":"savinakarriqi@gmail.com"}'::jsonb,
    'email',
    'fbf3f6b3-2aff-4a72-9c1d-22cda9cdf398',
    now(),
    now(),
    now()
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Household (assignees)
-- ---------------------------------------------------------------------------

insert into public.household_members (owner_user_id, member_user_id, display_name)
values (
  'e18a4b29-ed05-4140-99af-9f6a8c906074',
  'fbf3f6b3-2aff-4a72-9c1d-22cda9cdf398',
  'Savina'
)
on conflict (owner_user_id, member_user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Kanban / todo board
-- ---------------------------------------------------------------------------

insert into public.todo_items (
  id,
  user_id,
  assigned_user_id,
  title,
  category,
  description,
  status,
  priority,
  position,
  list_order,
  due_at,
  progress_percent
)
values
  (
    'a1000001-0000-0000-0000-000000000001',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    'fbf3f6b3-2aff-4a72-9c1d-22cda9cdf398',
    'Renew car insurance',
    'Admin',
    'Compare quotes before the policy expires.',
    'backlog',
    'highest',
    0,
    1,
    now() + interval '3 days',
    0
  ),
  (
    'a1000001-0000-0000-0000-000000000002',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    null,
    'Buy birthday gift',
    'Family',
    'Savina mentioned a book on gardening.',
    'backlog',
    'high',
    1,
    2,
    now() + interval '5 days',
    0
  ),
  (
    'a1000001-0000-0000-0000-000000000003',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    'Fix kitchen tap',
    'Home',
    'Dripping under the sink — washer likely worn.',
    'backlog',
    'medium',
    2,
    3,
    null,
    0
  ),
  (
    'a1000001-0000-0000-0000-000000000004',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    'fbf3f6b3-2aff-4a72-9c1d-22cda9cdf398',
    'Prepare school lunches',
    'Family',
    'Meal prep for Mon–Wed.',
    'in_progress',
    'high',
    0,
    4,
    now() + interval '1 day',
    20
  ),
  (
    'a1000001-0000-0000-0000-000000000005',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    null,
    'Sort recycling',
    'Home',
    null,
    'in_progress',
    'low',
    1,
    5,
    null,
    20
  ),
  (
    'a1000001-0000-0000-0000-000000000006',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    'Pay electricity bill',
    'Admin',
    'Uploaded receipt to email.',
    'done',
    'medium',
    0,
    6,
    now() - interval '2 days',
    100
  ),
  (
    'a1000001-0000-0000-0000-000000000007',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    null,
    'Vacuum living room',
    'Home',
    null,
    'done',
    'lowest',
    1,
    7,
    now() - interval '1 day',
    100
  )
on conflict (id) do nothing;

insert into public.todo_subtasks (id, todo_item_id, label, done, position)
values
  (
    'a2000001-0000-0000-0000-000000000001',
    'a1000001-0000-0000-0000-000000000004',
    'Check fridge staples',
    true,
    0
  ),
  (
    'a2000001-0000-0000-0000-000000000002',
    'a1000001-0000-0000-0000-000000000004',
    'Pack fruit portions',
    false,
    1
  ),
  (
    'a2000001-0000-0000-0000-000000000003',
    'a1000001-0000-0000-0000-000000000001',
    'Collect last year policy PDF',
    false,
    0
  )
on conflict (id) do nothing;

insert into public.todo_comments (id, todo_item_id, user_id, body)
values
  (
    'a3000001-0000-0000-0000-000000000001',
    'a1000001-0000-0000-0000-000000000004',
    'fbf3f6b3-2aff-4a72-9c1d-22cda9cdf398',
    'I can handle Tuesday and Wednesday.'
  ),
  (
    'a3000001-0000-0000-0000-000000000002',
    'a1000001-0000-0000-0000-000000000001',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    'Deadline is end of month — don''t wait too long.'
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Shopping list
-- ---------------------------------------------------------------------------

insert into public.staples (id, user_id, name, typical_interval_days)
values
  (
    'b2000001-0000-0000-0000-000000000001',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    'Qumësht',
    5
  ),
  (
    'b2000001-0000-0000-0000-000000000002',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    'Vezë',
    7
  ),
  (
    'b2000001-0000-0000-0000-000000000003',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    'Bukë',
    4
  )
on conflict do nothing;

insert into public.shopping_list_items (
  id,
  user_id,
  staple_id,
  name,
  quantity,
  checked,
  position
)
values
  (
    'b1000001-0000-0000-0000-000000000001',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    'b2000001-0000-0000-0000-000000000001',
    'Qumësht',
    '2 L',
    false,
    0
  ),
  (
    'b1000001-0000-0000-0000-000000000002',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    'b2000001-0000-0000-0000-000000000002',
    'Vezë',
    '12',
    false,
    1
  ),
  (
    'b1000001-0000-0000-0000-000000000003',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    'b2000001-0000-0000-0000-000000000003',
    'Bukë',
    '1',
    true,
    2
  ),
  (
    'b1000001-0000-0000-0000-000000000004',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    null,
    'Banane',
    '1 kg',
    false,
    3
  ),
  (
    'b1000001-0000-0000-0000-000000000005',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    null,
    'Detergent',
    null,
    false,
    4
  ),
  (
    'b1000001-0000-0000-0000-000000000006',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    null,
    'Kafe',
    '250 g',
    true,
    5
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Calendar
-- ---------------------------------------------------------------------------

insert into public.calendar_events (
  id,
  user_id,
  title,
  description,
  start_at,
  end_at,
  all_day,
  color
)
values
  (
    'c1000001-0000-0000-0000-000000000001',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    'Dentist appointment',
    'Annual check-up',
    date_trunc('day', now()) + interval '1 day' + interval '10 hours',
    date_trunc('day', now()) + interval '1 day' + interval '11 hours',
    false,
    'blue'
  ),
  (
    'c1000001-0000-0000-0000-000000000002',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    'Parents evening',
    'School hall — arrive 10 min early',
    date_trunc('day', now()) + interval '3 days' + interval '18 hours',
    date_trunc('day', now()) + interval '3 days' + interval '20 hours',
    false,
    'purple'
  ),
  (
    'c1000001-0000-0000-0000-000000000003',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    'Weekend trip',
    'Pack bags Friday night',
    date_trunc('day', now()) + interval '5 days',
    date_trunc('day', now()) + interval '7 days',
    true,
    'green'
  ),
  (
    'c1000001-0000-0000-0000-000000000004',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    'Bin collection',
    null,
    date_trunc('day', now()) + interval '2 days' + interval '7 hours',
    date_trunc('day', now()) + interval '2 days' + interval '8 hours',
    false,
    'orange'
  ),
  (
    'c1000001-0000-0000-0000-000000000005',
    'e18a4b29-ed05-4140-99af-9f6a8c906074',
    'Pay rent',
    'Standing order should have gone out',
    date_trunc('day', now()) - interval '1 day' + interval '9 hours',
    date_trunc('day', now()) - interval '1 day' + interval '9 hours 30 minutes',
    false,
    'red'
  )
on conflict (id) do nothing;
