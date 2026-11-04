// Headless balance run: node tools/balance.js <days> <runs> [pickIndex]
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const days = +(process.argv[2] || 60), runs = +(process.argv[3] || 3), pick = process.argv[4] || '0';
  const b = await chromium.launch(); const errs = [];
  for (let r = 0; r < runs; r++){
    const p = await b.newPage({ viewport: { width: 1000, height: 700 } }); p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.join(__dirname, '..', '.test', 'page.html')); await p.waitForTimeout(400);
    await p.click(`[data-act="pick"][data-p="${pick}"]`); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.click('#sp0');
    const res = await p.evaluate(d => { const im = window.__im, S = im.S, dead = {}, snap = {};
      for (let i = 0; i < d*24; i++){ im.tick(); if (i % 24 === 23){ for (const n of S.nations) if (!n.alive && !dead[n.name]) dead[n.name] = Math.floor(S.hour/24); if ([20,40].includes(Math.floor(S.hour/24))) snap[Math.floor(S.hour/24)] = S.nations.filter(n=>n.alive).map(n => `${n.name.slice(0,6)}:${S.owner.filter(o => o === n.id).length}`).join(' '); } }
      return { end: S.nations.filter(n=>n.alive).map(n => `${n.name.slice(0,6)}:${S.owner.filter(o => o === n.id).length}`).join(' '), dead, snap, units: S.armies.filter(a=>a.owner>=0).reduce((s,a)=>s+a.u.inf+a.u.tank+a.u.art+a.u.jet,0) }; }, days);
    console.log(`run ${r+1}:`, JSON.stringify(res));
    await p.close();
  }
  console.log('ERRORS', errs.length ? errs : 'none'); await b.close();
})();
