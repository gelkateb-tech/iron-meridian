# ADDENDUM: ARMY EFFICIENCY (stacks, ships, aircraft, convoys) — waiting for the owner's OK

Proposal only. Nothing in the repo was edited, committed or pushed. Line numbers are master 5ceafa2.
It changes section 4 (Stacks) of /home/user/iron-meridian/docs/ANTIAIR-SPEEDS-STACKS-PROPOSAL.md.

Pictures (in /tmp/claude-0/-home-user-iron-meridian/7fd07611-91e4-5b00-ba43-06c622a65904/scratchpad/antiair2/):
- sheet-efficiency-desk.jpg: the army panel at 1440 × 900 (side panel 344 px wide)
- sheet-efficiency-phone.jpg: the army panel at 440 × 956 (bottom sheet)
- table-numbers.jpg: the numbers, today against new, and the stack-duel over 6 seeds

Both sheets show land armies of 10, 13 and 20, a convoy of 7 at sea, a fleet of 7, an air wing of 7, a convoy of 13 (the longest
text) and an army of 8 boarding in port. They were made with a local-only test hook (shots.js) on a throw-away copy of master.
The hook rewrites the panel in the browser and does not change the rules. The copy and the raw frames were deleted afterwards.

Scripts in the same folder: curve.js (the tables), duel-seeds.sh / duel-seeds.txt (the duel over 6 seeds), shots.js, sheet.py,
table.js.

**In short**
- Every army has one number, **Efficiency**. It is 100% at or under the limit: 10 ground units, 5 ships, 5 aircraft.
- Each ground unit over 10 costs **10% damage and 5% speed**.
- Each ship, aircraft or troop at sea over 5 costs **20% damage and 10% speed**.
- It never goes below **15% damage** or **50% speed**.
- Troops on ships count towards the **sea limit of 5**, together with any ships in the same army.
- The number shows only in the army panel, with the exact damage and speed loss under it. Nothing shows on the map and there
  are no pop-ups.

---

## 1. TODAY'S RULES (short)

- Limits: land 10, sea 5, air 5 (rules/data.js:612-613). Ships and aircraft already have a limit of 5.
- Damage: 1 − 0.56 × ln(size ÷ limit), at least 25%. Speed: 1 − 0.15 × ln(size ÷ limit), at least 50% (rules/combat.js:24-25).
- That is where the panel text "11 / 10 ground units: −5% damage, −1% speed" comes from (index.html:12653).
- Troops on ships count against the LAND limit, even at sea (rules/combat.js:18, 28-30). So a convoy of 10 has no penalty today.
- **Today, a bigger stack still hits harder.** 20 units at 61% hit like 12.2 full units, which is more than 10. An army only
  hits less than 10 full units once it is over 40. This is why the owner saw no reason not to stack.

Where the damage factor is used: the hourly battle (rules/tick.js:265), the air battle (rules/air.js:114), shelling
(rules/combat.js:339), blockades and raids (rules/trade.js:149, 332), Army Info (rules/combat.js:86-90), and the odds and the
computer's estimates (combat.js:47 stackDmg, 437-443; ai.js:783-802).
Where the speed factor is used: landSpeed (rules/state.js:529), seaSpeed (rules/movement.js:3), wingSpd (rules/air.js:28).

---

## 2. THE NEW PENALTY

### The rule

over = (size − limit) ÷ limit
- **Efficiency (damage)** = 1 − over, at least **15%**
- **Speed** = 1 − over ÷ 2, at least **50%**

In code this only changes rules/combat.js:24-25 and STACK_FLOOR in rules/data.js:613 (0.25 becomes 0.15). The STACK_K and
STACK_SPD_K constants go. Every user listed above picks up the change by itself.

### Land (limit 10)

