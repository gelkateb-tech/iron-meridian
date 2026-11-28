**The fighter is merged and in the Dev Build as Version 73.** It passed an independent check, one repair and the full checks. Nothing went to public. The sheets show today's v72 (left) next to the new version (right), on desktop and phone.

Pictures and clip: `shots/2026-11-28/fighter2/` and `shots/2026-11-28/fighter2-fog/`

**What you asked for**
- **Attack is about 1 HP per strike**, shown as a plain attack number of 1 in Army Info against infantry, armour, ships and submarines. v72 showed 2.3 / 1.8 / 2.7 / 2.7. For comparison on the same scale, infantry is 3, a tank 6 and a Strike Fighter 9.6.
  - Measured per sortie: infantry 1.0 HP, tank 0.9, frigate 0.8, submarine 1.2.
  - Air-to-air is unchanged, identical to six decimals over 1,100 test raids.
- **Harassment works, and the sheets show both cases:**
  - **Troops at sea:** a German convoy off Saint Petersburg. You tap its counter, the wing strikes, and the report reads "Attack on Germany troops at sea in Baltic Sea IV: 1 damage". The convoy sails on.
  - **An army on the move:** German infantry marching on Moscow from Orel. The report reads "1 damage", and the column keeps marching.
  - The wing follows a moving target into the next province while it stays in range.
  - Before this, it couldn't work at all: the rules only counted forces standing still, and tapping a moving counter picked the province.
- **The at-sea factor now applies to the fighter's strikes:** 1.5x unescorted, 0.75x with a warship of their own nation in that sea zone. One fighter does about 1.5 HP to an unescorted convoy. It now also applies to Strike Fighters, bombers, drones and UAV salvoes, since they share the same strike code. That's slightly more than you asked for.
- **Patrol for the Strike Fighter** is in.

**What the check caught and the repair fixed:** attacking an unidentified "?" contact gave away whose it was. The game asked "Declare war on United Kingdom?" for a convoy you couldn't see (the "before" picture). Now:
- a "?" contact is never named, and the report reads "Attack on unidentified forces at sea in …";
- a "?" contact that belongs to a nation you're at peace with is followed but not hit, and no war starts.

**Checks:** all pass except the anchor check's old plate-to-figure gap item, which fails the same way on master. The fighter's own tests pass: 102 of 102, and the tap test passes too, after one phone timing flake that passed when rerun.

**Health for troops at sea (proposal only, not built; details in `docs/TROOPS-AT-SEA-PROPOSAL.md`)**
- Today they keep their land HP and take 1.5x damage. Your guess of half their land HP gives: infantry 5, artillery 4.5, tank 7, IFV 6.
- The simplest build is to double the at-sea factors, to 3.0x unescorted and 1.5x escorted. That works out the same as half HP, and old saves need no conversion.
- On a convoy of 3 infantry:

| | Today | Half HP |
|---|---|---|
| One fighter Attack | 1.5 HP | 3.1 HP |
| Two Strike Fighters, unescorted | 2.4 of 3 units lost | all 3 lost |
| Two Strike Fighters, frigate escort | 0.5 lost | 1.5 lost |
| A 2-day crossing harassed by 4 fighter sorties | lands at about 80% | lands at about 60% |

- What it means: an unescorted invasion fleet within reach of enemy Strike Fighters would rarely arrive, so escorts and air cover matter much more. The landing battle itself is fought ashore at normal HP.

**Questions** (my default in brackets)
1. Build half HP at sea as 3.0x unescorted and 1.5x escorted? (yes, as a small job after the merges)
2. Keep the at-sea factor on all air strikes and UAV salvoes, not just the fighter's? (yes: troops at sea are weak against any aircraft)

**Running now:** the next merges, one at a time with full checks:
1. The combat display, with your own label allowed to sit a little further out when crowded.
2. Missiles, with its two small fixes.
3. Cities-redo, with the revert put back, your capital's lots first, building pictures darkened properly at night, and no frames.

Then the Dev Build, then Naval Yards.

---
Pictures: `shots/2026-11-28/fighter2/`, `shots/2026-11-28/fighter2-fog/`
