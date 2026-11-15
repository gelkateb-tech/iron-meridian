#!/usr/bin/env python3
"""Traces the owner's side-view helmet picture (assets/art-src/helmet-icons.png: green helmet on a grey checkerboard) into a clean
silhouette and writes tools/helmet-c.json (the outline as polygon rings in the picture's pixels). tools/icons.py reads that file for
the infantry icon C, so it needs no image libraries. Run: python3 tools/helmet-trace.py"""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage
from shapely.geometry import box, Polygon
from shapely.ops import unary_union
here = os.path.dirname(os.path.abspath(__file__))
im = np.asarray(Image.open(os.path.join(here, '..', 'assets', 'art-src', 'helmet-icons.png')).convert('RGB')).astype(int)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
mx, mn = im.max(2), im.min(2)
bg = ((mx - mn) < 14) & (mn > 150)            # the checkerboard: light and grey
m = ~bg
m = ndimage.binary_opening(m, iterations=1)
lab, n = ndimage.label(m); sizes = ndimage.sum(m, lab, range(1, n + 1)); m = lab == (1 + int(np.argmax(sizes)))
m = ndimage.binary_fill_holes(ndimage.binary_closing(m, iterations=3))
rows = []
for y in range(m.shape[0]):
    xs = np.flatnonzero(m[y])
    if not len(xs): continue
    s = xs[0]
    for i in range(1, len(xs) + 1):
        if i == len(xs) or xs[i] != xs[i - 1] + 1:
            rows.append(box(s, y, xs[i - 1] + 1, y + 1)); s = xs[i] if i < len(xs) else 0
poly = unary_union(rows).buffer(1.5).buffer(-1.5).simplify(0.8)
polys = [poly] if isinstance(poly, Polygon) else list(poly.geoms)
polys = [p for p in polys if p.area > 200]
# the rim ridge (the lighter curved band's upper dark line) as a thin cut: the darkest pixels inside, in the lower half
inner = ndimage.binary_erosion(m, iterations=7)
dark = (mx < 70) & inner
dl, dn = ndimage.label(dark)
cuts = []
for k in range(1, dn + 1):
    ys, xs = np.nonzero(dl == k)
    if len(xs) > 120: cuts.append(sorted(zip(xs.tolist(), ys.tolist()))[::6])
json.dump({'size': list(m.shape[::-1]), 'rings': [list(map(list, p.exterior.coords)) for p in polys], 'cuts': cuts}, open(os.path.join(here, 'helmet-c.json'), 'w'))
print('rings', len(polys), 'bounds', [p.bounds for p in polys], 'cuts', [len(c) for c in cuts])
