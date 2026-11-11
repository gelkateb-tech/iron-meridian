#!/usr/bin/env python3
"""Unit type icons (original art, drawn in code): bold single-colour silhouettes in a 32 x 32 box.

Each icon is built from simple shapes (polygons, circles, round or square lines), merged into ONE solid outline with
shapely (fills are unioned, cuts subtracted), and written as one SVG path (outer rings counter-clockwise, holes clockwise,
so 'nonzero' and 'evenodd' fill the same). The game draws that path data as inline SVG in the HTML UI and as a Path2D on
the canvas map, so the icons stay sharp at every size.

  python3 tools/icons.py            prints the UICON table (JS)
  python3 tools/icons.py --write    replaces the block between the UICON markers in index.html

Ground vehicles and ships are seen from the side facing right; aircraft and drones from above, nose up; infantry is a
helmet. Needs shapely (pip install shapely).
"""
import math, re, sys, os
from shapely.geometry import Polygon, Point, LineString, MultiPolygon, box
from shapely.ops import unary_union
from shapely.geometry.polygon import orient
from shapely import affinity

Q = 10   # quad segments per quarter circle

# ---------- primitives ----------
def P(*pts): return Polygon(pts)
def C(x, y, r): return Point(x, y).buffer(r, quad_segs=Q)
def E(x, y, rx, ry): return affinity.translate(affinity.scale(Point(0, 0).buffer(1, quad_segs=Q*2), rx, ry), x, y)
def R(x, y, w, h): return box(x, y, x + w, y + h)
def RR(x, y, w, h, r):   # rounded rectangle
    return box(x + r, y + r, x + w - r, y + h - r).buffer(r, quad_segs=Q, join_style=1) if w > 2*r and h > 2*r else box(x, y, x + w, y + h)
def L(pts, w, cap='round'):   # a line of width w
    cs = {'round': 1, 'flat': 2, 'square': 3}[cap]
    return LineString(pts).buffer(w/2, quad_segs=Q, cap_style=cs, join_style=1 if cap == 'round' else 2, mitre_limit=3)
def bez(p0, p1, p2, p3, n=16):
    out = []
    for i in range(n + 1):
        t = i/n; a = (1-t)**3; b = 3*(1-t)**2*t; c = 3*(1-t)*t*t; d = t**3
        out.append((a*p0[0] + b*p1[0] + c*p2[0] + d*p3[0], a*p0[1] + b*p1[1] + c*p2[1] + d*p3[1]))
    return out
def qb(p0, p1, p2, n=12):
    return [((1-t)**2*p0[0] + 2*(1-t)*t*p1[0] + t*t*p2[0], (1-t)**2*p0[1] + 2*(1-t)*t*p1[1] + t*t*p2[1]) for t in (i/n for i in range(n + 1))]
def rot(g, deg, cx=16, cy=16): return affinity.rotate(g, deg, origin=(cx, cy))
def mv(g, dx, dy): return affinity.translate(g, dx, dy)
def sc(g, f, cx=16, cy=16): return affinity.scale(g, f, f, origin=(cx, cy))
def mirror_x(g, cx=16): return affinity.scale(g, -1, 1, origin=(cx, 0))
def sym(g, cx=16): return unary_union([g, mirror_x(g, cx)])   # mirror about the vertical axis (aircraft seen from above)
def U(*gs): return unary_union(list(gs))

# ---------- shared parts ----------
def helmet(x=16, y=17, s=1.0):
    """a plain combat helmet seen from the side, facing right: dome, short front brim, the back flared lower"""
    pts = []
    pts += bez((x + 10.6*s, y + 2.2*s), (x + 10.6*s, y - 8.6*s), (x - 9.6*s, y - 10.6*s), (x - 10.8*s, y + 1.2*s), 20)   # dome, front to back
    pts += [(x - 11.6*s, y + 4.6*s)]                       # back of the flare
    pts += qb((x - 11.6*s, y + 4.6*s), (x - 2*s, y + 2.6*s), (x + 8.2*s, y + 4.2*s), 10)[1:]   # rim
    pts += [(x + 12.4*s, y + 4.4*s), (x + 12.6*s, y + 3.2*s)]   # front brim
    g = Polygon(pts).buffer(0)
    return g

def track(x0, x1, y0, y1, n, hole=0.42):
    """tracked running gear: a rounded band with the road wheels cut out"""
    r = (y1 - y0)/2
    band = RR(x0, y0, x1 - x0, y1 - y0, r - 0.01)
    ws = [x0 + r + (x1 - x0 - 2*r)*i/(n - 1) for i in range(n)]
    holes = unary_union([C(w, y0 + r, r*hole) for w in ws])
    return band.difference(holes)

