Here is the rebels test picture (right) next to the regular Export infantry (left), and the prompt behind it. I made only this one picture: the side view, which is the master the other two are made from. I'm waiting for your OK before making the rest.

Pictures: `shots/2026-11-26/rebels-pictures/`

**Cost:** about $0.105 for the picture plus its Gemini check (made on its own, not in a batch, so you'd see it sooner). The art balance is now about $5.42 on my estimate, against the $5 floor. The other two pictures, sent as a half-price batch, would cost about $0.06 to $0.10 and leave about $5.33. That's the most I can still make before reaching the floor. After that, any more pictures need a top-up.

**My honest read of the test**
- **Works:**
  - It's clearly not regular infantry: no helmets, no uniform, no camouflage.
  - It has a headwrap, a hooded fighter with a face scarf, a soft cap, a padded vest, a bandolier and sandals.
  - The colours are tan, khaki and olive.
  - The small grey flag with white crossed rifles matches the rebels badge.
  - The light comes from the upper left like the other unit pictures, and it has nothing to do with a pickup.
  - The Gemini check gave PASS.
- **Problem 1, the rifles:** they still look a lot like a real rifle everyone would recognise (curved magazine, wooden stock), even though the prompt says "generic". The Export infantry has the same issue, and so does our own crossed-rifles badge. If you want them more generic, I'd change the rifle wording for the other two pictures and redo this one. That redo would cost about $0.06 more, and I'd only do it with your OK.
- **Problem 2, the size:** each fighter is about 80% as tall as the single infantry soldier, and the group sits a little right of centre. The research diamond trims the empty space, so it should still read well, but they're slightly smaller figures.

**The prompt for this side view, word for word:**

```text
[Attached: the Army Base and Naval Yard anchor pictures (style only) and the Export infantry side view (camera, figure size, framing and light only)]

The attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background. Do NOT copy anything in them: no buildings, tents, trucks, ships or ground in the new picture. The buildings are seen at an angle from above, and the new picture uses the same angle family, as described below: a front three-quarter side view from slightly above. The third attached picture is a regular infantry soldier from the same game, seen from the same view: use it ONLY as the reference for the camera angle, the size of each figure in the frame, the framing, the lighting and the rendering style. Do not copy him: the rebels must look clearly different from this regular soldier (no helmet, no uniform, no camouflage).

A small group of three rebel fighters standing close together as one compact group, slightly overlapping, seen from a front three-quarter side view from slightly above (about 30 degrees down), in ready poses with their rifles held ready, turned toward the lower right of the picture so that the viewer sees their fronts and one side. The group is centred left to right and top to bottom and fills about 85 percent of the picture's height; every figure, rifle and the flag are inside the frame with a margin all round. Only these three fighters: no other person, no vehicle, no ground, only faint, tight soft shadows under their feet. Irregular fighters, clearly NOT a regular army: mixed civilian and military clothes that do not match one another (a worn field jacket over a civilian shirt, a hooded sweatshirt, cargo trousers, plain work trousers, a quilted vest, sandals or worn boots), cloth scarves and headwraps (one wears a headwrap wound round the head, one a scarf pulled up over the nose and mouth, one a soft cap with a scarf at the neck), NO helmets, no matching uniform, no camouflage pattern, no body armour plates, loose canvas chest rigs and ammunition bandoliers, a small cloth bag. Colours: tan, sand, khaki, dusty brown and faded olive, with one muted dark-red or dark-blue scarf. Each carries a generic rifle of an older pattern with a curved magazine and a plain wooden-look stock (an original generic design, not a copy of any real rifle line for line). One of them holds upright a small hand-held flag on a short thin pole: a plain grey cloth flag with two white rifles crossed in an X, muzzles up; the flag is small, about the size of a fighter's head and shoulders, and it is the only emblem in the picture. Worn, dusty, practical, determined. No vehicle, no pickup truck, no mounted gun. Original generic design made for this game. Apart from that one small crossed-rifles flag: no text, no letters, no numbers, no other flags, no stars, no national markings, no logos, no badges.

Style: [the same style paragraph as every unit side view, with the framing changed to the group filling 85% of the height, and "no flags" changed to "no flag or emblem except the one small crossed-rifles flag described above"]
```

**The other two, made from this picture once you OK it:**
- **Card scene:** the same three fighters moving along a dusty track through dry, rocky scrubland, at eye height, filling the card edge to edge, with no close-up faces.
- **Top-down:** the same three seen straight down in a small wedge facing up, with the flag held out flat so the crossed rifles show.

All three prompts are word for word in `tools/gen-art.py` (`ul-reb-side`, `ul-reb-scene`, `ul-reb-top`).

**One thing to know about the map:** regular infantry doesn't use its top-down picture on the map. Seen from straight above, a group of soldiers reads as a few blobs at map size, so the map shows small 3D soldiers instead, and the top-down picture appears in the army bar. The rebels would work the same way: the top-down goes in the army bar, and on the map I'd recolour the small 3D rebel figures to match the picture (tan clothes, headwraps, the flag). Tell me if you'd rather have the top-down picture on the map anyway.

**Questions**
1. OK to make the card scene and the top-down from this picture?
2. Keep the rifles as they are, or reword them to look more generic and redo this one (about $0.06)?

**Your UC2 correction is in.** The position dot will always stay at the army's true spot. When something is in the way, the counter moves aside instead, with a thin line to its dot. I'm reading "everything else stands" as my suggested answers for UC1 and UC3–UC6. Tell me if you meant different answers there, because your UC answers didn't reach me in this chat.

The change has started as a follow-up on units-in-cities, done with Sonnet as an interface follow-up, with at most 2 fix rounds. It first merges today's master, which touched the same file. It also tests that no dot moves at any zoom. I'll send before/after phone sheets before anything merges.

One consequence: zoomed out, an army 2 km outside a city will have its dot right next to the diamond. Only the missing ring will show it's outside.

---
Pictures: `shots/2026-11-26/rebels-pictures/`
