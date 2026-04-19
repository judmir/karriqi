-- Seed default Albanian staples for one account.
-- Run in Supabase Dashboard → SQL Editor.
--
-- Option 1 (easiest): set your Auth email below, then run the whole script.
-- Option 2: comment out the DO block and use the explicit uuid version at the bottom.

do $$
declare
  uid uuid;
  target_email text := 'YOUR_EMAIL@example.com'; -- <-- change this
begin
  select id into uid from auth.users where email = target_email limit 1;

  if uid is null then
    raise exception 'No auth.users row for email: %', target_email;
  end if;

  insert into public.staples (user_id, name, typical_interval_days)
  select uid, v.name, v.days
  from (
    values
      ('Qumësht', 5),
      ('Vezë', 7),
      ('Bukë', 4),
      ('Banane', 5),
      ('Avokado', 6),
      ('Pite', 14),
      ('Dajth me feta', 7),
      ('Sallam me feta', 10),
      ('Ujë', 7),
      ('Kos', 5)
  ) as v(name, days)
  where not exists (
    select 1
    from public.staples s
    where s.user_id = uid
      and lower(trim(s.name)) = lower(trim(v.name))
  );
end $$;

-- Option 2: explicit user id (replace uuid)
/*
insert into public.staples (user_id, name, typical_interval_days)
select '00000000-0000-0000-0000-000000000000'::uuid, v.name, v.days
from (
  values
    ('Qumësht', 5),
    ('Vezë', 7),
    ('Bukë', 4),
    ('Banane', 5),
    ('Avokado', 6),
    ('Pite', 14),
    ('Dajth me feta', 7),
    ('Sallam me feta', 10),
    ('Ujë', 7),
    ('Kos', 5)
) as v(name, days)
where not exists (
  select 1
  from public.staples s
  where s.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    and lower(trim(s.name)) = lower(trim(v.name))
);
*/
