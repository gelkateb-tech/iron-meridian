# Rebels: the plan (owner rules 18 and 19)

This is a plan only. Nothing in the game has changed yet. Every number below is a proposal. The questions at the end each have a suggested answer.

## 1. The rule in one paragraph

A city you capture is **occupied**: it still belongs in spirit to the country you took it from. Each day its people grow more restless, so its **morale** falls, unless your troops are there. **If an occupied city's morale drops below 30%, rebels rise up**: a band of armed fighters appears in the city and attacks your garrison. If they beat it, or the city is empty, and they then hold it for 24 hours, the city goes back to its original country, or becomes independent if that country no longer exists. **Your own original cities never rebel.** The counter is soldiers. **2 units hold a captured city's morale steady. 4 units raise it.** After **10 days with troops there and morale at 50% or more**, the city is **integrated** and never rebels again. You can take land quickly, but only as quickly as you can garrison it.

## 2. Morale in an occupied city

Morale is worked out the same way as today: **100% minus unrest minus war damage**. Low morale cuts the city's output, as it does now. The plan changes only how unrest moves in an occupied city each day.

| What | Effect on morale |
|---|---|
| Captured | starts at 70% at most (unrest 30), minus any war damage |
| Occupation, original country still exists | −6% a day |
| Occupation, original country gone (or the city was independent) | −4% a day |
| Each of your ground units standing in the city | +3% a day, counting at most 4 units (+12%) |
| City cut off from your supply (encircled) | the garrison counts only half |
| War damage | lowers morale directly and heals by 2.5% a day (unchanged) |
| **Pacify** ($40M) | +25% at once. Needs at least 1 of your units in the city. Once every 3 days per city |
| Enemy spy "Incite unrest" | −35% at once (unchanged) |
| Rebels rise | +15% (the angriest people have taken up arms) |

**Days until morale falls below 30%** (a city captured undamaged at 70%):

| Garrison | Original country exists | Original country gone |
|---|---|---|
| 0 units | **day 7** (day 6 if the city had 20% war damage) | day 11 |
| 1 unit | day 14 | day 41 |
| 2 units | never (steady at 70%), integrated on day 10 | never (rises), integrated on day 10 |
| 4 units | never (100% by day 5), integrated on day 10 | never, integrated on day 10 |

**"Recovered" means morale at 50% or more** (the bar turns green). Each day with at least 1 of your units in the city and morale at 50% or more counts toward integration. A bad day takes one day off the count but never resets it. **At 10 days the city is integrated**: it stops losing morale, recovers 4% a day like your own land, and can no longer rebel while you hold it. It does not become one of your original cities (question 6). Starting from 35% morale, **4 units** integrate the city in about 13 days, **3 units** in about 15 days, and **2 units plus one Pacify** in 10 days. **2 units alone** hold it at 35% and it never integrates.

## 3. Rebels

- **When:** once a day, at the daily update. Rebels appear for certain if an occupied city that is not yet integrated is below 30% morale. They do not appear in the first **3 days after a capture** (a grace period), within **5 days of the city's last uprising** (a cooldown), or while rebels are already there. There is no limit on how many uprisings a city can have.
- **How strong:** **3 units in a town** (under 1.5 million people), **4 in a city**, **5 in a large city** (5 million or more), **6 in a metropolis** (20 million or more). They fight as infantry.
- **They fight at once.** Independent forces are at war with everyone, so the rebels battle any garrison in the city straight away. I tested this with the real battle rules: **a garrison at least as large as the rebels wins in 1.5 to 3 days** (2 against 2, 3 against 3 and 4 against 4 won every time), and **a smaller one loses** (2 against 4 lost every time, 4 against 5 won half the time).
- **They never move.** They stay in their city.
- **How they take the city:** if no ground unit of yours stands in the city for **24 hours in a row**, the city flips. The original country gets it back if it still exists, and the rebels become its troops (at least 2 infantry). Otherwise the city becomes independent and the rebels stay as its garrison. You can take it back with an ordinary attack.
- **What is lost:** the same as a capture. Buildings stay, fortifications lose 1 level, and the production queue and any construction in progress are lost. Air wings based there escape to the nearest airbase.
- **When rebels are crushed,** the city stays yours and its morale stays where it is. If morale is still low, 5 days later the next uprising can start.

## 4. Only occupied cities, and the capital question

Rebels come only in cities you captured, never in your original ones. Land ceded to you in a treaty, or bought from the country it belongs to, already counts as your own today and never rebels. If you buy a city from a country that only occupied it, the city stays occupied and can rebel. Your earlier note asked for more: "when the capital is captured… the moral of all the homland citites and the occupied ones starts going down until they rebel". That conflicts with the new rule. The options are:

- **A.** Occupied cities only, always. This is the new rule as written.
- **B.** Once your capital falls, your own cities also lose morale every day, and they can rebel and become independent. This is harsh: one lost capital could break up a whole country.
- **C.** Losing your capital is a one-time shock: every city you hold drops 15% morale at once. Occupied cities can then rebel under the normal rule. Your own cities can fall as low as 30% but never below, so no rebels appear in your homeland.

