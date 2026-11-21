// Cities (CITIES redo): screenshots of towns for the owner's before | after sheets. A nations-world game as NATION (default Germany), the clock
// stopped, the side panel closed, no toasts, no forces on the map (S.armies emptied: a town is shown, not the troops), no storms, Math.random
// seeded (both pages start the same game and weather). Each shot: the town centred at hexPx, its own tier (and every town's over the crop)
// made, the map settled; clip CROPxCROP*0.7 CSS px round the centre, at dpr 2.
//   node .test/city-shots.js <outdir> <tag> City:hexPx[:d|n] ...   (PAGE=page-before.html for the old page; PHONE=1 for a phone profile)
const { chromium, devices } = require('playwright'); const path = require('path'); const pickNation = require('./pick-nation.js');
(async () => { const out = process.argv[2], tag = process.argv[3], shots = process.argv.slice(4).map(a => a.split(':')), PHONE = !!process.env.PHONE, errs = [];
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext(PHONE ? {...devices['Pixel 7']} : { viewport: {width:+(process.env.VW || 1440), height:+(process.env.VH || 900)}, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => { let a = 12345; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0)/4294967296; }; });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.join(__dirname, process.env.PAGE || 'page.html')); await p.waitForTimeout(900);
  const tap = sel => PHONE ? p.tap(sel) : p.click(sel);
  await tap('[data-act="pickscn"][data-k="world64"]'); await p.waitForTimeout(300); await pickNation(p, process.env.NATION || 'Germany');
  await p.evaluate(() => document.querySelector('[data-act="begin"]').scrollIntoView()); await tap('[data-act="begin"]'); await p.waitForTimeout(1300);
  if (await p.locator('[data-act="start"]').count()) await tap('[data-act="start"]');
  for (let k = 0; k < 60; k++){ if (await p.evaluate(() => { const im = window.__im; if (!im || !im.S || !im.S.owner) return false; im.S.speed = 0; return true; })) break; await p.waitForTimeout(50); }
  await p.waitForTimeout(3000);
  await p.evaluate(() => { const im = window.__im; im.S.speed = 0; im.S.storms = []; im.S.armies.length = 0; im.SET.tipsOff = true; im.SET.cityLights = true; im.SET.saver = false; document.querySelectorAll('.toast').forEach(t => t.remove());
    const x = document.querySelector('[data-act="side-x"]'); if (x && x.offsetParent) x.click(); });
  const crop = +(process.env.CROP || (PHONE ? 400 : 600)), res = [];
  for (const [nm, hx0, dn] of shots){ const hx = +hx0, night = dn === 'n';
    await p.evaluate(([nm, night]) => { const im = window.__im, S = im.S, P = im.G.P.find(q => q.cityName === nm), h0 = 24*10; let bh = h0, be = night ? 9 : -9;
      for (let h = h0; h < h0 + 24; h++){ S.hour = h; const e = im.sunSinEl(P.id); if (night ? e < be : e > be){ be = e; bh = h; } } S.hour = bh; }, [nm, night]);
    const t0 = Date.now();
    await p.evaluate(([nm, hx]) => { document.querySelectorAll('.toast,.modal').forEach(t => t.remove()); const im = window.__im, v = im.view, P = im.G.P.find(q => q.cityName === nm), s = hx/12, R = document.getElementById('map').getBoundingClientRect();
      v.s = s; v.x = R.width/2 - P.x*s; v.y = R.height/2 - P.y*s; im.redraw(); }, [nm, hx]);
    // every town over the crop on its own tier (by day; at night its lights too): a neighbour's stand-in would show as a soft patch
    for (let k = 0; k < 200; k++){ await p.waitForTimeout(200); if (await p.evaluate(([n, cr]) => { const im = window.__im, v = im.view; im.redraw(); const R = document.getElementById('map').getBoundingClientRect(), X = (R.width/2 - v.x)/v.s, Y = (R.height/2 - v.y)/v.s, ex = cr/2/v.s, ey = cr*0.35/v.s;
      for (const P of im.G.P){ if (!P.city || P.sea) continue; const g = im.cityDbg.geo(P.id), E = g ? g.E : 25; if (P.x < X - ex || P.x > X + ex || P.y < Y - ey || P.y > Y + ey) continue; if (!g) return false;
        const h = im.cityDbg.has(P.id); if (!h.exact) return false; if (n){ const q = im.cityDbg.night(P.id); if (!q || !q.exact) return false; } } return true; }, [night, crop])) break; }
    const tA = Date.now() - t0;
    for (let k = 0, ok = 0; k < 24 && ok < 5; k++){ await p.waitForTimeout(250); ok = await p.evaluate(() => { window.__im.redraw(); return !window.__im.mapBusy(); }) ? ok + 1 : 0; }
    const ms = Date.now() - t0; await p.waitForTimeout(600); await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
    const R = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
    const cw = Math.min(crop, R[2]), chh = Math.min(Math.round(crop*0.7), R[3]);
    const f = `${out}/${tag}-${nm.replace(/\W/g, '')}-${hx}-${night ? 'n' : 'd'}.png`; await p.screenshot({ path: f, clip: {x:R[0] + R[2]/2 - cw/2, y:R[1] + R[3]/2 - chh/2, width:cw, height:chh} });
    const g = await p.evaluate(nm => { const im = window.__im, P = im.G.P.find(q => q.cityName === nm), g = im.cityDbg.geo(P.id); return g ? g.S : null; }, nm);
    res.push({nm, hx, night, ms, tA, S:g, hour:await p.evaluate(() => window.__im.S.hour)}); }
  const mem = await p.evaluate(() => window.__im.cityDbg.mem());
  console.log(JSON.stringify({res, mem})); console.log('ERRORS', errs.length ? errs.slice(0, 5) : 'none'); await b.close(); process.exit(errs.length ? 1 : 0); })();
