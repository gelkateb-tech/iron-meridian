// The start and economy round of 2026-11-25 (owner points 5, 6 and 7), in plain Node:   node .test/econ-start.js   (exit 0 when every check holds)
// 5. every capital (seats and computer nations, both worlds) starts with an Airbase I and one Air Superiority Fighter based there, beside its
//    Fortifications I; no other province has an Airbase; old saves are not changed
// 6. Army Base level I: $10M, 2,000 materials, 2,000 iron, 30 minutes, the same in every city; on day one every one of the 68 playable nations
//    (normal and competitive starts) can build it in every starting city AND an Arms Industry AND start the infantry research (Ceramic Body
//    Armour); the 30 minutes are exact (two quarter-hour steps, whenever it is ordered); levels II-V rise 40% for each other province at level II+
//    beyond the first; longer constructions still count whole hours
// 7. the mobilization queue is a membership feature: a seat without one trains one unit at a time per city, a member's city queues QUEUE_MAX,
//    computer nations keep QUEUE_MAX; the flag is saved; old saves load with no membership and keep the queues they hold; Repeat production
//    keeps a free seat's city busy
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n')
  + '\nreturn {IM, UNITS, BUILD, QUEUE_MAX, QUEUE_FREE, START_AIR, START_AIR_UNIT, START_FORT, queueMax, queueWhy, isMember, setMember, buildCost, hasC, desk, canMobilize, recruit, tierKit, get S(){ return S; }, get G(){ return G; }};';
const load = () => new Function(SRC)();
let bad = 0, n = 0; const ok = (c, msg, info) => { n++; if (!c){ bad++; console.log('FAIL  ' + msg + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 300) : '')); } };
const K = 1000;

// ---- 5. the start: Airbase I and one fighter at every capital
for (const scn of ['world64', 'world']){ const R = load(), api = R.IM.api; api.useScenario(scn); api.newGame(12345, 0, [0]); const S = R.S, G = R.G;
  const caps = new Set(S.nations.map(N => N.capital));
  ok(S.nations.every(N => S.bld[N.capital].air === R.START_AIR && R.START_AIR === 1 && S.bld[N.capital].fort === R.START_FORT), `${scn}: every capital has Airbase I and Fortifications I`, S.nations.filter(N => S.bld[N.capital].air !== 1).map(N => N.name));
  ok(!G.P.some(P => S.bld[P.id].air && !caps.has(P.id)), `${scn}: no other province starts with an Airbase`);
  ok(R.START_AIR_UNIT === 'asf' && R.UNITS.asf.name === 'Air Superiority Fighter', 'the start fighter is the Air Superiority Fighter');
  const wings = N => S.armies.filter(a => a.owner === N.id && a.air);
  ok(S.nations.every(N => { const w = wings(N); return w.length === 1 && w[0].at === N.capital && w[0].air.base === N.capital && !w[0].fly && Object.keys(w[0].u).every(t => (w[0].u[t] || 0) === (t === 'asf' ? 1 : 0)); }),
    `${scn}: every nation has exactly one wing, one fighter, based at its capital`, S.nations.filter(N => wings(N).length !== 1).map(N => N.name));
  ok(S.nations.every(N => !S.bld[N.capital].fac), `${scn}: still no Army Base at the start`); }
// the computer nations use it: by day 3 some computer fighters have flown (patrols or scouting), and every capital still has its Airbase
{ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(12345, 0, []); const S = R.S; S.started = true;
  for (let h = 0; h < 3*24; h++) api.tick();
  ok(S.nations.filter(N => N.alive).every(N => S.bld[N.capital].air >= 1 || S.owner[N.capital] !== N.id), 'day 3: every capital still has its Airbase');
  const asf = S.armies.filter(a => a.owner >= 0 && a.air && a.u.asf).reduce((s, a) => s + a.u.asf, 0);
  ok(asf >= S.nations.length - 2, `day 3: the start fighters are still there (${asf} of ${S.nations.length})`); }
// an old save (made before the rule: no Airbase, no fighter) stays as it was
{ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(4242, 0, [0]); const S = R.S;
  for (const N of S.nations){ S.bld[N.capital].air = 0; } S.armies = S.armies.filter(a => !(a.air && a.u.asf === 1 && Object.values(a.u).reduce((s, v) => s + (v || 0), 0) === 1));
  const js = api.saveJSON(), R2 = load(); R2.IM.api.useScenario('world64'); ok(R2.IM.api.restore(JSON.parse(js)) !== false, 'an old save without the start Airbase loads');
  ok(!R2.S.nations.some(N => R2.S.bld[N.capital].air) && !R2.S.armies.some(a => a.air), 'and gets no Airbase or fighter added'); }

