// Map modes and overlays (map-modes): node .test/map-modes.js [W H dpr] [nation] [quick]   (default 1440 900 2 'United States'; a width <= 820 is a phone)
// Env: OUT=<dir> saves screenshots (the owner's case, the two modes and each overlay); SHOTS=<prefix> names them; SEED=n seeds the random sequence.
// The map has two modes, Political and Terrain, and two overlays switched on and off over the Political map, Relations and Supply (owner's scope
// change). A nations-world game; every action goes through the buttons (on a phone the folded pill opens first). Exits 1 on any failure; prints JSON.
//  (U) UI       exactly two mode tabs and two overlay switches (no Resources, Stability, Trade, or Relations / Supply modes); in Terrain the overlays are
//               hidden (no overlay canvas) and a switch pressed there brings the Political map back with that overlay
//  (N) NO REBUILD  switching an overlay on or off never re-renders the base map (the layer's full-render count and its pixels stay as they were)
//  (O) OWNER    the owner's case: Political, + Relations, + Supply, Terrain, Political, each followed by a zoom in and a zoom out across the zoom bands
//               (wheel glide; a pinch on a phone: world view -> play zoom -> close up and back); once it settles the base layer is a fresh full render
//               of the view in that mode (pixel share that differs < 0.002) and the overlay canvas is a fresh build of the overlays shown
//  (P) PAIRS    every ordered pair of the 4 actions (Political, Terrain, Relations on/off, Supply on/off: all 16, in one circuit), each followed by a zoom
//               to the next of 3 zooms (in or out, fast steps every third) and a pan every fourth, the clock at 8x between checks; checked as (O)
//  (F) FAST     50 random actions 0-50 ms apart interleaved with wheel zooms, fast big zoom steps, drags and provinces changing hands near the view
//               (partial redraws, visDirty), the clock at 8x, at each of 3 zooms; settled, checked as (O)
//  (B) BACK     an overlay on and off again, Terrain and back, gives the same pixels as before (clock paused)
//  (W) WRAP     across the map's east-west seam (Alaska / Chukotka) switching, toggling, zooming and panning leaves no stale strip on either copy
//  (M) MEMORY   flat: the live canvas pixels (every canvas the page made, after a forced GC) and the JS heap after all of it against after a warm-up
//  (E) ERRORS   no console error or page error
const pickNation = require('./pick-nation.js'); const { chromium } = require('playwright'); const path = require('path');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), DPR = +(process.argv[4] || 2), NATION = process.argv[5] || 'United States', QUICK = process.argv[6] === 'quick', PHONE = W <= 820;
const OUT = process.env.OUT, TAG = (process.env.SHOTS || 'mm') + (PHONE ? '-phone' : ''), ACTS = ['P', 'T', 'R', 'U'];
let seed = +(process.env.SEED || 7); const rnd = () => (seed = (seed*16807) % 2147483647)/2147483647;
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--js-flags=--expose-gc'] }), errors = [], checks = {}, fails = [], t0 = Date.now();
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: PHONE, hasTouch: PHONE }); const p = await ctx.newPage();
  // every canvas the page makes, held weakly: the live canvas pixels after a GC (memory flat)
  await p.addInitScript(() => { const L = [], ce = Document.prototype.createElement; Document.prototype.createElement = function(t, o){ const e = ce.call(this, t, o); if (String(t).toLowerCase() === 'canvas') L.push(new WeakRef(e)); return e; };
    window.__cvs = () => { let px = 0, n = 0; for (const r of L){ const c = r.deref(); if (c && c.width*c.height > 1){ n++; px += c.width*c.height; } } return {n, mpx:+(px/1e6).toFixed(1)}; }; });
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('crash', () => { console.log(JSON.stringify({fails:['the page crashed (its renderer was killed: out of memory?)', ...fails], errors})); process.exit(1); });   // (a pending call would wait for ever)
  await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(600);
  await p.click('[data-act="pickscn"][data-k="world64"]'); await pickNation(p, NATION); await p.click('[data-act="begin"]'); await p.waitForTimeout(800);
  if (await p.locator('[data-act="start"]').count()) await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 60000 }); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im; im.S.speed = 0; im.SET.tipsOff = true; im.SET.saver = false; im.S.hour = 0; });   // (daylight over the Americas)
  const MAP = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const cdp = PHONE ? await ctx.newCDPSession(p) : null;
  const fail = (k, v) => { fails.push(k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v))); };
  const log = m => { if (process.env.VERBOSE) console.error(((Date.now() - t0)/1000).toFixed(0) + 's ' + m); };
  const clock = sp => p.evaluate(sp => { window.__im.S.speed = sp; }, sp);
  const settle = async () => { await clock(0); for (let i = 0, ok = 0; i < 160 && ok < 3; i++){ await p.waitForTimeout(120); ok = await p.evaluate(() => { window.__im.redraw(); return !window.__im.mapBusy(); }) ? ok + 1 : 0; } await p.waitForTimeout(120); };
  const setView = (x, y, s) => p.evaluate(([x, y, s, mw, mh]) => { const v = window.__im.view; v.s = s; v.x = mw/2 - x*s; v.y = mh/2 - y*s; window.__im.redraw(); }, [x, y, s, MAP.w, MAP.h]);
  const scale = () => p.evaluate(() => window.__im.view.s);
  const shot = async name => { if (OUT) await p.screenshot({ path: path.join(OUT, `${TAG}-${name}.png`) }); };
  const state = () => p.evaluate(() => ({mode:window.__im.mapMode, rel:window.__im.ovl.on.rel, sup:window.__im.ovl.on.sup}));
  // the buttons: a mode tab or an overlay switch (on a phone the folded pill opens first)
  const press = async (act, k) => { if (PHONE && !await p.evaluate(() => document.getElementById('modes').classList.contains('open'))) await p.click('#modes button[data-act="mode"][aria-pressed="true"]');
    await p.click(`#modes [data-act="${act}"][data-k="${k}"]`, { timeout: 30000 }); };
  const act = a => a === 'P' ? press('mode', 'political') : a === 'T' ? press('mode', 'terrain') : press('ovl', a === 'R' ? 'rel' : 'sup');
  // zoom toward scale s1 round the middle of the map: wheel steps (desktop) or a pinch (phone, real touch events); fast = big steps, no pause
  const zoom = async (s1, fast) => { const cx = MAP.x + MAP.w*0.5, cy = MAP.y + MAP.h*0.5;
    if (PHONE){ for (let k = 0; k < 8; k++){ const s = await scale(), f = s1/s; if (Math.abs(Math.log(f)) < 0.05) break; const st = Math.max(1/2.5, Math.min(2.5, f)), d0 = 60, d1 = d0*st, n = fast ? 3 : 8;
        const tp = d => [{ x: cx - d, y: cy, id: 1 }, { x: cx + d, y: cy, id: 2 }];
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(d0) });
        for (let i = 1; i <= n; i++){ await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(d0 + (d1 - d0)*i/n) }); if (!fast) await p.waitForTimeout(16); }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(fast ? 10 : 60); } return; }
    // (a glide the page cuts short, a slow frame in the headless browser: more wheel steps until the scale is there)
    await p.mouse.move(cx, cy); for (let r = 0; r < (fast ? 1 : 6); r++){ const s = await scale(); if (Math.abs(Math.log(s1/s)) < 0.04) break; const dy = -Math.log(s1/s)/0.0015, n = fast ? Math.max(1, Math.ceil(Math.abs(dy)/900)) : Math.max(1, Math.ceil(Math.abs(dy)/240));
      for (let i = 0; i < n; i++){ await p.mouse.wheel(0, dy/n); await p.waitForTimeout(fast ? 0 : 35); }
      if (!fast) for (let k = 0, last = 0; k < 40; k++){ await p.waitForTimeout(60); const v = await scale(); if (v === last) break; last = v; } } };
  const drag = async (dx, dy) => { const cx = MAP.x + MAP.w*0.45, cy = MAP.y + MAP.h*0.55;
    if (PHONE){ const tp = (x, y) => [{ x, y, id: 3 }]; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(cx, cy) }); for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(cx + dx*i/8, cy + dy*i/8) }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); return; }
    await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 8; i++) await p.mouse.move(cx + dx*i/8, cy + dy*i/8); await p.mouse.up(); await p.mouse.move(MAP.x + 4, MAP.y + 4); };
  // the base layer as it is against a fresh full render of the same view and mode, and the overlay canvas against a fresh build of the overlays
  // shown (both are left as those fresh ones)
  // (compared in strips of rows from canvas copies, so a check never holds whole-layer pixel arrays: the page's memory stays as in play)
  await p.evaluate(() => { const T = {};
    window.__mmSnap = (C, k) => { const S = T[k] || (T[k] = document.createElement('canvas')); if (S.width !== C.width || S.height !== C.height){ S.width = C.width; S.height = C.height; }
      const g = S.getContext('2d', {willReadFrequently:true}); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'copy'; g.drawImage(C, 0, 0); g.globalCompositeOperation = 'source-over'; return S; };
    window.__mmGet = k => T[k];
    window.__mmDiff = (A, B) => { if (!A || !B || A.width !== B.width || A.height !== B.height) return {share:1, size:true}; const w = A.width, h = A.height, ga = A.getContext('2d'), gb = B.getContext('2d');
      let n = 0, big = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y += 128){ const hh = Math.min(128, h - y), a = ga.getImageData(0, y, w, hh).data, b = gb.getImageData(0, y, w, hh).data;
        for (let i = 0; i < a.length; i += 4){ n++; if (Math.abs(a[i] - b[i]) > 6 || Math.abs(a[i + 1] - b[i + 1]) > 6 || Math.abs(a[i + 2] - b[i + 2]) > 6 || Math.abs(a[i + 3] - b[i + 3]) > 6){ big++; const q = i/4, x = q % w, yy = y + (q - x)/w; if (x < x0) x0 = x; if (x > x1) x1 = x; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; } } }
      return {share:+(big/n).toFixed(5), box:big ? [x0, y0, x1, y1] : null}; }; });
  const cmpFull = () => p.evaluate(() => { const im = window.__im, L = im.layer, st = {mode:im.mapMode, rel:im.ovl.on.rel, sup:im.ovl.on.sup, s:+im.view.s.toFixed(3)}; if (L.s !== im.view.s) return {...st, scaled:true, share:1};
    const a = window.__mmSnap(L, 'L'); im.renderLayer(); const base = window.__mmDiff(a, im.layer);
    const O0 = im.ovl.cv, show = im.mapMode === 'political' && (im.ovl.on.rel || im.ovl.on.sup);
    let ovl = {share:0}; if (show){ if (!O0 || O0.width !== im.layer.width) ovl = {share:1, missing:true}; else { const o = window.__mmSnap(O0, 'O'); ovl = window.__mmDiff(o, im.ovl.fresh()); } }
    else if (O0 && O0.width > 1) ovl = {share:1, leftover:true};
    return {...st, share:base.share, box:base.box, ovl:ovl.share, ovlBox:ovl.box || (ovl.missing ? 'missing' : ovl.leftover ? 'left over' : null)}; });
  const TH = 0.002;
  const check = async (tag, name) => { await settle(); const r = await cmpFull(); (checks[name] || (checks[name] = [])).push({tag, ...r}); log(name + ' ' + tag + ' ' + JSON.stringify(r));
    if (r.share > TH || r.ovl > TH || r.scaled) fail(name, {tag, ...r}); return r; };
  const mem = async () => { await p.evaluate(() => { if (window.gc){ window.gc(); window.gc(); } }); await p.waitForTimeout(200); await p.evaluate(() => { if (window.gc) window.gc(); });
    return p.evaluate(() => ({...window.__cvs(), heapMB:performance.memory ? +(performance.memory.usedJSHeapSize/1e6).toFixed(1) : null})); };
  const G0 = await p.evaluate(() => { const im = window.__im, S = im.S; return {nn:S.nations.length, map:S.map, me:S.nations[0].name, cap:[im.G.P[S.nations[0].capital].x, im.G.P[S.nations[0].capital].y], min:im.wrap.minScale()}; });
  checks.game = G0; if (G0.nn !== 68 || G0.me !== NATION) fail('game', G0);
  const home = G0.cap, Z = [Math.max(G0.min*1.05, PHONE ? 0.5 : 0.7), 2.2, 7];   // world view, play zoom (detail tiles fading in), close up (fine coast, towns)

  // (U) the buttons
  { const u = await p.evaluate(() => ({modes:[...document.querySelectorAll('#modes [data-act="mode"]')].map(b => b.dataset.k), ovls:[...document.querySelectorAll('#modes [data-act="ovl"]')].map(b => b.dataset.k)}));
    checks.ui = u; if (u.modes.join() !== 'political,terrain' || u.ovls.join() !== 'rel,sup') fail('ui: buttons', u);
    await setView(home[0], home[1], Z[1]); await settle(); await act('T'); await act('R');
    const st = await state(); if (st.mode !== 'political' || !st.rel) fail('ui: an overlay pressed in Terrain brings the Political map back with it', st);
    await act('R'); await act('U'); await act('T'); await settle();
    const t = await p.evaluate(() => ({cv:window.__im.ovl.cv ? window.__im.ovl.cv.width : 0, pressed:[...document.querySelectorAll('#modes [data-act="ovl"][aria-pressed="true"]')].length, sup:window.__im.ovl.on.sup}));
    checks.uiTerrain = t; if (t.cv > 1 || t.pressed || !t.sup) fail('ui: overlays hidden in Terrain (and remembered)', t);
    await act('P'); await act('U'); await settle(); }
  await cmpFull(); await p.evaluate(() => { window.__mmSnap(window.__im.layer, 'N'); window.__mmSnap(window.__im.layer, 'B'); });   // (the test's own copies exist before the baseline)
  const m0 = await mem(); checks.memStart = m0; log('mem start ' + JSON.stringify(m0));

  // (N) an overlay switched on and off never re-renders the base map
  { await setView(home[0], home[1], Z[1]); await settle(); await cmpFull();
    const before = await p.evaluate(() => { const L = window.__im.layer; window.__mmSnap(L, 'N'); return L.full; });
    for (const a of ['R', 'U', 'R', 'U']){ await act(a); await p.waitForTimeout(250); }
    await settle(); const after = await p.evaluate(() => { const L = window.__im.layer; return {full:L.full, d:window.__mmDiff(window.__mmGet('N'), L).share}; });
    checks.noRebuild = {before, ...after}; if (after.full !== before || after.d > 0) fail('overlay toggles re-rendered the base map', checks.noRebuild); }

  // (O) the owner's case: switch, then zoom in and out across the bands
  await setView(home[0], home[1], Z[1]); await settle();
  for (const [i, a] of ['P', 'R', 'U', 'T', 'P', 'R'].entries()){ await act(a); await p.waitForTimeout(60);
    await zoom(Z[2]); await p.waitForTimeout(300); if (i === 3) await shot('owner-terrain-zoomin-mid'); await check(a + ' zoom in', 'owner'); if (i === 3) await shot('owner-terrain-zoomin');
    await zoom(Z[0]); await p.waitForTimeout(250); await check(a + ' zoom out', 'owner'); if (i === 3) await shot('owner-terrain-zoomout');
    await zoom(Z[1]); await p.waitForTimeout(100); }
  { const st = await state(); if (st.rel){ await act('R'); } }   // (Relations off again: the owner's case ends with it on)

  // (B) back and forth: the same pixels as before
  { await setView(home[0], home[1], Z[1]); await settle(); await cmpFull();
    const snap = () => p.evaluate(() => { const im = window.__im, O = im.ovl.cv; window.__mmSnap(im.layer, 'B'); window.__mmBO = !!(O && O.width > 1); if (window.__mmBO) window.__mmSnap(O, 'BO'); });
    const same = () => p.evaluate(() => { const im = window.__im, d = window.__mmDiff(window.__mmGet('B'), im.layer).share, O = im.ovl.cv, on = !!(O && O.width > 1);
      return Math.max(d, on !== window.__mmBO ? 1 : on ? window.__mmDiff(window.__mmGet('BO'), O).share : 0); });
    const res = []; for (const seq of [['R', 'R'], ['U', 'U'], ['T', 'P'], ['R', 'T', 'P', 'R'], ['U', 'R', 'T', 'U', 'P', 'R', 'U', 'U']]){ await snap(); for (const a of seq){ await act(a); await p.waitForTimeout(40); } await zoom(Z[2], true); await zoom(Z[1]); await settle();
      const d = await same(); res.push([seq.join(''), d]); if (d > TH) fail('back', [seq.join(''), d]); }
    checks.back = res; }

  // the screenshots: the two modes and each overlay, on one view
  if (OUT){ await setView(home[0], home[1], Z[1]*1.15); const st0 = await state();
    const to = async (mode, rel, sup) => { let st = await state(); if (st.mode !== mode && mode === 'terrain') await act('T'); st = await state();
      if (mode === 'political'){ if (st.mode !== 'political') await act('P'); st = await state(); if (st.rel !== rel) await act('R'); st = await state(); if (st.sup !== sup) await act('U'); } await settle(); };
    await to('political', false, false); await shot('mode-political'); await to('terrain'); await shot('mode-terrain');
    await to('political', true, false); await shot('overlay-relations'); await to('political', false, true); await shot('overlay-supply'); await to('political', true, true); await shot('overlay-both');
    await to('political', st0.rel, st0.sup); }

  // (P) every ordered pair of the 4 actions (16, a circuit through all of them), each followed by a zoom and sometimes a pan, the clock at 8x between checks
  if (!QUICK){ const seq = ['P'], used = new Set(); for (;;){ const a = seq[seq.length - 1], nx = ACTS.find(b => !used.has(a + b) && (b !== a || ACTS.every(c => c === a || used.has(a + c)))) || ACTS.find(b => !used.has(a + b)); if (!nx) break; used.add(a + nx); seq.push(nx); }
    checks.pairsN = used.size; if (used.size !== 16) fail('pairs: circuit', used.size);
    await setView(home[0], home[1], Z[0]); await act('P'); await settle(); let zi = 0, dir = 1;
    for (let i = 1; i < seq.length; i++){ await clock(4); await act(seq[i]); await p.waitForTimeout(30); zi += dir; if (zi === 2 || zi === 0) dir = -dir; await zoom(Z[zi], i % 3 === 0);
      if (i % 4 === 0) await drag(i % 8 ? 140 : -160, i % 8 ? 60 : -50);
      await check(seq[i - 1] + '>' + seq[i] + ' z' + Z[zi], 'pairs'); } }

  // (F) fast: random actions 0-50 ms apart with zooms, drags, the clock at 8x and captures near the view (partial redraws)
  { const owners = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G; return G.P.filter(P => !P.sea && S.owner[P.id] === 0 && P.nbs.some(q => S.owner[q] !== 0 && !G.P[q].sea)).slice(0, 40).map(P => P.id); });
    for (const s of Z){ await setView(home[0], home[1], s); await settle(); await clock(4);
      for (let i = 0; i < (QUICK ? 20 : 50); i++){ const r = rnd(); await act(ACTS[Math.floor(rnd()*ACTS.length)]);
        if (r < 0.2) await zoom(s*(rnd() < 0.5 ? 1.6 : 0.62), true); else if (r < 0.3) await zoom(s, true); else if (r < 0.4) await drag((rnd() - 0.5)*300, (rnd() - 0.5)*200);
        else if (r < 0.55){ const q = owners[Math.floor(rnd()*owners.length)]; await p.evaluate(q => { const im = window.__im, S = im.S, G = im.G, P = G.P[q], o = P.nbs.map(n => S.owner[n]).find(o => o !== 0 && o >= 0); window.__mmO = window.__mmO || {}; if (!(q in window.__mmO)) window.__mmO[q] = S.owner[q]; S.owner[q] = S.owner[q] === 0 && o != null ? o : window.__mmO[q]; im.geoDirty(); }, q); }
        await p.waitForTimeout(Math.floor(rnd()*51)); }
      await zoom(s); await check('fast z' + s, 'fast'); }
    await p.evaluate(() => { const im = window.__im, S = im.S; for (const q in (window.__mmO || {})) S.owner[q] = window.__mmO[q]; window.__mmO = {}; im.geoDirty(); im.redraw(); }); await settle(); }

  // (W) the wrap seam: views either side of the map's east-west seam (Alaska / Chukotka)
  { const X0 = await p.evaluate(() => window.__im.wrap.X0), y = await p.evaluate(() => { const P = window.__im.G.P.find(P => P.cityName === 'Anchorage'); return P ? P.y : 300; });
    for (const s of [Z[0]*1.4, Z[1], Z[2]]){ await setView(X0 + 2, y, s); await settle();
      for (const a of QUICK ? ['R', 'T'] : ['R', 'T', 'P']){ await act(a); await zoom(s*1.5); await drag(PHONE ? 120 : 260, 0); await zoom(s); await check('seam ' + a + ' z' + s, 'wrap'); } } }

  // (M) memory flat: after all of it against after the warm-up (the same mode and overlays)
  { await setView(home[0], home[1], Z[1]); const st = await state(); if (st.mode !== 'political') await act('P'); if ((await state()).rel) await act('R'); if (!(await state()).sup) await act('U'); await settle();
    const m1 = await mem(); checks.memEnd = m1; log('mem end ' + JSON.stringify(m1));
    if (m1.mpx > m0.mpx*1.1 + 2) fail('memory: canvas pixels grew', {start:m0, end:m1});
    if (m0.heapMB != null && m1.heapMB > m0.heapMB*1.5 + 40) fail('memory: JS heap grew', {start:m0, end:m1}); }

  checks.errors = errors; if (errors.length) fail('errors', errors.slice(0, 5));
  const summ = {}; for (const k of ['owner', 'pairs', 'fast', 'wrap']) if (checks[k]) summ[k] = {n:checks[k].length, worstBase:Math.max(...checks[k].map(r => r.share)), worstOverlay:Math.max(...checks[k].map(r => r.ovl))};
  console.log(JSON.stringify({summary:summ, ui:checks.ui, noRebuild:checks.noRebuild, back:checks.back, mem:[checks.memStart, checks.memEnd], game:checks.game, secs:Math.round((Date.now() - t0)/1000), fails, errors}, null, 1));
  if (process.env.DUMP) console.log(JSON.stringify(checks));
  await b.close(); process.exit(fails.length ? 1 : 0); })().catch(e => { console.error(e); process.exit(1); });
