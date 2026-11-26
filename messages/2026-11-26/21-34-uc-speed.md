**Units in cities: the speed check is done, and the merge into master is now being checked.**

- **Measured against master:** it was slightly slower in one place, the phone at mid zoom (hex 12): about 3 ms more script time per frame at half CPU speed, so roughly 1.5 ms on a Pixel 7-class phone. At play zoom and closer, the difference was too small to measure on this machine.
- **Fixed in its last allowed round:** the cost came from the city centre markers. Their drawing was trimmed, and the measured script time at mid zoom is now level with master. The pictures are exactly the same, and all its checks pass.
- **One limit:** the test machine was busy, so differences under about 5 ms in whole-frame time can't be proven either way. The trimmed code is what I'm going by.

I've merged it into master locally. The full check run (balance, economy, combat, rebels, deals, old saves) is going now. When it passes, I'll push it and publish Dev Build Version 71. Your call on the long lines at the closest zoom (UC7) can still change things after the merge.

---
Pictures: none
