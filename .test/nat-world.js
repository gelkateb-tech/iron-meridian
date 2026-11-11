// The nations world in the page (nations step 0): start it from the start screen, play, save, reload and continue; the classic world after it
// in the same page; a save from a newer nations format is refused with a message. node .test/nat-world.js
const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(), errs = [], bad = [];
  const ctx = await b.newContext({ viewport: { width: 1300, height: 820 } }), p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(600);
  const def = await p.evaluate(() => ({cards:document.querySelectorAll('.pick').length, world:document.querySelector('.wsel [aria-pressed="true"]').dataset.k}));
  if (def.cards !== 15 || def.world !== 'world') bad.push('the start screen does not open on the classic 15 powers');
  await p.click('[data-act="pickscn"][data-k="world64"]'); await p.click('[data-act="pickreg"][data-k="Asia"]');
  const tab = await p.evaluate(() => ({cards:[...document.querySelectorAll('.pick b')].map(e => e.textContent), tabs:[...document.querySelectorAll('.regs .btn')].map(e => e.textContent)}));
  if (tab.cards.join() !== 'China,India,Japan') bad.push('Asia tab: ' + tab.cards);
  await p.click('[data-act="pick"][data-p="13"]'); await p.click('[data-act="begin"]'); await p.waitForTimeout(1200); await p.click('[data-act="start"]'); await p.waitForTimeout(400);
  const g0 = await p.evaluate(() => { const N = S.nations[0], u = a => Object.values(a.u).reduce((s, v) => s + v, 0);
    return {scn:S.scn, mode:S.mode, me:N.name, tier:N.tier, region:N.region, small:N.small, boost:+N.boost.toFixed(2), boostM:+N.boostM.toFixed(2), cash:N.cash, mp:N.mp, yard:S.bld.filter((x, q) => S.owner[q] === 0 && x.yard).length, caps:WIN_CAPS, coal:coalCaps(), need:landNeed(0),
      units:S.armies.filter(a => a.owner === 0).reduce((s, a) => s + u(a), 0), tiers:S.nations.map(n => n.tier).join(''), w64:S.w64.cities.length, vbar:document.getElementById('vbar').innerText.replace(/\s+/g, ' ')}; });
  if (g0.scn !== 'world64' || g0.me !== 'Japan' || g0.tier !== 'A' || g0.small !== undefined || g0.caps !== 5 || g0.coal !== 8 || g0.need !== 763 || g0.yard !== 1 || g0.cash !== 232) bad.push('new game: ' + JSON.stringify(g0));
  await p.evaluate(() => { for (let i = 0; i < 120; i++) window.__im.tick(); }); await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  const before = await p.evaluate(() => ({hour:S.hour, cash:Math.round(S.nations[0].cash), owner:S.owner.filter(o => o === 0).length, saved:!!localStorage.getItem('iron-meridian-save-v5')}));
  await p.reload(); await p.waitForTimeout(700); await p.click('[data-act="continue"]'); await p.waitForTimeout(500);
  const after = await p.evaluate(() => ({hour:S.hour, cash:Math.round(S.nations[0].cash), owner:S.owner.filter(o => o === 0).length, scn:SCN, tier:S.nations[0].tier, caps:WIN_CAPS, cities:G.P.filter(P => P.city).length, capFlags:G.P.filter(P => P.capFlag).length}));
  if (after.hour !== before.hour || after.cash !== before.cash || after.owner !== before.owner || after.scn !== 'world64' || after.tier !== 'A' || after.caps !== 5 || after.capFlags !== 15) bad.push('reload: ' + JSON.stringify({before, after}));
  await p.evaluate(() => { for (let i = 0; i < 48; i++) window.__im.tick(); });
  // a save of a newer nations format: refused, with the reason, and the running game is untouched
  const ref = await p.evaluate(() => { const d = JSON.parse(saveJSON()); d.w64.v = 99; const h = S.hour, ok = restore(d); return {ok, why:restore.why, same:S.hour === h && S.scn === 'world64'}; });
  if (ref.ok || !/newer version/.test(ref.why) || !ref.same) bad.push('refusal: ' + JSON.stringify(ref));
  // a classic game in the same page: the old rules again
  const cl = await p.evaluate(() => { useScenario('world'); newGame(5, 13, [0]); const N = S.nations[0]; return {scn:S.scn, tier:N.tier, small:N.small, cash:N.cash, w64:S.w64, boostM:N.boostM, caps:WIN_CAPS, coal:coalCaps()}; });
  if (cl.scn !== 'world' || cl.tier !== undefined || cl.small !== true || cl.cash !== 220 || cl.w64 !== undefined || cl.boostM !== undefined || cl.caps !== 5 || cl.coal !== 8) bad.push('classic after nations: ' + JSON.stringify(cl));
  console.log(JSON.stringify({def, tab, g0, before, after, ref, cl}, null, 1)); console.log('BAD', bad.length ? bad : 'none'); console.log('ERRORS', errs.length ? errs : 'none');
  await b.close(); process.exit(errs.length || bad.length ? 1 : 0); })();
