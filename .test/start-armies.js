// The starting army in the nations world (START-ARMIES, owner playtest 2026-11-27, item 3), in plain Node:   node .test/start-armies.js   (exit 0 when every check holds)
// 1. every nation, seats and computer nations alike, in both game modes, starts with START_ARMY (rules/data.js) and nothing else: the capital 2 infantry
//    and 1 artillery, the capital's Air Superiority Fighter at its Airbase (startAir, unchanged), and two outer stacks of 2 infantry; no tanks, no city
//    garrisons, no border guards
// 2. the outer stacks (startOuter, rules/state.js): two different cities outside the capital, on land the capital reaches over the nation's own land, not
//    next to the capital (except the fallback for nations with fewer than 2 other cities there), not next to each other; the same cities in every seed
//    and whoever is the seat; the rule's own picks for Russia and Germany (recorded 2026-11-27); a nation with no city but its capital falls back to its
//    border provinces, then to the capital
// 3. the recon slot (START_ARMY.recon): null today, so the outer stacks hold infantry only; a key that is not a unit is skipped; once it names a unit,
//    each outer stack gets it (tried with an existing unit) and nothing else changes
// 4. old saves keep their armies: a save whose start had other forces (the old start's tanks and city garrisons) loads with every army as saved
// 5. the computer keeps its capital held: with the smaller start no computer capital stands without ground units after 24 and 72 hours (all-computer
//    games, seeds 12345 and 7); its capital force (2 infantry and 1 artillery) stays home in peace until there are 4 infantry to leave 2 behind
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n')
  + '\nreturn {IM, UNITS, START_ARMY, START_AIR_UNIT, startOuter, addArmy, count, get S(){ return S; }, get G(){ return G; }};';
const load = (patch) => { let src = SRC; if (patch){ const [a, b] = patch; if (!src.includes(a)) throw new Error('patch not found: ' + a); src = src.replace(a, b); } return new Function(src)(); };
let bad = 0, n = 0; const ok = (c, msg, info) => { n++; if (!c){ bad++; console.log('FAIL  ' + msg + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 400) : '')); } };
const forces = (S, k) => S.armies.filter(a => a.owner === k).map(a => ({at:a.at, air:!!a.air, u:Object.fromEntries(Object.entries(a.u).filter(([, v]) => v > 0))}));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const nameOf = (G, p) => G.P[p].cityName || G.P[p].name;
const START0 = "const START_ARMY = {capital:{inf:2, art:1}, outerN:2, outer:{inf:2}, recon:null, cities:null, guards:0, guard:{inf:2}};";

// ---- 1. the same army for every nation, in both modes
let picks12345 = null;
for (const mode of ['normal', 'competitive']){ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame.mode = mode; api.newGame(12345, 0, [0]); const S = R.S, G = R.G;
  ok(same(R.START_ARMY, {capital:{inf:2, art:1}, outerN:2, outer:{inf:2}, recon:null, cities:null, guards:0, guard:{inf:2}}), 'START_ARMY is the owner\'s start with the recon slot empty', R.START_ARMY);
  const off = [], picks = {};
  for (const N of S.nations){ const f = forces(S, N.id), cap = f.filter(x => x.at === N.capital), air = f.filter(x => x.air), out = f.filter(x => x.at !== N.capital);
    const good = f.length === 4 && cap.length === 2 && air.length === 1 && same(air[0].u, {[R.START_AIR_UNIT]:1}) && same(cap.find(x => !x.air).u, {inf:2, art:1}) && out.length === 2 && out.every(x => !x.air && same(x.u, {inf:2}));
    if (!good) off.push({nation:N.name, f}); picks[N.name] = out.map(x => x.at); }
  ok(!off.length, `${mode}: every nation (${S.nations.length}) starts with 2 infantry and 1 artillery in its capital, its fighter at the capital's Airbase and two stacks of 2 infantry outside it`, off.slice(0, 3));
  ok(!S.armies.some(a => a.owner >= 0 && a.u.tank > 0), `${mode}: no nation starts with a tank`);
  ok(S.armies.filter(a => a.owner >= 0).reduce((s, a) => s + R.count(a), 0) === 8*S.nations.length, `${mode}: 8 units a nation`);
  if (mode === 'normal') picks12345 = picks; else ok(Object.keys(picks12345).every(k => same(picks[k], picks12345[k])), 'the outer cities are the same in both modes'); }

