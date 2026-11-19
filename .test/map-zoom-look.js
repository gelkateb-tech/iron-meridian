// One map look at every zoom (MAP-2, owner playtest #3; MAP-TEXTURE: the detailed texture at every zoom): node .test/map-zoom-look.js [W H dpr]   (default 1440 900 2; bash tools/mkpage.sh first)
// A nations-world game, the clock paused, noon in July over each place, fog off (DEV.reveal), no forces. Exits 1 on any failure; prints JSON.
//  (Z) ZOOM    at Berry (farmland), the Sahara edge, Siberia, the Brittany coast and Tibet, the ground alone (window.__groundOnly: the layer without its
//              overlay sheet and towns) over one world box at hexPx 5, 10, 16, 22, 30, 50, 100, 150: the land's mean colour stays within 5% (or 3
//              levels) of the world view's, each channel (9% from hexPx 60: MAP-TEXTURE, v3.12's lighter close look), the sea's within 6% (or 4 levels: far out the depth is laid without the coast clip)
//  (M) MOVING  a layer rendered as a live zoom renders it (__im.zoomRender: ZRES, ZRND, light) has the settled layer's colours (land and sea mean
//              within 4 levels): the zoom ends with sharper detail, not new colours (MAP-SEA: the sea's mean over open sea, 2 half-resolution px
//              clear of the shore, where there is enough of it: the coarser layer's shore pixels are resolution, not colour)
//  (T) TILES   detail tiles made all round the world (__im.dtProbe, 12 per resolution bucket): for every terrain class the composite's mean
//              over the far texture's (MAP-TEXTURE: the detail baked into the texture for the far view, __im.dtFar) over the same box stays
//              within TOL_T, each channel: the close detail keeps the colours the map shows from further out (the far texture is made first;
//              the two finest buckets may be up to 9% lighter, the lit crowns and pale parcels of v3.12's close look)
//  (E) ERRORS  no console error or page error
const pickNation = require('./pick-nation.js'); const { chromium } = require('playwright'); const path = require('path');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), DPR = +(process.argv[4] || 2), PHONE = W <= 820;
const LOCS = { europe:[47.05, 1.75], sahara:[17.0, -1.5], siberia:[67.0, 97.0], coast:[48.62, -3.45], tibet:[32.5, 86.0] }, ZOOMS = [5, 10, 16, 22, 30, 50, 100, 150];
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }), errors = [], checks = {zoom:{}, moving:[], tiles:{}}, fails = [];
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: PHONE, hasTouch: PHONE }); const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(600);
  await p.click('[data-act="pickscn"][data-k="world64"]'); await pickNation(p, 'United States'); await p.click('[data-act="begin"]'); await p.waitForTimeout(800);
  if (await p.locator('[data-act="start"]').count()) await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 90000 }); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im; im.S.speed = 0; im.SET.tipsOff = true; im.SET.saver = false; DEV.reveal = true; im.S.sunOff = 0; im.S.armies.length = 0; im.air.visibleSet(); im.redraw(); });
  const MAP = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return { w: r.width, h: r.height }; });
  // the far texture made in full first (it is made while the view is still and shows less than the close tiles: the world view)
  await p.evaluate(() => { const im = window.__im; im.view.s = im.wrap.minScale(); im.clampView(); im.redraw(); });
  await p.waitForFunction(() => { const f = window.__im.dtFar(); return !f.on || (f.total > 0 && f.done >= f.total); }, null, { timeout: 240000, polling: 500 });
  const TOL_T = [0.06, 0.06, 0.09, 0.09];   // (MAP-TEXTURE: the two finest buckets, close in, are a little lighter, as in v3.12: their lit crowns and pale parcels)
  const fail = (k, v) => { fails.push(k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v))); };
  const settle = async () => { for (let i = 0, ok = 0; i < 160 && ok < 3; i++){ await p.waitForTimeout(150); ok = await p.evaluate(() => { window.__im.redraw(); return !window.__im.mapBusy(); }) ? ok + 1 : 0; } await p.waitForTimeout(150); };
  // the layer's land and sea mean colour over a world box (ww x wh) round (x, y): land and sea by isWet on a 96 x 60 grid
  await p.evaluate(() => { window.__zl = (x, y, ww, wh) => { const im = window.__im, L = im.layer, s = L.s, dp = L.dp || 2, ox = L.vx + L.mx, oy = L.vy + L.my;
    const X0 = Math.round(dp*((x - ww/2)*s + ox)), Y0 = Math.round(dp*((y - wh/2)*s + oy)), w = Math.round(dp*ww*s), h = Math.round(dp*wh*s), d = L.getContext('2d').getImageData(X0, Y0, w, h).data, N = 96, M = 60, out = {};
    const wet = []; for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) wet.push(im.isWet(x - ww/2 + (i + 0.5)*ww/N, y - wh/2 + (j + 0.5)*wh/M) ? 1 : 0);
    // open sea (2): wet cells with no dry cell within 2 px of a live zoom's half-resolution layer (MAP-SEA: there a coarser layer's shore pixels mix
    // land into the sea's mean, more so the more the sea's colour differs from the land's; that is resolution, not a new colour)
    const mw = 2/(s*devicePixelRatio*0.5), ki = Math.ceil(mw/(ww/N)), kj = Math.ceil(mw/(wh/M));
    for (let j = 0; j < M; j++) for (let i = 0; i < N; i++){ if (!wet[j*N + i]) continue; let open = true;
      for (let v = Math.max(0, j - kj); open && v <= Math.min(M - 1, j + kj); v++) for (let u = Math.max(0, i - ki); u <= Math.min(N - 1, i + ki); u++) if (!wet[v*N + u]){ open = false; break; }
      if (open) wet[j*N + i] = 2; }
    for (const sea of [0, 1, 2]){ let n = 0; const c = [0, 0, 0]; for (let yy = 0; yy < h; yy++){ const j = Math.min(M - 1, (yy*M/h) | 0); for (let xx = 0; xx < w; xx++){ const wv = wet[j*N + Math.min(N - 1, (xx*N/w) | 0)]; if (sea === 1 ? !wv : wv !== sea) continue; const o = (yy*w + xx)*4; c[0] += d[o]; c[1] += d[o + 1]; c[2] += d[o + 2]; n++; } }
      out[['land', 'sea', 'seaIn'][sea]] = n > (sea === 2 ? 12 : 50) ? c.map(v => +(v/n).toFixed(1)) : null; } return out; }; });
  for (const [ln, [lat, lon]] of Object.entries(LOCS)){ const wp = await p.evaluate(([lat, lon]) => { const S = window.__im.S; S.hour = 227*24 + Math.round(((12 - lon/15) + 48) % 24);
      return [OX + ((lon - WORLD.lon0)/360*W - 0.5)*HS*SQ3, OY + (YMAX - miller(lat))/(YMAX - YMIN)*(H - 1)*HS*1.5]; }, [lat, lon]);
    const rows = checks.zoom[ln] = [];
    for (const z of ZOOMS){ await p.evaluate(([x, y, s, mw, mh]) => { const v = window.__im.view; v.s = s; v.x = mw/2 - x*s; v.y = mh/2 - y*s; window.__im.redraw(); }, [wp[0], wp[1], z/12, MAP.w, MAP.h]); await settle();
      const r = await p.evaluate(([x, y, ww, wh]) => { const im = window.__im; window.__groundOnly = true; try { im.renderLayer(); const a = window.__zl(x, y, ww, wh); im.zoomRender(); const m = window.__zl(x, y, ww, wh); return {a, m}; } finally { window.__groundOnly = false; im.renderLayer(); } },
        [wp[0], wp[1], 0.7*Math.min(MAP.w, 560)/12.5, 0.7*Math.min(MAP.h, 360)/12.5]);
      rows.push({z, land:r.a.land, sea:r.a.sea, movLand:r.m.land, movSea:r.m.sea, seaIn:r.a.seaIn, movSeaIn:r.m.seaIn}); }
    const r0 = rows[0], off = (a, b, lv) => a && b ? Math.max(...a.map((v, c) => Math.abs(v - b[c]) <= lv ? 0 : Math.abs(v/b[c] - 1))) : 0;
    for (const r of rows){ if (off(r.land, r0.land, 3) > (r.z >= 60 ? 0.09 : 0.05)) fail(`zoom: ${ln} land at hexPx ${r.z} off the world view's colour`, {z:r.z, land:r.land, world:r0.land});
      if (off(r.sea, r0.sea, 4) > 0.06) fail(`zoom: ${ln} sea at hexPx ${r.z} off the world view's colour`, {z:r.z, sea:r.sea, world:r0.sea});
      for (const k of ['land', 'sea']){ const io = k === 'sea' && r.seaIn && r.movSeaIn, a = io ? r.seaIn : r[k], m = io ? r.movSeaIn : r[k === 'land' ? 'movLand' : 'movSea']; if (a && m){ const d = Math.max(...a.map((v, c) => Math.abs(v - m[c]))); checks.moving.push(+d.toFixed(1)); if (d > 4) fail(`moving: ${ln} ${k} at hexPx ${r.z} while zooming differs from settled`, {settled:a, moving:m}); } } } }
  // (T) the detail tiles against the plain texture, per class
  const R = [2.5, 5, 10, 20], WW = await p.evaluate(() => [window.__im.wrap.WW, window.__im.wrap.WH]); let seed = 29; const rnd = () => (seed = (seed*16807) % 2147483647)/2147483647;
  for (let k = 0; k < 4; k++){ const T = 512/R[k], acc = {}; let got = 0, tries = 0;
    while (got < 12 && tries < 400){ tries++; const tx = Math.floor(rnd()*Math.ceil(WW[0]/T)), ty = Math.floor(rnd()*Math.ceil(WW[1]/T));
      const land = await p.evaluate(([tx, ty, T]) => { let n = 0; for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) if (!window.__im.isWet((tx + 0.2 + 0.3*i)*T, (ty + 0.2 + 0.3*j)*T)) n++; return n; }, [tx, ty, T]); if (land < 6) continue;
      const r = await p.evaluate(([k, tx, ty]) => window.__im.dtProbe(k, tx, ty), [k, tx, ty]); if (!r) continue; got++;
      for (const [key, A] of Object.entries(r.acc)){ const B = acc[key] || (acc[key] = {n:0, b:[0, 0, 0], o:[0, 0, 0], f:[0, 0, 0]}); B.n += A.n; for (let c = 0; c < 3; c++){ B.b[c] += A.b[c]; B.o[c] += A.o[c]; B.f[c] += A.f[c]; } } }
    checks.tiles[k] = {}; for (const [key, B] of Object.entries(acc)){ if (B.n < 4000 || key === 'pm') continue; const g = B.o.map((v, c) => +(v/B.f[c]).toFixed(3)); checks.tiles[k][key] = g;
      if (g.some(v => Math.abs(v - 1) > TOL_T[k])) fail(`tiles: bucket ${k} class ${key} off the far texture's colour`, g); } }
  if (errors.length) fail('errors', errors.slice(0, 5));
  console.log(JSON.stringify({ checks, fails, errors }, null, 1)); await b.close(); process.exit(fails.length ? 1 : 0); })().catch(e => { console.error(e); process.exit(1); });
