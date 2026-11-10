// Iron Meridian rules: production. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
function ucost(n, t){ const U = UNITS[t], d = docOf(n), f = d ? d.cost : 1, c = {cash:Math.round(U.cost*f), oil:U.oil, metal:Math.round(U.metal*f), iron:Math.round((U.iron || 0)*f), elec:Math.round((U.elec || 0)*f), rare:U.rare || 0, mp:U.mp};
  if (t === 'drone' && n >= 0 && S && S.nations[n]){ const lv = uavLv(n); c.elec += lv - 1; if (lv >= 4) c.rare += 2*(lv - 3); }   // better UAVs: more electronics, rare materials from the armed UAV IV
  return c; }
function canUpgrade(n, t){ const N = S.nations[n], m = markOf(n, t) + 1; if (m > 4 || N.eng || !unlocked(n, t)) return false; return hasC(N, markCost(t, m)); }
function startUpgrade(n, t){ if (!canUpgrade(n, t)) return false; const N = S.nations[n], m = markOf(n, t) + 1, c = markCost(t, m); payC(N, c); N.eng = {t, m, h:c.days*24, h0:c.days*24}; return true; }
// ---------- mobilization rules (no drawing, no UI): what a city needs before it can train a unit.
// A unit must be researched (units with no tech are known from day one) AND its city must have the unit's building(s) at the needed level, working.
const reqsOf = t => { const U = UNITS[t]; return U && U.req ? (U.req2 ? [U.req, U.req2] : [U.req]) : []; };
const bldOk = (p, t) => reqsOf(t).every(r => S.bld[p][r.b] >= r.l && !bdis(p, r.b));
// why nation n cannot mobilize unit t in province p: null when it can, else {kind, why, b}: kind 'own' (not its province), 'city' (not a city),
// 'tech' (research missing), 'bld' (building missing or too low; b = the building), 'ko' (building knocked out for a while)
function mobBlock(n, p, t){ const U = UNITS[t]; if (!U) return {kind:'unit', why:'Unknown unit'};
  if (S.owner[p] !== n) return {kind:'own', why:'Not your city'};
  if (!G.P[p].city) return {kind:'city', why:'Units are mobilized in cities'};
  if (!unlocked(n, t)) return {kind:'tech', why:`Research required: ${TECH_BY[U.tech].name}`};
  for (const r of reqsOf(t)){ const B = BUILD[r.b], lv = S.bld[p][r.b] || 0, c = S.cons[p];
    if (lv < r.l) return {kind:'bld', b:r.b, why:!canBuildHere(p, r.b) ? `Needs ${artA(B.name)}: none can be built here` : c && c.k === r.b && c.lvl >= r.l ? `${B.name}${r.l > 1 ? ' ' + ROMAN[r.l] : ''} ready in ${c.h} h` : r.l > 1 ? `Needs ${B.name} ${ROMAN[r.l]}` : `Build ${artA(B.name)} first`};
    if (bdis(p, r.b)) return {kind:'ko', b:r.b, why:`${B.name} knocked out · ${bdisH(p, r.b)} h`}; }
  return null; }
