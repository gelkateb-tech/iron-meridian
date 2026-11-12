#!/usr/bin/env node
// Province split for the nations world (docs/NATIONS-PLAN.md 4.6, owner's answer 1): Israel, Greece, Cuba and Belarus are cut into smaller
// provinces so each can hold 7 cities. world.js is not touched: the classic world and every old save keep its 3465 provinces. This tool writes
// tools/provsplit.json, which tools/build-nations.js copies into nations.js (NATIONS.map); rules/map.js loadWorld(map) lays it over world.js
// for the nations world only.
//   node tools/build-provsplit.js <ne_10m_admin_1_states_provinces.geojson> <ne_10m_populated_places_simple.geojson>
//     (Natural Earth, public domain: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/)
//   node tools/build-provsplit.js --check    exit 1 unless tools/provsplit.json is sound against world.js and lines.js (no Natural Earth files needed)
// What it does, per country:
//   1. the country's cells (world.js) are labelled with their real admin-1 region (Natural Earth, rasterized exactly as tools/build-world2.js does);
//   2. every province of today is cut along those regions (pieces under ~40% of the wanted size join a neighbour of the same province);
//   3. while the country has fewer provinces than wanted, its largest piece is cut in two around its two biggest towns (geodesic Voronoi with
//      Lloyd relaxation, as tools/build-world2.js splits large regions); with more than wanted, the smallest piece joins a neighbour of its province;
//   4. in each province of today the piece with its city (or its most people) keeps the old number; the other pieces are NEW provinces, appended
//      after the last province of world.js, each recording the province it was cut from (parent);
//   5. names: a piece that is one whole real region takes the region's name; otherwise its biggest town (Natural Earth populated places); Israel's
//      eight cells are named by hand after the main town in each (Natural Earth lists only six towns there);
//   6. people: the parent's people are shared among its pieces by the same town-and-density weight tools/build-world2.js uses; terrain: the same
//      majority rule over the per-cell terrain the texture was baked from (TERRC in index.html);
//   7. rivers, roads and railways: the province pairs that touch a cut province are worked out again from the lines of lines.js with the rules of
//      tools/build-lines.js (river borders, road and rail links, gap-fill tracks); all other pairs stay as lines.js has them.
// Israel covers about 7.3 cells of the map grid (measured against the 1:50m border), so it gets 8 provinces of one cell each: the finest the grid
// allows. Greece, Cuba and Belarus get 13, 12 and 13.
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..'), OUT = path.join(__dirname, 'provsplit.json');
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const WD = globalThis.WORLD, LN = globalThis.LINES, W = WD.W, H = WD.H, N = W*H, GS = WD.GS || 1, NP0 = WD.provinces.length;
const TARGET = {Belarus:13, Greece:13, Israel:8, Cuba:12};   // provinces wanted (order: the order of the new provinces)
// Israel by hand: [col, row] -> name of the main town in the cell (Haifa; Tiberias in Galilee; Tel Aviv with Jerusalem's hills; Beersheba with
// Ashkelon; Dimona; the western Negev at Nitzana; Mitzpe Ramon; the Arava down to Eilat)
const CELL_NAMES = {'339,127':'Haifa', '340,127':'Tiberias', '339,129':'Tel Aviv', '339,130':'Beersheba', '339,131':'Dimona', '338,131':'Nitzana', '339,132':'Mitzpe Ramon', '339,133':'Eilat'};
// Natural Earth spellings -> the usual English ones
const FIX = {Komatini:'Komotini', Ioanina:'Ioannina', Hios:'Chios', Rodos:'Rhodes', Pirgos:'Pyrgos', Seres:'Serres', Iraklio:'Heraklion', Hania:'Chania', Kerkira:'Corfu', Patra:'Patras',
  Homyel:'Gomel', Mahilyow:'Mogilev', Vitsyebsk:'Vitebsk', Hrodna:'Grodno', Babruysk:'Bobruisk', Baranavichy:'Baranovichi', Mazyr:'Mozyr', Maladzyechna:'Molodechno', Polatsk:'Polotsk', 'Pinar del Rio':'Pinar del Río'};
// towns Natural Earth's populated places leave out (Belarus has only fifteen there): [country, name, lat, lon, people], real towns, for seeds and names
const EXTRA = [['Belarus', 'Salihorsk', 52.79, 27.54, 104000], ['Belarus', 'Slutsk', 53.03, 27.55, 61000], ['Belarus', 'Smarhon', 54.48, 26.40, 36000], ['Belarus', 'Navahrudak', 53.60, 25.83, 29000],
  ['Belarus', 'Pastavy', 55.12, 26.83, 20000], ['Belarus', 'Hlybokaye', 55.14, 27.69, 19000], ['Belarus', 'Lepel', 54.88, 28.70, 17000]];
