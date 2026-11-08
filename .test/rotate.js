// Rotation / resize with no input (Battery saver repair 2): node .test/rotate.js [tries]
// A phone (390x844, dpr 3, touch), saver OFF and ON, paused on a quiet land view at zoom 1.2 (names of every kind drawn), the map rested (no
// frames). The viewport turns to 844x390 and back with no touch; once the map has stopped drawing, its canvases (map and the 3x overlay) are
// read, a frame is forced (redraw) and they are read again: the two must be the same picture. Before the fix, names stayed placed against the
// HUD boxes of the old layout (the cached boxes, and on a phone the command sheet still sliding away), so a forced frame changed thousands of
// pixels, until the next input. Also: a HUD panel resizing with no input asks for frames (ResizeObserver).
const { chromium } = require('playwright');
const tries = +(process.argv[2] || 3), errs = [], res = {};
const PAGE = process.env.PAGE || 'page.html';
// (the canvases as shown) vs (after one forced frame): pixels that differ by more than 40 summed over RGBA, and their box in css px
const stale = p => p.evaluate(async () => {
  const im = window.__im, cvs = [document.getElementById('map'), document.getElementById('mapov')].filter(c => c && !c.hidden && c.width > 1);
  const grab = () => cvs.map(c => c.getContext('2d').getImageData(0, 0, c.width, c.height));
  const A = grab(), n0 = im.rd.n; im.redraw(); await new Promise(r => setTimeout(r, 120)); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const B = grab(); let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let k = 0; k < A.length; k++){ const a = A[k].data, b = B[k].data, w = A[k].width, sc = w/innerWidth; if (a.length !== b.length){ n += 1e6; continue; }
    for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) + Math.abs(a[i + 3] - b[i + 3]) > 40){ n++; const q = i/4, X = (q % w)/sc, Y = Math.floor(q/w)/sc; x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y); } }
  return { n, box: n ? [x0, y0, x1, y1].map(Math.round).join(',') : null, forced: im.rd.n - n0 }; });
const draws = p => p.evaluate(() => window.__im.rd.n);
const idle = p => p.evaluate(() => new Promise(r => { const im = window.__im; const f = () => performance.now() - im.rd.inp > im.ambIdle() + 300 ? r() : setTimeout(f, 200); f(); }));
const quiet = async p => { for (let i = 0; i < 40; i++){ const a = await draws(p); await p.waitForTimeout(800); if (await draws(p) === a) return true; } return false; };
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });   // (file:// pictures do not taint the canvas then)
  for (const sv of [false, true]){ const key = sv ? 'saverOn' : 'saverOff'; res[key] = [];
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }), p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await p.addInitScript(sv => { try { localStorage.setItem('iron-meridian-settings', JSON.stringify({saver: sv})); } catch (e) {} }, sv);
    await p.goto('file://' + __dirname + '/' + PAGE); await p.waitForTimeout(900);
    await p.click('[data-act="pick"][data-p="5"]'); await p.click('[data-act="begin"]'); await p.waitForTimeout(300); await p.click('[data-act="start"]');
    await p.waitForFunction(() => window.__im && !window.__im.camFly, null, { timeout: 20000 }); await p.waitForTimeout(2500);
    await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im, G = im.G, S = im.S; S.speed = 0; im.v3c.clearSel();
      let best = null, bd = -1; for (const P of G.P){ if (P.sea) continue; let d = Infinity; for (const a of S.armies){ const A = G.P[a.at]; d = Math.min(d, (A.x - P.x)**2 + (A.y - P.y)**2); } if (d > bd){ bd = d; best = P; } }
      const v = im.view; v.s = 1.2; v.x = innerWidth/2 - best.x*v.s; v.y = innerHeight/2 - best.y*v.s; im.redraw(); });
    for (let t = 0; t < tries; t++){ await idle(p); await quiet(p); const d0 = await draws(p);
      await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(600); const land = await stale(p);
      await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(600 + 400*t); await quiet(p); const back = await stale(p);
      const rec = { try: t, draws: (await draws(p)) - d0, land, back }; res[key].push(rec);
      for (const [w, r] of [['landscape', land], ['back to portrait', back]]) if (r.n > 200) errs.push(`${key} try ${t}: stale map ${w} after a rotation with no input (a forced frame changed ${r.n} px in ${r.box})`); }
    if (!sv){ await idle(p); await quiet(p); const e0 = await draws(p);   // a HUD panel resizing with no input asks for frames (ResizeObserver)
      await p.evaluate(() => { const m = document.querySelector('.mapctl'); if (m) m.style.minWidth = (m.offsetWidth + 30) + 'px'; }); await p.waitForTimeout(800);
      res.hudResizeDraws = (await draws(p)) - e0; if (res.hudResizeDraws < 1) errs.push('a HUD panel resizing with no input asked for no frame'); }
    await ctx.close(); }
  await b.close();
  console.log(JSON.stringify(res));
  console.log('ERRORS', errs.length ? errs : 'none'); process.exit(errs.length ? 1 : 0);
})();
