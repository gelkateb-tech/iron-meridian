# Iron Meridian task list

Kept up to date as tasks start and finish. Everything goes to the **Dev Build** first
(https://claude.ai/artifact/EKDR7pckn3hPkoJVuxoe7R); the public build changes only when the owner says "move to public".

**Rules for running jobs (owner, 2026-11-11 and 2026-11-13):**
- **Models:** Opus for big features and design, Sonnet for routine work, no new Fable tasks unless the owner says so.
- **Limits:** at most 2 to 3 jobs at once (urgent fixes may exceed it). Small tasks get one pass; big ones one review and at most one repair.
- **Merging (2026-11-13):** every finished task is merged into master and published to the Dev Build as soon as its tests pass and it doesn't break the map, then the owner is told what changed. Only real design choices stop and wait for the owner. Map jobs merge one at a time.

Last updated: 2026-11-15 (Dev Build v52; paused for the owner's usage reset).

## PAUSED until the owner's usage reset (Tuesday 11 PM)

Owner, 2026-11-15: "Let the running jobs reach a safe stopping point, commit and push their work to their branches, then pause everything. Don't start any new jobs until the reset on Tuesday at 11 PM. Then pick up from QUEUE.md in order."
After the reset: Sonnet for small fixes, Opus for new rules and big features. Log every Gemini batch with the running total since the top-up (owner topped up to about $15; the log stood at 199 calls, about $8.10, before it); stop and ask if the new spending passes $12.

## Paused mid-way (pushed to its branch)

| Job | State | Branch |
|---|---|---|
| **MAP-2** one map texture at every zoom (#3); Political/Terrain toggle off the map into Settings > Map next to Shipping routes (#4) | paused at a safe point (head ee66c0f, pushed). Done: switch moved into Settings > Map and the More menu; one look at every zoom (brightness spread across zooms cut from about 5 to about 1, sea from 19 to 4, night 3.2 to 0.3; strips in the scratchpad map2/). Left: re-run map-zoom-look and map-modes (desktop, phone), map-consistency, night-lights, borders-real, black-map, controls, nat-oldsave, smoke 10, perf-ui vs master; then the owner's look and merge. Owner notes: mountains close up are now the texture's pale grey (not the warmer brown the detail added) | map-2 |

## Ready, waiting for the owner

| Job | State | Branch |
|---|---|---|
| Explosion clips + FX-2 (#24) | the code-drawn explosions are dropped (deleted branch); cruise and ballistic clips play in real games; the "two not showing" were nuclear and chemical: the rules have no such weapons yet (owner: chemical/nuclear later, #23); real gameplay recording sent 2026-11-14; NOT merged until the owner OKs | fx-video |

## Queued after the reset (in this order)

Owner's consolidated list of 2026-11-15 (#1-#24). Already merged and live (Dev Build v50-v52): #1, #2, #5, #6, #8, #10, #12, #13, #14, #15, plus Suez and capture by one unit. #9 is half done (the amber shield and +10% are in; the city part is new).

| # | Job | What it covers | Model |
|---|---|---|---|
| 1 | **MAP-2 finish** | see "Paused mid-way" | Opus |
| 2 | **BADGE-CON** (#7, owner: "Sonnet, now") + dug-in in cities (#9) | match the owner's Conflict of Nations screenshot exactly (reference: the owner's upload, a copy in the scratchpad badgecon/con-ref-1.jpg). Zoomed in: two stacked rectangles of the same width: the owner's real flag on top (atlas flag with emblems, crisp, slight fabric sheen, thin dark edge, soft drop shadow) and a bar in the side colour (mine green, allies blue, enemies red, neutral grey) with the count in big bold italic white, right-aligned; a white rounded-square tag with the unit icon overlapping the bar's left edge, half in, half out. Zoomed out: only a square in the side colour with the white icon tag centred, no flag, no count. Sizes on a ~440 px phone: badge 52 px wide, flag 20 px tall, bar 26 px, count ~19 px, tag 18x18 with a 15 px icon; zoomed-out square 28x28 with the same tag; scale with the map's UI scale on desktop; if the map view is ever tilted, lay the badge flat at that tilt. Icons flat navy on the white tag; infantry EXACTLY the owner's SVG (below), motorized = the same helmet with a small wheel under it; other types their own icons in the same flat navy-on-white style. Dug-in (#9): the amber shield stays; the bonus becomes +10% defence in the open and +25% inside a city (replacing, not adding). Phone screenshots zoomed in and zoomed out next to the CoN screenshot before merging | Sonnet |
| 3 | **ART-2** art style and rule (#18, #19) + first pictures (#11 tank sample, #20 level 1 of all 8 buildings) | write the new art style into tools/gen-art.py so every batch uses it: the clean polished feel of Conflict of Nations (crisp 3D game models, simplified shapes, clear silhouettes, bright natural colours, soft even lighting) but a little more realistic to match the satellite-style map (real concrete, metal, asphalt, grass, subtle wear, natural colours; not toy-like, not a photo; our own designs, no copies); write the rule into docs (one design per type: make level 1, then each next level by editing the previous picture so it reads as the same building growing); then generate (batch, one try, logged, running total) level 1 of the 8 buildings: Army Base (temporary camp), Airbase (runway along the top, no air-defence launchers), Naval Yard (no coast drawn, piers to the bottom right), Missile Silo, Arms Industry, Recruiting Office, Hospital (green or white cross, never red), Fortifications bunker as a cutaway (a rounded chunk of ground cut open showing the bunker); regional HQs stay as they are. And the Main Battle Tank's looks 2-4 (#11: each made by editing the previous look so the unit keeps its shape; owner said yes to all 6 questions in RESEARCH.md 14.11). Show both to the owner and stop | Sonnet |
| 4 | **ART-3** buildings levels 2-5 in the new style, each by editing the previous level (after the owner OKs the 8 level-1 pictures); Airbase level 5 with bombers; then wire them in, replacing the old pictures | Sonnet |
| 5 | **DOCTRINES plan** (owner 2026-11-15; Opus, PLAN ONLY, don't build) | write docs/DOCTRINES.md: nation groups (doctrines): US/NATO, Russia/Eastern, China, Europe, and a generic export group; every one of the 68 nations in one group; each group's identity: a small, clear strength and weakness (e.g. cheaper and faster to build vs stronger and more expensive), balanced and simple, numbers proposed; for every unit type each group's own version with a real model name per look level (1, 3, 5, 7), e.g. Main Battle Tank, Russia: T-72, T-80, T-90, T-14; US: M60, M1, M1A2, M1A2 SEPv3; the same for SAMs (S-300, Patriot...), fighters (F-16, Su-27...), helicopters (Ka-50, AH-64...), ships, drones and missiles, with small stat differences matching the real equipment; a handful of unique units only some groups get; the name shown as 'T-80 · Main Battle Tank' with the group's emblem stripe on the research card; flag likely trademarks (Apache, Black Hawk, Lightning II...) and use the bare designation (AH-64, UH-60, F-35); a shared filter for research-card pictures (e.g. a tinted monitor look with scanlines) so all unit pictures read as one set; art cost: pictures per group and in total with the Gemini cost, and the cheapest way (shared pictures for similar units). Show the owner the plan and WAIT for the OK | Opus |
| 6 | **UNIT-LOOKS** the other unit looks: PAUSED after the tank sample (owner 2026-11-15): no other unit pictures until the DOCTRINES plan is approved, since the pictures depend on it; then wire looks into the map, army bar and research tree (RESEARCH.md 14) | Sonnet (art), Opus (wiring) |
| 7 | **UPGRADES review** (owner 2026-11-15; Opus; review first, change nothing until the owner has reviewed the list) | (1) research upgrades apply to ALL units of that type, new and existing, the moment the research finishes, like Conflict of Nations: units on the map, in queues and in transport get the new stats at once; the AI benefits the same way; tests updated (RESEARCH.md 2.1 already says upgrades apply to fielded units: verify it really does everywhere, report gaps); (2) docs/RESEARCH-UPGRADES.md: every upgrade in our tree grouped by unit line with what each level does, compared with Conflict of Nations using constacks.com (their unit stats at each level); mark ours that don't directly improve the unit itself (faster mobilization, cheaper training, ...) and suggest replacements that do (health, attack by target type, defence, speed, sight, range); (3) faster mobilization: no separate research node; only as an extra bonus on a unit line's final level, on top of that level's normal stat upgrade, about 15-20% faster. Show the owner the list and WAIT; then build (1) and the approved changes | Opus |
| 8 | **RESEARCH-CON** rebuild the research tree like Conflict of Nations (owner 2026-11-15; Opus; full spec in 'RESEARCH-CON spec' below) | new cut-out pictures for every unit in the tree (list every unit first; 4 samples to the owner before the rest), blue/green/grey node states, code-drawn white upgrade symbols and category icons, calendar day column with only research days, a moving glowing today line, a shaded grid, no labels/locks/badges on nodes, one node per cell with straight vertical lines only, a CoN-style RESEARCH banner and SLOT #1/#2 boxes, plain column headers; phone screenshots of two categories next to the owner's CoN screenshot before merging | Opus |
| 9 | **CITIES** (#16, Opus) | clusters of simple 3D buildings instead of the flat grid, like Conflict of Nations: keep each city's own outline shape; inside it small extruded blocks (lit top, shaded sides, soft shadow), taller in the centre and lower at the edges, streets between them, tinted in the owner's colour; bigger cities more and taller blocks; cities about 25% smaller on the map; drawn once into a cached picture per zoom level; hidden when zoomed far out. Screenshots of Kabul, Damascus and Berlin at 3 zoom levels before merging | Opus |
| 10 | **BUNKER** (#17, new rule) | Fortifications become the Bunker, hidden from other nations. Level 1: health 20, garrison takes 33% less damage, +5% morale, upkeep 100; level 2: 40, 43%, +10%, 110; level 5: 125, 82%, +50%, 140; levels 3 and 4 smooth between (proposed: 3: 65, 56%, +20%, 120; 4: 95, 69%, +33%, 130). It shields the city's other buildings up to level 1 and protects the population up to level 5. Convert to our economy's scale. Show the owner the protection table (with and without dug-in) before building. 5 levels: the Fortifications price/cost question folds into this | Opus |
| 11 | **REBELS** (#22, new rule) | the suggested answers in docs/REBELS-PLAN.md, with one change: one level-1 infantry unit left in the captured city until it stabilises beats any rebels; an empty city still flips. Rebels get a crossed-rifles badge and show as 3D soldiers | Opus |
| 12 | Phone app (PWA) on Netlify | needs the Netlify token | Opus |
| later | Chemical and nuclear weapons (#23): owner will go through them first | | |

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
| New-style buildings, level 1 of 8 (Army Base, Airbase, Naval Yard, Missile Silo, Arms Industry, Recruiting Office, Hospital, Fortifications bunker cutaway) | owner #20: everything redone in the new style | $0.32 | queued (ART-2) |
| New-style buildings, levels 2-5 of the 8 (32 pictures, each edited from the previous level) | owner #20 | $1.30 | after the owner OKs level 1 (ART-3) |
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

- **Merged in v50 with the built defaults; still open if you want to change them:** aircraft (parked aircraft keep their pictures, bigger bomber/AWACS/patrol sizes, Stealth Bomber humps, old jet/int sheets still loaded); buildings (dock basins, small rivers count, construction sites 10% bigger?, move ~93 port cities' map points to their real places?); shipping routes (fleet selection no longer shows routes, cut-off convoys hidden when off, coaster/tanker drawn in code); building rules (Army Base only or both; Fortifications price: option 2 recommended; the +40% per extra Army Base; a starting Army Base in the biggest city?).
- **Explosions (FX-2 ready):** the 'two not showing' were nuclear (the rules have no tactical nuke or ICBM, so it only appeared from test buttons) and chemical (no clip, and no chemical weapon in the rules). Add real chemical / tactical nuke / ICBM weapons to the rules (docs/RESEARCH.md 12.5: research, cost, damage, fallout, diplomacy)? OK to merge the clips?
- **Unit looks by research level (plan in docs/RESEARCH.md section 14):** 71 new pictures for all 24 unit sets, about $2.84; $1.70 covers 13 units (38 pictures, about $1.52: tank, artillery, SAM, frigate, cruiser, submarine, IFV, strike fighter, interceptor, attack helicopter, Recon UAV, rocket artillery, carrier); sample first: the Main Battle Tank (3 pictures, about $0.12). 6 questions in 14.11 (suggested: yes to all). OK to make the tank sample?
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
