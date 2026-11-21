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

## Round 2   (2026-11-21; fixes on auto-test/fixes a9e2226..927796a, docs in the commit after)

**Runs.** (scratch reports under scratchpad `autotest/round2/`, not committed)
- Military hunter: `headless.js --seeds 2007,3016,4025,5034 --days 90 --invariants --stats --provoke 3 --jobs 2`; the test-only order fuzz
  (`mil/s/fuzz.js`, as in round 1); probes `mil/s/m1-m21.js`, `scan.js` (AI games: fleet legs, ports held by ships, fleets in enemy ports),
  replays `rp.js`.
- Economy hunter: `headless.js --seeds 2500,2501,2502,2503 --days 100 --invariants --stats --provoke 3 --jobs 2` (983.6 s wall; rules 895 ms
  CPU per game day, observer 269) → `eco/long4x100.json`; probes `eco/p/` (order book, spies, annexation, missiles, API edges, surprise
  war, a trading seat over 40 days, a money/goods ledger over 30 days); old saves: a public-v3.11 save made with Playwright from tag
  `public-v3.11` (seed 2500, day 20), a v1 save, the round-1 v3.12 save, save-v38 and a pre-auto-test world64 mid-war save, each loaded and
  played 10-15 days.
- Player hunter: Playwright on `.test/page.html`: USA on desktop 1440x900; Israel and Vietnam on a phone 440x900 at 2x with touch and CPU 4x
  throttle; CDP profiles; driver `player/drv/`, screenshots `player/*.png`.
- Verifier: every bug re-run from its repro (`v_*.txt`).
- Advisor: read-only what-ifs `adv/` (port.js, port2.js, port3.js, bk.js; rules patched in memory only).
- Fixer, after each fix: split-lint, mkpage + split-golden 10 12345, headless --check, --selftest, --scenarios, nations-balance --quick,
  stack-duel, eco-check, old saves. Before/after: `headless.js --games 3 --days 60 --invariants --stats --provoke 3 --jobs 2 --check` (seeds
  12345, 13354, 14363): `fix/base0.*` on the round-1 head, `fix/after.*` on the round-2 rules (341 s wall).
- Prototype builder: `proto/` (port-sortie checker, port2.js on the real code, headless 3x60 master v branch, page driver, old saves).

**Checks (head 927796a).** split-lint OK; split-golden 10 12345: GOLDEN same, no errors (changed on purpose once, in d0c02b2, from day 6;
'rs' the same through day 7); headless --check DETERMINISTIC; --selftest OK, 52 of 52 flagged (new mutant "fleet route over land");
--scenarios 37/41 with the 4 known warnings, 0 failed; nations-balance --quick ALL PASS; stack-duel OK (11); eco-check: only the known FAIL
"an Arms Industry must not raise the Army Base price: 18"; old saves (pre-auto-test world64 s2501 d30, v1 s2500 d15, v3.11 s2500 d20) load
and play with no error. Build not run this round.

**Found, confirmed and fixed** (one commit each on auto-test/fixes; verified by repro before and after):
- B2.1 Fleets sail over land between neighbouring port cities, also across peninsulas into another sea (MR2-01) | pathFor's ships-only
  filter checked only the far end of a leg; tick.js split ships off a mixed force only when the next port was not portOk; 187 neighbouring
  port pairs on the map; Trondheim → Oslo docked after 12 h over land, Ipoh → Kuantan across Malaya in 6 h; AI cases (Pakistan, Italy, South
  Korea) | fixed in **a9e2226** (findPath `wet` flag for ships-only routes and surprisePath; a tick.js guard splits ships off before a
  land-to-land leg and makes a fleet re-plan or stop; new invariant `ship-on-land-leg` and selftest mutant). Trondheim → Oslo now by sea,
  60 h; the frigate stays in Hamburg in m5. Golden unchanged.
- B2.2 A ships-only group split off a mixed force keeps the troops' inland route (MR2-K1 = B1.17 from round 1) | splitPlan copied a.path |
  fixed in **7ab8826** (the ships part plans its own sea route; safety net beside B2.1). m20: no frigate in Cologne.
- B2.3 Old saves from before NAVAL CITIES (public v3.11/v3.12): ships on a coast that is not a naval city stay there for good, ships-only
  fleets walk saved land routes (ECO-R2-1) | restore()'s migration skipped every force with ships | fixed in **f2e7703** (on load, such
  ships put out to the sea zone beside them and re-plan over water; a mixed force's ships become their own fleet; only saves without
  `S.nc`). save311 15-day play: ship-on-land 8 → 1 (the one left: 2 submarines saved under way on a 55 h boarding leg; it ends at sea).
- B2.4 A head-on clash on a sea-to-port leg puts invading troops ashore with no landing timer, no first-day stamp, no −5 morale (MR2-03) |
  tick.js clash block moved both columns to the leg's end with atMove | fixed in **27ccf9d** (on a sea↔land leg the clash is fought at the
  sea end). m2: the invader fights at sea.
- B2.5 A carrier wing in flight when its carrier sinks gets a land base on paper and stays in the sea zone for good (MR2-04) | air.js 'back'
  branch moved the wing only while it had a carrier | fixed in **3113f4f** (it flies back to its new base; the idle branch also recovers
  wings already stranded in saves). m8: wing at Kokkola.
- B2.6 A fleet heading home docks in its port after the enemy took it mid-voyage, then sits in an enemy port (MR2-05) | only canEnter was
  re-checked on the way | fixed in **c3bc1ad** (it turns back on the water, with a message). m16: no Norwegian fleet in Finnish Tromsø.
- B2.7 Paratroopers in the air land in a nation that made peace while they flew (MR2-06) | dropTick had no war re-check (B1.6 covered
  missiles and strikes only) | fixed in **9c3af00** (the drop is called off, the force stays at its airbase; no rng drawn; Q8/Q18 answer A).
