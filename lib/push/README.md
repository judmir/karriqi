# Web push (PWA)

Server sends Web Push using [web-push](https://github.com/web-push-libs/web-push) and VAPID. The service worker (see [`worker/index.ts`](../../worker/index.ts)) shows notifications and opens URLs on click.

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Client + server | Passed to `PushManager.subscribe` |
| `VAPID_PRIVATE_KEY` | Server only | Signs outbound pushes |
| `VAPID_SUBJECT` | Server only | Contact URI for VAPID (e.g. `mailto:you@example.com`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Insert notifications + read `push_subscriptions` when sending |
| `CRON_SECRET` | Server only | Bearer token for [`/api/cron/stale-tasks`](../../app/api/cron/stale-tasks/route.ts) |

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

Feature code should not call `web-push` directly; use [`lib/notifications/dispatch.ts`](../notifications/dispatch.ts) so in-app rows and pushes stay in sync.

Each push payload includes a **unique `id`** (UUID). The service worker uses it as the `Notification` **`tag`**, so the OS does not replace a new alert with the previous one when title/body look the same.
