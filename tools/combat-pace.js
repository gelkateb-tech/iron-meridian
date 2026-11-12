// Iron Meridian: how long do battles last (headless)? Two similar forces fight in one province; prints the hours until one side is destroyed or broken.
//   node tools/combat-pace.js                  today's rules (BATTLE_PACE in rules/combat.js)
//   PACE=0.25 node tools/combat-pace.js        the same with another BATTLE_PACE (the damage-per-hour multiplier; docs/COMBAT-PACE.md)
//   node tools/combat-pace.js --json           the results as JSON
// Columns: 'first loss' = hours until the first unit dies, 'half gone' = until one side is down to half of its health, 'ends' = until no fight is left in the province (one side destroyed, or broken and retreating).
// IM_ROOT=<folder> runs another copy of the game (a build from before the battle ticks: then one tick is a whole hour).
// Every nation is a seat that gives no orders, so only the two sides are on the map. Cases: n units a side (2, 5, 10, 20, 50, 100) in stacks of at most 10 of the
// same mixed stack (4 infantry, 2 tanks, 2 anti-tank, 1 artillery, 1 IFV) or of infantry only; in the open (a meeting battle in unowned land: no home soil, no cover),
// on plains, forest, mountains and in a city as an attack on a force holding it (home soil, cover; the attacker comes from up to three sides).
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
let SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
if (process.env.PACE) SRC = SRC.replace(/BATTLE_PACE = [0-9.]+,/, `BATTLE_PACE = ${+process.env.PACE},`);
SRC += '\nreturn {IM, get S(){ return S; }, get G(){ return G; }, setRel, addArmy, count, armyHP, effHP, orderMove, etaHours, tick:typeof tickQ === "function" ? tickQ : tick, quarters:typeof BATTLE_Q === "number" ? BATTLE_Q : 1, pace:typeof BATTLE_PACE === "number" ? BATTLE_PACE : 1, removeEmpty};';
const JSON_OUT = process.argv.includes('--json');
const MIX = {inf:4, tank:2, at:2, art:1, ifv:1}, INF = {inf:10};
const scale = (m, n) => { const o = {}; let left = n; const ks = Object.keys(m), tot = ks.reduce((s0, k) => s0 + m[k], 0); for (const k of ks){ o[k] = Math.round(m[k]*n/tot); left -= o[k]; } o[ks[0]] += left; return o; };
const stacks = (m, n) => { const out = []; for (let left = n; left > 0; left -= 10) out.push(scale(m, Math.min(10, left))); return out; };

