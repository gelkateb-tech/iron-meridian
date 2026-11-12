// Iron Meridian rules: air. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
const AIR_SPEED = 2.5;                // hexes per hour for aircraft on missions
const AIR_RANGE = {jet:16, int:12, heli:6, drone:18, swarm:6, sdrone:20, bomb:34, mpa:22, awacs:18, asf:14, stealth:34};   // mission radius in hexes from the home airbase
const AIR_SPF = {bomb:0.6, stealth:0.67, mpa:0.85, awacs:0.85, sdrone:0.75, swarm:0.8};   // slower aircraft: share of AIR_SPEED
// UAV levels (research UAV I..V): vision radius on station (km, around the target point), loiter hours, range (hexes), stealth (share of air-defence hits that land), missile salvos per sortie
const UAV_LV = [null, {vis:250, loiter:12, range:18, stealth:1.0, salvos:0}, {vis:300, loiter:16, range:20, stealth:0.8, salvos:0}, {vis:350, loiter:20, range:22, stealth:0.6, salvos:0},
  {vis:400, loiter:20, range:22, stealth:0.6, salvos:1}, {vis:500, loiter:24, range:27, stealth:0.45, salvos:2}];
const UAV_TECH = ['u_drone', 'drone_g2', 'drone_g3', 'drone_g4', 'drone_g5'];   // UAV I is the Recon UAV's unlock; II to V are its generations
function uavLv(n){ if (n < 0 || !S || !S.nations[n]) return 1; let l = 0; for (const id of UAV_TECH){ if (has(n, id)) l++; else break; } return Math.max(1, l); }
const uavOf = n => UAV_LV[uavLv(n)];
const BOMB2_RANGE = 4;   // Strategic Bomber Upgrade: the Heavy Bomber reaches this many hexes farther (the node's own rng bonus)
// mission radius in hexes: the type's own, plus what research adds (Drop Tanks, Long-Range Tanks, Satellite Link ...: the rng bonus of st())
const airRangeT = (n, t) => t === 'drone' ? uavOf(n).range : (AIR_RANGE[t] || 12) + (n >= 0 ? st(n, t, 'rng') : 0);
const STRIKE = 8;                     // a strike delivers this many combat-hours of firepower
/* ---------------- Air power ---------------- */
const wingRange = a => Math.min(...UT.filter(t => a.u[t] && UNITS[t].cls === 'air').map(t => airRangeT(a.owner, t)), 99) + (a.air && a.air.base != null && G.P[a.air.base] && !G.P[a.air.base].sea ? Math.max(0, (S.bld[a.air.base].air || 0) - 1) : 0);
const isStriker = a => a.u.jet > 0 || a.u.heli > 0 || a.u.bomb > 0 || a.u.stealth > 0 || a.u.sdrone > 0 || a.u.swarm > 0;
const isDrone = a => a.u.drone > 0 && UT.every(t => t === 'drone' || !a.u[t]);
// swarm drones fly from truck launchers: any own city can host a swarm wing (field repairs only, see maintRate)
const swarmPad = (a, p) => a.u.swarm > 0 && UT.every(t => t === 'swarm' || !a.u[t]) && S.owner[p] === a.owner && G.P[p].city && !G.P[p].sea;
const AIR_T = UT.filter(t => UNITS[t].cls === 'air');
// a wing's aircraft type (wings hold one type; mixed old wings report the most numerous)
const wingT = a => { let b = null; for (const t of AIR_T) if (a.u[t] && (!b || a.u[t] > a.u[b])) b = t; return b || 'jet'; };
const wingSpd = a => AIR_SPEED*Math.min(1, ...AIR_T.filter(t => a.u[t]).map(t => AIR_SPF[t] || 1))*stackSpd(a);   // (a wing over its stack limit flies slower)
const isFighterWing = b => b.u.int > 0 || b.u.asf > 0;
/* Strike wear and maintenance: every mission wears a wing's airframes, even unopposed: 3–6% per strike (more the farther it flies), patrols,
   orbits and loitering add 0.15% per hour aloft, rebasing 1%. Wear (a.air.wear, 0..WEAR_MAX) is repaired only on the ground at your own airbase
   (10% + 6% per airbase level a day; half while the base is knocked out or at an ally's base) or aboard your carrier (20% a day), and not during the
   rearm hours after a sortie (a.air.cd), so back-to-back strikes wear a wing down until it is stood down for maintenance. Worn wings fire
   weaker (moraleF) and take more damage (hurt); below 50% condition they need maintenance, below 20% they are grounded except to rebase. */
const WEAR_MAX = 0.85, WEAR_WARN = 0.5, WEAR_GROUND = 0.2;
const wingCond = a => a && a.air ? 1 - (a.air.wear || 0) : 1;
const wornWing = a => !!(a && a.air && wingCond(a) < WEAR_WARN);
function wearWing(a, kind, d, hrs = 0){ if (!a || !a.air || !count(a)) return 0; const T = wingT(a), r = Math.max(1, wingRange(a));
  let k = kind === 'rebase' ? 0.01 : (0.03 + 0.03*Math.min(1, d/r) + 0.0015*hrs)*(UNITS[T].dr ? 0.9 : isBmb(T) ? 1.15 : 1);
  a.air.wear = Math.min(WEAR_MAX, (a.air.wear || 0) + k); return k; }
// maintenance per day for a wing parked where it is (0: no repairs here)
function maintRate(a){ if (!a || !a.air || a.fly) return 0; if (a.air.car != null){ const cv = armyById(a.air.car); return cv && cv.u.carr > 0 && cv.owner === a.owner ? rDeckRate(a.owner) : 0; }
  const b = a.air.base, P = G.P[b]; if (!P || P.sea) return 0; const o = S.owner[b], L = S.bld[b].air || 0; if (!L && swarmPad(a, b)) return 0.12; if (!L || (o !== a.owner && !(o >= 0 && friendly(a.owner, o)))) return 0;
  return (0.1 + 0.06*L)*(o !== a.owner ? 0.5 : 1)*(bdis(b, 'air') ? 0.5 : 1); }
// own airbase (or carrier) in reach with the fastest repairs, for worn wings that sit where nothing repairs them
function maintBase(a){ const B = G.P[a.air.base], r = wingRange(a); let best = -1, bv = maintRate(a) + 0.03;
  for (const P of G.P){ if (P.sea || S.owner[P.id] !== a.owner || !S.bld[P.id].air || P.id === a.air.base || hexDist(B.cc, P.cc) > r || bdis(P.id, 'air')) continue; const v = 0.1 + 0.06*S.bld[P.id].air - hexDist(B.cc, P.cc)*0.002; if (v > bv){ bv = v; best = P.id; } }
  return best; }
