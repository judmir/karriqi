#!/usr/bin/env bash
# Start worktree dev server if needed; wait until Next.js listens; print preview URL.
# Used by Cursor sessionStart hook, agents, and `pnpm worktree:dev:ensure`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT_FILE="$ROOT/.worktree-dev-port"
LOG_FILE="$ROOT/.worktree-dev.log"
LOCK_DIR="$ROOT/.worktree-dev-start.lock"

is_worktree() {
  [[ "$ROOT" == *"/.cursor/worktrees/"* ]]
}

read_port() {
  if [[ -f "$PORT_FILE" ]]; then
    tr -d '[:space:]' <"$PORT_FILE"
  fi
}

port_listening() {
  local port="$1"
  [[ -n "$port" ]] && lsof -i ":$port" -sTCP:LISTEN -t >/dev/null 2>&1
}

preview_url() {
  local port="$1"
  echo "http://localhost:${port}"
}

release_lock() {
  rmdir "$LOCK_DIR" 2>/dev/null || true
}

acquire_lock() {
  if mkdir "$LOCK_DIR" 2>/dev/null; then
    return 0
  fi
  for _ in $(seq 1 120); do
    port="$(read_port)"
    if [[ -n "$port" ]] && port_listening "$port"; then
      preview_url "$port"
      exit 0
    fi
    if mkdir "$LOCK_DIR" 2>/dev/null; then
      return 0
    fi
    sleep 1
  done
  echo "Timed out waiting for worktree dev start lock" >&2
  exit 1
}

if ! is_worktree; then
  exit 0
fi

port="$(read_port)"
if [[ -n "$port" ]] && port_listening "$port"; then
  preview_url "$port"
  exit 0
fi

acquire_lock
trap release_lock EXIT

port="$(read_port)"
if [[ -n "$port" ]] && port_listening "$port"; then
  preview_url "$port"
  exit 0
fi

echo "Starting worktree dev server (see ${LOG_FILE})…" >&2
if ! docker info >/dev/null 2>&1; then
  export USE_LOCAL_SUPABASE=0
  echo "Docker not running — starting with USE_LOCAL_SUPABASE=0 (cloud Supabase)." >&2
fi
nohup bash "$ROOT/scripts/worktree-dev.sh" >>"$LOG_FILE" 2>&1 &
disown

for _ in $(seq 1 180); do
  port="$(read_port)"
  if [[ -n "$port" ]] && port_listening "$port"; then
    preview_url "$port"
    exit 0
  fi
  sleep 1
done

echo "Timed out waiting for worktree dev server to listen" >&2
exit 1
