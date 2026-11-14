// Screenshots for the owner (unit controls, pinpoint movement, waypoints): a player's real taps, each picture captioned with what it shows.
//   node .test/controls-shots.js <outDir> [before|after] [page.html path]     (after: also the waypoint pictures)
// before = the master build (2 taps to order, the badge drawn below the point); after = this build. Desktop 1440x900 dpr 2 and phone 390x844 dpr 2.
const pickNation = require('./pick-nation.js'), { chromium } = require('playwright'), path = require('path');
const OUT = process.argv[2] || __dirname, WHEN = process.argv[3] || 'after', PAGE = process.argv[4] || path.join(__dirname, 'page.html');
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const notes = [];
  for (const [DEV, W, H, DPR] of [['desk', 1440, 900, 2], ['phone', 390, 844, 2]]){ const PHONE = W <= 820;
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: PHONE, isMobile: false }), p = await ctx.newPage(), cdp = PHONE ? await ctx.newCDPSession(p) : null;
    await p.goto('file://' + PAGE); await p.waitForTimeout(500);
    await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
    await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 });
    await p.evaluate(() => { document.querySelectorAll('[data-act="tip-ok"], .ftip button').forEach(b => b.click()); });
    const sc = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G; S.speed = 0; for (const a of S.armies) if (a.owner === 0) for (const t in a.u) a.u[t] = 0; removeEmpty();
      const by = n => G.P.find(q => q.name === n && !q.sea), A = by('Hessen'), B = by('Thüringen'), a = im.addArmy(0, A.id, { inf: 3, tank: 2 }); a.pos = ptIn(A.id, A.x - 2, A.y + 1);
      // a point of Thüringen near its border with Hessen: its cell nearest Hessen's centre, a little inside
      const cs = B.cells.map(c => cellCenter(c)).filter(q => !im.isWet(q[0], q[1])).sort((q, r) => Math.hypot(q[0] - A.x, q[1] - A.y) - Math.hypot(r[0] - A.x, r[1] - A.y)), t = cs[0];
      const st = [by('Thüringen'), by('Sachsen'), by('Nürnberg')].map(P => { const c = P.cells.map(c => cellCenter(c)).filter(q => !im.isWet(q[0], q[1]) && Math.hypot(q[0] - P.x, q[1] - P.y) > 5).sort((q, r) => Math.hypot(q[0] - P.x, q[1] - P.y) - Math.hypot(r[0] - P.x, r[1] - P.y)); return c[0]; });
      return { a: a.id, A: A.id, B: B.id, Ac: [A.x, A.y], Bc: [B.x, B.y], t, st, spot: a.pos }; });
    const R = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    const mapH = PHONE ? R.h*0.42 : R.h;
    const view = (xy, hp) => p.evaluate(([x, y, hp, w, h]) => { const v = window.__im.view, s = hp/12; v.s = s; v.x = w/2 - x*s; v.y = h/2 - y*s; }, [xy[0], xy[1], hp, R.w, mapH]);
    const scr = xy => p.evaluate(([x, y]) => window.__im.toScreen(x, y), xy);
    const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], i) => ({ x: R.x + x, y: R.y + y, id: i, radiusX: 4, radiusY: 4, force: 1 })) });
    const tap = async (x, y) => { if (PHONE){ await touch('touchStart', [[x, y]]); await p.waitForTimeout(60); await touch('touchEnd', []); } else { await p.mouse.click(R.x + x, R.y + y); await p.mouse.move(W - 6, H - 6); } await p.waitForTimeout(350); };
    const info = () => p.evaluate(id => { const a = window.__im.S.armies.find(q => q.id === id); return a && { dest: a.dest, path: a.path.slice(), pos: a.pos, at: a.at, idle: a.to === null && !a.path.length && !a.sail, sel: window.__im.sel.army, wp: a.wp }; }, sc.a);
    const badge = () => p.evaluate(id => { const h = window.__im.hits.find(h => h.ids.includes(id)); return h && { x: h.x + h.w/2, y: h.y + h.h/2, cx: h.cx, cy: h.cy, tag: h.tag }; }, sc.a);
    // the caption (what the picture shows) and a magenta ring on the point the player tapped (drawn over the page, for the pictures only)
    const cap = (txt, ring) => p.evaluate(([txt, ring, R, PHONE]) => { document.querySelectorAll('.shotcap,.shotring').forEach(e => e.remove()); const d = document.createElement('div'); d.className = 'shotcap'; d.textContent = txt;
      d.style.cssText = `position:fixed;left:${R.x + 8}px;top:${R.y + 8}px;max-width:${Math.min(R.w - 16, 760)}px;z-index:99999;pointer-events:none;background:rgba(10,14,16,.92);color:#fff;font:600 ${PHONE ? 12 : 14}px/1.35 system-ui,sans-serif;padding:7px 10px;border-left:4px solid #ff3df5;border-radius:4px`; document.body.appendChild(d);
      for (const q of ring || []){ const r = document.createElement('div'); r.className = 'shotring'; r.style.cssText = `position:fixed;left:${R.x + q[0] - 9}px;top:${R.y + q[1] - 9}px;width:14px;height:14px;border:2.5px solid #ff3df5;border-radius:50%;z-index:99998;pointer-events:none;box-shadow:0 0 0 1px #000`; document.body.appendChild(r); } }, [txt, ring, R, PHONE]);
    const shot = async (n, txt, ring) => { await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); document.querySelectorAll('[data-act="tip-ok"], .ftip button').forEach(b => b.click()); }); if (!PHONE) await p.mouse.move(W - 6, H - 6); await cap(`${WHEN.toUpperCase()} (${DEV}) · ${txt}`, ring); await p.waitForTimeout(150); const f = `${OUT}/cmp-${DEV}-${WHEN}-${n}.png`; await p.screenshot({ path: f }); notes.push(f); await p.evaluate(() => document.querySelectorAll('.shotcap,.shotring').forEach(e => e.remove())); };
    const hp = PHONE ? 70 : 100;
    await view([(sc.Ac[0] + sc.t[0])/2, (sc.Ac[1] + sc.t[1])/2], hp); await p.waitForTimeout(1500);
    // 1. select by a tap on the badge
    { const h = await badge(); await tap(h.x, h.y); const v = await info(); await p.waitForTimeout(500); await shot('1-select', `tap the force's badge: selected (army bar and command bar open) · selected = ${v.sel === sc.a ? 'yes' : 'no'}`); }
    // 2. a tap near the edge of the neighbouring province: the order (before: a plan only, a second tap needed)
    let T = await scr(sc.t); await tap(T[0], T[1]); let v = await info(); const taps1 = !!v.dest;
    if (!v.dest && !(v.path && v.path.length)){ await p.waitForTimeout(500); await shot('2a-plan', 'one tap near the edge of Thüringen: only a planned route, no order yet', [T]); await tap(T[0], T[1]); v = await info(); }
    await p.waitForTimeout(600); T = await scr(sc.t);
    await shot('2-path', `${taps1 ? 'ONE tap' : 'a second tap'} near the edge of Thüringen = the order: the path line to the tapped point (magenta ring)${taps1 ? ' with the ETA chip; the force stays selected' : ''} · order to the point: ${v.dest ? 'yes' : 'no (province centre)'}`, [T]);
    // 3. march: where it ends
    await p.evaluate(() => { window.__im.S.speed = 4; }); for (let i = 0; i < 600; i++){ const q = await info(); if (q.idle && !q.wp) break; await p.waitForTimeout(80); } await p.evaluate(() => { window.__im.S.speed = 0; });
    v = await info(); const keepSel = v.sel === sc.a; await p.evaluate(() => window.__im.clearSel && window.__im.clearSel()); await view(sc.t, hp); await p.waitForTimeout(1800); T = await scr(sc.t);
    const bd = await badge(); const off = bd ? Math.round(Math.hypot(bd.cx - T[0], bd.cy - T[1])) : null;
    await shot('3-arrived', `arrived: the force stands at ${v.pos ? 'its point' : 'the province centre'}, ${Math.round(Math.hypot((v.pos || [0, 0])[0] - sc.t[0], (v.pos || [0, 0])[1] - sc.t[1])*100)/100} map units from the tap; its badge is drawn ${off} px from the tapped point (magenta)`, [T]);
    // 4. deselect: tap the force, tap its destination, Esc
    { const h = await badge(); await tap(h.x, h.y); await p.waitForTimeout(300); const s0 = (await info()).sel; await tap(h.x, h.y); await p.waitForTimeout(500); const s1 = (await info()).sel, pv = await p.evaluate(() => window.__im.sel.prov);
      await shot('4-deselect', `tap the force: selected (${s0 === sc.a ? 'yes' : 'no'}); tap it again: ${s1 === null && pv == null ? 'deselected, nothing open' : s1 === null ? 'its province sheet opens instead' : 'still selected'}`); }
    // 5. waypoints (this build only): the button on, three taps = three numbered stops, Undo, the march through them
    if (WHEN === 'after'){ await p.evaluate(([id, A, spot]) => { window.__im.clearSel(); const a = window.__im.S.armies.find(q => q.id === id); a.at = A; a.from = A; a.pos = spot.slice(); visCache = null; }, [sc.a, sc.A, sc.spot]);   // (back to its start in Hessen, clear of the stops)
      await view([(sc.st[0][0] + sc.st[2][0] + sc.t[0])/3, (sc.st[0][1] + sc.st[2][1] + sc.t[1])/3], PHONE ? 34 : 52); await p.waitForTimeout(1500);
      { const h = await badge(); await tap(h.x, h.y); } await p.click('#cmdbar [data-act="cm-wp"]'); await p.waitForTimeout(250);
      for (const q of sc.st){ const Tq = await scr(q); await tap(Tq[0], Tq[1]); } await p.waitForTimeout(600);
      const Ts = await Promise.all(sc.st.map(q => scr(q))); await shot('5-wp-3stops', `Waypoint button ON: three taps (magenta) = three numbered stops on the path line, the ETA to the last · stops: ${(await p.evaluate(id => stopsOf(window.__im.S.armies.find(q => q.id === id)).length, sc.a))}`, Ts);
      await p.click('#cmdbar [data-act="cm-undo"]'); await p.waitForTimeout(600); await shot('6-wp-undo', `Undo: the last stop is gone, two stops left · stops: ${(await p.evaluate(id => stopsOf(window.__im.S.armies.find(q => q.id === id)).length, sc.a))}`, Ts);
      { const Tq = await scr(sc.st[2]); await tap(Tq[0], Tq[1]); } await p.click('#cmdbar [data-act="cm-wp"]'); await p.waitForTimeout(300);
      await p.evaluate(() => { window.__im.S.speed = 4; }); const done = new Set();
      for (let i = 0; i < 1500 && done.size < 3; i++){ const q = await info(); for (let k = 0; k < 3; k++) if (!done.has(k) && q.pos && Math.hypot(q.pos[0] - sc.st[k][0], q.pos[1] - sc.st[k][1]) < 0.8){ done.add(k); await p.evaluate(() => { window.__im.S.speed = 0; }); await p.waitForTimeout(700);
          await shot(`${7 + k}-wp-pass${k + 1}`, `the march: the force reaches stop ${k + 1} of 3${k < 2 ? ` and goes on to stop ${k + 2}` : ' (the last)'} · stops left: ${(await p.evaluate(id => stopsOf(window.__im.S.armies.find(q => q.id === id)).length, sc.a))}`, [await scr(sc.st[k])]); await p.evaluate(() => { window.__im.S.speed = 4; }); }
        await p.waitForTimeout(50); }
      await p.evaluate(() => { window.__im.S.speed = 0; }); }
    await ctx.close(); }
  await b.close(); console.log(notes.join('\n'));
})();
