# Progressive Web App (PWA)

## Goals (phase 1)

- **Installable** web app (manifest + icons).
- **Service worker** in **production builds** for caching baseline (Workbox via `@ducanh2912/next-pwa`).
- **No** full push notification implementation yet — see [notifications.md](./notifications.md) and [`lib/push/README.md`](../lib/push/README.md).

## Configuration

- **Wrapper:** [`next.config.ts`](../next.config.ts) — `withPWAInit({ dest: "public", disable: process.env.NODE_ENV === "development", ... })`.
- **Development:** PWA plugin is **disabled** (`disable: true` when `NODE_ENV === "development"`), so `pnpm dev` does not rely on a generated service worker.
- **Production:** `pnpm build` emits **`public/sw.js`** and **`public/workbox-*.js`** (hashed filename). These are **gitignored** — regenerate by building; do not hand-edit.

## Static assets

| File                                                            | Purpose                                              |
| --------------------------------------------------------------- | ---------------------------------------------------- |
| [`public/manifest.webmanifest`](../public/manifest.webmanifest) | `name`, `display`, `start_url`, `theme_color`, icons |
| [`public/icons/icon-192.png`](../public/icons/), `icon-512.png` | Placeholders — replace with branded assets           |

## Metadata

- Root [`app/layout.tsx`](../app/layout.tsx) sets **`metadata`** (title template, `manifest`, `appleWebApp`, icons) and **`viewport`** (`viewportFit: cover` for iOS safe areas).

## Build vs dev

| Mode           | Bundler               | PWA SW                       |
| -------------- | --------------------- | ---------------------------- |
| `pnpm dev`     | Turbopack             | Off                          |
| `pnpm dev:pwa` | Webpack (`--webpack`) | On                           |
| `pnpm build`   | Webpack               | On (written under `public/`) |

## Future: web push

Plan to extend the generated worker or add a custom worker fragment for `push` / `notificationclick` events; coordinate with VAPID keys and a Supabase Edge Function. Details sketched in [`lib/push/README.md`](../lib/push/README.md).
