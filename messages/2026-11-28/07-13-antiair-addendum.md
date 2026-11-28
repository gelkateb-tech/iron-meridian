**The anti-air addendum is ready (proposal only; nothing in the game has changed). It covers your points 4–6: stacks, fleets and air wings of 5, and the efficiency line.** The sheets are above: the numbers table, then mockups of the army panel on desktop and phone. The full text is in `docs/ANTIAIR-ADDENDUM.md`.

Pictures: `shots/2026-11-28/antiair-addendum/`

**The new penalty: damage and speed both, steeper than today**
- **Land:** each unit over 10 costs 10% damage and 5% speed.
- **Ships, aircraft and troops at sea:** each unit over 5 costs 20% damage and 10% speed. Troops in transports now count towards the sea limit of 5.
- **Floors:** damage never drops below 15%, and speed never below 50%.
- **Examples:**
  - Land army of 13: efficiency 70%, −30% damage, −15% speed (today −15% and −4%).
  - Land army of 20: efficiency 15%, −85% damage, −50% speed (today −39% and −10%).
  - Convoy of 7 at sea: 60%, −40% damage, −20% speed.
- **A side effect to know about:** an army just over the limit now hits less than one at the limit. An army of 18 hits like 3.6 full units, where an army of 10 hits like 10. So splitting into armies of 10 always wins. That's the point, but it's steep.
- **The battle test:** in the combat test on 6 random seeds, split armies won all 12 cases. Today the split side loses 3 of them.

**The efficiency line (mockups above):**
- It sits under the health bar when you tap an army: "Efficiency 70%", and under it "−30% damage · −15% speed · 13/10 ground units".
- Colours: green at 100%, amber from 50% to 99%, red below 50%. The red is a little lighter than today's so it's easy to read.
- Nothing appears on the map, and there are no pop-ups.

**The computer:** it splits troops into convoys of 5 when they board, sends at most 5 convoys into one sea area, and joins them back into armies of 10 after landing. Old saves with big fleets or air wings are split the same way.

**One thing to settle, because your two points pull apart:** point 4 says "10 units per army at most", but point 6 describes efficiency "dropping the further the army goes over it", which means armies can go over. Conflict of Nations allows going over with the penalty. My default is the Conflict of Nations way:
- no hard cap for you;
- the steep penalty is the limit;
- the Merge button packs into armies of 10.

Question 1 lets you pick a hard cap instead.

**Questions** (my default in brackets)
1. No hard cap: the steep penalty is the limit, and Merge packs into 10s? Or a hard cap of 10 on land? (no hard cap)
2. The curve as above: −10% damage and −5% speed per ground unit over 10, −20% and −10% per unit over 5 at sea and in the air, floors 15% and 50%? (yes; option: half as steep)
3. Ships and aircraft over 5 cost the same share as land (−20% per unit)? (yes)
4. Keep the crowding slowdown for armies going into a province with over 50 of your units, shown only in the army panel and the route box? (yes; option: only the computer's 5-army rule)
5. A "Sail as convoys of 5" button in the planned-route box, with convoys joining back after landing? (yes)
6. Show the efficiency of identified foreign armies? (yes; unidentified armies show nothing)
7. Escorts: count ships and troops in one army together, and give the escort speed bonus to a convoy sailing next to its own separate fleet? (yes)

With your answers to these and to the main proposal's 10 questions, this becomes one build job after the merges.

---
Pictures: `shots/2026-11-28/antiair-addendum/`
