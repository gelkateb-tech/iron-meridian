# Playtest round log

The autonomous playtest session of 2026-11-21 (an extra job; it cancels nothing in docs/QUEUE.md). At most 3 rounds, 1 prototype per
round; the session stops early when a round finds nothing new. Bug fixes go on branch `auto-test/fixes` only (never merged by the session);
the owner reviews it at the end. Tools are the existing ones, extended (tools/headless.js, balance.js, eco-check.js, stack-duel.js,
nations-balance.js, rebels-sim.js, perf.js); observation never consumes the rules' random numbers.

Baseline: master 2dc5573, tagged `pre-auto-test` (local tag; branch `origin/pre-auto-test` at the same commit).

Format of a round (copy the block):

```
## Round <r>   (<date>; commit on auto-test/fixes: <sha>)

**Runs.** tool, options, world, seeds, days, wall time.
**Checks.** split-lint, split-golden 10 12345, headless --check, nations-balance --quick, eco-check, stack-duel, build: pass / fail (extensions off and on).
**Found.**
- B<r>.<n> <bug, one line> | evidence | fixed on auto-test/fixes in <sha> / logged for another job / not fixed (why)
**Stats.** units built / never built, dominant units, war length, economy growth per nation, idle resources, idle player time.
**Ideas.** IMP-<n> (docs/IMPROVEMENTS.md)
**Prototype.** branch, or none.
**New this round?** yes / no (no: the session stops)
```

---

<!-- Rounds go below, oldest first. -->

## Setup   (2026-11-21; on auto-test/fixes, base master 2dc5573 = tag `pre-auto-test`)

