'use strict';
// makes .test/fixtures/missiles-v74-save.json with the rules of Dev Build v74 (master ee7e438, before MISSILES PLAN 2):
//   node .test/missiles-v74-make.js <v74 checkout> <out.json>
// A nations-world game played 3 days with Poland as the seat, at war with Germany: a Missile Silo II in Warsaw holding a Chemical Missile
// and a Tactical Nuclear Missile (v74's names) and cruise and ballistic missiles, a Silo I in Krakow with a chemical missile building, the chemical
// and nuclear launch clocks (wmdT) set, and four missiles in flight with no HP saved (a cruise and a ballistic missile, a chemical and a nuclear
// one), one of them landing in the coming hour; a German silo with a cruise missile stocked
const fs = require('fs'), path = require('path'), ROOT = process.argv[2], OUT = process.argv[3];
if (!ROOT || !OUT) throw new Error('usage: node .test/missiles-v74-make.js <v74 checkout> <out.json>');
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn {IM, ev:s => eval(s), get S(){ return S; }, get G(){ return G; }};';
const R = new Function(SRC)(), api = R.IM.api, X = s => R.ev(s);
const M = X('MISSILES'); if (!M.chem || !M.nuc || M.ccm || !/Tactical/.test(M.nuc.name)) throw new Error('these rules are not v74 (run against master ee7e438)');
api.useScenario('world64'); api.newGame(7474, 0, []);
let S = R.S; const pl0 = S.nations.findIndex(N => N.name === 'Poland');
api.newGame(7474, pl0, [pl0]); S = R.S; const G = R.G; S.started = true; const pl = S.nations.findIndex(N => N.name === 'Poland'), de = S.nations.findIndex(N => N.name === 'Germany');   // (the seat's nation is listed first)
for (let h = 0; h < 3*24; h++) api.tick();
const N = S.nations[pl]; N.cash = Math.max(N.cash, 4000); for (const k of ['oil', 'metal', 'iron', 'elec', 'rare']) N[k] = Math.max(N[k], 4000*X('RES_K'));
for (const id of ['msl1', 'msl2', 'msl_chem', 'bm_pow', 'msl_nuc']) X('rGrant')(N, id, 1);
api.declareWar(pl, de);
const city = nm => G.P.find(P => P.city && P.cityName === nm && S.owner[P.id] === pl).id, w = city('Warsaw'), kr = (G.P.find(P => P.city && /^Krak/.test(P.cityName) && S.owner[P.id] === pl) || G.P.find(P => P.city && S.owner[P.id] === pl && P.id !== w)).id;
S.bld[w].silo = 2; S.bld[kr].silo = 1;
const st = X('mstock')(w); st.cm = 3; st.bm = 2; st.chem = 2; st.nuc = 2; st.wo = pl;
S.queue[kr].length = 0; if (!api.buildMissile(pl, kr, 'chem')) throw new Error('could not build a chemical missile in Krakow');
// targets: German land near Warsaw with forces standing, two of them defended by SAMs
const de0 = G.P.filter(P => !P.sea && S.owner[P.id] === de).sort((a, b) => X('hexDist')(G.P[w].cc, a.cc) - X('hexDist')(G.P[w].cc, b.cc)).map(P => P.id);
const tg = de0.slice(0, 4); for (const q of tg) X('addArmy')(de, q, {inf:6, tank:2}); X('addArmy')(de, tg[1], {sam:3}); X('addArmy')(de, tg[3], {sam:2});
for (const [k, q] of [['cm', tg[0]], ['bm', tg[1]], ['chem', tg[2]], ['nuc', tg[3]]]) if (!api.launchMissile(pl, w, q, k)) throw new Error('could not launch ' + k);
api.tick();   // an hour flown: the cruise missile lands in the coming hour or the one after
const ds = S.nations[de].capital; S.bld[ds].silo = 1; X('mstock')(ds).cm = 1;
const out = api.saveJSON(), sv = JSON.parse(out);
const inf = sv.inflight || []; if (inf.length !== 4 || inf.some(m => 'hp' in m)) throw new Error('expected four missiles in flight without HP: ' + JSON.stringify(inf));
if (!sv.nations[pl].wmdT || sv.nations[pl].wmdT.chem == null || sv.nations[pl].wmdT.nuc == null) throw new Error('expected the chemical and nuclear launch clocks');
fs.writeFileSync(OUT, out);
console.log(`wrote ${OUT}: ${out.length} bytes; in flight ${JSON.stringify(inf.map(m => [m.k, +m.t.toFixed(3), +m.dt.toFixed(3)]))}; Warsaw stock ${JSON.stringify(sv.mstock[w])}; clocks ${JSON.stringify(sv.nations[pl].wmdT)}`);
