#!/usr/bin/env bash
# Start local Supabase (Docker), apply migrations when they change, and wire .env.local.
# Called from scripts/worktree-dev.sh and `pnpm worktree:supabase`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

HASH_FILE="$ROOT/.supabase-migrations-hash"
ENV_FILE="$ROOT/.env.local"
DEV_EMAIL="${KARRIQI_DEV_EMAIL:-dev@local.test}"
DEV_PASSWORD="${KARRIQI_DEV_PASSWORD:-devlocal123}"

require_docker() {
  if ! docker info >/dev/null 2>&1; then
    echo "Docker is not running. Start Docker Desktop, then rerun pnpm worktree:dev." >&2
    exit 1
  fi
}

migrations_hash() {
  find supabase/migrations -type f -name '*.sql' -print0 2>/dev/null \
    | sort -z \
    | xargs -0 shasum -a 256 2>/dev/null \
    | shasum -a 256 \
    | awk '{print $1}'
}

set_env_var() {
  local key="$1"
  local value="$2"
  local file="$3"
  local tmp="${file}.tmp.$$"

  touch "$file"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    awk -v k="$key" -v v="$value" '
      BEGIN { replaced = 0 }
      $0 ~ "^" k "=" { print k "=" v; replaced = 1; next }
      { print }
      END { if (!replaced) print k "=" v }
    ' "$file" >"$tmp"
  else
    cp "$file" "$tmp"
    printf '\n%s=%s\n' "$key" "$value" >>"$tmp"
  fi
  mv "$tmp" "$file"
}

strip_quotes() {
  local v="$1"
  v="${v#\"}"
  v="${v%\"}"
  printf '%s' "$v"
}

parse_status_env() {
  local key="$1"
  local line value
  line="$(supabase status -o env 2>/dev/null | sed -n "s/^${key}=//p" | tail -1)"
  strip_quotes "$line"
}

merge_local_supabase_env() {
  local api_url anon_key service_key studio_url

  api_url="$(parse_status_env "API_URL")"
  anon_key="$(parse_status_env "ANON_KEY")"
  service_key="$(parse_status_env "SERVICE_ROLE_KEY")"
  studio_url="$(parse_status_env "STUDIO_URL")"

  if [[ -z "$api_url" || -z "$anon_key" ]]; then
    echo "Supabase status did not return API_URL/ANON_KEY." >&2
    exit 1
  fi

  if [[ ! -f "$ENV_FILE" ]]; then
    if [[ -f .env.example ]]; then
      cp .env.example "$ENV_FILE"
    else
      touch "$ENV_FILE"
    fi
  fi

  set_env_var "NEXT_PUBLIC_SUPABASE_URL" "$api_url" "$ENV_FILE"
  set_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$anon_key" "$ENV_FILE"
  if [[ -n "$service_key" ]]; then
    set_env_var "SUPABASE_SERVICE_ROLE_KEY" "$service_key" "$ENV_FILE"
  fi

  echo ""
  echo "Local Supabase"
  echo "  API:    $api_url"
  echo "  Studio: ${studio_url:-http://127.0.0.1:54323}"
}

ensure_dev_user() {
  local api_url service_key http_code

  api_url="$(parse_status_env "API_URL")"
  service_key="$(parse_status_env "SERVICE_ROLE_KEY")"

  if [[ -z "$api_url" || -z "$service_key" ]]; then
    echo "Skipping dev user bootstrap (missing local Supabase keys)." >&2
    return 0
  fi

  http_code="$(
    curl -sS -o /dev/null -w '%{http_code}' \
      -X POST "${api_url}/auth/v1/admin/users" \
      -H "apikey: ${service_key}" \
      -H "Authorization: Bearer ${service_key}" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"${DEV_EMAIL}\",\"password\":\"${DEV_PASSWORD}\",\"email_confirm\":true}"
  )"

  case "$http_code" in
    200|201)
      echo "  Dev sign-in: ${DEV_EMAIL} / ${DEV_PASSWORD}"
      ;;
    422)
      echo "  Dev sign-in: ${DEV_EMAIL} / ${DEV_PASSWORD} (already exists)"
      ;;
    *)
      echo "  Dev user bootstrap returned HTTP ${http_code}; sign in via Studio if needed." >&2
      ;;
  esac
}

apply_migrations_if_needed() {
  local current stored

  current="$(migrations_hash)"
  stored=""
  if [[ -f "$HASH_FILE" ]]; then
    stored="$(cat "$HASH_FILE")"
  fi

  if [[ "$current" != "$stored" ]]; then
    echo "Applying migrations (supabase db reset)…"
    supabase db reset
    printf '%s' "$current" >"$HASH_FILE"
    ensure_dev_user
  else
    echo "Migrations unchanged — skipping db reset."
    ensure_dev_user
  fi
}

require_docker

if [[ ! -f supabase/config.toml ]]; then
  echo "Missing supabase/config.toml. Run supabase init in this checkout." >&2
  exit 1
fi

echo "Starting local Supabase (Docker)…"
supabase start

apply_migrations_if_needed
merge_local_supabase_env
