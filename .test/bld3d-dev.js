// Renders the building model sheets live (three.js, the bake page) and saves each as a PNG on a ground colour, for looking at the models while
// they are made: node .test/bld3d-dev.js outDir [types]   (run bash tools/mkpage.sh first)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const OUT = process.argv[2] || __dirname, TYPES = (process.argv[3] || 'hq,fac,air,arms,rec,fort,silo,yard').split(',');
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage({ viewport: { width: 1200, height: 800 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await p.goto('file://' + path.join(__dirname, 'page.html') + '?bake'); await p.waitForFunction(() => window.U3D && window.U3D.exportBld, null, { timeout: 60000 });
  for (const t of TYPES){ const t0 = Date.now(); const r = await p.evaluate(tt => { const a = window.U3D.exportBld(tt); if (!a) return null; return new Promise(res => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.fillStyle = '#7d8456'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0);
      g.strokeStyle = 'rgba(255,0,0,.6)'; for (const q of a.meta.c){ g.beginPath(); g.moveTo(q[0] + q[3] - 6, q[4]); g.lineTo(q[0] + q[3] + 6, q[4]); g.moveTo(q[0] + q[3], q[4] - 6); g.lineTo(q[0] + q[3], q[4] + 6); g.stroke(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.strokeRect(q[0] + 0.5, 0.5, q[1] - 1, q[2] - 1); g.strokeStyle = 'rgba(255,0,0,.6)'; }
      res({png:c.toDataURL('image/png'), meta:a.meta, kb:Math.round(a.hi.length*0.75/1024), kbm:Math.round(a.img.length*0.75/1024)}); }; im.src = a.hi; }); }, t);
    if (!r){ errs.push('no sheet ' + t); continue; } fs.writeFileSync(path.join(OUT, 'dev-' + t + '.png'), Buffer.from(r.png.split(',')[1], 'base64')); console.log(t, (Date.now() - t0) + 'ms', 'hi', r.kb + 'K', 'mid', r.kbm + 'K', JSON.stringify(r.meta.c.map(q => q.slice(0, 3).concat(q.slice(9))))); }
  console.log('errors', errs); await b.close(); })();
