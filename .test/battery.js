// Battery saver measurements: node .test/battery.js [quick]
// For desktop (1400x860) and phone emulation (390x844, dpr 3, touch), with the Battery saver setting OFF and ON, prints:
//  (a) map draws per second over 10 s fully idle (paused, nothing selected, static camera)
//  (b) draws per second while the game runs at 1x on a view with nothing moving
//  (c) draws per second during a pan (25 px per animation frame, 3 s)
//  (d) main-thread busy time per second (CDP Performance metrics: TaskDuration) for the same cases
//  (e) image requests and bytes from page load to 8 s after the game starts (served over http, like the published page)
//  (f) stuck-work checks (repair 1): wheel 6 notches in, 0.7 s, 10 notches out (detail tiles come back after the view left the detail zoom),
//      pause, no input: draws per second must fall to ~0; the pointer leaving the map straight out of the window must clear the hover (a frame)
// A draw is one call of the map's draw(); on a page without the redraw scheduler (older builds) every animation frame draws, so frames are counted.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const PAGE = process.env.PAGE || 'page.html', DIR = __dirname, quick = process.argv[2] === 'quick', IDLE_S = quick ? 5 : 10, RUN_S = quick ? 6 : 10;
const VPS = { desktop: { viewport: { width: 1400, height: 860 } }, phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } };
const errs = [];
async function page(b, vp, saver){
  const ctx = await b.newContext(vp); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.addInitScript(sv => { try { if (sv != null) localStorage.setItem('iron-meridian-settings', JSON.stringify({saver: sv})); } catch (e) {}
    window.__rafN = 0; const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = f => raf(t => { if (f.name === 'frame') window.__rafN++; f(t); }); }, saver);
  await p.goto('file://' + DIR + '/' + PAGE); await p.waitForTimeout(900);
  await p.click('[data-act="pick"][data-p="5"]'); await p.click('[data-act="begin"]'); await p.waitForTimeout(300); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && !window.__im.camFly, null, { timeout: 20000 }); await p.waitForTimeout(2500);
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const m = document.getElementById('modal'); if (m && !m.hidden && !m.classList.contains('docked')) document.querySelector('[data-act="resume"]')?.click(); });
  const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable');
  return { ctx, p, cdp };
}
const draws = p => p.evaluate(() => window.__im.rd ? window.__im.rd.n : window.__rafN);
const busy = async cdp => { const m = (await cdp.send('Performance.getMetrics')).metrics; return (m.find(x => x.name === 'TaskDuration') || {}).value || 0; };
async function window_(P, ms, during){ const d0 = await draws(P.p), b0 = await busy(P.cdp), t0 = Date.now();
  if (during) await during(); else await P.p.waitForTimeout(ms);
  const dt = (Date.now() - t0)/1000, d1 = await draws(P.p), b1 = await busy(P.cdp);
  return { drawsPerS: +((d1 - d0)/dt).toFixed(2), busyMsPerS: Math.round((b1 - b0)/dt*1000), s: +dt.toFixed(1) }; }
