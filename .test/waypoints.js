// Waypoints (owner item 4): a move order through several stops in order (rules/movement.js addStop, undoStop, stopNext, stopsEta; rules/tick.js).
// Part 1, the rules in plain Node: 3 stops reached in order, each at its exact point; Undo removes the last stop (and with one left, cancels the
// order); a save made mid-route loads and goes on to every stop; a plain move order, Halt and a split; a stop in enemy land captures only at the
// heart; a stop overseas embarks only in a port; the AI never has stops. Part 2, the page (Playwright, 1440x900 and a phone): the Waypoint button
// in the command bar, each tap adds a stop drawn as a numbered dot on the path line, Undo (and Backspace) removes the last, turning the button
// off keeps the stops, a plain tap gives no order, Move then a tap clears them; the force passes the stops in order on the map.
//   node .test/waypoints.js [--rules]     (run bash tools/mkpage.sh first for part 2; exit 1 on any failed check or error)
const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..');
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + `\nreturn {IM, get S(){ return S; }, get G(){ return G; }, addArmy, setRel, tick, restore, saveJSON,
  orderMove, haltArmy, addStop, undoStop, stopsOf, stopsEta, splitArmy, armyXY, provOfPt, cellCenter, portOk, pathFor, resetVis(){ visCache = null; }};`;
const errors = [], checks = {}, log = [], ok = (k, v, i) => { checks[k] = v ? 'PASS' : 'FAIL ' + JSON.stringify(i ?? null); log.push(`${v ? 'PASS' : 'FAIL'}  ${k}${v ? '' : '  ' + JSON.stringify(i ?? null)}`); };
const run = (k, f) => { try { f(); } catch (e){ errors.push(k + ': ' + e.stack.split('\n').slice(0, 3).join(' | ')); } };
function game(seats = [0]){ const R = new Function(SRC)(); R.IM.api.newGame(77, 0, seats); R.S.started = true; R.S.armies.length = 0; R.resetVis(); return R; }
const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const idle = a => a.to === null && !a.path.length && !a.sail;
// three own land provinces in a chain A - B - C - D (each a neighbour of the one before), with a point inside each of B, C, D off its centre
function chain(R, n){ const { G, S } = R, own = p => !G.P[p].sea && S.owner[p] === n && G.P[p].cells.length >= 30;
  for (const A of G.P){ if (!own(A.id)) continue; for (const b of A.nb.keys()){ if (!own(b)) continue; for (const c of G.P[b].nb.keys()){ if (c === A.id || !own(c) || G.P[A.id].nb.has(c)) continue;
    for (const e of G.P[c].nb.keys()){ if (e === b || e === A.id || !own(e) || G.P[b].nb.has(e)) continue; const pt = p => { const P = G.P[p], cs = P.cells.map(x => R.cellCenter(x)).filter(q => d(q, [P.x, P.y]) > 2 && d(q, [P.x, P.y]) < 8); return cs[0] || [P.x, P.y]; };
      return {A:A.id, stops:[b, c, e].map(p => ({p, xy:pt(p)}))}; } } } }
  return null; }
const tickTill = (R, f, n = 600) => { for (let i = 0; i < n && !f(); i++) R.tick(); return f(); };
let page = !process.argv.includes('--rules');

// 1. three stops, reached in order, each at its exact point; the order of arrival is recorded hour by hour
run('three stops', () => { const R = game([0]), S = R.S, n = 0, C = chain(R, n); ok('found a chain of three own provinces', !!C); if (!C) return;
  const a = R.addArmy(n, C.A, {inf:3}); for (const s of C.stops) R.addStop(a, s.p, s.xy);
  ok('the first stop is the order, the other two wait in a.wp', a.dest && a.dest.p === C.stops[0].p && a.wp && a.wp.length === 2 && a.wp[0].p === C.stops[1].p && a.wp[1].p === C.stops[2].p, {dest:a.dest, wp:a.wp});
  ok('stopsOf lists the three stops in order', JSON.stringify(R.stopsOf(a).map(q => q.p)) === JSON.stringify(C.stops.map(s => s.p)));
  const eta = R.stopsEta(a); ok('stopsEta: an hour forecast for each stop, rising', eta.length === 3 && eta.every(h => h > 0) && eta[0] < eta[1] && eta[1] < eta[2], eta);
  const seen = []; let h = 0, atStop = null; for (; h < 600 && !(idle(a) && !a.wp); h++){ R.tick(); for (let k = 0; k < 3; k++) if (!seen.includes(k) && a.pos && d(a.pos, C.stops[k].xy) < 1e-6 && a.at === C.stops[k].p) seen.push(k);
    if (atStop === null && idle(a) && a.wp) atStop = {n:R.stopsOf(a).length, wp:a.wp.length, eta:R.stopsEta(a)}; }
  ok('standing at a stop until the hour turns, the stops still to come are listed with their hours', atStop && atStop.n === atStop.wp && atStop.n > 0 && atStop.eta.length === atStop.n && atStop.eta.every(x => x > 0), atStop);
  ok('it passes the stops in order 1, 2, 3', JSON.stringify(seen) === '[0,1,2]', seen);
  ok('and ends at the exact point of the last stop', a.at === C.stops[2].p && d(a.pos, C.stops[2].xy) < 1e-9, {at:a.at, pos:a.pos});
  ok('the hours match the forecast (within 2 h)', Math.abs(h - eta[2]) <= 2, {h, eta});
  ok('no stops left', !a.wp && !a.dest); });

