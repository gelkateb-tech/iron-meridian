// Occupation, morale, annexing and rebels (owner points 8-11; docs/REBELS-PLAN.md): measurements on the real rules, plain Node, no browser.
// Replaces tools/rebels-sim.js (the earlier plan's overlay). Runs the rules files of ROOT (this checkout, or IM_ROOT=<folder> for another build,
// e.g. master unpacked with git archive) and reads what each build has: S.mor on this rule, 100 - unrest - war damage before it.
//   node tools/rebels-check.js world [days] [seed,seed]   the nations world, computer players only: morale on day 10 and 30 (homeland cities,
//                                                         occupied and annexed cities, countryside), risings, cities lost to rebels, annexings,
//                                                         captures, world income a day
//   node tools/rebels-check.js wars [days] [seed,seed]    the same with four wars started on day 2 between computer neighbours (Germany-Poland,
//                                                         Russia-Ukraine, India-Pakistan, Iran-Iraq): the computer never starts wars itself
//   node tools/rebels-check.js trade [days] [seed,seed]   point 11 (plan 5.3): Poland, a seat that gives no orders, declares war on Germany on
//                                                         day 2 and takes 4 German cities with their countryside (2 on day 3, 2 on day 6), 6
//                                                         infantry in each; Germany's computer turn is off. Germany a trade partner (the route
//                                                         kept on day 1) or not (closed on day 1, its slot refilled); prints Poland's trade and
//                                                         gross value over the days, partner against non-partner; with annex=1 the 4 cities are
//                                                         annexed at capture
// Each line is JSON. Exit 1 only on an error.
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const RULES = FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
const [MODE = 'world', D0, SD, ...REST] = process.argv.slice(2), DAYS = +(D0 || (MODE === 'trade' ? 30 : 30)), SEEDS = (SD || '12345').split(',').map(Number), OPT = Object.fromEntries(REST.map(x => x.split('=')));
// the rules in a fresh scope, with a switch to skip one nation's computer turn (later assignments to the function names win: they are plain bindings)
const EXTRA = `let SKIP_AI = -1; for (const nm of ['aiTurn', 'aiAir', 'aiMissiles', 'aiSpies', 'aiCapBase']) eval(nm + ' = (f => function(n){ if (n === SKIP_AI) return; return f.apply(this, arguments); })(' + nm + ')');
  const has_ = s => { try { return typeof eval(s) !== 'undefined'; } catch (e){ return false; } };
  const R_ = {IM, get S(){ return S; }, get G(){ return G; }, setSkip:v => { SKIP_AI = v; }, income, provYield, moraleOf, ownedBy, popOf, capture, addArmy, declareWar, mkt, tradeClose, routesOf:typeof routesOf !== 'undefined' ? routesOf : null, RES_K, count};
  for (const k of ['morOf', 'occSt', 'annexCity', 'annexCost', 'gcKm', 'unrestOf', 'trSide', 'occFactor']) if (has_(k)) R_[k] = eval(k);
  return R_;`;
const load = () => new Function("'use strict';\n" + RULES + '\n' + EXTRA)();
const tickDay = api => { for (let h = 0; h < 24; h++) for (let q = 0; q < api.BATTLE_Q; q++) api.tickQ(); };
const pct = (a, n) => n ? Math.round(a/n*1000)/10 : 0;
// the morale of the provinces held by nations, by kind: home city, occupied city, annexed city, home countryside, occupied/annexed countryside
function moraleTable(R){ const S = R.S, G = R.G, B = {}, add = (k, m) => { const b = B[k] || (B[k] = {n:0, s:0, le33:0, le40:0, h:[0, 0, 0, 0, 0]}); b.n++; b.s += m; if (m <= 33) b.le33++; if (m <= 40) b.le40++; b.h[Math.min(4, Math.floor(m/20))]++; };
  for (let p = 0; p < G.P.length; p++){ const o = S.owner[p], P = G.P[p]; if (P.sea || !(o >= 0)) continue;
    const st = R.occSt ? R.occSt(p) : (S.home[p] === o ? 'home' : (S.occ && S.occ[p] != null && S.hour - S.occ[p] < 240 ? 'occ' : 'anx'));
    add((P.city ? 'city-' : 'rural-') + st, Math.round(R.moraleOf(p))); }
  for (const k in B){ const b = B[k]; B[k] = {n:b.n, avg:Math.round(b.s/b.n*10)/10, le33:b.le33, le40:b.le40, hist0_20_40_60_80:b.h}; } return B; }