// ---- 2. where the outer stacks stand
{ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(12345, 0, [0]); const S = R.S, G = R.G, P = G.P, off = [], notes = [];
  for (const N of S.nations){ const c = N.capital, [a, b] = picks12345[N.name];
    const home = new Set([c]), q = [c]; for (let h = 0; h < q.length; h++) for (const v of P[q[h]].nbs) if (!home.has(v) && !P[v].sea && S.owner[v] === N.id){ home.add(v); q.push(v); }
    const others = [...home].filter(p => p !== c && P[p].city), far = others.filter(p => !P[c].nbs.includes(p));
    const why = [];
    if (a === b) why.push('both in one city');
    for (const p of [a, b]){ if (p === c) why.push('in the capital'); if (!P[p].city) why.push(nameOf(G, p) + ' is no city'); if (!home.has(p)) why.push(nameOf(G, p) + ' is not on the capital\'s land');
      if (far.length >= 2 && P[c].nbs.includes(p)) why.push(nameOf(G, p) + ' is next to the capital'); }
    const el = far.length >= 2 ? far : others;   // (the cities the rule may use)
    if (P[a].nbs.includes(b) && el.some(p => p !== a && !P[a].nbs.includes(p))) why.push('the second is next to the first although another city was free');
    if (why.length) off.push(N.name + ': ' + why.join(', ')); if (far.length < 2) notes.push(N.name); }
  ok(!off.length, 'every outer stack stands in its own city outside the capital, on the capital\'s land, not next to the capital or the other stack', off.slice(0, 6));
  const names = k => picks12345[k].map(p => nameOf(G, p));
  ok(same(names('Russia'), ['Saint Petersburg', 'Rostov']), 'Russia: Saint Petersburg and Rostov', names('Russia'));
  ok(same(names('Germany'), ['Cologne', 'Dresden']), 'Germany: Cologne and Dresden', names('Germany'));
  console.log(`(the fallback "next to the capital" used by: ${notes.join(', ') || 'none'})`);
  // the same cities whatever the seed and the seat
  for (const [seed, pick] of [[7, 3], [2026, 40]]){ const R2 = load(), a2 = R2.IM.api; a2.useScenario('world64'); a2.newGame(seed, pick, [0]); const S2 = R2.S, p2 = {};
    for (const N of S2.nations) p2[N.name] = S2.armies.filter(x => x.owner === N.id && x.at !== N.capital).map(x => x.at);
    ok(Object.keys(picks12345).every(k => same(p2[k], picks12345[k])), `seed ${seed}, seat ${S2.nations[0].name}: the same outer cities`, Object.keys(p2).filter(k => !same(p2[k], picks12345[k])).map(k => [k, p2[k], picks12345[k]])); }
  // fallbacks: a nation left with its capital alone (its other cities given to the independents) uses its most populous border provinces, then the capital
  { const N = S.nations.find(x => x.name === 'Germany'), mine = S.owner.map((o, p) => o === N.id ? p : -1).filter(p => p >= 0);
    for (const p of mine) if (p !== N.capital && P[p].city) S.owner[p] = -1;
    const f = R.startOuter(N.id); ok(f.length === 2 && f.every(p => p !== N.capital && S.owner[p] === N.id && !P[p].city && P[p].nbs.some(v => !P[v].sea && S.owner[v] !== N.id)), 'no city but the capital: two border provinces', f.map(p => nameOf(G, p)));
    for (const p of mine) if (p !== N.capital) S.owner[p] = -1;
    const g = R.startOuter(N.id); ok(same(g, [N.capital, N.capital]), 'nothing but the capital: the stacks stay in the capital', g.map(p => nameOf(G, p))); } }

