// Economy v1, repair 1: the Market shows every offer (and filters by a goods card), the AI buys a person's sell offer, the defeat screen and the
// research counter know the removed buildings and projects are gone, the offer toast names what was listed, goods without a city are named.
// node .test/eco-rep1.js  (exits 1 on any failed check or page error; screenshots in .test/eco-rep1-*.png)
const { chromium } = require('playwright');
const fails = [], ok = (c, m, extra) => { if (!c) fails.push(m + (extra !== undefined ? ' ' + JSON.stringify(extra) : '')); };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 860 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(400);
  await p.click('[data-act="pick"][data-p="0"]'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.click('#sp0');

  // 1. day 1: the empty Market says it fills up later
  await p.keyboard.press('t'); await p.waitForTimeout(300);
  const d1 = await p.evaluate(() => document.getElementById('sheet').textContent);
  ok(/No nation is selling right now\. In the first days nobody has a surplus yet/.test(d1), 'day 1: the empty market explains that sellers appear later', d1.slice(0, 200));
  await p.keyboard.press('Escape');

  // 2. many offers: every row is on the sheet (no squeezed inner list), a goods card filters them
  await p.evaluate(() => { const S = window.__im.S; S.book = S.book || []; const ks = ['oil', 'metal', 'iron', 'elec', 'rare'];
    for (let i = 0; i < 24; i++){ const n = 1 + i % (S.nations.length - 1); S.book.push({id:S.nid++, type:i % 6 === 5 ? 'buy' : 'sell', seller:n, res:ks[i % 5], qty:40 + i, price:3 + i/10, exp:S.hour + 72, priv:null}); } });
  await p.keyboard.press('t'); await p.waitForTimeout(300);
  const m = await p.evaluate(() => [...document.querySelectorAll('#sheet .tblwrap')].map(w => ({rows:w.querySelectorAll('tbody tr').length, h:w.clientHeight, sh:w.scrollHeight})));
  ok(m.length === 2 && m.every(x => x.sh - x.h <= 2 && x.rows > 0), 'both offer tables are shown in full (the sheet scrolls, not the lists)', m);
  await p.screenshot({ path: __dirname + '/eco-rep1-market.png' });
  await p.click('#sheet .good.res-oil'); await p.waitForTimeout(200);
  const f = await p.evaluate(() => ({on:!!document.querySelector('#sheet .good.res-oil.on'), goods:[...new Set([...document.querySelectorAll('#sheet .ptab.book tbody tr td:nth-child(2)')].map(t => t.textContent.trim()))], form:document.getElementById('bk-res').value}));
  ok(f.on && f.goods.join() === 'Oil' && f.form === 'oil', 'clicking the Oil card shows only oil offers and sets the offer form to oil', f);
  await p.screenshot({ path: __dirname + '/eco-rep1-market-oil.png' });
  await p.click('#sheet [data-act="mk-filter"][data-k=""]'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => new Set([...document.querySelectorAll('#sheet .ptab.book tbody tr td:nth-child(2)')].map(t => t.textContent.trim())).size) === 5, 'Show all goods brings every offer back');

  // 3. a buy offer the money does not cover: the toast names what was really listed
  const t3 = await p.evaluate(() => { const S = window.__im.S, N = S.nations[0], c0 = N.cash; N.cash = 100; document.getElementById('bk-type').value = 'buy'; document.getElementById('bk-res').value = 'oil'; document.getElementById('bk-qty').value = 60; document.getElementById('bk-price').value = 4;
    document.querySelector('[data-act="book-post"]').click(); const o = S.book.filter(x => x.seller === 0 && x.type === 'buy').pop(), tx = [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | '); N.cash = c0; return {qty:o && o.qty, tx}; });
  ok(t3.qty === 25 && /Buy offer posted: 25 oil/.test(t3.tx) && /You asked for 60/.test(t3.tx), 'the toast says 25 oil were listed, not the 60 asked for', t3);
  await p.keyboard.press('Escape');

  // 4. the AI takes a person's sell offer at a fair price (the rules, in the page)
  const s4 = await p.evaluate(() => { const im = window.__im, S = im.S, N = S.nations[0]; S.book = []; N.metal = 500; const m0 = N.metal, c0 = N.cash;
    for (const A of S.nations) if (A.id !== 0){ A.metal = 20; A.cash = Math.max(A.cash, 800); }
    postOffer(0, 'metal', 200, +(S.mkt.p.metal*0.95).toFixed(2), 'sell'); for (let i = 0; i < 48; i++) im.tick();
    const left = (S.book.find(o => o.seller === 0 && o.res === 'metal' && o.type === 'sell') || {qty:0}).qty; return {left, told:(desk(0).log || []).filter(e => /from your offer/.test(e.text)).length}; });
  ok(s4.left <= 100 && s4.told > 0, 'AI nations short of materials buy at least half of a 200 lot offered 5% under the world price within two days, and you are told', s4);

  // 5. goods you have no city for are named (top bar tooltip, Market card), with the old Economy research an old save keeps
  const s5 = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G; for (const P of G.P) if (P.city && S.owner[P.id] === 0 && P.main === 'oil') S.owner[P.id] = 1; S.nations[0].tech.eco1 = 1; S.nations[0].tech.eco3 = 1; return 1; });
  await p.keyboard.press('t'); await p.waitForTimeout(300);
  const c5 = await p.evaluate(() => ({card:document.querySelector('#sheet .good.res-oil').textContent, tip:document.querySelector('#sheet .good.res-oil').title}));
  ok(/No city of yours makes it/.test(c5.card) && /You have no oil city: buy it on the Market/.test(c5.tip), 'the Oil card says no city of yours makes it', c5);
  await p.keyboard.press('Escape'); await p.waitForTimeout(600);
  const tips = await p.evaluate(() => [...document.querySelectorAll('[title]')].map(e => e.title).filter(t => /^(Oil|Money):/.test(t)));
  ok(tips.some(t => /You have no oil city/.test(t) && /Kept from the old Economy research: Oil Refining, oil \+50%/.test(t)), 'the oil tooltip names the missing city and the kept Oil Refining bonus', tips.map(t => t.slice(0, 80)));
  ok(tips.some(t => /Kept from the old Economy research: Industrial Automation/.test(t)), 'the money tooltip names the kept Industrial Automation bonus');
  const r5 = await p.evaluate(() => { const b = [...document.querySelectorAll('[data-act="research-open"]')].map(e => e.textContent).join(' '); return b; });
  ok(/· 0\/\d+/.test(r5), 'the research button does not count the removed Economy projects', r5);
  await p.keyboard.press('r'); await p.waitForTimeout(500);
  const k5 = await p.evaluate(() => (document.querySelector('.rs-kept') || {textContent:''}).textContent);
  ok(/Industrial Automation/.test(k5) && /Oil Refining/.test(k5), 'the research screen lists the kept Economy research', k5);
  await p.screenshot({ path: __dirname + '/eco-rep1-research.png' });
  await p.keyboard.press('Escape');

  // 6. the defeat screen advises buildings that exist
  const e6 = await p.evaluate(() => { const S = window.__im.S, N = S.nations[0]; N.cash = 900; N.mp = 500; N.metal = 500; N.iron = 500; N.oil = 2; S.over = 'lose'; S.overReason = null; IM.emit('over'); return document.getElementById('sheet').textContent; });
  ok(/ran out of oil: build an Arms Industry in an oil city early, capture such a city, or buy it on the Market\./.test(e6) && !/Foundr|Refiner|Rare Earth Mine|Arms Factor/.test(e6), 'the defeat screen names the Arms Industry, not removed buildings', e6.slice(0, 400));
  await p.screenshot({ path: __dirname + '/eco-rep1-defeat.png' });

  console.log(JSON.stringify({fails, errs}, null, 1)); await b.close(); process.exit(fails.length || errs.length ? 1 : 0); })();
