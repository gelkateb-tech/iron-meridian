# Proposal: province buildings and hospitals (one round; waits for your OK)

This job only wrote proposals and preview sheets. Nothing was edited, committed or pushed in any worktree, and there were no Gemini calls. Its files are in `/tmp/claude-0/-home-user-iron-meridian/7fd07611-91e4-5b00-ba43-06c622a65904/scratchpad/prov-hosp/`.

**Queue note.** This work starts only after the city lots job (round 3 and the pasted-on check) has finished. The order is:
1. Rules on master (cities-redo is behind master in `rules/`).
2. Merge master into cities-redo, so `BUILD.hosp` exists there before the lot code reads it. Without this the map would crash: `cityLotUp` and `cityLotMask` read `BUILD[k].max` for every lot key.
3. The Hospital lot on cities-redo.

Take the lot-hash baseline again just before step 3. Today it is 5347 lots and hash -1076957058, but round 3 may change it.

**Preview sheets** (desktop 1440x900 and phone 440 px), in the same folder:
- `sheet-1-hospital.jpg`: the 5 Hospital pictures we already have, shown in Berlin.
- `sheet-2-province.jpg`: today's rule-1 problem, a countryside Bunker and Recruiting Office that look just like Berlin's.
- `sheet-3-numbers.jpg`: all the numbers and picture costs in one table.

---

## 1. The new art rule (ready to paste)

The exact text is in `ART-BIBLE-rule.md`. It goes into docs/ART-BIBLE.md right after "Building rules". In short:

- A building in the countryside never looks like its city version. It is plainer: earth, canvas, timber and sandbags; no concrete crowd, vehicles or paved yard.
- **Picture names:**
  - A building that can stand in both places has a city set (`bn-<key>-N`) and a province set (`bn-<key>p-N`, for example `bn-fortp-1..5`).
  - A countryside-only building has just its own set (`bn-fhosp-1..3`).
  - The game picks the set by "is this province a city", on the map **and in the panels**. Today `bnName` always returns the city cutaway `bn-fortcut-N` in panels, so it must be told the province.
- **Province pictures avoid the three pasted-on faults:**
  1. No ground under them. The background is the usual light grey #D9D9D9, never white.
  2. The city-block camera, not the 45-degree corner view.
  3. Little detail.
- **The rule says outright that it overrides three existing lines, for province pictures only:**
  - the 45-degree view in STYLE_V2;
  - "detail must match the anchors";
  - "each level is an edit of the level before". Instead, each province level is an edit of level 1, as Bunker option C was.
- gen-art gets `STYLE_V2_PROV`. It is STYLE_V2 with the camera sentence swapped and the detail sentence toned down, using a replace-and-assert like STYLE_V2_UNIT.
- **Camera reference:** Gemini gets a cropped screenshot of the game's own city blocks, plus at most one anchor picture, used for materials and colours only. The camera wording reuses the Army Base camera test from the pasted-on check, so the game ends up with one new camera, not two. **So the province samples are made after your verdict on that test.**
- **Checks for every new picture:** no flags, and an "alpha-hole" check, so the cut-out does not punch holes in pale canvas or the white square behind the cross. Pale areas are protected with a free local mask.
- **A countryside building going up** never shows the city crane. Instead it shows its province level-1 picture, faded. That costs $0. A real province building-site picture is optional (question 9).

Buildings that break the rule today (only two can stand in the countryside):

| Building | Today in the countryside | What fixes it |
|---|---|---|
| Bunker (fort) | the city pictures bn-fort-1..5 (map) and bn-fortcut-1..5 (panels) | a province set bn-fortp-1..5 (section 3) |
| Recruiting Office (rec) | the city pictures bn-rec-1..5 | it becomes city-only (section 2) |
| Any building going up | the city crane and scaffolding | the faded province level-1 picture |

---

## 2. Recruiting Office: cities only

**The change:**
- `rules/data.js:173` changes from `where:'any'` to `where:'city'`.
- `canBuildHere` (production.js:84) then stops new countryside offices everywhere: the player, the computer and the build lists.
- The office's description and the comment at ai.js:394 are updated.

**What a countryside office does today:** it only adds manpower, +3k to +9k a day. Troops are trained only in cities, so its "train faster" part does nothing there. It is a cheap manpower source: +3k a day for $40M, 2 to 4 times cheaper than upgrading a city office.

