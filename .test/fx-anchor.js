// Strike and blast effects stay on their map spot while zooming and panning: node .test/fx-anchor.js [W H dpr]
// A burning city (afxMark puffs), a wreck, an old-style explosion (PART), and every WFX effect (cm bm chem tac icbm exS exM exL, plus the ICBM's
// burning ground) are started round one province, the effects' clock is frozen (file:// hook WFX.fz: no particle moves), and the camera zooms
// in and out round the spot and pans. Every drawn part logs its screen spot and the view (WFX.dbg); its world spot must not change (< 0.5 world px).
// (A mushroom cloud drawn smaller close in, so it stays on screen, logs nothing at those zooms: it is scaled about its foot, which stays put.)
// Then: the concurrency caps (High/Low, Battery saver), no start off screen, and no redraws once every effect has ended.
const { chromium } = require('playwright'); const path = require('path');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), DPR = +(process.argv[4] || 1), PHONE = W <= 820;
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: PHONE, isMobile: PHONE });
  const p = await ctx.newPage(), errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(500);
  await p.click('[data-act="pick"][data-p="5"]'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 }); await p.waitForTimeout(1200);
  const P = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im; im.S.speed = 0; im.SET.fx = 'high'; im.SET.saver = false;
    const B = im.G.P.find(q => q.cityName === 'Berlin'), busy = new Set(im.S.armies.map(a => a.at)); let P = null, bd = Infinity;
    for (const q of im.G.P){ if (q.sea || busy.has(q.id)) continue; const d = Math.hypot(q.x - B.x, q.y - B.y); if (d < bd){ bd = d; P = q; } }
    const s = 6, cw = innerWidth, ch = document.getElementById('map').getBoundingClientRect().height; im.view.s = s; im.view.x = cw/2 - P.x*s; im.view.y = ch/2 - P.y*s; im.redraw();
    return { id: P.id, x: P.x, y: P.y }; });
  // the burning spot and the effects (time running, so the particles have flown off their start spots before the clock is frozen)
  await p.evaluate(P => { const im = window.__im, w = im.wfx; w.mark(P.id, 48); w.WRECKS.push({ wx: P.x + 3, wy: P.y + 2, t0: performance.now() }); w.explode(P.x - 4, P.y + 1, 1.4);
    for (let i = 0; i < 6; i++) w.puff(P.x + i - 3, P.y, { s0: 5, s1: 20, dur: 9000, vx: 6, vy: -12, ox: (i - 3)*3 });
    const K = ['cm', 'bm', 'chem', 'tac', 'icbm', 'exS', 'exM', 'exL'];
    K.forEach((k, i) => w.start(k, P.x + (i - 3.5)*7, P.y + ((i % 3) - 1)*5, { force: true })); }, P);
  await p.waitForTimeout(1300);
  const res = await p.evaluate(async P => { const im = window.__im, w = im.wfx, fr = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const t = performance.now(); w.freeze(t); await fr(); const cw = innerWidth, ch = document.getElementById('map').getBoundingClientRect().height;
    const shots = [], views = [[6, 0, 0], [3, 0, 0], [12, 0, 0], [24, 0, 0], [1.5, 0, 0], [6, 140, -90], [9, -220, 60], [6, 0, 0]];
    for (const [s, dx, dy] of views){ im.view.s = s; im.view.x = cw/2 + dx - P.x*s; im.view.y = ch/2 + dy - P.y*s; w.dbg(true); im.redraw(); await fr(); await fr();
      const m = new Map(); for (const [id, x, y, vs, vx, vy] of w.pos) m.set(id, [(x - vx)/vs, (y - vy)/vs]); w.dbg(false); shots.push(m); }
    const ref = new Map(); let worst = 0, wid = '', n = 0; const kinds = {};
    for (const m of shots) for (const [id, q] of m){ const r = ref.get(id); if (!r){ ref.set(id, q); continue; } n++; const d = Math.hypot(q[0] - r[0], q[1] - r[1]); const k = id.replace(/[:\d].*$/, '') || id[0]; kinds[k] = Math.max(kinds[k] || 0, d); if (d > worst){ worst = d; wid = id; } }
    const per = shots.map(m => m.size); w.freeze(0); return { worst, wid, n, per, kinds: Object.fromEntries(Object.entries(kinds).map(([k, v]) => [k, +v.toFixed(4)])) }; }, P);
  console.log('anchor', JSON.stringify(res));
  if (!(res.n > 200)) errors.push('too few parts compared: ' + res.n);
  if (!(res.worst < 0.5)) errors.push(`part ${res.wid} moved ${res.worst.toFixed(3)} world px while zooming/panning`);
  // the caps: start many ballistic strikes and blasts at once; only cap of each run (the rest fade out)
  const caps = await p.evaluate(async P => { const im = window.__im, w = im.wfx, out = {};
    for (const [fx, sv] of [['high', false], ['low', false], ['high', true], ['low', true]]){ im.SET.fx = fx; im.SET.saver = sv; w.W.list.length = 0;
      for (let i = 0; i < 12; i++) w.start('bm', P.x + i, P.y, { force: true }); for (let i = 0; i < 20; i++) w.start('exM', P.x - i, P.y, { force: true });
      const live = h => w.W.list.filter(e => (e.k[0] !== 'e') === h && e.die == null).length; out[fx + (sv ? '+saver' : '')] = [live(true), w.cap(true), live(false), w.cap(false)]; }
    im.SET.fx = 'high'; im.SET.saver = false; w.W.list.length = 0;
    const off = w.start('bm', P.x + 4000, P.y + 4000) === null; return { out, off }; }, P);
  console.log('caps', JSON.stringify(caps));
  for (const [k, [h, hc, l, lc]] of Object.entries(caps.out)) if (h > hc || l > lc) errors.push(`cap ${k}: ${h}/${hc} heavy, ${l}/${lc} light`);
  if (caps.out.high[1] !== 6 || caps.out.low[1] !== 3 || !(caps.out['high+saver'][1] < 6)) errors.push('caps not 6 High / 3 Low / fewer with saver: ' + JSON.stringify(caps.out));
  if (!caps.off) errors.push('an off-screen strike was started');
  // idle: one cruise blast runs to its end, then the map stops drawing (the burning ground lies still on the paused clock)
  const idle = await p.evaluate(async P => { const im = window.__im, w = im.wfx; w.W.list.length = 0; w.W.burn.length = 0; w.AFX.puff.length = 0; w.PART.length = 0; w.WRECKS.length = 0; w.W.flash = null; w.AFX.heat.clear();
    w.start('cm', P.x, P.y, { force: true }); const rd = im.rd, n0 = rd.n; await new Promise(r => setTimeout(r, 1000)); const during = rd.n - n0;
    await new Promise(r => { const f = () => w.W.list.length ? setTimeout(f, 200) : r(); f(); });
    // then the map's own settling after the camera moves (stand-in city bakes, the settle steps) must be over before frames are counted
    await new Promise(r => { const t0 = performance.now(); const f = () => (performance.now() - rd.inp > im.ambIdle() + 300 && !im.mapBusy()) || performance.now() - t0 > 20000 ? r() : setTimeout(f, 200); f(); });
    const n1 = rd.n; rd.dbg = {}; await new Promise(r => setTimeout(r, 2000)); const why = rd.dbg; rd.dbg = null; return { during, after: rd.n - n1, why }; }, P);
  console.log('idle', JSON.stringify(idle));
  if (!(idle.during >= 15)) errors.push('too few frames while a blast ran: ' + idle.during);
  if (idle.after > 2) errors.push('the map kept drawing after the effects ended: ' + idle.after + ' frames in 2 s');
  console.log(JSON.stringify({ errors })); await b.close(); process.exit(errors.length ? 1 : 0); })();
