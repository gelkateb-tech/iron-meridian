// Browser performance of the nations world (68 nations, ~4,000 units): fps idle, while panning and with the clock running at 1x/4x/8x, main-thread
// time per frame split into draw phases (CDP sampling profiler), rules time per game hour and per game day in the page, and long tasks (> 50 ms).
//   node .test/perf-ui.js                 desktop 1440x900
//   node .test/perf-ui.js --phone         phone 390x844 (touch, dpr 3) with the CPU throttled x4 (CDP) during the measurements
//   node .test/perf-ui.js --days 10       days played before measuring (default 10: ~4,000 units)   --page page.html   --json out.json   --seed 12345 (Math.random)
// Needs bash tools/mkpage.sh first (the test page .test/page.html). Prints one JSON object and a short table; the machine's load average goes with it.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs'), os = require('os');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d; };
const PHONE = process.argv.includes('--phone'), DAYS = +arg('days', 10), SEED = +arg('seed', 12345), PAGE = arg('page', 'page.html'), JSON_OUT = arg('json', ''), WHO = arg('nation', 'Germany');
// draw phases: inclusive time of these page functions (a function inside another listed one counts in both: the phases are views, not a partition)
const PHASES = {
  'draw (all)': ['draw'], 'map layer': ['renderLayer', 'shiftLayer', 'layerBands', 'layerCityRefresh', 'renderPart'], 'detail tiles': ['dtWork', 'dtDraw'],
  'fog': ['fogHole', 'fogPattern', 'visibleSet', 'armyVisible', 'armyLocated'], 'cities/buildings': ['drawCitiesLayer', 'drawCitiesIn', 'drawCityLights', 'cityPump', 'cityWarmPump', 'cityDraw', 'cityBake', 'cityChunk'],
  'counters/pictures': ['drawBuildings', 'counter', 'tmUnits', 'tmDraw', 'tmArtDraw', 'airPic'], 'effects fx': ['drawFX', '@fx.js', 'fxDrain', 'drawBattleSmoke'],
  'labels': ['labNight', 'lakeLabels', 'nameOverSea', 'tagDraw'], 'sea/night/weather': ['drawSeaSurface', 'drawNight', 'drawNightWorld', 'drawWeather', 'drawLightning'],
  'trade/links': ['drawTrade', 'drawTradeLanes', 'drawConvoys', 'drawLinkFx', 'drawChokes', 'drawBlockZones'], 'side panel/UI': ['renderSide', 'ambience', 'abTickPatch', 'drawMini'],
  'rules (tickQ)': ['tickQ', 'tickQSlice'], 'GC': ['(garbage collector)'] };
