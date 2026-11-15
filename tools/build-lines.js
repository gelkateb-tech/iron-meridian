// Builds lines.js: rivers, roads and railways from Natural Earth (public domain), projected onto the game's hex grid,
// plus which province borders are river lines and which neighbouring provinces a road or a railway links.
// usage: node tools/build-lines.js <rivers.geojson | --keep-rivers> <roads.geojson> [<railroads.geojson>]
//   (ne_10m_rivers_lake_centerlines, ne_10m_roads, ne_10m_railroads; https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/)
//   --keep-rivers: the rivers and river borders of lines.js as they are (Natural Earth's river file has changed upstream since lines.js was made:
//   a rebuild from today's file would move 94 river borders, a rules change of its own)
// Then the movement network (tools/roadnet.js, MAP-3): the levels of the road links (every province with a land neighbour gets a road), each
// link's way from province centre to province centre along the roads, the generated roads where Natural Earth has none, and the sea lanes.
// Output (window.LINES):
//   rivers   [[scalerank, x0, y0, x1, y1, ...]]           grid coords x20
//   roads    [[class, x0, y0, dx, dy, ...]]  (delta:1)     class 3 highway (expressways), 2 road, 1 track (minor roads)
//   rails    [[level, x0, y0, dx, dy, ...]]                     level 1 railway (NE has no high-speed flag; high-speed is built in game)
//   riverPairs [[a, b]]                                    province borders that run along a river
//   roadPairs  [[a, b, level(, 1 = generated)]]            neighbouring provinces linked by a road: 1 track, 2 road, 3 highway
//                                                          (1 = generated: no Natural Earth road crosses between them; its way is a new road)
//   railPairs  [[a, b, level]]                            neighbouring provinces linked by rail
//   gapPairs   count of the generated links (informational)
//   net        the movement network (tools/roadnet.js; Q = grid x20 integers, as above; ways delta-coded after the first point):
//     ins      [road, k, dX, dY, ...]   junctions on the Natural Earth roads (flat): a point inserted into roads[road] after its k-th point,
//              at that point plus (dX, dY); road as an offset from the entry before's
//     roads    [[class, X0, Y0, dX, dY, ...]]   generated roads (where a link's way leaves the Natural Earth roads); X0, Y0 an offset from the line before's
//     links    [[a, b, forks]]   each road link's way from province a's centre (P.x, P.y) to b's (a < b) over the points of the roads: the
//              choice at each fork, one base-36 digit (which neighbour, in key order; rules/map.js netOf walks it)
//     lanes    [[u, v, dX, dY, ...]]   the sea lanes: zone u's centre to zone v's through open water (and the straits): the points between
//     ports    [[p, z, dX, dY, ...]]   from coastal province p's centre out to sea zone z's (the same way)
//     maps     {0: {roads, links, ports}, <v>: {base, touch, pairs, drop, roads, links, ports}}: what only one map has (the map of world.js;
//              the nations world's province split v): its own links' ways, and for the split its road pairs that differ (pairs) or are gone (drop)
const fs = require('fs'), path = require('path');
global.window = {}; require(path.join(__dirname, '..', 'world.js')); const WD = window.WORLD;
const W = WD.W, H = WD.H, LON0 = WD.lon0;
const miller = lat => 1.25*Math.log(Math.tan(Math.PI/4 + 0.4*lat*Math.PI/180));
const YMAX = miller(WD.latN), YMIN = miller(WD.latS);
const prov = WD.prov;
const land = p => p >= 0 && WD.provinces[p][1] >= 0;
// continuous grid coordinates: fx along the row (already including the odd-row shift), fy = row
const proj = (lon, lat) => [((lon - LON0 + 720) % 360)/360*W - 0.5, (YMAX - miller(Math.max(WD.latS, Math.min(WD.latN, lat))))/(YMAX - YMIN)*(H - 1)];
const cellOf = (fx, fy) => { const r = Math.round(fy); if (r < 0 || r >= H) return -1; const c = Math.round(fx - 0.5*(r & 1)); return c < 0 || c >= W ? -1 : r*W + c; };
const nbrs = i => { const c = i % W, r = (i / W) | 0, o = (r & 1) ? [[1,0],[1,-1],[0,-1],[-1,0],[0,1],[1,1]] : [[1,0],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1]]; return o.map(([dc, dr]) => { const nc = c + dc, nr = r + dr; return nc < 0 || nr < 0 || nc >= W || nr >= H ? -1 : nr*W + nc; }); };
function simplify(pts, tol){ if (pts.length < 3) return pts; const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]]; while (st.length){ const [a, b] = st.pop(); let md = 0, mi = -1; const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++){ const d = Math.abs((pts[i][0] - ax)*dy - (pts[i][1] - ay)*dx)/L; if (d > md){ md = d; mi = i; } }
    if (md > tol){ keep[mi] = 1; st.push([a, mi], [mi, b]); } }
  return pts.filter((_, i) => keep[i]); }
