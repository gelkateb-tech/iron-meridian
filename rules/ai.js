// Iron Meridian rules: ai. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
// AI: escort its own threatened routes, raid its enemies' trade with submarines and warships, blockade their lanes at a chokepoint or off
// their ports, and pause its own routes whose convoys would be lost
function aiTrade(n){ const T = S.trade; if (!T || !S.nations[n].alive) return; const mine = T.routes.filter(r => trMine(r, n) && r.kind === 'sea');
  const fleets = armiesOf(n).filter(a => shipsOnly(a) && a.to === null && !a.path.length && !a.sail && count(a) && !S.battles.includes(a.at));
  for (const a of fleets){ if (healthFrac(a) < 0.5 && (a.escort != null || a.raid || a.blk)){ delete a.escort; delete a.raid; delete a.blk; const y = G.P.find(P => S.owner[P.id] === n && S.bld[P.id].yard); if (y) a.path = pathFor(a, a.at, y.id); } }
  // 1. escort the most valuable routes raided in the last three days or blockaded now
  const threat = mine.filter(r => S.hour - r.raid < 72 || r.f < 1).sort((x, y) => (trSide(y, n) || {cash:0}).cash - (trSide(x, n) || {cash:0}).cash);
  for (const r of threat.slice(0, 2)){ if (armiesOf(n).some(a => a.escort === r.id)) continue; let pick = null, bd = 1e9;
    for (const a of fleets){ if (a.escort != null || a.blk || a.path.length || healthFrac(a) < 0.5 || !(a.u.frig || a.u.crui)) continue; const d = hexDist(G.P[a.at].cc, G.P[r.path[Math.floor(r.path.length/2)]].cc); if (d < bd && d < 40){ bd = d; pick = a; } }
    if (pick){ pick.escort = r.id; delete pick.raid; } }
  // 2. pause an own route whose next convoy is likely lost (raid risk above 55%, no escort on it); resume it once the risk is below 30% or an
  // escort guards it (checked every AI trade turn, so a paused route does not stay paused when the raiders leave)
  for (const r of mine){ if (r.pause != null && r.pause !== n) continue; const risk = trRisk(r), esc = S.armies.some(a => a.escort === r.id && count(a));
    if (r.pause == null && risk > 0.55 && !esc && r.f0 > 0) tradePause(n, r.id, true);
    else if (r.pause === n && (risk < 0.3 || esc)) tradePause(n, r.id, false); }
  // 3. raid: at war, idle fleets with submarines or frigates hunt enemy convoys within reach (half of them at most while own trade is threatened)
  // a raid ends when the route is gone or at peace, or after six quiet days on station (then the fleet looks for a better hunting ground)
  for (const a of fleets) if (a.raid && (!routeById(a.raid.r) || !trHostile(routeById(a.raid.r), n) || (a.raid.t != null && S.hour - a.raid.t > 24*6 && S.hour - routeById(a.raid.r).raid > 24*3))) delete a.raid;
  if (!warsOf(n).length){ for (const a of fleets) if (a.blk && a.blk.ai) delete a.blk; return; }
  const foe = T.routes.filter(r => r.kind === 'sea' && !trMine(r, n) && trHostile(r, n)); if (!foe.length) return;
  const zv = new Map(); for (const r of foe){ const v = ((r.va ? r.va.cash : 0) + (r.vb ? r.vb.cash : 0)); for (const z of r.path) zv.set(z, (zv.get(z) || 0) + v); }
  const guardAt = (x, y, km) => { let g = 0; for (const l of SEAA.values()) for (const b of l) if (b.owner >= 0 && atWar(n, b.owner)){ const [bx, by] = armyXY(b); if (Math.hypot(bx - x, by - y)/KM_W <= km) g += navPw(b); } return g; };
  // 4. blockade: one fleet of frigates or cruisers (two for a navy of four fleets or more) closes the chokepoint, or the port approach, that
  // carries the most enemy trade within reach; it lifts the blockade when it has stopped nothing for four days or the war is over
  { for (const a of fleets) if (a.blk && a.blk.ai && S.hour - a.blk.t > 96 && !T.routes.some(r => r.bk === a.id)) delete a.blk;
    const want = fleets.length >= 4 ? 2 : fleets.length >= 2 ? 1 : 0; let have = armiesOf(n).filter(a => a.blk).length;
    if (have < want){ const sites = [];
      for (const q of chokes()){ let v = 0; for (const r of foe){ const D = trDetour(r); if (D && trNear(D.B, q.x, q.y).d <= 150) v += (r.va ? r.va.cash : 0) + (r.vb ? r.vb.cash : 0); } if (v > 0) sites.push({x:q.x, y:q.y, z:G.prov[q.c], v:v*1.5}); }
      for (const r of foe){ const D = trDetour(r); if (!D || D.cut) continue; const B = D.B, ends = [[r.a, B.cells[0]], [r.b, B.cells[B.cells.length - 1]]];
        for (const [o, c] of ends){ if (o < 0 || !atWar(n, o)) continue; const C = trCells(); sites.push({x:C.cx[c], y:C.cy[c], z:G.prov[c], v:(r.va ? r.va.cash : 0) + (r.vb ? r.vb.cash : 0)}); } }
      for (const s of sites.sort((p, q) => q.v - p.v)){ if (have >= want) break; if (armiesOf(n).some(b => b.blk && b.dest && Math.hypot(b.dest.x - s.x, b.dest.y - s.y) < 1)) continue;
        let pick = null, bd = 1e9; for (const a of fleets){ if (a.escort != null || a.raid || a.blk || a.path.length || healthFrac(a) < 0.6 || !(a.u.frig || a.u.crui)) continue; const d = hexDist(G.P[a.at].cc, G.P[s.z].cc); if (d < bd && d < 30){ bd = d; pick = a; } }
        if (!pick || guardAt(s.x, s.y, 300) > navPw(pick)*1.2 || !fleetGo(pick, s.z, s.x, s.y)) continue; pick.blk = {t:S.hour, ai:1}; have++; } } }
  let raiding = fleets.filter(a => a.raid).length; const cap = Math.max(1, Math.ceil(fleets.length*(threat.length ? 0.5 : 0.7)));
  for (const a of fleets){ if (raiding >= cap) break; if (a.escort != null || a.raid || a.blk || a.path.length || healthFrac(a) < 0.6 || !(a.u.sub || a.u.frig || a.u.crui)) continue;
    if (!G.P[a.at].sea && rng() < 0.4) continue;   // some fleets keep the old coastal patrol duty
    const pw = navPw(a), seen = new Map([[a.at, 0]]), q = [a.at]; let best = -1, bs = 0;
    for (let h = 0; h < q.length; h++){ const u = q[h], du = seen.get(u); if (du >= 14) continue;
      for (const v of G.P[u].nbs){ if (seen.has(v) || !G.P[v].sea) continue; seen.set(v, du + 1); q.push(v); const val = zv.get(v); if (!val) continue;
        let guard = 0; for (const w of [v, ...G.P[v].nbs]) for (const x of SEAA.get(w) || []) if (x.owner >= 0 && atWar(n, x.owner)) guard += navPw(x);
        if (guard > pw*1.2) continue; const sc = val/(1 + du*0.25)*(a.u.sub ? 1.2 : 1); if (sc > bs){ bs = sc; best = v; } } }
    if (best < 0) continue; const fr = foe.find(r => r.path.includes(best)), sp = trSpot(fr, best) || {x:G.P[best].x, y:G.P[best].y};
    if (!fleetGo(a, best, sp.x, sp.y)) continue; a.raid = {r:fr.id, z:best, t:S.hour}; raiding++; } }
// AI patrol aircraft: an enemy route zone (convoys to hit) or an own raided route (subs to find) when no ships are in sight
function aiTradeHunt(n, B, r){ if (!S.trade) return -1; let best = -1, bs = 0;
  for (const R of S.trade.routes){ if (R.kind !== 'sea') continue; const own = trMine(R, n), foe = !own && trHostile(R, n); if (!foe && !(own && S.hour - R.raid < 72)) continue;
    const z = own && R.raidZ >= 0 ? R.raidZ : R.path[Math.floor(R.path.length/2)]; if (hexDist(B.cc, G.P[z].cc) > r) continue; const v = (R.va ? R.va.cash : 0) + (R.vb ? R.vb.cash : 0) + (own ? 8 : 0); if (v > bs){ bs = v; best = z; } }
  return best; }
// AI air targets: hostile forces per province within reach of an airbase (cached per call), scored per wing type
function aiFoesNear(n, B, r){ const out = []; for (const [pid, list] of provPowers()){ if (hexDist(B.cc, G.P[pid].cc) > r) continue; let pw = 0; for (const [o, p0] of list) if (o >= 0 && o !== n && atWar(n, o)) pw += p0; if (pw > 0) out.push([pid, pw]); } return out; }
function aiDroneTarget(n, B, r, T){ const plan = S.plans && S.plans[n]; let best = -1, bs = 0;
  for (const [pid, pw] of aiFoesNear(n, B, r)){ const foes = stationaryAt(pid).filter(b => b.owner >= 0 && atWar(n, b.owner)); if (!foes.length) continue; let sam = 0, jam = 0, soft = 0, guns = 0, armor = 0;
    for (const b of foes){ sam += b.u.sam || 0; jam += b.u.jam || 0; guns += (b.u.art || 0) + (b.u.mlrs || 0); armor += b.u.tank || 0; for (const t of UT) if (UNITS[t].cls === 'soft') soft += b.u[t]; }
    let sc = T === 'swarm' ? pw*0.4 + sam*9 + guns*5 + soft*1.2 - jam*4 - armor*1.5 : pw*0.5 + sam*6 + guns*6 + jam*5 + armor*1.5;
    if (plan && (pid === plan.tgt || G.P[plan.tgt].nbs.includes(pid))) sc *= 1.6; if (S.owner[pid] === n) sc *= 1.4;
    if (sc > bs){ bs = sc; best = pid; } }
  if (T === 'sdrone'){ for (const P of G.P){ const o = S.owner[P.id]; if (o < 0 || o === n || !atWar(n, o) || !P.city || hexDist(B.cc, P.cc) > r) continue; const k = bestBld(P.id); if (!k) continue; const sc = BLD_VAL[k]*4*(1 + 0.3*S.bld[P.id][k]); if (sc > bs){ bs = sc; best = P.id; } } }
  return bs >= (T === 'swarm' ? 5 : 8) ? best : -1; }
function aiBombTarget(n, B, r){ let best = -1, bs = 0;
  for (const P of G.P){ const o = S.owner[P.id]; if (o < 0 || o === n || !atWar(n, o) || !P.city || hexDist(B.cc, P.cc) > r || stormAt(P.id)) continue;   // a storm over the city would ground the raid: pick another
    let sc = BK.reduce((s0, k) => s0 + BLD_VAL[k]*S.bld[P.id][k], 0) + (isCapital(P.id) ? 6 : 0); const foes = stationaryAt(P.id).filter(b => atWar(n, b.owner)); sc += foes.reduce((s0, b) => s0 + power(b), 0)*0.15;
    const sam = foes.reduce((s0, b) => s0 + (b.u.sam || 0), 0), cap = capOver(P.id, n).reduce((s0, b) => s0 + count(b), 0); sc /= 1 + 0.35*sam + 1.5*cap;
    if (sc > bs){ bs = sc; best = P.id; } }
  return bs >= 6 ? best : -1; }
// UAV: watch the planned objective (or the busiest enemy front province) that nothing is revealing yet; armed UAVs prefer provinces with enemies
function aiReconTarget(n, B, r){ const plan = S.plans && S.plans[n], R0 = S.reveal || {}, armed = uavLv(n) >= 4;
  if (plan && hexDist(B.cc, G.P[plan.tgt].cc) <= r && !((R0[plan.tgt] || 0) > S.hour + 6) && !stationaryAt(plan.tgt).some(b => atWar(n, b.owner) && b.u.jam)) return plan.tgt;
  let best = -1, bs = 0; for (const P of G.P){ const o = S.owner[P.id]; if (P.sea || o < 0 || o === n || !atWar(n, o) || hexDist(B.cc, P.cc) > r) continue; if (!P.nbs.some(v => S.owner[v] === n)) continue;
    const foes = stationaryAt(P.id).filter(b => atWar(n, b.owner)), jam = foes.reduce((s0, b) => s0 + (b.u.jam || 0), 0); let sc = (P.city ? 2 : 1) + (armed ? foes.reduce((s0, b) => s0 + power(b), 0)*0.05 : 0); sc /= 1 + jam; if (sc > bs){ bs = sc; best = P.id; } }
  return best; }
// AWACS: orbit over an own province behind the front, closest to the planned objective (or the most contested border)
function aiOrbitTarget(n, B, r){ const plan = S.plans && S.plans[n]; let best = -1, bs = -1e9;
  for (const P of G.P){ if (P.sea || S.owner[P.id] !== n || hexDist(B.cc, P.cc) > r) continue; if (P.nbs.some(v => S.owner[v] >= 0 && atWar(n, S.owner[v]))) continue;   // one step behind the line
    const sc = plan ? -hexDist(P.cc, G.P[plan.tgt].cc) : P.nbs.reduce((s0, v) => s0 + G.P[v].nbs.filter(w => S.owner[w] >= 0 && atWar(n, S.owner[w])).length, 0); if (sc > bs){ bs = sc; best = P.id; } }
  return best; }
// maritime patrol: the sea zone in reach with the most hostile naval power (subs count double), else one off an own port when at war
function aiSeaHunt(n, B, r){ let best = -1, bs = 0;
  for (const P of G.P){ if (!P.sea || hexDist(B.cc, P.cc) > r) continue; const sc = stationaryAt(P.id).filter(b => b.owner >= 0 && atWar(n, b.owner) && shipsN(b)).reduce((s0, b) => s0 + power(b)*(b.u.sub ? 2 : 1), 0); if (sc > bs){ bs = sc; best = P.id; } }
  if (best < 0 && rng() < 0.6){ const tz = aiTradeHunt(n, B, r); if (tz >= 0) best = tz; }   // convoys on enemy trade routes, or the subs raiding ours
  if (best < 0 && warsOf(n).length && rng() < 0.3){ const ports = G.P.filter(P => S.owner[P.id] === n && P.city && P.coast && hexDist(B.cc, P.cc) <= r); if (ports.length){ const pt = ports[Math.floor(rng()*ports.length)], sz = pt.nbs.find(v => G.P[v].sea); if (sz != null) best = sz; } }
  return best; }
