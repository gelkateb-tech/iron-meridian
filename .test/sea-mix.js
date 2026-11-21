// The original sea colour mixed into the sea look B in places (MAP-SEA-MIX): node .test/sea-mix.js   (bash tools/mkpage.sh first)
// A nations-world game as the United States, paused. Reads the baked depth sheet (the sea's base colour, GEO.seaTex.op) for each mix
// (window.__im.seamix 'none' | 'patch' | 'region' | 'depth') against the look alone and the original look ('m'). Exits 1 on any failure; prints JSON.
//  (D) DEFAULT  the page opens on look B with no mix
//  (R) REGION   cold and enclosed seas (Barents, Baltic, Black Sea, Bering, Okhotsk, Southern Ocean) take the original colour (at least 3/4 of the way:
//               B's noise and sea state still lie over it);
//               warm seas (Caribbean, Arabian Sea, Coral Sea, central Pacific) keep B's colour
//  (P) DEPTH    the mid-ocean basins (central Pacific, South Atlantic at 40S, Indian Ocean) take the original (more than half way: the fade
//               from the coast is wide, and B's sea state lies over it); shelf seas and coasts keep B's
//  (A) PATCH    25-50% of open-sea sample points move clearly towards the original, the rest stay; no two neighbouring samples jump (soft edges)
//  (L) LAKES    the big lakes keep their own tone in every mix (unchanged);  (W) WRAP  what each mix adds runs on across the date line (no jump)
const pickNation = require('./pick-nation.js'); const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }), errors = [], checks = {}, fails = [];
  const p = await (await b.newContext({ viewport: { width: 1200, height: 800 } })).newPage();
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(600);
  await p.click('[data-act="pickscn"][data-k="world64"]'); await pickNation(p, 'United States'); await p.click('[data-act="begin"]'); await p.waitForTimeout(800);
  if (await p.locator('[data-act="start"]').count()) await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 60000 }); await p.evaluate(() => { window.__im.S.speed = 0; });
  const fail = (k, v) => fails.push(k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v)));
  checks.D = await p.evaluate(() => [window.__im.sea, window.__im.seamix]); if (checks.D[0] !== 'b' || checks.D[1] !== 'none') fail('D default', checks.D);
  const PTS = { barents: [38, 73], baltic: [19.5, 57.5], black: [34, 43.3], bering: [-178, 59], okhotsk: [150, 55], south: [20, -52], carib: [-75, 15], arab: [64, 15], coral: [155, -18], cpac: [-145, 8],
    satl: [-15, -40], indian: [88, -30], northsea: [3, 55.5], java: [110, -5], superior: [-87.5, 47.6], victoria: [33, -1] };
  const read = (sea, mix, extra) => p.evaluate(([sea, mix, PTS, extra]) => { const im = window.__im; im.sea = sea; im.seamix = 'none'; im.seamix = mix; const D = im.seaFx.GEO.seaTex.op, g = D.getContext('2d'), w = D.width, h = D.height;
    const lonLatW = (lon, lat) => { const row = (YMAX - miller(lat))/(YMAX - YMIN)*(H - 1); return [OX + HS*SQ3*((((lon - WORLD.lon0) % 360) + 360) % 360/360*W - 0.5), OY + HS*1.5*row]; };   // (the page's own, rules/data.js's projection)
    const at = (lon, lat) => { const [x, y] = lonLatW(lon, lat), d = g.getImageData(Math.max(0, Math.min(w - 5, Math.round(x/WORLD_W*w) - 2)), Math.max(0, Math.min(h - 5, Math.round(y/WORLD_H*h) - 2)), 5, 5).data, s = [0, 0, 0]; for (let i = 0; i < d.length; i += 4) for (let c = 0; c < 3; c++) s[c] += d[i + c]/25; return s; };
    const o = {}; for (const k in PTS) o[k] = at(...PTS[k]);
    if (extra){ o.grid = []; for (let lat = -55; lat <= 70; lat += 2.5) for (let lon = -180; lon < 180; lon += 2.5){ const c = G.prov[worldToCell(...lonLatW(lon, lat))]; if (c >= 0 && !G.P[c].sea) { o.grid.push(null); continue; } o.grid.push(at(lon, lat)); } }
    const l0 = WORLD.lon0; o.edge = []; o.dl = []; o.ctl = []; for (let lat = -50; lat <= 45; lat += 1.5){ o.edge.push([at(l0 - 0.4, lat), at(l0 + 0.4, lat)]); o.ctl.push([at(-150.4, lat), at(-149.6, lat)]); if (lat >= 0) o.dl.push([at(179.6, lat), at(-179.6, lat)]); } return o; }, [sea, mix, PTS, extra]);
  const M = await read('m', 'none', true), B = await read('b', 'none', true), R = await read('b', 'region'), P = await read('b', 'depth'), A = await read('b', 'patch', true);
  const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]), towards = (X, k) => { const d0 = dist(B[k], M[k]); return d0 < 6 ? null : +(1 - dist(X[k], M[k])/d0).toFixed(2); };   // 0: B, 1: the original
  checks.R = {}; for (const k of ['barents', 'baltic', 'black', 'bering', 'okhotsk', 'south']){ const t = towards(R, k); checks.R[k] = t; if (t !== null && t < 0.75) fail('R cold sea not original', [k, t]); }
  for (const k of ['carib', 'arab', 'coral', 'cpac']){ const d = dist(R[k], B[k]); checks.R[k] = d; if (d > 4) fail('R warm sea changed', [k, d]); }
  checks.P = {}; for (const k of ['cpac', 'satl', 'indian']){ const t = towards(P, k); checks.P[k] = t; if (t !== null && t < 0.5) fail('P deep ocean not original', [k, t]); }
  for (const k of ['northsea', 'java']){ const d = dist(P[k], B[k]); checks.P[k] = d; if (d > 6) fail('P shelf sea changed', [k, d]); }
  { let n = 0, on = 0, jump = 0; const NX = 144; for (let i = 0; i < A.grid.length; i++){ if (!A.grid[i] || !B.grid[i]) continue; const d0 = dist(B.grid[i], M.grid[i]); if (d0 < 12) continue; n++; const t = 1 - dist(A.grid[i], M.grid[i])/d0; if (t > 0.4) on++;
      const j = i + 1; if ((j % NX) && A.grid[j] && B.grid[j]){ const tj = 1 - dist(A.grid[j], M.grid[j])/Math.max(12, dist(B.grid[j], M.grid[j])); if (Math.abs(tj - t) > 0.75) jump++; } }
    checks.A = { samples: n, share: +(on/n).toFixed(2), jumps: jump }; if (on/n < 0.25 || on/n > 0.5) fail('A patch share', checks.A); if (jump > n*0.02) fail('A hard edges', checks.A); }
  checks.L = {}; for (const k of ['superior', 'victoria']) for (const [nm, X] of [['region', R], ['depth', P], ['patch', A]]){ const d = dist(X[k], B[k]); checks.L[k + '-' + nm] = d; if (d > 1) fail('L lake changed', [k, nm, d]); }
  // (the sheet's own texture differs a little either side of a line; what the mix adds must not jump: its change from B east of the line
  // matches its change west of it)
  // matches its change west of it as closely as it does across the same step anywhere else (a control pair in the open Pacific, at 150W): at the map's wrap
  // (169W, south of the Bering Strait) and at the date line itself (north of the equator, clear of the islands either side of it)
  const step = (X, f) => { if (!X[f].length) return 0; let e = 0; X[f].forEach(([a, c], i) => { const [ba, bc] = B[f][i]; e = Math.max(e, [0, 1, 2].reduce((s, j) => s + Math.abs((a[j] - ba[j]) - (c[j] - bc[j])), 0)); }); return Math.round(e); };
  checks.W = {}; for (const [k, X] of [['region', R], ['depth', P], ['patch', A]]){ const e = step(X, 'edge'), c = step(X, 'ctl'); const d = step(X, 'dl'); checks.W[k] = {seam:e, dateline:d, control:c}; if (Math.max(e, d) > Math.max(12, 1.5*c + 6)) fail('W wrap jump', [k, e, d, c]); }
  console.log(JSON.stringify({ checks, fails, errors: errors.slice(0, 5) }, null, 1)); await b.close(); process.exit(fails.length || errors.length ? 1 : 0); })();
