// Capture at the heart, embarking only in naval ports, embarking and landing times (owner request): a province is taken the hour a ground force
// reaches its heart (the city point, the province centre the rules use), not on crossing the border nor at another spot in it; with defenders the
// battle comes first, then reaching the heart takes it at once; ground forces board ships only in a naval port (an own or friendly coastal city),
// which takes EMBARK_H hours; a landing takes LAND_H hours (LAND_PORT_H into an own port; Amphibious Doctrine halves it); the AI follows the same
// rules; saves keep the countdowns and old saves load.
// node .test/capture-landing.js  (rules only, no browser; exit 1 on any failed check or error)
const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..');
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + `\nreturn {IM, get S(){ return S; }, get G(){ return G; }, addArmy, setRel, count, tick, restore, saveJSON,
  orderMove, orderSpot, haltArmy, armyXY, pathFor, portOk, embarkWhy, atHeart, capturable, embarkH, landH, etaHours, provOfPt, cellCenter, index, splitArmy,
  EMBARK_H, LAND_H, LAND_PORT_H, HEART_R, CAP_MIN, NEUTRAL, resetVis(){ visCache = null; }};`;
const errors = [], checks = {}, ok = (k, v, i) => { checks[k] = v ? 'PASS' : 'FAIL ' + JSON.stringify(i ?? null); };
const run = (k, f) => { try { f(); } catch (e){ errors.push(k + ': ' + e.stack.split('\n').slice(0, 3).join(' | ')); } };
function game(seats = [0], clear = true){ const R = new Function(SRC)(); R.IM.api.newGame(77, 0, seats); R.S.started = true; if (clear) R.S.armies.length = 0; R.resetVis(); return R; }
const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const tickTill = (R, f, n = 400) => { for (let i = 0; i < n && !f(); i++) R.tick(); return f(); };
// an own land province A next to an enemy one B (nation o, set at war) that is big enough for a point well short of its heart and one beyond it
function warPair(R, n){ const { G, S } = R;
  for (const A of G.P){ if (A.sea || S.owner[A.id] !== n) continue;
    for (const b of A.nb.keys()){ const B = G.P[b], o = S.owner[b]; if (B.sea || o < 0 || o === n || B.cells.length < 60) continue;
      const cs = B.cells.map(c => [R.cellCenter(c), 0]).map(([q]) => [q, d(q, [A.x, A.y])]).sort((x, y) => x[1] - y[1]), H = [B.x, B.y];
      const near = cs.find(([q]) => d(q, H) > R.HEART_R*2 && d(q, [A.x, A.y]) < d(H, [A.x, A.y]) - R.HEART_R), far = cs[cs.length - 1][0];
      if (!near || d(far, H) < R.HEART_R*2) continue; R.setRel(n, o, 'war'); return {A, B, o, near:near[0], far}; } }
  return null; }
// a sea zone next to own land province p
const zoneBy = (R, p) => R.G.P[p].nbs.find(v => R.G.P[v].sea);
const ports = (R, n) => R.G.P.filter(P => !P.sea && P.coast && P.city && R.S.owner[P.id] === n && zoneBy(R, P.id) != null);
const plainCoasts = (R, n) => R.G.P.filter(P => !P.sea && P.coast && !P.city && R.S.owner[P.id] === n && zoneBy(R, P.id) != null);