// short-range strike wings with nothing in reach move up to the own airbase closest to the main enemy (planned objective, else nearest enemy land)
function aiForward(n, a, B, r){ if (!warsOf(n).length || rng() > 0.5) return; const plan = S.plans && S.plans[n];
  let goal = plan ? G.P[plan.tgt] : null; if (!goal){ let bd = 1e9; for (const P of G.P){ const o = S.owner[P.id]; if (P.sea || o < 0 || o === n || !atWar(n, o)) continue; const d = hexDist(B.cc, P.cc); if (d < bd){ bd = d; goal = P; } } } if (!goal) return;
  const d0 = hexDist(B.cc, goal.cc); let best = -1, bd = d0 - 2;
  const pad = a.u.swarm > 0, keep = pad ? 3 : 0;   // swarms move up to any own city, staying a few hexes behind the front
  for (const P of G.P){ if (P.sea || S.owner[P.id] !== n || !(S.bld[P.id].air || (pad && swarmPad(a, P.id))) || P.id === a.air.base || hexDist(B.cc, P.cc) > r) continue; const d = hexDist(P.cc, goal.cc); if (d < keep) continue; if (d < bd){ bd = d; best = P.id; } }
  if (best >= 0) orderAir(a, best); }
function aiAir(n){
  for (const a of armiesOf(n)){ if (!a.air || a.fly || (a.air.cd || 0) > 0 || !count(a)) continue;
    // maintenance: worn or damaged wings stand down; where nothing repairs them they fly back to the best own airbase in reach
    if (wingCond(a) < WEAR_WARN + 0.05) a.air.mnt = 1; else if (a.air.mnt && (wingCond(a) >= 0.85 || maintRate(a) <= 0)) delete a.air.mnt;
    if (healthFrac(a) < 0.5 || a.air.mnt){ if (maintRate(a) < 0.12){ const mb = maintBase(a); if (mb >= 0) orderAir(a, mb); } continue; }
    const r = wingRange(a)*(wingCond(a) < 0.7 ? 0.6 : 1), B = G.P[a.air.base], T = wingT(a);
    if (T === 'drone'){ if (!warsOf(n).length) continue; const tg = aiReconTarget(n, B, r); if (tg >= 0) orderAir(a, tg); continue; }
    if (T === 'awacs'){ if (!warsOf(n).length) continue; const tg = aiOrbitTarget(n, B, r); if (tg >= 0) orderAir(a, tg); continue; }
    if (T === 'mpa'){ const tg = aiSeaHunt(n, B, r); if (tg >= 0) orderAir(a, tg); continue; }
    if (isBmb(T)){ const tg = aiBombTarget(n, B, r); if (tg >= 0) orderAir(a, tg); else aiForward(n, a, B, r); continue; }
    if (T === 'swarm' || T === 'sdrone'){ const tg = aiDroneTarget(n, B, r, T); if (tg >= 0) orderAir(a, tg); else aiForward(n, a, B, r); continue; }
    if (isStriker(a)){ let best = -1, bs = 0;
      for (const [pid, list] of provPowers()){ if (hexDist(B.cc, G.P[pid].cc) > r) continue; let sc = 0;
        for (const [o, pw] of list) if (o >= 0 && atWar(n, o)) sc += pw*(isSeat(o) ? 1.1 : 1);
        if (S.owner[pid] === n) sc *= 1.5;              // enemies on our soil first
        if (sc > bs){ bs = sc; best = pid; } }
      if (best >= 0 && bs > 8) orderAir(a, best);
      else if (warsOf(n).length && rng() < 0.6){ const tg = aiInterdict(n, B, r); if (tg >= 0) orderAir(a, tg); }
    } else { let best = -1, bs = 0;
      const H = (S.airHit && S.airHit[n]) || {drone:0, bomb:0, air:0}, airThreat = H.drone + H.bomb + H.air;
      for (const P of G.P){ if (S.owner[P.id] !== n || P.sea || hexDist(B.cc, P.cc) > r) continue;
        const sc = (S.battles.includes(P.id) ? 3 : 0) + (H.bp && S.hour - (H.bp[P.id] ?? -1e9) < 72 ? 6 + BK.reduce((s0, k) => s0 + S.bld[P.id][k], 0)*0.5 : 0) + P.nbs.filter(v => S.owner[v] >= 0 && atWar(n, S.owner[v])).length*(P.city ? 2 : 1) + (airThreat > 1 ? (P.city ? 1.5 : 0) + BK.reduce((s0, k) => s0 + S.bld[P.id][k], 0)*0.25*Math.min(3, airThreat) : 0);
        if (sc > bs){ bs = sc; best = P.id; } }
      if (best >= 0 && bs >= 2 && best !== a.air.base) orderAir(a, best); }
  }
}
// interdiction: an enemy rail hub or highway junction near the front, best where enemy columns are moving through it
function aiInterdict(n, B, r){ let best = -1, bs = 0;
  for (const P of G.P){ const o = S.owner[P.id]; if (P.sea || o < 0 || o === n || !atWar(n, o) || !P.lk.size || hexDist(B.cc, P.cc) > r) continue;
    let sc = 0; for (const lk of P.lk.values()){ if (lk.dmg > 0) continue; sc += railLv(lk)*2 + (roadLv(lk) >= 3 ? 1 : 0); } if (sc < 4) continue;
    const near = P.nbs.some(v => S.owner[v] === n) ? 2 : P.nbs.some(v => G.P[v].nbs.some(w => S.owner[w] === n)) ? 1.4 : 0.6;
    let moving = 0; for (const x of S.armies) if (x.owner === o && x.to !== null && (x.to === P.id || x.at === P.id)) moving++;
    sc *= near*(1 + moving); if (sc > bs){ bs = sc; best = P.id; } }
  return bs >= 6 ? best : -1; }
function aiMissiles(n){
  for (const [ps, st] of Object.entries(S.mstock || {})){ const p = +ps; if (S.owner[p] !== n) continue;
    for (const k of ['bm', 'cm']){ if (!st[k]) continue; let best = -1, bs = 0;
      for (const [pid, list] of provPowers()){ let sc = 0; for (const [o, pw] of list) if (o >= 0 && o !== n && atWar(n, o)) sc += pw*(isSeat(o) ? 1.1 : 1); if (sc < (k === 'bm' ? 60 : 30)) continue; if (!missileCheck(n, p, pid, k).ok) continue; if (sc > bs){ bs = sc; best = pid; } }
      if (best >= 0) launchMissile(n, p, best, k); } }
}
function aiSpies(n){
  const N = S.nations[n]; if (agentsOf(n).length < 2 && N.cash > 220 && rng() < 0.3) trainAgent(n);
  const wars = warsOf(n); if (!wars.length || !idleAgents(n).length || rng() > 0.4) return;
  const m = wars[Math.floor(rng()*wars.length)], provs = ownedBy(m).filter(p => !G.P[p].sea).map(p => G.P[p]); if (!provs.length) return;
  const P = provs[Math.floor(rng()*provs.length)], op = S.home[P.id] !== m ? 'incite' : BK.some(k => S.bld[P.id][k]) ? 'sabotage' : 'steal';
  startSpy(n, P.id, op);
}
/* ---------------- AI ---------------- */
let PPC = {v:-1, m:null};
function provPowers(){ if (PPC.v !== tickVer || PPC.S !== S || !keep()){ if (PPC.v === tickVer && PPC.S === S) return PPC.m; const m = new Map(); for (const a of S.armies){ if (a.to !== null || a.fly) continue; let e = m.get(a.at); if (!e) m.set(a.at, e = []); e.push([a.owner, power(a), 1/digF(a)]); } if (!keep()) return m; PPC = {v:tickVer, S, m}; } return PPC.m; }
function defPower(p, n){
  let d = 0; for (const [o, pw, dg] of (provPowers().get(p) || [])) if (o !== n) d += pw*(dg || 1);   // (dg: 1/DIG_DEF for a dug-in defender)
  if (S.owner[p] !== n){ d *= 1.25/Math.pow(0.8, S.bld[p].fort)*(G.P[p].sea ? 1 : terr(p).def); }   // the AI reads terrain: dug in on a mountain counts for more
  return d;
}
function threatNear(p, n){ return G.P[p].nbs.some(v => (byAt(v) || S.armies).some(a => a.at === v && a.owner >= 0 && atWar(n, a.owner) && count(a) > 0)); }
const EMC = {};
function enemyMix(n){
  const ck = EMC[n]; if (ck && ck.v === tickVer && ck.S === S) return ck.r;
  const r = enemyMix0(n); if (keep()) EMC[n] = {v:tickVer, S, r}; return r;
}
function enemyMix0(n){
  const m = {soft:0, armored:0, air:0, naval:0}, c = {drone:0, bomb:0, sub:0, ad:0, sup:0, all:0}; let mm = 0;
  for (const a of S.armies){ if (a.owner < 0 || !atWar(n, a.owner)) continue; for (const t of UT){ const k = a.u[t]; if (!k) continue; m[UNITS[t].cls] += k*UNITS[t].hp; if (UNITS[t].cls === 'air' && !UNITS[t].dr) mm += k*UNITS[t].hp; const v = k*UNITS[t].cost/(UNITS[t].pack || 1); c.all += v;
      if (UNITS[t].dr) c.drone += v; else if (isBmb(t)) c.bomb += v; else if (t === 'sub') c.sub += v; else if (t === 'sam' || t === 'jam') c.ad += v; else if (t === 'awacs' || t === 'mpa') c.sup += v; } }
  const tot = m.soft + m.armored + m.air + m.naval || 1, ct = c.all || 1;
  // cost shares of the kinds the counter-picks care about: drones, bombers, subs, air defence (SAM + jammers), support aircraft
  // airm: manned aircraft only (drones have their own counters: jammers, SAMs; counted in 'drone')
  return {soft:m.soft/tot, armored:m.armored/tot, air:m.air/tot, airm:mm/tot, naval:m.naval/tot, drone:c.drone/ct, bomb:c.bomb/ct, sub:c.sub/ct, ad:c.ad/ct, sup:c.sup/ct};
}
// how rough the ground is where this nation fights (enemy and foreign land next to its own): 0 open steppe .. 1 marsh and mountains
const FRC = {};
function frontRough(n){ const d = Math.floor(S.hour/24), ck = FRC[n]; if (ck && ck.d === d && ck.S === S) return ck.r;
  const wars = warsOf(n), seen = new Set(); let s = 0, c = 0;
  for (const p of ownedBy(n)){ if (G.P[p].sea) continue; for (const v of G.P[p].nbs){ if (seen.has(v) || G.P[v].sea || S.owner[v] === n) continue; if (wars.length && !wars.includes(S.owner[v])) continue; seen.add(v); s += rough(G.P[v].terrain); c++; } }
  const r = c ? s/c : 0; if (keep()) FRC[n] = {d, S, r}; return r; }
// aircraft counts per type a nation fields (cached per tick: aiPickUnit runs for every city)
let AIRM = {v:-1, S:null, m:new Map()};
function airMine(n){ const kp = keep(); if (kp && (AIRM.v !== tickVer || AIRM.S !== S)) AIRM = {v:tickVer, S, m:new Map()}; let m = AIRM.v === tickVer && AIRM.S === S ? AIRM.m.get(n) : undefined; if (m) return m; m = {};
  for (const a of armiesOf(n)) if (a.air) for (const t of AIR_T) if (a.u[t]) m[t] = (m[t] || 0) + a.u[t]; if (kp) AIRM.m.set(n, m); return m; }
const AI_SCARCE = ['iron', 'elec', 'rare'];
let AIPC = {v:-1, S:null, m:[]};
function aiCountsOf(n){ const kp = keep(); if (kp && (AIPC.v !== tickVer || AIPC.S !== S)) AIPC = {v:tickVer, S, m:[]}; let c = AIPC.v === tickVer && AIPC.S === S ? AIPC.m[n] : undefined; if (c) return c;
  let ships = 0, allU = 0, jamN = 0; for (const a of S.armies) if (a.owner === n){ ships += shipsN(a); allU += count(a); jamN += a.u.jam || 0; } c = {ships, allU, jamN}; if (kp) AIPC.m[n] = c; return c; }
