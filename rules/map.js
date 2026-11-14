// Iron Meridian rules: map. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
/* ---------------- World map ---------------- */
// map: null for the map of world.js as it is (the classic world, the theatres, every old save), or a province split laid over it (NATIONS.map,
// written by tools/build-provsplit.js; the nations world): new provinces appended after the last one of world.js (each with the province it was
// cut from, P.parent), the cells they take, the cut provinces' new name, people and terrain, and the river, road and rail pairs that touch them.
// base0: the map of world.js, loaded (needed with a split): every province of world.js keeps its deposits, its share of city ground and the sea
// straits exactly as there (a cut province keeps them all), so the split changes nothing outside the cut countries; new provinces draw their own.
function loadWorld(map = null, base0 = null){ const NB = map ? WORLD.provinces.length : Infinity, old = p => p.id < NB;
  const N = W*H, D = map ? WORLD.provinces.map((d, k) => map.parents[k] ? [map.parents[k][0], d[1], d[2], d[3], map.parents[k][1], map.parents[k][2]] : d).concat(map.provinces) : WORLD.provinces;
  let prov = WORLD.prov || new Int16Array(N);
  if (!WORLD.prov) for (let i = 0; i < N; i++){ const s = WORLD.cells.substr(i*2, 2); prov[i] = s === '..' ? -1 : parseInt(s, 36); }
  if (map){ prov = Int32Array.from(prov); for (let i = 0; i < map.cells.length; i += 2) prov[map.cells[i]] = map.cells[i + 1]; }
  const P = D.map((d, k) => ({id:k, name:d[0], country:d[1], sea:d[1] < 0, city:!!(d[2] & 1), capFlag:!!(d[2] & 2), cityName:d[3], cells:[], nb:new Map()}));
  if (map) for (let k = WORLD.provinces.length; k < D.length; k++) P[k].parent = D[k][6];
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
    if (base0) cand.length = 0; for (const [a, b] of base0 ? base0.straits : []){ const w = P[a].nb.get(b) ?? base0.P[a].nb.get(b); P[a].nb.set(b, w); P[b].nb.set(a, w); loadWorld.straits.push([a, b]); }
    for (const [a, b, d] of cand){ if (find(a) === find(b)) continue; par[find(a)] = find(b); const w = Math.max(GS > 1 ? 0.35 : 1, d); P[a].nb.set(b, w); P[b].nb.set(a, w); loadWorld.straits.push([a, b]); } }
  for (const p of P){ p.nbs = [...p.nb.keys()]; p.coast = !p.sea && p.nbs.some(v => P[v].sea); p.river = new Set(); p.road = new Set(); p.lk = new Map(); }
  // rivers, roads and railways (Natural Earth): river lines between provinces, road and rail links between neighbours, drawable paths by class
  // LK: one record per linked neighbour pair; r0/q0 are the static road (1 track, 2 road, 3 highway) and rail (1 railway, 2 high-speed) levels,
  // road/rail/dmg/bld the live state (reset from S.links by linksSync)
  const LK = new Map();
  const mk = (a, b) => { let r = P[a].lk.get(b); if (!r){ r = {a:Math.min(a, b), b:Math.max(a, b), k:Math.min(a, b) + ',' + Math.max(a, b), r0:0, q0:0, road:0, rail:0, dmg:0, bld:null, gap:false}; LK.set(r.k, r); P[a].lk.set(b, r); P[b].lk.set(a, r); } return r; };
  if (LINES){ const T = map ? new Set(map.touch) : null, mine = l => T ? l.filter(q => !T.has(q[0]) && !T.has(q[1])) : l;   // pairs touching a cut province: the split's own
    // the road pairs of the split: lines.js's own for it when it has them (net.maps[v]: MAP-3's levels, where the split's differ), else the old way
    const NM = map && LINES.net && LINES.net.maps && LINES.net.maps[map.v], NMok = NM && NM.base === map.base && Array.isArray(NM.pairs);
    const roadP = !map ? LINES.roadPairs : NMok ? (() => { const T2 = new Set(NM.touch), drop = new Set(NM.drop.map(q => q[0] + ',' + q[1]));
      return LINES.roadPairs.filter(q => !T2.has(q[0]) && !T2.has(q[1]) && !drop.has(Math.min(q[0], q[1]) + ',' + Math.max(q[0], q[1]))).concat(NM.pairs); })() : mine(LINES.roadPairs).concat(map.roadPairs);
    const L = map ? {riverPairs:mine(LINES.riverPairs).concat(map.riverPairs), roadPairs:roadP, railPairs:mine(LINES.railPairs || []).concat(map.railPairs)} : LINES;
    for (const [a, b] of L.riverPairs) if (P[a] && P[b] && P[a].nb.has(b)){ P[a].river.add(b); P[b].river.add(a); }
    for (const [a, b, lv, gap] of L.roadPairs) if (P[a] && P[b] && P[a].nb.has(b) && !P[a].sea && !P[b].sea){ const r = mk(a, b); r.r0 = Math.max(r.r0, lv || 2); if (gap) r.gap = true; if (r.r0 >= 2){ P[a].road.add(b); P[b].road.add(a); } }
    for (const [a, b, lv] of (L.railPairs || [])) if (P[a] && P[b] && P[a].nb.has(b) && !P[a].sea && !P[b].sea) mk(a, b).q0 = Math.max(mk(a, b).q0, lv || 1); }
  for (const r of LK.values()){ r.road = r.r0; r.rail = r.q0; }
  loadWorld.LK = LK;
  // oil fields: deserts and seas known for crude, by latitude band and region, deterministic
  const r = mulberry(map ? 707 : 7);
  for (const p of P){ if (p.sea) continue; if (base0 && old(p)){ p.oil = base0.P[p.id].oil; p.ore = base0.P[p.id].ore; continue; }
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
  const tr = mulberry(map ? 2323 : 23), TCODE = {p:'plains', f:'forest', m:'mountain', d:'desert', t:'tundra', h:'hills', w:'marsh', s:'snow'};
  for (const p of P){ if (p.sea) continue;
    const lon = ((p.cc % W) + 0.5)/W*360 + WORLD.lon0, L = ((lon + 540) % 360) - 180, lat = p.lat, r = base0 && old(p) ? (base0.P[p.id].urb ? 0 : 1) : tr(), d5 = D[p.id][5];   // (a province of world.js: its city ground as there)
    // ter0: the ground without a city on it; urb: whether a city here covers it (useWorld re-applies both when the set of cities changes)
    if (d5){ p.ter0 = TCODE[d5] || 'plains'; p.urb = r < 0.85; p.terrain = p.city && p.urb ? 'urban' : p.ter0; continue; }
    p.urb = r < 0.7; p.ter0 = MTN.some(b => BOX(L, lat, ...b)) && r < 0.8 ? 'mountain' : FOR.some(b => BOX(L, lat, ...b)) && r < 0.85 ? 'forest' : DES.some(b => BOX(L, lat, ...b)) && r < 0.9 ? 'desert' : Math.abs(lat) > 64 ? 'tundra' : r < 0.12 ? 'forest' : r < 0.18 ? 'mountain' : 'plains'; p.terrain = p.city && p.urb ? 'urban' : p.ter0; }
  // rare-earth deposits (P.rare: output a day before buildings): the real rare-earth districts (approximate boxes and richness), then scattered
  // minor finds on ore-bearing hard rock. Iron-mining country (P.iron): a share of the hills and mountains without an ore deposit. Own random stream.
  const RARE_BOX = [[106, 114, 39, 44, 3.5], [109, 118, 22, 28, 2.2], [100, 104, 26, 30, 1.8], [96, 99.5, 23, 27.5, 2.5], [102, 105.5, 21, 23.5, 1.5],   // China: Bayan Obo, southern clays, Sichuan; Myanmar (Kachin); Vietnam
    [115, 124, -30, -26, 3], [126, 130, -21, -17, 2], [131, 136, -24, -21, 1.4], [-50, -45, -21, -17, 2.2], [30, 38, 66.5, 69.5, 2], [110, 125, 68, 73, 1.6], [98, 104, 52, 56, 1.2],   // Australia (Mt Weld, Browns Range, Nolans); Brazil (Araxa, Catalao); Russia (Kola, Tomtor, Irkutsk)
    [24, 29, -12, -7, 2.2], [17.5, 20, -32, -29.5, 1.8], [29.5, 31.5, -25, -23, 1.5], [44, 48, -26, -20, 1.2], [75, 79, 8, 11.5, 1.6], [84, 87.5, 18.5, 21.5, 1.4],   // DR Congo (Katanga); South Africa (Steenkampskraal, Phalaborwa); Madagascar; India's monazite coasts
    [-117, -114.5, 34, 36.5, 4], [-106, -103.5, 43, 45.5, 1.8], [-106, -104, 30.5, 32, 1.5], [-133, -131, 54.5, 56.5, 1.5], [-48, -44, 60, 62, 3],   // USA (Mountain Pass, Bear Lodge, Round Top, Bokan); Greenland (Kvanefjeld)
    [-115, -111, 61, 63.5, 1.6], [-66, -63, 55, 57, 1.5], [68, 76, 45, 50, 1.2], [30, 32, 39, 40.5, 1.6], [14, 21, 58, 68.5, 1.2], [30, 32, 31, 31.6, 1], [54, 56.5, 31, 32.5, 1]];   // Canada; Kazakhstan; Turkey (Beylikova); Sweden; Egypt (Nile sands); Iran (Yazd)
  { const rr = mulberry(map ? 4141 : 41), inBox = RARE_BOX.map(() => []);   // per district: the nearest land province and its distance (degrees)
    for (const p of P){ if (p.sea) continue; if (base0 && old(p)){ p.rare = base0.P[p.id].rare; p.iron = base0.P[p.id].iron; continue; } const lon = ((((p.cc % W) + 0.5)/W*360 + WORLD.lon0) + 540) % 360 - 180, t = p.terrain, hard = t === 'hills' || t === 'mountain' || t === 'desert' || t === 'tundra';
      let rv = 0; RARE_BOX.forEach((B, i) => { const d = Math.hypot(lon - (B[0] + B[1])/2, p.lat - (B[2] + B[3])/2); if (!inBox[i][0] || d < inBox[i][1]) inBox[i] = [p, d]; if (BOX(lon, p.lat, B[0], B[1], B[2], B[3]) && rr() < (hard || p.ore ? 0.42 : 0.2)) rv = Math.max(rv, Math.max(0.8, 0.5*B[4])); });   // the district's lesser finds: half its main deposit (the big districts were giving one power most of the world's output)
      if (!rv && hard && rr() < (p.ore ? 0.3 : 0.02)) rv = 0.8;
      p.rare = rv; p.iron = !p.ore && (t === 'hills' || t === 'mountain') && rr() < 0.14; }
    // every district has its main deposit in the province nearest its centre (small districts can fall between province centres)
    if (!base0) RARE_BOX.forEach((B, i) => { const c = inBox[i][0]; if (c && inBox[i][1] < 4) c.rare = Math.max(c.rare, B[4]); }); }   // (with a split: they stay where world.js has them)
  // population (millions): known towns, area and terrain, cities and capitals; dense river plains of South and East Asia weighted up
  const TF = {plains:1, forest:0.6, mountain:0.5, desert:0.22, tundra:0.1, urban:1.4}, POPK = 1;
  for (const p of P){ if (p.sea){ p.pop0 = 0; continue; } const d = D[p.id], towns = d[4] || 0, lon = ((((p.cc % W) + 0.5)/W*360 + WORLD.lon0) + 540) % 360 - 180;
    const asia = lon > 65 && lon < 125 && p.lat > 5 && p.lat < 42 ? 3.2 : lon > -20 && lon < 50 && p.lat > -35 && p.lat < 15 ? 1.6 : 1;
    const al = Math.abs(p.lat), latF = al > 64 ? 0.04 : al > 56 ? 0.3 : al > 48 ? 0.75 : 1;
    if (WORLD.v >= 2){ p.pop0 = +(d[4]/1000*POPK).toFixed(3); continue; }
    p.pop0 = +((0.07*p.cells.length*(TF[p.terrain] || 1)*asia*asia*latF + 0.34*Math.sqrt(towns)*asia*latF + (p.city ? 2.4*asia : 0) + (p.capFlag ? 3.5 : 0))).toFixed(2); }
  const countries = WORLD.countries.map((name, k) => ({name, provs:P.filter(p => p.country === k).map(p => p.id)}));
  const landCount = P.filter(p => !p.sea).length, PF = base0 ? base0.PF : Math.min(1, 740/landCount);   // PF: per-province base yields shrink as provinces get smaller (a split keeps world.js's)
  cityMains(P, countries);
  // base: the classic world's cities, capitals, city names and main resources as world.js gives them (useWorld switches between it and the nations world)
  const base = {city:P.map(p => p.city), cap:P.map(p => p.capFlag), name:P.map(p => p.cityName), main:P.map(p => p.main)};
  return {prov, P, D, straits:loadWorld.straits, countries, landCount, PF, LK, base, worldKey:'classic', map:map ? map.v : 0};
}
// Which provinces are cities and capitals depends on the world in use. def null: the classic world (the flags of world.js: the 15-power world,
// the two theatres and every old save). def {cities, caps, names}: the nations world (province ids of every city, of the nations' capitals, and
// the names of promoted cities, and mains: the main resource of the playable nations' cities, a letter per city of cities, '.' for the map method).
// Sets P.city, P.capFlag, P.cityName, the urban ground and each city's main resource, afresh on every new game
// and every load, so nothing a game did to the flags leaks into the next one. Deposits and people do not depend on it.
const MAIN_OF = {c:'cash', o:'oil', m:'metal', i:'iron', e:'elec', r:'rare'};
function useWorld(def){ const P = G.P, B = G.base, mains = def && typeof def.mains === 'string' && def.mains.length === def.cities.length ? def.mains : '';
  const key = def ? 'n:' + def.cities.join(',') + '|' + def.caps.join(',') + '|' + JSON.stringify(def.names || {}) + '|' + mains : 'classic';
  if (!def){ for (const p of P){ p.city = B.city[p.id]; p.capFlag = B.cap[p.id]; p.cityName = B.name[p.id]; p.main = B.main[p.id]; if (!p.sea) p.terrain = p.city && p.urb ? 'urban' : p.ter0; } }
  else { const cs = new Set(def.cities), cp = new Set(def.caps), nm = def.names || {};
    for (const p of P){ p.city = !p.sea && cs.has(p.id); p.capFlag = p.city && cp.has(p.id); p.cityName = nm[p.id] || B.name[p.id] || (p.city ? p.name : B.name[p.id]); p.main = undefined; if (!p.sea) p.terrain = p.city && p.urb ? 'urban' : p.ter0; }
    cityMains(P, G.countries);   // (every city first, as before: independent land keeps the resources it always had)
    if (mains) def.cities.forEach((id, i) => { const k = MAIN_OF[mains[i]]; if (k && P[id] && P[id].city) P[id].main = k; }); }   // the owner's resource balance rule (tools/build-nations.js MAINS)
  if (G.worldKey !== key){ G.worldKey = key; IM.emit('cities'); } }
