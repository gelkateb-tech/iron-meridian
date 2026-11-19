// REBELS (docs/REBELS-PLAN.md): a read-only measurement, rules only, no browser. It plays all-computer games and counts what the occupation rule
// does: uprisings, the ones an infantry garrison crushed, cities lost to rebels, integrations, Pacify, and the land the nations gained.
//   node tools/rebels-sim.js [--days 60] [--seed 12345] [--scn world64|world] [--variant now|old]
//     now   the rules as they are (the rebels rule built from the plan, with the owner's change: one infantry unit beats any rebels)
//     old   the rule before it (unrest above 60%: a daily chance of partisans), laid over a fresh copy of the rules in memory (later function
//           declarations win) with the new rule's hooks as no-ops: the comparison the plan's table makes
// The computer never starts a war (AI_STARTS_WARS false): what it takes here is independent land (the nations world: TIER_FREE).
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d; };
const DAYS = +arg('days', 60), SEED = +arg('seed', 12345), SCN = arg('scn', 'world64'), VAR = arg('variant', 'now');
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const RULES = FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');

// the rule before the rebels rule (master before it was built: unrestDay and rebelHour as they were), the new hooks switched off
const OLD = `
function unrestDay(){
  S.unrest = S.unrest || G.P.map(() => 0);
  for (const N of S.nations){ if (!N.alive || !N.mob) continue; for (const p of ownedBy(N.id)) if (S.home[p] === N.id) S.unrest[p] = Math.max(unrestOf(p) - 4, Math.min(15*N.mob, unrestOf(p) + 3*N.mob)); }
  S.integ = S.integ || {};
  for (let p = 0; p < G.P.length; p++){ if (G.P[p].sea) continue; const o = S.owner[p], home = S.home[p];
    if (o < 0 || home === o){ if (!(o >= 0 && S.nations[o].mob)) S.unrest[p] = Math.max(0, unrestOf(p) - 4); continue; }
    const garrison = S.armies.reduce((s0, a) => s0 + (a.owner === o && a.at === p && a.to === null && !a.fly ? groundN(a) : 0), 0);
    const ik = p + ':' + o; S.integ[ik] = garrison >= 2 ? (S.integ[ik] || 0) + 1 : Math.max(0, (S.integ[ik] || 0) - 1);
    if (S.integ[ik] >= 10){ S.unrest[p] = Math.min(unrestOf(p), 30); continue; }
    const homeAlive = home >= 0 && S.nations[home].alive, d = (homeAlive ? 5 : 3) + (G.P[p].city ? 2 : 0) - Math.min(9, garrison*1.5);
    const before = unrestOf(p); S.unrest[p] = Math.max(0, Math.min(100, before + d));
    if (S.unrest[p] > 60 && rng() < (S.unrest[p] - 60)/160 && !S.armies.some(a => a.rebel && a.at === p)){
      const r = addArmy(NEUTRAL, p, {inf:2 + Math.floor(rng()*3) + (G.P[p].city ? 2 : 0)}); r.rebel = true; S.unrest[p] -= 20; } }
}
function rebelHour(){
  for (const a of S.armies){ if (!a.rebel || !count(a) || a.to !== null) continue; const p = a.at;
    if (S.armies.some(b => b !== a && b.at === p && b.to === null && !b.fly && b.owner === S.owner[p] && count(b))){ a.hold = 0; continue; }
    if (++a.hold < 24) continue;
    const prev = S.owner[p], home = S.home[p], to = home >= 0 && S.nations[home].alive && home !== prev ? home : NEUTRAL;
    S.owner[p] = to; ownChanged(); S.cap[p] = null; S.queue[p] = []; S.cons[p] = null; S.unrest[p] = 10; geoChanged(); for (const t of UT) a.u[t] = 0;
    if (to >= 0) addArmy(to, p, {inf:2});
    if (prev >= 0) checkNation(prev); }
  removeEmpty();
}
function rebelCrush(){} function occReset(){} function aiPacify(){} function aiGarrison(){} function aiRebelHunt(){} function aiBrake(){ return false; }
`;
// the counters: each uprising (a new rebel force), the ones crushed by infantry (as they rose, or later), provinces lost to rebels, Pacify
const COUNT = `
const RBS = {spawn:0, crushRise:0, crushLater:0, revolt:0, toHome:0, toFree:0, revoltCity:0, pacify:0, seen:new Set()};
{ const f = rebelHour; rebelHour = function(){ const o0 = S.owner.slice(); f(); for (let p = 0; p < o0.length; p++) if (S.owner[p] !== o0[p]){ RBS.revolt++; if (G.P[p].city) RBS.revoltCity++; if (S.owner[p] >= 0) RBS.toHome++; else RBS.toFree++; } }; }
${VAR === 'now' ? `{ const f = rebelRise; rebelRise = function(...a){ const r = f(...a); if (!r) RBS.crushRise++; return r; }; }
{ const f = rebelCrush; rebelCrush = function(){ const k = S.armies.filter(a => a.rebel && a.to === null && count(a) && rebelGuard(a.at, S.owner[a.at])).length; RBS.crushLater += k; f(); }; }
{ const f = pacify; pacify = function(...a){ const r = f(...a); if (r) RBS.pacify++; return r; }; }` : ''}
`;
const SRC = "'use strict';\n" + RULES + (VAR === 'old' ? OLD : '') + COUNT +
  '\nreturn {IM, RBS, get S(){ return S; }, get G(){ return G; }, groundN, moraleOf, count};';

