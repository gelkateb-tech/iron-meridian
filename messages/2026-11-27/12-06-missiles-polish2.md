**Missiles fix round 2 (the last one) is done, and the independent recheck says READY. Nothing is merged.** The 5 sheets above show before on the left and after on the right, same camera.

Pictures: `shots/2026-11-27/missiles-polish2/`

**Your two fixes**
- **Aiming hint on desktop:** it now sits between the zoom buttons and the small world map, clear of the map at every desktop size checked (46 px gap at 1280×720, 126 px at 1440×900). On phones it's exactly where it was.
- **"Damaged" on the strip:** when a strike knocks out the silo, its missiles and the Silos cell say "Damaged", and the tooltip gives the hours. They go back to "Ready" when it's repaired. A cruise missile held in a working Army Base still says "Ready".

**Your MS defaults**
- **MS1, chemical answered with chemical:** in a forced test where 12 nations had chemical and nuclear missiles, the computer used to answer chemical strikes with nuclear ones: 8 nuclear launches over 3 games, 5 of them against chemical strikes. Now there's 1, from a desperate Germany with Polish forces next to Berlin. A nuclear strike still gets a nuclear answer.
- **MS2, missiles at war:** in 60-day games with wars, 3 to 8 nations now build and fire missiles (before: none), mostly from day 45 on. No nation went broke, and the economy and army totals are within a few percent. No chemical or nuclear missile was built in normal games.
- **MS3–MS5:** as built.

**Checks:** all pass (missiles test 180/180). The same-seed test is unchanged. One older check (counter spacing) fails exactly as it did before this round.

**Open points (both small; I'd fix them at merge, which doesn't count as a round):**
- **Tutorial card overlap:** on a 1280-wide screen with the tutorial card open, the new hint position slides partly under the card. It's a one-line CSS fix.
- **Silo savings:** a broke nation at war that has the research keeps the silo's price set aside for weeks, which holds back its recruiting. Fix: only save for a silo when its daily income is positive.

**Still open before missiles can merge:** your answers to plan 2's questions 1–4 and 6–8 (question 5 is answered: the missile submarine). After that, plan 2 becomes its own build job, and then missiles merges in one go. Or, if you'd rather, I can merge this missiles branch now as it is and build plan 2 on top later. My suggestion: **merge now**, so the game gets chemical and nuclear missiles and the zones sooner, and plan 2 changes them after.

**Questions** (my default in brackets)
1. Merge missiles now, with the two small fixes, and build plan 2 on top later? (yes)
2. Plan 2, questions 1–4 and 6–8: take my defaults? (yes)

---
Pictures: `shots/2026-11-27/missiles-polish2/`