const AEW_R = 16.6, MPA_R = 11;   // AWACS fighter-control cover and maritime patrol attack radius, old hexes (about 3,000 and 2,000 km); what they SEE is VIS_KM.aew / .mpa (rules/vision.js)
function nearestAirbase(n, from){
  let best = -1, bd = 1e9; for (const P of G.P){ if (S.owner[P.id] !== n || !S.bld[P.id].air) continue; const d = hexDist(G.P[from].cc, P.cc); if (d < bd){ bd = d; best = P.id; } }
  if (best < 0) for (const P of G.P){ if (S.owner[P.id] !== n || !P.city) continue; const d = hexDist(G.P[from].cc, P.cc); if (d < bd){ bd = d; best = P.id; } }
  return best;
}
function fixWings(){
  for (const a of S.armies.slice()){ if (a.owner < 0) continue;
    const airN = UT.reduce((s0, t) => s0 + (UNITS[t].cls === 'air' ? a.u[t] : 0), 0);
    if (a.air || !airN) continue;
    const base = nearestAirbase(a.owner, a.at); const w = addArmy(a.owner, base >= 0 ? base : a.at, {}); w.air = {base:w.at, cd:0};
    for (const t of UT) if (UNITS[t].cls === 'air'){ w.u[t] = a.u[t]; w.w[t] = a.w[t]; a.u[t] = 0; a.w[t] = 0; } w.m = a.m; }
  removeEmpty();
}
const carrierAt = (n, p) => S.armies.find(b => b.owner === n && b.at === p && b.to === null && b.u.carr > 0) || null;
function airMissionKind(a, p){
  if (G.P[p].sea && carrierAt(a.owner, p)) return 'rebase';
  if (isDrone(a)) return S.owner[p] === a.owner && S.bld[p].air && p !== a.air.base ? 'rebase' : 'recon';
  { const T = wingT(a); if (T === 'awacs' || T === 'mpa'){ const o0 = S.owner[p]; return (o0 === a.owner || (o0 >= 0 && friendly(a.owner, o0))) && S.bld[p].air && p !== a.air.base ? 'rebase' : T === 'awacs' ? 'orbit' : 'hunt'; } }
  const o = S.owner[p], hostile = stationaryAt(p).some(b => atWar(a.owner, b.owner) && count(b) > 0);
  if (hostile) return isStriker(a) ? 'strike' : 'patrol';
  if ((o === a.owner || (o >= 0 && friendly(a.owner, o))) && (S.bld[p].air || swarmPad(a, p)) && p !== a.air.base) return 'rebase';
  if (isStriker(a)) return 'strike';
  return 'patrol';
}
// may wing a fly to p, and on what mission. surprise: the nations this order is allowed to attack without a war (the client passes the ones
// its player is about to confirm a surprise attack on); a strike on any other nation's land needs a war
function airCheck(a, p, surprise = null){
  { const w = stormAt(p) || stormAt(a.air.base); if (w && !a.fly) return {ok:false, why:`Grounded: ${w.kind === 'blizzard' ? 'a blizzard' : 'a storm'} over ${stormAt(p) ? (G.P[p].cityName || G.P[p].name) : 'the airbase'}. Wait for it to pass.`}; }
  const d = Math.max(p === a.air.base ? 0 : 1, hexDist(G.P[a.air.base].cc, G.P[p].cc)), r = wingRange(a);
  if (a.fly) return {ok:false, why:'This wing is already on a mission.'};
  if ((a.air.cd || 0) > 0) return {ok:false, why:`Rearming: ready in ${a.air.cd} h.`};
  if (!G.P[a.air.base].sea && bdis(a.air.base, 'air') && a.air.car == null) return {ok:false, why:`Grounded: the airbase was knocked out by a strike (${bdisH(a.air.base, 'air')} h).`};
  if (p === a.air.base && isStriker(a) && !stationaryAt(p).some(b => atWar(a.owner, b.owner))) return {ok:false, why:'That is its home airbase.'};
  if (d > r) return {ok:false, why:`Out of range: ${Math.round(d*KM_HEX/10)*10} km, this wing reaches ${r*KM_HEX} km.`};
  const k = airMissionKind(a, p), o = S.owner[p];
  if (k !== 'rebase' && wingCond(a) < WEAR_GROUND) return {ok:false, why:`Grounded for maintenance: airframes at ${Math.round(wingCond(a)*100)}% condition. Repairs run at an airbase of yours or a carrier; rebasing is still possible.`};
  if (k === 'strike' && o >= 0 && o !== a.owner && !atWar(a.owner, o) && !(surprise && surprise.includes(o))) return {ok:false, why:`You are not at war with ${nationName(o)}.`};
  return {ok:true, kind:k, d, hours:Math.max(1, Math.ceil(d/wingSpd(a)))};
}
function orderAir(a, p){
  const c = airCheck(a, p); if (!c.ok){ refuse(a.owner, c.why); return false; }
  a.fly = {tgt:p, kind:c.kind, ph:'out', t:0, hrs:0}; return true;
}
const PARA_RANGE = 9;
const paraOnly = a => dropOnly(a);   // (Paratroopers, and Special Forces once they are Air-Transportable: rules/research.js)
function canDrop(a, p){ if (!paraOnly(a) || a.to !== null || a.fly) return {ok:false, why:'Only an idle force of Paratroopers (or air-transportable Special Forces) can be air-dropped.'};
  if (!S.bld[a.at].air || S.owner[a.at] !== a.owner) return {ok:false, why:'Air drops take off from a province with your airbase.'};
  if (G.P[p].sea) return {ok:false, why:'Cannot drop into the sea.'};
  const d = hexDist(G.P[a.at].cc, G.P[p].cc); if (d > dropRange(a)) return {ok:false, why:`Out of range: ${Math.round(d*KM_HEX/10)*10} km, drops reach ${dropRange(a)*KM_HEX} km.`};
  if (S.owner[p] >= 0 && S.owner[p] !== a.owner && !atWar(a.owner, S.owner[p])) return {ok:false, why:`You are not at war with ${nationName(S.owner[p])}.`};
  if (stormAt(p) || stormAt(a.at)) return {ok:false, why:'Grounded by a storm.'};
  return {ok:true, d, hours:Math.max(1, Math.ceil(d/AIR_SPEED))}; }
