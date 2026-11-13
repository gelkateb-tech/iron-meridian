#!/usr/bin/env python3
# Real borders for the map: every province of both maps (world.js as it is, and the nations world's split map) drawn from the real shapes of
# Natural Earth admin-1 states and provinces 1:10m (public domain; the file world.js was built from), not from the cell edges.
#   python3 tools/build-borders.py <ne_10m_admin_1_states_provinces.geojson>
#     (https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson; needs node,
#      Python 3 with numpy and shapely 2)
# Writes borders.js (window.BORDERS: the shared arcs at the far-zoom level of detail, and which province lies on each side of each arc on
# each map) and borders-hi.js (window.BORDERS_HI: the same arcs at full detail, loaded by the page at close zoom only).
# How a province gets its shape (the game rules keep the cells; only the drawing changes):
#  1. every cell's real region: the regions are rasterized exactly as tools/build-world2.js does it (its scanline fill at the cell centre, run
#     in node with the same code, so the result is the same to the last bit); a cell's region is the first region whose fill covers it;
#  2. per map, a region whose cells all belong to one province is drawn whole for that province (a province made of several regions is
#     their union: the lines between them are not drawn); a region with no cell of its own (a speck, an islet) goes to the province of the
#     nearest cell of its country; a region of a country the map leaves out (Luxembourg, Andorra, ...) is land of no province (its border
#     with its neighbours is drawn as a country border, its land is not tinted);
#  3. a region whose cells belong to several provinces (a large region that tools/build-world2.js cut along towns, a split province of the
#     nations world, tools/provsplit.json) is cut along the cells: around the region every cell takes the province of the nearest cell of
#     the region (a breadth-first growth), the lines between them are smoothed exactly as the page used to smooth province edges (neighbour
#     averaging, then two Chaikin passes; junctions fixed), and the region's real shape is cut along them. Those cut lines are the only ones
#     that do not come from Natural Earth: the region has no real line there;
#  4. all regions and cut lines are noded together into one planar map (shapely/GEOS), so two neighbours always share the very same line:
#     each line is stored once (an arc) with the province on its left and on its right on each map (-1 sea, -2 land of no province).
#     Natural Earth's own slivers (a gap or an overlap between two regions thinner than 3 km) go to the neighbour they share the most edge
#     with (an overlap to the region listed first, as the rasterizer does);
#  5. the projection is the one of tools/build-world2.js and tools/build-coast.js (Miller, the grid's columns and rows); coordinates are
#     quantised to 1/Q cell (Q = 1000: about 65 m, 0.14 css px at the deepest zoom) and delta-encoded; borders-hi.js keeps every point
#     (only points that fall on the same quantised spot are merged); borders.js is the far-zoom level of detail: each arc thinned with its
#     ends kept, to under LO_TOL world units (a fifth of a css px at the closest zoom it is drawn at, so it looks the same there).
import json, math, os, subprocess, sys, time
import numpy as np
import shapely
from shapely.geometry import Polygon, MultiPolygon, LineString, MultiLineString, Point, box
from shapely.geometry.polygon import orient
from shapely.ops import unary_union, polygonize
from shapely.strtree import STRtree

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
Q = 1000                      # quantisation: points per cell (grid unit)
HS, SQ3 = 4.0, math.sqrt(3)   # the page's cell radius (world units) and the grid's scale: a column is HS*SQ3 world units, a row HS*1.5
SX, SY = HS*SQ3, HS*1.5
LO_TOL = 0.06                 # borders.js: Douglas-Peucker tolerance in world units (the page draws it below hexPx 40, 3.33 px a world unit: 0.2 px)
SLIVER = 0.045                # a face with no region and a width (2 area / perimeter) under this many cells (3 km) is a sliver, not a lake or sea

