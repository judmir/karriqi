# Karriqi — project context

**Audience:** humans and coding agents. This is the product “north star.” When behavior or scope changes, update this file in the same change.

## What Karriqi is

Karriqi is a **mobile-first PWA** — a private **family hub** for one household. It replaces scattered notes, chat threads, and ad-hoc lists with one authenticated app everyone can open on a phone (installable to the home screen) and use comfortably on desktop.

Production: [karriqi.com](https://karriqi.com). Local dev: [http://karriqi.test](http://karriqi.test) (primary checkout) or a worktree `http://localhost:<port>`.

## Goal

Help a family **coordinate daily life** in one place:

- Know what to buy and what is already on the shared shopping list
- Track household tasks with clear ownership and priority
- See what is coming up on a shared calendar
- Get nudges when something changes (in-app notifications and Web Push)
- Surface curated weekend ideas on the dashboard (via external agents)

The app should feel **fast and obvious on mobile** — usable at the store, in the kitchen, or on the couch — without sacrificing a coherent desktop experience.

## Who it is for

- **The Karriqi household** — a closed user base, not a public multi-tenant SaaS
- Accounts are **created in Supabase** (no self-service sign-up in the app)
- Members can be linked as a **household** so shopping, tasks, calendar, and notifications are shared under RLS

## Core modules (current)

| Module | Route | Purpose |
| --- | --- | --- |
| **Dashboard** | `/dashboard` | Entry point; shows agent-curated **weekend planner** options when available |
| **Shopping** | `/shopping` | Shared staples catalog, list building, completion, purchase history; household-scoped |
| **Kanban** | `/kanban` | Family tasks — categories, assignees, priority, tags, attachments, detail views |
| **Calendar** | `/calendar` | Shared household events |
| **Settings** | `/settings` | Profile, household linking, **PIN quick sign-in**, Web Push subscription |
| **Ingest API** | `/developers`, `/api/ingest/*` | External agents (e.g. Hermes) push shopping, kanban, and calendar data via **OpenAPI** |
| **Notifications** | (cross-cutting) | Notification rows in Supabase + delivery via Web Push to household peers |
| **Dev tools** | `/dev` | Maintainer-only push tests and living architecture map |

## How external agents fit in

Agents do **not** scrape the UI. They read **`GET /openapi.json`** and write with **`POST /api/ingest/*`** using `Authorization: Bearer $INGEST_TOKEN`. Human-readable API docs: **`/developers`**. See [`modules/ingest/HERMES.md`](../modules/ingest/HERMES.md).

Example flow: Hermes researches weekend activities → ingest creates an **operator entry** → dashboard **Weekend options** card shows ranked picks for the family.

## Design principles

1. **Mobile-first** — bottom navigation on small screens; sidebar on desktop; one nav config ([`config/navigation.ts`](../config/navigation.ts)).
2. **Household-scoped data** — Postgres + Supabase RLS; shared lists and tasks, not per-device silos.
3. **Closed trust model** — no public registration; family-only access.
4. **Contract-driven integrations** — ingest shapes live in Zod + OpenAPI, not ad-hoc docs.
5. **One shell, many modules** — feature UI mounts inside `AppShell`; repositories in `lib/repositories/`, vertical slices in `modules/`.

## Stack (summary)

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · shadcn/ui · Supabase Auth + Postgres · PWA · Web Push · Cloudflare Workers (OpenNext). Details: [`doc/architecture.md`](./architecture.md).

## Explicitly out of scope (for now)

- Public sign-up or onboarding for arbitrary families
- Multi-tenant “family app” SaaS
- In-app chat, meal planning, or other modules not yet in the nav
- Features that bypass household RLS or the ingest OpenAPI contract

## Keep these files coherent

When you add, remove, or materially change a user-facing feature or integration, update **in the same PR/change**:

| File | Update when… |
| --- | --- |
| **`doc/project-context.md`** (this file) | Product goal, modules, principles, or scope shift |
| **[`README.md`](../README.md)** | High-level summary or “what’s built” list changes |
| **[`doc/roadmap-and-scope.md`](./roadmap-and-scope.md)** | Phase boundaries or deferred work changes |
| **[`components/dev/architecture/architecture-flow-data.ts`](../components/dev/architecture/architecture-flow-data.ts)** | New meaningful feature, service, or workflow in the architecture map |
| **[`app/layout.tsx`](../app/layout.tsx)** metadata + **[`public/manifest.webmanifest`](../public/manifest.webmanifest)** | User-facing product description changes |
| **[`doc/README.md`](./README.md)** | New doc added under `doc/` |

Agents: see [`.cursor/rules/project-context-coherence.mdc`](../.cursor/rules/project-context-coherence.mdc).
