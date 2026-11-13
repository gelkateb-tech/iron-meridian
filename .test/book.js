// market shows only nation listings (sell and buy offers)
const pickNation = require('./pick-nation.js');   // (a start-screen card by its nation's name, on either world)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1300, height: 860 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(400);
  await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.click('#sp0');
  await p.keyboard.press('t'); await p.waitForTimeout(150);
  console.log('day 1:', await p.evaluate(() => [...document.querySelectorAll('#sheet p.small.muted')].map(e => e.innerText).filter(t => /No nation/.test(t)).join(' / ')));
  await p.keyboard.press('Escape');
  const st = await p.evaluate(() => { const S = window.__im.S; for (let i = 0; i < 24*12; i++) window.__im.tick(); S.nations[0].cash = 2000; S.nations[0].oil = 200*RES_K; return { sells: S.book.filter(o => o.type !== 'buy').length, bids: S.book.filter(o => o.type === 'buy').length }; });
  console.log('day 13 listings:', JSON.stringify(st));
  await p.keyboard.press('t'); await p.waitForTimeout(200); await p.screenshot({ path: __dirname + '/book.png' });
  const r = await p.evaluate(() => { const S = window.__im.S, sell = S.book.find(o => o.type !== 'buy' && o.seller !== 0 && !window.__im.S.rel), bid = S.book.find(o => o.type === 'buy'); return { sell: S.book.find(o => o.type !== 'buy') && S.book.find(o => o.type !== 'buy').id, bid: bid && bid.id, bidRes: bid && bid.res }; });
  const LOT10 = await p.evaluate(() => 10*MKT_LOT);   // the Buy 10K / Sell 10K buttons (goods at the resource scale RES_K)
  if (r.sell){ await p.click(`[data-act="book-buy"][data-id="${r.sell}"][data-q="${LOT10}"]`); await p.waitForTimeout(100); }
  console.log('buy toast:', await p.evaluate(() => document.getElementById('toasts').innerText.split('\n')[0]));
  if (r.bid){ await p.evaluate(res => { window.__im.S.nations[0][res] = 300*RES_K; }, r.bidRes); await p.click(`[data-act="book-buy"][data-id="${r.bid}"][data-q="${LOT10}"]`); await p.waitForTimeout(100); }
  console.log('sell toast:', await p.evaluate(() => document.getElementById('toasts').innerText.split('\n')[0]));
  await p.selectOption('#bk-type', 'buy'); await p.fill('#bk-qty', '30000'); await p.fill('#bk-price', '3.5'); const c0 = await p.evaluate(() => window.__im.S.nations[0].cash);
  await p.click('[data-act="book-post"]'); await p.waitForTimeout(100);
  console.log('posted buy offer: cash held', Math.round(c0 - await p.evaluate(() => window.__im.S.nations[0].cash)), 'mine:', await p.evaluate(() => window.__im.S.book.filter(o => o.seller === 0).map(o => o.type + ' ' + o.qty + o.res).join(',')));
  console.log(errs); await b.close();
})();
