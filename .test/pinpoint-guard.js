// PINPOINT GUARD (owner 2026-11-27, playtest item 1: "setting a waypoint still moves the army to the centre of the province, not the exact spot
// I tapped. This is the third time pinpoint movement has broken ... add a test to the standard checks so it can't silently break again").
// One of the standard checks (BUILD.md "Standard checks", tools/checks.sh). It plays on a map that has forces on it, as a real game does: the
// earlier tests (.test/pinpoint.js, .test/waypoints.js) empty the map first, so they never had a force of yours standing at the city of the
// province the spot lies in, and that is where it broke: the arrival join (rules/tick.js) merged a force sent to a spot into any idle force of
// its own within about 50 km, which kept its own place, the city; and a tap on water with the Waypoint button on deselected the fleet.
// Round 2 (review of PINPOINT-3): the arrival join still took everything within JOIN_R (1 world unit, about 9 km) of a garrison, so at the
// closest zoom a tap 7 to 9 km from a city of yours (16 to 20 px from its mark, outside index.html byCity's 16 px) ended in the garrison, as
// did a halt that close; and this guard played only the classic world. JOIN_R is now 0.1 km (the very spot), a tap on or by a force of yours
// goes to its spot (index.html byForce), and both parts play the nations world players play as well as the classic world of the old saves.
// Part 1, the rules in plain Node, the real start (every province with its starting garrison at the city), the nations world (nations.js,
// Germany's seat) and the classic world (the United States' seat; fewer cases):
//   a plain move, a first waypoint and a middle waypoint to a spot 15, 30 and 45 km from a garrisoned city end exactly there (the force is not
//   swallowed by the garrison, the garrison stays as it was); a plan of stops through two garrisoned provinces passes each stop exactly; moves
//   and waypoints to spots 2, 4, 6 and 8 km from a garrisoned city, and a halt 1 to 8 km from one, stay on their spot; a fleet with two stops on
//   water ends exactly on the last one beside a fleet of yours; a spot on the city itself still joins the garrison there, one on the very spot
//   of a force of yours joins it, one 4 km off it does not; an order to the centre does not join a force standing on a spot away from the city;
//   a join order walks to the other force's spot and merges there, not at the border; a save made mid-plan, and an old save made by
//   origin/master with moves, stops and walks in flight (.test/fixtures/pinpoint-oldsave.json), load and go on to the exact spots.
//   A group of three forces sent by Move, or Waypoint with two stops, to one spot ends there as one force (two when the stack limit splits it).
// Part 2, the page (Playwright), a player's taps, Germany's real start, at phone size (440 x 900, touch) and desktop size (1440 x 900, mouse) in
// the nations world (page.html?start=nations), and on the desktop in the classic world:
//   Move and a tap 25-45 km from a garrisoned neighbour city; Waypoint and two taps through garrisoned provinces; a fleet with Waypoint and two
//   taps on water; troops in a port, Waypoint and a tap at sea (a stop at sea); Move and a tap on the city itself (it joins the garrison); at the
//   closest zoom Move and Waypoint taps 17 px from the garrisoned city's mark, Move 4 px from a force of yours (it joins it) and 24 px off it (it
//   stands apart); on the desktop a counter dragged onto a spot by a garrisoned city, and a save and load mid-plan. Each ends on the tapped spot.
//   Round 3: a group of three selected together, Move and a tap, Waypoint and two taps: every force ends on the tapped spot, joined there
//   (index.html sendToTarget and stopTap sent the others 43 to 52 km round it, and with the join on the very spot they stayed apart).
//   node .test/pinpoint-guard.js [--rules]   (part 2 needs bash tools/mkpage.sh; exit 1 on any failed check or error, each FAIL says what broke)
//   node .test/pinpoint-guard.js --make-fixture <checkout>   (writes the old-save fixture with the rules of that checkout: origin/master 9f01407)
const fs = require('fs'), path = require('path');
const MAKE = process.argv.indexOf('--make-fixture'), ROOT = MAKE > 0 ? path.resolve(process.argv[MAKE + 1]) : path.join(__dirname, '..');
const FIX = path.join(__dirname, 'fixtures', 'pinpoint-oldsave.json');
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); if (fs.existsSync(path.join(ROOT, 'nations.js'))) require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));   // (the nations world, as players play it; the classic world of the old saves too)
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + `\nreturn {IM, get S(){ return S; }, get G(){ return G; }, addArmy, tick, restore, saveJSON,
  orderMove, addStop, stopsOf, haltArmy, armyXY, armyById, provOfPt, cellCenter, count, shipsOnly, KM_W, JOIN_R, get POWERS(){ return POWERS; }, resetVis(){ visCache = null; }};`;
const errors = [], checks = {}, log = [], ok = (k, v, i) => { checks[k] = v ? 'PASS' : 'FAIL ' + JSON.stringify(i ?? null); log.push(`${v ? 'PASS' : 'FAIL'}  ${k}${v ? '' : '\n      ' + JSON.stringify(i ?? null)}`); };
const run = (k, f) => { try { f(); } catch (e){ errors.push(k + ': ' + e.stack.split('\n').slice(0, 3).join(' | ')); } };
const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const idle = a => a.to === null && !a.path.length && !a.sail;
// the real start of a world, every province of a nation with its starting garrison standing at the city: the nations world as players play it
// (W 'nations', Germany's seat, as in the page part) or the classic 15-power world of the old saves (the default, seat 0, the United States:
// the old-save fixture was made with it)
function game(W = 'classic'){ const R = new Function(SRC)(); R.IM.api.useScenario(W === 'nations' ? 'world64' : 'world');
  R.IM.api.newGame(77, W === 'nations' ? R.POWERS.findIndex(N => N.name === 'Germany') : 0, [0]); R.me = 0; R.S.started = true; R.resetVis(); return R; }   // (the power picked is the seat, nation 0)
const garrisons = (R, n) => R.S.armies.filter(a => a.owner === n && !a.air && !a.fly && R.count(a) && !R.shipsOnly(a) && !a.pos && idle(a));
// a spot of land province B at km from its city, well inside B (1.5 world units, about 13 km, of B all round it)
function spotAt(R, B, km, k0 = 0){ const { G } = R; for (let i = 0; i < 24; i++){ const an = ((i + k0) % 24)*Math.PI/12, w = [B.x + Math.cos(an)*km*R.KM_W, B.y + Math.sin(an)*km*R.KM_W];
    if ([[0, 0], [1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]].every(([dx, dy]) => R.provOfPt(w[0] + dx, w[1] + dy) === B.id)) return w; } return null; }
// a starting garrison gB at the city of own land province B; own land province A next to it (where the force is sent from) and own land
// province C next to B (its starting garrison gC, or one put there as at the start: at the city, no spot), with spots in B and C at km from
// their cities
function scene(R, n, km, used = null){ const { G, S } = R, gs = garrisons(R, n), own = p => !G.P[p].sea && S.owner[p] === n;
  for (const gB of gs){ if (used && used.has(gB.at)) continue; const B = G.P[gB.at], wB = spotAt(R, B, km); if (!wB) continue; const nb = [...B.nb.keys()].filter(own);
    for (const c of nb){ const wC = spotAt(R, G.P[c], km, 6), A = nb.find(v => v !== c); if (!wC || A == null) continue;
      const gC = gs.find(g => g.at === c) || R.addArmy(n, c, { inf: 2 }); return { A, B: B.id, gB, wB, C: c, gC, wC }; } }
  return null; }
