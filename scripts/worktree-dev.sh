#!/usr/bin/env bash
# Bootstrap local dev for a git worktree (env, deps, free port). See .cursor/rules/worktree-dev-server.mdc
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PRIME_ENV="/Users/judikarriqi/Documents/__dev/karriqi/.env.local"
PORT_FILE="$ROOT/.worktree-dev-port"

copy_env() {
  if [[ -f .env.local ]]; then
    return 0
  fi
  local src=""
  while IFS= read -r line; do
    local wt="${line%% *}"
    if [[ -f "$wt/.env.local" ]]; then
      src="$wt/.env.local"
      break
    fi
  done < <(git worktree list 2>/dev/null || true)
  if [[ -z "$src" && -f "$PRIME_ENV" ]]; then
    src="$PRIME_ENV"
  fi
  if [[ -n "$src" ]]; then
    cp "$src" .env.local
    echo "Copied .env.local from $src"
  else
    echo "No .env.local found. Copy from .env.example before using auth routes." >&2
  fi
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

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies…"
  pnpm install
fi

echo ""
echo "Bootstrapping local Supabase…"
bash scripts/worktree-supabase.sh

PORT="$(pick_port)"
echo "$PORT" >"$PORT_FILE"

echo ""
echo "Worktree dev — port $PORT"
echo "  Local:   http://localhost:$PORT"
echo ""
echo "Starting Next.js (Ctrl+C to stop)…"
echo ""

exec env ENABLE_PWA_IN_DEV=0 pnpm exec next dev --turbopack --port "$PORT"
