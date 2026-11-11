# Research redesign: the plan

The design for the new research tree, built from the owner's notes in `docs/RESEARCH-REFERENCE.md` (structure and feel of Conflict of Nations' research screen; every name, icon and picture here is our own).

**Status: built in the developer build** (branch `research-redesign`), everything except section 12.2 to 12.7 (new units, new weapons, officers, new elite units), which wait for the owner. The tree itself is data in `rules/data.js` (`RCATS`, `R_LINES`, `R_SPECIAL`, built into `RNODES`); sections 4 and 6 of this file are written from it by `node tools/research-proto.js --write`, so the tables always match the game. The tool also checks the tree (see section 6.3). What the build changed from this plan is listed in section 13.

Contents: 1 what changes, 2 how the tree works, 3 categories, 4 the tree, 5 prices and times, 6 balance, 7 old saves, 8 computer players, 9 the screen, 10 build plan, 11 later, 12 NEEDS OWNER APPROVAL.

## 1. What changes, in short

- Research is organised **by unit**. Every unit type has its own column ("line"): the unit's unlock at the top, upgrades below it, a second generation further down. Today's 38 projects in 9 branches become 170 nodes (285 research steps) in 10 categories.
- Every node sits on a **day**. It cannot be started before that day. Unit unlocks open between day 1 and day 14; second generations between day 9 and day 18 (the Recon UAV's later models from day 5); the last steps on day 30.
- **Unit Marks I to IV move into the tree.** Each unit line gets two levelled nodes, Firepower and Protection, three levels each, worth exactly what Marks II, III and IV are worth today. The separate engineering slot goes away; the two research slots do all the work.
- **Generations** are new: Generation 2 (and 3 for infantry and tanks) upgrades every unit of that type you field, mostly in health, and gives the unit a new picture.
- A node only ever needs another node **in its own unit line**, or in the missile line. The one exception is the Stealth Bomber, which already needs two lines today.
- Prices are set so that a typical nation finishes about two thirds of one line by day 30 on top of four unit unlocks, and nobody gets near the whole tree (12 to 15% of it by day 60).
- Old saves lose nothing: every researched project and every Mark converts to the node or level that gives the same bonus or more.
- No new unit types and no new weapons are in this plan. Those are listed in section 12 for the owner to decide.

## 2. How the tree works

### 2.1 Node types

| Type | Where it sits | What it does | Picture in the diamond |
|---|---|---|---|
| **Unlock** | top of the column, on the unit's first day | lets you build the unit. Units known from day one (Motorized Infantry, Anti-Tank Infantry, Main Battle Tank, Mobile Artillery, Mobile SAM, Frigate, Cruiser, Attack Submarine) show it already researched, marked "standard issue" | the unit's picture |
| **Upgrade** | between the unlock and the generations | one named improvement with a simple white icon: damage, health, speed, vision, range, terrain handling, air-transportable, carrier operations, cheaper or faster to build, more missiles. Some have 2 or 3 levels | white icon |
| **Levels** (Firepower, Protection) | two per unit line | three levels each: attack (or defense) +12%, +25%, +40% in all. These are the old Marks | white damage / health icon, number badge |
| **Generation** | lower down, day 9 to 22 | the same unit, a newer model: better base stats (mostly health), a new picture `u-<unit>-<generation>` | the new picture (the current one until art exists) |

Upgrades apply to every unit of that type, those already fielded and those built later, exactly as research and Marks do today. A unit's build price and upkeep do not change with its generation.

### 2.2 Levels

A node with levels is one diamond with a number badge (the number of levels). Each level is researched separately, has its own price, its own research time and its own day. The diamond sits on the row of its first level; the detail card lists every level.

### 2.3 Days

`day = 1 + floor(hours played / 24)`, the same day the top bar shows. A node (or a level) can be started when the game has reached its day. Days never lock anything again: what you have, you keep.

### 2.4 Prerequisites

Inside a unit line the rule is one sentence: **a node needs the spine node above it.** The spine is Unlock, then Generation 2, then Generation 3.

- Upgrades and levels dated before Generation 2 need only the unlock.
- Upgrades dated after Generation 2 need Generation 2.
- Level 3 of Firepower and Protection needs Generation 2 (where the line has one).
- Generation 3 needs Generation 2. Level 2 needs level 1.

Nothing needs a node from another unit line, with two exceptions that exist today:

- **The missile line** (category Strategic Weapons): Ballistic Missiles and Reconnaissance Satellites need Cruise Missiles; the Anti-Missile Shield needs Ballistic Missiles.
- **The Stealth Bomber** needs the Heavy Bomber's Strategic Bomber Upgrade and the Strike Fighter's Stealth Airframes (today: `bomb2` and `air3`).

**Sideways lines.** The screen also draws a dashed line from a unit to a related one that came out of it: Motorized Infantry to Special Forces, Mobile Artillery to Rocket Artillery, Interceptor to Air Superiority Fighter, Recon UAV to Strike Drone, Cruiser to Aircraft Carrier. A dashed line is a family tie only; it is **not** a requirement. The two real cross-line requirements of the Stealth Bomber are drawn solid.

### 2.5 Slots

Two slots, both at full speed, as today. A project is paid for when it starts. A project whose prerequisite is still running in the other slot waits for it (today's rule). The Precision doctrine still makes research 15% faster. The engineering slot (`N.eng`) is retired.

### 2.6 How the numbers stack

`stat = (base + every flat bonus from upgrades and generations) x (1 + Firepower or Protection %) x doctrine`

This is the order the rules use today (`st()` in `rules/state.js`: base plus research, times the Mark, times the doctrine), which is why old saves convert exactly.

## 3. Categories

Ten categories, each a wide banner with a diamond icon, the name, a one-line role and a picture behind it.

| # | Our category | Role line | Unit lines (first day) | Conflict of Nations category it stands for |
|---|---|---|---|---|
| 1 | **Infantry Corps** | Takes ground and holds it | Motorized Infantry (1), Anti-Tank Infantry (1), Special Forces (4, elite) | Infantry |
| 2 | **Armoured Forces** | Breaks the line and carries the infantry forward | Infantry Fighting Vehicle (1), Main Battle Tank (1) | Armored |
| 3 | **Artillery & Air Defence** | Long reach on the ground, a roof over the army | Mobile Artillery (1), Mobile SAM (1), Mobile Jammer (3), Rocket Artillery (5) | Support |
| 4 | **Air Assault** | Short reach from the air: gunships and airborne troops | Attack Helicopter (1), Paratroopers (3, elite) | Helicopters (and the airmobile infantry) |
| 5 | **Tactical Air** | Fighters and strike jets, medium reach | Interceptor (1), Strike Fighter (1), Air Superiority Fighter (4, elite) | Fighters |
| 6 | **Unmanned Systems** | Cheap eyes and expendable strikes | Recon UAV (1), Swarm Drones (4), Strike Drone (6) | the UAV line of Fighters; our drones deserve their own page |
| 7 | **Strategic Air** | Bombers and the big sensors, long reach | Maritime Patrol Aircraft (2), AWACS (5), Heavy Bomber (6), Stealth Bomber (14, elite) | Heavies |
| 8 | **Navy** | Sea control, convoys and the silent service | Frigate (1), Cruiser (1), Attack Submarine (1), Aircraft Carrier (7) | Naval and Submarines |
| 9 | **Strategic Weapons** | Missiles, the shield against them, eyes in orbit | Cruise Missile (1), Reconnaissance Satellites (5), Ballistic Missile (6), Anti-Missile Shield (9) | Missiles |
| 10 | **Command & Logistics** | Advantages for every force you field | Motorized Supply (1), Combat Engineers (2), Amphibious Doctrine (3), Field Hospitals (4), each with a second level (days 10 to 13); shown in two columns, Logistics and Operations | none (ours today: the Logistics branch) |

Notes on the mapping:

- **Submarines** stay inside Navy while we have a single submarine. If the ballistic-missile submarine is approved (section 12), Submarines becomes its own category with two or three columns.
- **Officers, Seasons, Loadout** are not built: see section 11.
- **Elite badge** (a star between two wings, our own drawing): Special Forces, Paratroopers, Air Superiority Fighter, Stealth Bomber. These are the units our own descriptions already call elite or that sit at the top of their family. The badge is a mark on the unlock diamond and on the unit's column header; it changes no rule.
- All 25 unit types of `rules/data.js UNITS` have a line. Missiles (`MISSILES`) and satellites are in Strategic Weapons.

## 4. The tree

Each category starts with its day grid (what the screen shows: one column per line, one row per day that holds a node), then one table per line with every step. "Levels" rows are Firepower and Protection. Prices: money, materials (mat), iron, electronics (elec), rare materials (rare).

<!-- TREE:BEGIN (written by tools/research-proto.js --write) -->

### Infantry Corps

*Takes ground and holds it.* Banner picture: `u-infantry`.

| Day | Motorized Infantry | Anti-Tank Infantry | Special Forces (elite) |
|---|---|---|---|
| 1 | (standard); Ceramic Body Armour | (standard); Ceramic Body Armour |  |
| 3 | Firepower 1 | Firepower 1 |  |
| 4 | Protection 1 | Protection 1 | UNLOCK |
| 5 | Rapid Mobilisation 1 | Tandem Warheads 1 |  |
| 6 | Rough-Ground Drills 1 |  | Firepower 1 |
| 7 |  |  | Protection 1; Mountain & Arctic Training 1 |
| 8 |  | Thermal Sights | Night Optics |
| 9 | GEN 2 |  |  |
| 10 | Firepower 2 | Firepower 2 | Air-Transportable |
| 11 | Protection 2 | Protection 2; Tandem Warheads 2 |  |
| 12 | Rough-Ground Drills 2 | GEN 2 |  |
| 13 |  |  | Firepower 2; Mountain & Arctic Training 2 |
| 14 | Rapid Mobilisation 2 |  | Protection 2 |
| 16 | Firepower 3 | Firepower 3 | GEN 2 |
| 17 | Protection 3; GEN 3 | Protection 3 |  |
| 19 |  |  | Firepower 3 |
| 20 |  |  | Protection 3 |

**Motorized Infantry**: 13 steps, 207 rare materials, $878M, 45 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 1 | Motorized Infantry (`u_inf`) | Unlock | standard issue: known from day one | free | - |
| 1 | Ceramic Body Armour (`inf_armor`) | Upgrade | defense +1 | $40M, 20 mat, 13 rare | 3 |
| 3 | Firepower 1/3 (`inf_fp`) | Levels | attack +12% in all | $40M, 12 mat, 3 rare | 2 |
| 4 | Protection 1/3 (`inf_pr`) | Levels | defense +12% in all | $40M, 12 mat, 3 rare | 2 |
| 5 | Rapid Mobilisation 1/2 (`inf_build`) | Upgrade | trains 15% faster | $40M, 20 mat, 13 rare | 3 |
| 6 | Rough-Ground Drills 1/2 (`inf_terr`) | Upgrade | half the speed penalty in forest and hills | $40M, 20 mat, 13 rare | 3 |
| 9 | Mechanized Infantry (`inf_g2`), picture `u-inf-2` | Generation | attack +2, speed +1, health +2 | $115M, 50 mat, 36 rare | 6 |
| 10 | Firepower 2/3 (`inf_fp`) | Levels | attack +25% in all | $60M, 18 mat, 5 rare | 2 |
| 11 | Protection 2/3 (`inf_pr`) | Levels | defense +25% in all | $60M, 18 mat, 5 rare | 2 |
| 12 | Rough-Ground Drills 2/2 (`inf_terr`) | Upgrade | and in mountains and jungle | $55M, 30 mat, 19 rare | 4 |
| 14 | Rapid Mobilisation 2/2 (`inf_build`) | Upgrade | trains 30% faster | $55M, 30 mat, 19 rare | 4 |
| 16 | Firepower 3/3 (`inf_fp`) | Levels | attack +40% in all. Needs generation 2 | $80M, 24 mat, 8 rare | 3 |
| 17 | Protection 3/3 (`inf_pr`) | Levels | defense +40% in all. Needs generation 2 | $80M, 24 mat, 8 rare | 3 |
| 17 | Assault Infantry (`inf_g3`), picture `u-inf-3` | Generation | attack +1, defense +1, health +2. Needs Mechanized Infantry | $173M, 80 mat, 62 rare | 8 |

**Anti-Tank Infantry**: 11 steps, 132 rare materials, $785M, 33 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 1 | Anti-Tank Infantry (`u_at`) | Unlock | standard issue: known from day one | free | - |
| 1 | Ceramic Body Armour (`at_armor`) | Upgrade | defense +1 | $44M, 20 mat, 14 rare | 3 |
| 3 | Firepower 1/3 (`at_fp`) | Levels | attack +12% in all | $51M, 15 mat, 3 iron, 3 rare | 2 |
| 4 | Protection 1/3 (`at_pr`) | Levels | defense +12% in all | $51M, 15 mat, 3 iron, 3 rare | 2 |
| 5 | Tandem Warheads 1/2 (`at_warhead`) | Upgrade | attack +1 | $44M, 20 mat, 14 rare | 3 |
| 8 | Thermal Sights (`at_eye`) | Upgrade | sees half a province farther | $44M, 20 mat, 14 rare | 3 |
| 10 | Firepower 2/3 (`at_fp`) | Levels | attack +25% in all | $77M, 23 mat, 5 iron, 5 rare | 2 |
| 11 | Protection 2/3 (`at_pr`) | Levels | defense +25% in all | $77M, 23 mat, 5 iron, 5 rare | 2 |
| 11 | Tandem Warheads 2/2 (`at_warhead`) | Upgrade | attack +1 more | $63M, 30 mat, 20 rare | 4 |
| 12 | Guided Missile Teams (`at_g2`), picture `u-at-2` | Generation | attack +1, health +2, damage to armor 3.5x to 4x | $130M, 50 mat, 6 iron, 38 rare | 6 |
| 16 | Firepower 3/3 (`at_fp`) | Levels | attack +40% in all. Needs generation 2 | $102M, 30 mat, 6 iron, 8 rare | 3 |
| 17 | Protection 3/3 (`at_pr`) | Levels | defense +40% in all. Needs generation 2 | $102M, 30 mat, 6 iron, 8 rare | 3 |

**Special Forces** (elite badge): 12 steps, 166 rare materials, $1215M, 37 research days in all. Family line (dashed, no requirement) from the Motorized Infantry.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 4 | Special Forces (`u_spec`) | Unlock | unlocks the Special Forces | $75M, 20 mat, 25 rare | 4 |
| 6 | Firepower 1/3 (`spec_fp`) | Levels | attack +12% in all. Needs Special Forces | $80M, 17 mat, 2 elec, 3 rare | 2 |
| 7 | Protection 1/3 (`spec_pr`) | Levels | defense +12% in all. Needs Special Forces | $80M, 17 mat, 2 elec, 3 rare | 2 |
| 7 | Mountain & Arctic Training 1/2 (`spec_terr`) | Upgrade | rough-terrain attack bonus 40% to 50%. Needs Special Forces | $55M, 20 mat, 15 rare | 3 |
| 8 | Night Optics (`spec_eye`) | Upgrade | sees half a province farther. Needs Special Forces | $55M, 20 mat, 15 rare | 3 |
| 10 | Air-Transportable (`spec_airlift`) | Upgrade | can be air-dropped from an airbase province, up to 6 hexes. Needs Special Forces | $55M, 20 mat, 15 rare | 3 |
| 13 | Firepower 2/3 (`spec_fp`) | Levels | attack +25% in all | $120M, 26 mat, 2 elec, 5 rare | 2 |
| 13 | Mountain & Arctic Training 2/2 (`spec_terr`) | Upgrade | to 60% | $85M, 30 mat, 21 rare | 4 |
| 14 | Protection 2/3 (`spec_pr`) | Levels | defense +25% in all | $120M, 26 mat, 2 elec, 5 rare | 2 |
| 16 | Tier-One Operators (`spec_g2`), picture `u-spec-2` | Generation | attack +2, defense +1, health +2. Needs Special Forces | $170M, 50 mat, 4 elec, 43 rare | 6 |
| 19 | Firepower 3/3 (`spec_fp`) | Levels | attack +40% in all. Needs generation 2 | $160M, 34 mat, 3 elec, 8 rare | 3 |
| 20 | Protection 3/3 (`spec_pr`) | Levels | defense +40% in all. Needs generation 2 | $160M, 34 mat, 3 elec, 8 rare | 3 |

### Armoured Forces

*Breaks the line and carries the infantry forward.* Banner picture: `u-tank`.

| Day | Infantry Fighting Vehicle | Main Battle Tank |
|---|---|---|
| 1 | UNLOCK | (standard); Composite Armour |
| 3 | Firepower 1 | Firepower 1 |
| 4 | Protection 1 | Protection 1 |
| 5 | 30 mm Autocannon |  |
| 7 |  | Smoothbore Main Gun |
| 8 | Uprated Powerpack |  |
| 9 |  | Wide Tracks |
| 10 | Firepower 2; Amphibious Kit | Firepower 2 |
| 11 | Protection 2 | Protection 2; Turbine Engines |
| 13 | GEN 2 |  |
| 14 |  | GEN 2 |
| 16 | Firepower 3 |  |
| 17 | Protection 3 | Firepower 3 |
| 18 |  | Protection 3 |
| 22 |  | GEN 3 |

**Infantry Fighting Vehicle**: 11 steps, 132 rare materials, $781M, 32 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 1 | Infantry Fighting Vehicle (`u_ifv`) | Unlock | unlocks the Infantry Fighting Vehicle | $59M, 20 mat, 20 rare | 3 |
| 3 | Firepower 1/3 (`ifv_fp`) | Levels | attack +12% in all. Needs Infantry Fighting Vehicle | $51M, 16 mat, 7 iron, 3 rare | 2 |
| 4 | Protection 1/3 (`ifv_pr`) | Levels | defense +12% in all. Needs Infantry Fighting Vehicle | $51M, 16 mat, 7 iron, 3 rare | 2 |
| 5 | 30 mm Autocannon (`ifv_gun`) | Upgrade | attack +2. Needs Infantry Fighting Vehicle | $44M, 20 mat, 14 rare | 3 |
| 8 | Uprated Powerpack (`ifv_spd`) | Upgrade | speed +1. Needs Infantry Fighting Vehicle | $44M, 20 mat, 14 rare | 3 |
| 10 | Firepower 2/3 (`ifv_fp`) | Levels | attack +25% in all | $77M, 24 mat, 11 iron, 5 rare | 2 |
| 10 | Amphibious Kit (`ifv_terr`) | Upgrade | no penalty for attacking across a river. Needs Infantry Fighting Vehicle | $44M, 20 mat, 14 rare | 3 |
| 11 | Protection 2/3 (`ifv_pr`) | Levels | defense +25% in all | $77M, 24 mat, 11 iron, 5 rare | 2 |
| 13 | Heavy IFV (`ifv_g2`), picture `u-ifv-2` | Generation | attack +1, defense +1, health +3. Needs Infantry Fighting Vehicle | $130M, 50 mat, 14 iron, 38 rare | 6 |
| 16 | Firepower 3/3 (`ifv_fp`) | Levels | attack +40% in all. Needs generation 2 | $102M, 32 mat, 14 iron, 8 rare | 3 |
| 17 | Protection 3/3 (`ifv_pr`) | Levels | defense +40% in all. Needs generation 2 | $102M, 32 mat, 14 iron, 8 rare | 3 |

**Main Battle Tank**: 12 steps, 196 rare materials, $1142M, 40 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 1 | Main Battle Tank (`u_tank`) | Unlock | standard issue: known from day one | free | - |
| 1 | Composite Armour (`tank_armor`) | Upgrade | defense +2 | $49M, 20 mat, 14 rare | 3 |
| 3 | Firepower 1/3 (`tank_fp`) | Levels | attack +12% in all | $64M, 17 mat, 11 iron, 3 rare | 2 |
| 4 | Protection 1/3 (`tank_pr`) | Levels | defense +12% in all | $64M, 17 mat, 11 iron, 3 rare | 2 |
| 7 | Smoothbore Main Gun (`tank_gun`) | Upgrade | attack +3 | $49M, 20 mat, 14 rare | 3 |
| 9 | Wide Tracks (`tank_terr`) | Upgrade | half the speed penalty on rough ground | $49M, 20 mat, 14 rare | 3 |
| 10 | Firepower 2/3 (`tank_fp`) | Levels | attack +25% in all | $96M, 26 mat, 17 iron, 5 rare | 2 |
| 11 | Protection 2/3 (`tank_pr`) | Levels | defense +25% in all | $96M, 26 mat, 17 iron, 5 rare | 2 |
| 11 | Turbine Engines (`tank_eng`) | Upgrade | speed +2, attack +1 | $49M, 20 mat, 14 rare | 3 |
| 14 | Third-Generation MBT (`tank_g2`), picture `u-tank-2` | Generation | defense +1, health +4 | $148M, 50 mat, 22 iron, 40 rare | 6 |
| 17 | Firepower 3/3 (`tank_fp`) | Levels | attack +40% in all. Needs generation 2 | $128M, 34 mat, 22 iron, 8 rare | 3 |
| 18 | Protection 3/3 (`tank_pr`) | Levels | defense +40% in all. Needs generation 2 | $128M, 34 mat, 22 iron, 8 rare | 3 |
| 22 | Next-Generation MBT (`tank_g3`), picture `u-tank-3` | Generation | attack +2, defense +1, health +3. Needs Third-Generation MBT | $222M, 80 mat, 22 iron, 68 rare | 8 |

### Artillery & Air Defence

*Long reach on the ground, a roof over the army.* Banner picture: `u-rocket-artillery`.

| Day | Mobile Artillery | Rocket Artillery | Mobile SAM | Mobile Jammer |
|---|---|---|---|---|
| 1 | (standard); Counter-Battery Radar |  | (standard) |  |
| 3 | Firepower 1 |  | Firepower 1 | UNLOCK |
| 4 | Protection 1 |  | Protection 1; Improved Seekers 1 |  |
| 5 |  | UNLOCK |  | Firepower 1 |
| 6 |  |  |  | Protection 1 |
| 7 |  | Firepower 1 | Shoot-and-Scoot | Wideband Jamming 1 |
| 8 | Extended-Range Shells | Protection 1 |  |  |
| 9 |  | Rapid Reload |  |  |
| 10 | Firepower 2 |  | Firepower 2; Improved Seekers 2 |  |
| 11 | Protection 2 |  | Protection 2 |  |
| 12 |  | Extended-Range Rockets |  | Firepower 2 |
| 13 | Guided Shells |  | GEN 2 | Protection 2; Wideband Jamming 2 |
| 14 |  | Firepower 2 |  |  |
| 15 | GEN 2 | Protection 2 |  |  |
| 16 |  | GEN 2 | Firepower 3 | GEN 2 |
| 17 |  |  | Protection 3 |  |
| 18 | Firepower 3 |  |  |  |
| 19 | Protection 3 |  |  | Firepower 3 |
| 20 |  | Firepower 3 |  | Protection 3 |
| 21 |  | Protection 3 |  |  |

**Mobile Artillery**: 10 steps, 113 rare materials, $798M, 29 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 1 | Mobile Artillery (`u_art`) | Unlock | standard issue: known from day one | free | - |
| 1 | Counter-Battery Radar (`art_radar`) | Upgrade | attack +2 | $47M, 20 mat, 14 rare | 3 |
| 3 | Firepower 1/3 (`art_fp`) | Levels | attack +12% in all | $58M, 16 mat, 7 iron, 3 rare | 2 |
| 4 | Protection 1/3 (`art_pr`) | Levels | defense +12% in all | $58M, 16 mat, 7 iron, 3 rare | 2 |
| 8 | Extended-Range Shells (`art_shell`) | Upgrade | attack +3, defense +2 | $47M, 20 mat, 14 rare | 3 |
| 10 | Firepower 2/3 (`art_fp`) | Levels | attack +25% in all | $86M, 24 mat, 11 iron, 5 rare | 2 |
| 11 | Protection 2/3 (`art_pr`) | Levels | defense +25% in all | $86M, 24 mat, 11 iron, 5 rare | 2 |
| 13 | Guided Shells (`art_guided`) | Upgrade | attack +2, speed +1 | $47M, 20 mat, 14 rare | 3 |
| 15 | Long-Barrel Howitzer (`art_g2`), picture `u-art-2` | Generation | attack +1, health +3 | $139M, 50 mat, 14 iron, 39 rare | 6 |
| 18 | Firepower 3/3 (`art_fp`) | Levels | attack +40% in all. Needs generation 2 | $115M, 32 mat, 14 iron, 8 rare | 3 |
| 19 | Protection 3/3 (`art_pr`) | Levels | defense +40% in all. Needs generation 2 | $115M, 32 mat, 14 iron, 8 rare | 3 |

**Rocket Artillery**: 10 steps, 130 rare materials, $1111M, 30 research days in all. Family line (dashed, no requirement) from the Mobile Artillery.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 5 | Rocket Artillery (`u_mlrs`) | Unlock | unlocks the Rocket Artillery | $77M, 20 mat, 25 rare | 4 |
| 7 | Firepower 1/3 (`mlrs_fp`) | Levels | attack +12% in all. Needs Rocket Artillery | $83M, 17 mat, 10 iron, 2 elec, 3 rare | 2 |
| 8 | Protection 1/3 (`mlrs_pr`) | Levels | defense +12% in all. Needs Rocket Artillery | $83M, 17 mat, 10 iron, 2 elec, 3 rare | 2 |
| 9 | Rapid Reload (`mlrs_reload`) | Upgrade | attack +2. Needs Rocket Artillery | $56M, 20 mat, 15 rare | 3 |
| 12 | Extended-Range Rockets (`mlrs_rng`) | Upgrade | shells enemies up to 3 provinces away (was 2). Needs Rocket Artillery | $56M, 20 mat, 15 rare | 3 |
| 14 | Firepower 2/3 (`mlrs_fp`) | Levels | attack +25% in all | $125M, 26 mat, 15 iron, 4 elec, 5 rare | 2 |
| 15 | Protection 2/3 (`mlrs_pr`) | Levels | defense +25% in all | $125M, 26 mat, 15 iron, 4 elec, 5 rare | 2 |
| 16 | Guided Rocket System (`mlrs_g2`), picture `u-mlrs-2` | Generation | attack +2, health +2, damage to armor 0.9x to 1.2x. Needs Rocket Artillery | $174M, 50 mat, 20 iron, 6 elec, 43 rare | 6 |
| 20 | Firepower 3/3 (`mlrs_fp`) | Levels | attack +40% in all. Needs generation 2 | $166M, 34 mat, 20 iron, 5 elec, 8 rare | 3 |
| 21 | Protection 3/3 (`mlrs_pr`) | Levels | defense +40% in all. Needs generation 2 | $166M, 34 mat, 20 iron, 5 elec, 8 rare | 3 |

**Mobile SAM**: 10 steps, 121 rare materials, $971M, 30 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 1 | Mobile SAM (`u_sam`) | Unlock | standard issue: known from day one | free | - |
| 3 | Firepower 1/3 (`sam_fp`) | Levels | attack +12% in all | $70M, 18 mat, 3 iron, 6 elec, 3 rare | 2 |
| 4 | Protection 1/3 (`sam_pr`) | Levels | defense +12% in all | $70M, 18 mat, 3 iron, 6 elec, 3 rare | 2 |
| 4 | Improved Seekers 1/2 (`sam_seek`) | Upgrade | attack +1 | $51M, 20 mat, 14 rare | 3 |
| 7 | Shoot-and-Scoot (`sam_spd`) | Upgrade | speed +1, defense +1 | $51M, 20 mat, 14 rare | 3 |
| 10 | Firepower 2/3 (`sam_fp`) | Levels | attack +25% in all | $106M, 27 mat, 5 iron, 8 elec, 5 rare | 2 |
| 10 | Improved Seekers 2/2 (`sam_seek`) | Upgrade | attack +1 more | $78M, 30 mat, 20 rare | 4 |
| 11 | Protection 2/3 (`sam_pr`) | Levels | defense +25% in all | $106M, 27 mat, 5 iron, 8 elec, 5 rare | 2 |
| 13 | Long-Range SAM (`sam_g2`), picture `u-sam-2` | Generation | attack +2, health +2, covers neighbouring provinces at full strength | $157M, 50 mat, 6 iron, 14 elec, 41 rare | 6 |
| 16 | Firepower 3/3 (`sam_fp`) | Levels | attack +40% in all. Needs generation 2 | $141M, 36 mat, 6 iron, 11 elec, 8 rare | 3 |
| 17 | Protection 3/3 (`sam_pr`) | Levels | defense +40% in all. Needs generation 2 | $141M, 36 mat, 6 iron, 11 elec, 8 rare | 3 |

**Mobile Jammer**: 10 steps, 126 rare materials, $797M, 30 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 3 | Mobile Jammer (`u_jam`) | Unlock | unlocks the Mobile Jammer | $61M, 20 mat, 21 rare | 3 |
| 5 | Firepower 1/3 (`jam_fp`) | Levels | attack +12% in all. Needs Mobile Jammer | $54M, 16 mat, 6 elec, 3 rare | 2 |
| 6 | Protection 1/3 (`jam_pr`) | Levels | defense +12% in all. Needs Mobile Jammer | $54M, 16 mat, 6 elec, 3 rare | 2 |
| 7 | Wideband Jamming 1/2 (`jam_band`) | Upgrade | downs and jams 20% more drones. Needs Mobile Jammer | $45M, 20 mat, 14 rare | 3 |
| 12 | Firepower 2/3 (`jam_fp`) | Levels | attack +25% in all | $82M, 24 mat, 8 elec, 5 rare | 2 |
| 13 | Protection 2/3 (`jam_pr`) | Levels | defense +25% in all | $82M, 24 mat, 8 elec, 5 rare | 2 |
| 13 | Wideband Jamming 2/2 (`jam_band`) | Upgrade | 40% more | $66M, 30 mat, 20 rare | 4 |
| 16 | Counter-UAV Laser (`jam_g2`), picture `u-jam-2` | Generation | attack +2, defense +1, health +2. Needs Mobile Jammer | $135M, 50 mat, 14 elec, 39 rare | 6 |
| 19 | Firepower 3/3 (`jam_fp`) | Levels | attack +40% in all. Needs generation 2 | $109M, 32 mat, 11 elec, 8 rare | 3 |
| 20 | Protection 3/3 (`jam_pr`) | Levels | defense +40% in all. Needs generation 2 | $109M, 32 mat, 11 elec, 8 rare | 3 |

### Air Assault

*Short reach from the air: gunships and airborne troops.* Banner picture: `u-attack-heli`.

| Day | Attack Helicopter | Paratroopers (elite) |
|---|---|---|
| 1 | UNLOCK |  |
| 3 | Firepower 1 | UNLOCK |
| 4 | Protection 1 |  |
| 5 |  | Firepower 1 |
| 6 | Long-Range Tanks 1 | Protection 1 |
| 7 |  | Long-Range Airlift 1 |
| 8 | Fire-and-Forget Missiles |  |
| 10 | Firepower 2 |  |
| 11 | Protection 2 |  |
| 12 | Long-Range Tanks 2 | Firepower 2 |
| 13 |  | Protection 2; Long-Range Airlift 2 |
| 14 | GEN 2 |  |
| 15 |  | GEN 2 |
| 17 | Firepower 3 |  |
| 18 | Protection 3 | Firepower 3 |
| 19 |  | Protection 3 |

**Attack Helicopter**: 11 steps, 153 rare materials, $1279M, 34 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 1 | Attack Helicopter (`u_heli`) | Unlock | unlocks the Attack Helicopter | $80M, 20 mat, 26 rare | 4 |
| 3 | Firepower 1/3 (`heli_fp`) | Levels | attack +12% in all. Needs Attack Helicopter | $90M, 20 mat, 6 elec, 3 rare | 2 |
| 4 | Protection 1/3 (`heli_pr`) | Levels | defense +12% in all. Needs Attack Helicopter | $90M, 20 mat, 6 elec, 3 rare | 2 |
| 6 | Long-Range Tanks 1/2 (`heli_rng`) | Upgrade | range +1 hex (7). Needs Attack Helicopter | $59M, 20 mat, 15 rare | 3 |
| 8 | Fire-and-Forget Missiles (`heli_atgm`) | Upgrade | attack +1. Needs Attack Helicopter | $59M, 20 mat, 15 rare | 3 |
| 10 | Firepower 2/3 (`heli_fp`) | Levels | attack +25% in all | $134M, 30 mat, 8 elec, 5 rare | 2 |
| 11 | Protection 2/3 (`heli_pr`) | Levels | defense +25% in all | $134M, 30 mat, 8 elec, 5 rare | 2 |
| 12 | Long-Range Tanks 2/2 (`heli_rng`) | Upgrade | range +1 more (8) | $92M, 30 mat, 21 rare | 4 |
| 14 | Heavy Gunship (`heli_g2`), picture `u-heli-2` | Generation | attack +2, defense +1, health +3. Needs Attack Helicopter | $183M, 50 mat, 14 elec, 44 rare | 6 |
| 17 | Firepower 3/3 (`heli_fp`) | Levels | attack +40% in all. Needs generation 2 | $179M, 40 mat, 11 elec, 8 rare | 3 |
| 18 | Protection 3/3 (`heli_pr`) | Levels | defense +40% in all. Needs generation 2 | $179M, 40 mat, 11 elec, 8 rare | 3 |

**Paratroopers** (elite badge): 10 steps, 126 rare materials, $834M, 31 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 3 | Paratroopers (`u_para`) | Unlock | unlocks the Paratroopers | $62M, 20 mat, 21 rare | 4 |
| 5 | Firepower 1/3 (`para_fp`) | Levels | attack +12% in all. Needs Paratroopers | $58M, 16 mat, 3 rare | 2 |
| 6 | Protection 1/3 (`para_pr`) | Levels | defense +12% in all. Needs Paratroopers | $58M, 16 mat, 3 rare | 2 |
| 7 | Long-Range Airlift 1/2 (`para_airlift`) | Upgrade | drop range 9 to 11 hexes. Needs Paratroopers | $47M, 20 mat, 14 rare | 3 |
| 12 | Firepower 2/3 (`para_fp`) | Levels | attack +25% in all | $86M, 24 mat, 5 rare | 2 |
| 13 | Protection 2/3 (`para_pr`) | Levels | defense +25% in all | $86M, 24 mat, 5 rare | 2 |
| 13 | Long-Range Airlift 2/2 (`para_airlift`) | Upgrade | to 13 hexes | $68M, 30 mat, 20 rare | 4 |
| 15 | Air Assault Brigade (`para_g2`), picture `u-para-2` | Generation | attack +1, defense +1, health +2. Needs Paratroopers | $139M, 50 mat, 39 rare | 6 |
| 18 | Firepower 3/3 (`para_fp`) | Levels | attack +40% in all. Needs generation 2 | $115M, 32 mat, 8 rare | 3 |
| 19 | Protection 3/3 (`para_pr`) | Levels | defense +40% in all. Needs generation 2 | $115M, 32 mat, 8 rare | 3 |

### Tactical Air

*Fighters and strike jets, medium reach.* Banner picture: `u-air-superiority`.

| Day | Interceptor | Strike Fighter | Air Superiority Fighter (elite) |
|---|---|---|---|
| 1 | UNLOCK | UNLOCK |  |
| 3 | Firepower 1 | Firepower 1 |  |
| 4 | Protection 1 | Protection 1 | UNLOCK |
| 5 | Radar-Guided Missiles | Precision Munitions |  |
| 6 |  |  | Firepower 1 |
| 7 | Drop Tanks 1 | Drop Tanks 1 | Protection 1 |
| 8 |  |  | Drop Tanks 1 |
| 10 | Firepower 2 | Firepower 2; Stealth Airframes | Look-Down Radar |
| 11 | Protection 2 | Protection 2 |  |
| 12 | GEN 2 |  |  |
| 13 | Drop Tanks 2 | Drop Tanks 2 | Firepower 2 |
| 14 |  | GEN 2 | Protection 2; Drop Tanks 2 |
| 16 | Firepower 3 |  |  |
| 17 | Protection 3 | Firepower 3 | GEN 2 |
| 18 |  | Protection 3 |  |
| 20 |  |  | Firepower 3 |
| 21 |  |  | Protection 3 |

**Interceptor**: 11 steps, 157 rare materials, $1397M, 34 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 1 | Interceptor (`u_int`) | Unlock | unlocks the Interceptor | $86M, 20 mat, 28 rare | 4 |
| 3 | Firepower 1/3 (`int_fp`) | Levels | attack +12% in all. Needs Interceptor | $99M, 20 mat, 6 elec, 3 rare | 2 |
| 4 | Protection 1/3 (`int_pr`) | Levels | defense +12% in all. Needs Interceptor | $99M, 20 mat, 6 elec, 3 rare | 2 |
| 5 | Radar-Guided Missiles (`int_msl`) | Upgrade | attack +2. Needs Interceptor | $62M, 20 mat, 15 rare | 3 |
| 7 | Drop Tanks 1/2 (`int_rng`) | Upgrade | range +1 hex. Needs Interceptor | $62M, 20 mat, 15 rare | 3 |
| 10 | Firepower 2/3 (`int_fp`) | Levels | attack +25% in all | $149M, 30 mat, 10 elec, 5 rare | 2 |
| 11 | Protection 2/3 (`int_pr`) | Levels | defense +25% in all | $149M, 30 mat, 10 elec, 5 rare | 2 |
| 12 | Fourth-Generation Interceptor (`int_g2`), picture `u-int-2` | Generation | attack +1, defense +1, health +2, speed +2. Needs Interceptor | $196M, 50 mat, 16 elec, 46 rare | 6 |
| 13 | Drop Tanks 2/2 (`int_rng`) | Upgrade | range +1 more | $99M, 30 mat, 21 rare | 4 |
| 16 | Firepower 3/3 (`int_fp`) | Levels | attack +40% in all. Needs generation 2 | $198M, 40 mat, 13 elec, 8 rare | 3 |
| 17 | Protection 3/3 (`int_pr`) | Levels | defense +40% in all. Needs generation 2 | $198M, 40 mat, 13 elec, 8 rare | 3 |

**Strike Fighter**: 12 steps, 180 rare materials, $1625M, 37 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 1 | Strike Fighter (`u_jet`) | Unlock | unlocks the Strike Fighter | $93M, 20 mat, 30 rare | 4 |
| 3 | Firepower 1/3 (`jet_fp`) | Levels | attack +12% in all. Needs Strike Fighter | $112M, 22 mat, 8 elec, 3 rare | 2 |
| 4 | Protection 1/3 (`jet_pr`) | Levels | defense +12% in all. Needs Strike Fighter | $112M, 22 mat, 8 elec, 3 rare | 2 |
| 5 | Precision Munitions (`jet_pgm`) | Upgrade | attack +2. Needs Strike Fighter | $67M, 20 mat, 16 rare | 3 |
| 7 | Drop Tanks 1/2 (`jet_rng`) | Upgrade | range +1 hex. Needs Strike Fighter | $67M, 20 mat, 16 rare | 3 |
| 10 | Firepower 2/3 (`jet_fp`) | Levels | attack +25% in all | $168M, 33 mat, 12 elec, 5 rare | 2 |
| 10 | Stealth Airframes (`jet_lo`) | Upgrade | defense +3; with the Strategic Bomber Upgrade it opens the Stealth Bomber. Needs Strike Fighter | $67M, 20 mat, 16 rare | 3 |
| 11 | Protection 2/3 (`jet_pr`) | Levels | defense +25% in all | $168M, 33 mat, 12 elec, 5 rare | 2 |
| 13 | Drop Tanks 2/2 (`jet_rng`) | Upgrade | range +1 more | $109M, 30 mat, 22 rare | 4 |
| 14 | Multirole Strike Fighter (`jet_g2`), picture `u-jet-2` | Generation | attack +2, health +2, damage to armor 1.6x to 1.8x. Needs Strike Fighter | $214M, 50 mat, 20 elec, 48 rare | 6 |
| 17 | Firepower 3/3 (`jet_fp`) | Levels | attack +40% in all. Needs generation 2 | $224M, 44 mat, 16 elec, 8 rare | 3 |
| 18 | Protection 3/3 (`jet_pr`) | Levels | defense +40% in all. Needs generation 2 | $224M, 44 mat, 16 elec, 8 rare | 3 |

**Air Superiority Fighter** (elite badge): 11 steps, 168 rare materials, $1719M, 35 research days in all. Family line (dashed, no requirement) from the Interceptor.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 4 | Air Superiority Fighter (`u_asf`) | Unlock | unlocks the Air Superiority Fighter | $100M, 20 mat, 32 rare | 5 |
| 6 | Firepower 1/3 (`asf_fp`) | Levels | attack +12% in all. Needs Air Superiority Fighter | $125M, 24 mat, 10 elec, 3 rare | 2 |
| 7 | Protection 1/3 (`asf_pr`) | Levels | defense +12% in all. Needs Air Superiority Fighter | $125M, 24 mat, 10 elec, 3 rare | 2 |
| 8 | Drop Tanks 1/2 (`asf_rng`) | Upgrade | range +1 hex. Needs Air Superiority Fighter | $72M, 20 mat, 16 rare | 3 |
| 10 | Look-Down Radar (`asf_radar`) | Upgrade | attack +1. Needs Air Superiority Fighter | $72M, 20 mat, 16 rare | 3 |
| 13 | Firepower 2/3 (`asf_fp`) | Levels | attack +25% in all | $187M, 36 mat, 14 elec, 5 rare | 2 |
| 14 | Protection 2/3 (`asf_pr`) | Levels | defense +25% in all | $187M, 36 mat, 14 elec, 5 rare | 2 |
| 14 | Drop Tanks 2/2 (`asf_rng`) | Upgrade | range +1 more | $119M, 30 mat, 22 rare | 4 |
| 17 | Fifth-Generation Fighter (`asf_g2`), picture `u-asf-2` | Generation | attack +2, defense +2, health +2. Needs Air Superiority Fighter | $232M, 50 mat, 24 elec, 50 rare | 6 |
| 20 | Firepower 3/3 (`asf_fp`) | Levels | attack +40% in all. Needs generation 2 | $250M, 48 mat, 19 elec, 8 rare | 3 |
| 21 | Protection 3/3 (`asf_pr`) | Levels | defense +40% in all. Needs generation 2 | $250M, 48 mat, 19 elec, 8 rare | 3 |

### Unmanned Systems

*Cheap eyes and expendable strikes.* Banner picture: `u-strike-drone`.

| Day | Recon UAV | Swarm Drones | Strike Drone |
|---|---|---|---|
| 1 | UNLOCK |  |  |
| 3 | Firepower 1 |  |  |
| 4 | Protection 1 | UNLOCK |  |
| 5 | GEN 2 |  |  |
| 6 |  | Firepower 1 | UNLOCK |
| 7 |  | Protection 1 |  |
| 8 |  | Booster Rockets 1 | Firepower 1 |
| 9 | GEN 3 | Bigger Salvo | Protection 1 |
| 10 | Firepower 2 |  | Satellite Link 1 |
| 11 | Protection 2 |  |  |
| 12 |  |  | Bunker-Buster Warhead |
| 13 | GEN 4 | Firepower 2 |  |
| 14 |  | Protection 2; Booster Rockets 2 |  |
| 15 |  | GEN 2 | Firepower 2; Satellite Link 2 |
| 16 | Firepower 3 |  | Protection 2 |
| 17 | Protection 3 |  | GEN 2 |
| 18 | GEN 5 |  |  |
| 19 |  | Firepower 3 |  |
| 20 |  | Protection 3 |  |
| 21 |  |  | Firepower 3 |
| 22 |  |  | Protection 3 |

**Recon UAV**: 11 steps, 325 rare materials, $1235M, 48 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 1 | Recon UAV (`u_drone`) | Unlock | unlocks the Recon UAV | $53M, 20 mat, 19 rare | 3 |
| 3 | Firepower 1/3 (`drone_fp`) | Levels | attack +12% in all. Needs Recon UAV | $42M, 16 mat, 4 elec, 3 rare | 2 |
| 4 | Protection 1/3 (`drone_pr`) | Levels | defense +12% in all. Needs Recon UAV | $42M, 16 mat, 4 elec, 3 rare | 2 |
| 5 | UAV II · Long-Endurance Optics (`drone_g2`), picture `u-drone-2` | Generation | sees farther, loiters 16 h, reaches farther, harder to shoot down. Needs Recon UAV | $117M, 50 mat, 10 elec, 37 rare | 6 |
| 9 | UAV III · Low-Observable Airframe (`drone_g3`), picture `u-drone-3` | Generation | loiters 20 h, wider view, air defences hit 40% less. Needs UAV II · Long-Endurance Optics | $176M, 80 mat, 10 elec, 62 rare | 8 |
| 10 | Firepower 2/3 (`drone_fp`) | Levels | attack +25% in all | $62M, 24 mat, 6 elec, 5 rare | 2 |
| 11 | Protection 2/3 (`drone_pr`) | Levels | defense +25% in all | $62M, 24 mat, 6 elec, 5 rare | 2 |
| 13 | UAV IV · Armed UAV (`drone_g4`), picture `u-drone-4` | Generation | light missiles: one salvo per sortie. Needs UAV III · Low-Observable Airframe | $234M, 80 mat, 10 elec, 80 rare | 8 |
| 16 | Firepower 3/3 (`drone_fp`) | Levels | attack +40% in all. Needs generation 2 | $83M, 32 mat, 8 elec, 8 rare | 3 |
| 17 | Protection 3/3 (`drone_pr`) | Levels | defense +40% in all. Needs generation 2 | $83M, 32 mat, 8 elec, 8 rare | 3 |
| 18 | UAV V · Hunter-Killer (`drone_g5`), picture `u-drone-5` | Generation | two salvos, heavier missiles, longer range and loiter. Needs UAV IV · Armed UAV | $281M, 80 mat, 10 elec, 95 rare | 9 |

**Swarm Drones**: 11 steps, 142 rare materials, $961M, 34 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 4 | Swarm Drones (`u_swarm`) | Unlock | unlocks the Swarm Drones | $66M, 20 mat, 22 rare | 4 |
| 6 | Firepower 1/3 (`swarm_fp`) | Levels | attack +12% in all. Needs Swarm Drones | $64M, 16 mat, 4 elec, 3 rare | 2 |
| 7 | Protection 1/3 (`swarm_pr`) | Levels | defense +12% in all. Needs Swarm Drones | $64M, 16 mat, 4 elec, 3 rare | 2 |
| 8 | Booster Rockets 1/2 (`swarm_rng`) | Upgrade | range +1 hex. Needs Swarm Drones | $49M, 20 mat, 14 rare | 3 |
| 9 | Bigger Salvo (`swarm_pack`) | Upgrade | eight drones per card (was six), same price. Needs Swarm Drones | $49M, 20 mat, 14 rare | 3 |
| 13 | Firepower 2/3 (`swarm_fp`) | Levels | attack +25% in all | $96M, 24 mat, 6 elec, 5 rare | 2 |
| 14 | Protection 2/3 (`swarm_pr`) | Levels | defense +25% in all | $96M, 24 mat, 6 elec, 5 rare | 2 |
| 14 | Booster Rockets 2/2 (`swarm_rng`) | Upgrade | range +1 more | $73M, 30 mat, 20 rare | 4 |
| 15 | Networked Swarm (`swarm_g2`), picture `u-swarm-2` | Generation | attack +0.6, health +1, damage to armor 0.35x to 0.6x. Needs Swarm Drones | $148M, 50 mat, 10 elec, 40 rare | 6 |
| 19 | Firepower 3/3 (`swarm_fp`) | Levels | attack +40% in all. Needs generation 2 | $128M, 32 mat, 8 elec, 8 rare | 3 |
| 20 | Protection 3/3 (`swarm_pr`) | Levels | defense +40% in all. Needs generation 2 | $128M, 32 mat, 8 elec, 8 rare | 3 |

**Strike Drone**: 11 steps, 146 rare materials, $1122M, 34 research days in all. Family line (dashed, no requirement) from the Recon UAV.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 6 | Strike Drone (`u_sdrone`) | Unlock | unlocks the Strike Drone | $73M, 20 mat, 24 rare | 4 |
| 8 | Firepower 1/3 (`sdrone_fp`) | Levels | attack +12% in all. Needs Strike Drone | $77M, 18 mat, 6 elec, 3 rare | 2 |
| 9 | Protection 1/3 (`sdrone_pr`) | Levels | defense +12% in all. Needs Strike Drone | $77M, 18 mat, 6 elec, 3 rare | 2 |
| 10 | Satellite Link 1/2 (`sdrone_rng`) | Upgrade | range +2 hexes. Needs Strike Drone | $54M, 20 mat, 14 rare | 3 |
| 12 | Bunker-Buster Warhead (`sdrone_hit`) | Upgrade | knocks a building out for 36 h (was 24 h). Needs Strike Drone | $54M, 20 mat, 14 rare | 3 |
| 15 | Firepower 2/3 (`sdrone_fp`) | Levels | attack +25% in all | $115M, 27 mat, 8 elec, 5 rare | 2 |
| 15 | Satellite Link 2/2 (`sdrone_rng`) | Upgrade | range +2 more | $83M, 30 mat, 20 rare | 4 |
| 16 | Protection 2/3 (`sdrone_pr`) | Levels | defense +25% in all | $115M, 27 mat, 8 elec, 5 rare | 2 |
| 17 | Low-Observable Strike Drone (`sdrone_g2`), picture `u-sdrone-2` | Generation | attack +2, health +2, air defences hit 30% less. Needs Strike Drone | $166M, 50 mat, 14 elec, 42 rare | 6 |
| 21 | Firepower 3/3 (`sdrone_fp`) | Levels | attack +40% in all. Needs generation 2 | $154M, 36 mat, 11 elec, 8 rare | 3 |
| 22 | Protection 3/3 (`sdrone_pr`) | Levels | defense +40% in all. Needs generation 2 | $154M, 36 mat, 11 elec, 8 rare | 3 |

### Strategic Air

*Bombers and the big sensors, long reach.* Banner picture: `u-bomber`.

| Day | Heavy Bomber | Stealth Bomber (elite) | Maritime Patrol Aircraft | AWACS |
|---|---|---|---|---|
| 2 |  |  | UNLOCK |  |
| 4 |  |  | Firepower 1 |  |
| 5 |  |  | Protection 1 | UNLOCK |
| 6 | UNLOCK |  |  |  |
| 8 | Firepower 1 |  | Sonobuoy Field 1 | Protection 1 |
| 9 | Protection 1; Defensive Jammers |  |  | High-Power Radar 1 |
| 10 |  |  | Homing Torpedoes |  |
| 11 | Strategic Bomber Upgrade |  | Firepower 2 |  |
| 12 |  |  | Protection 2 | Fighter Data Link |
| 14 |  | UNLOCK | Sonobuoy Field 2 |  |
| 15 | Firepower 2 |  | GEN 2 | Protection 2; High-Power Radar 2 |
| 16 | Protection 2 | Firepower 1 |  |  |
| 17 | GEN 2 | Protection 1 |  | GEN 2 |
| 18 |  |  | Firepower 3 |  |
| 19 |  | Enlarged Bomb Bay | Protection 3 |  |
| 21 | Firepower 3 | Flying-Wing Tanks |  | Protection 3 |
| 22 | Protection 3 |  |  |  |
| 23 |  | Firepower 2 |  |  |
| 24 |  | Protection 2 |  |  |
| 29 |  | Firepower 3 |  |  |
| 30 |  | Protection 3 |  |  |

**Heavy Bomber**: 10 steps, 178 rare materials, $2607M, 32 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 6 | Heavy Bomber (`u_bomb`) | Unlock | unlocks the Heavy Bomber | $149M, 20 mat, 45 rare | 6 |
| 8 | Firepower 1/3 (`bomb_fp`) | Levels | attack +12% in all. Needs Heavy Bomber | $211M, 36 mat, 6 iron, 11 elec, 3 rare | 2 |
| 9 | Protection 1/3 (`bomb_pr`) | Levels | defense +12% in all. Needs Heavy Bomber | $211M, 36 mat, 6 iron, 11 elec, 3 rare | 2 |
| 9 | Defensive Jammers (`bomb_ecm`) | Upgrade | defense +2. Needs Heavy Bomber | $104M, 20 mat, 19 rare | 3 |
| 11 | Strategic Bomber Upgrade (`bomb_up`) | Upgrade | range +4 hexes (+720 km), attack +1; with Stealth Airframes it opens the Stealth Bomber. Needs Heavy Bomber | $104M, 20 mat, 19 rare | 3 |
| 15 | Firepower 2/3 (`bomb_fp`) | Levels | attack +25% in all | $317M, 54 mat, 9 iron, 17 elec, 5 rare | 2 |
| 16 | Protection 2/3 (`bomb_pr`) | Levels | defense +25% in all | $317M, 54 mat, 9 iron, 17 elec, 5 rare | 2 |
| 17 | Supersonic Bomber (`bomb_g2`), picture `u-bomb-2` | Generation | attack +2, health +3, speed +3. Needs Heavy Bomber | $350M, 50 mat, 12 iron, 28 elec, 63 rare | 6 |
| 21 | Firepower 3/3 (`bomb_fp`) | Levels | attack +40% in all. Needs generation 2 | $422M, 72 mat, 12 iron, 22 elec, 8 rare | 3 |
| 22 | Protection 3/3 (`bomb_pr`) | Levels | defense +40% in all. Needs generation 2 | $422M, 72 mat, 12 iron, 22 elec, 8 rare | 3 |

**Stealth Bomber** (elite badge): 9 steps, 185 rare materials, $5525M, 29 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 14 | Stealth Bomber (`u_stealth`) | Unlock | unlocks the Stealth Bomber. Needs Strategic Bomber Upgrade (Heavy Bomber) and Stealth Airframes (Strike Fighter) | $327M, 20 mat, 95 rare | 9 |
| 16 | Firepower 1/3 (`stealth_fp`) | Levels | attack +12% in all. Needs Stealth Bomber | $528M, 46 mat, 6 iron, 32 elec, 3 rare | 2 |
| 17 | Protection 1/3 (`stealth_pr`) | Levels | defense +12% in all. Needs Stealth Bomber | $528M, 46 mat, 6 iron, 32 elec, 3 rare | 2 |
| 19 | Enlarged Bomb Bay (`stealth_bay`) | Upgrade | bomb load 60% to 75% of a Heavy Bomber’s. Needs Stealth Bomber | $223M, 20 mat, 29 rare | 3 |
| 21 | Flying-Wing Tanks (`stealth_rng`) | Upgrade | range +4 hexes. Needs Stealth Bomber | $223M, 20 mat, 29 rare | 3 |
| 23 | Firepower 2/3 (`stealth_fp`) | Levels | attack +25% in all | $792M, 69 mat, 9 iron, 48 elec, 5 rare | 2 |
| 24 | Protection 2/3 (`stealth_pr`) | Levels | defense +25% in all | $792M, 69 mat, 9 iron, 48 elec, 5 rare | 2 |
| 29 | Firepower 3/3 (`stealth_fp`) | Levels | attack +40% in all | $1056M, 92 mat, 12 iron, 64 elec, 8 rare | 3 |
| 30 | Protection 3/3 (`stealth_pr`) | Levels | defense +40% in all | $1056M, 92 mat, 12 iron, 64 elec, 8 rare | 3 |

**Maritime Patrol Aircraft**: 11 steps, 166 rare materials, $1638M, 34 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 2 | Maritime Patrol Aircraft (`u_mpa`) | Unlock | unlocks the Maritime Patrol Aircraft | $97M, 20 mat, 31 rare | 4 |
| 4 | Firepower 1/3 (`mpa_fp`) | Levels | attack +12% in all. Needs Maritime Patrol Aircraft | $118M, 24 mat, 9 elec, 3 rare | 2 |
| 5 | Protection 1/3 (`mpa_pr`) | Levels | defense +12% in all. Needs Maritime Patrol Aircraft | $118M, 24 mat, 9 elec, 3 rare | 2 |
| 8 | Sonobuoy Field 1/2 (`mpa_sonar`) | Upgrade | detection radius +20%. Needs Maritime Patrol Aircraft | $69M, 20 mat, 16 rare | 3 |
| 10 | Homing Torpedoes (`mpa_torp`) | Upgrade | attack +2. Needs Maritime Patrol Aircraft | $69M, 20 mat, 16 rare | 3 |
| 11 | Firepower 2/3 (`mpa_fp`) | Levels | attack +25% in all | $178M, 36 mat, 13 elec, 5 rare | 2 |
| 12 | Protection 2/3 (`mpa_pr`) | Levels | defense +25% in all | $178M, 36 mat, 13 elec, 5 rare | 2 |
| 14 | Sonobuoy Field 2/2 (`mpa_sonar`) | Upgrade | +40% | $114M, 30 mat, 22 rare | 4 |
| 15 | Long-Endurance Patrol Aircraft (`mpa_g2`), picture `u-mpa-2` | Generation | attack +1, health +2, patrols 18 h (was 12 h). Needs Maritime Patrol Aircraft | $223M, 50 mat, 22 elec, 49 rare | 6 |
| 18 | Firepower 3/3 (`mpa_fp`) | Levels | attack +40% in all. Needs generation 2 | $237M, 48 mat, 18 elec, 8 rare | 3 |
| 19 | Protection 3/3 (`mpa_pr`) | Levels | defense +40% in all. Needs generation 2 | $237M, 48 mat, 18 elec, 8 rare | 3 |

**AWACS**: 8 steps, 163 rare materials, $1384M, 28 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 5 | AWACS (`u_awacs`) | Unlock | unlocks the AWACS | $116M, 20 mat, 36 rare | 5 |
| 8 | Protection 1/3 (`awacs_pr`) | Levels | defense +12% in all. Needs AWACS | $154M, 26 mat, 14 elec, 3 rare | 2 |
| 9 | High-Power Radar 1/2 (`awacs_radar`) | Upgrade | radar radius +15%. Needs AWACS | $83M, 20 mat, 17 rare | 3 |
| 12 | Fighter Data Link (`awacs_link`) | Upgrade | fighters under it fight 35% better (was 25%). Needs AWACS | $83M, 20 mat, 17 rare | 3 |
| 15 | Protection 2/3 (`awacs_pr`) | Levels | defense +25% in all | $230M, 39 mat, 22 elec, 5 rare | 2 |
| 15 | High-Power Radar 2/2 (`awacs_radar`) | Upgrade | +30% | $140M, 30 mat, 23 rare | 4 |
| 17 | Phased-Array AWACS (`awacs_g2`), picture `u-awacs-2` | Generation | defense +1, health +2, identifies forces within half its radius. Needs AWACS | $271M, 50 mat, 36 elec, 54 rare | 6 |
| 21 | Protection 3/3 (`awacs_pr`) | Levels | defense +40% in all. Needs generation 2 | $307M, 52 mat, 29 elec, 8 rare | 3 |

### Navy

*Sea control, convoys and the silent service.* Banner picture: `u-destroyer`.

| Day | Frigate | Cruiser | Aircraft Carrier | Attack Submarine |
|---|---|---|---|---|
| 1 | (standard); Naval Gunnery | (standard) |  | (standard) |
| 2 |  |  |  | Heavy Torpedoes 1 |
| 3 | Firepower 1 | Firepower 1; Naval Gunnery |  | Firepower 1 |
| 4 | Protection 1 | Protection 1 |  | Protection 1 |
| 6 | Towed Sonar |  |  |  |
| 7 |  |  | UNLOCK | Quiet Drive 1 |
| 9 | Area Air Defence |  | Firepower 1 |  |
| 10 | Firepower 2 | Firepower 2 | Protection 1 | Firepower 2; Heavy Torpedoes 2 |
| 11 | Protection 2 | Protection 2; Long-Range Bombardment | Flight-Deck Crews 1 | Protection 2 |
| 13 |  |  | Nuclear Propulsion | Quiet Drive 2 |
| 14 | GEN 2 |  |  | GEN 2 |
| 15 |  | GEN 2 |  |  |
| 16 |  |  | Firepower 2; Flight-Deck Crews 2 |  |
| 17 | Firepower 3 |  | Protection 2 | Firepower 3 |
| 18 | Protection 3 | Firepower 3 | GEN 2 | Protection 3 |
| 19 |  | Protection 3 |  |  |
| 22 |  |  | Firepower 3 |  |
| 23 |  |  | Protection 3 |  |

**Frigate**: 10 steps, 120 rare materials, $1090M, 29 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 1 | Frigate (`u_frig`) | Unlock | standard issue: known from day one | free | - |
| 1 | Naval Gunnery (`frig_gun`) | Upgrade | attack +1 | $56M, 20 mat, 15 rare | 3 |
| 3 | Firepower 1/3 (`frig_fp`) | Levels | attack +12% in all | $83M, 18 mat, 12 iron, 3 elec, 3 rare | 2 |
| 4 | Protection 1/3 (`frig_pr`) | Levels | defense +12% in all | $83M, 18 mat, 12 iron, 3 elec, 3 rare | 2 |
| 6 | Towed Sonar (`frig_sonar`) | Upgrade | hears submarines two sea zones away | $56M, 20 mat, 15 rare | 3 |
| 9 | Area Air Defence (`frig_aa`) | Upgrade | defense +1, damage to aircraft 1.8x to 2.1x | $56M, 20 mat, 15 rare | 3 |
| 10 | Firepower 2/3 (`frig_fp`) | Levels | attack +25% in all | $125M, 27 mat, 18 iron, 5 elec, 5 rare | 2 |
| 11 | Protection 2/3 (`frig_pr`) | Levels | defense +25% in all | $125M, 27 mat, 18 iron, 5 elec, 5 rare | 2 |
| 14 | Guided-Missile Frigate (`frig_g2`), picture `u-frig-2` | Generation | attack +2, defense +1, health +3 | $174M, 50 mat, 24 iron, 8 elec, 43 rare | 6 |
| 17 | Firepower 3/3 (`frig_fp`) | Levels | attack +40% in all. Needs generation 2 | $166M, 36 mat, 24 iron, 6 elec, 8 rare | 3 |
| 18 | Protection 3/3 (`frig_pr`) | Levels | defense +40% in all. Needs generation 2 | $166M, 36 mat, 24 iron, 6 elec, 8 rare | 3 |

**Cruiser**: 9 steps, 109 rare materials, $1285M, 26 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 1 | Cruiser (`u_crui`) | Unlock | standard issue: known from day one | free | - |
| 3 | Firepower 1/3 (`crui_fp`) | Levels | attack +12% in all | $106M, 22 mat, 20 iron, 5 elec, 3 rare | 2 |
| 3 | Naval Gunnery (`crui_gun`) | Upgrade | attack +2 | $65M, 20 mat, 15 rare | 3 |
| 4 | Protection 1/3 (`crui_pr`) | Levels | defense +12% in all | $106M, 22 mat, 20 iron, 5 elec, 3 rare | 2 |
| 10 | Firepower 2/3 (`crui_fp`) | Levels | attack +25% in all | $158M, 33 mat, 30 iron, 7 elec, 5 rare | 2 |
| 11 | Protection 2/3 (`crui_pr`) | Levels | defense +25% in all | $158M, 33 mat, 30 iron, 7 elec, 5 rare | 2 |
| 11 | Long-Range Bombardment (`crui_rng`) | Upgrade | coastal bombardment 30% stronger | $65M, 20 mat, 15 rare | 3 |
| 15 | Missile Cruiser (`crui_g2`), picture `u-crui-2` | Generation | attack +2, health +4 | $205M, 50 mat, 40 iron, 12 elec, 47 rare | 6 |
| 18 | Firepower 3/3 (`crui_fp`) | Levels | attack +40% in all. Needs generation 2 | $211M, 44 mat, 40 iron, 10 elec, 8 rare | 3 |
| 19 | Protection 3/3 (`crui_pr`) | Levels | defense +40% in all. Needs generation 2 | $211M, 44 mat, 40 iron, 10 elec, 8 rare | 3 |

**Aircraft Carrier**: 11 steps, 196 rare materials, $2633M, 36 research days in all. Family line (dashed, no requirement) from the Cruiser.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 7 | Aircraft Carrier (`u_carr`) | Unlock | unlocks the Aircraft Carrier | $142M, 20 mat, 43 rare | 6 |
| 9 | Firepower 1/3 (`carr_fp`) | Levels | attack +12% in all. Needs Aircraft Carrier | $198M, 27 mat, 32 iron, 8 elec, 3 rare | 2 |
| 10 | Protection 1/3 (`carr_pr`) | Levels | defense +12% in all. Needs Aircraft Carrier | $198M, 27 mat, 32 iron, 8 elec, 3 rare | 2 |
| 11 | Flight-Deck Crews 1/2 (`carr_deck`) | Upgrade | wings aboard repair 25% a day (was 20%). Needs Aircraft Carrier | $99M, 20 mat, 18 rare | 3 |
| 13 | Nuclear Propulsion (`carr_spd`) | Upgrade | speed +0.8. Needs Aircraft Carrier | $99M, 20 mat, 18 rare | 3 |
| 16 | Firepower 2/3 (`carr_fp`) | Levels | attack +25% in all | $298M, 41 mat, 48 iron, 12 elec, 5 rare | 2 |
| 16 | Flight-Deck Crews 2/2 (`carr_deck`) | Upgrade | 30% a day | $174M, 30 mat, 24 rare | 4 |
| 17 | Protection 2/3 (`carr_pr`) | Levels | defense +25% in all | $298M, 41 mat, 48 iron, 12 elec, 5 rare | 2 |
| 18 | Supercarrier (`carr_g2`), picture `u-carr-2` | Generation | defense +2, health +6. Needs Aircraft Carrier | $333M, 50 mat, 64 iron, 20 elec, 61 rare | 6 |
| 22 | Firepower 3/3 (`carr_fp`) | Levels | attack +40% in all. Needs generation 2 | $397M, 54 mat, 64 iron, 16 elec, 8 rare | 3 |
| 23 | Protection 3/3 (`carr_pr`) | Levels | defense +40% in all. Needs generation 2 | $397M, 54 mat, 64 iron, 16 elec, 8 rare | 3 |

**Attack Submarine**: 11 steps, 142 rare materials, $1132M, 34 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 1 | Attack Submarine (`u_sub`) | Unlock | standard issue: known from day one | free | - |
| 2 | Heavy Torpedoes 1/2 (`sub_torp`) | Upgrade | attack +1 | $54M, 20 mat, 14 rare | 3 |
| 3 | Firepower 1/3 (`sub_fp`) | Levels | attack +12% in all | $77M, 17 mat, 10 iron, 3 elec, 3 rare | 2 |
| 4 | Protection 1/3 (`sub_pr`) | Levels | defense +12% in all | $77M, 17 mat, 10 iron, 3 elec, 3 rare | 2 |
| 7 | Quiet Drive 1/2 (`sub_quiet`) | Upgrade | defense +1 | $54M, 20 mat, 14 rare | 3 |
| 10 | Firepower 2/3 (`sub_fp`) | Levels | attack +25% in all | $115M, 26 mat, 15 iron, 5 elec, 5 rare | 2 |
| 10 | Heavy Torpedoes 2/2 (`sub_torp`) | Upgrade | attack +1 more | $83M, 30 mat, 20 rare | 4 |
| 11 | Protection 2/3 (`sub_pr`) | Levels | defense +25% in all | $115M, 26 mat, 15 iron, 5 elec, 5 rare | 2 |
| 13 | Quiet Drive 2/2 (`sub_quiet`) | Upgrade | defense +1 more | $83M, 30 mat, 20 rare | 4 |
| 14 | Nuclear Attack Submarine (`sub_g2`), picture `u-sub-2` | Generation | attack +1, health +3, speed +1.2 | $166M, 50 mat, 20 iron, 8 elec, 42 rare | 6 |
| 17 | Firepower 3/3 (`sub_fp`) | Levels | attack +40% in all. Needs generation 2 | $154M, 34 mat, 20 iron, 6 elec, 8 rare | 3 |
| 18 | Protection 3/3 (`sub_pr`) | Levels | defense +40% in all. Needs generation 2 | $154M, 34 mat, 20 iron, 6 elec, 8 rare | 3 |

### Strategic Weapons

*Missiles, the shield against them, eyes in orbit.* Banner picture: `u-missile-launcher`.

| Day | Cruise Missile | Ballistic Missile | Missile Defence | Satellites |
|---|---|---|---|---|
| 1 | UNLOCK |  |  |  |
| 5 |  |  |  | Reconnaissance Satellites 1 |
| 6 |  | UNLOCK |  |  |
| 7 | Cruise Missile Range 1 |  |  |  |
| 9 | Cruise Missile Speed 1 |  | Anti-Missile Shield 1 |  |
| 11 |  | Ballistic Missile Range 1 |  | Reconnaissance Satellites 2 |
| 13 | Cruise Missile Range 2 |  |  |  |
| 14 |  | Heavier Warhead |  |  |
| 15 | Cruise Missile Speed 2 |  | Anti-Missile Shield 2 |  |
| 17 |  | Ballistic Missile Range 2 |  | Reconnaissance Satellites 3 |
| 21 |  |  | Anti-Missile Shield 3 |  |

**Cruise Missile**: 5 steps, 131 rare materials, $536M, 24 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 1 | Cruise Missiles (`msl1`) | Unlock | Missile Silos can build Cruise Missiles | $96M, 20 mat, 31 rare | 6 |
| 7 | Cruise Missile Range 1/2 (`cm_rng`) | Upgrade | range 28 to 32 hexes. Needs Cruise Missiles | $90M, 30 mat, 20 rare | 4 |
| 9 | Cruise Missile Speed 1/2 (`cm_spd`) | Upgrade | speed 9 to 11: less time for the defences. Needs Cruise Missiles | $90M, 30 mat, 20 rare | 4 |
| 13 | Cruise Missile Range 2/2 (`cm_rng`) | Upgrade | to 36 hexes | $130M, 45 mat, 30 rare | 5 |
| 15 | Cruise Missile Speed 2/2 (`cm_spd`) | Upgrade | to 13 | $130M, 45 mat, 30 rare | 5 |

**Ballistic Missile**: 4 steps, 188 rare materials, $644M, 25 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 6 | Ballistic Missiles (`msl2`) | Unlock | Silos can build Ballistic Missiles. Needs Cruise Missiles | $144M, 35 mat, 64 rare | 8 |
| 11 | Ballistic Missile Range 1/2 (`bm_rng`) | Upgrade | range 90 to 102 hexes. Needs Ballistic Missiles | $140M, 45 mat, 34 rare | 5 |
| 14 | Heavier Warhead (`bm_pow`) | Upgrade | power 16 to 19. Needs Ballistic Missiles | $170M, 60 mat, 44 rare | 6 |
| 17 | Ballistic Missile Range 2/2 (`bm_rng`) | Upgrade | to 114 hexes | $190M, 60 mat, 46 rare | 6 |

**Missile Defence**: 3 steps, 236 rare materials, $522M, 20 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 9 | Anti-Missile Shield 1/3 (`msl3`) | Upgrade | your SAMs and Frigates intercept missiles twice as well. Needs Ballistic Missiles | $132M, 60 mat, 96 rare | 7 |
| 15 | Anti-Missile Shield 2/3 (`msl3`) | Upgrade | 2.5 times as well | $170M, 60 mat, 60 rare | 6 |
| 21 | Anti-Missile Shield 3/3 (`msl3`) | Upgrade | 3 times as well | $220M, 80 mat, 80 rare | 7 |

**Satellites**: 3 steps, 173 rare materials, $470M, 17 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 5 | Reconnaissance Satellites 1/3 (`sat1`) | Upgrade | launch up to 3 spy satellites from a silo or your capital: each sweeps the globe once a day. Needs Cruise Missiles | $120M, 35 mat, 61 rare | 6 |
| 11 | Reconnaissance Satellites 2/3 (`sat1`) | Upgrade | up to 4 satellites | $150M, 50 mat, 48 rare | 5 |
| 17 | Reconnaissance Satellites 3/3 (`sat1`) | Upgrade | up to 5, each with a wider swath | $200M, 70 mat, 64 rare | 6 |

### Command & Logistics

*Advantages for every force you field.* Banner picture: `u-supply-truck`.

| Day | Supply | Engineers | Landings | Medical |
|---|---|---|---|---|
| 1 | Motorized Supply 1 |  |  |  |
| 2 |  | Combat Engineers 1 |  |  |
| 3 |  |  | Amphibious Doctrine 1 |  |
| 4 |  |  |  | Field Hospitals 1 |
| 10 | Motorized Supply 2 |  |  |  |
| 11 |  | Combat Engineers 2 |  |  |
| 12 |  |  | Amphibious Doctrine 2 |  |
| 13 |  |  |  | Field Hospitals 2 |

**Supply**: 2 steps, 57 rare materials, $176M, 9 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 1 | Motorized Supply 1/2 (`log1`) | Upgrade | all forces move 20% faster; opens high-speed rail | $66M, 20 mat, 27 rare | 4 |
| 10 | Motorized Supply 2/2 (`log1`) | Upgrade | all forces move 30% faster | $110M, 30 mat, 30 rare | 5 |

**Engineers**: 2 steps, 61 rare materials, $198M, 10 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 2 | Combat Engineers 1/2 (`log2`) | Upgrade | capture 30% faster; forts cost half; roads and railways 25% cheaper and faster to build | $78M, 20 mat, 29 rare | 5 |
| 11 | Combat Engineers 2/2 (`log2`) | Upgrade | capture 40% faster; roads and railways 35% cheaper and faster to build | $120M, 30 mat, 32 rare | 5 |

**Landings**: 2 steps, 70 rare materials, $254M, 13 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 3 | Amphibious Doctrine 1/2 (`nav3`) | Upgrade | troops landing from the sea fight at 90% instead of 67% on their first day | $114M, 20 mat, 34 rare | 7 |
| 12 | Amphibious Doctrine 2/2 (`nav3`) | Upgrade | they fight at full strength on their first day | $140M, 30 mat, 36 rare | 6 |

**Medical**: 2 steps, 72 rare materials, $252M, 14 research days in all.

| Day | Node (id) | Type | Effect | Price | Days |
|---|---|---|---|---|---|
| 4 | Field Hospitals 1/2 (`log3`) | Upgrade | your forces take 15% less damage | $102M, 20 mat, 32 rare | 7 |
| 13 | Field Hospitals 2/2 (`log3`) | Upgrade | 20% less damage | $150M, 30 mat, 40 rare | 7 |

<!-- TREE:END -->

## 5. Prices and times

Prices come from formulas on the unit's own money price `w` (`UNITS[t].cost`), so a dear unit is dear to improve. They are in `tools/research-proto.js` (`P`).

| Step | Money | Materials | Iron / electronics | Rare materials | Research days |
|---|---|---|---|---|---|
| Unlock | 30 + 0.9 w | 20 | - | 12 + w/4 | 3 to 9, set per unit |
| Upgrade, level 1 / 2 / 3 | 25 + 0.6 w x level | 20 / 30 / 45 | - | 12 / 18 / 26, plus w/20 | 3 / 4 / 5 |
| Firepower or Protection, level 1 / 2 / 3 | 0.8 w x 2 / 3 / 4 | half of the old Mark's | half of the old Mark's | 3 / 5 / 8 | 2 / 2 / 3 |
| Generation 2 | 60 + 2.2 w | 50 | twice the unit's own | 30 + w/4 | 6 |
| Generation 3 | 1.5 x Generation 2 | 80 | twice the unit's own | 1.7 x Generation 2 | 8 |
| UAV IV, UAV V | 2 x, 2.4 x | 80 | twice the unit's own | 2.2 x, 2.6 x | 8, 9 |
| Strategic Weapons, Command & Logistics | first levels keep today's prices and days; new levels are listed in section 4 | | | | |

Why these shapes:

- **Rare materials price the science, not the engineering.** Unlocks, upgrades and generations cost real rare materials (13 to 95 a step). Firepower and Protection cost money, materials, iron and electronics, and only 3 to 8 rare materials, as Marks do today. A nation without a rare-earth city (about 2 a day) can still hone the units it has; it cannot have every unit. That is the scarcity the economy was built for.
- **Unlocks are cheaper than today, the full line is dearer.** Today a unit unlock costs 25 to 37 rare materials, or far more when it sits at the end of a chain (the IFV needs 76, Special Forces 169, Rocket Artillery 82). In the new tree every unlock stands alone at 19 to 45 (the Stealth Bomber 95). What used to be one big project is now several small ones.
- **Two slots.** The whole tree is 950 research days. Two slots that never idle give 120 by day 60.

Totals, by category:

<!-- BALANCE:BEGIN (written by tools/research-proto.js --write) -->
Whole tree: 170 nodes, 289 research steps, 4967 rare materials, $38996M, 9002 materials, 973 research days (487 days with both slots never idle).
The tree before the redesign: 38 projects, 1962 rare materials, $3774M, 228 research days.

| Category | Lines | Steps | Rare materials | Money | Research days |
|---|---|---|---|---|---|
| Infantry Corps | 3 | 36 | 505 | $2878M | 115 |
| Armoured Forces | 2 | 23 | 328 | $1923M | 72 |
| Artillery & Air Defence | 4 | 40 | 490 | $3677M | 119 |
| Air Assault | 2 | 21 | 279 | $2113M | 65 |
| Tactical Air | 3 | 34 | 505 | $4741M | 106 |
| Unmanned Systems | 3 | 33 | 613 | $3318M | 116 |
| Strategic Air | 4 | 38 | 692 | $11154M | 123 |
| Navy | 4 | 41 | 567 | $6140M | 125 |
| Strategic Weapons | 4 | 15 | 728 | $2172M | 86 |
| Command & Logistics | 4 | 8 | 260 | $880M | 46 |

| Plan | Nation | Steps done by day 30 | Of the chosen line by day 30 | Line finished on day | Steps done by day 60 |
|---|---|---|---|---|---|
| Armor power: unlock IFV, Interceptor, Gunship and Rocket Artillery, then the whole Main Battle Tank line | No rare-earth city (2 a day) | 3 of 16 | 0 of 12 (0%) | not by day 60 | 7 of 16 |
| Armor power: unlock IFV, Interceptor, Gunship and Rocket Artillery, then the whole Main Battle Tank line | Typical, one rare-earth city (8 a day) | 12 of 16 | 8 of 12 (67%) | 50 | 16 of 16 |
| Armor power: unlock IFV, Interceptor, Gunship and Rocket Artillery, then the whole Main Battle Tank line | Rich, two rare-earth cities (18 a day) | 15 of 16 | 11 of 12 (92%) | 35 | 16 of 16 |
| Air power: unlock Interceptor, Strike Fighter, UAV and Air Superiority Fighter, then the whole Strike Fighter line | No rare-earth city (2 a day) | 3 of 15 | 1 of 12 (8%) | not by day 60 | 6 of 15 |
| Air power: unlock Interceptor, Strike Fighter, UAV and Air Superiority Fighter, then the whole Strike Fighter line | Typical, one rare-earth city (8 a day) | 11 of 15 | 8 of 12 (67%) | 47 | 15 of 15 |
| Air power: unlock Interceptor, Strike Fighter, UAV and Air Superiority Fighter, then the whole Strike Fighter line | Rich, two rare-earth cities (18 a day) | 15 of 15 | 12 of 12 (100%) | 28 | 15 of 15 |
| Hone what you field: no unlocks; Firepower and Protection 1 and 2 for Infantry and Artillery, then the whole Main Battle Tank line | No rare-earth city (2 a day) | 12 of 20 | 4 of 12 (33%) | not by day 60 | 16 of 20 |
| Hone what you field: no unlocks; Firepower and Protection 1 and 2 for Infantry and Artillery, then the whole Main Battle Tank line | Typical, one rare-earth city (8 a day) | 16 of 20 | 8 of 12 (67%) | 46 | 20 of 20 |
| Hone what you field: no unlocks; Firepower and Protection 1 and 2 for Infantry and Artillery, then the whole Main Battle Tank line | Rich, two rare-earth cities (18 a day) | 19 of 20 | 11 of 12 (92%) | 36 | 20 of 20 |

| Everything, as it opens | Steps by day 30 | Steps by day 60 | Share of the tree by day 60 |
|---|---|---|---|
| No rare-earth city (2 a day) | 5 | 7 | 2% |
| Typical, one rare-earth city (8 a day) | 10 | 26 | 9% |
| Rich, two rare-earth cities (18 a day) | 16 | 42 | 15% |

<!-- BALANCE:END -->

## 6. Balance: what was measured

### 6.1 What nations earn today

Three 60-day games of the economy-v1 rules without a browser (the method of `tools/headless.js`; seeds 12345, 7 and 99; the computer plays all 15 nations; 45 nation-games). Lowest / middle / highest nation:

| Day | Rare materials a day | Money a day (after upkeep) | Projects researched | Rare materials spent on research | Money spent on research |
|---|---|---|---|---|---|
| 10 | 1.7 / 8.4 / 19.1 | 121 / 181 / 555 | 1 / 2 / 3 | 31 / 56 / 87 | 90 / 144 / 252 |
| 20 | 1.5 / 8.4 / 18.5 | 65 / 138 / 460 | 2 / 5 / 7 | 51 / 140 / 219 | 108 / 384 / 552 |
| 30 | 1.6 / 8.2 / 21.1 | 39 / 107 / 359 | 3 / 7 / 10 | 80 / 210 / 369 | 180 / 570 / 834 |
| 60 | 1.5 / 8.4 / 18.4 | -9 / 103 / 337 | 5 / 15 / 20 | 138 / 481 / 698 | 342 / 1,260 / 1,704 |

What this says:

- Rare materials are the limit, as intended. The middle nation earns about 8 a day and puts about 7 a day into research. A nation without a rare-earth city earns under 2 and researches 3 projects in 30 days.
- The middle nation uses about 39 of its 60 slot-days by day 30. The slots are not the limit today; rare materials are.
- No computer player bought a single Mark in 60 days in any of the three games. The rule asks for $300M in hand, and the computer rarely holds that much (middle nation: about $130M). Marks are in practice a player-only bonus today. Putting them in the tree, where the computer researches them like anything else, fixes that.

### 6.2 What the new prices give

The budget simulation in `tools/research-proto.js` plays three kinds of nation through a wish list with two slots, the day gates, the prerequisites and their income. Rare materials for research: 75% of income (the measured share) plus the 40 every nation starts with. Money for research: $25M, $40M and $80M a day plus $150M at the start. It does not model buying rare materials on the market, which today's computer players do when they have the money; a nation that trades for them does better than its row.

The tables are in section 5 (written by the tool). Read them like this:

- **Typical nation** (one rare-earth city): four unit unlocks and 8 of the 12 steps of the tank line by day 30, the line complete around day 46 to 50 (its Generation 3 only opens on day 22). The owner's target, most of one line by day 30, is met at 67%.
- **Rich nation** (two rare-earth cities): the same plan is 92% done by day 30. It can afford a second line by day 60, not a third.
- **Nation without rare earth**: three unlocks by day 30 if it insists on new units, or twelve steps if it hones what it has (Firepower and Protection for infantry and artillery, then tank upgrades). It has a real choice instead of nothing to do.
- **Whole tree**: 12% (typical) to 15% (rich) by day 60. Out of reach in a normal game.

Compared with today: by day 30 the middle nation has 7 of 38 projects (18% of the tree) and 15 of 38 by day 60 (39%); a long game finishes the tree. After the redesign it has 10 to 16 steps of 285 by day 30, and choosing what to research matters all game.

### 6.3 What the tool checks

`node tools/research-proto.js` fails (exit 1) unless:

- every prerequisite is in the same unit line, or both are in the missile line, or it is the Stealth Bomber;
- no node opens before its prerequisite, and every level opens after the one before it;
- every one of today's 38 projects has an equivalent, the equivalent gives at least every stat bonus the project gives today, and unlocks every unit it unlocks today;
- every unit type has a line and a Protection node (for its Marks), and the three level percentages equal Marks II, III and IV.

### 6.4 Open balance questions for the build

- Generations add health, which nothing raises today. Fully researched, a Main Battle Tank goes from attack 14 / defense 8.4 / health 14 today to 16.8 / 11.2 / 21 (after day 22, at a price of 196 rare materials for the whole line). Battles between fully upgraded armies last longer. The build should replay the combat tests and adjust generation health if sieges drag.
- Upgrades described in words rather than a stat (terrain handling, vision, drop range, artillery reach, swarm size) each need a small rule. They are the last phase of the build (section 10) and can be cut one by one without touching the tree's shape.

## 7. Old saves: nothing is lost

Done once when an old save is loaded (a migration next to `ecoMigrate` in `rules/state.js`), then the save is in the new format.

### 7.1 Researched projects

`N.tech` keeps its shape (a map of id to a number), but the number becomes the level. Each of today's projects converts to the nodes below. An entry with `@` adds **one level** to that node; a plain entry sets the node to level 1.

| Today's project | Becomes |
|---|---|
| `inf1` Ceramic Body Armor | `inf_armor`, `at_armor` |
| `inf2` Mechanized Infantry | `inf_g2` (Generation 2), one level of `at_warhead`, `u_ifv` |
| `inf3` Special Forces | `inf_g3` (Generation 3), `u_spec` |
| `tank1` Composite Armor | `tank_armor` |
| `tank2` Smoothbore Main Gun | `tank_gun`, `ifv_gun`, one level of `at_warhead` |
| `tank3` Turbine Engines | `tank_eng` |
| `art1` Counter-Battery Radar | `art_radar` |
| `art2` Rocket Artillery | `art_shell`, `u_mlrs` |
| `art3` Guided Shells | `art_guided` |
| `air1` Jet Engines | `u_jet`, `u_int` |
| `air2` Precision Munitions | `jet_pgm`, `int_msl` |
| `air3` Stealth Airframes | `jet_lo` |
| `nav1` Naval Gunnery | `frig_gun`, `crui_gun` |
| `nav2` Carrier Aviation | `u_carr` |
| `asf1`, `awacs1`, `mpa1`, `bomb1`, `jam1`, `swarm1`, `sdrone1`, `heli1`, `para1`, `drone1` | the unit's unlock: `u_asf`, `u_awacs`, `u_mpa`, `u_bomb`, `u_jam`, `u_swarm`, `u_sdrone`, `u_heli`, `u_para`, `u_drone` |
| `bomb2` Strategic Bomber Upgrade | `bomb_up` |
| `bomb3` Stealth Bombers | `u_stealth` |
| `uav2`, `uav3`, `uav4`, `uav5` | `drone_g2`, `drone_g3`, `drone_g4`, `drone_g5` (UAV II to V are the Recon UAV's generations) |
| `log1`, `log2`, `log3`, `nav3`, `msl1`, `msl2`, `msl3`, `sat1` | unchanged: same id, level 1 |
| `eco1`, `eco2`, `eco3` (the removed Economy branch) | unchanged: the nation keeps the bonus, as today |

Every stat bonus is the same or better. The only differences are in the player's favour: Mechanized Infantry also brings +2 health, Assault Infantry +2 health (the generations carry health). The tool proves the "same or better" for all 38 projects.

A converted node keeps its level whatever the new day gates and prerequisites say: an old save on day 5 that has Strategic Bombers keeps them although the unlock now opens on day 6, and a Mark IV unit keeps level 3 without Generation 2.

### 7.2 Marks

`N.mk[t] = m` (Mark II, III, IV) becomes level `m - 1` of both `<t>_fp` (Firepower) and `<t>_pr` (Protection): +12%, +25%, +40% attack and defense, the very factors of `MARK_F`. The AWACS has no attack, so it has no Firepower node and gets Protection only. `N.mk` is then removed.

### 7.3 Things in progress

- **A project running in a slot** keeps running under its old id with its hours left. When it finishes it converts by the table above. It was paid for at the old price; nothing is charged or refunded.
- **A Mark upgrade running in the engineering slot** (`N.eng`) keeps running to the end in the background and then grants the two levels. The screen shows it as a third, small "Engineering (from your earlier game)" bar until it is done. No new one can be started.
- **Saves from before two slots** (`N.rqueue`): today's `rqueueMigrate` runs first, as it does now.

### 7.4 Tests the build must add

- `.test/v4research-oldsave.js`: load a stored economy-v1 save that has projects, Marks, a running project and a running Mark; check every unit's attack, defense, speed and health before and after (never lower), every unit that could be built still can, and the running items finish and convert.
- The existing old-save tests (`save`, `v3air-oldsave`) still pass.

## 8. Computer players

Today (`rules/ai.js`, `aiTurn`): when a slot is free the computer makes a weighted random pick among the open projects, sticks with it for a day (four days for a badly needed counter), buys missing rare materials on the market at up to 1.6 times the base price, and starts it. Weights rise with what the enemy fields. Marks are bought in `rules/tick.js` only with $300M in hand, which almost never happens (section 6.1).

The new rules keep that skeleton and change what is weighed:

1. **Only what is open.** The candidates are the steps whose day has come and whose spine node is researched. Day gates do the pacing; the computer needs no calendar of its own.
2. **Carry today's weights over.** Each node takes the weight of the project it came from (the table in 7.1): the Air Superiority Fighter unlock keeps `asf1`'s weight, Wideband Jamming and the Jammer unlock keep `jam1`'s, the Stealth Bomber keeps `aiStealthOk`, and so on. Nothing about counters (bombers call for fighters, drones for jammers, submarines for patrol aircraft) changes.
3. **Slot 1 thinks about new things, slot 2 hones.** When both slots are free, one pick comes from unlocks, upgrades and generations ("science"), the other from Firepower and Protection ("engineering") if any is open for a unit type it fields. With a single free slot it takes whichever kind is not running. This keeps the computer from sitting on rare materials with an idle slot: engineering steps cost 3 to 8.
4. **Hone what you field.** Engineering and generation weights are proportional to the money value of the units of that type in service (today's Mark rule: `count x unit price`), so the computer improves its big arm first. A generation gets twice the weight of a level once it is open. No $300M threshold.
5. **Do not research what you cannot build.** A line whose unit needs a building the nation has none of (no Naval Yard and no coast, no Airbase, no Airbase II for bombers) is weighted at 0.3 for its unlock and 0 for everything below it until one unit of the type is in service or in a queue.
6. **Rare-poor nations hone.** The existing rule (a project that five days of rare-material income cannot pay for is weighted at 0.35) stays. With unlocks at 19 to 45 and engineering at 3 to 8, a nation without rare earth drifts to engineering by itself and still saves up for one or two unlocks it badly needs.
7. **Finish lines.** Among science picks, a step in a line where the nation already has two or more upgrades gets +50%: the computer ends up with a recognisable speciality instead of one node everywhere.
8. **Saving and buying** (the `rPick` rule, `aiReserve`, the market purchase) are unchanged.

The build should check with `tools/balance.js` and the headless runs that by day 30 the middle computer nation holds 10 to 16 steps, has at least one generation in its main arm, and that the fighter-against-bomber counters still appear (`asf` counts in `tools/balance.js`).

## 9. The screen

The screen keeps its frame from the layout pass (top bar with the two slots, category banners, a tree view) and changes what the tree view shows. All of it is drawing and input in `index.html`; it asks the rules for the tree, the state of each node and the reasons, and gives one order (`startResearch`).

### 9.1 Top: two slots (as today)

SLOT #1 (teal edge) and SLOT #2 (gold edge), side by side. A running slot shows the node's diamond, its name with the level ("Firepower 2 · Main Battle Tank"), the progress bar and the time left; tapping it opens that node in its category. An empty slot says "Choose a project". Under the slots, only while an old save still has one: the small engineering bar of 7.3.

### 9.2 Category list

Ten banners in the order of section 3. Each: diamond icon on the left, name, role line, the category picture behind, and on the right `researched / total steps`, a thin progress bar, a green "N open" chip when something can be started now, and the "Slot #1" / "Slot #2" chips when a project of that category is running. The "Unit upgrades" banner (Marks) goes away. The note under the list about rare materials stays, and adds: "Firepower and Protection cost few rare materials."

### 9.3 Inside a category: the grid

```
 DAY |  Interceptor   Strike Fighter   Air Superiority (elite)
-----+---------------------------------------------------------
  1  |    <U>              <U>
  3  |    <F>3             <F>3
  4  |    <P>3             <P>3  . . . . . . .  <U>*      (dashed: family line from the Interceptor)
  5  |    <m>              <m>
  7  |    <r>2             <r>2
 10  |                     <s> ======>  (solid: to the Stealth Bomber, shown as a tag at the column edge)
 12  |    <G2>
 14  |                     <G2>
```

- **Day column** on the left, sticky. Only days that hold a node get a row (the grid would otherwise be mostly empty), with a thin gap mark where days are skipped. The row of today's day is highlighted and labelled "Today"; rows above it are fully lit, rows below are dimmer.
- **One column per unit line**, headed by the unit's name, its small picture and the elite badge if it has one. Columns are at least 96 px wide; on a phone the grid scrolls sideways under a sticky header and beside the sticky day column.
- **Nodes are diamonds** on the row of their day (a levelled node on the row of its first level). A solid line runs down the spine: Unlock to Generation 2 to Generation 3. Upgrades hang off the spine to its left and right with short elbow lines, so a row can hold two nodes of one line.
- **Generation diamonds are larger** and hold the unit's picture; upgrades hold a white icon.
- **Sideways branches**: a dashed line from the parent unit's unlock to the related unit's unlock (family, no requirement); a solid line for a real requirement. A requirement from another category (the Stealth Bomber needs Stealth Airframes from Tactical Air) is a tag on the node, "also needs Stealth Airframes (Tactical Air)"; tapping it jumps there.

### 9.4 Node colours and badges

| State | Look |
|---|---|
| Researched (all its levels) | **blue** diamond, check mark |
| Can be researched now (day reached, spine node researched, not running) | **green** diamond. Bright green when you can also pay for it; green with a small coin mark when you cannot yet |
| Locked (day not reached, or the spine node is missing) | **grey** diamond, a lock; its row is its day and the spine line shows what it needs, so under it only its name (and the day of a later level, or "Needs Generation 2" for level 3) |
| Partly levelled | blue, with the badge showing `2/3`; a green ring around it when the next level is open |
| Running | the slot's colour (teal or gold) as a ring that fills with progress |
| Waiting for the other slot | green with a clock mark |

- **Level badge**: a small number in the lower corner of a levelled node: the number of levels while none is researched, `done/total` after.
- **Elite badge**: a star between two wings in the upper corner of the unlock diamond of an elite unit, and beside its name in the column header.
- Colour is never the only signal: check mark, lock and ring carry the same meaning for players who cannot tell blue from green.

### 9.5 Detail card

Tapping a node selects it (it does not start it) and opens the card: at the side on a wide screen, as a bottom sheet on a phone.

- Picture or icon, the name, the unit and category, the elite badge.
- **What it does**, in words and numbers. For a stat: before and after for your nation ("Attack 6 to 9").
- For a levelled node: one line per level with its day, effect, price and time; researched levels ticked, the next one highlighted.
- **Price** with each good coloured red when you are short, and how many days of income the missing rare materials are (as the list note does today).
- **Time**: research days, already adjusted for the doctrine.
- **Needs**: the day ("Opens on day 12, in 3 days") and the spine node, each ticked or not.
- For a generation: the old and the new picture side by side.
- The button: "Research in slot #1" / "#2", or the reason it cannot start, from the rules (`researchWhy`): "Opens on day 12", "Needs Generation 2", "Both slots busy", "Needs 14 more rare materials", "Running in slot #2".

### 9.6 Pictures and icons

- Unit diamonds use the unit's picture through the existing `unitPic`. If the unit-display job's code-drawn unit icons land first, the unlock and generation diamonds use those (a clearer shape in a small diamond) and the detail card keeps the photo.
- Generation pictures: the key `u-<unit>-<generation>` (for example `u-tank-2`). Until that art exists the lookup falls back to the unit's current picture, and the diamond shows a small "II" or "III" so the generation still reads.
- White upgrade icons, all our own drawings, added to the existing `RGLY` set: damage (crosshair burst), health (shield), speed (chevrons), vision (eye), range (arc with arrow), terrain (peak with track), air-transportable (parachute), carrier operations (deck with hook), build (wrench and clock), more missiles (three darts), generation (stacked chevrons).

### 9.7 Rules stay out of the screen

The screen never decides anything. It reads `RNODES` (the tree), and asks the rules: the level a nation has, whether a step is open, why not, its price and time. This is today's split (`researchWhy`, `canResearch`, `startResearch`, `techCost`) with a level added.

## 10. Build plan

In phases, each one playable and committed on its own, the dev build only.

1. **Data and rules, no screen change.** `rules/data.js`: the tree as `RNODES`, built from the compact line list of `tools/research-proto.js` (the prototype's builder moves into the rules; the tool then imports it and keeps its checks). `rules/research.js`: levels (`rLevel(n, id)`), day gates, the spine rule, a slot holds `{id, lv, h, h0}`. `rules/state.js`: `st()` sums flat bonuses over levels and applies the two percentages; `unlocked()` reads the unlock node; the migration of section 7. `has(n, oldId)` keeps working for the old ids through the table of 7.1 while call sites move (`rules/air.js` UAV levels and bomber range, `rules/ai.js`, `rules/movement.js`). Marks code removed. Tests: the old-save test of 7.4, `node tools/headless.js --check`, `tools/split-lint.js`.
2. **Computer players** (section 8), measured with the headless runs and `tools/balance.js`.
3. **The screen** (section 9): category list, grid, colours, badges, detail card. Tests: `tut` and `book` (the tutorial and the field manual name research), `.test/con-verify.js`, a new `.test/v4research.js` that clicks through a category, starts a project in each slot and checks the colours.
4. **Worded upgrades**, one small rule each (terrain handling, vision, drop range, artillery reach, swarm size, sonar, repairs aboard a carrier, missile range and speed). Each can ship or be cut alone.
5. **Art**: generation pictures, as they arrive.

Save format: `N.tech` values become levels; `N.mk` and `N.eng` go; the save version rises by one.

## 11. Later (not in this plan)

- **Officers.** We already have commanders (`rules/combat.js`: up to three per nation, $80M each, five traits, three ranks, attached to a force). Officers as Conflict of Nations has them are units of their own, one per branch, with health and damage upgrades; that is a new unit type and is listed in section 12. A smaller step that fits the existing system and could go into Command & Logistics later: "Staff College" (a fourth, then a fifth commander) and "War College" (new commanders start as General).
- **Seasons** (seasonal special units): no system to hang it on. Not planned.
- **Loadout** (temporary boosts, ammunition types with levels): no system today. It would be a new mechanic (a force carries one ammunition type, bought per battle or per day). Not planned.
- **Chemical and nuclear protection** upgrades: the icon is reserved; the upgrade only makes sense once those warheads exist (section 12).
- **Carrier-capable** as an upgrade: today every air wing may land on a carrier. Making it something to research would take away what players can do now, so the tree has "Flight-Deck Crews" on the carrier's own line instead. If the owner wants carriers limited to naval aircraft, that is a rule change to approve first.

## 12. NEEDS OWNER APPROVAL

Nothing in this section is in the tree above or will be built in this run. Each item is a new unit type, a new weapon, or a balance change large enough that the owner should say yes first. Stats are proposals in the form of `rules/data.js UNITS` (money in $M; build time in hours; attack / defense / health / speed as for today's units).

### 12.1 Balance changes inside this plan

These are part of the design above; say no to any of them and the tree still works.

| Change | Today | Proposed |
|---|---|---|
| Unit unlocks get a first day | every unlock can be started on day 1 | Interceptor, Strike Fighter, IFV, Attack Helicopter, Recon UAV, Cruise Missile day 1; Maritime Patrol day 2; Paratroopers, Jammer day 3; Special Forces, Air Superiority Fighter, Swarm Drones day 4; Rocket Artillery, AWACS day 5; Heavy Bomber, Strike Drone, Ballistic Missile day 6; Aircraft Carrier day 7; Stealth Bomber day 14. Setting every unlock to day 1 is a one-number change per line |
| Marks become research | a third, separate slot; no computer player uses it | Firepower and Protection in the two research slots |
| Generations | none | 24 lines get a Generation 2, infantry and tanks a Generation 3; mostly health |
| IFV, Special Forces, Rocket Artillery | at the end of chains (76, 169 and 82 rare materials) | stand-alone unlocks (20, 25 and 25) |
| Size of the tree | 38 projects, a long game finishes it | 285 steps, 12 to 15% reachable by day 60 |

### 12.2 New ground units

| Unit | Class | Price | Oil / mat / iron / elec / rare | Manpower | Atk / Def / Health / Speed | Build | Upkeep | Needs | First day | Role |
|---|---|---|---|---|---|---|---|---|---|---|
| Armoured Personnel Carrier | armored | $24M | 3 / 3 / 5 / 0 / 0 | 10k | 2 / 4 / 11 / 7 | 30 h | 1.5 | Army Base I | 1 | cheapest armor: carries and shields infantry, weak punch. The IFV would move to day 2 |
| Tank Destroyer | armored | $36M | 5 / 4 / 9 / 0 / 0 | 9k | 5 / 3 / 11 / 6 | 42 h | 2.5 | Army Base I | 1 | 2.2x damage to armor, 0.6x to infantry; cheaper than a tank, loses to infantry |
| Towed Artillery | soft | $24M | 1 / 3 / 5 / 0 / 0 | 10k | 5 / 2 / 7 / 3 | 30 h | 1 | Army Base I | 1 | cheap guns, 1.4x to infantry, slow and fragile. Mobile Artillery would move to day 3 |
| Anti-Aircraft Gun Vehicle | soft | $30M | 2 / 4 / 4 / 2 / 0 | 8k | 4 / 3 / 9 / 5 | 36 h | 1.5 | Army Base I | 1 | 2.2x to aircraft, 2x to swarm drones, short reach (its own province only). Mobile SAM would move to day 2 |
| Scout Vehicle | armored | $26M | 3 / 3 / 4 / 2 / 0 | 6k | 3 / 2 / 8 / 9 | 30 h | 1.5 | Army Base I | 4 | fast eyes: sees one province farther, captures empty land quickly, folds in a fight |

### 12.3 New aircraft

| Unit | Class | Price | Oil / mat / iron / elec / rare | Manpower | Atk / Def / Health / Speed | Range | Build | Upkeep | Needs | First day | Role |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Scout Helicopter | air | $34M | 5 / 5 / 0 / 4 / 0 | 4k | 3 / 3 / 7 / 13 | 6 hexes | 36 h | 2.5 | Airbase I | 1 | cheap spotter and infantry hunter (1.3x to infantry, 0.8x to armor) |
| Naval Helicopter | air | $52M | 8 / 7 / 0 / 8 / 0 | 5k | 5 / 3 / 9 / 12 | 7 hexes | 54 h | 4 | Airbase I, or a carrier | 2 | 2.2x to submarines, finds submerged submarines in its sea zone and the next |

### 12.4 New ships

| Unit | Class | Price | Oil / mat / iron / elec / rare | Manpower | Atk / Def / Health / Speed | Build | Upkeep | Needs | First day | Role |
|---|---|---|---|---|---|---|---|---|---|---|
| Patrol Boat | naval | $28M | 3 / 3 / 6 / 1 / 0 | 3k | 3 / 3 / 8 / 7 | 36 h | 1.5 | Naval Yard I | 1 | coastal waters only (sea zones next to land); cheap convoy escort and coast guard |
| Destroyer | naval | $60M | 8 / 8 / 16 / 6 / 0 | 7k | 6 / 5 / 17 / 6.4 | 78 h | 4 | Naval Yard II | 2 | between Frigate and Cruiser: 1.2x to ships, 1.4x to aircraft, 1.8x to submarines |
| Ballistic-Missile Submarine | naval | $150M | 8 / 14 / 26 / 14 / 8 | 8k | 2 / 3 / 14 / 5 | 132 h | 7 | Naval Yard III | 5 | hidden like the Attack Submarine; carries two sub-launched ballistic missiles; nearly helpless in a fight |

### 12.5 New weapons

| Weapon | Price | Oil / mat / iron / elec / rare | Build | Range / speed / power | Needs | First day | What it does |
|---|---|---|---|---|---|---|---|
| Sub-launched cruise missile | $72M | 10 / 10 / 4 / 10 / 4 | 36 h | 22 hexes / 9 / 7 | Cruise Missiles; an Attack Submarine carries two | 4 | a Cruise Missile fired from a submarine's sea zone; the launch reveals the submarine for 12 h |
| Sub-launched ballistic missile | $170M | 20 / 26 / 10 / 18 / 10 | 72 h | 70 hexes / 22 / 14 | Ballistic Missiles and the Ballistic-Missile Submarine | 8 | a lighter Ballistic Missile with no silo to find and strike first |
| Chemical warhead | +$40M on a missile | + 4 rare | +12 h | the missile's own | Cruise Missiles | 3 | 60% of the blast, no building damage, and a gas cloud for 12 h: forces in the province lose 4% health an hour and fight 20% worse; morale falls; relations with every nation drop. A "protection" upgrade in each ground line would halve it |
| Tactical nuclear warhead | +$220M on a missile | + 20 rare | +36 h | the missile's own | Chemical warhead research | 5 | three times the blast, one or two building levels destroyed, the city loses population, radiation for 48 h (half the gas effect), a heavy hit to relations with everyone |
| ICBM | $420M | 30 / 40 / 16 / 30 / 24 | 144 h | whole map / 30 / 40 | Ballistic Missiles, the nuclear warhead and a Missile Silo III | 12 | the top of the missile line: nuclear only, reaches anywhere, hard to intercept (shield at half effect). Research: 10 days, about 110 rare materials |

The strike-effects work already draws chemical, tactical nuclear and ICBM blasts ("effects only for now" in RELEASES.md); these rows are the rules those effects are waiting for. Chemical and nuclear weapons change the tone of the game and the diplomacy rules, so they want a decision of their own, not a line in a research plan.

### 12.6 Officers

One officer per branch (ground, mechanized, armor, air, naval), each a unit of its own that travels with a force: about $120M, 6 days to appoint, one of each at most, health 12, no attack of its own, +15% attack and defense to its branch's units in the same force, with two researchable levels each of "command" (+5% more per level) and "protection" (health +4 per level). Lost if the force is destroyed; appointed again after 5 days. This overlaps with today's commanders (traits and ranks earned in battle); the owner should choose between replacing commanders, keeping both, or the smaller "Staff College" step of section 11.

### 12.7 Elite units as units of their own

The reference lists an elite helicopter, an elite fighter and an elite submarine as separate units. This plan marks four existing units as elite instead. New elite units (for example a stealth attack helicopter or a quiet hunter submarine) would each be a new unit type with its own art; none is proposed until the owner asks for them.

## 13. As built

What the build does differently from, or adds to, the plan above.

- **Health.** A generation's health is taken as less damage: the damage a unit type takes is multiplied by `base health / researched health` (`hurt()` in `rules/combat.js`). Wounds stay in the unit's base health, so health bars, repairs, merging and old saves need no change. A tank with +4 health (14 to 18) takes 22% less damage.
- **Save format.** The save keeps version 4. A save made under the new tree carries `S.rsv = 2`; one without it is converted once on load (`researchMigrate` in `rules/research.js`). `N.mk` goes; `N.eng` is only ever read from an old save, runs to its end and then gives its two levels.
- **`has(n, id)`** means "holds node `id` at any level". No call site uses an old id any more, so there is no translation table at run time; `R_LEGACY` is used only by the conversion and by a project that was still running in a slot.
- **Rows.** The grid has a row for each day that holds a diamond (a levelled node sits on the day of its first level), not for every day a later level opens; the later levels' days are in the detail card.
- **Lanes.** Inside a column the spine (unlock, generations) is the middle lane, Firepower hangs to its left, Protection to its right, upgrades alternate. A family tie is a dashed line over the top of the columns; the Stealth Bomber's requirement inside Strategic Air is a solid line, its requirement from Tactical Air a tag on the node and a link in the card.
- **Worded upgrades** (phase 4) are all in, one small rule each in `rules/research.js` (`multO`, `rTrainF`, `rDrilled`, `rSpecTerr`, `rSightF`, `rMlrsReach`, `rSamNear`, `rJamF`, `rPack`, `rKoHours`, `rAdF`, `rBombF`, `rMpaR`, `rMpaH`, `rAewR`, `rAewF`, `rDeckRate`, `mslOf`, `rShield`, `rSatMax`, `rSatR`, `dropOnly`, `dropRange`). Rough-ground training applies to a force made up only of trained types. "Sees half a province farther" is a sight radius of 1.3 legs instead of 0.8.
- **Computer players.** As section 8, with two softenings: a line whose unit needs a kind of building the nation has none of at any level (not "no Airbase II") is the one that is held back, so bombers and fighters are still researched before the bigger airbase is built; and upgrades of a unit type the nation does not field are weighted at a quarter rather than zero.
- **Generation pictures.** The Heavy Bomber's generation 2 uses the second bomber picture and UAV IV the armed UAV picture, as before. Every other generation shows the unit's picture in a new paint scheme (generation 2 desert, generation 3 dark grey: `rGenTone` in `index.html`) beside the "II" / "III" tag, in the tree and side by side in the detail card, until its own art (`u-<unit>-<generation>`) exists.
- **Repair 1 (the review of the first build).**
  - **Day 1.** More opens on day 1 so most categories have something to start: the first upgrade of most standard-issue lines (Ceramic Body Armour for both infantry lines, Composite Armour, Counter-Battery Radar, the Frigate's Naval Gunnery) and the unlocks of the Attack Helicopter, the Recon UAV and Cruise Missiles; Maritime Patrol on day 2, the Submarine's Heavy Torpedoes on day 2. On day 1, nine of the ten categories have an open step; Strategic Air opens on day 2.
  - **Command & Logistics** has two levels for each doctrine (Motorized Supply 30% faster, Combat Engineers capture 40% faster and roads 35% cheaper, Amphibious Doctrine full strength on the first day ashore, Field Hospitals 20% less damage; days 10 to 13). The rules read the level (`rMoveF`, `rCapF`, `rRoadF`, `rLandF`, `rHospF` in `rules/research.js`). The screen shows the four in two columns, Logistics and Operations, with a card of their levels beside each diamond; no line joins them, since none needs another.
  - **Old saves with a queued project** (`N.rqueue`, saves from before two slots) are read after the conversion (`rqueueMigrate` now runs after `researchMigrate`): an old project becomes the first of its new nodes that can start, which starts in slot #2; when none can (its day has not come, the money is short), a person's nation gets a dispatch that names the new node and why.
  - **Computer players.** A nation that flies Heavy Bombers weighs the Strategic Bomber Upgrade at 30 or more (it was about 2 against about 100 in all), one that has the Heavy Bomber but flies none yet at 16 with an Airbase II (6 without), and Stealth Airframes at 8 once it has the upgrade. A generation of a unit type that makes up a fifth or more of the forces is saved for (three days: recruiting holds its price back, its goods may be bought at up to twice the base price), and a slot no longer sits idle while the pick waits: with both slots free one takes a cheaper step, with one free a pick that is not saved for lets a cheaper step have it, and no step eats the goods a saved-for pick needs. Measured over three seeds (12345, 7, 99), headless: on day 30 the middle nation holds 15 to 16 steps and 12 to 13 of the 15 nations hold a generation (4 to 5 before). By day 60: 1, 5 and 3 nations hold the Heavy Bomber (4, 5 and 2 before), the Strategic Bomber Upgrade is in 2 nations on seed 7 (from day 45) and in none on the other two, Air Superiority Fighters in 5 to 7 (6 to 12 before), and no nation has the Stealth Bomber yet. The bomber line is now held back mostly by how few nations take the Heavy Bomber itself, a question for the next balance pass. About 30% of the computer's slot-hours are still idle by day 30, mostly for want of materials.
  - **Screen.** Category banners show an aerial photo of the branch's ground (the building pictures) under a slate wash, with the unit picture and a short role line on phones. In a category the top is compact (on a wide screen the two slots sit in the title band) and rows are 84 px (74 on a phone), so a 1280 x 720 laptop shows four to five day rows. Names wrap at spaces only; phones show short names (`RSN`) instead of icons alone; every kind of upgrade has its own white icon; locked nodes no longer repeat the row's day or the line's prerequisite. Unit diamonds are upright and cropped to fill the diamond (one soldier of the squad pictures). The spine is blue only below a researched spine node. Column headers keep the elite badge and the step count on phones; an arrow shows when more columns wait to the right. The first-time research tip sits under the slots instead of over the tree. With nothing selected, the side pane lists what to research next in that category. On a phone a selected node scrolls clear of the bottom sheet.
