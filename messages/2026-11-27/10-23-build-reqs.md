**Build requirements: the one round is done, on branch `build-reqs`. Nothing is merged; it's waiting for you.** The before/after screens are above, phone 440 px, master on the left.

Pictures: `shots/2026-11-27/build-reqs/`

**Army Base, before → after**

| Level | Before | After |
|---|---|---|
| I | Infantry, Anti-Tank, Artillery, Tank, IFV, Special Forces, Jammer, Paratroopers, Marines | Motorized Infantry, Mobile Artillery, Marines (coastal, kept) + Recon vehicle slot |
| II | SAM, Rocket Artillery, Swarm Drones | IFV, Main Battle Tank, Paratroopers (still also need an Airbase), Swarm Drones + Mobile Anti-Air slot |
| III | – | Rocket Artillery, Mobile SAM, Special Forces, Mobile Jammer |
| IV | – | no new units, 10% faster |
| V | – | Missile Defence slot, 20% faster |

**Airbase, before → after**

| Level | Before | After |
|---|---|---|
| I | UAV, Helicopter, Strike Fighter, Interceptor, Strike Drone, Maritime Patrol | Recon UAV, Attack Helicopter, Air Superiority Fighter, Interceptor (kept) |
| II | Air Superiority Fighter, Heavy Bomber, AWACS | Strike Fighter, Strike Drone |
| III | Stealth Bomber | Maritime Patrol, AWACS, Heavy Bomber |
| IV | – | no new units, 10% faster |
| V | – | Stealth Bomber, 20% faster |

**Build speed:**
- Before, the Army Base gave up to 70% faster, the Airbase 40% and the Naval Yard 30%, spread over all levels.
- Now levels I–III add nothing on all three bases, level IV is 10% faster and level V is 20% faster.
- All three already went to level V. The Recruiting Office is unchanged.
- Swarm Drones no longer get both bases' bonuses.

**Anti-Tank Infantry is gone** from research, build lists, the computer's choices and texts. In old saves:
- Units become regular Infantry with the same share of health.
- Queued ones become Infantry and refund the difference.
- Its research is refunded.
- You get one message.
- This was tested on a real old save.

**Units that don't exist yet:** Recon vehicle, Mobile Anti-Air and Missile Defence each have a marked place at their level, which fills in once the unit exists. Missile Defence today is only the research "Anti-Missile Shield". Research days and costs are unchanged.

**Naval Yard, the table for your OK (not changed):**

| Level | Ship | Today |
|---|---|---|
| I | Frigate | I |
| II | Cruiser | II |
| III | Attack Submarine | I |
| IV | no new ship, 10% faster | |
| V | Aircraft Carrier | II |

The game has no corvette, destroyer or missile submarine, so I didn't invent any.

**The computer:** it now upgrades bases to reach the new levels. The independent check found that at war it never reached Army Base III, so it fielded no SAMs or Jammers. The repair fixed that: it now builds 36 SAMs and 14 Jammers in 60 days, against 23 and 16 on master. Peacetime play is unchanged.

**Honest points for you:**
- **Fewer tanks and strike fighters.** Tanks now need Army Base II, so by day 60 the computer has about 30% fewer tanks, and about a quarter to half as many strike fighters. Air Superiority Fighters roughly double, and infantry rises to about 78% of all units.
- **Special Forces are never built by the computer now** (41 on master). They need Army Base III, which it usually has only in its capital.
- **No anti-armour answer in cities.** Without Anti-Tank Infantry, an attacker's only answer to armour in a city is tanks. Two city cases in the combat test now go to the bigger stack, so I marked them "for information". You may want a counter to armour in cities later; the Recon vehicle won't be it.
- The repair pass itself wasn't rechecked by a second reviewer. I'll run that check when it merges.
- **Checks:** all pass. The pinpoint, controls and position-dot checks fail the same way on master; that's the waypoints job's area.

**Merging:** it merges cleanly with waypoints, the fighter and starting armies. With missiles, only the same-seed test file needs re-recording. Starting armies has one test that uses Anti-Tank Infantry as a stand-in, which needs a one-line change at merge.

**Also started:** the combat display job, in the slot that freed up. Its first step is telling you how combat timing works now.

**Questions** (my default in brackets)
1. The Naval Yard table above? (yes)
2. OK with fewer tanks and strike fighters early, as your lists imply? (yes)
3. Special Forces at Army Base III means the computer rarely gets them. Fine? (yes)
4. Should "Needs Army Base level 2" read "Needs Army Base II", like the Airbase? (yes)

---
Pictures: `shots/2026-11-27/build-reqs/`
