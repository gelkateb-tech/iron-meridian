// Hostile columns meet and fight (owner 2026-11-25, point 1: "Enemy units pass each other without fighting. They should meet and fight"),
// checked in plain Node with no browser: node .test/columns-meet.js (IM_ROOT=<tree> to check another tree)
// Each case sets up two forces at war on the nations world (the United States against Canada: Bemidji -> Winnipeg, a 10-hour leg) and runs
// the game hour by hour until the two stand in a battle together, or one is destroyed (FOUGHT), or 40 hours pass (PASSED). Every case must fight:
//  1-3e   head-on on one road: the same hour, tanks against infantry, the second column setting off when the first is 60/75/90/92% along (the
//         first arrives the hour they cross)
//  4, 5   the enemy leaves Winnipeg for Thompson the hour our column arrives there (both orders of the force list)
//  7      overtaking: tanks catch enemy infantry on the same road
//  8      head-on, our column sent to an exact point in Winnipeg beyond its centre
//  9      the enemy enters the province our column is leaving
//  10-10c two fleets head-on between two sea zones (the same hour; the second setting off at 85% and 95%)
// and the rest of the rule:
//  W      withdrawal still works: a force fighting in Winnipeg ordered back home leaves, and is not pulled back by the enemy it was fighting
//  K      a column that meets the enemy in the province it was going to keeps its order: once it has won it walks on to the centre and takes it
//  P      forces of nations at peace pass each other (no meeting)
//  1s, 7s where the two stand once met: apart (20 km), in the province they fight in, each on the side it came from
//  S      troops sailing into an enemy port meet a fleet coming out of it on the water: they are still aboard (no landing, as B2.4)
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
function load(){ globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
  return new Function("'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn {IM, ev: s => eval(s)};')(); }
const L = load(), api = L.IM.api, ev = L.ev, count = ev('count'), addArmy = ev('addArmy');
const errors = [], info = {}, ok = (c, msg, v) => { if (!c) errors.push(msg + (v !== undefined ? ' ' + JSON.stringify(v) : '')); };
api.useScenario('world64');
const SEAT = 0;
function fresh(){ api.newGame(12345, 0, [SEAT]); const S = api.S, G = api.G; S.started = true; return {S, G}; }
// a province u of the seat with a foreign neighbour v (4-12 h away on foot) and v's neighbour w (of the same nation, not next to u)
function pick(S, G){ const lh = (u, v) => ev('legHours')({owner:SEAT, u:{inf:1}, w:{}, m:80}, u, v);
  for (let u = 0; u < G.P.length; u++){ if (G.P[u].sea || S.owner[u] !== SEAT) continue;
    for (const v of G.P[u].nbs){ const Q = S.owner[v]; if (G.P[v].sea || Q < 0 || Q === SEAT) continue; const h = lh(u, v); if (!(h >= 4 && h <= 12)) continue;
      for (const w of G.P[v].nbs) if (w !== u && !G.P[w].sea && S.owner[w] === Q && !G.P[u].nbs.includes(w)) return {u, v, w, Q}; } }
  return null; }
const clear = (S, ps) => { for (const a of S.armies) if (ps.has(a.at) && !a.air) for (const t in a.u) a.u[t] = 0; ev('removeEmpty')(); };
// run case `build` (it returns {pair:[A, B], each(h)}): FOUGHT when the two stand in a battle together or one is destroyed
function run(id, build, {war = true, hours = 40} = {}){
  const {S, G} = fresh(), r = pick(S, G); if (!r){ errors.push(id + ': no provinces'); return null; }
  const {u, v, w, Q} = r; S.nations[Q].ai = false; if (war) api.declareWar(SEAT, Q);
  clear(S, new Set([u, v, w, ...G.P[u].nbs, ...G.P[v].nbs, ...G.P[w].nbs]));
  const msgs = []; L.IM.on('log', (...a) => { const s = a.map(String).join(' '); if (/Columns clash/.test(s)) msgs.push(S.hour); });
  const F = build({S, G, u, v, w, Q}); let res = 'PASSED', h = 0;
  for (; h < hours; h++){ if (F.each) F.each(h); api.tick(); const [a, b] = F.pair;
    if (!count(a) || !count(b) || (a.to === null && b.to === null && a.at === b.at && S.battles.includes(a.at))){ res = 'FOUGHT'; if (!F.stop) break; }
    if (F.stop && F.stop()) break; }   // (stop: a case that runs on after the fight, until stop() says)
  info[id] = `${res} h${S.hour} clash msgs ${msgs.length}`;
  return {res, S, G, u, v, w, Q, F, msgs}; }
const fought = (id, build, o) => { const R = run(id, build, o); if (R) ok(R.res === 'FOUGHT', `${id}: the two columns must meet and fight`, info[id]); return R; };
const headOn = (A0, B0, at = null) => c => { const A = addArmy(SEAT, c.u, A0), B = addArmy(c.Q, c.v, B0); api.orderMove(A, c.v); let go = at === null;
  if (go) api.orderMove(B, c.u); return {pair:[A, B], each(){ if (!go && A.to !== null && A.t >= at){ go = true; api.orderMove(B, c.u); } }}; };
fought('1 head-on, same hour', headOn({inf:3}, {inf:3}));
fought('2 head-on, tanks against infantry', headOn({tank:3}, {inf:3}));
fought('3 head-on, B sets off at 60%', headOn({inf:3}, {inf:3}, 0.6));
fought('3b head-on, B sets off at 85%', headOn({inf:3}, {inf:3}, 0.85));
fought('3c head-on, tanks; B sets off at 75%', headOn({tank:3}, {inf:3}, 0.75));
fought('3d head-on, B sets off at 92% (A arrives the hour they cross)', headOn({inf:3}, {inf:3}, 0.92));
fought('3e head-on, tanks; B sets off at 83%', headOn({tank:3}, {inf:3}, 0.83));
const leaves = first => c => { const mk = () => [addArmy(SEAT, c.u, {inf:3}), addArmy(c.Q, c.v, {inf:3})]; let A, B; if (first){ [A, B] = mk(); } else { B = addArmy(c.Q, c.v, {inf:3}); A = addArmy(SEAT, c.u, {inf:3}); }
  api.orderMove(A, c.v); let go = false; return {pair:[A, B], each(){ if (!go && A.to !== null && A.t + 1/ev('legH')(A) >= 1){ go = true; api.orderMove(B, c.w); } }}; };
fought('4 the enemy leaves v as A arrives (B first in the list)', leaves(false));
fought('5 the enemy leaves v as A arrives (A first in the list)', leaves(true));
fought('7 overtaking on one road', c => { const B = addArmy(c.Q, c.u, {inf:3}); B.to = c.v; B.t = 0.2; const A = addArmy(SEAT, c.u, {tank:3}); api.orderMove(A, c.v); api.orderMove(B, c.w); return {pair:[A, B]}; });
fought('8 head-on, A to an exact point in v', c => { const A = addArmy(SEAT, c.u, {inf:3}), B = addArmy(c.Q, c.v, {inf:3}), P = c.G.P[c.v], U = c.G.P[c.u];
  api.orderMove(A, c.v, [P.x + (P.x - U.x)*0.3, P.y + (P.y - U.y)*0.3]); api.orderMove(B, c.u); return {pair:[A, B]}; });
fought('9 the enemy enters the province A is leaving', c => { const A = addArmy(SEAT, c.u, {inf:3}); api.orderMove(A, c.v); const n = c.G.P[c.u].nbs.find(x => x !== c.v && !c.G.P[x].sea);
  const B = addArmy(c.Q, n, {tank:3}); api.orderMove(B, c.u); return {pair:[A, B]}; });
const seaPair = c => { const {G, S} = c; for (const P of G.P){ if (!P.sea) continue; const q = P.nbs.find(x => G.P[x].sea); if (q != null && ev('legHours')({owner:SEAT, u:{frig:1}, w:{}, m:80}, P.id, q) > 5) return [P.id, q]; } return null; };
const seaHead = at => c => { const [s1, s2] = seaPair(c); clear(c.S, new Set([s1, s2])); const A = addArmy(SEAT, s1, {frig:2}), B = addArmy(c.Q, s2, {frig:2}); api.orderMove(A, s2); let go = at === null;
  if (go) api.orderMove(B, s1); return {pair:[A, B], each(){ if (!go && A.to !== null && A.t >= at){ go = true; api.orderMove(B, s1); } }}; };
fought('10 fleets head-on, same hour', seaHead(null));
fought('10b fleets head-on, B sets off at 85%', seaHead(0.85));
fought('10c fleets head-on, B sets off at 95%', seaHead(0.95));
// where they stand once met (meetSpots): apart in the province they met in, each on the side it came from, so neither counter covers the other
// (head-on, and overtaking: the faster column stands behind the one it caught)
for (const [id, build] of [['1s head-on: where the two stand', headOn({inf:3}, {inf:3})], ['7s overtaking: where the two stand', c => { const B = addArmy(c.Q, c.u, {inf:3}); B.to = c.v; B.t = 0.2;
    const A = addArmy(SEAT, c.u, {tank:3}); api.orderMove(A, c.v); api.orderMove(B, c.w); return {pair:[A, B]}; }]]){
  const R = fought(id, build); if (!R || R.res !== 'FOUGHT') continue; const [A, B] = R.F.pair, U = R.G.P[R.u], KM = ev('KM_W'), pv = ev('provOfPt');
  if (!count(A) || !count(B)) continue; const d = q => Math.hypot(q[0] - U.x, q[1] - U.y);
  ok(A.pos && B.pos && Math.hypot(A.pos[0] - B.pos[0], A.pos[1] - B.pos[1])/KM >= 15, id + ': the two stand apart', A.pos && B.pos && Math.hypot(A.pos[0] - B.pos[0], A.pos[1] - B.pos[1])/KM);
  ok(A.pos && B.pos && pv(A.pos[0], A.pos[1]) === A.at && pv(B.pos[0], B.pos[1]) === B.at, id + ': both stand in the province they fight in');
  ok(A.pos && B.pos && d(A.pos) < d(B.pos), id + ': each on the side it came from'); }
// W: withdrawal. A and B fight in v; A is ordered home and leaves (B stays): A is not pulled back
{ const R = run('W withdrawal', c => { const A = addArmy(SEAT, c.v, {inf:4}), B = addArmy(c.Q, c.v, {inf:4}); A.pos = [c.G.P[c.v].x, c.G.P[c.v].y];
    let ordered = false; return {pair:[A, B], each(h){ if (h === 2 && !ordered){ ordered = true; api.orderMove(A, c.u); } }, stop(){ return false; }}; }, {hours:24});
  if (R){ const [A] = R.F.pair; ok(count(A) > 0 && A.at === R.u && A.to === null, 'W: a force withdrawing from a battle gets home', {at:R.G.P[A.at].name, to:A.to}); } }
// K: our strong column meets a weak enemy column in Winnipeg, the province it was going to: it wins, walks on to the centre and takes it
{ const R = run('K keeps its order in the province it was going to', c => { const A = addArmy(SEAT, c.u, {tank:6, inf:4}), B = addArmy(c.Q, c.v, {inf:1}); api.orderMove(A, c.v); let go = false;
    return {pair:[A, B], each(){ if (!go && A.to !== null && A.t >= 0.75){ go = true; api.orderMove(B, c.u); } }, stop(){ return false; }}; }, {hours:40});
  if (R){ ok(R.msgs.length > 0, 'K: the two columns met (a clash dispatch)', R.msgs); ok(R.S.owner[R.v] === SEAT, 'K: after winning, the column walks on to the centre and takes the province', {owner:R.S.owner[R.v]}); } }
// P: at peace, columns pass
{ const R = run('P at peace', headOn({inf:3}, {inf:3}), {war:false, hours:14}); if (R) ok(R.res === 'PASSED' && !R.msgs.length, 'P: forces of nations at peace pass each other', info['P at peace']); }
// S: our troops sail into an enemy naval city as its fleet sails out: they meet on the water, still aboard
{ const {S, G} = fresh(); let T = null;
  for (const P of G.P){ const Q = S.owner[P.id]; if (P.sea || Q < 0 || Q === SEAT || !ev('navalCity')(P.id)) continue; const s = P.nbs.find(x => G.P[x].sea); if (s != null){ T = {p:P.id, s, Q}; break; } }
  ok(!!T, 'S: found an enemy naval city');
  if (T){ S.nations[T.Q].ai = false; api.declareWar(SEAT, T.Q); clear(S, new Set([T.p, T.s, ...G.P[T.s].nbs]));
    const A = addArmy(SEAT, T.s, {inf:3, frig:1}), B = addArmy(T.Q, T.p, {frig:3}); api.orderMove(A, T.p); api.orderMove(B, T.s); let met = false;
    for (let h = 0; h < 30 && !met; h++){ api.tick(); if (A.to === null && B.to === null && A.at === B.at) met = true; if (!count(A) || !count(B)) break; }
    ok(met && G.P[A.at].sea, 'S: the troops and the fleet meet on the water', {at:G.P[A.at].name}); ok(!(A.land > 0) && A.landed == null, 'S: the troops are still aboard (no landing started)', {land:A.land, landed:A.landed}); } }
console.log(JSON.stringify({info, errors}, null, 1));
process.exit(errors.length ? 1 : 0);
