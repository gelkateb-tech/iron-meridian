// The plan's rule (docs/REBELS-PLAN.md, owner points 8-11), laid over an in-memory copy of the rules for measurement only.
// cfg: km (distance unit), troop ('size' | 'half' | 'minus15' | 'none'), curve ('A' | 'B' | 'C'), annex (cost table), annexAI (stand-in AI habit),
//      noMob (occupied cities cannot mobilize), trade11 ('A' today's loss only | 'B' broken supply chains)
'use strict';
const ANNEX = {A:[[30, 5, 2], [45, 8, 3], [70, 12, 4], [110, 20, 5]], B:[[50, 10, 3], [80, 15, 4], [120, 25, 5], [180, 40, 6]], C:[[90, 15, 4], [140, 25, 5], [210, 40, 6], [320, 60, 7]]};
module.exports = (cfg = {}) => {
  const C = Object.assign({km:1000, troop:'size', curve:'B', annex:'B', annexAI:true, noMob:true, trade11:'A', log:false}, cfg); C.annexT = ANNEX[C.annex];
  const patches = [
    ['const moraleOf = p => Math.max(0, Math.min(100, 100 - unrestOf(p) - dmgOf(p)));', 'const moraleOf = p => morOf(p);'],
    ['const occFactor = p => S.occ && S.occ[p] != null ? Math.min(1, 0.25 + 0.75*(S.hour - S.occ[p])/240) : 1;', 'const occFactor = p => terrF(p);'],
  ];
  if (C.effW) patches.push(['for (const p of ownedBy(n)){ const y = provYield(p); provs++;', 'for (const p of ownedBy(n)){ const y = provYield(p); provs += terrF(p);']);
  const overlay = `
const MC = ${JSON.stringify(C)};
const MOR = {start:70, occ:25, lib:55, home:90, anx:75, occT:60, rural:100, perUnit:5, war:2, warMax:25, foeNb:5, foeHere:1, low:40, lowC:7, lowR:4, hiC:3, hiR:1, capLost:20, cap:25, bunk:[0, 5, 10, 20, 35, 50], shortMax:50, casMax:30, casK:0.5, rebelAt:33, rate:8};
const RBST = {rise:0, riseEmpty:0, riseFight:0, flipped:0, fightsWon:0, fightsLost:0, annexStart:0, annexDone:0, annexLost:0, rolls:0, chanceSum:0, live:new Map(), flipsHome:0, flipsAnx:0, flipsOcc:0};
const morOf = p => { if (!S.mor) return MOR.start; const v = S.mor[p]; return v == null ? MOR.start : v; };
const occSt = p => { const o = S.owner[p]; if (o < 0 || G.P[p].sea) return 'free'; if (S.home[p] === o) return 'home'; if (S.anx && S.anx[p] === o) return 'anx'; return 'occ'; };
const terrF = p => { const s = occSt(p); return s === 'occ' ? 0.25 : s === 'anx' ? 0.5 : 1; };
let LONC = {G:null, a:null}; const lonOf = p => { if (LONC.G !== G) LONC = {G, a:G.P.map(P => ((P.x/WORLD_W*360 + WORLD.lon0) % 360 + 540) % 360 - 180)}; return LONC.a[p]; };
const gcKm = (p, q) => { if (p === q || q == null || q < 0) return 0; const r = Math.PI/180, A = G.P[p], B = G.P[q], la1 = A.lat*r, la2 = B.lat*r, dl = (lonOf(q) - lonOf(p))*r; const h = Math.sin((la2 - la1)/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dl/2)**2; return 2*6371*Math.asin(Math.min(1, Math.sqrt(h))); };
const sizeBand = p => { const pp = popOf(p); return pp >= 20 ? 3 : pp >= 5 ? 2 : pp >= 1.5 ? 1 : 0; };
const rebelSize = p => [3, 4, 5, 6][sizeBand(p)];
const garrisonOf = (p, o) => { let s = 0; for (const a of S.armies) if (a.owner === o && a.at === p && a.to === null && !a.fly && !a.air && !a.rebel) s += groundN(a); return s; };
const rebelsAt = p => S.armies.find(a => a.rebel && a.at === p && count(a) > 0) || null;
function rebelChance(m){ if (m > MOR.rebelAt) return 0; if (m >= 25) return (MOR.rebelAt - m)/8*0.5;
  if (MC.curve === 'A') return Math.min(1, 0.5 + (25 - m)*0.0625); if (MC.curve === 'C') return Math.min(1, 0.5 + (25 - m)*0.02); return Math.min(1, 0.5 + (25 - m)/15*0.5); }
function troopF(p, o){ const g = garrisonOf(p, o); if (MC.troop === 'none' || !g) return 1; if (MC.troop === 'half') return Math.pow(0.5, g); if (MC.troop === 'minus15') return -0.15*g; return Math.max(0, 1 - g/rebelSize(p)); }
function rebelOdds(p, o){ const b = rebelChance(morOf(p)), f = troopF(p, o); return MC.troop === 'minus15' ? Math.max(0, b + f) : b*f; }
function natInfo(n){ const N = S.nations[n];
  const wars = S.nations.filter(m => m.alive && m.id !== n && atWar(n, m.id) && score(m.id) > 0).length + (S.armies.some(a => a.rebel && count(a) && S.owner[a.at] === n) ? 1 : 0);
  const inc = income(n); let sh = 0; for (const k of ['cash', 'oil', 'metal', 'iron', 'elec', 'rare', 'mp']) if (N.short && N.short[k] && inc.net[k] < 0){ const need = inc.upkeep[k] || 0, share = need > 0 ? Math.min(1, -inc.net[k]/need) : 1; sh += Math.max(5, Math.round(MOR.shortMax*share)); }
  const c0 = N.cap0 != null ? N.cap0 : N.capital;
  return {wars:Math.min(MOR.warMax, MOR.war*wars), nw:wars, short:Math.min(MOR.shortMax, sh), capLost:S.owner[c0] !== n ? MOR.capLost : 0, cap:N.capital}; }
function morTarget(p, prev, NI, parts){ const P = G.P[p], o = S.owner[p]; if (o < 0) return 70; const st = occSt(p), I = NI[o] || natInfo(o);
  let t = !P.city ? MOR.rural : st === 'home' ? MOR.home : st === 'anx' ? MOR.anx : MOR.occT; if (parts) parts.base = t;
  const add = (k, v) => { if (v){ t += v; if (parts) parts[k] = (parts[k] || 0) + v; } };
  add('dist', -MOR.perUnit*Math.round(gcKm(p, I.cap)/MC.km)); add('wars', -I.wars);
  let fn = 0, lo = 0, hi = 0; for (const v of P.nbs){ if (G.P[v].sea) continue; const ov = S.owner[v]; if (ov >= 0 && ov !== o && atWar(o, ov)) fn++; else if (ov === o){ if (prev[v] <= MOR.low) lo += G.P[v].city ? MOR.lowC : MOR.lowR; else if (prev[v] >= 99.5) hi += G.P[v].city ? MOR.hiC : MOR.hiR; } }
  add('foeNb', -MOR.foeNb*fn); add('lowNb', -lo); add('hiNb', hi);
  if (S.armies.some(a => a.at === p && a.to === null && !a.air && !a.fly && a.owner !== o && atWar(o, a.owner) && count(a))) add('foeHere', -MOR.foeHere);
  add('short', -I.short); add('cas', -Math.round(S.cas ? S.cas[p] || 0 : 0)); add('capLost', -I.capLost); if (p === I.cap) add('cap', MOR.cap); add('bunk', MOR.bunk[bunkerLv(p)] || 0);
  return Math.max(0, Math.min(100, t)); }
function morInit(){ if (!S.mor) S.mor = G.P.map(() => MOR.start); if (!S.cas) S.cas = G.P.map(() => 0); if (!S.anx) S.anx = {}; if (!S.morOwn) S.morOwn = S.owner.slice(); }
function morOwnerSync(){ for (let p = 0; p < G.P.length; p++){ if (G.P[p].sea) continue; const o = S.owner[p]; if (S.morOwn[p] === o) continue; S.morOwn[p] = o; if (S.anx[p] != null && S.anx[p] !== o) delete S.anx[p];
    if (o >= 0) S.mor[p] = S.home[p] === o ? Math.max(S.mor[p], MOR.lib) : MOR.occ; } }
function unrestDay(){ morInit(); morOwnerSync();
  const NI = {}; for (const N of S.nations) if (N.alive) NI[N.id] = natInfo(N.id);
  const prev = S.mor.slice();
  for (let p = 0; p < G.P.length; p++){ if (G.P[p].sea) continue; const T = morTarget(p, prev, NI); S.mor[p] += (T - S.mor[p])/MOR.rate; S.cas[p] *= 2/3; }
  if (MC.annexAI) annexAI();
  for (let p = 0; p < G.P.length; p++){ const P = G.P[p], o = S.owner[p]; if (!P.city || o < 0 || S.mor[p] > MOR.rebelAt || rebelsAt(p)) continue;
    const ch = rebelOdds(p, o); RBST.rolls++; RBST.chanceSum += ch; if (rng() < ch) rebelRise(p, o); }
}
function rebelRise(p, o){ const g = garrisonOf(p, o), n = rebelSize(p); RBST.rise++;
  if (!g){ RBST.riseEmpty++; rebelFlip(p, o, n); return; }
  RBST.riseFight++; const r = addArmy(NEUTRAL, p, {inf:n}); r.rebel = true; r.m = 80; RBST.live.set(r.id, {p, o});
  for (const a of S.armies) if (a.owner === o && a.at === p && a.to === null && !a.air && !a.fly && (a.still == null || S.hour - a.still < DIG_H)) a.still = S.hour - DIG_H; }
function rebelFlip(p, o, n){ const st = occSt(p); if (st === 'home') RBST.flipsHome++; else if (st === 'anx') RBST.flipsAnx++; else RBST.flipsOcc++;
  const home = S.home[p], to = home >= 0 && S.nations[home].alive && home !== o ? home : NEUTRAL; RBST.flipped++;
  if (S.cons[p] && S.cons[p].k === 'annex') RBST.annexLost++;
  S.owner[p] = to; ownChanged(); S.cap[p] = null; S.queue[p] = []; S.cons[p] = null; S.bld[p].fort = Math.max(0, (S.bld[p].fort || 0) - 1); if (S.occ) S.occ[p] = null; delete S.anx[p];
  for (const a of S.armies) if (a.rebel && a.at === p){ for (const t of UT){ a.u[t] = 0; a.w[t] = 0; } }
  if (to >= 0) addArmy(to, p, {inf:Math.max(2, n)}); else { const r = addArmy(NEUTRAL, p, {inf:n}); r.m = 80; }
  S.mor[p] = to >= 0 && home === to ? MOR.lib : 50; S.morOwn[p] = to; geoChanged(); removeEmpty(); if (o >= 0) checkNation(o); }
function rebelHour(){ morInit();
  for (const [id, L] of [...RBST.live]){ const a = armyById(id); const alive = a && count(a) > 0;
    if (S.owner[L.p] !== L.o){ RBST.live.delete(id); continue; }
    if (!alive){ RBST.fightsWon++; RBST.live.delete(id); continue; }
    if (garrisonOf(L.p, L.o) === 0){ RBST.fightsLost++; RBST.live.delete(id); rebelFlip(L.p, L.o, count(a)); } }
  for (const [p, c] of S.cons.entries()) if (c && c.k === 'annex' && S.owner[p] !== c.o) S.cons[p] = null; }
// Annex City: a construction in the city's one building slot (S.cons), cost by city size band
const annexCost = p => { const r = MC.annexT[sizeBand(p)]; return {cash:r[0], mp:r[1], h:r[2]*24}; };
function annexStart(n, p){ if (occSt(p) !== 'occ' || S.owner[p] !== n || S.cons[p] || !G.P[p].city) return false; const c = annexCost(p), N = S.nations[n]; if (N.cash < c.cash || N.mp < c.mp) return false;
  N.cash -= c.cash; N.mp -= c.mp; S.cons[p] = {k:'annex', o:n, lvl:1, h:c.h, h0:c.h}; RBST.annexStart++; return true; }
consHour = (f => function(p){ const c = S.cons[p]; if (c && c.k === 'annex'){ if (S.owner[p] !== c.o){ S.cons[p] = null; return; } if (--c.h <= 0){ S.anx[p] = c.o; S.cons[p] = null; RBST.annexDone++; } return; } f(p); })(consHour);
function annexAI(){ for (const N of S.nations){ if (!N.alive || isSeat(N.id)) continue; const cs = ownedBy(N.id).filter(p => G.P[p].city && occSt(p) === 'occ' && !S.cons[p]).sort((a, b) => popOf(b) - popOf(a));
  for (const p of cs){ const c = annexCost(p); if (N.cash < c.cash + 150 || N.mp < c.mp + 40) break; annexStart(N.id, p); } } }
mobBlock = (f => function(n, p, t){ if (MC.noMob && S.owner[p] === n && occSt(p) === 'occ') return {kind:'occ', why:'Occupied: annex the city to mobilize units here'}; return f(n, p, t); })(mobBlock);
function warDamage(p, v){ if (G.P[p].sea) return; S.dmg = S.dmg || G.P.map(() => 0); S.dmg[p] = Math.min(70, (S.dmg[p] || 0) + v); S.pop = S.pop || G.P.map(P => P.pop0); S.pop[p] = Math.max(0.02, S.pop[p]*(1 - v*0.0012*(1 - bunkerRed(bunkerLv(p)))));
  S.cas = S.cas || G.P.map(() => 0); S.cas[p] = Math.min(MOR.casMax, (S.cas[p] || 0) + v*MOR.casK); }
capture = (f => function(p, O){ const home = S.home[p]; morInit(); f(p, O); S.mor[p] = home === O ? Math.max(morOf(p), MOR.lib) : MOR.occ; S.morOwn[p] = S.owner[p]; delete S.anx[p]; })(capture);
// point 11: a trade partner occupied. S.trade.lost[key]: a route that ended because its partners went to war
trEnded = (f => function(r, why){ if (why === 'war' && r.b >= 0){ const T = trS(); T.lost = T.lost || {}; T.lost[r.key] = {a:r.a, b:r.b, kind:r.kind, h:S.hour, va:r.va ? r.va.cash : 0, vb:r.vb ? r.vb.cash : 0}; } f(r, why); })(trEnded);
const holdsOcc = (n, m) => { for (const P of G.P) if (P.city && S.owner[P.id] === n && S.home[P.id] === m && occSt(P.id) === 'occ') return true; return false; };
const lostActive = L => atWar(L.a, L.b) || holdsOcc(L.a, L.b) || holdsOcc(L.b, L.a);
tradeGen = (f => function(){ const T = trS(), before = new Set(T.routes.map(r => r.id)); f(); if (MC.trade11 === 'A' || !T.lost) return;
  const lock = new Map(); for (const k in T.lost){ const L = T.lost[k]; if (!lostActive(L)){ delete T.lost[k]; continue; } for (const n of [L.a, L.b]) lock.set(n, (lock.get(n) || 0) + 1); }
  if (!lock.size) return; T.routes = T.routes.filter(r => { if (before.has(r.id)) return true; for (const n of [r.a, r.b]) if (lock.get(n) > 0){ lock.set(n, lock.get(n) - 1); return false; } return true; }); })(tradeGen);
tradeIncome = (f => function(n){ const o = f(n); if (MC.trade11 !== 'C' || !S.trade || !S.trade.lost) return o; let hit = false;
  for (const k in S.trade.lost){ const L = S.trade.lost[k]; if (L.a !== n && L.b !== n) continue; if (holdsOcc(n, L.a === n ? L.b : L.a)){ hit = true; break; } }
  if (hit){ o.shock = 1; for (const k of ['cash', 'oil', 'metal', 'iron', 'elec', 'rare']) o[k] *= 0.75; } return o; })(tradeIncome);
`;
  return {patches, overlay, expose:'RBST, MOR, morTarget, natInfo, occSt, terrF, gcKm, rebelOdds, rebelChance, annexCost, annexStart, sizeBand, garrisonOf, morInit, provYield, income, ownedBy, popOf, tradeIncome, routesOf, trSide, capture, addArmy, declareWar, score, atWar, NEUTRAL, RES_K, MKT_BASE, mkt, count, armyById, rebelSize', cfg:C};
};
module.exports.ANNEX = ANNEX;
