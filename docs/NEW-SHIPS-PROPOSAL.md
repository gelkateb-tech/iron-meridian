# New ships: Corvette, Destroyer, Ballistic Missile Submarine (proposal)

Proposal only. Nothing was edited, committed or pushed, and no image API was called. Picture sheet: `sheet-ships.jpg` in this folder.

Surface ships, small to big: **Corvette, Frigate, Destroyer, Cruiser**. Submarines: **Attack Submarine, Ballistic Missile Submarine**. The Aircraft Carrier stays.

The 4 current ships keep their stats exactly. Only their model names and UI portraits change. The new ships use the Naval Yard levels the build-reqs branch already set: Corvette I, Destroyer II, Ballistic Missile Submarine V.

## 1. The 7 ships side by side

| | **Corvette** (corv), new | Frigate (frig) | **Destroyer** (dest), new | Cruiser (crui) | Attack Submarine (sub) | **Ballistic Missile Sub** (ssbn), new | Aircraft Carrier (carr) |
|---|---|---|---|---|---|---|---|
| Job | Cheap coast guard and sub hunter | Convoy escort and the fleet's air shield | All-round fleet ship: fights ships, hunts subs, some missile defence | Heavy gunship: coastal bombardment, best missile shield, the only ship that hits an ICBM | Hidden ship killer and convoy raider | Hidden missile launcher at sea | Floating airbase |
| Cost $M | **34** | 52 | 60 | 66 | 48 | 150 | 124 |
| Oil / mat / iron / elec / rare | 3/3/7/2/0 | 6/6/12/4/0 | 8/8/16/5/0 | 10/10/20/6/0 | 4/5/10/4/0 | 8/14/26/14/8 | 14/15/32/10/3 |
| Manpower | 3k | 6k | 7k | 8k | 5k | 8k | 10k |
| Attack / Defence / HP | 3 / 3 / 9 | 4 / 5 / 14 | 6 / 5 / 17 | 7 / 6 / 20 | 6 / 2 / 9 | 2 / 3 / 14 | 3 / 6 / 26 |
| Speed (hexes a day) | 7, coastal sea zones only | 6 | 6.2 | 5.8 | 5.4 | 5 | 5 |
| Build time | 36 h | 60 h | 78 h | 96 h | 60 h | 132 h | 120 h |
| Upkeep $M a day / fuel | 1.5 / 1 | 3 / 1 | 4 / 1 | 5 / 2 | 2 / 1 | 7 / 1 (nuclear) | 7 / 2 |
| Damage x vs soft / armoured / air / naval | 0.5 / 0.3 / 0.8 / 0.9 | 0.5 / 0.4 / 1.8 / 1.0 | 0.8 / 0.6 / **1.2** / 1.2 | 1.1 / 0.8 / 0.6 / 1.3 | 0 / 0 / 0 / 2.0 | 0 / 0 / 0 / 1.0 (only in a battle) | 0.4 / 0.3 / 1.4 / 0.6 |
| Damage x vs submarines (vsU) | **2.2** | 1.0 | **1.6** | 1.3 | 2.0 | 1.0 | 0.6 |
| Gun range | 60 km, ships and coast | 80 km, ships and coast | 100 km, ships and coast | 150 km, ships and coast | 40 km, ships only | **none** (fights back only in a battle) | none (air wing 120 km) |
| Shoots stealth bombers (LO_AD) | no | yes | yes | yes | no | no | no |
| Missile defence, plan 2 (shots an hour x HP off) | none | 2 x 4 | **2 x 6** | 3 x 6, also hits ICBMs | none | none | none (its fighters on patrol count) |
| Escort strength on trade routes | x1.0 | **x1.25** | x1.0 | x1.0 | - | - | - |
| Hears subs two zones away | no (Sonar Dip instead) | **yes, Towed Sonar** | no | no | no | no | no |
| Raids trade, cuts overseas convoys | yes (raid 0.8) | yes (0.8) | yes (0.8) | yes (0.8) | yes (1.3) | **no** | no (as today) |
| Hidden at sea | no | no | no | no | yes | **yes** | no |
| Naval Yard level (build-reqs) | I | I | II | III | III | V | V |

### Why each ship has its own job

