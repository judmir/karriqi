#!/usr/bin/env bash
# Bootstrap local dev for a git worktree (env, deps, free port). See .cursor/rules/worktree-dev-server.mdc
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT_FILE="$ROOT/.worktree-dev-port"

copy_env() {
  bash "$ROOT/scripts/worktree-env-bootstrap.sh"
}

pick_port() {
  local p
  for p in $(seq 3010 3019); do
    if ! lsof -i ":$p" -sTCP:LISTEN -t >/dev/null 2>&1; then
      echo "$p"
      return 0
    fi
  done
  echo "No free port in 3010–3019" >&2
  exit 1
}

copy_env

if command -v supabase >/dev/null 2>&1; then
  bash scripts/worktree-supabase-link.sh
fi

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies…"
  pnpm install
fi

if bash scripts/worktree-supabase-local.sh needs; then
  echo ""
  echo "Schema changes detected vs origin/main — starting local Supabase…"
  echo "(Set USE_LOCAL_SUPABASE=0 to skip, or USE_LOCAL_SUPABASE=1 to force.)"
  echo ""
  bash scripts/worktree-supabase-local.sh start
fi

PORT="$(pick_port)"
echo "$PORT" >"$PORT_FILE"

echo ""
echo "Worktree dev — port $PORT"
echo "  Local:   http://localhost:$PORT"
echo ""
echo "Starting Next.js (Ctrl+C to stop)…"
echo ""

exec env ENABLE_PWA_IN_DEV=0 pnpm exec next dev --turbopack --port "$PORT"
