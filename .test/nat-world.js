// The nations world in the page (nations step 0): start it from the start screen, play, save, reload and continue; the classic world after it
// in the same page; a save from a newer nations format is refused with a message. Province split (step 0b): the nations world plays on the map
// with the split provinces (3486), the classic world on world.js (3465), and the page goes back and forth between them by new games and loads. node .test/nat-world.js
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
    return {scn:S.scn, mode:S.mode, me:N.name, tier:N.tier, region:N.region, small:N.small, boost:+N.boost.toFixed(2), boostM:+N.boostM.toFixed(2), cash:N.cash, mp:N.mp, yard:S.bld.filter((x, q) => S.owner[q] === 0 && x.yard).length, caps:WIN_CAPS, capsWant:winCapsFor(S.nations.length), coal:coalCaps(), need:landNeed(0), needWant:Math.max(Math.ceil(scnLand()*winShareFor(S.nations.length)), (N.prov0 || 0) + SCENARIOS.world64.extra),
      units:S.armies.filter(a => a.owner === 0).reduce((s, a) => s + u(a), 0), map:S.map, provs:G.P.length, greece:G.countries.find(c => c.name === 'Greece').provs.length, tiers:S.nations.map(n => n.tier).join(''), w64:S.w64.cities.length, vbar:document.getElementById('vbar').innerText.replace(/\s+/g, ' ')}; });
  if (g0.scn !== 'world64' || g0.me !== 'Japan' || g0.tier !== 'A' || g0.small !== undefined || g0.caps !== g0.capsWant || g0.coal !== Math.round(g0.capsWant*1.5) || g0.need !== g0.needWant || g0.map !== 1 || g0.provs !== 3486 || g0.greece !== 13 || g0.yard !== 1 || g0.cash !== 232) bad.push('new game: ' + JSON.stringify(g0));
  await p.evaluate(() => { for (let i = 0; i < 120; i++) window.__im.tick(); }); await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  const before = await p.evaluate(() => ({hour:S.hour, cash:Math.round(S.nations[0].cash), owner:S.owner.filter(o => o === 0).length, saved:!!localStorage.getItem('iron-meridian-save-v5')}));
  await p.reload(); await p.waitForTimeout(700); await p.click('[data-act="continue"]'); await p.waitForTimeout(500);
  const after = await p.evaluate(() => ({provs:G.P.length, hour:S.hour, cash:Math.round(S.nations[0].cash), owner:S.owner.filter(o => o === 0).length, scn:SCN, tier:S.nations[0].tier, caps:WIN_CAPS, cities:G.P.filter(P => P.city).length, capFlags:G.P.filter(P => P.capFlag).length, nn:S.nations.length}));
  if (after.hour !== before.hour || after.cash !== before.cash || after.owner !== before.owner || after.scn !== 'world64' || after.tier !== 'A' || after.caps !== g0.caps || after.capFlags !== after.nn || after.provs !== 3486) bad.push('reload: ' + JSON.stringify({before, after}));
  await p.evaluate(() => { for (let i = 0; i < 48; i++) window.__im.tick(); });
  // a save of a newer nations format: refused, with the reason, and the running game is untouched
  const ref = await p.evaluate(() => { const d = JSON.parse(saveJSON()); d.w64.v = 99; const h = S.hour, ok = restore(d); return {ok, why:restore.why, same:S.hour === h && S.scn === 'world64'}; });
  if (ref.ok || !/newer version/.test(ref.why) || !ref.same) bad.push('refusal: ' + JSON.stringify(ref));
  // a classic game in the same page: the old rules again
  const n64 = await p.evaluate(() => saveJSON());
  const cl = await p.evaluate(() => { useScenario('world'); newGame(5, 13, [0]); const N = S.nations[0]; return {provs:G.P.length, greece:G.countries.find(c => c.name === 'Greece').provs.length, map:S.map, scn:S.scn, tier:N.tier, small:N.small, cash:N.cash, w64:S.w64, boostM:N.boostM, caps:WIN_CAPS, coal:coalCaps()}; });
  if (cl.scn !== 'world' || cl.tier !== undefined || cl.small !== true || cl.cash !== 220 || cl.w64 !== undefined || cl.boostM !== undefined || cl.caps !== 5 || cl.coal !== 8 || cl.provs !== 3465 || cl.greece !== 8 || cl.map !== undefined) bad.push('classic after nations: ' + JSON.stringify(cl));
  // back to the nations world by a load (the map switches with it), a few days played and drawn on both maps, the classic world again
  await p.evaluate(() => { for (let i = 0; i < 24; i++) window.__im.tick(); });
  const back = await p.evaluate(t => { const ok = restore(JSON.parse(t)); for (let i = 0; i < 48; i++) window.__im.tick(); return {ok, provs:G.P.length, scn:S.scn, own:S.owner.length, lines:!!(loadWorld.lines && loadWorld.lines.roadsT)}; }, n64);
  await p.waitForTimeout(600);
  const back2 = await p.evaluate(() => { useScenario('world'); newGame(6, 2, [0]); for (let i = 0; i < 48; i++) window.__im.tick(); return {provs:G.P.length, scn:S.scn}; });
  await p.waitForTimeout(600);
  if (!back.ok || back.provs !== 3486 || back.own !== 3486 || back.scn !== 'world64' || !back.lines || back2.provs !== 3465) bad.push('maps back and forth: ' + JSON.stringify({back, back2}));
  console.log(JSON.stringify({def, tab, g0, before, after, ref, cl, back, back2}, null, 1)); console.log('BAD', bad.length ? bad : 'none'); console.log('ERRORS', errs.length ? errs : 'none');
  await b.close(); process.exit(errs.length || bad.length ? 1 : 0); })();
