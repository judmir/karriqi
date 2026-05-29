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
  ensure    Idempotent: local stack + migrations applied + .env.local patched
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
  if [[ -n "$diff" ]]; then
    return 0
  fi

  # Migrations applied locally but not yet on linked cloud (e.g. merged to main, not cloud-pushed)
  if command -v supabase >/dev/null 2>&1; then
    if supabase migration list 2>/dev/null | awk -F'|' '
      NR > 2 {
        gsub(/^[ \t]+|[ \t]+$/, "", $1)
        gsub(/^[ \t]+|[ \t]+$/, "", $2)
        if ($1 ~ /^[0-9]+$/ && $2 == "") { exit 0 }
      }
      END { exit 1 }
    '; then
      return 0
    fi
  fi

  return 1
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

  local env_dump
  env_dump="$(supabase status -o env 2>/dev/null || true)"
  if [[ -z "$env_dump" ]]; then
    echo "Could not read local Supabase status env." >&2
    exit 1
  fi

  local api_url anon_key service_role_key secret_key
  api_url="$(printf '%s\n' "$env_dump" | awk -F'=' '$1=="API_URL"{print $2}' | tr -d '"' | tail -1)"
  anon_key="$(printf '%s\n' "$env_dump" | awk -F'=' '$1=="ANON_KEY"{print $2}' | tr -d '"' | tail -1)"
  service_role_key="$(printf '%s\n' "$env_dump" | awk -F'=' '$1=="SERVICE_ROLE_KEY"{print $2}' | tr -d '"' | tail -1)"
  secret_key="$(printf '%s\n' "$env_dump" | awk -F'=' '$1=="SECRET_KEY"{print $2}' | tr -d '"' | tail -1)"

  if [[ -z "$api_url" || -z "$anon_key" || -z "$service_role_key" ]]; then
    echo "Could not read local Supabase keys from 'supabase status'." >&2
    exit 1
  fi

  set_env_var "NEXT_PUBLIC_SUPABASE_URL" "$api_url"
  set_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$anon_key"
  set_env_var "SUPABASE_SERVICE_ROLE_KEY" "$service_role_key"
  if [[ -n "$secret_key" ]]; then
    set_env_var "SUPABASE_SECRET_KEY" "$secret_key"
  fi
  echo "Patched .env.local for local Supabase ($api_url)"
}

env_points_at_local_supabase() {
  local url="${1:-}"
  if [[ -z "$url" && -f "$ENV_FILE" ]]; then
    url="$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' "$ENV_FILE" 2>/dev/null | tail -1 | cut -d= -f2- || true)"
  fi
  [[ "$url" == *127.0.0.1* || "$url" == *localhost* ]]
}

local_supabase_running() {
  command -v supabase >/dev/null 2>&1 && supabase status >/dev/null 2>&1
}

public_table_exists() {
  local table="$1"
  local out
  out="$(supabase db query --local "select count(*)::int as count from information_schema.tables where table_schema = 'public' and table_name = '${table}';" 2>/dev/null || true)"
  echo "$out" | grep -Eq '"count"[[:space:]]*:[[:space:]]*1([^0-9]|$)'
}

