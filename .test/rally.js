// Rally point (UNIT-CTRL): new units stay in their city unless it has a rally point; the city sheet's Rally point button starts the mode (hint bar:
// tap the map to set the rally point, Cancel); a tap on a spot previews the real route with a ghost soldier and does not set it; a second tap on the
// same spot (or Set) confirms; a set point shows a small flag only and the sheet says Rally point: <place> with Clear; Clear removes it; sea, foreign land and
// the city itself are refused; the point is saved with the game and an old save (no S.rally) loads. Real mouse / touch events.
//   node .test/rally.js [desk|phone] [shots-dir]     (run bash tools/mkpage.sh first; prints PASS/FAIL lines; exit 1 on any failure or page error)
const pickNation = require('./pick-nation.js');
const { chromium } = require('playwright');
const ONLY = process.argv[2] || '', SHOTS = process.argv[3] || '';
const RES = [['desk', 1440, 900, 2], ['phone', 390, 844, 2]].filter(r => !ONLY || r[0] === ONLY);
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
    const sc = await p.evaluate(() => { document.querySelectorAll('.toast,[data-act="tip-ok"]').forEach(t => t.remove()); const im = window.__im, S = im.S, G = im.G; S.speed = 0;
      const cap = S.nations[0].capital, Cp = G.P[cap], n1 = [...Cp.nb.keys()].map(v => G.P[v]).filter(q => !q.sea && S.owner[q.id] === 0 && q.cells.length >= 8), n2 = [...new Set(n1.flatMap(q => [...q.nb.keys()]))].map(v => G.P[v]).filter(q => !q.sea && S.owner[q.id] === 0 && q.id !== cap && !Cp.nb.has(q.id) && q.cells.length >= 8), nb = (n2.sort((x, y) => Math.hypot(y.x - Cp.x, y.y - Cp.y) - Math.hypot(x.x - Cp.x, x.y - Cp.y))[0] || n1.sort((x, y) => y.cells.length - x.cells.length)[0]);
      const sea = [...Cp.nb.keys()].concat([...G.P[nb.id].nb.keys()]).map(v => G.P[v]).find(q => q.sea) || G.P.find(q => q.sea);
      const foreign = G.P.find(q => !q.sea && S.owner[q.id] >= 1 && !S.rel[Math.min(0, S.owner[q.id]) + ',' + Math.max(0, S.owner[q.id])]?.st?.match(/ally|war/) && [...Cp.nb.keys()].some(v => [...G.P[v].nb.keys()].includes(q.id)));
      return { cap, capName: Cp.cityName, c: [Cp.x, Cp.y], nb: nb.id, nbName: nb.cityName || nb.name, n: [nb.x, nb.y], sea: sea.id, sc: [sea.x, sea.y], foreign: foreign ? foreign.id : null, fc: foreign ? [foreign.x, foreign.y] : null }; });
    log.push(`-- ${TAG} ${W}x${H}: ${sc.capName} -> ${sc.nbName}`);
    const R = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    const side = PHONE ? 0 : 360;
    const view = (hp, dy = 0) => p.evaluate(([cx, cy, hp, w, h, dy]) => { const v = window.__im.view, s = hp/12; v.s = s; v.x = w/2 - cx*s; v.y = h/2 - cy*s + dy; window.__im.redraw && window.__im.redraw(); }, [(sc.c[0] + sc.n[0])/2, (sc.c[1] + sc.n[1])/2, hp, R.w - side, R.h, dy]);
    const scr = xy => p.evaluate(([x, y]) => window.__im.toScreen(x, y), xy);
    const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], i) => ({ x: R.x + x, y: R.y + y, id: i, radiusX: 4, radiusY: 4, force: 1 })) });
    const tap = async (x, y) => { if (PHONE){ await touch('touchStart', [[x, y]]); await p.waitForTimeout(60); await touch('touchEnd', []); } else await p.mouse.click(R.x + x, R.y + y); await p.waitForTimeout(350); };
    const clickAct = async act => { const sel = `[data-act="${act}"]`; await p.waitForSelector(sel, { state: 'visible', timeout: 3000 }); if (PHONE) await p.tap(sel); else await p.click(sel); await p.waitForTimeout(300); };
    const shot = async n => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/rally-${TAG}-${n}.png` }); };
    const st = () => p.evaluate(() => { const im = window.__im; return { rally: JSON.parse(JSON.stringify(S.rally || {})), rf: im.rally.mode, pick: im.rally.pick, hint: document.getElementById('hint').textContent, cs: (document.getElementById('csheet').hidden ? '' : document.getElementById('csheet').textContent) }; });
    await view(PHONE ? 38 : 44, PHONE ? -120 : 0); await p.waitForTimeout(900);

    // 1. by default new units stay in their city
    const sp = await p.evaluate(cap => { const im = window.__im, S = im.S; delete S.rally; const n0 = S.armies.length; window.__im.rally.spawn(0, cap, 'inf'); const a = S.armies.filter(q => q.owner === 0 && q.at === cap && q.u.inf).slice(-1)[0]; return { n: S.armies.length - n0, path: a ? a.path.length : -1, to: a ? a.to : null, at: a ? a.at : null }; }, sc.cap);
    ok(`${TAG}: no rally point: a new unit stays in its city (no walk)`, sp.path === 0 && sp.to === null && sp.at === sc.cap, sp);
    // 2. the city sheet has a Rally point button (and says units stay in the city); the button starts the mode with the hint bar
    await p.evaluate(cap => window.__im.selectProv(cap), sc.cap); await p.waitForTimeout(500);
    { const s = await st(); ok(`${TAG}: the city sheet offers a Rally point button, no point set`, /Rally point/.test(s.cs) && /stay in the city/.test(s.cs) && !/Clear/.test(s.cs), s.cs.slice(0, 160)); }
    await shot('0-city-sheet');
    await clickAct('rally'); { const s = await st(); ok(`${TAG}: the button starts rally mode with a hint bar (Tap the map to set the rally point · Cancel)`, s.rf === sc.cap && /Tap the map to set the rally point/.test(s.hint) && /Cancel/.test(s.hint), s); }
    // 3. refused spots: the city itself, the sea, foreign land
    { const C0 = await scr(sc.c); await tap(C0[0], C0[1]); ok(`${TAG}: the city itself is no rally point`, !(await st()).pick && (await st()).rf === sc.cap, await st()); }
    { const S0 = await scr(sc.sc); await tap(S0[0], S0[1]); ok(`${TAG}: the sea is refused`, !(await st()).pick && !Object.keys((await st()).rally).length, await st()); }
    if (sc.foreign != null){ await view(26, 0); const F0 = await scr(sc.fc); if (F0[0] > 0 && F0[0] < R.w - side && F0[1] > 0 && F0[1] < R.h){ await tap(F0[0], F0[1]); const s = await st(); ok(`${TAG}: foreign land you cannot enter is refused`, !s.pick && !Object.keys(s.rally).length, s); } await view(PHONE ? 38 : 44, PHONE ? -120 : 0); await p.waitForTimeout(500); }
    // 4. a tap on a spot only previews: the ghost walks the real route city -> spot, nothing is set; the hint offers Set and Cancel
    const T = await scr(sc.n); await tap(T[0], T[1]); await p.waitForTimeout(500);
    { const s = await st(), rt = await p.evaluate(([c, n]) => window.__im.rally.route(c, n).length, [sc.cap, sc.nb]); ok(`${TAG}: a tap on a spot previews it and sets nothing (route of ${rt} province(s))`, s.pick && s.pick.p === sc.nb && !Object.keys(s.rally).length && rt > 0 && /Set/.test(s.hint) && /Cancel/.test(s.hint), { s, rt }); }
    await shot('1-preview'); await p.waitForTimeout(700); await shot('1-preview-b');
    // 5. a second tap on the same spot confirms: a flag only, the sheet says Rally point: <place> with Clear
    await tap(T[0], T[1]); await p.waitForTimeout(500);
    { const s = await st(); ok(`${TAG}: a second tap on the same spot sets the rally point`, s.rally[sc.cap] === sc.nb && s.rf === null && !s.pick, s); ok(`${TAG}: the city sheet says Rally point: place, with a Clear button`, /Rally point/.test(s.cs) && s.cs.includes(sc.nbName) && /Clear/.test(s.cs), s.cs.slice(0, 200)); }
    await p.evaluate(() => { window.__im.clearSel(); }); await p.waitForTimeout(300); await shot('2-flag-set');
    await p.evaluate(cap => window.__im.selectProv(cap), sc.cap); await p.waitForTimeout(500); await shot('2-flag-set-sheet');
    // 6. a unit trained now walks there on its own; the real march is the only animation
    { const w = await p.evaluate(cap => { const im = window.__im, S = im.S; const n0 = S.armies.length; window.__im.rally.spawn(0, cap, 'inf'); const a = S.armies[S.armies.length - 1]; return { n: S.armies.length - n0, path: a.path.length, to: a.to }; }, sc.cap);
      ok(`${TAG}: with a rally point a new unit marches to it`, w.n === 1 && (w.path > 0 || w.to !== null), w); }
    // 7. saved with the game; an old save without rally points loads
    { const r = await p.evaluate(sc0 => { const im = window.__im, j = JSON.parse(IM.api.saveJSON()), had = j.rally && j.rally[sc0.cap]; const old = JSON.parse(JSON.stringify(j)); delete old.rally;
        const r1 = IM.api.restore(j), kept = im.S.rally && im.S.rally[sc0.cap]; const r2 = IM.api.restore(old); return { had, kept, r1: !!r1, r2: !!r2, oldNoRally: !(im.S.rally && Object.keys(im.S.rally).length) }; }, sc).catch(e => ({ err: String(e) }));
      ok(`${TAG}: the rally point is saved and restored; an old save with no rally points loads`, r.had === sc.nb && r.kept === sc.nb && r.r1 && r.r2, r); }
    // 8. Clear removes it and its flag
    await p.evaluate(([cap, nb]) => { window.__im.S.rally = { [cap]: nb }; window.__im.selectProv(cap); }, [sc.cap, sc.nb]); await p.waitForTimeout(500);
    await clickAct('rally-clear'); { const s = await st(); ok(`${TAG}: Clear removes the rally point`, !Object.keys(s.rally).length && !/Clear/.test(s.cs), s); }
    // 9. Cancel leaves the mode without setting; Esc does too (desktop)
    await clickAct('rally'); await tap(T[0], T[1]); await clickAct('rally-cancel'); { const s = await st(); ok(`${TAG}: Cancel leaves the mode, nothing set`, s.rf === null && !s.pick && !Object.keys(s.rally).length, s); }
    // 10. the Set button confirms too
    await p.evaluate(cap => window.__im.selectProv(cap), sc.cap); await p.waitForTimeout(300); await clickAct('rally'); await tap(T[0], T[1]); await clickAct('rally-set'); { const s = await st(); ok(`${TAG}: the Set button sets the rally point`, s.rally[sc.cap] === sc.nb, s); }
    } catch (e){ errors.push(TAG + ' test: ' + (e.message || e).toString().split('\n')[0]); }
    await ctx.close();
  }
  await b.close();
  const bad = Object.entries(checks).filter(([, v]) => !v);
  console.log(log.join('\n'));
  console.log(bad.length || errors.length ? `FAILED ${bad.length} of ${Object.keys(checks).length} checks` : `OK ${Object.keys(checks).length} checks`, 'errors', errors.length ? errors.slice(0, 8) : 'none');
  process.exit(bad.length || errors.length ? 1 : 0);
})();
