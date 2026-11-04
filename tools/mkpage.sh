#!/bin/bash
# Builds a standalone test page at <project>/.test/page.html (adds the doctype/body skeleton the Artifact host adds at publish time).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/.test"
{ echo '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'; cat "$ROOT/index.html"; echo '</body></html>'; } > "$ROOT/.test/page.html"
for f in "$ROOT"/*.js; do [ -e "$f" ] && cp "$f" "$ROOT/.test/"; done
# offline tests: use a local copy of three.js instead of the CDN
THREE_LOCAL=/tmp/claude-0/-home-user/7fd07611-91e4-5b00-ba43-06c622a65904/scratchpad/build/node_modules/three/build/three.min.js
if [ -f "$THREE_LOCAL" ]; then cp "$THREE_LOCAL" "$ROOT/.test/three.min.js"; sed -i 's#https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js#three.min.js#' "$ROOT/.test/page.html"; fi
echo "$ROOT/.test/page.html"
