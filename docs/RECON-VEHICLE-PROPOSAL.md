# Recon vehicle proposal (2026-11-27; proposal only, waiting for the owner)


**RECON VEHICLE: proposal only. Nothing is added and no Gemini or image calls were made.**

> **Built (2026-11-28, branch recon-vehicle)** with the owner's answers: sight option A (70 km, 80 km with Mast-Mounted Sensors, x8/7), Special Forces keep identifying at 100 km, a lone recon vehicle does not capture, Army Base I (BUILD-REQS), START_ARMY.recon = {rcn:1}. The pictures are the unit-art-3 set (no new pictures). Differences from the text below: identification goes through VIS_ID_GROUND = ['spec', 'rcn'] (rules/data.js) with UNITS.rcn.vis = 70 (option (a): rcn is not in VIS_RECON); the computer's offensive strength leaves recon vehicles out (aiPunch, rules/ai.js), so the starting stacks of 2 infantry and 1 recon vehicle go for no more land than the 2-infantry start did; a computer's lone recon vehicle in land it cannot take is sent home (strandedHour). Tests: .test/recon.js.

Confirmed: the game has no recon vehicle today. VIS_RECON is ['spec'] (rules/data.js:534), and the rules/vision.js header says "the game has no recon vehicle or scout helicopter". The suggested code key is **rcn**, because 'recon' is already used as a flight-mission kind and as VIS_KM.recon. Cost figures come from tools/gen-art.py prices and the art logs only; the only gen-art command used was `--cost`, which just adds up the log.

**Note on BUILD-REQS** (queued by the owner on 2026-11-27, not landed yet). It removes Anti-Tank Infantry and its Thermal Sights, moves the IFV to Army Base level 2, and moves Special Forces and the Jammer to level 3. It lists "Recon vehicle" at Army Base level 1, which matches this proposal. The "Built at" row and the Anti-Tank Infantry argument in section 1 describe the rules as they are today and change once BUILD-REQS lands.

### 1. Stats (rules/data.js figures, before the x1,000 resource scale)

| | Infantry | Special Forces | Mobile Jammer | IFV | Recon UAV | **RECON VEHICLE (proposed)** |
|---|---|---|---|---|---|---|
| Cost | $25M | $50M, 5 mat, 2 elec | $34M, 1 oil, 4 mat, 7 elec | $32M, 4 oil, 4 mat, 7 iron | $26M, 2 oil, 4 mat, 5 elec | **$30M, 2 oil, 3 mat, 2 iron, 3 elec** |
| Manpower | 10k | 8k | 6k | 10k | 1k | **6k** |
| Build time | 24 h | 42 h | 30 h | 36 h | 30 h | **30 h** |
| Upkeep / fuel per day | 1 / 0 | 2 / 0 | 1.5 / 0 | 2 / 0.5 | 1 / 0.5 | **1.5 / 0.3** |
| Class | soft | soft | soft | armoured | air | **soft** |
| HP / attack / defence | 10/3/3 | 10/5/4 | 7/1/2 | 12/4/4 | 4/0/1 | **7/2/2** |
| Damage vs soft / armoured / air / naval | 3/1.5/0.6/0.6 | 5/2.5/1/1 | 0.3/0.2/0.3/0 | 4.8/4/0.8/1.2 | 0 until UAV IV | **2/1/0.4/0.4** |
| Damage taken (4/(4+def)) | x0.57 | x0.50 | x0.67 | x0.50 | x0.80 | **x0.67** |
| Speed | 4 | 5 | 5 | 7 (wheels) | 16 | **8 (wheels: x1.6 on roads, once rcn is in MOVE_T, see below)** |
| Sight | 50 km | 100 km (150 with Night Optics), identifies | 50 | 50 | 200 in flight, 250-500 on station, identifies | **70 km (80 with research), identifies; milder option: 60 (70)** |
| Built at (today) | Army Base I | Army Base I | Army Base I | Army Base I | Airbase I | **Army Base I** |
| Available | day 1, known | unlock day 4 | unlock day 3 | unlock day 1 (3 days) | unlock day 1 (3 days) | **day 1, known from the start** |

- **Fast.** Speed 8 makes it the fastest ground unit (IFV 7, tank 6, infantry 4).
  - **Build note:** it needs `rcn:'wheel'` added to MOVE_T (rules/movement.js:10).
  - moveType skips units that are missing from that table, and a force with no listed unit falls back to 'foot'. Without the entry, a recon moving alone would get the foot road bonus (x1.15) and foot terrain factors, not the wheeled x1.6.
  - With the entry it also gets the wheeled off-road penalties (wheels bog down off-road), which is realistic.
  - The Mobile Jammer is missing from MOVE_T today as well. That is a separate small fix, not part of this job.
  - A stack moves at its slowest unit's speed and road type, so the 1 recon + 2 infantry starting stacks march at infantry pace. To scout quickly, the player splits the recon off.