function aiPickUnit(n, p){
  const mix = enemyMix(n), am = mix.airm ?? mix.air, w = {inf:4, at:1 + 6*mix.armored, art:1.5, sam:0.3 + 8*am + 3*mix.drone, ifv:1.2, tank:2.2, jet:2.6 + 3*mix.armored, int:1.2 + 6*am, frig:1.2, sub:0.5 + 4*mix.naval, crui:0.8};
  // terrain counter-pick: rough fronts (forest, hills, mountains, marsh, ice) want infantry and special forces, open ones armor
  { const rg = frontRough(n); w.tank *= 1 - 0.5*rg; w.ifv *= 1 - 0.5*rg; w.inf *= 1 + 0.5*rg; w.art *= 1 - 0.2*rg; w.spec = 0.3 + 2.2*rg; }
  // trade war: convoys sunk lately want frigates (escorts); enemy trade routes in the world invite submarines (raiders)
  // (foeTr: the enemy sea routes, counted once a turn: no route or relation changes while a turn recruits city by city)
  const foeTr0 = () => S.trade.routes.filter(r => r.kind === 'sea' && !trMine(r, n) && trHostile(r, n)).length;
  const trHit = S.trade ? Math.min(4, S.trade.hit[n] || 0) : 0, foeTr = S.trade && warsOf(n).length ? (AIT !== null && AIT.n === n ? AIT.foeTr ?? (AIT.foeTr = foeTr0()) : foeTr0()) : 0;
  w.frig += 1.3*trHit; w.crui += 0.3*trHit; w.sub += 0.2*Math.min(8, foeTr);
  // (the nation's ships, units and jammers: counted once an hour per nation; its forces do not change between the cities of one turn, which only queue)
  const AC = aiCountsOf(n), allU = AC.allU, jamN = AC.jamN; if (AC.ships > allU*(trHit >= 1 ? 0.28 : 0.2)){ w.frig = w.sub = w.crui = 0; }
  // V3 air: drones, the jammer, specialised aircraft, with counter-picks against what the enemy fields and what has been hitting us
  { const H = (S.airHit && S.airHit[n]) || {drone:0, bomb:0, air:0}, mine = airMine(n);
    const rich = S.nations[n].cash > 400, wars = warsOf(n).length > 0, coast = G.P[p].coast;
    w.jam = 0.15 + 12*mix.drone + 1.2*Math.min(4, H.drone); if (jamN > Math.max(8, allU*0.07)) w.jam *= 0.3;   // jammers cannot fight: a screen, not an army
    w.sam += 5*mix.bomb + 0.8*Math.min(4, H.bomb + H.air);
    w.int += 3*mix.bomb + 2*mix.drone + 2*mix.sup;
    w.asf = 2 + 6*am + 6*mix.bomb + 4*mix.drone + 3*mix.sup + 1.2*Math.min(4, H.bomb + H.air);
    w.swarm = wars ? 1.2 + 9*mix.ad + 1.5*mix.soft : 0.2;
    w.sdrone = wars ? 0.7 + 1.5*mix.armored + 5*mix.ad : 0.2;
    w.drone = (mine.drone || 0) < 2 ? 1.4 : 0.1;
    w.bomb = wars && (mine.bomb || 0) < 4 ? (rich ? 2.5 : 2) : 0.05;
    if (H.bomb > 0){ const hb = Math.min(3, H.bomb); w.int += 2*hb; w.sam += 2.5*hb; w.asf += 6*hb; }   // being bombed: air-superiority fighters (the real counter), interceptors and SAMs where none can be built
    w.mpa = coast && (mine.mpa || 0) < 3 ? 0.25 + 8*mix.sub + 1.2*trHit : 0;
    w.awacs = wars && !(mine.awacs) ? 1.5 + 2*mix.airm : 0;
    // where an Air Superiority Fighter can be built it takes over most of the interceptor's share: it covers seven provinces, not one
    if (unlocked(n, 'asf') && bldOk(p, 'asf') && (mine.asf || 0) < 12){ w.asf += 0.6*w.int; w.int *= 0.4; }
    if ((mine.swarm || 0) > 48) w.swarm *= 0.2; if ((mine.sdrone || 0) > 8) w.sdrone *= 0.3; if ((mine.asf || 0) > 12) w.asf *= 0.4;
    const manned = ['int', 'asf', 'jet', 'bomb', 'stealth', 'awacs', 'mpa', 'heli'].reduce((s0, t) => s0 + (mine[t] || 0), 0);
    if (manned > Math.max(4, allU*(H.bomb + H.air > 1 ? 0.16 : 0.1))){ const quota = {asf:H.bomb + H.air > 0 ? 6 : 4, awacs:1, mpa:2};
      for (const t of ['int', 'asf', 'jet', 'awacs', 'mpa', 'heli']) if (!((mine[t] || 0) < (quota[t] || 0))) w[t] = (w[t] || 0)*0.25; w.sam *= 0.7; } }
  { const N = S.nations[n], inc = income(n); if (inc.net.oil < 0 || (N.short && N.short.oil)){ w.tank *= 0.3; w.jet *= 0.3; w.int *= 0.5; w.crui *= 0.5; w.ifv *= 0.5; w.bomb *= 0.2; w.asf *= 0.5; w.mpa *= 0.5; w.awacs *= 0.5; }
    else if (N.oil > 450*RES_K && inc.net.oil > 4*RES_K){ w.tank *= 1.35; w.ifv *= 1.35; w.jet *= 1.3; w.frig *= 1.2; w.crui *= 1.2; } }   // fuel to spare: more of the units that burn it
  { const N = S.nations[n], inc = income(n);   // iron or electronics running out (a shortage, or maintenance eating the last two weeks of stock): fewer of the units that use most of it
    for (const k of ['iron', 'elec']){ const d = -inc.net[k]; if (!((N.short && N.short[k]) || (d > 0 && N[k] < 14*d))) continue; for (const t in w) if (MAINT[t]) w[t] *= MAINT[t][k] >= (k === 'iron' ? 0.24 : 0.12)*RES_K ? 0.3 : MAINT[t][k] > 0 ? 0.65 : 1.15; } }   // the heavy users: 6 or more of it in the price
  { const N = S.nations[n], av = {}; for (const k of AI_SCARCE) av[k] = N[k] - aiKeepRes(n, k);   // what is left above the maintenance reserve
    for (const t in w){ const U = UNITS[t]; if (!U) continue; for (const k of AI_SCARCE){ const q = U[k] || 0; if (q && av[k] < q*3) w[t] *= av[k] < q ? 0.15 : 0.5; } } }
  const opts = UT.filter(t => bldOk(p, t) && unlocked(n, t));
  let tot = opts.reduce((s, t) => s + (w[t] || 0), 0), r = rng()*tot;
  for (const t of opts){ r -= w[t] || 0; if (r <= 0 && w[t]) return t; }
  return opts.includes('inf') ? 'inf' : null;   // nothing with weight: infantry, where this city can mobilize it
}
function aiFleet(a, n){
  // damaged fleets go home to a yard; healthy ones patrol a sea zone next to an enemy coast
  if (healthFrac(a) < 0.5){ const y = G.P.find(P => S.owner[P.id] === n && S.bld[P.id].yard); if (y && a.at !== y.id) a.path = pathFor(a, a.at, y.id); return; }
  const seen = new Map([[a.at, 0]]), q = [a.at]; let best = -1;
  for (let h = 0; h < q.length && best < 0; h++){ const u = q[h], du = seen.get(u); if (du >= 8) continue;
    for (const v of G.P[u].nbs){ if (seen.has(v) || !G.P[v].sea) continue; seen.set(v, du + 1); q.push(v);
      if (G.P[v].nbs.some(x => !G.P[x].sea && S.owner[x] >= 0 && atWar(n, S.owner[x]))){ best = v; break; } } }
  if (best >= 0 && best !== a.at) a.path = pathFor(a, a.at, best);
}
const focusOf = n => { const R = S.blocReg && Object.values(S.blocReg).find(R => R.members && R.members.includes(n)); return R ? R.focus : null; };
// pick one offensive objective against the main enemy and the own provinces next to it to gather in
function aiPlan(n){ const P0 = (S.plans || (S.plans = {}))[n];
  if (isSated(n)){ delete S.plans[n]; return null; }   // the nations world: grown enough for now, no offensive (rules/diplomacy.js isSated)
  if (P0 && S.owner[P0.tgt] !== n && atWar(n, S.owner[P0.tgt] ?? -1) && S.hour - P0.made < 24*8) return P0;
  const wars = warsOf(n); if (!wars.length){ delete S.plans[n]; return null; }
  const foe = focusOf(n) != null && wars.includes(focusOf(n)) ? focusOf(n) : wars.slice().sort((x, y) => natPower(x) - natPower(y))[0];
  let best = null, bv = 0;
  for (const p0 of ownedBy(foe)){ const P = G.P[p0]; if (P.sea) continue; const stage = P.nbs.filter(v => S.owner[v] === n && !G.P[v].sea); if (!stage.length) continue;
    const v = (P.city ? 3 : 1) + (isCapital(P.id) ? 4 : 0) + (P.oil ? 1 : 0) + stage.length*0.6, dp = defPower(P.id, n), rx = stage.filter(s0 => riverX(s0, P.id)).length/stage.length, sc = v/(8 + dp)*(1 - 0.2*rx); if (sc > bv){ bv = sc; best = {tgt:P.id, stage, foe, made:S.hour}; } }
  if (best) S.plans[n] = best; else delete S.plans[n]; return best; }
function aiOperate(n, idle){ const plan = aiPlan(n), N = S.nations[n], used = new Set();
  // 1. front defence: send the nearest idle reserve to an own border province that faces a much stronger enemy stack
  for (const p0 of ownedBy(n)){ const P = G.P[p0]; if (P.sea) continue; let threat = 0; for (const v of P.nbs){ if (S.owner[v] >= 0 && atWar(n, S.owner[v])) threat += stationaryAt(v).filter(b => b.owner === S.owner[v]).reduce((s0, b) => s0 + power(b), 0); }
    if (P.id === N.capital){ const r2 = new Set(); for (const v of P.nbs) for (const w of G.P[v].nbs) if (w !== P.id && !P.nbs.includes(w)) r2.add(w);   // and the ring beyond, at 60%
      for (const b of S.armies) if (r2.has(b.at) && b.owner >= 0 && b.owner !== n && !b.air && atWar(n, b.owner) && count(b)) threat += 0.6*power(b); }
    if (P.city && S.battles.includes(P.id)) threat += stationaryAt(P.id).filter(b => b.owner >= 0 && atWar(n, b.owner)).reduce((s0, b) => s0 + power(b), 0)*1.5;   // a city already under attack
    // the capital is defended against any raid (small strike groups now race along captured rail lines), and from further away
    const capP = P.id === N.capital; if (threat < (capP ? 5 : 20)) continue; const here = stationaryAt(P.id).filter(b => b.owner === n).reduce((s0, b) => s0 + power(b), 0) + armiesOf(n).filter(b => b.path.length && b.path[b.path.length - 1] === P.id).reduce((s0, b) => s0 + power(b), 0);
    // (stacks stay within the stack limit, so up to four of the nearest are sent until the province is held strongly enough)
    let have = here; const tried = new Set(); for (let k = 0; k < 4 && have < threat*(capP ? 1.4 : 0.8); k++){
      let pick = null, bd = 1e9; for (const a of idle){ if (used.has(a) || tried.has(a) || a.at === P.id || a.at === N.capital && threatNear(a.at, n) || power(a) < (capP ? 6 : 10)) continue; const d = hexDist(G.P[a.at].cc, P.cc); if (d < bd && d <= (capP ? 16 : 8)){ bd = d; pick = a; } }
      if (!pick) break; tried.add(pick); const pth = pathFor(pick, pick.at, P.id); if (pth.length){ pick.path = pth; used.add(pick); have += power(pick); } } }
  if (!plan) return used;
  // 2. gather at the staging provinces, then strike together from every side once strong enough
  const stage = plan.stage.filter(v => S.owner[v] === n); if (!stage.length){ delete S.plans[n]; return used; }
  const atStage = armiesOf(n).filter(a => !a.air && a.to === null && !a.path.length && stage.includes(a.at) && count(a) && (a.at !== N.capital || idle.includes(a)));   // (not the capital's garrison)
  const massed = atStage.reduce((s0, a) => s0 + power(a)*terrFit(a, plan.tgt, true)*(riverX(a.at, plan.tgt) ? RIVER_ATK : 1), 0), need = defPower(plan.tgt, n)*1.5 + 10;
  if (massed >= need){ for (const a of atStage){ const m = aiGunsStay(a, plan.tgt); if (m) orderMove(m, plan.tgt); used.add(a); } plan.launched = S.hour;   // (guns that can shell the target stay behind)
    { const eta = atStage.filter(a => a.path.length).map(a => [a, etaHours(a)]), slow = Math.max(0, ...eta.map(e => e[1])); for (const [a, h] of eta) if (slow - h >= 3) a.delay = Math.min(36, Math.round(slow - h)); }   // all arrive together
    if (isSeat(S.owner[plan.tgt])) tell(S.owner[plan.tgt], `${N.name} launches a coordinated assault on ${G.P[plan.tgt].cityName || G.P[plan.tgt].name} from ${(n0 => n0 + (n0 === 1 ? ' direction' : ' directions'))(new Set(atStage.map(a => a.at)).size)}!`, 'bad', plan.tgt);
    return used; }
  let i = 0; for (const a of idle){ if (used.has(a) || stage.includes(a.at) || power(a) < 14 || (a.at === N.capital && threatNear(a.at, n))) continue;
    const st = stage[i++ % stage.length], d = hexDist(G.P[a.at].cc, G.P[st].cc); if (d > 14) continue;
    const pth = pathFor(a, a.at, st); if (pth.length){ a.path = pth; used.add(a); } }
  for (const a of atStage) used.add(a);       // forces already in position wait for the rest
  return used; }
