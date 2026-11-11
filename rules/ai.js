// Iron Meridian rules: ai. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
// AI: escort its own threatened routes, raid its enemies' trade with submarines and warships
function aiTrade(n){ const T = S.trade; if (!T || !S.nations[n].alive) return; const mine = T.routes.filter(r => trMine(r, n) && r.kind === 'sea');
  const fleets = S.armies.filter(a => a.owner === n && shipsOnly(a) && a.to === null && !a.path.length && count(a) && !S.battles.includes(a.at));
  for (const a of fleets){ if (healthFrac(a) < 0.5 && (a.escort != null || a.raid)){ delete a.escort; delete a.raid; const y = G.P.find(P => S.owner[P.id] === n && S.bld[P.id].yard); if (y) a.path = pathFor(a, a.at, y.id); } }
  // 1. escort the most valuable routes raided in the last three days or blockaded now
  const threat = mine.filter(r => S.hour - r.raid < 72 || r.f < 1).sort((x, y) => (trSide(y, n) || {cash:0}).cash - (trSide(x, n) || {cash:0}).cash);
  for (const r of threat.slice(0, 2)){ if (S.armies.some(a => a.owner === n && a.escort === r.id)) continue; let pick = null, bd = 1e9;
    for (const a of fleets){ if (a.escort != null || a.path.length || healthFrac(a) < 0.5 || !(a.u.frig || a.u.crui)) continue; const d = hexDist(G.P[a.at].cc, G.P[r.path[Math.floor(r.path.length/2)]].cc); if (d < bd && d < 40){ bd = d; pick = a; } }
    if (pick){ pick.escort = r.id; delete pick.raid; } }
  // 2. raid: at war, idle fleets with submarines or frigates hunt enemy convoys within reach (half of them at most while own trade is threatened)
  // a raid ends when the route is gone or at peace, or after six quiet days on station (then the fleet looks for a better hunting ground)
  for (const a of fleets) if (a.raid && (!routeById(a.raid.r) || !trHostile(routeById(a.raid.r), n) || (a.raid.t != null && S.hour - a.raid.t > 24*6 && S.hour - routeById(a.raid.r).raid > 24*3))) delete a.raid;
  if (!warsOf(n).length) return;
  const foe = T.routes.filter(r => r.kind === 'sea' && !trMine(r, n) && trHostile(r, n)); if (!foe.length) return;
  const zv = new Map(); for (const r of foe){ const v = ((r.va ? r.va.cash : 0) + (r.vb ? r.vb.cash : 0)); for (const z of r.path) zv.set(z, (zv.get(z) || 0) + v); }
  let raiding = fleets.filter(a => a.raid).length; const cap = Math.max(1, Math.ceil(fleets.length*(threat.length ? 0.5 : 0.7)));
  for (const a of fleets){ if (raiding >= cap) break; if (a.escort != null || a.raid || a.path.length || healthFrac(a) < 0.6 || !(a.u.sub || a.u.frig || a.u.crui)) continue;
    if (!G.P[a.at].sea && rng() < 0.4) continue;   // some fleets keep the old coastal patrol duty
    const pw = navPw(a), seen = new Map([[a.at, 0]]), q = [a.at]; let best = -1, bs = 0;
    for (let h = 0; h < q.length; h++){ const u = q[h], du = seen.get(u); if (du >= 14) continue;
      for (const v of G.P[u].nbs){ if (seen.has(v) || !G.P[v].sea) continue; seen.set(v, du + 1); q.push(v); const val = zv.get(v); if (!val) continue;
        let guard = 0; for (const w of [v, ...G.P[v].nbs]) for (const x of SEAA.get(w) || []) if (x.owner >= 0 && atWar(n, x.owner)) guard += navPw(x);
        if (guard > pw*1.2) continue; const sc = val/(1 + du*0.25)*(a.u.sub ? 1.2 : 1); if (sc > bs){ bs = sc; best = v; } } }
    if (best < 0) continue; const p = best === a.at ? [] : pathFor(a, a.at, best); if (best !== a.at && !p.length) continue;
    a.path = p; a.raid = {r:foe.find(r => r.path.includes(best)).id, z:best, t:S.hour}; raiding++; } }
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
  for (const a of S.armies){ if (a.owner !== n || !a.air || a.fly || (a.air.cd || 0) > 0 || !count(a)) continue;
    // maintenance: worn or damaged wings stand down; where nothing repairs them they fly back to the best own airbase in reach
    if (wingCond(a) < WEAR_WARN + 0.05) a.air.mnt = 1; else if (a.air.mnt && (wingCond(a) >= 0.85 || maintRate(a) <= 0)) delete a.air.mnt;
    if (healthFrac(a) < 0.5 || a.air.mnt){ if (maintRate(a) < 0.12){ const mb = maintBase(a); if (mb >= 0) orderAir(a, mb); } continue; }
    const r = wingRange(a)*(wingCond(a) < 0.7 ? 0.6 : 1), B = G.P[a.air.base], T = wingT(a);
    if (T === 'drone'){ if (!warsOf(n).length) continue; const tg = aiReconTarget(n, B, r); if (tg >= 0) orderAir(a, tg); continue; }
    if (T === 'awacs'){ if (!warsOf(n).length) continue; const tg = aiOrbitTarget(n, B, r); if (tg >= 0) orderAir(a, tg); continue; }
    if (T === 'mpa'){ const tg = aiSeaHunt(n, B, r); if (tg >= 0) orderAir(a, tg); continue; }
    if (T === 'bomb'){ const tg = aiBombTarget(n, B, r); if (tg >= 0) orderAir(a, tg); else aiForward(n, a, B, r); continue; }
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
  const m = wars[Math.floor(rng()*wars.length)], provs = G.P.filter(P => S.owner[P.id] === m && !P.sea); if (!provs.length) return;
  const P = provs[Math.floor(rng()*provs.length)], op = S.home[P.id] !== m ? 'incite' : BK.some(k => S.bld[P.id][k]) ? 'sabotage' : 'steal';
  startSpy(n, P.id, op);
}
/* ---------------- AI ---------------- */
let PPC = {v:-1, m:null};
function provPowers(){ if (PPC.v !== tickVer || PPC.S !== S){ const m = new Map(); for (const a of S.armies){ if (a.to !== null || a.fly) continue; let e = m.get(a.at); if (!e) m.set(a.at, e = []); e.push([a.owner, power(a)]); } PPC = {v:tickVer, S, m}; } return PPC.m; }
function defPower(p, n){
  let d = 0; for (const [o, pw] of (provPowers().get(p) || [])) if (o !== n) d += pw;
  if (S.owner[p] !== n){ d *= 1.25/Math.pow(0.8, S.bld[p].fort)*(G.P[p].sea ? 1 : terr(p).def); }   // the AI reads terrain: dug in on a mountain counts for more
  return d;
}
function threatNear(p, n){ return G.P[p].nbs.some(v => S.armies.some(a => a.at === v && a.owner >= 0 && atWar(n, a.owner) && count(a) > 0)); }
const EMC = {};
function enemyMix(n){
  const ck = EMC[n]; if (ck && ck.v === tickVer && ck.S === S) return ck.r;
  const r = enemyMix0(n); EMC[n] = {v:tickVer, S, r}; return r;
}
function enemyMix0(n){
  const m = {soft:0, armored:0, air:0, naval:0}, c = {drone:0, bomb:0, sub:0, ad:0, sup:0, all:0}; let mm = 0;
  for (const a of S.armies){ if (a.owner < 0 || !atWar(n, a.owner)) continue; for (const t of UT){ const k = a.u[t]; if (!k) continue; m[UNITS[t].cls] += k*UNITS[t].hp; if (UNITS[t].cls === 'air' && !UNITS[t].dr) mm += k*UNITS[t].hp; const v = k*UNITS[t].cost/(UNITS[t].pack || 1); c.all += v;
      if (UNITS[t].dr) c.drone += v; else if (t === 'bomb') c.bomb += v; else if (t === 'sub') c.sub += v; else if (t === 'sam' || t === 'jam') c.ad += v; else if (t === 'awacs' || t === 'mpa') c.sup += v; } }
  const tot = m.soft + m.armored + m.air + m.naval || 1, ct = c.all || 1;
  // cost shares of the kinds the counter-picks care about: drones, bombers, subs, air defence (SAM + jammers), support aircraft
  // airm: manned aircraft only (drones have their own counters: jammers, SAMs; counted in 'drone')
  return {soft:m.soft/tot, armored:m.armored/tot, air:m.air/tot, airm:mm/tot, naval:m.naval/tot, drone:c.drone/ct, bomb:c.bomb/ct, sub:c.sub/ct, ad:c.ad/ct, sup:c.sup/ct};
}
// how rough the ground is where this nation fights (enemy and foreign land next to its own): 0 open steppe .. 1 marsh and mountains
const FRC = {};
function frontRough(n){ const d = Math.floor(S.hour/24), ck = FRC[n]; if (ck && ck.d === d && ck.S === S) return ck.r;
  const wars = warsOf(n), seen = new Set(); let s = 0, c = 0;
  for (let p = 0; p < G.P.length; p++){ if (S.owner[p] !== n || G.P[p].sea) continue; for (const v of G.P[p].nbs){ if (seen.has(v) || G.P[v].sea || S.owner[v] === n) continue; if (wars.length && !wars.includes(S.owner[v])) continue; seen.add(v); s += rough(G.P[v].terrain); c++; } }
  const r = c ? s/c : 0; FRC[n] = {d, S, r}; return r; }