const tickTill = (R, f, n = 600) => { for (let i = 0; i < n && !f(); i++) R.tick(); return f(); };
// plays until the force has no order left, recording each spot it stood still on (a stop): [{p, pos}]
function play(R, a, n = 600){ const st = []; for (let i = 0; i < n; i++){ R.tick(); if (!R.S.armies.includes(a) || !R.count(a)) return { gone: true, st, hour: i };
    if (idle(a) && a.pos && !(st.length && d(st[st.length - 1].pos, a.pos) < 1e-9)) st.push({ p: a.at, pos: a.pos.slice() }); if (idle(a) && !a.wp) break; } return { gone: false, st }; }
const gar = g => ({ n: g.n0, pos: g.pos }), same = (R, g, n0) => R.S.armies.includes(g) && R.count(g) === n0 && !g.pos;
const place = (R, p) => R.G.P[p].cityName || R.G.P[p].name;

if (MAKE > 0){ makeFixture(); return; }
let page = !process.argv.includes('--rules');

function rulesPart(W){ const T = W === 'nations' ? '' : 'classic world: ';
// 1. a plain move, a first waypoint and a middle waypoint to a spot 15, 30, 45 km from a garrisoned city of yours
for (const km of W === 'nations' ? [15, 30, 45] : [30]) for (const kind of ['move', 'waypoint', 'middle waypoint']) run(`${T}${kind} ${km}`, () => {
  const R = game(W), S = R.S, n = R.me, sc = scene(R, n, km); ok(`${T}${kind} ${km}: found a garrisoned province with a spot ${km} km from its city`, !!sc); if (!sc) return;
  const a = R.addArmy(n, sc.A, { inf: 2, tank: 1 }), nB = R.count(sc.gB), nC = R.count(sc.gC);
  if (kind === 'move') R.orderMove(a, sc.B, sc.wB); else { R.addStop(a, sc.B, sc.wB); if (kind === 'middle waypoint') R.addStop(a, sc.C, sc.wC); }
  const last = kind === 'middle waypoint' ? sc.wC : sc.wB, r = play(R, a);
  ok(`${T}${kind}, ${km} km from the city of ${place(R, sc.B)}: the force is not swallowed by the garrison at the city (rules/tick.js arrival join)`, !r.gone, { gone: r.gone, hour: r.hour, garrison: R.count(sc.gB), was: nB });
  if (r.gone) return;
  ok(`${T}${kind}, ${km} km: it ends exactly on its ${kind === 'middle waypoint' ? 'last stop' : 'spot'}, not the centre`, d(a.pos, last) < 1e-6 && a.at === (kind === 'middle waypoint' ? sc.C : sc.B), { pos: a.pos, want: last, at: a.at, centre: [R.G.P[a.at].x, R.G.P[a.at].y] });
  if (kind === 'middle waypoint') ok(`${T}middle waypoint, ${km} km: it stood on the middle stop exactly, and kept the rest of its plan`, r.st.some(q => q.p === sc.B && d(q.pos, sc.wB) < 1e-6), r.st);
  ok(`${T}${kind}, ${km} km: the garrisons stay as they were, at their cities`, same(R, sc.gB, nB) && same(R, sc.gC, nC), { gB: R.count(sc.gB), nB, gC: R.count(sc.gC), nC }); });

// 2. a fleet: two stops on water, a fleet of yours idle in each zone near the stop (the same join rule applies to ships)
run(T + 'fleet', () => { const R = game(W), S = R.S, G = R.G, n = R.me;
  const big = v => G.P[v].sea && G.P[v].cells.length > 80, port = G.P.find(P => !P.sea && S.owner[P.id] === n && [...P.nb.keys()].some(v => big(v) && [...G.P[v].nb.keys()].some(big)));   // (the nations world's zones are smaller)
  const z1 = port && G.P[[...port.nb.keys()].find(v => big(v) && [...G.P[v].nb.keys()].some(big))], z2 = z1 && G.P[[...z1.nb.keys()].filter(big).sort((u, v) => G.P[v].cells.length - G.P[u].cells.length)[0]];
  ok(T + 'found two big sea zones by a port of yours', !!z2); if (!z2) return;
  const wat = (Z, k) => { const cs = Z.cells.map(c => R.cellCenter(c)).filter(q => R.provOfPt(q[0], q[1]) === Z.id && d(q, [Z.x, Z.y]) > 3 && d(q, [Z.x, Z.y]) < 9); return cs[k % cs.length]; };
  const w1 = wat(z1, 0), w2 = wat(z2, 3), f = R.addArmy(n, z1.id, { frig: 2 }), k1 = R.addArmy(n, z1.id, { crui: 1 }), k2 = R.addArmy(n, z2.id, { crui: 1 });   // (k1, k2: at the zones' centres, 3 to 9 world units off the stops)
  f.pos = [z1.x, z1.y]; f.lastAt = z1.id; f.from = z1.id; R.addStop(f, z1.id, w1); R.addStop(f, z2.id, w2);
  ok(T + 'a fleet takes two stops on water', R.stopsOf(f).length === 2, R.stopsOf(f)); const r = play(R, f);
  ok(T + 'the fleet is not swallowed by the fleets at the zones\' centres', !r.gone && R.count(k1) === 1 && R.count(k2) === 1, { gone: r.gone, k1: R.count(k1), k2: R.count(k2) });
  if (!r.gone) ok(T + 'it stood on the first stop exactly and ends exactly on the second, on water', r.st.some(q => q.p === z1.id && d(q.pos, w1) < 1e-6) && f.at === z2.id && d(f.pos, w2) < 1e-6, { st: r.st, w1, w2 }); });

// 3. still joined, and only there: a spot on the city itself (a tap on or by the city goes there: index.html byCity) joins the garrison standing
// there; a spot on the very point of a force of yours (a tap on or by it goes there: index.html byForce) joins it, which stays on its spot; one
// 0.5 world units (about 4 km) off stands apart, on its own spot
run(T + 'joins', () => { const R = game(W), S = R.S, G = R.G, n = R.me, sc = scene(R, n, 30); if (!sc) return; const B = G.P[sc.B], nB = R.count(sc.gB);
  const a = R.addArmy(n, sc.A, { inf: 2 }); R.orderMove(a, sc.B, [B.x, B.y]); tickTill(R, () => !S.armies.includes(a) || !R.count(a) || (idle(a) && R.count(sc.gB) > nB));
  ok(T + 'a force sent to the city itself joins the garrison there', R.count(sc.gB) === nB + 2 && !sc.gB.pos, { garrison: R.count(sc.gB), was: nB });
  const b = R.addArmy(n, sc.A, { inf: 1 }); R.orderMove(b, sc.B, sc.wB); play(R, b); const c = R.addArmy(n, sc.A, { inf: 1 }); R.orderMove(c, sc.B, sc.wB.slice()); play(R, c);
  ok(T + 'a force sent to the very spot of a force of yours joins it, which stays on its spot', R.count(b) === 2 && d(b.pos, sc.wB) < 1e-9 && (!S.armies.includes(c) || !R.count(c)), { b: R.count(b), pos: b.pos, c: R.count(c) });
  const e = R.addArmy(n, sc.A, { inf: 1 }), we = [sc.wB[0] + 0.4, sc.wB[1] + 0.3]; R.orderMove(e, sc.B, we); play(R, e);
  ok(T + 'one sent 0.5 world units (about 4 km) off it stands apart on its own spot', S.armies.includes(e) && R.count(e) === 1 && d(e.pos, we) < 1e-6 && R.count(b) === 2, { n: R.count(e), pos: e.pos, we, b: R.count(b) });
  // an order with no point (the province's centre, as the computer's and the Armies list's are) where your only force there stands on a spot
  // away from the city: it arrives at the city and stays there (it joined that force before, and ended on its spot)
  const g2 = sc.gC, wC = sc.wC; g2.pos = wC.slice(); const n2 = R.count(g2), f = R.addArmy(n, sc.B, { inf: 1 }); f.from = sc.B; f.lastAt = sc.B; R.orderMove(f, sc.C); play(R, f);
  ok(T + 'a force sent to the centre where a force of yours stands on a spot away from the city stays at the city', S.armies.includes(f) && R.count(f) === 1 && f.at === sc.C && !f.pos && R.count(g2) === n2 && d(g2.pos, wC) < 1e-9, { f: R.count(f), at: f.at, pos: f.pos, g2: R.count(g2), n2 }); });

// 4. a join order (a counter dragged onto another: index.html joinForces) walks to the other force's spot and merges there, not at the border
run(T + 'join order', () => { const R = game(W), S = R.S, n = R.me, sc = scene(R, n, 30); if (!sc) return; const nB = R.count(sc.gB), t = R.addArmy(n, sc.B, { inf: 1 }); t.pos = sc.wB.slice(); t.from = sc.B; t.lastAt = sc.B;
  const a = R.addArmy(n, sc.A, { inf: 2 }); R.orderMove(a, sc.B, t.pos); a.join = t.id; let crossed = null;
  for (let i = 0; i < 300 && S.armies.includes(a) && R.count(a); i++){ R.tick(); if (crossed === null && a.at === sc.B) crossed = { alive: R.count(a) > 0, sail: !!a.sail }; }
  ok(T + 'a join order: the force enters the province and walks on to the other force (not merged at the border)', crossed && crossed.alive && crossed.sail, crossed);
  ok(T + 'it merges there: the joined force stays on its spot, the garrison at the city as it was', R.count(t) === 3 && d(t.pos, sc.wB) < 1e-9 && R.count(sc.gB) === nB, { t: R.count(t), pos: t.pos, gB: R.count(sc.gB), nB }); });

// 7. a group (index.html sendToTarget and stopTap hand every force of a selected group the same point, the tapped spot): three forces of
// 2 infantry sent by Move, or by Waypoint with two stops, to one spot 30 km from a garrisoned city end there as one force of 6 (the arrival
// join, JOIN_R), the garrison as it was; three of 4 infantry end on the spot as a force of 8 and one of 4 beside it on the same point (the
// join keeps each within its stack limit, STACK_LIM). Until PINPOINT-3 round 3 the page sent the others 43 to 52 km off the tapped spot
for (const kind of ['move', 'waypoint']) for (const k of [2, 4]) run(`${T}group ${kind} ${k}`, () => { const R = game(W), S = R.S, n = R.me, sc = scene(R, n, 30); if (!sc) return; const nB = R.count(sc.gB), nC = R.count(sc.gC);
  const F = [0, 1, 2].map(() => { const f = R.addArmy(n, sc.A, { inf: k }); f.from = sc.A; f.lastAt = sc.A; return f; }), last = kind === 'move' ? sc.wB : sc.wC, P = kind === 'move' ? sc.B : sc.C, st = F.map(() => []);
  for (const f of F){ if (kind === 'move') R.orderMove(f, sc.B, sc.wB.slice()); else { R.addStop(f, sc.B, sc.wB.slice()); R.addStop(f, sc.C, sc.wC.slice()); } }
  for (let i = 0; i < 600 && F.some(f => S.armies.includes(f) && R.count(f) && !(idle(f) && !f.wp)); i++){ R.tick(); F.forEach((f, j) => { if (S.armies.includes(f) && idle(f) && f.pos) st[j].push(f.pos.slice()); }); }
  const left = F.filter(f => S.armies.includes(f) && R.count(f)), on = left.filter(f => f.at === P && f.pos && d(f.pos, last) < 1e-6), sizes = left.map(f => R.count(f)).sort((u, v) => v - u);
  ok(`${T}group of 3 x ${k} infantry, ${kind === 'move' ? 'Move' : 'Waypoint, two stops'}, to one spot 30 km from the city of ${place(R, P)}: every force ends on that spot, ${k === 2 ? 'joined into one force of 6' : 'a force of 8 and one of 4 (stack limit)'}`,
    on.length === left.length && JSON.stringify(sizes) === JSON.stringify(k === 2 ? [6] : [8, 4]), { left: left.map(f => ({ n: R.count(f), at: f.at, offKm: f.pos ? +(d(f.pos, last)/R.KM_W).toFixed(2) : 'centre' })), last });
  if (kind === 'waypoint') ok(`${T}group of 3 x ${k}, Waypoint: each force stood on the first stop exactly`, st.every(q => q.some(x => d(x, sc.wB) < 1e-6)), st.map(q => q.length));
  ok(`${T}group of 3 x ${k}, ${kind}: the garrisons stay as they were, at their cities`, same(R, sc.gB, nB) && same(R, sc.gC, nC), { gB: R.count(sc.gB), nB, gC: R.count(sc.gC), nC }); });

// 6. the nations world: moves and waypoints to spots 2, 4, 6 and 8 km from a garrisoned city of yours end exactly there (the arrival join took
// everything within JOIN_R, about 9 km, into the garrison until PINPOINT-3 round 2: at the closest zoom a tap 7 to 9 km from a city is
// 16 to 20 px from its mark, so index.html byCity leaves it on the tapped spot, and the rules then merged it into the garrison at the city);
// and a force halted 1 to 8 km from a garrisoned city, on its way past it, stays where it halted (it is looked at for the arrival join: it
// has just come in, a.lastAt unset)
const A0 = (R, p, n) => [...R.G.P[p].nb.keys()].find(v => !R.G.P[v].sea && R.S.owner[v] === n) ?? p;
if (W === 'nations') run(T + 'close spots', () => { const R = game(W), S = R.S, n = R.me, used = new Set(), L = [];
  for (const km of [2, 4, 6, 8]) for (const kind of ['move', 'waypoint']){ const sc = scene(R, n, km, used); if (!sc){ ok(`${T}${kind} ${km} km: found a garrisoned province with a spot ${km} km from its city`, false); continue; }
    used.add(sc.B); const a = R.addArmy(n, sc.A, { inf: 2 }); if (kind === 'move') R.orderMove(a, sc.B, sc.wB); else R.addStop(a, sc.B, sc.wB); L.push({ a, sc, km, kind, nB: R.count(sc.gB) }); }
  for (let i = 0; i < 400 && L.some(q => S.armies.includes(q.a) && R.count(q.a) && !(idle(q.a) && !q.a.wp)); i++) R.tick();
  for (const { a, sc, km, kind, nB } of L){ const gone = !S.armies.includes(a) || !R.count(a);
    ok(`${T}${kind} to a spot ${km} km from the city of ${place(R, sc.B)}: it ends exactly on the spot, not in the garrison`, !gone && a.at === sc.B && d(a.pos, sc.wB) < 1e-6 && same(R, sc.gB, nB), { gone, pos: a.pos, want: sc.wB, garrison: R.count(sc.gB), was: nB }); }
  // the halt: a force walking through a garrisoned province, by its city, halted 1 to 8 km from it (walks are a few km an hour, so the spot is
  // set to be passed that close: the force starts on a spot 20 km before the city and walks to one 20 km beyond it, 1 to 6 km off its line)
  const H = []; for (const gB of garrisons(R, n)){ if (H.length >= 4) break; const B = R.G.P[gB.at]; if (used.has(B.id)) continue;
    for (let k = 0; k < 12; k++){ const an = k*Math.PI/6, u = [Math.cos(an), Math.sin(an)], off = (1.5 + (H.length % 4)*1.5)*R.KM_W, K = 20*R.KM_W;
      const w1 = [B.x - u[0]*K - u[1]*off, B.y - u[1]*K + u[0]*off], w2 = [B.x + u[0]*K - u[1]*off, B.y + u[1]*K + u[0]*off];
      if (R.provOfPt(w1[0], w1[1]) !== B.id || R.provOfPt(w2[0], w2[1]) !== B.id) continue;
      used.add(B.id); const a = R.addArmy(n, B.id, { inf: 2 }); a.pos = w1; a.from = A0(R, B.id, n); a.lastAt = null; R.orderMove(a, B.id, w2); H.push({ a, B, gB, nB: R.count(gB), hd: null }); break; } }
  for (let i = 0; i < 300 && H.some(q => q.hd === null && R.count(q.a) && !idle(q.a)); i++){ R.tick();
    for (const q of H) if (q.hd === null && q.a.sail && q.a.pos){ const k = d(q.a.pos, [q.B.x, q.B.y])/R.KM_W; if (k > 1 && k < 8){ R.haltArmy(q.a); q.hd = q.a.pos.slice(); } } }
  for (let i = 0; i < 3; i++) R.tick(); const hs = H.filter(q => q.hd);
  ok(T + 'found forces to halt 1 to 8 km from a garrisoned city', hs.length > 0, H.map(q => q.B.name));
  for (const q of hs){ const gone = !S.armies.includes(q.a) || !R.count(q.a); ok(`${T}halted ${(d(q.hd, [q.B.x, q.B.y])/R.KM_W).toFixed(1)} km from the city of ${place(R, q.B.id)}: it stays where it halted, not in the garrison`, !gone && d(q.a.pos, q.hd) < 1e-6 && same(R, q.gB, q.nB), { gone, pos: q.a.pos, hd: q.hd, garrison: R.count(q.gB), was: q.nB }); } });

}
rulesPart('nations'); rulesPart('classic');