def tyres(xs, y, r, hub=0.4):
    return unary_union([C(x, y, r) for x in xs]).difference(unary_union([C(x, y, r*hub) for x in xs]))

def truck(x0=2.5, x1=29.5, bed_y=17.8, cab_w=7.0, wheels=(7.2, 12.8, 25.2), wr=3.1, cab_h=7.4):
    """a cab-forward military truck facing right, with its flat bed (the caller adds the load)"""
    cab_x = x1 - cab_w
    chassis = R(x0, bed_y, x1 - x0, 3.2)
    cab = Polygon([(cab_x, bed_y + 0.1), (cab_x, bed_y - cab_h + 1), (cab_x + 1, bed_y - cab_h), (cab_x + cab_w - 3, bed_y - cab_h), (x1, bed_y - cab_h + 3.6), (x1, bed_y + 0.1)])
    win = Polygon([(cab_x + 1.6, bed_y - cab_h + 1.6), (cab_x + cab_w - 3.4, bed_y - cab_h + 1.6), (x1 - 1.2, bed_y - cab_h + 4.4), (cab_x + 1.6, bed_y - cab_h + 4.4)])
    body = unary_union([chassis, cab]).difference(win)
    gap = unary_union([C(x, bed_y + 3.6, wr + 0.9) for x in wheels])
    return unary_union([body.difference(gap), tyres(wheels, bed_y + 3.6, wr)])

# ---------- the icons ----------
I = {}

# INFANTRY: a plain helmet
I['inf'] = helmet(16, 17.2, 1.12).difference(L([(4.6, 17.4), (16, 15.6), (26.6, 16.8)], 1.5, 'flat'))

# MOTORIZED INFANTRY: the helmet riding over a small wheeled vehicle
def _mot():
    h = sc(helmet(16, 9.4, 0.72), 1.0)
    veh = U(Polygon([(3, 23.6), (3, 18.6), (5, 16.8), (24, 16.8), (29.4, 20.2), (29.4, 23.6)]))
    gap = unary_union([C(x, 24.6, 3.9) for x in (8.6, 23.4)])
    veh = veh.difference(gap)
    w = tyres((8.6, 23.4), 24.6, 3.0, 0.38)
    slot = R(5.2, 18.8, 16.6, 1.3)
    return U(h, veh.difference(slot), w)
I['mot'] = _mot()

# ANTI-TANK INFANTRY: helmet with a shoulder launcher across it, warhead forward
def _at():
    h = helmet(13.4, 22.6, 0.98)
    ax = (2.0, 26.4); bx = (21.6, 12.6)
    tube = L([ax, bx], 3.4, 'flat')
    head = Polygon([(0, -1.7), (1.6, -3.2), (4.4, -3.2), (9.4, 0), (4.4, 3.2), (1.6, 3.2), (0, 1.7)])
    ang = math.degrees(math.atan2(bx[1] - ax[1], bx[0] - ax[0]))
    head = mv(rot(head, ang, 0, 0), bx[0] - 0.4, bx[1] + 0.3)
    clear = L([ax, bx], 5.0, 'flat')
    sight = L([(9.6, 18.6), (8.4, 16.6)], 1.6, 'flat')
    return U(h.difference(clear), tube, head, sight.difference(clear.buffer(-1.0)))
I['at'] = _at()

# SPECIAL FORCES: a commando dagger, point up
def _spec():
    blade = Polygon([(16, 1.0), (19.4, 6.6), (19.4, 19.4), (12.6, 19.4), (12.6, 6.6)])
    fuller = L([(16, 6.4), (16, 17.0)], 1.3, 'round')
    guard = RR(6.6, 19.2, 18.8, 3.4, 1.7)
    grip = R(13.8, 22.4, 4.4, 5.4)
    rings = unary_union([R(12.8, 23.6, 6.4, 1.2), R(12.8, 26.0, 6.4, 1.2)])
    pommel = C(16, 29.2, 2.4)
    return U(blade.difference(fuller), guard, grip, rings, pommel)
I['spec'] = _spec()

# PARATROOPERS: canopy, rigging lines and a jumper
def _para():
    top = bez((2.2, 12.6), (2.6, 2.4), (29.4, 2.4), (29.8, 12.6), 24)
    scal = []
    xs = [29.8, 25.2, 20.6, 16, 11.4, 6.8, 2.2]
    for a, b in zip(xs, xs[1:]):
        scal += qb((a, 12.6), ((a + b)/2, 10.0), (b, 12.6), 6)[1:]
    can = Polygon(top + scal).buffer(0)
    lines = unary_union([L([(3.0, 12.4), (14.4, 22.2)], 1.1), L([(29.0, 12.4), (17.6, 22.2)], 1.1), L([(10.6, 11.6), (15.2, 21.6)], 1.0), L([(21.4, 11.6), (16.8, 21.6)], 1.0)])
    man = U(C(16, 22.4, 2.2), L([(16, 24.4), (16, 27.4)], 3.0), L([(15.0, 27.6), (14.2, 30.4)], 1.6), L([(17.0, 27.6), (17.8, 30.4)], 1.6))
    return U(can, lines, man)