// 1. capture at the heart: not on crossing the border, not at another spot; the hour the force reaches the heart, at once
run('heart', () => { const R = game([0]), S = R.S, n = 0, pr = warPair(R, n); ok('found an enemy neighbour', !!pr); if (!pr) return; const { A, B, o, near } = pr;
  ok('the province is one to capture', R.capturable(n, B.id) && !R.capturable(n, A.id));
  const a = R.addArmy(n, A.id, {inf:6, tank:2}); a.m = 90; R.orderMove(a, B.id, near);
  tickTill(R, () => a.at === B.id && !a.sail && !a.path.length && a.to === null, 300);
  ok('a force stopped at a spot short of the heart stands in the province', a.at === B.id && a.pos && d(a.pos, near) < 1e-9 && R.index()[B.id].includes(a), {at:a.at, pos:a.pos});
  for (let i = 0; i < 72; i++) R.tick();
  ok('three days at that spot: still not captured (no occupation clock)', S.owner[B.id] === o && !R.atHeart(a), S.owner[B.id]);
  R.orderSpot(a, B.x, B.y); let hour = -1, atH = -1;
  for (let i = 0; i < 200 && S.owner[B.id] !== n; i++){ R.tick(); if (atH < 0 && R.atHeart(a)) atH = i; if (S.owner[B.id] === n) hour = i; }
  ok('walking to the heart captures it the hour it gets there, and not before', hour >= 0 && hour === atH, {hour, atH});
  // a whole move to the province centre (no point): taken the hour the force arrives
  const pr2 = (() => { for (const v of B.nbs){ const o2 = S.owner[v]; if (!R.G.P[v].sea && o2 >= 0 && o2 !== n && R.G.P[v].cells.length >= 20){ R.setRel(n, o2, 'war'); return v; } } return -1; })();
  if (pr2 >= 0){ const own0 = S.owner[pr2], b = R.addArmy(n, B.id, {inf:4}); R.orderMove(b, pr2); let arr = -1, cap = -1;
    for (let i = 0; i < 300 && S.owner[pr2] !== n; i++){ const was = b.at; R.tick(); if (arr < 0 && b.at === pr2 && was !== pr2) arr = i; if (S.owner[pr2] === n) cap = i; }
    ok('a move to the centre: captured the hour it arrives', arr >= 0 && cap === arr && own0 !== n, {arr, cap}); }
  // a point beyond the heart: the walk goes by the city and takes the province on the way
  const R3 = game([0]), q = warPair(R3, n), c = R3.addArmy(n, q.A.id, {inf:6}); R3.orderMove(c, q.B.id, q.far);
  tickTill(R3, () => c.at === q.B.id, 300); ok('beyond the heart: the walk goes by the city', !!c.sail && !!c.sail.nx && d(c.sail.to, [q.B.x, q.B.y]) < 1e-9, c.sail);
  ok('not captured on crossing the border', R3.S.owner[q.B.id] === q.o);
  let tk = -1; for (let i = 0; i < 200 && c.sail; i++){ R3.tick(); if (tk < 0 && R3.S.owner[q.B.id] === n) tk = i; }
  ok('captured at the city on the way, then on to the point', tk >= 0 && d(R3.armyXY(c), q.far) < 1e-9, {tk, xy:R3.armyXY(c)});
  // independent land follows the same rule; one ground unit (below CAP_MIN) does not capture; air units never do
  const R4 = game([0]), S4 = R4.S; let A4 = null, B4 = null;
  for (const P of R4.G.P){ if (P.sea || S4.owner[P.id] !== n) continue; const v = P.nbs.find(x => !R4.G.P[x].sea && S4.owner[x] === R4.NEUTRAL); if (v != null){ A4 = P; B4 = R4.G.P[v]; break; } }
  if (B4){ S4.armies = S4.armies.filter(x => x.at !== B4.id); const one = R4.addArmy(n, B4.id, {inf:1}); R4.tick(); ok('one ground unit at the heart of independent land: no capture (CAP_MIN)', S4.owner[B4.id] === R4.NEUTRAL && R4.CAP_MIN > 1);
    one.u.inf = 2; R4.tick(); ok('two at the heart: independent land captured at once', S4.owner[B4.id] === n); } });

