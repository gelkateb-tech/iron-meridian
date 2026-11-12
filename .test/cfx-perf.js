// Frame times during a busy battle on a phone-sized screen: node .test/cfx-perf.js [W H dpr] [throttle=4] [secs=8] [high,low,off]
// 390x844 (touch, mobile), CPU throttled through CDP (Emulation.setCPUThrottlingRate). A battle province close in (figures firing), plus the
// Effects test firing a weapon every 250 ms round it; game speed 4. For Effects High, Low and Off (the map alone, for comparison): the frame time (rAF to rAF) average and 95th
// percentile, the time each map draw takes (drawAvgMs, drawP95Ms: from the frame's start to the end of the page's frame), the map draws per second, and the live particle / shot counts (average and peak). Prints JSON.
const { chromium } = require('playwright'); const path = require('path');
const W = +(process.argv[2] || 390), H = +(process.argv[3] || 844), DPR = +(process.argv[4] || 3), THR = +(process.argv[5] || 4), SECS = +(process.argv[6] || 8), PHONE = W <= 820;
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const out = {}, errors = [];
  for (const fx of (process.argv[7] || 'high,low,off').split(',')){ const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: PHONE, isMobile: PHONE }); const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(fx + ': ' + e.message));
    await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(500);
    await p.click('[data-act="pick"][data-p="0"]'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
    await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 }); await p.waitForTimeout(800);
    // a few days in, so battles are on; then close in on the biggest one
    const where = await p.evaluate(fx => { const im = window.__im; document.querySelectorAll('.toast').forEach(t => t.remove()); newGame(12345, 0, [0]); S.started = true; for (let i = 0; i < 24*3; i++) tick(); im.SET.fx = fx; im.SET.fxPick = true; im.SET.saver = false;
      let best = null, bn = -1; for (const p of im.S.battles){ const n = im.S.armies.filter(a => a.at === p).reduce((s, a) => s + count(a), 0); if (n > bn){ bn = n; best = p; } }
      const P = best != null ? im.G.P[best] : im.G.P.find(q => q.cityName === 'Berlin'), s = 12, ch = document.getElementById('map').getBoundingClientRect().height; im.view.s = s; im.view.x = innerWidth/2 - P.x*s; im.view.y = ch/2 - P.y*s; im.S.speed = 4; im.redraw();
      return { p: P.id, name: P.cityName || P.name, units: bn, battles: im.S.battles.length }; }, fx);
    if (process.argv[8]) await p.evaluate(w => { window.__cfxW = w; }, process.argv[8]);   // (a slash-separated list of weapons, e.g. tank/art/inf)
    const cdp = await ctx.newCDPSession(p); await p.waitForTimeout(6000); await cdp.send('Emulation.setCPUThrottlingRate', { rate: THR }); await p.waitForTimeout(2000);   // (the map's own bakes for the new view settle first)
    const r = await p.evaluate(async ([secs, pid]) => { const im = window.__im, P = im.G.P[pid], W = (wl => wl ? wl.split('/') : im.cfx.M.CFX_W.filter(w => w !== 'recon'))(window.__cfxW); let k = 0;
      const iv = setInterval(() => { const w = W[k++ % W.length]; if (w === 'sam') im.cfx.intercept([P.x - 3, P.y + 3], [P.x, P.y], { kind: 'cm' }); else im.cfx.fire(w, [P.x - 7, P.y + 2.5], [P.x + 2 + (Math.random() - 0.5)*3, P.y + (Math.random() - 0.5)*2]); }, 250);
      const ft = [], dc = [], parts = [], projs = []; let last = performance.now(), nPrev = im.rd.n; const n0 = im.rd.n, t0 = last;
      await new Promise(res => { const f = now => { ft.push(now - last); last = now; if (im.rd.n !== nPrev){ nPrev = im.rd.n; dc.push(performance.now() - now); } const st = im.cfx.stats(); parts.push(st.part); projs.push(st.proj); if (now - t0 < secs*1000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
      clearInterval(iv); const draws = im.rd.n - n0, s = ft.slice(5).sort((a, b) => a - b), avg = s.reduce((a, b) => a + b, 0)/s.length, p95 = s[Math.floor(s.length*0.95)];
      const d = dc.slice(3).sort((a, b) => a - b); return { drawAvgMs: +(d.reduce((a, b) => a + b, 0)/Math.max(1, d.length)).toFixed(1), drawP95Ms: +(d[Math.floor(d.length*0.95)] || 0).toFixed(1), frames: s.length, avgMs: +avg.toFixed(1), p95Ms: +p95.toFixed(1), maxMs: +s[s.length - 1].toFixed(1), drawsPerS: +(draws/secs).toFixed(1), partAvg: +(parts.reduce((a, b) => a + b, 0)/parts.length).toFixed(1), partMax: Math.max(...parts), projMax: Math.max(...projs) }; }, [SECS, where.p]);
    out[fx] = { where, ...r }; console.log(fx, JSON.stringify(out[fx])); await ctx.close(); }
  console.log(JSON.stringify({ screen: `${W}x${H}@${DPR}`, cpuThrottle: THR, out, errors })); await b.close(); process.exit(errors.length ? 1 : 0); })();