I['para'] = _para()

# MAIN BATTLE TANK
def _tank():
    t = track(2.6, 27.4, 19.0, 26.6, 5, 0.40)
    hull = Polygon([(1.2, 19.0), (3.6, 15.2), (26.6, 15.2), (30.4, 19.0)])
    tur = Polygon([(7.4, 15.4), (9.2, 10.6), (19.6, 10.6), (22.4, 12.2), (22.4, 15.4)])
    gun = R(21.0, 11.8, 9.8, 1.9)
    muz = R(29.0, 11.3, 1.8, 2.9)
    hat = R(11.2, 8.8, 4.2, 2.0)
    return U(t, hull, tur, gun, muz, hat).difference(R(1, 15.2 + 2.6, 30, 0))
I['tank'] = _tank()

# INFANTRY FIGHTING VEHICLE: high armoured box on four big wheels, small turret with a thin cannon
def _ifv():
    hull = Polygon([(1.6, 22.0), (1.6, 13.6), (3.0, 12.2), (20.0, 12.2), (29.6, 17.0), (30.0, 22.0)])
    tur = Polygon([(10.2, 12.4), (11.4, 8.8), (17.6, 8.8), (18.6, 12.4)])
    gun = R(17.0, 9.8, 12.6, 1.4)
    gap = unary_union([C(x, 23.2, 3.9) for x in (5.6, 12.0, 18.4, 24.8)])
    slit = R(3.6, 15.0, 13.6, 1.3)
    return U(hull.difference(gap).difference(slit), tur, gun, tyres((5.6, 12.0, 18.4, 24.8), 23.2, 2.9, 0.36))
I['ifv'] = _ifv()

# SELF-PROPELLED ARTILLERY: tracked, big rear turret, long barrel raised high
def _art():
    t = track(2.0, 26.6, 21.0, 28.0, 5, 0.40)
    hull = Polygon([(1.0, 21.0), (2.4, 17.4), (26.4, 17.4), (28.6, 21.0)])
    tur = Polygon([(2.2, 17.6), (2.2, 11.0), (4.0, 9.6), (15.6, 9.6), (18.2, 12.4), (18.2, 17.6)])
    gun = L([(14.4, 13.0), (29.4, 3.4)], 2.0, 'flat')
    muz = L([(27.6, 4.6), (30.4, 2.8)], 3.2, 'flat')
    slot = R(4.2, 12.8, 9.6, 1.2)
    return U(t, hull, tur.difference(slot), gun, muz)
I['art'] = _art()

# ROCKET ARTILLERY: a truck carrying a raised launch pod, its tube mouths showing
def _mlrs():
    tr = truck()
    pod = rot(R(2.0, 9.2, 19.4, 7.4), -22, 2.0, 16.6)
    mouths = unary_union([C(x, y, 0.95) for x in (0,) for y in (0,)])
    holes = []
    for i in range(3):
        for j in range(2):
            holes.append(C(19.0 - 0.0, 10.4 + 2.5*j, 0.9))
    # tube mouths on the pod's raised end: three rows of two, placed along the pod's end face
    ang = math.radians(-22); ca, sa = math.cos(ang), math.sin(ang)
    def at(u, v):   # pod-local (from the pod's lower-left, along / across) to icon coordinates
        x0, y0 = 2.0, 16.6
        return (x0 + u*ca - (-v)*sa, y0 + u*sa + (-v)*ca)
    mh = unary_union([C(*at(u, v), 0.95) for u in (15.4, 18.0) for v in (1.9, 4.0, 6.1)]) if False else None
    tubes = unary_union([L([at(1.2, v), at(18.2, v)], 0.8, 'flat') for v in (2.5, 4.9)])
    support = Polygon([(5.4, 17.9), (8.4, 12.6), (11.0, 12.6), (12.8, 17.9)])
    return U(tr, pod.difference(tubes), support)
I['mlrs'] = _mlrs()