NODE = r"""
'use strict';
const fs = require('fs'), path = require('path'), ROOT = process.argv[1];
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const R = new Function("'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn {mapOf, MAP_NEW};')();
const W = WORLD.W, H = WORLD.H, LON0 = WORLD.lon0, N = W*H;
const miller = lat => 1.25*Math.log(Math.tan(Math.PI/4 + 0.4*lat*Math.PI/180));
const YMAX = miller(WORLD.latN), YMIN = miller(WORLD.latS);
const projX = lon => ((lon - LON0) % 360 + 360) % 360/360*W - 0.5;
const projY = lat => (YMAX - miller(Math.max(-85, Math.min(85, lat))))/(YMAX - YMIN)*(H - 1);
const ADM = JSON.parse(fs.readFileSync(process.argv[2])), feats = ADM.features.filter(f => f.geometry && f.properties.admin !== 'Antarctica');
// tools/build-world2.js's rasterizer, verbatim
function rasterize(g, set){ const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  for (const poly of polys){ const rows = new Map();
    for (const ring of poly){ let prev = null; const pts = [];
      for (const [lon, lat] of ring){ let x = projX(lon); if (prev !== null){ while (x - prev > W/2) x -= W; while (prev - x > W/2) x += W; } pts.push([x, projY(lat)]); prev = x; }
      for (let i = 0; i < pts.length - 1; i++){ const [x1, y1] = pts[i], [x2, y2] = pts[i + 1]; if (y1 === y2) continue; const lo = Math.min(y1, y2), hi = Math.max(y1, y2);
        for (let r = Math.max(0, Math.ceil(lo)); r < hi && r < H; r++){ if (r < lo) continue; const x = x1 + (x2 - x1)*(r - y1)/(y2 - y1); let a = rows.get(r); if (!a) rows.set(r, a = []); a.push(x); } } }
    for (const [r, xs] of rows){ xs.sort((a, b) => a - b); const off = 0.5*(r & 1); for (let j = 0; j + 1 < xs.length; j += 2) for (let c = Math.ceil(xs[j] - off); c + off < xs[j + 1]; c++) set(r*W + ((c % W) + W) % W); } } }
const reg = new Int32Array(N).fill(-1);
feats.forEach((f, k) => rasterize(f.geometry, i => { if (reg[i] < 0) reg[i] = k; }));
// a region smaller than a cell still claims the cell at its centre if nobody else has it (tools/build-world2.js, verbatim)
const lonLatToCell = (lon, lat) => { const r = Math.round(projY(lat)); if (r < 0 || r >= H) return -1; const c = ((Math.round(projX(lon) - 0.5*(r & 1)) % W) + W) % W; return r*W + c; };
{ const has = new Uint8Array(feats.length); for (let i = 0; i < N; i++) if (reg[i] >= 0) has[reg[i]] = 1;
  feats.forEach((f, k) => { if (has[k]) return; const g = f.geometry, ring = g.type === 'Polygon' ? g.coordinates[0] : g.coordinates.reduce((a, p) => p[0].length > a.length ? p[0] : a, []); if (!ring.length) return;
    let sx = 0, sy = 0; for (const [lo, la] of ring){ sx += lo; sy += la; } const c = lonLatToCell(sx/ring.length, sy/ring.length); if (c >= 0 && reg[c] < 0) reg[c] = k; }); }
// the region polygons in grid units (each ring made continuous across the antimeridian the way the rasterizer does it)
const geo = feats.map(f => { const g = f.geometry, polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  return polys.map(poly => poly.map(ring => { let prev = null; const o = []; for (const [lon, lat] of ring){ let x = projX(lon); if (prev !== null){ while (x - prev > W/2) x -= W; while (prev - x > W/2) x += W; } o.push(x, projY(lat)); prev = x; } return o; })); });
const maps = [];
for (const v of [0, R.MAP_NEW]){ const G = R.mapOf(v); maps.push({v, prov:Array.from(G.prov), P:G.P.map(P => P.sea ? -1 : P.country), names:G.countries.map(c => c.name)}); }
process.stdout.write(JSON.stringify({W, H, reg:Array.from(reg), maps, geo, admin:feats.map(f => f.properties.admin), name:feats.map(f => f.properties.name || '')}));
"""
RENAME = {'United Republic of Tanzania':'Tanzania', 'Republic of Serbia':'Serbia', 'Republic of the Congo':'Congo', 'Democratic Republic of the Congo':'Dem. Rep. Congo',
  'Czech Republic':'Czechia', 'Ivory Coast':"Côte d'Ivoire", 'Central African Republic':'Central African Rep.', 'Bosnia and Herzegovina':'Bosnia and Herz.', 'The Bahamas':'Bahamas',
  'Guinea Bissau':'Guinea-Bissau', 'Swaziland':'Eswatini', 'East Timor':'Timor-Leste', 'Hong Kong S.A.R.':'China', 'Macau S.A.R':'China', 'Baykonur Cosmodrome':'Kazakhstan',
  'Siachen Glacier':'India', 'Northern Cyprus':'Cyprus', 'Dhekelia Sovereign Base Area':'Cyprus', 'Akrotiri Sovereign Base Area':'Cyprus', 'Gaza Strip':'Palestine', 'West Bank':'Palestine',
  'US Naval Base Guantanamo Bay':'Cuba', 'Puerto Rico':'United States of America', 'Western Sahara':'W. Sahara', 'Republic of Congo':'Congo', 'Sao Tome and Principe':'São Tomé and Principe',
  'Equatorial Guinea':'Eq. Guinea', 'Dominican Republic':'Dominican Rep.', 'French Southern and Antarctic Lands':'Fr. S. Antarctic Lands', 'Aland':'Finland', 'Gibraltar':'United Kingdom', 'Jersey':'United Kingdom', 'Guernsey':'United Kingdom', 'Isle of Man':'United Kingdom'}