**Recommendation:** build **A** now. Add **C** later, in the "capital destroyed" step you already planned.

## 5. Countryside (provinces without a city)

**Recommendation: not included.** Countryside never rebels. Occupation can lower its morale only as far as 50%, which affects its output and nothing else. It integrates the same way a city does. This also ends today's flood of small revolts: 350 to 1,350 provinces flip back and forth in a 60-day game.

## 6. Computer nations

They follow the same rule. **Pacify moves into the rules** (`pacify(n, p)` in `rules/api.js`), so the page and the AI use one checked order. The AI learns four habits:

1. Leave **2 infantry** in each captured city until it is integrated. Leave 4 if the original country is still fighting nearby.
2. Pacify when a city is below 45% morale, has a unit in it, and the treasury holds $100M or more.
3. Send a force at least as large as the rebels to crush them.
4. **Self-brake:** start no new attack on a city while it has 2 or more captured cities below 40% morale.

**Simulation** (`node tools/rebels-sim.js`, headless rules, computer players only, the AI never starts wars). Each figure is the average of 2 seeds. "Plan + AI pacify" adds habit 2 only. Habits 1, 3 and 4 do not exist yet.

| World / day 60 | Today's rule | Plan | Plan + AI pacify |
|---|---|---|---|
| 64 nations: land gained by all nations (day 30) | +432 (+412) | +446 (+420) | +449 (+415) |
| 64 nations: uprisings / provinces lost to them | 382 / 363 | 20 / 15 | 12 / 11 |
| Classic 15: land gained (day 30) | +1,228 (+989) | +1,447 (+1,018) | +1,426 (+1,052) |
| Classic 15: uprisings / provinces lost to them | 1,434 / 1,338 | 183 / 124 | 96 / 75 |

What this means:

- Because the AI never starts wars, it only grows into independent land. The plan replaces today's constant churn (mostly countryside) with a few dozen real city uprisings.
- Most uprisings (about 7 in 10) hit cities the AI left empty. In the 64-nation world the AI already parks big stacks in its captured cities (9 of 13 had 4 or more units on day 30), so those cities integrate quickly.
- On its own, the plan **does not** slow the AI. Without today's churn the computer actually keeps about 15% more land in the classic world. Habits 1 and 4 are what turn the rule into a real brake. The build step will measure them with the same script, aiming for **classic-world land at or below today's +1,228 by day 60**.

## 7. What the player sees

- **Morale bar** (province panel, city sheet, city list): green at 50% or more, amber from 30% to 49%, red below 30%. A thin line marks 30% on occupied cities. The bar also shows the daily change and what would fix it, for example "−6%/day · 0 troops · 2 hold it, 4 raise it", plus the integration count ("Integrating 6/10").
- **Warnings** (dispatches; each one is sent once each time morale crosses the line):
  - At 40%: "Morale in Lyon is 40% and falling 6% a day. Rebels will rise below 30% (about 2 days). Station troops or Pacify."
  - At 30%: "Rebels rose up in Lyon (4 units)! Your garrison of 1 is outnumbered."
  - Then: "Lyon will be lost in 24 h unless troops arrive", then "Lyon revolted and rejoined France", or "Your garrison crushed the rebels in Lyon".
- **"Rebels likely" chip** on the city label, the city list and the city sheet when morale is below 40% and falling. When rebels are present it becomes **"Rebels!"**.
- **Pacify button:** stays where it is, now with a reason when it is greyed out ("needs a unit in the city", "again in 2 days").
- **On the map:** rebels appear as **3D soldier figures like other units**, using a new squad model. It shows 3 irregular fighters with no helmets and no plate carriers: bare heads, a cap or a head scarf, jackets and jeans in mixed colours, chest rigs, and AK-style rifles, one of them with a rocket launcher. The figures are the same size as other squads and **visible at the same zoom as other units**. Today, independent forces in the 64-nation world only appear when you zoom in very close; rebels will not have that limit. Their badge has a **grey band with a rebel emblem** (crossed rifles), and they are named **"Rebels"** (today they are called "Partisans").

## 8. Old saves, tests, performance, work

- **Old saves:** they load as they are. Partisans already in a save become rebels. Cities that integrated under the old rule stay integrated. Cities below 30% when a save loads get the 3-day grace, so a load does not cause a burst of uprisings. Countryside morale below 50% is raised to 50% on load.
- **Bug fixed along the way:** today, rebels standing alone take a province **within 1 hour**, not after the intended 24 hours. Their hold counter starts empty, so the first check passes at once (I tested this).
- **Tests:** a new test file, `.test/rebels.js`. It checks:
  - the day tables above for 0, 1, 2 and 4 units
  - grace, cooldown and rebel sizes
  - garrison against rebels
  - the 24-hour flip to the original country or to independence
  - that original cities never rebel
  - integration
  - Pacify through the rules (needs a unit, has a cooldown) and its use by the AI
  - old saves
  - that `tools/headless.js --check` still gives the same result every run
  
  Picture checks cover the bar, the chip and the new 3D squad.