| Ground units | 10 | 11 | 12 | 13 | 15 | 17 | 18 | 19 | 20 | 40 | 128 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Efficiency** | 100% | 90% | 80% | 70% | 50% | 30% | 20% | 15% | 15% | 15% | 15% |
| Damage | 0 | −10% | −20% | −30% | −50% | −70% | −80% | −85% | −85% | −85% | −85% |
| Speed | 0 | −5% | −10% | −15% | −25% | −35% | −40% | −45% | −50% | −50% | −50% |
| Today: damage / speed | 0 / 0 | −5 / −1 | −10 / −3 | −15 / −4 | −23 / −6 | −30 / −8 | −33 / −9 | −36 / −10 | −39 / −10 | −75 / −21 | −75 / −38 |

The damage floor starts at 19 units and the speed floor at 20.

### Ships, aircraft, troops at sea (limit 5)

| Units | 5 | 6 | 7 | 8 | 9 | 10 | 13 |
|---|---|---|---|---|---|---|---|
| **Efficiency** | 100% | 80% | 60% | 40% | 20% | 15% | 15% |
| Damage | 0 | −20% | −40% | −60% | −80% | −85% | −85% |
| Speed | 0 | −10% | −20% | −30% | −40% | −50% | −50% |
| Today: damage / speed | 0 / 0 | −10 / −3 | −19 / −5 | −26 / −7 | −33 / −9 | −39 / −10 | −54 / −14 |

Every size over the limit loses more damage and more speed than today, the 128 stack included (damage −85% instead of −75%,
speed −50% instead of −38%).

### Why the floor is 15%, not 25%

With a 25% floor, damage would be the same as today for every land army of 39 or more, because today's curve also reaches 25%
there. So the 128 stacks the owner complained about would not lose any more damage. The duel showed it: "13 stacks attack 128
from one side, in a city" was still won by the 128. With 15%, that case flips (see below).

### Said plainly: an army a little over 10 hits less than an army of 10

Units × efficiency gives how many full units an army hits like:

| Units | 10 | 13 | 15 | 18 | 20 | 30 | 40 | 67 | 128 |
|---|---|---|---|---|---|---|---|---|---|
| Hits like (new) | 10 | 9.1 | 7.5 | 3.6 | 3.0 | 4.5 | 6.0 | 10 | 19.2 |
| Hits like (today) | 10 | 11.1 | 11.6 | 12.1 | 12.2 | 11.5 | 10 | 16.8 | 32 |

- Adding units to a full army makes it weaker. An army of 18 hits like 3.6 full units. The panel will show this, which is the
  point: never go over 10.
- Splitting always wins. 128 units in armies of 10 hit like 128. As one army they hit like 19.2.
- The other option is "units over the limit add nothing" (efficiency = 10 ÷ size, at least 15%). It never drops below 10, but it
  is milder (20 units = 50%). In the duel it **lost** "2 × 10 attack 20, city, one side" on every seed. So it is only offered in
  question 2.

### Stack-duel over 6 seeds (tools/stack-duel.js; seeds 4242, 1, 7, 99, 2026, 31337)

How often the split side wins (table-numbers.jpg):

| Case | Today | Draft (floor 25%) | **New (floor 15%)** |
|---|---|---|---|
| All 6 open-ground cases | 6/6 each | 6/6 each | **6/6 each** |
| 128 attacks 13 stacks; 13 stacks attack 128 from 3 sides; 20 attacks 2 × 10 (all in a city) | 6/6 | 6/6 | **6/6** |
| 13 stacks attack 128, city, one side | 0/6 | 0/6 | **6/6** (attackers keep 93%, 72 h) |
| 2 × 10 attack 20, city, one side | 0/6 | 5/6 | **6/6** (keep 67%, 57 h) |
| 2 × 10 attack 20, city, two sides | 0/6 | 6/6 | **6/6** (keep 68%, 46 h) |

- With the 25% floor, one city case was won on only 5 of 6 seeds, so it could not be made required.
- With 15%, all 12 cases win on all 6 seeds. So all 12 become **required**, and the three "informational" marks at
  tools/stack-duel.js:98 and 103-104 go.
- The duel itself gets a `--seed` option, and the test runs at least 3 seeds.
- New duel cases: a convoy of 8 against two convoys of 4 meeting a frigate; a fleet of 7 against 5 + 2; an air wing of 7 against
  wings of 5 + 2 over a SAM.

### Troops on ships count towards the sea limit

