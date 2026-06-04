-- Daily 21:00 (Europe/London) push when tomorrow's Rule of 3 is not fully planned.
-- pg_cron + pg_net call the secured app endpoint; dedupe one send per user per evening.

create table public.rule_of_3_evening_reminder_sends (
  user_id uuid not null references auth.users (id) on delete cascade,
  sent_on date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, sent_on)
);

comment on table public.rule_of_3_evening_reminder_sends is
  'Tracks evening Rule of 3 reminder pushes (one row per user per calendar evening).';

alter table public.rule_of_3_evening_reminder_sends enable row level security;

-- No client access — service role only from cron handler.

create or replace function public.invoke_rule_of_3_tomorrow_reminder()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  if to_regclass('vault.decrypted_secrets') is null then
    return;
  end if;

  select decrypted_secret
    into v_secret
  from vault.decrypted_secrets
  where name = 'cron_secret'
  limit 1;

  if v_secret is null or length(v_secret) = 0 then
    return;
  end if;

  perform net.http_post(
    url := 'https://karriqi.com/api/cron/rule-of-3-tomorrow',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    timeout_milliseconds := 10000
  );
end;
$$;

revoke all on function public.invoke_rule_of_3_tomorrow_reminder() from public;
revoke all on function public.invoke_rule_of_3_tomorrow_reminder() from anon;
revoke all on function public.invoke_rule_of_3_tomorrow_reminder() from authenticated;

do $$
begin
  if exists (
    select 1 from cron.job where jobname = 'rule-of-3-tomorrow-21-london'
  ) then
    perform cron.unschedule('rule-of-3-tomorrow-21-london');
  end if;
end
$$;

select cron.schedule(
  'rule-of-3-tomorrow-21-london',
  '0 21 * * *',
  $cron$select public.invoke_rule_of_3_tomorrow_reminder();$cron$,
  'Europe/London'
);