function orderDrop(a, p){ const c = canDrop(a, p); if (!c.ok){ refuse(a.owner, c.why); return false; } a.fly = {kind:'drop', from:a.at, tgt:p, t:0, dt:AIR_SPEED/Math.max(1, c.d)}; a.path = []; cue(a.owner, 'order'); return true; }
function dropTick(){ for (const a of S.armies){ const f = a.fly; if (!f || f.kind !== 'drop') continue; f.t += f.dt; if (f.t < 1) continue;
    const p = f.tgt, sams = stationaryAt(p).filter(b => atWar(a.owner, b.owner)).reduce((s0, b) => s0 + (b.u.sam || 0), 0), lossF = Math.min(0.6, sams*0.15);
    if (lossF > 0) for (const t of UT) if (a.u[t]){ const k = Math.round(a.u[t]*lossF); a.u[t] -= k; }
    a.fly = null; a.from = f.from; a.froms = [f.from]; a.at = p; a.to = null; a.m = Math.max(0, (a.m ?? 80) - 10); a.lastAt = null;
    IM.emit('fxDrop', a, p);
    if (isSeat(a.owner)) tell(a.owner, `Paratroopers landed at ${G.P[p].cityName || G.P[p].name}${lossF > 0 ? `, losing ${Math.round(lossF*100)}% to air defences` : ''}.`, lossF > 0.3 ? 'bad' : 'good', p); }
  removeEmpty(); }
function sideAV(armies, owner, scale){   // (se: stack efficiency per force: air wings over 5 cards, fleets over 5 ships, ground forces over 10 units)
  const av = {soft:0, armored:0, air:0, naval:0}; for (const u of VSU_T) av[UK[u]] = 0;
  for (const a of armies){ const mf = moraleF(a), se = stackEffs(a); for (const t of UT){ if (!a.u[t]) continue; const base = a.u[t]*st(owner, t, 'atk')*K*scale*mf*se[DOM_T[t]]; for (const k of CLASSES) av[k] += base*multO(owner, t, k); for (const u of VSU_T) av[UK[u]] += base*multUO(owner, t, u); } }
  return av;
}
const avScale = (av, f) => { const r = {}; for (const k in av) r[k] = av[k]*f; return r; };
/* ---------------- V3 air: drones, air defence, fighter cover, AWACS, precision and bomber effects ----------------
   Drones (swarm, UAV, strike drone) run a gauntlet before they reach a target: hostile jammers (own province full, neighbours 60%), SAMs
   (neighbours 35%), warships and, against swarms, ordinary guns get shots; each kind has a kill chance per drone kind (AD_PK) and a number of
   engagements per unit (AD_CAP). Jammers also blunt the damage of the drones that get through. Swarm survivors saturate the air defence
   (army.sat, 0..0.75, decays 4%/h): saturated SAMs and jammers fire that much less at everything that follows, manned jets included. */
const AD_PK = {jam:{swarm:0.5, uav:0.35, sdrone:0.18}, sam:{swarm:0.6, uav:0.22, sdrone:0.32}, ship:{swarm:0.12, uav:0.15, sdrone:0.2}, gun:{swarm:0.04, uav:0.02, sdrone:0}};
const AD_CAP = {jam:3, sam:2, ship:1.5, gun:1};
function adAround(p, o){ const r = {jam:0, sam:0, ship:0, gun:0, armies:[]}, sea = G.P[p].sea;
  for (const b of stationaryAt(p)){ if (!atWar(o, b.owner) || !count(b)) continue; const f = 1 - (b.sat || 0);
    r.jam += (b.u.jam || 0)*f*rJamF(b.owner); r.sam += (b.u.sam || 0)*f; r.ship += ((b.u.frig || 0) + 0.6*(b.u.crui || 0) + 0.6*(b.u.carr || 0))*f; r.gun += Math.max(0, groundN(b) - (b.u.jam || 0) - (b.u.sam || 0))*0.15; r.armies.push(b); }
  for (const v of G.P[p].nbs) for (const b of stationaryAt(v)){ if (!atWar(o, b.owner) || !count(b)) continue; const f = 1 - (b.sat || 0), sh = G.P[v].sea && !sea ? 0.5 : sea && G.P[v].sea ? 0.35 : 0;
    if (!b.u.jam && !b.u.sam && !(sh && shipsN(b))) continue;
    r.jam += (b.u.jam || 0)*0.6*f*rJamF(b.owner); r.sam += (b.u.sam || 0)*rSamNear(b.owner)*f; r.ship += ((b.u.frig || 0) + 0.6*(b.u.crui || 0))*sh*f; r.armies.push(b); }
  return r; }
// drones of wing a over province p face the hostile air defence there; k = how much of a full pass (1 = strike run, ~0.08 = one hour loitering)
function droneAD(a, p, k = 1){ const o = a.owner, ad = adAround(p, o), N = count(a); let lost = 0; if (!N) return {lost, jam:ad.jam, ad};
  for (const t of UT){ const n = a.u[t], c = UNITS[t].dr; if (!n || !c) continue; const stl = t === 'drone' ? uavOf(o).stealth : rAdF(o, t), sh = n/N;
    let E = 0; for (const s0 of ['jam', 'sam', 'ship', 'gun']) E += ad[s0]*AD_CAP[s0]*AD_PK[s0][c];
    // E: kills the air defence scores on a small raid. A swarm loses more drones the bigger it is, but a falling share (the defence saturates):
    // n·(1 − e^(−E/max(6, 2.5√n))), so a swarm three times the size loses about 1.7× as many, not the same number. UAVs and strike drones: E itself.
    E *= stl*sh*k; const kills = Math.min(n*0.95, (c === 'swarm' ? n*(1 - Math.exp(-E/Math.max(6, 2.5*Math.sqrt(n)))) : E)*(0.8 + rng()*0.4)); let whole = Math.floor(kills); if (rng() < kills - whole) whole++; whole = Math.min(n, whole);
    a.u[t] -= whole; lost += whole; if (!a.u[t]) a.w[t] = 0; else a.w[t] = Math.min(a.w[t], a.u[t]*UNITS[t].hp*0.9); }
  return {lost, jam:ad.jam, ad}; }
function saturate(ad, n){ if (n <= 0) return; for (const b of ad.armies){ const u = (b.u.sam || 0) + (b.u.jam || 0); if (!u) continue; b.sat = Math.min(0.75, (b.sat || 0) + 0.12*n/Math.max(1, u)); } }
// AWACS coverage of nation n and its allies (provinces under an orbiting early-warning aircraft), cached per hour
let AEWC = {h:-1, S:null, m:new Map()};
function aewCover(n){ if (AEWC.h !== S.hour || AEWC.S !== S){ AEWC = {h:S.hour, S, m:new Map()}; } let c = AEWC.m.get(n); if (c) return c; c = new Set();
  for (const b of S.armies) if (b.fly && b.fly.kind === 'orbit' && b.fly.ph === 'over' && b.u.awacs && (b.owner === n || (b.owner >= 0 && n >= 0 && rel(n, b.owner).st === 'ally'))) for (const q of nearList(b.fly.tgt, rAewR(b.owner))) c.add(q);
  AEWC.m.set(n, c); return c; }
