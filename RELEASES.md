# Releases: dev build → public build

How it works from now on:
- Every finished change goes to the **Dev Build** first: https://claude.ai/artifact/EKDR7pckn3hPkoJVuxoe7R
- Each change is noted below under **Waiting for public**, newest last.
- The **public build** (https://claude.ai/artifact/PegnoUY4juYxMxy64YDTS4) is only updated when the owner says to move changes to public. Then everything under "Waiting for public" is published, moved to **Released**, and tagged in git.

## Currently public
- v3.11 (commit 986e1fb): CoN layout, sleek counters, mixed-stack icon, troop models fixed while zooming, research open from day one, Arms Factory pricing, public build with no dev code.

## Waiting for public
- Battery saver (setting, on by default on phones): the map redraws only when something on it changes, 30 fps cap, pauses in the background, building pictures load when first shown; repairs 1 and 2 (no redraws for convoys, storms or water off screen; names placed right after a phone rotation).
- Battery saver: the map now runs smooth (up to 60 fps) while you drag, pinch or zoom it or the camera glides, and for a moment after; 30 fps for other animation, 10 for gentle background motion, nothing when still.
- Research: two projects run at the same time (slot #1 and slot #2, both at full speed, for you and the AI); a project waits while its prerequisite is still running, and an old save's queued project starts in slot #2 when it loads; repair 1 (tapping a project only selects it, the Research button starts it and its slot lights up; button text no longer runs together).

## Released
- v3.11 — Arms Factory pricing: first factory $25M, each extra one a nation owns +40%.
- v3.10 — Test build with developer mode and a public build with all dev/test code stripped at build time.
- v3.9 — Sleek counters, mixed-stack icon, troop models, nothing moves while zooming.