// 5. saves: one made mid-plan loads and goes on to every stop exactly; an old save of origin/master with moves, stops and walks in flight
run('saves', () => { const R = game(), n = 0, sc = scene(R, n, 30); if (!sc) return; const a = R.addArmy(n, sc.A, { inf: 2 }); R.addStop(a, sc.B, sc.wB); R.addStop(a, sc.C, sc.wC);
  for (let i = 0; i < 3; i++) R.tick(); const R2 = new Function(SRC)(); ok('a save made mid-plan loads', R2.restore(JSON.parse(R.saveJSON())) !== false);
  const a2 = R2.S.armies.find(x => x.id === a.id), r = play(R2, a2);
  ok('and the force goes on through both stops to the exact last spot', !r.gone && r.st.some(q => d(q.pos, sc.wB) < 1e-6) && d(a2.pos, sc.wC) < 1e-6, { gone: r.gone, st: r.st }); });
run('old save', () => { if (!fs.existsSync(FIX)){ ok('the old-save fixture is there (.test/fixtures/pinpoint-oldsave.json)', false); return; }
  const F = JSON.parse(fs.readFileSync(FIX, 'utf8')), R = new Function(SRC)(); ok(`an old save of ${F.made} with moves, stops and walks in flight loads`, R.restore(F.save) !== false);
  // (all played together, hour by hour, each force's stops recorded; a force already standing on its first stop counts it)
  const L = F.cases.map(c => ({ c, a: R.S.armies.find(x => x.id === c.id), st: [] })); for (const q of L) if (q.a && q.a.pos && idle(q.a)) q.st.push({ p: q.a.at, pos: q.a.pos.slice() });
  for (let i = 0; i < 600 && L.some(q => q.a && R.S.armies.includes(q.a) && R.count(q.a) && !(idle(q.a) && !q.a.wp)); i++){ R.tick();
    for (const q of L) if (q.a && idle(q.a) && q.a.pos && !(q.st.length && d(q.st[q.st.length - 1].pos, q.a.pos) < 1e-9)) q.st.push({ p: q.a.at, pos: q.a.pos.slice() }); }
  for (const { c, a, st } of L){ if (!a){ ok(`old save: ${c.what}: the force is there`, false); continue; }
    const r = { gone: !R.S.armies.includes(a) || !R.count(a), st }; ok(`old save: ${c.what}: it ends exactly on ${c.last ? 'its last stop' : 'its spot'}`, !r.gone && d(a.pos, c.end) < 1e-6 && (!c.mid || r.st.some(q => d(q.pos, c.mid) < 1e-6)), { gone: r.gone, pos: a.pos, end: c.end, st: r.st }); } });

