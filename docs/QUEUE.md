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

Last updated: 2026-11-11.

## Running

| Task | Model | Where it is |
|---|---|---|
| URGENT: Dev Build fixes. A: play test at 1x/4x/8x, the AI never starts a war (only fights back), fix what the 68-nations merge broke. B: profile and speed up (target 60 fps, well under 0.5 s per game day with 68 nations). All other merges are frozen until these pass | Opus (two jobs) | Started |
| URGENT: map since the nations merge: countries not distinct (restore strong country colours from before the merge, every country standing out from its neighbours), stray straight lines, all country and province borders clear at every zoom, real-world borders checked for every country (Syria wrong), patchy country tint (e.g. only a strip over Connecticut, New York uncoloured), province borders vanishing when zoomed in, 3D army models away from their markers (rotor shapes over the zoom buttons); cause, fix, regression test, US/Europe/Russia at 3 zooms while panning, before/after screenshots | Opus | Started |
| Resources x1000 except money (stocks, production, storage, all costs) with short forms (40K, 1.2M) and full amounts with units on hover; play proven identical | Opus | Running; its merge is held until the Dev Build fixes are in |
| Research tree pictures (angled side views, from the 3D models where needed), research unit cards (one neutral line, i button with full stats per research level), infantry icons from the manpower helmet | Opus | Done on its branch; waiting for the owner's OK on the screenshots before merging |

## Queued (in this order)

| # | Task | Model |
|---|---|---|
| 1 | Buildings on the map as small 3D models at their city, like the units (every building picture tile removed from the map; pictures only in the city panel), changing by level, an HQ model at the capital, pinned with no zoom drift; screenshots at 3 zooms before merging. (The cut-out picture version was rejected and is not merged.) | Opus (next free slot) |
| 2 | Nations balance pass on today's combat rules: Iran and the United States lose too much land in some games; update v3r1 (the computer no longer offers land) and make battery.js robust to ambient sea waves | Opus (after resources x1000) |
| 3 | Each aircraft type gets its own 3D shape | Opus (after the research and icons job is merged: it built new aircraft models for the research pictures) |
| 4 | Phone app (PWA) on Netlify | Opus (needs the Netlify token) |

## Waiting for the owner

- **Battle pace** (docs/COMBAT-PACE.md): measured, even fights already last 14-21 h (small) and 31-40 h (big); the quick ones are lopsided (3:1 over in 7-12 h). Proposal: BATTLE_PACE = 0.5 (one line; 3:1 on 10 units 7 → 12 h, 100v50 13 → 22 h, even 100v100 31 → 46 h; about 10% fewer losses a day). Approve 0.5, 0.35, or keep 1?
- **Battle balance bar:** the army bar job removed the red/green balance bar over battles on the map along with the health bars (the crossed swords and red edge stay). Keep it removed?
- **Research design approvals** (docs/RESEARCH.md section 12 on branch research-redesign; nothing below is built): A. balance changes in the new tree (unit unlocks get first days 1-14, Marks become Firepower/Protection research, generations add health, IFV/Special Forces/Rocket Artillery cheaper stand-alone unlocks, 289 steps); B. new ground units (APC, Tank Destroyer, Towed Artillery, AA Gun Vehicle, Scout Vehicle); C. new aircraft (Scout Helicopter, Naval Helicopter); D. new ships (Patrol Boat, Destroyer, Ballistic-Missile Submarine); E. new weapons (sub-launched cruise and ballistic missiles, chemical and tactical nuclear warheads, ICBM); F. Officers (replace commanders, keep both, or a smaller Staff College step); G. elite marking of 4 existing units.
- **Infantry art:** the code-drawn infantry icon is a helmet (a motorized version exists); close in, infantry squads still need a u-infantry-figure picture.
- **Pictures to make on Higgsfield:** u-heavy-bomber-1, u-heavy-bomber-2, u-stealth-bomber (optional u-infantry-figure); plus for the research banners: a heavy or stealth bomber seen from above (Strategic Air, now uses the AWACS), a command or logistics picture (Command & Logistics, now the supply truck), optional paratroopers (Air Assault).
- **Netlify token** for the phone app.
- **"Move to public"** for everything under "Waiting for public" in RELEASES.md.
- **Resource-bar button:** the storage case went on the button at the left of the resource bar, which opens the missile stocks (there is no separate all-resources list). Keep it, or add an all-resources list there?
- **Building pictures size:** at play zoom the clusters are fairly big and can sit a little away from their city (e.g. Hamburg's below it toward Hanover). Smaller tiles, or fewer at play zoom?
- **Nations balance tests:** T4/T5 now count only land taken from other nations while more than a quarter of the world is unowned (docs/NATIONS-PLAN.md section 7); China's 'fights a big rival by day 60' check relaxed. OK?
- **Fog decision:** a foreign country's building under construction is hidden (finished buildings show for everyone); show it too?
- **Fable:** no Fable tasks left; new ones only if the owner says so.

## Planned for later (in LATER.md, not built yet)

Radar stations, coastal naval batteries, province anti-air sites, a Hospital; multiplayer, lobby AI, gold, premium pass, competitive mode, player levels, daily rewards, seasonal art.

## Done (on the Dev Build, waiting for public)

| Task | Model |
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
