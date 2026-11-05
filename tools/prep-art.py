"""Prepares the game art (supplied .webp files) for the web.
- units, building markers, emblems: dark background removed (flood fill from the border through background-like
  pixels against a fitted background gradient; enclosed parts stay opaque; soft anti-aliased edges), trimmed, 256 px
- explosion, smoke: luminance-keyed alpha against the dark background (colours un-premultiplied), 256 px
- crater: radial fade into a decal, 256 px
- earth day/night/clouds: stretched from 21:9 to 2:1 (4096x2048 day/night, 2048x1024 clouds as alpha)
- menu background 1920 wide, panel texture 1024 wide
usage: python3 -I tools/prep-art.py <source dir> <out dir: assets/art>
"""
import sys, os, numpy as np
from PIL import Image, ImageFilter

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
WORK = 768   # processing resolution

def load(name, size=WORK):
    im = Image.open(os.path.join(SRC, name)).convert('RGB')
    if size: im = im.resize((size, size), Image.LANCZOS) if im.width == im.height else im
    return np.asarray(im).astype(np.float32)

def fit_bg(a, mask):
    """quadratic surface per channel fitted to the pixels in mask"""
    h, w, _ = a.shape; ys, xs = np.nonzero(mask)
    if len(xs) > 40000: k = np.linspace(0, len(xs) - 1, 40000).astype(int); ys, xs = ys[k], xs[k]
    X = np.stack([np.ones_like(xs), xs/w, ys/h, (xs/w)**2, (ys/h)**2, xs*ys/(w*h)], 1).astype(np.float64)
    gy, gx = np.mgrid[0:h, 0:w]; G = np.stack([np.ones_like(gx), gx/w, gy/h, (gx/w)**2, (gy/h)**2, gx*gy/(w*h)], -1).reshape(-1, 6)
    out = np.zeros_like(a)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(X, a[ys, xs, c].astype(np.float64), rcond=None); out[..., c] = (G @ coef).reshape(h, w)
    return out

def dilate(m):
    o = m.copy(); o[1:] |= m[:-1]; o[:-1] |= m[1:]; o[:, 1:] |= m[:, :-1]; o[:, :-1] |= m[:, 1:]; return o

def flood(bglike, seed=None):
    if seed is None: seed = np.zeros_like(bglike); seed[0, :] = seed[-1, :] = True; seed[:, 0] = seed[:, -1] = True
    r = seed & bglike
    for _ in range(4000):
        n = dilate(r) & bglike
        if n.sum() == r.sum(): break
        r = n
    return r