- B2.8 A sated AI nation's forces stay stuck in independent land they may not take (MR2-K2, the gap in B1.2) | ai.js skipped `o < 0` |
  fixed in **ff24881** (they head home too). Golden may change; it did not.
- B2.9 A person's buy offer pays for goods past the storage cap; the excess is destroyed at the next daily step (~$803M in the probe)
  (ECO-R2-2) | economy.js bookDay had no room check when the AI sells into a seat's bid | fixed in **fe149c1** (capped by the free room; the
  rng draw count unchanged).
- B2.10 An agent's operation finishes on whatever the province is now: after its own nation takes the target it sabotages its own Army Base
  (ECO-R2-3) | diplomacy.js spyHour never checked o === n | fixed in **1b3c5f1** (called off with a message, before the rng roll).
- B2.11 Annexation after a nation falls marks the annexer's own home provinces as occupied (output 25%, rising over 10 days) (ECO-R2-4) |
  state.js checkNation set S.occ for every province | fixed in **669ef55** (home land: occ null, unrest 0, as capture does).
- B2.12 (Known baseline force-in-closed-land) a third nation's capture leaves forces of nations at peace with it in the new province until
  strandedHour (MR2-K3a; seen by the player as Egypt's army parked in Israel's new West Bank, P2-10) | combat.js capture() | fixed in
  **d0c02b2** (capture() sends home idle ground forces of nations at peace with the new holder and not friendly; golden updated in the same
  commit, it differs from day 6). Harness in the same commit: force-in-closed-land flagged only for an idle force after more than 6 h.
- B2.13 (Known baseline convoy-state) raid orders stay on fleets after their trade route ended; blockade orders stay on forces that are no
  longer fleets (MR2-K3b) | trade.js trEnded, movement.js merge | fixed in **ad4b714**.
- B2.14 (Known) IM.emit passes 4 arguments, fxRanged sends 6: the page never got the aim point or kill details (MR2-K3c) | rules/core.js |
  fixed in **3ff912d** (up to six values). Golden unchanged.
- B2.15 (Harness, known MIL-R1-T1) stuck-force counted battle hours, so a force was flagged the hour a long battle ended ("no reason found")
  (MR2-K3d) | tools/headless.js | fixed in **da4f05f** (the clock resets during battle hours; the selftest mutant is still caught).
- B2.16 IM.api launchMissile fires from another nation's silo (the US fired Canada's cruise missile from Toronto) (ECO-R2-5) | air.js
  missileCheck | fixed in **a8fa21c** ("Not your silo."). API-only, B1.13 family.
