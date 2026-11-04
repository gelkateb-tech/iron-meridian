// Bake-time only: real coastlines (Natural Earth land 50m via world-atlas, public domain) projected to grid coordinates.
// Writes .test/landpoly.js, which the page loads only in ?bake mode to draw true coastlines into terrain.webp and landmask.png.
// usage: NODE_PATH=<scratch node_modules> node tools/build-landpoly.js
const fs = require('fs'), path = require('path');
const topo = require('topojson-client'), land = require('world-atlas/land-50m.json');
global.window = {}; require(path.join(__dirname, '..', 'world.js')); const WD = window.WORLD;
const W = WD.W, H = WD.H, LON0 = WD.lon0;
const miller = lat => 1.25*Math.log(Math.tan(Math.PI/4 + 0.4*lat*Math.PI/180));
const YMAX = miller(WD.latN), YMIN = miller(WD.latS);
const proj = (lon, lat) => [((lon - LON0 + 720) % 360)/360*W - 0.5, (YMAX - miller(Math.max(WD.latS - 2, Math.min(WD.latN + 2, lat))))/(YMAX - YMIN)*(H - 1)];
const geo = topo.feature(land, land.objects.land), rings = [];
const polys = geo.features ? geo.features.flatMap(f => f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) : (geo.geometry.type === 'Polygon' ? [geo.geometry.coordinates] : geo.geometry.coordinates);
for (const poly of polys) for (const ring of poly){
  if (ring.every(([, lat]) => lat < WD.latS - 2)) continue;   // Antarctica
  const out = []; let prev = null;
  for (const [lon, lat] of ring){ let [x, y] = proj(lon, lat); if (prev){ while (x - prev[0] > W/2) x -= W; while (prev[0] - x > W/2) x += W; } out.push(Math.round(x*40), Math.round(y*40)); prev = [x, y]; }
  if (out.length >= 6) rings.push(out); }
fs.mkdirSync(path.join(__dirname, '..', '.test'), {recursive:true});
fs.writeFileSync(path.join(__dirname, '..', '.test', 'landpoly.js'), 'window.LANDPOLY = ' + JSON.stringify(rings) + ';\n');
console.log('rings', rings.length);
