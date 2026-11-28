# Simpler buildings: art direction test (owner 2026-11-27)

Owner's ask: simpler buildings that match the new cities. Two options were shown next to today's look, on Berlin and Kolkata, at play zoom and closest zoom.

**The owner picked option B (2026-11-28)**, with an extra round giving the HQ and the smaller buildings more character, and skipped option A and its test picture. On this branch B is now the default look: open the page as it is. `?bld=pic` in the page's address (for example `index.html?bld=pic`) shows today's pictures, unchanged, for comparison; `?bld=b` still works and is the same as no switch. Nothing is merged.

## Option B: buildings drawn in code (this branch, the default look)

Every building in a town (the HQ, Army Base, Airbase, Naval Yard, Bunker, Recruiting Office, Arms Industry, Missile Silo, levels I-V, and a building going up) is a handful of parts drawn the way the town's own blocks are drawn: the same camera (from the south-south-west, roofs leaning east), the same light from the north-west, the same wall shades, roof rims, windows and shadows, and the same night (the roofs go dark, lit windows and lamps). There are no picture files, so no image calls.

- Same lots as today (`cityLots`, `bnLayout`): the same ground, sizes and the Naval Yard's water side, so the comparison is fair.
- Close in (the town's canvas with its lots open), the parts are part of the town's canvases (`bdTownParts` in `cityPlanDraw`, their ground in `cityLotDraw`). There is one depth order with the blocks, so no second layer is drawn in front. Each frame only the flags (the HQ's, the Recruiting Office's and, from round 2, the Army Base's), a crane over a level going up, the progress ring and a Naval Yard's piers and ships are drawn over the map. The town canvases are kept to the land, so piers and ships out over the water are drawn on top.
- Further out (play zoom) or off its lot, a building is a small canvas of the same parts (`bdSprite`), darkened at night as the town is.
- Kept off the water (`bdDry`): a part whose foot touches the water the map draws (the sea, a lake, the delta's water, a river line) is drawn smaller round its middle, else left out, with what stands on it.
- The map's lines under the roofs (`bdHole`): the roads (also those drawn over the fog and by night), the railways and the province borders end at one outline round each building's lot and parts, as they end at a lot's fence today; the pictures, drawn over the map, used to hide them.
- A town's canvas that still shows a stand-in at a closed tier where a building stands (a part not made yet, or let go for memory): the building is drawn on its own over it, as today's pictures are, never left out.
- A construction's third and the HQ's style are in the town's signature (`bdSig`), so the town is made again at each third.
- Buildings in the countryside (a province with no town) keep their pictures; that is a separate job.

What each building is made of (`bdParts`; each level adds to the one before; round 2's additions in the next section):

| Building | I | II | III | IV | V |
|---|---|---|---|---|---|
| HQ (7 styles) | a symmetrical main block and two wings in a U on a forecourt, 8 flagpoles in two rows of four with the holder's flags; western: a portico and a copper dome on a drum; eastern-europe: a stepped tower and spire; middle-east: a big white dome and 4 small ones on the wings; east-asia: two tiers of dark pitched roof, red walls; south-asia: red sandstone, a pale onion dome on a drum and 4 small domed kiosks at the corners; africa: ochre with a wide roof slab; latin-america: yellow walls, terracotta roofs, a terracotta dome | | | | |
| Army Base | two rows of olive tents, a guard house, 2 trucks | a vehicle shed, a vehicle park with 6 trucks | 2 barracks, a parade ground | 4 barracks, an HQ block, 4 fuel tanks | barracks round the parade ground, a two-bay motor pool, a lookout tower |
| Airbase | a runway (threshold marks, a centre line close in), a taxiway with 2 links, an apron, 2 vaulted hangars, a control tower with a glass cab | 4 hangars, a longer apron | the runway at full length, a 3rd link, 4 hardened shelters | a maintenance hangar, 2 fuel tanks | 8 shelters, an operations block; parked jets close in |
| Naval Yard | 2 piers out over the water (across a river no further than 0.4 of its width), a frigate, a long shed, a command block with a mast; a river port's basin tight round the piers in the rivers' own water colour with a dark bank | 3 piers, 2 ships, a gantry crane | a dry dock with a hull | 4 piers, 2 cranes | 5 piers, a cruiser, a tall covered hall |
| Bunker | an earth-covered vault (khaki, not the grass's green) with an arched concrete front and a dark door to the south, a concrete apron, sandbags | 2 vaults | 3 vaults, vents | 4 vaults and a trench | 6 vaults, a blockhouse, an antenna |
| Recruiting Office | a small civic block, a canopy, a flagpole, a forecourt | an L | a U, a parade square | a taller middle, a bus bay with 2 buses | a wider columned hall, 2 flagpoles |
| Arms Industry | a sawtooth hall, a short stout brick chimney, a works yard with trucks | a 2nd hall | an office, 2 tanks | a 3rd hall, a 2nd chimney, a rail spur | a tall assembly hall, 3 chimneys |
| Missile Silo | a round hatch on a square concrete pad, open (its lid slid aside, a dark shaft, a missile's white nose), a control bunker, an access road, a tight fence close in | 2 hatches | 3 hatches, a radar | 4 hatches (a little smaller), a launcher shelter | 6 hatches, a bigger bunker, 2 radars |
| Going up | first third: a dug pit, a site cabin, stacks, a tower crane; second: the level I building at half height in netting, open at the top; last: its full height as a bare frame | | | | |

At night: barracks, offices and the HQ have lit windows; halls, hangars and sheds are mostly dark; the runway has edge lights (green and red at its ends); masts, cranes and chimneys have red lamps; the quay and the bunker doors have dim lamps.

### Round 2: more character (owner 2026-11-28)

The owner's note: "Close in, the HQ reads as a white block with a dome, and some buildings, like the Bunker and the Recruiting Office, need their labels or a tap to be sure what they are." Each building got a few large, recognisable parts in the blocks' flat style, light and colours (no ground pads, no picture files):

| Building | Added in round 2 |
|---|---|
| HQ (all 7 styles) | a columned portico at its door (a dark recess under the cornice and light columns: `por`, drawn by `bdWall`), three broad stone steps down to the forecourt, lamps either side of them, a flag on its top (on the dome, the spire's tip, the upper roof or the slab), and a forecourt in its own style with the holder's flags: western two lawns and a row of 6 flags along the front; eastern-europe a paved parade square, a monument on its plinth, 6 flags down both sides; middle-east a long pool with 3 fountains, 6 flags along it; east-asia a gate on the walk (two red posts under a dark roof), gardens, 6 flags down both sides; south-asia a long narrow pool between lawns, 6 flags along the front; africa a round plaza with a monument, 5 flags round its south side; latin-america a plaza with a round fountain, 6 flags down both sides. East-asia's walls and columns are red again (its red had fallen back to slate) |
| Recruiting Office | a red sign band across its front over the canopy, lit (not shaded like a wall) with white lettering, glowing by night (a lit strip, `lamp`'s length); a flag on its roof (on the taller middle from IV); a queue of recruits from its door, one dot each (close in) |
| Bunker | a concrete pillbox with dark firing slits on its walls, in a ring of sandbags open to the back; sandbags round every vault's door; a radar mast with a dish from I and a tall antenna from III; the vaults kept to the lot's west part to make room; the blockhouse at V has slits too |
| Army Base | a fence round it (close in) with a gate to the south: two posts, a red and white boom, a guard house beside it, a road in to the parade ground; lamps at the gate; a flag by the gate (the holder's flag, like the HQ's); watchtowers on four legs with a cab and a red lamp, one from I and a second from III (the old lookout tower at V goes) |
| Missile Silo | a yellow warning stripe round each hatch's pad, with black bars close in; the radar mast from I (a second at V); bigger radar dishes |
| Arms Industry | the rail spur from I (was IV) with 2-3 wagons on it; a yellow gantry crane over the works yard (its rails, four legs, the bridge and its trolley, a red lamp); at V the assembly hall is a little narrower, with the crane over a yard beside it |

Speed: these add a few parts per building (the HQ about 10 more, the others 5-12), drawn once into the town's canvases or a building's small canvas, not each frame; only the flags (one more on the HQ's top and the Recruiting Office's roof, one on the Army Base) are drawn each frame. Far out (`kz`: the building a few pixels wide, where its flags are not drawn) the small parts are left out: the HQ's steps, flagpoles and gate, the Army Base's gate posts and flag, the watchtowers' four legs (one post), the cranes' legs and trolley, the sandbags' dark foot; so at play zoom the HQ has fewer parts than in round 1. The measured numbers are in the round's report.

## Option A: simpler pictures (priced and prompted only; no picture made)

New names (`v3-<building>-<lv>`, `v3-hq-<style>`, `v3-construction-<n>`), so nothing overwrites today's files. `STYLE_V3` replaces STYLE and STYLE_V2 for these:

> Style: a simple flat-shaded 3D map building in the same look as the game's city blocks: plain box-like shapes with crisp straight edges, flat matte colours, no texture, no grain, no weathering, no small props (no crates, barrels, people, ropes, signs, tyre detail); a few large parts only; it must read at 30 px wide. Colours: pale sand-grey and warm grey concrete roofs (like #b8b1a4, #a8a29a, #c6bba7), muted olive (#7c8074) and slate-grey roofs, dark grey asphalt. Camera: orthographic, looking north from the south (slightly west of south), steeply from above, about 60 degrees down. Every building, road and pier runs square to the frame (left-right and up-down), never diagonal; you see each roof from above, the front (south) walls as short bands below the roofs and a thin sliver of the left walls, never the right walls or a corner-on view. Light: from the upper left (north-west): roofs bright, front walls in shade at about 40 percent of the roof's brightness, left walls about 70 percent; short, fairly hard shadows to the lower right, about two thirds of each building's height long. Ground: none. Everything stands directly on the plain flat light grey background (#D9D9D9), which shows between all the pieces and inside any fence; no earth, gravel, sand, grass or paving patch, no slab, plate, diamond, tile, raised rim or outline under or around the group; only each object's own shadow. A runway, apron, pier or parade ground is the subject's own flat shape with clean edges. Daylight only: no lit windows, no lamps. Cropped tight and centred, filling about 90 percent of the frame. Square 1:1. Original generic design. No text, letters, numbers, flags, emblems, logos or watermark.

Subject changes: no packed earth (Army Base I), no grass strips (Airbase I), no concrete pad (Silo), mounds with their own clean edges instead of a grass patch (Bunker map view), a pit with clean edges instead of an earth pad (construction), piers pointing straight right (Naval Yard, mirrored for the other shore), and "the same camera from the south" instead of "three-quarter view" in REDRAW.

Pictures: 45 (7 buildings x 5 levels, 7 HQ styles, 3 construction stages; the crane is cut from stage 2 for free). The panel cutaways (bn-fortcut) and the province-only Field Hospital are not included.

Cost, from the price log: about $1.70 by batch plus $0.15 of checks, about **$1.85** in all (range about $1.1-3.2); about $3.38 direct. The balance left is about $5.32 with the floor at $5, so the full set needs a top-up of about $3-5 first (added to `BALANCE_TOPUPS_USD`).

Test first: 3 pictures in one batch with `--review`: `v3-army-base-1`, `v3-airbase-1`, `v3-hq-western`. About **$0.12** by batch (about $0.23 direct); this fits the balance. It has not been run and waits for the owner's OK.

Code A would still need (no image calls): new anchors and footprints (`tools/cutout-angled.py --embed`, `tools/bn-foot.py --embed`), a recheck of the lots, and night darkening like the blocks instead of today's blue tint.