function worldRun(seed, days, wars){ const R = load(), api = R.IM.api, ev = {rising:0, risingFought:0, flip:0, flipHome:0, flipFree:0, crushed:0, annexStart:0, annexed:0, annexLost:0, captures:0, newRebels:0, partisanFlips:0};
  R.IM.on('rising', (p, o, n, g) => { ev.rising++; if (g) ev.risingFought++; });
  R.IM.on('rebelFlip', (p, o, to) => { ev.flip++; if (to >= 0) ev.flipHome++; else ev.flipFree++; });
  R.IM.on('rebelsCrushed', () => ev.crushed++); R.IM.on('annexStart', () => ev.annexStart++); R.IM.on('annexed', () => ev.annexed++); R.IM.on('fxCapture', (p, O, prev) => { ev.captures++; if (R.S.cons[p] && R.S.cons[p].k === 'annex') ev.annexLost++; });
  api.useScenario('world64'); api.newGame(seed, 0, []); const S = R.S, G = R.G; S.started = true;
  const id = nm => S.nations.findIndex(N => N.name === nm), pairs = [['Germany', 'Poland'], ['Russia', 'Ukraine'], ['India', 'Pakistan'], ['Iran', 'Iraq']];
  const seen = new Set(S.armies.filter(a => a.rebel).map(a => a.id)), out = {seed, days, wars:!!wars}, cityOwn = G.P.map((P, p) => S.owner[p]);
  let caps = 0; R.IM.on('fxCapture', () => caps++);
  for (let d = 1; d <= days && !S.over; d++){
    if (wars && d === 2) for (const [a, b] of pairs) if (id(a) >= 0 && id(b) >= 0) R.declareWar(id(a), id(b));
    const c0 = caps; tickDay(api);
    for (const a of S.armies) if (a.rebel && !seen.has(a.id)){ seen.add(a.id); ev.newRebels++; }
    // (before this rule: a city that changed hands with no capture that day went over to partisans)
    let ch = 0; for (let p = 0; p < G.P.length; p++){ if (!G.P[p].city) continue; if (S.owner[p] !== cityOwn[p]){ ch++; cityOwn[p] = S.owner[p]; } } if (!R.occSt) ev.partisanFlips += Math.max(0, ch - (caps - c0));
    if (d === 10 || d === 30 || d === days){ let inc = 0; for (const N of S.nations) if (N.alive) inc += R.income(N.id).gross.cash; out['day' + d] = {morale:moraleTable(R), worldIncome:Math.round(inc), held:S.owner.filter(o => o >= 0).length}; } }
  out.events = ev; return out; }
// point 11: Poland and Germany (plan 5.3)
function tradeRun(seed, days, partner, annex){ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(seed, 0, []);
  let S = R.S; const A = S.nations.findIndex(N => N.name === (OPT.a || 'Poland')), V = S.nations.findIndex(N => N.name === (OPT.v || 'Germany'));
  api.newGame(seed, 0, [A]); S = R.S; const G = R.G; S.started = true; R.setSkip(V);
  const routeAV = () => S.trade && S.trade.routes.find(r => (r.a === A && r.b === V) || (r.a === V && r.b === A));
  const val = o => { const M = R.mkt(); let v = o.cash || 0; for (const k of ['oil', 'metal', 'iron', 'elec', 'rare']) v += (o[k] || 0)/R.RES_K*M.p[k]; return v; };
  const targets = [], rows = []; let note = '', grossSum = 0, tradeSum = 0;
  const home = a => { a.at = S.nations[V].capital; a.to = null; a.path = []; };
  for (let d = 1; d <= days; d++){
    if (d === 1){ const r = routeAV(); note += `day 1 route Poland-Germany: ${r ? r.kind : 'none'}; `; if (!partner && r) R.tradeClose(A, r.id); }
    if (d === 2){ R.declareWar(A, V); const cap = S.nations[V].capital, Ac = S.nations[A].capital, km = (p, q) => Math.hypot(G.P[p].x - G.P[q].x, G.P[p].y - G.P[q].y);
      targets.push(...G.P.filter(P => P.city && S.owner[P.id] === V && P.id !== cap).map(P => P.id).sort((x, y) => km(x, Ac) - km(y, Ac)).slice(0, 4)); }
    if (d === 3 || d === 6) for (const p of (d === 3 ? targets.slice(0, 2) : targets.slice(2))){
      for (const a of S.armies) if (a.owner === V && a.at === p) home(a);
      R.capture(p, A); R.addArmy(A, p, {inf:6});
      for (const v of G.P[p].nbs) if (!G.P[v].sea && !G.P[v].city && S.owner[v] === V){ for (const a of S.armies) if (a.owner === V && a.at === v) home(a); R.capture(v, A); }
      if (annex && R.annexCity){ S.nations[A].cash += 0; const ok = R.annexCity(A, p); note += `annex ${G.P[p].cityName} ${ok ? 'started' : 'not affordable'} day ${d}; `; } }
    for (const a of S.armies) if (a.owner === V && S.owner[a.at] === A) home(a);
    tickDay(api);
    const i = R.income(A), t = i.trade; grossSum += val(i.gross); tradeSum += val(t);
    if ([1, 3, 7, 14, 30].includes(d) || d === days) rows.push({d, trade:+t.cash.toFixed(1), tradeVal:+val(t).toFixed(1), routes:t.n, shock:t.shock ? 1 : 0, grossVal:+val(i.gross).toFixed(1), eff:+i.eff.toFixed(3),
      cities:targets.filter(p => S.owner[p] === A).length, mor:targets.map(p => Math.round(R.moraleOf(p))), st:R.occSt ? targets.map(p => R.occSt(p)) : null}); }
  return {seed, partner, annex:!!annex, note, targets:targets.map(p => G.P[p].cityName), tradeSum:Math.round(tradeSum), grossSum:Math.round(grossSum), rows}; }
if (MODE === 'world' || MODE === 'wars') for (const s of SEEDS) console.log(JSON.stringify(worldRun(s, DAYS, MODE === 'wars')));
else if (MODE === 'trade'){ for (const s of SEEDS){ const a = tradeRun(s, DAYS, true, OPT.annex === '1'), b = tradeRun(s, DAYS, false, OPT.annex === '1');
    console.log(JSON.stringify(a)); console.log(JSON.stringify(b));
    console.log(JSON.stringify({seed:s, partnerMinusNon:{trade:a.tradeSum - b.tradeSum, gross:a.grossSum - b.grossSum}})); } }
else { console.error('mode: world | wars | trade'); process.exit(1); }
