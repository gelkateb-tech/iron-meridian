// Battle ticks (owner request 4): battles resolve every 15 game minutes. node .test/battle-tick.js  (rules only, no browser)
const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..');
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn {IM, get S(){ return S; }, get G(){ return G; }, addArmy, setRel, effHP, count, tickQ, tick, BATTLE_Q, BATTLE_PACE, healInfo, healPerDay, armyStrength, restore, saveJSON, stackPenalty};';
const errors = [], checks = {}, ok = (k, v, i) => { checks[k] = v ? 'PASS' : 'FAIL ' + JSON.stringify(i ?? null); };
function game(){ const R = new Function(SRC)(); R.IM.api.newGame(77, 0, [0]); R.S.started = true; return R; }
const R = game(), S = R.S, G = R.G;
ok('four steps an hour, S.q starts at 0', R.BATTLE_Q === 4 && S.q === 0, [R.BATTLE_Q, S.q]);
const h0 = S.hour, seen = []; for (let i = 0; i < 8; i++){ R.tickQ(); seen.push(S.q + ':' + S.hour); }
ok('three battle-only steps then the hour tick', seen.join() === `1:${h0},2:${h0},3:${h0},0:${h0 + 1},1:${h0 + 1},2:${h0 + 1},3:${h0 + 1},0:${h0 + 2}`, seen);
const h1 = S.hour; R.tick(); ok('tick() is one whole hour', S.hour === h1 + 1 && S.q === 0);
// a fight: health falls at every step, the whole hour's loss is about what one hourly step dealt
const P = G.P.find(q => !q.sea && S.owner[q.id] === 1 && !q.city && q.nbs.length), p = P.id; S.rel['0,1'] = S.rel['0,1'] || {}; R.setRel(0, 1, 'war');
for (const a of S.armies.slice()) if (a.at === p) for (const t in a.u) a.u[t] = 0;
const A = R.addArmy(0, p, {inf: 8, tank: 4}), D = R.addArmy(1, p, {inf: 8, tank: 4}); R.tick();
const hp = []; for (let i = 0; i < 8; i++){ R.tickQ(); hp.push(Math.round(R.effHP(A) + R.effHP(D))); }
ok('both sides lose health at every 15 minute step', hp.every((v, i) => i === 0 || v < hp[i - 1]), hp);
const hr = hp[3] - hp[7]; ok('about the same total per hour as one step a quarter at a time (no step deals the whole hour)', (hp[0] - hp[1]) < hr*0.5, [hp, hr]);
ok('an old save without S.q restores to 0', (() => { const o = JSON.parse(R.saveJSON()); delete o.q; const r = R.restore(o); return r && R.S.q === 0; })());
// deterministic
const sig = () => { const g = game(); for (let i = 0; i < 24*6; i++) g.IM.api.tickQ(), g.IM.api.tickQ(), g.IM.api.tickQ(), g.IM.api.tickQ(); return g.IM.api.saveJSON().length + ':' + g.S.rs; };
ok('deterministic', sig() === sig());
// healing: slow in the field, faster in an own city, none while fighting
const g2 = game(), S2 = g2.S, G2 = g2.G, city = S2.nations[0].capital, field = G2.P.find(q => !q.sea && S2.owner[q.id] === 0 && !q.city).id;
const c1 = g2.addArmy(0, city, {inf: 5}), f1 = g2.addArmy(0, field, {inf: 5}); c1.w.inf = 10; f1.w.inf = 10;
ok('healing rates', g2.healPerDay(c1) === 0.25 && g2.healPerDay(f1) === 0.10 && g2.healInfo(c1).kind === 'heal' && g2.healInfo(c1).city, [g2.healPerDay(c1), g2.healPerDay(f1)]);
const X = g2.armyStrength(c1); ok('strength table: ten rows, base and current', X.rows.length === 10 && X.rows[0].atk.base > 0 && X.rows[0].def.cur > X.rows[0].def.base - 1e-9, X.rows.map(r => r.k));
console.log(JSON.stringify({ checks, errors }, null, 1)); process.exit(Object.values(checks).some(v => v !== 'PASS') ? 1 : 0);
