**City lots round 3 is done and has passed its final review, and the honest pasted-on check is done. The sheets are above, and nothing is merged.** Each sheet shows the approved look before lots on the left and round 3 on the right, with the same camera and hour.

Pictures:
- Round 3: `shots/2026-11-27/city-lots-r3/`
- Pasted-on check: `shots/2026-11-27/pasted-on-check/`
- Bunker options: `shots/2026-11-27/bunker-options/`

**City lots round 3: what you asked for**
- **Roads round the HQ:** the HQ stands in its own small park with a ring road round it. Roads that meet it go round and carry on, and town streets end on the ring. In Berlin, the road from the south now runs along the front of the park and joins the north-east road. Before, it ended in a little hook on the lawn (close-up: `01-berlin-join`).
- **No lot outline:** no fence or frame on any lot. Lawns are uneven ovals with clumps of trees.
- **Closer to the core:** across all 714 towns, the Army Base, Recruiting Office, Arms Industry, Silo and Airbase all moved nearer the centre. In Berlin:
  - Army Base: 67 → 56 km
  - Recruiting Office: 98 → 54 km
  - Airbase: 114 → 81 km
- **Airbase:** at the edge of town on open ground, off the highways. Airbases standing over a road dropped from 58 to 2 of 714 towns.
- **Naval Yard:** on the water.
- **Phone:** panning and zooming are as fast as last round. Building a town from scratch takes about 190 ms instead of 120 ms.

**Open points (polish rounds used: 2 of 2)**
1. **A small hop at game start:** the capital's HQ jumps 4.6 px once, when its town's lots finish about a third of a second after the start. The fix is to finish the player's capital first, a one-time pause of about 0.2 s. My view: worth fixing at merge time.
2. **Night lights check:** one zoom level is 3 points over its limit (236 against 230). It comes from buildings standing in new spots, not from the lights. My view: accept.
3. **Manila:** a single road reaching the HQ with no other road nearby now leads up to the HQ's front.
4. **Small nits:** Paris has small kinks where roads join the ring, Tokyo's ring stops at its bay shore, and in Riyadh the ring runs under the Arms Industry.

**The pasted-on check: honest answer, yes, they still look pasted on.** A reviewer who hadn't seen the job's reports looked at five towns, by day and night, on phone and desktop:
- **Ground pad: yes.** Five of the eight building types have a pad baked into the picture file. The Airbase brings a green slab even onto Riyadh's desert, and the Bunker, Silo I, Army Base I and Arms I bring diamonds or rims. The Recruiting Office and HQ have none. Sheet point1 shows the files themselves on magenta.
- **Light and angle: partly.** By day the light direction matches. But every picture is a corner view drawn as a diamond, while the town blocks are drawn from the south, nearly from above. At night the blocks go near-black while the pictures only turn blue-grey.
- **Detail: yes.** They're photo-like models next to flat, plain blocks, and at mid zoom that turns into speckle.

**What that means:** the cause is in the pictures, so the map code can't fix it alone. Two cheap code-only fixes would help a little, with no picture spend: darken the pictures properly at night, and drop any frame left round them.

The proper fix is new building pictures with no pad, a flat look like the blocks, and the camera from the south. The test picture is one Army Base level I, from the prompt in the check. It costs about $0.04 as a batch, or about $0.08 directly plus about $0.002 for its check. If you like the direction, it would later apply to about 40 building pictures plus the construction stages, and I'd price that before doing anything.

**Bunker options:** the 18 November sheets are now on the shots branch for you to pick from. That covers A, B and C at levels 1 and 5, the map previews, today's look, and the C version without its box. Today's game uses C version 1.

**Started:** the province buildings and hospitals job, in the slot that freed up. It's proposals only, then it waits for you.

**Questions** (my default in brackets)
1. OK to make the single Army Base test picture (about $0.04 batch)? (yes)
2. The two code-only fixes (proper night darkening, no frame)? (yes, as a small follow-up at merge time)
3. The game-start hop: finish the player's capital first? (yes)
4. Night lights check 236 against 230: accept? (yes)
5. Manila's lone road leading to the HQ's front: OK? (yes)
6. Merge cities-redo now, as it is, with the revert put back? Or wait for the new building pictures? (merge now; the pictures follow as their own job)

---
Pictures: `shots/2026-11-27/city-lots-r3/`, `shots/2026-11-27/pasted-on-check/`, `shots/2026-11-27/bunker-options/`