- **Value per dollar** (attack + defence + half the HP): Corvette $3.24 a point, Frigate $3.25, Destroyer $3.08, Cruiser $2.87. The bigger ships give a bit more per dollar, but need a higher yard, a longer build and more upkeep. The Corvette is priced at $34 so it does not beat everything on value.
- **The Frigate keeps what only it has:** Yard I and 60 h, the best damage against aircraft (1.8x, 2.1x with Area Air Defence), escort x1.25, and Towed Sonar. The Destroyer does the same damage to aircraft per ship (6 x 1.2 = 7.2, the Frigate 4 x 1.8 = 7.2) but costs more.
- **The Destroyer** is the all-rounder: best ship-to-ship fighter below the Cruiser, the second best sub hunter, and some missile defence.
- **The Cruiser** alone has 150 km bombardment, 3 x 6 missile defence, and shots at ICBMs.
- **Sub hunting** (attack x damage vs subs, per $M): Corvette 6.6 (0.19 per $M), Destroyer 9.6 (0.16), Cruiser 9.1 (0.14), Frigate 4 (0.08). The Attack Sub (0.25) and Maritime Patrol Aircraft (15, 0.20) stay the best sub killers. With research the Corvette reaches 0.23 and the Destroyer 0.20.
- **The Corvette is fragile.** An Attack Sub that strikes first sinks one in about a day.

### The "vs submarines" rule

The game already has per-unit damage values (`vsU`, data.js:83-84; the Maritime Patrol Aircraft uses `vsU:{sub:2.5}`). We use that, not a new field:

- Corvette `vsU:{sub:2.2, ssbn:2.2}`, Destroyer `vsU:{sub:1.6, ssbn:1.6}`.
- Maritime Patrol Aircraft gets `ssbn:2.5` too, or it would hit the new sub at only 1.3.
- Sea battles and ship gunfire must use the same unit channel that air missions and trade escort fights already use.
- Research cannot raise a `vsU` value today (R_VS in research.js:62 only knows classes). ASW Rockets and ASW Torpedoes need R_VS to accept unit keys.
- Today's ships get no `vsU` against subs, so fights between today's ships do not change.

### The Corvette's "coastal only" rule

- A Corvette may only enter sea zones that touch land, like the Patrol Boat idea in docs/RESEARCH.md 12.4.
- In the 64-nation world, 301 of 413 sea zones (73%) touch land. So the rule only keeps the Corvette out of the open ocean (27% of the sea). It stops Corvettes crossing oceans, not much else.
- A fleet that holds a Corvette must path through coastal zones only. The computer's escort and patrol picks must skip routes across open ocean.

## 2. Research lines (category nav)

Firepower and Protection 1-3 are added by code as for every line. The last step makes the ship build 15% faster. Prices come from the R_PRICE formulas (data.js:246-251).

**Corvette** (day 1, known from the start, like the Frigate):
- ASW Rockets (day 2): damage vs subs 2.2 to 2.6.
- Sonar Dip (day 5): a sub that a fleet with a Corvette hears stays seen for 6 h after it moves away.
- Fast Hull (day 8): speed +0.8.
- Generation 2, Stealth Corvette (day 12): attack +1, defence +1, HP +2.
- Prices: upgrade level 1 $45M; Firepower 1 $54M; Generation 2 $135M.

**Destroyer** (opens day 3, 4 days to research, shown as coming from the Frigate; earliest day 7):
- Unlock: $84M, 20 materials, 27 rare.
- Naval Gunnery (day 7): attack +1.
- ASW Torpedoes (day 9): damage vs subs 1.6 to 2.0.
- Area Missile Defence (day 11): defence +1, and its missile shots count fully in the provinces next door (like a SAM with Long-Range SAM), not at half.
- Generation 2, Guided-Missile Destroyer (day 16): attack +2, defence +1, HP +3.
- Prices: upgrade level 1 $61M; Firepower 1 $96M; Generation 2 $192M.

**Ballistic Missile Submarine** (opens day 12, 6 days to research, shown as coming from the Attack Submarine; no Firepower steps; earliest day 18):
- Unlock: $165M, 20 materials, 50 rare.
- Quiet Patrol (day 19): defence +1. After firing **conventional** missiles it is shown for 6 h instead of 12 h. Firing a nuclear missile always shows it for 12 h.
- Extra Missile Tubes (day 21): carries 6 missiles instead of 4.
- Generation 2, Strategic Missile Submarine (day 24): defence +1, HP +4, speed +0.8.
- Prices: upgrade level 1 $115M; Generation 2 $390M.
- Which missiles it can load still depends on the nation's missile research from plan 2: Cruise Missiles, Conventional Warhead, Nuclear Warhead.

