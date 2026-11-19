// The dug-in mark: today's amber shield next to the three options drawn in code (index.html dugOptMark, test build only: window.__dugOpt), each on
// real badges (yours dug in, an ally's dug in, one of yours not dug in) at phone size (440 x 900, dpr 2), zoomed out and zoomed in; and the "Dug in" label
// in the force's bar when it is tapped. Writes PNG crops to OUT (default the scratchpad's mapfix/dug/) and prints their names.
// node .test/dug-options.js [out dir]
const fs = require('fs'), path = require('path'), pickNation = require('./pick-nation.js'), { chromium } = require('playwright');
const OUT = process.argv[2] || path.join(__dirname, 'dug-options'); fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }), ctx = await b.newContext({ viewport: { width: 440, height: 900 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }), p = await ctx.newPage();
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
  await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 });
  const C = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im, S = im.S, G = im.G; S.speed = 0;
    for (const a of S.armies) if (a.owner === 0 || a.owner === 1) for (const t in a.u) a.u[t] = 0; removeEmpty();
    const by = n => G.P.find(q => q.name === n && !q.sea), A = by('Hessen'), B = by('Thüringen'), D = by('Sachsen-Anhalt') || B;
    const own = im.addArmy(0, A.id, {inf:4, tank:2}); own.pos = [A.x, A.y]; own.stance = 'defend';
    const own2 = im.addArmy(0, B.id, {inf:3}); own2.pos = [B.x + 1, B.y + 1];   // not dug in (just arrived)
    const D2 = [...B.nb.keys()].map(v => G.P[v]).find(q => !q.sea && q.id !== A.id && q !== D) || D; S.owner[D2.id] = 1; const foe = im.addArmy(1, D2.id, {inf:3, art:1}); foe.pos = [(D2.x*2 + B.x)/3, (D2.y*2 + B.y)/3]; foe.stance = 'defend'; setRel(0, 1, 'ally');   // (an ally's: its forces are always in sight)
    for (const a of [own, foe]) a.still = S.hour - 20;
    im.tick(); for (const a of [own, foe]) a.still = S.hour - 20; im.computeSupply && im.computeSupply(); im.air.visibleSet();
    const r = document.getElementById('map').getBoundingClientRect(); return { own: own.id, own2: own2.id, foe: foe.id, c: [(A.x + B.x*2 + foe.pos[0])/4, (A.y + B.y*2 + foe.pos[1])/4], w: r.width, h: r.height, x: r.left, y: r.top,
      dug: [im.dugIn(own), im.dugIn(own2), im.dugIn(foe)] }; });
  const view = (hp, at = C.c) => p.evaluate(([x, y, hp, w, h]) => { const v = window.__im.view, s = hp/12; v.s = s; v.x = w/2 - x*s; v.y = h/2 - y*s; }, [at[0], at[1], hp, C.w, C.h]);
  const ownAt = await p.evaluate(id => window.__im.S.armies.find(a => a.id === id).pos, C.own);
  const shots = [];
  for (const [zn, hp] of [['out', 30], ['in', 170]]) for (const opt of [0, 1, 2, 3]){
    await p.evaluate(o => { window.__dugOpt = o || undefined; }, opt); await view(hp, zn === 'in' ? [ownAt[0], ownAt[1] - 1.5] : C.c); await p.waitForTimeout(1300);   // (zoomed in: your dug-in force, its tag over its pictures)
    const hs = await p.evaluate(ids => window.__im.hits.filter(h => h.own && ids.some(id => h.own.includes(id))).map(h => [h.x, h.y, h.w, h.h]), zn === 'in' ? [C.own] : [C.own, C.own2, C.foe]);
    const mg = zn === 'in' ? 70 : 30, x0 = Math.min(...hs.map(h => h[0])) - mg, y0 = Math.min(...hs.map(h => h[1])) - 26, x1 = Math.max(...hs.map(h => h[0] + h[2])) + mg, y1 = Math.max(...hs.map(h => h[1] + h[3])) + (zn === 'in' ? 120 : 40);   // (css px)
    console.log(zn, opt, "badges", hs.length, JSON.stringify(await p.evaluate(id => { const im = window.__im, f = im.S.armies.find(a => a.id === id); return f && {at: f.at, pos: f.pos, n: count(f), vis: im.air.armyVisible(f, im.air.visibleSet()), sc: im.toScreen(f.pos[0], f.pos[1])}; }, C.foe)));
    const f = path.join(OUT, `dug-${zn}-${opt}.png`); await p.screenshot({ path: f, clip: { x: C.x + Math.max(0, x0), y: C.y + Math.max(0, y0), width: Math.min(C.w, x1 - x0), height: Math.min(C.h, y1 - y0) } }); shots.push(f); }
  // the "Dug in" label in the bar of a force tapped on the map (today's badge)
  await p.evaluate(() => { window.__dugOpt = undefined; }); await view(40); await p.waitForTimeout(1200);
  for (const [nm, id] of [['own', C.own], ['foe', C.foe]]){ const h = await p.evaluate(id => { const q = window.__im.hits.find(h => h.own && h.own.includes(id)); return q && [q.x + q.w/2, q.y + q.h/2]; }, id);
    if (h) await p.touchscreen.tap(C.x + h[0], C.y + h[1]); await p.waitForTimeout(700);
    const f = path.join(OUT, `dug-panel-${nm}.png`); await p.screenshot({ path: f, clip: { x: 0, y: 570, width: 440, height: 300 } });   // (the bar: its name, health and the label) shots.push(f);
    const lab = await p.evaluate(() => { const e = document.querySelector('.ab-dug'); return e ? e.textContent.trim() : null; }); console.log(nm, 'label:', lab);
    await p.evaluate(() => window.__im.clearSel && window.__im.clearSel()); await p.waitForTimeout(300); }
  console.log(JSON.stringify({ dug: C.dug, shots, errors }));
  await b.close(); process.exit(errors.length ? 1 : 0); })();
