// Iron Meridian rules: trade. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
/* ---------------- V3 trade routes, blockades, convoy raids and escorts ----------------
   Powers that are not at war trade along routes: mostly sea lanes from port to port through the sea zones (the major shipping lanes are
   preferred), plus land routes between neighbours along their roads, and routes with independent countries' ports. Every route pays both
   partners each day: money (TR_K·√(economy × economy), more for long hauls, less by land) and a little of what the partner produces most.
   Routes form automatically from economy and distance: 2–4 sea routes per power, one land route and one or two independent partners. A power
   with no port of its own ships through the nearest allied, passage-partner or independent port, so every power depends on the sea.
   The player opens and closes routes in Diplomacy (a closed pair stays closed until reopened).
   Blockade (ordered, never automatic): a fleet given the Blockade order stops the convoys of the powers it is at war with within its reach
   (BLOCKADE_KM, around where it actually stands). In open water the convoys sail around it (a slower detour: less income); a route is cut only
   when the blockades leave no way around: a chokepoint (CHOKEPOINTS: one or two ships close Hormuz or Gibraltar), a port's approach, or a screen
   of several ships across a sea. Friendly warships inside the circle contest it (half income); hunting enemy maritime patrol aircraft halve it.
   Raids: once a day the convoy runs the gauntlet along its track: hostile warships within their reach of it (a Raid order: full strength;
   others at war: TR_OPP), and patrol or strike aircraft that hit its zones within the last day, may sink it (that day's income lost for both
   partners); ships that sink it capture 25-50% of its cargo. Friendly warships near the strike and fleets ordered to escort it cut the odds and
   fight the raiders. A partner may pause a route: no convoys, nothing lost, no income. The AI raids, blockades, escorts and pauses. */
const TR_K = 0.05, TR_LAND = 0.7, TR_NEU = 0.75, TR_RAID_K = 14, TR_SPD = 40;   // TR_SPD: drawn convoy speed, world units per game hour
const TR_SURF = ['frig', 'crui', 'carr'];
function trS(){ if (!S.trade) S.trade = {routes:[], closed:{}, want:{}, nid:1, air:{}, hit:{}, ver:1, news:0};
  const T = S.trade; T.routes = T.routes || []; T.closed = T.closed || {}; T.want = T.want || {}; T.air = T.air || {}; T.hit = T.hit || {}; return T; }
const trKey = (a, b, nc) => b === NEUTRAL ? a + ':n' + nc : Math.min(a, b) + ':' + Math.max(a, b);
const trMine = (r, n) => r.a === n || r.b === n;
const trOther = (r, n) => r.a === n ? r.b : r.a;
const trName = (r, n) => r.b === NEUTRAL ? G.countries[r.nc].name : S.nations[trOther(r, n)].name;
const routesOf = n => S.trade ? S.trade.routes.filter(r => trMine(r, n)) : [];
const routeById = id => S.trade ? S.trade.routes.find(r => r.id === id) || null : null;
const isPort = P => !!P && !P.sea && P.city && P.nbs.some(v => G.P[v].sea);
const unitPw = (o, t) => (st(o, t, 'atk') + st(o, t, 'def'))*st(o, t, 'hp')/10;
const pName = p => G.P[p].cityName || G.P[p].name;
// whose ships threaten / protect a route: at war with either partner, or one of the partners and their allies
const trHostile = (r, o) => o >= 0 && o !== r.a && o !== r.b && (atWar(o, r.a) || (r.b >= 0 && atWar(o, r.b)));
const trFriend = (r, o) => o >= 0 && (o === r.a || o === r.b || allyOf(o, r.a) || (r.b >= 0 && allyOf(o, r.b)));
// the ports a power trades through: its own coastal cities, else the nearest allied, passage-partner or independent port to its capital
var NATP = {h:-1, S:null, m:new Map()};
function natPorts(n){ if (NATP.h !== S.hour || NATP.S !== S || NATP.v !== tickVer) NATP = {h:S.hour, S, v:tickVer, m:new Map()}; if (NATP.m.has(n)) return NATP.m.get(n); const out = natPorts0(n); NATP.m.set(n, out); return out; }
function natPorts0(n){ const own = []; for (const P of G.P) if (S.owner[P.id] === n && isPort(P)) own.push(P.id); if (own.length) return own;
  const C = G.P[S.nations[n].capital]; let best = -1, bd = 14;
  for (const P of G.P){ if (!isPort(P)) continue; const o = S.owner[P.id]; if (o === n || !(o === NEUTRAL || (o >= 0 && friendly(n, o)))) continue; const d = hexDist(C.cc, P.cc); if (d < bd){ bd = d; best = P.id; } }
  return best >= 0 ? [best] : []; }
var NEUP = null;   // independent ports by country, rebuilt daily
function neuPorts(){ if (NEUP && NEUP.h === S.hour && NEUP.S === S) return NEUP.m; const m = new Map();
  for (const P of G.P) if (S.owner[P.id] === NEUTRAL && isPort(P)){ if (!m.has(P.country)) m.set(P.country, []); m.get(P.country).push(P.id); }
  NEUP = {h:S.hour, S, m}; return m; }
const portsOf = (n, nc) => n === NEUTRAL ? (neuPorts().get(nc) || []) : natPorts(n);
// shortest all-water route between two sea zones; the major shipping lanes count about half as far, so routes follow them
var TRPC = {G:null, m:new Map()};
function seaRoute(za, zb){ if (TRPC.G !== G){ TRPC.G = G; TRPC.m = new Map(); } const key = za*8192 + zb; if (TRPC.m.has(key)) return TRPC.m.get(key);
  const d = new Map([[za, 0]]), prev = new Map(), hk = [], hv = [];
  const push = (k, v) => { hk.push(k); hv.push(v); let i = hk.length - 1; while (i > 0){ const p = (i - 1) >> 1; if (hk[p] <= hk[i]) break; [hk[p], hk[i]] = [hk[i], hk[p]]; [hv[p], hv[i]] = [hv[i], hv[p]]; i = p; } };
  const pop = () => { const v = hv[0], k = hk[0], lk = hk.pop(), lv = hv.pop(); if (hk.length){ hk[0] = lk; hv[0] = lv; let i = 0; for (;;){ const l = 2*i + 1, r = l + 1; let m = i; if (l < hk.length && hk[l] < hk[m]) m = l; if (r < hk.length && hk[r] < hk[m]) m = r; if (m === i) break; [hk[m], hk[i]] = [hk[i], hk[m]]; [hv[m], hv[i]] = [hv[i], hv[m]]; i = m; } } return [k, v]; };
  push(0, za); let found = za === zb;
  while (hk.length && !found){ const [du, u] = pop(); if (du > d.get(u)) continue; if (u === zb){ found = true; break; }
    for (const [v, w] of trCanalNb(u)){ const nd = du + w*0.55; if (nd < (d.has(v) ? d.get(v) : 1e18)){ d.set(v, nd); prev.set(v, u); push(nd, v); } }   // (merchant convoys through Suez and Panama)
    for (const [v, w] of G.P[u].nb){ if (!G.P[v].sea) continue; const nd = du + w*(isLane(u, v) ? 0.55 : 1); if (nd < (d.has(v) ? d.get(v) : 1e18)){ d.set(v, nd); prev.set(v, u); push(nd, v); } } }
  let out = null; if (za === zb) out = [za]; else if (prev.has(zb)){ out = []; for (let v = zb; v !== za; v = prev.get(v)) out.push(v); out.push(za); out.reverse(); }
  TRPC.m.set(key, out); return out; }
// connected bodies of water (the world ocean, the Caspian, big lakes): component id per sea zone, and sizes
var SEACMP = {G:null, c:null}, SCN_SZ = [];
function seaComp(){ if (SEACMP.G === G) return SEACMP.c; const c = new Int32Array(G.P.length).fill(-1); SCN_SZ = []; let k = 0;
  for (const P of G.P){ if (!P.sea || c[P.id] >= 0) continue; const q = [P.id]; c[P.id] = k; for (let i = 0; i < q.length; i++) for (const v of G.P[q[i]].nbs) if (G.P[v].sea && c[v] < 0){ c[v] = k; q.push(v); } SCN_SZ.push(q.length); k++; }
  SEACMP = {G, c}; return c; }
const seaNb = (p, toward) => { let best = -1, bd = 1e18; const T = G.P[toward]; for (const v of G.P[p].nbs){ if (!G.P[v].sea) continue; const d = Math.hypot(G.P[v].x - T.x, G.P[v].y - T.y); if (d < bd){ bd = d; best = v; } } return best; };
/* ---- the sea grid: convoys sail the map's sea cells (CELL_KM, 60 km), so blockades and raids work in km around a fleet's actual spot ----
   A sea route's track (trBase): the cells from the water off its first port to the water off the last, through its sea zones (the corridor),
   and over the bridges where the grid closes a strait (rules/map.js loadWorld.straits) or a canal (TR_CANALS: Suez, open to merchant convoys
   only; Panama is open water on the grid). Fleets ordered to Blockade (a.blk) close a circle of their reach (BLOCKADE_KM) around where they stand. A convoy of
   a power they are at war with sails around it: trDetour, an A* over the open cells (a step out of the corridor costs TR_OFFC), at most
   TR_DET_MAX times the track. No way round within that (a closed chokepoint, a port's approach, a screen of ships across a narrow sea): the
   route is cut. A detour is slower, so the route pays the track's share of it (TR_DET_MAX = 2: at least half; lengths are the cell paths
   pulled taut, so one ship in mid-ocean costs a convoy little, while a screen, a coast or a strait costs a lot). Friendly warships inside a
   circle with half the blockaders' strength contest it: convoys may run through it at half income. Derived from the map and the fleets' spots
   only (cached per route and blockade picture, never saved), so it is the same in every run. */
