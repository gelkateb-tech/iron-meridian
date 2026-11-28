// MISSILES PLAN 2 screenshots, Before / After (docs/MISSILES-PLAN2.md): the same scenes on a page of master (before) and of this build (after), a
// nations game as Poland at war with Germany, desktop 1440 x 900 and phone 440 px (scale 2), JPG:
//   node .test/missiles-plan2-shots.js <page.html> <out dir> <before|after>
// strip: the missile strip open (every kind stocked); research: Strategic Weapons with the missile lines; silo: Warsaw's silo panel; card-chem: the
// chemical missile's launch card; card-cm: a cruise missile's card (after; before: a cruise missile fires on the tap, no card); settings: the
// settings (after: Quick fire); rings-cm / rings-bm: the range rings of a cruise and a ballistic missile from Warsaw; hp: a ballistic missile hit in
// its last hour (after: HP on the marker); salvo: four cruise missiles and a ballistic one landing together on a defended city
const SC = require('./rebels2-scene.js');
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const [PAGE, OUT, TAG = 'after'] = process.argv.slice(2); if (!PAGE || !OUT) throw new Error('usage: node .test/missiles-plan2-shots.js <page.html> <out dir> <before|after>');
fs.mkdirSync(OUT, {recursive:true}); const errs = [], made = [];
async function run(b, phone){ const ctx = await b.newContext(phone ? {viewport:{width:440, height:900}, isMobile:true, hasTouch:true, deviceScaleFactor:2} : {viewport:{width:1440, height:900}}), p = await ctx.newPage(), dv = phone ? 'phone' : 'desktop';
  p.on('pageerror', e => errs.push(dv + ': ' + e.message));
  const shot = async nm => { const f = path.join(OUT, `${TAG}-${dv}-${nm}.jpg`); await p.screenshot({path:f, type:'jpeg', quality:82}); made.push(f); };
  await SC.start(p, 'Poland', PAGE);
  const s = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, N = S.nations[0], p2 = typeof MSL_CAR !== 'undefined';
    for (const id of ['msl1', 'msl2', 'msl_chem', 'bm_pow', 'msl_nuc']) rGrant(N, id, 1);
    N.cash = 5000; for (const k of ['oil', 'metal', 'iron', 'elec', 'rare']) N[k] = 5000*RES_K;
    const w = G.P.find(P => P.cityName === 'Warsaw').id; S.bld[w].silo = 2; const m = mstock(w); Object.assign(m, {cm:6, bm:3, chem:2, nuc:1, wo:0}); if (p2) Object.assign(m, {ccm:2, ncm:1});
    const DE = S.nations.findIndex(N => N.name === 'Germany'); setRel(0, DE, 'war');
    const tg = G.P.filter(P => P.city && !P.sea && S.owner[P.id] === DE && hexDist(G.P[w].cc, P.cc) <= 14).sort((a, b) => hexDist(G.P[w].cc, a.cc) - hexDist(G.P[w].cc, b.cc))[0].id;
    addArmy(DE, tg, {inf:8, tank:4}); addArmy(DE, tg, {sam:3}); (S.reveal || (S.reveal = {}))[tg] = S.hour + 400; if (typeof intelNote === 'function') intelNote(0, [tg], S.hour + 400); if (typeof visCache !== 'undefined') visCache = null;
    return {w, tg, p2}; });
  const sel = async q => { await p.evaluate(q => window.__im.selectProv(q), q); await p.waitForTimeout(450); };
  const esc = async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(250); await p.evaluate(() => { window.scrollTo(0, 0); for (const e of [document.scrollingElement, document.body, document.documentElement]) if (e) e.scrollTop = 0; }); };   // (a panel scrolled into view must not leave the page scrolled)
  // strip
  await SC.camera(p, s.w, 18, 0.45); await sel(s.w); await esc();
  if (await p.locator('#mslbtn').isVisible()){ await p.click('#mslbtn'); await p.waitForTimeout(400); await shot('strip'); await p.click('#mslbtn'); await p.waitForTimeout(200); }
  // research: Strategic Weapons
  await p.evaluate(() => { const b = document.querySelector('[data-act="research-open"]'); if (b) b.click(); }); await p.waitForTimeout(500);
  if (await p.locator('[data-act="rbranch"][data-b="msl"]').count()){ await p.click('[data-act="rbranch"][data-b="msl"]'); await p.waitForTimeout(600); }
  for (const [id, nm] of [['cm_rng', 'research'], ['msl_nuc', 'research-nuc']]){ await p.evaluate(id => { const e = document.querySelector(`.rnode[data-id="${id}"]`); if (e){ e.scrollIntoView({block:'center'}); e.click(); } }, id); await p.waitForTimeout(500); await shot(nm); }   // (a node's card: its text with the new numbers)
  await esc(); await p.evaluate(() => { const b = document.querySelector('[data-act="resume"]'); if (b) b.click(); }); await esc();
  // silo panel (the phone: the city sheet's build window)
  await SC.camera(p, s.w, 22, 0.4); await sel(s.w);
  if (phone && await p.locator('[data-act="cs-bld"]').count()){ await p.click('[data-act="cs-bld"]'); await p.waitForTimeout(500); }
  { const l = p.locator('[data-act="msl-build"]'); if (await l.count()){ await l.first().scrollIntoViewIfNeeded(); await p.waitForTimeout(250); } } await shot('silo'); if (phone) await esc();
  // the cards
  const aim = async k => { await sel(s.w); if (phone) await esc(); await p.evaluate(({w, k}) => { window.__im.selectProv(w); const b = document.createElement('button'); b.dataset.act = 'msl-aim'; b.dataset.k = k; document.body.appendChild(b); b.click(); b.remove(); }, {w:s.w, k}); await p.waitForTimeout(300); };   // (the Launch button's action, on both pages)
  await SC.camera(p, s.tg, 20, 0.35); await aim('chem'); await p.evaluate(tg => window.__im.msl.pick(tg), s.tg); await p.waitForTimeout(500); await shot('card-chem');
  await p.evaluate(() => { const b = document.querySelector('[data-act="msl-cancel"]'); if (b) b.click(); }); await p.waitForTimeout(200);
  await aim('cm'); if (s.p2){ await p.evaluate(tg => window.__im.msl.pick(tg), s.tg); await p.waitForTimeout(500); } else { await p.mouse.move(phone ? 220 : 720, phone ? 300 : 320); await p.waitForTimeout(300); }
  await shot('card-cm'); await p.evaluate(() => { const b = document.querySelector('[data-act="msl-cancel"]'); if (b) b.click(); }); await esc();
  // settings
  await p.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'settings-open'; document.body.appendChild(b); b.click(); b.remove(); }); await p.waitForTimeout(500);
  await p.evaluate(() => { const r = [...document.querySelectorAll('.srow')].find(e => /Quick fire|Daily newspaper/.test(e.innerText)); if (r) r.scrollIntoView({block:'center'}); }); await p.waitForTimeout(300); await shot('settings'); await esc();
  // range rings from Warsaw: cruise, then ballistic (zoomed out to show both)
  for (const k of ['cm', 'bm']){ await aim(k); await SC.camera(p, s.w, phone ? 3.2 : 4.2, 0.5); await p.waitForTimeout(500); await shot('rings-' + k); await esc(); await p.evaluate(() => { const b = document.querySelector('[data-act="msl-cancel"]'); if (b) b.click(); }); }
  // a ballistic missile hit in its last hour: two SAMs, every shot hitting for that hour (after); the same missile in flight (before)
  await p.evaluate(({w, tg}) => { const S = window.__im.S; S.inflight = []; const sa = stationaryAt(tg).find(b => b.u.sam); if (sa) sa.u.sam = 1;
    launchMissile(0, w, tg, 'bm'); for (let i = 0; i < 2; i++) window.__im.tick(); const r0 = rng; rng = () => 0.01; window.__im.tick(); rng = r0; }, {w:s.w, tg:s.tg});
  await p.evaluate(({tg}) => { const im = window.__im, v = im.view, R = document.getElementById('map').getBoundingClientRect(), HS0v = im.hexPx()/v.s, s0 = 60/HS0v, m = im.S.inflight[0], B = im.G.P[tg];
    if (!m) return; const q = im.msl && im.msl.pos ? im.msl.pos(m) : {x:B.x, y:B.y - 12}; v.s = s0; v.x = R.width/2 - q.x*s0; v.y = R.height*0.42 - q.y*s0; }, {tg:s.tg}); await p.waitForTimeout(900);
  await shot('hp');
  // a salvo: four cruise missiles and a ballistic one on the city with 3 SAMs, the defence firing at them in their last hour
  await p.evaluate(({w, tg}) => { const S = window.__im.S; S.inflight = []; const sa = stationaryAt(tg).find(b => b.u.sam); if (sa) sa.u.sam = 3; mstock(w).cm = 6; mstock(w).bm = 2;
    launchMissile(0, w, tg, 'bm'); window.__im.tick(); window.__im.tick(); for (let i = 0; i < 4; i++) launchMissile(0, w, tg, 'cm'); window.__im.tick(); }, {w:s.w, tg:s.tg});   // (all five land in the coming hour: the defence has just fired at them)
  await p.evaluate(({tg}) => { const im = window.__im, v = im.view, R = document.getElementById('map').getBoundingClientRect(), HS0v = im.hexPx()/v.s, s0 = 44/HS0v, L = im.S.inflight, B = im.G.P[tg];
    const Q = L.length && im.msl && im.msl.pos ? L.map(m => im.msl.pos(m)) : [{x:B.x, y:B.y}], x = Q.reduce((a, q) => a + q.x, 0)/Q.length, y = Q.reduce((a, q) => a + q.y, 0)/Q.length; v.s = s0; v.x = R.width/2 - x*s0; v.y = R.height*0.5 - y*s0; }, {tg:s.tg});
  await p.waitForTimeout(900); await shot('salvo');
  await ctx.close(); }
(async () => { const b = await chromium.launch(); try { await run(b, false); await run(b, true); } finally { await b.close(); }
  console.log(JSON.stringify({made:made.length, errs})); process.exit(errs.length ? 1 : 0); })();
