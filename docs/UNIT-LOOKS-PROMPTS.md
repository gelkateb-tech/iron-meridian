# Iron Meridian: World War III - Unit looks: the Main Battle Tank sets (three pictures per look)

**Status (18 November 2026): the prompts below are the exact words sent to Gemini.** They are also in `tools/gen-art.py` as the subjects
`ul-tank-<group>-<look>-<kind>` (kind: `side`, `scene`, `top`), so what is written here is what runs. This file is written from the tool
(print any prompt, free, with `python3 -I tools/gen-art.py --dry-run ul-tank-nato-1-side`; it makes no API call).

Written from the owner's decisions of 18 November 2026 (the three pictures per unit, the removal of the $12 line), `docs/ART-BIBLE.md`
and the eight anchor buildings (`assets/art-src/ba-v2-*-1.webp`). The family looks, paints and generation text of the 15 tanks are the
ones the owner approved; only the camera and framing changed, and two new kinds of picture were added.

## 1. Three pictures per look, all showing the same vehicle

| Kind | What it is | Made from | Used for | Size |
|---|---|---|---|---|
| **Side view** (`-side`) | the master: a front three-quarter side view from slightly above (about 30 degrees down, the angle family of the anchor buildings), tank turned toward the lower right, on the plain #D9D9D9 background, whole tank in frame and centred, about 85% of the width. Cut out (transparent) for the research tree's diamond | a fresh generation; the two anchor buildings attached for style (looks 2 and 3 also get their group's look-1 side view, for paint and family look only) | research tree diamond | 1:1, 1K |
| **Card scene** (`-scene`) | the same tank in action in its natural setting: driving on a dirt road with some dust, in a believable landscape of its group; fills the whole picture edge to edge, full colour, natural light. No tint, no scanlines: the blue monitor tint and scanlines are drawn in code, on these card scenes only | its own side view, attached as the reference | the card that opens when a node is tapped | 3:2, 1K |
| **Top-down** (`-top`) | the same tank seen exactly straight down, nose up, length 90% of the height, plain #D9D9D9 background, faint tight shadow (`STYLE_V2_UNIT`). Cut out (transparent) for the map and army bar | its own side view, attached as the reference | map, army bar | 1:1, 1K |

Every look is still a **new generation** (not an edit of the look before). 5 groups x 3 looks x 3 kinds = **45 pictures**.
Order: **batch 1** the 5 look-1 side views; **batch 2** the 10 look-2 and look-3 side views (they need look 1); **batch 3** the 30 card
scenes and top-downs (each needs its own side view). gen-art refuses to put a picture in the same batch as the picture it is made from.

| Group | Family look in the prompts | Paint | Card scene setting |
|---|---|---|---|
| US/NATO | flat, angular, slab-sided turret of straight flat plates; wide heavy low hull | matte sand-tan | dry grassland valley, rolling hills, tan dirt road |
| Eastern | low rounded dome turret on a short low hull; reactive-armour bricks that spread with each generation | dark olive-green | steppe, birch trees, pine forest edge, brown dirt road |
| China | broad arrowhead-shaped turret, large rectangular rear bustle, smooth boxy hull, seven small wheels | plain mid-green | green farmland hills, terraces, poplars, yellow-brown track |
| Europe | long, sleek, smoothly sloped; rounded-faceted turret with a big rear bustle; slender gun; seven wheels | dark grey-green | temperate farmland, hedgerows, poplars, gravel farm track |
| Export | a mix of widely exported older-pattern designs: plain, rugged, bolt-on kits | faded ochre-sand | dry savanna, acacia trees, red-brown dirt road |

The paint colours differ only so the groups read apart at small size. There are no markings of any kind.

**Family look, not a copy.** None may copy one real tank (Art Bible: "A unit picture may carry the family look of its group, but never copies
one real vehicle, aircraft or ship line for line; if a checker or the owner can name the real model from the silhouette, the picture is
flagged."). Every prompt says so, and the check looks for it.

**Standing rule.** The checks only flag. Gemini never redoes a picture by itself. Before any picture is fixed or redone, the owner is
shown the problem and asked first.

## 2. The 45 prompts, word for word

### US/NATO - look 1 (levels 1-3) - Side view (the master) - `ul-tank-nato-1-side`

- **Batch 1.** A fresh picture (generation, not an edit).
- **Attached:** `assets/art-src/ba-v2-army-base-1.webp`, `assets/art-src/ba-v2-naval-yard-1.webp` (the two anchor buildings: style only)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-nato-1-side.webp`

```text
The attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background. Do NOT copy anything in them: no buildings, tents, trucks, ships or ground in the new picture. The buildings are seen at an angle from above, and the new picture uses the same angle family, as described below: a front three-quarter side view from slightly above.

A single main battle tank, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front and gun turned toward the lower right of the picture so that the viewer sees its front and one long side, the turret facing the same way as the hull. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull spans about 85 percent of the picture's width; the entire tank, gun barrel and tracks included, is inside the frame with a margin all round. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (US/NATO): flat, angular, slab-sided turret built from straight flat armour plates with sharp edges; a wide, heavy, low-slung hull with a long flat deck and rubber-padded tracks; matte sand-tan paint. Generation 1 of 3, the oldest, a Cold War era design: a simple blocky, flat-faced turret with a plain commander's cupola and a searchlight box beside the gun, a tall plain hull with bare track guards and five large road wheels per side, a gun with a fume-extractor bulge, a few stowage boxes on the rear deck. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: a front three-quarter side view from slightly above (about 30 degrees down, the classic strategy-game model angle, the same angle family as the attached buildings), the unit's front turned toward the lower right of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the whole unit (nose to tail, including any gun barrel) fills about 85 percent of the picture's width, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### US/NATO - look 1 (levels 1-3) - Card scene - `ul-tank-nato-1-scene`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-nato-1-side (not made yet)` (the master side view of this look)
- **Size:** 3:2, 1K. **Saved as:** `assets/art-src/ul-tank-nato-1-scene.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), seen in action in its natural setting as described below. Do not redesign, simplify or add to it. Do not copy the grey background: the new picture is a full outdoor scene.

A single main battle tank driving at moderate speed along a dirt road, kicking up a modest trail of dust behind its tracks. The setting: a wide dry grassland valley with low rolling hills, a few sparse trees and scrub bushes, and a broad road of pale tan packed dirt. Seen from a low front three-quarter angle slightly above ground level, the tank fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one tank: no crew visible, no other vehicle, no people, no buildings, no signs. The tank is described in words as: Family look (US/NATO): flat, angular, slab-sided turret built from straight flat armour plates with sharp edges; a wide, heavy, low-slung hull with a long flat deck and rubber-padded tracks; matte sand-tan paint. Generation 1 of 3, the oldest, a Cold War era design: a simple blocky, flat-faced turret with a plain commander's cupola and a searchlight box beside the gun, a tall plain hull with bare track guards and five large road wheels per side, a gun with a fume-extractor bulge, a few stowage boxes on the rear deck. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: the same clean, polished 3D strategy-game render as the attached picture, with crisp edges, simplified shapes and clear silhouettes, bright but natural colours and slightly realistic materials with subtle wear, dust and weathering; not toy-like, not a photograph. Natural daylight and soft shadows. Landscape 3:2 image: the scene fills the whole picture edge to edge, with no grey studio background, no border, no frame, no vignette, no colour tint, no filter and no overlay of any kind. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### US/NATO - look 1 (levels 1-3) - Top-down - `ul-tank-nato-1-top`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-nato-1-side (not made yet)` (the master side view of this look)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-nato-1-top.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), but now seen exactly straight down from above, as described below. Do not redesign, simplify or add to it. Do not copy the attached picture's camera angle: draw a true top-down plan view.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (US/NATO): flat, angular, slab-sided turret built from straight flat armour plates with sharp edges; a wide, heavy, low-slung hull with a long flat deck and rubber-padded tracks; matte sand-tan paint. Generation 1 of 3, the oldest, a Cold War era design: a simple blocky, flat-faced turret with a plain commander's cupola and a searchlight box beside the gun, a tall plain hull with bare track guards and five large road wheels per side, a gun with a fume-extractor bulge, a few stowage boxes on the rear deck. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### US/NATO - look 2 (levels 4-6) - Side view (the master) - `ul-tank-nato-2-side`

- **Batch 2.** A fresh picture (generation, not an edit).
- **Attached:** `assets/art-src/ba-v2-army-base-1.webp`, `assets/art-src/ba-v2-naval-yard-1.webp`, `ul-tank-nato-1-side (not made yet)` (two anchor buildings for style only, then the group's look-1 side view)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-nato-2-side.webp`

```text
The first two attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background; do NOT copy anything in them. The third attached picture is generation 1 of this group's main battle tank, seen from the same three-quarter side view. Use it only as the reference for the camera angle, the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front and gun turned toward the lower right of the picture so that the viewer sees its front and one long side, the turret facing the same way as the hull. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull spans about 85 percent of the picture's width; the entire tank, gun barrel and tracks included, is inside the frame with a margin all round. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (US/NATO): flat, angular, slab-sided turret built from straight flat armour plates with sharp edges; a wide, heavy, low-slung hull with a long flat deck and rubber-padded tracks; matte sand-tan paint. Generation 2 of 3, a clearly newer and heavier design: a wide, low, wedge-shaped turret of flat angular armour plates with a flat sloped front, a long rectangular ammunition bustle at the rear of the turret, full side armour skirts over the tracks, a roof-mounted thermal sight box, a gun with a thermal sleeve, a broad exhaust grille across the rear deck. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: a front three-quarter side view from slightly above (about 30 degrees down, the classic strategy-game model angle, the same angle family as the attached buildings), the unit's front turned toward the lower right of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the whole unit (nose to tail, including any gun barrel) fills about 85 percent of the picture's width, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### US/NATO - look 2 (levels 4-6) - Card scene - `ul-tank-nato-2-scene`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-nato-2-side (not made yet)` (the master side view of this look)
- **Size:** 3:2, 1K. **Saved as:** `assets/art-src/ul-tank-nato-2-scene.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), seen in action in its natural setting as described below. Do not redesign, simplify or add to it. Do not copy the grey background: the new picture is a full outdoor scene.

A single main battle tank driving at moderate speed along a dirt road, kicking up a modest trail of dust behind its tracks. The setting: a wide dry grassland valley with low rolling hills, a few sparse trees and scrub bushes, and a broad road of pale tan packed dirt. Seen from a low front three-quarter angle slightly above ground level, the tank fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one tank: no crew visible, no other vehicle, no people, no buildings, no signs. The tank is described in words as: Family look (US/NATO): flat, angular, slab-sided turret built from straight flat armour plates with sharp edges; a wide, heavy, low-slung hull with a long flat deck and rubber-padded tracks; matte sand-tan paint. Generation 2 of 3, a clearly newer and heavier design: a wide, low, wedge-shaped turret of flat angular armour plates with a flat sloped front, a long rectangular ammunition bustle at the rear of the turret, full side armour skirts over the tracks, a roof-mounted thermal sight box, a gun with a thermal sleeve, a broad exhaust grille across the rear deck. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: the same clean, polished 3D strategy-game render as the attached picture, with crisp edges, simplified shapes and clear silhouettes, bright but natural colours and slightly realistic materials with subtle wear, dust and weathering; not toy-like, not a photograph. Natural daylight and soft shadows. Landscape 3:2 image: the scene fills the whole picture edge to edge, with no grey studio background, no border, no frame, no vignette, no colour tint, no filter and no overlay of any kind. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### US/NATO - look 2 (levels 4-6) - Top-down - `ul-tank-nato-2-top`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-nato-2-side (not made yet)` (the master side view of this look)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-nato-2-top.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), but now seen exactly straight down from above, as described below. Do not redesign, simplify or add to it. Do not copy the attached picture's camera angle: draw a true top-down plan view.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (US/NATO): flat, angular, slab-sided turret built from straight flat armour plates with sharp edges; a wide, heavy, low-slung hull with a long flat deck and rubber-padded tracks; matte sand-tan paint. Generation 2 of 3, a clearly newer and heavier design: a wide, low, wedge-shaped turret of flat angular armour plates with a flat sloped front, a long rectangular ammunition bustle at the rear of the turret, full side armour skirts over the tracks, a roof-mounted thermal sight box, a gun with a thermal sleeve, a broad exhaust grille across the rear deck. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### US/NATO - look 3 (levels 7-8) - Side view (the master) - `ul-tank-nato-3-side`

- **Batch 2.** A fresh picture (generation, not an edit).
- **Attached:** `assets/art-src/ba-v2-army-base-1.webp`, `assets/art-src/ba-v2-naval-yard-1.webp`, `ul-tank-nato-1-side (not made yet)` (two anchor buildings for style only, then the group's look-1 side view)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-nato-3-side.webp`

```text
The first two attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background; do NOT copy anything in them. The third attached picture is generation 1 of this group's main battle tank, seen from the same three-quarter side view. Use it only as the reference for the camera angle, the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front and gun turned toward the lower right of the picture so that the viewer sees its front and one long side, the turret facing the same way as the hull. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull spans about 85 percent of the picture's width; the entire tank, gun barrel and tracks included, is inside the frame with a margin all round. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (US/NATO): flat, angular, slab-sided turret built from straight flat armour plates with sharp edges; a wide, heavy, low-slung hull with a long flat deck and rubber-padded tracks; matte sand-tan paint. Generation 3 of 3, the newest, a near-future design: an ultra-flat angular turret covered in sharp faceted add-on armour panels, a remote weapon station on the roof, four small flat active-protection sensor panels at the turret corners, slim sensor masts, an auxiliary power box at the rear of the hull, full-length side skirts, a longer gun. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: a front three-quarter side view from slightly above (about 30 degrees down, the classic strategy-game model angle, the same angle family as the attached buildings), the unit's front turned toward the lower right of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the whole unit (nose to tail, including any gun barrel) fills about 85 percent of the picture's width, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### US/NATO - look 3 (levels 7-8) - Card scene - `ul-tank-nato-3-scene`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-nato-3-side (not made yet)` (the master side view of this look)
- **Size:** 3:2, 1K. **Saved as:** `assets/art-src/ul-tank-nato-3-scene.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), seen in action in its natural setting as described below. Do not redesign, simplify or add to it. Do not copy the grey background: the new picture is a full outdoor scene.

A single main battle tank driving at moderate speed along a dirt road, kicking up a modest trail of dust behind its tracks. The setting: a wide dry grassland valley with low rolling hills, a few sparse trees and scrub bushes, and a broad road of pale tan packed dirt. Seen from a low front three-quarter angle slightly above ground level, the tank fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one tank: no crew visible, no other vehicle, no people, no buildings, no signs. The tank is described in words as: Family look (US/NATO): flat, angular, slab-sided turret built from straight flat armour plates with sharp edges; a wide, heavy, low-slung hull with a long flat deck and rubber-padded tracks; matte sand-tan paint. Generation 3 of 3, the newest, a near-future design: an ultra-flat angular turret covered in sharp faceted add-on armour panels, a remote weapon station on the roof, four small flat active-protection sensor panels at the turret corners, slim sensor masts, an auxiliary power box at the rear of the hull, full-length side skirts, a longer gun. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: the same clean, polished 3D strategy-game render as the attached picture, with crisp edges, simplified shapes and clear silhouettes, bright but natural colours and slightly realistic materials with subtle wear, dust and weathering; not toy-like, not a photograph. Natural daylight and soft shadows. Landscape 3:2 image: the scene fills the whole picture edge to edge, with no grey studio background, no border, no frame, no vignette, no colour tint, no filter and no overlay of any kind. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### US/NATO - look 3 (levels 7-8) - Top-down - `ul-tank-nato-3-top`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-nato-3-side (not made yet)` (the master side view of this look)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-nato-3-top.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), but now seen exactly straight down from above, as described below. Do not redesign, simplify or add to it. Do not copy the attached picture's camera angle: draw a true top-down plan view.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (US/NATO): flat, angular, slab-sided turret built from straight flat armour plates with sharp edges; a wide, heavy, low-slung hull with a long flat deck and rubber-padded tracks; matte sand-tan paint. Generation 3 of 3, the newest, a near-future design: an ultra-flat angular turret covered in sharp faceted add-on armour panels, a remote weapon station on the roof, four small flat active-protection sensor panels at the turret corners, slim sensor masts, an auxiliary power box at the rear of the hull, full-length side skirts, a longer gun. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Eastern - look 1 (levels 1-3) - Side view (the master) - `ul-tank-east-1-side`

- **Batch 1.** A fresh picture (generation, not an edit).
- **Attached:** `assets/art-src/ba-v2-army-base-1.webp`, `assets/art-src/ba-v2-naval-yard-1.webp` (the two anchor buildings: style only)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-east-1-side.webp`

```text
The attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background. Do NOT copy anything in them: no buildings, tents, trucks, ships or ground in the new picture. The buildings are seen at an angle from above, and the new picture uses the same angle family, as described below: a front three-quarter side view from slightly above.

A single main battle tank, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front and gun turned toward the lower right of the picture so that the viewer sees its front and one long side, the turret facing the same way as the hull. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull spans about 85 percent of the picture's width; the entire tank, gun barrel and tracks included, is inside the frame with a margin all round. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Eastern): a low, rounded, dome-like turret set slightly forward on a low, compact, short hull; reactive-armour bricks (rows of small square blocks) that cover more of the tank in every generation; smoke-grenade launcher tubes along the turret sides; a log and fuel drums on the rear deck; dark olive-green paint. Generation 1 of 3, the oldest: a small, low, smooth dome turret, a low hull with six small road wheels per side and thin track guards, a smoothbore gun with a bore-evacuator bulge, an infrared searchlight beside the gun, a first small set of reactive bricks on the hull front only. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: a front three-quarter side view from slightly above (about 30 degrees down, the classic strategy-game model angle, the same angle family as the attached buildings), the unit's front turned toward the lower right of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the whole unit (nose to tail, including any gun barrel) fills about 85 percent of the picture's width, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Eastern - look 1 (levels 1-3) - Card scene - `ul-tank-east-1-scene`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-east-1-side (not made yet)` (the master side view of this look)
- **Size:** 3:2, 1K. **Saved as:** `assets/art-src/ul-tank-east-1-scene.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), seen in action in its natural setting as described below. Do not redesign, simplify or add to it. Do not copy the grey background: the new picture is a full outdoor scene.

A single main battle tank driving at moderate speed along a dirt road, kicking up a modest trail of dust behind its tracks. The setting: a wide open steppe of pale green and golden grass with a line of birch trees and the edge of a dark pine forest in the distance, on a rutted brown dirt road. Seen from a low front three-quarter angle slightly above ground level, the tank fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one tank: no crew visible, no other vehicle, no people, no buildings, no signs. The tank is described in words as: Family look (Eastern): a low, rounded, dome-like turret set slightly forward on a low, compact, short hull; reactive-armour bricks (rows of small square blocks) that cover more of the tank in every generation; smoke-grenade launcher tubes along the turret sides; a log and fuel drums on the rear deck; dark olive-green paint. Generation 1 of 3, the oldest: a small, low, smooth dome turret, a low hull with six small road wheels per side and thin track guards, a smoothbore gun with a bore-evacuator bulge, an infrared searchlight beside the gun, a first small set of reactive bricks on the hull front only. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: the same clean, polished 3D strategy-game render as the attached picture, with crisp edges, simplified shapes and clear silhouettes, bright but natural colours and slightly realistic materials with subtle wear, dust and weathering; not toy-like, not a photograph. Natural daylight and soft shadows. Landscape 3:2 image: the scene fills the whole picture edge to edge, with no grey studio background, no border, no frame, no vignette, no colour tint, no filter and no overlay of any kind. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Eastern - look 1 (levels 1-3) - Top-down - `ul-tank-east-1-top`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-east-1-side (not made yet)` (the master side view of this look)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-east-1-top.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), but now seen exactly straight down from above, as described below. Do not redesign, simplify or add to it. Do not copy the attached picture's camera angle: draw a true top-down plan view.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Eastern): a low, rounded, dome-like turret set slightly forward on a low, compact, short hull; reactive-armour bricks (rows of small square blocks) that cover more of the tank in every generation; smoke-grenade launcher tubes along the turret sides; a log and fuel drums on the rear deck; dark olive-green paint. Generation 1 of 3, the oldest: a small, low, smooth dome turret, a low hull with six small road wheels per side and thin track guards, a smoothbore gun with a bore-evacuator bulge, an infrared searchlight beside the gun, a first small set of reactive bricks on the hull front only. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Eastern - look 2 (levels 4-6) - Side view (the master) - `ul-tank-east-2-side`

- **Batch 2.** A fresh picture (generation, not an edit).
- **Attached:** `assets/art-src/ba-v2-army-base-1.webp`, `assets/art-src/ba-v2-naval-yard-1.webp`, `ul-tank-east-1-side (not made yet)` (two anchor buildings for style only, then the group's look-1 side view)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-east-2-side.webp`

```text
The first two attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background; do NOT copy anything in them. The third attached picture is generation 1 of this group's main battle tank, seen from the same three-quarter side view. Use it only as the reference for the camera angle, the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front and gun turned toward the lower right of the picture so that the viewer sees its front and one long side, the turret facing the same way as the hull. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull spans about 85 percent of the picture's width; the entire tank, gun barrel and tracks included, is inside the frame with a margin all round. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Eastern): a low, rounded, dome-like turret set slightly forward on a low, compact, short hull; reactive-armour bricks (rows of small square blocks) that cover more of the tank in every generation; smoke-grenade launcher tubes along the turret sides; a log and fuel drums on the rear deck; dark olive-green paint. Generation 2 of 3, a clearly newer design: a larger, low, rounded turret with rows of reactive bricks across its whole front and sides and across the hull front, thick rubber-and-metal side skirts, a missile-capable gun, smoke launcher tubes on the turret sides, a remote machine gun on the roof. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: a front three-quarter side view from slightly above (about 30 degrees down, the classic strategy-game model angle, the same angle family as the attached buildings), the unit's front turned toward the lower right of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the whole unit (nose to tail, including any gun barrel) fills about 85 percent of the picture's width, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Eastern - look 2 (levels 4-6) - Card scene - `ul-tank-east-2-scene`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-east-2-side (not made yet)` (the master side view of this look)
- **Size:** 3:2, 1K. **Saved as:** `assets/art-src/ul-tank-east-2-scene.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), seen in action in its natural setting as described below. Do not redesign, simplify or add to it. Do not copy the grey background: the new picture is a full outdoor scene.

A single main battle tank driving at moderate speed along a dirt road, kicking up a modest trail of dust behind its tracks. The setting: a wide open steppe of pale green and golden grass with a line of birch trees and the edge of a dark pine forest in the distance, on a rutted brown dirt road. Seen from a low front three-quarter angle slightly above ground level, the tank fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one tank: no crew visible, no other vehicle, no people, no buildings, no signs. The tank is described in words as: Family look (Eastern): a low, rounded, dome-like turret set slightly forward on a low, compact, short hull; reactive-armour bricks (rows of small square blocks) that cover more of the tank in every generation; smoke-grenade launcher tubes along the turret sides; a log and fuel drums on the rear deck; dark olive-green paint. Generation 2 of 3, a clearly newer design: a larger, low, rounded turret with rows of reactive bricks across its whole front and sides and across the hull front, thick rubber-and-metal side skirts, a missile-capable gun, smoke launcher tubes on the turret sides, a remote machine gun on the roof. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: the same clean, polished 3D strategy-game render as the attached picture, with crisp edges, simplified shapes and clear silhouettes, bright but natural colours and slightly realistic materials with subtle wear, dust and weathering; not toy-like, not a photograph. Natural daylight and soft shadows. Landscape 3:2 image: the scene fills the whole picture edge to edge, with no grey studio background, no border, no frame, no vignette, no colour tint, no filter and no overlay of any kind. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Eastern - look 2 (levels 4-6) - Top-down - `ul-tank-east-2-top`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-east-2-side (not made yet)` (the master side view of this look)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-east-2-top.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), but now seen exactly straight down from above, as described below. Do not redesign, simplify or add to it. Do not copy the attached picture's camera angle: draw a true top-down plan view.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Eastern): a low, rounded, dome-like turret set slightly forward on a low, compact, short hull; reactive-armour bricks (rows of small square blocks) that cover more of the tank in every generation; smoke-grenade launcher tubes along the turret sides; a log and fuel drums on the rear deck; dark olive-green paint. Generation 2 of 3, a clearly newer design: a larger, low, rounded turret with rows of reactive bricks across its whole front and sides and across the hull front, thick rubber-and-metal side skirts, a missile-capable gun, smoke launcher tubes on the turret sides, a remote machine gun on the roof. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Eastern - look 3 (levels 7-8) - Side view (the master) - `ul-tank-east-3-side`

- **Batch 2.** A fresh picture (generation, not an edit).
- **Attached:** `assets/art-src/ba-v2-army-base-1.webp`, `assets/art-src/ba-v2-naval-yard-1.webp`, `ul-tank-east-1-side (not made yet)` (two anchor buildings for style only, then the group's look-1 side view)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-east-3-side.webp`

```text
The first two attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background; do NOT copy anything in them. The third attached picture is generation 1 of this group's main battle tank, seen from the same three-quarter side view. Use it only as the reference for the camera angle, the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front and gun turned toward the lower right of the picture so that the viewer sees its front and one long side, the turret facing the same way as the hull. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull spans about 85 percent of the picture's width; the entire tank, gun barrel and tracks included, is inside the frame with a margin all round. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Eastern): a low, rounded, dome-like turret set slightly forward on a low, compact, short hull; reactive-armour bricks (rows of small square blocks) that cover more of the tank in every generation; smoke-grenade launcher tubes along the turret sides; a log and fuel drums on the rear deck; dark olive-green paint. Generation 3 of 3, the newest: a very low, wide, rounded turret fully covered in reactive bricks, a panoramic sight dome and a remote machine-gun station on the roof, active-protection launcher tubes around the turret, bricks and slat armour over the whole hull, armoured fuel tanks at the rear. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: a front three-quarter side view from slightly above (about 30 degrees down, the classic strategy-game model angle, the same angle family as the attached buildings), the unit's front turned toward the lower right of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the whole unit (nose to tail, including any gun barrel) fills about 85 percent of the picture's width, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Eastern - look 3 (levels 7-8) - Card scene - `ul-tank-east-3-scene`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-east-3-side (not made yet)` (the master side view of this look)
- **Size:** 3:2, 1K. **Saved as:** `assets/art-src/ul-tank-east-3-scene.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), seen in action in its natural setting as described below. Do not redesign, simplify or add to it. Do not copy the grey background: the new picture is a full outdoor scene.

A single main battle tank driving at moderate speed along a dirt road, kicking up a modest trail of dust behind its tracks. The setting: a wide open steppe of pale green and golden grass with a line of birch trees and the edge of a dark pine forest in the distance, on a rutted brown dirt road. Seen from a low front three-quarter angle slightly above ground level, the tank fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one tank: no crew visible, no other vehicle, no people, no buildings, no signs. The tank is described in words as: Family look (Eastern): a low, rounded, dome-like turret set slightly forward on a low, compact, short hull; reactive-armour bricks (rows of small square blocks) that cover more of the tank in every generation; smoke-grenade launcher tubes along the turret sides; a log and fuel drums on the rear deck; dark olive-green paint. Generation 3 of 3, the newest: a very low, wide, rounded turret fully covered in reactive bricks, a panoramic sight dome and a remote machine-gun station on the roof, active-protection launcher tubes around the turret, bricks and slat armour over the whole hull, armoured fuel tanks at the rear. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: the same clean, polished 3D strategy-game render as the attached picture, with crisp edges, simplified shapes and clear silhouettes, bright but natural colours and slightly realistic materials with subtle wear, dust and weathering; not toy-like, not a photograph. Natural daylight and soft shadows. Landscape 3:2 image: the scene fills the whole picture edge to edge, with no grey studio background, no border, no frame, no vignette, no colour tint, no filter and no overlay of any kind. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Eastern - look 3 (levels 7-8) - Top-down - `ul-tank-east-3-top`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-east-3-side (not made yet)` (the master side view of this look)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-east-3-top.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), but now seen exactly straight down from above, as described below. Do not redesign, simplify or add to it. Do not copy the attached picture's camera angle: draw a true top-down plan view.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Eastern): a low, rounded, dome-like turret set slightly forward on a low, compact, short hull; reactive-armour bricks (rows of small square blocks) that cover more of the tank in every generation; smoke-grenade launcher tubes along the turret sides; a log and fuel drums on the rear deck; dark olive-green paint. Generation 3 of 3, the newest: a very low, wide, rounded turret fully covered in reactive bricks, a panoramic sight dome and a remote machine-gun station on the roof, active-protection launcher tubes around the turret, bricks and slat armour over the whole hull, armoured fuel tanks at the rear. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### China - look 1 (levels 1-3) - Side view (the master) - `ul-tank-china-1-side`