// ---- 3. the recon slot
{ const R = load([START0, START0.replace('recon:null', "recon:{rcn:1}")]), api = R.IM.api; api.useScenario('world64'); api.newGame(12345, 0, [0]); const S = R.S;
  ok(!R.UNITS.rcn, 'there is no recon vehicle yet (the proposal waits for the owner)');
  ok(S.nations.every(N => S.armies.filter(a => a.owner === N.id && a.at !== N.capital).every(a => same(forces(S, N.id).find(x => x.at === a.at).u, {inf:2}))), 'the slot naming a unit that does not exist yet is skipped: 2 infantry an outer stack'); }
{ const R = load([START0, START0.replace('recon:null', 'recon:{at:1}')]), api = R.IM.api; api.useScenario('world64'); api.newGame(12345, 0, [0]); const S = R.S;
  const outs = S.nations.flatMap(N => forces(S, N.id).filter(x => x.at !== N.capital));
  ok(outs.length === 2*S.nations.length && outs.every(x => same(x.u, {inf:2, at:1})), 'once the slot names a unit (tried with Anti-Tank Infantry), every outer stack gets one beside its 2 infantry', outs.slice(0, 2));
  ok(picks12345 && S.nations.every(N => same(S.armies.filter(a => a.owner === N.id && a.at !== N.capital).map(a => a.at), picks12345[N.name])), 'and the outer cities stay the same'); }

// ---- 4. an old save keeps its armies
{ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(4242, 5, [0]); let S = R.S, G = R.G; S.started = true;
  // the old start's extra forces (a tank in the capital, 2 infantry in every other city), as a save from before the rule holds them
  for (const N of S.nations){ R.addArmy(N.id, N.capital, {inf:2, tank:2}); for (const P of G.P) if (S.owner[P.id] === N.id && P.city && P.id !== N.capital && !S.armies.some(a => a.owner === N.id && a.at === P.id)) R.addArmy(N.id, P.id, {inf:2}); }
  for (let i = 0; i < 6; i++) api.tick();
  const before = S.armies.filter(a => a.owner >= 0).map(a => [a.id, a.owner, a.at, Object.fromEntries(Object.entries(a.u).filter(([, v]) => v > 0))]), save = api.saveJSON();
  const R2 = load(), a2 = R2.IM.api; a2.useScenario('world64'); a2.newGame(1, 0, [0]); const okL = a2.restore(JSON.parse(save)); const S2 = R2.S;
  const after = S2.armies.filter(a => a.owner >= 0).map(a => [a.id, a.owner, a.at, Object.fromEntries(Object.entries(a.u).filter(([, v]) => v > 0))]);
  ok(okL && same(before, after), `an old save loads with its armies as saved (${before.length} forces, tanks and city garrisons included)`, okL ? after.length : 'restore failed');
  ok(S2.armies.some(a => a.owner >= 0 && a.u.tank > 0), 'its tanks are still there'); }

// ---- 5. computer capitals keep their garrison
for (const seed of [12345, 7]){ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(seed, 0, []); const S = R.S; S.started = true;
  const AIRK = new Set(Object.keys(R.UNITS).filter(k => R.UNITS[k].cls === 'air'));
  const empty = () => S.nations.filter(N => N.alive !== false && !S.armies.some(a => a.owner === N.id && a.at === N.capital && a.to === null && !a.air && !(a.path && a.path.length)
    && Object.entries(a.u).some(([k, v]) => v > 0 && !AIRK.has(k)))).map(N => N.name);
  for (let h = 1; h <= 72; h++){ api.tick(); if (h === 24 || h === 72){ const e = empty(); ok(!e.length, `seed ${seed}, hour ${h}: every computer capital holds ground units`, e.slice(0, 8)); } } }

console.log(bad ? `${bad} of ${n} checks FAILED` : `ALL ${n} CHECKS PASS: the starting army, its cities, the recon slot, old saves and held capitals`);
process.exit(bad ? 1 : 0);
