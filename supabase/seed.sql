-- Local dev fixtures for `supabase db reset` (worktree local Supabase only).
--
-- Sign in: "Use email & password instead" on /auth/sign-in
--   dev@karriqi.local     / devpassword123   (primary — owns all data)
--   partner@karriqi.local / devpassword123   (household member / assignee)
--
-- Fixed UUIDs (stable across resets):
--   dev user     11111111-1111-1111-1111-111111111111
--   partner user 22222222-2222-2222-2222-222222222222

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
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'dev@karriqi.local',
    crypt('devpassword123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Dev User","avatar_preset":"preset-1"}',
    now(),
    now(),
    '', '', '', ''
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'partner@karriqi.local',
    crypt('devpassword123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Partner","avatar_preset":"preset-2"}',
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
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '{"sub":"11111111-1111-1111-1111-111111111111","email":"dev@karriqi.local"}'::jsonb,
    'email',
    '11111111-1111-1111-1111-111111111111',
    now(),
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '{"sub":"22222222-2222-2222-2222-222222222222","email":"partner@karriqi.local"}'::jsonb,
    'email',
    '22222222-2222-2222-2222-222222222222',
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
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'Partner'
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
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
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
    '11111111-1111-1111-1111-111111111111',
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
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
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
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
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
    '11111111-1111-1111-1111-111111111111',
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
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
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
    '11111111-1111-1111-1111-111111111111',
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
    '22222222-2222-2222-2222-222222222222',
    'I can handle Tuesday and Wednesday.'
  ),
  (
    'a3000001-0000-0000-0000-000000000002',
    'a1000001-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
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
    '11111111-1111-1111-1111-111111111111',
    'Qumësht',
    5
  ),
  (
    'b2000001-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'Vezë',
    7
  ),
  (
    'b2000001-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
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
    '11111111-1111-1111-1111-111111111111',
    'b2000001-0000-0000-0000-000000000001',
    'Qumësht',
    '2 L',
    false,
    0
  ),
  (
    'b1000001-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'b2000001-0000-0000-0000-000000000002',
    'Vezë',
    '12',
    false,
    1
  ),
  (
    'b1000001-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'b2000001-0000-0000-0000-000000000003',
    'Bukë',
    '1',
    true,
    2
  ),
  (
    'b1000001-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    null,
    'Banane',
    '1 kg',
    false,
    3
  ),
  (
    'b1000001-0000-0000-0000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    null,
    'Detergent',
    null,
    false,
    4
  ),
  (
    'b1000001-0000-0000-0000-000000000006',
    '11111111-1111-1111-1111-111111111111',
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
    '11111111-1111-1111-1111-111111111111',
    'Dentist appointment',
    'Annual check-up',
    date_trunc('day', now()) + interval '1 day' + interval '10 hours',
    date_trunc('day', now()) + interval '1 day' + interval '11 hours',
    false,
    'blue'
  ),
  (
    'c1000001-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'Parents evening',
    'School hall — arrive 10 min early',
    date_trunc('day', now()) + interval '3 days' + interval '18 hours',
    date_trunc('day', now()) + interval '3 days' + interval '20 hours',
    false,
    'purple'
  ),
  (
    'c1000001-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'Weekend trip',
    'Pack bags Friday night',
    date_trunc('day', now()) + interval '5 days',
    date_trunc('day', now()) + interval '7 days',
    true,
    'green'
  ),
  (
    'c1000001-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'Bin collection',
    null,
    date_trunc('day', now()) + interval '2 days' + interval '7 hours',
    date_trunc('day', now()) + interval '2 days' + interval '8 hours',
    false,
    'orange'
  ),
  (
    'c1000001-0000-0000-0000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    'Pay rent',
    'Standing order should have gone out',
    date_trunc('day', now()) - interval '1 day' + interval '9 hours',
    date_trunc('day', now()) - interval '1 day' + interval '9 hours 30 minutes',
    false,
    'red'
  )
on conflict (id) do nothing;