const CLEAN = [/ (Prefecture|Province|Region|Governorate|District|Oblast|Republic)$/i, /^(Province|Region|City) of /i];
const cleanName = n => { let s = n; for (const re of CLEAN) s = s.replace(re, ''); return s.trim() || n; };

/* ---------- the grid (same projection and neighbours as tools/build-world2.js) ---------- */
const miller = lat => 1.25*Math.log(Math.tan(Math.PI/4 + 0.4*lat*Math.PI/180));
const YMAX = miller(WD.latN), YMIN = miller(WD.latS);
const projX = lon => ((lon - WD.lon0) % 360 + 360) % 360/360*W - 0.5;
const projY = lat => (YMAX - miller(Math.max(-85, Math.min(85, lat))))/(YMAX - YMIN)*(H - 1);
const lonLatToCell = (lon, lat) => { const r = Math.round(projY(lat)); if (r < 0 || r >= H) return -1; const c = ((Math.round(projX(lon) - 0.5*(r & 1)) % W) + W) % W; return r*W + c; };
const NB_EVEN = [[1,0],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1]], NB_ODD = [[1,0],[1,-1],[0,-1],[-1,0],[0,1],[1,1]];
const nbr = (i, d) => { const c = i % W, r = (i / W) | 0, o = (r & 1) ? NB_ODD[d] : NB_EVEN[d]; const nc = c + o[0], nr = r + o[1]; return (nc < 0 || nr < 0 || nc >= W || nr >= H) ? -1 : nr*W + nc; };
const nbrs = i => [0, 1, 2, 3, 4, 5].map(d => nbr(i, d));
const cube = i => { const c = i % W, r = (i / W) | 0, q = c - (r - (r & 1))/2; return [q, r, -q - r]; };
const hexDist = (a, b) => { const A = cube(a), B = cube(b); return Math.max(Math.abs(A[0]-B[0]), Math.abs(A[1]-B[1]), Math.abs(A[2]-B[2])); };
const cxy = i => { const c = i % W, r = (i / W) | 0; return [(c + 0.5*(r & 1))*1.7320508, r*1.5]; };
const colRow = i => (i % W) + ',' + ((i / W) | 0);
function rasterize(g, set){ const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  for (const poly of polys){ const rows = new Map();
    for (const ring of poly){ let prev = null; const pts = [];
      for (const [lon, lat] of ring){ let x = projX(lon); if (prev !== null){ while (x - prev > W/2) x -= W; while (prev - x > W/2) x += W; } pts.push([x, projY(lat)]); prev = x; }
      for (let i = 0; i < pts.length - 1; i++){ const [x1, y1] = pts[i], [x2, y2] = pts[i + 1]; if (y1 === y2) continue; const lo = Math.min(y1, y2), hi = Math.max(y1, y2);
        for (let r = Math.max(0, Math.ceil(lo)); r < hi && r < H; r++){ if (r < lo) continue; const x = x1 + (x2 - x1)*(r - y1)/(y2 - y1); let a = rows.get(r); if (!a) rows.set(r, a = []); a.push(x); } } }
    for (const [r, xs] of rows){ xs.sort((a, b) => a - b); const off = 0.5*(r & 1);
      for (let j = 0; j + 1 < xs.length; j += 2) for (let c = Math.ceil(xs[j] - off); c + off < xs[j + 1]; c++) set(r*W + ((c % W) + W) % W); } } }
// per-cell terrain classes (0 plains 1 forest 2 mountain 3 desert 4 tundra 5 hills 6 marsh 7 snow), decoded from TERRC in index.html
const cellT = (() => { const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), m = html.match(/const TERRC = '([^']+)'/); if (!m) throw new Error('TERRC not found in index.html');
  const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', ix = new Int8Array(128).fill(-1); for (let i = 0; i < 64; i++) ix[AL.charCodeAt(i)] = i;
  const s = m[1], cls = new Uint8Array(N); let k = 0;
  for (let i = 0; i < s.length && k < N;){ const v = ix[s.charCodeAt(i++)], L = v & 7, n = L < 7 ? L + 1 : ix[s.charCodeAt(i++)]*64 + ix[s.charCodeAt(i++)] + 8; cls.fill(v >> 3, k, Math.min(N, k + n)); k += n; }
  if (k !== N) throw new Error('TERRC does not cover the grid'); return cls; })();
const terrOf = cells => { const h = [0, 0, 0, 0, 0, 0, 0, 0]; for (const c of cells) h[cellT[c]]++; const n = cells.length, hi = h[2] + h[7];   // the rule of tools/build-world2.js
  return h[7] >= n*0.5 ? 's' : hi >= n*0.4 ? (h[7] > h[2]*1.5 ? 's' : 'm') : h[3] >= n*0.5 ? 'd' : h[4] + h[7] >= n*0.5 ? (h[7] > h[4] ? 's' : 't') : h[6] >= n*0.4 ? 'w' : h[1] >= n*0.45 ? 'f'
    : h[5] >= n*0.4 || h[5] + hi >= n*0.5 ? 'h' : hi + h[3] > n*0.6 ? (hi > h[3] ? 'm' : 'd') : h[5] + h[3] > n*0.6 ? 'h' : 'p'; };

