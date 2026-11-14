// Real borders (tools/build-borders.py, borders.js / borders-hi.js): node .test/borders-real.js [W H dpr]   (default 1440 900 2)
// A nations-world game as the United States, the clock paused, daylight. Exits 1 on any failure; prints JSON {checks, fails, errors}.
//  (R) REAL     200 points along Natural Earth's admin-0 land borders (10m) in the Middle East, Europe and the US (.test/fixtures/
//               borders-real-pts.json, made by python3 tools/build-borders.py --sample: borders inside one game country, such as Cyprus's,
//               left out; across a lake the border is the dashed lake line: its geometry is checked): at a close zoom (hexPx 100) the country border drawn on the layer passes within 1.5 css px of every point: the
//               geometry stroked (its distance to the point) and the pixels (a layer drawn with and without the border lines: a changed
//               pixel within 1.5 css px)
//  (G) GAPS     along shared borders of two provinces of different owners, the tint (its own canvas) covers both sides right up to the
//               line (1.5 css px off it) in each side's own colour: no gap, no sliver of the wrong colour
//  (P) PROVINCE province borders are on the layer at 3 zooms (hexPx 20, 48, 120): a line pixel within 1.5 css px of points along them
//  (T) TAPS     a point 2 css px either side of a province border picks the province drawn there (provAtV), and real clicks select it
//  (W) WRAP     across the map's east-west seam (St Lawrence Island, Alaska, cut by the seam): the tint on both sides, and a tap on each
//               side picks the island's province, from both copies of the world
const pickNation = require('./pick-nation.js'); const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), DPR = +(process.argv[4] || 2), PHONE = W <= 820;
const PTS = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'borders-real-pts.json'), 'utf8'));
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }), errors = [], checks = {}, fails = [];
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: PHONE, hasTouch: PHONE }); const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(600);
  await p.click('[data-act="pickscn"][data-k="world64"]'); await pickNation(p, 'United States'); await p.click('[data-act="begin"]'); await p.waitForTimeout(800);
  if (await p.locator('[data-act="start"]').count()) await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 90000 }); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im; im.S.speed = 0; im.SET.tipsOff = true; im.SET.saver = false; });
  const MAP = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(), sd = document.getElementById('side'), q = sd && sd.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, side: q && q.width && q.left > r.left + 100 ? q.left - r.left : r.width }; });
  const T0 = Date.now(), log = m => process.stderr.write(((Date.now() - T0)/1000).toFixed(0) + 's ' + m + '\n');
  const fail = (k, v) => { fails.push(k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v))); };
  // in-page helpers
  await p.evaluate(() => { const im = window.__im, WD = window.WORLD;
    const miller = l => 1.25*Math.log(Math.tan(Math.PI/4 + 0.4*l*Math.PI/180)), YMAX = miller(WD.latN), YMIN = miller(WD.latS);
    window.__br = {
      ll(lon, lat){ const gx = ((lon - WD.lon0) % 360 + 360) % 360/360*WD.W - 0.5, gy = (YMAX - miller(lat))/(YMAX - YMIN)*(WD.H - 1); return [8 + 2*Math.sqrt(3) + 4*Math.sqrt(3)*gx, 12 + 6*gy]; },
      view(x, y, hexPx, mw, mh){ const v = im.view; v.s = hexPx/12; v.x = mw/2 - x*v.s; v.y = mh/2 - y*v.s; },
      sun(lon){ im.S.hour = Math.round((((-(lon + 80)/15) % 24) + 24) % 24); },
      // a full render of the view; the layer's device pixels (and the tint canvas's) by world point (the copy of the layer that holds it)
      // a full render of the view (lines: which border lines are drawn); the layer's pixels are read in small windows round the points asked
      img(lines = 7){ window.__bvLines = lines; try { im.renderLayer(); } finally { delete window.__bvLines; } return {L:im.layer}; },
      win(I, x, y, r, tint){ const q = this.dpx(I, x, y); if (!q) return null; const dp = I.L.dp || 2, R = Math.ceil(r*dp) + 1, c = tint ? I.L.tc : I.L;
        return {R, d:c.getContext('2d').getImageData(q[0] - R, q[1] - R, 2*R + 1, 2*R + 1).data}; },
      dpx(I, x, y){ const L = I.L, s = L.s, dp = L.dp || 2, WW = im.wrap.W, ox = L.vx + L.mx, oy = L.vy + L.my;
        for (const k of [0, -1, 1]){ const X = Math.round(dp*((x + k*WW)*s + ox)), Y = Math.round(dp*(y*s + oy)); if (X >= 4 && Y >= 4 && X < L.width - 4 && Y < L.height - 4) return [X, Y]; } return null; },
      // the largest colour change between two renders within r css px of a world point
      diffWin(a, b, r, dp){ if (!a || !b) return -1; const R = a.R, rr = r*dp, w = 2*R + 1; let m = 0;
        for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++){ if (dx*dx + dy*dy > rr*rr) continue; const o = ((dy + R)*w + dx + R)*4; const d = Math.abs(a.d[o] - b.d[o]) + Math.abs(a.d[o + 1] - b.d[o + 1]) + Math.abs(a.d[o + 2] - b.d[o + 2]); if (d > m) m = d; }
        return m; },
      // the largest change within r css px of each point between a render with the lines asked and one without them
      diffPts(pts, linesA, linesB, r){ const A = this.img(linesA), wa = pts.map(([x, y]) => this.win(A, x, y, r)), B = this.img(linesB), dp = A.L.dp || 2;
        return pts.map(([x, y], i) => this.diffWin(wa[i], this.win(B, x, y, r), r, dp)); },
      // distance (css px) from a world point to the drawn chains of a list at the current band
      distTo(list, x, y){ const band = im.lodBand(im.hexPx()), s = im.view.s; let best = Infinity;
        for (const c of list){ const f = c.vec ? (band === 2 && im.BV.f2 ? im.BV.f2[c.i] : im.BV.f1[c.i]) : null; if (!f) continue; const sh = c.sh || 0;
          for (let j = 0; j + 3 < f.length; j += 2){ const ax = f[j] + sh, ay = f[j + 1], bx = f[j + 2] + sh, by = f[j + 3]; if (Math.max(ax, bx) < x - 1 || Math.min(ax, bx) > x + 1 || Math.max(ay, by) < y - 1 || Math.min(ay, by) > y + 1) continue;
            const dx = bx - ax, dy = by - ay, L2 = dx*dx + dy*dy, t = L2 ? Math.max(0, Math.min(1, ((x - ax)*dx + (y - ay)*dy)/L2)) : 0, d = Math.hypot(ax + dx*t - x, ay + dy*t - y); if (d < best) best = d; } }
        return best*s; },
      onScr(x, y, m, mw, mh){ const v = im.view, sx = x*v.s + v.x, sy = y*v.s + v.y; return sx > m && sx < mw - m && sy > m && sy < mh - m; },
      // points along province borders (land both sides, both owned or independent) in view at the band: [x, y, nx, ny (unit normal, left side), left, right]
      arcPts(kind, n, mw, mh, otherOwner){ const G = im.G, S = im.S, band = im.lodBand(im.hexPx()), list = kind === 'c' ? im.GEO.countryL : im.GEO.provL, out = [];
        for (const c of list){ if (c.dup || c.a < 0 || c.b < 0) continue; if (otherOwner && S.owner[c.a] === S.owner[c.b]) continue; const f = band === 2 && im.BV.f2 ? im.BV.f2[c.i] : im.BV.f1[c.i];
          const n = f.length, e0 = [f[0], f[1]], e1 = [f[n - 2], f[n - 1]], s = im.view.s;
          for (let j = 2; j + 3 < n; j += 10){ const ax = f[j], ay = f[j + 1], bx = f[j + 2], by = f[j + 3], L = Math.hypot(bx - ax, by - ay); if (L*s < 1) continue; const x = (ax + bx)/2, y = (ay + by)/2;
            if (Math.hypot(x - e0[0], y - e0[1])*s < 8 || Math.hypot(x - e1[0], y - e1[1])*s < 8) continue;   // (not at a junction: a third province is there)
            if (!this.onScr(x, y, 60, mw, mh) || im.isWet(x, y)) continue; out.push([x, y, -(by - ay)/L, (bx - ax)/L, c.a, c.b]); } }
        const st = Math.max(1, Math.floor(out.length/n)); return out.filter((_, i) => i % st === 0).slice(0, n); } }; });
  // (the checks render the layer themselves: wait for the fine borders, not for every town's art)
  const settle = async () => { for (let i = 0, ok = 0; i < 60 && ok < 2; i++){ await p.waitForTimeout(150); ok = await p.evaluate(() => { window.__im.redraw(); return window.__im.bvHiWanted(); }) ? ok + 1 : 0; } };
  const go = async (lon, lat, hexPx) => { await p.evaluate(([lon, lat, hexPx, mw, mh]) => { const B = window.__br, [x, y] = B.ll(lon, lat); B.sun(lon); B.view(x, y, hexPx, mw, mh); window.__im.bvWantHi(); window.__im.redraw(); }, [lon, lat, hexPx, MAP.side, MAP.h]); await settle(); };
  const G0 = await p.evaluate(() => ({map:window.__im.G === mapOf(MAP_NEW) ? 1 : 0, bv:!!(window.__im.GEO && window.__im.GEO.bv), arcs:window.__im.BV.f1 ? window.__im.BV.f1.length : 0}));
  checks.game = G0; if (!G0.bv || G0.map !== 1) fail('game', G0);
  await go(36, 33.5, 100); checks.hi = await p.evaluate(() => !!window.__im.BV.f2); if (!checks.hi) fail('hi', 'borders-hi.js not loaded at close zoom');

  // (R) real borders: every sample point within 1.5 css px of the drawn country border (geometry and pixels). One view per cluster: the view
  //     is centred on the first point left, and every point left in it (60 css px from its edges) is checked with the same two renders
  { const res = {n:0, geomOk:0, pixOk:0, maxPx:0, byRegion:{}, views:0}, bad = [], left = PTS.slice();
    while (left.length){ const q0 = left[0]; if (res.views % 10 === 0) log('real ' + res.n + '/' + PTS.length);
      const rs = await p.evaluate(([lon, lat, mw, mh, pts]) => { const B = window.__br, im = window.__im, [x0, y0] = B.ll(lon, lat); B.sun(lon); B.view(x0, y0, 100, mw, mh);
        const inV = pts.map(q => { const [x, y] = B.ll(q.lon, q.lat); return B.onScr(x, y, 60, mw, mh) ? [x, y] : null; }), idx = inV.map((v, i) => v ? i : -1).filter(i => i >= 0); idx.includes(0) || idx.unshift(0); if (!inV[0]) inV[0] = [x0, y0];
        const xy = idx.map(i => inV[i]), m = B.diffPts(xy, 7, 1, 1.5);
        return idx.map((i, j) => ({i, d:B.distTo(im.GEO.countryL, xy[j][0], xy[j][1]), m:m[j], wet:im.isWet(xy[j][0], xy[j][1])})); }, [q0.lon, q0.lat, MAP.side, MAP.h, left]);
      res.views++; const done = new Set();
      for (const r of rs){ const q = left[r.i]; done.add(r.i);
        res.n++; const reg = res.byRegion[q.r] || (res.byRegion[q.r] = {n:0, ok:0, maxPx:0}); reg.n++;
        const ok = r.d <= 1.5 && (r.m >= 60 || r.wet); if (r.wet) res.lake = (res.lake || 0) + 1;
        if (r.d <= 1.5) res.geomOk++; if (r.m >= 60 || r.wet) res.pixOk++; if (ok) reg.ok++; reg.maxPx = Math.max(reg.maxPx, +r.d.toFixed(3)); res.maxPx = Math.max(res.maxPx, +r.d.toFixed(3));
        if (!ok) bad.push({...q, d:+r.d.toFixed(2), m:r.m}); }
      for (let i = left.length - 1; i >= 0; i--) if (done.has(i)) left.splice(i, 1); }
    checks.real = res; if (bad.length) fail('real', bad.slice(0, 12)); }

  // (G) tint up to the line on both sides, each side its owner's colour
  { const res = {n:0, ok:0}, bad = [];
    for (const [lon, lat] of [[37.5, 36.6], [7.5, 49.2], [-79, 43.0], [-106, 31.8], [21, 42.5], [44.5, 33.5]]){ await go(lon, lat, 90);
      const r = await p.evaluate(([mw, mh]) => { const B = window.__br, im = window.__im, I = B.img(7), dp = I.L.dp || 2, cv = document.createElement('canvas').getContext('2d'), out = [], tint = n => n >= 0 ? im.tintOf(n) : null, hex = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
        for (const [x, y, nx, ny, a, b] of B.arcPts('c', 30, mw, mh, true).concat(B.arcPts('p', 10, mw, mh, false))){ const s = 1.5/im.view.s;
          for (const [side0, sg] of [[a, 1], [b, -1]]){ const qx = x + nx*s*sg, qy = y + ny*s*sg; if (im.isWet(qx, qy)) continue;
            // the province whose drawn shape holds the point (this side's, else whichever: a bend or a narrow neighbour); none: a gap
            const band = im.lodBand(im.hexPx()), has = q => cv.isPointInPath(im.provFill(q, band), qx, qy); let side = [side0, side0 === a ? b : a].find(has);
            if (side === undefined) side = im.G.P.find(P => !P.sea && P.vbox && qx >= P.vbox[0] && qx <= P.vbox[2] && qy >= P.vbox[1] && qy <= P.vbox[3] && has(P.id)); side = side && side.id !== undefined ? side.id : side;
            if (side === undefined){ out.push({ok:false, gap:true, side:side0, x:+qx.toFixed(2), y:+qy.toFixed(2)}); continue; } const q = B.win(I, x + nx*s*sg, y + ny*s*sg, 0, true); if (!q) continue;   // (the tint stops at a lake's shore) const o = (q.R*(2*q.R + 1) + q.R)*4, T = q.d, al = T[o + 3];
            const o2 = im.S.owner[side], want = o2 >= 0 ? tint(o2) : im.tintOf(-1, im.G.P[side].country), col = [T[o], T[o + 1], T[o + 2]], w = hex(want), dc = Math.abs(col[0] - w[0]) + Math.abs(col[1] - w[1]) + Math.abs(col[2] - w[2]);
            out.push({ok:al >= 180 && dc <= 60, al, dc, side, x:+x.toFixed(2), y:+y.toFixed(2)}); } }
        return out; }, [MAP.side, MAP.h]);
      for (const x of r){ res.n++; if (x.ok) res.ok++; else bad.push({lon, lat, ...x}); } }
    checks.gaps = res; if (!res.n || res.ok < res.n) fail('gaps', bad.slice(0, 10)); }

  // (P) province borders at 3 zooms
  { const res = {};
    for (const hz of [20, 48, 120]){ await go(9, 48.5, hz);
      const r = await p.evaluate(([mw, mh]) => { const B = window.__br, pts = B.arcPts('p', 60, mw, mh, false), m = B.diffPts(pts, 7, 0, 1.5); let ok = 0;
        for (const v of m) if (v >= 40) ok++; return {n:pts.length, ok}; }, [MAP.side, MAP.h]);
      res['hexPx' + hz] = r; if (r.n < 10 || r.ok < 0.95*r.n) fail('province borders hexPx ' + hz, r); }
    checks.province = res; }

  // (T) taps: 2 css px either side of a border picks that side's province; real clicks select it
  { const res = {n:0, ok:0, clicks:0, clickOk:0}, bad = [];
    for (const [lon, lat] of [[36.5, 34], [6.2, 49.6], [-71.5, 41.8], [20.5, 44]]){ await go(lon, lat, 120);
      const r = await p.evaluate(([mw, mh]) => { const B = window.__br, im = window.__im, v = im.view, cv = document.createElement('canvas').getContext('2d'), out = [];
        for (const [x, y, nx, ny, a, b] of B.arcPts('p', 20, mw, mh, false).concat(B.arcPts('c', 20, mw, mh, false))) for (const [side, sg] of [[a, 1], [b, -1]]){ const s = 2/v.s, wx = x + nx*s*sg, wy = y + ny*s*sg, sx = wx*v.s + v.x, sy = wy*v.s + v.y;
          if (!cv.isPointInPath(im.provFill(side, im.lodBand(im.hexPx())), wx, wy)) continue; out.push({side, got:im.provAtV(sx, sy), sx, sy}); }
        return out; }, [MAP.side, MAP.h]);
      for (const x of r){ res.n++; if (x.got === x.side) res.ok++; else bad.push({lon, lat, ...x}); }
      // a few real clicks, away from towns and forces
      const cand = r.filter(x => x.got === x.side).filter((_, i) => i % 7 === 3).slice(0, 3);
      for (const c of cand){ const clear = await p.evaluate(([sx, sy]) => { const im = window.__im, v = im.view, wx = (sx - v.x)/v.s, wy = (sy - v.y)/v.s; return !im.G.P.some(P => P.city && Math.hypot(P.x - wx, P.y - wy)*v.s < 60) && !im.S.armies.some(a => { const P = im.G.P[a.at]; return Math.hypot(P.x - wx, P.y - wy)*v.s < 80; }); }, [c.sx, c.sy]);
        if (!clear) continue; await p.evaluate(() => window.__im.clearSel && window.__im.clearSel()); await p.mouse.click(MAP.x + c.sx, MAP.y + c.sy); await p.waitForTimeout(200);
        const got = await p.evaluate(() => window.__im.sel.prov); res.clicks++; if (got === c.side) res.clickOk++; else bad.push({click:true, ...c, sel:got}); await p.keyboard.press('Escape'); }
    }
    checks.taps = res; if (res.ok < res.n || res.clickOk < res.clicks || !res.clicks) fail('taps', bad.slice(0, 10)); }

  // (W) the seam: St Lawrence Island (Alaska) crosses it; tint and taps on both sides, from both copies of the world
  { const res = [];
    for (const k of [0, 1]){ await go(-169.3, 63.4, 60); if (k) await p.evaluate(() => { const im = window.__im; im.view.x -= im.wrap.W*im.view.s; im.redraw(); }); await settle();
      const r = await p.evaluate(() => { const B = window.__br, im = window.__im, I = B.img(7), v = im.view, out = [];
        // a point of the island on each side of the seam (lon -169): found on the shape itself
        const F = im.provFill(im.provAtV(...(() => { const [x, y] = B.ll(-170.3, 63.5); const X = x + Math.round(((-v.x + 300)/v.s - x)/im.wrap.W)*im.wrap.W; return [X*v.s + v.x, y*v.s + v.y]; })()), 2), cv = document.createElement('canvas').getContext('2d'), pick = (l0, l1) => { for (let lat = 63.2; lat <= 63.7; lat += 0.05) for (let lon = l0; lon <= l1; lon += 0.05){ const [x, y] = B.ll(lon, lat); if (cv.isPointInPath(F, x, y) || cv.isPointInPath(F, x - im.wrap.W, y) || cv.isPointInPath(F, x + im.wrap.W, y)) return [lon, lat]; } return [l0, 63.4]; };
        for (const [lon, lat] of [pick(-170.6, -169.3), pick(-168.95, -168.7)]){ let [x, y] = B.ll(lon, lat); x += Math.round((( -v.x + 300)/v.s - x)/im.wrap.W)*im.wrap.W; const q = B.win(I, x, y, 0, true), o = q ? (q.R*(2*q.R + 1) + q.R)*4 : -1;
          const got = im.provAtV(x*v.s + v.x, y*v.s + v.y), P = got >= 0 ? im.G.P[got] : null; out.push({lon, al:q ? q.d[o + 3] : -1, prov:got, ctry:P && !P.sea ? im.G.countries[P.country].name : 'sea'}); }
        return out; });
      res.push(...r); for (const x of r) if (x.al < 180 || x.ctry !== 'United States of America') fail('wrap copy ' + k, x); }
    checks.wrap = res; }

  // (U) towns and forces: each land province's spot (P.x, P.y: where its town, its counters and its forces at rest are drawn) inside its own
  //     drawn shape, or at most 1 css px out at the closest zoom (ZMAX 20 px a world unit)
  { const r = await p.evaluate(() => { const im = window.__im, G = im.G, cv = document.createElement('canvas').getContext('2d'), out = [];
      const inP = (q, x, y) => cv.isPointInPath(im.provFill(q, 2), x, y, 'nonzero');
      for (const P of G.P){ if (P.sea || !P.cells.length || inP(P.id, P.x, P.y)) continue; let other = -1;
        for (const Q of G.P){ const b = Q.vbox; if (Q.sea || Q === P || !b || P.x < b[0] || P.x > b[2] || P.y < b[1] || P.y > b[3]) continue; if (inP(Q.id, P.x, P.y)){ other = Q.id; break; } }
        out.push({p:P.id, name:P.name, city:P.city ? P.cityName : '', other, wet:im.isWet(P.x, P.y)}); }
      return out; });
    // (a spot out in the water: a town or an island the cells put just off the real coast, where master drew it too; reported, not a failure)
    const wrong = r.filter(x => x.other >= 0); checks.spots = {outside:r.length, inWater:r.length - wrong.length, wrongSide:wrong.length, wrongList:wrong.slice(0, 20)}; if (wrong.length) fail('spots', wrong.slice(0, 20)); }

  await b.close();
  console.log(JSON.stringify({checks, fails, errors}, null, 1));
  process.exit(fails.length || errors.length ? 1 : 0); })().catch(e => { console.error(e); process.exit(2); });
