# Combat pace: how long battles last, and a proposal (NOT applied)

Status: **proposal for the owner. Nothing is slowed down yet.** The 15-minute battle ticks are in (each tick deals a quarter of the old hourly damage, so
today's pace is unchanged). The slowdown is one number, `BATTLE_PACE` in `rules/combat.js` (now `1`). Applying the proposal is the one-line change
`BATTLE_PACE = 0.5`.

## How a battle works now

* Every 15 game minutes (`battleStep`, `rules/tick.js`) each side deals `K * BATTLE_PACE / 4 * (unit attack x modifiers)` split over the other side's
  health, divided by the holder's terrain / home soil / fortification cover. Frontage (14 units on plains, fewer in rough ground) and the stack limit
  (10 land units) cap how much of a big force fights.
* Damage kills a unit only when its wounds reach its health, so most of a fight is wounds.
* Morale falls 1 a game hour in a fight plus 40 x the share of health lost; a force below 25 (15 in an own city) breaks and retreats, or is destroyed.
  **A fight therefore ends when one side is destroyed or its morale breaks, whichever comes first.**
* Air strikes, missiles, artillery shelling and buildings do not use `BATTLE_PACE`.

## Measured (tools/combat-pace.js, hours; "half gone / ends")

`half gone` = until one side is down to half of its health; `ends` = until no fight is left in the province (one side destroyed or broken and retreating).
Setups: both sides the same mixed stacks (4 infantry, 2 tanks, 2 anti-tank, 1 artillery, 1 IFV), in stacks of up to 10; "1:1" is an even fight (a meeting
battle in unowned land, or an attack on a force on its own soil: the holder then has +25% home soil and terrain cover), "2:1" and "3:1" the attacker has
twice / three times the units. "never" = the fight ended by a morale break before a side lost half its health.

| Case (a side) | Today (hourly) | 15-min ticks, same pace (BATTLE_PACE 1) | Proposed 0.5 | Alternative 0.35 |
|---|---|---|---|---|
| open ground (meeting battle), 1:1, 2 units | 14 / 19 | 14.75 / 22 | never / 31 | never / 36 |
| open ground (meeting battle), 1:1, 5 units | 9 / 14 | 9.25 / 14 | 19.25 / 24 | 28.5 / 29 |
| open ground (meeting battle), 1:1, 10 units | 11 / 16 | 11 / 17 | 22.75 / 26 | never / 32 |
| open ground (meeting battle), 1:1, 20 units | 13 / 18 | 13.5 / 19 | 28.75 / 30 | never / 35 |
| open ground (meeting battle), 1:1, 50 units | 23 / 26 | 24 / 27 | never / 38 | never / 43 |
| open ground (meeting battle), 1:1, 100 units | never / 31 | never / 31 | never / 41 | never / 45 |
| plains, attacker vs holder, 1:1, 10 units | 10 / 19 | 9.5 / 18.25 | 19.5 / 30.25 | 28.75 / 38.25 |
| plains, attacker vs holder, 1:1, 20 units | 11 / 21 | 10.5 / 20.25 | 21.25 / 33.25 | 31.25 / 41.25 |
| plains, attacker vs holder, 1:1, 50 units | 14 / 22 | 13.25 / 22.25 | 28 / 37.25 | 41 / 46.25 |
| plains, attacker vs holder, 1:1, 100 units | 21 / 31 | 20 / 30.25 | 42.5 / 46.25 | never / 54.25 |
| forest, 1:1, 10 units | 9 / 16 | 8.75 / 15.25 | 17.5 / 27.25 | 25.75 / 36.25 |
| forest, 1:1, 100 units | 29 / 40 | 27.5 / 38.25 | never / 53.25 | never / 59.25 |
| mountains, 1:1, 10 units | 11 / 18 | 9.75 / 17.25 | 20 / 30.25 | 29.5 / 38.25 |
| mountains, 1:1, 100 units | 28 / 38 | 28.75 / 38.25 | never / 54.25 | never / 60.25 |
| city, 1:1, 10 units | 8 / 15 | 8.25 / 15.25 | 17 / 27.25 | 24.75 / 35.25 |
| city, 1:1, 100 units | 27 / 38 | 26.75 / 38.25 | never / 52.25 | never / 58.25 |
| plains, attacker vs holder, 2:1, 10 units | 6 / 11 | 5.75 / 11.25 | 11.25 / 19.25 | 16.25 / 26.25 |
| plains, attacker vs holder, 2:1, 50 units | 7 / 13 | 6.5 / 12.25 | 13 / 22.25 | 19 / 29.25 |
| plains, attacker vs holder, 2:1, 100 units | 9 / 16 | 9.5 / 16.25 | 19.25 / 29.25 | 28 / 37.25 |
| plains, attacker vs holder, 3:1, 10 units | 4 / 7 | 3.25 / 7.25 | 6.75 / 12.25 | 9.75 / 16.25 |
| plains, attacker vs holder, 3:1, 50 units | 5 / 9 | 4.25 / 9 | 8.5 / 15.25 | 12.25 / 21.25 |
| plains, attacker vs holder, 3:1, 100 units | 6 / 12 | 6 / 11.25 | 12.5 / 21.25 | 18.25 / 28.25 |
| city, 3:1, 20 units | 5 / 10 | 4.25 / 8.25 | 8.25 / 15.25 | 12.25 / 21.25 |
| city, 3:1, 100 units | 9 / 16 | 8.25 / 15.25 | 16.75 / 28.25 | 24.25 / 37.25 |

Real games (30 days, seed 12345, AI plays all 15 nations; `measure` of every battle that ended): the median battle lasts 11 h today (mean 12.8 h with the
ticks, 12.5 h before); battles with 20 or more units on a side, which are almost always lopsided, last 5 h (median), 10-19 units 7 h.
Units lost per game day: 48.6 before the ticks, 51.8 with the ticks (same pace): the tick change itself keeps the balance.

## What the numbers say (and where they disagree with the request)

1. **Even fights are not quick today.** Even small fights (5-20 units) take 8-13 h until one side has lost half its health and 14-21 h to end; even big fights
   (100 units) 20-29 h and 31-40 h. That is already at or above the target of "several hours (4-8 h) for small and a day or more for big".
2. **The quick fights are the lopsided ones, which are what players meet.** 3:1 fights are decided in 4-6 h and over in 7-12 h; 2:1 in 6-9 h and over in 11-16 h.
   Real battles are mostly of this kind (in the 30-day AI game the big ones last a median 5-7 h). This is probably what feels "far too quick"; it also feels quick in real time: at speed 1x a game hour is 15 s, so 14 h is 3.5 minutes.
3. A single damage multiplier cannot make small fights shorter and big fights longer; it stretches every fight by the same factor. Fights that are long
   already (even ones) become very long, and because morale falls by 1 a game hour whatever the damage, a slow even fight ends by a **morale break with
   half or more of both sides still alive** (see "never" above) rather than by a result in the field.

## Proposal

* **`BATTLE_PACE = 0.5`**: half the damage per tick (about 2x longer battles; 15 minute ticks otherwise unchanged). Lopsided fights (2:1, 3:1) then last
  roughly 13-30 h to end instead of 7-16 h; even small fights about a day; even 100-unit fights two days. A bigger step (0.35) is in the last column: 3:1
  fights of 100 units take a day and a half, even ones over two days: probably too slow, and the morale clock then ends them (they would need the rule below).
* **Break rules: unchanged.** The 1 morale/hour clock is what ends a slowed even fight. If you want even fights to end more by casualties, lower the
  baseline to 0.5 a game hour when `BATTLE_PACE < 1` (one more constant in `battleStep`); I did not propose it because it is not needed for the 0.5 case.
* Reinforcements and retreats: at 0.5 a 3:1 attack on 10 units gives the holder about 6.5 h before it has lost half its health and 12 h before it is over,
  enough for a neighbouring stack to arrive (movement is 4-8 h a province) or for a Retreat order.

Expected effect on a whole game (30 AI days, same seed, measured with `BATTLE_PACE = 0.5`): average battle 12.8 h -> 22.1 h; battle-province-hours
7,700 -> 14,600 (about twice as much of the map is in a fight at any time); units lost per game day 51.8 -> 46.7 (about 10% fewer: fights end by morale
before kills).

## Side effects

* **AI**: its attack decisions use `odds()` (relative strength, unchanged) and re-run every 4 game hours, so attacks are no more or less likely, but a
  battle lasts across several AI turns: forces feed in reinforcements (the AI sends neighbours to a fight) and `stanceHour` retreats (strength under
  40%) come later. Capture clocks stop while a fight is on, so conquest slows by about the battle length.
* **Air strikes, missiles, artillery shelling, bombers, strike drones, AWACS cover**: unchanged, so against a slowed ground fight they are relatively twice as
  strong (a bomber raid is worth more of a battle); the damage tables for them can stay.
* **Buildings**: unchanged (bombs and strikes hit buildings, ground fights do not).
* **Ships**: sea battles use the same step and the same constant; frigate and submarine fights slow down by the same factor. Shore bombardment follows too.
* **Healing** is not applied during a fight; slower fights leave more wounded survivors for the 10%/day (25% in an own city) field healing afterwards.

## How to apply

1. `rules/combat.js`: `BATTLE_PACE = 1` -> `0.5`.
2. Re-record `tools/golden-12345.txt` (`bash tools/mkpage.sh; node tools/split-golden.js 10 12345`).
3. Update tests that assert how fast a fight ends (none do today).

## Balance check of the tick change itself (BATTLE_PACE 1, before = hourly battles at master 3be574b)

AI-only games, battles that ended, units lost in them per game day: seed 12345 30 days 48.6 -> 51.8 (648 -> 578 battles, mean 12.5 -> 12.8 h);
seed 1 20 days 40.1 -> 40.4 (317 -> 313, 14.1 -> 13.3 h); seed 2 20 days 43.2 -> 42.6 (357 -> 338, 13.7 -> 13.6 h). Provinces captured in the 30-day game 1,110 -> 1,119.
The rules output changes (more dice draws), so `tools/golden-12345.txt` was re-recorded.