**Who has one:** no computer nation. Four 60-day test games (one with 26 wars) had 0, because the computer never builds a new office anywhere. All 68 capitals and all 208 starting offices are in cities, so new games do not change. Only players who built countryside offices themselves are affected.

**Offices already built in old saves (recommended, option A):**
- When the save loads, each countryside office is closed.
- Every level is refunded at its real price: money, materials, iron and **electronics**.
  - The refund uses the scaled prices the game uses (REC_LV after the RES_K scaling), not the raw table.
  - Whatever does not fit in the stores is paid in money, like the earlier economy change.
  - Electronics are handled like materials and iron (level 5 costs electronics).
- A level still being built is cancelled and refunded at the price that was paid.
- The refund goes to whoever owns the province now. If someone captured an office, they get the refund even though they did not pay for it. That is rare and harmless; the alternative is to refund nobody for captured offices (question 1).
- Each player gets one message, for example: "4 Recruiting Offices in the countryside were closed: $310M refunded; your manpower falls by 15k a day."
- It runs once, behind a new save flag `S.rcc` (the name is unused today). It comes after bunkerMigrate and ecoMigrate in the load order. Offices in cities are untouched.
- **Check after the build:** one 120-day headless game with 6 wars, to confirm no computer nation runs out of manpower. After this change the computer can only upgrade city offices for manpower, which costs more.

**Other options, not recommended:**
- B: turn each office into a Field Hospital. That is a free gift of a different value.
- C: keep them, with no manpower. They would be dead buildings still using the city picture.
- D: keep them working but block new ones. That breaks your new rule.

---

## 3. Bunker

**Option sheets:** the 2026-11-18 sheets (A, B and C at levels 1 and 5, with map previews, from docs/bunker-options) are being saved to the shots branch by the orchestrator, so you can pick one. The game today uses C version 1 in cities (your OK, v61).

**The province Bunker** is the same building with its own plainer look in the countryside. Its rules are unchanged (recommended): same key `fort`, same prices and protection (33-82% less damage, +5-50% morale), same upkeep, still hidden from others. Old saves need nothing.

The 5 levels use earth colours and no concrete. Each level is an edit of level 1:
1. A ring of sandbags round a foxhole, with a small timber-roofed dugout.
2. Level 1 plus a second sandbag nest and a short trench.
3. The dugout gets a log-and-earth roof; the trench zigzags.
4. Two dugouts and a machine-gun nest.
5. A short trench line with three sandbag nests and a covered dugout.

**Pictures:** 5 map pictures, `bn-fortp-1..5`. The panels use the same picture (no new cutaways). The city keeps bn-fortcut-1..5.

**Free alternative, not recommended:** reuse the old sandbag-ring pictures from before v61 (bn-fort-N.old.webp). They have the corner view and pads, and level 5 is cluttered.

**Also free:** the city Bunker domes (bn-fort-2..5) have small see-through blotches from the cut-out tool. They are fixed in the same free local re-cut as the Hospital roofs (section 4).

---

## 4. City Hospital (cities, levels 1-5)

**Name and key:** "Hospital", key `hosp`, cities only. Old saves load it as 0 (a missing building key loads as 0, state.js:285).

**The name clash:**
- The research "Field Hospitals" (log3) is renamed **"Combat Medicine"**.
- It keeps the same id and the same effect (15% / 20% less damage taken in battle), so saves are fine.
- The rules label at combat.js:95 and the UI's label table at index.html:12633 must change **together**, or the Strength table loses its text.
- Also change the short name at :12039, the docs, and any test that checks the label.
- The research icon (an ambulance) and its card picture can stay.
- If you would rather keep the research name, the countryside building would be called "Field Aid Station" instead (question 3).

### Price, build time and healing

Healing is the share of full health an army gets back per day. Today it is 25% in your own city and 10% everywhere else.

| Level | Price | Days | Armies in the city | Armies next to the city |
|---|---|---|---|---|
| none (today) | - | - | 25% | 10% |
| 1 | $30M, 5 mat | 2 | 30% | 12.5% |
| 2 | $50M, 8 mat, 4 iron | 2 | 35% | 15% |
| 3 | $80M, 14 mat, 8 iron | 3 | 40% | 17.5% |
| 4 | $120M, 20 mat, 12 iron, 4 elec | 3 | 45% | 20% |
| 5 | $170M, 28 mat, 16 iron, 8 elec | 4 | 50% | 22.5% |