// hostile fighter patrols able to engage over p: Interceptors over p itself; Air Superiority Fighters, and any fighters under their side's AWACS, over its neighbours too
function capOver(p, o){ return S.armies.filter(b => b.fly && b.fly.ph === 'patrol' && b.owner !== o && atWar(o, b.owner) && isFighterWing(b) && count(b) && (b.fly.tgt === p || ((b.u.asf > 0 || aewCover(b.owner).has(p)) && G.P[b.fly.tgt].nbs.includes(p)))); }
function dogfight(a, cap, p, scale){ const o = a.owner, mine = effHP(a), theirs = cap.reduce((s0, b) => s0 + effHP(b), 0), aw = n => aewCover(n).has(p) ? rAewF(n) : 1;
  const va = sideAV([a], o, scale*(0.8 + rng()*0.4)*aw(o)), vb = {};
  for (const b of cap){ const v = sideAV([b], b.owner, scale*(0.8 + rng()*0.4)*aw(b.owner)); for (const k in v) vb[k] = (vb[k] || 0) + v[k]; }
  hurt(a, vb, 1/Math.max(1, mine)); for (const b of cap) hurt(b, va, 1/Math.max(1, theirs)); }
// what air raids did to each nation lately (drives the AI's counter-buys): S.airHit[n] = {drone, bomb, air}, decays daily
function noteHit(n, t, p = -1){ if (n < 0) return; const H = (S.airHit || (S.airHit = {}))[n] || (S.airHit[n] = {drone:0, bomb:0, air:0}); H[UNITS[t] && UNITS[t].dr ? 'drone' : isBmb(t) ? 'bomb' : 'air'] += 1;
  if (isBmb(t) && p >= 0) (H.bp || (H.bp = {}))[p] = S.hour; }   // H.bp: where bombers struck lately (fighter patrols go there)
const BLD_VAL = {silo:5, air:4, fac:4, yard:3, arms:2.5, rec:1.2, fort:1.5};
const bestBld = p => BK.filter(k => S.bld[p][k] > 0 && !bdis(p, k)).sort((x, y) => BLD_VAL[y]*(1 + 0.2*S.bld[p][y]) - BLD_VAL[x]*(1 + 0.2*S.bld[p][x]))[0] || null;
// precision hit: the most valuable building is knocked out for hrs (and with probability pLevel loses a level)
function preciseHit(p, pLevel, hrs){ const k = bestBld(p); if (!k) return '';
  if (rng() < pLevel){ S.bld[p][k]--; return `${BUILD[k].name} lost a level`; } knockOut(p, k, hrs); return `${BUILD[k].name} knocked out for ${hrs} h`; }
// bombers wreck building levels (and any construction) in proportion to the bombers over the target and their bomb load (f: 1 Heavy Bomber, 0.6 Stealth Bomber)
function bombBuildings(p, n, f = 1){ let lv = Math.min(4, Math.floor(n*0.75*f + rng())); const hit = [];
  if (S.cons[p] && rng() < 0.5){ S.cons[p] = null; hit.push('construction'); }
  while (lv-- > 0){ const ks = BK.filter(k => S.bld[p][k] > 0); if (!ks.length) break; const w = ks.map(k => BLD_VAL[k]*S.bld[p][k]), tot = w.reduce((x, y) => x + y, 0); let r = rng()*tot, k = ks[0]; for (let i = 0; i < ks.length; i++){ r -= w[i]; if (r <= 0){ k = ks[i]; break; } }
    S.bld[p][k]--; hit.push(BUILD[k].name); }
  return hit.length ? `wrecked ${hit.join(', ')}` : ''; }
// how much harder a bomber hits the troops sheltering in a city: +50% for the Heavy Bomber, +25% for the Stealth Bomber
const bombCityF = t => t === 'stealth' ? 1.25 : 1.5;
// return fire of the defenders' air defence at a manned wing (saturated SAMs fire less)
function aaFire(a, defs, scale){ const aa = {}; for (const b of defs){ const v = sideAV([b], b.owner, scale*(0.8 + rng()*0.4)*(1 - (b.sat || 0))); for (const k in v) aa[k] = (aa[k] || 0) + v[k]; }
  aa.soft = aa.armored = aa.naval = 0; hurt(a, aa, 1/Math.max(1, effHP(a))); }
// armed UAV (level IV+): one salvo of light missiles at hostile forces in p (and sometimes a building), after running the air defence
function uavSalvo(a, p){ const o = a.owner, n0 = count(a), r = droneAD(a, p, 0.5), where = G.P[p].cityName || G.P[p].name; if (!count(a)) return;
  const defs = stationaryAt(p).filter(b => atWar(o, b.owner) && count(b) > 0); let bn = '';
  if (S.owner[p] >= 0 && S.owner[p] !== o && atWar(o, S.owner[p]) && rng() < (uavLv(o) >= 5 ? 0.35 : 0.2)) bn = preciseHit(p, 0, 12);
  if (!defs.length && !bn) return; let dealt = 0, killed = 0;
  if (defs.length){ const h0 = defs.reduce((s0, b) => s0 + effHP(b), 0), u0 = defs.reduce((s0, b) => s0 + count(b), 0), av = avScale(sideAV([a], o, STRIKE*0.6*(0.8 + rng()*0.4)), 1/(1 + 0.3*r.jam)), tot = defs.reduce((s0, b) => s0 + armyHP(b), 0) || 1;
    for (const b of defs) hurt(b, av, 1/tot); dealt = Math.round(h0 - defs.reduce((s0, b) => s0 + effHP(b), 0)); killed = u0 - defs.reduce((s0, b) => s0 + count(b), 0); noteHit(defs[0].owner, 'drone'); }
  fxAt('strike', p, {}, o); if (dealt > 0) fxAt('dmg', p, {text:`−${dealt}`, color:'#ffb27a', dy:-40}, o);
  if (isSeat(o)){ tell(o, `UAV missiles over ${where}: ${dealt} damage${killed ? `, ${killed} unit${killed > 1 ? 's' : ''} destroyed` : ''}${bn ? ', ' + bn : ''}${r.lost ? `; ${r.lost} UAV lost to air defence` : ''}.`, dealt || bn ? 'good' : 'info', p); bump(o, 'unitsKilled', killed); }
  for (const me of seatsBut(o)) if (defs.some(b => b.owner === me) || (bn && S.owner[p] === me)) tell(me, `${nationName(o)} armed UAV fired on ${where}: ${dealt} damage${bn ? ', ' + bn : ''}.`, 'bad', p);
  removeEmpty(); }