def log(*a): print(*a, flush=True)
T0 = time.time()
def lap(s): log('%6.1fs  %s' % (time.time() - T0, s))

# ---------------------------------------------------------------- 1. cells, maps and region shapes (node)
def load(src):
  r = subprocess.run(['node', '-e', NODE, os.path.abspath(ROOT), src], check=True, capture_output=True)
  return json.loads(r.stdout)

# hex grid (as tools/build-world2.js): neighbours by row parity; corners in sixths of a grid unit (integers: no rounding when matching)
NB_EVEN = [(1, 0), (0, -1), (-1, -1), (-1, 0), (-1, 1), (0, 1)]; NB_ODD = [(1, 0), (1, -1), (0, -1), (-1, 0), (0, 1), (1, 1)]
CORN = [(3, 2), (0, 4), (-3, 2), (-3, -2), (0, -4), (3, -2)]   # corner k at 60k+30 degrees (y down), x and y in sixths of a column / row
def edge6(c, r, d):   # the edge of cell (c, r) towards neighbour d, as two corners in sixths (the page's edge(): corners (5 - d) % 6 and (6 - d) % 6)
  cx, cy = 6*c + 3*(r & 1), 6*r; a, b = CORN[(5 - d + 6) % 6], CORN[(6 - d) % 6]
  return (cx + a[0], cy + a[1]), (cx + b[0], cy + b[1])

def smooth(pts, closed):
  # the page's old province-edge smoothing (buildChains): neighbour averaging (1-3 passes by length), then two Chaikin passes; open ends fixed
  m0 = len(pts); passes = 1 if m0 < 4 else 2 if m0 < 10 else 3
  for _ in range(passes):
    m = len(pts); q = [p for p in pts]
    for i in range(m):
      prev = pts[i - 1] if i > 0 else (pts[m - 2] if closed else None); nxt = pts[i + 1] if i < m - 1 else (pts[1] if closed else None)
      if prev is None or nxt is None: continue
      q[i] = ((prev[0] + 2*pts[i][0] + nxt[0])/4, (prev[1] + 2*pts[i][1] + nxt[1])/4)
    if closed: q[m - 1] = q[0]
    pts = q
  for _ in range(2):
    q = []; m = len(pts)
    if not closed: q.append(pts[0])
    for i in range(m - 1):
      p0, p1 = pts[i], pts[i + 1]; q.append((p0[0]*0.75 + p1[0]*0.25, p0[1]*0.75 + p1[1]*0.25)); q.append((p0[0]*0.25 + p1[0]*0.75, p0[1]*0.25 + p1[1]*0.75))
    if not closed: q.append(pts[m - 1])
    else: q.append(q[0])
    pts = q
  return pts

