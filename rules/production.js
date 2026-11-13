// Iron Meridian rules: production. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
function ucost(n, t){ const U = UNITS[t], d = docOf(n), f = d ? d.cost : 1, c = {cash:Math.round(U.cost*f), oil:U.oil, metal:Math.round(U.metal*f), iron:Math.round((U.iron || 0)*f), elec:Math.round((U.elec || 0)*f), rare:U.rare || 0, mp:U.mp};
  if (t === 'drone' && n >= 0 && S && S.nations[n]){ const lv = uavLv(n); c.elec += lv - 1; if (lv >= 4) c.rare += 2*(lv - 3); }   // better UAVs: more electronics, rare materials from the armed UAV IV
  return c; }
// ---------- mobilization rules (no drawing, no UI): what a city needs before it can train a unit.
// A unit must be researched (units with no tech are known from day one) AND its city must have the unit's building(s) at the needed level, working.
const reqsOf = t => { const U = UNITS[t]; return U && U.req ? (U.req2 ? [U.req, U.req2] : [U.req]) : []; };
const bldOk = (p, t) => reqsOf(t).every(r => S.bld[p][r.b] >= r.l && !bdis(p, r.b));
// why nation n cannot mobilize unit t in province p: null when it can, else {kind, why, b}: kind 'own' (not its province), 'city' (not a city),
// 'tech' (research missing), 'bld' (building missing or too low; b = the building), 'ko' (building knocked out for a while)
function mobBlock(n, p, t){ const U = UNITS[t]; if (!U) return {kind:'unit', why:'Unknown unit'};
  if (S.owner[p] !== n) return {kind:'own', why:'Not your city'};
  if (!G.P[p].city) return {kind:'city', why:'Units are mobilized in cities'};
  if (!unlocked(n, t)) return {kind:'tech', why:`Research required: ${RN[U.tech].name}`};
  for (const r of reqsOf(t)){ const B = BUILD[r.b], lv = S.bld[p][r.b] || 0, c = S.cons[p];
    if (lv < r.l) return {kind:'bld', b:r.b, why:!canBuildHere(p, r.b) ? `Needs ${artA(B.name)}: none can be built here` : c && c.k === r.b && c.lvl >= r.l ? `${B.name}${r.l > 1 ? ' ' + ROMAN[r.l] : ''} ready in ${c.h} h` : r.l > 1 ? `Needs ${B.name} ${ROMAN[r.l]}` : `Build ${artA(B.name)} first`};
    if (bdis(p, r.b)) return {kind:'ko', b:r.b, why:`${B.name} knocked out · ${bdisH(p, r.b)} h`}; }
  return null; }
// the one rule everything asks (city sheet, production list, queueing, the AI): '' when nation n may mobilize unit t in city p, else the reason in words
function canMobilize(n, p, t){ const k = mobBlock(n, p, t); return k ? k.why : ''; }
const reqText = (p, t, n) => canMobilize(n, p, t);
// ---------- training queue limit: at most QUEUE_MAX units waiting or training per city, for everyone (the AI too). A future premium pass gives
// extra slots (LATER.md): ask queueMax(n), not the constant. Old saves with longer queues keep them but cannot add more until below the limit.
// Missiles (silo) are not unit training and do not count.
const QUEUE_MAX = 2;
const queueMax = n => QUEUE_MAX;
const queueUsed = p => S.queue[p].reduce((c, it) => c + (it.msl ? 0 : 1), 0);
const queueFull = (n, p) => queueUsed(p) >= queueMax(n);
// '' when city p can take another unit, else the reason in words
const queueWhy = (n, p) => queueFull(n, p) ? `Training queue full (${queueMax(n)}/${queueMax(n)})` : '';
const nextLvl = (p, k) => S.bld[p][k] + 1;
// ---------- Recruiting Office (levels I-V): every unit trained in its city trains 10% faster per level, and the city gives 3k manpower a day at level I
// and 1.5k more per level. recPct / recMp are per level (the page words its tooltips from them), recSpeed is the city's training-time factor
const REC_MAX = 5;
const recLv = p => Math.max(0, Math.min(REC_MAX, (S.bld[p] && S.bld[p].rec) || 0));
const recPct = l => 10*Math.max(0, Math.min(REC_MAX, l || 0));
const recMp = l => l > 0 ? 1.5*(Math.min(REC_MAX, l) + 1) : 0;
const recSpeed = p => 1 - recPct(recLv(p))/100;
// the cost of a building priced from a table of levels (BUILD[k].lv): the same fields as buildCost
function lvCost(k, lvl){ const L = BUILD[k].lv[Math.max(1, Math.min(BUILD[k].max, lvl))]; return {cash:L.cash, metal:L.metal || 0, iron:L.iron || 0, elec:L.elec || 0, h:L.days*24}; }
// all the speed bonuses multiply, but no unit trains in less than 30% of its base time
const TRAIN_MIN = 0.3;
const trainEff = (p, t, n) => Math.max(TRAIN_MIN, trainF(p, t)*(docOf(n) ? docOf(n).build : 1));
// a Recruiting Office level is finished in p: every unit queued or in training there has its REMAINING time cut by the new ratio at once
// (f0: each queued item's training factor before the level, from recBefore)
const recBefore = p => S.queue[p].map(it => it.msl ? 1 : trainEff(p, it.t, S.owner[p]));
function recRetime(p, f0){ S.queue[p].forEach((it, i) => { if (it.msl || !(f0[i] > 0)) return; const r = trainEff(p, it.t, S.owner[p])/f0[i]; if (!(r < 1)) return;
  it.h = Math.max(1, Math.round(it.h*r)); it.h0 = Math.max(it.h, Math.round((it.h0 || it.h)*r)); }); }