- **Performance:** one daily pass over the provinces, the same as today. Rebel forces are checked once an hour, also as today. The simulation ran at the same speed with today's rule and with the plan (about 3 seconds per game day for the 64-nation world).
- **Files:** `rules/economy.js` (the rule, Pacify), `rules/api.js` (Pacify), `rules/ai.js` (the 4 habits), `rules/state.js` (old saves, the name "Rebels"), `units3d.js` and `tools/bake-assets.js` (the rebel squad, `assets/units/m-reb.webp`), `index.html` (bar, chip, warnings, badge, zoom, help text), `.test/rebels.js`.
- **Estimate:** 3 build steps:
  1. The rules, the AI and the tests.
  2. The display and the 3D squad.
  3. Tuning with the simulation, plus picture checks.

## 9. Questions for you (suggested answer in bold)

1. After a capital is captured, which rule? **A now (occupied cities only); C (a one-time −15% shock, no homeland rebels) later, with "capital destroyed".**
2. Countryside without a city: should it rebel? **No. Morale there only cuts output and never falls below 50%.**
3. Below 30%: are rebels certain, or only a daily chance? **Certain (at the daily update, after a 3-day grace and with a 5-day cooldown).**
4. Rebel strength: **3 / 4 / 5 / 6 units for a town / city / large city / metropolis.**
5. Garrison effect: **+3% a day per unit, up to 4 units: 2 units hold a city steady and 4 raise its morale.**
6. Does an integrated city become one of your original cities? **No. It never rebels and gives full output, but the original country keeps its claim.**
7. Pacify: **$40M, +25%, needs at least 1 of your units in the city, once every 3 days per city.** Without the unit rule, money alone could replace troops for about $13M a day per city.
8. Rebels never lose battle morale (independent forces work like that today). **Keep it: they are fighters with nothing to lose.**
9. Rebel badge emblem: **crossed rifles** (or a raised fist, or a torch)?

## Appendix: what exists today (file:line on master 4de6ebc)

- **Occupation:** original owner `S.home[p]`, current owner `S.owner[p]`. `occFactor` ramps output from 25% to 100% over 240 hours (rules/economy.js:8). Capture sets the occupation hour and raises unrest to at least 30 (city) or 15 (countryside) (rules/combat.js:343, 349-350). Ceded or sold land resets home (rules/diplomacy.js:173, 334; rules/territory.js:139-141). A collapsed nation's land is annexed (and counted as occupied) or becomes independent with 2 infantry (rules/state.js:366-372).
- **Morale and unrest:**
  - `moraleOf = 100 − unrest − war damage` (rules/economy.js:21). War damage is capped at 70 (rules/economy.js:22) and heals 2.5 a day (rules/tick.js:221). Output is multiplied by `0.45 + 0.55 × morale/100` (rules/economy.js:23).
  - `unrestDay` (rules/economy.js:197-214, run daily from rules/tick.js:253):
    - integration after 10 days with 2 or more units caps unrest at 30 (line 206)
    - each day unrest moves by `(5 if home alive, else 3) + 2 for a city − min(9, 1.5 × garrison)`
    - a warning at 50
    - partisans appear by daily chance above 60 (line 210)
  - `rebelHour` (rules/economy.js:215-227, run hourly from rules/tick.js:25): the 24-hour hold uses `++a.hold` on an unset counter (line 219), and `addArmy` never sets it (rules/state.js:284-288). That is why the province flips within 1 hour.
  - The name "Partisans" comes from rules/state.js:301.
- **Spies and Pacify:** "Incite unrest" adds 35 (rules/diplomacy.js:379, 410). The AI uses it against occupied land (rules/ai.js:131-136). Pacify exists only on the page and changes the state directly (index.html:10067 button, 10097 handler); the AI cannot use it. Independent forces are at war with everyone (rules/diplomacy.js:16). The independent side never captures (rules/tick.js:96). Its forces lose no battle morale (rules/tick.js:174). Supply per nation: `SUP` and `supplied` (rules/movement.js:467, 472). Ground units needed to capture: `CAP_MIN = 2` (rules/data.js:517). AI_STARTS_WARS is false (rules/diplomacy.js:10). The AI keeps a garrison only in its capital (rules/ai.js:589-592, 639).
- **Display:**
  - morale in the province panel (index.html:8636), the city sheet bar (8915, 8931), details (10059), the unrest bar with "revolt risk" (10066-10067) and the help text (10510)
  - rebels get the red "war" badge (index.html:6943)
  - independent forces are hidden until zoom `hexPx ≥ 49` in the 64-nation world (index.html:7833-7835)
  - unit types map to models through `TMM` (index.html:5077, 5210)
  - 3D squads: `mSoldier` and `mSquad` (units3d.js:410, 460), the model list `MAPB` (units3d.js:749), baked by `node tools/bake-assets.js map` (tools/bake-assets.js:3)
- **Measurements:** `tools/rebels-sim.js` (read-only; it lays the plan's numbers over an in-memory copy of the rules).
