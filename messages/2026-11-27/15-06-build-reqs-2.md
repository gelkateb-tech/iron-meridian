**Naval Yard follow-up done, on branch `build-reqs`. An independent recheck of both rounds says READY. Nothing is merged.** The screens above show before on the left and after on the right, phone and desktop.

Pictures: `shots/2026-11-27/build-reqs-2/`

**Naval Yard, as you gave it**

| Level | Before | After |
|---|---|---|
| I | Frigate, Attack Submarine | Frigate (+ Corvette slot) |
| II | Cruiser, Aircraft Carrier | no new units (+ Destroyer slot) |
| III | – | Cruiser, Attack Submarine |
| IV | 10% faster | 10% faster |
| V | 20% faster | Aircraft Carrier, 20% faster (+ Ballistic Missile Submarine slot) |

- **Wording:** every reason now reads "Needs Army Base II", "Needs Naval Yard III" and so on. A missing Airbase or Naval Yard still says "Build a … first". For Army Base level I I chose "Needs Army Base I"; tell me if you'd prefer "Build an Army Base first".
- **Old saves:** nothing in them changes. Ships already queued in a yard that's now too low still finish; only new orders need the new level. You get one message about it.
- **The recheck** also confirmed round 1's fix: at war the computer now builds Army Base III, so it fields SAMs and Jammers again.

**The computer:** with a plain upgrade rule, no Naval Yard reached level III in 60 days, so no submarines got built. Now its main yard saves up for its next level, as the Airbase does:
- By day 60, 44–46 cities have a yard III. Cruisers are actually built now: 13–14, against 0–4 on master.
- Submarines reach about 80% of the old count by day 60, but arrive later.
- **The cost:** about 8% fewer units on the map at day 30 while it saves, and about 1% fewer at day 60.
- **Carriers:** still none by day 60, same as master, because nobody can afford a yard V that early. I added a capped carrier pick (one per nation, two for big navies), so a yard V gets used once built.

**Checks:** all pass, including this job's own test (392 checks) and old saves. The same-seed test file was re-recorded, because new games carry the yard flag and the computer's ship picks change from day 6. The waypoint, position-dot and counter-spacing checks fail as they do on master; that's the waypoints job's area.

**Questions** (my default in brackets)
1. "Needs Army Base I" for level I, or "Build an Army Base first"? (Needs Army Base I)
2. OK that the computer has about 8% fewer units at day 30 while it saves for yards? (yes)
3. Merge build requirements now, both rounds? (yes, once waypoints merges, since they share a test area)

**Slots:** this job's slot went to the unit picture pricing, which spends nothing; you'll get the exact price per batch. Still running: waypoints, combat display, simpler buildings and the one-figure test.

---
Pictures: `shots/2026-11-27/build-reqs-2/`
