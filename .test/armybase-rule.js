// The Army Base rule and the start forts (BLD-RULES, owner 2026-11-14), in plain Node:   node .test/armybase-rule.js   (exit 0 when every check holds)
// 1. infantry (Motorized, Special Forces, Paratroopers) needs an Army Base in its city (INF_NEEDS in rules/data.js; its level: BASE_LV): without one
//    the reason is 'Needs Army Base level 1' and recruit() refuses; a Recruiting Office alone unlocks nothing; Paratroopers also need an Airbase;
//    the other ground units keep their Army Base levels. The switch INF_NEEDS = ['fac', 'rec'] (the owner's alternative) needs both buildings.
// 2. a new game (START-RULES, owner 2026-11-15): no city starts with an Army Base (both worlds), so on day 1 infantry says 'Needs Army Base level 1'
//    everywhere; every capital has Fortifications I and no other province any; the starting units are the same as before the rule, plus the
//    capital's fighter (startAir, owner 2026-11-25). Army Base level I is cheap and quick (BUILD.fac.lv1: $10M, 2,000 materials, 2,000 iron, 30
//    minutes; owner 2026-11-25) and costs the same in every city (no 40% rise at level I); every nation can pay for it from its starting stock;
//    levels II-V keep their prices (the rise for them: .test/econ-start.js)
// 3. old saves (no S.ab): load, infantry already queued in a city without an Army Base stays queued and is trained; a capital without an Army Base
//    gets one; the seat is told about the rule once
// 4. the computer builds Army Bases: on its first turn every computer nation starts one in its capital (both worlds; standing by hour 30), a capital
//    that lost its Army Base gets a new one, and after 10 days every nation has more of them
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n')
  + '\nreturn {IM, UNITS, BUILD, BASE_LV, INF_NEEDS, INF_T, START_FORT, reqsOf, canMobilize, mobBlock, recruit, desk, buildCost, build, hasC, get S(){ return S; }, get G(){ return G; }};';
const load = (both = false) => { const src = both ? SRC.replace("const INF_NEEDS = ['fac'];", "const INF_NEEDS = ['fac', 'rec'];") : SRC; if (both && src === SRC) throw new Error('INF_NEEDS not found'); return new Function(src)(); };
let bad = 0, n = 0; const ok = (c, msg, info) => { n++; if (!c){ bad++; console.log('FAIL  ' + msg + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 300) : '')); } };
const units = S => { let u = 0; for (const a of S.armies) if (a.owner >= 0) for (const k in a.u) u += a.u[k] || 0; return u; };
const NEED = 'Needs Army Base level 1';

// ---- 1. the rule
{ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(12345, 0, [0]); const S = R.S, G = R.G;
  ok(JSON.stringify(R.INF_NEEDS) === '["fac"]', 'INF_NEEDS is the Army Base alone (the proposal)', R.INF_NEEDS);
  ok(R.INF_T.every(t => R.reqsOf(t)[0].b === 'fac' && R.reqsOf(t)[0].l === R.BASE_LV.fac[t]), 'every infantry unit needs the Army Base at its level (BASE_LV: BUILD-REQS)', R.INF_T.map(R.reqsOf));
  ok(JSON.stringify(R.reqsOf('para')) === JSON.stringify([{b:'fac', l:2}, {b:'air', l:1}]), 'Paratroopers: Army Base II and Airbase I', R.reqsOf('para'));
  ok(!Object.keys(R.UNITS).some(t => R.reqsOf(t).some(r => r.b === 'rec')), 'no unit needs a Recruiting Office');
  ok(R.reqsOf('tank')[0].b === 'fac' && R.reqsOf('tank')[0].l === 2 && R.reqsOf('sam')[0].l === 3, 'the other ground units need their BASE_LV levels (tank II, SAM III)');
  const N = S.nations[0], city = G.P.find(P => S.owner[P.id] === 0 && P.city && P.id !== N.capital && !S.bld[P.id].fac).id, B = S.bld[city];
  N.cash = 5000; S.bld[city].rec = 1;
  ok(R.canMobilize(0, city, 'inf') === NEED, 'a city with a Recruiting Office but no Army Base: infantry "Needs Army Base level 1"', R.canMobilize(0, city, 'inf'));
  ok(R.mobBlock(0, city, 'art').kind === 'bld' && R.mobBlock(0, city, 'art').b === 'fac', 'the block names the Army Base');
  ok(R.recruit(0, city, 'inf') === false && !S.queue[city].length, 'recruit() refuses infantry there');
  ok(R.canMobilize(0, city, 'art') === NEED, 'artillery says the same (tanks: level II)');
  B.fac = 1; B.rec = 0;
  ok(R.canMobilize(0, city, 'inf') === '' && R.canMobilize(0, city, 'art') === '', 'Army Base I, no Recruiting Office: infantry (and artillery) can be trained');
  ok(R.recruit(0, city, 'inf') === true, 'and recruit() queues it');
  ok(/Needs Army Base level 2/.test(R.canMobilize(0, city, 'tank')) && /Needs Army Base level 3/.test(R.canMobilize(0, city, 'sam')), 'level II and III units: "Needs Army Base level 2 / 3"', [R.canMobilize(0, city, 'tank'), R.canMobilize(0, city, 'sam')]);
  ok(/Unlocks no units/.test(R.BUILD.rec.desc) && /infantry/.test(R.BUILD.fac.desc), 'the building texts follow the rule');
  S.cons[city] = null; B.fac = 0; S.cons[city] = {k:'fac', lvl:1, h:30, h0:72};
  ok(/^Army Base ready in 30 h$/.test(R.canMobilize(0, city, 'inf')), 'an Army Base going up: "ready in 30 h"', R.canMobilize(0, city, 'inf'));
  S.cons[city] = null; }
