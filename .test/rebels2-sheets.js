// The REBELS Before / After pictures on a phone (440 x 900, dpr 2): the same scenes, camera and game hour on a page from before this rule (master)
// and on this branch. Raw shots go to <out>/raw/<before|after>/<scene>.png; tools/... compose them (see the job's report).
//   node .test/rebels2-sheets.js <out> <before|after> <page.html> [panel,fire,rebels,trade]
const SC = require('./rebels2-scene.js');
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2], VER = process.argv[3], PAGE = process.argv[4], ONLY = process.argv[5] ? process.argv[5].split(',') : null, want = k => !ONLY || ONLY.includes(k), DIR = `${OUT}/raw/${VER}/`; fs.mkdirSync(DIR, {recursive:true});
const errs = [];
(async () => { const b = await chromium.launch();
  const fresh = async () => { const ctx = await b.newContext({viewport:{width:440, height:900}, isMobile:true, hasTouch:true, deviceScaleFactor:2}), p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message)); await SC.start(p, 'Poland', PAGE); return {ctx, p}; };
  const shot = async (p, name, ms = 1200) => { await p.waitForTimeout(ms); await p.screenshot({path:DIR + name + '.png'}); };
  const clear = p => p.evaluate(() => { const b = document.querySelector('[data-act="clear"]'); if (b) b.click(); });
  const after = VER === 'after';
  // 1-3: the occupied city's panel, its BUILD list, an annexing under way
  if (want('panel')){ const {ctx, p} = await fresh(); const s = await SC.city(p, {mor:28, inf:2, nb:38, cash:2000, mp:500, hour:26}); await SC.camera(p, s.c, 22, 0.2);
    await shot(p, '1-panel');
    await p.click('#csheet .cs-bldb'); await shot(p, '2-build', 900); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    if (after){ await p.click('#csheet .cs-blds .cs-c.annex'); await p.evaluate(c => { const k = S.cons[c]; if (k) k.h = k.h0 - 30; }, s.c); }
    await p.evaluate(c => { window.__im.selectProv(null); }, s.c).catch(() => {}); await clear(p); await p.evaluate(c => window.__im.selectProv(c), s.c); await p.waitForTimeout(300);
    await p.evaluate(() => { const r = document.querySelector('#csheet .cs-body'); if (r) r.scrollTop = 0; }); await shot(p, '3-annexing');
    await ctx.close(); }
  // 4-7: burning cities on the map: play zoom and close zoom, by day and by night (Dresden 24%, Wroclaw 30%)
  if (want('fire')){ const {ctx, p} = await fresh(); const s = await SC.city(p, {mor:24, inf:2, select:false, hour:26});
    await p.evaluate(() => { const S = window.__im.S, G = window.__im.G, w = G.P.find(P => P.cityName === 'Wrocław').id; if (S.mor) S.mor[w] = 30; else S.unrest[w] = 70; }); await clear(p);
    for (const [nm, h] of [['day', 26], ['night', 38]]){ await p.evaluate(h => { window.__im.S.hour = h; }, h);
      await SC.camera(p, s.c, 22, 0.45); await shot(p, `4-fire-play-${nm}`, 2500); await SC.camera(p, s.c, 90, 0.5); await shot(p, `5-fire-close-${nm}`, 2500);
      await SC.camera(p, s.c, 5.5, 0.45); await shot(p, `6-fire-far-${nm}`, 2000); }
    await ctx.close(); }
  // 8: a rising against troops (a battle); 9: a city taken by rebels (independent, held by them)
  if (want('rebels')){ const {ctx, p} = await fresh(); const s = await SC.city(p, {mor:20, inf:2, select:false, hour:26}); await clear(p);
    await SC.toasts(p);
    await p.evaluate(c => { if (typeof rebelRise === 'function'){ rebelRise(c, 0); tickQ(); tickQ(); } }, s.c); await SC.camera(p, s.c, 40, 0.42); await shot(p, '8-rising', 1600);
    await p.evaluate(c => window.__im.selectProv(c), s.c); await shot(p, '8b-rising-panel', 900);
    await clear(p); const w = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, w = G.P.find(P => P.cityName === 'Wrocław').id; for (const a of S.armies) if (a.at === w && !a.air) for (const k in a.u) a.u[k] = 0; removeEmpty();
      const nb = G.P[w].nbs.find(q => !G.P[q].sea && S.owner[q] === 0); addArmy(0, nb, {inf:1});
      if (S.mor){ S.mor[w] = 15; rebelRise(w, 0); } else S.unrest[w] = 85; return w; });
    await SC.camera(p, w, 40, 0.3); await p.evaluate(w => window.__im.selectProv(w), w); await shot(p, '9-taken', 1600);
    await ctx.close(); }
  // 10: a trade partner occupied: war on Germany, four German cities taken and held (6 infantry each), a day and a half played; the trade card
  if (want('trade')){ const {ctx, p} = await fresh();
    const r = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, DE = S.nations.findIndex(N => N.name === 'Germany');
      const before = (S.trade ? S.trade.routes : []).filter(r => r.a === 0 || r.b === 0).map(r => S.nations[r.a === 0 ? r.b : r.a] ? S.nations[r.a === 0 ? r.b : r.a].name : 'ind');
      setRel(0, DE, 'war'); for (const nm of ['Dresden', 'Hamburg', 'Nürnberg', 'Munich']){ const c = G.P.find(P => P.cityName === nm).id; for (const a of S.armies) if (a.at === c && !a.air) for (const k in a.u) a.u[k] = 0; removeEmpty(); capture(c, 0); addArmy(0, c, {inf:6}); }
      S.nations[DE].ai = false; for (let i = 0; i < 36; i++) tick(); return {before, after:S.trade.routes.filter(r => r.a === 0 || r.b === 0).map(r => S.nations[r.a === 0 ? r.b : r.a] ? S.nations[r.a === 0 ? r.b : r.a].name : 'ind'), inc:tradeIncome(0)}; });
    console.log(VER, 'trade', JSON.stringify(r));
    await clear(p); await p.evaluate(() => document.querySelector('[data-act="diplo-open"]') ? document.querySelector('[data-act="diplo-open"]').click() : null); await p.waitForTimeout(300);
    if (!await p.evaluate(() => !!document.querySelector('#sheet [data-act="dp-tab"]'))){ await p.keyboard.press('d'); await p.waitForTimeout(300); }
    if (await p.locator('[data-act="dp-tab"][data-k="msg"]').count()){ await p.click('[data-act="dp-tab"][data-k="msg"]'); await p.waitForTimeout(250); }
    if (await p.evaluate(() => !!document.querySelector('.dp-routes:not(.open) [data-act="dp-routes"]'))){ await p.click('[data-act="dp-routes"]'); await p.waitForTimeout(250); }
    await shot(p, '10-trade', 600);
    await p.evaluate(() => { const L = document.querySelectorAll('.dp-routes .trr'), e = document.querySelector('.dp-routes .trr.lost') || L[L.length - 1]; if (e) e.scrollIntoView({block:'end'}); }); await shot(p, '10b-trade-rows', 500);
    await ctx.close(); }
  await b.close(); console.log(VER, 'errors', JSON.stringify(errs.slice(0, 5))); })();
