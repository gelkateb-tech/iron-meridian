// Patrolling aircraft: tappable at every zoom, and a calm patrol (FIGHTER-ASF, owner playtest 2026-11-27, items 2c and 2d). Browser test, after
// bash tools/mkpage.sh:   node .test/air-tap.js [phone|desk|both] [outdir]      (default both; exit 1 on a failure or a page error)
// Russia's Air Superiority Fighter (the one every capital starts with) is sent on patrol over a province about two hexes from Moscow; then:
// 1. the drawn patrol (index.html PATROL TRACK): it stays within 13 world px (about 113 km) of the patrol point and leaves it (a loop, not a
//    point: at least 5 px out), flies about the rules' speed at 1x (2 to 5 world px a real second), never over PTRK_CAP (8) at the 8x button,
//    stands still while paused, turns smoothly (no turn tighter than 1.7 world px) with the nose on its path
// 2. taps (2d): at hexPx 6, 16, 40, 90 and 200 a real tap aimed where the plane was drawn, pressed 150 ms later and lifted 100 ms after that
//    (by touch on a 440 px phone, by mouse on a 1440 px desktop) selects the wing at least 5 times in 6, and the side panel is the wing's own
//    (Air wing, its unit rows, its condition) with the command bar's Return button live; the same at the 8x speed at hexPx 40 and 200
// 3. drawn afresh while on patrol (a save loaded) it shows on its track at once; the panel's orders: the ASF's bar has Patrol, Attack, Rebase,
//    Split, Merge, Return; Return sends it home (rules/air.js recallAir)
// Screenshots: <outdir>/air-tap-<phone|desk>-z<hexPx>.png (the selected wing after a tap)
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs'), pickNation = require('./pick-nation.js');
const MODE = process.argv[2] || 'both', OUT = process.argv[3] || path.join(__dirname, 'air-tap-shots'); fs.mkdirSync(OUT, { recursive: true });
const ZOOMS = process.env.ZOOMS ? process.env.ZOOMS.split(',').map(Number) : [6, 16, 40, 90, 200], FAST = process.env.ZOOMS ? [] : [40, 200];
let fails = 0; const ok = (c, msg, info) => { console.log((c ? 'ok    ' : 'FAIL  ') + msg + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 300) : '')); if (!c) fails++; };
async function run(phone){
  const W = phone ? 440 : 1440, H = phone ? 956 : 900, tag = phone ? 'phone' : 'desk';
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: phone, isMobile: false }), p = await ctx.newPage(), errors = [];
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const cdp = phone ? await ctx.newCDPSession(p) : null;
  await p.goto('file://' + path.join(__dirname, 'page.html') + '?start=nations'); await p.waitForSelector('[data-act="pick"]', { timeout: 60000 }); await p.waitForTimeout(800);
  await pickNation(p, 'Russia'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 60000 }); await p.waitForTimeout(1200);
  const info = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove());
    const im = window.__im, S = im.S, G = im.G, a = S.armies.find(x => x.owner === 0 && x.air && x.u.asf), B = G.P[a.air.base];
    const T = G.P.filter(P => !P.sea && S.owner[P.id] === 0 && P.id !== B.id && !S.bld[P.id].air).map(P => [P, Math.hypot(P.x - B.x, P.y - B.y)]).filter(q => q[1] > 30).sort((x, y) => x[1] - y[1])[0][0];
    const ok = im.orderAir(a, T.id); S.speed = 1; for (let i = 0; i < 12 && a.fly.ph !== 'patrol'; i++) im.tick();
    return { id: a.id, ok, T: T.id, name: T.cityName || T.name, tx: T.x, ty: T.y, ph: a.fly.ph }; });
  ok(info.ok && info.ph === 'patrol', `${tag}: the ASF is on patrol over ${info.name}`, info);
  const center = hp => p.evaluate(([x, y, hp, id]) => { const im = window.__im, w = im.S.armies.find(q => q.id === id); if (w && w.fly && w.fly.ph === 'patrol') w.fly.hrs = 12;   /* (the test keeps it on patrol) */ const v = im.view, s = hp/12, r = document.getElementById('map').getBoundingClientRect(); v.s = s; v.x = r.width/2 - x*s; v.y = r.height*0.45 - y*s; im.redraw(); }, [info.tx, info.ty, hp, info.id]);
  const clear = () => p.evaluate(() => { const im = window.__im; im.clearSel(); document.querySelectorAll('.toast').forEach(t => t.remove()); });
  // 1. the patrol's drawn path
  // (a sample only when the drawn spot moved: one a frame; the speed is per frame time capped at 0.1 s, as the page's own step: wingVis dtV)
  const sample = ms => p.evaluate(([id, ms]) => new Promise(res => { const pts = [], t0 = performance.now(); const f = () => { const v = window.__im.VW.get(id), L = pts[pts.length - 1]; if (v && (!L || L[1] !== v.x || L[2] !== v.y)) pts.push([performance.now(), v.x, v.y, v.stage, v.hd]); if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(pts); }; f(); }), [info.id, ms]);
  const settle = () => p.waitForFunction(() => !window.__im.mapBusy(), null, { timeout: 20000 }).catch(() => {});
  // spd: world px a second; curv: the sharpest turn (heading change per world px; 1/curv is the turn radius); nose: heading against the path
  const stats = pts => { const q = pts.filter(z => z[3] === 'over'); let d = 0, secs = 0, rmax = 0, curv = 0, nose = 0, fr = 0;
    for (let i = 0; i < q.length; i++){ rmax = Math.max(rmax, Math.hypot(q[i][1] - info.tx, q[i][2] - info.ty)); if (!i) continue; const dt = (q[i][0] - q[i - 1][0])/1000, dx = q[i][1] - q[i - 1][1], dy = q[i][2] - q[i - 1][2], st = Math.hypot(dx, dy);
      d += st; secs += Math.min(0.1, dt); fr += dt; let da = q[i][4] - q[i - 1][4]; da = Math.abs(Math.atan2(Math.sin(da), Math.cos(da))); if (st > 0.05) curv = Math.max(curv, da/st);
      if (st > 0.02){ let e = Math.atan2(dy, dx) - q[i][4]; e = Math.abs(Math.atan2(Math.sin(e), Math.cos(e))); nose = Math.max(nose, e); } }
    return { frames: q.length, fps: +(q.length/Math.max(1e-3, fr)).toFixed(1), spd: +(d/Math.max(1e-3, secs)).toFixed(2), rmax: +rmax.toFixed(1), curv: +curv.toFixed(3), nose: +nose.toFixed(3) }; };
  await center(40); await p.waitForTimeout(1500); await settle();
  const s1 = stats(await sample(10000)); console.log(tag, '1x', JSON.stringify(s1));
  ok(s1.frames > 30 && s1.rmax <= 13 && s1.rmax >= 5, `${tag}: on station it loops within 13 world px (113 km) of the patrol point`, s1);
  ok(s1.spd >= 2 && s1.spd <= 5, `${tag}: at 1x it flies about the rules' speed (2-5 world px a second; was 39)`, s1.spd);
  ok(s1.curv < 0.6 && s1.nose < 0.2, `${tag}: it turns smoothly (no turn tighter than 1.7 world px, 15 km) with its nose on its path`, s1);
  await p.evaluate(() => { window.__im.S.speed = 0; }); await p.waitForTimeout(200); const s0 = stats(await sample(2000));
  ok(s0.spd < 0.05, `${tag}: paused, it stands still`, s0.spd);
  await p.evaluate(() => { window.__im.S.speed = 4; }); await p.waitForTimeout(300); const s4 = stats(await sample(3000)); console.log(tag, '8x', JSON.stringify(s4));
  ok(s4.spd <= 8.5 && s4.rmax <= 13 && s4.curv < 0.6, `${tag}: at 8x it is capped (at most 8 world px a second), stays inside the area and turns as smoothly`, s4);
  // 2. taps at every zoom
  // (after a selection is released the phone's sheet closes and the camera may still glide: the test waits for a still view, as a player would)
  const still = () => p.evaluate(() => new Promise(res => { const k = () => { const v = window.__im.view, r = document.getElementById('map').getBoundingClientRect(); return [v.x, v.y, v.s, r.left, r.top, r.width, r.height].map(z => Math.round(z*10)).join(); };
    let last = k(), n = 0, t0 = performance.now(); const f = () => { const c = k(); n = c === last ? n + 1 : 0; last = c; if (n >= 6 || performance.now() - t0 > 3000) res(); else requestAnimationFrame(f); }; requestAnimationFrame(f); }));
  // (aimed only where the plane shows on the map: while it flies under the top bar, the command bar or the sheet a player cannot tap it either)
  const tapOnce = async () => { await still(); const q = await p.evaluate(id => new Promise(res => { const t0 = performance.now(); const f = () => { const im = window.__im, v = im.VW.get(id), r = document.getElementById('map').getBoundingClientRect(), [x, y] = im.toScreen(v.x, v.y), X = x + r.left, Y = y + r.top;
    const clear = [[0, 0], [-22, -22], [22, -22], [-22, 22], [22, 22]].every(([dx, dy]) => document.elementFromPoint(X + dx, Y + dy) === document.getElementById('map'));
    if (clear || performance.now() - t0 > 6000) res([X, Y]); else requestAnimationFrame(f); }; f(); }), info.id);
    await p.waitForTimeout(150);
    if (phone){ await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: q[0], y: q[1] }] }); await p.waitForTimeout(100); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
    else { await p.mouse.move(q[0], q[1]); await p.mouse.down(); await p.waitForTimeout(100); await p.mouse.up(); }
    await p.waitForTimeout(150);
    return p.evaluate(([id, q]) => { const im = window.__im, side = document.getElementById('side'), bar = document.getElementById('cmdbar'), v = im.VW.get(id), r = document.getElementById('map').getBoundingClientRect(), [x, y] = im.toScreen(v.x, v.y);
      return { d: Math.round(Math.hypot(x + r.left - q[0], y + r.top - q[1])), el: (document.elementFromPoint(q[0], q[1]) || {}).id, sel: im.sel.army === id, prov: im.sel.prov, wing: !!side && /Air wing/.test(side.textContent) && /Airframe condition/.test(side.textContent), ret: !!bar && !!bar.querySelector('[data-act="wing-return"]:not([disabled])') }; }, [info.id, q]); };
  for (const [hp, spd] of [...ZOOMS.map(z => [z, 1]), ...FAST.map(z => [z, 4])]){
    await p.evaluate(s => { window.__im.S.speed = s; }, spd); await clear(); await center(hp); await p.waitForTimeout(900); await settle();
    let n = 0, wing = 0, ret = 0, prov = 0; const N = 6;
    for (let k = 0; k < N; k++){ const r = await tapOnce(); if (r.sel) n++; else if (process.env.V) console.log('  miss', JSON.stringify(r)); if (r.sel && r.wing) wing++; if (r.sel && r.ret) ret++; if (r.prov != null) prov++;
      if (k === 0 && r.sel && spd === 1) await p.screenshot({ path: path.join(OUT, `air-tap-${tag}-z${hp}.png`) });
      await clear(); await p.waitForTimeout(120); }
    ok(n >= 5 && wing >= n && ret >= n, `${tag}: hexPx ${hp} at ${spd === 1 ? '1x' : '8x'}: ${n}/${N} taps select the patrolling wing and open its panel`, { n, wing, ret, prov }); }
  // a page opened on a game with the wing already on patrol (a save loaded): it shows on its track at once, no dash from its base
  await p.evaluate(() => { window.__im.S.speed = 1; window.__im.VW.clear(); }); await p.waitForTimeout(400);
  const fresh = await p.evaluate(([id, tx, ty]) => { const v = window.__im.VW.get(id); return v && { stage: v.stage, r: +Math.hypot(v.x - tx, v.y - ty).toFixed(1) }; }, [info.id, info.tx, info.ty]);
  ok(fresh && fresh.stage === 'over' && fresh.r <= 13, `${tag}: drawn afresh (a save loaded) it is on its track at once`, fresh);
  // 3. the command bar and Return
  await p.evaluate(() => { window.__im.S.speed = 0; }); await clear(); await center(40); await p.waitForTimeout(600);
  const bar = await p.evaluate(id => { const im = window.__im; im.selectArmy(id); const el = document.getElementById('cmdbar'); return [...el.querySelectorAll('button')].map(x => x.textContent.replace(/[A-Z]$/, '').replace(/^\W+/, '').trim() + (x.disabled ? '-' : '+')); }, info.id);
  ok(['Patrol', 'Attack', 'Rebase', 'Split', 'Merge', 'Return'].every((t, i) => bar[i] && bar[i].startsWith(t)) && bar[5] === 'Return+', `${tag}: the ASF's bar in the air: Patrol, Attack, Rebase, Split, Merge greyed, Return live`, bar);
  await p.click('#cmdbar [data-act="wing-return"]'); const back = await p.evaluate(id => { const a = window.__im.S.armies.find(x => x.id === id); return a.fly && a.fly.ph; }, info.id);
  ok(back === 'back', `${tag}: Return sends it home`, back);
  ok(!errors.length, `${tag}: no page errors`, errors.slice(0, 3));
  await ctx.close(); await b.close(); }
(async () => { if (MODE !== 'desk') await run(true); if (MODE !== 'phone') await run(false); console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0); })();
