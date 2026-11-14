"""Cuts the angled building pictures (assets/art-src/ba-*.png: 1024x1024, an angled view from above on a plain light grey
background) out of their background for the map and the city panel.

  python3 -I tools/cutout-angled.py assets/art-src assets/art [names...] [--embed]   (names: e.g. ba-airbase-3; default: every ba-*.png;
  --embed writes the metadata table into index.html as BNMETA). The game's run:
  python3 -I tools/cutout-angled.py assets/art-src assets/art --meta=tools/bn-meta.json --embed

Method (per picture, at the full 1024 px):
- background: a quadratic colour surface fitted to the pixels reached by a flood fill from the picture's border through
  pixels close to the border colour (refitted once against the first fit), so the soft vignette of each render is followed
- ground = background + cast shadow + lit ground: a second flood fill from the border through pixels that are either the
  background colour, a darker, neutral or blue (the renders' shadows are lit by the sky: the deeper the bluer), smooth copy
  of it, or the flat ground a building lights up a little (warmer, slightly brighter). Everything else is the
  building. Thin dark lines (the HQs' empty flagpoles, fences, antennas: darker than their 9 px median by a margin) always
  count as building, so the flood never eats them
- pockets: ground-coloured areas the border flood cannot reach (an empty courtyard inside a fence, the ground inside a trench
  line, partly in shadow) are background too when they are flat and hold the background colour; paved yards (textured or
  tinted) and a building's own shaded walls (shadow-coloured all over, no background in them) stay
- edges: the building's border pixels get a soft alpha from where they lie between the ground colour behind them and the
  nearest solid building colour (closed-form matting) and are un-mixed from that ground colour, so no grey fringe or halo
  is left on a dark, green or sand map
- cast shadow: kept as a translucent dark layer (its darkness from the ratio to the background, capped at SHADOW_MAX) so it
  reads as the building's own shadow on any ground; the light grey ground itself becomes fully transparent
- crop tight to everything visible (alpha > 3%), scaled down in premultiplied colour, saved as
  assets/art/bn-<key>-<level>.webp (long side MAP_PX: the map at 2x, and the city panel) and its metadata line
Metadata (tools/bn-meta.json with --meta=tools/bn-meta.json, else <out>/bn-meta.json; also embedded in index.html as BNMETA by --embed): per picture its size, the ground
anchor (the footprint centre, fractions of the cut-out), the HQ flagpole tops and (Naval Yard) the side its piers face.
"""
import sys, os, json, glob, numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC, OUT = sys.argv[1], sys.argv[2]
ONLY = [a for a in sys.argv[3:] if not a.startswith('--')]
MAP_PX = 256          # long side of the cut-out (map at 2x screens, city panel cards)
SHADOW_MAX = 0.5      # darkest a kept cast shadow gets (alpha of its dark layer)
SHADOW_RGB = np.array([14, 18, 28], np.float32)   # the shadows' colour (the renders' shadows are slightly blue)
# file name -> (key, level) of the game: keys as in the game's BUILD (air, rec, yard, fort, hq) plus hospital (not a game building yet)
KEYS = {'army-base':'fac', 'construction':'build', 'airbase':'air', 'recruiting-office':'rec', 'naval-yard':'yard', 'fortifications':'fort', 'hospital':'hospital'}
BRIDGE = ('hq-', 'hospital-', 'recruiting-office-', 'fortifications-')   # pictures whose cast shadows' sharp edges are crossed (see cut)
# hand corrections of the ground anchor (fractions of the cut-out), applied after the automatic one: (dx, dy)
ANCHOR_FIX = {}
# pictures rendered on a slab of ground with cut sides (a diorama base): the sides' height in source px. The cut-out drops them (and the
# slab's own cast shadow under them): in each column everything lower than the building's lowest pixel minus that height goes, the new
# front edge of the ground fading out over SLAB_FADE px, so the site sits flat on the map like a patch of dug earth
SLAB = {'construction-1': 62}
SLAB_FADE = 14

def unslab(rgba, obj, t):
    h, w = obj.shape
    ys = np.where(obj.any(0), h - 1 - np.argmax(obj[::-1], 0), -1).astype(np.float32)   # each column's lowest building pixel (-1: none)
    has = ys >= 0
    low = ndi.median_filter(np.where(has, ys, 0), 15)
    cutl = np.where(has, low - t, -1)[None, :]
    yy = np.arange(h, dtype=np.float32)[:, None]
    keep = np.clip((cutl - yy)/SLAB_FADE, 0, 1)
    rgba = rgba.copy(); rgba[..., 3] *= keep
    return rgba, obj & (keep > 0.5)