- **Batch 1.** A fresh picture (generation, not an edit).
- **Attached:** `assets/art-src/ba-v2-army-base-1.webp`, `assets/art-src/ba-v2-naval-yard-1.webp` (the two anchor buildings: style only)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-china-1-side.webp`

```text
The attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background. Do NOT copy anything in them: no buildings, tents, trucks, ships or ground in the new picture. The buildings are seen at an angle from above, and the new picture uses the same angle family, as described below: a front three-quarter side view from slightly above.

A single main battle tank, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front and gun turned toward the lower right of the picture so that the viewer sees its front and one long side, the turret facing the same way as the hull. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull spans about 85 percent of the picture's width; the entire tank, gun barrel and tracks included, is inside the frame with a margin all round. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (China, its own lines): a broad, low turret shaped like a flat arrowhead, with a long sloped front and a large rectangular ammunition bustle box at the rear; a clean, smooth, boxy hull with a long, sharply sloped front plate and seven small, evenly spaced road wheels; a pair of laser-warning sensors on the turret front; plain mid-green paint. Generation 1 of 3, the oldest: a modest rounded-arrowhead turret with a long, thin smoothbore gun, a simple hull with plain track guards, a snorkel tube and a spare fuel drum on the rear deck, no add-on armour. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: a front three-quarter side view from slightly above (about 30 degrees down, the classic strategy-game model angle, the same angle family as the attached buildings), the unit's front turned toward the lower right of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the whole unit (nose to tail, including any gun barrel) fills about 85 percent of the picture's width, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### China - look 1 (levels 1-3) - Card scene - `ul-tank-china-1-scene`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-china-1-side (not made yet)` (the master side view of this look)
- **Size:** 3:2, 1K. **Saved as:** `assets/art-src/ul-tank-china-1-scene.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), seen in action in its natural setting as described below. Do not redesign, simplify or add to it. Do not copy the grey background: the new picture is a full outdoor scene.

A single main battle tank driving at moderate speed along a dirt road, kicking up a modest trail of dust behind its tracks. The setting: green farmland hills with terraced fields and a few tall poplars under a slightly hazy sky, on a rough yellow-brown dirt track. Seen from a low front three-quarter angle slightly above ground level, the tank fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one tank: no crew visible, no other vehicle, no people, no buildings, no signs. The tank is described in words as: Family look (China, its own lines): a broad, low turret shaped like a flat arrowhead, with a long sloped front and a large rectangular ammunition bustle box at the rear; a clean, smooth, boxy hull with a long, sharply sloped front plate and seven small, evenly spaced road wheels; a pair of laser-warning sensors on the turret front; plain mid-green paint. Generation 1 of 3, the oldest: a modest rounded-arrowhead turret with a long, thin smoothbore gun, a simple hull with plain track guards, a snorkel tube and a spare fuel drum on the rear deck, no add-on armour. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: the same clean, polished 3D strategy-game render as the attached picture, with crisp edges, simplified shapes and clear silhouettes, bright but natural colours and slightly realistic materials with subtle wear, dust and weathering; not toy-like, not a photograph. Natural daylight and soft shadows. Landscape 3:2 image: the scene fills the whole picture edge to edge, with no grey studio background, no border, no frame, no vignette, no colour tint, no filter and no overlay of any kind. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### China - look 1 (levels 1-3) - Top-down - `ul-tank-china-1-top`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-china-1-side (not made yet)` (the master side view of this look)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-china-1-top.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), but now seen exactly straight down from above, as described below. Do not redesign, simplify or add to it. Do not copy the attached picture's camera angle: draw a true top-down plan view.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (China, its own lines): a broad, low turret shaped like a flat arrowhead, with a long sloped front and a large rectangular ammunition bustle box at the rear; a clean, smooth, boxy hull with a long, sharply sloped front plate and seven small, evenly spaced road wheels; a pair of laser-warning sensors on the turret front; plain mid-green paint. Generation 1 of 3, the oldest: a modest rounded-arrowhead turret with a long, thin smoothbore gun, a simple hull with plain track guards, a snorkel tube and a spare fuel drum on the rear deck, no add-on armour. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### China - look 2 (levels 4-6) - Side view (the master) - `ul-tank-china-2-side`

- **Batch 2.** A fresh picture (generation, not an edit).
- **Attached:** `assets/art-src/ba-v2-army-base-1.webp`, `assets/art-src/ba-v2-naval-yard-1.webp`, `ul-tank-china-1-side (not made yet)` (two anchor buildings for style only, then the group's look-1 side view)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-china-2-side.webp`

```text
The first two attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background; do NOT copy anything in them. The third attached picture is generation 1 of this group's main battle tank, seen from the same three-quarter side view. Use it only as the reference for the camera angle, the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front and gun turned toward the lower right of the picture so that the viewer sees its front and one long side, the turret facing the same way as the hull. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull spans about 85 percent of the picture's width; the entire tank, gun barrel and tracks included, is inside the frame with a margin all round. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (China, its own lines): a broad, low turret shaped like a flat arrowhead, with a long sloped front and a large rectangular ammunition bustle box at the rear; a clean, smooth, boxy hull with a long, sharply sloped front plate and seven small, evenly spaced road wheels; a pair of laser-warning sensors on the turret front; plain mid-green paint. Generation 2 of 3, a clearly newer design: a bigger, angular arrowhead turret with a wedge of applied composite armour on its front, a large boxy rear bustle, side skirts made of rows of small plates, a gun with a thermal sleeve, a laser-warning pair and a roof machine gun. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: a front three-quarter side view from slightly above (about 30 degrees down, the classic strategy-game model angle, the same angle family as the attached buildings), the unit's front turned toward the lower right of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the whole unit (nose to tail, including any gun barrel) fills about 85 percent of the picture's width, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### China - look 2 (levels 4-6) - Card scene - `ul-tank-china-2-scene`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-china-2-side (not made yet)` (the master side view of this look)
- **Size:** 3:2, 1K. **Saved as:** `assets/art-src/ul-tank-china-2-scene.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), seen in action in its natural setting as described below. Do not redesign, simplify or add to it. Do not copy the grey background: the new picture is a full outdoor scene.

A single main battle tank driving at moderate speed along a dirt road, kicking up a modest trail of dust behind its tracks. The setting: green farmland hills with terraced fields and a few tall poplars under a slightly hazy sky, on a rough yellow-brown dirt track. Seen from a low front three-quarter angle slightly above ground level, the tank fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one tank: no crew visible, no other vehicle, no people, no buildings, no signs. The tank is described in words as: Family look (China, its own lines): a broad, low turret shaped like a flat arrowhead, with a long sloped front and a large rectangular ammunition bustle box at the rear; a clean, smooth, boxy hull with a long, sharply sloped front plate and seven small, evenly spaced road wheels; a pair of laser-warning sensors on the turret front; plain mid-green paint. Generation 2 of 3, a clearly newer design: a bigger, angular arrowhead turret with a wedge of applied composite armour on its front, a large boxy rear bustle, side skirts made of rows of small plates, a gun with a thermal sleeve, a laser-warning pair and a roof machine gun. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: the same clean, polished 3D strategy-game render as the attached picture, with crisp edges, simplified shapes and clear silhouettes, bright but natural colours and slightly realistic materials with subtle wear, dust and weathering; not toy-like, not a photograph. Natural daylight and soft shadows. Landscape 3:2 image: the scene fills the whole picture edge to edge, with no grey studio background, no border, no frame, no vignette, no colour tint, no filter and no overlay of any kind. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### China - look 2 (levels 4-6) - Top-down - `ul-tank-china-2-top`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-china-2-side (not made yet)` (the master side view of this look)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-china-2-top.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), but now seen exactly straight down from above, as described below. Do not redesign, simplify or add to it. Do not copy the attached picture's camera angle: draw a true top-down plan view.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (China, its own lines): a broad, low turret shaped like a flat arrowhead, with a long sloped front and a large rectangular ammunition bustle box at the rear; a clean, smooth, boxy hull with a long, sharply sloped front plate and seven small, evenly spaced road wheels; a pair of laser-warning sensors on the turret front; plain mid-green paint. Generation 2 of 3, a clearly newer design: a bigger, angular arrowhead turret with a wedge of applied composite armour on its front, a large boxy rear bustle, side skirts made of rows of small plates, a gun with a thermal sleeve, a laser-warning pair and a roof machine gun. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### China - look 3 (levels 7-8) - Side view (the master) - `ul-tank-china-3-side`

- **Batch 2.** A fresh picture (generation, not an edit).
- **Attached:** `assets/art-src/ba-v2-army-base-1.webp`, `assets/art-src/ba-v2-naval-yard-1.webp`, `ul-tank-china-1-side (not made yet)` (two anchor buildings for style only, then the group's look-1 side view)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-china-3-side.webp`

```text
The first two attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background; do NOT copy anything in them. The third attached picture is generation 1 of this group's main battle tank, seen from the same three-quarter side view. Use it only as the reference for the camera angle, the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front and gun turned toward the lower right of the picture so that the viewer sees its front and one long side, the turret facing the same way as the hull. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull spans about 85 percent of the picture's width; the entire tank, gun barrel and tracks included, is inside the frame with a margin all round. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (China, its own lines): a broad, low turret shaped like a flat arrowhead, with a long sloped front and a large rectangular ammunition bustle box at the rear; a clean, smooth, boxy hull with a long, sharply sloped front plate and seven small, evenly spaced road wheels; a pair of laser-warning sensors on the turret front; plain mid-green paint. Generation 3 of 3, the newest: a very clean, low, smooth-faceted turret with flat integrated sensor panels, a remote weapon station on the roof, active-protection domes at the turret corners, a longer gun, a hull front of smooth sloped composite armour, full side skirts. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: a front three-quarter side view from slightly above (about 30 degrees down, the classic strategy-game model angle, the same angle family as the attached buildings), the unit's front turned toward the lower right of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the whole unit (nose to tail, including any gun barrel) fills about 85 percent of the picture's width, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### China - look 3 (levels 7-8) - Card scene - `ul-tank-china-3-scene`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-china-3-side (not made yet)` (the master side view of this look)
- **Size:** 3:2, 1K. **Saved as:** `assets/art-src/ul-tank-china-3-scene.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), seen in action in its natural setting as described below. Do not redesign, simplify or add to it. Do not copy the grey background: the new picture is a full outdoor scene.

A single main battle tank driving at moderate speed along a dirt road, kicking up a modest trail of dust behind its tracks. The setting: green farmland hills with terraced fields and a few tall poplars under a slightly hazy sky, on a rough yellow-brown dirt track. Seen from a low front three-quarter angle slightly above ground level, the tank fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one tank: no crew visible, no other vehicle, no people, no buildings, no signs. The tank is described in words as: Family look (China, its own lines): a broad, low turret shaped like a flat arrowhead, with a long sloped front and a large rectangular ammunition bustle box at the rear; a clean, smooth, boxy hull with a long, sharply sloped front plate and seven small, evenly spaced road wheels; a pair of laser-warning sensors on the turret front; plain mid-green paint. Generation 3 of 3, the newest: a very clean, low, smooth-faceted turret with flat integrated sensor panels, a remote weapon station on the roof, active-protection domes at the turret corners, a longer gun, a hull front of smooth sloped composite armour, full side skirts. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: the same clean, polished 3D strategy-game render as the attached picture, with crisp edges, simplified shapes and clear silhouettes, bright but natural colours and slightly realistic materials with subtle wear, dust and weathering; not toy-like, not a photograph. Natural daylight and soft shadows. Landscape 3:2 image: the scene fills the whole picture edge to edge, with no grey studio background, no border, no frame, no vignette, no colour tint, no filter and no overlay of any kind. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### China - look 3 (levels 7-8) - Top-down - `ul-tank-china-3-top`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-china-3-side (not made yet)` (the master side view of this look)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-china-3-top.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), but now seen exactly straight down from above, as described below. Do not redesign, simplify or add to it. Do not copy the attached picture's camera angle: draw a true top-down plan view.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (China, its own lines): a broad, low turret shaped like a flat arrowhead, with a long sloped front and a large rectangular ammunition bustle box at the rear; a clean, smooth, boxy hull with a long, sharply sloped front plate and seven small, evenly spaced road wheels; a pair of laser-warning sensors on the turret front; plain mid-green paint. Generation 3 of 3, the newest: a very clean, low, smooth-faceted turret with flat integrated sensor panels, a remote weapon station on the roof, active-protection domes at the turret corners, a longer gun, a hull front of smooth sloped composite armour, full side skirts. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Europe - look 1 (levels 1-3) - Side view (the master) - `ul-tank-europe-1-side`

- **Batch 1.** A fresh picture (generation, not an edit).
- **Attached:** `assets/art-src/ba-v2-army-base-1.webp`, `assets/art-src/ba-v2-naval-yard-1.webp` (the two anchor buildings: style only)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-europe-1-side.webp`

```text
The attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background. Do NOT copy anything in them: no buildings, tents, trucks, ships or ground in the new picture. The buildings are seen at an angle from above, and the new picture uses the same angle family, as described below: a front three-quarter side view from slightly above.

A single main battle tank, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front and gun turned toward the lower right of the picture so that the viewer sees its front and one long side, the turret facing the same way as the hull. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull spans about 85 percent of the picture's width; the entire tank, gun barrel and tracks included, is inside the frame with a margin all round. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Europe): a long, sleek, low and smoothly sloped design: a long hull with seven road wheels, a turret of sloping, rounded-faceted shapes with a large rear bustle that holds an automatic loader, a long slender gun, a small raised pod for the commander's panoramic sight, a clean low silhouette; dark grey-green paint. Generation 1 of 3, the oldest: a light, fast, compact design: a narrow hull, a small egg-shaped rounded cast turret, a long slender gun with a muzzle brake, a plain commander's cupola, almost no add-on armour, bare track guards. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: a front three-quarter side view from slightly above (about 30 degrees down, the classic strategy-game model angle, the same angle family as the attached buildings), the unit's front turned toward the lower right of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the whole unit (nose to tail, including any gun barrel) fills about 85 percent of the picture's width, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Europe - look 1 (levels 1-3) - Card scene - `ul-tank-europe-1-scene`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-europe-1-side (not made yet)` (the master side view of this look)
- **Size:** 3:2, 1K. **Saved as:** `assets/art-src/ul-tank-europe-1-scene.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), seen in action in its natural setting as described below. Do not redesign, simplify or add to it. Do not copy the grey background: the new picture is a full outdoor scene.

A single main battle tank driving at moderate speed along a dirt road, kicking up a modest trail of dust behind its tracks. The setting: gentle temperate farmland with hedgerows, fields and a few tall poplar trees, a distant wooded ridge, on a gravel-and-earth farm track. Seen from a low front three-quarter angle slightly above ground level, the tank fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one tank: no crew visible, no other vehicle, no people, no buildings, no signs. The tank is described in words as: Family look (Europe): a long, sleek, low and smoothly sloped design: a long hull with seven road wheels, a turret of sloping, rounded-faceted shapes with a large rear bustle that holds an automatic loader, a long slender gun, a small raised pod for the commander's panoramic sight, a clean low silhouette; dark grey-green paint. Generation 1 of 3, the oldest: a light, fast, compact design: a narrow hull, a small egg-shaped rounded cast turret, a long slender gun with a muzzle brake, a plain commander's cupola, almost no add-on armour, bare track guards. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: the same clean, polished 3D strategy-game render as the attached picture, with crisp edges, simplified shapes and clear silhouettes, bright but natural colours and slightly realistic materials with subtle wear, dust and weathering; not toy-like, not a photograph. Natural daylight and soft shadows. Landscape 3:2 image: the scene fills the whole picture edge to edge, with no grey studio background, no border, no frame, no vignette, no colour tint, no filter and no overlay of any kind. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Europe - look 1 (levels 1-3) - Top-down - `ul-tank-europe-1-top`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-europe-1-side (not made yet)` (the master side view of this look)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-europe-1-top.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), but now seen exactly straight down from above, as described below. Do not redesign, simplify or add to it. Do not copy the attached picture's camera angle: draw a true top-down plan view.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Europe): a long, sleek, low and smoothly sloped design: a long hull with seven road wheels, a turret of sloping, rounded-faceted shapes with a large rear bustle that holds an automatic loader, a long slender gun, a small raised pod for the commander's panoramic sight, a clean low silhouette; dark grey-green paint. Generation 1 of 3, the oldest: a light, fast, compact design: a narrow hull, a small egg-shaped rounded cast turret, a long slender gun with a muzzle brake, a plain commander's cupola, almost no add-on armour, bare track guards. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Europe - look 2 (levels 4-6) - Side view (the master) - `ul-tank-europe-2-side`

- **Batch 2.** A fresh picture (generation, not an edit).
- **Attached:** `assets/art-src/ba-v2-army-base-1.webp`, `assets/art-src/ba-v2-naval-yard-1.webp`, `ul-tank-europe-1-side (not made yet)` (two anchor buildings for style only, then the group's look-1 side view)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-europe-2-side.webp`

```text
The first two attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background; do NOT copy anything in them. The third attached picture is generation 1 of this group's main battle tank, seen from the same three-quarter side view. Use it only as the reference for the camera angle, the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front and gun turned toward the lower right of the picture so that the viewer sees its front and one long side, the turret facing the same way as the hull. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull spans about 85 percent of the picture's width; the entire tank, gun barrel and tracks included, is inside the frame with a margin all round. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Europe): a long, sleek, low and smoothly sloped design: a long hull with seven road wheels, a turret of sloping, rounded-faceted shapes with a large rear bustle that holds an automatic loader, a long slender gun, a small raised pod for the commander's panoramic sight, a clean low silhouette; dark grey-green paint. Generation 2 of 3, a clearly newer design: a bigger, smoothly sloped wedge turret with a long rounded rear bustle, side skirts, a gun with a thermal sleeve, a raised panoramic sight pod, a hull with a sharply sloped front. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: a front three-quarter side view from slightly above (about 30 degrees down, the classic strategy-game model angle, the same angle family as the attached buildings), the unit's front turned toward the lower right of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the whole unit (nose to tail, including any gun barrel) fills about 85 percent of the picture's width, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Europe - look 2 (levels 4-6) - Card scene - `ul-tank-europe-2-scene`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-europe-2-side (not made yet)` (the master side view of this look)
- **Size:** 3:2, 1K. **Saved as:** `assets/art-src/ul-tank-europe-2-scene.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), seen in action in its natural setting as described below. Do not redesign, simplify or add to it. Do not copy the grey background: the new picture is a full outdoor scene.

A single main battle tank driving at moderate speed along a dirt road, kicking up a modest trail of dust behind its tracks. The setting: gentle temperate farmland with hedgerows, fields and a few tall poplar trees, a distant wooded ridge, on a gravel-and-earth farm track. Seen from a low front three-quarter angle slightly above ground level, the tank fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one tank: no crew visible, no other vehicle, no people, no buildings, no signs. The tank is described in words as: Family look (Europe): a long, sleek, low and smoothly sloped design: a long hull with seven road wheels, a turret of sloping, rounded-faceted shapes with a large rear bustle that holds an automatic loader, a long slender gun, a small raised pod for the commander's panoramic sight, a clean low silhouette; dark grey-green paint. Generation 2 of 3, a clearly newer design: a bigger, smoothly sloped wedge turret with a long rounded rear bustle, side skirts, a gun with a thermal sleeve, a raised panoramic sight pod, a hull with a sharply sloped front. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: the same clean, polished 3D strategy-game render as the attached picture, with crisp edges, simplified shapes and clear silhouettes, bright but natural colours and slightly realistic materials with subtle wear, dust and weathering; not toy-like, not a photograph. Natural daylight and soft shadows. Landscape 3:2 image: the scene fills the whole picture edge to edge, with no grey studio background, no border, no frame, no vignette, no colour tint, no filter and no overlay of any kind. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Europe - look 2 (levels 4-6) - Top-down - `ul-tank-europe-2-top`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-europe-2-side (not made yet)` (the master side view of this look)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-europe-2-top.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), but now seen exactly straight down from above, as described below. Do not redesign, simplify or add to it. Do not copy the attached picture's camera angle: draw a true top-down plan view.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Europe): a long, sleek, low and smoothly sloped design: a long hull with seven road wheels, a turret of sloping, rounded-faceted shapes with a large rear bustle that holds an automatic loader, a long slender gun, a small raised pod for the commander's panoramic sight, a clean low silhouette; dark grey-green paint. Generation 2 of 3, a clearly newer design: a bigger, smoothly sloped wedge turret with a long rounded rear bustle, side skirts, a gun with a thermal sleeve, a raised panoramic sight pod, a hull with a sharply sloped front. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Europe - look 3 (levels 7-8) - Side view (the master) - `ul-tank-europe-3-side`

- **Batch 2.** A fresh picture (generation, not an edit).
- **Attached:** `assets/art-src/ba-v2-army-base-1.webp`, `assets/art-src/ba-v2-naval-yard-1.webp`, `ul-tank-europe-1-side (not made yet)` (two anchor buildings for style only, then the group's look-1 side view)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-europe-3-side.webp`

```text
The first two attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background; do NOT copy anything in them. The third attached picture is generation 1 of this group's main battle tank, seen from the same three-quarter side view. Use it only as the reference for the camera angle, the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front and gun turned toward the lower right of the picture so that the viewer sees its front and one long side, the turret facing the same way as the hull. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull spans about 85 percent of the picture's width; the entire tank, gun barrel and tracks included, is inside the frame with a margin all round. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Europe): a long, sleek, low and smoothly sloped design: a long hull with seven road wheels, a turret of sloping, rounded-faceted shapes with a large rear bustle that holds an automatic loader, a long slender gun, a small raised pod for the commander's panoramic sight, a clean low silhouette; dark grey-green paint. Generation 3 of 3, the newest: a tall, wide, unmanned turret of smooth faceted panels, a small second weapon mounted beside the main gun, a slim sensor mast, modular armour blocks, active-protection sensors, a long gun, a low sleek hull with full skirts. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: a front three-quarter side view from slightly above (about 30 degrees down, the classic strategy-game model angle, the same angle family as the attached buildings), the unit's front turned toward the lower right of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the whole unit (nose to tail, including any gun barrel) fills about 85 percent of the picture's width, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Europe - look 3 (levels 7-8) - Card scene - `ul-tank-europe-3-scene`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-europe-3-side (not made yet)` (the master side view of this look)
- **Size:** 3:2, 1K. **Saved as:** `assets/art-src/ul-tank-europe-3-scene.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), seen in action in its natural setting as described below. Do not redesign, simplify or add to it. Do not copy the grey background: the new picture is a full outdoor scene.

A single main battle tank driving at moderate speed along a dirt road, kicking up a modest trail of dust behind its tracks. The setting: gentle temperate farmland with hedgerows, fields and a few tall poplar trees, a distant wooded ridge, on a gravel-and-earth farm track. Seen from a low front three-quarter angle slightly above ground level, the tank fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one tank: no crew visible, no other vehicle, no people, no buildings, no signs. The tank is described in words as: Family look (Europe): a long, sleek, low and smoothly sloped design: a long hull with seven road wheels, a turret of sloping, rounded-faceted shapes with a large rear bustle that holds an automatic loader, a long slender gun, a small raised pod for the commander's panoramic sight, a clean low silhouette; dark grey-green paint. Generation 3 of 3, the newest: a tall, wide, unmanned turret of smooth faceted panels, a small second weapon mounted beside the main gun, a slim sensor mast, modular armour blocks, active-protection sensors, a long gun, a low sleek hull with full skirts. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: the same clean, polished 3D strategy-game render as the attached picture, with crisp edges, simplified shapes and clear silhouettes, bright but natural colours and slightly realistic materials with subtle wear, dust and weathering; not toy-like, not a photograph. Natural daylight and soft shadows. Landscape 3:2 image: the scene fills the whole picture edge to edge, with no grey studio background, no border, no frame, no vignette, no colour tint, no filter and no overlay of any kind. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Europe - look 3 (levels 7-8) - Top-down - `ul-tank-europe-3-top`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-europe-3-side (not made yet)` (the master side view of this look)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-europe-3-top.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), but now seen exactly straight down from above, as described below. Do not redesign, simplify or add to it. Do not copy the attached picture's camera angle: draw a true top-down plan view.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Europe): a long, sleek, low and smoothly sloped design: a long hull with seven road wheels, a turret of sloping, rounded-faceted shapes with a large rear bustle that holds an automatic loader, a long slender gun, a small raised pod for the commander's panoramic sight, a clean low silhouette; dark grey-green paint. Generation 3 of 3, the newest: a tall, wide, unmanned turret of smooth faceted panels, a small second weapon mounted beside the main gun, a slim sensor mast, modular armour blocks, active-protection sensors, a long gun, a low sleek hull with full skirts. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Export - look 1 (levels 1-3) - Side view (the master) - `ul-tank-export-1-side`

- **Batch 1.** A fresh picture (generation, not an edit).
- **Attached:** `assets/art-src/ba-v2-army-base-1.webp`, `assets/art-src/ba-v2-naval-yard-1.webp` (the two anchor buildings: style only)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-export-1-side.webp`

```text
The attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background. Do NOT copy anything in them: no buildings, tents, trucks, ships or ground in the new picture. The buildings are seen at an angle from above, and the new picture uses the same angle family, as described below: a front three-quarter side view from slightly above.

A single main battle tank, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front and gun turned toward the lower right of the picture so that the viewer sees its front and one long side, the turret facing the same way as the hull. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull spans about 85 percent of the picture's width; the entire tank, gun barrel and tracks included, is inside the frame with a margin all round. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a round or flat-topped turret on a boxy hull, bolt-on kits and add-on parts that look like they were fitted by the buyer, faded ochre-sand paint with a few patches of darker touch-up paint. Generation 1 of 3, the oldest, a post-war pattern: a round dome turret with a simple long gun, a small tall hull with four large road wheels per side, an unditching beam across the rear deck, an open-top searchlight, a machine gun on the turret roof. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: a front three-quarter side view from slightly above (about 30 degrees down, the classic strategy-game model angle, the same angle family as the attached buildings), the unit's front turned toward the lower right of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the whole unit (nose to tail, including any gun barrel) fills about 85 percent of the picture's width, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Export - look 1 (levels 1-3) - Card scene - `ul-tank-export-1-scene`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-export-1-side (not made yet)` (the master side view of this look)
- **Size:** 3:2, 1K. **Saved as:** `assets/art-src/ul-tank-export-1-scene.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), seen in action in its natural setting as described below. Do not redesign, simplify or add to it. Do not copy the grey background: the new picture is a full outdoor scene.

A single main battle tank driving at moderate speed along a dirt road, kicking up a modest trail of dust behind its tracks. The setting: a dry savanna with scattered flat-topped acacia trees, red-brown earth and tufts of dry grass, on a red-brown dirt road. Seen from a low front three-quarter angle slightly above ground level, the tank fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one tank: no crew visible, no other vehicle, no people, no buildings, no signs. The tank is described in words as: Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a round or flat-topped turret on a boxy hull, bolt-on kits and add-on parts that look like they were fitted by the buyer, faded ochre-sand paint with a few patches of darker touch-up paint. Generation 1 of 3, the oldest, a post-war pattern: a round dome turret with a simple long gun, a small tall hull with four large road wheels per side, an unditching beam across the rear deck, an open-top searchlight, a machine gun on the turret roof. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: the same clean, polished 3D strategy-game render as the attached picture, with crisp edges, simplified shapes and clear silhouettes, bright but natural colours and slightly realistic materials with subtle wear, dust and weathering; not toy-like, not a photograph. Natural daylight and soft shadows. Landscape 3:2 image: the scene fills the whole picture edge to edge, with no grey studio background, no border, no frame, no vignette, no colour tint, no filter and no overlay of any kind. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Export - look 1 (levels 1-3) - Top-down - `ul-tank-export-1-top`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-export-1-side (not made yet)` (the master side view of this look)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-export-1-top.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), but now seen exactly straight down from above, as described below. Do not redesign, simplify or add to it. Do not copy the attached picture's camera angle: draw a true top-down plan view.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a round or flat-topped turret on a boxy hull, bolt-on kits and add-on parts that look like they were fitted by the buyer, faded ochre-sand paint with a few patches of darker touch-up paint. Generation 1 of 3, the oldest, a post-war pattern: a round dome turret with a simple long gun, a small tall hull with four large road wheels per side, an unditching beam across the rear deck, an open-top searchlight, a machine gun on the turret roof. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Export - look 2 (levels 4-6) - Side view (the master) - `ul-tank-export-2-side`

