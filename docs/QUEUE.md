# Iron Meridian task list

Kept up to date as tasks start and finish. Everything goes to the **Dev Build** first
(https://claude.ai/artifact/EKDR7pckn3hPkoJVuxoe7R); the public build changes only when the owner says "move to public".

**Rules for running jobs (owner, 2026-11-11 and 2026-11-13):**
- **Models:** Opus for big features and design, Sonnet for routine work, no new Fable tasks unless the owner says so.
- **Limits:** at most 2 to 3 jobs at once (urgent fixes may exceed it). Small tasks get one pass; big ones one review and at most one repair.
- **Merging (2026-11-13):** every finished task is merged into master and published to the Dev Build as soon as its tests pass and it doesn't break the map, then the owner is told what changed. Only real design choices stop and wait for the owner. Map jobs merge one at a time.

Last updated: 2026-11-14 (playtest notes part 1 and part 2).

## Running

| Job | What | Model | Branch |
|---|---|---|---|
| **MAP-3** roads for every province meeting at its centre point, a sea-lane network warships follow, capture the moment a unit reaches the centre; NOT merged until the owner sees it (map job, merges after the others) | Opus | map-3 |
| **FX-2** Explosions: find which two of the four explosion clips don't show and why, fix them; a real gameplay recording on the real map (cruise missile, ballistic missile, chemical strike and nuke fired at cities in a normal game) | Opus | fx-video |

## Ready, waiting for the owner (done, not merged)

| Job | State | Branch |
|---|---|---|
| **MAP-1** Real borders | Natural Earth 1:10m shapes, no hatching anywhere, mine green and every other country grey; country borders now bolder (dark casing 3.4-5.8 px with a light core, own border green and wider; province lines unchanged); screenshots sent; waiting for the owner's OK | borders-real |
| HQ flags, revision | a captured capital's HQ is destroyed; curved cloth flags, same size | hq-flags |
| **UNIT-CTRL** | a tap only selects; Move/Attack then tap; rally point button, ghost preview, flag marker, Clear | unit-ctrl |
| **UNIT-LOOK + UNIT-LOOK-2** | CoN-style badge, infantry icon C, amber dug-in shield and +10% defence; a Shipping routes setting (Settings > Map, default off: routes plus big, mid, small cargo ships, coasters and tankers); troops at sea as a grey 3D landing ship; screenshots sent | unit-look-2 |
| **BLD-MAP + BLD-MAP-2** | buildings on land, 18% smaller; construction shows the 3 Gemini pictures (crane) in turn with the progress ring, a small crane beside a building going up; Army Base 1-5 on the map and in the panel; Naval Yards on the water at their city (Kolkata on the Hooghly 19 km, 36 river ports, 284 coast, 29 in the cluster); screenshots sent | bld-map |
| Aircraft 3D shapes | every aircraft type its own model (4 choices for the owner) | aircraft-3d |
| Explosion clips | nuclear, conventional, cruise (chemical refused by the service); being fixed by FX-2 | fx-video |
| **BLD-RULES** | infantry needs Army Base I (INF_NEEDS switch; Recruiting Office now speed and manpower only), only capitals start with Fortifications (68 instead of 151), HQ/city levels removed (capital shows its regional HQ), a Fortifications cost proposal (not applied); golden re-recorded; balance passes; screenshots sent | bld-rules |
| **REBELS** plan | docs/REBELS-PLAN.md; 9 questions with suggested answers | rebels |

**Merge rules:** map jobs (MAP-*, BLD-MAP) merge one at a time, each merged with master and re-tested before the next; every look change sends the owner screenshots before it merges.

## Queued (in this order)

Owner playtest notes of 2026-11-14: part 1 (#1-#21), the rally point and the Army Base rule; part 2 (P2-1 to P2-8). Grouped by code area so each job reads its code once. Sonnet for small fixes, Opus for new rules.

| # | Job | What it covers | Model |
|---|---|---|---|
| (running) | **BLD-MAP-2** Buildings on the map, revision (branch bld-map) | P2-1 construction: keep the crane but make it look good: show the new Gemini construction pictures (site with crane, scaffolding, half-built frame) in turn while a building goes up, with the progress ring (replaces the code-drawn stages); the real Army Base pictures 1-5 on the map and in the panel (replacing the placeholder); P2-4 every Naval Yard on the water: Kolkata on the Hooghly river edge at the city (its real port), river ports on their river at the city, others on the nearest coast; check every yard. Screenshots before merging | Opus |
| (running) | **UNIT-LOOK-2** Units at sea and shipping routes (branch unit-look-2) | P2-6 a "Shipping routes" toggle in the More tab's settings, next to where the Political/Terrain toggle goes: on = the trade routes and the cargo ships on them, a mix of big and smaller ships; off = none; army units at sea never use the cargo picture: they show as a grey military landing ship (a 3D model in units3d.js like the warships, bow ramp, vehicles on deck) with their badge. Screenshots before merging | Sonnet |
| (running) | **BLD-RULES** Building rules (rules/data.js BUILD, rules/production.js, rules/state.js, build menu) | **Army Base rule**: infantry only in a city with Army Base level I (Train greyed out: "Needs Army Base level 1"), starting units unchanged, computer nations build Army Bases, old saves load; the Recruiting Office's role (owner to confirm: no longer required, keeps its speed and manpower bonuses); P2-3 at game start only the capital has Fortifications (no other city or border province starts with them; today about 150 are handed out); #16 a new Fortifications cost proposed to the owner first; #17 HQ levels removed (the capital's 'Level X' and city pictures; the HQ is one regional building) | Opus |
| 4 | **MAP-2** Map look and controls | #3 one consistent map texture at every zoom; #4 the Political/Terrain switch moves into the More tab as a toggle (next to Shipping routes). Map job: after MAP-1 merges; screenshots before merging | Opus |
| (running) | **MAP-3** Movement network and capture | #5 every province gets its roads; #6 warships follow sea lanes; #7 capture at the province centre point where roads meet, no timer. Map job; screenshots before merging | Opus |
| 6 | **REBELS** build | after the owner answers the plan's questions | Opus |
| 7 | **ART-2** more Gemini pictures from "Pictures still missing", count and cost to the owner before each batch | Sonnet |
| 8 | Phone app (PWA) on Netlify | Opus (needs the Netlify token) |

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

- **Aircraft 3D (branch aircraft-3d, done, not merged):** (1) parked aircraft: keep the 2D pictures (3D only as a stand-in while loading) or always the new 3D shapes? (2) bomber, AWACS and patrol plane drawn bigger now (1.2-1.45 tank lengths instead of 0.9): keep? (3) Stealth Bomber humps a bit rounded: flatten? (4) stop loading the unused old jet/int sheets? OK to merge?
- **BLD-MAP (revision 2 ready):** (1) dock basins drawn under river yards and under coast yards whose piers would stand on land: keep? (2) small rivers count too (Milan, Sapporo, Cairns, Darwin get river yards): keep, or only big rivers (then Bordeaux, Houston, St Petersburg go back to the coast)? (3) construction sites 10% bigger? (4) about 93 port cities have their map point more than 60 km from the sea (Cape Town, Sydney, Los Angeles, Helsinki...): a map-data job to move each city's point to its real location would bring yards (and the city drawing) to the right spot: queue it? OK to merge?
- **Building rules (BLD-RULES ready):** (1) Army Base only (built), or both buildings for infantry? (2) Fortifications price: 1 double ($72M/16K/16K, 3 days), 2 $50M/12K/12K, 3 days, +25% for each fort you already have (recommended), or 3 $60M/12K/12K, x2 per level, 3 days? (3) each extra Army Base costs 40% more (the 6th about $134M): lower it now that infantry needs one? (4) swap a starting Recruiting Office for an Army Base in the biggest city? (5) city level dropped everywhere (buildings list in the Cities tab instead): OK? OK to merge?
- **Shipping routes (UNIT-LOOK-2 ready):** (1) selecting a fleet no longer shows trade routes (the setting is the only switch): OK or restore? (2) daily supply convoys to cut-off provinces are hidden too when the setting is off: OK? (3) the coaster and tanker are drawn in code: OK, or pictures later? OK to merge?
- **Playtest jobs, choices before they start:** (a) Army Base rule: the Recruiting Office stops gating infantry and keeps its training-speed and manpower bonuses (or require both buildings?); (b) the infantry icon for the new badge: A flat helmeted head, B plain head, or C your green side-view helmet (default C); (d) REBELS plan sent (docs/REBELS-PLAN.md): answer its 9 questions (each has a suggested answer) and OK the build. It also found a bug in today's rules: partisans take a province after 1 hour alone, not 24; the build fixes it.

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
