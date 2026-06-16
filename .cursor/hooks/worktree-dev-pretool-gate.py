#!/usr/bin/env python3
"""Cursor preToolUse: block non-Shell tools until worktree dev server is listening."""

from __future__ import annotations

import json
import os
import subprocess
import sys

ALLOWED_TOOLS = {"Shell", "Await"}


def workspace_root(data: dict) -> str:
    cwd = data.get("cwd") or ""
    if cwd and "/.cursor/worktrees/" in cwd:
        return cwd
    roots = data.get("workspace_roots") or []
    for root in roots:
        if "/.cursor/worktrees/" in root:
            return root
    project = os.environ.get("CURSOR_PROJECT_DIR", "")
    if project:
        return project
    return cwd


def is_worktree(root: str) -> bool:
    return "/.cursor/worktrees/" in root


def read_port(root: str) -> str:
    port_file = os.path.join(root, ".worktree-dev-port")
    if not os.path.isfile(port_file):
        return ""
    with open(port_file, encoding="utf-8") as handle:
        return handle.read().strip()


def port_listening(port: str) -> bool:
    if not port:
        return False
    result = subprocess.run(
        ["lsof", "-i", f":{port}", "-sTCP:LISTEN", "-t"],
        capture_output=True,
        text=True,
        check=False,
    )
    return result.returncode == 0 and bool(result.stdout.strip())


def shell_is_worktree_dev(data: dict) -> bool:
    if data.get("tool_name") != "Shell":
        return False
    tool_input = data.get("tool_input") or {}
    command = str(tool_input.get("command") or "")
    return "worktree:dev" in command or "worktree-dev" in command


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
        print(json.dumps({"permission": "allow"}))
        return

    if os.environ.get("WORKTREE_DEV_READY") == "1" and port_listening(read_port(root)):
        print(json.dumps({"permission": "allow"}))
        return

    if port_listening(read_port(root)):
        print(json.dumps({"permission": "allow"}))
        return

    tool_name = data.get("tool_name") or ""
    if tool_name in ALLOWED_TOOLS or shell_is_worktree_dev(data):
        print(json.dumps({"permission": "allow"}))
        return

    deny_payload = {
        "permission": "deny",
        "user_message": "Waiting for worktree dev server — the agent will retry shortly.",
        "agent_message": (
            "BLOCKED: Worktree dev server is not listening yet. "
            "Run `pnpm worktree:dev` in the background (block_until_ms: 0), poll until Ready, "
            "then retry. If the sessionStart hook is still booting, wait a few seconds and retry. "
            "Include `Worktree preview: http://localhost:<PORT>` in your first user-facing reply."
        ),
    }
    print(json.dumps(deny_payload))


if __name__ == "__main__":
    main()
