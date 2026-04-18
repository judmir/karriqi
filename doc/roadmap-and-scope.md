# Roadmap and scope

## Phase 1 (current) — implemented

- Next.js App Router app with TypeScript, Tailwind 4, shadcn/ui, ESLint, Prettier.
- **App shell:** mobile bottom navigation, desktop sidebar, header, user menu, safe-area-friendly layout.
- **Routes:** placeholder content for `/`, `/dashboard`, `/shopping`, `/todo`, `/calendar`, `/settings`; auth routes + callback handler.
- **Supabase Auth:** SSR clients, middleware session refresh, protected routes, sign-in only (no self-service sign-up).
- **PWA:** manifest, icons, production service worker via `@ducanh2912/next-pwa`.
- **Notifications:** types + no-op service + hook stub + README pointers.
- **Docs:** root README + this **`doc/`** folder.

## Explicitly out of scope (phase 1)

- Shopping lists, todos, calendar events, meals, chat, real notification delivery.
- Household/family member management product features.
- Full database schema beyond auth needs; **`profiles` table** deferred until a module requires it.
- Advanced roles beyond what Supabase Auth provides per user.

## Suggested phase 2 — Shopping module

1. Design Supabase tables (lists, items, optional household id) with **RLS**.
2. `supabase gen types` → wire [`types/database.ts`](../types/database.ts).
3. Add [`lib/repositories/shopping-repository.ts`](../lib/repositories/README.md) (or similar).
4. Add [`modules/shopping/`](../modules/README.md) with UI entry and domain types.
5. Update [`app/(main)/shopping/page.tsx`](<../app/(main)/shopping/page.tsx>) to render the module root; **do not** fork the global shell — keep [`config/navigation.ts`](../config/navigation.ts) as the nav source of truth.

## Maintenance notes

- Next.js may deprecate **`middleware.ts`** in favor of a **proxy** convention; watch upgrade guides when bumping Next.
- If you change dev host/port, update **Supabase redirect URLs** and this doc as needed.
