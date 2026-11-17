# Iron Meridian: World War III - Art Bible (short version)

## STANDING RULE

Before fixing or redoing any picture, show the owner the problem and ask permission first.

## Style anchors

The level-1 pictures of the eight buildings are the style anchor for every future picture. Style, lighting, colours,
detail and finish must match them. They are passed as style references in Gemini batches. They stay exactly as they are.

- assets/art-src/ba-v2-army-base-1.webp
- assets/art-src/ba-v2-airbase-1.webp
- assets/art-src/ba-v2-naval-yard-1.webp
- assets/art-src/ba-v2-missile-silo-1.webp
- assets/art-src/ba-v2-arms-industry-1.webp
- assets/art-src/ba-v2-recruiting-office-1.webp
- assets/art-src/ba-v2-hospital-1.webp
- assets/art-src/ba-v2-fortifications-1.webp

## Art style (STYLE_V2 in tools/gen-art.py)

A clean, polished 3D strategy-game model render: crisp edges, simplified shapes, clear silhouettes, readable when small.
Bright but natural colours, soft even studio lighting from the upper left with a soft shadow under each object.
Slightly realistic materials (real concrete, brushed metal, asphalt, grass, subtle wear); not toy-like, not a photograph.
One fixed angled view from above, about 45 degrees down, three-quarter view, same scale in every picture.
Plain flat light grey background (#D9D9D9), only a soft shadow; no base slab, ground tile, terrain or horizon.
Cropped tight and centred, subject about 90 percent of the frame, nothing cut off. Square 1:1.
Original generic designs. No text, letters, numbers, flags, emblems, logos or watermarks; no national markings.

## Building rules

- One design per building type.
- Level 1 is the anchor. Each next level (2-5) is made by editing the previous level's picture (passed as the reference
  image), keeping the same building, angle, colours and lighting and only adding to it, so each level clearly reads as the
  same building growing.
- Hospital: the cross is RED (owner's choice); the green version stays on file (ba-v2-hospital-1.green.webp).
- Naval Yard: no coast or water drawn; piers point to the bottom right.
- Fortifications has two pictures: the cutaway bunker for panels and menus (ba-v2-fortifications-N), and a flat surface view for the map (ba-v2-fortifications-map-N).
- Fortifications: a cutaway bunker that grows with the level: deeper, more rooms, heavier concrete, more defences on top.
- Army Base: a temporary camp at level 1 growing into a full permanent base by level 5 (tents give way to barracks, motor
  pool, HQ, perimeter wall).
- Airbase: the top level adds a large swing-wing heavy bomber and flying-wing stealth bombers next to the fighters
  (generic original designs, no markings, B-1/B-2 style only).
- Regional HQs: unchanged.
- No real-product look-alikes.

## To be completed

Map, interface, research tree, badges, per-category specs. The full bible comes later.
