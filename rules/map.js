// Iron Meridian rules: map. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
/* ---------------- World map ---------------- */
function loadWorld(){
  const N = W*H, prov = WORLD.prov || new Int16Array(N);
  if (!WORLD.prov) for (let i = 0; i < N; i++){ const s = WORLD.cells.substr(i*2, 2); prov[i] = s === '..' ? -1 : parseInt(s, 36); }
  const P = WORLD.provinces.map((d, k) => ({id:k, name:d[0], country:d[1], sea:d[1] < 0, city:!!(d[2] & 1), capFlag:!!(d[2] & 2), cityName:d[3], cells:[], nb:new Map()}));
  for (let i = 0; i < N; i++) if (prov[i] >= 0) P[prov[i]].cells.push(i);
  for (const p of P){
    let sx = 0, sy = 0; for (const c of p.cells){ const [x, y] = cellCenter(c); sx += x; sy += y; }
    sx /= p.cells.length; sy /= p.cells.length;
    let bc = p.cells[0], bd = 1e9; for (const c of p.cells){ const [x, y] = cellCenter(c); const dd = (x-sx)**2 + (y-sy)**2; if (dd < bd){ bd = dd; bc = c; } }
    p.cc = bc; [p.x, p.y] = cellCenter(bc); p.lat = cellLat(bc);
  }
  for (let i = 0; i < N; i++){ if (prov[i] < 0) continue; for (let d = 0; d < 6; d++){ const m = nbr(i, d);
    if (m >= 0 && prov[m] >= 0 && prov[m] !== prov[i]){ const a = P[prov[i]], b = prov[m]; if (!a.nb.has(b)) a.nb.set(b, Math.max(GS > 1 ? 0.35 : 1, hexDist(a.cc, P[b].cc))); } } }
  // straits: water bodies the hex grid closes off (Gibraltar, the Danish straits, the Bosporus, Suez, Bab-el-Mandeb, Hormuz, narrow sounds) are
  // joined to the neighbouring water where one coastal province touches both (closest pairs first); the Caspian stays a lake. Ids are unchanged.
  { const par = P.map((p, i) => i), find = i => { while (par[i] !== i) i = par[i] = par[par[i]]; return i; };
    for (const p of P) if (p.sea) for (const v of p.nb.keys()) if (P[v].sea) par[find(p.id)] = find(v);
    const lake = p => /Caspian/.test(p.name), cand = [];
    for (const p of P){ if (p.sea) continue; const ss = [...p.nb.keys()].filter(v => P[v].sea && !lake(P[v]));
      for (let i = 0; i < ss.length; i++) for (let j = i + 1; j < ss.length; j++) if (find(ss[i]) !== find(ss[j])) cand.push([ss[i], ss[j], hexDist(P[ss[i]].cc, P[ss[j]].cc)]); }
    cand.sort((x, y) => x[2] - y[2]); loadWorld.straits = [];
    for (const [a, b, d] of cand){ if (find(a) === find(b)) continue; par[find(a)] = find(b); const w = Math.max(GS > 1 ? 0.35 : 1, d); P[a].nb.set(b, w); P[b].nb.set(a, w); loadWorld.straits.push([a, b]); } }
  for (const p of P){ p.nbs = [...p.nb.keys()]; p.coast = !p.sea && p.nbs.some(v => P[v].sea); p.river = new Set(); p.road = new Set(); p.lk = new Map(); }
  // rivers, roads and railways (Natural Earth): river lines between provinces, road and rail links between neighbours, drawable paths by class
  // LK: one record per linked neighbour pair; r0/q0 are the static road (1 track, 2 road, 3 highway) and rail (1 railway, 2 high-speed) levels,
  // road/rail/dmg/bld the live state (reset from S.links by linksSync)
  const LK = new Map();
  const mk = (a, b) => { let r = P[a].lk.get(b); if (!r){ r = {a:Math.min(a, b), b:Math.max(a, b), k:Math.min(a, b) + ',' + Math.max(a, b), r0:0, q0:0, road:0, rail:0, dmg:0, bld:null, gap:false}; LK.set(r.k, r); P[a].lk.set(b, r); P[b].lk.set(a, r); } return r; };
  if (LINES){ const L = LINES;
    for (const [a, b] of L.riverPairs) if (P[a] && P[b] && P[a].nb.has(b)){ P[a].river.add(b); P[b].river.add(a); }
    for (const [a, b, lv, gap] of L.roadPairs) if (P[a] && P[b] && P[a].nb.has(b) && !P[a].sea && !P[b].sea){ const r = mk(a, b); r.r0 = Math.max(r.r0, lv || 2); if (gap) r.gap = true; if (r.r0 >= 2){ P[a].road.add(b); P[b].road.add(a); } }
    for (const [a, b, lv] of (L.railPairs || [])) if (P[a] && P[b] && P[a].nb.has(b) && !P[a].sea && !P[b].sea) mk(a, b).q0 = Math.max(mk(a, b).q0, lv || 1); }
  for (const r of LK.values()){ r.road = r.r0; r.rail = r.q0; }
  loadWorld.LK = LK;
  // oil fields: deserts and seas known for crude, by latitude band and region, deterministic
  const r = mulberry(7);
  for (const p of P){ if (p.sea) continue;
    const lon = ((p.cc % W) + 0.5)/W*360 + WORLD.lon0;
    const gulf = p.lat > 12 && p.lat < 38 && lon > 35 && lon < 62, arctic = p.lat > 58, sahara = p.lat > 18 && p.lat < 34 && lon > -10 && lon < 35;
    const fk = GS > 1 ? 0.3 : 1;   // fine maps: fewer, richer fields (yields are not scaled down), same world totals
    p.oil = r() < (gulf ? 0.6 : arctic ? 0.22 : sahara ? 0.3 : 0.12)*fk;
    p.ore = r() < (arctic ? 0.35 : 0.22)*fk; }
  // terrain from real regions (approximate boxes) + noise for variety
  const BOX = (lon, lat, a, b, c, d) => lon >= a && lon <= b && lat >= c && lat <= d;
  const MTN = [[70, 103, 27, 40], [-80, -65, -55, 10], [-125, -104, 32, 60], [5, 17, 44, 48], [38, 50, 40, 44], [56, 62, 50, 68], [44, 62, 27, 38], [35, 42, 5, 15], [-8, 10, 30, 36], [5, 20, 59, 70], [30, 44, 37, 41], [66, 80, 35, 45], [-110, -97, 17, 28], [140, 180, 55, 70], [96, 110, 22, 30]];
  const FOR = [[-75, -45, -15, 5], [10, 30, -5, 5], [95, 125, -8, 20], [-130, -60, 50, 64], [30, 140, 52, 64], [10, 30, 58, 66], [-90, -70, 30, 45], [125, 140, 30, 45]];
  const DES = [[-15, 35, 16, 32], [35, 58, 15, 30], [90, 115, 38, 46], [118, 145, -32, -20], [15, 27, -28, -20], [-118, -104, 30, 37], [-72, -68, -28, -18], [55, 70, 36, 45], [58, 75, 24, 30]];
  const tr = mulberry(23), TCODE = {p:'plains', f:'forest', m:'mountain', d:'desert', t:'tundra', h:'hills', w:'marsh', s:'snow'};
  for (const p of P){ if (p.sea) continue;
    const lon = ((p.cc % W) + 0.5)/W*360 + WORLD.lon0, L = ((lon + 540) % 360) - 180, lat = p.lat, r = tr(), d5 = WORLD.provinces[p.id][5];
    if (d5){ p.terrain = p.city && r < 0.85 ? 'urban' : TCODE[d5] || 'plains'; continue; }
    p.terrain = p.city && r < 0.7 ? 'urban' : MTN.some(b => BOX(L, lat, ...b)) && r < 0.8 ? 'mountain' : FOR.some(b => BOX(L, lat, ...b)) && r < 0.85 ? 'forest' : DES.some(b => BOX(L, lat, ...b)) && r < 0.9 ? 'desert' : Math.abs(lat) > 64 ? 'tundra' : r < 0.12 ? 'forest' : r < 0.18 ? 'mountain' : 'plains'; }
  // rare-earth deposits (P.rare: output a day before buildings): the real rare-earth districts (approximate boxes and richness), then scattered
  // minor finds on ore-bearing hard rock. Iron-mining country (P.iron): a share of the hills and mountains without an ore deposit. Own random stream.
  const RARE_BOX = [[106, 114, 39, 44, 3.5], [109, 118, 22, 28, 2.2], [100, 104, 26, 30, 1.8], [96, 99.5, 23, 27.5, 2.5], [102, 105.5, 21, 23.5, 1.5],   // China: Bayan Obo, southern clays, Sichuan; Myanmar (Kachin); Vietnam
    [115, 124, -30, -26, 3], [126, 130, -21, -17, 2], [131, 136, -24, -21, 1.4], [-50, -45, -21, -17, 2.2], [30, 38, 66.5, 69.5, 2], [110, 125, 68, 73, 1.6], [98, 104, 52, 56, 1.2],   // Australia (Mt Weld, Browns Range, Nolans); Brazil (Araxa, Catalao); Russia (Kola, Tomtor, Irkutsk)
    [24, 29, -12, -7, 2.2], [17.5, 20, -32, -29.5, 1.8], [29.5, 31.5, -25, -23, 1.5], [44, 48, -26, -20, 1.2], [75, 79, 8, 11.5, 1.6], [84, 87.5, 18.5, 21.5, 1.4],   // DR Congo (Katanga); South Africa (Steenkampskraal, Phalaborwa); Madagascar; India's monazite coasts
    [-117, -114.5, 34, 36.5, 4], [-106, -103.5, 43, 45.5, 1.8], [-106, -104, 30.5, 32, 1.5], [-133, -131, 54.5, 56.5, 1.5], [-48, -44, 60, 62, 3],   // USA (Mountain Pass, Bear Lodge, Round Top, Bokan); Greenland (Kvanefjeld)
    [-115, -111, 61, 63.5, 1.6], [-66, -63, 55, 57, 1.5], [68, 76, 45, 50, 1.2], [30, 32, 39, 40.5, 1.6], [14, 21, 58, 68.5, 1.2], [30, 32, 31, 31.6, 1], [54, 56.5, 31, 32.5, 1]];   // Canada; Kazakhstan; Turkey (Beylikova); Sweden; Egypt (Nile sands); Iran (Yazd)
  { const rr = mulberry(41), inBox = RARE_BOX.map(() => []);   // per district: the nearest land province and its distance (degrees)
    for (const p of P){ if (p.sea) continue; const lon = ((((p.cc % W) + 0.5)/W*360 + WORLD.lon0) + 540) % 360 - 180, t = p.terrain, hard = t === 'hills' || t === 'mountain' || t === 'desert' || t === 'tundra';
      let rv = 0; RARE_BOX.forEach((B, i) => { const d = Math.hypot(lon - (B[0] + B[1])/2, p.lat - (B[2] + B[3])/2); if (!inBox[i][0] || d < inBox[i][1]) inBox[i] = [p, d]; if (BOX(lon, p.lat, B[0], B[1], B[2], B[3]) && rr() < (hard || p.ore ? 0.42 : 0.2)) rv = Math.max(rv, Math.max(0.8, 0.5*B[4])); });   // the district's lesser finds: half its main deposit (the big districts were giving one power most of the world's output)
      if (!rv && hard && rr() < (p.ore ? 0.3 : 0.02)) rv = 0.8;
      p.rare = rv; p.iron = !p.ore && (t === 'hills' || t === 'mountain') && rr() < 0.14; }
    // every district has its main deposit in the province nearest its centre (small districts can fall between province centres)
    RARE_BOX.forEach((B, i) => { const c = inBox[i][0]; if (c && inBox[i][1] < 4) c.rare = Math.max(c.rare, B[4]); }); }
  // population (millions): known towns, area and terrain, cities and capitals; dense river plains of South and East Asia weighted up
  const TF = {plains:1, forest:0.6, mountain:0.5, desert:0.22, tundra:0.1, urban:1.4}, POPK = 1;
  for (const p of P){ if (p.sea){ p.pop0 = 0; continue; } const d = WORLD.provinces[p.id], towns = d[4] || 0, lon = ((((p.cc % W) + 0.5)/W*360 + WORLD.lon0) + 540) % 360 - 180;
    const asia = lon > 65 && lon < 125 && p.lat > 5 && p.lat < 42 ? 3.2 : lon > -20 && lon < 50 && p.lat > -35 && p.lat < 15 ? 1.6 : 1;
    const al = Math.abs(p.lat), latF = al > 64 ? 0.04 : al > 56 ? 0.3 : al > 48 ? 0.75 : 1;
    if (WORLD.v >= 2){ p.pop0 = +(d[4]/1000*POPK).toFixed(3); continue; }
    p.pop0 = +((0.07*p.cells.length*(TF[p.terrain] || 1)*asia*asia*latF + 0.34*Math.sqrt(towns)*asia*latF + (p.city ? 2.4*asia : 0) + (p.capFlag ? 3.5 : 0))).toFixed(2); }
  const countries = WORLD.countries.map((name, k) => ({name, provs:P.filter(p => p.country === k).map(p => p.id)}));
  const landCount = P.filter(p => !p.sea).length, PF = Math.min(1, 740/landCount);   // PF: per-province base yields shrink as provinces get smaller
  cityMains(P, countries);
  return {prov, P, countries, landCount, PF, LK};
}
/* Sea lanes: the sea-zone links along the world's major shipping routes (North Atlantic, Mediterranean–Suez–Indian Ocean–Malacca–East Asia,
   Persian Gulf, trans-Pacific, Panama, the Cape, Australia, South America). Waypoints (lon, lat) snap to the nearest sea zone and are joined by
   the shortest all-water route. Fixed per map; trade lanes and convoy routes can build on the same set. */
