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
# ---- THREE PICTURES PER LOOK (owner's decisions 2026-11-18, second set): every look has
#   side  : the MASTER, a front three-quarter side view from slightly above, on the plain #D9D9D9 background (cut out later for the
#           research tree's diamond); made fresh, with the two anchor buildings attached (looks 2 and 3 also get their group's look-1 side view)
#   scene : made FROM the side view (attached): the same tank in action in its natural setting, filling a 3:2 landscape picture (the card)
#   top   : made FROM the side view (attached): the same tank seen exactly straight down, nose up, STYLE_V2_UNIT framing (map, army bar)
# The family-look and generation text of each look is the approved text; only the camera and framing change per kind.
_CAM_SIDE = ("Camera: the same fixed view for every picture: a front three-quarter side view from slightly above (about 30 degrees "
             "down, the classic strategy-game model angle, the same angle family as the attached buildings), the unit's front turned "
             "toward the lower right of the picture, at the same scale. ")
_CROP_SIDE = ("Cropped and centred so the whole unit (nose to tail, including any gun barrel) fills about 85 percent of the "
              "picture's width, nothing cut off. ")
STYLE_V2_SIDE = STYLE_V2.replace(_CAM_OLD, _CAM_SIDE).replace(_CROP_OLD, _CROP_SIDE)
UNIT_PREFIX_SIDE_NEW = ("The attached pictures are two buildings from the same game. They are style references only: copy their "
                        "rendering style, materials, colours, soft studio light from the upper left, level of detail and finish, and "
                        "their plain flat light grey background. Do NOT copy anything in them: no buildings, tents, trucks, ships or "
                        "ground in the new picture. The buildings are seen at an angle from above, and the new picture uses the same "
                        "angle family, as described below: a front three-quarter side view from slightly above.")
UNIT_PREFIX_SIDE_FAMILY = ("The first two attached pictures are two buildings from the same game. They are style references only: copy "
                           "their rendering style, materials, colours, soft studio light from the upper left, level of detail and "
                           "finish, and their plain flat light grey background; do NOT copy anything in them. The third attached "
                           "picture is generation 1 of this group's {unit}, seen from the same three-quarter side view. Use it only as "
                           "the reference for the camera angle, the size and framing, the lighting, the rendering style, the paint "
                           "colour, the plain grey background and the group's family look. Draw a NEW, clearly different and newer "
                           "model as described below. Do not copy the attached {unit}: its shape is replaced by the new design.")
UNIT_PREFIX_SCENE = ("The attached picture is the master picture of one {unit}: a three-quarter side view on a plain grey background. "
                     "Draw the SAME {unit}, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint "
                     "colour and every same detail (stowage, armour, sensors, launchers, skirts), seen in action in its natural "
                     "setting as described below. Do not redesign, simplify or add to it. Do not copy the grey background: the new "
                     "picture is a full outdoor scene.")
UNIT_PREFIX_TOP = ("The attached picture is the master picture of one {unit}: a three-quarter side view on a plain grey background. "
                   "Draw the SAME {unit}, exactly: the same shape, the same turret, gun, tracks and road wheels, the same paint "
                   "colour and every same detail (stowage, armour, sensors, launchers, skirts), but now seen exactly straight down "
                   "from above, as described below. Do not redesign, simplify or add to it. Do not copy the attached picture's "
                   "camera angle: draw a true top-down plan view.")
TANK_FRAME_SIDE = ("A single main battle tank, seen from a front three-quarter side view from slightly above (about 30 degrees down), "
                   "its front and gun turned toward the lower right of the picture so that the viewer sees its front and one long "
                   "side, the turret facing the same way as the hull. The whole tank is centred left to right and top to bottom, and "
                   "its full length from the tip of the gun barrel to the rear of the hull spans about 85 percent of the picture's "
                   "width; the entire tank, gun barrel and tracks included, is inside the frame with a margin all round. Only the "
                   "tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it.")
TANK_FRAME = ("A single main battle tank, seen exactly straight down from above (a true top-down plan view), its gun and front "
              "pointing to the top of the picture, the turret facing straight ahead. The whole tank is centred left to right and "
              "top to bottom, and its full length from the tip of the gun barrel to the rear of the hull fills about 90 percent "
              "of the picture's height. Only the tank: no crew, no other vehicle, no ground, no track marks, only a faint, tight "
              "soft shadow right under it.")
TANK_SCENE = {   # group: the natural setting of its card scene
    'nato': "a wide dry grassland valley with low rolling hills, a few sparse trees and scrub bushes, and a broad road of pale tan packed dirt",
    'east': "a wide open steppe of pale green and golden grass with a line of birch trees and the edge of a dark pine forest in the distance, on a rutted brown dirt road",
    'china': "green farmland hills with terraced fields and a few tall poplars under a slightly hazy sky, on a rough yellow-brown dirt track",
    'europe': "gentle temperate farmland with hedgerows, fields and a few tall poplar trees, a distant wooded ridge, on a gravel-and-earth farm track",
    'export': "a dry savanna with scattered flat-topped acacia trees, red-brown earth and tufts of dry grass, on a red-brown dirt road"}
def tank_scene(g):
    return ("A single main battle tank driving at moderate speed along a dirt road, kicking up a modest trail of dust behind its tracks. "
            f"The setting: {TANK_SCENE[g]}. Seen from a low front three-quarter angle slightly above ground level, the tank fills "
            "about half the picture's width, in the middle of the frame, the horizon in the upper third, a believable sky with a few "
            "soft clouds, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only "
            "this one tank: no crew visible, no other vehicle, no people, no buildings, no signs. The tank is described in words as: ")
TANK_TAIL = (" Original generic design made for this game: it must not be a line-for-line copy of any real tank; only the family "
             "look described here. Plain unmarked paint, no text, numbers, flags, stars or markings of any kind.")
STYLE_V2_SCENE = ("Style: the same clean, polished 3D strategy-game render as the attached picture, with crisp edges, simplified shapes "
                  "and clear silhouettes, bright but natural colours and slightly realistic materials with subtle wear, dust and "
                  "weathering; not toy-like, not a photograph. Natural daylight and soft shadows. Landscape 3:2 image: the scene "
                  "fills the whole picture edge to edge, with no grey studio background, no border, no frame, no vignette, no colour "
                  "tint, no filter and no overlay of any kind. Original generic design. No text, no letters, no numbers, no flags, "
                  "no emblems, no logos, no watermark.")
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
UNIT_KINDS = ('side', 'scene', 'top')
UNIT_LOOKS = {}   # name: {unit, kind, group, look, subject, refs (names in assets/art-src), prefix, style, aspect, fresh (a side view made without a look-1 reference)}
for _g in UNIT_GROUPS:
    for _n in (1, 2, 3):
        _desc = UNIT_TANK[_g][0] + ' ' + UNIT_TANK[_g][1][_n - 1] + TANK_TAIL
        _side = f'ul-tank-{_g}-{_n}-side'
        UNIT_LOOKS[_side] = {
            'unit': 'main battle tank', 'kind': 'side', 'group': _g, 'look': _n, 'fresh': _n == 1, 'aspect': '1:1',
            'prefix': UNIT_PREFIX_SIDE_NEW if _n == 1 else UNIT_PREFIX_SIDE_FAMILY.format(unit='main battle tank'),
            'subject': TANK_FRAME_SIDE + ' ' + _desc, 'style': STYLE_V2_SIDE,
            'refs': UNIT_ANCHORS if _n == 1 else UNIT_ANCHORS + [f'ul-tank-{_g}-1-side']}
        UNIT_LOOKS[f'ul-tank-{_g}-{_n}-scene'] = {
            'unit': 'main battle tank', 'kind': 'scene', 'group': _g, 'look': _n, 'fresh': False, 'aspect': '3:2',
            'prefix': UNIT_PREFIX_SCENE.format(unit='main battle tank'),
            'subject': tank_scene(_g) + _desc, 'style': STYLE_V2_SCENE, 'refs': [_side]}
        UNIT_LOOKS[f'ul-tank-{_g}-{_n}-top'] = {
            'unit': 'main battle tank', 'kind': 'top', 'group': _g, 'look': _n, 'fresh': False, 'aspect': '1:1',
            'prefix': UNIT_PREFIX_TOP.format(unit='main battle tank'),
            'subject': TANK_FRAME + ' ' + _desc, 'style': STYLE_V2_UNIT, 'refs': [_side]}

# ---- THE OTHER UNITS (owner's decisions 2026-11-18, third set: "make the rest, with the Gemini check on every picture"). One entry per unit in UD
# (see unit_def below); the pictures are built from the same pieces as the tank's: a side view (the master), a card scene and a top-down made from it.
# What the tank sets taught, now in every prompt: the top-down keeps exactly the same layout of hatches, turrets, sensors, stowage and weapons as the
# side view, on the same side, not mirrored, nothing added or dropped; light from the upper left in every kind; the top-down has no shadow on the grey
# (the map draws its own); the card scenes stay photo-real (the owner liked them).
UL_CLS = {
    'gnd': dict(
        detail="the same hull, turret or weapon mount, gun or launcher, wheels or tracks, the same paint colour and every same detail (stowage, armour, skirts, sensors, antennas, hatches)",
        side=("A single {u}, seen from a front three-quarter side view from slightly above (about 30 degrees down), its front turned toward the lower right of the "
              "picture so that the viewer sees its front and one long side. The whole vehicle is centred left to right and top to bottom, and its full length "
              "(any gun barrel or boom included) spans about 85 percent of the picture's width; the entire vehicle, wheels or tracks included, is inside the frame "
              "with a margin all round. Only the {u}: no crew, no other vehicle, no ground, no track marks, only a faint, tight soft shadow right under it."),
        top=("A single {u}, seen exactly straight down from above (a true top-down plan view), its front pointing to the top of the picture. The whole vehicle is "
             "centred left to right and top to bottom, and its full length (any gun barrel or boom included) fills about 90 percent of the picture's height. Only "
             "the {u}: no crew, no other vehicle, no ground, no track marks, no shadow on the background."),
        crop="Cropped and centred so the unit's full length (nose to tail, including any gun barrel) fills about 90 percent of the picture's height, nothing cut off. ",
        scene_frame=("Seen from a low front three-quarter angle slightly above ground level, the vehicle fills about half the picture's width, in the middle of the "
                     "frame, the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene "
                     "fills the whole picture edge to edge. Only this one vehicle: no crew visible, no other vehicle, no people, no buildings, no signs."),
        scene_look="the one vehicle is whole and in action, clearly visible and not cut off, about half the picture's width, in a landscape-shaped picture",
        match_parts="hull, turret or weapon mount, gun or launcher, wheels or tracks (their number), skirts, sensors, antennas, stowage and other details"),
    'air': dict(
        detail="the same fuselage, wings, tails, engines, canopy, weapons, sensors and every same detail, the same paint colour",
        side=("A single {u}, seen from a front three-quarter side view from slightly above (about 30 degrees down), shown in level flight attitude as a studio model "
              "(landing gear up, no stand), its nose turned toward the lower right of the picture so that the viewer sees its nose and one long side. The whole "
              "aircraft is centred left to right and top to bottom, and its full length or its full wingspan, whichever is larger, spans about 85 percent of the "
              "picture's width; the entire aircraft, wingtips and tail included, is inside the frame with a margin all round. Only the {u}: no pilot visible, no other "
              "aircraft, no ground, no clouds, no contrail, only a faint, tight soft shadow below it."),
        top=("A single {u}, seen exactly straight down from above (a true top-down plan view), its nose pointing to the top of the picture, wings spread out to both "
             "sides. The whole aircraft is centred left to right and top to bottom, and the larger of its length (nose to tail) and its wingspan (wingtip to wingtip) "
             "fills about 90 percent of the picture. Only the {u}: no pilot visible, no other aircraft, no ground, no clouds, no shadow on the background."),
        crop="Cropped and centred so the unit's full length or full wingspan, whichever is larger, fills about 90 percent of the picture, nothing cut off. ",
        scene_frame=("Seen from a low three-quarter angle slightly below and beside it, banking gently, the aircraft fills about 60 percent of the picture's width, in the "
                     "middle of the frame, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only this one aircraft: "
                     "no pilot visible, no other aircraft, no people, no buildings, no signs, no markings."),
        scene_look="the one aircraft is whole and in flight, clearly visible and not cut off, about 60 percent of the picture's width, in a landscape-shaped picture",
        match_parts="fuselage, wings (their shape and sweep), tails, engines and intakes, canopy, weapons, sensors, antennas and other details"),
    'heli': dict(
        detail="the same fuselage, rotor(s), tail, wings or stub wings, landing gear, canopy, weapons, sensors and every same detail, the same paint colour",
        side=("A single {u}, seen from a front three-quarter side view from slightly above (about 30 degrees down), shown as a studio model standing on its landing gear, "
              "the rotor blades still and drawn sharp (not blurred), its nose turned toward the lower right of the picture so that the viewer sees its nose and one long "
              "side. The whole helicopter is centred left to right and top to bottom, and its full length including the rotor disc spans about 85 percent of the picture's "
              "width; everything, rotor tips and tail included, is inside the frame with a margin all round. Only the {u}: no pilot visible, no other aircraft, no ground, "
              "only a faint, tight soft shadow under it."),
        top=("A single {u}, seen exactly straight down from above (a true top-down plan view), its nose pointing to the top of the picture, the rotor blades still and drawn "
             "sharp (not blurred). The whole helicopter is centred left to right and top to bottom, and the larger of its length (nose to tail, rotor included) and its "
             "rotor span fills about 90 percent of the picture. Only the {u}: no pilot visible, no other aircraft, no ground, no shadow on the background."),
        crop="Cropped and centred so the unit's full length or full rotor span, whichever is larger, fills about 90 percent of the picture, nothing cut off. ",
        scene_frame=("Seen from a low front three-quarter angle, slightly above the ground, the helicopter fills about 55 percent of the picture's width, in the middle of the "
                     "frame, its rotor turning with a natural light motion blur on the blades only, natural daylight with the sun from the upper left. The scene fills the whole "
                     "picture edge to edge. Only this one helicopter: no pilot visible, no other aircraft, no people, no buildings, no signs, no markings."),
        scene_look="the one helicopter is whole and in flight, clearly visible and not cut off, about 55 percent of the picture's width, in a landscape-shaped picture",
        match_parts="fuselage, rotor(s), tail, wings or stub wings, landing gear, canopy, weapons, sensors and other details"),
    'ship': dict(
        detail="the same hull, superstructure, masts, radars, guns, missile launchers, helicopter deck or flight deck and every same detail, the same paint colour",
        side=("A single {u}, seen from a front three-quarter side view from slightly above (about 30 degrees down), its bow turned toward the lower right of the picture so "
              "that the viewer sees its bow and one long side, drawn as a studio model sitting on the plain grey background with its whole hull down to the waterline "
              "visible: no water, no waves, no wake. The whole ship is centred left to right and top to bottom, and its full length spans about 85 percent of the picture's "
              "width; everything, masts and bow included, is inside the frame with a margin all round. Only the {u}: no crew visible, no other ship, no aircraft, no ground, "
              "only a faint, tight soft shadow under the hull."),
        top=("A single {u}, seen exactly straight down from above (a true top-down plan view), its bow pointing to the top of the picture, the whole hull down to the waterline "
             "visible: no water, no waves, no wake. The whole ship is centred left to right and top to bottom, and its full length fills about 90 percent of the picture's "
             "height. Only the {u}: no crew visible, no other ship, no aircraft, no shadow on the background."),
        crop="Cropped and centred so the unit's full length (bow to stern) fills about 90 percent of the picture's height, nothing cut off. ",
        scene_frame=("Seen from a low front three-quarter angle just above the water, the ship fills about 70 percent of the picture's width, in the middle of the frame, the "
                     "horizon in the upper third, a believable sky, natural daylight with the sun from the upper left. The scene fills the whole picture edge to edge. Only "
                     "this one ship: no crew visible, no other ship, no aircraft, no land close by, no signs, no markings."),
        scene_look="the one ship is whole and under way at sea, clearly visible and not cut off, about 70 percent of the picture's width, in a landscape-shaped picture",
        match_parts="hull, superstructure, masts, radars, guns, launchers, flight deck or helicopter deck and other details"),
    'sub': dict(
        detail="the same hull, sail (conning tower), tail fins, propulsion, deck details and every same detail, the same paint colour",
        side=("A single {u}, seen from a front three-quarter side view from slightly above (about 30 degrees down), its bow turned toward the lower right of the picture so "
              "that the viewer sees its bow and one long side, drawn as a studio model sitting on the plain grey background with its whole hull visible: no water, no waves, "
              "no wake. The whole submarine is centred left to right and top to bottom, and its full length spans about 85 percent of the picture's width; everything is "
              "inside the frame with a margin all round. Only the {u}: no crew visible, no other ship, no ground, only a faint, tight soft shadow under it."),
        top=("A single {u}, seen exactly straight down from above (a true top-down plan view), its bow pointing to the top of the picture, the whole hull visible: no water, no "
             "waves, no wake. The whole submarine is centred left to right and top to bottom, and its full length fills about 90 percent of the picture's height. Only the "
             "{u}: no crew visible, no other ship, no shadow on the background."),
        crop="Cropped and centred so the unit's full length (bow to stern) fills about 90 percent of the picture's height, nothing cut off. ",
        scene_frame=("Seen from a low front three-quarter angle just above the water, the submarine runs on the surface and fills about 70 percent of the picture's width, in "
                     "the middle of the frame, the horizon in the upper third, a believable sky, natural daylight with the sun from the upper left. The scene fills the whole "
                     "picture edge to edge. Only this one submarine: no crew visible, no other ship, no aircraft, no land close by, no signs, no markings."),
        scene_look="the one submarine is whole and running on the surface at sea, clearly visible and not cut off, about 70 percent of the picture's width, in a landscape-shaped picture",
        match_parts="hull, sail (conning tower), tail fins, deck details and other details"),
    'man': dict(
        detail="the same soldier: the same helmet, uniform, camouflage, body armour, pack, rifle or weapon, equipment and every same detail",
        side=("A single {u}, seen from a front three-quarter side view from slightly above (about 30 degrees down), standing in a ready pose with the weapon held ready, "
              "turned toward the lower right of the picture so that the viewer sees the front and one side. The whole soldier, from the boots to the top of the helmet and "
              "the weapon, is centred left to right and top to bottom and fills about 85 percent of the picture's height; the entire figure is inside the frame with a "
              "margin all round. Only this one {u}: no other person, no vehicle, no ground, only a faint, tight soft shadow under the boots."),
        top=("A single {u}, seen exactly straight down from above (a true top-down plan view), facing the top of the picture, the weapon held ready in front. The whole "
             "soldier (head, shoulders, arms, pack and weapon) is centred left to right and top to bottom and fills about 85 percent of the picture's height. Only this one "
             "{u}: no other person, no vehicle, no ground, no shadow on the background."),
        crop="Cropped and centred so the unit fills about 85 percent of the picture's height, nothing cut off. ",
        scene_frame=("Seen from a low front three-quarter angle at about eye height, the soldier fills about half the picture's height and stands in the middle of the frame, "
                     "the horizon in the upper third, a believable sky with a few soft clouds, natural daylight with the sun from the upper left. The scene fills the whole "
                     "picture edge to edge. Only this one soldier: no other person, no vehicle, no buildings, no signs, no markings."),
        scene_look="the one soldier is whole and in action, clearly visible and not cut off, about half the picture's height, in a landscape-shaped picture",
        match_parts="helmet, uniform and camouflage pattern, body armour, pack, rifle or weapon, equipment and other details"),
}
UL_PAINT = {
    'gnd': {'nato': "matte sand-tan", 'east': "dark olive-green", 'china': "plain mid-green", 'europe': "dark grey-green",
            'export': "faded ochre-sand with a few patches of darker touch-up paint"},
    'air': {'nato': "pale ghost-grey", 'east': "pale grey with a darker grey-green upper surface", 'china': "pale blue-grey", 'europe': "medium blue-grey",
            'export': "sand and olive-green camouflage"},
    'heli': {'nato': "matte olive-drab grey", 'east': "dark green with darker green blotches", 'china': "plain dark grey-green", 'europe': "dark green-grey",
             'export': "faded olive-green and tan"},
    'ship': {'nato': "haze grey", 'east': "mid grey with a darker grey deck", 'china': "light blue-grey", 'europe': "medium blue-grey",
             'export': "pale grey with a few rust-streaked patches"},
    'sub': {'nato': "matte black", 'east': "dark grey-black", 'china': "dark blue-black", 'europe': "dark slate grey", 'export': "dull dark grey-green"},
    'man': {'nato': "a tan-and-brown multi-terrain camouflage", 'east': "olive-green and brown blotch camouflage", 'china': "green-and-brown digital camouflage",
            'europe': "a grey-green and brown splinter camouflage", 'export': "a faded khaki and olive desert camouflage"}}
