"""The research category banners' unit pictures (assets/art/rb-<category>.webp).
Each one is made from the unit's 512 px cut-out picture (assets/art/u-<name>.webp, the owner's pictures; the originals are left as they are):
trimmed to the unit, turned so the nose points left (toward the category's name), scaled to 176 px high (sharp at 2x in an 86 px banner),
lightly lifted and sharpened. The page shows it whole (contain) at the right of the banner and fades its left edge in CSS.
usage: python3 -I tools/prep-banners.py   (from the project folder)
"""
import os
from PIL import Image, ImageEnhance, ImageFilter

ART = 'assets/art'
H = 176   # output height in px
# category id -> (unit picture, stored nose down). Keep in step with RCATS (rules/data.js) and RBART (index.html)
BANNERS = {
    'inf': ('u-infantry', 0),        # Infantry Corps: the squad
    'arm': ('u-tank', 0),            # Armoured Forces: the Main Battle Tank
    'sup': ('u-artillery', 1),       # Artillery & Air Defence: Mobile Artillery
    'aas': ('u-attack-heli', 0),     # Air Assault: the Attack Helicopter
    'tac': ('u-air-superiority', 0), # Tactical Air: the Air Superiority Fighter
    'uns': ('u-strike-drone', 0),    # Unmanned Systems: the Strike Drone
    'str': ('u-awacs', 0),           # Strategic Air: AWACS (no Heavy or Stealth Bomber picture yet)
    'nav': ('u-carrier', 0),         # Navy: the Aircraft Carrier
    'msl': ('u-ballistic-missile', 0),  # Strategic Weapons: the Ballistic Missile
    'cmd': ('u-supply-truck', 0),    # Command & Logistics: Motorized Supply
}

def banner(name, down):
    im = Image.open(os.path.join(ART, name + '.webp')).convert('RGBA')
    box = im.getchannel('A').point(lambda a: 255 if a > 10 else 0).getbbox()
    im = im.crop(box)
    im = im.rotate(-90 if down else 90, expand=True)   # nose up turns left (counter-clockwise); nose down turns the other way
    pad = round(im.height*0.03)
    out = Image.new('RGBA', (im.width + 2*pad, im.height + 2*pad)); out.alpha_composite(im, (pad, pad))
    w = round(out.width*H/out.height); out = out.resize((w, H), Image.LANCZOS)
    rgb, a = out.convert('RGB'), out.getchannel('A')
    rgb = ImageEnhance.Brightness(rgb).enhance(1.08); rgb = ImageEnhance.Contrast(rgb).enhance(1.05)
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=1.2, percent=45, threshold=2))
    out = rgb.convert('RGBA'); out.putalpha(a)
    return out

if __name__ == '__main__':
    for cat, (name, down) in BANNERS.items():
        p = os.path.join(ART, 'rb-' + cat + '.webp')
        banner(name, down).save(p, 'WEBP', quality=86, method=6)
        im = Image.open(p); print(p, im.size, os.path.getsize(p), 'bytes')
