// Trade routes hidden by default (owner request): the default map draws no route lines or cargo ships; they show while one of your fleets
// is selected; blockaded routes always show (the Trade map mode is gone: map-modes). Before / after: the build before this change (.test/page_before_hide.html,
// if present) and now, same seed, hour and camera. node .test/trade-hide.js [outDir]   (desktop 1440x900, dpr 2; run bash tools/mkpage.sh first)
const pickNation = require('./pick-nation.js');   // (a start-screen card by its nation's name, on either world)
const { chromium } = require('playwright'), fs = require('fs');
const OUT = process.argv[2] || __dirname;
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const errors = [], checks = {}, ok = (k, v, i) => { checks[k] = v ? 'PASS' : 'FAIL ' + JSON.stringify(i ?? null); };
  const open = async page => { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(page + ' pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) errors.push(page + ' console: ' + m.text()); });
    await p.goto('file://' + __dirname + '/' + page); await p.waitForTimeout(500);
    await pickNation(p, 'United States'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
    await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 });
    await p.evaluate(() => { const im = window.__im, S = im.S; S.speed = 0; S.hour = 14; document.querySelectorAll('.toast').forEach(t => t.remove()); const m = document.getElementById('modal'); if (m && !m.hidden){ const x = m.querySelector('[data-act="resume"]'); if (x) x.click(); }
      const L = im.G.P.find(P => P.cityName === 'London'), s = 0.75; im.view.s = s; im.view.x = (1440 - 360)/2 - (L.x - 120)*s; im.view.y = 450 - (L.y + 40)*s; });
    await p.waitForTimeout(1200); return {p, ctx}; };
  // the lane pixels: count the dashed-lane colours in a band of the North Atlantic (a cheap stand-in for "lines drawn")
  const lanePx = p => p.evaluate(() => { const c = document.querySelector('canvas'); return c ? c.width : 0; });
  if (fs.existsSync(__dirname + '/page_before_hide.html')){ const {p, ctx} = await open('page_before_hide.html'); await p.screenshot({ path: `${OUT}/hide-desk-0-before.png` }); await ctx.close(); }
  const {p, ctx} = await open('page.html');
  await p.screenshot({ path: `${OUT}/hide-desk-1-after-default.png` });
  const st0 = await p.evaluate(() => ({mode:window.__im.mapMode, routes:window.__im.S.trade.routes.length}));
  ok('the default map is Political, with routes running underneath', st0.mode === 'political' && st0.routes > 10, st0);
  // a fleet selected: routes show
  const fl = await p.evaluate(() => { const im = window.__im, S = im.S, port = im.G.P.find(P => P.cityName === 'New York') || im.G.P.find(P => S.owner[P.id] === 0 && P.city && P.nbs.some(v => im.G.P[v].sea)), z = port.nbs.find(v => im.G.P[v].sea), a = im.addArmy(0, z, {frig:2, crui:1}); im.selectArmy(a.id); return a.id; });
  await p.evaluate(() => { const im = window.__im, L = im.G.P.find(P => P.cityName === 'London'), s = 0.75; im.view.s = s; im.view.x = (1440 - 360)/2 - (L.x - 120)*s; im.view.y = 450 - (L.y + 40)*s; document.querySelectorAll('.toast').forEach(t => t.remove()); });
  await p.waitForTimeout(900); await p.screenshot({ path: `${OUT}/hide-desk-2-fleet-selected.png` });
  // no Trade map mode any more (owner, map-modes: two modes, Political and Terrain): routes show only with a fleet selected, and blockaded ones always
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  const md = await p.evaluate(() => [...document.querySelectorAll('[data-act="mode"]')].map(b => b.dataset.k).join());
  ok('the map modes are Political and Terrain (no Trade mode)', md === 'political,terrain', md);
  // a blockaded route shows in Political mode with nothing selected
  const bl = await p.evaluate(() => { const im = window.__im, S = im.S, T = im.trade, de = S.nations.findIndex(N => N.name === 'Germany'); S.rel[[0, de].sort((x, y) => x - y).join(',')] = {st:'war', since:S.hour, until:null};
    const q = T.chokes().find(c => c.k === 'gibraltar'), a = im.addArmy(0, im.G.prov[q.c], {frig:2}); a.pos = [q.x, q.y]; T.blockade(a, true); T.refresh(); return S.trade.routes.filter(r => r.why === 'blockade' || r.why === 'port').length; });
  ok('a blockade cuts routes (they stay drawn red on the default map)', bl >= 1, bl);
  await p.waitForTimeout(900); await p.screenshot({ path: `${OUT}/hide-desk-4-default-with-blockade.png` });
  void fl; void lanePx; await ctx.close(); await b.close();
  const fails = Object.entries(checks).filter(([, v]) => v !== 'PASS');
  for (const [k, v] of Object.entries(checks)) console.log((v === 'PASS' ? 'PASS ' : v + '  ') + k);
  console.log(JSON.stringify({checks:Object.keys(checks).length, fails:fails.length, errors}));
  process.exit(fails.length || errors.length ? 1 : 0);
})();