/* ---------- the province pairs of rivers, roads and railways (the rules of tools/build-lines.js) ---------- */
function decode(arr, delta){ const pts = []; let fx = 0, fy = 0; for (let i = 1; i < arr.length; i += 2){ if (delta && i > 1){ fx += arr[i]; fy += arr[i + 1]; } else { fx = arr[i]; fy = arr[i + 1]; } pts.push([fx/20, fy/20]); } return pts; }
const RIV = LN.rivers.map(R => ({r:R[0], p:decode(R, false)})), ROAD = LN.roads.map(R => ({r:R[0], p:decode(R, !!LN.delta)})), RAIL = (LN.rails || []).map(R => ({r:R[0], p:decode(R, !!LN.delta)}));
const cellOf = (fx, fy) => { const r = Math.round(fy); if (r < 0 || r >= H) return -1; const c = Math.round(fx - 0.5*(r & 1)); return c < 0 || c >= W ? -1 : r*W + c; };
const walk = (L, cb) => { for (let i = 1; i < L.length; i++){ const [x0, y0] = L[i - 1], [x1, y1] = L[i], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)/0.2)); for (let k = 0; k < n; k++){ const t = k/n; cb(x0 + (x1 - x0)*t, y0 + (y1 - y0)*t); } } };
const pkey = (a, b) => a < b ? a + ',' + b : b + ',' + a;
// prov: the grid, rows: province rows ([name, country, ...]), touch: the provinces whose pairs are wanted. Returns the pairs touching them.
function linkPairs(prov, rows, touch){ const NPx = rows.length, land = p => p >= 0 && rows[p][1] >= 0, country = p => rows[p][1], T = p => touch.has(p);
  const along = new Map(), cross = new Map();
  for (const R of RIV){ let prevP = -2; walk(R.p, (fx, fy) => { const c = cellOf(fx, fy); if (c < 0) return; const p = prov[c]; if (!land(p)){ prevP = -2; return; }
    if (prevP >= 0 && prevP !== p && land(prevP) && (T(p) || T(prevP))) cross.set(pkey(p, prevP), (cross.get(pkey(p, prevP)) || 0) + 1);
    prevP = p; const seen = new Set(); for (const m of nbrs(c)){ if (m < 0) continue; const q = prov[m]; if (q !== p && land(q) && !seen.has(q) && (T(p) || T(q))){ seen.add(q); along.set(pkey(p, q), (along.get(pkey(p, q)) || 0) + 1); } } }); }
  const riverPairs = []; for (const [k, n] of along) if (n >= 12 && n > 4*(cross.get(k) || 0)) riverPairs.push(k.split(',').map(Number));
  const adj = Array.from({length:NPx}, () => new Set()), cx = new Float64Array(NPx), cy = new Float64Array(NPx), cn = new Float64Array(NPx);
  for (let i = 0; i < N; i++){ const p = prov[i]; if (p < 0) continue; const r = (i / W) | 0, c = i % W; cx[p] += c + 0.5*(r & 1); cy[p] += r; cn[p]++;
    for (const m of nbrs(i)){ if (m < 0) continue; const q = prov[m]; if (q >= 0 && q !== p) adj[p].add(q); } }
  for (let p = 0; p < NPx; p++) if (cn[p]){ cx[p] /= cn[p]; cy[p] /= cn[p]; }
  const cdist = (a, b) => { let dx = Math.abs(cx[a] - cx[b]); if (dx > W/2) dx = W - dx; return Math.hypot(dx, cy[a] - cy[b]); };
  const pairsOf = list => { const m = new Map(); for (const R of list){ let prevP = -2; walk(R.p, (fx, fy) => { const c = cellOf(fx, fy); if (c < 0) return; const p = prov[c]; if (!land(p)){ prevP = -2; return; }
      if (prevP >= 0 && prevP !== p && adj[p].has(prevP)){ const k = pkey(p, prevP); m.set(k, Math.max(m.get(k) || 0, R.r)); } prevP = p; }); } return m; };
  const roadLv = pairsOf(ROAD), railLv = pairsOf(RAIL), gapSet = new Set();
  // the gap fills of tools/build-lines.js, for the whole map (they depend on every province's links), then only the pairs touching `touch` are kept
  const addTrack = (a, b) => { const k = pkey(a, b); if (!roadLv.has(k)){ roadLv.set(k, 1); gapSet.add(k); } };
  for (let p = 0; p < NPx; p++){ if (!land(p)) continue; const nb = [...adj[p]].filter(q => land(q)); if (nb.some(q => roadLv.has(pkey(p, q)))) continue;
    const same = nb.filter(q => country(q) === country(p)).sort((a, b) => cdist(p, a) - cdist(p, b)), pool = same.length ? same : nb.sort((a, b) => cdist(p, a) - cdist(p, b));
    for (const q of pool.slice(0, 2)) addTrack(p, q); }
  { const par = Int32Array.from({length:NPx}, (_, i) => i), find = x => { while (par[x] !== x){ par[x] = par[par[x]]; x = par[x]; } return x; };
    for (const k of roadLv.keys()){ const [a, b] = k.split(',').map(Number); if (country(a) === country(b)) par[find(a)] = find(b); }
    const cand = []; for (let p = 0; p < NPx; p++){ if (!land(p)) continue; for (const q of adj[p]) if (q > p && land(q) && country(q) === country(p)) cand.push([cdist(p, q), p, q]); }
    cand.sort((x, y) => x[0] - y[0]); for (const [, p, q] of cand){ const rp = find(p), rq = find(q); if (rp === rq) continue; addTrack(p, q); par[rp] = rq; } }
  const keep = k => { const [a, b] = k.split(',').map(Number); return T(a) || T(b); };
  return {riverPairs:riverPairs.filter(([a, b]) => T(a) || T(b)).sort((x, y) => x[0] - y[0] || x[1] - y[1]),
    roadPairs:[...roadLv].filter(([k]) => keep(k)).map(([k, lv]) => gapSet.has(k) ? [...k.split(',').map(Number), 1, 1] : [...k.split(',').map(Number), lv]).sort((x, y) => x[0] - y[0] || x[1] - y[1]),
    railPairs:[...railLv].filter(([k]) => keep(k)).map(([k, lv]) => [...k.split(',').map(Number), lv]).sort((x, y) => x[0] - y[0] || x[1] - y[1])}; }

