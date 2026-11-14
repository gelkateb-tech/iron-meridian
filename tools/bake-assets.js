// Bakes the terrain texture, land mask and 3D unit sprite sheets into assets/ so the game loads images
// instead of computing them at startup. Run: tools/mkpage.sh && node tools/bake-assets.js
// `node tools/bake-assets.js map [types]` bakes only the troop models standing on the map (assets/units/m-<type>.webp) and writes their
// crop and ground origin into units3d.js (MAPMETA); everything else is left untouched.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const MAP_TYPES = ['sol', 'sat', 'ssf', 'hmv', 'truck', 'tank', 'ifv', 'art', 'mlrs', 'sam', 'frig', 'lst', 'sub', 'crui', 'carr', 'jet', 'int', 'heli', 'drone'];
(async () => {
  const root = path.join(__dirname, '..'), out = path.join(root, 'assets'), only = process.argv[2]; fs.mkdirSync(path.join(out, 'units'), { recursive: true });
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage({ viewport: { width: 1200, height: 800 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(root, '.test', 'page.html') + '?bake'); await p.waitForFunction(() => window.__im && window.__im.G && window.__im.G.terrain, null, { timeout: 60000 });
  const save = (rel, dataUrl) => { fs.writeFileSync(path.join(out, rel), Buffer.from(dataUrl.split(',')[1], 'base64')); };
  if (only !== 'map'){
    save('terrain.webp', await p.evaluate(() => window.__im.G.terrain.toDataURL('image/webp', 0.9)));
    save('landmask.png', await p.evaluate(() => { const m = window.__im.G.landMask, c = document.createElement('canvas'); c.width = Math.round(m.width/2); c.height = Math.round(m.height/2); const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(m, 0, 0, c.width, c.height); return c.toDataURL('image/png'); }));
    for (const t of ['inf', 'at', 'art', 'sam', 'ifv', 'tank', 'jet', 'int', 'frig', 'sub', 'crui', 'heli', 'drone', 'carr', 'mlrs', 'spec']){
      const a = await p.evaluate(tt => window.U3D.exportAtlas(tt), t); if (!a){ errs.push('no atlas ' + t); continue; }
      save(`units/${t}.png`, a.base); save(`units/${t}_m.png`, a.mask); }
  }
  // the map models: one sheet per type plus its meta, written into units3d.js
  const meta = {};
  const pick = process.argv[3] ? process.argv[3].split(',') : MAP_TYPES, old = (() => { try { return JSON.parse(/const MAPMETA = (\{.*\});\n/.exec(fs.readFileSync(path.join(root, 'units3d.js'), 'utf8'))[1]); } catch (e) { return {}; } })();
  for (const t of MAP_TYPES) if (!pick.includes(t) && old[t]) meta[t] = old[t];
  for (const t of pick){ const a = await p.evaluate(tt => window.U3D.exportMap(tt), t); if (!a){ errs.push('no map atlas ' + t); continue; } save(`units/m-${t}.webp`, a.img); save(`units/m-${t}-hi.webp`, a.hi); meta[t] = a.meta; }
  const u3 = path.join(root, 'units3d.js'), src = fs.readFileSync(u3, 'utf8'), re = /const MAPMETA = \{.*\};\n/;
  if (!re.test(src)) errs.push('MAPMETA line not found in units3d.js'); else fs.writeFileSync(u3, src.replace(re, 'const MAPMETA = ' + JSON.stringify(meta) + ';\n'));
  const sizes = fs.readdirSync(out).concat(fs.readdirSync(path.join(out, 'units')).map(f => 'units/' + f)).filter(f => /\.(png|webp)$/.test(f) && (only !== 'map' || /m-/.test(f))).map(f => `${f} ${(fs.statSync(path.join(out, f)).size/1024).toFixed(0)}K`);
  console.log(sizes.join('\n')); console.log('errors', errs); await b.close();
})();