UL_LAND = TANK_SCENE   # the settings of the ground units' card scenes (they include a dirt road)
UL_SEA = {
    'nato': "open blue ocean under a clear sky with a few high clouds, a long gentle swell",
    'east': "a cold grey-green northern sea under a low, overcast sky, a long swell and a distant misty horizon",
    'china': "a hazy blue-green coastal sea with a faint distant coastline of low hills on the horizon under a pale, slightly hazy sky",
    'europe': "a deep blue-green Atlantic sea with white-capped waves and tall cumulus clouds in a bright sky",
    'export': "a calm turquoise tropical sea with a low distant island on the horizon and a few small white clouds in a hot clear sky"}
UL_SKY = {
    'nato': "a deep clear blue sky above a sunlit sea of white cloud far below",
    'east': "a pale blue sky with high thin cirrus streaks above a far-below patchwork of golden steppe and dark pine forest",
    'china': "a hazy pale-blue sky with soft white clouds above distant green mountains far below",
    'europe': "a bright sky with scattered cumulus clouds above distant green fields and a river far below",
    'export': "a hot clear blue sky with a few small clouds above distant dry brown hills and a red-brown plain far below"}
UL_LOW = {
    'nato': "low over a dry grassland valley with rolling hills and scattered scrub bushes",
    'east': "low over an open golden steppe with a line of birch trees and a dark pine forest on the horizon",
    'china': "low over a hazy blue-green sea close to a rocky green coastline",
    'europe': "low over gentle farmland with hedgerows, fields and a wooded ridge in the distance",
    'export': "low over a dry savanna with scattered flat-topped acacia trees and red-brown earth"}
UL_SETTING = {'gnd': UL_LAND, 'air': UL_SKY, 'heli': UL_LOW, 'ship': UL_SEA, 'sub': UL_SEA, 'man': UL_LAND}
UL_UNIT_TAIL = (" Original generic design made for this game: it must not be a line-for-line copy of any real {kind}; only the family look described here. Plain "
                "unmarked paint, no text, numbers, flags, stars, roundels or markings of any kind.")
UL_PREFIX_SCENE = ("The attached picture is the master picture of one {unit}: a three-quarter side view on a plain grey background. Draw the SAME {unit}, exactly: {detail}, "
                   "seen in action in its natural setting as described below. Do not redesign, simplify or add to it. Do not copy the grey background: the new picture "
                   "is a full outdoor scene.")
UL_PREFIX_TOP = ("The attached picture is the master picture of one {unit}: a three-quarter side view on a plain grey background. Draw the SAME {unit}, exactly: {detail}, "
                 "but now seen exactly straight down from above, as described below. Keep exactly the same layout of hatches, turrets, sensors, antennas, stowage, "
                 "weapons and every other part as the attached side view, on the same side of the unit: the long side that faces the viewer in the side view (the unit's "
                 "right side, the one nearest the camera) is the right side of the top-down picture. Do not mirror it, do not rearrange it, do not add or drop any part. "
                 "Light from the upper left. Do not redesign or simplify it. Do not copy the attached picture's camera angle: draw a true top-down plan view.")
STYLE_UL_TOP = STYLE_V2_UNIT.replace("with a soft shadow under each object", "with no cast shadow on the background").replace("with only a soft shadow;", "with no shadow at all;")
STYLE_UL_SCENE = STYLE_V2_SCENE   # photo-real scenes: kept (owner)
assert "no cast shadow" in STYLE_UL_TOP and "no shadow at all" in STYLE_UL_TOP
UD = {}   # key -> dict(label, cls, kind (the word for "real {kind}"), groups {g: (family, [g1, g2, g3])}, action, paint, setting, note, gens)

def unit_def(key, label, cls, kind, action, groups, paint=None, setting=None, frame_note='', gens=None):
    """label: the unit's name in the prompts; action: what it does in its card scene (a phrase after "A single {label}"); groups: {group: (family look, [3 generations])};
    paint/setting: per-group overrides; frame_note: an extra sentence for the side and top frames; gens: the 'Generation n of 3' lead-ins [oldest, newer, newest]"""
    UD[key] = dict(label=label, cls=cls, kind=kind, action=action, groups=groups, paint=paint or UL_PAINT[cls], setting=setting or UL_SETTING[cls], note=frame_note,
                   gens=gens or ["Generation 1 of 3, the oldest, ", "Generation 2 of 3, a clearly newer design: ", "Generation 3 of 3, the newest, a near-future design: "])
    d, C = UD[key], UL_CLS[cls]; u = label
    for g in UNIT_GROUPS:
        fam, gl = groups[g]
        for n in (1, 2, 3):
            desc = f"{fam} Paint: {d['paint'][g]}. {d['gens'][n - 1]}{gl[n - 1]}" + UL_UNIT_TAIL.format(kind=kind)
            nm = f'ul-{key}-{g}-{n}'
            UNIT_LOOKS[nm + '-side'] = {
                'unit': u, 'unit_key': key, 'cls': cls, 'kind': 'side', 'group': g, 'look': n, 'fresh': n == 1, 'aspect': '1:1',
                'prefix': UNIT_PREFIX_SIDE_NEW if n == 1 else UNIT_PREFIX_SIDE_FAMILY.format(unit=u),
                'subject': C['side'].format(u=u) + (' ' + frame_note if frame_note else '') + ' ' + desc, 'style': STYLE_V2_SIDE,
                'refs': UNIT_ANCHORS if n == 1 else UNIT_ANCHORS + [f'ul-{key}-{g}-1-side']}
            UNIT_LOOKS[nm + '-scene'] = {
                'unit': u, 'unit_key': key, 'cls': cls, 'kind': 'scene', 'group': g, 'look': n, 'fresh': False, 'aspect': '3:2',
                'prefix': UL_PREFIX_SCENE.format(unit=u, detail=C['detail']),
                'subject': f"A single {u} {action}. The setting: {d['setting'][g]}. {C['scene_frame']} The {u} is described in words as: {desc}",
                'style': STYLE_UL_SCENE, 'refs': [nm + '-side']}
            UNIT_LOOKS[nm + '-top'] = {
                'unit': u, 'unit_key': key, 'cls': cls, 'kind': 'top', 'group': g, 'look': n, 'fresh': False, 'aspect': '1:1',
                'prefix': UL_PREFIX_TOP.format(unit=u, detail=C['detail']),
                'subject': C['top'].format(u=u) + (' ' + frame_note if frame_note else '') + ' ' + desc,
                'style': STYLE_UL_TOP.replace(_CROP_NEW, C['crop']), 'refs': [nm + '-side']}


# ---- Infantry Fighting Vehicle (key ifv)
unit_def('ifv', 'infantry fighting vehicle', 'gnd', 'armoured vehicle',
    "driving at moderate speed along a dirt road, kicking up a modest trail of dust behind its tracks", {
    'nato': ("Family look (US/NATO): a tall, boxy, slab-sided tracked hull of flat armour plates, a flat angular two-man turret in the middle of the hull carrying an autocannon and an armoured missile-launcher box on its side, a wide rear troop ramp, heavy bolt-on armour.",
             ["a Cold War era design: a simple boxy hull with a small flat-sided turret, a short autocannon, a twin missile tube pod on the turret side, six road wheels per side with bare track guards, small round firing ports along the hull side, a few stowage boxes on the rear deck.",
              "a larger, heavier hull with spaced armour plates and full side skirts, a bigger angular turret with a long stabilised autocannon and an armoured missile box, a roof-mounted thermal sight box, a commander's hatch with a remote machine gun, seven road wheels per side.",
              "a low, wide, angular hull with an unmanned turret carrying a large-calibre autocannon, smooth faceted add-on armour, four flat active-protection sensor panels at the corners, a slim sensor mast, a remote weapon station on the roof, full-length side skirts."]),
    'east': ("Family look (Eastern): a low, compact, sloped tracked hull with a small rounded turret set well forward, smoke-grenade launcher tubes along the turret sides, reactive-armour bricks (rows of small square blocks) that cover more of the vehicle in every generation, a log and fuel drums on the rear deck.",
             ["a low, boxy hull with a tiny one-man turret carrying a short smoothbore gun and a missile rail above it, six small road wheels per side, thin track guards, a few small roof hatches, a first small set of reactive bricks on the hull front only.",
              "a larger, taller rounded turret carrying a short gun, a coaxial autocannon and a missile rail, rows of reactive bricks across the turret front and the hull front, thick side skirts, a remote machine gun on the roof, seven road wheels per side.",
              "a very low, wide hull with an unmanned rounded turret in the centre, slat armour and reactive bricks over most of the hull, active-protection launcher tubes around the turret, a panoramic sight dome, armoured fuel tanks at the rear."]),
    'china': ("Family look (China, its own lines): a clean, smooth, boxy tracked hull with a long, sharply sloped front plate and small, evenly spaced road wheels, a modest rounded-arrowhead turret with a thin autocannon and a missile launcher on top, a pair of laser-warning sensors on the turret front.",
              ["a modest, low rounded turret with a short gun and a single missile rail, a simple hull with plain track guards and six small road wheels per side, a snorkel tube and a spare fuel drum on the rear deck, no add-on armour.",
               "a bigger, angular turret with an autocannon and a twin missile launcher box on its side, a wedge of applied armour on the turret front, side skirts made of rows of small plates, a roof machine gun, seven small road wheels per side.",
               "a clean, low turret of smooth facets with flat integrated sensor panels, an unmanned remote weapon station, active-protection domes at the turret corners, a hull front of smooth sloped composite armour, full side skirts, a longer autocannon."]),
    'europe': ("Family look (Europe): a long, sleek, low and smoothly sloped tracked hull, a turret of sloping, rounded-faceted shapes with a slender autocannon, a small raised pod for the commander's panoramic sight, a clean low silhouette.",
               ["a light, fast, compact design: a narrow hull with five road wheels per side, a small egg-shaped rounded turret with a thin autocannon, a plain commander's cupola, almost no add-on armour, bare track guards, a rear ramp.",
                "a bigger, smoothly sloped turret with a stabilised autocannon and a missile launcher box on one side, side skirts, a raised panoramic sight pod, a hull with a sharply sloped front, six road wheels per side.",
                "a tall, wide, unmanned turret of smooth faceted panels with a large autocannon and a small second weapon beside it, a slim sensor mast, modular armour blocks, active-protection sensors, full side skirts, a low sleek hull."]),
    'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a small round or flat-topped turret on a boxy tracked hull, bolt-on kits and add-on parts that look like they were fitted by the buyer.",
               ["a post-war pattern: a small round one-man turret with a short gun, a low boxy hull with six road wheels per side, an unditching beam across the rear deck, an open-top searchlight, a machine gun on the roof.",
                "a widely exported 1970s-80s pattern: a larger two-man turret with an autocannon, a missile rail and a rangefinder box, bolt-on side skirts, a smoke-launcher pack, a few add-on armour plates on the turret front, a snorkel tube.",
                "a modern export-grade design: a modular angular turret with an autocannon, bolt-on composite armour packages, a remote machine-gun station, a thermal sight box, an auxiliary power pack at the rear, side skirts, a clean but practical look made to be sold to many armies."])})

