# Iron Meridian task list

Kept up to date as tasks start and finish. Everything goes to the **Dev Build** first
(https://claude.ai/artifact/EKDR7pckn3hPkoJVuxoe7R); the public build changes only when the owner says "move to public".

**Rules for running jobs (owner, 2026-11-11 and 2026-11-13):**
- **Models:** Opus for big features and design, Sonnet for routine work, no new Fable tasks unless the owner says so.
- **Limits:** at most 2 to 3 jobs at once (urgent fixes may exceed it). Small tasks get one pass; big ones one review and at most one repair.
- **Merging (2026-11-13):** every finished task is merged into master and published to the Dev Build as soon as its tests pass and it doesn't break the map, then the owner is told what changed. Only real design choices stop and wait for the owner. Map jobs merge one at a time.

Last updated: 2026-11-14 (owner playtest notes added).

## Running

| Task | Model | Where it is |
|---|---|---|
| **MAP-1** Real borders from Natural Earth 1:10m; owner playtest 2026-11-14: no diagonal lines over any country anywhere (#1), back to the old look: every other country greyish, mine greenish (#2, replaces 'every country its own colour'), borders kept visible | Opus | branch borders-real (merges next; screenshots first) |
| HQ flags, revision DONE, NOT merged (screenshots sent): a captured capital's HQ is destroyed (the city's other buildings stay); the new capital gets its HQ and flag; flags drawn as curved cloth with a rolling fold and shading, faint edge, same size; waiting for the owner's OK | Opus | branch hq-flags |
| **UNIT-CTRL** (queue #1): a tap only selects; moves only after Move; rally point button, preview ghost, flag marker, Clear | Sonnet | branch unit-ctrl |
| Each aircraft type its own 3D shape: DONE, NOT merged (look change: sheets and shots sent); note: in normal play parked aircraft show their 2D pictures, the 3D shapes only while a picture loads; bomber/AWACS/patrol drawn bigger (1.2-1.45 tank lengths) | Opus | branch aircraft-3d |
| **UNIT-LOOK** (queue #3): CoN-style badge (big flag across the top, icon upright, count in a corner, infantry icon C by default), new dug-in icon 5% bigger and +10% defence in total, trade cargo ships back at sea | Sonnet | branch unit-look-2 |
| Explosion video clips from Gemini Omni 1.2 Flash: nuclear, conventional (bombers, ballistic) and cruise made (3 x 5 s, about $1.06); the chemical clip was refused twice by the service ($0), chemical keeps the drawn gas; sprite sheets played on the map, 30 s craters left behind (ported from explosions-code, which is deleted); DONE, NOT merged: waiting for the owner's OK | Opus | branch fx-video |

**Merge rules:** map jobs (MAP-*, BLD-MAP) merge one at a time, each merged with master and re-tested before the next; every look change sends the owner screenshots before it merges.

## Queued (in this order)

Owner playtest notes of 2026-11-14 (numbers #1-#21), the rally point and the Army Base rule, grouped by code area so each job reads its code once. Sonnet for small fixes, Opus for new rules.

| # | Job | What it covers | Model |
|---|---|---|---|
| (running) | **UNIT-CTRL** Unit controls (index.html tap(), command bar, city panel) | #9 a tap on a unit only selects it and opens its bar; it moves only after Move (no tap-to-move on empty land; right-click and drag orders stay for desktop); **Rally point**: remove the automatic ghost unit that walks from the city after training (new units stay in their city by default); a "Rally point" button in the city panel, then a tap on the map sets it, with the ghost unit walking the path as a preview while setting; once set only a small flag marker at the point, no ghost; a button to clear it (builds on the existing S.rally / setRally). Screenshots before merging | Sonnet |
| 2 | **BLD-RULES** Building rules (rules/data.js BUILD, rules/production.js, build menu) | **Army Base rule**: infantry (all four types) can be trained only in a city with Army Base level I; until then the Train button is greyed out with "Needs Army Base level 1"; starting units unchanged; computer nations build Army Bases; old saves load; a temporary code-drawn Army Base picture (small camp, tents, fence) until the real art exists. Recruiting Office: proposed to stop gating infantry and keep its training-speed and manpower bonuses (owner to confirm). #16 Fortifications cost: propose a new cost to the owner first (today $36M / 8 materials / 8 iron, x1.6 per level; 151 level-I forts exist on day 0, almost all given at the start to tier B/C border provinces and tier C capitals, the AI builds few). #17 HQ levels: the HQ has no levels in the rules; what shows is the city level (capital +1, 'Level X · capital' and the b-city pictures in the panels, from the v2 art integration of 2026-11-05, never an owner request): remove it so the capital shows its one regional HQ, no level | Opus |
| (running) | **UNIT-LOOK** Units on the map (badge, dug-in, cargo ships) | #8 the unit badge like the Conflict of Nations screenshots: a square badge with a big flag across the top, the unit icon upright under it, the count in a corner; the new infantry icon (owner to pick A, B or C, default C, the owner's green side-view helmet); #10 a new, clearer dug-in icon, 5% bigger and more visible, and the dug-in bonus becomes +10% defence in total (DIG_DEF 0.8 → 1/1.1), replacing the current one, not added on top; #11 the bigger cargo ships back on the sea for trade (u-cargo-ship is now used for troops at sea, the close-zoom cargo picture was switched off in v3.4, and trade ships only show with a fleet selected): trade cargo ships always visible at sea with their own picture, troops keep theirs. Screenshots before merging | Sonnet |
| 4 | **MAP-2** Map look and controls (terrain drawing, mode switch) | #3 one consistent map texture at every zoom: the detail tiles that fade in at normal play zoom (hexPx 16-30, their colour normaliser is switched off), the grain layers and the lower-detail renders while zooming change colour and style; make every zoom the same colours and style; #4 the Political/Terrain switch leaves the map and becomes a toggle in the More menu (Relations and Supply overlays go with it). Map job: after MAP-1 merges; screenshots before merging | Opus |
| 5 | **BLD-MAP** Buildings on the map (drawBuildings, bnLayout, bnShore, construction) | #12 every building on land at its city (only the Naval Yard is checked against water today); #13 15-20% smaller; #14 every Naval Yard on the real coast at its city with its piers facing the sea (Kolkata's ends up on a minor river 30-35 km east because the sea is far and the Hooghly spot is taken by the Recruiting Office); #15 construction: foundations first, then the building rising in stages with scaffolding and dust, plus the progress ring (instead of the crane); #16 the new Fortifications pictures once made; the real Army Base pictures once made. Map job: after MAP-2; screenshots before merging | Opus |
| 6 | **MAP-3** Movement network and capture (rules/movement.js, rules/map.js, tools/build-lines.js, roads drawing) | #5 every province gets its roads (1,045 provinces have no road above a track today; 452 have only invisible straight gap-fill tracks; 98 are islands with no land neighbour); #6 warships follow a network of sea lanes the way land units follow roads (not the cargo routes; today ships take straight hops between sea zones with a small lane bonus); #7 capture as in Conflict of Nations: each province has one centre point where its roads meet, and a unit captures the province the moment it reaches that point, no timer (today: within 25 km of the province's centroid). New rules: play checked before and after. Map job: after BLD-MAP; screenshots before merging | Opus |
| 7 | **REBELS** New rule, plan first (rules/economy.js unrest and partisans, units3d.js figures) | #18 occupied cities only (not the original ones): when morale drops below 30%, rebels appear and can take the city; keeping soldiers there until morale recovers is the counter, so nobody expands too fast; #19 rebels shown as 3D soldier figures like other units (a new irregulars squad model, visible at the same zoom as other units). Also the 'capital lost' idea: the HQ destroyed and morale of the nation's cities falling until they rebel (the owner said homeland and occupied cities there, but occupied only here: the plan asks which). Builds on what exists: unrest, partisans above 60% unrest that take a province after 24 h alone, morale = 100 - unrest - war damage. **Show the owner the plan before building** | Opus |
| 8 | **ART-1** Pictures on Gemini (tools/gen-art.py, batch, one try each, cost logged): see "Pictures still missing"; the count and cost go to the owner before each batch; stop if the balance runs low | Sonnet |
| 9 | Phone app (PWA) on Netlify | Opus (needs the Netlify token) |

## Pictures still missing

Every picture or clip not made yet, with what it is for and its estimated cost at batch prices (about $0.04 a picture, $0.05 a banner, about $0.35 a video clip). Updated after every batch. Owner's Gemini balance: about $3.84 before the explosion clips, about $2.78 after them ($1.06 logged).

| Name | What it's for | Est. cost | Status |
|---|---|---|---|
| Army Base 1-5 (bn-fac-1..5) | the Army Base on the map and in the city panel, same style as the Airbase set (until then a code-drawn camp placeholder) | $0.18 | needed now (Army Base rule) |
| Fortifications 1-5 redo (bn-fort-1..5) | less boxy fortifications (#16) | $0.18 | needed now |
| Dug-in icon | the new dug-in mark on the unit badge (#10) | $0.04 | needed now (or drawn in code) |
| Construction stages x3 (foundation, scaffolding, rising) | the construction animation (#15) | $0.11 | needed now (or drawn in code) |
| Missile Silo 1-5 (bn-silo-1..5) | the Missile Silo on the map (nothing shows today) | $0.18 | waiting |
| Arms Industry 1-5 (bn-arms-1..5) | the Arms Industry on the map (nothing shows today) | $0.18 | waiting |
| Research art retries x10 | diamond frame drawn inside 7 icons (ri-cat-sup, ri-msl2, ri-t-pr, ri-at_warhead, ATGM, ri-sdrone_hit, ri-sat1), Strategic Weapons banner cut off (rbs-msl), wrong subject on 2 (ri-spec_airlift, ri-sam_seek) | $0.45 | waiting on the owner |
| Research icons too close to real products x8 | F-15, MQ-9, F-22/F-35, B-2, Nimitz, AH-1, P-3, Abrams look-alikes | $0.35 | waiting on the owner |
| Firepower / Protection air and naval variants x4 | the shared upgrade icons show a tank turret on aircraft and ship lines | $0.18 | waiting on the owner |
| Infantry figure (u-infantry-figure) | the standing infantry figure for the zoomed-in map (still absent) | $0.04 | waiting |
| Heavy Bomber generation 2 | its own picture instead of sharing generation 1's | $0.04 | waiting on the owner |
| Hospital 1-5 with a green or white cross | only if the Hospital becomes a building (the red cross is a protected emblem) | $0.18 | waiting on the owner |
| Recruiting Office 1 without the flag | style says no flags | $0.04 | waiting on the owner |
| Chemical explosion clip (fxv-chemical) | chemical strikes (the service refused it twice; the owner decides whether to try other wording) | $0.35 | waiting on the owner |
| Rebel figures | 3D model in units3d.js, no Gemini picture needed | $0 | with REBELS |
| **Total** | needed now about $0.51; everything listed about $2.15 (the explosion clips are paid separately on the fx-video job) | | |

## Waiting on me (the owner)

- **Aircraft 3D (branch aircraft-3d, done, not merged):** (1) parked aircraft: keep the 2D pictures (3D only as a stand-in while loading) or always the new 3D shapes? (2) bomber, AWACS and patrol plane drawn bigger now (1.2-1.45 tank lengths instead of 0.9): keep? (3) Stealth Bomber humps a bit rounded: flatten? (4) stop loading the unused old jet/int sheets? OK to merge?
- **Playtest jobs, choices before they start:** (a) Army Base rule: the Recruiting Office stops gating infantry and keeps its training-speed and manpower bonuses (or require both buildings?); (b) the infantry icon for the new badge: A flat helmeted head, B plain head, or C your green side-view helmet (default C); (c) ART-1 first batch: Army Base 1-5, Fortifications 1-5, dug-in icon, 3 construction stages = 14 pictures, about $0.51, OK to spend?; (d) REBELS plan comes to you before it is built.

- **Economy over time (nations re-check, nothing broken):** with peaceful computer nations, every nation's net income falls about 65-70% by day 60 while its army triples or quadruples, so all end near zero income with a small treasury; the big powers hardly grow (102-104% of their start land) and independent land is almost all taken by day 30. Change anything (cheaper upkeep, an army cap for computer nations, slower expansion)?
- **Building pictures (merged v48):** (1) Fortifications levels I-III use pictures 1, 3, 5: OK? (2) Army Base, Silo, Arms Industry still need angled pictures (nothing on the map for them yet); (3) Hamburg's Naval Yard sits on the Elbe bank: OK, or always the sea? (4) ports far from water (Berlin, Oslo, Helsinki) keep the yard in the city cluster: OK? (5) cast shadows kept see-through: keep, or a small contact shadow? (6) mid-zoom pictures are small (about 30-40 px): bigger?

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
- **Fable:** no Fable tasks; new ones only if you say so.

## Planned for later (in LATER.md, not built yet)

Radar stations, coastal naval batteries, province anti-air sites, a Hospital; multiplayer, lobby AI, gold, premium pass, competitive mode, player levels, daily rewards, seasonal art.

## Done (on the Dev Build, waiting for public)

| Task | Model |
|---|---|
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
