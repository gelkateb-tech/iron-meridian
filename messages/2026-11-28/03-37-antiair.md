**The anti-air, speeds and stacks proposal is ready; the sheet with all the numbers is above. Nothing in the game has changed.** The full text is in `docs/ANTIAIR-SPEEDS-STACKS-PROPOSAL.md`.

Pictures: `shots/2026-11-28/antiair-proposal/`

**First, the "128" stack: it wasn't one army, and there is a real bug.**
- It was 14 Norwegian armies in Oslo (132 units, day 100), all drawn as one counter showing the total. In 10 computer games, no single army ever went over 10 units.
- **The bug:** the computer's capital-threat test only answers yes or no. One small French army of 4 passing next door, plus 3 frigates and 4 small troop convoys at sea, counted as a full threat. Norway froze all 14 armies at home while new ones kept arriving.
- **Also:** gathering points have no limit, armies queue behind battles, half-full armies aren't packed together, and troops pile up at sea.

**1. Three anti-air units**

| | Mobile Anti-Air gun (new) | Mobile SAM | Missile Defence (new) |
|---|---|---|---|
| Built at | Army Base II | Army Base III | Army Base V + Anti-Missile Shield I |
| Cost, build time | $26M, 30 h | $44M, 48 h | $72M, 60 h |
| Shoots | aircraft in its own province; best against helicopters and drones | aircraft and missiles | missiles only |

- **Missile Defence is the best missile stopper** in plan 2's model. Six or more of them stop 84% of cruise missiles, 80% of ballistic missiles and 37% of ICBMs at Shield III. That beats today's best, 8 SAMs.
- For the same money, 2 Missile Defence stop 22% of ballistic missiles where 3 SAMs stop 10%.
- Cruise missiles stay the easiest to stop, and no defence is ever certain.

**2. The Interceptor is removed.** The Air Superiority Fighter takes over: from day 1 at Airbase I, for $78M with no rare materials, with the Interceptor's strength against bombers and drones. In old saves, Interceptors become Air Superiority Fighters. One effect: early Strike Fighter and helicopter raids get weaker, because the fighter hits them much harder than the Interceptor did (27 damage instead of 12).

**3. Speeds** (hexes a day; days for a 900 km march on plains)

| Unit | Today | New | 900 km, hours |
|---|---|---|---|
| Tank | 6 | 5 | 20 → 24 |
| Rocket artillery | 7 | 5 | 17 → 24 |
| Artillery | 3 | 2.5 | 40 → 48 |
| Mobile SAM | 4 (wheels) | 2.5 (tracks) | 30 → 48 |
| Mobile Anti-Air (new) | – | 3 | 40 |
| Missile Defence (new) | – | 2 | 60 |

Infantry, IFV and Special Forces are unchanged. A mixed army also now takes its slowest unit's road speed, so tanks with rocket artillery on a highway make 1,350 km a day instead of 1,980.

**4. Stacks**
- **Hard limit of 10 units per army:** the Merge button packs armies into groups of 10 ("10, 10, 7"). In old saves, bigger armies are split with the same orders.
- **Crowding:** comfort is 50 units per province (5 full armies). Above that, armies going into the province get slower: −15% at 60, −45% at 80, −60% at 90 or more. Leaving, rail and retreats are never slowed. For comparison, today one real 128-unit army is only 38% slower.
- **The computer:**
  - At most 5 armies per province, at sea too.
  - The threat test now counts real enemy land power.
  - Extra attackers gather next to the target and attack from another side.
- **Display:** the province counter shows the total plus "× N armies", with a yellow or red crowding badge.
- **Done when:** in 6 long test games, no computer province holds more than 60 units for over 48 hours, unless it's in a real battle or its capital is under real siege.

**Questions** (my default in brackets)
1. Missile Defence: 3 shots of 8 HP, full strength in the provinces next door, a little less accurate against ballistic missiles and ICBMs, $72M? (yes. Full accuracy would make ballistic missiles easier to stop than cruise missiles.)
2. Missile Defence unlocked by Anti-Missile Shield I, and Shield I needs only Cruise Missiles? (yes)
3. Mobile Anti-Air shoots no missiles at all? (yes)
4. Air Superiority Fighter from day 1 at Airbase I, $78M, no rare materials? (yes)
5. SAM and Missile Defence move on tracks, so roads don't undo "much slower"? (yes)
6. The speed table above, with Mobile Anti-Air at 3? (yes. Option: 4, so it keeps up with infantry.)
7. Mobile Anti-Air and Missile Defence drawn in code for now, with paid pictures later? (yes)
8. Crowding: 50 units, then slower going in; never slower leaving; a hard 5-army rule for the computer? (yes)
9. Dragging an army onto one that would go over 10: refuse it? (yes. Option: fill to 10 and keep the rest separate.)
10. Province counter: total plus "× N armies" and a crowding badge? (yes)

When you OK it, this becomes a build job after the merges, since it touches the same code as build requirements, the fighter and missiles plan 2.

**Running:** merge chain 1, simpler buildings round 2 and picture batch B (AWACS).

---
Pictures: `shots/2026-11-28/antiair-proposal/`
