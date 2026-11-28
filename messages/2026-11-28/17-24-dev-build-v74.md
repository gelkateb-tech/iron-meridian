**The combat display and missiles are merged and in the Dev Build as Version 74.** Each merge was done on its own with the full checks. Nothing went to public. Cities-redo is not in yet: its merge test found one problem, which is being sorted out now (below).

Pictures: `shots/2026-11-28/combat-display-merge/` and `shots/2026-11-28/missiles-merge/` (the `sheet-*` files compare before and after)

**Combat display**
- "Fighting" and the enemy army, a countdown to the next 15-minute round, and each round's losses, shown in the army bar and on the map. The rounds themselves are unchanged, as you asked.
- Your default is in: zoomed out with three armies fighting in one spot, your own army now keeps its full label a row or two above the counters. Before, it shrank to the short form and sat over the enemy's counter. Closer in, nothing changed.

**Missiles**
- In as built: chemical and tactical nuclear missiles, the Conventional Warhead silo, and cruise missiles without a silo.
- **The two small fixes:**
  - At 1280 px wide with the tutorial card open, the aiming hint used to sit over the card and the minimap. Now it sits clear of both, on every desktop width from 1024 to 1920 px. Phones are unchanged.
  - A nation whose daily income is below zero no longer saves money for a silo. It keeps recruiting instead.
- **One thing to know:** after the merge, fewer computer nations get into missiles by day 60. In four test games it was 3, 5, 6 and 1 nations (8, 4, 5 and 3 before). This comes from the merge, not from the fixes. The likely cause is that the computer now also saves for base levels and Naval Yards. Missiles plan 2 will look at it.

**Checks:** everything passes except the old plate-to-figure gap check, which fails the same way as before. One fighter test failed on a timing check in each merge and passed when run again alone.

**Cities-redo:** the four fixes are done on its branch:
- the revert is put back;
- your capital's buildings appear first, so the HQ no longer hops 4 px at game start;
- building pictures now darken at night to match the town (about 28% darker);
- no frames.

One check failed, though. Place names and anchor icons have moved at the zoomed-out view for six coastal cities: Västerås, London, Brussels, Brighton and Bournemouth. They no longer match the test's saved positions. It isn't caused by the four fixes; it comes from putting the city lots back. Each move is being checked on screen. The saved positions get updated only where the new spot looks right; anything that looks wrong gets fixed. Then comes an independent check, then the merge, then the Dev Build with the cities, so you can decide on the buildings.

**Running now**
1. **The cities merge** as above. Then the Dev Build, then Naval Yards.
2. **Missiles plan 2** on its own branch, with your defaults on questions 1–4 and 6–8:
   - new ranges, shown in map km;
   - 7 missiles, including the Nuclear Cruise Missile;
   - missiles have HP in flight, so defences shoot them down;
   - salvos share the defenders' shots, and the most dangerous missile is shot at first;
   - a launch card for every missile, with Quick fire off by default.

   No ICBM yet. Question 5 (the USA, Japan, Australia and Brazil have almost no missile war until the ICBM) is still open, so nothing changes for it.
3. The Recon Vehicle is waiting for your OK to merge.

---
Pictures: `shots/2026-11-28/combat-display-merge/`, `shots/2026-11-28/missiles-merge/`, `shots/2026-11-28/cities-merge/`
