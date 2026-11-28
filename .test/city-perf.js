// Cities (CITIES redo; from the cities-3d test): the map's speed over a crowd of towns, for a before | after comparison on one machine. A nations-world game as Germany,
// the clock stopped, the view on Berlin (central Europe: many towns), by day or by night over Berlin. Windows measured (rAF intervals and the
// main thread's busy time per frame from the CDP sampling profiler, with the cities' own share):
//   pan30 / pan240   a steady pan at hexPx 30 (play zoom) and 240 (the closest zoom) (bakes taken from the cache)
//   zoom             a pinch-like zoom in and out between hexPx 40 and 160 (a frame a step: new tiers asked for and baked between frames)
// and the city cache: the time until Berlin's own tier is made at the first views (settle, ms; the bakes of the towns round it go on after), the bake time per tier (CBT: count, total, worst ms;
// the longest slice), the memory the city canvases hold (MB), and one town made from nothing at hexPx 150 (cityDbg.time: masks, day, night ms).
//   node .test/city3d-perf.js [--phone] [--night] [--page page.html] [--json out.json]
//   (--phone: a modern phone, Pixel 7 profile 412x915 dpr 2.625 (VW/VH: another viewport), touch, the CPU throttled x2 during the measured windows)
const { chromium, devices } = require('playwright'); const path = require('path'), fs = require('fs'), os = require('os');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d; };
const PHONE = process.argv.includes('--phone'), NIGHT = process.argv.includes('--night'), PAGE = arg('page', 'page.html'), JSON_OUT = arg('json', '');
const CITYF = ['drawCitiesLayer', 'drawCitiesIn', 'drawCityLights', 'cityPump', 'cityWarmPump', 'cityDraw', 'cityBake', 'cityChunk', 'cityLightsBake', 'cityLightsChunk'];
function aggregate(prof){ const byId = new Map(); prof.nodes.forEach(n => byId.set(n.id, n)); const parent = new Map(); prof.nodes.forEach(n => (n.children || []).forEach(c => parent.set(c, n.id)));
  const incl = new Map(); let busy = 0;
  for (let i = 0; i < prof.samples.length; i++){ const d = (prof.timeDeltas[i] || 0)/1000; let id = prof.samples[i]; if (byId.get(id).callFrame.functionName === '(idle)') continue; busy += d;
    const seen = new Set(); while (id != null){ const fn = byId.get(id).callFrame.functionName; if (!seen.has(fn)){ seen.add(fn); incl.set(fn, (incl.get(fn) || 0) + d); } id = parent.get(id); } }
  return {busy, draw:incl.get('draw') || 0, city:Math.max(...CITYF.map(k => incl.get(k) || 0)), top:[...incl].filter(e => e[0] && e[0][0] !== '(').sort((a, b) => b[1] - a[1]).slice(0, 18)}; }   // (top: the functions with the most time, inclusive)
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext(PHONE ? {...devices['Pixel 7'], ...(process.env.VW ? {viewport:{width:+process.env.VW, height:+(process.env.VH || 915)}} : {})} : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => { let a = 12345; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0)/4294967296; }; });
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const cdp = await ctx.newCDPSession(p), tap = sel => PHONE ? p.tap(sel) : p.click(sel);
  await p.goto('file://' + (path.isAbsolute(PAGE) ? PAGE : path.join(__dirname, PAGE))); await p.waitForTimeout(800);
  await tap('[data-act="pickscn"][data-k="world64"]'); await p.waitForTimeout(300);
  const i = await p.evaluate(() => SCENARIOS.world64.powers.findIndex(P => P.name === 'Germany')); await tap(`[data-act="pick"][data-p="${i}"]`); await p.waitForTimeout(200);
  await p.evaluate(() => document.querySelector('[data-act="begin"]').scrollIntoView()); await tap('[data-act="begin"]'); await p.waitForTimeout(1300);
  if (await p.locator('[data-act="start"]').count()) await tap('[data-act="start"]'); await p.waitForTimeout(3000);
  await p.evaluate(night => { const im = window.__im, S = im.S; S.speed = 0; im.SET.tipsOff = true; im.SET.cityLights = true; im.SET.saver = false; document.querySelectorAll('.toast,.modal').forEach(t => t.remove());
    const P = im.G.P.find(q => q.cityName === 'Berlin'), h0 = Math.floor(S.hour/24)*24; let bh = h0, be = night ? 9 : -9;
    for (let h = h0; h < h0 + 24; h++){ S.hour = h; const e = im.sunSinEl(P.id); if (night ? e < be : e > be){ be = e; bh = h; } } S.hour = bh; }, NIGHT);
  const go = hx => p.evaluate(hx => { const im = window.__im, v = im.view, P = im.G.P.find(q => q.cityName === 'Berlin'), s = hx/12, R = document.getElementById('map').getBoundingClientRect(); v.s = s; v.x = R.width/2 - P.x*s; v.y = R.height/2 - P.y*s; im.redraw(); }, hx);
  async function quiet(max = 20000){ const t0 = Date.now(); let ok = 0; while (Date.now() - t0 < max && ok < 4){ await p.waitForTimeout(250); ok = await p.evaluate(() => { window.__im.redraw(); return !window.__im.mapBusy(); }) ? ok + 1 : 0; } return Date.now() - t0; }
  // the city cache: settle at the first views (every tier the windows below use made once), its bake times and memory
  const settle = {}; for (const hx of [30, 240]){ await go(hx); const t0 = Date.now(); while (Date.now() - t0 < 60000 && !(await p.evaluate(() => { const im = window.__im; im.redraw(); return im.cityDbg.has(im.G.P.find(q => q.cityName === 'Berlin').id).exact; }))) await p.waitForTimeout(100); settle[hx] = Date.now() - t0; await quiet(); }
  const cache = await p.evaluate(() => { const im = window.__im, st = im.cityDbg.stats(), T = {}; let n = 0, ms = 0; for (const [k, v] of Object.entries(st)){ if (k === 'slice') continue; T[k] = [v[0], +v[1].toFixed(1), +v[2].toFixed(1)]; n += v[0]; ms += v[1]; }
    return {bakes:n, bakeMs:+ms.toFixed(0), slice:[st.slice[0], +st.slice[1].toFixed(0), +st.slice[2].toFixed(1)], tiers:T, mem:im.cityDbg.mem()}; });
  if (PHONE) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 2 });
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 250 });
  const runs = {};
  async function measure(name, ms, step){
    await p.evaluate(s => { window.__M = {step:new Function('k', s), t:[]}; }, step);
    await cdp.send('Profiler.start');
    const fr = await p.evaluate(ms => new Promise(res => { const M = window.__M, t0 = performance.now(); let k = 0; const f = t => { M.t.push(t); M.step(k++); if (t - t0 < ms) requestAnimationFrame(f); else res(M.t); }; requestAnimationFrame(f); }), ms);
    const { profile } = await cdp.send('Profiler.stop');
    const iv = []; for (let i = 1; i < fr.length; i++) iv.push(fr[i] - fr[i - 1]); iv.sort((x, y) => x - y);
    const A = aggregate(profile), nF = Math.max(1, iv.length);
    runs[name] = {fps:+(iv.length*1000/(fr[fr.length - 1] - fr[0])).toFixed(1), p50:+iv[iv.length >> 1].toFixed(1), p95:+iv[Math.floor(iv.length*0.95)].toFixed(1), worst:+iv[iv.length - 1].toFixed(1),
      busy:+(A.busy/nF).toFixed(2), draw:+(A.draw/nF).toFixed(2), city:+(A.city/nF).toFixed(2), frames:iv.length, top:A.top.map(([k, v]) => k + ' ' + (v/nF).toFixed(1))}; }
  const pan = PHONE ? 4 : 6;
  await go(30); await quiet(); await measure('pan30', 5000, `window.__im.view.x -= ${pan}; window.__im.view.y -= ${pan/3};`);
  await go(240); await quiet(); await measure('pan240', 5000, `window.__im.view.x -= ${pan}; window.__im.view.y -= ${pan/3};`);
  await go(40); await quiet();
  await measure('zoom', 6000, `const v = window.__im.view, R = document.getElementById('map').getBoundingClientRect(), f = Math.floor(k/70) % 2 ? 1/1.02 : 1.02, sx = R.width/2, sy = R.height/2, ns = v.s*f, q = ns/v.s; v.x = sx - (sx - v.x)*q; v.y = sy - (sy - v.y)*q; v.s = ns;`);
  if (PHONE) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await go(150); await quiet();
  const one = await p.evaluate(() => { const im = window.__im, out = {}; for (const nm of ['Berlin', 'Kabul', 'Damascus']){ const P = im.G.P.find(q => q.cityName === nm), r = im.cityDbg.time(P.id, 1218); out[nm] = {info:+r.info.toFixed(1), day:+r.bake.toFixed(1), night:+r.night.toFixed(1), S:r.S}; } return out; });
  const heap = await p.evaluate(() => performance.memory ? +(performance.memory.usedJSHeapSize/1e6).toFixed(1) : null);
  const res = {when:new Date().toISOString(), page:PAGE, load:os.loadavg().map(x => +x.toFixed(2)), device:PHONE ? 'phone Pixel 7 412x915 dpr2.625 cpu x2' : 'desktop 1440x900 dpr2', heap, night:NIGHT, settle, cache, one, runs, errors:errs.slice(0, 5)};
  console.log(JSON.stringify(res));
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(res, null, 1));
  await b.close(); process.exit(errs.length ? 1 : 0); })();
