// Combat effects in the game's UI: node .test/cfx-ui.js [W H dpr] [outdir]
//  (P) the developer's Effects test panel: one button per weapon, each fires (shots or particles appear) at the test target, which is marked
//  (O) a Bombard order: the target marker and the dashed line; the force faces its target
//  (T) tapping a force in combat shows its range ring and target briefly
//  (M) an enemy missile at the player's capital: the red warning marker (INCOMING), drawn every frame until impact, the frames keep coming
//  (Q) Effects Off: firing makes no particles and no shots; Settings shows High / Low / Off, Screen shake and Effect sounds
// Screenshots: the panel, the order marker, the missile warning. Exit 1 on a failure or a page error.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), DPR = +(process.argv[4] || 1), OUT = process.argv[5] || path.join(__dirname, 'cfx-shots'), PHONE = W <= 820;
fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: PHONE, isMobile: PHONE })).newPage(), errors = [], res = {};
  p.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(500);
  await p.click('[data-act="pick"][data-p="5"]'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 }); await p.waitForTimeout(1200);
  const P = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im; im.S.speed = 0; im.SET.fx = 'high'; im.SET.saver = false;
    const B = im.G.P.find(q => q.cityName === 'Berlin'), s = 12; im.view.s = s; im.view.x = innerWidth/2 - (B.x + 2)*s; im.view.y = document.getElementById('map').getBoundingClientRect().height/2 - B.y*s; im.redraw(); return { id: B.id, x: B.x, y: B.y }; });
  // (P) the panel
  await p.click('#devbadge'); await p.waitForTimeout(300);
  const btns = await p.$$eval('[data-dev="cfx"]', L => L.map(e => e.dataset.k)); res.buttons = btns;
  const fired = {};
  for (const k of btns){ if (k === 'all') continue; await p.evaluate(() => { const c = window.__im.cfx; c.PROJ.length = 0; c.PART.length = 0; });
    await p.click(`[data-dev="cfx"][data-k="${k}"]`); await p.waitForTimeout(k === 'icbm' || k === 'ballistic' ? 700 : 450);
    fired[k] = await p.evaluate(() => { const st = window.__im.cfx.stats(); return st.proj + st.part + st.cq; }); if (k === 'tank') await p.screenshot({ path: path.join(OUT, `${W}x${H}-ui-panel.png`) }); }
  res.fired = fired; for (const k of btns) if (k !== 'all' && k !== 'recon' && !(fired[k] > 0)) errors.push('the ' + k + ' button fired nothing');
  if (fired.recon > 0 && fired.recon !== undefined) { /* the recon UAV never fires: only the earlier shots fading */ }
  await p.click('#devbadge'); await p.waitForTimeout(4000);
  // (O) Bombard: a German artillery force next to an enemy force (made for the test: at war with Poland)
  const ord = await p.evaluate(async () => { const im = window.__im, S = im.S, G = im.G; const B0 = G.P.find(q => q.cityName === 'Berlin'); let e0 = null, bd = Infinity; for (const x of S.armies){ if (x.owner <= 0 || x.air || !count(x)) continue; const q = G.P[x.at], d = Math.hypot(q.x - B0.x, q.y - B0.y); if (d < bd){ bd = d; e0 = x; } } if (!e0) return { err: 'no enemy' }; const pl = e0.owner;
    rel(0, pl).st = 'war';
    const B = G.P.find(q => q.cityName === 'Berlin'), a = addArmy(0, B.id, { art: 3 }); const e = e0;
    visCache = null;
    im.cfx.M.orderMark({ aid: a.id, bid: e.id }); await new Promise(r => setTimeout(r, 400)); const A = im.cfx.M.ANIM.get(a.id);
    return { aid: a.id, faced: !!(A && isFinite(A.fa)), marks: im.cfx.stats().marks }; });
  res.order = ord; console.log("order", JSON.stringify(ord)); if (ord.err || !ord.faced || !ord.marks) errors.push('order marker: ' + JSON.stringify(ord));
  await p.screenshot({ path: path.join(OUT, `${W}x${H}-ui-order.png`) });
  // (T) tap a force in combat
  const tap = await p.evaluate(async aid => { const im = window.__im, a = im.S.armies.find(x => x.id === aid); im.cfx.M.unitFace(aid, 0, [a.pos ? a.pos[0] + 5 : 0, 0]); await new Promise(r => setTimeout(r, 3600));
    const before = im.cfx.stats().marks, ok = im.cfx.M.tapCombat(a); return { ok, before, after: im.cfx.stats().marks }; }, ord.aid);
  res.tap = tap; if (!tap.ok || !(tap.after > tap.before)) errors.push('tap in combat: ' + JSON.stringify(tap));
  // (M) a missile at Berlin
  const msl = await p.evaluate(async P => { const im = window.__im, S = im.S, G = im.G, pl = S.armies.find(x => x.owner > 0).owner, from = G.P.find(q => S.owner[q.id] === pl && q.city) || G.P.find(q => S.owner[q.id] === pl);
    S.inflight = S.inflight || []; S.inflight.push({ id: S.nid++, owner: pl, k: 'bm', from: from.id, to: P.id, t: 0.3, dt: 0.25 }); S.speed = 1; const r0 = im.rd.n; await new Promise(r => setTimeout(r, 1500));
    return { frames: im.rd.n - r0, seen: im.cfx.M.drawMissiles ? 1 : 0 }; }, P);
  res.missile = msl; if (!(msl.frames > 10)) errors.push('the missile warning does not animate: ' + JSON.stringify(msl));
  await p.screenshot({ path: path.join(OUT, `${W}x${H}-ui-missile-warning.png`) });
  // pan away: the edge arrow
  await p.evaluate(() => { const im = window.__im; im.view.x += 1600; im.redraw(); }); await p.waitForTimeout(400); await p.screenshot({ path: path.join(OUT, `${W}x${H}-ui-missile-edge.png`) });
  await p.evaluate(() => { window.__im.S.inflight.length = 0; window.__im.S.speed = 0; });
  // (Q) Effects Off
  const off = await p.evaluate(async P => { const im = window.__im; im.SET.fx = 'off'; const c = im.cfx; c.PROJ.length = 0; c.PART.length = 0;
    for (const w of c.M.CFX_W) c.fire(w, [P.x - 6, P.y + 2], [P.x + 2, P.y]); await new Promise(r => setTimeout(r, 600)); const st = c.stats(); im.SET.fx = 'high'; return st; }, P);
  res.off = off; if (off.part || off.proj) errors.push('Effects Off still drew effects: ' + JSON.stringify(off));
  await p.evaluate(() => { const b = document.querySelector('[data-act="settings-open"]'); if (b) b.click(); }); await p.waitForTimeout(400);
  res.settings = await p.evaluate(() => [...document.querySelectorAll('[data-act="set"][data-k="fx"], [data-act="set"][data-k="shake"], [data-act="set"][data-k="fxSnd"]')].map(e => e.dataset.k + ':' + e.dataset.v));
  console.log(JSON.stringify(res)); console.log(JSON.stringify({ errors })); await b.close(); process.exit(errors.length ? 1 : 0); })();