- **In the city:** 25% x (1 + 0.2 x level).
- **Next to the city:** 10% x (1 + 0.25 x level). The jump is bigger than first drafted (11.5-17.5%), because that one was too small to notice.
- No upkeep. The price table is a new `HOSP_LV`, scaled on the RES_K line (data.js:676) like REC_LV and BUNKER_LV.

**Why it is cheaper than first drafted.** The first draft cost $760M for all 5 levels, more than a full Bunker ($496M), for about one day saved. A test (two 40-day war games) showed why the gain is small:
- The game removes a unit as soon as its wounds add up to a whole unit, so a group is never missing much health.
- At any moment only about 4.5% of ground armies are wounded.
- A wounded army typically has 3 units and needs 1.1 to 1.4 days to heal fully today.
- So a Hospital saves about half a day to a day for a typical wounded army, and a few days for a badly hurt small one.
- At about $450M for all 5 levels it costs a little less than a full Bunker.
- If you would rather keep the higher prices, the other choice is stronger healing in the city: 25% x (1 + 0.4 x level), so 35% to 75% a day (question 5).

**"Next to the city" means all of these:**
- your own supplied province that touches the Hospital's city;
- the army is standing still;
- the Hospital's city is yours and not in a battle;
- its Hospital is not knocked out. The game uses the working level, as it already does for resources.
- An ally's Hospital does not count (question 7).

### How it stacks (exact rule)

The game works out each rate that applies and uses **the biggest one**. Then it multiplies by the Logistician commander:

```
rate = largest of:
         today's rate (25% own city, 10% elsewhere)
         Hospital in this city:            25% x (1 + 0.2 x level)
         own countryside next to one:      10% x (1 + 0.25 x level)
         Field Hospital in this province:  10% x (1 + 0.3 x level)
       then x (1 + 0.5 x Logistician rank)
```

- Rates never add up. A city next to a Hospital city does **not** get a bonus on its own 25%. Otherwise a city with no Hospital, next to a level-5 Hospital city, would beat a level-3 Hospital in its own city.
- **Ground armies only.** Ships keep the Naval Yard rate and aircraft their maintenance rate. Today's hook (`hospitalF` at combat.js:52-56) multiplies everything. It becomes a function of the army that returns a rate and is used for the ground rate only.
- **No healing while fighting, moving, or cut off from supply,** as today.
- **Gas and radiation zones win:** no healing inside a zone, Hospital or not, and the zone still does its hourly damage. The zone check (hazHeal, missiles branch) comes before the rate, so this needs no extra code.
- **Combat Medicine** research is a different thing: it means less damage taken in battle and never touches healing, so it simply works alongside the buildings. Recommended: it does not also speed up healing (question 4).
- **The Logistician:** with a rank 3 Logistician (x2.5) a level 5 Hospital city heals 125% a day, so a lone unit at 20% health is full in about 15 hours. That is in line with ships today: a level 5 Naval Yard with the same Logistician gives 160%.

### The computer

- **Where it fits:** a new step in the per-city build list, **after the Army Base II step** (not right after the Bunker). A front city should not build a Hospital before its Army Base.
- **It builds one only when all of these hold:**
  - it is at war;
  - the city already has an Army Base (or is the capital);
  - the city has the Bunker level the computer wants there;
  - there is no enemy right next to the city;
  - it is a front city: an enemy within 2-3 provinces, or the city with the most of its own wounded armies near it;
  - its cash is above the price plus $250M.
- **How many:** at most max(1, round(cities / 12)), and never more than 4.
- **Keeping it cheap to run:** the 2-3 province enemy search runs only at the day change and only on 1 turn in 10, because 68 nations run this loop. All new dice rolls happen only at war.
- **Upgrades:** a 15% chance a turn, only while wounded armies keep coming.
- **Wounded armies** (under 45% health, ai.js:651) go to the place that **heals them most counting the trip**: the rate there, after the days spent getting there, within 4 provinces. Any own city (25%) beats a Field Hospital (19% at most), so Field Hospitals serve armies that stay in the field.

### Crash fix that must go in

`BLD_VAL` (rules/air.js:156) gives every building a value for bombing targets. It has no entry for the new keys, so every city's bombing score would turn into "not a number" as soon as the keys exist, even with no Hospital built. This breaks bestBld, the bombing pick (air.js:169) and the computer's target choice (ai.js:63). Fix: add `hosp:1.5, fhosp:0.5`. The low values also mean the computer does not aim at hospitals first.

### Pictures: the 5 we already have

