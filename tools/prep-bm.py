"""Cut-out building markers for the map (bm-<key>-<level>.webp) from the building pictures (b-<key>-<level>.webp, square aerial shots
with their own ground). The city panel keeps the full pictures; the map shows these, sitting straight on the terrain.
Method, per picture (the picture's own 320 px; tuned per family and for the sparse ones in TUNE):
  - ground key, worked at 64 px so the grain of sand, grass and water averages out: how far each pixel's colour stands from the ground's
    (the median of a ring near the picture's edge) and from its blurred neighbourhood; buildings, roads, piers and ships score high, open
    ground and water low. Smoothly thresholded, closed (dilate, then erode) so roofs and aprons inside a complex fill in, scaled up, blurred
  - a soft rounded-square vignette (a circle for the round pictures) keeps the complex and fades the outer ground to transparent, whatever
    the key says; a small core always stays. The picture's own alpha (some already have a soft round edge) is kept on top. The sparse
    pictures (a lone building, a trench, a ring of tents on open sand: a key leaves a spray of sand specks there) are cut by a tighter
    vignette round the building alone instead, so once trimmed the building fills the marker
  - trimmed to what is left, centred on a square, levels and colour lifted a little and unsharp-masked for the small sizes the map draws
    them at (15-26 css px: up to ~78 device px on a 3x screen), saved at OUT px with alpha (the map adds a soft dark halo under them)
Also the HQ (bm-hq.webp): the command compound at the centre of the Army Base V picture, cut the same way with a round vignette.
usage: python3 -I tools/prep-bm.py [assets/art] [sheet.png]   (the optional sheet: the results on dark and green ground, for a look)
"""
import sys, os, glob, numpy as np
from PIL import Image, ImageFilter, ImageEnhance

ART = sys.argv[1] if len(sys.argv) > 1 else 'assets/art'
SHEET = sys.argv[2] if len(sys.argv) > 2 else None
OUT = 96

def blur(a, r):
    return np.asarray(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32)

def morph(m, size, op):
    im = Image.fromarray(np.clip(m*255, 0, 255).astype(np.uint8))
    im = im.filter(ImageFilter.MaxFilter(size) if op == 'max' else ImageFilter.MinFilter(size))
    return np.asarray(im).astype(np.float32)/255

def smooth(e0, e1, x):
    t = np.clip((x - e0)/(e1 - e0), 0, 1); return t*t*(3 - 2*t)

def cut(im, keep=0.34, fade=0.49, core=0.16, thr=(20, 44), pw=3.0, close=3):
    a = np.asarray(im.convert('RGBA')).astype(np.float32); rgb, A0 = a[..., :3], a[..., 3]/255
    h, w = A0.shape
    # ground key, worked at 64 px (the grain of sand, grass and water averages out; buildings, roads, piers and ships stay): how far each
    # pixel's colour is from the ground's (the median of a ring near the picture's edge) and from its blurred neighbourhood
    lo = np.asarray(im.convert('RGBA').resize((64, 64), Image.BOX)).astype(np.float32); lr, la = lo[..., :3], lo[..., 3]/255
    yy, xx = np.mgrid[0:64, 0:64].astype(np.float32); r64 = np.hypot((xx + 0.5)/64 - 0.5, (yy + 0.5)/64 - 0.5)
    ring = (r64 > 0.36) & (r64 < 0.47) & (la > 0.5)
    if ring.sum() < 20: ring = (r64 > 0.27) & (r64 < 0.40) & (la > 0.5)
    g = np.median(lr[ring], 0); cd = np.sqrt(((lr - g)**2).sum(-1))
    d = np.abs(lr - np.stack([blur(lr[..., c], 5) for c in range(3)], -1)).sum(-1)
    m = smooth(thr[0], thr[1], blur(np.maximum(cd, d*1.2), 1.0))
    m = morph(morph(m, close, 'max'), close, 'min')   # close: fill the roofs and aprons inside a complex
    m = np.asarray(Image.fromarray((m*255).astype(np.uint8)).resize((w, h), Image.BILINEAR)).astype(np.float32)/255
    m = blur(m*255, w/90)/255
    # soft rounded-square vignette (fades the outer ground whatever the key says) and a small core that always stays
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32); rx, ry = np.abs((xx + 0.5)/w - 0.5), np.abs((yy + 0.5)/h - 0.5)
    r = (rx**pw + ry**pw)**(1/pw)
    vig = 1 - smooth(keep, fade, r); cor = 1 - smooth(core*0.55, core, np.hypot(rx, ry))
    al = np.maximum(m*vig, cor*0.95)*A0
    out = np.concatenate([rgb, (al*255)[..., None]], -1)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA')