def cutout(a, t_hard=14.0, t_soft=(8.0, 30.0), border=10, dark=0.45, shadow=0.3):
    h, w, _ = a.shape
    edge = np.zeros((h, w), bool); edge[:border] = edge[-border:] = True; edge[:, :border] = edge[:, -border:] = True
    bg = fit_bg(a, edge)
    def dist(bg):
        df = a - bg; return np.sqrt((np.clip(df, 0, None)**2).sum(-1)) + dark*np.sqrt((np.clip(df, None, 0)**2).sum(-1))
    for _ in range(2):   # refit on everything the flood reaches (darker-than-background pixels count as background)
        reach = flood(dist(bg) < t_hard)
        bg = fit_bg(a, reach)
    d = dist(bg)
    reach = flood(d < t_hard)
    lo, hi = t_soft
    soft = np.clip((d - lo)/(hi - lo), 0, 1)
    alpha = np.where(reach, soft*0.0, 1.0)
    # anti-aliased rim: pixels within 2 px of the object that the flood reached get their soft value
    near = dilate(dilate(~reach))
    alpha = np.where(reach & near, soft, alpha)
    al = Image.fromarray((alpha*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    alpha = np.asarray(al).astype(np.float32)/255
    alpha = np.where(reach & ~near, 0, alpha)
    if shadow:   # soft drop shadow where the background is darker than its fit (only close to the object)
        sh = np.clip(np.sqrt((np.clip(bg - a, 0, None)**2).sum(-1))/60, 0, shadow)
        ring = ~reach
        for _ in range(10): ring = dilate(ring)
        alpha = np.maximum(alpha, np.where(reach & ring, sh, 0))
    # remove the background tint from semi-transparent rim pixels
    aa = np.clip(alpha[..., None], 1e-3, 1)
    col = np.clip((a - bg*(1 - aa))/aa, 0, 255)
    col = np.where(alpha[..., None] > 0.98, a, col)
    return np.dstack([col, alpha*255]).astype(np.uint8)

def keep_main(rgba):
    """drop specks: keep only what connects to the most solid region near the centre"""
    al = rgba[..., 3].astype(np.float32)/255; h, w = al.shape; m = al > 0.3
    cy, cx = h//2, w//2; win = m[cy - h//6:cy + h//6, cx - w//6:cx + w//6]
    if not win.any(): return rgba
    seed = np.zeros_like(m); seed[cy - h//6:cy + h//6, cx - w//6:cx + w//6] = win
    main = flood(m, seed)
    for _ in range(4): main = dilate(main)
    out = rgba.copy(); out[..., 3] = np.where(main, out[..., 3], 0); return out

def chroma_cut(a, border=10):
    """soldiers on neutral ground: object = coloured or bright pixels, closed, then soft edges"""
    mx, mn = a.max(-1), a.min(-1); lum = a.mean(-1); chroma = mx - mn
    m = (chroma > 9) | (lum > 82)
    for _ in range(7): m = dilate(m)
    inv = ~m
    for _ in range(7): inv = dilate(inv)
    m = ~inv
    reach = flood(~m)
    al = Image.fromarray(((~reach)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    alpha = np.asarray(al).astype(np.float32)
    return np.dstack([a, alpha]).astype(np.uint8)

def circle_cut(a):
    """round tokens: the outer edge of the frame is found from the radial brightness profile"""
    h, w, _ = a.shape; gy, gx = np.mgrid[0:h, 0:w]; lum = a.mean(-1)
    # centre = brightness-weighted centroid of clearly-lit pixels
    m = lum > np.percentile(lum, 55); cy, cx = gy[m].mean(), gx[m].mean()
    r = np.hypot(gx - cx, gy - cy); bins = np.arange(0, int(min(h, w)/2*1.05))
    prof = np.array([lum[(r >= b) & (r < b + 1)].mean() if ((r >= b) & (r < b + 1)).any() else 0 for b in bins])
    bgl = np.median(lum[r > min(h, w)*0.49]) if (r > min(h, w)*0.49).any() else prof[-1]
    lit = np.nonzero(prof > bgl + 18)[0]; r0 = lit.max() if len(lit) else min(h, w)*0.45
    alpha = np.clip((r0 - r)/2.0 + 0.5, 0, 1)
    return np.dstack([a, alpha*255]).astype(np.uint8)

def lumkey(a, gamma=1.0, gain=1.0):
    h, w, _ = a.shape; edge = np.zeros((h, w), bool); edge[:12] = edge[-12:] = True; edge[:, :12] = edge[:, -12:] = True
    lum = a.mean(-1); dk = a[lum <= np.percentile(lum, 4)].mean(0); bg = np.broadcast_to(dk, a.shape).copy(); d = np.clip(a - bg, 0, None).max(-1)   # background = darkest colour (smoke reaches the edges)
    alpha = np.clip((d/(255 - bg.max(-1).clip(0, 200)))**gamma*gain, 0, 1)
    gy, gx = np.mgrid[0:h, 0:w]; r = np.hypot(gx - w/2, gy - h/2)/(w/2); alpha *= np.clip((1.0 - r)/0.12, 0, 1)
    aa = np.clip(alpha[..., None], 1e-3, 1); col = np.clip((a - bg*(1 - aa))/aa, 0, 255)
    return np.dstack([col, alpha*255]).astype(np.uint8)

def radial(a, inner=0.62, outer=0.97):
    h, w, _ = a.shape; gy, gx = np.mgrid[0:h, 0:w]; r = np.hypot(gx - w/2, gy - h/2)/(w/2)
    alpha = np.clip((outer - r)/(outer - inner), 0, 1)**1.4
    return np.dstack([a, alpha*255]).astype(np.uint8)

def save_rgba(arr, name, size=256, trim=True, q=84):
    if trim: arr = keep_main(arr)
    im = Image.fromarray(arr, 'RGBA')
    if trim:
        bb = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
        if bb:
            x0, y0, x1, y1 = bb; pad = int(max(x1 - x0, y1 - y0)*0.03); im = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))
    s = size/max(im.width, im.height); im = im.resize((max(1, round(im.width*s)), max(1, round(im.height*s))), Image.LANCZOS)
    sq = Image.new('RGBA', (size, size), (0, 0, 0, 0)); sq.paste(im, ((size - im.width)//2, (size - im.height)//2)); sq.save(os.path.join(OUT, name), 'WEBP', quality=q, method=6)

UNITS = ['infantry', 'special-forces', 'tank', 'light-armor', 'artillery', 'rocket-artillery', 'anti-air', 'missile-launcher', 'supply-truck',
         'jet', 'bomber', 'attack-heli', 'transport-heli', 'drone', 'corvette', 'destroyer', 'submarine', 'carrier']
# V3 air (promised art; the game draws code stand-ins until these exist): skipped quietly when the source file is not there yet
UNITS += ['heavy-bomber', 'naval-patrol', 'awacs', 'air-superiority', 'swarm-drone', 'strike-drone', 'anti-drone', 'cargo-ship', 'uav-recon', 'uav-armed']
BUILD = {'city': ['city', 'city-2', 'city-3', 'city-4', 'city-5'], 'airfield': ['airfield', 'airfield-2', 'airfield-3', 'airfield-4', 'airfield-5'],
         'missile-silo': ['missile-silo', 'missile-silo-2', 'missile-silo-3', 'missile-silo-4', 'missile-silo-5'],
         'military-base': ['military-base-%d' % i for i in range(1, 6)], 'naval-port': ['naval-port-%d' % i for i in range(1, 6)]}
EMB = ['emblem-bear', 'emblem-eagle', 'emblem-lion', 'emblem-star']
only = set(sys.argv[3:])
def want(n): return not only or n in only

ROT = {'corvette': -90}   # every unit faces up (bow / nose at the top)
for u in UNITS:
    if want(u) and not os.path.exists(os.path.join(SRC, u + '.webp')):
        print('skip (no source yet):', u); continue
    if want(u) and u in ROT: save_rgba(np.asarray(Image.fromarray(cutout(load(u + '.webp')), 'RGBA').rotate(ROT[u], expand=True)), 'u-' + u + '.webp', 256); continue
    if want(u): save_rgba(chroma_cut(load(u + '.webp')) if u in ('infantry', 'special-forces') else cutout(load(u + '.webp')), 'u-' + u + '.webp', 256)
for k, files in BUILD.items():
    for lvl, f in enumerate(files, 1):
        if want(f) and k in ('city', 'airfield', 'missile-silo'): save_rgba(circle_cut(load(f + '.webp')), 'b-%s-%d.webp' % (k, lvl), 256); continue
        if want(f): save_rgba(cutout(load(f + '.webp'), t_hard=12.0, t_soft=(7.0, 26.0), shadow=0), 'b-%s-%d.webp' % (k, lvl), 256)
for e in EMB:
    if want(e): save_rgba(cutout(load(e + '.webp'), t_hard=30.0 if e == 'emblem-eagle' else 22.0, t_soft=(14.0, 44.0), shadow=0), e + '.webp', 256)
if want('explosion'): save_rgba(lumkey(load('explosion.webp'), 0.85, 1.25), 'fx-explosion.webp', 256, trim=False)
if want('smoke'): save_rgba(lumkey(load('smoke.webp'), 1.1, 1.15), 'fx-smoke.webp', 256, trim=False)
if want('crater'): save_rgba(radial(load('crater.webp')), 'fx-crater.webp', 256, trim=False)
# earth: 21:9 stretched to 2:1
if want('earth'):
    for n, size in [('earth-day', (4096, 2048)), ('earth-night', (4096, 2048))]:
        Image.open(os.path.join(SRC, n + '.webp')).convert('RGB').resize(size, Image.LANCZOS).save(os.path.join(OUT, n + '.webp'), 'WEBP', quality=86, method=6)
    c = Image.open(os.path.join(SRC, 'earth-clouds.webp')).convert('L').resize((2048, 1024), Image.LANCZOS)
    c.save(os.path.join(OUT, 'earth-clouds.webp'), 'WEBP', quality=80, method=6)   # brightness = cloud cover (used as alpha)
if want('menu'):
    m = Image.open(os.path.join(SRC, 'menu-background.webp')).convert('RGB'); m.resize((1920, round(1920*m.height/m.width)), Image.LANCZOS).save(os.path.join(OUT, 'menu-background.webp'), 'WEBP', quality=80, method=6)
    t = Image.open(os.path.join(SRC, 'panel-texture.webp')).convert('RGB'); t.resize((1024, round(1024*t.height/t.width)), Image.LANCZOS).save(os.path.join(OUT, 'panel-texture.webp'), 'WEBP', quality=78, method=6)
# tell the game which promised V3 pictures now exist (it draws code stand-ins for the rest and never requests a missing file)
import re
V3 = ['u-' + u for u in ['heavy-bomber', 'naval-patrol', 'awacs', 'air-superiority', 'swarm-drone', 'strike-drone', 'anti-drone', 'cargo-ship', 'uav-recon', 'uav-armed']]
have = [n for n in V3 if os.path.exists(os.path.join(OUT, n + '.webp'))]
idx = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(OUT))), 'index.html')
if os.path.exists(idx):
    src = open(idx, encoding='utf-8').read()
    new = re.sub(r"const ART_SUPPLIED = \[[^\]]*\];", 'const ART_SUPPLIED = [' + ', '.join("'%s'" % n for n in have) + '];', src, count=1)
    if new != src: open(idx, 'w', encoding='utf-8').write(new); print('index.html: ART_SUPPLIED =', have)
print('ok')
