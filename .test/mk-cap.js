// city markers removal: capture label / power-name / HQ / tray boxes and screenshots at fixed cameras.
//   node .test/mk-cap.js <page.html> <out.json> [shotPrefix] [W H phone]
const { chromium } = require('playwright'); const fs = require('fs');
const page = process.argv[2], out = process.argv[3], shot = process.argv[4] || '', W = +(process.argv[5] || 1440), H = +(process.argv[6] || 900), PHONE = process.argv[7] === 'phone';
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: PHONE ? 2 : 1, hasTouch: PHONE });
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.addInitScript(() => { let s = 0x2f6b1d3; Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0)/4294967296; }; window.__dbgBoxes = {};
    try { const k = 'iron-meridian-settings', o = JSON.parse(localStorage.getItem(k) || '{}'); o.saver = false; localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} });
  await p.goto('file://' + require('path').resolve(page)); await p.waitForTimeout(600);
  await p.click('[data-act="pick"][data-p="5"]'); await p.click('[data-act="begin"]'); await p.waitForTimeout(300); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 40000 }); await p.waitForTimeout(1500);
  const info = await p.evaluate(() => { const im = window.__im; im.S.speed = 0; document.querySelectorAll('.toast').forEach(t => t.remove()); const by = n => im.G.P.find(P => P.cityName === n);
    const o = { s0: im.view.s, hour: im.S.hour, c: {} }; for (const n of ['Rome', 'Berlin', 'Cairo', 'Paris', 'Tunis', 'Madrid', 'Moscow']){ const P = by(n); if (P) o.c[n] = [P.x, P.y, P.id, +im.sunSinEl(P.id).toFixed(2)]; } return o; });
  const res = { info, views: {} };
  const go = async (x, y, s) => { await p.evaluate(([x, y, s]) => { const im = window.__im, v = im.view; v.s = s; v.x = innerWidth/2 - x*s; v.y = innerHeight/2 - y*s; im.redraw(); }, [x, y, s]);
    await p.waitForTimeout(700); try { await p.waitForFunction(() => !window.__im.mapBusy(), null, { timeout: 30000 }); } catch (e) {} await p.evaluate(() => window.__im.redraw()); await p.waitForTimeout(500); };
  const grab = () => p.evaluate(() => { const d = window.__dbgBoxes; return { lab: d.lab, pn: d.pn, tb: d.tb, mk: d.mk, kl: d.kl }; });
  const C = info.c, R = C.Rome, s0 = info.s0;
  for (const [nm, c] of Object.entries(C)) for (const hp of [3, 4.5, 6, 8.5, 12, 18, 30, 60]){ await go(c[0], c[1], hp/12); res.views[nm + '@' + hp] = await grab(); }
  if (shot){ const mid = C.Tunis || R;
    await go(R[0], R[1] + 20, s0); await p.screenshot({ path: shot + '.png' });                       // Europe + North Africa, the default play zoom
    await go(R[0], (R[1] + mid[1])/2, s0*0.6); await p.screenshot({ path: shot + '-wide.png' });
    await go(R[0], R[1], s0*2.2); await p.screenshot({ path: shot + '-close.png' });
    await go(C.Berlin[0], C.Berlin[1], s0*1.5); await p.screenshot({ path: shot + '-berlin.png' }); }
  res.errors = errors; fs.writeFileSync(out, JSON.stringify(res)); console.log(JSON.stringify(info), 'errors', errors.length, errors.slice(0, 3)); await b.close(); })();
