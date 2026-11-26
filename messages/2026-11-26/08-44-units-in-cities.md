Units in cities is done, as it stands after its last round. That's the round limit, so there are no more fix rounds. The 14 phone sheets are above, with the same camera before (left) and after (right). Nothing is merged.

Pictures: `shots/2026-11-26/units-in-cities/`

**What changed**
- **The centre marker:** every city has a small cream diamond on its exact centre point, the spot your troops must reach to hold or take it. Capitals and occupied cities always show it. A plain city's diamond is left out where it would cover a name.
- **An army on the point:** its dot sits in the diamond, and a ring lights up round it in its side's colour: green yours, blue allies, red enemies, grey unidentified. If two sides fight on one point, the ring is split between their colours. The army's counter stands just above the ring (sheet 1).
- **An army near the city:** no ring. Its dot stands just outside the diamond, and its counter stands next to its dot, on its own city's ground (sheets 2a–2d, 3a–3c).
- **Shadow and outline:** counters, badges and close-up models have a soft dark shadow and a thin outline. Their sizes are unchanged.
- **Tapping a city:** the city sheet says "In the city:" and "Nearby:", with each army's name and number of units. Enemies you can't see show as "? Unidentified" (sheet 4).

**How to read it:** a ring means the army is in the city. No ring, with the dot beside the diamond, means it's outside.

All checks pass, including old saves, and the game itself is unchanged. Speed on a phone is the same as before. On desktop each frame takes about 0.5 ms more, but it still runs at 60 frames a second.

**Where it falls short**
- **Zoomed out (hex 12):** there's no room for a second counter. An army of the same side just outside the city joins the city's counter, and only its dot, outside the ring, shows it's outside.
- **Direction:** the outside army's dot moves aside for borders, names and the city's counter. At mid and play zoom it's often drawn on a different side of the city from where the army really is. For example, Berlin east is drawn south-west.
- **Szczecin at play zoom:** it's on the coast and the border, so an outside army's counter stands 48–76 px out.
- **Small overlaps** with three armies at once: at Szczecin a counter partly covers the city's name, and at Poznań a counter stands about 35 px from its dot (sheets 6c and 3c).
- **Before merging:** today's merges touched the same file, so it needs one tidy merge with master and a re-run of the checks. I'll do that as soon as you OK it.

**Questions** (my default in brackets)
1. Zoomed out, is it OK that an army just outside a city joins the city's counter, with only its dot showing it's outside? (yes)
2. Is it OK that the outside army's dot is often drawn on a different side of the city from its real direction? (yes: the ring is what tells you in or out)
3. Szczecin: should an outside army's counter stand beside the city's counter instead of further out? (yes)
4. Zoomed all the way out, should every city have a diamond, not just capitals and occupied cities? (no, too cluttered)
5. Should provinces without a city get a diamond on their centre? (no)
6. Zoomed right in, the city's name moves beside the ring while an army holds it. Keep that? (yes)

One note on how this fits with the city building lots: the new lots keep each city's centre point clear, with the HQ on a square just north of it. So the marker and ring stay visible once both are merged.

---
Pictures: `shots/2026-11-26/units-in-cities/`