**Frigate, Cruiser, Attack Sub and Carrier lines:** no change.

## 3. Missile defence of the ships

- **Plan 2** (HP in flight): Destroyer 2 shots of 6 HP an hour. It needs 2 hits on a cruise missile (12 HP) and 3 on a ballistic one (16 HP), like the Cruiser but with fewer shots. It cannot hit an ICBM. Area Missile Defence lets it count fully next door.
- **Today's code** (share of a SAM): the Destroyer gets **no** missile defence until plan 2 lands, the same as the Cruiser today (0). Giving the Destroyer 0.8 would make it better than the Cruiser, which is upside down.

## 4. Ballistic Missile Submarine: missile rules (built on the missiles branch with plan 2)

1. **What it carries.** Any mix of Cruise, Ballistic, Nuclear Cruise and Nuclear Ballistic, 4 in all (6 after Extra Missile Tubes). No chemical missiles and no ICBM. At most 1 Nuclear Cruise and 1 Nuclear Ballistic per sub, like the per-silo limit. Stored on the force as `a.msl = {cm, bm, ncm, nbm}`.
2. **Loading only in port.** The sub must be in the sea zone of an own Naval Yard city.
   - (a) "Load" in that yard's queue builds the missile straight onto the sub, at plan 2 cost and time (cruise $50M 36 h, ballistic $140M 72 h, Nuclear Cruise $260M 96 h, Nuclear Ballistic $400M 120 h).
   - (b) Or move missiles already stored in that city onto the sub, taking 6 h.
   - The yard counts as the sub's silo. On land a Nuclear Ballistic Missile needs a Silo II; at sea it needs the Yard V that builds the sub, which costs more.
   - If the sub sails away during a load, the load pauses. After 24 h away it is cancelled and fully refunded.
   - Nothing can be loaded at sea.
3. **Launch.** At sea, stopped and not in a battle. Range is measured from the sub's spot to the target province centre, with plan 2 ranges: cruise 16 hexes (2,880 km), ballistic 26 hexes (4,680 km); the nuclear versions the same. Flight time, damage and the waits between launches are as in plan 2, and the waits are shared nation-wide with land launchers. This needs a new launch path from a force, because the current check refuses sea provinces.
4. **Launch card.** Plan 2's card, with "From: <sub name>, <sea zone>, on board 3/4", the range ring drawn around the sub, and these warnings: "Firing shows this submarine to everyone for 12 h", "Out of range: sail N hexes closer", "Enemy ships in this sea zone", "Last nuclear missile on board", plus the usual nuclear and diplomacy warnings.
5. **Interception.** Exactly as plan 2. The defence fires once, in the last hour before landing, so a missile from the sea is shot at exactly like one from land. No bonus, no penalty.
6. **Counted inside the limits.** Missiles on board **and queued loads** count in the nation's totals, so plan 2's limits hold across land and sea: Nuclear Cruise 2 a nation, Nuclear Ballistic 3 a nation, 5 nukes in all. A load is refused when the limit is full, with text like "Nuclear Cruise: 2 of 2 (1 on board X, 1 in silo at Y)".
7. **Hidden until it fires.** Hidden like the Attack Submarine. A fleet of only Attack Subs and Ballistic Missile Subs counts as "subs only" and stays hidden. Firing shows its sea zone to everyone for 12 h (6 h with Quiet Patrol for conventional missiles only). Sonar and patrol planes find it as today.
8. **No guns of its own.** It has no gun range and no blockade range, so it never fires on ships it sees. It is not used for raids, convoy cuts, blockades or escorts. It only fights back when it is in a battle.
9. **Losing it.** If the sub sinks, its missiles are lost and its limit slots come free in the same hour. Nukes on board do not explode. If its home yard city falls, the missiles on board are safe.

**This answers plan 2 question 5.** The USA, Japan, Australia and Brazil get a sea-based missile war once they have a Yard V and the warhead research. Example: a US sub in the Norwegian Sea is within 26 hexes of Russia.