// Army Base and Arms Industry prices rise 40% for every OTHER province of the nation that already has one of the same kind (built, or under construction),
// cash, materials and iron alike; the two do not raise each other's price
const FAC_RISE = 1.4;
const RISE_K = {fac:1, arms:1};
function facOthers(n, p, k = 'fac'){ let c = 0; for (const q of ownedBy(n)) if (q !== p && ((S.bld[q][k] || 0) >= 1 || (S.cons[q] && S.cons[q].k === k))) c++; return c; }
function buildCost(n, k, lvl, p){ if (BUILD[k].lv) return lvCost(k, lvl); const B = BUILD[k], m = Math.pow(1.6, lvl - 1)*(lvl === 1 && B.first ? B.first : 1)*(RISE_K[k] ? Math.pow(FAC_RISE, facOthers(n, p == null ? -1 : p, k)) : 1), half = k === 'fort' && has(n, 'log2') ? 0.5 : 1; return {cash:Math.round(B.cost*m*half), metal:Math.round(B.metal*m*half), iron:Math.round((B.iron || 0)*m*half), elec:Math.round(((B.elec || 0) + (lvl >= 4 ? (B.ecost || B.cost)*0.1 : 0))*m*half), h:Math.round(B.days*24*(1 + 0.25*Math.max(0, lvl - 3)))}; }
// training time factors from the buildings in province p: Army Base for ground units, the units an Army Base or a Recruiting Office mobilizes
// (-20%/level to III, then -5%/level), Naval Yard III-V for ships, Airbase II-V for aircraft
const facF = l => l <= 3 ? 1 - 0.2*l : 0.4 - 0.05*(l - 3);
const baseTrains = t => reqsOf(t).some(r => r.b === 'fac' || r.b === 'rec');
function trainF(p, t){ const B = S.bld[p], c = UNITS[t].cls; return (baseTrains(t) ? facF(B.fac || 0) : 1)*(c === 'naval' ? 1 - 0.1*Math.max(0, (B.yard || 0) - 2) : c === 'air' ? 1 - 0.1*Math.max(0, (B.air || 0) - 1) : 1)*recSpeed(p); }
const trainH = (p, t, n) => Math.max(1, Math.round(UNITS[t].build*trainEff(p, t, n)*(n >= 0 ? rTrainF(n, t) : 1)));
const mslH = (p, k) => Math.max(1, Math.round(MISSILES[k].build*(1 - 0.1*Math.max(0, (S.bld[p].silo || 0) - 1))));
function canBuildHere(p, k){ const B = BUILD[k], P = G.P[p]; if (k === 'silo' && !has(S.owner[p], 'msl1')) return false; return !P.sea && (B.where === 'any' || (B.where === 'city' && P.city) || (B.where === 'port' && P.city && P.coast)); }
function canAfford(n, t){ return unlocked(n, t) && hasC(S.nations[n], ucost(n, t)); }
const canRecruit = (n, p, t) => !canMobilize(n, p, t) && !queueFull(n, p) && canAfford(n, t);
function recruit(n, p, t){
  if (!canRecruit(n, p, t)) return false;
  const N = S.nations[n], c = ucost(n, t); payC(N, c);
  if (isSeat(n)){ const D = desk(n); (D.tut || (D.tut = {})).recruit = true; }
  const h = trainH(p, t, n); S.queue[p].push({t, h, h0:h}); return true;
}
function build(n, p, k){
  const B = BUILD[k], N = S.nations[n], lvl = nextLvl(p, k), c = buildCost(n, k, lvl, p);
  if (S.owner[p] !== n || S.cons[p] || lvl > B.max || !canBuildHere(p, k)) return false;
  if (!isSeat(n) && !hasC(N, c)) aiBuyFor(n, c, 1.3, 40);   // an AI short of materials, iron or electronics for it buys them (a materials-poor power can still fortify)
  if (!hasC(N, c)) return false;
  payC(N, c); const fh = k === 'fort' && docOf(n) && docOf(n).fort ? Math.max(1, Math.round(c.h*docOf(n).fort)) : c.h; S.cons[p] = {k, lvl, h:fh, h0:fh}; return true;
}
function spawn(n, p, t){
  const air = UNITS[t].cls === 'air';
  const RL = isSeat(n) ? desk(n).rally : null;   // a seat's rally points: new ground units march there on their own
  if (!air && RL && RL[p] != null && RL[p] !== p){ const na = addArmy(n, p, {}); na.u[t] = 1; na.m = 80; orderMove(na, RL[p]); if (!na.path.length) delete RL[p]; return; }
  const k = rPack(n, t);   // (a card of swarm drones holds six, eight with the Bigger Salvo upgrade)
  // new units join an idle force of the same kind here that has room under its stack limit (STACK_LIM), otherwise they form a new force
  const dm = DOM_T[t], room = x => stackSizes(x)[dm] + (dm === 'air' ? 1 + Object.values((x.air && x.air.pend) || {}).reduce((s0, v) => s0 + Math.ceil(v/k), 0) : k) <= STACK_LIM[dm];
  if (air){ const w = armiesOf(n).find(x => x.air && x.air.base === p && x.fly && UT.every(u => u === t || !x.u[u]) && room(x)); if (w && !armiesOf(n).some(x => x.air && x.at === p && !x.fly && UT.every(u => u === t || !x.u[u]))){ (w.air.pend || (w.air.pend = {}))[t] = (w.air.pend[t] || 0) + k; return; } }
  let a = armiesOf(n).find(x => x.at === p && x.to === null && x.path.length === 0 && !x.fly && (!!x.air === air) && (!air || UT.every(u => u === t || !x.u[u])) && room(x));
  if (!a){ a = addArmy(n, p, {}); if (air) a.air = {base:p, cd:0}; }
  const h0 = armyHP(a); a.m = h0 ? ((a.m ?? 80)*h0 + 80*UNITS[t].hp*k)/(h0 + UNITS[t].hp*k) : 80;
  a.u[t] += k;
}
/* ---------------- Strategic missiles ---------------- */
const mstock = p => (S.mstock || (S.mstock = {}))[p] || (S.mstock[p] = {cm:0, bm:0});
const mslCost = M0 => ({cash:M0.cost, oil:M0.oil, metal:M0.metal, iron:M0.iron, elec:M0.elec, rare:M0.rare});
function canBuildMissile(n, p, k){ const M0 = MISSILES[k], N = S.nations[n]; return S.owner[p] === n && S.bld[p].silo > 0 && has(n, M0.tech) && hasC(N, mslCost(M0)); }
function buildMissile(n, p, k){ if (!canBuildMissile(n, p, k)) return false; const M0 = MISSILES[k], N = S.nations[n]; payC(N, mslCost(M0)); const h = mslH(p, k); S.queue[p].push({t:k, h, h0:h, msl:true}); return true; }
// the hour steps of production, construction, unit upgrades and research (one province / nation each; tick() runs them every game hour)
function prodHour(p){ const q = S.queue[p];
    if (S.owner[p] < 0){ q.length = 0; return; }
    { const it0 = q[0]; if (it0.msl ? bdis(p, 'silo') : reqsOf(it0.t).some(r => bdis(p, r.b))) return; }   // knocked-out building: its line waits
    const lines = 1 + S.bld[p].fac;            // each Army Base level adds a training line
    for (let i = 1; i < Math.min(lines, q.length); i++) if (q[i].h > 1) q[i].h--;
    if (q[0].msl){ if (--q[0].h <= 0){ const it = q.shift(); mstock(p)[it.t]++; if (isSeat(S.owner[p])){ tell(S.owner[p], `${MISSILES[it.t].name} ready in ${G.P[p].cityName}.`, 'good', p); fxAt('ready', p, {}, null, S.owner[p]); cue(S.owner[p], 'ready'); } } return; }
    if (--q[0].h <= 0){ const it = q.shift(); spawn(S.owner[p], p, it.t);
      const o = S.owner[p]; if (isSeat(o)){ const RP = desk(o).repeat; fxAt('ready', p, {}, null, o); cue(o, 'ready'); tell(o, `${UNITS[it.t].name} ready in ${G.P[p].cityName || G.P[p].name}.`, '', p);
        if (RP && RP[p] && !q.length && !recruit(o, p, RP[p])){ const why = canMobilize(o, p, RP[p]); tell(o, `Repeat production paused in ${G.P[p].cityName}: ${why ? why.charAt(0).toLowerCase() + why.slice(1) : 'not enough resources'} for ${UNITS[RP[p]].name}.`, 'info', p); } } } }
