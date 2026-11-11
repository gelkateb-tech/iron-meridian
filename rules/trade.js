// Iron Meridian rules: trade. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
/* ---------------- V3 trade routes, blockades, convoy raids and escorts ----------------
   Powers that are not at war trade along routes: mostly sea lanes from port to port through the sea zones (the major shipping lanes are
   preferred), plus land routes between neighbours along their roads, and routes with independent countries' ports. Every route pays both
   partners each day: money (TR_K·√(economy × economy), more for long hauls, less by land) and a little of what the partner produces most.
   Routes form automatically from economy and distance: 2–4 sea routes per power, one land route and one or two independent partners. A power
   with no port of its own ships through the nearest allied, passage-partner or independent port, so every power depends on the sea.
   The player opens and closes routes in Diplomacy (a closed pair stays closed until reopened).
   Blockade: enemy surface warships (frigates, cruisers, carriers) holding a sea zone of a route, or blockading one of its ports, stop its income;
   friendly warships in the same zone contest it (half income). Hunting enemy maritime patrol aircraft over a zone halve it.
   Raids: once a day the convoy runs the gauntlet: hostile submarines (most dangerous), warships, and patrol or strike aircraft that hit
   the route's sea zones within the last day may sink it (that day's income lost for both partners). Friendly warships on or next to the
   route, and fleets ordered to escort it, cut the odds and fight the raiders. The AI raids its enemies' trade and escorts its own. */
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
    for (const [v, w] of G.P[u].nb){ if (!G.P[v].sea) continue; const nd = du + w*(isLane(u, v) ? 0.55 : 1); if (nd < (d.has(v) ? d.get(v) : 1e18)){ d.set(v, nd); prev.set(v, u); push(nd, v); } } }
  let out = null; if (za === zb) out = [za]; else if (prev.has(zb)){ out = []; for (let v = zb; v !== za; v = prev.get(v)) out.push(v); out.push(za); out.reverse(); }
  TRPC.m.set(key, out); return out; }
// connected bodies of water (the world ocean, the Caspian, big lakes): component id per sea zone, and sizes
var SEACMP = {G:null, c:null}, SCN_SZ = [];
function seaComp(){ if (SEACMP.G === G) return SEACMP.c; const c = new Int32Array(G.P.length).fill(-1); SCN_SZ = []; let k = 0;
  for (const P of G.P){ if (!P.sea || c[P.id] >= 0) continue; const q = [P.id]; c[P.id] = k; for (let i = 0; i < q.length; i++) for (const v of G.P[q[i]].nbs) if (G.P[v].sea && c[v] < 0){ c[v] = k; q.push(v); } SCN_SZ.push(q.length); k++; }
  SEACMP = {G, c}; return c; }
const seaNb = (p, toward) => { let best = -1, bd = 1e18; const T = G.P[toward]; for (const v of G.P[p].nbs){ if (!G.P[v].sea) continue; const d = Math.hypot(G.P[v].x - T.x, G.P[v].y - T.y); if (d < bd){ bd = d; best = v; } } return best; };
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
// (by value: a unit of rare materials or electronics weighs more than one of iron); a neutral partner ships 1.5 of its typical good (half that of rare materials)
const TR_GOODS = ['oil', 'metal', 'iron', 'elec', 'rare'], TR_W = {oil:1, metal:1, iron:1, elec:1.6, rare:2.4};
function trGoods(n){ const i = income(n); let k = 'metal', bv = -1e9; for (const q of TR_GOODS){ const v = (i.net[q] + i.gross[q]*0.3)*TR_W[q]; if (v > bv){ bv = v; k = q; } } return [k, Math.max(0.5, Math.min(4, Math.round(i.gross[k]*0.04*10)/10))]; }
function trValue(r){ const ga = trGdp(r.a), gb = r.b >= 0 ? trGdp(r.b) : neuGdp(r.nc);
  const base = TR_K*Math.sqrt(ga*gb)*(r.kind === 'land' ? TR_LAND : 0.9 + 0.25*Math.min(1, (r.len || 1)/40))*(r.b === NEUTRAL ? TR_NEU : 1)*(has(r.a, 'eco1') ? 1.1 : 1);
  const ka = r.b >= 0 ? trGoods(r.b) : (g => [g, g === 'rare' ? 0.8 : 1.5])(neuGood(r.nc));
  r.va = {cash:Math.round(base*10)/10, k:ka[0], q:ka[1]};
  if (r.b >= 0){ const kb = trGoods(r.a); r.vb = {cash:Math.round(base*(has(r.b, 'eco1') ? 1.1 : 1)/(has(r.a, 'eco1') ? 1.1 : 1)*10)/10, k:kb[0], q:kb[1]}; } else r.vb = null; }