// aircraft counts per type a nation fields (cached per tick: aiPickUnit runs for every city)
let AIRM = {v:-1, S:null, m:new Map()};
function airMine(n){ if (AIRM.v !== tickVer || AIRM.S !== S) AIRM = {v:tickVer, S, m:new Map()}; let m = AIRM.m.get(n); if (m) return m; m = {};
  for (const a of S.armies) if (a.owner === n && a.air) for (const t of AIR_T) if (a.u[t]) m[t] = (m[t] || 0) + a.u[t]; AIRM.m.set(n, m); return m; }
const AI_SCARCE = ['iron', 'elec', 'rare'];
function aiPickUnit(n, p){
  const mix = enemyMix(n), am = mix.airm ?? mix.air, w = {inf:4, at:1 + 6*mix.armored, art:1.5, sam:0.3 + 8*am + 3*mix.drone, ifv:1.2, tank:2.2, jet:2.6 + 3*mix.armored, int:1.2 + 6*am, frig:1.2, sub:0.5 + 4*mix.naval, crui:0.8};
  // terrain counter-pick: rough fronts (forest, hills, mountains, marsh, ice) want infantry and special forces, open ones armor
  { const rg = frontRough(n); w.tank *= 1 - 0.5*rg; w.ifv *= 1 - 0.5*rg; w.inf *= 1 + 0.5*rg; w.art *= 1 - 0.2*rg; w.spec = 0.3 + 2.2*rg; }
  // trade war: convoys sunk lately want frigates (escorts); enemy trade routes in the world invite submarines (raiders)
  const trHit = S.trade ? Math.min(4, S.trade.hit[n] || 0) : 0, foeTr = S.trade && warsOf(n).length ? S.trade.routes.filter(r => r.kind === 'sea' && !trMine(r, n) && trHostile(r, n)).length : 0;
  w.frig += 1.3*trHit; w.crui += 0.3*trHit; w.sub += 0.2*Math.min(8, foeTr);
  let allU = 0, jamN = 0; { let ships = 0; for (const a of S.armies) if (a.owner === n){ ships += shipsN(a); allU += count(a); jamN += a.u.jam || 0; } if (ships > allU*(trHit >= 1 ? 0.28 : 0.2)){ w.frig = w.sub = w.crui = 0; } }
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
    const manned = ['int', 'asf', 'jet', 'bomb', 'awacs', 'mpa', 'heli'].reduce((s0, t) => s0 + (mine[t] || 0), 0);
    if (manned > Math.max(4, allU*(H.bomb + H.air > 1 ? 0.16 : 0.1))){ const quota = {asf:H.bomb + H.air > 0 ? 6 : 4, awacs:1, mpa:2};
      for (const t of ['int', 'asf', 'jet', 'awacs', 'mpa', 'heli']) if (!((mine[t] || 0) < (quota[t] || 0))) w[t] = (w[t] || 0)*0.25; w.sam *= 0.7; } }
  { const N = S.nations[n], inc = income(n); if (inc.net.oil < 0 || (N.short && N.short.oil)){ w.tank *= 0.3; w.jet *= 0.3; w.int *= 0.5; w.crui *= 0.5; w.ifv *= 0.5; w.bomb *= 0.2; w.asf *= 0.5; w.mpa *= 0.5; w.awacs *= 0.5; }
    else if (N.oil > 450 && inc.net.oil > 4){ w.tank *= 1.35; w.ifv *= 1.35; w.jet *= 1.3; w.frig *= 1.2; w.crui *= 1.2; } }   // fuel to spare: more of the units that burn it
  { const N = S.nations[n], inc = income(n);   // iron or electronics running out (a shortage, or maintenance eating the last two weeks of stock): fewer of the units that use most of it
    for (const k of ['iron', 'elec']){ const d = -inc.net[k]; if (!((N.short && N.short[k]) || (d > 0 && N[k] < 14*d))) continue; for (const t in w) if (MAINT[t]) w[t] *= MAINT[t][k] >= (k === 'iron' ? 0.24 : 0.12) ? 0.3 : MAINT[t][k] > 0 ? 0.65 : 1.15; } }   // the heavy users: 6 or more of it in the price
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
  if (P0 && S.owner[P0.tgt] !== n && atWar(n, S.owner[P0.tgt] ?? -1) && S.hour - P0.made < 24*8) return P0;
  const wars = warsOf(n); if (!wars.length){ delete S.plans[n]; return null; }
  const foe = focusOf(n) != null && wars.includes(focusOf(n)) ? focusOf(n) : wars.slice().sort((x, y) => natPower(x) - natPower(y))[0];
  let best = null, bv = 0;
  for (const P of G.P){ if (P.sea || S.owner[P.id] !== foe) continue; const stage = P.nbs.filter(v => S.owner[v] === n && !G.P[v].sea); if (!stage.length) continue;
    const v = (P.city ? 3 : 1) + (isCapital(P.id) ? 4 : 0) + (P.oil ? 1 : 0) + stage.length*0.6, dp = defPower(P.id, n), rx = stage.filter(s0 => riverX(s0, P.id)).length/stage.length, sc = v/(8 + dp)*(1 - 0.2*rx); if (sc > bv){ bv = sc; best = {tgt:P.id, stage, foe, made:S.hour}; } }
  if (best) S.plans[n] = best; else delete S.plans[n]; return best; }
