// Builds world.js from real administrative borders: Natural Earth admin-1 states and provinces (1:10m, public domain)
// rasterized onto a fine hex grid (600 x 313 cells, ~65 km). Tiny regions are merged into neighbours, large ones are
// split along population (Natural Earth populated places) into provinces named after their main town.
// Sea zones are generated over open water. Cities and capitals come from the curated list in build-world.js.
// usage: NODE_PATH=<dir with node_modules> node tools/build-world2.js <ne_10m_admin_1.geojson> <ne_10m_populated_places_simple.geojson> <ne_10m_geography_regions_polys.geojson>
'use strict';
const fs = require('fs'), path = require('path');
const { City } = require('country-state-city');

const GS = 3, W = 200*GS, H = 104*GS + 1;
const LON0 = -169, LAT_N = 78, LAT_S = -56;
const miller = lat => 1.25*Math.log(Math.tan(Math.PI/4 + 0.4*lat*Math.PI/180));
const invMiller = y => (2.5*Math.atan(Math.exp(0.8*y)) - 0.625*Math.PI)*180/Math.PI;
const YMAX = miller(LAT_N), YMIN = miller(LAT_S);
const N = W*H;
const cellLonLat = i => { const c = i % W, r = (i / W) | 0, x = c + 0.5*(r & 1); return [((LON0 + (x + 0.5)/W*360 + 540) % 360) - 180, invMiller(YMAX - (r/(H - 1))*(YMAX - YMIN))]; };
const projX = lon => ((lon - LON0) % 360 + 360) % 360/360*W - 0.5;
const projY = lat => (YMAX - miller(Math.max(-85, Math.min(85, lat))))/(YMAX - YMIN)*(H - 1);
const lonLatToCell = (lon, lat) => { const r = Math.round(projY(lat)); if (r < 0 || r >= H) return -1; const c = ((Math.round(projX(lon) - 0.5*(r & 1)) % W) + W) % W; return r*W + c; };
const NB_EVEN = [[1,0],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1]], NB_ODD = [[1,0],[1,-1],[0,-1],[-1,0],[0,1],[1,1]];
const nbr = (i, d) => { const c = i % W, r = (i / W) | 0, o = (r & 1) ? NB_ODD[d] : NB_EVEN[d]; const nc = c + o[0], nr = r + o[1]; return (nc < 0 || nr < 0 || nc >= W || nr >= H) ? -1 : nr*W + nc; };
const cube = i => { const c = i % W, r = (i / W) | 0, q = c - (r - (r & 1))/2; return [q, r, -q - r]; };
const hexDist = (a, b) => { const A = cube(a), B = cube(b); return Math.max(Math.abs(A[0]-B[0]), Math.abs(A[1]-B[1]), Math.abs(A[2]-B[2])); };
const cxy = i => { const c = i % W, r = (i / W) | 0; return [(c + 0.5*(r & 1))*1.7320508, r*1.5]; };
function mulberry(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; }; }
const rnd = mulberry(20261105);

// ---- 1. admin-1 regions -> cells (even-odd scanline fill in grid space)
const ADM = JSON.parse(fs.readFileSync(process.argv[2]));
const RENAME = {'United Republic of Tanzania':'Tanzania', 'Republic of Serbia':'Serbia', 'Republic of the Congo':'Congo', 'Democratic Republic of the Congo':'Dem. Rep. Congo',
  'Czech Republic':'Czechia', 'Ivory Coast':"Côte d'Ivoire", 'Central African Republic':'Central African Rep.', 'Bosnia and Herzegovina':'Bosnia and Herz.', 'The Bahamas':'Bahamas',
  'Guinea Bissau':'Guinea-Bissau', 'Swaziland':'Eswatini', 'East Timor':'Timor-Leste', 'Hong Kong S.A.R.':'China', 'Macau S.A.R':'China', 'Baykonur Cosmodrome':'Kazakhstan',
  'Siachen Glacier':'India', 'Northern Cyprus':'Cyprus', 'Dhekelia Sovereign Base Area':'Cyprus', 'Akrotiri Sovereign Base Area':'Cyprus', 'Gaza Strip':'Palestine', 'West Bank':'Palestine',
  'US Naval Base Guantanamo Bay':'Cuba', 'Puerto Rico':'United States of America', 'Western Sahara':'W. Sahara', 'Republic of Congo':'Congo', 'Sao Tome and Principe':'São Tomé and Principe',
  'Equatorial Guinea':'Eq. Guinea', 'Dominican Republic':'Dominican Rep.', 'French Southern and Antarctic Lands':'Fr. S. Antarctic Lands', 'Aland':'Finland', 'Gibraltar':'United Kingdom', 'Jersey':'United Kingdom', 'Guernsey':'United Kingdom', 'Isle of Man':'United Kingdom'};
