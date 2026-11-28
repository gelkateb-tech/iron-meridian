// market shows only nation listings (sell and buy offers): the STOCK MARKET screen (tabs, BUY/SELL top 3, quantity panel, Create Offer, Order Book)
const pickNation = require('./pick-nation.js');   // (a start-screen card by its nation's name, on either world)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1300, height: 860 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(400);
  await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.click('#sp0');
  await p.keyboard.press('t'); await p.waitForTimeout(150);
  console.log('day 1:', await p.evaluate(() => [...document.querySelectorAll('#sheet .mk-empty')].map(e => e.innerText).join(' / ') || 'both sides have offers'));
  await p.keyboard.press('Escape');
  const st = await p.evaluate(() => { const S = window.__im.S; for (let i = 0; i < 24*12; i++) window.__im.tick(); S.nations[0].cash = 2000; S.nations[0].oil = 200*RES_K; return { sells: S.book.filter(o => o.type !== 'buy').length, bids: S.book.filter(o => o.type === 'buy').length }; });
  console.log('day 13 listings:', JSON.stringify(st));
  await p.keyboard.press('t'); await p.waitForTimeout(200); await p.screenshot({ path: __dirname + '/book.png' });
  // take an offer the way a person does: the good's tab, its Buy or Sell button, the 10K chip, the confirm button
  const take = async (side) => { const r = await p.evaluate(side => { for (const k of MKT_K){ const o = topOffers(0, k, side, 1)[0]; if (o) return {id:o.id, k}; } return null; }, side); if (!r) return 'none';
    if (side === 'bid') await p.evaluate(k => { window.__im.S.nations[0][k] = 300*RES_K; }, r.k);
    await p.click(`[data-act="mk-filter"][data-k="${r.k}"]`); await p.click(`[data-act="mk-open"][data-id="${r.id}"]`); await p.click('[data-act="mk-q"][data-v="10000"]'); await p.click('.mk-ok'); await p.waitForTimeout(100);
    return p.evaluate(() => document.getElementById('toasts').innerText.split('\n')[0]); };
  console.log('buy toast:', await take('ask'));
  console.log('sell toast:', await take('bid'));
  await p.click('[data-act="mk-view"][data-v="create"]'); await p.click('[data-act="mk-type"][data-v="buy"]'); await p.fill('#bk-qty', '30000'); await p.fill('#bk-price', '3.5'); const c0 = await p.evaluate(() => window.__im.S.nations[0].cash);
  await p.click('[data-act="book-post"]'); await p.waitForTimeout(100);
  console.log('posted buy offer: cash held', Math.round(c0 - await p.evaluate(() => window.__im.S.nations[0].cash)), 'mine:', await p.evaluate(() => window.__im.S.book.filter(o => o.seller === 0).map(o => o.type + ' ' + o.qty + o.res).join(',')));
  const mine = await p.evaluate(() => window.__im.S.book.find(o => o.seller === 0 && o.type === 'buy').id); await p.click(`[data-act="book-cancel"][data-id="${mine}"]`); await p.waitForTimeout(100);
  console.log('cancelled:', await p.evaluate(() => window.__im.S.book.filter(o => o.seller === 0).length === 0), 'cash back', Math.round(c0 - await p.evaluate(() => window.__im.S.nations[0].cash)) === 0);
  console.log(errs); await b.close();
})();