// AI transport works, rate-limited (one new project a day at most, 1-2 running, a cash reserve kept): rails from the capital toward its fronts,
// otherwise roads and rails to its own cities; high-speed lines only when rich. The route is planned rail-aware, so the first gap on it is a real gap.
function aiLinks(n){ const N = S.nations[n]; if (!N.alive) return 'dead'; if (N.lkSave && N.lkSave.until <= S.hour) N.lkSave = null; if (!N.lkSave && rng() > (N.cash > 800 ? 0.95 : 0.6)) return 'skip';
  const np = ownedBy(n).length; if (np < 3 || linkProjects(n) >= (np > 80 ? 2 : 1)) return 'busy';
  const inc = income(n); if (inc.net.cash < 2) return 'income';
  const mine = v => S.owner[v] === n, fronts = [], cities = [];
  for (const p0 of ownedBy(n)){ const P = G.P[p0]; if (P.sea || P.id === N.capital) continue;
    if (P.nbs.some(v => S.owner[v] >= 0 && S.owner[v] !== n && atWar(n, S.owner[v]))) fronts.push(P.id); else if (P.city) cities.push(P.id); }
  const pool = fronts.length && rng() < 0.75 ? fronts : cities.length ? cities : fronts; if (!pool.length) return 'nodest';
  const t = pool[Math.floor(rng()*pool.length)], path = N.lkSave ? [] : findPath(N.capital, t, mine, 'wheel', n); if (!path.length && !N.lkSave) return 'nopath';
  let u = N.capital, job = null, hsr = null;
  if (N.lkSave && N.lkSave.job && linkCheck(n, N.lkSave.job[0], N.lkSave.job[1], N.lkSave.job[2]).lv) job = N.lkSave.job;   // the project it is saving for
  else for (const v of path){ const r = linkOf(u, v), rd = r ? r.road : 0, rl = r ? r.rail : 0;
    if (!(r && (r.bld || r.dmg > 0))){ if (!rl){ job = [u, v, rd ? 'rail' : 'road']; break; } if (rd < 2 && !job) job = [u, v, 'road']; if (rl === 1 && !hsr) hsr = [u, v, 'rail']; }
    u = v; }
  if (!job && hsr && has(n, 'log1') && N.cash > 900 && rng() < 0.3) job = hsr;
  if (!job){ N.lkSave = null; return 'nojob'; } const ck = linkCheck(n, job[0], job[1], job[2]);
  // short of money: hold back that much from unit purchases for up to two days (metal is not held back)
  if (!ck.ok && ck.c && (N.cash < ck.c.cash + 20 || !hasC(N, {...ck.c, cash:0})) && !/yours|under way|Damaged|research|track first|projects/.test(ck.why)){ if (!N.lkSave) N.lkSave = {job, c:ck.c.cash + 20, until:S.hour + 48}; return 'save'; }
  if (!ck.ok){ N.lkSave = null; return 'check:' + ck.why; } if (N.cash < ck.c.cash + 20){ if (!N.lkSave) N.lkSave = {job, c:ck.c.cash + 20, until:S.hour + 48}; return 'save'; }
  N.lkSave = null; return buildLink(n, job[0], job[1], job[2]) ? 'built:' + job[2] : 'fail'; }
// how many heavy bombers the AI still wants: at war, Strategic Bombers researched, an Airbase II standing, oil not running dry; 2 for a small power, up to 4 for a big one
function aiBomberWant(n, provs, inc){ if (!has(n, 'u_bomb') || !warsOf(n).length || inc.net.oil < -2*RES_K) return 0;
  if (!G.P.some(P => S.owner[P.id] === n && P.city && S.bld[P.id].air >= 2 && !bdis(P.id, 'air'))) return 0;
  const goal = provs > 160 ? 4 : provs > 70 ? 3 : 2, have = (airMine(n).bomb || 0) + S.queue.reduce((s0, q, pp) => s0 + (S.owner[pp] === n ? q.filter(j => j.t === 'bomb').length : 0), 0);
  return Math.max(0, goal - have); }
// Stealth Bombers: the AI buys them late and rarely. Only from day 60, only at war with a power that fields SAM stacks (a force with two or more
// Mobile SAMs), and never more than one wing per nation: AI_STEALTH_MAX aircraft, all at one airbase (aiStealthSite). They are never a random pick
// (aiPickUnit gives them no weight): the AI saves for one (N.uSave with the city in .p)
const AI_STEALTH_DAY = 60, AI_STEALTH_MAX = 2;
const aiFoeSams = n => S.armies.some(b => b.owner >= 0 && (b.u.sam || 0) >= 2 && atWar(n, b.owner));
const aiStealthOk = n => S.hour >= (AI_STEALTH_DAY - 1)*24 && warsOf(n).length > 0 && aiFoeSams(n);
// the one city the nation's stealth wing is (or will be) built in: where the wing is based or one is in training, else an Airbase III city; -1 if none can train it
function aiStealthSite(n){ const w = armiesOf(n).find(a => a.air && a.u.stealth > 0); let p = w ? w.air.base : -1;
  if (p < 0) p = S.queue.findIndex((q, pp) => S.owner[pp] === n && q.some(j => j.t === 'stealth'));
  if (p >= 0) return S.owner[p] === n && !G.P[p].sea && bldOk(p, 'stealth') ? p : -1;
  const P = G.P.find(q => S.owner[q.id] === n && q.city && bldOk(q.id, 'stealth')); return P ? P.id : -1; }
function aiStealthWant(n, inc){ if (!has(n, 'u_stealth') || !aiStealthOk(n) || inc.net.oil < -2*RES_K) return 0;
  const wings = armiesOf(n).filter(a => a.air && a.u.stealth > 0); if (wings.length > 1) return 0;
  const have = wings.reduce((s0, a) => s0 + a.u.stealth + ((a.air.pend && a.air.pend.stealth) || 0), 0) + S.queue.reduce((s0, q, pp) => s0 + (S.owner[pp] === n ? q.filter(j => j.t === 'stealth').length : 0), 0);
  return have < AI_STEALTH_MAX && aiStealthSite(n) >= 0 ? AI_STEALTH_MAX - have : 0; }
// Air Superiority Fighters wanted: with the research and an Airbase II, at war with powers that fly bombers, AWACS, patrol planes or drones
// (or hit by air), a small fighter force: 2 + up to 4 more with the threat, bigger empires a little more
function aiAsfWant(n, provs, inc){ if (!has(n, 'u_asf') || !warsOf(n).length || inc.net.oil < -2*RES_K) return 0;
  if (!G.P.some(P => S.owner[P.id] === n && P.city && S.bld[P.id].air >= 2 && !bdis(P.id, 'air'))) return 0;
  const mx = enemyMix(n), H = (S.airHit && S.airHit[n]) || {drone:0, bomb:0, air:0}, thr = 18*mx.bomb + 14*mx.sup + 6*mx.drone + 4*(mx.airm || 0) + (H.bomb + H.air > 0 ? 1.5 : 0);
  if (thr < 0.4) return 0;
  const goal = Math.min(provs > 160 ? 8 : 6, 2 + Math.round(Math.min(4, thr))), have = (airMine(n).asf || 0) + S.queue.reduce((s0, q, pp) => s0 + (S.owner[pp] === n ? q.filter(j => j.t === 'asf').length : 0), 0);
  return Math.max(0, goal - have); }
// what the AI holds back: the link project it saves for (cash), and the counter unit it saves for (all of its costs)
const AI_CTR = new Set(['jam', 'sam', 'int', 'asf', 'mpa', 'frig', 'bomb', 'awacs', 'stealth']);   // counters, and the heavy aircraft it rarely picks: saved for, not swapped
// an AI buys from sell listings on the order book, other AIs' and a person's alike (cheapest first, up to 1.15x the world price; never an enemy's or an
// embargoing power's; a person is told of each sale):
// goods change hands between nations without moving the world price. Returns what it got.
function aiBookBuy(n, k, q){ const N = S.nations[n], M = mkt(); let got = 0;
  const asks = (S.book || []).filter(o => !isBid(o) && o.res === k && o.qty > 0 && o.seller !== n && S.nations[o.seller].alive && !atWar(n, o.seller) && !embargoed(o.seller, n) && canSee(o, n) && o.price <= M.p[k]*1.15).sort((x, y) => x.price - y.price);
  for (const o of asks){ const r = Math.min(q - got, o.qty, lotsFor(N.cash, o.price), kFloor(stockCap(n) - N[k])); if (r <= 0) break;
    N.cash -= lotCash(r, o.price); N[k] += r; S.nations[o.seller].cash += lotCash(r, o.price); o.qty -= r; got += r;
    if (isSeat(o.seller)) tell(o.seller, `${N.name} bought ${fmt(r)} ${rlbl(k)} from your offer for $${fmt(lotCash(r, o.price))}M.`, 'good', null);
    if (got >= q) break; }
  if (got) S.book = S.book.filter(o => o.qty > 0); return got; }
// AI market thresholds: buys when a stock is below AI_LOW (and tops up what is below AI_SHORT, AI_BUYQ at most); never a hoard
const AI_KEEP = resK({iron:180, elec:130, rare:170});   // AI stock kept back from a sale into a strong market (plus 25 days of maintenance and what it saves for)
// (every goods table here is written in the old units and scaled to RES_K by resK)
const AI_LOW = resK({oil:40, metal:60, iron:50, elec:35, rare:40}), AI_SHORT = resK({oil:90, metal:90, iron:80, elec:60, rare:70}), AI_BUYQ = resK({oil:120, metal:120, iron:100, elec:60, rare:50});
// AI economy constants (the city-resource economy): an Arms Industry level must pay for itself within AI_PAY_NEED days when the good is really short,
// AI_PAY_FREE days as a plain investment; its rare-earth city is taken to Arms Industry AI_RARE_LV first; AI_XKEEP: the stock an exporter keeps before it
// sells; AI_IMP: what an importer buys a day at most; exporters sell while the world price is at least AI_XPX of the base
const AI_PAY_NEED = 40, AI_PAY_FREE = 20, AI_RARE_LV = 3, AI_XPX = 0.75, AI_BASE_Q = 0.34;
const AI_XKEEP = resK({oil:200, metal:120, iron:140, elec:110, rare:40}), AI_IMP = resK({oil:40, metal:40, iron:35, elec:20, rare:30});
// iron reaches the powers without an iron city from the first week: a power with an iron city and iron to spare (a net income of AI_XEARLY.net a day or more)
// lists small lots (up to lot) as soon as its stock is above keep (plus what it saves for and 10 days of upkeep), long before the full export line (AI_XKEEP)
const AI_XEARLY = {iron:resK({keep:90, net:3, lot:40})};
// where the AI builds an Arms Industry for resource k: its own city whose main resource is k, the lowest level first, big cities and home cities first
function aiSite(n, k){ let best = -1, bv = 0;
  for (const p of ownedBy(n)){ if (S.cons[p] || cityMain(p) !== k) continue; const lv = S.bld[p].arms; if (lv >= BUILD.arms.max) continue;
    const v = (1 + 0.2*Math.min(4, Math.pow(popOf(p), 0.75)/4))/(1 + lv)*(S.home[p] === n ? 1 : 0.6)*(1 + 0.1*rng()); if (v > bv){ bv = v; best = p; } }
  return best; }
// days until the next Arms Industry level for resource k pays for itself: its price (money, plus materials and iron at base prices) against the daily
// value of the +25% (at base prices; money at par). 1e9 when the nation has no city for it
function aiArmsPay(n, k){ const p = aiSite(n, k); if (p < 0) return 1e9; const c = buildCost(n, 'arms', S.bld[p].arms + 1, p), y0 = provYield(p)[k]/(1 + ARMS_PCT*S.bld[p].arms);
  return (c.cash + c.metal/MKT_LOT*MKT_BASE.metal + c.iron/MKT_LOT*MKT_BASE.iron)/Math.max(0.01, ARMS_PCT*(k === 'cash' ? y0 : y0/MKT_LOT)*(k === 'cash' ? 1 : MKT_BASE[k])); }   // (MKT_BASE: per MKT_LOT units)
// the main resources of the nation's cities (what it can raise at home and export; the rest it must buy or conquer)
function aiMains(n){ const m = new Set(); for (const p of ownedBy(n)) if (G.P[p].city) m.add(cityMain(p)); return m; }
// Recruiting Office for an AI short of manpower: a new office first (the first province without one, +3k a day for $40M); only when every province
// has one, the next level of its lowest office (cities first). No upgrades otherwise, except where training speed is the limit (aiRecSlow)
function aiRecSite(n){ let best = -1, bl = 99;
  for (const p of ownedBy(n)){ if (S.cons[p] || !canBuildHere(p, 'rec')) continue; const l = S.bld[p].rec || 0;
    if (!l) return p; if (l >= BUILD.rec.max) continue; const v = l - (G.P[p].city ? 0.5 : 0); if (v < bl){ bl = v; best = p; } }
  return best; }
// training speed limits the AI in city p: it is at war, the city's queue is full (two or more waiting) and the money for the next level is spare
function aiRecSlow(n, p){ const l = S.bld[p].rec || 0; return l >= 1 && l < BUILD.rec.max && S.queue[p].length >= 2 && warsOf(n).length > 0 && S.nations[n].cash > buildCost(n, 'rec', l + 1, p).cash + 300; }
const aiReserve = (n, k = 'cash') => { const N = S.nations[n], L0 = N.lkSave, U = N.uSave;
  // at war, troops come first: the link project only holds its money back once there is twice that much in the bank
  let r = k === 'cash' && L0 && L0.until > S.hour && !(N.cash < L0.c*2 && warsOf(n).length) ? L0.c : 0;
  if (U && U.until > S.hour && UNITS[U.t]) r += (ucost(n, U.t)[k] || 0) + (k === 'cash' ? 15 : 0);
  if (N.bSave && N.bSave.until > S.hour) r += buildCost(n, 'air', 2)[k] || 0;
  if (rFree(N) && N.rPick && N.rPick.until > S.hour && RN[N.rPick.id] && rNextLv(n, N.rPick.id) && (N.rPick.save || k === 'rare')) r += rCost(RN[N.rPick.id], rNextLv(n, N.rPick.id))[k] || 0;   // saving for a counter tech (all of it); rare materials always wait for the next research
  return r; };
// buy what a cost lacks in traded goods (plus a few spare) on the world market, if every price is at most mx times the base and the money covers it all
function aiBuyFor(n, c, mx, spare = 20){ const N = S.nations[n], miss = MKT_K.map(k => [k, kCeil((c[k] || 0) - N[k])]).filter(([, q]) => q > 0); if (!miss.length) return true;
  let tot = c.cash || 0; for (const [k, q] of miss){ if (buyPrice(n, k) > MKT_BASE[k]*mx*(k === 'iron' || k === 'elec' ? 1.25 : 1)) return false; tot += lotCash(q + 5*RES_K, buyPrice(n, k)); }
  if (N.cash < tot + spare + aiReserve(n)) return false; for (const [k, q] of miss) trade(n, k, q + 5*RES_K); return true; }