function aiOperate(n, idle){ const plan = aiPlan(n), N = S.nations[n], used = new Set();
  // 1. front defence: send the nearest idle reserve to an own border province that faces a much stronger enemy stack
  for (const P of G.P){ if (P.sea || S.owner[P.id] !== n) continue; let threat = 0; for (const v of P.nbs){ if (S.owner[v] >= 0 && atWar(n, S.owner[v])) threat += stationaryAt(v).filter(b => b.owner === S.owner[v]).reduce((s0, b) => s0 + power(b), 0); }
    if (P.id === N.capital){ const r2 = new Set(); for (const v of P.nbs) for (const w of G.P[v].nbs) if (w !== P.id && !P.nbs.includes(w)) r2.add(w);   // and the ring beyond, at 60%
      for (const b of S.armies) if (r2.has(b.at) && b.owner >= 0 && b.owner !== n && !b.air && atWar(n, b.owner) && count(b)) threat += 0.6*power(b); }
    if (P.city && S.battles.includes(P.id)) threat += stationaryAt(P.id).filter(b => b.owner >= 0 && atWar(n, b.owner)).reduce((s0, b) => s0 + power(b), 0)*1.5;   // a city already under attack
    // the capital is defended against any raid (small strike groups now race along captured rail lines), and from further away
    const capP = P.id === N.capital; if (threat < (capP ? 5 : 20)) continue; const here = stationaryAt(P.id).filter(b => b.owner === n).reduce((s0, b) => s0 + power(b), 0) + S.armies.filter(b => b.owner === n && b.path.length && b.path[b.path.length - 1] === P.id).reduce((s0, b) => s0 + power(b), 0);
    if (here >= threat*(capP ? 1.4 : 0.8)) continue;
    let pick = null, bd = 1e9; for (const a of idle){ if (used.has(a) || a.at === P.id || a.at === N.capital && threatNear(a.at, n) || power(a) < (capP ? 6 : 10)) continue; const d = hexDist(G.P[a.at].cc, P.cc); if (d < bd && d <= (capP ? 16 : 8)){ bd = d; pick = a; } }
    if (pick){ const pth = pathFor(pick, pick.at, P.id); if (pth.length){ pick.path = pth; used.add(pick); } } }
  if (!plan) return used;
  // 2. gather at the staging provinces, then strike together from every side once strong enough
  const stage = plan.stage.filter(v => S.owner[v] === n); if (!stage.length){ delete S.plans[n]; return used; }
  const atStage = S.armies.filter(a => a.owner === n && !a.air && a.to === null && !a.path.length && stage.includes(a.at) && count(a));
  const massed = atStage.reduce((s0, a) => s0 + power(a)*terrFit(a, plan.tgt, true)*(riverX(a.at, plan.tgt) ? RIVER_ATK : 1), 0), need = defPower(plan.tgt, n)*1.5 + 10;
  if (massed >= need){ for (const a of atStage){ orderMove(a, plan.tgt); used.add(a); } plan.launched = S.hour;
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
  const np = S.owner.filter(o => o === n).length; if (np < 3 || linkProjects(n) >= (np > 80 ? 2 : 1)) return 'busy';
  const inc = income(n); if (inc.net.cash < 2) return 'income';
  const mine = v => S.owner[v] === n, fronts = [], cities = [];
  for (const P of G.P){ if (P.sea || !mine(P.id) || P.id === N.capital) continue;
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
function aiBomberWant(n, provs, inc){ if (!has(n, 'bomb1') || !warsOf(n).length || inc.net.oil < -2) return 0;
  if (!G.P.some(P => S.owner[P.id] === n && P.city && S.bld[P.id].air >= 2 && !bdis(P.id, 'air'))) return 0;
  const goal = provs > 160 ? 4 : provs > 70 ? 3 : 2, have = (airMine(n).bomb || 0) + S.queue.reduce((s0, q, pp) => s0 + (S.owner[pp] === n ? q.filter(j => j.t === 'bomb').length : 0), 0);
  return Math.max(0, goal - have); }
// Air Superiority Fighters wanted: with the research and an Airbase II, at war with powers that fly bombers, AWACS, patrol planes or drones
// (or hit by air), a small fighter force: 2 + up to 4 more with the threat, bigger empires a little more
function aiAsfWant(n, provs, inc){ if (!has(n, 'asf1') || !warsOf(n).length || inc.net.oil < -2) return 0;
  if (!G.P.some(P => S.owner[P.id] === n && P.city && S.bld[P.id].air >= 2 && !bdis(P.id, 'air'))) return 0;
  const mx = enemyMix(n), H = (S.airHit && S.airHit[n]) || {drone:0, bomb:0, air:0}, thr = 18*mx.bomb + 14*mx.sup + 6*mx.drone + 4*(mx.airm || 0) + (H.bomb + H.air > 0 ? 1.5 : 0);
  if (thr < 0.4) return 0;
  const goal = Math.min(provs > 160 ? 8 : 6, 2 + Math.round(Math.min(4, thr))), have = (airMine(n).asf || 0) + S.queue.reduce((s0, q, pp) => s0 + (S.owner[pp] === n ? q.filter(j => j.t === 'asf').length : 0), 0);
  return Math.max(0, goal - have); }
// what the AI holds back: the link project it saves for (cash), and the counter unit it saves for (all of its costs)
const AI_CTR = new Set(['jam', 'sam', 'int', 'asf', 'mpa', 'frig', 'bomb', 'awacs']);   // counters, and the heavy aircraft it rarely picks: saved for, not swapped
// an AI buys from other AIs' sell listings on the order book (cheapest first, up to 1.15x the world price; never an enemy's or an embargoing power's):
// goods change hands between nations without moving the world price. Returns what it got.
function aiBookBuy(n, k, q){ const N = S.nations[n], M = mkt(); let got = 0;
  const asks = (S.book || []).filter(o => !isBid(o) && o.res === k && o.qty > 0 && o.seller !== n && !isSeat(o.seller) && S.nations[o.seller].alive && !atWar(n, o.seller) && !M.emb[o.seller + '>' + n] && canSee(o, n) && o.price <= M.p[k]*1.15).sort((x, y) => x.price - y.price);
  for (const o of asks){ const r = Math.min(q - got, o.qty, Math.floor(N.cash/o.price), Math.floor(stockCap(n) - N[k])); if (r <= 0) break;
    N.cash -= r*o.price; N[k] += r; S.nations[o.seller].cash += r*o.price; o.qty -= r; got += r; if (got >= q) break; }
  if (got) S.book = S.book.filter(o => o.qty > 0); return got; }
// AI market thresholds: buys when a stock is below AI_LOW (and tops up what is below AI_SHORT, AI_BUYQ at most); never a hoard
const AI_KEEP = {iron:180, elec:130, rare:170};   // AI stock kept back from a sale into a strong market (plus 25 days of maintenance and what it saves for)
const AI_LOW = {oil:40, metal:60, iron:50, elec:35, rare:40}, AI_SHORT = {oil:90, metal:90, iron:80, elec:60, rare:70}, AI_BUYQ = {oil:120, metal:120, iron:100, elec:60, rare:50};
// where the AI builds a Rare Earth Mine (the richest ground it holds) or an Arms Factory for electronics (its most populous city still below level III)
// a Foundry goes on an ore deposit first (twice the iron), at home rather than on conquered land, the lowest level first
function aiSite(n, k){ let best = -1, bv = 0;
  for (let p = 0; p < G.P.length; p++){ if (S.owner[p] !== n || S.cons[p] || !canBuildHere(p, k)) continue; const P = G.P[p], lv = S.bld[p][k];
    const v = k === 'mine' ? (lv < BUILD.mine.max ? mineLv(P)*(1 - 0.25*lv)*(S.home[p] === n ? 1 : 0.7) : 0) : k === 'fdy' ? (lv < BUILD.fdy.max ? (P.ore ? 2 : 1)/(1 + lv)*(S.home[p] === n ? 1 : 0.6)*(1 + 0.1*rng()) : 0) : (lv < 3 ? (1 + popOf(p))/(1 + lv) : 0);
    if (v > bv){ bv = v; best = p; } }
  return best; }
// Recruiting Office for an AI short of manpower: a new office first (the first province without one, +3k a day for $40M); only when every province
// has one, the next level of its lowest office (cities first). No upgrades otherwise, except where training speed is the limit (aiRecSlow)
function aiRecSite(n){ let best = -1, bl = 99;
  for (let p = 0; p < G.P.length; p++){ if (S.owner[p] !== n || S.cons[p] || !canBuildHere(p, 'rec')) continue; const l = S.bld[p].rec || 0;
    if (!l) return p; if (l >= BUILD.rec.max) continue; const v = l - (G.P[p].city ? 0.5 : 0); if (v < bl){ bl = v; best = p; } }
  return best; }
// training speed limits the AI in city p: it is at war, the city's queue is full (two or more waiting) and the money for the next level is spare
function aiRecSlow(n, p){ const l = S.bld[p].rec || 0; return l >= 1 && l < BUILD.rec.max && S.queue[p].length >= 2 && warsOf(n).length > 0 && S.nations[n].cash > buildCost(n, 'rec', l + 1, p).cash + 300; }
const aiReserve = (n, k = 'cash') => { const N = S.nations[n], L0 = N.lkSave, U = N.uSave;
  // at war, troops come first: the link project only holds its money back once there is twice that much in the bank
  let r = k === 'cash' && L0 && L0.until > S.hour && !(N.cash < L0.c*2 && warsOf(n).length) ? L0.c : 0;
  if (U && U.until > S.hour && UNITS[U.t]) r += (ucost(n, U.t)[k] || 0) + (k === 'cash' ? 15 : 0);
  if (N.bSave && N.bSave.until > S.hour) r += buildCost(n, 'air', 2)[k] || 0;
  if (rFree(N) && N.rPick && N.rPick.until > S.hour && TECH_BY[N.rPick.id] && (N.rPick.save || k === 'rare')) r += techCost(TECH_BY[N.rPick.id])[k] || 0;   // saving for a counter tech (all of it); rare materials always wait for the next research
  return r; };
// buy what a cost lacks in traded goods (plus a few spare) on the world market, if every price is at most mx times the base and the money covers it all
function aiBuyFor(n, c, mx, spare = 20){ const N = S.nations[n], miss = MKT_K.map(k => [k, Math.ceil((c[k] || 0) - N[k])]).filter(([, q]) => q > 0); if (!miss.length) return true;
  let tot = c.cash || 0; for (const [k, q] of miss){ if (buyPrice(n, k) > MKT_BASE[k]*mx*(k === 'iron' || k === 'elec' ? 1.25 : 1)) return false; tot += (q + 5)*buyPrice(n, k); }
  if (N.cash < tot + spare + aiReserve(n)) return false; for (const [k, q] of miss) trade(n, k, q + 5); return true; }
// iron and electronics kept back from new units for maintenance: the shortage line plus three days of it (a new unit that would dig into it waits)
const aiKeepRes = (n, k) => k === 'iron' || k === 'elec' ? AI_LOW[k] + 3*Math.max(0, income(n).upkeep[k]) : 0;
const aiSpare = (n, t, keep) => { const N = S.nations[n], c = ucost(n, t); if (!canAfford(n, t) || N.cash < c.cash + 15 + aiReserve(n)) return false; for (const k of CK) if (k !== 'cash' && c[k] > 0 && N[k] - c[k] < aiReserve(n, k) + (keep ? aiKeepRes(n, k) : 0)) return false; return true; };   // only what this unit itself uses is checked against the savings
// AI army supply: how big an army the land can carry before growth waits for more territory (or money above $600M). It stands in for the old food
// limit (armies ate food; temperate countryside fed three units, a city or cold ground one): without it the populous powers grew until cash alone ran out
const ARMYC = {v:-1, m:[]};
function aiArmyCap(n){ if (ARMYC.v !== tickVer || ARMYC.S !== S){ ARMYC.v = tickVer; ARMYC.S = S; ARMYC.m = []; }
  if (ARMYC.m[n] != null) return ARMYC.m[n]; let c = 0, k = 0; for (const P of G.P) if (!P.sea && S.owner[P.id] === n){ k++; c += P.city ? 1 : (Math.abs(P.lat) < 55 ? 3 : 1)*G.PF; }
  return (ARMYC.m[n] = 90 + c*Math.min(1, 0.55 + 40/(40 + k))); }   // large empires feed and supply their armies less efficiently (as food was hit by administration)
function aiTurn(n){
  const N = S.nations[n]; if (!N.alive) return;
  if (rFree(N)){   // a slot is free (one start per turn: the other slot fills on a later turn, with a different project)
    const av = TECH.filter(t => !has(n, t.id) && !rRunning(N, t.id) && (!t.req || has(n, t.req)));
    if (av.length){ const mx = enemyMix(n), H = (S.airHit && S.airHit[n]) || {drone:0, bomb:0, air:0};
      const hb = H.bomb > 0 ? 4 : 0, wr = warsOf(n).length > 0, ab2 = G.P.some(P => S.owner[P.id] === n && S.bld[P.id].air >= 2);
      // enemies fielding (or able to field) bombers, AWACS and patrol planes, or flying drones, call for Air Superiority Fighters
      const aw = (() => { const foes = warsOf(n), heavy = foes.filter(e => has(e, 'bomb1') || has(e, 'awacs1')).length; const v = (wr ? 2.5 : 0) + 14*mx.bomb + 12*mx.sup + 8*mx.drone + 3*Math.min(2, heavy) + (H.bomb + H.air > 0 ? 4 : 0); return {asf:v, air2:0}; })();   // (fighters are open from day one: Precision Munitions no longer leads there)
      const RW = {air1:3, eco1:3, air2:(wr ? 4.2 : 2.6) + 4*(mx.bomb + mx.air) + 2*Math.min(3, H.bomb) + hb + aw.air2, drone1:2.5, uav2:2, uav3:1.5, uav4:2, uav5:1.5, swarm1:3, sdrone1:2.5, jam1:0.8 + 14*mx.drone + 2*Math.min(3, H.drone), asf1:3 + 5*(mx.air + mx.bomb) + Math.min(3, H.bomb) + hb + 8*mx.bomb + aw.asf, mpa1:0.5 + 8*mx.sub + 1.2*Math.min(3, (S.trade && S.trade.hit[n]) || 0), awacs1:wr ? 2.2 : 1.5, bomb1:wr ? (ab2 ? 11 : 8) : 3};
      // the pick sticks for a day: an expensive tech (bombers, fighters) is saved for instead of losing every roll to the cheap ones
      let pick = N.rPick && N.rPick.until > S.hour ? av.find(t => t.id === N.rPick.id) : null;
      const rInc = Math.max(0, income(n).net.rare), rOk = t => N.rare + 5*rInc >= t.rare;   // fundable in about five days of rare-material income
      if (!pick){ const w = av.map(t => (RW[t.id] || 1)*(rOk(t) ? 1 : 0.35)), tot = w.reduce((a, b) => a + b, 0);
        let r = rng()*tot; pick = av[0]; for (let i = 0; i < av.length; i++){ r -= w[i]; if (r <= 0){ pick = av[i]; break; } }
        // a counter that is badly needed (Air Superiority Fighters, or the Precision Munitions that lead to them) is saved for over four days:
        // aiReserve holds its price back from recruiting, so a cash-poor power at war still gets there
        const save = (pick.id === 'asf1' && aw.asf >= 2.5) || (pick.id === 'air2' && aw.air2 >= 2);
        N.rPick = {id:pick.id, until:S.hour + (save ? 96 : 24), save}; }
      { const tc = techCost(pick);   // short of rare materials, materials or oil for it: buy the rest (never above 1.6x the base price) when the money is there
        for (const k of ['rare', 'metal', 'oil']){ const miss = Math.ceil(tc[k] - N[k]); if (miss > 0 && buyPrice(n, k) <= MKT_BASE[k]*1.6 && N.cash > tc.cash + 60 + (miss + 3)*buyPrice(n, k) + aiReserve(n)) trade(n, k, miss + 3); }
        if (N.cash > tc.cash + 30 && startResearch(n, pick.id)) N.rPick = null; } }
  }
  const inc = income(n), provs = S.owner.filter(o => o === n).length;
  const units = S.armies.reduce((s, a) => s + (a.owner === n ? count(a) : 0), 0) + S.queue.reduce((s, q, p) => s + (S.owner[p] === n ? q.length : 0), 0);
  const canGrow = inc.net.cash > 4 && inc.upkeep.cash < inc.gross.cash*0.7 && units < aiArmyCap(n);
  // economy buildings: one new project per turn where it is needed most; a rich power stuck on a resource runs up to three at once
  // (rare materials for research: a Rare Earth Mine on the richest ground; iron or materials: a Foundry; electronics: an Arms Factory in the most populous city)
  // Iron and electronics are spent on new units as fast as they come in (the net income below is after maintenance only), so a Foundry or an Arms Factory
  // is wanted while the stock is little above the maintenance reserve and the income does not cover most of the maintenance again on top (what recruiting uses);
  // one of each at a time (two for a big power). A Rare Earth Mine comes first (research); the other needs take turns
  { const u0 = inc.upkeep, needs = [inc.net.rare < 5 && N.rare < 120 ? 'mine' : null,
      inc.net.iron < -1 || (N.iron < aiKeepRes(n, 'iron') + 30 && inc.net.iron < Math.max(4, 0.8*u0.iron + 2)) || (inc.net.metal < 4 && N.metal < 80) ? 'fdy' : null, inc.net.oil < 3 ? 'ref' : null, inc.net.mp < 5 && N.mp < 60 ? 'rec' : null,
      inc.net.elec < -1 || (N.elec < aiKeepRes(n, 'elec') + 50 && inc.net.elec < Math.max(3, u0.elec + 2)) ? 'fac' : null].filter(Boolean);
    const rich = N.cash > 600 && !canGrow, jobs = rich ? 3 : 1, busy = {}, j0 = Math.floor(S.hour/4) + n; let done = 0;
    if (needs.length) for (let p = 0; p < G.P.length; p++) if (S.owner[p] === n && S.cons[p]) busy[S.cons[p].k] = (busy[S.cons[p].k] || 0) + 1;
    const ord = needs[0] === 'mine' ? ['mine', ...needs.slice(1).map((x, i, a) => a[(j0 + i) % a.length])] : needs.map((x, i, a) => a[(j0 + i) % a.length]);
    for (let j = 0; j < ord.length && done < jobs && N.cash > 90; j++){ const need = ord[j]; if (need !== 'mine' && (busy[need] || 0) >= (provs > 150 ? 2 : 1)) continue;
      if (need === 'rec'){ const p = aiRecSite(n); if (p >= 0 && build(n, p, 'rec')){ done++; busy.rec = (busy.rec || 0) + 1; } continue; }
      if (need === 'mine' || need === 'fac' || need === 'fdy'){ const p = aiSite(n, need); if (p >= 0 && build(n, p, need)){ done++; busy[need] = (busy[need] || 0) + 1; } continue; }
      for (let p = 0; p < G.P.length; p++){ if (S.owner[p] !== n || S.cons[p] || !canBuildHere(p, need) || S.bld[p][need] >= BUILD[need].max) continue;
        if (build(n, p, need)){ done++; busy[need] = (busy[need] || 0) + 1; break; } } }
    // the other way round: a cash-poor power sells a metal hoard on the world market, while metal still fetches 0.8x the base price and at most
    // AI_SELL_DAY units a day. Oil and the other goods are never dumped here (that flattened their prices for everyone): stock above 55% of the storage
    // cap goes to the order book instead (bookDay), sold nation to nation without moving the world price
    // A real hoard (over 1,000) held by a power short of cash is unloaded too, AI_HOARD_DAY a day and more for bigger hoards, while the price is
    // above 0.6x the base or 85% of the last two weeks' average, whichever is lower (never below 0.5x): hoards of 1,000-3,000 no longer sit idle all game while the price never reaches 0.8x
    if (N.metal > 1000) N.mHoard = 1; else if (N.metal < 650) N.mHoard = 0;   // once over 1,000 the hoard is sold down to about 650
    const hoard = !!N.mHoard && N.cash < 500;
    if (N.cash < 260 || hoard){ const day = Math.floor(S.hour/24); if (N.sellD !== day){ N.sellD = day; N.sold = 0; }
      const M = mkt(), sur = N.metal - (hoard ? 620 : 420) - aiReserve(n, 'metal'), h14 = M.hist.metal.slice(-14), avg = h14.length ? h14.reduce((a, b) => a + b, 0)/h14.length : M.p.metal;
      const floor = hoard ? Math.max(MKT_BASE.metal*0.5, Math.min(MKT_BASE.metal*0.6, avg*0.85)) : MKT_BASE.metal*0.8, cap = hoard ? Math.min(90, Math.max(AI_HOARD_DAY, 0.9*inc.gross.metal) + Math.max(0, N.metal - 1000)/20) : AI_SELL_DAY;   // a big producer (~60 a day) sells about its output, bigger hoards a bit more
      if (sur >= 30 && (inc.net.metal >= 0 || hoard) && M.p.metal >= floor){ const q = Math.floor(Math.min(sur, cap - (N.sold || 0), hoard ? 40 : 30)); if (q >= 10) N.sold = (N.sold || 0) - trade(n, 'metal', -q); } }
    // hoarded cash buys the scarce resources on the world market (up to 1.4× the going price)
    if (N.cash > 450 && (!canGrow || MKT_K.some(k => N[k] < AI_LOW[k]))){ const M = mkt(), cap = stockCap(n);
      for (const k of MKT_K){ const short = N[k] < AI_SHORT[k] || inc.net[k] < 0; if (!short || buyPrice(n, k) > M.p[k]*1.4) continue;
        const q = Math.floor(Math.min(cap*0.6 - N[k], (N.cash - 320)/buyPrice(n, k), AI_BUYQ[k])); if (q >= 10) trade(n, k, q); } }
    // fuel or maintenance running the oil, iron or electronics stock down: buy about two and a half weeks of the deficit, first from other powers' listings
    // on the order book (an oil producer's surplus), the rest on the world market while the price is fair (up to 1.5x the base)
    for (const k of ['oil', 'iron', 'elec']){ const d = -inc.net[k]; if (d < 0.3 || N[k] > 12*d + 25) continue;
        const dry = N[k] < 3*d, q = Math.floor(Math.min(AI_BUYQ[k], 18*d + 30 - N[k], stockCap(n) - N[k], (N.cash - (dry ? 50 : 110) - aiReserve(n))/buyPrice(n, k))); if (q < 8) continue;   // all but run dry: before any new unit
        const got = aiBookBuy(n, k, q); if (q - got >= 8 && buyPrice(n, k) <= MKT_BASE[k]*1.5) trade(n, k, q - got); }
    // the other way round: a big stock of iron, electronics or rare materials (above AI_KEEP, plus what it saves for) is sold on the world market while the
    // price is high (1.1x the base or more), 60 a day at most. It only ever pulls a dear price back towards the base,
    // so it never floods the market, and it is what keeps these goods trading once the opening scramble is over
    { const M = mkt(), day = Math.floor(S.hour/24); if (N.surD !== day){ N.surD = day; N.surS = {}; }
      for (const k of ['iron', 'elec', 'rare']){ const keep = AI_KEEP[k] + aiReserve(n, k) + 25*Math.max(0, inc.upkeep[k]), over = N[k] - keep; if (over < 15 || M.p[k] < MKT_BASE[k]*1.1) continue;
        const q = Math.floor(Math.min(over, 10 + over/10, 60 - (N.surS[k] || 0))); if (q >= 8) N.surS[k] = (N.surS[k] || 0) - trade(n, k, -q); } }
    // cheap iron, electronics or rare materials (world price under 0.85x the base): a power with money stocks up to twice its shortage line,
    // which keeps these goods trading after the opening months and their price off the floor
    if (N.cash > 350){ const M = mkt(), cap = stockCap(n);
      for (const k of ['iron', 'elec', 'rare']){ if (M.p[k] >= MKT_BASE[k]*0.85 || N[k] >= 2*AI_SHORT[k]) continue;
        const q = Math.floor(Math.min(cap*0.6 - N[k], 2*AI_SHORT[k] - N[k], (N.cash - 300)/buyPrice(n, k), 40)); if (q >= 10) trade(n, k, q); } }
    void done; }
  // heavy-aircraft research but no Airbase II yet: save up for one (like a link project) and build it as soon as the money is there
  { const B2 = N.bSave; if (B2 && (B2.until <= S.hour || S.owner[B2.p] !== n || S.bld[B2.p].air !== 1)) N.bSave = null;
    if (!N.bSave && (has(n, 'bomb1') || has(n, 'asf1') || has(n, 'awacs1')) && (warsOf(n).length || N.cash > 300) && !G.P.some(P => S.owner[P.id] === n && S.bld[P.id].air >= 2)){ const P = G.P.find(q => S.owner[q.id] === n && q.city && S.bld[q.id].air === 1); if (P) N.bSave = {p:P.id, until:S.hour + 48}; }
    if (N.bSave && !S.cons[N.bSave.p] && build(n, N.bSave.p, 'air')) N.bSave = null; }
  // fighters before bombers: an ASF want replaces a bomber saving (and anything but another counter)
  { const A3 = aiAsfWant(n, provs, inc), U0 = N.uSave && N.uSave.until > S.hour ? N.uSave : null; if (A3 && (!U0 || U0.t === 'bomb' || !AI_CTR.has(U0.t)) && rng() < 0.5) N.uSave = {t:'asf', until:S.hour + 48}; }
  { const B3 = aiBomberWant(n, provs, inc); if (B3 && !(N.uSave && N.uSave.until > S.hour) && rng() < 0.4) N.uSave = {t:'bomb', until:S.hour + 48}; }
  { const U = N.uSave; if (U && U.until > S.hour && UNITS[U.t]){ const c = ucost(n, U.t);
      for (const k of MKT_K){ const miss = Math.ceil(c[k] - N[k]); if (miss <= 0) continue; const q = miss + 5; if (N.cash >= c.cash + q*buyPrice(n, k) + 20) trade(n, k, q); } } }
  for (let p = 0; p < G.P.length; p++){
    if (S.owner[p] !== n || !G.P[p].city) continue;
    if (!S.cons[p]){
      if (p === N.capital && (threatNear(p, n) ? S.bld[p].fort < (provs > 150 ? 3 : 2) : warsOf(n).length && S.bld[p].fort < 1 && N.cash > 90)) build(n, p, 'fort');
      else if (!S.bld[p].rec && N.cash > (p === N.capital ? 40 : 80) && (p === N.capital || rng() < 0.3)) build(n, p, 'rec');   // infantry is mobilized only where a Recruiting Office stands
      else if (!S.bld[p].fac && N.cash > 110) build(n, p, 'fac');
      else if (has(n, 'air1') && !S.bld[p].air && N.cash > 140 && G.P.filter(P => S.owner[P.id] === n && S.bld[P.id].air).length < 2) build(n, p, 'air');
      else if (has(n, 'msl1') && p === N.capital && !S.bld[p].silo && N.cash > 260 && rng() < 0.3) build(n, p, 'silo');
      else if (canBuildHere(p, 'yard') && !S.bld[p].yard && S.bld[p].fac && N.cash > 170 && G.P.filter(P => S.owner[P.id] === n && S.bld[P.id].yard).length < 2 && rng() < 0.3) build(n, p, 'yard');
      else if (S.bld[p].yard === 1 && N.cash > 220 && rng() < 0.2 && !G.P.some(P => S.owner[P.id] === n && S.bld[P.id].yard >= 2)) build(n, p, 'yard');
      else if (S.bld[p].air === 1 && (has(n, 'asf1') || has(n, 'bomb1') || has(n, 'awacs1')) && N.cash > 200 && rng() < (has(n, 'bomb1') || has(n, 'asf1') ? 0.6 : 0.4) && G.P.filter(P => S.owner[P.id] === n && S.bld[P.id].air >= 2).length < 2) build(n, p, 'air');   // Airbase II (up to two) for the heavy aircraft
      else if (S.bld[p].fac < 2 && N.cash > 260 && rng() < 0.25) build(n, p, 'fac');
      else if (aiRecSlow(n, p) && rng() < 0.15) build(n, p, 'rec');   // training speed is the limit here: the next Recruiting Office level
      else if (S.bld[p].air >= 1 && S.bld[p].air < 3 && N.cash > 300 + 120*S.bld[p].air && rng() < 0.2 && S.armies.filter(w => w.owner === n && w.air && w.air.base === p && count(w)).length >= 2 && S.armies.some(w => w.owner === n && w.air && w.air.base === p && (w.air.wear || 0) > 0.2)) build(n, p, 'air');   // worn wings: faster repairs
      else if ((canGrow || N.cash > 900) && N.cash > 700 && rng() < (N.cash > 1000 ? 0.2 : 0.08)){ const up = ['fac', 'air', 'yard', 'silo'].find(k => S.bld[p][k] > 0 && S.bld[p][k] < BUILD[k].max && N.cash > buildCost(n, k, S.bld[p][k] + 1, p).cash + 450); if (up) build(n, p, up); }
    }
    if (S.bld[p].silo && S.queue[p].length < 2 && N.cash > 320 && rng() < 0.25){ const k = has(n, 'msl2') && rng() < 0.4 ? 'bm' : 'cm'; if (mstock(p)[k] < 3) buildMissile(n, p, k); }
    if (p === N.capital && S.queue[p].length < 3 && (threatNear(p, n) || enemiesAt(p, n)) && canAfford(n, 'inf')) recruit(n, p, 'inf');   // capital under threat: infantry first, savings or not
    else if (p === N.capital && S.queue[p].length < 2 && warsOf(n).length && canAfford(n, 'inf') && N.cash > 60){ const keep = Math.max(4, Math.min(12, Math.round(units*0.07)));   // at war: keep the garrison topped up
      if (stationaryAt(p).filter(b => b.owner === n && !b.air).reduce((s0, b) => s0 + count(b), 0) + S.queue[p].length < keep) recruit(n, p, 'inf'); }
    const U1 = N.uSave && N.uSave.until > S.hour ? N.uSave : null;
    if (S.queue[p].length < 2 && (canGrow || N.cash > 600 || (U1 && bldOk(p, U1.t) && canAfford(n, U1.t)))){   // a counter saved for is bought even outside growth
      const U = U1;
      const hold = U && bldOk(p, U.t) && reqsOf(U.t).some(r => r.b === 'air' && r.l >= 2) && S.queue[p].length >= 1;
      if (U && bldOk(p, U.t) && canAfford(n, U.t)){ if (recruit(n, p, U.t) !== false) N.uSave = null; }
      else if (!hold){ let t = aiPickUnit(n, p);
        if (t && !canAfford(n, t) && unlocked(n, t) && bldOk(p, t)) aiBuyFor(n, ucost(n, t), 1.3, 60);   // goods short: buy them (up to 1.3x the base price) when $60M stay spare
        if (t && !canAfford(n, t)){ if (AI_CTR.has(t) && !U && unlocked(n, t)){ N.uSave = {t, until:S.hour + 24}; t = null; } else t = canMobilize(n, p, 'inf') ? null : 'inf'; }
        if (t && aiSpare(n, t, true)) recruit(n, p, t); }
    }
  }
  const idle = new Map();
  for (const a of S.armies){ if (a.owner !== n || a.to !== null || a.path.length || a.air || S.owner[a.at] !== n) continue;
    if (idle.has(a.at)) merge(idle.get(a.at), a); else idle.set(a.at, a); }
  removeEmpty();
  // at war the capital's infantry garrison (4-12 by army size) is split off first: neither the offensive planner nor the idle moves below take it
  if (warsOf(n).length){ const ca = idle.get(N.capital); if (ca && !ca.air && !shipsOnly(ca)){ const keep = Math.max(4, Math.min(12, Math.round(units*0.07))), g = Math.min(ca.u.inf || 0, keep);
      if (g >= 1 && count(ca) - g >= 4) splitPlan(ca, [{inf:g}]); else if (g >= 1) idle.delete(N.capital); } }
  // badly damaged units (the split panel's damaged rows, below 45%) leave idle field stacks for the nearest own city within 4 provinces, where they heal 2.5× faster
  if (rng() < 0.5) for (const a of [...idle.values()]){ if (count(a) < 4 || G.P[a.at].city || G.P[a.at].sea || S.battles.includes(a.at) || enemiesAt(a.at, n)) continue;
    const dr = splitRows(a).filter(r => r.dmg && r.hf < 0.45); if (!dr.length || dr.reduce((s0, r) => s0 + r.n, 0) >= count(a)) continue;
    const seen = new Map([[a.at, 0]]), q = [a.at]; let city = -1;
    for (let h = 0; h < q.length && city < 0; h++){ const u = q[h], du = seen.get(u); if (du >= 4) continue; for (const v of G.P[u].nbs){ if (seen.has(v) || G.P[v].sea || S.owner[v] !== n) continue; seen.set(v, du + 1); if (G.P[v].city && !S.battles.includes(v)){ city = v; break; } q.push(v); } }
    if (city < 0) continue; const pth = pathFor(a, a.at, city); if (!pth.length || pth.length > 5) continue;
    const [b] = splitPlan(a, [Object.fromEntries(dr.map(r => [r.k, r.n]))]); if (b){ b.path = pth; b.forced = true; } }
  const targeted = new Set(S.armies.filter(a => a.owner === n && a.path.length).map(a => a.path[a.path.length - 1]));
  const planned = aiOperate(n, [...idle.values()].filter(a => count(a) && !a.air && !shipsOnly(a) && !G.P[a.at].sea && S.owner[a.at] === n && (a.m ?? 80) >= 50));
  for (const a of idle.values()){
    if (planned.has(a)) continue;
    if (count(a) === 0 || enemiesAt(a.at, n)) continue;
    if (a.air) continue;
    if (shipsOnly(a)){ if (a.escort == null && !a.raid) aiFleet(a, n); continue; }
    if (G.P[a.at].sea || (S.owner[a.at] !== n && !atWar(n, S.owner[a.at]))){
      // stranded at sea or in land it may not fight in: head to the nearest own province
      const seen = new Set([a.at]), q = [a.at]; let dest = -1;
      for (let h = 0; h < q.length && dest < 0; h++) for (const v of G.P[q[h]].nbs){ if (seen.has(v) || !canEnter(n, v)) continue; seen.add(v); if (S.owner[v] === n){ dest = v; break; } q.push(v); }
      if (dest >= 0) a.path = pathFor(a, a.at, dest);
      continue;
    }
    if (S.owner[a.at] !== n) continue;
    if (a.at === N.capital && threatNear(a.at, n)) continue;
    if ((a.m ?? 80) < 50 || (a.resting && a.m < 70)){ a.resting = true; continue; } a.resting = false;
    let pw = power(a); if (pw < 14) continue;
    const dist = new Map([[a.at, 0]]), q = [a.at], maxD = warsOf(n).length ? 10 : 7, fw = fitW(a), cold = !arctic(n), fc = {};
    const fitAt = v => { const k = G.P[v].terrain || 'plains'; return fc[k] ?? (fc[k] = fitOf(fw, k, true, cold)); };
    let best = -1, bestScore = 0;
    for (let h = 0; h < q.length; h++){ const u = q[h], du = dist.get(u); if (du >= maxD) continue;
      for (const v of G.P[u].nbs){ if (dist.has(v)) continue; const step = G.P[v].sea ? 2 : 1; dist.set(v, du + step); q.push(v);
        if (G.P[v].sea || S.owner[v] === n || targeted.has(v)) continue;
        if (S.owner[v] >= 0 && !atWar(n, S.owner[v])) continue;
        if (S.owner[v] >= 0 && pw < 30 && S.home[v] !== n) continue;
        const fv = fitAt(v)*(riverX(u, v) ? RIVER_ATK : 1); if (pw*fv < defPower(v, n)*1.3 + 4) continue;
        let val = (G.P[v].city ? 3 : 1)*(S.owner[v] >= 0 && focusOf(n) === S.owner[v] ? 1.8 : 1); if (G.P[v].oil) val += 1.5; if (isCapital(v)) val += 3; if (S.home[v] === n) val *= 3;
        if (S.owner[v] >= 0 && atWar(n, S.owner[v])){ val *= 1.6; let rj = 0; for (const lk of G.P[v].lk.values()) if (lk.rail) rj++; if (rj >= 3) val += 0.8; }
        const sc = val/(1 + (du + step)*0.7)*(0.5 + 0.5*Math.min(1.2, fv)); if (sc > bestScore){ bestScore = sc; best = v; } } }
    if (best < 0) continue;
    // the capital keeps a garrison when the force there marches out: two infantry in peace, more at war (rail lets enemies strike deep along captured lines)
    if (a.at === N.capital && !warsOf(n).length){ const k2 = Math.min(2, a.u.inf - 2); if (k2 >= 2){ addArmy(n, a.at, {inf:k2}); a.u.inf -= k2; } }   // at war the garrison was split off above
    a.path = pathFor(a, a.at, best);
    if (!a.path.length) continue;
    targeted.add(best);
    // oversized stacks split and send half around to a second side of the target (frontage + flank bonus)
    if (count(a) > frontage(best) + 4){ const last = a.path.length > 1 ? a.path[a.path.length - 2] : a.at;
      const alt = G.P[best].nbs.filter(w => w !== last && !G.P[w].sea && (S.owner[w] === n || (S.owner[w] >= 0 && atWar(n, S.owner[w]) && defPower(w, n) < pw*0.25)));
      for (const w of alt){ const pth = pathFor(a, a.at, w); if (!pth.length || pth.length > a.path.length + 3) continue;
        const b = splitArmy(a); if (!b) break; b.path = pth.concat([best]); break; } }
  }
}