const feats = ADM.features.filter(f => f.geometry && f.properties.admin !== 'Antarctica');
const countryNames = [], countryIdx = new Map();
const cIndex = n => { if (!countryIdx.has(n)){ countryIdx.set(n, countryNames.length); countryNames.push(n); } return countryIdx.get(n); };
const CLEAN = [/^(Kommuneqarfik|Kommune) /i, /^(London Borough of|Royal Borough of|Metropolitan Borough of|County Borough of|Borough of|City and County of|City of) /i, / (Prefecture|Province|Region|Governorate|District|Council|Borough|County|Municipality|Department|Oblast|Krai|Autonomous Okrug|Autonomous Region|Autonomous Oblast|Republic|State|Territory|Voivodeship|Kray)$/i, /^(Province|Region|Governorate|State|Republic|City) of /i];
const cleanName = n => { let s = n; for (let k = 0; k < 2; k++) for (const re of CLEAN) s = s.replace(re, ''); return s.trim() || n; };
const regInfo = feats.map(f => { const p = f.properties, adm = RENAME[p.admin] || p.admin; return { name: cleanName(p.name || p.name_alt || adm), country: cIndex(adm) }; });
const cellReg = new Int32Array(N).fill(-1);
function rasterize(g, set){
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  for (const poly of polys){
    // each polygon (outer ring + holes) filled on its own: crossings per row
    const rows = new Map();
    for (const ring of poly){ let prev = null; const pts = [];
      for (const [lon, lat] of ring){ let x = projX(lon); if (prev !== null){ while (x - prev > W/2) x -= W; while (prev - x > W/2) x += W; } pts.push([x, projY(lat)]); prev = x; }
      for (let i = 0; i < pts.length - 1; i++){ const [x1, y1] = pts[i], [x2, y2] = pts[i + 1]; if (y1 === y2) continue;
        const lo = Math.min(y1, y2), hi = Math.max(y1, y2);
        for (let r = Math.max(0, Math.ceil(lo)); r < hi && r < H; r++){ if (r < lo) continue; const x = x1 + (x2 - x1)*(r - y1)/(y2 - y1); let a = rows.get(r); if (!a) rows.set(r, a = []); a.push(x); } } }
    for (const [r, xs] of rows){ xs.sort((a, b) => a - b); const off = 0.5*(r & 1);
      for (let j = 0; j + 1 < xs.length; j += 2){ for (let c = Math.ceil(xs[j] - off); c + off < xs[j + 1]; c++) set(r*W + ((c % W) + W) % W); } }
  }
}
feats.forEach((f, k) => rasterize(f.geometry, i => { if (cellReg[i] < 0) cellReg[i] = k; }));
// a region smaller than a cell still claims the cell at its centre if nobody else has it (micro-states, small islands)
{ const has = new Uint8Array(feats.length); for (let i = 0; i < N; i++) if (cellReg[i] >= 0) has[cellReg[i]] = 1;
  feats.forEach((f, k) => { if (has[k]) return; const g = f.geometry, ring = g.type === 'Polygon' ? g.coordinates[0] : g.coordinates.reduce((a, p) => p[0].length > a.length ? p[0] : a, []); if (!ring.length) return;
    let sx = 0, sy = 0; for (const [lo, la] of ring){ sx += lo; sy += la; } const c = lonLatToCell(sx/ring.length, sy/ring.length); if (c >= 0 && cellReg[c] < 0) cellReg[c] = k; }); }
// specks: countries with fewer than 3 cells (micro-states, atolls) stay off the map
{ const cnt = new Map(); for (let i = 0; i < N; i++) if (cellReg[i] >= 0){ const c = regInfo[cellReg[i]].country; cnt.set(c, (cnt.get(c) || 0) + 1); }
  for (let i = 0; i < N; i++) if (cellReg[i] >= 0 && cnt.get(regInfo[cellReg[i]].country) < 3) cellReg[i] = -1; }
const cellCountry = new Int32Array(N).fill(-1); for (let i = 0; i < N; i++) if (cellReg[i] >= 0) cellCountry[i] = regInfo[cellReg[i]].country;

