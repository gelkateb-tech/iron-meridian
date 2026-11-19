// The dug-in mark (owner 2026-11-19: "for the dug in icon match this garrison look and keep the yellow color I like it"): the badge's amber
// shield with Conflict of Nations' garrison castle, and the army bar's "Dug in" label and stats cell (castle, +10% in the open, +25% in a city:
// rules/combat.js DIG_DEF, DIG_CITY). A phone (440 x 900, dpr 2, touch): your force dug in, one not dug in, an ally's dug in, one dug in inside
// a city. Checks: the mark on each dug-in badge (and none on the other), the label and the cell with the right bonus when a dug-in force is
// tapped, neither when it is not. Writes PNG crops to OUT: zoomed out, zoomed in, the mark enlarged 3x, the bar dug in and not dug in.
// node .test/dug-mark.js [out dir] [--shots]   (run bash tools/mkpage.sh first; --shots: pictures only, no checks: an older build)
const fs = require('fs'), path = require('path'), pickNation = require('./pick-nation.js'), { chromium } = require('playwright');
const OUT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(__dirname, 'dug-mark'), SHOTS = process.argv.includes('--shots'); fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }), ctx = await b.newContext({ viewport: { width: 440, height: 900 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }), p = await ctx.newPage();
  const errors = [], checks = {}, fails = [], ok = (k, c, v) => { checks[k] = c ? 'PASS' : 'FAIL ' + JSON.stringify(v ?? null); if (!c) fails.push(k); };
  p.on('pageerror', e => errors.push(e.message));
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
  await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 });
  const C = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im, S = im.S, G = im.G; S.speed = 0; if (im.SET) im.SET.tipsOff = true;
    for (const a of S.armies) if (a.owner === 0 || a.owner === 1) for (const t in a.u) a.u[t] = 0; removeEmpty();
    const by = n => G.P.find(q => q.name === n && !q.sea), A = by('Hessen'), B = by('Thüringen');
    const own = im.addArmy(0, A.id, {inf:4, tank:2}); own.pos = [A.x, A.y]; own.stance = 'defend';
    const own2 = im.addArmy(0, B.id, {inf:3}); own2.pos = [B.x + 1, B.y + 1];   // not dug in (just arrived)
    const D2 = [...B.nb.keys()].map(v => G.P[v]).find(q => !q.sea && q.id !== A.id) || B; S.owner[D2.id] = 1; const al = im.addArmy(1, D2.id, {inf:3, art:1}); al.pos = [(D2.x*2 + B.x)/3, (D2.y*2 + B.y)/3]; al.stance = 'defend'; setRel(0, 1, 'ally');
    const cityP = G.P.find(q => !q.sea && S.owner[q.id] === 0 && q.city && q.id !== A.id && q.id !== B.id && Math.hypot(q.x - A.x, q.y - A.y) < 60) || G.P.find(q => !q.sea && S.owner[q.id] === 0 && q.city);
    const inCity = im.addArmy(0, cityP.id, {inf:2}); inCity.pos = [cityP.x, cityP.y]; inCity.stance = 'defend';
    for (const a of [own, al, inCity]) a.still = S.hour - 20;
    im.tick(); for (const a of [own, al, inCity]) a.still = S.hour - 20; for (const a of [own, own2, al, inCity]){ a.to = null; a.path = []; }
    im.computeSupply && im.computeSupply(); im.air.visibleSet();
    const r = document.getElementById('map').getBoundingClientRect(); return { own: own.id, own2: own2.id, al: al.id, city: inCity.id, cityAt: [cityP.x, cityP.y], cityName: cityP.name, c: [(A.x + B.x*2 + al.pos[0])/4, (A.y + B.y*2 + al.pos[1])/4], w: r.width, h: r.height, x: r.left, y: r.top,
      dug: [im.dugIn(own), im.dugIn(own2), im.dugIn(al), im.dugIn(inCity)], cityIsCity: !!cityP.city, pct: [Math.round((1/DIG_DEF - 1)*100), Math.round((1/DIG_CITY - 1)*100)] }; });
  ok('setup: yours, the ally\'s and the city force dug in, the other not', C.dug.join() === 'true,false,true,true', C.dug);
  const view = (hp, at = C.c) => p.evaluate(([x, y, hp, w, h]) => { const v = window.__im.view, s = hp/12; v.s = s; v.x = w/2 - x*s; v.y = h/2 - y*s; window.__im.redraw && window.__im.redraw(); }, [at[0], at[1], hp, C.w, C.h]);
  const hitsOf = ids => p.evaluate(ids => window.__im.hits.concat(window.__im.hitx || []).filter(h => !h.art && ids.some(id => (h.own || []).concat(h.ids || []).includes(id))).map(h => ({ids: (h.own || []).concat(h.ids || []), x: h.x, y: h.y, w: h.w, h: h.h})), ids);
  const dugHits = () => p.evaluate(() => (window.__im.uicon && window.__im.uicon.dughit || []).map(r => ({x: r.x, y: r.y, w: r.w, h: r.h})));
  const shots = [];
  // the map: zoomed out (diamond badges) and zoomed in (the flag tag over the 3D models)
  const ownAt = await p.evaluate(id => window.__im.S.armies.find(a => a.id === id).pos, C.own);
  for (const [zn, hp, at] of [['out', 30, C.c], ['in', 170, [ownAt[0], ownAt[1] - 1.5]]]){
    await view(hp, at); await p.waitForTimeout(1500); await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
    const ids = zn === 'in' ? [C.own] : [C.own, C.own2, C.al], hs = await hitsOf(ids), dh = await dugHits();
    const on = id => { const h = hs.find(q => q.ids.includes(id)); return !!h && dh.some(r => r.x < h.x + h.w + 6 && r.x + r.w > h.x - 6 && r.y < h.y + h.h + 12 && r.y + r.h > h.y - 6); };
    if (zn === 'out'){ ok('zoomed out: the mark on your dug-in badge', on(C.own), {hs, dh}); ok('zoomed out: an ally\'s quiet badge carries no marks, as before (only yours and forces at war show them)', !on(C.al), {hs, dh}); ok('zoomed out: no mark on the force not dug in', !on(C.own2), {hs, dh}); }
    else ok('zoomed in: the mark on your dug-in tag', on(C.own), {hs, dh});
    const mg = zn === 'in' ? 70 : 30, x0 = Math.min(...hs.map(h => h.x)) - mg, y0 = Math.min(...hs.map(h => h.y)) - 26, x1 = Math.max(...hs.map(h => h.x + h.w)) + mg, y1 = Math.max(...hs.map(h => h.y + h.h)) + (zn === 'in' ? 120 : 40);
    const f = path.join(OUT, `mark-${zn}.png`); await p.screenshot({ path: f, clip: { x: C.x + Math.max(0, x0), y: C.y + Math.max(0, y0), width: Math.min(C.w, x1 - x0), height: Math.min(C.h, y1 - y0) } }); shots.push(f);
    if (zn === 'out'){ const h = hs.find(q => q.ids.includes(C.own)); if (h){ const f2 = path.join(OUT, 'mark-enlarged.png'); await p.screenshot({ path: f2, clip: { x: C.x + h.x - 14, y: C.y + h.y - 8, width: h.w + 28, height: h.h + 22 } }); shots.push(f2); } } }
  // the army bar: tapped dug in (in the open, in a city) and not dug in
  const bar = async (id, at, nm) => { await view(40, at); await p.waitForTimeout(1200);
    const h = await p.evaluate(id => { const q = window.__im.hits.find(h => h.own && h.own.includes(id)); return q && [q.x + q.w/2, q.y + q.h/2]; }, id);
    if (h) await p.touchscreen.tap(C.x + h[0], C.y + h[1]); await p.waitForTimeout(700);
    if (!(await p.evaluate(() => window.__im.sel.army))){ await p.evaluate(id => window.__im.selectArmy(id), id); await p.waitForTimeout(700); }
    const r = await p.evaluate(() => { const L = document.querySelector('.ab-dug'), c = document.querySelector('.abs.dug'), bx = document.querySelector('.abar'); const q = bx && bx.getBoundingClientRect();
      return {label: L ? L.textContent.replace(/\s+/g, ' ').trim() : null, cell: c ? c.textContent.replace(/\s+/g, ' ').trim() : null, castle: !!(c && c.querySelector('svg.castle')), box: q && [q.left, q.top, q.width, q.height]}; });
    const f = path.join(OUT, `bar-${nm}.png`), y0 = r.box ? Math.max(0, r.box[1] - 4) : 560; await p.screenshot({ path: f, clip: { x: 0, y: y0, width: 440, height: Math.min(900 - y0, 250) } }); shots.push(f);
    await p.evaluate(() => window.__im.clearSel && window.__im.clearSel()); await p.waitForTimeout(300); return r; };
  const own = await bar(C.own, C.c, 'dug-open'), city = await bar(C.city, C.cityAt, 'dug-city'), not = await bar(C.own2, C.c, 'not-dug');
  ok(`the bar of your dug-in force (open ground): "Dug in: +${C.pct[0]}% defence"`, own.label && own.label.startsWith(`Dug in: +${C.pct[0]}% defence`), own);
  ok(`... and its stats row: the castle and +${C.pct[0]}%`, own.castle && own.cell && own.cell.replace(/\s/g, '') === `Dugin+${C.pct[0]}%`, own);
  ok(`a dug-in force in a city (${C.cityName}): +${C.pct[1]}% in the label and the stats row`, C.cityIsCity && city.label && city.label.startsWith(`Dug in: +${C.pct[1]}% defence in a city`) && city.castle && city.cell && city.cell.replace(/\s/g, '') === `Dugin+${C.pct[1]}%`, city);
  ok('a force not dug in: neither the label nor the castle cell', not.box && !not.label && !not.cell, not);
  if (SHOTS) { for (const k in checks) checks[k] = 'skipped (--shots)'; fails.length = 0; }
  console.log(JSON.stringify({ checks, shots, errors }, null, 1));
  console.log(fails.length || errors.length ? `FAILED ${fails.length} checks, ${errors.length} errors` : `OK ${Object.keys(checks).length} checks`);
  await b.close(); process.exit(fails.length || errors.length ? 1 : 0); })();