def flood_from_border(m):
    lab, n = ndi.label(m)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    return np.isin(lab, edge[edge > 0])

def fit_bg(a, mask):
    h, w, _ = a.shape; ys, xs = np.nonzero(mask)
    if len(xs) > 60000: k = np.linspace(0, len(xs) - 1, 60000).astype(int); ys, xs = ys[k], xs[k]
    X = np.stack([np.ones_like(xs), xs/w, ys/h, (xs/w)**2, (ys/h)**2, xs*ys/(w*h)], 1).astype(np.float64)
    gy, gx = np.mgrid[0:h, 0:w]; Gm = np.stack([np.ones_like(gx), gx/w, gy/h, (gx/w)**2, (gy/h)**2, gx*gy/(w*h)], -1).reshape(-1, 6)
    out = np.zeros_like(a)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(X, a[ys, xs, c].astype(np.float64), rcond=None); out[..., c] = (Gm @ coef).reshape(h, w)
    return out

def local_std(x, n):
    m = ndi.uniform_filter(x, n); m2 = ndi.uniform_filter(x*x, n); return np.sqrt(np.maximum(0, m2 - m*m))

def cut(a, name):
    h, w, _ = a.shape
    brd = np.concatenate([a[:4].reshape(-1, 3), a[-4:].reshape(-1, 3), a[:, :4].reshape(-1, 3), a[:, -4:].reshape(-1, 3)])
    m0 = np.median(brd, 0)
    near = (np.abs(a - m0).max(-1) < 16) & (a.max(-1) - a.min(-1) < 10)
    bg = fit_bg(a, ndi.binary_erosion(flood_from_border(near), iterations=3))
    d = np.abs(a - bg).max(-1)
    bg = fit_bg(a, ndi.binary_erosion(flood_from_border(d < 7), iterations=2))
    d = np.abs(a - bg).max(-1)
    lw = np.array([0.299, 0.587, 0.114], np.float32)
    k = (a @ lw)/np.maximum(1, bg @ lw)
    r = a/np.maximum(1, bg)
    blue = r[..., 2] - r[..., 0]; mid = np.abs(r[..., 1] - (r[..., 0] + r[..., 2])/2)
    neutral = (blue > -0.025) & (blue < 0.09) & (mid < 0.03)
    neutral |= (blue >= 0.09) & (blue < 0.2) & (mid < 0.035) & (k > 0.4) & (k < 0.8)   # (a deep cast shadow, lit by the sky alone, is clearly blue)
    smooth = local_std(k, 5) < 0.03
    thin = (k < ndi.median_filter(k, 9) - 0.07) | (k > ndi.median_filter(k, 9) + 0.07)   # lines (poles, wires, fences): building
    bgish = (d < 7) & ~thin
    shadowish = (k < 0.99) & (k > 0.28) & neutral & smooth & ~thin
    # the ground next to a building is lit a little by it (warmer, a touch brighter): still ground where it is flat
    lit = (k > 0.93) & (k < 1.06) & (blue > -0.09) & (blue < 0.06) & (mid < 0.035) & (local_std(k, 5) < 0.015) & ~thin
    # the edge of a cast shadow can be sharp (not smooth): crossed where it is the sky-blue mix of background and shadow (a shaded wall,
    # lit by the warm ground, is not blue). Not in the Airbase and Naval Yard pictures: their blue-grey hangars and sheds are the
    # colour of a shadow (their shadows are soft and need no bridge)
    bridge = (blue >= 0.03) & (blue < 0.2) & (mid < 0.025) & (k > 0.45) & (k < 0.99) & ~thin
    if not name.startswith(BRIDGE): bridge[:] = False
    ground = flood_from_border(bgish | shadowish | lit | bridge)
    # pockets: closed areas of the background colour (an empty courtyard): background when large, flat and close to it
    lab, n = ndi.label((bgish | shadowish | lit) & ~ground)
    pocket = np.zeros_like(ground)
    if n:
        idx = np.arange(1, n + 1)
        area = ndi.sum(np.ones_like(d), lab, idx); dm = ndi.labeled_comprehension(d, lab, idx, np.median, np.float32, 0); sd = ndi.labeled_comprehension(local_std(a @ lw, 3), lab, idx, np.median, np.float32, 0)
        frac_bg = ndi.mean((bgish | lit).astype(np.float32), lab, idx)
        fs = ndi.mean(shadowish.astype(np.float32), lab, idx)
        # the background colour, or the background partly in the shadow of the walls round it (a courtyard of a trench line); a building's
        # own shaded wall is shadow-coloured all over (no background colour in it) and stays
        good = idx[(area >= 40) & (sd < 3.0) & (((dm < 6) & (frac_bg > 0.85)) | ((frac_bg >= 0.25) & (fs >= 0.4) & (dm < 40)))]
        if os.environ.get('CUTDBG'):
            for i in np.argsort(-area)[:10]: print(name, int(area[i]), 'dm', round(float(dm[i]), 1), 'sd', round(float(sd[i]), 2), 'fbg', round(float(frac_bg[i]), 2), 'fs', round(float(fs[i]), 2), idx[i] in good)
        pocket = np.isin(lab, good)
    ground |= pocket
    obj = ~ground
    # ragged low-contrast fringes (where a building fades into its lit ground): opened away; thin lines are kept
    weak = obj & (d < 14) & ~thin
    obj &= ~(weak & ~ndi.binary_opening(obj, np.ones((3, 3)), iterations=2))
    # drop specks of building far from the rest (render noise); keep thin lines (poles) of some length
    lab, n = ndi.label(obj, np.ones((3, 3)))
    if n:
        area = ndi.sum(np.ones_like(d), lab, np.arange(1, n + 1))
        obj = np.isin(lab, np.arange(1, n + 1)[area >= 24])
    ground = ~obj
    # ground colour behind each pixel: the background times the shadow ratio of the nearest clean ground pixel
    far = ground & ~ndi.binary_dilation(obj, iterations=2)
    if not far.any(): far = ground
    _, (iy, ix) = ndi.distance_transform_edt(~far, return_indices=True)
    kg = np.where(far, k, k[iy, ix]); kg = np.clip(kg, 0.2, 1.05)
    B = bg*kg[..., None]
    # solid building colour nearest to each edge pixel
    core = ndi.binary_erosion(obj, iterations=2)
    if not core.any(): core = obj
    _, (cy, cx) = ndi.distance_transform_edt(~core, return_indices=True)
    Fg = a[cy, cx]
    edge = obj & ndi.binary_dilation(ground, iterations=1)
    fb = Fg - B; den = (fb*fb).sum(-1)
    al = np.where(den > 120, ((a - B)*fb).sum(-1)/np.maximum(den, 1), 1.0)
    al = np.clip(al, 0, 1)
    al = np.where(thin & edge, np.maximum(al, 0.85), al)   # a thin line is all edge: keep it solid
    alpha = np.where(obj, np.where(edge, al, 1.0), 0.0).astype(np.float32)
    # the ground pixels just outside the edge that still carry some building colour (anti-aliasing): a little alpha too
    out1 = ground & ndi.binary_dilation(obj, iterations=1)
    al1 = np.clip(((a - B)*fb).sum(-1)/np.maximum(den, 1), 0, 0.6)
    alpha = np.where(out1 & (den > 120) & (d > 4), al1, alpha)
    C = B + (a - B)/np.maximum(alpha, 1e-3)[..., None]
    C = np.where((alpha > 0.02)[..., None], np.clip(C, 0, 255), a)
    # cast shadow: a dark translucent layer where the ground is darker than the background
    s = np.clip((0.985 - k)*1.05, 0, SHADOW_MAX)*ground
    s = ndi.gaussian_filter(s, 0.8)*ground
    s = np.where(s < 0.035, 0, s)
    A = alpha + s*(1 - alpha)
    rgb = (C*alpha[..., None] + SHADOW_RGB*(s*(1 - alpha))[..., None])/np.maximum(A, 1e-4)[..., None]
    return np.dstack([np.clip(rgb, 0, 255), np.clip(A, 0, 1)*255]).astype(np.float32), obj, thin, k

