// Pinpoint movement (owner queue items 3 and 14): a move order goes to the exact point; the force counts in the province it stands in; crossing
// into the target province on the last leg is arriving there (battle, capture); ships stop on water at a point; Halt mid-leg on land and at sea;
// the last leg takes time in proportion to its length; old saves (no point) keep the province centres.
// Unit controls (owner item 1, pinpoint movement "isn't working"): also a split mid-route (both groups keep the point), a force arriving at a point
// by one of yours (it joins it, at that point; one arriving farther away stands apart), and part 2 in the page: a force ordered by a real tap at
// three zooms ends on the tapped point with its badge drawn there, a fleet at sea, after a save and a load, after a merge.
// node .test/pinpoint.js [--rules]  (part 2 needs bash tools/mkpage.sh; exit 1 on any failed check or error)
const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..');
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + `\nreturn {IM, get S(){ return S; }, get G(){ return G; }, addArmy, setRel, count, tick, restore, saveJSON,
  orderMove, orderSpot, haltArmy, armyXY, legH, legHours, legEnds, etaHours, provOfPt, ptIn, cellCenter, index, supplied, computeSupply, sailHours, KM_W, CAP_MIN, splitArmy, count, JOIN_R, resetVis(){ visCache = null; }};`;
const errors = [], checks = {}, ok = (k, v, i) => { checks[k] = v ? 'PASS' : 'FAIL ' + JSON.stringify(i ?? null); };
const run = (k, f) => { try { f(); } catch (e){ errors.push(k + ': ' + e.stack.split('\n').slice(0, 3).join(' | ')); } };
// a game with these seats (they give no orders), no forces on the map
function game(seats = [0]){ const R = new Function(SRC)(); R.IM.api.newGame(77, 0, seats); R.S.started = true; R.S.armies.length = 0; R.resetVis(); return R; }
const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
// two neighbouring land provinces of nation n (A, B), with B's cells sorted by distance from A's centre
function landPair(R, n, bOwner = n){ const { G, S } = R;
  for (const A of G.P){ if (A.sea || S.owner[A.id] !== n) continue;
    for (const b of A.nb.keys()){ const B = G.P[b]; if (B.sea || S.owner[b] !== bOwner || B.cells.length < 40 || R.legHours({owner:n, u:{inf:1}, w:{}}, A.id, b) < 6) continue;
      const cs = B.cells.map(c => [c, d(R.cellCenter(c), [A.x, A.y])]).sort((x, y) => x[1] - y[1]); return {A, B, near:R.cellCenter(cs[0][0]), far:R.cellCenter(cs[cs.length - 1][0])}; } }
  return null; }
const tickTill = (R, f, n = 400) => { for (let i = 0; i < n && !f(); i++) R.tick(); return f(); };

// 1. a land force ordered to a point near the border ends exactly there and counts in that province (combat, supply, capture, vision)
run('land point', () => { const R = game([0]), S = R.S, G = R.G, n = 0, pr = landPair(R, n); ok('found two own land provinces', !!pr); if (!pr) return;
  const { A, B, near } = pr, pt = [near[0] + 0.3, near[1] - 0.2], a = R.addArmy(n, A.id, {inf:3}); a.m = 80;
  R.orderMove(a, B.id, pt); ok('the order keeps the exact point', a.dest && a.dest.p === B.id && Math.abs(a.dest.x - pt[0]) < 1e-9 && Math.abs(a.dest.y - pt[1]) < 1e-9, a.dest);
  const arrived = tickTill(R, () => a.to === null && !a.path.length && !a.sail);
  ok('it arrives and stands at the exact point', arrived && a.pos && d(a.pos, pt) < 1e-9 && d(R.armyXY(a), pt) < 1e-9, {pos:a.pos, pt});
  ok('it belongs to the province it stands in', a.at === B.id && R.provOfPt(a.pos[0], a.pos[1]) === B.id && R.index()[B.id].includes(a) && !R.index()[A.id].includes(a));
  R.computeSupply(); ok('supplied in its province', R.supplied(a)); });