# ---- Mobile Artillery (key art)
unit_def('art', 'self-propelled howitzer', 'gnd', 'self-propelled gun',
    "standing in a firing position beside a dirt road, its gun raised at a high angle, a puff of smoke and dust at the muzzle brake",
    {'nato': ("Family look (US/NATO): a tall, heavy, boxy, slab-sided armoured turret of flat plates on a wide tracked hull, a long barrel with a large muzzle brake, a hinged rear spade.",
              ["a Cold War era design: a simple boxy turret with a medium-length barrel, a large perforated muzzle brake and a fume extractor, a machine-gun ring on the turret roof, seven road wheels per side with bare track guards, stowage boxes on the rear.",
               "a clearly newer, heavier design: a larger, wider angular turret with a long barrel, a rear bustle that holds ammunition, side skirts, a remote machine gun on the roof, a rear ammunition-loading door, a folded rear spade.",
               "a near-future design: a low, angular, unmanned turret with a very long barrel with a thermal sleeve, an automatic loader bustle, flat faceted armour panels, flat sensor panels, an auxiliary power unit at the rear, full-length side skirts."]),
     'east': ("Family look (Eastern): a low, wide, rounded turret on a low tracked hull, a long barrel with a muzzle brake and a bulge-shaped fume extractor, a log and fuel drums on the rear deck, reactive-armour bricks that cover more in every generation.",
              ["a small, low, round turret with a medium barrel and a muzzle brake, a low hull with six small road wheels per side, bare track guards, a rear spade, stacks of shell boxes and a log on the rear deck.",
               "a larger, low rounded turret with a long barrel, a muzzle brake and a fume extractor, a thick turret front with rows of reactive bricks, side skirts, a remote machine gun on the roof, a rear spade, extra fuel drums.",
               "a fully automated, very low, unmanned rounded turret with a long barrel and a thick armoured mantlet, reactive bricks along the hull front, slat armour, a sensor dome on the roof, a hinged rear spade."]),
     'china': ("Family look (China, its own lines): a broad, flat arrowhead-shaped turret on a smooth boxy tracked hull with a sharply sloped front plate and seven small road wheels, a long barrel with a double-baffle muzzle brake, a pair of laser-warning sensors.",
               ["a modest arrowhead turret with a medium barrel and a muzzle brake, a plain hull with bare track guards, a rear spade, a spare fuel drum on the rear deck, no add-on armour.",
                "a bigger angular turret with a long barrel, a boxy rear bustle, side skirts made of rows of small plates, a roof machine gun, a folded rear spade.",
                "a low, smooth-faceted automated turret with a very long barrel, flat integrated sensor panels, a remote weapon station, an automatic loader bustle, full side skirts."]),
     'europe': ("Family look (Europe): a sleek, smoothly sloped turret on a long, low tracked hull, a long slender barrel with a muzzle brake, a clean low silhouette, a hinged rear spade.",
                ["a light, compact design: a small rounded turret, a medium slender barrel with a muzzle brake, a narrow hull with six road wheels per side, bare track guards, a small stowage rack at the rear.",
                 "a large, smoothly sloped turret with a very long slender barrel, a long rounded rear bustle, side skirts, a raised thermal sight pod, seven road wheels per side.",
                 "an unmanned turret of smooth faceted panels with a very long barrel, a slim sensor mast, a small remote machine gun, modular armour blocks, a low sleek hull with full skirts."]),
     'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a round or boxy turret on a boxy tracked hull, bolt-on kits and add-on parts that look fitted by the buyer.",
                ["a post-war pattern: a small round turret with a short barrel and a big muzzle brake, a low boxy hull with four large road wheels per side, an unditching beam across the rear deck, an open-top searchlight, a machine gun on the roof.",
                 "a widely exported 1970s-80s pattern: a larger boxy turret with a long barrel and a muzzle brake, bolt-on side skirts, a smoke-launcher pack, a rear spade, a few add-on armour plates on the turret front.",
                 "a modern export-grade design: a modular angular turret with a long barrel, a remote machine-gun station, a thermal sight box, bolt-on armour packages, an auxiliary power pack at the rear, side skirts, a practical look made to be sold to many armies."])})

# ---- Mobile SAM (key sam)
unit_def('sam', 'mobile surface-to-air missile launcher vehicle', 'gnd', 'missile vehicle',
    "parked beside a dirt road with its launcher raised, the missile canisters pointing up at the sky and its radar antenna turning",
    {'nato': ("Family look (US/NATO): a wide, heavy tracked carrier of flat armour plates, flat-sided angular box canisters on a pivoting launcher platform, a flat angular radar housing, matte finish.",
              ["a Cold War era design: a boxy tracked carrier with a pivoting rack of three box canisters, a small boxy radar antenna on a short mast beside the cab, bare track guards, a few stowage boxes.",
               "a clearly newer, heavier design: a tracked carrier with a rack of four armoured canisters on a pivoting platform and a flat phased-array radar panel at the back of the platform, a roof sensor box, side skirts.",
               "a near-future design: an angular, faceted launcher housing with eight canisters in two flat rows, radar panels built into its sides, a slim sensor mast, a low hull with full skirts."]),
     'east': ("Family look (Eastern): a big eight-wheeled heavy truck chassis with a boxy cab, tall cylindrical missile canisters on a tilting rack, a round dish or flat panel radar on a raised mast, outrigger jacks at the corners.",
              ["a Cold War era design: four tall missile tubes on a tilting rail launcher on the truck bed, a round dish radar on a short mast behind the cab, outrigger jacks, a plain boxy cab.",
               "a clearly newer design: four large cylindrical canisters in a tilted rack, a flat phased-array radar panel on a folding mast behind the cab, a larger cab with a sloped front, outrigger jacks, a small antenna on the roof.",
               "a near-future design: two rows of four canisters in a long sloped launch rack, an angular faceted cab, flat radar panels on a mast and on the cab sides, slim antennas, a clean low-signature look."]),
     'china': ("Family look (China, its own lines): a six-wheeled heavy truck chassis with a sharply angular, boxy cab, a broad flat launcher box with sloped panels, a flat rectangular phased-array radar, outrigger jacks.",
               ["a modest design: a launcher box with four rectangular missile canisters on a tilting rail, a small round radar dish on a short mast, outrigger jacks, a plain boxy cab.",
                "a clearly newer design: a larger launcher with six large canisters in two rows, a flat phased-array radar panel on a raised mast behind the cab, a sloped angular cab, outrigger jacks.",
                "a near-future design: a smooth faceted launcher box with eight canisters under flat covers, flat radar panels built into its sides, slim antennas, a smooth low cab, full side panels."]),
     'europe': ("Family look (Europe): a sleek, wheeled eight-by-eight chassis with a low, smoothly sloped cab, a compact launcher with round-topped canisters, a slim raised radar on a mast, a clean low silhouette.",
                ["a light, compact design: a small wheeled carrier with two box canisters on a swivelling mount, a small round radar dish on top of the cab, a plain cab, short outrigger jacks.",
                 "a clearly newer design: a larger wheeled carrier with a vertical launcher of four tall canisters, a rotating flat radar panel on a mast, a sloped cab, outrigger jacks.",
                 "a near-future design: a long carrier with a vertical launcher block of eight canisters, a smooth faceted radar mast with flat panels, a low sleek cab, a small sensor pod on the roof."]),
     'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, an older box-frame launcher on a plain truck or trailer chassis, bolt-on kits that look fitted by the buyer.",
                ["a post-war pattern: a rail launcher with two big missiles on a plain truck bed, a small dish radar on a short mast, a plain boxy cab, outrigger jacks, spare wheels on the side.",
                 "a widely exported 1970s-80s pattern: a rack of four boxy canisters on a tilting launcher, a round dish radar on a mast, bolt-on side boxes, a smoke-launcher pack on the cab, a plain truck cab.",
                 "a modern export-grade design: a modular launcher with six canisters, a flat panel radar on a short mast, a new sloped cab with bolt-on armour, an auxiliary power pack at the rear, a practical look made to be sold to many armies."])})

# ---- Rocket Artillery (key mlrs)
unit_def('mlrs', 'multiple rocket launcher vehicle', 'gnd', 'rocket launcher vehicle',
    "standing in a firing position beside a dirt road, rockets leaving its launcher in a bright plume of smoke and fire, dust blown from the ground",
    {'nato': ("Family look (US/NATO): a tracked carrier of flat armour plates with a large boxy armoured cab at the front and a rear launcher box holding a block of rockets in square pods, matte finish.",
              ["a Cold War era design: a tracked carrier with a small flat cab, a rear launcher box with six rocket tubes in two rows of three, bare track guards, six road wheels per side, stowage boxes on the sides.",
               "a clearly newer, heavier design: a bigger angular cab with a flat armoured windscreen shield, a launcher box with two enclosed square rocket pods, a roof sight box, side skirts, seven road wheels per side.",
               "a near-future design: a low, angular, stealthy cab with flat panels, an automated launcher with two enclosed pods of more rockets under flat faceted covers, flat sensor panels, full skirts."]),
     'east': ("Family look (Eastern): a big heavy wheeled truck chassis with a boxy cab with armoured shutters, a rear launcher frame with a block of long open tubes, outrigger jacks at the rear, a spare wheel under the frame.",
              ["a Cold War era design: a six-wheeled truck with a launcher frame of forty short tubes in four rows, a plain cab, rear outrigger jacks, a spare wheel, a stowage box on the side.",
               "a clearly newer design: an eight-wheeled truck with a launcher frame of twelve large tubes in three rows, an armoured cab with shutters, rear outrigger jacks, a roof machine gun.",
               "a near-future design: an eight-wheeled truck with an automated launcher of sixteen tubes in an enclosed, faceted frame, an angular low-signature cab, a small sensor on the roof, outrigger jacks."]),
     'china': ("Family look (China, its own lines): a wheeled heavy truck chassis with a sharply angular, boxy cab, a broad rear launcher with a large rectangular block of tubes in a sloped box, outrigger jacks, smooth panels.",
               ["a modest design: a six-wheeled truck with a launcher block of twenty small tubes in two rows, a plain boxy cab, outrigger jacks at the rear.",
                "a clearly newer design: an eight-wheeled truck with two large enclosed square pods of tubes, a sloped angular cab with armoured shutters, a laser-warning pair on the roof, outrigger jacks.",
                "a near-future design: an eight-wheeled truck with a smooth faceted launcher with two enclosed pods, a low angular cab with flat panels, a sensor dome on the roof, full side panels."]),
     'europe': ("Family look (Europe): a sleek tracked carrier with a low, smoothly sloped armoured cab, a rear launcher pod block of rounded-square pods, a clean low silhouette.",
                ["a light, compact design: a narrow tracked carrier with a small cab and a rear launcher box of twelve tubes in two rows, bare track guards, six road wheels per side.",
                 "a clearly newer design: a larger carrier with a smoothly sloped cab and two enclosed rounded-square pods on a rear launcher, side skirts, a roof sight pod.",
                 "a near-future design: a long, low carrier with a faceted cab and an automated launcher with two enclosed pods, a slim sensor mast, modular armour blocks, full skirts."]),
     'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a plain truck chassis with a bolt-on launcher frame, additional boxes and kits that look fitted by the buyer.",
                ["a post-war pattern: a six-wheeled truck with a launcher frame of sixteen short tubes in four rows, a plain open-top cab with a canvas roof, rear outrigger jacks, a spare wheel.",
                 "a widely exported 1970s-80s pattern: a six-wheeled truck with a launcher frame of forty tubes in four rows, an armoured cab with shutters, bolt-on side boxes, rear outrigger jacks.",
                 "a modern export-grade design: an eight-wheeled truck with a modular launcher of two enclosed pods, a new sloped cab with bolt-on armour, an auxiliary power pack, a practical look made to be sold to many armies."])})

# ---- Motorized Infantry (key inf; the Paratroopers share it)
unit_def('inf', 'motorized infantry rifleman', 'man', 'soldier',
    "walking along a dirt road with his rifle held ready, a light trail of dust at his boots",
    {'nato': ("Family look (US/NATO): a stocky, heavily equipped rifleman in a rounded combat helmet and a tactical plate-carrier vest covered in pouches, knee pads, a big pack, a rifle with a short barrel and a sling.",
              ["Cold War era kit: a rounded steel-style helmet with a cloth cover, a simple webbing harness with ammunition pouches and two canteens, a plain long rifle with a straight stock, a canvas backpack, plain boots.",
               "new modular kit: a visored helmet with a night-vision mount, a plate-carrier vest with modular pouches, a compact rifle with a sight and a short barrel, knee and elbow pads, a modern pack.",
               "light powered exoskeleton frames strapped to the legs and back, a sealed helmet with a built-in display visor, a smooth faceted armour vest, a compact rifle with an integrated sight, a small power pack on the back."]),
     'east': ("Family look (Eastern): a lean rifleman in a rounded helmet with a cloth cover, a chest rig of flat ammunition pouches, a long coat-like smock, a rifle with a curved magazine, a rolled blanket across the shoulder.",
              ["Cold War era kit: a rounded steel helmet with a cloth cover, a leather-look belt harness with ammunition pouches, a long rifle with a curved magazine and a folding stock, a small canvas pack, tall boots.",
               "new modular kit: a helmet with a clear visor and a rail mount, a chest rig with modular pouches, body armour plates, a compact rifle with a sight and a suppressor, knee pads, a modern pack.",
               "light powered exoskeleton frames on the legs and back, a sealed helmet with a built-in display visor, a smooth faceted armour vest, a compact rifle with an integrated sight, a small power pack on the back."]),
     'china': ("Family look (China, its own lines): a slim, upright rifleman in a clean tidy uniform, a rounded helmet with a net cover, a neat chest rig with squared pouches, a rifle with a short barrel, a compact backpack.",
               ["Cold War era kit: a plain rounded helmet, a simple canvas belt with squared pouches, a long rifle with a curved magazine, a small green canvas bag, soft canvas boots.",
                "new modular kit: a helmet with a visor and a camera mount, a neat chest rig with squared pouches, light body armour, a compact rifle with a sight, knee pads, a compact pack.",
                "light powered exoskeleton frames on the legs and back, a sealed helmet with a built-in display visor, a smooth faceted armour vest, a compact rifle with an integrated sight, a small power pack on the back."]),
     'europe': ("Family look (Europe): a practical, slim rifleman with a rounded modern helmet, a plate-carrier vest with tidy pouches, a compact rifle held close, ear protection, a medium pack.",
                ["Cold War era kit: a rounded steel-style helmet, a simple webbing harness with ammunition pouches, a plain rifle with a plastic-look stock and a bipod, a canvas pack, boots with gaiters.",
                 "new modular kit: a helmet with a visor and ear defenders, a plate-carrier vest with tidy modular pouches, a compact rifle with a sight, knee and elbow pads, a medium pack.",
                 "light powered exoskeleton frames on the legs and back, a sealed helmet with a built-in display visor, a smooth faceted armour vest, a compact rifle with an integrated sight, a small power pack on the back."]),
     'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, practical rifleman with mixed, worn kit, a rounded helmet, a simple vest, an older rifle, a scarf at the neck, a faded canvas pack.",
                ["post-war kit: a rounded steel helmet with a cloth cover, a canvas belt with pouches, a plain long rifle with a wooden-look stock, a faded canvas pack, worn boots.",
                 "widely exported 1980s kit: a helmet with a net cover, a chest rig of flat pouches, a rifle with a curved magazine and a folding stock, a water bottle and a bigger pack, a scarf.",
                 "modern export kit: a helmet with a rail and a visor, a plate-carrier vest with bolt-on pouches, a compact rifle with a sight, knee pads, a practical, mixed look made to be sold to many armies."])},
    gens=["Generation 1 of 3, the oldest, ", "Generation 2 of 3, a clearly newer kit: ", "Generation 3 of 3, the newest, a near-future kit: "])

