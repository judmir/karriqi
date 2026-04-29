# Cloudflare Deployment

This app deploys to Cloudflare Workers with OpenNext.

## First Deploy

```bash
pnpm run build:cloudflare
pnpm run preview:cloudflare
pnpm run deploy:cloudflare
```

Until Cloudflare finishes activating `karriqi.de`, deploys go to the generated
`*.workers.dev` URL because `workers_dev` is enabled and custom domain routes are
commented in `wrangler.jsonc`.

## Required Variables

Set public values in the Cloudflare dashboard or as Wrangler vars:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_SUBJECT
```

Set server-only values as secrets:

```bash
pnpm exec wrangler secret put SUPABASE_SERVICE_ROLE_KEY
pnpm exec wrangler secret put VAPID_PRIVATE_KEY
pnpm exec wrangler secret put CRON_SECRET
```

## Custom Domain

After Cloudflare marks `karriqi.de` active:

1. Uncomment the `routes` block in `wrangler.jsonc`.
2. Run `pnpm run deploy:cloudflare`.
3. In Supabase Auth, set the site URL to `https://karriqi.de`.
4. Add redirect URLs:
   - `https://karriqi.de/auth/callback`
   - `https://www.karriqi.de/auth/callback` if `www` remains enabled.

## GitHub Deploys

`.github/workflows/deploy-cloudflare.yml` deploys the Worker whenever a semantic
version release tag is pushed. It runs `pnpm install --frozen-lockfile`,
`pnpm run typecheck`, then `pnpm run deploy:cloudflare`.

Release tags use the `vMAJOR.MINOR.PATCH` format, for example `v1.2.3`.

## Release Flow

1. Work on an `agent/YYYY-MM-DD-<short-slug>` branch from `main`.
2. Commit and push the branch.
3. When the work is approved, merge the branch into `main`.
4. Choose the next semantic version tag from the current `main` commit:
   - `patch` for fixes and small safe changes.
   - `minor` for new user-visible functionality.
   - `major` for breaking changes.
5. Push `main`, then push the tag. The tag push triggers the Cloudflare deploy.

Example:

```bash
git switch main
git pull --ff-only origin main
git merge --no-ff agent/YYYY-MM-DD-example
git push origin main
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0
```

Add these GitHub repository secrets before relying on automatic deploys:

```txt
CLOUDFLARE_API_TOKEN
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_VAPID_PUBLIC_KEY
```

Add this GitHub repository variable:

```txt
CLOUDFLARE_ACCOUNT_ID
```

The Cloudflare API token should be scoped to this account and include permission
to deploy Workers. If you later enable custom domains through `wrangler.jsonc`,
the token also needs zone read, Workers routes edit, and SSL/certificate edit
permissions for `karriqi.de`.

With GitHub CLI authenticated, you can set the three public build-time values
from `.env.local`:

```bash
set -a
source .env.local
set +a

gh secret set NEXT_PUBLIC_SUPABASE_URL --body "$NEXT_PUBLIC_SUPABASE_URL"
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --body "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
gh secret set NEXT_PUBLIC_VAPID_PUBLIC_KEY --body "$NEXT_PUBLIC_VAPID_PUBLIC_KEY"
```

Set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` from Cloudflare, not from
`.env.local`.
