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
One fixed angled view from above, about 45 degrees down, three-quarter view, same scale in every picture (buildings; unit pictures see "Unit pictures" below).
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

## Unit pictures (owner's decisions 2026-11-18; prompts in docs/UNIT-LOOKS-PROMPTS.md)

- One set of pictures for every place a unit shows: the research card, the army bar's unit details and the map figures. A US/NATO
  level-5 tank is the same picture in all three.
- Each of the 5 nation groups (US/NATO, Eastern, China, Europe, Export) has its own design for every unit. Each unit has 3 looks:
  look 1 = levels 1-3, look 2 = levels 4-6, look 3 = levels 7-8. Each look is a NEW generation, drawn fresh, not an edit of the one
  before; it replaces the old model. (Paratroopers share the infantry pictures. Missiles have names only.)
- Camera for units: exactly straight down, nose up, the whole unit centred, its length about 90 percent of the picture's height.
  The map turns each figure to its heading, which a tilted view cannot do. Everything else in STYLE_V2 stays: soft studio light
  from the upper left, the same materials and finish, the plain light grey background (#D9D9D9). In gen-art this is STYLE_V2_UNIT,
  which is STYLE_V2 with only the camera and framing sentences changed.
- A group's first look is drawn with two anchor buildings attached as style references (army base 1, naval yard 1). Looks 2 and 3 are
  drawn with that group's look 1 attached, only for the camera, size, light, paint and family look.
- Family look, not a copy. Each group's pictures carry the general look of its equipment (US/NATO: flat angular turrets and slab
  sides; Eastern: low rounded turrets with reactive-armour bricks; and so on) but are original designs. This rests on the line
  already above, "No real-product look-alikes", and adds this line: **"A unit picture may carry the family look of its group, but
  never copies one real vehicle, aircraft or ship line for line; if a checker or the owner can name the real model from the
  silhouette, the picture is flagged."**

## Making pictures: the Gemini check

Every picture made for the unit looks goes through a check (`tools/gen-art.py --review`). After each picture is made, gen-art sends
it, with the reference picture it was made from when there is one, to a Gemini text model with this checklist:

1. Same unit and shape family as the reference (a new generation must be clearly newer, not a copy).
2. Matches the anchor style (STYLE_V2).
3. Plain flat light grey background, no ground or base.
4. Whole unit in frame, centred, same angle and framing as the set (units: straight down, nose up).
5. No text, numbers, logos, flags, emblems or national insignia.
6. Not a line-for-line copy of a real product (the family-look rule above).
7. No extra or duplicated units.

The check writes PASS or FLAG with short reasons to the picture's row in `assets/art-src/gen-art-log.jsonl` and to a file next to the
picture (`<picture>.review.txt`). Its own cost is logged as a row "<picture> (check)", so `--cost` includes it. **It only flags.**
There is no automatic retry or redo: a FLAG goes to the owner with the picture, and nothing is redone before the owner says so
(the standing rule). A check that cannot run counts as a FLAG ("look at it yourself"). The check is a helper, not a judge: the
owner still sees every sample set before the rest is made.

## To be completed

Map, interface, research tree, badges, per-category specs. The full bible comes later.
