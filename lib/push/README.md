# Web push (PWA)

Server sends Web Push using [web-push](https://github.com/web-push-libs/web-push) and VAPID. The service worker (see [`worker/index.ts`](../../worker/index.ts)) shows notifications and opens URLs on click.

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Client + server | Passed to `PushManager.subscribe` |
| `VAPID_PRIVATE_KEY` | Server only | Signs outbound pushes |
| `VAPID_SUBJECT` | Server only | Contact URI for VAPID (e.g. `mailto:you@example.com`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Insert notifications + read `push_subscriptions` when sending |
| `CRON_SECRET` | Server only | Bearer token for [`/api/cron/stale-tasks`](../../app/api/cron/stale-tasks/route.ts) and [`/api/cron/rehab-reminders`](../../app/api/cron/rehab-reminders/route.ts) |

### Web Push in `next dev`

By default the PWA worker is **off** in development. To test push locally, set **`ENABLE_PWA_IN_DEV=true`** in `.env.local` and restart `pnpm dev` (or use `pnpm build && pnpm start` without that flag).

Generate keys:

```bash
pnpm exec web-push generate-vapid-keys
```

Copy the public key into `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and the private key into `VAPID_PRIVATE_KEY`.

## HTTP routes

- **`POST /api/push/subscribe`** — Authenticated; upserts a row in `public.push_subscriptions`.
- **`POST /api/push/test`** — Authenticated; sends one Web Push to the current user (used to confirm VAPID + subscription after enabling).
- **`GET` / `POST /api/cron/stale-tasks`** — `Authorization: Bearer $CRON_SECRET`; runs stale-task reminders (assigned tasks inactive ≥ 2 days).
- **`GET` / `POST /api/cron/rehab-reminders`** — `Authorization: Bearer $CRON_SECRET`; sends a push **5 minutes before** each timed rehab plan event occurrence. Designed to be hit **every minute**. Standalone + override rows dedupe via `rehab_plan_events.reminder_sent_at`; **recurring masters** are expanded per occurrence and dedupe via the `rehab_event_reminders` table (so every repeat is reminded, exactly once).

Feature code should not call `web-push` directly; use [`lib/notifications/dispatch.ts`](../notifications/dispatch.ts) so in-app rows and pushes stay in sync.

## Scheduling the rehab reminder cron (Supabase pg_cron — no external infra)

`/api/cron/rehab-reminders` only sends when something is due, so it must be polled every minute. This is done **inside Supabase** via `pg_cron` + `pg_net` — no cron-job.org / GitHub Actions / extra Worker.

Migration [`20260601220000_rehab_reminders_pg_cron.sql`](../../supabase/migrations/20260601220000_rehab_reminders_pg_cron.sql):

- Enables `pg_cron` and `pg_net`.
- Creates `public.invoke_rehab_reminders()` — reads the bearer token from **Supabase Vault** (secret name `cron_secret`) and `pg_net`-POSTs to `https://karriqi.com/api/cron/rehab-reminders`. If the Vault secret is absent (e.g. local dev) it is a **safe no-op**.
- Schedules `rehab-reminders-every-minute` (`* * * * *`).
- The function is **revoked from `anon`/`authenticated`** so it is not exposed as a PostgREST RPC.

### One-time setup on the cloud project (after release)

The same secret must exist in two places:

1. **Cloudflare** Worker env → `CRON_SECRET` (the endpoint validates `Authorization: Bearer $CRON_SECRET`).
2. **Supabase Vault** → secret named `cron_secret` with the **same value**. In Studio → SQL editor on the cloud project:

```sql
select vault.create_secret('PASTE_SAME_VALUE_AS_CLOUDFLARE', 'cron_secret', 'Bearer token for /api/cron/rehab-reminders');
```

To rotate later: `select vault.update_secret((select id from vault.secrets where name='cron_secret'), 'NEW_VALUE');` and update Cloudflare to match.

Inspect / manage the job on the cloud DB:

```sql
select jobname, schedule, active from cron.job where jobname = 'rehab-reminders-every-minute';
select * from cron.job_run_details order by start_time desc limit 5;  -- run history
```

> Manual test without waiting: `select public.invoke_rehab_reminders();` on the cloud DB (fires one POST), or `curl` the endpoint with the bearer token.

> Alternative (not used): an external HTTP cron (cron-job.org) or a dedicated Cloudflare Cron Trigger Worker hitting the same endpoint. Both work but add infra; pg_cron keeps it self-contained in the database.

Each push payload includes a **unique `id`** (UUID). The service worker uses it as the `Notification` **`tag`**, so the OS does not replace a new alert with the previous one when title/body look the same.