// the one rule everything asks (city sheet, production list, queueing, the AI): '' when nation n may mobilize unit t in city p, else the reason in words
function canMobilize(n, p, t){ const k = mobBlock(n, p, t); return k ? k.why : ''; }
const reqText = (p, t, n = PLAYER) => canMobilize(n, p, t);
const nextLvl = (p, k) => S.bld[p][k] + 1;
// Arms Factory price rises 40% for every OTHER province of the nation that already has one (built, or under construction at level 1+), cash, materials and iron alike
const FAC_RISE = 1.4;
function facOthers(n, p){ let c = 0; for (let q = 0; q < G.P.length; q++) if (q !== p && S.owner[q] === n && ((S.bld[q].fac || 0) >= 1 || (S.cons[q] && S.cons[q].k === 'fac'))) c++; return c; }
function buildCost(n, k, lvl, p){ const B = BUILD[k], m = Math.pow(1.6, lvl - 1)*(k === 'fac' ? Math.pow(FAC_RISE, facOthers(n, p == null ? -1 : p)) : 1), half = k === 'fort' && has(n, 'log2') ? 0.5 : 1; return {cash:Math.round(B.cost*m*half), metal:Math.round(B.metal*m*half), iron:Math.round((B.iron || 0)*m*half), elec:Math.round(((B.elec || 0) + (lvl >= 4 ? (B.ecost || B.cost)*0.1 : 0))*m*half), h:Math.round(B.days*24*(1 + 0.25*Math.max(0, lvl - 3)))}; }
// training time factors from the buildings in province p: Arms Factory (-20%/level to III, then -5%/level), Naval Yard III-V for ships, Airbase II-V for aircraft
const facF = l => l <= 3 ? 1 - 0.2*l : 0.4 - 0.05*(l - 3);
function trainF(p, t){ const B = S.bld[p], c = UNITS[t].cls; return facF(B.fac || 0)*(c === 'naval' ? 1 - 0.1*Math.max(0, (B.yard || 0) - 2) : c === 'air' ? 1 - 0.1*Math.max(0, (B.air || 0) - 1) : 1); }
const trainH = (p, t, n) => Math.max(1, Math.round(UNITS[t].build*trainF(p, t)*(docOf(n) ? docOf(n).build : 1)));
const mslH = (p, k) => Math.max(1, Math.round(MISSILES[k].build*(1 - 0.1*Math.max(0, (S.bld[p].silo || 0) - 1))));
// Rare Earth Mine output per level: 60% of a deposit (at least 1.5); hard-rock ground 1, other open ground 0.5; none in urban districts or marshes
const MINE_T = {hills:1, mountain:1, desert:1, tundra:1, plains:0.5, forest:0.5, snow:0.5};
const mineLv = P => P.rare ? Math.max(1.5, 0.6*P.rare) : (MINE_T[P.terrain || 'plains'] || 0);
function canBuildHere(p, k){ const B = BUILD[k], P = G.P[p]; if (k === 'silo' && !has(S.owner[p], 'msl1')) return false; return !P.sea && (B.where === 'any' || (B.where === 'city' && P.city) || (B.where === 'oil' && P.oil) || (B.where === 'port' && P.city && P.coast) || (B.where === 'mine' && mineLv(P) > 0)); }
function canAfford(n, t){ return unlocked(n, t) && hasC(S.nations[n], ucost(n, t)); }
const canRecruit = (n, p, t) => !canMobilize(n, p, t) && canAfford(n, t);
function recruit(n, p, t){
  if (!canRecruit(n, p, t)) return false;
  const N = S.nations[n], c = ucost(n, t); payC(N, c);
  if (n === PLAYER) (S.tut || (S.tut = {})).recruit = true;
  const h = trainH(p, t, n); S.queue[p].push({t, h, h0:h}); return true;
}
function build(n, p, k){
  const B = BUILD[k], N = S.nations[n], lvl = nextLvl(p, k), c = buildCost(n, k, lvl, p);
  if (S.owner[p] !== n || S.cons[p] || lvl > B.max || !canBuildHere(p, k)) return false;
  if (n !== PLAYER && !hasC(N, c)) aiBuyFor(n, c, 1.3, 40);   // an AI short of materials, iron or electronics for it buys them (a materials-poor power can still fortify)
  if (!hasC(N, c)) return false;
  payC(N, c); const fh = k === 'fort' && docOf(n) && docOf(n).fort ? Math.max(1, Math.round(c.h*docOf(n).fort)) : c.h; S.cons[p] = {k, lvl, h:fh, h0:fh}; return true;
}
function spawn(n, p, t){
  const air = UNITS[t].cls === 'air';
  if (!air && n === PLAYER && S.rally && S.rally[p] != null && S.rally[p] !== p){ const na = addArmy(n, p, {}); na.u[t] = 1; na.m = 80; orderMove(na, S.rally[p]); if (!na.path.length) delete S.rally[p]; return; }
  const k = UNITS[t].pack || 1;
  if (air){ const w = S.armies.find(x => x.owner === n && x.air && x.air.base === p && x.fly && UT.every(u => u === t || !x.u[u])); if (w && !S.armies.some(x => x.owner === n && x.air && x.at === p && !x.fly && UT.every(u => u === t || !x.u[u]))){ (w.air.pend || (w.air.pend = {}))[t] = (w.air.pend[t] || 0) + k; return; } }
  let a = S.armies.find(x => x.owner === n && x.at === p && x.to === null && x.path.length === 0 && !x.fly && (!!x.air === air) && (!air || UT.every(u => u === t || !x.u[u])));
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
    const lines = 1 + S.bld[p].fac;            // each Arms Factory level adds a training line
    for (let i = 1; i < Math.min(lines, q.length); i++) if (q[i].h > 1) q[i].h--;
    if (q[0].msl){ if (--q[0].h <= 0){ const it = q.shift(); mstock(p)[it.t]++; if (S.owner[p] === PLAYER){ log(`${MISSILES[it.t].name} ready in ${G.P[p].cityName}.`, 'good', p); fx('ready', p); sfx('ready'); } } return; }
    if (--q[0].h <= 0){ const it = q.shift(); spawn(S.owner[p], p, it.t);
      if (S.owner[p] === PLAYER){ fx('ready', p); sfx('ready'); log(`${UNITS[it.t].name} ready in ${G.P[p].cityName || G.P[p].name}.`, '', p);
        if (S.repeat && S.repeat[p] && !q.length && !recruit(PLAYER, p, S.repeat[p])){ const why = canMobilize(PLAYER, p, S.repeat[p]); log(`Repeat production paused in ${G.P[p].cityName}: ${why ? why.charAt(0).toLowerCase() + why.slice(1) : 'not enough resources'} for ${UNITS[S.repeat[p]].name}.`, 'info', p); } } } }
