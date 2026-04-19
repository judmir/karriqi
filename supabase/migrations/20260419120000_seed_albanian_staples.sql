-- Seeds default Albanian staples for every existing auth user (idempotent per user+name).
-- Applied with: supabase db push
-- New users who sign up after this migration still get the same catalog from the app
-- (fetchStaplesWithDefaults) when their staples table is empty.

insert into public.staples (user_id, name, typical_interval_days)
select u.id, v.name, v.days
from auth.users u
cross join (
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
  where s.user_id = u.id
    and lower(trim(s.name)) = lower(trim(v.name))
);
