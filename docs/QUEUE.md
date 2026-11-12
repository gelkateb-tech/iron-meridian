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

Last updated: 2026-11-12 (04:25 UTC).

**Handover:** a new session took over this list on 2026-11-12. The jobs below were started by the previous session and run in its container (their worktrees and unpushed branches are only there), so that session has to finish and push them; this session starts the queued jobs from here on.

## Running

| Task | Model | Where it is |
|---|---|---|
| 68 playable nations, region by region (plumbing, province split for Israel, Greece, Cuba and Belarus, then Europe, Middle East, Africa, Asia, Americas, Oceania) | Opus | Steps 0-5 done on branch `nations-68`, not merged: plumbing, province split, Europe, Middle East, Africa (with the oil reserve repair), Asia (with the rivals repair) and the Americas. Oceania and the merge are left. No commit since 01:34 UTC and no sign of the job in the previous session's last half hour, so it may have stopped |
| Map fills the screen and wraps left to right like a globe (no black edges, ocean and Antarctica fill, zoom and pan limits) | Opus | In the previous session (branch not pushed yet); taking screenshots of the result |

## Queued (in this order)

| # | Task | Model |
|---|---|---|
| 1 | Realistic combat and flight animations (dev build): firing effects per unit type (tanks, artillery arcs, rocket salvos, infantry, warships, cruise/ballistic/ICBM, strafing and bomb lines, drones, interceptions), impacts sized by weapon, hit flashes, scorch marks, subtle screen shake; aircraft accelerate, curve, bank, contrails, shadows, oval patrols, helicopters bob; attack markers, range ring and target on tap, missile warnings, sound slots with a mute toggle; Effects quality High/Low/Off, ~150 particles, one loop, simple flashes far out; separate effects module; Effects test panel; proof that results are identical on High/Low/Off. Replaces 'aircraft pictures in flight' and 'strike effects repair 3' | Opus (starts after the map wrap is merged; one review, at most one repair) |
| 2 | Pinpoint movement for land units and ships (move to the exact spot; Halt for ships) | Opus |
| 3 | Movement look: units turn to face where they go, dust, wakes, contrails, follow roads on screen | Opus |
| 4 | Each aircraft type gets its own 3D shape | Opus |
| 5 | Blockade and trade rework: Blockade button next to Escort and Raid, warships in range can blockade or raid, raids capture 25-50% of cargo, pause a route, marked blocked routes, convoys reroute around stacks, chokepoints (Hormuz, Malacca, Gibraltar, Suez), slower and poorer detours | Opus (was Fable) |
| 6 | Small polish: research slot colours and "Both slots busy" time, night city cores, Sweden snow edge, Berlin garrison placement | Sonnet |
| 7 | Phone app (PWA) on Netlify | Opus (needs the Netlify token) |

## Done but not merged yet (branches on GitHub, checked 2026-11-12 04:15 UTC)

All branches were fetched. Two hold finished work that master does not have:

| Branch | What it holds | State |
|---|---|---|
| `research-slots` | 1 commit (99b9ec0), research panel only (index.html, RELEASES.md): slot #2's bar, tag, glow and hover are gold, slot #1's are teal, also on empty slots (they were red); "Both slots busy" now says when a slot frees, e.g. "a slot frees in 1 d 5 h" (card button, tooltips, the next-up header). Replay hash unchanged, lint and build pass, desktop and phone screenshots checked | Done 04:20 UTC (Sonnet, part of queued task 6). Not merged. The map parts of task 6 (night city cores, Sweden snow edge, Berlin garrison) wait for the map wrap |
| `nations-68` | 10 commits, 30 files (+1,635 / −79): step 0 plumbing (nations.js, the world switch, tiers, victory by number of nations, start screen with regions) and its review; step 0b province split (Israel, Greece, Cuba, Belarus); step 1 Europe (10 nations); step 2 Middle East (5); step 3 Africa (14) and its oil-reserve repair; step 4 Asia (14) and its rivals repair; step 5 the Americas (9) | Oceania (step 6) and the merge are not done. The branch is 71 commits behind master, so the merge needs care. Last commit 01:34 UTC |

Not on GitHub yet: the map wrap branch. The old session's agent is still working on it in its own container. (`territory-sales` was merged into master at 04:19 UTC.)

