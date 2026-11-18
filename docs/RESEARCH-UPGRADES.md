# Research upgrades: review

**Status: review only. Nothing in the game has changed.** Written 18 November 2026 from the owner's brief (three points: upgrades apply at once to every unit, the upgrade list compared with Conflict of Nations, faster mobilization only on each line's final level). Waiting for the owner's answers in section 5.

Compatible with `docs/DOCTRINES.md` (nation groups with their own unit names and looks): this review is about what each upgrade *does*, not what it is called, so a group's unit name changes nothing here. The doctrines' training speed bonuses (China 25% faster, Eastern 15% faster) multiply with the final-level bonus of section 3.

**About the Conflict of Nations data.** constacks.com (and the CoN wiki, conflictofnations.wiki.gg) could not be reached from this session: the network does not allow those sites. Every CoN statement below comes from general knowledge of the game and is marked *unverified*. It describes what CoN's levels improve, not their exact numbers. To check the numbers, allow constacks.com in the session's network settings and ask for a second pass.

---

## 1. How upgrades apply today, and the gaps

### 1.1 What already works

A unit's stats are not stored on the unit. Every rule asks for them by the owner and the unit type, and the answer is worked out from the nation's research (`st(o, t, k)`, `rules/state.js:318-335`; the cache is keyed on `N.tv`, which every finished research step bumps in `rGrant`, `rules/research.js:45`). So a finished upgrade reaches every unit of that type at once, wherever it is:

| Where the unit is | Gets the new stats at once? | Why |
|---|---|---|
| On the map (any force) | **yes** | attack, defence and speed are read every battle step and every hour (`rules/tick.js:158`, `rules/tick.js:45`) |
| Wounded | **yes** | extra health counts as less damage taken (`hurt`, `rules/combat.js:340`): a wounded unit gets tougher at once, but it is not healed for free |
| In a queue | **yes, when it comes out** | a queue item holds only the type and the hours left (`rules/production.js:74`), so it is built with the stats of the day it finishes |
| Embarked at sea | **yes** | troops at sea stay in their own force with the same owner; at sea they move at the transport speed (`SEA_SPEED`, `rules/movement.js:3`), by design |
| Air wings on a carrier, or flying a mission | **yes** | same owner, same lookup; carrier repairs read the level live (`rDeckRate`, `rules/air.js:39`) |
| Sight, range and the worded upgrades | **yes** | each reads the owner's level when it is used (`rSightF`, `rRangeKm`, `multO` and the others in `rules/research.js:51-90`); what each side sees is worked out again every hour (`rules/tick.js:71`) |
| Computer players | **yes** | there is no separate path for them: they research with `startResearch` (`rules/ai.js:422`, `:437`), finish in the same `researchSlotHour`, and their units read the same `st()` |

**Quick headless check** (classic world, seed 12345, after two days of play, computer nation 0): its fielded tank force went from attack 6, defence 4, health 14 to attack 8.75, defence 5, health 18 the moment Firepower 2, Third-Generation MBT and Turbine Engines were granted; an Anti-Tank Infantry force's sight went from 50 km to 75 km with Thermal Sights.

### 1.2 Gaps found (not fixed: review only)

| # | Gap | Where | Effect |
|---|---|---|---|
| G1 | **Aircraft speed upgrades do nothing.** Fourth-Generation Interceptor says "speed +2" and Supersonic Bomber "speed +3", but aircraft fly at a fixed `AIR_SPEED` times a per-type share and never read the speed stat. The stats card shows the same fixed number | `rules/data.js:260`, `rules/data.js:286`; `wingSpd` in `rules/air.js:25`; `rules/combat.js:147` | no aircraft, fielded or new, ever flies faster |
| G2 | **Bigger Salvo does not reach drones already fielded.** It adds two drones only to cards built afterwards (`rPack` in `spawn`); a fielded card keeps six drones but is now counted as 6/8 of a card | `rules/production.js:87`, `rules/combat.js:29`, `rules/research.js:67` | existing swarm cards get nothing (moot if Bigger Salvo is replaced, section 2) |
| G3 | **Queued units keep the training time worked out when they were ordered.** Rapid Mobilisation does not shorten units already in a queue | `recruit`, `rules/production.js:74` (with `trainH`, `:65`) | test: an infantry order at 17 h stayed 17 h after Rapid Mobilisation 2; a new order took 12 h. Matters for the final-level bonus (section 3) |
| G4 | **A walk or sail inside one province keeps the speed it was ordered with** (its hours are fixed when it starts) | `orderSpot` `rules/movement.js:359`, `legCross` `:382`, `sailTo` `:408` | a speed upgrade reaches it only on the next leg (a few hours at most) |
| G5 | The computer counts its queued swarm cards as six drones each, not eight | `rules/ai.js:394` (`UNITS[t].pack` instead of `rPack`) | small miscount after Bigger Salvo (moot if it is replaced) |
| G6 | **No test checks it.** `.test/v4research.js` tests the research screen; nothing checks that fielded, queued, embarked, carrier-borne and computer-owned units get a finished upgrade | `.test/v4research.js` | the owner asked for the tests to be updated |

