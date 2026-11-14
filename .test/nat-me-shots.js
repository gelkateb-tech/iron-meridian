// Nations world, step 2 (the Middle East): what to look at by eye (plan 5.3). The start screen's Middle East tab; a nation's opening view; the
// region at the opening zoom in parts (city names must not collide: three times as many cities as before); the whole region zoomed out; a
// phone. Every Middle Eastern nation of nations.js has its cities on the map under their names. node .test/nat-me-shots.js <outdir> [tag]
const { chromium } = require('playwright'); const path = require('path');
(async () => { const out = process.argv[2] || __dirname, tag = process.argv[3] || 'middleeast'; const b = await chromium.launch(), errs = [], bad = [];
  const run = async (vp, name, fn) => { const p = await b.newPage({ viewport: vp, deviceScaleFactor: vp.dpr || 1, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
    p.on('pageerror', e => errs.push(name + ' pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(name + ' console: ' + m.text()); });
    await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(900); await fn(p); await p.close(); };
  const tap = async (p, sel, mobile) => mobile ? p.tap(sel) : p.click(sel);
  // a nations-world campaign as `nation` from the start screen's Middle East tab, the briefing closed
  const start = async (p, nation, mobile) => { await tap(p, '[data-act="pickscn"][data-k="world64"]', mobile); await p.waitForTimeout(250); await p.waitForTimeout(250);
    const i = await p.evaluate(nm => SCENARIOS.world64.powers.findIndex(P => P.name === nm), nation); await tap(p, `[data-act="pick"][data-p="${i}"]`, mobile); await p.waitForTimeout(250);
    await p.evaluate(() => document.querySelector('[data-act="begin"]').scrollIntoView()); await tap(p, '[data-act="begin"]', mobile); await p.waitForTimeout(1300);
    if (await p.locator('[data-act="start"]').count()) await tap(p, '[data-act="start"]', mobile); await p.waitForTimeout(3200); };
  // centre the view on (lon, lat) at the zoom the game opens with, in daylight
  const look = (p, lon, lat, k = 1) => p.evaluate(([lon, lat, k]) => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im, G = im.G; im.S.speed = 0;
    let best = null, bd = 1e9; for (const P of G.P){ if (P.sea) continue; const L = ((((P.cc % WORLD.W) + 0.5)/WORLD.W*360 + WORLD.lon0) + 540) % 360 - 180, d = (L - lon)**2 + (P.lat - lat)**2; if (d < bd){ bd = d; best = P; } }
    const R = document.getElementById('map').getBoundingClientRect(), s = (window.__s0 || (window.__s0 = im.view.s))*k; im.view.s = s; im.view.x = R.width/2 - best.x*s; im.view.y = R.height/2 - best.y*s; im.redraw(); return s; }, [lon, lat, k]);
  await run({width:1400, height:900}, 'desk', async p => {
    await tap(p, '[data-act="pickscn"][data-k="world64"]'); await p.waitForTimeout(250); await p.waitForTimeout(300);
    await p.screenshot({ path: `${out}/${tag}-start.png` });
    const cards = await p.evaluate(() => [...document.querySelectorAll('.pick b')].map(e => e.textContent));
    const want = ['Turkey', 'Iran', 'Egypt', 'Saudi Arabia', 'Iraq', 'Syria', 'Yemen', 'Israel'];
    if (cards.slice().sort().join() !== want.slice().sort().join()) bad.push('Middle East tab: ' + cards.join(', '));
    await start(p, 'Iraq');
    const st = await p.evaluate(() => { const view = window.__im.view, NAT = NATIONS.nations.filter(n => n.region === 'Middle East'), miss = [];
      for (const n of NAT){ const N = S.nations.find(x => x.name === n.name); if (!N){ miss.push(n.name + ': not in the game'); continue; }
        for (const id of n.cities){ const P = G.P[id]; if (!P.city || S.owner[id] !== N.id) miss.push(`${n.name}: ${P.name} is not its city`); if (n.names[id] && P.cityName !== n.names[id]) miss.push(`${n.name}: ${P.name} named ${P.cityName}, not ${n.names[id]}`); } }
      return {me:S.nations[0].name, s:+view.s.toFixed(2), n:S.nations.length, all:NATIONS.nations.length, region:NAT.length, cities:G.P.filter(P => P.city).length, miss}; });
    if (st.me !== 'Iraq' || st.n !== st.all || st.region !== 8 || st.miss.length) bad.push('game: ' + JSON.stringify(st));
    console.log(JSON.stringify(st));
    await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); window.__im.redraw(); }); await p.waitForTimeout(1200);
    await p.screenshot({ path: `${out}/${tag}-opening.png` });
    // the region at the opening zoom, part by part: Turkey, the Levant (Syria, Israel), Iraq and western Iran, eastern Iran, Arabia, Yemen, Egypt
    for (const [k, lon, lat] of [['turkey', 33, 39], ['levant', 36.5, 33], ['iraq', 45, 33], ['iran', 55, 32], ['arabia', 45, 24], ['yemen', 47, 15.5], ['egypt', 31, 28]]){ await look(p, lon, lat); await p.waitForTimeout(1400); await p.screenshot({ path: `${out}/${tag}-${k}.png` }); }
    // the whole region, zoomed out
    await look(p, 43, 28, 0.45); await p.waitForTimeout(1400); await p.screenshot({ path: `${out}/${tag}-region.png` }); });
  await run({width:390, height:844, dpr:2, mobile:true}, 'phone', async p => {
    await tap(p, '[data-act="pickscn"][data-k="world64"]', true); await p.waitForTimeout(250); await p.waitForTimeout(300);
    await p.screenshot({ path: `${out}/${tag}-phone-start.png` });
    await p.reload(); await p.waitForTimeout(900); await start(p, 'Israel', true);
    await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); window.__im.redraw(); }); await p.waitForTimeout(1200);
    await p.screenshot({ path: `${out}/${tag}-phone-opening.png` }); });
  console.log('BAD', bad.length ? bad : 'none'); console.log('ERRORS', errs.length ? errs : 'none'); await b.close(); process.exit(errs.length || bad.length ? 1 : 0); })();
