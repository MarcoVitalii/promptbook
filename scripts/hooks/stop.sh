#!/bin/sh
# Stop hook: before Claude ends its turn, run every check, browser included, if anything changed since the last green run.
# Silent when green or unchanged. A failure is sent back to Claude once (exit 2); the same state is not run twice.
root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
out=$(sh "$root/scripts/check.sh" full --once 2>&1) && exit 0
echo "$out" >&2
exit 2