**Suggested tests for the build** (one plain Node file, like `tools/headless.js`): for a player nation and a computer nation, grant one step of each kind (Firepower, Protection, a generation with health, a speed upgrade, a sight upgrade, a range upgrade) and check the new value at once on: a force on land, a force embarked at sea, a wing based on a carrier, a wing in flight, a unit coming out of a queue started before the research ended, and a wounded unit. Plus G1 (an aircraft flies faster after a speed upgrade) and G3 (the final-level bonus shortens queued units).

---

## 2. Every upgrade, by unit line

How to read the tables:

- **✓** improves the unit itself: health, attack (in all or against one kind of target), defence, speed, sight, range, or a new combat ability.
- **✗** does not improve the unit itself: faster or cheaper training, upkeep, logistics, or repairing other units.
- Every line has **Firepower 1-3** and **Protection 1-3** (the old Marks): attack or defence +12%, +25%, +40% in all, against every kind of target. They are listed once per line with their three days.
- The unlock of a unit is not an upgrade and is not listed.
- Numbers are in our own scale (base infantry: attack 3, defence 3, health 10, speed 4).

**Result: 249 research steps in the 25 unit lines. Only 3 upgrades (5 levels) are ✗:** Rapid Mobilisation (Motorized Infantry, 2 levels), Bigger Salvo (Swarm Drones, 1 level), Flight-Deck Crews (Aircraft Carrier, 2 levels). Each has a suggested replacement that keeps its days, prices and place in the tree. Outside the unit lines one more is ✗: Combat Engineers (Command & Logistics, section 2.26).

**The main difference from CoN (unverified).** In CoN a unit's level is one step that raises several things together: hit points, attack against each target type (unarmoured, light armour, heavy armour, aircraft, helicopters, ships, submarines, buildings) and defence, with range or sight on some units and an ability at some levels. Faster mobilization comes from buildings (Army Base, Recruiting Office, Airbase, Naval Base), never from unit research. Ours splits the same ground into Firepower (attack against everything), Protection (defence against everything), named upgrades and generations; **health rises only with generations**. That is fine as a design, and the ✗ list is short. One option, not part of this proposal: let each Protection level add a little health (+1) so health grows more like CoN's.

### 2.1 Motorized Infantry (`inf`)

