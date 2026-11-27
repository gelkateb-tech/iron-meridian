**The one-figure test with the new infantry look is done, on branch `one-figure` (one round plus a repair after the independent look check). Nothing is merged; it waits for your pick.** The sheets show today on the left and one figure on the right, same camera, desktop and phone, at play zoom and closest zoom. The two clips are the new look only. No Gemini credit was spent.

Pictures and clips: `shots/2026-11-27/one-figure-repair1/`

**What it shows (behind a switch; today's look stays the default)**
- **One figure per army:** its main unit, picked by the same rule as the count badge (count × health), so the figure and the badge icon always agree. Example: 4 Anti-Tank and 3 Tanks shows a tank. The bigger count badge stays as it is.
- **Motorized Infantry:** one rifleman with his transport, a generic four-wheeled armoured carrier drawn in code. He stands by the front wheel when idle, rides in the roof hatch on the move, and kneels at the nose to fire. Paratroopers and Marines show the rifleman alone.
- **Turning:** the figure faces where it's going and turns smoothly through bends, with 32 directions instead of 16 and no snapping. Clip `clip-road` follows a tank through the Wiesbaden bend and Mannheim; `frames-road-bend` shows one frame a second.
- **Animations:**
  - **Idle:** a slight engine heave and an exhaust wisp, and a soldier's weight shift.
  - **Moving:** a walk cycle for the rifleman, a pitch when setting off and braking, and today's dust.
  - **Fighting:** the kneeling aim, with muzzle flashes and tracers from the rifle and the roof gun.
  - All of it switches off with Low effects.
- **Fog:** an army you haven't identified shows a neutral grey figure, the same for every army, so it never gives away what it is. This also closes a small leak that exists today.
- **Speed:** the same as today on phone and desktop.

**The independent look check found 4 real faults, all fixed:**
- At bends the figure turned far too early and slid sideways for 2–3 seconds. Now it's more than 30° off for only a fraction of a second, during a small slip in the shared movement code that today's look has too.
- In a long fight the lone figure vanished under hit smoke. Smoke now rises behind it.
- The first sheets cut the figures off at the edges. They're now centred on the figures, with close crops.
- City names were drawn across the figure. They now fade while it passes.

**My honest read:**
- One figure is much cleaner, and turning along roads looks right.
- But at phone size the rifleman is small next to his vehicle, so Motorized Infantry mostly reads as the vehicle. You see the soldier at closest zoom when there's no smoke.
- A single figure also shows less of what's in a mixed army than today's three. The badge carries that.

**Two things for you to decide:**
- **The position dot on a moving figure** sits on the hull, because the dot is the army's true spot (your rule). Leave it, or move the figure slightly off its dot?
- **A marching figure** hangs about 30 px below its road at phone closest zoom, the same as today's three figures. Fixing it belongs in the movement code, so it would be a small follow-up.

**Picture alternative (not made):** soldier plus vehicle as Gemini pictures in the unit-set style. A test (1 side view + 1 top-down) is about $0.09, one look for the 5 groups about $0.43, and the full 5 groups × 3 looks about $1.28. Only with your OK.

**Questions** (my default in brackets)
1. One figure per army or today's three? (one figure)
2. Infantry look: keep the code-drawn soldier and vehicle, make the rifleman a bit bigger, or try the picture test (about $0.09)? (rifleman a bit bigger, code-drawn)
3. The dot on a moving figure: leave it on the hull? (yes)

**Status:** nothing is running now. Everything is waiting for your answers. The full list of open questions is in `docs/QUEUE.md`.

---
Pictures: `shots/2026-11-27/one-figure-repair1/`
