# Iron Meridian: World War III - Unit looks: the Main Battle Tank sample (prompts for the owner to approve)

**Status: nothing has been sent to Gemini. No picture has been made.** These are the exact words that would be sent. They are also in
`tools/gen-art.py` as the subjects `ul-tank-<group>-<look>`, so what you approve is what runs. Print them any time, free, with
`python3 -I tools/gen-art.py --dry-run ul-tank-nato-1` (it makes no API call).

Written 18 November 2026 from your decisions of the same day, `docs/ART-BIBLE.md` and the eight anchor buildings
(`assets/art-src/ba-v2-*-1.webp`).

## 1. What you are approving, in short

- **15 pictures**: the Main Battle Tank for each of the 5 groups (US/NATO, Eastern, China, Europe, Export), 3 looks each.
  Look 1 is for levels 1-3, look 2 for levels 4-6, look 3 for levels 7-8. Each look is a **new tank**, not an edit of the one before.
- **Same art world as the buildings.** Every prompt ends with the building style block (STYLE_V2): soft studio light from the upper left,
  crisp polished 3D model render, brushed metal and weathering, plain light grey (#D9D9D9) background. The first look of each group is drawn
  with two anchor buildings attached (army base 1 and naval yard 1) so the finish matches.
- **One change to the camera, and why (please read).** The buildings are drawn at 45 degrees from above. The map turns every unit to the
  way it is heading, and it can only do that with a picture taken **straight down** (nose up), like the unit pictures today. A tank
  seen at 45 degrees cannot be turned on the map. So the tank prompts use the same style block with only two sentences changed: the
  camera (straight down instead of 45 degrees) and the framing (the tank's length fills 90 percent of the height). Light, materials,
  colours, background and the no-text rule are word for word the same. This is what lets one picture serve the research card, the army
  bar and the map (see `docs/RESEARCH.md` section 14.4). If you prefer the 45-degree look on the research card, the map would need a
  second set of pictures (cost in `docs/RESEARCH.md` 14.6).
- **Family look, not a copy.** Each group's tanks carry the general look of that group's tanks. None may copy one real tank. The Art Bible
  line this rests on is "No real-product look-alikes", and a new line is added to the Art Bible (section "Unit pictures"): *"A unit picture
  may carry the family look of its group, but never copies one real vehicle, aircraft or ship line for line; if a checker or the owner can
  name the real model from the silhouette, the picture is flagged."* Every prompt says so, and the check looks for it.

| Group | Family look in the prompts | Paint |
|---|---|---|
| US/NATO | flat, angular, slab-sided turret of straight flat plates; wide heavy low hull | matte sand-tan |
| Eastern | low rounded dome turret on a short low hull; reactive-armour bricks that spread with each generation | dark olive-green |
| China | its own lines: broad arrowhead-shaped turret, large rectangular rear bustle, smooth boxy hull, seven small wheels | plain mid-green |
| Europe | long, sleek, smoothly sloped; rounded-faceted turret with a big rear bustle; slender gun; seven wheels | dark grey-green |
| Export | a mix of widely exported older-pattern designs: plain, rugged, bolt-on kits | faded ochre-sand |

The paint colours differ only so the groups read apart at small size. There are no markings of any kind.

## 2. What is attached to each request

| Pictures | Attached | Why |
|---|---|---|
| look 1 of each group (5) | `ba-v2-army-base-1.webp` and `ba-v2-naval-yard-1.webp` | style anchors only: finish, materials, light, background. The prompt says: do not copy their camera or anything in them. Fresh pictures. |
| looks 2 and 3 of each group (10) | that group's look 1 (`ul-tank-<group>-1`) | camera, size, framing, light, paint and family look only. The prompt says: draw a NEW, clearly newer tank. Fresh pictures (not edits). |

So there are **two batches**: first the five look-1 pictures, then the ten looks 2 and 3 (they need look 1 to exist). gen-art refuses to put
a look 2 or 3 in the same batch as its look 1.

## 3. The 15 prompts, word for word

### US/NATO - look 1 (levels 1-3) - `ul-tank-nato-1`

- **Fresh or edit:** a fresh picture, not an edit. Batch 1.
- **Attached:** assets/art-src/ba-v2-army-base-1.webp and assets/art-src/ba-v2-naval-yard-1.webp (style anchors)
- **Saved as:** `assets/art-src/ul-tank-nato-1.png`

```text
The attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background. Do NOT copy their camera angle or anything in them: no buildings, tents, trucks, ships or ground in the new picture. The picture to draw is described below, seen straight down from above.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (US/NATO): flat, angular, slab-sided turret built from straight flat armour plates with sharp edges; a wide, heavy, low-slung hull with a long flat deck and rubber-padded tracks; matte sand-tan paint. Generation 1 of 3, the oldest, a Cold War era design: a simple blocky, flat-faced turret with a plain commander's cupola and a searchlight box beside the gun, a tall plain hull with bare track guards and five large road wheels per side, a gun with a fume-extractor bulge, a few stowage boxes on the rear deck. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### US/NATO - look 2 (levels 4-6) - `ul-tank-nato-2`

- **Fresh or edit:** a fresh picture, not an edit. Batch 2.
- **Attached:** ul-tank-nato-1 (made in batch 1) (the group's look 1, which is made in batch 1)
- **Saved as:** `assets/art-src/ul-tank-nato-2.png`

```text
The attached picture is generation 1 of this group's main battle tank. Use it only as the reference for the camera (exactly straight down), the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (US/NATO): flat, angular, slab-sided turret built from straight flat armour plates with sharp edges; a wide, heavy, low-slung hull with a long flat deck and rubber-padded tracks; matte sand-tan paint. Generation 2 of 3, a clearly newer and heavier design: a wide, low, wedge-shaped turret of flat angular armour plates with a flat sloped front, a long rectangular ammunition bustle at the rear of the turret, full side armour skirts over the tracks, a roof-mounted thermal sight box, a gun with a thermal sleeve, a broad exhaust grille across the rear deck. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### US/NATO - look 3 (levels 7-8) - `ul-tank-nato-3`

- **Fresh or edit:** a fresh picture, not an edit. Batch 2.
- **Attached:** ul-tank-nato-1 (made in batch 1) (the group's look 1, which is made in batch 1)
- **Saved as:** `assets/art-src/ul-tank-nato-3.png`

```text
The attached picture is generation 1 of this group's main battle tank. Use it only as the reference for the camera (exactly straight down), the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (US/NATO): flat, angular, slab-sided turret built from straight flat armour plates with sharp edges; a wide, heavy, low-slung hull with a long flat deck and rubber-padded tracks; matte sand-tan paint. Generation 3 of 3, the newest, a near-future design: an ultra-flat angular turret covered in sharp faceted add-on armour panels, a remote weapon station on the roof, four small flat active-protection sensor panels at the turret corners, slim sensor masts, an auxiliary power box at the rear of the hull, full-length side skirts, a longer gun. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Eastern - look 1 (levels 1-3) - `ul-tank-east-1`

- **Fresh or edit:** a fresh picture, not an edit. Batch 1.
- **Attached:** assets/art-src/ba-v2-army-base-1.webp and assets/art-src/ba-v2-naval-yard-1.webp (style anchors)
- **Saved as:** `assets/art-src/ul-tank-east-1.png`

```text
The attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background. Do NOT copy their camera angle or anything in them: no buildings, tents, trucks, ships or ground in the new picture. The picture to draw is described below, seen straight down from above.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Eastern): a low, rounded, dome-like turret set slightly forward on a low, compact, short hull; reactive-armour bricks (rows of small square blocks) that cover more of the tank in every generation; smoke-grenade launcher tubes along the turret sides; a log and fuel drums on the rear deck; dark olive-green paint. Generation 1 of 3, the oldest: a small, low, smooth dome turret, a low hull with six small road wheels per side and thin track guards, a smoothbore gun with a bore-evacuator bulge, an infrared searchlight beside the gun, a first small set of reactive bricks on the hull front only. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Eastern - look 2 (levels 4-6) - `ul-tank-east-2`

- **Fresh or edit:** a fresh picture, not an edit. Batch 2.
- **Attached:** ul-tank-east-1 (made in batch 1) (the group's look 1, which is made in batch 1)
- **Saved as:** `assets/art-src/ul-tank-east-2.png`

```text
The attached picture is generation 1 of this group's main battle tank. Use it only as the reference for the camera (exactly straight down), the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Eastern): a low, rounded, dome-like turret set slightly forward on a low, compact, short hull; reactive-armour bricks (rows of small square blocks) that cover more of the tank in every generation; smoke-grenade launcher tubes along the turret sides; a log and fuel drums on the rear deck; dark olive-green paint. Generation 2 of 3, a clearly newer design: a larger, low, rounded turret with rows of reactive bricks across its whole front and sides and across the hull front, thick rubber-and-metal side skirts, a missile-capable gun, smoke launcher tubes on the turret sides, a remote machine gun on the roof. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Eastern - look 3 (levels 7-8) - `ul-tank-east-3`

- **Fresh or edit:** a fresh picture, not an edit. Batch 2.
- **Attached:** ul-tank-east-1 (made in batch 1) (the group's look 1, which is made in batch 1)
- **Saved as:** `assets/art-src/ul-tank-east-3.png`

```text
The attached picture is generation 1 of this group's main battle tank. Use it only as the reference for the camera (exactly straight down), the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Eastern): a low, rounded, dome-like turret set slightly forward on a low, compact, short hull; reactive-armour bricks (rows of small square blocks) that cover more of the tank in every generation; smoke-grenade launcher tubes along the turret sides; a log and fuel drums on the rear deck; dark olive-green paint. Generation 3 of 3, the newest: a very low, wide, rounded turret fully covered in reactive bricks, a panoramic sight dome and a remote machine-gun station on the roof, active-protection launcher tubes around the turret, bricks and slat armour over the whole hull, armoured fuel tanks at the rear. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### China - look 1 (levels 1-3) - `ul-tank-china-1`

- **Fresh or edit:** a fresh picture, not an edit. Batch 1.
- **Attached:** assets/art-src/ba-v2-army-base-1.webp and assets/art-src/ba-v2-naval-yard-1.webp (style anchors)
- **Saved as:** `assets/art-src/ul-tank-china-1.png`

```text
The attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background. Do NOT copy their camera angle or anything in them: no buildings, tents, trucks, ships or ground in the new picture. The picture to draw is described below, seen straight down from above.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (China, its own lines): a broad, low turret shaped like a flat arrowhead, with a long sloped front and a large rectangular ammunition bustle box at the rear; a clean, smooth, boxy hull with a long, sharply sloped front plate and seven small, evenly spaced road wheels; a pair of laser-warning sensors on the turret front; plain mid-green paint. Generation 1 of 3, the oldest: a modest rounded-arrowhead turret with a long, thin smoothbore gun, a simple hull with plain track guards, a snorkel tube and a spare fuel drum on the rear deck, no add-on armour. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### China - look 2 (levels 4-6) - `ul-tank-china-2`

- **Fresh or edit:** a fresh picture, not an edit. Batch 2.
- **Attached:** ul-tank-china-1 (made in batch 1) (the group's look 1, which is made in batch 1)
- **Saved as:** `assets/art-src/ul-tank-china-2.png`

```text
The attached picture is generation 1 of this group's main battle tank. Use it only as the reference for the camera (exactly straight down), the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (China, its own lines): a broad, low turret shaped like a flat arrowhead, with a long sloped front and a large rectangular ammunition bustle box at the rear; a clean, smooth, boxy hull with a long, sharply sloped front plate and seven small, evenly spaced road wheels; a pair of laser-warning sensors on the turret front; plain mid-green paint. Generation 2 of 3, a clearly newer design: a bigger, angular arrowhead turret with a wedge of applied composite armour on its front, a large boxy rear bustle, side skirts made of rows of small plates, a gun with a thermal sleeve, a laser-warning pair and a roof machine gun. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### China - look 3 (levels 7-8) - `ul-tank-china-3`

- **Fresh or edit:** a fresh picture, not an edit. Batch 2.
- **Attached:** ul-tank-china-1 (made in batch 1) (the group's look 1, which is made in batch 1)
- **Saved as:** `assets/art-src/ul-tank-china-3.png`

```text
The attached picture is generation 1 of this group's main battle tank. Use it only as the reference for the camera (exactly straight down), the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (China, its own lines): a broad, low turret shaped like a flat arrowhead, with a long sloped front and a large rectangular ammunition bustle box at the rear; a clean, smooth, boxy hull with a long, sharply sloped front plate and seven small, evenly spaced road wheels; a pair of laser-warning sensors on the turret front; plain mid-green paint. Generation 3 of 3, the newest: a very clean, low, smooth-faceted turret with flat integrated sensor panels, a remote weapon station on the roof, active-protection domes at the turret corners, a longer gun, a hull front of smooth sloped composite armour, full side skirts. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Europe - look 1 (levels 1-3) - `ul-tank-europe-1`

- **Fresh or edit:** a fresh picture, not an edit. Batch 1.
- **Attached:** assets/art-src/ba-v2-army-base-1.webp and assets/art-src/ba-v2-naval-yard-1.webp (style anchors)
- **Saved as:** `assets/art-src/ul-tank-europe-1.png`

```text
The attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background. Do NOT copy their camera angle or anything in them: no buildings, tents, trucks, ships or ground in the new picture. The picture to draw is described below, seen straight down from above.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Europe): a long, sleek, low and smoothly sloped design: a long hull with seven road wheels, a turret of sloping, rounded-faceted shapes with a large rear bustle that holds an automatic loader, a long slender gun, a small raised pod for the commander's panoramic sight, a clean low silhouette; dark grey-green paint. Generation 1 of 3, the oldest: a light, fast, compact design: a narrow hull, a small egg-shaped rounded cast turret, a long slender gun with a muzzle brake, a plain commander's cupola, almost no add-on armour, bare track guards. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Europe - look 2 (levels 4-6) - `ul-tank-europe-2`

- **Fresh or edit:** a fresh picture, not an edit. Batch 2.
- **Attached:** ul-tank-europe-1 (made in batch 1) (the group's look 1, which is made in batch 1)
- **Saved as:** `assets/art-src/ul-tank-europe-2.png`

```text
The attached picture is generation 1 of this group's main battle tank. Use it only as the reference for the camera (exactly straight down), the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Europe): a long, sleek, low and smoothly sloped design: a long hull with seven road wheels, a turret of sloping, rounded-faceted shapes with a large rear bustle that holds an automatic loader, a long slender gun, a small raised pod for the commander's panoramic sight, a clean low silhouette; dark grey-green paint. Generation 2 of 3, a clearly newer design: a bigger, smoothly sloped wedge turret with a long rounded rear bustle, side skirts, a gun with a thermal sleeve, a raised panoramic sight pod, a hull with a sharply sloped front. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Europe - look 3 (levels 7-8) - `ul-tank-europe-3`

- **Fresh or edit:** a fresh picture, not an edit. Batch 2.
- **Attached:** ul-tank-europe-1 (made in batch 1) (the group's look 1, which is made in batch 1)
- **Saved as:** `assets/art-src/ul-tank-europe-3.png`

```text
The attached picture is generation 1 of this group's main battle tank. Use it only as the reference for the camera (exactly straight down), the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Europe): a long, sleek, low and smoothly sloped design: a long hull with seven road wheels, a turret of sloping, rounded-faceted shapes with a large rear bustle that holds an automatic loader, a long slender gun, a small raised pod for the commander's panoramic sight, a clean low silhouette; dark grey-green paint. Generation 3 of 3, the newest: a tall, wide, unmanned turret of smooth faceted panels, a small second weapon mounted beside the main gun, a slim sensor mast, modular armour blocks, active-protection sensors, a long gun, a low sleek hull with full skirts. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Export - look 1 (levels 1-3) - `ul-tank-export-1`

- **Fresh or edit:** a fresh picture, not an edit. Batch 1.
- **Attached:** assets/art-src/ba-v2-army-base-1.webp and assets/art-src/ba-v2-naval-yard-1.webp (style anchors)
- **Saved as:** `assets/art-src/ul-tank-export-1.png`

```text
The attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background. Do NOT copy their camera angle or anything in them: no buildings, tents, trucks, ships or ground in the new picture. The picture to draw is described below, seen straight down from above.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a round or flat-topped turret on a boxy hull, bolt-on kits and add-on parts that look like they were fitted by the buyer, faded ochre-sand paint with a few patches of darker touch-up paint. Generation 1 of 3, the oldest, a post-war pattern: a round dome turret with a simple long gun, a small tall hull with four large road wheels per side, an unditching beam across the rear deck, an open-top searchlight, a machine gun on the turret roof. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Export - look 2 (levels 4-6) - `ul-tank-export-2`

- **Fresh or edit:** a fresh picture, not an edit. Batch 2.
- **Attached:** ul-tank-export-1 (made in batch 1) (the group's look 1, which is made in batch 1)
- **Saved as:** `assets/art-src/ul-tank-export-2.png`

```text
The attached picture is generation 1 of this group's main battle tank. Use it only as the reference for the camera (exactly straight down), the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a round or flat-topped turret on a boxy hull, bolt-on kits and add-on parts that look like they were fitted by the buyer, faded ochre-sand paint with a few patches of darker touch-up paint. Generation 2 of 3, a clearly newer, widely exported 1970s-80s pattern: a flat-topped rounded turret on a longer hull, a rangefinder box on the turret, bolt-on side skirts, a smoke-launcher pack, a few add-on armour plates on the turret front, a snorkel tube. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Export - look 3 (levels 7-8) - `ul-tank-export-3`

- **Fresh or edit:** a fresh picture, not an edit. Batch 2.
- **Attached:** ul-tank-export-1 (made in batch 1) (the group's look 1, which is made in batch 1)
- **Saved as:** `assets/art-src/ul-tank-export-3.png`

```text
The attached picture is generation 1 of this group's main battle tank. Use it only as the reference for the camera (exactly straight down), the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a round or flat-topped turret on a boxy hull, bolt-on kits and add-on parts that look like they were fitted by the buyer, faded ochre-sand paint with a few patches of darker touch-up paint. Generation 3 of 3, the newest, a modern export-grade design: a modular angular turret with bolt-on composite armour packages, a remote machine-gun station, a thermal sight box, an auxiliary power pack at the rear, side skirts, a clean but practical look made to be sold to many armies. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

## 4. The check prompt (sent after every picture when `--review` is used)

A Gemini text model gets the new picture first, then its references, with this text. It answers PASS or FLAG with short reasons. It
**only flags**: no retry, no redo, no new picture. A FLAG is shown to you with the picture and you decide. The words `<...>` are filled
in by gen-art: which pictures are attached, the picture's own prompt, and the style block. Model: `gemini-2.5-flash` unless the
environment sets another (`GEMINI_REVIEW_MODEL`); **I could not confirm the current model id or price from here, so check it before
the first run.** Estimated cost about $0.002 to $0.003 a check (two or three pictures in, a short answer out); marked as an estimate.

```text
You are the quality checker for the pictures of a strategy game. Picture 1 is the NEW picture to check. <which pictures are attached>

What the new picture was asked to show:
<the picture's prompt>

The art style it must match (the game's STYLE_V2): <STYLE_V2>

Check the new picture against this checklist, each point on its own:
1. SAME UNIT: it shows the kind of unit that was asked for. With a reference picture of the same unit attached, it keeps that unit's shape family, size in the frame and paint colour; a picture made as a new generation must be clearly a different, newer model, not a copy of the reference.
2. STYLE: it matches the anchor style: a clean, polished 3D game-model render with crisp edges and soft studio light from the upper left, slightly realistic materials; not a photograph, not toy-like, not a drawing.
3. BACKGROUND: the background is a plain, flat, uniform light grey with at most a faint soft shadow; no base slab, ground, terrain, horizon or other objects.
4. FRAMING: the whole unit is inside the frame, nothing cut off, centred, filling about 90 percent of the frame along its length, seen from the same angle and at the same size as the reference or the rest of its set (for units: exactly straight down, nose up).
5. NO MARKINGS: no text, letters, numbers, logos, flags, emblems, roundels, stars or national insignia anywhere.
6. ORIGINAL: it is not a line-for-line copy of a real, recognisable product (a real tank, jet, ship or similar); it may only carry the general family look of its group.
7. NO EXTRAS: exactly the one unit asked for (or the set asked for); no extra, duplicated, partial or background units, no people, no buildings.

Answer with JSON only, in this shape: {"verdict": "PASS" or "FLAG", "reasons": ["short plain reason", "..."]}. Use PASS only if all seven points are fine (reasons may then be empty). Use FLAG if any point fails or you are unsure, and name each failed point by its number and a short plain reason (under 20 words each).
[model: gemini-2.5-flash]
```

## 5. The plan for the sample

1. **You approve these prompts** (or change words; they change in `tools/gen-art.py` and here together).
2. **Batch 1**: the 5 look-1 tanks, with `--batch --review` (half price). About $0.20 plus about $0.015 in checks.
3. **Batch 2**: the 10 look-2 and look-3 tanks, `--batch --review`. About $0.40 plus about $0.03 in checks.
   Total for the sample: **about $0.60 plus about $0.05 in checks, about $0.65**. One try each. Any FLAG or any picture you dislike is
   shown to you first; nothing is redone without your word.
4. **I cut them out** (no API call) and show you:
   - the 15 on the **research card** (the tree's diamond and the card with the three looks side by side, one row per group), and
   - the 15 on the **map** at the close zoom (the forces' figures, turned to different headings, over land, forest and desert), and in
     the army bar's unit details.
5. **Only after your OK** the rest (about 350 pictures) in batches of about 30, the check on every picture, the cost logged after each
   batch, and a stop at your spending line.
