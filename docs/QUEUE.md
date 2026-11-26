# Iron Meridian task list

Kept up to date as tasks start and finish. Everything goes to the **Dev Build** first
(https://claude.ai/artifact/EKDR7pckn3hPkoJVuxoe7R); the public build changes only when the owner says "move to public".

**Rules for running jobs (owner, 2026-11-11 and 2026-11-13):**
- **Models:** Opus for big features and design, Sonnet for routine work, no new Fable tasks unless the owner says so.
- **Limits (owner, 2026-11-18):** at most 5 jobs at once, and only jobs that don't touch the same files or systems run together (for example map and cities wait for each other); overlapping jobs wait in the queue. (Was 2 to 3.) Small tasks get one pass; big ones one review and at most one repair.
- **Merging (2026-11-13):** every finished task is merged into master and published to the Dev Build as soon as its tests pass and it doesn't break the map, then the owner is told what changed. Only real design choices stop and wait for the owner. Map jobs merge one at a time.
- **Pause is not cancel (owner, 2026-11-21):** a pause or stop click from the owner never cancels a job; only "cancel" plus the job's name does. Paused jobs are resumed from where they stopped.
- **Old phones are not a target (owner, 2026-11-21, verbatim):** "we dont want to focus on bad phones becasue these players probably wont spend anyway". No work aimed at old or low-end phones; keep things fast on ordinary modern phones and desktops.
- **Screenshots to the shots branch (owner, 2026-11-26, verbatim):** "Standing rule for screenshots: every screenshot or sheet you send me, also save to the repo so I can review it in my other Claude chat. - Put them on a separate branch called "shots", never on master and never merged. - One folder per day and job, e.g. shots/2026-11-26/rebels/berlin-before.jpg. - Save them as JPG, at most 1600 px wide, so the repo stays small. - In each message to me, name the folder. - Clean up automatically: keep only the last 14 days, and rewrite the branch when you remove old ones so they don't pile up in the history." Done with `python3 -I tools/push-shots.py <date> <job> <files...>` (worktree /home/user/iron-meridian-shots, orphan branch shots; prunes and squashes past 14 days).
- **Messages to the shots branch (owner, 2026-11-26, verbatim):** "Standing rule: every message you send me, also save word for word to the shots branch, in a separate top-level folder: messages/<date>/<HH-MM>-<job>.md, one file per message, with the folder names of any pictures it refers to. Keep the picture folders (shots/<date>/<job>/) pictures only. Same 14-day cleanup for both." Done with `python3 -I tools/push-shots.py --msg <date> <HH-MM> <job> <file.md> --pics <folders>` (times UTC), before the message is sent.
- **New messages never cancel running jobs (owner, 2026-11-19):** a new message from the owner never cancels or replaces a running job unless the owner says "cancel" or "stop" with the job's name. Each new block is extra work added to the queue. If a message seems to change a running job, ask the owner before stopping it. Every job brief quotes the owner's request it comes from, so a worker never mistakes a newer, unrelated message for its own task.

Last updated: 2026-11-26 (D10 tightened, Dev Build v69; REBELS, units in cities and city lots waiting for the owner).

## Pace (owner, 2026-11-18, after the usage reset)

"Pace it so the week lasts: at most 2–3 jobs at once [raised to 5 non-overlapping jobs on 2026-11-18], Sonnet for anything routine, and Opus only for the big ones (MAP-2, the doctrines plan, the upgrades review, the research rebuild, cities, bunker and rebels). Anything that needs my decision goes under 'Waiting on me', and carry on with other jobs meanwhile."
Gemini: log every batch with the running total since the top-up; stop and ask if new spending passes $12. Art: follow docs/ART-BIBLE.md (standing rule: before fixing or redoing any picture, show the owner the problem and ask permission first).

## Running

| Job | What | Model | Branch |
|---|---|---|---|
| **CITY BUILDING LOTS** (2026-11-25, on cities-redo; the cities merge of 2026-11-25 was reverted on master, a4fbeb0, at the owner's request) | **Brief now Part A of the owner notes of 2026-11-25 (below, verbatim: A1-A7 and the sheets with no buildings, all built, one under construction), which replaces the earlier text.** Earlier, verbatim: "CITIES redo (branch cities-redo): I like it, don't change the look. One problem before merging: the capital HQ and every building I build (Army Base, Airbase, Naval Yard, Bunker, etc.) sits on top of the city blocks like a sticky note. Fix it so they look built into the city: 1. Fixed building lots: every city reserves a lot for each building type in its street plan. The city blocks never cover those lots, and roads lead to them. 2. The HQ sits in the centre on a city square. The Army Base and Bunker go near the centre. The Airbase goes at the edge of town on open ground. The Naval Yard goes on the waterfront. 3. Before a building exists, its lot shows as normal city ground (a small park or open square). While it's being built, show the crane and scaffolding on that lot. 4. The lot is part of the city's ground (paving, grass, a fence line). It's not a slab under the picture, so my no-slab rule still holds. 5. Draw city blocks and building pictures in one depth order, so a block in front of a building covers it and a block behind it sits behind. Same light direction and shadows for both. Show me Berlin, Hamburg and Kolkata at play zoom and closest zoom, before and after, with all buildings built and with one under construction. Don't merge until I've seen them." **Owner re-sent the brief (2026-11-25) with two more points and an extra sheet case, verbatim:** "6. Make the built buildings smaller so they match the city's scale: only a little bigger than the biggest normal city buildings, like a landmark that stands out but fits in. Players tap the city, not the building, so they don't need to be big. 7. The city grows around what's built: when a building finishes, and again as it levels up, the area around it changes to fit. New access roads, a few extra city blocks and greenery around it, so the city looks like it grew around the building. Only redraw that one city when this happens, to keep it fast. Show me Berlin, Hamburg and Kolkata at play zoom and closest zoom, before and after, with no buildings, with all buildings built, and with one under construction." The running round (points 1-5) was not stopped (standing rule); points 6-7 and the no-buildings sheets run as a follow-up round on cities-redo as soon as it finishes, then the owner sees the sheets. **2026-11-26:** points 1-5 done on cities-redo 7f463c8 (2 polish rounds used); sheets sent to the owner (Berlin, Hamburg, Kolkata, lots overview, Hamburg close-up). Open: Hamburg's buildings stand on grass east of town with no street; 34 lots in 13 towns still use the old cluster; mid zoom hex 50-60. **Follow-up job CITY LOTS GROW running (wf_1078e43c-aa0):** points 6-7 plus the Hamburg fix, at most 2 polish rounds, new sheets incl. a growth sequence and a phone frame. Build, look and tech critique, repair, two rechecks. Keeps the city centre point free for UNITS IN CITIES. **Not merged until the owner has seen the sheets.** | Opus | cities-redo |
| **UC-DOT** (2026-11-26, owner, verbatim: "Correction to my last answers, UNITS IN CITIES, UC2: no, not your default. The dot is the army's true position (my position-dot rule) and must never move. When something is in the way, move the counter aside instead, with a thin line to its dot. Everything else in that block stands.") | on units-in-cities: merge master first (index.html conflict from the 1126 merges); the dot always at the army's true spot, the counter moves aside with a thin leader line; UC1 (joins the city's counter at hex 12) and UC3 (Szczecin beside the city's counter) as defaults; before/after phone sheets; at most 2 polish rounds | Sonnet | units-in-cities |

## Next free slots (in this order)

- **CITY LOTS 3** (owner 2026-11-26, verbatim: "CITY LOTS questions: 1. Park lots: yes. 2. Dim square with street lamps at night: yes. 3. Roads should curve round the HQ square and carry on, not stop at its edge. CITY LOTS next round (A6/A7): no visible lot outline (the faint octagons in the grass read as a slab). Pull the lots a bit closer to the city core so the town doesn't look scattered (the Airbase stays at the edge, the Naval Yard on the water). Keep the Airbase off the highway."): runs on cities-redo as soon as CITY LOTS GROW (A6/A7, running) finishes; the PASTED-ON CHECK runs on its result. At most 2 polish rounds. Opus.
- **MISSILES** (owner 2026-11-26: M1-M15 OK; "MISSILES M13: approved, with one change: give the gas zone a stronger sickly-green tint and a dashed hazard border like the radiation one; on green land it nearly disappears."): starts now that REBELS and auto-test/fixes are merged (M14).

- **REBELS PICTURES** (owner 2026-11-26, verbatim: "REBELS unit picture: rebels need their own unit pictures like every other unit, instead of the code-drawn 3D figure. - Make the same set as the other units: the 3/4 side view for the info card, the card scene, and the top-down picture for the map. Same camera, size, light and framing as the other unit sets, following ART-BIBLE.md and docs/UNIT-LOOKS-PROMPTS.md. - The look: a small group of irregular fighters in mixed civilian and military clothes, scarves and headwraps, carrying generic rifles (no real brand designs), tan and khaki tones, with a small crossed-rifles flag to match the rebels badge. Make it clearly different from regular infantry and from the Export armed pickup. - Show me the prompt first, then one test picture with its cost, and wait for my OK before making the rest. - Save the pictures to the shots branch as usual."): prompts in tools/gen-art.py (ul-reb-side/scene/top); test side view made (about $0.105, check PASS), sent with the prompt (shots/2026-11-26/rebels-pictures/). **Waiting for the owner's OK** (and on the rifle wording) before the scene and top-down. Art balance about $5.42 against the $5 floor.

- **PASTED-ON CHECK** (owner 2026-11-26, verbatim: "After A6, tell me honestly whether the building pictures still look pasted on: their own ground pad, a different light direction or angle from the city blocks, or too much detail next to them. Don't redraw anything. If you think they need it, show me the problem and a single Army Base test picture with the cost, and wait for my OK."): runs when CITY LOTS GROW finishes. An independent look critic that has not seen the job's reports, plus my own look at full size, on the three points (ground pad, light and angle, detail). Only if they need it: one Army Base test picture, cost logged against the $5 floor, then wait for the owner's OK. No other picture is redrawn.

1. **(DONE 2026-11-22, waiting for the owner; see Ready)** **CITIES REDO, together with the CITIES follow-up** (Opus; owner 2026-11-21; started when SEA MIX and JUNGLE C REWORK finished, because map and cities wait for each other). Owner, verbatim: "CITIES redo (Opus). Branch cities-3d-2 isn't good enough, so don't merge it. Do this together with the CITIES follow-up already in the queue. Reference attached: Conflict of Nations, Mazar-i-Sharif zoomed in. Use it only for how the 3D buildings pop. Don't copy its look or its green tint. What's wrong now: each city is a flat pale slab floating on the map with a tiny, uniform block grid on top. You can't see any buildings. Keep: - Each city's outline exactly as it is now. - The realistic look and colours I like. No owner-colour tint over the whole city. Change: 1. Make the buildings pop: real 3D buildings you can see at normal play zoom, each with a lit roof, shaded sides and a shadow on the ground. Tall towers in the centre, low buildings at the edges, mixed sizes and shapes. 2. No slab or plate under the city. The ground between buildings is normal terrain, and the edge blends into the land around it. 3. Greenery in every city: clumps of trees, parks and tree-lined streets between the buildings. 4. Every city should look different: vary the road layouts. Curved, organic streets in old cities (Kabul, Damascus), grids only where they make sense (US cities), ring roads and big avenues in capitals. The main map roads connect into the city. Not the same grid everywhere. 5. Keep the night lights, with lit windows in the buildings. 6. It must stay fast on phones: draw each city once per zoom and cache it. Show me Berlin, Kabul and a small town at play zoom and at the closest zoom, before and after, before anything merges." Reference picture: scratchpad cities-ref/con-mazar.webp. Follow-up parts still open (check what naval cities v65 already did): building pictures on land and 15-20% smaller, the Naval Yard on the real coast at Kolkata, a building under construction; keep the night lights. Branch from master (not cities-3d-2).


## Owner answers 2026-11-26 (verbatim; extra work, cancels nothing)

> Answers:
> - R1–R17 (rebels plan): all your suggested answers, OK. Start REBELS.
> - M1–M15 (missiles plan): all OK, except M13: send me the gas and radiation zone mockup first.
> - D4–D13, K1–K8, U1–U4, E1–E8, F1–F6: all your defaults, except D10: fix it, so a computer nation refuses deals where it gets nothing back.
> - Merge Market, Fog-clash and UI-fixes.
> - Merge auto-test/fixes (the playtest's 16 bug fixes) after re-running the checks on top of today's merges, and go with your defaults on Q1–Q31.
> - Keep the rules from before: at most 2 polish rounds per job, Sonnet for interface follow-ups.

Jobs from it: MERGE CHAIN (Market, then Fog-clash, then UI-fixes, then auto-test/fixes re-checked on top, then D10-FIX), REBELS (R1-R17 defaults; running), Q-DEFAULTS (Q1-Q31 defaults that need code, after the auto-test/fixes merge), MISSILES (after REBELS and the auto-test/fixes merge, per M14; M13 zones wait for the owner's look at the mockup). Rule kept: at most 2 polish rounds per job; Sonnet for interface follow-ups.

## Owner notes 2026-11-25 (verbatim; extra work, cancels nothing)

```
Two sets of changes from me. This is extra work: it cancels nothing in docs/QUEUE.md. Split it into jobs by area (max 5 at once, no overlapping files). Use Opus for the rule, economy and city changes and Sonnet for the small interface fixes. First check auto-test/fixes so nothing gets fixed twice. Anything visual: send me before/after screenshots before merging. Rule changes: run the balance and headless checks. If you already have my CITIES building-lots request from earlier tonight, this replaces it.

=== PART A: CITIES (branch cities-redo) ===
I like the new 3D cities, don't change the look. One problem before merging: the capital HQ and every building I build (Army Base, Airbase, Naval Yard, Bunker, etc.) sits on top of the city blocks like a sticky note. Fix it so they look built into the city:
A1. Fixed building lots: every city reserves a lot for each building type in its street plan. The city blocks never cover those lots, and roads lead to them.
A2. The HQ sits in the centre on a city square. The Army Base and Bunker go near the centre. The Airbase goes at the edge of town on open ground. The Naval Yard goes on the waterfront.
A3. Before a building exists, its lot shows as normal city ground (a small park or open square). While it's being built, show the crane and scaffolding on that lot.
A4. The lot is part of the city's ground (paving, grass, a fence line). It's not a slab under the picture, so my no-slab rule still holds.
A5. Draw city blocks and building pictures in one depth order, so a block in front of a building covers it and a block behind it sits behind. Same light direction and shadows for both.
A6. Make the built buildings smaller to match the city's scale: only a little bigger than the biggest normal city buildings, like a landmark that stands out but fits in. Players tap the city, not the building, so they don't need to be big.
A7. The city grows around what's built: when a building finishes, and again as it levels up, the area around it changes to fit, with new access roads, a few extra city blocks and greenery. Only redraw that one city when this happens, to keep it fast.
Show me Berlin, Hamburg and Kolkata at play zoom and closest zoom, before and after, with no buildings, with all buildings built, and with one under construction. Don't merge until I've seen them.

=== PART B: PLAYTEST NOTES (14 points) ===

BUGS
1. Enemy units pass each other without fighting. They should meet and fight.
2. Fog of war: enemy armies outside my territory still show as "unidentified". They shouldn't show at all. I only see them once they cross into my land, or when one of my units sees them within its sight range (infantry sees only up close; a fighter on patrol sees much further).
3. Research tree: the infantry picture doesn't fit inside its research icon. Fit it properly, like the other units.
4. The Build button is grey even when I can afford it, so it looks like I can't build. Make it blue when I can afford it, and grey only when I can't.

START OF GAME
5. Every capital starts with a level 1 Airbase already built and one air superiority fighter based there (on top of its Fortifications), so every nation can patrol and scout from day one. The same goes for computer nations.

ECONOMY
6. The level 1 Army Base costs too much: on day one I can only afford it in 5 cities. Make it cheaper so I can build one in every city, and an Arms Industry in any city. I should also be able to afford the infantry research on day one. The level 1 Army Base builds in 30 minutes instead of 20 hours.
7. Mobilization queue: free players lose it (one unit at a time per city). It becomes a paid membership feature. Add a membership on/off flag with a dev toggle so I can test both. Don't build any payment system yet.

OCCUPATION, MORALE AND REBELS: copy Conflict of Nations' system and numbers exactly.
8. Annexing: an occupied city gives 25% of its resources and can't mobilize units. Annexing raises it to 50% and lets it mobilize. Annexing is built like a building from the city's build list ("Annex City"), with a high cost (money and manpower, more for bigger cities) and a build time. Propose the cost and time and show me before building. I can start it any time, even while the city is burning. If the city is captured, it loses its annexed status. If I have troops in the city, rebels attack them, the city stays mine, my troops get the +25% dug-in city bonus and the annexing carries on. If the city is empty and rebels take it, I lose the city, the annexing and its cost.
9. Morale:
   - Every city and province starts the game at 70%. A newly occupied city or province drops to 25%; a liberated homeland one to 55%.
   - At every day change, morale moves toward its target by (target − current) ÷ 8.
   - Base targets: homeland cities 90%, annexed cities 75%, occupied cities 60%, countryside provinces 100%.
   - Modifiers on the target:
     - Distance to the capital: −5 per unit of distance, rounded. Propose how distance is measured and show me.
     - Wars: −2 per nation I'm at war with, rebels included, nations with 0 VP not counted, max −25.
     - Enemy neighbours: −5 per adjacent province held by a nation I'm at war with.
     - Enemy units in the province: −1.
     - Low-morale neighbours (my adjacent provinces at 40% or less): −7 each for a city, −4 each for a countryside province.
     - High-morale neighbours (my adjacent provinces at 100%): +3 each for a city, +1 each for a countryside province.
     - Resource shortage (any resource short with negative production): up to −50.
     - Civilian casualties: up to −30, shrinking by a third each day.
     - Capital lost: −20 on every province's target.
     - The capital city itself: +25.
     - Bunker level 1–5: +5 / +10 / +20 / +35 / +50.
   - Show the target and every modifier in the city panel, as a morale factors list.
   - Keep today's link between morale and output.
   This replaces today's unrest system, plus the daily per-unit changes and "integration" in docs/REBELS-PLAN.md.
10. Rebels:
   - A city at 33% morale or lower can rebel, and shows a burning fire-and-smoke animation. Above 33%, the fire goes out and the risk is gone. Countryside never rebels. The fire must stay light on phones.
   - Check once a day at the day change. The chance rises from 0% at 33% morale to 50% at 25%, and higher below that. Troops in the city lower the chance: propose how much and show me.
   - Rebels attack any troops in the city in a real fight, with my troops getting the +25% dug-in city bonus. If the city is empty, rebels take it.
   - Keep the rest of the rebels plan (crossed-rifles badge, rebels as their own side).
11. Occupying a country I trade with should hurt my economy: I lose that trade, on top of the morale drop. The occupied cities stay weak until their morale recovers, and after that, holding and annexing them pays off. The difference between occupying a trade partner and a non-trade partner should be clearly noticeable.

MISSILES
12. The Missile Silo needs Conventional Warhead researched first. Cruise missiles don't. Add chemical and nuclear warheads as new missile units in research. Start from the weapons table in docs/RESEARCH.md 12.5 and write the plan first: research days, costs, effects, limits, and how they show on the map. Show me before building.

INTERFACE
13. Market rework: for each material, show the top 3 sellers and the top 3 buyers.
14. Diplomacy has too many buttons. Simplify it: show me 2–3 layout options before changing anything.

Points 8 to 10 replace parts of the REBELS job, which still hasn't started. Run REBELS next and build them together with it.

Log any questions in docs/QUESTIONS.md and keep going.
```

Jobs from these notes (split by area, at most 5 at once): CITY BUILDING LOTS (Part A, running), FOG-CLASH (B1-B2, running), ECON-START (B5-B7, running), PROPOSALS (B8-B11 plan, B12 plan, B14 layout options; docs and mockups only, running), UI-FIXES (B3, B4, B13; Sonnet; queued, starts when UNITS IN CITIES finishes), then REBELS (B8-B10 built with the REBELS job once the owner OKs the proposals; B11 with it), MISSILES (after the owner OKs the plan), DIPLOMACY (owner sent a reference layout instead of picking an option: built to it, queued after UI-FIXES).

## Owner notes 2026-11-25, Diplomacy (verbatim; replaces point 14's "show me 2–3 layout options"; extra work, cancels nothing)

```
Point 14, Diplomacy: here's the reference you asked for (4 Conflict of Nations screenshots attached: the list, a real player's page, the conversation screen, and a computer nation's page). Match this layout instead of making 2–3 options. Style only: no copying their art, names or icons. Build everything now, even though online play isn't live yet; it works with computer nations today and real players later.

LIST SCREEN
- Header "DIPLOMACY" with the red close button. Three tabs: Information, Coalitions, Messages & Trades.
- Under the tabs: a Sort dropdown (default: Points), a direction toggle and a Search button.
- One row per nation, sorted by points: big flag on the left, then "COUNTRY | player or leader name" in bold, a trophy with their victory points, a city icon with how many cities they hold, and their coalition's emblem and name if they're in one.
- On the right of each row, two relation diamonds: "their" (how they treat me) and "your" (how I treat them). Each of our relations gets its own colour and icon: war, ceasefire, peace, non-aggression pact (NAP), right of way, and shared-intel alliance.
- No other buttons on the rows. Tapping a row opens that nation's page.

NATION PAGE: two versions
Both versions:
- Back button, title "ABOUT PLAYER", close button.
- Big flag with a "Progress towards victory" bar and percentage.
- "Their relation ⇄ Your relation" diamonds with a dropdown arrow. Tapping mine opens the menu to change it: declare war, offer peace or ceasefire, Offer NAP (20 days), ask for right of way, propose an alliance, embargo. Keep the current rules and the treaty-breaker warning.
- Stats list: Provinces, Average Morale, Victory Points, Capital, Known Army Size (shows "Unknown" unless my scouts or spies have seen their forces, matching the fog-of-war rule), and At War With (a list of nations, rebels included; empty if none).
A) Nation played by a real player:
- The player's name with an Add Friend button, and their motto under it.
- Buttons beside the flag: Send Message, Player Profile, Mute Player.
B) Computer nation (not playable, or not taken by a real player):
- The nation's leader name instead of a player name, no motto. Invented leader names only, never real politicians.
- No Add Friend, Send Message, Player Profile or Mute buttons. Just one New Trade button beside the flag, so I can still trade with them and buy or sell territory.

CONVERSATION SCREEN (real players only: Send Message, or a conversation in the Messages & Trades tab)
- Header with the player's name over a faded flag, back button and close button.
- Empty state: "Create a new trade or type a message below to start this conversation."
- Messages and trade offers show as a chat history, newest at the bottom.
- At the bottom: a message box on the left, and on the right three buttons: Send Message, New Trade, Mute Player.
- Mute hides that player's messages and trade offers until I unmute.

TRADES (both real players and computer nations)
- New Trade opens a trade builder. Each side picks what it gives: money, any resource, cities and provinces (our territory selling stays, it's our big difference), and treaties (peace, NAP, right of way, alliance).
- Offers show Accept, Decline and Counter buttons. With a real player, the offer appears in the chat. With a computer nation, it answers with the AI's existing deal logic (accept, decline or counter, with a short reason) in the Messages & Trades tab.
- The Messages & Trades tab lists every conversation and trade, newest first, with unread counts.

KEEP WHAT'S OURS
- Keep every diplomacy action we already have, just moved into this layout: nothing gets removed.

Show me all screens on a 440 px phone before merging, including a computer nation's page and a real player's page.
```

## Owner notes 2026-11-25, Market (verbatim; replaces point 13's one line; extra work, cancels nothing)

```
Point 13, Market rework: reference attached (Conflict of Nations "Stock Market" screenshot). Match its layout, style only, and keep our price chart and seller flags.

LAYOUT
- Header "STOCK MARKET" with a chart-style banner and the red close button.
- A row of resource tabs under the header, one per tradable resource, using our resource icons.
- Each tab shows only the best 3 offers on each side:
  - BUY section: the 3 cheapest sell offers I can buy from. Each row has the resource icon, the amount in green (+4,000), the unit price with the money icon, and a green Buy button.
  - SELL section: the 3 highest buy offers I can sell to. Each row has the amount in red (−2,070), the unit price, and a yellow Sell button.
  - All other offers wait in line. When one of the top 3 is filled or cancelled, the next best moves up.
- Bottom buttons: Create Offer and Order Book. Order Book shows the full queue for that resource, plus my own open offers with a Cancel button.
- Prices in money only.

KEEP OURS
- The price chart: a slim chart at the top of each resource tab showing that resource's price over the whole game. Tap it to expand to full size.
- Seller and buyer flags on every offer row, so I can see who I'm trading with and avoid nations I'll fight later. Make the flags sleek, in the same style as the unit badges: the real flag with a light fabric sheen, a thin dark edge and a soft shadow, small and neat. Tapping a flag opens that nation's diplomacy page.

ALSO
- Make sure computer nations actually post buy and sell offers (the playtest found they sit on goods and never sell, IMP-2), so the market is never empty.

Show me each resource tab and the Order Book on a 440 px phone, before and after, before merging.
```

## Ready, waiting for the owner

| Job | State | Branch |
|---|---|---|
| **UNITS IN CITIES** (2026-11-22; DONE 2026-11-26, recheck 7 READY, units-in-cities 398a749; 14 phone sheets sent, shots/2026-11-26/units-in-cities/; questions UC1-UC6 in docs/QUESTIONS.md; needs one merge with master (index.html conflict from the 1126 merges) and a re-check once the owner OKs it, extra job: cancels and replaces nothing) | owner, verbatim: "Units in cities: on the map I can't tell whether an army is in the middle of a city or just near it, and the units get lost in the city texture. Fix both: 1. Each city's centre point (where armies stand to hold or capture it) gets a clear marker, visible at every zoom. 2. When an army stands on that point, its position dot snaps onto the marker and the marker lights up with a ring in the army's side colour, so "in the city" is obvious at a glance. Armies near the city but not on the point clearly look outside it. 3. Make units stand out on busy city ground with a soft dark shadow and a thin outline under each unit and badge, without making them bigger. 4. Tapping a city shows who's inside, e.g. "In the city: 1st Infantry Division (5 units)". Show me screenshots on a 440 px phone at play zoom and close zoom: my army in Berlin, one just outside it, and an enemy army in a city. Don't merge until I've seen them." Unit/overlay layer and the city sheet only (no city building drawing, so it runs beside CITIES REDO); rules unchanged; build, look and tech critique, repair, recheck. 2026-11-25: fourth recheck NOT READY (the city's own name moves over the border when a second army stands just outside, e.g. "Berlin" over Poland); fourth polish fixed that (8c929da). Fifth recheck NOT READY: at mid zoom city names move and drop even on an empty map (Berlin's name sits in central Germany, because names step off the new markers); fifth polish fixed that (6ab08bf: 0 names moved, dropped or added in 1568 checked). Sixth recheck NOT READY: at mid zoom an army a few km off a held city is drawn 40-50 px away, beside another city, and a lone army's dot sits inside the diamond; sixth polish and seventh recheck running. Past the owner's 2-polish-round rule: after this round the sheets go to the owner whatever the verdict, no more rounds. **Not merged until the owner has seen the phone sheets.** | Opus | units-in-cities |
| **REBELS** (2026-11-26; DONE, READY, sheets sent; refreshed onto master v68 and verified SAFE, rebels-2 611bf1c: Q27 A / Q28 B reconciled, old-save partisans fixed, 168 checks; merges on the owner's OK, owner: "R1–R17 (rebels plan): all your suggested answers, OK. Start REBELS."; owner points 8-11 verbatim under Owner notes 2026-11-25) | docs/REBELS-PLAN.md (plans-1125) with R1-R17 defaults: morale replaces unrest, Annex City, rebels, trade partners (option C), administration; rules then screens, rules and look critics, at most 2 polish rounds; phone sheets before merging. **2026-11-26: done, READY after polish 1 (rebels-2 776769e, all checks pass); 8 phone sheets sent; waiting for the owner's OK and answers RB1-RB5 (docs/QUESTIONS.md). Before merging: merge origin/master again (today's merge chain) and re-run the checks; small leftovers: the extra 'Independent Rebels destroyed' log line, and the old-look items listed in the recheck.** | Opus | rebels-2 |
| **PROPOSALS** (2026-11-25; DONE 2026-11-25, plans-1125 19dd3af, sent to the owner; waiting for OK on R1 and the missiles plan, questions R1-R17 and M1-M15 in docs/QUESTIONS.md) | owner notes points 8-11 (occupation, morale, annex, rebels plan with the three proposals: Annex City cost and time, distance measure, troop effect on rebel chance), 12 (missiles plan) and 14 (2-3 Diplomacy layout options; **superseded 2026-11-25 by the owner's reference layout, see "Owner notes 2026-11-25, Diplomacy"**: the options draft was already done, its button inventory in docs/DIPLOMACY-OPTIONS.md is the checklist of actions to keep). Docs and mockups only, nothing built; shown to the owner before building. | Opus (diplomacy mockups Sonnet) | plans-1125 |
| **BUNKER ART options** | done 2026-11-18 (bunker-art): A concrete command bunker with earth berm, B bunker half sunk into a grassy hillock (recommended), C pillbox with trench on its own earth block (slab-like, not recommended); level 1 and 5 each, no ground patch; about $0.20; sheets and map previews sent; nothing in the game changed | bunker-art |
| **UNIT-ART tank sets** | done 2026-11-18 (unit-art): 45 pictures, 5 groups x 3 looks x (side / scene / top-down), $1.83 with checks (log 365 calls, about $12.10; estimated balance $39.05); 7 single-check flags and 8 three-way flags (mostly mirrored roof details on the top-downs); nothing redone; full set 1,095 pictures, about $44.49 (about $42.67 left, a top-up of about $8.6 needed to keep the $5 floor); sheets sent; NOT merged | unit-art |
| **CITIES** | done 2026-11-18 (7129852): block clusters, a quarter smaller, owner colour from the town coat, towers lower, hidden at hexPx 26 and below, brighter night windows; checks pass; faster than master except desktop day close-zoom panning +4.7% per frame (probably noise); screenshots sent | cities-3d |
| Explosion clips + FX-2 (#24) | NOT merged until the owner OKs | fx-video |

## Queued (in this order)

Owner's consolidated list of 2026-11-15 (#1-#24). Already merged and live (Dev Build v50-v52): #1, #2, #5, #6, #8, #10, #12, #13, #14, #15, plus Suez and capture by one unit. #9 is half done (the amber shield and +10% are in; the city part is new).

| # | Job | What it covers | Model |
|---|---|---|---|
| (done, plan) | **DOCTRINES plan** (owner 2026-11-15; Opus, PLAN ONLY, don't build) | write docs/DOCTRINES.md: nation groups (doctrines): US/NATO, Russia/Eastern, China, Europe, and a generic export group; every one of the 68 nations in one group; each group's identity: a small, clear strength and weakness (e.g. cheaper and faster to build vs stronger and more expensive), balanced and simple, numbers proposed; for every unit type each group's own version with a real model name per look level (1, 3, 5, 7), e.g. Main Battle Tank, Russia: T-72, T-80, T-90, T-14; US: M60, M1, M1A2, M1A2 SEPv3; the same for SAMs (S-300, Patriot...), fighters (F-16, Su-27...), helicopters (Ka-50, AH-64...), ships, drones and missiles, with small stat differences matching the real equipment; a handful of unique units only some groups get; the name shown as 'T-80 · Main Battle Tank' with the group's emblem stripe on the research card; flag likely trademarks (Apache, Black Hawk, Lightning II...) and use the bare designation (AH-64, UH-60, F-35); a shared filter for research-card pictures (e.g. a tinted monitor look with scanlines) so all unit pictures read as one set; art cost: pictures per group and in total with the Gemini cost, and the cheapest way (shared pictures for similar units). Show the owner the plan and WAIT for the OK | Opus |
| 2 | **UNIT-LOOKS** (owner 2026-11-18) | 5 groups x 3 looks for every unit (365 pictures with the 5 uniques, about $15.70 with the checks); step 1 DONE (merged 2026-11-18, prompts in docs/UNIT-LOOKS-PROMPTS.md): plan update, count and cost, the Gemini check step, the exact tank prompts for the owner (no spending); step 2 after the owner OKs the prompts: the tank sample for all 5 groups (15 pictures, about $0.60 plus checks), Gemini check on each, shown on the research card and on the map; step 3 after the owner's OK: the rest, with the check on every picture; map figures' own pictures only with the owner's permission | Sonnet |
| (done, v55; follow-ups done: UPGRADES-2, v57) | **UPGRADES review + fix** (owner 2026-11-18: go with the suggestions, fix all 6 gaps incl. aircraft speed; CoN numbers checked on constacks.com) (owner 2026-11-15; Opus; review first, change nothing until the owner has reviewed the list) | (1) research upgrades apply to ALL units of that type, new and existing, the moment the research finishes, like Conflict of Nations: units on the map, in queues and in transport get the new stats at once; the AI benefits the same way; tests updated (RESEARCH.md 2.1 already says upgrades apply to fielded units: verify it really does everywhere, report gaps); (2) docs/RESEARCH-UPGRADES.md: every upgrade in our tree grouped by unit line with what each level does, compared with Conflict of Nations using constacks.com (their unit stats at each level); mark ours that don't directly improve the unit itself (faster mobilization, cheaper training, ...) and suggest replacements that do (health, attack by target type, defence, speed, sight, range); (3) faster mobilization: no separate research node; only as an extra bonus on a unit line's final level, on top of that level's normal stat upgrade, about 15-20% faster. Show the owner the list and WAIT; then build (1) and the approved changes | Opus |
| 4 | **RESEARCH-CON** (next; the UPGRADES fix is merged; the doctrines and upgrades answers are in; waits for the owner's CoN research screenshot; its unit pictures are the UNIT-LOOKS pictures) rebuild the research tree like Conflict of Nations (owner 2026-11-15; Opus; full spec in 'RESEARCH-CON spec' below) | new cut-out pictures for every unit in the tree (list every unit first; 4 samples to the owner before the rest), blue/green/grey node states, code-drawn white upgrade symbols and category icons, calendar day column with only research days, a moving glowing today line, a shaded grid, no labels/locks/badges on nodes, one node per cell with straight vertical lines only, a CoN-style RESEARCH banner and SLOT #1/#2 boxes, plain column headers; phone screenshots of two categories next to the owner's CoN screenshot before merging | Opus |
| (done, waiting for the owner) | **CITIES** (#16, Opus) | clusters of simple 3D buildings instead of the flat grid, like Conflict of Nations: keep each city's own outline shape; inside it small extruded blocks (lit top, shaded sides, soft shadow), taller in the centre and lower at the edges, streets between them, tinted in the owner's colour; bigger cities more and taller blocks; cities about 25% smaller on the map; drawn once into a cached picture per zoom level; hidden when zoomed far out. Screenshots of Kabul, Damascus and Berlin at 3 zoom levels before merging | Opus |
| (done, v59; pictures v61) | **BUNKER** (#17, new rule) | Fortifications become the Bunker, hidden from other nations. Level 1: health 20, garrison takes 33% less damage, +5% morale, upkeep 100; level 2: 40, 43%, +10%, 110; level 5: 125, 82%, +50%, 140; levels 3 and 4 smooth between (proposed: 3: 65, 56%, +20%, 120; 4: 95, 69%, +33%, 130). It shields the city's other buildings up to level 1 and protects the population up to level 5. Convert to our economy's scale. Show the owner the protection table (with and without dug-in) before building. 5 levels: the Fortifications price/cost question folds into this | Opus |
| 7 | **REBELS** (#22, new rule; owner's answers are in, see this row; never started: it was 7th in the queue and the job slots stayed full; starts at the next free slot after the 2026-11-19 audit) | the suggested answers in docs/REBELS-PLAN.md, with one change: one level-1 infantry unit left in the captured city until it stabilises beats any rebels; an empty city still flips. Rebels get a crossed-rifles badge and show as 3D soldiers | Opus |
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
- **NAVAL CITIES, still open after the merge (owner said "merge it" 2026-11-19):** inland cities with anchors (Hyderabad PK, Ahmedabad, Hubballi): keep, or anchor only cities whose point is near the sea (recommended)? The AI hardly builds Marines (at most 2 in 40 days): raise its build weight? Long detours for ordinary troops near plain beaches (one test about 14 days): fine as is?
- **UNIT-ART-3 (stopped at the $5 floor, 5 of 12 sets made, branch unit-art-3 dca8cdb, not merged).** Made: Special Forces, Paratroopers, Jammer, Heavy Bomber, Maritime Patrol (225 pictures, about $8.93; log total about $54.24; estimated balance about $6.61). Not made: AWACS, Stealth Bomber, Marines, the 5 uniques (about $3.6 more). Sheets sent 2026-11-19. Waiting on the owner: OK for 12 free flips/cut-out fixes; 7 must-have redraws (about $0.35); bomber redesign (copies B-52/B-1B/Tu-160/H-6, $0.7–1.8); paratroopers show no parachute gear; jammer NATO look 1 copies the M113; MPA look-alikes; top-up for the rest.

- **Weather (clips sent 2026-11-19 night):** pick rain/snow option A (classic), B (long and windy) or C (fine and dense); branches weather-opt-a/b/c. The cloud colour fix is merged on master (d4d0bb5).
- **Rebels (sheets sent):** OK to merge (branch rebels 419f514)? Open choice: should an ally's troops count for holding a captured city (now only the holder's own)?
- **3D CITIES restyle: owner 2026-11-21 "Branch cities-3d-2 isn't good enough, so don't merge it" (replaced by CITIES REDO in Next free slots). Old note: (branch cities-3d-2 90c54b8, not merged; 9 before/after sheets sent 2026-11-20):** 3D blocks in the owner's colour from closer than play zoom, cities keep size and detail; fixes master's blurry patches close in; desktop speed level with master, phone memory flat. Weak points: at play zoom (hexPx 28) your own cities are pale green blocks on green land, little different from now; night is unchanged (no lit windows close in, same as master). Waiting on the owner: merge? stronger contrast at play zoom? lit windows at night?
- **Map look, old vs new (sheets sent 2026-11-19):** pick which of the 15 numbered changes to bring back (scratchpad mapcompare/answer.md; most likely causes of 'old looked nicer': 7 fog veil, 4 tint never eases off, 1 close-up richness (being restored by MAP SURFACE), 11 and 13 bold borders and road web, 8 smoothed snow, 6 darker sea). Guess 1 partly right; guess 2 mostly no (the fog veil dulls the snow, not the tint colours).
- **Map surface: merged 2026-11-22 (owner: "As for map changes merge it"), Dev Build v66.** Texture (map-texture b72c911), jungle C reworked (map-jungle-c d48b709, c2 default) and sea B (map-sea-mix 500c27a) are on master. Still open: **sea mix pick** (none = plain B, now live / region (recommended) / depth / patches; built in, switch `SEA_MIX`), Hudson Bay and the wide Okhotsk area in the region mix, mix strength; and **which of items 4, 5, 7, 8 of the old-vs-new list to bring back**.
- **Conflict of Nations numbers:** constacks.com can't be read (security checkpoint; its robots.txt asks AI crawlers to stay out); taken off the allowed sites 2026-11-18. Paste the figures or send screenshots if you want them matched.
- **Research tree rebuild:** the CoN tree and card screenshots arrived (2026-11-18); the owner's own mockup did not. Starts when a job slot frees.
- **Gemini log:** each art branch has its own copy of assets/art-src/gen-art-log.jsonl (unit-art +110 calls $1.83, bunker-art +15 calls about $0.20); merge them by joining the lines. Estimated balance about $38.85.
- **Bunker level 4:** merged as it is (owner OK 2026-11-19). Its small blockhouse floats: fix it later (one Gemini edit, about $0.04)?
- **MAP-FIX:** zoomed-in shots sent 2026-11-19 (Kabul, a moving army, a ship, the two '?' outlines). Before merging: the branch's public build fails (the test-only window.__unkDotOl sits outside a test block; remove it once the outline is picked). OK to merge (map-fix 5e9bd37)? The '?' dot: keep the dark outline or switch to the light one (reads better on red enemy land)?

- **Merged in v50 with the built defaults; still open if you want to change them:** aircraft (parked aircraft keep their pictures, bigger bomber/AWACS/patrol sizes, Stealth Bomber humps, old jet/int sheets still loaded); buildings (dock basins, small rivers count, construction sites 10% bigger?, move ~93 port cities' map points to their real places?); shipping routes (fleet selection no longer shows routes, cut-off convoys hidden when off, coaster/tanker drawn in code); building rules (Army Base only or both; Fortifications price: option 2 recommended; the +40% per extra Army Base; a starting Army Base in the biggest city?).
- **Explosions (FX-2 ready):** the 'two not showing' were nuclear (the rules have no tactical nuke or ICBM, so it only appeared from test buttons) and chemical (no clip, and no chemical weapon in the rules). Add real chemical / tactical nuke / ICBM weapons to the rules (docs/RESEARCH.md 12.5: research, cost, damage, fallout, diplomacy)? OK to merge the clips?

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
| **Q-DEFAULTS** (v69, 2026-11-26, merged 4859784; owner: "go with your defaults on Q1–Q31" and "D10: fix it"): triage found every Q1-Q31 default already in force or "unchanged" (no new code); Q8/Q19 handed to MISSILES, Q27/Q28 to REBELS (done on rebels-2). D10 tightened: a friend gives at most about 16% more value than it gets back, two favours in 3 days and the next deal must pay its way, no empty counter-offers, 20-day wait to re-ally after leaving, opinion from deals at most once a day. Recheck READY; 2880 random deals, footer always matched. Open: 20 days right? $1M steps for small deals? favours reason in the footer? | Opus |
| **MERGE 1126** (v68, 2026-11-26, merged 8448af9 after the owner's OK: "Merge Market, Fog-clash and UI-fixes." / "Merge auto-test/fixes ... after re-running the checks on top of today's merges" / "D10: fix it"): Stock Market to the reference (computer nations post buy and sell offers; flag opens ABOUT PLAYER with "« Market"), fog (enemy armies outside your land and sight hidden), columns that meet fight, blue Build/Upgrade/Train buttons when affordable, infantry icon fits its diamond, the playtest's 16 fixes, D10 (a computer nation refuses a deal where it gets nothing back). Independent verify SAFE; all checks pass. Known gap: a $1M token payment still gets round D10 (follow-up in Q-DEFAULTS). | Opus |
| **ECON-START** (v67, 2026-11-26, merged 244638b after the owner's OK: "Merge the economy and diplomacy. I like them."): capital Airbase and fighter at the start, level 1 Army Base $10M and 30 minutes, mobilization queue as a membership feature with a dev toggle; independent verify identical to a scratch merge, all checks pass; units about 10-15% fewer than before at day 60 (balance look later) | Opus |
| **DIPLOMACY** (v67, 2026-11-26, merged 244638b, same OK): reference layout list, ABOUT PLAYER pages, conversation, trade builder with Accept / Decline / Counter; every old action kept; cherry-pick trailers reworded at merge (same code) | Opus |
| **MAP SURFACE** (v66, 2026-11-22): texture back at every zoom (far colours kept, faster detail tiles), jungle look C reworked from Google Earth, sea look B at every zoom; sea mixes built but off until the owner picks. Merged one at a time (texture, jungle, sea); golden, headless, sea-mix, battery and zoom-look checks pass. | Opus |
| Naval cities (Dev Build v65, merge 0898d01, owner OK 2026-11-19): anchor at 349 coastal cities, troops board and land only at naval cities (assault landings at enemy or independent ones, 45 min, first-day penalty), Marines (new unit, any coast when the force is all Marines; infantry pictures until their own exist). Also brings the buildings follow-up (cities-2): buildings on land as drawn, 17% smaller, Naval Yards on the water. | Opus |
| Unit pictures set 2 (Dev Build v64, packed two files a unit by UNIT-ATLAS so the build stays under 511 files): 17 units x 45 pictures, wrong-way pictures flipped, pale plate removed; the cloud colour fix (clouds stay white and grey) | Sonnet / Opus |
| MAP-FIX (owner OK 2026-11-19 night): pinpoint moves to the exact tapped spot, a position dot under every force (the '?' dot dark-outlined, owner's pick), buildings scale exactly with the map, the castle dug-in mark in the amber shield (Dev Build v63) | Opus |
| EMBARK-45 (owner 2026-11-19): boarding and landing take 45 minutes each, exact to the minute; route arrival times now match for sea crossings; Amphibious Doctrine 22.5 min, floor 15 min; old saves capped (Dev Build v62) | Opus / Sonnet |
| MAP-2 (one map look, soft borders, province lines fade in, foreign armies '?' until recon) and the Bunker pictures, option C version 1 at levels 1-5 (Dev Build v61, owner OK 2026-11-19) | Opus / Sonnet |
| Tank pictures (Dev Build v60, owner "Tanks pictures are good" 2026-11-18): 5 groups x 3 looks x side / card scene / top-down, in the research cards and on the map | Sonnet |
| Research tree rebuilt like Conflict of Nations; the Bunker (5 levels, hidden); the nation picker in the old card layout (Dev Build v59, owner OK 2026-11-18) | Opus / Sonnet |
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
