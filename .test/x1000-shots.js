// The resource scale (RES_K): before / after screenshots of the top resource bar, the hover tooltip on oil and on iron, a city's build list,
// a research card and the Market, desktop (1440 x 900, pixel ratio 2) and phone (390 x 844).
//   node .test/x1000-shots.js <page.html> <out dir> <tag>     e.g. the master build's page for "before", this checkout's .test/page.html for "after"
// The game is the same in both: Math.random is seeded before the page loads, so the start screen's seed is the same, and the rules play the
// same game whatever the scale. On the phone the tooltip comes from a long press on the chip (a hover on the desktop).
const pickNation = require('./pick-nation.js');
const { chromium } = require('playwright');
const [PAGE, OUT, TAG] = [process.argv[2] || __dirname + '/page.html', process.argv[3] || __dirname, process.argv[4] || 'after'];
(async () => { const b = await chromium.launch(); const errs = [], info = {};
  for (const [dev, vp] of [['desk', {viewport:{width:1440, height:900}, deviceScaleFactor:2}], ['phone', {viewport:{width:390, height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true}]]){
    const ctx = await b.newContext(vp), p = await ctx.newPage();
    p.on('pageerror', e => errs.push(dev + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(dev + ' console: ' + m.text()); });
    await p.addInitScript(() => { let a = 20261112; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; }; });
    await p.goto('file://' + PAGE); await p.waitForTimeout(400); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(600);
    await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
    await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, {timeout:30000}); await p.waitForTimeout(300);
    // six game days, paused: some income, Market listings and prices that moved
    await p.evaluate(() => { const im = window.__im; im.S.speed = 0; for (let i = 0; i < 6*24; i++) im.tick(); im.S.speed = 0; im.render && im.render(); });
    await p.keyboard.press('Escape').catch(() => {}); await p.waitForTimeout(600);
    info[dev] = await p.evaluate(() => { const S = window.__im.S, N = S.nations[0]; return {nation:N.name, oil:N.oil, metal:N.metal, iron:N.iron, elec:N.elec, rare:N.rare, mp:N.mp, cash:N.cash, chips:[...document.querySelectorAll('#res .chip')].map(c => c.innerText.replace(/\s+/g, ' ').trim())}; });
    const W = vp.viewport.width, shot = (n, clip) => p.screenshot({path:`${OUT}/${TAG}-${dev}-${n}.png`, ...(clip ? {clip} : {})});
    const barH = await p.evaluate(() => Math.ceil(document.querySelector('header').getBoundingClientRect().bottom));
    await shot('1-bar', {x:0, y:0, width:W, height:barH + 4});
    for (const k of ['oil', 'iron']){
      if (dev === 'desk') await p.hover(`#res .res-${k}`);
      else for (let tries = 0; tries < 2; tries++){ const r = await p.evaluate(s => { const e = document.querySelector(s).getBoundingClientRect(); return [e.left + e.width/2, e.top + e.height/2]; }, `#res .res-${k}`);   // (a second press when the first only closed a first-time tip)
        const cdp = await ctx.newCDPSession(p); await cdp.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x:r[0], y:r[1]}]}); await p.waitForTimeout(700); await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]}); await p.waitForTimeout(300);
        if (await p.evaluate(() => { const t = document.getElementById('uitip'); return !!t && !t.hidden; })) break; }
      await p.waitForTimeout(450);
      info[dev + '-' + k + '-tip'] = await p.evaluate(() => { const t = document.getElementById('uitip'); return t && !t.hidden ? t.innerText : null; });
      await shot(`2-tip-${k}`, {x:0, y:0, width:W, height:Math.min(vp.viewport.height, barH + 300)});
      await p.mouse.move(W/2, 600); await p.evaluate(() => { const t = document.getElementById('uitip'); if (t) t.hidden = true; }); }
    // the capital's build list
    await p.evaluate(() => { const im = window.__im, S = im.S; im.selectProv(S.nations[0].capital); }); await p.waitForTimeout(400);
    await p.click('#csheet [data-act="cs-bld"]'); await p.waitForTimeout(500); await shot('3-build');
    info[dev + '-build'] = await p.evaluate(() => [...document.querySelectorAll('#sheet .bld')].slice(0, 3).map(e => e.innerText.replace(/\s+/g, ' ').trim()));
    await p.keyboard.press('Escape'); await p.waitForTimeout(300); await p.evaluate(() => window.__im.clearSel && window.__im.clearSel()); await p.waitForTimeout(200);
    // a research card: the Main Battle Tank's second generation (Armoured Forces)
    await p.click('#resbtn'); await p.waitForTimeout(400); await p.click('[data-act="rbranch"][data-b="arm"]'); await p.waitForTimeout(400);
    await p.click('.rnode[data-id="tank_g2"]'); await p.waitForTimeout(500); await shot('4-research');
    info[dev + '-research'] = await p.evaluate(() => { const c = document.querySelector('.rc-cost, .rcard, #sheet'); return c ? c.innerText.replace(/\s+/g, ' ').slice(0, 400) : null; });
    await p.keyboard.press('Escape'); await p.waitForTimeout(300); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    // the Market
    await p.click('#mktbtn'); await p.waitForTimeout(600); await shot('5-market');
    if (dev === 'desk'){ await p.evaluate(() => { const s = document.querySelector('#sheet .ptab.book'); if (s) s.scrollIntoView({block:'center'}); }); await p.waitForTimeout(300); await shot('6-market-book'); }
    info[dev + '-market'] = await p.evaluate(() => [...document.querySelectorAll('#sheet .good')].map(e => e.innerText.replace(/\s+/g, ' ').trim()));
    await ctx.close(); }
  console.log(JSON.stringify({info, errs}, null, 1)); await b.close(); process.exit(errs.length ? 1 : 0); })();
