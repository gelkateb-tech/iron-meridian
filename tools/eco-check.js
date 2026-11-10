// Iron Meridian: checks of the city-resource economy (docs/ECONOMY.md), in plain Node (no browser).
//   node tools/eco-check.js            exit 0 when every check holds
// 1. every city has one main resource, the same on every load; rare-earth cities are scarce (0 to 2 per country)
// 2. buildings: Army Base (key fac) gives no income; Arms Industry adds 25% of the city's main resource per level; Refinery, Foundry and
//    Rare Earth Mine are gone; prices rise per level and per other city that has one
// 3. every playable nation of every scenario has money, manpower, materials and iron income on day 1 and can pay for its basic units
// 4. an old save (Refinery II, Foundry under construction, knocked-out Mine, eco1 researched, eco3 running) loads with the refunds,
//    without the old buildings, with the eco1 bonus kept and eco3 complete; a second load changes nothing more
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') +
  '\nreturn {IM, income, provYield, buildCost, ucost, cityMain, cityOut, canBuildHere, trainF, stockCap, has, useScenario, SCENARIOS, UNITS, BUILD, TECH, TECH_BY, BK, MKT_BASE, ARMS_PCT};';
const load = () => new Function(SRC)();
let bad = 0; const ok = (c, msg) => { if (!c){ bad++; console.log('FAIL  ' + msg); } }, near = (a, b, e = 1e-6) => Math.abs(a - b) <= e*Math.max(1, Math.abs(a), Math.abs(b));

// ---- 1. city main resources
const R = load(), api = R.IM.api; api.newGame(12345, 0, []); let S = api.S, G = api.G;
const cities = G.P.filter(P => P.city && !P.sea), KS = ['cash', 'oil', 'metal', 'iron', 'elec', 'rare'], cnt = Object.fromEntries(KS.map(k => [k, 0]));
for (const P of cities){ const k = R.cityMain(P.id); ok(KS.includes(k), `${P.cityName} has no main resource`); cnt[k]++; }
ok(G.P.every(P => P.city || P.main == null), 'a province that is not a city has a main resource');
for (const C of G.countries){ const n = C.provs.filter(v => G.P[v].main === 'rare').length; ok(n <= 2, `${C.name} has ${n} rare-earth cities`); }
const noRare = G.countries.filter(C => C.provs.some(v => G.P[v].city) && !C.provs.some(v => G.P[v].main === 'rare')).length;
ok(cnt.rare >= 8 && cnt.rare <= 20 && noRare >= 60, `rare-earth cities ${cnt.rare}, countries without ${noRare}`);
{ const R2 = load(); R2.IM.api.newGame(7, 3, []); const G2 = R2.IM.api.G; ok(G2.P.every((P, i) => P.main === G.P[i].main || (P.city && !G.P[i].city) || (!P.city && G.P[i].city)), 'city main resources differ between two loads'); }
console.log('cities ' + cities.length + '  ' + KS.map(k => k + ' ' + cnt[k]).join('  ') + `  countries without a rare-earth city ${noRare}`);

