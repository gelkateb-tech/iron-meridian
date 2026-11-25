// Territory sales, the page: the land picker of the trade builder (point 14: Territory moved there), an AI counter-offer card answered in the thread, the province sheet.
//   bash tools/mkpage.sh && node .test/territory-ui.js [shots-dir]      (screenshots only when a folder is given; desktop 1440x900 and phone 390x844, both at device pixel ratio 2)
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const OUT = process.argv[2] || null; if (OUT) fs.mkdirSync(OUT, { recursive: true });
const errors = [], ok = (c, msg) => { if (!c) errors.push(msg); };
async function run(b, name, vp, dpr){
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: dpr }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const shot = async f => { if (OUT) await p.screenshot({ path: path.join(OUT, `${name}-${f}.png`) }); };
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(400);
  await p.click('[data-act="pick"][data-p="5"]'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.click('#sp0'); await p.waitForTimeout(200);
  // Germany (the player, nation 0) has taken three French border provinces, among them a city with an Arms Industry
  const ids = await p.evaluate(() => { const S = window.__im.S, G = window.__im.G || window.G; const fr = S.nations.findIndex(n => n.name === 'France');
    const border = G.P.filter(P => !P.sea && S.owner[P.id] === fr && !isCapital(P.id) && P.nbs.some(v => S.owner[v] === 0)).map(P => P.id), seen = new Set(border), q = [...border]; let city = -1;
    for (let i = 0; i < q.length && city < 0; i++){ if (G.P[q[i]].city && !isCapital(q[i])){ city = q[i]; break; } for (const v of G.P[q[i]].nbs) if (!seen.has(v) && S.owner[v] === fr){ seen.add(v); q.push(v); } }
    const P0 = [city, ...border.filter(x => x !== city).slice(0, 2)].map(x => G.P[x]);
    for (const P of P0){ S.owner[P.id] = 0; S.occ[P.id] = S.hour - 30; S.unrest[P.id] = 20; } S.bld[P0[0].id].arms = 2; S.nations[0].cash = 1500; S.nations[fr].cash = 2600; geoChanged();
    return { fr, ps: P0.map(P => P.id), city: P0[0].id, name: G.P[P0[0].id].cityName || G.P[P0[0].id].name }; });
  await p.keyboard.press('d'); await p.waitForTimeout(250);
  await p.click(`#sheet [data-act="dp-nat"][data-id="${ids.fr}"]`); await p.waitForTimeout(200);
  ok(await p.locator('#sheet [data-act="dp-trade"]').count() === 1, `${name}: France's page has New Trade`);
  await p.click('#sheet [data-act="dp-trade"]'); await p.waitForTimeout(200);
  ok(/never sells land/.test(await p.locator('.dp-ts.get').innerText()), `${name}: France never sells`);
  await p.click('#sheet [data-act="dp-tpick"][data-side="give"]'); await p.waitForTimeout(200);
  ok(await p.locator('.dp-pr[data-side="give"]').count() === 3, `${name}: three captured provinces listed for sale`);
  await p.click(`.dp-pr[data-side="give"][data-id="${ids.city}"]`); await p.waitForTimeout(300);
  const v = await p.evaluate(c => provValue(c), ids.city);
  const ed = await p.evaluate(() => ({ chosen:window.__im.dp.DV.T.give.provs.slice(), floor:document.querySelector('.dp-flr') ? document.querySelector('.dp-flr').innerText : '', map:!!document.getElementById('terr-map'), show:!!document.querySelector('.dp-loc [data-act="goto"]'), row:document.querySelector('.dp-pr.on') ? document.querySelector('.dp-pr.on').innerText : '' }));
  ok(ed.chosen.length === 1 && ed.chosen[0] === ids.city && new RegExp('\\$' + Math.ceil(v*0.25).toLocaleString('en-US') + 'M').test(ed.floor) && /25%/.test(ed.floor) && ed.map && ed.show && /floor/.test(ed.row), `${name}: picker: chosen, floor 25% of ${v}, locator, Show on map: ` + JSON.stringify(ed));
  // a price over what France pays: the footer says it would counter, and France answers with a counter-offer card
  await p.fill('input[data-act="dp-tv"][data-side="get"][data-k="cash"]', String(v*2)); await p.waitForTimeout(150);
  ok(/offer about|Will not|more/i.test(await p.locator('.dp-verdict').innerText()), `${name}: the footer for a high price: ` + await p.locator('.dp-verdict').innerText());
  await shot('sell');
  await p.click('#sheet [data-act="dp-tsend"]'); await p.waitForTimeout(300);
  const inc = await p.locator('.dp-offer.st-waiting [data-a="accept"]').count(); ok(inc === 1, `${name}: France's counter-offer card shows in the thread: ${inc}`);
  await shot('incoming');
  // the Messages & Trades list marks it; accept it in the thread
  await p.click('#sheet [data-act="dp-back"]'); await p.waitForTimeout(150); await p.evaluate(() => { window.__im.dp.open(); window.__im.dp.DV.tab = 'msg'; window.__im.dp.render(); });
  ok(await p.locator(`.dp-th[data-id="${ids.fr}"] .dp-ans`).count() === 1, `${name}: the offer is marked in Messages & Trades`);
  await p.click(`.dp-th[data-id="${ids.fr}"]`); await p.waitForTimeout(200);
  const cash0 = await p.evaluate(() => window.__im.S.nations[0].cash);
  await p.click('.dp-offer.st-waiting [data-a="accept"]'); await p.waitForTimeout(250);
  const after = await p.evaluate(c => ({ owner: window.__im.S.owner[c], cash: window.__im.S.nations[0].cash, log: window.__im.S.terr.log.length, card:!!document.querySelector('.dp-sys.sale') }), ids.city);
  ok(after.owner === ids.fr && after.cash > cash0 && after.log === 1 && after.card, `${name}: accepted: France owns ${ids.name} again, money in, a sale card: ` + JSON.stringify(after));
  // the province sheet of another captured province: captured from France, its value
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  await p.evaluate(() => { const m = document.getElementById('modal'); if (m && !m.hidden){ const x = document.querySelector('[data-act="resume"]'); if (x) x.click(); } });
  await p.evaluate(q => { const b = document.createElement('button'); b.dataset.act = 'goto'; b.dataset.id = q; document.body.appendChild(b); b.click(); b.remove(); }, ids.ps[1]); await p.waitForTimeout(700);
  if (await p.locator('[data-act="cs-info"]').count()) { await p.click('[data-act="cs-info"]'); await p.waitForTimeout(400); }
  const sheet = await p.evaluate(() => document.body.innerText);
  ok(/Captured from\s*France/.test(sheet) && /Value\s*\$\d/.test(sheet), `${name}: the province sheet shows Captured from France and the value`);
  await p.evaluate(() => { const dt = [...document.querySelectorAll('dt')].find(x => x.textContent === 'Captured from'); if (dt) dt.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(150);
  await shot('sheet');
  ok(!errs.length, `${name}: page errors: ${errs.join(' | ')}`);
  await p.close();
}
(async () => { const b = await chromium.launch();
  try { await run(b, 'desktop', { width: 1440, height: 900 }, 2); await run(b, 'phone', { width: 390, height: 844 }, 2); } catch (e){ errors.push(e.stack); }
  await b.close(); console.log(JSON.stringify({ errors }, null, 1)); process.exit(errors.length ? 1 : 0); })();