# ---- Frigate (key frig)
unit_def('frig', 'frigate (a small warship)', 'ship', 'warship',
    "steaming at moderate speed, a white bow wave at its stem and a long white wake behind it",
    {'nato': ("Family look (US/NATO): a clean, flat-sided hull with a sharply raked bow, a boxy angular superstructure with flat plates, a single main gun forward, a helicopter deck at the stern.",
              ["a Cold War era design: a long, low hull with a tall boxy superstructure, a single gun turret on the bow, a tall lattice mast with a rotating radar dish, a box missile launcher on the deck behind the gun, one tall funnel, a small helicopter pad at the stern.",
               "a clearly newer design: a more angular hull with a flush deck, a smooth boxy superstructure with flat panel radars, a vertical launch block forward, a medium gun on the bow, a hangar with a helicopter deck at the stern, a funnel faired into the superstructure.",
               "a near-future design: a stealthy angular hull, a smooth faceted superstructure with an integrated mast, a vertical launch block, a small gun in a faceted turret, a large helicopter hangar, no funnel, small unmanned boats on the stern."]),
     'east': ("Family look (Eastern): a robust hull with a high flared bow, a tall, heavily armed superstructure with many launchers and guns packed on deck, a tall mast, a big helicopter deck at the stern.",
              ["a Cold War era design: a long hull with a high bow, a tall block superstructure with two funnels, two twin gun turrets, a rocket launcher on the foredeck, a mast with a round radar, a helicopter pad at the stern.",
               "a clearly newer design: a smooth angular hull with a long forecastle, an armoured box superstructure with a mast, vertical launch cells at the bow, a single gun on the bow, a hangar with a deck at the stern, fewer exposed fittings.",
               "a near-future design: a stealthy angular hull, a tall integrated mast tower with flat radar panels, vertical launch cells, a small faceted gun turret, a large hangar, no funnel."]),
     'china': ("Family look (China, its own lines): a long, low hull with a sharply raked clipper bow, a sleek, angular superstructure with neat rounded edges and flat radar panels, a large hangar and a flat helicopter deck.",
               ["a modest design: a long hull with a tall boxy superstructure, a twin gun turret forward and another aft, a tall mast with a round radar, two small funnels, a helicopter pad.",
                "a clearly newer design: a smooth hull with a clean angular superstructure, flat phased-array radar panels, a vertical launch block forward, a single gun, a large hangar with a deck at the stern, a funnel faired in.",
                "a near-future design: a stealth hull with a smooth faceted superstructure, a tall integrated mast with flat panels, vertical launch cells, a faceted gun turret, a large hangar, no funnel."]),
     'europe': ("Family look (Europe): a sleek, graceful hull with a clean rounded superstructure of sloping sides, a single tall integrated mast, a rounded gun turret, a large helicopter hangar at the stern.",
                ["a Cold War era design: a long, narrow hull with a tall superstructure, a single rounded gun turret on the bow, a tall mast with a radar dish, one funnel, a small helicopter pad at the stern.",
                 "a clearly newer design: a smooth hull with a sloped superstructure with flat radar panels, a vertical launch block, a rounded gun on the bow, a hangar with a deck at the stern, a funnel faired in.",
                 "a near-future design: a stealth hull with a smooth superstructure with an integrated mast, a vertical launch block, a small faceted gun, a large hangar and mission bay at the stern, no funnel."]),
     'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a simpler superstructure with bolt-on launchers and guns that look fitted by the buyer.",
                ["a post-war pattern: a long, low hull with a plain superstructure, two gun turrets, a small mast with a radar dish, one funnel, a depth-charge rack at the stern.",
                 "a widely exported 1970s-80s pattern: a hull with a taller superstructure, a medium gun on the bow, a box missile launcher, a radar mast, a small helicopter pad, bolt-on boxes.",
                 "a modern export-grade design: a clean modular hull with a plain angular superstructure, a vertical launch block, a medium gun, a hangar with a helicopter deck, a practical look made to be sold to many navies."])},
    gens=["Generation 1 of 3, the oldest, ", "Generation 2 of 3, a clearly newer design with a new hull and a clean, angular superstructure: ", "Generation 3 of 3, the newest, a stealth hull with an integrated mast: "])

# ---- Cruiser (key crui)
unit_def('crui', 'cruiser (a large warship)', 'ship', 'warship',
    "steaming at moderate speed, a white bow wave at its stem and a long white wake behind it",
    {'nato': ("Family look (US/NATO): a big, long, flat-sided hull with a high bow, a massive boxy angular superstructure of flat plates, two main guns, many missile cells, a helicopter deck at the stern.",
              ["a Cold War era design: a long hull with a tall boxy superstructure, a gun turret on the bow and another aft, a double-arm missile launcher forward, two tall funnels, a tall lattice mast with a big rotating radar, a helicopter pad.",
               "a clearly newer, larger design: a long angular hull, a broad superstructure with flat radar panels on all four sides, vertical launch blocks forward and aft, a gun on the bow, two small funnels, a helicopter deck and hangars.",
               "a near-future design: a big angular wave-piercing hull, a large smooth faceted deckhouse with integrated flat radar panels and mast, two large gun turrets in faceted housings, vertical launch cells along both sides, no funnels."]),
     'east': ("Family look (Eastern): a large, heavily armed hull with a high flared bow, a tall superstructure crowded with launchers, guns and radars, a tall mast and a big helicopter deck.",
              ["a Cold War era design: a long hull with a high bow, a tall block superstructure with two funnels, two twin gun turrets, missile launcher tubes along the deck sides, a tall mast with several radars, a helicopter pad.",
               "a clearly newer, larger design: a huge hull with a long forecastle, a tall superstructure with a mast, big missile launch tubes in rows along the deck, a gun on the bow, two small funnels, a helicopter hangar.",
               "a near-future design: a stealthy angular hull, a tall integrated mast tower with flat radar panels, vertical launch cells packed along the deck, a faceted gun turret, a large hangar, no funnels."]),
     'china': ("Family look (China, its own lines): a long, sleek, large hull with a raked clipper bow, a smooth angular superstructure with neat edges and flat radar panels, a large hangar and helicopter deck.",
               ["a modest design: a long hull with a tall boxy superstructure, twin gun turrets forward and aft, missile launcher boxes on the deck, a tall mast with a round radar, two funnels, a helicopter pad.",
                "a clearly newer, larger design: a smooth hull with a large angular superstructure with flat radar panels, vertical launch blocks forward and aft, a single gun on the bow, a hangar and a helicopter deck, a funnel faired in.",
                "a near-future design: a big stealth hull with a large smooth faceted superstructure, flat radar faces built into it, vertical launch cells forward and aft, a faceted gun turret, a large hangar, no funnels."]),
     'europe': ("Family look (Europe): a sleek, graceful, large hull with clean sloped sides, a rounded superstructure, a single tall integrated mast with a big radar, a rounded gun turret, a large hangar.",
                ["a Cold War era design: a long hull with a tall superstructure, a twin missile launcher forward, a rounded gun turret, two funnels, a lattice mast with a big radar dish, a helicopter pad.",
                 "a clearly newer, larger design: a smooth hull with a sloped superstructure and flat panel radars, vertical launch blocks forward, a rounded gun on the bow, a funnel faired in, a hangar and helicopter deck.",
                 "a near-future design: a stealth hull with a smooth sloped superstructure and a large integrated mast with flat radar panels, vertical launch cells, a small faceted gun, a large hangar, no funnel."]),
     'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a large hull with a simpler superstructure and bolt-on launchers and guns that look fitted by the buyer.",
                ["a post-war pattern: a long hull with a plain tall superstructure, two twin gun turrets, torpedo tubes amidships, two funnels, a small mast with a radar dish.",
                 "a widely exported 1970s-80s pattern: a hull with a taller superstructure, a twin gun on the bow, box missile launchers, a radar mast, a helicopter pad, bolt-on boxes.",
                 "a modern export-grade design: a large modular hull with a plain angular superstructure, vertical launch blocks, a medium gun, a hangar with a helicopter deck, a practical look made to be sold to many navies."])},
    gens=["Generation 1 of 3, the oldest, ", "Generation 2 of 3, a clearly newer, larger design with an angular hull: ", "Generation 3 of 3, the newest, a stealth hull with flat radar faces built into the superstructure: "])

# ---- Attack Submarine (key sub)
unit_def('sub', 'attack submarine', 'sub', 'submarine',
    "running on the surface at moderate speed, a white bow wave at its bow and a churned white wake behind it, the sail rising from the middle of the hull",
    {'nato': ("Family look (US/NATO): a big, smooth, black teardrop hull with a rounded bow, a tall rectangular sail with flat plane fins on its sides, a cruciform tail with a single large propeller.",
              ["a Cold War era design: a rounded cigar-shaped hull, a medium sail with diving planes on its sides, a cruciform tail, a flat deck casing with small hatches.",
               "a clearly newer design: a larger hull with an X-shaped tail, a taller sail with a flat top, a bow dome, a smooth rubber-coated look, a flush deck.",
               "a near-future design: a longer, smoother hull with a streamlined faired sail, an X-shaped tail, a shrouded pump-jet at the stern, a flush deck with a small mast fairing."]),
     'east': ("Family look (Eastern): a thick, blunt, very rounded hull with a large rounded sail and a long deck casing, a tall fin on the back of the sail, a cruciform tail, a heavy built look.",
              ["a Cold War era design: a stubby rounded hull with a tall blocky sail with the diving planes on the sail, a long raised deck casing along the back, a cruciform tail.",
               "a clearly newer design: a longer, thicker hull with an X-shaped tail, a bigger rounded sail with a tall fin, a rounded bow, a smooth coated look, a flush deck.",
               "a near-future design: a long, smooth hull with a streamlined sail, an X-shaped tail, a shrouded pump-jet, a few small hatches in the deck, a flush look."]),
     'china': ("Family look (China, its own lines): a long, slender, smooth hull with a pointed rounded bow, a low rounded sail, a clean uncluttered deck, a cruciform tail.",
               ["a modest design: a slim cigar-shaped hull with a small low sail, diving planes on the bow, a cruciform tail, a flat deck casing with a few hatches.",
                "a clearly newer design: a longer hull with an X-shaped tail, a streamlined sail with rounded top, a smooth coated look, a small bow dome.",
                "a near-future design: a longer, smoother hull with a faired sail, an X-shaped tail, a shrouded pump-jet, a flush deck with no visible hatches."]),
     'europe': ("Family look (Europe): a sleek, rounded hull with a small streamlined sail, an X-shaped or cruciform tail, a clean flush deck, a polished modern look.",
                ["a Cold War era design: a short, rounded hull with a small sail with planes, a cruciform tail, a simple flat deck casing.",
                 "a clearly newer design: a longer hull with an X-shaped tail, a streamlined sail, a flush deck, a smooth coated look, a bow dome.",
                 "a near-future design: a long, smooth hull with a small faired sail, an X-shaped tail, a shrouded pump-jet, a flush deck with a small mast fairing."]),
     'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, an older teardrop hull, a simple sail, visible deck hatches and bolt-on fittings.",
                ["a post-war pattern: a slim cigar hull with a tall plain sail, diving planes on the sail, a raised deck casing, a cruciform tail, small hatches and a deck gun mount without a gun.",
                 "a widely exported 1980s pattern: a rounder hull with a medium sail, a cruciform tail, flush deck hatches, a bow dome, a plain finish.",
                 "a modern export-grade design: a modular hull with an X-shaped tail, a faired sail, a flush deck, a practical look made to be sold to many navies."])},
    gens=["Generation 1 of 3, the oldest, ", "Generation 2 of 3, a clearly newer design with a new hull and an X-shaped tail: ", "Generation 3 of 3, the newest, a longer, smoother hull with a pump-jet: "])

# ---- Aircraft Carrier (key carr)
unit_def('carr', 'aircraft carrier', 'ship', 'warship',
    "steaming at moderate speed, a big white bow wave and a long white wake behind it, a few small parked aircraft on the flight deck",
    {'nato': ("Family look (US/NATO): a huge, flat-topped hull with a long angled flight deck, a small tower-like island on the right side of the deck, big elevators at the edges, a clean flat deck with parked aircraft in neat rows.",
              ["a Cold War era design: a large flat-top hull with an angled flight deck, a tall blocky island with a big radar antenna and a funnel on the right side, deck-edge elevators, parked aircraft in rows.",
               "a clearly newer, larger design: a bigger hull with a long angled flight deck, a new smaller island set farther back, a clean deck with deck-edge elevators, catapults at the bow, parked aircraft in rows.",
               "a near-future design: a smooth hull with a small integrated island set far back on the deck, a long clean angled flight deck, flat electromagnetic catapult tracks, small unmanned drones parked on the deck."]),
     'east': ("Family look (Eastern): a heavy, thick hull with a ski-jump ramp at the bow, a tall island on the right side crowded with radars, large launcher tubes under the angled deck edge, parked aircraft near the island.",
              ["a Cold War era design: a hull with a ski-jump ramp at the bow, a short angled deck, a tall boxy island with a huge radar array and two funnels, missile launcher tubes on the forward deck, parked aircraft.",
               "a clearly newer, larger design: a longer hull with a ski-jump bow, a long angled deck, a new compact island with flat panel radars, deck-edge elevators, rows of parked aircraft.",
               "a near-future design: a smooth hull with a small streamlined island, a long clean angled flight deck, catapult tracks, small unmanned drones parked on the deck, no funnel."]),
     'china': ("Family look (China, its own lines): a long, clean hull with a rising ski-jump ramp at the bow, a modest island on the right side with flat radar panels, an angled deck, neat rows of parked aircraft.",
               ["a modest design: a hull with a ski-jump ramp, a short angled deck, a boxy island with a round radar and a funnel, parked aircraft in a row.",
                "a clearly newer design: a larger hull with a long angled flight deck, a new compact island with flat phased-array radar panels, deck-edge elevators, catapult tracks, parked aircraft in rows.",
                "a near-future design: a smooth hull with a small integrated island, a long clean angled flight deck with flat catapult tracks, small unmanned drones parked on the deck."]),
     'europe': ("Family look (Europe): a sleek, rounded, graceful flat-top hull, a compact island with a single tall mast on the right side, an angled deck, a clean deck with a few parked aircraft.",
                ["a Cold War era design: a smaller flat-top hull with an angled deck, a tall boxy island with a radar dish and a funnel, one elevator, a few parked aircraft.",
                 "a clearly newer design: a bigger hull with a long angled flight deck, a compact island with flat radar panels, two elevators, catapults at the bow, parked aircraft in rows.",
                 "a near-future design: a smooth hull with a two-part island with an integrated mast, a long clean angled flight deck, a ski-jump-free flat bow, small unmanned drones parked on the deck."]),
     'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a smaller flat-top hull with a simple island and a modest deck with a few parked aircraft.",
                ["a post-war pattern: a small, simple flat-top hull with a straight flight deck, a plain boxy island on the right side, one elevator, a few parked aircraft.",
                 "a widely exported 1970s-80s pattern: a mid-sized hull with a short angled deck, a ski-jump bow, a taller island with a radar mast and a funnel, a few parked aircraft.",
                 "a modern export-grade design: a modular hull with an angled deck, a compact island with flat radar panels, two elevators, a few parked aircraft, a practical look made to be sold to many navies."])},
    frame_note="The ship is a full-size aircraft carrier: the flight deck, its angled landing runway markings left blank (no painted lines or numbers) and the island are all visible.",
    gens=["Generation 1 of 3, the oldest, ", "Generation 2 of 3, a clearly newer design with a new island and an angled deck: ", "Generation 3 of 3, the newest, a small integrated island and drones on deck: "])