local_migrations_current() {
  local f base version list
  if ! local_supabase_running; then
    return 1
  fi
  list="$(supabase migration list 2>/dev/null || true)"
  for f in supabase/migrations/*.sql; do
    [[ -f "$f" ]] || continue
    base="$(basename "$f" .sql)"
    version="${base%%_*}"
    if ! echo "$list" | awk -v v="$version" -F'|' '
      index($1, v) > 0 && $1 ~ /^[[:space:]]*[0-9]+/ { found = 1 }
      END { exit !found }
    '; then
      echo "Local DB missing migration ${version}" >&2
      return 1
    fi
  done
  return 0
}

required_schema_tables() {
  # Tables for migrations shipped in-repo (post-reset smoke check)
  if [[ -f supabase/migrations/20260527140000_google_calendar_sync.sql ]]; then
    echo "google_calendar_connections"
  fi
  if [[ -f supabase/migrations/20260527150000_google_calendar_sources.sql ]]; then
    echo "google_calendar_sources"
  fi
}

local_postgres_ready() {
  supabase db query --local "select 1 as ok;" >/dev/null 2>&1
}

wait_for_local_postgres() {
  local attempt
  echo "Waiting for local Postgres after reset…"
  for attempt in $(seq 1 60); do
    if local_postgres_ready && local_migrations_current; then
      echo "Local migrations applied."
      return 0
    fi
    sleep 2
  done
  echo "Timed out waiting for local Supabase after reset." >&2
  echo "Try: supabase stop && supabase start && pnpm worktree:supabase:ensure" >&2
  return 1
}

warn_if_feature_tables_missing() {
  local table
  while IFS= read -r table; do
    [[ -n "$table" ]] || continue
    if ! public_table_exists "$table"; then
      echo "Warning: public.${table} not visible yet (Postgres may still be starting)." >&2
      return 0
    fi
  done < <(required_schema_tables)
  return 0
}

seed_local_dev_pins() {
  if command -v node >/dev/null 2>&1; then
    node "$ROOT/scripts/seed-local-dev-pins.mjs" || echo "Warning: dev PIN seed failed (run manually)." >&2
  fi
}

apply_local_post_reset() {
  patch_env_for_local
  set_env_var "AUTH_PIN_PEPPER" "karriqi-local-dev-pin-pepper-v1-not-for-production"
  seed_local_dev_pins
  touch "$MARKER"
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

  apply_local_post_reset
  echo "Set fixed local AUTH_PIN_PEPPER for reliable dev PIN sign-in."

  echo ""
  echo "Local Supabase ready for this worktree."
  echo "  Studio:  http://127.0.0.1:54323"
  echo "  API:     http://127.0.0.1:54321"
  echo "  Marker:  .worktree-local-supabase"
  echo ""
  echo "Dev sign-in on /auth/sign-in:"
  echo "  One-click: Judi or Savina (local dev picker)"
  echo "  PIN: judikarriqi@gmail.com → 123456 | savinakarriqi@gmail.com → 654321"
  echo "  Email fallback: devpassword123 for either account"
  echo ""
  echo "Cloud .env backup: .env.local.cloud (restored on stop/release)"
}

cmd_ensure() {
  if ! needs_local_supabase; then
    return 0
  fi

  if ! docker_running; then
    echo "Docker is not running. Start Docker Desktop, then retry." >&2
    echo "This branch has unpushed migrations — cloud Supabase will not have them." >&2
    echo "Example missing table error: public.google_calendar_connections" >&2
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

  if ! env_points_at_local_supabase; then
    echo ""
    echo "This worktree must use local Supabase: cloud is missing migrations/tables"
    echo "that exist in supabase/migrations/ (e.g. google_calendar_connections)."
    echo "Patching .env.local → http://127.0.0.1:54321"
    echo ""
  fi

  if ! local_supabase_running; then
    echo "Starting local Supabase (Docker)…"
    supabase start
  fi

  if ! local_migrations_current; then
    echo "Applying migrations + local dev seed (supabase db reset)…"
    supabase db reset
    wait_for_local_postgres || exit 1
    apply_local_post_reset
  else
    apply_local_post_reset
    echo "Local Supabase schema OK (migrations present)."
  fi
  warn_if_feature_tables_missing
}

cmd_stop() {
  if [[ -f "$MARKER" ]]; then
    echo "Stopping local Supabase…"
    supabase stop --no-backup 2>/dev/null || supabase stop 2>/dev/null || true
    rm -f "$MARKER"
  fi

  if [[ -f "$CLOUD_ENV_BACKUP" ]]; then
    google_id=""
    google_secret=""
    if [[ -f "$ENV_FILE" ]]; then
      google_id="$(grep -E '^GOOGLE_CLIENT_ID=' "$ENV_FILE" 2>/dev/null | tail -1 || true)"
      google_secret="$(grep -E '^GOOGLE_CLIENT_SECRET=' "$ENV_FILE" 2>/dev/null | tail -1 || true)"
    fi
    cp "$CLOUD_ENV_BACKUP" "$ENV_FILE"
    if [[ -n "$google_id" ]] && ! grep -qE '^GOOGLE_CLIENT_ID=.+' "$ENV_FILE" 2>/dev/null; then
      printf '%s\n' "$google_id" >>"$ENV_FILE"
    fi
    if [[ -n "$google_secret" ]] && ! grep -qE '^GOOGLE_CLIENT_SECRET=.+' "$ENV_FILE" 2>/dev/null; then
      printf '%s\n' "$google_secret" >>"$ENV_FILE"
    fi
    echo "Restored cloud .env.local from .env.local.cloud"
  fi
}

cmd="${1:-}"

case "$cmd" in
  needs)
    needs_local_supabase
    ;;
  ensure)
    cmd_ensure
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