// 2. defenders: the battle comes first, then reaching the heart takes the province at once
run('defenders', () => { const R = game([0]), S = R.S, n = 0, pr = warPair(R, n); if (!pr) return; const { A, B, o, near } = pr;
  const e = R.addArmy(o, B.id, {inf:1}); e.m = 40; const a = R.addArmy(n, A.id, {inf:8, tank:4}); a.m = 95; R.orderMove(a, B.id);
  let battle = false, capWhileFoe = false, endH = -1, capH = -1;
  for (let i = 0; i < 300 && S.owner[B.id] !== n; i++){ R.tick(); const foe = S.armies.some(x => x.owner === o && x.at === B.id && x.to === null && R.count(x));
    if (S.battles.includes(B.id)) battle = true; if (foe && S.owner[B.id] === n) capWhileFoe = true; if (endH < 0 && battle && !foe) endH = i; if (S.owner[B.id] === n) capH = i; }
  ok('a battle was fought for the province', battle);
  ok('no capture while defenders hold it', !capWhileFoe);
  ok('captured the hour the last defender is gone (the force at the heart)', capH >= 0 && capH === endH, {endH, capH});
  // defenders gone while the force stands short of the heart: no capture until it walks there
  const R2 = game([0]), q = warPair(R2, n), e2 = R2.addArmy(q.o, q.B.id, {inf:1}); e2.m = 40; const b = R2.addArmy(n, q.A.id, {inf:8, tank:4}); b.m = 95; R2.orderMove(b, q.B.id, q.near);
  tickTill(R2, () => !R2.S.armies.some(x => x.owner === q.o && x.at === q.B.id && R2.count(x)) && b.at === q.B.id && !b.sail, 400); for (let i = 0; i < 24; i++) R2.tick();
  ok('defenders beaten from a spot short of the heart: still not captured', R2.S.owner[q.B.id] === q.o && b.at === q.B.id, {owner:R2.S.owner[q.B.id], at:b.at});
  R2.orderSpot(b, q.B.x, q.B.y); tickTill(R2, () => R2.S.owner[q.B.id] === n, 200); ok('then reaching the heart takes it', R2.S.owner[q.B.id] === n && R2.atHeart(b)); });

// 3. embarking only in a naval port: refused elsewhere (with the reason), routes overseas go by a port, and it takes EMBARK_H hours there
run('embark', () => { const R = game([0]), S = R.S, G = R.G, n = 0, P0 = ports(R, n)[0], C0 = plainCoasts(R, n)[0];
  ok('found an own port and a coast without a port', !!P0 && !!C0); if (!P0 || !C0) return;
  ok('a port is an own or friendly coastal city (portOk)', R.portOk(n, P0.id) && !R.portOk(n, C0.id));
  const a = R.addArmy(n, C0.id, {inf:3}), z = zoneBy(R, C0.id); R.orderMove(a, z);
  ok('to sea from a coast without a port: refused', !a.path.length && a.to === null, a.path);
  ok('the reason the page shows', R.embarkWhy(a, z) === 'No naval port here: march to a port to embark.', R.embarkWhy(a, z));
  // a route from there to land overseas: it marches to a port first and boards only there
  const far = G.P.find(P => !P.sea && S.owner[P.id] === n && P.id !== C0.id && R.pathFor({owner:n, u:{inf:1}, w:{}, air:null}, C0.id, P.id).some(v => G.P[v].sea));
  let okR = true, any = false; for (const P of G.P){ if (P.sea || P.id === C0.id) continue; const pth = R.pathFor(a, C0.id, P.id); let u = C0.id;
    for (const v of pth){ if (!G.P[u].sea && G.P[v].sea){ any = true; if (!R.portOk(n, u)) okR = false; } u = v; } if (any && !okR) break; }
  ok('routes overseas embark only in ports', any && okR, {any, okR, far:far && far.id});
  // at a port: allowed, and it sits there EMBARK_H hours before it sails
  const b = R.addArmy(n, P0.id, {inf:3}), z0 = zoneBy(R, P0.id); R.orderMove(b, z0); ok('to sea from a port: allowed', b.path.length === 1 && R.embarkWhy(b, z0) === '');
  let left = -1; const seen = []; for (let i = 1; i <= 20 && b.to === null; i++){ R.tick(); seen.push(b.emb); if (b.to !== null) left = i; }
  ok(`it waits EMBARK_H (${R.EMBARK_H}) hours in the port, then sets off`, left === R.EMBARK_H + 1 && seen[0] === R.EMBARK_H && seen[R.EMBARK_H - 1] === 1, {left, seen});
  ok('embarking done: no count left', b.emb == null);
  // the forecast counts the embarking
  const c = R.addArmy(n, P0.id, {inf:3}), e0 = R.etaHours(c, [z0]); ok('etaHours counts the embarking', e0 >= R.EMBARK_H + 1, e0);
  // Halt cancels the embarking
  R.orderMove(c, z0); R.tick(); R.tick(); R.haltArmy(c); R.tick(); ok('Halt cancels the embarking', c.emb == null && c.to === null && !c.path.length);
  // a port lost before the force sets off: the route is planned again through a port, or the force stops
  const d0 = R.addArmy(n, P0.id, {inf:2}); R.orderMove(d0, z0); R.tick(); S.owner[P0.id] = 1; R.tick(); S.owner[P0.id] = n;
  ok('no port any more: it does not board there', d0.to === null && (!d0.path.length || !G.P[d0.path[0]].sea), d0.path); });