// ---- 2. buildings
ok(!R.BUILD.ref && !R.BUILD.fdy && !R.BUILD.mine, 'Refinery, Foundry or Rare Earth Mine still in BUILD');
ok(R.BUILD.fac.name === 'Army Base' && R.BUILD.arms && R.BUILD.arms.max === 5, 'Army Base / Arms Industry missing');
ok(!R.TECH.some(T => T.branch === 'Economy') && !R.TECH_BY.eco1, 'the Economy research branch is still there');
ok(R.BUILD.rec.max === 1 && R.BUILD.rec.cost === 30, 'the Recruiting Office changed');
for (const k of KS){ const P = cities.find(q => R.cityMain(q.id) === k && S.owner[q.id] >= 0), p = P.id, y0 = R.provYield(p), keep = {...S.bld[p]};
  S.bld[p].fac = 3; const y1 = R.provYield(p); ok(Object.keys(y0).every(r => near(y0[r], y1[r])), `Army Base changes the income of ${P.cityName}`);
  S.bld[p].fac = keep.fac; S.bld[p].arms = 2; const y2 = R.provYield(p);
  ok(near(y2[k], y0[k]*(1 + 2*R.ARMS_PCT)) && Object.keys(y0).every(r => r === k || near(y0[r], y2[r])), `Arms Industry II in ${P.cityName} (${k}): ${y0[k]} -> ${y2[k]}`);
  ok(Object.keys(y0).filter(r => r !== 'cash' && r !== 'mp' && y0[r] > 0).every(r => r === k), `${P.cityName} yields more than its main resource`);
  S.bld[p].arms = keep.arms; }
{ const n = 0, cs = G.P.filter(P => S.owner[P.id] === n && P.city).map(P => P.id), c1 = R.buildCost(n, 'arms', 1, cs[0]), c2 = R.buildCost(n, 'arms', 2, cs[0]), c5 = R.buildCost(n, 'arms', 5, cs[0]);
  ok(c1.cash === 40 && c1.metal === 12 && c1.iron === 6 && c2.cash === 64 && c5.cash === 262 && c5.elec === 26, 'Arms Industry prices ' + JSON.stringify([c1, c2, c5]));
  S.bld[cs[1]].arms = 1; const d1 = R.buildCost(n, 'arms', 1, cs[0]); ok(d1.cash === 56 && d1.metal === 17 && d1.iron === 8, 'second Arms Industry price ' + JSON.stringify(d1));
  const f0 = R.buildCost(n, 'fac', 1, cs[2]).cash; ok(f0 === Math.round(25*1.4), 'an Arms Industry must not raise the Army Base price: ' + f0); S.bld[cs[1]].arms = 0;   // (the capital's Army Base raises it once)
  ok(cs.every(p => R.canBuildHere(p, 'arms')) && !R.canBuildHere(G.P.find(P => S.owner[P.id] === n && !P.city).id, 'arms'), 'Arms Industry: cities only');
  const cap = S.nations[n].capital; S.bld[cap].fac = 2; ok(near(R.trainF(cap, 'tank'), 0.6) && near(R.trainF(cap, 'inf'), 0.6) && near(R.trainF(cap, 'jet'), 1) && near(R.trainF(cap, 'frig'), 1), 'Army Base II: ground units 40% faster, aircraft and ships not'); S.bld[cap].fac = 1; }

// ---- 3. every playable nation can field its basic units
for (const scn of Object.keys(R.SCENARIOS)){ const Q = load(); Q.useScenario(scn); Q.IM.api.newGame(12345, 0, []); const S2 = Q.IM.api.S; let low = {};
  for (const N of S2.nations){ const g = Q.income(N.id).gross;
    for (const k of ['cash', 'mp', 'metal', 'iron', 'oil']){ ok(g[k] > (k === 'cash' ? 150 : k === 'mp' ? 30 : 4), `${scn}: ${N.name} ${k} income ${g[k].toFixed(1)}`); if (!low[k] || g[k] < low[k][0]) low[k] = [g[k], N.name]; }
    for (const k of ['elec', 'rare']){ ok(g[k] > 1, `${scn}: ${N.name} ${k} income ${g[k].toFixed(1)}`); if (!low[k] || g[k] < low[k][0]) low[k] = [g[k], N.name]; }
    for (const t of ['inf', 'at', 'tank', 'art']){ const c = Q.ucost(N.id, t); ok(Object.keys(c).every(k => N[k] >= c[k]), `${scn}: ${N.name} cannot pay for ${t} on day 1`); } }
  console.log(`${scn}: ${S2.nations.length} nations; lowest day-1 income  ` + Object.entries(low).map(([k, v]) => `${k} ${v[0].toFixed(1)} (${v[1]})`).join('  ')); }