- **Batch 2.** A fresh picture (generation, not an edit).
- **Attached:** `assets/art-src/ba-v2-army-base-1.webp`, `assets/art-src/ba-v2-naval-yard-1.webp`, `ul-tank-export-1-side (not made yet)` (two anchor buildings for style only, then the group's look-1 side view)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-export-2-side.webp`

```text
The first two attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background; do NOT copy anything in them. The third attached picture is generation 1 of this group's main battle tank, seen from the same three-quarter side view. Use it only as the reference for the camera angle, the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front and gun turned toward the lower right of the picture so that the viewer sees its front and one long side, the turret facing the same way as the hull. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull spans about 85 percent of the picture's width; the entire tank, gun barrel and tracks included, is inside the frame with a margin all round. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a round or flat-topped turret on a boxy hull, bolt-on kits and add-on parts that look like they were fitted by the buyer, faded ochre-sand paint with a few patches of darker touch-up paint. Generation 2 of 3, a clearly newer, widely exported 1970s-80s pattern: a flat-topped rounded turret on a longer hull, a rangefinder box on the turret, bolt-on side skirts, a smoke-launcher pack, a few add-on armour plates on the turret front, a snorkel tube. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: a front three-quarter side view from slightly above (about 30 degrees down, the classic strategy-game model angle, the same angle family as the attached buildings), the unit's front turned toward the lower right of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the whole unit (nose to tail, including any gun barrel) fills about 85 percent of the picture's width, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Export - look 2 (levels 4-6) - Card scene - `ul-tank-export-2-scene`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-export-2-side (not made yet)` (the master side view of this look)
- **Size:** 3:2, 1K. **Saved as:** `assets/art-src/ul-tank-export-2-scene.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), seen in action in its natural setting as described below. Do not redesign, simplify or add to it. Do not copy the grey background: the new picture is a full outdoor scene.

A single main battle tank driving at moderate speed along a dirt road, kicking up a modest trail of dust behind its tracks. The setting: a dry savanna with scattered flat-topped acacia trees, red-brown earth and tufts of dry grass, on a red-brown dirt road. Seen from a low front three-quarter angle slightly above ground level, the tank fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one tank: no crew visible, no other vehicle, no people, no buildings, no signs. The tank is described in words as: Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a round or flat-topped turret on a boxy hull, bolt-on kits and add-on parts that look like they were fitted by the buyer, faded ochre-sand paint with a few patches of darker touch-up paint. Generation 2 of 3, a clearly newer, widely exported 1970s-80s pattern: a flat-topped rounded turret on a longer hull, a rangefinder box on the turret, bolt-on side skirts, a smoke-launcher pack, a few add-on armour plates on the turret front, a snorkel tube. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: the same clean, polished 3D strategy-game render as the attached picture, with crisp edges, simplified shapes and clear silhouettes, bright but natural colours and slightly realistic materials with subtle wear, dust and weathering; not toy-like, not a photograph. Natural daylight and soft shadows. Landscape 3:2 image: the scene fills the whole picture edge to edge, with no grey studio background, no border, no frame, no vignette, no colour tint, no filter and no overlay of any kind. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Export - look 2 (levels 4-6) - Top-down - `ul-tank-export-2-top`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-export-2-side (not made yet)` (the master side view of this look)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-export-2-top.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), but now seen exactly straight down from above, as described below. Do not redesign, simplify or add to it. Do not copy the attached picture's camera angle: draw a true top-down plan view.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a round or flat-topped turret on a boxy hull, bolt-on kits and add-on parts that look like they were fitted by the buyer, faded ochre-sand paint with a few patches of darker touch-up paint. Generation 2 of 3, a clearly newer, widely exported 1970s-80s pattern: a flat-topped rounded turret on a longer hull, a rangefinder box on the turret, bolt-on side skirts, a smoke-launcher pack, a few add-on armour plates on the turret front, a snorkel tube. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Export - look 3 (levels 7-8) - Side view (the master) - `ul-tank-export-3-side`

- **Batch 2.** A fresh picture (generation, not an edit).
- **Attached:** `assets/art-src/ba-v2-army-base-1.webp`, `assets/art-src/ba-v2-naval-yard-1.webp`, `ul-tank-export-1-side (not made yet)` (two anchor buildings for style only, then the group's look-1 side view)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-export-3-side.webp`

```text
The first two attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background; do NOT copy anything in them. The third attached picture is generation 1 of this group's main battle tank, seen from the same three-quarter side view. Use it only as the reference for the camera angle, the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached main battle tank: its shape is replaced by the new design.

A single main battle tank, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front and gun turned toward the lower right of the picture so that the viewer sees its front and one long side, the turret facing the same way as the hull. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull spans about 85 percent of the picture's width; the entire tank, gun barrel and tracks included, is inside the frame with a margin all round. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a round or flat-topped turret on a boxy hull, bolt-on kits and add-on parts that look like they were fitted by the buyer, faded ochre-sand paint with a few patches of darker touch-up paint. Generation 3 of 3, the newest, a modern export-grade design: a modular angular turret with bolt-on composite armour packages, a remote machine-gun station, a thermal sight box, an auxiliary power pack at the rear, side skirts, a clean but practical look made to be sold to many armies. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: a front three-quarter side view from slightly above (about 30 degrees down, the classic strategy-game model angle, the same angle family as the attached buildings), the unit's front turned toward the lower right of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the whole unit (nose to tail, including any gun barrel) fills about 85 percent of the picture's width, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Export - look 3 (levels 7-8) - Card scene - `ul-tank-export-3-scene`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-export-3-side (not made yet)` (the master side view of this look)
- **Size:** 3:2, 1K. **Saved as:** `assets/art-src/ul-tank-export-3-scene.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), seen in action in its natural setting as described below. Do not redesign, simplify or add to it. Do not copy the grey background: the new picture is a full outdoor scene.

A single main battle tank driving at moderate speed along a dirt road, kicking up a modest trail of dust behind its tracks. The setting: a dry savanna with scattered flat-topped acacia trees, red-brown earth and tufts of dry grass, on a red-brown dirt road. Seen from a low front three-quarter angle slightly above ground level, the tank fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one tank: no crew visible, no other vehicle, no people, no buildings, no signs. The tank is described in words as: Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a round or flat-topped turret on a boxy hull, bolt-on kits and add-on parts that look like they were fitted by the buyer, faded ochre-sand paint with a few patches of darker touch-up paint. Generation 3 of 3, the newest, a modern export-grade design: a modular angular turret with bolt-on composite armour packages, a remote machine-gun station, a thermal sight box, an auxiliary power pack at the rear, side skirts, a clean but practical look made to be sold to many armies. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: the same clean, polished 3D strategy-game render as the attached picture, with crisp edges, simplified shapes and clear silhouettes, bright but natural colours and slightly realistic materials with subtle wear, dust and weathering; not toy-like, not a photograph. Natural daylight and soft shadows. Landscape 3:2 image: the scene fills the whole picture edge to edge, with no grey studio background, no border, no frame, no vignette, no colour tint, no filter and no overlay of any kind. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

### Export - look 3 (levels 7-8) - Top-down - `ul-tank-export-3-top`

- **Batch 3.** A fresh picture made from the side view.
- **Attached:** `ul-tank-export-3-side (not made yet)` (the master side view of this look)
- **Size:** 1:1, 1K. **Saved as:** `assets/art-src/ul-tank-export-3-top.webp`

```text
The attached picture is the master picture of one main battle tank: a three-quarter side view on a plain grey background. Draw the SAME main battle tank, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint colour and every same detail (stowage, armour, sensors, launchers, skirts), but now seen exactly straight down from above, as described below. Do not redesign, simplify or add to it. Do not copy the attached picture's camera angle: draw a true top-down plan view.

A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it. Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a round or flat-topped turret on a boxy hull, bolt-on kits and add-on parts that look like they were fitted by the buyer, faded ochre-sand paint with a few patches of darker touch-up paint. Generation 3 of 3, the newest, a modern export-grade design: a modular angular turret with bolt-on composite armour packages, a remote machine-gun station, a thermal sight box, an auxiliary power pack at the rear, side skirts, a clean but practical look made to be sold to many armies. Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.

Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

## 3. The checks (flag only, never redo)

### 3.1 The single-picture check (`--review`, on every picture)

A Gemini text model gets the new picture first, then its references, with the Art Bible checklist (same unit, style, background, framing,
no markings, original, no extras). Points 3 (background) and 4 (framing) change with the kind: the side view is checked for the
three-quarter view and 85% width; the scene for a full outdoor scene (a grey studio background, a frame or a tint fails); the top-down for
a true straight-down view. PASS or FLAG with reasons goes to the log row and to `<picture>.review.txt`. Print the full text with
`python3 -I tools/gen-art.py --dry-run --review ul-tank-nato-1-side`.

### 3.2 The three-way check (`--match ul-tank-<group>-<look>`)

The side view, card scene and top-down of one look go to the Gemini text model together, in that order. Exact text:

```text
You are the quality checker for the unit pictures of a strategy game. Three pictures of ONE main battle tank are attached, in this order: picture 1 is the SIDE view (the master: a three-quarter side view on a plain grey background), picture 2 is the CARD SCENE (the same main battle tank in action outdoors), picture 3 is the TOP-DOWN (seen from straight above, nose up, on a plain grey background). All three are meant to show exactly the same vehicle. The scene and the top-down were made from the side view.

Check this checklist, each point on its own:
1. SAME VEHICLE: the overall shape, hull, turret, gun, wheels and tracks (the number of road wheels), side skirts, bustle, sensors, launchers, stowage and other details are the same in all three, as far as each view can show them.
2. SAME PAINT: the paint colour and finish are the same in all three (a landscape's light may change them a little).
3. RIGHT VIEW: picture 1 is a front three-quarter side view from slightly above on plain grey; picture 2 is a full outdoor scene with the tank driving on a dirt road, no grey studio background, no tint; picture 3 is a true straight-down plan view, nose up, on plain grey.
4. NO MARKINGS: no text, letters, numbers, logos, flags, emblems, stars or insignia in any of the three.
5. NO EXTRAS: exactly one vehicle in each picture; no second vehicle, no people, no buildings (distant trees and hills are fine).

Answer with JSON only, in this shape: {"verdict": "MATCH" or "FLAG", "flagged_pictures": ["side" and/or "scene" and/or "top", only the ones that do not match or are wrong], "reasons": ["short plain reason", "..."]}. Use MATCH only if all five points are fine (flagged_pictures empty, reasons may be empty). Use FLAG if any point fails or you are unsure, and name each failed point by its number and the picture it concerns, with a short plain reason (under 25 words each).
```

It answers MATCH or FLAG, names which of the three pictures are wrong, and writes the reasons to the log row `<look> (match)` and to
`assets/art-src/<look>.match.txt`. Its cost is logged. It only flags.

**Model and price.** Model id `gemini-2.5-flash`: verified on 18 November 2026 against Google's model list (`GET /v1beta/models`; it lists
`generateContent`). I could not reach Google's price page, so the check's price stays an **estimate** (about $0.30 per million tokens in,
$2.50 per million out, thinking tokens counted as out): about $0.003 a single check and about $0.005 a three-way check.

## 4. The plan

1. Batch 1: the 5 look-1 side views, `--batch --review`. Then batch 2: the 10 look-2 and look-3 side views. Then batch 3: the 30 card scenes
   and top-downs, each from its own side view. One try per picture; every call in `assets/art-src/gen-art-log.jsonl`.
