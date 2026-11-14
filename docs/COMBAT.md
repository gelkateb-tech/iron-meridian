# Combat: stack limits, frontage and attack range

How many units fight, and how well, when forces meet, and how guns and warships fire from a distance. The rules live in `rules/combat.js` (frontage, `stackPenalty`), the hourly
battle in `rules/tick.js`, the constants in `rules/data.js` (`STACK_LIM`, `STACK_K`, `STACK_FLOOR`, `STACK_SPD_K`, `STACK_SPD_FLOOR`).

## 1. Stack limits (stack efficiency)

A force fights at full strength up to its **stack limit**: **10 ground units, 5 ships, 5 aircraft**. Above the limit every unit of
that domain in the force deals less damage, and the whole force moves slower:

- damage: `eff(n) = 1` for `n <= limit`, else `max(0.25, 1 − 0.56 × ln(n ÷ limit))`
- speed: `spd(n) = 1` for `n <= limit`, else `max(0.5, 1 − 0.15 × ln(n ÷ limit))`

The 25% damage floor is reached at 38 ground units (19 ships or aircraft); without it the formula would go negative at about 60.

**How size counts.** Per domain, inside one force:

- **land**: its ground units (infantry, armour, artillery, SAMs, jammers ...). Troops embarked on transports at sea are still land.
- **sea**: its warships. A fleet carrying troops counts its ships against 5 and its troops against 10, each domain on its own.
- **air**: an air wing's aircraft, counted in **cards**: a card of swarm drones (6, or 8 with Bigger Salvo) counts once.