def poles(thin, ground, k):
    """the HQ flagpoles: long vertical thin dark runs standing on open ground; returns [(x, top y, length)] (source px)"""
    t = ndi.binary_closing(thin & (k < 0.92), np.ones((5, 1)))
    h, w = t.shape
    gl = np.zeros_like(ground); gr = np.zeros_like(ground); gl[:, 5:] = ground[:, :-5]; gr[:, :-5] = ground[:, 5:]
    runs = []
    for x in range(w):
        col = t[:, x]; y = 0
        while y < h:
            if not col[y]: y += 1; continue
            y0 = y
            while y < h and col[y]: y += 1
            if y - y0 >= 40 and (gl[y0:y, x] | gr[y0:y, x]).mean() > 0.8: runs.append((x, y0, y - y0))
    runs.sort(); out = []
    for x, y0, n in runs:
        if out and x - out[-1][3] <= 3 and abs(y0 - out[-1][1]) < 30:
            o = out[-1]; o[0].append(x); o[1] = min(o[1], y0); o[2] = max(o[2], n); o[3] = x
        else: out.append([[x], y0, n, x])
    out = [(float(np.mean(o[0])), float(o[1]), o[2]) for o in out]
    if out:   # the flagpoles are all one length: a building edge caught as a line is not
        med = float(np.median([o[2] for o in out])); out = [o for o in out if abs(o[2] - med) <= 0.15*med]
    return out