// The maps a game is played on. 0: the map of world.js (the classic world, the theatres, every old save, and a nations-world save made before
// the province split). MAP_NEW: world.js with the province split of nations.js (NATIONS.map, docs/NATIONS-PLAN.md 4.6), the map of every new
// nations-world game. Each is loaded once, when first needed, and kept; G is the one in use. A save names its map (S.map), so it keeps it.
const MAP_SPLIT = NATIONS && NATIONS.map && NATIONS.map.base === WORLD.provinces.length ? NATIONS.map : null, MAP_NEW = MAP_SPLIT ? MAP_SPLIT.v : 0;
const MAPS = {};
function mapOf(v = 0){ if (v && (!MAP_SPLIT || v !== MAP_SPLIT.v)) return null; return MAPS[v] || (MAPS[v] = v ? loadWorld(MAP_SPLIT, mapOf(0)) : loadWorld()); }
// make map v the one in use; false when this build does not have it. The province-keyed caches of the rules are dropped and the client hears
// 'world' (it rebuilds what it draws from the map: lines, labels, towns). A switch happens only with a new game or a load.
function useMap(v = 0){ const g = mapOf(v); if (!g) return false; if (G === g) return true;
  G = g; NEARC.clear(); LANES = null; SZC = {d:-1, S:null, a:null}; SUPF = SUPFA = SUPE = null; SUPV = -1; scnLandCache = null; scnInCache = null; IM.emit('world'); return true; }