// 2. Undo: the last stop goes; with only the stop it heads for left, Undo cancels the order (the force stops where it is)
run('undo', () => { const R = game([0]), n = 0, C = chain(R, n); if (!C) return; const a = R.addArmy(n, C.A, {inf:3}); for (const s of C.stops) R.addStop(a, s.p, s.xy);
  ok('Undo removes the last stop (3 -> 2)', R.undoStop(a) && R.stopsOf(a).length === 2 && a.wp.length === 1 && a.wp[0].p === C.stops[1].p);
  ok('Undo again (2 -> 1): the plain order is left', R.undoStop(a) && R.stopsOf(a).length === 1 && !a.wp && a.dest && a.dest.p === C.stops[0].p);
  R.tick(); R.tick(); const s0 = R.armyXY(a); ok('Undo of the last stop cancels the order: it stops where it is', R.undoStop(a) && idle(a) && R.stopsOf(a).length === 0 && d(R.armyXY(a), s0) < 1e-6, {s0, now:R.armyXY(a)});
  ok('nothing left to undo', !R.undoStop(a)); });

// 3. save and load mid-route: the stops survive and are reached in order
run('save mid-route', () => { const R = game([0]), n = 0, C = chain(R, n); if (!C) return; const a = R.addArmy(n, C.A, {inf:3}); for (const s of C.stops) R.addStop(a, s.p, s.xy);
  tickTill(R, () => a.at === C.stops[0].p && idle(a)); R.tick(); R.tick(); const mid = JSON.parse(R.saveJSON());
  const m = mid.armies.find(x => x.id === a.id); ok('the save holds the stops still to come', !!m && ((m.wp && m.wp.length) || 0) + (m.dest ? 1 : 0) >= 2, m && {wp:m.wp, dest:m.dest});
  const R2 = new Function(SRC)(); ok('it loads', R2.restore(mid) !== false); const b = R2.S.armies.find(x => x.id === a.id);
  tickTill(R2, () => idle(b) && !b.wp); ok('after loading it goes on to the last stop', b.at === C.stops[2].p && d(b.pos, C.stops[2].xy) < 1e-9, {at:b.at, pos:b.pos});
  // the same game played on without the save: the same end (deterministic)
  tickTill(R, () => idle(a) && !a.wp); ok('the same as without saving', a.at === b.at && d(a.pos, b.pos) < 1e-9 && R.S.hour === R2.S.hour); });

// 4. a plain move order clears the stops; Halt clears them; a split force keeps a copy; turning the stops into a route is deterministic
run('clear', () => { const R = game([0]), n = 0, C = chain(R, n); if (!C) return; const a = R.addArmy(n, C.A, {inf:4});
  for (const s of C.stops) R.addStop(a, s.p, s.xy); R.orderMove(a, C.stops[0].p, C.stops[0].xy); ok('a new plain move order clears the stops', !a.wp && R.stopsOf(a).length === 1);
  for (const s of C.stops.slice(1)) R.addStop(a, s.p, s.xy); ok('stops added to a force under way go after its order', a.wp && a.wp.length === 2);
  const b = R.splitArmy(a); ok('a split group keeps the same stops', b && b.wp && b.wp.length === 2 && b.wp !== a.wp && JSON.stringify(b.wp) === JSON.stringify(a.wp));
  R.haltArmy(a); ok('Halt clears them', !a.wp && R.stopsOf(a).length === 0); });