const TR_DET_MAX = 2, TR_OFFC = 1.25;
const TR_CANALS = [{k:'suez', a:[32.3, 31.4], b:[34.2, 27.6]}];   // (Panama is open water on the grid already)
const CELL_KM = HS*SQ3/KM_W;
const cellLL = c => [((((c % W) + 0.5)/W*360 + WORLD.lon0) + 540) % 360 - 180, cellLat(c)];
// the sea cell nearest a point (lon, lat); -1 when none is within 8 cells
function llCell(lon, lat, sea){ const col = Math.round((((lon - WORLD.lon0) % 360) + 360) % 360/360*W - 0.5), row = Math.round((YMAX - miller(lat))/(YMAX - YMIN)*(H - 1));
  const [tx, ty] = cellCenter(idx(Math.max(0, Math.min(W - 1, col)), Math.max(0, Math.min(H - 1, row)))); let best = -1, bd = 1e18;
  for (let r = Math.max(0, row - 8); r <= Math.min(H - 1, row + 8); r++) for (let c = Math.max(0, col - 8); c <= Math.min(W - 1, col + 8); c++){ const i = idx(c, r); if (!sea[i]) continue; const [x, y] = cellCenter(i), d = (x - tx)**2 + (y - ty)**2; if (d < bd){ bd = d; best = i; } }
  return best; }
var TRC = {G:null};
function trCells(){ if (TRC.G === G) return TRC; const N = W*H, sea = new Uint8Array(N), cx = new Float32Array(N), cy = new Float32Array(N);
  for (let c = 0; c < N; c++){ const p = G.prov[c]; if (p >= 0 && G.P[p].sea && !/Caspian/.test(G.P[p].name)) sea[c] = 1; const [x, y] = cellCenter(c); cx[c] = x; cy[c] = y; }
  const br = new Map(), pairs = [], canal = [];
  const link = (a, b, k) => { const w = Math.hypot(cx[a] - cx[b], cy[a] - cy[b])/(HS*SQ3); for (const [x, y] of [[a, b], [b, a]]){ let l = br.get(x); if (!l) br.set(x, l = []); l.push([y, w]); } pairs.push([a, b, k]); };
  const coastal = z => G.P[z].cells.filter(c => { if (!sea[c]) return false; for (let d = 0; d < 6; d++){ const m = nbr(c, d); if (m >= 0 && !sea[m]) return true; } return false; });
  for (const [za, zb] of G.straits || loadWorld.straits || []){ const A = coastal(za), B = coastal(zb); let best = null, bd = 1e18;
    for (const a of A) for (const b of B){ const d = (cx[a] - cx[b])**2 + (cy[a] - cy[b])**2; if (d < bd){ bd = d; best = [a, b]; } }
    if (best) link(best[0], best[1], 'strait'); }
  for (const C of TR_CANALS){ const a = llCell(C.a[0], C.a[1], sea), b = llCell(C.b[0], C.b[1], sea); if (a >= 0 && b >= 0 && G.prov[a] !== G.prov[b]){ link(a, b, C.k); canal.push([G.prov[a], G.prov[b], a, b, C.k]); } }
  // the grid matches the zone graph: a zone split by the grid (a sound or strait the cells close inside one zone) is joined across its gap, and
  // two neighbouring zones whose cells do not touch are joined where they come closest (as the straits are)
  { const par = new Int32Array(N); for (let i = 0; i < N; i++) par[i] = i; const find = i => { while (par[i] !== i){ par[i] = par[par[i]]; i = par[i]; } return i; }, uni = (a, b) => { par[find(a)] = find(b); };
    for (let c = 0; c < N; c++) if (sea[c]) for (let d = 0; d < 3; d++){ const m = nbr(c, d); if (m >= 0 && sea[m]) uni(c, m); }
    for (const [a, b] of pairs) uni(a, b);
    const close = (A, B) => { let best = null, bd = 1e18; for (const a of A) for (const b of B){ const d = (cx[a] - cx[b])**2 + (cy[a] - cy[b])**2; if (d < bd){ bd = d; best = [a, b]; } } return best; };
    for (const P of G.P){ if (!P.sea) continue; const cs = coastal(P.id); if (!cs.length) continue; const grp = new Map(); for (const c of P.cells) if (sea[c]){ const k = find(c); if (!grp.has(k)) grp.set(k, []); grp.get(k).push(c); }
      if (grp.size < 2) continue; const gs = [...grp.values()].sort((x, y) => y.length - x.length), main = gs[0].filter(c => cs.includes(c));
      for (const g of gs.slice(1)){ const q = close(main.length ? main : gs[0], g.filter(c => cs.includes(c)).length ? g.filter(c => cs.includes(c)) : g); if (q && find(q[0]) !== find(q[1])){ link(q[0], q[1], 'gap'); uni(q[0], q[1]); } } }
    for (const P of G.P){ if (!P.sea || !P.cells.some(c => sea[c])) continue; for (const v of P.nbs){ if (v < P.id || !G.P[v].sea || !G.P[v].cells.some(c => sea[c])) continue;
      const a0 = P.cells.find(c => sea[c]), b0 = G.P[v].cells.find(c => sea[c]); if (find(a0) === find(b0)) continue; const q = close(coastal(P.id), coastal(v)); if (q){ link(q[0], q[1], 'gap'); uni(q[0], q[1]); } } } }
  TRC = {G, N, sea, cx, cy, br, pairs, canal, cz:new Map()}; for (const [za, zb] of canal.map(q => [q[0], q[1]])){ const w = Math.max(0.35, hexDist(G.P[za].cc, G.P[zb].cc)); for (const [x, y] of [[za, zb], [zb, za]]){ if (!TRC.cz.has(x)) TRC.cz.set(x, []); TRC.cz.get(x).push([y, w]); } }
  return TRC; }
const trCanalNb = z => trCells().cz.get(z) || [];
// A* over the sea cells from s to e: ok(c) may the convoy enter c, cf(c) the cost of a step into it (a cell = 1), bok(u, v) may it use the bridge
// u→v; maxC prunes paths dearer than that. Returns the cells (s … e) or null. Ties are broken by the heap only, so the result is deterministic.
var TRA = {N:0};
function trAstar(s, e, ok, cf, bok, maxC = 1e9){ const C = trCells(), N = C.N; if (s < 0 || e < 0) return null; if (TRA.N !== N) TRA = {N, g:new Float64Array(N), fr:new Int32Array(N), st:new Uint32Array(N), gen:0};
  const A = TRA, gen = ++A.gen, U = HS*SQ3, ex = C.cx[e], ey = C.cy[e], hf = c => Math.hypot(C.cx[c] - ex, C.cy[c] - ey)/U, hk = [], hv = [];
  const push = (k, v) => { let i = hk.length; hk.push(k); hv.push(v); while (i > 0){ const p = (i - 1) >> 1; if (hk[p] <= k) break; hk[i] = hk[p]; hv[i] = hv[p]; i = p; } hk[i] = k; hv[i] = v; };
  const pop = () => { const v = hv[0], lk = hk.pop(), lv = hv.pop(), n = hk.length; if (n){ let i = 0; for (;;){ let c = 2*i + 1; if (c >= n) break; if (c + 1 < n && hk[c + 1] < hk[c]) c++; if (hk[c] >= lk) break; hk[i] = hk[c]; hv[i] = hv[c]; i = c; } hk[i] = lk; hv[i] = lv; } return v; };
  const relax = (u, v, gn) => { const f = gn + hf(v); if (f > maxC) return; if (A.st[v] !== gen || gn < A.g[v] - 1e-9){ A.st[v] = gen; A.g[v] = gn; A.fr[v] = u; push(f, v); } };
  A.st[s] = gen; A.g[s] = 0; A.fr[s] = -1; push(hf(s), s);
  while (hk.length){ const f = hk[0], u = pop(); if (f > A.g[u] + hf(u) + 1e-9) continue; if (u === e) break; const gu = A.g[u];
    for (let d = 0; d < 6; d++){ const v = nbr(u, d); if (v < 0 || !C.sea[v] || !ok(v)) continue; relax(u, v, gu + cf(v)); }
    const bl = C.br.get(u); if (bl) for (const [v, w] of bl){ if (!ok(v) || (bok && !bok(u, v))) continue; relax(u, v, gu + w*cf(v)); } }
  if (A.st[e] !== gen) return null; const out = []; for (let c = e; c >= 0; c = c === s ? -1 : A.fr[c]) out.push(c); return out.reverse(); }