**What was extended (no new harness, no new tool file; nothing under rules/ or index.html changed).**
- `tools/headless.js`: `--games/--seeds --days --jobs`, `--invariants` (hourly and daily state checks, a save/load round trip each day),
  `--stats`, `--provoke K` (the harness's own dice), `--json`, `--check` with these on, `--selftest`, `--scenarios`. Without the new flags
  the tool prints exactly what it printed before (compared old against new: default, `--check --days 10`, `--nations --days 5`).
- Added in the sanity step (this entry): checks for a force that jumps more than three legs in an hour (`teleported`), a force in the land
  of a nation it is not at war with and not allowed in (`force-in-closed-land`), boarding and rearm timers that stop counting down
  (`bad-timer` emb-stuck / cd-stuck), the 15-minute floor of boarding and landing (`bad-timer` floor), the game clock (`clock`); a ship on
  land now also checked against the harness's own rule (open sea, or a coastal city), not only the rules' `shipPlaceOk`; the daily save/load
  check now also compares the game as loaded with the game as it was (a field the save leaves out and a load fills with a default saves
  the same twice, so save-load-save alone missed it). A watcher error no longer leaves half-updated records (it made false "not
  progressing" reports). `--selftest` now also runs **rule mutants**: the rules broken one at a time, in memory (exported as `MUTANTS`).
- `tools/stack-duel.js`, `tools/eco-check.js`, `tools/rebels-sim.js`: `--scenarios` (combat and ranged fire; economy and trade; occupation).
  Default outputs unchanged (stack-duel default and `--json`, eco-check compared old against new). `tools/perf.js --watch`.

**Sanity check: the rules broken on purpose.** Each break was a temporary edit of the rules file on disk, run through the real tools
(`headless.js --seeds 12345 --days 5 --invariants`, or `headless.js --scenarios`), then put back; `git diff rules/` empty after every one.
The same breaks are in `--selftest` (in memory, with a set-up case and a run of the real rules beside it), so later rounds re-run them.

| Break | File | Real-file run (new violations against the unbroken run) | `--selftest` |
|---|---|---|---|
| (a) a finished ship spawns inland next to its port | production.js `spawn` | caught: ship-on-land 8 | caught |
| (b) payC takes 10x the price it checked (stocks go negative) | data.js `payC` | caught: bad-resource 219 | caught |
| (c) the boarding timer (embark "cooldown", 45 min) never counts down | movement.js `embStep` | caught: bad-timer emb-stuck 72, stuck-force 27 | caught |
| (c) a wing's rearm timer (air cooldown) never counts down | air.js | **not seen in plain games**: no AI wing flew in the first 20 days of seed 12345 (with or without `--provoke 3`), so nothing to break; caught with a wing set up | caught |
| (c) research never counts down | research.js | caught: research-not-progressing 136 | caught |
| (d) recruit() says yes and does nothing | production.js | caught: `--scenarios` exit 1, 3 FAIL + 3 "DOES NOTHING" | caught |
| (d) startResearch() says yes and does nothing | research.js | caught: `--scenarios` exit 1, 5 FAIL + "DOES NOTHING" | caught |
| (e) a force ends a leg in a far province | movement.js `legArrive` | caught: teleported 909, teleported-to-sea 108, force-in-closed-land 536, landed-off-port 4, ship-on-land 1 (`teleported` is new: before it, a jump between two land provinces went unseen) | caught |
| (f) the save leaves out force morale (a load puts 80) | state.js `saveJSON` | caught: save-load (live) 1 (**missed before** this step: save, load, save was identical) | caught |
| (f) a load resets every province's unrest | state.js `restore` | caught: save-load 1 | caught |

Plus 41 state faults in `--selftest` (ship on land, NaN/negative/Infinity stocks, stuck or endless timers, bad references, relation
table, trade routes, air range, jumps, closed land, clock...). `node tools/headless.js --selftest`: **SELFTEST OK, 51 of 51 flagged (53 s)**.

**Checks (rules/ identical to origin/master).** split-lint OK; mkpage + split-golden 10 12345: GOLDEN same, no errors; headless --check
DETERMINISTIC (plain) and with every extension on (`--games 5 --days 60 --invariants --stats --provoke 3 --check`: watched and unwatched
seed 12345 both b174632e9f1eed75); nations-balance --quick ALL PASS; stack-duel OK (11); build OK (public build verified; dist/ removed
after, disk); eco-check: 1 FAIL "an Arms Industry must not raise the Army Base price: 18", the same with the tool as on master (earlier
failure, not from this session).

**Baseline (round 1's starting point).** `node tools/headless.js --games 5 --days 60 --invariants --stats --provoke 3 --jobs 2 --check`
(seeds 12345, 13354, 14363, 15372, 16381; 7 min 25 s wall on the shared machine; rules 775 ms CPU per game day, observers 241).
Report: scratchpad `autotest/reports/setup5x60.json` (not committed).
- Violations, 383 distinct of 7 kinds:
  - force-in-closed-land 242 (all 5 games): forces left standing in a province another nation took while they were in it, at peace
    with them (e.g. Syrian forces in Amman after Israel took it, 9 h; Bolivia in Alto Paraguay, Brazil's, 17 h). `evict` runs only when a
    relation changes. New in this step.
  - convoy-state 61: fleets keep raid orders on trade routes that are gone (up to ~23 days; `trEnded` clears escorts, not raids), and
    2 blockade orders on forces that are no longer fleets.
  - stuck-force 59: forces in enemy or independent land they have not taken (canProceed keeps them, 2-6 days); several nations' forces
    piled in one province with nobody taking it.
  - save-load 5: `restore()` drops the battle records `S.bt` (peak, losses, health history) that the save carries.
  - save-load-adds-empty 10 (harmless): a load adds empty `mstock` and `inflight`.
  - war-with-fallen-nation 5: the war stays on after one side falls (Turkey v Greece).
  - ship-on-land 1: `evict` sends a docked fleet to the nearest own province without a port check (Chile, San Martín, 96 h).
- No teleported, clock, timer-floor or stuck boarding/rearm violation in 300 game-days.
- Display bug seen while building the stats: `IM.emit` (rules/core.js) passes 4 arguments, `fxRanged` sends 6, so the page never gets the
  target point or the kill details (shells aim at the province centre, no "kill" effect).
- Orders that do nothing or refuse with no reason (`--scenarios`, 37 of 41 pass, 4 warn): orderMove from a coast with no naval city
  (only `embarkWhy` has the reason), a fleet ordered inland, a force into a nation at peace; declareWar twice and during a truce.

**Stats.** Built: infantry 18,551, frigates 2,988, anti-tank 2,236, tanks 2,144, artillery 2,124, interceptors 658, strike fighters 376;
never built: rocket artillery, carriers, helicopters, paratroopers, maritime patrol, stealth bombers; no missile fired. Infantry is
75.6% of all units; tanks have the best kill/loss (3.18; infantry 1.17, frigates 0.65). Artillery: 17,105 volleys for 239 damage shown
(hits under 0.5 not shown, but ranged fire looks weak). Wars: 77 (all provoked), 44 ended in truce after a median 21 days (5-46), 33
still running at day 60. Economy: median gross income x0.98 day 1 to 60 (Finland x1.63 best, South Korea x0.04 after losing 8 of 10
provinces); median treasury $151M at the end. Piling up: manpower at the storage cap on 53.6% of nation-days; money used at 0.99 of
income (money is the limit); electronics and rare materials used at 1.5x and 1.4x net income (bought). Idle: at least one research slot
empty a median 24% of hours (median 13 days with a free slot and an affordable step); nothing under construction 64% of hours;
fully idle with more than $300M ~0%.

**How to run.** `node tools/headless.js --selftest` · `node tools/headless.js --scenarios` · `node tools/headless.js --games 5 --days 60
--invariants --stats --provoke 3 --jobs 2 --check --json <file>` (also `--seeds a,b`, `--classic`, `--rt D`) · `node tools/perf.js --watch
--days 60`.

## Round 1   (2026-11-21; fixes on auto-test/fixes af33b44..866ac81, docs in the commit after)

**Runs.** (scratch reports under scratchpad `autotest/round1/`, not committed)
- Military hunter: `headless.js --seeds 1007,2016,3025,4034 --days 90 --invariants --stats --provoke 3 --jobs 2` (13 min 42 s wall; rules
  865 ms CPU per game day, observer 262) → `mil/long.json`; scripted rule tests `mil/s/t1-t12.js`; replays `mil/s/rp.js`; a test-only
  military order fuzz `mil/s/fuzz.js` (13 European seats at war with every unit type, random orders every 2 h, about 10,000 orders over
  10-12 days per seed; reuses headless.js's `makeWatch`; nothing in tools/ changed).
- Economy hunter: `headless.js --seeds 1500,1501,1502,1503 --days 90 --invariants --stats --provoke 3 --jobs 2` → `eco/long4x90.json`;
  probes `eco/probes/` (partisans, order book, a person's sell offers, idle at sea, occupation flip, self-trade, API edges, old saves:
  a public-v3.12 save and the .test fixtures loaded and played 10 days); eco-check --scenarios 8/8, rebels-sim --scenarios 4/4.
- Player hunter: Playwright on `.test/page.html` (Germany, Cuba, Brazil; desktop 1440x900 and phone 440x900 at 2x, CPU 4x throttle),
  `.test/playtest.js`; driver `player/drv/`, screenshots `player/*.png`.
- Advisor: read-only probes `adv/` (sealeg, portal, portal2, air).
- Fixer, after each fix: split-lint, mkpage + split-golden 10 12345, headless --check, --selftest (51/51), --scenarios (37/41, the 4 known
  warnings), nations-balance --quick, stack-duel, eco-check, old saves (classic s1500/s2016, world64 s1007, public v3.12) play 5 days.
  Final: `headless.js --games 3 --days 60 --invariants --stats --provoke 3 --jobs 2 --check` (seeds 12345, 13354, 14363; 512 s wall; rules
  796 ms CPU per game day) → `fix/final3x60.json`.

**Checks (head 866ac81).** split-lint OK; split-golden 10 12345: GOLDEN same, except the intended change from MIL-R1-02 (golden updated in
3df6ae0); headless --check DETERMINISTIC (da67e3fdd8c93e2e with and without observers); --selftest OK 51/51; --scenarios 37/41 with the 4
known warnings, 0 failed; nations-balance --quick ALL PASS; stack-duel OK (11); eco-check: only the known FAIL "an Arms Industry must not
raise the Army Base price: 18"; rebels-sim --scenarios 5/5 (a 5th case, the 24-hour hold, added with ECO-R1-1); `.test/playtest.js` 19/19
PASS (was 17/19). Build not run this round.

**Found, confirmed and fixed** (one commit each on auto-test/fixes; verified by repro before and after):
- B1.1 Carrier-based air wings never rearm or repair, and a flight from a carrier never moves (MIL-R1-01) | air.js airTick: the carrier
  branch `continue`d past the idle-wing timer and all flight code; fuzz bad-timer "wing rearm timer stuck at 2 h" on 3 seeds | fixed in
  **2c48619** (also MIL-R1-09: the lost-base move uses atMove; the watcher now measures a carrier wing's mission from where it took off).
  t6: cd 2→0 by h6; a strike from the carrier hits, returns and rearms; fuzz bad-timer 4-5 → 0.
- B1.2 Forces of a sated AI nation deadlock on enemy land they may not take (MIL-R1-04) | tick.js capture refuses (DIP-6 sated) while
  movement.js canProceed holds them; 46 of 70 stuck-force reports in the 4x90 run | fixed in **5b22d3b** (AI only: such forces head home on
  a forced route; DIP-6 unchanged). Seed 1007 70 days: stuck-force 12 → 3 distinct; "land it has not taken" 9 → 0.
- B1.3 New ships finished in a port join the ground garrison (about 70% of AI ships inside land forces) (MIL-R1-02) | production.js spawn
  join test lacked a same-kind check; ai.js idle-stack packing mixed them too | fixed in **3df6ae0**. t8: {inf:3} | {frig:1, sub:1}; with
  provoked wars ships in mixed forces 121.7 → 0 per sample, about 21 fleets at sea. Golden changes from day 9 (updated in the same commit).
- B1.4 Partisans take a province 1 hour after rising instead of after 24 hours (ECO-R1-1) | economy.js: `hold` never set, `++undefined` is
  NaN | fixed in **0c9b468** (old saves count from 0 too; new rebels-sim scenario). Median rising → flip 1 h → 24 h; revolts in 60 days
  342 → 325. Old partisan rule only (REB-2: the rebels branch untouched).
- B1.5 Waypoints let ships march inland (MIL-R1-03) | tick.js stopNext ran after the route checks | fixed in **c88e624**. t7: no frigate in
  Fairbanks; fuzz Turkey/Kocaeli ship-on-land gone.
- B1.6 Missiles and strikes not re-checked on arrival: damage at peace, a missile wrecks its own side's new city (MIL-R1-05) | air.js
  missileImpact/resolveStrike | fixed in **6195531** (land damage only where hostile or enemies stand; at war unchanged). Abort-or-hit is Q8.
- B1.7 An AI ground force stays idle at sea for good when its nation has no reachable coast (ECO-R1-4) | ai.js home search finds nothing |
  fixed in **bc19049** (disbands after 72 h with no route; `a.seaIdle`). Syria force 369 disbanded at h1701. Choice is Q12.
- B1.8 A province freed by partisans for its home nation keeps the occupation clock (ECO-R1-5) | economy.js rebelHour left S.occ | fixed in
  **48ab87d**. occFactor 0.553 → 1.000, $4.5M → $8.2M a day.
- B1.9 The Repeat production switch is invisible in the city panel and phone Mobilize sheet (P1-02) | index.html:10845 had no `<i>` | fixed
  in **063e9e7** (page only; Playwright desk and phone).
- B1.10 Paratroopers lost to air defence on landing keep all their wounds (MIL-R1-06) | air.js dropTick | fixed in **ae151dd** (wounds
  25 → 9 of 10 allowed).
- B1.11 Fleets docking in their own port get the landing stamp and −5 morale (MIL-R1-07, ships part) | movement.js legArrive | fixed in
  **0a325a6** (only ground forces). Own-port landings and merges dropping the stamp are a question (Q9), not changed.
- B1.12 tradeOpen(n, n): a trade route with oneself makes money and goods (ECO-R1-6) | trade.js | fixed in **6c567cd** (refused; an old
  save's self route is dropped).
- B1.13 IM.api robustness: a cash-only gift throws half-applied; postOffer of an unknown good writes NaN; build with an unknown key throws
  (ECO-R1-7) | diplomacy.js, economy.js, production.js | fixed in **e1a9b6f**.
- B1.14 The Continue panel shows the default win goal ("5 capitals or 763 provinces" for an 11/185 save) (P1-01) | index.html briefTips
  before restore | fixed in **94b2afc** (the Continue panel leaves the line out; the new-game briefing keeps it).
- B1.15 Harness false positive: landed-off-port flagged old-save landings (`a.oldLand`, EMB-6) (ECO-R1-8) | tools/headless.js | fixed in
  **ea93236** (v3.12 save 49 → 0; selftest still catches the fault).
- B1.16 `.test/playtest.js` failed 2 of 19 checks on unchanged master (stale A-Z picker check; recruits with no Army Base) (P1-07) | fixed in
  **866ac81** (19/19 PASS).

**Found, not fixed this round.**
- B1.17 **New**: splitting a mixed force on a landing route copies the troops' inland path to the ships part; a frigate-only fleet then sails
  Ioannina → Berat (inland) | fuzz seed 1007 day 11.4, Greece force 2289, path [Ioannina, Berat, Dibër] at h268; movement.js splitPlan
  (`b.path = a.path.slice()`), and tick.js has no port check for a ships-only fleet whose next leg is land | found after the fix step:
  round 2.
- Known baseline items, still open (re-seen on new seeds, not re-reported as new): force-in-closed-land (the hunter's analysis MIL-R1-K2:
  about three quarters are forces already walking home under sendHome; the gap is that capture() by a third nation does not send home the
  forces of nations at peace with it, strandedHour does so every 6 h), convoy-state (raids on ended routes, blockade orders on non-fleets),
  war-with-fallen-nation, save-load (restore drops S.bt), save-load-adds-empty, IM.emit 4 of 6 arguments, the eco-check Arms Industry FAIL,
  the 4 silent orders. Not taken up in round 1 (the verifier confirmed only new items): round 2.

**Rejected (not bugs), and where they went.**
- MIL-R1-08 Bombard out of range returns false with no reason: documented behaviour, not in IM.api, the page checks bombardInfo first →
  IMP-13 (f).
- MIL-R1-09 wing moved with `a.at = nb`: no observed failure; folded into B1.1 (2c48619).
- MIL-R1-K1, ECO-R1-K1: known baseline items re-seen.
- MIL-R1-K2: analysis of the known force-in-closed-land item (fix plan noted above).
- ECO-R1-2 the order book barely trades: nothing broken, a balance/design problem touching ECO-9 → IMP-2.
- P1-08 a trade route reads "Open" for hours after a declaration: by design (cut at the next pass, ended at 0:00) → IMP-13 (e).

**Hands-off.** P1-05 (older-phone pan/clock frame rate, mostly canvas painting) → map-drawing job, row 1 of "Bugs for other jobs" below.
Nothing in the map, cities, weather, research-screen or art code was edited.

**Harness notes for round 2 (tools only).**
- MIL-R1-T1: stuck-force counts battle hours, so 22 of 70 reports were "no reason found" the hour a long battle ended (all seen once);
  reset the stuck clock while the province is in a battle or the force is landing, and flag force-in-closed-land only for idle forces after
  more than 6 h (the strandedHour period).
- MIL-R1-T2: add the military order fuzz as `headless.js --fuzz N` (own dice): it found B1.1, B1.5 and B1.17, which plain AI games never reach.
- The DOMINANCE table credits battle fire only; credit dogfight kills and losses to air defence (interceptors show "0 kills" though the
  advisor's probe sees real dogfight kills).
- Add a "sea trips" stat (count, median hours, landing morale) so IMP-1 shows in `--stats`.

**Stats (final 3x60 on head 866ac81 against the setup baseline).**
Violations on the same 3 seeds (distinct / sightings, baseline → after the fixes):

| Kind | Baseline | After |
|---|---|---|
| Total distinct | 233 | 250 |
| force-in-closed-land | 141 / 940 | 153 / 1,007 |
| stuck-force | 42 / 1,794 | **23 / 23** |
| ...of which "land it has not taken" | 26 | **1** (Tanzania in Gauteng) |
| convoy-state | 39 / 1,818 | 51 / 2,288 |
| war-with-fallen-nation | 2 / 8 | 12 / 224 |
| save-load (S.bt) | 3 / 180 | 3 / 179 |
| save-load-adds-empty | 6 / 360 | 6 / 360 |
| troops-idle-at-sea | 0 | 2 / 10 (two 1-unit Ethiopian forces, disbanded by B1.7 at about 76 h) |
| ship-on-land, bad-timer, landed-off-port, teleported, air-out-of-range | 0 | 0 |

The rises are all in known, unfixed kinds: the games play differently now that AI fleets and sated forces act, and more nations fell.
- Units (3x60): infantry 75.5% of units (baseline 75.6%); tanks kill/loss 3.46 (3.18), infantry 1.24, artillery 1.72, frigates 0.46 (0.65).
  Never built: mlrs, carr, heli, para, bomb, stealth; no missile fired. Interceptors 394 built, 0 kills credited (harness gap above).
- Wars: 46 (19 truces after a median 11 days, 27 running); baseline 77 wars in 5 games, truces after a median 21 days.
- Economy: median gross money x0.99 day 1 → 60 (x0.98); manpower at the cap 53.9% of nation-days (53.6%); money used 0.99 of income.
  4x90 runs: 2.2% of nation-days broke while holding more than $2B of goods (IMP-2).
- Idle: at least one research slot empty a median 24% of hours (24%); nothing under construction 65% (64%); all four idle at once median 0%.
- Player time: a sea invasion Berlin → Wicklow is 11.4 game days, about 9 minutes at 8x (IMP-1); island nations have nothing to take for
  about a week (IMP-4). Older phone: pan 12 fps, 8x 13 fps (hands-off, map job).

**Ideas.** IMP-1 to IMP-13 in docs/IMPROVEMENTS.md, ranked: IMP-1 sea legs (medium, prototyped), IMP-2 dead order book (small-medium),
IMP-3 fleets in port (medium; its first option was bug B1.3), IMP-4 island openings (small), IMP-5 war warning for empty border cities
(small), IMP-6 side-panel caching (small), IMP-7 idle interceptors (small-medium), IMP-8 AI unit mix and missiles (small), IMP-9 idle
research slots (small), IMP-10 AI churn on independent land (small), IMP-11 ranged fire feedback (small UI), IMP-12 manpower always full
(owner decision), IMP-13 text polish (small). Questions Q2-Q14 in docs/QUESTIONS.md.

**Prototype.** `idea/sea-legs` @ **a0e4982** (IMP-1 option 1; one commit on master d573575, never merged). Sea legs end at a gate on the
zone's border. Port-to-port ETA median 99 → 71 h; UK Irish Sea trips about 5x faster; Berlin → Wicklow 281 → 226 h, landing morale 33.5 →
46.4; drawn routes over land 4.8% → 1.8%; no ship-on-land or teleport; golden changed on purpose (branch only); old saves load and play.
To watch: stuck-force 30 → 48 on 3x60 (war and AI dynamics; re-check). Screenshots scratchpad `autotest/round1/proto/`.

**New this round?** yes (20 new bug reports plus 1 hands-off: 16 confirmed and fixed, 4 rejected or folded; 1 more new bug found after the
fix step; 13 ideas). Q1 follow-up: the first-day landing penalty is now checked by script (t5: an assault is stamped and penalised for
24 h; t1: ships no longer are).

## Bugs for other jobs

Bugs found in parts this session must not touch (owner's changes 2026-11-21, item 6): map drawing (terrain, texture, jungle, sea, borders,
fog, tint), cities and 3D cities, weather, the research screen (UI), unit pictures, atlases and art. Each one is for the job named; the
session changes nothing there.

| # | Area / job | Bug | How to see it (file:line, steps, seed) | Found in round |
|---|---|---|---|---|
| 1 | Map drawing (map job) | Older phone: panning at about 12 fps and the 8x clock at 13 fps (50 fps unthrottled); 67.5% of a pan profile is native canvas raster and compositing at pixel ratio 2, frame/rdDraw/draw 23-31%. Supports the owner's open "phone map drawn at pixel ratio 1.5" item. (The side-panel part is IMP-6, not the map job's.) | index.html:11774/11765/8277 (frame, rdDraw, draw). Playwright 440x900, deviceScaleFactor 2, touch, CDP `Emulation.setCPUThrottlingRate` 4, Brazil, 4 touch drags; driver scratchpad `autotest/round1/player/drv/server.js --phone` (P1-05) | 1 |