const LANE_ROUTES = [
  [[-73, 40], [-50, 45], [-20, 48], [-6, 49], [1.5, 50.8], [4, 52.8], [8, 55], [10.5, 57.8], [12.7, 55.8], [18, 57], [25, 59.8]],
  [[-6, 49], [-9.5, 44], [-9.8, 37], [-5.6, 35.9], [4, 38], [11.8, 37.2], [20, 34.5], [32.3, 31.6], [33.6, 27.5], [38, 21], [43.4, 12.6], [50, 12.8], [60, 13], [73, 8], [80.8, 5.4], [92, 6], [97.8, 5], [103.8, 1.2], [109, 8], [113.5, 20], [119.5, 24.5], [123, 31], [129, 34], [139.8, 34.8]],
  [[60, 13], [60, 22], [56.6, 26.4], [52, 27], [50, 29]],
  [[139.8, 34.8], [160, 40], [180, 43], [-150, 40], [-122.8, 37.6], [-119, 33.4]],
  [[-119, 33.4], [-108, 20], [-90, 12], [-79.5, 8.2], [-79.9, 9.6], [-75, 15], [-74, 20.3], [-72, 25], [-74, 35], [-73, 40]],
  [[-79.9, 9.6], [-84, 22], [-80.6, 24.2], [-86, 26], [-94, 28.6]],
  [[-5.6, 35.9], [-17.6, 21], [-17.8, 14.5], [-8, 4], [5, -4], [11.5, -20], [18.4, -35], [32, -30], [40.5, -18], [46, -4], [60, 13]],
  [[103.8, 1.2], [105.8, -6], [112, -22], [114.6, -32], [130, -37], [146, -39.6], [151.5, -34]],
  [[-74, 20.3], [-62, 12], [-35, -5], [-43.2, -23.5], [-56, -35.4]],
];
let LANES = null;
function laneSet(){ if (LANES && LANES.G === G) return LANES.s; const s = new Set(), sea = G.P.filter(P => P.sea);
  const ll = P => [((((P.cc % W) + 0.5)/W*360 + WORLD.lon0) + 540) % 360 - 180, cellLat(P.cc)];
  const LL = new Map(sea.map(P => [P.id, ll(P)]));
  const snap = (lon, lat) => { let best = -1, bd = 1e9; for (const P of sea){ const [x, y] = LL.get(P.id), dl = Math.abs(((x - lon + 540) % 360) - 180)*Math.cos(lat*Math.PI/180), d = dl*dl + (y - lat)**2; if (d < bd){ bd = d; best = P.id; } } return best; };
  const route = (a, b) => { if (a < 0 || b < 0 || a === b) return []; const d = new Map([[a, 0]]), prev = new Map(), q = [[0, a]];
    while (q.length){ let bi = 0; for (let i = 1; i < q.length; i++) if (q[i][0] < q[bi][0]) bi = i; const [du, u] = q.splice(bi, 1)[0]; if (u === b) break; if (du > d.get(u)) continue;
      for (const [v, w] of G.P[u].nb){ if (!G.P[v].sea) continue; const nd = du + w; if (nd < (d.has(v) ? d.get(v) : 1e9)){ d.set(v, nd); prev.set(v, u); q.push([nd, v]); } } }
    const out = []; if (!prev.has(b)) return out; for (let v = b; v !== a; v = prev.get(v)) out.push([prev.get(v), v]); return out; };
  for (const R of LANE_ROUTES){ const z = R.map(([lon, lat]) => snap(lon, lat)); for (let i = 1; i < z.length; i++) for (const [u, v] of route(z[i - 1], z[i])) s.add(u < v ? u + ',' + v : v + ',' + u); }
  LANES = {G, s}; return s; }
