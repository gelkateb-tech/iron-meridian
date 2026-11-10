// Redraw scheduler check: node .test/rdstale.js [saver on|off] [seconds per phase]
// Plays through several situations with the scheduler live (page.html?rdlive). Whenever the last map frame registered nothing (no animation,
// no pending change, no timed change) and the scheduler is skipping frames, the canvas is read, one frame is forced, and the canvas is read
// again: a forced frame that looks different means something changed on the map without asking for a frame (a missed animation source).
// With a third argument 'amb', frames where only gentle ambient motion registered are checked too (their own pulses then show up as changes).
// Prints, per phase, how many checks ran and every stale frame found (share of pixels changed and their bounding box); exits 1 if any.
const { chromium } = require('playwright');
const sv = (process.argv[2] || 'on') === 'on', T = +(process.argv[3] || 8);
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] }), ctx = await b.newContext({ viewport: { width: 1200, height: 760 } }), p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.addInitScript(a => { window.__amb = a; }, process.argv[4] === 'amb');   // amb: also check frames where only ambient motion registered (its own changes then show too)
  await p.addInitScript(s => { try { localStorage.setItem('iron-meridian-settings', JSON.stringify({saver: s})); } catch (e) {} }, sv);
  await p.goto('file://' + __dirname + '/page.html?rdlive'); await p.waitForTimeout(900);
  await p.click('[data-act="pick"][data-p="5"]'); await p.click('[data-act="begin"]'); await p.waitForTimeout(300); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && !window.__im.camFly, null, { timeout: 20000 }); await p.waitForTimeout(1500);
  const check = () => p.evaluate(async () => { const im = window.__im, rd = im.rd, raf = () => new Promise(r => requestAnimationFrame(() => r()));
    await raf(); await raf();
    if (rd.dirty || rd.f || (rd.a && !window.__amb) || rd.nx !== Infinity || im.camFly || performance.now() < rd.until) return { busy: true };
    const amb = !!rd.a;
    const n0 = rd.n, h0 = im.S.hour; await raf(); if (rd.n !== n0) return { busy: true };
    const c = document.getElementById('map'), g = c.getContext('2d'), w = c.width, h = c.height, A = g.getImageData(0, 0, w, h).data;
    rd.dbg = {}; im.redraw(); await raf(); const why = rd.dbg; rd.dbg = null; await raf(); if (rd.n === n0 || im.S.hour !== h0) return { busy: true };
    const B = g.getImageData(0, 0, w, h).data; let n = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let i = 0; i < A.length; i += 4){ if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 40){ n++; const q = i/4, x = q % w, y = (q - x)/w; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    return { share: +(n/(w*h)).toFixed(4), n, box: n ? [x0, y0, x1, y1] : null, amb, why: n ? Object.keys(why).join(' ') : '', speed: im.S.speed, s: +im.view.s.toFixed(2) }; });
  const phases = [
    ['home, paused', async () => { await p.evaluate(() => { window.__im.S.speed = 0; }); }],
    ['home, 4x', async () => { await p.evaluate(() => { window.__im.S.speed = 4; window.__im.redraw(); }); }],   // (as the speed control does: setSpeed asks for a frame; the hook sets the speed directly)
    ['Berlin close, 4x', async () => { await p.evaluate(() => { const im = window.__im, P = im.G.P.find(q => q.cityName === 'Berlin'), s = 8; im.view.s = s; im.view.x = 600 - P.x*s; im.view.y = 380 - P.y*s; im.S.speed = 4; }); }],
    ['war: front close, 4x', async () => { await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G; const nb = new Set(); for (const P of G.P) if (S.owner[P.id] === 0) for (const v of P.nbs) if (S.owner[v] > 0) nb.add(S.owner[v]);
        const foe = [...nb][0]; if (foe != null) im.fix.declareWar(0, foe); const fp = G.P.find(P => S.owner[P.id] === 0 && P.nbs.some(v => S.owner[v] === foe)) || G.P[S.nations[0].capital], s = 4; im.view.s = s; im.view.x = 600 - fp.x*s; im.view.y = 380 - fp.y*s; S.speed = 4; }); }],
    ['army selected with an order, paused', async () => { await p.evaluate(() => { const im = window.__im, S = im.S, a = S.armies.find(x => x.owner === 0 && !x.air && x.to === null); if (!a) return; const P = im.G.P[a.at], t = P.nbs.find(v => !im.G.P[v].sea); if (t != null) im.orderMove(a, t); im.selectArmy(a.id); S.speed = 0; const s = 5; im.view.s = s; im.view.x = 600 - P.x*s; im.view.y = 380 - P.y*s; }); }],
    ['front close, paused after fighting (ambient rested)', async () => { await p.evaluate(() => { window.__im.S.speed = 0; }); await rest(); }],
    ['army selected, 4x', async () => { await p.evaluate(() => { window.__im.S.speed = 4; }); }],
    ['world, 4x', async () => { await p.evaluate(() => { const im = window.__im; im.v3c.clearSel(); im.view.s = 0.5; im.view.x = 0; im.view.y = 40; im.S.speed = 4; }); }],
    ['world, paused', async () => { await p.evaluate(() => { window.__im.S.speed = 0; }); }],
    ['army selected with an order, paused (ambient rested)', async () => { await p.evaluate(() => { const im = window.__im, S = im.S, a = S.armies.find(x => x.owner === 0 && !x.air && (x.to !== null || x.path.length)) || S.armies.find(x => x.owner === 0 && !x.air); im.selectArmy(a.id); const P = im.G.P[a.at], s = 6; im.view.s = s; im.view.x = 600 - P.x*s; im.view.y = 380 - P.y*s; }); await rest(); }],
    ['Berlin closest, paused (ambient rested)', async () => { await p.evaluate(() => { const im = window.__im, P = im.G.P.find(q => q.cityName === 'Berlin'), s = 20; im.v3c.clearSel(); im.view.s = s; im.view.x = 600 - P.x*s; im.view.y = 380 - P.y*s; }); await rest(); }],
  ];
  const rest = () => p.evaluate(() => new Promise(r => { const im = window.__im; const f = () => performance.now() - im.rd.inp > im.ambIdle() + 300 ? r() : setTimeout(f, 200); f(); }));   // (paused: the ambient motion rests)
  const out = {}; let bad = 0;
  for (const [name, set] of phases){ await set(); await p.waitForTimeout(600); const t0 = Date.now(), R = { checks: 0, busy: 0, stale: [] };
    while (Date.now() - t0 < T*1000){ const r = await check(); if (r.busy) R.busy++; else { R.checks++; if (r.share > 0.0005){ R.stale.push(r); bad++; if (R.stale.length === 1) await p.screenshot({ path: __dirname + `/rdstale-${Object.keys(out).length}.png` }); } } await p.waitForTimeout(250); }
    if (!R.checks) R.why = await p.evaluate(() => new Promise(r => { const rd = window.__im.rd; rd.dbg = {}; setTimeout(() => { const d = rd.dbg; rd.dbg = null; r(Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, 6).map(e => e.join(':')).join(' ')); }, 1000); }));   // (what kept it busy: source lines)
    out[name] = R; }
  console.log(JSON.stringify({ saver: sv, phases: out }, null, 1).replace(/\n\s+(?=[^\s{\[])/g, ' ').replace(/\n\s+}/g, ' }'));
  console.log('ERRORS', errs.length ? errs : 'none', 'STALE', bad);
  await b.close(); process.exit(errs.length || bad ? 1 : 0);
})();