// 2. the last leg's time is in proportion to its length: a point near the border is reached sooner than the centre, a far point later
run('speed', () => { const R = game([0]), S = R.S, n = 0, pr = landPair(R, n); if (!pr) return; const { A, B, near, far } = pr;
  const hours = pt => { const a = R.addArmy(n, A.id, {inf:2}); R.orderMove(a, B.id, pt); const eta = R.etaHours(a); R.tick(); const lh = R.legH(a), base = R.legHours(a, A.id, B.id), [p1, p2] = R.legEnds(a);
    let h = 1; for (; h < 400 && (a.to !== null || a.path.length || a.sail); h++) R.tick(); S.armies.splice(S.armies.indexOf(a), 1); return {h, eta, lh, base, ratio:d(p1, p2)/d([A.x, A.y], [B.x, B.y])}; };
  const hn = hours(near), hc = hours(null), hf = hours(far);
  ok('leg time = province leg time x real length / centre length', Math.abs(hn.lh - hn.base*hn.ratio) < 1e-6 && Math.abs(hf.lh - hf.base*hf.ratio) < 1e-6 && Math.abs(hc.lh - hc.base) < 1e-9, {hn, hf, hc});
  ok('near the border: sooner than the centre; far side: later', hn.h < hc.h && hf.h > hc.h, {near:hn.h, centre:hc.h, far:hf.h});
  ok('the hours match the forecast (etaHours)', Math.abs(hn.h - hn.eta) <= 1 && Math.abs(hc.h - hc.eta) <= 1 && Math.abs(hf.h - hf.eta) <= 1, {hn, hc, hf});
  // deterministic: the same order twice gives the same hours and spot
  const R2 = game([0]), pr2 = landPair(R2, n), a2 = R2.addArmy(n, pr2.A.id, {inf:2}); R2.orderMove(a2, pr2.B.id, near); for (let i = 0; i < 5; i++) R2.tick();
  const R3 = game([0]), pr3 = landPair(R3, n), a3 = R3.addArmy(n, pr3.A.id, {inf:2}); R3.orderMove(a3, pr3.B.id, near); for (let i = 0; i < 5; i++) R3.tick();
  ok('deterministic', JSON.stringify(R2.armyXY(a2)) === JSON.stringify(R3.armyXY(a3)) && a2.at === a3.at); });

// 3. crossing into an enemy province on the last leg starts the battle (enemy force there) or the capture (none) right there, before the point
run('cross', () => { for (const foe of [true, false]){ const R = game([0]), S = R.S, G = R.G, n = 0;
    let pr = null, o = -1; for (const A of G.P){ if (A.sea || S.owner[A.id] !== n) continue; for (const b of A.nb.keys()){ const ob = S.owner[b]; if (G.P[b].sea || ob < 0 || ob === n || G.P[b].cells.length < 60) continue; o = ob; pr = landPair(R, n, ob); break; } if (pr) break; }
    ok(`found an enemy neighbour (${foe ? 'battle' : 'capture'})`, !!pr); if (!pr) continue; const { A, B, far } = pr; R.setRel(n, o, 'war');
    const a = R.addArmy(n, A.id, {inf:8, tank:4}); a.m = 90; if (foe){ const e = R.addArmy(o, B.id, {inf:1}); e.pos = far.slice(); }
    R.orderMove(a, B.id, far); let crossed = -1, hour = 0;
    for (; hour < 300 && a.at === A.id; hour++){ R.tick(); if (a.at === B.id){ crossed = hour; break; } }
    const s = R.armyXY(a);
    ok(`it enters the province when its spot crosses the border, short of the point (${foe ? 'battle' : 'capture'})`, crossed >= 0 && a.to === null && R.provOfPt(s[0], s[1]) === B.id && d(s, far) > 1, {crossed, s, far, sail:a.sail});
    // (capture at the heart, .test/capture-landing.js: the far side of enemy land lies beyond the city, so the walk goes by the city first)
    ok(`it walks on to the point, by the city (${foe ? 'battle' : 'capture'})`, !!a.sail && (d(a.sail.to, far) < 1e-9 || (!!a.sail.nx && d(a.sail.nx, far) < 1e-9 && d(a.sail.to, [B.x, B.y]) < 1e-9)), a.sail);
    if (foe){ for (let i = 0; i < 4; i++) R.IM.api.tickQ(); ok('the battle starts there', S.battles.includes(B.id), S.battles); const p0 = R.armyXY(a); R.tick(); ok('it holds while the battle lasts', !S.battles.includes(B.id) || d(R.armyXY(a), p0) < 1e-9); }
    else { ok('crossing the border does not capture it', S.owner[B.id] === o && !S.cap[B.id], S.owner[B.id]); tickTill(R, () => !a.sail, 200); ok('and it reaches the point', d(R.armyXY(a), far) < 1e-9); ok('having taken the province on the way, at its city', S.owner[B.id] === n); } } });

