# Local development

## Prerequisites

- Node.js (LTS recommended)
- pnpm (`corepack enable` or install globally)

## First-time setup

```bash
pnpm install
cp .env.example .env.local
```

Edit **`.env.local`** with your Supabase project URL and anon key (see [authentication-and-security.md](./authentication-and-security.md)).

## Dev server

```bash
pnpm dev
```

- Uses **`next dev --turbopack --port 3010`** with the PWA service worker forced off for faster UI feedback (see [`package.json`](../package.json)).
- Use **`pnpm dev:pwa`** only when testing the generated service worker, web push, or install/offline behavior locally.
- Open **http://localhost:3010**

### Optional hostname: `karriqi.test`

1. Add to **`/etc/hosts`**: `127.0.0.1 karriqi.test`
2. Open **http://karriqi.test:3010**
3. [`next.config.ts`](../next.config.ts) sets **`allowedDevOrigins: ["karriqi.test"]`** so Next allows that host for dev assets / HMR.

Register the same origins in **Supabase → Authentication → URL configuration** if you use redirects or OAuth.

## Other scripts

| Command             | Purpose                                                        |
| ------------------- | -------------------------------------------------------------- |
| `pnpm dev:pwa`      | Dev server with Webpack and PWA service worker enabled         |
| `pnpm build`        | Production build (`next build --webpack`)                      |
| `pnpm start`        | Run production server (default port 3000 unless `PORT` is set) |
| `pnpm lint`         | ESLint                                                         |
| `pnpm typecheck`    | `tsc --noEmit`                                                 |
| `pnpm format`       | Prettier write                                                 |
| `pnpm format:check` | Prettier check                                                 |

## Tooling notes

- **ESLint:** [`eslint.config.mjs`](../eslint.config.mjs) — `public/sw.js` and `public/workbox-*.js` are ignored (generated PWA bundles).
- **Prettier:** [`.prettierrc`](../.prettierrc), [`.prettierignore`](../.prettierignore)
- **Imports:** `@/*` → repo root ([`tsconfig.json`](../tsconfig.json))

## TypeScript types for Supabase

When you add real tables:

```bash
# Example; adjust for your Supabase workflow
pnpm exec supabase gen types typescript --project-id <id> > types/database.generated.ts
```

Then wire `Database` in [`types/database.ts`](../types/database.ts) (or re-export from the generated file).
