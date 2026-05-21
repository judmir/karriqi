#!/usr/bin/env bash
# Local Supabase for a git worktree (schema isolation). See .cursor/rules/worktree-supabase-local.mdc
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MARKER="$ROOT/.worktree-local-supabase"
CLOUD_ENV_BACKUP="$ROOT/.env.local.cloud"
ENV_FILE="$ROOT/.env.local"

usage() {
  cat <<'EOF'
Usage: scripts/worktree-supabase-local.sh <command>

Commands:
  needs     Exit 0 when this worktree should use local Supabase
  start     Start (or reuse) local stack, reset DB, patch .env.local
  stop      Stop local stack and restore cloud .env.local
  status    Print local Supabase status (if running)
EOF
}

docker_running() {
  docker info >/dev/null 2>&1
}

needs_local_supabase() {
  if [[ -f "$MARKER" ]]; then
    return 0
  fi
  if [[ "${USE_LOCAL_SUPABASE:-}" == "1" ]]; then
    return 0
  fi
  if [[ "${USE_LOCAL_SUPABASE:-}" == "0" ]]; then
    return 1
  fi

  git fetch origin main 2>/dev/null || true
  if ! git rev-parse --verify origin/main >/dev/null 2>&1; then
    return 1
  fi

  local diff
  diff="$(git diff origin/main --name-only -- supabase/migrations/ || true)"
  [[ -n "$diff" ]]
}

backup_cloud_env() {
  if [[ -f "$ENV_FILE" && ! -f "$CLOUD_ENV_BACKUP" ]]; then
    cp "$ENV_FILE" "$CLOUD_ENV_BACKUP"
    echo "Backed up cloud .env.local → .env.local.cloud"
  fi
}

set_env_var() {
  local key="$1"
  local value="$2"
  local tmp
  tmp="$(mktemp)"

  if [[ ! -f "$ENV_FILE" ]]; then
    touch "$ENV_FILE"
  fi

  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    awk -v k="$key" -v v="$value" '
      BEGIN { done = 0 }
      $0 ~ "^" k "=" { print k "=" v; done = 1; next }
      { print }
      END { if (!done) print k "=" v }
    ' "$ENV_FILE" >"$tmp"
  else
    cp "$ENV_FILE" "$tmp"
    printf '%s=%s\n' "$key" "$value" >>"$tmp"
  fi

  mv "$tmp" "$ENV_FILE"
}

patch_env_for_local() {
  if ! command -v supabase >/dev/null 2>&1; then
    echo "supabase CLI not found. Install: https://supabase.com/docs/guides/cli" >&2
    exit 1
  fi

  # shellcheck disable=SC2046
  eval "$(supabase status -o env 2>/dev/null)"

  if [[ -z "${API_URL:-}" || -z "${ANON_KEY:-}" ]]; then
    echo "Could not read local Supabase URL/anon key from 'supabase status'." >&2
    exit 1
  fi

  set_env_var "NEXT_PUBLIC_SUPABASE_URL" "$API_URL"
  set_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$ANON_KEY"
  echo "Patched .env.local for local Supabase ($API_URL)"
}

cmd_start() {
  if ! docker_running; then
    echo "Docker is not running. Start Docker Desktop, then retry." >&2
    exit 1
  fi

  if ! command -v supabase >/dev/null 2>&1; then
    echo "supabase CLI not found." >&2
    exit 1
  fi

  if [[ ! -f supabase/config.toml ]]; then
    echo "Initializing Supabase config…"
    supabase init
  fi

  backup_cloud_env

  echo "Starting local Supabase (Docker)…"
  supabase start

  echo "Applying migrations + local dev seed (supabase db reset)…"
  supabase db reset

  patch_env_for_local
  touch "$MARKER"

  echo ""
  echo "Local Supabase ready for this worktree."
  echo "  Studio:  http://127.0.0.1:54323"
  echo "  API:     http://127.0.0.1:54321"
  echo "  Marker:  .worktree-local-supabase"
  echo ""
  echo "Dev sign-in (email fallback on /auth/sign-in):"
  echo "  dev@karriqi.local / devpassword123"
  echo "  Fixtures: kanban tasks, shopping list, calendar events"
  echo ""
  echo "Cloud .env backup: .env.local.cloud (restored on stop/release)"
}

cmd_stop() {
  if [[ -f "$MARKER" ]]; then
    echo "Stopping local Supabase…"
    supabase stop --no-backup 2>/dev/null || supabase stop 2>/dev/null || true
    rm -f "$MARKER"
  fi

  if [[ -f "$CLOUD_ENV_BACKUP" ]]; then
    cp "$CLOUD_ENV_BACKUP" "$ENV_FILE"
    echo "Restored cloud .env.local from .env.local.cloud"
  fi
}

cmd="${1:-}"

case "$cmd" in
  needs)
    needs_local_supabase
    ;;
  start)
    cmd_start
    ;;
  stop)
    cmd_stop
    ;;
  status)
    supabase status 2>/dev/null || echo "Local Supabase is not running."
    ;;
  -h | --help | help)
    usage
    ;;
  *)
    usage >&2
    exit 1
    ;;
esac
