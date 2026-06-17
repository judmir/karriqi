# READ THIS FIRST

## Worktree dev server (automated via hooks)

In `/.cursor/worktrees/` checkouts, **`.cursor/hooks.json` auto-starts** the dev server on `sessionStart` and gates other tools until it is listening. Your first reply must still include **`Worktree preview: http://localhost:<PORT>`** (from injected context or `.worktree-dev-port`). Manual fallback: `pnpm worktree:dev` — see `.cursor/rules/worktree-dev-server.mdc`.

<!-- BEGIN:nextjs-agent-rules -->
## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Rehab plan (source of truth)

Before rehab scheduling, content, or feature work: read `docs/rehab/final_12_week_neuro_rehab_plan.txt` and follow `.cursor/rules/rehab-plan-source-of-truth.mdc`. Validate user requests against the plan; push back or ask when misaligned. Skip the plan for unrelated bug fixes.

## Git (agents)

**Mandatory:** follow `.cursor/rules/agent-git-branch-workflow.mdc` — in worktrees, **fetch `origin/main` before branching**; work on `agent/YYYY-MM-DD-…` branches from latest `origin/main`, commit and push logical chunks to `origin`, **never** merge to `main` unless the user explicitly asks.

## Hermes / third-party ingest

- Contract: **`GET /openapi.json`** (generated from Zod; source of truth).
- Human docs: **`/developers`**.
- Writes: **`POST /api/ingest/*`** with `Authorization: Bearer $INGEST_TOKEN`.
- **Hermes how-to:** `modules/ingest/HERMES.md` — agents must read `openapi.json` before pushing; copy into Hermes project.
- When changing ingest: `.cursor/rules/ingest-openapi-contract.mdc`.
- When prompting Hermes: `.cursor/rules/hermes-karriqi-ingest-consumer.mdc`.
