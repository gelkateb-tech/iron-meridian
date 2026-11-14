// repro: play the nations world like a player, sample the map for black every second
// node repro.js <page.html> [--phone] [--nation Germany] [--plan "1:20,3:60,0:20,4:120"] [--gl swiftshader|none] [--out dir] [--seed n]
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const path = require('path'), fs = require('fs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const PAGE = process.argv[2], PHONE = process.argv.includes('--phone'), WHO = arg('nation', 'Germany'), PLAN = arg('plan', '1:20,3:60,0:15,4:120,0:15,4:60'), GL = arg('gl', 'none'), OUT = arg('out', ''), SEED = +arg('seed', 12345), GPU = arg('gpumem', '');
(async () => {
  const args = ['--allow-file-access-from-files']; if (GL === 'swiftshader') args.push('--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'); if (GL === 'angle') args.push('--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist');
  if (GPU) args.push('--force-gpu-mem-available-mb=' + GPU, '--force-gpu-mem-discardable-limit-mb=' + GPU);
  const b = await chromium.launch({ args });
  const ctx = await b.newContext(PHONE ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(sd => { let a = sd >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0)/4294967296; };
    window.__EV = []; const P = HTMLCanvasElement.prototype, g0 = P.getContext;
    P.getContext = function(k, o){ if (!this.__h && /webgl/.test(k)){ this.__h = 1; this.addEventListener('webglcontextlost', e => window.__EV.push(['lost', performance.now(), this.id || this.className || 'gl', this.width + 'x' + this.height])); this.addEventListener('webglcontextrestored', () => window.__EV.push(['restored', performance.now(), this.id || 'gl'])); }
      if (!this.__h2 && k === '2d'){ this.__h2 = 1; this.addEventListener('contextlost', () => window.__EV.push(['2dlost', performance.now(), this.id || '2d', this.width + 'x' + this.height])); this.addEventListener('contextrestored', () => window.__EV.push(['2drestored', performance.now(), this.id || '2d'])); }
      return g0.call(this, k, o); };
    window.__CV = []; const ce = Document.prototype.createElement; Document.prototype.createElement = function(t, o){ const e = ce.call(this, t, o); if (String(t).toLowerCase() === 'canvas'){ window.__CV.push(new WeakRef(e)); if (window.__TAG){ const st = (new Error().stack || '').split('\n').slice(2, 4).map(l => (l.match(/at (\S+)/) || [])[1] || '?').join('<'); e.__tag = st; } } return e; };
    window.__cvTop = () => { const m = new Map(); for (const r of window.__CV){ const c = r.deref(); if (!c) continue; const k = (c.__tag || '?'); const v = m.get(k) || [0, 0]; v[0]++; v[1] += c.width*c.height; m.set(k, v); } return [...m].sort((a, b) => b[1][1] - a[1][1]).slice(0, 14).map(([k, v]) => [k, v[0], +(v[1]/1e6).toFixed(1)]); };
    window.__cvMem = () => { let px = 0, n = 0, big = 0, mx = 0, L = []; window.__CV = window.__CV.filter(r => { const c = r.deref(); if (!c) return false; const a = c.width*c.height; px += a; n++; if (a > mx) mx = a; if (a >= 4e6) big++; return true; }); for (const c of document.querySelectorAll('canvas')){ if (!window.__CV.some(r => r.deref() === c)){ px += c.width*c.height; n++; } } return {n, mp:+(px/1e6).toFixed(1), big, maxMP:+(mx/1e6).toFixed(1)}; };
    window.__LT = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__LT.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({type:'longtask', buffered:true}); } catch (e) {}   window.__TAG = true; }, SEED);
  const p = await ctx.newPage(), log = [];
  p.on('pageerror', e => log.push(['pageerror', e.message, (e.stack || '').split('\n').slice(0, 4).join(' | ')])); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') log.push(['console.' + m.type(), m.text().slice(0, 300)]); });
  let crashed = false; p.on('crash', () => { crashed = true; log.push(['CRASH', Date.now()]); if (OUT) fs.writeFileSync(path.join(OUT, 'crash.txt'), 'crash ' + Date.now()); }); p.on('close', () => { crashed = true; });
  await p.goto('file://' + path.resolve(PAGE)); await p.waitForTimeout(900);
  if (await p.locator('[data-act="pickscn"][data-k="world64"]').count()) await p.click('[data-act="pickscn"][data-k="world64"]');
  const pk = await p.evaluate(nm => { const L = SCENARIOS.world64.powers, i = L.findIndex(P => P.name === nm); return {i, region:i >= 0 ? L[i].region : null}; }, WHO);
  await p.click(`[data-act="pick"][data-p="${pk.i}"]`); await p.click('[data-act="begin"]'); await p.waitForTimeout(1500);
  await p.click('[data-act="start"]'); await p.waitForTimeout(3000);
  // sampler: the visible composition of map canvases, read in the page (map canvas getImageData), else null
  const sample = () => p.evaluate(() => { const cv = document.getElementById('map'); const o = {t:Math.round(performance.now()), hour:S.hour, q:S.q || 0, speed:S.speed, s:+window.__im.view.s.toFixed(4), vx:+window.__im.view.x.toFixed(1), vy:+window.__im.view.y.toFixed(1), cw:cv.width, ch:cv.height};
    try { const c = window.__sc || (window.__sc = document.createElement("canvas")); c.width = 96; c.height = 64; const g = c.getContext('2d', {willReadFrequently:true}); g.clearRect(0, 0, 96, 64); g.drawImage(cv, 0, 0, 96, 64);
      const d = g.getImageData(0, 0, 96, 64).data; let L = 0, blk = 0, n = 0; for (let i = 0; i < d.length; i += 4){ const l = (0.2126*d[i] + 0.7152*d[i + 1] + 0.0722*d[i + 2])*d[i + 3]/255; L += l; if (l < 10) blk++; n++; } o.lum = +(L/n).toFixed(1); o.black = +(blk/n).toFixed(3); } catch (e) { o.err = String(e).slice(0, 80); }
    try { const L = window.__im.layer; o.layer = L ? {full:L.full, strips:L.strips, w:L.width, h:L.height} : null; } catch (e) {}
    let px = 0, n = 0; for (const c of document.querySelectorAll('canvas')){ px += c.width*c.height; n++; } o.domCanvasMP = +(px/1e6).toFixed(1); o.nCanv = n;
    o.ev = window.__EV.length; if (window.__wantTop){ window.__wantTop = 0; o.top = window.__cvTop(); } o.mode = window.__im.mapMode; try { o.cv = window.__cvMem(); } catch (e) {} try { o.heap = Math.round(performance.memory.usedJSHeapSize/1e6); } catch (e) {} return o; }).catch(e => ({err:'eval ' + String(e).slice(0, 80)}));
  const samples = []; let shot = 0; const ACT = process.argv.includes('--act'); let ai = 0; const W = PHONE ? 390 : 1440, H = PHONE ? 844 : 900;
  const cdp = await ctx.newCDPSession(p); const GC_AT = (arg('gpucrash', '') || '').split('/').filter(Boolean).map(Number); const bcdp = await b.newBrowserCDPSession();
  async function act(){ if (crashed) return; ai++; if (ai % 3 === 0){ await p.evaluate(n => { const md = document.getElementById('modes'), q = s => document.querySelector(s), A = [['mode', 'political'], ['ovl', 'rel'], ['ovl', 'sup'], ['mode', 'terrain'], ['mode', 'political'], ['ovl', 'rel'], ['ovl', 'sup']][n % 7];
      const wasOpen = md.classList.contains('open'); const go = () => { const b = q(`#modes [data-act="${A[0]}"][data-k="${A[1]}"]`); if (b) b.click(); return b; }; if (!go()) throw new Error('no button ' + A); if (!wasOpen && matchMedia('(max-width: 700px), (max-height: 500px)').matches) go(); }, ai/3); }
    else { const x = W*(0.3 + 0.4*((ai*37 % 100)/100)), y = H*(0.3 + 0.4*((ai*61 % 100)/100)); await p.mouse.move(x, y); const zin = (ai >> 1) % 4 < 2; for (let k = 0; k < 4; k++){ await p.mouse.wheel(0, zin ? -240 : 240); await p.waitForTimeout(60); } } }
  try { for (const st of PLAN.split(',')){ if (crashed) break; const [sp, secs] = st.split(':').map(Number);
    await p.evaluate(sp => { S.speed = sp; }, sp);
    for (let i = 0; i < secs; i++){ if (GC_AT.includes(samples.length)){ log.push(['GPUCRASH at sample', samples.length]); await bcdp.send('Browser.crashGpuProcess').catch(e => log.push(['gpucrash err', e.message])); if (OUT) await p.waitForTimeout(400), await p.screenshot({path:path.join(OUT, 'crash' + samples.length + '.png')}).catch(() => {}); }
      if (ACT && sp) await act(); await p.waitForTimeout(1000); if (samples.length % 30 === 0) await p.evaluate(() => { window.__wantTop = 1; }); if (i % 10 === 0) await cdp.send('HeapProfiler.collectGarbage').catch(() => {}); const o = await sample(); o.plan = sp; o.wall = Date.now(); samples.push(o); if (OUT) fs.writeFileSync(path.join(OUT, 'samples.json'), JSON.stringify(samples)); if (crashed) break;
      if (GC_AT.some(t => samples.length === t + 3 || samples.length === t + 15) && OUT) await p.screenshot({path:path.join(OUT, 'after' + samples.length + '.png')}).catch(() => {});
      if (o.black > 0.6 || o.lum < 12){ log.push(['BLACK', JSON.stringify(o)]); if (OUT && shot < 4){ shot++; await p.screenshot({path:path.join(OUT, 'black' + shot + '.png')}); } } } }
  await cdp.send('HeapProfiler.collectGarbage').catch(() => {}); } catch (e) { log.push(['harness', String(e).slice(0, 200)]); }
  const ev = await p.evaluate(() => ({top:window.__cvTop(), mem:window.__cvMem(), ev:window.__EV, lt:window.__LT.length, ltMax:window.__LT.reduce((m, x) => Math.max(m, x[1]), 0), lts:window.__LT.slice(-8)})).catch(e => ({err:String(e)}));
  if (OUT && !crashed) await p.screenshot({path:path.join(OUT, 'end.png')}).catch(() => {});
  const lums = samples.filter(s => s.lum != null).map(s => s.lum);
  console.log(JSON.stringify({page:PAGE, phone:PHONE, gl:GL, nation:WHO, plan:PLAN, n:samples.length, lumMin:Math.min(...lums), lumMax:Math.max(...lums), blackN:samples.filter(s => s.black > 0.6 || s.lum < 12).length, first:samples[0], mid:samples[samples.length >> 1], last:samples[samples.length - 1], cvMax:Math.max(...samples.map(s => s.cv ? s.cv.mp : 0)), heapMax:Math.max(...samples.map(s => s.heap || 0)), ev, log:log.slice(0, 40), logN:log.length}, null, 1));
  if (OUT) fs.writeFileSync(path.join(OUT, 'samples.json'), JSON.stringify(samples));
  await b.close().catch(() => {}); })();
