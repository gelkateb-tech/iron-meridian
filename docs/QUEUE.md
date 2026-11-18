# Iron Meridian task list

Kept up to date as tasks start and finish. Everything goes to the **Dev Build** first
(https://claude.ai/artifact/EKDR7pckn3hPkoJVuxoe7R); the public build changes only when the owner says "move to public".

**Rules for running jobs (owner, 2026-11-11 and 2026-11-13):**
- **Models:** Opus for big features and design, Sonnet for routine work, no new Fable tasks unless the owner says so.
- **Limits (owner, 2026-11-18):** at most 5 jobs at once, and only jobs that don't touch the same files or systems run together (for example map and cities wait for each other); overlapping jobs wait in the queue. (Was 2 to 3.) Small tasks get one pass; big ones one review and at most one repair.
- **Merging (2026-11-13):** every finished task is merged into master and published to the Dev Build as soon as its tests pass and it doesn't break the map, then the owner is told what changed. Only real design choices stop and wait for the owner. Map jobs merge one at a time.

Last updated: 2026-11-18 (Dev Build v58: plain helmet icons).

## Pace (owner, 2026-11-18, after the usage reset)

"Pace it so the week lasts: at most 2–3 jobs at once [raised to 5 non-overlapping jobs on 2026-11-18], Sonnet for anything routine, and Opus only for the big ones (MAP-2, the doctrines plan, the upgrades review, the research rebuild, cities, bunker and rebels). Anything that needs my decision goes under 'Waiting on me', and carry on with other jobs meanwhile."
Gemini: log every batch with the running total since the top-up; stop and ask if new spending passes $12. Art: follow docs/ART-BIBLE.md (standing rule: before fixing or redoing any picture, show the owner the problem and ask permission first).

## Running

| Job | What | Model | Branch |
|---|---|---|---|
| **MAP-2 feedback** | owner 2026-11-18: (1) country borders thin and soft zoomed out, bolder only zoomed in; (2) province lines hidden zoomed out, fading in closer; (3) foreign armies (not yours or an ally's) show only an unknown badge: no count, type or 3D models, a tap says only "Unidentified army"; exact units only through proper recon (recon units, drones, radar) like CoN. Screenshots before merging: Europe/Africa zoomed out; Afghanistan/Pakistan with a Pakistani army tapped | Opus | map-2 |
| **MAP-FIX** (owner 2026-11-18, urgent bugs) | (1) pinpoint moves: units and ships go to and stop at the exact tapped spot (pinpoint.js already fails on master: find the regression); (2) a small position dot under every army, movement lines start from it; (4) building pictures scale and move exactly with the map, no pulse or snapping; (5) 2-3 clearer dug-in marker options (show only) plus a "Dug in" label in the unit panel; screenshots or a short test of each before merging | Opus | map-fix |
| **NATION PICKER** (owner 2026-11-18) | back to the old card layout (3 columns, big flags, provinces / cities / difficulty; 2 columns on a phone; biggest powers first), keeping the search bar, the 68 nations, the AI difficulty buttons and the command-room background; desktop and 440 px screenshots before merging | Sonnet | nation-picker |
| **RESEARCH-CON** | the research tree and card rebuilt like the owner's CoN screenshots (scratchpad research-ref/); one picture lookup (type + nation + level) so the unit-looks pictures drop in; no Gemini; screenshots next to CoN before merging | Opus | research-con |
| **BUNKER** (#17) | owner 2026-11-18: go, with dug-in +10% open / +25% city; 5 levels, hidden from other nations, old saves convert; the updated protection table to the owner before merging | Opus | bunker |

## Next free slots (in this order)

1. **CITIES follow-up** (Opus, cities-3d; waits for MAP-2 and MAP-FIX, which touch the map and buildings): building pictures on land and 15-20% smaller, the Naval Yard on the real coast at Kolkata, a building under construction; keep the night lights; screenshots before merging.
2. **WEATHER fixes** (Sonnet; waits for MAP-2 and MAP-FIX, which change the map drawing; the weather is on master: cloudTex / drawWeather in index.html): owner 2026-11-18: "I like the clouds and weather, it's a good addition, just fix these: 1. The clouds keep changing colour on screen, shifting through rainbow-like tints. Find out why and fix it. They should stay natural white/grey and change only slowly and subtly with day/night. 2. The snow animation shows as white dots in a ring around the edges of the clouds. Make it look like real falling snow, only under the clouds and over the right areas. 3. The rain looks unrealistic too: it drops from everywhere around the clouds. Make it fall only from under each cloud, as soft streaks seen from above, thicker in the middle and fading at the edges. Show me a short clip or screenshots before merging." (their screenshot of the Norwegian Sea did not reach the session)
3. **BUNKER ART options** (Sonnet; waits for the bunker job): owner 2026-11-18: "The bunker picture looks flat and cartoonish next to the new buildings, and the green patch under it breaks my art rule: no ground patch, only a soft shadow. Show me 2-3 options that match the art bible, with no patch, before changing anything."

## Ready, waiting for the owner

| Job | State | Branch |
|---|---|---|
| **UNIT-ART tank sets** | done 2026-11-18 (unit-art): 45 pictures, 5 groups x 3 looks x (side / scene / top-down), $1.83 with checks (log 365 calls, about $12.10; estimated balance $39.05); 7 single-check flags and 8 three-way flags (mostly mirrored roof details on the top-downs); nothing redone; full set 1,095 pictures, about $44.49 (about $42.67 left, a top-up of about $8.6 needed to keep the $5 floor); sheets sent; NOT merged | unit-art |
| **CITIES** | done 2026-11-18 (7129852): block clusters, a quarter smaller, owner colour from the town coat, towers lower, hidden at hexPx 26 and below, brighter night windows; checks pass; faster than master except desktop day close-zoom panning +4.7% per frame (probably noise); screenshots sent | cities-3d |
| Explosion clips + FX-2 (#24) | NOT merged until the owner OKs | fx-video |

## Queued (in this order)

Owner's consolidated list of 2026-11-15 (#1-#24). Already merged and live (Dev Build v50-v52): #1, #2, #5, #6, #8, #10, #12, #13, #14, #15, plus Suez and capture by one unit. #9 is half done (the amber shield and +10% are in; the city part is new).

| # | Job | What it covers | Model |
|---|---|---|---|
| (done, plan) | **DOCTRINES plan** (owner 2026-11-15; Opus, PLAN ONLY, don't build) | write docs/DOCTRINES.md: nation groups (doctrines): US/NATO, Russia/Eastern, China, Europe, and a generic export group; every one of the 68 nations in one group; each group's identity: a small, clear strength and weakness (e.g. cheaper and faster to build vs stronger and more expensive), balanced and simple, numbers proposed; for every unit type each group's own version with a real model name per look level (1, 3, 5, 7), e.g. Main Battle Tank, Russia: T-72, T-80, T-90, T-14; US: M60, M1, M1A2, M1A2 SEPv3; the same for SAMs (S-300, Patriot...), fighters (F-16, Su-27...), helicopters (Ka-50, AH-64...), ships, drones and missiles, with small stat differences matching the real equipment; a handful of unique units only some groups get; the name shown as 'T-80 · Main Battle Tank' with the group's emblem stripe on the research card; flag likely trademarks (Apache, Black Hawk, Lightning II...) and use the bare designation (AH-64, UH-60, F-35); a shared filter for research-card pictures (e.g. a tinted monitor look with scanlines) so all unit pictures read as one set; art cost: pictures per group and in total with the Gemini cost, and the cheapest way (shared pictures for similar units). Show the owner the plan and WAIT for the OK | Opus |
| 2 | **UNIT-LOOKS** (owner 2026-11-18) | 5 groups x 3 looks for every unit (365 pictures with the 5 uniques, about $15.70 with the checks); step 1 DONE (merged 2026-11-18, prompts in docs/UNIT-LOOKS-PROMPTS.md): plan update, count and cost, the Gemini check step, the exact tank prompts for the owner (no spending); step 2 after the owner OKs the prompts: the tank sample for all 5 groups (15 pictures, about $0.60 plus checks), Gemini check on each, shown on the research card and on the map; step 3 after the owner's OK: the rest, with the check on every picture; map figures' own pictures only with the owner's permission | Sonnet |
| (done, v55; follow-ups running) | **UPGRADES review + fix** (owner 2026-11-18: go with the suggestions, fix all 6 gaps incl. aircraft speed; CoN numbers checked on constacks.com) (owner 2026-11-15; Opus; review first, change nothing until the owner has reviewed the list) | (1) research upgrades apply to ALL units of that type, new and existing, the moment the research finishes, like Conflict of Nations: units on the map, in queues and in transport get the new stats at once; the AI benefits the same way; tests updated (RESEARCH.md 2.1 already says upgrades apply to fielded units: verify it really does everywhere, report gaps); (2) docs/RESEARCH-UPGRADES.md: every upgrade in our tree grouped by unit line with what each level does, compared with Conflict of Nations using constacks.com (their unit stats at each level); mark ours that don't directly improve the unit itself (faster mobilization, cheaper training, ...) and suggest replacements that do (health, attack by target type, defence, speed, sight, range); (3) faster mobilization: no separate research node; only as an extra bonus on a unit line's final level, on top of that level's normal stat upgrade, about 15-20% faster. Show the owner the list and WAIT; then build (1) and the approved changes | Opus |
| 4 | **RESEARCH-CON** (next; the UPGRADES fix is merged; the doctrines and upgrades answers are in; waits for the owner's CoN research screenshot; its unit pictures are the UNIT-LOOKS pictures) rebuild the research tree like Conflict of Nations (owner 2026-11-15; Opus; full spec in 'RESEARCH-CON spec' below) | new cut-out pictures for every unit in the tree (list every unit first; 4 samples to the owner before the rest), blue/green/grey node states, code-drawn white upgrade symbols and category icons, calendar day column with only research days, a moving glowing today line, a shaded grid, no labels/locks/badges on nodes, one node per cell with straight vertical lines only, a CoN-style RESEARCH banner and SLOT #1/#2 boxes, plain column headers; phone screenshots of two categories next to the owner's CoN screenshot before merging | Opus |
| (done, waiting for the owner) | **CITIES** (#16, Opus) | clusters of simple 3D buildings instead of the flat grid, like Conflict of Nations: keep each city's own outline shape; inside it small extruded blocks (lit top, shaded sides, soft shadow), taller in the centre and lower at the edges, streets between them, tinted in the owner's colour; bigger cities more and taller blocks; cities about 25% smaller on the map; drawn once into a cached picture per zoom level; hidden when zoomed far out. Screenshots of Kabul, Damascus and Berlin at 3 zoom levels before merging | Opus |
| (running) | **BUNKER** (#17, new rule) | Fortifications become the Bunker, hidden from other nations. Level 1: health 20, garrison takes 33% less damage, +5% morale, upkeep 100; level 2: 40, 43%, +10%, 110; level 5: 125, 82%, +50%, 140; levels 3 and 4 smooth between (proposed: 3: 65, 56%, +20%, 120; 4: 95, 69%, +33%, 130). It shields the city's other buildings up to level 1 and protects the population up to level 5. Convert to our economy's scale. Show the owner the protection table (with and without dug-in) before building. 5 levels: the Fortifications price/cost question folds into this | Opus |
| 7 | **REBELS** (#22, new rule) | the suggested answers in docs/REBELS-PLAN.md, with one change: one level-1 infantry unit left in the captured city until it stabilises beats any rebels; an empty city still flips. Rebels get a crossed-rifles badge and show as 3D soldiers | Opus |
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

- **Conflict of Nations numbers:** constacks.com can't be read (security checkpoint; its robots.txt asks AI crawlers to stay out); taken off the allowed sites 2026-11-18. Paste the figures or send screenshots if you want them matched.
- **Research tree rebuild:** the CoN tree and card screenshots arrived (2026-11-18); the owner's own mockup did not. Starts when a job slot frees.
- **Tank sets (unit-art):** OK the look, or what to change? Open points: several look close to real tanks (US/NATO like an M1, Eastern like a T-72, Europe looks 2-3 like a Leopard 2, Export look 1 like a T-55) against the family-look rule; looks 1-3 of a group read as one tank upgraded, not new generations; the top-downs often mirror roof details (8 three-way flags); a grey shadow plate shows under the tanks on the map; scenes are photo-real; check model is gemini-3.8-flash (2.5 closed to new users). Redo any of the 15 flagged pictures? (standing rule: nothing redone without the owner)
- **CITIES (not approved yet, owner 2026-11-18):** send screenshots first of buildings on land and 15-20% smaller, the Naval Yard on the real coast at Kolkata, and a building under construction. Keep the night lights ("way better"). Follow-up job queued for the next free slot.

- **Merged in v50 with the built defaults; still open if you want to change them:** aircraft (parked aircraft keep their pictures, bigger bomber/AWACS/patrol sizes, Stealth Bomber humps, old jet/int sheets still loaded); buildings (dock basins, small rivers count, construction sites 10% bigger?, move ~93 port cities' map points to their real places?); shipping routes (fleet selection no longer shows routes, cut-off convoys hidden when off, coaster/tanker drawn in code); building rules (Army Base only or both; Fortifications price: option 2 recommended; the +40% per extra Army Base; a starting Army Base in the biggest city?).
- **Explosions (FX-2 ready):** the 'two not showing' were nuclear (the rules have no tactical nuke or ICBM, so it only appeared from test buttons) and chemical (no clip, and no chemical weapon in the rules). Add real chemical / tactical nuke / ICBM weapons to the rules (docs/RESEARCH.md 12.5: research, cost, damage, fallout, diplomacy)? OK to merge the clips?
- **Rebels plan:** answer its 9 questions (docs/REBELS-PLAN.md, each has a suggested answer) to start the build; it also fixes a bug where partisans take a province after 1 hour alone, not 24.

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
