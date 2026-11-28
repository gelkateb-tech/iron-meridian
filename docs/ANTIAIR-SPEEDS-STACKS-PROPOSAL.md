# ANTI-AIR, SPEEDS AND STACKS: PROPOSAL (waiting for the owner's OK)

Nothing was edited, committed or pushed in any worktree. All my files are in
/tmp/claude-0/-home-user-iron-meridian/7fd07611-91e4-5b00-ba43-06c622a65904/scratchpad/antiair/:

- odds3.js: the stop chances in this proposal, plan 2's model (`node odds3.js`; `ACC=0.8 node odds3.js` tries another accuracy)
- odds.js, odds2.js: the earlier variants (the rejected ones are in the appendix)
- speeds.js / speeds.txt: the speed table (now the same as section 3)
- probe.js, probe2.js: the stack probes (`node probe2.js <copy> <seed> <days> 3`; `NAT=Norway` prints who sets off the threat test)
- sheet-antiair.jpg: one picture with all the numbers

Line numbers are master 669a177. br = build-reqs, ms = missiles, asf = fighter-asf, sa = start-armies.

What changed after the review: Missile Defence aims worse at ballistic missiles (x0.75) so cruise missiles stay
the easiest to stop, and it costs $72M instead of $96M; its shots are shared between everything it covers;
Shield I no longer needs Ballistic Missiles; the ASF needs no rare materials; crowding slows only armies going
INTO a crowded province; the computer's attack and siege rules no longer stall; the "128" cause is now proven
with the enemy list.

---

## 1. THE THREE ANTI-AIR UNITS

In short:
- **Mobile Anti-Air gun**: cheap, covers its own province only, kills helicopters and drones. No missiles.
- **Mobile SAM**: the real aircraft killer, as today but slower.
- **Missile Defence**: shoots only missiles. The best missile stopper per unit and the highest ceiling; for the
  same money it is as good as SAMs or better.

| | Mobile Anti-Air gun (maa) | Mobile SAM (sam) | Missile Defence (mdef) |
|---|---|---|---|
| Where built | Army Base II (br's marked slot) | Army Base III (as on br) | Army Base V (br's marked slot) |
| Research needed | none | none | Anti-Missile Shield I (msl3), which now needs only Cruise Missiles (msl1) |
| Cost | $26M, oil 2, materials 4, iron 4, elec 3, manpower 8 | $44M (unchanged) | $72M, oil 2, materials 6, iron 4, elec 12, rare 2, manpower 8 |
| Build time / upkeep | 30 h / 1.5 (fuel 0.5) | 48 h / 2 | 60 h / 3 |
| Attack / defence / HP | 4 / 3 / 9 | 5 / 2 / 8 | 0 / 1.5 / 8 |
| vs aircraft | x2.0 = 8; helicopters x3.0 = 12; bombers 8; strike drones x2.2 = 8.8; swarms x2.0 = 8; UAV x1.5 = 6 | x3.0 = 15; bombers x4.0 = 20; strike drones x3.2 = 16; swarms x1.4 = 7 | never fires |
| vs ground | soft x0.5, armoured x0.3 | soft x0.3, armoured x0.3 | never fires |
| Drone gauntlet | own province only; kill chance swarm 0.35, UAV 0.12, strike drone 0.2; 2 a pass, so swarms can swamp it | as today | no |
| Fires at bombers before the drop and at loitering wings | yes | yes | no |
| Paradrop loss | 8% each | 15% each (as today) | no |
| Spots stealth | no | yes (as today) | no |
| Missiles (plan 2) | none | 2 shots x 6 HP; next door at half, full with Long-Range SAM | 3 shots x 8 HP; full strength in its own province and next door; aim x0.75 against ballistic missiles and ICBMs |
| Speed (hexes a day) | 3, tracked | 2.5, tracked (now 4, wheeled) | 2, tracked |

