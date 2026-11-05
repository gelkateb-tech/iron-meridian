"""Packs the flag renders of tools/build-flags.js into one atlas.
usage: python3 -I tools/pack-flags.py <work dir from build-flags.js> <out dir: assets/art>
writes flags.webp (16 columns of 96x72 cells, in the order of index.json: country names sorted) and flags.json {"cell":[96,72],"cols":16,"names":[...],"iso":[...]}
"""
import sys, os, json
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
CW, CH, COLS = 96, 72, 16
BACK = (214, 211, 202)   # neutral backing for transparent parts of a flag
idx = json.load(open(os.path.join(SRC, 'index.json'), encoding='utf-8'))
rows = (len(idx) + COLS - 1)//COLS
atlas = Image.new('RGBA', (COLS*CW, rows*CH), (0, 0, 0, 0))
for i in range(len(idx)):
    im = Image.open(os.path.join(SRC, '%03d.png' % i)).convert('RGBA').resize((CW, CH), Image.LANCZOS)
    # a flag that does not fill its 4:3 cell (Nepal's double pennant) sits on a neutral light backing instead of turning black in RGB
    bg = Image.new('RGBA', (CW, CH), BACK + (255,)); bg.alpha_composite(im)
    atlas.paste(bg, ((i % COLS)*CW, (i//COLS)*CH))
atlas = atlas.convert('RGB')
atlas.save(os.path.join(OUT, 'flags.webp'), 'WEBP', quality=94, method=6)
json.dump({'cell': [CW, CH], 'cols': COLS, 'names': [e['name'] for e in idx], 'iso': [e['iso'] for e in idx]},
          open(os.path.join(OUT, 'flags.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(idx), 'flags ->', os.path.getsize(os.path.join(OUT, 'flags.webp')), 'bytes')