# MOBILE SAM: launcher truck, two missiles raised steeply
def _sam():
    tr = truck()
    def missile(x, y, ang, ln=15.0, w=2.6):
        body = U(R(0, -w/2, ln - 3.2, w), Polygon([(ln - 3.2, -w/2), (ln, 0), (ln - 3.2, w/2)]), Polygon([(0, -w/2 - 1.6), (3.4, -w/2), (3.4, w/2), (0, w/2 + 1.6)]))
        return mv(affinity.rotate(body, ang, origin=(0, 0)), x, y)
    m1 = missile(4.0, 16.4, -52)
    m2 = missile(10.0, 16.4, -52)
    rail = Polygon([(2.6, 17.9), (2.6, 15.0), (17.6, 15.0), (17.6, 17.9)])
    return U(tr, m1, m2, rail.difference(L([(4.6, 16.4), (16, 16.4)], 0.0001)))
I['sam'] = _sam()

# MOBILE JAMMER: a truck with a mast sending out waves
def _jam():
    tr = truck()
    box_ = R(2.6, 11.2, 16.0, 6.8)
    mast = R(9.6, 4.6, 1.8, 6.8)
    def arc(r, w=1.6):
        a0, a1 = math.radians(-150), math.radians(-30)
        pts = [(10.5 + r*math.cos(a0 + (a1 - a0)*i/16), 4.8 + r*math.sin(a0 + (a1 - a0)*i/16)) for i in range(17)]
        return L(pts, w, 'round')
    head = C(10.5, 4.8, 1.8)
    waves = U(arc(4.4), arc(7.6))
    return U(tr, box_.difference(R(4.2, 13.4, 12.8, 1.1)), mast, head, waves.difference(R(0, 6.0, 32, 30)))
I['jam'] = _jam()

# ---- aircraft, seen from above, nose up (drawn half and mirrored about x 16)
# STRIKE FIGHTER: swept wings carrying two bombs, twin tails
def _jet():
    half = U(Polygon([(16, 1.2), (17.6, 5.0), (18.2, 9.0), (18.2, 25.0), (16, 26.6)]),
             Polygon([(17.6, 11.0), (29.4, 19.4), (29.4, 21.4), (17.8, 19.6)]),
             Polygon([(17.6, 23.2), (23.8, 27.4), (23.8, 29.0), (17.4, 28.2)]),
             RR(22.6, 20.6, 2.6, 7.6, 1.3), L([(23.9, 20.4), (23.9, 19.2)], 1.0))
    return sym(half)
I['jet'] = _jet()

# INTERCEPTOR: a pure delta wing on a long, needle-nosed fuselage, no tailplanes
def _int():
    half = U(Polygon([(16, 0.8), (17.4, 6.4), (17.8, 12.0), (17.8, 28.0), (16, 29.6)]),
             Polygon([(17.4, 11.0), (29.8, 27.0), (29.8, 28.4), (17.6, 28.4)]),
             Polygon([(17.6, 6.4), (19.0, 9.6), (17.6, 10.6)]))
    return sym(half).difference(L([(16, 24.6), (16, 30.0)], 0.0001))
I['int'] = _int()

# AIR SUPERIORITY FIGHTER: trapezoid wings, twin canted fins, big diamond tailplanes
def _asf():
    half = U(Polygon([(16, 1.0), (17.6, 4.8), (19.0, 9.0), (19.0, 26.8), (16, 27.6)]),
             Polygon([(18.8, 10.4), (29.6, 17.8), (29.6, 20.6), (18.8, 20.6)]),
             Polygon([(18.8, 21.2), (26.2, 25.0), (26.2, 27.4), (22.2, 28.8), (18.8, 27.6)]),
             Polygon([(19.4, 16.4), (21.6, 17.2), (22.6, 23.4), (20.6, 23.6)]))
    return sym(half)
I['asf'] = _asf()

# HEAVY BOMBER: long fuselage, broad swept wings with four engines, swept tail
def _bomb():
    half = U(Polygon([(16, 1.4), (17.4, 3.4), (17.8, 6.6), (17.8, 28.6), (16, 30.0)]),
             Polygon([(17.4, 10.2), (30.6, 19.8), (30.6, 21.2), (17.6, 17.4)]),
             Polygon([(17.6, 24.6), (24.0, 28.6), (24.0, 30.0), (17.6, 29.0)]),
             RR(20.2, 11.4, 2.0, 5.2, 0.9), RR(24.6, 14.6, 2.0, 5.2, 0.9))
    return sym(half)
I['bomb'] = _bomb()

# STEALTH BOMBER: a flying wing with a saw-tooth trailing edge
def _stealth():
    half = Polygon([(16, 6.0), (31.0, 21.0), (29.0, 23.6), (25.4, 20.4), (21.6, 24.2), (18.6, 21.0), (16, 23.6)])
    g = sym(half)
    return g.difference(U(L([(14.2, 11.4), (16, 9.8), (17.8, 11.4)], 1.0, 'round')))
I['stealth'] = _stealth()