// the fixture: origin/master's rules (--make-fixture <checkout>), the same scene stopped the hour before the first force crosses into the
// province of its spot (on master that crossing is where the garrison swallowed it), with a force already walking inside that province and a
// fleet sailing to the first of its two stops
function makeFixture(){ const kmS = B => [80, 70, 60, 55].map(km => spotAt(build.R, B, km)).find(Boolean), kmT = B => [80, 70, 60, 55].map(km => spotAt(build.R, B, km, 12)).find(Boolean);
  function build(){ const R = build.R = game(), S = R.S, G = R.G, n = 0, sc = scene(R, n, 30), cases = [];
    const a = R.addArmy(n, sc.A, { inf: 2 }); R.orderMove(a, sc.B, sc.wB); cases.push({ id: a.id, what: 'a move to a spot 30 km from a garrisoned city, on the road', end: sc.wB });
    const b = R.addArmy(n, sc.A, { inf: 2, tank: 1 }); R.addStop(b, sc.B, sc.wB); R.addStop(b, sc.C, sc.wC); cases.push({ id: b.id, what: 'two stops through garrisoned provinces, on the way to the first', end: sc.wC, mid: sc.wB, last: true });
    const s1 = kmS(G.P[sc.B]), s2 = kmT(G.P[sc.B]), c = R.addArmy(n, sc.B, { inf: 1 }); c.pos = s1.slice(); R.orderMove(c, sc.B, s2); cases.push({ id: c.id, what: 'a force walking inside the province, far from its city', end: s2 });
    const port = G.P.find(P => !P.sea && S.owner[P.id] === n && [...P.nb.keys()].some(v => G.P[v].sea && G.P[v].cells.length > 150)), z1 = G.P[[...port.nb.keys()].find(v => G.P[v].sea && G.P[v].cells.length > 150)];
    const z2 = G.P[[...z1.nb.keys()].find(v => G.P[v].sea && G.P[v].cells.length > 150)], wat = (Z, k) => { const cs = Z.cells.map(q => R.cellCenter(q)).filter(q => R.provOfPt(q[0], q[1]) === Z.id && d(q, [Z.x, Z.y]) > 3 && d(q, [Z.x, Z.y]) < 9); return cs[k % cs.length]; };
    const f = R.addArmy(n, z1.id, { frig: 2 }), w1 = wat(z1, 0), w2 = wat(z2, 3); f.pos = [z1.x, z1.y]; R.addStop(f, z1.id, w1); R.addStop(f, z2.id, w2); cases.push({ id: f.id, what: 'a fleet with two stops on water', end: w2, mid: w1, last: true });
    return { R, sc, L: [a, b], all: [a, b, c, f], cases }; }
  const P0 = build(); let k = 0; for (; k < 300 && !P0.L.some(x => x.at === P0.sc.B); k++) P0.R.tick();
  const F = build(); for (let i = 0; i < k - 1; i++) F.R.tick();
  const st = x => ({ at: x.at, to: x.to, t: +x.t.toFixed(3), sail: !!x.sail, wp: x.wp ? x.wp.length : 0, dest: !!x.dest });
  fs.writeFileSync(FIX, JSON.stringify({ made: process.argv[MAKE + 2] || 'origin/master', hour: F.R.S.hour, state: F.all.map(st), cases: F.cases, save: JSON.parse(F.R.saveJSON()) }));
  console.log('wrote', FIX, 'hour', F.R.S.hour, JSON.stringify(F.all.map(st)), fs.statSync(FIX).size, 'bytes'); }