// a track: cells, their centres (world units), cumulative km along the cells, the zones it passes in order, and its box. km: the length a ship
// sails, the cell path pulled taut over the cells it may use (ok; a hex path has many equally short shapes, the taut one shows a detour's
// real cost); a bridge (strait, canal) is sailed straight
function trTrack(cells, ok = () => true){ const C = trCells(), pts = cells.map(c => [C.cx[c], C.cy[c]]), cum = [0]; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i < pts.length; i++){ const [x, y] = pts[i]; if (i) cum.push(cum[i - 1] + Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1])/KM_W); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const zs = []; for (const c of cells){ const z = G.prov[c]; if (zs[zs.length - 1] !== z) zs.push(z); }
  const U = HS*SQ3, adj = (u, v) => { for (let d = 0; d < 6; d++) if (nbr(u, d) === v) return true; return false; };
  const clear = (i, j) => { const [ax, ay] = pts[i], [bx, by] = pts[j], n = Math.ceil(Math.hypot(bx - ax, by - ay)/(0.4*U)); for (let k = 1; k < n; k++){ const c = worldToCell(ax + (bx - ax)*k/n, ay + (by - ay)*k/n); if (c < 0 || !C.sea[c] || !ok(c)) return false; } return true; };
  let km = 0; for (let i = 0; i < pts.length - 1;){ let best = i + 1; for (let j = i + 2; j < pts.length && j - i < 60; j++){ if (!adj(cells[j - 1], cells[j])) break; if (!clear(i, j)) break; best = j; }
    km += Math.hypot(pts[best][0] - pts[i][0], pts[best][1] - pts[i][1])/KM_W; i = best; }
  return {cells, pts, cum, km:Math.max(CELL_KM, km), zs, box:[x0, y0, x1, y1], set:new Set(cells)}; }
// the nearest point of a track to (x, y): {d (km), i (segment), x, y}
function trNear(t, x, y){ const P = t.pts; let bd = Infinity, bi = 0, bx = P[0][0], by = P[0][1];
  if (P.length === 1) return {d:Math.hypot(x - bx, y - by)/KM_W, i:0, x:bx, y:by};
  for (let i = 0; i < P.length - 1; i++){ const [ax, ay] = P[i], [qx, qy] = P[i + 1], dx = qx - ax, dy = qy - ay, L = dx*dx + dy*dy, u = L ? Math.max(0, Math.min(1, ((x - ax)*dx + (y - ay)*dy)/L)) : 0, px = ax + dx*u, py = ay + dy*u, d = (x - px)**2 + (y - py)**2;
    if (d < bd){ bd = d; bi = i + (u > 0.5 ? 1 : 0); bx = px; by = py; } }
  return {d:Math.sqrt(bd)/KM_W, i:Math.min(bi, P.length - 1), x:bx, y:by}; }
const trInBox = (b, x, y, km) => { const m = km*KM_W; return x >= b[0] - m && x <= b[2] + m && y >= b[1] - m && y <= b[3] + m; };
const segD = (ax, ay, bx, by, x, y) => { const dx = bx - ax, dy = by - ay, L = dx*dx + dy*dy, u = L ? Math.max(0, Math.min(1, ((x - ax)*dx + (y - ay)*dy)/L)) : 0; return Math.hypot(ax + dx*u - x, ay + dy*u - y); };
// a sea route's track through its own zones (cached by ports and zones: derived from the map only)
var TRB = {G:null, m:new Map()};
function trBase(r){ if (r.kind !== 'sea' || !r.path || !r.path.length) return null; if (TRB.G !== G){ TRB = {G, m:new Map()}; } const key = r.pa + ':' + r.pb + ':' + r.path.join(',');
  if (TRB.m.has(key)) return TRB.m.get(key);
  const C = trCells(), zs = new Set(r.path), near = (z, p) => { let best = -1, bd = 1e18; const P = G.P[p]; for (const c of G.P[z].cells){ if (!C.sea[c]) continue; const d = (C.cx[c] - P.x)**2 + (C.cy[c] - P.y)**2; if (d < bd){ bd = d; best = c; } } return best; };
  const s = near(r.path[0], r.pa), e = near(r.path[r.path.length - 1], r.pb);
  const cells = trAstar(s, e, c => zs.has(G.prov[c]), () => 1) || trAstar(s, e, () => true, c => zs.has(G.prov[c]) ? 1 : 2);
  const b = cells ? trTrack(cells) : null; if (b) b.zset = zs; TRB.m.set(key, b); return b; }
// the fleets blockading now: {a, o, x, y, R (km), H (strength, stack efficiency applied), z}; rebuilt with the sea index
var TRBK = [];
function trBlkIndex(){ TRBK = []; TRBK.S = S; for (const a of S.armies){ if (!a.blk || a.to !== null || a.air || a.fly || a.owner < 0 || !G.P[a.at].sea || !shipsN(a)) continue;
    let R = 0; for (const t in BLOCKADE_KM) if (a.u[t] > 0) R = Math.max(R, BLOCKADE_KM[t]); if (!R) continue; const [x, y] = armyXY(a); TRBK.push({a, o:a.owner, x, y, R, H:navPw(a)*stackEffs(a).sea, z:a.at}); } }
const trBlks = () => { if (TRBK.S !== S) trBlkIndex(); return TRBK; };
// the reach of a fleet's warships (km): its longest BLOCKADE_KM
const fleetKm = a => { let R = 0; for (const t in BLOCKADE_KM) if (a.u[t] > 0) R = Math.max(R, BLOCKADE_KM[t]); return R; };
// mark the cells of the circles (gen-stamped, reused)
var TRM = {N:0};
function trMark(circles){ const C = trCells(); if (TRM.N !== C.N) TRM = {N:C.N, m:new Uint32Array(C.N), gen:0}; const gen = ++TRM.gen, U = HS*SQ3, V = HS*1.5;
  for (const k of circles){ const Rw = k.R*KM_W, r0 = Math.max(0, Math.floor((k.y - Rw - OY)/V) - 1), r1 = Math.min(H - 1, Math.ceil((k.y + Rw - OY)/V) + 1), c0 = Math.max(0, Math.floor((k.x - Rw - OX)/U) - 1), c1 = Math.min(W - 1, Math.ceil((k.x + Rw - OX)/U) + 1);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++){ const i = idx(c, r); if (Math.hypot(C.cx[i] - k.x, C.cy[i] - k.y) <= Rw) TRM.m[i] = gen; } }
  return c => TRM.m[c] === gen; }
// where a route's convoys sail now, given the blockades: {track, det (rerouted), cut, port (its port's approach is closed), con (through a contested
// circle), fac (income share of the detour), k (the deciding blockade), ch (the chokepoint it closes, if any)}. Cached per route and blockade picture.
var TRDC = {S:null, m:new Map()};
function trDetour(r){ const B = trBase(r); if (!B) return null; if (TRDC.S !== S){ TRDC = {S, m:new Map()}; }
  const hit = trBlks().filter(k => trHostile(r, k.o));
  if (!hit.length || !hit.some(k => trInBox(B.box, k.x, k.y, k.R) && trNear(B, k.x, k.y).d <= k.R)) return {track:B, B, det:false, cut:false, fac:1};
  // friendly warships with half the blockaders' strength inside a circle contest it
  for (const k of hit){ let F = 0; for (const l of SEAA.values()) for (const x of l) if (trFriend(r, x.owner)){ const [fx, fy] = armyXY(x); if (Math.hypot(fx - k.x, fy - k.y)/KM_W <= k.R) F += navPw(x); } k.con = F >= 0.5*k.H && F > 0; }
  const sig = r.pa + ':' + r.pb + ':' + r.path.join(',') + '|' + hit.map(k => `${k.a.id}:${Math.round(k.x*4)}:${Math.round(k.y*4)}:${k.R}:${k.con ? 1 : 0}`).join('|');
  const c0 = TRDC.m.get(r.id); if (c0 && c0.sig === sig) return c0.res;
  const s = B.cells[0], e = B.cells[B.cells.length - 1], C = trCells(), maxC = TR_DET_MAX*B.km/CELL_KM*TR_OFFC + 6;
  const touchOf = list => list.filter(k => trNear(B, k.x, k.y).d <= k.R).sort((p, q) => trNear(B, p.x, p.y).i - trNear(B, q.x, q.y).i)[0] || list[0];
  const run = list => { const inC = trMark(list), bok = (u, v) => !list.some(k => segD(C.cx[u], C.cy[u], C.cx[v], C.cy[v], k.x, k.y) <= k.R*KM_W);
    if (inC(s) || inC(e)) return {port:true};
    const cells = trAstar(s, e, c => !inC(c), c => B.zset.has(G.prov[c]) ? 1 : TR_OFFC, bok, maxC); if (!cells) return null; const t = trTrack(cells, c => !inC(c)); return t.km <= TR_DET_MAX*B.km + 1 ? {t} : null; };
  const hard = hit.filter(k => !k.con); let res = null, o = run(hit);
  if (o && o.t) res = {track:o.t, det:true, cut:false, con:false, k:touchOf(hit)};
  else { const o2 = hard.length < hit.length ? run(hard) : o;
    if (o2 && o2.t) res = {track:o2.t, det:true, cut:false, con:true, k:touchOf(hit.filter(k => k.con))};
    else { const port = !!(o2 && o2.port), list = hard.length ? hard : hit, onEnd = k => Math.hypot(C.cx[s] - k.x, C.cy[s] - k.y) <= k.R*KM_W || Math.hypot(C.cx[e] - k.x, C.cy[e] - k.y) <= k.R*KM_W;
      res = {track:B, det:false, cut:true, port, k:(port && list.find(onEnd)) || touchOf(list)}; } }
  res.B = B; res.fac = res.cut ? 0 : Math.min(1, B.km/res.track.km); res.ch = res.k ? chokeAt(res.k.x, res.k.y, res.k.R) : null;
  TRDC.m.set(r.id, {sig, res}); return res; }
