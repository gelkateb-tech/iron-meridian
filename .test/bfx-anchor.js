// Battle effects from the figures, anchored to the map: node .test/bfx-anchor.js [W H dpr]
// A battle (Germany against a neighbour, infantry, tanks and artillery on both sides) next to Berlin, clock running at close zoom:
//  (F) every figure shot leaves from a registered firing point (a figure's muzzle, BFX) and lands round a figure of the other side
//  (S) the battle smoke (plumes and short puffs) is drawn, and with the clock paused and the effects' clock frozen every puff keeps its
//      world spot while zooming and panning (< 0.05 world px); two screenshots of the same smoke at two zooms (OUT/after-anchor-*.png, OUT defaults to .test)
//  (C) zoomed out to counters only: no firing points, no new shots, no battle smoke drawn, and the plates carry the battle badge
const { chromium } = require('playwright'); const path = require('path');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), DPR = +(process.argv[4] || 1), PHONE = W <= 820;
const OUT = process.env.OUT || __dirname;
require('fs').mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: PHONE, isMobile: PHONE });
  const p = await ctx.newPage(), errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(500);
  await p.click('[data-act="pick"][data-p="5"]'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 }); await p.waitForTimeout(1200);
  const P = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im, S = im.S, G = im.G; im.SET.fx = 'high'; im.SET.saver = false; im.SET.tipsOff = true;
    const cap = S.nations[0].capital, C = G.P[cap], busy = new Set(S.armies.map(a => a.at)); let P = null, bd = Infinity;
    for (const q of G.P){ if (q.sea || q.id === cap || S.owner[q.id] !== 0 || busy.has(q.id) || q.city) continue; const d = Math.hypot(q.x - C.x, q.y - C.y); if (d < bd){ bd = d; P = q; } }
    let foe = -1; bd = Infinity; for (const q of G.P){ const o = S.owner[q.id]; if (q.sea || o < 1) continue; const d = Math.hypot(q.x - P.x, q.y - P.y); if (d < bd){ bd = d; foe = o; } }
    im.fix.declareWar(0, foe); im.addArmy(0, P.id, { inf: 60, tank: 40, art: 24 }); im.addArmy(foe, P.id, { inf: 60, tank: 40, art: 24 }); im.tick();
    document.querySelectorAll('.toast').forEach(t => t.remove()); const ft = document.getElementById('ftip'); if (ft) ft.hidden = true;
    return { id: P.id, x: P.x, y: P.y, foe, battles: S.battles.slice(), hour: S.hour }; });
  if (!P.battles.includes(P.id)) errors.push('no battle at the province');
  await p.waitForFunction(() => window.U3D && U3D.has && U3D.has('tank'), null, { timeout: 30000 }).catch(() => {});
  const go = (s, dx = 0, dy = 0) => p.evaluate(([P, s, dx, dy]) => { const im = window.__im, sd = document.getElementById('side'), r = sd && sd.getBoundingClientRect(), cw = r && r.left > innerWidth*0.5 ? r.left : innerWidth, ch = document.getElementById('map').getBoundingClientRect().height;
    im.view.s = s; im.view.x = cw/2 + dx - P.x*s; im.view.y = ch/2 + dy - P.y*s; im.redraw(); }, [P, s, dx, dy]);
  // (F) the clock runs at close zoom: sample every new shot against this frame's firing points
  await go(16); await p.evaluate(() => { window.__im.S.speed = 1; window.__im.cfx.M.setReact(false); });   // (the combat reactions, recoil and the hit shake, move the figures between frames: held still here)
  const fire = await p.evaluate(async () => { const im = window.__im, raf = () => new Promise(r => requestAnimationFrame(() => r())), seen = new Set(); let n = 0, bad = [], kinds = {}, pts = 0;
    const t0 = performance.now(); while (performance.now() - t0 < 4000){ await raf(); const M = im.BFX.pts.get(im.S.battles[0]); if (!M) continue; const all = []; for (const [o, L] of M) for (const q of L){ all.push([o, q]); } pts = Math.max(pts, all.length);
      for (const pr of im.PROJ){ if (seen.has(pr.sn ?? pr) || !pr.ws) continue; seen.add(pr.sn ?? pr); n++; kinds[pr.kind] = (kinds[pr.kind] || 0) + 1;
        const src = all.find(([o, q]) => Math.hypot(q.mx - pr.from[0], q.my - pr.from[1]) < 1e-6); if (!src){ bad.push('from ' + pr.from.map(v => v.toFixed(2))); continue; }
        const near = all.some(([o, q]) => o !== src[0] && Math.hypot(q.wx - pr.to[0], q.wy - pr.to[1]) < q.r*1.5); if (!near) bad.push('to ' + pr.to.map(v => v.toFixed(2))); } }
    return { n, bad: bad.slice(0, 5), nbad: bad.length, kinds, pts, plate: im.PROJ.filter(q => !q.ws).length }; });
  console.log('fire', JSON.stringify(fire));
  if (!(fire.n >= 10)) errors.push('too few shots from the figures: ' + fire.n);
  if (fire.nbad) errors.push(`${fire.nbad} shots not from a figure's muzzle or not landing round an enemy figure: ` + fire.bad.join('; '));
  if (!(fire.kinds.tracer && (fire.kinds.shell || fire.kinds.trc))) errors.push('expected tracers and shells: ' + JSON.stringify(fire.kinds));
  // (S) pause, freeze the effects' clock, zoom and pan round the battle: every smoke puff keeps its world spot
  const anc = await p.evaluate(async P => { const im = window.__im, w = im.wfx, fr = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    im.S.speed = 0; w.freeze(performance.now()); await fr(); const sd = document.getElementById('side'), r = sd && sd.getBoundingClientRect(), cw = r && r.left > innerWidth*0.5 ? r.left : innerWidth, ch = document.getElementById('map').getBoundingClientRect().height;
    const views = [[16, 0, 0], [11, 0, 0], [20, 0, 0], [13, 120, -60], [16, -200, 40], [16, 0, 0]], shots = [];
    for (const [s, dx, dy] of views){ im.view.s = s; im.view.x = cw/2 + dx - P.x*s; im.view.y = ch/2 + dy - P.y*s; w.dbg(true); im.redraw(); await fr(); await fr();
      const m = new Map(); for (const [id, x, y, vs, vx, vy] of w.pos) if (id[0] === 's' || id[0] === 'q') m.set(id, [(x - vx)/vs, (y - vy)/vs]); w.dbg(false); shots.push(m); }
    const ref = new Map(); let worst = 0, wid = '', n = 0;
    for (const m of shots) for (const [id, q] of m){ const r0 = ref.get(id); if (!r0){ ref.set(id, q); continue; } n++; const d = Math.hypot(q[0] - r0[0], q[1] - r0[1]); if (d > worst){ worst = d; wid = id; } }
    return { worst, wid, n, per: shots.map(m => m.size), plumes: im.BSM.b.size }; }, P);
  console.log('anchor', JSON.stringify(anc));
  if (!(anc.per[0] >= 10)) errors.push('too little battle smoke drawn at close zoom: ' + anc.per[0]);
  if (!(anc.n > 40)) errors.push('too few smoke puffs compared: ' + anc.n);
  if (!(anc.worst < 0.05)) errors.push(`smoke puff ${anc.wid} moved ${anc.worst.toFixed(3)} world px while zooming/panning`);
  await p.evaluate(() => window.__im.wfx.freeze(0)); await p.waitForTimeout(3500);   // (paused: the plumes stand still, the shots' flashes and puffs run out)
  for (const [nm, s] of [['z1', 11], ['z2', 19]]){ await go(s); await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/after-anchor-${PHONE ? 'phone-' : ''}${nm}.png` }); }
  // (C) counters only: run the clock zoomed out
  await go(6.5); await p.evaluate(() => { const im = window.__im; im.S.speed = 1; im.PROJ.length = 0; });
  const far = await p.evaluate(async () => { const im = window.__im, w = im.wfx, raf = () => new Promise(r => requestAnimationFrame(() => r())); let pts = 0, shots = 0, smoke = 0, badge = 0;
    const t0 = performance.now(); while (performance.now() - t0 < 2500){ await raf(); pts = Math.max(pts, im.BFX.pts.size); shots = Math.max(shots, im.PROJ.length); }
    w.dbg(true); im.redraw(); await raf(); await raf(); smoke = w.pos.filter(e => e[0][0] === 's').length; w.dbg(false);
    badge = im.hits.filter(h => h.bg).length; im.S.speed = 0; return { pts, shots, smoke, badge }; });
  console.log('counters', JSON.stringify(far));
  if (far.pts || far.shots || far.smoke) errors.push('zoomed out to counters only there is still fire or smoke: ' + JSON.stringify(far));
  if (far.badge < 2) errors.push('the fighting plates carry no battle badge: ' + far.badge);
  console.log(JSON.stringify({ errors })); await b.close(); process.exit(errors.length ? 1 : 0); })();
