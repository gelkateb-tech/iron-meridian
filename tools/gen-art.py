"""Generates building pictures with the Gemini API (Nano Banana 2.1, 1K, square) into assets/art-src/ba-<name>.png.

Two kinds of picture:
- SUBJECTS: a short description of the building level, then one shared STYLE paragraph (the 8 Higgsfield prompts' style
  for the HQ, Airbase 1-5 and Recruiting Office 2-3, minus their base pad: buildings stand straight on the grey background)
- REDRAWS: a picture redrawn with another architecture, everything else kept (the regional capital HQs)
- ICONS: map icons, a full prompt each (or ICON_EDITS: an edit of another icon), drawn on grey and saved as
  assets/art-src/<name>.grey.png plus a transparent cut-out <name>.png
- RES_ICONS: resource icons for the top bar (assets/art-src/icon-<name>.png, raw on light grey: tools/prep-res.py cuts them
  out), drawn in the style of the owner's icon-iron.png and icon-electronics.png, sent as references
- RESEARCH: the research screen's art (R_BANNERS: one wide scene per category, 21:9 at 2K; R_ICONS: one square scene per
  category, unit unlock, unique upgrade and shared upgrade type (R_SHARE), 1K), every one with the same R_STYLE paragraph
  and each unit's R_LOOK; sources saved as webp q92; --prep-research crops and shrinks them into assets/art/ (banners
  rbs-<category>.webp 2240x560, icons ri-<key>.webp 256x256, with a light grain)
- GROWS: the next level of a building made from the picture of the level before (ba-<before>.png, shrunk to SHRINK in
  the middle of the frame) with a list of additions, so the levels share their pieces and grow visibly

One try per name per run, never an automatic retry. Every call is logged with its tokens and estimated cost in
assets/art-src/gen-art-log.jsonl (--cost sums it).

The API key is never read, printed or stored here: the session's network proxy adds it to every request to
generativelanguage.googleapis.com (header x-goog-api-key). Run elsewhere, set GEMINI_API_KEY and it is sent in that header.

usage: python3 -I tools/gen-art.py [options] <name> [<name> ...]     e.g. naval-yard-1
       python3 -I tools/gen-art.py --list | --cost
       python3 -I tools/gen-art.py [--batch] --edit <picture> <name> "<change>"   a small change, everything else kept
options: --batch         send the pictures as one batch job (half price, slower; waits for it; --collect if interrupted)
         --collect <job> save the pictures of a batch job sent earlier (batches/...)
         --force         overwrite an existing picture (otherwise the new one is saved as ba-<name>.v2.png, .v3 ...)
         --ref <file>    a style reference picture sent with a SUBJECTS prompt (repeatable)
         --print         print the prompts (and the pictures attached to each) and stop: NO API call. --dry-run is the same.
         --review        after each picture is made, send it (and the reference it was made from) to a Gemini text model
                         with the Art Bible checklist; it writes PASS or FLAG with short reasons to the log row and to
                         <picture>.review.txt. It ONLY flags: nothing is redone automatically (standing rule: show the
                         owner the problem and ask first). Its cost is logged, so --cost includes it.
         --prep-research <name> ...   crop and shrink research pictures from assets/art-src/ into assets/art/ (no API call)
"""
import sys, os, json, base64, io, time, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'art-src')
MODEL = 'gemini-nano-banana-2.1'   # "Nano Banana 2.1"

STYLE = ("Style: a clean, simplified 3D game-asset render of a modern military facility, in the same look as a strategy game's "
         "unit models. Few large, clear shapes with crisp edges and low clutter, so it stays readable when shown very small. "
         "Matte materials in a muted palette: pale sand-grey concrete, olive-green and slate-grey roofs, dark asphalt, small "
         "touches of khaki. Camera: orthographic three-quarter view from above, about 45 degrees down, looking at the compound's "
         "front corner so its layout runs diagonally across the frame. Lighting: soft, even daylight from the upper left with "
         "short, soft shadows falling to the lower right. The buildings and vehicles stand directly on the plain grey background, "
         "each with only its own soft contact shadow, as loose cut-out game pieces. Cropped tight and centred: the facility "
         "fills about 90 percent of the frame. Background: a plain, flat, uniform light grey (#D9D9D9) everywhere around and "
         "between the buildings. Square 1:1 image. No base platform, no slab, no square tile, no ground plane, no terrain, no "
         "horizon. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.")

# one entry per building level; the HQ, Airbase 1-5 and Recruiting Office 2-3 come from Higgsfield, not from here
SUBJECTS = {
    'naval-yard-1': (
        "A country's military naval base, level 1 of 5, drawn as separate cut-out game pieces. Three long, straight, parallel "
        "concrete piers of equal length all point toward the bottom right of the picture: each pier's long axis runs from the "
        "upper left down to the lower right, with its free outer end at the lower right. Their inner ends line up along one "
        "diagonal line running from the lower left to the upper right. Two grey modern frigates lie alongside the piers, "
        "parallel to them, bows pointing to the lower right. Beside the piers, one dry dock: a long, narrow, open concrete box with low walls, pointing "
        "the same way, holding a third grey warship hull. Two large pale-grey dockside gantry cranes stand at the inner end of "
        "the dry dock, and the dry dock also points to the lower right. Behind the piers' inner ends, toward the upper left: a row of three long grey warehouses with slate-grey "
        "roofs (every roof the same slate grey) and one two-storey command building of pale concrete with a flat roof and a short radio mast. Every piece "
        "(buildings, cranes, piers, dry dock and ships) sits directly on the same plain flat light grey background, which "
        "stands in for both land and sea; the game's map supplies the real coast and water later. The pieces are large in the "
        "frame and the group spans most of its width. No coastline, no beach, no land strip, no water, no waves."),
}

# the realistic look (matches the detail of the Airbase pictures), for the buildings named here; the others use STYLE
STYLE_REAL = ("Style: a realistic, detailed 3D render of a modern military facility, like a sharp aerial photograph of a real "
              "base and not a toy or a cartoon: true-to-life materials and textures (weathered concrete, asphalt, corrugated "
              "metal and tiled roofs, real vehicles, real soldiers in uniform), natural muted colours (sand, khaki, olive, "
              "grey). Camera: three-quarter view from above, about 45 degrees down, looking at the facility's front corner so "
              "its layout runs diagonally across the frame. Lighting: soft daylight from the upper left with soft shadows "
              "falling to the lower right. The buildings, people and vehicles stand directly on the plain grey background with "
              "only their own soft shadows; paved areas such as yards and parade grounds are separate flat pieces lying on the "
              "grey. There is no slab, base platform, ground plane or outline around the whole facility. Cropped tight and "
              "centred: the facility fills about 85 percent of the frame and every piece is fully inside it with a small "
              "margin, nothing cut off. Background: a plain, flat, uniform light grey (#D9D9D9). Square 1:1 image. No text, "
              "no letters, no numbers, no emblems, no logos, no watermark.")
# the same realistic look kept simple and clean (Fortifications, Hospital): few elements, a painted roof symbol allowed
STYLE_CLEAN = STYLE_REAL.replace("No text, no letters, no numbers, no emblems, no logos, no watermark.",
              "Keep it simple and clean, not overdone: few elements, uncluttered, no extra props or debris. No text, no "
              "letters, no numbers, no flags, no logos, no watermark.")
STYLES = {'recruiting-office': STYLE_REAL, 'fortifications': STYLE_CLEAN, 'hospital': STYLE_CLEAN}
# the Army Base (building key 'fac') and the construction pictures: the default STYLE (the Airbase look)
STYLES['construction'] = STYLE.replace("of a modern military facility", "of a building site").replace("the compound's front corner", "the site's front corner").replace("the facility", "the site")
SUBJECTS['army-base-1'] = (
    "A temporary army field camp, level 1 of 5: a few green canvas military tents in two short rows, low khaki sandbag walls "
    "around the tents and at the gate, a chain-link fence around the whole camp with one gate and a small sandbagged guard "
    "post beside it, bare packed earth inside the fence, and two olive-green army trucks parked beside the tents.")
SUBJECTS['construction-1'] = (
    "A building site, generic and for any kind of building: a rectangular excavated pad of bare brown earth with a shallow "
    "pit and a ramp, a yellow tower crane standing beside it with its jib reaching over the pad, a small white site cabin "
    "with a flat roof, stacks of building materials (pallets of concrete blocks, a pile of steel beams, a stack of timber) "
    "and a low orange safety fence along one side. No building yet.")
SUBJECTS['construction-2'] = (
    "A building under construction, generic and for any kind of building: a rectangular scaffold frame of steel poles and "
    "platforms wrapped in green safety netting around the lower floors of a plain concrete building about three storeys "
    "high, with an open unfinished top; a yellow tower crane standing beside it; a small white site cabin and a few "
    "stacks of building materials on the ground.")
SUBJECTS['construction-3'] = (
    "A half-built building, generic and for any kind of building: the concrete and steel skeleton of a rectangular "
    "building halfway up (floor slabs and columns, four storeys, no walls yet, rebar sticking out of the top), steel "
    "scaffolding on one side only, a yellow tower crane beside it lifting a long steel beam on its hook above the frame, "
    "a small white site cabin and a few stacks of building materials on the ground.")
SUBJECTS['fortifications-1'] = (
    "A small military defensive position, level 1 of 5: one short straight line of stacked khaki sandbag walls, about chest "
    "high, and at one end of it one small square bunker of sandbags and timber with a low roof and a narrow firing slit.")
SUBJECTS['hospital-1'] = (
    "A small military clinic, level 1 of 5: one single-storey building of pale concrete with a flat roof, a red cross on a "
    "white square painted on the roof, a covered entrance with double doors, and a short paved path in front.")
SUBJECTS['recruiting-office-1'] = (
    "A small military recruiting office, level 1 of 5: one single-storey office building of pale concrete with a flat roof, "
    "a glass front entrance with a short canopy and a blank sign board above the door (no lettering), a few steps and a "
    "short paved path in front, and beside the entrance a tall white flagpole flying a plain olive-green flag with no "
    "emblem. Two small shrubs by the door.")

# the regional capital HQs: the owner's western HQ (ba-hq-western.png) redrawn with another architecture, everything else kept
REDRAW = ("The attached picture is the capital headquarters of one region in a strategy game. Make the matching headquarters "
          "for another region by changing only the architecture of the building to this: {}. Keep exactly everything else: "
          "the same camera angle and three-quarter view from above, the same footprint (the same outline, size and position of "
          "the building in the frame), about the same height, the same eight empty flagpoles in two rows of four at the same "
          "places at the lower left (bare poles, no flags on them), the same simple clean rendering style and level of detail, "
          "the same soft daylight from the upper left with shadows to the lower right, and the same plain flat light grey "
          "background with no ground, slab or outline. No text, no letters, no flags, no emblems, no logos.")
REDRAWS = {   # name: (the picture it is redrawn from, the new architecture)
    'hq-eastern-europe': ('ba-hq-western.png',
        "a large Stalinist-style government building of pale stone: a massive symmetrical stepped block whose tall central "
        "tower rises in tiers to a slim spire, tall vertical pilasters along the walls and a pillared main entrance"),
    'hq-middle-east': ('ba-hq-western.png',
        "a palace of sand-coloured stone with a large central dome and smaller domes on the wings, rows of pointed arches "
        "along the facades and a tall arched main entrance"),
    'hq-east-asia': ('ba-hq-western.png',
        "a government hall with layered, gently curved dark grey tiled roofs, stacked in two tiers on the central hall and "
        "single curved roofs on the wings, red-brown columns along the front and a wide stone staircase at the entrance"),
    'hq-south-asia': ('ba-hq-western.png',
        "a grand building of red sandstone with a large pale stone central dome, small domed pavilions on the corners of the "
        "wings, and arched colonnades along the front"),
    'hq-africa': ('ba-hq-western.png',
        "a modern government building of warm ochre and sand-coloured stone, with a tall row of slim columns across the "
        "front under a flat projecting roof, and clean modern lines"),
    'hq-latin-america': ('ba-hq-western.png',
        "a colonial-style palace with white and pale yellow walls, a central dome, a portico of columns at the entrance, "
        "terracotta tile roofs on the wings and arched windows"),
}

