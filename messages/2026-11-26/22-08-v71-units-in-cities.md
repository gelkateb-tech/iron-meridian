**Units in cities is merged, and the Dev Build is now Version 71.** https://claude.ai/artifact/EKDR7pckn3hPkoJVuxoe7R

**What's in it**
- **City centre:** a small diamond on each city's exact centre point.
- **Holding a city:** when an army stands on that point, a ring lights up in its side's colour.
- **Position dots:** an army's dot is always drawn exactly where the army stands. When something is in the way, its counter moves aside on a thin line instead (your UC2 rule).
- **Shadows and outlines:** counters and models get a soft shadow and a thin outline, with no change in size.
- **Tapping a city:** it shows "In the city:" and "Nearby:".
- The game rules are unchanged.

**Checks on master after the merge:** all pass. That covers balance, the 68-nation balance, economy, combat, the rebels test (168 checks), deals, old saves, the units-in-cities test, the public build and the same-seed game.
- In the full run, 4 tap checks in the controls test failed while the machine was under heavy load. Run alone, the test passed 49 of 49, twice.
- One position check fails the same way it already does on master, so this merge didn't cause it.

**Speed:** before the merge, the branch was slightly slower on a phone at mid zoom. Its last fix round trimmed the city markers, and it now measures level with Version 70.

**One leftover:** a temporary branch, `uc-merge-check`, is still on GitHub. It points to the same commit as master, so it's harmless. GitHub's connection here won't let me delete branches, so you can delete it whenever you like.

**Still open:** UC7, the long lines from counter to dot at the closest zoom. My suggestion stands: keep them. MISSILES and CITY LOTS 3 (with the pasted-on check) are still running.

---
Pictures: none
