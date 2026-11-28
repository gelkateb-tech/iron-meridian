// The one-figure test (owner 2026-11-27; one figure is the default from 2026-11-28, index.html ?fig=0 shows the earlier formation): node .test/one-figure.js   (bash tools/mkpage.sh first;
// exits 1 on any failure, prints JSON). A nations-world game as Germany, the clock paused, every force removed, at the closest zoom (hex 240):
//  (D) with ?fig=0 a mixed army (4 Anti-Tank, 3 Tanks, 2 Motorized Infantry) still stands as the earlier formation of several figures
//  (O) by default the same army stands as ONE figure, its main unit by the badge's rule (count x hit points: 3 Tanks 42 > 4 Anti-Tank 36), a tank
//  (M) Motorized Infantry at rest: one transport with its rifleman beside it; on the move: the transport alone (he rides in the hatch)
//  (H) on the road (Wiesbaden > Karlsruhe, the German road leg with the most bends, clock 2x) the drawn heading turns smoothly: never faster than the
//      tracked turn-rate cap (2 rad/s x sqrt 2), 1.5 times it while catching up with its way of travel (more than 25 degrees off it), and it turns through the bends (more than 0.6 rad in all over 6 s); its back-and-forth reversals are reported
//  (T) the same road at 1x, hex 240, the view following it: the heading stays within 30 degrees of the figure's way of travel (no stretch over
//      0.6 s) and never swings more than 120 degrees within 1.5 s
//  (R) on its road (Wiesbaden > Karlsruhe by Mannheim, 1x, the view following it, the WHOLE march to its halt, about 57 s) at hex 150 and 240: the figure's ground
//      point stays on its drawn route (legGeom, leg by leg): median and 90% of the frames within 0.15 world px, every frame within 0.6 (the start, where it
//      eases off the spot it left onto the road, and the arrival, where it stays on the road to the leg's end, included); the last fifth of the march within 0.15
//      (no drift toward its standing spot as it arrives); and from setting off to 3.5 s after it halts (when it glides onto its standing spot) its drawn spot
//      never moves more than 3 css px a frame against the force's own (the three frames after a stall of the test browser, over 100 ms, left out: the view that follows it lags and overshoots there)
//  (S) setting off (hex 240, fixed camera, 4x): its ground point never moves more than 3 css px a frame beyond the force's own drawn motion
//  (U) an unidentified tank-led Polish army: no figure of its own type (no troop model for its id) but the neutral figure, its '?' plate lifted over it
//  (E) no console or page error
const pickNation = require('./pick-nation.js'); const { chromium } = require('playwright'); const path = require('path');
const fails = []; const fail = (m, d) => fails.push(m + (d !== undefined ? ' ' + JSON.stringify(d) : ''));
async function openP(b, fig){ const ctx = await b.newContext({ viewport:{width:1440, height:900}, deviceScaleFactor:1 }), p = await ctx.newPage(); p.errs = [];
  p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') p.errs.push(m.text()); });
  await p.goto('file://' + path.join(__dirname, 'page.html') + (fig ? '' : '?fig=0')); await p.waitForTimeout(600);
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
    // the turn rate never above the tracked cap (2 rad/s, times the square root of the game speed: 2.83 at 2x; 1.5 times it, 4.24, while catching up with its way of travel) and no reversal back and forth (a wobble)
    let mx = 0, tot = 0, rev = 0, pd = 0; for (let i = 1; i < H.length; i++){ const dt = (H[i][1] - H[i - 1][1])/1000; if (!(dt > 0)) continue; const d = Math.atan2(Math.sin(H[i][0] - H[i - 1][0]), Math.cos(H[i][0] - H[i - 1][0])); mx = Math.max(mx, Math.abs(d)/dt); tot += Math.abs(d);
      if (Math.abs(d) > 0.01){ if (pd && Math.sign(d) !== Math.sign(pd)) rev++; pd = d; } }
    out.H = {frames:H.length, maxRate:+mx.toFixed(2), total:+tot.toFixed(2), reversals:rev}; if (!(H.length > 20) || mx > 4.3 || tot < 0.6) fail('H smooth heading through the bends', out.H); }
  // (T) on the same road at 1x and hex 240, the view following it: the drawn heading against the figure's own way of travel (its drawn ground
  //     point over 0.3 s, while it moves): never more than 30 degrees off for longer than 0.6 s at a stretch (a moment's slip of the drawn spot at
  //     a seam of the march is held, not turned into), and never a swing of more than 120 degrees within 1.5 s (a sharp bend takes longer)
  { const I = await p.evaluate(() => { const im = window.__im, S = im.S; S.armies.length = 0; S.battles.length = 0; const a = im.addArmy(0, 631, {tank:3, inf:1}); im.orderMove(a, 632); im.air.visibleSet(); return {id:a.id, x:im.G.P[631].x, y:im.G.P[631].y}; });
    await at(p, I.x, I.y, 240); await settle(p);
    const L = await p.evaluate(id => new Promise(res => { const im = window.__im, A = [], t0 = performance.now(); im.S.speed = 1;
      const f = () => { const t = performance.now(), a = im.S.armies.find(q => q.id === id); if (a){ const pos = im.dispPos(a), r = document.getElementById('map').getBoundingClientRect(), v = im.view, s = 20; v.s = s; v.x = r.width/2 - pos[0]*s; v.y = r.height/2 - pos[1]*s; }
        const q = window.__fig.TMDBG.find(z => z.ids.includes(id)); if (q) A.push([t - t0, q.wx, q.wy, q.ang]);
        if (t - t0 < 26000 && a && (a.to !== null || a.path.length)) requestAnimationFrame(f); else { im.S.speed = 0; res(A); } }; requestAnimationFrame(f); }), I.id);
    let j = 0, run = 0, worstRun = 0, over = 0, n = 0, pt = null; const O = [];
    for (let i = 0; i < L.length; i++){ while (L[i][0] - L[j][0] > 300) j++; const dt = (L[i][0] - L[j][0])/1000; if (dt < 0.2) continue; const dx = L[i][1] - L[j][1], dy = L[i][2] - L[j][2]; if (Math.hypot(dx, dy)/dt < 0.15){ pt = null; run = 0; continue; }
      const e = Math.abs(Math.atan2(Math.sin(L[i][3] - Math.atan2(dy, dx)), Math.cos(L[i][3] - Math.atan2(dy, dx)))), st = pt == null ? 0 : (L[i][0] - pt)/1000; pt = L[i][0]; n++; O.push([L[i][0], L[i][3]]);
      if (e > Math.PI/6){ run += st; over += st; worstRun = Math.max(worstRun, run); } else run = 0; }
    let swing = 0; for (let i = 0; i < O.length; i++) for (let k = i + 1; k < O.length && O[k][0] - O[i][0] < 1500; k++) swing = Math.max(swing, Math.abs(Math.atan2(Math.sin(O[k][1] - O[i][1]), Math.cos(O[k][1] - O[i][1]))));
    out.T = {samples:n, over30s:+over.toFixed(2), worstRun30s:+worstRun.toFixed(2), swingDeg:Math.round(swing*180/Math.PI)};
    if (n < 200 || worstRun > 0.6 || swing > Math.PI*2/3) fail('T heading follows the way of travel', out.T); }
  // (R) the figure's ground point on its road: its distance (world px) to the drawn leg, every frame of the march, the view following it
  for (const hp of [150, 240]){ const I = await p.evaluate(() => { const im = window.__im, S = im.S; S.armies.length = 0; S.battles.length = 0; const a = im.addArmy(0, 631, {tank:3, inf:1}); im.orderMove(a, 632); im.air.visibleSet(); const R = [a.at, ...a.path], W = []; for (let i = 0; i + 1 < R.length; i++) W.push(...window.__fig.legGeom(a, R[i], R[i + 1])); return {id:a.id, x:im.G.P[631].x, y:im.G.P[631].y, W}; });   // (its whole route: by Mannheim)
    await at(p, I.x, I.y, hp); await settle(p);
    const L = await p.evaluate(([id, hp]) => new Promise(res => { const im = window.__im, A = [], t0 = performance.now(); im.S.speed = 1; let haltT = null;
      const f = () => { const t = performance.now(), a = im.S.armies.find(q => q.id === id); if (a){ const pos = im.dispPos(a), r = document.getElementById('map').getBoundingClientRect(), v = im.view, s = hp/12; v.s = s; v.x = r.width/2 - pos[0]*s; v.y = r.height/2 - pos[1]*s; }
        const q = window.__fig.TMDBG.find(z => z.ids.includes(id)), mv = !!a && (a.to !== null || a.path.length > 0), sp = a ? im.toScreen(...im.dispPos(a)) : null; if (q) A.push([q.wx, q.wy, mv ? 1 : 0, q.x, q.y, sp ? sp[0] : null, sp ? sp[1] : null, t]);
        if (!mv && haltT == null) haltT = t; if (t - t0 < 120000 && (haltT == null || t - haltT < 3500)) requestAnimationFrame(f); else { im.S.speed = 0; res({A, march:(haltT ?? t) - t0, halted:haltT != null}); } }; requestAnimationFrame(f); }), [I.id, hp]);
    const dseg = (x, y) => { let d = Infinity; for (let i = 0; i + 1 < I.W.length; i++){ const [ax, ay] = I.W[i], dx = I.W[i + 1][0] - ax, dy = I.W[i + 1][1] - ay, u = Math.max(0, Math.min(1, ((x - ax)*dx + (y - ay)*dy)/(dx*dx + dy*dy || 1e-9))); d = Math.min(d, Math.hypot(ax + dx*u - x, ay + dy*u - y)); } return d; };
    const M = L.A.filter(q => q[2]), Dm = M.map(q => dseg(q[0], q[1])), D = Dm.slice().sort((a, b) => a - b), pc = k => D.length ? +D[Math.min(D.length - 1, Math.floor(D.length*k))].toFixed(3) : null;
    const tail = Dm.slice(Math.floor(Dm.length*0.8)), tailMax = tail.length ? +Math.max(...tail).toFixed(3) : null;
    let jump = 0; for (let i = 1; i < L.A.length; i++){ const r = L.A[i], r0 = L.A[i - 1]; if (r[5] == null || r0[5] == null || [0, 1, 2].some(k => i - k > 0 && L.A[i - k][7] - L.A[i - k - 1][7] > 100)) continue; jump = Math.max(jump, Math.hypot((r[3] - r[5]) - (r0[3] - r0[5]), (r[4] - r[6]) - (r0[4] - r0[6]))); }
    out['R' + hp] = {marchS:+(L.march/1000).toFixed(1), halted:L.halted, samples:D.length, median:pc(0.5), p90:pc(0.9), max:pc(1), lastFifthMax:tailMax, jumpPx:+jump.toFixed(2)};
    if (!L.halted || D.length < 200 || pc(0.5) > 0.15 || pc(0.9) > 0.15 || pc(1) > 0.6 || tailMax > 0.15 || jump > 3) fail('R the marching figure on its road at hex ' + hp, out['R' + hp]); }
  // (S) setting off: the figure's ground point against the force's own drawn spot, frame by frame (css px), fixed camera
  { const I = await p.evaluate(() => { const im = window.__im, S = im.S; S.armies.length = 0; S.battles.length = 0; const a = im.addArmy(0, 631, {tank:3, inf:1}); im.air.visibleSet(); return {id:a.id, x:im.G.P[631].x, y:im.G.P[631].y}; });
    await at(p, I.x, I.y, 240); await settle(p);
    const L = await p.evaluate(id => new Promise(res => { const im = window.__im, a = im.S.armies.find(q => q.id === id), A = []; let n = 0; im.orderMove(a, 632); im.S.speed = 4;
      const f = () => { const q = window.__fig.TMDBG.find(z => z.ids.includes(id)), w = im.dispPos(a); if (q) A.push([q.x, q.y, ...im.toScreen(w[0], w[1])]); if (++n < 200) requestAnimationFrame(f); else { im.S.speed = 0; res(A); } }; requestAnimationFrame(f); }), I.id);
    let worst = 0, wi = 0; for (let i = 1; i < L.length; i++){ const e = Math.hypot((L[i][0] - L[i - 1][0]) - (L[i][2] - L[i - 1][2]), (L[i][1] - L[i - 1][1]) - (L[i][3] - L[i - 1][3])); if (e > worst){ worst = e; wi = i; } }
    out.S = {frames:L.length, worstPx:+worst.toFixed(2), at:wi, fig:L[wi] && [L[wi][0] - L[wi - 1][0], L[wi][1] - L[wi - 1][1]].map(v => +v.toFixed(2)), spot:L[wi] && [L[wi][2] - L[wi - 1][2], L[wi][3] - L[wi - 1][3]].map(v => +v.toFixed(2))}; if (L.length < 100 || worst > 3) fail('S setting off without a jump', out.S); }
  { const I = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G; S.armies.length = 0; S.battles.length = 0; const pol = S.nations.findIndex(q => q.name === 'Poland'), rk = (a, b) => Math.min(a, b) + ',' + Math.max(a, b); S.rel[rk(0, pol)] = {st:'war', since:S.hour, until:null};
      const Po = G.P.find(P => P.cityName === 'Poznań' && !P.sea), U = G.P[Po.nbs.filter(n => !G.P[n].sea && S.owner[n] === pol && !G.P[n].city).sort((m, n) => G.P[n].cells.length - G.P[m].cells.length)[0]] || Po;
      const u = im.addArmy(pol, U.id, {tank:4, inf:1}), ue = im.addArmy(0, U.id, {inf:1}); ue.pos = [U.x + 2.5, U.y + 2.0]; im.air.visibleSet(); return {id:u.id, x:U.x, y:U.y, known:im.intel.knowA(u)}; });
    await at(p, I.x, I.y, 240); await settle(p); const F = await figs(p, I.id), n = await p.evaluate(() => [...window.__fig.UNKF.values()]); out.U = {known:I.known, figs:F, lift:n};
    if (I.known) fail('U the contact is identified (setup)'); if (F.length) fail('U no figure of its own type', F); if (!n.length || !(n[0] > 0)) fail('U the neutral figure under its plate', n); }
  if (p.errs.length) fail('E errors', p.errs.slice(0, 3));
  console.log(JSON.stringify({...out, fails}, null, 1)); await b.close(); process.exit(fails.length ? 1 : 0); })();
