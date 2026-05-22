#!/usr/bin/env bash
# Link this worktree to the shared cloud Supabase project (non-interactive).
# Ref: supabase/cloud-project-ref (committed). Override with SUPABASE_PROJECT_REF.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REF_FILE="$ROOT/supabase/cloud-project-ref"
LINKED_REF_FILE="$ROOT/supabase/.temp/project-ref"

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI not found — skip link." >&2
  exit 0
fi

PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
if [[ -z "$PROJECT_REF" && -f "$REF_FILE" ]]; then
  PROJECT_REF="$(tr -d '[:space:]' <"$REF_FILE")"
fi

if [[ -z "$PROJECT_REF" ]]; then
  echo "No cloud project ref (supabase/cloud-project-ref or SUPABASE_PROJECT_REF)." >&2
  exit 0
fi

if [[ -f "$LINKED_REF_FILE" ]]; then
  CURRENT="$(tr -d '[:space:]' <"$LINKED_REF_FILE")"
  if [[ "$CURRENT" == "$PROJECT_REF" ]]; then
    echo "Supabase already linked to $PROJECT_REF"
    exit 0
  fi
  echo "Re-linking Supabase: $CURRENT → $PROJECT_REF"
fi

LINK_ARGS=(link --project-ref "$PROJECT_REF" --yes)
if [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
  LINK_ARGS+=(-p "$SUPABASE_DB_PASSWORD")
fi

echo "Linking cloud Supabase project ${PROJECT_REF}..."
if supabase "${LINK_ARGS[@]}"; then
  echo "Supabase linked to $PROJECT_REF"
else
  echo "Warning: supabase link failed. Run 'supabase login' if needed, then retry." >&2
  exit 0
fi
