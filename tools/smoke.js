// Smoke test: node tools/smoke.js [days] [outdir]  (run tools/mkpage.sh first)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const days = +(process.argv[2] || 30), out = process.argv[3] || path.join(__dirname, '..', '.test');
  const page = path.join(__dirname, '..', '.test', 'page.html');
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 860 } });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const t0 = Date.now();
  await p.goto('file://' + page); await p.waitForTimeout(600);
  const loadMs = Date.now() - t0;
  const hasPicker = await p.locator('[data-act="pick"]').count();
  if (hasPicker){ await p.click('[data-act="pick"][data-p="0"]'); await p.click('[data-act="begin"]'); }
  await p.click('[data-act="start"]'); await p.click('#sp0'); await p.waitForTimeout(400);
  await p.screenshot({ path: out + '/smoke-home.png' });
  // frame time
  const fps = await p.evaluate(() => new Promise(r => { let n = 0; const t = performance.now(); const f = () => { if (++n < 60) requestAnimationFrame(f); else r(Math.round(60000/(performance.now() - t))); }; requestAnimationFrame(f); }));
  const t1 = Date.now();
  const res = await p.evaluate(d => { const im = window.__im; for (let i = 0; i < d*24; i++) im.tick(); const S = im.S;
    return { hour: S.hour, over: S.over, armies: S.armies.length, nations: S.nations.map(n => `${n.name}:${S.owner.filter(o => o === n.id).length}${n.alive ? '' : '✗'}`).join(' '), log: S.log.slice(0, 8).map(l => l.text) }; }, days);
  const simMs = Date.now() - t1;
  const modalText = await p.evaluate(() => { const m = document.getElementById('modal'); const t = m.hidden ? '' : m.innerText.slice(0, 160); m.hidden = true; return t; });
  res.modal = modalText;
  await p.waitForTimeout(150); await p.evaluate(() => { document.getElementById('modal').hidden = true; }); await p.click('#zfit', { force: true }); await p.waitForTimeout(300);
  await p.screenshot({ path: out + '/smoke-world.png' });
  console.log(JSON.stringify({ loadMs, hasPicker, fps, simMs, msPerDay: Math.round(simMs/days), ...res }, null, 1));
  console.log('ERRORS', errs.length ? errs : 'none');
  await b.close();
})();
