// Iron Meridian: stack-limit duel (headless). One stack of 128 land units against the same units in thirteen stacks (twelve of 10 and one of 8,
// the same unit mix), in an open province and in a city, the big stack attacking and defending; also 20 against 2 × 10. Prints the winner, what is
// left of each side (health of the starting force), the hours the battle lasted and how many units each side lost.
//   node tools/stack-duel.js            all cases (exit 1 unless the split side wins every required case)
//   node tools/stack-duel.js --json     the results as JSON (the test .test/stacks.js reads them)
//   node tools/stack-duel.js --scenarios  combat and ranged-attack cases instead (auto-test harness, run by tools/headless.js --scenarios):
//                                       a strong attack takes the province, a dug-in city holds, artillery in range hurts a force it is not
//                                       fighting and takes no damage, out of range or at peace it does nothing, a Bombard order out of range is refused
// IM_ROOT=<folder> runs another copy of the game (a build from before the stack limits: the same duel without them).
// The rules run in plain Node (as tools/headless.js); every nation is a seat that gives no orders, so no AI moves anything, and only the two
// sides of the duel are on the map. The stack-limit rule: rules/combat.js (stackPenalty) and docs/COMBAT.md.
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') +
  '\nreturn {IM, get S(){ return S; }, get G(){ return G; }, setRel, addArmy, count, armyHP, effHP, orderMove, etaHours, tick, stackPenalty:typeof stackPenalty === "function" ? stackPenalty : () => ({dmg:1}), frontage, removeEmpty,' +
  ' rangeOf:typeof rangeOf === "function" ? rangeOf : null, armyXY, kmBetween:typeof kmBetween === "function" ? kmBetween : null, orderBombard:typeof orderBombard === "function" ? orderBombard : null, bombardInfo:typeof bombardInfo === "function" ? bombardInfo : null, ptIn:typeof ptIn === "function" ? ptIn : null};';
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
  const D = def.map(m => { const a = R.addArmy(1, p, {...m}); a.still = S.hour; return a; });   // (never dug in: the duel weighs the stack limit alone; the dug-in bonus, DIG_DEF, would help either defender alike)
  const A = atk.map((m, i) => { const a = R.addArmy(0, sides[i % Math.min(dirs, sides.length)], {...m}); return a; });
  for (const a of A){ R.orderMove(a, p); a.path = [p]; a.forced = true; }   // (straight in from its own side, not round by a faster road through another)
  { const slow = Math.max(...A.map(a => R.etaHours(a))); for (const a of A) a.delay = slow - R.etaHours(a); }   // from several sides they set off so as to arrive together
  const hp0A = A.reduce((s0, a) => s0 + R.armyHP(a), 0), hp0D = D.reduce((s0, a) => s0 + R.armyHP(a), 0), n0A = A.reduce((s0, a) => s0 + R.count(a), 0), n0D = D.reduce((s0, a) => s0 + R.count(a), 0);
  let h0 = -1, h = 0, m0 = null;
  // the battle is over when no fight is left in the province (a side destroyed, or broken and retreating): the side still standing there won
  let h1 = -1; for (; h < 24*20; h++){ for (const a of D) if (a.still != null) a.still = S.hour; R.tick(); if (h0 < 0 && S.battles.includes(p)){ h0 = S.hour; m0 = [A, D].map(L => Math.round(L.reduce((s0, a) => s0 + (a.m ?? 80), 0)/L.length)); } if (h0 >= 0 && !S.battles.includes(p) && S.hour - h0 > 1){ h1 = S.hour; break; } }
  const eh = a => R.count(a) > 0 ? R.effHP(a) : 0, holds = L => L.some(a => R.count(a) > 0 && a.at === p && a.to === null);
  const hpA = A.reduce((s0, a) => s0 + eh(a), 0), hpD = D.reduce((s0, a) => s0 + eh(a), 0), nA = A.reduce((s0, a) => s0 + R.count(a), 0), nD = D.reduce((s0, a) => s0 + R.count(a), 0);
  const winner = holds(A) && !holds(D) ? 'attacker' : holds(D) && !holds(A) ? 'defender' : 'none';
  return {label, place:city ? 'city' : 'open', province:G.P[p].cityName || G.P[p].name, front:R.frontage(p), dirs:Math.min(dirs, sides.length),
    atk:`${atk.length} × ${atk.length > 1 ? '≤' : ''}${Math.max(...atk.map(m => Object.values(m).reduce((x, y) => x + y, 0)))}`, def:`${def.length} × ${def.length > 1 ? '≤' : ''}${Math.max(...def.map(m => Object.values(m).reduce((x, y) => x + y, 0)))}`,
    winner, hours:h0 >= 0 && h1 >= 0 ? h1 - h0 : null, atkLeft:Math.round(hpA/hp0A*100), defLeft:Math.round(hpD/hp0D*100), atkLost:n0A - nA, defLost:n0D - nD, morale0:m0,
    atkStack:Math.round(R.stackPenalty({owner:0, u:{...atk[0]}}).dmg*100), defStack:Math.round(R.stackPenalty({owner:1, u:{...def[0]}}).dmg*100)}; }
