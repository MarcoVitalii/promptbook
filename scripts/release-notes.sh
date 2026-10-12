#!/bin/sh
# Prints the CHANGELOG.md entry of one release, or fails when the release is not ready to be tagged.
#   sh scripts/release-notes.sh r1.11
# Used by .github/workflows/release.yml: the text becomes the notes of the GitHub release.
cd "$(dirname "$0")/.." || exit 1
tag=$1
[ -n "$tag" ] || { echo "usage: release-notes.sh rX.Y" >&2; exit 2; }
grep -q "^const VERSION = '$tag';" src/core.js || { echo "tag $tag is not the VERSION in src/core.js: $(grep '^const VERSION' src/core.js)" >&2; exit 1; }
head=$(awk -v t="$tag" '$1 == "##" && $2 == t' CHANGELOG.md)
[ -n "$head" ] || { echo "CHANGELOG.md has no entry '## $tag'" >&2; exit 1; }
case $head in *"not yet released"*) echo "CHANGELOG.md still says: $head" >&2; exit 1 ;; esac
awk -v t="$tag" '$1 == "##" && $2 == t { on = 1; next } on && /^## / { exit } on' CHANGELOG.md
