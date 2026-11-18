// Bake time per city (CITIES): each city's masks, day bake and night lights at the tiers of hexPx 70 and 150 (desktop dpr 2), made from
// scratch 3 times (best kept), and the city canvases' memory after. node .test/city3d-bake.js   (PAGE=page-before.html for the old page)
const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage({ viewport: {width:1440, height:900}, deviceScaleFactor: 2 }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, process.env.PAGE || 'page.html')); await p.waitForTimeout(900);
  await p.click('[data-act="pickscn"][data-k="world64"]'); await p.waitForTimeout(400);
  const i = await p.evaluate(() => SCENARIOS.world64.powers.findIndex(P => P.name === 'Syria')); await p.click(`[data-act="pick"][data-p="${i}"]`); await p.waitForTimeout(250);
  await p.evaluate(() => document.querySelector('[data-act="begin"]').scrollIntoView()); await p.click('[data-act="begin"]'); await p.waitForTimeout(1300);
  if (await p.locator('[data-act="start"]').count()) await p.click('[data-act="start"]'); await p.waitForTimeout(3500);
  const out = {}; for (const nm of ['Kabul', 'Damascus', 'Berlin', 'Cairo', 'Tokyo']) for (const hx of [70, 150]){
    const r = await p.evaluate(([nm, hx]) => { const im = window.__im, P = im.G.P.find(q => q.cityName === nm); if (!P) return null; im.S.speed = 0; im.view.s = hx/12; const g = im.cityDbg.geo(P.id); if (!g) im.cityDbg.time(P.id, 128); const S = im.cityDbg.geo(P.id).S, best = {};
      for (let k = 0; k < 3; k++){ const t = im.cityDbg.time(P.id, S); for (const q of ['info', 'bake', 'night']) best[q] = Math.min(best[q] ?? 1e9, t[q]); }
      return {S, info:+best.info.toFixed(1), bake:+best.bake.toFixed(1), night:+best.night.toFixed(1)}; }, [nm, hx]);
    out[nm + '@' + hx] = r; }
  out.mem = await p.evaluate(() => window.__im.cityDbg.mem());
  console.log(JSON.stringify(out)); console.log('ERRORS', errs.length ? errs.slice(0, 3) : 'none'); await b.close(); })();
