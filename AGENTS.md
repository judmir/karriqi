# READ THIS FIRST

## Product context

**Karriqi** is a mobile-first family hub PWA (shopping, kanban, calendar, notifications, agent ingest). Before substantive changes, read **`doc/project-context.md`**. When behavior or scope changes, keep that file, **`README.md`**, and related docs in sync — see **`.cursor/rules/project-context-coherence.mdc`**.

## ⛔ Worktree dev server — BLOCKING, FIRST TOOL CALL

If the workspace path contains `/.cursor/worktrees/`, your **very first tool call** must be `pnpm worktree:dev` (background). Wait for `Ready` / `Local: http://localhost:<PORT>`, then open your first reply with `Worktree preview: http://localhost:<PORT>`. Do this BEFORE any Read / Grep / Glob / Edit / Write. See `.cursor/rules/worktree-dev-server.mdc`.

<!-- BEGIN:nextjs-agent-rules -->
## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Git (agents)

**Mandatory:** follow `.cursor/rules/agent-git-branch-workflow.mdc` — work on `agent/YYYY-MM-DD-…` branches, commit and push logical chunks to `origin`, **never** merge to `main` unless the user explicitly asks.

## Hermes / third-party ingest

- Contract: **`GET /openapi.json`** (generated from Zod; source of truth).
- Human docs: **`/developers`**.
- Writes: **`POST /api/ingest/*`** with `Authorization: Bearer $INGEST_TOKEN`.
- **Hermes how-to:** `modules/ingest/HERMES.md` — agents must read `openapi.json` before pushing; copy into Hermes project.
- When changing ingest: `.cursor/rules/ingest-openapi-contract.mdc`.
- When prompting Hermes: `.cursor/rules/hermes-karriqi-ingest-consumer.mdc`.
