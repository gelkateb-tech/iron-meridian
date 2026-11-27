// The one-figure test (owner 2026-11-27; index.html ?fig=1, today's look stays the default): node .test/one-figure.js   (bash tools/mkpage.sh first;
// exits 1 on any failure, prints JSON). A nations-world game as Germany, the clock paused, every force removed, at the closest zoom (hex 240):
//  (D) without the switch a mixed army (4 Anti-Tank, 3 Tanks, 2 Motorized Infantry) still stands as today's formation of several figures
//  (O) with ?fig=1 the same army stands as ONE figure, its main unit by the badge's rule (count x hit points: 3 Tanks 42 > 4 Anti-Tank 36), a tank
//  (M) Motorized Infantry at rest: one transport with its rifleman beside it; on the move: the transport alone (he rides in the hatch)
//  (H) on the road (Wiesbaden > Karlsruhe, the German road leg with the most bends, clock 2x) the drawn heading turns smoothly: never faster than the
//      tracked turn-rate cap (2 rad/s x sqrt 2), and it turns through the bends (more than 0.6 rad in all over 6 s); its back-and-forth reversals are reported
//  (U) an unidentified tank-led Polish army: no figure of its own type (no troop model for its id) but the neutral figure, its '?' plate lifted over it
//  (E) no console or page error
const pickNation = require('./pick-nation.js'); const { chromium } = require('playwright'); const path = require('path');
const fails = []; const fail = (m, d) => fails.push(m + (d !== undefined ? ' ' + JSON.stringify(d) : ''));
async function openP(b, fig){ const ctx = await b.newContext({ viewport:{width:1440, height:900}, deviceScaleFactor:1 }), p = await ctx.newPage(); p.errs = [];
  p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') p.errs.push(m.text()); });
  await p.goto('file://' + path.join(__dirname, 'page.html') + (fig ? '?fig=1' : '')); await p.waitForTimeout(600);
  await p.click('[data-act="pickscn"][data-k="world64"]'); await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.waitForTimeout(800);
  if (await p.locator('[data-act="start"]').count()) await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 90000 }); await p.waitForTimeout(1000);
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im, S = im.S; S.speed = 0; im.SET.tipsOff = true; im.SET.saver = false; S.sunOff = 0;
    S.hour = (Math.floor(S.hour/24) + 1)*24 + 11; S.armies.length = 0; S.ncnt = {}; S.battles.length = 0; im.sel.prov = null; im.sel.army = null; window.__fig.TMDBG.on = true; im.redraw(); });
  return p; }
const at = (p, x, y, hp) => p.evaluate(([x, y, hp]) => { const im = window.__im, r = document.getElementById('map').getBoundingClientRect(), v = im.view, s = hp/12; v.s = s; v.x = r.width/2 - x*s; v.y = r.height/2 - y*s; im.redraw(); }, [x, y, hp]);
const figs = (p, id) => p.evaluate(id => new Promise(res => { window.__im.redraw(); requestAnimationFrame(() => requestAnimationFrame(() => res(window.__fig.TMDBG.filter(q => q.ids.includes(id)).map(q => ({t:q.t, man:q.man || 0, moving:q.moving}))))); }), id);
async function scene(p, u){ return p.evaluate(u => { const im = window.__im, S = im.S, G = im.G; S.armies.length = 0; S.ncnt = {}; S.battles.length = 0;
  const q = G.P[G.P.find(P => P.cityName === 'Berlin').nbs.filter(n => !G.P[n].sea && S.owner[n] === 0 && !G.P[n].city).sort((m, n) => G.P[n].cells.length - G.P[m].cells.length)[0]];
  const a = im.addArmy(0, q.id, u); im.air.visibleSet(); return {id:a.id, x:q.x, y:q.y}; }, u); }
