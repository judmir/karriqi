# READ THIS FIRST

## ⛔ Worktree dev server — BLOCKING, FIRST TOOL CALL

If the workspace path contains `/.cursor/worktrees/`, your **very first tool call** must be `pnpm worktree:dev` (background). Wait for `Ready` / `Local: http://localhost:<PORT>`, then open your first reply with `Worktree preview: http://localhost:<PORT>`. That command also bootstraps **local Supabase in Docker** (migrations + `.env.local` keys). Do this BEFORE any Read / Grep / Glob / Edit / Write. See `.cursor/rules/worktree-dev-server.mdc` and `.cursor/rules/supabase-db-push-migrations.mdc`.

<!-- BEGIN:nextjs-agent-rules -->
## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Git (agents)

**Mandatory:** follow `.cursor/rules/agent-git-branch-workflow.mdc` — work on `agent/YYYY-MM-DD-…` branches, commit and push logical chunks to `origin`, **never** merge to `main` unless the user explicitly asks.