# MARITIME PATROL: straight wings with four propellers, long tail boom (the MAD sting)
def _mpa():
    half = U(Polygon([(16, 2.0), (17.6, 4.6), (17.8, 8.0), (17.6, 29.4), (16, 31.0)]),
             Polygon([(17.4, 10.4), (30.4, 11.6), (30.4, 13.6), (17.4, 14.4)]),
             Polygon([(17.4, 24.2), (24.0, 25.6), (24.0, 27.4), (17.4, 27.4)]),
             RR(20.4, 8.6, 2.0, 7.0, 0.8), RR(25.4, 9.0, 2.0, 6.4, 0.8),
             L([(19.2, 8.2), (23.6, 8.2)], 1.1, 'round'), L([(24.2, 8.6), (28.6, 8.6)], 1.1, 'round'))
    return sym(half)
I['mpa'] = _mpa()

# AWACS: an airliner with the radar dish on its back (a ring with a bar)
def _awacs():
    half = U(Polygon([(16, 1.4), (17.6, 3.8), (18.0, 7.4), (17.8, 28.4), (16, 30.4)]),
             Polygon([(17.6, 11.6), (30.4, 19.6), (30.4, 21.2), (17.6, 17.4)]),
             Polygon([(17.6, 24.0), (23.6, 27.6), (23.6, 29.0), (17.6, 28.0)]),
             RR(21.2, 13.6, 2.0, 4.8, 0.9))
    g = sym(half)
    dome_clear = C(16, 17.6, 7.4)
    dome = C(16, 17.6, 6.2).difference(C(16, 17.6, 3.8))
    bar = R(9.8, 16.7, 12.4, 1.8)
    return U(g.difference(dome_clear), dome, bar.intersection(C(16, 17.6, 6.2)))
I['awacs'] = _awacs()

# RECON UAV: very long straight wings, slim body with a bulbous nose, V tail
def _drone():
    half = U(Polygon([(16, 3.0), (17.6, 4.0), (18.4, 7.4), (18.0, 12.0), (17.2, 26.0), (16, 27.4)]),
             Polygon([(17.4, 11.2), (31.2, 12.6), (31.2, 14.2), (17.4, 15.4)]),
             Polygon([(16.8, 24.0), (22.8, 28.6), (22.4, 30.0), (16.6, 27.0)]))
    return sym(half)
I['drone'] = _drone()
# ARMED UAV: the same airframe with a missile under each wing
I['drone4'] = U(I['drone'], RR(21.2, 9.4, 1.6, 8.6, 0.8), RR(9.2, 9.4, 1.6, 8.6, 0.8))

# STRIKE DRONE: a one-way attack drone (cropped delta with tip fins, pusher propeller)
def _sdrone():
    half = U(Polygon([(16, 2.4), (17.6, 4.4), (18.0, 8.0), (29.4, 23.2), (29.4, 26.0), (17.6, 25.0), (17.2, 27.0)]),
             R(28.0, 19.0, 1.6, 7.6))
    prop = L([(11.4, 28.8), (20.6, 28.8)], 1.8, 'round')
    hub = C(16, 28.0, 1.2)
    g = sym(half)
    return U(g.difference(L([(11.0, 28.8), (21.0, 28.8)], 3.4, 'flat')).difference(C(16, 13.4, 1.3)), prop, hub)
I['sdrone'] = _sdrone()

# SWARM DRONES: three small quadcopters in formation
def _swarm():
    def quad(x, y, s):
        arms = U(L([(x - 3.6*s, y - 3.6*s), (x + 3.6*s, y + 3.6*s)], 1.7*s), L([(x - 3.6*s, y + 3.6*s), (x + 3.6*s, y - 3.6*s)], 1.7*s))
        rotors = unary_union([C(x + dx*3.9*s, y + dy*3.9*s, 2.5*s) for dx in (-1, 1) for dy in (-1, 1)])
        return U(arms, rotors, RR(x - 2.0*s, y - 2.0*s, 4.0*s, 4.0*s, 1.0*s))
    a, b, c = quad(16, 9.4, 1.18), quad(7.4, 23.0, 1.0), quad(24.6, 23.0, 1.0)
    gap = 1.6
    return U(a, b.difference(a.buffer(gap)), c.difference(a.buffer(gap)))
I['swarm'] = _swarm()

