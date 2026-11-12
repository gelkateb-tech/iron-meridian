// Headless balance run: node tools/balance.js <days> <runs> [pickIndex]
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const days = +(process.argv[2] || 60), runs = +(process.argv[3] || 3), pick = process.argv[4] || '0';
  const b = await chromium.launch(); const errs = [];
  for (let r = 0; r < runs; r++){
    const p = await b.newPage({ viewport: { width: 1000, height: 700 } }); p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.join(__dirname, '..', '.test', 'page.html')); await p.waitForTimeout(400);
    await p.click(`[data-act="pick"][data-p="${pick}"]`); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.click('#sp0');
    const res = await p.evaluate(d => { const im = window.__im, S = im.S, dead = {}, snap = {}; let prevO = S.owner.slice(), churn = 0;
      for (let i = 0; i < d*24 && !S.over; i++){ im.tick(); if (i % 24 === 23){ for (let q = 0; q < S.owner.length; q++) if (S.owner[q] !== prevO[q]) churn++; prevO = S.owner.slice(); } if (i % 24 === 23){ for (const n of S.nations) if (!n.alive && !dead[n.name]) dead[n.name] = Math.floor(S.hour/24); if ([20,40].includes(Math.floor(S.hour/24))) snap[Math.floor(S.hour/24)] = S.nations.filter(n=>n.alive).map(n => `${n.name.slice(0,6)}:${S.owner.filter(o => o === n.id).length}`).join(' '); } }
      const rs = {}; for (const k in S.rel) rs[S.rel[k].st] = (rs[S.rel[k].st] || 0) + 1; return { day: Math.floor(S.hour/24), over: S.over, reason: S.overReason, churn, rel: rs, allyEver: S.log.filter(l => /alliance/.test(l.text)).length, end: S.nations.filter(n=>n.alive).map(n => `${n.name.slice(0,6)}:${S.owner.filter(o => o === n.id).length}`).join(' '), dead, snap, units: S.armies.filter(a=>a.owner>=0).reduce((s,a)=>s+a.u.inf+a.u.tank+a.u.art+a.u.jet,0),
        // economy and air mix at the end: AI metal hoards (>1,000 RES_K, shown in thousands) with their cash, the world metal price against its base, fighters vs bombers in service
        hoards: S.nations.filter(n=>n.alive && n.id>0 && n.metal>1000*RES_K).map(n => n.name.slice(0,6) + ':' + Math.round(n.metal/RES_K) + 'Km/$' + Math.round(n.cash)).join(' ') || 'none', metalPx: S.mkt ? +(S.mkt.p.metal/2.4).toFixed(2) : null,
        air: ['asf','int','bomb','awacs','drone','jam'].map(t => t + ':' + S.armies.filter(a=>a.owner>0).reduce((s,a)=>s+(a.u[t]||0),0)).join(' '), asf1: S.nations.filter(n=>n.id>0 && n.tech && n.tech.u_asf).length, steps: (d => d[d.length >> 1])(S.nations.filter(n=>n.id>0 && n.alive).map(n=>Object.keys(n.tech).reduce((s,k)=>s+(+n.tech[k]||1),0)).sort((a,b)=>a-b)), gens: S.nations.filter(n=>n.id>0 && n.tech && Object.keys(n.tech).some(k=>/_g\d$/.test(k))).length }; }, days);
    console.log(`run ${r+1}:`, JSON.stringify(res));
    await p.close();
  }
  console.log('ERRORS', errs.length ? errs : 'none'); await b.close();
})();