// tag(props) -> class number or 0 (skip); each output line is {p:points, r:class}
function lines(fc, tag, tol){ const out = []; for (const f of fc.features){ const r = tag(f.properties || {}); if (!r) continue; const g = f.geometry; if (!g) continue;
    const parts = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
    for (const part of parts){ let cur = [], prev = null;
      for (const [lon, lat] of part){ const q = proj(lon, lat); if (prev && Math.abs(q[0] - prev[0]) > W/2){ if (cur.length > 1) out.push({p:simplify(cur, tol), r}); cur = []; } cur.push(q); prev = q; }
      if (cur.length > 1) out.push({p:simplify(cur, tol), r}); } }
  return out; }
const KEEP_RIV = process.argv[2] === '--keep-rivers', OLD = (() => { const w = {}; new Function('window', fs.readFileSync(path.join(__dirname, '..', 'lines.js'), 'utf8'))(w); return w.LINES; })();
const rivFC = KEEP_RIV ? {features:[]} : JSON.parse(fs.readFileSync(process.argv[2])), roadFC = JSON.parse(fs.readFileSync(process.argv[3])), railFC = process.argv[4] ? JSON.parse(fs.readFileSync(process.argv[4])) : null;
const GSx = WD.GS || 1;
const rivers = lines(rivFC, p => p.featurecla !== 'Lake Centerline' && p.scalerank <= 6 ? p.scalerank + 1 : 0, 0.07*GSx).map(L => (L.r = L.r - 1, L));
// road classes: expressways are highways; the old "major road" set (major highways, top-rank roads, main secondary highways) are roads; lesser roads are tracks
const roadClass = p => { const t = p.type, s = p.scalerank;
  if (/Ferry/.test(t || '')) return 0;
  if (p.expressway === 1 && s <= 6 && t !== 'Track') return 3;
  if ((t === 'Major Highway' && s <= 6) || (t === 'Road' && s <= 3) || (t === 'Secondary Highway' && s <= 4) || (t === 'Beltway' && s <= 6)) return 2;
  if ((t === 'Road' && s <= 6) || (t === 'Secondary Highway' && s <= 6) || (t === 'Unknown' && s <= 5) || (t === 'Track' && s <= 6)) return 1;
  return 0; };