const trSide = (r, n) => r.a === n ? r.va : r.b === n ? r.vb : null;
// a nation's trade income today: each route's value times its status factor (blockade, sunk convoy)
function tradeIncome(n){ const o = {cash:0, oil:0, metal:0, iron:0, elec:0, rare:0, n:0, cut:0}; if (!S.trade) return o;
  for (const r of S.trade.routes){ if (!trMine(r, n)) continue; const v = trSide(r, n); if (!v) continue; o.n++; if (r.f < 1) o.cut++; o.cash += v.cash*r.f; if (o[v.k] != null) o[v.k] += v.q*r.f; }
  return o; }
// which armies stand in each sea zone (for blockades, raids and escorts), rebuilt with the blockade
var SEAA = new Map();
function seaIndex(){ SEAA = new Map(); for (const a of S.armies){ if (a.to !== null || a.air || a.fly || !G.P[a.at].sea || !shipsN(a) || a.owner < 0) continue; if (!SEAA.has(a.at)) SEAA.set(a.at, []); SEAA.get(a.at).push(a); }
  const mpa = new Map(); for (const a of S.armies){ const f = a.fly; if (!f || f.kind !== 'hunt' || f.ph !== 'over' || !count(a)) continue; for (const z of [f.tgt, ...G.P[f.tgt].nbs]) if (G.P[z].sea){ if (!mpa.has(z)) mpa.set(z, []); mpa.get(z).push(a); } }
  SEAA.mpa = mpa; const land = new Map(); for (const a of S.armies){ if (a.to !== null || a.air || a.fly || a.owner < 0 || G.P[a.at].sea || !count(a)) continue; if (!land.has(a.at)) land.set(a.at, []); land.get(a.at).push(a); } SEAA.land = land; }
const surfPw = a => TR_SURF.reduce((s0, t) => s0 + (a.u[t] ? a.u[t]*unitPw(a.owner, t) : 0), 0);
const navPw = a => NAVAL_T.reduce((s0, t) => s0 + (a.u[t] ? a.u[t]*unitPw(a.owner, t) : 0), 0);
// live status of a route: income factor, why, who and where it is blocked
function trStatus(r){ let f = 1, why = '', by = -1, bz = -1;
  if (r.b >= 0 && atWar(r.a, r.b)){ r.f = r.f0 = 0; r.why = 'cut'; r.by = -1; r.bz = -1; return 0; }   // war broke out: the route closes at dawn
  if (r.kind === 'land'){
    for (const v of r.path){ const o = S.owner[v];
      if (o !== r.a && o !== r.b){ f = 0; why = 'cut'; by = o; bz = v; break; }
      const foe = ((SEAA.land && SEAA.land.get(v)) || []).find(x => trHostile(r, x.owner)); if (foe){ f = 0; why = 'cut'; by = foe.owner; bz = v; break; } }
    if (f > 0) for (let i = 1; i < r.path.length; i++){ const lk = linkOf(r.path[i - 1], r.path[i]); if (lk && lk.dmg > 0){ f = Math.min(f, 0.6); why = why || 'damaged'; bz = r.path[i]; } }
  } else {
    const zoneF = z => { let H = 0, F = 0, ho = -1; for (const x of SEAA.get(z) || []){ if (trHostile(r, x.owner)){ const s = surfPw(x); if (s > H){ H = s; ho = x.owner; } } else if (trFriend(r, x.owner)) F += navPw(x); }
      let zf = 1; if (H > 0) zf = F >= H*0.5 ? 0.5 : 0;
      const m = (SEAA.mpa && SEAA.mpa.get(z)) || []; const ma = m.find(x => trHostile(r, x.owner)); if (ma && zf > 0.5){ zf = F > 0 ? 0.75 : 0.5; if (ho < 0) ho = ma.owner; }
      return [zf, ho]; };
    for (const z of r.path){ const [zf, ho] = zoneF(z); if (zf < f){ f = zf; by = ho; bz = z; why = zf === 0 ? 'blockade' : 'contested'; } }
    for (const [p, n] of [[r.pa, r.a], [r.pb, r.b]]){ if (!BLOCK.has(p)) continue; const o = S.owner[p]; let fr = 0, foe = -1;
      for (const z of G.P[p].nbs){ if (!G.P[z].sea) continue; for (const x of SEAA.get(z) || []){ if (trFriend(r, x.owner)) fr += navPw(x); else if (atWar(x.owner, o) && foe < 0) foe = x.owner; } }
      const pf = fr > 0 ? 0.5 : 0; if (pf < f){ f = pf; why = 'port'; by = foe; bz = p; } void n; } }
  if (S.hour - r.raid < 24){ r.f = 0; r.why = 'sunk'; } else { r.f = f; r.why = why; }
  r.f0 = f; r.by = by; r.bz = bz; return f; }
