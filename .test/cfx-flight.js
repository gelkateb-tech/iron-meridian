// Aircraft flight (no gliding): node .test/cfx-flight.js [W H dpr] [outdir]
// Sends a German air wing on a patrol over a province away from its base and samples its drawn flight every frame: no jump between frames
// (> 3x its step), the nose along the path (heading vs. direction of travel), it banks in turns, accelerates after take-off, and once on station
// loops round the patrol point. Takes screenshots: take-off, a banked turn, the patrol loop. Exit 1 on a failure or a page error.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), DPR = +(process.argv[4] || 1), OUT = process.argv[5] || path.join(__dirname, 'cfx-shots'), PHONE = W <= 820;
fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: PHONE, isMobile: PHONE })).newPage(), errors = [];
  p.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(500);
  await p.click('[data-act="pick"][data-p="5"]'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 }); await p.waitForTimeout(1200);
  const info = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im, S = im.S, G = im.G; S.speed = 1;
    let a = S.armies.find(x => x.owner === 0 && x.air && !x.fly && (x.u.jet || x.u.int || x.u.asf));
    if (!a){ const home = G.P.find(q => q.cityName === 'Berlin'); a = addArmy(0, home.id, { asf: 2 }); a.air = { base: home.id, cd: 0 }; visCache = null; }
    const B = G.P[a.air.base];
    // a land province of our own about 40-70 world px away, off the straight line's axis
    let best = null; for (const q of G.P){ if (q.sea || S.owner[q.id] !== 0) continue; const d = Math.hypot(q.x - B.x, q.y - B.y); if (d > 35 && d < 75 && (!best || Math.abs(d - 55) < Math.abs(best.d - 55))) best = { q, d }; }
    if (!best) return { err: 'no target' }; const ok = orderAir(a, best.q.id); const s = 7, cx = (B.x + best.q.x)/2, cy = (B.y + best.q.y)/2;
    im.view.s = s; im.view.x = innerWidth/2 - cx*s; im.view.y = document.getElementById('map').getBoundingClientRect().height/2 - cy*s; im.redraw();
    window.__fl = []; const step = () => { const v = im.cfx.VW.get(a.id); if (v) window.__fl.push([performance.now(), v.x, v.y, v.hd, v.bank || 0, v.stage]); if (window.__fl.length < 3000) requestAnimationFrame(step); }; requestAnimationFrame(step);
    return { ok, id: a.id, base: [B.x, B.y], tgt: [best.q.x, best.q.y], d: best.d }; });
  console.log(JSON.stringify(info)); if (info.err || !info.ok){ console.log('cannot run'); await b.close(); process.exit(1); }
  await p.waitForTimeout(450); await p.screenshot({ path: path.join(OUT, `${W}x${H}-flight-takeoff.png`) });
  // wait for the turn onto station (stage over) and shoot while banked
  let shotTurn = false, shotLoop = false; const t0 = Date.now();
  while (Date.now() - t0 < 30000 && !(shotTurn && shotLoop)){ await p.waitForTimeout(120);
    const st = await p.evaluate(id => { const v = window.__im.cfx.VW.get(id); return v ? { stage: v.stage, bank: v.bank || 0 } : null; }, info.id); if (!st) continue;
    if (!shotTurn && Math.abs(st.bank) > 0.45){ shotTurn = true; await p.screenshot({ path: path.join(OUT, `${W}x${H}-flight-bank.png`) }); }
    if (!shotLoop && st.stage === 'over' && Date.now() - t0 > 6000){ await p.waitForTimeout(2500); shotLoop = true; await p.screenshot({ path: path.join(OUT, `${W}x${H}-flight-loop.png`) }); } }
  const r = await p.evaluate(() => { const F0 = window.__fl, F = F0.filter((f, i) => i === 0 || f[1] !== F0[i - 1][1] || f[2] !== F0[i - 1][2]), out = { n: F.length, maxSpd: 0, maxNose: 0, maxBank: 0, loopSpan: 0 };
    for (let i = 1; i < F.length; i++){ const dx = F[i][1] - F[i - 1][1], dy = F[i][2] - F[i - 1][2], d = Math.hypot(dx, dy), dt = Math.max(1, F[i][0] - F[i - 1][0]); out.maxSpd = Math.max(out.maxSpd, d/dt*1000); out.maxBank = Math.max(out.maxBank, Math.abs(F[i][4]));
      if (d > 0.05){ let e = Math.atan2(dy, dx) - F[i][3]; e = Math.atan2(Math.sin(e), Math.cos(e)); out.maxNose = Math.max(out.maxNose, Math.abs(e)); } }
    const ov = F.filter(f => f[5] === 'over'); if (ov.length){ const xs = ov.map(f => f[1]), ys = ov.map(f => f[2]); out.loopSpan = [Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]; }
    // the same steering on its own (fx.js flightStep, 60 frames a second): take-off run, cruise, landing at a base 60 world px away
    const fs = window.__im.cfx.M.flightStep, v = { x: 0, y: 0 }, sp = []; let turnMax = 0, hd0 = null;
    for (let i = 0; i < 600; i++){ const x0 = v.x, y0 = v.y, done = fs(v, 60, 20, 1/60, { spd: 70, base: [60, 20] }); fs; sp.push(Math.hypot(v.x - x0, v.y - y0)*60); if (hd0 != null) turnMax = Math.max(turnMax, Math.abs(Math.atan2(Math.sin(v.hd - hd0), Math.cos(v.hd - hd0)))); hd0 = v.hd; if (done) break; }
    const v2 = { x: 0, y: 0, hd: 0 }, sp2 = []; for (let i = 0; i < 60; i++){ const x0 = v2.x, y0 = v2.y; fs(v2, 100, 0, 1/60, { spd: 70, base: [0, 0] }); sp2.push(Math.hypot(v2.x - x0, v2.y - y0)*60); }
    out.takeoff = [sp2[0], sp2[10], sp2[30], sp2[59]].map(q => +q.toFixed(1)); out.landing = sp.slice(-6).map(q => +q.toFixed(1)); out.cruise = +Math.max(...sp).toFixed(1); out.turnMax = +turnMax.toFixed(3);
    return out; });
  console.log('flight', JSON.stringify(r));
  if (!(r.maxSpd < 70*2.2*1.1)) errors.push('a jump in the drawn flight: ' + r.maxSpd.toFixed(1) + ' world px/s');
  if (!(r.maxNose < 0.15)) errors.push('the nose does not point along the path: ' + r.maxNose.toFixed(3) + ' rad');
  if (!(r.maxBank > 0.2)) errors.push('no bank in the turns');
  if (!(r.takeoff[0] < r.takeoff[3]*0.5 && r.takeoff[1] < r.takeoff[2] && r.takeoff[2] <= r.takeoff[3] + 0.1)) errors.push('no acceleration after take-off: ' + r.takeoff);
  if (!(r.landing[r.landing.length - 1] < r.cruise*0.5)) errors.push('no slowing down to land: ' + r.landing + ' cruise ' + r.cruise);
  if (!(r.loopSpan && r.loopSpan[0] > 15 && r.loopSpan[1] > 6)) errors.push('no patrol loop: ' + JSON.stringify(r.loopSpan));
  console.log(JSON.stringify({ errors })); await b.close(); process.exit(errors.length ? 1 : 0); })();