const isLane = (u, v) => G.P[u].sea && G.P[v].sea && laneSet().has(u < v ? u + ',' + v : v + ',' + u);
const capLon = (st, n = 0) => { const N = st && st.nations && st.nations[n], P = N && G && G.P[N.capital]; return P ? WORLD.lon0 + ((P.cc % W) + 0.5)/W*360 : null; };
function sunOffFor(n, st = S){ const lon = capLon(st, n); return lon == null ? 0 : ((Math.round(10 - lon/15) % 24) + 24) % 24; }
/* ---------------- Weather and seasons ---------------- */
// the campaign opens on 15 November and runs through the northern winter into the thaw; northern winters are Dec–Feb, spring thaw (mud) Mar–Apr, the south is reversed
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function calDate(h){ let d = (Math.floor(h/24) + 318) % 365, m = 0; while (d >= MDAYS[m]){ d -= MDAYS[m]; m++; } return {m, d:d + 1}; }
let SZC = {d:-1, S:null, a:null};
function season(p){ const d = Math.floor(S.hour/24); if (SZC.d !== d || SZC.S !== S){ SZC = {d, S, a:G.P.map(P => season0(P.id))}; } return SZC.a[p]; }
function season0(p){ const P = G.P[p]; if (P.sea) return null; const lat = P.lat, m = calDate(S.hour).m, south = lat < 0, mm = south ? (m + 6) % 12 : m, al = Math.abs(lat);
  if (al > 38 && (mm === 11 || mm <= 1) && (al > 46 || P.terrain === 'mountain' || P.terrain === 'snow')) return 'snow';
  if (al > 58 && (mm === 10 || mm === 2)) return 'snow';
  if (al > 44 && al < 62 && (mm === 2 || mm === 3) && P.terrain !== 'mountain' && P.terrain !== 'desert' && P.terrain !== 'snow') return 'mud';
  return null; }
