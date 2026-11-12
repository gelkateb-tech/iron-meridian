# Combat: stack limits and frontage

How many units fight, and how well, when forces meet. The rules live in `rules/combat.js` (frontage, `stackPenalty`), the hourly
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

The same factor applies everywhere a force deals damage: the hourly battle (land and sea), artillery and rocket fire into neighbouring
provinces, shore bombardment by fleets, air strikes, dogfights and patrols, air defence fire and convoy escorts and raiders
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
