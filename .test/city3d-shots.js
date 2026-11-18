// Cities in 3D (CITIES): Kabul, Damascus and Berlin at three zooms (mid hexPx 26, close 70, very close 150), cropped round each city, for the
// before | after sheets. A nations-world game as Syria (Damascus yours: green; Kabul and Berlin others: grey), the clock stopped, by day (or by
// night over the city: NIGHT=1). node .test/city3d-shots.js <outdir> <tag> [phone]   (PAGE=page-before.html for the old page; CITIES=Berlin,..)
const { chromium } = require('playwright'); const path = require('path');
(async () => { const out = process.argv[2], tag = process.argv[3] || 'shot', PHONE = process.argv[4] === 'phone', NIGHT = !!process.env.NIGHT;
  const vp = PHONE ? {width:440, height:900} : {width:1440, height:900}, crop = PHONE ? 400 : 560;
  const CITIES = (process.env.CITIES || 'Kabul,Damascus,Berlin').split(','), ZOOMS = (process.env.ZOOMS || '26,70,150').split(',').map(Number), errs = [];
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 2, isMobile: PHONE, hasTouch: PHONE });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.join(__dirname, process.env.PAGE || 'page.html')); await p.waitForTimeout(900);
  const tap = sel => PHONE ? p.tap(sel) : p.click(sel);
  await tap('[data-act="pickscn"][data-k="world64"]'); await p.waitForTimeout(400);
  const i = await p.evaluate(nm => SCENARIOS.world64.powers.findIndex(P => P.name === nm), 'Syria'); await tap(`[data-act="pick"][data-p="${i}"]`); await p.waitForTimeout(250);
  await p.evaluate(() => document.querySelector('[data-act="begin"]').scrollIntoView()); await tap('[data-act="begin"]'); await p.waitForTimeout(1300);
  if (await p.locator('[data-act="start"]').count()) await tap('[data-act="start"]'); await p.waitForTimeout(3200);
  await p.evaluate(() => { const im = window.__im; im.S.speed = 0; im.SET.tipsOff = true; im.SET.cityLights = true; document.querySelectorAll('.toast').forEach(t => t.remove()); });
  const times = {};
  for (const nm of CITIES){
    await p.evaluate(([nm, night]) => { const im = window.__im, S = im.S, P = im.G.P.find(q => q.cityName === nm), h0 = Math.floor(S.hour/24)*24; let bh = h0, be = night ? 9 : -9;
      for (let h = h0; h < h0 + 24; h++){ S.hour = h; const e = im.sunSinEl(P.id); if (night ? e < be : e > be){ be = e; bh = h; } } S.hour = bh; }, [nm, NIGHT]);
    for (const hx of ZOOMS){
      await p.evaluate(([nm, hx]) => { document.querySelectorAll('.toast,.modal').forEach(t => t.remove()); const im = window.__im, v = im.view, P = im.G.P.find(q => q.cityName === nm), s = hx/12, R = document.getElementById('map').getBoundingClientRect();
        v.s = s; v.x = R.width/2 - P.x*s; v.y = R.height/2 - P.y*s; im.redraw(); }, [nm, hx]);
      for (let k = 0, ok = 0; k < 80 && ok < 4; k++){ await p.waitForTimeout(400); ok = await p.evaluate(() => { window.__im.redraw(); return !window.__im.mapBusy(); }) ? ok + 1 : 0; }
      await p.waitForTimeout(500);
      const R = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
      const c = Math.min(crop, R[2], R[3]); await p.screenshot({ path: `${out}/${tag}-${nm}-${hx}.png`, clip: {x:R[0] + R[2]/2 - c/2, y:R[1] + R[3]/2 - c/2, width:c, height:c} }); }
    times[nm] = await p.evaluate(nm => { const im = window.__im, P = im.G.P.find(q => q.cityName === nm); return im.cityDbg.geo(P.id); }, nm); }
  times.mem = await p.evaluate(() => window.__im.cityDbg.mem());
  console.log(JSON.stringify(times)); console.log('ERRORS', errs.length ? errs.slice(0, 5) : 'none'); await b.close(); process.exit(errs.length ? 1 : 0); })();
