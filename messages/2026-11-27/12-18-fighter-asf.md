**The air superiority fighter is done (1 fix round used, both final reviews READY), on branch `fighter-asf`. Nothing is merged.** The sheets and clips are above, phone 440 px, Russia, master next to the branch.

Pictures and clips: `shots/2026-11-27/fighter-asf/`

**a. Attack: the numbers for your OK.** I propose keeping the ground damage the fighter already has, which is weak, and just opening the order. Measured with the real strike rules:

| Damage per sortie | Air Superiority Fighter | Strike Fighter |
|---|---|---|
| 1 infantry | 2.3 health (about a quarter) | 9.4 |
| 1 tank | 1.6 (about a seventh) | 11.6 |
| 1 artillery | 2.3 | 8.9 |
| ships | about two fifths | full |

- It flies about 2 sorties a day, so it takes out roughly half an infantry unit a day.
- Its air-to-air strength is unchanged.
- It cuts no roads or railways and causes no war damage, so it hits units only.
- The computer doesn't use it yet.
- **Option B,** a bit stronger (about a third against everything), is one line to change.
- It's built on the branch in a single entry, so changing it takes a moment before merge.

**b. Buttons:** the fighter had Patrol and Rebase; the Strike Fighter had Strike and Rebase.
- **Fighter now:** Patrol, Attack, Rebase, Split, Merge, Return and Army Info.
- **Strike Fighter now:** Strike, Rebase, Split, Merge, Return and Army Info.
- **Return** calls a wing home from its way out or from patrol; before, nothing could.
- **Split and Merge** work for wings at the same base.
- **Left out on purpose:** Move, Waypoint, Delay and Halt, because aircraft fly missions, not routes. Return covers "stop".

**c. Patrol:** the plane now flies a calm racetrack inside the patrol area: two straight legs of about 120 km joined by smooth turns. It flies at the same speed as on its way out (about 450 km/h of game time), so a lap takes about 16 s at normal speed. Before, it raced round the edge about 11 times faster.
- Two planes over one spot fly different tracks.
- When the patrol ends or you press Return, it curves smoothly onto the line home, with no dash.
- **The clips:** the 15-second patrol, before and after, starting zoomed in over Tver with no menus; and the end of a patrol, before and after.

**d. Tapping:** a patrolling plane can now be tapped at every zoom, on phone and desktop, and opens the normal unit panel. In tests, 5 or 6 of every 6 taps hit it, even at 8× speed. A tap on a city under the plane still opens the city, unless you tap closer to the plane.

**Checks:** all pass, plus two new tests (attack rules 43 checks, tapping 54 checks). The same-seed test is unchanged. Two older checks fail exactly as they do on master; that's the waypoints job's area.

**Questions** (my default in brackets)
1. Attack numbers: keep today's weak ground damage (option A), or about a third (option B)? (A)
2. Should the fighter's Attack also be allowed to damage roads, railways and buildings? (no, units only)
3. Should the computer use the fighter's Attack? (no for now; it keeps patrolling)
4. Two small extras the study found: the AWACS button says "Patrol" but it orbits, so rename it "Orbit"? And the Strike Fighter can't patrol, though it can in Conflict of Nations; add Patrol to it? (yes to Orbit; no to Patrol for now)

**Slots:** the fighter's slot went to the one-figure test with the new infantry look. The unit picture pricing comes next, with no spend.

---
Pictures: `shots/2026-11-27/fighter-asf/`
