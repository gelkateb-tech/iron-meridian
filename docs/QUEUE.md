# Iron Meridian task list

Kept up to date as tasks start and finish. Everything goes to the **Dev Build** first
(https://claude.ai/artifact/EKDR7pckn3hPkoJVuxoe7R); the public build changes only when the owner says "move to public".

**Rules for running jobs (owner, 2026-11-11 and 2026-11-13):**
- **Models:** Opus for big features and design, Sonnet for routine work, no new Fable tasks unless the owner says so.
- **Limits:** at most 2 to 3 jobs at once (urgent fixes may exceed it). Small tasks get one pass; big ones one review and at most one repair.
- **Merging (2026-11-13):** every finished task is merged into master and published to the Dev Build as soon as its tests pass and it doesn't break the map, then the owner is told what changed. Only real design choices stop and wait for the owner. Map jobs merge one at a time.

Last updated: 2026-11-15 (Dev Build v50).

## Running

| Job | What | Model | Branch |
|---|---|---|---|
| **MAP-3** merge with the new master and re-shoot | every province's roads meeting at its centre point, clearly drawn from play zoom; a sea-lane network warships follow; capture the moment a ground force reaches the centre point; pan speed within about 3-4% of before; NOT merged until the owner sees the combined screenshots | Opus | map-3 |
| **MAP-2** one consistent map texture and colours at every zoom (no tone jump when the detail tiles fade in, no pop when zooming stops); the Political/Terrain switch moves off the map into Settings > Map (with Relations/Supply) and the More menu; NOT merged until the owner sees it | Opus | map-2 |
| **START-RULES** (owner 2026-11-15): no city starts with an Army Base (capital-only Fortifications stay); Army Base I cheap and quick enough to build on day 1; the AI builds one in its capital first; First steps start with 'Build an Army Base' | Opus | start-rules |
| **UNIT-LOOKS plan** (owner 2026-11-15, planned Nov 9): 4 looks per unit by research level (levels 1, 3, 5, 7; level 8 keeps the 7 look) on the map, the army bar and the research diamonds; the plan into docs/RESEARCH.md, picture count and cost for the owner; NO generating until the owner OKs; then one unit's 4 looks first | Opus | unit-looks |

## Ready, waiting for the owner (done, not merged)

| Job | State | Branch |
|---|---|---|
| Explosion clips + FX-2 | owner: not merged for now (2026-11-14). Cruise and ballistic clips play in real games; nuclear/chemical have no weapon in the rules | fx-video |

**Merge rules:** map jobs merge one at a time, each merged with master and re-tested before the next; every look change sends the owner screenshots before it merges.

## Queued (in this order)

Owner playtest notes of 2026-11-14: part 1 (#1-#21), the rally point and the Army Base rule; part 2 (P2-1 to P2-8). Grouped by code area so each job reads its code once. Sonnet for small fixes, Opus for new rules.

| # | Job | What it covers | Model |
|---|---|---|---|
| (running) | **MAP-2** Map look and controls | #3 one consistent map texture at every zoom; #4 the Political/Terrain switch moves into the More tab as a toggle (next to Shipping routes). Map job: after MAP-1 merges; screenshots before merging | Opus |
| 2 | **REBELS** build | after the owner answers the plan's questions | Opus |
| 3 | **ART-2** more Gemini pictures from "Pictures still missing", count and cost to the owner before each batch | Sonnet |
| 4 | Phone app (PWA) on Netlify | Opus (needs the Netlify token) |

## Pictures still missing

Every picture or clip not made yet, with what it is for and its estimated cost at batch prices (about $0.04 a picture, $0.05 a banner, about $0.35 a video clip). Updated after every batch. Owner's Gemini balance: about $2 (owner, 2026-11-14, after the explosion clips). Batch 1 (ART-1, 8 pictures) cost about $0.31, so about $1.70 is left.

| Name | What it's for | Est. cost | Status |
|---|---|---|---|
| Army Base 1-5 (bn-fac-1..5) | the Army Base on the map and in the city panel, same style as the Airbase set: level 1 a temporary camp with tents and sandbags, level 5 a full permanent base | $0.21 | **done** (ART-1; levels 4-5 kept their tents and got a wider footprint) |
| Fortifications 1-5 redo (bn-fort-1..5) | less boxy fortifications (#16) | $0.18 | next batch (ART-2) |
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
| Rebel figures | 3D model in units3d.js, no Gemini picture needed | $0 | with REBELS |
| **Total** | batch 1 done ($0.31 logged: Army Base 1-5, construction 1-3, merged into master as files, drawn by BLD-MAP-2); next (Fortifications) $0.18; everything else listed about $1.9 | | |

## Waiting on me (the owner)

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
- **Fable:** no Fable tasks; new ones only if you say so.

## Planned for later (in LATER.md, not built yet)

Radar stations, coastal naval batteries, province anti-air sites, a Hospital; multiplayer, lobby AI, gold, premium pass, competitive mode, player levels, daily rewards, seasonal art.

## Done (on the Dev Build, waiting for public)

| Task | Model |
|---|---|
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
