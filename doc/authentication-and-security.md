# Authentication and security

## Model

- **Supabase Auth** is the only identity layer in phase 1.
- **Household-only access:** there is **no public sign-up** in the app. Users are created in the **Supabase dashboard** (Authentication → Users). The route **`/auth/sign-up`** exists only to **redirect** to **`/auth/sign-in`** (bookmarks and old links).
- **Recommended:** disable “allow new sign-ups” for the Email provider in Supabase so only invited/created users exist.

## Session handling

| Piece               | File                                                          | Role                                                                                                  |
| ------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Middleware refresh  | [`lib/supabase/middleware.ts`](../lib/supabase/middleware.ts) | `createServerClient` + cookie read/write on the **request** / **NextResponse**                        |
| Root middleware     | [`middleware.ts`](../middleware.ts)                           | Calls `updateSession`, enforces `isProtectedPath`, redirects anonymous users to sign-in with `?next=` |
| Server RSC / routes | [`lib/supabase/server.ts`](../lib/supabase/server.ts)         | `createClient()` with Next **`cookies()`**; **`getSessionUser()`** for layouts                        |
| Browser             | [`lib/supabase/client.ts`](../lib/supabase/client.ts)         | `createBrowserClient` for sign-in, sign-out, future client-side auth                                  |

If **`NEXT_PUBLIC_SUPABASE_*`** is missing, [`lib/env.ts`](../lib/env.ts) reports not configured: middleware treats the user as logged out; auth pages show **`SupabaseRequired`**.

## Protected routes

- List: [`config/routes.ts`](../config/routes.ts) — `PROTECTED_ROUTE_PREFIXES`.
- **Public:** `/`, `/auth/*` (except behavior above), static assets, Next internals (see `middleware` `matcher`).

## Environment variables and secrets

| Variable                        | Where        | Notes                                                                                                                                                 |
| ------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `.env.local` | Safe to expose to the browser (it’s public config).                                                                                                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | **Publishable** anon key; safe in the browser **only if** tables use **RLS** and policies are correct. Never use **service_role** in `NEXT_PUBLIC_*`. |
| `.env.example`                  | Git          | **Placeholder only** — never real project keys.                                                                                                       |
| `.env.local`                    | Gitignored   | Real values for local dev.                                                                                                                            |

If a key was ever committed, **rotate** it in the Supabase dashboard and update `.env.local` everywhere.

## Sign-out

- [`components/layout/user-menu.tsx`](../components/layout/user-menu.tsx) calls `supabase.auth.signOut()`, then `router.refresh()` and navigates to `/auth/sign-in`.

## OAuth / magic link (future)

- [`app/auth/callback/route.ts`](../app/auth/callback/route.ts) implements **`exchangeCodeForSession`** for the `code` query param. Add redirect URLs in Supabase for each origin you use (e.g. `http://localhost:3010`, `http://karriqi.test:3010`, production URL).

## Profiles / multi-tenant data

- Phase 1 **defers** a `profiles` (or household) table. **`user.id`** and **`user.email`** from the JWT are enough until a module needs shared RLS or display names in the database.