// every blockade pass (6 h): refresh the sea index and every route's status; the day's average sets the day's income
var trLastH = -1;
function tradeBlockade(){ if (!S.trade) return; seaIndex(); const dt = trLastH >= 0 ? Math.max(1, Math.min(24, S.hour - trLastH)) : 6; trLastH = S.hour; let ch = false;
  for (const r of S.trade.routes){ const f0 = r.f, w0 = r.why; const f = trStatus(r); r.acc = (r.acc || 0) + f*dt; r.accN = (r.accN || 0) + dt; if (r.f !== f0 || r.why !== w0) ch = true; }
  if (ch) S.trade.ver = (S.trade.ver || 0) + 1; }
// escort strength protecting a route at zone z: friendly warships there and next to it, and every fleet escorting this route on or next to it
function escortsAt(r, z){ const out = new Set(); for (const v of [z, ...G.P[z].nbs]){ if (!G.P[v].sea) continue; for (const x of SEAA.get(v) || []) if (trFriend(r, x.owner) && navPw(x) > 0) out.add(x); }
  for (const x of S.armies) if (x.escort === r.id && x.to === null && G.P[x.at].sea && (x.at === z || r.path.includes(x.at) || r.path.some(v => G.P[v].nb.has(x.at)))) out.add(x);
  return [...out]; }
// a hostile air attack on a sea zone (maritime patrol hunt, strike or bomber raid) also threatens convoys there for a day
function tradeAirRaid(o, z, pw){ if (!S.trade || o < 0 || !G.P[z].sea) return; S.trade.air[z] = {o, h:S.hour, pw:Math.max(6, pw)}; }
function trRaidPower(r, z){ let R = 0; const raiders = []; let lead = -1, lw = 0;
  for (const v of [z, ...G.P[z].nbs]){ if (!G.P[v].sea) continue; const adj = v !== z;
    for (const x of SEAA.get(v) || []){ if (!trHostile(r, x.owner)) continue; let w = 0; for (const t of NAVAL_T){ if (!x.u[t]) continue; w += x.u[t]*unitPw(x.owner, t)*(t === 'sub' ? (adj ? 0.6 : 1.3) : (adj ? 0.25 : 0.8)); }
      if (w > 0){ R += w; raiders.push(x); if (w > lw){ lw = w; lead = x.owner; } } } }
  const A = S.trade.air[z]; if (A && S.hour - A.h < 24 && trHostile(r, A.o)){ R += A.pw; if (A.pw > lw){ lw = A.pw; lead = A.o; } }
  return {R, raiders, lead, air:!!(A && S.hour - A.h < 24 && trHostile(r, A.o))}; }