**Damage** depends on where the army stands:
- An army counts as being on water when it stands in a sea province (G.P[a.at].sea), or is on a leg into one
  (a.to != null && G.P[a.to].sea).
- On water, its ground units count as sea units, together with its ships. Its land count is then 0.
- An army still boarding in its port stands on land. It fights with the land count (8 / 10 = 100%), so a full army attacked in
  port is not cut to 15%.

**Speed** depends on the leg:
- seaSpeed (movement.js:3) and walkSpeed on water (movement.js:377) use the sea count, with the troops in it.
- landSpeed uses the land count.
- In code: stackSizes(a) works out "on water" from the army itself, so the callers that pass nothing stay right: trade.js:149 and
  332, tick.js:265, air.js:114, combat.js:86, 339 and 437. stackSpd takes the leg's kind ('water' or 'land'). seaSpeed always
  passes 'water' and landSpeed always 'land'. Only the route preview asks "what if" for a route that is not sailed yet.

Examples:
- 5 infantry on ships: 5 / 5, 100%.
- 8 infantry on ships: 8 / 5, 40% damage, −30% speed (about 230 km a day instead of 325).
- 10 on ships: 15% damage, half speed (about 160 km a day). After landing they count 10 / 10 again: 100%.
- 2 frigates + 3 infantry in one army: 5 / 5. 2 frigates + 5 infantry: 7 / 5, 60%.

### The escort bonus (needs a decision, question 7)

- Today a convoy with ships in the same army sails 15% faster (movement.js:3; "Escorted convoys +15%", data.js:176).
- If troops and ships count together, 1 frigate + 5 troops is 6 / 5: −10% speed and 80% damage. So the escort only pays off with
  4 troops or fewer. A fleet sailing as its own army next to the convoy gives no bonus today.
- **Default (B):** count ships and troops together, as the owner wrote. The +15% also goes to a convoy that has an own fleet
  **as a separate army in the same sea province**. So the usual way is a convoy of 5 sailing next to its own fleet of up to 5.
- Option A: keep today's rule (bonus only for ships in the same army) and accept that an escort costs room.

### The hard 10-unit cap from the main proposal

The owner wants efficiency to drop "the further the army goes over", so an army must be able to go over 10.
- **No hard cap for players.** The steep curve is the limit: an army of 15 deals half.
- **The Merge button still packs** into armies of 10 or fewer ("Merged into 3 armies: 10, 10, 7"), so one tap never makes an army
  over the limit. A drag-join may go over 10. That is the player's choice, and the panel shows the cost.
- **The computer never has an army over any limit** (land 10, fleet 5, wing 5, convoy 5). See section 5.
- Option (question 1): keep the hard cap of 10 for land.

---

## 3. HOW EFFICIENCY SHOWS IN THE ARMY PANEL

### Where and in what order

- Army bar (armyBarHTML, index.html:12639-12655): the panel you get when you tap an army. It is the same on desktop (side panel)
  and on a phone (bottom sheet).
- The order is fixed: **health bar → efficiency line → Landing / Embarking line** (.ab-emb, index.html:12648) → Dug in → stats.
  The sheets show this for an army of 8 boarding.
- Air wing panel (wingHTML, index.html:12530-12560): the same line, under the unit row and above Airframe condition.
- Fleets and convoys use the army bar, so they get the same line.
- Identified foreign armies show it too (question 6). An unidentified army shows nothing.

### Wording (as in the sheets)

At or under the limit, one line:
> **Efficiency 100%** · 10 / 10 ground units

Over the limit, two lines:
> **Efficiency 70%**
> −30% damage · −15% speed · 13 / 10 ground units

Other kinds:
- Fleet: "−40% damage · −20% speed · 7 / 5 ships"
- Air wing: "−40% damage · −20% speed · 7 / 5 aircraft" (a swarm card counts as one aircraft)
- Convoy: "… · 7 / 5 at sea (troops on ships)". With ships in it: "… at sea (ships + troops)".
- An army boarding in port gets a second line: "At sea: 40% · −60% damage · −30% speed · 8 / 5". This is plain information, in the
  same style.