Research:
- Mobile Anti-Air: Firepower and Protection like every unit; Radar Fire Control, attack +1 (day 3) and +1 more
  (day 8); Generation 2, Gun-Missile System (day 10): attack +2, HP +2, drone gauntlet +25%.
- Mobile SAM: unchanged, except Shoot-and-Scoot gives speed +0.5 (was +1) and defence +1.
- Missile Defence: no line of its own. The Anti-Missile Shield (x1.25 / x1.5 / x1.8) raises its aim like every
  missile shooter's.
- Anti-Missile Shield I now needs Cruise Missiles (msl1) instead of Ballistic Missiles (msl2, ms data.js:409),
  so a nation that only wants to defend does not have to research an attack weapon it will not use.

### How Missile Defence shares its shots (new rule for plan 2's salvo rule, C item 7)

Each defender has one budget of shots per hour (SAM 2, Missile Defence 3, Cruiser 3, Frigate 2, patrolling ASF 1).
That budget is shared by every missile landing that hour anywhere in its reach (own province and next door).
So 2 Missile Defence units do NOT defend 7 provinces at full strength at once: 3 missiles on 3 provinces in the
same hour split their 6 shots.

### Worked examples (exact, plan 2's model, from odds3.js)

Missile HP: cruise 12, ballistic 16, ICBM 24. Hit chance per shot 25 / 20 / 10%. Most shots a missile can take:
6 / 10 / 16. The best shots go first. Each cell: chance to stop ONE lone missile, cruise / ballistic / ICBM.

