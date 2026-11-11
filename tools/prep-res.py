# Resource pictures: assets/art-src/res-*.png (white background) -> assets/art/res-<name>.webp (64 px) and @2x.webp (128 px), transparent, trimmed, centred.
# Run: python3 -I tools/prep-res.py   (needs Pillow, numpy, scipy)
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src=ROOT+'/assets/art-src/'
names=['money','oil','iron','electronics','materials','rare-materials','manpower','storage']
out={}
for n in names:
    im=Image.open(src+f'res-{n}.png').convert('RGB'); a=np.asarray(im).astype(np.float32)
    mn=a.min(axis=2)
    bgc = mn>=236
    lab,_=ndi.label(bgc)
    edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bg=np.isin(lab,list(edge))
    obj=~bg
    # fill small holes inside object? keep (handle interior holes like handle) -- background reachable only from edge
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
    im=im.crop(bb); w,h=im.size; side=max(w,h); pad=round(side*0.05); cv=side+2*pad
    c=Image.new('RGBA',(cv,cv),(0,0,0,0)); c.paste(im,((cv-w)//2,(cv-h)//2))
    for px,suf in((64,''),(128,'@2x')):
        r=c.convert('RGBa').resize((px,px),Image.LANCZOS).convert('RGBA')
        r.save(f'{ROOT}/assets/art/res-{n}{suf}.webp','WEBP',quality=88,method=6)