function consHour(p){ const c = S.cons[p];
    if (S.owner[p] < 0){ S.cons[p] = null; return; }
    if (--c.h <= 0){ S.bld[p][c.k] = c.lvl; S.cons[p] = null; if (S.owner[p] === PLAYER) log(`${BUILD[c.k].name}${BUILD[c.k].max > 1 ? ' ' + ROMAN[c.lvl] : ''} completed in ${G.P[p].cityName || G.P[p].name}.`, 'good', p); } }
function engHour(N){
    if (--N.eng.h <= 0){ const {t, m} = N.eng; (N.mk || (N.mk = {}))[t] = m; N.tv = (N.tv || 0) + 1; N.eng = null;
      if (N.id === PLAYER){ log(`${UNITS[t].name} upgraded to Mk ${ROMAN[m]}: +${Math.round((MARK_F[m] - 1)*100)}% attack and defense for every one you field.`, 'good'); sfx('research'); } } }
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
  for (let go = true; go;){ go = false; for (const T of TECH){ devFill(N); if (startResearch(n, T.id)){ for (const s of R_SLOTS) if (N[s] && N[s].id === T.id){ N[s].h = 1; researchSlotHour(N, s); } k++; go = true; } } }
  Object.assign(N, keep); visCache = null; return k; }
// spawn: a new force of k units of type t for nation n in province p (ground and air on land, ships at sea or on a coast), built by addArmy
function devSpawnOk(p, t){ const U = UNITS[t], P = G.P[p]; return !!U && !!P && (U.cls === 'naval' ? !!(P.sea || P.coast) : !P.sea); }
function devSpawn(n, p, t, k){ if (!S.nations[n] || !S.nations[n].alive || !devSpawnOk(p, t)) return null;
  const a = addArmy(n, p, {[t]:Math.max(1, Math.min(999, Math.round(k) || 1))}); if (UNITS[t].cls === 'air') a.air = {base:p, cd:0}; visCache = null; return a; }
/*@ENDDEV*/
