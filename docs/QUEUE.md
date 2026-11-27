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

Last updated: 2026-11-27 (LOGISTICS proposal sent; 3 running: PINPOINT-3, SIMPLER BUILDINGS, ONE FIGURE; nothing else queued until the owner's answers).

## Pace (owner, 2026-11-18, after the usage reset)

"Pace it so the week lasts: at most 2–3 jobs at once [raised to 5 non-overlapping jobs on 2026-11-18], Sonnet for anything routine, and Opus only for the big ones (MAP-2, the doctrines plan, the upgrades review, the research rebuild, cities, bunker and rebels). Anything that needs my decision goes under 'Waiting on me', and carry on with other jobs meanwhile."
Gemini: log every batch with the running total since the top-up; stop and ask if new spending passes $12. Art: follow docs/ART-BIBLE.md (standing rule: before fixing or redoing any picture, show the owner the problem and ask permission first).

## Running

| Job | What | Model | Branch |
|---|---|---|---|
| **CITY BUILDING LOTS** (2026-11-25, on cities-redo; the cities merge of 2026-11-25 was reverted on master, a4fbeb0, at the owner's request) | **Brief now Part A of the owner notes of 2026-11-25 (below, verbatim: A1-A7 and the sheets with no buildings, all built, one under construction), which replaces the earlier text.** Earlier, verbatim: "CITIES redo (branch cities-redo): I like it, don't change the look. One problem before merging: the capital HQ and every building I build (Army Base, Airbase, Naval Yard, Bunker, etc.) sits on top of the city blocks like a sticky note. Fix it so they look built into the city: 1. Fixed building lots: every city reserves a lot for each building type in its street plan. The city blocks never cover those lots, and roads lead to them. 2. The HQ sits in the centre on a city square. The Army Base and Bunker go near the centre. The Airbase goes at the edge of town on open ground. The Naval Yard goes on the waterfront. 3. Before a building exists, its lot shows as normal city ground (a small park or open square). While it's being built, show the crane and scaffolding on that lot. 4. The lot is part of the city's ground (paving, grass, a fence line). It's not a slab under the picture, so my no-slab rule still holds. 5. Draw city blocks and building pictures in one depth order, so a block in front of a building covers it and a block behind it sits behind. Same light direction and shadows for both. Show me Berlin, Hamburg and Kolkata at play zoom and closest zoom, before and after, with all buildings built and with one under construction. Don't merge until I've seen them." **Owner re-sent the brief (2026-11-25) with two more points and an extra sheet case, verbatim:** "6. Make the built buildings smaller so they match the city's scale: only a little bigger than the biggest normal city buildings, like a landmark that stands out but fits in. Players tap the city, not the building, so they don't need to be big. 7. The city grows around what's built: when a building finishes, and again as it levels up, the area around it changes to fit. New access roads, a few extra city blocks and greenery around it, so the city looks like it grew around the building. Only redraw that one city when this happens, to keep it fast. Show me Berlin, Hamburg and Kolkata at play zoom and closest zoom, before and after, with no buildings, with all buildings built, and with one under construction." The running round (points 1-5) was not stopped (standing rule); points 6-7 and the no-buildings sheets run as a follow-up round on cities-redo as soon as it finishes, then the owner sees the sheets. **2026-11-26:** points 1-5 done on cities-redo 7f463c8 (2 polish rounds used); sheets sent to the owner (Berlin, Hamburg, Kolkata, lots overview, Hamburg close-up). Open: Hamburg's buildings stand on grass east of town with no street; 34 lots in 13 towns still use the old cluster; mid zoom hex 50-60. **Follow-up job CITY LOTS GROW running (wf_1078e43c-aa0):** points 6-7 plus the Hamburg fix, at most 2 polish rounds, new sheets incl. a growth sequence and a phone frame. Build, look and tech critique, repair, two rechecks. Keeps the city centre point free for UNITS IN CITIES. **Not merged until the owner has seen the sheets.** | Opus | cities-redo |
| **SIMPLER BUILDINGS TEST** (2026-11-27, ART DIRECTION TEST item 2, verbatim in Next free slots) | option B code-drawn buildings behind a switch on branch simpler-bldg (from cities-redo), option A priced only; Berlin and Kolkata, play and closest zoom, desktop and phone; look critic, one repair (wf_da1c3e1f-515) | Opus | simpler-bldg |
| **ONE FIGURE PER ARMY TEST** (2026-11-27, with ART DIRECTION TEST item 1, verbatim in Next free slots) | one main-unit figure per army behind a switch, Motorized Infantry as soldier + vehicle (code-drawn; picture alternative priced only), side-by-side sheets and clips; look critic, one repair (wf_30c41f58-c56) | Opus | one-figure |
| **PINPOINT-3** (2026-11-27 playtest item 1, verbatim above) | find what broke waypoints again and why the earlier fix didn't hold; fix land, ships, waypoints; guard test in the standard checks; independent verify (wf_b440f18a-f9b) | Opus | pinpoint-3 |

## Next free slots (in this order)

**BUILD-REQS 2: started 2026-11-27 (see Running). SIMPLER BUILDINGS TEST: started 2026-11-27.** Was: BUILD-REQS 2 (build-reqs; Opus; owner 2026-11-27, verbatim: "Build requirements: yes to 2, 3 and 4. 1. Naval Yard: use these levels instead of your table: - Level 1: Corvette, Frigate - Level 2: Destroyer - Level 3: Cruiser, Attack Submarine - Level 4: no new units, builds faster - Level 5: Aircraft Carrier, Ballistic Missile Submarine, builds faster still. Corvette, Destroyer and Ballistic Missile Submarine don't exist yet, so give them marked slots, like the recon vehicle. Build the rest now."): Naval Yard I Frigate, III Cruiser and Attack Submarine, V Aircraft Carrier, marked slots for Corvette (I), Destroyer (II), Ballistic Missile Submarine (V); the computer's Naval Yard upgrades to match; "Needs Army Base II" wording like the other bases (answer 4); answers 2 and 3 as built; the independent recheck of the round-1 repair (Army Base III at war) that was promised; checks and before/after screens.

**ART DIRECTION TEST** (owner 2026-11-27, verbatim; test pictures and proposals only, one round, then wait):

```
ART DIRECTION TEST (queue it; test pictures and proposals only, one round, then wait for my OK):

1. INFANTRY: test a new infantry look: one soldier plus his transport vehicle (the unit is Motorized Infantry). Do this inside the queued one-figure job, so it's one job. Show it on the map in a fight and on a road, next to today's look.

2. SIMPLER BUILDINGS: I think simpler buildings would match the vibe of our new cities better. Show me two options on Berlin and Kolkata, at play zoom and closest zoom, next to today's look:
- A: simpler building pictures, in the same style, light and colours as the city blocks.
- B: buildings drawn in code like the city blocks themselves, each with a shape you can recognise (runway for the Airbase, piers for the Naval Yard, and so on). No Gemini cost.
Cover every building and the HQ. Start after the city lots job is done. In the province buildings job, make no new building pictures (Bunker, Field Hospital) until I've picked A, B or today's look.

Tell me the Gemini cost before making any picture. Screenshots on desktop and phone, saved to the shots branch.
```
How it runs: item 1 is folded into the ONE FIGURE PER ARMY TEST (below). Item 2 is its own job, SIMPLER BUILDINGS TEST, second at the next free slots (after BUILD-REQS 2; the city lots job is already done), on a branch from cities-redo, never merged without the owner's pick: option B built in code first (free); option A's test pictures (it absorbs the single Army Base camera test from the pasted-on check) priced first and made only on the owner's OK. The province buildings job makes no new pictures until the owner picks A, B or today's look.

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
1. **UNIT-ART-3 FINISH** (unit-art-3; Opus; PRICED 2026-11-27: guard re-based on the owner's $24.05 (df4576d); batches A Marines about $1.74, B AWACS about $1.79, C Stealth Bomber about $1.79, D 5 uniques about $0.60, E recon about $2.1-2.3; each waits for the owner's OK; open decisions 3-6 shape the prompts): the sets that stopped at the floor (AWACS, Stealth Bomber, Marines, the 5 uniques; about $3.6 by the 2026-11-19 estimate, to be re-priced exactly). Cost of each batch to the owner first, run only on the OK. Not merged until the owner has seen it (and the open unit-art-3 decisions stand). Then the RECON VEHICLE pictures once the owner OKs its proposal (start-armies job).
2. **MISSILES POLISH 2** (missiles; Opus; 2nd and last round): MS1 (the computer answers chemical with chemical; nuclear answers only for nuclear strikes or desperation), MS2 (Conventional Warhead researched readily at war), the desktop aiming hint clear of the mini world map, the strip says "Damaged" for a knocked-out silo; MS3-MS5 stay as built. Missiles plan 2 (ranges, HP, names) is a separate build job once the owner answers its questions 1-8.
3. **COMBAT DISPLAY** (one round, then wait; Opus): first tell the owner how combat timing works now; then "Fighting" plus the enemy army on panel and map label, a countdown to the next damage tick on both, the damage each side took after each tick; the fixed-tick change itself only as described to the owner. Desktop and phone screenshots.
4. **ONE FIGURE PER ARMY TEST** (own branch; Opus; with ART DIRECTION TEST item 1: a new Motorized Infantry look, one soldier plus his transport vehicle, on the map in a fight and on a road next to today's look; Gemini cost first if any picture is needed): one main-unit model per army with our bigger count badge, smooth turning along roads, moving/fighting/idle animations; side-by-side one figure vs three, in a fight and on a road; wait for the owner's pick.
5. **LOGISTICS BUILDING PROPOSAL** (DONE 2026-11-27: docs/LOGISTICS-PROPOSAL.md, sheets shots/2026-11-27/logistics/, questions 1-9; waiting for the owner. proposal only; Opus): any province, no levels, +25% move speed through it, thicker roads to show it, cost, build time, stacking with roads and the stack-size penalty, computer use along main routes and borders; wait for the OK.

6. **NEW SHIPS PROPOSAL** (DONE 2026-11-27: docs/NEW-SHIPS-PROPOSAL.md, sheet shots/2026-11-27/new-ships/, questions 1-9; pictures about $7 batch for 3 full sets or about $2.7 look 1 only; waiting for the owner. Opus; proposal only, then wait; owner 2026-11-27, verbatim: "NEW SHIPS (queue as its own job, Opus, proposal only, then wait for my OK): Add three ships. Surface ships go Corvette, Frigate, Destroyer, Cruiser, small to big. Submarines are the Attack Submarine and the Ballistic Missile Submarine. Carriers stay. - Corvette: small, cheap, fast coastal ship for patrol and anti-submarine work. - Destroyer: between the Frigate and the Cruiser. - Ballistic Missile Submarine: nuclear sub that carries and fires missiles (cruise, ballistic and nuclear) from the sea, like Conflict of Nations. Its nukes count inside the nation's nuke limit from missiles plan 2. This is the "ships later" answer to plan 2 question 5 (USA, Japan, Australia, Brazil). - Propose stats, cost, build time, research lines and how the computer uses them. Show them next to our 4 current ships, so each ship has a clear job. - Pictures: today the Frigate uses the corvette picture and the Cruiser uses the destroyer picture. Tell me which pictures to move and which new ones we need, with the Gemini cost. Don't spend credit without my OK.")


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
| **BUILD-REQS** (2026-11-27; owner verbatim: "Build requirements (one round only, then wait for me): 1. ARMY BASE levels (keep research days and costs): Level 1: Infantry, Motorized Infantry, Recon vehicle, Mobile Artillery; Level 2: Infantry Fighting Vehicle, Main Battle Tank, Mobile Anti-Air, Paratroopers, Swarm Drones; Level 3: Rocket Artillery, Mobile SAM, Special Forces, Mobile Jammer; Level 4: no new units, builds faster; Level 5: Missile Defence, builds faster still. There's no ground radar unit yet, so leave radar as it is. REMOVE Anti-Tank Infantry: take it out of research, build lists and the computer's choices. In old saves it turns into regular Infantry. 2. AIRBASE levels (keep research days and costs): Level 1: Recon UAV, Attack Helicopter, Air Superiority Fighter; Level 2: Strike Fighter, Strike Drone; Level 3: Maritime Patrol Aircraft, AWACS, Heavy Bomber; Level 4: no new units, builds faster; Level 5: Stealth Bomber, builds faster still. 3. NAVAL BASE: same idea. Spread the ships across levels 1-5 realistically (small ships low, carriers and submarines high), with levels 4 and 5 building faster. Show me the table before changing it. 4. BUILD SPEED: only levels 4 and 5 add build speed, on all three bases. Levels 1-3 just unlock units; the Recruiting Office stays the main way to speed up building. Make sure all three bases go up to level 5. Update the build lists, requirement text and the computer's build choices. Tell me what changed before and after.") | ROUND 2 DONE 2026-11-27: build-reqs d7378f5 (8e72279 + golden d7378f5; recheck of both rounds READY): Naval Yard I Frigate (+Corvette slot), II Destroyer slot, III Cruiser and Attack Submarine, V Aircraft Carrier (+Ballistic Missile Submarine slot); "Needs Army Base II" wording; computer climbs main yards to III (44-46 yard-III cities by day 60, cruisers 13-14), about 8% fewer units at day 30, no carriers by day 60 (as master); queued ships in too-low yards finish. Screens shots/2026-11-27/build-reqs-2/. Waiting for the owner's merge OK. Round 1: build-reqs b8cba48 (b497842 build, bf6716c golden, b8cba48 repair: computer builds Army Base III at war). Owner's lists exact; speed only at IV (x0.9) and V (x0.8) on all three bases; Anti-Tank Infantry removed (old saves to Motorized Infantry, refunds); Naval Yard table proposed only (I Frigate, II Cruiser, III Submarine, V Carrier). Slots marked: rcn, maa (Mobile Anti-Air), mdef (Missile Defence) - those units don't exist. Open for the owner: fewer tanks and strike fighters, Special Forces never built by the computer, no anti-armour answer in cities (2 stack-duel city cases informational), the repair was not independently rechecked. Screens shots/2026-11-27/build-reqs/. Owner 2026-11-27: yes to 2, 3 and 4; Naval Yard levels given (BUILD-REQS 2, next free slot). Earlier: one round (wf_ca510132-1dc): study, build, independent verify, a repair pass only for bugs the build introduced; Naval Base unlocks a table only; Recon slot marked; then wait for the owner | Opus | build-reqs |
| **START-ARMIES + RECON** (2026-11-27 playtest items 3-4) | DONE 2026-11-27: start-armies e60b96e (78c92da build, 30b5eca polish 1: computer capitals no longer left empty, golden re-recorded; e60b96e polish 2: better second cities). Every nation: capital 2 inf + 1 art + the fighter, two outer stacks of 2 inf (recon slot START_ARMY.recon null until the OK), nothing else: 8 units a nation (544 world-wide, 2010 before). City rule: biggest city outside the capital, then the biggest on another side (60 degrees) or far from the first; another nation's border or a highway counts x1.5; own-land reachable only; never next to the capital or the other stack. Sheets shots/2026-11-27/start-armies/. Recon proposal docs/RECON-VEHICLE-PROPOSAL.md (sight 70 km option A or 60 km option B; about $2.1-2.3 batch). Open: about 250 empty computer cities on day 60 (border-city habit offered), map quirks (NZ capital on the South Island, Israel cut off by the West Bank, Philippines/Indonesia strait links), balance tool to re-run with disk space. Waiting for the owner. Earlier: new start for every nation, city rule, AI adjust, balance and headless checks, sheets for Russia, Germany and a small nation; recon vehicle proposal only (stats, research, pictures, Gemini cost; no spend) (wf_09f62ac2-e69) | Opus | start-armies |
| **FIGHTER-ASF** (2026-11-27 playtest item 2) | DONE 2026-11-27: fighter-asf 2d826e8 (c343402 rules, 32cc778 page, 2d826e8 polish 1 of 2; final critics READY). Attack order with today's ground numbers in one entry ASF_ATTACK (soft 0.25, armoured 0.2, naval 0.3: about a quarter of a strike fighter vs infantry, a seventh vs tanks; Option B 0.3 each) - waiting for the owner's OK on the numbers; new buttons Attack, Split, Merge, Return and Army Info; calm racetrack patrol at the rules' flight speed (about 450 km/h, a lap in about 16 s); patrolling aircraft tappable at every zoom (tests asf-attack 43, air-tap 54). Sheets and clips shots/2026-11-27/fighter-asf/. Earlier: button list vs strike fighter, Attack order on proposed numbers (owner OKs before merge), calm racetrack patrol with 15 s clip, patrolling aircraft tappable at every zoom; look and rules critics (wf_503da938-700) | Opus | fighter-asf |
| **COMBAT DISPLAY** (2026-11-27, owner verbatim in the block above) | DONE 2026-11-27: combat-display c985d93 (f1292fb build, c985d93 repair after the independent check). Today's timing: damage already lands every 15 game minutes (4 rounds an hour); the CoN-style hourly round is proposed only (docs/COMBAT-TIMING-PROPOSAL.md; reverses CMB-1, golden re-record after other merges). Built: Fighting + enemy (fog respected) in the panel and on a map label, countdown with a filling ring, a 'lost -x%' chip per side after each round (counts artillery, air and missiles too); old floating -N removed. Sheets shots/2026-11-27/combat-display/ (clip made before the repair). Open: zoomed out with 3 counters fighting, your label is the short one. Waiting for the owner. Earlier: one round (wf_c13e2fdc-fb1): today's timing explained, fixed tick proposed only; Fighting + enemy, countdown, damage readout on panel and map label; desktop and phone shots, a clip | Opus | combat-display |
| **MISSILES PLAN 2** (2026-11-27; owner verbatim: "Missiles plan update (replaces my rename message; everything else in my last missiles block stands): 1. Nuclear warheads come on three missile types, in this order: Nuclear Cruise Missile, Nuclear Ballistic Missile, and later Nuclear ICBM. No \"Tactical\" name anywhere. 2. Each step up has a longer range and a bigger blast: Cruise: short range, smallest blast. Ballistic: medium range, bigger blast. Not world range: today's 16,200 km for ballistic missiles is too far. ICBM: world range, biggest blast. Propose Conflict of Nations-style ranges and blast sizes for all three (conventional, chemical and nuclear versions) and show me a table before changing anything. 3. Every missile has HP while flying, so anti-missile defences and anti-air can damage and shoot it down. Faster, tougher missiles are harder to stop: cruise easiest, ICBM hardest. Show the missile's HP on its marker and in the launch card. 4. ICBMs stay for later, but plan their research and silo needs now so they fit. Save the sheets to the shots branch.") | DONE 2026-11-27: 4 sheets sent (shots/2026-11-27/missiles-plan2/), proposal docs/MISSILES-PLAN2.md on missiles 728c58a; questions 1-9 (9 = MS1-MS5 defaults). With the OK it becomes MISSILES polish 2 of 2. Earlier: planning only, no code (wf_719fd073-5cb): facts from the code and CoN reference numbers, one proposal (table, HP model, ICBM plan), balance and code-fit critics, final proposal and table sheets. Then the owner sees the table; nothing changes on missiles until the OK. The MISSILES merge waits for this. | Opus | none (missiles stays bcb7067) |
| **MISSILES** (2026-11-26; owner: M1-M15 OK, M13 with the stronger gas zone) | POLISH 2 DONE 2026-11-27 (2 of 2 used, recheck READY): missiles fdd6d1e: MS1 chemical answered with chemical (nuclear only for nuclear or desperation), MS2 Conventional Warhead readily at war (3-8 nations build and fire missiles by day 60), desktop aiming hint clear of the minimap, Damaged on the strip; sheets shots/2026-11-27/missiles-polish2/. Open: tutorial card overlaps the hint at 1280 wide (one CSS line at merge), broke nations hold back the silo price (net-income guard suggested). Still waiting on plan 2 answers 1-4 and 6-8 and the owner's merge OK. Earlier: DONE 2026-11-27: missiles bcb7067 (rules, screens, map zones; rules and look critics; polish 1 of 2 used; recheck READY). 7 sheets sent (shots/2026-11-27/missiles/). Questions MS1-MS5 in docs/QUESTIONS.md. **Not merged until the owner has seen the sheets.** | missiles |
| **PROPOSALS** (2026-11-25; DONE 2026-11-25, plans-1125 19dd3af, sent to the owner; waiting for OK on R1 and the missiles plan, questions R1-R17 and M1-M15 in docs/QUESTIONS.md) | owner notes points 8-11 (occupation, morale, annex, rebels plan with the three proposals: Annex City cost and time, distance measure, troop effect on rebel chance), 12 (missiles plan) and 14 (2-3 Diplomacy layout options; **superseded 2026-11-25 by the owner's reference layout, see "Owner notes 2026-11-25, Diplomacy"**: the options draft was already done, its button inventory in docs/DIPLOMACY-OPTIONS.md is the checklist of actions to keep). Docs and mockups only, nothing built; shown to the owner before building. | Opus (diplomacy mockups Sonnet) | plans-1125 |
| **BUNKER ART options** | done 2026-11-18 (bunker-art): A concrete command bunker with earth berm, B bunker half sunk into a grassy hillock (recommended), C pillbox with trench on its own earth block (slab-like, not recommended); level 1 and 5 each, no ground patch; about $0.20; sheets and map previews sent; nothing in the game changed | bunker-art |
| **UNIT-ART tank sets** | done 2026-11-18 (unit-art): 45 pictures, 5 groups x 3 looks x (side / scene / top-down), $1.83 with checks (log 365 calls, about $12.10; estimated balance $39.05); 7 single-check flags and 8 three-way flags (mostly mirrored roof details on the top-downs); nothing redone; full set 1,095 pictures, about $44.49 (about $42.67 left, a top-up of about $8.6 needed to keep the $5 floor); sheets sent; NOT merged | unit-art |
| **CITIES** | done 2026-11-18 (7129852): block clusters, a quarter smaller, owner colour from the town coat, towers lower, hidden at hexPx 26 and below, brighter night windows; checks pass; faster than master except desktop day close-zoom panning +4.7% per frame (probably noise); screenshots sent | cities-3d |
| Explosion clips + FX-2 (#24) | NOT merged until the owner OKs | fx-video |

## Queued (in this order)

Owner's consolidated list of 2026-11-15 (#1-#24). Already merged and live (Dev Build v50-v52): #1, #2, #5, #6, #8, #10, #12, #13, #14, #15, plus Suez and capture by one unit. #9 is half done (the amber shield and +10% are in; the city part is new).

| # | Job | What it covers | Model |
|---|---|---|---|
| (done, plan) | **DOCTRINES plan** (owner 2026-11-15; Opus, PLAN ONLY, don't build) | write docs/DOCTRINES.md: nation groups (doctrines): US/NATO, Russia/Eastern, China, Europe, and a generic export group; every one of the 68 nations in one group; each group's identity: a small, clear strength and weakness (e.g. cheaper and faster to build vs stronger and more expensive), balanced and simple, numbers proposed; for every unit type each group's own version with a real model name per look level (1, 3, 5, 7), e.g. Main Battle Tank, Russia: T-72, T-80, T-90, T-14; US: M60, M1, M1A2, M1A2 SEPv3; the same for SAMs (S-300, Patriot...), fighters (F-16, Su-27...), helicopters (Ka-50, AH-64...), ships, drones and missiles, with small stat differences matching the real equipment; a handful of unique units only some groups get; the name shown as 'T-80 · Main Battle Tank' with the group's emblem stripe on the research card; flag likely trademarks (Apache, Black Hawk, Lightning II...) and use the bare designation (AH-64, UH-60, F-35); a shared filter for research-card pictures (e.g. a tinted monitor look with scanlines) so all unit pictures read as one set; art cost: pictures per group and in total with the Gemini cost, and the cheapest way (shared pictures for similar units). Show the owner the plan and WAIT for the OK | Opus |
| 2 | **UNIT-LOOKS** (owner 2026-11-18) | 5 groups x 3 looks for every unit (365 pictures with the 5 uniques, about $15.70 with the checks); step 1 DONE (merged 2026-11-18, prompts in docs/UNIT-LOOKS-PROMPTS.md): plan update, count and cost, the Gemini check step, the exact tank prompts for the owner (no spending); step 2 after the owner OKs the prompts: the tank sample for all 5 groups (15 pictures, about $0.60 plus checks), Gemini check on each, shown on the research card and on the map; step 3 after the owner's OK: the rest, with the check on every picture; map figures' own pictures only with the owner's permission | Sonnet |
| (done, v55; follow-ups done: UPGRADES-2, v57) | **UPGRADES review + fix** (owner 2026-11-18: go with the suggestions, fix all 6 gaps incl. aircraft speed; CoN numbers checked on constacks.com) (owner 2026-11-15; Opus; review first, change nothing until the owner has reviewed the list) | (1) research upgrades apply to ALL units of that type, new and existing, the moment the research finishes, like Conflict of Nations: units on the map, in queues and in transport get the new stats at once; the AI benefits the same way; tests updated (RESEARCH.md 2.1 already says upgrades apply to fielded units: verify it really does everywhere, report gaps); (2) docs/RESEARCH-UPGRADES.md: every upgrade in our tree grouped by unit line with what each level does, compared with Conflict of Nations using constacks.com (their unit stats at each level); mark ours that don't directly improve the unit itself (faster mobilization, cheaper training, ...) and suggest replacements that do (health, attack by target type, defence, speed, sight, range); (3) faster mobilization: no separate research node; only as an extra bonus on a unit line's final level, on top of that level's normal stat upgrade, about 15-20% faster. Show the owner the list and WAIT; then build (1) and the approved changes | Opus |
| 4 | **RESEARCH-CON** (next; the UPGRADES fix is merged; the doctrines and upgrades answers are in; waits for the owner's CoN research screenshot; its unit pictures are the UNIT-LOOKS pictures) rebuild the research tree like Conflict of Nations (owner 2026-11-15; Opus; full spec in 'RESEARCH-CON spec' below) | new cut-out pictures for every unit in the tree (list every unit first; 4 samples to the owner before the rest), blue/green/grey node states, code-drawn white upgrade symbols and category icons, calendar day column with only research days, a moving glowing today line, a shaded grid, no labels/locks/badges on nodes, one node per cell with straight vertical lines only, a CoN-style RESEARCH banner and SLOT #1/#2 boxes, plain column headers; phone screenshots of two categories next to the owner's CoN screenshot before merging | Opus |
| (done, waiting for the owner) | **CITIES** (#16, Opus) | clusters of simple 3D buildings instead of the flat grid, like Conflict of Nations: keep each city's own outline shape; inside it small extruded blocks (lit top, shaded sides, soft shadow), taller in the centre and lower at the edges, streets between them, tinted in the owner's colour; bigger cities more and taller blocks; cities about 25% smaller on the map; drawn once into a cached picture per zoom level; hidden when zoomed far out. Screenshots of Kabul, Damascus and Berlin at 3 zoom levels before merging | Opus |
| (done, v59; pictures v61) | **BUNKER** (#17, new rule) | Fortifications become the Bunker, hidden from other nations. Level 1: health 20, garrison takes 33% less damage, +5% morale, upkeep 100; level 2: 40, 43%, +10%, 110; level 5: 125, 82%, +50%, 140; levels 3 and 4 smooth between (proposed: 3: 65, 56%, +20%, 120; 4: 95, 69%, +33%, 130). It shields the city's other buildings up to level 1 and protects the population up to level 5. Convert to our economy's scale. Show the owner the protection table (with and without dug-in) before building. 5 levels: the Fortifications price/cost question folds into this | Opus |
| 7 | **REBELS** (#22, new rule; owner's answers are in, see this row; never started: it was 7th in the queue and the job slots stayed full; starts at the next free slot after the 2026-11-19 audit) | the suggested answers in docs/REBELS-PLAN.md, with one change: one level-1 infantry unit left in the captured city until it stabilises beats any rebels; an empty city still flips. Rebels get a crossed-rifles badge and show as 3D soldiers | Opus |
| 8 | Phone app (PWA) on Netlify | needs the Netlify token | Opus |
| later | Chemical and nuclear weapons (#23): owner will go through them first | | |

### RESEARCH-CON: the research card (owner, 2026-11-18, verbatim)

"Research card: match my Conflict of Nations Ka-25 card exactly:
- Header: the unit's model name and level in bold ("T-80 LVL. 1"), a research icon on the left, a red close button on the right.
- Under it: the small diamond with the unit's cut-out, and a one-line note ("Starting level military unit or technology.").
- An "UNLOCKS" bar with a lock icon, pointing down to the unit box.
- Unit box: the unit type in bold ("MAIN BATTLE TANK") with a rank chevron on the right, then the group stripe with the group emblems.
- Card scene, with two small dark tags at its top left, matched exactly: the model name with a small white unit icon ("T-80 [icon]"), and "Level 1" under it.
- A short description under the picture.
- Footer: each cost as an icon with its amount, a stopwatch icon with the research time ("1d"), and a big green START button."
Also (owner): "Research tree: attached are my Conflict of Nations research tree screenshot (Helicopters, with the red banner and Slot #1 / #2), their Ka-25 unit card, and my mockup. Match the tree screenshot's layout and the card's layout." Reference pictures (owner's CoN screenshots, received 2026-11-18, kept in the scratchpad research-ref/): con-tree-helicopters.webp (the tree: red RESEARCH banner with the group emblem, SLOT #1 / #2 boxes, HELICOPTERS header, day column with a calendar icon, today line at day 4 with the tinted band above it, diamonds, alternating column shading, + marks), con-card-ka25.webp, con-card-ka50.webp, con-card-mi8.webp (the card; the group stripe shows the emblems of every group that fields the unit). The owner's mockup has not arrived.

### RESEARCH-CON spec (owner, 2026-11-15, verbatim points)

"Rebuild the research tree like Conflict of Nations. I want it perfect, so don't hold back on Gemini credit, but log the cost and tell me the total after each batch. Match their layout closely, but with our own art and emblems."
1. New pictures for EVERY unit in the research tree, made fresh on Gemini: one per unit (and per look level once the unit looks plan is approved). Each one a single clean vehicle, aircraft, ship or soldier, 3/4 side view, the whole thing in frame, on a plain flat background so it cuts out perfectly. All the same style, lighting and scale, in the new art style (clean and polished like Conflict of Nations, a little more realistic). Cut each one out with a clean transparent edge. List every unit in the tree first, so none are missed. Show 4 samples before doing the rest.
2. Node colours, three states for units and upgrades: BLUE = researched; GREEN = can be researched now (its day has come and the step before it is done); GREY = not available yet. Unit nodes show the cut-out picture whole inside the diamond on that colour.
3. Upgrade nodes: one flat white symbol per upgrade type, drawn in code, polished like CoN's (crisp vector shapes, even slightly bold line weights, subtle drop shadow, one consistent set, sharp on a phone): Protection = shield, Firepower = crosshair, Health = plus with an up arrow, Speed = chevrons with an up arrow, Vision = eye with a plus, Terrain = mountain, ... The same symbol everywhere. Remove all the old upgrade photos.
4. Category icons next to each category name in the tree header: clean flat white silhouettes drawn in code in the same style (soldier, tank, helicopter, ship, jet, ...), different from the map badge icons.
5. Day column: a small calendar icon instead of the word "DAY"; show only days that have something to research (e.g. 1, 2, 3, 4, 7, 8, 10).
6. Today line: a glowing line across the whole tree at the current day, moving down one row each game day, with a small "DAY" tag at its left end; above it a soft tinted band, below it dimmed. Remove the "TODAY" tag and the "..." marker.
7. Grid: alternating light/dark column shading and small subtle "+" marks at the cell corners.
8. No text labels under the nodes, no lock icons, no level-number badges. Name, levels, cost and time show in the card on tap; the card uses the same unit picture, large.
9. One node per cell, one straight vertical line per column, no horizontal or dashed connectors. If two nodes share a day in one column, the upgrade goes to the next row.
10. Header banner like theirs: "RESEARCH" in bold white on a streaked, brushed colour sweep in the nation's side colour (red for the Eastern group, blue for the Western group, ... once the nation groups plan is in; red for everyone until then), back arrow left, close button right, our own emblem in a white diamond near the right end. Drop the subtitle line.
11. Slots like theirs: two wide boxes, each with a diamond emblem and a "SLOT #1" / "SLOT #2" ribbon in the banner's side colour; no "+" or "Choose a project"; a busy slot shows the project's picture, its name and a progress bar with the time left.
12. Column headers: plain text with the unit line's name, no photo or step count. Elite units keep their gold stars.
13. Keep the approved category banners.
Phone screenshots of two categories next to the owner's CoN research screenshot before merging (ask the owner to upload that screenshot if it isn't in the uploads; only a CoN map screenshot is there so far).
Notes for the job: the unit pictures should follow the DOCTRINES plan once approved (group-specific versions); until then one generic picture per unit. Gemini: log every batch and report the running total since the top-up; the owner's $12 stop-and-ask line still applies unless the owner raises it.

The owner's infantry icon (#7), to use exactly, navy on the white tag:
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M12 62 C12 35 31 17 55 17 C78 17 91 35 91 56 L96 66 L80 66 C70 61 32 61 12 62 Z" fill="#1d2c45"/><path d="M20 57 C40 53 64 53 84 59" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M33 64 C33 80 47 87 59 81 L66 66" fill="none" stroke="#1d2c45" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`

## Pictures still missing

Every picture or clip not made yet, with what it is for and its estimated cost at batch prices (about $0.04 a picture, $0.05 a banner, about $0.35 a video clip). Updated after every batch. Owner topped Gemini up to about $15 (2026-11-15). The log stood at 199 calls, about $8.10, before the top-up: report the running total of new spending after every batch and stop and ask if it passes $12.

| Name | What it's for | Est. cost | Status |
|---|---|---|---|
| Army Base 1-5 (bn-fac-1..5) | the Army Base on the map and in the city panel, same style as the Airbase set: level 1 a temporary camp with tents and sandbags, level 5 a full permanent base | $0.21 | **done** (ART-1; levels 4-5 kept their tents and got a wider footprint) |
| New-style buildings 1-5 of 8 | owner #20 | about $2.6 spent | **done** (live in v53) |
| Dug-in icon | not needed: UNIT-LOOK drew the new amber shield in code | $0 | done in code |
| Construction pictures x3 (a site with a crane, scaffolding, a half-built frame) | the construction animation (P2-1) | $0.10 | **done** (ART-1; the site picture sits on a soil slab) |
| Missile Silo 1-5 (bn-silo-1..5) | the Missile Silo on the map (nothing shows today) | $0.18 | waiting |
| Arms Industry 1-5 (bn-arms-1..5) | the Arms Industry on the map (nothing shows today) | $0.18 | waiting |
| Research art retries x10 | diamond frame drawn inside 7 icons (ri-cat-sup, ri-msl2, ri-t-pr, ri-at_warhead, ATGM, ri-sdrone_hit, ri-sat1), Strategic Weapons banner cut off (rbs-msl), wrong subject on 2 (ri-spec_airlift, ri-sam_seek) | $0.45 | waiting on the owner |
| Research icons too close to real products x8 | F-15, MQ-9, F-22/F-35, B-2, Nimitz, AH-1, P-3, Abrams look-alikes | $0.35 | waiting on the owner |
| Firepower / Protection air and naval variants x4 | the shared upgrade icons show a tank turret on aircraft and ship lines | $0.18 | waiting on the owner |
| Infantry figure (u-infantry-figure) | the standing infantry figure for the zoomed-in map (still absent) | $0.04 | waiting |
| Heavy Bomber generation 2 | its own picture instead of sharing generation 1's | $0.04 | waiting on the owner |
| Hospital 1-5 with a green or white cross | only if the Hospital becomes a building (the red cross is a protected emblem) | $0.18 | waiting on the owner |
| Recruiting Office 1 without the flag | style says no flags | $0.04 | waiting on the owner |
| Naval Yard 1-5, piers to the upper right | yards on coasts facing up the map (29 yards can't point their piers at the sea) | $0.18 | waiting on the owner |
| Chemical explosion clip (fxv-chemical) | chemical strikes (the service refused it twice; the owner decides whether to try other wording) | $0.35 | waiting on the owner |
| Unit looks 2-4 (71 pictures: 23 units x 3, Recon UAV x 2) | each unit looks more advanced at research levels 3, 5 and 7 (docs/RESEARCH.md 14) | $2.84 | waiting on the owner (tank sample first, $0.12) |
| Rebel figures | 3D model in units3d.js, no Gemini picture needed | $0 | with REBELS |
| **Total** | batch 1 done ($0.31 logged: Army Base 1-5, construction 1-3, merged into master as files, drawn by BLD-MAP-2); next (Fortifications) $0.18; everything else listed about $1.9 | | |

## Waiting on me (the owner)
- **NAVAL CITIES, still open after the merge (owner said "merge it" 2026-11-19):** inland cities with anchors (Hyderabad PK, Ahmedabad, Hubballi): keep, or anchor only cities whose point is near the sea (recommended)? The AI hardly builds Marines (at most 2 in 40 days): raise its build weight? Long detours for ordinary troops near plain beaches (one test about 14 days): fine as is?
- **UNIT-ART-3 (stopped at the $5 floor, 5 of 12 sets made, branch unit-art-3 dca8cdb, not merged).** Made: Special Forces, Paratroopers, Jammer, Heavy Bomber, Maritime Patrol (225 pictures, about $8.93; log total about $54.24; estimated balance about $6.61). Not made: AWACS, Stealth Bomber, Marines, the 5 uniques (about $3.6 more). Sheets sent 2026-11-19. Waiting on the owner: OK for 12 free flips/cut-out fixes; 7 must-have redraws (about $0.35); bomber redesign (copies B-52/B-1B/Tu-160/H-6, $0.7–1.8); paratroopers show no parachute gear; jammer NATO look 1 copies the M113; MPA look-alikes; top-up for the rest.

- **Weather (clips sent 2026-11-19 night):** pick rain/snow option A (classic), B (long and windy) or C (fine and dense); branches weather-opt-a/b/c. The cloud colour fix is merged on master (d4d0bb5).
- **Rebels (sheets sent):** OK to merge (branch rebels 419f514)? Open choice: should an ally's troops count for holding a captured city (now only the holder's own)?
- **3D CITIES restyle: owner 2026-11-21 "Branch cities-3d-2 isn't good enough, so don't merge it" (replaced by CITIES REDO in Next free slots). Old note: (branch cities-3d-2 90c54b8, not merged; 9 before/after sheets sent 2026-11-20):** 3D blocks in the owner's colour from closer than play zoom, cities keep size and detail; fixes master's blurry patches close in; desktop speed level with master, phone memory flat. Weak points: at play zoom (hexPx 28) your own cities are pale green blocks on green land, little different from now; night is unchanged (no lit windows close in, same as master). Waiting on the owner: merge? stronger contrast at play zoom? lit windows at night?
- **Map look, old vs new (sheets sent 2026-11-19):** pick which of the 15 numbered changes to bring back (scratchpad mapcompare/answer.md; most likely causes of 'old looked nicer': 7 fog veil, 4 tint never eases off, 1 close-up richness (being restored by MAP SURFACE), 11 and 13 bold borders and road web, 8 smoothed snow, 6 darker sea). Guess 1 partly right; guess 2 mostly no (the fog veil dulls the snow, not the tint colours).
- **Map surface: merged 2026-11-22 (owner: "As for map changes merge it"), Dev Build v66.** Texture (map-texture b72c911), jungle C reworked (map-jungle-c d48b709, c2 default) and sea B (map-sea-mix 500c27a) are on master. Still open: **sea mix pick** (none = plain B, now live / region (recommended) / depth / patches; built in, switch `SEA_MIX`), Hudson Bay and the wide Okhotsk area in the region mix, mix strength; and **which of items 4, 5, 7, 8 of the old-vs-new list to bring back**.
- **Conflict of Nations numbers:** constacks.com can't be read (security checkpoint; its robots.txt asks AI crawlers to stay out); taken off the allowed sites 2026-11-18. Paste the figures or send screenshots if you want them matched.
- **Research tree rebuild:** the CoN tree and card screenshots arrived (2026-11-18); the owner's own mockup did not. Starts when a job slot frees.
- **Gemini log:** each art branch has its own copy of assets/art-src/gen-art-log.jsonl (unit-art +110 calls $1.83, bunker-art +15 calls about $0.20); merge them by joining the lines. Estimated balance about $38.85.
- **Bunker level 4:** merged as it is (owner OK 2026-11-19). Its small blockhouse floats: fix it later (one Gemini edit, about $0.04)?
- **MAP-FIX:** zoomed-in shots sent 2026-11-19 (Kabul, a moving army, a ship, the two '?' outlines). Before merging: the branch's public build fails (the test-only window.__unkDotOl sits outside a test block; remove it once the outline is picked). OK to merge (map-fix 5e9bd37)? The '?' dot: keep the dark outline or switch to the light one (reads better on red enemy land)?

- **Merged in v50 with the built defaults; still open if you want to change them:** aircraft (parked aircraft keep their pictures, bigger bomber/AWACS/patrol sizes, Stealth Bomber humps, old jet/int sheets still loaded); buildings (dock basins, small rivers count, construction sites 10% bigger?, move ~93 port cities' map points to their real places?); shipping routes (fleet selection no longer shows routes, cut-off convoys hidden when off, coaster/tanker drawn in code); building rules (Army Base only or both; Fortifications price: option 2 recommended; the +40% per extra Army Base; a starting Army Base in the biggest city?).
- **Explosions (FX-2 ready):** the 'two not showing' were nuclear (the rules have no tactical nuke or ICBM, so it only appeared from test buttons) and chemical (no clip, and no chemical weapon in the rules). Add real chemical / tactical nuke / ICBM weapons to the rules (docs/RESEARCH.md 12.5: research, cost, damage, fallout, diplomacy)? OK to merge the clips?

- **Economy over time (nations re-check, nothing broken):** with peaceful computer nations, every nation's net income falls about 65-70% by day 60 while its army triples or quadruples, so all end near zero income with a small treasury; the big powers hardly grow (102-104% of their start land) and independent land is almost all taken by day 30. Change anything (cheaper upkeep, an army cap for computer nations, slower expansion)?

- **Speed options that change play:** quiet nations plan every 8 h instead of hourly (about -20% rules time); shorter attack-target search (-10 ms/day); reuse land routes across hours (-20 to -25 ms/day); phone map drawn at pixel ratio 1.5 instead of 2 (about 44% fewer pixels: the phone is limited by drawing, not rules).

- **Bomber pictures:** the new Heavy and Stealth Bomber pictures are a cooler blue-grey than the AWACS and fighters: warm them to match? The Heavy Bomber uses one picture for both generations (a second upload would give generation 2 its own).

- **Cities panel multi-select:** the ticked-cities bar shows from 2 ticked cities (show it with 1?); when resources run out it stops at the first city that cannot pay and skips the rest (or skip only that city and carry on?).

- **Resource balance review:** docs/RESOURCES-PER-NATION.md. (1) 14-city nations need two resources on 3 cities, not one. (2) Rare materials go from 19 to 89 cities, so their market price roughly halves: lower rare output per city? (3) Weak spots where the map has no better city: Mongolia and Chad electronics, Israel iron (Nitzana), Saudi rare (As Sulayyil) and electronics (Abha), Venezuela rare (Barcelona), Thailand iron (Surin), Vietnam money (Soc Trang).

- **Forward Airstrip:** 5 levels or 3?
- **Faster game days:** getting well under 0.5 s per game day may need changes to how computer nations think (quiet nations plan every 8 hours, a shorter attack-target search, reusing routes across hours). Want any of them?
- **Market prices** are shown per 1,000 units (for example '$2.70M / 1K'). OK?
- **Research design approvals:** item 3 (Generations) and the new ground units list (docs/RESEARCH.md section 12).
- **Pictures:** the two research banners (Strategic Air now uses the AWACS; Command & Logistics the supply truck).
- **Netlify token** for the phone app; **"move to public"** for everything under 'Waiting for public' in RELEASES.md.
- **Nations balance tests:** T4/T5 count only land taken from other nations while more than a quarter of the world is unowned; China's 'fights a big rival by day 60' check relaxed. OK?
- **Cleanup:** delete the rejected building branches (buildings-3d, building-fix, buildings-cutout) and the old wip/* snapshot branches once checked to be on master?
- **Picture audit (2026-11-13):** done, list sent; nothing fixed yet. Which fixes to queue? Main ones: Anti-Tank Infantry shows a missile truck in research; Paratroopers reuse the infantry picture; empty icons on 9 of 10 research categories and 3 column headers (a code bug); generation nodes show tinted copies; missile pictures loaded but never shown; no satellite picture; bombers/AWACS/patrol plane share the small fighter model on the map; old top-down Airbase 2-4 and Silo 2-3 near-identical; City pictures in porthole frames.
- **Fable:** no Fable tasks except the final visual polish pass with Fable 5.2 in the last week before launch (LATER.md, owner 2026-11-15).

## Planned for later (in LATER.md, not built yet)

Radar stations, coastal naval batteries, province anti-air sites, a Hospital; multiplayer, lobby AI, gold, premium pass, competitive mode, player levels, daily rewards, seasonal art.

## Done (on the Dev Build, waiting for public)

| Task | Model |
|---|---|
| **UNITS IN CITIES** (v71, 2026-11-26, merged 7ad43fb; owner: "UNITS IN CITIES: UC1 and UC3–UC6: your defaults; UC2 as I corrected. Merge once I've seen the dot fix sheets."): centre diamond, hold ring, dot always at the army's true spot with the counter moved aside on a thin line, shadows and outlines, city sheet lists. Dot fix sheets sent (shots/2026-11-26/uc-dot/). Speed check: phone mid zoom was about 3 ms/frame slower at CPU x2; polish 2 (14250bf) trimmed the markers to level. All checks pass on master after the merge (controls 49/49 run alone; anchor (G) as on master). Open: UC7 (long leader lines at hex 240). | Sonnet |
| **REBELS** (v70, 2026-11-26, merged cb0378c after the owner's OK: "REBELS: approved. RB1–RB5: your defaults, including the new wording of RB5. Merge it now."): morale replaces unrest, Annex City, burning cities and risings, rebels as their own side, trade partners occupied (option C), computer garrisons and annexing; Q27 A / Q28 B. All checks pass on master after the merge (balance, nations-balance, eco, duel, rebels2 168, d10, dealings). Rebels unit pictures: separate job, waiting for the owner. | Opus |
| **Q-DEFAULTS** (v69, 2026-11-26, merged 4859784; owner: "go with your defaults on Q1–Q31" and "D10: fix it"): triage found every Q1-Q31 default already in force or "unchanged" (no new code); Q8/Q19 handed to MISSILES, Q27/Q28 to REBELS (done on rebels-2). D10 tightened: a friend gives at most about 16% more value than it gets back, two favours in 3 days and the next deal must pay its way, no empty counter-offers, 20-day wait to re-ally after leaving, opinion from deals at most once a day. Recheck READY; 2880 random deals, footer always matched. Open: 20 days right? $1M steps for small deals? favours reason in the footer? | Opus |
| **MERGE 1126** (v68, 2026-11-26, merged 8448af9 after the owner's OK: "Merge Market, Fog-clash and UI-fixes." / "Merge auto-test/fixes ... after re-running the checks on top of today's merges" / "D10: fix it"): Stock Market to the reference (computer nations post buy and sell offers; flag opens ABOUT PLAYER with "« Market"), fog (enemy armies outside your land and sight hidden), columns that meet fight, blue Build/Upgrade/Train buttons when affordable, infantry icon fits its diamond, the playtest's 16 fixes, D10 (a computer nation refuses a deal where it gets nothing back). Independent verify SAFE; all checks pass. Known gap: a $1M token payment still gets round D10 (follow-up in Q-DEFAULTS). | Opus |
| **ECON-START** (v67, 2026-11-26, merged 244638b after the owner's OK: "Merge the economy and diplomacy. I like them."): capital Airbase and fighter at the start, level 1 Army Base $10M and 30 minutes, mobilization queue as a membership feature with a dev toggle; independent verify identical to a scratch merge, all checks pass; units about 10-15% fewer than before at day 60 (balance look later) | Opus |
| **DIPLOMACY** (v67, 2026-11-26, merged 244638b, same OK): reference layout list, ABOUT PLAYER pages, conversation, trade builder with Accept / Decline / Counter; every old action kept; cherry-pick trailers reworded at merge (same code) | Opus |
| **MAP SURFACE** (v66, 2026-11-22): texture back at every zoom (far colours kept, faster detail tiles), jungle look C reworked from Google Earth, sea look B at every zoom; sea mixes built but off until the owner picks. Merged one at a time (texture, jungle, sea); golden, headless, sea-mix, battery and zoom-look checks pass. | Opus |
| Naval cities (Dev Build v65, merge 0898d01, owner OK 2026-11-19): anchor at 349 coastal cities, troops board and land only at naval cities (assault landings at enemy or independent ones, 45 min, first-day penalty), Marines (new unit, any coast when the force is all Marines; infantry pictures until their own exist). Also brings the buildings follow-up (cities-2): buildings on land as drawn, 17% smaller, Naval Yards on the water. | Opus |
| Unit pictures set 2 (Dev Build v64, packed two files a unit by UNIT-ATLAS so the build stays under 511 files): 17 units x 45 pictures, wrong-way pictures flipped, pale plate removed; the cloud colour fix (clouds stay white and grey) | Sonnet / Opus |
| MAP-FIX (owner OK 2026-11-19 night): pinpoint moves to the exact tapped spot, a position dot under every force (the '?' dot dark-outlined, owner's pick), buildings scale exactly with the map, the castle dug-in mark in the amber shield (Dev Build v63) | Opus |
| EMBARK-45 (owner 2026-11-19): boarding and landing take 45 minutes each, exact to the minute; route arrival times now match for sea crossings; Amphibious Doctrine 22.5 min, floor 15 min; old saves capped (Dev Build v62) | Opus / Sonnet |
| MAP-2 (one map look, soft borders, province lines fade in, foreign armies '?' until recon) and the Bunker pictures, option C version 1 at levels 1-5 (Dev Build v61, owner OK 2026-11-19) | Opus / Sonnet |
| Tank pictures (Dev Build v60, owner "Tanks pictures are good" 2026-11-18): 5 groups x 3 looks x side / card scene / top-down, in the research cards and on the map | Sonnet |
| Research tree rebuilt like Conflict of Nations; the Bunker (5 levels, hidden); the nation picker in the old card layout (Dev Build v59, owner OK 2026-11-18) | Opus / Sonnet |
| ICON-FIX (Dev Build v58, owner OK 2026-11-18): every infantry type (Motorized, Paratroopers, Special Forces, Anti-Tank) shows the owner's plain helmet badge; no wheel or parachute icon anywhere | Opus |
| UPGRADES-2 (Dev Build v57, owner 2026-11-18): Recon UAV Firepower 1-2 became Wide-Area Sensors 1-2 (+15% / +30% view; Firepower 3 kept for UAV IV); landings, boarding and cruise missiles under way switch to new timing at once; old saves convert; 1349-check test | Sonnet |
| Badge size (Dev Build v56, owner OK 2026-11-18): every badge 86% of the first version, about 45 px wide on a phone, the same size for everyone | Opus |
| UPGRADES fix (Dev Build v55, owner 2026-11-18): the suggested answers (Infantry Kit, Thermobaric Warheads, Close-In Defence replace the 3 do-nothing upgrades; +15% training on each line's final level) and all 6 gaps: aircraft speed upgrades work (+10% / +33%), swarm cards 6 drones everywhere, queued training and moves under way speed up when an upgrade lands, the AI counts swarms right, a 1271-check test (.test/upgrades-live.js); old saves convert; golden re-recorded | Opus |
| BADGE-CON (Dev Build v54, owner OK 2026-11-18): Conflict of Nations unit badge (flag over a side-colour bar with the bold italic count, white tag with the owner's helmet; Motorized Infantry the helmet with a wheel; every badge full size, quiet foreign forces too; zoomed out the coloured square with the tag); dug-in +10% in the open, +25% in a city | Sonnet |
| ART-2 + ART-3 (2026-11-16/17): the new art style (STYLE_V2) and the one-design-per-type rule in tools/gen-art.py and docs/ART-BIBLE.md; 8 buildings levels 1-5 in the new style (Airbase redesigned, slab removed by editing; Naval Yard recoloured; bunker cutaway plus a surface view for the map; red-cross hospital, green version on file), about $2.6 of Gemini. New-style buildings in the game (Dev Build v53): Army Base, Airbase (slab removed), Naval Yard (recoloured), Missile Silo and Arms Industry (now on the map), Recruiting Office, Fortifications (surface view on the map, cutaway in panels) levels 1-5; hospital cut out and ready; docs/ART-BIBLE.md started | Sonnet |
| No city starts with an Army Base; Army Base I $18M / 6K materials / 6K iron / 1 day, the +40% rise only from the 3rd base; the AI builds one in its capital first (every nation has one within 28 h); First steps and tutorial start with 'Build an Army Base' (Dev Build v51) | Opus |
| **Dev Build v50 (owner: "Merge everything except for the explosions")**: real Natural Earth borders, no hatching, own country green and others grey, bold country borders; HQ flags (curved cloth, a captured capital's HQ destroyed); UNIT-CTRL (a tap only selects, Move then tap, rally point with preview and flag); CoN-style badges (whole flag, icon upright, count in a corner, infantry icon C), amber dug-in shield and +10% defence, Shipping routes setting (Settings > Map, default off), troops at sea as a grey landing ship; buildings on land and 18% smaller, construction pictures with crane, Army Base 1-5 pictures, Naval Yards on the water at their city (Kolkata on the Hooghly); each aircraft type its own 3D model; infantry needs Army Base I (Recruiting Office speed/manpower only), only capitals start with Fortifications, no city levels (capital shows its regional HQ); the rebels plan doc. Combined on branch integrate, every check passed | Opus/Sonnet |
| ART-1: Army Base 1-5 and 3 construction pictures on Gemini ($0.31), cut out with metadata (files only; drawn by BLD-MAP-2) | Sonnet |
| Research banners edge to edge with a light blue-grey wash behind the name; Infantry Corps first picture moved up, faces whole and feet cropped (Dev Build v49) | Opus |
| Nations balance re-check for peaceful computer nations: all balance checks pass (China/India check changed to 'stay at peace and hold their land'), no nation stalls or goes broke; v3c, stealth-ui and x1000 old-save tests brought up to date (tests only) | Sonnet |
| Angled building pictures on the map and in the city panel: regional HQs on every capital, Airbase, Naval Yard on the coast or river bank (mirrored to face the water), Recruiting Office, Fortifications; fade in by zoom, crane while building, no level badges (Dev Build v48) | Opus |
| Resources x1000 except money (stocks, production, storage, all costs), short forms (40K, 1.2M), full amounts with units on hover, market prices per 1,000 units; merged with the fixes, play proven identical (6 games, 30 days), old saves scaled once (Dev Build v30) | Opus |
| URGENT Dev Build fix A: computer nations never start a war (they fight back fully; allies join only to defend), play test at 1x/4x/8x, merge breakage (v3r1) | Opus |
| URGENT Dev Build fix B: speed-ups with identical play (rules per game day 1.19 s → about 0.55 s CPU; longest freeze at 8x 476 → 95 ms). Not fully met: 'well under 0.5 s' and 60 fps while panning; faster options change AI play (owner to decide) | Opus |
| URGENT map fix: every country its own strong colour (no two neighbours alike), allies blue, tint and province/country borders clear at every zoom, sea outline (straight lines) removed, real country borders (Syria checked: data correct, wiggle removed) | Opus |
| Capture and landing: a province is taken the moment a ground force reaches its heart (no occupation clock); embarking only at naval ports (6 h); landing 12 h on a coast, 6 h into a port, halved by Amphibious Doctrine (Dev Build v36) | Opus |
| URGENT black map fixed: canvas caches bounded (memory flat over 3 days at 8x) and the map rebuilds itself after the browser drops its graphics memory (Dev Build v35) | Opus |
| Unit look: square unit badge (flag, upright icon, count), 3D infantry squads with soft shadows, dug-in shield with a tooltip, Army Info and tutorial, and a real dug-in defence bonus (damage taken x0.8) (Dev Build v34) | Opus |
| New resource icons: money, oil, iron, electronics (Dev Build v33) | Opus |
| Research slot colours (Dev Build v31) | Opus |
| Strike and blast effects per weapon (cruise, ballistic, chemical, tactical nuclear, ICBM) and battle blasts, with repairs 1 and 2 | Opus |
| 64-nation plan (docs/NATIONS-PLAN.md) and the owner's decisions (68 playable) | Fable 5.2 |
| Recruiting Office with 5 levels | Sonnet |
| Stealth Bomber and its research | Opus |
| New city-resource economy + buildings rework (Army Base, Arms Industry; Refinery, Foundry and Rare Earth Mine replaced; Economy research moved into buildings) | Fable 5.2 |
| Classic / Persistent choice removed (always Classic) | Sonnet |
| Halt fixed (stops at once, shows whenever a force moves) | Sonnet |
| Unit panel cleanup (no Commander picker, Split in half, Build here or Deselect) | Sonnet |
| Gift $50M only for allies and coalition partners | Sonnet |
| Embargo as a real rule (cuts trade routes and market deals, partners can join, no war colours) | Sonnet |
| NAP tooltip (20 days, treaty breaker, no passage) | Sonnet |
| Enemy strength shown only with intel | Sonnet |
| No 24-hour war delay | Sonnet |
| Stance tooltips (Hold, Defend and Preserve checked) | Sonnet |
| Troops at sea slower (about 325 km/day) | Sonnet |
| Training queue limited to 2 per city | Sonnet |
| Ships never on land; fleets dock on the water by their port | Sonnet |
| One tap on a city opens its sheet with Build and Mobilize | Sonnet |
| LATER.md: radar stations, coastal batteries, anti-air sites | Opus |
| Research redesign: 10 categories, 289 steps, generations, levelled upgrades, dark military banners with sharp unit pictures | Opus (design on Fable 5.2) |
| Unit display by zoom: code-drawn unit icons everywhere, diamond counters zoomed out (mine green, allies blue, enemies red), unit pictures with flag tags zoomed in | Opus |
| New resource icons from the owner's pictures, Build box with the building's picture and countdown, Cities tab with Build and Mobilize per row, slots and sorting | Sonnet |
| Economy follow-ups: iron for nations without an iron city, offer-expired dispatches, Arms Industry I half price, clear Army Base and Arms Industry hover text, distinct resource map colours, France and Australia balanced | Fable 5.2 (last Fable task) |
| 68 playable nations (Fable 5.2 plan, Opus build): six regions plus the province split for Israel, Greece, Cuba and Belarus, near-equal tier starts, war limits by tier, victory by number of nations (land to win 6% with 68), region tabs on the start screen (classic world removed, old saves still load), merged with everything since | Opus |
| Movement look: forces turn to face where they go, ease in and out, follow roads and rails on screen, dust behind vehicles, ship wakes, infantry bob | Opus |
| Small polish: matching research slots with 'next free' time, warm night city cores, smooth Scandinavian snow, v3r2 and battery tests fixed | Sonnet |
| Realistic combat and flight animations: effects module fx.js, firing per weapon, impacts sized by weapon, hit flashes, 20 s scorch marks, settings-aware screen shake, aircraft pictures in flight with curves, bank, contrails and shadows, oval patrols, attack markers, missile warnings, sound slots, Effects High/Low/Off (phones Low), test panel with real shooters; results proven identical on High/Low/Off | Opus |
| Pinpoint movement: moves go to the exact tapped spot (last leg timed by its length), forces count in the province they stand in from the moment they cross, moving inside a province takes time, ships stop on water, Halt anywhere | Opus |
| Map wrap: the map wraps east-west across the Pacific with no seam, zoom-out and pan limits, filled edges (no black band over the Arctic) | Opus |
| Blockade and trade rework: ordered blockades by reach (frigate 80 km, cruiser 150, carrier 120, sub 40), convoys reroute around blockades, 8 chokepoints closed by 1 cruiser or 2 frigates, raids capture 25-50% of cargo, pause routes, fleets sail inside their sea zone, trade routes hidden by default with a Trade map mode, cut routes always marked red | Opus |
| Territory sales: Territory tab in Diplomacy, sell captured land (never home land or the capital), value-based price with floors 25% / 10% for coalition partners after 3 days, 3-day resale lock, offer/counter/accept/decline, the AI buys its lost or border land but never sells, troops move out | Opus |
| Attack range in km: artillery 80, rocket launchers 150 (200 with research), frigate 80, cruiser 150, submarine 40 vs ships; fire from where they stand at visible enemies, Bombard order, range circles and target rings, AI keeps guns behind the front | Opus |
| Building level pictures on the map: each building's level picture in a framed cluster next to its city, visible to all, level-up animation, own construction shown faintly with progress | Sonnet |
| Fog follow-ups: fog clearly visible outside your sight with soft circle edges, the Stealth Bomber test fixed, fog circles across the Pacific seam | Sonnet |
| Army bar and Army Info like CoN (one health bar with numbers, stats row with tick countdown, unit diamonds with Mark badges, i button with the Strength table and arrows), no health bars on the map, combat every 15 in-game minutes, healing shown with a Hospital hook, AWACS combat cover 500 km | Sonnet |
| Stack limits like CoN: land 10, air 5, sea 5; damage 1 − 0.56 × ln(size ÷ limit) with a 25% floor, speed 1 − 0.15 × ln(size ÷ limit) (min 50%); merge warnings; AI stacks at the limit, attacking from several sides (biggest AI stack 45-62 → 10); split stacks beat a 128-stack in all six duel cases | Opus |
| Battle pace 0.5 (owner approved), foreign buildings under construction shown, fighters: Interceptor the anti-bomber/anti-drone shield, Air Superiority Fighter wins dogfights | Opus (direct edits) |
| Fog of war: vision in km from where things are (city 80, airbase 100, forces 50, recon 100, aircraft 150, drones and patrols 200, UAV 250-500, AWACS 500 locate-only, maritime patrol 400, satellite strip 150), no free neighbouring provinces, no city radar; every country's buildings visible to all | Opus |
| Battle effects: gunfire and shells from the unit models onto the enemy's, smoke and fire fixed to the map and sharp at every zoom, only crossed swords when zoomed out | Opus |

## Done and public (v3.12 and earlier)

Battery saver with 60 fps while moving the map; two research slots; sharper cities; mobilization rules (Recruiting Office, Army Base, Airbase, Naval Yard); city markers removed; the rules split into rules/*.js; the new Higgsfield pictures; the short briefing and first-time tips; Arms Factory pricing; test and public builds; sleek counters, mixed-stack icon, troop models, nothing moves while zooming; GitHub repo.
