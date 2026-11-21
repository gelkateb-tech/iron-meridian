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

## Bugs for other jobs

Bugs found in parts this session must not touch (owner's changes 2026-11-21, item 6): map drawing (terrain, texture, jungle, sea, borders,
fog, tint), cities and 3D cities, weather, the research screen (UI), unit pictures, atlases and art. Each one is for the job named; the
session changes nothing there.

| # | Area / job | Bug | How to see it (file:line, steps, seed) | Found in round |
|---|---|---|---|---|
