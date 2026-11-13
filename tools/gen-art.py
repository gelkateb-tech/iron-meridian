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
  category, column header and research item, 1K), every one with the same R_STYLE paragraph; --prep-research crops and
  shrinks them into assets/art/ (banners rbs-<category>.webp 2240x560, icons ri-<key>.webp 256x256)
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
         --print         print the prompts and stop (no API call)
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
    'tank': ("a generic modern main battle tank of an original design: a low, wide, angular welded turret with flat add-on armour "
             "blocks on its front and sides, a long smoothbore gun with a plain thermal sleeve, six road wheels a side under "
             "plain side skirts, olive-khaki paint"),
    'art': ("a generic modern tracked self-propelled howitzer of an original design: a long tank-like tracked hull with six "
            "road wheels a side, a large flat-sided boxy armoured turret set toward the rear of the hull, and a very long "
            "155 mm gun barrel with a plain slotted muzzle brake, raised at a low angle and pointing forward over the "
            "front of the hull; olive-khaki paint"),
}
R_BANNERS = {   # rbs-<category>: one wide scene per research category
    'rbs-arm': ("Armoured Forces: a column of four modern main battle tanks driving along a straight, dusty desert road from "
                "the left toward the right, seen from the side at a slight three-quarter angle and from some distance, a thin "
                "trail of dust behind their tracks; flat sand desert with low mesas far away on the horizon."),
    'rbs-nav': ("Navy: a naval carrier group at sea: a large aircraft carrier with a flat flight deck and its island on the "
                "right side sails toward the right in the centre-right of the picture, one escorting destroyer ahead of it and "
                "one frigate behind it, all with gentle white wakes; calm open sea with a long, straight horizon."),
    'rbs-tac': ("Tactical Air: a flight of three modern twin-tail jet fighters in a loose echelon formation, flying from left "
                "to right high in the sky, seen from the side at a slight angle, above a broken layer of soft clouds with a "
                "far, hazy landscape below."),
}
R_ICONS = {   # ri-<key>: cat-<category> (the category icon), a research node id (u_tank: the Main Battle Tank unlock)
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
}
R_FOCUS = {'rbs-arm': 0.57}   # a banner's vertical centre for its strip crop, as a share of the height (0.5 when not listed)
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
        src = os.path.join(OUT, f'{n}.png'); im = Image.open(src).convert('RGB'); w, h = im.size
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

def building(name): return name.rsplit('-', 1)[0]   # naval-yard-3 -> naval-yard

def prompt(name): return SUBJECTS[name] + '\n\n' + STYLES.get(building(name), STYLE)

def stem(name): return name if name in ICONS or name in RES_ICONS or name in R_BANNERS or name in R_ICONS else f'ba-{name}'

def free_path(name, force):
    p = os.path.join(OUT, f'{stem(name)}.png')
    if force or not os.path.exists(p): return p
    v = 2
    while os.path.exists(os.path.join(OUT, f'{stem(name)}.v{v}.png')): v += 1
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
    if change is not None: text, images = EDIT.format(change), refs
    elif name in GROWS:
        before, add = GROWS[name]; src = os.path.join(OUT, f'ba-{before}.png')
        if not os.path.exists(src): raise SystemExit(f'{name} grows from {os.path.relpath(src, ROOT)}, which is not there yet')
        text, images = GROW.format(add, GROW_END.get(building(name), GROW_END['recruiting-office'])), [shrunk(src)]
    elif name in REDRAWS:
        src, desc = REDRAWS[name]; src = os.path.join(OUT, src)
        if not os.path.exists(src): raise SystemExit(f'{name} is redrawn from {os.path.relpath(src, ROOT)}, which is not there')
        text, images = REDRAW.format(desc), [src]
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
        else: im.save(p)
    with open(LOG, 'a') as f:
        f.write(json.dumps({'name': name, 'file': p and os.path.relpath(p, ROOT), 'batch': batch, 'usd_est': round(usd, 4),
                            'tokens': {k: u.get(k) for k in ('promptTokenCount', 'candidatesTokenCount', 'thoughtsTokenCount')}}) + '\n')
    if p: print(f'{os.path.relpath(p, ROOT)}  (~${usd:.4f})')
    else: print(f'{name}: no picture in the reply, finish {[c.get("finishReason") for c in reply.get("candidates", [])]} '
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
        for n in list(SUBJECTS) + list(GROWS) + list(ICONS) + list(REDRAWS) + list(RES_ICONS) + list(R_BANNERS) + list(R_ICONS):
            print(('done ' if os.path.exists(os.path.join(OUT, f'{stem(n)}.png')) else '     ') + n + (f'  (grows from {GROWS[n][0]})' if n in GROWS else ''))
        return
    if a[0] == '--cost':
        rows = [json.loads(l) for l in open(LOG)] if os.path.exists(LOG) else []
        calls = sum(r.get('calls', 1) for r in rows); usd = sum(r.get('usd_est', 0) for r in rows)
        print(f'{calls} calls, about ${usd:.2f} (estimate; the real bill is in Google AI Studio)'); return
    force = show = batch = False; refs, names, edits = [], [], []
    i = 0
    while i < len(a):
        if a[i] == '--force': force = True
        elif a[i] == '--print': show = True
        elif a[i] == '--batch': batch = True
        elif a[i] == '--ref': i += 1; refs.append(a[i])
        elif a[i] == '--collect': collect(a[i + 1], force); return
        elif a[i] == '--prep-research': prep_research(a[i + 1:]); return
        elif a[i] == '--edit': edits.append((a[i + 2], [a[i + 1]], a[i + 3])); i += 3
        elif a[i] in SUBJECTS or a[i] in GROWS or a[i] in ICONS or a[i] in REDRAWS or a[i] in RES_ICONS or a[i] in R_BANNERS or a[i] in R_ICONS: names.append(a[i])   # repeat a name for more tries
        else: raise SystemExit(f'unknown name or option: {a[i]} (see --list)')
        i += 1
    if batch and any(n in GROWS and GROWS[n][0] in names for n in names):
        raise SystemExit('a level that grows from another level in the same batch has to wait for it: send them one after the other')
    jobs = [(n, request(n, refs)) for n in names] + [(n, request(n, r, c)) for n, r, c in edits]
    if show:
        for n, r in jobs: print(f'--- {n}\n{r["contents"][0]["parts"][0]["text"]}\n')
        return
    os.makedirs(OUT, exist_ok=True)
    if batch: batch_run(jobs, force)
    else:
        for n, r in jobs: save(n, call('POST', f'models/{MODEL}:generateContent', r), force, False)

main(sys.argv[1:])
