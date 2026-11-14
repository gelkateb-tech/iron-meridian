// REBELS plan (docs/REBELS-PLAN.md): a read-only measurement, rules only, no browser. Nothing in the rules files is changed: the plan's numbers
// are laid over a fresh copy of the rules in memory (later function declarations win), so this compares today's occupation rule with the plan's.
//   node tools/rebels-sim.js [--days 60] [--seed 12345] [--scn world64|world] [--variant now|plan|planai] [--duel]
//     now     today's rule (unrest above 60%: a daily chance of partisans)
//     plan    the plan's numbers (rebels for certain below 30% morale in occupied cities, 3 days' grace, 5 days' cooldown) with today's AI
//     planai  the plan plus a stand-in for the AI's new habit: it pays Pacify ($40M) for an occupied city under 45% morale that has a unit in it
//     --duel  rebels against a garrison in a captured city (who wins the fight), 12 cities per match-up
// The computer never starts a war (AI_STARTS_WARS false): what it takes here is independent land (the nations world: TIER_FREE).
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d; };
const DAYS = +arg('days', 60), SEED = +arg('seed', 12345), SCN = arg('scn', 'world64'), VAR = arg('variant', 'now'), DUEL = process.argv.includes('--duel');
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const RULES = FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');

// the plan's rule (what docs/REBELS-PLAN.md proposes), as it would replace unrestDay and rebelHour in rules/economy.js
const PLAN = `
const RB = {city:6, cityFree:4, rural:2, perUnit:3, maxUnits:4, ruralCap:50, below:30, grace:72, cool:120, integDays:10, integMor:50, spawnDrop:15, pacCost:40, pacDrop:25, pacCool:72};
const rebelSize = p => { const pp = popOf(p); return pp >= 20 ? 6 : pp >= 5 ? 5 : pp >= 1.5 ? 4 : 3; };
function unrestDay(){
  S.unrest = S.unrest || G.P.map(() => 0); S.integ = S.integ || {}; S.rcool = S.rcool || {};
  for (const N of S.nations){ if (!N.alive || !N.mob) continue; for (const p of ownedBy(N.id)) if (S.home[p] === N.id) S.unrest[p] = Math.max(unrestOf(p) - 4, Math.min(15*N.mob, unrestOf(p) + 3*N.mob)); }
  for (let p = 0; p < G.P.length; p++){ if (G.P[p].sea) continue; const o = S.owner[p], home = S.home[p], P = G.P[p];
    if (o < 0 || home === o){ if (!(o >= 0 && S.nations[o].mob)) S.unrest[p] = Math.max(0, unrestOf(p) - 4); continue; }
    const garrison = S.armies.reduce((s0, a) => s0 + (a.owner === o && a.at === p && a.to === null && !a.fly && !a.rebel ? groundN(a) : 0), 0);
    const ik = p + ':' + o; if ((S.integ[ik] || 0) >= RB.integDays){ S.unrest[p] = Math.max(0, unrestOf(p) - 4); continue; }
    S.integ[ik] = garrison >= 1 && moraleOf(p) >= RB.integMor ? (S.integ[ik] || 0) + 1 : Math.max(0, (S.integ[ik] || 0) - 1);
    if (S.integ[ik] >= RB.integDays){ RBS.integ++; continue; }
    const homeAlive = home >= 0 && S.nations[home].alive, d = (P.city ? (homeAlive ? RB.city : RB.cityFree) : RB.rural) - RB.perUnit*Math.min(RB.maxUnits, garrison);
    S.unrest[p] = Math.max(0, Math.min(P.city ? 100 : RB.ruralCap, unrestOf(p) + d));
    if (REB_AI && P.city && !isSeat(o) && moraleOf(p) < 45 && garrison >= 1 && S.nations[o].cash >= 100 && !((S.pcool || {})[p] > S.hour)){ S.pcool = S.pcool || {}; S.pcool[p] = S.hour + RB.pacCool; S.nations[o].cash -= RB.pacCost; S.unrest[p] = Math.max(0, S.unrest[p] - RB.pacDrop); RBS.pacify++; }
    if (P.city && moraleOf(p) < RB.below && S.occ[p] != null && S.hour - S.occ[p] >= RB.grace && !(S.rcool[p] > S.hour) && !S.armies.some(a => a.rebel && a.at === p && count(a))){
      const r = addArmy(NEUTRAL, p, {inf:rebelSize(p)}); r.rebel = true; r.hold = 0; S.unrest[p] = Math.max(0, S.unrest[p] - RB.spawnDrop); S.rcool[p] = S.hour + RB.cool; RBS.spawnG[Math.min(4, garrison)]++; } }
}
function rebelHour(){
  for (const a of S.armies){ if (!a.rebel || !count(a) || a.to !== null) continue; const p = a.at;
    if (S.armies.some(b => b !== a && b.at === p && b.to === null && !b.fly && b.owner === S.owner[p] && count(b))){ a.hold = 0; continue; }
    a.hold = (a.hold || 0) + 1; if (a.hold < 24) continue;
    const prev = S.owner[p], home = S.home[p], to = home >= 0 && S.nations[home].alive && home !== prev ? home : NEUTRAL, n = a.u.inf;
    S.owner[p] = to; ownChanged(); S.cap[p] = null; S.queue[p] = []; S.cons[p] = null; S.bld[p].fort = Math.max(0, (S.bld[p].fort || 0) - 1); S.unrest[p] = 10; S.occ[p] = null; geoChanged();
    if (to >= 0){ for (const t of UT) a.u[t] = 0; addArmy(to, p, {inf:Math.max(2, n)}); } else delete a.rebel;
    if (prev >= 0) checkNation(prev); }
  removeEmpty();
}`;
const COUNT = `
const RBS = {spawn:0, spawnG:[0, 0, 0, 0, 0], revolt:0, toHome:0, toFree:0, integ:0, pacify:0, seen:new Set()};
{ const f = rebelHour; rebelHour = function(){ const o0 = S.owner.slice(); f(); for (let p = 0; p < o0.length; p++) if (S.owner[p] !== o0[p]){ RBS.revolt++; if (S.owner[p] >= 0) RBS.toHome++; else RBS.toFree++; } }; }
`;
const SRC = "'use strict';\nlet REB_AI = " + (VAR === 'planai') + ";\n" + RULES + (VAR === 'now' ? '' : PLAN) + COUNT +
  '\nreturn {IM, RBS, get S(){ return S; }, get G(){ return G; }, groundN, moraleOf, unrestOf, addArmy, count, popOf, NEUTRAL, tick:() => tick()};';

