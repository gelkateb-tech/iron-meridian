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
- Cities: sharper and more detailed up close: big cities are drawn at full screen resolution when you zoom in (made in pieces, only the part you see), and as you zoom they gain streets, blocks of buildings with soft shadows, parks with trees and ponds, squares, downtown towers, works and rail yards on the outskirts, and city lights along the new streets at night; each city keeps its own shape.
- Cities repair 1: on 3x phone screens the map now draws at the phone's full sharpness once you zoom in to city level, so cities get a pixel of detail for every screen pixel; city lights at night are just as sharp; jumping straight to a city on a phone no longer leaves it blurry; and cities are now made in many small steps, so making them never holds up the game for more than a moment.
- Cities repair 2: phones keep the map at the usual sharpness (the 3x switch made troop models jump and panning slower; cities are still drawn at a full pixel per map pixel); city lights no longer switch off when you zoom in close at night; cities sharpen in about 2 s instead of 6-10 s, and while they do, the nearest finished version is shown instead of a blur, so nothing pops while zooming; city edges fade softly into the countryside again, with darker, more varied roofs, firmer shadows and outlines and irregular parks; at night the roofs stay dark and the light comes from broken rows of street lamps and lit windows; city memory stays under the Battery saver's budget at night too.

## Released
- v3.11 — Arms Factory pricing: first factory $25M, each extra one a nation owns +40%.
- v3.10 — Test build with developer mode and a public build with all dev/test code stripped at build time.
- v3.9 — Sleek counters, mixed-stack icon, troop models, nothing moves while zooming.
