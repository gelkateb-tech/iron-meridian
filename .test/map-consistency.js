// The map looks the same at every zoom and every pan (fix-map): node .test/map-consistency.js [W H dpr]   (default 1440 900 2)
// A nations-world game as the United States (the 68 nations, the split map), the clock paused. Exits 1 on any failure; prints JSON {checks, fails, errors}.
//  (T) TINT     several owned provinces (the US round New York and Chicago, Germany, Russia round Moscow) are tinted all over at 3 zooms after a pan:
//               the layer's pixels at cells inside each province change clearly when the province is handed to another nation (its tint shows)
//  (C) COLOURS  no two neighbouring countries share a tint (the per-country palette), and the tint is the power's or the country's own
//  (A) ALLY     an ally's land turns blue (Canada allied: the tint and the layer's pixels round Ottawa)
//  (B) BORDERS  at every zoom the borders are drawn: on the layer, points on province borders, country borders and national borders in view
//               stand out from the ground beside them (luminance step), for most points sampled
//  (M) MODELS   every 3D model / picture on screen keeps its world offset from its force's spot (it moves with its counter, < 2 css px)
//               across 3 zooms and pans, and its counter (the diamond or the tag) is pinned on the same spot (< 2 css px), including forces
//               just either side of the map's east-west seam (Chukotka, and Alaska seen from the copy east of the seam)
//  (O) OUTLINE  a coastal province's hover outline is kept to the land (no pixels of it out at sea)
const pickNation = require('./pick-nation.js'); const { chromium } = require('playwright'); const path = require('path');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), DPR = +(process.argv[4] || 2), PHONE = W <= 820;
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }), errors = [], checks = {}, fails = [];
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: PHONE, hasTouch: PHONE }); const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(600);
  await p.click('[data-act="pickscn"][data-k="world64"]'); await pickNation(p, 'United States'); await p.click('[data-act="begin"]'); await p.waitForTimeout(800);
  if (await p.locator('[data-act="start"]').count()) await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 60000 }); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im; im.S.speed = 0; im.SET.tipsOff = true; im.SET.saver = false; im.S.hour = 18; });
  const MAP = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const settle = async () => { for (let i = 0, ok = 0; i < 100 && ok < 3; i++){ await p.waitForTimeout(150); ok = await p.evaluate(() => { window.__im.redraw(); return !window.__im.mapBusy(); }) ? ok + 1 : 0; } await p.waitForTimeout(150); };
  const setView = (x, y, s) => p.evaluate(([x, y, s, mw, mh]) => { const v = window.__im.view; v.s = s; v.x = mw/2 - x*s; v.y = mh/2 - y*s; window.__im.redraw(); }, [x, y, s, MAP.w, MAP.h]);
  const drag = async (dx, dy) => { const cx = MAP.x + MAP.w*0.45, cy = MAP.y + MAP.h*0.55; await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 10; i++) await p.mouse.move(cx + dx*i/10, cy + dy*i/10); await p.mouse.up(); await p.mouse.move(MAP.x + 4, MAP.y + 4); };
  const fail = (k, v) => { fails.push(k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v))); };
  const cityXY = n => p.evaluate(n => { const P = window.__im.G.P.find(P => P.cityName === n); return [P.x, P.y]; }, n);
  // in-page helpers: layer pixels at world points (the copy of the layer that holds them), sample cells inside provinces away from their town
  await p.evaluate(() => { const im = window.__im;
    window.__mc = {
      img(){ im.renderLayer(); const L = im.layer; return {L, d:L.getContext('2d').getImageData(0, 0, L.width, L.height).data}; },   // (a full render of the view as it is now: never a layer left scaled or shifted)
      px(I, x, y){ const L = I.L, s = L.s, dp = L.dp || 2, X0 = im.wrap.X0, WW = im.wrap.W, ox = L.vx + L.mx, oy = L.vy + L.my;
        for (const k of [0, -1, 1]){ const X = Math.round(dp*((x + k*WW)*s + ox)), Y = Math.round(dp*(y*s + oy)); if (X >= 2 && Y >= 2 && X < L.width - 2 && Y < L.height - 2){ const o = (Y*L.width + X)*4; return [I.d[o], I.d[o + 1], I.d[o + 2]]; } } return null; },
      onScr(x, y, m = 40){ const v = im.view, cw = innerWidth, sx = x*v.s + v.x, sy = y*v.s + v.y, r = document.getElementById('map').getBoundingClientRect(); for (const k of [0, -1, 1]){ const X = sx + k*im.wrap.W*v.s; if (X > m && X < r.width - m && sy > m && sy < r.height - m) return true; } return false; },
      cells(p, n){ const G = im.G, P = G.P[p], out = [], st = Math.max(1, Math.floor(P.cells.length/(n*3)));
        for (let i = 0; i < P.cells.length && out.length < n; i += st){ const q = cellCenter(P.cells[i]); if (Math.hypot(q[0] - P.x, q[1] - P.y) < 12 || im.isWet(q[0], q[1])) continue;   // (away from its town; not on a lake)
          if (this.onScr(q[0], q[1])) out.push(q); } return out; } }; });
  const G0 = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G; return {W:G.P.length, nn:S.nations.length, us:S.nations.findIndex(N => N.name === 'United States'), de:S.nations.findIndex(N => N.name === 'Germany'), ru:S.nations.findIndex(N => N.name === 'Russia'), ca:S.nations.findIndex(N => N.name === 'Canada'), map:S.map}; });
  checks.game = G0; if (G0.map !== 1 || G0.nn !== 68) fail('game', G0);

  // (C) colours: neighbours apart, every tint the owner's own
  { const r = await p.evaluate(() => { const im = window.__im, G = im.G, S = im.S, pal = im.ctryPal(); let clash = 0, pairs = 0; const seen = new Set();
      for (const P of G.P){ if (P.sea) continue; for (const q of P.nbs){ const Q = G.P[q]; if (Q.sea || Q.country === P.country) continue; const k = Math.min(P.country, Q.country) + ',' + Math.max(P.country, Q.country); if (seen.has(k)) continue; seen.add(k); pairs++; if (pal[P.country] === pal[Q.country]) clash++; } }
      // neighbouring powers' tints differ (each power takes its home country's colour)
      let nclash = 0; const tint = S.nations.map((N, n) => im.tintOf(n)); for (const P of G.P){ if (P.sea) continue; const o = S.owner[P.id]; if (o < 0) continue; for (const q of P.nbs){ const o2 = S.owner[q]; if (o2 >= 0 && o2 !== o && tint[o] === tint[o2] && o !== 0 && o2 !== 0) nclash++; } }
      return {pairs, clash, nclash, own:im.tintOf(0), others:new Set(tint.slice(1)).size}; });
    checks.colours = r; if (r.clash || r.nclash || r.others < 5) fail('colours', r); }

  // (A) ALLY  an ally's land is blue (owner rule: mine green, allies blue, enemies red): Canada round Ottawa allied, then at peace again
  { const c = await cityXY('Ottawa'); await p.evaluate(() => { window.__im.S.hour = 0; }); await setView(c[0], c[1], 4.5); await settle();   // (daylight over Ontario)
    const pick = () => p.evaluate(ca => { const im = window.__im, G = im.G, S = im.S, M = window.__mc, I = M.img(), out = [];
      for (const P of G.P){ if (P.sea || S.owner[P.id] !== ca || !M.onScr(P.x, P.y, 60)) continue; for (const q of M.cells(P.id, 3)) out.push(M.px(I, q[0], q[1])); if (out.length >= 24) break; }
      return out.filter(Boolean); }, G0.ca);
    const peace = await pick();
    await p.evaluate(ca => { rel(0, ca).st = 'ally'; window.__im.geoDirty(); window.__im.redraw(); }, G0.ca); await settle();
    const ally = await pick(), tint = await p.evaluate(ca => window.__im.tintOf(ca), G0.ca);
    if (process.env.OUT) await p.screenshot({ path: process.env.OUT + '/ally-ottawa-z4.5.png' });
    await p.evaluate(ca => { rel(0, ca).st = 'peace'; window.__im.S.hour = 18; window.__im.geoDirty(); window.__im.redraw(); }, G0.ca); await settle();
    const bl = L => L.reduce((a, q) => a + q[2] - q[0], 0)/Math.max(1, L.length);   // blue over red, on average
    checks.ally = {tint, n:ally.length, bluePeace:+bl(peace).toFixed(1), blueAlly:+bl(ally).toFixed(1)};
    if (tint !== '#3f6fe8' || ally.length < 6 || bl(ally) < bl(peace) + 8) fail('ally not blue', checks.ally); }

  // (T) tint and (B) borders at 3 zooms after a pan, in three regions
  checks.tint = []; checks.borders = [];
  for (const [tag, city, own] of [['newyork', 'New York', G0.us], ['chicago', 'Chicago', G0.us], ['germany', 'Frankfurt', G0.de], ['moscow', 'Moscow', G0.ru]]){ const c = await cityXY(city);
    for (const s of PHONE ? [2.2, 6, 10] : [2.2, 6, 16]){ await setView(c[0], c[1], s);   // (a phone screen holds too few provinces at 16 to sample) await settle(); await drag(-160, 70); await settle();
      // provinces of the owner in view (up to 8), each sampled at up to 4 cells away from its town
      const before = await p.evaluate(own => { const im = window.__im, G = im.G, S = im.S, M = window.__mc, I = M.img(), out = [];
        const v = im.view, r = document.getElementById('map').getBoundingClientRect(), x0 = -v.x/v.s, x1 = (r.width - v.x)/v.s, y0 = -v.y/v.s, y1 = (r.height - v.y)/v.s;
        for (const P of G.P){ if (out.length >= 8) break; if (P.sea || S.owner[P.id] !== own || P.x < x0 - 200 || P.x > x1 + 200 || P.y < y0 - 200 || P.y > y1 + 200) continue; const cs = M.cells(P.id, 8); if (cs.length < 2) continue; out.push({p:P.id, name:P.name, cs, px:cs.map(q => M.px(I, q[0], q[1]))}); }
        return out; }, own);
      // the same pixels with those provinces handed to another power (tinted in its colour): each must change
      const to = own === G0.us ? G0.ca : G0.us, ids = before.map(e => e.p);   // (yours green against another power's colour)
      await p.evaluate(([ids, to]) => { const im = window.__im; window.__mcOwn = ids.map(id => [id, im.S.owner[id]]); for (const id of ids) im.S.owner[id] = to; im.geoDirty(); im.redraw(); }, [ids, to]); await settle();
      const after = await p.evaluate(B => { const M = window.__mc, I = M.img(); return B.map(e => e.cs.map(q => M.px(I, q[0], q[1]))); }, before);
      await p.evaluate(() => { const im = window.__im; for (const [id, o] of window.__mcOwn) im.S.owner[id] = o; im.geoDirty(); im.redraw(); }); await settle();
      const per = before.map((e, i) => { const d = e.px.map((a, j) => { const z = after[i][j]; return a && z ? Math.abs(a[0] - z[0]) + Math.abs(a[1] - z[1]) + Math.abs(a[2] - z[2]) : -1; }).filter(v => v >= 0).sort((x, y) => x - y);
        return {p:e.p, name:e.name, n:d.length, min:d[0], med:d[d.length >> 1], on:d.filter(v => v > 5).length}; });
      // (a town's art keeps its own colours over the tint, and winter snow lies over it: most of each province, not every point, must change)
      const bad = per.filter(e => !e.n || e.med < 10 || e.on < e.n*0.5);
      checks.tint.push({tag, s, provs:per.length, worstMedian:per.reduce((m, e) => Math.min(m, e.med ?? 0), 999), bad:bad.length});
      if (per.length < 2 || bad.length) fail(`tint ${tag} z${s}`, {provs:per.length, bad});
      // (B) borders: chain points in view: the line differs from the ground just beside it
      const br = await p.evaluate(() => { const im = window.__im, G = im.G, S = im.S, M = window.__mc, I = M.img(), GEO = im.geo, L = I.L, s = L.s, res = {prov:[0, 0], country:[0, 0], nation:[0, 0]};
        const lum = q => q ? 0.3*q[0] + 0.59*q[1] + 0.11*q[2] : null, o = (pt, k) => S.owner[k];
        for (const c of GEO.chains){ if (c.a < 0 || c.b < 0) continue; const A = G.P[c.a], B = G.P[c.b]; if (A.sea || B.sea || c.pts.length < 6) continue;
          const kind = A.country !== B.country ? 'country' : S.owner[c.a] !== S.owner[c.b] ? 'nation' : 'prov', R = res[kind]; if (R[1] >= 40) continue;
          const i = c.pts.length >> 1, q = c.pts[i], q0 = c.pts[i - 2], q1 = c.pts[i + 2]; if (!M.onScr(q[0], q[1], 60) || im.isWet(q[0], q[1])) continue;   // (across a lake a border is dashed)
          const tx = q1[0] - q0[0], ty = q1[1] - q0[1], tl = Math.hypot(tx, ty) || 1, nx = -ty/tl, ny = tx/tl, d = 5/s;   // 5 css px either side
          const l0 = lum(M.px(I, q[0], q[1])), la = lum(M.px(I, q[0] + nx*d, q[1] + ny*d)), lb = lum(M.px(I, q[0] - nx*d, q[1] - ny*d)); if (l0 == null || la == null || lb == null) continue;
          // the strongest step along the normal (the line has a dark edge and, on country and national borders, a light core)
          let st = 0; for (const f of [-1.2, -0.6, 0, 0.6, 1.2]){ const l = lum(M.px(I, q[0] + nx*f/s, q[1] + ny*f/s)); if (l != null) st = Math.max(st, Math.abs(l - (la + lb)/2)); }
          R[1]++; if (st >= 6) R[0]++; }
        return res; });
      checks.borders.push({tag, s, ...br});
      for (const k of ['prov', 'country', 'nation']){ const [ok, n] = br[k]; if (n >= 6 && ok < n*0.7) fail(`borders ${tag} z${s} ${k}`, br[k]); }
      if (br.prov[1] < 6) fail(`borders ${tag} z${s}: too few province borders in view`, br.prov); } }

  // (O) the hover outline of a coastal province stays on land (New York at z14)
  { const c = await cityXY('New York'); await setView(c[0], c[1], 14); await settle();
    const r = await p.evaluate(() => { const im = window.__im, G = im.G, P = G.P.find(P => P.cityName === 'New York'), v = im.view, R = document.getElementById('map').getBoundingClientRect(); return {p:P.id, sx:R.left + P.x*v.s + v.x, sy:R.top + P.y*v.s + v.y}; });
    await p.mouse.move(r.sx, r.sy); await p.waitForTimeout(400);
    // the outline's sea-side chains (pushed out to sea, over the province's cells there): their screen pixels with the hover and without it
    const sample = () => p.evaluate(p0 => { const im = window.__im, G = im.G, GEO = im.geo, cv = document.getElementById('map'), g = cv.getContext('2d'), d = cv.width/cv.getBoundingClientRect().width, v = im.view, out = [];
      for (const c of GEO.byProv[p0]){ const o = c.a === p0 ? c.b : c.a; if (o >= 0 && !G.P[o].sea) continue;
        for (let i = 0; i < c.pts.length; i += 2){ const q = c.pts[i], X = Math.round(d*(q[0]*v.s + v.x)), Y = Math.round(d*(q[1]*v.s + v.y)); if (X < 0 || Y < 0 || X >= cv.width || Y >= cv.height) continue;
          const px = g.getImageData(X, Y, 1, 1).data; out.push(0.3*px[0] + 0.59*px[1] + 0.11*px[2]); } }
      return out; }, r.p);
    const on = await sample(); await p.mouse.move(MAP.x + 4, MAP.y + 4); await p.waitForTimeout(400); const off = await sample();
    const out = {n:on.length, lit:on.filter((l, i) => off[i] != null && l - off[i] > 25).length};
    checks.outline = out; if (out.n < 10 || out.lit > out.n*0.1) fail('outline at sea', out); }

  // (M) models and pictures pinned to their counters: Washington (a mixed stack), New York, and two forces either side of the seam
  const seam = await p.evaluate(us => { const im = window.__im, S = im.S, G = im.G, X0 = im.wrap.X0, WW = im.wrap.W;
    const land = (x0, x1) => G.P.filter(P => !P.sea && P.x >= x0 && P.x <= x1 && P.y < 420 && P.cells.length > 6);
    const e = land(X0 + WW - 140, X0 + WW).sort((a, b) => b.x - a.x)[0], w = land(X0, X0 + 160).filter(P => S.owner[P.id] === us).sort((a, b) => a.x - b.x)[0];
    const ae = im.addArmy(us, e.id, {inf:4, tank:2, art:1}), aw = im.addArmy(us, w.id, {inf:3, tank:3, heli:1});
    return {e:{id:ae.id, p:e.id, x:e.x, y:e.y, name:e.name}, w:{id:aw.id, p:w.id, x:w.x, y:w.y, name:w.name}, X0, WW}; }, G0.us);
  checks.seam = seam;
  const track = new Map(); let frames = 0, pinBad = [], moveBad = [], seen = 0; const ids = new Set();
  const frame = async tag => { const r = await p.evaluate(() => { const im = window.__im; return {s:im.view.s, models:im.TM.dbg.filter(q => q.a > 0.2).map(q => ({k:q.id + '|' + q.t + '|' + q.spot, id:q.id, ids:q.ids, x:q.x, y:q.y, tp:q.tp, gl:q.gl})), hits:im.hits.map(h => ({ids:h.ids, cx:h.cx, cy:h.cy, x:h.x, w:h.w}))}; });
    frames++; for (const q of r.models){ seen++; for (const i of q.ids) ids.add(i);
      const h = r.hits.find(h => h.ids.some(i => q.ids.includes(i))); if (h && Math.abs(h.cx - q.tp[0]) > 2) pinBad.push({tag, k:q.k, cx:h.cx, tp:q.tp});
      if (h && Math.abs(q.x - h.cx) > 160) pinBad.push({tag, k:q.k, far:[q.x, h.cx]});
      const off = [q.gl[0]/r.s, q.gl[1]/r.s], E = track.get(q.k); if (!E) track.set(q.k, off); else { const d = Math.hypot(off[0] - E[0], off[1] - E[1])*r.s; if (d > 2) moveBad.push({tag, k:q.k, d:+d.toFixed(2)}); } } };
  for (const [tag, at] of [['washington', await cityXY('Washington')], ['newyork', await cityXY('New York')], ['seam-east', [seam.e.x, seam.e.y]], ['seam-west', [seam.w.x + seam.WW, seam.w.y]]]){ track.clear();
    for (const s of [12, 15, 19]){ await setView(at[0], at[1], s); await settle(); await frame(tag + ' z' + s); await drag(-140, 50); await settle(); await frame(tag + ' z' + s + ' panned'); await drag(260, -90); await settle(); await frame(tag + ' z' + s + ' panned back'); } }
  checks.models = {frames, seen, forces:ids.size, seamForces:[seam.e.id, seam.w.id].filter(i => ids.has(i)).length, pinBad:pinBad.length, moveBad:moveBad.length, ex:pinBad.slice(0, 4).concat(moveBad.slice(0, 4))};
  if (seen < 20) fail('models: too few on screen', checks.models); if (pinBad.length) fail('models off their counters', pinBad.slice(0, 6)); if (moveBad.length) fail('models slide against their spot', moveBad.slice(0, 6));
  if (checks.models.seamForces < 2) fail('models: the forces either side of the seam were not drawn', checks.models);

  console.log(JSON.stringify({checks, fails, errors}, null, 1)); await b.close(); process.exit(fails.length || errors.length ? 1 : 0); })();