def finish(im):
    a = np.asarray(im).astype(np.float32); al = a[..., 3]
    ys, xs = np.nonzero(al > 10); x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    side = max(x1 - x0, y1 - y0) + 4; cx, cy = (x0 + x1)/2, (y0 + y1)/2
    box = (int(round(cx - side/2)), int(round(cy - side/2)), int(round(cx - side/2)) + side, int(round(cy - side/2)) + side)
    im = im.crop(box).resize((OUT, OUT), Image.LANCZOS)
    # small sizes: lift the levels a little and sharpen the colour (alpha kept as it is)
    rgb, al = im.convert('RGB'), im.getchannel('A')
    arr = np.asarray(rgb).astype(np.float32); arr = np.clip((arr - 10)*1.13, 0, 255)
    rgb = ImageEnhance.Color(Image.fromarray(arr.astype(np.uint8))).enhance(1.12).filter(ImageFilter.UnsharpMask(radius=1.2, percent=80, threshold=2))
    out = rgb.convert('RGBA'); out.putalpha(al); return out

# per picture family: how much ground round the complex may stay (keep, fade: radius as a share of the picture), how strong the closing is
TUNE = {'airfield': dict(pw=2.2), 'missile-silo': dict(pw=2.2), 'naval-port': dict(thr=(24, 50)),
        'military-base': dict(), 'arms-industry': dict(), 'fortifications': dict(thr=(24, 50)), 'recruiting-office': dict(thr=(26, 52), core=0.2)}
# the sparse ones (a lone building, a trench or a ring of tents on open sand or grass): a key leaves a spray of sand specks there, so they are
# cut by a tighter vignette round the building itself instead (trimmed, the building then fills the marker)
NOKEY = (0, 1)
TUNE.update({'arms-industry-1': dict(thr=NOKEY, keep=0.13, fade=0.27, pw=2.4, core=0.1), 'fortifications-1': dict(thr=NOKEY, keep=0.17, fade=0.31, pw=2.4, core=0.1),
             'military-base-1': dict(thr=NOKEY, keep=0.28, fade=0.42, pw=2.2, core=0.1), 'recruiting-office-1': dict(thr=NOKEY, keep=0.19, fade=0.33, pw=2.6, core=0.1),
             'naval-port-2': dict(thr=(30, 56))})
done = []
for f in sorted(glob.glob(os.path.join(ART, 'b-*-[0-9].webp'))):
    base = os.path.basename(f)[2:-5]; key = base.rsplit('-', 1)[0]
    if key == 'city': continue   # (the city is part of the map itself: no marker)
    im = finish(cut(Image.open(f), **TUNE.get(base, TUNE.get(key, {}))))
    o = os.path.join(ART, 'bm-' + base + '.webp'); im.save(o, 'WEBP', quality=88, method=6); done.append(o)
# the HQ: the cross-shaped command compound in the middle of Army Base V, cut round
src = Image.open(os.path.join(ART, 'b-military-base-5.webp')).convert('RGBA'); W0 = src.width
c = src.crop((int(W0*0.24), int(W0*0.24), int(W0*0.76), int(W0*0.76))).resize((320, 320), Image.LANCZOS)
im = finish(cut(c, keep=0.36, fade=0.49, core=0.3, pw=2.0, thr=(8, 24)))
o = os.path.join(ART, 'bm-hq.webp'); im.save(o, 'WEBP', quality=90, method=6); done.append(o)
print(len(done), 'cut-outs')
if SHEET:
    S, cols = 96, 9; fs = done; rows = (len(fs) + cols - 1)//cols
    sh = Image.new('RGB', (cols*S*2 + 24, rows*S + 120), (30, 30, 30))
    for half, bg in ((0, (18, 24, 26)), (1, (78, 100, 52))):
        x0 = half*(cols*S + 24); sh.paste(Image.new('RGB', (cols*S, rows*S + 120), bg), (x0, 0))
        for i, f in enumerate(fs):
            im = Image.open(f); sh.paste(im, (x0 + (i % cols)*S, (i//cols)*S), im)
        # a row at map size (40 device px = 20 css px on a 2x screen)
        for i, f in enumerate(fs):
            im = Image.open(f).resize((36, 36), Image.LANCZOS); sh.paste(im, (x0 + (i % 22)*38 + 4, rows*S + 6 + (i//22)*40), im)
    sh.save(SHEET)
