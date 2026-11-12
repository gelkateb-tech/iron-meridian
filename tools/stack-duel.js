// Iron Meridian: stack-limit duel (headless). One stack of 128 land units against the same units in thirteen stacks (twelve of 10 and one of 8,
// the same unit mix), in an open province and in a city, the big stack attacking and defending; also 20 against 2 × 10. Prints the winner, what is
// left of each side (health of the starting force), the hours the battle lasted and how many units each side lost.
//   node tools/stack-duel.js            all cases (exit 1 unless the split side wins every required case)
//   node tools/stack-duel.js --json     the results as JSON (the test .test/stacks.js reads them)
// IM_ROOT=<folder> runs another copy of the game (a build from before the stack limits: the same duel without them).
// The rules run in plain Node (as tools/headless.js); every nation is a seat that gives no orders, so no AI moves anything, and only the two
// sides of the duel are on the map. The stack-limit rule: rules/combat.js (stackPenalty) and docs/COMBAT.md.
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') +
  '\nreturn {IM, get S(){ return S; }, get G(){ return G; }, setRel, addArmy, count, armyHP, effHP, orderMove, etaHours, tick, stackPenalty:typeof stackPenalty === "function" ? stackPenalty : () => ({dmg:1}), frontage, removeEmpty};';
const JSON_OUT = process.argv.includes('--json');

// the mix of one 10-unit stack; the big stack holds exactly the units of all the small ones
const MIX10 = {inf:4, tank:2, at:2, art:1, ifv:1}, MIX8 = {inf:3, tank:2, at:1, art:1, ifv:1};
const sumMix = list => { const m = {}; for (const x of list) for (const k in x) m[k] = (m[k] || 0) + x[k]; return m; };
const SPLIT128 = [...Array(12).fill(MIX10), MIX8], BIG128 = sumMix(SPLIT128);
const SPLIT20 = [MIX10, MIX10], BIG20 = sumMix(SPLIT20);

// a fresh game; A attacks B's province p (open ground or a city) from up to three of A's provinces next to it
function setup(city){
  const R = new Function(SRC)(), api = R.IM.api;
  api.newGame(4242, 0, Array.from({length:15}, (_, i) => i)); const S = R.S, G = R.G; S.started = true;
  // a border province (or city) of nation 1 next to nation 0, with three land neighbours that are nation 0's or next to its land (so the attacker
  // is supplied there), made open plains (or urban) without rivers or seasons, so that only the city counts
  const land = v => !G.P[v].sea, of0 = v => S.owner[v] === 0, near0 = v => of0(v) || G.P[v].nbs.some(of0);
  const P = G.P.find(q => land(q.id) && S.owner[q.id] === 1 && !!q.city === city && q.id !== S.nations[1].capital && q.nbs.some(of0) && q.nbs.filter(v => land(v) && near0(v) && v !== S.nations[1].capital).length >= 3);
  if (!P) throw new Error('no duel province');
  P.terrain = city ? 'urban' : 'plains'; P.river = new Set(); P.lat = 30;   // (no winter snow or spring mud there either)
  const sides = P.nbs.filter(v => land(v) && near0(v) && v !== S.nations[1].capital).sort((x, y) => of0(y) - of0(x)).slice(0, 3);
  for (const v of sides){ S.owner[v] = 0; S.home[v] = 0; }
  S.armies.length = 0; for (const q of S.queue) q.length = 0; for (let i = 0; i < S.cons.length; i++) S.cons[i] = null;
  S.bld[P.id].fort = 0;
  R.setRel(0, 1, 'war');
  return {R, S, G, p:P.id, sides};
}
// stacks: the attacker's forces (each a unit mix) and from how many directions they come; defence: the defender's forces
function duel(city, atk, def, dirs = 1, label = ''){
  const {R, S, G, p, sides} = setup(city);
  const D = def.map(m => { const a = R.addArmy(1, p, {...m}); a.still = S.hour - 48; return a; });
  const A = atk.map((m, i) => { const a = R.addArmy(0, sides[i % Math.min(dirs, sides.length)], {...m}); return a; });
  for (const a of A){ R.orderMove(a, p); a.path = [p]; a.forced = true; }   // (straight in from its own side, not round by a faster road through another)
  { const slow = Math.max(...A.map(a => R.etaHours(a))); for (const a of A) a.delay = slow - R.etaHours(a); }   // from several sides they set off so as to arrive together
  const hp0A = A.reduce((s0, a) => s0 + R.armyHP(a), 0), hp0D = D.reduce((s0, a) => s0 + R.armyHP(a), 0), n0A = A.reduce((s0, a) => s0 + R.count(a), 0), n0D = D.reduce((s0, a) => s0 + R.count(a), 0);
  let h0 = -1, h = 0, m0 = null;
  // the battle is over when no fight is left in the province (a side destroyed, or broken and retreating): the side still standing there won
  let h1 = -1; for (; h < 24*20; h++){ R.tick(); if (h0 < 0 && S.battles.includes(p)){ h0 = S.hour; m0 = [A, D].map(L => Math.round(L.reduce((s0, a) => s0 + (a.m ?? 80), 0)/L.length)); } if (h0 >= 0 && !S.battles.includes(p) && S.hour - h0 > 1){ h1 = S.hour; break; } }
  const eh = a => R.count(a) > 0 ? R.effHP(a) : 0, holds = L => L.some(a => R.count(a) > 0 && a.at === p && a.to === null);
  const hpA = A.reduce((s0, a) => s0 + eh(a), 0), hpD = D.reduce((s0, a) => s0 + eh(a), 0), nA = A.reduce((s0, a) => s0 + R.count(a), 0), nD = D.reduce((s0, a) => s0 + R.count(a), 0);
  const winner = holds(A) && !holds(D) ? 'attacker' : holds(D) && !holds(A) ? 'defender' : 'none';
  return {label, place:city ? 'city' : 'open', province:G.P[p].cityName || G.P[p].name, front:R.frontage(p), dirs:Math.min(dirs, sides.length),
    atk:`${atk.length} × ${atk.length > 1 ? '≤' : ''}${Math.max(...atk.map(m => Object.values(m).reduce((x, y) => x + y, 0)))}`, def:`${def.length} × ${def.length > 1 ? '≤' : ''}${Math.max(...def.map(m => Object.values(m).reduce((x, y) => x + y, 0)))}`,
    winner, hours:h0 >= 0 && h1 >= 0 ? h1 - h0 : null, atkLeft:Math.round(hpA/hp0A*100), defLeft:Math.round(hpD/hp0D*100), atkLost:n0A - nA, defLost:n0D - nD, morale0:m0,
    atkStack:Math.round(R.stackPenalty({owner:0, u:{...atk[0]}}).dmg*100), defStack:Math.round(R.stackPenalty({owner:1, u:{...def[0]}}).dmg*100)}; }