// the split laid over world.js: the grid and the province rows (as rules/map.js loadWorld does)
function apply(S){ const prov = Int32Array.from(WD.prov); for (let i = 0; i < S.cells.length; i += 2) prov[S.cells[i]] = S.cells[i + 1];
  const rows = WD.provinces.map((d, k) => S.parents[k] ? [S.parents[k][0], d[1], d[2], d[3], S.parents[k][1], S.parents[k][2]] : d).concat(S.provinces.map(d => d.slice(0, 6)));
  return {prov, rows}; }

/* ---------- --check: the file against world.js and lines.js ---------- */
if (process.argv[2] === '--check'){ const S = JSON.parse(fs.readFileSync(OUT, 'utf8')), fails = [], {prov, rows} = apply(S);
  if (S.base !== NP0) fails.push(`made for ${S.base} provinces, world.js has ${NP0}`);
  const cnt = new Map(); for (let i = 0; i < N; i++) if (prov[i] >= 0) cnt.set(prov[i], (cnt.get(prov[i]) || 0) + 1);
  S.provinces.forEach((d, j) => { const id = NP0 + j; if (!cnt.get(id)) fails.push(`new province ${id} ${d[0]} has no cells`); if (rows[d[6]][1] !== d[1]) fails.push(`${d[0]}: not in the country of its parent`); });
  for (const k in S.parents) if (!cnt.get(+k)) fails.push(`parent ${k} lost all its cells`);
  for (let i = 0; i < S.cells.length; i += 2){ const c = S.cells[i], p = S.cells[i + 1], old = WD.prov[c]; if (p < NP0 || S.provinces[p - NP0][6] !== old) fails.push(`cell ${c} moved from ${old} to ${p}, which was not cut from it`); }
  const touch = new Set(S.touch), L = linkPairs(prov, rows, touch); for (const k of ['riverPairs', 'roadPairs', 'railPairs']) if (JSON.stringify(L[k]) !== JSON.stringify(S[k])) fails.push(k + ' differ from what lines.js gives');
  const per = {}; for (const d of rows) if (d[1] >= 0){ const n = WD.countries[d[1]]; per[n] = (per[n] || 0) + 1; }
  for (const c in TARGET) if (per[c] !== TARGET[c]) fails.push(`${c}: ${per[c]} provinces, ${TARGET[c]} wanted`);
  console.log(fails.length ? 'PROVINCE SPLIT FAILED\n  ' + fails.join('\n  ') : `province split ok: ${S.provinces.length} new provinces (${Object.keys(TARGET).map(c => c + ' ' + per[c]).join(', ')}), ${S.cells.length/2} cells moved`);
  process.exit(fails.length ? 1 : 0); }