function consHour(p){ const c = S.cons[p];
    if (S.owner[p] < 0){ S.cons[p] = null; return; }
    if (--c.h <= 0){ const f0 = c.k === 'rec' ? recBefore(p) : null; S.bld[p][c.k] = c.lvl; S.cons[p] = null; if (f0) recRetime(p, f0);
      if (isSeat(S.owner[p])) tell(S.owner[p], `${BUILD[c.k].name}${BUILD[c.k].max > 1 ? ' ' + ROMAN[c.lvl] : ''} completed in ${G.P[p].cityName || G.P[p].name}.${f0 && f0.length ? ' Units in training there will be ready sooner.' : ''}`, 'good', p); } }
/*@DEV*/
// developer mode rules (test build only). They finish, pay and create through the game's own steps: startResearch, researchHour,
// consHour, prodHour, engHour, addArmy. devHour runs at the top of every game hour; devDone also runs right after a click (instant while paused).
function devFill(N){ for (const k of CK) if (!((N[k] || 0) >= DEV_FILL)) N[k] = DEV_FILL; }   // unlimited resources: all seven topped up
function devDone(n){ const N = S && S.nations[n]; if (!N || !N.alive) return 0; let k = 0;
  if (DEV.research) for (const s of R_SLOTS) if (N[s]){ N[s].h = 1; researchSlotHour(N, s); k++; }
  if (DEV.instant){
    if (N.eng){ N.eng.h = 1; engHour(N); k++; }
    for (let p = 0; p < G.P.length; p++){ if (S.owner[p] !== n) continue;
      if (S.cons[p]){ S.cons[p].h = 1; consHour(p); k++; }
      const q = S.queue[p]; for (let i = q.length; i > 0 && q.length; i--){ const L = q.length, it = q[0]; it.h = 1; prodHour(p); if (q.length === L && q[0] === it) break; k++; } } }   // (a knocked-out line waits; repeat orders run once per pass)
  if (k) visCache = null; return k; }