// 4. a fleet: to a point of a neighbouring sea zone (on water); a point on land is moved to the zone's nearest water; Halt mid-leg stops on water
run('fleet', () => { const R = game([0]), S = R.S, G = R.G, n = 0;
  const Z = G.P.find(P => P.sea && P.cells.length > 150 && [...P.nb.keys()].some(v => G.P[v].sea && G.P[v].cells.length > 150 && [...G.P[v].nb.keys()].some(w => !G.P[w].sea)));
  const Z2 = G.P[[...Z.nb.keys()].find(v => G.P[v].sea && G.P[v].cells.length > 150 && [...G.P[v].nb.keys()].some(w => !G.P[w].sea))];
  const water = R.cellCenter(Z2.cells[Math.floor(Z2.cells.length/3)]), f = R.addArmy(n, Z.id, {frig:2, crui:1});
  R.orderMove(f, Z2.id, water); tickTill(R, () => f.to === null && !f.path.length && !f.sail);
  ok('a fleet stops on water at the exact point', f.at === Z2.id && f.pos && d(f.pos, water) < 1e-9 && G.P[R.provOfPt(f.pos[0], f.pos[1])].sea, {pos:f.pos, water});
  // a point on land (a land cell next to the zone): the order takes the nearest water point of the zone instead
  const land = (() => { for (const c of Z.cells){ for (const v of Z.nb.keys()) if (!G.P[v].sea){ const cc = G.P[v].cells.reduce((b, x) => d(R.cellCenter(x), R.cellCenter(c)) < d(R.cellCenter(b), R.cellCenter(c)) ? x : b); return R.cellCenter(cc); } } })();
  R.orderMove(f, Z.id, land); ok('a point on land becomes the nearest water of the zone', f.dest && R.provOfPt(f.dest.x, f.dest.y) === Z.id && d([f.dest.x, f.dest.y], land) < 20, f.dest);
  tickTill(R, () => f.to === null && !f.path.length && !f.sail);
  ok('it ends on that water point', f.at === Z.id && f.pos && R.provOfPt(f.pos[0], f.pos[1]) === Z.id && d(f.pos, [f.dest ? f.dest.x : f.pos[0], f.dest ? f.dest.y : f.pos[1]]) < 1e-9);
  // Halt mid-leg at sea: on water, in the zone it now belongs to
  R.orderMove(f, Z2.id, water); tickTill(R, () => f.to !== null || !!f.sail, 20); R.tick(); R.tick(); const wasMoving = f.to !== null || !!f.sail; R.haltArmy(f);
  const hp = R.armyXY(f); ok('Halt mid-leg: the fleet stops on water in its zone', wasMoving && f.to === null && !f.sail && f.pos && R.provOfPt(hp[0], hp[1]) === f.at && G.P[f.at].sea, {at:f.at, hp});
  const at0 = f.at, p0 = hp.slice(); for (let i = 0; i < 6; i++) R.tick(); ok('and stays there', f.at === at0 && d(R.armyXY(f), p0) < 1e-9);
  // a point inside its own zone: it sails there (time), never instant
  R.orderMove(f, f.at, R.cellCenter(G.P[f.at].cells[0])); ok('a point in its own zone: it sails there over time', !!f.sail && R.sailHours(f) >= 1); });