// fn run with map v in place of the one in use, to read it only (the start screen's counts for a world not in play); nothing is switched or kept
function onMap(v, fn){ const g = mapOf(v), g0 = G; if (!g || g === g0) return fn(); G = g; try { return fn(); } finally { G = g0; } }
/* ---------------- The movement network (lines.js net, MAP-3) ----------------
   Every road link between two neighbouring provinces has a drawn WAY from one province's centre point (P.x, P.y: the city, or the cell nearest
   the middle of a province without one) to the other's, over the points of the roads (Natural Earth's, with junctions added where a way joins
   them, and the generated ones), so a province's roads meet at its centre, where a force captures it (rules/movement.js atHeart). The sea lanes
   are the ways warships sail between neighbouring sea zones' centres, and from a coastal province's centre out to a zone. Built by
   tools/build-lines.js (tools/roadnet.js). The rules do not need the shapes: legs are timed on the neighbour weights as always; the page draws
   these ways and moves its forces along them. netOf(G): the network of map G (made once, on first use): the road graph, way(a, b) (the node
   ids from a's centre to b's), node(i) (its world point), lane(u, v) (a lane's world points, u's centre to v's). Pure: no randomness.
   Ways are stored as the choices made at each fork of the graph (a base-36 digit: which neighbour, in key order), walked from a's centre to b's;
   a way of both maps walks the graph of both (the shared lines only), a map's own way that map's whole graph. */
