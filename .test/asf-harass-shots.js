// FIGHTER round 2 screenshots (owner 2026-11-28): the Air Superiority Fighter's weaker Attack (one plain attack number), harassment of troops at
// sea and of an army on the move, and the Strike Fighter's Patrol. Browser, after bash tools/mkpage.sh in the tree whose page is shot:
//   node .test/asf-harass-shots.js <page.html> <label> <outdir> [phone|desk|both] [clip]
// label names the files (<outdir>/<label>-<phone|desk>-<shot>.png), so a master page and this branch's page shot with the same script give
// pairs with the same camera. Russia plays; Germany is at war with it; a German convoy of 3 infantry sails between two sea zones near Saint
// Petersburg and 3 German infantry march on Moscow from a province about 4 hexes out (made just before its strike). Shots:
//   panel      the capital's ASF wing selected (its panel and command bar)
//   info       its Army Info (attack and defence against each kind of target)
//   convoy-0   the ASF's order on the convoy: Attack where the build has it (a tap on the convoy's counter), else its mission button
//   convoy-1..3  the strike over the convoy (the drawn strike, the damage chip) and the report
//   march-0, march-1..3  the same on the marching infantry
//   jet-patrol a Strike Fighter wing: on Patrol where the build has it, else its command bar
// clip (desktop only): <outdir>/<label>-march-clip.webm, the strike on the marching army (the caller cuts it to MP4 with ffmpeg)
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs'), pickNation = require('./pick-nation.js');
const PAGE = path.resolve(process.argv[2]), LABEL = process.argv[3], OUT = process.argv[4], MODE = process.argv[5] || 'both', CLIP = process.argv[6] === 'clip';
fs.mkdirSync(OUT, { recursive: true });
const LOGF = path.join(OUT, `${LABEL}-log.txt`); const log = (...a) => { const t = [LABEL, ...a].join(' '); console.log(t); fs.appendFileSync(LOGF, t + '\n'); };
async function run(phone){
  const W = phone ? 440 : 1440, H = phone ? 956 : 900, tag = phone ? 'phone' : 'desk', shot = async n => { await p.evaluate(() => { const k = document.querySelector('[data-act="tip-skip"]'); if (k) k.click(); }); await p.screenshot({ path: path.join(OUT, `${LABEL}-${tag}-${n}.png`) }); };
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const clip = CLIP && !phone, ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: phone, isMobile: false, ...(clip ? { recordVideo: { dir: OUT, size: { width: 960, height: 600 } } } : {}) });
  const p = await ctx.newPage(), errors = [], t0 = Date.now(); p.setDefaultTimeout(15000); p.on('pageerror', e => errors.push(e.message));
  const cdp = phone ? await ctx.newCDPSession(p) : null;
  await p.goto('file://' + PAGE + '?start=nations'); await p.waitForSelector('[data-act="pick"]', { timeout: 60000 }); await p.waitForTimeout(800);
  await pickNation(p, 'Russia'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 60000 }); await p.waitForTimeout(1500);
  const press = async q => { if (phone){ await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: q[0], y: q[1] }] }); await p.waitForTimeout(100); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
    else { await p.mouse.move(q[0], q[1]); await p.mouse.down(); await p.waitForTimeout(100); await p.mouse.up(); } await p.waitForTimeout(250); };
  const settle = () => p.waitForFunction(() => !window.__im.mapBusy || !window.__im.mapBusy(), null, { timeout: 20000 }).catch(() => {});
  const clean = () => p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const k = document.querySelector('[data-act="tip-skip"]'); if (k) k.click(); });
  // the scene (the same in every build: no rule of this branch is used to set it up)
  const sc = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, hd = (a, b) => { const A = G.P[a].cc, B = G.P[b].cc; return Math.hypot(A[0] - B[0], A[1] - B[1]); };
    S.speed = 0; const e = S.nations.findIndex(N => N.name === 'Germany'); im.fix.declareWar(0, e);
    const asf = S.armies.find(x => x.owner === 0 && x.air && x.u.asf), cap = asf.air.base, C = G.P[cap];
    const spb = G.P.find(P => (P.cityName || P.name) === 'Saint Petersburg');
    const zs = G.P.filter(P => P.sea && P.nbs.includes(spb.id)).sort((a, b) => a.id - b.id), z = zs[0], z2 = G.P[z.nbs.filter(v => G.P[v].sea && v !== z.id).sort((u, v) => hd(u, spb.id) - hd(v, spb.id))[0]];
    const conv = im.addArmy(e, z.id, { inf: 3 }); conv.m = 80; im.orderMove(conv, z2.id);
    for (let i = 0; i < 6 && conv.to === null; i++) im.tick();
    // (identified, as under a recon UAV's reveal: S.intel, so the convoy at sea and the column show who they are, not '?')
    S.reveal = S.reveal || {}; const I = (S.intel = S.intel || {})[0] = (S.intel[0] || {}); for (const q of [z.id, z2.id, ...z.nbs]){ S.reveal[q] = S.hour + 500; I[q] = S.hour + 500; }
    const jet = im.addArmy(0, cap, { jet: 2 }); jet.air = { base: cap, cd: 0 }; jet.m = 80; asf.air.cd = 0;
    return { e, asf: asf.id, jet: jet.id, cap, cx: C.x, cy: C.y, z: z.name, z2: z2.name, conv: conv.id, convOn: conv.to !== null }; });
  log(tag, 'scene', JSON.stringify(sc));
  // (the camera: camGo, the game's own move, so no zoom tween takes it back; then wait for its glide to end)
  const center = async (x, y, hp) => { await p.evaluate(([x, y, hp]) => { const im = window.__im; im.camGo(x, y, hp/(im.hexPx()/im.view.s)); }, [x, y, hp]);
    await p.waitForFunction(() => !window.__im.camFly, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(300);
    // then the point is put in the middle of the map that shows: under the top bar, above the command bar and (phone) the bottom sheet
    const at = await p.evaluate(([x, y]) => { const im = window.__im, v = im.view, r = document.getElementById('map').getBoundingClientRect(), [sx, sy] = im.toScreen(x, y);
      const tops = ['cmdbar', 'side'].map(id => document.getElementById(id)).filter(el => el && !el.hidden && el.getBoundingClientRect().height > 0 && el.getBoundingClientRect().left < r.left + r.width/2 && el.getBoundingClientRect().right > r.left + r.width/2).map(el => el.getBoundingClientRect().top);
      const top = 100, bot = Math.min(r.top + r.height, ...tops.filter(t => t > top + 120)), gx = r.width/2, gy = (top + bot)/2 - r.top;
      v.x += gx - sx; v.y += gy - sy; im.redraw(); const q = im.toScreen(x, y); return [Math.round(q[0] + r.left), Math.round(q[1] + r.top), Math.round(bot)]; }, [x, y]);
    await p.waitForTimeout(300); log(tag, 'camera hexPx', await p.evaluate(() => +window.__im.hexPx().toFixed(1)), 'point at', JSON.stringify(at)); };
  const away = () => phone ? null : p.mouse.move(W - 30, H - 30);
  await p.click('[data-act="tip-skip"]', { timeout: 1500 }).catch(() => {}); await p.waitForTimeout(200);
  const posOf = id => p.evaluate(id => { const im = window.__im, a = im.S.armies.find(q => q.id === id); return im.dispPos(a); }, id);
  const select = id => p.evaluate(id => { const im = window.__im; im.clearSel(); im.selectArmy(id); }, id);
  // the panel and Army Info
  await select(sc.asf); await p.waitForTimeout(500); await center(sc.cx, sc.cy, phone ? 34 : 44); await p.waitForTimeout(800); await settle(); await clean(); await away(); await p.waitForTimeout(500); await shot('panel');
  await p.click('#side [data-act="army-info"], [data-act="army-info"]').catch(e => log('no army-info button', e.message)); await p.waitForTimeout(700); await shot('info');
  const rows = await p.evaluate(() => { const m = document.getElementById('modal'); return m ? m.textContent.replace(/\s+/g, ' ').slice(0, 700) : ''; }); log(tag, 'Army Info:', rows);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  // the convoy and the marching army: the ASF's order on the force's counter, then the strike
  const strike = async (fid, name) => { const q = await posOf(fid), C = [sc.cx, sc.cy], mid = [q[0]*0.8 + C[0]*0.2, q[1]*0.8 + C[1]*0.2];
    await select(sc.asf); await p.waitForTimeout(500); await center(mid[0], mid[1], phone ? 30 : 40); await p.waitForTimeout(600); await settle(); await clean(); await p.waitForTimeout(300);
    const hasAtk = await p.$('#cmdbar [data-act="cm-attack"]'); await p.click(hasAtk ? '#cmdbar [data-act="cm-attack"]' : '#cmdbar [data-act="cm-move"]'); await p.waitForTimeout(250);
    const hit = await p.evaluate(fid => { const im = window.__im, r = document.getElementById('map').getBoundingClientRect(), h = im.v3c.hits().find(h => h.ids.includes(fid)); if (h) return [h.x + h.w/2 + r.left, h.y + h.h/2 + r.top];
      const a = im.S.armies.find(q => q.id === fid), xy = im.dispPos(a), s = im.toScreen(xy[0], xy[1]); return [s[0] + r.left, s[1] + r.top]; }, fid);
    log(tag, name, 'tap at', JSON.stringify(hit)); await press(hit); await away(); await p.waitForTimeout(400);
    const o = await p.evaluate(([id, fid]) => { const im = window.__im, a = im.S.armies.find(x => x.id === id); im.selectArmy(id); return { fly: a.fly && { kind: a.fly.kind, foe: a.fly.foe, tgt: im.G.P[a.fly.tgt].name, ph: a.fly.ph }, side: (document.getElementById('side') || {}).textContent.replace(/\s+/g, ' ').slice(0, 200), toast: [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | ') }; }, [sc.asf, fid]);
    log(tag, name, 'order', JSON.stringify(o)); await p.waitForTimeout(300); await shot(`${name}-0`);
    if (!o.fly){ return; }
    await center(mid[0], mid[1], phone ? 30 : 40); await away();
    const ts = Date.now(); await p.evaluate(() => { window.__im.S.speed = 3; });   // (4x: a game hour every 3.75 s)
    // wait for the rules' strike (the flight out over), then for the drawn wing to reach its station: the drawn strike and the damage chip come as it arrives
    await p.waitForFunction(id => { const im = window.__im, a = im.S.armies.find(x => x.id === id), v = im.VW.get(id); return !!a.fly && a.fly.ph !== 'out' && !!v && v.stage === 'over' && v.tgt === a.fly.tgt; }, sc.asf, { timeout: 120000, polling: 50 }).catch(() => log(tag, name, 'no over stage'));
    const tS = Date.now(); await p.waitForTimeout(150); await shot(`${name}-1`); await p.waitForTimeout(450); await shot(`${name}-2`); await p.waitForTimeout(900); await shot(`${name}-3`);
    const rep = await p.evaluate(([id, fid]) => { const im = window.__im, S = im.S, f = S.armies.find(x => x.id === fid); im.S.speed = 0; return { log: (S.log || []).slice(0, 2).map(x => x.text), foe: f && { to: f.to, path: f.path.length }, toast: [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | ') }; }, [sc.asf, fid]);
    log(tag, name, 'report', JSON.stringify(rep));
    // bring it home for the next order
    await p.evaluate(id => { const im = window.__im, a = im.S.armies.find(x => x.id === id); a.fly = null; a.air.cd = 0; im.VW.delete(id); im.clearSel(); }, sc.asf); await p.waitForTimeout(400);
    return { ts: ts - t0, tS: tS - t0 }; };
  const tc = await strike(sc.conv, 'convoy');
  // the marching column, made now (so it marches only while the ASF flies at it): 3 German infantry about 4 hexes west of Moscow, ordered on Moscow
  const mk = await p.evaluate(([e, cap]) => { const im = window.__im, S = im.S, G = im.G, C = G.P[cap];
    const L = G.P.filter(P => !P.sea && S.owner[P.id] === 0 && !P.city && P.nbs.length && !S.armies.some(a => a.at === P.id)).map(P => [P, Math.hypot(P.x - C.x, P.y - C.y)]).filter(q => q[1] > 40 && q[1] < 60 && q[0].x < C.x).sort((x, y) => x[1] - y[1])[0][0];
    const march = im.addArmy(e, L.id, { inf: 3 }); march.m = 80; im.orderMove(march, cap);
    for (let i = 0; i < 6 && march.to === null; i++) im.tick();
    const I = (S.intel = S.intel || {})[0] = (S.intel[0] || {}); for (const q of [L.id, ...L.nbs]) I[q] = S.hour + 500;
    return { march: march.id, L: L.name, on: march.to !== null }; }, [sc.e, sc.cap]);
  log(tag, 'march column', JSON.stringify(mk));
  const tm = await strike(mk.march, 'march');
  // the Strike Fighter's Patrol
  await select(sc.jet); await p.waitForTimeout(500); await center(sc.cx, sc.cy, phone ? 34 : 44); await p.waitForTimeout(800); await settle(); await clean(); await p.waitForTimeout(300);
  if (await p.$('#cmdbar [data-act="cm-patrol"]')){ await p.click('#cmdbar [data-act="cm-patrol"]'); await p.waitForTimeout(200);
    const P = await p.evaluate(cap => { const im = window.__im, G = im.G, C = G.P[cap], T = G.P.filter(P => !P.sea && im.S.owner[P.id] === 0 && P.id !== cap).map(P => [P, Math.hypot(P.x - C.x, P.y - C.y)]).filter(q => q[1] > 14).sort((x, y) => x[1] - y[1])[0][0], r = document.getElementById('map').getBoundingClientRect(), s = im.toScreen(T.x, T.y); return { n: T.name, q: [s[0] + r.left, s[1] + r.top] }; }, sc.cap);
    await press(P.q); const st = await p.evaluate(id => { const im = window.__im, a = im.S.armies.find(x => x.id === id); for (let i = 0; i < 12 && a.fly && a.fly.ph !== 'patrol'; i++) im.tick(); im.S.speed = 1; im.selectArmy(id); return a.fly && a.fly.ph; }, sc.jet);
    await away(); await p.waitForTimeout(2500); await clean(); await shot('jet-patrol'); await p.evaluate(() => { window.__im.S.speed = 0; }); log(tag, 'jet patrol over', P.n, st); }
  else { await shot('jet-patrol'); log(tag, 'no Patrol button for the Strike Fighter'); }
  log(tag, 'page errors', JSON.stringify(errors.slice(0, 3)));
  const vid = clip ? p.video() : null; await ctx.close(); await b.close();
  if (vid){ const f = await vid.path(), to = path.join(OUT, `${LABEL}-march-clip.webm`); fs.renameSync(f, to); fs.writeFileSync(to + '.json', JSON.stringify({ march: tm, convoy: tc })); log('clip', to, JSON.stringify(tm)); } }
(async () => { if (MODE !== 'desk') await run(true); if (MODE !== 'phone') await run(false); })().catch(e => { console.error(e); process.exit(1); });