// 4. landing takes LAND_H hours on a coast, LAND_PORT_H into an own port; Amphibious Doctrine halves it; no capture before it is ashore
run('landing', () => { const R = game([0]), S = R.S, G = R.G, n = 0, C0 = plainCoasts(R, n)[0], P0 = ports(R, n)[0]; if (!C0 || !P0) return;
  const land = (to, pre) => { const z = zoneBy(R, to), a = R.addArmy(n, z, {inf:3}); if (pre) pre(a); R.orderMove(a, to); let arr = -1, free = -1;
    for (let i = 0; i < 400 && free < 0; i++){ R.tick(); if (arr < 0 && a.at === to) arr = i; if (arr >= 0 && !(a.land > 0)) free = i; }
    const h0 = arr >= 0 ? free - arr : -1; S.armies.splice(S.armies.indexOf(a), 1); return h0; };
  ok(`an open coast: LAND_H (${R.LAND_H}) hours`, land(C0.id) === R.LAND_H, land(C0.id));
  ok(`into an own port: LAND_PORT_H (${R.LAND_PORT_H}) hours`, land(P0.id) === R.LAND_PORT_H);
  S.nations[n].tech = S.nations[n].tech || {}; S.nations[n].tech.nav3 = 1;
  ok('Amphibious Doctrine halves both', land(C0.id) === Math.round(R.LAND_H/2) && land(P0.id) === Math.round(R.LAND_PORT_H/2));
  delete S.nations[n].tech.nav3;
  // while landing it cannot move on; once ashore it does (its route goes on)
  const z = zoneBy(R, C0.id), inl = C0.nbs.find(v => !G.P[v].sea && S.owner[v] === n), a = R.addArmy(n, z, {inf:3}); R.orderMove(a, C0.id); tickTill(R, () => a.at === C0.id, 200);
  if (inl != null){ R.orderMove(a, inl); let moved = -1; for (let i = 1; i <= 30 && moved < 0; i++){ R.tick(); if (a.to !== null || a.at !== C0.id) moved = i; }
    ok('a landing force cannot move on until ashore', moved === R.LAND_H - 1 || moved === R.LAND_H, moved); }
  // landing on an enemy coast with no defenders: captured only once ashore, at the heart
  let E = null; for (const P of G.P){ if (P.sea || !P.coast || S.owner[P.id] < 0 || S.owner[P.id] === n) continue; if (zoneBy(R, P.id) != null && !S.armies.some(x => x.at === P.id)){ E = P; break; } }
  if (E){ const o = S.owner[E.id]; R.setRel(n, o, 'war'); const b = R.addArmy(n, zoneBy(R, E.id), {inf:4}); R.orderMove(b, E.id); let arr = -1, cap = -1;
    for (let i = 0; i < 300 && cap < 0; i++){ R.tick(); if (S.armies.some(x => x.owner === o && x.at === E.id && x !== b)) break; if (arr < 0 && b.at === E.id) arr = i; if (S.owner[E.id] === n) cap = i; }
    ok('an enemy coast: captured the hour the landing ends, not before', arr >= 0 && cap === arr + R.landH(b, E.id), {arr, cap, h:R.landH(b, E.id)}); } });