# ---- Strike Fighter (key jet)
unit_def('jet', 'strike fighter (a combat jet for ground attack)', 'air', 'combat aircraft',
    "flying fast in a gentle bank with a faint vapour trail at its wingtips, bombs and missiles carried on its wing pylons where the design carries them",
    {'nato': ("Family look (US/NATO): a sleek, compact fighter with a blended wing and body, intakes under or beside the body, a bubble canopy, tall or canted tail fins, weapons on wing pylons.",
              ["a Cold War era design: a compact single-engine jet with a bubble canopy, a chin intake under the nose, one tall tail fin, swept wings with six underwing pylons carrying bombs and a fuel tank, a plain round exhaust.",
               "a new airframe with an internal weapons bay: a larger twin-engine jet with two engines side by side and square intakes on the sides, twin canted tail fins, a wide wing with long leading-edge extensions, closed weapon-bay doors on the belly, a sensor pod on the nose.",
               "a tailless, faceted strike aircraft: a smooth sharply faceted airframe with no tail fins, no external weapons, a single engine with a faceted exhaust, small internal bays, a sensor blister under the nose."]),
     'east': ("Family look (Eastern): a big, rugged, wide-bodied jet with two widely spaced engines, a long nose, square intakes, twin tall tail fins and many weapon pylons.",
              ["a Cold War era design: a stubby, rugged attack jet with a drooped nose, a single engine, one tall tail fin, swept wings with six pylons carrying rocket pods and bombs, a plain cockpit bubble.",
               "a new airframe with an internal weapons bay: a large twin-engine strike jet with a wide, flat-fronted cockpit, a long tail stinger, twin tall tail fins, large square intakes, closed weapon-bay doors under the fuselage, wing pylons with missiles.",
               "a tailless, faceted strike aircraft: a wide, smoothly faceted airframe with no tail fins, two widely spaced engines with faceted exhausts, internal bays, a smooth nose."]),
     'china': ("Family look (China, its own lines): a clean, sharply swept design with a long pointed nose, big rectangular side intakes, canted twin tail fins, neat flush weapon pylons.",
               ["a modest design: a simple single-engine attack jet with a pointed nose, a nose intake with a centre cone, swept wings, one tail fin, four underwing pylons.",
                "a new airframe with an internal weapons bay: a larger twin-engine jet with big rectangular intakes on the sides, canted twin tails, a clean wide body, closed weapon-bay doors on the belly, a sensor pod, wing pylons.",
                "a tailless, faceted strike aircraft: a smooth sharply faceted airframe with a diamond-shaped intake, no tail fins, internal bays, a single engine with a serrated exhaust, a sensor blister under the nose."]),
     'europe': ("Family look (Europe): a sleek delta-wing or swept design with small canard foreplanes, a compact graceful body, a single or twin engines, an elegant clean finish.",
                ["a Cold War era design: a compact single-engine strike jet with a pointed nose, small stubby straight wings, one tail fin, a long thin body, two wingtip fuel tanks and a few pylons.",
                 "a new airframe with an internal weapons bay: a twin-engine delta-wing jet with small canard foreplanes, a long clean body, closed weapon-bay doors on the belly, a single tail fin, a few wing pylons.",
                 "a tailless, faceted strike aircraft: a smooth, faceted airframe with no tail fins, two small internal bays, a single engine, a clean sensor blister under the nose."]),
     'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, older jet shapes with bolt-on kits and add-on parts that look fitted by the buyer.",
                ["a post-war pattern: a plain single-engine jet with swept wings that can fold, a nose intake, one tall tail fin, four pylons with bombs and a drop tank, a plain bubble cockpit.",
                 "a new airframe with a larger wing: a twin-engine jet with a sloped cockpit, twin tail fins, canard foreplanes, six wing pylons with missiles, a refuelling probe, a clean practical look.",
                 "a modern export-grade design: a single-engine faceted jet with side intakes, a small internal bay, a modular nose with a radar, tail fins, a practical look made to be sold to many air forces."])},
    gens=["Generation 1 of 3, the oldest, ", "Generation 2 of 3, a clearly newer design: ", "Generation 3 of 3, the newest, "])

# ---- Interceptor (key int)
unit_def('int', 'interceptor (a fast high-altitude fighter)', 'air', 'combat aircraft',
    "climbing fast in a steep bank, a faint vapour trail at its wingtips, long-range air-to-air missiles under its wings where the design carries them",
    {'nato': ("Family look (US/NATO): a big, powerful, long-bodied fighter with two large engines, big square or wedge intakes on the sides of the body, a bubble canopy, twin tall tail fins and long-range missiles carried under the body.",
              ["a Cold War era design: a heavy twin-engine jet with a long nose with a big radar, a bubble canopy, two side intakes with sharp edges, swept wings with downturned tips, one or two tail fins, four missiles under the fuselage.",
               "a new, larger twin-engine airframe: a long body with a swing-out wing, a large radar nose, twin tall tail fins, wedge intakes, long-range missiles under the belly, a clean finish.",
               "a tailless, faceted near-future fighter: a smooth faceted wide body with no tail fins, internal bays, two engines with faceted exhausts, a diamond-shaped intake."]),
     'east': ("Family look (Eastern): a big, rugged, high-flying jet with two widely spaced engines, huge square intakes, twin tall tail fins, a long nose and heavy long-range missiles under the body.",
              ["a Cold War era design: a stout twin-engine jet with a swept wing, large square side intakes, a single tall tail fin, a long nose, a bubble canopy, two long missiles under the body.",
               "a new, larger twin-engine airframe: a big wide jet with two widely spaced engines, huge rectangular intakes, twin canted tail fins, a long radome nose, four large missiles on the belly, a long tail boom.",
               "a tailless, faceted near-future fighter: a smooth faceted wide body, no tail fins, two widely spaced engines with faceted exhausts, internal bays, a smooth nose."]),
     'china': ("Family look (China, its own lines): a slim, clean, high-flying jet with a long pointed nose, a delta or swept wing, rectangular side intakes, canted twin tails and neat flush pylons.",
               ["a Cold War era design: a slim single-engine jet with a small delta wing, a nose intake with a centre cone, a single tall tail fin, two small missiles under the wings, a bubble canopy.",
                "a new, larger airframe: a big delta wing with small canard foreplanes, a long clean body, a single engine with a big ventral intake, a single tail fin, six pylons with long missiles.",
                "a tailless, faceted near-future fighter: a smooth faceted body with a diamond-shaped intake, no tail fins, internal bays, a single engine with a faceted exhaust."]),
     'europe': ("Family look (Europe): a sleek, narrow, high-flying jet with a delta wing, small canard foreplanes, a compact graceful body and a clean finish.",
                ["a Cold War era design: a very slim jet with tiny, thin straight wings, a long needle-like body, a single tail fin, two small missiles on the wingtips, a plain round exhaust.",
                 "a new, larger airframe: a compact delta-wing jet with canard foreplanes, a single engine, a sleek body, a bubble canopy, a single tall tail fin, four long missiles under the body.",
                 "a tailless, faceted near-future fighter: a smooth faceted delta-shaped body with no tail fins, internal bays, a single engine with a faceted exhaust."]),
     'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, older jet shapes with bolt-on kits that look fitted by the buyer.",
                ["a post-war pattern: a small delta-wing jet with a nose intake with a centre cone, a single tall tail fin, two small missiles under the wings, a plain bubble canopy.",
                 "a widely exported 1980s pattern: a twin-engine jet with swept wings, two tail fins, intakes under the wings, a rear-facing sensor on the tail, four missiles under the body.",
                 "a modern export-grade design: a single-engine faceted jet with side intakes, a small internal bay, a modular radar nose, a practical look made to be sold to many air forces."])},
    gens=["Generation 1 of 3, the oldest, ", "Generation 2 of 3, a clearly newer design: ", "Generation 3 of 3, the newest, "])

# ---- Air Superiority Fighter (key asf)
unit_def('asf', 'air superiority fighter (a stealthy twin-engine fighter)', 'air', 'combat aircraft',
    "flying fast in a banking turn, a faint vapour trail at its wingtips, weapons carried inside its body so that its lines are clean",
    {'nato': ("Family look (US/NATO): a large, agile, twin-engine fighter with big wedge intakes beside the cockpit, twin tall tail fins, a wide flat body, a bubble canopy.",
              ["a Cold War era design: a big twin-engine jet with a high wing, large squared intakes with a moving ramp, twin tall tail fins, a bubble canopy, four long missiles under the body and a cannon at the wing root.",
               "a new airframe with canted tails: a sharp, stealthy twin-engine fighter with canted twin tail fins, faceted edges, flat engine exhausts, closed internal weapon bays, a wide flat body.",
               "a tailless, wide-body near-future fighter: a smooth, wide faceted body with no tail fins, internal bays, two engines with faceted exhausts, a smooth diamond-shaped nose."]),
     'east': ("Family look (Eastern): a big, powerful twin-engine fighter with two widely spaced engines, a long tail boom between them, twin tall tail fins, a long nose and large wing extensions.",
              ["a Cold War era design: a large twin-engine jet with two widely spaced engines, twin tall tail fins, a long nose with a pointed radome, a bubble canopy, six long missiles under the wings and body.",
               "a new airframe with canted tails: a big, agile twin-engine jet with canted twin tail fins, a large thrust-vectoring-looking nozzle pair, a long tail boom, a wide body, closed weapon bays and a few wing missiles.",
               "a tailless, wide-body near-future fighter: a wide, smooth, faceted body with no tail fins, two widely spaced engines with faceted exhausts, internal bays, a smooth nose."]),
     'china': ("Family look (China, its own lines): a long, sharp, clean twin-engine fighter with a long pointed nose, big rectangular side intakes, canted twin tail fins and a delta wing with canard foreplanes.",
               ["a Cold War era design: a large twin-engine jet with a swept wing, rectangular side intakes, twin tall tail fins, a bubble canopy, four missiles under the wings.",
                "a new airframe with canted tails: a sleek stealthy twin-engine fighter with canard foreplanes, a long faceted body, canted twin tail fins, flat exhausts, closed internal weapon bays.",
                "a tailless, wide-body near-future fighter: a wide faceted body with no tail fins, a smooth diamond-shaped nose, two engines with faceted exhausts, internal bays."]),
     'europe': ("Family look (Europe): a sleek, agile twin-engine fighter with a delta wing, small canard foreplanes, a chin intake under the nose, a single tall tail fin, a clean polished finish.",
                ["a Cold War era design: a large twin-engine jet with swept wings, two plain tail fins, big side intakes, a bubble canopy, four missiles under the body.",
                 "a new airframe: a twin-engine delta-wing fighter with canard foreplanes, a chin intake, a single tall tail fin, a clean sleek body, weapons under the wings and body.",
                 "a tailless, wide-body near-future fighter: a smooth faceted delta-shaped body with no tail fins, internal bays, two engines with faceted exhausts, a smooth nose."]),
     'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, older jet shapes with bolt-on kits that look fitted by the buyer.",
                ["a post-war pattern: a swing-wing jet with a nose intake, a single tall tail fin, two small missiles under the wings, a plain bubble canopy.",
                 "a widely exported 1980s pattern: a large twin-engine jet with two widely spaced engines, twin tail fins, a long nose, six missiles under the wings and body, a plain finish.",
                 "a modern export-grade design: a twin-engine jet with canard foreplanes, canted tail fins, a modular radar nose, bolt-on pylons, a practical look made to be sold to many air forces."])},
    gens=["Generation 1 of 3, the oldest, ", "Generation 2 of 3, a clearly newer design: ", "Generation 3 of 3, the newest, "])

# ---- Attack Helicopter (key heli)
unit_def('heli', 'attack helicopter', 'heli', 'helicopter',
    "flying fast and low, nose slightly down, its rotor turning, rocket pods and missiles on its stub wings where the design carries them, a faint dust haze under it",
    {'nato': ("Family look (US/NATO): a slim, narrow-bodied attack helicopter with two seats in tandem, a tall nose sensor turret, short stub wings carrying rocket pods and missiles, a four-bladed main rotor and a tail rotor.",
              ["a Cold War era design: a slim, narrow, low helicopter with two seats in tandem under separate bubble canopies, a two-bladed main rotor, a chin turret gun, short stub wings with rocket pods and missile tubes, a tall tail with a small tail rotor.",
               "a new, angular airframe with weapons carried inside: a sleek angular body with faceted panels, a four-bladed main rotor, a nose sensor turret, small stub wings, closed internal weapon bays on the belly, a tall tail fin.",
               "a compound helicopter with a pusher propeller and a faceted stealthy body: a smooth faceted body, a twin rotor mast with coaxial blades, a pusher propeller at the tail, small stub wings, closed internal bays."]),
     'east': ("Family look (Eastern): a big, rugged, armoured helicopter with a heavy body, stub wings with many weapon pylons, a five-bladed main rotor, a thick armoured cockpit with flat glass panels.",
              ["a Cold War era design: a big, heavy helicopter with a hump-backed body, two bulged cockpit canopies side by side in tandem, a five-bladed main rotor, big stub wings with rocket pods and missile rails, a chin gun, wheels retracted.",
               "a new, angular airframe with weapons carried inside: a coaxial twin-rotor body (two rotors one above the other) with a short wide fuselage, side-by-side seats, wing pylons with a few missiles, a nose sensor turret.",
               "a compound helicopter with a pusher propeller and a faceted stealthy body: a smooth faceted body, a coaxial main rotor, a pusher propeller at the tail, small stub wings, closed internal bays."]),
     'china': ("Family look (China, its own lines): a slim, clean, narrow helicopter with a sharply angular nose, a four-bladed main rotor, tandem cockpits under flat glass, short stub wings and neat missile rails.",
               ["a modest design: a small slim helicopter with a plain rounded body, a two-bladed main rotor, a chin turret, short stub wings with rocket pods and missile rails.",
                "a new, angular airframe with weapons carried inside: a narrow faceted body with flat armoured panels, a five-bladed main rotor, a nose sensor turret, stub wings with a few missiles, a tall fin.",
                "a compound helicopter with a pusher propeller and a faceted stealthy body: a smooth faceted body, a coaxial main rotor, a pusher propeller at the tail, small stub wings, closed internal bays."]),
     'europe': ("Family look (Europe): a sleek, graceful, narrow-bodied helicopter with tandem cockpits under rounded canopies, a four-bladed main rotor, a mast-mounted sight, a clean low silhouette.",
                ["a Cold War era design: a light, slim helicopter with tandem cockpits under bubble canopies, a two-bladed main rotor, a chin turret gun, short stub wings with missile tubes and rocket pods.",
                 "a new, angular airframe with weapons carried inside: a sleek faceted body with a four-bladed main rotor, a mast-mounted sight, a nose sensor turret, stub wings with missiles, a tall fin.",
                 "a compound helicopter with a pusher propeller and a faceted stealthy body: a smooth faceted body, a coaxial main rotor, a pusher propeller at the tail, small stub wings, closed internal bays."]),
     'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, older helicopter shapes with bolt-on kits that look fitted by the buyer.",
                ["a post-war pattern: a bulky helicopter with a bulged cockpit, a five-bladed main rotor, wheels, short stub wings with rocket pods and missile rails, a plain tail rotor.",
                 "a widely exported 1980s pattern: a bigger helicopter with a bubble canopy for two seats in tandem, a five-bladed rotor, a chin gun turret, larger stub wings with missile rails and pods, bolt-on armour plates.",
                 "a modern export-grade design: an angular helicopter with a modular nose with a sensor ball, a four-bladed rotor, stub wings with missiles, a practical look made to be sold to many armies."])},
    gens=["Generation 1 of 3, the oldest, ", "Generation 2 of 3, a clearly newer design: ", "Generation 3 of 3, the newest, "])