const cases = [];
for (const city of [false, true]){
  cases.push({...duel(city, [BIG128], SPLIT128, 1, '128 attacks 13 stacks'), split:'defender'});
  cases.push({...duel(city, SPLIT128, [BIG128], 1, '13 stacks attack 128 (one side)'), split:'attacker'});
  cases.push({...duel(city, SPLIT128, [BIG128], 3, '13 stacks attack 128 (three sides)'), split:'attacker'});
  cases.push({...duel(city, [BIG20], SPLIT20, 1, '20 attacks 2 × 10'), split:'defender'});
  // (one side into a city: the city's cover and home soil, ×1.56 on the damage the defender takes, outweigh the 20-stack's 61%: a 20-stack still holds a
  // city against the same units attacking down one road; from two sides the front widens to 21 and the split stacks take it)
  cases.push({...duel(city, SPLIT20, [BIG20], 1, '2 × 10 attack 20 (one side)'), split:'attacker', info:city});
  cases.push({...duel(city, SPLIT20, [BIG20], 2, '2 × 10 attack 20 (two sides)'), split:'attacker'});
}
for (const c of cases) c.ok = c.winner === c.split || !!c.info;
if (JSON_OUT){ console.log(JSON.stringify(cases)); process.exit(0); }
console.log('Stack-limit duel: one big stack against the same units in stacks of at most 10 (same mix: infantry, tanks, anti-tank, artillery, IFV)');
console.log('case'.padEnd(36) + 'place'.padEnd(6) + 'front'.padEnd(6) + 'dirs'.padEnd(5) + 'winner'.padEnd(10) + 'hours'.padEnd(6) + 'attacker left'.padEnd(15) + 'defender left'.padEnd(15) + 'lost (atk/def)');
for (const c of cases) console.log(c.label.padEnd(36) + c.place.padEnd(6) + String(c.front).padEnd(6) + String(c.dirs).padEnd(5) + (c.winner + (c.winner === c.split ? '' : c.info ? ' *' : ' !')).padEnd(10) + String(c.hours).padEnd(6) + `${c.atkLeft}%`.padEnd(15) + `${c.defLeft}%`.padEnd(15) + `${c.atkLost}/${c.defLost}`);
const bad = cases.filter(c => !c.ok);
if (cases.some(c => c.info && c.winner !== c.split)) console.log('* informational: two stacks of 10 attacking a 20-stack in a city down one road (city cover and home soil); from two sides they win');
console.log(bad.length ? `FAIL: the split stacks lost or drew ${bad.length} case(s)` : `OK: the split stacks won every required case (${cases.filter(c => !c.info).length})`);
process.exit(bad.length ? 1 : 0);
