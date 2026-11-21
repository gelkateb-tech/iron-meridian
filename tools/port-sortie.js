// PROTOTYPE idea/port-sortie (IMP-14): scripted checks that a fleet docked in a port no longer holds it against land forces.
//   node tools/port-sortie.js          the checks below; exit 1 if one fails
// 1. Tromsø (seed 2007, the nations world): 3 infantry ordered in from a neighbouring province against 1 docked frigate. Passes when the port falls
//    within 48 h, the frigate is then in a sea zone at morale <= 90, and no ship stands on land.
// 2. The same with 12 infantry, 4 tanks and 2 artillery (the hunters' case), and with 1 carrier.
// 3. Ground defenders still hold (a force falling back, on its way out, holds nothing: rules/combat.js index, as on master): a frigate with 1 infantry aboard (one force), and a frigate beside 1 infantry (two forces), against 12 infantry,
//    4 tanks and 2 artillery. The port must not fall while a ground unit of the defender stands in it; once the infantry is beaten it falls and the
//    frigate sails out. (3 infantry lose that fight and fall back: the port then stays held, as it should.)
// Plays the real rules files (no in-memory patch), in plain Node, like tools/headless.js.
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const XN = ['addArmy', 'setRel', 'removeEmpty', 'UT', 'navalCity', 'shipsOnly', 'groundN', 'count'];
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn {IM, X:{' + XN.map(n => `${n}: typeof ${n} === 'undefined' ? undefined : ${n}`).join(', ') + '}};';

// the port: Tromsø when it borders another nation's land, else the first naval city that does (seed 2007)
function setup(seed){ const R = new Function(SRC)(), api = R.IM.api, X = R.X;
  api.useScenario('world64'); api.newGame(seed, 0, Array.from({length:68}, (_, i) => i)); api.S.started = true;   // every nation a seat: no AI orders
  const S = api.S, G = api.G, foreignNb = P => P.nbs.find(w => !G.P[w].sea && S.owner[w] >= 0 && S.owner[w] !== S.owner[P.id]);
  const ok = P => X.navalCity(P.id) && S.owner[P.id] >= 0 && foreignNb(P) != null && P.nbs.some(v => G.P[v].sea);
  const P = G.P.find(P => ok(P) && /troms/i.test(P.cityName || P.name)) || G.P.find(ok);
  const p = P.id, q = foreignNb(P), B = S.owner[p], A = S.owner[q];
  X.setRel(A, B, 'war'); for (const b of S.armies.filter(b => b.at === p || b.at === q)) for (const t of X.UT) b.u[t] = 0; X.removeEmpty();
  return {R, api, X, S, G, p, q, A, B, nm:v => G.P[v].cityName || G.P[v].name}; }
const shipOnLand = (S, G, X) => S.armies.some(a => !a.air && X.count(a) && X.shipsOnly(a) && !G.P[a.at].sea && !X.navalCity(a.at));

let fails = 0; const out = [];
function check(name, ok, detail){ out.push(`${ok ? 'PASS' : 'FAIL'}  ${name}: ${detail}`); if (!ok) fails++; }

for (const [fleet, army, lim] of [[{frig:1}, {inf:3}, 48], [{frig:1}, {inf:12, tank:4, art:2}, 48], [{carr:1}, {inf:12, tank:4, art:2}, 48], [{frig:2}, {inf:2, tank:1}, 48]]){
  const {api, X, S, G, p, q, A, B, nm} = setup(2007), f = X.addArmy(B, p, fleet), a = X.addArmy(A, q, army); f.m = 100; api.orderMove(a, p);
  let h = 0, land = false; for (; h < 300 && S.owner[p] === B; h++){ api.tick(); land = land || shipOnLand(S, G, X); }
  const t = Object.keys(fleet)[0], fl = S.armies.includes(f) && X.count(f) ? `${f.u[t]} ${t} at ${nm(f.at)} (sea ${!!G.P[f.at].sea}), morale ${Math.round(f.m)}` : 'fleet gone';
  check(`${JSON.stringify(fleet)} docked at ${nm(p)} v ${JSON.stringify(army)} from ${nm(q)}`,
    S.owner[p] === A && h <= lim && !!G.P[f.at].sea && f.m <= 90 && !land, `${S.owner[p] === A ? 'taken after ' + h + ' h' : 'still held after ' + h + ' h'}; ${fl}; ship on land ${land}`); }

// ground defenders still hold the port: it falls only once none of the defender's ground units is left in it
for (const [label, mk] of [['frigate with 1 infantry aboard (one force)', (X, B, p) => [X.addArmy(B, p, {frig:1, inf:1})]],
                           ['frigate beside 1 infantry (two forces)', (X, B, p) => [X.addArmy(B, p, {frig:1}), X.addArmy(B, p, {inf:1})]]]){
  const {api, X, S, G, p, q, A, B, nm} = setup(2007); mk(X, B, p); const a = X.addArmy(A, q, {inf:12, tank:4, art:2}); api.orderMove(a, p);
  let h = 0, heldGround = 0, early = false; const gB = () => S.armies.filter(b => b.owner === B && b.at === p && b.to === null && !b.air).reduce((s, b) => s + X.groundN(b), 0);
  for (; h < 400 && S.owner[p] === B; h++){ const g0 = gB(); api.tick(); if (g0 > 0) heldGround++; if (S.owner[p] === A && gB() > 0) early = true; }
  const f = S.armies.find(b => b.owner === B && X.count(b) && X.shipsOnly(b) && !b.air), at = f ? `the frigate at ${nm(f.at)} (sea ${!!G.P[f.at].sea})` : 'no frigate left';
  check(`${label} at ${nm(p)} v 12 infantry, 4 tanks, 2 artillery`, !early && heldGround > 0 && S.owner[p] === A && (!f || !!G.P[f.at].sea),
    `${S.owner[p] === A ? 'taken after ' + h + ' h' : 'still held after ' + h + ' h'}; ${heldGround} h with a ground defender in it; taken with one still there ${early}; ${at}`); }

console.log(out.join('\n')); console.log(fails ? `${fails} FAILED` : 'ALL PASS'); process.exit(fails ? 1 : 0);