// the daily convoy: the route's sea zones in order; the first raid that is attempted decides it (escorts may beat it off)
function trRaid(r){ if (r.kind !== 'sea' || r.f <= 0) return null;
  for (const z of r.path){ const rp = trRaidPower(r, z); if (rp.R <= 0) continue; const pA = 1 - Math.exp(-rp.R/TR_RAID_K); if (rng() >= pA) continue;
    const esc = escortsAt(r, z), E = esc.reduce((s0, x) => s0 + navPw(x)*(x.u.frig ? 1.25 : 1), 0), pSave = E > 0 ? 1.3*E/(1.3*E + rp.R) : 0, saved = rng() < pSave;
    let dealt = 0, lost = 0;
    if (E > 0 && rp.raiders.length){ const h0 = rp.raiders.reduce((s0, x) => s0 + effHP(x), 0), u0 = rp.raiders.reduce((s0, x) => s0 + count(x), 0), tot = rp.raiders.reduce((s0, x) => s0 + armyHP(x), 0) || 1;
      const av = {}; for (const e of esc){ const v = sideAV([e], e.owner, (saved ? 3 : 1.6)*(0.8 + rng()*0.4)); for (const k in v) av[k] = (av[k] || 0) + v[k]; } for (const x of rp.raiders) hurt(x, av, 1/tot);
      const back = {}; for (const x of rp.raiders){ const v = sideAV([x], x.owner, 0.8*(0.8 + rng()*0.4)); for (const k in v) back[k] = (back[k] || 0) + v[k]; } const et = esc.reduce((s0, x) => s0 + armyHP(x), 0) || 1; for (const e of esc) hurt(e, back, 1/et);
      dealt = Math.round(h0 - rp.raiders.reduce((s0, x) => s0 + effHP(x), 0)); lost = u0 - rp.raiders.reduce((s0, x) => s0 + count(x), 0); }
    return {z, saved, by:rp.lead, air:rp.air && !rp.raiders.length, subs:rp.raiders.length > 0 && rp.raiders.every(x => x.u.sub && x.u.sub === shipsN(x)), esc, dealt, lost}; }
  return null; }
