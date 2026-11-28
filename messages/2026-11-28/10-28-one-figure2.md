**The one-figure follow-up is done (one round plus one repair). It's on its own branch and not merged yet; it merges after the combat display, missiles and cities-redo, as you asked.** The sheets compare today's look (left) with the branch (right), using the same camera, on desktop and phone at three zoom levels. There are also two clips.

Pictures and clips: `shots/2026-11-28/one-figure2/`

**What changed**
- **One figure per army is now the default.** The old look is still there for comparison with `?fig=0`.
- **The rifleman is bigger:** twice the transport's scale, up from 1.6 times. At rest he stands a step further from the front wheel, so his head stays clear of the dot. He still kneels at the front corner in a fight.
- **The dot stays on the hull.**
- **Marching figures sit on their road.** Today a marching figure hangs about 30 px below its road at the closest phone zoom. Now it stays on the road or railway at every zoom, right to the end of the march. Once it halts, it glides onto its standing spot over about 2 seconds, at most a pixel per frame. There's no jump when an army sets off.
- **What the check caught:** in the first round, figures still drifted up to about 23 px off the road for the last third of a march. The round's own test had stopped too early to notice this. The repair fixed the drift, and the test now runs to the halt and for 3.5 seconds after. Measured over the whole march on a phone, 90% of frames are within 0.001 of a map pixel of the road.
- **Speed:** level with today on phone (pan and zoom frame rates within run-to-run noise).

**Checks:** everything passes except anchor-check:
- Its plate-to-figure gap part fails the same way on master; that failure is not new.
- Its "place name over a figure" part is new, and it's question 1 below.

**Question** (my default in brackets)
1. In the one-figure look, a place name fades to under half strength while a figure stands under it. The strict check counts these as names covering a figure: 132 of 4,073 samples. Should the check accept a faded name over a figure? Or keep it strict, which means moving the names or figures apart before this merges? (accept the faded name; it's the look we built)

**Still running:** fighter round 2 and its merge. After it: the combat display, missiles and cities-redo merges, one at a time with full checks, then Naval Yards.

---
Pictures: `shots/2026-11-28/one-figure2/`