// NE splits roads and railways into many short pieces: join pieces of one class end to end (where exactly two ends meet) before simplifying
function chain(list, tol){ const ek = q => Math.round(q[0]*20) + ':' + Math.round(q[1]*20), byEnd = new Map(), used = new Uint8Array(list.length), out = [];
  list.forEach((L, i) => { for (const e of [ek(L.p[0]), ek(L.p[L.p.length - 1])]){ const k = L.r + '|' + e; let a = byEnd.get(k); if (!a) byEnd.set(k, a = []); a.push(i); } });
  const next = (r, e, self) => { const a = byEnd.get(r + '|' + e); if (!a || a.length !== 2) return -1; const j = a[0] === self ? a[1] : a[0]; return used[j] ? -1 : j; };
  for (let i = 0; i < list.length; i++){ if (used[i]) continue; used[i] = 1; let pts = list[i].p.slice(); const r = list[i].r;
    for (const dir of [1, -1]){ for (;;){ const end = dir > 0 ? pts[pts.length - 1] : pts[0], self = -1, a = byEnd.get(r + '|' + ek(end)); if (!a || a.length !== 2) break;
        const j = a.find(x => !used[x]); if (j == null) break; used[j] = 1; let q = list[j].p; const fwd = ek(q[0]) === ek(end);
        if (dir > 0){ q = fwd ? q : q.slice().reverse(); pts = pts.concat(q.slice(1)); } else { q = fwd ? q.slice().reverse() : q; pts = q.slice(0, -1).concat(pts); } } }
    out.push({p:simplify(pts, tol), r}); }
  return out; }
const roadsAll = chain(lines(roadFC, roadClass, 0), 0.3*GSx);
// tracks are drawn faint: simplify harder
for (const L of roadsAll) if (L.r === 1) L.p = simplify(L.p, 0.55*GSx);
const rails = railFC ? chain(lines(railFC, p => p.featurecla === 'Railroad' && p.scalerank <= 8 ? 1 : 0, 0), 0.32*GSx) : [];
// sample each line every 0.2 cells
const walk = (L, cb) => { for (let i = 1; i < L.length; i++){ const [x0, y0] = L[i - 1], [x1, y1] = L[i], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)/0.2)); for (let k = 0; k < n; k++){ const t = k/n; cb(x0 + (x1 - x0)*t, y0 + (y1 - y0)*t); } } };
// rivers as barriers: a river running alongside the border of two provinces (not just flowing from one into the other)
const along = new Map(), cross = new Map(), key = (a, b) => a < b ? a + ',' + b : b + ',' + a;
for (const R of rivers){ let prevP = -2; walk(R.p, (fx, fy) => { const c = cellOf(fx, fy); if (c < 0) return; const p = prov[c]; if (!land(p)) { prevP = -2; return; }
  if (prevP >= 0 && prevP !== p && land(prevP)) cross.set(key(p, prevP), (cross.get(key(p, prevP)) || 0) + 1);
  prevP = p; const seen = new Set(); for (const m of nbrs(c)){ if (m < 0) continue; const q = prov[m]; if (q !== p && land(q) && !seen.has(q)){ seen.add(q); along.set(key(p, q), (along.get(key(p, q)) || 0) + 1); } } }); }
const riverPairs = []; for (const [k, n] of along) if (n >= 12 && n > 4*(cross.get(k) || 0)) riverPairs.push(k.split(',').map(Number));
// province adjacency (cell-based, same rule as the game) and centres
const NP = WD.provinces.length, adj = Array.from({length:NP}, () => new Set()), cx = new Float64Array(NP), cy = new Float64Array(NP), cn = new Float64Array(NP);
for (let i = 0; i < W*H; i++){ const p = prov[i]; if (p < 0) continue; const r = (i / W) | 0, c = i % W; cx[p] += c + 0.5*(r & 1); cy[p] += r; cn[p]++;
  for (const m of nbrs(i)){ if (m < 0) continue; const q = prov[m]; if (q >= 0 && q !== p) adj[p].add(q); } }
for (let p = 0; p < NP; p++) if (cn[p]){ cx[p] /= cn[p]; cy[p] /= cn[p]; }
const cdist = (a, b) => { let dx = Math.abs(cx[a] - cx[b]); if (dx > W/2) dx = W - dx; return Math.hypot(dx, cy[a] - cy[b]); };
// a line links two provinces when it passes from one into the other (neighbours only); the strongest class wins
function pairsOf(list){ const m = new Map();
  for (const R of list){ let prevP = -2; walk(R.p, (fx, fy) => { const c = cellOf(fx, fy); if (c < 0) return; const p = prov[c]; if (!land(p)){ prevP = -2; return; }
    if (prevP >= 0 && prevP !== p && adj[p].has(prevP)){ const k = key(p, prevP); m.set(k, Math.max(m.get(k) || 0, R.r)); } prevP = p; }); }
  return m; }
