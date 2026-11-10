// Rules split (owner task 5): quick speed comparison of two test pages (sim ms per game day through window.__im.tick, and forced redraws per second).
//   node tools/split-perf.js page.html [other.html] [days=6]
const { chromium } = require('playwright'); const path = require('path'), TEST = path.join(process.env.IM_ROOT || path.join(__dirname, '..'), '.test');
(async () => { const pages = process.argv.slice(2).filter(a => /\.html$/.test(a)), days = +(process.argv.slice(2).find(a => /^\d+$/.test(a)) || 6); const b = await chromium.launch();
  for (let rep = 0; rep < 2; rep++) for (const page of pages){ const errs = []; const p = await b.newPage({ viewport: { width: 1300, height: 820 } }); p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.join(TEST, page)); await p.waitForTimeout(800);
    if (await p.locator('[data-act="pick"]').count()){ await p.click('[data-act="pick"][data-p="0"]'); await p.click('[data-act="begin"]'); }
    await p.click('[data-act="start"]'); await p.waitForTimeout(500);
    await p.evaluate(() => { for (let i = 0; i < 72; i++) window.__im.tick(); });
    const t0 = Date.now(); await p.evaluate(d => { for (let i = 0; i < d*24; i++) window.__im.tick(); }, days); const ms = Date.now() - t0;
    const fps = await p.evaluate(() => new Promise(r => { let n = 0; const t = performance.now(); const f = () => { window.__im.redraw(); if (++n < 120) requestAnimationFrame(f); else r(Math.round(120000/(performance.now() - t))); }; requestAnimationFrame(f); }));
    console.log(page.padEnd(22), 'ms/day', Math.round(ms/days), ' redraws/s', fps, errs.length ? 'ERRORS ' + errs.slice(0, 2) : ''); await p.close(); }
  await b.close(); })();
