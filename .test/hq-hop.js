// The player's capital HQ at game start (cities merge, owner default "the player's capital lots first"): a new nations-world game as Germany,
// every frame from Begin to 3 s after Start (and at least 3 s after the HQ is first drawn) recorded right after the game draws it (t: ms from the
// Start click): Berlin's HQ picture, its anchor on screen and in the world.
// The camera flies home meanwhile, so the hop is measured on the world anchor: a frame where the HQ's world anchor moves, times the map's
// scale, is a hop on screen (px). Before the fix the HQ stood in the town's old cluster until its lots were worked out (about 0.3 s in),
// then hopped about 4.6 px onto its lot. Exit 1 on a hop over 0.5 px, a page error or (desktop) no HQ drawn
// (a phone's home view is zoomed out past the building pictures: none drawn is no failure there). Prints JSON {first, hops, maxHop, frames, errors}.
// node .test/hq-hop.js [width height [out.json]]   (needs bash tools/mkpage.sh; PAGE=other.html for another page)
const path = require('path'), fs = require('fs'), pickNation = require('./pick-nation.js'), { chromium } = require('playwright');
const W = +process.argv[2] || 1440, H = +process.argv[3] || 900, OUT = process.argv[4] || null, phone = W < 700;
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }), ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: phone, isMobile: phone }), p = await ctx.newPage();
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.goto('file://' + path.join(__dirname, process.env.PAGE || 'page.html')); await p.waitForTimeout(500);
  await p.click('[data-act="pickscn"][data-k="world64"]').catch(() => {}); await p.waitForTimeout(300);
  await pickNation(p, 'Germany');
  await p.evaluate(() => { window.__rec = []; window.__recOn = true;
    const f = () => { if (!window.__recOn) return; const im = window.__im; if (im && im.S && im.G && im.bn){ const S = im.S, n = S.nations[0], cap = n && n.capital, P = cap != null ? im.G.P[cap] : null;
        const e = P ? im.bn.dbg.find(d => d.p === cap && d.k === 'hq') : null; const v = im.view;
        window.__rec.push({t:performance.now() - (window.__t0 || performance.now()), hx:im.hexPx(), fly:!!im.camFly, s:v.s, hq:e ? {x:e.x, y:e.y, wx:e.wx - P.x, wy:e.wy - P.y} : null}); }
      requestAnimationFrame(f); }; requestAnimationFrame(f); });
  await p.evaluate(() => document.querySelector('[data-act="begin"]').scrollIntoView()); await p.click('[data-act="begin"]');
  await p.waitForSelector('[data-act="start"]', {timeout:8000}).catch(() => {});
  if (await p.locator('[data-act="start"]').count()){ await p.evaluate(() => { window.__t0 = performance.now(); }); await p.click('[data-act="start"]'); } else await p.evaluate(() => { window.__t0 = performance.now(); });
  await p.waitForFunction(() => { const R = window.__rec, h = R.find(r => r.hq); return R.length && R[R.length - 1].t > Math.max(3000, h ? h.t + 3000 : 9000); }, null, {timeout:90000});   // (to 3 s after Start and 3 s after the HQ is first drawn: a slow machine's first frames come late)
  const rec = await p.evaluate(() => { window.__recOn = false; return window.__rec; }), capMs = await p.evaluate(() => { const q = window.__im.cityDbg.lotQ(); return q.cap == null ? null : +q.cap.toFixed(1); }).catch(() => null);
  const sh = rec.filter(r => r.hq); const hops = []; let maxHop = 0;
  for (let i = 1; i < sh.length; i++){ const a = sh[i - 1].hq, c = sh[i].hq, d = Math.hypot(c.wx - a.wx, c.wy - a.wy)*sh[i].s; if (d > 0.05) hops.push({t:+sh[i].t.toFixed(0), px:+d.toFixed(2)}); maxHop = Math.max(maxHop, d); }
  const out = {page:process.env.PAGE || 'page.html', W, H, frames:rec.length, first:sh.length ? +sh[0].t.toFixed(0) : null, shown:sh.length, hops, maxHop:+maxHop.toFixed(2), capMs,
    anchor:sh.length ? [+sh[0].hq.wx.toFixed(3), +sh[0].hq.wy.toFixed(3), +sh[sh.length - 1].hq.wx.toFixed(3), +sh[sh.length - 1].hq.wy.toFixed(3)] : null, errors};
  console.log(JSON.stringify(out)); if (OUT) fs.writeFileSync(OUT, JSON.stringify({out, rec}));
  await b.close(); process.exit(maxHop > 0.5 || errors.length || (!sh.length && !phone) ? 1 : 0); })().catch(e => { console.error(e); process.exit(2); });