| Defence in the target | No shield | Shield I | Shield II | Shield III |
|---|---|---|---|---|
| 1 SAM | 6 / 0 / 0% | 10 / 0 / 0% | 14 / 0 / 0% | 20 / 0 / 0% |
| 1 Missile Defence | 16 / 6 / 0% | 23 / 9 / 0% | 32 / 13 / 0% | 43 / 18 / 0% |
| 2 SAM | 26 / 3 / 0% | 37 / 5 / 0% | 48 / 8 / 0% | 61 / 14 / 0% |
| 2 Missile Defence | 47 / 22 / 1% | 61 / 31 / 1% | 73 / 41 / 2% | 84 / 51 / 4% |
| 4 SAM | 47 / 20 / 1% | 61 / 32 / 1% | 73 / 45 / 2% | 84 / 60 / 4% |
| 2 Missile Defence + 2 SAM | 47 / 31 / 1% | 61 / 43 / 2% | 73 / 56 / 4% | 84 / 69 / 7% |
| 3 Missile Defence | 47 / 40 / 3% | 61 / 53 / 4% | 73 / 64 / 7% | 84 / 75 / 11% |
| 6 Missile Defence (the most that counts) | 47 / 46 / 11% | 61 / 59 / 18% | 73 / 69 / 27% | 84 / 80 / 37% |
| 8 SAM (today's best) | 47 / 32 / 7% | 61 / 47 / 13% | 73 / 62 / 21% | 84 / 76 / 32% |

Same money (Missile Defence $72M, SAM $44M):

| | No shield | Shield III |
|---|---|---|
| 2 Missile Defence ($144M) | 47 / 22 / 1% | 84 / 51 / 4% |
| 3 SAM ($132M) | 47 / 10 / 0% | 84 / 37 / 1% |
| 3 Missile Defence ($216M) | 47 / 40 / 3% | 84 / 75 / 11% |
| 5 SAM ($220M) | 47 / 32 / 1% | 84 / 76 / 9% |

Why it is the best missile stopper:
- One unit: against a ballistic missile a SAM needs 3 hits but fires only 2 shots, so alone it can never stop
  one. Missile Defence needs 2 hits and has 3 shots.
- Same money: against ballistic missiles it is twice as good in small numbers (22% against 10%), and about equal
  in big numbers at Shield III (75% against 76%); better on ICBMs; equal on cruise missiles from 2 units up (one
  alone: 16%, two SAMs for $88M: 26%). It also covers next door at full strength, where a SAM fires at half.
- Ceiling: the best defence rises from 84 / 76 / 32% (8 SAMs) to 84 / 80 / 37%.

What stays true from plan 2:
- Cruise missiles are still the easiest to stop at every shield level (47 vs 46, 61 vs 59, 73 vs 69, 84 vs 80).
- No defence is ever certain: ballistic tops out at 80%, ICBM at 37%.
- Cruise missiles cannot be stopped better than 84% by anyone: they can take only 6 shots and need 2 hits.

The stronger option (full aim, no x0.75) is in the appendix: up to 84 / 92 / 57%, but then ballistic missiles
become easier to stop than cruise missiles. If the owner wants that, plan 2's lines 9-10 and 217, the launch card
and the computer's missile choice (fire cruise missiles at targets with Missile Defence) must change too.

Where it goes in plan 2's text: a row "Missile Defence | 3 | 8 (aim x0.75 vs ballistic and ICBM)" in the shot
table; "Missile Defence" under "who can shoot" for all three missile kinds; the shot-sharing sentence above; the
Army Info missile row and mslOdds count it.

### How the computer uses them

- Mobile Anti-Air: built when an enemy near the front has helicopters, drones or swarms. At most 1 per army.
  Only in garrisons and slow infantry or artillery armies, never in tank or IFV armies (it would slow them to 3).
- Mobile SAM: as today (plan 2: 2 to 4 at the capital and silo cities when threatened). Garrisons only, not in
  attacking armies.
- Missile Defence: when it has Shield I, an enemy holds ballistic missiles in reach, AND it can pay for the
  missing Army Base levels plus 2 units within about 10 days of income: raise the capital's Army Base to V,
  build 2 Missile Defence there, then 1 per silo city. Today the computer climbs past Army Base III only by
  chance (br ai.js:687, 691), so this needs its own rule.

---

## 2. REMOVING THE INTERCEPTOR

The Air Superiority Fighter takes over from day 1:
- Jet Engines (air1) opens the Strike Fighter and the ASF. UNITS.asf.tech becomes 'air1'. The old 'asf1'
  research ("Air Superiority Fighters", br data.js:474 and 487) is dropped.
- It needs Airbase I.
- Cost: $78M (option $74M), oil 11, materials 12, elec 15, rare 0 (was rare 2), manpower 5, 72 h.
  Rare materials only come from rare-earth cities, so with rare 2 a nation without one could not build any
  fighter without the market. The rare cost (about $13M) moves into electronics.
- Attack 9, defence 5, HP 10, speed 22.

Its counters rise to the Interceptor's strength against bombers and drones:

| Target | Now | New | Damage (x9) | Old Interceptor |
|---|---|---|---|---|
| Bomber | 3.0 | 4.0 | 36 | 36 |
| Strike drone | 2.6 | 3.5 | 31.5 | 33 |
| UAV | 2.4 | 3.2 | 28.8 | 30 |
| Swarm | 1.8 | 2.4 | 21.6 | 21 |

AWACS, maritime patrol and general air stay at 3.0.

What this changes early in the war (said plainly): against Strike Fighters and helicopters, the Interceptor did
6 x 2.0 = 12. The day-1 ASF does 9 x 3.0 = 27. Early Strike Fighter raids and helicopters get much weaker
against a defended province. That is how Conflict of Nations works (the ASF is a day-1 fighter there too), and
the new Strike Fighter Patrol gives the attacker an answer. Bombers and drones are not made stronger or weaker.
Check in the job: a tools/balance run of 20 days and an air duel (2 Strike Fighters vs 1 patrolling ASF, 2
helicopters vs 1 ASF, days 1 to 10), compared with the same duel against today's Interceptor. If Strike Fighter
raids lose more than twice as many planes as today, the job stops and asks.

Research:
- The ASF line drops fam:'int' and gains asf_msl, Radar-Guided Missiles: attack +2, day 5 (air2 opens it instead
  of int_msl). Drop Tanks move to days 7 and 13, Look-Down Radar to day 10, Fifth-Generation to day 14 (was 17).
  Top strength against bombers: 56, the Interceptor's was 54.
- The Interceptor nodes go: u_int, int_fp, int_pr, int_msl, int_rng, int_g2.

Rules:
- isFighterWing (air.js:29) becomes ASF only, joined with asf's Strike Fighter Patrol in the same test.
- The Interceptor's "own province only" patrol rule goes. A patrolling ASF covers its province and the
  neighbours, as today.
- Plan 2's "fighter on patrol" uses its own test, u.asf > 0, not isFighterWing. A patrolling ASF has 1 shot x 6
  HP against cruise missiles only. A patrolling Strike Fighter shoots no missiles.
- AIR_RANGE int is removed.

Computer:
- Build weights (ai.js:222-252): the Interceptor's terms fold into w.asf. The Interceptor-to-ASF hand-over
  (ai.js:247), the manned-aircraft list and quota (ai.js:249-251), the oil-shortage cut (ai.js:252) and AI_CTR
  (ai.js:361) lose 'int'.
- Research weight u_int:3 (ai.js:436) moves to u_asf; int_msl to asf_msl.
- Airbase building (ai.js:611): for u_jet or u_asf. br's BASE_LV.air loses int:1.
- Patrol choice (ai.js:109-114): unchanged.

Old saves (intMigrate, flag S.noInt, built like br's atMigrate, br state.js:251-276):
- Interceptors become ASFs with the same share of health. Queued Interceptors become ASF orders with the time
  left scaled by 72/60, at no extra charge.
- N.mk.int, uSave, eng and the repeat buttons are converted.
- Research: anyone with air1 or u_int gets u_asf. int_fp, int_pr, int_rng and int_msl carry over to the ASF's
  matching nodes (the higher level is kept). int_g2, any Interceptor research in progress, and u_asf research
  in progress are refunded.
- Battle reports, stats and history that name 'int' keep working: a small LEGACY name list
  ({int: 'Interceptor'}) is used to print them, and report and stats code skips unit types it does not know.
- One message to each player: "Interceptors are now Air Superiority Fighters."

Texts and pictures to clean:
- index.html: 3359, 6707, 6710, 6774-6775, 7293-7298, 7367, 12042, 12509 ("SAMs, Interceptors, Frigates" becomes
  "SAMs, fighters, Frigates"), 12724, 12734, 12762, 13345. Keep 13969 (the missile-intercept effect).
- fx.js:1070, 1072; units3d.js:9, 164, 167, 242, 244, 1063.
- Tools: bake-assets, balance, research-proto, gen-art, icons, prep-art.
- Docs: RESEARCH.md, DECISIONS.md, IMPROVEMENTS.md, UNIT-LOOKS-PROMPTS.md, MISSILES-PLAN2 C.1.
- The 105 'ul-int-*' pictures stay in the repository but are left out of bake-assets and the public build.

Pictures for the two new units: a code-drawn icon and the SAM model tinted for now; paid pictures in a later
batch (none is in the current paid order).

Unit list upkeep: adding maa and mdef and removing int changes the unit order (UT). DOM_T, GROUND_T, MOVE_T and
UT_ROLL (state.js:420, br 481: type string, count, groundN, armyHP, power, hasUnits, effHP, healW) are updated
together, with a new test that UT_ROLL's type list equals UT. Otherwise the game silently falls back to the slow
loops.

---

## 3. GROUND SPEEDS

How speed works: spd is hexes a day; 1 hex = 180 km on plains. Highway: wheels x2.2, tracks x1.5, foot x1.3.

| Unit | Move | Today: spd (plains / highway km a day) | New | 900 km plains, hours | 1,500 km highway, hours |
|---|---|---|---|---|---|
| Recon (for later: start-armies has no recon unit yet) | wheel | - | 8 (1440 / 3170) | 15 | 11 |
| IFV | wheel | 7 (1260 / 2770) | 7, unchanged | 17 | 13 |
| Rocket artillery | wheel | 7 (1260 / 2770) | 5 (900 / 1980) | 17 → 24 | 13 → 18 |
| Tank | track | 6 (1080 / 1620) | 5 (900 / 1350) | 20 → 24 | 22 → 27 |
| Special forces | foot | 5 | 5, unchanged | 24 | 31 |
| Jammer | foot (made explicit in MOVE_T) | 5 | 5, unchanged | 24 | 31 |
| Infantry, Marines, Paratroopers | foot | 4 (720 / 940) | 4, unchanged | 30 | 38 |
| Mobile Anti-Air (new) | track | - | 3 (540 / 810) | 40 | 44 |
| Artillery | track | 3 (540 / 810) | 2.5 (450 / 680) | 40 → 48 | 44 → 53 |
| Mobile SAM | wheel → TRACK | 4 (720 / 1580) | 2.5 (450 / 680) | 30 → 48 | 23 → 53 |
| Missile Defence (new) | track | - | 2 (360 / 540) | 60 | 67 |

Research bumps shrink to match: Tank Turbine Engines +2 → +1; Artillery Guided Shells +1 → +0.5; SAM
Shoot-and-Scoot +1 → +0.5. Old saves pick all this up by themselves (speed is worked out from data and research).

New rule, each unit keeps its own road bonus: today the whole army takes the road bonus of its slowest unit
(moveType, movement.js:14). After Turbine Engines a tank (6, tracks) with rocket artillery (5, wheels) would take
the wheel bonus and do 1,980 km a day on highways instead of 1,350. New: work out each unit's speed on that
ground with its own movement type and take the lowest. This also keeps the tracked SAM slow in any army.

Why the SAM and Missile Defence become tracked: a wheeled SAM at 2.5 would still do 990 km a day on a highway,
faster than infantry (940). Tracked it does 680, so "much slower" holds on roads too.

The roles:
- Recon fastest; IFV the fast mover.
- Tanks a little faster than infantry off-road (1.25x), slower than IFVs everywhere.
- Artillery and rocket artillery fall behind tanks; rocket artillery is still quicker on highways.
- Anti-air ladder: gun 3, SAM 2.5, Missile Defence 2.

What this does to balance:
- Tank thrusts take about 20% longer: defenders get about 4 extra hours per 900 km.
- Any army holding a Mobile Anti-Air, artillery, a SAM or Missile Defence moves at 3, 2.5 or 2. Air cover slows
  you; a tank army gets its air cover from fighters.
- The capital starting stack {inf:2, art:1} drops from 540 to 450 km a day (it is a garrison).
- The computer keeps SAMs, Missile Defence, Mobile Anti-Air and artillery out of its fast attack armies.
- I could not check CoN's exact km/h (conflictofnations.wiki.gg is outside the allowed network). These numbers
  follow CoN's ORDER only.

---

## 4. STACKS

### Why the computer showed a "128" stack

It was not one army. It was many armies drawn as one counter, plus a real bug that piles them up.
- In 10 all-computer games (about 1,000 game days) no computer army ever held more than 10 ground units.
- The map draws every standing army of one owner in one province as ONE counter with the total
  (index.html:10254-10259), with no red badge because no single army is over the limit.
- Reproduced: Norway, Oslo, day 100 (start-armies, seed 42) = 132 units in 14 armies.

Why the computer piles armies up:
- B, the bug: the capital threat test (threatNear, ai.js:192) only says yes or no. ANY enemy army next door
  counts. Proven at Oslo on day 100: own power 3,036 against 290 next door. That 290 was one French land army
  of 4 (3 infantry, 1 artillery) passing through Trondheim, plus 3 French frigates and 4 small troop convoys
  (9 soldiers) in North Sea III. That froze all 14 armies in the capital while new units and reinforcements kept
  arriving. The same yes/no test also keeps piles in any threatened city (ai.js:738), and in staging (173, 295,
  306, 701).
- C: staging provinces have no cap.
- D: battle jams. Armies queue behind a fight.
- E: first-fit packing leaves many half-full armies (87 units in 12 armies where 9 would do).
- F: troops waiting at sea for a landing pile up too (Spain: 89 in Mediterranean Sea IV).
- No rule limits armies per province.

### A. At most 10 ground units per army (a hard cap)

The check lives inside merge() itself: it fills the receiving army to 10, and the rest stays as its own army.
So every way of joining is covered, including a join ordered before production filled the army and joins already
set in old saves (joinHour, combat.js:376). addArmy stays uncapped so tools/stack-duel.js and .test/stacks.js can
still build a 128-unit army.

| Case | Today | New |
|---|---|---|
| Merge button (index.html:12889) | merges everything into 1 | packs into as few armies of 10 or less as possible: "Merged into 3 armies: 10, 10, 7" |
| Drag-join (combat.js:373) | merges, with a warning | refused: "Army full (10/10)". Option: fill to 10, the rest stays as its own army |
| Arrival join (tick.js:77-87) | only within the limit | unchanged |
| New unit (production.js:109-117) | joins if there is room, else a new army | unchanged |
| Loading onto ships, landings, start armies | not checked | checked; the extra units become their own army |
| Old saves | - | every land army over 10 is split into equal armies in the same place (flag S.noBig, one message) |

The old-save split copies every order and state field: path, dest, join, tgt, fire (bombard), froms and dig
(battle and dug-in state), delay, forced, the name (with "(2)", "(3)"), and pinpoint-3's waypoints (a.wp) and
pins (a.pos). The message says: "Armies over 10 units were split into equal armies with the same orders. Split
armies fight at full strength, so battles already under way may turn out differently." (A 128-unit army fought
at a penalty; 13 armies of 10 do not.)

Air (5) and sea (5) keep today's soft per-army penalty. The land per-army penalty can then never fire.

### B. Crowding: a soft limit per province for people, a hard rule for the computer

- Crowding counts own land units standing, fighting or waiting in one province (units, not armies, so splitting
  into tiny armies does not dodge it).
- Comfort limit: 50 units, which is 5 full armies ("about 4 to 5").
- No hard block for people: it would break capital defence, landings and production in a full city.
- Over 50: an army going INTO the province (to stop there or passing through) moves slower on that leg: -1.5%
  per unit over 50, at most -60%. Leaving a crowded province is never slowed, so spreading out is always quick.
- Never slowed: rail moves and forced retreats.
- Worked out once when the leg starts, and kept out of pathFor and etaHours, so the path caches and the
  computer's timing stay steady.

| Own land units already in the province | Today (13 armies of 10) | New, going in |
|---|---|---|
| 50 | 0 | 0 |
| 60 | 0 | -15% |
| 70 | 0 | -30% |
| 80 | 0 | -45% |
| 90 or more (Oslo's 132) | 0 | -60% (the leg takes 2.5x as long) |

For comparison, today one real 128-unit army moves at -38%.

Display: the province counter shows the total plus "x 14 armies"; a yellow crowding badge over 50 and a red one
at 80 or more. The army panel says "Crowded: 74/50 units, -36% speed going in".

Combat is unchanged: frontage already makes units beyond about 14 to 16 fight at 25%, so piles gain almost
nothing in battle.

### C. The computer splits into several armies and spreads them

1. Fix the threat test. The threat is enemy LAND power in and next to the province. Ships count only for the
   troops they carry (x0.7). Used everywhere threatNear is used today: the capital, threatened cities
   (ai.js:738) and staging.
2. The capital keeps power up to max(its garrison, 1.5 x threat + 10). It keeps at most max(5, the number of
   enemy land armies in and next to it) armies, so a capital under a real siege can still gather enough. The rest
   is free for attacks, spreading out and front defence.
3. At most 5 own armies standing in or heading to one province, counting sea provinces with troops on board.
   The stacksAt map (ai.js:737) counts this. Used for front defence (ai.js:293), staging (ai.js:306) and attack
   routes (ai.js:709-733).
4. When an attack needs more than 5 armies, the extra ones gather in other own provinces next to the TARGET.
   Those provinces are added to plan.stage, so the launch test (ai.js:302) counts them, and they attack from
   another side (+15% flank bonus per extra direction, and a wider front).
5. Spreading out starts when a province holds more than 5 armies: it searches 4 steps instead of 2 and accepts
   provinces holding fewer than 3.
6. Best-fit packing (fullest first): 87 units become 9 armies, not 12.
7. Armies waiting behind a battle count toward the 5; the rest hold one step back. Landing waves: at most 5
   armies in one sea province, the rest wait in port or the next sea.

Done when: the probe (probe2.js, the same 6 seeds, 90 to 120 days) shows no computer province, land or sea, over
60 own units for more than 48 hours, except during a real battle there or a capital under a real land siege.

### Stack-duel

- tools/stack-duel.js still proves splitting never loses (13 x 10 beats 1 x 128 in the same place).
- Two new cases: "5 armies vs 13 armies in one province" (same combat result, because of frontage), and "march
  into a crowded province" (into 132 units: 2.5x as long; into 50: no extra time; marching out: no extra time).

---

## 5. OLD SAVES, GOLDEN, TESTS, ORDER OF WORK

Old saves: Interceptors become ASFs (S.noInt); land armies over 10 are split (S.noBig); speeds and research bumps
update by themselves; Missile Defence and Mobile Anti-Air need nothing.

The golden fingerprint (tools/golden-12345.txt) is made again in each job.

Tests to change: .test/v3air.js:14; .test/stealth.js (multU('int','bomb') === 6.0 becomes the ASF's 4.0 x 9);
.test/v4research.js (clicks u_int, now u_asf); .test/v4research-oldsave.js; .test/stacks.js; about 25 picture
and art tests that list 'int'.

New tests: intMigrate on an old save; an old save with an Interceptor battle report; the old-save split (all order
fields kept); the Merge button, drag-join and joinHour never going past 10; crowding at 50 / 70 / 100 units, going
in and going out; rail and retreat not slowed; maa and mdef only at Army Base II and V; Missile Defence never deals
battle or air damage; the stop odds above (mslOdds), including shot sharing; the speed table, including the
tank + rocket artillery army on a highway; UT_ROLL equals UT; the air duel; the computer pile probe.

Order of work: three jobs, after the owner's merge chain (pinpoint-3, build-reqs, start-armies, fighter-asf,
combat-display, missiles, cities-redo, then one-figure):
1. STACKS + SPEEDS: ai.js, movement.js, tick.js (after pinpoint-3's change near tick.js:84), combat.js, the
   index.html counter. Build it before LOGISTICS, which also touches movement, or agree the shared lines first.
2. INTERCEPTOR REMOVAL + MOBILE ANTI-AIR: needs build-reqs' marked slot and fighter-asf's Strike Fighter Patrol
   merged. If it lands before Missiles Plan 2, plan 2 says "ASF" only.
3. MISSILE DEFENCE: on top of the MISSILES PLAN 2 job (the shots x HP model). The NEW SHIPS job adds its ships to
   the same shot table.

---

## 6. QUESTIONS FOR THE OWNER (my default in brackets)

1. Missile Defence: 3 shots x 8 HP, full strength next door, aim x0.75 against ballistic missiles and ICBMs, $72M?
   Best defence 84 / 80 / 37%, cruise stays the easiest to stop. [yes; option: full aim, up to 84 / 92 / 57%, but
   then ballistic missiles become easier to stop than cruise missiles]
2. Missile Defence opened by Anti-Missile Shield I, and Shield I needs only Cruise Missiles (not Ballistic
   Missiles)? [yes]
3. Mobile Anti-Air shoots no missiles, not even cruise? [no missiles]
4. ASF from day 1 at Airbase I with the Interceptor's counters, $78M, no rare materials? Early Strike Fighter and
   helicopter raids get weaker (12 → 27 damage against them). [yes; $74M is the option]
5. SAM and Missile Defence tracked, so roads don't undo "much slower"? [yes]
6. Tank 6 → 5, artillery 3 → 2.5, rocket artillery 7 → 5, SAM 4 → 2.5, Mobile Anti-Air 3, Missile Defence 2;
   IFV, infantry and special forces unchanged? [yes; option: Mobile Anti-Air 4, so it can go with infantry]
7. Pictures for Mobile Anti-Air and Missile Defence: code-drawn icon and tinted SAM model now, paid later? [yes]
8. Crowding: 50 own land units per province, then -1.5% per unit (at most -60%) for armies going INTO it, never
   for leaving, rail or retreats; a hard 5-army rule for the computer? [yes; option: also slow armies leaving]
9. Drag-join past 10 units: refuse? [refuse; option: fill to 10, the rest stays as its own army]
10. Province counter: total units plus "x N armies" and a crowding badge? [yes; option: one counter per army up to
    5, then "+N"]

Air (5) and sea (5) per-army limits stay as today unless the owner says otherwise.

---

## APPENDIX: review points taken differently or not taken

All the reviewer's points were checked and are fixed above. These were handled in a different way than suggested:

- Missile Defence aim against ballistic missiles: the reviewer offered x0.8. I took x0.75. At x0.8, 4 or more
  units with no shield still stop ballistic missiles slightly more often than cruise missiles (47 / 49%, Shield I
  61 / 62%). x0.75 keeps cruise the easiest at every level (odds3.js).
- The full-aim version (my first draft, 84 / 92 / 57% at best) is kept only as the option in question 1, because
  it breaks plan 2's "cruise easiest" and makes ballistic defence nearly certain (92%).
- The 12-HP version (mdC: 97% of cruise, up to 81% of ICBMs) and the x1.2-aim version (mdE: up to 92 / 97 / 70%)
  are rejected: too sure.
- Missile Defence price: not raised in the review, but I lowered it from $96M to $72M. With the weaker x0.75 aim,
  at $96M two units ($192M) would lose to four SAMs ($176M) on ballistic missiles at Shield III (51% against
  60%). At $72M, 2 Missile Defence ($144M) beat 3 SAMs ($132M) on ballistic missiles at every shield level.
- Missile Defence and Ballistic Missiles research: the reviewer allowed "say the link is intended". I changed
  Shield I to need Cruise Missiles instead.
- ASF and rare materials: the reviewer allowed "keep rare 2 and check the computer buys rare". I set rare 0
  (cost moved to electronics), which is simpler and also helps people.
- Interceptor in old reports: the reviewer allowed a hidden UNITS.int stub. Not taken: it would put 'int' back
  into the unit order and UT_ROLL. A small name list for old reports does the job.
- Crowding: taken as suggested (only going in, not rail, not retreats). Slowing armies that LEAVE a pile is the
  option in question 8, because it slows the computer and people exactly when they try to spread out.
- Mobile Anti-Air speed: the sentence "a tank army takes a Mobile Anti-Air" is dropped. I kept 3 because the owner
  said "much slower"; speed 4 is the option in question 6.
- "Passing ships": now proven and worded exactly: the Oslo threat was 1 small French land army passing through
  Trondheim plus frigates and troop convoys at sea.