function aggregate(prof){ const byId = new Map(); prof.nodes.forEach(n => byId.set(n.id, n)); const parent = new Map(); prof.nodes.forEach(n => (n.children || []).forEach(c => parent.set(c, n.id)));
  const incl = new Map(); let busy = 0, total = 0;
  for (let i = 0; i < prof.samples.length; i++){ const d = (prof.timeDeltas[i] || 0)/1000; total += d; let id = prof.samples[i]; const leaf = byId.get(id).callFrame.functionName; if (leaf === '(idle)') continue; busy += d;
    const seen = new Set(); while (id != null){ const cf = byId.get(id).callFrame; for (const k of [cf.functionName, '@' + (cf.url || '').split('/').pop()]) if (!seen.has(k)){ seen.add(k); incl.set(k, (incl.get(k) || 0) + d); } id = parent.get(id); } }
  const out = {busy, total}; for (const [ph, names] of Object.entries(PHASES)){ let t = 0; for (const k of names) t = Math.max(t, incl.get(k) || 0); out[ph] = t; }   // (max: the listed names nest; the outermost one is the phase)
  return out; }
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(PHONE ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  // the same game every run: Math.random seeded before the page loads (the page draws its new game's seed from it; effects use it too)
  await ctx.addInitScript(sd => { let a = sd >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0)/4294967296; }; }, SEED);
  const cdp = await ctx.newCDPSession(p);
  await p.goto('file://' + (path.isAbsolute(PAGE) ? PAGE : path.join(__dirname, PAGE))); await p.waitForTimeout(800);
  if (await p.locator('[data-act="pickscn"][data-k="world64"]').count()) await p.click('[data-act="pickscn"][data-k="world64"]');
  const pk = await p.evaluate(nm => { const L = SCENARIOS.world64.powers, i = L.findIndex(P => P.name === nm); return {i, region:i >= 0 ? L[i].region : null}; }, WHO);
  await p.click(`[data-act="pickreg"][data-k="${pk.region}"]`); await p.click(`[data-act="pick"][data-p="${pk.i}"]`); await p.click('[data-act="begin"]'); await p.waitForTimeout(1500);
  await p.click('[data-act="start"]'); await p.waitForTimeout(2500);
  // rules time in the page: every tickQ timed (the game loop and __im.tick both call the global tickQ, so wrapping it changes nothing but adds a clock)
  // (the page's game loop calls tickQSlice where it exists: an hour may run over several frames; T.s holds each frame's share, T.h whole hours)
  await p.evaluate(() => { const T = window.__PT = {q:[], h:[], s:[]}, q0 = window.tickQ; window.tickQ = function(){ const t0 = performance.now(), hr = (S.q || 0) + 1 >= BATTLE_Q; try { return q0.apply(this, arguments); } finally { const d = performance.now() - t0; (hr ? T.h : T.q).push(d); } };
    if (typeof window.tickQSlice === 'function'){ const s0 = window.tickQSlice; let hacc = 0; window.tickQSlice = function(){ const t0 = performance.now(), hr = tickPending() || (S.q || 0) + 1 >= BATTLE_Q; let done; try { return done = s0.apply(this, arguments); } finally { const d = performance.now() - t0; T.s.push(d); if (hr){ hacc += d; if (done){ T.h.push(hacc); hacc = 0; } } else T.q.push(d); } }; }
    window.__LT = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__LT.push([e.startTime, e.duration]); }).observe({type:'longtask', buffered:true}); } catch (e) {} });
  // play DAYS days (the AI moves everyone; the seat's nation gives no orders), a day per call: the per-day time is the browser's rules time per game day
  const dayMs = [];
  for (let d = 0; d < DAYS; d++){ dayMs.push(await p.evaluate(() => { const t0 = performance.now(); for (let i = 0; i < 24 && !S.over; i++) window.__im.tick(); return performance.now() - t0; })); }
  const world = await p.evaluate(() => { let u = 0; for (const a of S.armies) for (const k in a.u) u += a.u[k] || 0; return {nations:S.nations.length, alive:S.nations.filter(N => N.alive).length, units:Math.round(u), forces:S.armies.length, day:S.hour/24, scn:S.scn}; });
  await p.evaluate(() => { window.__PT.q.length = 0; window.__PT.h.length = 0; S.speed = 0; });
  // the map settles first (city bakes, detail tiles, layer bands): quiet = no layer render or band for 3 s (at most 90 s)
  async function quiet(max = 90000){ const t0 = Date.now(); let last = null, still = 0;
    while (Date.now() - t0 < max){ const c = await p.evaluate(() => (window.__im.layer.full || 0) + (window.__im.layer.strips || 0)); if (c === last){ if (++still >= 6) break; } else still = 0; last = c; await p.waitForTimeout(500); }
    return Date.now() - t0; }
  const settle = await quiet();
  if (PHONE) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 250 });
  const runs = {};
  // one measured window: rAF intervals in the page, the CDP profile around it, long tasks inside it
  async function measure(name, ms, setup){
    await p.evaluate(s => { const L = window.__im.layer || {}; window.__M = {lf:L.full || 0, ls:L.strips || 0, t:[], lt0:window.__LT.length, q0:window.__PT.q.length, h0:window.__PT.h.length, s0:window.__PT.s.length}; (new Function(s))(); }, setup || '');
    await cdp.send('Profiler.start');
    const fr = await p.evaluate(ms => new Promise(res => { const M = window.__M, t0 = performance.now(); M.rf = []; let lf = window.__im.layer.full, lt = t0; const f = t => { M.t.push(t); const L = window.__im.layer.full; if (L !== lf){ M.rf.push(t - lt); lf = L; } lt = t; if (M.pan) M.pan(); if (t - t0 < ms) requestAnimationFrame(f); else res(M.t); }; requestAnimationFrame(f); }), ms);
    const { profile } = await cdp.send('Profiler.stop');
    const extra = await p.evaluate(() => { const M = window.__M; const lt = window.__LT.slice(M.lt0).map(e => Math.round(e[1])); const hq = window.__PT.h.slice(M.h0), qq = window.__PT.q.slice(M.q0), sq = window.__PT.s.slice(M.s0); S.speed = 0; window.__M.pan = null; const L = window.__im.layer || {}; return {lt, hq, qq, sq, rf:M.rf, lf:(L.full || 0) - M.lf, ls:(L.strips || 0) - M.ls}; });
    const iv = []; for (let i = 1; i < fr.length; i++) iv.push(fr[i] - fr[i - 1]); iv.sort((x, y) => x - y);
    const A = aggregate(profile), nF = Math.max(1, iv.length), per = {}; for (const k of Object.keys(PHASES)) per[k] = +(A[k]/nF).toFixed(2);
    runs[name] = {fps:+(iv.length*1000/(fr[fr.length - 1] - fr[0])).toFixed(1), p50:+iv[iv.length >> 1].toFixed(1), p95:+iv[Math.floor(iv.length*0.95)].toFixed(1), worst:+iv[iv.length - 1].toFixed(1), slow:iv.filter(x => x > 20).length, frames:iv.length,
      busyPerFrame:+(A.busy/nF).toFixed(2), phasesPerFrame:per, layerRenders:extra.lf, layerStrips:extra.ls, longTasks:extra.lt.length, longMax:extra.lt.length ? Math.max(...extra.lt) : 0,
      hourTicks:extra.hq.length, hourMs:extra.hq.length ? +(extra.hq.reduce((s, x) => s + x, 0)/extra.hq.length).toFixed(1) : null, hourMax:extra.hq.length ? +Math.max(...extra.hq).toFixed(1) : null, qMs:extra.qq.length ? +(extra.qq.reduce((s, x) => s + x, 0)/extra.qq.length).toFixed(1) : null, renderFrameMax:extra.rf.length ? +Math.max(...extra.rf).toFixed(1) : 0, rulesFrameMax:extra.sq.length ? +Math.max(...extra.sq).toFixed(1) : (extra.hq.length ? +Math.max(...extra.hq).toFixed(1) : 0)}; }
  const pan = PHONE ? 4 : 6;
  const settles = {};
  await measure('idle', 4000);
  await measure('pan', 4000, `window.__M.pan = () => { window.__im.view.x -= ${pan}; };`);
  settles.pan = await quiet();
  await measure('run 1x', 8000, 'S.speed = 1;'); settles['1x'] = await quiet();
  await measure('run 4x', 8000, 'S.speed = 3;'); settles['4x'] = await quiet();
  await measure('run 8x', 8000, 'S.speed = 4;'); settles['8x'] = await quiet();
  await measure('pan 8x', 6000, `S.speed = 4; window.__M.pan = () => { window.__im.view.x += ${pan}; };`); settles.pan8x = await quiet();
  // per game hour in the page (the clock stopped, 48 hourly ticks back to back): average and worst hour, the daily hour included
  const hours = await p.evaluate(() => { const L = []; for (let i = 0; i < 48 && !S.over; i++){ const t0 = performance.now(); window.__im.tick(); L.push(performance.now() - t0); } return L; });
  if (PHONE) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const res = {when:new Date().toISOString(), load:os.loadavg().map(x => +x.toFixed(2)), device:PHONE ? 'phone 390x844 dpr3 cpu x4' : 'desktop 1440x900', world, dayMs:dayMs.map(Math.round),
    msPerDay:Math.round(dayMs.slice(1).reduce((s, x) => s + x, 0)/Math.max(1, dayMs.length - 1)), hour:{avg:+(hours.reduce((s, x) => s + x, 0)/hours.length).toFixed(1), max:+Math.max(...hours).toFixed(1), over50:hours.filter(x => x > 50).length},
    settle, settles, runs, errors:errs.slice(0, 5)};
  console.log(JSON.stringify(res));
  console.log(`\n${res.device}  load ${res.load.join(' ')}  ${world.nations} nations, ${world.units} units in ${world.forces} forces, day ${world.day}`);
  console.log(`map settling after the days were played: ${(settle/1000).toFixed(1)} s (city bakes, tiles, layer bands); after pan / 1x / 4x / 8x / pan 8x: ${Object.values(settles).map(x => (x/1000).toFixed(1)).join(' / ')} s`);
  console.log(`rules in the page: ${res.msPerDay} ms per game day (days 2..${DAYS}), per hour avg ${res.hour.avg} ms, worst ${res.hour.max} ms, ${res.hour.over50} of 48 hours over 50 ms`);
  console.log('window   fps   p50  p95  worst slow>20ms busy/frame  longtasks(max)  hours: rules ms per hour avg/max, most in one frame  layer renders/strips');
  for (const [k, r] of Object.entries(runs)) console.log(`${k.padEnd(8)} ${String(r.fps).padStart(5)} ${String(r.p50).padStart(5)} ${String(r.p95).padStart(5)} ${String(r.worst).padStart(6)} ${String(r.slow).padStart(5)} ${String(r.busyPerFrame).padStart(9)}   ${String(r.longTasks).padStart(4)} (${r.longMax})   ${r.hourTicks}: ${r.hourMs ?? '-'}/${r.hourMax ?? '-'}, ${r.rulesFrameMax}   ${r.layerRenders}/${r.layerStrips} (frame with a full render: ${r.renderFrameMax} ms)`);
  console.log('per frame ms: ' + Object.keys(PHASES).join(' | ')); for (const [k, r] of Object.entries(runs)) console.log(`${k.padEnd(8)} ` + Object.values(r.phasesPerFrame).join(' | '));
  if (errs.length) console.log('ERRORS', errs.slice(0, 5));
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(res, null, 1));
  await b.close(); process.exit(errs.length ? 1 : 0); })();