const NETQ = (x, y) => [Math.round((x - OX)/(HS*SQ3)*20), Math.round((y - OY)/(HS*1.5)*20)], NETK = (X, Y) => X*8192 + Y;
function netOf(g = G, L0 = LINES){ if (g.net !== undefined && g.netL === L0) return g.net; g.netL = L0; g.net = null; const N0 = L0 && L0.net; if (!N0 || N0.v !== 1) return null;
  const MD = (N0.maps && N0.maps[g.map || 0]) || {roads:[], links:[], ports:[]};
  const X = [], Y = [], id = new Map(), node = (x, y) => { const k = NETK(x, y); let i = id.get(k); if (i === undefined){ i = X.length; id.set(k, i); X.push(x); Y.push(y); } return i; };
  const lines = [];   // [{cls, n:[node ids], own}]
  { const ins = N0.ins || [], byRoad = new Map(); let r = 0; for (let i = 0; i + 3 < ins.length; i += 4){ r += ins[i]; let a = byRoad.get(r); if (!a) byRoad.set(r, a = []); a.push([ins[i + 1], ins[i + 2], ins[i + 3]]); }
    (L0.roads || []).forEach((R, ri) => { const pts = []; let x = 0, y = 0; for (let i = 1; i + 1 < R.length; i += 2){ if (L0.delta && i > 1){ x += R[i]; y += R[i + 1]; } else { x = R[i]; y = R[i + 1]; } pts.push([x, y]); }
      const add = byRoad.get(ri), n = []; let j = 0; for (let k = 0; k < pts.length; k++){ n.push(node(pts[k][0], pts[k][1])); while (add && j < add.length && add[j][0] === k){ n.push(node(pts[k][0] + add[j][1], pts[k][1] + add[j][2])); j++; } }
      lines.push({cls:R[0], n, own:false}); }); }
  // (a list of new lines: each one's first point an offset from the first point of the line before)
  const decAll = (list, own) => { let sx = 0, sy = 0; for (const R of list || []){ const n = []; let x = sx + R[1], y = sy + R[2]; sx = x; sy = y; n.push(node(x, y)); for (let i = 3; i + 1 < R.length; i += 2){ x += R[i]; y += R[i + 1]; n.push(node(x, y)); } lines.push({cls:R[0], n, own}); } };
  decAll(N0.roads, false); decAll(MD.roads, true);
  // adjacency: the shared lines' graph, and the map's (the shared plus its own); neighbours in key order; an edge's class: the best line on it
  const nn = X.length, A0 = Array.from({length:nn}, () => []), A1 = Array.from({length:nn}, () => []), cls = new Map(), ek = (a, b) => a < b ? a*nn + b : b*nn + a;
  const e0 = new Set();
  for (const Ln of lines){ for (let i = 1; i < Ln.n.length; i++){ const a = Ln.n[i - 1], b = Ln.n[i]; if (a === b) continue; const k = ek(a, b);
      if (!cls.has(k)){ A1[a].push(b); A1[b].push(a); } if (!Ln.own && !e0.has(k)){ e0.add(k); A0[a].push(b); A0[b].push(a); }
      cls.set(k, Math.max(cls.get(k) || 0, Ln.cls)); } }
  const kOf = i => NETK(X[i], Y[i]); for (const A of [A0, A1]) for (const a of A) if (a.length > 1) a.sort((p, q) => kOf(p) - kOf(q));
  const cOf = p => { const P = g.P[p], q = NETQ(P.x, P.y); return id.get(NETK(q[0], q[1])); };
  // the ways: walked once, on first use
  const W = new Map(); for (const [own, list] of [[false, N0.links || []], [true, MD.links || []]]) for (const w of list) W.set(w[0] + ',' + w[1], {s:w[2], own});
  const walk = (a, b, s, A) => { const s0 = cOf(a), e = cOf(b); if (s0 === undefined || e === undefined) return null; const out = [s0]; let cur = s0, prev = -1, k = 0;
    for (let guard = 0; cur !== e && guard < 20000; guard++){ const nb = A[cur], opts = prev < 0 ? nb : nb.filter(v => v !== prev); let nx;
      if (opts.length === 1 && prev >= 0) nx = opts[0]; else { if (k >= s.length) return null; nx = opts[parseInt(s[k++], 36)]; }
      if (nx === undefined) return null; out.push(nx); prev = cur; cur = nx; }
    return cur === e ? out : null; };
  const WC = new Map();
  const way = (a, b) => { const k = a + ',' + b; if (WC.has(k)) return WC.get(k); let r = null; const w = W.get(a < b ? k : b + ',' + a);
    if (w){ const lo = Math.min(a, b), hi = Math.max(a, b), f = walk(lo, hi, w.s, w.own ? A1 : A0); r = f && (a === lo ? f : f.slice().reverse()); }
    WC.set(k, r); return r; };
  // lanes: [u, v, interior points...] from u's centre to v's (delta from u's centre; v's centre last)
  const LN = new Map(), addLane = R => { const P = g.P[R[0]], Q = g.P[R[1]]; if (!P || !Q) return; let [x, y] = NETQ(P.x, P.y); const pts = [[x, y]]; for (let i = 2; i + 1 < R.length; i += 2){ x += R[i]; y += R[i + 1]; pts.push([x, y]); } pts.push(NETQ(Q.x, Q.y)); LN.set(R[0] + ',' + R[1], pts); };
  for (const R of N0.lanes || []) addLane(R); for (const R of N0.ports || []) addLane(R); for (const R of MD.ports || []) addLane(R);
  const toW = q => [OX + HS*SQ3*q[0]/20, OY + HS*1.5*q[1]/20];
  const lane = (u, v) => { const f = LN.get(u + ',' + v); if (f) return f.map(toW); const r = LN.get(v + ',' + u); return r ? r.map(toW).reverse() : null; };
  return (g.net = {X, Y, A:A1, A0, cls:(a, b) => cls.get(ek(a, b)) || 0, lines, way, walk, cOf, nodeW:i => [OX + HS*SQ3*X[i]/20, OY + HS*1.5*Y[i]/20], lane, lanes:LN, ways:W, map:MD}); }
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
    // (never the capital) becomes an oil city. In the classic world that is Australia alone (Port Hedland, off the North West Shelf); in the nations
    // world (its own cities, useWorld) the same rule gives the eleven nations of 8 to 11 cities without one theirs (Australia, Spain, Poland, Romania,
    // Greece, Mozambique, South Korea, Myanmar, the Philippines, Bolivia, Cuba). The one oil rule of both worlds: what a nation's cities still lack
    // after it (smaller nations) is covered by the nations world's state reserve (N.reserve, rules/state.js tierStart)
    if (n >= 8 && !loc.oil){ const top = KS.filter(k => k !== 'cash').reduce((x, y) => loc[y] > loc[x] ? y : x), c0 = cs.filter(p => p !== cap && p.main === top).sort((x, y) => x.pop0 - y.pop0 || y.id - x.id)[0];
      if (c0){ c0.main = 'oil'; loc[top]--; loc.oil++; } } }
  for (const p of P) if (!p.main) p.main = null; }