const settle = async p => { for (let i = 0; i < 30; i++){ await p.waitForTimeout(200); const ok = await p.evaluate(() => window.__im.mapBusy ? !window.__im.mapBusy() : true); if (ok && i > 4) break; } await p.waitForTimeout(800); };
(async () => { const b = await chromium.launch({args:['--allow-file-access-from-files']}), out = {};
  { const p = await openP(b, false), I = await scene(p, {at:4, tank:3, inf:2}); await at(p, I.x, I.y, 240); await settle(p); const F = await figs(p, I.id); out.D = F;
    if (F.length < 2) fail('D today: a formation of several figures', F); if (p.errs.length) fail('E errors (default)', p.errs.slice(0, 3)); await p.context().close(); }
  const p = await openP(b, true);
  { const I = await scene(p, {at:4, tank:3, inf:2}); await at(p, I.x, I.y, 240); await settle(p); const F = await figs(p, I.id); out.O = F; if (F.length !== 1 || F[0].t !== 'tank') fail('O one figure, the tank', F); }
  { const I = await scene(p, {inf:6}); await at(p, I.x, I.y, 240); await settle(p); const F = await figs(p, I.id); out.M = F; if (F.length !== 1 || F[0].t !== 'mot' || !F[0].man) fail('M at rest: the transport and its rifleman', F);
    await p.evaluate(id => { const im = window.__im, a = im.S.armies.find(q => q.id === id), G = im.G; im.orderMove(a, G.P[a.at].nbs.find(n => !G.P[n].sea && im.S.owner[n] === 0)); im.S.speed = 1; }, I.id); await p.waitForTimeout(2500);
    const F2 = await figs(p, I.id); out.M2 = F2; if (F2.length !== 1 || F2[0].t !== 'mot' || F2[0].man || !F2[0].moving) fail('M on the move: the transport alone', F2); await p.evaluate(() => { window.__im.S.speed = 0; }); }
  { const I = await p.evaluate(() => { const im = window.__im, S = im.S; S.armies.length = 0; S.battles.length = 0; const a = im.addArmy(0, 631, {tank:3, inf:1}); im.orderMove(a, 632); im.air.visibleSet(); return {id:a.id, x:im.G.P[631].x, y:im.G.P[631].y}; });
    await at(p, I.x, I.y, 150); await settle(p);
    const H = await p.evaluate(id => new Promise(res => { const im = window.__im; im.S.speed = 2; const A = []; const t0 = performance.now(); const f = () => { const E = window.__fig.FIGT.get(id); if (E) A.push([E.a, E.t]); if (performance.now() - t0 < 6000) requestAnimationFrame(f); else { im.S.speed = 0; res(A); } }; requestAnimationFrame(f); }), I.id);
    // the turn rate never above the tracked cap (2 rad/s, times the square root of the game speed: 2.83 at 2x) and no reversal back and forth (a wobble)
    let mx = 0, tot = 0, rev = 0, pd = 0; for (let i = 1; i < H.length; i++){ const dt = (H[i][1] - H[i - 1][1])/1000; if (!(dt > 0)) continue; const d = Math.atan2(Math.sin(H[i][0] - H[i - 1][0]), Math.cos(H[i][0] - H[i - 1][0])); mx = Math.max(mx, Math.abs(d)/dt); tot += Math.abs(d);
      if (Math.abs(d) > 0.01){ if (pd && Math.sign(d) !== Math.sign(pd)) rev++; pd = d; } }
    out.H = {frames:H.length, maxRate:+mx.toFixed(2), total:+tot.toFixed(2), reversals:rev}; if (!(H.length > 20) || mx > 2.9 || tot < 0.6) fail('H smooth heading through the bends', out.H); }
  { const I = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G; S.armies.length = 0; S.battles.length = 0; const pol = S.nations.findIndex(q => q.name === 'Poland'), rk = (a, b) => Math.min(a, b) + ',' + Math.max(a, b); S.rel[rk(0, pol)] = {st:'war', since:S.hour, until:null};
      const Po = G.P.find(P => P.cityName === 'Poznań' && !P.sea), U = G.P[Po.nbs.filter(n => !G.P[n].sea && S.owner[n] === pol && !G.P[n].city).sort((m, n) => G.P[n].cells.length - G.P[m].cells.length)[0]] || Po;
      const u = im.addArmy(pol, U.id, {tank:4, inf:1}), ue = im.addArmy(0, U.id, {inf:1}); ue.pos = [U.x + 2.5, U.y + 2.0]; im.air.visibleSet(); return {id:u.id, x:U.x, y:U.y, known:im.intel.knowA(u)}; });
    await at(p, I.x, I.y, 240); await settle(p); const F = await figs(p, I.id), n = await p.evaluate(() => [...window.__fig.UNKF.values()]); out.U = {known:I.known, figs:F, lift:n};
    if (I.known) fail('U the contact is identified (setup)'); if (F.length) fail('U no figure of its own type', F); if (!n.length || !(n[0] > 0)) fail('U the neutral figure under its plate', n); }
  if (p.errs.length) fail('E errors', p.errs.slice(0, 3));
  console.log(JSON.stringify({...out, fails}, null, 1)); await b.close(); process.exit(fails.length ? 1 : 0); })();