**But it changes plan 2 for everyone (please decide, question 7).** Every nation with a Yard V can fire ballistic missiles 26 hexes from any coast, so plan 2's shorter ranges matter less. Timing: the sub is ready about day 24 at the earliest; Nuclear Warhead opens on day 20 and takes 10 days; with the 120 h load, sea nukes come about day 35-37, before the ICBM (about day 44). Missiles from the sea are still as hard to stop as from land. What goes away are the two counters to land stock: taking the city wipes it, and a silo is a fixed target. My default keeps plan 2 as it is and adds one brake: firing a nuke always shows the sub for 12 h.

## 5. How the computer uses each ship (rules/ai.js, built on build-reqs)

- **Corvette:** weight 0.6 + 4 x the enemy's sub share, +0.6 for each own convoy hit (up to 4), x1.3 for a coastal power. It counts as half a ship in the ship cap (20%, or 28% while convoys are hit), so cheap Corvettes do not crowd out bigger ships. Jobs: coastal patrol near its yards and on overseas convoy zones, escorts on coastal routes, and hunting subs that sonar or patrol planes report near its coast. Not used for raids or blockades.
- **Frigate:** weight 1.2 as today. The only cut is build-reqs' x0.6 in a Yard III city (ai.js:233). No extra cut for the Destroyer, so the computer keeps building Frigates. Still the first choice for escorts and air cover.
- **Destroyer:** weight 1.0, +0.4 for each own convoy hit (up to 4), x1.2 with spare oil. Needs Yard II. Used in escorts, raids, blockades, fleet patrols and sub hunts. The fleet filters (ai.js:11, :34, :37) add dest, and corv for escorts.
- **Cruiser:** as today. Optional: if an enemy has missiles and our capital is on the coast, keep 1 Cruiser there as a missile shield.
- **Attack Submarine and Carrier:** as on build-reqs.
- **Ballistic Missile Submarine:**
  - Build only with a Yard V and Conventional or Nuclear Warhead, at war or as a nuclear power. Weight 0.8 when no enemy core province is within 26 hexes of the nation's own cities (the USA, Japan, Australia and Brazil case), else 0.2. At most 1 a nation (2 with 6 or more naval cities).
  - Load at the home yard, ballistic first. Nukes only under aiNuc's existing rules.
  - Wait hidden in a sea zone in range of targets with no enemy ships seen. Fire with the normal missile target scoring, from the sub's spot, then move 1-2 zones away. Go home when empty or under 50% HP.
  - aiYardUp may also climb to IV and V once the Ballistic Missile Sub is researched, not only with Carrier Aviation.
- **Research weights:** Destroyer unlock 1 (x0.3 without a yard). Ballistic Missile Sub unlock 0.6, only for nations far from their targets with Yard IV or more, else 0.1. The Corvette is known from the start.
- The convoy-hit bonus counts any convoy hit. Knowing which ship kind did the raid would need new records in economy.js and S.trade, so it is left out.

## 6. Pictures

**Checking the claim.** Right for the UI portraits, small icons and map stand-ins: the Frigate shows `u-corvette` / `i-corvette` and the Cruiser `u-destroyer` / `i-destroyer` (index.html UART 7364-7368, TMART 7296). Not right for the side views, research card scenes and close-in map top-downs: those already come from their own Gemini sets, `ula-frig` and `ula-crui`, drawn as a frigate and a cruiser.

### Moved, free
- `u-corvette` and `i-corvette` go to the Corvette. `u-destroyer` and `i-destroyer` go to the Destroyer. These are your old Higgsfield pictures. They are the new ships' portraits until their own sets exist, and stay as their map stand-ins while loading (`u-corvette` is turned -90 for top-down use, tools/prep-art.py:390).
- **Portraits from side views (free, code only):** the large xl/xxl portraits of every ship are cut from its own look-1 side view (`ula-<ship>-pic`). All 7 ships then match in style. The Frigate and Cruiser get a correct picture with no new image. Question 9 asks whether the Sub and Carrier should switch too, or keep their Higgsfield portraits.
- **Borrowed until the new pictures exist:** the Ballistic Missile Sub uses `u-submarine` and the `ula-sub` set; the Corvette's and Destroyer's look sets borrow `ula-frig` and `ula-crui`; research scenes borrow `ri-u_frig`, `ri-u_crui`, `ri-u_sub`; Sonar Dip uses `ri-frig_sonar`, Naval Gunnery `ri-t-navgun`, Quiet Patrol `ri-sub_quiet`.