async function measure(b, name, saver){
  const P = await page(b, VPS[name], saver), p = P.p, out = { saver: await p.evaluate(() => window.__im.SET.saver) };
  // (a) idle: paused, nothing selected, mouse off the map
  await p.evaluate(() => { const im = window.__im; im.S.speed = 0; im.v3c.clearSel(); }); await p.mouse.move(0, 0).catch(() => {}); await p.waitForTimeout(2000);
  await p.evaluate(() => new Promise(r => { const im = window.__im; if (!im.ambIdle) return r(); const f = () => performance.now() - im.rd.inp > im.ambIdle() + 300 ? r() : setTimeout(f, 200); f(); }));   // (paused: the ambient motion rests after a while without input)
  out.idle = await window_(P, IDLE_S*1000);
  // (b) running at 1x on a quiet view: land provinces far from any force, at a mid zoom; a view where something still moves (a convoy sailing
  // by, a storm) is skipped: the first of the farthest 8 where fewer than 30 draws come in 1.5 s at 1x
  const cands = await p.evaluate(() => { const im = window.__im, G = im.G, S = im.S, out = [];
    for (const P of G.P){ if (P.sea) continue; let d = Infinity; for (const a of S.armies){ const A = G.P[a.at]; d = Math.min(d, (A.x - P.x)**2 + (A.y - P.y)**2); } out.push([P.id, d]); }
    out.sort((a, b) => b[1] - a[1]); const pick = []; for (const [id, d] of out){ const P = G.P[id]; if (pick.every(([j]) => Math.hypot(G.P[j].x - P.x, G.P[j].y - P.y) > 150)) pick.push([id, d]); if (pick.length >= 8) break; } return pick; });
  const goQ = id => p.evaluate(id => { const im = window.__im, P = im.G.P[id], s = 1.2, v = im.view; v.s = s; v.x = innerWidth/2 - P.x*s; v.y = innerHeight/2 - P.y*s; im.S.speed = 1; return P.name; }, id);
  let q = null;
  for (const [id, d] of cands){ const name = await goQ(id); await p.waitForTimeout(2500); const d0 = await draws(p); await p.waitForTimeout(1500); const n = await draws(p) - d0;
    if (!q || n < q.n) q = { id, prov: name, km: Math.round(Math.sqrt(d)), n }; if (n < 30) break; }
  await goQ(q.id); await p.waitForTimeout(2500); out.run1x = { ...(await window_(P, RUN_S*1000)), view: q.prov };
  await p.evaluate(() => { window.__im.S.speed = 0; });
  // (c) pan: 25 px per animation frame for 3 s over Berlin at a mid zoom
  await p.evaluate(() => { const im = window.__im, P = im.G.P.find(q => q.cityName === 'Berlin'), s = 3; im.view.s = s; im.view.x = innerWidth/2 - P.x*s; im.view.y = innerHeight/2 - P.y*s; }); await p.waitForTimeout(1500);
  out.pan = await window_(P, 0, () => p.evaluate(() => new Promise(res => { const im = window.__im, t0 = performance.now(); let n = 0; const f = () => { im.view.x -= 25; n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(n); }; requestAnimationFrame(f); })));
  await P.ctx.close(); return out;
}
// background: hidden (visibilitychange), and on a phone a lost focus (blur): no frames, no game time, sound suspended; back: as before
async function background(b, name){ const P = await page(b, VPS[name], null), p = P.p, out = {};
  const st = () => p.evaluate(() => ({ hour: +(window.__im.S.hour).toFixed(0), speed: window.__im.S.speed, draws: window.__im.rd.n, bg: window.__im.rd.bg }));
  const hide = h => p.evaluate(h => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => h }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => h ? 'hidden' : 'visible' }); document.dispatchEvent(new Event('visibilitychange')); }, h);
  for (const sp of [4, 0]){ await p.evaluate(sp => { window.__im.S.speed = sp; }, sp); await p.waitForTimeout(1500);
    const a = await st(); await hide(true); await p.waitForTimeout(4000); const h = await st(); await hide(false); await p.waitForTimeout(300); const c = await st(); await p.waitForTimeout(4000); const d = await st();
    const ok = h.bg && h.hour === a.hour && h.draws - a.draws <= 1 && !c.bg && c.speed === sp && c.hour - h.hour <= 1 && (sp ? d.hour > c.hour : d.hour === c.hour);
    out['speed' + sp] = { ok, before: a, hidden4s: h, back: c, back4s: d }; if (!ok) errs.push(name + ' background at speed ' + sp + ': ' + JSON.stringify(out['speed' + sp])); }
  if (name === 'phone'){ await p.evaluate(() => { window.__im.S.speed = 4; }); await p.waitForTimeout(500); const a = await st();
    await p.evaluate(() => window.dispatchEvent(new Event('blur'))); await p.waitForTimeout(3000); const h = await st(); await p.evaluate(() => window.dispatchEvent(new Event('focus'))); await p.waitForTimeout(2500); const c = await st();
    const ok = h.bg && h.hour === a.hour && !c.bg && c.speed === 4 && c.hour > h.hour; out.blur = { ok, before: a, blurred3s: h, focus: c }; if (!ok) errs.push('phone blur: ' + JSON.stringify(out.blur)); }
  await P.ctx.close(); return out; }