def chains_of(segs):
  # segments {(a, b) pair: [(p, q), ...]} -> chains per pair: open ones from a vertex used once (a junction), the rest closed loops
  out = []
  for pair, arr in segs.items():
    adj = {}
    for i, (p, q) in enumerate(arr): adj.setdefault(p, []).append(i); adj.setdefault(q, []).append(i)
    used = [False]*len(arr)
    def walk(s0, start):
      pts = [start]; cur, key = s0, start
      while True:
        used[cur] = True; p, q = arr[cur]; nxt = q if p == key else p; pts.append(nxt); key = nxt
        n = next((t for t in adj[key] if not used[t]), None)
        if n is None: return pts
        cur = n
    for v, l in adj.items():
      if len(l) == 1 and not used[l[0]]: out.append((pair, walk(l[0], v)))
    for i in range(len(arr)):
      if not used[i]: out.append((pair, walk(i, arr[i][0])))
  return out

def main():
  if len(sys.argv) < 2: print('usage: python3 tools/build-borders.py <ne_10m_admin_1_states_provinces.geojson>'); sys.exit(2)
  D = load(sys.argv[1]); W, H = D['W'], D['H']; reg = np.array(D['reg'], dtype=np.int32); NR = len(D['geo']); maps = D['maps']; NM = len(maps)
  lap('cells: %d regions, maps %s' % (NR, [m['v'] for m in maps]))
  # ---- region polygons (grid units), cut to the world's rows (the page's world spans rows -2 .. H + 1)
  Y0, Y1 = -2.0, H + 1.0
  polys = []
  for k, parts in enumerate(D['geo']):
    ps = []
    for poly in parts:
      rings = [np.array(r, dtype=float).reshape(-1, 2) for r in poly]
      ext = rings[0]; cx = ext[:, 0].mean()
      sh = -W if cx > W - 0.5 else W if cx < -0.5 else 0   # a ring mostly past the seam: moved a turn back into the world
      try: pg = Polygon(ext + [sh, 0], [r + [sh, 0] for r in rings[1:]])
      except Exception: continue
      if not pg.is_valid: pg = shapely.make_valid(pg)
      ps.append(pg)
    g = unary_union(ps) if ps else Polygon()
    g = g.intersection(box(-W, Y0, 2*W, Y1))
    g = shapely.make_valid(g)
    polys.append(MultiPolygon([p for p in getattr(g, 'geoms', [g]) if isinstance(p, Polygon) and not p.is_empty]) if g.geom_type != 'Polygon' else MultiPolygon([g]))
  lap('region polygons')
  country_of = [RENAME.get(a, a) for a in D['admin']]
  # ---- per map, per region: its provinces (by its cells)
  cellsOf = [[] for _ in range(NR)]
  for i in np.nonzero(reg >= 0)[0]: cellsOf[reg[i]].append(int(i))
  def cxy(i): c, r = i % W, i // W; return (c + 0.5*(r & 1), r)
  regProv = []   # per map: per region an int (one province, -2 none) or None (cut along cells)
  splitLines = []   # all cut lines (clipped to their region), shared by the maps
  splitInfo = {}    # (map, region) -> (shapely polygons per label for the region's window, labels)
  for mi, M in enumerate(maps):
    prov = M['prov']; P = M['P']; names = M['names']; cidx = {n: i for i, n in enumerate(names)}
    land = lambda i: prov[i] >= 0 and P[prov[i]] >= 0
    # land cells by country, for the nearest-cell rule
    byC = {}
    for i in range(W*H):
      if land(i): byC.setdefault(P[prov[i]], []).append(i)
    byCxy = {c: (np.array(l), np.array([cxy(i) for i in l])) for c, l in byC.items()}
    rp = [None]*NR; nsplit = nnear = nnone = 0
    for k in range(NR):
      cs = [i for i in cellsOf[k] if land(i)]; ps = sorted(set(prov[i] for i in cs))
      if len(ps) == 1: rp[k] = ps[0]; continue
      if not ps:
        c = cidx.get(country_of[k])
        if c is None or c not in byCxy or polys[k].is_empty: rp[k] = -2; nnone += 1; continue
        pt = polys[k].representative_point(); ids, xy = byCxy[c]
        dx = (xy[:, 0] - pt.x); dx = (dx + W/2) % W - W/2
        d = (dx*SX)**2 + ((xy[:, 1] - pt.y)*SY)**2; rp[k] = prov[int(ids[int(np.argmin(d))])]; nnear += 1; continue
      rp[k] = None; nsplit += 1
    regProv.append(rp)
    lap('map %d: %d regions cut along cells, %d given to the nearest province, %d of no province' % (M['v'], nsplit, nnear, nnone))
  # ---- the cut lines of every region cut on any map
  for mi, M in enumerate(maps):
    prov = M['prov']; P = M['P']
    land = lambda i: prov[i] >= 0 and P[prov[i]] >= 0
    for k in range(NR):
      if regProv[mi][k] is not None: continue
      x0, y0, x1, y1 = polys[k].bounds
      r0, r1 = int(math.floor(y0)) - 3, int(math.ceil(y1)) + 3   # (past the grid's first and last rows too: the shapes reach rows -2 and H + 1)
      c0, c1 = int(math.floor(x0)) - 4, int(math.ceil(x1)) + 4
      lab = {}; q = []
      for r in range(r0, r1 + 1):
        for c in range(c0, c1 + 1):
          i = r*W + (c % W)
          if 0 <= r < H and reg[i] == k and land(i): lab[(c, r)] = prov[i]; q.append((c, r))
      h = 0
      while h < len(q):
        c, r = q[h]; h += 1; o = NB_ODD if r & 1 else NB_EVEN
        for dc, dr in o:
          n = (c + dc, r + dr)
          if n[1] < r0 or n[1] > r1 or n[0] < c0 or n[0] > c1 or n in lab: continue
          lab[n] = lab[(c, r)]; q.append(n)
      segs = {}
      for (c, r), l in lab.items():
        o = NB_ODD if r & 1 else NB_EVEN
        for d, (dc, dr) in enumerate(o):
          n = (c + dc, r + dr); m = lab.get(n, -999)
          if m == l: continue
          if m != -999 and (n[1], n[0]) < (r, c): continue   # each inner edge once
          a, b = edge6(c, r, d); segs.setdefault((min(l, m), max(l, m)), []).append((a, b))
      lines = []
      for pair, pts in chains_of(segs):
        closed = len(pts) > 2 and pts[0] == pts[-1]
        sm = smooth([(x/6.0, y/6.0) for x, y in pts], closed)
        lines.append((pair, sm))
      faces = list(polygonize(unary_union([LineString(p) for _, p in lines])))
      keys = list(lab.keys()); pts = np.array([(c + 0.5*(r & 1), r) for c, r in keys]); labs = np.array([lab[x] for x in keys])
      flab = []
      for f in faces:
        inside = shapely.contains_xy(f, pts[:, 0], pts[:, 1]); ls = labs[inside]
        if len(ls): v, cnt = np.unique(ls, return_counts=True); flab.append(int(v[np.argmax(cnt)]))
        else:
          rp_ = f.representative_point(); d = (pts[:, 0] - rp_.x)**2 + (pts[:, 1] - rp_.y)**2; flab.append(int(labs[int(np.argmin(d))]))
      splitInfo[(mi, k)] = (faces, flab, STRtree(faces))
      inner = [LineString(p) for pair, p in lines if pair[0] != -999]
      if inner:
        cut = unary_union(inner).intersection(polys[k])
        for g in getattr(cut, 'geoms', [cut]):
          if g.geom_type == 'LineString' and not g.is_empty: splitLines.append(g)
          elif g.geom_type == 'MultiLineString': splitLines.extend(g.geoms)
  lap('cut lines: %d pieces' % len(splitLines))
  # ---- one planar map of every region boundary and cut line
  bl = []
  for g in polys:
    for p in g.geoms:
      bl.append(LineString(p.exterior.coords)); bl.extend(LineString(r.coords) for r in p.interiors)
  noded = unary_union(bl + splitLines)
  edges = list(noded.geoms) if hasattr(noded, 'geoms') else [noded]
  lap('noded: %d edges' % len(edges))
  faces = list(polygonize(edges))
  lap('faces: %d' % len(faces))
  # ---- each face's region: the first region containing it; none: water (wide) or a sliver (thin, given to a neighbour below)
  rtree = STRtree([p for p in polys])
  fpts = [f.representative_point() for f in faces]
  freg = np.full(len(faces), -1, dtype=np.int64)
  hits = rtree.query(fpts, predicate='within')   # pairs (face index, region index)
  for fi, k in zip(hits[0], hits[1]):
    if freg[fi] < 0 or k < freg[fi]: freg[fi] = k
  sliver = np.zeros(len(faces), dtype=bool)
  for fi, f in enumerate(faces):
    if freg[fi] < 0 and 2*f.area/max(f.length, 1e-9) < SLIVER: sliver[fi] = True
  lap('faces in no region: %d (%d slivers)' % (int((freg < 0).sum()), int(sliver.sum())))
  # face -> province per map
  def faceProv(mi, fi):
    k = freg[fi]
    if k < 0: return -1
    v = regProv[mi][k]
    if v is not None: return v
    fs_, fl, tr = splitInfo[(mi, k)]
    pt = fpts[fi]; c = tr.query(pt, predicate='within')
    if len(c): return fl[int(c[0])]
    d = [fs_[j].distance(pt) for j in range(len(fs_))]; return fl[int(np.argmin(d))]
  FP = np.array([[faceProv(mi, fi) for mi in range(NM)] for fi in range(len(faces))], dtype=np.int64).reshape(len(faces), NM)
  # ---- directed segments -> the face on their left
  segFace = {}
  for fi, f in enumerate(faces):
    f = orient(f, 1.0)
    for ring in [f.exterior] + list(f.interiors):
      cs = list(ring.coords)
      for a, b in zip(cs, cs[1:]): segFace[(a, b)] = fi
  def side(e):
    cs = list(e.coords); a, b = cs[0], cs[1]
    return segFace.get((a, b), -1), segFace.get((b, a), -1)
  ES = [side(e) for e in edges]
  # slivers take the labels of the neighbour they share the most edge with (a neighbour with a region; repeated for sliver chains)
  for _ in range(4):
    share = {}
    for e, (l, r) in zip(edges, ES):
      for a, b in ((l, r), (r, l)):
        if a >= 0 and sliver[a] and b >= 0 and not sliver[b]: share.setdefault(a, {}); share[a][b] = share[a].get(b, 0) + e.length
    if not share: break
    for a, d in share.items():
      b = max(d, key=d.get); FP[a] = FP[b]; sliver[a] = False
  lap('labels done')
  def labs(fi): return tuple(int(v) for v in FP[fi]) if fi >= 0 else tuple([-1]*NM)
  # ---- arcs: edges with a different province on the two sides (on either map), joined end to end through points where nothing changes
  E = []
  for e, (l, r) in zip(edges, ES):
    L, R = labs(l), labs(r)
    if L == R: continue
    E.append([list(e.coords), L, R])
  deg = {}
  for cs, L, R in E:
    for p in (cs[0], cs[-1]): deg[p] = deg.get(p, 0) + 1
  at = {}
  for i, (cs, L, R) in enumerate(E):
    at.setdefault(cs[0], []).append(i); at.setdefault(cs[-1], []).append(i)
  used = [False]*len(E); arcs = []
  def nextE(end, L, R):
    if deg[end] != 2: return None
    for j in at[end]:
      if used[j]: continue
      cj, Lj, Rj = E[j]
      if cj[0] == end and (Lj, Rj) == (L, R): return j, list(cj)
      if cj[-1] == end and (Rj, Lj) == (L, R): return j, list(reversed(cj))
    return None
  for i in range(len(E)):
    if used[i]: continue
    cs, L, R = E[i]; used[i] = True; pts = list(cs)
    while True:   # forward from its end
      n = nextE(pts[-1], L, R)
      if not n: break
      used[n[0]] = True; pts.extend(n[1][1:])
    while True:   # backward from its start (an edge read so that it ends there)
      n = nextE(pts[0], R, L)
      if not n: break
      used[n[0]] = True; pts = list(reversed(n[1]))[:-1] + pts
    arcs.append((pts, L, R))
  lap('arcs: %d' % len(arcs))
  return D, arcs, maps

