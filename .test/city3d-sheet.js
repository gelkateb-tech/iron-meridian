// Cities in 3D, second pass (CITIES-2): shots of towns at given zooms for the owner's before | after sheets, cropped round each town (not
// shrunk). A nations-world game as NATION (default Afghanistan), the clock stopped, the side panel closed and no toasts, by day (or by night
// over the town: NIGHT=1), with no clouds (the storms cleared: a town is shown, not the weather). node .test/city3d-sheet.js <outdir> <tag> City:hexPx[:crop] ...   (PAGE=page-before.html for the old page; PHONE=1:
// 440 x 900 at dpr 2, touch). Math.random seeded, so both pages start the same game with the same weather (a cloud over a town in one shot only
// looked like a missing bake). Prints per shot the time until the map settled and the tier, and at the end the city canvases' memory.
const { chromium } = require('playwright'); const path = require('path'); const pickNation = require('./pick-nation.js');
(async () => { const out = process.argv[2], tag = process.argv[3], shots = process.argv.slice(4).map(a => a.split(':')), PHONE = !!process.env.PHONE, NIGHT = !!process.env.NIGHT, errs = [];
  const vp = PHONE ? {width:440, height:900} : {width:1440, height:900};
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: PHONE, hasTouch: PHONE });
  await ctx.addInitScript(() => { let a = 12345; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0)/4294967296; }; });   // (one game, one weather for the before and after pages)
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.join(__dirname, process.env.PAGE || 'page.html')); await p.waitForTimeout(900);
  const tap = sel => PHONE ? p.tap(sel) : p.click(sel);
  await tap('[data-act="pickscn"][data-k="world64"]'); await p.waitForTimeout(300); await pickNation(p, process.env.NATION || 'Afghanistan');
  await p.evaluate(() => document.querySelector('[data-act="begin"]').scrollIntoView()); await tap('[data-act="begin"]'); await p.waitForTimeout(1300);
  if (await p.locator('[data-act="start"]').count()) await tap('[data-act="start"]'); await p.waitForTimeout(3000);
  await p.evaluate(() => { const im = window.__im; im.S.speed = 0; im.S.storms = []; im.SET.tipsOff = true; im.SET.cityLights = true; im.SET.saver = false; document.querySelectorAll('.toast').forEach(t => t.remove());
    const x = document.querySelector('[data-act="side-x"]'); if (x && x.offsetParent) x.click(); });
  const res = [];
  for (const [nm, hx0, cr0] of shots){ const hx = +hx0, crop = +(cr0 || (PHONE ? 420 : 640));
    await p.evaluate(([nm, night]) => { const im = window.__im, S = im.S, P = im.G.P.find(q => q.cityName === nm), h0 = Math.floor(S.hour/24)*24; let bh = h0, be = night ? 9 : -9;
      for (let h = h0; h < h0 + 24; h++){ S.hour = h; const e = im.sunSinEl(P.id); if (night ? e < be : e > be){ be = e; bh = h; } } S.hour = bh; }, [nm, NIGHT]);
    const t0 = Date.now();
    await p.evaluate(([nm, hx]) => { document.querySelectorAll('.toast,.modal').forEach(t => t.remove()); const im = window.__im, v = im.view, P = im.G.P.find(q => q.cityName === nm), s = hx/12, R = document.getElementById('map').getBoundingClientRect();
      v.s = s; v.x = R.width/2 - P.x*s; v.y = R.height/2 - P.y*s; im.redraw(); }, [nm, hx]);
    for (let k = 0; k < 600; k++){ await p.waitForTimeout(200); if (await p.evaluate(([nm, n]) => { const im = window.__im; im.redraw(); const h = im.cityDbg.has(im.G.P.find(q => q.cityName === nm).id); return h && (n ? h.exactN !== false && h.exact : h.exact); }, [nm, NIGHT])) break; }   // (the town's own tier made: up to 2 minutes on a busy machine)
    { const cr = crop/2; for (let k = 0; k < 300; k++){ await p.waitForTimeout(200); if (await p.evaluate(cr => { const im = window.__im, v = im.view, R = document.getElementById('map').getBoundingClientRect(), X = (R.width/2 - v.x)/v.s, Y = (R.height/2 - v.y)/v.s, e = cr/v.s, r = [X - e, Y - e, X + e, Y + e];   // (and every other town over the crop: a neighbour's stand-in is a soft patch over it)
      im.redraw(); for (const P of im.G.P){ if (!P.cityName) continue; const g = im.cityDbg.geo(P.id); if (!g || P.x + 1.3*g.E < r[0] || P.x - 1.3*g.E > r[2] || P.y + 1.3*g.E < r[1] || P.y - 1.3*g.E > r[3]) continue; const h = im.cityDbg.has(P.id, r); if (h.geo !== false && !h.exact) return false; } return true; }, cr)) break; } }
    for (let k = 0, ok = 0; k < 150 && ok < 4; k++){ await p.waitForTimeout(250); ok = await p.evaluate(() => { window.__im.redraw(); return !window.__im.mapBusy(); }) ? ok + 1 : 0; }
    const ms = Date.now() - t0; await p.waitForTimeout(400); await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
    const R = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
    const cw = Math.min(crop, R[2]), chh = Math.min(Math.round(crop*0.7), R[3]);
    const f = `${out}/${tag}-${nm.replace(/\W/g, '')}-${hx}.png`; await p.screenshot({ path: f, clip: {x:R[0] + R[2]/2 - cw/2, y:R[1] + R[3]/2 - chh/2, width:cw, height:chh} });
    const g = await p.evaluate(nm => { const im = window.__im, P = im.G.P.find(q => q.cityName === nm), g = im.cityDbg.geo(P.id); return g ? g.S : null; }, nm);
    res.push({nm, hx, ms, S:g}); }
  const mem = await p.evaluate(() => window.__im.cityDbg.mem());
  console.log(JSON.stringify({res, mem})); console.log('ERRORS', errs.length ? errs.slice(0, 5) : 'none'); await b.close(); process.exit(errs.length ? 1 : 0); })();
