// Unit controls like Conflict of Nations (owner items 1 and 3), played like a player with real mouse events (1440x900) and real touch events
// (390x844, touch through the Chrome DevTools protocol: taps, drags, a two-finger pinch, a long press):
//   select a force by tapping its badge (and, zoomed in, its pictures); a tap on the map never orders it (it deselects); Move (or Attack), then a tap
//   orders it to that exact point and it stays selected; the path line runs from the force to the tapped point with the ETA chip; the force ends on the tapped point and its badge is
//   drawn there (land, at three zooms, and a fleet at sea); a second tap on its destination, a tap on the force, or Esc deselects; a pan, a
//   pinch and a long press never give an order, a small jitter is still a tap; right-click moves; the Move button still works; a tap on
//   another force of yours selects it, on an enemy force orders the attack; a force pinned on a city is tapped by its badge.
//   node .test/controls.js [desk|phone]     (run bash tools/mkpage.sh first; prints PASS/FAIL lines; exit 1 on any failure or page error)
const pickNation = require('./pick-nation.js');
const { chromium } = require('playwright');
const ONLY = process.argv[2] || '', SHOTS = process.argv[3] || '';   // (a folder as the 2nd argument: screenshots of the select, Move and order steps)
const RES = [['desk', 1440, 900, 1], ['phone', 390, 844, 2]].filter(r => !ONLY || r[0] === ONLY);
const checks = {}, log = [], errors = [];
const ok = (k, v, info) => { checks[k] = !!v; log.push(`${v ? 'PASS' : 'FAIL'}  ${k}${v ? '' : '  ' + JSON.stringify(info ?? null)}`); };
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  for (const [TAG, W, H, DPR] of RES){
    const PHONE = W <= 820;
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: PHONE, isMobile: false });
    const p = await ctx.newPage(); const cdp = PHONE ? await ctx.newCDPSession(p) : null; try {
    p.on('pageerror', e => errors.push(TAG + ' pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) errors.push(TAG + ' console: ' + m.text()); });
    await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
    await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
    await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 });
    // the scene: your forces cleared away, one infantry force standing at a spot of a German province A, the neighbour B, a French force at war in a
    // province C next to A, a second force of yours in A; and a fleet in the Baltic
    const sc = await p.evaluate(() => { document.querySelectorAll('.toast,[data-act="tip-ok"]').forEach(t => t.remove()); const im = window.__im, S = im.S, G = im.G; S.speed = 0; im.tutGo && 0;
      for (const a of S.armies) if (a.owner === 0) for (const t in a.u) a.u[t] = 0; removeEmpty();
      const cap = S.nations[0].capital, own = q => !q.sea && S.owner[q.id] === 0 && q.id !== cap && !G.P[cap].nb.has(q.id) && q.cells.length >= 10, fr = S.nations.findIndex(n => n.name === 'France');
      let A = null, B = null; for (const P of G.P){ if (!own(P)) continue; const nb = [...P.nb.keys()].map(v => G.P[v]).filter(own).sort((x, y) => y.cells.length - x.cells.length)[0]; if (nb){ A = P; B = nb; break; } }
      const spot = [A.x + 2, A.y + 1.5], a = im.addArmy(0, A.id, { inf: 3 }); a.pos = ptIn(A.id, spot[0], spot[1]);
      // a point of B about half way from its centre to its edge on A's side, on dry land, well clear of B's centre (no snap to the city)
      const cs = B.cells.map(c => cellCenter(c)).filter(q => Math.hypot(q[0] - B.x, q[1] - B.y) > 5 && Math.hypot(q[0] - B.x, q[1] - B.y) < 14 && im.isWet && !im.isWet(q[0], q[1]));
      cs.sort((q, r) => Math.hypot(q[0] - A.x, q[1] - A.y) - Math.hypot(r[0] - A.x, r[1] - A.y)); const tgt = cs[0] || [B.x + 6, B.y];
      const Z = [...G.P[473].nb.keys(), ...G.P[472].nb.keys()].map(v => G.P[v]).filter(q => q.sea).sort((x, y) => y.cells.length - x.cells.length)[0];
      return { a: a.id, A: A.id, B: B.id, Aname: A.name, Bname: B.name, spot: a.pos, tgt, Ac: [A.x, A.y], Bc: [B.x, B.y], fr, Z: Z.id, Zc: [Z.x, Z.y] }; });
    log.push(`-- ${TAG} ${W}x${H}: force ${sc.a} at ${sc.Aname}, neighbour ${sc.Bname}`);
    const R = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    const side = PHONE ? 0 : 360;   // (the command panel on the right of a desktop)
    const view = (xy, hp) => p.evaluate(([x, y, hp, w, h]) => { const v = window.__im.view, s = hp/12; v.s = s; v.x = w/2 - x*s; v.y = h/2 - y*s; window.__im.redraw && window.__im.redraw(); }, [xy[0], xy[1], hp, R.w - side, R.h * (PHONE ? 0.55 : 1)]);
    const settle = (ms = 900) => p.waitForTimeout(ms);
    const scr = (x, y) => p.evaluate(([x, y]) => window.__im.toScreen(x, y), [x, y]);
    const st = () => p.evaluate(id => { const im = window.__im, a = im.S.armies.find(q => q.id === id); return { sel: im.sel.army, dest: a && a.dest, path: a ? a.path.slice() : [], to: a ? a.to : null, pos: a && a.pos, at: a && a.at, sail: !!(a && a.sail), chase: a && a.chase, wp: a && a.wp, vs: im.view.s, vx: im.view.x, vy: im.view.y, cmdbar: !document.getElementById('cmdbar').hidden, abar: !!document.querySelector('.abar') }; }, sc.a);
    const hitOf = id => p.evaluate(id => { const L = window.__im.hits.concat(window.__im.hitx.filter(h => h.sat)), h = L.find(h => h.own && h.own.includes(id) && h.ids.length === 1) || L.find(h => h.ids.includes(id)); return h ? { x: h.x, y: h.y, w: h.w, h: h.h, cx: h.cx, cy: h.cy, tag: h.tag } : null; }, id);
    // input, in canvas coordinates
    const tap = async (x, y) => { if (PHONE){ await touch('touchStart', [[x, y]]); await p.waitForTimeout(60); await touch('touchEnd', []); } else await p.mouse.click(R.x + x, R.y + y); await p.waitForTimeout(250); };
    const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], i) => ({ x: R.x + x, y: R.y + y, id: i, radiusX: 4, radiusY: 4, force: 1 })) });
    const drag = async (x0, y0, x1, y1, steps = 8) => { if (PHONE){ await touch('touchStart', [[x0, y0]]); for (let i = 1; i <= steps; i++){ await touch('touchMove', [[x0 + (x1 - x0)*i/steps, y0 + (y1 - y0)*i/steps]]); await p.waitForTimeout(16); } await touch('touchEnd', []); }
      else { await p.mouse.move(R.x + x0, R.y + y0); await p.mouse.down(); for (let i = 1; i <= steps; i++){ await p.mouse.move(R.x + x0 + (x1 - x0)*i/steps, R.y + y0 + (y1 - y0)*i/steps); await p.waitForTimeout(16); } await p.mouse.up(); } await p.waitForTimeout(250); };
    const longPress = async (x, y) => { if (PHONE){ await touch('touchStart', [[x, y]]); await p.waitForTimeout(900); await touch('touchEnd', []); } else { await p.mouse.move(R.x + x, R.y + y); await p.mouse.down(); await p.waitForTimeout(900); await p.mouse.up(); } await p.waitForTimeout(250); };
    const pinch = async (cx, cy) => { await touch('touchStart', [[cx - 30, cy], [cx + 30, cy]]); for (let i = 1; i <= 8; i++){ await touch('touchMove', [[cx - 30 - i*8, cy], [cx + 30 + i*8, cy]]); await p.waitForTimeout(16); } await touch('touchEnd', []); await p.waitForTimeout(250); };
    const deselect = () => p.evaluate(() => window.__im.clearSel());
    const selectByTap = async () => { await deselect(); await settle(); const h = await hitOf(sc.a); if (!h) return false; await tap(h.x + h.w/2, h.y + h.h/2); return (await st()).sel === sc.a; };
    const resetForce = () => p.evaluate(([id, A, spot]) => { const im = window.__im, a = im.S.armies.find(q => q.id === id); haltArmy(a); if (a.at !== A){ a.at = A; a.from = A; } a.pos = spot.slice(); a.to = null; a.path = []; a.dest = null; delete a.chase; delete a.wp; im.S.armies.forEach(q => { if (q.owner === 0 && q.id !== id && q.at === A) {} }); visCache = null; im.redraw && im.redraw(); }, [sc.a, sc.A, sc.spot]);

    const shot = n => SHOTS ? p.screenshot({ path: `${SHOTS}/unit-${TAG}-${n}.png` }) : null;
    // 1. select by a tap on the badge: the army bar and the command bar open
    await view([(sc.Ac[0] + sc.Bc[0])/2, (sc.Ac[1] + sc.Bc[1])/2], 60);
    ok(`${TAG}: a tap on the force's badge selects it (army bar, command bar)`, await selectByTap() && (await st()).cmdbar && (await st()).abar, await st());
    // 2. a tap on the map with a force selected gives NO order (it deselects); Move, then a tap on the map, orders it to that exact point and it stays selected
    const armMove = () => p.evaluate(() => { const b = document.querySelector('[data-act="cm-move"]'); if (b) b.click(); });
    await shot('1-selected'); let T = await scr(...sc.tgt); await tap(T[0], T[1]); { const s0 = await st(); ok(`${TAG}: a tap on the map with a force selected gives no order and deselects it`, !s0.dest && !s0.path.length && s0.to === null && s0.sel === null, s0); }
    await selectByTap(); ok(`${TAG}: tapping again after the tap-away selects it again, still no order`, (await st()).sel === sc.a && !(await st()).path.length);
    await armMove(); await p.waitForTimeout(150); ok(`${TAG}: Move arms (the hint says tap a destination)`, /Move: tap a destination/.test(await p.evaluate(() => document.getElementById('hint').textContent)));
    await shot('2-move-armed'); await tap(T[0], T[1]); let s1 = await st(); await shot('3-ordered');
    ok(`${TAG}: Move, then one tap on the map = the order, to the exact point`, s1.dest && s1.dest.p === sc.B && Math.hypot(s1.dest.x - sc.tgt[0], s1.dest.y - sc.tgt[1]) < 0.6 && s1.path.length > 0, s1);
    ok(`${TAG}: the force stays selected after the order`, s1.sel === sc.a, s1.sel);
    await settle(600); const pd = await p.evaluate(() => window.__im.pathDbg); const T2 = await scr(sc.tgt[0], sc.tgt[1]), hA = await hitOf(sc.a);
    ok(`${TAG}: the path line runs from the force to the tapped point (exact end marker)`, pd.sel && pd.sel.id === sc.a && pd.sel.exact && Math.hypot(pd.sel.pts[pd.sel.pts.length - 1][0] - T2[0], pd.sel.pts[pd.sel.pts.length - 1][1] - T2[1]) < 2 && hA && Math.hypot(pd.sel.pts[0][0] - hA.cx, pd.sel.pts[0][1] - hA.cy) < 4, { pd: pd.sel, T2, hA });
    ok(`${TAG}: the ETA chip shows over the destination`, pd.eta && /^\d+ h/.test(pd.eta.txt) && Math.abs(pd.eta.x - T2[0]) < 2, pd.eta);
    if (TAG === 'desk') await p.screenshot({ path: __dirname + '/controls-desk-path.png' });
    // 3. a second tap on its destination releases it (the order stands); a tap on the force (or Esc) releases it too
    await tap(T2[0], T2[1]); let s2 = await st(); ok(`${TAG}: a second tap on the destination deselects, the order stands`, s2.sel === null && s2.dest && s2.dest.p === sc.B, s2);
    await resetForce(); ok(`${TAG}: tap the force again selects it`, await selectByTap());
    { const h = await hitOf(sc.a); await tap(h.x + h.w/2, h.y + h.h/2); ok(`${TAG}: a tap on the selected force deselects it`, (await st()).sel === null, await st()); }
    if (!PHONE){ await selectByTap(); await p.keyboard.press('Escape'); await p.waitForTimeout(200); ok(`${TAG}: Esc deselects`, (await st()).sel === null); }
    // 4. pans, pinches and long presses never order; a small jitter is still a tap
    await selectByTap(); await armMove(); T = await scr(...sc.tgt);
    { const v0 = await st(); await drag(T[0], T[1], T[0] + 70, T[1] + 40); const v1 = await st(); ok(`${TAG}: a pan (drag) moves the map and gives no order`, !v1.dest && !v1.path.length && v1.sel === sc.a && (Math.abs(v1.vx - v0.vx) > 30 || Math.abs(v1.vy - v0.vy) > 20), { v0, v1 }); }
    if (PHONE){ const v0 = await st(); await pinch(R.w/2, R.h*0.4); const v1 = await st(); ok(`${TAG}: a two-finger pinch zooms and gives no order`, !v1.dest && !v1.path.length && Math.abs(v1.vs/v0.vs - 1) > 0.15, { s0: v0.vs, s1: v1.vs, dest: v1.dest }); await view([(sc.Ac[0] + sc.Bc[0])/2, (sc.Ac[1] + sc.Bc[1])/2], 60); await settle(); }
    T = await scr(...sc.tgt); await longPress(T[0], T[1]); { const v = await st(); ok(`${TAG}: a long press gives no order (Move armed)`, !v.dest && !v.path.length, v); }
    T = await scr(...sc.tgt); { const j = PHONE ? 7 : 4; await drag(T[0], T[1], T[0] + j, T[1] + 1, 3); const v = await st(); ok(`${TAG}: a ${j} px jitter is still a tap (the order)`, v.dest && v.dest.p === sc.B, v); s1 = v; }
    // 5. the force marches and ends exactly on the tapped point; its badge is drawn there (three zooms), and at close zoom its pictures stand round it
    await p.evaluate(() => { window.__im.S.speed = 4; });
    for (let i = 0; i < 400; i++){ const v = await st(); if (!v.path.length && v.to === null && !v.sail && v.dest === null) break; await p.waitForTimeout(100); }
    await p.evaluate(() => { window.__im.S.speed = 0; }); let s5 = await st();
    ok(`${TAG}: it ends at the tapped point, in the province holding it`, s5.at === sc.B && s5.pos && Math.hypot(s5.pos[0] - sc.tgt[0], s5.pos[1] - sc.tgt[1]) < 1.6 && Math.hypot(s5.pos[0] - s1.dest.x, s5.pos[1] - s1.dest.y) < 1e-9, { s5, dest: s1.dest, tgt: sc.tgt, Bc: sc.Bc });
    await deselect();
    for (const hp of [30, 60, 110]){ await view(s5.pos, hp); await settle(1600); const h = await hitOf(sc.a), P = await scr(...s5.pos);
      ok(`${TAG}: zoom ${hp} px a hex: its badge is drawn on the point (within 3 px)`, h && !h.tag && Math.hypot(h.cx - P[0], h.cy - P[1]) <= 3, { h, P }); }
    { await view(s5.pos, 190); await settle(2000); const art = await p.evaluate(id => (window.__im.hitx.find(h => h.art && h.ids.includes(id)) || null), sc.a), P = await scr(...s5.pos);
      ok(`${TAG}: zoomed in, its pictures stand round the point`, !art || (P[0] > art.x && P[0] < art.x + art.w && P[1] > art.y - 4 && P[1] < art.y + art.h + 4), { art, P }); }
    // 6. a force pinned on a city: a tap on its badge selects it (the badge wins over the city's point under it)
    { const cap = await p.evaluate(() => { const im = window.__im, P = im.G.P[im.S.nations[0].capital]; return [P.x, P.y]; });
      await p.evaluate(([id, xy]) => { const im = window.__im, a = im.S.armies.find(q => q.id === id), c = im.S.nations[0].capital; a.at = c; a.from = c; a.pos = [xy[0] + 0.6, xy[1] + 0.8]; a.dest = null; visCache = null; }, [sc.a, cap]);
      await view(cap, 60); await settle(1600); const h = await hitOf(sc.a); if (h) await tap(h.x + h.w/2, h.y + h.h/2); const v = await st();
      ok(`${TAG}: a force standing on a city is selected by a tap on its badge`, v.sel === sc.a, { h, sel: v.sel, prov: await p.evaluate(() => window.__im.sel.prov) }); await deselect(); }
    // 7. desktop: right-click moves; the Move button (and M) still works; a tap on another force of yours selects it; a tap on an enemy orders the attack
    if (!PHONE){
      await resetForce(); await view([(sc.Ac[0] + sc.Bc[0])/2, (sc.Ac[1] + sc.Bc[1])/2], 60); await selectByTap(); T = await scr(...sc.tgt);
      await p.mouse.click(R.x + T[0], R.y + T[1], { button: 'right' }); await p.waitForTimeout(250); { const v = await st(); ok(`${TAG}: right-click orders the move to the point`, v.dest && v.dest.p === sc.B && Math.hypot(v.dest.x - sc.tgt[0], v.dest.y - sc.tgt[1]) < 0.6, v); }
      await resetForce(); await selectByTap(); await p.click('[data-act="cm-move"]'); T = await scr(...sc.tgt); await tap(T[0], T[1]); { const v = await st(); ok(`${TAG}: the Move button, then a tap: the order`, v.dest && v.dest.p === sc.B && v.sel === sc.a, v); }
      const other = await p.evaluate(([A, Ac]) => { const im = window.__im, b = im.addArmy(0, A, { tank: 2 }); b.pos = ptIn(A, Ac[0] - 4, Ac[1] - 3); return b.id; }, [sc.A, sc.Ac]);
      await resetForce(); await settle(); await selectByTap(); const ho = await hitOf(other); if (ho) await tap(ho.x + ho.w/2, ho.y + ho.h/2); ok(`${TAG}: a tap on another force of yours selects that one`, (await st()).sel === other);
      const foe = await p.evaluate(([B, fr, tgt]) => { const im = window.__im, S = im.S; S.rel[Math.min(0, fr) + ',' + Math.max(0, fr)] = { st: 'war', since: S.hour, until: null }; const e = im.addArmy(fr, B, { inf: 1 }); e.pos = ptIn(B, tgt[0], tgt[1]); visCache = null; return e.id; }, [sc.B, sc.fr, sc.tgt]);
      await deselect(); await selectByTap(); await settle(); const hf = await hitOf(foe); if (hf) await tap(hf.x + hf.w/2, hf.y + hf.h/2);
      { const v = await st(); ok(`${TAG}: a tap on an enemy force gives no order (it opens that force's bar)`, v.chase == null && !v.path.length && v.sel === null && await p.evaluate(() => window.__im.sel.foe !== null), { v, hf }); }
      await deselect(); await selectByTap(); await p.click('[data-act="cm-attack"]'); await settle(); const hf1 = await hitOf(foe); if (hf1) await tap(hf1.x + hf1.w/2, hf1.y + hf1.h/2); await p.evaluate(() => document.querySelectorAll('#modal [data-act="surprise-cancel"]').forEach(b => b.click()));
      { const v = await st(); ok(`${TAG}: Attack, then a tap on an enemy force: the order (it marches on it and pursues it)`, v.chase === foe && v.path.length > 0, { v, hf1 }); }
      await p.evaluate(id => { const im = window.__im, e = im.S.armies.find(q => q.id === id); if (e){ for (const t in e.u) e.u[t] = 0; removeEmpty(); } }, foe);
      // a fleet at sea: one tap orders it to the exact water point; it ends there and its badge is drawn there
      const fl = await p.evaluate(([Z]) => { const im = window.__im, G = im.G, Zp = G.P[Z], f = im.addArmy(0, Z, { frig: 2 }); f.pos = [Zp.x, Zp.y]; const Z2 = G.P[[...Zp.nb.keys()].filter(v => G.P[v].sea).sort((x, y) => G.P[y].cells.length - G.P[x].cells.length)[0]], c = Z2.cells.map(c => cellCenter(c)).sort((q, r) => Math.hypot(q[0] - Zp.x, q[1] - Zp.y) - Math.hypot(r[0] - Zp.x, r[1] - Zp.y)).slice(2).filter(q => im.isWet(q[0], q[1])); return { id: f.id, w: c[0] }; }, [sc.Z]);
      await deselect(); await view(sc.Zc, 40); await settle(); const hfl = await hitOf(fl.id); if (hfl) await tap(hfl.x + hfl.w/2, hfl.y + hfl.h/2); await p.click('[data-act="cm-move"]'); T = await scr(...fl.w); await tap(T[0], T[1]);
      const fd = await p.evaluate(id => window.__im.S.armies.find(q => q.id === id).dest, fl.id); ok(`${TAG}: a fleet: Move, then one tap orders it to the exact water point`, fd && Math.hypot(fd.x - fl.w[0], fd.y - fl.w[1]) < 0.6, { fd, w: fl.w, hfl });
      await p.evaluate(() => { window.__im.S.speed = 4; }); for (let i = 0; i < 300; i++){ const d = await p.evaluate(id => { const a = window.__im.S.armies.find(q => q.id === id); return a.to === null && !a.path.length && !a.sail; }, fl.id); if (d) break; await p.waitForTimeout(100); }
      await p.evaluate(() => { window.__im.S.speed = 0; }); await deselect(); const fp = await p.evaluate(id => window.__im.S.armies.find(q => q.id === id).pos, fl.id); await view(fp, 60); await settle(1600); const hf2 = await hitOf(fl.id), F2 = await scr(...fp);
      ok(`${TAG}: the fleet ends on that point at sea, its badge drawn there`, fp && Math.hypot(fp[0] - fl.w[0], fp[1] - fl.w[1]) < 0.6 && hf2 && Math.hypot(hf2.cx - F2[0], hf2.cy - F2[1]) <= 3, { fp, w: fl.w, hf2, F2 });
    }
    } catch (e){ errors.push(TAG + ' test: ' + (e.message || e).toString().split('\n')[0]); }
    await ctx.close();
  }
  await b.close();
  const bad = Object.entries(checks).filter(([, v]) => !v);
  console.log(log.join('\n'));
  console.log(bad.length || errors.length ? `FAILED ${bad.length} of ${Object.keys(checks).length} checks` : `OK ${Object.keys(checks).length} checks`, 'errors', errors.length ? errors.slice(0, 8) : 'none');
  process.exit(bad.length || errors.length ? 1 : 0);
})();