// the owner's alternative: both buildings
{ const R = load(true), api = R.IM.api; api.useScenario('world64'); api.newGame(12345, 0, [0]); const S = R.S, G = R.G, N = S.nations[0];
  const city = G.P.find(P => S.owner[P.id] === 0 && P.city && P.id !== N.capital && !S.bld[P.id].fac && !S.bld[P.id].rec).id, B = S.bld[city];
  ok(R.reqsOf('para').map(r => r.b).join() === 'fac,rec,air', 'INF_NEEDS [fac, rec]: Paratroopers need Army Base, Recruiting Office and Airbase', R.reqsOf('para'));
  ok(R.canMobilize(0, city, 'inf') === NEED, 'both: nothing built, the Army Base first');
  B.fac = 1; ok(/Recruiting Office/.test(R.canMobilize(0, city, 'inf')), 'both: Army Base alone is not enough', R.canMobilize(0, city, 'inf'));
  B.rec = 1; ok(R.canMobilize(0, city, 'inf') === '', 'both: Army Base and Recruiting Office');
  B.fac = 0; ok(R.canMobilize(0, city, 'inf') === NEED, 'both: Recruiting Office alone is not enough');
  ok(/^Needed, with an Army Base/.test(R.BUILD.rec.desc), 'both: the Recruiting Office text says so');
  ok(R.canMobilize(0, N.capital, 'inf') === NEED, 'both: no Army Base on day 1, not even in the capital (it has its Recruiting Office)', R.canMobilize(0, N.capital, 'inf')); }

// ---- 2. a new game, both worlds
for (const scn of ['world64', 'world']){ const R = load(), api = R.IM.api; api.useScenario(scn); api.newGame(12345, 0, [0]); const S = R.S, G = R.G;
  const caps = S.nations.map(N => N.capital), forts = []; for (let p = 0; p < G.P.length; p++) if (S.bld[p].fort) forts.push(p);
  ok(!G.P.some(P => S.bld[P.id].fac), `${scn}: no city starts with an Army Base`, G.P.filter(P => S.bld[P.id].fac).map(P => P.cityName || P.name).slice(0, 10));
  ok(S.nations.every(N => R.canMobilize(N.id, N.capital, 'inf') === NEED), `${scn}: on day 1 infantry needs an Army Base everywhere, the capital too`, S.nations.filter(N => R.canMobilize(N.id, N.capital, 'inf') !== NEED).map(N => N.name));
  const c1 = R.buildCost(0, 'fac', 1, S.nations[0].capital);
  ok(c1.cash === 10 && c1.metal === 2000 && c1.iron === 2000 && c1.h === 0.5, `${scn}: Army Base level I costs $10M, 2,000 materials and 2,000 iron and takes 30 minutes`, c1);
  ok(S.nations.every(N => R.hasC(N, R.buildCost(N.id, 'fac', 1, N.capital))), `${scn}: every nation can pay for it from its starting stock`);
  const c2 = R.buildCost(0, 'fac', 2, S.nations[0].capital); ok(c2.cash === 40 && c2.metal === 19000 && c2.h === 72, `${scn}: level II keeps its price ($40M, 19,000 materials, 3 days)`, c2);
  { const N = S.nations[0], cs = G.P.filter(P => S.owner[P.id] === 0 && P.city).map(P => P.id).slice(0, 4); N.cash = 5000; N.metal = N.iron = 500000;
    const paid = cs.map(p => { const c = R.buildCost(0, 'fac', 1, p); R.build(0, p, 'fac'); return c.cash; });
    ok(cs.length < 4 || JSON.stringify(paid) === '[10,10,10,10]', `${scn}: level I costs the same in every city (no rise)`, paid);
    for (const p of cs) S.cons[p] = null; }
  ok(S.nations.every(N => S.bld[N.capital].fort === R.START_FORT && R.START_FORT === 1), `${scn}: every capital starts with Fortifications I`);
  ok(forts.length === S.nations.length && forts.every(p => caps.includes(p)), `${scn}: no other province starts with Fortifications (${forts.length} forts, ${S.nations.length} nations)`, forts.filter(p => !caps.includes(p)).slice(0, 10));
  // the starting units as before the rule (recorded from master 48d6a7f, seed 12345: the start uses no dice in either world for the nations' own units),
  // plus one fighter at every capital (startAir, owner 2026-11-25)
  const U0 = {world64:1942, world:376}[scn] + S.nations.length; ok(units(S) === U0, `${scn}: starting units as before plus one fighter a nation (${units(S)}, expected ${U0})`); }