- The current-style set is ba-v2-hospital-1..5: a white clinic growing to a three-block hospital with a helipad, with a red cross.
- It is already cut out as `assets/art/bn-hospital-1..5.webp`, and its layout data is already in the game.
- The old 13 November set (ba-hospital-1..5.png, a grey walled compound) is not used.
- **A defect to fix, free:** in levels 1-4 the pale grey roofs and awning were cut out as background, so the map shows through holes in the roof. The cutting tool's "pockets" rule caused it. A local re-cut with the roofs protected fixes it at $0 and needs no Gemini.
- Like every city picture, these have the three pasted-on faults. You chose to use them anyway, because they match the other city pictures.
- In the panels the Hospital uses its map picture.

### The Hospital lot (cities-redo)

**Where it goes:**
- Near the core, on a road, added last.
- It gets a direction entry like the Arms Industry's, mirrored to the other side, for example `BN_LOTDN hosp: [0.5, -1.2]`. The first draft's "south-east is free" was wrong: the Army Base, Bunker and Recruiting Office aim at the town's mass, not at fixed sides.
- After the build the job reports, for Berlin, Hamburg and Kolkata, how far the Hospital lot is from the town point, and across all towns how many could not place one (out.miss) and how many went to overflow (ov).

**What the empty lot looks like:** **no empty-lot park.** Until a Hospital stands or is going up, the lot stays the town's ordinary blocks. This means:
- `hosp` is **not** in BN_LOTCK, so the 714 towns do not get a new hole cut into them;
- the bit clash with BN_LOTNB disappears;
- BN_LOTCR stays 0xff000.

**Code:**
- Append `hosp` to BN_LOTS (its lot bit is 1<<10, which is free) and last to BN_LOTORD.
- Add BN_LOTSTY, BN_LOTR and BN_LOTDN entries.
- Add `hosp:5` to BN_ART, plus BN_K and bnF entries.

**How every other lot stays exactly where it is:**
- **Within a town:** the Hospital is placed last, so nothing before it can move.
- **Between towns:** a smaller town avoids bigger towns' lots, so a new Hospital lot could push it. Fix:
  - Base lots and Hospital lots get **separate caches and generators**: CLOTS holds base lots only, a new CLOTSH holds the Hospital lot.
  - The base pass works exactly as today and waits only on bigger towns' CLOTS.
  - The Hospital pass waits on every neighbour's CLOTS and on bigger towns' CLOTSH.
  - So base lots never depend on Hospital lots, and the generator never waits on itself. One shared generator would crash with "Generator is already running".
  - CLOTSH is cleared wherever CLOTS is (cityLotsRedo and the CLOTS_K reset).
- **The 9 shared neighbour bits:** Hospital lots are counted after **all** other lots of **all** towns in that count, so no other lot's bit shifts.
- **Growth:**
  - A Hospital lot that is not built yet is left out of growth's lists (cityGrowPrep's `own` and `LB`), so growth rows do not move in any town.
  - Growth buildings that fall on the lot carry bit 10, as plan blocks do, and hide only once a Hospital is up.

**The proof.** With no Hospital built, all of these must match the baseline taken before the work:
1. The lot hash (lothash.js) over every town's lots, Hospital filtered out.
2. A hash of every plan block's marks and bits (cityLotTag).
3. A hash of the growth lists (cityGrowPrep).
4. A hash of the neighbour-bit assignment.
5. A pixel-diff screenshot of a few towns with no Hospital.

The per-town lot time (120-190 ms) gets one more placement, so the phone speed check is run again.

---

## 5. Field Hospital (countryside, levels 1-3)

**Name and key:** "Field Hospital", key `fhosp`.