- **Weak in a fight.** It hits about two-thirds as hard as infantry with 70% of its HP. Measured as HP divided by damage taken, infantry rates about 17.5 and the recon about 10.5, the same as the Jammer, and the recon costs more than infantry. You pay for speed and identification, not fighting power.
- **Sight: two options for the owner.** The owner asked for "only a little more than infantry" (50 km).
  - **Option A (recommended): base 70 km**, 80 km with Mast-Mounted Sensors (factor exactly 8/7).
    - +40% radius over infantry (+60% with research), about double the area.
    - Clearly visible on the map, but well below Special Forces (100) and anything that flies (150 and up).
    - With research it reaches exactly the artillery reach (RANGE_KM.art = 80, rules/data.js), never beyond it.
  - **Option B (milder, closest to "a little more"): base 60 km**, 70 km with Mast-Mounted Sensors (factor 7/6).
    - +20% radius (+40% with research).
    - The circle is a modest step past infantry's on the map, and it always stays short of artillery reach.
  - Either option is one number in the UNITS row plus the research factor. The owner picks.
- **Why class soft.**
  - In this combat model each unit type takes its HP share of the damage aimed at its class (rules/combat.js, hurt).
  - As the only armoured unit in an infantry stack, the recon would take all the anti-armour fire. Today that includes Anti-Tank Infantry's x3.5, which goes away if BUILD-REQS removes that unit, but tanks, IFVs and helicopters still fire at armour.
  - As soft, it shares damage with the infantry it travels with, as the Jammer and the SAM (also vehicles) do.
  - The alternative is armoured with HP 6; I don't recommend it.
- **Requirements.** Army Base level I, like infantry; no Recruiting Office. This matches BUILD-REQS level 1.
- **Known from the start.** Every nation starts with two recon vehicles, so it should be able to build more. The alternative is an unlock on day 2.

### 2. The special ability, and how it fits rules/vision.js

