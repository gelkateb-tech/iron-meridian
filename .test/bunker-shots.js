// The Bunker on the page (owner #17): the BUILD panel shows its five levels with their stats, your own bunker stands on the map at its level
// (bn-fort-N, 1:1), a foreign city's bunker is not drawn and not listed (the city sheet and the province detail show its other buildings only),
// and a revealed one is. Screenshots for the owner at deviceScaleFactor 2.
//   node .test/bunker-shots.js [W H out-dir]     (bash tools/mkpage.sh first) prints JSON {checks, fails, errors}, exit 1 on a failure
const pickNation = require('./pick-nation.js');
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), OUT = process.argv[4] || path.join(__dirname, 'shots'), PHONE = W <= 820, TAG = PHONE ? 'phone' : 'desktop';
(async () => {
  fs.mkdirSync(OUT, {recursive:true});
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: PHONE, isMobile: false });
  const p = await ctx.newPage(); const errors = [], checks = {}, fails = [];
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto('file://' + __dirname + '/page.html?start=nations'); await p.waitForTimeout(500);
  await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 });
  const C = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im, S = im.S, G = im.G; S.speed = 0;
    const by = n => G.P.find(q => q.cityName === n), be = by('Berlin'), wa = by('Warsaw');
    Object.assign(S.bld[be.id], {fac:2, rec:1, fort:3}); S.nations[0].cash = 900; S.nations[0].metal = S.nations[0].iron = 200000; S.nations[0].elec = 60000;
    Object.assign(S.bld[wa.id], {fac:3, air:2, rec:1, fort:5});   // Poland's capital: a level 5 bunker among its other buildings
    return {be:be.id, beXY:[be.x, be.y], wa:wa.id, waXY:[wa.x, wa.y], waOwner:S.nations[S.owner[wa.id]].name}; });
  const look = (x, y, hp) => p.evaluate(([x, y, hp, W, H]) => { const im = window.__im, v = im.view, s = hp/12; v.s = s; v.x = W/2 - x*s; v.y = H*0.38 - y*s; im.redraw(); }, [x, y, hp, W, H]);
  const settle = async () => { for (let i = 0; i < 12; i++){ await p.waitForTimeout(250); if (!(await p.evaluate(() => window.__im.mapBusy && window.__im.mapBusy()))) break; } await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); await p.waitForTimeout(300); };
  const drawn = id => p.evaluate(id => window.__im.bn.dbg.filter(e => e.p === id).map(e => e.k + ':' + (e.pic || e.nm || '')), id);
  const clear = () => p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const k = document.querySelector('[data-act="tip-skip"]'); if (k) k.click(); });
  // 1. your own bunker on the map (Berlin, level 3: picture bn-fort-3)
  await p.evaluate(id => window.__im.selectProv(id), C.be); await p.waitForTimeout(300);
  await look(C.beXY[0], C.beXY[1], PHONE ? 150 : 170); await settle(); await clear();
  checks.ownMap = await drawn(C.be); if (!checks.ownMap.some(s => /^fort:bn-fort-3/.test(s))) fails.push('Berlin\'s level 3 bunker is not drawn as bn-fort-3: ' + checks.ownMap.join(' '));
  await p.screenshot({ path: path.join(OUT, `bunker-own-map-${TAG}.png`) });
  // 2. the BUILD panel: the bunker's five levels with their stats
  await p.click('[data-act="cs-bld"]'); await p.waitForTimeout(400);
  checks.panel = await p.evaluate(() => { const r = document.querySelector('#sheet .bld[data-bk="fort"]'); if (!r) return null; r.scrollIntoView({block:'start'}); const t = r.querySelector('.bkt');
    return {name:r.querySelector('.nm').textContent, lv:r.querySelector('.lv').textContent, rows:t ? [...t.querySelectorAll('.bkr')].map(x => [...x.children].map(c => c.textContent).join(' | ')) : [], on:t ? [...t.querySelectorAll('.bkr.on')].length : 0}; });
  if (!checks.panel || checks.panel.name !== 'Bunker' || checks.panel.rows.length !== 6 || checks.panel.on !== 1 || !/III\/V/.test(checks.panel.lv)) fails.push('the BUILD panel does not show the Bunker\'s five levels: ' + JSON.stringify(checks.panel));
  if (checks.panel && !/−33%.*−39% \/ −46%.*20.*\+5%.*\$1\.0M.*\$36M/.test(checks.panel.rows[1])) fails.push('level I row: ' + checks.panel.rows[1]);
  if (checks.panel && !/−82%.*−84% \/ −86%.*125.*\+50%.*\$1\.4M.*\$180M/.test(checks.panel.rows[5])) fails.push('level V row: ' + checks.panel.rows[5]);
  await p.waitForTimeout(200); await p.screenshot({ path: path.join(OUT, `bunker-build-panel-${TAG}.png`) });
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  // 3. a foreign city with a bunker (Warsaw, level 5): not drawn, not in its city sheet or its details
  await p.evaluate(id => window.__im.selectProv(id), C.wa); await p.waitForTimeout(300);
  await look(C.waXY[0], C.waXY[1], PHONE ? 150 : 170); await settle(); await clear();
  checks.foreignMap = await drawn(C.wa); if (checks.foreignMap.some(s => /^fort/.test(s))) fails.push('Warsaw\'s bunker is drawn: ' + checks.foreignMap.join(' '));
  if (!checks.foreignMap.some(s => /^fac/.test(s))) fails.push('Warsaw\'s other buildings are not drawn: ' + checks.foreignMap.join(' '));
  checks.foreignSheet = await p.evaluate(() => { const el = document.getElementById('csheet'); return el && !el.hidden ? [...el.querySelectorAll('.cs-c .cs-cn')].map(e => e.textContent) : null; });
  if (!checks.foreignSheet || checks.foreignSheet.includes('Bunker') || !checks.foreignSheet.includes('Army Base')) fails.push('Warsaw\'s city sheet: ' + JSON.stringify(checks.foreignSheet));
  checks.foreignInfo = await p.evaluate(id => { const h = window.__im.provHTML ? window.__im.provHTML(id) : ''; return h; }, C.wa);
  await p.screenshot({ path: path.join(OUT, `bunker-foreign-hidden-${TAG}.png`) });
  // 4. the same city revealed (a spy's Reconnaissance): now it shows
  await p.evaluate(id => { const S = window.__im.S; S.reveal = S.reveal || {}; S.reveal[id] = S.hour + 72; window.__im.geoDirty(); }, C.wa);
  await look(C.waXY[0] + 0.001, C.waXY[1], PHONE ? 150 : 170); await p.waitForTimeout(1500); await settle();
  checks.revealedMap = await drawn(C.wa); if (!checks.revealedMap.some(s => /^fort:bn-fort-5/.test(s))) fails.push('revealed, Warsaw\'s bunker is not drawn as bn-fort-5: ' + checks.revealedMap.join(' '));
  await p.evaluate(() => { const S = window.__im.S; S.reveal = {}; });
  delete checks.foreignInfo;
  console.log(JSON.stringify({W, H, checks, fails, errors}, null, 1));
  await b.close(); process.exit(fails.length || errors.length ? 1 : 0); })();