// 5. a stop in enemy land: the force takes the province only at its heart (rules/movement.js capture at the heart), as with any order
run('enemy stop', () => { const R = game([0]), S = R.S, G = R.G, n = 0; let A = -1, B = -1, o = -1;
  for (const P of G.P){ if (P.sea || S.owner[P.id] !== n) continue; for (const b of P.nb.keys()){ const ob = S.owner[b]; if (G.P[b].sea || ob < 0 || ob === n || G.P[b].cells.length < 80) continue; A = P.id; B = b; o = ob; break; } if (B >= 0) break; }
  ok('found an enemy neighbour', B >= 0); if (B < 0) return; R.setRel(n, o, 'war');
  const P = G.P[B], near = G.P[B].cells.map(c => R.cellCenter(c)).filter(q => d(q, [P.x, P.y]) > 6).sort((p, q) => d(p, [G.P[A].x, G.P[A].y]) - d(q, [G.P[A].x, G.P[A].y]))[0];
  const a = R.addArmy(n, A, {inf:8, tank:4}); a.m = 90; R.addStop(a, B, near); R.addStop(a, A, [G.P[A].x + 0.5, G.P[A].y + 0.5]);
  tickTill(R, () => a.at === B && idle(a), 300); ok('it stands at the first stop, short of the heart', a.at === B && d(a.pos, near) < 1e-9 && d(a.pos, [P.x, P.y]) > 3, {pos:a.pos});
  ok('standing there short of the heart, it has not taken the province', S.owner[B] === o, S.owner[B]);
  tickTill(R, () => a.at === A && idle(a) && !a.wp, 300); ok('it goes on to the next stop', a.at === A);
  ok('and the enemy province is still the enemy\'s (never reached the heart)', S.owner[B] === o, S.owner[B]); });

// 6. a stop overseas: ground forces embark only in a naval port (rules/movement.js portOk); a fleet's stops are on water
run('sea', () => { const R = game([0]), S = R.S, G = R.G, n = 0;
  const port = G.P.find(P => !P.sea && S.owner[P.id] === n && R.portOk(n, P.id) && [...P.nb.keys()].some(v => G.P[v].sea));
  ok('found a port of yours', !!port); if (!port) return; const zone = [...port.nb.keys()].find(v => G.P[v].sea), Z = G.P[zone];
  const f = R.addArmy(n, zone, {frig:2}); const w1 = R.cellCenter(Z.cells[Math.floor(Z.cells.length/4)]), w2 = R.cellCenter(Z.cells[Math.floor(Z.cells.length*3/4)]);
  const z2 = [...Z.nb.keys()].find(v => G.P[v].sea && G.P[v].cells.length > 40), w3 = R.cellCenter(G.P[z2].cells[Math.floor(G.P[z2].cells.length/2)]);
  R.addStop(f, zone, w1); R.addStop(f, zone, w2); R.addStop(f, z2, w3); ok('a fleet takes three stops on water', R.stopsOf(f).length === 3, R.stopsOf(f));
  const seen = []; for (let h = 0; h < 400 && !(idle(f) && !f.wp); h++){ R.tick(); for (const [k, w] of [[0, w1], [1, w2], [2, w3]]) if (!seen.includes(k) && f.pos && d(f.pos, w) < 1e-6) seen.push(k); }
  ok('the fleet passes them in order', JSON.stringify(seen) === '[0,1,2]', seen); ok('on water at the last one', G.P[R.provOfPt(f.pos[0], f.pos[1])].sea && d(f.pos, w3) < 1e-9);
  // ground troops: a stop at sea from a province with no port is refused; from the port they embark there (EMBARK_H) before sailing
  const inland = G.P.find(P => !P.sea && S.owner[P.id] === n && P.nb.has(port.id) && ![...P.nb.keys()].some(v => G.P[v].sea));
  if (inland){ const g = R.addArmy(n, inland.id, {inf:2}); R.addStop(g, port.id, [port.x, port.y]); const okStop = R.addStop(g, zone, w1);
    ok('troops: a stop at sea after a stop in a port is accepted (they embark in the port)', okStop && g.wp && g.wp.length === 1);
    let embarked = false; for (let h = 0; h < 200 && !(idle(g) && !g.wp); h++){ R.tick(); if (g.emb != null && g.at === port.id) embarked = true; }
    ok('they embarked in the port, then reached the stop at sea', embarked && g.at === zone, {embarked, at:g.at}); } });