### New pictures (Gemini, tools/gen-art.py)
- 3 look sets, 45 pictures each (5 groups x 3 looks x side / scene / top). Your art rules apply: original generic designs, no ground or water slab under side views, Gemini only flags problems.
  - `ul-corv`: "corvette (a small coastal warship)", low and short, one gun.
  - `ul-dest`: "destroyer (a medium warship)", between frigate and cruiser in size.
  - `ul-ssbn`: "ballistic missile submarine (a long submarine with a row of missile hatches behind the sail)".
- 3 research scenes: `ri-u_corv`, `ri-u_dest`, `ri-u_ssbn`.
- 5 upgrade icons: `ri-corv_asw`, `ri-corv_spd`, `ri-dest_asw`, `ri-dest_amd`, `ri-ssbn_tubes`.

### Gemini cost (from the unit-art-3 log; every logged ship picture was made by batch, at half price)
- A logged ship set costs $1.60-1.67 in pictures, plus $0.08-0.15 for three-way checks. Making it directly (not batch) costs about twice as much.
- **Remakes.** The checks flagged 6-43 pictures in each ship set (Frigate 12, Cruiser 6, Sub 13, Carrier 43), and none were made again. I budget 10-15 remakes a set, $0.4-0.6. The missile sub, with its hatches, will likely be flagged more.

| Plan | 3 sets | 3 scenes + 5 icons | Remakes | **Total** | Balance after (from $15.95 = $24.05 minus the queued $5.9 unit sets and $2.2 recon) |
|---|---|---|---|---|---|
| **Batch, three-way checks (recommended)** | $5.35 | $0.37 | $1.2-1.8 | **about $7 (at most $7.5)** | **about $8.5-9** |
| Batch, single + three-way checks | $5.70 | $0.37 | $1.2-1.8 | about $7.3-7.9 | about $8-8.7 |
| Direct, three-way checks | $10.2 | $0.74 | $2.4-3.6 | about $13-14.5 | **about $1.5-3, below the $5 floor: do not use** |
| Batch, look 1 only (15 pictures a ship) | $1.75 | $0.37 | $0.5-0.6 | about $2.7 | about $13.3 |

No credit is spent until you say OK. The balance guard in gen-art.py (baseline $24.05, $5 floor) still applies.

## 7. Model names (text only)
- **Corvette:** LCS-2 (moved from the Frigate), Project 20380, Type 056A, Visby, K130, Kamorta.
- **Frigate:** FFG-62 replaces LCS-2.
- **Destroyer:** takes the Cruiser's current names, which are real destroyers: DDG-51 Flight III, DDG-1000, Project 956, Type 052D, Type 42, Horizon, Type 45.
- **Cruiser:** CG-47, Project 1144, Project 1164, Type 055.
- **Ballistic Missile Submarine:** SSBN-726, SSBN-826, Project 955, Type 094, Vanguard, Triomphant.

## 8. Places in the code to change (for the build job, not now)
- **data.js:** add corv, dest and ssbn **at the end of UNITS**, because UT (the key order) sets the order of every loop and the golden run. Also UNIT_NICK, UNIT_NAMES, R_LINES, RANGE_KM / RANGE_HIT (corv, dest; not ssbn), LO_AD (dest), BUILD.yard text, vsU on corv, dest and mpa. BASE_LV slots already exist on build-reqs.
- **research.js:** R_VS / multUO accept unit keys (for ASW Rockets and ASW Torpedoes).
- **combat.js:** sea battles and gunfire fill the unit (`u_`) damage channels the way air.js sideAV does; RT_ROLL (:310); the interception code at :113 and :151.
- **state.js:** the written-out UT_ROLL string (build-reqs :481). If it is updated, shipsN (:484) must list corv, dest and ssbn too, or sonar and the stack limit miss them. If it is not updated, the slower loops are used and are correct. KIND_NAME.
- **movement.js:** :174, :534-536, plus the Corvette coastal check in pathing.
- **vision.js:** :97 (Towed Sonar still Frigate only; Sonar Dip for corv), :117 (subs only = every unit is sub or ssbn).
- **economy.js:** :50, :55 (ssbn does not cut convoys). **trade.js:** :19, :332, :340 (ssbn not in TR_SURF or raids; escort x1.25 stays Frigate only).
- **ai.js:** as in section 5.
- **Missiles code (missiles branch):** force launch path, `a.msl`, mslNation and mslHeld counting ship stock and queued loads, the load and move orders, the paused/cancelled load, the ship version of wmdSweep, the reveal timer.
- **index.html:** TMM/TMG, TMART, UART, PICBOX, UICON_D, RANGE_COL, the ART preload list, portraits from side views, the launch card.
- **units3d.js:** MAPB and BUILDERS. Corvette hull about 6.0 long, Destroyer about 8.0, Cruiser stays 8.8. Missile sub: an mSub about 1.3x longer with a raised missile deck behind the sail. Baked m-corv, m-dest, m-ssbn made like m-frig (no image API).
- **Last:** re-record the golden file (tools/golden-12345.txt).

