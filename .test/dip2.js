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
  await p.click(`[data-act="nat-open"][data-id="${ids.fr}"][data-k="chat"]`); await p.waitForTimeout(150);
  await p.fill('#chatin', 'Hello friends'); await p.keyboard.press('Enter'); await p.waitForTimeout(900);
  await p.click('[data-act="chat-quick"][data-t="May we have right of way through your land?"]'); await p.waitForTimeout(900);
  console.log('chat:', await p.evaluate(() => document.getElementById('chatbox').innerText.replace(/\n+/g, ' | ').slice(0, 400)));
  await p.screenshot({ path: __dirname + '/dip-chat.png' });
  // trade: goods for cash (provinces are no longer traded here: captured land is sold in the Territory tab, and France never sells)
  await p.click('[data-act="nat-tab"][data-k="trade"]'); await p.waitForTimeout(150);
  const noProv = await p.evaluate(() => !document.querySelector('select[data-act="deal-prov"]') && /Territory/.test(document.querySelector('.tr-note').innerText));
  console.log('no province picker in the trade deal:', noProv); if (!noProv) throw new Error('the trade deal still offers provinces');
  await p.fill('input[data-act="deal-res"][data-side="get"][data-k="oil"]', '10000');   // (RES_K: 10 of the old units) await p.press('input[data-act="deal-res"][data-side="get"][data-k="oil"]', 'Tab'); await p.waitForTimeout(150);
  console.log('verdict 1:', await p.evaluate(() => document.querySelector('.status').innerText));
  await p.fill('input[data-act="deal-res"][data-side="give"][data-k="cash"]', '900'); await p.press('input[data-act="deal-res"][data-side="give"][data-k="cash"]', 'Tab'); await p.waitForTimeout(150);
  console.log('verdict 2:', await p.evaluate(() => document.querySelector('.status').innerText));
  await p.screenshot({ path: __dirname + '/dip-trade.png' });
  await p.click('[data-act="deal-send"]'); await p.waitForTimeout(200);
  console.log('after send:', await p.evaluate(() => ({ log: window.__im.S.log[0].text })));
  // market: make Russia an enemy with an offer
  await p.evaluate(ids => { const S = window.__im.S; S.rel[[0, ids.pl].sort((a, b) => a - b).join(',')] = { st: 'war', since: 0, until: null }; S.book = [{ id: 9001, seller: ids.pl, res: 'oil', qty: 60*RES_K, price: 3.1, exp: S.hour + 72 }, { id: 9002, seller: ids.fr, res: 'metal', qty: 40*RES_K, price: 2.2, exp: S.hour + 72 }]; }, ids);
  await p.keyboard.press('Escape'); await p.keyboard.press('t'); await p.waitForTimeout(200);
  await p.evaluate(() => document.querySelector('.ptab.book').scrollIntoView()); await p.screenshot({ path: __dirname + '/dip-market.png' });
  console.log('enemy row title:', await p.evaluate(() => document.querySelector('.ptab.book tr.enemy') && document.querySelector('.ptab.book tr.enemy').title));
  await p.click(`[data-act="book-buy"][data-id="9001"][data-q="${await p.evaluate(() => 10*MKT_LOT)}"]`); await p.waitForTimeout(100);
  console.log('bought:', await p.evaluate(() => window.__im.S.book.find(o => o.id === 9001).qty));
  console.log(errs); await b.close();
})();