function setup(kind){
  const R = new Function(SRC)(), api = R.IM.api;
  api.newGame(4242, 0, Array.from({length:15}, (_, i) => i)); const S = R.S, G = R.G; S.started = true;
  const land = v => !G.P[v].sea, of0 = v => S.owner[v] === 0, near0 = v => of0(v) || G.P[v].nbs.some(of0), city = kind === 'city';
  const P = G.P.find(q => land(q.id) && S.owner[q.id] === 1 && !!q.city === city && q.id !== S.nations[1].capital && q.nbs.some(of0) && q.nbs.filter(v => land(v) && near0(v) && v !== S.nations[1].capital).length >= 3);
  P.terrain = city ? 'urban' : kind === 'open' ? 'plains' : kind; P.river = new Set(); P.lat = 30;
  const sides = P.nbs.filter(v => land(v) && near0(v) && v !== S.nations[1].capital).sort((x, y) => of0(y) - of0(x)).slice(0, 3);
  for (const v of sides){ S.owner[v] = 0; S.home[v] = 0; }
  S.armies.length = 0; for (const q of S.queue) q.length = 0; for (let i = 0; i < S.cons.length; i++) S.cons[i] = null;
  S.bld[P.id].fort = 0; R.setRel(0, 1, 'war');
  if (kind === 'open'){ S.owner[P.id] = -1; S.home[P.id] = -1; }   // unowned land: both sides arrive as attackers, nobody has home soil
  return {R, S, G, p:P.id, sides};
}
function fight(kind, n, mix, ratio = 1){
  const {R, S, p, sides} = setup(kind), mixes = stacks(mix, n), open = kind === 'open', dmix = ratio === 1 ? mixes : stacks(mix, Math.max(1, Math.round(n/ratio)));
  const D = dmix.map(m => R.addArmy(1, p, {...m})), A = mixes.map((m, i) => R.addArmy(0, open ? p : sides[i % Math.min(3, sides.length)], {...m}));
  if (!open){ for (const a of A){ R.orderMove(a, p); a.path = [p]; a.forced = true; } const slow = Math.max(...A.map(a => R.etaHours(a))); for (const a of A) a.delay = slow - R.etaHours(a); }
  const n0 = L => L.reduce((s0, a) => s0 + R.count(a), 0), hp0 = L => L.reduce((s0, a) => s0 + R.armyHP(a), 0), A0 = n0(A), D0 = n0(D), hpA = hp0(A), hpD = hp0(D);
  const T = () => S.hour + (S.q || 0)/R.quarters, eh0 = L => L.reduce((s0, a) => s0 + (R.count(a) > 0 ? R.effHP(a) : 0), 0); let t0 = -1, t1 = -1, th = -1, tl = -1;
  for (let i = 0; i < 24*30*R.quarters; i++){ R.tick(); if (t0 < 0 && S.battles.includes(p)) t0 = T() - 1/R.quarters;
    if (t0 >= 0){ if (th < 0 && Math.min(eh0(A)/hpA, eh0(D)/hpD) <= 0.5) th = T() - t0; if (tl < 0 && (n0(A) < A0 || n0(D) < D0)) tl = T() - t0; }
    if (t0 >= 0 && !S.battles.includes(p)){ t1 = T(); break; } }
  const eh = L => L.reduce((s0, a) => s0 + (R.count(a) > 0 ? R.effHP(a) : 0), 0), holds = L => L.some(a => R.count(a) > 0 && a.at === p && a.to === null);
  return {kind, n, ratio, mix:mix === INF ? 'infantry' : 'mixed', half:th < 0 ? null : +th.toFixed(2), first:tl < 0 ? null : +tl.toFixed(2), hours:t0 >= 0 && t1 >= 0 ? +(t1 - t0).toFixed(2) : null, winner:holds(A) && !holds(D) ? 'attacker' : holds(D) && !holds(A) ? 'defender' : 'none', atkLeft:Math.round(eh(A)/hpA*100), defLeft:Math.round(eh(D)/hpD*100), lost:[A0 - n0(A), D0 - n0(D)]};
}
const rows = [];
for (const kind of ['open', 'plains', 'forest', 'mountain', 'city']) for (const mix of [MIX, INF]) for (const ratio of [1, 2, 3]) for (const n of [2, 5, 10, 20, 50, 100]){
  if (mix === INF && !['open', 'mountain'].includes(kind)) continue; if (ratio > 1 && (n < 5 || !['plains', 'city'].includes(kind) || mix === INF)) continue;
  try { rows.push(fight(kind, n, mix, ratio)); } catch (e){ rows.push({kind, n, ratio, mix:mix === INF ? 'infantry' : 'mixed', error:e.message}); } }
if (JSON_OUT){ console.log(JSON.stringify(rows)); process.exit(0); }
const pace = new Function(SRC)().pace;
console.log(`Battle length, hours (BATTLE_PACE ${pace}, ${new Function(SRC)().quarters} battle step(s) per hour). n = units a side.`);
console.log('place'.padEnd(10) + 'mix'.padEnd(10) + 'atk:def'.padEnd(9) + 'n atk'.padEnd(6) + 'first loss'.padEnd(12) + 'half gone'.padEnd(11) + 'ends'.padEnd(8) + 'winner'.padEnd(10) + 'atk left'.padEnd(10) + 'def left'.padEnd(10) + 'lost (atk/def)');
for (const r of rows) console.log(r.error ? `${r.kind} ${r.n} ${r.error}` : r.kind.padEnd(10) + r.mix.padEnd(10) + `${r.ratio}:1`.padEnd(9) + String(r.n).padEnd(6) + String(r.first).padEnd(12) + String(r.half).padEnd(11) + String(r.hours).padEnd(8) + r.winner.padEnd(10) + `${r.atkLeft}%`.padEnd(10) + `${r.defLeft}%`.padEnd(10) + r.lost.join('/'));
