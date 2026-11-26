# Missiles (owner point 12): the approved plan

**Status: approved by the owner on 26 November 2026; being built on branch `missiles` (job MISSILES).** This is the plan as written on branch `plans-1125` (docs/MISSILES-PLAN.md, 25 November 2026), copied here with the owner's answers. Every number below is now the build's number unless the build's report says otherwise (the build's own notes go in section 18 as it lands).

**The owner's answers (verbatim):**

> 2026-11-26: "M1–M15 (missiles plan): all OK, except M13: send me the gas and radiation zone mockup first."
>
> 2026-11-26 (second set): "MISSILES M13: approved, with one change: give the gas zone a stronger sickly-green tint and a dashed hazard border like the radiation one; on green land it nearly disappears."

So M1 to M15 are answered with the suggested answers of section 17; M13 is approved with the gas zone changed (a stronger sickly-green tint and a dashed hazard border like the radiation zone's). Handed to this build from the Q defaults (docs/QUESTIONS.md, job Q-DEFAULTS): **Q8** keep the missile arrival re-check of `rules/air.js` for cruise and ballistic missiles (land damage only where the land is hostile or enemy forces stand; no abort, no refund); **Q19** a captured silo's cruise and ballistic stock passes to the captor and may be fired. M8 keeps chemical and nuclear missiles apart from both: they self-destruct in flight at peace and are destroyed with a captured silo. M15: no separate morale cut; civilian losses go through the one rule (the REBELS casualties modifier, `S.cas`).

The owner's words: *"The Missile Silo needs Conventional Warhead researched first. Cruise missiles don't. Add chemical and nuclear warheads as new missile units in research. Start from the weapons table in docs/RESEARCH.md 12.5 and write the plan first: research days, costs, effects, limits, and how they show on the map. Show me before building."*

Goods are written in the units of `rules/data.js` and docs/RESEARCH.md (a missile's "3 rare" is 3,000 tons in the game, `RES_K`). Distances are hexes (one hex is about 180 km, `KM_HEX`). Health and damage are the rules' own (`effHP`, `hurt()` in `rules/combat.js`).

Contents: 1 in short, 2 how I read the request, 3 today (measured), 4 research, 5 where missiles are built, 6 the missiles, 7 effects, 8 limits, 9 diplomacy, 10 computer players, 11 on the map, 12 worked examples, 13 old saves, 14 build order, 15 test plan, 16 what this changes (decisions, 12.5, auto-test/fixes, rebels branch), 17 questions.

## 1. In short

| | Cruise | Ballistic | **Chemical** (new) | **Tactical Nuclear** (new) |
|---|---|---|---|---|
| Research | Cruise Missiles (as today: open from day 1, 6 days, so ready on day 7) | **Conventional Warhead** (today's Ballistic Missiles, renamed), day 6 | **Chemical Warhead**, day 10, 7 days | **Nuclear Warhead**, day 20, 10 days |
| Built in | **any city with an Army Base, Airbase or Naval Yard**, or a silo | Missile Silo I | Missile Silo I | Missile Silo II |
| Price | $60M | $140M | **$170M**, 12 rare | **$400M**, 30 rare |
| Build time | 36 h | 72 h | 84 h | 108 h (built only in Silo II or higher; 96 h at Silo III) |
| What it does | power 7 on the forces in one province | power 16, wrecks a building level | a small blast, then **gas for 12 h**: every ground force there loses 2.5% of its health an hour and fights 20% worse | **half the health of everything in the province** (armour and ships 40%), 12% in every neighbouring province, every building knocked out 48 h and two levels wrecked, **radiation for 48 h** |
| Civilians | as today | as today | **civilian casualties 20** in a city: its morale target −20, fading by a third a day (morale itself falls about 5 points at most), 4% of its people | **civilian casualties 30** (the morale plan's limit: morale falls about 7 points at most), 12% of its people; −10 and 2% next door |
| Limits | 2 stored per city without a silo | none | 2 per silo, 6 per nation, one launch every 12 h | 1 per silo, 3 per nation, one launch every 24 h, at least 6 h in flight |
| Diplomacy | none | none | victim −30, everyone else −15, "Used chemical weapons" −25 for 50 days | victim −60, everyone else −35, "Used nuclear weapons" −30 for 60 days; the victim's allies join the war |

- **The Missile Silo needs Conventional Warhead** (day 6) instead of Cruise Missiles. **Cruise missiles need neither**: they come from any city with an Army Base, Airbase or Naval Yard, as soon as Cruise Missiles is researched (6 days, so from day 7).
- **Earliest use**, a nation that does nothing else (the chain of prerequisites sets it, not money): first chemical missile on **day 26**, first nuclear missile on **day 36**. The full nuclear path costs about **251 rare materials of research**: about 20 days of a rich nation's rare-material income, six weeks of a typical one's. Nuclear weapons are a late, rich-nation weapon.
- **Measured against today's missiles** (the real rules in Node, section 3): a ballistic missile takes 30 health from any stack (7% of a 40-unit army). A chemical missile takes 24 to 40% from a stack that stays in the gas, 11 to 26% from one that walks out. A nuclear missile takes 46% of a 40-unit army at once and 63% if it stays in the radiation.
- **The computer fires no missiles today** (0 launches in 60 days on three seeds, 68 nations): the new weapons will not flood computer games. It gets a strict use rule (section 10).
- **On the map** the existing looks do the work: the launch plume, the trail and the INCOMING marker (labelled CHEMICAL or NUCLEAR), the chemical blast and gas cloud, the tactical nuclear flash and mushroom cloud. New: a gas zone and a radiation zone marker on the province for as long as they last (mockups in section 11).

## 2. How I read the request

1. **"The Missile Silo needs Conventional Warhead researched first."** Today the silo needs Cruise Missiles (`canBuildHere`, `rules/production.js`: `k === 'silo' && !has(S.owner[p], 'msl1')`). It will need **Conventional Warhead**, a new name for today's **Ballistic Missiles** node (`msl2`, day 6): the node that gives the silo and the ballistic missile. Keeping the id keeps old saves and every `has(n, 'msl2')` as they are.
2. **"Cruise missiles don't."** Cruise missiles need neither Conventional Warhead nor the silo. If they still came only from a silo they would need Conventional Warhead after all, so they get another home: **any city of yours with an Army Base, Airbase or Naval Yard** (a launcher truck, an aircraft, a ship). Question 1 checks this reading.
3. **"Chemical and nuclear warheads as new missile units in research."** Two new research lines in Strategic Weapons, each opening its own missile, built and stored like the other two: **Chemical Missile** and **Tactical Nuclear Missile**. docs/RESEARCH.md 12.5 had them as add-ons ("+$40M on a missile"); here they are missiles of their own, priced from the ballistic missile plus the 12.5 add-on.
4. **The ICBM** of 12.5 is not part of the request. Its numbers are here (section 6.3) as an option for later; question 3.

## 3. Today, from the code (and measured)

**The missiles** (`MISSILES`, `rules/data.js`; research `mslOf`, `rules/research.js`; flight and impact `launchMissile`, `missileImpact`, `rules/air.js`):

| | Cruise (`cm`) | Ballistic (`bm`) |
|---|---|---|
| Price | $60M, oil 10, materials 10, iron 4, electronics 8, rare 3 | $140M, 20 / 24 / 10 / 16 / 8 |
| Build | 36 h (Silo II 32, III 29) | 72 h (65, 58) |
| Range, speed | 28 hexes (32, 36 with Range 1 and 2), speed 9 (11, 13) | 90 hexes (102, 114), speed 22 |
| Flight | distance / speed, at least 2 h | at least 4 h |
| Power | 7 | 16 (19 with Heavier Warhead) |
| Interception | each SAM in or next to the target (a Frigate 0.6, next door half) 12%, Anti-Missile Shield x2 / x2.5 / x3, at most 85% | 5% each |
| On impact | forces at war with the launcher: `K x power x 12` (21 or 48), times `MSL_VS` (soft 1.2, armour 1, air 0.4, ships 0.9), shared by health | the same, morale −25, one building level wrecked (a Bunker shields as for any hit), links cut 72 h |
| Land | war damage 12 (morale −12, people −1.4%), links cut 48 h | war damage 22 (−22, −2.6%) |

The damage is a **fixed amount shared out over the stack**, so a bigger stack loses a smaller share. Measured with the real `hurt()` (scratch probe, mean dice):

| Stack | Health | Cruise | Ballistic | Ballistic + Heavier Warhead |
|---|---|---|---|---|
| 10 infantry | 100 | 14 (1 unit) | 33 (3 units) | 39 (3) |
| 6 tanks + 4 infantry | 124 | 12 (0) | 27 (2) | 32 (2) |
| 20 units (8 infantry, 6 tanks, 3 artillery, 3 SAM; $680M) | 215 | 13 (0) | 30 (1) | 36 (1) |
| 40 units (double that; $1,360M) | 430 | 13 (0) | 30 (1) | 36 (1) |

**The Missile Silo** (`BUILD.silo`): $140M, materials 40, iron 15, electronics 10, 5 days; Silo II $224M (64 / 24 / 16), Silo III $358M (102 / 38 / 26), 5 days each. Levels II to V build missiles 10% faster each. Stocks are kept per province (`S.mstock[p] = {cm, bm}`), with no limit.

**The computer** (`aiMissiles`, `rules/ai.js`): it builds a silo only in its capital with over $260M (30% a turn) and missiles only with over $320M in hand, and fires only at a province holding enemy forces of power 30 (cruise) or 60 (ballistic) that are standing still. Three 60-day games of the nations world (seeds 12345, 7, 99; 68 nations; the computer plays them all):

| Day | Nations with Cruise Missiles | with Ballistic Missiles | Silos | Missiles built | Missiles fired |
|---|---|---|---|---|---|
| 20 | 12 / 13 / 13 | 0 / 0 / 0 | 1 / 0 / 0 | 0 | 0 |
| 40 | 13 / 15 / 16 | 0 / 0 / 0 | 1 / 0 / 0 | 0 | 0 |
| 60 | 15 / 17 / 18 | 2 / 0 / 0 | 3 / 2 / 0 | 0 | 0 |

The playtest branch found the same (docs/IMPROVEMENTS.md IMP-8 on `auto-test/fixes`: "missiles built, 0 fired"; the target search counts only forces standing still).

**Incomes** (the nations world, day 1, `income()`): money $182M to $221M a day after upkeep (middle $190M); rare materials 6.3 to 16.5 a day (middle 11.9). docs/RESEARCH.md 6.1 measured the classic world over 60 days: rare materials 1.6 / 8.4 / 21 a day (lowest, middle, highest), about three quarters of it spent on research.

**The looks already exist** (`fx.js` WFX, "effects only for now" in RELEASES.md): `cm`, `bm`, `chem` (a small burst, then a low olive-yellow gas sheet that spreads over about a province and a half and lingers 26 s, 15 s on Low), `tac` (blinding flash, fireball, shock ring, small mushroom cloud, crater), `icbm` (screen-wide flash, huge fireball, tall mushroom cloud, burning ground for 10 game hours). The rules never trigger `chem`, `tac` or `icbm`; only the developer panel does.

## 4. Research

Strategic Weapons gets two new lines, Chemical Missile and Nuclear Missile, and one node changes its name. Command & Logistics gets one node. Every new prerequisite stays inside the missile line (RES-3's missile exception); the Command & Logistics node needs nothing, as its other nodes.

| Day | Node (id) | Line | Type | Effect | Price | Days | Needs |
|---|---|---|---|---|---|---|---|
| 1 | Cruise Missiles (`msl1`) | Cruise Missile | Unlock | **any city with an Army Base, Airbase or Naval Yard** (or a silo) builds Cruise Missiles. Was: "Missile Silos can build Cruise Missiles" | $96M, 20 mat, 31 rare (unchanged) | 6 | |
| 6 | **Conventional Warhead** (`msl2`, was "Ballistic Missiles") | Ballistic Missile | Unlock | **Missile Silos can be built**; silos build Ballistic Missiles | $144M, 35 mat, 64 rare (unchanged) | 8 | Cruise Missiles (unchanged) |
| 10 | **Chemical Warhead** (`msl_chem`) | Chemical Missile (new) | Unlock | silos build Chemical Missiles | $183M, 40 mat, 55 rare | 7 | Conventional Warhead |
| 16 | **Persistent Agent** (`chem_long`) | Chemical Missile | Upgrade | gas lasts 18 h instead of 12 | $130M, 45 mat, 30 rare | 5 | Chemical Warhead |
| 20 | **Nuclear Warhead** (`msl_nuc`) | Nuclear Missile (new) | Unlock | Silos II and up build Tactical Nuclear Missiles | $390M, 90 mat, 112 rare | 10 | Heavier Warhead (`bm_pow`, day 14) |
| 9 / 17 | **CBRN Defence** 1/2 (`cbrn`) | Command & Logistics | Upgrade, 2 levels | gas and radiation hurt your forces 50% / 75% less; your cities lose a quarter / half fewer people to them | $110M, 40 mat, 30 rare / $160M, 60 mat, 45 rare | 5 / 6 | nothing |
| (28) | ICBM (`msl_icbm`), **option, not in the first build** | Nuclear Missile | Unlock | Silos III and up build ICBMs | $420M, 120 mat, 120 rare | 10 | Nuclear Warhead |

Why these numbers:

- **Prices** follow the tree's unlock formula on the missile's own price `w` (docs/RESEARCH.md 5: $30M + 0.9 w, rare 12 + w/4): Chemical Warhead w = 170 gives $183M and 55 rare; Nuclear Warhead w = 400 gives $390M and 112 rare. Materials are raised to the level of today's Strategic Weapons steps (35 to 80). Persistent Agent uses the upgrade formula. CBRN Defence is priced like the Command & Logistics doctrines.
- **Nuclear Warhead needs Heavier Warhead, not Chemical Warhead** (12.5 had "Chemical warhead research"). A nation that wants nuclear weapons should not be pushed through chemical ones first; Heavier Warhead is the natural step before it. Question 2.
- **One protection node, not one per ground line** (12.5: "a protection upgrade in each ground line would halve it"). Twelve new nodes for one weapon few nations will use is too much; one node in Command & Logistics covers every force. It fills the icon slot docs/RESEARCH.md 11 reserved ("Chemical and nuclear protection").

**Earliest dates** (the chain sets them: two slots, every step started the day it may start):

| Step | Chemical path | Nuclear path |
|---|---|---|
| Cruise Missiles | day 1 to 7 | day 1 to 7 |
| Conventional Warhead | 7 to 15 | 7 to 15 |
| Missile Silo I (5 days) | 15 to 20 | 15 to 20 |
| Chemical Warhead / Heavier Warhead | 15 to 22 | 15 to 21 (second slot) |
| Missile Silo II (5 days) | | 20 to 25 |
| Nuclear Warhead | | 21 to 31 |
| First missile built | **day 25.5** (84 h) | **day 35.5** (108 h at Silo II) |

**Rare materials of research**: 150 for the chemical path (Cruise 31, Conventional 64, Chemical 55), 251 for the nuclear path (Cruise 31, Conventional 64, Heavier 44, Nuclear 112). At three quarters of income spent on research, a nation earning 8 rare a day (the classic world's middle) needs about 25 days for the chemical path and 42 for the nuclear one; one earning 16.5 a day (the nations world's richest at the start) needs 12 and 20. The tree's Strategic Weapons category rises from 728 to 925 rare materials (1,045 with the ICBM); CBRN Defence adds 75 to Command & Logistics.

## 5. Where missiles are built

| Missile | Built in | Stored | Queue |
|---|---|---|---|
| Cruise | **a city of yours with an Army Base, Airbase or Naval Yard (any level), or a Missile Silo** | in that city, **at most 2 in a city without a silo** (stored plus queued); no limit in a silo city (as today) | the city's training queue; it does not count toward the 2-unit limit (BLD-8), but a city without a silo queues at most 2 missiles |
| Ballistic | Missile Silo I | the silo city | the silo city's queue (as today) |
| Chemical | Missile Silo I | the silo city, limits in section 8 | the same |
| Tactical Nuclear | Missile Silo II | the same | the same |
| ICBM (option) | Missile Silo III | the same | the same |

- A missile fires from the city that stores it; its range is measured from there. A knocked-out silo stops launches from a silo city (today's rule); a city without a silo stops launching while every one of its Army Base, Airbase and Naval Yard is knocked out.
- Silo levels keep their bonus: 10% faster missiles per level above I. Silo II and III now also open the nuclear missile and the ICBM.
- The silo's description: "Builds and stores ballistic, chemical and nuclear missiles (needs Conventional Warhead). Level II: Tactical Nuclear Missiles; level III: ICBMs. Levels II to V: missiles build 10% faster per level above I. Cruise missiles also come from any city with an Army Base, Airbase or Naval Yard."

## 6. The missiles

### 6.1 The table (proposed entries of `MISSILES`)

| | Cruise `cm` | Ballistic `bm` | Chemical `chem` | Tactical Nuclear `nuc` | ICBM `icbm` (option) |
|---|---|---|---|---|---|
| Price | $60M | $140M | **$170M** | **$400M** | $600M |
| Oil / materials / iron / electronics / rare | 10 / 10 / 4 / 8 / 3 | 20 / 24 / 10 / 16 / 8 | 20 / 24 / 10 / 16 / **12** | 30 / 40 / 16 / 30 / **30** | 40 / 50 / 20 / 40 / 40 |
| Build (Silo I / II / III) | 36 h | 72 / 65 / 58 h | 84 / 76 / 67 h | - / 108 / 96 h | - / - / 115 h |
| Range (hexes) | 28 (+4 per Range level) | 90 (+12 per level) | **70** (+12 per Ballistic Missile Range level) | **90** (+12 per level) | whole map |
| Speed (hexes an hour) | 9 (+2 per Speed level) | 22 | 18 | 22 | 30 |
| Shortest flight | 2 h | 4 h | 4 h | **6 h** | 8 h |
| Interception per SAM | 12% | 5% | 5% | **4%** | 2%, the Anti-Missile Shield counts half |
| Power | 7 | 16 (19) | 9, then the gas | a share of health (section 7.3) | as nuclear, larger (section 6.3) |
| Targets | forces on land or at sea | the same | **land only** | land or sea | land or sea |
| Picture in flight | `u-cruise-missile` | `u-ballistic-missile` | `u-ballistic-missile` | `u-ballistic-missile` | `u-icbm` |

12.5 proposed $40M and $220M on top of a missile; as missiles of their own they cost the ballistic missile's price plus that ($180M, $360M). The chemical missile is set at $170M (it reaches less far); the nuclear one at $400M with 30 rare, so that one nuclear missile costs a typical nation about two days of money and two to four days of rare materials.

### 6.2 Names

Names only, no pictures, as for the other missiles (AIR-6, docs/DOCTRINES.md 3.5): **Chemical Missile** (short CHM) and **Tactical Nuclear Missile** (TNM), the same for every nation group (no real weapon names). Question 10.

### 6.3 The ICBM (option for later)

12.5's ICBM: $420M there; here $600M, 40 / 50 / 20 / 40 / 40, 144 h, Silo III, whole map, speed 30, interception 2% a SAM with the shield at half effect, Nuclear Warhead research first. Effect: the nuclear effect of section 7.3 with a 60% / 50% blast in the target, 20% / 15% next door and radiation 72 h. It uses the existing `icbm` look (the screen-wide flash and burning ground). Leave it out of the first build; the numbers are ready.

## 7. Effects

### 7.1 What changes on impact, by weapon

| | Chemical | Tactical Nuclear |
|---|---|---|
| Forces in the target province | blast power 9 (as a light ballistic missile), then the gas: **2.5% of remaining health an hour for 12 h** (18 with Persistent Agent), armour 1.25%; aircraft and ships untouched; **attack and defence x0.8**; no healing | **soft units and aircraft on the ground lose 50% of their health, armour and ships 40%**; then radiation 48 h: **2% an hour falling to 0** (about 22% in all if they stay), armour half; attack and defence x0.9; no healing |
| Which forces | **every** ground force in the province while the gas lasts: the enemy's, yours, a third nation's, rebels; a force that marches in takes it too | every force in the province, whoever's, and those that enter while the radiation lasts |
| Neighbouring provinces | nothing | every force loses 12% of its health (armour and ships 8%); no radiation |
| Bunker | its usual protection, on the blast and on every hour of gas | **half** its protection (level II: 21% instead of 43%) |
| CBRN Defence 1 / 2 | the gas 50% / 75% less | the radiation 50% / 75% less (not the blast) |
| Buildings | none | every building in the province **knocked out for 48 h** (`knockOut`); **two building hits** (a level each; the Bunker shields as for any hit, BLD-9); roads and rails cut 96 h (72 for a ballistic missile today) |
| The city's people | **war damage 40** (20 in countryside), so **civilian casualties 20** (10) by the morale plan's rule (half the war damage): the morale target −20, fading by a third a day; **4% of the people** (a Bunker spares its level's share) | **war damage 60**, so **civilian casualties 30** (the morale plan's limit); **12% of the people**. Next door: war damage 20, casualties 10, 2% of the people |
| Output | as morale | the province makes **half** for 48 h (on top of morale and the knocked-out buildings) |
| At sea | not allowed (no target) | ships in the sea zone: the blast (40%); no radiation |
| Intercepted | no gas, nothing happens | no detonation, nothing happens |

The gas and the radiation are rules state, one entry a province: `S.haz[p] = {k:'gas' or 'rad', until:<hour>, by:<nation>, f:<strength>}`, read once an hour by `tick()` (a new `hazHour()` next to `missileTick()`), by the battle step (the x0.8 / x0.9), by healing and by `provYield`. A second strike on the same province renews the clock (the longer wins); it does not stack.

### 7.2 Morale and civilian casualties

These weapons use the morale plan's one rule (docs/REBELS-PLAN.md 2.5, on this branch), with nothing of their own: each point of war
damage in a province adds half a point of civilian casualties there; casualties lower the province's morale **target** (at most −30) and
shrink by a third at each day change; morale itself moves an eighth of the way to its target each day. War damage per strike: cruise 12 and
ballistic 22 as today (casualties 6 and 11), **chemical 40** (casualties 20; countryside 20, casualties 10), **nuclear 60** in the target
(casualties 30, the limit) and 20 in each neighbouring province (casualties 10).

What that does to morale itself (worked out day by day, nothing else changing):

| Strike | Civilian casualties | Morale the next day | Lowest (day 4) | Two weeks later |
|---|---|---|---|---|
| Cruise | 6 | −1 | −1 | −0.5 |
| Ballistic | 11 | −1 | −3 | −1 |
| Chemical | 20 | −3 | −5 | −2 |
| Tactical nuclear | 30 | −4 | −7 | −3 |

So a strike does not make a calm city rebel; it tips a city that is already near the 33% line (a nuked homeland city at 38% falls to
about 31% and can rise). A city captured soon after a nuclear strike starts at 25% like any captured city, but its target is up to 24
points lower for the first days than after an ordinary battle (casualties −30 instead of about −6): in the rebels plan's Dresden example the
target falls from 29% to 5%, and morale sits near 22% for the first week instead of rising from 25% toward 29%, so the chance of a rising
there is about 60% a night before the troop rule, against 40 to 50%. Nuking a city is a poor way to take it.

Until the morale plan is built, the same war damage goes through today's `warDamage(p, v)` (morale −v at once, people −0.12% a point; it
heals 2.5 a day), and the people lost (4% and 12%) are taken directly. Question 15 asks whether a strike should also cut morale at once.

### 7.3 Measured: the damage a stack takes

The real rules in Node: today's `hurt()` for the blasts, a scratch model of the gas and radiation hours (`scratchpad/proposals/missiles/nuke-probe.js`), mean dice, no research.

| Stack | Ballistic today | Chemical, stays 12 h | Chemical, walks out after 4 h | Chemical, Bunker II | Chemical, CBRN Defence 1 | Nuclear, blast | Nuclear, stays 48 h | Nuclear, Bunker II | Nuclear, Bunker V | Nuclear, next door |
|---|---|---|---|---|---|---|---|---|---|---|
| 10 infantry (health 100) | 33 (3 units) | 40 (3) | 26 (2) | 25 (2) | 30 (2) | 50 (5) | 69 (6) | 39 (3) | 30 (2) | 12 (1) |
| 6 tanks + 4 infantry (124) | 27 (2) | 35 (2) | 22 (0) | 21 (0) | 25 (2) | 54 (4) | 72 (5) | 42 (2) | 32 (2) | 12 (0) |
| 20 units (215; $680M) | 30 (1) | 59 (4) | 32 (1) | 36 (1) | 39 (1) | 99 (8) | 135 (12) | 78 (6) | 58 (3) | 22 (0) |
| 40 units (430; $1,360M) | 30 (1) | 105 (8) | 49 (2) | 64 (5) | 64 (5) | 198 (18) | 270 (25) | 156 (13) | 117 (8) | 45 (1) |
| 3 Frigates + 2 Cruisers at sea (82) | 18 (0) | not allowed | | | | 33 (1) | 33 (1) | | | 7 (0) |

What it says:

- **The chemical missile is the answer to the big stack that sits still** (a siege, a city garrison, a stack waiting to attack): 24 to 28% of any size of stack, where a ballistic missile takes a fixed 30 health. A stack that walks out within 4 hours halves it. Against 10 infantry it is only a little better than a ballistic missile, for $30M more and a diplomatic price.
- **The nuclear missile breaks an army**: 18 of 40 units at once ($620M of a $1,360M army) for $400M, 25 if the army stays. A Bunker V garrison still loses about a quarter. Six SAMs with the Anti-Missile Shield 3 stop about half of them (4% a SAM, 18 SAM-equivalents: 52%).
- Against ships the nuclear missile is a strong ballistic missile; the chemical one cannot be fired at sea.

## 8. Limits

| Limit | Chemical | Tactical Nuclear | Why |
|---|---|---|---|
| Stored and queued | **2 per silo, 6 per nation** | **1 per silo, 3 per nation** | no stockpile for a single crushing day |
| Launch cooldown (per nation, every silo) | **one every 12 h** | **one every 24 h** (shared with the ICBM) | no salvo; each strike is its own decision, with its own diplomatic cost |
| Shortest flight | 4 h | **6 h** | the target sees it coming (INCOMING) and can move out |
| Range | 70 hexes (+12 / +24) | 90 (+12 / +24) | |
| Who | any nation with the research and the silo level; the computer as in section 10 | the same | the same rules for everyone (AI-1) |
| Targets | a land province of a nation **at war with you**, or an independent one where your enemies stand | the same, or a sea zone with enemy ships | as today's `missileCheck` |
| **Never** | **a province you own** (also one you captured: the people are yours to keep), a sea zone | **a province you own** | no gassing or nuking your own cities to stop rebels or invaders |
| Your own forces | **hit**: the UI warns before launch | **hit**, in the target and next door: the UI warns | the weapon does not choose |
| At peace while in flight | **self-destructs** (Q8 option A, `auto-test/fixes`) | the same | |
| Captured silo | its chemical and nuclear stock **is destroyed** (Q19 option A) | the same | no nuclear weapon changes hands with a city |

## 9. Diplomacy

The game's opinion (`opinionParts`, `rules/diplomacy.js`) adds memory (`S.mem`, −100 to +100, back toward 0 by 1 a day), a treaty breaker mark (−25 falling to 0 over 50 days), alliance, war and so on. Today a surprise war costs −60 with the victim and −20 with every nation that likes it; a formal declaration −50 with the victim. The computer's answers read it: a non-aggression pact needs opinion 0 or more (−20 when it is at war), passage 25, an alliance 35; deals are valued 1.2 per point.

| Act (at launch, intercepted or not) | The victim | Every other nation | Marks | Allies |
|---|---|---|---|---|
| **Chemical launch** | memory −30 | memory −15 (−8 if it is itself at war with the victim) | **"Used chemical weapons"** (a new opinion line with the treaty breaker mark's numbers: −25 with everyone, fading over 50 days; not shown as "treaty breaker") | none |
| **Nuclear launch** | memory −60 | memory −35 (−15 if at war with the victim) | **"Used nuclear weapons" −55, fading over 60 days** (new opinion line; the same total at launch as the breaker mark and a −30 line together) | **the victim's allies and coalition partners join the war** (the existing `joinDefence`), unless in a truce or pact with the launcher; **a computer ally of the launcher whose opinion falls below 0 ends the alliance** |
| Fallout on a third nation's province (nuclear, next door) | | that nation: memory −40 more | | no war (DIP-1) |

A worked case: France likes Germany (opinion of Spain 0 before). Spain gasses a German army: France's opinion of Spain falls to −40 (memory −15, used chemical weapons −25). France refuses a pact, passage and an alliance (they need 0, 25 and 35). Spain nukes a German army instead: France falls to −90 (memory −35, used nuclear weapons −55); no pact, no deal; Germany's allies declare war on Spain. Two months later (memory back by 1 a day, the marks gone after 50 and 60 days) France is back where it was. The computer never starts a war over it (DIP-1 stays).

Every seat gets a dispatch: "Nuclear launch detected: Spain fired a nuclear missile at Munich. Impact in 6 h." for every nuclear launch in the world, and "Spain used chemical weapons over Munich" on the impact of a chemical missile its seat can see or hears of (the victim and the victim's allies always).

## 10. Computer players

The computer plays by the same rules (AI-1) and fires no missile today (section 3). For these weapons it gets a strict doctrine, so that a computer game does not become a gas war:

| Step | Rule (rules/ai.js) |
|---|---|
| Research | Chemical Warhead weight 0.3, **1 while at war with a nation whose army is 1.3 times its own or more**. Nuclear Warhead 0.15, **1 while at war with a nation that holds Nuclear Warhead** or after losing a fifth of its starting land. Persistent Agent 0.2. CBRN Defence 0.2, **2 while at war with a nation that has used gas or holds Chemical Warhead**. Missile upgrades still want a silo (as today) |
| Silo | built in the capital once it holds **Conventional Warhead** (was Cruise Missiles) and is at war or has over $260M. Silo II only with Nuclear Warhead and over $500M |
| Building | at war only; at most **one chemical missile per silo** and **one nuclear missile in all**; never while its money is under $250M |
| Chemical use | at war; at an enemy-held province (never its own) where **enemy forces of 8 units and power 80 or more stand or will stand within 6 hours** (counting forces on the move, the IMP-8 fix); **none of its own forces there**; not twice at one province within 2 days |
| Nuclear use | only **(a) in answer** to a chemical or nuclear strike on itself or an ally within 7 days, or **(b) when desperate**: it has lost a quarter of its starting land to that enemy, or enemy forces of 1.5 times its garrison's power stand in or next to its capital. Target: the strongest enemy stack in an enemy-held province, its own forces not there or next door; in an answer, the attacker's silo city if it is in range |
| Moving | a march route avoids gas and radiation provinces when a detour costs under a day; a force in one moves out unless it is holding a city under siege |
| Peace | after a nuclear strike, the victim's offers of truce are refused for 3 days by everyone at war with the launcher |

## 11. How it shows on the map

Everything uses the existing looks (`fx.js` WFX and `drawMissiles`); what is new is in bold.

| Phase | Chemical | Tactical Nuclear | Code |
|---|---|---|---|
| Launch | the launch plume at the silo (as the ballistic missile: 4 grey puffs, `bsmPuff`), the launch sound | the same, bigger plume, the deeper `fire:icbm` sound; **every nation sees the launch** (the missile is drawn on every map, whatever the fog) | `drawMissiles`, `snd` |
| Flight | the ballistic missile picture on its tall arc and trail, **a faint olive trail** | the ballistic missile picture, white trail | `drawMissiles`: `m.k` read as `bm` for the arc; the picture by kind |
| Warning | the pulsing red marker on the target; **CHEMICAL** instead of INCOMING for the first 4 s | **NUCLEAR** on every target's map for the whole flight; the edge arrow when the target is off screen; vibration | `warnMark`, `edgeArrow`, `missileAlert` |
| Intercepted | the interceptor's streak meets the missile, both burst (as today) | the same; **no nuclear flash** | `intercept(…, {kind:'bm'})` |
| Impact | the existing `chem` look: a small burst, then the olive gas sheet spreading over a province and a half, 26 s | the existing `tac` look: white veil over the map, fireball, shock ring, dust, mushroom cloud, crater; **burning ground 10 game hours** (today only the ICBM's) | `fxMissile` handler: `wfxStrike(FXW kind)` with `chem` and `tac` instead of only `cm` and `bm`; `WFX.burn` for `tac` |
| Damage number | over the blast, as today; **then each hour "−n" over forces in the gas** | over the blast, and over each neighbouring province hit | `fx('dmg', …)` |
| Aftermath | **a gas zone**: the province under a faint olive haze with a dashed rim and a chip "GAS 9 h" that counts down; it fades over the last 2 hours | **a radiation zone**: a faint yellow tint, a yellow and black hazard rim, a chip with the radiation sign "RAD 40 h" | new: drawn from `S.haz`, with the counters' layer; mockups below |
| Panels | the province panel: "Gas: 9 h left. Forces here lose 2.5% health an hour and fight 20% worse." The army bar: a gas chip on a force inside | "Radiation: 40 h left. Forces lose up to 2% health an hour; buildings knocked out; output halved." | `provHTML`, army bar |
| Launch screen | the range circle (as today); the target's province outlined | the range circle; **the target and its neighbours shaded** and a list: "Also hit: 4 provinces, 2 of your forces, 1 province of Poland (not at war)"; a confirmation: "Nuclear strike. Every nation will think less of you (−35 to −90)." | the launch picker (docs/COMBAT.md, "the launch picker shows its range circle") |
| Silo and menus | the silo panel lists the new missiles (it already lists every `MISSILES` entry); the missile strip gets Chemical and Nuclear cells with stock, "Locked" or "Needs Silo II" | | `citySiloHTML`, `mslDDSync` |

**Pictures** (United States test game, day 2: Mexico fires at Houston; the player fires at Monterrey). The existing looks are frames of the game today; the new parts are drawn over real frames and marked MOCKUP:

- `docs/missiles-plan/missiles-map-desk.jpg` (desktop 1280 x 800, eight panels): 1 the launch plume (today), 2 the target marker reading NUCLEAR (mockup), 3 the chemical impact (today, at 4 s), 4 the tactical nuclear impact (today, at 1.5 s), 5 the gas zone on the province's own outline with its dashed rim and "GAS 9 h" (mockup), 6 the radiation zone with its hazard rim and "RAD 40 h" (mockup), 7 the launch confirmation with the target and its neighbours shaded (mockup), 8 the missile strip's Chemical and Nuclear cells and the radiation line in the city sheet and side panel (mockup).
- `docs/missiles-plan/missiles-map-phone.jpg` (phone 390 x 844, five panels): the NUCLEAR marker, the two zones, the launch confirmation, the strip and the city sheet line.

(The mockups are on branch `plans-1125`, docs/missiles-plan/; pictures are not committed here.)

Question 13 is approved with the gas zone changed: a stronger sickly-green tint and a dashed hazard border like the radiation zone's.

## 12. Worked examples

**A. The siege of Kyiv.** Russia has 30 units (12 infantry, 10 tanks, 4 artillery, 4 SAMs) dug in round Kyiv, Ukraine holds the city with 10 units in a Bunker II. Day 24: Ukraine has Chemical Warhead and one chemical missile in its Lviv silo, 4 h away. It fires: Russia's 4 SAMs in the province stop it 18% of the time. It lands: the blast and 12 hours of gas cost the Russian stack about a quarter of its health (6 to 7 units) if it stays; Russia's stack fights at x0.8 while the gas lasts. Russia pulls back after 4 hours and loses 2. Ukraine is marked a having used chemical weapons: every other nation's opinion of it falls by 33 to 40, Russia's by 55. Ukraine can fire its next chemical missile 12 hours later, if it has one.

**B. A nuclear answer.** Day 38, China is losing a war to India: it has lost 22% of its starting land, and an Indian army of 40 units stands next to Beijing. China holds Nuclear Warhead and one Tactical Nuclear Missile in a Silo II. The computer's rule (b) fires: "Nuclear launch detected" goes to every seat; the INCOMING marker on India's map reads NUCLEAR for 6 hours. India's 6 SAMs without the shield stop it 22% of the time. It lands: the Indian stack loses 18 units, every building in the province is knocked out for 48 h, the province's people fall 12% and civilian casualties of 30 weigh on its morale target (morale itself falls about 7 points over four days); the neighbouring provinces' forces lose 12%; radiation keeps hurting anyone who stays. India's allies join the war; every other nation thinks 70 to 90 points less of China. China cannot fire again for 24 hours.

**C. A human player rushing nuclear weapons** (a rich nation, 16 rare a day): Cruise Missiles, Conventional Warhead, Heavier Warhead and Nuclear Warhead back to back, a silo at once: the first nuclear missile on day 36 at the earliest, having spent 251 rare materials and $800M on research, $364M on Silos I and II and $400M on the missile. A second one needs 4.5 more days; three in store is the limit.

## 13. Old saves

- **Research**: `msl2` keeps its id; only its name changes. Nothing to convert.
- **A silo built with Cruise Missiles only** (allowed today): it stays and keeps working; it builds Cruise Missiles as before. A new silo needs Conventional Warhead.
- **Stocks**: `S.mstock[p]` gains `chem` and `nuc` at 0 when first read (`mstock()` creates `{cm:0, bm:0}` today; it will create all four). A cruise missile stored in a city without a silo is new; old saves have none.
- **`S.haz`**, `N.wmdT` (the last chemical and nuclear launch hours, for the cooldowns), the "Used nuclear weapons" mark: absent in an old save, read as none.
- The save keeps its version; no step at load.

## 14. Build order

Each phase ends green on the checks of section 15 and is its own commit. Rule changes before anything visual.

| Phase | What | Files | Size |
|---|---|---|---|
| 0 | **Blocker, your decision (question 14):** start from master **with `auto-test/fixes` merged** (or rebase on it): its missile fixes (6195531 re-check on arrival, a8fa21c "Not your silo") touch the same functions. Answer Q8 and Q19 (section 17) | | |
| 1 | The silo needs Conventional Warhead; cruise missiles from Army Base, Airbase or Naval Yard cities; the 2-per-city limit; `msl2` renamed; old-save silo kept; the AI's silo rule | `rules/production.js` (`canBuildHere`, `canBuildMissile`, `buildMissile`, `mstock`), `rules/air.js` (`missileCheck`: launch city), `rules/data.js` (node text, silo text), `rules/ai.js`, `index.html` (`TECH_BLD`, build menu reason) | small |
| 2 | The two missiles and the research: `MISSILES.chem`, `MISSILES.nuc`, the nodes `msl_chem`, `chem_long`, `msl_nuc`, `cbrn`; `mslOf` for the new kinds; silo-level requirement; stock limits; cooldowns; target rules | `rules/data.js`, `rules/research.js`, `rules/production.js`, `rules/air.js` | small |
| 3 | The effects: impact by kind, `S.haz` and `hazHour()`, the x0.8 / x0.9 in battle, no healing, output, buildings, people, the civilian-casualties link (the morale plan's term, or `warDamage` until then), interception rates, self-destruct at peace, captured stock | `rules/air.js`, `rules/tick.js`, `rules/combat.js`, `rules/economy.js` | medium |
| 4 | Diplomacy: memory, "Used chemical weapons", "Used nuclear weapons", allies joining, allies leaving, fallout on third nations, the dispatches | `rules/diplomacy.js`, `rules/air.js` | small |
| 5 | The computer: research weights, silo, building, the use doctrine, routes round hazards (and IMP-8's moving-forces count, if not already done on `auto-test/fixes`) | `rules/ai.js`, `rules/movement.js` | medium |
| 6 | The map and screens: `fxMissile` kinds, the NUCLEAR / CHEMICAL labels, nuclear launches seen by all, burning ground after `tac`, the gas and radiation zones, panels, the missile strip, the launch picker's blast area and confirmation, research icons for the new nodes. **Before/after screenshots to the owner before merging** | `fx.js`, `index.html` | medium |
| 7 | Docs: docs/RESEARCH.md (12.5 moves to "as built", the tree tables by `node tools/research-proto.js --write`), docs/COMBAT.md (missiles), BUILD.md, RELEASES.md line, DECISIONS update for AIR-6 and RES-13 | docs | small |
| (8) | ICBM, if approved | as phases 2, 3, 6 | small |

## 15. Test plan

**New tests** (plain Node unless marked):

| Test | Checks |
|---|---|
| `.test/missiles-silo.js` | no silo without Conventional Warhead; a silo with it; an old save's silo without it keeps building Cruise Missiles; Cruise Missiles build in an Army Base, Airbase or Naval Yard city with only Cruise Missiles researched; 2 per such city; none in a city with none of the three; launch range from the storing city; knockouts |
| `.test/missiles-wmd.js` | prices and goods paid; Silo II for nuclear; stock limits (2 / 6, 1 / 3) counting queued ones; cooldowns 12 h and 24 h; no target in own land, no chemical at sea; shortest flights 4 h and 6 h; interception 5% and 4% a SAM with the shield; intercepted: no gas, no blast; the table of section 7.3 within 10% (seeded dice); own forces hit; `S.haz` set, renewed, expired; gas and radiation per hour, armour half, Bunker, CBRN Defence 1 and 2; battle x0.8 / x0.9; no healing; nuclear: buildings knocked out 48 h, two hits, links 96 h, output half; people 4% and 12%; war damage 40 and 60, so civilian casualties 20 and 30 (or today's war damage until the morale plan is built); at peace in flight: self-destructs; captured silo: chemical and nuclear stock gone |
| `.test/missiles-diplo.js` | memory and marks after a chemical and a nuclear launch (victim, others, at war with the victim, third-nation fallout); allies joining; a computer ally leaving; dispatches to every seat; opinions back near 0 after 60 days |
| `.test/missiles-ai.js` | 60-day nations-world games, seeds 12345, 7, 99: chemical and nuclear missiles built and fired only under the doctrine (log every launch with its reason); no nation fires at its own land; prints launches per kind per seed (expected: a handful of chemical, nuclear 0 to 2) |
| `.test/missiles-old-save.js` | a save from master (silo with `msl1` only, stocks `{cm, bm}`) loads, plays 5 days, saves; nothing lost |
| `.test/missiles-fx.js` (browser) | launch, flight, warnings (CHEMICAL / NUCLEAR), impact looks, burning ground, zones, panels, launch picker, at High, Low and Off; the rules state hash the same with effects on and off (`fx-determinism.js`) |

**Existing checks** (the owner's rule for rule changes: the balance and headless checks): `node tools/research-proto.js` (the tree, exit 0, then `--write`), `node tools/headless.js --check` and `--nations --check` (determinism), `node tools/split-golden.js` (the fingerprint changes once in phase 1 or 2 because the computer researches differently; record the new one in `tools/golden-12345.txt` with the reason), `node tools/balance.js 60 3`, `node tools/nations-balance.js`, `node tools/eco-check.js`, `node tools/x1000-check.js` (the new goods prices scale with `RES_K`), `node tools/split-lint.js` (no DOM in the rules), `node .test/fx-determinism.js`, and the research screen tests (`.test/research-con.js`, `.test/v4research.js`) for the new nodes.

## 16. What this changes

**Settled decisions** (`docs/DECISIONS.md` on `auto-test/fixes`):

| Id | Today | After this plan |
|---|---|---|
| **AIR-6** | missiles have names only, no pictures; **cruise and ballistic missiles come from the Missile Silo** | names only (unchanged); cruise missiles also from Army Base, Airbase and Naval Yard cities; ballistic, chemical and nuclear from the silo |
| **RES-13** | chemical and nuclear weapons are not to be built without the owner | this plan is the owner's go-through; once approved, they leave RES-13 (officers, new units, elite units stay) |
| BLD-8 | missiles do not count toward the 2-unit training queue | unchanged; a city without a silo queues at most 2 missiles |
| RES-3 | prerequisites stay in the unit line, or the missile line | unchanged: the new prerequisites are in the missile line; CBRN Defence needs nothing |
| DIP-1 | the computer never starts a war | unchanged: these weapons are used only at war, and joining an ally's defence is already allowed |
| BLD-9 | the Bunker shields other buildings at level-1 strength, protects people up to its level | unchanged; a Bunker counts half against a nuclear blast (new, section 7.1) |

**docs/RESEARCH.md 12.5**: the chemical and tactical nuclear rows are replaced by this plan (separate missiles, not add-ons; numbers in sections 4 and 6); the ICBM row is kept as an option (section 6.3); the two sub-launched missiles stay in 12.5, untouched.

**`auto-test/fixes`** (read, nothing fixed twice): the missile re-check on arrival (6195531, Q8) and the own-silo check (a8fa21c, B2.16) are needed by this plan and come in first (phase 0); IMP-8 (the computer never fires) is the same problem as section 3 and phase 5 includes its moving-forces count unless it is done there first; Q8 and Q19 get chemical and nuclear answers in section 17.

**The rebels plan** (docs/REBELS-PLAN.md on this branch, owner points 8-10; it replaces the old `rebels` branch, 419f514, which is not merged and whose unrest, integration and "30% uprising line" are dropped): missiles need nothing from it to work, but three things meet. (1) Rebels are their own side, at war with everyone: the rule "no target in your own land" stops a nation gassing or nuking rebels in a city it holds. (2) The morale plan's civilian-casualties modifier is how these weapons reach morale (section 7.2); until REBELS is built they go through today's `warDamage`, so **building REBELS first** (the owner's order: REBELS next) means missiles need no stand-in. (3) A struck city near the 33% line can tip into a rising, and a captured nuked city stays in the danger zone a week longer (7.2). What of the old branch is reused is listed in docs/REBELS-PLAN.md section 9 (the 3D rebel squad, the crossed-rifles badge, the city hand-over, the old-save pattern); none of it is needed for missiles.

## 17. Questions for the owner

**Answered 2026-11-26: every suggested answer below (M1 to M15), M13 with the gas zone changed (a stronger sickly-green tint and a dashed hazard border like the radiation zone's).**

1. **"Cruise missiles don't" (need Conventional Warhead):** so they need no silo either, and are built in any city with an Army Base, Airbase or Naval Yard, at most 2 stored there; silos still build and store them without limit? *Suggested: yes.*
2. **Nuclear Warhead needs Heavier Warhead** (day 14, Ballistic Missile line) rather than Chemical Warhead (12.5)? *Suggested: Heavier Warhead, so nuclear weapons do not push nations through chemical ones.*
3. **The ICBM**: in this build or later? *Suggested: later; the numbers are in 6.3.*
4. **Your own forces are hit** by your own gas and blast (and the launch screen warns)? *Suggested: yes.*
5. **No target in your own land**, even with enemies or rebels in it? *Suggested: yes.*
6. **Every nation sees a nuclear launch** (the missile on every map and a dispatch to every seat)? *Suggested: yes.*
7. **The victim's allies join the war** after a nuclear strike, and a computer ally of the launcher leaves when its opinion falls below 0? *Suggested: yes to both; nothing like it for chemical weapons beyond opinion.*
8. **In flight at peace, and captured silos** (Q8 and Q19 on `auto-test/fixes`): chemical and nuclear missiles self-destruct at peace and are destroyed when their silo is captured, whatever is decided for conventional ones? *Suggested: yes.*
9. **The computer's doctrine** (section 10): chemical at war against big enemy stacks only, nuclear only in answer or when desperate, one nuclear missile at most? *Suggested: yes.* Fix IMP-8 (the computer fires no missile at all) in the same build? *Suggested: yes, its moving-forces count.*
10. **Names**: "Chemical Missile" and "Tactical Nuclear Missile" for every nation group, no real weapon names, no pictures (AIR-6)? *Suggested: yes.*
11. **One CBRN Defence node** in Command & Logistics instead of a protection upgrade in every ground line (12.5)? *Suggested: one node.*
12. **The numbers**: stock limits (2 per silo and 6 per nation chemical, 1 and 3 nuclear), cooldowns (12 h, 24 h), nuclear at least 6 h in flight, the nuclear blast at 50% / 40% of health and 12% next door, gas 2.5% an hour for 12 h? *Suggested: yes; the build's balance run (section 15) may tune the shares by up to a fifth and will say so.*
13. **The two gas and radiation zone markers** (mockups in section 11): this look, an olive haze with a dashed rim and a "GAS 9 h" chip, a yellow tint with a hazard rim and a "RAD 40 h" chip? *Suggested: yes, as drawn.*
14. **Build order and the `auto-test/fixes` branch:** this build touches the same missile functions as two fixes waiting on `auto-test/fixes` (missiles re-check their target on arrival; missiles fire only from your own silo). May the missiles build wait until that branch is merged, and come after REBELS (so the civilian-casualties rule exists)? *Suggested: yes to both.*
15. **A direct morale cut:** through the casualties rule a chemical strike lowers a city's morale by about 5 points at most and a nuclear one by about 7 (section 7.2). Add a one-off cut at impact as well (for example −10 and −20, like the agent's "Incite revolt")? *Suggested: no; one rule for every kind of civilian loss, and the nuclear strike's real costs are the buildings, the output and the people.*

## 18. As built (branch `missiles`, rules builder)

The rules are in `rules/*.js`; the screens builder does the map and panels (section 11) next. Where the build differs from the plan above, or settles what the plan left open:

- **Q8 / Q19 and M8 together.** Cruise and ballistic missiles keep today's arrival re-check (no abort, no refund; land damage only where the land is hostile or enemy forces stand) and their stock passes to whoever takes the city and may be fired. Chemical and nuclear missiles self-destruct on arrival when the target is now at peace with the user, or is the user's own land; their stock belongs to the nation that built it (`S.mstock[p].wo`) and is destroyed when the city changes hands by any way (capture, peace, sale, rebels: the hourly `wmdSweep`); both sides are told.
- **"Every force there."** A chemical blast hits every force standing in the province (the ballistic missile's rule, all owners); the gas and the radiation hit every ground force whose province it is (`a.at`), so a column setting out from it too and a force arriving once it stands there; aircraft and ships are untouched by the zones. The nuclear blast hits every force in the province and next door, parked air wings as soft units, ships as armour.
- **The battle x0.8 / x0.9** applies to attack and defence of every force in the zone (the battle step), so a battle fought wholly inside a zone is even; it also applies to ranged fire into or out of the zone, where it counts.
- **People.** War damage goes through `warDamage` (civilian casualties half a point a point: REBELS, M15); the people lost are set to the plan's share (4%, 12%, 2% next door) instead of warDamage's 0.12% a point, times CBRN Defence of the province's holder, a Bunker sparing its level's share (half its share against a nuclear strike, as for the forces).
- **Radiation** is 2% an hour falling in a straight line to 0 over its 48 hours (the 7.3 table's "stays 48 h" column; "about 22% in all" means of the stack's starting health after the blast).
- **The 7.3 table, measured** (`.test/missiles.js`, mean dice, Poland striking a German countryside province): nuclear blast 50 / 54 / 99 / 198, 48 h 69 / 72 / 134 / 269, next door 12 / 12 / 22 / 45 (the plan's numbers to within 1); chemical 12 h 38 / 33 / 56 / 99 and out after 4 h 26 / 22 / 32 / 49 (the plan's 40 / 35 / 59 / 105 and 26 / 22 / 32 / 49: the blast follows the ballistic missile's rule, which gives Germany's protected units a little less than the plan's probe). No share was tuned.
- **Peace after a nuclear strike:** for 3 days after a nuclear launch every nation at war with the user refuses its peace offers (`nucShunned`).
- **Allies at a nuclear launch:** a computer ally of the user whose opinion falls below 0 leaves first; then the victim's computer allies and coalition partners join the war unless in a truce, pact, passage or alliance with the user; a person's nation is told and may join from Diplomacy (as for a surprise attack).
- **The computer's routes:** forces standing in a zone walk to a neighbouring province without one (their own first) unless they hold their own city in battle; after each turn a route through a zone is replaced by one around it when that costs under a day (`aiHazRoutes`, `pathFor(..., avoid)`). The computer builds cruise missiles only in silos, as before.
- **Not built:** the ICBM (Q3: later); the screens (section 11: the screens builder). The page has only what keeps it working: the new kinds in the missile strip and silo panel, the cruise missiles' panel in Army Base, Airbase and Naval Yard cities, the chemical and tactical nuclear blasts on impact (`fx.js` WFX `chem`, `tac`), the tall arc and the nuclear missile on every map.

## 19. As built (branch `missiles`, screens builder)

Section 11 in the page (`index.html`, `fx.js`); the rules are untouched except one event field (the nuclear strike's damage next door, `fxMissile.nb`, for the numbers; no state).

- **Launch and flight** (`fx.js` `MSL_LOOK`, `drawMissiles`): the chemical missile has a faint olive trail, the nuclear one a white, wider trail, a bigger plume (6 puffs) and the deeper `fire:icbm` sound, heard on every map (M6). Only the cruise missile weaves; the chemical and nuclear missiles fly the ballistic arc (they wove before, a slip of the minimal build).
- **Warnings** (`warnMark`, `warnTag`, `edgeArrow`): the target's tag reads CHEMICAL (sickly green) for the first 4 s instead of INCOMING; NUCLEAR (black and yellow, the radiation sign) for the whole flight, on every map that sees the missile (every map does), with a bigger marker; an off-screen target's edge arrow carries NUCLEAR beside it. The vibration and alert sound are today's (`missileAlert`).
- **Intercepted:** chemical and nuclear missiles burst like the ballistic one (`intercept` maps them to `bm`); no nuclear flash. A missile that self-destructs (M8) shows a small burst high over its target (`mslGone`).
- **Impact:** the `chem` and `tac` looks; the tactical nuclear strike now leaves burning ground for 10 game hours (`WFX.burn`, as the ICBM's), and is shown on every map. The number over the blast, then a number over each neighbouring province hit, and each hour the zone's damage over the forces in it (`fxHaz`).
- **Zones** (`drawMslMap`, `drawHazChips`; owner's M13 change): drawn on the province's own outline over the night tint, so they read by day and by night. Gas: a stronger sickly-green tint (`168,214,36` at 34%) with a fine dark hatch, and a dashed hazard rim like the radiation one (a dark edge, a lime band, black dashes), so it stands out on green land; it thins over its last 2 hours. Radiation: a faint yellow tint that weakens with the radiation, a yellow and black hazard rim. Each has a chip just over the zone's top edge, over the counters: "GAS 9 h" with the hazard triangle on lime, "RAD 40 h" with the radiation sign on yellow (not at world zoom). The zones are static: no frame of their own (the chip changes with the game hour, which redraws anyway), so the Battery saver idles as before. Shown to a player for a nuclear strike's zone always, any other where it holds the land, has forces, made it, or can see.
- **Panels:** the province panel and the city sheet carry the zone line ("Gas: 9 h left. Forces here lose 2.5% health an hour (armour half) and fight 20% worse; no healing." / "Radiation: 40 h left. Forces lose up to 2% health an hour (now 1.7%, armour half) and fight 10% worse; buildings knocked out; output halved."); the army bar of a ground force in a zone has a line with its own rate (CBRN Defence counted).
- **Launch picker** (`mslPick`, `mslCfHTML`, `#mslcf`): for chemical and nuclear missiles a tap picks the target instead of firing; the map outlines it (red if it can be hit, grey dashed if not, the reason told), a nuclear strike's neighbours are shaded orange; a card says what is hit, what else (neighbours, your own forces, a third nation's provinces), the opinion cost (−33 to −40 / victim −55 chemical; −70 to −90 / victim −115 nuclear, with the 60-day mark and the allies joining), the cooldown and the stock left; Launch or Cancel (Cancel is the safe green one). The card stands on the side of the map away from the target (desktop) or at the bottom (phone, the camera nudged so the target stays above it). While aiming on a phone the side panel stays closed. Cruise and ballistic missiles still fire on the tap. The card for a chemical strike goes beyond section 11 (which asks it only for the nuclear one): its opinion cost is large too, and a phone tap is easily mistaken.
- **Silo panel and strip:** each kind's row says its limits ("1 of 2 here · 1 of 6 in all · one launch every 12 h (next in 7 h)") or why it cannot be built ("Needs a Missile Silo II"); the chemical and nuclear Launch buttons are red and wait out the cooldown. The strip's cells say Locked, Needs Silo II (or Needs a silo / Needs a base), None built, Ready to launch or Next in n h; the chemical and nuclear icons are the ballistic missile's with a small sign (hazard triangle, radiation sign): names only, no pictures (M10).
- **Research tree:** Chemical Warhead and Nuclear Warhead (unlocks without a research scene) show their signs in the diamond and in the card's scene; Persistent Agent the gas sign with the up arrow; CBRN Defence a shield with the radiation sign.
- **Tests:** `.test/missiles-page.js` also aims a chemical missile through the picker (the card, Launch), and checks the zones and their panel and army bar lines.