# ATTACK HELICOPTER, side view facing right: rotor, tandem cockpit, stub wing, tail boom and rotor, skids
def _heli():
    rotor = RR(2.0, 6.2, 28.0, 1.8, 0.9)
    mast = R(15.0, 7.6, 2.0, 3.4)
    body = Polygon(bez((9.8, 18.6), (9.0, 10.6), (19.6, 10.4), (22.6, 11.2), 10) + bez((22.6, 11.2), (28.4, 12.6), (30.4, 16.0), (29.6, 18.2), 8) + [(25.0, 21.0), (12.0, 21.0)]).buffer(0)
    canopy = Polygon([(20.6, 12.4), (23.0, 12.4), (27.4, 15.2), (20.6, 15.2)])
    boom = Polygon([(10.4, 13.0), (1.6, 14.6), (1.6, 16.4), (10.8, 18.0)])
    fin = Polygon([(1.4, 10.4), (3.6, 10.4), (4.6, 15.0), (2.4, 17.4), (1.0, 16.4)])
    trot = C(2.6, 15.6, 2.2).difference(C(2.6, 15.6, 0.9))
    wing = RR(13.0, 18.2, 9.2, 2.2, 1.0)
    gun = L([(25.6, 21.4), (28.8, 22.6)], 1.4, 'round')
    skid = U(L([(10.4, 26.4), (26.6, 26.4)], 1.6, 'round'), L([(13.8, 21.0), (13.4, 26.4)], 1.3, 'flat'), L([(22.4, 21.0), (22.8, 26.4)], 1.3, 'flat'))
    return U(rotor, mast, body.difference(canopy), boom, fin.difference(C(2.6, 15.6, 2.2)), trot, wing, gun, skid)
I['heli'] = _heli()

# ---- ships, side view facing right
def hull(x0, x1, deck, keel, bow_rise=1.6, stern_cut=1.4):
    return Polygon([(x0, deck), (x1 - 3.0, deck), (x1, deck - bow_rise), (x1 - 3.6, keel), (x0 + stern_cut, keel)])

# FRIGATE: one superstructure block with a mast, gun forward
def _frig():
    h = hull(1.2, 31.0, 20.0, 25.6)
    sup = Polygon([(8.4, 20.2), (8.4, 15.6), (11.0, 15.6), (11.0, 12.6), (17.6, 12.6), (19.6, 15.6), (21.0, 15.6), (21.0, 20.2)])
    mast = U(Polygon([(13.4, 12.8), (14.4, 4.8), (15.2, 4.8), (16.2, 12.8)]), R(12.0, 7.6, 5.6, 1.1))
    gun = U(R(24.0, 17.6, 3.0, 2.6), L([(26.2, 18.4), (29.6, 17.6)], 1.1, 'flat'))
    win = R(12.6, 14.6, 4.6, 1.0)
    heli = R(2.4, 18.6, 5.0, 1.6)
    return U(h, sup.difference(win), mast, gun, heli)
I['frig'] = _frig()

# CRUISER: longer, two superstructure blocks and two masts, guns fore and aft
def _crui():
    h = hull(0.6, 31.4, 19.6, 25.8, 1.8)
    s1 = Polygon([(9.0, 19.8), (9.0, 14.6), (11.4, 14.6), (11.4, 11.2), (17.4, 11.2), (19.0, 14.6), (19.0, 19.8)])
    s2 = R(5.0, 15.6, 3.4, 4.4)
    m1 = U(Polygon([(13.4, 11.4), (14.2, 3.4), (15.0, 3.4), (15.8, 11.4)]), R(12.0, 6.0, 5.2, 1.1))
    m2 = U(Polygon([(5.8, 15.8), (6.4, 9.8), (7.0, 9.8), (7.6, 15.8)]))
    g1 = U(R(22.4, 17.2, 3.0, 2.6), L([(24.6, 18.0), (28.4, 17.0)], 1.1, 'flat'))
    g2 = U(R(1.8, 17.2, 2.8, 2.6))
    vls = R(19.6, 18.2, 2.4, 1.6)
    win = R(12.2, 13.0, 5.0, 1.0)
    return U(h, s1.difference(win), s2, m1, m2, g1, g2, vls)
I['crui'] = _crui()

# AIRCRAFT CARRIER: long flat flight deck overhanging the hull, island to starboard aft of centre
def _carr():
    h = Polygon([(3.0, 19.6), (29.0, 19.6), (27.6, 25.2), (4.6, 25.2)])
    deck = Polygon([(0.6, 17.4), (31.4, 17.4), (31.4, 19.8), (0.6, 19.8)])
    island = Polygon([(18.4, 17.6), (18.4, 11.4), (19.4, 10.2), (23.6, 10.2), (23.6, 17.6)])
    mast = U(R(20.4, 5.6, 1.1, 4.8), R(19.0, 7.4, 3.9, 1.0))
    win = R(19.6, 12.0, 3.0, 1.0)
    jet = sc(I['jet'], 0.26, 0, 0)
    jet = mv(rot(jet, 90, 0, 0), 12.4, 12.4)
    return U(h, deck, island.difference(win), mast, jet)
