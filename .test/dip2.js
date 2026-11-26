// diplomacy chat, trade deals, open market offers
const pickNation = require('./pick-nation.js');   // (a start-screen card by its nation's name, on either world)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1300, height: 860 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(400);
  await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.click('#sp0');
  const ids = await p.evaluate(() => { const S = window.__im.S; S.nations[0].cash = 3000; return { fr: S.nations.findIndex(n => n.name === 'France'), pl: S.nations.findIndex(n => n.name === 'Russia') }; });
  await p.keyboard.press('d'); await p.waitForTimeout(200);
  // France's thread (a computer nation, D1): Messages & Trades -> Write to a nation
  await p.click('[data-act="dp-tab"][data-k="msg"]'); await p.waitForTimeout(100); await p.selectOption('#dp-newchat', String(ids.fr)); await p.waitForTimeout(150);
  await p.fill('#dp-text', 'Hello friends'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  await p.click('[data-act="dp-quick"][data-t="May we have right of way through your land?"]'); await p.waitForTimeout(900);
  console.log('chat:', await p.evaluate(() => document.getElementById('dp-hist').innerText.replace(/\n+/g, ' | ').slice(0, 400)));
  await p.screenshot({ path: __dirname + '/dip-chat.png' });
  // trade: goods for cash (France never sells land: its side has no province picker)
  await p.click('.dp-cbs [data-act="dp-trade"]'); await p.waitForTimeout(150);
  const noProv = await p.evaluate(() => !document.querySelector('.dp-ts.get [data-act="dp-tpick"]') && /never sells land/.test(document.querySelector('.dp-ts.get').innerText));
  console.log('France never sells land in the builder:', noProv); if (!noProv) throw new Error('the trade builder offers French provinces');
  await p.fill('input[data-act="dp-tv"][data-side="get"][data-k="oil"]', '10000'); await p.waitForTimeout(150);   // (RES_K: 10 of the old units)
  console.log('verdict 1:', await p.evaluate(() => document.querySelector('.dp-verdict').innerText));
  await p.fill('input[data-act="dp-tv"][data-side="give"][data-k="cash"]', '900'); await p.waitForTimeout(150);
  console.log('verdict 2:', await p.evaluate(() => document.querySelector('.dp-verdict').innerText));
  await p.screenshot({ path: __dirname + '/dip-trade.png' });
  await p.click('[data-act="dp-tsend"]'); await p.waitForTimeout(200);
  console.log('after send:', await p.evaluate(() => ({ log: window.__im.S.log[0].text, view:window.__im.dp.DV.view })));
  // market: make Russia an enemy with an offer
  await p.evaluate(ids => { const S = window.__im.S; S.rel[[0, ids.pl].sort((a, b) => a - b).join(',')] = { st: 'war', since: 0, until: null }; S.book = [{ id: 9001, seller: ids.pl, res: 'oil', qty: 60*RES_K, price: 3.1, exp: S.hour + 72 }, { id: 9002, seller: ids.fr, res: 'metal', qty: 40*RES_K, price: 2.2, exp: S.hour + 72 }]; }, ids);
  await p.keyboard.press('Escape'); await p.keyboard.press('t'); await p.waitForTimeout(200);
  await p.evaluate(() => document.querySelector('.ptab.book').scrollIntoView()); await p.screenshot({ path: __dirname + '/dip-market.png' });
  console.log('enemy row title:', await p.evaluate(() => document.querySelector('.ptab.book tr.enemy') && document.querySelector('.ptab.book tr.enemy').title));
  await p.click(`[data-act="book-buy"][data-id="9001"][data-q="${await p.evaluate(() => 10*MKT_LOT)}"]`); await p.waitForTimeout(100);
  console.log('bought:', await p.evaluate(() => window.__im.S.book.find(o => o.id === 9001).qty));
  console.log(errs); await b.close();
})();
