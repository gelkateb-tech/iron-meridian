// Bakes the terrain texture, land mask and 3D unit sprite sheets into assets/ so the game loads images
// instead of computing them at startup. Run: tools/mkpage.sh && node tools/bake-assets.js
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const root = path.join(__dirname, '..'), out = path.join(root, 'assets'); fs.mkdirSync(path.join(out, 'units'), { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 800 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(root, '.test', 'page.html') + '?bake'); await p.waitForFunction(() => window.__im && window.__im.G && window.__im.G.terrain, null, { timeout: 60000 });
  const save = (rel, dataUrl) => { fs.writeFileSync(path.join(out, rel), Buffer.from(dataUrl.split(',')[1], 'base64')); };
  save('terrain.webp', await p.evaluate(() => window.__im.G.terrain.toDataURL('image/webp', 0.9)));
  save('landmask.png', await p.evaluate(() => window.__im.G.landMask.toDataURL('image/png')));
  for (const t of ['inf', 'at', 'art', 'sam', 'ifv', 'tank', 'jet', 'int', 'frig', 'sub', 'crui', 'heli', 'drone', 'carr']){
    const a = await p.evaluate(tt => window.U3D.exportAtlas(tt), t); if (!a){ errs.push('no atlas ' + t); continue; }
    save(`units/${t}.png`, a.base); save(`units/${t}_m.png`, a.mask); }
  const sizes = fs.readdirSync(out).concat(fs.readdirSync(path.join(out, 'units')).map(f => 'units/' + f)).filter(f => /\.(png|webp)$/.test(f)).map(f => `${f} ${(fs.statSync(path.join(out, f)).size/1024).toFixed(0)}K`);
  console.log(sizes.join('\n')); console.log('errors', errs); await b.close();
})();