// 5. Halt mid-leg on land (on the road, and walking inside the province): the force stays in the province its spot lies in, at that spot
run('halt land', () => { const R = game([0]), n = 0, pr = landPair(R, n); if (!pr) return; const { A, B, far } = pr, a = R.addArmy(n, A.id, {inf:3});
  R.orderMove(a, B.id, far); R.tick(); R.tick(); R.tick(); const moving = a.to !== null || !!a.sail, s0 = R.armyXY(a); R.haltArmy(a);
  ok('Halt on the road: it stands at its spot, in the province that spot lies in', moving && a.to === null && !a.path.length && a.pos && d(a.pos, s0) < 1e-6 && R.provOfPt(a.pos[0], a.pos[1]) === a.at, {moving, pos:a.pos, s0, at:a.at});
  const p0 = a.pos.slice(); for (let i = 0; i < 6; i++) R.tick(); ok('and stays there', d(R.armyXY(a), p0) < 1e-9);
  R.orderMove(a, a.at, R.cellCenter(R.G.P[a.at].cells[0])); ok('a point in its own province: it walks there (no free jump)', !!a.sail && R.sailHours(a) >= 1, {sail:a.sail});
  R.tick(); const s1 = R.armyXY(a); R.haltArmy(a); ok('Halt while walking: it stops where it is', !a.sail && d(R.armyXY(a), s1) < 1e-6 && R.provOfPt(a.pos[0], a.pos[1]) === a.at); });

// 6. old saves: forces without a point keep the province centres; a save with points loads them back
run('saves', () => { const R = game([0]), S = R.S, n = 0, pr = landPair(R, n); if (!pr) return; const { A, B, near } = pr;
  const a = R.addArmy(n, A.id, {inf:2}), b = R.addArmy(n, A.id, {inf:2}); R.orderMove(a, B.id, near); R.orderMove(b, B.id); R.tick();
  const o = JSON.parse(R.saveJSON()); for (const x of o.armies){ delete x.dest; delete x.pos; delete x.legFrom; delete x.sail; }
  const R2 = new Function(SRC)(); ok('an old save (no points) loads', R2.restore(o) !== false);
  const b2 = R2.S.armies.find(x => x.id === b.id); tickTill(R2, () => b2.to === null && !b2.path.length);
  ok('a force from an old save arrives at the province centre as before', b2.at === B.id && !b2.pos && d(R2.armyXY(b2), [B.x, B.y]) < 1e-9);
  const R3 = new Function(SRC)(); R3.restore(JSON.parse(R.saveJSON())); const a3 = R3.S.armies.find(x => x.id === a.id);
  ok('a new save keeps the point', a3.dest && Math.abs(a3.dest.x - near[0]) < 1e-9); tickTill(R3, () => a3.to === null && !a3.path.length && !a3.sail); ok('and the force still ends there', d(R3.armyXY(a3), near) < 1e-9); });

