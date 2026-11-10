#!/bin/bash
# Freezes the committed game (git HEAD) into a standalone test folder: tools/snapshot.sh <dir>
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; OUT="$1"; mkdir -p "$OUT"
{ echo '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'; git -C "$ROOT" show HEAD:index.html; echo '</body></html>'; } > "$OUT/page.html"
git -C "$ROOT" show HEAD:world.js > "$OUT/world.js"; git -C "$ROOT" show HEAD:lines.js > "$OUT/lines.js" 2>/dev/null || true
# the rules files of that commit (none before the rules split)
for f in $(git -C "$ROOT" ls-tree -r --name-only HEAD -- rules 2>/dev/null); do mkdir -p "$OUT/$(dirname "$f")"; git -C "$ROOT" show "HEAD:$f" > "$OUT/$f"; done
echo "$OUT/page.html"
