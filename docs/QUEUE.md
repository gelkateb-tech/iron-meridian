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
| New resource icons (transparent, used everywhere, storage case as the resource-list button, old icons removed) + Build box shows the building's picture and countdown + Cities tab (Build and Mobilize on each row, free slots, sorting, resource icon instead of the flag) | Sonnet | Started (icons first) |
| Unit display by zoom: code-drawn unit icons; diamond counters when zoomed out, unit pictures with flag tags close in | Opus | Repair pass, then its last review |
| 68 playable nations, region by region (plumbing, province split for Israel, Greece, Cuba and Belarus, then Europe, Middle East, Africa, Asia, Americas, Oceania) | Opus | Step 1 of 8 (plumbing) |

## Queued (in this order)

| # | Task | Model |
|---|---|---|
| 1 | Fog of war: the owner's new vision ranges in km from where things actually are, per unit type, no automatic neighbouring provinces, no city radar; every country's buildings visible to all | Opus |
| 2 | Army bar and Army Info like CoN (no floating health bars, one stack health bar, stats row, unit diamonds with badges, i button, Strength table), combat every 15 in-game minutes, healing; battle pace **proposal** (see Waiting) | Sonnet (starts after unit display is merged) |
| 3 | Building level pictures on the map: every building shows its level picture on or next to its city | Sonnet |
| 4 | Economy follow-ups: iron for nations with no iron city, a message when a market offer expires, clearer Arms Industry and Army Base hover text, resource map colours, France weak, Australia short of oil | Fable 5.2 (last Fable task) |
| 5 | Map fills the screen and wraps left to right like a globe (no black edges, ocean and Antarctica fill) | Opus |
| 6 | Attack range: artillery, rocket launchers, warships and missiles hit targets in range without moving in; range circles | Opus |
| 7 | Pinpoint movement for land units and ships (move to the exact spot; Halt for ships) | Opus |
| 8 | Movement look: units turn to face where they go, dust, wakes, contrails, follow roads on screen | Opus |
| 9 | Aircraft in flight drawn with their own unit pictures (rotated, shadow, contrail) | Opus |
| 10 | Each aircraft type gets its own 3D shape | Opus |
| 11 | Territory sales in diplomacy (captured territory only, price from the province's value, 25% / 10% coalition floors, 3-day no-resale; the AI never sells) | Opus |
| 12 | Blockade and trade rework: Blockade button next to Escort and Raid, warships in range can blockade or raid, raids capture 25-50% of cargo, pause a route, marked blocked routes, convoys reroute around stacks, chokepoints (Hormuz, Malacca, Gibraltar, Suez), slower and poorer detours | Opus (was Fable) |
| 13 | Strike effects, optional small repair 3: chemical cloud easier to read at mid zoom, ICBM ground fires, blast size order, sparks, seams in battle smoke | Opus |
| 14 | Small polish: research slot colours and "Both slots busy" time, night city cores, Sweden snow edge, Berlin garrison placement | Sonnet |
| 15 | Phone app (PWA) on Netlify | Opus (needs the Netlify token) |

## Waiting for the owner

- **Battle pace:** the army bar job will propose damage-per-tick numbers (even fights several hours, big ones a day or more) in docs/COMBAT-PACE.md; nothing is applied until approved.
- **Research design approvals** (docs/RESEARCH.md section 12 on branch research-redesign; nothing below is built): A. balance changes in the new tree (unit unlocks get first days 1-14, Marks become Firepower/Protection research, generations add health, IFV/Special Forces/Rocket Artillery cheaper stand-alone unlocks, 289 steps); B. new ground units (APC, Tank Destroyer, Towed Artillery, AA Gun Vehicle, Scout Vehicle); C. new aircraft (Scout Helicopter, Naval Helicopter); D. new ships (Patrol Boat, Destroyer, Ballistic-Missile Submarine); E. new weapons (sub-launched cruise and ballistic missiles, chemical and tactical nuclear warheads, ICBM); F. Officers (replace commanders, keep both, or a smaller Staff College step); G. elite marking of 4 existing units.
- **Infantry counter icon:** pick one of the 3 options (standing soldier, helmet bust, crossed rifles) or keep today's.
- **Pictures to make on Higgsfield:** u-heavy-bomber-1, u-heavy-bomber-2, u-stealth-bomber (optional u-infantry-figure); plus for the research banners: a heavy or stealth bomber seen from above (Strategic Air, now uses the AWACS), a command or logistics picture (Command & Logistics, now the supply truck), optional paratroopers (Air Assault).
- **Netlify token** for the phone app.
- **"Move to public"** for everything under "Waiting for public" in RELEASES.md.
- **Fable usage %**, only if Fable work comes back.

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
| Three infantry counter icon options (waiting for the owner's pick) | Sonnet |
| LATER.md: radar stations, coastal batteries, anti-air sites | Opus |
| Research redesign: 10 categories, 289 steps, generations, levelled upgrades, dark military banners with sharp unit pictures | Opus (design on Fable 5.2) |
| Battle effects: gunfire and shells from the unit models onto the enemy's, smoke and fire fixed to the map and sharp at every zoom, only crossed swords when zoomed out | Opus |

## Done and public (v3.12 and earlier)

Battery saver with 60 fps while moving the map; two research slots; sharper cities; mobilization rules (Recruiting Office, Army Base, Airbase, Naval Yard); city markers removed; the rules split into rules/*.js; the new Higgsfield pictures; the short briefing and first-time tips; Arms Factory pricing; test and public builds; sleek counters, mixed-stack icon, troop models, nothing moves while zooming; GitHub repo.