// ---- --scenarios (auto-test): combat and ranged attacks, each with its expected result
if (process.argv.includes('--scenarios')){ const out = [], ok = (name, c, d) => out.push({name, ok:!!c, d});
  // 1. a strong attack wins and takes the province (the capture is at the province's heart once no enemy is left)
  { const {R, S, G, p, sides} = setup(false); const D = R.addArmy(1, p, {inf:2}), A = R.addArmy(0, sides[0], {tank:6, inf:4}); R.orderMove(A, p); A.forced = true;
    let h = 0, hb = -1; for (; h < 24*6 && S.owner[p] !== 0; h++){ R.tick(); if (hb < 0 && S.battles.includes(p)) hb = h; }
    ok('combat: 6 tanks + 4 infantry attack 2 infantry in the open: the attacker wins and takes the province', S.owner[p] === 0 && !(R.count(D) && D.at === p && D.to === null), `battle from hour ${hb}, owner ${S.owner[p]} after ${h} h, defenders left ${R.count(D)}${R.count(D) ? ` (broke: ${D.to !== null ? 'retreating to ' + G.P[D.to].name : 'at ' + G.P[D.at].name})` : ''}, attackers ${R.count(A)}`); }
  // 2. the same small attack against a city with Bunker 3 and a dug-in garrison holds
  { const {R, S, G, p, sides} = setup(true); S.bld[p].fort = 3; const D = R.addArmy(1, p, {inf:4, at:2}); D.still = S.hour - 48; const A = R.addArmy(0, sides[0], {inf:4, tank:1}); R.orderMove(A, p); A.forced = true;
    for (let h = 0; h < 24*5; h++) R.tick(); ok('combat: 4 infantry + 1 tank against a dug-in city garrison (4 infantry, 2 anti-tank) behind Bunker 3: the city holds', S.owner[p] === 1 && R.count(D) > 0, `owner ${S.owner[p]}, garrison left ${R.count(D)}, attackers left ${R.count(A)}`); }
  // 3. ranged fire: rocket artillery in its own province hurts an enemy force within range that it is not fighting, and takes no damage itself
  { const {R, S, G, p, sides} = setup(false); const D = R.addArmy(1, p, {inf:4}); D.still = S.hour; const M = R.addArmy(0, sides[0], {mlrs:3}); M.still = S.hour;
    if (R.ptIn){ M.pos = R.ptIn(sides[0], G.P[p].x, G.P[p].y); D.pos = R.ptIn(p, M.pos[0], M.pos[1]); }   // (the guns at the edge of their province nearest the target, the target at the edge of its own)
    const SP = R.addArmy(0, sides[0], {spec:1}); SP.still = S.hour; SP.pos = M.pos.slice();   // a spotter: ground forces see 50 km, rocket artillery reaches 150 (Special Forces see 100)
    const [mx, my] = R.armyXY(M), [dx, dy] = R.armyXY(D), km = R.kmBetween ? R.kmBetween(mx, my, dx, dy) : NaN, rng = R.rangeOf ? R.rangeOf(M) : 0, d0 = R.effHP(D), m0 = R.effHP(M);
    for (let h = 0; h < 12; h++) R.tick(); const d1 = R.effHP(D), m1 = R.effHP(M);
    ok(`ranged: 3 rocket artillery (and a Special Forces spotter) ${Math.round(km)} km from 4 enemy infantry (range ${rng} km): ${km <= rng ? 'the target is hurt, the guns are not' : 'out of range, nothing happens'}`, km <= rng ? d1 < d0 && m1 === m0 && M.at === sides[0] : d1 === d0, `target health ${d0.toFixed(1)} -> ${d1.toFixed(1)}, guns ${m0.toFixed(1)} -> ${m1.toFixed(1)}, still at ${G.P[M.at].name}`);
    // 3b. without the spotter the same target at the same distance is not seen (ground sight 50 km) and is not fired at
    { const {R:R2, S:S2, G:G2, p:p2, sides:s2} = setup(false); const D2 = R2.addArmy(1, p2, {inf:4}), M2 = R2.addArmy(0, s2[0], {mlrs:3}); D2.still = M2.still = S2.hour;
      if (R2.ptIn){ M2.pos = R2.ptIn(s2[0], G2.P[p2].x, G2.P[p2].y); D2.pos = R2.ptIn(p2, M2.pos[0], M2.pos[1]); } const e0 = R2.effHP(D2); for (let h = 0; h < 6; h++) R2.tick();
      ok('ranged: without a spotter, rocket artillery does not fire at a force it cannot see (sight 50 km, range 150 km)', R2.effHP(D2) >= e0, `target health ${e0.toFixed(1)} -> ${R2.effHP(D2).toFixed(1)}`); }
    // 4. at peace the guns stay silent
    R.setRel(0, 1, 'peace'); const e0 = R.effHP(D); for (let h = 0; h < 6; h++) R.tick(); ok('ranged: at peace the same guns do not fire (the target only heals)', R.effHP(D) >= e0, `target health ${e0.toFixed(1)} -> ${R.effHP(D).toFixed(1)}`);
    // 5. a Bombard order on a province out of range is refused, with the reason the rules give
    if (R.orderBombard && R.bombardInfo){ R.setRel(0, 1, 'war'); const far = G.P.find(P => !P.sea && S.owner[P.id] === 1 && R.kmBetween(mx, my, P.x, P.y) > rng + 200); let toast = ''; R.IM.on('toast', (n, w) => { toast = w; });
      const r = R.orderBombard(M, far.id), bi = R.bombardInfo(M, far.id) || {}; ok('ranged: a Bombard order on a province out of range is refused (bombardInfo gives the distance and the range; the order itself gives no reason)', r === false && bi.km > bi.range, `returned ${r}; toast "${toast}"; bombardInfo ${Math.round(bi.km)} km, range ${bi.range} km`);
      if (km <= rng){ const near = R.orderBombard(M, p); ok('ranged: a Bombard order on the province in range is taken', near === true && M.tgt, `returned ${near}, target ${JSON.stringify(M.tgt)}`); } } }
  console.log('COMBAT SCENARIOS (classic world, every nation a seat that gives no orders)');
  for (const c of out) console.log(`  ${c.ok ? 'PASS' : 'FAIL'}  ${c.name}   [${c.d}]`);
  const bad = out.filter(c => !c.ok).length; console.log(bad ? `COMBAT SCENARIOS FAILED: ${bad}` : `COMBAT SCENARIOS OK: ${out.length}`); process.exit(bad ? 1 : 0); }
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