# map icons: a full prompt each (no STYLE), drawn on plain grey; saved as <name>.grey.png and cut out into a transparent
# <name>.png (cutout). ICON_EDITS: an icon made by editing another icon's grey picture, so the two match exactly.
HELMET = ("A small game map icon, an original design: a modern military combat helmet on its own, seen exactly from the side, "
          "with no head, face or person, its front brim to the right. A smooth rounded dome with a short brim at the front and "
          "the rim curving gently down at the back; plain matte olive-green paint. A simple bold shape with a clean, crisp "
          "outline and light soft shading only: a gentle highlight on the upper dome and a slightly darker green toward the "
          "rim. No texture, no camouflage pattern, no netting, no straps, no goggles, no insignia. It must read clearly at 16 "
          "pixels. Centred in the frame, filling about 75 percent of its width. Background: a plain, flat, uniform light grey "
          "(#D9D9D9) with no cast shadow and no ground. Square 1:1 image. No text, no letters, no numbers, no flag, no badge, "
          "no border.")
ICONS = {
    'icon-infantry': HELMET,
    'icon-infantry-motorized': None,   # see ICON_EDITS
}
RES_REFS = ['icon-iron.png', 'icon-electronics.png']   # the owner's resource icons: the style to match
RES_STYLE = ("Match exactly the attached reference icons: the same realistic, glossy product-render look with shiny highlights, the "
             "same soft studio lighting from the upper left, the same three-quarter view from slightly above, the same framing "
             "(one object, centred, filling most of the frame with a small even margin) and the same plain, flat, uniform light "
             "grey background with only a faint soft contact shadow under the object. One single object, cropped tight. No text, "
             "no letters, no numbers, no logos, no symbols, no portraits, no watermark. Square 1:1 image.")
RES_ICONS = {
    'icon-cash': ("A game resource icon for money: one neat stack of green banknotes held together by a plain cream paper band "
                  "around the middle, seen at a three-quarter angle so the top and two sides of the stack show. The notes are "
                  "plain green with subtle generic engraved patterns only (no faces, no numbers, no real currency)."),
    'icon-oil': ("A game resource icon for oil: one red metal jerry can (a classic fuel canister) with its three-bar carrying "
                 "handle and a short spout cap on top, the embossed X-shaped stiffening ribs on its side, glossy red paint with "
                 "a few small worn edges, standing upright at a three-quarter angle."),
}

ICON_EDITS = {
    'icon-infantry-motorized': ('icon-infantry',
        "Edit the attached picture. Add only one small wheel directly under the middle of the helmet: a simple dark grey tyre "
        "seen from the side (a dark grey circle with a lighter grey round hub in its centre), about one third as wide as the "
        "helmet, separated from the helmet's rim by a small gap, with the same light soft shading. Move the helmet up a little "
        "only if needed so the helmet and wheel together stay centred in the frame. Keep the helmet exactly as it is: its "
        "shape, size, colour, shading and outline. The background stays the plain flat uniform light grey, with no cast "
        "shadow and no ground. No text, no flag."),
}

# the next level from the level before: (level before, additions). New piers and ships keep the level 1 direction.
GROWS = {
    'army-base-2': ('army-base-1',
        "two more green canvas tents added to the tent rows, and a vehicle park beside the camp: a row of four olive-green "
        "army trucks and two jeeps parked on packed earth inside an extended fence line, with more sandbag walls"),
    'army-base-3': ('army-base-2',
        "the first permanent buildings: two long single-storey barracks with pale concrete walls and olive-green pitched "
        "roofs, and one large motor pool shed with a grey roof and open vehicle bays holding two trucks, built beside the "
        "tents; the fence extended around them"),
    'army-base-4': ('army-base-3',
        "several more barracks of the same kind lined up in a row, a paved parade ground with painted lines beside them, "
        "one fuel depot (four round olive-green fuel tanks with pipes inside a low wall), and one tall wooden-and-steel "
        "watchtower at a corner of the fence; the tents are fewer now, only a few remain at the edge"),
    'army-base-5': ('army-base-4',
        "turn it into a full permanent base: more barracks blocks, a two-storey pale concrete headquarters building with a "
        "flat roof beside the parade ground, two large vehicle sheds holding armoured vehicles (tanks and armoured personnel "
        "carriers) with more parked outside, a training ground of packed sand with a simple obstacle course, a second "
        "watchtower, and a solid concrete perimeter wall with a gatehouse replacing the fence; all the tents are gone"),
    'recruiting-office-2': ('recruiting-office-1',
        "a fenced yard of paved concrete beside the office with a chain-link fence around it, a few soldiers in uniform "
        "standing and walking in the yard, and a small guard post (a sentry booth with a barrier arm) at the yard's gate"),
    'recruiting-office-3': ('recruiting-office-2',
        "a long two-storey barracks building with a pitched roof behind the yard, and a block of about twenty soldiers in "
        "formation, standing in neat rows on a paved square in front of the barracks"),
    'recruiting-office-4': ('recruiting-office-3',
        "a training ground of packed sand on one side with an obstacle course (low walls, wooden hurdles, a climbing frame and "
        "a rope net), a few soldiers running the course, and a row of four parked olive-green army trucks"),
    'recruiting-office-5': ('recruiting-office-4',
        "turn it into a large training base: three more barracks buildings in a row beside the first, a big paved parade "
        "ground with a large formation of soldiers in rows, a small reviewing stand, more parked vehicles (olive-green trucks, "
        "jeeps and two armoured personnel carriers), and a vehicle shed"),
    'fortifications-2': ('fortifications-1',
        "a longer continuation of the same sandbag wall line, and a second small sandbag-and-timber bunker at its other end"),
    'fortifications-3': ('fortifications-2',
        "two low concrete bunkers with firing slits, linked to the sandbag line and to each other by narrow zig-zag trenches "
        "with sandbag and timber walls; along each trench only a thin strip of brown earth, no ground around the position"),
    'fortifications-4': ('fortifications-3',
        "a row of steel anti-tank traps (crossed girder hedgehogs) in front of the line, and one sandbagged gun emplacement "
        "with a field gun pointing forward"),
    'fortifications-5': ('fortifications-4',
        "turn it into a strong fortified line: more concrete bunkers along a longer line, more connecting trenches, and a "
        "long row of concrete anti-tank barriers (dragon's teeth) in front"),
    'hospital-2': ('hospital-1',
        "a larger clinic: an extension wing built onto the side of the building, one white ambulance parked by the entrance, "
        "and a round concrete helipad with a plain painted circle marking beside the clinic"),
    'hospital-3': ('hospital-2',
        "replace the clinic with a two-storey military hospital building of pale concrete in the same place, with the red "
        "cross on its roof, keeping the helipad, and two more white ambulances parked by the entrance"),
    'hospital-4': ('hospital-3',
        "an extra two-storey wing joined to the hospital, and a medical helicopter, painted olive green with a red cross, "
        "standing on the helipad"),
    'hospital-5': ('hospital-4',
        "turn it into a big military medical centre: two more wings joined around a small courtyard, a second helipad, and a "
        "few more ambulances in a small parking area"),
    'naval-yard-2': ('naval-yard-1',
        "two more long concrete piers of the same kind, continuing the row of piers toward the upper right, each with a ship "
        "docked alongside (one grey frigate and one dark grey submarine); a fourth grey warehouse continuing the warehouse "
        "row; one round white fuel tank beside the command building"),
    'naval-yard-3': ('naval-yard-2',
        "a second dry dock beside the first one, holding a grey warship hull, with one more gantry crane at its inner end; two "
        "more long concrete piers continuing the row of piers, each with a large grey destroyer docked alongside; a second row "
        "of three grey warehouses behind the first row; a second round white fuel tank; the command building one storey taller"),
    'naval-yard-4': ('naval-yard-3',
        "two more long concrete piers continuing the row of piers toward the upper right, parallel to the others, one with a "
        "big grey cruiser docked alongside and one with a dark grey submarine; one more large gantry crane by the dry docks; "
        "two more grey warehouses; a white radar dome on the command building's roof; a third round white fuel tank"),
    'naval-yard-5': ('naval-yard-4',
        "a new, longest concrete pier continuing the row of piers toward the upper right, parallel to the others, with a large "
        "grey aircraft carrier (flat flight deck, small island on its side) docked alongside it, bow to the lower right, and "
        "one more parallel pier with a big grey cruiser; one more dry dock holding a big grey warship hull, with one more "
        "gantry crane; two more grey warehouses; a second white radar dome by the command building; a fourth round white "
        "fuel tank"),
}

# ---- the research screen: one shared style for every banner and icon (owner: realistic, same style and lighting for all)
R_STYLE = ("Style: a realistic, cinematic but clean photograph-like render of modern military equipment, like a still from a "
           "high-quality war film or a strategy game's key art: true-to-life materials and scale, crisp detail on the subject, "
           "soft atmospheric haze in the distance. Lighting: warm late-afternoon sun, low in the sky on the left, so every "
           "subject is lit from the left with a gentle golden rim on its left edges and long soft shadows falling to the "
           "right. Palette: muted military colours (olive drab, khaki, sand, slate and steel grey, dusty blue-grey sky), low "
           "saturation, no bright or neon colours. Low clutter: one clear subject, few elements, no debris, no explosions, no "
           "fire, no smoke plumes, no people's faces in close-up. Original designs only: every vehicle, ship, aircraft and "
           "weapon is a fictional, generic modern design made for this game, NOT a copy of any real-world model, so no one "
           "can recognise a real product from its silhouette (for example: not an Abrams, Leopard, T-72 or T-90 tank, not an "
           "F-35, F-22, Su-57 or Rafale jet, not a Nimitz or Ford class carrier, not an Arleigh Burke destroyer, not a "
           "Paladin, PzH 2000 or M777 gun); blend generic features and keep the proportions plausible. Plain unmarked paint: no text, no letters, no numbers, no hull or tail numbers, no logos, "
           "no flags, no national insignia, no roundels, no unit badges, no camouflage brand patterns, no watermark.")
R_BANNER = ("Framing: an ultra-wide cinematic panorama for a long, thin title banner. Only a horizontal strip through the "
            "vertical middle of the picture is shown (about the middle 40 percent of its height; on a wide screen even less), "
            "so: the main subject is LARGE and close to the camera, filling most of the height of that middle band (about a "
            "third of the whole picture's height; the main vehicle, ship or aircraft is the biggest thing), and it sits "
            "ENTIRELY inside that band, centred on the picture's horizontal centre line, with nothing important "
            "in the top 30 percent or the bottom 30 percent of the picture (only plain sky above and plain ground or sea "
            "below). The subject is never small, distant or near the top or bottom edge. It is placed centre-right and "
            "spans about the right half of the width; the left third of the picture is quiet, empty and darker (open "
            "ground or sea in shadow, plain sky) because the banner's title sits there. A darker vignette around all "
            "edges, strongest on the left. Simple, calm sky and simple ground or sea. 21:9 image.")
R_ICON = ("Framing: a square game icon, shown at about 50 pixels inside a diamond-shaped frame. The main unit or piece of "
          "equipment is shown close up and is by far the largest thing in the picture: it fills most of the box (about 80 "
          "percent of the width and most of the height), fully visible and centred, with only its tips or ends allowed "
          "near the edges and nothing important in the corners (the corners are cut away). Camera: a three-quarter front "
          "side view, slightly above, like a close product shot of the vehicle: its front (and its gun or nose) points "
          "toward the right of the picture and we see its front and its left side. The picture is never "
          "mostly background, sky or ground, and never mostly ammunition or small parts: any secondary items are small "
          "and beside the main subject. The background is the subject's own setting, visible only around it, filling the "
          "frame to every edge (no plain or white background, no border, no frame), simple, softly out of focus and a "
          "little darker toward the edges, so the subject's bold silhouette stands out clearly at a tiny size. Square 1:1 "
          "image.")
