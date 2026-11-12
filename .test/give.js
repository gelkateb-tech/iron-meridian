const pickNation = require('./pick-nation.js');   // (a start-screen card by its nation's name, on either world)
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1300, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(400);
  await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.click('#sp0');
  const fr = await p.evaluate(() => { const S = window.__im.S, fr = S.nations.findIndex(n => n.name === 'France'); S.rel[[0, fr].sort((a, b) => a - b).join(',')] = { st: 'ally', since: 0, until: null }; S.nations[0].cash = 1000; return fr; });
  await p.keyboard.press('d'); await p.waitForTimeout(200);
  console.log('give button on row:', await p.evaluate(fr => !!document.querySelector(`[data-act="nat-open"][data-id="${fr}"][data-k="give"]`), fr));
  await p.click(`[data-act="nat-open"][data-id="${fr}"][data-k="give"]`); await p.waitForTimeout(150);
  const c0 = await p.evaluate(fr => [window.__im.S.nations[0].cash, window.__im.S.nations[fr].cash], fr);
  await p.fill('input[data-act="gift-res"][data-k="cash"]', '200'); await p.press('input[data-act="gift-res"][data-k="cash"]', 'Tab');
  await p.fill('input[data-act="gift-res"][data-k="rare"]', '30000');   // (goods at the resource scale RES_K: 30 of the old units) await p.press('input[data-act="gift-res"][data-k="rare"]', 'Tab');
  await p.screenshot({ path: __dirname + '/give.png' });
  await p.click('[data-act="gift-send"]'); await p.waitForTimeout(150);
  const c1 = await p.evaluate(fr => [window.__im.S.nations[0].cash, window.__im.S.nations[fr].cash], fr);
  console.log('cash before', c0.map(Math.round), 'after', c1.map(Math.round));
  console.log('chat:', await p.evaluate(() => document.getElementById('chatbox').innerText.replace(/\n+/g, ' | ').slice(-160)));
  console.log('market private checkbox:', await p.evaluate(() => { document.querySelector('[data-act="resume"]') ; return null; }));
  console.log(errs); await b.close(); })();