def quant(pts):
  o = []; last = None
  for x, y in pts:
    q = (int(round(x*Q)), int(round(y*Q)))
    if q != last: o.append(q); last = q
  return o

def dp(pts, tol):
  # Douglas-Peucker on world units (columns and rows scaled), ends kept
  n = len(pts)
  if n < 3: return pts
  P = np.array(pts, dtype=float); Xw = P[:, 0]*SX/Q; Yw = P[:, 1]*SY/Q
  keep = np.zeros(n, dtype=bool); keep[0] = keep[-1] = True; st = [(0, n - 1)]
  if pts[0] == pts[-1] and n > 3:   # a closed loop: split at its farthest point first
    d = (Xw - Xw[0])**2 + (Yw - Yw[0])**2; f = int(np.argmax(d)); keep[f] = True; st = [(0, f), (f, n - 1)]
  while st:
    a, b = st.pop()
    if b - a < 2: continue
    ax, ay, bx, by = Xw[a], Yw[a], Xw[b], Yw[b]; dx, dy = bx - ax, by - ay; L = math.hypot(dx, dy)
    xs, ys = Xw[a + 1:b] - ax, Yw[a + 1:b] - ay
    d = np.abs(xs*dy - ys*dx)/L if L > 1e-12 else np.hypot(xs, ys)
    m = int(np.argmax(d))
    if d[m] > tol: keep[a + 1 + m] = True; st += [(a, a + 1 + m), (a + 1 + m, b)]
  return [p for p, k in zip(pts, keep) if k]

