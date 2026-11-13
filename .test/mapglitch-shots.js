// Map glitch repro (fix-map): a nations-world game as the United States (and the classic world for comparison), New York, Europe and Moscow
// at 3 zooms while panning; desktop 1440x900 dpr 2 and a phone 390x844. node .test/mapglitch-shots.js <outdir> <prefix> [world64|world] [desk|phone]
const pickNation = require('./pick-nation.js'); const { chromium } = require('playwright'); const path = require('path');
const OUT = process.argv[2] || __dirname, PRE = process.argv[3] || 'shot', SCN = process.argv[4] || 'world64', DEV = process.argv[5] || 'desk';
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }), errs = [];
  const vp = DEV === 'phone' ? { width: 390, height: 844, dpr: 2, mobile: true } : { width: 1440, height: 900, dpr: 2 };
  const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(600);
  if (SCN === 'world64') await p.click('[data-act="pickscn"][data-k="world64"]');
  await pickNation(p, 'United States'); await p.click('[data-act="begin"]'); await p.waitForTimeout(800); if (await p.locator('[data-act="start"]').count()) await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 40000 }); await p.waitForTimeout(2500);
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); window.__im.S.speed = 0; window.__im.SET.tipsOff = true; });
  const MAP = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const settle = async () => { for (let i = 0, ok = 0; i < 60 && ok < 3; i++){ await p.waitForTimeout(150); ok = await p.evaluate(() => { window.__im.redraw(); return !window.__im.mapBusy(); }) ? ok + 1 : 0; } };
  const at = name => p.evaluate(n => { const P = window.__im.G.P.find(P => P.cityName === n || P.name === n); return P ? [P.x, P.y, P.id, P.name] : null; }, name);
  const setView = (x, y, s) => p.evaluate(([x, y, s, mw, mh]) => { const v = window.__im.view; v.s = s; v.x = mw/2 - x*s; v.y = mh/2 - y*s; window.__im.redraw(); }, [x, y, s, MAP.w, MAP.h]);
  const drag = async (dx, dy) => { const cx = MAP.x + MAP.w/2, cy = MAP.y + MAP.h/2; await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 8; i++) await p.mouse.move(cx + dx*i/8, cy + dy*i/8); await p.mouse.up(); };
  for (const [k, city, hr] of [["ny", "New York", 0], ["eu", "Paris", 18], ["ru", "Moscow", 18], ["sy", "Damascus", 18]].filter(v => !process.env.ONLY || process.env.ONLY.includes(v[0]))){ const c = await at(city); if (!c){ console.log('no', city); continue; } await p.evaluate(h => { window.__im.S.hour = h; }, hr);
    for (const s of (process.env.ZS || "1.6,4.5,14").split(",").map(Number)){ await setView(c[0], c[1], s); await settle(); await drag(-120, 40); await settle();
      await p.screenshot({ path: `${OUT}/${PRE}-${SCN === 'world64' ? 'nat' : 'cls'}-${DEV}-${k}-z${s}.png` }); } }
  console.log('ERRORS', errs.length ? errs : 'none'); await b.close(); })();
