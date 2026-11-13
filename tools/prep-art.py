"""Prepares the game art (supplied .webp files) for the web.
- units: dark background removed (flood fill from the border through background-like pixels against a fitted background
  gradient; enclosed parts stay opaque; soft anti-aliased edges; the soldier groups are cut against their textured ground
  instead, see soldier_parts), found at 768 px and applied to a sharper 1536 px copy, facing up, trimmed: u-<name>.webp 512 px
  (sharp up to the closest zoom), plus a tight, levels-lifted, unsharp-masked icon for small sizes: i-<name>.webp 128 px.
  The two soldier groups are cut with the IS-Net general-use segmentation model when it is present (onnxruntime; the rembg model file
  isnet-general-use.onnx in ~/.u2net/ or at $ISNET), see soldier_net; without it they fall back to soldier_parts
- the owner's Higgsfield pictures (white-background JPEGs of units, dark-matte aerial buildings; assets/art-src/u-<name>.jpg, b-<name>-<n>.jpeg):
  python3 -I tools/prep-art.py assets/art-src assets/art hf   (see the HF section at the end of this file)
- building markers, emblems: the same background removal, trimmed, 256 px
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
UNIT, ICON, HI = 512, 128, 1536   # unit picture and icon sizes; colour resolution the unit pictures are made from

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

def runfill(r, m):
    """every horizontal run of m that holds a pixel of r becomes r"""
    h, w = m.shape; f = m.ravel(); prev = np.zeros_like(f); prev[1:] = f[:-1]; prev[::w] = False
    ids = np.cumsum(f & ~prev)*f; hit = np.zeros(int(ids.max()) + 1, bool); hit[ids[r.ravel() & f]] = True; hit[0] = False
    return hit[ids].reshape(h, w)

def flood(bglike, seed=None):
    """the parts of bglike 4-connected to the seed (default: the border), by alternating row and column run fills"""
    if seed is None: seed = np.zeros_like(bglike); seed[0, :] = seed[-1, :] = True; seed[:, 0] = seed[:, -1] = True
    r = seed & bglike; n0 = -1; mt = np.ascontiguousarray(bglike.T)
    while True:
        r = runfill(r, bglike); r = np.ascontiguousarray(runfill(np.ascontiguousarray(r.T), mt).T); n = int(r.sum())
        if n == n0: return r
        n0 = n

def label(m):
    """connected parts (4-neighbour) of a mask as a label image (0 outside): row and column run minima until stable"""
    h, w = m.shape; L = np.where(m, np.arange(1, h*w + 1, dtype=np.int64).reshape(h, w), 0)
    def runmin(L, m):
        hh, ww = m.shape; f = m.ravel(); prev = np.zeros_like(f); prev[1:] = f[:-1]; prev[::ww] = False
        Lc = L.ravel()[f]; idx = np.flatnonzero((f & ~prev)[f]); out = np.zeros(hh*ww, np.int64)
        if len(idx): out[f] = np.repeat(np.minimum.reduceat(Lc, idx), np.diff(np.append(idx, len(Lc))))
        return out.reshape(hh, ww)
    mt = np.ascontiguousarray(m.T)
    while True:
        L2 = runmin(L, m); L2 = np.ascontiguousarray(runmin(np.ascontiguousarray(L2.T), mt).T)
        if (L2 == L).all(): return L
        L = L2

def drop_small(m, min_area):
    """m without its connected parts smaller than min_area pixels"""
    u, inv, cnt = np.unique(label(m).ravel(), return_inverse=True, return_counts=True)
    return ((cnt >= min_area) & (u > 0))[inv].reshape(m.shape)

def erode(m, n=1):
    inv = ~m
    for _ in range(n): inv = dilate(inv)
    return ~inv

def gblur(x, sigma):
    """Gaussian-like blur of a float image (three box passes), edges clamped"""
    r = max(1, int(round(sigma*0.9)))
    for _ in range(3):
        for ax in (0, 1):
            pad = [(r + 1, r) if k == ax else (0, 0) for k in range(x.ndim)]
            c = np.cumsum(np.pad(x, pad, mode='edge'), axis=ax, dtype=np.float64); n = x.shape[ax]
            x = ((np.take(c, np.arange(2*r + 1, 2*r + 1 + n), axis=ax) - np.take(c, np.arange(n), axis=ax))/(2*r + 1)).astype(np.float32)
    return x

def cutout_parts(a, t_hard=14.0, t_soft=(8.0, 30.0), border=10, dark=0.45, shadow=0.3):
    """alpha (with the soft drop shadow), the object's own alpha (no shadow) and the fitted background"""
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
    alpha = np.where(reach & ~near, 0, alpha); obj = alpha
    if shadow:   # soft drop shadow where the background is darker than its fit (only close to the object)
        sh = np.clip(np.sqrt((np.clip(bg - a, 0, None)**2).sum(-1))/60, 0, shadow)
        ring = ~reach
        for _ in range(10): ring = dilate(ring)
        alpha = np.maximum(alpha, np.where(reach & ring, sh, 0))
    return alpha, obj, bg

def detint(a, alpha, bg):
    """RGBA: colour with the background tint removed from semi-transparent (rim) pixels"""
    aa = np.clip(alpha[..., None], 1e-3, 1)
    col = np.clip((a - bg*(1 - aa))/aa, 0, 255)
    col = np.where(alpha[..., None] > 0.98, a, col)
    return np.dstack([col, alpha*255]).astype(np.uint8)

def cutout(a, *args, **kw):
    alpha, _, bg = cutout_parts(a, *args, **kw); return detint(a, alpha, bg)