// maritime patrol: attack the hostile ships (subs first) in the target sea zone or the zones next to it; their guns fire back
function mpaHunt(a, p){ const o = a.owner, zones = G.P[p].sea ? [p, ...G.P[p].nbs.filter(v => G.P[v].sea)] : G.P[p].nbs.filter(v => G.P[v].sea);
  let best = -1, bs = 0; for (const z of zones){ const sc = stationaryAt(z).filter(b => atWar(o, b.owner) && shipsN(b)).reduce((s0, b) => s0 + power(b)*(b.u.sub ? 2 : 1), 0); if (sc > bs){ bs = sc; best = z; } }
  if (G.P[p].sea || best >= 0) tradeAirRaid(o, best >= 0 ? best : p, power(a));   // the patrol also hunts convoys on trade routes here
  if (best < 0) return; const defs = stationaryAt(best).filter(b => atWar(o, b.owner) && shipsN(b) && count(b)), h0 = defs.reduce((s0, b) => s0 + effHP(b), 0), u0 = defs.reduce((s0, b) => s0 + count(b), 0), subs0 = defs.reduce((s0, b) => s0 + (b.u.sub || 0), 0);
  const av = sideAV([a], o, STRIKE*0.4*(0.8 + rng()*0.4)), tot = defs.reduce((s0, b) => s0 + armyHP(b), 0) || 1; for (const b of defs) hurt(b, av, 1/tot);
  aaFire(a, defs, 1);
  const dealt = Math.round(h0 - defs.reduce((s0, b) => s0 + effHP(b), 0)), killed = u0 - defs.reduce((s0, b) => s0 + count(b), 0), subsK = subs0 - defs.reduce((s0, b) => s0 + (b.u.sub || 0), 0);
  fxAt('strike', best, {}, o); if (dealt > 0) fxAt('dmg', best, {text:`−${dealt}`, color:'#ffb27a', dy:-40}, o);
  if (isSeat(o)){ tell(o, `Maritime patrol attacked ships in ${G.P[best].name}: ${dealt} damage${killed ? `, ${killed} sunk${subsK ? ` (${subsK} submarine${subsK > 1 ? 's' : ''})` : ''}` : ''}.`, killed ? 'good' : 'info', best); bump(o, 'unitsKilled', killed); }
  for (const me of seatsBut(o)) if (defs.some(b => b.owner === me)){ tell(me, `${nationName(o)} patrol aircraft attacked your ships in ${G.P[best].name}: ${dealt} damage${killed ? `, ${killed} lost` : ''}.`, 'bad', best); bump(me, 'unitsLost', killed); }
  removeEmpty(); }
// one hour of loitering (UAV over its target, AWACS orbit, maritime patrol): exposed to the air defence below and to hostile fighter patrols
function loiterHour(a){ const f = a.fly, p = f.tgt, o = a.owner, n0 = count(a);
  if (a.u.drone) droneAD(a, p, 0.08);
  else { const defs = stationaryAt(p).filter(b => atWar(o, b.owner) && count(b) && ((b.u.sam || 0) + (b.u.frig || 0) + (b.u.crui || 0) > 0)); if (defs.length) aaFire(a, defs, 0.3); }
  const cap = count(a) ? capOver(p, o) : []; if (cap.length) dogfight(a, cap, p, 1);
  const lost = n0 - count(a);
  if (lost > 0){ if (isSeat(o)) tell(o, `${armyName(a)} lost ${lost} aircraft over ${G.P[p].cityName || G.P[p].name}${cap.length ? ' to enemy fighters' : ' to air defence'}.`, 'bad', p);
    for (const me of seatsBut(o)) if (cap.some(b => b.owner === me) || stationaryAt(p).some(b => b.owner === me)) tell(me, `Your ${cap.some(b => b.owner === me) ? 'fighters' : 'air defence'} shot down ${lost} ${nationName(o)} ${UNITS[wingT(a)].name}${lost > 1 ? 's' : ''} near ${G.P[p].cityName || G.P[p].name}.`, 'good', p); } }