// 7. split and merge: a force split on the way keeps the point in both groups (they arrive there and join); a force arriving at a point by one of
// yours (within JOIN_R) joins it there and the joined force stays on that point; one arriving farther away stands apart on its own point
run('split merge', () => { const R = game([0]), S = R.S, n = 0, pr = landPair(R, n); if (!pr) return; const { A, B, near, far } = pr;
  const a = R.addArmy(n, A.id, {inf:4}); R.orderMove(a, B.id, near); R.tick(); const b = R.splitArmy(a);
  ok('split on the way: both groups keep the exact point', b && b.dest && a.dest && b.dest.x === a.dest.x && b.dest.y === a.dest.y, {a:a.dest, b:b && b.dest});
  tickTill(R, () => (!S.armies.includes(b) || (b.to === null && !b.path.length && !b.sail)) && a.to === null && !a.path.length && !a.sail);
  const left = [a, b].filter(x => S.armies.includes(x) && R.count(x) > 0);
  ok('they arrive at the point and join there (one force, all 4 units, on the point)', left.length === 1 && R.count(left[0]) === 4 && d(left[0].pos, near) < 1e-9, left.map(x => ({pos:x.pos, n:R.count(x)})));
  const c = R.addArmy(n, A.id, {inf:2}); R.orderMove(c, B.id, [near[0] + 1, near[1] + 1]); tickTill(R, () => !S.armies.includes(c) || (c.to === null && !c.path.length && !c.sail));
  ok('a force arriving by one of yours (within JOIN_R) joins it, which stays on its point', !S.armies.includes(c) || R.count(c) === 0 ? R.count(left[0]) === 6 && d(left[0].pos, near) < 1e-9 : false, {n:R.count(left[0]), pos:left[0].pos});
  const e = R.addArmy(n, A.id, {inf:1}), fp = far; R.orderMove(e, B.id, fp); tickTill(R, () => e.to === null && !e.path.length && !e.sail);
  ok('one arriving farther away stands apart on its own point', S.armies.includes(e) && R.count(e) === 1 && d(e.pos, fp) < 1e-9 && d(fp, near) > R.JOIN_R, {pos:e.pos, fp}); });

