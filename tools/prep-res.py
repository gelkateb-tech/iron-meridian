# Resource pictures: assets/art-src/res-*.png (white background) -> assets/art/res-<name>.webp (64 px) and @2x.webp (128 px), transparent, trimmed, centred.
# Run: python3 -I tools/prep-res.py [name ...]   (needs Pillow, numpy, scipy; names limit the run, e.g. electronics)
# electronics comes from the owner's icon-electronics.png (a wide chip on light grey, 2026-11-13): it is cut out the same way but kept WIDE
# (64 px / 128 px tall, width from its shape) so it stands as tall as the other icons; the page shows it with img.ri.wide (width auto).
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src=ROOT+'/assets/art-src/'
names=['money','oil','iron','electronics','materials','rare-materials','manpower','storage']
if len(sys.argv)>1: names=[n for n in names if n in sys.argv[1:]]
SRC={'electronics':'icon-electronics.png', 'iron':'icon-iron.png', 'money':'icon-cash.png', 'oil':'icon-oil.png'}   # owner's newer pictures (else res-<name>.png)
WIDE={'electronics', 'iron', 'money', 'oil'}   # kept as wide as their shape when wider than tall
TH={'electronics':130, 'money':130, 'oil':130}   # light grey background (not white): a lower threshold, also drops the soft drop shadow
out={}
for n in names:
    im=Image.open(src+SRC.get(n,f'res-{n}.png')).convert('RGB'); a=np.asarray(im).astype(np.float32)
    mn=a.min(axis=2)
    if n=='iron':   # grey ingots on light grey: the background is found by its smoothness (edge-aware flood from the border), not by its colour
        Ls=ndi.gaussian_filter(a.mean(axis=2),1.2); gm=np.hypot(ndi.sobel(Ls,0),ndi.sobel(Ls,1))
        bgc=(gm<24)&(a.max(axis=2)-mn<=16)&(mn>=110)
    else: bgc = (mn>=TH[n]) & (a.max(axis=2)-mn<=14) if n in TH else mn>=236
    lab,_=ndi.label(bgc)
    edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bg=np.isin(lab,list(edge))
    obj=~bg
    # fill small holes inside object? keep (handle interior holes like handle) -- background reachable only from edge
    if n=='iron': obj=ndi.binary_opening(obj,iterations=2); l3,k3=ndi.label(obj); obj=ndi.binary_fill_holes(l3==(np.argmax(ndi.sum(obj,l3,range(1,k3+1)))+1))
    if n=='manpower':
        l3,k3=ndi.label(mn>=238)
        for i in range(1,k3+1):
            m=l3==i
            if m.sum()>800: obj=obj&~ndi.binary_dilation(m,iterations=1)
    obj=ndi.binary_opening(obj,iterations=1)
    # keep largest component
    l2,k=ndi.label(obj); 
    if k>1:
        sizes=ndi.sum(obj,l2,range(1,k+1)); keep=[i+1 for i,s in enumerate(sizes) if s>2000]; obj=np.isin(l2,keep)
    er=ndi.binary_erosion(obj,iterations=1)
    alpha=ndi.gaussian_filter(er.astype(np.float32),0.9)
    # colour bleed: replace colours of pixels not deep inside by nearest deep-inside colour
    deep=ndi.binary_erosion(obj,iterations=3)
    idx=ndi.distance_transform_edt(~deep,return_distances=False,return_indices=True)
    rgb=a[idx[0],idx[1]]
    rgb=np.where(deep[...,None],a,rgb)
    out[n]=np.dstack([rgb,alpha*255]).astype(np.uint8)
    print(n,obj.mean())

for n,a in out.items():
    im=Image.fromarray(a,'RGBA'); bb=im.getchannel('A').point(lambda v:255 if v>10 else 0).getbbox()
    im=im.crop(bb); w,h=im.size
    if n in WIDE and w>h*1.05:   # as tall as the others (the same 5% margin of its height), as wide as its shape
        pad=round(h*0.05); cw,ch=w+2*pad,h+2*pad
    else:
        side=max(w,h); pad=round(side*0.05); cw=ch=side+2*pad
    c=Image.new('RGBA',(cw,ch),(0,0,0,0)); c.paste(im,((cw-w)//2,(ch-h)//2))
    for px,suf in((64,''),(128,'@2x')):
        r=c.convert('RGBa').resize((round(px*cw/ch),px),Image.LANCZOS).convert('RGBA')
        r.save(f'{ROOT}/assets/art/res-{n}{suf}.webp','WEBP',quality=88,method=6)
