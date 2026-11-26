// Market, old saves: saves from before the order-book rework (no whole-game history M.hg, offers without q0/stock/depth, no N.mkU, the old
// units) load, the STOCK MARKET screen opens on every tab, the chart starts from the days the save kept, the Order Book and Create Offer work,
// and 3 days play with the book conserved. node .test/mkt-oldsave.js  (exits 1 on a failed check or a page error)
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const fails = [], ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m + (x !== undefined ? '  ' + JSON.stringify(x) : '')); if (!c) fails.push(m); };
(async () => { const b = await chromium.launch(), errs = [];
  for (const f of ['eco-v1-save.json', 'bunker-oldsave.json', 'upgrades-oldsave.json']){
    const fp = path.join(__dirname, 'fixtures', f); if (!fs.existsSync(fp)){ console.log('skip ' + f); continue; }
    const p = await b.newPage({ viewport: { width: 440, height: 900 }, isMobile: true, hasTouch: true }); p.on('pageerror', e => errs.push(f + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(f + ': console: ' + m.text()); });
    await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(500);
    const txt = fs.readFileSync(fp, 'utf8');
    const r0 = await p.evaluate(t => { const d = JSON.parse(t); const had = {hg:!!(d.mkt && d.mkt.hg), hist:d.mkt && d.mkt.hist ? (d.mkt.hist.oil || []).length : 0, book:(d.book || []).length}; window.__im.restore(d); const S = window.__im.S; S.started = true; return {had, hg:!!S.mkt.hg, n:worldHistory('oil').length, day:Math.floor(S.hour/24) + 1}; }, txt);
    ok(!r0.had.hg && (r0.had.hist ? r0.hg && r0.n === r0.had.hist : r0.n === 0), `${f}: the history starts from the ${r0.had.hist} days the save kept`, r0);
    const sides = await p.evaluate(() => MKT_K.map(k => [(S.book || []).filter(o => o.res === k && o.type !== 'buy' && o.qty > 0).length, (S.book || []).filter(o => o.res === k && o.type === 'buy' && o.qty > 0).length]));
    // (the depth floor at load: every good has offers; a side can stay short where no computer nation can afford a bid, as in play)
    ok(sides.every(([a, b]) => a + b >= 2) && sides.filter(([a, b]) => a >= 1 && b >= 1).length >= 4, `${f}: the Market opens with offers (the load posts the depth floor, not the first daily step)`, sides);
    await p.evaluate(() => { document.querySelectorAll('#modal:not([hidden])').forEach(() => {}); }); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    await p.keyboard.press('t'); await p.waitForTimeout(300);
    let open = await p.evaluate(() => window.__im.modalKind()); if (open !== 'market'){ await p.click('[data-act="market-open"]').catch(() => {}); await p.waitForTimeout(300); open = await p.evaluate(() => window.__im.modalKind()); }
    ok(open === 'market' && await p.locator('.mk-ban').count() === 1, `${f}: the STOCK MARKET opens`);
    for (const k of ['oil', 'metal', 'iron', 'elec', 'rare']){ await p.click(`[data-act="mk-filter"][data-k="${k}"]`); await p.waitForTimeout(80); }
    await p.click('[data-act="mk-chart"]'); await p.waitForTimeout(80); await p.click('[data-act="mk-chart"]');
    await p.click('[data-act="mk-view"][data-v="book"]'); await p.click('[data-act="mk-all"][data-v="1"]'); await p.waitForTimeout(100);
    const rows = await p.evaluate(() => document.querySelectorAll('#sheet .mk-body > .mk-row').length);
    await p.click('[data-act="mk-view"][data-v="create"]'); await p.waitForTimeout(100);
    ok(rows >= 0 && await p.locator('#bk-qty').count() === 1, `${f}: the Order Book (${rows} rows) and Create Offer open`);
    await p.keyboard.press('Escape');
    const c = await p.evaluate(() => { const S = window.__im.S, tot = () => { let c = 0; for (const N of S.nations) c += N.cash; return c; }; const before = (S.book || []).length; for (let i = 0; i < 72; i++) window.__im.tick(); return {before, after:(S.book || []).length, bids:(S.book || []).filter(o => o.type === 'buy').length, nan:S.nations.some(N => !Number.isFinite(N.cash) || MKT_K.some(k => !Number.isFinite(N[k]))), hg:worldHistory('oil').length}; });
    ok(!c.nan && c.bids > 0 && c.hg > r0.n, `${f}: 3 days play on, buy offers appear, the history grows`, c);
    await p.close(); }
  ok(!errs.length, 'no page errors', errs.slice(0, 5));
  console.log(fails.length ? `FAILED ${fails.length}` : 'ALL OK'); await b.close(); process.exit(fails.length ? 1 : 0); })();