// ---- 2. population density from Natural Earth populated places
const PP = JSON.parse(fs.readFileSync(process.argv[3])).features.map(f => ({ name: f.properties.name, pop: Math.max(f.properties.pop_max || 0, 1000), lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], cap: f.properties.featurecla, rank: f.properties.scalerank, adm: RENAME[f.properties.adm0name] || f.properties.adm0name }));
for (const p of PP) p.cell = lonLatToCell(p.lon, p.lat);
const popD = new Float32Array(N);
for (const p of PP) if (p.cell >= 0) popD[p.cell] += p.pop;
// blur ~3 rings: urban pull plus a land floor
let D = popD; for (let it = 0; it < 3*GS; it++){ const nx = new Float32Array(N); for (let i = 0; i < N; i++){ if (cellCountry[i] < 0) continue; let s = D[i]*2, n = 2; for (let d = 0; d < 6; d++){ const m = nbr(i, d); if (m >= 0 && cellCountry[m] >= 0){ s += D[m]; n++; } } nx[i] = s/n; } D = nx; }
const dens = D;   // people per cell, smoothed
// country-state-city towns for naming only
const townAt = new Array(N).fill(null);
for (const c of City.getAllCities()){ const cell = lonLatToCell(+c.longitude, +c.latitude); if (cell >= 0 && cellCountry[cell] >= 0 && !townAt[cell] && c.name.length <= 16 && /^[A-Za-z' .-]+$/.test(c.name)) townAt[cell] = c.name; }
const placeAt = new Array(N).fill(null);
for (const p of PP.slice().sort((a, b) => b.pop - a.pop)) if (p.cell >= 0 && cellCountry[p.cell] >= 0 && !placeAt[p.cell] && p.name.length <= 20 && (!countryIdx.has(p.adm) || countryIdx.get(p.adm) === cellCountry[p.cell])) placeAt[p.cell] = p;

// ---- 2b. terrain per cell: real mountain ranges, deserts and tundra (Natural Earth geography regions), forests by biome
const GEO = process.argv[4] ? JSON.parse(fs.readFileSync(process.argv[4])).features : [];
const cellT = new Uint8Array(N);   // 0 plains 1 forest 2 mountain 3 desert 4 tundra
for (const f of GEO){ const k = f.properties.FEATURECLA, t = k === 'Range/mtn' ? 2 : k === 'Desert' ? 3 : k === 'Tundra' ? 4 : 0; if (t && f.geometry) rasterize(f.geometry, i => { if (cellT[i] !== 2) cellT[i] = t; }); }
{ const g = new Float32Array(64*64), r0 = mulberry(77); for (let i = 0; i < g.length; i++) g[i] = r0();
  const at = (x, y) => g[((y & 63)*64) + (x & 63)], sm = t => t*t*(3 - 2*t), noise = (x, y) => { const x0 = Math.floor(x), y0 = Math.floor(y), fx = sm(x - x0), fy = sm(y - y0), a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1); return a + (b - a)*fx + (c - a)*fy + (a - b - c + d)*fx*fy; };
  const BOX = (lon, lat, a, b, c, d) => lon >= a && lon <= b && lat >= c && lat <= d;
  const FOR = [[-75, -45, -15, 5], [10, 30, -5, 5], [95, 125, -8, 20], [-130, -60, 50, 64], [30, 140, 52, 64], [10, 30, 58, 66], [-90, -70, 30, 45], [125, 140, 30, 45], [-80, -35, -30, -15], [-10, 30, 45, 58], [100, 120, 20, 32], [-125, -120, 40, 50], [140, 155, -40, -10]];
  for (let i = 0; i < N; i++){ if (cellReg[i] < 0) continue; const [lon, lat] = cellLonLat(i), c = i % W, r = (i / W) | 0, nz = noise(c/(5*GS), r/(5*GS))*0.7 + noise(c/(1.6*GS) + 9, r/(1.6*GS))*0.3;
    if (cellT[i] === 2 || cellT[i] === 3) continue;
    if (Math.abs(lat) > 66 || cellT[i] === 4 || (Math.abs(lat) > 62 && nz < 0.55)){ cellT[i] = 4; continue; }
    cellT[i] = (FOR.some(b => BOX(lon, lat, ...b)) ? nz > 0.32 : nz > 0.72) ? 1 : 0; } }

const geoName = new Array(N).fill(null); { const OKC = new Set(['Island', 'Pen/cape', 'Range/mtn', 'Plateau', 'Basin', 'Plain', 'Desert', 'Peninsula', 'Lowland', 'Delta', 'Valley', 'Wetlands', 'Tundra', 'Depression', 'Foothills', 'Coast', 'Island group']);
  const list = GEO.filter(f => f.geometry && OKC.has(f.properties.FEATURECLA) && f.properties.NAME_EN && f.properties.NAME_EN.length <= 22).map(f => { const cells = []; rasterize(f.geometry, i => cells.push(i)); return { name: f.properties.NAME_EN.replace(/^(The) /, ''), cells }; }).filter(g => g.cells.length);
  list.sort((a, b) => b.cells.length - a.cells.length); for (const g of list) for (const c of g.cells) geoName[c] = g.name; }

// ---- 3. units: connected pieces of each region
let units = [];   // {country, name, cells:Set}
const unitOf = new Int32Array(N).fill(-1);
{ const seen = new Uint8Array(N);
  for (let i = 0; i < N; i++){ if (cellReg[i] < 0 || seen[i]) continue; const k = cellReg[i], comp = [i]; seen[i] = 1;
    for (let h = 0; h < comp.length; h++) for (let d = 0; d < 6; d++){ const m = nbr(comp[h], d); if (m >= 0 && !seen[m] && cellReg[m] === k){ seen[m] = 1; comp.push(m); } }
    const u = { country: regInfo[k].country, name: regInfo[k].name, reg: k, cells: comp }; for (const c of comp) unitOf[c] = units.length; units.push(u); } }
const area = u => u.cells.length;
const meanDens = u => u.cells.reduce((s, c) => s + dens[c], 0)/u.cells.length;
// target province size in cells: small where people live, large in empty land; high latitudes shrink in km so get a few more cells
const target = c => { const [, lat] = cellLonLat(c), d = dens[c], la = Math.abs(lat), latK = la > 55 ? 1.5 : la > 45 ? 1.2 : 1;
  return Math.max(4, Math.min(90, 52/(1 + Math.pow(d/6000, 0.55))))*latK; };
// merge tiny pieces: islands next to the mainland and fragments join the smallest same-country neighbour
function rebuildUnitOf(){ unitOf.fill(-1); units.forEach((u, k) => { for (const c of u.cells) unitOf[c] = k; }); }
for (let pass = 0; pass < 6; pass++){
  let changed = 0; const order = units.map((u, k) => k).filter(k => units[k].cells.length).sort((a, b) => area(units[a]) - area(units[b]));
  for (const k of order){ const u = units[k]; if (!u.cells.length) continue; const tgt = target(u.cells[0]), minC = Math.max(2, Math.round(tgt*0.38));
    if (area(u) >= minC) continue;
    const nb = new Map(); for (const c of u.cells) for (let d = 0; d < 6; d++){ const m = nbr(c, d); if (m < 0) continue; const v = unitOf[m]; if (v >= 0 && v !== k && units[v].country === u.country) nb.set(v, (nb.get(v) || 0) + 1); }
    let best = -1, bs = Infinity;
    for (const [v, shared] of nb){ const s = area(units[v]) - shared*0.8 - (units[v].reg === u.reg ? 30 : 0); if (s < bs){ bs = s; best = v; } }
    if (best < 0){ // detached piece: nearest same-country unit within reach
      let bd = 3*GS + 1; for (const c of u.cells) for (let dr = -bd; dr <= bd; dr++){ const r = ((c / W) | 0) + dr; if (r < 0 || r >= H) continue; for (let dc = -bd; dc <= bd; dc++){ const cc = (c % W) + dc; if (cc < 0 || cc >= W) continue; const m = r*W + cc, v = unitOf[m];
        if (v >= 0 && v !== k && units[v].country === u.country){ const dd = hexDist(c, m); if (dd < bd){ bd = dd; best = v; } } } }
    }
    if (best < 0) continue;
    const B = units[best];
    // the merged province keeps the name of the more populous part
    const pa = u.cells.reduce((s, c) => s + popD[c], 0), pb = B.cells.reduce((s, c) => s + popD[c], 0);
    if (pa > pb*1.5 && area(u) >= 2){ B.name = u.name; B.reg = u.reg; }
    for (const c of u.cells){ B.cells.push(c); unitOf[c] = best; } u.cells = []; changed++;
  }
  units = units.filter(u => u.cells.length); rebuildUnitOf();
  if (!changed) break;
}
// split large units: seeds at the largest towns, then geodesic Voronoi inside the unit (connected by construction)
const provinces = [];   // {country, name, cells, regName}
for (const u of units){
  const n = area(u), tgt = u.cells.reduce((s, c) => s + target(c), 0)/n, k = Math.max(1, Math.round(n/tgt));
  if (k === 1){ provinces.push({ country: u.country, name: u.name, regName: u.name, cells: u.cells }); continue; }
  const inU = new Set(u.cells), spacing = Math.max(2, Math.sqrt(tgt)*0.75);
  const seeds = [];
  const byPop = u.cells.filter(c => placeAt[c]).sort((a, b) => placeAt[b].pop - placeAt[a].pop);
  for (const c of byPop){ if (seeds.length >= k) break; if (seeds.every(s => hexDist(s, c) >= spacing)) seeds.push(c); }
  while (seeds.length < k){ let best = -1, bv = -1; for (const c of u.cells){ const v = seeds.reduce((m, s) => Math.min(m, hexDist(s, c)), 1e9) + rnd()*0.3; if (v > bv){ bv = v; best = c; } } seeds.push(best); }
  const grow = sd => { const own = new Map(), q = []; sd.forEach((s, j) => { own.set(s, j); q.push(s); });
    for (let h = 0; h < q.length; h++){ const c = q[h]; for (let d = 0; d < 6; d++){ const m = nbr(c, d); if (m >= 0 && inU.has(m) && !own.has(m)){ own.set(m, own.get(c)); q.push(m); } } } return own; };
  let own = grow(seeds);
  for (let it = 0; it < 4; it++){ // Lloyd relaxation, town seeds stay put
    const sums = seeds.map(() => [0, 0, 0]); for (const [c, j] of own){ const [x, y] = cxy(c); sums[j][0] += x; sums[j][1] += y; sums[j][2]++; }
    for (let j = 0; j < seeds.length; j++){ if (placeAt[seeds[j]] && placeAt[seeds[j]].pop > 150000) continue; const [sx, sy, sn] = sums[j]; if (!sn) continue; let bc = seeds[j], bd = Infinity;
      for (const [c, jj] of own){ if (jj !== j) continue; const [x, y] = cxy(c), dd = (x - sx/sn)**2 + (y - sy/sn)**2; if (dd < bd){ bd = dd; bc = c; } } seeds[j] = bc; }
    own = grow(seeds); }
  const parts = seeds.map(() => []); for (const [c, j] of own) parts[j].push(c);
  for (const cells of parts) if (cells.length) provinces.push({ country: u.country, name: null, regName: u.name, cells });
}

// ---- 4. cities (curated list shared with build-world.js)
const src = fs.readFileSync(path.join(__dirname, 'build-world.js'), 'utf8');
const CITIES = src.slice(src.indexOf('const CITIES = `') + 16, src.indexOf('`', src.indexOf('const CITIES = `') + 16)).split(';').map(s => s.trim()).filter(Boolean)
  .map(s => { const cap = s[0] === '*'; const [n, la, lo] = (cap ? s.slice(1) : s).split(','); return { name: n, lat: +la, lon: +lo, cap }; });
const provOf = new Int32Array(N).fill(-1); provinces.forEach((p, k) => { for (const c of p.cells) provOf[c] = k; });
for (const ct of CITIES){ let c = lonLatToCell(ct.lon, ct.lat), best = -1, bd = 3*GS + 1;
  if (c >= 0 && provOf[c] >= 0) best = c; else for (let dr = -bd; dr <= bd; dr++) for (let dc = -bd; dc <= bd; dc++){ const r = ((c / W) | 0) + dr, cc = (c % W) + dc; if (r < 0 || r >= H || cc < 0 || cc >= W) continue; const m = r*W + cc; if (provOf[m] >= 0){ const d = hexDist(c, m); if (d < bd){ bd = d; best = m; } } }
  if (best < 0){ console.warn('city off map:', ct.name); continue; }
  const P = provinces[provOf[best]];
  if (!P.city || (ct.cap && !P.cap)){ P.city = ct.name; P.cap = ct.cap; P.cityCell = best; }
}
// names: whole regions keep their name; split parts take their main town, falling back to compass names
const compass = (from, to) => { const [ax, ay] = cxy(from), [bx, by] = cxy(to), dx = bx - ax, dy = by - ay; const ns = dy < -Math.abs(dx)*0.5 ? 'North' : dy > Math.abs(dx)*0.5 ? 'South' : '', ew = dx > Math.abs(dy)*0.5 ? 'East' : dx < -Math.abs(dy)*0.5 ? 'West' : ''; return (ns + (ns && ew ? '-' + ew.toLowerCase() : ew)) || 'Central'; };
const used = new Map(); // country -> Set of names
const take = (p, nm) => { let s = used.get(p.country); if (!s) used.set(p.country, s = new Set()); if (s.has(nm)) return false; s.add(nm); p.name = nm; return true; };
for (const p of provinces) if (p.name) { if (!take(p, p.name)) p.name = null; }
const byReg = new Map(); for (const p of provinces) if (!p.name){ const key = p.country + '|' + p.regName; if (!byReg.has(key)) byReg.set(key, []); byReg.get(key).push(p); }
for (const [, list] of byReg){
  const centre = (() => { let sx = 0, sy = 0, n = 0; for (const p of list) for (const c of p.cells){ const [x, y] = cxy(c); sx += x; sy += y; n++; } sx /= n; sy /= n; let bc = list[0].cells[0], bd = Infinity; for (const p of list) for (const c of p.cells){ const [x, y] = cxy(c), d = (x - sx)**2 + (y - sy)**2; if (d < bd){ bd = d; bc = c; } } return bc; })();
  for (const p of list.slice().sort((a, b) => (b.city ? 1 : 0) - (a.city ? 1 : 0))){
    if (p.city && take(p, p.city)) continue;
    const pl = p.cells.filter(c => placeAt[c]).sort((a, b) => placeAt[b].pop - placeAt[a].pop);
    if (pl.length && take(p, placeAt[pl[0]].name)) continue;
    const pc = (() => { let sx = 0, sy = 0; for (const c of p.cells){ const [x, y] = cxy(c); sx += x; sy += y; } sx /= p.cells.length; sy /= p.cells.length; let bc = p.cells[0], bd = Infinity; for (const c of p.cells){ const [x, y] = cxy(c), d = (x - sx)**2 + (y - sy)**2; if (d < bd){ bd = d; bc = c; } } return bc; })();
    const cmp = compass(centre, pc), base = p.regName.replace(/^(North|South|East|West|Central) /, '');
    const tw = p.cells.filter(c => townAt[c]).sort((a, b) => hexDist(a, pc) - hexDist(b, pc));
    let ok = false; for (const c of tw) if (take(p, townAt[c])){ ok = true; break; } if (ok) continue;
    const gh = new Map(); for (const c of p.cells) if (geoName[c]) gh.set(geoName[c], (gh.get(geoName[c]) || 0) + 1);
    for (const [g] of [...gh].sort((a, b) => b[1] - a[1])) if (take(p, g)){ ok = true; break; } if (ok) continue;
    if ((cmp + base).length <= 20 && take(p, `${cmp} ${base}`)) continue;
    for (const pre of ['Upper', 'Lower', 'Inner', 'Outer', 'Greater', 'Coastal', 'Highland']) if (take(p, `${pre} ${base}`)){ ok = true; break; } if (ok) continue;
    let i = 2; while (!take(p, `${base} ${i}`)) i++;
  }
}

// ---- 5. sea zones over open water
const prov = new Int32Array(N).fill(-1); provinces.forEach((p, k) => { for (const c of p.cells) prov[c] = k; });
const water = []; for (let i = 0; i < N; i++) if (prov[i] < 0) water.push(i);
// coastal water gets denser zones than the open ocean
const coastD = new Int16Array(N).fill(99); { let fr = []; for (let i = 0; i < N; i++) if (prov[i] >= 0){ coastD[i] = 0; fr.push(i); } for (let d0 = 1; d0 < 99 && fr.length; d0++){ const nx = []; for (const c of fr) for (let d = 0; d < 6; d++){ const m = nbr(c, d); if (m >= 0 && coastD[m] > d0){ coastD[m] = d0; nx.push(m); } } fr = nx; } }
const seaSeeds = []; const ord = water.slice().sort(() => rnd() - 0.5);
const seaSp = c => coastD[c] <= 3*GS ? 5*GS : 8*GS;
for (const c of ord){ if (seaSeeds.every(s => hexDist(s, c) >= Math.min(seaSp(c), seaSp(s)))) seaSeeds.push(c); }
const SEAS = [
  ['Mediterranean Sea', -6, 36, 30, 46], ['Black Sea', 27, 42, 40.5, 47.5], ['Caspian Sea', 46, 55, 36, 47.5], ['Red Sea', 32, 44, 12, 30], ['Persian Gulf', 47, 57, 23, 31],
  ['Baltic Sea', 9, 31, 53, 66], ['North Sea', -4, 9, 51, 61], ['Norwegian Sea', -10, 16, 61, 72], ['Barents Sea', 16, 60, 68, 80], ['Kara Sea', 60, 100, 68, 80],
  ['Laptev Sea', 100, 140, 70, 80], ['East Siberian Sea', 140, 180, 68, 80], ['Bering Sea', 162, 200, 51, 66], ['Sea of Okhotsk', 135, 162, 43, 62], ['Sea of Japan', 127, 142, 33, 52],
  ['East China Sea', 117, 131, 23, 34], ['Yellow Sea', 117, 127, 34, 41], ['South China Sea', 99, 121, 0, 23], ['Philippine Sea', 121, 145, 5, 30], ['Java Sea', 105, 120, -9, -2],
  ['Banda Sea', 120, 135, -9, 0], ['Arafura Sea', 130, 142, -12, -6], ['Coral Sea', 142, 165, -30, -9], ['Tasman Sea', 147, 175, -48, -30], ['Bay of Bengal', 79, 99, 5, 23],
  ['Arabian Sea', 50, 77, 5, 26], ['Gulf of Mexico', -98, -80, 18, 31], ['Caribbean Sea', -88, -60, 9, 22], ['Hudson Bay', -95, -75, 51, 66], ['Labrador Sea', -65, -44, 52, 66],
  ['Baffin Bay', -80, -55, 66, 80], ['Gulf of Alaska', -160, -130, 52, 62], ['Gulf of Guinea', -10, 10, -6, 6], ['Mozambique Channel', 35, 50, -26, -10], ['Greenland Sea', -25, 10, 70, 80],
  ['Beaufort Sea', -160, -120, 68, 80], ['Great Lakes', -93, -76, 41, 49.5], ['Adriatic Sea', 12, 20, 39.8, 46], ['Aegean Sea', 22, 28.5, 35, 41], ['Bay of Biscay', -10, -1, 43, 48.5],
  ['English Channel', -6, 2, 48.5, 51.2], ['Irish Sea', -7, -2.8, 51.5, 55.5], ['Gulf of Bothnia', 17, 26, 60, 66], ['Gulf of Aden', 43, 52, 10.5, 15], ['Gulf of California', -115, -106, 22, 32],
  ['Sea of Azov', 34.5, 39.5, 45, 47.5], ['Celebes Sea', 118, 126, 0, 8], ['Gulf of Thailand', 99, 105, 5, 14],
];
function seaName(cell){
  const [lon, lat] = cellLonLat(cell);
  for (const [n, a, b, c, d] of SEAS){ const L = lon < a && lon + 360 <= b ? lon + 360 : lon; if (L >= a && L <= b && lat >= c && lat <= d) return n; }
  const atl = lon < 20 && lon > (lat >= 25 ? -100 : lat >= 8 ? -85 : lat >= -5 ? -78 : -69);
  const ocean = atl ? 'Atlantic' : (lon >= 20 && lon < 120 && lat < 25) ? 'Indian Ocean' : 'Pacific';
  if (lat > 66) return 'Arctic Ocean'; if (lat < -45) return 'Southern Ocean';
  if (ocean === 'Indian Ocean') return lat > -15 ? 'North Indian Ocean' : 'South Indian Ocean';
  return (lat > 30 ? 'North ' : lat < -10 ? 'South ' : 'Central ') + ocean;
}
const seaBase = provinces.length;
seaSeeds.forEach((s, i) => { provinces.push({ name: seaName(s), country: -1, sea: true, cells: [] }); prov[s] = seaBase + i; });
{ let fr = seaSeeds.slice(); while (fr.length){ const nx = []; for (const c of fr) for (let d = 0; d < 6; d++){ const m = nbr(c, d); if (m >= 0 && prov[m] < 0){ prov[m] = prov[c]; nx.push(m); } } fr = nx; } }
for (const p of provinces) p.cells = [];
for (let i = 0; i < N; i++) if (prov[i] >= 0) provinces[prov[i]].cells.push(i);
// sea zones cut in two by land (bays, lakes behind straits) become separate zones; tiny ones join a neighbour
for (let k = seaBase, n0 = provinces.length; k < n0; k++){ const P = provinces[k]; if (!P.cells.length) continue; const seen = new Set(), comps = [];
  for (const c of P.cells){ if (seen.has(c)) continue; const comp = [c]; seen.add(c); for (let h = 0; h < comp.length; h++) for (let d = 0; d < 6; d++){ const m = nbr(comp[h], d); if (m >= 0 && prov[m] === k && !seen.has(m)){ seen.add(m); comp.push(m); } } comps.push(comp); }
  if (comps.length < 2) continue; comps.sort((a, b) => b.length - a.length);
  for (const comp of comps.slice(1)){ if (comp.length >= 6*GS){ provinces.push({ name: P.name, country: -1, sea: true, cells: comp }); for (const c of comp) prov[c] = provinces.length - 1; }
    else { let tgt = -1; for (const c of comp) for (let d = 0; d < 6 && tgt < 0; d++){ const m = nbr(c, d); if (m >= 0 && prov[m] >= 0 && prov[m] !== k && provinces[prov[m]].sea) tgt = prov[m]; }
      if (tgt < 0) for (const c of comp) for (let d = 0; d < 6 && tgt < 0; d++){ const m = nbr(c, d); if (m >= 0 && prov[m] >= 0 && prov[m] !== k) tgt = prov[m]; }
      if (tgt >= 0) for (const c of comp) prov[c] = tgt; } } }
for (const p of provinces) p.cells = [];
for (let i = 0; i < N; i++) if (prov[i] >= 0) provinces[prov[i]].cells.push(i);
const seaCount = new Map(); for (const p of provinces) if (p.sea && p.cells.length) seaCount.set(p.name, (seaCount.get(p.name) || 0) + 1);
const roman = n => { const R = [['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]]; let s = ''; for (const [l, v] of R) while (n >= v){ s += l; n -= v; } return s; };
const seaN = new Map(); for (const p of provinces) if (p.sea && p.cells.length && seaCount.get(p.name) > 1){ const n = (seaN.get(p.name) || 0) + 1; seaN.set(p.name, n); p.name = `${p.name} ${roman(n)}`; }

// ---- 6. population per province (thousands): towns plus a rural share spread by density
const finalP = provinces.filter(p => p.cells.length);
const remap = new Map(); provinces.forEach((p, i) => { if (p.cells.length) remap.set(i, finalP.indexOf(p)); });
{ const fi = new Map(finalP.map((p, i) => [p, i])); for (let i = 0; i < N; i++) prov[i] = prov[i] >= 0 ? fi.get(provinces[prov[i]]) : -1; }
// real national totals (millions, ~2024) spread over provinces by towns and density; other countries from the model, scaled alike
const POPM = {'United States of America':335, Canada:40, Brazil:216, 'United Kingdom':68, France:68, Germany:84, Russia:144, Turkey:85, Iran:89, Egypt:112, 'South Africa':62, India:1430, China:1410, Japan:124, Australia:27,
  Mexico:129, Indonesia:278, Pakistan:240, Nigeria:224, Bangladesh:173, Ethiopia:127, Philippines:117, Vietnam:99, 'Dem. Rep. Congo':102, Thailand:72, Italy:59, Spain:48, Poland:37, Ukraine:37, Argentina:46, Colombia:52,
  Kenya:55, Tanzania:67, Myanmar:54, 'South Korea':52, 'North Korea':26, Algeria:46, Sudan:48, Uganda:48, Iraq:45, Afghanistan:41, Morocco:37, 'Saudi Arabia':36, Uzbekistan:36, Peru:34, Malaysia:34, Angola:37,
  Mozambique:34, Ghana:34, Yemen:34, Nepal:31, Venezuela:28, Madagascar:30, Cameroon:28, "Côte d'Ivoire":29, Niger:27, Taiwan:23, 'Sri Lanka':22, 'Burkina Faso':23, Mali:23, Chile:20, Kazakhstan:20, Romania:19,
  Syria:23, Netherlands:18, Ecuador:18, Cambodia:17, Zambia:20, Zimbabwe:16, Senegal:18, Chad:18, Somalia:15, Somaliland:4, Guatemala:18, Belgium:11.7, Sweden:10.5, Greece:10.4, Portugal:10.4, Czechia:10.9, Hungary:9.6,
  Belarus:9.2, Austria:9.1, Switzerland:8.8, Israel:9.8, Serbia:6.7, Bulgaria:6.4, Denmark:5.9, Finland:5.6, Norway:5.5, 'New Zealand':5.2, Ireland:5.2, Mongolia:3.4, Libya:6.9, Tunisia:12, Jordan:11,
  Azerbaijan:10, Turkmenistan:6.5, Tajikistan:10, Kyrgyzstan:7, 'Papua New Guinea':10, Bolivia:12, Paraguay:6.8, Cuba:11, 'Dominican Rep.':11, Haiti:11.7, Greenland:0.06, Iceland:0.38, Laos:7.6, Oman:4.6,
  'United Arab Emirates':9.5, Benin:13.7, Guinea:14, Rwanda:14, Burundi:13, Malawi:21, 'S. Sudan':11, 'South Sudan':11, Namibia:2.6, Botswana:2.6, Mauritania:4.9, 'Central African Rep.':5.7, Congo:6, Gabon:2.4,
  Eritrea:3.7, Liberia:5.4, 'Sierra Leone':8.8, Togo:9, Lebanon:5.4, Georgia:3.7, Armenia:2.8, Moldova:2.5, Lithuania:2.8, Latvia:1.9, Estonia:1.3, Slovakia:5.4, Slovenia:2.1, Croatia:3.9, 'Bosnia and Herz.':3.2,
  Albania:2.8, Macedonia:1.8, 'North Macedonia':1.8, Montenegro:0.6, Kosovo:1.8, Uruguay:3.4, Panama:4.4, 'Costa Rica':5.2, Nicaragua:7, Honduras:10.6, 'El Salvador':6.3, Guyana:0.8, Suriname:0.6, 'W. Sahara':0.6};
for (const p of finalP){ if (p.sea){ p.pop = 0; continue; } let urb = 0, rur = 0; for (const c of p.cells){ urb += popD[c]; rur += 1500 + dens[c]*1.2; } p.w = urb*0.8 + rur; }
{ const tot = new Map(); for (const p of finalP) if (!p.sea) tot.set(p.country, (tot.get(p.country) || 0) + p.w);
  let kn = 0, km = 0; for (const [c, w] of tot){ const m = POPM[countryNames[c]]; if (m){ kn += m*1e6; km += w; } } const k0 = kn/km;
  for (const p of finalP){ if (p.sea) continue; const m = POPM[countryNames[p.country]], t = tot.get(p.country); p.pop = Math.round((m ? m*1e6*p.w/t : p.w*k0)/1000); } }

for (const p of finalP){ if (p.sea) continue; const h = [0, 0, 0, 0, 0]; for (const c of p.cells) h[cellT[c]]++; const n = p.cells.length;
  p.terr = h[2] >= n*0.4 ? 'm' : h[3] >= n*0.5 ? 'd' : h[4] >= n*0.5 ? 't' : h[1] >= n*0.45 ? 'f' : h[2] + h[3] > n*0.6 ? (h[2] > h[3] ? 'm' : 'd') : 'p'; }
fs.mkdirSync(path.join(__dirname, '..', '.test'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', '.test', 'terrcells.js'), 'window.TERRCELLS = ' + JSON.stringify(Array.from(cellT).join('')) + ';\n');   // bake-only: per-cell terrain for the texture

// ---- 7. encode: run-length over the cell array, base36 "id.len" runs
const used0 = [...new Set(finalP.filter(p => !p.sea).map(p => p.country))].sort((a, b) => countryNames[a] < countryNames[b] ? 1 : -1);
const cMap = new Map(used0.map((k, i) => [k, i]));
const runs = []; for (let i = 0; i < N;){ const v = prov[i]; let j = i; while (j < N && prov[j] === v) j++; runs.push((v < 0 ? '' : v.toString(36)) + '.' + (j - i).toString(36)); i = j; }
const out = { W, H, GS, lon0: LON0, latN: LAT_N, latS: LAT_S, v: 2, countries: used0.map(k => countryNames[k]),
  provinces: finalP.map(p => p.sea ? [p.name, -1, 0, ''] : [p.name, cMap.get(p.country), (p.city ? 1 : 0) | (p.cap ? 2 : 0), p.city || '', p.pop, p.terr]),
  rle: runs.join(' ') };
const file = path.join(__dirname, '..', 'world.js');
fs.writeFileSync(file, `// Generated by tools/build-world2.js from Natural Earth admin-1 borders and populated places (public domain) and country-state-city (open data).\n` +
  `window.WORLD = ${JSON.stringify(out)};\n` +
  `(function(w){ const a = new Int32Array(w.W*w.H); let i = 0; for (const r of w.rle.split(' ')){ const k = r.indexOf('.'), v = k ? parseInt(r.slice(0, k), 36) : -1, n = parseInt(r.slice(k + 1), 36); a.fill(v, i, i + n); i += n; } w.prov = a; })(window.WORLD);\n`);
const land = finalP.filter(p => !p.sea);
console.log(`provinces: ${land.length} land + ${finalP.length - land.length} sea = ${finalP.length}; countries ${used0.length}; cities ${land.filter(p => p.city).length}; file ${(fs.statSync(file).size/1024).toFixed(0)} KB`);
const missingCaps = CITIES.filter(c => c.cap && !land.some(p => p.cap && p.city === c.name)).map(c => c.name); console.log('capitals missing:', missingCaps.join(', ') || 'none');
const per = new Map(); for (const p of land){ const n = countryNames[p.country]; per.set(n, (per.get(n) || 0) + 1); }
console.log([...per].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([n, c]) => `${n}:${c}`).join(' '));
const sizes = land.map(p => p.cells.length).sort((a, b) => a - b); console.log('cells/province p10 p50 p90 max', sizes[sizes.length*0.1 | 0], sizes[sizes.length/2 | 0], sizes[sizes.length*0.9 | 0], sizes[sizes.length - 1]);
