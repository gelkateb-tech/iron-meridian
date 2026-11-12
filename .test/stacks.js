// Stack limits test (headless rules): the efficiency and speed tables, how sizes count (land, sea, air cards), new units and arriving forces stay
// within the limit, an old save's 128-stack still loads and fights (with the penalty), the AI splits it into limit-sized stacks, and the duel
// (tools/stack-duel.js): one 128-stack against the same units in stacks of 10 loses every way round.
const path = require('path'), fs = require('fs'), cp = require('child_process'); const ROOT = path.resolve(__dirname, '..');
globalThis.window = globalThis; require(ROOT + '/world.js'); require(ROOT + '/lines.js');
const html = fs.readFileSync(ROOT + '/index.html', 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const R = new Function("'use strict';\n" + FILES.map(f => fs.readFileSync(ROOT + '/' + f, 'utf8')).join('\n') +
  '\nreturn {IM, get S(){ return S; }, get G(){ return G; }, stackEffN, stackSpdN, stackPenalty, stackPenaltyIf, stackSizes, STACK_LIM, addArmy, spawn, aiTurn, setRel, count, landSpeed, orderMove, tick, removeEmpty};')();
const api = R.IM.api; api.newGame(12345, 0, [0]); const S = R.S, G = R.G; S.started = true;
let bad = 0; const ck = (c, m) => { if (!c){ bad++; console.log('FAIL', m); } };
const near = (x, y, e = 0.005) => Math.abs(x - y) < e;
// 1. the owner's table (land, limit 10) and the speed factors
const T = {5:1, 10:1, 15:0.773, 20:0.612, 30:0.385, 50:0.25, 100:0.25, 128:0.25};
for (const n in T) ck(near(R.stackEffN(+n, 10), T[n]), `damage efficiency of ${n}: ${R.stackEffN(+n, 10)}`);
const V = {10:1, 20:0.896, 30:0.835, 50:0.759, 100:0.655, 128:0.618};
for (const n in V) ck(near(R.stackSpdN(+n, 10), V[n]), `speed factor of ${n}: ${R.stackSpdN(+n, 10)}`);
ck(R.STACK_LIM.land === 10 && R.STACK_LIM.air === 5 && R.STACK_LIM.sea === 5, 'limits 10 / 5 / 5');
ck(near(R.stackEffN(10, 5), 0.612) && R.stackEffN(25, 5) === 0.25, 'air and sea: limit 5');
// 2. sizes: a mixed force counts land and ships apart; a card of swarm drones counts once; the worst domain sets the penalty
{ const z = R.stackSizes({owner:0, u:{inf:12, tank:3, frig:4, crui:2}}); ck(z.land === 15 && z.sea === 6 && z.air === 0, 'mixed sizes ' + JSON.stringify(z));
  const P = R.stackPenalty({owner:0, u:{inf:12, tank:3, frig:4, crui:2}}); ck(P.over && P.dom === 'land' && near(P.dmg, 0.773), 'mixed penalty ' + JSON.stringify(P));
  ck(!R.stackPenalty({owner:0, air:{}, u:{swarm:24}}).over && R.stackSizes({owner:0, u:{swarm:24}}).air === 4, 'four swarm cards are within the air limit');
  ck(R.stackPenalty({owner:0, air:{}, u:{jet:8}}).over, 'eight jets are over the air limit');
  ck(R.stackPenaltyIf({owner:0, u:{inf:6}}, {owner:0, u:{inf:5}}).over && !R.stackPenaltyIf({owner:0, u:{inf:6}}, {owner:0, u:{inf:4}}).over, 'merge preview'); }
// 3. new units: they join a force here only while it has room
{ const p = S.nations[0].capital; S.armies = S.armies.filter(a => a.at !== p); for (let i = 0; i < 23; i++) R.spawn(0, p, 'inf');
  const here = S.armies.filter(a => a.at === p && a.owner === 0 && !a.air); ck(here.length === 3 && here.every(a => R.count(a) <= 10), 'new units fill stacks of 10: ' + here.map(R.count)); }
// 4. a seat's forces arriving where its own force stands merge only within the limit
{ const p = S.nations[0].capital, nb = G.P[p].nbs.find(v => !G.P[v].sea && S.owner[v] === 0); S.armies = S.armies.filter(a => a.at !== p && a.at !== nb);
  const A = R.addArmy(0, p, {inf:8}), B = R.addArmy(0, nb, {inf:2}), C = R.addArmy(0, nb, {inf:3});
  api.orderMove(B, p); api.orderMove(C, p); for (let i = 0; i < 200 && (B.path.length || B.to !== null || C.path.length || C.to !== null) && R.count(C); i++) R.tick(); R.tick();
  ck(R.count(A) === 10 && R.count(C) === 3, `arrivals merge up to 10 (A ${R.count(A)}, C ${R.count(C)})`); }
// 5. an old save with a 128-stack: it loads, keeps its units, moves slower and fights at 25%
{ const p = S.nations[0].capital, a = R.addArmy(0, p, {inf:80, tank:30, art:18}); a.m = 80; const spd0 = R.landSpeed({...a, u:{...a.u, inf:10, tank:0, art:0}});
  const js = api.saveJSON(); api.restore(JSON.parse(js)); const b = R.S.armies.find(x => x.id === a.id);
  ck(b && R.count(b) === 128, 'old save: the 128-stack loads whole'); const P = R.stackPenalty(b); ck(P.over && P.dmg === 0.25 && near(P.spd, 0.618), 'old save: 25% damage, 62% speed ' + JSON.stringify(P));
  ck(R.landSpeed(b) < spd0, 'old save: the big stack is slower'); }
// 6. the AI splits an idle 128-stack into limit-sized stacks and spreads them
{ api.newGame(777, 0, []); const S2 = R.S, n = 3, p = S2.nations[n].capital; S2.started = true;
  const a = R.addArmy(n, p, {inf:70, tank:30, art:14, at:14}); const before = S2.armies.filter(x => x.owner === n && !x.air).length;
  S2.hour = 4*24 - n; R.aiTurn(n); R.removeEmpty();
  const mine = S2.armies.filter(x => x.owner === n && !x.air && R.count(x)), big = Math.max(...mine.map(x => R.stackSizes(x).land));
  ck(big <= 10, `AI: biggest stack after its turn ${big}`); ck(mine.length >= before + 12, `AI: ${mine.length} stacks (was ${before})`); }
// 7. the duel
{ const out = cp.execFileSync(process.execPath, [path.join(ROOT, 'tools/stack-duel.js'), '--json'], {encoding:'utf8', maxBuffer:1 << 24}), cases = JSON.parse(out);
  for (const c of cases){ if (c.label.startsWith('128') || c.label.startsWith('13')) ck(c.winner === c.split, `duel ${c.label} (${c.place}): ${c.winner}`); else ck(c.ok, `duel ${c.label} (${c.place}): ${c.winner}`); }
  const c1 = cases.find(c => c.label === '13 stacks attack 128 (one side)' && c.place === 'open'); ck(c1 && c1.atkLeft > 70 && c1.atkLeft - c1.defLeft >= 20, 'duel: the split side wins clearly ' + (c1 && `${c1.atkLeft}% vs ${c1.defLeft}%`)); }
console.log(bad ? 'FAILED' : 'OK', 'errors', []); process.exit(bad ? 1 : 0);