**Fit (measured in the mockup):**
- The longest text, "−85% damage · −50% speed · 13 / 5 at sea (troops on ships)", fits on one line in the 344 px desktop panel
  (the line is 299 px wide) and on the 440 px phone (396 px). So every case takes exactly 2 lines.
- A 390 px phone has about 346 px for the line, which is wider than desktop, so it fits there too. The real screenshots still
  include 390 px.
- No tooltip is needed. The longer explanation ("troops on ships count as ships; armies at or under the limit fight at full
  strength") goes in Army Info.

**Speed cell:** the Speed cell in the stats row shows the proposed speed. For an army on water it shows its speed at sea (today it
always shows land speed unless the army is ships only, index.html:12617). The kv "Speed" row (speedHTML) shows land and water
speeds, each with its own count.

### Colours (plain text on the panel; no ⚠, no box, no border)

- 100%: green text, `var(--ok-t)` (#9fe08e: 5.3:1 on the panel colour #3b525a).
- 50–99%: amber text, a **new token `--warn-t: #f0c060`** (4.9:1). Not `--accent`, which is cyan (#4fd0de, index.html:16, 1090).
- Below 50%: red text. Today's `--danger-t` in the slate palette (#ff9088, index.html:1091) measures **3.8:1** on the real panel
  pixel, which is below AA (4.5:1) for 11.5 px text. Proposal: raise the slate `--danger-t` to **#ffb3ab (4.8:1)**, which also
  helps every other red text there. The sheets use #ffb3ab. If the owner wants other red text left alone, use it only for this
  line.
- The number and the words carry the meaning, so it also works with the colour-blind setting.

### What is removed

- **Map:** the stack mark on the counter (index.html:9039-9042, drawn at 9064). The red label under a dragged counter
  (10856-10857). The crowding badges of the main proposal 4B are dropped too.
- **Pop-ups:** no stack text in any toast. The drag-join toast (10831-10834) and the Merge toast (12926) keep only "Merged 4 units
  into 1st Army: 14 units." (kind 'good'). The log lines at rules/combat.js:376 and rules/tick.js:95 lose the stack text (the
  tick.js one goes), and no stack line is ever kind 'bad'. Every log line with a kind also becomes a toast (index.html:13961).
- **Panel:**
  - These are replaced by the efficiency line: the red ⚠ box (12653), the "Stack" row (stackHTML 12605-12607, used at 12558 and
    12710) and the ⚠ status box (stackLine 12608, used at 12556).
  - Army Info (12690) says: "Efficiency 70%: −30% damage, −15% speed (13 / 10 ground units). Armies at or under the limit fight at
    full strength."
  - The odds preview (12504) says "Your army's efficiency: 70% (−30% damage)", without ⚠.
  - The Merge button's title loses "Over stack limit" (12723).
  - stackWarn and stackText (index.html:12592-12608 and combat.js:44) are deleted once nothing uses them.
- **Kept:** the "× N armies" count on the province counter (main proposal 4B). It is a plain count in the counter's own style,
  with no colour, and it explains the "128": tap any of the 14 armies and it shows Efficiency 100%.

### Planned route box: one action, not a warning

With no warnings anywhere, a player's normal 10-unit invasion would sail at half speed and 15% damage, and the player might not
notice. So when a planned route crosses water and the army is over 5 at sea, the route box shows:
- the numbers: "At sea: 10 / 5, efficiency 15% (−85% damage, −50% speed)", and
- a button: **"Sail as convoys of 5"**. One tap splits the army into convoys of 5 or fewer with the same route (splitPlan), and
  they join back after landing (question 5).

### Screenshots for the real build (desktop 1440 × 900 at 344 px panel; phones 390 × 844 and 440 × 956), to the shots branch

- Land armies of 10, 11, 13, 15 and 20.
- Fleets of 5, 6 and 7. Air wings of 5 and 7.
- A convoy of 7 and of 13 at sea (the longest text).
- An army of 8 boarding in port (order: health, efficiency, embarking), and its route box with the convoy button.
- An identified foreign army of 12. Army Info of a 15 army.
- The map with a 20 army (no mark). The toast after a drag-join to 14 (no warning).

---

## 4. CHANGES TO THE MAIN PROPOSAL (section 4, Stacks)

1. **4A hard cap:** replaced by section 2 here. No cap for players; the Merge button packs into 10s; the computer has a hard rule.
   The "Drag-join refused: Army full (10/10)" row and question 9 there go.
2. **"Air (5) and sea (5) keep today's soft penalty":** replaced. All three domains use the new curve, and troops on ships count
   to sea.
3. **4B crowding display:** the map badges go. If crowding stays (question 4), it shows only in the army panel and the route box:
   "−30% speed going into a crowded province (70 / 50)".
4. **4C item 7, landing waves:** **at most 5 convoys in one sea province** (25 troops), which keeps the owner's "about 4–5 armies
   in a province". When a landing ends (the landing timer in rules/movement.js reaches 0), the computer's convoys that landed in
   the same province with the same order merge back into armies of 10 or fewer (checked with stackPenaltyIf on land). Today the
   computer's packing (ai.js:708-715) only joins idle armies in its own provinces, so convoys attacking a beach would stay small.
5. **Stack-duel:** all 12 cases required, at least 3 seeds, plus the new cases in section 2.
6. **Old saves:** the S.noBig split also covers fleets, wings and convoys (section 5).
7. **Done when:** add "no computer army over its limit in any domain at any time". For an army at sea, the probe counts its troops
   as sea units.

---

## 5. OLD SAVES, THE COMPUTER, TESTS

### Old saves (flag S.noBig)

- On load, every army over its limit is split once into equal armies within the limit, in the same place, with the same orders.
- **Land armies, fleets and convoys:** use splitPlan (movement.js:133). It already copies to, t, path, legFrom, m, stance, from,
  froms, landed, forced, fire, delay, home, retreating, chase, dest, wp, emb, land, hrt and pos.
  - After splitPlan, also copy what it does not copy: **sail** (deep copy; the walk inside a province, movement.js:375-412),
    **join, tgt, dig, carry, seaIdle**, and the fleet orders **blk and raid**. Without them a split fleet would stop blockading and
    a split convoy on a pinpoint sail would stop.
  - Convoys mid-leg keep to, t and legFrom, so they sail on together.
- **Air wings:** splitPlan refuses wings (movement.js:134), so a new **wingSplit** is needed:
  - It copies base, car, mission, wear and cd, and counts in cards with rPack, as stackSizes does.
  - **pend** (aircraft that join when the wing lands, air.js:290) goes to ONE wing only. Copying it would make duplicate aircraft.
  - A wing in flight gets a flag and is split when it lands (the f.ph === 'back' branch, air.js:290). No order is copied
    mid-flight.
- One message, in the log only (no kind, so no toast): "Armies over their limit (10 ground units, 5 ships, 5 aircraft, 5 at sea)
  were split into smaller armies with the same orders."

### The computer

- **Where convoys are split:** once, in embStep (movement.js:466), on the first boarding hour (a.emb == null), for computer seats
  only. The army is split with splitPlan into shares of 5 or fewer by the sea count. splitPlan copies path, delay, dest and emb, so
  the convoys board and sail together. This one place covers every reason the computer sails: offensives (ai.js:783-802), landing
  targets, and the naval-cities trip home (ai.js:748-760).
- **Forces already at sea** (old saves, or ones idle with seaIdle, ai.js:751) can hold 10. They are split where they stand, with
  the same function.
- **aiSplitToLimit** (ai.js:883) gets a "water" size argument, and the embark hook above calls it. Today it only runs on idle
  armies in the computer's own land provinces, where troops count as land.
- **Packing** (ai.js:713): ground units may no longer join an army that holds ships (today shipsOnly(b) === shipsOnly(a) lets
  ground units join a mixed army, which would become 13 / 5 at sea).
- **Production** (production.js:114) checks room on land, so a port army of 10 is fine until it sails. The embark split is what
  keeps it within the limit at sea, and the probe checks sea sizes with troops counted.
- **Air wings:** the computer never builds a wing over 5 (production.js:112-114) and never merges wings. Only old saves need
  wingSplit.
- **Strength estimates** (power × stackDmg, ai.js:783-802) pick up the stronger curve by themselves.

### Tests and docs

- **.test/stacks.js:**
  - the new tables (land 10/11/13/15/19/20; sea and air 5/6/7/10);
  - troops count to sea on water and to land in port and ashore;
  - the boarding army fights at its land count;
  - the escort mix (2 frigates + 5 infantry = 7 / 5) and the escort rule from question 7;
  - land and sea speed per leg;
  - the old-save split for land, fleets, convoys mid-leg, a sailing convoy, a blockading fleet, and wings at base and in flight,
    checking that every field survives and pend is not doubled;
  - the computer is never over a limit.
- **tools/stack-duel.js:** `--seed`, all 12 cases required, and the new cases.
- **.test/stack-shots.js** is the only test that looks for the old warnings (ab-stk, stk-warn, stackMark, stackText). It is
  rewritten for the efficiency line, its words and colours. It also checks that no stackMark is ever drawn and that no toast
  carries stack text.
- The golden fingerprint (tools/golden-12345.txt) is made again.
- The computer probe (probe2.js): no army over its limit in any domain, with troops at sea counted as sea.
- **docs/COMBAT.md** section 1 (the tables at lines 29 and 42, and lines 92-93 about the red mark) is rewritten.

---

## 6. QUESTIONS FOR THE OWNER (my default in brackets)

1. No hard cap for players? The steep penalty is the limit, the Merge button packs into 10s, and a drag-join may go over.
   [yes; option: a hard cap of 10 for land, so only fleets, wings and convoys can show less than 100%]
2. The curve: −10% damage and −5% speed per ground unit over 10; −20% and −10% per ship, aircraft or troop at sea over 5; floors
   15% damage and 50% speed? It means an army of 18 hits less than an army of 10. [yes; option: "units over the limit add
   nothing" (10 ÷ size), which never drops below 10 units' worth but lost one city duel on every seed; option: half as steep]
3. Ships and aircraft over 5: the same share of the limit (−20% per unit over), or the same per unit as land (−10%)? [the same
   share: 6 / 5 is as bad as 12 / 10]
4. Keep the crowding slowdown for players going into a province with over 50 own units, shown only in the army panel and the route
   box? [yes; option: drop it for players and keep only the computer's 5-army rule]
5. Players' convoys: a "Sail as convoys of 5" button in the route box (convoys join back after landing)? [yes, the button; option:
   split by itself on boarding; option: neither]
6. Show the efficiency of identified foreign armies? [yes; unidentified ones show nothing]
7. Escorts: count ships and troops in one army together (the owner's words) and give the +15% escort speed to a convoy with an own
   fleet as a separate army in the same sea province? [yes (B); option A: keep today's rule, ships in the same army only]

---

## APPENDIX: review points taken differently or not taken

- **"Efficiency = max(floor, 10 ÷ size)" as the fix for the curve shape:** tested, not taken as the default. Over 5 seeds it lost
  "2 × 10 attack 20, city, one side" every time. The run hit its time limit on the 6th seed, but it had already lost on all 5. It
  is offered in question 2, and the curve shape is now said plainly in section 2.
- **"Compute water inside stackSizes(a) only, with no new parameter":** taken for damage and for every caller listed. Speed still
  takes the leg's kind ('water' / 'land'), because the same army uses both counts on one route. seaSpeed and landSpeed each pass a
  fixed value, so no caller has to choose.
- **Player convoys:** the review offered the button or "split by itself" as the default. I took the button, because the owner
  wrote "a convoy of more than 5 gets the penalty too", so a big convoy should stay possible. Splitting by itself is the option in
  question 5.
- **Panel fit:** the review expected the convoy text to wrap to 3 lines. It was shortened to "at sea (troops on ships)" /
  "at sea (ships + troops)". The mockup measured exactly 2 lines at 344 px and at 440 px. 390 px is kept in the screenshot list.
- **Red colour:** the review said to use `--danger-t`. Measured on the real panel pixel, the slate `--danger-t` is 3.8:1, below
  AA, so the addendum proposes raising it to #ffb3ab (4.8:1).