def main_mask(al):
    """what connects to the most solid region near the centre (alpha in 0..1), grown by 4 px"""
    h, w = al.shape; m = al > 0.3
    cy, cx = h//2, w//2; win = m[cy - h//6:cy + h//6, cx - w//6:cx + w//6]
    if not win.any(): return np.ones_like(m)
    seed = np.zeros_like(m); seed[cy - h//6:cy + h//6, cx - w//6:cx + w//6] = win
    main = flood(m, seed)
    for _ in range(4): main = dilate(main)
    return main

def keep_main(rgba):
    """drop specks: keep only what connects to the most solid region near the centre"""
    main = main_mask(rgba[..., 3].astype(np.float32)/255)
    out = rgba.copy(); out[..., 3] = np.where(main, out[..., 3], 0); return out

def soldier_parts(a):
    """soldier groups on dark, grainy, spot-lit ground (at WORK px): alpha (with a soft drop shadow), alpha without it, local ground colour.
    The ground's own brightness and colourfulness are estimated locally (blurred, from what is neither soldier nor shadow), so the
    lighting falloff and the grain do not count. Soldiers = clearly more colourful or brighter than the ground there (found on a blurred
    copy so the grain averages out, then fine parts such as straps and rifle furniture that touch them), closed, holes without open
    ground filled, specks dropped. Dark things next to them (rifles, boots, the shadows they cast) are luminance-keyed: black with partial
    alpha, as dark as they are against the ground, so nothing of the ground itself is left in the picture."""
    h, w, _ = a.shape
    def feats(sig):
        s = np.dstack([gblur(a[..., c], sig) for c in range(3)]); return s.mean(-1), s.max(-1) - s.min(-1)
    lum, chroma = feats(2.5); lum1, chroma1 = feats(0.8)
    obj = (chroma > 12) | (lum > 95)
    for _ in range(3):
        wgt = erode(~obj, 3).astype(np.float32); W = np.maximum(gblur(wgt, 24), 1e-3)
        Lbg = gblur(lum*wgt, 24)/W; Cbg = gblur(chroma*wgt, 24)/W
        obj = (chroma > Cbg + 5) | (lum > Lbg + 12) | (lum < Lbg - 16)
    obj = drop_small((chroma > Cbg + 5) | (lum > Lbg + 12), 80)
    obj = flood(obj | (chroma1 > Cbg + 7) | (lum1 > Lbg + 20), obj)
    c = erode(dilate(dilate(dilate(obj))), 3)
    border = np.zeros_like(c); border[0, :] = border[-1, :] = border[:, 0] = border[:, -1] = True
    m = drop_small(~flood(~c, erode(~c, 6) | border), h*w*0.002)   # ground = reached from the border or from any 13 px wide open patch
    m &= erode(m, 3) | (chroma1 > Cbg + 5) | (lum1 > Lbg + 10)   # the blurred test reaches a little past the edge: there only what is clearly soldier
    W = np.maximum(gblur((~m).astype(np.float32), 24), 1e-3); bgc = np.dstack([gblur(a[..., k]*~m, 24)/W for k in range(3)])
    al = np.asarray(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.9))).astype(np.float32)/255
    da = np.clip((1 - lum1/np.maximum(Lbg, 1) - 0.38)/(0.8 - 0.38), 0, 1)
    ring = m.copy()
    for _ in range(10): ring = dilate(ring)
    da = gblur(np.where(flood(da > 0.2, m & (da > 0.2)) & ring, da, 0).astype(np.float32), 1.0)   # only what joins the soldiers through clearly dark pixels
    obj = np.maximum(al, da)
    sh = np.roll(gblur(m.astype(np.float32), 5), (3, 3), (0, 1))*0.22   # soft drop shadow, light from the upper left like the vehicles'
    return np.maximum(obj, sh), obj, bgc

ISNET = os.environ.get('ISNET', os.path.expanduser('~/.u2net/isnet-general-use.onnx'))
_NET = []
def net_mask(name, size):
    """soft object mask (0..1) of a source picture from the IS-Net general-use segmentation model (onnxruntime), at size px"""
    if not _NET:
        import onnxruntime as ort; _NET.append(ort.InferenceSession(ISNET, providers=['CPUExecutionProvider']))
    s = _NET[0]; im = Image.open(os.path.join(SRC, name)).convert('RGB').resize((1024, 1024), Image.LANCZOS)
    x = (np.asarray(im, np.float32)/255 - 0.5).transpose(2, 0, 1)[None]
    o = s.run(None, {s.get_inputs()[0].name: x})[0][0, 0].astype(np.float32); o = (o - o.min())/max(float(o.max() - o.min()), 1e-6)
    return np.clip(np.asarray(Image.fromarray(o, 'F').resize((size, size), Image.BICUBIC)), 0, 1)

def soldier_net(u):
    """soldier groups, cut with the segmentation model (keeps every rifle and the dark parts of the uniforms whole, which the colour and
    brightness tests could not): RGBA at HI px with a soft drop shadow, and without it. The model's mask is tightened (smoothstep); where it
    is still partial over colourless ground no brighter than the ground around (shadowed ground between the soldiers), that is kept only as
    a faint dark shadow, so no grainy patch of the photo's ground is left in the picture."""
    A = load(u + '.webp', HI); m = net_mask(u + '.webp', HI); a = load(u + '.webp')
    al = sstep((m - 0.14)/0.62)
    mw = np.asarray(Image.fromarray(m, 'F').resize((WORK, WORK), Image.BILINEAR)); wgt = (mw < 0.04).astype(np.float32); W = np.maximum(gblur(wgt, 24), 1e-3)
    up = lambda x: np.asarray(Image.fromarray(np.ascontiguousarray(x, np.float32), 'F').resize((HI, HI), Image.BICUBIC))
    B = np.dstack([up(gblur(a[..., k]*wgt, 24)/W) for k in range(3)])
    s1 = np.dstack([gblur(A[..., k], 1.2) for k in range(3)]); lum, chroma = s1 @ LUMA, s1.max(-1) - s1.min(-1); Lbg, Cbg = B @ LUMA, B.max(-1) - B.min(-1)
    g = sstep((Cbg + 10 - chroma)/7)*sstep((Lbg + 24 - lum)/14)*(1 - sstep((al - 0.7)/0.25))   # shadowed ground the mask half took
    aa = np.clip(al[..., None], 1e-3, 1); col = np.where(al[..., None] > 0.98, A, np.clip((A - B*(1 - aa))/aa, 0, 255))
    col = col*(1 - g[..., None]) + np.minimum(A, 40)*0.35*g[..., None]; obj = al*(1 - 0.55*g)
    sh = np.roll(gblur((al > 0.5).astype(np.float32), 10), (6, 6), (0, 1))*0.22   # soft drop shadow, light from the upper left like the vehicles'
    full = np.maximum(obj, sh); colf = np.where((obj < 0.02)[..., None], 0, col)
    return [np.dstack([colf, full*255]).astype(np.uint8), np.dstack([col, obj*255]).astype(np.uint8)]

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