Each unit's damage is scaled by its own domain's efficiency. The force's headline penalty (panels, warnings) is the domain furthest
over its limit; the slowest domain's speed factor sets the force's pace (land and sea speed, air wings' flight speed).

### Tables

Land (limit 10):

| stack | damage per unit | unit-equivalents | speed |
|---:|---:|---:|---:|
| 5 | 100% | 5.0 | 100% |
| 10 | 100% | 10.0 | 100% |
| 15 | 77% | 11.6 | 94% |
| 20 | 61% | 12.2 | 90% |
| 30 | 38% | 11.5 | 84% |
| 50 | 25% | 12.5 | 76% |
| 100 | 25% | 25.0 | 65% |
| 128 | 25% | 32.0 | 62% |

Air and sea (limit 5; air in cards):

| stack | damage per unit | unit-equivalents | speed |
|---:|---:|---:|---:|
| 3 | 100% | 3.0 | 100% |
| 5 | 100% | 5.0 | 100% |
| 8 | 74% | 5.9 | 93% |
| 10 | 61% | 6.1 | 90% |
| 15 | 38% | 5.8 | 84% |
| 20 | 25% | 5.0 | 79% |
| 25 | 25% | 6.3 | 76% |

## 2. Frontage, and how the two combine

**Frontage** (unchanged): a province fits `frontage(p)` units of one side in line (14 on open ground, less in rough terrain, +2 in a
city, 18 at sea); a side's units beyond it fight at 25% (`frontScale`). Attacking from more directions widens the front by 50% per
extra direction (`sideFront`) and adds +15% per extra direction (`flankF`, up to +45%).

**The combined rule** (one hour of battle, per side):

    side damage = Σ over the side's forces ( Σ units: unit damage × eff(that force's size in the unit's domain) )
                  × frontScale(side's units, sideFront(province, directions)) × flankF(directions)

So the stack efficiency scales each **force**, and the frontage scales each **side**. Both sides of the same fight see the same front
for the same number of units, so one stack always deals at most what the same units in limit-sized stacks deal: a 128-stack deals 25%
of what thirteen stacks of ≤10 deal in the same place. Splitting helps fully only when the front is wide enough: send the stacks in
from several provinces to bring more of them into line.

Open plains (front 14), the same units as one stack, as stacks of 10 from one side, and as stacks of 10 from two and three sides
(unit-equivalents dealing damage):

| units | one stack | stacks of 10, one side | two sides (front 21, +15%) | three sides (front 28, +30%) |
|---:|---:|---:|---:|---:|
| 10 | 10.0 | 10.0 | – | – |
| 20 | 9.5 | 15.5 | 23.0 | 26.0 |
| 30 | 6.9 | 18.0 | 26.7 | 37.1 |
| 50 | 5.8 | 23.0 | 32.5 | 43.6 |
| 100 | 8.9 | 35.5 | 46.9 | 59.8 |
| 128 | 10.6 | 42.5 | 54.9 | 68.9 |

Past 10 units a bigger single stack adds almost nothing (and past the front, less than nothing until the 25% floor): never put more
than 10 ground units in one force.

The same factor applies everywhere a force deals damage: the hourly battle (land and sea), the ranged fire of guns and warships
(attack range, section 5), air strikes, dogfights and patrols, air defence fire and convoy escorts and raiders
(`sideAV`). The odds preview and the AI's strength estimates use `stackDmg(a)` (the force's damage-weighted efficiency).

## 3. Forces, merging and the AI

- **New units** join an idle force of their kind in the city only while it has room; otherwise they form a new force.
- **Arriving forces** of a player merge with an idle force in the province only while the result stays within the limit.
- **Merging past the limit** (drag a counter onto another, Join, or Merge forces here) is allowed, with a warning:
  "Over stack limit: −39% damage, −10% speed". The army panel shows `Stack 20 / 10 ground units` with the penalty, the odds preview
  warns about your own and the enemy's over-limit stacks, and the map counter of an over-limit force carries a red stack mark.
- **The AI** merges idle forces only up to the limit and splits any bigger idle force into limit-sized stacks; a province holding more
  than two idle stacks sends the others to nearby own provinces (front line first). It attacks with several stacks: from one province
  it sends the strongest until it has about twice what the target needs, stacks standing next to the target in other provinces join
  from their own side, the attackers go in from up to three of the target's neighbouring provinces, and the quicker ones wait so all
  arrive within a few hours. The planned offensives (stage provinces next to the target) launch the same way, timed to arrive together.
  Threatened provinces get up to four stacks, not one.
- Measured headless (all nations AI, 45 days, seeds 12345 / 7 / 99), before → after: biggest AI ground stack 47 / 62 / 45 → 10 / 10 / 10
  (stacks over 10 at one time: up to 27-29 → 0); battles 1039 / 881 / 819 → 1056 / 945 / 830, won by the attacker 69% / 71% / 69% →
  67% / 72% / 76%; provinces taken 1845 / 1668 / 1713 → 1810 / 1821 / 1748 (cities 155 / 134 / 129 → 148 / 142 / 128); attacks from two
  or more directions 6% / 9% / 7% → 11% / 15% / 13% of battles; nations alive 15 / 14 / 15 → 15 / 14 / 14; no nation at war went 10
  days without a battle in either build. The AI turn costs about 10% more (more, smaller stacks to route).
- **Old saves** keep their big stacks: they load and work, with the penalty. The AI splits its own on its next turn; a player splits
  theirs with Split... (Split evenly into 2-6).

Code: `stackEffN`, `stackSpdN`, `stackSizes`, `stackEffs`, `stackPenalty(a) → {dom, limit, size, dmg, spd, over, sizes}`,
`stackPenaltyIf(a, b)` (the merge preview), `stackText`, `stackDmg` in `rules/combat.js`.

## 4. The duel

`node tools/stack-duel.js` (and `.test/stacks.js`) puts one 128-unit ground stack (51 infantry, 26 tanks, 25 anti-tank, 13 artillery,
13 IFVs) against the same units in thirteen stacks (twelve of 4 infantry, 2 tanks, 2 anti-tank, 1 artillery, 1 IFV, and one of 8), on
open plains and in a city, attacking and defending; also 20 against 2 × 10. The split side wins every required case:

| case | place | front | dirs | winner | hours | attacker left | defender left | units lost (atk/def) |
|---|---|---:|---:|---|---:|---:|---:|---:|
| 128 attacks 13 stacks | open | 14 | 1 | defender | 36 | 37% | 91% | 78/0 |
| 13 stacks attack 128 (one side) | open | 14 | 1 | attacker | 41 | 87% | 42% | 0/73 |
| 13 stacks attack 128 (three sides) | open | 14 | 3 | attacker | 30 | 91% | 31% | 0/88 |
| 20 attacks 2 × 10 | open | 14 | 1 | defender | 20 | 21% | 59% | 14/2 |
| 2 × 10 attack 20 (one side) | open | 14 | 1 | attacker | 23 | 43% | 26% | 8/12 |
| 2 × 10 attack 20 (two sides) | open | 14 | 2 | attacker | 16 | 60% | 21% | 2/14 |
| 128 attacks 13 stacks | city | 13 | 1 | defender | 34 | 35% | 94% | 81/0 |
| 13 stacks attack 128 (one side) | city | 13 | 1 | attacker | 54 | 81% | 46% | 0/67 |
| 13 stacks attack 128 (three sides) | city | 13 | 3 | attacker | 40 | 87% | 31% | 0/86 |
| 20 attacks 2 × 10 | city | 13 | 1 | defender | 18 | 19% | 74% | 14/2 |
| 2 × 10 attack 20 (one side) | city | 13 | 1 | defender * | 26 | 27% | 45% | 8/10 |
| 2 × 10 attack 20 (two sides) | city | 13 | 2 | attacker | 26 | 33% | 20% | 8/14 |

"left" is what remains of each side's starting health (units and wounds); a battle ends when one side is destroyed or breaks (morale)
and retreats. \* informational: two stacks of 10 attacking a 20-stack in a city down one road lose to the city's cover and home soil
(the defender takes ×1/1.56 damage, more than the 20-stack's 61% gives away); from two sides (front 21) they take it.

The same duel on the build before the stack limits (`IM_ROOT=<old build> node tools/stack-duel.js`): the 128-stack and the 13 stacks
fought about even (13 stacks attacking one side: neither held, 44% vs 46% left; in the city the 128-stack held), and the split side
lost or drew 5 of the 11 required cases.

## 5. Attack range (ranged fire)

Like Conflict of Nations: artillery, rocket launchers and warships attack enemy forces **within their range without moving into the
province**. Rules: `rangedStep`, `rangedTargets`, `bombardInfo`, `orderBombard` in `rules/combat.js`; the table `RANGE_KM` / `RANGE_HIT`
(and `RANGED_F`) in `rules/data.js`; `rRangeKm` in `rules/research.js`; the AI in `rules/ai.js` (`aiGunsStay`, `aiGuns`, `aiFireSpot`).

| unit | range | hits | notes |
|---|---:|---|---|
| Mobile Artillery | **80 km** | forces on land | fires only from land (not embarked) |
| Rocket Artillery (MLRS) | **150 km** (200 km with Extended-Range Rockets) | forces on land | fires only from land |
| Frigate | **80 km** | ships at sea and forces on the coast | |
| Cruiser | **150 km** | ships at sea and forces on the coast | Long-Range Bombardment: +30% against the coast |
| Submarine | **40 km** | warships at sea only (torpedoes) | not embarked troops, not land |
| Aircraft Carrier | none | | its air wings strike |
| Cruise / Ballistic Missile | own range (`MISSILES` range, research) | | the launch picker shows its range circle |

**Why these values.** They are scaled to the km sight ranges (`VIS_KM`, rules/vision.js): forces see 50 km, recon (Special Forces) 100,
cities 80, airbases 100, UAVs 250-500. Artillery reaches a little past its own sight (80 vs 50), so it needs a spotter (your land, a city,
another force, a UAV, a satellite), as in Conflict of Nations; rockets and a cruiser's guns reach about one province (land provinces'
points are 120-470 km apart, median 216 km; a coastal province's point is 60-260 km from the nearest water of its sea zone, median 104 km),
the frigate's guns as far as artillery, a submarine's torpedoes only close by. All of it is one table to tune.

**How it fires.**

- From where the unit **actually stands** (`armyXY`: its spot `a.pos`, or on the road while marching), to where each target stands, in
  km across the map's seam. Only enemy forces (at war, not air wings) whose spot is within the range of a unit type that can hit them
  (`RANGE_HIT`), and that the shooter's side **can see** (`armyVisible`: no firing blind; a submerged submarine or special forces only as
  the fog rules allow).
- A shooter fires while it **stands** (not marching), is **not fighting a battle in its own province** (then it fights there instead), and
  its fire is not on **Hold** (Fire at will / Hold fire, as before). Its targets may stand, fight in a battle elsewhere, or march.
- Every **15-minute battle step** (rules/tick.js: `tickQ`, and the hour's own step in `tickHour`), each a quarter of the hourly damage, so
  the per-hour totals are the old shelling's (measured: 4 artillery on 10 infantry 60 km away deal 1.10 health an hour, the old rule
  1.06 on the same force one province away; 3 MLRS 0.97 vs 0.94; 5 games each). `BATTLE_PACE` does not apply.
- Damage per hour of a unit type: `n × attack × K × RANGED_F (0.28) × morale and supply × Artillerist commander (guns) × stack
  efficiency × roll (0.8-1.2) × cover`, cover = the target province's `terrain.art` (at most 1; none at sea), then the holder's
  fortifications (×0.8 a level). Each type's damage is shared by the forces of the target group it reaches, by their health; the damage
  classes (`multO`) decide what it does to each unit (a submarine does nothing to troops). War damage to the province: 1.2 a game hour.
- **Target**: by default the province holding the strongest visible enemy power in range, all forces there that each type reaches (as the
  old rule chose a province). The player's **Bombard** order picks a target instead (`a.tgt`: one force `{id}` or the forces of one
  province `{p}`): tap an enemy force or province with the unit selected; the order preview says **In range: bombard** or **Out of
  range**. The unit does not move. A move order or Halt ends the order; while the target is out of range or unseen the unit fires at will;
  a destroyed target ends it.
