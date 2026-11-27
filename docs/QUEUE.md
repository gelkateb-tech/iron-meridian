# Iron Meridian task list

Kept up to date as tasks start and finish. Everything goes to the **Dev Build** first
(https://claude.ai/artifact/EKDR7pckn3hPkoJVuxoe7R); the public build changes only when the owner says "move to public".

**Rules for running jobs (owner, 2026-11-11 and 2026-11-13):**
- **Models:** Opus for big features and design, Sonnet for routine work, no new Fable tasks unless the owner says so.
- **Limits (owner, 2026-11-18):** at most 5 jobs at once, and only jobs that don't touch the same files or systems run together (for example map and cities wait for each other); overlapping jobs wait in the queue. (Was 2 to 3.) Small tasks get one pass; big ones one review and at most one repair.
- **Merging (2026-11-13):** every finished task is merged into master and published to the Dev Build as soon as its tests pass and it doesn't break the map, then the owner is told what changed. Only real design choices stop and wait for the owner. Map jobs merge one at a time.
- **Pause is not cancel (owner, 2026-11-21):** a pause or stop click from the owner never cancels a job; only "cancel" plus the job's name does. Paused jobs are resumed from where they stopped.
- **Old phones are not a target (owner, 2026-11-21, verbatim):** "we dont want to focus on bad phones becasue these players probably wont spend anyway". No work aimed at old or low-end phones; keep things fast on ordinary modern phones and desktops.
- **Screenshots to the shots branch (owner, 2026-11-26, verbatim):** "Standing rule for screenshots: every screenshot or sheet you send me, also save to the repo so I can review it in my other Claude chat. - Put them on a separate branch called "shots", never on master and never merged. - One folder per day and job, e.g. shots/2026-11-26/rebels/berlin-before.jpg. - Save them as JPG, at most 1600 px wide, so the repo stays small. - In each message to me, name the folder. - Clean up automatically: keep only the last 14 days, and rewrite the branch when you remove old ones so they don't pile up in the history." Done with `python3 -I tools/push-shots.py <date> <job> <files...>` (worktree /home/user/iron-meridian-shots, orphan branch shots; prunes and squashes past 14 days).
- **Messages to the shots branch (owner, 2026-11-26, verbatim):** "Standing rule: every message you send me, also save word for word to the shots branch, in a separate top-level folder: messages/<date>/<HH-MM>-<job>.md, one file per message, with the folder names of any pictures it refers to. Keep the picture folders (shots/<date>/<job>/) pictures only. Same 14-day cleanup for both." Done with `python3 -I tools/push-shots.py --msg <date> <HH-MM> <job> <file.md> --pics <folders>` (times UTC), before the message is sent.
- **New messages never cancel running jobs (owner, 2026-11-19):** a new message from the owner never cancels or replaces a running job unless the owner says "cancel" or "stop" with the job's name. Each new block is extra work added to the queue. If a message seems to change a running job, ask the owner before stopping it. Every job brief quotes the owner's request it comes from, so a worker never mistakes a newer, unrelated message for its own task.

Last updated: 2026-11-27 (owner answered build requirements: BUILD-REQS 2 takes the next free slot; NEW SHIPS proposal queued; 5 of 5 running).

## Pace (owner, 2026-11-18, after the usage reset)

"Pace it so the week lasts: at most 2–3 jobs at once [raised to 5 non-overlapping jobs on 2026-11-18], Sonnet for anything routine, and Opus only for the big ones (MAP-2, the doctrines plan, the upgrades review, the research rebuild, cities, bunker and rebels). Anything that needs my decision goes under 'Waiting on me', and carry on with other jobs meanwhile."
Gemini: log every batch with the running total since the top-up; stop and ask if new spending passes $12. Art: follow docs/ART-BIBLE.md (standing rule: before fixing or redoing any picture, show the owner the problem and ask permission first).

## Running

| Job | What | Model | Branch |
|---|---|---|---|
| **CITY BUILDING LOTS** (2026-11-25, on cities-redo; the cities merge of 2026-11-25 was reverted on master, a4fbeb0, at the owner's request) | **Brief now Part A of the owner notes of 2026-11-25 (below, verbatim: A1-A7 and the sheets with no buildings, all built, one under construction), which replaces the earlier text.** Earlier, verbatim: "CITIES redo (branch cities-redo): I like it, don't change the look. One problem before merging: the capital HQ and every building I build (Army Base, Airbase, Naval Yard, Bunker, etc.) sits on top of the city blocks like a sticky note. Fix it so they look built into the city: 1. Fixed building lots: every city reserves a lot for each building type in its street plan. The city blocks never cover those lots, and roads lead to them. 2. The HQ sits in the centre on a city square. The Army Base and Bunker go near the centre. The Airbase goes at the edge of town on open ground. The Naval Yard goes on the waterfront. 3. Before a building exists, its lot shows as normal city ground (a small park or open square). While it's being built, show the crane and scaffolding on that lot. 4. The lot is part of the city's ground (paving, grass, a fence line). It's not a slab under the picture, so my no-slab rule still holds. 5. Draw city blocks and building pictures in one depth order, so a block in front of a building covers it and a block behind it sits behind. Same light direction and shadows for both. Show me Berlin, Hamburg and Kolkata at play zoom and closest zoom, before and after, with all buildings built and with one under construction. Don't merge until I've seen them." **Owner re-sent the brief (2026-11-25) with two more points and an extra sheet case, verbatim:** "6. Make the built buildings smaller so they match the city's scale: only a little bigger than the biggest normal city buildings, like a landmark that stands out but fits in. Players tap the city, not the building, so they don't need to be big. 7. The city grows around what's built: when a building finishes, and again as it levels up, the area around it changes to fit. New access roads, a few extra city blocks and greenery around it, so the city looks like it grew around the building. Only redraw that one city when this happens, to keep it fast. Show me Berlin, Hamburg and Kolkata at play zoom and closest zoom, before and after, with no buildings, with all buildings built, and with one under construction." The running round (points 1-5) was not stopped (standing rule); points 6-7 and the no-buildings sheets run as a follow-up round on cities-redo as soon as it finishes, then the owner sees the sheets. **2026-11-26:** points 1-5 done on cities-redo 7f463c8 (2 polish rounds used); sheets sent to the owner (Berlin, Hamburg, Kolkata, lots overview, Hamburg close-up). Open: Hamburg's buildings stand on grass east of town with no street; 34 lots in 13 towns still use the old cluster; mid zoom hex 50-60. **Follow-up job CITY LOTS GROW running (wf_1078e43c-aa0):** points 6-7 plus the Hamburg fix, at most 2 polish rounds, new sheets incl. a growth sequence and a phone frame. Build, look and tech critique, repair, two rechecks. Keeps the city centre point free for UNITS IN CITIES. **Not merged until the owner has seen the sheets.** | Opus | cities-redo |
| **MISSILES POLISH 2** (2026-11-27; owner: MS1-MS5 defaults, desktop aiming hint, Damaged on the strip) | 2nd and last round on missiles (wf_e32019ba-0b1), independent recheck | Opus | missiles |
| **COMBAT DISPLAY** (2026-11-27, owner verbatim in the block above) | one round (wf_c13e2fdc-fb1): today's timing explained, fixed tick proposed only; Fighting + enemy, countdown, damage readout on panel and map label; desktop and phone shots, a clip | Opus | combat-display |
| **PINPOINT-3** (2026-11-27 playtest item 1, verbatim above) | find what broke waypoints again and why the earlier fix didn't hold; fix land, ships, waypoints; guard test in the standard checks; independent verify (wf_b440f18a-f9b) | Opus | pinpoint-3 |
| **FIGHTER-ASF** (2026-11-27 playtest item 2) | button list vs strike fighter, Attack order on proposed numbers (owner OKs before merge), calm racetrack patrol with 15 s clip, patrolling aircraft tappable at every zoom; look and rules critics (wf_503da938-700) | Opus | fighter-asf |
| **START-ARMIES + RECON** (2026-11-27 playtest items 3-4) | new start for every nation, city rule, AI adjust, balance and headless checks, sheets for Russia, Germany and a small nation; recon vehicle proposal only (stats, research, pictures, Gemini cost; no spend) (wf_09f62ac2-e69) | Opus | start-armies |

## Next free slots (in this order)

**FIRST at the next free slot: BUILD-REQS 2** (build-reqs; Opus; owner 2026-11-27, verbatim: "Build requirements: yes to 2, 3 and 4. 1. Naval Yard: use these levels instead of your table: - Level 1: Corvette, Frigate - Level 2: Destroyer - Level 3: Cruiser, Attack Submarine - Level 4: no new units, builds faster - Level 5: Aircraft Carrier, Ballistic Missile Submarine, builds faster still. Corvette, Destroyer and Ballistic Missile Submarine don't exist yet, so give them marked slots, like the recon vehicle. Build the rest now."): Naval Yard I Frigate, III Cruiser and Attack Submarine, V Aircraft Carrier, marked slots for Corvette (I), Destroyer (II), Ballistic Missile Submarine (V); the computer's Naval Yard upgrades to match; "Needs Army Base II" wording like the other bases (answer 4); answers 2 and 3 as built; the independent recheck of the round-1 repair (Army Base III at war) that was promised; checks and before/after screens.

**FIRST, when CITY LOTS 3 (round 3 and the pasted-on check) has finished, before the list below:** PROVINCE BUILDINGS AND HOSPITALS (Opus; proposals first, one round, then wait; takes the slot city lots frees, as its own job). Owner 2026-11-27, verbatim:

```
QUEUE THIS: don't start until the city lots job (round 3 and the pasted-on check) has finished. Then run it on its own. Don't cancel or change any running job.

Province buildings and hospitals (proposals first, then wait for my OK; one round only):

1. RULE: a building in a province must never look the same as its city version. Province versions are plainer and lower-key. Add this rule to docs/ART-BIBLE.md.

2. RECRUITING OFFICE: cities only. Remove it from provinces, and tell me what happens to ones already built there.

3. BUNKER:
- Save the bunker art option sheets from 2026-11-18 (A, B, C, levels 1 and 5, with map previews) to the shots branch so I can pick one.
- Propose a separate, plainer province Bunker (like sandbags and a dugout) that's different from the city one.

4. CITY HOSPITAL (city building, levels 1–5):
- Use the 5 hospital pictures we already have.
- Heals armies in or next to the city faster, more at each level.
- Add one Hospital lot to the city lots plan. Leave every other lot as it is.

5. FIELD HOSPITAL (any province, levels 1–3):
- Low-key look: a small tent with a red cross, much plainer than the city Hospital, growing slightly with each level.
- Heals armies in that province, less than a city Hospital, more at each level.

For the hospitals: propose cost, build time and healing amounts, and how they stack with the healing research. The computer should build them sensibly. Any new pictures: tell me the Gemini cost and wait for my OK. Screenshots on desktop and phone, saved to the shots branch as usual.
```
Notes: the 2026-11-18 bunker option sheets are in docs/bunker-options (bunker-art branch). The Hospital lot is added on cities-redo, so this job waits for city lots to finish.

Set 2026-11-27 (owner block above). Each starts when a slot frees up (at most 5 at once):
1. **UNIT-ART-3 FINISH** (unit-art-3; Opus): the sets that stopped at the floor (AWACS, Stealth Bomber, Marines, the 5 uniques; about $3.6 by the 2026-11-19 estimate, to be re-priced exactly). Cost of each batch to the owner first, run only on the OK. Not merged until the owner has seen it (and the open unit-art-3 decisions stand). Then the RECON VEHICLE pictures once the owner OKs its proposal (start-armies job).
2. **MISSILES POLISH 2** (missiles; Opus; 2nd and last round): MS1 (the computer answers chemical with chemical; nuclear answers only for nuclear strikes or desperation), MS2 (Conventional Warhead researched readily at war), the desktop aiming hint clear of the mini world map, the strip says "Damaged" for a knocked-out silo; MS3-MS5 stay as built. Missiles plan 2 (ranges, HP, names) is a separate build job once the owner answers its questions 1-8.
3. **COMBAT DISPLAY** (one round, then wait; Opus): first tell the owner how combat timing works now; then "Fighting" plus the enemy army on panel and map label, a countdown to the next damage tick on both, the damage each side took after each tick; the fixed-tick change itself only as described to the owner. Desktop and phone screenshots.
4. **ONE FIGURE PER ARMY TEST** (own branch; Opus): one main-unit model per army with our bigger count badge, smooth turning along roads, moving/fighting/idle animations; side-by-side one figure vs three, in a fight and on a road; wait for the owner's pick.
5. **LOGISTICS BUILDING PROPOSAL** (proposal only; Opus): any province, no levels, +25% move speed through it, thicker roads to show it, cost, build time, stacking with roads and the stack-size penalty, computer use along main routes and borders; wait for the OK.

6. **NEW SHIPS PROPOSAL** (Opus; proposal only, then wait; owner 2026-11-27, verbatim: "NEW SHIPS (queue as its own job, Opus, proposal only, then wait for my OK): Add three ships. Surface ships go Corvette, Frigate, Destroyer, Cruiser, small to big. Submarines are the Attack Submarine and the Ballistic Missile Submarine. Carriers stay. - Corvette: small, cheap, fast coastal ship for patrol and anti-submarine work. - Destroyer: between the Frigate and the Cruiser. - Ballistic Missile Submarine: nuclear sub that carries and fires missiles (cruise, ballistic and nuclear) from the sea, like Conflict of Nations. Its nukes count inside the nation's nuke limit from missiles plan 2. This is the "ships later" answer to plan 2 question 5 (USA, Japan, Australia, Brazil). - Propose stats, cost, build time, research lines and how the computer uses them. Show them next to our 4 current ships, so each ship has a clear job. - Pictures: today the Frigate uses the corvette picture and the Cruiser uses the destroyer picture. Tell me which pictures to move and which new ones we need, with the Gemini cost. Don't spend credit without my OK.")


- **REBELS PICTURES** (owner 2026-11-26, verbatim: "REBELS unit picture: rebels need their own unit pictures like every other unit, instead of the code-drawn 3D figure. - Make the same set as the other units: the 3/4 side view for the info card, the card scene, and the top-down picture for the map. Same camera, size, light and framing as the other unit sets, following ART-BIBLE.md and docs/UNIT-LOOKS-PROMPTS.md. - The look: a small group of irregular fighters in mixed civilian and military clothes, scarves and headwraps, carrying generic rifles (no real brand designs), tan and khaki tones, with a small crossed-rifles flag to match the rebels badge. Make it clearly different from regular infantry and from the Export armed pickup. - Show me the prompt first, then one test picture with its cost, and wait for my OK before making the rest. - Save the pictures to the shots branch as usual."): prompts in tools/gen-art.py (ul-reb-side/scene/top); test side view made (about $0.105, check PASS), sent with the prompt (shots/2026-11-26/rebels-pictures/). **Waiting for the owner's OK** (and on the rifle wording) before the scene and top-down. Art balance: the owner's real figure is $24.05 (2026-11-27); $5 floor kept.

- **PASTED-ON CHECK** (owner 2026-11-26, verbatim: "After A6, tell me honestly whether the building pictures still look pasted on: their own ground pad, a different light direction or angle from the city blocks, or too much detail next to them. Don't redraw anything. If you think they need it, show me the problem and a single Army Base test picture with the cost, and wait for my OK."): runs when CITY LOTS GROW finishes. An independent look critic that has not seen the job's reports, plus my own look at full size, on the three points (ground pad, light and angle, detail). Only if they need it: one Army Base test picture, cost logged against the $5 floor, then wait for the owner's OK. No other picture is redrawn.

1. **(DONE 2026-11-22, waiting for the owner; see Ready)** **CITIES REDO, together with the CITIES follow-up** (Opus; owner 2026-11-21; started when SEA MIX and JUNGLE C REWORK finished, because map and cities wait for each other). Owner, verbatim: "CITIES redo (Opus). Branch cities-3d-2 isn't good enough, so don't merge it. Do this together with the CITIES follow-up already in the queue. Reference attached: Conflict of Nations, Mazar-i-Sharif zoomed in. Use it only for how the 3D buildings pop. Don't copy its look or its green tint. What's wrong now: each city is a flat pale slab floating on the map with a tiny, uniform block grid on top. You can't see any buildings. Keep: - Each city's outline exactly as it is now. - The realistic look and colours I like. No owner-colour tint over the whole city. Change: 1. Make the buildings pop: real 3D buildings you can see at normal play zoom, each with a lit roof, shaded sides and a shadow on the ground. Tall towers in the centre, low buildings at the edges, mixed sizes and shapes. 2. No slab or plate under the city. The ground between buildings is normal terrain, and the edge blends into the land around it. 3. Greenery in every city: clumps of trees, parks and tree-lined streets between the buildings. 4. Every city should look different: vary the road layouts. Curved, organic streets in old cities (Kabul, Damascus), grids only where they make sense (US cities), ring roads and big avenues in capitals. The main map roads connect into the city. Not the same grid everywhere. 5. Keep the night lights, with lit windows in the buildings. 6. It must stay fast on phones: draw each city once per zoom and cache it. Show me Berlin, Kabul and a small town at play zoom and at the closest zoom, before and after, before anything merges." Reference picture: scratchpad cities-ref/con-mazar.webp. Follow-up parts still open (check what naval cities v65 already did): building pictures on land and 15-20% smaller, the Naval Yard on the real coast at Kolkata, a building under construction; keep the night lights. Branch from master (not cities-3d-2).


## Owner block 2026-11-27 (missiles answers, Gemini credit, combat display, one figure per army, logistics; verbatim; extra work, cancels nothing)

```
Missiles answers (these didn't reach you earlier):
- MS1–MS5: your defaults.
- Ranges: no separate answer needed, missiles plan 2 covers them.
- Two small fixes for the missiles branch: move the aiming hint so the mini world map doesn't hide it on desktop, and make the missile strip say "Damaged" instead of "Ready" for a knocked-out silo.

Gemini credit: my real balance is $24.05, not $5.32. Your number is out of date, so check it again before deciding anything.
- Keep the $5 floor.
- When a slot frees up, finish the last unit picture sets that stopped at the floor, then the recon vehicle once I OK its proposal.
- Tell me the cost before each batch and wait for my OK.

Combat display (one round only, then wait for me):
Make fights read like Conflict of Nations:
- Damage lands on a fixed tick, like CoN's hourly round. Tell me how combat timing works now before changing it.
- While two armies fight, each army's panel and map label shows "Fighting" plus the enemy army it's fighting.
- Show a countdown to the next damage tick, both in the panel and on the map label.
- After each tick, briefly show the damage each side took.

One figure per army (test first, on its own branch):
- Show one model per army on the map: its main unit, like CoN, instead of three figures. Keep our bigger unit-count badge.
- The figure turns smoothly to follow roads and bends, and has moving, fighting and idle animations.
- Show me a side-by-side of one figure vs the current three, in a fight and on a road, then wait for my pick.

Logistics building (proposal first):
- A new building that can be built in any province, not just cities. No levels: one building per province.
- Armies move 25% faster through a province that has it.
- To show it's built: the roads in that province get thicker, like Conflict of Nations does it. No extra model on the map.
- Propose cost, build time, and how it stacks with roads and the stack-size speed penalty, then wait for my OK.
- The computer should build it sensibly, mostly along its main routes and borders.

Show me screenshots on desktop and phone, saved to the shots branch as usual.
```

**Art balance (2026-11-27):** the owner's real balance is **$24.05** (my $5.32 was an estimate from per-branch logs and was out of date). $5 floor kept: about $19.05 can be spent, each batch's cost shown to the owner first and run only on the OK. The art job re-baselines tools/gen-art.py's guard to $24.05 at its branch's current log totals before any call.

## Owner playtest changes 2026-11-27 (Thanksgiving; verbatim; extra work, cancels nothing)

```
Playtest changes (Thanksgiving, Dev Build). Extra work: cancels nothing in docs/QUEUE.md. Opus. Check docs/QUEUE.md and the open branches first so nothing is fixed twice. Save screenshots, clips and your messages to the shots branch as usual. Don't merge until I've seen them.

1. WAYPOINTS: setting a waypoint still moves the army to the centre of the province, not the exact spot I tapped. This is the third time pinpoint movement has broken. Find which change broke it again and why the earlier fix didn't hold, fix it for land units, ships and waypoints, and add a test to the standard checks so it can't silently break again.

2. AIR SUPERIORITY FIGHTER (the one every capital starts with):
   a. It has no Attack button. Add an Attack order. Its main job stays fighting aircraft, but it can also hit ground units, with weak damage (much less than a strike fighter). Propose the numbers and show me before changing them.
   b. Its unit panel is missing buttons compared with the other aircraft. List what it has now next to what a strike fighter has, and add the missing ones that make sense.
   c. Patrol looks fake: the plane races around the very edge of its patrol circle, much too fast. Make it fly a calm, realistic patrol: a slow, wide racetrack or loop inside the area at a believable speed, turning smoothly. Show me a 15-second clip that starts on the map, zoomed in, with no menus.
   d. Once it's on patrol I can't tap it to select it again. Make patrolling aircraft tappable at every zoom, with the same unit panel as any selected unit.

3. STARTING ARMIES (same for every nation, players and computer alike). Right now Russia starts with 8 units in Moscow, which is too many. Change it to:
   - Capital: 2 infantry, 1 artillery, plus the air superiority fighter at its Airbase.
   - Two more stacks, each in a different city outside the capital: 1 recon vehicle + 2 infantry each. Pick the cities that make sense (e.g. towards the borders or main roads) and tell me your rule for choosing them.
   - No tanks at the start.

4. RECON VEHICLE (new unit if it doesn't exist yet):
   - Its job is scouting: anything inside its sight range is fully identified, so I see exactly which units are in each enemy army there (types and counts), not just "unidentified". Other ground units only see that something is there, as in my fog-of-war rule.
   - Keep it realistic: sight range only a little more than infantry, nothing crazy. Fast, lightly armed, weak in a fight.
   - If it doesn't exist yet, propose its stats, research line and which pictures it needs, with the Gemini cost, before adding it. Don't spend Gemini credit without my OK.

Run the balance and headless checks and show me the starting setup for Russia, Germany and a small nation before merging.
```

Jobs from it (Opus, at most 2 polish rounds each, none merged until the owner has seen them): PINPOINT-3 (item 1), FIGHTER-ASF (item 2; Attack numbers built on the branch as proposed, owner OKs them before merge), START-ARMIES (item 3; the outer stacks' recon slot stays empty until the owner OKs the recon vehicle) with the RECON VEHICLE proposal (item 4; proposal only, no Gemini spend).

## Owner answers 2026-11-26 (verbatim; extra work, cancels nothing)

> Answers:
> - R1–R17 (rebels plan): all your suggested answers, OK. Start REBELS.
> - M1–M15 (missiles plan): all OK, except M13: send me the gas and radiation zone mockup first.
> - D4–D13, K1–K8, U1–U4, E1–E8, F1–F6: all your defaults, except D10: fix it, so a computer nation refuses deals where it gets nothing back.
> - Merge Market, Fog-clash and UI-fixes.
> - Merge auto-test/fixes (the playtest's 16 bug fixes) after re-running the checks on top of today's merges, and go with your defaults on Q1–Q31.
> - Keep the rules from before: at most 2 polish rounds per job, Sonnet for interface follow-ups.

Jobs from it: MERGE CHAIN (Market, then Fog-clash, then UI-fixes, then auto-test/fixes re-checked on top, then D10-FIX), REBELS (R1-R17 defaults; running), Q-DEFAULTS (Q1-Q31 defaults that need code, after the auto-test/fixes merge), MISSILES (after REBELS and the auto-test/fixes merge, per M14; M13 zones wait for the owner's look at the mockup). Rule kept: at most 2 polish rounds per job; Sonnet for interface follow-ups.

## Owner notes 2026-11-25 (verbatim; extra work, cancels nothing)

```
Two sets of changes from me. This is extra work: it cancels nothing in docs/QUEUE.md. Split it into jobs by area (max 5 at once, no overlapping files). Use Opus for the rule, economy and city changes and Sonnet for the small interface fixes. First check auto-test/fixes so nothing gets fixed twice. Anything visual: send me before/after screenshots before merging. Rule changes: run the balance and headless checks. If you already have my CITIES building-lots request from earlier tonight, this replaces it.

=== PART A: CITIES (branch cities-redo) ===
I like the new 3D cities, don't change the look. One problem before merging: the capital HQ and every building I build (Army Base, Airbase, Naval Yard, Bunker, etc.) sits on top of the city blocks like a sticky note. Fix it so they look built into the city:
A1. Fixed building lots: every city reserves a lot for each building type in its street plan. The city blocks never cover those lots, and roads lead to them.
A2. The HQ sits in the centre on a city square. The Army Base and Bunker go near the centre. The Airbase goes at the edge of town on open ground. The Naval Yard goes on the waterfront.
A3. Before a building exists, its lot shows as normal city ground (a small park or open square). While it's being built, show the crane and scaffolding on that lot.
A4. The lot is part of the city's ground (paving, grass, a fence line). It's not a slab under the picture, so my no-slab rule still holds.
A5. Draw city blocks and building pictures in one depth order, so a block in front of a building covers it and a block behind it sits behind. Same light direction and shadows for both.
A6. Make the built buildings smaller to match the city's scale: only a little bigger than the biggest normal city buildings, like a landmark that stands out but fits in. Players tap the city, not the building, so they don't need to be big.
A7. The city grows around what's built: when a building finishes, and again as it levels up, the area around it changes to fit, with new access roads, a few extra city blocks and greenery. Only redraw that one city when this happens, to keep it fast.
Show me Berlin, Hamburg and Kolkata at play zoom and closest zoom, before and after, with no buildings, with all buildings built, and with one under construction. Don't merge until I've seen them.

=== PART B: PLAYTEST NOTES (14 points) ===

BUGS
1. Enemy units pass each other without fighting. They should meet and fight.
2. Fog of war: enemy armies outside my territory still show as "unidentified". They shouldn't show at all. I only see them once they cross into my land, or when one of my units sees them within its sight range (infantry sees only up close; a fighter on patrol sees much further).
3. Research tree: the infantry picture doesn't fit inside its research icon. Fit it properly, like the other units.
4. The Build button is grey even when I can afford it, so it looks like I can't build. Make it blue when I can afford it, and grey only when I can't.

START OF GAME
5. Every capital starts with a level 1 Airbase already built and one air superiority fighter based there (on top of its Fortifications), so every nation can patrol and scout from day one. The same goes for computer nations.

ECONOMY
6. The level 1 Army Base costs too much: on day one I can only afford it in 5 cities. Make it cheaper so I can build one in every city, and an Arms Industry in any city. I should also be able to afford the infantry research on day one. The level 1 Army Base builds in 30 minutes instead of 20 hours.
7. Mobilization queue: free players lose it (one unit at a time per city). It becomes a paid membership feature. Add a membership on/off flag with a dev toggle so I can test both. Don't build any payment system yet.

OCCUPATION, MORALE AND REBELS: copy Conflict of Nations' system and numbers exactly.
8. Annexing: an occupied city gives 25% of its resources and can't mobilize units. Annexing raises it to 50% and lets it mobilize. Annexing is built like a building from the city's build list ("Annex City"), with a high cost (money and manpower, more for bigger cities) and a build time. Propose the cost and time and show me before building. I can start it any time, even while the city is burning. If the city is captured, it loses its annexed status. If I have troops in the city, rebels attack them, the city stays mine, my troops get the +25% dug-in city bonus and the annexing carries on. If the city is empty and rebels take it, I lose the city, the annexing and its cost.
9. Morale:
   - Every city and province starts the game at 70%. A newly occupied city or province drops to 25%; a liberated homeland one to 55%.
   - At every day change, morale moves toward its target by (target − current) ÷ 8.
   - Base targets: homeland cities 90%, annexed cities 75%, occupied cities 60%, countryside provinces 100%.
   - Modifiers on the target:
     - Distance to the capital: −5 per unit of distance, rounded. Propose how distance is measured and show me.
     - Wars: −2 per nation I'm at war with, rebels included, nations with 0 VP not counted, max −25.
     - Enemy neighbours: −5 per adjacent province held by a nation I'm at war with.
     - Enemy units in the province: −1.
     - Low-morale neighbours (my adjacent provinces at 40% or less): −7 each for a city, −4 each for a countryside province.
     - High-morale neighbours (my adjacent provinces at 100%): +3 each for a city, +1 each for a countryside province.
     - Resource shortage (any resource short with negative production): up to −50.
     - Civilian casualties: up to −30, shrinking by a third each day.
     - Capital lost: −20 on every province's target.
     - The capital city itself: +25.
     - Bunker level 1–5: +5 / +10 / +20 / +35 / +50.
   - Show the target and every modifier in the city panel, as a morale factors list.
   - Keep today's link between morale and output.
   This replaces today's unrest system, plus the daily per-unit changes and "integration" in docs/REBELS-PLAN.md.
10. Rebels:
   - A city at 33% morale or lower can rebel, and shows a burning fire-and-smoke animation. Above 33%, the fire goes out and the risk is gone. Countryside never rebels. The fire must stay light on phones.
   - Check once a day at the day change. The chance rises from 0% at 33% morale to 50% at 25%, and higher below that. Troops in the city lower the chance: propose how much and show me.
   - Rebels attack any troops in the city in a real fight, with my troops getting the +25% dug-in city bonus. If the city is empty, rebels take it.
   - Keep the rest of the rebels plan (crossed-rifles badge, rebels as their own side).
11. Occupying a country I trade with should hurt my economy: I lose that trade, on top of the morale drop. The occupied cities stay weak until their morale recovers, and after that, holding and annexing them pays off. The difference between occupying a trade partner and a non-trade partner should be clearly noticeable.

MISSILES
12. The Missile Silo needs Conventional Warhead researched first. Cruise missiles don't. Add chemical and nuclear warheads as new missile units in research. Start from the weapons table in docs/RESEARCH.md 12.5 and write the plan first: research days, costs, effects, limits, and how they show on the map. Show me before building.

INTERFACE
13. Market rework: for each material, show the top 3 sellers and the top 3 buyers.
14. Diplomacy has too many buttons. Simplify it: show me 2–3 layout options before changing anything.

Points 8 to 10 replace parts of the REBELS job, which still hasn't started. Run REBELS next and build them together with it.

Log any questions in docs/QUESTIONS.md and keep going.
```

Jobs from these notes (split by area, at most 5 at once): CITY BUILDING LOTS (Part A, running), FOG-CLASH (B1-B2, running), ECON-START (B5-B7, running), PROPOSALS (B8-B11 plan, B12 plan, B14 layout options; docs and mockups only, running), UI-FIXES (B3, B4, B13; Sonnet; queued, starts when UNITS IN CITIES finishes), then REBELS (B8-B10 built with the REBELS job once the owner OKs the proposals; B11 with it), MISSILES (after the owner OKs the plan), DIPLOMACY (owner sent a reference layout instead of picking an option: built to it, queued after UI-FIXES).

## Owner notes 2026-11-25, Diplomacy (verbatim; replaces point 14's "show me 2–3 layout options"; extra work, cancels nothing)

```
Point 14, Diplomacy: here's the reference you asked for (4 Conflict of Nations screenshots attached: the list, a real player's page, the conversation screen, and a computer nation's page). Match this layout instead of making 2–3 options. Style only: no copying their art, names or icons. Build everything now, even though online play isn't live yet; it works with computer nations today and real players later.

LIST SCREEN
- Header "DIPLOMACY" with the red close button. Three tabs: Information, Coalitions, Messages & Trades.
- Under the tabs: a Sort dropdown (default: Points), a direction toggle and a Search button.
- One row per nation, sorted by points: big flag on the left, then "COUNTRY | player or leader name" in bold, a trophy with their victory points, a city icon with how many cities they hold, and their coalition's emblem and name if they're in one.
- On the right of each row, two relation diamonds: "their" (how they treat me) and "your" (how I treat them). Each of our relations gets its own colour and icon: war, ceasefire, peace, non-aggression pact (NAP), right of way, and shared-intel alliance.
- No other buttons on the rows. Tapping a row opens that nation's page.

NATION PAGE: two versions
Both versions:
- Back button, title "ABOUT PLAYER", close button.
- Big flag with a "Progress towards victory" bar and percentage.
- "Their relation ⇄ Your relation" diamonds with a dropdown arrow. Tapping mine opens the menu to change it: declare war, offer peace or ceasefire, Offer NAP (20 days), ask for right of way, propose an alliance, embargo. Keep the current rules and the treaty-breaker warning.
- Stats list: Provinces, Average Morale, Victory Points, Capital, Known Army Size (shows "Unknown" unless my scouts or spies have seen their forces, matching the fog-of-war rule), and At War With (a list of nations, rebels included; empty if none).
A) Nation played by a real player:
- The player's name with an Add Friend button, and their motto under it.
- Buttons beside the flag: Send Message, Player Profile, Mute Player.
B) Computer nation (not playable, or not taken by a real player):
- The nation's leader name instead of a player name, no motto. Invented leader names only, never real politicians.
- No Add Friend, Send Message, Player Profile or Mute buttons. Just one New Trade button beside the flag, so I can still trade with them and buy or sell territory.

CONVERSATION SCREEN (real players only: Send Message, or a conversation in the Messages & Trades tab)
- Header with the player's name over a faded flag, back button and close button.
- Empty state: "Create a new trade or type a message below to start this conversation."
- Messages and trade offers show as a chat history, newest at the bottom.
- At the bottom: a message box on the left, and on the right three buttons: Send Message, New Trade, Mute Player.
- Mute hides that player's messages and trade offers until I unmute.

TRADES (both real players and computer nations)
- New Trade opens a trade builder. Each side picks what it gives: money, any resource, cities and provinces (our territory selling stays, it's our big difference), and treaties (peace, NAP, right of way, alliance).
- Offers show Accept, Decline and Counter buttons. With a real player, the offer appears in the chat. With a computer nation, it answers with the AI's existing deal logic (accept, decline or counter, with a short reason) in the Messages & Trades tab.
- The Messages & Trades tab lists every conversation and trade, newest first, with unread counts.

KEEP WHAT'S OURS
- Keep every diplomacy action we already have, just moved into this layout: nothing gets removed.

Show me all screens on a 440 px phone before merging, including a computer nation's page and a real player's page.
```

## Owner notes 2026-11-25, Market (verbatim; replaces point 13's one line; extra work, cancels nothing)

```
Point 13, Market rework: reference attached (Conflict of Nations "Stock Market" screenshot). Match its layout, style only, and keep our price chart and seller flags.

LAYOUT
- Header "STOCK MARKET" with a chart-style banner and the red close button.
- A row of resource tabs under the header, one per tradable resource, using our resource icons.
- Each tab shows only the best 3 offers on each side:
  - BUY section: the 3 cheapest sell offers I can buy from. Each row has the resource icon, the amount in green (+4,000), the unit price with the money icon, and a green Buy button.
  - SELL section: the 3 highest buy offers I can sell to. Each row has the amount in red (−2,070), the unit price, and a yellow Sell button.
  - All other offers wait in line. When one of the top 3 is filled or cancelled, the next best moves up.
- Bottom buttons: Create Offer and Order Book. Order Book shows the full queue for that resource, plus my own open offers with a Cancel button.
- Prices in money only.

KEEP OURS
- The price chart: a slim chart at the top of each resource tab showing that resource's price over the whole game. Tap it to expand to full size.
- Seller and buyer flags on every offer row, so I can see who I'm trading with and avoid nations I'll fight later. Make the flags sleek, in the same style as the unit badges: the real flag with a light fabric sheen, a thin dark edge and a soft shadow, small and neat. Tapping a flag opens that nation's diplomacy page.

ALSO
- Make sure computer nations actually post buy and sell offers (the playtest found they sit on goods and never sell, IMP-2), so the market is never empty.

Show me each resource tab and the Order Book on a 440 px phone, before and after, before merging.
```

## Ready, waiting for the owner

| Job | State | Branch |
|---|---|---|
| **CITY LOTS 3** (2026-11-26; owner verbatim in docs/QUESTIONS.md "second set": roads curve round the HQ square, no visible lot outline, lots closer to the core, Airbase at the edge and off the highway, yard on the water) | DONE 2026-11-27: cities-redo 368bfc6 (round 3 + polish 2 of 2, recheck 2 READY): lots nearer the core, ring road round the HQ square that carries on, no lot outline or fence, Airbase at the edge off the highway, yards on water. Sheets shots/2026-11-27/city-lots-r3/. Open: night-lights cap mid 236 (limit 230), bld-zoom HQ 4.6 px hop at game start, Manila lone road, Paris/Tokyo/Riyadh ring nits. PASTED-ON CHECK: yes, still pasted on (pads baked into 5 of 8 types, corner view, far more detail; night not darkened); sheets shots/2026-11-27/pasted-on-check/; one Army Base test picture proposed (about $0.04 batch / $0.08 direct), waiting for the owner. Earlier: on cities-redo c09d832 (A6/A7 done, recheck 2 READY, sheets sent: shots/2026-11-26/city-lots-a6a7/); plus the independent PASTED-ON CHECK on c09d832 (honest yes/partly/no on ground pad, light/angle, detail; an Army Base test picture only if needed, then wait for the owner); at most 2 polish rounds | Opus | cities-redo |
| **PROVINCE BUILDINGS AND HOSPITALS** (2026-11-27, owner verbatim in "Next free slots") | DONE 2026-11-27: proposal docs/PROVINCE-HOSPITALS-PROPOSAL.md, art rule added to docs/ART-BIBLE.md (details marked waiting), 3 sheets sent (shots/2026-11-27/province-hospitals/), questions PH1-PH11; new pictures about $0.47 (at most $0.73), after the Army Base camera test verdict. Waiting for the owner. Earlier: proposals only, one round (wf_bc1e8df4-2c2): art rule text, Recruiting Office cities only, province Bunker, City Hospital with its lot, Field Hospital; costs, healing, Gemini costs, desktop/phone previews; bunker option sheets saved to shots/2026-11-27/bunker-options/ | Opus | none |
| **BUILD-REQS** (2026-11-27; owner verbatim: "Build requirements (one round only, then wait for me): 1. ARMY BASE levels (keep research days and costs): Level 1: Infantry, Motorized Infantry, Recon vehicle, Mobile Artillery; Level 2: Infantry Fighting Vehicle, Main Battle Tank, Mobile Anti-Air, Paratroopers, Swarm Drones; Level 3: Rocket Artillery, Mobile SAM, Special Forces, Mobile Jammer; Level 4: no new units, builds faster; Level 5: Missile Defence, builds faster still. There's no ground radar unit yet, so leave radar as it is. REMOVE Anti-Tank Infantry: take it out of research, build lists and the computer's choices. In old saves it turns into regular Infantry. 2. AIRBASE levels (keep research days and costs): Level 1: Recon UAV, Attack Helicopter, Air Superiority Fighter; Level 2: Strike Fighter, Strike Drone; Level 3: Maritime Patrol Aircraft, AWACS, Heavy Bomber; Level 4: no new units, builds faster; Level 5: Stealth Bomber, builds faster still. 3. NAVAL BASE: same idea. Spread the ships across levels 1-5 realistically (small ships low, carriers and submarines high), with levels 4 and 5 building faster. Show me the table before changing it. 4. BUILD SPEED: only levels 4 and 5 add build speed, on all three bases. Levels 1-3 just unlock units; the Recruiting Office stays the main way to speed up building. Make sure all three bases go up to level 5. Update the build lists, requirement text and the computer's build choices. Tell me what changed before and after.") | DONE 2026-11-27: build-reqs b8cba48 (b497842 build, bf6716c golden, b8cba48 repair: computer builds Army Base III at war). Owner's lists exact; speed only at IV (x0.9) and V (x0.8) on all three bases; Anti-Tank Infantry removed (old saves to Motorized Infantry, refunds); Naval Yard table proposed only (I Frigate, II Cruiser, III Submarine, V Carrier). Slots marked: rcn, maa (Mobile Anti-Air), mdef (Missile Defence) - those units don't exist. Open for the owner: fewer tanks and strike fighters, Special Forces never built by the computer, no anti-armour answer in cities (2 stack-duel city cases informational), the repair was not independently rechecked. Screens shots/2026-11-27/build-reqs/. Owner 2026-11-27: yes to 2, 3 and 4; Naval Yard levels given (BUILD-REQS 2, next free slot). Earlier: one round (wf_ca510132-1dc): study, build, independent verify, a repair pass only for bugs the build introduced; Naval Base unlocks a table only; Recon slot marked; then wait for the owner | Opus | build-reqs |