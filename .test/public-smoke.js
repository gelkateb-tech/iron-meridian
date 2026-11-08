// Public build smoke test: node .test/public-smoke.js   (run node tools/build.js first)
// Serves dist/public over http (python3 -m http.server on a free port), loads it on a desktop and a phone viewport, starts a game,
// runs about a game day at 8x through the real speed control, and checks: no window.__im test hooks, no DEV badge / panel /
// developer speeds, no developer markup in the page, no console errors. Exits 1 on any failure. Screenshots: .test/public-*.png
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), net = require('net'), { spawn } = require('child_process');
const ROOT = path.join(__dirname, '..'), DIR = path.join(ROOT, 'dist', 'public'), OUT = __dirname;
const THREE_LOCAL = '/tmp/claude-0/-home-user/7fd07611-91e4-5b00-ba43-06c622a65904/scratchpad/build/node_modules/three/build/three.min.js';
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const up = port => new Promise(r => { const t0 = Date.now(); const go = () => { const c = net.connect(port, '127.0.0.1', () => { c.end(); r(true); }); c.on('error', () => Date.now() - t0 > 10000 ? r(false) : setTimeout(go, 150)); }; go(); });
(async () => {
  if (!fs.existsSync(path.join(DIR, 'play.html'))){ console.log('missing dist/public: run node tools/build.js'); process.exit(1); }
  const port = await freePort(), srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', DIR], { stdio: 'ignore' });
  const stop = () => { try { srv.kill(); } catch (e) {} };
  if (!(await up(port))){ console.log('http server did not start'); stop(); process.exit(1); }
  const b = await chromium.launch(), errs = [], checks = {}, ok = (k, v, info) => { checks[k] = v ? 'PASS' : 'FAIL' + (info !== undefined ? ' ' + JSON.stringify(info) : ''); };
  const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
  ok('page source: no developer or test markup', !/@DEV|@TEST|devbadge|devpanel|__im\b|DEVUI|devSpawn/.test(html));
  const res = {};
  for (const [name, vp] of [['desktop', { width: 1400, height: 860 }], ['phone', { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]){
    const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor || 1 });
    if (fs.existsSync(THREE_LOCAL)) await ctx.route('**/three.min.js', r => r.fulfill({ path: THREE_LOCAL, contentType: 'application/javascript' }));   // offline: local three.js
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ' pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR_/.test(m.text())) errs.push(name + ' console: ' + m.text()); });
    await p.goto(`http://127.0.0.1:${port}/play.html`); await p.waitForTimeout(1200);
    if (await p.locator('[data-act="pick"]').count()){ await p.click('[data-act="pick"][data-p="0"]'); await p.click('[data-act="begin"]'); }
    await p.click('[data-act="start"]'); await p.waitForTimeout(400);
    const dom = await p.evaluate(() => ({ im: typeof window.__im, badge: !!document.getElementById('devbadge'), panel: !!document.getElementById('devpanel'), devsp: document.querySelectorAll('[data-speed="5"],[data-speed="6"],[data-speed="7"],.devsp').length,
      speeds: [...document.querySelectorAll('#speed [data-speed]')].map(b => b.dataset.speed).join(','), devText: /\bDEV\b|Developer mode/.test(document.body.innerText) }));
    ok(name + ': no window.__im', dom.im === 'undefined', dom.im);
    ok(name + ': no DEV badge or panel', !dom.badge && !dom.panel && !dom.devText, dom);
    ok(name + ': speed control is 0-4 only', dom.speeds === '0,1,2,3,4' && !dom.devsp, dom.speeds);
    const spd = () => p.evaluate(() => [...document.querySelectorAll('#speed [data-speed]')].filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.speed).join(','));
    const sp0 = await spd(); await p.keyboard.press('`'); await p.keyboard.press('9'); await p.waitForTimeout(300); const sp1 = await spd();
    ok(name + ': developer keys do nothing', sp0 === sp1 && await p.evaluate(() => !document.getElementById('devpanel')), [sp0, sp1]);
    const day = () => p.evaluate(() => { const t = (document.querySelector('#hday b') || document.getElementById('hday')).textContent.replace(/\D+/g, ''); return +t || 0; });
    const clock = () => p.evaluate(() => document.getElementById('clock').textContent.trim());
    const d0 = await day(), c0 = await clock();
    await p.click('#sp4'); const t0 = Date.now(); let resets = 0;
    while (Date.now() - t0 < 75000){
      if (await day() >= d0 + 1 && Date.now() - t0 > 46000) break;   // a game day at 8x is 45 s
      if (await p.evaluate(() => !document.getElementById('modal').hidden && !document.getElementById('modal').classList.contains('docked'))) await p.keyboard.press('Escape');
      if (await p.evaluate(() => document.querySelector('#sp4').getAttribute('aria-pressed') !== 'true')){ await p.click('#sp4').catch(() => {}); resets++; }
      await p.waitForTimeout(1000);
    }
    const d1 = await day(), c1 = await clock();
    res[name] = { dayStart: d0, dayEnd: d1, clockStart: c0, clockEnd: c1, realSeconds: Math.round((Date.now() - t0)/1000), speedResets: resets };
    ok(name + ': the clock ran at 8x for a game day', d1 >= d0 + 1, res[name]);
    await p.click('#sp0').catch(() => {}); await p.waitForTimeout(300);
    await p.screenshot({ path: OUT + `/public-${name}.png` });
    await ctx.close();
  }
  await b.close(); stop();
  const fails = Object.entries(checks).filter(([, v]) => v !== 'PASS');
  console.log(JSON.stringify({ port, ...res, checks }, null, 1));
  console.log('ERRORS', errs.length ? errs : 'none');
  console.log(fails.length || errs.length ? 'PUBLIC SMOKE FAIL' : 'PUBLIC SMOKE OK');
  process.exit(fails.length || errs.length ? 1 : 0);
})();