def main():
    os.makedirs(OUT, exist_ok=True)
    files = sorted(glob.glob(os.path.join(SRC, 'ba-*.png')))
    if ONLY: files = [f for f in files if os.path.basename(f)[:-4] in ONLY]
    meta_fn = next((a[7:] for a in sys.argv if a.startswith('--meta=')), os.path.join(OUT, 'bn-meta.json'))
    meta = json.load(open(meta_fn)) if os.path.exists(meta_fn) else {}
    for f in files:
        base = os.path.basename(f)[:-4][3:]   # e.g. airbase-3, hq-western
        if base.startswith('hq-'): key, lvl, out_name = 'hq', base[3:], 'bn-' + base
        else:
            nm, lv = base.rsplit('-', 1); key, lvl = KEYS[nm], int(lv); out_name = f'bn-{key}-{lvl}'
        a = np.asarray(Image.open(f).convert('RGB')).astype(np.float32)
        rgba, obj, thin, k = cut(a, base)
        if base in SLAB: rgba, obj = unslab(rgba, obj, SLAB[base])
        al = rgba[..., 3]
        ys, xs = np.nonzero(al > 8)
        y0, y1, x0, x1 = max(0, ys.min() - 2), min(al.shape[0], ys.max() + 3), max(0, xs.min() - 2), min(al.shape[1], xs.max() + 3)
        crop = rgba[y0:y1, x0:x1]
        sc = MAP_PX/max(crop.shape[0], crop.shape[1])
        W, H = max(1, round(crop.shape[1]*sc)), max(1, round(crop.shape[0]*sc))
        im = Image.fromarray(crop.round().astype(np.uint8), 'RGBA').convert('RGBa').resize((W, H), Image.LANCZOS).convert('RGBA')
        im.save(os.path.join(OUT, out_name + '.webp'), 'WEBP', quality=88, method=6, alpha_quality=100)
        # ground anchor: the footprint centre. The building's pixels (no shadow): x at their centroid; y halfway between their
        # centroid and the mean of each column's lowest pixel (the front edge), which lands on the ground under a tall block
        # and near the centroid of a flat base
        oy, ox = np.nonzero(obj[y0:y1, x0:x1])
        cxm, cym = ox.mean(), oy.mean()
        low = ndi.maximum(oy, labels=ox + 1, index=np.unique(ox) + 1)
        ay = 0.5*cym + 0.5*float(np.mean(low))
        fx, fy = cxm/crop.shape[1], ay/crop.shape[0]
        dx, dy = ANCHOR_FIX.get(out_name, (0, 0))
        e = {'w':W, 'h':H, 'ax':round(float(fx + dx), 4), 'ay':round(float(fy + dy), 4)}
        oh = (obj[y0:y1, x0:x1].any(1).nonzero()[0]); e['top'] = round(float(oh.min())/crop.shape[0], 4)   # top of the building (no shadow)
        if key == 'hq':
            tops = poles(thin, ~obj, k)
            e['flags'] = [[round((x - x0)/crop.shape[1], 4), round((y - y0)/crop.shape[0], 4), round(hh/crop.shape[0], 4)] for x, y, hh in tops]
        if key == 'yard': e['piers'] = 'right'   # the renders' piers run to the lower right
        meta[out_name] = e
        print(out_name, W, H, e)
    json.dump(meta, open(meta_fn, 'w'), indent=None, separators=(',', ':'), sort_keys=True)
    if '--embed' in sys.argv:   # the table into index.html (BNMETA), so the map knows each picture's anchor before it loads
        import re
        page = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'index.html'); src = open(page, encoding='utf8').read()
        line = 'const BNMETA = ' + json.dumps(meta, separators=(',', ':'), sort_keys=True) + ';'
        src, n = re.subn(r'^const BNMETA = \{.*\};$', lambda m: line, src, count=1, flags=re.M)
        if n != 1: sys.exit('BNMETA line not found in index.html')
        open(page, 'w', encoding='utf8').write(src); print('BNMETA embedded:', len(meta), 'pictures')

if __name__ == '__main__':
    main()
