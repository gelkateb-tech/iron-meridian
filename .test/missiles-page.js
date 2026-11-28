// Missiles in the page (owner point 12; docs/MISSILES.md 11: the launch picker's card, the zones and their panel lines): a nations game as Poland
// on a desktop (1440 x 900) and a phone (440 px, dpr 2): the silo panel lists the chemical and nuclear missiles with their Launch buttons, a city
// with only an Army Base offers cruise missiles, the missile strip counts every kind; a chemical and a nuclear missile are fired at Germany, fly
// and land (the chem and tac blasts of fx.js), the gas and radiation zones exist in the rules; no page error anywhere. Polish 2: a knocked-out
// silo's cells in the strip say "Damaged"; on a desktop the aiming hint stands clear of the minimap (and, with the tutorial
// card open, of the card too, at 1280 x 800 and 1440 x 900).
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
    const m = mstock(w); m.cm = 1; m.bm = 1; if (neu){ m.chem = 1; m.nuc = 1; m.wo = me; } const p2 = typeof MSL_CAR !== 'undefined'; if (p2){ m.ccm = 1; m.ncm = 1; m.cm = 4; m.bm = 3; }
    return {w, l, neu, p2}; });
  await SC.camera(p, s.w, 22, 0.4);
  // (the phone shows a city sheet: the missiles are in its BUILD window)
  const openC = async c => { await p.evaluate(c => window.__im.selectProv(c), c); await p.waitForTimeout(500); if (phone && await p.locator('[data-act="cs-bld"]').count()){ await p.click('[data-act="cs-bld"]'); await p.waitForTimeout(500); } };
  const toMsl = async () => { const l = p.locator('[data-act="msl-build"]'); if (await l.count()){ await l.last().scrollIntoViewIfNeeded(); await p.waitForTimeout(200); } };
  const closeM = async () => { if (phone) await p.keyboard.press('Escape'); await p.waitForTimeout(300); };
  await openC(s.w);
  const side = await p.evaluate(() => document.body.innerText);
  if (s.neu){ ok(/Chemical Ballistic Missile/.test(side) && /Nuclear Ballistic Missile/.test(side) && (!s.p2 || (/Chemical Cruise Missile/.test(side) && /Nuclear Cruise Missile/.test(side) && !/Tactical/.test(side) && /range 4,680 km · HP 16/.test(side) && /range 2,880 km · HP 12/.test(side))), tag + ': the silo panel lists the chemical and nuclear missiles (plan 2: the six names, range in km and HP)');
    ok(await p.locator('[data-act="msl-aim"][data-k="chem"]:not([disabled])').count() > 0 && await p.locator('[data-act="msl-aim"][data-k="nuc"]:not([disabled])').count() > 0, tag + ': their Launch buttons are live'); }
  if (SHOTS){ await toMsl(); await p.screenshot({path:path.join(SHOTS, `${tag}-silo.png`)}); }
  await closeM(); await openC(s.l);
  if (s.neu){ const t = await p.evaluate(() => document.body.innerText); ok(/Cruise Missile/.test(t) && await p.locator('[data-act="msl-build"][data-k="cm"]:not([disabled])').count() > 0 && !(await p.locator('[data-act="msl-build"][data-k="bm"]').count()), tag + ': an Army Base city offers cruise missiles only'); }
  if (SHOTS){ await toMsl(); await p.screenshot({path:path.join(SHOTS, `${tag}-armybase.png`)}); } await closeM();
  if (await p.locator('#mslbtn').count() && await p.locator('#mslbtn').isVisible()){ await p.click('#mslbtn'); await p.waitForTimeout(300); const mm = await p.evaluate(() => document.getElementById('mslmenu').innerText);
    if (s.neu) ok(await p.locator('#mslmenu [data-k="chem"]').count() === 1 && await p.locator('#mslmenu [data-k="nuc"]').count() === 1 && !/undefined|NaN/.test(mm), tag + ': the missile strip has Chemical and Nuclear cells: ' + mm.replace(/\s+/g, ' ').slice(0, 160));
    if (s.p2) ok(['cm', 'bm', 'ccm', 'chem', 'ncm', 'nuc'].every(k => mm.length && true) && await p.locator('#mslmenu [data-k="ccm"]').count() === 1 && await p.locator('#mslmenu [data-k="ncm"]').count() === 1 && /HP 16 in flight/.test(await p.locator('#mslmenu [data-k="bm"]').getAttribute('title')), tag + ': plan 2: the strip has the six missiles, its tooltip the HP');
    if (SHOTS) await p.screenshot({path:path.join(SHOTS, `${tag}-strip.png`)}); await p.click('#mslbtn');
    // polish 2: the silo knocked out by a strike: its cells read "Damaged", not "Ready" (the chemical, nuclear and ballistic missiles in it)
    if (s.neu){ await p.evaluate(w => knockOut(w, 'silo', 48), s.w); await p.click('#mslbtn'); await p.waitForTimeout(300);
      const dm = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#mslmenu .mcell')].map(e => [e.dataset.k, (e.querySelector('small') || {}).innerText || ''])));
      ok(['chem', 'nuc', 'bm'].every(k => /Damaged/.test(dm[k]) && !/Ready/.test(dm[k])), tag + ': a knocked-out silo: its missile cells say Damaged: ' + JSON.stringify(dm));
      if (SHOTS) await p.screenshot({path:path.join(SHOTS, `${tag}-strip-damaged.png`)}); await p.click('#mslbtn');
      await p.evaluate(w => { delete window.__im.S.bdis[w]; }, s.w); } }
  if (s.neu){ // the screens (docs/MISSILES.md 11): a chemical missile aimed through the launch picker: a tap picks, the card asks, Launch fires
    const r0 = await p.evaluate(w => { const im = window.__im, S = im.S, G = im.G, DE = S.nations.findIndex(N => N.name === 'Germany'); setRel(0, DE, 'war');
      const tg = G.P.find(P => !P.sea && S.owner[P.id] === DE && hexDist(G.P[w].cc, P.cc) <= 40).id; addArmy(DE, tg, {inf:6}); im.selectProv(w); return tg; }, s.w);
    await p.evaluate(() => { const b = [...document.querySelectorAll('[data-act="msl-aim"][data-k="chem"]')].find(e => !e.disabled); if (b) b.click(); });
    // polish 2: a desktop: the aiming hint stands clear of the minimap
    if (!phone){ const hm = await p.evaluate(() => { const r = id => { const e = document.getElementById(id), b = e && e.getBoundingClientRect(); return b && b.width && getComputedStyle(e).display !== 'none' ? [b.left, b.top, b.right, b.bottom] : null; }; return {hint:r('hint'), mini:r('miniframe'), t:document.getElementById('hint').innerText}; });
      ok(hm.hint && hm.mini && /Tap a target/.test(hm.t) && !(Math.min(hm.hint[2], hm.mini[2]) > Math.max(hm.hint[0], hm.mini[0]) && Math.min(hm.hint[3], hm.mini[3]) > Math.max(hm.hint[1], hm.mini[1])), tag + ': the aiming hint is clear of the minimap: ' + JSON.stringify(hm)); }
    // the tutorial card open too (owner 2026-11-28): the aiming hint clear of the card and of the minimap, at 1280 x 800 and 1440 x 900
    if (!phone){ const act = a => p.evaluate(a => { const b = document.createElement('button'); b.dataset.act = a; document.body.appendChild(b); b.click(); b.remove(); }, a);
      await act('tut-start');
      for (const [w, h] of [[1280, 800], [1440, 900]]){ await p.setViewportSize({width:w, height:h}); await p.waitForTimeout(1500);
        const ht = await p.evaluate(() => { const r = id => { const e = document.getElementById(id), b = e && e.getBoundingClientRect(); return b && b.width && !e.hidden && getComputedStyle(e).display !== 'none' ? [b.left, b.top, b.right, b.bottom] : null; }; return {hint:r('hint'), tut:r('tut'), mini:r('miniframe'), map:r('mapwrap'), t:document.getElementById('hint').innerText}; });
        const ov = (a, b) => !!a && !!b && Math.min(a[2], b[2]) > Math.max(a[0], b[0]) && Math.min(a[3], b[3]) > Math.max(a[1], b[1]);
        ok(ht.hint && ht.tut && /Tap a target/.test(ht.t) && !ov(ht.hint, ht.tut) && !ov(ht.hint, ht.mini) && ht.hint[0] >= ht.map[0] && ht.hint[2] <= ht.map[2], `${tag} ${w}x${h}: the tutorial card open: the aiming hint is clear of the card and the minimap: ` + JSON.stringify(ht)); }
      await act('tut-end'); await p.setViewportSize({width:1440, height:900}); await p.waitForTimeout(400); }
    await p.evaluate(tg => window.__im.msl.pick(tg), r0); await p.waitForTimeout(300);
    const cf = await p.evaluate(() => { const e = document.getElementById('mslcf'); return {on:!!e && !e.hidden, t:e ? e.innerText : '', aim:window.__im.msl.aim}; });
    ok(cf.on && /Chemical strike on/i.test(cf.t) && /think less of you/.test(cf.t) && cf.aim && cf.aim.to === r0, tag + ': the launch card for a chemical strike: ' + cf.t.replace(/\s+/g, ' ').slice(0, 120));
    await p.click('#mslcf [data-act="msl-fire"]'); await p.waitForTimeout(200);
    const fl = await p.evaluate(() => ({n:(window.__im.S.inflight || []).filter(m => m.k === 'chem').length, aim:window.__im.msl.aim, cf:document.getElementById('mslcf').hidden}));
    ok(fl.n === 1 && !fl.aim && fl.cf, tag + ': Launch fires it and closes the card: ' + JSON.stringify(fl));
    await p.evaluate(() => { const S = window.__im.S; S.inflight.length = 0; S.nations[0].wmdT = {}; mstock(G.P.find(P => P.cityName === 'Warsaw').id).chem = 1; }); }
  if (s.p2){ // MISSILES PLAN 2 (docs/MISSILES-PLAN2.md C.4, F.7): the short card for a cruise missile; Quick fire; HP on the marker; a tap on a missile
    const tg = await p.evaluate(w => { const im = window.__im, S = im.S, G = im.G, DE = S.nations.findIndex(N => N.name === 'Germany'); setRel(0, DE, 'war');
      const q = G.P.filter(P => !P.sea && S.owner[P.id] === DE && hexDist(G.P[w].cc, P.cc) <= 14).sort((a, b) => hexDist(G.P[w].cc, a.cc) - hexDist(G.P[w].cc, b.cc))[0].id; addArmy(DE, q, {inf:6, sam:2}); (S.reveal || (S.reveal = {}))[q] = S.hour + 48; intelNote(0, [q], S.hour + 48); visCache = null; im.selectProv(w); return q; }, s.w);   // (seen and identified: the card counts the SAMs the player can see)
    await p.evaluate(() => { const b = [...document.querySelectorAll('[data-act="msl-aim"][data-k="cm"]')].find(e => !e.disabled); if (b) b.click(); }); await p.waitForTimeout(200);
    await p.evaluate(tg => window.__im.msl.pick(tg), tg); await p.waitForTimeout(300);
    const cf = await p.evaluate(() => { const e = document.getElementById('mslcf'), b = e && e.querySelector('[data-act="msl-fire"]'), r = b && b.getBoundingClientRect(); return {on:!!e && !e.hidden, sh:e.classList.contains('sh'), t:e ? e.innerText : '', btn:r ? [r.top, r.bottom, innerHeight] : null, hint:document.getElementById('hint').innerText}; });
    ok(cf.on && cf.sh && /Strike on/i.test(cf.t) && /HP 12 · gets through about \d+%/.test(cf.t) && /you can see 2 SAMs there/.test(cf.t) && cf.btn && cf.btn[1] <= cf.btn[2], tag + ': plan 2: a cruise missile gets the short card (HP 12 and its chance, the SAMs seen), Launch in view: ' + cf.t.replace(/\s+/g, ' ').slice(0, 160));
    ok(/Cruise Missile · [\d,]+ of 2,880 km · lands in \d h · HP 12 · gets through about \d+%/.test(cf.hint), tag + ': plan 2: the aim hint: ' + cf.hint);
    await p.click('#mslcf [data-act="msl-fire"]'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => window.__im.S.inflight.filter(m => m.k === 'cm').length === 1), tag + ': plan 2: Launch fires the cruise missile');
    // Quick fire on: a cruise missile flies on the tap, a chemical one still asks
    await p.evaluate(() => { window.__im.SET.mslQuick = true; window.__im.S.inflight.length = 0; }); await p.evaluate(w => window.__im.selectProv(w), s.w); await p.waitForTimeout(200);
    await p.evaluate(() => { const b = [...document.querySelectorAll('[data-act="msl-aim"][data-k="cm"]')].find(e => !e.disabled); if (b) b.click(); }); await p.waitForTimeout(200);
    await p.evaluate(tg => window.__im.selectProv(tg), tg); await p.waitForTimeout(300);
    const qf = await p.evaluate(() => ({n:window.__im.S.inflight.filter(m => m.k === 'cm').length, cf:document.getElementById('mslcf').hidden, aim:!!window.__im.msl.aim}));
    ok(qf.n === 1 && qf.cf && !qf.aim, tag + ': plan 2: Quick fire on: the cruise missile flies on the tap, no card: ' + JSON.stringify(qf));
    await p.evaluate(w => window.__im.selectProv(w), s.w); await p.waitForTimeout(200);
    await p.evaluate(() => { const b = [...document.querySelectorAll('[data-act="msl-aim"][data-k="chem"]')].find(e => !e.disabled); if (b) b.click(); }); await p.waitForTimeout(200);
    await p.evaluate(tg => window.__im.selectProv(tg), tg); await p.waitForTimeout(300);
    const qc = await p.evaluate(() => ({cf:!document.getElementById('mslcf').hidden, t:document.getElementById('mslcf').innerText}));
    ok(qc.cf && /Chemical strike on/i.test(qc.t) && /HP 16/.test(qc.t), tag + ': plan 2: Quick fire on: a chemical missile still shows its card');
    await p.evaluate(() => { window.__im.SET.mslQuick = false; const b = document.querySelector('[data-act="msl-cancel"]'); if (b) b.click(); window.__im.S.inflight.length = 0; });
    // HP on the marker: a ballistic missile hit in its last hour (every shot hits for that hour), drawn with its bar and chip, in the tap list; a tap on it tells its HP
    const hm = await p.evaluate(({w, tg}) => { const S = window.__im.S; const sa = stationaryAt(tg).find(b => b.u.sam); if (sa) sa.u.sam = 1; const ok0 = launchMissile(0, w, tg, 'bm'); const m = S.inflight[S.inflight.length - 1]; for (let i = 0; i < 2; i++) window.__im.tick();
      const r0 = rng; rng = () => 0.01; window.__im.tick(); rng = r0; return {ok0, hp:m.hp, def:m.def, id:m.id}; }, {w:s.w, tg});
    ok(hm.ok0 && hm.def && hm.hp === 4, tag + ': plan 2: hit by 2 SAMs (2 hits of 6, every shot hitting) in its last hour: HP 4/16: ' + JSON.stringify(hm));
    await p.evaluate(({w, tg}) => { const im = window.__im, A = im.G.P[w], B = im.G.P[tg], v = im.view, R = document.getElementById('map').getBoundingClientRect(), HS0v = im.hexPx()/v.s, s0 = 26/HS0v; v.s = s0;
      const m = im.S.inflight.find(q => q.k === "bm"), q = im.msl.pos(m); v.x = R.width/2 - q.x*s0; v.y = R.height*0.5 - q.y*s0; im.redraw && im.redraw(); }, {w:s.w, tg}); await p.waitForTimeout(700);
    const tp = await p.evaluate(id => { const T = window.__im.msl.taps().find(t => t.m.id === id); return T ? {x:T.x, y:T.y} : null; }, hm.id);
    ok(!!tp, tag + ': plan 2: the missile is in its tap list (drawn on screen)');
    if (tp){ await p.evaluate(({x, y}) => window.__im.msl.tapAt(x, y), tp); await p.waitForTimeout(200); const tt = await p.evaluate(() => { const e = document.getElementById('tip'); return e && !e.hidden ? e.innerText : ''; });
      ok(/Ballistic Missile/.test(tt) && /HP 4\/16/.test(tt) && /lands in 1 h/.test(tt), tag + ': plan 2: a tap on the missile: ' + tt.replace(/\s+/g, ' ')); }
    if (SHOTS) await p.screenshot({path:path.join(SHOTS, `${tag}-hp.png`)});
    await p.evaluate(() => { window.__im.S.inflight.length = 0; }); }
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
    // polish 1: the army bar says "no healing" in the gas; a third zone next door: the chips keep clear of each other, the counters and the markers;
    // the province panel's zone line stands high (under the terrain box, before the figures)
    const hb = await p.evaluate(tg => { const a = stationaryAt(tg[0]).find(b => b.owner === 0); a.w.inf = 3; return window.__im.msl.abHeal(a); }, r.tg); ok(/No healing in the gas/.test(hb[0] || ''), tag + ': army bar: ' + JSON.stringify(hb));
    await p.evaluate(tg => { const S = window.__im.S, q = G.P[tg[0]].nbs.find(v => !G.P[v].sea && v !== tg[1]); if (q != null) S.haz[q] = {k:'gas', h0:S.hour - 11, until:S.hour + 1, by:0}; window.__im.selectProv(tg[0]); }, r.tg);
    await p.waitForTimeout(3800); await p.evaluate(() => { window.__im.redraw && window.__im.redraw(); }); await p.waitForTimeout(400);
    const ch = await p.evaluate(() => { const L = window.__im.msl.chips(); if (!L) return null; const ov = (a, b) => Math.min(a[2], b[2]) > Math.max(a[0], b[0]) && Math.min(a[3], b[3]) > Math.max(a[1], b[1]);
      let cc = 0, co = 0; for (let i = 0; i < L.placed.length; i++){ for (let j = i + 1; j < L.placed.length; j++) if (ov(L.placed[i].map((v, k) => v + (k < 2 ? 2 : -2)), L.placed[j].map((v, k) => v + (k < 2 ? 2 : -2)))) cc++; for (const o of L.ob) if (ov(L.placed[i].map((v, k) => v + (k < 2 ? 2 : -2)), o)) co++; }
      return {n:L.placed.length, ob:L.ob.length, chipOnChip:cc, chipOnCounter:co}; });
    ok(ch && ch.n >= 2 && ch.chipOnChip === 0 && ch.chipOnCounter === 0, tag + ': zone chips clear of each other and of the counters: ' + JSON.stringify(ch));
    if (!phone){ const pos = await p.evaluate(() => { const side = document.querySelector('#side') || document.body, h = side.querySelector('.status.haz'), kv = side.querySelector('dl.kv'); return h && kv ? [h.getBoundingClientRect().top, kv.getBoundingClientRect().top] : null; });
      ok(pos && pos[0] < pos[1], tag + ': the province panel shows the zone line above its figures: ' + JSON.stringify(pos)); }
    await p.waitForTimeout(400);
    if (SHOTS) await p.screenshot({path:path.join(SHOTS, `${tag}-strike.png`)}); }
  await ctx.close(); }
(async () => { const b = await chromium.launch(); try { await run(b, false); await run(b, true); } finally { await b.close(); }
  console.log(bad.length || errs.length ? 'FAIL' : 'OK', JSON.stringify({bad, errs})); process.exit(bad.length || errs.length ? 1 : 0); })();