function devHour(n){ const N = S.nations[n]; if (!N || !N.alive) return; if (DEV.res) devFill(N); devDone(n); }
// research every technology at once (free: the stocks are restored afterwards)
function devResearchAll(n){ const N = S.nations[n]; if (!N || !N.alive) return 0; const keep = Object.fromEntries(CK.map(k => [k, N[k]])); let k = 0;
  for (const s of R_SLOTS) if (N[s]){ N[s].h = 1; researchSlotHour(N, s); k++; }
  for (let go = true; go;){ go = false; for (const T of RNODES){ if (rNextLv(n, T.id)){ rGrant(N, T.id, T.lv.length); k++; } } }
  Object.assign(N, keep); visCache = null; return k; }
// spawn: a new force of k units of type t for nation n in province p (ground and air on land, ships at sea or in a port city), built by addArmy
function devSpawnOk(p, t){ const U = UNITS[t], P = G.P[p]; return !!U && !!P && (U.cls === 'naval' ? shipPlaceOk(p) : !P.sea); }
function devSpawn(n, p, t, k){ if (!S.nations[n] || !S.nations[n].alive || !devSpawnOk(p, t)) return null;
  const a = addArmy(n, p, {[t]:Math.max(1, Math.min(999, Math.round(k) || 1))}); if (UNITS[t].cls === 'air') a.air = {base:p, cd:0}; visCache = null; return a; }
/*@ENDDEV*/