// Part 2: the page, a player's taps, phone and desktop, Germany's real start (garrisons kept)
async function pagePart(){ const pickNation = require('./pick-nation.js'), { chromium } = require('playwright');
  const br = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  // the nations world as players see it (page.html?start=nations: the start screen's only world), phone and desktop; the classic world of the
  // old saves on the desktop (the test page opens on it without ?start=nations)
  for (const [TAG, W, H, DPR, Q] of [['phone', 440, 900, 2, '?start=nations'], ['desk', 1440, 900, 1, '?start=nations'], ['classic desk', 1440, 900, 1, '']]){ const PHONE = TAG === 'phone';
    const ctx = await br.newContext(PHONE ? { viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: true, isMobile: true } : { viewport: { width: W, height: H }, deviceScaleFactor: DPR }), p = await ctx.newPage();
    p.on('pageerror', e => errors.push(TAG + ' pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) errors.push(TAG + ' console: ' + m.text()); });
    await p.goto('file://' + __dirname + '/page.html' + Q); await p.waitForTimeout(500);
    await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
    await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 }); await p.waitForTimeout(600);
    const R = await p.evaluate(() => { const im = window.__im; im.S.speed = 0; document.querySelectorAll('.toast,.ftip').forEach(t => t.remove());
      // what the rules are handed (the order a tap gives), and every merge
      window.__log = []; for (const f of ['addStop', 'merge']){ const o = window[f]; window[f] = function(...A){ window.__log.push({ f, a: A[0] && A[0].id, b: f === 'merge' ? A[1] && A[1].id : undefined, p: f === 'addStop' ? A[1] : undefined }); return o.apply(this, A); }; }
      const r = document.getElementById('map').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    const tap = (x, y) => PHONE ? p.touchscreen.tap(Math.round(R.x + x), Math.round(R.y + y)) : p.mouse.click(R.x + x, R.y + y);
    const still = async () => { let q = null; for (let i = 0; i < 40; i++){ const v = await p.evaluate(() => { const v = window.__im.view; return [v.x, v.y, v.s, !!window.__im.camFly].join(); }); if (v === q && !/true$/.test(v)) return; q = v; await p.waitForTimeout(120); } };
    const view = (xy, hp) => p.evaluate(([x, y, hp, w, h]) => { const v = window.__im.view, s = hp/12; v.s = s; v.x = w/2 - x*s; v.y = h/2 - y*s; window.__im.clampView(); }, [xy[0], xy[1], hp, R.w, R.h*(PHONE ? 0.45 : 1)]);
    const scr = xy => p.evaluate(([x, y]) => window.__im.toScreen(x, y), xy), wOf = T => p.evaluate(([x, y]) => { const v = window.__im.view; return [(x - v.x)/v.s, (y - v.y)/v.s]; }, T);
    const info = id => p.evaluate(id => { const f = window.__im.S.armies.find(q => q.id === id); return f && count(f) ? { id: f.id, at: f.at, pos: f.pos, n: count(f), idle: f.to === null && !f.path.length && !f.sail, wp: f.wp ? f.wp.length : 0, stops: stopsOf(f).map(q => ({ p: q.p, x: q.x, y: q.y })) } : null; }, id);
    const btn = async act => { const el = await p.$(`#cmdbar [data-act="${act}"]`); if (!el) return false; if (PHONE) await el.tap(); else await el.click(); await p.waitForTimeout(150); return true; };
    const select = async id => { await p.evaluate(() => { window.__im.clearSel(); document.querySelectorAll('.toast,.ftip').forEach(t => t.remove()); }); await p.waitForTimeout(250);
      const h = await p.evaluate(id => { const h = window.__im.hits.find(h => h.own && h.own.includes(id) && !h.tag); return h && [h.x + h.w/2, h.y + h.h/2]; }, id);
      if (h){ await tap(h[0], h[1]); await p.waitForTimeout(300); } if (await p.evaluate(id => window.__im.sel.army === id, id)) return true;
      await p.evaluate(id => window.__im.selectArmy(id), id); await p.waitForTimeout(200); return false; };   // (the tap missed: a test of the taps that follow, not of selecting)
    // a tap on the map at world point xy, once the view is still; returns the world point the tap was at (whole pixels, as a touch is)
    const tapW = async (xy, any = false) => { await still(); const T = (await scr(xy)).map(Math.round); if (!any && await p.evaluate(([x, y]) => window.__im.hitAt(x, y), T)) errors.push(`${TAG}: a counter is drawn under the tap at ${T} (the test's spot, not the game)`); await tap(T[0], T[1]); await p.waitForTimeout(300); return wOf(T); };
    // plays hour by hour (the rules' own tick) until the force has no order left; records the spots it stood still on
    const play = id => p.evaluate(id => { const S = window.__im.S, a = S.armies.find(q => q.id === id), st = []; let h = 0;
      for (; h < 600; h++){ tick(); if (!S.armies.includes(a) || !count(a)) return { gone: true, h, st }; const idle = a.to === null && !a.path.length && !a.sail;
        if (idle && a.pos && !(st.length && Math.hypot(st[st.length - 1][0] - a.pos[0], st[st.length - 1][1] - a.pos[1]) < 1e-9)) st.push(a.pos.slice()); if (idle && !a.wp) break; }
      return { gone: false, h, st }; }, id);
    // its position dot drawn on the spot (within 3 px), at a close zoom with nothing selected
    const dotOn = async (id, xy) => { await p.evaluate(() => window.__im.clearSel()); await view(xy, 60); let r = null;
      for (let i = 0; i < 14; i++){ await p.waitForTimeout(250); r = await p.evaluate(([id, x, y]) => { const h = window.__im.hits.find(h => h.own && h.own.includes(id) && !h.tag), P = window.__im.toScreen(x, y); return h && h.px != null ? { dot: [h.px, h.py], P, off: Math.hypot(h.px - P[0], h.py - P[1]) } : { P }; }, [id, xy[0], xy[1]]); if (r.off <= 3) break; }
      return r; };
    const kill = ids => p.evaluate(ids => { for (const id of ids){ const f = window.__im.S.armies.find(q => q.id === id); if (f) for (const t in f.u) f.u[t] = 0; } removeEmpty(); window.__im.clearSel(); }, ids);
    // Germany's start: a force of yours next to a province whose garrison stands at its city, a spot there km from the city, on dry land, inside
    // the drawn border, with no counter or city mark under it; and a neighbour of that province with its garrison too
    const sc = await p.evaluate(() => { const im = window.__im, G = im.G, S = im.S, gs = S.armies.filter(a => a.owner === 0 && !a.air && count(a) && !shipsOnly(a) && !a.pos && a.to === null && !a.path.length);
      const spot = (B, kms, k0) => { for (const km of kms) for (let k = 0; k < 24; k++){ const an = ((k + k0) % 24)*Math.PI/12, w = [B.x + Math.cos(an)*km*KM_W, B.y + Math.sin(an)*km*KM_W];
          if ([[0, 0], [1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]].every(([dx, dy]) => provOfPt(w[0] + dx, w[1] + dy) === B.id && !im.isWet(w[0] + dx, w[1] + dy))) return { w, km }; } return null; };
      for (const g0 of gs) for (const b of G.P[g0.at].nb.keys()){ const gB = gs.find(g => g.at === b); if (!gB || G.P[b].sea) continue; const sB = spot(G.P[b], [35, 30, 40, 25, 45], 0); if (!sB) continue;
        for (const c of G.P[b].nb.keys()){ const gC = gs.find(g => g.at === c); if (!gC || c === g0.at || G.P[c].sea) continue; const sC = spot(G.P[c], [35, 30, 40, 25, 45], 7); if (!sC) continue;
          return { A: g0.at, Ac: [G.P[g0.at].x, G.P[g0.at].y], B: b, Bc: [G.P[b].x, G.P[b].y], bName: G.P[b].name, gB: gB.id, nB: count(gB), wB: sB.w, kmB: sB.km, C: c, Cc: [G.P[c].x, G.P[c].y], cName: G.P[c].name, gC: gC.id, nC: count(gC), wC: sC.w }; } }
      return null; });
    { const nn = await p.evaluate(() => window.__im.S.nations.length); ok(`${TAG}: the page plays the ${Q ? 'nations world (68 nations)' : 'classic world (15 powers)'}`, Q ? nn > 15 : nn === 15, nn); }
    ok(`${TAG}: found Germany's garrisoned neighbour provinces with spots 25-45 km from their cities`, !!sc, null); if (!sc){ await ctx.close(); continue; }
    const newForce = (u, k = 0) => p.evaluate(([A, Ac, u, k]) => { const f = window.__im.addArmy(0, A, u); f.pos = ptIn(A, Ac[0] - 1.5 + k*0.9, Ac[1] + 1.2); f.from = A; f.lastAt = A; return f.id; }, [sc.A, sc.Ac, u, k]);
    const garOk = () => p.evaluate(([gB, nB, gC, nC]) => { const S = window.__im.S, b = S.armies.find(q => q.id === gB), c = S.armies.find(q => q.id === gC); return { b: b ? count(b) : 0, c: c ? count(c) : 0, ok: !!b && count(b) === nB && !!c && count(c) === nC }; }, [sc.gB, sc.nB, sc.gC, sc.nC]);
    const mid = (u, v) => [(u[0] + v[0])/2, (u[1] + v[1])/2];

    // P1. Move, then a tap 25-45 km from the garrisoned city of the next province
    { const id = await newForce({ inf: 2, tank: 1 }); await view(mid(sc.Ac, sc.wB), 55); await p.waitForTimeout(900); await select(id); await btn('cm-move'); const w = await tapW(sc.wB), o = await info(id);
      ok(`${TAG} Move + tap ${sc.kmB} km from the city of ${sc.bName}: the order goes to the tapped spot`, o && o.stops.length === 1 && o.stops[0].p === sc.B && Math.hypot(o.stops[0].x - w[0], o.stops[0].y - w[1]) < 0.05, { stops: o && o.stops, w });
      const r = await play(id), e = await info(id), g = await garOk();
      ok(`${TAG} Move + tap: the force ends exactly on the tapped spot (not merged into the garrison at the city)`, !r.gone && e && e.at === sc.B && Math.hypot(e.pos[0] - w[0], e.pos[1] - w[1]) < 0.05 && g.ok, { r, e, w, garrisons: g });
      if (e){ const D = await dotOn(id, e.pos); ok(`${TAG} Move + tap: its dot is drawn on the spot (within 3 px)`, D && D.off <= 3, D); } await kill([id]); }

    // P2. Waypoint, then two taps: a stop by the garrisoned city of the next province, the last by the garrisoned city of the one after
    { const id = await newForce({ inf: 2 }, 1); await view(mid(sc.wB, sc.wC), 90); await p.waitForTimeout(900); await select(id); await btn('cm-wp'); const n0 = await p.evaluate(() => window.__log.filter(q => q.f === 'addStop').length);
      const w1 = await tapW(sc.wB), w2 = await tapW(sc.wC); const o = await info(id), adds = await p.evaluate(n0 => window.__log.filter(q => q.f === 'addStop').slice(n0), n0);
      ok(`${TAG} Waypoint + two taps (${sc.bName}, ${sc.cName}): two stops on the tapped spots`, adds.length === 2 && o && o.stops.length === 2 && Math.hypot(o.stops[0].x - w1[0], o.stops[0].y - w1[1]) < 0.05 && Math.hypot(o.stops[1].x - w2[0], o.stops[1].y - w2[1]) < 0.05, { adds, stops: o && o.stops, w1, w2 });
      const D = await p.evaluate(() => window.__im.pathDbg && window.__im.pathDbg.dots), T2 = await scr(w2);
      ok(`${TAG} Waypoint: the route's last numbered dot is on the last tap`, D && D.length === 2 && Math.hypot(D[1][0] - T2[0], D[1][1] - T2[1]) < 5, { D, T2 });
      await btn('cm-wp'); let sv = null;
      if (!PHONE){ sv = await p.evaluate(() => { for (let i = 0; i < 4; i++) tick(); const s = saveJSON(); return window.__im.restore(JSON.parse(s)) !== false; }); ok(`${TAG} Waypoint: saved and loaded on the way`, sv); }
      const r = await play(id), e = await info(id), g = await garOk();
      ok(`${TAG} Waypoint: it stands on the first stop exactly, then ends exactly on the last (no garrison swallows it)`, !r.gone && r.st.some(q => Math.hypot(q[0] - w1[0], q[1] - w1[1]) < 0.05) && e && e.at === sc.C && Math.hypot(e.pos[0] - w2[0], e.pos[1] - w2[1]) < 0.05 && g.ok, { r, e, w1, w2, garrisons: g });
      if (e){ const D2 = await dotOn(id, e.pos); ok(`${TAG} Waypoint: its dot is drawn on the last stop (within 3 px)`, D2 && D2.off <= 3, D2); } await kill([id]); }

    // P3. a fleet, Waypoint, then two taps on water (each one a stop; a tap on water used to deselect the fleet)
    { const f = await p.evaluate(() => { const im = window.__im, G = im.G, S = im.S, port = G.P.find(P => !P.sea && S.owner[P.id] === 0 && portOk(0, P.id) && [...P.nb.keys()].some(v => G.P[v].sea && G.P[v].cells.length > 120));
        const Z = G.P[[...port.nb.keys()].filter(v => G.P[v].sea).sort((x, y) => G.P[y].cells.length - G.P[x].cells.length)[0]], Z2 = G.P[[...Z.nb.keys()].filter(v => G.P[v].sea).sort((x, y) => G.P[y].cells.length - G.P[x].cells.length)[0]];
        const wat = (Q, k) => Q.cells.map(c => cellCenter(c)).filter(q => im.isWet(q[0], q[1]) && provOfPt(q[0], q[1]) === Q.id && Math.hypot(q[0] - Q.x, q[1] - Q.y) > 3).sort((q, r) => Math.hypot(q[0] - Q.x, q[1] - Q.y) - Math.hypot(r[0] - Q.x, r[1] - Q.y))[k];
        const a = im.addArmy(0, Z.id, { frig: 2, crui: 1 }); a.pos = [Z.x, Z.y]; a.from = Z.id; a.lastAt = Z.id; const k = im.addArmy(0, Z2.id, { frig: 1 }); return { id: a.id, k: k.id, Zc: [Z.x, Z.y], Z: Z.id, Z2: Z2.id, w1: wat(Z, 4), w2: wat(Z2, 6), name: Z2.name, port: port.id, portc: [port.x, port.y] }; });
      await view(mid(f.w1, f.w2), 40); await p.waitForTimeout(900); await select(f.id); await btn('cm-wp'); const w1 = await tapW(f.w1), w2 = await tapW(f.w2);
      const sel = await p.evaluate(id => window.__im.sel.army === id, f.id), o = await info(f.id);
      ok(`${TAG} fleet, Waypoint + two taps on water: the fleet stays selected and takes two stops on the tapped spots`, sel && o && o.stops.length === 2 && o.stops[1].p === f.Z2 && Math.hypot(o.stops[0].x - w1[0], o.stops[0].y - w1[1]) < 0.05 && Math.hypot(o.stops[1].x - w2[0], o.stops[1].y - w2[1]) < 0.05, { selected: sel, stops: o && o.stops, w1, w2 });
      await btn('cm-wp'); const r = await play(f.id), e = await info(f.id), k = await info(f.k);
      ok(`${TAG} fleet: it ends exactly on the last stop, on water (not merged into the fleet in that zone)`, !r.gone && e && e.at === f.Z2 && Math.hypot(e.pos[0] - w2[0], e.pos[1] - w2[1]) < 0.05 && k && k.n === 1, { r, e, w2, k });
      if (e){ const D = await dotOn(f.id, e.pos); ok(`${TAG} fleet: its dot is drawn on the spot (within 3 px)`, D && D.off <= 3, D); } await kill([f.id, f.k]);
      // P4. troops in that port: Waypoint and a tap at sea makes a stop at sea (they embark in the port); it ends there
      const t = await p.evaluate(([P, Pc]) => { const a = window.__im.addArmy(0, P, { inf: 1 }); a.pos = ptIn(P, Pc[0], Pc[1]); a.from = P; a.lastAt = P; return a.id; }, [f.port, f.portc]);
      await view(mid(f.portc, f.w1), 40); await p.waitForTimeout(900); await select(t); await btn('cm-wp'); const wt = await tapW(f.w1), ot = await info(t);
      ok(`${TAG} troops in a port, Waypoint + a tap at sea: a stop at sea on the tapped spot`, ot && ot.stops.length === 1 && ot.stops[0].p === f.Z && Math.hypot(ot.stops[0].x - wt[0], ot.stops[0].y - wt[1]) < 0.05, { stops: ot && ot.stops, wt });
      await btn('cm-wp'); const rt = await play(t), et = await info(t);
      ok(`${TAG} troops: they embark and end exactly on that spot at sea`, !rt.gone && et && et.at === f.Z && Math.hypot(et.pos[0] - wt[0], et.pos[1] - wt[1]) < 0.05, { rt, et, wt }); await kill([t]); }

    // P5. Move, then a tap on the city itself: it goes to the city and joins the garrison there (byCity)
    { const id = await newForce({ inf: 1 }, 2); await view(mid(sc.Ac, sc.Bc), 30); await p.waitForTimeout(900); await select(id); await btn('cm-move'); await tapW(sc.Bc, true);
      const r = await play(id), g = await p.evaluate(gB => { const b = window.__im.S.armies.find(q => q.id === gB); return b && { n: count(b), pos: b.pos }; }, sc.gB);
      ok(`${TAG} Move + a tap on the city of ${sc.bName}: it goes to the city and joins the garrison there`, r.gone && g && g.n === sc.nB + 1 && !g.pos, { r, g, was: sc.nB });
      await p.evaluate(([gB, nB]) => { const b = window.__im.S.armies.find(q => q.id === gB); if (b){ b.u.inf = Math.max(0, b.u.inf - (count(b) - nB)); } }, [sc.gB, sc.nB]); }

    // P7. the closest zoom (view.s = 20 px a world unit, index.html ZMAX: hp 240): Move, and Waypoint, then a tap 17 px (about 7.4 km) from the mark of the
    // garrisoned city: byCity (16 px) leaves the order on the tapped spot, and the force ends there (the arrival join took it into the garrison
    // until PINPOINT-3 round 2: JOIN_R was about 9 km); a tap 4 px from a force of yours standing on a spot goes to it and joins it there
    // (index.html byForce), and one 24 px off it stands apart
    { const Z = 240; await view(sc.Bc, Z); await p.waitForTimeout(1200); await still();
      const sp = await p.evaluate(([B, Bc]) => { const im = window.__im, out = []; for (let k = 0; k < 48 && out.length < 2; k++){ const an = k*Math.PI/24, w = [Bc[0] + Math.cos(an)*17/im.view.s, Bc[1] + Math.sin(an)*17/im.view.s], T = im.toScreen(w[0], w[1]).map(Math.round);
          const w2 = [(T[0] - im.view.x)/im.view.s, (T[1] - im.view.y)/im.view.s]; if (provOfPt(w2[0], w2[1]) !== B || im.isWet(w2[0], w2[1]) || im.hitAt(T[0], T[1]) || Math.hypot(...im.toScreen(Bc[0], Bc[1]).map((c, i) => c - T[i])) < 16.5 || out.some(q => Math.hypot(q[0] - w2[0], q[1] - w2[1]) < 0.3)) continue; out.push(w2); }
        return out; }, [sc.B, sc.Bc]);
      ok(`${TAG} closest zoom: found two spots 17 px from the city of ${sc.bName} with no counter under them`, sp.length === 2, sp);
      for (const [j, mode] of ['cm-move', 'cm-wp'].entries()) if (sp[j]){ const id = await newForce({ inf: 1 }, 4 + j); await view(sc.Bc, Z); await p.waitForTimeout(600); await select(id); await btn(mode);
        const w = await tapW(sp[j]); if (mode === 'cm-wp') await btn('cm-wp'); const o = await info(id), km = await p.evaluate(([x, y, X, Y]) => Math.hypot(x - X, y - Y)/KM_W, [w[0], w[1], sc.Bc[0], sc.Bc[1]]);
        ok(`${TAG} closest zoom, ${mode === 'cm-move' ? 'Move' : 'Waypoint'} + a tap ${km.toFixed(1)} km (17 px) from the city of ${sc.bName}: the order goes to the tapped spot`, o && o.stops.length === 1 && Math.hypot(o.stops[0].x - w[0], o.stops[0].y - w[1]) < 0.02, { stops: o && o.stops, w });
        const r = await play(id), e = await info(id), g = await garOk();
        ok(`${TAG} closest zoom, ${mode === 'cm-move' ? 'Move' : 'Waypoint'}: it ends exactly on the tapped spot, not merged into the garrison 17 px away`, !r.gone && e && e.at === sc.B && Math.hypot(e.pos[0] - w[0], e.pos[1] - w[1]) < 0.02 && g.ok, { r, e, w, garrisons: g });
        if (j === 0) await kill([id]); else sp[j] = e && !r.gone ? { id, pos: e.pos } : null; }   // (the first goes: its counter would lie under the second tap)
      // byForce: the Waypoint force now stands on its spot; a tap 4 px from it (Move) joins it there; a tap 24 px from it stands apart
      if (sp[1] && sp[1].id){ const t = sp[1], P0 = await scr(t.pos), side = await p.evaluate(([B, x, y, Bc]) => { const im = window.__im, C = im.toScreen(Bc[0], Bc[1]); for (let k = 0; k < 16; k++){ const an = k*Math.PI/8, X = Math.round(x + Math.cos(an)*24), Y = Math.round(y + Math.sin(an)*24), w = [(X - im.view.x)/im.view.s, (Y - im.view.y)/im.view.s];
            if (provOfPt(w[0], w[1]) === B && !im.isWet(w[0], w[1]) && !im.hitAt(X, Y) && Math.hypot(X - C[0], Y - C[1]) > 16.5) return w; } return null; }, [sc.B, P0[0], P0[1], sc.Bc]);
        const near = await p.evaluate(([x, y]) => { const im = window.__im; for (const [dx, dy] of [[4, 0], [0, 4], [-4, 0], [0, -4], [3, 3]]) if (!im.hitAt(Math.round(x + dx), Math.round(y + dy))) return [(Math.round(x + dx) - im.view.x)/im.view.s, (Math.round(y + dy) - im.view.y)/im.view.s]; return [(Math.round(x + 4) - im.view.x)/im.view.s, (Math.round(y) - im.view.y)/im.view.s]; }, P0);
        const a1 = await newForce({ inf: 1 }, 6); await select(a1); await btn('cm-move'); await tapW(near, true); const r1 = await play(a1), e0 = await info(t.id);
        ok(`${TAG} closest zoom, Move + a tap 4 px from a force of yours standing on a spot: it goes to that force and joins it there (byForce)`, r1.gone && e0 && e0.n === 2 && Math.hypot(e0.pos[0] - t.pos[0], e0.pos[1] - t.pos[1]) < 1e-9, { r1, e0, t });
        if (side){ const a2 = await newForce({ inf: 1 }, 7); await select(a2); await btn('cm-move'); const w = await tapW(side); const r2 = await play(a2), e2 = await info(a2), e1 = await info(t.id);
          ok(`${TAG} closest zoom, Move + a tap 24 px from that force: it stands apart, exactly on the tapped spot`, !r2.gone && e2 && Math.hypot(e2.pos[0] - w[0], e2.pos[1] - w[1]) < 0.02 && e1 && e1.n === 2, { r2, e2, w, e1 }); await kill([a2]); } }
      await kill(sp.filter(q => q && q.id).map(q => q.id)); }

    // P8. a group: three forces of 2 infantry selected together (as a box drawn round them does), Move and a tap
    // 25-45 km from the garrisoned city, and Waypoint and two taps; every force's order goes to the tapped spot and they end there as one force of
    // 6 (index.html sendToTarget and stopTap sent the others 43 to 52 km off it until PINPOINT-3 round 3; with the join on the very spot only they
    // stayed there, as separate stacks)
    for (const mode of ['cm-move', 'cm-wp']){ const M = mode === 'cm-move' ? 'Move' : 'Waypoint', ids = [await newForce({ inf: 2 }, 0), await newForce({ inf: 2 }, 1), await newForce({ inf: 2 }, 2)];
      await view(mode === 'cm-move' ? mid(sc.Ac, sc.wB) : mid(sc.wB, sc.wC), mode === 'cm-move' ? 55 : 90); await p.waitForTimeout(900); await select(ids[0]);
      await p.evaluate(ids => { const s = window.__im.sel; s.army = ids[0]; s.group = ids.slice(); }, ids);   // (as a box drawn round them does: index.html finishBox) await p.waitForTimeout(250);
      const g = await p.evaluate(() => window.__im.sel.group.slice()); ok(`${TAG} group: the three forces are selected together`, ids.every(id => g.includes(id)), { g, ids });
      await btn(mode); const w = [await tapW(sc.wB)]; if (mode === 'cm-wp'){ w.push(await tapW(sc.wC)); await btn('cm-wp'); }
      const os = await Promise.all(ids.map(info)), last = w[w.length - 1], P = mode === 'cm-move' ? sc.B : sc.C;
      ok(`${TAG} group, ${M} + ${w.length === 1 ? 'a tap' : 'two taps'}: every force's ${w.length === 1 ? 'order goes' : 'stops go'} to the tapped spot${w.length === 1 ? '' : 's'} (not round it)`, os.every(o => o && o.stops.length === w.length && o.stops.every((q, i) => Math.hypot(q.x - w[i][0], q.y - w[i][1]) < 0.05)), { stops: os.map(o => o && o.stops), w });
      const r = await p.evaluate(ids => { const S = window.__im.S, F = ids.map(id => S.armies.find(q => q.id === id)), on = f => S.armies.includes(f) && count(f); let h = 0;
        for (; h < 600 && F.some(f => on(f) && !(f.to === null && !f.path.length && !f.sail && !f.wp)); h++) tick(); return h; }, ids);
      const e = (await Promise.all(ids.map(info))).filter(Boolean), gr = await garOk(), kmW = await p.evaluate(() => KM_W), Pc = P === sc.B ? sc.Bc : sc.Cc, km = Math.hypot(last[0] - Pc[0], last[1] - Pc[1])/kmW;
      ok(`${TAG} group, ${M}: the three end on the tapped spot ${km.toFixed(0)} km from the city of ${P === sc.B ? sc.bName : sc.cName}, joined into one force of 6 (the garrison as it was)`, e.length === 1 && e[0].n === 6 && e[0].at === P && Math.hypot(e[0].pos[0] - last[0], e[0].pos[1] - last[1]) < 0.05 && gr.ok,
        { hours: r, left: e.map(q => ({ n: q.n, at: q.at, offKm: q.pos ? +(Math.hypot(q.pos[0] - last[0], q.pos[1] - last[1])/kmW).toFixed(1) : 'centre' })), garrisons: gr });
      if (e.length === 1){ const D = await dotOn(e[0].id, e[0].pos); ok(`${TAG} group, ${M}: its dot is drawn on the spot (within 3 px)`, D && D.off <= 3, D); }
      await kill(ids); }

    // P6. the desktop: a counter dragged onto a spot by the garrisoned city
    if (!PHONE){ const id = await newForce({ inf: 2 }, 3); await view(mid(sc.Ac, sc.wB), 55); await p.waitForTimeout(1200); await p.evaluate(() => window.__im.clearSel()); await p.waitForTimeout(250);
      const h = await p.evaluate(id => { const h = window.__im.hits.find(h => h.own && h.own.includes(id) && !h.tag); return h && [h.x + h.w/2, h.y + h.h/2]; }, id), T = (await scr(sc.wB)).map(Math.round);
      if (h){ await p.mouse.move(R.x + h[0], R.y + h[1]); await p.mouse.down(); for (let i = 1; i <= 12; i++){ await p.mouse.move(R.x + h[0] + (T[0] - h[0])*i/12, R.y + h[1] + (T[1] - h[1])*i/12); await p.waitForTimeout(30); } await p.mouse.up(); await p.waitForTimeout(300); }
      const w = await wOf(T), o = await info(id); ok(`${TAG} drag: a counter dragged onto a spot ${sc.kmB} km from the city of ${sc.bName} is ordered there`, !!h && o && o.stops.length === 1 && Math.hypot(o.stops[0].x - w[0], o.stops[0].y - w[1]) < 0.05, { h, stops: o && o.stops, w });
      const r = await play(id), e = await info(id), g = await garOk();
      ok(`${TAG} drag: it ends exactly on that spot (the garrison stays at the city)`, !r.gone && e && Math.hypot(e.pos[0] - w[0], e.pos[1] - w[1]) < 0.05 && g.ok, { r, e, w, garrisons: g }); await kill([id]); }
    await ctx.close(); }
  await br.close(); }

(async () => {
  if (page && !fs.existsSync(path.join(__dirname, 'page.html'))){ errors.push('no .test/page.html: run bash tools/mkpage.sh first (or --rules)'); page = false; }
  if (page) try { await pagePart(); } catch (e){ errors.push('page: ' + e.stack.split('\n').slice(0, 4).join(' | ')); }
  console.log(log.join('\n'));
  const fail = Object.entries(checks).filter(([, v]) => v !== 'PASS');
  if (fail.length || errors.length){ console.log(`\nPINPOINT GUARD FAILED: ${fail.length} check(s), ${errors.length} error(s). A force sent to a spot (Move, Waypoint, a drag, a fleet) no longer ends on that spot.`);
    for (const [k] of fail) console.log('  FAIL ' + k); for (const e of errors) console.log('  ERROR ' + e); }
  console.log(`\n${Object.keys(checks).length - fail.length}/${Object.keys(checks).length} PASS, ${errors.length} errors`);
  process.exit(fail.length || errors.length ? 1 : 0); })();
