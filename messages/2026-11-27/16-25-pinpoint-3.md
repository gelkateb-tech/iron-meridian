**Waypoints are fixed for land units, ships and waypoints, on branch `pinpoint-3` (2 fix rounds used, final check READY). Nothing is merged.** The 4 sheets above show master on the left and the fix on the right, same camera, phone, Germany: the ordered route on top, the end state below. The magenta ring is where you tapped.

Pictures: `shots/2026-11-27/pinpoint-3/`

**What was wrong**
- **Land: it was never the tap.** The rules always got your exact tapped point. But when a force arrived, a rule merged it into any of your own forces standing within about 50 km. Every province has its garrison at its city, so any tap within about 50 km of one of your cities ended in the city. It happened the hour the force crossed the border, before it even walked to the spot. A middle waypoint also lost the rest of the route.
- **Which change broke it:** none recently. This rule has been there since the very first pinpoint work (12 November).
- **Why the earlier fixes didn't hold:** all three were on the tapping side, which was already right. And the pinpoint tests emptied the map before running, so no garrison ever stood at a target city. One test even checked the 50 km merge as if it were intended.
- **Ships: a real breakage, on 14 November.** A change made "a tap on water deselects" run before the Waypoint step. So with Waypoint on, tapping the sea deselected your fleet instead of adding a stop. On a phone there was no way around it.

**The fix**
- A force now joins another only when it stands on the very same spot. A tap on or right by a city or one of your counters still snaps to it and joins, as before.
- With Waypoint on, a tap on water adds a stop, for fleets and for troops embarking from a port.
- A group sent together goes to one point and ends as one force on the tap (sheet 4). Before, two of three forces ended about 48 km away.
- A force dragged onto another walks to where that force stands, not to the province centre.
- **The computer's game is unchanged:** only your own forces were affected, so the same-seed test is unchanged too. Old saves with moves and stops in flight load and finish on every spot.

**So it can't break silently again**
- New guard test `.test/pinpoint-guard.js`, with 202 checks. It plays the real start with garrisons in place, by rules and by tapping like a player on phone and desktop: moves, waypoints, fleets, troops at sea, groups, drags, and a save and load halfway. On master it fails 30+ checks; on the fix it passes them all.
- It's in the standard checks now, with a new runner `tools/checks.sh` that runs every check one after another. The waypoint test, which wasn't in the standard checks before, is in too.

**Sheets**
1. Move to a spot 30 km from Hamburg: master swallows the force into the city (2 → 5); the fix stands on the tap.
2. Waypoint with two taps through garrisoned provinces: master merges at the end; the fix ends on the second tap.
3. A fleet, Waypoint with two taps on water: master deselects on the first tap; the fix makes 2 stops and ends on the last tap.
4. Three forces sent together: master spreads them, one merges into the city and two end 48 km away; the fix ends as one force of 6 on the tap.

**One honest point:** my disk clean-up earlier today deleted this job's first screenshots while it was still running, so these sheets were made again afterwards from the same code. That was my mistake, and nothing in the code was affected.

**Merge order:** this one should go first. Build requirements, starting armies, the fighter and combat display all wait on it, because they share the same test area.

**Question** (my default in brackets)
1. Merge waypoints now and publish a Dev Build, then the others one at a time? (yes)

---
Pictures: `shots/2026-11-27/pinpoint-3/`
