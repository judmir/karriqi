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

### Primary checkout (main)

```bash
pnpm setup:local-host   # once — Herd nginx proxy → 3010; restart Herd after
pnpm dev
```

- Opens at **http://karriqi.test** (Herd proxies port 80 → Next.js on 3010).
- **Use `http://`**, not `https://`. Avoid **`.dev`** for local URLs — Chrome and other browsers **require HTTPS** on `.dev` (HSTS preload), which causes certificate errors without a trusted local cert.
- The Herd **proxy** overrides the default parked-site PHP handler for this folder (Next.js, not PHP).
- Uses **`next dev --turbopack --hostname 0.0.0.0 --port 3010`** with the PWA service worker forced off for faster UI feedback (see [`package.json`](../package.json)).
- Use **`pnpm dev:pwa`** only when testing the generated service worker, web push, or install/offline behavior locally.
- [`next.config.ts`](../next.config.ts) sets **`allowedDevOrigins: ["karriqi.test"]`** so Next allows that host for dev assets / HMR.

Register **http://karriqi.test** in **Supabase → Authentication → URL configuration** if you use redirects or OAuth.

### Git worktrees

```bash
pnpm worktree:dev
```

- Each worktree gets the first free port in **3010–3019** and prints **`http://localhost:<port>`**.
- The primary checkout keeps **http://karriqi.test**; do not run **`pnpm dev`** inside a worktree (the script will tell you to use **`pnpm worktree:dev`**).

## Other scripts

| Command                  | Purpose                                                        |
| ------------------------ | -------------------------------------------------------------- |
| `pnpm setup:local-host`  | One-time: Herd nginx proxy → 3010 for karriqi.test |
| `pnpm dev:pwa`           | Dev server with Webpack and PWA service worker enabled         |
| `pnpm worktree:dev`      | Dev server for git worktrees (`localhost:<port>`)              |
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