// iron and electronics kept back from new units for maintenance: the shortage line plus three days of it (a new unit that would dig into it waits)
const aiKeepRes = (n, k) => k === 'iron' || k === 'elec' ? AI_LOW[k] + 3*Math.max(0, income(n).upkeep[k]) : 0;
const aiSpare = (n, t, keep) => { const N = S.nations[n], c = ucost(n, t); if (!canAfford(n, t) || N.cash < c.cash + 15 + aiReserve(n)) return false; for (const k of CK) if (k !== 'cash' && c[k] > 0 && N[k] - c[k] < aiReserve(n, k) + (keep ? aiKeepRes(n, k) : 0)) return false; return true; };   // only what this unit itself uses is checked against the savings
// AI army supply: how big an army the land can carry before growth waits for more territory (or money above $600M). It stands in for the old food
// limit (armies ate food; temperate countryside fed three units, a city or cold ground one): without it the populous powers grew until cash alone ran out
const ARMYC = {v:-1, m:[]};
function aiArmyCap(n){ const kp = keep(); if (kp && (ARMYC.v !== tickVer || ARMYC.S !== S)){ ARMYC.v = tickVer; ARMYC.S = S; ARMYC.m = []; }
  if (ARMYC.v === tickVer && ARMYC.S === S && ARMYC.m[n] != null) return ARMYC.m[n]; let c = 0, k = 0; for (const p of ownedBy(n)){ const P = G.P[p]; if (P.sea) continue; k++; c += P.city ? 1 : (Math.abs(P.lat) < 55 ? 3 : 1)*G.PF; }
  const r = 90 + c*Math.min(1, 0.55 + 40/(40 + k)); if (kp) ARMYC.m[n] = r; return r; }   // large empires feed and supply their armies less efficiently (as food was hit by administration)
const aiBases = n => ownedBy(n).filter(p => G.P[p].city && (S.bld[p].fac || (S.cons[p] && S.cons[p].k === 'fac'))).length;
// ---------- the computer's research (docs/RESEARCH.md section 8). When a slot is free it makes a weighted pick among the steps that are open
// (their day has come, their spine node is researched), sticks with it for a day (four for a badly needed counter), buys missing goods on the
// market and starts it. One slot thinks about new things ("science": unlocks, upgrades, generations), the other hones what the nation fields
// ("engineering": Firepower and Protection, which cost few rare materials), so a nation short of rare materials never sits with two idle slots.
const AI_RKIND = nd => nd.kind === 'eng' ? 'eng' : 'sci';
function aiResearch(n){ const N = S.nations[n]; if (!rFree(N)) return;
  const av = rOpenSteps(n); if (!av.length) return;
  const mx = enemyMix(n), H = (S.airHit && S.airHit[n]) || {drone:0, bomb:0, air:0};
  const hb = H.bomb > 0 ? 4 : 0, wr = warsOf(n).length > 0, ab2 = ownedBy(n).some(p => S.bld[p].air >= 2);
  // enemies fielding (or able to field) bombers, AWACS and patrol planes, or flying drones, call for Air Superiority Fighters
  const awv = (() => { const foes = warsOf(n), heavy = foes.filter(e => has(e, 'u_bomb') || has(e, 'u_awacs')).length; return (wr ? 2.5 : 0) + 14*mx.bomb + 12*mx.sup + 8*mx.drone + 3*Math.min(2, heavy) + (H.bomb + H.air > 0 ? 4 : 0); })();
  const pgm = (wr ? 4.2 : 2.6) + 4*(mx.bomb + mx.air) + 2*Math.min(3, H.bomb) + hb, jamW = 0.8 + 14*mx.drone + 2*Math.min(3, H.drone);
  // the weights the projects had before the redesign, carried over to the nodes they became
  const NW = {u_jet:3, u_int:3, jet_pgm:pgm, int_msl:pgm, u_drone:2.5, drone_g2:2, drone_g3:1.5, drone_g4:2, drone_g5:1.5, u_swarm:3, u_sdrone:2.5, u_jam:jamW, jam_band:jamW,
    u_asf:3 + 5*(mx.air + mx.bomb) + Math.min(3, H.bomb) + hb + 8*mx.bomb + awv, u_mpa:0.5 + 8*mx.sub + 1.2*Math.min(3, (S.trade && S.trade.hit[n]) || 0), u_awacs:wr ? 2.2 : 1.5, u_bomb:wr ? (ab2 ? 11 : 8) : 3,
    bomb_up:0.8, u_stealth:aiStealthOk(n) ? 3 : 0.15};   // stealth bombers: only late, at war with a power that fields SAM stacks
  // what the nation fields: units in service and in training, and their money value (the old Mark rule: count x unit price)
  const cnt = {}; let val = 0; for (const a of armiesOf(n)) for (const t of UT) if (a.u[t]) cnt[t] = (cnt[t] || 0) + a.u[t];
  for (const p of ownedBy(n)) for (const it of S.queue[p]) if (!it.msl && UNITS[it.t]) cnt[it.t] = (cnt[it.t] || 0) + (UNITS[it.t].pack || 1);
  for (const t in cnt) val += cnt[t]*UNITS[t].cost;
  const share = u => val > 0 ? (cnt[u] || 0)*UNITS[u].cost/val : 0;
  // a line whose unit needs a kind of building the nation has none of (no airbase at all, no naval yard): little point in its unlock, none in the rest
  const bOk = {}, canB = u => { if (bOk[u] !== undefined) return bOk[u]; return (bOk[u] = reqsOf(u).every(r => ownedBy(n).some(p => S.bld[p][r.b] > 0 || (S.cons[p] && S.cons[p].k === r.b)))); };
  const ups = {}; for (const id in N.tech){ const nd = RN[id]; if (nd && (nd.kind === 'kit' || nd.kind === 'gen')) ups[nd.cat + nd.line] = (ups[nd.cat + nd.line] || 0) + (+N.tech[id] || 1); }
  const silo = ownedBy(n).some(p => S.bld[p].silo > 0);
  const rInc = Math.max(0, income(n).net.rare), rOk = c => N.rare + 5*rInc >= c.rare;   // fundable in about five days of rare-material income
  // the Stealth Bomber's path: a nation that flies Heavy Bombers wants the Strategic Bomber Upgrade (range +720 km) as soon as it opens, and
  // once it has it, the Strike Fighter's Stealth Airframes that open the Stealth Bomber with it (weights that are not scaled by the fleet's share)
  const bombs = cnt.bomb || 0, NWD = {bomb_up:bombs ? 30 + 4*Math.min(4, bombs) : has(n, 'u_bomb') ? (ab2 ? 16 : 6) : 0, jet_lo:has(n, 'bomb_up') ? 8 : 0};
  const weigh = ({nd, lv}) => { const u = nd.u, c = rCost(nd, lv); let w;
    if (NWD[nd.id]) w = NWD[nd.id];
    else if (nd.kind === 'eng') w = cnt[u] ? 0.2 + 10*share(u) : 0;                                   // hone the big arm first; nothing for a unit it does not field
    else if (nd.kind === 'unlock') w = (NW[nd.id] || 1)*(u && !canB(u) ? 0.3 : 1);
    else if (u){ if (!cnt[u] && !canB(u)) w = 0;
      else if (nd.kind === 'gen') w = Math.max(NW[nd.id] || 0, cnt[u] ? 1 + 45*share(u) : 0.15);   // a generation of the main arm outweighs everything but a badly needed counter
      else w = (NW[nd.id] || 1)*(cnt[u] ? 0.6 + 3*share(u) : 0.25); }
    else w = nd.cat === 'msl' && nd.kind === 'kit' && nd.id !== 'msl3' && nd.id !== 'sat1' && !silo ? 0.2 : nd.lv.length > 1 && lv > 1 ? 0.6 : 1;   // missile upgrades want a silo; later levels of the shield and the satellites are luxuries
    if (nd.kind !== 'eng' && ups[nd.cat + nd.line] >= 2) w *= 1.5;                                // finish lines: a recognisable speciality
    return w*(rOk(c) ? 1 : 0.35); };
  const roll = L => { const w = L.map(weigh), tot = w.reduce((a, b) => a + b, 0); if (!(tot > 0)) return null; let r = rng()*tot; for (let i = 0; i < L.length; i++){ r -= w[i]; if (r <= 0) return L[i]; } return L[L.length - 1]; };
  const other = R_SLOTS.map(k => N[k]).find(Boolean), busyKind = other && RN[other.id] ? AI_RKIND(RN[other.id]) : null;
  const want = busyKind === 'sci' ? 'eng' : 'sci', pool = k => av.filter(x => AI_RKIND(x.nd) === k);
  // buy what the step lacks (never above 1.6x the base price) when the money is there, then start it
  // (for a step it has been saving for, the computer pays up to twice the base price: a generation's 50 materials are often dear)
  const go = x => { const tc = rCost(x.nd, x.lv), mx = N.rPick && N.rPick.save && N.rPick.id === x.nd.id ? 2 : 1.6, res = N.rPick && N.rPick.id === x.nd.id ? 0 : aiReserve(n);
    for (const k of ['rare', 'metal', 'iron', 'elec']){ const miss = kCeil((tc[k] || 0) - N[k]); if (miss > 0 && buyPrice(n, k) <= MKT_BASE[k]*mx && N.cash > tc.cash + 60 + lotCash(miss + 3*RES_K, buyPrice(n, k)) + res) trade(n, k, miss + 3*RES_K); }
    return N.cash > tc.cash + 30 && startResearch(n, x.nd.id); };
  // the pick sticks for a day: an expensive step (bombers, fighters) is saved for instead of losing every roll to the cheap ones
  let pick = N.rPick && N.rPick.until > S.hour ? av.find(x => x.nd.id === N.rPick.id) : null;
  if (!pick){ pick = roll(pool(want)) || roll(pool(want === 'sci' ? 'eng' : 'sci')); if (!pick){ N.rPick = null; return; }
    // a counter that is badly needed (Air Superiority Fighters) is saved for over four days, a generation of a unit type that makes up a fifth
    // or more of the forces for two: aiReserve holds its price back from recruiting
    const save = (pick.nd.id === 'u_asf' && awv >= 2.5) || (pick.nd.kind === 'gen' && share(pick.nd.u) >= 0.2) || (pick.nd.id === 'bomb_up' && bombs >= 2);
    N.rPick = {id:pick.nd.id, until:S.hour + (save ? (pick.nd.id === 'u_asf' ? 96 : 72) : 24), save}; }
  if (go(pick)){ N.rPick = null; return; }
  // the pick must wait for its price, but a free slot does not sit idle meanwhile: with both slots free one of them takes a cheaper step (a level
  // of Firepower or Protection first: they cost 3 to 8 rare materials) and the other stays for the pick; with one slot free, a pick that is not
  // being saved for lets a cheaper step have it. A step that would eat the rare materials a saved-for pick needs is not taken
  const saving = N.rPick && N.rPick.save, pc = rCost(pick.nd, pick.lv);
  const left = x => { const c = rCost(x.nd, x.lv); return x !== pick && hasC(N, c) && N.cash > c.cash + 30 + aiReserve(n) && (!saving || ['rare', 'metal', 'iron', 'elec'].every(k => N[k] - (c[k] || 0) >= (pc[k] || 0))) && c.cash <= Math.max(60, pc.cash*0.6); };
  const alt = !other ? roll(pool('eng').filter(left)) || roll(av.filter(left)) : !saving ? roll(av.filter(left)) : null;
  if (alt) startResearch(n, alt.nd.id); }
// the target of an offensive from province p0 (aiTurn): the best-scoring province within maxD steps (sea steps count 2) that the stacks there, of
// strength pw, can take; -1 when none (a function of its own, so the engine optimizes it apart from the long aiTurn)
function aiTarget(n, p0, maxD, pw, targeted, sated, freeLeft, fitAt, foc){
  const DG = aiBfs(), gen = DG.gen, dg = DG.g, dd = DG.d, C = mapNbs(), o0 = C.o, nb = C.v, sea = C.sea, q = DG.q; let qn = 0; q[qn++] = p0; dg[p0] = gen; dd[p0] = 0;   // (dg/dd: the search's distances, a typed array marked by search)
  let best = -1, bestScore = 0;
  for (let h = 0; h < qn; h++){ const u = q[h], du = dd[u]; if (du >= maxD) continue;
    for (let j = o0[u], j1 = o0[u + 1]; j < j1; j++){ const v = nb[j]; if (dg[v] === gen) continue; const step = sea[v] ? 2 : 1; dg[v] = gen; dd[v] = du + step; q[qn++] = v;
      if (sea[v] || S.owner[v] === n || targeted.has(v)) continue;
      if (S.owner[v] >= 0 && !atWar(n, S.owner[v])) continue;
      if (S.owner[v] >= 0 && pw < 30 && S.home[v] !== n) continue;
      if (S.home[v] !== n && (sated || (S.owner[v] < 0 && freeLeft <= 0))) continue;   // (the nations world: grown enough for now, or no more independent land to take)
      const fv = fitAt(v)*(riverX(u, v) ? RIVER_ATK : 1); if (pw*fv < defPower(v, n)*1.3 + 4) continue;
      let val = (G.P[v].city ? 3 : 1)*(S.owner[v] >= 0 && foc === S.owner[v] ? 1.8 : 1); if (G.P[v].oil) val += 1.5; if (isCapital(v)) val += 3; if (S.home[v] === n) val *= 3;
      if (S.owner[v] >= 0 && atWar(n, S.owner[v])){ val *= 1.6; let rj = 0; for (const lk of G.P[v].lk.values()) if (lk.rail) rj++; if (rj >= 3) val += 0.8; }
      const sc = val/(1 + (du + step)*0.7)*(0.5 + 0.5*Math.min(1.2, fv)); if (sc > bestScore){ bestScore = sc; best = v; } } }
  return best; }
// the offensive search's scratch (aiTurn): distances by province, marked with the number of the search (no Map per search)
let AIBF = null;
function aiBfs(){ if (!AIBF || AIBF.g.length !== G.P.length || AIBF.gen >= 0xfffffff0) AIBF = {g:new Uint32Array(G.P.length), d:new Float64Array(G.P.length), q:new Int32Array(G.P.length), gen:0}; AIBF.gen++; return AIBF; }
// the map's neighbour lists in one flat array (P.nbs of province p are v[o[p]] .. v[o[p + 1] - 1], in the same order) and its sea flags, made once per map
let MNB = null;
function mapNbs(){ if (MNB && MNB.G === G) return MNB; const n = G.P.length, o = new Int32Array(n + 1); let k = 0; for (let p = 0; p < n; p++){ o[p] = k; k += G.P[p].nbs.length; } o[n] = k;
  const v = new Int32Array(k), sea = new Uint8Array(n); for (let p = 0; p < n; p++){ v.set(G.P[p].nbs, o[p]); sea[p] = G.P[p].sea ? 1 : 0; } return MNB = {G, o, v, sea}; }
