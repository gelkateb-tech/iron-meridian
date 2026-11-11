// Province split (nations step 0b): Israel, Greece, Cuba and Belarus at play zoom, on the nations world's map (split) and on the classic map
// (world.js) for comparison; a phone view; every new province named on the map and reachable by a tap. node .test/nat-split-shots.js <outdir>
const { chromium } = require('playwright'); const path = require('path');
(async () => { const out = process.argv[2] || __dirname; const b = await chromium.launch(), errs = [], bad = [];
  // [file, country, zoom, hour (daylight there)]: the top of the play zoom (3.3) for the three larger ones, closer for Israel's one-cell provinces
  const VIEWS = [['israel', 'Israel', 9, 0], ['greece', 'Greece', 4.5, 0], ['cuba', 'Cuba', 4.5, 8], ['belarus', 'Belarus', 3.3, 0]];
  const run = async (vp, tag, fn) => { const p = await b.newPage({ viewport: vp, deviceScaleFactor: vp.dpr || 1, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
    p.on('pageerror', e => errs.push(tag + ' pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(tag + ' console: ' + m.text()); });
    await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(900); await fn(p); await p.close(); };
  // a new campaign from the start screen (the world's first nation), the briefing closed
  const start = async (p, scn) => { if (!(await p.locator('[data-act="pickscn"]').count())){ await p.evaluate(() => document.querySelector('[data-act="newgame"]') || 0); }
    await p.click(`[data-act="pickscn"][data-k="${scn}"]`); await p.waitForTimeout(200); await p.click('[data-act="begin"]'); await p.waitForTimeout(1200);
    if (await p.locator('[data-act="start"]').count()) await p.click('[data-act="start"]'); await p.waitForTimeout(3000); };
  const again = async p => { await p.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'newgame'; b.id = 'ng-x'; document.body.appendChild(b); }); await p.click('#ng-x'); await p.waitForTimeout(400); };
  const look = async (p, country, s, hr, w, h) => p.evaluate(([country, s, hr, w, h]) => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im; im.S.speed = 0; im.S.hour = hr;
    const c = im.G.countries.find(c => c.name === country), Ps = c.provs.map(id => im.G.P[id]), n = Ps.reduce((a, P) => a + P.cells.length, 0);
    const x = Ps.reduce((a, P) => a + P.x*P.cells.length, 0)/n, y = Ps.reduce((a, P) => a + P.y*P.cells.length, 0)/n;
    const R = document.getElementById('map').getBoundingClientRect(); im.view.s = s; im.view.x = R.width/2 - x*s; im.view.y = R.height/2 - y*s; im.redraw(); return {provs:Ps.length, names:Ps.map(P => P.name)}; }, [country, s, hr, w, h]);
  await run({width:1400, height:900}, 'desk', async p => {
    for (const [scn, tag] of [['world64', 'split'], ['world', 'classic']]){ if (tag === 'classic') await again(p); await start(p, scn);
      for (const [k, country, s, hr] of VIEWS){ const r = await look(p, country, s, hr, 1400, 900); await p.waitForTimeout(1600); await p.screenshot({ path: `${out}/split-${k}-${tag}.png` }); console.log(tag, country, r.provs, r.names.join(', ')); } }
    // on the split map: every new province has cells, a name, a centre inside it, neighbours, and a tap on its centre selects it
    await again(p); await start(p, 'world64');
    const chk = await p.evaluate(() => { const base = WORLD.provinces.length, out = [];
      for (const P of G.P.slice(base)){ const at = G.prov[P.cc], nb = P.nbs.length, lk = P.lk.size; if (!P.cells.length || !P.name || at !== P.id || !nb || !lk || P.parent == null || G.P[P.parent].country !== P.country) out.push([P.id, P.name, P.cells.length, at, nb, lk]); }
      return {n:G.P.length - base, bad:out}; });
    if (chk.n !== 21 || chk.bad.length) bad.push('new provinces: ' + JSON.stringify(chk));
    const taps = []; for (const id of [3465, 3471, 3476, 3482]){ const r = await p.evaluate(id => { const P = G.P[id], v = window.__im.view, b = document.getElementById('map').getBoundingClientRect(); v.s = 3; v.x = b.width/2 - P.x*3; v.y = b.height/2 - P.y*3; window.__im.redraw(); return [P.name, b.left + b.width/2, b.top + b.height/2]; }, id);
      await p.waitForTimeout(500); await p.mouse.click(r[1], r[2]); r.length = 1; await p.waitForTimeout(500);
      const got = await p.evaluate(() => { const s = window.__im.sel; return s && s.prov != null ? G.P[s.prov].name : null; }); taps.push([r[0], got]); if (got !== r[0]) bad.push(`tap on ${r[0]} selected ${got}`); }
    console.log('taps', JSON.stringify(taps)); });
  await run({width:390, height:844, dpr:2, mobile:true}, 'phone', async p => { await start(p, 'world64');
    for (const [k, country, s, hr] of [VIEWS[0], VIEWS[1]]){ await look(p, country, s*0.8, hr, 390, 844); await p.waitForTimeout(1600); await p.screenshot({ path: `${out}/split-phone-${k}.png` }); } });
  console.log('BAD', bad.length ? bad : 'none'); console.log('ERRORS', errs.length ? errs : 'none'); await b.close(); process.exit(errs.length || bad.length ? 1 : 0); })();