// Part 2: in the page (a player's real taps, 1440x900): three zooms, a fleet, save and load, merge
async function pagePart(){ const pickNation = require('./pick-nation.js'), { chromium } = require('playwright');
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }), ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }), p = await ctx.newPage();
  p.on('pageerror', e => errors.push('page: ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
  await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 });
  const R = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im, S = im.S; S.speed = 0; for (const a of S.armies) if (a.owner === 0) for (const t in a.u) a.u[t] = 0; removeEmpty();
    const r = document.getElementById('map').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const view = (xy, hp) => p.evaluate(([x, y, hp, w, h]) => { const v = window.__im.view, s = hp/12; v.s = s; v.x = w/2 - x*s; v.y = h/2 - y*s; }, [xy[0], xy[1], hp, R.w, R.h]);
  const scr = xy => p.evaluate(([x, y]) => window.__im.toScreen(x, y), xy), click = (x, y) => p.mouse.click(R.x + x, R.y + y);
  const info = id => p.evaluate(id => { const f = window.__im.S.armies.find(q => q.id === id); return f && { at: f.at, pos: f.pos, dest: f.dest, idle: f.to === null && !f.path.length && !f.sail, n: count(f) }; }, id);
  const badge = id => p.evaluate(id => { const L = window.__im.hits, h = L.find(h => h.own && h.own.includes(id) && !h.tag); return h ? [h.cx, h.cy] : null; }, id);
  const march = async id => { await p.evaluate(() => { window.__im.S.speed = 5; }); for (let i = 0; i < 500; i++){ const v = await info(id); if (!v || v.idle) break; await p.waitForTimeout(80); } await p.evaluate(() => { window.__im.S.speed = 0; window.__im.clearSel(); }); };
  // provinces: Hessen -> Thüringen, a point of Thüringen off its centre (two hexes or more)
  const sc = await p.evaluate(() => { const im = window.__im, G = im.G, by = n => G.P.find(q => q.name === n && !q.sea), A0 = by('Hessen'), B0 = by('Thüringen');
    const pts = B0.cells.map(c => cellCenter(c)).filter(q => !im.isWet(q[0], q[1]) && Math.hypot(q[0] - B0.x, q[1] - B0.y) > 6).sort((q, r) => Math.hypot(q[0] - A0.x, q[1] - A0.y) - Math.hypot(r[0] - A0.x, r[1] - A0.y));
    return { A: A0.id, Ac: [A0.x, A0.y], B: B0.id, Bc: [B0.x, B0.y], pts: pts.slice(0, 3), far: pts[pts.length - 1] }; });
  for (const [i, hp] of [30, 60, 110].entries()){
    const id = await p.evaluate(([A, Ac, i]) => { const f = window.__im.addArmy(0, A, { inf: 2 }); f.pos = ptIn(A, Ac[0] - 3 + i*2, Ac[1] - 2); return f.id; }, [sc.A, sc.Ac, i]);
    await view([(sc.Ac[0] + sc.Bc[0])/2, (sc.Ac[1] + sc.Bc[1])/2], hp); await p.waitForTimeout(1200);
    const h = await badge(id); if (h) await click(h[0], h[1]); await p.waitForTimeout(200);
    const tp = sc.pts[i], T = await scr(tp); await click(T[0], T[1]); await p.waitForTimeout(200); const w = await p.evaluate(([x, y]) => window.__im.view && [(x - window.__im.view.x)/window.__im.view.s, (y - window.__im.view.y)/window.__im.view.s], T);
    const o = await info(id); ok(`page, zoom ${hp}: one tap orders the force to the tapped point`, o.dest && o.dest.p === sc.B && Math.hypot(o.dest.x - w[0], o.dest.y - w[1]) < 0.05, { dest: o.dest, w });
    await march(id); const e = await info(id); await view(e.pos, hp); await p.waitForTimeout(1500); const bd = await badge(id), P = await scr(e.pos);
    ok(`page, zoom ${hp}: it ends on that point, its badge drawn there (within 3 px)`, e.at === sc.B && Math.hypot(e.pos[0] - w[0], e.pos[1] - w[1]) < 0.05 && bd && Math.hypot(bd[0] - P[0], bd[1] - P[1]) <= 3, { e, w, bd, P });
    await p.evaluate(id => { const f = window.__im.S.armies.find(q => q.id === id); for (const t in f.u) f.u[t] = 0; removeEmpty(); }, id); }   // (each zoom's force goes: no counter of the next one is laid over it)
  // save and load mid-route: ordered by a tap, saved two hours on, loaded: it goes on to its point and is drawn there
  { const id = await p.evaluate(([A, Ac]) => { const f = window.__im.addArmy(0, A, { inf: 2 }); f.pos = ptIn(A, Ac[0] - 2, Ac[1] - 1); return f.id; }, [sc.A, sc.Ac]);
    await view([(sc.Ac[0] + sc.Bc[0])/2, (sc.Ac[1] + sc.Bc[1])/2], 60); await p.waitForTimeout(1200); const h = await badge(id); if (h) await click(h[0], h[1]); await p.waitForTimeout(200);
    const T = await scr(sc.far); await click(T[0], T[1]); await p.waitForTimeout(200); const w = await p.evaluate(([x, y]) => [(x - window.__im.view.x)/window.__im.view.s, (y - window.__im.view.y)/window.__im.view.s], T);
    await p.evaluate(() => { tick(); window.__sv = saveJSON(); }); const okLoad = await p.evaluate(() => window.__im.restore(JSON.parse(window.__sv)) !== false);
    const mid = await info(id); await march(id); const e = await info(id); await view(e.pos, 60); await p.waitForTimeout(1500); const bd = await badge(id), P = await scr(e.pos);
    ok('page: saved and loaded on the way, the force goes on to the tapped point, its badge drawn there', okLoad && mid && !mid.idle && e.at === sc.B && Math.hypot(e.pos[0] - w[0], e.pos[1] - w[1]) < 0.05 && bd && Math.hypot(bd[0] - P[0], bd[1] - P[1]) <= 3, { mid, e, w, bd, P });
    sc.first = { id, pos: e.pos }; }
  // merge: a force sent (right-click on the badge's spot) to the point of another joins it there; the joined force stays on the point, drawn there
  { const id2 = await p.evaluate(([A, Ac]) => { const f = window.__im.addArmy(0, A, { tank: 1 }); f.pos = ptIn(A, Ac[0], Ac[1] + 2); return f.id; }, [sc.A, sc.Ac]);
    await view([(sc.Ac[0] + sc.Bc[0])/2, (sc.Ac[1] + sc.Bc[1])/2], 60); await p.waitForTimeout(1200); const h = await badge(id2); if (h) await click(h[0], h[1]); await p.waitForTimeout(200);
    const T = await scr([sc.first.pos[0] + 0.4, sc.first.pos[1] + 0.3]); await p.mouse.click(R.x + T[0], R.y + T[1], { button: 'right' }); await p.waitForTimeout(200); await march(id2);
    const e1 = await info(sc.first.id), e2 = await info(id2); await view(sc.first.pos, 60); await p.waitForTimeout(1500); const bd = await badge(sc.first.id), P = await scr(sc.first.pos);
    ok('page: a force sent to the point of another joins it there; the joined force stays on the point, drawn there', e1 && e1.n === 3 && (!e2 || e2.n === 0) && Math.hypot(e1.pos[0] - sc.first.pos[0], e1.pos[1] - sc.first.pos[1]) < 1e-9 && bd && Math.hypot(bd[0] - P[0], bd[1] - P[1]) <= 3, { e1, e2, bd, P }); }
  // a fleet at sea: one tap to a point of the next sea zone; it ends there, its badge drawn there
  { const f = await p.evaluate(() => { const im = window.__im, G = im.G, Z = [...G.P[473].nb.keys()].map(v => G.P[v]).filter(q => q.sea).sort((x, y) => y.cells.length - x.cells.length)[0], Z2 = G.P[[...Z.nb.keys()].filter(v => G.P[v].sea).sort((x, y) => G.P[y].cells.length - G.P[x].cells.length)[0]];
      const a = im.addArmy(0, Z.id, { frig: 2, crui: 1 }); a.pos = [Z.x, Z.y]; const w = Z2.cells.map(c => cellCenter(c)).filter(q => im.isWet(q[0], q[1])).sort((q, r) => Math.hypot(q[0] - Z.x, q[1] - Z.y) - Math.hypot(r[0] - Z.x, r[1] - Z.y))[3]; return { id: a.id, Zc: [Z.x, Z.y], w }; });
    await view([(f.Zc[0] + f.w[0])/2, (f.Zc[1] + f.w[1])/2], 40); await p.waitForTimeout(1200); const h = await badge(f.id); if (h) await click(h[0], h[1]); await p.waitForTimeout(200);
    const T = await scr(f.w); await click(T[0], T[1]); await march(f.id); const e = await info(f.id); await view(e.pos, 60); await p.waitForTimeout(1500); const bd = await badge(f.id), P = await scr(e.pos);
    ok('page: a fleet ordered by a tap ends on that water point, its badge drawn there', e && Math.hypot(e.pos[0] - f.w[0], e.pos[1] - f.w[1]) < 0.6 && bd && Math.hypot(bd[0] - P[0], bd[1] - P[1]) <= 3, { e, w: f.w, bd, P }); }
  await b.close(); }

(async () => {
  if (!process.argv.includes('--rules')) await pagePart().catch(e => errors.push('page: ' + (e.stack || e).toString().split('\n').slice(0, 3).join(' | ')));
  const bad = Object.entries(checks).filter(([, v]) => v !== 'PASS');
  console.log(JSON.stringify({checks, errors}, null, 1));
  console.log(bad.length || errors.length ? `FAILED ${bad.length} checks, ${errors.length} errors` : `OK ${Object.keys(checks).length} checks`, 'errors', errors);
  process.exit(bad.length || errors.length ? 1 : 0); })();