function resolveStrike(a, p){
  const o = a.owner, T = wingT(a);
  if (isDrone(a)) return;
  if (G.P[p].sea) tradeAirRaid(o, p, power(a)*0.8);   // strikes on a sea zone also hit the convoys on its trade routes
  const where = G.P[p].cityName || G.P[p].name, n00 = count(a);
  // enemy fighters patrolling over the target (Air Superiority Fighters and fighters under AWACS also over its neighbours) intercept first
  const cap = capOver(p, o);
  if (cap.length){ dogfight(a, cap, p, 2);
    fxAt('dmg', p, {text:'dogfight', color:'#f3ead2', dy:-34}, o);
    for (const me of seats()) if (o === me || cap.some(b => b.owner === me)) tell(me, `Dogfight over ${where}: ${o === me ? `your ${UNITS[T].dr ? 'drones were' : 'strike was'} intercepted (${n00 - count(a)} lost)` : `your fighters intercepted an enemy ${(T === 'awacs' ? 'AWACS' : UNITS[T].name.toLowerCase())} raid (${n00 - count(a)} shot down)`}.`, 'info', p);
    if (isBmb(T) && count(a) && count(a) <= n00*0.5){ if (isSeat(o)) tell(o, `Your bombers jettisoned their loads over ${where} and turned back.`, 'bad', p); if (S.owner[p] !== o && isSeat(S.owner[p])) tell(S.owner[p], `Your fighters broke up a ${nationName(o)} bomber raid on ${where}.`, 'good', p); removeEmpty(); return; } }
  if (!count(a)) { removeEmpty(); return; }
  // drones run the gauntlet of jammers, SAMs and guns before they reach the target; jamming also blunts the survivors
  let jamF = 1, adLost = 0;
  if (UNITS[T].dr){ const r = droneAD(a, p, 1); adLost = r.lost; jamF = 1/(1 + (UNITS[T].dr === 'sdrone' ? 0.15 : 0.3)*r.jam);
    if (T === 'swarm') saturate(r.ad, count(a));
    if (!count(a)){ if (isSeat(o)) tell(o, `Your ${UNITS[T].name}s were all shot down over ${where} by ${r.jam >= r.ad.sam ? 'jammers' : 'air defence'}.`, 'bad', p);
      for (const me of seatsBut(o)) if (S.owner[p] === me || r.ad.armies.some(b => b.owner === me)) tell(me, `Air defences destroyed ${artA(nationName(o))} ${UNITS[T].name.toLowerCase()} raid on ${where} (${adLost} downed).`, 'good', p);
      fxAt('dmg', p, {text:'shot down', color:'#9fd2ff', dy:-34}, o); removeEmpty(); return; } }
  const city = G.P[p].city, defs = stationaryAt(p).filter(b => atWar(o, b.owner) && count(b) > 0);
  // bombers run the target's air defence on the way in: only the survivors drop (the rest of the fire comes after the drop)
  const BF = rBombF(a.owner, T);   // bomb load: 1 Heavy Bomber, 0.6 Stealth Bomber, 0 anything else
  let preLost = 0; if (BF){ const aaD = defs.filter(b => (b.u.sam || 0) + (b.u.frig || 0) + (b.u.crui || 0) > 0); if (aaD.length){ const b0 = count(a); aaFire(a, aaD, 1.2); preLost = b0 - count(a);
      if (!count(a)){ if (isSeat(o)) tell(o, `Your bombers were all shot down over ${where} before they could drop.`, 'bad', p); if (S.owner[p] !== o && isSeat(S.owner[p])) tell(S.owner[p], `Your air defence shot down ${artA(nationName(o))} bomber raid on ${where} before it could drop.`, 'good', p); removeEmpty(); return; } } }
  warDamage(p, BF ? (city ? 6 : 3)*BF*a.u[T] : 5);
  const enemyLand = S.owner[p] >= 0 && S.owner[p] !== o && atWar(o, S.owner[p]);
  let bnote = '';
  if (enemyLand){ if (BF) bnote = bombBuildings(p, a.u[T], BF); else if (T === 'sdrone') bnote = preciseHit(p, a.u.sdrone >= 2 ? 0.35 : 0.15, rKoHours(a.owner)); if (bnote) noteHit(S.owner[p], T, p); }
  const cut = S.owner[p] !== o && !(S.owner[p] >= 0 && rel(o, S.owner[p]).st === 'ally') ? damageLinks(p, LINK_DMG.strike) : 0;
  if (cut && !defs.length) for (const me of new Set([o, S.owner[p]])) if (isSeat(me)) tell(me, o === me ? `Strike on ${G.P[p].cityName || G.P[p].name} cut ${cut} road and rail link${cut > 1 ? 's' : ''} for ${LINK_DMG.strike} h.` : `${nationName(o)} bombed the roads and railways at ${G.P[p].cityName || G.P[p].name}: ${cut} link${cut > 1 ? 's' : ''} out for ${LINK_DMG.strike} h.`, o === me ? 'good' : 'bad', p);
  const label = T === 'stealth' ? 'Stealth raid' : BF ? 'Bombing raid' : T === 'swarm' ? 'Swarm attack' : T === 'sdrone' ? 'Drone strike' : 'Air strike';
  if (!defs.length){ if (isSeat(o) && (bnote || !cut)) tell(o, bnote ? `${label} on ${where}: ${bnote}${adLost ? `; ${adLost} drones lost to air defence` : ''}.` : `Strike on ${where} found no targets.`, bnote ? 'good' : 'info', p);
    if (S.owner[p] !== o && bnote && isSeat(S.owner[p])) tell(S.owner[p], `${nationName(o)} ${label.toLowerCase()} on ${where}: ${bnote}.`, 'bad', p);
    if (bnote) IM.emit('fxStrike', {a, p, T, by:o, bnote:true, dealt:0, owner:S.owner[p]}); removeEmpty(); return; }
  const hpBefore = defs.map(effHP), unitsBefore = defs.reduce((s0, b) => s0 + count(b), 0), myBefore = count(a) + adLost + preLost;
  // bombers over a city hit the troops sheltering there 50% harder (a Stealth Bomber 25%: bombCityF)
  const av = avScale(sideAV([a], o, STRIKE*(0.8 + rng()*0.4)), jamF*(BF && city ? bombCityF(T) : 1)), tot = defs.reduce((s0, b) => s0 + armyHP(b), 0) || 1;
  for (const b of defs){ let f = 1/tot; if (b.owner === S.owner[p]) f *= Math.pow(0.8, S.bld[p].fort); hurt(b, av, f); }
  noteHit(defs[0].owner, T, p);
  // air defence fires back at manned aircraft (drones already ran the gauntlet)
  if (!UNITS[T].dr) aaFire(a, defs, BF ? 1.2 : 2);
  const dealt = Math.round(hpBefore.reduce((s0, h, i) => s0 + h - effHP(defs[i]), 0)), killed = unitsBefore - defs.reduce((s0, b) => s0 + count(b), 0), lost = myBefore - count(a);
  IM.emit('fxStrike', {a, p, T, by:o, bnote:!!bnote, dealt, owner:defs[0] ? defs[0].owner : null});   // the client shows it where its seat struck or can see
  if (isSeat(o)){ tell(o, `${label} on ${where}: ${dealt} damage${killed ? `, ${killed} enemy unit${killed > 1 ? 's' : ''} destroyed` : ''}${bnote ? ', ' + bnote : ''}${lost ? `, ${lost} ${UNITS[T].dr ? 'drone' : 'aircraft'}${lost > 1 && UNITS[T].dr ? 's' : ''} lost` : ''}.`, killed || dealt > 20 || bnote ? 'good' : 'info', p); cue(o, 'battle'); bump(o, 'unitsKilled', killed); bump(o, 'unitsLost', lost); }
  for (const me of seatsBut(o)) if (defs.some(b => b.owner === me)){ tell(me, `${nationName(o)} ${label.toLowerCase()} hit your forces at ${where} (${dealt} damage${killed ? `, ${pluN(killed, 'unit')} lost` : ''}${bnote ? ', ' + bnote : ''}${adLost ? `; ${adLost} drones downed` : ''}).`, 'bad', p); bump(me, 'unitsLost', killed); }
  removeEmpty();
}
function airTick(){
  for (const a of S.armies) if (a.sat){ a.sat = Math.max(0, a.sat - 0.04); if (!a.sat) delete a.sat; }   // saturated air defence recovers
  for (const a of S.armies){ if (!a.air || !count(a)) continue;
    if (a.air.car != null){ const cv = armyById(a.air.car); if (cv && cv.u.carr > 0){ if (!a.fly){ a.air.base = cv.at; a.at = cv.at; } else a.air.base = cv.to ?? cv.at; continue; }
      a.air.car = null; const nb = nearestAirbase(a.owner, a.at); if (nb >= 0){ a.air.base = nb; if (!a.fly) a.at = nb; if (isSeat(a.owner)) tell(a.owner, `${armyName(a)} lost its carrier and diverted to ${G.P[nb].cityName || G.P[nb].name}.`, 'bad', nb); } else for (const t of UT) a.u[t] = 0; }
    if (!a.fly){ if (a.air.cd > 0) a.air.cd--; else if (a.air.wear){ a.air.wear = Math.max(0, a.air.wear - maintRate(a)/24); if (a.air.wear < 1e-4) delete a.air.wear; } if (!G.P[a.air.base].sea && S.owner[a.air.base] !== a.owner && !(S.owner[a.air.base] >= 0 && friendly(a.owner, S.owner[a.air.base]))){ const nb = nearestAirbase(a.owner, a.air.base); if (nb < 0){ for (const t of UT) a.u[t] = 0; continue; } a.air.base = nb; a.at = nb; } continue; }
    const f = a.fly, B = G.P[a.air.base], T = G.P[f.tgt], dist = Math.max(1, hexDist(B.cc, T.cc)), dt = wingSpd(a)/dist;
    if (f.ph === 'out' && f.kind === 'strike' && stormAt(f.tgt)){ f.ph = 'back'; f.t = Math.max(0, 1 - f.t); if (isSeat(a.owner)) tell(a.owner, `Strike on ${G.P[f.tgt].cityName || G.P[f.tgt].name} aborted: a storm closed in over the target.`, 'info', f.tgt); continue; }
    if (f.ph === 'out'){ f.t += dt; if (f.t >= 1){
        wearWing(a, f.kind, dist, f.kind === 'patrol' || f.kind === 'hunt' ? 12 : f.kind === 'orbit' ? 16 : f.kind === 'recon' ? uavOf(a.owner).loiter : 0);
        if (f.kind === 'rebase'){ const cv = G.P[f.tgt].sea ? carrierAt(a.owner, f.tgt) : null; if (G.P[f.tgt].sea && !cv){ f.ph = 'back'; f.t = 0; continue; } a.air.base = f.tgt; a.at = f.tgt; a.air.car = cv ? cv.id : null; a.fly = null; a.air.cd = 2;
          if (isSeat(a.owner) && cv) tell(a.owner, `${armyName(a)} landed on ${armyName(cv)}: it now strikes from wherever the carrier sails.`, 'good', f.tgt); continue; }
        if (f.kind === 'strike'){ resolveStrike(a, f.tgt); f.ph = 'over'; f.hrs = 1; f.t = 0; }
        else if (f.kind === 'recon'){ const L = uavOf(a.owner), seen = visProvsAt(G.P[f.tgt].x, G.P[f.tgt].y, L.vis); S.reveal = S.reveal || {};
          for (const q of seen) S.reveal[q] = Math.max(S.reveal[q] || 0, S.hour + L.loiter + 12); visCache = null; f.ph = 'over'; f.hrs = f.h0 = L.loiter; f.t = 0; f.salvo = L.salvos;
          if (isSeat(a.owner)){ const foes = seen.reduce((s0, q) => s0 + stationaryAt(q).filter(b => b.owner >= 0 && b.owner !== a.owner).reduce((s1, b) => s1 + count(b), 0), 0); tell(a.owner, `UAV ${ROMAN[uavLv(a.owner)]} over ${G.P[f.tgt].cityName || G.P[f.tgt].name}: identifying everything in ${seen.length} provinces for ${L.loiter} h, ${foes} foreign units spotted.`, 'info', f.tgt); }
          if (f.salvo > 0){ f.salvo--; uavSalvo(a, f.tgt); } }
        else if (f.kind === 'orbit'){ f.ph = 'over'; f.hrs = 16; f.t = 0; visCache = null; if (isSeat(a.owner)) tell(a.owner, `Early warning orbit over ${G.P[f.tgt].cityName || G.P[f.tgt].name}: enemy forces within ${Math.round(visAewKm(a.owner)/10)*10} km show as unidentified contacts for 16 h.`, 'info', f.tgt); }
        else if (f.kind === 'hunt'){ f.ph = 'over'; f.hrs = rMpaH(a.owner); f.t = 0; f.nx = 0; visCache = null; mpaHunt(a, f.tgt); }
        else { f.ph = 'patrol'; f.hrs = 12; f.t = 0; } } }
    else if (f.ph === 'patrol' || f.ph === 'over'){
      if (f.ph === 'over' && (f.kind === 'recon' || f.kind === 'orbit' || f.kind === 'hunt')){ loiterHour(a); if (!count(a)) continue;
        if (f.kind === 'hunt' && ++f.nx >= 3){ f.nx = 0; mpaHunt(a, f.tgt); if (!count(a)) continue; }
        if (f.kind === 'recon' && f.salvo > 0 && f.hrs === Math.ceil((f.h0 || 12)/2)){ f.salvo--; uavSalvo(a, f.tgt); if (!count(a)) continue; } }
      if (--f.hrs <= 0){ f.ph = 'back'; f.t = 0; visCache = null; } }
    else if (f.ph === 'back'){ f.t += dt; if (f.t >= 1){ a.fly = null; a.air.cd = 6; if (a.air.pend){ for (const t in a.air.pend) a.u[t] += a.air.pend[t]; a.air.pend = null; } if (a.air.car != null){ a.at = a.air.base; } else if (S.owner[a.air.base] !== a.owner && !(S.owner[a.air.base] >= 0 && friendly(a.owner, S.owner[a.air.base]))){ const nb = nearestAirbase(a.owner, a.air.base); if (nb < 0) for (const t of UT) a.u[t] = 0; else { a.air.base = nb; a.at = nb; } } } }
  }
  removeEmpty();
}
function missileCheck(n, from, to, k){
  const M0 = mslOf(S.owner[from], k), d = hexDist(G.P[from].cc, G.P[to].cc), o = S.owner[to];
  if (!mstock(from)[k]) return {ok:false, why:`No ${M0.name}s stored here.`};
  if (bdis(from, 'silo')) return {ok:false, why:`The silo was knocked out by a strike: ${bdisH(from, 'silo')} h.`};
  if (d > M0.range) return {ok:false, why:`Out of range: ${Math.round(d*KM_HEX/10)*10} km (max ${M0.range*KM_HEX} km).`};
  if (G.P[to].sea && !stationaryAt(to).some(b => atWar(n, b.owner))) return {ok:false, why:'No targets at sea there.'};
  if (o >= 0 && o !== n && !atWar(n, o)) return {ok:false, why:`You are not at war with ${nationName(o)}.`};
  if (o === n && !stationaryAt(to).some(b => atWar(n, b.owner))) return {ok:false, why:'No enemies there.'};
  return {ok:true, d, hours:Math.max(k === 'bm' ? 4 : 2, Math.ceil(d/M0.speed))};
}
function launchMissile(n, from, to, k){
  const c = missileCheck(n, from, to, k); if (!c.ok){ refuse(n, c.why); return false; }
  mstock(from)[k]--; (S.inflight || (S.inflight = [])).push({id:S.nid++, owner:n, k, from, to, t:0, dt:1/c.hours});
  const o = S.owner[to];
  if (isSeat(n)) tell(n, `${MISSILES[k].name} launched from ${G.P[from].cityName} at ${G.P[to].cityName || G.P[to].name}. Impact in ${c.hours} h.`, 'info', to);
  for (const me of seatsBut(n)) if (o === me || stationaryAt(to).some(b => b.owner === me)){ tell(me, `Missile warning: ${nationName(n)} launched a ${MISSILES[k].name} at ${G.P[to].cityName || G.P[to].name}! Impact in ${c.hours} h.`, 'bad', to); alarm(me); }
  cue(null, 'launch'); return true;   // (every client hears a launch)
}
function interceptChance(m){
  // SAMs and Frigates in or next to the target can shoot the missile down
  let sams = 0; const near = [m.to, ...G.P[m.to].nbs];
  for (const a of S.armies){ if (a.to !== null || a.fly || !near.includes(a.at) || !atWar(a.owner, m.owner)) continue; const def = ((a.u.sam || 0) + 0.6*(a.u.frig || 0))*(1 - (a.sat || 0)); sams += def*rShield(a.owner)*(a.at === m.to ? 1 : 0.5); }
  const per = m.k === 'cm' ? 0.12 : 0.05; return Math.min(0.85, 1 - Math.pow(1 - per, sams));
}
function missileTick(){
  if (!S.inflight || !S.inflight.length) return;
  for (let i = S.inflight.length - 1; i >= 0; i--){ const m = S.inflight[i]; m.t += m.dt; if (m.t < 1) continue; S.inflight.splice(i, 1); missileImpact(m); }
}
function missileImpact(m){
  const P = G.P[m.to];   // the blast events go to every client: each shows them for its own seat's missile, its own land, or what its seat can see
  if (rng() < interceptChance(m)){
    IM.emit('fxMissile', {m, hit:false, owner:S.owner[m.to]});
    if (isSeat(m.owner)) tell(m.owner, `Your ${MISSILES[m.k].name} was intercepted over ${P.cityName || P.name}.`, 'info', m.to);
    if (S.owner[m.to] !== m.owner && isSeat(S.owner[m.to])) tell(S.owner[m.to], `Air defences intercepted an enemy ${MISSILES[m.k].name} over ${P.cityName || P.name}.`, 'good', m.to);
    return; }
  warDamage(m.to, m.k === 'bm' ? 22 : 12); if (S.owner[m.to] !== m.owner) damageLinks(m.to, LINK_DMG[m.k] || 48);
  const M0 = mslOf(m.owner, m.k), defs = stationaryAt(m.to).filter(b => atWar(m.owner, b.owner) && count(b) > 0), unitsBefore = defs.reduce((s0, b) => s0 + count(b), 0), hpBefore = defs.reduce((s0, b) => s0 + effHP(b), 0);
  if (defs.length){ const tot = defs.reduce((s0, b) => s0 + armyHP(b), 0) || 1, f0 = K*M0.power*(0.85 + rng()*0.3)*12;
    const av = {soft:f0*1.2, armored:f0, air:f0*0.4, naval:f0*0.9}; for (const b of defs){ hurt(b, av, 1/tot); if (m.k === 'bm') b.m = Math.max(0, (b.m ?? 80) - 25); } removeEmpty(); }
  let wrecked = '';
  if (m.k === 'bm' && S.owner[m.to] >= 0){ const ks = BK.filter(k => S.bld[m.to][k] > 0); if (ks.length){ const k = ks[Math.floor(rng()*ks.length)]; S.bld[m.to][k]--; wrecked = BUILD[k].name; } }
  const killed = unitsBefore - defs.reduce((s0, b) => s0 + count(b), 0), dealt = Math.round(hpBefore - defs.reduce((s0, b) => s0 + effHP(b), 0));
  IM.emit('fxMissile', {m, hit:true, dealt, owner:S.owner[m.to]});
  const where = P.cityName || P.name;
  if (isSeat(m.owner)){ tell(m.owner, `${M0.name} hit ${where}: ${dealt} damage${killed ? `, ${pluN(killed, 'unit')} destroyed` : ''}${wrecked ? `, ${wrecked} damaged` : ''}.`, 'good', m.to); bump(m.owner, 'unitsKilled', killed); }
  for (const me of seatsBut(m.owner)) if (S.owner[m.to] === me || defs.some(b => b.owner === me)){ tell(me, `Enemy ${M0.name} struck ${where}: ${dealt} damage${killed ? `, ${pluN(killed, 'unit')} lost` : ''}${wrecked ? `, ${wrecked} damaged` : ''}.`, 'bad', m.to); bump(me, 'unitsLost', killed); }
}
// satellites: a sinusoidal ground track crossing the map once per game day; the footprint, a strip along this hour's stretch of the track
// (VIS_KM.sat to each side, SAT_R in world units), identifies everything under it
const SAT_MAX = 3, SAT_COST = 220, SAT_C = {cash:SAT_COST, elec:25, rare:10}, SAT_R = VIS_KM.sat*KM_W;   // a launch: money, electronics and rare materials
function satPos(st, hr = S.hour){ const u = ((st.ph + (hr - st.h0)/24) % 1 + 1) % 1, x = u*WORLD_W, y = WORLD_H*0.5 + Math.sin(u*Math.PI*2*st.k + st.ph*6)*WORLD_H*st.amp; return [x, Math.max(OY, Math.min(WORLD_H - OY, y))]; }
// the strip a satellite sees this hour: the stretch of track it covers from the hour mark to the next, rSatR to each side ([x1, y1, x2, y2, r], world units;
// x2 is unwrapped next to x1 where the track crosses the map's edge)
function satStrip(st){ const [x1, y1] = satPos(st, S.hour); let [x2, y2] = satPos(st, S.hour + 1); if (x2 - x1 > WORLD_W/2) x2 -= WORLD_W; else if (x1 - x2 > WORLD_W/2) x2 += WORLD_W;
  return [x1, y1, x2, y2, rSatR(st.owner)]; }
const satSwath = st => visProvsIn(satStrip(st));   // the provinces whose point lies in the strip
function launchSat(n, p){ const N = S.nations[n]; S.sats = S.sats || []; if (!has(n, 'sat1') || S.sats.filter(x => x.owner === n).length >= rSatMax(n) || !hasC(N, SAT_C) || S.owner[p] !== n || !(S.bld[p].silo || p === N.capital)) return false;
  payC(N, SAT_C); S.sats.push({id:S.nid++, owner:n, ph:rng(), amp:0.18 + rng()*0.2, k:1 + Math.floor(rng()*2), h0:S.hour}); visCache = null;
  if (isSeat(n)){ tell(n, 'Reconnaissance satellite launched: it sweeps the globe once a day, revealing everything beneath its track.', 'good', p); cue(n, 'launch'); IM.emit('fxSat', p, n); }
  return true; }
