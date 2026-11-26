// The REBELS screens (owner points 8-11; docs/REBELS-PLAN.md section 6) on a desktop (1440 x 900) and a phone (440 px, dpr 2):
//  1. the city panel's morale factors list: morale, target, every modifier as the rules give it (rules/economy.js morFactors), the status and its
//     output, the rebels' chip and note; one column on the phone with only the factors that count, no sideways scroll at 440 px; the chip toggles it
//  2. Annex City: the gold card leading the building cards, the button with price and days, the BUILD panel's row, the Cities list's option; a
//     click starts it (the bar and the days left), the reason when it cannot
//  3. the fire on burning cities (fx.js drawCityFire): on at 33% or lower, out above; a foreign city only where the viewer sees it; the phone's
//     frame rate with 10 burning cities against none (3 times each way), the fire's own cost per frame, and no draws at all on a paused, untouched map
//  4. rebels: the crossed-rifles badge in a rising, a rebel-held city's badge, the Diplomacy war list; the dispatches; Incite revolt in the
//     Intelligence screen; the trade panel's lost route and the 25% shock; the help text
//   node .test/rebels2-screens.js [page.html]      (bash tools/mkpage.sh first)
const SC = require('./rebels2-scene.js');
const { chromium } = require('playwright');
const PAGE = process.argv[2] || __dirname + '/page.html';
const bad = [], errs = [], info = {}, ok = (c, m) => { if (!c) bad.push(m); };
// the phone's frame rate while the camera sways over 10 burning cities against none (3 times each way, 4 s each; a fresh game at peace, the map
// settled first), the fire's own time in each drawn frame (median; the clock's resolution is 0.1 ms), and the draws of a paused map left alone
async function perfPhone(b){ const ctx = await b.newContext({viewport:{width:440, height:900}, isMobile:true, hasTouch:true, deviceScaleFactor:2}), p = await ctx.newPage();
  p.on('pageerror', e => errs.push('perf: ' + e.message));
  await SC.start(p, 'Poland', PAGE);
  const c = await p.evaluate(() => window.__im.G.P.find(P => P.cityName === 'Łódź').id); await SC.camera(p, c, 22, 0.5);
  const ten = await p.evaluate(() => { const im = window.__im, G = im.G, S = im.S, R = document.getElementById('map').getBoundingClientRect(), out = [];
    for (const P of G.P){ if (!P.city || S.owner[P.id] !== 0) continue; const [x, y] = im.toScreen(P.x, P.y); if (x > 30 && y > 60 && x < R.width - 30 && y < R.height - 60) out.push(P.id); } return out.slice(0, 10); });
  const setFire = on => p.evaluate(({L, on}) => { const S = window.__im.S; for (const q of L) if (S.mor) S.mor[q] = on ? 28 : 70; }, {L:ten, on});
  const pan = () => p.evaluate(() => new Promise(res => { const im = window.__im, v = im.view, RD = im.rd, n0 = RD.n, t0 = performance.now(), x0 = v.x, ms = []; let ln = RD.n;
    const f = t => { v.x = x0 + 30*Math.sin((t - t0)/400); if (RD.n !== ln){ ln = RD.n; ms.push(im.cfx.M.CF ? im.cfx.M.CF.last || 0 : 0); } if (t - t0 < 4000) requestAnimationFrame(f); else { v.x = x0; ms.sort((a, b) => a - b); res({fps:+((RD.n - n0)*1000/(t - t0)).toFixed(1), ms:ms[ms.length >> 1] || 0, n:im.cfx.M.CF ? im.cfx.M.CF.n : -1}); } };
    requestAnimationFrame(f); }));
  // settle first
  await p.evaluate(() => new Promise(res => { const im = window.__im, t0 = performance.now(); const w = () => { if (im.mapBusy() && performance.now() - t0 < 45000) setTimeout(w, 250); else res(); }; w(); }));
  const R = {none:[], ten:[]}; for (let i = 0; i < 3; i++) for (const on of [false, true]){ await setFire(on); await p.waitForTimeout(1500); R[on ? 'ten' : 'none'].push(await pan()); }
  // idle: a key press, then nothing: draws counted for 4 s once the ambient motion rests
  const idle = async on => { await setFire(on); await p.keyboard.press('Shift'); return p.evaluate(() => new Promise(res => { const im = window.__im; const t0 = performance.now();
    const go = () => { const n0 = im.rd.n; im.rd.dbg = {}; setTimeout(() => { const d = im.rd.dbg; im.rd.dbg = null; res({draws:im.rd.n - n0, burning:im.cfx.M.CF ? im.cfx.M.CF.n : -1, why:d}); }, 4000); };
    const w = () => { if ((im.mapBusy() && performance.now() - t0 < 45000) || performance.now() - t0 < im.ambIdle() + 1500) setTimeout(w, 250); else go(); }; w(); })); };
  const avg = a => a.reduce((x, y) => x + y.fps, 0)/a.length, I0 = await idle(false), I1 = await idle(true);
  info.fps = {cities:ten.length, none:R.none.map(r => r.fps), ten:R.ten.map(r => r.fps), avgNone:+avg(R.none).toFixed(1), avgTen:+avg(R.ten).toFixed(1), fireMsMedian:R.ten.map(r => +r.ms.toFixed(2)), drawn:R.ten.map(r => r.n)};
  info.idle = {none:I0, ten:I1};
  ok(ten.length === 10 && R.ten.every(r => r.n >= 10), 'phone: 10 burning cities on screen ' + JSON.stringify(info.fps.drawn));
  ok(avg(R.ten) >= 0.85*avg(R.none), 'phone: panning over 10 burning cities keeps 85% of the frame rate ' + JSON.stringify(info.fps));
  ok(R.ten.every(r => r.ms <= 0.3), 'phone: the fire takes at most 0.3 ms a frame ' + JSON.stringify(info.fps.fireMsMedian));
  ok(I0.draws === 0 && I1.draws === 0 && I1.burning >= 10, 'phone: a paused map left alone draws nothing, burning or not ' + JSON.stringify(info.idle));
  await ctx.close(); }