2. After each batch: the single checks (inside `--review`), the three-way checks once all three of a look exist, and the running total:
   `python3 -I tools/gen-art.py --cost` prints new spending since the baseline (re-based 27 November 2026 to the owner's real $24.05), and the estimated balance; a run that could take the
   estimate below $5 is refused.
3. Nothing is redone, even when flagged: every flag is listed for the owner.
4. Cut-outs, no API call: `python3 -I tools/prep-art.py assets/art-src assets/art ul` writes `assets/art/ul-tank-<group>-<look>-side.webp`
   and `-top.webp` (transparent) and `-scene.webp` (resized, not cut out).
5. Only after the owner's OK on the tank sets, the other units.

## 5. The other units (owner: "make the rest, with the Gemini check on every picture", 2026-11-19)

The tank's pattern for every other unit with looks: 5 groups x 3 looks x 3 kinds = 45 pictures a unit, no shared designs. The unit-specific words (frames, scene action, family look, paint, setting and the three generations of each group) are written per unit below; the blocks every unit shares are here. `python3 -I tools/gen-art.py --dry-run ul-<unit>-<group>-<look>-<kind>` prints any complete prompt (free).

**What the tank sets taught, now in every prompt.** The top-down keeps exactly the same layout of hatches, turrets, sensors, stowage and weapons as the side view, on the same side, not mirrored, nothing added or dropped (the three-way check flagged 8 of the 15 tank looks for this). Light from the upper left in every kind. The top-down has no shadow on the grey (the map draws its own); `prep-art.py` also removes any shadow left. The card scenes stay photo-real. Nothing flagged is redone: the owner decides.

**Side view, look 1 (prefix):**
```text
The attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background. Do NOT copy anything in them: no buildings, tents, trucks, ships or ground in the new picture. The buildings are seen at an angle from above, and the new picture uses the same angle family, as described below: a front three-quarter side view from slightly above.
```

**Side view, looks 2 and 3 (prefix; the group's look-1 side view is attached as the third picture):**
```text
The first two attached pictures are two buildings from the same game. They are style references only: copy their rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and their plain flat light grey background; do NOT copy anything in them. The third attached picture is generation 1 of this group's {unit}, seen from the same three-quarter side view. Use it only as the reference for the camera angle, the size and framing, the lighting, the rendering style, the paint colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer model as described below. Do not copy the attached {unit}: its shape is replaced by the new design.
```

**Side view style:**
```text
Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: a front three-quarter side view from slightly above (about 30 degrees down, the classic strategy-game model angle, the same angle family as the attached buildings), the unit's front turned toward the lower right of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the whole unit (nose to tail, including any gun barrel) fills about 85 percent of the picture's width, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

**Card scene prefix** (`{detail}` is the class's list of parts):
```text
The attached picture is the master picture of one {unit}: a three-quarter side view on a plain grey background. Draw the SAME {unit}, exactly: {detail}, seen in action in its natural setting as described below. Do not redesign, simplify or add to it. Do not copy the grey background: the new picture is a full outdoor scene.
```

**Card scene style:**
```text
Style: the same clean, polished 3D strategy-game render as the attached picture, with crisp edges, simplified shapes and clear silhouettes, bright but natural colours and slightly realistic materials with subtle wear, dust and weathering; not toy-like, not a photograph. Natural daylight and soft shadows. Landscape 3:2 image: the scene fills the whole picture edge to edge, with no grey studio background, no border, no frame, no vignette, no colour tint, no filter and no overlay of any kind. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

**Top-down prefix:**
```text
The attached picture is the master picture of one {unit}: a three-quarter side view on a plain grey background. Draw the SAME {unit}, exactly: {detail}, but now seen exactly straight down from above, as described below. Keep exactly the same layout of hatches, turrets, sensors, antennas, stowage, weapons and every other part as the attached side view, on the same side of the unit: the long side that faces the viewer in the side view (the unit's right side, the one nearest the camera) is the right side of the top-down picture. Do not mirror it, do not rearrange it, do not add or drop any part. Light from the upper left. Do not redesign or simplify it. Do not copy the attached picture's camera angle: draw a true top-down plan view.
```

**Top-down style** (the crop sentence is the class's):
```text
Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with no cast shadow on the background. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with no shadow at all; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.
```

**Tail of every unit description:**
```text
 Original generic design made for this game: it must not be a line-for-line copy of any real {kind}; only the family look described here. Plain unmarked paint, no text, numbers, flags, stars, roundels or markings of any kind.
```


**Class `gnd`: parts to keep the same:** the same hull, turret or weapon mount, gun or launcher, wheels or tracks, the same paint colour and every same detail (stowage, armour, skirts, sensors, antennas, hatches)
- crop sentence of the top-down: Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. 
- paint by group: nato: matte sand-tan; east: dark olive-green; china: plain mid-green; europe: dark grey-green; export: faded ochre-sand with a few patches of darker touch-up paint

**Class `air`: parts to keep the same:** the same fuselage, wings, tails, engines, canopy, weapons, sensors and every same detail, the same paint colour
- crop sentence of the top-down: Cropped and centred so the unit's full length or full wingspan, whichever is larger, fills about 90 percent of the picture, nothing cut off. 
- paint by group: nato: pale ghost-grey; east: pale grey with a darker grey-green upper surface; china: pale blue-grey; europe: medium blue-grey; export: sand and olive-green camouflage

**Class `heli`: parts to keep the same:** the same fuselage, rotor(s), tail, wings or stub wings, landing gear, canopy, weapons, sensors and every same detail, the same paint colour
- crop sentence of the top-down: Cropped and centred so the unit's full length or full rotor span, whichever is larger, fills about 90 percent of the picture, nothing cut off. 
- paint by group: nato: matte olive-drab grey; east: dark green with darker green blotches; china: plain dark grey-green; europe: dark green-grey; export: faded olive-green and tan

**Class `ship`: parts to keep the same:** the same hull, superstructure, masts, radars, guns, missile launchers, helicopter deck or flight deck and every same detail, the same paint colour
- crop sentence of the top-down: Cropped and centred so the unit's full length (bow to stern) fills about 90 percent of the picture's height, nothing cut off. 
- paint by group: nato: haze grey; east: mid grey with a darker grey deck; china: light blue-grey; europe: medium blue-grey; export: pale grey with a few rust-streaked patches

**Class `sub`: parts to keep the same:** the same hull, sail (conning tower), tail fins, propulsion, deck details and every same detail, the same paint colour
- crop sentence of the top-down: Cropped and centred so the unit's full length (bow to stern) fills about 90 percent of the picture's height, nothing cut off. 
- paint by group: nato: matte black; east: dark grey-black; china: dark blue-black; europe: dark slate grey; export: dull dark grey-green

**Class `man`: parts to keep the same:** the same soldier: the same helmet, uniform, camouflage, body armour, pack, rifle or weapon, equipment and every same detail
- crop sentence of the top-down: Cropped and centred so the unit fills about 85 percent of the picture's height, nothing cut off. 
- paint by group: nato: a tan-and-brown multi-terrain camouflage; east: olive-green and brown blotch camouflage; china: green-and-brown digital camouflage; europe: a grey-green and brown splinter camouflage; export: a faded khaki and olive desert camouflage

**Card scene settings by class and group**

- ground units: nato: a wide dry grassland valley with low rolling hills, a few sparse trees and scrub bushes, and a broad road of pale tan packed dirt; east: a wide open steppe of pale green and golden grass with a line of birch trees and the edge of a dark pine forest in the distance, on a rutted brown dirt road; china: green farmland hills with terraced fields and a few tall poplars under a slightly hazy sky, on a rough yellow-brown dirt track; europe: gentle temperate farmland with hedgerows, fields and a few tall poplar trees, a distant wooded ridge, on a gravel-and-earth farm track; export: a dry savanna with scattered flat-topped acacia trees, red-brown earth and tufts of dry grass, on a red-brown dirt road
- aircraft: nato: a deep clear blue sky above a sunlit sea of white cloud far below; east: a pale blue sky with high thin cirrus streaks above a far-below patchwork of golden steppe and dark pine forest; china: a hazy pale-blue sky with soft white clouds above distant green mountains far below; europe: a bright sky with scattered cumulus clouds above distant green fields and a river far below; export: a hot clear blue sky with a few small clouds above distant dry brown hills and a red-brown plain far below
- helicopters: nato: low over a dry grassland valley with rolling hills and scattered scrub bushes; east: low over an open golden steppe with a line of birch trees and a dark pine forest on the horizon; china: low over a hazy blue-green sea close to a rocky green coastline; europe: low over gentle farmland with hedgerows, fields and a wooded ridge in the distance; export: low over a dry savanna with scattered flat-topped acacia trees and red-brown earth
- ships and submarines: nato: open blue ocean under a clear sky with a few high clouds, a long gentle swell; east: a cold grey-green northern sea under a low, overcast sky, a long swell and a distant misty horizon; china: a hazy blue-green coastal sea with a faint distant coastline of low hills on the horizon under a pale, slightly hazy sky; europe: a deep blue-green Atlantic sea with white-capped waves and tall cumulus clouds in a bright sky; export: a calm turquoise tropical sea with a low distant island on the horizon and a few small white clouds in a hot clear sky

### Infantry fighting vehicle (`ifv`): 45 prompts, built from these words

Class of picture: `gnd`. Files: `assets/art-src/ul-ifv-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-ifv-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single infantry fighting vehicle, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front turned toward the lower right of the picture so that the viewer sees its front and one long side. The whole vehicle is centred left to right and top to bottom, and its full length (any gun barrel or boom included) spans about 85 percent of the picture's width; the entire vehicle, wheels or tracks included, is inside the frame with a margin all round. Only the infantry fighting vehicle: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it.
- **Top-down frame:** A single infantry fighting vehicle, seen exactly straight down from above (a true top-down plan view), its front pointing to the top of the picture. The whole vehicle is centred left to right and top to bottom, and its full length (any gun barrel or boom included) fills about 90 percent of the picture's height. Only the infantry fighting vehicle: no crew, no other vehicle, no ground, no track marks, no shadow on the background.
- **Card scene:** "A single infantry fighting vehicle driving at moderate speed along a dirt road, kicking up a modest trail of dust behind its tracks. The setting: <the group's setting>. Seen from a low front three-quarter angle slightly above ground level, the vehicle fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one vehicle: no crew visible, no other vehicle, no people, no buildings, no signs. The infantry fighting vehicle is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** a wide dry grassland valley with low rolling hills, a few sparse trees and scrub bushes, and a broad road of pale tan packed dirt.
- **Family look:** Family look (US/NATO): a tall, boxy, slab-sided tracked hull of flat armour plates, a flat angular two-man turret in the middle of the hull carrying an autocannon and an armoured missile-launcher box on its side, a wide rear troop ramp, heavy bolt-on armour. Paint: matte sand-tan.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a simple boxy hull with a small flat-sided turret, a short autocannon, a twin missile tube pod on the turret side, six road wheels per side with bare track guards, small round firing ports along the hull side, a few stowage boxes on the rear deck.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a larger, heavier hull with spaced armour plates and full side skirts, a bigger angular turret with a long stabilised autocannon and an armoured missile box, a roof-mounted thermal sight box, a commander's hatch with a remote machine gun, seven road wheels per side.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a low, wide, angular hull with an unmanned turret carrying a large-calibre autocannon, smooth faceted add-on armour, four flat active-protection sensor panels at the corners, a slim sensor mast, a remote weapon station on the roof, full-length side skirts.

#### Eastern

- **Setting of the card scene:** a wide open steppe of pale green and golden grass with a line of birch trees and the edge of a dark pine forest in the distance, on a rutted brown dirt road.
- **Family look:** Family look (Eastern): a low, compact, sloped tracked hull with a small rounded turret set well forward, smoke-grenade launcher tubes along the turret sides, reactive-armour bricks (rows of small square blocks) that cover more of the vehicle in every generation, a log and fuel drums on the rear deck. Paint: dark olive-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a low, boxy hull with a tiny one-man turret carrying a short smoothbore gun and a missile rail above it, six small road wheels per side, thin track guards, a few small roof hatches, a first small set of reactive bricks on the hull front only.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a larger, taller rounded turret carrying a short gun, a coaxial autocannon and a missile rail, rows of reactive bricks across the turret front and the hull front, thick side skirts, a remote machine gun on the roof, seven road wheels per side.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a very low, wide hull with an unmanned rounded turret in the centre, slat armour and reactive bricks over most of the hull, active-protection launcher tubes around the turret, a panoramic sight dome, armoured fuel tanks at the rear.

#### China

- **Setting of the card scene:** green farmland hills with terraced fields and a few tall poplars under a slightly hazy sky, on a rough yellow-brown dirt track.
- **Family look:** Family look (China, its own lines): a clean, smooth, boxy tracked hull with a long, sharply sloped front plate and small, evenly spaced road wheels, a modest rounded-arrowhead turret with a thin autocannon and a missile launcher on top, a pair of laser-warning sensors on the turret front. Paint: plain mid-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a modest, low rounded turret with a short gun and a single missile rail, a simple hull with plain track guards and six small road wheels per side, a snorkel tube and a spare fuel drum on the rear deck, no add-on armour.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a bigger, angular turret with an autocannon and a twin missile launcher box on its side, a wedge of applied armour on the turret front, side skirts made of rows of small plates, a roof machine gun, seven small road wheels per side.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a clean, low turret of smooth facets with flat integrated sensor panels, an unmanned remote weapon station, active-protection domes at the turret corners, a hull front of smooth sloped composite armour, full side skirts, a longer autocannon.

#### Europe

- **Setting of the card scene:** gentle temperate farmland with hedgerows, fields and a few tall poplar trees, a distant wooded ridge, on a gravel-and-earth farm track.
- **Family look:** Family look (Europe): a long, sleek, low and smoothly sloped tracked hull, a turret of sloping, rounded-faceted shapes with a slender autocannon, a small raised pod for the commander's panoramic sight, a clean low silhouette. Paint: dark grey-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a light, fast, compact design: a narrow hull with five road wheels per side, a small egg-shaped rounded turret with a thin autocannon, a plain commander's cupola, almost no add-on armour, bare track guards, a rear ramp.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a bigger, smoothly sloped turret with a stabilised autocannon and a missile launcher box on one side, side skirts, a raised panoramic sight pod, a hull with a sharply sloped front, six road wheels per side.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a tall, wide, unmanned turret of smooth faceted panels with a large autocannon and a small second weapon beside it, a slim sensor mast, modular armour blocks, active-protection sensors, full side skirts, a low sleek hull.

#### Export

- **Setting of the card scene:** a dry savanna with scattered flat-topped acacia trees, red-brown earth and tufts of dry grass, on a red-brown dirt road.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a small round or flat-topped turret on a boxy tracked hull, bolt-on kits and add-on parts that look like they were fitted by the buyer. Paint: faded ochre-sand with a few patches of darker touch-up paint.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a post-war pattern: a small round one-man turret with a short gun, a low boxy hull with six road wheels per side, an unditching beam across the rear deck, an open-top searchlight, a machine gun on the roof.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a widely exported 1970s-80s pattern: a larger two-man turret with an autocannon, a missile rail and a rangefinder box, bolt-on side skirts, a smoke-launcher pack, a few add-on armour plates on the turret front, a snorkel tube.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a modern export-grade design: a modular angular turret with an autocannon, bolt-on composite armour packages, a remote machine-gun station, a thermal sight box, an auxiliary power pack at the rear, side skirts, a clean but practical look made to be sold to many armies.

### Self-propelled howitzer (`art`): 45 prompts, built from these words

Class of picture: `gnd`. Files: `assets/art-src/ul-art-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-art-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single self-propelled howitzer, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front turned toward the lower right of the picture so that the viewer sees its front and one long side. The whole vehicle is centred left to right and top to bottom, and its full length (any gun barrel or boom included) spans about 85 percent of the picture's width; the entire vehicle, wheels or tracks included, is inside the frame with a margin all round. Only the self-propelled howitzer: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it.
- **Top-down frame:** A single self-propelled howitzer, seen exactly straight down from above (a true top-down plan view), its front pointing to the top of the picture. The whole vehicle is centred left to right and top to bottom, and its full length (any gun barrel or boom included) fills about 90 percent of the picture's height. Only the self-propelled howitzer: no crew, no other vehicle, no ground, no track marks, no shadow on the background.
- **Card scene:** "A single self-propelled howitzer standing in a firing position beside a dirt road, its gun raised at a high angle, a puff of smoke and dust at the muzzle brake. The setting: <the group's setting>. Seen from a low front three-quarter angle slightly above ground level, the vehicle fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one vehicle: no crew visible, no other vehicle, no people, no buildings, no signs. The self-propelled howitzer is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** a wide dry grassland valley with low rolling hills, a few sparse trees and scrub bushes, and a broad road of pale tan packed dirt.
- **Family look:** Family look (US/NATO): a tall, heavy, boxy, slab-sided armoured turret of flat plates on a wide tracked hull, a long barrel with a large muzzle brake, a hinged rear spade. Paint: matte sand-tan.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a simple boxy turret with a medium-length barrel, a large perforated muzzle brake and a fume extractor, a machine-gun ring on the turret roof, seven road wheels per side with bare track guards, stowage boxes on the rear.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a clearly newer, heavier design: a larger, wider angular turret with a long barrel, a rear bustle that holds ammunition, side skirts, a remote machine gun on the roof, a rear ammunition-loading door, a folded rear spade.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a near-future design: a low, angular, unmanned turret with a very long barrel with a thermal sleeve, an automatic loader bustle, flat faceted armour panels, flat sensor panels, an auxiliary power unit at the rear, full-length side skirts.

#### Eastern

- **Setting of the card scene:** a wide open steppe of pale green and golden grass with a line of birch trees and the edge of a dark pine forest in the distance, on a rutted brown dirt road.
- **Family look:** Family look (Eastern): a low, wide, rounded turret on a low tracked hull, a long barrel with a muzzle brake and a bulge-shaped fume extractor, a log and fuel drums on the rear deck, reactive-armour bricks that cover more in every generation. Paint: dark olive-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a small, low, round turret with a medium barrel and a muzzle brake, a low hull with six small road wheels per side, bare track guards, a rear spade, stacks of shell boxes and a log on the rear deck.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a larger, low rounded turret with a long barrel, a muzzle brake and a fume extractor, a thick turret front with rows of reactive bricks, side skirts, a remote machine gun on the roof, a rear spade, extra fuel drums.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a fully automated, very low, unmanned rounded turret with a long barrel and a thick armoured mantlet, reactive bricks along the hull front, slat armour, a sensor dome on the roof, a hinged rear spade.

#### China

- **Setting of the card scene:** green farmland hills with terraced fields and a few tall poplars under a slightly hazy sky, on a rough yellow-brown dirt track.
- **Family look:** Family look (China, its own lines): a broad, flat arrowhead-shaped turret on a smooth boxy tracked hull with a sharply sloped front plate and seven small road wheels, a long barrel with a double-baffle muzzle brake, a pair of laser-warning sensors. Paint: plain mid-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a modest arrowhead turret with a medium barrel and a muzzle brake, a plain hull with bare track guards, a rear spade, a spare fuel drum on the rear deck, no add-on armour.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a bigger angular turret with a long barrel, a boxy rear bustle, side skirts made of rows of small plates, a roof machine gun, a folded rear spade.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a low, smooth-faceted automated turret with a very long barrel, flat integrated sensor panels, a remote weapon station, an automatic loader bustle, full side skirts.

#### Europe

- **Setting of the card scene:** gentle temperate farmland with hedgerows, fields and a few tall poplar trees, a distant wooded ridge, on a gravel-and-earth farm track.
- **Family look:** Family look (Europe): a sleek, smoothly sloped turret on a long, low tracked hull, a long slender barrel with a muzzle brake, a clean low silhouette, a hinged rear spade. Paint: dark grey-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a light, compact design: a small rounded turret, a medium slender barrel with a muzzle brake, a narrow hull with six road wheels per side, bare track guards, a small stowage rack at the rear.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a large, smoothly sloped turret with a very long slender barrel, a long rounded rear bustle, side skirts, a raised thermal sight pod, seven road wheels per side.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: an unmanned turret of smooth faceted panels with a very long barrel, a slim sensor mast, a small remote machine gun, modular armour blocks, a low sleek hull with full skirts.

#### Export

- **Setting of the card scene:** a dry savanna with scattered flat-topped acacia trees, red-brown earth and tufts of dry grass, on a red-brown dirt road.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a round or boxy turret on a boxy tracked hull, bolt-on kits and add-on parts that look fitted by the buyer. Paint: faded ochre-sand with a few patches of darker touch-up paint.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a post-war pattern: a small round turret with a short barrel and a big muzzle brake, a low boxy hull with four large road wheels per side, an unditching beam across the rear deck, an open-top searchlight, a machine gun on the roof.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a widely exported 1970s-80s pattern: a larger boxy turret with a long barrel and a muzzle brake, bolt-on side skirts, a smoke-launcher pack, a rear spade, a few add-on armour plates on the turret front.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a modern export-grade design: a modular angular turret with a long barrel, a remote machine-gun station, a thermal sight box, bolt-on armour packages, an auxiliary power pack at the rear, side skirts, a practical look made to be sold to many armies.

### Mobile surface-to-air missile launcher vehicle (`sam`): 45 prompts, built from these words

Class of picture: `gnd`. Files: `assets/art-src/ul-sam-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-sam-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single mobile surface-to-air missile launcher vehicle, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front turned toward the lower right of the picture so that the viewer sees its front and one long side. The whole vehicle is centred left to right and top to bottom, and its full length (any gun barrel or boom included) spans about 85 percent of the picture's width; the entire vehicle, wheels or tracks included, is inside the frame with a margin all round. Only the mobile surface-to-air missile launcher vehicle: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it.
- **Top-down frame:** A single mobile surface-to-air missile launcher vehicle, seen exactly straight down from above (a true top-down plan view), its front pointing to the top of the picture. The whole vehicle is centred left to right and top to bottom, and its full length (any gun barrel or boom included) fills about 90 percent of the picture's height. Only the mobile surface-to-air missile launcher vehicle: no crew, no other vehicle, no ground, no track marks, no shadow on the background.
- **Card scene:** "A single mobile surface-to-air missile launcher vehicle parked beside a dirt road with its launcher raised, the missile canisters pointing up at the sky and its radar antenna turning. The setting: <the group's setting>. Seen from a low front three-quarter angle slightly above ground level, the vehicle fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one vehicle: no crew visible, no other vehicle, no people, no buildings, no signs. The mobile surface-to-air missile launcher vehicle is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** a wide dry grassland valley with low rolling hills, a few sparse trees and scrub bushes, and a broad road of pale tan packed dirt.
- **Family look:** Family look (US/NATO): a wide, heavy tracked carrier of flat armour plates, flat-sided angular box canisters on a pivoting launcher platform, a flat angular radar housing, matte finish. Paint: matte sand-tan.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a boxy tracked carrier with a pivoting rack of three box canisters, a small boxy radar antenna on a short mast beside the cab, bare track guards, a few stowage boxes.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a clearly newer, heavier design: a tracked carrier with a rack of four armoured canisters on a pivoting platform and a flat phased-array radar panel at the back of the platform, a roof sensor box, side skirts.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a near-future design: an angular, faceted launcher housing with eight canisters in two flat rows, radar panels built into its sides, a slim sensor mast, a low hull with full skirts.

#### Eastern

- **Setting of the card scene:** a wide open steppe of pale green and golden grass with a line of birch trees and the edge of a dark pine forest in the distance, on a rutted brown dirt road.
- **Family look:** Family look (Eastern): a big eight-wheeled heavy truck chassis with a boxy cab, tall cylindrical missile canisters on a tilting rack, a round dish or flat panel radar on a raised mast, outrigger jacks at the corners. Paint: dark olive-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: four tall missile tubes on a tilting rail launcher on the truck bed, a round dish radar on a short mast behind the cab, outrigger jacks, a plain boxy cab.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a clearly newer design: four large cylindrical canisters in a tilted rack, a flat phased-array radar panel on a folding mast behind the cab, a larger cab with a sloped front, outrigger jacks, a small antenna on the roof.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a near-future design: two rows of four canisters in a long sloped launch rack, an angular faceted cab, flat radar panels on a mast and on the cab sides, slim antennas, a clean low-signature look.

#### China

- **Setting of the card scene:** green farmland hills with terraced fields and a few tall poplars under a slightly hazy sky, on a rough yellow-brown dirt track.
- **Family look:** Family look (China, its own lines): a six-wheeled heavy truck chassis with a sharply angular, boxy cab, a broad flat launcher box with sloped panels, a flat rectangular phased-array radar, outrigger jacks. Paint: plain mid-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a modest design: a launcher box with four rectangular missile canisters on a tilting rail, a small round radar dish on a short mast, outrigger jacks, a plain boxy cab.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a clearly newer design: a larger launcher with six large canisters in two rows, a flat phased-array radar panel on a raised mast behind the cab, a sloped angular cab, outrigger jacks.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a near-future design: a smooth faceted launcher box with eight canisters under flat covers, flat radar panels built into its sides, slim antennas, a smooth low cab, full side panels.

#### Europe

- **Setting of the card scene:** gentle temperate farmland with hedgerows, fields and a few tall poplar trees, a distant wooded ridge, on a gravel-and-earth farm track.
- **Family look:** Family look (Europe): a sleek, wheeled eight-by-eight chassis with a low, smoothly sloped cab, a compact launcher with round-topped canisters, a slim raised radar on a mast, a clean low silhouette. Paint: dark grey-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a light, compact design: a small wheeled carrier with two box canisters on a swivelling mount, a small round radar dish on top of the cab, a plain cab, short outrigger jacks.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a clearly newer design: a larger wheeled carrier with a vertical launcher of four tall canisters, a rotating flat radar panel on a mast, a sloped cab, outrigger jacks.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a near-future design: a long carrier with a vertical launcher block of eight canisters, a smooth faceted radar mast with flat panels, a low sleek cab, a small sensor pod on the roof.

#### Export

- **Setting of the card scene:** a dry savanna with scattered flat-topped acacia trees, red-brown earth and tufts of dry grass, on a red-brown dirt road.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, an older box-frame launcher on a plain truck or trailer chassis, bolt-on kits that look fitted by the buyer. Paint: faded ochre-sand with a few patches of darker touch-up paint.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a post-war pattern: a rail launcher with two big missiles on a plain truck bed, a small dish radar on a short mast, a plain boxy cab, outrigger jacks, spare wheels on the side.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a widely exported 1970s-80s pattern: a rack of four boxy canisters on a tilting launcher, a round dish radar on a mast, bolt-on side boxes, a smoke-launcher pack on the cab, a plain truck cab.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a modern export-grade design: a modular launcher with six canisters, a flat panel radar on a short mast, a new sloped cab with bolt-on armour, an auxiliary power pack at the rear, a practical look made to be sold to many armies.

### Multiple rocket launcher vehicle (`mlrs`): 45 prompts, built from these words

Class of picture: `gnd`. Files: `assets/art-src/ul-mlrs-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-mlrs-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single multiple rocket launcher vehicle, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front turned toward the lower right of the picture so that the viewer sees its front and one long side. The whole vehicle is centred left to right and top to bottom, and its full length (any gun barrel or boom included) spans about 85 percent of the picture's width; the entire vehicle, wheels or tracks included, is inside the frame with a margin all round. Only the multiple rocket launcher vehicle: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it.
- **Top-down frame:** A single multiple rocket launcher vehicle, seen exactly straight down from above (a true top-down plan view), its front pointing to the top of the picture. The whole vehicle is centred left to right and top to bottom, and its full length (any gun barrel or boom included) fills about 90 percent of the picture's height. Only the multiple rocket launcher vehicle: no crew, no other vehicle, no ground, no track marks, no shadow on the background.
- **Card scene:** "A single multiple rocket launcher vehicle standing in a firing position beside a dirt road, rockets leaving its launcher in a bright plume of smoke and fire, dust blown from the ground. The setting: <the group's setting>. Seen from a low front three-quarter angle slightly above ground level, the vehicle fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one vehicle: no crew visible, no other vehicle, no people, no buildings, no signs. The multiple rocket launcher vehicle is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** a wide dry grassland valley with low rolling hills, a few sparse trees and scrub bushes, and a broad road of pale tan packed dirt.
- **Family look:** Family look (US/NATO): a tracked carrier of flat armour plates with a large boxy armoured cab at the front and a rear launcher box holding a block of rockets in square pods, matte finish. Paint: matte sand-tan.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a tracked carrier with a small flat cab, a rear launcher box with six rocket tubes in two rows of three, bare track guards, six road wheels per side, stowage boxes on the sides.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a clearly newer, heavier design: a bigger angular cab with a flat armoured windscreen shield, a launcher box with two enclosed square rocket pods, a roof sight box, side skirts, seven road wheels per side.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a near-future design: a low, angular, stealthy cab with flat panels, an automated launcher with two enclosed pods of more rockets under flat faceted covers, flat sensor panels, full skirts.

#### Eastern

- **Setting of the card scene:** a wide open steppe of pale green and golden grass with a line of birch trees and the edge of a dark pine forest in the distance, on a rutted brown dirt road.
- **Family look:** Family look (Eastern): a big heavy wheeled truck chassis with a boxy cab with armoured shutters, a rear launcher frame with a block of long open tubes, outrigger jacks at the rear, a spare wheel under the frame. Paint: dark olive-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a six-wheeled truck with a launcher frame of forty short tubes in four rows, a plain cab, rear outrigger jacks, a spare wheel, a stowage box on the side.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a clearly newer design: an eight-wheeled truck with a launcher frame of twelve large tubes in three rows, an armoured cab with shutters, rear outrigger jacks, a roof machine gun.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a near-future design: an eight-wheeled truck with an automated launcher of sixteen tubes in an enclosed, faceted frame, an angular low-signature cab, a small sensor on the roof, outrigger jacks.

#### China

- **Setting of the card scene:** green farmland hills with terraced fields and a few tall poplars under a slightly hazy sky, on a rough yellow-brown dirt track.
- **Family look:** Family look (China, its own lines): a wheeled heavy truck chassis with a sharply angular, boxy cab, a broad rear launcher with a large rectangular block of tubes in a sloped box, outrigger jacks, smooth panels. Paint: plain mid-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a modest design: a six-wheeled truck with a launcher block of twenty small tubes in two rows, a plain boxy cab, outrigger jacks at the rear.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a clearly newer design: an eight-wheeled truck with two large enclosed square pods of tubes, a sloped angular cab with armoured shutters, a laser-warning pair on the roof, outrigger jacks.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a near-future design: an eight-wheeled truck with a smooth faceted launcher with two enclosed pods, a low angular cab with flat panels, a sensor dome on the roof, full side panels.

#### Europe

- **Setting of the card scene:** gentle temperate farmland with hedgerows, fields and a few tall poplar trees, a distant wooded ridge, on a gravel-and-earth farm track.
- **Family look:** Family look (Europe): a sleek tracked carrier with a low, smoothly sloped armoured cab, a rear launcher pod block of rounded-square pods, a clean low silhouette. Paint: dark grey-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a light, compact design: a narrow tracked carrier with a small cab and a rear launcher box of twelve tubes in two rows, bare track guards, six road wheels per side.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a clearly newer design: a larger carrier with a smoothly sloped cab and two enclosed rounded-square pods on a rear launcher, side skirts, a roof sight pod.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a near-future design: a long, low carrier with a faceted cab and an automated launcher with two enclosed pods, a slim sensor mast, modular armour blocks, full skirts.

#### Export

- **Setting of the card scene:** a dry savanna with scattered flat-topped acacia trees, red-brown earth and tufts of dry grass, on a red-brown dirt road.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a plain truck chassis with a bolt-on launcher frame, additional boxes and kits that look fitted by the buyer. Paint: faded ochre-sand with a few patches of darker touch-up paint.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a post-war pattern: a six-wheeled truck with a launcher frame of sixteen short tubes in four rows, a plain open-top cab with a canvas roof, rear outrigger jacks, a spare wheel.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a widely exported 1970s-80s pattern: a six-wheeled truck with a launcher frame of forty tubes in four rows, an armoured cab with shutters, bolt-on side boxes, rear outrigger jacks.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a modern export-grade design: an eight-wheeled truck with a modular launcher of two enclosed pods, a new sloped cab with bolt-on armour, an auxiliary power pack, a practical look made to be sold to many armies.

### Motorized infantry rifleman (`inf`): 45 prompts, built from these words

Class of picture: `man`. Files: `assets/art-src/ul-inf-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-inf-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single motorized infantry rifleman, seen from a front three-quarter side view from slightly above (about 30 degrees down), standing in a ready pose with the weapon held ready, turned toward the lower right of the picture so that the viewer sees the front and one side. The whole soldier, from the boots to the top of the helmet and the weapon, is centred left to right and top to bottom and fills about 85 percent of the picture's height; the entire figure is inside the frame with a margin all round. Only this one motorized infantry rifleman: no other person, no vehicle, no ground, only a faint, tight soft shadow under the boots.
- **Top-down frame:** A single motorized infantry rifleman, seen exactly straight down from above (a true top-down plan view), facing the top of the picture, the weapon held ready in front. The whole soldier (head, shoulders, arms, pack and weapon) is centred left to right and top to bottom and fills about 85 percent of the picture's height. Only this one motorized infantry rifleman: no other person, no vehicle, no ground, no shadow on the background.
- **Card scene:** "A single motorized infantry rifleman walking along a dirt road with his rifle held ready, a light trail of dust at his boots. The setting: <the group's setting>. Seen from a low front three-quarter angle at about eye height, the soldier fills about half the picture's height and stands in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one soldier: no other person, no vehicle, no buildings, no signs, no markings. The motorized infantry rifleman is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** a wide dry grassland valley with low rolling hills, a few sparse trees and scrub bushes, and a broad road of pale tan packed dirt.
- **Family look:** Family look (US/NATO): a stocky, heavily equipped rifleman in a rounded combat helmet and a tactical plate-carrier vest covered in pouches, knee pads, a big pack, a rifle with a short barrel and a sling. Paint: a tan-and-brown multi-terrain camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, Cold War era kit: a rounded steel-style helmet with a cloth cover, a simple webbing harness with ammunition pouches and two canteens, a plain long rifle with a straight stock, a canvas backpack, plain boots.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer kit: new modular kit: a visored helmet with a night-vision mount, a plate-carrier vest with modular pouches, a compact rifle with a sight and a short barrel, knee and elbow pads, a modern pack.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future kit: light powered exoskeleton frames strapped to the legs and back, a sealed helmet with a built-in display visor, a smooth faceted armour vest, a compact rifle with an integrated sight, a small power pack on the back.

#### Eastern

- **Setting of the card scene:** a wide open steppe of pale green and golden grass with a line of birch trees and the edge of a dark pine forest in the distance, on a rutted brown dirt road.
- **Family look:** Family look (Eastern): a lean rifleman in a rounded helmet with a cloth cover, a chest rig of flat ammunition pouches, a long coat-like smock, a rifle with a curved magazine, a rolled blanket across the shoulder. Paint: olive-green and brown blotch camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, Cold War era kit: a rounded steel helmet with a cloth cover, a leather-look belt harness with ammunition pouches, a long rifle with a curved magazine and a folding stock, a small canvas pack, tall boots.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer kit: new modular kit: a helmet with a clear visor and a rail mount, a chest rig with modular pouches, body armour plates, a compact rifle with a sight and a suppressor, knee pads, a modern pack.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future kit: light powered exoskeleton frames on the legs and back, a sealed helmet with a built-in display visor, a smooth faceted armour vest, a compact rifle with an integrated sight, a small power pack on the back.

#### China

- **Setting of the card scene:** green farmland hills with terraced fields and a few tall poplars under a slightly hazy sky, on a rough yellow-brown dirt track.
- **Family look:** Family look (China, its own lines): a slim, upright rifleman in a clean tidy uniform, a rounded helmet with a net cover, a neat chest rig with squared pouches, a rifle with a short barrel, a compact backpack. Paint: green-and-brown digital camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, Cold War era kit: a plain rounded helmet, a simple canvas belt with squared pouches, a long rifle with a curved magazine, a small green canvas bag, soft canvas boots.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer kit: new modular kit: a helmet with a visor and a camera mount, a neat chest rig with squared pouches, light body armour, a compact rifle with a sight, knee pads, a compact pack.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future kit: light powered exoskeleton frames on the legs and back, a sealed helmet with a built-in display visor, a smooth faceted armour vest, a compact rifle with an integrated sight, a small power pack on the back.

#### Europe

- **Setting of the card scene:** gentle temperate farmland with hedgerows, fields and a few tall poplar trees, a distant wooded ridge, on a gravel-and-earth farm track.
- **Family look:** Family look (Europe): a practical, slim rifleman with a rounded modern helmet, a plate-carrier vest with tidy pouches, a compact rifle held close, ear protection, a medium pack. Paint: a grey-green and brown splinter camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, Cold War era kit: a rounded steel-style helmet, a simple webbing harness with ammunition pouches, a plain rifle with a plastic-look stock and a bipod, a canvas pack, boots with gaiters.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer kit: new modular kit: a helmet with a visor and ear defenders, a plate-carrier vest with tidy modular pouches, a compact rifle with a sight, knee and elbow pads, a medium pack.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future kit: light powered exoskeleton frames on the legs and back, a sealed helmet with a built-in display visor, a smooth faceted armour vest, a compact rifle with an integrated sight, a small power pack on the back.

#### Export

- **Setting of the card scene:** a dry savanna with scattered flat-topped acacia trees, red-brown earth and tufts of dry grass, on a red-brown dirt road.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, practical rifleman with mixed, worn kit, a rounded helmet, a simple vest, an older rifle, a scarf at the neck, a faded canvas pack. Paint: a faded khaki and olive desert camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, post-war kit: a rounded steel helmet with a cloth cover, a canvas belt with pouches, a plain long rifle with a wooden-look stock, a faded canvas pack, worn boots.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer kit: widely exported 1980s kit: a helmet with a net cover, a chest rig of flat pouches, a rifle with a curved magazine and a folding stock, a water bottle and a bigger pack, a scarf.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future kit: modern export kit: a helmet with a rail and a visor, a plate-carrier vest with bolt-on pouches, a compact rifle with a sight, knee pads, a practical, mixed look made to be sold to many armies.

### Frigate (a small warship) (`frig`): 45 prompts, built from these words

Class of picture: `ship`. Files: `assets/art-src/ul-frig-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-frig-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single frigate (a small warship), seen from a front three-quarter side view from slightly above (about 30 degrees down), its bow turned toward the lower right of the picture so that the viewer sees its bow and one long side, drawn as a studio model sitting on the plain grey background with its whole hull down to the waterline visible: no water, no waves, no wake. The whole ship is centred left to right and top to bottom, and its full length spans about 85 percent of the picture's width; everything, masts and bow included, is inside the frame with a margin all round. Only the frigate (a small warship): no crew visible, no other ship, no aircraft, no ground, only a faint, tight soft shadow under the hull.
- **Top-down frame:** A single frigate (a small warship), seen exactly straight down from above (a true top-down plan view), its bow pointing to the top of the picture, the whole hull down to the waterline visible: no water, no waves, no wake. The whole ship is centred left to right and top to bottom, and its full length fills about 90 percent of the picture's height. Only the frigate (a small warship): no crew visible, no other ship, no aircraft, no shadow on the background.
- **Card scene:** "A single frigate (a small warship) steaming at moderate speed, a white bow wave at its stem and a long white wake behind it. The setting: <the group's setting>. Seen from a low front three-quarter angle just above the water, the ship fills about 70 percent of the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one ship: no crew visible, no other ship, no aircraft, no land close by, no signs, no markings. The frigate (a small warship) is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** open blue ocean under a clear sky with a few high clouds, a long gentle swell.
- **Family look:** Family look (US/NATO): a clean, flat-sided hull with a sharply raked bow, a boxy angular superstructure with flat plates, a single main gun forward, a helicopter deck at the stern. Paint: haze grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a long, low hull with a tall boxy superstructure, a single gun turret on the bow, a tall lattice mast with a rotating radar dish, a box missile launcher on the deck behind the gun, one tall funnel, a small helicopter pad at the stern.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design with a new hull and a clean, angular superstructure: a clearly newer design: a more angular hull with a flush deck, a smooth boxy superstructure with flat panel radars, a vertical launch block forward, a medium gun on the bow, a hangar with a helicopter deck at the stern, a funnel faired into the superstructure.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a stealth hull with an integrated mast: a near-future design: a stealthy angular hull, a smooth faceted superstructure with an integrated mast, a vertical launch block, a small gun in a faceted turret, a large helicopter hangar, no funnel, small unmanned boats on the stern.

#### Eastern

- **Setting of the card scene:** a cold grey-green northern sea under a low, overcast sky, a long swell and a distant misty horizon.
- **Family look:** Family look (Eastern): a robust hull with a high flared bow, a tall, heavily armed superstructure with many launchers and guns packed on deck, a tall mast, a big helicopter deck at the stern. Paint: mid grey with a darker grey deck.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a long hull with a high bow, a tall block superstructure with two funnels, two twin gun turrets, a rocket launcher on the foredeck, a mast with a round radar, a helicopter pad at the stern.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design with a new hull and a clean, angular superstructure: a clearly newer design: a smooth angular hull with a long forecastle, an armoured box superstructure with a mast, vertical launch cells at the bow, a single gun on the bow, a hangar with a deck at the stern, fewer exposed fittings.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a stealth hull with an integrated mast: a near-future design: a stealthy angular hull, a tall integrated mast tower with flat radar panels, vertical launch cells, a small faceted gun turret, a large hangar, no funnel.

#### China

- **Setting of the card scene:** a hazy blue-green coastal sea with a faint distant coastline of low hills on the horizon under a pale, slightly hazy sky.
- **Family look:** Family look (China, its own lines): a long, low hull with a sharply raked clipper bow, a sleek, angular superstructure with neat rounded edges and flat radar panels, a large hangar and a flat helicopter deck. Paint: light blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a modest design: a long hull with a tall boxy superstructure, a twin gun turret forward and another aft, a tall mast with a round radar, two small funnels, a helicopter pad.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design with a new hull and a clean, angular superstructure: a clearly newer design: a smooth hull with a clean angular superstructure, flat phased-array radar panels, a vertical launch block forward, a single gun, a large hangar with a deck at the stern, a funnel faired in.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a stealth hull with an integrated mast: a near-future design: a stealth hull with a smooth faceted superstructure, a tall integrated mast with flat panels, vertical launch cells, a faceted gun turret, a large hangar, no funnel.

#### Europe

- **Setting of the card scene:** a deep blue-green Atlantic sea with white-capped waves and tall cumulus clouds in a bright sky.
- **Family look:** Family look (Europe): a sleek, graceful hull with a clean rounded superstructure of sloping sides, a single tall integrated mast, a rounded gun turret, a large helicopter hangar at the stern. Paint: medium blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a long, narrow hull with a tall superstructure, a single rounded gun turret on the bow, a tall mast with a radar dish, one funnel, a small helicopter pad at the stern.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design with a new hull and a clean, angular superstructure: a clearly newer design: a smooth hull with a sloped superstructure with flat radar panels, a vertical launch block, a rounded gun on the bow, a hangar with a deck at the stern, a funnel faired in.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a stealth hull with an integrated mast: a near-future design: a stealth hull with a smooth superstructure with an integrated mast, a vertical launch block, a small faceted gun, a large hangar and mission bay at the stern, no funnel.

#### Export

- **Setting of the card scene:** a calm turquoise tropical sea with a low distant island on the horizon and a few small white clouds in a hot clear sky.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a simpler superstructure with bolt-on launchers and guns that look fitted by the buyer. Paint: pale grey with a few rust-streaked patches.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a post-war pattern: a long, low hull with a plain superstructure, two gun turrets, a small mast with a radar dish, one funnel, a depth-charge rack at the stern.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design with a new hull and a clean, angular superstructure: a widely exported 1970s-80s pattern: a hull with a taller superstructure, a medium gun on the bow, a box missile launcher, a radar mast, a small helicopter pad, bolt-on boxes.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a stealth hull with an integrated mast: a modern export-grade design: a clean modular hull with a plain angular superstructure, a vertical launch block, a medium gun, a hangar with a helicopter deck, a practical look made to be sold to many navies.

### Cruiser (a large warship) (`crui`): 45 prompts, built from these words

Class of picture: `ship`. Files: `assets/art-src/ul-crui-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-crui-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single cruiser (a large warship), seen from a front three-quarter side view from slightly above (about 30 degrees down), its bow turned toward the lower right of the picture so that the viewer sees its bow and one long side, drawn as a studio model sitting on the plain grey background with its whole hull down to the waterline visible: no water, no waves, no wake. The whole ship is centred left to right and top to bottom, and its full length spans about 85 percent of the picture's width; everything, masts and bow included, is inside the frame with a margin all round. Only the cruiser (a large warship): no crew visible, no other ship, no aircraft, no ground, only a faint, tight soft shadow under the hull.
- **Top-down frame:** A single cruiser (a large warship), seen exactly straight down from above (a true top-down plan view), its bow pointing to the top of the picture, the whole hull down to the waterline visible: no water, no waves, no wake. The whole ship is centred left to right and top to bottom, and its full length fills about 90 percent of the picture's height. Only the cruiser (a large warship): no crew visible, no other ship, no aircraft, no shadow on the background.
- **Card scene:** "A single cruiser (a large warship) steaming at moderate speed, a white bow wave at its stem and a long white wake behind it. The setting: <the group's setting>. Seen from a low front three-quarter angle just above the water, the ship fills about 70 percent of the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one ship: no crew visible, no other ship, no aircraft, no land close by, no signs, no markings. The cruiser (a large warship) is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** open blue ocean under a clear sky with a few high clouds, a long gentle swell.
- **Family look:** Family look (US/NATO): a big, long, flat-sided hull with a high bow, a massive boxy angular superstructure of flat plates, two main guns, many missile cells, a helicopter deck at the stern. Paint: haze grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a long hull with a tall boxy superstructure, a gun turret on the bow and another aft, a double-arm missile launcher forward, two tall funnels, a tall lattice mast with a big rotating radar, a helicopter pad.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer, larger design with an angular hull: a clearly newer, larger design: a long angular hull, a broad superstructure with flat radar panels on all four sides, vertical launch blocks forward and aft, a gun on the bow, two small funnels, a helicopter deck and hangars.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a stealth hull with flat radar faces built into the superstructure: a near-future design: a big angular wave-piercing hull, a large smooth faceted deckhouse with integrated flat radar panels and mast, two large gun turrets in faceted housings, vertical launch cells along both sides, no funnels.

#### Eastern

- **Setting of the card scene:** a cold grey-green northern sea under a low, overcast sky, a long swell and a distant misty horizon.
- **Family look:** Family look (Eastern): a large, heavily armed hull with a high flared bow, a tall superstructure crowded with launchers, guns and radars, a tall mast and a big helicopter deck. Paint: mid grey with a darker grey deck.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a long hull with a high bow, a tall block superstructure with two funnels, two twin gun turrets, missile launcher tubes along the deck sides, a tall mast with several radars, a helicopter pad.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer, larger design with an angular hull: a clearly newer, larger design: a huge hull with a long forecastle, a tall superstructure with a mast, big missile launch tubes in rows along the deck, a gun on the bow, two small funnels, a helicopter hangar.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a stealth hull with flat radar faces built into the superstructure: a near-future design: a stealthy angular hull, a tall integrated mast tower with flat radar panels, vertical launch cells packed along the deck, a faceted gun turret, a large hangar, no funnels.

#### China

- **Setting of the card scene:** a hazy blue-green coastal sea with a faint distant coastline of low hills on the horizon under a pale, slightly hazy sky.
- **Family look:** Family look (China, its own lines): a long, sleek, large hull with a raked clipper bow, a smooth angular superstructure with neat edges and flat radar panels, a large hangar and helicopter deck. Paint: light blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a modest design: a long hull with a tall boxy superstructure, twin gun turrets forward and aft, missile launcher boxes on the deck, a tall mast with a round radar, two funnels, a helicopter pad.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer, larger design with an angular hull: a clearly newer, larger design: a smooth hull with a large angular superstructure with flat radar panels, vertical launch blocks forward and aft, a single gun on the bow, a hangar and a helicopter deck, a funnel faired in.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a stealth hull with flat radar faces built into the superstructure: a near-future design: a big stealth hull with a large smooth faceted superstructure, flat radar faces built into it, vertical launch cells forward and aft, a faceted gun turret, a large hangar, no funnels.

#### Europe

- **Setting of the card scene:** a deep blue-green Atlantic sea with white-capped waves and tall cumulus clouds in a bright sky.
- **Family look:** Family look (Europe): a sleek, graceful, large hull with clean sloped sides, a rounded superstructure, a single tall integrated mast with a big radar, a rounded gun turret, a large hangar. Paint: medium blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a long hull with a tall superstructure, a twin missile launcher forward, a rounded gun turret, two funnels, a lattice mast with a big radar dish, a helicopter pad.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer, larger design with an angular hull: a clearly newer, larger design: a smooth hull with a sloped superstructure and flat panel radars, vertical launch blocks forward, a rounded gun on the bow, a funnel faired in, a hangar and helicopter deck.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a stealth hull with flat radar faces built into the superstructure: a near-future design: a stealth hull with a smooth sloped superstructure and a large integrated mast with flat radar panels, vertical launch cells, a small faceted gun, a large hangar, no funnel.

#### Export

- **Setting of the card scene:** a calm turquoise tropical sea with a low distant island on the horizon and a few small white clouds in a hot clear sky.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a large hull with a simpler superstructure and bolt-on launchers and guns that look fitted by the buyer. Paint: pale grey with a few rust-streaked patches.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a post-war pattern: a long hull with a plain tall superstructure, two twin gun turrets, torpedo tubes amidships, two funnels, a small mast with a radar dish.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer, larger design with an angular hull: a widely exported 1970s-80s pattern: a hull with a taller superstructure, a twin gun on the bow, box missile launchers, a radar mast, a helicopter pad, bolt-on boxes.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a stealth hull with flat radar faces built into the superstructure: a modern export-grade design: a large modular hull with a plain angular superstructure, vertical launch blocks, a medium gun, a hangar with a helicopter deck, a practical look made to be sold to many navies.

### Attack submarine (`sub`): 45 prompts, built from these words

Class of picture: `sub`. Files: `assets/art-src/ul-sub-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-sub-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single attack submarine, seen from a front three-quarter side view from slightly above (about 30 degrees down), its bow turned toward the lower right of the picture so that the viewer sees its bow and one long side, drawn as a studio model sitting on the plain grey background with its whole hull visible: no water, no waves, no wake. The whole submarine is centred left to right and top to bottom, and its full length spans about 85 percent of the picture's width; everything is inside the frame with a margin all round. Only the attack submarine: no crew visible, no other ship, no ground, only a faint, tight soft shadow under it.
- **Top-down frame:** A single attack submarine, seen exactly straight down from above (a true top-down plan view), its bow pointing to the top of the picture, the whole hull visible: no water, no waves, no wake. The whole submarine is centred left to right and top to bottom, and its full length fills about 90 percent of the picture's height. Only the attack submarine: no crew visible, no other ship, no shadow on the background.
- **Card scene:** "A single attack submarine running on the surface at moderate speed, a white bow wave at its bow and a churned white wake behind it, the sail rising from the middle of the hull. The setting: <the group's setting>. Seen from a low front three-quarter angle just above the water, the submarine runs on the surface and fills about 70 percent of the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one submarine: no crew visible, no other ship, no aircraft, no land close by, no signs, no markings. The attack submarine is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** open blue ocean under a clear sky with a few high clouds, a long gentle swell.
- **Family look:** Family look (US/NATO): a big, smooth, black teardrop hull with a rounded bow, a tall rectangular sail with flat plane fins on its sides, a cruciform tail with a single large propeller. Paint: matte black.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a rounded cigar-shaped hull, a medium sail with diving planes on its sides, a cruciform tail, a flat deck casing with small hatches.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design with a new hull and an X-shaped tail: a clearly newer design: a larger hull with an X-shaped tail, a taller sail with a flat top, a bow dome, a smooth rubber-coated look, a flush deck.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a longer, smoother hull with a pump-jet: a near-future design: a longer, smoother hull with a streamlined faired sail, an X-shaped tail, a shrouded pump-jet at the stern, a flush deck with a small mast fairing.

#### Eastern

- **Setting of the card scene:** a cold grey-green northern sea under a low, overcast sky, a long swell and a distant misty horizon.
- **Family look:** Family look (Eastern): a thick, blunt, very rounded hull with a large rounded sail and a long deck casing, a tall fin on the back of the sail, a cruciform tail, a heavy built look. Paint: dark grey-black.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a stubby rounded hull with a tall blocky sail with the diving planes on the sail, a long raised deck casing along the back, a cruciform tail.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design with a new hull and an X-shaped tail: a clearly newer design: a longer, thicker hull with an X-shaped tail, a bigger rounded sail with a tall fin, a rounded bow, a smooth coated look, a flush deck.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a longer, smoother hull with a pump-jet: a near-future design: a long, smooth hull with a streamlined sail, an X-shaped tail, a shrouded pump-jet, a few small hatches in the deck, a flush look.

#### China

- **Setting of the card scene:** a hazy blue-green coastal sea with a faint distant coastline of low hills on the horizon under a pale, slightly hazy sky.
- **Family look:** Family look (China, its own lines): a long, slender, smooth hull with a pointed rounded bow, a low rounded sail, a clean uncluttered deck, a cruciform tail. Paint: dark blue-black.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a modest design: a slim cigar-shaped hull with a small low sail, diving planes on the bow, a cruciform tail, a flat deck casing with a few hatches.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design with a new hull and an X-shaped tail: a clearly newer design: a longer hull with an X-shaped tail, a streamlined sail with rounded top, a smooth coated look, a small bow dome.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a longer, smoother hull with a pump-jet: a near-future design: a longer, smoother hull with a faired sail, an X-shaped tail, a shrouded pump-jet, a flush deck with no visible hatches.

#### Europe

- **Setting of the card scene:** a deep blue-green Atlantic sea with white-capped waves and tall cumulus clouds in a bright sky.
- **Family look:** Family look (Europe): a sleek, rounded hull with a small streamlined sail, an X-shaped or cruciform tail, a clean flush deck, a polished modern look. Paint: dark slate grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a short, rounded hull with a small sail with planes, a cruciform tail, a simple flat deck casing.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design with a new hull and an X-shaped tail: a clearly newer design: a longer hull with an X-shaped tail, a streamlined sail, a flush deck, a smooth coated look, a bow dome.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a longer, smoother hull with a pump-jet: a near-future design: a long, smooth hull with a small faired sail, an X-shaped tail, a shrouded pump-jet, a flush deck with a small mast fairing.

#### Export

- **Setting of the card scene:** a calm turquoise tropical sea with a low distant island on the horizon and a few small white clouds in a hot clear sky.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, an older teardrop hull, a simple sail, visible deck hatches and bolt-on fittings. Paint: dull dark grey-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a post-war pattern: a slim cigar hull with a tall plain sail, diving planes on the sail, a raised deck casing, a cruciform tail, small hatches and a deck gun mount without a gun.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design with a new hull and an X-shaped tail: a widely exported 1980s pattern: a rounder hull with a medium sail, a cruciform tail, flush deck hatches, a bow dome, a plain finish.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a longer, smoother hull with a pump-jet: a modern export-grade design: a modular hull with an X-shaped tail, a faired sail, a flush deck, a practical look made to be sold to many navies.

### Aircraft carrier (`carr`): 45 prompts, built from these words

Class of picture: `ship`. Files: `assets/art-src/ul-carr-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-carr-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single aircraft carrier, seen from a front three-quarter side view from slightly above (about 30 degrees down), its bow turned toward the lower right of the picture so that the viewer sees its bow and one long side, drawn as a studio model sitting on the plain grey background with its whole hull down to the waterline visible: no water, no waves, no wake. The whole ship is centred left to right and top to bottom, and its full length spans about 85 percent of the picture's width; everything, masts and bow included, is inside the frame with a margin all round. Only the aircraft carrier: no crew visible, no other ship, no aircraft, no ground, only a faint, tight soft shadow under the hull. The ship is a full-size aircraft carrier: the flight deck, its angled landing runway markings left blank (no painted lines or numbers) and the island are all visible.
- **Top-down frame:** A single aircraft carrier, seen exactly straight down from above (a true top-down plan view), its bow pointing to the top of the picture, the whole hull down to the waterline visible: no water, no waves, no wake. The whole ship is centred left to right and top to bottom, and its full length fills about 90 percent of the picture's height. Only the aircraft carrier: no crew visible, no other ship, no aircraft, no shadow on the background. The ship is a full-size aircraft carrier: the flight deck, its angled landing runway markings left blank (no painted lines or numbers) and the island are all visible.
- **Card scene:** "A single aircraft carrier steaming at moderate speed, a big white bow wave and a long white wake behind it, a few small parked aircraft on the flight deck. The setting: <the group's setting>. Seen from a low front three-quarter angle just above the water, the ship fills about 70 percent of the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one ship: no crew visible, no other ship, no aircraft, no land close by, no signs, no markings. The aircraft carrier is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** open blue ocean under a clear sky with a few high clouds, a long gentle swell.
- **Family look:** Family look (US/NATO): a huge, flat-topped hull with a long angled flight deck, a small tower-like island on the right side of the deck, big elevators at the edges, a clean flat deck with parked aircraft in neat rows. Paint: haze grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a large flat-top hull with an angled flight deck, a tall blocky island with a big radar antenna and a funnel on the right side, deck-edge elevators, parked aircraft in rows.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design with a new island and an angled deck: a clearly newer, larger design: a bigger hull with a long angled flight deck, a new smaller island set farther back, a clean deck with deck-edge elevators, catapults at the bow, parked aircraft in rows.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a small integrated island and drones on deck: a near-future design: a smooth hull with a small integrated island set far back on the deck, a long clean angled flight deck, flat electromagnetic catapult tracks, small unmanned drones parked on the deck.

#### Eastern

- **Setting of the card scene:** a cold grey-green northern sea under a low, overcast sky, a long swell and a distant misty horizon.
- **Family look:** Family look (Eastern): a heavy, thick hull with a ski-jump ramp at the bow, a tall island on the right side crowded with radars, large launcher tubes under the angled deck edge, parked aircraft near the island. Paint: mid grey with a darker grey deck.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a hull with a ski-jump ramp at the bow, a short angled deck, a tall boxy island with a huge radar array and two funnels, missile launcher tubes on the forward deck, parked aircraft.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design with a new island and an angled deck: a clearly newer, larger design: a longer hull with a ski-jump bow, a long angled deck, a new compact island with flat panel radars, deck-edge elevators, rows of parked aircraft.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a small integrated island and drones on deck: a near-future design: a smooth hull with a small streamlined island, a long clean angled flight deck, catapult tracks, small unmanned drones parked on the deck, no funnel.

#### China

- **Setting of the card scene:** a hazy blue-green coastal sea with a faint distant coastline of low hills on the horizon under a pale, slightly hazy sky.
- **Family look:** Family look (China, its own lines): a long, clean hull with a rising ski-jump ramp at the bow, a modest island on the right side with flat radar panels, an angled deck, neat rows of parked aircraft. Paint: light blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a modest design: a hull with a ski-jump ramp, a short angled deck, a boxy island with a round radar and a funnel, parked aircraft in a row.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design with a new island and an angled deck: a clearly newer design: a larger hull with a long angled flight deck, a new compact island with flat phased-array radar panels, deck-edge elevators, catapult tracks, parked aircraft in rows.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a small integrated island and drones on deck: a near-future design: a smooth hull with a small integrated island, a long clean angled flight deck with flat catapult tracks, small unmanned drones parked on the deck.

#### Europe

- **Setting of the card scene:** a deep blue-green Atlantic sea with white-capped waves and tall cumulus clouds in a bright sky.
- **Family look:** Family look (Europe): a sleek, rounded, graceful flat-top hull, a compact island with a single tall mast on the right side, an angled deck, a clean deck with a few parked aircraft. Paint: medium blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a smaller flat-top hull with an angled deck, a tall boxy island with a radar dish and a funnel, one elevator, a few parked aircraft.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design with a new island and an angled deck: a clearly newer design: a bigger hull with a long angled flight deck, a compact island with flat radar panels, two elevators, catapults at the bow, parked aircraft in rows.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a small integrated island and drones on deck: a near-future design: a smooth hull with a two-part island with an integrated mast, a long clean angled flight deck, a ski-jump-free flat bow, small unmanned drones parked on the deck.

#### Export

- **Setting of the card scene:** a calm turquoise tropical sea with a low distant island on the horizon and a few small white clouds in a hot clear sky.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a smaller flat-top hull with a simple island and a modest deck with a few parked aircraft. Paint: pale grey with a few rust-streaked patches.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a post-war pattern: a small, simple flat-top hull with a straight flight deck, a plain boxy island on the right side, one elevator, a few parked aircraft.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design with a new island and an angled deck: a widely exported 1970s-80s pattern: a mid-sized hull with a short angled deck, a ski-jump bow, a taller island with a radar mast and a funnel, a few parked aircraft.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a small integrated island and drones on deck: a modern export-grade design: a modular hull with an angled deck, a compact island with flat radar panels, two elevators, a few parked aircraft, a practical look made to be sold to many navies.

### Strike fighter (a combat jet for ground attack) (`jet`): 45 prompts, built from these words

Class of picture: `air`. Files: `assets/art-src/ul-jet-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-jet-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single strike fighter (a combat jet for ground attack), seen from a front three-quarter side view from slightly above (about 30 degrees down), shown in level flight attitude as a studio model (landing gear up, no stand), its nose turned toward the lower right of the picture so that the viewer sees its nose and one long side. The whole aircraft is centred left to right and top to bottom, and its full length or its full wingspan, whichever is larger, spans about 85 percent of the picture's width; the entire aircraft, wingtips and tail included, is inside the frame with a margin all round. Only the strike fighter (a combat jet for ground attack): no pilot visible, no other aircraft, no ground, no clouds, no contrail, only a faint, tight soft shadow below it.
- **Top-down frame:** A single strike fighter (a combat jet for ground attack), seen exactly straight down from above (a true top-down plan view), its nose pointing to the top of the picture, wings spread out to both sides. The whole aircraft is centred left to right and top to bottom, and the larger of its length (nose to tail) and its wingspan (wingtip to wingtip) fills about 90 percent of the picture. Only the strike fighter (a combat jet for ground attack): no pilot visible, no other aircraft, no ground, no clouds, no shadow on the background.
- **Card scene:** "A single strike fighter (a combat jet for ground attack) flying fast in a gentle bank with a faint vapour trail at its wingtips, bombs and missiles carried on its wing pylons where the design carries them. The setting: <the group's setting>. Seen from a low three-quarter angle slightly below and beside it, banking gently, the aircraft fills about 60 percent of the picture's width, in the middle of the frame, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one aircraft: no pilot visible, no other aircraft, no people, no buildings, no signs, no markings. The strike fighter (a combat jet for ground attack) is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** a deep clear blue sky above a sunlit sea of white cloud far below.
- **Family look:** Family look (US/NATO): a sleek, compact fighter with a blended wing and body, intakes under or beside the body, a bubble canopy, tall or canted tail fins, weapons on wing pylons. Paint: pale ghost-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a compact single-engine jet with a bubble canopy, a chin intake under the nose, one tall tail fin, swept wings with six underwing pylons carrying bombs and a fuel tank, a plain round exhaust.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new airframe with an internal weapons bay: a larger twin-engine jet with two engines side by side and square intakes on the sides, twin canted tail fins, a wide wing with long leading-edge extensions, closed weapon-bay doors on the belly, a sensor pod on the nose.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a tailless, faceted strike aircraft: a smooth sharply faceted airframe with no tail fins, no external weapons, a single engine with a faceted exhaust, small internal bays, a sensor blister under the nose.

#### Eastern

- **Setting of the card scene:** a pale blue sky with high thin cirrus streaks above a far-below patchwork of golden steppe and dark pine forest.
- **Family look:** Family look (Eastern): a big, rugged, wide-bodied jet with two widely spaced engines, a long nose, square intakes, twin tall tail fins and many weapon pylons. Paint: pale grey with a darker grey-green upper surface.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a stubby, rugged attack jet with a drooped nose, a single engine, one tall tail fin, swept wings with six pylons carrying rocket pods and bombs, a plain cockpit bubble.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new airframe with an internal weapons bay: a large twin-engine strike jet with a wide, flat-fronted cockpit, a long tail stinger, twin tall tail fins, large square intakes, closed weapon-bay doors under the fuselage, wing pylons with missiles.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a tailless, faceted strike aircraft: a wide, smoothly faceted airframe with no tail fins, two widely spaced engines with faceted exhausts, internal bays, a smooth nose.

#### China

- **Setting of the card scene:** a hazy pale-blue sky with soft white clouds above distant green mountains far below.
- **Family look:** Family look (China, its own lines): a clean, sharply swept design with a long pointed nose, big rectangular side intakes, canted twin tail fins, neat flush weapon pylons. Paint: pale blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a modest design: a simple single-engine attack jet with a pointed nose, a nose intake with a centre cone, swept wings, one tail fin, four underwing pylons.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new airframe with an internal weapons bay: a larger twin-engine jet with big rectangular intakes on the sides, canted twin tails, a clean wide body, closed weapon-bay doors on the belly, a sensor pod, wing pylons.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a tailless, faceted strike aircraft: a smooth sharply faceted airframe with a diamond-shaped intake, no tail fins, internal bays, a single engine with a serrated exhaust, a sensor blister under the nose.

#### Europe

- **Setting of the card scene:** a bright sky with scattered cumulus clouds above distant green fields and a river far below.
- **Family look:** Family look (Europe): a sleek delta-wing or swept design with small canard foreplanes, a compact graceful body, a single or twin engines, an elegant clean finish. Paint: medium blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a compact single-engine strike jet with a pointed nose, small stubby straight wings, one tail fin, a long thin body, two wingtip fuel tanks and a few pylons.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new airframe with an internal weapons bay: a twin-engine delta-wing jet with small canard foreplanes, a long clean body, closed weapon-bay doors on the belly, a single tail fin, a few wing pylons.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a tailless, faceted strike aircraft: a smooth, faceted airframe with no tail fins, two small internal bays, a single engine, a clean sensor blister under the nose.

#### Export

- **Setting of the card scene:** a hot clear blue sky with a few small clouds above distant dry brown hills and a red-brown plain far below.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, older jet shapes with bolt-on kits and add-on parts that look fitted by the buyer. Paint: sand and olive-green camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a post-war pattern: a plain single-engine jet with swept wings that can fold, a nose intake, one tall tail fin, four pylons with bombs and a drop tank, a plain bubble cockpit.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new airframe with a larger wing: a twin-engine jet with a sloped cockpit, twin tail fins, canard foreplanes, six wing pylons with missiles, a refuelling probe, a clean practical look.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a modern export-grade design: a single-engine faceted jet with side intakes, a small internal bay, a modular nose with a radar, tail fins, a practical look made to be sold to many air forces.

### Interceptor (a fast high-altitude fighter) (`int`): 45 prompts, built from these words

Class of picture: `air`. Files: `assets/art-src/ul-int-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-int-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single interceptor (a fast high-altitude fighter), seen from a front three-quarter side view from slightly above (about 30 degrees down), shown in level flight attitude as a studio model (landing gear up, no stand), its nose turned toward the lower right of the picture so that the viewer sees its nose and one long side. The whole aircraft is centred left to right and top to bottom, and its full length or its full wingspan, whichever is larger, spans about 85 percent of the picture's width; the entire aircraft, wingtips and tail included, is inside the frame with a margin all round. Only the interceptor (a fast high-altitude fighter): no pilot visible, no other aircraft, no ground, no clouds, no contrail, only a faint, tight soft shadow below it.
- **Top-down frame:** A single interceptor (a fast high-altitude fighter), seen exactly straight down from above (a true top-down plan view), its nose pointing to the top of the picture, wings spread out to both sides. The whole aircraft is centred left to right and top to bottom, and the larger of its length (nose to tail) and its wingspan (wingtip to wingtip) fills about 90 percent of the picture. Only the interceptor (a fast high-altitude fighter): no pilot visible, no other aircraft, no ground, no clouds, no shadow on the background.
- **Card scene:** "A single interceptor (a fast high-altitude fighter) climbing fast in a steep bank, a faint vapour trail at its wingtips, long-range air-to-air missiles under its wings where the design carries them. The setting: <the group's setting>. Seen from a low three-quarter angle slightly below and beside it, banking gently, the aircraft fills about 60 percent of the picture's width, in the middle of the frame, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one aircraft: no pilot visible, no other aircraft, no people, no buildings, no signs, no markings. The interceptor (a fast high-altitude fighter) is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** a deep clear blue sky above a sunlit sea of white cloud far below.
- **Family look:** Family look (US/NATO): a big, powerful, long-bodied fighter with two large engines, big square or wedge intakes on the sides of the body, a bubble canopy, twin tall tail fins and long-range missiles carried under the body. Paint: pale ghost-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a heavy twin-engine jet with a long nose with a big radar, a bubble canopy, two side intakes with sharp edges, swept wings with downturned tips, one or two tail fins, four missiles under the fuselage.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new, larger twin-engine airframe: a long body with a swing-out wing, a large radar nose, twin tall tail fins, wedge intakes, long-range missiles under the belly, a clean finish.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a tailless, faceted near-future fighter: a smooth faceted wide body with no tail fins, internal bays, two engines with faceted exhausts, a diamond-shaped intake.

#### Eastern

- **Setting of the card scene:** a pale blue sky with high thin cirrus streaks above a far-below patchwork of golden steppe and dark pine forest.
- **Family look:** Family look (Eastern): a big, rugged, high-flying jet with two widely spaced engines, huge square intakes, twin tall tail fins, a long nose and heavy long-range missiles under the body. Paint: pale grey with a darker grey-green upper surface.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a stout twin-engine jet with a swept wing, large square side intakes, a single tall tail fin, a long nose, a bubble canopy, two long missiles under the body.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new, larger twin-engine airframe: a big wide jet with two widely spaced engines, huge rectangular intakes, twin canted tail fins, a long radome nose, four large missiles on the belly, a long tail boom.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a tailless, faceted near-future fighter: a smooth faceted wide body, no tail fins, two widely spaced engines with faceted exhausts, internal bays, a smooth nose.

#### China

- **Setting of the card scene:** a hazy pale-blue sky with soft white clouds above distant green mountains far below.
- **Family look:** Family look (China, its own lines): a slim, clean, high-flying jet with a long pointed nose, a delta or swept wing, rectangular side intakes, canted twin tails and neat flush pylons. Paint: pale blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a slim single-engine jet with a small delta wing, a nose intake with a centre cone, a single tall tail fin, two small missiles under the wings, a bubble canopy.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new, larger airframe: a big delta wing with small canard foreplanes, a long clean body, a single engine with a big ventral intake, a single tail fin, six pylons with long missiles.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a tailless, faceted near-future fighter: a smooth faceted body with a diamond-shaped intake, no tail fins, internal bays, a single engine with a faceted exhaust.

#### Europe

- **Setting of the card scene:** a bright sky with scattered cumulus clouds above distant green fields and a river far below.
- **Family look:** Family look (Europe): a sleek, narrow, high-flying jet with a delta wing, small canard foreplanes, a compact graceful body and a clean finish. Paint: medium blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a very slim jet with tiny, thin straight wings, a long needle-like body, a single tail fin, two small missiles on the wingtips, a plain round exhaust.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new, larger airframe: a compact delta-wing jet with canard foreplanes, a single engine, a sleek body, a bubble canopy, a single tall tail fin, four long missiles under the body.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a tailless, faceted near-future fighter: a smooth faceted delta-shaped body with no tail fins, internal bays, a single engine with a faceted exhaust.

#### Export

- **Setting of the card scene:** a hot clear blue sky with a few small clouds above distant dry brown hills and a red-brown plain far below.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, older jet shapes with bolt-on kits that look fitted by the buyer. Paint: sand and olive-green camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a post-war pattern: a small delta-wing jet with a nose intake with a centre cone, a single tall tail fin, two small missiles under the wings, a plain bubble canopy.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a widely exported 1980s pattern: a twin-engine jet with swept wings, two tail fins, intakes under the wings, a rear-facing sensor on the tail, four missiles under the body.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a modern export-grade design: a single-engine faceted jet with side intakes, a small internal bay, a modular radar nose, a practical look made to be sold to many air forces.

### Air superiority fighter (a stealthy twin-engine fighter) (`asf`): 45 prompts, built from these words

Class of picture: `air`. Files: `assets/art-src/ul-asf-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-asf-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single air superiority fighter (a stealthy twin-engine fighter), seen from a front three-quarter side view from slightly above (about 30 degrees down), shown in level flight attitude as a studio model (landing gear up, no stand), its nose turned toward the lower right of the picture so that the viewer sees its nose and one long side. The whole aircraft is centred left to right and top to bottom, and its full length or its full wingspan, whichever is larger, spans about 85 percent of the picture's width; the entire aircraft, wingtips and tail included, is inside the frame with a margin all round. Only the air superiority fighter (a stealthy twin-engine fighter): no pilot visible, no other aircraft, no ground, no clouds, no contrail, only a faint, tight soft shadow below it.
- **Top-down frame:** A single air superiority fighter (a stealthy twin-engine fighter), seen exactly straight down from above (a true top-down plan view), its nose pointing to the top of the picture, wings spread out to both sides. The whole aircraft is centred left to right and top to bottom, and the larger of its length (nose to tail) and its wingspan (wingtip to wingtip) fills about 90 percent of the picture. Only the air superiority fighter (a stealthy twin-engine fighter): no pilot visible, no other aircraft, no ground, no clouds, no shadow on the background.
- **Card scene:** "A single air superiority fighter (a stealthy twin-engine fighter) flying fast in a banking turn, a faint vapour trail at its wingtips, weapons carried inside its body so that its lines are clean. The setting: <the group's setting>. Seen from a low three-quarter angle slightly below and beside it, banking gently, the aircraft fills about 60 percent of the picture's width, in the middle of the frame, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one aircraft: no pilot visible, no other aircraft, no people, no buildings, no signs, no markings. The air superiority fighter (a stealthy twin-engine fighter) is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** a deep clear blue sky above a sunlit sea of white cloud far below.
- **Family look:** Family look (US/NATO): a large, agile, twin-engine fighter with big wedge intakes beside the cockpit, twin tall tail fins, a wide flat body, a bubble canopy. Paint: pale ghost-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a big twin-engine jet with a high wing, large squared intakes with a moving ramp, twin tall tail fins, a bubble canopy, four long missiles under the body and a cannon at the wing root.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new airframe with canted tails: a sharp, stealthy twin-engine fighter with canted twin tail fins, faceted edges, flat engine exhausts, closed internal weapon bays, a wide flat body.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a tailless, wide-body near-future fighter: a smooth, wide faceted body with no tail fins, internal bays, two engines with faceted exhausts, a smooth diamond-shaped nose.

#### Eastern

- **Setting of the card scene:** a pale blue sky with high thin cirrus streaks above a far-below patchwork of golden steppe and dark pine forest.
- **Family look:** Family look (Eastern): a big, powerful twin-engine fighter with two widely spaced engines, a long tail boom between them, twin tall tail fins, a long nose and large wing extensions. Paint: pale grey with a darker grey-green upper surface.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a large twin-engine jet with two widely spaced engines, twin tall tail fins, a long nose with a pointed radome, a bubble canopy, six long missiles under the wings and body.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new airframe with canted tails: a big, agile twin-engine jet with canted twin tail fins, a large thrust-vectoring-looking nozzle pair, a long tail boom, a wide body, closed weapon bays and a few wing missiles.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a tailless, wide-body near-future fighter: a wide, smooth, faceted body with no tail fins, two widely spaced engines with faceted exhausts, internal bays, a smooth nose.

#### China

- **Setting of the card scene:** a hazy pale-blue sky with soft white clouds above distant green mountains far below.
- **Family look:** Family look (China, its own lines): a long, sharp, clean twin-engine fighter with a long pointed nose, big rectangular side intakes, canted twin tail fins and a delta wing with canard foreplanes. Paint: pale blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a large twin-engine jet with a swept wing, rectangular side intakes, twin tall tail fins, a bubble canopy, four missiles under the wings.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new airframe with canted tails: a sleek stealthy twin-engine fighter with canard foreplanes, a long faceted body, canted twin tail fins, flat exhausts, closed internal weapon bays.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a tailless, wide-body near-future fighter: a wide faceted body with no tail fins, a smooth diamond-shaped nose, two engines with faceted exhausts, internal bays.

#### Europe

- **Setting of the card scene:** a bright sky with scattered cumulus clouds above distant green fields and a river far below.
- **Family look:** Family look (Europe): a sleek, agile twin-engine fighter with a delta wing, small canard foreplanes, a chin intake under the nose, a single tall tail fin, a clean polished finish. Paint: medium blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a large twin-engine jet with swept wings, two plain tail fins, big side intakes, a bubble canopy, four missiles under the body.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new airframe: a twin-engine delta-wing fighter with canard foreplanes, a chin intake, a single tall tail fin, a clean sleek body, weapons under the wings and body.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a tailless, wide-body near-future fighter: a smooth faceted delta-shaped body with no tail fins, internal bays, two engines with faceted exhausts, a smooth nose.

#### Export

- **Setting of the card scene:** a hot clear blue sky with a few small clouds above distant dry brown hills and a red-brown plain far below.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, older jet shapes with bolt-on kits that look fitted by the buyer. Paint: sand and olive-green camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a post-war pattern: a swing-wing jet with a nose intake, a single tall tail fin, two small missiles under the wings, a plain bubble canopy.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a widely exported 1980s pattern: a large twin-engine jet with two widely spaced engines, twin tail fins, a long nose, six missiles under the wings and body, a plain finish.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a modern export-grade design: a twin-engine jet with canard foreplanes, canted tail fins, a modular radar nose, bolt-on pylons, a practical look made to be sold to many air forces.

### Attack helicopter (`heli`): 45 prompts, built from these words

Class of picture: `heli`. Files: `assets/art-src/ul-heli-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-heli-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single attack helicopter, seen from a front three-quarter side view from slightly above (about 30 degrees down), shown as a studio model standing on its landing gear, the rotor blades still and drawn sharp (not blurred), its nose turned toward the lower right of the picture so that the viewer sees its nose and one long side. The whole helicopter is centred left to right and top to bottom, and its full length including the rotor disc spans about 85 percent of the picture's width; everything, rotor tips and tail included, is inside the frame with a margin all round. Only the attack helicopter: no pilot visible, no other aircraft, no ground, only a faint, tight soft shadow under it.
- **Top-down frame:** A single attack helicopter, seen exactly straight down from above (a true top-down plan view), its nose pointing to the top of the picture, the rotor blades still and drawn sharp (not blurred). The whole helicopter is centred left to right and top to bottom, and the larger of its length (nose to tail, rotor included) and its rotor span fills about 90 percent of the picture. Only the attack helicopter: no pilot visible, no other aircraft, no ground, no shadow on the background.
- **Card scene:** "A single attack helicopter flying fast and low, nose slightly down, its rotor turning, rocket pods and missiles on its stub wings where the design carries them, a faint dust haze under it. The setting: <the group's setting>. Seen from a low front three-quarter angle, slightly above the ground, the helicopter fills about 55 percent of the picture's width, in the middle of the frame, its rotor turning with a natural light motion blur on the blades only, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one helicopter: no pilot visible, no other aircraft, no people, no buildings, no signs, no markings. The attack helicopter is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** low over a dry grassland valley with rolling hills and scattered scrub bushes.
- **Family look:** Family look (US/NATO): a slim, narrow-bodied attack helicopter with two seats in tandem, a tall nose sensor turret, short stub wings carrying rocket pods and missiles, a four-bladed main rotor and a tail rotor. Paint: matte olive-drab grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a slim, narrow, low helicopter with two seats in tandem under separate bubble canopies, a two-bladed main rotor, a chin turret gun, short stub wings with rocket pods and missile tubes, a tall tail with a small tail rotor.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new, angular airframe with weapons carried inside: a sleek angular body with faceted panels, a four-bladed main rotor, a nose sensor turret, small stub wings, closed internal weapon bays on the belly, a tall tail fin.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a compound helicopter with a pusher propeller and a faceted stealthy body: a smooth faceted body, a twin rotor mast with coaxial blades, a pusher propeller at the tail, small stub wings, closed internal bays.

#### Eastern

- **Setting of the card scene:** low over an open golden steppe with a line of birch trees and a dark pine forest on the horizon.
- **Family look:** Family look (Eastern): a big, rugged, armoured helicopter with a heavy body, stub wings with many weapon pylons, a five-bladed main rotor, a thick armoured cockpit with flat glass panels. Paint: dark green with darker green blotches.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a big, heavy helicopter with a hump-backed body, two bulged cockpit canopies side by side in tandem, a five-bladed main rotor, big stub wings with rocket pods and missile rails, a chin gun, wheels retracted.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new, angular airframe with weapons carried inside: a coaxial twin-rotor body (two rotors one above the other) with a short wide fuselage, side-by-side seats, wing pylons with a few missiles, a nose sensor turret.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a compound helicopter with a pusher propeller and a faceted stealthy body: a smooth faceted body, a coaxial main rotor, a pusher propeller at the tail, small stub wings, closed internal bays.

#### China

- **Setting of the card scene:** low over a hazy blue-green sea close to a rocky green coastline.
- **Family look:** Family look (China, its own lines): a slim, clean, narrow helicopter with a sharply angular nose, a four-bladed main rotor, tandem cockpits under flat glass, short stub wings and neat missile rails. Paint: plain dark grey-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a modest design: a small slim helicopter with a plain rounded body, a two-bladed main rotor, a chin turret, short stub wings with rocket pods and missile rails.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new, angular airframe with weapons carried inside: a narrow faceted body with flat armoured panels, a five-bladed main rotor, a nose sensor turret, stub wings with a few missiles, a tall fin.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a compound helicopter with a pusher propeller and a faceted stealthy body: a smooth faceted body, a coaxial main rotor, a pusher propeller at the tail, small stub wings, closed internal bays.

#### Europe

- **Setting of the card scene:** low over gentle farmland with hedgerows, fields and a wooded ridge in the distance.
- **Family look:** Family look (Europe): a sleek, graceful, narrow-bodied helicopter with tandem cockpits under rounded canopies, a four-bladed main rotor, a mast-mounted sight, a clean low silhouette. Paint: dark green-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a light, slim helicopter with tandem cockpits under bubble canopies, a two-bladed main rotor, a chin turret gun, short stub wings with missile tubes and rocket pods.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new, angular airframe with weapons carried inside: a sleek faceted body with a four-bladed main rotor, a mast-mounted sight, a nose sensor turret, stub wings with missiles, a tall fin.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a compound helicopter with a pusher propeller and a faceted stealthy body: a smooth faceted body, a coaxial main rotor, a pusher propeller at the tail, small stub wings, closed internal bays.

#### Export

- **Setting of the card scene:** low over a dry savanna with scattered flat-topped acacia trees and red-brown earth.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, older helicopter shapes with bolt-on kits that look fitted by the buyer. Paint: faded olive-green and tan.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a post-war pattern: a bulky helicopter with a bulged cockpit, a five-bladed main rotor, wheels, short stub wings with rocket pods and missile rails, a plain tail rotor.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a widely exported 1980s pattern: a bigger helicopter with a bubble canopy for two seats in tandem, a five-bladed rotor, a chin gun turret, larger stub wings with missile rails and pods, bolt-on armour plates.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a modern export-grade design: an angular helicopter with a modular nose with a sensor ball, a four-bladed rotor, stub wings with missiles, a practical look made to be sold to many armies.

### Reconnaissance drone (a medium unmanned aircraft) (`drone`): 45 prompts, built from these words

Class of picture: `air`. Files: `assets/art-src/ul-drone-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-drone-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single reconnaissance drone (a medium unmanned aircraft), seen from a front three-quarter side view from slightly above (about 30 degrees down), shown in level flight attitude as a studio model (landing gear up, no stand), its nose turned toward the lower right of the picture so that the viewer sees its nose and one long side. The whole aircraft is centred left to right and top to bottom, and its full length or its full wingspan, whichever is larger, spans about 85 percent of the picture's width; the entire aircraft, wingtips and tail included, is inside the frame with a margin all round. Only the reconnaissance drone (a medium unmanned aircraft): no pilot visible, no other aircraft, no ground, no clouds, no contrail, only a faint, tight soft shadow below it.
- **Top-down frame:** A single reconnaissance drone (a medium unmanned aircraft), seen exactly straight down from above (a true top-down plan view), its nose pointing to the top of the picture, wings spread out to both sides. The whole aircraft is centred left to right and top to bottom, and the larger of its length (nose to tail) and its wingspan (wingtip to wingtip) fills about 90 percent of the picture. Only the reconnaissance drone (a medium unmanned aircraft): no pilot visible, no other aircraft, no ground, no clouds, no shadow on the background.
- **Card scene:** "A single reconnaissance drone (a medium unmanned aircraft) flying slowly and steadily in a gentle turn, its camera turret under the nose looking down at the ground far below. The setting: <the group's setting>. Seen from a low three-quarter angle slightly below and beside it, banking gently, the aircraft fills about 60 percent of the picture's width, in the middle of the frame, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one aircraft: no pilot visible, no other aircraft, no people, no buildings, no signs, no markings. The reconnaissance drone (a medium unmanned aircraft) is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** a deep clear blue sky above a sunlit sea of white cloud far below.
- **Family look:** Family look (US/NATO): a slim unmanned aircraft with a bulbous nose, a pusher propeller at the tail, long thin straight wings and an inverted-V tail, a camera turret under the nose. Paint: pale ghost-grey.
- **Look 1 (levels 1-3):** Look 1 of 3 (generations I to III), the oldest, unarmed: a small, slim propeller drone with long thin straight wings, a rounded nose with a camera dome, a pusher propeller, an inverted-V tail, no weapons of any kind under the wings.
- **Look 2 (levels 4-6):** Look 2 of 3 (generation IV), a clearly newer design: armed, the first one: a larger propeller drone with long thin wings, a bulbous nose, a camera turret under the nose, a pusher propeller, an inverted-V tail and two small missiles on pylons under each wing.
- **Look 3 (levels 7-8):** Look 3 of 3 (generation V), the newest, a jet-powered flying-wing drone with internal weapons: a smooth, faceted, tailless flying wing with a dorsal air intake, a flat exhaust, closed internal bays, no external weapons, a camera blister under the nose.

#### Eastern

- **Setting of the card scene:** a pale blue sky with high thin cirrus streaks above a far-below patchwork of golden steppe and dark pine forest.
- **Family look:** Family look (Eastern): a twin-boom unmanned aircraft with a stubby body, a pusher propeller between the booms, a high straight wing and a camera ball under the nose. Paint: pale grey with a darker grey-green upper surface.
- **Look 1 (levels 1-3):** Look 1 of 3 (generations I to III), the oldest, unarmed: a small twin-boom drone with a stubby rounded body, a high straight wing, a pusher propeller, a camera dome under the nose, no weapons of any kind.
- **Look 2 (levels 4-6):** Look 2 of 3 (generation IV), a clearly newer design: armed, the first one: a larger twin-boom drone with a long straight wing, a pusher propeller, a camera ball under the nose and two missiles on pylons under each wing.
- **Look 3 (levels 7-8):** Look 3 of 3 (generation V), the newest, a jet-powered flying-wing drone with internal weapons: a smooth, faceted, tailless flying wing with a dorsal air intake, a flat exhaust, closed internal bays, no external weapons.

#### China

- **Setting of the card scene:** a hazy pale-blue sky with soft white clouds above distant green mountains far below.
- **Family look:** Family look (China, its own lines): a slim, clean unmanned aircraft with high straight wings, a V-tail or twin tails, a pusher propeller, a neat camera turret under a rounded nose. Paint: pale blue-grey.
- **Look 1 (levels 1-3):** Look 1 of 3 (generations I to III), the oldest, unarmed: a small, slim propeller drone with long high straight wings, a V-tail, a rounded nose with a camera dome, no weapons of any kind.
- **Look 2 (levels 4-6):** Look 2 of 3 (generation IV), a clearly newer design: armed, the first one: a larger propeller drone with long straight wings, a V-tail, a pusher propeller, a camera turret under the nose and two missiles on pylons under each wing.
- **Look 3 (levels 7-8):** Look 3 of 3 (generation V), the newest, a jet-powered flying-wing drone with internal weapons: a smooth, faceted, tailless flying wing with a dorsal air intake, a flat exhaust, closed internal bays, no external weapons.

#### Europe

- **Setting of the card scene:** a bright sky with scattered cumulus clouds above distant green fields and a river far below.
- **Family look:** Family look (Europe): a sleek, clean unmanned aircraft with a smooth rounded body, small swept wings and tail fins, an elegant polished look, a camera pod under the body. Paint: medium blue-grey.
- **Look 1 (levels 1-3):** Look 1 of 3 (generations I to III), the oldest, unarmed: a slim, torpedo-shaped, jet-powered drone with small stubby straight wings, a small tail with fins, a camera pod under the body, no weapons of any kind.
- **Look 2 (levels 4-6):** Look 2 of 3 (generation IV), a clearly newer design: armed, the first one: a larger propeller drone with long thin wings, a bulbous nose, a camera turret under the nose, a pusher propeller, an inverted-V tail and two missiles on pylons under each wing.
- **Look 3 (levels 7-8):** Look 3 of 3 (generation V), the newest, a jet-powered flying-wing drone with internal weapons: a smooth, faceted, tailless diamond-shaped flying wing with a dorsal air intake, a flat exhaust, closed internal bays, no external weapons.

#### Export

- **Setting of the card scene:** a hot clear blue sky with a few small clouds above distant dry brown hills and a red-brown plain far below.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a simple unmanned aircraft with bolt-on kits that look fitted by the buyer. Paint: sand and olive-green camouflage.
- **Look 1 (levels 1-3):** Look 1 of 3 (generations I to III), the oldest, unarmed: a small, simple propeller drone with a plain boxy body, straight wings, twin tail booms, a camera dome under the nose, no weapons of any kind.
- **Look 2 (levels 4-6):** Look 2 of 3 (generation IV), a clearly newer design: armed, the first one: a mid-sized twin-boom drone with a pusher propeller, straight wings, a camera ball under the nose and two small missiles on pylons under each wing.
- **Look 3 (levels 7-8):** Look 3 of 3 (generation V), the newest, a jet-powered flying-wing drone with internal weapons: a modular, faceted, tailless flying wing with a dorsal air intake, closed internal bays, no external weapons, a practical look.

### Strike drone (an armed unmanned aircraft) (`sdrone`): 45 prompts, built from these words

Class of picture: `air`. Files: `assets/art-src/ul-sdrone-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-sdrone-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single strike drone (an armed unmanned aircraft), seen from a front three-quarter side view from slightly above (about 30 degrees down), shown in level flight attitude as a studio model (landing gear up, no stand), its nose turned toward the lower right of the picture so that the viewer sees its nose and one long side. The whole aircraft is centred left to right and top to bottom, and its full length or its full wingspan, whichever is larger, spans about 85 percent of the picture's width; the entire aircraft, wingtips and tail included, is inside the frame with a margin all round. Only the strike drone (an armed unmanned aircraft): no pilot visible, no other aircraft, no ground, no clouds, no contrail, only a faint, tight soft shadow below it.
- **Top-down frame:** A single strike drone (an armed unmanned aircraft), seen exactly straight down from above (a true top-down plan view), its nose pointing to the top of the picture, wings spread out to both sides. The whole aircraft is centred left to right and top to bottom, and the larger of its length (nose to tail) and its wingspan (wingtip to wingtip) fills about 90 percent of the picture. Only the strike drone (an armed unmanned aircraft): no pilot visible, no other aircraft, no ground, no clouds, no shadow on the background.
- **Card scene:** "A single strike drone (an armed unmanned aircraft) flying fast in a gentle bank, the weapons it carries clearly visible under its wings or body. The setting: <the group's setting>. Seen from a low three-quarter angle slightly below and beside it, banking gently, the aircraft fills about 60 percent of the picture's width, in the middle of the frame, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one aircraft: no pilot visible, no other aircraft, no people, no buildings, no signs, no markings. The strike drone (an armed unmanned aircraft) is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** a deep clear blue sky above a sunlit sea of white cloud far below.
- **Family look:** Family look (US/NATO): a lean, smooth unmanned aircraft with a swept wing, a V-tail or no tail, a dorsal engine intake, clean lines, weapons on pylons or in internal bays. Paint: pale ghost-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a medium propeller-driven strike drone: a slim body with long straight wings, a V-tail, a pusher propeller, a camera ball under the nose, four small missiles on pylons under the wings.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a larger jet-powered drone: a smooth, flattened body with small swept wings, a V-tail, a dorsal jet intake, a flat exhaust, weapon pylons under the wings and an internal bay.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a tailless, stealthy combat drone: a smooth, sharply faceted flying wing with no tail, a diamond-shaped intake, closed internal weapon bays, no external weapons.

#### Eastern

- **Setting of the card scene:** a pale blue sky with high thin cirrus streaks above a far-below patchwork of golden steppe and dark pine forest.
- **Family look:** Family look (Eastern): a rugged, simple unmanned aircraft, a thin body with a delta or straight wing, cheap and mass-produced in look, weapons on pylons or in an internal bay. Paint: pale grey with a darker grey-green upper surface.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a cheap delta-winged propeller drone: a long, thin body, a small swept delta wing, a pusher propeller at the tail, a small warhead nose, no tail, a rugged simple look.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a larger jet-powered drone: a thicker body with swept wings, twin tail fins, a dorsal jet intake, a flat exhaust, a few weapon pylons under the wings.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a tailless, stealthy combat drone: a smooth, wide, faceted flying wing with no tail, a dorsal intake, closed internal bays, a smooth nose.

#### China

- **Setting of the card scene:** a hazy pale-blue sky with soft white clouds above distant green mountains far below.
- **Family look:** Family look (China, its own lines): a clean, slim unmanned aircraft with long straight or swept wings, a V-tail or no tail, neat flush pylons, a smooth faceted look in the newest. Paint: pale blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a medium propeller-driven strike drone: a slim body with long straight wings, a V-tail, a pusher propeller, a camera ball under the nose, four small missiles on pylons under the wings.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a larger jet-powered drone: a smooth body with swept wings, a V-tail, a dorsal jet intake, a flat exhaust, weapon pylons under the wings and a small internal bay.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a tailless, stealthy combat drone: a smooth, sharply faceted flying wing with no tail, a diamond-shaped intake, closed internal weapon bays, no external weapons.

#### Europe

- **Setting of the card scene:** a bright sky with scattered cumulus clouds above distant green fields and a river far below.
- **Family look:** Family look (Europe): a sleek, elegant unmanned aircraft with a clean smooth body, a delta or swept wing, a refined polished look, weapons on pylons or in internal bays. Paint: medium blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a medium propeller-driven strike drone: a slim body with long straight wings, a V-tail, a pusher propeller, a camera ball under the nose, four small missiles on pylons under the wings.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a larger jet-powered drone: a smooth tailless body with a sharp delta wing, a dorsal intake, a flat exhaust, closed internal weapon bays and two wing pylons.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a tailless, stealthy combat drone: a smooth, wide, sharply faceted flying wing with a saw-tooth trailing edge, no tail, a diamond-shaped intake, closed internal bays.

#### Export

- **Setting of the card scene:** a hot clear blue sky with a few small clouds above distant dry brown hills and a red-brown plain far below.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a simple unmanned aircraft with bolt-on kits that look fitted by the buyer. Paint: sand and olive-green camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a cheap delta-winged propeller drone: a long, thin body, a small delta wing, a pusher propeller at the tail, a small warhead nose, no tail, a rugged simple look.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a mid-sized twin-boom drone with a pusher propeller, straight wings, a camera ball under the nose, four weapon pylons, bolt-on boxes, a practical look.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a modern export-grade stealthy combat drone: a modular, faceted flying wing with a dorsal intake, closed internal bays, a practical look made to be sold to many air forces.

### Small swarm drone (one drone of a swarm) (`swarm`): 45 prompts, built from these words

Class of picture: `air`. Files: `assets/art-src/ul-swarm-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-swarm-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single small swarm drone (one drone of a swarm), seen from a front three-quarter side view from slightly above (about 30 degrees down), shown in level flight attitude as a studio model (landing gear up, no stand), its nose turned toward the lower right of the picture so that the viewer sees its nose and one long side. The whole aircraft is centred left to right and top to bottom, and its full length or its full wingspan, whichever is larger, spans about 85 percent of the picture's width; the entire aircraft, wingtips and tail included, is inside the frame with a margin all round. Only the small swarm drone (one drone of a swarm): no pilot visible, no other aircraft, no ground, no clouds, no contrail, only a faint, tight soft shadow below it.
- **Top-down frame:** A single small swarm drone (one drone of a swarm), seen exactly straight down from above (a true top-down plan view), its nose pointing to the top of the picture, wings spread out to both sides. The whole aircraft is centred left to right and top to bottom, and the larger of its length (nose to tail) and its wingspan (wingtip to wingtip) fills about 90 percent of the picture. Only the small swarm drone (one drone of a swarm): no pilot visible, no other aircraft, no ground, no clouds, no shadow on the background.
- **Card scene:** "A single small swarm drone (one drone of a swarm) flying fast and low in a gentle bank, its small size obvious against the wide landscape far below it, no other drone in view. The setting: <the group's setting>. Seen from a low three-quarter angle slightly below and beside it, banking gently, the aircraft fills about 60 percent of the picture's width, in the middle of the frame, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one aircraft: no pilot visible, no other aircraft, no people, no buildings, no signs, no markings. The small swarm drone (one drone of a swarm) is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** a deep clear blue sky above a sunlit sea of white cloud far below.
- **Family look:** Family look (US/NATO): a small, clean, smooth, light drone with a rounded body, tiny wings and a quiet, sensor-packed look. Paint: pale ghost-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a small quadrotor-style drone: a flat central body with four short arms and four small rotors, a camera ball under the body, a neat light look.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a sleek fixed-wing drone: a slim torpedo body with small swept wings, a small pusher propeller, a small camera dome under the nose.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a small ducted-fan drone with a faceted body: a compact, sharply faceted body with two small ducted fans and short stubby fins, a flat sensor panel under the nose.

#### Eastern

- **Setting of the card scene:** a pale blue sky with high thin cirrus streaks above a far-below patchwork of golden steppe and dark pine forest.
- **Family look:** Family look (Eastern): a small, rugged, cheap-looking drone with a simple body, a pusher propeller or plain rotors, a small warhead nose, cross-shaped wings. Paint: pale grey with a darker grey-green upper surface.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a small quadrotor-style drone: a flat boxy central body with four short arms and four small rotors, a small warhead on the underside, a rugged look.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a sleek fixed-wing drone: a slim body with small X-shaped wings and X-shaped tails, a pusher propeller, a small warhead nose.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a small ducted-fan drone with a faceted body: a compact angular body with two small ducted fans, short stubby fins, a small warhead nose.

#### China

- **Setting of the card scene:** a hazy pale-blue sky with soft white clouds above distant green mountains far below.
- **Family look:** Family look (China, its own lines): a small, tidy, smooth drone with a clean rounded body, neat wings, a pale finish. Paint: pale blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a small quadrotor-style drone: a flat rounded central body with four neat arms and four small rotors, a small camera ball under the body.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a sleek fixed-wing drone: a slim body with small swept delta wings, a pusher propeller, a rounded camera nose.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a small ducted-fan drone with a faceted body: a compact, smooth, sharply faceted body with two ducted fans, short stubby fins, a flat sensor panel under the nose.

#### Europe

- **Setting of the card scene:** a bright sky with scattered cumulus clouds above distant green fields and a river far below.
- **Family look:** Family look (Europe): a small, elegant, polished drone with a smooth body, thin wings and a compact camera pod, a refined clean look. Paint: medium blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a small quadrotor-style drone: a smooth slim central body with four thin arms and four small rotors, a camera pod under the body.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a sleek fixed-wing drone: a slim body with long thin straight wings, a small pusher propeller, a rounded nose with a small camera.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a small ducted-fan drone with a faceted body: a compact, sharply faceted body with two ducted fans, short stubby fins, a small sensor dome under the nose.

#### Export

- **Setting of the card scene:** a hot clear blue sky with a few small clouds above distant dry brown hills and a red-brown plain far below.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a small cheap drone with bolt-on parts and simple wiring. Paint: sand and olive-green camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a small quadrotor-style drone: a plain boxy central body with four short arms and four small rotors, a taped-on camera, a simple rugged look.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a sleek fixed-wing drone: a slim plain body with small straight wings, a small pusher propeller, a small warhead nose, a rugged practical look.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a small ducted-fan drone with a faceted body: a compact, modular, faceted body with two ducted fans, short stubby fins, a practical look made to be sold to many armies.

### Anti-tank missile carrier (`at`): 45 prompts, built from these words

Class of picture: `gnd`. Files: `assets/art-src/ul-at-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-at-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single anti-tank missile carrier, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front turned toward the lower right of the picture so that the viewer sees its front and one long side. The whole vehicle is centred left to right and top to bottom, and its full length (any gun barrel or boom included) spans about 85 percent of the picture's width; the entire vehicle, wheels or tracks included, is inside the frame with a margin all round. Only the anti-tank missile carrier: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it.
- **Top-down frame:** A single anti-tank missile carrier, seen exactly straight down from above (a true top-down plan view), its front pointing to the top of the picture. The whole vehicle is centred left to right and top to bottom, and its full length (any gun barrel or boom included) fills about 90 percent of the picture's height. Only the anti-tank missile carrier: no crew, no other vehicle, no ground, no track marks, no shadow on the background.
- **Card scene:** "A single anti-tank missile carrier stopped beside a dirt road with its missile launcher raised and aimed along the road, a faint puff of dust under it. The setting: <the group's setting>. Seen from a low front three-quarter angle slightly above ground level, the vehicle fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one vehicle: no crew visible, no other vehicle, no people, no buildings, no signs. The anti-tank missile carrier is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** a wide dry grassland valley with low rolling hills, a few sparse trees and scrub bushes, and a broad road of pale tan packed dirt.
- **Family look:** Family look (US/NATO): a compact armoured carrier of flat plates with a tall, flat-sided box launcher on a mast or a turret, wide tyres or short tracks, flat angular armour, matte finish. Paint: matte sand-tan.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a small, light four-wheeled utility vehicle with open sides, a tripod-mounted two-tube missile launcher on the rear bed, a roll bar, a spare wheel and a few stowage boxes.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new armoured vehicle with an enclosed box launcher holding more missiles: a six-wheeled armoured carrier with a flat angular body, a rotating box launcher with four missile tubes on top, a roof sensor, side armour plates.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a low, angular, stealthy launcher vehicle with more tubes: a low faceted armoured body on six wheels, a flat box launcher with eight tubes under flat covers, flat sensor panels, a remote machine gun.

#### Eastern

- **Setting of the card scene:** a wide open steppe of pale green and golden grass with a line of birch trees and the edge of a dark pine forest in the distance, on a rutted brown dirt road.
- **Family look:** Family look (Eastern): a low, compact, rounded armoured carrier with a small launcher arm on the roof, small wheels or short tracks, reactive bricks on the front, a log and fuel drums on the rear. Paint: dark olive-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a small, low amphibious-looking four-wheeled vehicle with a rail launcher for a single wire-guided missile raised over the cab, a canvas roof, a few stowage boxes.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new armoured vehicle with an enclosed box launcher holding more missiles: a six-wheeled armoured carrier with a rounded turret with a box launcher with four missile tubes, reactive bricks on the front, side skirts.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a low, angular, stealthy launcher vehicle with more tubes: a low faceted armoured body on six wheels, a flat box launcher with eight tubes, slat armour and bricks on the hull, a remote machine gun.

#### China

- **Setting of the card scene:** green farmland hills with terraced fields and a few tall poplars under a slightly hazy sky, on a rough yellow-brown dirt track.
- **Family look:** Family look (China, its own lines): a clean, boxy armoured carrier with sloped plates, a neat rectangular box launcher, evenly spaced small wheels or short tracks. Paint: plain mid-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a modest design: a small four-wheeled light vehicle with an open back, a single tubular missile launcher on a pedestal over the cab, a plain boxy body.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new armoured vehicle with an enclosed box launcher holding more missiles: a six-wheeled armoured carrier with a sloped body, a rotating rectangular box launcher with four missile tubes, a laser-warning pair on the roof.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a low, angular, stealthy launcher vehicle with more tubes: a low faceted armoured body on six wheels with smooth sloped panels, a flat box launcher with eight tubes, flat sensor panels.

#### Europe

- **Setting of the card scene:** gentle temperate farmland with hedgerows, fields and a few tall poplar trees, a distant wooded ridge, on a gravel-and-earth farm track.
- **Family look:** Family look (Europe): a sleek, low, smoothly sloped armoured carrier with a neat rounded launcher pod, a small mast sensor, wheels or tracks of a clean modern look. Paint: dark grey-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a light four-wheeled utility vehicle with an open back, a swivel-mounted missile launcher with two tubes behind the cab, a simple roll bar.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new armoured vehicle with an enclosed box launcher holding more missiles: a six-wheeled sloped armoured carrier, a rounded box launcher with four missile tubes, a mast sensor, side skirts.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a low, angular, stealthy launcher vehicle with more tubes: a low faceted armoured body on six wheels, a flat box launcher with eight tubes, a slim sensor mast, modular armour blocks.

#### Export

- **Setting of the card scene:** a dry savanna with scattered flat-topped acacia trees, red-brown earth and tufts of dry grass, on a red-brown dirt road.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a pickup-like or older armoured carrier with a bolt-on launcher that looks fitted by the buyer. Paint: faded ochre-sand with a few patches of darker touch-up paint.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a post-war pattern: a plain open four-wheeled jeep-like vehicle with a rail launcher for two wire-guided missiles on the back, a canvas roof, spare wheel.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new armoured vehicle with an enclosed box launcher holding more missiles: a six-wheeled armoured carrier with a bolt-on box launcher with four missile tubes, bolt-on armour plates, a roof machine gun.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a modern export-grade design: a modular six-wheeled carrier with a flat box launcher with six tubes, a thermal sight box, bolt-on armour, a practical look made to be sold to many armies.

### Special forces operator (`spec`): 45 prompts, built from these words

Class of picture: `man`. Files: `assets/art-src/ul-spec-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-spec-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single special forces operator, seen from a front three-quarter side view from slightly above (about 30 degrees down), standing in a ready pose with the weapon held ready, turned toward the lower right of the picture so that the viewer sees the front and one side. The whole soldier, from the boots to the top of the helmet and the weapon, is centred left to right and top to bottom and fills about 85 percent of the picture's height; the entire figure is inside the frame with a margin all round. Only this one special forces operator: no other person, no vehicle, no ground, only a faint, tight soft shadow under the boots.
- **Top-down frame:** A single special forces operator, seen exactly straight down from above (a true top-down plan view), facing the top of the picture, the weapon held ready in front. The whole soldier (head, shoulders, arms, pack and weapon) is centred left to right and top to bottom and fills about 85 percent of the picture's height. Only this one special forces operator: no other person, no vehicle, no ground, no shadow on the background.
- **Card scene:** "A single special forces operator moving low and quietly along the edge of a dirt road with his weapon held ready, not looking at the viewer. The setting: <the group's setting>. Seen from a low front three-quarter angle at about eye height, the soldier fills about half the picture's height and stands in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one soldier: no other person, no vehicle, no buildings, no signs, no markings. The special forces operator is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** a wide dry grassland valley with low rolling hills, a few sparse trees and scrub bushes, and a broad road of pale tan packed dirt.
- **Family look:** Family look (US/NATO): a lean, well-equipped operator in a ballistic helmet with night-vision mounts, a plate-carrier vest with many pouches, a suppressed carbine, a radio on the shoulder, gloves and knee pads. Paint: a tan-and-brown multi-terrain camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, Cold War era kit: a soft boonie hat, a plain lightweight vest with a few pouches, a short carbine with a long suppressor, a radio handset, camouflage face paint, light boots.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer kit: dark digital camouflage with integrated radios and optics: a ballistic helmet with night-vision goggles and a headset, a dark vest with modular pouches, a suppressed carbine with a sight, a radio on the chest.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future kit: sealed helmets and adaptive-camouflage suits: a sealed smooth helmet with a built-in display visor, an adaptive-camouflage suit with a patchwork finish, a slim armoured vest, a compact weapon with an integrated sight.

#### Eastern

- **Setting of the card scene:** a wide open steppe of pale green and golden grass with a line of birch trees and the edge of a dark pine forest in the distance, on a rutted brown dirt road.
- **Family look:** Family look (Eastern): a lean operator in a rounded helmet with a face wrap, a chest rig with flat pouches, a suppressed rifle with a short barrel, a small pack and knee pads. Paint: olive-green and brown blotch camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, Cold War era kit: a soft cap with a face scarf, a plain belt harness with pouches, a rifle with a folding stock and a suppressor, a small pack, soft boots.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer kit: dark digital camouflage with integrated radios and optics: a helmet with a headset and goggles, a dark chest rig with modular pouches, a compact suppressed rifle with a sight, a radio on the chest.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future kit: sealed helmets and adaptive-camouflage suits: a sealed smooth helmet with a built-in display visor, an adaptive-camouflage suit, a slim armoured vest, a compact weapon with an integrated sight.

#### China

- **Setting of the card scene:** green farmland hills with terraced fields and a few tall poplars under a slightly hazy sky, on a rough yellow-brown dirt track.
- **Family look:** Family look (China, its own lines): a slim, tidy operator in a rounded helmet with a face cover, a neat chest rig with squared pouches, a compact rifle, a slim pack. Paint: green-and-brown digital camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, Cold War era kit: a soft cap, a plain canvas belt with squared pouches, a short rifle with a folding stock and a suppressor, a small bag, soft boots.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer kit: dark digital camouflage with integrated radios and optics: a helmet with a headset and goggles, a neat dark chest rig, a compact rifle with a sight and a suppressor, a radio on the chest.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future kit: sealed helmets and adaptive-camouflage suits: a sealed smooth helmet with a built-in display visor, an adaptive-camouflage suit, a slim armoured vest, a compact weapon with an integrated sight.

#### Europe

- **Setting of the card scene:** gentle temperate farmland with hedgerows, fields and a few tall poplar trees, a distant wooded ridge, on a gravel-and-earth farm track.
- **Family look:** Family look (Europe): a lean, practical operator in a rounded modern helmet with ear defenders, a plate-carrier vest with tidy pouches, a compact rifle, a medium pack. Paint: a grey-green and brown splinter camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, Cold War era kit: a soft beret-like cap, a plain lightweight vest with a few pouches, a compact submachine gun with a suppressor, a radio handset, soft boots.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer kit: dark digital camouflage with integrated radios and optics: a helmet with a headset, ear defenders and goggles, a dark vest with tidy modular pouches, a compact rifle with a sight and a suppressor.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future kit: sealed helmets and adaptive-camouflage suits: a sealed smooth helmet with a built-in display visor, an adaptive-camouflage suit, a slim armoured vest, a compact weapon with an integrated sight.

#### Export

- **Setting of the card scene:** a dry savanna with scattered flat-topped acacia trees, red-brown earth and tufts of dry grass, on a red-brown dirt road.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, practical operator with mixed, worn kit, a scarf at the neck, a simple vest, an older rifle, a faded pack. Paint: a faded khaki and olive desert camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, post-war kit: a soft hat with a scarf, a canvas belt with pouches, an older rifle with a wooden-look stock, a faded canvas pack, worn boots.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer kit: dark camouflage with radios and optics: a helmet with a headset, a chest rig with flat pouches, a rifle with a curved magazine and a sight, a radio on the chest, a scarf.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future kit: modern export kit: a helmet with a rail and a visor, a plate-carrier vest with bolt-on pouches, a compact weapon with a sight, knee pads, a practical, mixed look made to be sold to many armies.

### Mobile jammer vehicle (an electronic-warfare vehicle) (`jam`): 45 prompts, built from these words

Class of picture: `gnd`. Files: `assets/art-src/ul-jam-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-jam-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single mobile jammer vehicle (an electronic-warfare vehicle), seen from a front three-quarter side view from slightly above (about 30 degrees down), its front turned toward the lower right of the picture so that the viewer sees its front and one long side. The whole vehicle is centred left to right and top to bottom, and its full length (any gun barrel or boom included) spans about 85 percent of the picture's width; the entire vehicle, wheels or tracks included, is inside the frame with a margin all round. Only the mobile jammer vehicle (an electronic-warfare vehicle): no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it.
- **Top-down frame:** A single mobile jammer vehicle (an electronic-warfare vehicle), seen exactly straight down from above (a true top-down plan view), its front pointing to the top of the picture. The whole vehicle is centred left to right and top to bottom, and its full length (any gun barrel or boom included) fills about 90 percent of the picture's height. Only the mobile jammer vehicle (an electronic-warfare vehicle): no crew, no other vehicle, no ground, no track marks, no shadow on the background.
- **Card scene:** "A single mobile jammer vehicle (an electronic-warfare vehicle) parked beside a dirt road with its antennas raised and angled up at the sky, a faint shimmer in the air above them. The setting: <the group's setting>. Seen from a low front three-quarter angle slightly above ground level, the vehicle fills about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one vehicle: no crew visible, no other vehicle, no people, no buildings, no signs. The mobile jammer vehicle (an electronic-warfare vehicle) is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** a wide dry grassland valley with low rolling hills, a few sparse trees and scrub bushes, and a broad road of pale tan packed dirt.
- **Family look:** Family look (US/NATO): a heavy, boxy, slab-sided armoured truck or tracked carrier with a flat-sided equipment shelter, tall slim antenna masts and flat antenna panels, matte finish. Paint: matte sand-tan.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a boxy tracked carrier with a flat equipment box, four tall whip antennas on the roof, a small dish on a short mast, stowage boxes.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new vehicle with a large dish array: a heavy six-wheeled truck with a large boxy shelter, a big rotating dish array on top, two tall folding masts, outrigger jacks.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, flat conformal antenna panels on an angular hull: a low angular armoured carrier with flat panels along the sides and roof, a slim retractable mast, no visible dishes, full skirts.

#### Eastern

- **Setting of the card scene:** a wide open steppe of pale green and golden grass with a line of birch trees and the edge of a dark pine forest in the distance, on a rutted brown dirt road.
- **Family look:** Family look (Eastern): a big eight-wheeled heavy truck with a tall boxy shelter, many tall antennas and a round or folding dish array, outrigger jacks, spare wheels. Paint: dark olive-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a six-wheeled truck with a tall boxy shelter, three tall folding antenna masts, a small round dish, outrigger jacks.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new vehicle with a large dish array: an eight-wheeled truck with a large shelter, a large array of dishes on a raised arm, a tall mast, outrigger jacks, a roof machine gun.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, flat conformal antenna panels on an angular hull: a low, angular armoured eight-wheeled body with flat panels along the sides and roof, a slim mast, a clean low-signature look.

#### China

- **Setting of the card scene:** green farmland hills with terraced fields and a few tall poplars under a slightly hazy sky, on a rough yellow-brown dirt track.
- **Family look:** Family look (China, its own lines): a clean, boxy wheeled truck with a sloped angular shelter, neat rectangular antenna panels and a folding dish, outrigger jacks. Paint: plain mid-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a modest design: a six-wheeled truck with a small boxy shelter, two tall whip antennas, a small dish on a mast, outrigger jacks.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new vehicle with a large dish array: an eight-wheeled truck with a large sloped shelter, a large array of rectangular antenna panels and dishes on a raised arm.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, flat conformal antenna panels on an angular hull: a low, angular wheeled body with flat panels built into its sides and roof, a slim mast, a smooth clean look.

#### Europe

- **Setting of the card scene:** gentle temperate farmland with hedgerows, fields and a few tall poplar trees, a distant wooded ridge, on a gravel-and-earth farm track.
- **Family look:** Family look (Europe): a sleek, low, smoothly sloped wheeled or tracked carrier with a rounded shelter, a slim telescopic mast and neat flat antennas, a clean polished look. Paint: dark grey-green.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a light four-wheeled utility truck with a small boxy shelter, three whip antennas, a small dish on a short mast.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a new vehicle with a large dish array: a six-wheeled sloped carrier with a rounded shelter, a large dish array on a raised arm, a telescopic mast, outrigger jacks.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, flat conformal antenna panels on an angular hull: a low faceted wheeled carrier with flat panels along the sides and roof, a slim telescopic mast, full skirts.

#### Export

- **Setting of the card scene:** a dry savanna with scattered flat-topped acacia trees, red-brown earth and tufts of dry grass, on a red-brown dirt road.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a plain truck with a bolt-on equipment box and mixed antennas that look fitted by the buyer. Paint: faded ochre-sand with a few patches of darker touch-up paint.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a post-war pattern: a plain six-wheeled truck with a canvas-covered box, two whip antennas, a small dish on a pole, spare wheels.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a widely exported 1980s pattern: a six-wheeled truck with a tall boxy shelter, a round dish on an arm, three tall folding masts, outrigger jacks.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a modern export-grade design: a modular eight-wheeled truck with a boxy shelter, flat antenna panels, a slim mast, bolt-on armour, a practical look made to be sold to many armies.


### Paratrooper (an airborne infantry soldier) (`para`): 45 prompts, built from these words

Class of picture: `man`. Files: `assets/art-src/ul-para-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-para-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single paratrooper (an airborne infantry soldier), seen from a front three-quarter side view from slightly above (about 30 degrees down), standing in a ready pose with the weapon held ready, turned toward the lower right of the picture so that the viewer sees the front and one side. The whole soldier, from the boots to the top of the helmet and the weapon, is centred left to right and top to bottom and fills about 85 percent of the picture's height; the entire figure is inside the frame with a margin all round. Only this one paratrooper (an airborne infantry soldier): no other person, no vehicle, no ground, only a faint, tight soft shadow under the boots.
- **Top-down frame:** A single paratrooper (an airborne infantry soldier), seen exactly straight down from above (a true top-down plan view), facing the top of the picture, the weapon held ready in front. The whole soldier (head, shoulders, arms, pack and weapon) is centred left to right and top to bottom and fills about 85 percent of the picture's height. Only this one paratrooper (an airborne infantry soldier): no other person, no vehicle, no ground, no shadow on the background.
- **Card scene:** "A single paratrooper (an airborne infantry soldier) just landed in an open field after a parachute drop, a collapsed parachute canopy spread on the grass behind him, moving forward with his weapon held ready, not looking at the viewer. The setting: <the group's setting>. Seen from a low front three-quarter angle at about eye height, the soldier fills about half the picture's height and stands in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one soldier: no other person, no vehicle, no buildings, no signs, no markings. The paratrooper (an airborne infantry soldier) is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** a wide dry grassland valley with low rolling hills, a few sparse trees and scrub bushes, and a broad road of pale tan packed dirt.
- **Family look:** Family look (US/NATO): an airborne soldier in a rounded paratrooper helmet with a chinstrap, a webbing harness with a strapped-on reserve parachute pack on the chest, a large rucksack, a folding-stock carbine, jump boots. Paint: a tan-and-brown multi-terrain camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, Cold War era kit: a rounded steel-look helmet with a cover net, a canvas webbing harness with a small square reserve pack on the chest, a bedroll on the back, a carbine with a folding stock, high laced boots.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer kit: modern kit: a lightweight round helmet with a headset and goggles, a harness with pouches and a reserve pack on the chest, a rucksack, a short rifle with a sight, knee pads.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, near-future kit: a sleek light helmet with a built-in visor and radio, a slim harness with modular pouches, a flat low-profile pack, a compact rifle with an integrated sight, light armoured knee guards.

#### Eastern

- **Setting of the card scene:** a wide open steppe of pale green and golden grass with a line of birch trees and the edge of a dark pine forest in the distance, on a rutted brown dirt road.
- **Family look:** Family look (Eastern): an airborne soldier in a rounded helmet with a chinstrap, a chest rig, a short rucksack with side pouches, a folding-stock rifle, a strapped-on reserve parachute pack on the chest, tall boots. Paint: olive-green and brown blotch camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, Cold War era kit: a rounded helmet with a cover net, a canvas harness with a small square reserve pack, a small round rucksack, a rifle with a folding stock, tall laced boots.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer kit: modern kit: a rounded helmet with a headset, a harness with flat pouches and a reserve pack, a medium rucksack, a short rifle with a sight, knee pads.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, near-future kit: a sleek light helmet with a built-in visor, a slim harness with modular pouches, a flat low pack, a compact rifle with an integrated sight, light knee guards.

#### China

- **Setting of the card scene:** green farmland hills with terraced fields and a few tall poplars under a slightly hazy sky, on a rough yellow-brown dirt track.
- **Family look:** Family look (China, its own lines): a tidy airborne soldier in a rounded helmet with a chinstrap, a neat harness with squared pouches and a reserve pack on the chest, a slim rucksack, a short rifle, soft boots. Paint: green-and-brown digital camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, Cold War era kit: a soft rounded helmet with a net, a canvas harness with a small square reserve pack, a small rucksack, a short rifle with a folding stock, canvas boots.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer kit: modern kit: a rounded helmet with a headset, a neat harness with squared pouches and a reserve pack, a slim rucksack, a compact rifle with a sight, knee pads.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, near-future kit: a sleek light helmet with a built-in visor, a slim harness with modular pouches, a flat low pack, a compact rifle with an integrated sight, light knee guards.

#### Europe

- **Setting of the card scene:** gentle temperate farmland with hedgerows, fields and a few tall poplar trees, a distant wooded ridge, on a gravel-and-earth farm track.
- **Family look:** Family look (Europe): a lean airborne soldier in a rounded modern helmet with a chinstrap, a harness with tidy pouches and a reserve parachute pack on the chest, a medium rucksack, a compact rifle. Paint: a grey-green and brown splinter camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, Cold War era kit: a rounded helmet with a cover net, a canvas harness with a small reserve pack, a bedroll and small rucksack, a short rifle with a folding stock, laced boots.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer kit: modern kit: a light round helmet with a headset and goggles, a harness with tidy pouches and a reserve pack, a medium rucksack, a compact rifle with a sight.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, near-future kit: a sleek light helmet with a built-in visor, a slim harness with modular pouches, a flat low pack, a compact rifle with an integrated sight, light knee guards.

#### Export

- **Setting of the card scene:** a dry savanna with scattered flat-topped acacia trees, red-brown earth and tufts of dry grass, on a red-brown dirt road.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain airborne soldier with mixed, worn kit, an old rounded helmet with a chinstrap, a canvas harness with a reserve pack on the chest, a faded rucksack, an older rifle. Paint: a faded khaki and olive desert camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, post-war kit: an old rounded helmet with a net, a canvas harness with a square reserve pack, a faded canvas rucksack, a rifle with a wooden-look stock, worn boots.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer kit: modern kit: a rounded helmet with a headset, a harness with flat pouches and a reserve pack, a rucksack, a rifle with a curved magazine and a sight, a scarf.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, modern export kit: a light helmet with a rail and a visor, a harness with bolt-on pouches and a reserve pack, a compact weapon with a sight, knee pads, a practical, mixed look made to be sold to many armies.


### Heavy bomber (a large long-range strategic bomber) (`bomb`): 45 prompts, built from these words

Class of picture: `air`. Files: `assets/art-src/ul-bomb-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-bomb-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single heavy bomber (a large long-range strategic bomber), seen from a front three-quarter side view from slightly above (about 30 degrees down), shown in level flight attitude as a studio model (landing gear up, no stand), its nose turned toward the lower right of the picture so that the viewer sees its nose and one long side. The whole aircraft is centred left to right and top to bottom, and its full length or its full wingspan, whichever is larger, spans about 85 percent of the picture's width; the entire aircraft, wingtips and tail included, is inside the frame with a margin all round. Only the heavy bomber (a large long-range strategic bomber): no pilot visible, no other aircraft, no ground, no clouds, no contrail, only a faint, tight soft shadow below it.
- **Top-down frame:** A single heavy bomber (a large long-range strategic bomber), seen exactly straight down from above (a true top-down plan view), its nose pointing to the top of the picture, wings spread out to both sides. The whole aircraft is centred left to right and top to bottom, and the larger of its length (nose to tail) and its wingspan (wingtip to wingtip) fills about 90 percent of the picture. Only the heavy bomber (a large long-range strategic bomber): no pilot visible, no other aircraft, no ground, no clouds, no shadow on the background.
- **Card scene:** "A single heavy bomber (a large long-range strategic bomber) cruising high and level with its bomb bay doors closed, a faint vapour trail behind its engines. The setting: <the group's setting>. Seen from a low three-quarter angle slightly below and beside it, banking gently, the aircraft fills about 60 percent of the picture's width, in the middle of the frame, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one aircraft: no pilot visible, no other aircraft, no people, no buildings, no signs, no markings. The heavy bomber (a large long-range strategic bomber) is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** a deep clear blue sky above a sunlit sea of white cloud far below.
- **Family look:** Family look (US/NATO): a huge, long-winged bomber with a long slim fuselage, many engines in pods or blended into the wing roots, a tall tail fin, a glazed nose, a clean grey finish. Paint: pale ghost-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a huge high-winged bomber with long straight wings, eight engines in four paired pods under the wings, a tall tail fin, a long slim fuselage, a tail gun turret.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a swing-wing design: a long, lean bomber with swept-back wings blended into the body, four engines in two blended pairs at the rear, a small tail fin, a long pointed nose.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a modernised near-future design: a huge long-winged bomber with eight sleek faired engine pods, a tall tail fin, a smooth glass-free nose, clean smooth skin, an internal weapons bay.

#### Eastern

- **Setting of the card scene:** a pale blue sky with high thin cirrus streaks above a far-below patchwork of golden steppe and dark pine forest.
- **Family look:** Family look (Eastern): a big, heavy, swept-wing bomber with a long fuselage, two large engines blended into the rear body, a tall tail fin, a long pointed nose with a refuelling probe. Paint: pale grey with a darker grey-green upper surface.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a swept-wing twin-engine bomber with its engines buried in the wing roots, a tall tail fin, a glazed nose, a tail gun turret, a long fuselage.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a swing-wing design: a big supersonic-looking bomber with variable-sweep wings, two huge engines in the rear body with large side intakes, a tall tail fin, a long pointed nose.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a modernised near-future design: a huge swing-wing bomber with a smooth blended body, four large engines under the rear wings, a white-and-grey smooth finish, an internal weapons bay.

#### China

- **Setting of the card scene:** a hazy pale-blue sky with soft white clouds above distant green mountains far below.
- **Family look:** Family look (China, its own lines): a medium-large swept-wing bomber with two engines at the wing roots, a tall tail fin, a rounded glazed nose, a clean tidy finish. Paint: pale blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a straight-winged twin-engine bomber with engines in nacelles under the wings, a rounded glazed nose, a single tall tail fin, a tail turret.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a modernised swept-wing design: a bomber with two large engines blended into the wing roots with side intakes, a tall tail fin, a refuelling probe, pylons under the wings.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a swept-wing bomber with a smooth faired body, large engines with faired intakes, a refuelling probe, a smooth glass-free nose, an internal bay and wing pylons.

#### Europe

- **Setting of the card scene:** a bright sky with scattered cumulus clouds above distant green fields and a river far below.
- **Family look:** Family look (Europe): a large, smooth, long-winged bomber with a rounded body, engines in pods or blended into the wings, a single tall tail fin, a polished finish. Paint: medium blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a huge high-winged bomber with long straight wings, eight engines in four paired pods, a tall tail fin, a long slim fuselage.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a swing-wing design: a long, lean bomber with swept-back wings blended into the body, four engines at the rear, a small tail fin, a long pointed nose.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a modernised near-future design: a huge long-winged bomber with eight sleek faired engine pods, a tall tail fin, clean smooth skin, an internal weapons bay.

#### Export

- **Setting of the card scene:** a hot clear blue sky with a few small clouds above distant dry brown hills and a red-brown plain far below.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical swept-wing bomber, an older shape with bolt-on kits that look fitted by the buyer. Paint: sand and olive-green camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a post-war pattern: a twin-engine swept-wing bomber with engines at the wing roots, a glazed nose, a single tail fin, a tail gun turret, a plain finish.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a widely exported 1980s pattern: a swing-wing bomber with two huge rear engines, large side intakes, a single tall tail fin, a long nose, a plain finish.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a modern export-grade design: a swept-wing twin-engine bomber with new faired engines, a refuelling probe, pylons under the wings, a smooth nose, a practical look made to be sold to many air forces.


### Maritime patrol aircraft (a large aircraft that searches the sea) (`mpa`): 45 prompts, built from these words

Class of picture: `air`. Files: `assets/art-src/ul-mpa-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-mpa-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

- **Side frame:** A single maritime patrol aircraft (a large aircraft that searches the sea), seen from a front three-quarter side view from slightly above (about 30 degrees down), shown in level flight attitude as a studio model (landing gear up, no stand), its nose turned toward the lower right of the picture so that the viewer sees its nose and one long side. The whole aircraft is centred left to right and top to bottom, and its full length or its full wingspan, whichever is larger, spans about 85 percent of the picture's width; the entire aircraft, wingtips and tail included, is inside the frame with a margin all round. Only the maritime patrol aircraft (a large aircraft that searches the sea): no pilot visible, no other aircraft, no ground, no clouds, no contrail, only a faint, tight soft shadow below it.
- **Top-down frame:** A single maritime patrol aircraft (a large aircraft that searches the sea), seen exactly straight down from above (a true top-down plan view), its nose pointing to the top of the picture, wings spread out to both sides. The whole aircraft is centred left to right and top to bottom, and the larger of its length (nose to tail) and its wingspan (wingtip to wingtip) fills about 90 percent of the picture. Only the maritime patrol aircraft (a large aircraft that searches the sea): no pilot visible, no other aircraft, no ground, no clouds, no shadow on the background.
- **Card scene:** "A single maritime patrol aircraft (a large aircraft that searches the sea) flying low over the sea with its radar searching, a small sonar buoy falling from its belly toward the waves. The setting: <the group's setting>. Seen from a low three-quarter angle slightly below and beside it, banking gently, the aircraft fills about 60 percent of the picture's width, in the middle of the frame, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one aircraft: no pilot visible, no other aircraft, no people, no buildings, no signs, no markings. The maritime patrol aircraft (a large aircraft that searches the sea) is described in words as: <the look's words>"

#### US/NATO

- **Setting of the card scene:** a deep clear blue sky above a sunlit sea of white cloud far below.
- **Family look:** Family look (US/NATO): a medium four-engine propeller or twin-jet patrol aircraft with a long round fuselage, a long rear tail boom with a magnetic detector sting, a belly radome and weapons under the wings. Paint: pale ghost-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a four-engine turboprop aircraft with a long round fuselage, a long tail boom sting, a chin radome, a weapons bay and pylons under the wings, a tall tail fin.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a modern twin-jet design: a medium twin-jet airliner-based aircraft with swept wings, a belly radome, a weapons bay, pylons under the wings, a small raised wingtip.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a large unmanned long-wing patrol aircraft with a bulbous nose radome, very long thin wings, a V-shaped tail, no cockpit windows, a single engine at the rear.

#### Eastern

- **Setting of the card scene:** a pale blue sky with high thin cirrus streaks above a far-below patchwork of golden steppe and dark pine forest.
- **Family look:** Family look (Eastern): a big rugged patrol aircraft with a long fuselage, a large belly radome, a tail sting, a weapons bay, many antennas and a tall tail fin. Paint: pale grey with a darker grey-green upper surface.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a big gull-winged flying boat with two engines on top of the wings, a tall tail fin, a rounded hull, a nose gun position, sea-going and rugged.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a heavy design: a four-engine turboprop with large contra-rotating propellers, a long fuselage, a tail sting, a belly radome, a weapons bay, a tall tail fin.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a modern design: a four-engine turboprop patrol aircraft with new faired nacelles, a large belly radome, a tail sting, a smooth fuselage, a weapons bay.

#### China

- **Setting of the card scene:** a hazy pale-blue sky with soft white clouds above distant green mountains far below.
- **Family look:** Family look (China, its own lines): a tidy medium patrol aircraft with a long fuselage, turboprop engines, a belly radome, a tail boom sting and a clean finish. Paint: pale blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a large flying boat with four propeller engines on a high wing, a rounded hull, a tall tail fin, a gun position in the nose.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a modern design: a four-engine turboprop patrol aircraft with a chin radome, a tail sting, a belly radome, a weapons bay, a tall tail fin.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a large twin-turboprop patrol aircraft with a chin radome, a long tail sting, a smooth faired fuselage, a weapons bay, a clean finish.

#### Europe

- **Setting of the card scene:** a bright sky with scattered cumulus clouds above distant green fields and a river far below.
- **Family look:** Family look (Europe): a sleek medium twin-engine patrol aircraft with a rounded fuselage, a belly radome, a tail sting, weapons pylons and a clean polished finish. Paint: medium blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a twin-engine turboprop patrol aircraft with a long rounded fuselage, a belly radome, a tail fin, pylons under the wings, a bubble observation window.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a modern design: a twin-engine turboprop patrol aircraft with large propellers, a long fuselage, a chin radome, a tail sting, pylons under the wings.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future design: a twin-jet patrol aircraft with swept wings, a belly radome, a weapons bay, pylons under the wings, a small raised wingtip.

#### Export

- **Setting of the card scene:** a hot clear blue sky with a few small clouds above distant dry brown hills and a red-brown plain far below.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical patrol aircraft, a transport-aircraft shape with bolt-on radar and sensors that look fitted by the buyer. Paint: sand and olive-green camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a post-war pattern: a twin-engine flying boat with engines on a high wing, a rounded hull, a nose gun position, a plain finish.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a widely exported 1980s pattern: a four-engine turboprop with a long fuselage, a belly radome, a tail sting, pylons under the wings, a plain finish.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a modern export-grade design: a twin-turboprop transport aircraft converted to patrol work, a belly radome, a chin sensor ball, a bolt-on weapons pylon, a practical look made to be sold to many air forces.


### Marine (an amphibious infantry soldier) (`mar`): 45 prompts, built from these words

Class of picture: `man`. Files: `assets/art-src/ul-mar-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-mar-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

Owner's defaults for the Marines (28 November 2026): the amphibious kit is clearly visible in all three pictures (life vest or flotation collar, waterproof bags, wet-weather gear; the side and top frames say so), the card scene is a beach landing with one small empty inflatable boat (the class's "no vehicle" frame is widened for that one boat only), the card scenes are set on each group's own beach instead of the dirt road, and every description ends with the look-alike rule. These two additions (`scene_frame`, `rule` of `unit_def`) leave every earlier unit's prompts word for word as they were.

- **Side frame:** A single marine (an amphibious infantry soldier), seen from a front three-quarter side view from slightly above (about 30 degrees down), standing in a ready pose with the weapon held ready, turned toward the lower right of the picture so that the viewer sees the front and one side. The whole soldier, from the boots to the top of the helmet and the weapon, is centred left to right and top to bottom and fills about 85 percent of the picture's height; the entire figure is inside the frame with a margin all round. Only this one marine (an amphibious infantry soldier): no other person, no vehicle, no ground, only a faint, tight soft shadow under the boots. His amphibious kit is clearly visible in this view: the life vest or flotation collar, the waterproof bag on the pack and the wet-weather gear.
- **Top-down frame:** A single marine (an amphibious infantry soldier), seen exactly straight down from above (a true top-down plan view), facing the top of the picture, the weapon held ready in front. The whole soldier (head, shoulders, arms, pack and weapon) is centred left to right and top to bottom and fills about 85 percent of the picture's height. Only this one marine (an amphibious infantry soldier): no other person, no vehicle, no ground, no shadow on the background. His amphibious kit is clearly visible in this view: the life vest or flotation collar, the waterproof bag on the pack and the wet-weather gear.
- **Card scene:** "A single marine (an amphibious infantry soldier) wading ashore through the shallow surf onto the beach with his weapon held ready, sea water splashing around his legs, a small empty inflatable landing boat pulled up on the wet sand behind him, not looking at the viewer. The setting: <the group's setting>. Seen from a low front three-quarter angle at about eye height, the soldier fills about half the picture's height and stands in the middle of the frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one soldier and his one small empty boat: no other person, no other boat, no ship, no vehicle, no buildings, no signs, no markings. The marine (an amphibious infantry soldier) is described in words as: <the look's words>"
- **Extra sentence after the tail of every description:** Look-alike rule: the checker must not be able to name a real model from it; no real uniform, camouflage pattern, insignia, badge or flag is copied.

#### US/NATO

- **Setting of the card scene:** a wide beach of pale tan sand with low grassy dunes and scrub bushes behind it, gentle white surf rolling in from a blue ocean under a clear sky with a few high clouds.
- **Family look:** Family look (US/NATO): a stocky, heavily equipped marine rifleman built for landings from the sea: a rounded combat helmet, an inflatable life vest worn over a vest of pouches, a waterproof roll-top bag strapped to a big pack, a hooded wet-weather jacket, a rifle, sturdy boots. Paint: a green, brown and tan coastal camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, Cold War era kit: a rounded steel-look helmet with a cloth cover, a bulky olive inflatable life vest over a webbing harness with ammunition pouches and two canteens, a rubberised waterproof bag lashed to a canvas pack, a hooded rain poncho rolled on top of the pack, a plain long rifle, high laced boots.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer, modern kit: a visored helmet with a night-vision mount, a slim inflatable life-vest collar on the shoulders of a plate-carrier vest with modular pouches, a roll-top waterproof dry bag on a modern pack, a hooded waterproof jacket, a compact rifle with a sight, knee pads.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, near-future kit: a sealed helmet with a built-in display visor, a smooth faceted armour vest with a built-in self-inflating flotation collar, a sealed waterproof pack, a hooded water-shedding suit, light powered exoskeleton frames on the legs, a compact rifle with an integrated sight.

#### Eastern

- **Setting of the card scene:** a cold grey pebble beach on a northern sea under a pale, cloudy northern sky, grey-green surf, a line of birch trees and the dark edge of a pine forest behind the shore.
- **Family look:** Family look (Eastern): a lean, tough marine in a rounded helmet and a dark smock, a chest rig of flat pouches, a dark inflatable life vest, a rubberised waterproof bag on a small pack with a rain cape rolled on top, a rifle with a curved magazine, tall rubber-soled boots. Paint: a dark green and black blotch camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, Cold War era kit: a rounded steel helmet, a dark canvas smock, a bulky inflatable life vest over a leather-look belt harness with ammunition pouches, a rubberised waterproof bag on a small canvas pack, a rain cape rolled on top, a rifle with a curved magazine and a folding stock, tall boots.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer, modern kit: a helmet with a rail mount and goggles, a chest rig with modular pouches over body-armour plates, a slim inflatable life-vest collar, a roll-top waterproof bag on a medium pack, a hooded waterproof jacket, a compact rifle with a sight and a suppressor, knee pads.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, near-future kit: a sealed helmet with a built-in display visor, a smooth faceted armour vest with a self-inflating flotation collar, a sealed waterproof pack, a dark water-shedding suit, a compact rifle with an integrated sight, light knee guards.

#### China

- **Setting of the card scene:** a hazy beach of yellow sand with green hills and terraced slopes behind it, small waves on a blue-green coastal sea under a pale, slightly hazy sky.
- **Family look:** Family look (China, its own lines): a slim, upright marine in a clean tidy uniform, a rounded helmet with a net cover, a neat chest rig with squared pouches, a compact life vest, a squared waterproof bag on a compact backpack, a light rain jacket, a short-barrelled rifle. Paint: a blue-grey and sea-green digital camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, Cold War era kit: a plain rounded helmet, a simple canvas belt with squared pouches, a bulky canvas-covered flotation vest, a rubberised bag on a small green canvas pack, a rain cape, a long rifle with a curved magazine, canvas boots.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer, modern kit: a helmet with a visor and a camera mount, a neat chest rig with squared pouches, a slim inflatable life-vest collar, a squared waterproof dry bag on a compact pack, a hooded waterproof jacket, a compact rifle with a sight, knee pads.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, near-future kit: a sealed helmet with a built-in display visor, a smooth faceted armour vest with a self-inflating flotation collar, a neat sealed waterproof pack, a slim water-shedding suit with squared panels, light powered exoskeleton frames on the legs, a compact rifle with an integrated sight.

#### Europe

- **Setting of the card scene:** a sandy Atlantic beach with white-capped waves, grassy dunes and a distant wooded headland, tall cumulus clouds in a bright sky.
- **Family look:** Family look (Europe): a practical, slim commando-style marine in a rounded modern helmet, a plate-carrier vest with tidy pouches and a slim life vest, a waterproof bag on a medium pack, a hooded windproof smock, a compact rifle held close, ear protection. Paint: a grey-green and sand splinter camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, Cold War era kit: a rounded steel-style helmet with a net, a hooded windproof smock, a bulky inflatable life vest over a webbing harness, a rubberised waterproof bag lashed to a canvas pack, a plain rifle with a plastic-look stock, boots with gaiters.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer, modern kit: a helmet with a visor and ear defenders, a plate-carrier vest with tidy modular pouches and a slim inflatable life-vest collar, a roll-top dry bag on a medium pack, a hooded waterproof smock, a compact rifle with a sight, knee and elbow pads.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, near-future kit: a sealed helmet with a built-in display visor, a smooth faceted armour vest with a self-inflating flotation collar, a sealed waterproof pack, a hooded water-shedding smock, a compact rifle with an integrated sight, light knee guards.

#### Export

- **Setting of the card scene:** a tropical beach of pale sand with a few leaning palm trees, turquoise surf and a hot clear blue sky with a few small white clouds.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, practical marine with mixed, worn kit, a rounded helmet, an old-pattern life vest, a simple vest, a rubberised waterproof bag, a rain poncho, an older rifle, a faded canvas pack. Paint: a faded olive and sand-khaki camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, post-war kit: a rounded steel helmet with a cloth cover, a bulky padded life vest, a canvas belt with pouches, a rubberised waterproof bag on a faded canvas pack, a rolled rain poncho, a plain long rifle with a wooden-look stock, worn boots.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer, widely exported 1980s kit: a helmet with a net cover, a chest rig of flat pouches, an inflatable life vest, a waterproof bag on a bigger pack, a hooded rain jacket, a rifle with a curved magazine and a folding stock, a scarf.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, modern export kit: a helmet with a rail and a visor, a plate-carrier vest with bolt-on pouches and a slim inflatable life-vest collar, a roll-top dry bag on a practical pack, a hooded waterproof jacket, a compact rifle with a sight, knee pads, a practical, mixed look made to be sold to many armies.


### Airborne early-warning aircraft (a large radar plane) (`awacs`): 45 prompts, built from these words

Class of picture: `air`. Files: `assets/art-src/ul-awacs-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).

Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-awacs-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section "The other units" above; what is unit-specific is below.

What batch A of set 4 taught, in these prompts (28 November 2026): the earlier Maritime Patrol set came out looking like real airliners, so each of the 15 looks describes its own airframe (the nose, the wing, the number and place of the engines, the number of blades on each propeller, the tail, and the radar dome's shape and mounting), the side and top frames say that these are the same in every view (the three-way check of the patrol aircraft flagged the propeller blades of 8 of the 15 top-downs), and every description ends with the look-alike rule below, which names the airliner and radar-plane makers to stay away from. Batch A's side views came with long cast shadows that the cut-out kept as a slab, so an aircraft in flight now has no shadow at all in its side view (its own side frame and side style below; the top-down already had none). The card scene is seen from slightly above instead of from below, so the dome on its back shows. These additions (`side_frame`, `side_style`, `scene_frame`, `rule` of `unit_def`) leave every earlier unit's prompts word for word as they were. After the pictures: check the cut-outs for slabs and for holes (the open gap between a strut-mounted dome and the body is a real hole; a filled one, or a hole in the body, is a fault).

- **Side frame:** A single airborne early-warning aircraft (a large radar plane), seen from a front three-quarter side view from slightly above (about 30 degrees down), shown in level flight attitude as a studio model (landing gear up, no stand), its nose turned toward the lower right of the picture so that the viewer sees its nose and one long side. The whole aircraft is centred left to right and top to bottom, and its full length or its full wingspan, whichever is larger, spans about 85 percent of the picture's width; the entire aircraft, wingtips and tail included, is inside the frame with a margin all round. Only the airborne early-warning aircraft (a large radar plane): no pilot visible, no other aircraft, no ground, no clouds, no contrail, no shadow at all: it is in flight, so no cast shadow and no contact shadow on the background, only the plain grey all round it. Its radar dome (its shape, size, mounting and place along the body) is clearly visible on its back; the dome, the number and place of the engines, the number of blades on each propeller and the shape of the nose, wings and tail are exactly as described and the same in every view.
- **Top-down frame:** A single airborne early-warning aircraft (a large radar plane), seen exactly straight down from above (a true top-down plan view), its nose pointing to the top of the picture, wings spread out to both sides. The whole aircraft is centred left to right and top to bottom, and the larger of its length (nose to tail) and its wingspan (wingtip to wingtip) fills about 90 percent of the picture. Only the airborne early-warning aircraft (a large radar plane): no pilot visible, no other aircraft, no ground, no clouds, no shadow on the background. Its radar dome (its shape, size, mounting and place along the body) is clearly visible on its back; the dome, the number and place of the engines, the number of blades on each propeller and the shape of the nose, wings and tail are exactly as described and the same in every view.
- **Card scene:** "A single airborne early-warning aircraft (a large radar plane) flying high on its slow, wide patrol orbit, watching the sky with the big radar dome on its back. The setting: <the group's setting>. Seen from a three-quarter angle slightly above and beside it, so that the radar dome on its back is clearly visible, banking gently, the aircraft fills about 60 percent of the picture's width, in the middle of the frame, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one aircraft: no pilot visible, no other aircraft, no people, no buildings, no signs, no markings. The airborne early-warning aircraft (a large radar plane) is described in words as: <the look's words>"
- **Extra sentence after the tail of every description:** Look-alike rule: it must not look like any real aircraft type (no Boeing/Airbus/Ilyushin/Tupolev/Shaanxi/Embraer/Saab airliner or AEW type, and no other real airliner, transport or radar plane); the checker must not be able to name a real model from it; its nose, wings, engines, tail and radar dome are this game's own design, exactly as described here.
- **Side view style (this unit's own, instead of the shared one):** Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with no cast shadow on the background. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed view for every picture: a front three-quarter side view from slightly above (about 30 degrees down, the classic strategy-game model angle, the same angle family as the attached buildings), the unit's front turned toward the lower right of the picture, at the same scale. Background: a plain, flat, uniform light grey (#D9D9D9) with no shadow at all; no base slab, no ground tile, no terrain, no horizon. Cropped and centred so the whole unit (nose to tail, including any gun barrel) fills about 85 percent of the picture's width, nothing cut off. Square 1:1 image. Original generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.

#### US/NATO

- **Setting of the card scene:** a deep clear blue sky above a sunlit sea of white cloud far below.
- **Family look:** Family look (US/NATO): a long, slim, sleek radar plane with crisp straight-edged shapes, a clean grey finish and a large radar dome carried high on its back. Paint: pale ghost-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a long, slim fuselage with a short rounded nose and a stepped cockpit, a long, straight, low wing set far back on the body, four turboprop engines in slim nacelles that reach well behind the wing, each propeller with four blades, a single very tall, straight-edged tail fin with a square top and the tailplane at its base, and a large round rotating saucer-shaped radar dome on one thick, swept-back blade pylon above the middle of the fuselage.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a modern twin-jet design: a long fuselage with a blunt, deep, rounded nose, a moderately swept low wing with blended, upturned wingtips, two large jet engines mounted on short pylons ABOVE the wings (over the wing, not under it), a T-tail (the tailplane on top of the fin), and a large, flattened oval rotating radar dome on two slim forward-raked struts above the rear fuselage.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future, unmanned design: a wide, flat, smoothly blended body and long swept wings in one piece with no separate fuselage and no cockpit windows, two jet engines buried in the upper rear body with flat, shielded exhausts, two small outward-canted tail fins, flat radar panels set flush into the leading edges of the wings, and a low, wide disc-shaped radar dome fused into the top of the body.

#### Eastern

- **Setting of the card scene:** a pale blue sky with high thin cirrus streaks above a far-below patchwork of golden steppe and dark pine forest.
- **Family look:** Family look (Eastern): a big, rugged, heavy high-winged radar plane with a deep, wide fuselage, many engines, a tall tail and a huge radar dome on its back. Paint: pale grey with a darker grey-green upper surface.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a deep, boxy fuselage with a glazed, stepped navigator's nose, a long, straight high wing, six turboprop engines (three on each wing), each propeller with four blades, a single tall swept fin with the tailplane set halfway up it (a cross-shaped tail), and a huge round rotating radar dome on two thick vertical struts above the FRONT half of the fuselage, ahead of the wing.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a heavy three-jet design: a wide, deep fuselage with a thick rounded radar chin under the cockpit, a swept, drooping high wing with one jet engine in a pod under each wing and a third jet engine set into the root of the tail fin, a tall swept fin with the tailplane at its base and a small bullet fairing on the fin tip, and a big round rotating radar dome on four short, thick, splayed struts above the wing.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future four-jet design: a slender fuselage with a smooth, glass-free radar nose, a long, thin, sharply swept high wing, four slim jet engines in two side-by-side pairs on pylons under the wing, a V-tail, and a fixed, non-rotating radar dome shaped like a long, flattened teardrop with flat radar faces on its sides, fused into a raised spine along the top of the fuselage.

#### China

- **Setting of the card scene:** a hazy pale-blue sky with soft white clouds above distant green mountains far below.
- **Family look:** Family look (China, its own lines): a tidy, medium-large radar plane with a clean, smooth finish, a rounded nose, neat engine nacelles and a neatly faired radar dome on top. Paint: pale blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a short, tubby fuselage with a rounded glazed nose, a straight low wing, two large turboprop engines, each propeller with five blades, a single broad, rounded tail fin, and a medium round rotating radar dome on a tripod of three short struts above the wing.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a modern four-jet design: a long, smooth fuselage with a short rounded nose, a moderately swept mid-mounted wing, four jet engines carried in pairs in two wide double nacelles under the wings, twin outward-canted tail fins, and a fixed, non-rotating radar dome shaped like a wide, flattened lens with a pale rim, sitting on one tall, narrow, streamlined pedestal above the rear fuselage.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future twin-jet design with a joined wing: a forward-swept upper wing and a backward-swept lower wing that meet at their tips (a diamond shape seen from above), the radar arrays built into the joined wings, a smooth glass-free nose, two jet engines on short pylons on each side of the rear fuselage, a single short tail fin, and a small round fixed radar dome on top of the fin.

#### Europe

- **Setting of the card scene:** a bright sky with scattered cumulus clouds above distant green fields and a river far below.
- **Family look:** Family look (Europe): a smooth, elegant, medium radar plane with a rounded body, neatly faired engines, a polished finish and a carefully faired radar dome. Paint: medium blue-grey.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a Cold War era design: a slim fuselage with a long, pointed, glazed nose, a long, gently tapered shoulder wing, four slim turboprop engines, each propeller with three blades, the tailplane set low on the rear body, and a large round rotating radar dome mounted on TOP of a tall, thick tail fin, like a mushroom cap on its stalk.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a modern twin-jet design: a slim fuselage with a long, smooth, slightly drooping tapered nose, a slender, slightly forward-swept shoulder wing, two jet engines in pods on short pylons under the wing, a gracefully curved swept fin with a long dorsal fillet and the tailplane set high on the rear body, and a long, slim, rounded radar dome shaped like a canoe laid along the top of the fuselage from behind the cockpit to the wing, faired smoothly into it with no struts.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a near-future, unmanned long-endurance design: a slim pod-like fuselage with a smooth, glass-free bulbous nose, a very long, thin, straight high wing with drooped tips, two jet engines in pods above the rear of the fuselage, twin tail booms joined by a high tailplane, and a fixed, non-rotating flat diamond-shaped radar dome on a short pylon above the wing.

#### Export

- **Setting of the card scene:** a hot clear blue sky with a few small clouds above distant dry brown hills and a red-brown plain far below.
- **Family look:** Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical radar plane, a transport-aircraft shape with a bolt-on radar dome that looks fitted by the buyer, extra antennas and patched panels. Paint: sand and olive-green camouflage.
- **Look 1 (levels 1-3):** Generation 1 of 3, the oldest, a post-war pattern: a deep, boxy fuselage with a rounded glazed nose and a raised flight deck, a straight high wing, two big round radial piston engines, each propeller with three blades, a single tall fin with a big dorsal fillet, and a round rotating radar dome on a squat, open lattice frame of thin struts above the wing, a plain finish.
- **Look 2 (levels 4-6):** Generation 2 of 3, a clearly newer design: a widely exported 1980s pattern: a deep, boxy fuselage with a stubby rounded nose and a chin radar bump, a low, straight, thick wing with an upward bend outboard of the engines (a gull wing), four turboprop engines, each propeller with four blades, two oval fins at the tips of a high tailplane (a twin-fin tail), bolt-on antenna fins along the belly, and a big round rotating radar dome on a boxy, bolted-on pedestal of flat plates above the wing.
- **Look 3 (levels 7-8):** Generation 3 of 3, the newest, a modern export-grade design: a slim fuselage with a rounded nose, a moderately swept low wing, two jet engines in pods on pylons under the wing, a plain T-tail, a fixed, non-rotating radar dome shaped like a short, thick disc with a flat top, on a pair of short, wide, swept fins above the wing, and two small bolt-on side-looking radar fairings on the forward fuselage, a practical look made to be sold to many air forces.


### Made so far, set 3 (19 November 2026, branch `unit-art-3`)

Special Forces, Paratroopers, Mobile Jammer, Heavy Bomber, Maritime Patrol Aircraft: 5 sets, 225 pictures, each look checked three ways (flags only, nothing redone).
Stopped at the $5 floor before AWACS. Not made: Stealth Bomber, the 5 unique units (prompts not yet written), AWACS (prompts written above on 28 November 2026; pictures next, batch B). Marines: prompts written above and pictures made on 28 November 2026 (batch A). The cut-outs were made with the
current `tools/prep-art.py` into a scratch folder for the owner's sheets and are not committed: they get re-packed after the atlas job merges.

### Made so far (19 November 2026, branch `unit-art-2`)

Infantry Fighting Vehicle, Mobile Artillery, Mobile SAM, Rocket Artillery, Motorized Infantry, Frigate, Cruiser, Attack Submarine, Aircraft Carrier,
Strike Fighter, Interceptor, Air Superiority Fighter, Attack Helicopter, Recon UAV, Strike Drone, Swarm Drones, Anti-Tank (missile carrier): 17 sets, 765 pictures,
plus the 15 tank looks. Not made (balance reached the $5 floor): Special Forces, Mobile Jammer (prompts written above), Maritime Patrol Aircraft, AWACS,
Heavy Bomber, Stealth Bomber and the 5 unique units (prompts not yet written). Cut-outs: `tools/prep-art.py` cuts aircraft and ships with the
segmentation model (pale grey on a pale floor defeats the colour test) and removes the shadow of every top-down.
