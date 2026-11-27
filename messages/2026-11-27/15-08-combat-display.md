**Combat display is done, on branch `combat-display` (one round plus a repair pass after the independent check). Nothing is merged; it's waiting for you.** The sheets above show master on the left and the branch on the right, desktop and phone, each taken just after a round.

Pictures and clip: `shots/2026-11-27/combat-display/`

**First, how combat timing works now (you asked before any change)**
- **Damage already lands on a fixed tick, every 15 game minutes:** four rounds an hour. At normal speed that's a round every 3.75 seconds, at 8× every half second. It isn't continuous.
- Both sides hit each other at :15, :30, :45 and :00. Each round is a quarter of the hour's damage.
- Artillery and warships firing from range also hit every 15 minutes, but their numbers were only shown once an hour.
- Air strikes and missiles land once, on the hour.
- Whether an army breaks and retreats is checked once an hour.
- **A Conflict of Nations-style hourly round is only a proposal** (`docs/COMBAT-TIMING-PROPOSAL.md`). The same damage per hour would land in one hit at :00, together with air strikes and missiles.
  - Tested on a copy: battle lengths change by about an hour at most, and the combat tests still pass.
  - Rounds swing more, since there's one roll instead of four.
  - A broken army escapes a bit sooner.
  - It reverses an earlier decision of yours (the 15-minute rounds), so it needs your OK. It would change the same-seed test, so it's best done after the other merges.

**What's built (for today's 15-minute rounds; it switches to hourly with one setting if you OK that)**
- **"Fighting" plus the enemy:**
  - The army panel gets a red "Fighting" row with the enemy army's flag and name ("France 1st Infantry Division"), and "+N" if there are more enemies.
  - On the map, a small label by each fighting counter shows "FIGHTING 1st Infantry Div."; the two sides' labels sit above and below, as a pair.
- **Countdown:** "Next round 3 s" in the panel, and on the map a small ring that fills through the round plus the countdown. At 4× and 8× it reads "<1 s" instead of flickering.
- **Damage after each round:** a red "lost −0.7%" chip by each side for about 2 seconds, and "last round: this force −0.5 · enemy −0.8%" in the panel. It counts everything that hit the army since the last round: battle, artillery, air strikes and missiles. The old floating "−N" numbers are gone.
- **Fog:** an enemy you haven't identified shows as "? Unidentified", never named or counted. Battles between other nations that you're only watching get just the ring and countdown.

**The independent check found 5 real problems, all fixed in the repair:**
- The damage chip ignored artillery and air strikes hitting in the same round: a bomber raid that cost half the army showed "−1%".
- The countdown said "now" for a whole second.
- "+1" was drawn over the enemy's name.
- The test was flaky on a busy machine.
- Your own label lost out to enemy labels when space was tight.

**Checks:** all pass, plus the new page test (26 checks, desktop and phone). The same-seed test is unchanged; no rules were touched. The others fail exactly as on master.

**Honest points:**
- The 10-second clip was recorded before the repair, so it still shows "now" in the countdown. The sheets are after the repair.
- Zoomed out (hex 60 or less) with three counters fighting, your own label is the short one (ring and countdown only), because the full one doesn't fit above or below. Letting it sit two rows away is a design call.

**Questions** (my default in brackets)
1. Switch to one hourly round like Conflict of Nations, or keep 15-minute rounds now that they're readable? (keep 15 minutes: the display makes them readable, and it's one setting to change later)
2. Zoomed out and crowded: let your own full label sit a little further from its counter? (yes)
3. Merge combat display? (yes, after the waypoint fix)

**Slots:** combat display's slot went to the logistics building proposal. Still running: waypoints, simpler buildings, the one-figure test and the unit picture pricing.

---
Pictures: `shots/2026-11-27/combat-display/`
