# Roadmap and scope

See **[project-context.md](./project-context.md)** for the current product goal and module list. Update both files when scope shifts.

## Shipped (current)

- **App shell** — mobile bottom nav, desktop sidebar, header, user menu, dark-first theme, PWA baseline
- **Auth** — Supabase email sessions, PIN quick sign-in, no public sign-up, middleware-protected routes
- **Household** — member linking; RLS-scoped shared shopping, tasks, calendar, notifications
- **Shopping** — staples catalog (incl. default Albanian seed), shared list, purchases, admin catalog
- **Kanban** — boards, categories, assignees, priority, tags, attachments
- **Calendar** — shared household events
- **Dashboard** — weekend planner card from operator/agent ingest
- **Notifications + Web Push** — notification rows, household peer delivery, settings subscription UI
- **Ingest API** — OpenAPI at `/openapi.json`; shopping, kanban, calendar ingest routes
- **Dev tools** — maintainer push tests, living architecture map at `/dev/architecture`
- **Deploy** — Cloudflare Workers (OpenNext), tag-triggered releases

## Explicitly deferred

- Public sign-up or multi-tenant SaaS for arbitrary families
- In-app chat, meal planning, and other modules not in [`config/navigation.ts`](../config/navigation.ts)
- OAuth as primary sign-in (callback route exists; email + PIN are the main path today)

## Adding a new module

1. Design Supabase tables + **RLS** (migration under `supabase/migrations/`).
2. `supabase gen types` → update [`types/database.ts`](../types/database.ts) as needed.
3. Add **`lib/repositories/<feature>.ts`** for data access.
4. Add UI under **`components/<feature>/`** or **`modules/<feature>/`**.
5. Mount from **`app/(main)/<route>/page.tsx`** — keep `AppShell` and [`config/navigation.ts`](../config/navigation.ts) as nav source of truth.
6. If agents should write data: follow ingest checklist in `.cursor/rules/ingest-openapi-contract.mdc`.
7. Update **`doc/project-context.md`**, **`README.md`**, and **`architecture-flow-data.ts`** per `.cursor/rules/project-context-coherence.mdc`.

## Maintenance notes

- Next.js may deprecate **`middleware.ts`** in favor of a **proxy** convention; watch upgrade guides when bumping Next.
- If you change dev host/port, update **Supabase redirect URLs** and [development.md](./development.md).