// chokepoints on the grid: {k, name, c (its cell), x, y, a, b (cells either side)}
var CHK = {G:null, l:[]};
function chokes(){ if (CHK.G === G) return CHK.l; const C = trCells(); CHK = {G, l:CHOKEPOINTS.map(q => { const c = llCell(q.p[0], q.p[1], C.sea); return {k:q.k, name:q.name, c, x:c >= 0 ? C.cx[c] : 0, y:c >= 0 ? C.cy[c] : 0, a:llCell(q.a[0], q.a[1], C.sea), b:llCell(q.b[0], q.b[1], C.sea)}; }).filter(q => q.c >= 0 && q.a >= 0 && q.b >= 0)}; return CHK.l; }
const chokeByKey = k => chokes().find(q => q.k === k) || null;
// the chokepoint a blockade circle closes or sits on (its passage within the circle's reach and a cell), else null
function chokeAt(x, y, R){ let best = null, bd = Infinity; for (const q of chokes()){ const d = Math.hypot(q.x - x, q.y - y)/KM_W; if (d <= R + CELL_KM && d < bd){ bd = d; best = q.k; } } return best; }
// is the way through chokepoint k (from side a to side b, within CHOKE_KM of the passage) closed by these blockade circles (default: all of them)?
function chokeClosed(k, circles){ const q = typeof k === 'string' ? chokeByKey(k) : k; if (!q) return false; const C = trCells(), list = circles || trBlks(), Rw = CHOKE_KM*KM_W;
  const inC = trMark(list), near = c => Math.hypot(C.cx[c] - q.x, C.cy[c] - q.y) <= Rw, bok = (u, v) => !list.some(b => segD(C.cx[u], C.cy[u], C.cx[v], C.cy[v], b.x, b.y) <= b.R*KM_W);
  if (inC(q.a) || inC(q.b)) return true; return !trAstar(q.a, q.b, c => near(c) && !inC(c), () => 1, bok); }
// lay out a route: ports and path (sea zones for a sea route, land provinces for a land route); false when it cannot be laid
function trPlace(r){
  if (r.kind === 'land'){ const A = S.nations[r.a], B = S.nations[r.b], ok = v => S.owner[v] === r.a || S.owner[v] === r.b;
    if (S.owner[A.capital] !== r.a || S.owner[B.capital] !== r.b) return false; const pth = findPath(A.capital, B.capital, ok, 'wheel', r.a); if (!pth.length || pth.length > 40) return false;
    r.pa = A.capital; r.pb = B.capital; r.path = [A.capital, ...pth]; r.len = r.path.length; return true; }
  const PA = portsOf(r.a), PB = portsOf(r.b, r.nc); if (!PA.length || !PB.length) return false;
  // the closest pair of ports whose waters connect (a port on a lake or the Caspian only trades across that water), yards and capitals preferred
  const SC = seaComp(), comps = p => new Set(G.P[p].nbs.filter(v => G.P[v].sea).map(v => SC[v]));
  let best = null, bd = 1e9;
  for (const pa of PA){ const ca = comps(pa); for (const pb of PB){ const cb = comps(pb); let c = -1; for (const x of ca) if (cb.has(x) && (c < 0 || SCN_SZ[x] > SCN_SZ[c])) c = x; if (c < 0) continue;
    const d = hexDist(G.P[pa].cc, G.P[pb].cc) - 3*(S.bld[pa].yard ? 1 : 0) - 3*(S.bld[pb].yard ? 1 : 0) - (isCapital(pa) ? 2 : 0) - (isCapital(pb) ? 2 : 0); if (d < bd){ bd = d; best = [pa, pb, c]; } } }
  if (!best) return false;
  const [pa, pb, c] = best, nbIn = (p, to) => { let b0 = -1, b1 = 1e18; const T0 = G.P[to]; for (const v of G.P[p].nbs){ if (!G.P[v].sea || SC[v] !== c) continue; const d = Math.hypot(G.P[v].x - T0.x, G.P[v].y - T0.y); if (d < b1){ b1 = d; b0 = v; } } return b0; };
  const za = nbIn(pa, pb), zb = nbIn(pb, pa); if (za < 0 || zb < 0) return false;
  const path = seaRoute(za, zb); if (!path) return false;
  r.pa = pa; r.pb = pb; r.path = path.slice(); r.len = path.length; r.via = [S.owner[pa] !== r.a ? S.owner[pa] : null, r.b >= 0 && S.owner[pb] !== r.b ? S.owner[pb] : null]; return true; }
function trPortsOk(r){ if (r.kind === 'land') return S.owner[r.pa] === r.a && S.owner[r.pb] === r.b && r.path.every(v => S.owner[v] === r.a || S.owner[v] === r.b);
  const okP = (p, n, nc) => { const o = S.owner[p]; if (n === NEUTRAL) return o === NEUTRAL && G.P[p].country === nc; if (o === n) return true; return !natPorts(n).includes(p) ? false : true; };
  return okP(r.pa, r.a) && okP(r.pb, r.b, r.nc); }
// why a route can no longer run (null if it can)
function trInvalid(r){ const T = trS(), M = mkt();
  if (!S.nations[r.a].alive || S.owner[S.nations[r.a].capital] !== r.a) return 'gone';
  if (r.b >= 0){ if (!S.nations[r.b].alive || S.owner[S.nations[r.b].capital] !== r.b) return 'gone';
    if (atWar(r.a, r.b) || S.decl.some(d => (d.by === r.a && d.to === r.b) || (d.by === r.b && d.to === r.a))) return 'war';
    if (embargoed(r.a, r.b)) return 'embargo';
    for (const me of [r.a, r.b]) if (isSeat(me) && opinion(trOther(r, me), me) < -50) return 'refused';   // a seat's partner breaks off when it comes to dislike the seat
    if (r.kind === 'land' && !borders(r.a, r.b)) return 'border'; }
  else if (!(neuPorts().get(r.nc) || []).length) return 'gone';
  if (T.closed[r.key]) return 'closed';
  return null; }
// an embargo takes effect at once: routes between the two powers close now (with the usual notice), not at the next daily check
function trCutEmbargo(){ const T = trS(), gone = T.routes.filter(r => r.b >= 0 && embargoed(r.a, r.b)); if (!gone.length) return;
  T.routes = T.routes.filter(r => !gone.includes(r)); for (const r of gone) trEnded(r, 'embargo'); T.ver = (T.ver || 0) + 1; INCC.v = -1; }
const TR_WHY = {war:'war broke out', embargo:'an embargo', refused:'they no longer trade with you', border:'the border closed', gone:'the partner is gone', closed:'you closed it', port:'no port is left to trade through'};
function trMake(a, b, kind, nc = null){ const T = trS(), r = {id:T.nid++, a, b, nc:b === NEUTRAL ? nc : null, kind, key:trKey(a, b, nc), t0:S.hour, f:1, why:'', by:-1, bz:-1, raid:-1e9, raidZ:-1, acc:0, accN:0, va:null, vb:null, sunk:0};
  if (trInvalid(r) || !trPlace(r)) return null; T.routes.push(r); T.ver = (T.ver || 0) + 1; trStatus(r); return r; }
function trEnded(r, why){ const T = trS(); T.ver = (T.ver || 0) + 1;
  for (const a of S.armies) if (a.escort === r.id) delete a.escort;
  if (why !== 'closed') for (const me of [r.a, r.b]) if (isSeat(me)) tell(me, `The ${trName(r, me)} trade route has ended: ${TR_WHY[why] || why}.`, 'info', r.path[Math.floor(r.path.length/2)]); }
// pre-trade money income: the economy that drives a route's value
const trGdp = n => { const i = income(n); return Math.max(40, i.gross.cash - (i.trade ? i.trade.cash : 0)); };
function neuGdp(nc){ const c = G.countries[nc]; let s = 0; for (const p of c.provs) if (S.owner[p] === NEUTRAL) s += G.P[p].city ? 12 : 3; return Math.max(30, Math.min(260, 30 + s)); }
function neuGood(nc){ let oil = 0, ore = 0, rare = 0, city = 0; for (const p of G.countries[nc].provs) if (S.owner[p] === NEUTRAL){ const P = G.P[p]; if (P.oil) oil++; if (P.ore) ore++; if (P.rare >= 1.5) rare++; if (P.city) city++; } return rare >= 1 ? 'rare' : oil >= 2 ? 'oil' : ore >= 2 ? 'iron' : city >= 3 ? 'elec' : 'metal'; }
// what a partner ships besides money: a little of the resource it produces most of relative to its needs
// (by value: a unit of rare materials or electronics weighs more than one of iron); a neutral partner ships 1.5 RES_K of its typical good (half that of rare
// materials). A partner ships 4% of its output of it, 0.5 to 4 RES_K, rounded to a tenth of RES_K
const TR_GOODS = ['oil', 'metal', 'iron', 'elec', 'rare'], TR_W = {oil:1, metal:1, iron:1, elec:1.6, rare:2.4};
function trGoods(n){ const i = income(n); let k = 'metal', bv = -1e9; for (const q of TR_GOODS){ const v = (i.net[q] + i.gross[q]*0.3)*TR_W[q]; if (v > bv){ bv = v; k = q; } } return [k, Math.max(5, Math.min(40, Math.round(i.gross[k]/RES_K*0.04*10)))*(RES_K/10)]; }
function trValue(r){ const ga = trGdp(r.a), gb = r.b >= 0 ? trGdp(r.b) : neuGdp(r.nc);
  const base = TR_K*Math.sqrt(ga*gb)*(r.kind === 'land' ? TR_LAND : 0.9 + 0.25*Math.min(1, (r.len || 1)/40))*(r.b === NEUTRAL ? TR_NEU : 1)*(has(r.a, 'eco1') ? 1.1 : 1);
  const ka = r.b >= 0 ? trGoods(r.b) : (g => [g, (g === 'rare' ? 0.8 : 1.5)*RES_K])(neuGood(r.nc));
  r.va = {cash:Math.round(base*10)/10, k:ka[0], q:ka[1]};
  if (r.b >= 0){ const kb = trGoods(r.a); r.vb = {cash:Math.round(base*(has(r.b, 'eco1') ? 1.1 : 1)/(has(r.a, 'eco1') ? 1.1 : 1)*10)/10, k:kb[0], q:kb[1]}; } else r.vb = null; }
