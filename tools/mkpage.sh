#!/bin/bash
# Builds a standalone test page at <project>/.test/page.html (adds the doctype/body skeleton the Artifact host adds at publish time).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/.test"
{ echo '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'; cat "$ROOT/index.html"; echo '</body></html>'; } > "$ROOT/.test/page.html"
for f in "$ROOT"/*.js; do [ -e "$f" ] && cp "$f" "$ROOT/.test/"; done
echo "$ROOT/.test/page.html"