/* ---------- the split ---------- */
if (process.argv.length < 4){ console.log('usage: node tools/build-provsplit.js <ne_10m_admin_1_states_provinces.geojson> <ne_10m_populated_places_simple.geojson>  |  --check'); process.exit(2); }
const ADM = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).features.filter(f => f.geometry && TARGET[f.properties.admin]);
const PP = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')).features.map(f => ({name:FIX[f.properties.name] || f.properties.name, pop:Math.max(f.properties.pop_max || 0, 1000), cell:lonLatToCell(f.geometry.coordinates[0], f.geometry.coordinates[1]), adm:f.properties.adm0name}))
  .concat(EXTRA.map(([adm, name, lat, lon, pop]) => ({name, pop, cell:lonLatToCell(lon, lat), adm})));
const cellsOf = new Map(); for (let i = 0; i < N; i++){ const p = WD.prov[i]; if (p >= 0){ let a = cellsOf.get(p); if (!a) cellsOf.set(p, a = []); a.push(i); } }
const ci = n => WD.countries.indexOf(n);
// people per cell (as tools/build-world2.js): towns, blurred over the land, a rural floor
const popD = new Float32Array(N); for (const p of PP) if (p.cell >= 0 && WD.prov[p.cell] >= 0) popD[p.cell] += p.pop;
let dens = popD; for (let it = 0; it < 3*GS; it++){ const nx = new Float32Array(N); for (let i = 0; i < N; i++){ const p = WD.prov[i]; if (p < 0 || WD.provinces[p][1] < 0) continue; let s = dens[i]*2, n = 2;
    for (const m of nbrs(i)){ if (m >= 0 && WD.prov[m] >= 0 && WD.provinces[WD.prov[m]][1] >= 0){ s += dens[m]; n++; } } nx[i] = s/n; } dens = nx; }
const wOf = c => popD[c]*0.8 + 1500 + dens[c]*1.2;
// towns by cell, for seeds and names: a coastal town whose point falls in a sea cell is moved to the nearest land cell of its country (2 cells at most)
const countryAt = c => { const p = c >= 0 ? WD.prov[c] : -1; return p >= 0 && WD.provinces[p][1] >= 0 ? WD.countries[WD.provinces[p][1]] : null; };
const snap = p => { if (p.cell < 0 || countryAt(p.cell) === p.adm) return p.cell; let best = -1, bd = 3; const c0 = p.cell % W, r0 = (p.cell / W) | 0;
  for (let dr = -2; dr <= 2; dr++) for (let dc = -3; dc <= 3; dc++){ const r = r0 + dr, c = c0 + dc; if (r < 0 || r >= H || c < 0 || c >= W) continue; const m = r*W + c; if (countryAt(m) !== p.adm) continue; const d = hexDist(p.cell, m); if (d < bd){ bd = d; best = m; } }
  return best; };
const placeAt = new Map(); for (const p of PP.slice().sort((a, b) => b.pop - a.pop)){ const c = snap(p); if (c >= 0 && !placeAt.has(c)) placeAt.set(c, p); }

