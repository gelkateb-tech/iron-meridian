// city markers removal: screenshots of Europe + North Africa.  node .test/mk-shot.js <page.html> <prefix> [W H phone] [night]
const { chromium } = require('playwright');
const page = process.argv[2], shot = process.argv[3], W = +(process.argv[4] || 1440), H = +(process.argv[5] || 900), PHONE = process.argv[6] === 'phone', NIGHT = process.argv[7] === 'night';
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: PHONE ? 2 : 1, hasTouch: PHONE });
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.addInitScript(() => { let s = 0x2f6b1d3; Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0)/4294967296; }; });
  await p.goto('file://' + require('path').resolve(page)); await p.waitForTimeout(600);
  await p.click('[data-act="pick"][data-p="5"]'); await p.click('[data-act="begin"]'); await p.waitForTimeout(300); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 40000 }); await p.waitForTimeout(2500);
  const info = await p.evaluate(night => { const im = window.__im; im.S.speed = 0; if (night) im.S.hour += 13; document.querySelectorAll('.toast').forEach(t => t.remove()); const by = n => im.G.P.find(P => P.cityName === n);
    const o = { s0: im.view.s, c: {} }; for (const n of ['Rome', 'Berlin', 'Tunis']){ const P = by(n); o.c[n] = [P.x, P.y, +im.sunSinEl(P.id).toFixed(2)]; } return o; }, NIGHT);
  const go = async (x, y, s) => { await p.evaluate(([x, y, s]) => { const im = window.__im, v = im.view; v.s = s; v.x = innerWidth/2 - x*s; v.y = innerHeight/2 - y*s; im.redraw(); }, [x, y, s]);
    for (let i = 0, ok = 0; i < 60 && ok < 4; i++){ await p.waitForTimeout(500); ok = await p.evaluate(() => { window.__im.redraw(); return !window.__im.mapBusy(); }) ? ok + 1 : 0; } await p.waitForTimeout(600); };
  const R = info.c.Rome, T = info.c.Tunis, B = info.c.Berlin, s0 = info.s0, k = PHONE ? 0.5 : 1;
  await go(R[0], R[1] + 20, s0*k); await p.screenshot({ path: shot + '.png' });
  await go(R[0], (R[1] + T[1])/2, s0*0.6*k); await p.screenshot({ path: shot + '-wide.png' });
  await go(R[0], R[1], s0*2.2); await p.screenshot({ path: shot + '-close.png' });
  await go(B[0], B[1], s0*1.5); await p.screenshot({ path: shot + '-berlin.png' });
  console.log(JSON.stringify(info), 'errors', errors.length, errors.slice(0, 3)); await b.close(); })();