(async () => { const b = await chromium.launch();
  for (const [dev, vp] of [['desk', {viewport:{width:1440, height:900}}], ['phone', {viewport:{width:440, height:900}, isMobile:true, hasTouch:true, deviceScaleFactor:2}]]){
    const ctx = await b.newContext(vp), p = await ctx.newPage(), phone = dev === 'phone';
    p.on('pageerror', e => errs.push(dev + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(dev + ' console: ' + m.text()); });
    await SC.start(p, 'Poland', PAGE);
    const s = await SC.city(p, {mor:28, inf:2, nb:38, cash:2000, mp:500, hour:26}); await p.waitForTimeout(400);
    // ---- 1. the factors list
    const F1 = await p.evaluate(c => { const F = morFactors(c), mf = document.getElementById('mf'), rows = [...document.querySelectorAll('#mf .mf-r')];
      const vis = rows.filter(r => getComputedStyle(r).display !== 'none'), num = t => +t.replace('−', '-').replace('+', '');
      const lb = vis[1] && getComputedStyle(vis[1].querySelector('.lb'));
      return {open:!!mf, txt:mf ? mf.innerText : '', rows:rows.length, vis:vis.length, nz:F.rows.filter(r => r.k === 'base' || Math.round(r.v) !== 0).length,
        vals:rows.map(r => [r.dataset.k, num(r.querySelector('.v').textContent)]), want:F.rows.map(r => [r.k, Math.round(r.v)]), T:Math.round(F.target), sh:F.shown, ch:F.chance, st:F.st,
        over:mf ? mf.scrollWidth - mf.clientWidth : -1, page:document.documentElement.scrollWidth - innerWidth, fs:lb ? parseFloat(lb.fontSize) : 0,
        status:document.querySelector('#csheet .cs-st').innerText, mob:(document.querySelector('#csheet .cs-mob small') || {}).innerText || '', chip:!!document.querySelector('#csheet .cs-mor.fire .mor-fire'),
        ax:(document.querySelector('#mf .mf-ax') || {}).innerText || '', k:annexCost(c)}; }, s.c);
    ok(F1.open, dev + ' the factors list opens by itself for an occupied city');
    ok(F1.rows === F1.want.length && JSON.stringify(F1.vals) === JSON.stringify(F1.want), dev + ' every modifier as the rules give it ' + JSON.stringify(F1.vals) + ' / ' + JSON.stringify(F1.want));
    ok(new RegExp(`Morale ${F1.sh}%[\\s\\S]*${F1.T}%`, 'i').test(F1.txt) && new RegExp(`Target ${F1.T}%`).test(F1.txt), dev + ' header and footer: morale and target');
    ok(F1.st === 'occ' && /Occupied City · 25% output/.test(F1.status) && /25% of its output, and no units can be mobilized/.test(F1.txt), dev + ' occupied status and what it means ' + F1.status);
    ok(/Occupied: annex the city to mobilize here/.test(F1.mob), dev + ' MOBILIZE UNIT gives the reason ' + F1.mob);
    ok(F1.chip && new RegExp(`Rebels ${Math.round(F1.ch*100)}%`, 'i').test(F1.txt) && /halved for each of your 2 units/.test(F1.txt), dev + ' burning: flame on the chip, the rebel chance and the troop rule');
    ok(new RegExp(`\\$${F1.k.cash}M · ${F1.k.mp}k · ${F1.k.days} d`).test(F1.ax), dev + ' Annex City button with its price and days ' + F1.ax);
    ok(phone ? F1.vis === F1.nz : F1.vis === F1.rows, dev + ` rows shown ${F1.vis} (all ${F1.rows}, not 0: ${F1.nz})`);
    ok(F1.over <= 1 && F1.page <= 1 && F1.fs >= 12, dev + ` readable: no sideways scroll (${F1.over}, page ${F1.page}), labels ${F1.fs}px`);
    // the chip closes and reopens it (remembered on the device)
    await p.click('#csheet .cs-mor.tog'); await p.waitForTimeout(200);
    const t1 = await p.evaluate(() => ({mf:!!document.getElementById('mf'), pref:localStorage.getItem('im-morale-factors')}));
    await p.click('#csheet .cs-mor.tog'); await p.waitForTimeout(200);
    ok(!t1.mf && /"a":false/.test(t1.pref) && await p.evaluate(() => !!document.getElementById('mf')), dev + ' the morale chip closes and reopens the list ' + JSON.stringify(t1));
    // a homeland city: the list starts closed, opens on a tap, says homeland and full output
    const home = await p.evaluate(() => { const im = window.__im, c = im.G.P.find(P => P.cityName === 'Poznań').id; im.selectProv(c); return c; }); await p.waitForTimeout(250);
    const H0 = await p.evaluate(() => !!document.getElementById('mf')); await p.click('#csheet .cs-mor.tog'); await p.waitForTimeout(200);
    const H1 = await p.evaluate(() => (document.getElementById('mf') || {}).innerText || '');
    ok(!H0 && /Homeland city/.test(H1) && /full output/.test(H1) && !/Annex city/i.test(H1), dev + ' homeland city: closed at first, then the list with full output');
    await p.click('#csheet .cs-mor.tog');
    // ---- 2. Annex City: the card, the build panel, the Cities list, the click
    await p.evaluate(c => window.__im.selectProv(c), s.c); await p.waitForTimeout(250);
    const A0 = await p.evaluate(() => { const c0 = document.querySelector('#csheet .cs-blds > *'); return {first:c0 && c0.classList.contains('annex'), tag:c0 ? c0.innerText : ''}; });
    ok(A0.first && /\$80M · 15k · 4 d/.test(A0.tag) && /ANNEX CITY/i.test(A0.tag), dev + ' the gold Annex City card leads the building cards ' + JSON.stringify(A0));
    await p.click('#csheet .cs-bldb'); await p.waitForTimeout(250);
    ok(await p.evaluate(() => !!document.querySelector('#sheet .bld.annex [data-act="annex"]') && /Annexed: 50% output/.test(document.querySelector('#sheet .bld.annex').innerText)), dev + ' the BUILD panel lists Annex City first');
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    await p.click('#csheet .cs-blds .cs-c.annex'); await p.waitForTimeout(300);
    const A1 = await p.evaluate(c => ({k:S.cons[c] && S.cons[c].k, run:(document.querySelector('#mf .mf-run') || {}).innerText || '', bar:!!document.querySelector('#mf .mf-run .cs-pb i'), card:!!document.querySelector('#csheet .cs-c.annex.busy .cs-cb'), bld:(document.querySelector('#csheet .cs-bldb small') || {}).innerText || ''}), s.c);
    ok(A1.k === 'annex' && /Annexing/i.test(A1.run) && /[34] d \d+ h left/.test(A1.run) && A1.bar && A1.card && /Annex City/.test(A1.bld), dev + ' a tap starts the annexing: bar and days left ' + JSON.stringify(A1));
    await p.evaluate(() => { for (let i = 0; i < 30; i++) tick(); }); await p.evaluate(() => window.__im.cp && window.__im.cp.render()); await p.waitForTimeout(250);
    ok(await p.evaluate(c => { const h = Math.ceil(S.cons[c].h); return new RegExp(`${Math.floor(h/24)} d ${h % 24} h left`).test((document.querySelector('#mf .mf-run') || {}).innerText || '') && h <= 96 - 30; }, s.c), dev + ' the bar counts down');
    // a second occupied city, no money: the reason, in the list and on the card
    const why = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, c = G.P.find(P => P.cityName === 'Nürnberg').id; for (const a of S.armies) if (a.at === c && !a.air) for (const k in a.u) a.u[k] = 0; removeEmpty(); capture(c, 0); S.nations[0].cash = 10; im.selectProv(c);
      return c; }); await p.waitForTimeout(250);
    const W = await p.evaluate(() => ({btn:(document.querySelector('#mf .mf-ax') || {}).getAttribute && document.querySelector('#mf .mf-ax').getAttribute('aria-disabled'), why:(document.querySelector('#mf .mf-why') || {}).innerText || '', card:!!document.querySelector('#csheet .cs-c.annex.blk')}));
    ok(W.btn === 'true' && /Needs \$80M/i.test(W.why) && W.card, dev + ' cannot annex: the reason ' + JSON.stringify(W));
    await p.evaluate(() => { window.__im.S.nations[0].cash = 2000; });
    // the Cities list: the option, the chips and the Morale sort
    await p.keyboard.press('Escape'); await p.evaluate(() => window.__im.selectProv(null)).catch(() => {});
    await p.evaluate(() => document.querySelector('[data-act="clear"]') && document.querySelector('[data-act="clear"]').click());
    if (await p.locator('[data-act="cities-open"]').count()) await p.click('[data-act="cities-open"]'); else await p.keyboard.press('c');
    await p.waitForTimeout(300); await p.click('[data-act="cities-sort"][data-v="mor"]'); await p.waitForTimeout(200);
    const CL = await p.evaluate(() => { const rows = [...document.querySelectorAll('#sheet .cw')]; return {n:rows.length, first:rows[0] ? rows[0].innerText.split('\n')[0] : '', fire:!!document.querySelector('#sheet .oc-chip.fire'), occ:/Occupied/.test(document.getElementById('sheet').innerText)}; });
    ok(CL.n > 0 && /Dresden|Nürnberg/.test(CL.first) && CL.fire && CL.occ, dev + ' Cities list: Morale sort puts the burning city first, flame and status chips ' + JSON.stringify(CL));
    // the chips are never cut: each shows its whole text inside its row (look review: "8" and "Occupie" on a phone, "R" and "Occ" on a desktop)
    const cut = await p.evaluate(() => [...document.querySelectorAll('#sheet .oc-chip')].filter(e => { const r = e.getBoundingClientRect(), row = e.closest('.cn') || e.parentElement, q = row.getBoundingClientRect();
      return e.scrollWidth > e.clientWidth + 1 || r.width < 30 || r.right > q.right + 0.5 || r.left < q.left - 0.5; }).map(e => e.textContent.trim()));
    ok(!cut.length && await p.evaluate(() => document.querySelectorAll('#sheet .oc-chip').length >= 2), dev + ' Cities list: no chip cut ' + JSON.stringify(cut));
    await p.click(`[data-act="cp-open"][data-kind="bld"][data-id="${why}"]`); await p.waitForTimeout(200);
    ok(await p.evaluate(() => !!document.querySelector('#cpi .cpo[data-bk="annex"]')), dev + ' Cities list: Annex City among the build options');
    await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    await p.evaluate(() => { localStorage.setItem('im-cities-sort', 'city'); });
    // ---- 3. the fire
    await p.evaluate(() => document.querySelector('[data-act="clear"]') && document.querySelector('[data-act="clear"]').click());
    await SC.camera(p, s.c, phone ? 22 : 30); await p.waitForTimeout(600);
    const st = () => p.evaluate(() => window.__im.cfx.stats().cf);
    const f0 = await st(); ok(f0.n >= 1 && f0.anim >= 1, dev + ' Dresden burns on the map ' + JSON.stringify(f0));
    await p.evaluate(c => { window.__im.S.mor[c] = 40; window.__im.S.mor[window.__im.G.P.find(P => P.cityName === 'Nürnberg').id] = 60; }, s.c); await p.waitForTimeout(2600);
    const f1 = await st(); ok(f1.n === 0 && f1.burning === 0, dev + ' above 33% the fire goes out ' + JSON.stringify(f1));
    await p.evaluate(c => { window.__im.S.mor[c] = 33; }, s.c); await p.waitForTimeout(300);
    const f2 = await st(); ok(f2.n === 1, dev + ' at 33% it burns again ' + JSON.stringify(f2));
    // a foreign burning city: drawn only where the viewer sees it (question 16)
    const fog = await p.evaluate(() => { const im = window.__im, M = im.cfx.M, S = im.S, G = im.G, B = G.P.find(P => P.cityName === 'Berlin').id; S.mor[B] = 20; const now = performance.now();
      M.drawCityFire(now, new Set(), new Map()); const hid = M.CF.n; M.drawCityFire(now, new Set([B]), new Map()); const seen = M.CF.n; S.mor[B] = 70; return {hid, seen}; });
    ok(fog.hid === 1 && fog.seen === 2, dev + ' a foreign city burns only where it is seen (own Dresden always) ' + JSON.stringify(fog));
    // frame rate while panning, 10 burning cities on screen against none, three times each way; the fire's own cost a frame
    if (phone){ /* the frame rate: a fresh, peaceful game below (perfPhone) */ }
    else { const ms = await p.evaluate(() => new Promise(res => { const im = window.__im, v = im.view, x0 = v.x, t0 = performance.now(), L = []; const f = t => { v.x = x0 + 20*Math.sin((t - t0)/300); if (im.rd.n !== L.ln){ L.ln = im.rd.n; L.push(im.cfx.M.CF.last || 0); } if (t - t0 < 1500) requestAnimationFrame(f); else { v.x = x0; L.sort((a, b) => a - b); res(L[L.length >> 1] || 0); } }; requestAnimationFrame(f); }));
      info.deskFireMs = +ms.toFixed(3); ok(ms < 1, dev + ' fire cost per frame under 1 ms ' + ms); }
    // ---- 4. rebels: a rising, the badge, the war list, the dispatches; a rebel-held city
    const R4 = await p.evaluate(c => { const im = window.__im, S = im.S, n0 = S.log.length; S.mor[c] = 20; window.__rbOn = 1; window.__rbdbg = []; rebelRise(c, 0);
      return {msg:S.log.slice(0, S.log.length - n0).map(e => e.text).join(' | '), reb:!!rebelsAt(c), war:warList(0).rebels}; }, s.c);
    ok(/Rebels rose up in Dresden \(4 units\)! Your 2 units there are fighting them/.test(R4.msg) && R4.reb && R4.war === 'Rebels', dev + ' rising: the dispatch, rebels in the city, in the war list ' + JSON.stringify(R4));
    await SC.camera(p, s.c, 40); await p.waitForTimeout(800);
    ok(await p.evaluate(() => (window.__rbdbg || []).some(e => e.icon === 'reb')), dev + ' the rebels\' crossed-rifles badge is drawn');
    await p.evaluate(c => window.__im.selectProv(c), s.c); await p.waitForTimeout(250);
    ok(await p.evaluate(() => /Rebels\s*in the city/i.test((document.getElementById('mf') || {}).innerText || '') && /fighting them, dug in/.test(document.getElementById('mf').innerText)), dev + ' the factors list says rebels hold out and the troops fight them');
    ok(await p.evaluate(() => { const b = window.__im.uicon.rband(60, 20), g = b.getContext('2d').getImageData(0, 0, b.width, b.height).data; let w = 0; for (let i = 0; i < g.length; i += 4) if (g[i] > 230 && g[i + 1] > 230 && g[i + 2] > 230) w++; return w > 20; }), dev + ' the badge band has the white crossed rifles');
    // an empty homeland city: rebels take it at once, it is independent, its garrison shows the badge
    const W4 = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, w = G.P.find(P => P.cityName === 'Wrocław').id, n0 = S.log.length; for (const a of S.armies) if (a.at === w && !a.air) for (const k in a.u) a.u[k] = 0; removeEmpty(); S.mor[w] = 15; rebelRise(w, 0);
      im.selectProv(w); return {w, owner:S.owner[w], msg:S.log.slice(0, S.log.length - n0).map(e => e.text).join(' | ')}; }); await p.waitForTimeout(300);
    ok(W4.owner === -1 && /took the empty city\. It is independent now/.test(W4.msg) && await p.evaluate(() => /held by rebels/.test(document.querySelector('#csheet .cs-st').innerText)), dev + ' a city lost to rebels: dispatch and status ' + JSON.stringify(W4));
    // the annexing lost with a city: Dresden's troops destroyed, the city goes over
    const L4 = await p.evaluate(c => { const S = window.__im.S, n0 = S.log.length; for (const a of S.armies) if (a.at === c && a.owner === 0) for (const k in a.u) a.u[k] = 0; removeEmpty(); tick(); tick(); return {owner:S.owner[c], msg:S.log.slice(0, S.log.length - n0).map(e => e.text).join(' | ')}; }, s.c);
    ok(L4.owner !== 0 && /destroyed your garrison and took Dresden/.test(L4.msg) && /annexing of Dresden was lost/.test(L4.msg), dev + ' rebels beat the garrison: city and annexing lost ' + JSON.stringify(L4));
    // ---- Incite revolt in the Intelligence screen (an occupied city of another nation only), the trade panel, the help
    const I4 = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, DE = S.nations.findIndex(N => N.name === 'Germany'), h = G.P.find(P => P.cityName === 'Hamburg').id, m = G.P.find(P => P.cityName === 'Munich').id;
      S.owner[m] = S.nations.findIndex(N => N.name === 'France'); trainAgent(0); im.selectProv(h); return {h, m}; }); await p.waitForTimeout(200);
    await p.evaluate(() => document.querySelector('#csheet [data-act="intel"]').click()); await p.waitForTimeout(250);
    const I5 = await p.evaluate(() => { const r = [...document.querySelectorAll('#sheet .irow')].find(x => /Incite revolt/.test(x.innerText)); return r ? {txt:r.innerText, dis:r.querySelector('button') && r.querySelector('button').disabled} : null; });
    ok(I5 && I5.dis && /Only an occupied city can be incited/.test(I5.txt), dev + ' Intel: Incite revolt refused on a homeland city, with the reason ' + JSON.stringify(I5));
    await p.keyboard.press('Escape'); await p.evaluate(m => window.__im.selectProv(m), I4.m); await p.waitForTimeout(150);
    await p.evaluate(() => document.querySelector('#csheet [data-act="intel"]').click()); await p.waitForTimeout(250);
    const I6 = await p.evaluate(() => { const r = [...document.querySelectorAll('#sheet .irow')].find(x => /Incite revolt/.test(x.innerText)); return r ? {txt:r.innerText, dis:r.querySelector('button') && r.querySelector('button').disabled} : null; });
    ok(I6 && I6.dis === false, dev + ' Intel: Incite revolt offered on a city France occupies ' + JSON.stringify(I6));
    await p.keyboard.press('Escape');
    const T4 = await p.evaluate(() => { const S = window.__im.S; S.trade.lost = S.trade.lost || {}; const DE = S.nations.findIndex(N => N.name === 'Germany'); S.trade.lost['x:' + DE] = {a:0, b:DE, kind:'land', h:30, va:{cash:5.8, k:'metal', q:1300}, vb:{cash:5.8, k:'metal', q:1300}};
      const n = window.__im.G.P.find(P => P.cityName === 'Nürnberg').id; return {shock:!!tradeIncome(0).shock, own:S.owner[n]}; });
    await p.evaluate(() => document.querySelector('[data-act="clear"]') && document.querySelector('[data-act="clear"]').click());
    await p.evaluate(() => document.querySelector('[data-act="diplo-open"]') ? document.querySelector('[data-act="diplo-open"]').click() : null); await p.waitForTimeout(300);
    if (!await p.evaluate(() => !!document.querySelector('#sheet [data-act="dp-tab"]'))){ await p.keyboard.press('d'); await p.waitForTimeout(300); }
    if (await p.locator('[data-act="dp-tab"][data-k="msg"]').count()){ await p.click('[data-act="dp-tab"][data-k="msg"]'); await p.waitForTimeout(250); }
    if (await p.evaluate(() => !!document.querySelector('.dp-routes:not(.open) [data-act="dp-routes"]'))){ await p.click('[data-act="dp-routes"]'); await p.waitForTimeout(250); }
    const T5 = await p.evaluate(() => { const r = document.querySelector('.dp-routes'); return r ? r.innerText : ''; });
    ok(/Lost: Germany/.test(T5) && /−\$5\.8M/.test(T5) && (!T4.shock || /partners wary/.test(T5)), dev + ' trade panel: the lost route and the shock ' + JSON.stringify(T4) + ' ' + T5.slice(0, 200).replace(/\n/g, ' / '));
    await p.keyboard.press('Escape');
    ok(await p.evaluate(() => /Tap the morale chip/.test(document.documentElement.innerHTML) && /crossed rifles/.test(document.documentElement.innerHTML)), dev + ' help text');
    await ctx.close(); }
  await perfPhone(b);
  await b.close();
  console.log(JSON.stringify({bad, errs, info}, null, 1)); process.exit(bad.length || errs.length ? 1 : 0); })();
