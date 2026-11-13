// Country borders against the real ones: every land cell of both maps (map 0, world.js as it is; the nations world's split map) is checked
// against Natural Earth (admin-1 states and provinces 1:10m, the file world.js was built from: each region's 'admin' is its country, so the
// regions together are the admin-0 countries). A cell is rasterized exactly as tools/build-world2.js does it (its scanline fill at the cell
// centre, the same projection and country renames); a province is wrong when most of its cells lie in another country.
//   node tools/border-check.js <ne_10m_admin_1_states_provinces.geojson> [--all]
// Prints per map the cells in another country than their province's (by country), every province whose majority is foreign, and exits 1 when
// any province is given to the wrong country or a country has more than 2% of its cells (and over 3 cells) in a neighbour.
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..');
if (!process.argv[2]){ console.error('usage: node tools/border-check.js <ne_10m_admin_1_states_provinces.geojson> [--all]'); process.exit(2); }
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const R = new Function("'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn {mapOf, MAP_NEW};')();

// the grid and projection of tools/build-world2.js
const GS = WORLD.GS, W = WORLD.W, H = WORLD.H, LON0 = WORLD.lon0, LAT_N = WORLD.latN, LAT_S = WORLD.latS, N = W*H;
const miller = lat => 1.25*Math.log(Math.tan(Math.PI/4 + 0.4*lat*Math.PI/180));
const YMAX = miller(LAT_N), YMIN = miller(LAT_S);
const projX = lon => ((lon - LON0) % 360 + 360) % 360/360*W - 0.5;
const projY = lat => (YMAX - miller(Math.max(-85, Math.min(85, lat))))/(YMAX - YMIN)*(H - 1);
const RENAME = {'United Republic of Tanzania':'Tanzania', 'Republic of Serbia':'Serbia', 'Republic of the Congo':'Congo', 'Democratic Republic of the Congo':'Dem. Rep. Congo',
  'Czech Republic':'Czechia', 'Ivory Coast':"Côte d'Ivoire", 'Central African Republic':'Central African Rep.', 'Bosnia and Herzegovina':'Bosnia and Herz.', 'The Bahamas':'Bahamas',
  'Guinea Bissau':'Guinea-Bissau', 'Swaziland':'Eswatini', 'East Timor':'Timor-Leste', 'Hong Kong S.A.R.':'China', 'Macau S.A.R':'China', 'Baykonur Cosmodrome':'Kazakhstan',
  'Siachen Glacier':'India', 'Northern Cyprus':'Cyprus', 'Dhekelia Sovereign Base Area':'Cyprus', 'Akrotiri Sovereign Base Area':'Cyprus', 'Gaza Strip':'Palestine', 'West Bank':'Palestine',
  'US Naval Base Guantanamo Bay':'Cuba', 'Puerto Rico':'United States of America', 'Western Sahara':'W. Sahara', 'Republic of Congo':'Congo', 'Sao Tome and Principe':'São Tomé and Principe',
  'Equatorial Guinea':'Eq. Guinea', 'Dominican Republic':'Dominican Rep.', 'French Southern and Antarctic Lands':'Fr. S. Antarctic Lands', 'Aland':'Finland', 'Gibraltar':'United Kingdom', 'Jersey':'United Kingdom', 'Guernsey':'United Kingdom', 'Isle of Man':'United Kingdom'};
const ADM = JSON.parse(fs.readFileSync(process.argv[2])), feats = ADM.features.filter(f => f.geometry && f.properties.admin !== 'Antarctica');
const real = new Array(N).fill(null);   // the real country of each cell (null: sea, or a speck the map leaves out)
function rasterize(g, set){ const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  for (const poly of polys){ const rows = new Map();
    for (const ring of poly){ let prev = null; const pts = [];
      for (const [lon, lat] of ring){ let x = projX(lon); if (prev !== null){ while (x - prev > W/2) x -= W; while (prev - x > W/2) x += W; } pts.push([x, projY(lat)]); prev = x; }
      for (let i = 0; i < pts.length - 1; i++){ const [x1, y1] = pts[i], [x2, y2] = pts[i + 1]; if (y1 === y2) continue; const lo = Math.min(y1, y2), hi = Math.max(y1, y2);
        for (let r = Math.max(0, Math.ceil(lo)); r < hi && r < H; r++){ if (r < lo) continue; const x = x1 + (x2 - x1)*(r - y1)/(y2 - y1); let a = rows.get(r); if (!a) rows.set(r, a = []); a.push(x); } } }
    for (const [r, xs] of rows){ xs.sort((a, b) => a - b); const off = 0.5*(r & 1); for (let j = 0; j + 1 < xs.length; j += 2) for (let c = Math.ceil(xs[j] - off); c + off < xs[j + 1]; c++) set(r*W + ((c % W) + W) % W); } } }
for (const f of feats){ const adm = RENAME[f.properties.admin] || f.properties.admin; rasterize(f.geometry, i => { if (real[i] === null) real[i] = adm; }); }

let bad = 0; console.log(`Natural Earth: ${feats.length} regions, ${real.filter(Boolean).length} land cells`);
for (const [tag, v] of [['map 0 (classic)', 0], ['split map (nations world)', R.MAP_NEW]]){ const G = R.mapOf(v); if (!G) continue;
  const name = P => G.countries[P.country] ? G.countries[P.country].name : String(P.country), per = new Map(), wrong = [];
  for (const P of G.P){ if (P.sea) continue; const c = name(P); let off = 0; const where = new Map();
    for (const i of P.cells){ const t = real[i]; if (t === null || t === c) continue; off++; where.set(t, (where.get(t) || 0) + 1); }
    const e = per.get(c) || per.set(c, {cells:0, off:0, to:new Map()}).get(c); e.cells += P.cells.length; e.off += off; for (const [t, n] of where) e.to.set(t, (e.to.get(t) || 0) + n);
    if (off*2 > P.cells.length) wrong.push(`${P.id} ${P.name} (${c}): ${off}/${P.cells.length} cells in ${[...where].map(([t, n]) => t + ' ' + n).join(', ')}`); }
  const loose = [...per].filter(([, e]) => e.off > 3 && e.off > 0.02*e.cells);
  console.log(`${tag}: ${G.P.filter(P => !P.sea).length} land provinces, ${wrong.length} given to the wrong country, ${loose.length} countries with over 2% of their cells in another`);
  for (const w of wrong) console.log('  WRONG ' + w);
  for (const [c, e] of (process.argv.includes('--all') ? [...per].filter(([, e]) => e.off) : loose)) console.log(`  ${c}: ${e.off}/${e.cells} cells in ${[...e.to].map(([t, n]) => t + ' ' + n).join(', ')}`);
  bad += wrong.length + loose.length; }
console.log(bad ? 'BORDERS: ' + bad + ' problems' : 'BORDERS OK'); process.exit(bad ? 1 : 0);