ALPH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
def enc(pts):
  # zigzag varints in 5 bits per character (a 6th bit: more follows), the first point absolute, then deltas
  out = []; px = py = 0
  for x, y in pts:
    for v in (x - px, y - py):
      z = v << 1 if v >= 0 else ((-v) << 1) - 1
      while z >= 32: out.append(ALPH[32 | (z & 31)]); z >>= 5
      out.append(ALPH[z])
    px, py = x, y
  return ''.join(out)

def write(D, arcs, maps):
  hi, lo = [], []
  for pts, L, R in arcs:
    q = quant(pts)
    if len(q) < 2: q = [q[0], q[0]]
    hi.append(q); lo.append(dp(q, LO_TOL))
  NM = len(maps)
  lab = [{'v': maps[mi]['v'], 'l': [L[mi] for _, L, R in arcs], 'r': [R[mi] for _, L, R in arcs]} for mi in range(NM)]
  head = ('// Generated by tools/build-borders.py from Natural Earth admin-1 states and provinces 1:10m (public domain): the real province and country\n'
          '// borders, as shared arcs (each border stored once) in grid units at 1/%d cell, delta-encoded zigzag varints (5 bits a character).\n' % Q)
  lo_s = 'window.BORDERS = ' + json.dumps({'v': 1, 'q': Q, 'n': len(arcs), 'tol': LO_TOL, 'maps': lab, 'arcs': [enc(a) for a in lo]}, separators=(',', ':')) + ';\n'
  hi_s = 'window.BORDERS_HI = ' + json.dumps({'v': 1, 'q': Q, 'n': len(arcs), 'arcs': [enc(a) for a in hi]}, separators=(',', ':')) + ';\n'
  for f, s, what in (('borders.js', lo_s, 'far-zoom level of detail (Douglas-Peucker %.2f world units, ends kept)' % LO_TOL), ('borders-hi.js', hi_s, 'every point (close zoom, loaded lazily)')):
    open(os.path.join(ROOT, f), 'w').write(head + '// This file: ' + what + '.\n' + s)
  log('arcs %d; points: hi %d, lo %d; borders.js %d KB, borders-hi.js %d KB' % (len(arcs), sum(len(a) for a in hi), sum(len(a) for a in lo),
      os.path.getsize(os.path.join(ROOT, 'borders.js'))//1024, os.path.getsize(os.path.join(ROOT, 'borders-hi.js'))//1024))

if __name__ == '__main__':
  D, arcs, maps = main()
  write(D, arcs, maps)
