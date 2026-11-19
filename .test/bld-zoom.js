// Building pictures and the zoom (owner 2026-11-18, item 4: "the building pictures do their own little zoom/pulse instead of scaling exactly with
// the map"). A smooth wheel zoom over Berlin (in, then out, as a player does it), every frame recorded right after the game draws it: each picture's
// drawn size and its anchor on screen, against the map's scale at that frame. A picture that scales exactly with the map keeps its size in world
// units (drawn width / scale) the same at every frame, its anchor stays on toScreen of its world point, and nothing changes once the zoom stops.
// node .test/bld-zoom.js [width height [out.json]]   (needs bash tools/mkpage.sh; exit 1 on a failed check)
const path = require('path'), fs = require('fs'), pickNation = require('./pick-nation.js'), { chromium } = require('playwright');
const W = +process.argv[2] || 1440, H = +process.argv[3] || 900, OUT = process.argv[4] || null, phone = W < 700;
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }), ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: phone, isMobile: phone }), p = await ctx.newPage();
  const errors = [], fails = [], checks = {}; p.on('pageerror', e => errors.push(e.message));
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
  await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 });
  const C = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im, S = im.S, G = im.G; S.speed = 0;
    const be = G.P[S.nations[0].capital]; S.bld[be.id].air = 3; S.bld[be.id].rec = 2; S.bld[be.id].fac = 2;   // (Berlin with a few buildings: the HQ and three more)
    const r = document.getElementById('map').getBoundingClientRect(); return { be: [be.x, be.y], id: be.id, x: r.left, y: r.top, w: r.width, h: r.height }; });
  const look = (hp) => p.evaluate(([x, y, hp, w, h]) => { const v = window.__im.view, s = hp/12; v.s = s; v.x = w/2 - x*s; v.y = h/2 - y*s; window.__im.redraw && window.__im.redraw(); }, [C.be[0], C.be[1], hp, C.w, C.h]);
  await look(30); await p.waitForTimeout(2500);
  // the recorder: a requestAnimationFrame callback registered after the game's own, so it runs right after each frame is drawn
  await p.evaluate(id => { const im = window.__im; window.__rec = []; window.__recOn = true;
    const f = () => { if (!window.__recOn) return; const v = im.view, L = im.bn.dbg.filter(e => e.p === id).map(e => { const [sx, sy] = im.toScreen(e.wx, e.wy); return {k:e.k, x:e.x, y:e.y, sx, sy, w:e.box[2] - e.box[0], h:e.box[3] - e.box[1], b0:e.box[0], b1:e.box[1], a:e.a, wx:e.wx, wy:e.wy}; });
      window.__rec.push({t:performance.now(), s:v.s, vx:v.x, vy:v.y, L}); requestAnimationFrame(f); }; requestAnimationFrame(f); }, C.id);
  await p.mouse.move(C.x + C.w/2, C.y + C.h/2);
  for (let i = 0; i < 26; i++){ await p.mouse.wheel(0, -160); await p.waitForTimeout(45); }   // zoom in (from 30 px a hex to the closest zoom, 240)
  await p.waitForTimeout(900);
  for (let i = 0; i < 26; i++){ await p.mouse.wheel(0, 160); await p.waitForTimeout(45); }    // and out again
  await p.waitForTimeout(1200);
  const rec = await p.evaluate(() => { window.__recOn = false; return window.__rec; });
  // per picture: its size in world units (drawn width / scale) at every frame, and its anchor's distance from toScreen of its world point
  const keys = [...new Set(rec.flatMap(r => r.L.map(e => e.k)))], per = {};
  for (const k of keys){ const fr = rec.map(r => ({t:r.t, s:r.s, hp:r.s*12, e:r.L.find(e => e.k === k)})).filter(q => q.e && q.e.a > 0.02);
    const ws = fr.map(q => q.e.w/q.s).sort((a, c) => a - c), med = ws[ws.length >> 1] || 1;
    const dev = Math.max(0, ...fr.map(q => Math.abs(q.e.w/q.s/med - 1))), anc = Math.max(0, ...fr.map(q => Math.hypot(q.e.x - q.e.sx, q.e.y - q.e.sy)));
    // the zoom's end: the last frames once the scale holds still against the frames just before (a pop or a sharpen step shows here)
    let jump = 0; for (let i = 1; i < fr.length; i++) if (fr[i].s === fr[i - 1].s) jump = Math.max(jump, Math.abs(fr[i].e.w - fr[i - 1].e.w), Math.abs(fr[i].e.b1 - fr[i - 1].e.b1));
    per[k] = {frames:fr.length, hpMin:+Math.min(...fr.map(q => q.hp)).toFixed(1), hpMax:+Math.max(...fr.map(q => q.hp)).toFixed(1), worldW:+med.toFixed(3), maxDevPct:+(dev*100).toFixed(2), anchorPx:+anc.toFixed(3), stillJumpPx:+jump.toFixed(3),
      series:fr.map(q => [Math.round(q.t - rec[0].t), +q.hp.toFixed(2), +q.e.w.toFixed(2), +(q.e.w/q.s/med).toFixed(4)])}; }
  checks.frames = rec.length; checks.hp = [+Math.min(...rec.map(r => r.s*12)).toFixed(1), +Math.max(...rec.map(r => r.s*12)).toFixed(1)];
  for (const k of keys){ const q = per[k]; checks[k] = {frames:q.frames, hp:[q.hpMin, q.hpMax], maxDevPct:q.maxDevPct, anchorPx:q.anchorPx, stillJumpPx:q.stillJumpPx};
    if (q.maxDevPct > 1) fails.push(`${k}: its size against the map's scale changes ${q.maxDevPct}% during the zoom (more than 1%)`);
    if (q.anchorPx > 0.75) fails.push(`${k}: its anchor leaves its world point by ${q.anchorPx} px`);
    if (q.stillJumpPx > 0.5) fails.push(`${k}: it changes by ${q.stillJumpPx} px while the map holds still (a pop when the zoom stops)`); }
  if (!per.hq || per.hq.frames < 40) fails.push('too few frames of the HQ recorded');
  if (OUT) fs.writeFileSync(OUT, JSON.stringify({W, H, checks, per}, null, 0));
  console.log(JSON.stringify({checks, fails, errors}, null, 1));
  console.log(fails.length || errors.length ? `FAILED ${fails.length} checks, ${errors.length} errors` : `OK ${keys.length} pictures, ${rec.length} frames`);
  await b.close(); process.exit(fails.length || errors.length ? 1 : 0); })();
