// The town grows round what is built (owner 2026-11-25, A7). A nations-world game as Germany; Hamburg with only an Army Base:
//  - the growth is the same every time it is worked out, and each level only adds to the one before (roads, buildings, trees);
//  - level I has an access road and 4 new buildings, level V at least 8 and more trees than level I;
//  - with Hamburg's and Berlin's canvases close in made, a level going up in Hamburg drops Hamburg's canvases only (Berlin's stay),
//    and nothing is dropped while nothing changes.
// node .test/city-grow.js   (needs bash tools/mkpage.sh; exit 1 on a failed check)
const { chromium } = require('playwright'); const path = require('path'); const pickNation = require('./pick-nation.js');
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const ctx = await b.newContext({ viewport:{width:1280, height:800} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, process.env.PAGE || 'page.html')); await p.waitForTimeout(900);
  await p.click('[data-act="pickscn"][data-k="world64"]'); await p.waitForTimeout(300); await pickNation(p, 'Germany');
  await p.evaluate(() => document.querySelector('[data-act="begin"]').scrollIntoView()); await p.click('[data-act="begin"]'); await p.waitForTimeout(1300);
  if (await p.locator('[data-act="start"]').count()) await p.click('[data-act="start"]'); await p.waitForTimeout(3000);
  const fails = [], ok = (c, m) => { if (!c) fails.push(m); };
  const r = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G; S.speed = 0; const H = G.P.find(q => q.cityName === 'Hamburg').id, B = G.P.find(q => q.cityName === 'Berlin').id;
    for (const k of ['fac','air','arms','rec','fort','silo','yard']) S.bld[H][k] = 0; S.cons[H] = null; S.bld[H].fac = 1;
    const a = im.cityDbg.grow(H, 'fac1'), a2 = im.cityDbg.grow(H, 'fac1'), lv = [1, 2, 3, 4, 5].map(l => im.cityDbg.grow(H, 'fac' + l).show);
    // canvases close in for both towns, made with their signatures
    const v = im.view; v.s = 240/12; const mk = q => { const P = G.P[q], R = document.getElementById('map').getBoundingClientRect(); v.x = R.width/2 - P.x*v.s; v.y = R.height/2 - P.y*v.s; im.redraw(); im.cityDbg.make(q, false); };
    mk(B); mk(H); const k0 = im.cityDbg.bakeKeys(), map0 = im.cityDbg.growMap(); im.cityDbg.growWatch(); const k1 = im.cityDbg.bakeKeys();
    S.bld[H].fac = 3; im.cityDbg.growWatch(); const k2 = im.cityDbg.bakeKeys();
    const of = (K, q) => K.filter(k => k.startsWith('d' + q + '|') || k.startsWith('n' + q + '|')).length;
    return {same:JSON.stringify(a) === JSON.stringify(a2), lv, map0, H0:of(k0, H), B0:of(k0, B), H1:of(k1, H), B1:of(k1, B), H2:of(k2, H), B2:of(k2, B), sig:im.cityDbg.grow(H).sig}; });
  console.log(JSON.stringify(r));
  ok(r.same, 'the growth differs between two runs');
  for (let i = 1; i < 5; i++) ok(r.lv[i].ST >= r.lv[i - 1].ST && r.lv[i].B >= r.lv[i - 1].B && r.lv[i].T >= r.lv[i - 1].T, `level ${i + 1} shows less than level ${i}`);
  ok(r.lv[0].ST >= 1 && r.lv[0].B >= 4, 'level I: no access road or under 4 new buildings'); ok(r.lv[4].B >= 8 && r.lv[4].T > r.lv[0].T, 'level V: under 8 new buildings or no more trees');
  ok(r.H0 > 0 && r.B0 > 0, 'the canvases close in were not made'); ok(r.H1 === r.H0 && r.B1 === r.B0, 'canvases dropped with nothing changed');
  ok(r.H2 === 0 && r.B2 === r.B0, `a level up in Hamburg: Hamburg's canvases ${r.H0} -> ${r.H2} (want 0), Berlin's ${r.B0} -> ${r.B2} (want kept)`);
  ok(!errs.length, 'page errors: ' + errs.slice(0, 3).join(' | '));
  console.log(fails.length ? 'FAIL\n' + fails.join('\n') : 'OK'); await b.close(); process.exit(fails.length ? 1 : 0); })();
