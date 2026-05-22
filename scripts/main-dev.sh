#!/usr/bin/env bash
# Primary (non-worktree) checkout dev — always http://karriqi.test. See scripts/setup-karriqi-dev-host.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DEV_HOST="karriqi.test"
DEV_PORT="${KARRIQI_DEV_PORT:-3010}"
USE_PWA=0
if [[ "${1:-}" == "--pwa" ]]; then
  USE_PWA=1
fi

is_worktree() {
  local git_dir
  git_dir="$(git rev-parse --git-dir 2>/dev/null || true)"
  [[ "$git_dir" == *"/worktrees/"* ]] || [[ "$ROOT" == *"/.cursor/worktrees/"* ]]
}

if is_worktree; then
  echo "This checkout is a git worktree. Run: pnpm worktree:dev" >&2
  exit 1
fi

HERD_PROXY="${HOME}/Library/Application Support/Herd/config/valet/Nginx/${DEV_HOST}"
if [[ ! -f "$HERD_PROXY" ]]; then
  echo "Missing Herd proxy for ${DEV_HOST}. Run once:" >&2
  echo "  pnpm setup:local-host" >&2
  echo "" >&2
fi

echo ""
echo "Karriqi main dev — http://${DEV_HOST}"
echo "  Next.js on port ${DEV_PORT} (Herd proxies :80 → :${DEV_PORT})"
echo "  Worktrees: http://localhost:<port>"
echo ""
echo "Starting Next.js (Ctrl+C to stop)…"
echo ""

if [[ "$USE_PWA" == "1" ]]; then
  exec env ENABLE_PWA_IN_DEV=1 pnpm exec next dev --webpack --hostname 0.0.0.0 --port "$DEV_PORT"
else
  exec env ENABLE_PWA_IN_DEV=0 pnpm exec next dev --turbopack --hostname 0.0.0.0 --port "$DEV_PORT"
fi
