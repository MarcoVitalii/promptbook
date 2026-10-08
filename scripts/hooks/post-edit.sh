#!/bin/sh
# PostToolUse hook for Edit and Write: after a change to the sources, rebuild and run the checks that need no browser.
# Silent when green. On failure the last lines go back to Claude (exit 2).
root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
file=$(python3 -c 'import json,sys; print((json.load(sys.stdin).get("tool_input") or {}).get("file_path") or "")')
case "$file" in
  "$root"/src/*|"$root"/fonts/*|"$root"/build.py|"$root"/test/unit/*|"$root"/test/run.js|"$root"/scripts/check.sh) ;;
  *) exit 0 ;;
esac
out=$(sh "$root/scripts/check.sh" fast 2>&1) && exit 0
echo "$out" >&2
exit 2