Base: attack 3, defence 3, health 10, speed 4. Unlock: standard issue (day 1). Final level: **Assault Infantry** (day 17).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 1 | Ceramic Body Armour (`inf_armor`) | - | defense +1 | ✓ defence |
| 3 / 10 / 16 | Firepower (`inf_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 4 / 11 / 17 | Protection (`inf_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 5 | Rapid Mobilisation (`inf_build`) | 1 | trains 15% faster | **✗** faster training |
| 6 | Rough-Ground Drills (`inf_terr`) | 1 | half the speed penalty in forest and hills | ✓ speed on rough ground |
| 9 | Generation: Mechanized Infantry (`inf_g2`) | - | attack +2, speed +1, health +2 | ✓ attack, speed, health |
| 12 | Rough-Ground Drills (`inf_terr`) | 2 | and in mountains and jungle | ✓ speed on rough ground |
| 14 | Rapid Mobilisation (`inf_build`) | 2 | trains 30% faster | **✗** faster training |
| 17 | Generation: Assault Infantry (`inf_g3`) | - | attack +1, defense +1, health +2 | ✓ attack, defence, health |

*CoN (unverified):* CoN Motorized Infantry: every level raises hit points and attack vs unarmoured and light-armoured targets together; no level speeds up training.

**Suggested replacement.** Replace Rapid Mobilisation with **Infantry Kit** (`inf_kit`), same days, prices and icon slot:

- level 1 (day 5): **health +2** (10 to 12)
- level 2 (day 14): **light anti-tank and anti-air missiles**: damage to armour 0.5x to 0.7x, damage to aircraft 0.2x to 0.35x (still far below Anti-Tank Infantry 3.5x and a SAM 3x)

### 2.2 Anti-Tank Infantry (`at`)

Base: attack 3, defence 3, health 9, speed 4. Unlock: standard issue (day 1). Final level: **Protection 3** (day 17).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 1 | Ceramic Body Armour (`at_armor`) | - | defense +1 | ✓ defence |
| 3 / 10 / 16 | Firepower (`at_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 4 / 11 / 17 | Protection (`at_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 5 | Tandem Warheads (`at_warhead`) | 1 | attack +1 | ✓ attack |
| 8 | Thermal Sights (`at_eye`) | - | sees 50% farther | ✓ sight |
| 11 | Tandem Warheads (`at_warhead`) | 2 | attack +1 more | ✓ attack |
| 12 | Generation: Guided Missile Teams (`at_g2`) | - | attack +1, health +2, damage to armor 3.5x to 4x | ✓ health, attack, attack vs armour |

*CoN (unverified):* No exact CoN unit; closest is the Tank Destroyer: levels raise hit points and attack vs armour.

### 2.3 Special Forces (`spec`)

Base: attack 5, defence 4, health 10, speed 5. Unlock: day 4. Final level: **Protection 3** (day 20).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 6 / 13 / 19 | Firepower (`spec_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 7 / 14 / 20 | Protection (`spec_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 7 | Mountain & Arctic Training (`spec_terr`) | 1 | rough-terrain attack bonus 40% to 50% | ✓ attack in rough terrain |
| 8 | Night Optics (`spec_eye`) | - | sees 50% farther | ✓ sight |
| 10 | Air-Transportable (`spec_airlift`) | - | can be air-dropped from an airbase province, up to 6 hexes | ✓ new ability (air-drop) |
| 13 | Mountain & Arctic Training (`spec_terr`) | 2 | to 60% | ✓ attack in rough terrain |
| 16 | Generation: Tier-One Operators (`spec_g2`) | - | attack +2, defense +1, health +2 | ✓ attack, defence, health |

*CoN (unverified):* CoN Special Forces: levels raise hit points and attack; their terrain abilities come with the unit, not as research.

### 2.4 Infantry Fighting Vehicle (`ifv`)

Base: attack 4, defence 4, health 12, speed 7. Unlock: day 1. Final level: **Protection 3** (day 17).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 3 / 10 / 16 | Firepower (`ifv_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 4 / 11 / 17 | Protection (`ifv_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 5 | 30 mm Autocannon (`ifv_gun`) | - | attack +2 | ✓ attack |
| 8 | Uprated Powerpack (`ifv_spd`) | - | speed +1 | ✓ speed |
| 10 | Amphibious Kit (`ifv_terr`) | - | no penalty for attacking across a river | ✓ attack across rivers |
| 13 | Generation: Heavy IFV (`ifv_g2`) | - | attack +1, defense +1, health +3 | ✓ attack, defence, health |

*CoN (unverified):* CoN Armoured Fighting Vehicle: levels raise hit points and attack vs unarmoured and light armour.

### 2.5 Main Battle Tank (`tank`)

Base: attack 6, defence 4, health 14, speed 6. Unlock: standard issue (day 1). Final level: **Next-Generation MBT** (day 22).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 1 | Composite Armour (`tank_armor`) | - | defense +2 | ✓ defence |
| 3 / 10 / 17 | Firepower (`tank_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 4 / 11 / 18 | Protection (`tank_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 7 | Smoothbore Main Gun (`tank_gun`) | - | attack +3 | ✓ attack |
| 9 | Wide Tracks (`tank_terr`) | - | half the speed penalty on rough ground | ✓ speed on rough ground |
| 11 | Turbine Engines (`tank_eng`) | - | speed +2, attack +1 | ✓ speed, attack |
| 14 | Generation: Third-Generation MBT (`tank_g2`) | - | defense +1, health +4 | ✓ defence, health |
| 22 | Generation: Next-Generation MBT (`tank_g3`) | - | attack +2, defense +1, health +3 | ✓ attack, defence, health |

*CoN (unverified):* CoN Main Battle Tank: levels raise hit points, attack vs armour and defence; speed and sight stay the same.

### 2.6 Mobile Artillery (`art`)

Base: attack 7, defence 3, health 9, speed 3. Unlock: standard issue (day 1). Final level: **Protection 3** (day 19).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 1 | Counter-Battery Radar (`art_radar`) | - | attack +2 | ✓ attack |
| 3 / 10 / 18 | Firepower (`art_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 4 / 11 / 19 | Protection (`art_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 8 | Extended-Range Shells (`art_shell`) | - | attack +3, defense +2 | ✓ attack, defence |
| 13 | Guided Shells (`art_guided`) | - | attack +2, speed +1 | ✓ attack, speed |
| 15 | Generation: Long-Barrel Howitzer (`art_g2`) | - | attack +1, health +3 | ✓ attack, health |

*CoN (unverified):* CoN Mobile Artillery: levels raise attack and hit points; attack range grows at the higher levels.

### 2.7 Rocket Artillery (`mlrs`)

Base: attack 8, defence 2, health 9, speed 7. Unlock: day 5. Final level: **Protection 3** (day 21).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 7 / 14 / 20 | Firepower (`mlrs_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 8 / 15 / 21 | Protection (`mlrs_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 9 | Rapid Reload (`mlrs_reload`) | - | attack +2 | ✓ attack |
| 12 | Extended-Range Rockets (`mlrs_rng`) | - | range 150 to 200 km | ✓ attack range |
| 16 | Generation: Guided Rocket System (`mlrs_g2`) | - | attack +2, health +2, damage to armor 0.9x to 1.2x | ✓ health, attack, attack vs armour |

*CoN (unverified):* CoN Multiple Rocket Launcher: levels raise attack; attack range grows at the higher levels.

### 2.8 Mobile SAM (`sam`)

Base: attack 5, defence 2, health 8, speed 4. Unlock: standard issue (day 1). Final level: **Protection 3** (day 17).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 3 / 10 / 16 | Firepower (`sam_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 4 / 11 / 17 | Protection (`sam_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 4 | Improved Seekers (`sam_seek`) | 1 | attack +1 | ✓ attack |
| 7 | Shoot-and-Scoot (`sam_spd`) | - | speed +1, defense +1 | ✓ speed, defence |
| 10 | Improved Seekers (`sam_seek`) | 2 | attack +1 more | ✓ attack |
| 13 | Generation: Long-Range SAM (`sam_g2`) | - | attack +2, health +2, covers neighbouring provinces at full strength | ✓ health, attack, coverage |

*CoN (unverified):* CoN Mobile SAM Launcher: levels raise attack vs aircraft and hit points; later levels also shoot down missiles.

### 2.9 Mobile Jammer (`jam`)

Base: attack 1, defence 2, health 7, speed 5. Unlock: day 3. Final level: **Protection 3** (day 20).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 5 / 12 / 19 | Firepower (`jam_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 6 / 13 / 20 | Protection (`jam_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 7 | Wideband Jamming (`jam_band`) | 1 | downs and jams 20% more drones | ✓ attack vs drones |
| 13 | Wideband Jamming (`jam_band`) | 2 | 40% more | ✓ attack vs drones |
| 16 | Generation: Counter-UAV Laser (`jam_g2`) | - | attack +2, defense +1, health +2 | ✓ attack, defence, health |

*CoN (unverified):* No CoN unit like it (CoN counters drones with its anti-air units).

### 2.10 Attack Helicopter (`heli`)

Base: attack 7, defence 4, health 10. Unlock: day 1. Final level: **Protection 3** (day 18).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 3 / 10 / 17 | Firepower (`heli_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 4 / 11 / 18 | Protection (`heli_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 6 | Long-Range Tanks (`heli_rng`) | 1 | range +1 hex (7) | ✓ range |
| 8 | Fire-and-Forget Missiles (`heli_atgm`) | - | attack +1 | ✓ attack |
| 12 | Long-Range Tanks (`heli_rng`) | 2 | range +1 more (8) | ✓ range |
| 14 | Generation: Heavy Gunship (`heli_g2`) | - | attack +2, defense +1, health +3 | ✓ attack, defence, health |

*CoN (unverified):* CoN Attack Helicopter: levels raise hit points and attack vs armour.

### 2.11 Paratroopers (`para`)

Base: attack 4, defence 3, health 10, speed 4. Unlock: day 3. Final level: **Protection 3** (day 19).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 5 / 12 / 18 | Firepower (`para_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 6 / 13 / 19 | Protection (`para_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 7 | Long-Range Airlift (`para_airlift`) | 1 | drop range 9 to 11 hexes | ✓ range (drop range) |
| 13 | Long-Range Airlift (`para_airlift`) | 2 | to 13 hexes | ✓ range (drop range) |
| 15 | Generation: Air Assault Brigade (`para_g2`) | - | attack +1, defense +1, health +2 | ✓ attack, defence, health |

*CoN (unverified):* CoN Airborne Infantry: levels raise hit points and attack; the air-drop comes with the unit.

### 2.12 Interceptor (`int`)

Base: attack 6, defence 4, health 9. Unlock: day 1. Final level: **Protection 3** (day 17).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 3 / 10 / 16 | Firepower (`int_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 4 / 11 / 17 | Protection (`int_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 5 | Radar-Guided Missiles (`int_msl`) | - | attack +2 | ✓ attack |
| 7 | Drop Tanks (`int_rng`) | 1 | range +1 hex | ✓ range |
| 12 | Generation: Fourth-Generation Interceptor (`int_g2`) | - | attack +1, defense +1, health +2, speed +2 | ✓ health, attack, defence (the speed +2 does nothing today: gap G1) |
| 13 | Drop Tanks (`int_rng`) | 2 | range +1 more | ✓ range |

*CoN (unverified):* CoN Air Superiority Fighter: levels raise attack vs aircraft and hit points; range grows at later levels.

### 2.13 Strike Fighter (`jet`)

Base: attack 8, defence 3, health 9. Unlock: day 1. Final level: **Protection 3** (day 18).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 3 / 10 / 17 | Firepower (`jet_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 4 / 11 / 18 | Protection (`jet_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 5 | Precision Munitions (`jet_pgm`) | - | attack +2 | ✓ attack |
| 7 | Drop Tanks (`jet_rng`) | 1 | range +1 hex | ✓ range |
| 10 | Stealth Airframes (`jet_lo`) | - | defense +3; with the Strategic Bomber Upgrade it opens the Stealth Bomber | ✓ defence |
| 13 | Drop Tanks (`jet_rng`) | 2 | range +1 more | ✓ range |
| 14 | Generation: Multirole Strike Fighter (`jet_g2`) | - | attack +2, health +2, damage to armor 1.6x to 1.8x | ✓ health, attack, attack vs armour |

*CoN (unverified):* CoN Strike Fighter: levels raise attack vs ground and ships and hit points; range grows at later levels.

### 2.14 Air Superiority Fighter (`asf`)

Base: attack 9, defence 5, health 10. Unlock: day 4. Final level: **Protection 3** (day 21).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 6 / 13 / 20 | Firepower (`asf_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 7 / 14 / 21 | Protection (`asf_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 8 | Drop Tanks (`asf_rng`) | 1 | range +1 hex | ✓ range |
| 10 | Look-Down Radar (`asf_radar`) | - | attack +1 | ✓ attack |
| 14 | Drop Tanks (`asf_rng`) | 2 | range +1 more | ✓ range |
| 17 | Generation: Fifth-Generation Fighter (`asf_g2`) | - | attack +2, defense +2, health +2 | ✓ attack, defence, health |

*CoN (unverified):* CoN Stealth Air Superiority Fighter: stealth from the start; levels raise attack vs aircraft and hit points.

### 2.15 Recon UAV (`drone`)

Base: attack 0, defence 1, health 4. Unlock: day 1. Final level: **UAV V · Hunter-Killer** (day 18).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 3 / 10 / 16 | Firepower (`drone_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 4 / 11 / 17 | Protection (`drone_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 5 | Generation: UAV II · Long-Endurance Optics (`drone_g2`) | - | sees farther, loiters 16 h, reaches farther, harder to shoot down | ✓ sight, range, loiter, defence |
| 9 | Generation: UAV III · Low-Observable Airframe (`drone_g3`) | - | loiters 20 h, wider view, air defences hit 40% less | ✓ sight, loiter, defence |
| 13 | Generation: UAV IV · Armed UAV (`drone_g4`) | - | light missiles: one salvo per sortie | ✓ attack (new) |
| 18 | Generation: UAV V · Hunter-Killer (`drone_g5`) | - | two salvos, heavier missiles, longer range and loiter | ✓ attack, defence, range |

*CoN (unverified):* CoN UAV: levels raise view range and hit points.

### 2.16 Swarm Drones (`swarm`)

Base: attack 1.6, defence 0.5, health 2. Unlock: day 4. Final level: **Protection 3** (day 20).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 6 / 13 / 19 | Firepower (`swarm_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 7 / 14 / 20 | Protection (`swarm_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 8 | Booster Rockets (`swarm_rng`) | 1 | range +1 hex | ✓ range |
| 9 | Bigger Salvo (`swarm_pack`) | - | eight drones per card (was six), same price | **✗** more drones for the same price (cheaper training) |
| 14 | Booster Rockets (`swarm_rng`) | 2 | range +1 more | ✓ range |
| 15 | Generation: Networked Swarm (`swarm_g2`) | - | attack +0.6, health +1, damage to armor 0.35x to 0.6x | ✓ health, attack, attack vs armour |

*CoN (unverified):* No direct CoN equivalent.

**Suggested replacement.** Replace Bigger Salvo with **Thermobaric Warheads** (`swarm_tb`), same day and price:

- one level (day 9): **attack +0.2, health +0.4** (1.6 to 1.8, 2 to 2.4). A card stays six drones. Fighting value per card about +31%, the same as the old +33% from eight drones

### 2.17 Strike Drone (`sdrone`)

Base: attack 5, defence 1, health 5. Unlock: day 6. Final level: **Protection 3** (day 22).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 8 / 15 / 21 | Firepower (`sdrone_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 9 / 16 / 22 | Protection (`sdrone_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 10 | Satellite Link (`sdrone_rng`) | 1 | range +2 hexes | ✓ range |
| 12 | Bunker-Buster Warhead (`sdrone_hit`) | - | knocks a building out for 36 h (was 24 h) | ✓ attack vs buildings |
| 15 | Satellite Link (`sdrone_rng`) | 2 | range +2 more | ✓ range |
| 17 | Generation: Low-Observable Strike Drone (`sdrone_g2`) | - | attack +2, health +2, air defences hit 30% less | ✓ health, attack, harder to hit |

*CoN (unverified):* No direct CoN equivalent.

### 2.18 Heavy Bomber (`bomb`)

Base: attack 10, defence 2, health 14. Unlock: day 6. Final level: **Protection 3** (day 22).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 8 / 15 / 21 | Firepower (`bomb_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 9 / 16 / 22 | Protection (`bomb_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 9 | Defensive Jammers (`bomb_ecm`) | - | defense +2 | ✓ defence |
| 11 | Strategic Bomber Upgrade (`bomb_up`) | - | range +4 hexes (+720 km), attack +1; with Stealth Airframes it opens the Stealth Bomber | ✓ range, attack |
| 17 | Generation: Supersonic Bomber (`bomb_g2`) | - | attack +2, health +3, speed +3 | ✓ health, attack (the speed +3 does nothing today: gap G1) |

*CoN (unverified):* CoN Heavy Bomber: levels raise attack vs ground and buildings, hit points and range.

### 2.19 Stealth Bomber (`stealth`)

Base: attack 8, defence 4, health 12. Unlock: day 14. Final level: **Protection 3** (day 30).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 16 / 23 / 29 | Firepower (`stealth_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 17 / 24 / 30 | Protection (`stealth_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 19 | Enlarged Bomb Bay (`stealth_bay`) | - | bomb load 60% to 75% of a Heavy Bomber’s | ✓ attack vs buildings |
| 21 | Flying-Wing Tanks (`stealth_rng`) | - | range +4 hexes | ✓ range |

*CoN (unverified):* CoN Stealth Bomber: stealth from the start; levels raise attack and hit points.

### 2.20 Maritime Patrol Aircraft (`mpa`)

Base: attack 6, defence 2, health 10. Unlock: day 2. Final level: **Protection 3** (day 19).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 4 / 11 / 18 | Firepower (`mpa_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 5 / 12 / 19 | Protection (`mpa_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 8 | Sonobuoy Field (`mpa_sonar`) | 1 | detection radius +20% | ✓ sight (detection) |
| 10 | Homing Torpedoes (`mpa_torp`) | - | attack +2 | ✓ attack |
| 14 | Sonobuoy Field (`mpa_sonar`) | 2 | +40% | ✓ sight (detection) |
| 15 | Generation: Long-Endurance Patrol Aircraft (`mpa_g2`) | - | attack +1, health +2, patrols 18 h (was 12 h) | ✓ health, attack, patrol time |

*CoN (unverified):* CoN Naval Patrol Aircraft: levels raise attack vs submarines and ships and the detection range.

### 2.21 AWACS (`awacs`)

Base: attack 0, defence 2, health 10. Unlock: day 5. Final level: **Protection 3** (day 21).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 8 / 15 / 21 | Protection (`awacs_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 9 | High-Power Radar (`awacs_radar`) | 1 | radar radius +15% | ✓ sight (radar) |
| 12 | Fighter Data Link (`awacs_link`) | - | fighters under it fight 35% better (was 25%) | ✓ what it does for fighters under it (its role, not its own stats) |
| 15 | High-Power Radar (`awacs_radar`) | 2 | +30% | ✓ sight (radar) |
| 17 | Generation: Phased-Array AWACS (`awacs_g2`) | - | defense +1, health +2, identifies forces within half its radius | ✓ health, defence, identification |

*CoN (unverified):* CoN AWACS: levels raise view range and hit points.

### 2.22 Frigate (`frig`)

Base: attack 4, defence 5, health 14, speed 6. Unlock: standard issue (day 1). Final level: **Protection 3** (day 18).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 1 | Naval Gunnery (`frig_gun`) | - | attack +1 | ✓ attack |
| 3 / 10 / 17 | Firepower (`frig_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 4 / 11 / 18 | Protection (`frig_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 6 | Towed Sonar (`frig_sonar`) | - | hears submarines two sea zones away | ✓ sight (submarines) |
| 9 | Area Air Defence (`frig_aa`) | - | defense +1, damage to aircraft 1.8x to 2.1x | ✓ defence, attack vs aircraft |
| 14 | Generation: Guided-Missile Frigate (`frig_g2`) | - | attack +2, defense +1, health +3 | ✓ attack, defence, health |

*CoN (unverified):* CoN Frigate: levels raise anti-air attack and hit points; later levels shoot down missiles.

### 2.23 Cruiser (`crui`)

Base: attack 7, defence 6, health 20, speed 5.8. Unlock: standard issue (day 1). Final level: **Protection 3** (day 19).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 3 / 10 / 18 | Firepower (`crui_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 3 | Naval Gunnery (`crui_gun`) | - | attack +2 | ✓ attack |
| 4 / 11 / 19 | Protection (`crui_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 11 | Long-Range Bombardment (`crui_rng`) | - | coastal bombardment 30% stronger | ✓ attack vs land targets from the sea |
| 15 | Generation: Missile Cruiser (`crui_g2`) | - | attack +2, health +4 | ✓ attack, health |

*CoN (unverified):* CoN Cruiser: levels raise attack vs ships and land, hit points and anti-air.

### 2.24 Aircraft Carrier (`carr`)

Base: attack 3, defence 6, health 26, speed 5. Unlock: day 7. Final level: **Protection 3** (day 23).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 9 / 16 / 22 | Firepower (`carr_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 10 / 17 / 23 | Protection (`carr_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 11 | Flight-Deck Crews (`carr_deck`) | 1 | wings aboard repair 25% a day (was 20%) | **✗** repairs other units (upkeep / logistics) |
| 13 | Nuclear Propulsion (`carr_spd`) | - | speed +0.8 | ✓ speed |
| 16 | Flight-Deck Crews (`carr_deck`) | 2 | 30% a day | **✗** repairs other units (upkeep / logistics) |
| 18 | Generation: Supercarrier (`carr_g2`) | - | defense +2, health +6 | ✓ defence, health |

*CoN (unverified):* CoN Aircraft Carrier: levels raise hit points and defence (and how many aircraft it carries).

**Suggested replacement.** Replace Flight-Deck Crews with **Close-In Defence** (`carr_ciws`), same days and prices:

- level 1 (day 11): **defence +1** (6 to 7)
- level 2 (day 16): **damage to aircraft 1.4x to 1.8x** (point-defence guns and missiles)
- wings aboard keep repairing at 20% a day (the base rate)

### 2.25 Attack Submarine (`sub`)

Base: attack 6, defence 2, health 9, speed 5.4. Unlock: standard issue (day 1). Final level: **Protection 3** (day 18).

| Day | Node (id) | Level | What it does | Mark |
|---|---|---|---|---|
| 2 | Heavy Torpedoes (`sub_torp`) | 1 | attack +1 | ✓ attack |
| 3 / 10 / 17 | Firepower (`sub_fp`) | 1-3 | attack +12% / +25% / +40% vs every target | ✓ attack |
| 4 / 11 / 18 | Protection (`sub_pr`) | 1-3 | defence +12% / +25% / +40% vs every attacker | ✓ defence |
| 7 | Quiet Drive (`sub_quiet`) | 1 | defense +1 | ✓ defence |
| 10 | Heavy Torpedoes (`sub_torp`) | 2 | attack +1 more | ✓ attack |
| 13 | Quiet Drive (`sub_quiet`) | 2 | defense +1 more | ✓ defence |
| 14 | Generation: Nuclear Attack Submarine (`sub_g2`) | - | attack +1, health +3, speed +1.2 | ✓ attack, health, speed |

*CoN (unverified):* CoN Attack Submarine: levels raise attack vs ships and submarines and hit points; it stays hidden.

### 2.26 Outside the unit lines: missiles, satellites, Command & Logistics

These are nation-wide, not one unit type's upgrades. Listed for completeness.

| Day | Node (id) | Levels | What it does | Mark |
|---|---|---|---|---|
| 7 / 13 | Cruise Missile Range (`cm_rng`) | 2 | range 28 to 32 to 36 hexes | ✓ range (the missile) |
| 9 / 15 | Cruise Missile Speed (`cm_spd`) | 2 | speed 9 to 11 to 13 | ✓ speed (the missile) |
| 11 / 17 | Ballistic Missile Range (`bm_rng`) | 2 | range 90 to 102 to 114 hexes | ✓ range (the missile) |
| 14 | Heavier Warhead (`bm_pow`) | 1 | power 16 to 19 | ✓ attack (the missile) |
| 9 / 15 / 21 | Anti-Missile Shield (`msl3`) | 3 | SAMs and Frigates intercept missiles 2x / 2.5x / 3x as well | ✓ attack vs missiles (SAM, Frigate) |
| 5 / 11 / 17 | Reconnaissance Satellites (`sat1`) | 3 | up to 3 / 4 / 5 satellites, wider swath at 3 | n/a (a capability, not a unit) |
| 1 / 10 | Motorized Supply (`log1`) | 2 | all forces move 20% / 30% faster; opens high-speed rail | ✓ speed (every unit) |
| 2 / 11 | Combat Engineers (`log2`) | 2 | troops embark 30% / 40% faster; forts half price; roads and railways 25% / 35% cheaper and faster | **✗** logistics and building costs |
| 3 / 12 | Amphibious Doctrine (`nav3`) | 2 | landings take half the time; first day ashore at 90% / 100% strength (was 67%) | ✓ attack and defence on landing (the landing time is logistics) |
| 4 / 13 | Field Hospitals (`log3`) | 2 | all forces take 15% / 20% less damage | ✓ health (every unit, as less damage) |

**Combat Engineers: suggested answer, keep it.** It is the logistics doctrine of the tree, not a unit line, and the brief was about unit lines. If the owner wants it replaced anyway: level 1 "ground forces dig in after 6 hours instead of 12", level 2 "and also in provinces they do not own" (the dug-in bonus itself, +10% defence, stays the owner's rule).

---

## 3. Faster mobilization: only on each line's final level

**Rule (suggested):** there is no research node for faster training any more. The **final level of every unit line** gives, on top of its own stat upgrade, **"trains 15% faster"** for that unit type (training time x0.85), in every building that trains it, for every nation, players and computers alike. The final level is the line's last research step by day; when two steps share the last day, the generation.

It applies the way upgrades do (section 1): units already in a queue have their remaining hours cut by 15% the moment the research ends (gap G3 must be fixed for this), and every later order uses the shorter time.

| Unit line | Final level (id) | Day | Its own upgrade | Base training time |
|---|---|---|---|---|
| Motorized Infantry | Assault Infantry (`inf_g3`) | 17 | attack +1, defence +1, health +2 | 24 h to 20 h |
| Anti-Tank Infantry | Protection 3 (`at_pr`) | 17 | defence +40% in all | 30 h to 26 h |
| Special Forces | Protection 3 (`spec_pr`) | 20 | defence +40% in all | 42 h to 36 h |
| Infantry Fighting Vehicle | Protection 3 (`ifv_pr`) | 17 | defence +40% in all | 36 h to 31 h |
| Main Battle Tank | Next-Generation MBT (`tank_g3`) | 22 | attack +2, defence +1, health +3 | 48 h to 41 h |
| Mobile Artillery | Protection 3 (`art_pr`) | 19 | defence +40% in all | 48 h to 41 h |
| Rocket Artillery | Protection 3 (`mlrs_pr`) | 21 | defence +40% in all | 54 h to 46 h |
| Mobile SAM | Protection 3 (`sam_pr`) | 17 | defence +40% in all | 48 h to 41 h |
| Mobile Jammer | Protection 3 (`jam_pr`) | 20 | defence +40% in all | 30 h to 26 h |
| Attack Helicopter | Protection 3 (`heli_pr`) | 18 | defence +40% in all | 54 h to 46 h |
| Paratroopers | Protection 3 (`para_pr`) | 19 | defence +40% in all | 36 h to 31 h |
| Interceptor | Protection 3 (`int_pr`) | 17 | defence +40% in all | 60 h to 51 h |
| Strike Fighter | Protection 3 (`jet_pr`) | 18 | defence +40% in all | 72 h to 61 h |
| Air Superiority Fighter | Protection 3 (`asf_pr`) | 21 | defence +40% in all | 72 h to 61 h |
| Recon UAV | UAV V · Hunter-Killer (`drone_g5`) | 18 | two salvos, heavier missiles, longer range and loiter | 30 h to 26 h |
| Swarm Drones | Protection 3 (`swarm_pr`) | 20 | defence +40% in all | 30 h to 26 h |
| Strike Drone | Protection 3 (`sdrone_pr`) | 22 | defence +40% in all | 42 h to 36 h |
| Heavy Bomber | Protection 3 (`bomb_pr`) | 22 | defence +40% in all | 96 h to 82 h |
| Stealth Bomber | Protection 3 (`stealth_pr`) | 30 | defence +40% in all | 168 h to 143 h |
| Maritime Patrol Aircraft | Protection 3 (`mpa_pr`) | 19 | defence +40% in all | 66 h to 56 h |
| AWACS | Protection 3 (`awacs_pr`) | 21 | defence +40% in all | 72 h to 61 h |
| Frigate | Protection 3 (`frig_pr`) | 18 | defence +40% in all | 60 h to 51 h |
| Cruiser | Protection 3 (`crui_pr`) | 19 | defence +40% in all | 96 h to 82 h |
| Aircraft Carrier | Protection 3 (`carr_pr`) | 23 | defence +40% in all | 120 h to 102 h |
| Attack Submarine | Protection 3 (`sub_pr`) | 18 | defence +40% in all | 60 h to 51 h |

(Base training time is before buildings; Army Base, Airbase, Naval Yard and doctrine factors still multiply.) The card text of each final level gets a second line: "and trains 15% faster".

---

## 4. Summary of the changes and their balance effect (estimates)

| Change | Who it affects | Estimated effect |
|---|---|---|
| Rapid Mobilisation becomes **Infantry Kit** (health +2; then damage to armour 0.5x to 0.7x, to aircraft 0.2x to 0.35x) | Motorized Infantry | each infantry unit about +14% fighting value at the end of the line (health 14 to 16) and a real answer to light raids by armour and helicopters; but no faster training until day 17, then 15% instead of 30%. Fewer, tougher infantry: slightly slower early expansion for infantry-heavy nations (most computer nations) |
| Bigger Salvo becomes **Thermobaric Warheads** (attack +0.2, health +0.4) | Swarm Drones | about +31% fighting value per card, close to the old +33% (eight drones for six); stack limits count cards, so no change there. Fixes G2 and G5 by removing them |
| Flight-Deck Crews becomes **Close-In Defence** (defence +1; damage to aircraft 1.4x to 1.8x) | Aircraft Carrier | about 9% less damage taken and 29% more damage to aircraft; wings aboard repair at 20% a day instead of 25% / 30% (a badly worn carrier wing takes about 1.5 to 2 days longer to recover) |
| **Final level: trains 15% faster** for all 25 lines | every nation from about day 17 | about 18% more units from the same buildings, late in the game only, and only for lines a nation has finished. Rewards finishing a line. Infantry loses the old 30%, everyone else gains 15%. Doctrines multiply: a China nation trains a finished line 36% faster than base |
| Fix G1: aircraft speed upgrades become real (suggested: Fourth-Generation Interceptor flies 10% faster, Supersonic Bomber 33% faster, matching "+2 of 20" and "+3 of 9") | Interceptors, Heavy Bombers | missions reach their targets sooner; bombers spend less time inside air defences. Small, and it is what the cards already promise |
| Fix G3: a finished research step that changes training time also shortens the queue | everyone | needed for section 3 to keep the "applies at once" promise |
| Computer players | all of the above | no special code: they read the same rules. The computer's research weights name nodes by id (`NW` in `rules/ai.js:389`): the three renamed nodes need their ids there if they are weighted; none of the three is today |

Overall: the tree keeps its size (249 unit-line steps, same days and prices). The total fighting power at the end of each line rises a little (infantry, swarms, carriers), and late-game production rises about 15% for finished lines. Old saves: the three nodes keep their place, so a save that holds `inf_build`, `swarm_pack` or `carr_deck` can map them to the new ids level for level (as `R_LEGACY` does for the earlier redesign).

---

## 5. Questions for the owner (with suggested answers)

1. **How much faster on the final level: 15% or 20%?** Suggested: **15%** for every line (the old Rapid Mobilisation level 1). If ships and heavy aircraft (96 h or more to train) should feel it more, 20% for those only.
2. **Which step is the "final level" when two share the last day?** Only Motorized Infantry has a tie (Protection 3 and Assault Infantry, day 17). Suggested: **the last step by day, a generation on a tie** (so Main Battle Tank's is Next-Generation MBT and Recon UAV's is UAV V). Alternative: always Protection 3, for one simple rule.
3. **Units already in a queue when the final level finishes: shorten them too?** Suggested: **yes**, their remaining hours drop by 15% at once, like every other upgrade.
4. **Replacements: Infantry Kit, Thermobaric Warheads, Close-In Defence (section 2)?** Suggested: **yes** as written. Say if you would rather have a different stat on any of them (for example sight for infantry instead of anti-air).
5. **Carrier repairs:** with Flight-Deck Crews gone, wings aboard repair at 20% a day. Suggested: **keep 20%** (an airbase repairs 10% + 6% per level, so a carrier stays good).
6. **Combat Engineers** (nation-wide logistics, not a unit line): keep or replace? Suggested: **keep**.
7. **Aircraft speed (gap G1):** make the speed parts of Fourth-Generation Interceptor and Supersonic Bomber work, or reword the cards? Suggested: **make them work** (+10% and +33% flight speed).
8. **Conflict of Nations numbers:** allow constacks.com in the session's network settings so the comparison can be checked level by level? Suggested: **yes, before the build**, if you want exact CoN numbers; the proposal above does not depend on them.