function play(){
  const R = new Function(SRC)(), api = R.IM.api; let caps = 0, capFree = 0; const out = {};
  if (SCN === 'world64') api.useScenario('world64'); api.newGame(SEED, 0, []); const S = R.S, G = R.G; S.started = true;
  R.IM.on('fxCapture', (p, O, prev) => { if (O >= 0){ caps++; if (prev < 0) capFree++; } });
  const held0 = S.owner.filter((o, p) => o >= 0 && !G.P[p].sea).length;
  const occ = () => { const L = []; for (let p = 0; p < G.P.length; p++){ const o = S.owner[p]; if (o < 0 || !G.P[p].city || S.home[p] === o) continue; if ((S.integ || {})[p + ':' + o] >= 10) continue;
      L.push(S.armies.reduce((s, a) => s + (a.owner === o && a.at === p && a.to === null && !a.fly ? R.groundN(a) : 0), 0)); } return L; };
  for (let h = 1; h <= DAYS*24 && !S.over; h++){ for (let q = 0; q < api.BATTLE_Q; q++) api.tickQ();
    for (const a of S.armies) if (a.rebel && !R.RBS.seen.has(a.id)){ R.RBS.seen.add(a.id); R.RBS.spawn++; }
    if (h % (30*24) === 0){ const d = h/24, L = occ(), integ = Object.entries(S.integ || {}).filter(([k, v]) => v >= 10 && S.owner[+k.split(':')[0]] === +k.split(':')[1] && G.P[+k.split(':')[0]].city).length;
      out[d] = {caps, capFree, net:S.owner.filter((o, p) => o >= 0 && !G.P[p].sea).length - held0, uprisings:R.RBS.spawn + R.RBS.crushRise, crushedAtRise:R.RBS.crushRise, crushedLater:R.RBS.crushLater,
        lost:R.RBS.revolt, lostCities:R.RBS.revoltCity, toHome:R.RBS.toHome, toFree:R.RBS.toFree, pacify:R.RBS.pacify, integCities:integ,
        occCities:L.length, gar0:L.filter(x => x === 0).length, gar1:L.filter(x => x === 1).length, gar23:L.filter(x => x >= 2 && x <= 3).length, gar4:L.filter(x => x >= 4).length,
        mor30:(() => { let k = 0; for (let p = 0; p < G.P.length; p++){ const o = S.owner[p]; if (o >= 0 && G.P[p].city && S.home[p] !== o && R.moraleOf(p) < 30) k++; } return k; })(),
        broke:S.nations.filter(N => N.alive && N.cash < 0).length}; } }
  return out;
}
const t0 = Date.now();
console.log(JSON.stringify({scn:SCN, variant:VAR, seed:SEED, days:DAYS, at:play(), s:Math.round((Date.now() - t0)/1000)}));
