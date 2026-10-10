#!/bin/sh
# Build, then test. Does nothing when no input has changed since the last green run.
#   sh scripts/check.sh fast            build + syntax + test/unit (no browser, under a second)
#   sh scripts/check.sh full            the above + the browser checks in test/
#   --force   run even when nothing changed
#   --once    also skip when this exact state was already tried and failed (used by the Stop hook)
cd "$(dirname "$0")/.." || exit 1
. scripts/env.sh
mode=fast; force=; once=
for a in "$@"; do case $a in fast|full) mode=$a ;; --force) force=1 ;; --once) once=1 ;; *) echo "unknown argument: $a" >&2; exit 2 ;; esac; done
mkdir -p .cache
inputs='src fonts build.py package-lock.json scripts/check.sh test/run.js test/unit'
[ $mode = full ] && inputs="$inputs test"
hash=$(git ls-files -co --exclude-standard -- $inputs | sort -u | while read -r f; do [ -f "$f" ] && { echo "$f"; cat "$f"; }; done | sha256sum | cut -d' ' -f1)
if [ -z "$force" ]; then
  [ "$(cat .cache/$mode.ok 2>/dev/null)" = "$hash" ] && { echo "$mode: unchanged since the last green run"; exit 0; }
  [ -n "$once" ] && [ "$(cat .cache/$mode.tried 2>/dev/null)" = "$hash" ] && exit 0
fi
echo "$hash" > .cache/$mode.tried
step() { out=$("$@" 2>&1) || { echo "$out" | tail -n 25; echo "check $mode FAILED at: $*"; exit 1; }; }
step python3 build.py
for f in src/core.js src/view.js src/io.js src/cast.js; do step node --check $f; done
step node test/run.js test/unit
[ $mode = full ] && step node test/run.js test
echo "$hash" > .cache/$mode.ok
echo "$out"
