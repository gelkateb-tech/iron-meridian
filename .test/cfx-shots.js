// Combat effects screenshots: every weapon of the Effects test fired at a test target, 3 frames each (launch, mid-flight, impact).
//   node .test/cfx-shots.js [W H dpr] [outdir] [weapons,comma] [zoom]
// Writes <outdir>/<W>x<H>-<weapon>-<1|2|3>.png and prints page errors (exit 1 on any).
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), DPR = +(process.argv[4] || 2), PHONE = W <= 820;
const OUT = process.argv[5] || path.join(__dirname, 'cfx-shots'), ONLY = process.argv[6] ? process.argv[6].split(',') : null, Z = +(process.argv[7] || 12);
fs.mkdirSync(OUT, { recursive: true });
// weapon -> [frame times in ms after firing]
const PLAN = { tank: [290, 380, 700], art: [330, 1100, 2700], mlrs: [400, 1200, 2500], inf: [330, 520, 900], ship: [330, 1100, 2400], cruise: [200, 1700, 3700],
  ballistic: [250, 2500, 5300], icbm: [400, 5000, 8700], fighter: [150, 600, 1300], bomber: [300, 1300, 2600], drone: [100, 600, 1300], swarm: [150, 600, 1300], sam: [250, 650, 1000] };
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: PHONE, isMobile: PHONE });
  const p = await ctx.newPage(), errors = []; p.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | '))); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(500);
  await p.click('[data-act="pick"][data-p="5"]'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 }); await p.waitForTimeout(1500);
  const P = await p.evaluate(Z => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im; im.S.speed = 0; im.SET.fx = 'high'; im.SET.saver = false;
    const B = im.G.P.find(q => q.cityName === 'Berlin'); const s = Z, cw = innerWidth, ch = document.getElementById('map').getBoundingClientRect().height; im.view.s = s; im.view.x = cw/2 - (B.x + 2)*s; im.view.y = ch/2 - (B.y + 1)*s; im.redraw();
    return { x: B.x, y: B.y }; }, Z);
  await p.waitForTimeout(1500);
  for (const w of Object.keys(PLAN)){ if (ONLY && !ONLY.includes(w)) continue;
    const far = w === 'cruise' || w === 'ballistic' || w === 'icbm' ? 14 : w === 'art' || w === 'mlrs' || w === 'ship' ? 9 : 5;
    await p.evaluate(([w, P, far]) => { const im = window.__im, A = [P.x - far, P.y + far*0.35], B = [P.x + 4, P.y]; if (w === 'sam') im.cfx.intercept([P.x - 3, P.y + 3], B, { kind: 'cm' }); else im.cfx.fire(w, A, B, { mine: true }); }, [w, P, far]);
    const t0 = Date.now(); let i = 0;
    for (const t of PLAN[w]){ const d = t - (Date.now() - t0); if (d > 0) await p.waitForTimeout(d); i++; await p.screenshot({ path: path.join(OUT, `${W}x${H}-${w}-${i}.png`) }); }
    await p.waitForTimeout(w === 'icbm' ? 6000 : 1500); }
  const n = await p.evaluate(() => ({ proj: window.__im.cfx.PROJ.length, part: window.__im.cfx.PART.length }));
  console.log(JSON.stringify({ n, errors })); await b.close(); process.exit(errors.length ? 1 : 0); })();
