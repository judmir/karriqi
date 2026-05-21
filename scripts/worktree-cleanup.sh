#!/usr/bin/env bash
# Stop worktree dev server + local Supabase (release / abandon). See worktree-dev-server.mdc
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT_FILE="$ROOT/.worktree-dev-port"

if [[ -f "$PORT_FILE" ]]; then
  PORT="$(tr -d '[:space:]' <"$PORT_FILE")"
  if [[ -n "$PORT" ]]; then
    echo "Stopping Next.js dev server on port $PORT…"
    PIDS="$(lsof -i :"$PORT" -sTCP:LISTEN -t 2>/dev/null || true)"
    if [[ -n "$PIDS" ]]; then
      # shellcheck disable=SC2086
      kill $PIDS 2>/dev/null || true
    fi
    if lsof -i :"$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
      echo "Warning: port $PORT may still be in use." >&2
    else
      echo "Next.js dev server stopped."
    fi
  fi
fi

bash "$ROOT/scripts/worktree-supabase-local.sh" stop

echo "Worktree cleanup complete."
