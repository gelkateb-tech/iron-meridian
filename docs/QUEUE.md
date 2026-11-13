# Iron Meridian task list

Kept up to date as tasks start and finish. Everything goes to the **Dev Build** first
(https://claude.ai/artifact/EKDR7pckn3hPkoJVuxoe7R); the public build changes only when the owner says "move to public".

**Rules for running jobs (owner, 2026-11-11):**
- **Models:**
  - Fable 5.2 only for the economy and buildings rework. No new Fable tasks unless the owner says so.
  - Opus for big features and design.
  - Sonnet for routine work.
- **Limits:**
  - At most 2 to 3 jobs at once.
  - Small tasks get one pass with no extra review.
  - Big ones get one review and at most one repair.
- **Commits:** one commit after each finished task.

Last updated: 2026-11-13 (overnight run).

## Running

| Task | Model | Where it is |
|---|---|---|
| Picture audit: every unit, building and research item against assets and assets/art-src (read-only) | Opus (workflow) | Running |
| Real borders: every country and province border drawn from Natural Earth 1:10m with no shape-changing simplification (game logic stays on the cells), every country clearly coloured, all borders visible; screenshots of the Middle East, Europe and the US next to a real map before merging | Opus | Started (branch borders-real) |
| Map modes: switching Political/Relations/Supply/Terrain/... glitches the map; find and fix the cause, test every switch and fast switching; screenshots before merging | Opus | Started (branch map-modes) |
| Research tree pictures, research unit cards, infantry icons | Opus | Done on branch research-cards; waiting for the owner |

## Queued (in this order)

| # | Task | Model |
|---|---|---|
| 1 | Building pictures in the game: the angled pictures (regional capital HQs; Airbase, Naval Yard, Recruiting Office, Fortifications, Hospital levels) cut out and cropped, replacing the old ones on the map and in the city panel; Naval Yard on the real coast, mirrored so its piers face the sea; screenshots of Berlin and a coastal city at 3 zooms before merging | Opus (next free slot, after the audit) |
| 2 | Speed, round 2 with identical results: the targets not yet met (well under 0.5 s per game day; steady 60 fps while panning) | Opus (after the border rebuild, which changes the map drawing) |
| 3 | Small fixes: 'BERLIN · BERLIN' map labels, phone Market table and cards, battery.js and v3air test robustness | Sonnet |
| 4 | Strike fighter files renamed (bomber.webp is the Strike Fighter); the B-1 upload as the Heavy Bomber picture and the stealth-bomber upload for the Stealth Bomber, cut out and matched; screenshots before merging | Sonnet |
| 5 | Start screen: the menu panel in the centre, background still visible; new campaign screen without region tabs: all nations on one scrollable A-Z list with flag, name and a search box; phones too; screenshots before merging | Sonnet |
| 6 | Nations balance pass (Iran and the US losing too much land): re-measure now that computer nations never start wars; battery.js robustness | Sonnet |
| 7 | Each aircraft type gets its own 3D shape | Opus (after research-cards is merged) |
| 8 | Phone app (PWA) on Netlify | Opus (needs the Netlify token) |
| 9 | Capital HQ flag drawn in code on the HQ's flagpoles | Opus (after the building pictures are on the map) |

## Waiting on me (the owner)

- **Infantry map icon:** three candidates: A flat helmeted head with a wheel for motorized, B plain head (both on branch research-cards), C the green side-view helmet (branch claude/zen-cori-mae3e9, and the uploaded helmet-icons.png). Pick one, and say "merge" for the research cards and pictures.
- **research-slots** (branch, done 2026-11-12, never merged): slot colours on research bars and tags. Merge?
- **Building art:** the angled set now has Airbase, Naval Yard (branch claude/zen-cori-mae3e9), Recruiting Office, Fortifications and Hospital levels 1-5 and the 7 regional HQs. Still missing: Army Base, Missile Silo and Arms Industry 1-5 (until then the map shows nothing for them and the city panel keeps their old pictures). Who makes them?
  - Fortifications: the game has 3 levels, the new set has 5. For now game levels 1-3 use pictures 1, 3 and 5. Make the game 5 levels instead?
  - Hospital pictures show a red cross, a protected emblem the Red Cross asks games not to use: swap it for a green or white medical cross?
  - Recruiting Office level 1 has a flag on a pole although the style says no flags: keep or remove?
- **Forward Airstrip:** 5 levels or 3?
- **Faster game days:** getting well under 0.5 s per game day may need changes to how computer nations think (quiet nations plan every 8 hours, a shorter attack-target search, reusing routes across hours). Want any of them?
- **Market prices** are shown per 1,000 units (for example '$2.70M / 1K'). OK?
- **Research design approvals:** item 3 (Generations) and the new ground units list (docs/RESEARCH.md section 12).
- **Pictures:** the two research banners (Strategic Air now uses the AWACS; Command & Logistics the supply truck).
- **Netlify token** for the phone app; **"move to public"** for everything under 'Waiting for public' in RELEASES.md.
- **Nations balance tests:** T4/T5 count only land taken from other nations while more than a quarter of the world is unowned; China's 'fights a big rival by day 60' check relaxed. OK?
- **Cleanup:** delete the rejected building branches (buildings-3d, building-fix, buildings-cutout) and the old wip/* snapshot branches once checked to be on master?
- **Fable:** no Fable tasks; new ones only if you say so.

## Planned for later (in LATER.md, not built yet)

Radar stations, coastal naval batteries, province anti-air sites, a Hospital; multiplayer, lobby AI, gold, premium pass, competitive mode, player levels, daily rewards, seasonal art.

## Done (on the Dev Build, waiting for public)

| Task | Model |
| Resources x1000 except money (stocks, production, storage, all costs), short forms (40K, 1.2M), full amounts with units on hover, market prices per 1,000 units; merged with the fixes, play proven identical (6 games, 30 days), old saves scaled once (Dev Build v30) | Opus |
| URGENT Dev Build fix A: computer nations never start a war (they fight back fully; allies join only to defend), play test at 1x/4x/8x, merge breakage (v3r1) | Opus |
| URGENT Dev Build fix B: speed-ups with identical play (rules per game day 1.19 s → about 0.55 s CPU; longest freeze at 8x 476 → 95 ms). Not fully met: 'well under 0.5 s' and 60 fps while panning; faster options change AI play (owner to decide) | Opus |
| URGENT map fix: every country its own strong colour (no two neighbours alike), allies blue, tint and province/country borders clear at every zoom, sea outline (straight lines) removed, real country borders (Syria checked: data correct, wiggle removed) | Opus |
|---|---|
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
