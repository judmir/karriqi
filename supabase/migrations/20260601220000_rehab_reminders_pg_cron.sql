-- Schedule the rehab timed-reminder cron entirely inside Supabase using
-- pg_cron + pg_net, so no external scheduler (e.g. cron-job.org) is required.
--
-- Every minute, pg_cron calls public.invoke_rehab_reminders(), which makes an
-- async HTTP POST (pg_net) to the app's secured cron endpoint
-- (/api/cron/rehab-reminders). That endpoint decides which timed rehab events
-- are starting within the next 5 minutes and sends Web Push to the owner.
--
-- The bearer secret is read from Supabase Vault (secret name: 'cron_secret') at
-- run time, so it is never committed to git. Until that secret exists (e.g. in
-- local dev) the function is a safe no-op. The same value must be set as
-- CRON_SECRET in the app's Cloudflare Worker environment.

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.invoke_rehab_reminders()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  -- Vault may be absent in some environments; bail out safely.
  if to_regclass('vault.decrypted_secrets') is null then
    return;
  end if;

  select decrypted_secret
    into v_secret
  from vault.decrypted_secrets
  where name = 'cron_secret'
  limit 1;

  -- Not configured (e.g. local dev) -> do nothing rather than calling unsecured.
  if v_secret is null or length(v_secret) = 0 then
    return;
  end if;

  perform net.http_post(
    url := 'https://karriqi.com/api/cron/rehab-reminders',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    timeout_milliseconds := 10000
  );
end;
$$;

-- This function lives in the public schema, which PostgREST exposes as RPC.
-- It must never be callable by API roles -- only postgres / the cron runner.
revoke all on function public.invoke_rehab_reminders() from public;
revoke all on function public.invoke_rehab_reminders() from anon;
revoke all on function public.invoke_rehab_reminders() from authenticated;

-- (Re)schedule the every-minute job idempotently so re-runs do not duplicate it.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'rehab-reminders-every-minute') then
    perform cron.unschedule('rehab-reminders-every-minute');
  end if;
end
$$;

select cron.schedule(
  'rehab-reminders-every-minute',
  '* * * * *',
  $cron$select public.invoke_rehab_reminders();$cron$
);
