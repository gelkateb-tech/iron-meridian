// The city lights at night are small, separate glows (night-lights): node .test/night-lights.js [W H dpr]   (default 1440 900 2; PAGE=other.html)
// A nations-world game as Egypt, the clock paused at deep night over Cairo, the view over Egypt and the Levant at 3 zooms (zoomed out, middle,
// close in on the Nile delta, close in on the Levant). Each view's city lights are drawn alone on black (__im.lightsOnly: the light they add,
// nothing drawn over them), and the map canvas is read with the lights on, off (Settings) and by day. Exits 1 on any failure; prints JSON
// {checks, fails, errors}.
//  (a) GAPS     the ground midway between neighbouring towns (Cairo-Alexandria, Tanta-Mansoura, Haifa-Damascus, Tel Aviv-Beersheba, ...)
//               gets no light (the mean light in a small box there under GAP_MAX)
//  (b) CENTRED  every town of the region on screen whose glow is a few px wide has one: the brightest spot of its light (smoothed; a coastal town: on all of it or on its land)
//               within 2 css px of the town's point, and bright enough to see
//  (c) READABLE with the lights on, the borders between countries and nations in view stand out from the ground beside them (luminance step)
//               for most points sampled, and your country's colour stays apart from its neighbours' (Egypt, yours, green against Israel's and Saudi
//               Arabia's grey: the mean colours differ at night by at least half as much as by day, and by TINT_ABS; other pairs are both grey)
//  (d) CAP      the brightest light any town adds stays under LIGHT_CAP (no white blobs), and the lit pixels on screen under PIX_CAP
const pickNation = require('./pick-nation.js'); const { chromium } = require('playwright'); const path = require('path');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), DPR = +(process.argv[4] || 2), PHONE = W <= 820;
const TINT_ABS = 10, TINT_KEEP = 0.5, GAP_MAX = 4, GLOW_MIN = 6, CENTRE_PX = 2, LIGHT_CAP = 170, PIX_CAP = 230;
const VIEWS = [['out', 2350, 800, 22], ['mid', 2340, 795, 50], ['delta', 2318, 803, 120], ['levant', 2370, 776, 120]];
const PAIRS = [['Cairo', 'Alexandria'], ['Cairo', 'Tanta'], ['Tanta', 'Mansoura'], ['Mansoura', 'Zagazig'], ['Rosetta', 'Tanta'], ['Cairo', 'Suez'], ['Haifa', 'Damascus'], ['Tel Aviv', 'Haifa'],
  ['Tel Aviv', 'Beersheba'], ['Damascus', 'Daraa'], ['Damascus', 'Homs'], ['Haifa', 'Tiberias'], ['Arish', 'Beersheba'], ['Alexandria', 'Rosetta']];
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }), errors = [], checks = {gaps:[], centred:[], borders:[], tint:[], cap:[]}, fails = [];
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: PHONE, hasTouch: PHONE }); const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto('file://' + path.resolve(__dirname, process.env.PAGE || 'page.html')); await p.waitForTimeout(600);
  await p.click('[data-act="pickscn"][data-k="world64"]'); await pickNation(p, 'Egypt'); await p.click('[data-act="begin"]'); await p.waitForTimeout(800);
  if (await p.locator('[data-act="start"]').count()) await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 60000 }); await p.waitForTimeout(1500);
  const fail = (k, v) => { fails.push(k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v))); };
  // deep night over Cairo (the hour of the day with the sun lowest there)
  const night = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im, S = im.S; S.speed = 0; im.SET.tipsOff = true; im.SET.saver = false; im.SET.cityLights = true;
    const P = im.G.P.find(q => q.cityName === 'Cairo'), h0 = Math.floor(S.hour/24)*24; let bh = h0, be = 9; for (let h = h0; h < h0 + 24; h++){ S.hour = h; const e = im.sunSinEl(P.id); if (e < be){ be = e; bh = h; } } let dh = h0, de = -9; for (let h = h0; h < h0 + 24; h++){ S.hour = h; const e = im.sunSinEl(P.id); if (e > de){ de = e; dh = h; } } window.__nlH = {night:bh, day:dh};
    S.hour = bh; im.redraw(); return {hour:bh, sinEl:+be.toFixed(3), dayHour:dh}; });
  checks.night = night; if (night.sinEl > -0.5) fail('not night over Cairo', night);
  const MAP = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const settle = async () => { for (let i = 0, ok = 0; i < 200 && ok < 3; i++){ await p.waitForTimeout(150); ok = await p.evaluate(() => { window.__im.redraw(); return !window.__im.mapBusy(); }) ? ok + 1 : 0; } await p.waitForTimeout(400); };
  const setView = (x, y, hp) => p.evaluate(([x, y, hp, mw, mh]) => { const v = window.__im.view, s = hp/12; v.s = s; v.x = mw/2 - x*s; v.y = mh/2 - y*s; window.__im.redraw(); }, [x, y, hp, MAP.w, MAP.h]);
  // the map canvas as it is now (lights on: window.__nlOn, off: window.__nlOff)
  const grab = k => p.evaluate(k => { const c = document.getElementById('map'); window[k] = {w:c.width, h:c.height, d:c.getContext('2d').getImageData(0, 0, c.width, c.height).data}; }, k);
  for (const [tag, cx, cy, hp] of VIEWS.filter(V => !process.env.ONLY || V[0] === process.env.ONLY)){ await setView(cx, cy, hp);
    await p.evaluate(() => { window.__im.SET.cityLights = true; window.__im.redraw(); }); await settle(); await grab('__nlOn'); await p.evaluate(() => { window.__nlL = window.__im.lightsOnly ? window.__im.lightsOnly() : null; });
    if (process.env.OUT) await p.screenshot({ path: `${process.env.OUT}/nl-${tag}.png` });
    await p.evaluate(() => { window.__im.SET.cityLights = false; window.__im.redraw(); }); await settle(); await grab('__nlOff');
    await p.evaluate(() => { window.__im.S.hour = window.__nlH.day; window.__im.redraw(); }); await settle(); await grab('__nlDay');   // (the same view by day: the colours' contrast to keep)
    await p.evaluate(() => { window.__im.S.hour = window.__nlH.night; window.__im.redraw(); });
    await p.evaluate(() => { window.__im.SET.cityLights = true; window.__im.redraw(); });
    const r = await p.evaluate(([PAIRS, A]) => { const im = window.__im, G = im.G, S = im.S, v = im.view, On = window.__nlOn, Off = window.__nlOff, Day = window.__nlDay, Lt = window.__nlL, s = v.s;
      const M = document.getElementById('map').getBoundingClientRect(), WW = im.wrap.WW, dp = On.w/M.width;
      const scr = (x, y) => { for (const k of [0, -1, 1]){ const X = (x + k*WW)*s + v.x, Y = y*s + v.y; if (X > 0 && X < M.width && Y > 0 && Y < M.height) return [X, Y]; } return null; };
      const inMap = (q, m) => q && q[0] > m && q[0] < M.width - m && q[1] > m && q[1] < M.height - m;
      const lum = (d, o) => 0.2126*d[o] + 0.7152*d[o + 1] + 0.0722*d[o + 2];
      const at = (X, Y) => ((Math.round(Y*dp))*On.w + Math.round(X*dp))*4;
      const add = (X, Y) => { const o = at(X, Y); return lum(On.d, o) - lum(Off.d, o); };   // (on the screen: what the lights change, the names' halos included)
      const lt = (X, Y) => Lt ? lum(Lt.d, at(X, Y)) : Math.max(0, add(X, Y));   // the lights alone (an older page without the hook: the screen's difference)
      const box = (X, Y, r) => { let t = 0, n = 0; for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++){ t += lt(X + i/dp, Y + j/dp); n++; } return t/n; };
      const city = n => G.P.find(P => P.cityName === n);
      // (a) midway between neighbouring towns
      const gaps = []; for (const [a, b2] of PAIRS){ const A1 = city(a), B1 = city(b2); if (!A1 || !B1) continue; const qa = scr(A1.x, A1.y), qb = scr(B1.x, B1.y); if (!inMap(qa, 30) || !inMap(qb, 30)) continue;
        const mx = (A1.x + B1.x)/2, my = (A1.y + B1.y)/2; if (im.isWet(mx, my)) continue; const q = scr(mx, my); if (!inMap(q, 20)) continue;
        gaps.push({pair:a + '-' + b2, px:Math.round(Math.hypot(qa[0] - qb[0], qa[1] - qb[1])), add:+box(q[0], q[1], 2).toFixed(1)}); }
      // (b) each town's glow on its point: the brightest of its light, smoothed over a box 0.8 of the glow's radius wide; (d) the brightest light
      const cen = []; let mxAdd = 0, mxPix = 0, mxAt = null;
      for (let o = 0; Lt && o < Lt.d.length; o += 4){ const l = lum(Lt.d, o); if (l > mxAdd){ mxAdd = l; mxAt = o; } if (l > 8 && lum(Off.d, o) < 95) mxPix = Math.max(mxPix, lum(On.d, o)); }   // (lit pixels on screen: not where a name or counter is drawn over them)
      if (mxAt != null){ const X = (mxAt/4) % Lt.w/dp, Y = Math.floor(mxAt/4/Lt.w)/dp, P = G.P[im.provAt(X, Y)]; mxAt = P ? P.cityName || P.name : '?'; }
      for (const P of G.P){ if (!P.city || P.sea) continue; const lon = (((P.cc % WORLD.W) + 0.5)/WORLD.W*360 + WORLD.lon0 + 540) % 360 - 180; if (lon < 24 || lon > 42 || P.lat < 22 || P.lat > 38) continue;   // (Egypt and the Levant, and round them)
        const q = scr(P.x, P.y); if (!inMap(q, 60)) continue; const R = im.nightR ? im.nightR(P.id) : {glow:KM_W*20}, gR = R.glow*s;   // (an older page without the hook: a typical glow)
        if (gR < 2.5 || Math.abs(im.sunSinEl(P.id)) < 0.2) continue;   // (a glow of a few px at least; deep night only)
        const bR = Math.max(1, Math.round(0.4*gR*dp)), wR = Math.ceil(0.6*gR*dp), X0 = Math.round(q[0]*dp), Y0 = Math.round(q[1]*dp);
        // the centre found on all the light (land and sea: a coastal town's glow is drawn over both) and, for a coastal town, on the land only (its
        // lit streets stop at the shore: the light in each box divided by the land in it); the nearer of the two counts (integral images)
        const n = 2*(wR + bR) + 1, area = (2*bR + 1)**2; let coast = false, pick = null;
        for (const land of [false, true]){ if (land && !coast) break; const I = new Float64Array((n + 1)*(n + 1)), Lw = new Float64Array((n + 1)*(n + 1));
          for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){ const X = X0 - wR - bR + i, Y = Y0 - wR - bR + j, o = (Y*On.w + X)*4, ins = X >= 0 && Y >= 0 && X < On.w && Y < On.h, wet = ins && (land || !coast) && im.isWet((X/dp - v.x)/s, (Y/dp - v.y)/s);
            if (wet) coast = true; const w = ins && !(land && wet) ? 1 : 0, a2 = w ? (Lt ? lum(Lt.d, o) : Math.max(0, lum(On.d, o) - lum(Off.d, o))) : 0, q0 = j*(n + 1) + i + 1, q1 = (j + 1)*(n + 1) + i, q2 = j*(n + 1) + i, q3 = (j + 1)*(n + 1) + i + 1;
            I[q3] = a2 + I[q0] + I[q1] - I[q2]; Lw[q3] = w + Lw[q0] + Lw[q1] - Lw[q2]; }
          const sum = (A2, i0, j0, i1, j1) => A2[j1*(n + 1) + i1] - A2[j0*(n + 1) + i1] - A2[j1*(n + 1) + i0] + A2[j0*(n + 1) + i0];
          let best = -1, bx = 0, by = 0; for (let j = -wR; j <= wR; j++) for (let i = -wR; i <= wR; i++){ if (i*i + j*j > wR*wR) continue; const ci = i + wR + bR, cj = j + wR + bR, m = sum(I, ci - bR, cj - bR, ci + bR + 1, cj + bR + 1)/Math.max(0.35*area, sum(Lw, ci - bR, cj - bR, ci + bR + 1, cj + bR + 1));
            if (m > best + 1e-9 || (Math.abs(m - best) < 1e-9 && i*i + j*j < bx*bx + by*by)){ best = m; bx = i; by = j; } }
          const c = {peak:+best.toFixed(1), off:+(Math.hypot(bx, by)/dp).toFixed(2), land}; if (!pick || c.off < pick.off) pick = c; }
        cen.push({city:P.cityName, glowPx:+gR.toFixed(1), peak:pick.peak, off:pick.off, ...(coast ? {coast:true, onLand:pick.land} : {})}); }
      // (c) borders in view: the line stands out from the ground beside it (on the canvas with the lights on)
      const res = {country:[0, 0], nation:[0, 0], prov:[0, 0]};
      for (const c of im.geo.chains){ if (c.a < 0 || c.b < 0) continue; const A1 = G.P[c.a], B1 = G.P[c.b]; if (A1.sea || B1.sea || c.pts.length < 6) continue;
        const kind = A1.country !== B1.country ? 'country' : S.owner[c.a] !== S.owner[c.b] ? 'nation' : 'prov', R0 = res[kind]; if (R0[1] >= 60) continue;
        const i = c.pts.length >> 1, pt = c.pts[i], q0 = c.pts[i - 2], q1 = c.pts[i + 2], q = scr(pt[0], pt[1]); if (!inMap(q, 40) || im.isWet(pt[0], pt[1])) continue;
        const tx = q1[0] - q0[0], ty = q1[1] - q0[1], tl = Math.hypot(tx, ty) || 1, nx = -ty/tl, ny = tx/tl, d = 5;   // 5 css px either side
        const L = (X, Y) => lum(On.d, at(X, Y)), la = L(q[0] + nx*d, q[1] + ny*d), lb = L(q[0] - nx*d, q[1] - ny*d);
        let st = 0; for (const f of [-1.2, -0.6, 0, 0.6, 1.2]) st = Math.max(st, Math.abs(L(q[0] + nx*f, q[1] + ny*f) - (la + lb)/2));
        R0[1]++; if (st >= 5) R0[0]++; }
      // (c) the countries' colours: the mean colour of each nation's land on a grid over the screen (away from the towns' lights)
      const nat = {}, acc = {}; for (let Y = 30; Y < M.height - 30; Y += 5) for (let X = 30; X < M.width - 30; X += 5){ const wx = (X - v.x)/s, wy = (Y - v.y)/s; if (im.isWet(wx, wy)) continue; const pp = im.provAt(X, Y); if (pp == null || pp < 0 || G.P[pp].sea) continue;
          const nn = S.owner[pp], N = S.nations[nn]; if (!N || !A.includes(N.name) || Math.abs(add(X, Y)) > 2) continue; const o = at(X, Y), e = acc[N.name] || (acc[N.name] = [0, 0, 0, 0, 0, 0, 0]); e[0] += On.d[o]; e[1] += On.d[o + 1]; e[2] += On.d[o + 2]; e[3]++; e[4] += Day.d[o]; e[5] += Day.d[o + 1]; e[6] += Day.d[o + 2]; }
      for (const k of Object.keys(acc)){ const e = acc[k]; nat['#' + k] = e[3]; if (e[3] >= 40){ nat[k] = [e[0]/e[3], e[1]/e[3], e[2]/e[3]].map(Math.round); nat['day ' + k] = [e[4]/e[3], e[5]/e[3], e[6]/e[3]].map(Math.round); } }
      return {gaps, cen, mxAdd:Math.round(mxAdd), mxAt, mxPix:Math.round(mxPix), res, nat}; }, [PAIRS, ['Egypt', 'Israel', 'Syria', 'Saudi Arabia', 'Turkey', 'Iraq']]);
    for (const g of r.gaps){ checks.gaps.push({tag, ...g}); if (g.add > GAP_MAX) fail(`gap ${tag} ${g.pair}`, g); }
    if (!r.gaps.length) fail(`gap ${tag}: no pair of towns in view`, '');
    const bad = r.cen.filter(c => c.peak < GLOW_MIN || c.off > CENTRE_PX); checks.centred.push({tag, towns:r.cen.length, worstOff:Math.max(0, ...r.cen.map(c => c.off)), dimmest:Math.min(255, ...r.cen.map(c => c.peak)), bad});
    if (!r.cen.length) fail(`centred ${tag}: no town in view`, ''); for (const c of bad) fail(`centred ${tag} ${c.city}`, c);
    checks.borders.push({tag, ...r.res}); for (const k of ['country', 'nation', 'prov']){ const [ok, n] = r.res[k]; if (n >= 6 && ok < n*0.7) fail(`borders ${tag} ${k}`, r.res[k]); }
    if (r.res.country[1] + r.res.nation[1] < 4 && !(PHONE && tag === 'delta')) fail(`borders ${tag}: too few country borders in view`, r.res);   // (the phone's narrow view of the delta holds none: its province borders are checked)
    const N = Object.keys(r.nat).filter(k => /^[A-Z]/.test(k)), cd = (a, b2) => Math.abs(a[0] - b2[0]) + Math.abs(a[1] - b2[1]) + Math.abs(a[2] - b2[2]), pairs = [];
    for (const [a, b2] of [['Egypt', 'Israel'], ['Israel', 'Syria'], ['Syria', 'Saudi Arabia'], ['Egypt', 'Saudi Arabia'], ['Syria', 'Turkey'], ['Syria', 'Iraq']]) if (r.nat[a] && r.nat[b2]) pairs.push({pair:a + '-' + b2, d:cd(r.nat[a], r.nat[b2]), day:cd(r.nat['day ' + a], r.nat['day ' + b2])});
    checks.tint.push({tag, nat:r.nat, pairs}); for (const q of pairs) if (/^Egypt-/.test(q.pair) && q.d < Math.max(TINT_ABS, TINT_KEEP*q.day)) fail(`tint ${tag} ${q.pair}: colours too close at night`, q);   // (owner, playtest: yours green, every other country grey: only your country's border pairs must stay apart)
    if (N.length >= 2 && !pairs.length) fail(`tint ${tag}: no neighbouring pair in view`, N);
    checks.cap.push({tag, maxAdd:r.mxAdd, at:r.mxAt, maxLitPixel:r.mxPix}); if (r.mxAdd > LIGHT_CAP) fail(`cap ${tag}: a town adds ${r.mxAdd} (${r.mxAt})`, ''); if (r.mxPix > PIX_CAP) fail(`cap ${tag}: lit pixel ${r.mxPix}`, ''); }
  console.log(JSON.stringify({ checks, fails, errors }, null, 1)); await b.close(); process.exit(fails.length || errors.length ? 1 : 0); })();
