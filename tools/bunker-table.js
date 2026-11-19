#!/usr/bin/env node
// The Bunker's protection table (docs/COMBAT.md section 7), worked out by the rules themselves: bunkerTable() in rules/combat.js reads BUNKER_LV
// (rules/data.js), the dug-in factors DIG_DEF and DIG_CITY and buildCost. It also plays each level through the rules' own damage step (hurt, with
// bunkerF and digF on a real garrison in a real city) to show the table is what a battle does.
//   node tools/bunker-table.js            the markdown table
//   node tools/bunker-table.js --check    the same, and exit 1 unless the measured damage matches the table
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const R = new Function("'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n')
  + '\nreturn {IM, bunkerTable, bunkerF, digF, hurt, addArmy, effHP, DIG_H, RES_K, get S(){ return S; }, get G(){ return G; }};')();
const api = R.IM.api; api.useScenario('world'); api.newGame(12345, 0, []); const S = R.S, G = R.G;
const T = R.bunkerTable(-1), pct = v => Math.round(v*100) + '%', pct1 = v => (Math.round(v*1000)/10).toFixed(1) + '%', K = v => Math.round(v/R.RES_K) + 'k';
// measured: one infantry force of the capital's holder, standing in its own capital (a city) and in an open province of its own, takes a fixed hit
const cap = S.nations[0].capital, open = G.P.find(P => S.owner[P.id] === 0 && !P.city && !P.sea && !P.nbs.some(v => G.P[v].city)).id;
function taken(p, lv, dug){ S.bld[p].fort = lv; const a = R.addArmy(0, p, {inf:40}); a.still = dug ? S.hour - R.DIG_H - 1 : S.hour; const h0 = R.effHP(a);
  R.hurt(a, {soft:0.002, armored:0.002, air:0.002, naval:0.002}, R.bunkerF(a, p)*R.digF(a)); const d = h0 - R.effHP(a); S.armies.splice(S.armies.indexOf(a), 1); return d; }
const base = taken(cap, 0, false); let bad = 0;
const rows = T.map(r => { const m = [taken(cap, r.lv, false)/base, taken(open, r.lv, true)/taken(open, 0, false), taken(cap, r.lv, true)/base];
  const want = [1 - r.less, 1 - r.lessOpen, 1 - r.lessCity]; if (m.some((v, i) => Math.abs(v - want[i]) > 0.002)) bad++; return {r, m}; });
console.log('| level | garrison takes less damage | with dug-in, open | with dug-in, city | health | morale | other buildings | upkeep a day | price | build time |');
console.log('|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|');
for (const {r} of rows) console.log(`| ${r.lv} | ${pct(r.less)} | ${pct1(r.lessOpen)} | ${pct1(r.lessCity)} | ${r.hp} | +${pct(r.mrl)} | ${pct(r.shield)} less damage | $${r.upk.toFixed(1)}M | $${r.cost.cash}M, ${K(r.cost.metal)} materials, ${K(r.cost.iron)} iron${r.cost.elec ? ', ' + K(r.cost.elec) + ' electronics' : ''} | ${r.days} days |`);
const cum = T.reduce((s, r) => s + r.cost.cash, 0);
console.log(`\n(no bunker: 0% / ${pct1(1 - 1/1.1)} dug in, open / ${pct1(1 - 1/1.25)} dug in, city. All five levels: $${cum}M. Measured through the rules' damage step:`
  + ` ${rows.map(({r, m}) => `${r.lv}: ${m.map(v => pct1(1 - v)).join(' / ')}`).join('; ')}${bad ? `; ${bad} level(s) DIFFER from the table` : '; same as the table'}.)`);
process.exit(process.argv.includes('--check') && bad ? 1 : 0);