const roadLv = pairsOf(roadsAll), railLv = pairsOf(rails);
// the movement network (tools/roadnet.js): the levels of the links on each map (gap fills and the road for every province), the ways, the lanes.
// The rules give each map's provinces, neighbours, centres and straits exactly as the game has them (the old lines.js is loaded only so the
// rules load; nothing of the map's shape depends on it)
const R = (() => { globalThis.window = globalThis; globalThis.WORLD = WD; globalThis.LINES = OLD; require(path.join(__dirname, '..', 'nations.js'));
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
  const r = new Function("'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8')).join('\n') + '\nreturn {mapOf, MAP_NEW, worldToCell, cellCenter, nbr, HS, OX, OY, netOf};')();
  r.TERRC = /const TERRC = '([^']+)'/.exec(html)[1]; return r; })();
const G0 = R.mapOf(0), G1 = R.MAP_NEW ? R.mapOf(R.MAP_NEW) : null;
// a map's own pairs: the same crossing rule on its own cells
const pairsOn = (G, list) => { const m = new Map(), pv = G.prov, isLand = p => p >= 0 && !G.P[p].sea;
  for (const R0 of list){ let prevP = -2; walk(R0.p, (fx, fy) => { const c = cellOf(fx, fy); if (c < 0) return; const p = pv[c]; if (!isLand(p)){ prevP = -2; return; }
    if (prevP >= 0 && prevP !== p && G.P[p].nb.has(prevP)){ const k = key(p, prevP); m.set(k, Math.max(m.get(k) || 0, R0.r)); } prevP = p; }); }
  return m; };
const roadsOut = roadsAll.filter(L => L.p.length > 1), neRoads = roadsOut.map(L => ({cls:L.r, pts:L.p.map(([x, y]) => [Math.round(x*20), Math.round(y*20)])}));
const maps = [{v:0, G:G0, pairs:roadLv}]; if (G1) maps.push({v:G1.map, G:G1, pairs:pairsOn(G1, roadsAll)});
{ const a = pairsOn(G0, roadsAll); if (JSON.stringify([...a]) !== JSON.stringify([...roadLv])) console.log('note: the crossing pairs on the rules\' map differ from the tool\'s own'); }
const lakes = (() => { const w = {}; new Function('window', fs.readFileSync(path.join(__dirname, '..', 'coast.js'), 'utf8'))(w); return w.LAKES || []; })();
const NET = require('./roadnet.js')({WD, R, maps, neRoads, terrc:R.TERRC, lakes, proj});
const pairList = lv => [...lv].map(([k, r]) => [...k.split(',').map(Number), r.lv, ...(r.gen ? [1] : [])]).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
const roadPairs = pairList(NET.levels[0]), gaps = roadPairs.filter(q => q[3]).length;
const railPairs = [...railLv].map(([k, lv]) => [...k.split(',').map(Number), lv]);
const enc = L => L.p.flatMap(([x, y]) => [Math.round(x*20), Math.round(y*20)]);
// roads and rails are delta-encoded after the first point (smaller numbers, smaller file): [class, x0, y0, dx1, dy1, ...]
const encD = L => { const a = enc(L); for (let i = a.length - 1; i >= 2; i--) a[i] -= a[i - 2]; return a; };
const out = {rivers:KEEP_RIV ? OLD.rivers : rivers.filter(L => L.p.length > 1).map(L => [L.r, ...enc(L)]), roads:roadsOut.map(L => [L.r, ...encD(L)]), rails:rails.filter(L => L.p.length > 1).map(L => [L.r, ...encD(L)]), delta:1, riverPairs:KEEP_RIV ? OLD.riverPairs : riverPairs, roadPairs, railPairs, gapPairs:gaps};
{ const N = NET, mo = {};   // the movement network (see the head of this file)
  maps.forEach((M, i) => { const o = {roads:N.mapOut[i].roads, links:N.mapOut[i].links, ports:N.laneMap[i].ports};
    if (M.v){ const T = N.T, base = NET.levels[0], lv = NET.levels[i], same = (r, q) => r && q && r.lv === q.lv && !!r.gen === !!q.gen, touch = k => k.split(',').some(x => T.has(+x));
      o.base = WD.provinces.length; o.touch = [...T].sort((a, b) => a - b);
      o.pairs = pairList(new Map([...lv].filter(([k, r]) => touch(k) || !same(r, base.get(k)))));
      o.drop = [...base.keys()].filter(k => !touch(k) && !lv.has(k)).map(k => k.split(',').map(Number)).sort((x, y) => x[0] - y[0] || x[1] - y[1]); }
    mo[M.v] = o; });
  out.net = {v:1, ins:N.sharedOut.ins, roads:N.sharedOut.roads, links:[], lanes:N.laneOut.lanes, ports:N.laneOut.ports, maps:mo};
  // each way as the choices at the forks of the final graph (rules/map.js netOf walks them back); checked by walking every one on both maps
  const choices = (net, pts, A) => { const key = new Map(); net.X.forEach((x, i) => key.set(x*8192 + net.Y[i], i)); const n = pts.map(([x, y]) => key.get(x*8192 + y)); if (n.some(v => v === undefined)) throw new Error('way off the graph');
    let s = ''; for (let i = 0; i + 1 < n.length; i++){ const opts = i === 0 ? A[n[i]] : A[n[i]].filter(v => v !== n[i - 1]), j = opts.indexOf(n[i + 1]); if (j < 0) throw new Error('way leaves the graph');
      if (!(opts.length === 1 && i > 0)){ if (j > 35) throw new Error('fork too wide'); s += j.toString(36); } } return s; };
  const G0net = R.netOf(G0, out); out.net.links = N.sharedOut.links.map(w => [w.a, w.b, choices(G0net, w.pts, G0net.A0)]);
  maps.forEach((M, i) => { const g = R.netOf(M.G, out); mo[M.v].links = N.mapOut[i].links.map(w => [w.a, w.b, choices(g, w.pts, g.A)]); });
  // the check: every link of each map has a way that walks from centre to centre
  for (const M of maps){ const g = R.netOf(M.G, out); M.G.net = undefined; const g2 = R.netOf(M.G, out); let bad = 0, n = 0; for (const k of NET.levels[maps.indexOf(M)].keys()){ const [a, b] = k.split(',').map(Number); n++; if (!g2.way(a, b) || !g2.way(b, a)) bad++; }
    if (bad) throw new Error(`map ${M.v}: ${bad} of ${n} links have no way`); console.log(`  map ${M.v}: ${n} links with roads, every one has its way`); } }
fs.writeFileSync(path.join(__dirname, '..', 'lines.js'), '// Generated by tools/build-lines.js from Natural Earth rivers, roads and railroads (public domain).\nwindow.LINES = ' + JSON.stringify(out) + ';\n');
const byLv = [0, 0, 0, 0]; for (const [, , lv] of roadPairs) byLv[lv]++;
console.log(`${KEEP_RIV ? 'rivers kept' : 'rivers'} ${out.rivers.length} lines, roads ${out.roads.length} lines (${[3, 2, 1].map(c => out.roads.filter(r => r[0] === c).length).join('/')} highway/road/track), rails ${out.rails.length} lines; river borders ${out.riverPairs.length}, road links ${roadPairs.length} (track ${byLv[1]}, ${gaps} generated, road ${byLv[2]}, highway ${byLv[3]}), rail links ${railPairs.length}; ${Math.round(fs.statSync(path.join(__dirname, '..', 'lines.js')).size/1024)} KB`);
