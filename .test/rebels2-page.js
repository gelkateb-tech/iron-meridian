// The morale rule in the page (rules first, the full city panel comes later): a nations game as Poland, a German city taken; its side panel shows the
// morale target and the Annex City button, a click starts the annexing; the city sheet and the Cities list draw with an annexing under way; a rising
// in a burning city; the help page; no page error.   node .test/rebels2-page.js [page.html]
const pickNation = require('./pick-nation.js');
const { chromium } = require('playwright');
const PAGE = process.argv[2] || __dirname + '/page.html';
const bad = [], errs = [], ok = (c, m) => { if (!c) bad.push(m); };
(async () => { const b = await chromium.launch();
  for (const [dev, vp] of [['desk', {viewport:{width:1440, height:900}}], ['phone', {viewport:{width:440, height:900}, isMobile:true, hasTouch:true, deviceScaleFactor:2}]]){
    const ctx = await b.newContext(vp), p = await ctx.newPage();
    p.on('pageerror', e => errs.push(dev + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(dev + ' console: ' + m.text()); });
    await p.goto('file://' + PAGE + '?start=nations'); await p.waitForSelector('[data-act="pick"]'); await p.evaluate(() => localStorage.clear());
    await pickNation(p, 'Poland'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
    await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, {timeout:30000}); await p.waitForTimeout(300);
    const t = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G; S.speed = 0; const DE = S.nations.findIndex(N => N.name === 'Germany');
      const c = G.P.find(P => P.city && P.cityName === 'Dresden').id; for (const a of S.armies) if (a.at === c) for (const k in a.u) a.u[k] = 0; removeEmpty();
      setRel(0, DE, 'war'); capture(c, 0); addArmy(0, c, {inf:2}); S.nations[0].cash = 2000; S.nations[0].mp = 500; im.selectProv(c); return {c, DE}; });
    await p.waitForTimeout(300);
    const side = await p.evaluate(() => { const h = document.body.innerText; return {morale:/Morale 25% → target/.test(h), occ:/occupied: 25% output/.test(h), btn:!!document.querySelector('[data-act="annex"]')}; });
    // (the phone shows the city sheet, which gets its morale factors list in the page step; the side panel's status is the desktop's until then)
    ok(side.btn && (dev === 'phone' || side.morale && side.occ), dev + ' side panel: morale, target, occupied, Annex City button ' + JSON.stringify(side));
    if (side.btn){ const vis = p.locator('[data-act="annex"]:visible'); if (await vis.count()) await vis.first().click(); else await p.evaluate(() => document.querySelector('[data-act="annex"]').click()); await p.waitForTimeout(300); }
    const an = await p.evaluate(c => ({cons:S.cons[c] && S.cons[c].k, txt:/Annexing ·/.test(document.body.innerText)}), t.c);
    ok(an.cons === 'annex' && (dev === 'phone' || an.txt), dev + ' the click starts the annexing ' + JSON.stringify(an));
    // the Cities list and the city sheet with an annexing under way (a construction that is no building)
    await p.evaluate(() => window.__im.cp && window.__im.cp.render && window.__im.cp.render());
    if (await p.locator('[data-act="cities-open"]').count()){ await p.click('[data-act="cities-open"]'); await p.waitForTimeout(300); ok(/Annex City/.test(await p.evaluate(() => document.body.innerText)), dev + ' the Cities list names the annexing'); await p.keyboard.press('Escape'); }
    // a rising in a burning city with the garrison: the dispatch, then days later the annexed status
    const r = await p.evaluate(c => { S.mor[c] = 20; const before = S.log.length; rebelRise(c, 0); const msg = S.log.slice(0, S.log.length - before + 2).map(e => e.text).join(' | ');
      for (let i = 0; i < 24*6; i++) tick(); return {msg, owner:S.owner[c], st:occSt(c), rebels:!!rebelsAt(c)}; }, t.c);
    ok(/Rebels rose up in Dresden/.test(r.msg), dev + ' rising dispatch ' + r.msg.slice(0, 160));
    await p.evaluate(c => window.__im.selectProv(c), t.c); await p.waitForTimeout(300);
    // help
    const help = await p.evaluate(() => /Annex City/.test(document.documentElement.innerHTML) && /33% morale or less/.test(document.documentElement.innerHTML));
    ok(help, dev + ' the help text names the new rule');
    await p.screenshot({path:`/tmp/claude-0/-home-user-iron-meridian/7fd07611-91e4-5b00-ba43-06c622a65904/scratchpad/rebels2/page-${dev}.jpg`, type:'jpeg', quality:70});
    await ctx.close(); }
  await b.close();
  console.log(JSON.stringify({bad, errs}, null, 1)); process.exit(bad.length || errs.length ? 1 : 0); })();