const SEASON_FX = {snow:{name:'Winter snow', spd:0.7, atk:0.85, tip:'−30% speed, attackers −15%'}, mud:{name:'Spring thaw (mud)', spd:0.75, atk:0.95, tip:'−25% speed, attackers −5%'}};
// storm systems drift across the map: they ground aircraft and slow movement
function stormAt(p){ const P = G.P[p]; for (const w of (S.storms || [])){ if ((P.x - w.x)**2 + ((P.y - w.y)*1.6)**2 < w.r*w.r) return w; } return null; }
function weatherSpd(p){ const sz = season(p), w = stormAt(p); return (sz ? SEASON_FX[sz].spd : 1)*(w ? 0.8 : 1); }
function weatherHour(){ S.storms = S.storms || [];
  for (const w of S.storms){ w.x += w.vx; w.y += w.vy; w.life--; if (w.x > WORLD_W + 40) w.x -= WORLD_W; if (w.x < -40) w.x += WORLD_W; }
  S.storms = S.storms.filter(w => w.life > 0 && w.y > -30 && w.y < WORLD_H + 30);
  while (S.storms.length < 7){ const y = OY + rng()*(WORLD_H - 2*OY), lat = Math.abs(cellLat(Math.max(0, Math.min(W*H - 1, Math.round((y - OY)/(HS*1.5))*W)))), west = lat > 30;
    const sz = season(G.P.find(P => !P.sea && Math.abs(P.y - y) < 20)?.id ?? 0);
    S.storms.push({id:S.nid++, x:rng()*WORLD_W, y, r:40 + rng()*55, vx:(west ? 1 : -1)*(1.6 + rng()*1.8), vy:(rng() - 0.5)*0.6, life:48 + Math.floor(rng()*96), kind:lat > 45 && sz === 'snow' ? 'blizzard' : 'storm', seed:rng()*1000}); } }