// daily settlement: the day's blockade average, the convoy's run, then new routes and values
function tradeDay(){ const T = trS(); seaIndex(); let news = 0;
  for (const k in T.hit) T.hit[k] = Math.round(T.hit[k]*0.7*100)/100;
  for (const k in T.air) if (S.hour - T.air[k].h >= 24) delete T.air[k];
  for (const r of T.routes){ const live = trStatus(r); r.f = S.hour - r.raid < 24 ? 0 : (r.accN ? Math.round(r.acc/r.accN*100)/100 : live); r.acc = 0; r.accN = 0;
    if (r.f <= 0 || r.kind !== 'sea') continue;
    const R = trRaid(r); if (!R) continue; const mine = [r.a, r.b].filter(isSeat), who = R.by >= 0 ? nationName(R.by) : 'Enemy', how = R.air ? 'aircraft' : R.subs ? 'submarines' : 'warships';
    if (R.saved){ r.esc = (r.esc || 0) + 1;
      for (const me of mine) tell(me, `Escorts beat off ${artA(who)} raid on your ${trName(r, me)} convoy in ${G.P[R.z].name}${R.dealt > 0 ? `: raiders took ${R.dealt} damage${R.lost ? `, ${R.lost} sunk` : ''}` : ''}. Trade income kept.`, 'good', R.z);
      if (isSeat(R.by)) tell(R.by, `The ${S.nations[r.a].name}–${trName(r, r.a)} convoy in ${G.P[R.z].name} was escorted: your raiders were driven off${R.dealt > 0 ? ` (${R.dealt} damage taken)` : ''}.`, 'bad', R.z);
      continue; }
    r.raid = S.hour; r.raidZ = R.z; r.f = 0; r.why = 'sunk'; r.sunk = (r.sunk || 0) + 1; T.ver = (T.ver || 0) + 1;
    for (const n of [r.a, r.b]) if (n >= 0) T.hit[n] = (T.hit[n] || 0) + 1;
    if (R.by >= 0) for (const me of seats()) bump(me, R.by === me ? 'convoysSunk' : 'tradeHits');
    IM.emit('fxRaid', R);
    for (const me of mine) tell(me, `${who} ${how} sank your convoy on the ${trName(r, me)} trade route in ${G.P[R.z].name}: $${fmt1((pv => pv ? pv.cash : 0)(trSide(r, me)))}M of trade income lost today. Escort the route (select a fleet: Escort route).`, 'bad', R.z);
    if (isSeat(R.by)) tell(R.by, `Your ${how} sank ${artA(S.nations[r.a].name)}–${trName(r, r.a)} convoy in ${G.P[R.z].name}.`, 'good', R.z);
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
  trValue(r); INCC.v = -1; tell(n, `Trade route opened with ${trName(r, n)}: +$${fmt1(r.va.cash)}M and ${r.va.q} ${rlbl(r.va.k)} a day while it runs.`, 'good', r.path[Math.floor(r.path.length/2)]); return true; }
function tradeClose(n, id){ const T = trS(), r = routeById(id); if (!r || !trMine(r, n)) return; T.closed[r.key] = 1; delete T.want[r.key]; T.routes = T.routes.filter(x => x !== r); trEnded(r, 'closed'); INCC.v = -1;
  { const o = trOther(r, n); if (o >= 0) addMem(o, n, -4); } tell(n, `You closed the ${trName(r, n)} trade route.`, 'info', null); }
// escorts: fleets ordered to escort a route sail to its most threatened zone (else its middle) and guard it
function escortHour(){ for (const a of S.armies){ if (a.escort == null) continue; const r = routeById(a.escort);
    if (!r || !shipsOnly(a) || !count(a) || r.kind !== 'sea'){ if (isSeat(a.owner) && count(a)) tell(a.owner, `${armyName(a)} stopped escorting: the trade route is gone.`, 'info', a.at); delete a.escort; continue; }
    if (a.to !== null || a.path.length || S.battles.includes(a.at)) continue;
    let tgt = r.path[Math.floor(r.path.length/2)], bt = 0; const seen = isSeat(a.owner) ? visibleSet(a.owner) : null;   // a seat's escorts go by what the seat can see
    for (const z of r.path){ let t = 0; for (const v of [z, ...G.P[z].nbs]) for (const x of SEAA.get(v) || []) if (trHostile(r, x.owner) && (!seen || armyVisible(x, seen))) t += navPw(x)*(v === z ? 1 : 0.5); if (r.raidZ === z && S.hour - r.raid < 72) t += 4; if (t > bt){ bt = t; tgt = z; } }
    if (a.at !== tgt && !(bt === 0 && r.path.includes(a.at))){ const p = pathFor(a, a.at, tgt); if (p.length) a.path = p; } } }
/* ---- trade UI: the Diplomacy trade-route list, the fleet's escort order, tooltips ---- */
const TR_MAX = 8;   // routes the player can run at once
// the escort note shows in every state, so a fleet sent to a raided or blockaded route is visible at once
function trStateText(r){ const st = trState0(r), esc = S.armies.filter(a => a.escort === r.id && count(a));
  if (!esc.length || st[0] === 'ok') return st; return [st[0], `${st[1]} · escorted by ${esc.map(armyName).join(', ')}`]; }
function trState0(r){ const zn = z => z >= 0 ? (G.P[z].sea ? G.P[z].name : pName(z)) : '';
  if (r.why === 'sunk') return ['bad', `Convoy sunk in ${zn(r.raidZ)}: no income today`];
  if (r.why === 'blockade') return ['bad', `Blockaded by ${r.by >= 0 ? nationName(r.by) : 'enemy'} warships in ${zn(r.bz)}: no income`];
  if (r.why === 'port') return ['bad', `Port of ${zn(r.bz)} blockaded${r.f0 > 0 ? ' (contested: half income)' : ': no income'}`];
  if (r.why === 'contested') return ['warn', `Contested in ${zn(r.bz)} by ${r.by >= 0 ? nationName(r.by) : 'enemy'} ships or patrol aircraft: ${Math.round(r.f0*100)}% income`];
  if (r.why === 'cut' && r.bz < 0) return ['bad', 'Suspended: you are at war with them'];
  if (r.why === 'cut') return ['bad', `Cut at ${zn(r.bz)}${r.by >= 0 ? ` by ${nationName(r.by)}` : ''}: no income`];
  if (r.why === 'damaged') return ['warn', `Road damaged at ${zn(r.bz)}: 60% income`];
  const esc = S.armies.filter(a => a.escort === r.id && count(a)); return ['ok', esc.length ? `Open · escorted by ${esc.map(armyName).join(', ')}` : r.sunk ? `Open · ${r.sunk} convoy${r.sunk > 1 ? 's' : ''} lost so far` : 'Open'];
}
function trRisk(r){ if (r.kind !== 'sea' || !SEAA) return 0; let R = 0; for (const z of r.path){ const rp = trRaidPower(r, z); R = Math.max(R, 1 - Math.exp(-rp.R/TR_RAID_K)); } return R; }
function escortSet(a, id){ if (!a || !shipsOnly(a)) return; if (id == null){ if (a.escort != null) tell(a.owner, `${armyName(a)} stops escorting.`, 'info', a.at); delete a.escort; return; }
  const r = routeById(id); if (!r) return; a.escort = r.id; delete a.raid; a.path = []; seaIndex(); escortHour(); tell(a.owner, `${armyName(a)} will escort the ${trName(r, a.owner)} trade route${a.path.length ? ` (about ${etaHours(a)} h to station)` : ''}.`, 'good', a.at); }
