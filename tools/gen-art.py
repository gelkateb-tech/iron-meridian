"""Generates building pictures with the Gemini API (Nano Banana 2.1, 1K, square) into assets/art-src/ba-<name>.png.

The pictures are the angled building set: one shared STYLE paragraph (the same one as the 8 Higgsfield prompts for the HQ,
Airbase 1-5 and Recruiting Office 2-3) after a short description of each building level (SUBJECTS below).

The API key is never read, printed or stored here: the session's network proxy adds it to every request to
generativelanguage.googleapis.com (header x-goog-api-key). Run elsewhere, set GEMINI_API_KEY and it is sent in that header.

usage: python3 -I tools/gen-art.py <name> [<name> ...]     e.g. naval-yard-1
       python3 -I tools/gen-art.py --list                  the names and whether their picture exists
options: --force         overwrite an existing picture (otherwise the new one is saved as ba-<name>.v2.png, .v3 ...)
         --ref <file>    a style reference picture sent with the prompt (repeatable, e.g. a Higgsfield picture)
         --print         print the prompt and stop (no API call)
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
         "front corner so its square footprint reads as a diamond. Lighting: soft, even daylight from the upper left with short, "
         "soft shadows falling to the lower right. The compound sits on its own clean concrete pad with crisp edges and is "
         "centred, filling about 80 percent of the frame. Background: a plain, flat, uniform light grey (#D9D9D9) with no ground, "
         "grass, horizon or scenery around the pad. Square 1:1 image. No text, no letters, no numbers, no flags, no emblems, "
         "no logos, no watermark.")

# one entry per building level; the HQ, Airbase 1-5 and Recruiting Office 2-3 come from Higgsfield, not from here
SUBJECTS = {
    'naval-yard-1': (
        "A small naval yard, level 1 of 5: a concrete quay pad whose front half is a rectangular basin of calm, flat, dark "
        "blue-grey water held inside the pad's crisp concrete edges, one short straight concrete pier reaching into the basin, "
        "a single small grey frigate moored alongside the pier, one low warehouse shed with an olive-green roof on the quay, and "
        "one small slim dockside crane at the water's edge."),
}

def prompt(name): return SUBJECTS[name] + '\n\n' + STYLE

def free_path(name, force):
    p = os.path.join(OUT, f'ba-{name}.png')
    if force or not os.path.exists(p): return p
    v = 2
    while os.path.exists(os.path.join(OUT, f'ba-{name}.v{v}.png')): v += 1
    return os.path.join(OUT, f'ba-{name}.v{v}.png')

def generate(text, refs):
    parts = [{'text': text}]
    for r in refs:
        ext = os.path.splitext(r)[1].lower().lstrip('.')
        mime = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'webp': 'image/webp'}.get(ext, 'image/png')
        parts.append({'inlineData': {'mimeType': mime, 'data': base64.b64encode(open(r, 'rb').read()).decode()}})
    if refs: parts[0]['text'] = ('Match the rendering style, camera angle, palette, lighting and plain grey background of the '
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
