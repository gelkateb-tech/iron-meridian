// debug: a town's plan drawn flat (density grey, streets, L0 red, L1 blue, L2 green, trees dark green): node .test/city-planimg.js out.png City
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs'); const pickNation = require('./pick-nation.js');
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const ctx = await b.newContext({ viewport:{width:1000, height:900}, deviceScaleFactor:1 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, process.env.PAGE || 'page.html')); await p.waitForTimeout(900);
  await p.click('[data-act="pickscn"][data-k="world64"]'); await p.waitForTimeout(300); await pickNation(p, 'Germany');
  await p.evaluate(() => document.querySelector('[data-act="begin"]').scrollIntoView()); await p.click('[data-act="begin"]'); await p.waitForTimeout(1300);
  if (await p.locator('[data-act="start"]').count()) await p.click('[data-act="start"]'); await p.waitForTimeout(2500);
  for (const nm of process.argv.slice(3)){
  const url = await p.evaluate(nm => { const im = window.__im; im.S.speed = 0; const P = im.G.P.find(q => q.cityName === nm); im.view.s = 30/12; im.cityDbg.time(P.id, 128); const D = im.cityDbg.planGeo(P.id);
    const N = 900, k = N/(2*D.E), c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), X = x => (x + D.E)*k;
    const M = D.M; const im2 = g.createImageData(M, M); for (let q = 0; q < M*M; q++){ const v = 255 - D.aM[q]*0.5; im2.data[q*4] = im2.data[q*4 + 1] = im2.data[q*4 + 2] = v; im2.data[q*4 + 3] = 255; } const t = document.createElement('canvas'); t.width = t.height = M; t.getContext('2d').putImageData(im2, 0, 0); g.drawImage(t, 0, 0, N, N);
    if (D.OC){ const n = D.ON, t2 = document.createElement('canvas'); t2.width = t2.height = n; const g2 = t2.getContext('2d'), id = g2.createImageData(n, n); for (let q = 0; q < n*n; q++) if (D.OC[q]){ id.data[q*4] = 255; id.data[q*4 + 1] = 160; id.data[q*4 + 3] = 140; } g2.putImageData(id, 0, 0); g.drawImage(t2, 0, 0, N, N); }
    g.strokeStyle = '#999'; g.beginPath(); g.arc(X(0), X(0), D.r*k, 0, 7); g.stroke();
    const pl = (A, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); for (let i = 0; i < A.length; i += 2) i ? g.lineTo(X(A[i]), X(A[i + 1])) : g.moveTo(X(A[i]), X(A[i + 1])); g.stroke(); };
    for (const k2 of [1, 2, 3]) for (const q of D.ST[k2]) pl(q, k2*0.7, '#555'); for (const a of D.av) pl(a, 3, '#c80');
    for (const q of D.PK){ g.fillStyle = '#9c6'; g.beginPath(); for (let i = 0; i < 8; i += 2) i ? g.lineTo(X(q[i]), X(q[i + 1])) : g.moveTo(X(q[i]), X(q[i + 1])); g.fill(); }
    for (const t of D.T){ g.fillStyle = ['#063', '#285', '#4a7'][t[3]]; g.beginPath(); g.arc(X(t[0]), X(t[1]), Math.max(1, t[2]*k), 0, 7); g.fill(); }
    for (const [lv, q] of D.B){ g.fillStyle = ['#d22', '#26d', '#2a2'][lv]; g.beginPath(); for (let i = 0; i < 8; i += 2) i ? g.lineTo(X(q[i]), X(q[i + 1])) : g.moveTo(X(q[i]), X(q[i + 1])); g.fill(); }
    for (const [x, y, d, m] of D.DC || []){ g.fillStyle = m ? 'rgba(0,0,0,' + (0.2 + d*0.8) + ')' : '#f0f'; g.fillRect(X(x) - 3, X(y) - 3, 6, 6); }
    for (const n of D.NB || []){ g.strokeStyle = '#f0f'; g.beginPath(); g.arc(X(n[0]), X(n[1]), n[2]*k, 0, 7); g.stroke(); }
    return c.toDataURL('image/png'); }, nm);
  fs.writeFileSync(process.argv[2].replace('.png', '-' + nm.replace(/\W/g, '') + '.png'), Buffer.from(url.split(',')[1], 'base64')); }
  console.log('ERR', errs.slice(0, 3)); await b.close(); })();