const trSide = (r, n) => r.a === n ? r.va : r.b === n ? r.vb : null;
// a nation's trade income today: each route's value times its status factor (blockade, detour, sunk convoy, paused)
function tradeIncome(n){ const o = {cash:0, oil:0, metal:0, iron:0, elec:0, rare:0, n:0, cut:0, paused:0}; if (!S.trade) return o;
  for (const r of S.trade.routes){ if (!trMine(r, n)) continue; const v = trSide(r, n); if (!v) continue; o.n++; if (r.pause != null) o.paused++; else if (r.f < 1) o.cut++; o.cash += v.cash*r.f; if (o[v.k] != null) o[v.k] += v.q*r.f; }
  return o; }
// which armies stand in each sea zone (for blockades, raids and escorts), rebuilt with the blockade; fleets under way (moving, or sailing to a
// spot inside their zone) are not in it
var SEAA = new Map();
function seaIndex(){ SEAA = new Map(); for (const a of S.armies){ if (a.to !== null || a.sail || a.air || a.fly || !G.P[a.at].sea || !shipsN(a) || a.owner < 0) continue; if (!SEAA.has(a.at)) SEAA.set(a.at, []); SEAA.get(a.at).push(a); }
  const mpa = new Map(); for (const a of S.armies){ const f = a.fly; if (!f || f.kind !== 'hunt' || f.ph !== 'over' || !count(a)) continue; for (const z of [f.tgt, ...G.P[f.tgt].nbs]) if (G.P[z].sea){ if (!mpa.has(z)) mpa.set(z, []); mpa.get(z).push(a); } }
  SEAA.mpa = mpa; const land = new Map(); for (const a of S.armies){ if (a.to !== null || a.air || a.fly || a.owner < 0 || G.P[a.at].sea || !count(a)) continue; if (!land.has(a.at)) land.set(a.at, []); land.get(a.at).push(a); } SEAA.land = land;
  trBlkIndex(); }
const surfPw = a => TR_SURF.reduce((s0, t) => s0 + (a.u[t] ? a.u[t]*unitPw(a.owner, t) : 0), 0);
const navPw = a => NAVAL_T.reduce((s0, t) => s0 + (a.u[t] ? a.u[t]*unitPw(a.owner, t) : 0), 0);
// live status of a route: income factor, why, who and where it is blocked. Sea routes (trDetour): cut by Blockade orders that leave no way round
// ('blockade'; 'port' when the circle closes a port's approach), rerouted around them ('rerouted': the track's share of the detour), or run
// through a contested circle ('contested': half of that); hunting enemy maritime patrol aircraft over a zone of the track halve it (three
// quarters with friendly warships there). Paused routes ('paused') send no convoys and earn nothing.
function trStatus(r){ let f = 1, why = '', by = -1, bz = -1, bs = ''; r.ch = null; r.bk = -1; r.dk = 0;
  if (r.b >= 0 && atWar(r.a, r.b)){ r.f = r.f0 = 0; r.why = 'cut'; r.by = -1; r.bz = -1; return 0; }   // war broke out: the route closes at dawn
  if (r.pause != null){ r.f = r.f0 = 0; r.why = 'paused'; r.by = r.pause; r.bz = -1; return 0; }
  if (r.kind === 'land'){
    for (const v of r.path){ const o = S.owner[v];
      if (o !== r.a && o !== r.b){ f = 0; why = 'cut'; by = o; bz = v; break; }
      const foe = ((SEAA.land && SEAA.land.get(v)) || []).find(x => trHostile(r, x.owner)); if (foe){ f = 0; why = 'cut'; by = foe.owner; bz = v; break; } }
    if (f > 0) for (let i = 1; i < r.path.length; i++){ const lk = linkOf(r.path[i - 1], r.path[i]); if (lk && lk.dmg > 0){ f = Math.min(f, 0.6); why = why || 'damaged'; bz = r.path[i]; } }
  } else {
    const D = trDetour(r);
    if (D && (D.cut || D.det)){ const k = D.k; by = k ? k.o : -1; bz = k ? k.z : -1; r.bk = k ? k.a.id : -1; r.ch = D.ch;
      if (D.cut){ f = 0; why = D.port ? 'port' : 'blockade'; bs = 'cut'; }
      else { f = Math.round(D.fac*(D.con ? 0.5 : 1)*100)/100; why = D.con ? 'contested' : 'rerouted'; bs = 'det'; r.dk = Math.max(0, Math.round(D.track.km - D.B.km)); } }
    if (f > 0) for (const z of (D ? D.track.zs : r.path)){ const m = (SEAA.mpa && SEAA.mpa.get(z)) || [], ma = m.find(x => trHostile(r, x.owner)); if (!ma) continue;
      let F = 0; for (const x of SEAA.get(z) || []) if (trFriend(r, x.owner)) F += navPw(x); const zf = F > 0 ? 0.75 : 0.5; if (zf < f){ f = zf; why = 'contested'; by = ma.owner; bz = z; r.bk = -1; } } }
  if (S.hour - r.raid < 24){ r.f = 0; r.why = 'sunk'; } else { r.f = f; r.why = why; }
  r.f0 = f; r.by = by; r.bz = bz; r.bs0 = bs; return f; }
// where a blockade stands, for the dispatches: the chokepoint's name, the approach to a port, or the sea zone
function trBlkPlace(r){ if (r.ch){ const q = chokeByKey(r.ch); if (q) return q.name; } if (r.why === 'port'){ const B = trBase(r), k = trBlks().find(b => b.a.id === r.bk);
    if (B && k){ const e = B.cells[B.cells.length - 1], C = trCells(); return 'the approach to ' + pName(Math.hypot(C.cx[e] - k.x, C.cy[e] - k.y) <= k.R*KM_W ? r.pb : r.pa); } }
  return r.bz >= 0 ? G.P[r.bz].name : 'the sea lane'; }
// dispatches when a route's blockade picture changes (cut / rerouted / open again): to both partners and to the blockading power
function trNews(r){ const now = r.bs0 || '', was = r.bsN || ''; if (now === was) return; r.bsN = now; if (!S.started || r.kind !== 'sea') return;
  const who = r.by >= 0 ? nationName(r.by) : 'Enemy', at = trBlkPlace(r), mine = [r.a, r.b].filter(n => n >= 0 && isSeat(n)), mid = r.bz >= 0 ? r.bz : r.path[Math.floor(r.path.length/2)];
  if (now === 'cut'){ for (const me of mine) tell(me, `The ${trName(r, me)} trade route is cut: ${who} warships blockade ${at} and there is no way around. No convoys and no income until the blockade is lifted or broken.`, 'bad', mid);
    if (r.by >= 0 && isSeat(r.by)) tell(r.by, `Your blockade at ${at} has cut the ${S.nations[r.a].name}–${trName(r, r.a)} trade route: no convoys get through.`, 'good', mid); }
  else if (now === 'det'){ for (const me of mine) tell(me, `The ${trName(r, me)} convoys now sail around ${who}'s blockade at ${at}: +${fmt(r.dk)} km, so the route pays ${Math.round(r.f0*100)}% of its value.`, 'info', mid);
    if (r.by >= 0 && isSeat(r.by) && was === 'cut') tell(r.by, `The ${S.nations[r.a].name}–${trName(r, r.a)} convoys found a way around your blockade at ${at}.`, 'info', mid); }
  else if (was) for (const me of mine) tell(me, `The ${trName(r, me)} trade route is open again: the blockade is gone.`, 'good', null); }
// every blockade pass (6 h): refresh the sea index and every route's status; the day's average sets the day's income
var trLastH = -1;
function tradeBlockade(){ if (!S.trade) return; seaIndex(); const dt = trLastH >= 0 ? Math.max(1, Math.min(24, S.hour - trLastH)) : 6; trLastH = S.hour; let ch = false;
  for (const r of S.trade.routes){ const f0 = r.f, w0 = r.why; const f = trStatus(r); r.acc = (r.acc || 0) + f*dt; r.accN = (r.accN || 0) + dt; if (r.f !== f0 || r.why !== w0) ch = true; trNews(r); }
  if (ch) S.trade.ver = (S.trade.ver || 0) + 1; }
