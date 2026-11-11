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
| 68 playable nations, region by region (plumbing, province split for Israel, Greece, Cuba and Belarus, then Europe, Middle East, Africa, Asia, Americas, Oceania) | Opus | Province split step done, regions next |
| Stack limits like CoN: land 10, air 5, sea 5; damage 1 − 0.56 × ln(size ÷ limit) with a 25% floor (owner's choice); speed 1 − 0.15 × ln(size ÷ limit), never below 50%; merge warning; AI keeps stacks at the limit and attacks from several sides; 128-stack vs 10-stacks test | Opus | Started |
| Fog of war: the owner's vision ranges in km from where things actually are, per unit type, no automatic neighbouring provinces, no city radar; every country's buildings visible to all | Opus | Started |

## Queued (in this order)

| # | Task | Model |
|---|---|---|
| 1 | Army bar and Army Info like CoN (shows the stack penalty too) (no floating health bars, one stack health bar, stats row, unit diamonds with badges, i button, Strength table), combat every 15 in-game minutes, healing; battle pace **proposal** (see Waiting) | Sonnet (starts after stack limits and fog are merged) |
| 2 | Building level pictures on the map: every building shows its level picture on or next to its city | Sonnet |
| 3 | Map fills the screen and wraps left to right like a globe (no black edges, ocean and Antarctica fill) | Opus |
| 4 | Attack range: artillery, rocket launchers, warships and missiles hit targets in range without moving in; range circles | Opus |
| 5 | Pinpoint movement for land units and ships (move to the exact spot; Halt for ships) | Opus |
| 6 | Movement look: units turn to face where they go, dust, wakes, contrails, follow roads on screen | Opus |
| 7 | Aircraft in flight drawn with their own unit pictures (rotated, shadow, contrail) | Opus |
| 8 | Each aircraft type gets its own 3D shape | Opus |
| 9 | Territory sales in diplomacy (captured territory only, price from the province's value, 25% / 10% coalition floors, 3-day no-resale; the AI never sells) | Opus |
| 10 | Blockade and trade rework: Blockade button next to Escort and Raid, warships in range can blockade or raid, raids capture 25-50% of cargo, pause a route, marked blocked routes, convoys reroute around stacks, chokepoints (Hormuz, Malacca, Gibraltar, Suez), slower and poorer detours | Opus (was Fable) |
| 11 | Strike effects, optional small repair 3: chemical cloud easier to read at mid zoom, ICBM ground fires, blast size order, sparks, seams in battle smoke | Opus |
| 12 | Small polish: research slot colours and "Both slots busy" time, night city cores, Sweden snow edge, Berlin garrison placement | Sonnet |
| 13 | Phone app (PWA) on Netlify | Opus (needs the Netlify token) |

## Waiting for the owner

- **Battle pace:** the army bar job will propose damage-per-tick numbers (even fights several hours, big ones a day or more) in docs/COMBAT-PACE.md; nothing is applied until approved.
- **Research design approvals** (docs/RESEARCH.md section 12 on branch research-redesign; nothing below is built): A. balance changes in the new tree (unit unlocks get first days 1-14, Marks become Firepower/Protection research, generations add health, IFV/Special Forces/Rocket Artillery cheaper stand-alone unlocks, 289 steps); B. new ground units (APC, Tank Destroyer, Towed Artillery, AA Gun Vehicle, Scout Vehicle); C. new aircraft (Scout Helicopter, Naval Helicopter); D. new ships (Patrol Boat, Destroyer, Ballistic-Missile Submarine); E. new weapons (sub-launched cruise and ballistic missiles, chemical and tactical nuclear warheads, ICBM); F. Officers (replace commanders, keep both, or a smaller Staff College step); G. elite marking of 4 existing units.
- **Infantry art:** the code-drawn infantry icon is a helmet (a motorized version exists); close in, infantry squads still need a u-infantry-figure picture.
- **Pictures to make on Higgsfield:** u-heavy-bomber-1, u-heavy-bomber-2, u-stealth-bomber (optional u-infantry-figure); plus for the research banners: a heavy or stealth bomber seen from above (Strategic Air, now uses the AWACS), a command or logistics picture (Command & Logistics, now the supply truck), optional paratroopers (Air Assault).
- **Netlify token** for the phone app.
- **"Move to public"** for everything under "Waiting for public" in RELEASES.md.
- **Resource-bar button:** the storage case went on the button at the left of the resource bar, which opens the missile stocks (there is no separate all-resources list). Keep it, or add an all-resources list there?
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
| Battle effects: gunfire and shells from the unit models onto the enemy's, smoke and fire fixed to the map and sharp at every zoom, only crossed swords when zoomed out | Opus |

## Done and public (v3.12 and earlier)

Battery saver with 60 fps while moving the map; two research slots; sharper cities; mobilization rules (Recruiting Office, Army Base, Airbase, Naval Yard); city markers removed; the rules split into rules/*.js; the new Higgsfield pictures; the short briefing and first-time tips; Arms Factory pricing; test and public builds; sleek counters, mixed-stack icon, troop models, nothing moves while zooming; GitHub repo.
