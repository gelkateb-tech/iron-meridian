"""Generates building pictures with the Gemini API (Nano Banana 2.1, 1K, square) into assets/art-src/ba-<name>.png.

The pictures are the angled building set: one shared STYLE paragraph (the 8 Higgsfield prompts' style for the HQ,
Airbase 1-5 and Recruiting Office 2-3, minus their base pad: buildings stand straight on the grey background) after
a short description of each building level (SUBJECTS below).

The API key is never read, printed or stored here: the session's network proxy adds it to every request to
generativelanguage.googleapis.com (header x-goog-api-key). Run elsewhere, set GEMINI_API_KEY and it is sent in that header.

usage: python3 -I tools/gen-art.py <name> [<name> ...]     e.g. naval-yard-1
       python3 -I tools/gen-art.py --list                  the names and whether their picture exists
options: --force         overwrite an existing picture (otherwise the new one is saved as ba-<name>.v2.png, .v3 ...)
         --ref <file>    a style reference picture sent with the prompt (repeatable, e.g. a Higgsfield picture)
         --print         print the prompt and stop (no API call)
       python3 -I tools/gen-art.py --edit <picture> <name> "<change>"   a small change to a picture, everything else kept;
                                                                       saved as the next free ba-<name>.vN.png
"""
import sys, os, json, base64, io, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'art-src')
MODEL = 'gemini-nano-banana-2.1'   # "Nano Banana 2.1"
URL = f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent'

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

def prompt(name): return SUBJECTS[name] + '\n\n' + STYLE

def free_path(name, force):
    p = os.path.join(OUT, f'ba-{name}.png')
    if force or not os.path.exists(p): return p
    v = 2
    while os.path.exists(os.path.join(OUT, f'ba-{name}.v{v}.png')): v += 1
    return os.path.join(OUT, f'ba-{name}.v{v}.png')

EDIT = ("Edit the attached picture. Change only this: {}. Keep everything else exactly as it is: every building, pier, "
        "crane, ship and the dry dock, their shapes, positions, sizes and directions, the camera angle, framing, lighting, "
        "shadows, colours and the plain flat light grey background. Do not add or remove anything.")

def generate(text, refs, edit=False):
    parts = [{'text': text}]
    for r in refs:
        ext = os.path.splitext(r)[1].lower().lstrip('.')
        mime = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'webp': 'image/webp'}.get(ext, 'image/png')
        parts.append({'inlineData': {'mimeType': mime, 'data': base64.b64encode(open(r, 'rb').read()).decode()}})
    if refs and not edit: parts[0]['text'] = ('Match the rendering style, camera angle, palette, lighting and plain grey background of the '
                                 'attached reference picture(s), but draw the facility described here.\n\n') + text
    body = {'contents': [{'parts': parts}],
            'generationConfig': {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': '1:1', 'imageSize': '1K'}}}
    headers = {'Content-Type': 'application/json'}
    if os.environ.get('GEMINI_API_KEY'): headers['x-goog-api-key'] = os.environ['GEMINI_API_KEY']
    req = urllib.request.Request(URL, json.dumps(body).encode(), headers)
    try:
        with urllib.request.urlopen(req, timeout=300) as r: d = json.load(r)
    except urllib.error.HTTPError as e:
        try: msg = json.load(e).get('error', {}).get('message', '')
        except Exception: msg = ''
        raise SystemExit(f'API error {e.code}: {msg}')
    for c in d.get('candidates', []):
        for p in c.get('content', {}).get('parts', []):
            if 'inlineData' in p and not p.get('thought'): return base64.b64decode(p['inlineData']['data'])
    raise SystemExit('no picture in the reply: ' + json.dumps({k: d.get(k) for k in ('promptFeedback',)} |
                     {'finish': [c.get('finishReason') for c in d.get('candidates', [])]}))

def main(a):
    if not a or a[0] in ('-h', '--help'): print(__doc__); return
    if a[0] == '--list':
        for n in SUBJECTS: print(('done ' if os.path.exists(os.path.join(OUT, f'ba-{n}.png')) else '     ') + n)
        return
    if a[0] == '--edit':
        src, name, change = a[1], a[2], a[3]
        data = generate(EDIT.format(change), [src], edit=True)
        p = free_path(name, False)
        from PIL import Image
        Image.open(io.BytesIO(data)).save(p)
        print(os.path.relpath(p, ROOT)); return
    force, show, refs, names = False, False, [], []
    i = 0
    while i < len(a):
        if a[i] == '--force': force = True
        elif a[i] == '--print': show = True
        elif a[i] == '--ref': i += 1; refs.append(a[i])
        elif a[i] in SUBJECTS: names.append(a[i])
        else: raise SystemExit(f'unknown name or option: {a[i]} (see --list)')
        i += 1
    os.makedirs(OUT, exist_ok=True)
    for n in names:
        if show: print(f'--- {n}\n{prompt(n)}\n'); continue
        data = generate(prompt(n), refs)
        p = free_path(n, force)
        from PIL import Image   # saved as a true PNG whatever format the API returns
        Image.open(io.BytesIO(data)).save(p)
        print(os.path.relpath(p, ROOT))

main(sys.argv[1:])