// the statuses now, after an order (blockade, raid, pause): no change to the day's average
function trRefresh(){ if (!S.trade) return; seaIndex(); for (const r of S.trade.routes){ trStatus(r); trNews(r); } S.trade.ver = (S.trade.ver || 0) + 1; INCC.v = -1; }
// escort strength protecting a route where a raid strikes (zone z, spot x, y): friendly warships whose reach (plus a cell) covers it, and every
// fleet escorting this route on or next to it
function escortsAt(r, z, x, y){ const out = new Set(); if (x == null){ x = G.P[z].x; y = G.P[z].y; }
  for (const l of SEAA.values()) for (const e of l){ if (!trFriend(r, e.owner) || !(navPw(e) > 0)) continue; const [ex, ey] = armyXY(e); if (Math.hypot(ex - x, ey - y)/KM_W <= fleetKm(e) + 2*CELL_KM) out.add(e); }
  for (const e of S.armies) if (e.escort === r.id && e.to === null && !e.sail && G.P[e.at].sea && (e.at === z || r.path.includes(e.at) || r.path.some(v => G.P[v].nb.has(e.at)))) out.add(e);
  return [...out]; }
// a hostile air attack on a sea zone (maritime patrol hunt, strike or bomber raid) also threatens convoys there for a day
function tradeAirRaid(o, z, pw){ if (!S.trade || o < 0 || !G.P[z].sea) return; S.trade.air[z] = {o, h:S.hour, pw:Math.max(6, pw)}; }
// who can strike a route's convoys, by sea zone along its track (in order): hostile warships standing within their reach (BLOCKADE_KM) of the
// track (submarines 1.3, surface ships 0.8 of their power; full with a Raid order, TR_OPP without; times their stack efficiency), and hostile
// aircraft that attacked a zone of the track in the last day. {z, i (first track index), R, raiders, lead, air, x, y (where the lead strikes)}
const TR_OPP = 0.5;
function trRaidMap(r){ const out = new Map(); if (r.kind !== 'sea' || !S.trade) return out; const D = trDetour(r); if (!D) return out; const t = D.track;
  const add = (z, i, w, x, o, px, py) => { let e = out.get(z); if (!e) out.set(z, e = {z, i, R:0, raiders:[], lead:-1, lw:0, air:false, x:px, y:py}); e.i = Math.min(e.i, i); e.R += w; if (x) e.raiders.push(x); if (w > e.lw){ e.lw = w; e.lead = o; e.x = px; e.y = py; } return e; };
  for (const l of SEAA.values()) for (const x of l){ if (!trHostile(r, x.owner)) continue; const km = fleetKm(x); if (!km) continue; const [px, py] = armyXY(x); if (!trInBox(t.box, px, py, km)) continue; const nr = trNear(t, px, py); if (nr.d > km) continue;
    const se = stackEffs(x).sea, k = x.raid ? 1 : TR_OPP; let w = 0; for (const ty of NAVAL_T){ if (!x.u[ty] || !(nr.d <= (BLOCKADE_KM[ty] || 0))) continue; w += x.u[ty]*unitPw(x.owner, ty)*(ty === 'sub' ? 1.3 : 0.8)*k*se; }
    if (w > 0) add(G.prov[t.cells[nr.i]], nr.i, w, x, x.owner, nr.x, nr.y); }
  const seen = new Set(); for (let i = 0; i < t.cells.length; i++){ const z = G.prov[t.cells[i]]; if (seen.has(z)) continue; seen.add(z); const A = S.trade.air[z]; if (!A || S.hour - A.h >= 24 || !trHostile(r, A.o)) continue; add(z, i, A.pw, null, A.o, t.pts[i][0], t.pts[i][1]).air = true; }
  return new Map([...out].sort((p, q) => p[1].i - q[1].i)); }
function trRaidPower(r, z){ return trRaidMap(r).get(z) || {z, R:0, raiders:[], lead:-1, air:false}; }
// the daily convoy: along its track in order; the first raid that is attempted decides it (escorts may beat it off)
function trRaid(r){ if (r.kind !== 'sea' || r.f <= 0 || r.pause != null) return null;
  for (const [z, rp] of trRaidMap(r)){ if (rp.R <= 0) continue; const pA = 1 - Math.exp(-rp.R/TR_RAID_K); if (rng() >= pA) continue;
    const esc = escortsAt(r, z, rp.x, rp.y), E = esc.reduce((s0, x) => s0 + navPw(x)*(x.u.frig ? 1.25 : 1), 0), pSave = E > 0 ? 1.3*E/(1.3*E + rp.R) : 0, saved = rng() < pSave;
    let dealt = 0, lost = 0;
    if (E > 0 && rp.raiders.length){ const h0 = rp.raiders.reduce((s0, x) => s0 + effHP(x), 0), u0 = rp.raiders.reduce((s0, x) => s0 + count(x), 0), tot = rp.raiders.reduce((s0, x) => s0 + armyHP(x), 0) || 1;
      const av = {}; for (const e of esc){ const v = sideAV([e], e.owner, (saved ? 3 : 1.6)*(0.8 + rng()*0.4)); for (const k in v) av[k] = (av[k] || 0) + v[k]; } for (const x of rp.raiders) hurt(x, av, 1/tot);
      const back = {}; for (const x of rp.raiders){ const v = sideAV([x], x.owner, 0.8*(0.8 + rng()*0.4)); for (const k in v) back[k] = (back[k] || 0) + v[k]; } const et = esc.reduce((s0, x) => s0 + armyHP(x), 0) || 1; for (const e of esc) hurt(e, back, 1/et);
      dealt = Math.round(h0 - rp.raiders.reduce((s0, x) => s0 + effHP(x), 0)); lost = u0 - rp.raiders.reduce((s0, x) => s0 + count(x), 0); }
    return {z, x:rp.x, y:rp.y, saved, by:rp.lead, air:rp.air && !rp.raiders.length, ships:rp.raiders.length > 0, subs:rp.raiders.length > 0 && rp.raiders.every(x => x.u.sub && x.u.sub === shipsN(x)), esc, dealt, lost}; }
  return null; }
// a raid that sinks a convoy with warships takes TR_CAP[0]..TR_CAP[1] of its cargo (the day's money both ways and both partners' goods) to the
// raiding power; goods only up to its storage. Aircraft sink convoys but capture nothing. Returns {f, cash, <good>: amount}
const TR_CAP = [0.25, 0.5];
function trCapture(r, n){ const c = TR_CAP[0] + (TR_CAP[1] - TR_CAP[0])*rng(), N = S.nations[n], cap = stockCap(n), got = {f:c, cash:Math.round(((r.va ? r.va.cash : 0) + (r.vb ? r.vb.cash : 0))*c*10)/10};
  N.cash += got.cash;
  for (const v of [r.va, r.vb]){ if (!v || !v.q) continue; const q = Math.round(v.q/RES_K*c*10)*(RES_K/10), take = Math.min(q, Math.max(0, cap - (N[v.k] || 0))); if (take > 0){ N[v.k] = (N[v.k] || 0) + take; got[v.k] = Math.round(((got[v.k] || 0) + take)/RES_K*10)*(RES_K/10); } }   // (a tenth of RES_K)
  return got; }
const capText = g => [g.cash ? `$${fmt1(g.cash)}M` : '', ...TR_GOODS.filter(k => g[k]).map(k => resFull(k, Math.round(g[k])))].filter(Boolean).join(' and ') || 'nothing';
// daily settlement: the day's blockade average, the convoy's run, then new routes and values
function tradeDay(){ const T = trS(); seaIndex(); let news = 0;
  for (const k in T.hit) T.hit[k] = Math.round(T.hit[k]*0.7*100)/100;
  for (const k in T.air) if (S.hour - T.air[k].h >= 24) delete T.air[k];
  for (const r of T.routes){ const live = trStatus(r); r.f = S.hour - r.raid < 24 ? 0 : (r.accN ? Math.round(r.acc/r.accN*100)/100 : live); r.acc = 0; r.accN = 0;
    if (r.f <= 0 || r.kind !== 'sea' || r.pause != null) continue;
    const R = trRaid(r); if (!R) continue; const mine = [r.a, r.b].filter(isSeat), who = R.by >= 0 ? nationName(R.by) : 'Enemy', how = R.air ? 'aircraft' : R.subs ? 'submarines' : 'warships', cn = `${S.nations[r.a].name}–${trName(r, r.a)}`;
    if (R.saved){ r.esc = (r.esc || 0) + 1;
      for (const me of mine) tell(me, `Escorts beat off ${artA(who)} raid on your ${trName(r, me)} convoy in ${G.P[R.z].name}${R.dealt > 0 ? `: raiders took ${R.dealt} damage${R.lost ? `, ${R.lost} sunk` : ''}` : ''}. Trade income kept.`, 'good', R.z);
      if (isSeat(R.by)) tell(R.by, `The ${cn} convoy in ${G.P[R.z].name} was escorted: your raiders were driven off${R.dealt > 0 ? ` (${R.dealt} damage taken)` : ''}.`, 'bad', R.z);
      continue; }
    r.raid = S.hour; r.raidZ = R.z; r.f = 0; r.why = 'sunk'; r.sunk = (r.sunk || 0) + 1; T.ver = (T.ver || 0) + 1;
    for (const n of [r.a, r.b]) if (n >= 0) T.hit[n] = (T.hit[n] || 0) + 1;
    if (R.by >= 0) for (const me of seats()) bump(me, R.by === me ? 'convoysSunk' : 'tradeHits');
    const cap = R.ships && R.by >= 0 && S.nations[R.by] && S.nations[R.by].alive ? trCapture(r, R.by) : null; R.cap = cap; if (cap) r.capt = Math.round(((r.capt || 0) + cap.cash)*10)/10;
    IM.emit('fxRaid', R);
    for (const me of mine) tell(me, `${who} ${how} sank your convoy on the ${trName(r, me)} trade route in ${G.P[R.z].name}: $${fmt1((pv => pv ? pv.cash : 0)(trSide(r, me)))}M of trade income lost today${cap ? `, and ${who} captured ${capText(cap)} of its cargo` : ''}. Escort the route (select a fleet: Escort), or pause it in Diplomacy.`, 'bad', R.z);
    if (isSeat(R.by)) tell(R.by, cap ? `Your ${how} raided the ${cn} convoy in ${G.P[R.z].name}: captured ${capText(cap)} (${Math.round(cap.f*100)}% of its cargo).` : `Your ${how} sank ${artA(S.nations[r.a].name)}–${trName(r, r.a)} convoy in ${G.P[R.z].name}.`, 'good', R.z);
    if (!mine.length && !isSeat(R.by) && news < 2 && rng() < 0.5){ news++; tellAll(`${who} ${how} sank ${artA(S.nations[r.a].name)}–${trName(r, r.a)} convoy in ${G.P[R.z].name}.`, '', R.z); } }
  tradeGen();
  INCC.v = -1; }