// 7. the AI never gives stops: a 3-day all-AI game leaves no a.wp anywhere
run('ai', () => { const R = new Function(SRC)(); R.IM.api.newGame(12345, 0, []); R.S.started = true; for (let i = 0; i < 72; i++) R.tick(); ok('no AI force has stops', !R.S.armies.some(a => a.wp)); });

// Part 2: the page, a player's taps (mouse on a desktop, touch on a phone)
async function pagePart(){ const pickNation = require('./pick-nation.js'), { chromium } = require('playwright');
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  for (const [TAG, W, H, DPR] of [['desk', 1440, 900, 1], ['phone', 390, 844, 2]]){ const PHONE = W <= 820;
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: PHONE, isMobile: false }), p = await ctx.newPage();
    p.on('pageerror', e => errors.push(TAG + ' pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) errors.push(TAG + ' console: ' + m.text()); });
    await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
    await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
    await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 });
    const sc = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im, S = im.S, G = im.G; S.speed = 0;
      for (const a of S.armies) if (a.owner === 0) for (const t in a.u) a.u[t] = 0; removeEmpty();
      // Bremen -> Hanover -> Sachsen-Anhalt -> Thüringen: three stops, each off its province's centre
      const by = n => G.P.find(q => q.name === n && !q.sea), A = by('Bremen'), st = [by('Hanover'), by('Sachsen-Anhalt'), by('Thüringen')];
      const a = im.addArmy(0, A.id, { inf: 3, tank: 1 }); a.pos = ptIn(A.id, A.x + 1, A.y + 1);
      const pt = P => { const c = P.cells.map(c => cellCenter(c)).filter(q => !im.isWet(q[0], q[1]) && Math.hypot(q[0] - P.x, q[1] - P.y) > 3).sort((q, r) => Math.hypot(q[0] - P.x, q[1] - P.y) - Math.hypot(r[0] - P.x, r[1] - P.y)); return c[0] || [P.x, P.y]; };
      return { a: a.id, A: [A.x, A.y], stops: st.map(P => ({ p: P.id, xy: pt(P), name: P.name })) }; });
    const R = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    const cx = (sc.A[0] + sc.stops[1].xy[0])/2, cy = (sc.A[1] + sc.stops[1].xy[1])/2;
    await p.evaluate(([x, y, hp, w, h]) => { const v = window.__im.view, s = hp/12; v.s = s; v.x = w/2 - x*s; v.y = h/2 - y*s; }, [cx, cy, 40, R.w, R.h*(PHONE ? 0.5 : 1)]); await p.waitForTimeout(1200);
    const cdp = PHONE ? await ctx.newCDPSession(p) : null, touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], i) => ({ x: R.x + x, y: R.y + y, id: i, radiusX: 4, radiusY: 4, force: 1 })) });
    const tap = async (x, y) => { if (PHONE){ await touch('touchStart', [[x, y]]); await p.waitForTimeout(60); await touch('touchEnd', []); } else await p.mouse.click(R.x + x, R.y + y); await p.waitForTimeout(250); };
    const scr = xy => p.evaluate(([x, y]) => window.__im.toScreen(x, y), xy);
    const stops = () => p.evaluate(id => { const a = window.__im.S.armies.find(q => q.id === id); return stopsOf(a).map(q => ({ p: q.p, x: q.x, y: q.y })); }, sc.a);
    const dots = async () => { await p.waitForTimeout(400); return p.evaluate(() => window.__im.pathDbg.dots); };
    const shot = n => process.env.WP_SHOTS ? p.screenshot({ path: `${process.env.WP_SHOTS}/wp-${TAG}-${n}.png` }) : null;
    const h = await p.evaluate(id => { const h = window.__im.hits.find(h => h.ids.includes(id)); return h && { x: h.x + h.w/2, y: h.y + h.h/2 }; }, sc.a); await tap(h.x, h.y);
    ok(`${TAG} page: the force is selected by a tap`, await p.evaluate(id => window.__im.sel.army === id, sc.a));
    ok(`${TAG} page: the Waypoint button is in the command bar`, await p.locator('#cmdbar [data-act="cm-wp"]').count() === 1);
    await p.click('#cmdbar [data-act="cm-wp"]'); await p.waitForTimeout(200);
    ok(`${TAG} page: Waypoint on (the button lit, the Undo button beside it)`, await p.evaluate(() => window.__im.wpMode) && await p.locator('#cmdbar [data-act="cm-wp"].on').count() === 1 && await p.locator('#cmdbar [data-act="cm-undo"]').count() === 1);
    for (const s0 of sc.stops){ const T = await scr(s0.xy); await tap(T[0], T[1]); }
    let S3 = await stops(), D3 = await dots(); await shot('3stops');
    ok(`${TAG} page: three taps, three stops in order at the tapped points`, S3.length === 3 && S3.every((q, i) => q.p === sc.stops[i].p && Math.hypot(q.x - sc.stops[i].xy[0], q.y - sc.stops[i].xy[1]) < 0.8), { S3, want: sc.stops });
    const T3 = await Promise.all(sc.stops.map(s0 => scr(s0.xy)));
    ok(`${TAG} page: three numbered dots drawn on the path line, on the stops`, D3 && D3.length === 3 && D3.every((d0, i) => Math.hypot(d0[0] - T3[i][0], d0[1] - T3[i][1]) < 5), { D3, T3 });
    await p.click('#cmdbar [data-act="cm-undo"]'); let S2 = await stops(), D2 = await dots(); await shot('undo');
    ok(`${TAG} page: Undo removes the last stop: two stops, two dots`, S2.length === 2 && D2 && D2.length === 2 && S2[1].p === sc.stops[1].p, { S2, D2 });
    if (!PHONE){ await p.keyboard.press('Backspace'); ok(`${TAG} page: Backspace removes the last stop too`, (await stops()).length === 1); const T = await scr(sc.stops[1].xy); await tap(T[0], T[1]); }
    { const T = await scr(sc.stops[2].xy); await tap(T[0], T[1]); }
    await p.click('#cmdbar [data-act="cm-wp"]'); await p.waitForTimeout(200);
    ok(`${TAG} page: turning Waypoint off keeps the stops`, !(await p.evaluate(() => window.__im.wpMode)) && (await stops()).length === 3);
    // the march: the force passes the stops in order (frames of it on the way)
    await p.evaluate(() => { window.__im.S.speed = 5; }); const seen = []; let fr = 0;
    for (let i = 0; i < 900; i++){ const v = await p.evaluate(id => { const a = window.__im.S.armies.find(q => q.id === id); return { pos: a.pos, at: a.at, idle: a.to === null && !a.path.length && !a.sail, wp: !!a.wp, h: window.__im.S.hour }; }, sc.a);
      for (let k = 0; k < 3; k++) if (!seen.includes(k) && v.pos && v.at === sc.stops[k].p && Math.hypot(v.pos[0] - sc.stops[k].xy[0], v.pos[1] - sc.stops[k].xy[1]) < 0.8){ seen.push(k); await shot('pass' + (k + 1)); fr++; }
      if (v.idle && !v.wp && seen.length === 3) break; await p.waitForTimeout(60); }
    await p.evaluate(() => { window.__im.S.speed = 0; });
    ok(`${TAG} page: on the map the force passes the stops in order 1, 2, 3`, JSON.stringify(seen) === '[0,1,2]', seen);
    // a plain tap (Waypoint off) is a new order: it clears the stops
    { await p.evaluate(id => { const im = window.__im; if (im.sel.army !== id) im.selectArmy(id); }, sc.a); for (const s0 of sc.stops.slice(0, 2)) await p.evaluate(([id, q]) => addStop(window.__im.S.armies.find(x => x.id === id), q.p, q.xy), [sc.a, s0]);
      const T = await scr(sc.stops[0].xy); await tap(T[0], T[1]); const S0 = await stops(); ok(`${TAG} page: a plain tap after waypoints gives no order (the stops stay, the force is deselected)`, S0.length === 2, S0);
      await p.evaluate(id => { const im = window.__im; im.selectArmy(id); const b = document.querySelector('[data-act="cm-move"]'); if (b) b.click(); }, sc.a); await p.waitForTimeout(150); await tap(T[0], T[1]); const S1 = await stops(); ok(`${TAG} page: Move, then a tap after waypoints is a new order (the stops are cleared)`, S1.length === 1 && S1[0].p === sc.stops[0].p, S1); }
    await ctx.close(); }
  await b.close(); }

(async () => {
  if (page) await pagePart().catch(e => errors.push('page: ' + (e.stack || e).toString().split('\n').slice(0, 3).join(' | ')));
  const bad = Object.entries(checks).filter(([, v]) => v !== 'PASS');
  console.log(log.join('\n'));
  console.log(bad.length || errors.length ? `FAILED ${bad.length} checks, ${errors.length} errors` : `OK ${Object.keys(checks).length} checks`, 'errors', errors);
  process.exit(bad.length || errors.length ? 1 : 0); })();