// towns of country-state-city (open data; NODE_PATH as for tools/build-world2.js), for names only: a piece with no Natural Earth town
const CSC = (() => { let City; try { ({ City } = require('country-state-city')); } catch (e) { console.log('note: country-state-city not found (NODE_PATH): pieces without a town get a numbered region name'); return []; }
  const iso = {BY:'Belarus', GR:'Greece', CU:'Cuba', IL:'Israel'};
  return City.getAllCities().filter(c => iso[c.countryCode] && c.name.length <= 16 && /^[A-Za-z' .-]+$/.test(c.name)).map(c => { const t = {name:c.name, adm:iso[c.countryCode], country:iso[c.countryCode], cell:lonLatToCell(+c.longitude, +c.latitude)}; t.cell = snap(t); return t; }).filter(t => t.cell >= 0); })();
const newRows = [], parents = {}, moved = [], touch = new Set(), report = [];
for (const country of Object.keys(TARGET)){ const k = ci(country), want = TARGET[country];
  const provs = WD.provinces.map((d, id) => id).filter(id => WD.provinces[id][1] === k), own = new Set(provs.flatMap(id => cellsOf.get(id)));
  // 1. admin-1 region of every cell of the country (unclaimed edge cells take the region of the nearest claimed cell)
  const regs = ADM.filter(f => f.properties.admin === country).map(f => ({name:cleanName(f.properties.name || ''), cells:[]})), reg = new Map();
  ADM.filter(f => f.properties.admin === country).forEach((f, r) => rasterize(f.geometry, i => { if (own.has(i) && !reg.has(i)) reg.set(i, r); }));
  for (let pass = 0; pass < 20 && reg.size < own.size; pass++) for (const c of own) if (!reg.has(c)){ let best = -1, bd = 1e9; for (const d of reg.keys()){ const dd = hexDist(c, d); if (dd < bd){ bd = dd; best = d; } } if (best >= 0 && bd <= 4) reg.set(c, reg.get(best)); }
  for (const c of own){ if (!reg.has(c)) reg.set(c, 0); regs[reg.get(c)].cells.push(c); }
  const avg = own.size/want, minC = Math.max(1, Math.round(avg*0.4));
  // 2. pieces: each province of today cut along the regions, small pieces joined to a neighbour of the same province
  let pieces = [];   // {parent, cells:[]}
  const comps = cells => { const set = new Set(cells), seen = new Set(), out = []; for (const c of cells){ if (seen.has(c)) continue; const q = [c]; seen.add(c); for (let h = 0; h < q.length; h++) for (const m of nbrs(q[h])) if (m >= 0 && set.has(m) && !seen.has(m)){ seen.add(m); q.push(m); } out.push(q); } return out; };
  for (const id of provs){ const by = new Map(); for (const c of cellsOf.get(id)){ const r = reg.get(c); if (!by.has(r)) by.set(r, []); by.get(r).push(c); } for (const cells of by.values()) pieces.push({parent:id, cells}); }
  const shared = (A, B) => { const s = new Set(B.cells); let n = 0; for (const c of A.cells) for (const m of nbrs(c)) if (m >= 0 && s.has(m)) n++; return n; };
  const joinSmall = P => { const mates = pieces.filter(Q => Q !== P && Q.parent === P.parent); if (!mates.length) return false;
    let best = null, bv = -1; for (const Q of mates){ const s = shared(P, Q); const v = s ? 1000 + s*10 - Q.cells.length : -Math.min(...P.cells.map(c => Math.min(...Q.cells.map(d => hexDist(c, d))))); if (best === null || v > bv){ bv = v; best = Q; } }
    best.cells.push(...P.cells); pieces = pieces.filter(Q => Q !== P); return true; };
  for (let again = true; again;){ again = false; for (const P of pieces.slice().sort((a, b) => a.cells.length - b.cells.length)) if (P.cells.length < minC && joinSmall(P)){ again = true; break; } }
  // 3. cut the largest piece in two until there are enough; join the smallest while there are too many
  const pw = P => P.cells.reduce((s, c) => s + wOf(c), 0);
  // a cut in two: geodesic Voronoi inside the piece from two seeds with Lloyd relaxation (as tools/build-world2.js). Tried from the two biggest towns
  // (a town over 150,000 stays put), from the same towns free to move, and from the two farthest cells; the most even valid cut wins, a town cut
  // first when it is not lopsided (smaller part at least 0.3 of the larger); a cut that leaves a town in both parts is preferred
  const cut = P => { const n = P.cells.length; if (n < 2*minC) return null; const inP = new Set(P.cells);
    const towns = P.cells.filter(c => placeAt.has(c)).sort((a, b) => placeAt.get(b).pop - placeAt.get(a).pop), sp = Math.max(1, Math.sqrt(n)*0.6);
    const tSeeds = []; for (const c of towns){ if (tSeeds.length >= 2) break; if (tSeeds.every(s => hexDist(s, c) >= sp)) tSeeds.push(c); }
    const far = from => P.cells.reduce((b, c) => hexDist(from, c) > hexDist(from, b) ? c : b, P.cells[0]);
    const grow = sd => { const o = new Map(), q = []; sd.forEach((s, j) => { o.set(s, j); q.push(s); });
      for (let h = 0; h < q.length; h++) for (const m of nbrs(q[h])) if (m >= 0 && inP.has(m) && !o.has(m)){ o.set(m, o.get(q[h])); q.push(m); }
      for (const c of P.cells) if (!o.has(c)){ let bj = 0, bd = 1e9; sd.forEach((s, j) => { const d = hexDist(s, c); if (d < bd){ bd = d; bj = j; } }); o.set(c, bj); }   // a detached island: the nearest seed
      return o; };
    const run = (sd, fix) => { const seeds = sd.slice(); let o = grow(seeds);
      for (let it = 0; it < 4; it++){ const sums = seeds.map(() => [0, 0, 0]); for (const [c, j] of o){ const [x, y] = cxy(c); sums[j][0] += x; sums[j][1] += y; sums[j][2]++; }
        for (let j = 0; j < 2; j++){ if (fix && placeAt.has(seeds[j]) && placeAt.get(seeds[j]).pop > 150000) continue; const [sx, sy, sn] = sums[j]; if (!sn) continue; let bc = seeds[j], bd = Infinity;
          for (const [c, jj] of o){ if (jj !== j) continue; const [x, y] = cxy(c), dd = (x - sx/sn)**2 + (y - sy/sn)**2; if (dd < bd){ bd = dd; bc = c; } } seeds[j] = bc; }
        if (seeds[0] === seeds[1]) return null; o = grow(seeds); }
      const parts = [[], []]; for (const [c, j] of o) parts[j].push(c);
      return parts[0].length >= minC && parts[1].length >= minC ? parts : null; };
    const even = q => Math.min(q[0].length, q[1].length)/Math.max(q[0].length, q[1].length);
    const t1 = tSeeds.length ? run([tSeeds[0], tSeeds[1] ?? far(tSeeds[0])], true) : null;
    if (t1 && even(t1) >= 0.3) return t1;
    const f0 = far(far(P.cells[0])), cands = [t1, tSeeds.length ? run([tSeeds[0], tSeeds[1] ?? far(tSeeds[0])], false) : null, run([f0, far(f0)], false)].filter(Boolean);
    const towned = q => q.every(part => part.some(c => placeAt.has(c) && placeAt.get(c).adm === country)) ? 0.3 : 0;   // both parts have a town to be named after
    return cands.sort((x, y) => even(y) + towned(y) - even(x) - towned(x))[0] || null; };
  for (let guard = 0; pieces.length < want && guard < 200; guard++){ const order = pieces.slice().sort((a, b) => b.cells.length - a.cells.length || pw(b) - pw(a)); let done = false;
    for (const P of order){ const parts = cut(P); if (!parts) continue; pieces = pieces.filter(Q => Q !== P); pieces.push({parent:P.parent, cells:parts[0]}, {parent:P.parent, cells:parts[1]}); done = true; break; }
    if (!done) break; }
  if (process.env.SPLIT_DEBUG) for (const P of pieces) console.log(country, WD.provinces[P.parent][0], P.cells.length, P.cells.filter(c => placeAt.has(c)).map(c => placeAt.get(c).name).join(' '), cut(P) ? 'cuttable' : 'not cuttable');
  for (let guard = 0; pieces.length > want && guard < 200; guard++){ const order = pieces.slice().sort((a, b) => a.cells.length - b.cells.length || pw(a) - pw(b)); let done = false;
    for (const P of order) if (joinSmall(P)){ done = true; break; } if (!done) break; }
  if (pieces.length !== want) throw new Error(`${country}: ${pieces.length} pieces, ${want} wanted`);
  // 4. which piece keeps the old number: the one with the province's city (the cell of its biggest town), else the one with the most people
  const used = new Set(WD.provinces.filter(d => d[1] === k).map(d => d[0]));
  for (const id of provs){ const mine = pieces.filter(P => P.parent === id); if (mine.length < 2){ mine.forEach(P => P.keep = true); continue; }
    const d = WD.provinces[id], town = d[2] & 1 ? PP.filter(p => p.cell >= 0 && own.has(p.cell) && (p.name === d[3] || FIX[d[3]] === p.name)).sort((a, b) => b.pop - a.pop)[0] : null;
    const keeper = town ? mine.find(P => P.cells.includes(town.cell)) || mine.slice().sort((a, b) => pw(b) - pw(a))[0] : mine.slice().sort((a, b) => pw(b) - pw(a))[0];
    keeper.keep = true; used.delete(d[0]); }
  // 5. names
  const regionWhole = P => { const cnt = new Map(); for (const c of P.cells) cnt.set(reg.get(c), (cnt.get(reg.get(c)) || 0) + 1); const [r, n] = [...cnt].sort((a, b) => b[1] - a[1])[0];
    return n >= P.cells.length*0.7 && n >= regs[r].cells.length*0.8 ? regs[r].name : null; };
  const take = (P, nm) => { if (!nm || used.has(nm)) return false; used.add(nm); P.name = nm; return true; };
  const ordered = pieces.slice().sort((a, b) => (b.keep ? 1 : 0) - (a.keep ? 1 : 0) || pw(b) - pw(a));
  for (const P of ordered){ const d = WD.provinces[P.parent], whole = regionWhole(P);
    if (country === 'Israel'){ if (P.cells.length !== 1 || !take(P, CELL_NAMES[colRow(P.cells[0])])) throw new Error('Israel: no hand name for cell ' + colRow(P.cells[0])); continue; }
    if (P.keep && pieces.filter(Q => Q.parent === P.parent).length < 2){ P.name = d[0]; used.add(d[0]); continue; }
    if (P.keep){ const isReg = regs.some(r => r.name === d[0]), mostHere = isReg && (() => { const R = regs.find(r => r.name === d[0]); return P.cells.filter(c => regs[reg.get(c)] === R).length*2 > R.cells.length; })();
      if (!isReg || mostHere){ if (take(P, d[0])) continue; } }
    if (whole && take(P, whole)) continue;
    const towns = P.cells.filter(c => placeAt.has(c) && placeAt.get(c).adm === country).sort((a, b) => placeAt.get(b).pop - placeAt.get(a).pop);
    if (towns.some(c => take(P, placeAt.get(c).name))) continue;
    if (whole && take(P, whole)) continue;
    // a piece with no town of Natural Earth: the town of country-state-city (open data, names only) nearest its middle
    const mid = (() => { let sx = 0, sy = 0; for (const c of P.cells){ const [x, y] = cxy(c); sx += x; sy += y; } sx /= P.cells.length; sy /= P.cells.length; return P.cells.reduce((b, c) => { const [x, y] = cxy(c), [bx, by] = cxy(b); return (x - sx)**2 + (y - sy)**2 < (bx - sx)**2 + (by - sy)**2 ? c : b; }, P.cells[0]); })();
    const near = CSC.filter(t => t.country === country && P.cells.includes(t.cell)).sort((a, b) => hexDist(a.cell, mid) - hexDist(b.cell, mid) || (a.name < b.name ? -1 : 1));
    if (near.some(t => take(P, FIX[t.name] || t.name))) continue;
    const rn = regs[reg.get(P.cells[0])].name; let i = 2; if (!take(P, rn)) while (!take(P, rn + ' ' + i)) i++; }
  // 6. people (thousands) shared by weight within the old province; terrain by majority
  for (const id of provs){ const mine = pieces.filter(P => P.parent === id), tot = mine.reduce((s, P) => s + pw(P), 0), pop0 = WD.provinces[id][4];
    let left = pop0; mine.sort((a, b) => (b.keep ? 1 : 0) - (a.keep ? 1 : 0)); mine.forEach((P, j) => { P.pop = j === mine.length - 1 ? left : Math.round(pop0*pw(P)/tot); left -= P.pop; }); }
  for (const P of pieces) P.terr = terrOf(P.cells);
  // 7. rows: the kept piece overrides its parent's name, people and terrain; the others are appended
  for (const P of pieces.filter(P => P.keep)){ const d = WD.provinces[P.parent]; if (pieces.filter(Q => Q.parent === P.parent).length > 1){ parents[P.parent] = [P.name, P.pop, P.terr]; touch.add(P.parent); } else if (d[0] !== P.name) throw new Error('renamed whole province ' + d[0]); }
  for (const P of pieces.filter(P => !P.keep).sort((a, b) => a.parent - b.parent || Math.min(...a.cells) - Math.min(...b.cells))){ const id = NP0 + newRows.length;
    newRows.push([P.name, k, 0, '', P.pop, P.terr, P.parent]); touch.add(id); for (const c of P.cells.sort((a, b) => a - b)) moved.push([c, id]); }
  report.push(`${country}: ${provs.length} -> ${pieces.length} provinces (${pieces.map(P => P.name + ' ' + P.cells.length + (P.keep ? '*' : '')).join(', ')})`);
}
moved.sort((a, b) => a[0] - b[0]);
const S = {v:1, base:NP0, provinces:newRows, parents, cells:moved.flat(), touch:[...touch].sort((a, b) => a - b)};
{ const {prov, rows} = apply(S); Object.assign(S, linkPairs(prov, rows, touch)); }
// self-check: the same pair rules on world.js as it is give lines.js's own pairs for the provinces of the four countries
{ const T0 = new Set(WD.provinces.map((d, id) => id).filter(id => Object.keys(TARGET).includes(WD.countries[WD.provinces[id][1]]))), L0 = linkPairs(WD.prov, WD.provinces, T0);
  const mine = (list, n) => JSON.stringify(list.filter(p => T0.has(p[0]) || T0.has(p[1])).map(p => p.slice(0, n)).sort((x, y) => x[0] - y[0] || x[1] - y[1]));
  for (const [k, n] of [['riverPairs', 2], ['roadPairs', 4], ['railPairs', 3]]) if (mine(L0[k].map(p => p[0] < p[1] ? p : [p[1], p[0], ...p.slice(2)]), n) !== mine(LN[k].map(p => p[0] < p[1] ? p : [p[1], p[0], ...p.slice(2)]), n)) console.log(`note: ${k} of today's map differ from lines.js for the four countries`); }
const txt = '{"v":1,"base":' + NP0 + ',\n"provinces":[\n' + newRows.map(r => JSON.stringify(r)).join(',\n') + '\n],\n"parents":' + JSON.stringify(parents) + ',\n"cells":' + JSON.stringify(S.cells) + ',\n"touch":' + JSON.stringify(S.touch)
  + ',\n"riverPairs":' + JSON.stringify(S.riverPairs) + ',\n"roadPairs":' + JSON.stringify(S.roadPairs) + ',\n"railPairs":' + JSON.stringify(S.railPairs) + '}\n';
fs.writeFileSync(OUT, txt);
console.log(report.join('\n') + `\ntools/provsplit.json: ${newRows.length} new provinces (${NP0} to ${NP0 + newRows.length - 1}), ${moved.length} cells moved, pairs: river ${S.riverPairs.length}, road ${S.roadPairs.length}, rail ${S.railPairs.length}`);
