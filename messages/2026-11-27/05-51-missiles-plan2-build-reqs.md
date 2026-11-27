**Missiles plan 2 is ready: the 4 sheets are above. Nothing in the game has changed.** The chat shows scaled-down copies of these tall sheets. The shots folder has them at 1600 px wide.

Pictures: `shots/2026-11-27/missiles-plan2/`

The full proposal is in `docs/MISSILES-PLAN2.md` on the missiles branch (docs only).

**In short**
- **Names (sheet 1):** Cruise Missile, Chemical Cruise Missile and Nuclear Cruise Missile. Then Ballistic Missile, Chemical Ballistic Missile (was "Chemical Missile") and Nuclear Ballistic Missile (was "Tactical Nuclear Missile"). The Nuclear ICBM comes later. "Tactical" is gone from every missile name.
- **Range:**
  - Cruise: 2,880 km, or 3,600 km after research. That's down from today's 5,040 km.
  - Ballistic: 4,680 km, or 5,760 km after research. That's down from 16,200 km.
  - ICBM: the whole map.
  - From Berlin, a ballistic missile reaches 21 of the 67 other capitals, or 29 after research. Today it reaches 66.
- **Blast:**
  - Every cruise missile hits only its target province.
  - The Nuclear Ballistic Missile also hits the provinces next door (12%).
  - The ICBM hits its target hardest (60%), the provinces next door at 20%, and a second ring out to 540 km at 5%.
  - Gas and radiation last longer with each step up.
- **HP in flight (sheet 2):**
  - HP: cruise 12, ballistic 16, ICBM 24.
  - The defence fires in the last hour before impact. SAMs, Cruisers, Frigates and fighters on patrol can shoot; fighters only at cruise missiles.
  - Against 3 SAMs with no shield, a cruise missile is stopped 47% of the time and a ballistic missile 10%. The ICBM gets through almost always unless the defence is very large.
  - The best possible defence stops 84% of cruise missiles, 76% of ballistic missiles and 32% of ICBMs, so no defence is ever certain.
  - When several missiles arrive together, the nuke is shot at first, so cheap missiles can't shield it.
  - The marker gets a thin HP bar and an "HP 4/16" chip. The launch card shows the HP and the chance of getting through, counting only the defences you can see.
- **Reach (sheet 3):** what each missile reaches from Berlin, Moscow, Tehran and Washington, plus the best city of each nation. Plainly: the USA, Japan, Australia and Brazil have almost no missile war until the ICBM.
- **ICBM later (sheet 4):**
  - Research: "Intercontinental Missiles", opening on day 28 and taking 10 days. It needs Nuclear Warhead and Ballistic Missile Range I.
  - It's built in a Silo III or higher, at $600M.
  - Limit: 2 a nation, counted inside today's 3-nuke limit.
  - The earliest ICBM comes about day 44.

**My review:** the order is right, with each step having longer range, a bigger blast and being harder to stop. Ballistic is no longer world range, and the numbers come from the real game rules and distances. One honest point: the Americas and the far east are mostly out of the missile war until about day 44, which is question 5.

**Questions** (my default in brackets)
1. Cruise 2,880–3,600 km, ballistic 4,680–5,760 km, ICBM the whole map. This also shortens today's cruise missile. OK? (yes)
2. Show map km, as for every other range today, or real km? Europe reads about 1.6 times longer in map km. (map km)
3. Seven missiles: chemical on cruise and ballistic only, with no plain or chemical ICBM? (yes)
4. The Nuclear Cruise Missile needs a Silo I and has its own limit (2 a nation) and 12 h wait. A nation can then hold up to 5 nukes instead of 3. OK? (yes)
5. The USA, Japan, Australia and Brazil: keep it as is, open the ICBM sooner (earliest about day 38), or plan cruise missiles fired from ships as a later job? (keep it; ships later)
6. Should the fighters' research category "Tactical Air" be renamed too? (no, missiles only)
7. A launch card for every missile, with a "Quick fire" setting for cruise and ballistic missiles, off by default? (yes)
8. Missiles landing in the same hour share the defence's shots, with the most dangerous shot at first. Keep? (yes)
9. MS1–MS5 from the missiles sheets: take my defaults? (yes: chemical answered with chemical, missile research readily at war, the launcher's peace offers refused for 3 days, the card on every missile, side panel closed while aiming)

With your OK, this becomes the missiles job's second and last fix round, before merging.

**Build requirements: started**, as one round only, on branch `build-reqs` (Opus).
- Army Base and Airbase get your exact level lists.
- On all three bases, only levels 4 and 5 add build speed, and every base goes up to level 5.
- Anti-Tank Infantry is removed. In old saves it becomes regular Infantry, including in production queues and research.
- The build lists, requirement text and the computer's choices are updated.
- The Naval Base is a table only, for you to OK first.
- The Recon vehicle doesn't exist yet, so Army Base level 1 keeps a marked place for it.
- An independent checker goes over it. Then you get the before and after tables, and it waits for you.

That makes 5 jobs running: build requirements, waypoints, the fighter, starting armies with the recon proposal, and city lots round 3.

---
Pictures: `shots/2026-11-27/missiles-plan2/`