# ---- Recon UAV (key drone; its looks follow the generations: look 1 = UAV I-III, unarmed; look 2 = UAV IV, the first armed one; look 3 = UAV V)
unit_def('drone', 'reconnaissance drone (a medium unmanned aircraft)', 'air', 'drone',
    "flying slowly and steadily in a gentle turn, its camera turret under the nose looking down at the ground far below",
    {'nato': ("Family look (US/NATO): a slim unmanned aircraft with a bulbous nose, a pusher propeller at the tail, long thin straight wings and an inverted-V tail, a camera turret under the nose.",
              ["unarmed: a small, slim propeller drone with long thin straight wings, a rounded nose with a camera dome, a pusher propeller, an inverted-V tail, no weapons of any kind under the wings.",
               "armed, the first one: a larger propeller drone with long thin wings, a bulbous nose, a camera turret under the nose, a pusher propeller, an inverted-V tail and two small missiles on pylons under each wing.",
               "a jet-powered flying-wing drone with internal weapons: a smooth, faceted, tailless flying wing with a dorsal air intake, a flat exhaust, closed internal bays, no external weapons, a camera blister under the nose."]),
     'east': ("Family look (Eastern): a twin-boom unmanned aircraft with a stubby body, a pusher propeller between the booms, a high straight wing and a camera ball under the nose.",
              ["unarmed: a small twin-boom drone with a stubby rounded body, a high straight wing, a pusher propeller, a camera dome under the nose, no weapons of any kind.",
               "armed, the first one: a larger twin-boom drone with a long straight wing, a pusher propeller, a camera ball under the nose and two missiles on pylons under each wing.",
               "a jet-powered flying-wing drone with internal weapons: a smooth, faceted, tailless flying wing with a dorsal air intake, a flat exhaust, closed internal bays, no external weapons."]),
     'china': ("Family look (China, its own lines): a slim, clean unmanned aircraft with high straight wings, a V-tail or twin tails, a pusher propeller, a neat camera turret under a rounded nose.",
               ["unarmed: a small, slim propeller drone with long high straight wings, a V-tail, a rounded nose with a camera dome, no weapons of any kind.",
                "armed, the first one: a larger propeller drone with long straight wings, a V-tail, a pusher propeller, a camera turret under the nose and two missiles on pylons under each wing.",
                "a jet-powered flying-wing drone with internal weapons: a smooth, faceted, tailless flying wing with a dorsal air intake, a flat exhaust, closed internal bays, no external weapons."]),
     'europe': ("Family look (Europe): a sleek, clean unmanned aircraft with a smooth rounded body, small swept wings and tail fins, an elegant polished look, a camera pod under the body.",
                ["unarmed: a slim, torpedo-shaped, jet-powered drone with small stubby straight wings, a small tail with fins, a camera pod under the body, no weapons of any kind.",
                 "armed, the first one: a larger propeller drone with long thin wings, a bulbous nose, a camera turret under the nose, a pusher propeller, an inverted-V tail and two missiles on pylons under each wing.",
                 "a jet-powered flying-wing drone with internal weapons: a smooth, faceted, tailless diamond-shaped flying wing with a dorsal air intake, a flat exhaust, closed internal bays, no external weapons."]),
     'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a simple unmanned aircraft with bolt-on kits that look fitted by the buyer.",
                ["unarmed: a small, simple propeller drone with a plain boxy body, straight wings, twin tail booms, a camera dome under the nose, no weapons of any kind.",
                 "armed, the first one: a mid-sized twin-boom drone with a pusher propeller, straight wings, a camera ball under the nose and two small missiles on pylons under each wing.",
                 "a jet-powered flying-wing drone with internal weapons: a modular, faceted, tailless flying wing with a dorsal air intake, closed internal bays, no external weapons, a practical look."])},
    gens=["Look 1 of 3 (generations I to III), the oldest, ", "Look 2 of 3 (generation IV), a clearly newer design: ", "Look 3 of 3 (generation V), the newest, "])

# ---- Strike Drone (key sdrone)
unit_def('sdrone', 'strike drone (an armed unmanned aircraft)', 'air', 'drone',
    "flying fast in a gentle bank, the weapons it carries clearly visible under its wings or body",
    {'nato': ("Family look (US/NATO): a lean, smooth unmanned aircraft with a swept wing, a V-tail or no tail, a dorsal engine intake, clean lines, weapons on pylons or in internal bays.",
              ["a medium propeller-driven strike drone: a slim body with long straight wings, a V-tail, a pusher propeller, a camera ball under the nose, four small missiles on pylons under the wings.",
               "a larger jet-powered drone: a smooth, flattened body with small swept wings, a V-tail, a dorsal jet intake, a flat exhaust, weapon pylons under the wings and an internal bay.",
               "a tailless, stealthy combat drone: a smooth, sharply faceted flying wing with no tail, a diamond-shaped intake, closed internal weapon bays, no external weapons."]),
     'east': ("Family look (Eastern): a rugged, simple unmanned aircraft, a thin body with a delta or straight wing, cheap and mass-produced in look, weapons on pylons or in an internal bay.",
              ["a cheap delta-winged propeller drone: a long, thin body, a small swept delta wing, a pusher propeller at the tail, a small warhead nose, no tail, a rugged simple look.",
               "a larger jet-powered drone: a thicker body with swept wings, twin tail fins, a dorsal jet intake, a flat exhaust, a few weapon pylons under the wings.",
               "a tailless, stealthy combat drone: a smooth, wide, faceted flying wing with no tail, a dorsal intake, closed internal bays, a smooth nose."]),
     'china': ("Family look (China, its own lines): a clean, slim unmanned aircraft with long straight or swept wings, a V-tail or no tail, neat flush pylons, a smooth faceted look in the newest.",
               ["a medium propeller-driven strike drone: a slim body with long straight wings, a V-tail, a pusher propeller, a camera ball under the nose, four small missiles on pylons under the wings.",
                "a larger jet-powered drone: a smooth body with swept wings, a V-tail, a dorsal jet intake, a flat exhaust, weapon pylons under the wings and a small internal bay.",
                "a tailless, stealthy combat drone: a smooth, sharply faceted flying wing with no tail, a diamond-shaped intake, closed internal weapon bays, no external weapons."]),
     'europe': ("Family look (Europe): a sleek, elegant unmanned aircraft with a clean smooth body, a delta or swept wing, a refined polished look, weapons on pylons or in internal bays.",
                ["a medium propeller-driven strike drone: a slim body with long straight wings, a V-tail, a pusher propeller, a camera ball under the nose, four small missiles on pylons under the wings.",
                 "a larger jet-powered drone: a smooth tailless body with a sharp delta wing, a dorsal intake, a flat exhaust, closed internal weapon bays and two wing pylons.",
                 "a tailless, stealthy combat drone: a smooth, wide, sharply faceted flying wing with a saw-tooth trailing edge, no tail, a diamond-shaped intake, closed internal bays."]),
     'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a simple unmanned aircraft with bolt-on kits that look fitted by the buyer.",
                ["a cheap delta-winged propeller drone: a long, thin body, a small delta wing, a pusher propeller at the tail, a small warhead nose, no tail, a rugged simple look.",
                 "a mid-sized twin-boom drone with a pusher propeller, straight wings, a camera ball under the nose, four weapon pylons, bolt-on boxes, a practical look.",
                 "a modern export-grade stealthy combat drone: a modular, faceted flying wing with a dorsal intake, closed internal bays, a practical look made to be sold to many air forces."])},
    gens=["Generation 1 of 3, the oldest, ", "Generation 2 of 3, a clearly newer design: ", "Generation 3 of 3, the newest, "])

# ---- Swarm Drones (key swarm; one drone of the swarm is drawn)
unit_def('swarm', 'small swarm drone (one drone of a swarm)', 'air', 'drone',
    "flying fast and low in a gentle bank, its small size obvious against the wide landscape far below it, no other drone in view",
    {'nato': ("Family look (US/NATO): a small, clean, smooth, light drone with a rounded body, tiny wings and a quiet, sensor-packed look.",
              ["a small quadrotor-style drone: a flat central body with four short arms and four small rotors, a camera ball under the body, a neat light look.",
               "a sleek fixed-wing drone: a slim torpedo body with small swept wings, a small pusher propeller, a small camera dome under the nose.",
               "a small ducted-fan drone with a faceted body: a compact, sharply faceted body with two small ducted fans and short stubby fins, a flat sensor panel under the nose."]),
     'east': ("Family look (Eastern): a small, rugged, cheap-looking drone with a simple body, a pusher propeller or plain rotors, a small warhead nose, cross-shaped wings.",
              ["a small quadrotor-style drone: a flat boxy central body with four short arms and four small rotors, a small warhead on the underside, a rugged look.",
               "a sleek fixed-wing drone: a slim body with small X-shaped wings and X-shaped tails, a pusher propeller, a small warhead nose.",
               "a small ducted-fan drone with a faceted body: a compact angular body with two small ducted fans, short stubby fins, a small warhead nose."]),
     'china': ("Family look (China, its own lines): a small, tidy, smooth drone with a clean rounded body, neat wings, a pale finish.",
               ["a small quadrotor-style drone: a flat rounded central body with four neat arms and four small rotors, a small camera ball under the body.",
                "a sleek fixed-wing drone: a slim body with small swept delta wings, a pusher propeller, a rounded camera nose.",
                "a small ducted-fan drone with a faceted body: a compact, smooth, sharply faceted body with two ducted fans, short stubby fins, a flat sensor panel under the nose."]),
     'europe': ("Family look (Europe): a small, elegant, polished drone with a smooth body, thin wings and a compact camera pod, a refined clean look.",
                ["a small quadrotor-style drone: a smooth slim central body with four thin arms and four small rotors, a camera pod under the body.",
                 "a sleek fixed-wing drone: a slim body with long thin straight wings, a small pusher propeller, a rounded nose with a small camera.",
                 "a small ducted-fan drone with a faceted body: a compact, sharply faceted body with two ducted fans, short stubby fins, a small sensor dome under the nose."]),
     'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a small cheap drone with bolt-on parts and simple wiring.",
                ["a small quadrotor-style drone: a plain boxy central body with four short arms and four small rotors, a taped-on camera, a simple rugged look.",
                 "a sleek fixed-wing drone: a slim plain body with small straight wings, a small pusher propeller, a small warhead nose, a rugged practical look.",
                 "a small ducted-fan drone with a faceted body: a compact, modular, faceted body with two ducted fans, short stubby fins, a practical look made to be sold to many armies."])},
    gens=["Generation 1 of 3, the oldest, ", "Generation 2 of 3, a clearly newer design: ", "Generation 3 of 3, the newest, "])

# ---- Anti-Tank Infantry (key at; the picture is the missile carrier, as docs/RESEARCH.md 14.5 says)
unit_def('at', 'anti-tank missile carrier', 'gnd', 'missile vehicle',
    "stopped beside a dirt road with its missile launcher raised and aimed along the road, a faint puff of dust under it",
    {'nato': ("Family look (US/NATO): a compact armoured carrier of flat plates with a tall, flat-sided box launcher on a mast or a turret, wide tyres or short tracks, flat angular armour, matte finish.",
              ["a Cold War era design: a small, light four-wheeled utility vehicle with open sides, a tripod-mounted two-tube missile launcher on the rear bed, a roll bar, a spare wheel and a few stowage boxes.",
               "a new armoured vehicle with an enclosed box launcher holding more missiles: a six-wheeled armoured carrier with a flat angular body, a rotating box launcher with four missile tubes on top, a roof sensor, side armour plates.",
               "a low, angular, stealthy launcher vehicle with more tubes: a low faceted armoured body on six wheels, a flat box launcher with eight tubes under flat covers, flat sensor panels, a remote machine gun."]),
     'east': ("Family look (Eastern): a low, compact, rounded armoured carrier with a small launcher arm on the roof, small wheels or short tracks, reactive bricks on the front, a log and fuel drums on the rear.",
              ["a Cold War era design: a small, low amphibious-looking four-wheeled vehicle with a rail launcher for a single wire-guided missile raised over the cab, a canvas roof, a few stowage boxes.",
               "a new armoured vehicle with an enclosed box launcher holding more missiles: a six-wheeled armoured carrier with a rounded turret with a box launcher with four missile tubes, reactive bricks on the front, side skirts.",
               "a low, angular, stealthy launcher vehicle with more tubes: a low faceted armoured body on six wheels, a flat box launcher with eight tubes, slat armour and bricks on the hull, a remote machine gun."]),
     'china': ("Family look (China, its own lines): a clean, boxy armoured carrier with sloped plates, a neat rectangular box launcher, evenly spaced small wheels or short tracks.",
               ["a modest design: a small four-wheeled light vehicle with an open back, a single tubular missile launcher on a pedestal over the cab, a plain boxy body.",
                "a new armoured vehicle with an enclosed box launcher holding more missiles: a six-wheeled armoured carrier with a sloped body, a rotating rectangular box launcher with four missile tubes, a laser-warning pair on the roof.",
                "a low, angular, stealthy launcher vehicle with more tubes: a low faceted armoured body on six wheels with smooth sloped panels, a flat box launcher with eight tubes, flat sensor panels."]),
     'europe': ("Family look (Europe): a sleek, low, smoothly sloped armoured carrier with a neat rounded launcher pod, a small mast sensor, wheels or tracks of a clean modern look.",
                ["a Cold War era design: a light four-wheeled utility vehicle with an open back, a swivel-mounted missile launcher with two tubes behind the cab, a simple roll bar.",
                 "a new armoured vehicle with an enclosed box launcher holding more missiles: a six-wheeled sloped armoured carrier, a rounded box launcher with four missile tubes, a mast sensor, side skirts.",
                 "a low, angular, stealthy launcher vehicle with more tubes: a low faceted armoured body on six wheels, a flat box launcher with eight tubes, a slim sensor mast, modular armour blocks."]),
     'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a pickup-like or older armoured carrier with a bolt-on launcher that looks fitted by the buyer.",
                ["a post-war pattern: a plain open four-wheeled jeep-like vehicle with a rail launcher for two wire-guided missiles on the back, a canvas roof, spare wheel.",
                 "a new armoured vehicle with an enclosed box launcher holding more missiles: a six-wheeled armoured carrier with a bolt-on box launcher with four missile tubes, bolt-on armour plates, a roof machine gun.",
                 "a modern export-grade design: a modular six-wheeled carrier with a flat box launcher with six tubes, a thermal sight box, bolt-on armour, a practical look made to be sold to many armies."])},
    gens=["Generation 1 of 3, the oldest, ", "Generation 2 of 3, a clearly newer design: ", "Generation 3 of 3, the newest, "])