// keep valid routes, re-lay those whose port changed hands, fill free slots by economy and distance
function tradeGen(){ const T = trS(); NEUP = null;
  T.routes = T.routes.filter(r => { const why = trInvalid(r); if (!why && (trPortsOk(r) || trPlace(r))) return true; trEnded(r, why || (r.kind === 'land' ? 'border' : 'port')); return false; });
  const live = S.nations.filter(N => N.alive && S.owner[N.capital] === N.id).map(N => N.id), gdp = {}; for (const n of live) gdp[n] = trGdp(n);
  const used = new Set(T.routes.map(r => r.key)), cnt = {}; for (const n of live) cnt[n] = {sea:0, land:0, neu:0};
  for (const r of T.routes){ const k = r.b === NEUTRAL ? 'neu' : r.kind; if (cnt[r.a]) cnt[r.a][k]++; if (r.b >= 0 && cnt[r.b]) cnt[r.b][k]++; }
  const seaSlots = n => 2 + (gdp[n] > 300 ? 1 : 0) + (gdp[n] > 450 ? 1 : 0), neuSlots = n => 1 + (gdp[n] > 350 ? 1 : 0);
  const C = n => G.P[S.nations[n].capital];
  // opinions are costly: checked lazily, once per pair, only for the pairs a pass actually considers
  const likes = (a, b) => (isSeat(a) ? true : opinion(a, b) > -40) && (isSeat(b) ? true : opinion(b, a) > -40), okq = q => q.ok ?? (q.ok = likes(q.a, q.b));
  const pairs = []; for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++){ const a = live[i], b = live[j], key = trKey(a, b);
    if (used.has(key) || T.closed[key]) continue; const d = hexDist(C(a).cc, C(b).cc); pairs.push({a, b, key, sc:Math.sqrt(gdp[a]*gdp[b])/(1 + d/60)*(T.want[key] ? 100 : 1), land:borders(a, b)}); }
  pairs.sort((x, y) => y.sc - x.sc);
  // one land route per power with a neighbour, then player-requested routes and sea routes by score
  for (const q of pairs){ if (used.has(q.key) || !q.land || T.want[q.key] || cnt[q.a].land >= 1 || cnt[q.b].land >= 1 || !okq(q)) continue; const r = trMake(q.a, q.b, 'land'); if (r){ used.add(q.key); cnt[q.a].land++; cnt[q.b].land++; } }
  for (const q of pairs){ if (used.has(q.key)) continue; const want = T.want[q.key];
    if (!want && (cnt[q.a].sea >= seaSlots(q.a) || cnt[q.b].sea >= seaSlots(q.b))) continue;
    if (want && (cnt[q.a].sea + cnt[q.a].land >= seaSlots(q.a) + 3 || cnt[q.b].sea + cnt[q.b].land >= seaSlots(q.b) + 3)) continue;
    if (!okq(q)) continue; let r = null; if (want && q.land && T.want[q.key] === 'land') r = trMake(q.a, q.b, 'land'); if (!r) r = trMake(q.a, q.b, 'sea'); if (!r && want && q.land) r = trMake(q.a, q.b, 'land');
    if (r){ used.add(q.key); cnt[q.a][r.kind]++; cnt[q.b][r.kind]++; } }
  // independent partners: the biggest economies with a free port in reach
  const NP = neuPorts();
  const SC = seaComp(), wet = list => { const o = new Set(); for (const p of list) for (const v of G.P[p].nbs) if (G.P[v].sea) o.add(SC[v]); return o; }, NW = new Map([...NP].map(([nc, ps]) => [nc, wet(ps)]));
  for (const n of live){ let tries = 0; const mw = wet(natPorts(n)); while (cnt[n].neu < neuSlots(n) && tries++ < 4){ let best = null, bs = 0;
      for (const [nc, ports] of NP){ const key = trKey(n, NEUTRAL, nc); if (used.has(key) || T.closed[key] || ![...NW.get(nc)].some(c => mw.has(c))) continue; const d = hexDist(C(n).cc, G.P[ports[0]].cc), sc = neuGdp(nc)/(1 + d/60)*(T.want[key] ? 100 : 1); if (sc > bs){ bs = sc; best = nc; } }
      if (best == null) break; const r = trMake(n, NEUTRAL, 'sea', best); used.add(trKey(n, NEUTRAL, best)); if (r) cnt[n].neu++; } }
  // every power trades by sea: one with no sea route yet takes its best partner even past that partner's slots, else the nearest independent port
  for (const n of live){ if (cnt[n].sea + cnt[n].neu > 0) continue; let ok = false;
    for (const q of pairs){ if (ok) break; if (used.has(q.key) || (q.a !== n && q.b !== n)) continue; const o = q.a === n ? q.b : q.a; if (cnt[o].sea >= seaSlots(o) + 1 || !okq(q)) continue; const r = trMake(q.a, q.b, 'sea'); if (r){ used.add(q.key); cnt[q.a].sea++; cnt[q.b].sea++; ok = true; } }
    if (!ok){ const d0 = nc => hexDist(C(n).cc, G.P[NP.get(nc)[0]].cc), ncs = [...NP.keys()].filter(nc => !used.has(trKey(n, NEUTRAL, nc)) && !T.closed[trKey(n, NEUTRAL, nc)]).sort((x, y) => d0(x) - d0(y));
      for (const nc of ncs.slice(0, 10)){ const r = trMake(n, NEUTRAL, 'sea', nc); used.add(trKey(n, NEUTRAL, nc)); if (r){ cnt[n].neu++; break; } } } }
  for (const r of T.routes) trValue(r);
  T.ver = (T.ver || 0) + 1; }
// nation n opens a route with nation b (or with the unaligned country nc), or closes its route id
function tradeOpen(n, b, nc = null, kind = null){ const T = trS(), key = trKey(n, b, nc); delete T.closed[key]; T.want[key] = kind || 1;
  if (T.routes.some(r => r.key === key)) return true;
  if (b >= 0){ if (atWar(n, b)) return 'you are at war'; if (embargoed(n, b)) return 'an embargo is in force'; if (opinion(b, n) < -30) return `${S.nations[b].name} refuses: opinion too low`; }
  const r = trMake(n, b, kind === 'land' ? 'land' : 'sea', nc) || (b >= 0 && borders(n, b) ? trMake(n, b, 'land') : null);
  if (!r) return 'no route can be laid: no port or sea path';
  trValue(r); INCC.v = -1; tell(n, `Trade route opened with ${trName(r, n)}: +$${fmt1(r.va.cash)}M and ${fmt(r.va.q)} ${rlbl(r.va.k)} a day while it runs.`, 'good', r.path[Math.floor(r.path.length/2)]); return true; }
function tradeClose(n, id){ const T = trS(), r = routeById(id); if (!r || !trMine(r, n)) return; T.closed[r.key] = 1; delete T.want[r.key]; T.routes = T.routes.filter(x => x !== r); trEnded(r, 'closed'); INCC.v = -1;
  { const o = trOther(r, n); if (o >= 0) addMem(o, n, -4); } tell(n, `You closed the ${trName(r, n)} trade route.`, 'info', null); }