// ---- 4. an old save
{ const Q = load(), a2 = Q.IM.api; a2.newGame(99, 0, [0]); let T = a2.S; const Gq = a2.G, me = 0, N = T.nations[me];
  const mineP = Gq.P.filter(P => T.owner[P.id] === me && !P.city).map(P => P.id), own = Gq.P.filter(P => T.owner[P.id] === 1 && !P.city).map(P => P.id);
  const old = JSON.parse(a2.saveJSON()); delete old.eco;
  old.bld[mineP[0]].ref = 2; old.bld[mineP[1]].mine = 1; old.bdis = {[mineP[1]]:{mine:old.hour + 20}}; old.cons[mineP[2]] = {k:'fdy', lvl:1, h:30, h0:72};
  old.bld[own[0]].fdy = 2; old.bld[N.capital].fac = 3;
  old.nations[me].tech.eco1 = 1; old.nations[me].research = {id:'eco3', h:50, h0:144}; old.nations[1].tech.eco2 = 1; old.nations[me].metal = Q.stockCap(me) - 10;
  const before = {cash:old.nations[me].cash, metal:old.nations[me].metal, iron:old.nations[me].iron, cash1:old.nations[1].cash};
  ok(a2.restore(JSON.parse(JSON.stringify(old))), 'the old save does not load'); T = a2.S; const M = T.nations[me];
  ok(T.eco === 1 && T.bld.every(b => !('ref' in b) && !('fdy' in b) && !('mine' in b)), 'old buildings left in the save');
  ok(T.bld.every(b => b.arms === 0) && T.bld[M.capital].fac === 3, 'Arms Factory III must load as Army Base III, Arms Industry 0');
  ok(T.cons[mineP[2]] === null && !(T.bdis[mineP[1]] && T.bdis[mineP[1]].mine), 'Foundry under construction or knocked-out Mine left');
  // Refinery I + II: $130M, 26 materials, 13 iron; Mine I: $55M, 10; Foundry (cancelled): $50M, 10 materials. 46 materials: 10 fit, 36 paid at 2.4
  ok(near(M.metal, before.metal + 10) && near(M.iron, before.iron + 13) && near(M.cash, before.cash + 130 + 55 + 50 + 36*Q.MKT_BASE.metal, 1e-9), `refund: money ${before.cash} -> ${M.cash}, materials ${before.metal} -> ${M.metal}, iron ${before.iron} -> ${M.iron}`);
  ok(near(T.nations[1].cash, before.cash1 + 50 + 80), 'the other nation\'s Foundry II refund: ' + (T.nations[1].cash - before.cash1));
  ok(Q.has(me, 'eco1') && Q.has(me, 'eco3') && M.research === null && Q.has(1, 'eco2'), 'economy research not kept / not completed');
  ok(T.log.some(e => /New economy/.test(e.text) && /4 levels refunded/.test(e.text) && /Industrial Automation/.test(e.text)), 'no dispatch about the new economy: ' + JSON.stringify(T.log.slice(0, 2).map(e => e.text)));
  const again = JSON.parse(a2.saveJSON()), c0 = again.nations[me].cash; ok(again.eco === 1 && a2.restore(again) && a2.S.nations[me].cash === c0, 'a second load refunds again');
  for (let h = 0; h < 48; h++) a2.tick(); ok(a2.S.hour === old.hour + 48, 'the migrated save does not run'); }
// eco1 keeps +20% money (against the +10% everyone has), eco3 +50% oil, eco2 +40% manpower
{ const Q = load(), a2 = Q.IM.api; a2.newGame(5, 0, []); const T = a2.S, g0 = {...Q.income(2).gross}; T.nations[2].tech = {eco1:1, eco2:1, eco3:1}; const o = JSON.parse(a2.saveJSON()); a2.restore(o); const tr = Q.income(2).trade, g1 = Q.income(2).gross;
  ok(near((g1.cash - tr.cash)/(g0.cash - tr.cash), 1.2/1.1, 0.02) && near((g1.oil - tr.oil)/(g0.oil - tr.oil), 1.5, 0.02) && near(g1.mp/g0.mp, 1.4, 0.02), `legacy economy research: money x${(g1.cash/g0.cash).toFixed(3)} oil x${(g1.oil/g0.oil).toFixed(3)} manpower x${(g1.mp/g0.mp).toFixed(3)}`); }

console.log(bad ? `ECO CHECK FAILED: ${bad} problem${bad > 1 ? 's' : ''}` : 'ECO CHECK OK');
process.exit(bad ? 1 : 0);
