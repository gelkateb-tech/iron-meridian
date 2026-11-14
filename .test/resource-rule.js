// The owner's resource balance rule for the nations world (docs/ECONOMY.md "Resource balance"; tools/build-nations.js MAINS), in plain Node:
//   node .test/resource-rule.js            exit 0 when every check holds
// 1. every playable nation of a new nations-world game has 7 to 14 cities; all six goods (money, oil, materials, iron, electronics, rare
//    materials) on at least one of its cities; no good on more than 2 cities, except in a nation of 13 or 14 cities, where only its cities beyond
//    12 may lift a good to 3 (so at most n - 12 goods on 3, none above 3); and each city's resource in the game is the one nations.js sets
// 2. saves: a new game's save carries the resources (S.w64.mains) and a load keeps them, even when nations.js would set others; a nations-world
//    save made before the rule (no mains) loads with the resources of the map method (rules/map.js cityMains), as it always had: nothing changes
//    under an old save; independent land and the classic world keep the map method's resources
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn {IM, cityMain};';
const load = () => new Function(SRC)();
let bad = 0; const ok = (c, msg) => { if (!c){ bad++; console.log('FAIL  ' + msg); } };
const KS = ['cash', 'oil', 'metal', 'iron', 'elec', 'rare'], CH = {c:'cash', o:'oil', m:'metal', i:'iron', e:'elec', r:'rare'};

// ---- 1. the rule, nation by nation
const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(12345, 0, []); let S = api.S, G = api.G;
ok(S.nations.length === NATIONS.nations.length && S.nations.length >= 68, `${S.nations.length} nations`);
let three = 0;
for (const N of S.nations){ const ids = G.P.filter(P => S.owner[P.id] === N.id && P.city).map(P => P.id), n = ids.length, cnt = Object.fromEntries(KS.map(k => [k, 0]));
  for (const id of ids) cnt[R.cityMain(id)]++;
  ok(n >= 7 && n <= 14, `${N.name}: ${n} cities (7 to 14)`);
  for (const k of KS){ ok(cnt[k] >= 1, `${N.name}: no ${k} city`); ok(cnt[k] <= (n >= 13 ? 3 : 2), `${N.name}: ${cnt[k]} ${k} cities (${n} cities)`); }
  const t = KS.filter(k => cnt[k] === 3).length; three += t; ok(t <= Math.max(0, n - 12), `${N.name}: ${t} goods on 3 cities with ${n} cities`);
  const D = NATIONS.nations.find(d => d.name === N.name);
  ok(D && typeof D.mains === 'string' && D.mains.length === D.cities.length, `${N.name}: no mains in nations.js`);
  if (D && D.mains) D.cities.forEach((id, i) => ok(G.P[id].main === CH[D.mains[i]], `${N.name}: ${G.P[id].cityName} is ${G.P[id].main}, nations.js says ${CH[D.mains[i]]}`)); }
const syria = S.nations.find(N => N.name === 'Syria'), sy = KS.map(k => G.P.filter(P => S.owner[P.id] === syria.id && P.city && P.main === k).length);
ok(sy.join() === '2,2,1,1,1,1', `Syria: ${sy.join(',')} (money, oil, materials, iron, electronics, rare)`);
console.log(`68 nations under the rule: ${S.nations.reduce((s, N) => s + G.P.filter(P => S.owner[P.id] === N.id && P.city).length, 0)} cities, ${three} goods on 3 cities (nations of 13-14), Syria ${sy.join('/')}`);

// ---- 2. saves
{ const mainsOf = g => g.P.map(P => P.city ? P.main : null).join();
  const now = mainsOf(G), save = api.saveJSON(), d = JSON.parse(save);
  ok(typeof d.w64.mains === 'string' && d.w64.mains.length === d.w64.cities.length, 'a new save has no S.w64.mains');
  // the same save, loaded in a fresh page whose nations.js would set other resources: the save's own are kept
  const R2 = load(), a2 = R2.IM.api, keep = NATIONS.nations.map(n => n.mains);
  for (const n of NATIONS.nations) n.mains = n.mains.replace(/./g, 'c');
  a2.useScenario('world64'); a2.newGame(7, 3, []); ok(a2.restore(JSON.parse(save)), 'the new save does not load');
  ok(mainsOf(a2.G) === now, 'a loaded save does not keep its own city resources');
  NATIONS.nations.forEach((n, i) => { n.mains = keep[i]; });
  // a save from before the rule (no mains): the map method, the same as a game of the base build; independent land the same in both
  const old = JSON.parse(save); delete old.w64.mains;
  const R3 = load(), a3 = R3.IM.api; ok(a3.restore(old), 'a save without mains does not load');
  const G3 = a3.G, own = id => S.owner[id] >= 0;
  const changed = G3.P.filter(P => P.city && P.main !== G.P[P.id].main);
  ok(changed.length > 0 && changed.every(P => own(P.id)), `an old save: ${changed.length} cities differ from the rule, ${changed.filter(P => !own(P.id)).length} of them independent`);
  ok(G3.P.filter(P => P.city && S.owner[P.id] === syria.id && P.main === 'oil').length === 4, 'an old save: Syria does not keep its 4 oil cities of the map method');
  // the map method, run alone for the nations world (no mains), gives the old save's resources exactly
  const R4 = load(), a4 = R4.IM.api; for (const n of NATIONS.nations) delete n.mains;
  a4.useScenario('world64'); a4.newGame(12345, 0, []); ok(mainsOf(a4.G) === mainsOf(G3), 'an old save does not have the map method\'s resources');
  NATIONS.nations.forEach((n, i) => { n.mains = keep[i]; });
  ok(!a4.S.w64.mains, 'a game without mains in nations.js writes mains'); }
// the classic world: the map method (world.js), untouched
{ const R5 = load(), a5 = R5.IM.api; a5.useScenario('world'); a5.newGame(12345, 0, []); const G5 = a5.G;
  ok(G5.P.every(P => P.main === G5.base.main[P.id]), 'the classic world does not have world.js\'s city resources'); }
console.log(bad ? `RESOURCE RULE: ${bad} FAILED` : 'RESOURCE RULE OK'); process.exit(bad ? 1 : 0);
