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

## Province buildings (owner's rule, 27 November 2026)

A building in a province (the countryside, any province that is not a city) must never look the same as its city version. The province version is plainer and lower-key.

- **Plainer:** fewer and smaller parts; earth, canvas, timber, logs and sandbags instead of concrete and glass; no crowd of vehicles; no paved yard; no towers, fences or helipads.
- **Two picture sets:** a building that can stand both in cities and in the countryside has a city set (`bn-<key>-N`) and a province set (`bn-<key>p-N`, for example `bn-fortp-1..5`). A building that stands only in the countryside has only its own set under its own key (the Field Hospital: `bn-fhosp-1..3`). The game picks the set by whether the province is a city, on the map and in the panels alike. It never shows a city picture in the countryside.
- **Size:** a province picture is drawn smaller than the smallest city building of the same kind (its size factor, bnF, is set so that even its top level stays below the city level 1).
- **Building going up in the countryside:** never the city crane and scaffolding. Until a province building-site picture exists, the province level-1 picture is shown faded while it goes up.

### This section overrides three lines above, for province pictures only

1. "One fixed angled view, about 45 degrees, three-quarter view" (Art style and STYLE_V2) does **not** apply. Province pictures use the city-block camera (point 2 below).
2. "Detail must match the style anchors" does **not** apply. Province pictures have much less detail (point 3 below). The anchors are used for materials and colours only.
3. "Each next level is made by editing the previous level's picture" (Building rules) is replaced: each higher province level is an edit of **level 1** (see Making them).

In tools/gen-art.py this is a separate style, `STYLE_V2_PROV`: STYLE_V2 with its camera sentence replaced and its "realistic materials, subtle wear" detail sentence toned down, made with a replace-and-assert like STYLE_V2_UNIT and STYLE_V2_SIDE.

### Province pictures avoid the three pasted-on faults from the start

1. **No ground of their own.** No pad, slab, patch, mound, apron or soil block under them. Only the objects and their soft shadow. The background is the usual plain light grey `#D9D9D9` (never white), so the cut-out tool works as for every other picture.
2. **The same camera as the city blocks.** Seen from a little west of south, from above at the same slant as the map's city blocks (they lean east with height), square to the screen. Not a 45-degree corner (diamond) view. The camera reference passed to Gemini is a cropped screenshot of the game's city blocks; at most one style anchor is passed, for materials and colours only, and the prompt says so. The wording follows the camera test made in the pasted-on check (the Army Base test), so the game has one new camera, not two.
3. **Little detail.** A few large, simple shapes that read when the picture is tiny on the map.

The light stays as today: from the north-west, with the shadow to the south-east.

### Making them

- Level 1 is made first and shown to the owner. Every higher level is an **edit of level 1** (as Bunker option C was), not of the level before, so the higher levels can go in one batch.
- No flags and no emblems, as everywhere. The one exception is the **red cross** on hospital pictures (the owner's choice, the Hospital line in Building rules): the prompt says so explicitly, with the same override wording as SUBJECTS['v2-hospital-1'].
- Gemini only flags a picture (the flag-only check); it never redoes one by itself.
- Acceptance checks for every new province picture: no ground under it; the city-block camera; little detail; and an **alpha-hole check** (the cut-out must not punch holes in pale roofs, canvas or the white square behind the cross). Pale areas at risk are protected with a mask in the local cut (tools/cutout-angled.py), at no Gemini cost. Then tools/bn-foot.py writes BNMETA and BNFOOT, and the footprint anchor is checked by eye, because the tool was tuned on corner views.

### What this covers (planned)

The rule itself is the owner's and holds now. The details below (picture names, the province Bunker, the Hospital and Field Hospital) are the 2026-11-27 proposal and wait for the owner's OK; nothing is drawn yet.

| Building | City | Countryside |
|---|---|---|
| Bunker (fort) | concrete pillbox set bn-fort-1..5 (option C version 1), cutaways bn-fortcut-1..5 in the panels | sandbags and a dugout, bn-fortp-1..5, on the map and in the panels |
| Recruiting Office (rec) | bn-rec-1..5 | none: the office is city-only |
| Hospital (hosp) | bn-hospital-1..5 | none: city-only |
| Field Hospital (fhosp) | none: countryside only | a small tent with a red cross, bn-fhosp-1..3 |
| Any building going up | crane and scaffolding (bn-crane, bn-build-1..3) | its province level-1 picture, faded |

## Unit pictures (owner's decisions 2026-11-18; prompts in docs/UNIT-LOOKS-PROMPTS.md)

- One set of pictures per look, each kind for its place: the side view in the research tree's diamond, the card scene on the card, the top-down on the map and in the army bar's unit details. All three show the same vehicle.
- Each of the 5 nation groups (US/NATO, Eastern, China, Europe, Export) has its own design for every unit. Each unit has 3 looks:
  look 1 = levels 1-3, look 2 = levels 4-6, look 3 = levels 7-8. Each look is a NEW generation, drawn fresh, not an edit of the one
  before; it replaces the old model. (Paratroopers share the infantry pictures. Missiles have names only.)
- **Three pictures per look (owner, 18 November 2026, second set), all of the same vehicle.** (1) The side view: a front three-quarter side view from slightly above (the angle family of the anchor buildings) on the plain #D9D9D9 background, fully in frame, centred, cut out for the research tree's diamond; it is the master, made fresh (STYLE_V2_SIDE). (2) The card scene: made from the side view, the same unit in action in its natural setting (a tank on a dirt road, a helicopter over the sea, a jet in the sky), filling the whole card picture edge to edge, 3:2, full colour, no text or markings, no close faces; the blue monitor tint and scanlines are drawn in code on these scenes only, never in the picture. (3) The top-down: made from the side view, the camera below. Gemini checks that the three match (`--match`); it only flags.
- Camera for the top-down (map, army bar): exactly straight down, nose up, the whole unit centred, its length about 90 percent of the picture's height.
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