Old `wip/*` snapshots, nothing to merge: `wip/merge-ud`, `wip/research`, `wip/strike-fx`, `wip/rules-split`, `wip/city-markers`, `wip/mobilize-fix`, `wip/city-polish`, `wip/battery-saver`, `wip/zoom-repair`. Each is a saved in-progress state from an earlier job whose finished version is already on master (unit display, research redesign, strike effects repair 2, rules split, city markers, mobilization fix, city polish, battery saver, world-anchored effects). `wip/city-markers`' change is already on master word for word; the others were overtaken by later versions. They can be deleted when the owner wants.

Every other feature branch (attack-range, building-pics, fog-followups, fog-vision, army-bar, stack-limits, eco-followups, cities-tab, unit-display, research-redesign, battle-fx, remove-mode, small-fixes, economy-v1, recruit-stealth, nations-plan, mobilize-fix) is fully merged.

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
- **Fog decision:** a foreign country's building under construction is hidden (finished buildings show for everyone); show it too?
- **Fleet moves inside a sea zone:** these happen instantly, as land moves inside a province already do, which can be a long jump in a big sea zone. Should they take sailing time? (asked when attack range was merged)
- **Attack range on the Dev Build:** merged into master at 03:43 UTC. The previous session was running the full tests and was to publish the Dev Build after they passed. It has not said whether it published.
- **Fable:** no Fable tasks left; new ones only if the owner says so.

## Planned for later (in LATER.md, not built yet)

Radar stations, coastal naval batteries, province anti-air sites, a Hospital; multiplayer, lobby AI, gold, premium pass, competitive mode, player levels, daily rewards, seasonal art.

## Done (on the Dev Build, waiting for public)

| Task | Model |
|---|---|
| Territory sales in Diplomacy (Territory tab): sell captured land (never home provinces, a capital, a province in battle or the last city) at a price from its land, city, people, oil and buildings; floor 25% of value, 10% between coalition partners allied 3+ days; 3-day resale lock; offer / counter / accept / decline / withdraw; the AI buys but never sells and answers at once; troops leave a sold province; provinces left the trade deal tab; Captured from and Value on the province sheet. Merged 04:19 UTC (b0af89c); results of play without land sales unchanged | Opus |
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
| Attack range in km: artillery 80, rocket launchers 150 (200 with research), frigate 80, cruiser 150, submarine 40 vs ships; fire from where they stand at visible enemies, Bombard order, range circles and target rings, AI keeps guns behind the front | Opus |
| Building level pictures on the map: each building's level picture in a framed cluster next to its city, visible to all, level-up animation, own construction shown faintly with progress | Sonnet |
| Fog follow-ups: fog clearly visible outside your sight with soft circle edges, the Stealth Bomber test fixed, fog circles across the Pacific seam | Sonnet |
| Army bar and Army Info like CoN (one health bar with numbers, stats row with tick countdown, unit diamonds with Mark badges, i button with the Strength table and arrows), no health bars on the map, combat every 15 in-game minutes, healing shown with a Hospital hook, AWACS combat cover 500 km | Sonnet |
| Stack limits like CoN: land 10, air 5, sea 5; damage 1 − 0.56 × ln(size ÷ limit) with a 25% floor, speed 1 − 0.15 × ln(size ÷ limit) (min 50%); merge warnings; AI stacks at the limit, attacking from several sides (biggest AI stack 45-62 → 10); split stacks beat a 128-stack in all six duel cases | Opus |
| Fog of war: vision in km from where things are (city 80, airbase 100, forces 50, recon 100, aircraft 150, drones and patrols 200, UAV 250-500, AWACS 500 locate-only, maritime patrol 400, satellite strip 150), no free neighbouring provinces, no city radar; every country's buildings visible to all | Opus |
| Battle effects: gunfire and shells from the unit models onto the enemy's, smoke and fire fixed to the map and sharp at every zoom, only crossed swords when zoomed out | Opus |

## Done and public (v3.12 and earlier)

Battery saver with 60 fps while moving the map; two research slots; sharper cities; mobilization rules (Recruiting Office, Army Base, Airbase, Naval Yard); city markers removed; the rules split into rules/*.js; the new Higgsfield pictures; the short briefing and first-time tips; Arms Factory pricing; test and public builds; sleek counters, mixed-stack icon, troop models, nothing moves while zooming; GitHub repo.