**Order of work:** first Corvette, Destroyer and the vs-subs rule (after build-reqs merges). Then the Ballistic Missile Sub and the Destroyer's missile defence, after the missiles plan 2 code lands.

## 9. Old saves
- Frigate, Cruiser, Sub and Carrier stats do not change, so old fleets play the same.
- The Corvette line is standard. Standard lines are worked out on the fly, so old saves know it with no extra code. The Destroyer and Ballistic Missile Sub lines simply become available, even in a save past their opening day.
- The research count grows (R_STEPS), so a research share shown for an old save drops a little.
- Saved Cruisers keep their stored model name; new ones get cruiser names. The Frigate's LCS-2 becomes FFG-62 for new Frigates only.
- A missing `a.msl` counts as empty. Land missile stock is unchanged.

## 10. Questions for you (my default in brackets)
1. Corvette only in sea zones that touch land? That is 73% of the sea, so it mainly keeps it off the open ocean. [yes; the other choice is anywhere, with defence -1 in open ocean]
2. Use the existing per-unit damage (vsU) for sub hunting: Corvette 2.2x, Destroyer 1.6x, Maritime Patrol Aircraft 2.5x against the new sub too; today's ships unchanged? [yes]
3. Frigate and Cruiser stats stay; only names and portraits change. The Frigate keeps escort x1.25 and Towed Sonar for itself. [yes; the other choice is a bigger Cruiser at $72M, 8/6/22, 108 h]
4. Corvette at $34 (not $30), so it is not the best value ship? [yes; the other choice is $30 with HP 8]
5. Ballistic Missile Sub carries 4 missiles (6 with research): cruise, ballistic, Nuclear Cruise, Nuclear Ballistic, no chemical, at most 1 of each nuclear type a sub. Loads only at an own Naval Yard, which needs no silo. Missiles on board and queued loads count in the nation's limits (still 5 nukes at most). [yes]
6. Fires only when stopped; firing shows it to everyone for 12 h; Quiet Patrol cuts that to 6 h for conventional missiles only. [yes]
7. The sub gives every nation with a Yard V a 26-hex reach from any coast, and sea nukes about day 35-37, before the ICBM (about day 44). Keep plan 2's ranges and timing as they are? [yes, with the 12 h reveal on every nuke as the brake; other choices: sub ballistic range 20 hexes (3,600 km), or nuclear loading only 2 days after Nuclear Warhead]
8. Pictures: 3 full sets by batch with three-way checks, plus 3 scenes and 5 icons, about $7 with remakes, done after the queued unit sets and recon? Or look 1 only, about $2.7? [full sets by batch, only after your OK]
9. Portraits cut by code from each ship's own side view. For all 7 ships (the Sub and Carrier lose their Higgsfield portraits, all ships match), or only the Frigate and Cruiser? [all 7, free]

## Appendix: review points not taken
- **"Under today's code, make the Cruiser 0.8 of a SAM and the Destroyer 0.6."** Not taken: it changes a current ship's stats, which this job keeps fixed. The Destroyer instead gets missile defence only with plan 2, and stays at 0 (like the Cruiser) under today's code.
- **"Record which kind of ship hit each convoy."** Not taken: it needs new records in economy.js and the trade state for a small gain. The Corvette weight uses any convoy hit plus the enemy's sub share instead.
- **"Cut the Corvette's HP to 8."** Not taken as the default (the price goes to $34 instead, keeping it able to survive a little). It is offered as the other choice in question 4.
- **"Open nuclear loading only 2 days after Nuclear Warhead"** and a shorter sea range: not made the default; offered in question 7 so you choose.