# ---- Special Forces (key spec)
unit_def('spec', 'special forces operator', 'man', 'soldier',
    "moving low and quietly along the edge of a dirt road with his weapon held ready, not looking at the viewer",
    {'nato': ("Family look (US/NATO): a lean, well-equipped operator in a ballistic helmet with night-vision mounts, a plate-carrier vest with many pouches, a suppressed carbine, a radio on the shoulder, gloves and knee pads.",
              ["Cold War era kit: a soft boonie hat, a plain lightweight vest with a few pouches, a short carbine with a long suppressor, a radio handset, camouflage face paint, light boots.",
               "dark digital camouflage with integrated radios and optics: a ballistic helmet with night-vision goggles and a headset, a dark vest with modular pouches, a suppressed carbine with a sight, a radio on the chest.",
               "sealed helmets and adaptive-camouflage suits: a sealed smooth helmet with a built-in display visor, an adaptive-camouflage suit with a patchwork finish, a slim armoured vest, a compact weapon with an integrated sight."]),
     'east': ("Family look (Eastern): a lean operator in a rounded helmet with a face wrap, a chest rig with flat pouches, a suppressed rifle with a short barrel, a small pack and knee pads.",
              ["Cold War era kit: a soft cap with a face scarf, a plain belt harness with pouches, a rifle with a folding stock and a suppressor, a small pack, soft boots.",
               "dark digital camouflage with integrated radios and optics: a helmet with a headset and goggles, a dark chest rig with modular pouches, a compact suppressed rifle with a sight, a radio on the chest.",
               "sealed helmets and adaptive-camouflage suits: a sealed smooth helmet with a built-in display visor, an adaptive-camouflage suit, a slim armoured vest, a compact weapon with an integrated sight."]),
     'china': ("Family look (China, its own lines): a slim, tidy operator in a rounded helmet with a face cover, a neat chest rig with squared pouches, a compact rifle, a slim pack.",
               ["Cold War era kit: a soft cap, a plain canvas belt with squared pouches, a short rifle with a folding stock and a suppressor, a small bag, soft boots.",
                "dark digital camouflage with integrated radios and optics: a helmet with a headset and goggles, a neat dark chest rig, a compact rifle with a sight and a suppressor, a radio on the chest.",
                "sealed helmets and adaptive-camouflage suits: a sealed smooth helmet with a built-in display visor, an adaptive-camouflage suit, a slim armoured vest, a compact weapon with an integrated sight."]),
     'europe': ("Family look (Europe): a lean, practical operator in a rounded modern helmet with ear defenders, a plate-carrier vest with tidy pouches, a compact rifle, a medium pack.",
                ["Cold War era kit: a soft beret-like cap, a plain lightweight vest with a few pouches, a compact submachine gun with a suppressor, a radio handset, soft boots.",
                 "dark digital camouflage with integrated radios and optics: a helmet with a headset, ear defenders and goggles, a dark vest with tidy modular pouches, a compact rifle with a sight and a suppressor.",
                 "sealed helmets and adaptive-camouflage suits: a sealed smooth helmet with a built-in display visor, an adaptive-camouflage suit, a slim armoured vest, a compact weapon with an integrated sight."]),
     'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, practical operator with mixed, worn kit, a scarf at the neck, a simple vest, an older rifle, a faded pack.",
                ["post-war kit: a soft hat with a scarf, a canvas belt with pouches, an older rifle with a wooden-look stock, a faded canvas pack, worn boots.",
                 "dark camouflage with radios and optics: a helmet with a headset, a chest rig with flat pouches, a rifle with a curved magazine and a sight, a radio on the chest, a scarf.",
                 "modern export kit: a helmet with a rail and a visor, a plate-carrier vest with bolt-on pouches, a compact weapon with a sight, knee pads, a practical, mixed look made to be sold to many armies."])},
    gens=["Generation 1 of 3, the oldest, ", "Generation 2 of 3, a clearly newer kit: ", "Generation 3 of 3, the newest, a near-future kit: "])

# ---- Mobile Jammer (key jam)
unit_def('jam', 'mobile jammer vehicle (an electronic-warfare vehicle)', 'gnd', 'electronic-warfare vehicle',
    "parked beside a dirt road with its antennas raised and angled up at the sky, a faint shimmer in the air above them",
    {'nato': ("Family look (US/NATO): a heavy, boxy, slab-sided armoured truck or tracked carrier with a flat-sided equipment shelter, tall slim antenna masts and flat antenna panels, matte finish.",
              ["a Cold War era design: a boxy tracked carrier with a flat equipment box, four tall whip antennas on the roof, a small dish on a short mast, stowage boxes.",
               "a new vehicle with a large dish array: a heavy six-wheeled truck with a large boxy shelter, a big rotating dish array on top, two tall folding masts, outrigger jacks.",
               "flat conformal antenna panels on an angular hull: a low angular armoured carrier with flat panels along the sides and roof, a slim retractable mast, no visible dishes, full skirts."]),
     'east': ("Family look (Eastern): a big eight-wheeled heavy truck with a tall boxy shelter, many tall antennas and a round or folding dish array, outrigger jacks, spare wheels.",
              ["a Cold War era design: a six-wheeled truck with a tall boxy shelter, three tall folding antenna masts, a small round dish, outrigger jacks.",
               "a new vehicle with a large dish array: an eight-wheeled truck with a large shelter, a large array of dishes on a raised arm, a tall mast, outrigger jacks, a roof machine gun.",
               "flat conformal antenna panels on an angular hull: a low, angular armoured eight-wheeled body with flat panels along the sides and roof, a slim mast, a clean low-signature look."]),
     'china': ("Family look (China, its own lines): a clean, boxy wheeled truck with a sloped angular shelter, neat rectangular antenna panels and a folding dish, outrigger jacks.",
               ["a modest design: a six-wheeled truck with a small boxy shelter, two tall whip antennas, a small dish on a mast, outrigger jacks.",
                "a new vehicle with a large dish array: an eight-wheeled truck with a large sloped shelter, a large array of rectangular antenna panels and dishes on a raised arm.",
                "flat conformal antenna panels on an angular hull: a low, angular wheeled body with flat panels built into its sides and roof, a slim mast, a smooth clean look."]),
     'europe': ("Family look (Europe): a sleek, low, smoothly sloped wheeled or tracked carrier with a rounded shelter, a slim telescopic mast and neat flat antennas, a clean polished look.",
                ["a Cold War era design: a light four-wheeled utility truck with a small boxy shelter, three whip antennas, a small dish on a short mast.",
                 "a new vehicle with a large dish array: a six-wheeled sloped carrier with a rounded shelter, a large dish array on a raised arm, a telescopic mast, outrigger jacks.",
                 "flat conformal antenna panels on an angular hull: a low faceted wheeled carrier with flat panels along the sides and roof, a slim telescopic mast, full skirts."]),
     'export': ("Family look (Export, a mix of widely exported older-pattern designs): a plain, rugged, practical look, a plain truck with a bolt-on equipment box and mixed antennas that look fitted by the buyer.",
                ["a post-war pattern: a plain six-wheeled truck with a canvas-covered box, two whip antennas, a small dish on a pole, spare wheels.",
                 "a widely exported 1980s pattern: a six-wheeled truck with a tall boxy shelter, a round dish on an arm, three tall folding masts, outrigger jacks.",
                 "a modern export-grade design: a modular eight-wheeled truck with a boxy shelter, flat antenna panels, a slim mast, bolt-on armour, a practical look made to be sold to many armies."])},
    gens=["Generation 1 of 3, the oldest, ", "Generation 2 of 3, a clearly newer design: ", "Generation 3 of 3, the newest, "])

# ---- END OF THE UNIT DEFINITIONS (new units are added above this line)

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
    return u['prefix'] + '\n\n' + u['subject'] + '\n\n' + u['style']

# ---- THE CHECK (--review): a Gemini text model looks at each new picture against the Art Bible and says PASS or FLAG.
# It never redoes anything: a FLAG is shown to the owner, who decides (Art Bible standing rule).
REVIEW_MODEL = os.environ.get('GEMINI_REVIEW_MODEL') or 'gemini-3.8-flash'   # a Flash-class text model; gemini-2.5-flash answers 404 (closed to new users, 18 Nov 2026)
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
    "2. STYLE: it matches the anchor style: a clean, polished 3D game-model render with crisp edges and soft light from the "
    "upper left (studio light on grey backgrounds, natural daylight in outdoor scenes), slightly realistic materials; not a "
    "photograph, not toy-like, not a drawing.\n"
    "3. BACKGROUND: {p3}\n"
    "4. FRAMING: {p4}\n"
    "5. NO MARKINGS: no text, letters, numbers, logos, flags, emblems, roundels, stars or national insignia anywhere.\n"
    "6. ORIGINAL: it is not a line-for-line copy of a real, recognisable product (a real tank, jet, ship or similar); it may only "
    "carry the general family look of its group.\n"
    "7. NO EXTRAS: exactly the one unit asked for (or the set asked for); no extra, duplicated, partial or background units, no "
    "people, no buildings.\n\n"
    'Answer with JSON only, in this shape: {{"verdict": "PASS" or "FLAG", "reasons": ["short plain reason", "..."]}}. '
    "Use PASS only if all seven points are fine (reasons may then be empty). Use FLAG if any point fails or you are unsure, and "
    "name each failed point by its number and a short plain reason (under 20 words each).")

REVIEW_P3 = "the background is a plain, flat, uniform light grey with at most a faint soft shadow; no base slab, ground, terrain, horizon or other objects."
REVIEW_P4 = ("the whole unit is inside the frame, nothing cut off, centred, filling about 90 percent of the frame along its length, "
             "seen from the same angle and at the same size as the reference or the rest of its set (for units: exactly straight down, nose up).")
REVIEW_KIND = {   # unit pictures: points 3 and 4 and the reference sentence, by kind
    'side': (REVIEW_P3, "the whole tank is inside the frame with a margin, nothing cut off, centred, filling about 85 percent of the frame's "
             "width, seen in a front three-quarter side view from slightly above (not straight down, not a flat side-on profile)."),
    'scene': ("this picture is meant to be a full outdoor scene: a natural landscape and a dirt road filling the whole picture edge to edge. "
              "FAIL this point if there is a plain grey studio background, a frame, a border, or a blue or coloured tint or scanlines. The "
              "ground should be a believable landscape; some dust behind the tank is wanted.",
              "the one tank is whole and in action (driving on the dirt road), clearly visible and not cut off, about half the picture's "
              "width, in a landscape-shaped picture."),
    'top': (REVIEW_P3, "the whole tank is inside the frame, nothing cut off, centred, its length filling about 90 percent of the "
            "picture's height, seen exactly straight down (a true plan view, no side or front visible), gun and front pointing to the top.")}

def review_kind(name):
    """points 3 and 4 of the check for a unit picture: the tank's own texts, or the texts built from the other unit's class"""
    u = UNIT_LOOKS[name]
    if 'cls' not in u: return REVIEW_KIND[u['kind']]
    C, w, k = UL_CLS[u['cls']], u['unit'], u['kind']; dim = 'height' if u['cls'] == 'man' else 'width'
    if k == 'side': return (REVIEW_P3, f"the whole {w} is inside the frame with a margin, nothing cut off, centred, filling about 85 percent of the frame's {dim}, seen in a front three-quarter side view from slightly above (not straight down, not a flat side-on profile).")
    if k == 'scene': return ("this picture is meant to be a full outdoor scene filling the whole picture edge to edge. FAIL this point if there is a plain grey studio background, a frame, a border, or a blue or coloured tint or scanlines. The surroundings should be a believable natural setting for this kind of unit.",
                             C['scene_look'][0].upper() + C['scene_look'][1:] + '.')
    return ("the background is a plain, flat, uniform light grey with NO shadow, shadow plate or ground patch under or beside the unit; no base slab, ground, terrain or horizon.",
            f"the whole {w} is inside the frame, nothing cut off, centred, filling about 90 percent of the picture (85 percent for a soldier), seen exactly straight down (a true plan view, no side or front visible), its front or nose pointing to the top.")

def review_what(name):
    if name in UNIT_LOOKS: return UNIT_LOOKS[name]['prefix'] + ' ' + UNIT_LOOKS[name]['subject']
    if name in SUBJECTS: return SUBJECTS[name]
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
    elif name in UNIT_LOOKS and UNIT_LOOKS[name]['kind'] != 'side': rtxt = ('Picture 2 is the reference it was made from: the master side view of the very same ' + ('tank' if 'cls' not in UNIT_LOOKS[name] else UNIT_LOOKS[name]['unit']) + '. It must be the same ' + ('tank' if 'cls' not in UNIT_LOOKS[name] else 'unit') + ': same shape, parts, details and paint' + (' (a top-down must keep the same layout of hatches, turrets, sensors, stowage and weapons as the side view, on the same side, not mirrored, with no part added or dropped).' if UNIT_LOOKS[name]['kind'] == 'top' else '.'))
    elif name in UNIT_LOOKS and UNIT_LOOKS[name]['fresh']: rtxt = 'Pictures 2 and 3 are the style anchors (buildings): compare style only, not the subject or the camera.'
    elif name in UNIT_LOOKS: rtxt = 'Pictures 2 and 3 are the style anchors (buildings): compare style only. Picture 4 is generation 1 of the same unit and group: the new one must keep the paint and family look but be a clearly different, newer model.'
    else: rtxt = 'The other attached picture(s) are the reference(s) it was made from.'
    p3, p4 = (review_kind(name) if name in UNIT_LOOKS else (REVIEW_P3, REVIEW_P4))
    text = REVIEW_PROMPT.format(refs=rtxt, what=review_what(name), p3=p3, p4=p4, style=UNIT_LOOKS[name]['style'] if name in UNIT_LOOKS else STYLE_V2)
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


# ---- THE THREE-WAY CHECK (--match ul-tank-<group>-<look>): the side view, card scene and top-down of one look go to the Gemini text
# model together. MATCH or FLAG with reasons, to the log row "<look> (match)" and to assets/art-src/<look>.match.txt. It only flags.
MATCH_PROMPT = (
    "You are the quality checker for the unit pictures of a strategy game. Three pictures of ONE {unit} are attached, in this order: "
    "picture 1 is the SIDE view (the master: a three-quarter side view on a plain grey background), picture 2 is the CARD SCENE (the "
    "same {unit} in action outdoors), picture 3 is the TOP-DOWN (seen from straight above, nose up, on a plain grey background). "
    "All three are meant to show exactly the same vehicle. The scene and the top-down were made from the side view.\n\n"
    "Check this checklist, each point on its own:\n"
    "1. SAME VEHICLE: the overall shape, hull, turret, gun, wheels and tracks (the number of road wheels), side skirts, bustle, "
    "sensors, launchers, stowage and other details are the same in all three, as far as each view can show them.\n"
    "2. SAME PAINT: the paint colour and finish are the same in all three (a landscape's light may change them a little).\n"
    "3. RIGHT VIEW: picture 1 is a front three-quarter side view from slightly above on plain grey; picture 2 is a full outdoor scene "
    "with the tank driving on a dirt road, no grey studio background, no tint; picture 3 is a true straight-down plan view, nose up, "
    "on plain grey.\n"
    "4. NO MARKINGS: no text, letters, numbers, logos, flags, emblems, stars or insignia in any of the three.\n"
    "5. NO EXTRAS: exactly one vehicle in each picture; no second vehicle, no people, no buildings (distant trees and hills are fine).\n\n"
    'Answer with JSON only, in this shape: {{"verdict": "MATCH" or "FLAG", "flagged_pictures": ["side" and/or "scene" and/or "top", only the ones that do not match or are wrong], '
    '"reasons": ["short plain reason", "..."]}}. Use MATCH only if all five points are fine (flagged_pictures empty, reasons may be empty). '
    "Use FLAG if any point fails or you are unsure, and name each failed point by its number and the picture it concerns, with a short "
    "plain reason (under 25 words each).")