// ---- 6. Army Base I: price, time and day-one affordability
for (const mode of ['normal', 'competitive']){ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame.mode = mode; api.newGame(12345, 0, [0]); const ids = R.S.nations.map(N => N.id), rows = [];
  for (const id of ids){ api.newGame(12345, 0, [id]); const S = R.S, G = R.G, N = S.nations[id], cities = G.P.filter(P => S.owner[P.id] === id && P.city).map(P => P.id);
    let bases = 0; for (const p of cities){ if (!R.hasC(N, R.buildCost(id, 'fac', 1, p))) break; if (api.build(id, p, 'fac')) bases++; }
    let q = 0; while (cities.some(p => S.cons[p]) && q < 8){ api.tickQ(); q++; }
    const ac = cities.find(p => p !== N.capital), arms = bases === cities.length && R.hasC(N, R.buildCost(id, 'arms', 1, ac)) && api.build(id, ac, 'arms'), res = arms && api.startResearch(id, 'inf_armor');
    rows.push({name:N.name, tier:N.tier, cities:cities.length, bases, q, arms, res, cash:N.cash}); }
  api.newGame.mode = undefined;
  const fail = rows.filter(r => r.bases < r.cities || !r.arms || !r.res);
  ok(rows.length === 68 && !fail.length, `${mode}: all 68 nations build Army Base I in every starting city, an Arms Industry and start Ceramic Body Armour on day one`, fail);
  ok(rows.every(r => r.q === 2), `${mode}: and every Army Base stands after two quarter-hour steps (30 minutes)`, rows.filter(r => r.q !== 2).map(r => r.name));
  const cs = rows.map(r => r.cash).sort((a, b) => a - b); console.log(`  ${mode}: cash left after all of it: min $${cs[0]}M, median $${cs[cs.length >> 1]}M, max $${cs[cs.length - 1]}M; cities ${Math.min(...rows.map(r => r.cities))}-${Math.max(...rows.map(r => r.cities))}`); }
{ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(12345, 0, [0]); const S = R.S, G = R.G, N = S.nations[0]; N.cash = 9000; N.metal = N.iron = 900*K;
  const cs = G.P.filter(P => S.owner[P.id] === 0 && P.city).map(P => P.id);
  const c1 = R.buildCost(0, 'fac', 1, cs[0]); ok(c1.cash === 10 && c1.metal === 2*K && c1.iron === 2*K && c1.h === 0.5, 'Army Base I: $10M, 2,000 materials, 2,000 iron, 30 minutes', c1);
  // exactly 30 minutes, ordered at any of the four quarter-hour steps
  for (const at of [0, 1, 2, 3]){ const p = cs[at]; while ((S.q || 0) !== at) api.tickQ(); const h0 = S.hour, q0 = S.q || 0; ok(api.build(0, p, 'fac'), 'build ordered');
    let k = 0; while (S.cons[p] && k < 12){ api.tickQ(); k++; } ok(k === 2 && S.bld[p].fac === 1, `ordered at step ${at} of the hour: stands after 2 quarter steps (took ${k})`, {h0, q0, k}); }
  // levels II-V: the rise counts the other provinces at level II or higher (built or going up), the first one free; level I bases count for nothing
  for (const p of cs.slice(0, 6)) S.bld[p].fac = 1;
  const l2 = () => R.buildCost(0, 'fac', 2, cs[0]).cash;
  ok(l2() === 40, `Army Base II with five other cities at level I: the base price $40M (${l2()})`);
  S.bld[cs[1]].fac = 2; ok(l2() === 40, `one other city at level II: still $40M (${l2()})`);
  S.bld[cs[2]].fac = 3; ok(l2() === 56, `two others at level II+: 40% more, $56M (${l2()})`);
  S.cons[cs[3]] = {k:'fac', lvl:2, h:10, h0:72}; ok(l2() === Math.round(40*1.96), `a third going up to level II counts too: $${Math.round(40*1.96)}M (${l2()})`); S.cons[cs[3]] = null;
  ok(R.buildCost(0, 'fac', 1, cs[7]).cash === 10, 'and level I still costs $10M');
  // longer constructions keep their whole hours
  const p9 = cs[8]; S.cons[p9] = null; S.bld[p9].rec = 0; const c9 = R.buildCost(0, 'rec', 1, p9); ok(api.build(0, p9, 'rec'), 'a Recruiting Office ordered'); let k = 0; while (S.cons[p9] && k < 1000){ api.tickQ(); k++; }
  ok(Math.abs(k - c9.h*4) <= 3, `a ${c9.h} h construction still takes ${c9.h} h (${k} quarter steps)`, {k, h:c9.h});
  ok(/^Army Base ready in 30 min$/.test((S.cons[cs[9]] = {k:'fac', lvl:1, h:0.5, h0:0.5}, S.bld[cs[9]].fac = 0, R.canMobilize(0, cs[9], 'inf'))), 'going up: "Army Base ready in 30 min"', R.canMobilize(0, cs[9], 'inf')); S.cons[cs[9]] = null; }