I['carr'] = _carr()

# ATTACK SUBMARINE: a long rounded hull with its sail, planes and rudder
def _sub():
    body = Polygon(bez((3.0, 19.8), (3.0, 15.8), (8.0, 15.4), (12.0, 15.4), 10) + [(25.0, 15.4)] + bez((25.0, 15.4), (29.8, 15.4), (31.4, 17.6), (31.4, 19.0), 8)
                   + bez((31.4, 19.0), (31.4, 21.0), (29.0, 22.6), (24.0, 22.6), 8) + [(8.0, 22.6)] + bez((8.0, 22.6), (4.6, 22.6), (3.0, 21.6), (3.0, 19.8), 6)).buffer(0)
    sail = Polygon([(17.0, 15.6), (17.8, 9.4), (23.6, 9.4), (24.6, 15.6)])
    planes = R(15.6, 11.4, 9.8, 1.4)
    peri = R(20.6, 5.8, 1.2, 3.8)
    rud = Polygon([(1.4, 13.6), (3.2, 13.6), (5.2, 18.6), (5.2, 21.4), (3.2, 25.6), (1.4, 25.6)])
    return U(body, sail, planes, peri, rud)
I['sub'] = _sub()

# CARGO SHIP: hull, bridge and funnel aft, stacked containers
def _cargo():
    h = hull(0.8, 31.4, 19.4, 25.6, 2.0, 1.0)
    bridge = Polygon([(2.4, 19.6), (2.4, 9.6), (8.6, 9.6), (8.6, 19.6)])
    win = R(3.4, 11.0, 4.2, 1.1)
    fun = R(3.6, 6.0, 2.6, 3.8)
    boxes = []
    for x, rows in ((10.0, 3), (14.6, 4), (19.2, 4), (23.8, 3)):
        for j in range(rows):
            boxes.append(R(x, 19.6 - 2.8*(j + 1), 4.2, 2.4))
    return U(h, bridge.difference(win), fun, *boxes)
I['cargo'] = _cargo()

# ---- missiles
# CRUISE MISSILE: slim body, small mid wings and tail fins, flying up to the right
def _cm():
    body = U(RR(4.0, 14.4, 21.0, 3.2, 1.6), Polygon([(23.0, 14.4), (26.6, 14.8), (28.6, 16.0), (26.6, 17.2), (23.0, 17.6)]))
    wing = U(Polygon([(12.0, 14.6), (16.4, 8.4), (18.0, 8.4), (16.4, 14.6)]), Polygon([(12.0, 17.4), (16.4, 23.6), (18.0, 23.6), (16.4, 17.4)]))
    tail = U(Polygon([(3.4, 14.6), (2.2, 10.6), (3.8, 10.6), (7.2, 14.6)]), Polygon([(3.4, 17.4), (2.2, 21.4), (3.8, 21.4), (7.2, 17.4)]))
    inlet = Polygon([(9.4, 17.4), (12.8, 17.4), (11.6, 19.4), (9.4, 19.4)])
    return rot(U(body, wing, tail, inlet), -40, 16, 16)
I['cm'] = _cm()

# BALLISTIC MISSILE: upright, pointed nose, broad fins at the base
def _bm():
    nose = Polygon(bez((12.6, 10.0), (12.6, 5.6), (14.6, 2.6), (16.0, 1.0), 10) + bez((16.0, 1.0), (17.4, 2.6), (19.4, 5.6), (19.4, 10.0), 10)).buffer(0)
    body = R(12.6, 9.8, 6.8, 16.2)
    fins = U(Polygon([(12.6, 18.4), (7.4, 25.6), (7.4, 29.4), (12.6, 26.0)]), Polygon([(19.4, 18.4), (24.6, 25.6), (24.6, 29.4), (19.4, 26.0)]))
    noz = Polygon([(13.6, 26.0), (18.4, 26.0), (19.4, 29.6), (12.6, 29.6)])
    band = R(11.0, 10.6, 10.0, 1.1)
    return U(nose, body.difference(band), fins, noz)
I['bm'] = _bm()