// escorts: fleets ordered to escort a route sail to its most threatened zone (else its middle) and guard it
function escortHour(){ for (const a of S.armies){ if (a.escort == null) continue; const r = routeById(a.escort);
    if (!r || !shipsOnly(a) || !count(a) || r.kind !== 'sea'){ if (isSeat(a.owner) && count(a)) tell(a.owner, `${armyName(a)} stopped escorting: the trade route is gone.`, 'info', a.at); delete a.escort; continue; }
    if (a.to !== null || a.path.length || a.sail || S.battles.includes(a.at)) continue;
    let tgt = r.path[Math.floor(r.path.length/2)], bt = 0; const seen = isSeat(a.owner) ? visibleSet(a.owner) : null;   // a seat's escorts go by what the seat can see
    for (const z of r.path){ let t = 0; for (const v of [z, ...G.P[z].nbs]) for (const x of SEAA.get(v) || []) if (trHostile(r, x.owner) && (!seen || armyVisible(x, seen))) t += navPw(x)*(v === z ? 1 : 0.5); if (r.raidZ === z && S.hour - r.raid < 72) t += 4; if (t > bt){ bt = t; tgt = z; } }
    if (a.at !== tgt && !(bt === 0 && r.path.includes(a.at))){ const p = pathFor(a, a.at, tgt); if (p.length) a.path = p; } } }
/* ---- trade UI: the Diplomacy trade-route list, the fleet's Escort / Raid / Blockade orders, tooltips ---- */
const TR_MAX = 8;   // routes the player can run at once
// the escort note shows in every state, so a fleet sent to a raided or blockaded route is visible at once
function trStateText(r, me = -1){ const st = trState0(r, me), esc = S.armies.filter(a => a.escort === r.id && count(a));
  if (!esc.length || st[0] === 'ok') return st; return [st[0], `${st[1]} · escorted by ${esc.map(armyName).join(', ')}`]; }
function trState0(r, me = -1){ const zn = z => z >= 0 ? (G.P[z].sea ? G.P[z].name : pName(z)) : '', who = r.by >= 0 ? nationName(r.by) : 'enemy', at = () => trBlkPlace(r);
  if (r.why === 'paused') return ['warn', r.pause === me ? 'Paused by you: no convoys sail, nothing can be lost, no income' : `Paused by ${nationName(r.pause)}: no convoys, no income`];
  if (r.why === 'sunk') return ['bad', `Convoy sunk in ${zn(r.raidZ)}: no income today`];
  if (r.why === 'blockade') return ['bad', `Cut: ${who} warships blockade ${at()}, no way around: no income`];
  if (r.why === 'port') return ['bad', `Port blockaded: ${who} warships close ${at()}: no income`];
  if (r.why === 'rerouted') return ['warn', `Rerouted around ${who}'s blockade at ${at()}: +${fmt(r.dk || 0)} km, ${Math.round(r.f0*100)}% income`];
  if (r.why === 'contested' && r.bk >= 0) return ['warn', `Running ${who}'s blockade at ${at()} under your warships' guns: ${Math.round(r.f0*100)}% income`];
  if (r.why === 'contested') return ['warn', `Contested in ${zn(r.bz)} by ${who} patrol aircraft: ${Math.round(r.f0*100)}% income`];
  if (r.why === 'cut' && r.bz < 0) return ['bad', 'Suspended: you are at war with them'];
  if (r.why === 'cut') return ['bad', `Cut at ${zn(r.bz)}${r.by >= 0 ? ` by ${nationName(r.by)}` : ''}: no income`];
  if (r.why === 'damaged') return ['warn', `Road damaged at ${zn(r.bz)}: 60% income`];
  const esc = S.armies.filter(a => a.escort === r.id && count(a)); return ['ok', esc.length ? `Open · escorted by ${esc.map(armyName).join(', ')}` : r.sunk ? `Open · ${r.sunk} convoy${r.sunk > 1 ? 's' : ''} lost so far` : 'Open'];
}
// the chance the next convoy is attacked (escorts can still save it)
function trRisk(r){ if (r.kind !== 'sea' || !SEAA) return 0; let R = 0; for (const rp of trRaidMap(r).values()) R = Math.max(R, 1 - Math.exp(-rp.R/TR_RAID_K)); return R; }
// the three fleet orders exclude each other: Escort (one of its own routes), Raid (an enemy route), Blockade (where it stands)
function escortSet(a, id){ if (!a || !shipsOnly(a)) return; if (id == null){ if (a.escort != null) tell(a.owner, `${armyName(a)} stops escorting.`, 'info', a.at); delete a.escort; return; }
  const r = routeById(id); if (!r) return; a.escort = r.id; delete a.raid; delete a.blk; if (a.sail){ a.pos = sailXY(a); delete a.sail; } a.path = []; seaIndex(); escortHour(); trRefresh(); tell(a.owner, `${armyName(a)} will escort the ${trName(r, a.owner)} trade route${a.path.length ? ` (about ${etaHours(a)} h to station)` : ''}.`, 'good', a.at); }
// the point of a route's track in zone z nearest that zone's centre (where a raider waits), else null
function trSpot(r, z){ const D = trDetour(r); if (!D) return null; const t = D.track, P = G.P[z]; let best = null, bd = Infinity;
  for (let i = 0; i < t.cells.length; i++){ if (G.prov[t.cells[i]] !== z) continue; const d = Math.hypot(t.pts[i][0] - P.x, t.pts[i][1] - P.y); if (d < bd){ bd = d; best = {x:t.pts[i][0], y:t.pts[i][1]}; } } return best; }
// send fleet a to wait at spot (x, y) of zone z: sail there through the zones, or across its own zone (a pinpoint move, rules/movement.js orderMove)
function fleetGo(a, z, x, y){ const from = a.to ?? a.at; if (z !== from && !pathFor(a, from, z).length){ if (a.sail){ a.pos = sailXY(a); delete a.sail; } return false; }
  orderMove(a, z, [x, y]); if (a.path.length || a.to !== null) a.forced = true; return true; }
// the enemy (hostile) sea routes fleet a could raid, nearest first: [{r, d (km to its track)}]
function raidTargets(a){ const [x, y] = armyXY(a), out = []; if (!S.trade) return out;
  for (const r of S.trade.routes){ if (r.kind !== 'sea' || !trHostile(r, a.owner)) continue; const D = trDetour(r); if (!D) continue; out.push({r, d:trNear(D.track, x, y).d}); }
  return out.sort((p, q) => p.d - q.d || p.r.id - q.r.id); }
// Raid: the fleet sails to the nearest point of an enemy route's track and attacks every convoy passing within its reach at full strength
// (warships at war that were not ordered to raid strike at TR_OPP). null ends the order.
function raidSet(a, id){ if (!a || !shipsOnly(a)) return false;
  if (id == null){ if (a.raid) tell(a.owner, `${armyName(a)} stops raiding.`, 'info', a.at); delete a.raid; trRefresh(); return true; }
  const r = routeById(id); if (!r || r.kind !== 'sea' || !trHostile(r, a.owner) || !fleetKm(a)) return false; const D = trDetour(r); if (!D) return false;
  const [x0, y0] = armyXY(a), nr = trNear(D.track, x0, y0), z = G.prov[D.track.cells[nr.i]]; if (!fleetGo(a, z, nr.x, nr.y)) return false;
  delete a.escort; delete a.blk; a.raid = {r:r.id, z, t:S.hour}; trRefresh();
  tell(a.owner, `${armyName(a)} will raid the ${S.nations[r.a].name}–${trName(r, r.a)} convoys${a.path.length || a.sail ? ` (about ${a.sail ? sailHours(a) : etaHours(a)} h to the lane)` : ''}: it attacks any convoy passing within ${fleetKm(a)} km and captures 25–50% of a sunk convoy's cargo.`, 'good', z);
  return true; }
// Blockade: the fleet stops the convoys of the powers it is at war with within its reach (BLOCKADE_KM) of where it stands; ordered on the move,
// it starts once the fleet stands at sea. Off removes it.
function blockadeSet(a, on){ if (!a || !shipsOnly(a) || a.air || a.fly) return false;
  if (!on){ if (a.blk) tell(a.owner, `${armyName(a)} lifts its blockade.`, 'info', a.at); delete a.blk; trRefresh(); return true; }
  const km = fleetKm(a); if (!km) return false; a.blk = {t:S.hour}; delete a.escort; delete a.raid; trRefresh();
  const [x, y] = armyXY(a), ch = chokeAt(x, y, km), q = ch ? chokeByKey(ch) : null, here = q ? q.name : G.P[a.at].name, st = a.to === null && !a.sail && !a.path.length && G.P[a.at].sea;
  tell(a.owner, `${armyName(a)} ${st ? 'blockades' : 'will blockade'} ${here}${st ? '' : ' once it stands at sea'}: enemy convoys within ${km} km must sail around it, or their route is cut.`, 'good', a.at);
  return true; }
// a partner pauses its route (no convoys: nothing to lose, nothing earned) or resumes it (only the power that paused it)
function tradePause(n, id, on){ const r = routeById(id); if (!r || !trMine(r, n)) return false;
  if (on){ if (r.pause != null) return r.pause === n; r.pause = n; } else { if (r.pause !== n) return false; delete r.pause; }
  trStatus(r); S.trade.ver = (S.trade.ver || 0) + 1; INCC.v = -1; const o = trOther(r, n);
  tell(n, on ? `You paused the ${trName(r, n)} trade route: no convoys sail, so none can be lost, and it earns nothing until you resume it.` : `You resumed the ${trName(r, n)} trade route: convoys sail again.`, 'info', null);
  if (o >= 0) tell(o, `${S.nations[n].name} ${on ? 'paused' : 'resumed'} the ${trName(r, o)} trade route${on ? ': no convoys and no income from it until they resume it' : ''}.`, 'info', null);
  return true; }