// the turn in progress (AIT: answers that hold for one nation's whole turn, nothing in a turn changes them; see aiPickUnit)
let AIT = null;
function aiTurn(n){ const N = S.nations[n]; if (!N.alive) return; const prev = AIT; AIT = {n, foeTr:undefined}; try { aiTurn0(n, N); } finally { AIT = prev; } }
function aiTurn0(n, N){
  aiResearch(n);
  const inc = income(n), provs = ownedBy(n).length;
  const units = aiCountsOf(n).allU + ownedBy(n).reduce((s, p) => s + S.queue[p].length, 0);   // (its forces have not changed yet this turn)
  const canGrow = inc.net.cash > 4 && inc.upkeep.cash < inc.gross.cash*0.7 && units < aiArmyCap(n);
  // economy buildings: one new project per turn where it is needed most; a rich power stuck on a resource runs up to three at once.
  // The Arms Industry raises a city's main resource, so only goods one of its own cities produces can be raised at home: rare materials first (research),
  // then iron, materials, oil, electronics and money by need (iron and electronics are spent on new units as fast as they come in, so they are wanted
  // while the stock is little above the maintenance reserve); manpower: a Recruiting Office. A level must pay for itself (aiArmsPay): a real shortage
  // accepts AI_PAY_NEED days, and a power with money to spare also adds the single best investment under AI_PAY_FREE days (exporters grow what they are
  // good at). What does not pay is imported instead (the structural trade below). One Arms Industry at a time (two for a big power)
  { const u0 = inc.upkeep, rareLv = ownedBy(n).reduce((m, p) => G.P[p].city && G.P[p].main === 'rare' ? Math.min(m, S.bld[p].arms + (S.cons[p] && S.cons[p].k === 'arms' ? 1 : 0)) : m, 9),
      needs = [(inc.net.rare < 6*RES_K && N.rare < 140*RES_K) || rareLv < AI_RARE_LV ? 'rare' : null,
      inc.net.iron < -1*RES_K || (N.iron < aiKeepRes(n, 'iron') + 30*RES_K && inc.net.iron < Math.max(4*RES_K, 0.8*u0.iron + 2*RES_K)) ? 'iron' : null, inc.net.metal < 4*RES_K && N.metal < 80*RES_K ? 'metal' : null, inc.net.oil < 3*RES_K ? 'oil' : null, inc.net.mp < 5 && N.mp < 60 ? 'rec' : null,
      inc.net.elec < -1*RES_K || (N.elec < aiKeepRes(n, 'elec') + 50*RES_K && inc.net.elec < Math.max(3*RES_K, u0.elec + 2*RES_K)) ? 'elec' : null, inc.net.cash < 25 || N.cash > 500 ? 'cash' : null].filter(Boolean);
    for (let i = needs.length - 1; i >= 0; i--) if (needs[i] !== 'rec' && aiArmsPay(n, needs[i]) > AI_PAY_NEED) needs.splice(i, 1);
    if (N.cash > 200){ let bk = null, bv = AI_PAY_FREE; for (const k of ['cash', ...MKT_K]){ if (needs.includes(k)) continue; const v = aiArmsPay(n, k)*(1 + 0.1*rng()); if (v < bv){ bv = v; bk = k; } } if (bk) needs.push(bk); }
    const rich = N.cash > 600 && !canGrow, jobs = rich ? 3 : 1, busy = {}, j0 = Math.floor(S.hour/4) + n; let done = 0;
    if (needs.length) for (const p of ownedBy(n)) if (S.cons[p]) busy[S.cons[p].k] = (busy[S.cons[p].k] || 0) + 1;
    const ord = needs[0] === 'rare' ? ['rare', ...needs.slice(1).map((x, i, a) => a[(j0 + i) % a.length])] : needs.map((x, i, a) => a[(j0 + i) % a.length]);
    for (let j = 0; j < ord.length && done < jobs && N.cash > 90; j++){ const need = ord[j], bk = need === 'rec' ? 'rec' : 'arms'; if ((busy[bk] || 0) >= (provs > 150 ? 2 : 1)) continue;
      if (bk === 'arms'){ const p = aiSite(n, need); if (p >= 0 && build(n, p, 'arms')){ done++; busy.arms = (busy.arms || 0) + 1; } continue; }
      if (need === 'rec'){ const p = aiRecSite(n); if (p >= 0 && build(n, p, 'rec')){ done++; busy.rec = (busy.rec || 0) + 1; } continue; }
      for (const p of ownedBy(n)){ if (S.cons[p] || !canBuildHere(p, need) || S.bld[p][need] >= BUILD[need].max) continue;
        if (build(n, p, need)){ done++; busy[need] = (busy[need] || 0) + 1; break; } } }
    // the other way round: a cash-poor power sells a metal hoard on the world market, while metal still fetches 0.8x the base price and at most
    // AI_SELL_DAY units a day. Oil and the other goods are never dumped here (that flattened their prices for everyone): stock above 55% of the storage
    // cap goes to the order book instead (bookDay), sold nation to nation without moving the world price
    // A real hoard (over 1,000) held by a power short of cash is unloaded too, AI_HOARD_DAY a day and more for bigger hoards, while the price is
    // above 0.6x the base or 85% of the last two weeks' average, whichever is lower (never below 0.5x): hoards of 1,000-3,000 no longer sit idle all game while the price never reaches 0.8x
    if (N.metal > 1000*RES_K) N.mHoard = 1; else if (N.metal < 650*RES_K) N.mHoard = 0;   // once over 1,000 the hoard is sold down to about 650
    const hoard = !!N.mHoard && N.cash < 500;
    if (N.cash < 260 || hoard){ const day = Math.floor(S.hour/24); if (N.sellD !== day){ N.sellD = day; N.sold = 0; }
      const M = mkt(), sur = N.metal - (hoard ? 620 : 420)*RES_K - aiReserve(n, 'metal'), h14 = M.hist.metal.slice(-14), avg = h14.length ? h14.reduce((a, b) => a + b, 0)/h14.length : M.p.metal;
      const floor = hoard ? Math.max(MKT_BASE.metal*0.5, Math.min(MKT_BASE.metal*0.6, avg*0.85)) : MKT_BASE.metal*0.8, cap = hoard ? Math.min(90*RES_K, Math.max(AI_HOARD_DAY, 0.9*inc.gross.metal) + Math.max(0, N.metal - 1000*RES_K)/20) : AI_SELL_DAY;   // a big producer (~60 a day) sells about its output, bigger hoards a bit more
      if (sur >= 30*RES_K && (inc.net.metal >= 0 || hoard) && M.p.metal >= floor){ const q = kFloor(Math.min(sur, cap - (N.sold || 0), (hoard ? 40 : 30)*RES_K)); if (q >= 10*RES_K) N.sold = (N.sold || 0) - trade(n, 'metal', -q); } }
    // structural trade, good by good. What one of its own cities produces and it holds too much of (above AI_XKEEP, what it saves for and
    // 25 days of upkeep) is offered while the world price is at least AI_XPX of the base: one listing of up to 120 on the order book just under the
    // world price (nation to nation: exports are never dumped on the world market, which flattened prices for everyone). What none of its cities produce is bought up to the
    // shortage line (plus what it saves for and 10 days of upkeep) while the price is at most 1.5x the base: other powers' listings first, then the
    // world market, AI_IMP a day at most and never below $120M
    // (a good its cities do produce, but less than its forces use, is imported the same way: Australia's one oil city does not fuel a navy)
    { const mains = aiMains(n), M = mkt(), day = Math.floor(S.hour/24); if (N.xD !== day){ N.xD = day; N.xB = {}; }
      for (const k of MKT_K){ const px = M.p[k]/MKT_BASE[k];
        if (mains.has(k) && inc.net[k] >= 0){ const res = aiReserve(n, k), upk = Math.max(0, inc.upkeep[k]), over = N[k] - AI_XKEEP[k] - res - 25*upk, E = AI_XEARLY[k], early = E && inc.net[k] >= E.net ? N[k] - E.keep - res - 10*upk : 0;
          const q = over >= 15*RES_K ? kFloor(Math.min(over, 120*RES_K)) : early >= 10*RES_K ? kFloor(Math.min(early, E.lot)) : 0; if (!q || px < AI_XPX) continue;
          if (!(S.book || []).some(o => o.seller === n && o.res === k && !isBid(o)) && (S.book || []).filter(o => o.seller === n).length < 5){ N[k] -= q; (S.book || (S.book = [])).push({id:S.nid++, type:'sell', seller:n, res:k, qty:q, price:+(M.p[k]*0.98).toFixed(2), exp:S.hour + 72}); } }
        else { const want = AI_SHORT[k] + aiReserve(n, k) + 10*Math.max(0, inc.upkeep[k]); if (N[k] >= want || px > 1.5) continue;
          const q = kFloor(Math.min(want - N[k], AI_IMP[k] - (N.xB[k] || 0), (N.cash - 120)/buyPrice(n, k)*MKT_LOT)); if (q >= 5*RES_K){ const got = aiBookBuy(n, k, q); N.xB[k] = (N.xB[k] || 0) + got + (q - got >= 5*RES_K ? trade(n, k, q - got) : 0); } } } }
    // hoarded cash buys the scarce resources on the world market (up to 1.4× the going price)
    if (N.cash > 450 && (!canGrow || MKT_K.some(k => N[k] < AI_LOW[k]))){ const M = mkt(), cap = stockCap(n);
      for (const k of MKT_K){ const short = N[k] < AI_SHORT[k] || inc.net[k] < 0; if (!short || buyPrice(n, k) > M.p[k]*1.4) continue;
        const q = kFloor(Math.min(cap*0.6 - N[k], (N.cash - 320)/buyPrice(n, k)*MKT_LOT, AI_BUYQ[k])); if (q >= 10*RES_K) trade(n, k, q); } }
    // fuel or maintenance running the oil, iron or electronics stock down: buy about two and a half weeks of the deficit, first from other powers' listings
    // on the order book (an oil producer's surplus), the rest on the world market while the price is fair (up to 1.5x the base)
    for (const k of ['oil', 'iron', 'elec']){ const d = -inc.net[k]; if (d < 0.3*RES_K || N[k] > 12*d + 25*RES_K) continue;
        const dry = N[k] < 3*d, q = kFloor(Math.min(AI_BUYQ[k], 18*d + 30*RES_K - N[k], stockCap(n) - N[k], (N.cash - (dry ? 50 : 110) - aiReserve(n))/buyPrice(n, k)*MKT_LOT)); if (q < 8*RES_K) continue;   // all but run dry: before any new unit
        const got = aiBookBuy(n, k, q); if (q - got >= 8*RES_K && buyPrice(n, k) <= MKT_BASE[k]*1.5) trade(n, k, q - got); }
    // the other way round: a big stock of iron, electronics or rare materials (above AI_KEEP, plus what it saves for) is sold on the world market while the
    // price is high (1.1x the base or more), 60 a day at most. It only ever pulls a dear price back towards the base,
    // so it never floods the market, and it is what keeps these goods trading once the opening scramble is over
    { const M = mkt(), day = Math.floor(S.hour/24); if (N.surD !== day){ N.surD = day; N.surS = {}; }
      for (const k of ['iron', 'elec', 'rare']){ const keep = AI_KEEP[k] + aiReserve(n, k) + 25*Math.max(0, inc.upkeep[k]), over = N[k] - keep; if (over < 15*RES_K || M.p[k] < MKT_BASE[k]*1.1) continue;
        const q = kFloor(Math.min(over, 10*RES_K + over/10, 60*RES_K - (N.surS[k] || 0))); if (q >= 8*RES_K) N.surS[k] = (N.surS[k] || 0) - trade(n, k, -q); } }
    // cheap iron, electronics or rare materials (world price under 0.85x the base): a power with money stocks up to twice its shortage line,
    // which keeps these goods trading after the opening months and their price off the floor
    if (N.cash > 350){ const M = mkt(), cap = stockCap(n);
      for (const k of ['iron', 'elec', 'rare']){ if (M.p[k] >= MKT_BASE[k]*0.85 || N[k] >= 2*AI_SHORT[k]) continue;
        const q = kFloor(Math.min(cap*0.6 - N[k], 2*AI_SHORT[k] - N[k], (N.cash - 300)/buyPrice(n, k)*MKT_LOT, 40*RES_K)); if (q >= 10*RES_K) trade(n, k, q); } }
    void done; }
  // heavy-aircraft research but no Airbase II yet: save up for one (like a link project) and build it as soon as the money is there
  { const B2 = N.bSave; if (B2 && (B2.until <= S.hour || S.owner[B2.p] !== n || S.bld[B2.p].air !== 1)) N.bSave = null;
    if (!N.bSave && (has(n, 'u_bomb') || has(n, 'u_asf') || has(n, 'u_awacs')) && (warsOf(n).length || N.cash > 300) && !ownedBy(n).some(p => S.bld[p].air >= 2)){ const p = ownedBy(n).find(q => G.P[q].city && S.bld[q].air === 1); if (p !== undefined) N.bSave = {p, until:S.hour + 48}; }
    if (N.bSave && !S.cons[N.bSave.p] && build(n, N.bSave.p, 'air')) N.bSave = null; }
  // fighters before bombers: an ASF want replaces a bomber saving (and anything but another counter)
  { const A3 = aiAsfWant(n, provs, inc), U0 = N.uSave && N.uSave.until > S.hour ? N.uSave : null; if (A3 && (!U0 || U0.t === 'bomb' || !AI_CTR.has(U0.t)) && rng() < 0.5) N.uSave = {t:'asf', until:S.hour + 48}; }
  { const B3 = aiBomberWant(n, provs, inc); if (B3 && !(N.uSave && N.uSave.until > S.hour) && rng() < 0.4) N.uSave = {t:'bomb', until:S.hour + 48}; }
  // the stealth wing (see aiStealthWant): an Airbase III first, then the aircraft, saved for like any counter; a saving whose reason is gone is dropped
  if (has(n, 'u_stealth')){ const ok = aiStealthOk(n);
    if (N.uSave && N.uSave.t === 'stealth' && !aiStealthWant(n, inc)) N.uSave = null;
    if (ok && aiStealthSite(n) < 0 && !armiesOf(n).some(a => a.air && a.u.stealth > 0)){ const P = G.P[ownedBy(n).find(q => G.P[q].city && S.bld[q].air === 2 && !S.cons[q])];
      if (P && N.cash > buildCost(n, 'air', 3, P.id).cash + 150 && rng() < 0.3) build(n, P.id, 'air'); }
    else if (ok && aiStealthWant(n, inc) && !(N.uSave && N.uSave.until > S.hour) && rng() < 0.3) N.uSave = {t:'stealth', p:aiStealthSite(n), until:S.hour + 72}; }
  { const U = N.uSave; if (U && U.until > S.hour && UNITS[U.t]){ const c = ucost(n, U.t);
      for (const k of MKT_K){ const miss = kCeil(c[k] - N[k]); if (miss <= 0) continue; const q = miss + 5*RES_K; if (N.cash >= c.cash + lotCash(q, buyPrice(n, k)) + 20) trade(n, k, q); } } }
  for (const p of ownedBy(n)){
    if (!G.P[p].city) continue;
    if (!S.cons[p]){
      if (p === N.capital && (threatNear(p, n) ? S.bld[p].fort < (provs > 150 ? 3 : 2) : warsOf(n).length && S.bld[p].fort < 1 && N.cash > 90)) build(n, p, 'fort');
      else if (INF_NEEDS.includes('rec') && !S.bld[p].rec && N.cash > (p === N.capital ? 40 : 80) && (p === N.capital || rng() < 0.3)) build(n, p, 'rec');   // (INF_NEEDS with 'rec': infantry also needs a Recruiting Office)
      else if (!S.bld[p].fac && (p === N.capital ? N.cash > 40 : N.cash > 110 && (S.bld[p].rec || rng() < 0.15) && aiBases(n) < Math.max(2, Math.ceil(ownedBy(n).filter(p => G.P[p].city).length*AI_BASE_Q)))) build(n, p, 'fac');   // infantry and every ground unit come from an Army Base: the capital first (a capital moved after a loss gets one at once), then about one city in three (they pay nothing), Recruiting Office cities first
      else if ((has(n, 'u_jet') || has(n, 'u_int')) && !S.bld[p].air && N.cash > 140 && ownedBy(n).filter(p => S.bld[p].air).length < 2) build(n, p, 'air');
      else if (has(n, 'msl1') && p === N.capital && !S.bld[p].silo && N.cash > 260 && rng() < 0.3) build(n, p, 'silo');
      else if (canBuildHere(p, 'yard') && !S.bld[p].yard && N.cash > 170 && ownedBy(n).filter(p => S.bld[p].yard).length < 2 && rng() < 0.3) build(n, p, 'yard');
      else if (S.bld[p].yard === 1 && N.cash > 220 && rng() < 0.2 && !ownedBy(n).some(q => S.bld[q].yard >= 2)) build(n, p, 'yard');
      else if (S.bld[p].air === 1 && (has(n, 'u_asf') || has(n, 'u_bomb') || has(n, 'u_awacs')) && N.cash > 200 && rng() < (has(n, 'u_bomb') || has(n, 'u_asf') ? 0.6 : 0.4) && ownedBy(n).filter(q => S.bld[q].air >= 2).length < 2) build(n, p, 'air');   // Airbase II (up to two) for the heavy aircraft
      else if (S.bld[p].fac < 2 && N.cash > 260 && rng() < 0.25) build(n, p, 'fac');
      else if (aiRecSlow(n, p) && rng() < 0.15) build(n, p, 'rec');   // training speed is the limit here: the next Recruiting Office level
      else if (S.bld[p].air >= 1 && S.bld[p].air < 3 && N.cash > 300 + 120*S.bld[p].air && rng() < 0.2 && armiesOf(n).filter(w => w.air && w.air.base === p && count(w)).length >= 2 && armiesOf(n).some(w => w.air && w.air.base === p && (w.air.wear || 0) > 0.2)) build(n, p, 'air');   // worn wings: faster repairs
      else if ((canGrow || N.cash > 900) && N.cash > 700 && rng() < (N.cash > 1000 ? 0.2 : 0.08)){ const up = ['fac', 'air', 'yard', 'silo'].find(k => S.bld[p][k] > 0 && S.bld[p][k] < BUILD[k].max && N.cash > buildCost(n, k, S.bld[p][k] + 1, p).cash + 450); if (up) build(n, p, up); }
    }
    if (S.bld[p].silo && S.queue[p].length < 2 && N.cash > 320 && rng() < 0.25){ const k = has(n, 'msl2') && rng() < 0.4 ? 'bm' : 'cm'; if (mstock(p)[k] < 3) buildMissile(n, p, k); }
    if (p === N.capital && S.queue[p].length < 3 && (threatNear(p, n) || enemiesAt(p, n)) && canAfford(n, 'inf')) recruit(n, p, 'inf');   // capital under threat: infantry first, savings or not
    else if (p === N.capital && S.queue[p].length < 2 && warsOf(n).length && canAfford(n, 'inf') && N.cash > 60){ const keep = Math.max(4, Math.min(12, Math.round(units*0.07)));   // at war: keep the garrison topped up
      if (stationaryAt(p).filter(b => b.owner === n && !b.air).reduce((s0, b) => s0 + count(b), 0) + S.queue[p].length < keep) recruit(n, p, 'inf'); }
    const U1 = N.uSave && N.uSave.until > S.hour && (N.uSave.p == null || N.uSave.p === p) ? N.uSave : null;   // (.p: the one city this saving is for)
    if (S.queue[p].length < 2 && (canGrow || N.cash > 600 || (U1 && bldOk(p, U1.t) && canAfford(n, U1.t)))){   // a counter saved for is bought even outside growth
      const U = U1;
      const hold = U && bldOk(p, U.t) && reqsOf(U.t).some(r => r.b === 'air' && r.l >= 2) && S.queue[p].length >= 1;
      if (U && bldOk(p, U.t) && canAfford(n, U.t)){ if (recruit(n, p, U.t) !== false) N.uSave = null; }
      else if (!hold){ let t = aiPickUnit(n, p);
        if (t && !canAfford(n, t) && unlocked(n, t) && bldOk(p, t)) aiBuyFor(n, ucost(n, t), 1.3, 60);   // goods short: buy them (up to 1.3x the base price) when $60M stay spare
        if (t && !canAfford(n, t)){ if (AI_CTR.has(t) && !(N.uSave && N.uSave.until > S.hour) && unlocked(n, t)){ N.uSave = {t, until:S.hour + 24}; t = null; } else t = canMobilize(n, p, 'inf') ? null : 'inf'; }
        if (t && aiSpare(n, t, true)) recruit(n, p, t); }
    }
  }
  // idle forces per own province, packed into stacks within the stack limit (STACK_LIM): forces merge only while the result stays within it, and an
  // idle stack over the limit (an old save, units built before the limit) is split into limit-sized forces. idleBy: province -> its idle stacks
  const idleBy = new Map();
  for (const a of armiesOf(n)){ if (a.to !== null || a.path.length || a.air || S.owner[a.at] !== n || !count(a)) continue;
    let list = idleBy.get(a.at); if (!list) idleBy.set(a.at, list = []);
    const into = list.find(b => count(b) && gunsOnly(b) === gunsOnly(a) && !stackPenaltyIf(b, a).over); if (into) merge(into, a); else list.push(a); }   // (batteries stay batteries)
  removeEmpty();
  for (const list of idleBy.values()){ for (const a of list.slice()) list.push(...aiSplitToLimit(a)); }
  const idleAll = () => [...idleBy.values()].flat().filter(a => count(a) && !a.path.length && a.to === null);
  // at war the capital's infantry garrison (4-10 by army size) is set apart first: neither the offensive planner nor the idle moves below take it
  if (warsOf(n).length){ const list = idleBy.get(N.capital); if (list){ const keep = Math.min(STACK_LIM.land, Math.max(4, Math.min(12, Math.round(units*0.07)))); let got = 0;
      for (const ca of list.filter(x => !x.air && !shipsOnly(x) && x.u.inf > 0).sort((x, y) => y.u.inf - x.u.inf || x.id - y.id)){ if (got >= keep) break; const g = Math.min(ca.u.inf, keep - got);
        if (count(ca) - g >= 4){ const [b] = splitPlan(ca, [aiTakePlan(ca, 'inf', g)]); if (b) got += b.u.inf; }   // the garrison is the new force (not in the idle lists)
        else { got += ca.u.inf; list.splice(list.indexOf(ca), 1); } } } }
  // badly damaged units (the split panel's damaged rows, below 45%) leave idle field stacks for the nearest own city within 4 provinces, where they heal 2.5× faster
  if (rng() < 0.5) for (const a of idleAll()){ if (count(a) < 4 || G.P[a.at].city || G.P[a.at].sea || S.battles.includes(a.at) || enemiesAt(a.at, n)) continue;
    const dr = splitRows(a).filter(r => r.dmg && r.hf < 0.45); if (!dr.length || dr.reduce((s0, r) => s0 + r.n, 0) >= count(a)) continue;
    const seen = new Map([[a.at, 0]]), q = [a.at]; let city = -1;
    for (let h = 0; h < q.length && city < 0; h++){ const u = q[h], du = seen.get(u); if (du >= 4) continue; for (const v of G.P[u].nbs){ if (seen.has(v) || G.P[v].sea || S.owner[v] !== n) continue; seen.set(v, du + 1); if (G.P[v].city && !S.battles.includes(v)){ city = v; break; } q.push(v); } }
    if (city < 0) continue; const pth = pathFor(a, a.at, city); if (!pth.length || pth.length > 5) continue;
    const [b] = splitPlan(a, [Object.fromEntries(dr.map(r => [r.k, r.n]))]); if (b){ b.path = pth; b.forced = true; } }
  const targeted = new Set(armiesOf(n).filter(a => a.path.length).map(a => a.path[a.path.length - 1]));
  // the nations world: independent provinces it may still go for (TIER_FREE times its start, less what it holds and the independent ones already marched on)
  let freeLeft = Infinity; if (tiered() && N.prov0){ freeLeft = Math.floor(TIER_FREE*tierGrow(S.hour)*N.prov0) - provs; for (const v of targeted) if (S.owner[v] < 0 && S.home[v] !== n) freeLeft--; }
  const sated = tiered() && N.prov0 && provs >= TIER_SATED*tierGrow(S.hour)*N.prov0;   // grown enough for now (isSated): only its own lost land is a target
  // (and the columns already marching on foreign land stop where they are: in step 4 a Kenya sated on day 17 marched on through DR Congo to
  // three times its start, along paths given before)
  if (sated) for (const a of armiesOf(n)) if (a.path.length && !a.air && !a.forced && !G.P[a.at].sea){ const last = a.path[a.path.length - 1];
    if (S.owner[last] !== n && S.home[last] !== n){ a.path = []; a.dest = null; targeted.delete(last); } }
  const planned = aiOperate(n, idleAll().filter(a => !a.air && !shipsOnly(a) && !gunsOnly(a) && !G.P[a.at].sea && S.owner[a.at] === n && (a.m ?? 80) >= 50));
  const ready = [];   // stacks free for an offensive of their own
  for (const a of idleAll()){
    if (planned.has(a) || enemiesAt(a.at, n) || a.air) continue;
    if (shipsOnly(a)){ if (a.escort == null && !a.raid && !a.blk && !a.sail) aiFleet(a, n); continue; }
    if (G.P[a.at].sea || (S.owner[a.at] !== n && !atWar(n, S.owner[a.at]))){
      // stranded at sea or in land it may not fight in: head to the nearest own province
      const seen = new Set([a.at]), q = [a.at]; let dest = -1;
      for (let h = 0; h < q.length && dest < 0; h++) for (const v of G.P[q[h]].nbs){ if (seen.has(v) || !canEnter(n, v)) continue; seen.add(v); if (S.owner[v] === n){ dest = v; break; } q.push(v); }
      if (dest >= 0) a.path = pathFor(a, a.at, dest);
      continue;
    }
    if (S.owner[a.at] !== n){   // land it is taking: a force standing off the province's heart (after a clash on the road) walks to the city, which takes it
      if (!a.sail && !S.battles.includes(a.at) && capturable(n, a.at) && !atHeart(a) && ground(a)) orderSpot(a, G.P[a.at].x, G.P[a.at].y); continue; }
    if (a.at === N.capital && threatNear(a.at, n)) continue;
    if ((a.m ?? 80) < 50 || (a.resting && a.m < 70)){ a.resting = true; continue; } a.resting = false;
    if (gunsOnly(a)) continue;   // batteries fire from range (aiGuns), they do not march into battles
    ready.push(a); }
  // offensives: the ready stacks of one province pick a target together (their summed strength), and stacks standing next to that target in other own
  // provinces join from their own side. Each stack stays within the stack limit; they go in from several directions (the target's own neighbours),
  // and the quicker ones wait (a.delay) so that all arrive within a few hours of each other. Stacks left over pick a further target.
  const used = new Set(), byAt = new Map(); for (const a of ready){ let l = byAt.get(a.at); if (!l) byAt.set(a.at, l = []); l.push(a); }
  for (const [p0, grp0] of byAt){ let left = grp0.filter(a => !used.has(a));
    for (let round = 0; round < 3 && left.length; round++){
      const pw = left.reduce((s0, a) => s0 + power(a)*stackDmg(a), 0); if (pw < 14) break;
      const lead = left.reduce((x, y) => power(y) > power(x) ? y : x, left[0]);
      const maxD = warsOf(n).length ? 10 : 7, fw = fitW(lead), cold = !arctic(n), fc = {}, foc = focusOf(n);
      const fitAt = v => { const k = G.P[v].terrain || 'plains'; return fc[k] ?? (fc[k] = fitOf(fw, k, true, cold)); };
      const best = aiTarget(n, p0, maxD, pw, targeted, sated, freeLeft, fitAt, foc);
      if (best < 0) break;
      // the capital keeps a garrison when the force there marches out: two infantry in peace (at war the garrison was set apart above)
      if (p0 === N.capital && !warsOf(n).length && round === 0){ const g0 = left.find(a => (a.u.inf || 0) >= 4); if (g0){ addArmy(n, p0, {inf:2}); g0.u.inf -= 2; } }
      // the force: strongest stacks first, until about twice what the target needs (the rest stay for another target), then helpers from other sides
      const need = defPower(best, n)*1.3 + 4, go = []; let sent = 0;
      for (const a of left.slice().sort((x, y) => power(y) - power(x) || x.id - y.id)){ if (sent >= need*2) break; go.push(a); sent += power(a)*stackDmg(a); }
      if (sent < need*2.5) for (const v of G.P[best].nbs){ if (v === p0 || S.owner[v] !== n || G.P[v].sea) continue;
        for (const a of byAt.get(v) || []){ if (used.has(a) || sent >= need*2.5) continue; go.push(a); sent += power(a)*stackDmg(a); } }
      // approaches: the natural last step first, then the target's other own (or weakly held hostile) neighbours
      const direct = new Map(go.map(a => [a, pathFor(a, a.at, best)])); if (!direct.get(go[0]).length){ targeted.add(best); continue; }   // (no route: try another target)
      const nat = (pth, a) => pth.length > 1 ? pth[pth.length - 2] : a.at;
      const sides = [nat(direct.get(go[0]), go[0])]; for (const w of G.P[best].nbs){ if (sides.includes(w) || G.P[w].sea) continue; if (S.owner[w] === n || (S.owner[w] >= 0 && atWar(n, S.owner[w]) && defPower(w, n) < sent*0.15)) sides.push(w); }
      const legs = []; let k = 0;
      for (const a of go){ used.add(a); let pth = direct.get(a); if (!pth.length || !aiGunsStay(a, best)) continue;   // (guns that can shell the target stay behind)
        const own = a.at !== p0 && G.P[best].nbs.includes(a.at);   // a helper next to the target attacks from where it stands
        if (!own && go.length > 1){ const w = sides[k++ % Math.min(3, sides.length)]; if (w !== nat(pth, a)){ const alt = w === a.at ? [] : pathFor(a, a.at, w); if ((alt.length || w === a.at) && alt.length + 1 <= pth.length + 3) pth = alt.concat([best]); } }
        a.path = pth; legs.push([a, etaHours(a, pth)]); }
      if (legs.length){ targeted.add(best); if (S.owner[best] < 0 && S.home[best] !== n) freeLeft--; }
      const slow = Math.max(0, ...legs.map(e => e[1])); for (const [a, h] of legs) if (slow - h >= 3) a.delay = Math.min(36, Math.round(slow - h));
      left = left.filter(a => !used.has(a)); } }
  // the rest spread out: a province holding more than two idle stacks sends the extra ones to nearby own provinces (front line first) that hold fewer
  const stacksAt = new Map(); for (const a of armiesOf(n)) if (!a.air && ground(a) && count(a)){ const p = a.path.length ? a.path[a.path.length - 1] : a.to ?? a.at; stacksAt.set(p, (stacksAt.get(p) || 0) + 1); }
  for (const [p0, list] of idleBy){ const rest = list.filter(a => count(a) && !used.has(a) && !planned.has(a) && !a.path.length && a.to === null && ground(a) && !shipsOnly(a)); if (rest.length <= 2 || S.battles.includes(p0) || enemiesAt(p0, n) || (G.P[p0].city && threatNear(p0, n))) continue;   // a threatened city keeps its stacks
    const front = v => G.P[v].nbs.some(w => !G.P[w].sea && S.owner[w] >= 0 && S.owner[w] !== n && (atWar(n, S.owner[w]) || (AI_STARTS_WARS && !warsOf(n).length))) || (!AI_STARTS_WARS && aiBorderThreat(n, v));
    const seen = new Map([[p0, 0]]), q = [p0], cand = [];
    for (let h = 0; h < q.length; h++){ const u = q[h], du = seen.get(u); if (du >= 2) continue; for (const v of G.P[u].nbs){ if (seen.has(v) || G.P[v].sea || S.owner[v] !== n) continue; seen.set(v, du + 1); q.push(v); if (!S.battles.includes(v)) cand.push(v); } }
    for (const a of rest.slice(2)){ let bv = -1e9, dst = -1; for (const v of cand){ const c = stacksAt.get(v) || 0; if (c >= 2) continue; const sc = (front(v) ? 2 : 0) + (G.P[v].city ? 0.5 : 0) - seen.get(v)*0.4 - c; if (sc > bv){ bv = sc; dst = v; } }
      if (dst < 0) break; const pth = pathFor(a, a.at, dst); if (!pth.length) continue; a.path = pth; stacksAt.set(dst, (stacksAt.get(dst) || 0) + 1); stacksAt.set(p0, (stacksAt.get(p0) || 1) - 1); } }
  aiGuns(n);   // batteries and fleets: firing spots
}
/* Ranged units (rules/combat.js rangedStep: guns and warships fire at what they can see within their range). The AI fires from range and keeps its guns
   out of the battles: a battery (a force of land guns only) or an idle fleet takes a firing spot in its own province (or sea zone) from which the
   strongest enemy force it can see is within 90% of its range, as far back from that force as the range allows; a stack sent to attack leaves its
   guns behind on such a spot when they can shell the target's defenders from there, and an idle stack on the front turns its guns into such a
   battery when an enemy force they can see is in reach; a battery with nothing in reach moves up to an own front province (one held by its own
   troops first). Batteries are not merged into other stacks, sent on offensives or used as front reinforcements. */