# ICBM: a tall three-stage rocket, blunt warhead, on its exhaust flame
def _icbm():
    nose = Polygon(bez((13.4, 8.0), (13.4, 4.0), (14.8, 1.8), (16.0, 1.0), 8) + bez((16.0, 1.0), (17.2, 1.8), (18.6, 4.0), (18.6, 8.0), 8)).buffer(0)
    body = R(13.0, 7.8, 6.0, 15.4)
    cuts = U(R(11.0, 12.0, 10.0, 1.0), R(11.0, 17.2, 10.0, 1.0))
    fins = U(Polygon([(13.0, 19.4), (10.0, 23.2), (13.0, 23.2)]), Polygon([(19.0, 19.4), (22.0, 23.2), (19.0, 23.2)]))
    flame = Polygon(bez((12.6, 24.4), (12.4, 27.2), (14.6, 29.0), (16.0, 31.2), 8) + bez((16.0, 31.2), (17.4, 29.0), (19.6, 27.2), (19.4, 24.4), 8)).buffer(0)
    flame = flame.difference(Polygon(bez((14.6, 24.4), (14.8, 26.4), (15.4, 27.4), (16.0, 28.6), 6) + bez((16.0, 28.6), (16.6, 27.4), (17.2, 26.4), (17.4, 24.4), 6)).buffer(0))
    return U(nose, body.difference(cuts), fins, flame)
I['icbm'] = _icbm()

# MIXED STACK: three stacked counters (sheets) seen at an angle
def _stack():
    out = None
    hw, hh, T = 12.2, 5.6, 2.2
    def slab(cx, cy, m=0):
        return Polygon([(cx - hw - m*2, cy), (cx, cy - hh - m), (cx + hw + m*2, cy), (cx + hw + m*2, cy + T + m*0.6), (cx, cy + hh + T + m), (cx - hw - m*2, cy + T + m*0.6)])
    layers = [(16, 24.2), (16, 16.2), (16, 8.2)]
    g = None
    for i, (cx, cy) in enumerate(layers):
        s = slab(cx, cy)
        if g is None: g = s
        else: g = g.difference(slab(cx, cy, 1.4)).union(s)
        rim = L([(cx - hw + 1.0, cy + 0.5), (cx, cy + hh - 0.1), (cx + hw - 1.0, cy + 0.5)], 0.9, 'flat')
        g = g.difference(rim)
    return g
I['stack'] = _stack()

# SUPPLY TRUCK (supply runs)
I['truck'] = U(truck(), R(2.6, 9.6, 18.6, 8.4).difference(R(4.0, 11.2, 15.8, 1.1)))

ORDER = ['inf', 'mot', 'at', 'spec', 'para', 'ifv', 'tank', 'art', 'mlrs', 'sam', 'jam', 'heli', 'jet', 'int', 'asf', 'bomb', 'stealth', 'mpa', 'awacs',
         'drone', 'drone4', 'sdrone', 'swarm', 'frig', 'crui', 'carr', 'sub', 'cargo', 'cm', 'bm', 'icbm', 'stack', 'truck']

def fit(g, m=1.0):
    """scale and centre a shape to fill the box, m units from its edges (wide shapes span the width, tall ones the height)"""
    minx, miny, maxx, maxy = g.bounds
    f = (32 - 2*m)/max(maxx - minx, maxy - miny)
    g = affinity.scale(g, f, f, origin=(minx, miny))
    return affinity.translate(g, 16 - (minx + (maxx - minx)*f/2) , 16 - (miny + (maxy - miny)*f/2))

def path_d(g, tol=0.035):
    g = g.buffer(0).simplify(tol, preserve_topology=True)
    polys = [g] if isinstance(g, Polygon) else list(g.geoms)
    out = []
    f = lambda v: ('%.2f' % v).rstrip('0').rstrip('.') if abs(v) >= 0.005 else '0'
    for p in polys:
        if p.is_empty or p.area < 0.05: continue
        p = orient(p, sign=-1.0)   # y points down: shapely's 'clockwise' is screen counter-clockwise; outer and inner rings opposite either way
        for ring in [p.exterior] + list(p.interiors):
            cs = list(ring.coords)[:-1]
            out.append('M' + 'L'.join(f(x) + ' ' + f(y) for x, y in cs) + 'Z')
    return ''.join(out)

def table():
    rows = []
    for k in ORDER:
        g = fit(I[k])
        rows.append("  %s:'%s'," % (k if re.match(r'^[a-z_]\w*$', k) else repr(k), path_d(g)))
    return 'const UICON_D = {\n' + '\n'.join(rows) + '\n};'

if __name__ == '__main__':
    js = table()
    if '--write' in sys.argv:
        fn = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'index.html')
        src = open(fn, encoding='utf-8').read()
        a, b = '// @UICON-BEGIN (generated by tools/icons.py --write; edit the shapes there)\n', '\n// @UICON-END'
        i, j = src.index(a), src.index(b)
        src = src[:i + len(a)] + js + src[j:]
        open(fn, 'w', encoding='utf-8').write(src)
        print('wrote', len(js), 'chars')
    elif '--json' in sys.argv:
        import json; print(json.dumps({k: path_d(fit(I[k])) for k in ORDER}))
    else:
        print(js)
