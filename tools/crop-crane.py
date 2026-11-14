"""The small tower crane the map stands beside a building while a level goes up (assets/art/bn-crane.webp): cut out of the
construction picture assets/art-src/ba-construction-2.png (the crane there stands clear to the right of the building) with
tools/cutout-angled.py's cut, then only the crane kept: the jib and its tie cables above the building's top, the tower, its
base and ballast right of the building; the hook's cable stops above the building (left out: the building, its scaffolding
and the hut). Cropped tight, long side CRANE_PX, its metadata line (size, ground anchor at the tower's foot) into tools/bn-meta.json and BNMETA (index.html) with --embed.

  python3 -I tools/crop-crane.py [--embed]
"""
import sys, os, json, re, importlib.util
sys.dont_write_bytecode = True
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..')
SRC = os.path.join(ROOT, 'assets/art-src/ba-construction-2.png'); OUT = os.path.join(ROOT, 'assets/art/bn-crane.webp')
CRANE_PX = 160
# the crane in the 1024 px source: the jib and cables above TOP_Y; the tower, its base and ballast right of TOWER_X (the scaffolding's
# last poles and the hut are left of it); its left brace (yellow) between BRACE_X and TOWER_X, rows BRACE_Y
TOP_Y, TOWER_X, BRACE_X, BRACE_Y = 232, 745, 722, (674, 712)

def load_cut():
    argv = sys.argv; sys.argv = ['cutout-angled.py', '-', '-']
    try:
        spec = importlib.util.spec_from_file_location('cutout', os.path.join(HERE, 'cutout-angled.py')); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    finally: sys.argv = argv
    return m

def main():
    m = load_cut()
    a = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32)
    rgba, obj, thin, k = m.cut(a, 'construction-2')
    h, w = obj.shape; yy, xx = np.mgrid[0:h, 0:w]
    yel = (a[..., 0] - a[..., 2] > 50) & (a[..., 0] >= a[..., 1])
    keep = (yy < TOP_Y) | (xx > TOWER_X) | ((xx > BRACE_X) & (yy >= BRACE_Y[0]) & (yy < BRACE_Y[1]) & yel)
    rgba = rgba.copy(); rgba[..., 3] *= keep; o = obj & keep
    al = rgba[..., 3]; ys, xs = np.nonzero(al > 8)
    y0, y1, x0, x1 = ys.min() - 2, ys.max() + 3, xs.min() - 2, xs.max() + 3
    crop = rgba[y0:y1, x0:x1]; sc = CRANE_PX/max(crop.shape[:2])
    W, H = round(crop.shape[1]*sc), round(crop.shape[0]*sc)
    im = Image.fromarray(crop.round().astype(np.uint8), 'RGBA').convert('RGBa').resize((W, H), Image.LANCZOS).convert('RGBA')
    im.save(OUT, 'WEBP', quality=88, method=6, alpha_quality=100)
    # the ground anchor: the tower's foot (the lowest crane pixels right of the hut line)
    oy, ox = np.nonzero(o[y0:y1, x0:x1]); foot = oy >= oy.max() - 30
    e = {'w':W, 'h':H, 'ax':round(float(ox[foot].mean())/crop.shape[1], 4), 'ay':round(float(oy.max() - 12)/crop.shape[0], 4), 'top':round(float(oy.min())/crop.shape[0], 4)}
    print('bn-crane', e)
    mf = os.path.join(HERE, 'bn-meta.json'); meta = json.load(open(mf)); meta['bn-crane'] = e
    json.dump(meta, open(mf, 'w'), indent=None, separators=(',', ':'), sort_keys=True)
    if '--embed' in sys.argv:
        page = os.path.join(ROOT, 'index.html'); s = open(page, encoding='utf8').read()
        line = 'const BNMETA = ' + json.dumps(meta, separators=(',', ':'), sort_keys=True) + ';'
        s, n = re.subn(r'^const BNMETA = \{.*\};$', lambda q: line, s, count=1, flags=re.M)
        if n != 1: sys.exit('BNMETA line not found in index.html')
        open(page, 'w', encoding='utf8').write(s); print('BNMETA embedded')

if __name__ == '__main__':
    main()