The owner's rule: inside a recon vehicle's sight, enemy armies are fully identified (nation, unit types and counts, and the army's name). Other ground units only see that something is there.

**What already exists.**
- **Ordinary sight only spots.** armyVisible / armyView returns {unk:true}, shown as "unidentified". That covers infantry, tanks and other ground units, your own land, revealed provinces, aircraft and a plain AWACS. This is the 2026-11-18 rule, kept by the 2026-11-25 fog rule.
- **Special Forces already identify.** In visibleSet (rules/vision.js:105), `a.u.spec > 0` pushes the stack's sight circle into the identifying list (idn). The circle is UNITS.spec.vis x rSightF.
- **Other identification sources today:**
  - a force in battle with yours or an ally's (fightsMe);
  - a UAV on station, plus 12 hours of intel after it leaves;
  - drones in flight;
  - the reconnaissance satellite's strip;
  - a Phased-Array AWACS within half its radar range;
  - maritime patrol and warship sonar (ships at sea);
  - Mobile SAM or Jammer radar (aircraft overhead);
  - an agent's Reconnaissance;
  - rebels in your own province.

**How the recon fits.** It becomes a second identifying ground sensor through the same code path, all inside rules/:
- **vision.js:** add `if (a.u.rcn > 0) idn.push([x, y, x, y, UNITS.rcn.vis*rSightF(a.owner, 'rcn')*KM_W, VK.gf]);` next to the Special Forces line. The circle is measured from the stack's exact spot (on the road while it marches).
- **data.js (important):** the line at rules/data.js:535 gives every unit in VIS_RECON the default `vis = VIS_KM.recon = 100 km`. So either:
  - (a) the rcn row in UNITS carries **vis:70** (or 60 under option B) explicitly, and rcn is **not** added to VIS_RECON; or
  - (b) a separate `VIS_ID_GROUND = ['spec', 'rcn']` list drives identification only, never the sight default.

  I recommend (a). Without it, the recon would see and identify out to 100 km.
- **research.js:** rSightF (rules/research.js:74) today covers only 'at' and 'spec', with a fixed x1.5. It must give 'rcn' its own factor when Mast-Mounted Sensors is researched: **x8/7** under option A (70 to exactly 80 km) or **x7/6** under option B (60 to 70 km). It must not be x1.15, which would give 80.5 km, just past artillery reach.
- **movement.js:** `rcn:'wheel'` in MOVE_T (see section 1).

**Side effects of reusing that code path:**
- A stack containing a recon also spots out to its sight, because a stack sees as far as its farthest-seeing unit.
- Enemy Special Forces within that circle are found, as by any ground force.
- Aircraft passing inside the circle are identified, as Special Forces do today. If the owner wants ground forces and ships only, that is a one-condition change.

**Allies:** I recommend yes. Every sensor in visibleSet already counts for allies.

**What the owner sees:** the army bar and the province sheet list exact types and counts, "Known Army Size" counts those armies, and the border warning names them. Outside every identifying circle, nothing changes.

**Question for the owner.** Special Forces already identify at 100 km. I recommend keeping that, since they are elite, cost $50M and unlock on day 4 (level 3 under BUILD-REQS). They could be cut back to spotting only if the owner wants the recon to be the only ground identifier.

### 3. Research line
Armoured Forces, a dashed family line from the IFV. Prices use R_PRICE (rules/data.js:246-251) with cost 30, metal 3, iron 2, elec 3.

| Day | Step | Effect | Price |
|---|---|---|---|
| 1 | Recon Vehicle (known from the start) | | free |
| 3 / 10 / 16 | Firepower 1-3 | attack +12 / 25 / 40% | L1: $48M, 15 mat, 2 iron, 2 elec, 3 rare, 2 days. L2: $72M, 23 mat, 3 iron, 4 elec, 5 rare, 2 days. L3: $96M, 30 mat, 4 iron, 5 elec, 8 rare, 3 days |
| 4 / 11 / 17 | Protection 1-3 | defence +12 / 25 / 40% | same as Firepower |
| 4 | Mast-Mounted Sensors | sight 70 to exactly 80 km (x8/7, equal to the 80 km artillery reach, not beyond); under option B 60 to 70 km (x7/6). Needs the rSightF change above | $43M, 20 mat, 14 rare, 3 days |
| 7 | Uprated Powerpack | speed +1 (8 to 9) | same as Sensors |
| 10 | Signature Reduction (optional; needs a small new rule) | a force made only of recon vehicles is spotted by enemy ground forces only within half their sight; aircraft, UAVs, satellites and own land see it as usual | same as Sensors |
| 13 | Recon Vehicle II, "Networked Scout" | defence +1, health +2 | $126M, 50 mat, 4 iron, 6 elec, 38 rare, 6 days |

- Protection 3 also gives the line's standard "trains 15% faster".
- 10 steps reach research level 8, so all three looks come into play. Without Signature Reduction there are 9 steps, still enough for level 8.

### 4. Pictures it needs

**Paid (Gemini):**
- **Unit looks, the set-3 way:** 5 groups x 3 looks x 3 kinds = 45 pictures:
  - side view: the cut-out master, used in the research diamond;
  - card scene: photo-real, used on the unit card;
  - top-down: straight down, nose up, used on the map and the army bar.
- **Checks:** one three-way Gemini check per look, 15 in all.
- **Research art:** ri-u_rcn, plus ri-rcn_optics, ri-rcn_spd and ri-rcn_camo. Firepower and Protection share t-fp and t-pr. The Powerpack picture could share the IFV's through R_SHARE.

**Free (code):**
- the baked 3D model: reuse the 4x4 'hmv' model, as the Jammer does, or build a new procedural one;
- the counter glyph;
- the ula atlas files (tools/ulatlas.py, prep-art.py);
- fallbacks until the art exists: the IFV's research scene and the baked model.

**Brief.** An original, generic, lightly armoured wheeled 4x4 scout car with a telescopic sensor mast and a light remote machine gun.
- NATO: flat and slab-sided.
- East: low boat hull with a small round turret.
- China: clean and boxy with a sharply sloped front.
- Europe: very low and sleek, with a panoramic sight.
- Export: a rugged armoured utility 4x4 with bolt-on plates, clearly different from the Jammer and the rebels' pickup.
- Looks: 1 is a Cold War open-roof scout car; 2 is armoured with a remote weapon station and the mast; 3 is a near-future low-signature hybrid with a drone launch tube.
- The checker must not be able to name Fennek, VBL, BRDM, LAV or M1127.
- Side and top views go on plain #D9D9D9 with **no ground patch, slab or base**. The card scene is the usual photo-real setting with a dirt road.
- **Gemini only flags; nothing is redone without the owner's OK.**

**Cost** (from the logs; batch is half price). The nearest guide is the Jammer: 45 pictures for $1.69, plus 15 checks for $0.145.

| Item | Batch | Singly |
|---|---|---|
| 45 unit pictures | about $1.70 | about $3.40 |
| 15 three-way checks (about $0.0078-0.0097 each in the log; never batched) | about $0.12-0.15 | same |
| Optional single check per picture (about $0.0035 each) | about $0.16 | same |
| 4 research pictures | about $0.17 | about $0.35 |
| One test picture first (NATO look-1 side view, with its check), per the owner's rule: prompt, one test, then OK | about $0.09 | |
| **Total** | **about $2.1-2.3** | **about $4.0** |

Look 1 only (15 pictures, 5 checks, 1 research card): about $0.7.

**Balance (corrected).**
- The owner's real Gemini balance is **$24.05** (owner block 2026-11-27 on master, commit 7eb5224), and the $5 floor stays.
- The full recon batch leaves about **$21.9**. After the queued UNIT-ART-3 FINISH (about $3.6, which goes first) it leaves about $18.3. **No top-up is needed.**
- The earlier "$5.32", "the guard would refuse", "top-up of at least $2" and "$6.40 joined logs" figures are withdrawn.
- **gen-art's own estimate is out of date.** Its constants still estimate about $5.32 on master and about $6.61 on unit-art-3. So balance_guard would wrongly refuse a full run until BALANCE_TOPUPS_USD is raised to match the owner's $24.05:
  - about **18.43** on master (from -0.30);
  - about **27.14** on unit-art-3, measured against its own log (from 9.70).

  That edit belongs to whichever job runs the art, done when the owner says so.
- As always, the cost of each batch goes to the owner first and runs only on the OK.

### 5. Old saves, the computer's use, balance risks

**Old saves:**
- Loading fills every new unit key with 0 (rules/state.js, restore), so old armies stay exactly as saved. A day-1 unit needs no research entry, and the new nodes start at 0.
- The hand-unrolled UT_ROLL fast paths switch off when the unit list changes, and the perf check would drop. The build must add rcn to them:
  - rules/state.js:446-460: count, groundN, shipsN, armyHP, power;
  - rules/movement.js:174 (hasUnits), 534 (effHP) and 536 (healW).
- It must also add rcn to MOVE_T (rules/movement.js:10) and to rSightF (rules/research.js:74).
- The split-golden 12345 file and R_STEPS change and need regenerating. nat-oldsave and the .test old-save suites must pass.

**Computer nations:**
- They play on the full state and ignore the fog, so a recon gives them only a weak unit.
- Give them a small quota in aiPickUnit: weight 0.5 while they have fewer than 1 recon per 10 ground units, at most 6, built in Army Base cities.
- Keep recons inside stacks and never send one alone to attack.
- Low research weight: Sensors and Powerpack only after their main lines.

**Balance risks:**
- Every nation can identify enemies near its two outer stacks from day 1, which makes surprise attacks there harder. This is what the owner asked for.
- **Spotting for artillery.** Ranged fire needs only a spotted target, so a recon in an artillery stack lets the guns fire out to the recon's sight instead of 50 km.
  - Under option A that is 70 km, and exactly 80 km with Sensors: the full artillery reach, never past it.
  - Under option B it is 60/70 km.
  - Either way the research factor must not push sight past 80 km (hence 8/7, not 1.15).
- **Fast capture.** CAP_MIN is 1, so a lone recon at speed 8 could grab undefended provinces quickly. If that becomes a problem, rule that a recon alone cannot capture.
- **Soaking damage** is avoided by making it soft.
- Signature Reduction is optional and milder than the Special Forces concealment.

**Checks when it is built:** lint, mkpage then split-golden, headless --check, balance, nations-balance, eco-check, stack-duel, the .test suites (including start-armies.js), anchor-check, nat-oldsave, build (then delete ./dist).

### Starting armies tie-in
Until the owner approves the recon vehicle, the two outer starting stacks hold 2 infantry each. START_ARMY.recon in rules/data.js is null, and the outer stacks skip the slot. Once approved, it becomes {rcn:1} and every outer stack gets one recon vehicle, with no other change; .test/start-armies.js check 3 already covers this.

The outer cities now come from the round-2 rule: the biggest city, then the biggest city on another side of the capital or far from the first. Only another nation's border counts. Russia gets Saint Petersburg + Rostov, Germany Cologne + Munich, Belarus Vitebsk + Gomel; all 68 are in cities.txt.