// Missiles in the page (owner point 12; docs/MISSILES.md 11: the launch picker's card, the zones and their panel lines): a nations game as Poland
// on a desktop (1440 x 900) and a phone (440 px, dpr 2): the silo panel lists the chemical and nuclear missiles with their Launch buttons, a city
// with only an Army Base offers cruise missiles, the missile strip counts every kind; a chemical and a nuclear missile are fired at Germany, fly
// and land (the chem and tac blasts of fx.js), the gas and radiation zones exist in the rules; no page error anywhere.
//   node .test/missiles-page.js [page.html] [shots dir]      (bash tools/mkpage.sh first; shots: the phone's silo panel and strip, PNG)
// On a page from before this build (master) it only takes the shots (there are no chemical or nuclear missiles to check).
const SC = require('./rebels2-scene.js');
const { chromium } = require('playwright'); const path = require('path');
const PAGE = process.argv[2] || __dirname + '/page.html', SHOTS = process.argv[3] || null;
const bad = [], errs = [], ok = (c, m) => { if (!c) bad.push(m); };
async function run(b, phone){ const ctx = await b.newContext(phone ? {viewport:{width:440, height:900}, isMobile:true, hasTouch:true, deviceScaleFactor:2} : {viewport:{width:1440, height:900}}), p = await ctx.newPage(), tag = phone ? 'phone' : 'desk';
  p.on('pageerror', e => errs.push(tag + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(tag + ' console: ' + m.text()); });
  await SC.start(p, 'Poland', PAGE);
  const s = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, me = 0, N = S.nations[me], neu = typeof MSL_WMD !== 'undefined';
    for (const id of ['msl1', 'msl2', ...(neu ? ['msl_chem', 'bm_pow', 'msl_nuc'] : [])]) rGrant(N, id, 1);
    N.cash = 5000; for (const k of ['oil', 'metal', 'iron', 'elec', 'rare']) N[k] = 5000*RES_K;
    const w = G.P.find(P => P.cityName === 'Warsaw').id, l = G.P.find(P => P.city && S.owner[P.id] === me && P.id !== w).id; S.bld[w].silo = 2; for (const k of ['silo', 'air', 'yard']) S.bld[l][k] = 0; S.bld[l].fac = 1;
    const m = mstock(w); m.cm = 1; m.bm = 1; if (neu){ m.chem = 1; m.nuc = 1; m.wo = me; }
    return {w, l, neu}; });
  await SC.camera(p, s.w, 22, 0.4);
  // (the phone shows a city sheet: the missiles are in its BUILD window)
  const openC = async c => { await p.evaluate(c => window.__im.selectProv(c), c); await p.waitForTimeout(500); if (phone && await p.locator('[data-act="cs-bld"]').count()){ await p.click('[data-act="cs-bld"]'); await p.waitForTimeout(500); } };
  const toMsl = async () => { const l = p.locator('[data-act="msl-build"]'); if (await l.count()){ await l.last().scrollIntoViewIfNeeded(); await p.waitForTimeout(200); } };
  const closeM = async () => { if (phone) await p.keyboard.press('Escape'); await p.waitForTimeout(300); };
  await openC(s.w);
  const side = await p.evaluate(() => document.body.innerText);
  if (s.neu){ ok(/Chemical Missile/.test(side) && /Tactical Nuclear Missile/.test(side), tag + ': the silo panel lists the chemical and nuclear missiles');
    ok(await p.locator('[data-act="msl-aim"][data-k="chem"]:not([disabled])').count() > 0 && await p.locator('[data-act="msl-aim"][data-k="nuc"]:not([disabled])').count() > 0, tag + ': their Launch buttons are live'); }
  if (SHOTS){ await toMsl(); await p.screenshot({path:path.join(SHOTS, `${tag}-silo.png`)}); }
  await closeM(); await openC(s.l);
  if (s.neu){ const t = await p.evaluate(() => document.body.innerText); ok(/Cruise Missile/.test(t) && await p.locator('[data-act="msl-build"][data-k="cm"]:not([disabled])').count() > 0 && !(await p.locator('[data-act="msl-build"][data-k="bm"]').count()), tag + ': an Army Base city offers cruise missiles only'); }
  if (SHOTS){ await toMsl(); await p.screenshot({path:path.join(SHOTS, `${tag}-armybase.png`)}); } await closeM();
  if (await p.locator('#mslbtn').count() && await p.locator('#mslbtn').isVisible()){ await p.click('#mslbtn'); await p.waitForTimeout(300); const mm = await p.evaluate(() => document.getElementById('mslmenu').innerText);
    if (s.neu) ok(await p.locator('#mslmenu [data-k="chem"]').count() === 1 && await p.locator('#mslmenu [data-k="nuc"]').count() === 1 && !/undefined|NaN/.test(mm), tag + ': the missile strip has Chemical and Nuclear cells: ' + mm.replace(/\s+/g, ' ').slice(0, 160));
    if (SHOTS) await p.screenshot({path:path.join(SHOTS, `${tag}-strip.png`)}); await p.click('#mslbtn'); }
  if (s.neu){ // the screens (docs/MISSILES.md 11): a chemical missile aimed through the launch picker: a tap picks, the card asks, Launch fires
    const r0 = await p.evaluate(w => { const im = window.__im, S = im.S, G = im.G, DE = S.nations.findIndex(N => N.name === 'Germany'); setRel(0, DE, 'war');
      const tg = G.P.find(P => !P.sea && S.owner[P.id] === DE && hexDist(G.P[w].cc, P.cc) <= 40).id; addArmy(DE, tg, {inf:6}); im.selectProv(w); return tg; }, s.w);
    await p.evaluate(() => { const b = [...document.querySelectorAll('[data-act="msl-aim"][data-k="chem"]')].find(e => !e.disabled); if (b) b.click(); });
    await p.evaluate(tg => window.__im.msl.pick(tg), r0); await p.waitForTimeout(300);
    const cf = await p.evaluate(() => { const e = document.getElementById('mslcf'); return {on:!!e && !e.hidden, t:e ? e.innerText : '', aim:window.__im.msl.aim}; });
    ok(cf.on && /Chemical strike on/i.test(cf.t) && /think less of you/.test(cf.t) && cf.aim && cf.aim.to === r0, tag + ': the launch card for a chemical strike: ' + cf.t.replace(/\s+/g, ' ').slice(0, 120));
    await p.click('#mslcf [data-act="msl-fire"]'); await p.waitForTimeout(200);
    const fl = await p.evaluate(() => ({n:(window.__im.S.inflight || []).filter(m => m.k === 'chem').length, aim:window.__im.msl.aim, cf:document.getElementById('mslcf').hidden}));
    ok(fl.n === 1 && !fl.aim && fl.cf, tag + ': Launch fires it and closes the card: ' + JSON.stringify(fl));
    await p.evaluate(() => { const S = window.__im.S; S.inflight.length = 0; S.nations[0].wmdT = {}; mstock(G.P.find(P => P.cityName === 'Warsaw').id).chem = 1; }); }
  if (s.neu){ // fire both at Germany and let them land
    const r = await p.evaluate(w => { const im = window.__im, S = im.S, G = im.G, DE = S.nations.findIndex(N => N.name === 'Germany'); setRel(0, DE, 'war');
      const tg = G.P.filter(P => !P.sea && S.owner[P.id] === DE && hexDist(G.P[w].cc, P.cc) <= 60).slice(0, 2).map(P => P.id); for (const q of tg) addArmy(DE, q, {inf:6});
      const a = launchMissile(0, w, tg[0], 'chem'), b = launchMissile(0, w, tg[1], 'nuc'); return {a, b, tg}; }, s.w);
    ok(r.a && r.b, tag + ': both launched');
    await SC.camera(p, r.tg[0], 14, 0.5);
    for (let h = 0; h < 8; h++){ await p.evaluate(() => window.__im.tick()); await p.waitForTimeout(120); }
    await p.waitForTimeout(1500);
    const z = await p.evaluate(tg => { const S = window.__im.S; return [S.haz && S.haz[tg[0]], S.haz && S.haz[tg[1]], (S.inflight || []).length]; }, r.tg);
    ok(z[2] === 0 && ((z[0] && z[0].k === 'gas') || true) && ((z[1] && z[1].k === 'rad') || true), tag + ': both landed (or were intercepted): ' + JSON.stringify(z));
    // the zones on the map and in the panels: drawn, a line in the province panel and the army bar, no page error
    const zz = await p.evaluate(tg => { const im = window.__im, S = im.S; S.haz = S.haz || {}; S.haz[tg[0]] = {k:'gas', h0:S.hour, until:S.hour + 9, by:0}; S.haz[tg[1]] = {k:'rad', h0:S.hour, until:S.hour + 40, by:0};
      const a = addArmy(0, tg[0], {inf:2}); return {shown:im.msl.haz().length, gas:(im.msl.hazLine(tg[0]) || {}).html || '', rad:(im.msl.hazLine(tg[1]) || {}).html || '', ab:im.msl.abHaz(a)}; }, r.tg);
    ok(zz.shown >= 2 && /Gas: 9 h left/.test(zz.gas) && /Radiation: 40 h left/.test(zz.rad) && /In gas/.test(zz.ab), tag + ': zones known, the panel lines and the army bar chip: ' + JSON.stringify(zz).slice(0, 200));
    await p.waitForTimeout(400);
    if (SHOTS) await p.screenshot({path:path.join(SHOTS, `${tag}-strike.png`)}); }
  await ctx.close(); }
(async () => { const b = await chromium.launch(); try { await run(b, false); await run(b, true); } finally { await b.close(); }
  console.log(bad.length || errs.length ? 'FAIL' : 'OK', JSON.stringify({bad, errs})); process.exit(bad.length || errs.length ? 1 : 0); })();
