// Builds lines.js: rivers, roads and railways from Natural Earth (public domain), projected onto the game's hex grid,
// plus which province borders are river lines and which neighbouring provinces a road or a railway links.
// usage: node tools/build-lines.js <rivers.geojson> <roads.geojson> [<railroads.geojson>]
//   (ne_10m_rivers_lake_centerlines, ne_10m_roads, ne_10m_railroads; https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/)
// Output (window.LINES):
//   rivers   [[scalerank, x0, y0, x1, y1, ...]]           grid coords x20
//   roads    [[class, x0, y0, dx, dy, ...]]  (delta:1)     class 3 highway (expressways), 2 road, 1 track (minor roads)
//   rails    [[level, x0, y0, dx, dy, ...]]                     level 1 railway (NE has no high-speed flag; high-speed is built in game)
//   riverPairs [[a, b]]                                    province borders that run along a river
//   roadPairs  [[a, b, level(, 1 = gap fill)]]             neighbouring provinces linked by a road: 1 track, 2 road, 3 highway
//                                                          (level-1 links with no NE road are gap fills: drawn centre to centre in game)
//   railPairs  [[a, b, level]]                            neighbouring provinces linked by rail
//   gapPairs   count of the gap-fill tracks (informational)
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
const rivFC = JSON.parse(fs.readFileSync(process.argv[2])), roadFC = JSON.parse(fs.readFileSync(process.argv[3])), railFC = process.argv[4] ? JSON.parse(fs.readFileSync(process.argv[4])) : null;
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
// gap fill: every land province gets a track to its nearest same-country neighbours, and each country's road net is joined into one piece where land allows
const country = p => WD.provinces[p][1];
let gaps = 0; const gapSet = new Set();
const addTrack = (a, b) => { const k = key(a, b); if (!roadLv.has(k)){ roadLv.set(k, 1); gapSet.add(k); gaps++; } };
for (let p = 0; p < NP; p++){ if (!land(p)) continue; const nb = [...adj[p]].filter(q => land(q));
  const linked = nb.some(q => roadLv.has(key(p, q))); if (linked) continue;
  const same = nb.filter(q => country(q) === country(p)).sort((a, b) => cdist(p, a) - cdist(p, b)), pool = same.length ? same : nb.sort((a, b) => cdist(p, a) - cdist(p, b));
  for (const q of pool.slice(0, 2)) addTrack(p, q); }
// per country: union-find over same-country links, then bridge components through the shortest same-country adjacency
{ const par = Int32Array.from({length:NP}, (_, i) => i), find = x => { while (par[x] !== x){ par[x] = par[par[x]]; x = par[x]; } return x; };
  for (const k of roadLv.keys()){ const [a, b] = k.split(',').map(Number); if (country(a) === country(b)) par[find(a)] = find(b); }
  // Kruskal over same-country adjacencies by centre distance: each joins two pieces only when they are still apart
  const cand = []; for (let p = 0; p < NP; p++){ if (!land(p)) continue; for (const q of adj[p]) if (q > p && land(q) && country(q) === country(p)) cand.push([cdist(p, q), p, q]); }
  cand.sort((x, y) => x[0] - y[0]);
  for (const [, p, q] of cand){ const rp = find(p), rq = find(q); if (rp === rq) continue; addTrack(p, q); par[rp] = rq; } }
const roadPairs = [...roadLv].map(([k, lv]) => gapSet.has(k) ? [...k.split(',').map(Number), 1, 1] : [...k.split(',').map(Number), lv]);   // [a, b, 1, 1]: gap-fill track
const railPairs = [...railLv].map(([k, lv]) => [...k.split(',').map(Number), lv]);
const enc = L => L.p.flatMap(([x, y]) => [Math.round(x*20), Math.round(y*20)]);
// roads and rails are delta-encoded after the first point (smaller numbers, smaller file): [class, x0, y0, dx1, dy1, ...]
const encD = L => { const a = enc(L); for (let i = a.length - 1; i >= 2; i--) a[i] -= a[i - 2]; return a; };
const out = {rivers:rivers.filter(L => L.p.length > 1).map(L => [L.r, ...enc(L)]), roads:roadsAll.filter(L => L.p.length > 1).map(L => [L.r, ...encD(L)]), rails:rails.filter(L => L.p.length > 1).map(L => [L.r, ...encD(L)]), delta:1, riverPairs, roadPairs, railPairs, gapPairs:gaps};
fs.writeFileSync(path.join(__dirname, '..', 'lines.js'), '// Generated by tools/build-lines.js from Natural Earth rivers, roads and railroads (public domain).\nwindow.LINES = ' + JSON.stringify(out) + ';\n');
const byLv = [0, 0, 0, 0]; for (const [, , lv] of roadPairs) byLv[lv]++;
console.log(`rivers ${out.rivers.length} lines, roads ${out.roads.length} lines (${[3, 2, 1].map(c => out.roads.filter(r => r[0] === c).length).join('/')} highway/road/track), rails ${out.rails.length} lines; river borders ${riverPairs.length}, road links ${roadPairs.length} (track ${byLv[1]} incl. ${gaps} gap fills, road ${byLv[2]}, highway ${byLv[3]}), rail links ${railPairs.length}; ${Math.round(fs.statSync(path.join(__dirname, '..', 'lines.js')).size/1024)} KB`);