function play(){
  const R = new Function(SRC)(), api = R.IM.api; let caps = 0, capFree = 0; const out = {};
  if (SCN === 'world64') api.useScenario('world64'); api.newGame(SEED, 0, []); const S = R.S, G = R.G; S.started = true;
  R.IM.on('fxCapture', (p, O, prev) => { if (O >= 0){ caps++; if (prev < 0) capFree++; } });
  const held0 = S.owner.filter((o, p) => o >= 0 && !G.P[p].sea).length;
  for (let h = 1; h <= DAYS*24 && !S.over; h++){ for (let q = 0; q < api.BATTLE_Q; q++) api.tickQ();
    if (h % 24 === 0){ for (const a of S.armies) if (a.rebel && !R.RBS.seen.has(a.id)){ R.RBS.seen.add(a.id); R.RBS.spawn++; } }
    if (h % (30*24) === 0){ const d = h/24, occ = []; for (let p = 0; p < G.P.length; p++){ const o = S.owner[p]; if (o < 0 || !G.P[p].city || S.home[p] === o) continue; if ((S.integ || {})[p + ':' + o] >= 10) continue;
        occ.push(S.armies.reduce((s, a) => s + (a.owner === o && a.at === p && a.to === null && !a.fly ? R.groundN(a) : 0), 0)); }
      const held = S.owner.filter((o, p) => o >= 0 && !G.P[p].sea).length, low = occ.length;
      out[d] = {caps, capFree, net:held - held0, rebels:R.RBS.spawn, revolts:R.RBS.revolt, toHome:R.RBS.toHome, toFree:R.RBS.toFree, integ:R.RBS.integ, pacify:R.RBS.pacify, spawnG:R.RBS.spawnG.slice(),
        occCities:low, gar0:occ.filter(x => x === 0).length, gar1:occ.filter(x => x === 1).length, gar23:occ.filter(x => x >= 2 && x <= 3).length, gar4:occ.filter(x => x >= 4).length,
        mor30:(() => { let k = 0; for (let p = 0; p < G.P.length; p++){ const o = S.owner[p]; if (o >= 0 && G.P[p].city && S.home[p] !== o && R.moraleOf(p) < 30) k++; } return k; })()}; } }
  return out;
}
// rebels against a garrison: a city of nation A captured from nation B (alive), g infantry dug in, r rebels; the battle runs until one side is gone
function duel(){
  const R = new Function(SRC)(), api = R.IM.api; api.useScenario('world64'); api.newGame(SEED, 0, []); const S = R.S, G = R.G; S.started = true;
  const cities = G.P.filter(P => P.city && S.owner[P.id] >= 0 && S.nations[S.owner[P.id]].capital !== P.id).map(P => P.id), res = {};
  for (const [g, r] of [[1, 3], [1, 4], [2, 3], [2, 4], [2, 5], [3, 4], [3, 5], [4, 5], [4, 6]]){ let win = 0, n = 0, left = 0;
    for (let i = 0; i < 12; i++){ const R2 = new Function(SRC)(), a2 = R2.IM.api; a2.useScenario('world64'); a2.newGame(SEED + i, 0, []); const S2 = R2.S; S2.started = true;
      const p = cities[(i*37) % cities.length], B = S2.owner[p], A = S2.nations.findIndex(N => N.id !== B && N.alive); S2.armies = S2.armies.filter(a => a.at !== p);
      S2.owner[p] = A; S2.occ[p] = S2.hour; const ga = R2.addArmy(A, p, {inf:g}); ga.still = S2.hour - 24; const ra = R2.addArmy(R2.NEUTRAL, p, {inf:r}); ra.rebel = true; ra.hold = 0;
      for (let h = 0; h < 72 && R2.count(ga) && R2.count(ra); h++) R2.tick();
      n++; if (R2.count(ga) && !R2.count(ra)){ win++; left += R2.count(ga); } }
    res[`${g} garrison v ${r} rebels`] = `garrison wins ${win}/${n}` + (win ? `, ${(left/win).toFixed(1)} units left` : ''); }
  return res;
}
const t0 = Date.now();
console.log(JSON.stringify({scn:SCN, variant:VAR, seed:SEED, days:DAYS, ...(DUEL ? {duel:duel()} : {at:play()}), s:Math.round((Date.now() - t0)/1000)}));