- Removed: the province-step rule (artillery shelled the neighbouring provinces, MLRS two or three provinces away, at any distance) and
  the shore support in the battle step (every warship in a sea zone next to a coastal battle added half its fire, at any distance): both
  are now this one rule.
- Fleets can stand anywhere in their sea zone: tap the zone with the fleet selected to move it there (as forces do in their own province).

**The AI.** It never marches guns into a battle it can shell: a stack ordered to attack leaves its artillery and rockets behind, on a
firing spot in its own province, when they can reach the target's defenders from there (the rest still has the 2 ground units to take
the province); an idle stack on the front turns its guns into a battery on a firing spot when an enemy force they can see is in reach. A
**battery** (a force of guns only) stands on the spot of its province from which the strongest enemy force it sees is within 90% of its
range, **as far back as that allows**; with nothing in reach it moves up to an own front province (one held by its own troops first). It
is never merged into other stacks, sent on offensives or used as a front reinforcement. An idle fleet at sea takes the same kind of spot
in its zone. Like everything else, its fire needs sight.

**Balance** (headless, every nation AI, 30 days, seeds 12345 / 7 / 99; before → after):

| | 12345 | 7 | 99 |
|---|---|---|---|
| battles | 581 → 594 | 634 → 643 | 613 → 640 |
| units lost a day | 49.5 → 50.1 | 50.8 → 48.6 | 49.8 → 48.7 |
| provinces taken | 1119 → 1148 | 1202 → 1163 | 1251 → 1202 |
| ranged fire, shooter-hours | 477 → 148 | 166 → 156 | 295 → 196 |
| ranged fire, health dealt in 30 days | 183 → 37 | 89 → 19 | 111 → 31 |
| artillery and rockets in service, day 30 | 52 → 60 | 59 → 49 | 54 → 45 |