const gunsOnly = a => !a.air && !a.fly && count(a) > 0 && UT.every(t => !a.u[t] || RANGE_HIT[t] === 'land');
// the spot in province p (its point or a cell centre) from which force a can fire at the strongest of the enemy forces `foes` (default: those it can
// see) within 90% of its range, the farthest from that force: {x, y, b}; null when none is in reach from anywhere in p
function aiFireSpot(a, p, foes = null){ const R = rangedOf(a); if (!R.length) return null; const P = G.P[p], spots = [[P.x, P.y], ...P.cells.map(cellCenter)];
  let rad = 0; for (const q of spots) rad = Math.max(rad, kmBetween(q[0], q[1], P.x, P.y));
  const mx = R.reduce((m, e) => Math.max(m, e[2]), 0)*0.9, vis = foes ? null : visibleSet(a.owner), C = [];
  for (const b of foes || S.armies){ if (!rangedFoe(a.owner, b)) continue; const [bx, by] = armyXY(b); if (kmBetween(P.x, P.y, bx, by) > mx + rad) continue;
    const r = R.reduce((m, e) => rangedHits(e[0], b) ? Math.max(m, e[2]*0.9) : m, 0); if (!r || (vis && !armyVisible(b, vis))) continue; C.push([b, bx, by, r]); }
  C.sort((x, y) => power(y[0]) - power(x[0]) || x[0].id - y[0].id);
  for (const [b, bx, by, r] of C){ let best = null, bd = -1; for (const q of spots){ const d = kmBetween(q[0], q[1], bx, by); if (d <= r && d > bd){ bd = d; best = q; } } if (best) return {x:best[0], y:best[1], b}; }
  return null; }