- B2.17 IM.api dealOK/applyTrade accept negative amounts (a seat's money to −$4,750M) (ECO-R2-6) | diplomacy.js | fixed in **7ef33e8**
  (amounts must be finite and ≥ 0; applyTrade checks dealOK first). API-only.
- B2.18 A design stolen by an agent while the same level is being researched: the paid project then gives nothing (ECO-R2-7) | diplomacy.js
  steal filter | fixed in **aecb447** (a design being researched is not stolen; the rng pick count unchanged).
- B2.19 Speed button tooltips say "game minutes" where they mean game hours (P2-03) | index.html | fixed in **67c950f**.
- B2.20 "1 sea zones" on sea trade routes (P2-06) | index.html | fixed in **0d102e2** (pluN).
- B2.21 The move hint says "Tap X again or press Send to march" while Send is disabled (no naval city to land at) (P2-04) | index.html |
  fixed in **c58af78** (the hint gives the no-route reason).
- B2.22 Phone: the Diplomacy "More ▾" menu opens off the left edge; Declare war, passage, alliance, trade route and Embargo are cut off and
  the two-tap "Confirm war?" is invisible (P2-01) | index.html `.morebox{right:0}` on a wrapped row | fixed in **0298973** (anchored left on
  phones; Playwright at 360/400/440 px all buttons and "Confirm war?" visible; 1300 px desktop unchanged).
- B2.23 Phone: own force counters drawn in a neighbouring country (Israeli divisions in Sinai and Jordan) (P2-02) | index.html counter
  layout (tmGround): a foreign spot cost less than the overlap sum | fixed in **927796a** (a spot in foreign land, at sea or over a border is
  dropped whenever a spot in the holder's own land exists). Israel zoom 8: 2 counters abroad → 0; Vietnam zoom 6: 0 → 0. Not hands-off
  (counter layout, not map drawing).

**Found, not fixed this round** (found after the fix step; not yet verified; round 3):
- B2.24 A ships-only force that routs is sent to the nearest supplied own **land** province: "1st Submarine Flotilla broke at Norwegian Sea
  IV and is retreating to Muonio" (inland) | prototype builder in the page (Russia seat, world64, seed 2007, on master); rules/movement.js
  ~540-547 rout target ignores ships | on auto-test/fixes the B2.1 guard probably keeps the ship on the water, but the dispatch is false;
  re-check there and pick the nearest own port or sea zone.
- B2.25 Drawing Diplomacy changes rule state: the page calls blocs(), which writes `S.blocReg` and can `tell()` a seat "form the …"
  (rules/diplomacy.js:197-207), so opening the screen moves coalition registration and dispatch timing (UI-1) | advisor, from the player
  hunter's profile (P2-05) | verify in round 3; the IMP-17 split (pure read + `blocSync` in the hourly step) fixes it and the 1.5 s open.
- Residual: save311 keeps 1 ship-on-land (2 submarines saved mid-way on a 55 h boarding leg; they end at sea). Harmless; noted under B2.3.

**Skipped.** None: the verifier confirmed 23 bugs and each has its own commit (B2.1-B2.23).

**Rejected (not bugs), and where they went.**
- MR2-02 one docked frigate holds a port for good against any land army: a design reading (docked ships count as defenders; land units do
  x0.2-0.3 to ships, data.js CLASS_M) → IMP-14 (prototyped) and Q15.
- MR2-07 a drop is accepted while landing or boarding: no broken state (timers carry on, no stuck state, no AI impact) → IMP-13 (j).
- ECO-R2-8 a common ally turns on a surprise attacker: fits the betrayal theme and each seat gets a dispatch → Q24.
- MR2-K3 parts war-with-fallen-nation and save-load S.bt: harmless (warsOf filters fallen nations, which never revive; restore resets S.bt
  with S.battles on purpose, battles restart after a load) → harness noise, IMP-20.
- ECO-R2-K1 known baseline items re-seen on 4x100 (410 distinct, 6 kinds, no new kind): the round-2 regression baseline.
- P2-10 Egypt's army idle in Israel's new West Bank: the same root as MR2-K3a, fixed in B2.12.
- Ideas and questions passed on, not bugs: IMP-R2-1 → IMP-14, IMP-R2-2 → IMP-19, IMP-R2-3 → IMP-20, ECO-R2-I1 → IMP-15, ECO-R2-I2 →
  IMP-16, P2-05 → IMP-17, P2-13 → IMP-18, P2-07/08/09 → IMP-13 (g)-(i); Q-R2-1..4 → Q15-Q18, ECO-R2-Q1..3 → Q19-Q21, P2-14 → Q22, P2-15 → Q23.

**Hands-off.** P2-11 (older-phone frame rate with the clock running, mostly map drawing) → map job, row 2 below (update of row 1); P2-12
(Phnom Penh is not a city) → cities job, row 3; the Research screen opens in 1.2 s on the throttled phone → research-screen job
(RESEARCH-CON), row 4; docked ships still hold off rebels under the old partisan rule → rebels job, row 5. Nothing in the map, cities,
weather, research-screen or art code was edited.

**Stats (3x60, seeds 12345, 13354, 14363; before = round-1 head `fix/base0`, after = round-2 rules `fix/after`).**

| Kind | Setup baseline (same seeds) | Before round 2 | After round 2 |
|---|---|---|---|
| Total distinct (kinds) | 233 (7) | 252 (7) | **14 (3)** |
| force-in-closed-land | 141 | 151 (988 sightings) | **0** |
| convoy-state | 39 | 53 (1,978) | **0** |
| stuck-force | 42 | 25 | **0** |
| war-with-fallen-nation | 2 | 12 (205) | 5 (117) (harmless, IMP-20) |
| save-load-adds-empty | 6 | 6 | 6 (harmless) |
| save-load (S.bt) | 3 | 3 | 3 (rejected, harmless) |
| troops-idle-at-sea | 0 | 2 | 0 |
| ship-on-land-leg (new invariant) | — | — | 0 |
| ship-on-land, bad-timer, landed-off-port, teleported, air-out-of-range | 0 | 0 | 0 |

Part of the force-in-closed-land and stuck-force drop is the harness narrowing (an idle force after more than 6 h only; battle hours not
counted: d0c02b2, da4f05f); the rest is the capture fix (B2.12).
- Captures 3,867 → 4,585 (+19%): forces at peace no longer block or linger in captured land, sated forces leave independent land.
- Units: infantry 75.5% → 75.5% of units (setup 75.6%); kill/loss tanks 3.40 → 3.68, artillery 1.62 → 2.02, frigates 0.42 → 0.70, infantry
  1.26 → 1.21. Never built: mlrs, carr, heli, para, mpa, awacs, stealth (before: mlrs, carr, heli, para, bomb, stealth; mpa and awacs were 1
  each before, bombers 3 now); no missile fired. Interceptors 401 built, 0 kills credited (harness gap, IMP-20).
- Ranged fire: artillery 10,854 volleys / 189 damage → 6,769 / 113; frigates 6,418 / 6 → 2,344 / 11 (fewer ships firing from inside land
  garrisons). Air strikes: jets 80 → 114 sorties.
- Wars: 48 (20 truces after a median 21 days) → 46 (20 truces after a median 20 days); setup baseline 77 wars in 5 games, median 21.
- Economy: median gross money x0.99 → x0.99 day 1 → 60 (setup x0.98); median treasury $142M → $141M; manpower at the cap 53.7% → 53.4% of
  nation-days; money used 0.99 of income. 4x100 (economy hunter): 1.2% of nation-days broke while holding over $2B of goods, 311 of 318 in
  nations under 40 provinces (IMP-16); manpower at the cap 69.0% at 100 days (IMP-12).
- Idle: a research slot empty a median 24% → 25% of hours; nothing under construction 65% → 63%; no force with orders 52% → 43%.
- Rules CPU per game day 765 → 838 ms (+9.5%; the machine is shared and loaded, wall 1,820 → 2,375 ms). Check with perf.js in round 3
  whether the `wet` path search or the new guards cost this.
- Player: Diplomacy opens in 1.5 s on the throttled phone (IMP-17); 8x clock 4.7 fps there (map job).

**Ideas.** IMP-14 to IMP-20 in docs/IMPROVEMENTS.md, ranked: IMP-14 docked warships hold a port forever (small-medium, **prototyped**),
IMP-15 an empty treasury has no consequence (small; owner picks the rule, Q21), IMP-16 small nations' goods have no outlet, IMP-2 option 1
measured useless (small), IMP-17 Diplomacy 1.5 s on an older phone and the page writes rule state (small), IMP-18 little to do on days 1-2
(small text; NAT-5 and RES-2 proposals), IMP-19 march ETA up to 4 h late (small), IMP-20 harness invariants and `--fuzz` (small; three parts
done this round), plus IMP-13 (g)-(j) and new evidence for IMP-2, 3, 6, 7, 8, 9, 11, 12. Questions Q15-Q24 in docs/QUESTIONS.md.

**Prototype.** `idea/port-sortie` @ **d7a2ea0** (IMP-14 option 1; one commit on master cb1730a, never merged). Docked ships-only fleets no
longer stop land forces or block a capture; when a port falls they sail out to its sea zone at −10 morale with a dispatch; ground defenders
and mixed forces still hold. Tromsø cases: "held after 300 h" → taken in 22-34 h; ground defenders hold until beaten (50-52 h); all-AI
45 days seed 4025: 43 h of ports held only by ships → 0; 3x60 harness: no new violation kind, captures +1.7%, deterministic; golden
unchanged; old saves play. The page's move preview no longer shows "Likely defeat" against ships alone. Checker `tools/port-sortie.js`
(branch only). Note: the rebels-sim scenario "partisans … (Tromsø) take it after a day" fails on master and the branch alike, because the
partisan fix B1.4 is only on auto-test/fixes. Screenshots scratchpad `autotest/round2/proto/shots/`.

**Note.** The advisor saw an uncommitted rules/tick.js change in this worktree during its runs (columns on a sea-land leg meet on the
water): the fixer's B2.4 work in progress, committed in 27ccf9d. It may be in the advisor's last two `bk.js hoard7` runs only; the
base/proto pairs ran before it.

**New this round?** yes (20 new bug reports from the hunters: 17 confirmed and fixed, 3 rejected as design or polish; 6 known items fixed
too; 2 more found after the fix step; 1 new hands-off bug; 7 ideas; 10 questions).

## Round 3   (2026-11-21; fixes on auto-test/fixes 492a985..f673892 on top of d3670ca, docs in the commit after; the last round)

**Owner's note this round** (2026-11-21): "we dont want to focus on bad phones becasue these players probably wont spend anyway". No bug
hunt, fix or idea in this round aims at old or low-end phones; timings were taken without a CPU throttle. Earlier old-phone items (P1-05,
IMP-6; rows 1-2 of "Bugs for other jobs") drop to the bottom of the list.

**Runs.** (scratch reports under scratchpad `autotest/round3/`, not committed)
- Military hunter: `headless.js --seeds 3007,3016,3025,3034 --days 90 --invariants --stats --provoke 3 --jobs 2` (1,105 s wall; rules 986 ms
  CPU per game day, 891-1,054 per seed; machine load 12-16 on 4 cores) → `mil/long.json`, `mil/long.txt`; 4 runs of the test-only order fuzz
  (`mil/s/fuzz.js`, seeds 3007/3043 12 days, 3052/3061 14 days, about 10,000 random orders each); `scan3.js` (rout without a route, jumps
  over water, oscillating forces; own dice) on seeds 3007 and 3016, 40 days; probes `mil/s/t2-t11.js`; replays `rp3.js`; `headless.js
  --scenarios` 37/41 (the 4 known warnings); stack-duel --scenarios 7/7.
- Economy hunter: `headless.js --seeds 3500,3501,3502,3503 --days 100 --invariants --stats --provoke 3 --jobs 2` on d3670ca (1,155 s wall;
  rules 995 ms per game day) → `eco/long4x100.*`; probes `eco/p/` (bidround, pagebid, rebelhome, rallyship, repeat, apiedge3, scan on seeds
  3504/3505, replays of the ship-on-land and landed-off-port cases); old public saves v3.9 and v3.5 made in Playwright from `versions/` and
  played 15 days (`mkold.js`, `loadplay.js`); eco-check and rebels-sim scenarios.
- Player hunter: Playwright on `.test/page.html`: India on desktop 1440x900; Greece on a phone viewport 440x900 at 2x with touch; no CPU
  throttle; driver `player/drv/`, screenshots `player/*.png`.
- Verifier: every bug re-run from its repro, plus headless re-checks in `ver/` (v3.js identification at a pinpoint, v4.js rout wording).
- Advisor: read-only `adv/forces0.js` (ground forces per nation at day 0) and a re-run of `eco/p/repeat.js` on d3670ca.
- Fixer, after each fix: split-lint, mkpage + split-golden 10 12345, headless --check, --selftest, --scenarios, nations-balance --quick,
  stack-duel, eco-check, rebels-sim where relevant, old saves (two 20-day world64 games with a war, saved under `pre-auto-test` rules, load
  and play 48 h), Playwright smoke for page fixes (12 days with renders, Diplomacy, Market and Production opened). Final: `headless.js
  --games 3 --days 60 --invariants --stats --provoke 3 --jobs 2 --check` (seeds 12345, 13354, 14363; 206 s wall) → `fix/final3x60.*`.
- Prototype builder: `proto/` (group.js page test on phone and desktop, master against the branch; old-save test; screenshots).

**Checks (head f673892).** split-lint OK; split-golden 10 12345: GOLDEN same, no errors (changed on purpose twice: eca1461 from day 8 and
22d6d2b from day 5, both AI forces with no route home; `rs` and force counts the same every day; tools/golden-12345.txt updated in each of
those commits); headless --check DETERMINISTIC (hash 88ab6d7d3ed04ec9 for seed 12345); --selftest 52/52; --scenarios 37/41 with the 4 known
warnings (embark, fleet inland, walk into peace, war during truce), 0 failed; nations-balance --quick ALL PASS; stack-duel OK; eco-check:
only the known FAIL "an Arms Industry must not raise the Army Base price: 18"; rebels-sim --scenarios OK 5; old saves load and play (above,
and ECO-R3-S1 below). Build not run; `.test/assets` (315 MB) deleted after the page tests.

**Found, confirmed and fixed** (one commit each on auto-test/fixes; verified by repro before and after):
- B3.1 A buy offer typed below a whole cent multiplies the treasury: money held at the typed price, refunded at the price rounded to 2
  decimals (ECO-R3-1) | rules/economy.js postOffer; real page: price 0.005, Post, Cancel: $232M → $0 → $464M, repeatable; 0.004 lost all
  the money | fixed in **492a985** (round to cents first, refuse below $0.01 (`BOOK_MIN_PRICE`), hold, store and refund at that one price;
  the page's Post offer refuses with a toast). bidround: 0.005 nets 0 (was +$1000M), 0.004 refused. Golden unchanged.
- B3.2 A routed force whose nearest own province has no route stays "retreating" in the battle for good, never surrenders, and the
  dispatch names a place it never heads for (MIL-R3-01; includes B2.24 from round 2 and MIL-R3-K2) | rules/movement.js armyUpkeep rout
  block accepted the destination before pathFor; 96 cases / 1,684 force-hours in 40 days (seed 3007); 6 of 8 broken fleets got path [] |
  fixed in **eca1461** (a province counts only when pathFor finds a route; retreating flag and dispatch only then, naming the city;
  otherwise the encircled-surrender check runs; an old save's retreating force with no route is cleared). t2: all 8 fleets sail to an own
  naval city. **Golden updated** (from day 8: a British force broken in Syddanmark and a New Zealand force had no route home).
- B3.3 Forces sent home at peace with no land route jump over the sea to any coast and keep a running landing timer (MIL-R3-02) |
  rules/diplomacy.js sendHome fallback, called by capture() since B2.12; 17-22 jumps per 40 days (Brussels → Norfolk, Baku → Aktau, Taipei
  → Shanghai); India's landing party jumped from Muscat to Dayapar with `land` 0.31 | fixed in **22d6d2b** (helpers `jumpDest`/`jumpTo`: a
  jump across water goes to the nearest own naval city and drops land/emb/oldLand/carry/sail; capture()'s "leaves" dispatch uses the city
  name). t6: Ahmedabad, no timer. **Golden updated** (from day 5: a British force in Noord-Holland now jumps to London). Q25 for the
  design.
- B3.4 (Known setup-baseline ship-on-land, never fixed before) evict() on a truce jumps forces to the nearest own province with no port or
  landing check: Algerian frigates inland at Sétif for 27 days (seed 3501), a Norwegian landing party inland with its timer (seed 3500)
  (ECO-R3-7) | rules/diplomacy.js evict | fixed in **aee2fa5** (the same helpers: a fleet goes to the sea zone it sails to or beside its
  port, else an own naval city; a jumped force drops its timers). evict.js: both fleets in Mediterranean Sea VIII. Golden unchanged.
- B3.5 A ground force arriving at its airbase merges into a paratrooper force in the air: tanks and infantry are air-dropped (MIL-R3-03) |
  rules/tick.js arrival join had no `!b.fly` | fixed in **6399e71** (the join skips flying forces both ways; the page's joinForces refuses
  with a toast). t4: drop lands {para:3}, the tanks stay in Berlin. Seats only; golden unchanged.
- B3.6 Paratroopers in the air take ground orders: Move makes them walk while airborne, they land with a stale leg and route; Split and
  Merge offered but do nothing (MIL-R3-04) | tick.js movement loop, movement.js orderMove, air.js dropTick, index.html cmdBarHTML | fixed in
  **df61648** (orderMove and haltArmy refuse "Paratroopers in the air: orders once they land."; the loop skips `a.fly`; dropTick clears
  t/path/legFrom/dest/pos/wp/sail; merge and joinHour refuse; the command bar disables the order buttons). Golden unchanged.
- B3.7 A new ship built in a port with a land rally point silently deletes the rally point; the next infantry stays in the city (MIL-R3-05
  = ECO-R3-3) | rules/production.js spawn applied the rally to ships | fixed in **226c309** (rally for ground units only; a ground unit with
  no route drops the rally point with a dispatch and joins the city's forces). t8: rally kept. Golden unchanged.
- B3.8 Enemy forces you fight stay "? Unidentified army" for the whole battle when your force stands more than 50 km from them (pinpoint
  orders) (P3-01) | rules/vision.js armyKnown gated on armyVisible before the battle clause of armyIdent | fixed in **14efd66** (`fightsMe`
  and `armyShown`, screen only, listed in IM.api; armyKnown and armyView use them; armyVisible unchanged, so ranged fire, the AI and raids
  play as before). v3: known true (was false). Golden unchanged.
- B3.9 (B2.25, verified; P3-08 merged) Drawing the page writes coalition state: blocs() registers coalitions in `S.blocReg` and sends
  "form the …" dispatches whenever the side panel (every 0.25 s) or Diplomacy renders (ECO-R3-8) | rules/diplomacy.js blocs, index.html
  callers | fixed in **a405a5d** (pure `blocsView`, `blocOfView`, `sameBlocView` for every drawing caller and for acceptOffer; `blocs()`
  stays for the rules and page orders). pgbloc: `S.blocReg` stays {} while the page renders. Golden unchanged. (Not memoised: the IMP-17
  open time is not changed by this.)
- B3.10 Partisans in a province that went back to its home nation without a fight (sale back, gift, peace cede, annexation) then make it
  independent (ECO-R3-2) | rules/economy.js rebelHour | fixed in **0156928** (partisans stand down when the holder is the home nation, with
  an 'info' dispatch to a seat; old partisan rule only, REB-2, the rebels branch untouched). rebelhome sale/gift/peace: the province stays
  with its holder. Golden unchanged. Q27 for the peace-cede case.
- B3.11 Repeat production never restarts once paused, and ticking it on an idle city trains nothing (ECO-R3-4) | Repeat ran only when a
  unit finished | fixed in **33e8da9** (`repeatHour(n)` for seats after the production step; one "paused" and one "resumed" dispatch,
  `desk.repP` per city). repeat.js: (a) 2 → 6 in 72 h (was 2 → 2); (b) trains again once money is back. Golden unchanged.
- B3.12 A wing rebasing to an airbase the enemy takes while it flies lands in enemy land, then silently jumps elsewhere an hour later
  (MIL-R3-06) | rules/air.js airTick rebase arrival | fixed in **03af914** (it turns back with "Rebase to Wiesbaden called off: Wiesbaden
  fell to Poland. 1st Air Wing turns back."). Golden unchanged.
- B3.13 IM.api fillOffer with no amount writes NaN into both nations' money and goods; postOffer with a type other than sell/buy lists a
  phantom sell offer whose expiry creates goods (ECO-R3-6) | rules/economy.js | fixed in **a8dbc1f** (finite amount above 0; type sell or
  buy only). API-only, the B1.13/B2.17 family. Golden unchanged.
- B3.14 The 8-route trade limit existed only in the page (P3-07) | rules/trade.js tradeOpen | fixed in **088d222** (a seat's 9th route is
  refused with a reason; AI routes unchanged). trmax: stops at 8 (was 13). Golden unchanged.
- B3.15 One province, two names in the same chain of dispatches and in the force status ("Battle at Kirklareli" then "Battle of Tekirdağ";
  "Moving to Kŏḷamba" for Colombo) (P3-03) | tick.js, movement.js, combat.js capture, index.html force status | fixed in **ce6352e**
  (`cityName || name` everywhere). Text only; golden unchanged.
- B3.16 The victory meter labels the capitals count "VP" ("1/11 VP" for Greece) (P3-06) | index.html | fixed in **9f54b56** ("4/5
  capitals"; no overflow at 390 or 1300 px).
- B3.17 Header chips show the daily change of money and manpower without units ("105k +72") (P3-05) | index.html resDay | fixed in
  **f673892** ("+$278M", "+56k"; goods unchanged).

**Found, not fixed this round** (found by the prototype builder after the fix step, on master and on auto-test/fixes; page only; not
verified by the verifier; fixed on the idea branch only):
- B3.18 After forces join into one, `sel.group` keeps the same id several times ([2,2,2,2]) and the group panel shows "Group · 4 forces"
  for one force | index.html `IM.on('merged')` handler maps joined ids without removing duplicates (near line 11932 on master) | fix: dedupe
  and collapse a group of one (done on `idea/phone-group`).
- B3.19 A group ordered to the province its lead stands in: only the lead takes a small step, the others stay | index.html tap's
  cmdMode path and the contextmenu (right-click) path | fix: another group member leads, so the group gathers (done on the idea branch for
  Move-then-tap only; right-click left as on master).
- Harness false alarm: the final 3x60 shows 2 `landed-off-port` (India at Monywa, seed 12345 h960; Yemen at Arta, seed 14363 h410).
  Replays (`fix/replay4.js`) show both came ashore at a naval city (Yangon, Mogadishu) and were then moved home over land in the same hour
  by evict / sendHome. The check compares the start and the end of the hour; teach it the landing province (IMP-20). Not a game bug.

**Skipped.** None: the verifier confirmed 18 reports (17 distinct bugs), each fixed in its own commit (B3.1-B3.17).

**Rejected (not bugs), and where they went.**
- ECO-R3-3 duplicate of MIL-R3-05 (B3.7). MIL-R3-K2 folded into MIL-R3-01 (B3.2). P3-08 duplicate of ECO-R3-8 (B3.9).
- MIL-R3-K1 the known baseline and round-2 kinds re-checked on new seeds: only harmless kinds remain (below, as the round-3 baseline).
- P3-04 "Battle … ended" after your force fled: not reproduced as described (the verifier's v4.js reads "lost"); "ended" is the rule for a
  battle both sides left → wording in IMP-22.
- P3-02 one render exception freezes the game loop: reached only by the test-only call `__im.selectProv(-1)` → resilience idea IMP-27.
- P3-09 "(via Ahmedabad)" names the local port: known IMP-13 (c); the root cause (index.html:4558) is added as IMP-13 (n).
- ECO-R3-5 a coalition gift gives home title to captured land: a title rule, the owner's call → Q28.
- ECO-R3-9 a fallen nation's offers and routes live up to 24 h: a fair exchange for the living side, dropped at the next daily step →
  harness noise, IMP-20.

**Hands-off.** P3-16 (province names with transliteration marks, and city names in the wrong province) → cities / map data job, row 6
below; the partisan case of B3.10 under the new rebels rule → rebels job, row 7. Nothing in the map, cities, weather, research-screen,
rebels or art code was edited. Rows 1-2 (older-phone frame rate) drop to the bottom by
the owner's note.

**Other results.**
- ECO-R3-S1: old public saves v3.9 (35f87f7) and v3.5 (21260f2), never tried before, load and play 15 days on d3670ca rules with no new
  violation (only the known save-load S.bt). The old-save list tried in this session: v1, v3.5, v3.9, v3.11, v3.12, pre-auto-test.
- MIL-R3-K1 (round-3 baseline on new seeds, 4x90 on d3670ca): 27 distinct violations of 3 kinds, all known and harmless:
  war-with-fallen-nation 15, save-load-adds-empty 8, save-load S.bt 4. force-in-closed-land, convoy-state, stuck-force, ship-on-land,
  ship-on-land-leg, bad-timer, teleported, landed-off-port, air-out-of-range: 0 in 360 game-days (setup baseline: 242 / 61 / 59 / 1 in
  300). The 4 fuzz runs: no exception, no ship on land, no bad timer; only the fuzz's own halts at sea, S.bt, and MIL-R3-02's landing.
  The economy 4x100 on d3670ca: 37 distinct of 5 kinds; the 2 non-harmless ones were B3.4's ship-on-land (Sétif) and landed-off-port
  (Windsor), both fixed.
- Hunters' ideas and questions passed on: MIL-R3-I1 → IMP-3/IMP-11 evidence; MIL-R3-I2 → IMP-8, IMP-7; MIL-R3-I3 → IMP-25; MIL-R3-I4 →
  IMP-20; ECO-R3-I1 → IMP-13 (m); ECO-R3-I2 → IMP-26; ECO-R3-I3 → IMP-23; P3-10 → IMP-24; P3-11 → IMP-21 (prototype); P3-12 → IMP-22;
  P3-13 → IMP-1 evidence; P3-14 → IMP-17 evidence; P3-15 → IMP-13 (k), (l), (o); Q-R3-1 → Q25, Q-R3-2 → Q26, ECO-R3-Q1..Q3 → Q27-Q29,
  P3-Q1 → Q30; the prototype's question → Q31.

**Stats (3x60, seeds 12345, 13354, 14363; round-2 after = `round2/fix/after`, now = `round3/fix/final3x60` on f673892).**

| Kind | Setup baseline (same seeds) | After round 2 | After round 3 |
|---|---|---|---|
| Total distinct (kinds) | 233 (7) | 14 (3) | 18 (4) |
| force-in-closed-land | 141 | 0 | 0 |
| convoy-state | 39 | 0 | 0 |
| stuck-force | 42 | 0 | 0 |
| ship-on-land, ship-on-land-leg, bad-timer, teleported, air-out-of-range | 0 | 0 | 0 |
| war-with-fallen-nation | 2 | 5 (117) | 7 (156) (harmless, IMP-20; AI dynamics) |
| save-load-adds-empty | 6 | 6 | 6 (harmless) |
| save-load (S.bt) | 3 | 3 | 3 (rejected in round 2, harmless) |
| landed-off-port | 0 | 0 | 2 (harness false alarm, above) |

- Captures 4,585 → 4,296 (−6%); nations alive at day 60: 66/68/66 → 66/66/67. Wars 46 → 46; truces 20 → 18; ended wars lasted a median
  20 → 7 days (5 to 46; one run of 3 games: the rout and send-home fixes change which forces stay at the front; the military 4x90 on
  d3670ca reads 21 days, so treat the drop as noise until a longer run confirms it).
- Units: infantry 75.5% → 75.2% of units (setup 75.6%); kill/loss tanks 3.68 → 3.45, artillery 2.02 → 1.70, frigates 0.70 → 0.59,
  infantry 1.21 → 1.17. Never built: mlrs, carr, heli, para, mpa, stealth (awacs 2 and bombers 3 built); no missile fired. Interceptors
  419 built, 0 kills credited (IMP-20). Orders lost when a city fell: 64 (IMP-23).
- Ranged fire: artillery 6,769 volleys / 113 damage → 9,174 / 230; frigates 2,344 / 11 → 4,696 / 32; submarines 64 / 0 → 795 / 2. Air
  strikes: jets 114 → 183 sorties (55 → 126 units killed).
- Economy: median gross money x0.99 → x0.98 day 1 → 60 (setup x0.98); median treasury $141M → $140M; manpower at the cap 53.4% → 53.6%
  of nation-days; money used 0.99 of income.
- Idle: a research slot empty a median 25% → 23% of hours; nothing under construction 63% → 63%; no unit in training 36% → 37% (0% with
  more than $300M); no force with orders 43% → 47%.
- Long runs (d3670ca): military 4x90 manpower at the cap 66.7%, research slot empty 22%, nothing under construction 71%, no unit in
  training 54%; economy 4x100: frigates 10,106 volleys for 38 damage, missiles 3 built and 0 fired.
- Rules CPU per game day 838 → 834 ms (machine shared and loaded; wall 1,019 ms).
- Player (unthrottled, ordinary devices): Diplomacy opens in 408 ms on desktop and 913 ms in a phone viewport (loaded machine; IMP-17);
  desktop 8x clock 37 fps, 16x 46 fps.

**Ideas.** IMP-21 to IMP-27 in docs/IMPROVEMENTS.md, ranked: IMP-21 phones cannot select several forces (small-medium, **prototyped**),
IMP-22 "battle won" but nothing taken / "ended" when you fled (small, text), IMP-23 units in training lost on capture with no word (small),
IMP-24 phone INTEL card opens a screen with no buttons (small), IMP-25 AI forces shuttle between two provinces (small; golden changes on
purpose), IMP-26 Repeat production (small; option 1 done by B3.11), IMP-27 one drawing error freezes the game (small; agree with the map
job), plus IMP-13 (k)-(p) and new evidence for IMP-1, 3, 6, 7, 8, 9, 11, 12, 16, 17, 20. IMP-6 and the old-phone part of P1-05 moved to
the bottom. Questions Q25-Q31 in docs/QUESTIONS.md.

**Prototype.** `idea/phone-group` @ **4ac62da** (IMP-21; one commit on master 9e1cd8c, pushed, never merged; index.html only, +29/-5). A
long press by touch on your counter adds or removes its forces from the selection; Move and one tap send the whole group; "Merge forces
here (N)" when the group stands idle together; phone wording in the group panel and hint bar. One 10-unit stack on a phone: 12 taps on
master → 6 on the branch (14 → 7 with a Merge). Golden unchanged; controls.js 49 PASS, group.js 15 PASS; desktop Shift-click, box and
right-click unchanged; a v3.12 save plays. Screenshots scratchpad `autotest/round3/proto/phone-group-*.png`. Also fixes B3.18 and B3.19
(Move-then-tap) on the branch.

**New this round?** yes (20 new bug reports from the hunters: 15 confirmed and fixed, 5 rejected as duplicates, design or polish; 2 known
items fixed too: B2.25 from round 2 (B3.9) and the setup baseline's ship-on-land (B3.4), while B2.24 is fixed inside B3.2; 2 more page
bugs found by the prototype builder; 2 hands-off items (cities job, rebels job); 7 ideas; 7 questions).

**End of the session.** This was round 3 of at most 3 (owner's change 4), so the session stops here. For the owner's review:
- `auto-test/fixes` (not merged): rounds 1-3 fixes, one commit each, plus the docs commits. The golden changed on purpose in d0c02b2
  (round 2), eca1461 and 22d6d2b (round 3), each with its reason in the commit message.
- Prototypes (never merged): `idea/sea-legs` (IMP-1), `idea/port-sortie` (IMP-14), `idea/phone-group` (IMP-21).
- Open questions: docs/QUESTIONS.md Q1-Q31, each with the default the session used.
- If a later session continues: first the two page bugs B3.18-B3.19 on auto-test/fixes, then IMP-20's harness checks (rout-no-route,
  jump-over-water, drop-cargo, the landed-off-port false alarm), then the IMP-17 memo and re-timing Diplomacy, then IMP-22/23/24 (small
  text and wiring), and a longer run to confirm the war-length change above.

## Bugs for other jobs

Bugs found in parts this session must not touch (owner's changes 2026-11-21, item 6): map drawing (terrain, texture, jungle, sea, borders,
fog, tint), cities and 3D cities, weather, the research screen (UI), unit pictures, atlases and art. Each one is for the job named; the
session changes nothing there.

| # | Area / job | Bug | How to see it (file:line, steps, seed) | Found in round |
|---|---|---|---|---|
| 1 | Map drawing (map job) | Older phone: panning at about 12 fps and the 8x clock at 13 fps (50 fps unthrottled); 67.5% of a pan profile is native canvas raster and compositing at pixel ratio 2, frame/rdDraw/draw 23-31%. Supports the owner's open "phone map drawn at pixel ratio 1.5" item. (The side-panel part is IMP-6, not the map job's.) | index.html:11774/11765/8277 (frame, rdDraw, draw). Playwright 440x900, deviceScaleFactor 2, touch, CDP `Emulation.setCPUThrottlingRate` 4, Brazil, 4 touch drags; driver scratchpad `autotest/round1/player/drv/server.js --phone` (P1-05) | 1 |
| 2 | Map drawing (map job) | Update of row 1, round 2: older phone with the clock running, Israel at zoom 5, CPU 4x: 1x clock 9.1 fps (median frame 117 ms), 8x 4.7 fps (233 ms, longest task 350 ms), paused 28 fps; unthrottled 43.8 / 22.2 / 29 fps. Profile at 8x: drawImage 42.7% self, frame→rdDraw→draw 55% inclusive, drawSeaSurface→drawImage 10.5%; the rules (tickQSlice) only 3.4%, so the 8x slowdown is drawing. Machine load 4-8 on 4 cores, so absolute numbers are lower than round 1. | index.html draw / drawSeaSurface. Phone driver scratchpad `autotest/round2/player/drv/server.js --phone`, CDP `Emulation.setCPUThrottlingRate` 4, click #sp4, Profiler 10 s (P2-11) | 2 |
| 3 | Cities / map data (cities job) | Phnom Penh, Cambodia's capital, is not a city: `G.P[2227]` city=false, cityName ''; the nearest label is Vietnam's "Ho Chi Minh City" 14 world px east, so a route to Phnom Penh ends beside the "Ho Chi Minh City" label. The province name "Hồ Chí Minh city" (2245) also has a lowercase "city". | Start as Vietnam, read `__im.G.P[2227]`; select a force and Move to Phnom Penh (scratchpad `autotest/round2/player/vn-ph-target-phnompenh.png`) (P2-12) | 2 |
| 4 | Research screen (RESEARCH-CON job) | The Research screen takes 1,214 ms from tap to visible on an older phone (440 px at 2x, CPU 4x, Israel day 2), against Market 732 ms and Cities 569 ms. Worth a budget in the rebuild (PRF-5). | Phone driver as row 2, Profiler.start, tap the Research tab, wait for the modal (P2-05) | 2 |
| 5 | Rebels (REBELS job, branch rebels) | Under the old partisan rule, docked enemy ships still hold a port against rebels (owner −1): seed 4025 Dublin and Ahvaz 372 h, seed 2007 Dublin 130 h, the rebels never take it. Not changed here (REB-2: the rebels branch replaces the rule); check that the new rule does not let a docked fleet hold a city against rebels. | Advisor scratchpad `autotest/round2/adv/port3.js 4025` and the prototype's `proto/port2.js` (IMP-14) | 2 |
| 6 | Cities / map data (cities job) | Province names with transliteration marks show in tooltips and force panels: Kŏḷamba (2369, label "Colombo"), Kilinŏchchi (2318), Mŏṇarāgala (2388), Hamgyŏng-bukto, P'yŏngan-namdo. Some city names sit in a province of another name or place: "Pirkanmaa / Helsinki", "Syddanmark / Copenhagen", "Kirklareli / Tekirdağ", "Stockport / Manchester". 359 of 714 cities have a city name different from the province name. (The session's dispatches and force status now use the city name, B3.15; the data is the cities job's.) | In the test page: `__im.G.P.filter(P=>P.city&&P.cityName!==P.name).map(P=>P.name+' / '+P.cityName)` (P3-16) | 3 |
| 7 | Rebels (REBELS job, branch rebels) | Under the old partisan rule, partisans standing in a province that went back to its home nation without a fight (sold back, gift, peace cede, annexation) made it independent a day later; fixed for the old rule on auto-test/fixes (0156928, B3.10: they stand down when the holder is the home nation). Check the same case under the new rebels rule (REB-2), and Q27 for the owner's answer on peace-ceded land. | Economy hunter's scratchpad `autotest/round3/eco/p/rebelhome.js` with sale, gift, peace or annex (ECO-R3-2) | 3 |

Rows 1 and 2 (older-phone frame rate) are low priority since the owner's note of 2026-11-21 (round 3): no work aimed at old or low-end phones.
