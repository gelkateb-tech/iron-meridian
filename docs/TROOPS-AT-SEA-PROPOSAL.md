# Troops at sea: HP proposal (NOT built)

## Today (branch fighter-asf, master the same)
- Troops at sea keep their land HP: Motorized Infantry 10, Marines 10, Mobile Artillery 9, Main Battle Tank 14, IFV 12.
- They take more damage instead: AT_SEA (rules/data.js) 1.5x with no warship of their own nation in that sea zone, 0.75x with one.
  Applies in battles at sea (rules/tick.js), and from this branch on in air strikes and UAV salvoes (rules/air.js) and in Army Info.

## Conflict of Nations
- Land units that embark become transport ships with their own very low defence and hit points, so an unescorted convoy is easy prey for
  aircraft, submarines and warships, and players escort or avoid open sea. (Exact CoN transport stats not checked here.)

## Proposal: half their land HP at sea (the owner's guess)
- Infantry 10 -> 5, artillery 9 -> 4.5, tank 14 -> 7, IFV 12 -> 6.
- Simplest build: halving HP at sea is the same as doubling the damage they take at sea, so AT_SEA becomes alone 3.0, escort 1.5.
  No wounds to convert on boarding and landing, old saves untouched, one switch in rules/data.js.

## Measured (real resolveStrike / real battle tick, seed 4242, a German convoy of 3 infantry, 30 HP, in a North Atlantic zone)
| | today (1.5 / 0.75) | half HP (3.0 / 1.5) |
|---|---|---|
| one ASF Attack, HP lost (land HP) | 1.5 (5% of the convoy) | 3.1 (10%) |
| two Strike Fighters, HP lost / units lost | 28.2 / 2.4 of 3 | 30 / 3 of 3 (all) |
| two Strike Fighters, convoy escorted by a frigate | 10.1 / 0.5 | 20.2 / 1.5 |
| one enemy frigate vs the convoy, 48 h | 7 HP lost, not sunk | 11.3 HP lost, not sunk |
| one enemy frigate vs the escorted convoy, 48 h | 0 lost | 0.5 lost |

Worked example (a landing): 3 infantry cross 2 sea zones (about 2 days) to land at an enemy naval city. Enemy ASF harasses them twice a day
(4 sorties): today they lose about 6 HP (they land at 80%); at half HP about 12 HP (they land at 60%, one unit likely lost). Two Strike
Fighter sorties on the way: today the convoy loses 2-3 of 3 units; at half HP all 3, unless a frigate escorts it (then 1-2 of 3).
What it does to landings: an unescorted invasion fleet within reach of enemy strike aircraft rarely arrives; escorts (the 0.75x/1.5x factor) and
air cover matter much more. The landing battle itself is fought ashore with land HP (unchanged).
