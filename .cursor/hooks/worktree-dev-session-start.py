#!/usr/bin/env python3
"""Cursor sessionStart: auto-start worktree dev server and inject preview URL."""

from __future__ import annotations

import json
import os
import subprocess
import sys


def workspace_root(data: dict) -> str:
    roots = data.get("workspace_roots") or []
    if roots:
        return roots[0]
    return os.environ.get("CURSOR_PROJECT_DIR", os.getcwd())


def is_worktree(root: str) -> bool:
    return "/.cursor/worktrees/" in root


def ensure_dev_server(root: str) -> tuple[str | None, str]:
    script = os.path.join(root, "scripts/worktree-dev-ensure-background.sh")
    if not os.path.isfile(script):
        return None, "missing ensure script"

    try:
        result = subprocess.run(
            ["bash", script],
            cwd=root,
            capture_output=True,
            text=True,
            timeout=200,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return None, "ensure script timed out"
    except OSError as exc:
        return None, str(exc)

    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "unknown error").strip()
        return None, detail

    lines = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    url = lines[-1] if lines else ""
    if url.startswith("http://localhost:"):
        return url, "ready"
    return None, result.stdout.strip() or "no preview URL returned"


def main() -> None:
    raw = sys.stdin.read()
    data: dict = {}
    if raw.strip():
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            data = {}

    root = workspace_root(data)
    if not is_worktree(root):
        print("{}")
        return

    url, status = ensure_dev_server(root)
    if url:
        context = (
            f"Worktree preview: {url} — primary checkout stays on http://karriqi.test. "
            "The dev server was auto-started by the sessionStart hook. "
            "Include the Worktree preview line in your first reply to the user."
        )
        print(
            json.dumps(
                {
                    "additional_context": context,
                    "env": {
                        "WORKTREE_PREVIEW_URL": url,
                        "WORKTREE_DEV_READY": "1",
                    },
                }
            )
        )
        return

    context = (
        "WORKTREE DEV SERVER FAILED TO AUTO-START. "
        "Your first tool call MUST be `pnpm worktree:dev` (background), wait for Ready, "
        "then include `Worktree preview: http://localhost:<PORT>` in your first reply. "
        f"Auto-start error: {status}"
    )
    print(
        json.dumps(
            {
                "additional_context": context,
                "env": {"WORKTREE_DEV_READY": "0"},
            }
        )
    )


if __name__ == "__main__":
    main()