// ---- 3. an old save
{ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(777, 0, [0]); let S = R.S, G = R.G; S.started = true;
  const N = S.nations[0], city = G.P.find(P => S.owner[P.id] === 0 && P.city && P.id !== N.capital && !S.bld[P.id].fac).id;
  S.bld[city].rec = 1; S.queue[city].push({t:'inf', h:3, h0:24}, {t:'art', h:30, h0:48});   // queued under the old rule (a Recruiting Office, no Army Base)
  S.bld[N.capital].fac = 0;   // and a capital without an Army Base (one moved after a loss)
  const o = JSON.parse(api.saveJSON()); delete o.ab; const old = JSON.stringify(o);
  const R2 = load(), api2 = R2.IM.api; ok(api2.restore(JSON.parse(old)) !== false, 'an old save (no S.ab) loads'); S = R2.S; G = R2.G;
  ok(S.ab === 1, 'it is marked as under the rule');
  ok(S.queue[city].length === 2 && S.queue[city][0].t === 'inf' && S.queue[city][1].t === 'art', 'the infantry queued in a city without an Army Base keeps its queue', S.queue[city]);
  ok(S.bld[S.nations[0].capital].fac === 1, 'a capital without an Army Base gets one');
  const log = (R2.desk(0).log || []).find(e => /New rule: infantry/.test(e.text || ''));
  ok(!!log && /Army Base of level I/.test(log.text) && /carry on/.test(log.text), 'the seat is told about the rule', log);
  const before = S.armies.filter(a => a.owner === 0 && a.at === city).reduce((s, a) => s + (a.u.inf || 0), 0);
  for (let h = 0; h < 4*4; h++) api2.tickQ();
  const after = S.armies.filter(a => a.owner === 0 && a.at === city).reduce((s, a) => s + (a.u.inf || 0), 0);
  ok(after === before + 1 && S.queue[city].length === 1 && S.queue[city][0].t === 'art', 'the queued infantry is trained (no Army Base needed for what was already queued)', {before, after, q:S.queue[city]});
  ok(R2.canMobilize(0, city, 'inf') === NEED, 'new infantry orders there follow the rule');
  const js = api2.saveJSON(), R3 = load(); R3.IM.api.restore(JSON.parse(js));
  ok(!(R3.desk(0).log || []).some(e => /New rule: infantry/.test(e.text || '') && e.h > S.hour), 'a save under the rule is not told again'); }

// ---- 4. the computer builds Army Bases
for (const scn of ['world64', 'world']){ const R = load(), api = R.IM.api; api.useScenario(scn); api.newGame(12345, 0, []); const S = R.S, G = R.G; S.started = true;
  const NN = S.nations.length, started = Array(NN).fill(null), stood = Array(NN).fill(null);
  for (let h = 0; h < 30; h++){ api.tick(); for (const N of S.nations){ const c = S.cons[N.capital];
    if (started[N.id] == null && (S.bld[N.capital].fac || (c && c.k === 'fac'))) started[N.id] = S.hour; if (stood[N.id] == null && S.bld[N.capital].fac >= 1) stood[N.id] = S.hour; } }
  ok(started.every(h => h != null && h <= 8), `${scn}: every computer nation starts an Army Base in its capital on its first turn (by hour ${Math.max(...started)})`, started.map((h, n) => h == null || h > 8 ? S.nations[n].name + ' ' + h : null).filter(Boolean));
  ok(stood.every(h => h != null && h <= 30), `${scn}: and it stands by hour 30 (the last at hour ${Math.max(...stood)})`, stood.map((h, n) => h == null ? S.nations[n].name : null).filter(Boolean)); }
{ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(12345, 0, []); const S = R.S, G = R.G; S.started = true;
  for (let h = 0; h < 2*24; h++) api.tick();
  const ai = S.nations[5], fac0 = G.P.filter(P => S.bld[P.id].fac).length; S.bld[ai.capital].fac = 0; if (S.cons[ai.capital]) S.cons[ai.capital] = null; ai.cash = Math.max(ai.cash, 300);
  for (let h = 0; h < 8*24; h++) api.tick();
  ok(S.bld[ai.capital].fac >= 1 || (S.cons[ai.capital] && S.cons[ai.capital].k === 'fac'), `${ai.name}: a capital without an Army Base gets one from the computer`);
  const fac10 = G.P.filter(P => S.bld[P.id].fac).length; ok(fac10 > fac0 + 0.5*S.nations.length && fac10 > 3.5*S.nations.length, `the computer builds Army Bases (${fac0} on day 2, ${fac10} on day 10)`);   // (master before Army Base I at $10M and 30 min: 153 -> 271)
  ok(S.nations.filter(N => N.alive).every(N => R.canMobilize(N.id, N.capital, 'inf') === '' || S.owner[N.capital] !== N.id), 'every nation can still train infantry at its capital on day 10'); }

console.log(bad ? `${bad} of ${n} checks FAILED` : `ALL ${n} CHECKS PASS: the Army Base rule, start forts, old saves and the computer`);
process.exit(bad ? 1 : 0);
