// Cities panel: Build / Train open inline under the row (the map does not move), a separate go-to button, multi-select with the bar's plan.
//   node .test/cities-panel.js [page.html]      exit 0 and empty errors when every check passes
const pickNation = require('./pick-nation.js');
const { chromium } = require('playwright');
const PAGE = process.argv[2] || __dirname + '/page.html';
const bad = [], errs = [], ok = (c, m) => { if (!c) bad.push(m); };
(async () => { const b = await chromium.launch();
  for (const [dev, vp] of [['desk', {viewport:{width:1440, height:900}}], ['phone', {viewport:{width:390, height:844}, isMobile:true, hasTouch:true}]]){
    const ctx = await b.newContext(vp), p = await ctx.newPage();
    p.on('pageerror', e => errs.push(dev + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(dev + ' console: ' + m.text()); });
    await p.addInitScript(() => { let a = 20261112; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; }; });
    await p.goto('file://' + PAGE); await p.waitForSelector('[data-act="pick"]'); await p.evaluate(() => localStorage.clear());
    await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
    await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, {timeout:30000}); await p.waitForTimeout(300);
    // a coastal city, an inland one, a few more of ours; plenty of everything, so what is left out is the rules, not the purse
    const setup = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, N = S.nations[0]; im.S.speed = 0;
      for (const k of ['cash', 'oil', 'metal', 'iron', 'elec', 'rare', 'mp']) N[k] = Math.max(N[k] || 0, k === 'cash' || k === 'mp' ? 5000 : 500000);
      let mine = G.P.filter(P => P.city && S.owner[P.id] === 0), coast = mine.filter(P => P.coast), inland = mine.filter(P => !P.coast);
      const take = (P, cond) => { const q = G.P.find(x => x.city && !x.sea && S.owner[x.id] !== 0 && S.owner[x.id] < 0 && cond(x)) || G.P.find(x => x.city && !x.sea && S.owner[x.id] !== 0 && cond(x)); if (q){ S.owner[q.id] = 0; } };
      if (!coast.length) take(null, x => x.coast); if (!inland.length) take(null, x => !x.coast);
      mine = G.P.filter(P => P.city && S.owner[P.id] === 0); return {n:mine.length, coast:mine.filter(P => P.coast).length, inland:mine.filter(P => !P.coast).length}; });
    ok(setup.n >= 3 && setup.coast >= 1 && setup.inland >= 1, dev + ' setup ' + JSON.stringify(setup));
    await p.evaluate(() => window.__im.cp.render());
    await p.click('[data-act="cities-open"]'); await p.waitForSelector('.crow'); await p.waitForTimeout(300);
    const info = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, ids = im.cp.cities(), cap = S.nations[0].capital, A = ids.find(i => i !== cap && !G.P[i].coast) || ids.find(i => i !== cap);
      return {ids, A, cap, coastal:ids.filter(i => G.P[i].coast), inland:ids.filter(i => !G.P[i].coast)}; });
    const view = () => p.evaluate(() => { const v = window.__im.view; return JSON.stringify([v.x, v.y, v.s, window.__im.camFly ? 1 : 0]); });
    const A = info.A, sel0 = await p.evaluate(() => JSON.stringify(window.__im.sel)), v0 = await view();
    // 1. Build opens inline in the right row; nothing moves
    await p.click(`[data-act="cp-open"][data-kind="bld"][data-id="${A}"]`); await p.waitForTimeout(250);
    const o1 = await p.evaluate(A => { const w = document.querySelector(`.cw[data-id="${A}"]`), i = w && w.querySelector('#cpi'); return {inRow:!!i, opts:i ? i.querySelectorAll('.cpo').length : 0, hidden:document.getElementById('modal').hidden, text:i ? i.innerText.replace(/\s+/g, ' ') : '', n:document.querySelectorAll('#cpi').length}; }, A);
    ok(o1.inRow && o1.n === 1 && o1.opts === 7 && !o1.hidden, dev + ' inline build open ' + JSON.stringify(o1).slice(0, 200));
    ok(/Naval Yard/.test(o1.text) && /Already queued here/.test(o1.text), dev + ' build text');
    ok(await view() === v0 && await p.evaluate(() => JSON.stringify(window.__im.sel)) === sel0, dev + ' view or selection moved on open');
    if (dev === 'desk') await p.screenshot({path:__dirname + '/cp-inline-build.png'}).catch(() => {});
    // the Naval Yard shows its reason in an inland city
    const yardRow = await p.evaluate(() => { const r = document.querySelector('#cpi .cpo[data-bk="yard"]'); return r ? r.innerText.replace(/\s+/g, ' ') : ''; });
    ok(/No coast|\d+ d|h/.test(yardRow), dev + ' yard row ' + yardRow);
    // queue the Recruiting Office there (cheap, any city): same rules as the sheet, the row updates in place
    const before = await p.evaluate(A => JSON.stringify(window.__im.S.cons[A]), A);
    await p.click('#cpi .cpo[data-bk="rec"] [data-act="cp-build"]'); await p.waitForTimeout(250);
    const after = await p.evaluate(A => ({c:window.__im.S.cons[A], other:window.__im.S.cons.filter((c, i) => c && i !== A && window.__im.S.owner[i] === 0).length, rowTxt:document.querySelector(`.cw[data-id="${A}"] .crow`).innerText.replace(/\s+/g, ' '), still:!!document.querySelector(`.cw[data-id="${A}"] #cpi`), q:document.querySelector('#cpi .cpq').innerText.replace(/\s+/g, ' ')}), A);
    ok(before === 'null' && after.c && after.c.k === 'rec', dev + ' rec queued ' + JSON.stringify(after.c));
    ok(/Recruiting Office/.test(after.rowTxt) && after.still && /Recruiting Office/.test(after.q), dev + ' row/inline update ' + after.rowTxt.slice(0, 120));
    ok(after.other === 0, dev + ' queued in another city');
    // a second building is refused with the reason (busy), through aria-disabled + toast
    const busy = await p.evaluate(() => { const r = document.querySelector('#cpi .cpo[data-bk="fort"]'); return r ? r.innerText.replace(/\s+/g, ' ') : ''; });
    ok(/Busy building Recruiting Office/.test(busy), dev + ' busy reason: ' + busy);
    await p.evaluate(() => document.querySelector('#cpi .cpo[data-bk="fort"] [data-act="cp-build"]').click()); await p.waitForTimeout(200);
    ok(await p.evaluate(A => window.__im.S.cons[A].k, A) === 'rec', dev + ' refused build changed the queue');
    // 2. Escape closes the inline options, the panel stays; then Train
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => !document.querySelector('#cpi') && !document.getElementById('modal').hidden), dev + ' escape closes options only');
    await p.click(`[data-act="cp-open"][data-kind="trn"][data-id="${A}"]`); await p.waitForTimeout(250);
    // the Army Base rule (BLD-RULES): no Army Base in A, so infantry is greyed with "Needs Army Base level 1" (the Recruiting Office unlocks nothing)
    const nb = await p.evaluate(() => { const r = document.querySelector('#cpi .cpo[data-ut="inf"]'), b = r && r.querySelector('[data-act="cp-train"]');
      return {blk:!!r && r.classList.contains('blk'), dis:b && b.getAttribute('aria-disabled'), tip:b && b.title, note:r && (r.querySelector('.cpw') || {}).textContent, open:document.querySelectorAll('#cpi .cpo:not(.blk) [data-act="cp-train"]').length}; });
    ok(nb.blk && nb.dis === 'true' && nb.note === 'Needs Army Base level 1' && /Needs Army Base level 1/.test(nb.tip) && nb.open === 0, dev + ' infantry greyed without an Army Base ' + JSON.stringify(nb));
    if (dev === 'desk') await p.screenshot({path:__dirname + '/cp-inline-noab.png'}).catch(() => {});
    await p.evaluate(A => { window.__im.S.bld[A].fac = 1; }, A); await p.click(`[data-act="cp-open"][data-kind="trn"][data-id="${A}"]`); await p.click(`[data-act="cp-open"][data-kind="trn"][data-id="${A}"]`); await p.waitForTimeout(250);
    const tr = await p.evaluate(() => { const bs = [...document.querySelectorAll('#cpi .cpo:not(.blk) [data-act="cp-train"]')]; return {n:bs.length, t:bs[0] && bs[0].dataset.t, locked:document.querySelectorAll('#cpi details.cplock').length}; });
    ok(tr.n > 0 && tr.t, dev + ' no trainable unit ' + JSON.stringify(tr));
    const q0 = await p.evaluate(A => window.__im.S.queue[A].length, A);
    await p.focus(`#cpi [data-act="cp-train"][data-t="${tr.t}"]`); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    const q1 = await p.evaluate(A => window.__im.S.queue[A].map(i => i.t), A);
    ok(q1.length === q0 + 1 && q1[q1.length - 1] === tr.t, dev + ' train by keyboard ' + JSON.stringify(q1));
    ok(await p.evaluate(A => /left/.test(document.querySelector(`.cw[data-id="${A}"] #cpi .cpq`).innerText), A), dev + ' queued countdown');
    ok(await view() === v0 && await p.evaluate(() => JSON.stringify(window.__im.sel)) === sel0, dev + ' view or selection moved after queueing');
    if (dev === 'desk') await p.screenshot({path:__dirname + '/cp-inline-train.png'}).catch(() => {});
    // fill the queue: the other units show the full-queue reason
    await p.evaluate(A => { const im = window.__im; while (im.S.queue[A].length < 2) im.S.queue[A].push({t:im.S.queue[A][0].t, h:30, h0:30}); }, A); await p.click(`[data-act="cp-open"][data-kind="trn"][data-id="${A}"]`); await p.click(`[data-act="cp-open"][data-kind="trn"][data-id="${A}"]`); await p.waitForTimeout(200);
    ok(/Training queue full/.test(await p.evaluate(() => document.querySelector('#cpi').innerText)), dev + ' queue full reason');
    await p.evaluate(A => { window.__im.S.queue[A].length = 0; }, A);
    await p.keyboard.press('Escape');
    // 3. go to city moves the map and leaves the panel
    await p.evaluate(() => window.__im.cp.render()); await p.click(`.cw[data-id="${A}"] [data-act="goto"]`); await p.waitForTimeout(900);
    ok(await p.evaluate(() => document.getElementById('modal').hidden), dev + ' go-to keeps the panel open');
    ok(await view() !== v0, dev + ' go-to did not move the map');
    // 4. multi-select: select all, Naval Yard
    await p.evaluate(A => { const im = window.__im, S = im.S; for (const i of im.cp.cities()){ if (i !== A) S.cons[i] = null; S.queue[i].length = 0; } S.cons[A] = null; }, A);
    await p.click('[data-act="cities-open"]'); await p.waitForSelector('.crow'); await p.waitForTimeout(250);
    ok(await p.evaluate(() => !document.querySelector('.cpbarw')), dev + ' bar shown without a selection');
    await p.click('[data-act="cp-all"]'); await p.waitForTimeout(200);
    const n = info.ids.length, cnt = await p.evaluate(() => document.querySelector('.cpcount').innerText);
    ok(cnt === `${n} of ${n} selected`, dev + ' count ' + cnt);
    ok(await p.evaluate(() => document.querySelectorAll('.cw.sel').length) === n, dev + ' rows ticked');
    await p.click('[data-act="cp-bulk"][data-kind="bld"]'); await p.waitForTimeout(150);
    await p.click('[data-act="cp-pick"][data-k="yard"]'); await p.waitForTimeout(250);
    const pl = await p.evaluate(() => { const im = window.__im, cp = im.cp, S = im.S, G = im.G, ids = [...cp.CP.sel], P = cp.plan('bld', 'yard', cp.cities().filter(i => cp.CP.sel.has(i))), why = {};
      const sk = [...document.querySelectorAll('.cpplan .cplist.sk li, .cpplan .cplh.sk + .cplist li')].map(li => li.innerText.replace(/\s+/g, ' '));
      return {ok:P.ok.map(x => x.p), skip:P.skip.map(x => [x.p, x.why]), total:P.total, domOk:document.querySelectorAll('.cpplan .cplh.ok + .cplist li.ok').length, domSk:document.querySelectorAll('.cpplan .cplh.sk + .cplist li.sk').length, button:document.querySelector('.cpgo').innerText, coastal:cp.cities().filter(i => G.P[i].coast), sum:null, costs:P.ok.map(x => x.c)}; });
    ok(pl.ok.length === info.coastal.length && pl.ok.every(x => info.coastal.includes(x)), dev + ' will-queue = coastal ' + JSON.stringify([pl.ok, info.coastal]));
    ok(pl.skip.length === info.inland.length && pl.skip.every(([i, w]) => info.inland.includes(i) && /No coast/.test(w)), dev + ' skipped = inland, no coast ' + JSON.stringify(pl.skip));
    ok(pl.domOk === pl.ok.length && pl.domSk === pl.skip.length, dev + ' plan lists in the DOM ' + [pl.domOk, pl.domSk]);
    const sum = {}; for (const c of pl.costs) for (const k of Object.keys(c)) if (k !== 'h') sum[k] = (sum[k] || 0) + c[k];
    ok(Object.keys(sum).every(k => !(sum[k] > 0) || pl.total[k] === sum[k]) && Object.keys(pl.total).every(k => !(pl.total[k] > 0) || sum[k] === pl.total[k]), dev + ' total = sum ' + JSON.stringify([pl.total, sum]));
    ok(new RegExp('Queue Naval Yard in ' + pl.ok.length).test(pl.button), dev + ' button ' + pl.button);
    // selection survives re-sorting and a refresh
    await p.click('[data-act="cities-sort"][data-v="res"]'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => window.__im.cp.CP.sel.size) === n && await p.evaluate(() => document.querySelectorAll('.cw.sel').length) === n && await p.evaluate(() => !!document.querySelector('.cpplan')), dev + ' selection lost on sort');
    await p.click('[data-act="cities-sort"][data-v="city"]');
    if (dev === 'desk') await p.screenshot({path:__dirname + '/cp-multi.png'}).catch(() => {});
    // confirm: queued in the coastal ones only, resources paid, counts right
    const res0 = await p.evaluate(() => { const N = window.__im.S.nations[0]; return {...N}; });
    await p.click('[data-act="cp-confirm"]'); await p.waitForTimeout(300);
    const done = await p.evaluate(() => { const im = window.__im, S = im.S; return im.cp.cities().filter(i => S.cons[i] && S.cons[i].k === 'yard'); });
    ok(done.length === pl.ok.length && done.every(x => pl.ok.includes(x)), dev + ' queued in ' + JSON.stringify(done) + ' want ' + JSON.stringify(pl.ok));
    const paid = await p.evaluate(() => ({...window.__im.S.nations[0]}));
    ok(['cash', 'metal', 'iron', 'elec'].every(k => !(sum[k] > 0) || Math.abs((res0[k] - paid[k]) - sum[k]) < 1e-6), dev + ' paid != total ' + JSON.stringify([res0.cash - paid.cash, sum.cash]));
    // a second go: "already building it" for those, the rest still "no coast"
    await p.click('[data-act="cp-pick"][data-k="yard"]').catch(() => {}); await p.waitForTimeout(150);
    const second = await p.evaluate(() => { const im = window.__im, cp = im.cp, P = cp.plan('bld', 'yard', cp.cities()); return P.skip.map(x => x.why); });
    ok(second.filter(w => /Already building it/.test(w)).length === pl.ok.length && second.filter(w => /No coast/.test(w)).length === info.inland.length, dev + ' second plan ' + JSON.stringify(second));
    // 5. run out of resources: the stock buys two of them, the rest are skipped for resources, none stops the others from being reported
    const lim = await p.evaluate(() => { const im = window.__im, S = im.S, cp = im.cp, N = S.nations[0], ids = cp.cities();
      for (const i of ids) S.cons[i] = null; const c0 = cp.buildCost('fort', ids[0]), c1 = cp.buildCost('fort', ids[1]), keep = {...N};
      for (const k of ['cash', 'metal', 'iron', 'elec', 'rare', 'oil', 'mp']) N[k] = (c0[k] || 0) + (c1[k] || 0); const P = cp.plan('bld', 'fort', ids);
      Object.assign(N, keep); return {ok:P.ok.length, res:P.skip.filter(x => x.res).length, n:ids.length, why:(P.skip.find(x => x.res) || {}).why}; });
    ok(lim.ok === 2 && lim.res >= 1 && /Not enough resources/.test(lim.why || ''), dev + ' resource stop ' + JSON.stringify(lim));
    // 6. units in bulk: skipped for research / buildings / full queue with the reason
    await p.evaluate(() => { const im = window.__im, S = im.S, cp = im.cp, ids = cp.cities(); for (const i of ids) S.cons[i] = null; S.queue[ids[0]].push({t:'inf', h:20, h0:20}, {t:'inf', h:20, h0:20}); });
    const un = await p.evaluate(() => { const im = window.__im, cp = im.cp, ids = cp.cities(), t = cp.units().find(k => cp.trainWhy(ids[1], k) === '') || null; const P = t ? cp.plan('trn', t, ids) : null; return t ? {t, ok:P.ok.length, skip:P.skip.map(x => x.why)} : {t:null}; });
    ok(!un.t || (un.ok >= 1 && un.skip.some(w => /queue full/i.test(w))), dev + ' unit plan ' + JSON.stringify(un));
    // infantry in bulk: the cities without an Army Base are skipped with "Needs Army Base level 1"
    const ib = await p.evaluate(() => { const im = window.__im, S = im.S, cp = im.cp, ids = cp.cities(), P = cp.plan('trn', 'inf', ids); return {noab:ids.filter(i => !S.bld[i].fac).length, why:P.skip.filter(x => x.why === 'Needs Army Base level 1').length}; });
    ok(ib.noab >= 1 && ib.why === ib.noab, dev + ' bulk infantry skips the cities without an Army Base ' + JSON.stringify(ib));
    // 7. closing the panel clears the selection
    await p.keyboard.press('Escape'); await p.waitForTimeout(200); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => document.getElementById('modal').hidden && window.__im.cp.CP.sel.size === 0), dev + ' selection kept after close');
    // 8. layout fits: no sideways scroll, inline options inside the sheet
    await p.evaluate(() => { const S = window.__im.S; for (const i of window.__im.cp.cities()){ S.cons[i] = null; S.queue[i].length = 0; } });
    await p.click('[data-act="cities-open"]'); await p.waitForSelector('.crow'); await p.click(`[data-act="cp-open"][data-kind="trn"][data-id="${A}"]`); await p.waitForTimeout(300);
    const fit = await p.evaluate(() => { const sh = document.getElementById('sheet'), r = sh.getBoundingClientRect(), W = innerWidth; const wide = [...sh.querySelectorAll('*')].filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.right > r.right + 1 || b.left < r.left - 1) && !e.closest('svg') && getComputedStyle(e).position !== 'fixed'; }).slice(0, 4).map(e => e.className + ':' + Math.round(e.getBoundingClientRect().right)); return {sx:sh.scrollWidth - sh.clientWidth, docx:document.documentElement.scrollWidth - W, wide, tap:[...sh.querySelectorAll('.crow button, .crow input')].map(e => e.getBoundingClientRect()).filter(b => b.height < 32 && b.height > 0).length}; });
    ok(fit.sx <= 1 && fit.docx <= 1 && fit.wide.length === 0, dev + ' layout ' + JSON.stringify(fit));
    await p.click('[data-act="cp-all"]'); await p.click('[data-act="cp-bulk"][data-kind="trn"]'); await p.waitForTimeout(200);
    const fit2 = await p.evaluate(() => { const sh = document.getElementById('sheet'); return sh.scrollWidth - sh.clientWidth; }); ok(fit2 <= 1, dev + ' bar layout ' + fit2);
    await ctx.close(); }
  await b.close(); console.log(JSON.stringify({bad, errs})); process.exit(bad.length || errs.length ? 1 : 0); })();
