"""Unit look atlases: the pictures of one unit (tools/gen-art.py ul-<unit>-<group>-<look>-<side|scene|top>) packed into two webp files, so the game ships
a few files instead of 45 a unit (the artifact host holds at most 511 files per version; the page asks for each atlas once, when a picture of its unit is first needed).
  assets/art/ula-<unit>-pic.webp    the 15 straight-down pictures (-top, 512 px square, cut out) and the 15 side views (-side, cut out, trimmed): RGBA, quality 90
  assets/art/ula-<unit>-scene.webp  the 15 card scenes (-scene, 768x512, not cut out): RGB, quality 88
  assets/art-src/ul-atlas/<unit>.json   where every picture sits: {"pic": [W, H, {"<group>-<look>-<kind>": [x, y, w, h], ...}], "scene": [...]}
tools/build.js and tools/mkpage.sh write these tables into the page (UL_MAN in index.html); the page cuts a picture out of its atlas by the table (a canvas for the map
and the army bar, a CSS background for the research cards and tree), so a new unit needs no code change: prep-art.py ul (or `from-webp`, below) and a build.
Layout: pictures are put on shelves, tallest first; every picture sits in a slot of its size rounded up to 16 px plus a 16 px margin on every side, and the margin is the
picture's own edge pixels repeated (extrusion), so no scale, zoom or filter ever mixes a neighbour in. Pictures start on multiples of 16 px (the webp block grid), so a
picture that was a webp before keeps its block structure and is not degraded by being packed.
usage (migration from single files, e.g. the ul-*.webp of an older assets/art):  python3 -I tools/ulatlas.py from-webp <dir with ul-*.webp> <out: assets/art> <manifest dir: assets/art-src/ul-atlas>
"""
import sys, os, re, json, glob
import numpy as np
from PIL import Image

GROUPS = ['nato', 'europe', 'east', 'china', 'export']
PAD = 16
MAXW = {'pic': 2720, 'scene': 2400}   # atlas width: 5 tops across / 3 scenes across (a phone's texture limit is 4096)
QUALITY = {'pic': 90, 'scene': 88}    # the encoder settings the single files had
STEM = re.compile(r'^ul-([a-z0-9]+)-([a-z]+)-([1-3])-(side|scene|top)$')

def c16(n): return (n + 15)//16*16

def layout(sizes, maxw):
    """sizes {key: (w, h)} -> ({key: (x, y)} of each picture's own pixels, atlas width, atlas height); shelves, tallest first, ties by name"""
    pos, x, y, rowh, used = {}, 0, 0, 0, 0
    for k in sorted(sizes, key=lambda k: (-sizes[k][1], k)):
        w, h = sizes[k]; sw, sh = c16(w) + 2*PAD, c16(h) + 2*PAD
        if x + sw > maxw and x: y += rowh; x = 0; rowh = 0
        pos[k] = (x + PAD, y + PAD); x += sw; rowh = max(rowh, sh); used = max(used, x)
    return pos, used, y + rowh

def pack(images, kind):
    """images {key: PIL image} -> (PIL atlas, {key: [x, y, w, h]}); kind 'pic' (RGBA) or 'scene' (RGB)"""
    mode = 'RGBA' if kind == 'pic' else 'RGB'; ch = 4 if kind == 'pic' else 3
    sizes = {k: im.size for k, im in images.items()}
    pos, W, H = layout(sizes, MAXW[kind]); W, H = c16(W), c16(H)
    A = np.zeros((H, W, ch), np.uint8); cells = {}
    for k, im in images.items():
        a = np.asarray(im.convert(mode)); h, w = a.shape[:2]; x, y = pos[k]; sw, sh = c16(w) + 2*PAD, c16(h) + 2*PAD
        A[y - PAD:y - PAD + sh, x - PAD:x - PAD + sw] = np.pad(a, ((PAD, sh - PAD - h), (PAD, sw - PAD - w), (0, 0)), mode='edge')   # extrusion: the edge pixels repeated
        cells[k] = [x, y, w, h]
    return Image.fromarray(A, mode), cells

def pack_unit(unit, pics, out_dir, man_dir):
    """pics {'ul-<unit>-<group>-<look>-<kind>': PIL image}: writes ula-<unit>-pic.webp, ula-<unit>-scene.webp and the unit's table"""
    os.makedirs(out_dir, exist_ok=True); os.makedirs(man_dir, exist_ok=True); man = {}
    for kind, kinds in (('pic', ('top', 'side')), ('scene', ('scene',))):
        sel = {}
        for stem, im in pics.items():
            m = STEM.match(stem)
            if m and m.group(1) == unit and m.group(4) in kinds: sel[f'{m.group(2)}-{m.group(3)}-{m.group(4)}'] = im
        if not sel: continue
        atlas, cells = pack(sel, kind); f = os.path.join(out_dir, f'ula-{unit}-{kind}.webp')
        atlas.save(f, 'WEBP', **(dict(lossless=True) if os.environ.get('ULATLAS_LOSSLESS') else dict(quality=QUALITY[kind], method=6)))   # (ULATLAS_LOSSLESS=1: a control build for pixel comparisons, not for shipping)
        man[kind] = [atlas.width, atlas.height, {k: cells[k] for k in sorted(cells)}]
        print(f'atlas {unit} {kind}: {len(sel)} pictures, {atlas.width}x{atlas.height}, {os.path.getsize(f)//1024} KB')
    with open(os.path.join(man_dir, unit + '.json'), 'w') as fh: json.dump(man, fh, separators=(',', ':'))
    return man

def from_webp(src, out_dir, man_dir):
    units = {}
    for f in sorted(glob.glob(os.path.join(src, 'ul-*.webp'))):
        stem = os.path.splitext(os.path.basename(f))[0]; m = STEM.match(stem)
        if m: units.setdefault(m.group(1), {})[stem] = Image.open(f)
    for u, pics in sorted(units.items()): pack_unit(u, pics, out_dir, man_dir)

if __name__ == '__main__':
    if len(sys.argv) == 5 and sys.argv[1] == 'from-webp': from_webp(*sys.argv[2:5])
    else: print(__doc__)