// 5. saves: the embarking and landing countdowns are kept; a save from before (no fields, an occupation clock in S.cap) loads and plays on
run('saves', () => { const R = game([0]), S = R.S, n = 0, P0 = ports(R, n)[0], C0 = plainCoasts(R, n)[0]; if (!P0 || !C0) return;
  const b = R.addArmy(n, zoneBy(R, C0.id), {inf:3}); R.orderMove(b, C0.id); tickTill(R, () => b.at === C0.id, 200);
  const a = R.addArmy(n, P0.id, {inf:3}); R.orderMove(a, zoneBy(R, P0.id)); R.tick(); R.tick();
  const R2 = new Function(SRC)(); ok('the save loads', R2.restore(JSON.parse(R.saveJSON())) !== false);
  const a2 = R2.S.armies.find(x => x.id === a.id), b2 = R2.S.armies.find(x => x.id === b.id);
  ok('mid-embark: the count is kept', a2 && a2.emb === a.emb && a.emb > 0, {a:a.emb, a2:a2 && a2.emb});
  ok('mid-landing: the count is kept', b2 && b2.land === b.land && b.land > 0, {b:b.land, b2:b2 && b2.land});
  let same = true; for (let i = 0; i < 14; i++){ R.tick(); R2.tick(); if ((a.to === null) !== (a2.to === null) || (a.land || 0) !== (a2.land || 0) || (b.land || 0) !== (b2.land || 0)) same = false; }
  ok('and both games go on alike', same && a.to !== null && !(b.land > 0));
  // an old save: no fields, and a half-done occupation in S.cap (a force at an enemy province's centre)
  const R3 = game([0]), q = warPair(R3, n); if (!q) return; const c = R3.addArmy(n, q.A.id, {inf:4}); const o = JSON.parse(R3.saveJSON());
  const ca = o.armies.find(x => x.id === c.id); ca.at = q.B.id; delete ca.pos; o.cap[q.B.id] = {by:n, h:5};
  const R4 = new Function(SRC)(); ok('an old save with an occupation under way loads', R4.restore(o) !== false); R4.tick();
  ok('the occupation clock is gone and the force at the heart takes the province', !R4.S.cap[q.B.id] && R4.S.owner[q.B.id] === n, {cap:R4.S.cap[q.B.id], own:R4.S.owner[q.B.id]});
  const R5 = new Function(SRC)(); R5.IM.api.newGame(77, 0, [0]); const fx = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'eco-v1-save.json'), 'utf8')).save;
  ok('the old fixture save (eco v1) loads', R5.restore(fx) !== false); let err = ''; try { for (let i = 0; i < 30; i++) R5.tick(); } catch (e){ err = e.message; } ok('and plays on', !err, err); });

// 6. the AI follows the same rules: it boards ships only in ports, waits the embarking and landing times, and still takes independent land
run('ai', () => { const R = game([], false), S = R.S, G = R.G; let legs = 0, badLegs = [], embSeen = 0, landSeen = 0, caps = 0, offHeart = 0; const seen = new Set();
  R.IM.on('fxCapture', () => caps++);
  for (let h = 0; h < 24*20; h++){ R.tick();
    for (const a of S.armies){ if (a.owner < 0 || a.air || !R.count(a)) continue; if (a.emb != null) embSeen++; if (a.land > 0) landSeen++;
      if (a.to !== null && !G.P[a.at].sea && G.P[a.to].sea && a.u && Object.keys(a.u).some(t => a.u[t] > 0 && ['inf', 'at', 'art', 'sam', 'ifv', 'tank', 'mlrs', 'spec', 'para', 'jam'].includes(t))){ const k = a.id + ':' + a.at + '>' + a.to;
        if (!seen.has(k)){ seen.add(k); legs++; if (!R.portOk(a.owner, a.at)) badLegs.push(k); } } }
    if (h % 24 === 23) for (const a of S.armies) if (a.owner >= 0 && !a.air && a.to === null && !a.path.length && !a.sail && R.capturable(a.owner, a.at) && !R.atHeart(a) && R.count(a) >= R.CAP_MIN && !S.battles.includes(a.at) && !(a.land > 0)) offHeart++; }
  console.log('AI, 20 days of the classic world:', JSON.stringify({legsOntoWater:legs, embarkingHours:embSeen, landingHours:landSeen, captures:caps, offHeart}));
  ok('the AI boards ships only in ports', badLegs.length === 0, {legs, badLegs:badLegs.slice(0, 5)});
  ok('the AI waits to embark and to land (counts seen)', legs === 0 || embSeen > 0, {legs, embSeen, landSeen});
  ok('the AI still takes independent land', caps > 50, caps);
  ok('no AI force idles off the heart of land it is taking (daily look)', offHeart <= 2, offHeart); });

const bad = Object.entries(checks).filter(([, v]) => v !== 'PASS');
console.log(JSON.stringify({checks, errors}, null, 1));
console.log(bad.length || errors.length ? `FAILED ${bad.length} checks, ${errors.length} errors` : `OK ${Object.keys(checks).length} checks`, 'errors', errors);
process.exit(bad.length || errors.length ? 1 : 0);
