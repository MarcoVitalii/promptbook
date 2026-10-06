#!/bin/sh
# Runs every check against ../promptbook.html. Screenshots and PDFs go to $OUT (default: a temp folder).
cd "$(dirname "$0")/.." || exit 1
OUT="${OUT:-$(mktemp -d)}"; export OUT
total=0; failed=0
for t in test/*.test.js; do
  r=$(node "$t" 2>&1)
  p=$(printf '%s\n' "$r" | grep -c '^PASS'); f=$(printf '%s\n' "$r" | grep -c '^FAIL'); e=$(printf '%s\n' "$r" | grep -cE 'PAGEERROR|CONSOLE|Error:')
  echo "$t pass=$p fail=$f errors=$e"
  printf '%s\n' "$r" | grep -E '^FAIL|PAGEERROR|CONSOLE|Error:'
  total=$((total + p)); failed=$((failed + f + e))
done
echo "TOTAL pass=$total failed=$failed  (output in $OUT)"
[ "$failed" -eq 0 ]
