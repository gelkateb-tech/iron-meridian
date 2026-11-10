#!/bin/bash
# Builds a standalone test page at <project>/.test/page.html (adds the doctype/body skeleton the Artifact host adds at publish time).
# This page is the TEST build: the @DEV / @TEST markers in index.html are comments, so the developer mode and the window.__im hooks stay in
# (tools/build.js writes the same test build to dist/test and the stripped public build to dist/public; see BUILD.md).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/.test"
{ echo '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'; cat "$ROOT/index.html"; echo '</body></html>'; } > "$ROOT/.test/page.html"
for f in "$ROOT"/*.js; do [ -e "$f" ] && cp "$f" "$ROOT/.test/"; done
# offline tests: use a local copy of three.js instead of the CDN
THREE_LOCAL="$ROOT/tools/vendor/three.min.js"
if [ -f "$THREE_LOCAL" ]; then cp "$THREE_LOCAL" "$ROOT/.test/three.min.js"; sed -i 's#https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js#three.min.js#' "$ROOT/.test/page.html"; fi
[ -d "$ROOT/assets" ] && rm -rf "$ROOT/.test/assets" && cp -r "$ROOT/assets" "$ROOT/.test/assets"
echo "$ROOT/.test/page.html"