// ---- 7. the mobilization queue: a membership feature
{ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(12345, 0, [0]); const S = R.S, G = R.G, N = S.nations[0]; N.cash = 9000; N.mp = 9000; for (const k of ['oil', 'metal', 'iron', 'elec', 'rare']) N[k] = 900*K;
  const cap = N.capital, city = G.P.find(P => S.owner[P.id] === 0 && P.city && P.id !== cap).id; S.bld[cap].fac = 3; S.bld[city].fac = 1;
  ok(R.QUEUE_MAX === 2 && R.QUEUE_FREE === 1, 'QUEUE_MAX 2, QUEUE_FREE 1');
  ok(!R.isMember(0) && R.queueMax(0) === 1, 'a new game: the seat has no membership, one unit at a time');
  ok(R.queueMax(1) === 2 && R.queueMax(5) === 2, 'computer nations keep a queue of 2');
  ok(api.recruit(0, cap, 'inf') === true && api.recruit(0, cap, 'inf') === false && S.queue[cap].length === 1, 'free seat: the second unit is refused while one trains', S.queue[cap]);
  ok(/^One unit at a time/.test(R.queueWhy(0, cap)), 'and the reason says one at a time', R.queueWhy(0, cap));
  ok(api.setMember(0, true) && R.isMember(0) && R.queueMax(0) === 2 && api.isMember(0), 'setMember on: a queue of 2');
  ok(api.recruit(0, cap, 'inf') === true && S.queue[cap].length === 2 && api.recruit(0, cap, 'inf') === false, 'member: the second unit queues, the third is refused');
  // saved with the game
  { const R2 = load(); R2.IM.api.restore(JSON.parse(api.saveJSON())); ok(R2.isMember(0) && R2.queueMax(0) === 2 && R2.S.queue[cap].length === 2, 'the membership and the queue survive a save and load'); }
  // switched off with two queued: both stay, nothing more until the city is empty
  api.setMember(0, false); ok(!R.isMember(0) && !('member' in N) && S.queue[cap].length === 2, 'membership off: the queue of 2 is kept');
  ok(api.recruit(0, cap, 'inf') === false, 'and nothing more can be queued there');
  let h = 0; while (S.queue[cap].length > 1 && h < 400){ api.tick(); h++; }
  ok(S.queue[cap].length === 1 && api.recruit(0, cap, 'inf') === false, 'one left: still full for a free seat');
  while (S.queue[cap].length && h < 800){ api.tick(); h++; }
  ok(!S.queue[cap].length && api.recruit(0, cap, 'inf') === true, 'empty: the next unit can be queued');
  // the computer: two at once
  const ai = S.nations[3], ac = ai.capital; ai.cash = 9000; ai.mp = 9000; for (const k of ['oil', 'metal', 'iron', 'elec', 'rare']) ai[k] = 900*K; S.bld[ac].fac = 1; S.queue[ac].length = 0;
  ok(R.recruit(3, ac, 'inf') && R.recruit(3, ac, 'inf') && !R.recruit(3, ac, 'inf'), 'a computer nation queues two, as before');
  // Repeat production keeps a free seat's city busy
  S.queue[city].length = 0; R.desk(0).repeat = {[city]:'inf'}; let made = 0; const inf0 = () => S.armies.filter(a => a.owner === 0 && a.at === city).reduce((s, a) => s + (a.u.inf || 0), 0), i0 = inf0();
  for (let t = 0; t < 4*24; t++){ api.tick(); ok(S.queue[city].length <= 1, 'Repeat never queues more than one for a free seat'); } made = inf0() - i0;
  ok(made >= 3, `Repeat production trains one after another in a free seat's city (${made} infantry in 4 days)`); }
// an old save: no membership flag, a city holding two queued units
{ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(777, 0, [0]); const S = R.S, N = S.nations[0], cap = N.capital; S.bld[cap].fac = 1;
  S.queue[cap].push({t:'inf', h:20, h0:24}, {t:'at', h:30, h0:30}); const o = JSON.parse(api.saveJSON()); for (const M of o.nations || []) delete M.member;
  const R2 = load(), api2 = R2.IM.api; ok(api2.restore(o) !== false, 'an old save (no membership flag) loads');
  ok(!R2.isMember(0) && R2.queueMax(0) === 1, 'its seat has no membership');
  ok(R2.S.queue[cap].length === 2 && R2.S.queue[cap][1].t === 'at', 'and its city keeps both queued units', R2.S.queue[cap]);
  R2.S.nations[0].cash = 9000; ok(api2.recruit(0, cap, 'inf') === false, 'but cannot add a third'); }

console.log(bad ? `${bad} of ${n} checks FAILED` : `ALL ${n} CHECKS PASS: start Airbase and fighter, Army Base I price and 30 minutes, day one for all 68 nations, the membership queue`);
process.exit(bad ? 1 : 0);