**Countryside only.** You wrote "any province". I read "province" as countryside, as in your rule 1. In a city a Field Hospital would either do nothing (19% is below a city's normal 25%) or, if it added on top, beat Hospital levels 1-4 for a fraction of the price. So cities use the Hospital. This takes a new `where:'rural'` value in canBuildHere and in the "why not" text (question 2).

| Level | Price | Days | Healing in its province |
|---|---|---|---|
| none (today) | - | - | 10% |
| 1 | $20M, 4 mat | 1 | 13% |
| 2 | $35M, 6 mat, 3 iron | 1 | 16% |
| 3 | $55M, 10 mat, 5 iron | 1.5 | 19% |

- **Formula:** 10% x (1 + 0.3 x level). Always well below any city Hospital in its own city (30% and up), as you asked.
- **A limit:** at most 1 Field Hospital per 10 provinces you own (rounded up, at least 1). The same limit applies to players and the computer. Without it a player could cover every province cheaply, since there is no upkeep. If you lose provinces, existing Field Hospitals keep working; only new ones are blocked.
- Visible to enemies, can be bombed, and goes with the land when captured, like other buildings.
- Price table `FHOSP_LV`, scaled on the RES_K line.
- Stacking, the gas rule and "ground armies only" are the same as for the Hospital.

**The computer:**
- A small new pass, at war only.
- It builds one only where 2 or more of its own wounded armies have recently stood still in the countryside, 1-2 steps behind the front: own, supplied, not next to an enemy, not in a gas zone.
- The gas-zone test (hazAt) exists only on the missiles branch. It is guarded so it works before that merge.
- **How many:** at most 1 per front and 2 in all, within the limit above, and only with cash above $120M.
- It upgrades to level 2-3 only while wounded armies use it.

**After the build:** a headless check of 2 seeds over 60 days at war. It reports:
- Hospitals and Field Hospitals per warring nation (target 1-3);
- the money spent on them;
- whether the computer's Army Base and Bunker counts at the front fall compared with today.

The test hashes (golden and headless) will change, even at peace, because every save gains the two new building keys. That is expected.

**Pictures, 3 levels.** A small army tent with a red cross, much plainer than the city Hospital and a little bigger at each level. Each level is an edit of level 1:
1. One small olive canvas tent with a red cross on its roof.
2. A slightly longer tent with a second small tent beside it.
3. Two tents joined, with a few stretchers or crates.

There is no flag, vehicle, helipad, building or paved ground. The picture has the city-block camera and no ground of its own. Its size factor keeps even level 3 clearly smaller on the map than a city Hospital level 1. `bnName` clamps to the building's own top level (3), and `fhosp:3` goes in BN_ART.

**The red cross:**
- In real life a red cross on white is a protected emblem, and the Red Cross has asked game makers to stop using it. Prison Architect, for example, switched to green.
- The real-life protected use is a military medical unit, so the concern is the game showing the emblem, not what it depicts.
- You chose red twice, so red is the default.
- If you ever want green, all 8 hospital pictures (5 city + 3 field) can be recoloured locally for about $0, once the cut-out masks exist (question 6).

---

## 6. Time to full health for one damaged unit on its own

These are days for **one lone damaged unit**, resting and supplied, with no Logistician. Larger groups are never missing this much: a typical wounded army today needs 1.1-1.4 days, and a hospital saves it about half a day to a day.

| Where it rests | Rate a day | From 50% | From 20% |
|---|---|---|---|
| Countryside, today | 10% | 5.0 | 8.0 |
| Field Hospital level 1 | 13% | 3.8 | 6.2 |
| Field Hospital level 2 | 16% | 3.1 | 5.0 |
| Field Hospital level 3 | 19% | 2.6 | 4.2 |
| Next to a Hospital city, level 1 | 12.5% | 4.0 | 6.4 |
| Next to a Hospital city, level 5 | 22.5% | 2.2 | 3.6 |
| Own city, today | 25% | 2.0 | 3.2 |
| City Hospital level 1 | 30% | 1.7 | 2.7 |
| City Hospital level 3 | 40% | 1.25 | 2.0 |
| City Hospital level 5 | 50% | 1.0 | 1.6 |

**Price comparison:**

| Building | All levels | Level 1 |
|---|---|---|
| Hospital (new) | about $450M, 75 mat, 40 iron, 12 elec | $30M |
| Field Hospital (new) | $110M, 20 mat, 8 iron | $20M |
| Bunker | $496M | $36M |
| Recruiting Office | $825M | $40M |
| Army Base | - | $10M |
| Arms Industry | - | $20M |

---

## 7. New pictures and their Gemini cost (estimates; nothing is made before your OK)

**Typical costs**, from assets/art-src/gen-art-log.jsonl and the price constants in tools/gen-art.py:593-595:
- A fresh picture made on its own with reference pictures: about $0.10 (the last two such pictures cost $0.093 and $0.105).
- An edit made on its own: about $0.05 ($0.047-0.053).
- A picture in a batch: about $0.038 (65 building pictures; batch is half price).
- The flag-only check: about $0.003 a picture.

**Route:** level 1 first, on its own, for you to look at. For the Bunker, level 5 too. The other levels follow as edits of level 1 in one batch.

| Set | Pictures | Route | Cost |
|---|---|---|---|
| Province Bunker bn-fortp-1..5 | 5 | L1 fresh $0.10 + L5 edit $0.05 + L2-4 batch $0.11 + checks $0.015 | **$0.28** |
| Field Hospital bn-fhosp-1..3 | 3 | L1 fresh $0.10 + L2-3 batch $0.08 + checks $0.01 | **$0.19** |
| Re-cut of the Hospital roofs and Bunker domes | - | local tool, no Gemini | $0 |
| Building going up in the countryside | - | faded level-1 picture, no new picture | $0 |
| **Total** | **8** | | **about $0.47** |

- **With one redo** of each sample (Bunker L1 and L5, Field Hospital L1): at most about **$0.73**.
- **Optional:** a real province building-site picture (stakes, timber, sandbags, a spade) would add about $0.10, or $0.20 with one redo (question 9).
- Your balance of $24.05 leaves about $23.3-23.6 (at worst about $23.1), far above the $5 floor.
- Gemini only makes these pictures and runs the flag-only check. It never redoes a picture by itself.
- The samples wait for your verdict on the Army Base camera test (section 1).

**Screenshots after the build** (desktop and phone, to the shots branch):
- a city with a Hospital at levels 1 and 5;
- a countryside Field Hospital;
- the province Bunker;
- a countryside building going up.

---

## 8. Questions for you (my default in brackets)

1. Countryside Recruiting Offices already built: close them and refund everything to the province's current owner, with one message that also says the manpower lost? [Yes, option A, refund the current owner]
2. Field Hospital: countryside only (I read "any province" as countryside), or also in cities? [Countryside only]
3. Names: rename the research to "Combat Medicine", and call the buildings "Hospital" and "Field Hospital"? [Yes]
4. Should Combat Medicine also speed up healing, on top of cutting damage? [No]
5. Hospital: the cheaper prices in section 4 (about $450M for all 5 levels) with 30-50% healing in the city, or the first prices ($760M) with stronger healing (35-75%)? [Cheaper prices]
6. The cross: keep red as you chose, or switch all hospital pictures to green (free, done locally)? [Keep red]
7. Should an ally's Hospital heal your armies next to its city? [No, own only]
8. Field Hospital limit of 1 per 10 provinces you own, the same for everyone? [Yes]
9. Building going up in the countryside: the faded level-1 picture ($0), or a new province building-site picture (about $0.10)? [The faded picture]
10. Province Bunker: same rules as the city Bunker, with the map picture in the panels (no new cutaways)? [Yes]
11. Gemini: make the 8 new pictures by the sample-first route, about $0.47 (at most about $0.73 with one redo), after your verdict on the Army Base camera test, plus the free local re-cut of the Hospital roofs and Bunker domes? [Yes, after your OK, nothing before it]

Nothing in this proposal has been built. The building work, the screenshots and any Gemini spending all wait for your OK.

---

## Appendix: review points not taken, and why

- **"Add a building-site picture as part of the Bunker set"** (first draft). Dropped from the default: you did not ask for it. The $0 faded level-1 picture keeps the rule. The picture is offered as question 9. If it is kept, it needs its own drawing path, because the cross-fade (BN_STG) expects 3 stages.
- **"Give the Field Hospital a small upkeep ($0.2M a day per level)"** (critic 1, one of two options). I took the other option, a limit of 1 per 10 provinces. It is simpler to understand, costs nothing to track each day, and treats players and the computer the same.
- **Neighbour healing of 10% x (1 + 0.3 x level), 13% to 25%** (critic 1). I used 0.25 x level instead (12.5% to 22.5%, critic 2's figure). It is still clearly visible but a little gentler. Next to a level 4-5 Hospital city the reach (20-22.5%) beats a Field Hospital level 3 (19%), so a Field Hospital is not needed there. That fits your words: a Field Hospital heals less than a city Hospital.
- **"Option B: turn countryside Recruiting Offices into Field Hospitals"** stays rejected: it is a free gift of a different value, and those provinces may not be where an army needs healing.
- **"Hospitals should help ships or aircraft"**: not taken. Ships have the Naval Yard and aircraft their maintenance rate. Adding hospitals to these would double up.
- **"A weaker countryside Bunker"**: not taken. Existing countryside bunkers would suddenly get weaker with no warning.
- **The red-cross "$0.12 more to change later" figure** (first draft) was wrong and is removed. A later switch to green is a local recolour at about $0, once the masks exist.
- **The first draft's single-picture prices (about $0.05)** were too low for fresh pictures made with references. They are corrected to about $0.10, using the log.