# the look of each unit, written once and used in its icon and in any banner that shows it, so they agree (an original, generic design)
R_LOOK = {
    'soldier': ("a soldier in a plain olive-khaki combat uniform, a plain tan helmet with goggles on it, a tan plate carrier "
                "vest with pouches and a generic compact assault rifle"),
    'at': ("a soldier in a plain olive-khaki combat uniform, plain tan helmet and tan plate carrier, carrying a generic "
           "shoulder-fired anti-tank missile launcher: a thick olive tube with a boxy sight unit on its left side"),
    'spec': ("a special forces operator in darker ranger-green kit: a bump helmet with a night-vision mount, a face scarf, a "
             "plate carrier with radio and a generic short carbine with a long suppressor"),
    'para': ("a paratrooper in a plain olive-khaki combat uniform, plain tan helmet, parachute harness and a rifle strapped "
             "to the side"),
    'tank': ("a generic modern main battle tank of an original design: a low, wide, angular welded turret with flat add-on armour "
             "blocks on its front and sides, a long smoothbore gun with a plain thermal sleeve, six road wheels a side under "
             "plain side skirts, olive-khaki paint"),
    'ifv': ("a generic tracked infantry fighting vehicle of an original design: a boxy hull with a steep sloped front, a "
            "small low turret with a slim 30 mm autocannon and a twin missile box on its side, a rear ramp door, six road "
            "wheels a side, olive-khaki paint"),
    'art': ("a generic modern tracked self-propelled howitzer of an original design: a long tank-like tracked hull with six "
            "road wheels a side, a large flat-sided boxy armoured turret set toward the rear of the hull, and a very long "
            "155 mm gun barrel with a plain slotted muzzle brake, raised at a low angle and pointing forward over the "
            "front of the hull; olive-khaki paint"),
    'mlrs': ("a generic six-wheeled armoured military truck of an original design with a boxy armoured cab and, on its rear "
             "bed, a big square launcher box of twelve rocket tubes on a turntable; olive-khaki paint"),
    'sam': ("a generic eight-wheeled military truck of an original design carrying four large square missile canisters on a "
            "launcher frame at its rear and a flat rectangular radar panel folded behind the cab; olive-khaki paint"),
    'jam': ("a generic six-wheeled armoured military truck of an original design with a telescopic mast of short flat "
            "antenna panels and a small dish on its roof; olive-khaki paint"),
    'heli': ("a generic tandem two-seat attack helicopter of an original design: a narrow angular fuselage with two stepped "
             "cockpits, short stub wings with missile racks, a chin gun turret, a four-blade main rotor and a tail rotor; "
             "matte grey-green paint"),
    'transport': ("a generic four-engine military transport plane of an original design: a fat high-wing fuselage, four "
                  "turboprop engines, a raised T-tail and a rear cargo ramp; matte grey"),
    'int': ("a generic single-seat twin-engine interceptor jet of an original design: a long pointed nose, a large delta wing "
            "with small canards near the cockpit, one single tall tail fin; light grey"),
    'jet': ("a generic two-seat multirole strike fighter of an original design: a thick fuselage with side air intakes, "
            "swept wings, two engines and twin vertical tails; grey-green"),
    'asf': ("a generic large air superiority fighter of an original design: a long flat faceted fuselage, broad wings with "
            "rounded tips, rectangular intakes under the cockpit and twin outward-canted tails; dark grey"),
    'drone': ("a generic recon UAV of an original design: a slim pale grey fuselage with a rounded bulbous nose, very long "
              "straight thin wings, an inverted V-tail, a rear pusher propeller and a sensor ball under the nose"),
    'swarm': ("small generic loitering drones of an original design, each a small grey tube-shaped body about a metre long "
              "with X-shaped folding wings and a small rear propeller"),
    'sdrone': ("a generic one-way strike drone of an original design: a grey delta-wing body with a pointed nose, small "
               "upright fins at the wingtips and a rear propeller"),
    'bomb': ("a generic heavy jet bomber of an original design: a long slim fuselage, high swept wings with four jet engines "
             "in single pods under them, a tall swept single tail; light grey"),
    'stealth': ("a generic stealth bomber of an original design: a wide, flat, tailless blended wing with a pointed nose, a "
                "straight swept leading edge and a W-shaped trailing edge, smooth dark grey"),
    'mpa': ("a generic maritime patrol aircraft of an original design: a long low-wing fuselage with four turboprop engines, "
            "a radar bulge under the nose and a long thin boom sticking out of the tail; light grey"),
    'awacs': ("a generic airborne radar plane of an original design: a twin-engine jet airliner-shaped body with a long "
              "flat rectangular radar beam mounted on a short pylon along the top of its fuselage; light grey"),
    'frig': ("a generic modern frigate of an original design: a sleek grey hull with smooth angled stealthy sides, one tall "
             "enclosed pyramid mast, a single gun on the bow and a helicopter deck at the stern"),
    'crui': ("a generic large guided-missile cruiser of an original design: a long grey hull, a big blocky superstructure "
             "with flat radar panels on its sides, two gun turrets forward and rows of flush missile hatches on deck"),
    'carr': ("a generic large aircraft carrier of an original design: a long flat grey flight deck with an angled landing "
             "strip, one compact block-shaped island on the right side with a single mast, a few plain grey jets parked on "
             "deck"),
    'sub': ("a generic attack submarine of an original design: a long dark grey cylindrical hull, a short sail (fin) set "
            "well forward with small dive planes, a cross-shaped tail"),
    'cm': ("a generic cruise missile of an original design: a slim grey cylindrical body with a rounded nose, two small "
           "straight wings at its middle, four small tail fins and a small air intake under its belly"),
    'bm': ("a generic ballistic missile of an original design: a tall olive-grey cylindrical rocket with a pointed cone nose, "
           "carried on a big eight-wheeled transporter-erector truck"),
    'truck': ("a generic six-wheeled military cargo truck of an original design with a flat-front armoured cab and a "
              "canvas-covered rear bed; olive-khaki paint"),
}
L = R_LOOK
# a banner: <name>: <scene>; the main subject large, inside the middle band (R_BANNER says how)
R_BANNERS = {   # rbs-<category>: one wide scene per research category
    'rbs-inf': ("Infantry Corps: a squad of five infantry soldiers, each " + L['soldier'] + ", advancing in a loose line from "
                "the left toward the right across a dry grass field, seen from the side at a slight three-quarter angle, close "
                "enough that the soldiers are tall in the frame (heads to boots inside the middle band)."),
    'rbs-arm': ("Armoured Forces: two main battle tanks, each " + L['tank'] + ", driving from the left toward the right along "
                "a dusty desert track, close to the camera and large in the frame, seen from the side at a slight three-quarter "
                "front angle, a thin trail of dust behind their tracks; flat sand desert with low mesas far away."),
    'rbs-sup': ("Artillery & Air Defence: in the centre-right a self-propelled howitzer, " + L['art'] + ", and just behind it "
                "on the right a mobile air defence launcher, " + L['sam'] + ", its canisters raised at a steep angle; both close "
                "and large, seen from the side at a slight three-quarter angle, on dry open steppe."),
    'rbs-aas': ("Air Assault: two attack helicopters, each " + L['heli'] + ", flying low and fast from the left toward the "
                "right just above a ridge of dry hills, close to the camera and large in the frame, seen from the side at a slight "
                "three-quarter front angle."),
    'rbs-tac': ("Tactical Air: two fighter jets, " + L['jet'] + ", flying side by side in close formation from the left "
                "toward the right, close to the camera and large in the frame (the nearer jet spans about a third of the width), "
                "seen from the side at a slight angle, above a soft layer of clouds; a calm, evenly lit sky."),
    'rbs-uns': ("Unmanned Systems: one recon UAV, " + L['drone'] + ", flying from the left toward the right, close to the "
                "camera and large in the frame (its long wings span about half the width), seen from slightly below at a "
                "three-quarter front angle; a hazy evening sky over far desert hills."),
    'rbs-str': ("Strategic Air: one heavy bomber, " + L['bomb'] + ", flying from the left toward the right high above the "
                "clouds, close to the camera and large in the frame (its wings span about half the width), seen from the side "
                "and slightly below at a three-quarter front angle."),
    'rbs-nav': ("Navy: an aircraft carrier, " + L['carr'] + ", sailing toward the right at sea, close to the camera and large "
                "in the frame (its hull spans about half the width and its island and deck fill the middle band), seen from "
                "the side at a slight three-quarter front angle, one small frigate far behind it on the left; calm sea."),
    'rbs-msl': ("Strategic Weapons: a ballistic missile on its launch truck, " + L['bm'] + ", the missile raised to a steep "
                "angle, close to the camera and large in the frame, seen from the side at a slight three-quarter angle, at a "
                "desert launch site at dusk; no flame and no smoke."),
    'rbs-cmd': ("Command & Logistics: a convoy of three military cargo trucks, each " + L['truck'] + ", driving from the left "
                "toward the right along a straight dirt road, close to the camera and large in the frame, the lead truck "
                "biggest, seen from the side at a slight three-quarter front angle, a little dust behind; open farmland."),
}
R_FOCUS = {'rbs-inf': 0.385}   # a banner's vertical centre for its strip crop, as a share of the height (0.5 when not listed)
# rbs-inf (owner): the strip starts just above the helmets, so the row crop takes the feet, never the heads
# R_SHARE: one picture for every node of an upgrade type that appears in several unit lines (owner: reuse one icon per type);
# the game maps those nodes to ri-t-<type> (index.html rKey). A generation reuses its unit's unlock picture (no picture of its own)
R_SHARE = {'Firepower': 't-fp', 'Protection': 't-pr', 'Drop Tanks': 't-drop', 'Ceramic Body Armour': 't-armor', 'Naval Gunnery': 't-navgun'}
R_ICONS = {   # ri-<key>: cat-<category> (the category icon), a unit unlock or a unique upgrade (its node id), or a shared type (t-<type>)
    'ri-cat-inf': ("Infantry Corps: a modern infantry soldier in full combat gear (helmet, body armour, rifle held ready), "
                   "advancing in a slight crouch across a dusty field, seen from the front left in three-quarter view, from "
                   "the knees up; the face is in the shadow of the helmet."),
    'ri-u_tank': ("Main Battle Tank: one modern main battle tank seen from the front left in three-quarter view, its long main "
                  "gun pointing slightly to the right, standing on dusty open ground."),
    'ri-art_shell': ("Extended-Range Shells (an upgrade of the Mobile Artillery, a self-propelled howitzer): the artillery gun "
                     "itself is the main subject: " + R_LOOK['art'] + ", seen from the front left in a three-quarter front "
                     "side view (the same angle as a close product shot of a tank), close up and filling most of the box, "
                     "standing on dusty open ground. Beside its front left track stand only three small, slender artillery "
                     "shells with pointed noses, upright, plain olive with one plain brass band, each only about as tall as a "
                     "road wheel, small next to the gun: a small detail, not a subject."),
    # ---- category icons
    'ri-cat-arm': "Armoured Forces: " + L['tank'] + ", seen head-on from a low angle, slightly from its left, its gun pointing just past the viewer, kicking up dust.",
    'ri-cat-sup': "Artillery & Air Defence: " + L['art'] + ", its long barrel raised high at a steep firing angle, seen from a low angle at its front left, on dry steppe.",
    'ri-cat-aas': "Air Assault: " + L['heli'] + ", flying low toward the viewer over dry hills, banking slightly, seen from its front left.",
    'ri-cat-tac': "Tactical Air: " + L['jet'] + ", banking in a turn high in the sky, seen from slightly above its front left, filling the box.",
    'ri-cat-uns': "Unmanned Systems: " + L['drone'] + ", flying toward the viewer, seen head-on from slightly below its front left, the long wings spanning the box.",
    'ri-cat-str': "Strategic Air: " + L['bomb'] + ", flying above the clouds, seen from below its front left, big and close, filling the box.",
    'ri-cat-nav': "Navy: the bow and forward superstructure of " + L['frig'] + ", cutting through grey waves toward the viewer, seen from a low angle at its front left.",
    'ri-cat-msl': "Strategic Weapons: " + L['bm'] + ", the missile raised upright on the truck, seen from its front left at a desert launch site at dusk.",
    'ri-cat-cmd': ("Command & Logistics: a generic six-wheeled armoured command vehicle of an original design with several tall whip "
                   "antennas, a small satellite dish on its roof and a folded awning on its side; olive-khaki paint; seen from its front left on a dirt road."),
    # ---- unit unlocks
    'ri-u_inf': "Motorized Infantry: two soldiers, each " + L['soldier'] + ", jumping down from the back of " + L['truck'] + ", the truck filling most of the box, seen from its rear left corner.",
    'ri-u_at': "Anti-Tank Infantry: " + L['at'] + ", kneeling and aiming the launcher on his shoulder toward the right, seen from his front left, from the knees up.",
    'ri-u_spec': "Special Forces: " + L['spec'] + ", moving in a crouch with the carbine ready through rocky ground at dusk, seen from his front left, from the knees up.",
    'ri-u_para': "Paratroopers: " + L['para'] + ", hanging under a round olive parachute canopy as he comes down, the canopy and the soldier both in the box, seen from his front left; a hazy landscape far below.",
    'ri-u_ifv': "Infantry Fighting Vehicle: " + L['ifv'] + ", standing on dusty ground, seen from its front left.",
    'ri-u_art': ("Mobile Artillery: a battery of three self-propelled howitzers in a row, each " + L['art'] + ", their barrels "
                 "raised, the nearest one firing with a small, short muzzle flash and a small puff at the muzzle (allowed here), "
                 "the nearest gun big in the front, the other two behind it, seen from the front left on dry steppe."),
    'ri-u_mlrs': "Rocket Artillery: " + L['mlrs'] + ", its launcher box raised at a steep angle, seen from its front left on dusty ground.",
    'ri-u_sam': "Mobile SAM: " + L['sam'] + ", its canisters raised upright and the radar panel unfolded, seen from its front left.",
    'ri-u_jam': "Mobile Jammer: " + L['jam'] + ", its antenna mast raised, seen from its front left on a dirt track.",
    'ri-u_heli': "Attack Helicopter: " + L['heli'] + ", hovering low over dry grass, seen from its front left, close.",
    'ri-u_int': "Interceptor: " + L['int'] + ", climbing steeply in a clear sky, seen from its front left, close.",
    'ri-u_jet': "Strike Fighter: " + L['jet'] + ", flying level above clouds, seen from its front left, close.",
    'ri-u_asf': "Air Superiority Fighter: " + L['asf'] + ", flying level high in the sky, seen from its front left, close.",
    'ri-u_drone': "Recon UAV: " + L['drone'] + ", flying level high over hazy hills, seen from its front left; the long wings may reach the edges.",
    'ri-u_swarm': "Swarm Drones: a pack of about eight " + L['swarm'] + ", flying together in a loose cluster toward the right, the nearest ones big, seen from their front left.",
    'ri-u_sdrone': "Strike Drone: " + L['sdrone'] + ", flying low and fast over a desert, seen from its front left, close.",
    'ri-u_bomb': "Heavy Bomber: " + L['bomb'] + ", flying high above the clouds, seen from its front left, close.",
    'ri-u_stealth': "Stealth Bomber: " + L['stealth'] + ", flying high in an evening sky, seen from slightly above its front left, close.",
    'ri-u_mpa': "Maritime Patrol Aircraft: " + L['mpa'] + ", flying low over a grey sea, seen from its front left, close.",
    'ri-u_awacs': "AWACS: " + L['awacs'] + ", flying high in a clear sky, seen from its front left, close.",
    'ri-u_frig': "Frigate: " + L['frig'] + ", at sea, seen from its front left, close.",
    'ri-u_crui': "Cruiser: " + L['crui'] + ", at sea, seen from its front left, close.",
    'ri-u_carr': "Aircraft Carrier: " + L['carr'] + ", at sea, seen from above its front left, close, the hull filling the box.",
    'ri-u_sub': "Attack Submarine: " + L['sub'] + ", surfaced and moving through calm sea, seen from its front left, close.",
    'ri-msl1': "Cruise Missiles: " + L['cm'] + ", flying low over a calm sea, seen from its front left, close and filling the box; no flame.",
    'ri-msl2': "Ballistic Missiles: " + L['bm'] + ", the missile lying flat on the truck, ready to be raised, seen from the truck's front left.",
    # ---- shared upgrade types (one picture each, used on every node of that type)
    'ri-t-fp': ("Firepower (a weapons upgrade for every unit): the turret and long gun barrel of " + L['tank'] + ", seen close "
                "from its front left, the barrel and its muzzle sharp in front, a small box of guided missiles on the turret side."),
    'ri-t-pr': ("Protection (an armour upgrade for every unit): the front corner of " + L['tank'] + "'s hull and turret, close "
                "up, thick new add-on armour blocks bolted on, one block shown cut open at its edge to reveal layered ceramic and steel plates."),
    'ri-t-drop': ("Drop Tanks: close under the wing of a grey generic fighter jet in flight, two big teardrop-shaped external "
                  "fuel tanks hanging on pylons, seen from below its front left, the tanks and the wing filling the box."),
    'ri-t-armor': "Ceramic Body Armour: " + L['soldier'] + ", from the chest up, his thick tan ceramic-plate vest the main thing, seen from his front left.",
    'ri-t-navgun': "Naval Gunnery: the single gun turret on the bow of " + L['frig'] + ", an angular stealthy turret with a long barrel, close up from its front left.",
    # ---- unique upgrades (Infantry Corps)
    'ri-inf_build': "Rapid Mobilisation: soldiers climbing quickly into the back of " + L['truck'] + ", the truck filling the box, seen from its rear left corner.",
    'ri-inf_terr': "Rough-Ground Drills: " + L['soldier'] + ", climbing a steep rocky forest slope, seen from his front left, from the knees up.",
    'ri-at_warhead': "Tandem Warheads: " + L['at'] + ", aiming the launcher; a missile with a long thin spike nose shows at the front of the tube; seen from his front left, close.",
    'ri-at_eye': "Thermal Sights: " + L['at'] + ", aiming at dusk through a big boxy thermal sight on the launcher, seen from his front left, close.",
    'ri-spec_terr': "Mountain & Arctic Training: " + L['spec'] + " in white-grey snow camouflage, on a snowy mountain ridge, seen from his front left, from the knees up.",
    'ri-spec_eye': "Night Optics: " + L['spec'] + ", four-tube night-vision goggles lowered over his eyes, in the blue light of dusk, seen from his front left, head and shoulders.",
    'ri-spec_airlift': "Air-Transportable: special forces operators sitting by the open rear ramp inside " + L['transport'] + ", seen from inside, the ramp and the sky beyond.",
    # Armoured Forces
    'ri-ifv_gun': "30 mm Autocannon: the turret of " + L['ifv'] + ", close up from its front left, the slim autocannon barrel the main thing.",
    'ri-ifv_spd': "Uprated Powerpack: " + L['ifv'] + ", driving fast toward the viewer over a dusty track, a dust cloud behind, seen from its front left.",
    'ri-ifv_terr': "Amphibious Kit: " + L['ifv'] + ", swimming across a calm brown river with a bow wave, seen from its front left.",
    'ri-tank_armor': "Composite Armour: the turret front of " + L['tank'] + ", close up from its front left, the thick angular armour blocks the main thing.",
    'ri-tank_gun': "Smoothbore Main Gun: " + L['tank'] + ", seen from its front left, close, the long gun barrel crossing the box toward the right.",
    'ri-tank_terr': "Wide Tracks: " + L['tank'] + ", driving through deep mud, seen from a low angle at its front left, its wide tracks prominent.",
    'ri-tank_eng': "Turbine Engines: " + L['tank'] + ", speeding over dry ground with a cloud of dust and a faint heat shimmer over its rear deck, seen from its front left.",
    # Artillery & Air Defence
    'ri-art_radar': ("Counter-Battery Radar: a generic six-wheeled military truck of an original design carrying a big flat "
                     "rectangular radar panel raised upright on its rear; olive-khaki; seen from its front left."),
    'ri-art_guided': "Guided Shells: one long, slim guided artillery shell with four small steering fins near its nose and folding tail fins, in flight high in the sky, seen from the side, filling the box.",
    'ri-mlrs_reload': "Rapid Reload: " + L['mlrs'] + ", a small crane arm lowering a fresh launcher box onto its rear, seen from its front left.",
    'ri-mlrs_rng': "Extended-Range Rockets: " + L['mlrs'] + ", its launcher box raised very steeply toward the sky, seen from a low angle at its front left.",
    'ri-sam_seek': "Improved Seekers: the nose of a surface-to-air missile with a glassy seeker dome, sliding out of its square canister on " + L['sam'] + ", close up.",
    'ri-sam_spd': "Shoot-and-Scoot: " + L['sam'] + ", its launcher lowered, driving fast along a dusty road, seen from its front left.",
    'ri-jam_band': "Wideband Jamming: " + L['jam'] + ", its mast raised high with many antenna panels, seen from a low angle at its front left.",
    # Air Assault
    'ri-heli_rng': "Long-Range Tanks: " + L['heli'] + ", two long external fuel tanks on its stub wings, flying, seen from its front left.",
    'ri-heli_atgm': "Fire-and-Forget Missiles: the stub wing of " + L['heli'] + ", close up, a rack of four anti-tank missiles under it, the cockpit behind.",
    'ri-para_airlift': "Long-Range Airlift: " + L['transport'] + ", flying high above the clouds, seen from its front left, close.",
    # Tactical Air
    'ri-int_msl': "Radar-Guided Missiles: " + L['int'] + ", long slim missiles under its wings, seen close from below its front left.",
    'ri-jet_pgm': "Precision Munitions: " + L['jet'] + ", carrying guided bombs with small tail fins under its wings, seen close from below its front left.",
    'ri-jet_lo': "Stealth Airframes: " + L['jet'] + " reshaped with smooth faceted stealthy surfaces and no weapons under its wings, dark grey, seen from its front left.",
    'ri-asf_radar': "Look-Down Radar: the nose of " + L['asf'] + ", its radome opened on a ground stand to show a flat round radar array, in a hangar, close up from its front left.",
    # Unmanned Systems
    'ri-swarm_rng': "Booster Rockets: one of " + L['swarm'] + ", leaving its launch tube with a small booster rocket under it, a short small flame (allowed here), seen from its front left.",
    'ri-swarm_pack': "Bigger Salvo: a generic six-wheeled truck with a big box launcher of many small square tubes on its rear, raised, seen from its front left.",
    'ri-sdrone_rng': "Satellite Link: " + L['sdrone'] + " with a small dome antenna on its back, flying high, seen from above its front left.",
    'ri-sdrone_hit': "Bunker-Buster Warhead: " + L['sdrone'] + ", diving steeply toward a low grey concrete bunker on the ground below, seen from its front left.",
    # Strategic Air
    'ri-bomb_ecm': "Defensive Jammers: " + L['bomb'] + ", with long jamming pods under its wing tips, seen close from below its front left.",
    'ri-bomb_up': "Strategic Bomber Upgrade: " + L['bomb'] + ", taking fuel from the boom of a grey tanker plane above it (only the boom and the tanker's tail visible), seen from its front left.",
    'ri-stealth_bay': "Enlarged Bomb Bay: " + L['stealth'] + ", seen from below its front left, its long bomb bay doors open.",
    'ri-stealth_rng': "Flying-Wing Tanks: " + L['stealth'] + ", flying over a vast open ocean far from land, seen from above its front left.",
    'ri-mpa_sonar': "Sonobuoy Field: " + L['mpa'] + ", flying low over the sea, a small sonobuoy dropping under a little parachute below it, seen from its front left.",
    'ri-mpa_torp': "Homing Torpedoes: " + L['mpa'] + ", its bomb bay open with a slim torpedo dropping out, low over the sea, seen from below its front left.",
    'ri-awacs_radar': "High-Power Radar: the long radar beam on top of " + L['awacs'] + ", close up from above its front left, the fuselage below.",
    'ri-awacs_link': "Fighter Data Link: " + L['awacs'] + ", with two small grey fighter jets flying close beside it, seen from its front left.",
    # Navy
    'ri-frig_sonar': "Towed Sonar: the stern of " + L['frig'] + ", a thick cable running from it into the white wake, seen from above its rear left.",
    'ri-frig_aa': "Area Air Defence: the foredeck of " + L['frig'] + ", a block of vertical missile launch hatches open, close up from its front left; no flame.",
    'ri-crui_rng': "Long-Range Bombardment: " + L['crui'] + ", its two forward gun turrets trained to the right with barrels raised high, seen from its front left.",
    'ri-carr_deck': "Flight-Deck Crews: on the flight deck of " + L['carr'] + ", a plain grey fighter jet on the catapult with deck crew in muted coloured vests around it, seen from its front left.",
    'ri-carr_spd': "Nuclear Propulsion: " + L['carr'] + ", at high speed with a big white bow wave, seen from a low angle at its front left.",
    'ri-sub_torp': "Heavy Torpedoes: the bow of " + L['sub'] + ", under water, a torpedo tube door open, seen from its front left in blue-green water.",
    'ri-sub_quiet': "Quiet Drive: " + L['sub'] + ", gliding silently deep under water in dim blue-green light, its shrouded propeller at the tail, seen from its front left.",
    # Strategic Weapons
    'ri-cm_rng': "Cruise Missile Range: " + L['cm'] + ", flying low over the sea toward a distant coast, seen from its front left; no flame.",
    'ri-cm_spd': "Cruise Missile Speed: " + L['cm'] + ", flying very fast low over a desert with a little motion blur in the ground, seen from its front left; no flame.",
    'ri-bm_rng': "Ballistic Missile Range: a tall olive-grey ballistic missile climbing high above the clouds, a short bright exhaust under it (allowed here), seen from the side.",
    'ri-bm_pow': "Heavier Warhead: the cone-shaped nose section of a ballistic missile, close up on a work stand in a hangar, seen from its front left.",
    'ri-msl3': ("Anti-Missile Shield: a generic missile defence battery of an original design: an eight-wheeled truck with a "
                "big flat square radar panel, and behind it a launcher truck with large canisters raised upright; seen from its front left."),
    'ri-sat1': "Reconnaissance Satellites: a generic satellite of an original design with two wide solar panel wings and a camera pod, in orbit above the Earth, seen from its front left.",
    # Command & Logistics
    'ri-log1': "Motorized Supply: " + L['truck'] + ", loaded with crates, driving along a dirt road, seen from its front left.",
    'ri-log2': ("Combat Engineers: a generic tracked armoured engineer vehicle of an original design with a big dozer blade at "
                "its front and a folded crane arm on top, pushing earth, seen from its front left."),
    'ri-nav3': "Amphibious Doctrine: a generic landing craft with its bow ramp down at a sandy beach, " + L['ifv'] + " rolling down the ramp, seen from the front left.",
    'ri-log3': ("Field Hospitals: a generic military ambulance truck of an original design, plain olive with no markings, "
                "parked beside a large plain olive field tent at dusk, seen from its front left."),
}
R_BANNER_OUT, R_ICON_OUT = (2240, 560), 256