Ranged fire was and stays a small share of the fighting (about 1,500 units are lost in 30 days; 183 health is some 18 infantry). It is not
overpowered: per hour a battery deals what it did, but now only at what is in range and seen, so it fires less often; the AI's guns no
longer shell provinces 200-400 km away. Battles, losses and conquests stay within the seed-to-seed spread. Headless cost: about 5% more
time a game day.

## 6. Capture, embarking and landing

The rules live in `rules/movement.js` (the block before `canProceed`: `atHeart`, `heartVia`, `sailTo`, `embWait`, `embarkWhy`, `landH`) and the
capture step of the hour in `rules/tick.js`. Everything a capture does (`capture` in `rules/combat.js`: buildings, morale, cores, unrest,
territory, victory points, dispatches) is unchanged; only the moment changed.

- **Capture at the heart.** A land province (independent, or of a power you are at war with) becomes yours **the hour one of your ground forces
  stands at its heart**, the city point, which is the province centre the rules use, while no enemy force holds the province. There is no
  occupation clock any more (`S.cap` stays empty; an old save's half-done occupations are dropped). A force that only crossed the border, or
  stands at another spot of the province, does not take it (its status reads *Reach the city to capture*); a walk that passes within 25 km
  (`HEART_KM`) of the heart takes it on the way (`a.hrt`), and a pinpoint order to a spot beyond the heart walks by the city first (`sailTo`,
  drawn so on the route line). With defenders the battle comes first; the hour the last one is gone, a force at the heart takes the province.
  `CAP_MIN` (2) ground units are still needed; air units never capture. A tap on or right by a city (16 px) aims at the city itself.
- **Embarking only in a naval port.** Ground forces board ships only in a **naval port**: a coastal city of their own or a friend's (`portOk`,
  the same ports fleets dock in and Naval Yards are built in). The route planner (`pathFor`, `surprisePath`) never plans a leg from other land
  onto water: a route overseas marches to a port first, and a move to a sea zone from land without a port is refused with *No naval port here:
  march to a port to embark*. Embarking takes **`EMBARK_H` = 6 h** in the port (`a.emb`, hours left, counted while the force could otherwise set
  off: a battle in the port pauses it); Halt cancels it. A route whose port was lost is planned again or stops.
- **Landing.** Troops come ashore on any coast, as before, or into a port. A landing takes **`LAND_H` = 12 h**, **`LAND_PORT_H` = 6 h** into a
  port held by you or a friend (`a.land`, hours left). Meanwhile the force cannot move on, walk or capture, and fights at the landing penalty of
  its first day ashore (`rLandF`: 67%, 90% with Amphibious Doctrine I, full with II). Stacks they join wait for them.
- **Research and commanders.** Amphibious Doctrine (any level) halves landings; Combat Engineers cut embarking by 30% / 40% (their old
  capture-speed effect, `rCapF`); a Siegemaster commander embarks and lands 20% faster per rank (floor 40%).
- **AI.** The computer plays by the same rules (one planner); a computer force that stands off the heart of land it is taking (after a clash on
  the road) walks to the city. Tests: `node .test/capture-landing.js`.

