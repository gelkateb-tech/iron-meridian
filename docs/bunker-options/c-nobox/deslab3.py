"""Remove the earth slab's side faces (no Gemini): python3 -I deslab2.py <in> <out.webp> <preview.png> [T]
The slab's sides are vertical, so they show as the lowest T pixels of every column of the object. Keep a pixel only
if there is object T px below it (an upward erosion), smooth the new outline, fill the rest with the background."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd

src, dst, prev = sys.argv[1:4]
T = int(sys.argv[4]) if len(sys.argv) > 4 else 30
a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
H, W, _ = a.shape
edge = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
bgc = np.median(edge, 0)
near = np.abs(a - bgc).sum(2) < 22
lab, _ = nd.label(near)
keep = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bg = np.isin(lab, list(keep))
shd = (a[...,2] >= a[...,0] + 3) & (a.sum(2) < bgc.sum() - 20)
shd = nd.binary_opening(shd, iterations=3)
obj = nd.binary_fill_holes(nd.binary_opening(~bg & ~shd, iterations=2))
labo, no = nd.label(obj)
sizes = nd.sum(obj, labo, range(1, no + 1)); base = labo == (1 + int(np.argmax(sizes)))
# upward erosion of the base footprint
below = np.zeros_like(base); below[:-T] = base[T:]
top = base & below
# keep tall things that stand on the top surface (tower, aircraft tails): any object pixel above the top surface stays
colmin = np.where(top.any(0), np.argmax(top, 0), H)
above = np.arange(H)[:, None] < colmin[None, :]
keepm = top | (base & above)
keepm = nd.binary_opening(keepm, structure=np.ones((1, 21), bool))
sm = nd.gaussian_filter(keepm.astype(np.float32), 2.5) > 0.5
labk, nk = nd.label(sm)
if nk > 1:
    sz = nd.sum(sm, labk, range(1, nk + 1)); sm = labk == (1 + int(np.argmax(sz)))
newbg = ~sm
T_=T
w = (bg & near).astype(np.float32)
fill = np.stack([nd.gaussian_filter(a[..., c] * w, 40) / np.maximum(nd.gaussian_filter(w, 40), 1e-4) for c in range(3)], -1)
alpha = np.clip(nd.distance_transform_edt(sm) / 1.5, 0, 1)[..., None]
out = alpha * a + (1 - alpha) * fill
shadow = nd.gaussian_filter(np.roll(np.roll(sm.astype(np.float32), 7, 0), 4, 1), 7)
out = np.where(newbg[..., None], out * (1 - 0.15 * shadow[..., None]), out)
o = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
o.save(dst, 'WEBP', quality=92)
o.resize((W // 2, H // 2)).save(prev)
print(dst, 'T', T)