def grain(im, sigma, seed):
    """adds a light, fixed (seeded by the name) monochrome grain of about sigma levels: a dither against colour banding"""
    import numpy as np, zlib
    from PIL import Image
    a = np.asarray(im, dtype=np.float32); rng = np.random.default_rng(zlib.crc32(seed.encode()))
    a = a + rng.normal(0, sigma, a.shape[:2])[..., None]
    return Image.fromarray(np.clip(np.rint(a), 0, 255).astype(np.uint8))

def prep_research(names):
    """crops a research banner to a 4:1 strip around its focus and shrinks it to R_BANNER_OUT; shrinks an icon to
    R_ICON_OUT square; both saved as webp in assets/art/"""
    from PIL import Image
    for n in names:
        src = os.path.join(OUT, f'{n}.webp')
        if not os.path.exists(src): src = src[:-5] + '.png'
        im = Image.open(src).convert('RGB'); w, h = im.size
        if n in R_BANNERS:
            sh = round(w / 4); cy = R_FOCUS.get(n, 0.5) * h; y0 = int(max(0, min(h - sh, cy - sh / 2)))
            im = im.crop((0, y0, w, y0 + sh)).resize(R_BANNER_OUT, Image.LANCZOS); q = 80
        else:
            s0 = min(w, h); im = im.crop(((w - s0) // 2, (h - s0) // 2, (w + s0) // 2, (h + s0) // 2)).resize((R_ICON_OUT, R_ICON_OUT), Image.LANCZOS); q = 84
        im = grain(im, 1.6 if n in R_BANNERS else 1.0, n)   # a light grain so smooth skies do not band in the webp
        dst = os.path.join(ROOT, 'assets', 'art', f'{n}.webp'); im.save(dst, 'WEBP', quality=q, method=6)
        print(f'{os.path.relpath(dst, ROOT)}  {im.size[0]}x{im.size[1]}  {os.path.getsize(dst) // 1024} KB')

EDIT = ("Edit the attached picture. Change only this: {}. Keep everything else exactly as it is: every building, pier, "
        "crane, ship and the dry dock, their shapes, positions, sizes and directions, the camera angle, framing, lighting, "
        "shadows, colours and the plain flat light grey background. Do not add or remove anything.")
EDIT_V2 = ("Edit the attached picture of a building: it is one level of a building that grows from level 1 to level 5. Keep the "
           "same building and everything already in it exactly as it is (same designs, colours, materials, camera angle, lighting, "
           "shadow direction, rendering style and plain flat light grey background); you may scale the whole picture down a little "
           "so the additions fit. Add only this: {}. The result is the same building clearly grown, filling the frame with a small "
           "margin, nothing cut off, no text, no letters, no flags, no markings, no logos.")
GROW = ("The attached picture shows a facility drawn small in the middle of the frame, with empty light grey space around it. "
        "Turn it into the next, clearly larger level of the same base: keep every existing piece exactly where it is and at "
        "exactly its current size, and build the additions in the empty space around it so the larger base fills the frame "
        "with a small margin; every piece stays fully inside the frame, none touching or crossing its edge. Add: {}. New "
        "pieces have the same scale as the existing ones and the same rendering style, camera angle, lighting, shadow "
        "direction, colours and layout direction{}")
GROW_END = {   # per building, after "layout direction"
    'naval-yard': (": every new pier is parallel to the existing piers and joins the same row of piers, its long axis running "
                   "from the upper left to the lower right, and every new ship lies parallel to the existing ships, bow to the "
                   "lower right. The background stays a plain flat uniform light grey. No coastline, no water, no ground slab, "
                   "no text, no flags."),
    'army-base': (": new buildings line up with the existing ones along the same diagonal axes, in the same clean, simplified "
                  "3D game-asset look as the existing pieces. The background stays a plain flat uniform light grey. No ground "
                  "slab, base platform or outline around the whole base, no text, no letters, no flags, no emblems."),
    'recruiting-office': (", with the same realistic level of detail: new buildings line up with the existing ones along the "
                   "same diagonal axes. The background stays a plain flat uniform light grey. No ground slab, base platform "
                   "or outline around the whole base, no text, no letters, no emblems."),
}
SHRINK = 0.8   # a GROWS picture: the level before is shrunk to this in the middle of the frame, leaving room for the additions

API = 'https://generativelanguage.googleapis.com/v1beta/'
LOG = os.path.join(OUT, 'gen-art-log.jsonl')
# estimate only (third-party listings of the Gemini API prices, Nov 2026): output and thinking tokens $30 per million
# (a 1K picture is about 1,120 tokens, $0.0336), input $0.50 per million; batch jobs half price. The real bill is in Google AI Studio.
OUT_USD, IN_USD, BATCH = 30e-6, 0.5e-6, 0.5

# ---- NEW ART STYLE (v2): every new building subject (names starting "v2-") uses STYLE_V2. The older STYLE / STYLE_REAL /
# STYLE_CLEAN stay only as the record of how the old pictures were made.
# Owner's rule: ONE design per building type. Level 1 is drawn first; every next level (2-5) is then made by EDITING the
# previous level's picture (passed as the reference image), keeping the same building, angle, colours and lighting and only
# adding to it, so each level clearly reads as the same building growing. Levels 2-5 come later, after the owner's OK.
STYLE_V2 = ("Style: a clean, polished 3D strategy-game model render with crisp edges, simplified shapes and clear silhouettes, "
            "readable when shown small. Bright but natural colours, soft even studio lighting from the upper left with a soft "
            "shadow under each object. Slightly realistic materials: real concrete, brushed metal, asphalt and grass with "
            "subtle wear and weathering; not toy-like, not a photograph. Camera: the same fixed angled view from above for "
            "every picture, about 45 degrees down, three-quarter view, at the same scale. Background: a plain, flat, uniform "
            "light grey (#D9D9D9) with only a soft shadow; no base slab, no ground tile, no terrain, no horizon. Cropped tight "
            "and centred so the subject fills about 90 percent of the frame, nothing cut off. Square 1:1 image. Original "
            "generic design. No text, no letters, no numbers, no flags, no emblems, no logos, no watermark.")
V2_SCALE = " One-storey buildings are about the same size across the whole set of pictures."
SUBJECTS['v2-army-base-1'] = (
    "A temporary army field camp, level 1 of 5: two short rows of olive-green canvas military tents, low khaki sandbag walls "
    "around the tents and at the entrance, a light chain-link fence with one gate and a small sandbagged guard post, "
    "packed earth between the tents, and three olive-green army trucks parked beside the tents." + V2_SCALE)
SUBJECTS['v2-airbase-1'] = (
    "A small military airbase, level 1 of 5 (new layout, owner's choice 2026-11-17): one long straight asphalt runway with a "
    "white dashed centre line running horizontally along the very top of the picture, a parallel asphalt taxiway a little "
    "below it, joined to the runway by two short angled connector strips; below the taxiway a compact concrete apron with a "
    "slim control tower at its left end, two grey aircraft hangars with arched roofs of a different shape (one wide and one "
    "narrower, side by side, doors facing the taxiway) and one grey fighter jet parked on the apron. Grass strips beside the "
    "runway. Clean, readable, filling the frame, the jet fully inside the frame. No air-defence launchers, no missiles, "
    "no second runway." + V2_SCALE)
SUBJECTS['v2-naval-yard-1'] = (
    "A small military naval yard, level 1 of 5: three straight parallel concrete piers all pointing toward the bottom right of "
    "the picture, each pier's long axis running from the upper left down to the lower right, with two grey frigates "
    "moored alongside; behind the inner ends of the piers (upper left), two long grey warehouses and one small command "
    "building with a radio mast, and one dockside crane. The pieces stand on the plain grey background, which stands in "
    "for land and sea: no coast, no beach, no water, no waves." + V2_SCALE)
SUBJECTS['v2-missile-silo-1'] = (
    "A missile silo site, level 1 of 5: one round concrete silo with a closed, thick steel blast door cover (two sliding "
    "half-doors) set in a circular concrete pad, a small low concrete control bunker beside it, a short asphalt access "
    "road and a low chain-link fence with a gate around the site. No visible missile." + V2_SCALE)
SUBJECTS['v2-arms-industry-1'] = (
    "A small arms factory, level 1 of 5: one large industrial hall of pale concrete and corrugated metal with a sawtooth "
    "roof, a tall slim chimney, a loading dock with two parked grey trucks, a few stacked cargo crates and a small "
    "office annex." + V2_SCALE)
SUBJECTS['v2-recruiting-office-1'] = (
    "A small military recruiting office, level 1 of 5: one single-storey office building of pale concrete with a flat roof "
    "and a large glass front, a covered entrance, a flagpole without a flag, a short paved path in front with a small "
    "green lawn strip, and one parked olive-green jeep." + V2_SCALE)
SUBJECTS['v2-hospital-1'] = (
    "A small military field hospital, level 1 of 5: one single-storey white building with a flat roof and a large RED "
    "cross on a white square on the roof (owner's choice, 2026-11-16), a covered ambulance entrance, one white ambulance with a red "
    "stripe parked in front, and a short paved path." + V2_SCALE)
SUBJECTS['v2-fortifications-1'] = (
    "A defensive fortification as a cutaway, level 1 of 5: a rounded chunk of ground lifted out and cut open on its front "
    "faces to show the underground concrete bunker inside (a corridor, a command room with a table and a small ammunition "
    "room, reinforced concrete walls), with a layer of soil and rock below, and on top a green grass surface with a few "
    "trees and a small hatch entrance. The cutaway earth block is the subject itself, floating on the plain grey background, "
    "with only a soft shadow." + V2_SCALE)

SUBJECTS['v2-fortifications-map-1'] = (
    "A surface view of a small defensive position, level 1 of 5, seen from above and lying flat on the plain background (no "
    "floating chunk of ground, no cutaway, no cross-section): a low reinforced-concrete bunker entrance set into a patch of "
    "green grass, surrounded by a ring of khaki sandbags, with a short earth trench running from it. Materials and colours "
    "like the attached cutaway bunker. The grass patch has natural irregular edges and fades into the plain background." + V2_SCALE)

# ---- BUNKER MAP-VIEW OPTIONS (owner 2026-11-18: "flat and cartoonish next to the new buildings"; the green patch breaks the rule "no
# ground patch, only a soft shadow"). OPTIONS ONLY: nothing here replaces assets/art/bn-fort-*. Level 1 of each option is a new picture
# drawn with two anchor buildings attached as style references (BUNKER_REFS); level 5 is an EDIT of that option's level 1 (EDIT_V2).
# Names v2-bunker-<a|b|c>-<level> -> assets/art-src/ba-v2-bunker-<a|b|c>-<level>.png
BUNKER_REFS = ['ba-v2-recruiting-office-1.webp', 'ba-v2-hospital-1.webp']
BUNKER_NOGROUND = (" The bunker is a solid 3D object standing alone on the plain grey background with only a soft shadow: no green "
                   "grass patch, no ground patch, no base slab, no tile, no dirt pad, no ring of ground around it; any earth or grass "
                   "belongs to the object itself and ends in its own clean silhouette.")
SUBJECTS['v2-bunker-a-1'] = (
    "A low reinforced-concrete command bunker, level 1 of 5, drawn as one compact solid object: weathered pale concrete walls "
    "that slope outward at the base, banked with a neat earth berm up the lower walls and a thin earth-covered flat roof, one "
    "heavy steel blast door in the front face with a small concrete entrance porch, two short concrete ventilation stacks "
    "with mushroom caps on the roof, a short sandbag wall by the door and one small radio antenna mast on the roof."
    + BUNKER_NOGROUND + V2_SCALE)
SUBJECTS['v2-bunker-b-1'] = (
    "A hardened bunker built half sunk into a small grassy hillock, level 1 of 5, drawn as one compact solid object: a rounded "
    "mound of earth and grass with its own irregular rocky sides, the pale concrete front of the bunker emerging from the "
    "mound's lower front with a heavy steel blast door and a slanted concrete visor above it, one concrete ventilation "
    "stack and a small camouflaged observation slit on top. The mound is the object itself and ends in its own rounded "
    "silhouette with a soft contact shadow." + BUNKER_NOGROUND + V2_SCALE)
SUBJECTS['v2-bunker-c-1'] = (
    "A concrete pillbox with a short trench, level 1 of 5, drawn as one compact solid object: one low round reinforced-concrete "
    "pillbox with a domed roof and a wide firing slit, a ring of khaki sandbags round its front, and a short zig-zag trench "
    "cut into the object's own small raised block of earth, which has clean steep sides and a flat top and is the "
    "object's own base. No ground beyond that block." + BUNKER_NOGROUND + V2_SCALE)
# level 5: the change added to level 1 by an edit (EDIT_V2), same bunker clearly grown
BUNKER_EDITS = {
    'v2-bunker-a-5': ('v2-bunker-a-1', "make it level 5, a much larger and heavier version of the same command bunker: the same "
        "sloped, earth-bermed concrete block extended into a long two-wing complex with thicker walls, three heavy blast doors, "
        "six ventilation stacks, a taller lattice radar mast with a small rotating radar dish and a satellite dish on the roof, "
        "two small sandbagged gun positions on the roof, and more sandbag walls at the doors. Still one solid object with no "
        "ground patch, slab or tile, only a soft shadow."),
    'v2-bunker-b-5': ('v2-bunker-b-1', "make it level 5, a much larger hardened complex in the same hillock, which grows wider "
        "with a second and third mound joined to it: three heavy blast doors with concrete visors, several ventilation stacks, "
        "two concrete machine-gun turret cupolas, a radar mast and a small radar dish on top, and sandbag positions at the "
        "doors. The mounds stay part of the object with their own rocky rounded silhouette; no ground patch, slab or tile, "
        "only a soft shadow."),
    'v2-bunker-c-5': ('v2-bunker-c-1', "make it level 5, a much larger version: a ring of four concrete pillboxes (two with "
        "domed roofs and firing slits, two with small gun turrets) linked by deeper zig-zag trenches cut into a larger raised "
        "block of earth with clean steep sides, a central concrete command blockhouse with a short antenna mast, more "
        "sandbags and steel anti-tank hedgehogs on the block's edge. The earth block is the object's own base; no ground "
        "patch beyond it, only a soft shadow."),
}

# ---- BUNKER C WITHOUT THE BOX (owner 2026-11-18: "bunker c is the best but i dont like how its on a box ... take that box out").
# OPTIONS ONLY. Edits of option C's pictures (EDIT_V2): the raised square earth block goes, the trench and sandbags become low
# earthworks of the object itself. Names v2-bunker-cn-<1|5> -> assets/art-src/ba-v2-bunker-cn-<1|5>.png
_CN_COMMON = ("nothing new, and the picture is not grown or enlarged; the only change is a removal. Keep the same pillbox(es), "
    "sandbags, zig-zag trench and all other details, the same camera angle, light and scale. Remove the raised square block of "
    "earth completely, with no brown earth sides and no square or diamond-shaped earth top left under it. The trench and the "
    "sandbags now belong to the object itself: low, irregular earthworks hugging {what}, with a natural, uneven, organic outline "
    "(no straight edges, no square corners) that ends in its own clean silhouette, a little grass and bare earth only on those "
    "earthworks, and the trench still cut into them.{extra} The object stands alone on the plain flat light grey background with "
    "only a soft contact shadow: no ground patch, no slab, no tile, no earth pad, no base of any kind")
BUNKER_EDITS['v2-bunker-cn-1'] = ('v2-bunker-c-1', _CN_COMMON.format(what="the round concrete pillbox", extra=""))
BUNKER_EDITS['v2-bunker-cn-5'] = ('v2-bunker-c-5', _CN_COMMON.format(what="the four pillboxes and the central blockhouse, joining "
    "them into one irregular cluster", extra=" Keep the central blockhouse, the antenna and the steel hedgehogs."))

# ---- UNIT LOOKS (owner's decisions 2026-11-18, docs/UNIT-LOOKS-PROMPTS.md): every unit has its own pictures for each of the 5
# doctrine groups (nato, east, china, europe, export), 3 looks each; every look is a NEW generation, not an edit of the one before.
# Names: ul-<unit>-<group>-<look>, saved as assets/art-src/ul-<unit>-<group>-<look>.png. These pictures are for every place that
# shows a unit (research card, army bar details, the map figures), so they are drawn STRAIGHT DOWN, nose up (the map turns each
# figure to its heading, which a tilted view cannot do). STYLE_V2_UNIT is STYLE_V2 with only its camera and framing sentences
# changed; everything else (light, materials, colours, background, no-text rule) is word for word the same.
_CAM_OLD = ("Camera: the same fixed angled view from above for every picture, about 45 degrees down, three-quarter view, "
            "at the same scale. ")
_CAM_NEW = ("Camera: the same fixed view for every picture: exactly straight down from above, a true top-down plan view "
            "with no perspective tilt, the unit's front pointing to the top of the picture, at the same scale. ")
_CROP_OLD = "Cropped tight and centred so the subject fills about 90 percent of the frame, nothing cut off. "
_CROP_NEW = ("Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent "
             "of the picture's height, nothing cut off. ")
assert _CAM_OLD in STYLE_V2 and _CROP_OLD in STYLE_V2
STYLE_V2_UNIT = STYLE_V2.replace(_CAM_OLD, _CAM_NEW).replace(_CROP_OLD, _CROP_NEW)
UNIT_ANCHORS = ['ba-v2-army-base-1.webp', 'ba-v2-naval-yard-1.webp']   # style references for a group's first look
UNIT_PREFIX_NEW = ("The attached pictures are two buildings from the same game. They are style references only: copy their "
                   "rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and "
                   "their plain flat light grey background. Do NOT copy their camera angle or anything in them: no buildings, "
                   "tents, trucks, ships or ground in the new picture. The picture to draw is described below, seen straight "
                   "down from above.")
UNIT_PREFIX_FAMILY = ("The attached picture is generation 1 of this group's {unit}. Use it only as the reference for the camera "
                      "(exactly straight down), the size and framing, the lighting, the rendering style, the paint colour, the "
                      "plain grey background and the group's family look. Draw a NEW, clearly different and newer model as "
                      "described below. Do not copy the attached {unit}: its shape is replaced by the new design.")
TANK_FRAME = ("A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front "
              "pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and "
              "top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent "
              "of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight "
              "soft shadow right under it.")
TANK_TAIL = (" Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family "
             "look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.")
UNIT_GROUPS = ['nato', 'east', 'china', 'europe', 'export']
UNIT_TANK = {   # group: (family look and paint, [generation 1, 2, 3])
    'nato': ("Family look (US/NATO): flat, angular, slab-sided turret built from straight flat armour plates with sharp edges; a "
             "wide, heavy, low-slung hull with a long flat deck and rubber-padded tracks; matte sand-tan paint.",
             ["Generation 1 of 3, the oldest, a Cold War era design: a simple blocky, flat-faced turret with a plain commander's "
              "cupola and a searchlight box beside the gun, a tall plain hull with bare track guards and five large road wheels "
              "per side, a gun with a fume-extractor bulge, a few stowage boxes on the rear deck.",
              "Generation 2 of 3, a clearly newer and heavier design: a wide, low, wedge-shaped turret of flat angular armour "
              "plates with a flat sloped front, a long rectangular ammunition bustle at the rear of the turret, full side armour "
              "skirts over the tracks, a roof-mounted thermal sight box, a gun with a thermal sleeve, a broad exhaust grille "
              "across the rear deck.",
              "Generation 3 of 3, the newest, a near-future design: an ultra-flat angular turret covered in sharp faceted "
              "add-on armour panels, a remote weapon station on the roof, four small flat active-protection sensor panels at the "
              "turret corners, slim sensor masts, an auxiliary power box at the rear of the hull, full-length side skirts, a "
              "longer gun."]),
    'east': ("Family look (Eastern): a low, rounded, dome-like turret set slightly forward on a low, compact, short hull; "
             "reactive-armour bricks (rows of small square blocks) that cover more of the tank in every generation; smoke-grenade "
             "launcher tubes along the turret sides; a log and fuel drums on the rear deck; dark olive-green paint.",
             ["Generation 1 of 3, the oldest: a small, low, smooth dome turret, a low hull with six small road wheels per side "
              "and thin track guards, a smoothbore gun with a bore-evacuator bulge, an infrared searchlight beside the gun, a "
              "first small set of reactive bricks on the hull front only.",
              "Generation 2 of 3, a clearly newer design: a larger, low, rounded turret with rows of reactive bricks across its "
              "whole front and sides and across the hull front, thick rubber-and-metal side skirts, a missile-capable gun, "
              "smoke launcher tubes on the turret sides, a remote machine gun on the roof.",
              "Generation 3 of 3, the newest: a very low, wide, rounded turret fully covered in reactive bricks, a panoramic "
              "sight dome and a remote machine-gun station on the roof, active-protection launcher tubes around the turret, "
              "bricks and slat armour over the whole hull, armoured fuel tanks at the rear."]),
    'china': ("Family look (China, its own lines): a broad, low turret shaped like a flat arrowhead, with a long sloped front and "
              "a large rectangular ammunition bustle box at the rear; a clean, smooth, boxy hull with a long, sharply sloped "
              "front plate and seven small, evenly spaced road wheels; a pair of laser-warning sensors on the turret front; "
              "plain mid-green paint.",
              ["Generation 1 of 3, the oldest: a modest rounded-arrowhead turret with a long, thin smoothbore gun, a simple hull "
               "with plain track guards, a snorkel tube and a spare fuel drum on the rear deck, no add-on armour.",
               "Generation 2 of 3, a clearly newer design: a bigger, angular arrowhead turret with a wedge of applied composite "
               "armour on its front, a large boxy rear bustle, side skirts made of rows of small plates, a gun with a thermal "
               "sleeve, a laser-warning pair and a roof machine gun.",
               "Generation 3 of 3, the newest: a very clean, low, smooth-faceted turret with flat integrated sensor panels, a "
               "remote weapon station on the roof, active-protection domes at the turret corners, a longer gun, a hull front "
               "of smooth sloped composite armour, full side skirts."]),
    'europe': ("Family look (Europe): a long, sleek, low and smoothly sloped design: a long hull with seven road wheels, a turret "
               "of sloping, rounded-faceted shapes with a large rear bustle that holds an automatic loader, a long slender gun, "
               "a small raised pod for the commander's panoramic sight, a clean low silhouette; dark grey-green paint.",
               ["Generation 1 of 3, the oldest: a light, fast, compact design: a narrow hull, a small egg-shaped rounded cast "
                "turret, a long slender gun with a muzzle brake, a plain commander's cupola, almost no add-on armour, bare track "
                "guards.",
                "Generation 2 of 3, a clearly newer design: a bigger, smoothly sloped wedge turret with a long rounded rear "
                "bustle, side skirts, a gun with a thermal sleeve, a raised panoramic sight pod, a hull with a sharply sloped "
                "front.",
                "Generation 3 of 3, the newest: a tall, wide, unmanned turret of smooth faceted panels, a small second weapon "
                "mounted beside the main gun, a slim sensor mast, modular armour blocks, active-protection sensors, a long "
                "gun, a low sleek hull with full skirts."]),
    'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a round "
               "or flat-topped turret on a boxy hull, bolt-on kits and add-on parts that look like they were fitted by the "
               "buyer, faded ochre-sand paint with a few patches of darker touch-up paint.",
               ["Generation 1 of 3, the oldest, a post-war pattern: a round dome turret with a simple long gun, a small tall "
                "hull with four large road wheels per side, an unditching beam across the rear deck, an open-top searchlight, a "
                "machine gun on the turret roof.",
                "Generation 2 of 3, a clearly newer, widely exported 1970s-80s pattern: a flat-topped rounded turret on a longer "
                "hull, a rangefinder box on the turret, bolt-on side skirts, a smoke-launcher pack, a few add-on armour plates "
                "on the turret front, a snorkel tube.",
                "Generation 3 of 3, the newest, a modern export-grade design: a modular angular turret with bolt-on composite "
                "armour packages, a remote machine-gun station, a thermal sight box, an auxiliary power pack at the rear, "
                "side skirts, a clean but practical look made to be sold to many armies."]),
}
UNIT_LOOKS = {}   # name: {unit, subject, refs (names in assets/art-src), fresh}
for _g in UNIT_GROUPS:
    for _n in (1, 2, 3):
        UNIT_LOOKS[f'ul-tank-{_g}-{_n}'] = {
            'unit': 'main battle tank', 'fresh': _n == 1, 'group': _g, 'look': _n,
            'subject': TANK_FRAME + ' ' + UNIT_TANK[_g][0] + ' ' + UNIT_TANK[_g][1][_n - 1] + TANK_TAIL,
            'refs': UNIT_ANCHORS if _n == 1 else [f'ul-tank-{_g}-1']}

PRINT_ONLY = False   # --print / --dry-run: prompts are built without needing the earlier pictures, and nothing is sent
REVIEW = False       # --review: the Gemini check after each picture
REF_USED = {}        # name: the reference picture files its request attached (for the check)

def ul_path(r):
    """a reference picture's file in assets/art-src (a full file name, or a stem: .png then .webp), or None"""
    for q in (r, r + '.png', r + '.webp'):
        if os.path.exists(os.path.join(OUT, q)): return os.path.join(OUT, q)
    return None

def unit_request_text(name):
    u = UNIT_LOOKS[name]
    return (UNIT_PREFIX_NEW if u['fresh'] else UNIT_PREFIX_FAMILY.format(unit=u['unit'])) + '\n\n' + u['subject'] + '\n\n' + STYLE_V2_UNIT

# ---- THE CHECK (--review): a Gemini text model looks at each new picture against the Art Bible and says PASS or FLAG.
# It never redoes anything: a FLAG is shown to the owner, who decides (Art Bible standing rule).
REVIEW_MODEL = os.environ.get('GEMINI_REVIEW_MODEL') or 'gemini-3.8-flash'   # a Flash-class text model (2.5-flash is closed to new users, 2026-11-18)
# ESTIMATE ONLY, not verified (the price page could not be reached): about $0.30 per million tokens in (text and images) and
# $2.50 per million out (thinking included), the published Flash-class price; a check is about 3,000 tokens in and 400 out
REV_IN_USD, REV_OUT_USD = 0.30e-6, 2.50e-6
REVIEW_PROMPT = (
    "You are the quality checker for the pictures of a strategy game. Picture 1 is the NEW picture to check. {refs}\n\n"
    "What the new picture was asked to show:\n{what}\n\n"
    "The art style it must match (the game's STYLE_V2): {style}\n\n"
    "Check the new picture against this checklist, each point on its own:\n"
    "1. SAME UNIT: it shows the kind of unit that was asked for. With a reference picture of the same unit attached, it keeps that "
    "unit's shape family, size in the frame and paint colour; a picture made as a new generation must be clearly a different, newer "
    "model, not a copy of the reference.\n"
    "2. STYLE: it matches the anchor style: a clean, polished 3D game-model render with crisp edges and soft studio light from the "
    "upper left, slightly realistic materials; not a photograph, not toy-like, not a drawing.\n"
    "3. BACKGROUND: the background is a plain, flat, uniform light grey with at most a faint soft shadow; no base slab, ground, "
    "terrain, horizon or other objects.\n"
    "4. FRAMING: the whole unit is inside the frame, nothing cut off, centred, filling about 90 percent of the frame along its "
    "length, seen from the same angle and at the same size as the reference or the rest of its set (for units: exactly straight down, "
    "nose up).\n"
    "5. NO MARKINGS: no text, letters, numbers, logos, flags, emblems, roundels, stars or national insignia anywhere.\n"
    "6. ORIGINAL: it is not a line-for-line copy of a real, recognisable product (a real tank, jet, ship or similar); it may only "
    "carry the general family look of its group.\n"
    "7. NO EXTRAS: exactly the one unit asked for (or the set asked for); no extra, duplicated, partial or background units, no "
    "people, no buildings.\n\n"
    'Answer with JSON only, in this shape: {{"verdict": "PASS" or "FLAG", "reasons": ["short plain reason", "..."]}}. '
    "Use PASS only if all seven points are fine (reasons may then be empty). Use FLAG if any point fails or you are unsure, and "
    "name each failed point by its number and a short plain reason (under 20 words each).")

def review_what(name):
    if name in UNIT_LOOKS: return UNIT_LOOKS[name]['subject']
    if name in SUBJECTS: return SUBJECTS[name]
    if name in BUNKER_EDITS: return 'an edit of the same bunker at level 1, grown to level 5: ' + BUNKER_EDITS[name][1]
    if name in GROWS: return 'a building level: ' + GROWS[name][1]
    return name

def review_refs(name):
    if name in REF_USED: return REF_USED[name]
    if name in UNIT_LOOKS: return [os.path.relpath(p, ROOT) for p in (ul_path(r) for r in UNIT_LOOKS[name]['refs']) if p]
    if name in GROWS:
        q = os.path.join(OUT, f'ba-{GROWS[name][0]}.png'); return [os.path.relpath(q, ROOT)] if os.path.exists(q) else []
    return []

def review(name, path):
    """the check: returns (verdict, reasons); logs its own cost row; writes <picture>.review.txt. Never raises, never retries."""
    refs = review_refs(name)
    if not refs: rtxt = 'There is no reference picture.'
    elif name in UNIT_LOOKS and not UNIT_LOOKS[name]['fresh']: rtxt = 'Picture 2 is the reference it was made from (generation 1 of the same unit and group).'
    elif name in UNIT_LOOKS: rtxt = 'Pictures 2 and 3 are the style anchors (buildings): compare style only, not the subject or the camera.'
    else: rtxt = 'The other attached picture(s) are the reference(s) it was made from.'
    text = REVIEW_PROMPT.format(refs=rtxt, what=review_what(name), style=STYLE_V2_UNIT if name in UNIT_LOOKS else STYLE_V2)
    parts = [{'text': text}, image_part(path)] + [image_part(os.path.join(ROOT, r)) for r in refs]
    body = {'contents': [{'parts': parts}], 'generationConfig': {'responseMimeType': 'application/json'}}
    verdict, reasons, usd, tok = 'FLAG', ['the check could not run or its answer was unreadable: look at the picture yourself'], 0.0, {}
    try:
        r = call('POST', f'models/{REVIEW_MODEL}:generateContent', body); u = r.get('usageMetadata', {})
        usd = ((u.get('candidatesTokenCount', 0) + u.get('thoughtsTokenCount', 0)) * REV_OUT_USD + u.get('promptTokenCount', 0) * REV_IN_USD)
        tok = {k: u.get(k) for k in ('promptTokenCount', 'candidatesTokenCount', 'thoughtsTokenCount')}
        raw = ''.join(p.get('text', '') for c in r.get('candidates', []) for p in c.get('content', {}).get('parts', []) if not p.get('thought'))
        j = json.loads(raw.strip().strip('`').removeprefix('json').strip())
        if j.get('verdict') == 'PASS': verdict, reasons = 'PASS', [str(x) for x in j.get('reasons', [])]
        else: verdict, reasons = 'FLAG', [str(x) for x in j.get('reasons', [])] or ['flagged without a reason: look at the picture yourself']
    except SystemExit as e: reasons = [f'the check failed ({e}): look at the picture yourself']
    except Exception as e: reasons = [f'the check answer could not be read ({type(e).__name__}): look at the picture yourself']
    rf = os.path.splitext(path)[0] + '.review.txt'
    with open(rf, 'w') as f: f.write(verdict + '\n' + ''.join(f'- {x}\n' for x in reasons))
    with open(LOG, 'a') as f:
        f.write(json.dumps({'name': name + ' (check)', 'file': os.path.relpath(rf, ROOT), 'batch': False, 'usd_est': round(usd, 4), 'review': verdict, 'tokens': tok}) + '\n')
    return verdict, reasons

def building(name): return name.rsplit('-', 1)[0]   # naval-yard-3 -> naval-yard

def prompt(name): return SUBJECTS[name] + '\n\n' + STYLES.get(building(name), STYLE_V2 if name.startswith('v2-') else STYLE)

def stem(name): return name if name in ICONS or name in RES_ICONS or name in R_BANNERS or name in R_ICONS or name in UNIT_LOOKS else f'ba-{name}'

def free_path(name, force):
    p = os.path.join(OUT, f'{stem(name)}.png')
    taken = lambda q: os.path.exists(q) or os.path.exists(q[:-4] + '.webp')
    if force or not taken(p): return p
    v = 2
    while taken(os.path.join(OUT, f'{stem(name)}.v{v}.png')): v += 1
    return os.path.join(OUT, f'{stem(name)}.v{v}.png')

def shrunk(src):
    """the picture shrunk to SHRINK, centred on its own background grey (the median of its border), as PNG bytes"""
    from PIL import Image
    im = Image.open(src).convert('RGB'); w, h = im.size
    border = [im.getpixel((x, y)) for x in range(0, w, 8) for y in (0, h - 1)] + [im.getpixel((x, y)) for y in range(0, h, 8) for x in (0, w - 1)]
    bg = tuple(sorted(c[i] for c in border)[len(border) // 2] for i in range(3))
    out = Image.new('RGB', (w, h), bg); sm = im.resize((round(w * SHRINK), round(h * SHRINK)), Image.LANCZOS)
    out.paste(sm, ((w - sm.width) // 2, (h - sm.height) // 2)); b = io.BytesIO(); out.save(b, 'PNG'); return b.getvalue()

def cutout(im, lo=14, hi=48, pad=0.06):
    """the icon with its plain grey background made transparent: pixels joined to the border whose colour is within hi of
    the background grey (median of the border) are background, fading from opaque at hi to clear at lo (edges keep their
    colour, un-mixed from the grey); trimmed to the icon and centred on a square with a small margin"""
    import numpy as np
    from PIL import Image, ImageDraw
    a = np.asarray(im.convert('RGB')).astype(np.float32); h, w, _ = a.shape
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]); bg = np.median(border, 0)
    d = np.sqrt(((a - bg) ** 2).sum(-1))
    m = Image.fromarray(np.where(d < hi, 255, 0).astype(np.uint8)).copy()   # a copy: floodfill does nothing on the read-only array view
    for xy in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        if m.getpixel(xy) == 255: ImageDraw.floodfill(m, xy, 128)
    joined = np.asarray(m) == 128
    al = np.where(joined, np.clip((d - lo) / (hi - lo), 0, 1), 1.0)
    rgb = np.where(al[..., None] > 0.02, (a - (1 - al[..., None]) * bg) / np.maximum(al[..., None], 0.02), 0)
    out = np.dstack([np.clip(rgb, 0, 255), al * 255]).astype(np.uint8)
    ys, xs = np.nonzero(al > 0.02); x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    cut = Image.fromarray(out, 'RGBA').crop((x0, y0, x1, y1)); side = round(max(cut.size) * (1 + 2 * pad))
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0)); sq.paste(cut, ((side - cut.width) // 2, (side - cut.height) // 2)); return sq

def image_part(r):
    if isinstance(r, bytes): return {'inlineData': {'mimeType': 'image/png', 'data': base64.b64encode(r).decode()}}
    mime = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'webp': 'image/webp'}.get(os.path.splitext(r)[1].lower().lstrip('.'), 'image/png')
    return {'inlineData': {'mimeType': mime, 'data': base64.b64encode(open(r, 'rb').read()).decode()}}

def request(name, refs, change=None):
    """the generateContent request body for a name (SUBJECTS or GROWS), or for an --edit (change set)"""
    if change is not None:
        REF_USED[name] = [os.path.relpath(x, ROOT) for x in refs if isinstance(x, str)]
    if change is not None: text, images = (EDIT_V2 if name.startswith('v2-') else EDIT).format(change), refs
    elif name in GROWS:
        before, add = GROWS[name]; src = os.path.join(OUT, f'ba-{before}.png')
        if not os.path.exists(src): raise SystemExit(f'{name} grows from {os.path.relpath(src, ROOT)}, which is not there yet')
        text, images = GROW.format(add, GROW_END.get(building(name), GROW_END['recruiting-office'])), [shrunk(src)]
    elif name in REDRAWS:
        src, desc = REDRAWS[name]; src = os.path.join(OUT, src)
        if not os.path.exists(src): raise SystemExit(f'{name} is redrawn from {os.path.relpath(src, ROOT)}, which is not there')
        text, images = REDRAW.format(desc), [src]
    elif name in UNIT_LOOKS:   # a unit look: a new picture drawn from its text, with its reference pictures attached
        u = UNIT_LOOKS[name]; paths = [ul_path(r) for r in u['refs']]
        if not PRINT_ONLY and not all(paths): raise SystemExit(f'{name} needs {[r for r, p in zip(u["refs"], paths) if not p]} first: make the group\'s look 1 before looks 2 and 3 (one batch after the other)')
        text, images = unit_request_text(name), [p for p in paths if p]
        REF_USED[name] = [os.path.relpath(p, ROOT) if p else r + ' (not made yet)' for r, p in zip(u['refs'], paths)]
        return {'contents': [{'parts': [{'text': text}] + [image_part(p) for p in images]}],
                'generationConfig': {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': '1:1', 'imageSize': '1K'}}}
    elif name in ICON_EDITS:
        before, text = ICON_EDITS[name]; src = os.path.join(OUT, f'{before}.grey.png')
        if not os.path.exists(src): raise SystemExit(f'{name} is made from {os.path.relpath(src, ROOT)}, which is not there yet')
        images = [src]
    elif name in ICONS: text, images = ICONS[name], []
    elif name in RES_ICONS: text, images = RES_ICONS[name] + '\n\n' + RES_STYLE, [os.path.join(OUT, r) for r in RES_REFS]
    elif name in R_BANNERS or name in R_ICONS:   # the research screen: no reference picture, the shared style
        ban = name in R_BANNERS
        return {'contents': [{'parts': [{'text': (R_BANNERS if ban else R_ICONS)[name] + '\n\n' + (R_BANNER if ban else R_ICON) + '\n\n' + R_STYLE}]}],
                'generationConfig': {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': '21:9' if ban else '1:1', 'imageSize': '2K' if ban else '1K'}}}
    else:
        text, images = prompt(name), refs
        if refs and building(name) in STYLES:   # a detail reference only (e.g. a top-down crop of another base)
            text = ('The attached picture is a top-down detail crop of another military base. Match only its realistic level of '
                    'detail, its materials and textures; use the camera, background and layout described here, not the '
                    "picture's.\n\n") + text
        elif refs: text = ('Match the rendering style, camera angle, palette, lighting and plain grey background of the attached '
                           'reference picture(s), but draw the facility described here.\n\n') + text
    return {'contents': [{'parts': [{'text': text}] + [image_part(r) for r in images]}],
            'generationConfig': {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': '1:1', 'imageSize': '1K'}}}

def call(method, path, body=None):
    headers = {'Content-Type': 'application/json'}
    if os.environ.get('GEMINI_API_KEY'): headers['x-goog-api-key'] = os.environ['GEMINI_API_KEY']
    req = urllib.request.Request(API + path, json.dumps(body).encode() if body is not None else None, headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=300) as r: return json.load(r)
    except urllib.error.HTTPError as e:
        try: msg = json.load(e).get('error', {}).get('message', '')
        except Exception: msg = ''
        raise SystemExit(f'API error {e.code}: {msg}')

def save(name, reply, force, batch):
    """saves the picture of one reply, logs its cost; returns the path or None"""
    u = reply.get('usageMetadata', {})
    usd = ((u.get('candidatesTokenCount', 0) + u.get('thoughtsTokenCount', 0)) * OUT_USD + u.get('promptTokenCount', 0) * IN_USD) * (BATCH if batch else 1)
    data = next((base64.b64decode(p['inlineData']['data']) for c in reply.get('candidates', [])
                 for p in c.get('content', {}).get('parts', []) if 'inlineData' in p and not p.get('thought')), None)
    p = None
    if data:
        from PIL import Image   # saved as a true PNG whatever format the API returns
        p = free_path(name, force); im = Image.open(io.BytesIO(data))
        if name in ICONS: im.save(p[:-4] + '.grey.png'); cutout(im).save(p)
        elif name in R_BANNERS or name in R_ICONS: p = p[:-4] + '.webp'; im.convert('RGB').save(p, 'WEBP', quality=92, method=6)   # research sources: webp q92, not big PNGs
        else: im.save(p)
    verdict, reasons = (review(name, p) if REVIEW and p else (None, []))   # the check only flags; nothing is redone
    with open(LOG, 'a') as f:
        row = {'name': name, 'file': p and os.path.relpath(p, ROOT), 'batch': batch, 'usd_est': round(usd, 4),
               'tokens': {k: u.get(k) for k in ('promptTokenCount', 'candidatesTokenCount', 'thoughtsTokenCount')}}
        if verdict: row['review'], row['review_reasons'] = verdict, reasons
        f.write(json.dumps(row) + '\n')
    if p: print(f'{os.path.relpath(p, ROOT)}  (~${usd:.4f})')
    if verdict: print(f'  check: {verdict}' + ''.join(f'\n    - {x}' for x in reasons) + ('\n  (flag only: nothing is redone; show the owner and ask)' if verdict == 'FLAG' else ''))
    if not p: print(f'{name}: no picture in the reply, finish {[c.get("finishReason") for c in reply.get("candidates", [])]} '
                f'{reply.get("promptFeedback", "")}  (~${usd:.4f})')
    return p

def batch_run(jobs, force):
    """jobs: [(name, request body)] sent as one batch job; waits for it and saves the pictures"""
    body = {'batch': {'display_name': 'gen-art ' + ' '.join(n for n, _ in jobs)[:100],
                      'input_config': {'requests': {'requests': [{'request': r, 'metadata': {'key': n}} for n, r in jobs]}}}}
    op = call('POST', f'models/{MODEL}:batchGenerateContent', body)
    job = op.get('name') or op.get('metadata', {}).get('name')
    print(f'batch job {job} sent ({len(jobs)} pictures); waiting (if stopped: --collect {job})', flush=True)
    collect(job, force)

def collect(job, force):
    t0 = time.time()
    while True:
        op = call('GET', job)
        state = op.get('metadata', {}).get('state') or op.get('state', '')
        if op.get('done') or state.endswith(('SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED')): break
        print(f'  {state or "pending"} after {int(time.time() - t0)} s', flush=True); time.sleep(30)
    if op.get('error'): raise SystemExit(f'batch job failed: {op["error"].get("message", op["error"])}')
    out = op.get('response') or op.get('metadata', {}).get('output') or {}
    items = out.get('inlinedResponses', {}).get('inlinedResponses', [])
    if not items: raise SystemExit(f'batch job {job} ended ({state}) with no inline replies')
    for it in items:
        name = it.get('metadata', {}).get('key', 'unknown')
        if 'error' in it: print(f'{name}: error {it["error"].get("message", it["error"])}'); continue
        save(name, it.get('response', {}), force, True)

def main(a):
    if not a or a[0] in ('-h', '--help'): print(__doc__); return
    if a[0] == '--list':
        for n in list(SUBJECTS) + list(UNIT_LOOKS) + list(GROWS) + list(ICONS) + list(REDRAWS) + list(RES_ICONS) + list(R_BANNERS) + list(R_ICONS):
            print(('done ' if any(os.path.exists(os.path.join(OUT, f'{stem(n)}.{x}')) for x in ('png', 'webp')) else '     ') + n + (f'  (grows from {GROWS[n][0]})' if n in GROWS else ''))
        return
    if a[0] == '--cost':
        rows = [json.loads(l) for l in open(LOG)] if os.path.exists(LOG) else []
        calls = sum(r.get('calls', 1) for r in rows); usd = sum(r.get('usd_est', 0) for r in rows)
        print(f'{calls} calls, about ${usd:.2f} (estimate; the real bill is in Google AI Studio)'); return
    global PRINT_ONLY, REVIEW
    PRINT_ONLY = '--print' in a or '--dry-run' in a; REVIEW = '--review' in a   # (before the requests are built)
    force = show = batch = False; refs, names, edits = [], [], []
    i = 0
    while i < len(a):
        if a[i] == '--force': force = True
        elif a[i] in ('--print', '--dry-run'): show = True
        elif a[i] == '--review': pass   # (set above)
        elif a[i] == '--batch': batch = True
        elif a[i] == '--ref': i += 1; refs.append(a[i])
        elif a[i] == '--collect': collect(a[i + 1], force); return
        elif a[i] == '--prep-research': prep_research(a[i + 1:]); return
        elif a[i] == '--edit': edits.append((a[i + 2], [a[i + 1]], a[i + 3])); i += 3
        elif a[i] in BUNKER_EDITS: edits.append((a[i], [os.path.join(OUT, f'ba-{BUNKER_EDITS[a[i]][0]}.png')], BUNKER_EDITS[a[i]][1]))
        elif a[i] in SUBJECTS or a[i] in UNIT_LOOKS or a[i] in GROWS or a[i] in ICONS or a[i] in REDRAWS or a[i] in RES_ICONS or a[i] in R_BANNERS or a[i] in R_ICONS: names.append(a[i])   # repeat a name for more tries
        else: raise SystemExit(f'unknown name or option: {a[i]} (see --list)')
        i += 1
    if batch and any(n in GROWS and GROWS[n][0] in names for n in names):
        raise SystemExit('a level that grows from another level in the same batch has to wait for it: send them one after the other')
    if batch and not PRINT_ONLY and any(n in UNIT_LOOKS and not UNIT_LOOKS[n]['fresh'] and UNIT_LOOKS[n]['refs'][0] in names for n in names):
        raise SystemExit('looks 2 and 3 take their group\'s look 1 as the reference: send look 1 first, then looks 2 and 3 in the next batch')
    jobs = [(n, request(n, refs)) for n in names] + [(n, request(n, r, c)) for n, r, c in edits]
    if show:
        for n, r in jobs:
            print(f'--- {n}')
            if n in UNIT_LOOKS: print(f'[{"fresh picture" if UNIT_LOOKS[n]["fresh"] else "new picture, group look 1 attached"}; attached: {", ".join(REF_USED[n])}]')
            print(f'{r["contents"][0]["parts"][0]["text"]}\n')
        if REVIEW: print('--- THE CHECK (sent after each picture, with the new picture first and its references after it)\n' + REVIEW_PROMPT.format(refs='<which pictures are attached>', what='<the picture\'s prompt>', style='<STYLE_V2>') + f'\n[model: {REVIEW_MODEL}]')
        return
    os.makedirs(OUT, exist_ok=True)
    if batch: batch_run(jobs, force)
    else:
        for n, r in jobs: save(n, call('POST', f'models/{MODEL}:generateContent', r), force, False)

main(sys.argv[1:])
