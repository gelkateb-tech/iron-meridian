**Got it. All four playtest items are now running as three jobs, each on its own branch.** Nothing merges until you've seen it. First I checked the queue and the open branches: none of them already touches waypoints, the fighter or the starting armies, so nothing gets fixed twice.

That fills all 5 job slots: these three, plus missiles plan 2 and city lots round 3.

**1. Waypoints (branch `pinpoint-3`)**
- First an investigator works out which change broke it this time, and why the earlier fix didn't hold. Our existing pinpoint test runs in the checks but apparently doesn't cover waypoints.
- Then the fix for land units, ships and every waypoint leg, chained ones included.
- A guard test that taps like a player, on phone and desktop. I'll show that it fails on today's master and passes on the fix, and it goes into the standard checks.
- An independent checker then tries to break it: near cities, coasts and borders, after a save and load, and after Halt.

**2. Air superiority fighter (branch `fighter-asf`)**
- **a, Attack:** I'll show you the proposed ground-attack numbers next to the strike fighter's and the interceptor's. The order is built on the branch with those numbers in a single entry, so you can change them before anything merges.
- **b:** a list of its buttons next to the strike fighter's, with the missing ones added where they make sense.
- **c:** a calm, wide racetrack patrol inside the area at a believable speed. You'll get the 15-second clip, starting on the map, zoomed in, with no menus, plus a "before" clip.
- **d:** patrolling aircraft tappable at every zoom, with an automated test.

**3 and 4. Starting armies and the recon vehicle (branch `start-armies`)**
- **The recon vehicle doesn't exist yet.** Today only Special Forces have the longer scouting view, and nothing has your "fully identified" rule. So item 4 is a proposal only: stats, a research line, the pictures it needs and their Gemini cost. No Gemini credit gets spent.
- The art balance is about $5.32 against the $5 floor, so a new unit's pictures will almost certainly need a top-up. I'll give you the exact figure.
- **The new start for every nation:**
  - Capital: 2 infantry, 1 artillery and the fighter at its Airbase.
  - Two outer stacks of 2 infantry each, in cities picked by one simple rule. I'll tell you the rule and list the chosen cities for all 68 nations.
  - No tanks.
- Each outer stack's recon slot stays empty until you OK the recon vehicle.
- Then come the balance and headless checks, with computer nations given the same start. You'll get before and after sheets for Russia, Germany and a small nation.

**Missiles:** this block was the playtest one, with nothing on missiles. So the missiles plan keeps the base I described: M1–M15 approved, and MS1–MS5 still open.

---
Pictures: none
