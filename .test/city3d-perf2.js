// Cities in 3D, second pass (CITIES-2): the map's speed over Berlin at the zooms a player uses, for a before | after comparison on one machine.
// A nations-world game as Germany, the clock stopped, by day. For each hexPx (26, 40, 90, 150): the time until the map settles at that view and
// the city bakes made for it (count, total and worst ms, from the bake log), then a steady pan of 4 s (fps, p95 frame, main thread busy and the
// cities' share per frame, CDP sampling profiler); then a zoom sweep 26 -> 150 -> 26 three times, the city canvases' memory after each.
//   node .test/city3d-perf2.js [--phone] [--page page.html] [--json out.json]
//   (--phone: 440 x 900 at dpr 2, touch, the CPU throttled x4 from the first view on)
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs'), os = require('os'); const pickNation = require('./pick-nation.js');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d; };
const PHONE = process.argv.includes('--phone'), PAGE = arg('page', 'page.html'), JSON_OUT = arg('json', ''), ZS = (arg('zooms', '26,40,90,150')).split(',').map(Number);
const CITYF = ['drawCitiesLayer', 'drawCitiesIn', 'drawCityLights', 'cityPump', 'cityWarmPump', 'cityDraw', 'cityBake', 'cityChunk', 'cityLightsBake', 'cityLightsChunk'];
function aggregate(prof){ const byId = new Map(); prof.nodes.forEach(n => byId.set(n.id, n)); const parent = new Map(); prof.nodes.forEach(n => (n.children || []).forEach(c => parent.set(c, n.id)));
  const incl = new Map(); let busy = 0;
  for (let i = 0; i < prof.samples.length; i++){ const d = (prof.timeDeltas[i] || 0)/1000; let id = prof.samples[i]; if (byId.get(id).callFrame.functionName === '(idle)') continue; busy += d;
    const seen = new Set(); while (id != null){ const fn = byId.get(id).callFrame.functionName; if (!seen.has(fn)){ seen.add(fn); incl.set(fn, (incl.get(fn) || 0) + d); } id = parent.get(id); } }
  return {busy, city:Math.max(...CITYF.map(k => incl.get(k) || 0))}; }
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext(PHONE ? { viewport: { width: 440, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => { let a = 12345; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0)/4294967296; }; });
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const cdp = await ctx.newCDPSession(p), tap = sel => PHONE ? p.tap(sel) : p.click(sel);
  await p.goto('file://' + (path.isAbsolute(PAGE) ? PAGE : path.join(__dirname, PAGE))); await p.waitForTimeout(800);
  await tap('[data-act="pickscn"][data-k="world64"]'); await p.waitForTimeout(300); await pickNation(p, 'Germany');
  await p.evaluate(() => document.querySelector('[data-act="begin"]').scrollIntoView()); await tap('[data-act="begin"]'); await p.waitForTimeout(1300);
  if (await p.locator('[data-act="start"]').count()) await tap('[data-act="start"]'); await p.waitForTimeout(3000);
  await p.evaluate(() => { const im = window.__im, S = im.S; S.speed = 0; im.SET.tipsOff = true; im.SET.cityLights = true; im.SET.saver = false; document.querySelectorAll('.toast,.modal').forEach(t => t.remove());
    const P = im.G.P.find(q => q.cityName === 'Berlin'), h0 = Math.floor(S.hour/24)*24; let bh = h0, be = -9; for (let h = h0; h < h0 + 24; h++){ S.hour = h; const e = im.sunSinEl(P.id); if (e > be){ be = e; bh = h; } } S.hour = bh; });
  const go = hx => p.evaluate(hx => { const im = window.__im, v = im.view, P = im.G.P.find(q => q.cityName === 'Berlin'), s = hx/12, R = document.getElementById('map').getBoundingClientRect(); v.s = s; v.x = R.width/2 - P.x*s; v.y = R.height/2 - P.y*s; im.redraw(); }, hx);
  async function quiet(max = 90000){ const t0 = Date.now(); let ok = 0; while (Date.now() - t0 < max && ok < 4){ await p.waitForTimeout(200); ok = await p.evaluate(() => { window.__im.redraw(); return !window.__im.mapBusy(); }) ? ok + 1 : 0; } return Date.now() - t0; }
  const cbt = () => p.evaluate(() => { const st = window.__im.cityDbg.stats(); let n = 0, ms = 0, w = 0; for (const [k, v] of Object.entries(st)){ if (k === 'slice') continue; n += v[0]; ms += v[1]; w = Math.max(w, v[2]); } return {n, ms, w}; });
  await go(12); await quiet(30000);
  if (PHONE) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 250 });
  async function measure(ms, step){
    await p.evaluate(s => { window.__M = {step:new Function('k', s), t:[]}; }, step); await cdp.send('Profiler.start');
    const fr = await p.evaluate(ms => new Promise(res => { const M = window.__M, t0 = performance.now(); let k = 0; const f = t => { M.t.push(t); M.step(k++); if (t - t0 < ms) requestAnimationFrame(f); else res(M.t); }; requestAnimationFrame(f); }), ms);
    const { profile } = await cdp.send('Profiler.stop'); const iv = []; for (let i = 1; i < fr.length; i++) iv.push(fr[i] - fr[i - 1]); iv.sort((x, y) => x - y);
    const A = aggregate(profile), nF = Math.max(1, iv.length);
    return {fps:+(iv.length*1000/(fr[fr.length - 1] - fr[0])).toFixed(1), p95:+iv[Math.floor(iv.length*0.95)].toFixed(1), worst:+iv[iv.length - 1].toFixed(1), busy:+(A.busy/nF).toFixed(2), city:+(A.city/nF).toFixed(2)}; }
  const views = {}, pan = PHONE ? 4 : 6;
  for (const hx of ZS){ const c0 = await cbt(); await go(hx); const settle = await quiet(); const c1 = await cbt();
    const r = await measure(4000, `window.__im.view.x -= ${pan}; window.__im.view.y -= ${pan/3};`);
    views[hx] = {settle, bakes:c1.n - c0.n, bakeMs:+(c1.ms - c0.ms).toFixed(0), worstBake:+c1.w.toFixed(1), pan:r}; }
  const mem = []; for (let k = 0; k < 3; k++) for (const hx of [26, 40, 60, 90, 150, 90, 60, 40]){ await go(hx); await quiet(20000); mem.push(await p.evaluate(() => window.__im.cityDbg.mem().total)); }
  if (PHONE) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const res = {when:new Date().toISOString(), page:PAGE, load:os.loadavg().map(x => +x.toFixed(1)), device:PHONE ? 'phone 440x900 dpr2 cpu x4' : 'desktop 1440x900 dpr2', views, mem, errors:errs.slice(0, 5)};
  console.log(JSON.stringify(res)); if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(res, null, 1));
  await b.close(); process.exit(errs.length ? 1 : 0); })();