MATCH_PROMPT2 = (
    "You are the quality checker for the unit pictures of a strategy game. Three pictures of ONE {unit} are attached, in this order: "
    "picture 1 is the SIDE view (the master: a three-quarter side view on a plain grey background), picture 2 is the CARD SCENE (the "
    "same {unit} in action in its natural setting), picture 3 is the TOP-DOWN (seen from straight above, front or nose up, on a plain grey background). "
    "All three are meant to show exactly the same unit. The scene and the top-down were made from the side view.\n\n"
    "Check this checklist, each point on its own:\n"
    "1. SAME UNIT: the overall shape and every part ({parts}) are the same in all three, as far as each view can show them. For the top-down in particular, "
    "the layout of hatches, turrets, sensors, antennas, stowage and weapons must be the same as in the side view, on the same side (not mirrored, not rearranged), with no part added or dropped.\n"
    "2. SAME PAINT: the paint colour and finish are the same in all three (a landscape's or the sky's light may change them a little).\n"
    "3. RIGHT VIEW: picture 1 is a front three-quarter side view from slightly above on plain grey; picture 2 is a full outdoor scene "
    "with no grey studio background and no tint; picture 3 is a true straight-down plan view, front up, on plain grey with no shadow plate.\n"
    "4. NO MARKINGS: no text, letters, numbers, logos, flags, emblems, stars, roundels or insignia in any of the three.\n"
    "5. NO EXTRAS: exactly one unit in each picture; no second vehicle, aircraft, ship or person, no buildings (distant trees, hills, sea and clouds are fine).\n\n"
    'Answer with JSON only, in this shape: {{"verdict": "MATCH" or "FLAG", "flagged_pictures": ["side" and/or "scene" and/or "top", only the ones that do not match or are wrong], '
    '"reasons": ["short plain reason", "..."]}}. Use MATCH only if all five points are fine (flagged_pictures empty, reasons may be empty). '
    "Use FLAG if any point fails or you are unsure, and name each failed point by its number and the picture it concerns, with a short "
    "plain reason (under 25 words each).")

def match(look):
    """look: 'ul-tank-nato-1'. Returns (verdict, reasons) or None when a picture is missing. Logs its own cost row; never raises, never redoes anything."""
    paths = [ul_path(f'{look}-{k}') for k in UNIT_KINDS]
    if not all(paths):
        print(f'{look}: skipped, missing {[f"{look}-{k}" for k, q in zip(UNIT_KINDS, paths) if not q]}'); return None
    U0 = UNIT_LOOKS[f'{look}-side']
    text = MATCH_PROMPT.format(unit=U0['unit']) if 'cls' not in U0 else MATCH_PROMPT2.format(unit=U0['unit'], parts=UL_CLS[U0['cls']]['match_parts'])
    body = {'contents': [{'parts': [{'text': text}] + [image_part(q) for q in paths]}], 'generationConfig': {'responseMimeType': 'application/json'}}
    verdict, reasons, flagged, usd, tok = 'FLAG', ['the check could not run or its answer was unreadable: look at the three pictures yourself'], [], 0.0, {}
    try:
        r = call('POST', f'models/{REVIEW_MODEL}:generateContent', body); u = r.get('usageMetadata', {})
        usd = ((u.get('candidatesTokenCount', 0) + u.get('thoughtsTokenCount', 0)) * REV_OUT_USD + u.get('promptTokenCount', 0) * REV_IN_USD)
        tok = {k: u.get(k) for k in ('promptTokenCount', 'candidatesTokenCount', 'thoughtsTokenCount')}
        raw = ''.join(p.get('text', '') for c in r.get('candidates', []) for p in c.get('content', {}).get('parts', []) if not p.get('thought'))
        j = json.loads(raw.strip().strip('`').removeprefix('json').strip())
        flagged = [str(x) for x in j.get('flagged_pictures', [])]
        if j.get('verdict') == 'MATCH': verdict, reasons = 'MATCH', [str(x) for x in j.get('reasons', [])]
        else: verdict, reasons = 'FLAG', [str(x) for x in j.get('reasons', [])] or ['flagged without a reason: look at the three pictures yourself']
    except SystemExit as e: reasons = [f'the check failed ({e}): look at the three pictures yourself']
    except Exception as e: reasons = [f'the check answer could not be read ({type(e).__name__}): look at the three pictures yourself']
    rf = os.path.join(OUT, look + '.match.txt')
    with open(rf, 'w') as f: f.write(verdict + (' (flagged: ' + ', '.join(flagged) + ')' if flagged else '') + '\n' + ''.join(f'- {x}\n' for x in reasons))
    with open(LOG, 'a') as f:
        f.write(json.dumps({'name': look + ' (match)', 'file': os.path.relpath(rf, ROOT), 'batch': False, 'usd_est': round(usd, 4), 'match': verdict, 'flagged_pictures': flagged, 'match_reasons': reasons, 'tokens': tok}) + '\n')
    print(f'{look}: {verdict}' + (f' (flagged: {", ".join(flagged)})' if flagged else '') + ''.join(f'\n    - {x}' for x in reasons) + ('\n  (flag only: nothing is redone; show the owner and ask)' if verdict == 'FLAG' else ''))
    return verdict, reasons

# ---- SPENDING (owner's decisions 2026-11-18): the log stood at 255 calls, $10.27 when the Gemini balance was $40.88. The $12 line is
# removed. After every run the new spending since then, the running total and the estimated balance are printed; a run that could take
# the estimated balance below $5 is refused. (Add the owner's top-ups to BALANCE_TOPUPS_USD when he says so.)
BASELINE_USD, BASELINE_CALLS, BASELINE_BALANCE, BALANCE_TOPUPS_USD, BALANCE_FLOOR = 10.27, 255, 40.88, -0.30, 5.0   # -0.30: the owner's figure when this job started (2026-11-19) was about $38.75, not $39.05; add top-ups here
def spend_totals():
    rows = [json.loads(l) for l in open(LOG)] if os.path.exists(LOG) else []
    return sum(r.get('calls', 1) for r in rows), sum(r.get('usd_est', 0) for r in rows)
def cost_line():
    calls, usd = spend_totals(); new = usd - BASELINE_USD
    return (f'{calls} calls, about ${usd:.2f} in the log (estimate; the real bill is in Google AI Studio). New spending since the $40.88 balance: '
            f'{calls - BASELINE_CALLS} calls, about ${new:.2f}; estimated balance left about ${BASELINE_BALANCE + BALANCE_TOPUPS_USD - new:.2f} (stop below ${BALANCE_FLOOR:.0f}).')
def balance_guard(planned_usd):
    calls, usd = spend_totals(); left = BASELINE_BALANCE + BALANCE_TOPUPS_USD - (usd - BASELINE_USD)
    if left - planned_usd < BALANCE_FLOOR:
        raise SystemExit(f'stopped: the estimated balance is about ${left:.2f} and this run may cost about ${planned_usd:.2f}, which would take it below ${BALANCE_FLOOR:.0f}. Tell the owner.')

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
        if not PRINT_ONLY and not all(paths): raise SystemExit(f'{name} needs {[r for r, p in zip(u["refs"], paths) if not p]} first: make the side view before the pictures made from it (one batch after the other)')
        text, images = unit_request_text(name), [p for p in paths if p]
        REF_USED[name] = [os.path.relpath(p, ROOT) if p else r + ' (not made yet)' for r, p in zip(u['refs'], paths)]
        return {'contents': [{'parts': [{'text': text}] + [image_part(p) for p in images]}],
                'generationConfig': {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': u['aspect'], 'imageSize': '1K'}}}
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
        print(f'  {name}: reply picture {im.size[0]}x{im.size[1]}')
        if name in ICONS: im.save(p[:-4] + '.grey.png'); cutout(im).save(p)
        elif name in R_BANNERS or name in R_ICONS or name in UNIT_LOOKS: p = p[:-4] + '.webp'; im.convert('RGB').save(p, 'WEBP', quality=95 if name in UNIT_LOOKS else 92, method=6)   # research sources: webp q92, not big PNGs
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

def doc_unit(key):
    """the markdown section of docs/UNIT-LOOKS-PROMPTS.md for one unit (printed; paste or append it): the unit-specific words of all 15 looks, and how the 45 prompts are put together"""
    d = UD[key]; C = UL_CLS[d['cls']]; u = d['label']; GN = {'nato': 'US/NATO', 'east': 'Eastern', 'china': 'China', 'europe': 'Europe', 'export': 'Export'}
    o = [f"### {u[0].upper() + u[1:]} (`{key}`): 45 prompts, built from these words", '',
         f"Class of picture: `{d['cls']}`. Files: `assets/art-src/ul-{key}-<group>-<look>-<side|scene|top>.webp`. Batches: 1 = the 5 look-1 side views, 2 = the 10 look-2 and look-3 side views, 3 = the 30 scenes and top-downs (each from its own side view).", '',
         f"Each prompt is `prefix` + blank line + `subject` + blank line + `style`, exactly as `python3 -I tools/gen-art.py --dry-run ul-{key}-nato-1-side` prints it. The prefix, the style and the class frames are the shared blocks of the section \"The other units\" above; what is unit-specific is below.", '',
         f"- **Side frame:** {C['side'].format(u=u)}" + (' ' + d['note'] if d['note'] else ''),
         f"- **Top-down frame:** {C['top'].format(u=u)}" + (' ' + d['note'] if d['note'] else ''),
         f"- **Card scene:** \"A single {u} {d['action']}. The setting: <the group's setting>. {C['scene_frame']} The {u} is described in words as: <the look's words>\"", '']
    for g in UNIT_GROUPS:
        fam, gl = d['groups'][g]
        o += [f"#### {GN[g]}", '', f"- **Setting of the card scene:** {d['setting'][g]}.", f"- **Family look:** {fam} Paint: {d['paint'][g]}."]
        for n in (1, 2, 3): o.append(f"- **Look {n} (levels {['1-3', '4-6', '7-8'][n - 1]}):** {d['gens'][n - 1]}{gl[n - 1]}")
        o.append('')
    print('\n'.join(o))

def doc_shared():
    """the shared blocks of the other units' prompts, as the section header of docs/UNIT-LOOKS-PROMPTS.md part 5"""
    q = lambda t: '```text\n' + t + '\n```\n'
    o = ['## 5. The other units (owner: "make the rest, with the Gemini check on every picture", 2026-11-19)', '',
         "The tank's pattern for every other unit with looks: 5 groups x 3 looks x 3 kinds = 45 pictures a unit, no shared designs. The unit-specific words (frames, scene action, family look, paint, setting and the three generations of each group) are written per unit below; the blocks every unit shares are here. `python3 -I tools/gen-art.py --dry-run ul-<unit>-<group>-<look>-<kind>` prints any complete prompt (free).", '',
         '**What the tank sets taught, now in every prompt.** The top-down keeps exactly the same layout of hatches, turrets, sensors, stowage and weapons as the side view, on the same side, not mirrored, nothing added or dropped (the three-way check flagged 8 of the 15 tank looks for this). Light from the upper left in every kind. The top-down has no shadow on the grey (the map draws its own); `prep-art.py` also removes any shadow left. The card scenes stay photo-real. Nothing flagged is redone: the owner decides.', '',
         '**Side view, look 1 (prefix):**', q(UNIT_PREFIX_SIDE_NEW), '**Side view, looks 2 and 3 (prefix; the group\'s look-1 side view is attached as the third picture):**', q(UNIT_PREFIX_SIDE_FAMILY),
         '**Side view style:**', q(STYLE_V2_SIDE), '**Card scene prefix** (`{detail}` is the class\'s list of parts):', q(UL_PREFIX_SCENE), '**Card scene style:**', q(STYLE_UL_SCENE),
         '**Top-down prefix:**', q(UL_PREFIX_TOP), '**Top-down style** (the crop sentence is the class\'s):', q(STYLE_UL_TOP), '**Tail of every unit description:**', q(UL_UNIT_TAIL), '']
    for c, C in UL_CLS.items():
        o += [f"**Class `{c}`: parts to keep the same:** {C['detail']}", f"- crop sentence of the top-down: {C['crop']}", f"- paint by group: " + '; '.join(f"{g}: {UL_PAINT[c][g]}" for g in UNIT_GROUPS), '']
    o += ['**Card scene settings by class and group**', '']
    for nm, T in (('ground units', UL_LAND), ('aircraft', UL_SKY), ('helicopters', UL_LOW), ('ships and submarines', UL_SEA)):
        o += [f"- {nm}: " + '; '.join(f"{g}: {T[g]}" for g in UNIT_GROUPS)]
    print('\n'.join(o) + '\n')

def main(a):
    if not a or a[0] in ('-h', '--help'): print(__doc__); return
    if a[0] == '--doc-shared': doc_shared(); return
    if a[0] == '--doc': doc_unit(a[1]); return
    if a[0] == '--list':
        for n in list(SUBJECTS) + list(UNIT_LOOKS) + list(GROWS) + list(ICONS) + list(REDRAWS) + list(RES_ICONS) + list(R_BANNERS) + list(R_ICONS):
            print(('done ' if any(os.path.exists(os.path.join(OUT, f'{stem(n)}.{x}')) for x in ('png', 'webp')) else '     ') + n + (f'  (grows from {GROWS[n][0]})' if n in GROWS else ''))
        return
    if a[0] == '--cost':
        print(cost_line()); return
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
        elif a[i] == '--collect': collect(a[i + 1], force); print(cost_line()); return
        elif a[i] == '--match':   # the three-way check of looks (ul-tank-<group>-<look> ...): side, scene and top-down together
            for look in a[i + 1:]:
                if f'{look}-side' not in UNIT_LOOKS: raise SystemExit(f'unknown look: {look}')
            balance_guard(0.01 * len(a[i + 1:]))
            for look in a[i + 1:]: match(look)
            print(cost_line()); return
        elif a[i] == '--review-only':   # the single-picture check of pictures already made (names of unit pictures)
            for n in a[i + 1:]:
                q = ul_path(n)
                if n not in UNIT_LOOKS or not q: raise SystemExit(f'{n}: not a unit picture, or not made yet')
                request(n, [])   # (sets REF_USED)
                v, rs = review(n, q); print(f'{n}: {v}' + ''.join(f'\n    - {x}' for x in rs))
            print(cost_line()); return
        elif a[i] == '--prep-research': prep_research(a[i + 1:]); return
        elif a[i] == '--edit': edits.append((a[i + 2], [a[i + 1]], a[i + 3])); i += 3
        elif a[i] in SUBJECTS or a[i] in UNIT_LOOKS or a[i] in GROWS or a[i] in ICONS or a[i] in REDRAWS or a[i] in RES_ICONS or a[i] in R_BANNERS or a[i] in R_ICONS: names.append(a[i])   # repeat a name for more tries
        else: raise SystemExit(f'unknown name or option: {a[i]} (see --list)')
        i += 1
    if batch and any(n in GROWS and GROWS[n][0] in names for n in names):
        raise SystemExit('a level that grows from another level in the same batch has to wait for it: send them one after the other')
    if batch and not PRINT_ONLY and any(n in UNIT_LOOKS and r in names for n in names for r in UNIT_LOOKS[n]['refs']):
        raise SystemExit('a picture made from another picture (looks 2 and 3 from look 1, scenes and top-downs from their side view) cannot be in the same batch as it: send the master first, then the rest in the next batch')
    jobs = [(n, request(n, refs)) for n in names] + [(n, request(n, r, c)) for n, r, c in edits]
    if show:
        for n, r in jobs:
            print(f'--- {n}')
            if n in UNIT_LOOKS: print(f'[{UNIT_LOOKS[n]["kind"]} view, {UNIT_LOOKS[n]["aspect"]}; attached: {", ".join(REF_USED[n])}]')
            print(f'{r["contents"][0]["parts"][0]["text"]}\n')
        if REVIEW: print('--- THE CHECK (sent after each picture, with the new picture first and its references after it)\n' + REVIEW_PROMPT.format(refs='<which pictures are attached>', what='<the picture\'s prompt>', p3='<by kind>', p4='<by kind>', style='<its style block>') + f'\n[model: {REVIEW_MODEL}]')
        return
    os.makedirs(OUT, exist_ok=True)
    balance_guard(len(jobs) * (0.045 if batch else 0.09) + (len(jobs) * 0.01 if REVIEW else 0))   # (a generous estimate, not the price)
    if batch: batch_run(jobs, force)
    else:
        for n, r in jobs: save(n, call('POST', f'models/{MODEL}:generateContent', r), force, False)
    print(cost_line())

if __name__ == '__main__': main(sys.argv[1:])