// stand force a on spot sp (a firing spot in its own province or sea zone), fire at will (what its side sees changes with it)
function aiSetSpot(a, sp){ const at = a.sail ? a.sail.to : a.pos; if (!at || Math.abs(at[0] - sp.x) > 1e-6 || Math.abs(at[1] - sp.y) > 1e-6){ if (shipsOnly(a) && G.P[a.at].sea) orderSpot(a, sp.x, sp.y); else a.pos = [sp.x, sp.y]; visCache = null; } a.fire = 'free'; }   // (a fleet sails there: rules/movement.js orderSpot)
// a stack sent to attack province t leaves its land guns behind on a firing spot in its own province when they can shell the defenders of t from
// there: the stack that marches (null when it was all guns and stays, on the spot)
function aiGunsStay(a, t){ if (a.air || a.to !== null || G.P[a.at].sea || S.owner[a.at] !== a.owner || shipsN(a)) return a;
  const g = {}; let gn = 0; for (const k of UT) if (a.u[k] && RANGE_HIT[k] === 'land'){ g[k] = a.u[k]; gn += a.u[k]; } if (!gn) return a;
  const foes = S.armies.filter(b => b.at === t && b.to === null && rangedFoe(a.owner, b)); if (!foes.length) return a;   // nobody to shell: the guns go along
  const sp = aiFireSpot({owner:a.owner, at:a.at, u:g, air:null, fly:null}, a.at, foes); if (!sp) return a;
  if (gn >= count(a)){ aiSetSpot(a, sp); return null; }
  if (groundN(a) - gn < CAP_MIN) return a;   // (the rest must still be able to take the province)
  const plan = {}; for (const k in g) Object.assign(plan, aiTakePlan(a, k, g[k])); const [bat] = splitPlan(a, [plan]); if (bat) aiSetSpot(bat, sp);
  return a; }
// each AI turn: batteries and idle fleets take firing spots; batteries with nothing in reach move up to the front
function aiGuns(n){ if (!warsOf(n).length) return;
  for (const a of S.armies.slice()){ if (a.owner !== n || a.air || a.fly || a.to !== null || a.path.length || !count(a) || S.battles.includes(a.at)) continue;
    const fleet = shipsOnly(a); if (fleet ? a.escort != null || a.raid || a.blk || a.sail || !G.P[a.at].sea || healthFrac(a) < 0.5 : S.owner[a.at] !== n) continue;
    if (!fleet && !gunsOnly(a)){   // a mixed stack on the front: its guns become a battery on a firing spot when an enemy force they can see is in reach
      const g = {}; let gn = 0; for (const k of UT) if (a.u[k] && RANGE_HIT[k] === 'land'){ g[k] = a.u[k]; gn += a.u[k]; }
      if (!gn || groundN(a) - gn < CAP_MIN || !G.P[a.at].nbs.some(w => !G.P[w].sea && S.owner[w] >= 0 && atWar(n, S.owner[w]))) continue;
      const sp = aiFireSpot({owner:n, at:a.at, u:g, air:null, fly:null}, a.at); if (!sp) continue;
      const plan = {}; for (const k in g) Object.assign(plan, aiTakePlan(a, k, g[k])); const [bat] = splitPlan(a, [plan]); if (bat) aiSetSpot(bat, sp); continue; }
    if (!rangeOf(a)) continue;
    const sp = aiFireSpot(a, a.at); if (sp){ aiSetSpot(a, sp); continue; }
    if (fleet) continue;   // (aiFleet takes fleets to an enemy coast)
    const front = v => G.P[v].nbs.some(w => !G.P[w].sea && S.owner[w] >= 0 && atWar(n, S.owner[w]));
    if (front(a.at)) continue;   // already at the front: it waits there for a target
    const seen = new Map([[a.at, 0]]), q = [a.at]; let dst = -1, guarded = false;
    for (let h = 0; h < q.length && !guarded; h++){ const u = q[h], du = seen.get(u); if (du >= 4) continue;
      for (const v of G.P[u].nbs){ if (seen.has(v) || G.P[v].sea || S.owner[v] !== n) continue; seen.set(v, du + 1); q.push(v);
        if (!front(v) || S.battles.includes(v)) continue; const g0 = armiesOf(n).some(b => b.at === v && b.to === null && !b.air && !gunsOnly(b) && groundN(b) >= 3);
        if (dst < 0 || (g0 && !guarded)){ dst = v; guarded = g0; if (g0) break; } } }
    if (dst >= 0){ const pth = pathFor(a, a.at, dst); if (pth.length && pth.length <= 5) a.path = pth; } } }
// (AI_STARTS_WARS false) a border with a nation at peace is no front: the computer stages nothing there and moves no reserves up to it (Canada
// massed on the United States border by day 5 with the old rule). It may defend its borders: an own province next to a foreign force (not an ally's)
// stronger than its own there, 1.2 times and over 20, counts as a front for its spare stacks
function aiBorderThreat(n, v){ const pp = provPowers(); let mine = 0, foe = 0; for (const [o, pw] of pp.get(v) || []) if (o === n) mine += pw;
  for (const w of G.P[v].nbs){ if (G.P[w].sea || S.owner[w] === n) continue; for (const [o, pw] of pp.get(w) || []) if (o >= 0 && o !== n && rel(n, o).st !== 'ally') foe += pw; }
  return foe > 20 && foe > mine*1.2; }
// the healthiest k units of type t of force a, as a split plan (row keys, see splitRows)
function aiTakePlan(a, t, k){ const g = {}; for (const r of splitRows(a).filter(r0 => r0.t === t).sort((x, y) => y.hf - x.hf)){ if (k <= 0) break; const v = Math.min(r.n, k); g[r.k] = v; k -= v; } return g; }
// a force over its stack limit split into limit-sized forces (the new ones are returned; the force itself keeps one share)
function aiSplitToLimit(a){ const z = stackSizes(a), need = Math.max(Math.ceil(z.land/STACK_LIM.land), Math.ceil(z.sea/STACK_LIM.sea));
  if (need < 2 || a.air) return [];
  const plan = Array.from({length:need - 1}, () => ({})); let off = 0;   // evenly, every unit type spread over the shares (as evenPlan, without its limit of 8)
  for (const r of splitRows(a)){ const base = Math.floor(r.n/need), ex = r.n % need; for (let gi = 0; gi < need; gi++){ const v = base + (((gi - off) % need + need) % need < ex ? 1 : 0); if (gi > 0 && v) plan[gi - 1][r.k] = v; } off = (off + ex) % need; }
  return splitPlan(a, plan); }
