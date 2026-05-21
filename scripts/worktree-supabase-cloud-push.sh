#!/usr/bin/env bash
# Push migrations from main to the linked cloud Supabase project (release step).
# See .cursor/rules/release-tag-deploy-workflow.mdc
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REF_FILE="$ROOT/supabase/cloud-project-ref"

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI not found." >&2
  exit 1
fi

PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
if [[ -z "$PROJECT_REF" && -f "$REF_FILE" ]]; then
  PROJECT_REF="$(tr -d '[:space:]' <"$REF_FILE")"
fi
if [[ -z "$PROJECT_REF" && -f supabase/.temp/project-ref ]]; then
  PROJECT_REF="$(tr -d '[:space:]' <supabase/.temp/project-ref)"
fi

if [[ -z "$PROJECT_REF" ]]; then
  echo "No Supabase project ref. Add supabase/cloud-project-ref or set SUPABASE_PROJECT_REF." >&2
  exit 1
fi

bash "$ROOT/scripts/worktree-supabase-link.sh"

echo ""
echo "Migration status (local vs remote):"
supabase migration list || true

echo ""
echo "Pushing migrations to cloud…"
supabase db push

echo ""
echo "Cloud Supabase migrations are up to date."
