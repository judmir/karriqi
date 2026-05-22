#!/usr/bin/env bash
# Create or patch .env.local for a git worktree (Supabase copy + AUTH_PIN_PEPPER).
# Called by scripts/worktree-dev.sh; safe to run standalone after a new worktree is created.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PRIME_ENV="/Users/judikarriqi/Documents/__dev/karriqi/.env.local"
ENV_FILE=".env.local"

pepper_is_valid() {
  local value="${1:-}"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  [[ ${#value} -ge 16 ]]
}

read_pepper() {
  local file="$1"
  local line value
  line="$(grep -E '^AUTH_PIN_PEPPER=' "$file" 2>/dev/null | tail -1 || true)"
  [[ -n "$line" ]] || return 1
  value="${line#AUTH_PIN_PEPPER=}"
  pepper_is_valid "$value"
}

ensure_auth_pin_pepper() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "Cannot set AUTH_PIN_PEPPER — $file is missing." >&2
    return 1
  fi

  if read_pepper "$file"; then
    echo "AUTH_PIN_PEPPER already set in $file"
    return 0
  fi

  local pepper
  pepper="$(openssl rand -hex 32)"

  if grep -qE '^# AUTH_PIN_PEPPER=' "$file" 2>/dev/null; then
    sed -i '' "s|^# AUTH_PIN_PEPPER=.*|AUTH_PIN_PEPPER=${pepper}|" "$file"
  elif grep -qE '^AUTH_PIN_PEPPER=' "$file" 2>/dev/null; then
    sed -i '' "s|^AUTH_PIN_PEPPER=.*|AUTH_PIN_PEPPER=${pepper}|" "$file"
  else
    printf '\n# Generated for this worktree by scripts/worktree-env-bootstrap.sh\nAUTH_PIN_PEPPER=%s\n' "$pepper" >>"$file"
  fi

  echo "Generated AUTH_PIN_PEPPER in $file (worktree-local; rotating invalidates PINs in this checkout only)."
}

find_env_source() {
  local wt src
  while IFS= read -r line; do
    wt="${line%% *}"
    if [[ "$wt" == "$ROOT" ]]; then
      continue
    fi
    if [[ -f "$wt/.env.local" ]]; then
      echo "$wt/.env.local"
      return 0
    fi
  done < <(git worktree list 2>/dev/null || true)

  if [[ -f "$PRIME_ENV" ]]; then
    echo "$PRIME_ENV"
    return 0
  fi

  return 1
}

bootstrap_env() {
  if [[ -f "$ENV_FILE" ]]; then
    ensure_auth_pin_pepper "$ENV_FILE"
    return 0
  fi

  local src=""
  if src="$(find_env_source)"; then
    cp "$src" "$ENV_FILE"
    echo "Copied $ENV_FILE from $src"
  elif [[ -f .env.example ]]; then
    cp .env.example "$ENV_FILE"
    echo "Created $ENV_FILE from .env.example"
  else
    echo "No .env.example found — create $ENV_FILE manually before using auth routes." >&2
    return 1
  fi

  ensure_auth_pin_pepper "$ENV_FILE"
}

bootstrap_env
