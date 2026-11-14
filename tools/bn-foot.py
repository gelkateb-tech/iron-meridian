"""The building pictures' footprints for the map (BNFOOT in index.html): which cells of a 16 x 12 grid over each angled building
picture (assets/art/bn-*.webp, cut by tools/cutout-angled.py) are solid: more than half of the cell's pixels nearly opaque (alpha > 200),
so the building and its own ground count and the see-through cast shadow does not. The map lays the buildings out with them (no solid
cell on the water: bnLayout, bnShore in index.html). One hex string per picture, 48 digits, the cells row by row, 4 cells a digit (the
first cell in the digit's highest bit).

  python3 -I tools/bn-foot.py assets/art [--embed]   (--embed writes the table into index.html as BNFOOT; without it, prints it)
"""
import sys, os, glob, json, re
import numpy as np
from PIL import Image

NX, NY = 16, 12

def foot(fn):
    a = np.asarray(Image.open(fn).convert('RGBA'))[..., 3] > 200
    h, w = a.shape
    bits = []
    for j in range(NY):
        for i in range(NX):
            c = a[j*h//NY:(j + 1)*h//NY, i*w//NX:(i + 1)*w//NX]
            bits.append(1 if c.size and c.mean() > 0.5 else 0)
    return ''.join('%x' % (bits[k]*8 + bits[k + 1]*4 + bits[k + 2]*2 + bits[k + 3]) for k in range(0, len(bits), 4))

def main():
    src = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'assets/art'
    T = {}
    for fn in sorted(glob.glob(os.path.join(src, 'bn-*.webp'))):
        T[os.path.basename(fn)[:-5]] = foot(fn)
    line = 'const BNFOOT = ' + json.dumps(T, separators=(',', ':'), sort_keys=True) + ';'
    if '--embed' not in sys.argv:
        print(line); return
    page = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'index.html')
    s = open(page, encoding='utf8').read()
    s, n = re.subn(r'^const BNFOOT = \{.*\};$', lambda m: line, s, count=1, flags=re.M)
    if n != 1: sys.exit('BNFOOT line not found in index.html')
    open(page, 'w', encoding='utf8').write(s); print('BNFOOT embedded:', len(T), 'pictures')

if __name__ == '__main__':
    main()