// (f) stuck work: tiles that come back after a zoom out must not keep the map redrawing; a pointer leaving the window clears the hover
async function stuck(b, name, saver){ const P = await page(b, VPS[name], saver), p = P.p, out = {};
  const [W, H] = name === 'phone' ? [390, 844] : [1400, 860];
  await p.mouse.move(W/2, H/2); for (let i = 0; i < 6; i++){ await p.mouse.wheel(0, -120); await p.waitForTimeout(60); }
  await p.waitForTimeout(700); for (let i = 0; i < 10; i++){ await p.mouse.wheel(0, 120); await p.waitForTimeout(60); }
  await p.evaluate(() => { window.__im.S.speed = 0; window.__im.v3c.clearSel(); });
  await p.evaluate(() => new Promise(r => { const im = window.__im; const f = () => performance.now() - im.rd.inp > im.ambIdle() + 1500 ? r() : setTimeout(f, 200); f(); }));
  out.zoomOutIdle = { ...(await window_(P, IDLE_S*1000)), dtReady: await p.evaluate(() => window.__im.dt.ready.length) };
  if (out.zoomOutIdle.drawsPerS > 1) errs.push(name + ' saver ' + saver + ': the map keeps redrawing after a zoom out: ' + JSON.stringify(out.zoomOutIdle));
  if (name === 'desktop'){   // hover a land province, then leave the window straight from it: one frame clears the outline
    const pt = await p.evaluate(() => { const im = window.__im, v = im.view, P = im.G.P.find(q => q.cityName === 'Berlin'), s = 2.5; v.s = s; v.x = innerWidth/2 - P.x*s; v.y = innerHeight/2 - P.y*s; im.redraw(); return [innerWidth/2 + 30, innerHeight/2 + 20]; });
    await p.waitForTimeout(500); await p.mouse.move(pt[0], pt[1]); await p.mouse.move(pt[0] + 2, pt[1] + 1); await p.waitForTimeout(400);
    await p.evaluate(() => new Promise(r => { const im = window.__im; const f = () => performance.now() - im.rd.inp > im.ambIdle() + 500 ? r() : setTimeout(f, 200); f(); }));
    const d0 = await draws(p); await p.mouse.move(-30, pt[1], { steps: 1 }); await p.waitForTimeout(400); const d1 = await draws(p);
    out.leave = { draws: d1 - d0, hoverGone: await p.evaluate(() => !document.querySelector('#tip:not([hidden])')) }; if (d1 - d0 < 1) errs.push('desktop saver ' + saver + ': no frame after the pointer left the window (stale hover)'); }
  await P.ctx.close(); return out; }
// (e) startup requests over http
function serve(){ return new Promise(r => { const srv = http.createServer((q, s) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(DIR, u === '/' ? 'page.html' : u);
    if (!f.startsWith(DIR) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ s.writeHead(404); s.end(); return; }
    const ext = path.extname(f).slice(1), ct = { html: 'text/html', js: 'application/javascript', webp: 'image/webp', png: 'image/png', json: 'application/json', jpg: 'image/jpeg' }[ext] || 'application/octet-stream';
    const buf = fs.readFileSync(f); s.writeHead(200, { 'content-type': ct, 'content-length': buf.length }); s.end(buf); }); srv.listen(0, '127.0.0.1', () => r(srv)); }); }
async function startup(b, name){ const srv = await serve(), port = srv.address().port, ctx = await b.newContext(VPS[name]), p = await ctx.newPage(), log = [];
  p.on('requestfinished', async rq => { if (rq.resourceType() !== 'image' && !/\.(webp|png|jpg)$/.test(rq.url())) return; let n = 0; try { const r = await rq.response(); n = +(r.headers()['content-length'] || 0); } catch (e) {} log.push({ u: rq.url().replace(/^.*\/\/[^/]+\//, ''), n, t: Date.now() }); });
  const t0 = Date.now(); await p.goto(`http://127.0.0.1:${port}/${PAGE}`); await p.waitForTimeout(3000); const menuN = log.length, menuB = log.reduce((s, x) => s + x.n, 0);
  await p.click('[data-act="pick"][data-p="5"]'); await p.click('[data-act="begin"]'); await p.waitForTimeout(300); await p.click('[data-act="start"]'); await p.waitForTimeout(8000);
  const bld = log.filter(x => /\/b-/.test(x.u));
  const r = { menu: { images: menuN, kB: Math.round(menuB/1024) }, afterStart8s: { images: log.length, kB: Math.round(log.reduce((s, x) => s + x.n, 0)/1024) }, buildingArt: { images: bld.length, kB: Math.round(bld.reduce((s, x) => s + x.n, 0)/1024), files: bld.map(x => x.u.replace('assets/art/', '').replace('.webp', '')).join(' ') } };
  await ctx.close(); srv.close(); return r; }
(async () => {
  const b = await chromium.launch(), res = {};
  const hasSaver = fs.readFileSync(DIR + '/' + PAGE, 'utf8').includes('saver:');
  const only = process.env.ONLY;   // ONLY=stuck: just section (f)
  if (!only) for (const name of ['desktop', 'phone']){ res[name] = {};
    for (const sv of hasSaver ? [false, true] : [null]) res[name][sv == null ? 'before' : sv ? 'saverOn' : 'saverOff'] = await measure(b, name, sv); }
  if (hasSaver) res.stuck = { desktopSaverOff: await stuck(b, 'desktop', false), desktopSaverOn: await stuck(b, 'desktop', true), phoneSaverOn: await stuck(b, 'phone', true) };
  if (hasSaver && !only) res.background = { desktop: await background(b, 'desktop'), phone: await background(b, 'phone') };
  if (!only) res.startup = { desktop: await startup(b, 'desktop'), phone: await startup(b, 'phone') };
  await b.close();
  console.log(JSON.stringify(res, null, 1).replace(/\n\s+(?=[^\s{\[])/g, " ").replace(/\n\s+}/g, " }"));
  console.log('ERRORS', errs.length ? errs : 'none');
  process.exit(errs.length ? 1 : 0);
})();