// provinces whose centre lies within r old hexes of p's centre (always including direct neighbours), cached
const NEARC = new Map();
function nearList(p, r){ const key = p*1024 + Math.round(r*4); let l = NEARC.get(key); if (l) return l; const P0 = G.P[p], R = r*HS0*SQ3, seen = new Set([p]), q = [p];
  for (let i = 0; i < q.length; i++) for (const v of G.P[q[i]].nbs){ if (seen.has(v)) continue; const P = G.P[v]; if (q[i] === p || Math.hypot(P.x - P0.x, P.y - P0.y) <= R){ seen.add(v); q.push(v); } }
  l = [...seen]; NEARC.set(key, l); return l; }
// Each city's ONE main resource (P.main: 'cash' | 'oil' | 'metal' | 'iron' | 'elec' | 'rare'; null outside cities). From map data only: no dice, no game
// state, nothing saved, so old saves get it too. Per country: the capital is a money city (a one-city country's only city takes its best resource);
// rare earth goes to the city nearest each big deposit (at most one city, two for a country of eight cities or more; none without a deposit);
// the other cities take, greedily, the resource their surroundings suit best, spread over several goods so that every country lacks something.
function cityMains(P, countries){ const KS = ['cash', 'oil', 'metal', 'iron', 'elec'], cities = P.filter(p => p.city && !p.sea), used = {cash:0, oil:0, metal:0, iron:0, elec:0, rare:0};
  const sorted = cities.map(p => p.pop0).sort((a, b) => a - b), pct = v => { let lo = 0, hi = sorted.length; while (lo < hi){ const m = (lo + hi) >> 1; if (sorted[m] < v) lo = m + 1; else hi = m; } return lo/Math.max(1, sorted.length - 1); };
  const ring = p => { const r1 = p.nbs.filter(v => !P[v].sea), s1 = new Set([p.id, ...r1]), r2 = []; for (const v of r1) for (const w of P[v].nbs) if (!P[w].sea && !s1.has(w)){ s1.add(w); r2.push(w); } return [r1.map(v => P[v]), r2.map(v => P[v])]; };
  const lonOf = p => ((((p.cc % W) + 0.5)/W*360 + WORLD.lon0) + 540) % 360 - 180;
  const feat = new Map();
  for (const p of cities){ const [r1, r2] = ring(p), sum = f => (f(p) ? 2 : 0) + r1.filter(f).length + 0.5*r2.filter(f).length, lon = lonOf(p), hilly = q => q.terrain === 'hills' || q.terrain === 'mountain';
    feat.set(p.id, {oil:sum(q => q.oil), ore:sum(q => q.ore), iron:sum(q => q.iron), hill:r1.filter(hilly).length + (hilly(p) ? 1 : 0), gulf:p.lat > 12 && p.lat < 38 && lon > 35 && lon < 62, pq:pct(p.pop0)}); }
  const score = (p, k) => { const F = feat.get(p.id);
    return k === 'oil' ? (F.oil > 0 ? 0.6 + 0.7*Math.min(3, F.oil) : 0.15) + (F.gulf ? 1.2 : 0)
      : k === 'metal' ? 0.7 + 0.5*Math.min(3, F.ore)
      : k === 'iron' ? 0.5 + 0.6*Math.min(3, F.iron + 0.5*F.ore) + 0.2*Math.min(2, F.hill)
      : k === 'elec' ? 0.3 + 1.7*F.pq
      : 0.3 + 1.2*F.pq + (p.coast ? 0.3 : 0); };
  let done = 0;
  for (const c of countries){ const cs = c.provs.map(v => P[v]).filter(p => p.city && !p.sea); if (!cs.length) continue;
    const n = cs.length, cap = cs.find(p => p.capFlag) || cs[0], loc = {cash:0, oil:0, metal:0, iron:0, elec:0, rare:0}, left = new Set(cs.map(p => p.id));
    const take = (p, k) => { p.main = k; loc[k]++; used[k]++; done++; left.delete(p.id); };
    const rares = () => { if (n < 2) return; const deps = c.provs.map(v => P[v]).filter(p => p.rare >= RARE_DEP).sort((x, y) => y.rare - x.rare || x.id - y.id), maxR = n >= 8 ? 2 : 1;
      for (const d of deps){ if (loc.rare >= maxR) break; let bc = null, bd = 12;
        for (const p of cs){ if (p === cap) continue; const dl = ((lonOf(p) - lonOf(d) + 540) % 360) - 180, dist = Math.hypot(dl*Math.cos(d.lat*Math.PI/180), p.lat - d.lat); if (dist < bd){ bd = dist; bc = p; } }
        if (bc && left.has(bc.id)) take(bc, 'rare'); } };
    rares(); if (n >= 2) take(cap, 'cash');
    while (left.size){ let best = null, bv = -1;
      for (const id of left){ const p = P[id]; for (const k of KS){
        const wb = Math.max(0.6, Math.min(1.6, Math.sqrt(ECO_SHARE[k]*(done + 6)/(used[k] + 6*ECO_SHARE[k]))));
        const v = score(p, k)*wb/(1 + 1.5*loc[k]); if (v > bv + 1e-9){ bv = v; best = [p, k]; } } }
      take(best[0], best[1]); }
    // no big country is left without oil of its own: with eight or more cities and no oil city, the smallest city of its most common resource
    // (never the capital) becomes an oil city. On today's map that is Australia alone (Port Hedland, off the North West Shelf)
    if (n >= 8 && !loc.oil){ const top = KS.filter(k => k !== 'cash').reduce((x, y) => loc[y] > loc[x] ? y : x), c0 = cs.filter(p => p !== cap && p.main === top).sort((x, y) => x.pop0 - y.pop0 || y.id - x.id)[0];
      if (c0){ c0.main = 'oil'; loc[top]--; loc.oil++; } } }
  for (const p of P) if (!p.main) p.main = null; }