def trim_box(im):
    """the crop box save_rgba trims a picture to: its opaque part (alpha > 24) with 3 % padding"""
    bb = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    if not bb: return None
    x0, y0, x1, y1 = bb; pad = int(max(x1 - x0, y1 - y0)*0.03); return (max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad))

def save_rgba(arr, name, size=256, trim=True, q=84, clean=True):
    if trim and clean: arr = keep_main(arr)
    im = Image.fromarray(arr, 'RGBA')
    if trim:
        bb = trim_box(im)
        if bb: im = im.crop(bb)
    s = size/max(im.width, im.height); im = im.resize((max(1, round(im.width*s)), max(1, round(im.height*s))), Image.LANCZOS)
    sq = Image.new('RGBA', (size, size), (0, 0, 0, 0)); sq.paste(im, ((size - im.width)//2, (size - im.height)//2)); sq.save(os.path.join(OUT, name), 'WEBP', quality=q, method=6)

def smooth1(v, k=5):
    k = max(1, int(k)); return np.convolve(np.pad(v, k, mode='edge'), np.ones(2*k + 1)/(2*k + 1), mode='same')[k:-k]

def edge_noise(h, w, seed, cells=7, amp=1.0):
    """smooth random field in [-1, 1] (bicubic-upscaled lattice), for organic, non-circular patch edges"""
    rng = np.random.default_rng(seed); g = rng.uniform(0, 255, (cells, cells)).astype(np.uint8)
    f = np.asarray(Image.fromarray(g).resize((w, h), Image.BICUBIC)).astype(np.float32)/127.5 - 1
    g2 = rng.uniform(0, 255, (cells*3, cells*3)).astype(np.uint8); f2 = np.asarray(Image.fromarray(g2).resize((w, h), Image.BICUBIC)).astype(np.float32)/127.5 - 1
    return np.clip((f*0.7 + f2*0.3)*amp, -1, 1)

def sstep(t): t = np.clip(t, 0, 1); return t*t*(3 - 2*t)

def aerial_inner(a):
    """round tokens (city, airfield, silo): centre, outer radius r0 and the radius where the aerial view ends (inside the metal frame).
    The frame is grey metal: walking outward from the middle, the view ends where the ring-averaged colourfulness falls well below
    the aerial's own, or where a dark groove (ring-averaged brightness far below the aerial's) starts - whichever comes first."""
    h, w, _ = a.shape; gy, gx = np.mgrid[0:h, 0:w]; lum = a.mean(-1); sat = a.max(-1) - a.min(-1)
    # centre: the point around which the ring-averaged brightness profile is sharpest (the frame's concentric grooves line up)
    q = 4; sl = lum[::q, ::q]; sy, sx = np.mgrid[0:sl.shape[0], 0:sl.shape[1]]; best = (-1, w/2, h/2)
    def sharp(cx, cy):
        rr = np.hypot(sx - cx/q, sy - cy/q); ri = rr.astype(int); lim = int(min(h, w)/q*0.5); k = ri < lim
        c = np.maximum(np.bincount(ri[k], minlength=lim), 1); p = np.bincount(ri[k], sl[k], minlength=lim)/c
        return np.abs(np.diff(p[int(lim*0.5):])).sum()
    for step, rng_ in ((8, 64), (2, 8)):
        c0x, c0y = best[1], best[2]
        for dy in range(-rng_, rng_ + 1, step):
            for dx in range(-rng_, rng_ + 1, step):
                v = sharp(c0x + dx, c0y + dy)
                if v > best[0]: best = (v, c0x + dx, c0y + dy)
    cx, cy = best[1], best[2]
    r = np.hypot(gx - cx, gy - cy); ri = np.minimum(r.astype(int), int(min(h, w)*0.75)); n = ri.max() + 1
    cnt = np.maximum(np.bincount(ri.ravel(), minlength=n), 1)
    ml = np.bincount(ri.ravel(), lum.ravel(), minlength=n)/cnt; ms = np.bincount(ri.ravel(), sat.ravel(), minlength=n)/cnt
    bgl = np.median(lum[r > min(h, w)*0.49]); lit = np.nonzero(ml[:int(min(h, w)*0.53)] > bgl + 18)[0]; r0 = lit.max() if len(lit) else min(h, w)*0.45
    a0, a1 = int(r0*0.35), int(r0*0.6); sat_ref, lum_ref = np.median(ms[a0:a1]), np.median(ml[a0:a1])
    s_s, l_s = smooth1(ms, 2), ml
    rin = r0
    for b in range(int(r0*0.6), int(r0)):
        if s_s[b] < sat_ref*0.6 or l_s[b] < lum_ref*0.42: rin = b; break
    return cx, cy, r0, rin, ml

def aerial_patch(a, seed, keep=0.97, feather=0.5, wobble=0.09, fix_vignette=True, fine=0.0, sprawl=0.0, recolor=False):
    """frameless aerial view: circular crop just inside the frame, with a wide soft organic edge so it fades into the terrain like a
    satellite patch; the frame's inner shadow (darkening towards the rim) is lifted first.
    fine: extra high-frequency edge wobble; sprawl: patchy, thinning outskirts (a city's suburbs); recolor: a little desaturated and lifted,
    so a dense dark downtown does not read as a dark ball on the map"""
    h, w, _ = a.shape; cx, cy, r0, rin, ml = aerial_inner(a); rc = rin*keep
    gy, gx = np.mgrid[0:h, 0:w]; r = np.hypot(gx - cx, gy - cy)
    out = a.copy()
    if fix_vignette:   # brighten rings darker than the aerial's middle (the frame's inner shadow), up to 1.6x, only in the outer part
        ref = np.median(ml[int(rc*0.2):int(rc*0.55)]); prof = smooth1(ml[:int(rin) + 2], 3)
        gain = np.ones(len(prof)); o = np.arange(len(prof)) > rc*0.55; gain[o] = np.clip(ref/np.maximum(prof[o], 1), 1, 1.6)
        gm = gain[np.minimum(r.astype(int), len(gain) - 1)]; out = np.clip(out*gm[..., None], 0, 255)
    if recolor: l = out.mean(-1, keepdims=True); out = np.clip(255*((out*0.65 + l*0.35)/255)**0.85*1.04, 0, 255)
    nz = edge_noise(h, w, seed, cells=5 if sprawl else 7)
    if fine: nz = nz + fine/max(wobble, 1e-3)*edge_noise(h, w, seed + 1, cells=18)
    t = (rc*(1 + wobble*nz) - r)/(rc*feather)
    alpha = sstep(t)**(1.2 if sprawl else 1.15)
    if sprawl: alpha *= np.clip(1 - sprawl*np.clip(r/rc - 0.35, 0, 1)*(0.5 - 0.5*edge_noise(h, w, seed + 2, cells=10)), 0, 1)
    # crop square around the patch
    R = int(rc*(1 + wobble)) + 2; x0, y0 = max(0, int(cx - R)), max(0, int(cy - R)); x1, y1 = min(w, int(cx + R)), min(h, int(cy + R))
    return np.dstack([out, alpha*255])[y0:y1, x0:x1].astype(np.uint8), (rin/r0)

def side_profiles(a, band=(0.3, 0.7)):
    h, w, _ = a.shape; lum = a.mean(-1); b0, b1 = int(h*band[0]), int(h*band[1])
    return {'l': lum[b0:b1, :].mean(0), 'r': lum[b0:b1, ::-1].mean(0), 't': lum[:, b0:b1].mean(1), 'b': lum[::-1, b0:b1].mean(1)}

def compound_patch(a, seed, framed, own_outline, feather=0.2, wobble=0.3):
    """square compounds (military base, naval port): the compound's rectangle (from the background cut-out), moved in past a metal
    frame where there is one (the last dark groove in the outer band), with a soft feathered, slightly irregular rectangular edge"""
    h, w, _ = a.shape
    cut = cutout(a, t_hard=12.0, t_soft=(7.0, 26.0), shadow=0); al = cut[..., 3].astype(np.float32)/255
    rows, cols = (al > 0.5).mean(1), (al > 0.5).mean(0)
    def span(v): idx = np.nonzero(v > 0.45)[0]; return (idx[0], idx[-1]) if len(idx) else (0, len(v) - 1)
    (y0, y1), (x0, x1) = span(rows), span(cols)
    edges = {'l': x0, 'r': w - 1 - x1, 't': y0, 'b': h - 1 - y1}
    pr = side_profiles(a); lum = a.mean(-1); inner = np.median(lum[y0:y1, x0:x1])
    ins = {}
    for s, e in edges.items():
        v = pr[s]; e2 = e
        if framed:
            for i in range(e, min(len(v) - 1, e + int(0.075*w))):
                if v[i] < inner*0.45: e2 = i + 1
        ins[s] = e2 + int(0.012*w)
    X0, X1, Y0, Y1 = ins['l'], w - 1 - ins['r'], ins['t'], h - 1 - ins['b']
    gy, gx = np.mgrid[0:h, 0:w]; F = feather*max(X1 - X0, Y1 - Y0)
    nz = edge_noise(h, w, seed, cells=9)
    d = np.minimum.reduce([gx - X0, X1 - gx, gy - Y0, Y1 - gy]).astype(np.float32)   # distance to the rectangle's edge, inside > 0
    alpha = sstep(d/F + wobble*nz*0.5)**1.3
    if own_outline: alpha = np.minimum(alpha, np.asarray(Image.fromarray((np.clip(al*1.3, 0, 1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(w*0.012))).astype(np.float32)/255)   # open-ground compounds keep their own (softened) outline
    return np.dstack([a, alpha*255])[Y0:Y1 + 1, X0:X1 + 1].astype(np.uint8)

def save_patch(arr, name, size, q=86):
    """frameless patch: centred in a square, no trimming (the feather is meant to reach the edge)"""
    im = Image.fromarray(arr, 'RGBA'); s = size/max(im.width, im.height)
    im = im.resize((max(1, round(im.width*s)), max(1, round(im.height*s))), Image.LANCZOS)
    sq = Image.new('RGBA', (size, size), (0, 0, 0, 0)); sq.paste(im, ((size - im.width)//2, (size - im.height)//2))
    Image.fromarray(bleed(np.asarray(sq)), 'RGBA').save(os.path.join(OUT, name), 'WEBP', quality=q, method=6, exact=True)

def bleed(px, r=6):
    """transparent pixels keep a neighbour colour (no dark fringe when the image is scaled with bilinear filtering or sharpened)"""
    px = px.copy(); al = px[..., 3]
    if (al < 8).any():
        rgb = Image.fromarray(px[..., :3]); blur = np.asarray(rgb.filter(ImageFilter.GaussianBlur(r))).astype(np.float32)
        wgt = np.asarray(Image.fromarray(al).filter(ImageFilter.GaussianBlur(r))).astype(np.float32)[..., None]/255
        prem = np.asarray(Image.fromarray((px[..., :3]*(al[..., None]/255)).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32)
        fill = np.where(wgt > 0.01, prem/np.maximum(wgt, 0.01), blur)
        px[..., :3] = np.where(al[..., None] < 8, np.clip(fill, 0, 255), px[..., :3]).astype(np.uint8)
    return px

LUMA = np.array([0.299, 0.587, 0.114], np.float32)

def save_icon(arr, name, size=ICON, q=88, gamma=0.85, gain=1.3, sat=1.15, sharp=(1.0, 80, 1)):
    """icon for small sizes (24-32 px on a dark tile): cropped to the object (alpha > 25 %) with 4 % padding, levels stretched over the
    object's own brightness (1st..99.5th percentile -> 10..245, at most gain x), mid-tones lifted (gamma), a little more colour, then unsharp-masked
    after the downscale; alpha as cut"""
    im = Image.fromarray(arr, 'RGBA'); bb = im.getchannel('A').point(lambda v: 255 if v > 64 else 0).getbbox()
    if bb:
        x0, y0, x1, y1 = bb; pad = int(max(x1 - x0, y1 - y0)*0.04); im = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))
    px = np.asarray(im).astype(np.float32); rgb, al = px[..., :3], px[..., 3]
    l = rgb @ LUMA; sel = al > 150
    lo, hi = (np.percentile(l[sel], 1), np.percentile(l[sel], 99.5)) if sel.sum() > 50 else (0, 255)
    hi = max(hi, lo + 235/gain)   # at most gain x the original contrast (light grey aircraft stay grey, not white)
    rgb = np.clip((rgb - lo)/max(hi - lo, 1), 0, 1)**gamma
    l = (rgb @ LUMA)[..., None]; rgb = np.clip(l + (rgb - l)*sat, 0, 1)*235 + 10
    im = Image.fromarray(np.dstack([rgb, al]).astype(np.uint8), 'RGBA')
    s = size/max(im.width, im.height); im = im.resize((max(1, round(im.width*s)), max(1, round(im.height*s))), Image.LANCZOS)
    sq = Image.new('RGBA', (size, size), (0, 0, 0, 0)); sq.paste(im, ((size - im.width)//2, (size - im.height)//2))
    px = bleed(np.asarray(sq), 3)
    rgb = np.asarray(Image.fromarray(px[..., :3]).filter(ImageFilter.UnsharpMask(radius=sharp[0], percent=sharp[1], threshold=sharp[2])))
    Image.fromarray(np.dstack([rgb, px[..., 3]]), 'RGBA').save(os.path.join(OUT, name), 'WEBP', quality=q, method=6)

UNITS = ['special-forces', 'tank', 'light-armor', 'artillery', 'rocket-artillery', 'anti-air', 'missile-launcher', 'supply-truck',
         'jet', 'strike-fighter', 'attack-heli', 'transport-heli', 'drone', 'corvette', 'destroyer', 'submarine', 'carrier']
# V3 air (promised art; the game draws code stand-ins until these exist): skipped quietly when the source file is not there yet
# (the other V3 pictures, the infantry, and the Heavy and Stealth Bombers come from white-background files: HF section)
BUILD = {'city': ['city', 'city-2', 'city-3', 'city-4', 'city-5'], 'airfield': ['airfield', 'airfield-2', 'airfield-3', 'airfield-4', 'airfield-5'],
         'missile-silo': ['missile-silo', 'missile-silo-2', 'missile-silo-3', 'missile-silo-4', 'missile-silo-5'],
         'military-base': ['military-base-%d' % i for i in range(1, 6)], 'naval-port': ['naval-port-%d' % i for i in range(1, 6)]}
EMB = ['emblem-bear', 'emblem-eagle', 'emblem-lion', 'emblem-star']
only = set(sys.argv[3:])
def want(n): return not only or n in only

ROT = {'corvette': -90}   # every unit faces up (bow / nose at the top)
SOLDIERS = ('infantry', 'special-forces')
def unit_art(u):
    """unit picture (with its soft drop shadow) and icon source (object only), RGBA at HI px: the cut-out is found at WORK px, then its
    alpha and background are scaled up and applied to a sharper HI px copy of the original"""
    if u in SOLDIERS and os.path.exists(ISNET): out = soldier_net(u)
    else: out = None
    if out is not None:
        if u in ROT: out = [np.asarray(Image.fromarray(x, 'RGBA').rotate(ROT[u], expand=True)) for x in out]
        return out
    a = load(u + '.webp')
    if u in SOLDIERS: alpha, obj, bg = soldier_parts(a)   # fallback without the model   # their own clean-up keeps every soldier (they need not touch the middle)
    else:
        alpha, obj, bg = cutout_parts(a); keep = main_mask(alpha); alpha, obj = alpha*keep, obj*keep
    A = load(u + '.webp', HI)
    up = lambda x: np.asarray(Image.fromarray(np.ascontiguousarray(x, np.float32), 'F').resize((HI, HI), Image.BICUBIC))
    B = np.dstack([up(bg[..., c]) for c in range(3)])
    out = [detint(A, np.clip(up(x), 0, 1), B) for x in (alpha, obj)]
    if u in ROT: out = [np.asarray(Image.fromarray(x, 'RGBA').rotate(ROT[u], expand=True)) for x in out]
    return out
# soldier icons: a whole squad shrunk into a 20-40 px tile reads as a grey rosette, so their icon is three of its soldiers, cut out of the
# picture: every opaque pixel belongs to the soldier with the nearest seed point (helmet, body, rifle; given in the 512 px u-picture),
# and only the chosen soldiers are kept. 256 px, so the game can use the icon at every tile size
SQUAD_SEEDS = {
    'infantry': ({1:[(254, 78), (250, 130), (220, 45), (232, 178), (272, 176)], 2:[(146, 112), (165, 165), (75, 122), (195, 235), (185, 212)], 3:[(362, 120), (330, 165), (395, 90), (292, 200), (300, 215)],
                  4:[(95, 205), (130, 250), (40, 280), (160, 240)],
                  5:[(245, 220), (250, 260), (265, 320), (270, 195)], 6:[(410, 232), (360, 240), (470, 260)], 7:[(135, 310), (170, 340), (100, 410)],
                  8:[(245, 370), (245, 400), (290, 470)], 9:[(365, 330), (340, 350), (430, 405)]}, (5, 8, 9)),
    'special-forces': ({1:[(175, 135), (205, 185), (60, 135), (115, 180), (230, 215)], 2:[(318, 120), (285, 190), (250, 70), (250, 150), (260, 240)],
                        3:[(370, 230), (330, 255), (480, 248), (395, 270)], 4:[(140, 235), (185, 265), (30, 295), (120, 300), (215, 290)],
                        5:[(205, 330), (235, 330), (115, 445), (175, 395), (245, 400)], 6:[(330, 330), (300, 330), (425, 425), (330, 385), (275, 385)]}, (3, 5, 6))}
def squad_icon_src(full, obj, u):
    seeds, keep = SQUAD_SEEDS[u]; bb = trim_box(Image.fromarray(full, 'RGBA')); x0, y0, x1, y1 = bb; w, h = x1 - x0, y1 - y0; k = UNIT/max(w, h)
    ox, oy = (UNIT - round(w*k))//2, (UNIT - round(h*k))//2   # 512 px picture -> this frame (inverse of save_rgba's trim, scale and centring)
    pts = [(sid, x0 + (x - ox)/k, y0 + (y - oy)/k) for sid, v in seeds.items() for x, y in v]
    H, W = obj.shape[:2]; gy, gx = np.mgrid[0:H:4, 0:W:4]
    own = np.array([sid for sid, _, _ in pts])[np.stack([np.hypot(gx - x, gy - y) for _, x, y in pts]).argmin(0)]
    kq = np.isin(own, keep) & (obj[::4, ::4, 3] > 70); kq = drop_small(kq, kq.sum()*0.04)   # stray bits of the others' rifles and arms go
    m = np.asarray(Image.fromarray(dilate(kq).astype(np.uint8)*255).resize((W, H), Image.NEAREST)) > 127
    out = obj.copy(); out[..., 3] = np.where(m, out[..., 3], 0); return out
for u in UNITS:
    if not want(u): continue
    if not os.path.exists(os.path.join(SRC, u + '.webp')): print('skip (no source yet):', u); continue
    full, obj = unit_art(u)
    save_rgba(full, 'u-' + u + '.webp', UNIT, clean=False)
    if u in SQUAD_SEEDS: save_icon(squad_icon_src(full, obj, u), 'i-' + u + '.webp', 256, gamma=0.94, gain=1.12, sat=1.1)   # milder lift: tan camouflage stays tan
    else: save_icon(obj, 'i-' + u + '.webp')
    print('%-18s u %5.1f KB  i %4.1f KB' % (u, os.path.getsize(os.path.join(OUT, 'u-' + u + '.webp'))/1024, os.path.getsize(os.path.join(OUT, 'i-' + u + '.webp'))/1024))
# buildings: frameless aerial patches (round tokens cut inside their metal frame, compounds with a feathered rectangular edge)
BSIZE = {'city': 512, 'airfield': 320, 'missile-silo': 320, 'military-base': 320, 'naval-port': 320}
FRAMED = {'naval-port-2', 'naval-port-3', 'naval-port-4', 'naval-port-5'}
for k, files in BUILD.items():
    for lvl, f in enumerate(files, 1):
        if not want(f): continue
        seed = sum(map(ord, f))*7 + lvl
        if k in ('city', 'airfield', 'missile-silo'):
            arr, ratio = (aerial_patch(load(f + '.webp', 1024), seed, wobble=0.25, fine=0.1, feather=0.35, sprawl=1.0, recolor=True) if k == 'city' else
                          aerial_patch(load(f + '.webp', 1024), seed, keep=0.985 if k == 'missile-silo' else 0.97, fix_vignette=k != 'missile-silo'))
            print('%-16s inner/outer %.3f' % (f, ratio)); save_patch(arr, 'b-%s-%d.webp' % (k, lvl), BSIZE[k])
        else: save_patch(compound_patch(load(f + '.webp'), seed, f in FRAMED, k == 'military-base'), 'b-%s-%d.webp' % (k, lvl), BSIZE[k])
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
# ---------------------------------------------------------------------------------------------------------------------------------
# HF: the owner's Higgsfield pictures (assets/art-src/u-<name>.jpg: a unit on a plain WHITE background, nose up; b-<name>-<n>.jpeg: an aerial
# building patch). usage: python3 -I tools/prep-art.py assets/art-src assets/art hf   (or name them: hf-units, hf-buildings, or one picture, e.g. u-awacs)
# units -> u-<name>.webp 512 px (transparent, centred, nose up) + i-<name>.webp 128 px icon; buildings -> b-<name>.webp 320 px (feathered edge)
# ---------------------------------------------------------------------------------------------------------------------------------
HF_UNITS = ['heavy-bomber', 'stealth-bomber', 'infantry', 'naval-patrol', 'awacs', 'air-superiority', 'uav-recon', 'uav-armed', 'swarm-drone', 'strike-drone', 'anti-drone',
            'cargo-ship', 'cruise-missile', 'ballistic-missile', 'icbm']
HF_ICON_SKIP = {'icbm'}                   # stored for later (no icon needed yet)
HF_FLAME = {'cruise-missile': False, 'ballistic-missile': True, 'icbm': True}   # rocket exhaust fades into the white: matted as translucent glow
HF_BUILD = ['arms-industry-%d' % i for i in range(1, 6)] + ['recruiting-office-1'] + ['fortifications-%d' % i for i in range(1, 4)]
HF_WORK = 1536

def hf_find(stem):
    for e in ('.jpg', '.jpeg', '.png', '.webp'):
        f = os.path.join(SRC, stem + e)
        if os.path.exists(f): return f
    return None

def lnorm_blur(x, w, sigma):
    """normalised blur: the weighted local mean of x where w is 1 (colour bleeding outward from the solid part)"""
    W = np.maximum(gblur(w.astype(np.float32), sigma), 1e-4)
    return np.dstack([gblur(x[..., c]*w, sigma)/W for c in range(x.shape[-1])]), W

def white_cut(a, flame=False, hole=40, thr=238):
    """RGBA from a picture on a plain white background. The background is what the flood fill reaches from the border through pixels whose
    darkest channel is >= thr (JPEG noise included); enclosed white pockets (rotor gaps, between soldiers) larger than `hole` px go too. The rim
    is matted against white: alpha = (255 - min)/(255 - the object's own darkest channel nearby), with the first soft step cut away so no
    near-white JPEG ringing is left; the rim colour is taken from the solid pixels just inside (no white halo on a dark map). Exhaust flames
    (flame=True) are translucent glow: alpha from how far below white the pixel is, colour un-mixed from white."""
    h, w, _ = a.shape; mn = a.min(-1)
    bgl = mn >= thr
    reach = flood(bgl)
    pockets = bgl & ~reach
    if pockets.any(): reach |= drop_small(pockets, hole)
    obj = drop_small(~reach, 120)                      # the object: connected parts of at least 120 px (specks go)
    core = erode(obj, 3)
    # the object's own darkest channel near the rim (normalised blur over its solid part), so grey and dark objects both get a proper alpha ramp
    mo, _ = lnorm_blur(mn[..., None], core, 6); mo = mo[..., 0]
    band = obj | dilate(dilate(dilate(obj)))
    a0 = np.clip((255 - mn)/np.maximum(255 - np.minimum(mo, 235), 20), 0, 1)
    soft = np.clip((a0 - 0.12)/0.7, 0, 1)
    alpha = np.where(core, 1.0, np.where(band, np.where(obj, np.maximum(soft, 0.0) , soft*0.9), 0.0)).astype(np.float32)
    # keep the solid object solid right up to where the matting starts, then a thin soft rim
    alpha = np.where(obj & ~core, np.maximum(alpha, 0.55), alpha)
    inner, _ = lnorm_blur(a, core, 2.5)
    aa = np.clip(alpha[..., None], 1e-3, 1)
    un = np.clip((a - 255*(1 - aa))/aa, 0, 255)
    col = np.where((alpha < 0.999)[..., None], np.minimum(un, inner + 18), a)
    col = np.where((alpha < 0.999)[..., None], np.where(alpha[..., None] < 0.35, inner, col), col)
    if flame:   # the picture's exhaust fades into the white and cannot be matted cleanly: the body is cut off at the nozzle and a clean plume is drawn
        # (white-yellow core, orange edge, red tail, soft alpha) the width of the nozzle
        chroma = a.max(-1) - a.min(-1); warm = (a[..., 0] - a[..., 2] > 10) & (chroma > 14)
        lowr = warm[int(h*0.9):]; xs = np.nonzero(lowr.any(0))[0]; xl, xr = xs.min(), xs.max(); wn = xr - xl
        glow = (a[..., 0] > 225) & (a[..., 1] > 170) & (chroma > 14); y0 = np.nonzero(glow[:, xl:xr + 1].sum(1) > 0.4*wn)[0].min()   # the first row where the flame spans the nozzle
        rows = np.arange(h)[:, None]; cutz = (rows >= y0 - 2) & (np.arange(w)[None, :] >= xl - 0.35*wn) & (np.arange(w)[None, :] <= xr + 0.35*wn)
        alpha = np.where(cutz, 0, alpha)
        ys_ = np.nonzero((alpha > 0.5).any(1))[0]; Hb = ys_.max() - ys_.min(); L = int(max(0.2*Hb, 40)); cx = (xl + xr)/2
        t = np.clip((rows - (y0 - 6))/L, -1, 1.2); u = np.abs(np.arange(w)[None, :] - cx)/np.maximum(0.5*wn*(1 - 0.5*np.clip(t, 0, 1)), 1)
        pr = np.clip(1 - u**1.7, 0, 1)*np.clip(1 - np.clip(t, 0, 1.2)**1.3, 0, 1)*(t > -0.1)
        pr = gblur(pr.astype(np.float32), 3); k = np.clip(0.25*np.clip(t, 0, 1)*1.2 + 0.85*u, 0, 1)[..., None]   # 0 = core .. 1 = edge / tail
        c0 = np.array([255, 250, 225], np.float32); c1 = np.array([255, 160, 45], np.float32); c2 = np.array([225, 70, 20], np.float32)
        pc = np.where(k < 0.5, c0 + (c1 - c0)*(k/0.5), c1 + (c2 - c1)*((k - 0.5)/0.5))
        alpha = np.maximum(alpha, pr); col = np.where((pr > 0.02)[..., None] & (alpha <= pr + 1e-3)[..., None], pc, col)
    al = np.asarray(Image.fromarray((np.clip(alpha, 0, 1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32)/255
    alpha = np.where(core, 1.0, al) if not flame else al
    return np.dstack([col, alpha*255]).astype(np.uint8)

def hf_unit(name):
    f = hf_find('u-' + name)
    if not f: print('skip (no source):', name); return
    im = Image.open(f).convert('RGB').resize((HF_WORK, HF_WORK), Image.LANCZOS)
    rgba = white_cut(np.asarray(im).astype(np.float32), flame=HF_FLAME.get(name, False))
    rgba = keep_main_all(rgba)
    return rgba

def keep_main_all(rgba, min_area=400):
    """drop specks: connected opaque parts smaller than min_area px (the soldier groups, drone swarms and aircraft are several parts apart, so
    only real specks go)"""
    keep = drop_small(rgba[..., 3] > 40, min_area); keep = dilate(dilate(keep))
    out = rgba.copy(); out[..., 3] = np.where(keep, out[..., 3], 0); return out

def bold_icon(arr, name, size=ICON, rim=1.6, grow=1.0, contrast=1.35, sat=1.2):
    """small-list icon: the silhouette thickened (grow px at size), a dark outline (rim px), contrast and colour lifted, unsharp-masked, so a
    squad or a swarm stays readable at 24-32 px; the picture is cropped to its opaque part first"""
    im = Image.fromarray(arr, 'RGBA'); bb = im.getchannel('A').point(lambda v: 255 if v > 64 else 0).getbbox()
    x0, y0, x1, y1 = bb; pad = int(max(x1 - x0, y1 - y0)*0.06); im = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))
    S2 = 2   # work at 2x and let the final resize do the anti-aliasing
    s = size*S2*0.92/max(im.width, im.height); im = im.resize((max(1, round(im.width*s)), max(1, round(im.height*s))), Image.LANCZOS)
    big = size*S2; sq = Image.new('RGBA', (big, big), (0, 0, 0, 0)); sq.paste(im, ((big - im.width)//2, (big - im.height)//2))
    px = bleed(np.asarray(sq), 3).astype(np.float32); rgb, al = px[..., :3], px[..., 3]/255
    l = (rgb @ LUMA); sel = al > 0.6
    lo, hi = (np.percentile(l[sel], 2), np.percentile(l[sel], 98)) if sel.sum() > 50 else (0, 255)
    rgb = np.clip((rgb - lo)/max(hi - lo, 1), 0, 1)**0.85
    l2 = (rgb @ LUMA)[..., None]; rgb = np.clip(l2 + (rgb - l2)*sat, 0, 1)
    rgb = np.clip((rgb - 0.5)*contrast + 0.5, 0, 1)*225 + 14
    # thicken the silhouette (max filter on alpha), then draw a dark outline just outside it
    A = Image.fromarray((al*255).astype(np.uint8))
    if grow > 0: A = A.filter(ImageFilter.MaxFilter(2*int(round(grow*S2)) + 1))
    A = A.filter(ImageFilter.GaussianBlur(0.6)); a_body = np.asarray(A).astype(np.float32)/255
    RM = Image.fromarray((a_body*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2*int(round(rim*S2)) + 1)).filter(ImageFilter.GaussianBlur(0.7))
    a_out = np.asarray(RM).astype(np.float32)/255
    fill, _ = lnorm_blur(rgb, (al > 0.5), 3)   # colour for the thickened rim: the nearest solid colour
    body = np.where((al > 0.5)[..., None], rgb, fill)
    out_rgb = body*a_body[..., None] + np.array([14, 16, 14], np.float32)*(1 - a_body[..., None])
    out = np.dstack([out_rgb, a_out*255]).astype(np.uint8)
    img = Image.fromarray(out, 'RGBA').resize((size, size), Image.LANCZOS)
    px2 = bleed(np.asarray(img), 3)
    rgbs = np.asarray(Image.fromarray(px2[..., :3]).filter(ImageFilter.UnsharpMask(radius=1.0, percent=70, threshold=1)))
    Image.fromarray(np.dstack([rgbs, px2[..., 3]]), 'RGBA').save(os.path.join(OUT, name), 'WEBP', quality=90, method=6)

def hf_box(name):
    """opaque extent [w, h] of a saved picture as a share of its square (for the game's PICBOX table)"""
    im = Image.open(os.path.join(OUT, name)); bb = im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
    return [round((bb[2] - bb[0])/im.width, 2), round((bb[3] - bb[1])/im.height, 2)] if bb else None

def infantry_icon(rgba):
    """the squad for a 24-32 px tile: two of its soldiers, bold, so it reads as people and not a blob"""
    keep = os.environ.get('HF_INF_KEEP', 'lr')
    if keep == 'all': return rgba
    lab = label(rgba[..., 3] > 40); H, W = lab.shape; ids = [i for i in np.unique(lab) if i]
    parts = sorted([(float(np.mean(np.nonzero(lab == i)[0])), float(np.mean(np.nonzero(lab == i)[1])), i) for i in ids if (lab == i).sum() > 4000])
    out = rgba.copy(); sel = np.zeros(lab.shape, bool)
    pick = {'top': [0], 'two': [0, -1], 'lr': [0, -1], 'three': [0, 1, -1]}.get(keep, None)
    if pick is None: return rgba
    srt = sorted(parts, key=(lambda p: p[1]) if keep == 'lr' else (lambda p: p[0]))   # 'lr': the squad's left and right soldiers, side by side (an upright icon, wider than tall)
    for k in pick: sel |= lab == srt[k][2]
    out[..., 3] = np.where(sel, out[..., 3], 0); return out

HF_SEEN = []
for n in HF_UNITS:
    if not (want('hf') or want('hf-units') or want('u-' + n)): continue
    rgba = hf_unit(n)
    if rgba is None: continue
    save_rgba(rgba, 'u-' + n + '.webp', UNIT, clean=False, q=86)
    if n not in HF_ICON_SKIP:
        if n == 'infantry': bold_icon(infantry_icon(rgba), 'i-' + n + '.webp', 128, rim=1.8, grow=1.2, contrast=1.3)
        else: save_icon(rgba, 'i-' + n + '.webp')
    HF_SEEN.append(n); print('HF unit %-18s u %5.1f KB  box %s' % (n, os.path.getsize(os.path.join(OUT, 'u-' + n + '.webp'))/1024, hf_box('u-' + n + '.webp')))

def hf_matte_patch(a, seed, size=320, inset=0.0, feather=0.075, wobble=0.1):
    """dark-matte aerial building: the picture's own rectangle (found by the cut-out where it sits on a dark matte, else the whole frame) with
    a feathered, slightly irregular edge fading to transparent, the same look as the existing b-military-base / b-naval-port patches"""
    h, w, _ = a.shape
    cut = cutout(a, t_hard=12.0, t_soft=(7.0, 26.0), shadow=0); al = cut[..., 3].astype(np.float32)/255
    rows, cols = (al > 0.5).mean(1), (al > 0.5).mean(0)
    def span(v): idx = np.nonzero(v > 0.45)[0]; return (idx[0], idx[-1]) if len(idx) else (0, len(v) - 1)
    (y0, y1), (x0, x1) = span(rows), span(cols)
    if (x1 - x0) < w*0.5 or (y1 - y0) < h*0.5: x0, x1, y0, y1 = 0, w - 1, 0, h - 1
    m = int(0.012*w); X0, X1, Y0, Y1 = x0 + m, x1 - m, y0 + m, y1 - m
    gy, gx = np.mgrid[0:h, 0:w]; F = feather*max(X1 - X0, Y1 - Y0)
    nz = edge_noise(h, w, seed, cells=9)
    d = np.minimum.reduce([gx - X0, X1 - gx, gy - Y0, Y1 - gy]).astype(np.float32)
    alpha = sstep(d/F + wobble*nz*0.5)**1.3
    return np.dstack([a, alpha*255])[Y0:Y1 + 1, X0:X1 + 1].astype(np.uint8)

for f in HF_BUILD:
    if not (want('hf') or want('hf-buildings') or want('b-' + f)): continue
    src = hf_find('b-' + f)
    if not src: print('skip (no source):', f); continue
    a = np.asarray(Image.open(src).convert('RGB').resize((1024, 1024), Image.LANCZOS)).astype(np.float32)
    save_patch(hf_matte_patch(a, sum(map(ord, f))*7 + 1), 'b-' + f + '.webp', 320); print('HF building', f, os.path.getsize(os.path.join(OUT, 'b-' + f + '.webp'))//1024, 'KB')
if HF_SEEN: print('PICBOX:', {'u-' + n: hf_box('u-' + n + '.webp') for n in HF_SEEN})

# tell the game which promised V3 pictures now exist (it draws code stand-ins for the rest and never requests a missing file)
import re
V3 = ['u-infantry-figure']   # (promised pictures: fetched only once the file exists)
have = [n for n in V3 if os.path.exists(os.path.join(OUT, n + '.webp'))]
idx = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(OUT))), 'index.html')
if os.path.exists(idx):
    src = open(idx, encoding='utf-8').read()
    new = re.sub(r"const ART_SUPPLIED = \[[^\]]*\];", 'const ART_SUPPLIED = [' + ', '.join("'%s'" % n for n in have) + '];', src, count=1)
    if new != src: open(idx, 'w', encoding='utf-8').write(new); print('index.html: ART_SUPPLIED =', have)
print('ok')
