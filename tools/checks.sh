#!/bin/bash
# The standard checks (BUILD.md "Standard checks"): run them all before a merge. bash tools/checks.sh [log folder]
# One log per check in the folder (default .test/checks-log) and summary.txt there: one line per check, "<name> <exit code>" (0 = passed).
# The browser tests run one after another: run side by side on a loaded machine their tap checks fail for want of frames (controls.js, 2026-11-26).
# The build's ./dist is deleted at the end (it is not kept in the checkout).
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT" || exit 1
L="${1:-$ROOT/.test/checks-log}"; mkdir -p "$L"; : > "$L/summary.txt"
run(){ local n="$1"; shift; timeout 2400 "$@" > "$L/$n.log" 2>&1; local r=$?; echo "$n $r" >> "$L/summary.txt"; echo "$n $r"; }
run lint node tools/split-lint.js
run mkpage bash tools/mkpage.sh
run golden node tools/split-golden.js 10 12345
run headless node tools/headless.js --check
# the browser tests, one at a time
run uic node .test/units-in-cities.js
run pinpoint node .test/pinpoint.js
run waypoints node .test/waypoints.js
run pinpoint-guard node .test/pinpoint-guard.js   # (PINPOINT-3: moves, waypoints, fleets and drags end on the tapped spot on a map with garrisons)
run controls node .test/controls.js
run rebels2 node .test/rebels2.js
run d10 node .test/d10.js
run dealings node .test/dealings.js
run anchor node .test/anchor-check.js 1440 900 1
# nat-oldsave loads a save of the old build (master 8d9051c) into this one: that build is made once in .test/base8d9 (not kept in git)
if [ ! -f "$ROOT/.test/base8d9/.test/page.html" ]; then echo "making .test/base8d9 (the old build nat-oldsave needs)"
  rm -rf -- "$ROOT/.test/base8d9"; mkdir -p "$ROOT/.test/base8d9" && git -C "$ROOT" archive 8d9051c | tar -x -C "$ROOT/.test/base8d9" && bash "$ROOT/.test/base8d9/tools/mkpage.sh" > "$L/base8d9.log" 2>&1; fi
run natold node .test/nat-oldsave.js
run recon node .test/recon.js   # (the Recon Vehicle: identification, sight, speed, capture, old saves, the computer; plain Node)
# the balance checks, one after another too: balance plays in a browser, and run beside nations-balance on a loaded machine its page crashed
# ('Target crashed', PINPOINT-3, 2026-11-27); eco-check and stack-duel are heavy plain Node runs, so they take their turn as well
run balance node tools/balance.js
run natbal node tools/nations-balance.js
run eco node tools/eco-check.js --scenarios
run duel node tools/stack-duel.js --scenarios
run build node tools/build.js
rm -rf -- "$ROOT/dist"
if awk '$2 != 0 { bad = 1 } END { exit bad }' "$L/summary.txt"; then echo "ALL PASSED ($L)"; else echo "FAILED: $(awk '$2 != 0 { printf "%s ", $1 }' "$L/summary.txt")($L)"; exit 1; fi
