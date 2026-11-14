// Buildings on the map as the angled building cut-outs (drawBuildings in index.html, assets/art/bn-*.webp from tools/cutout-angled.py): no old
// building picture (b-*, bm-*) and no 3D building sprite (assets/bld3d, U3D.bld) is drawn on the map at any zoom, and no frame or tile round a
// picture (the corners of every drawn picture's box show the map through); none zoomed out, one per city at the mid zoom, all of a city's at close
// zoom (the construction site and a level going up too, at their progress); every picture stands on a world point drawn through toScreen (0 drift over a
// zoom sweep, a pan, a whole turn of the wrap and at the seam itself), the HQ exactly on the capital in its nation's style; the Army Base drawn with its
// own pictures (bn-fac-1..5) on the map and in the city panel; a new building shows the construction picture of its third (bn-build-1..3) and a level
// going up the crane; every Naval Yard on the water at its city with its sheds dry and its piers on the water (a river port on its river's bank in a
// harbour basin: Kolkata on the Hooghly, Hamburg on the Elbe), the yards over 60 km from their city listed; every picture of every city on land at 5
// zooms (small islands listed apart); 15-20% smaller than the first size, the HQ the biggest; the building drawing writes no text (no level numbers
// or badges on the map); a tap on a picture opens its city. node .test/bldangled.js [W H dpr]  prints JSON {checks, fails, errors}, exit 1 on a failure.
const pickNation = require('./pick-nation.js');
const { chromium } = require('playwright');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), DPR = +(process.argv[4] || 1), PHONE = W <= 820;
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: PHONE, isMobile: false });
  const p = await ctx.newPage(); const errors = [], checks = {}, fails = [];
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  // every picture drawn onto any canvas: a building picture (assets/art/b-*, or a cut-out bm-*) must never be (the aerial city art b-city-* is the towns' ground)
  const req = []; p.on('request', r => { if (/bld3d|\/b3-/.test(r.url())) req.push(r.url()); });
  await p.addInitScript(() => { window.__b3pics = []; const d0 = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function(im){ const s = im && im.src; if (s && /\/art\/(b-(?!city-)|bm-)|bld3d/.test(s)) window.__b3pics.push(s.split('/').pop()); return d0.apply(this, arguments); }; });
  await p.goto('file://' + __dirname + '/page.html?start=nations'); await p.waitForTimeout(500);   // (the nations world, as players see it)
  await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 });
  const C = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im, S = im.S, G = im.G; S.speed = 0;
    const by = n => G.P.find(q => q.cityName === n); const be = by('Berlin'), ha = by('Hamburg'), mu = by('Munich'), fr = by('Frankfurt');
    Object.assign(S.bld[be.id], {fac:4, air:3, arms:2, rec:2, fort:1, silo:1}); Object.assign(S.bld[ha.id], {yard:3, fac:1});
    // Naval Yards at every port city of the map (the coast placement is checked for each)
    const ports = G.P.filter(P => P.city && !P.sea && P.coast); for (const P of ports) if (!S.bld[P.id].yard && P !== be) S.bld[P.id].yard = 1 + (P.id % 5);
    S.bld[mu.id].air = 0; S.cons[mu.id] = {k:'air', lvl:1, h:40, h0:96}; S.bld[fr.id].fac = 1; S.cons[fr.id] = {k:'fac', lvl:2, h:20, h0:72};
    // a city by the wrap seam (the easternmost or westernmost city of the map) with buildings of its own
    const X0 = im.wrap.X0, WW = im.wrap.W; let seam = null, sd = 1e9, sx = 0; for (const P of G.P){ if (!P.city || P.sea) continue; for (const x of [P.x, P.x - WW, P.x + WW]){ const d = Math.abs(x - X0); if (d < sd){ sd = d; seam = P; sx = x; } } }
    S.bld[seam.id].fac = 3; S.bld[seam.id].air = 2;
    const art = []; for (const k of ['military-base', 'airfield', 'naval-port']) for (let l = 1; l <= 5; l++){ const im0 = new Image(); im0.src = `assets/art/b-${k}-${l}.webp`; art.push(im0); } window.__b3art = art;   // (the pictures loaded: an old picture cluster would draw them)
    return {seamX:sx, seamD:+sd.toFixed(2), berlin:im.bn.items(be.id).map(e => e.k).sort().join(','), hqNm:im.bn.items(be.id)[0].nm, ports:ports.map(P => P.id), be:[be.x, be.y], beId:be.id, ha:ha.id, mu:mu.id, fr:fr.id, seam:[seam.x, seam.y], seamId:seam.id, seamName:seam.cityName, X0, WW, cap:S.nations[0].capital}; });
  await p.waitForTimeout(800);
  const look = (x, y, hp) => p.evaluate(([x, y, hp, W, H]) => { const im = window.__im, v = im.view, s = hp/12; v.s = s; v.x = W/2 - x*s; v.y = H/2 - y*s; im.redraw(); }, [x, y, hp, W, H]);
  // this frame's models (drawn after a short wait), each measured against toScreen of its own world point
  const grab = () => p.evaluate(() => { const im = window.__im, L = im.bn.dbg.map(e => { const [sx, sy] = im.toScreen(e.wx, e.wy); return Object.assign({}, e, {dx:e.x - sx, dy:e.y - sy}); }); return {L, s:im.view.s, hp:im.view.s*12, vx:im.view.x, vy:im.view.y}; });
  const frame = async () => { await p.waitForTimeout(280); await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); return grab(); };
  const SWEEP = [8, 14, 19, 22, 30, 40, 52, 66, 80, 100, 130, 176, 240];
  const bands = await p.evaluate(() => window.__im.bn.bands);
  let maxD = 0; const world = new Map(), rel = new Map(); let relMax = 0;
  for (const hp of SWEEP){ await look(C.be[0], C.be[1], hp); await frame(); const F = await frame();
    const per = new Map(); for (const e of F.L){ per.set(e.p, (per.get(e.p) || 0) + 1); maxD = Math.max(maxD, Math.abs(e.dx), Math.abs(e.dy));
      const k = e.p + '|' + e.k, w0 = world.get(k); if (!w0) world.set(k, [e.wx, e.wy]); else if (Math.abs(w0[0] - e.wx) > 1e-6 || Math.abs(w0[1] - e.wy) > 1e-6) fails.push(`${k}: its world point moved at hexPx ${hp}`);
      if (hp >= 80 && hp <= 176){ const r = [((e.box[0] + e.box[2])/2 - e.x)/e.L, (e.box[3] - e.y)/e.L], r0 = rel.get(k); if (!r0) rel.set(k, r); else relMax = Math.max(relMax, Math.hypot(r[0] - r0[0], r[1] - r0[1])*e.L); } }
    const be = F.L.filter(e => e.p === C.beId), n = F.L.length, multi = [...per.values()].filter(v => v > 1).length;
    checks['z' + hp] = {models:n, cities:per.size, berlin:be.map(e => e.k + (e.site ? '*' : '') + (e.cons ? '+' : '')).join(','), multi};
    if (hp < bands.in0 && n) fails.push(`hexPx ${hp}: ${n} models zoomed out`);
    if (hp >= bands.in1 && hp < bands.all0 && multi) fails.push(`hexPx ${hp}: ${multi} cities show more than one model at the mid zoom`);
    if (hp >= bands.in1 && hp < bands.all0 && !(be.length === 1 && be[0].k === 'hq')) fails.push(`hexPx ${hp}: Berlin's one model is not its HQ`);
    if (hp >= bands.in1 && n === 0) fails.push(`hexPx ${hp}: no building picture on screen`);
    checks['z' + hp].sizes = [...new Set(be.map(e => e.k + ':' + Math.round(e.L)))].join(' ');
    if (hp >= bands.all1){ const ks = be.map(e => e.k).sort().join(','); if (ks !== C.berlin) fails.push(`hexPx ${hp}: Berlin shows ${ks}`); }
    const hq = be.find(e => e.k === 'hq'); if (hq && (hq.wx !== C.be[0] || hq.wy !== C.be[1])) fails.push(`hexPx ${hp}: the HQ is not on Berlin's point`);
    if (hq && hq.nm !== 'bn-hq-western') fails.push(`hexPx ${hp}: Berlin's HQ is ${hq.nm}, not the western style`);
    if (F.L.some(e => /^(silo|arms)$/.test(e.k))) fails.push(`hexPx ${hp}: a building without an angled picture is drawn`);
    const fac = be.find(e => e.k === 'fac'); if (hp >= bands.all1 && (!fac || fac.pic !== 'bn-fac-4')) fails.push(`hexPx ${hp}: Berlin's Army Base IV is not drawn as bn-fac-4 (${fac && fac.pic})`); }
  // sizes (owner's #13): 18% smaller than the first BN_K0 0.62, the HQ the biggest
  const sz = await p.evaluate(() => { const b = window.__im.bn; return {K0:b.K0, hq100:+(b.L(100)*b.F('hq', 1)).toFixed(2), biggestOther:Math.max(...['air', 'fac', 'rec', 'yard', 'fort'].flatMap(k => [1, 2, 3, 4, 5].filter(l => l <= BUILD[k].max).map(l => b.F(k, l))))}; });
  sz.fac = await p.evaluate(() => [1, 2, 3, 4, 5].map(l => window.__im.bn.F('fac', l))); sz.air5 = await p.evaluate(() => window.__im.bn.F('air', 5));
  checks.size = Object.assign(sz, {vsFirst:+(sz.K0/0.62).toFixed(3)}); if (sz.fac[4] > sz.air5 || sz.fac[0] >= sz.fac[4]) fails.push('Army Base sizes: ' + sz.fac.join(' ')); if (sz.K0/0.62 < 0.8 || sz.K0/0.62 > 0.85) fails.push(`pictures ${sz.K0/0.62} of their first size, not 15-20% smaller`); if (sz.biggestOther >= 1.08) fails.push('a building drawn bigger than the HQ');
  checks.berlin = {buildings:C.berlin, hq:C.hqNm}; if (!/^air,fac,fort,hq,rec(,yard)?$/.test(C.berlin)) fails.push('Berlin items: ' + C.berlin);
  checks.sweep = {maxDriftPx:+maxD.toFixed(3), pictureOnAnchorPx:+relMax.toFixed(3), models:world.size};
  if (maxD > 1.5) fails.push(`zoom sweep: a model drawn ${maxD.toFixed(2)} px off its anchor`); if (relMax > 2) fails.push(`zoom sweep: a model's picture moved ${relMax.toFixed(2)} px against its anchor`);
  // close in: the construction site at Munich, the crane of a level going up at Frankfurt
  const at = async (q, hp) => { const xy = await p.evaluate(q => [window.__im.G.P[q].x, window.__im.G.P[q].y], q); await look(xy[0], xy[1], hp); await frame(); return frame(); };
  const mu = (await at(C.mu, 100)).L.find(e => e.p === C.mu && e.k === 'air'); await p.evaluate(fr => { const S = window.__im.S; S.bld[fr].fac = 0; S.bld[fr].rec = 2; S.cons[fr] = {k:'rec', lvl:3, h:20, h0:72}; }, C.fr); const fr = (await at(C.fr, 100)).L.find(e => e.p === C.fr && e.k === 'rec');
  // the site's picture by its third (bn-build-1 to a third, bn-build-2 to two thirds, bn-build-3 on), anchored on its layout point; the crane at a level going up
  const stg = []; for (const pf of [0.1, 0.4, 0.7, 0.95]){ await p.evaluate(([q, pf]) => { const S = window.__im.S; S.cons[q] = {k:'air', lvl:1, h:+(96*(1 - pf)).toFixed(3), h0:96}; }, [C.mu, pf]);
    const e = (await at(C.mu, 100)).L.find(q => q.p === C.mu && q.k === 'air'); stg.push(e ? e.pic + '@' + e.pf : 'none'); const want = 'bn-build-' + (pf < 1/3 ? 1 : pf < 2/3 ? 2 : 3);
    if (!e || e.pic !== want) fails.push(`Munich at ${pf}: the site shows ${e && e.pic}, not ${want}`); }
  await p.evaluate(q => { window.__im.S.cons[q] = {k:'air', lvl:1, h:40, h0:96}; }, C.mu);
  const crane = await p.evaluate(() => window.__im.bn.src().join('\n').includes("bnPic('bn-crane'") && !!window.__im.bn.meta['bn-crane']);
  checks.construction = {munich:mu ? {k:mu.k, site:mu.site, pf:mu.pf, pic:mu.pic} : null, stages:stg, frankfurt:fr ? {k:fr.k, lv:fr.lv, cons:fr.cons, pf:fr.pf} : null, crane};
  if (!crane) fails.push('no crane picture for a level going up');
  { const old = await p.evaluate(() => window.__im.bn.src().filter(t => /bnPad|bnDust\(|scaf|BN_ST1/.test(t)).length); if (old) fails.push('the code-drawn construction stages are still there'); }
  await look(C.be[0], C.be[1], 100); const F0 = await frame();
  if (mu && Math.abs(mu.pf - (1 - 40/96)) > 0.02) fails.push(`Munich: the site drawn at ${mu.pf} done`); if (fr && Math.abs(fr.pf - (1 - 20/72)) > 0.02) fails.push(`Frankfurt: the level drawn at ${fr.pf} done`);
  if (!mu || !mu.site || mu.k !== 'air') fails.push('Munich: no Airbase construction site'); if (!fr || !fr.cons || fr.lv !== 2) fails.push('Frankfurt: no Recruiting Office raising its level');
  // a pan: every model moves with the map, exactly
  await p.evaluate(() => { const im = window.__im; im.view.x += 137.25; im.view.y -= 41.5; im.redraw(); }); const F1 = await frame(); let panD = 0, panN = 0;
  for (const e of F1.L){ const o = F0.L.find(q => q.p === e.p && q.k === e.k); if (!o) continue; panN++; panD = Math.max(panD, Math.abs(e.x - o.x - 137.25), Math.abs(e.y - o.y + 41.5), Math.abs(e.dx), Math.abs(e.dy)); }
  checks.pan = {models:panN, maxDriftPx:+panD.toFixed(3)}; if (!panN || panD > 1.5) fails.push(`pan: ${panN} models, ${panD.toFixed(2)} px off`);
  // a whole turn of the wrap: the same picture at the same place
  await p.evaluate(() => { const im = window.__im; im.view.x -= 137.25; im.view.y += 41.5; im.view.x += im.wrap.W*im.view.s; im.redraw(); }); const F2 = await frame(); let wD = 0, wN = 0;
  for (const e of F2.L){ const o = F0.L.find(q => q.p === e.p && q.k === e.k); if (!o) continue; wN++; wD = Math.max(wD, Math.abs(e.x - o.x), Math.abs(e.y - o.y)); }
  checks.wrapTurn = {models:wN, maxDriftPx:+wD.toFixed(3)}; if (!wN || wD > 1.5) fails.push(`a turn of the wrap: ${wN} models, ${wD.toFixed(2)} px off`);
  // at the seam itself: the seam and the city nearest it on screen (the view's middle between them), the city's model drawn on its anchor (whichever copy is on screen), at two zooms
  const sm = {};
  for (const hp of [30, 44]){ if (C.seamD*hp/12 > W*0.9){ sm['z' + hp] = 'skipped: the seam and the city do not both fit this screen'; continue; }   // (a phone at hexPx 44)
    await p.evaluate(([hp, W, H, X0, y, sx]) => { const im = window.__im, v = im.view, s = hp/12; v.s = s; v.x = W/2 - (X0 + sx)/2*s; v.y = H/2 - y*s; im.redraw(); }, [hp, W, H, C.X0, C.seam[1], C.seamX]); const F = await frame();
    const L = F.L.filter(e => e.p === C.seamId); sm['z' + hp] = {models:L.length, maxDriftPx:+Math.max(0, ...L.map(e => Math.max(Math.abs(e.dx), Math.abs(e.dy)))).toFixed(3), x:L.map(e => Math.round(e.x))};
    if (L.length < 1) fails.push(`seam hexPx ${hp}: ${C.seamName} shows no model`); if (L.some(e => Math.abs(e.dx) > 1.5 || Math.abs(e.dy) > 1.5)) fails.push(`seam hexPx ${hp}: a model off its anchor`); }
  checks.seam = Object.assign({city:C.seamName, fromSeam:C.seamD}, sm);
  // a tap on a model (off the counters and the city's point) opens its city
  await look(C.be[0], C.be[1], 100); await frame(); await frame();
  const tapRes = await p.evaluate(() => { const im = window.__im, out = []; const hits = im.bn.hits.slice();
    for (const h of hits){ const b = h.b, x = (b[0] + b[2])/2, y = (b[1] + b[3])/2, w = im.bn.at(x, y); if (!w || w.p !== h.p) continue;
      im.sel.prov = null; im.sel.army = null; im.tap(x, y); out.push({p:h.p, x:Math.round(x), y:Math.round(y), got:im.sel.prov, army:im.sel.army}); if (out.length >= 6) break; }
    return out; });
  const okT = tapRes.filter(t => t.got === t.p), badT = tapRes.filter(t => t.got != null && t.got !== t.p);
  checks.taps = {tried:tapRes.length, opened:okT.length, wrong:badT.length};
  if (!okT.length) fails.push('no tap on a building model opened its city'); if (badT.length) fails.push(`${badT.length} taps on a model opened another province`);
  // no building picture drawn anywhere on the map (the sweep above, with the pictures loaded), and no picture-cluster hook left
  const pics = await p.evaluate(() => ({drawn:window.__b3pics.slice(0, 5), n:window.__b3pics.length, old:'bpic' in window.__im || 'b3d' in window.__im, u3d:!!(window.U3D && (window.U3D.bld || window.U3D.bldMeta))}));
  checks.pictures = Object.assign(pics, {bld3dRequests:req.length}); if (pics.n) fails.push(`${pics.n} old building pictures drawn on canvases (${pics.drawn.join(', ')})`); if (pics.old) fails.push('old building hooks are still there');
  if (pics.u3d) fails.push('the 3D building models are still in units3d.js'); if (req.length) fails.push(`${req.length} requests for 3D building sheets`);
  // no text from the building drawing (no level numbers, numerals or badges on the map)
  const txt = await p.evaluate(() => window.__im.bn.src().filter(t => /fillText|strokeText|ROMAN/.test(t)).map(t => t.slice(9, t.indexOf('('))));
  checks.noText = txt.length ? txt : 'none'; if (txt.length) fails.push('building drawing writes text or is missing: ' + txt.join(', '));
  // no frame or tile: the four corners of every picture's box at close zoom show the same map as a frame without the buildings
  await look(C.be[0], C.be[1], 120); await frame(); await frame();
  const corners = await p.evaluate(async (W) => { const im = window.__im, cv = [...document.querySelectorAll('canvas')].sort((a, b) => b.width*b.height - a.width*a.height)[0], k = cv.width/W;
    const rd = () => { try { return cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; } catch (e) { return null; } };
    const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const D1 = rd(); if (!D1) return {tainted:true}; const boxes = im.bn.dbg.filter(e => e.a > 0.95).map(e => e.box);
    window.__bnOff = true;
    im.redraw(); await raf(); await new Promise(r => setTimeout(r, 250)); await raf(); const D0 = rd();
    window.__bnOff = false; im.redraw();
    let n = 0, same = 0; const px = (D, x, y) => { const i = (Math.round(y*k)*cv.width + Math.round(x*k))*4; return [D[i], D[i + 1], D[i + 2]]; };
    for (const b of boxes) for (const [x, y] of [[b[0] + 1.5, b[1] + 1.5], [b[2] - 1.5, b[1] + 1.5], [b[0] + 1.5, b[3] - 1.5], [b[2] - 1.5, b[3] - 1.5]]){ if (x < 0 || y < 0 || x >= W || y >= cv.height/k) continue; n++; const a = px(D1, x, y), c = px(D0, x, y); if (Math.max(...a.map((v, j) => Math.abs(v - c[j]))) < 24) same++; }
    return {boxes:boxes.length, corners:n, seeThrough:same}; }, W);
  checks.frames = corners; if (!corners.tainted && (corners.corners < 8 || corners.seeThrough < corners.corners*0.7)) fails.push(`picture corners: only ${corners.seeThrough} of ${corners.corners} show the map (a frame or tile?)`);
  // the city panel: Berlin's Army Base card shows bn-fac-4 (not the old square military-base picture)
  const panel = await p.evaluate(async be => { const im = window.__im; im.sel.army = null; im.sel.prov = be; im.redraw(); for (let i = 0; i < 30; i++){ await new Promise(r => setTimeout(r, 100)); const el = document.getElementById('csheet');
      const c = el && !el.hidden ? [...el.querySelectorAll('.cs-c')].find(q => /Army Base/.test(q.title)) : null, sp = c && c.querySelector('.cs-ci'); if (sp && /bn-fac-4/.test(sp.getAttribute('style') || '')) return 'bn-fac-4'; }   // (the sheet of the city tapped before may still show for a moment)
    const el = document.getElementById('csheet'); return el && !el.hidden ? 'card: ' + ([...el.querySelectorAll('.cs-c')].map(q => q.title + ' ' + (q.querySelector('.cs-ci') || {getAttribute:() => ''}).getAttribute('style')).join(' | ')).slice(0, 300) : 'no sheet'; }, C.beId);
  checks.cityPanel = panel; if (panel !== 'bn-fac-4') fails.push('city panel: the Army Base card is not bn-fac-4: ' + panel);
  await p.evaluate(() => { const im = window.__im; im.sel.prov = null; im.redraw(); });
  // the Naval Yards (owner's #14): each on the real coast at its city: its land half (the sheds, cranes and docks) dry at every zoom, its pier half on the
  // water (the piers face the sea), within BN_YMAX of the city; a river port without water near on its river's bank; else in its city's cluster
  const yards = await p.evaluate(ports => { const im = window.__im, out = []; for (const q of ports){ const it = im.bn.items(q); const i = it.findIndex(e => e.k === 'yard'); if (i < 0) continue;
      const L = im.bn.layout(q), sh = L.shore, P = im.G.P[q], e = it[i], F = im.bn.foot(e.nm), wx = P.x + L.pos[i][0], wy = P.y + L.pos[i][1], m = !!L.mir[i];
      let lw = 0; for (const h of [56, 80, 140, 240]) lw = Math.max(lw, im.bn.wet(e.nm, F.land, wx, wy, im.bn.wsize(q, i, h), m)); const pw = im.bn.wet(e.nm, F.pier, wx, wy, im.bn.wsize(q, i, 100), m, true);   // (the piers: on the sea or a big lake, at hexPx 100)
      const pwr = im.bn.pierWater(q); out.push({p:q, name:P.cityName || P.name, kind:sh.riv ? 'river' : sh.far ? 'cluster' : 'coast', sea:sh.sea, mir:m ? 1 : 0, d:+Math.hypot(L.pos[i][0], L.pos[i][1]).toFixed(2), lw:+lw.toFixed(3), pw:+pw.toFixed(3), water:+pwr.water.toFixed(3), basin:sh.bas ? 1 : 0}); } return out; }, C.ports);
  const coast = yards.filter(y => y.kind === 'coast'), riv = yards.filter(y => y.kind === 'river'), far = yards.filter(y => y.kind === 'cluster');
  const wetLand = coast.concat(riv).filter(y => y.lw > 0.05), piersOff = coast.concat(riv).filter(y => y.water < 0.3), ds = coast.concat(riv).map(y => y.d).sort((a, b) => a - b);
  const named = Object.fromEntries(['Kolkata', 'Hamburg', 'Amsterdam', 'Brussels', 'Shanghai', 'Mumbai', 'Istanbul', 'Saint Petersburg', 'Bordeaux', 'Basra', 'Karachi', 'Lagos', 'Buenos Aires', 'Houston', 'Seattle'].map(n => [n, yards.find(y => y.name === n)]).filter(v => v[1]).map(([n, y]) => [n, `${y.kind} ${y.d} px (${Math.round(y.d*8.7)} km), piers ${y.mir ? 'lower left' : 'lower right'}, piers on water ${Math.round(y.water*100)}%${y.basin ? ' (basin)' : ''}, piers on water ${Math.round(y.pw*100)}%, sheds on water ${Math.round(y.lw*100)}%`]));
  checks.yards = {n:yards.length, coast:coast.length, onRivers:riv.length, inCluster:far.length, medianFromCity:ds[ds.length >> 1], maxFromCity:ds[ds.length - 1], mirrored:yards.filter(y => y.mir).length,
    over60km:yards.filter(y => y.d*8.7 > 60).length, basins:yards.filter(y => y.basin).length, landHalfOnWater:wetLand.map(y => y.name + ' ' + y.lw), piersNotOnWater:piersOff.length, piersNotOnWaterList:piersOff.map(y => y.name), rivers:riv.map(y => y.name), clusters:far.map(y => y.name), named};
  if (yards.length < 300) fails.push(`only ${yards.length} Naval Yards checked`);
  if (coast.concat(riv).some(y => y.d > 15.5)) fails.push('a Naval Yard stands more than 15 world px from its city');
  if (riv.length < 15) fails.push(`only ${riv.length} river ports`);
  if (wetLand.length > 2) fails.push(`${wetLand.length} Naval Yards with their sheds on the water: ${wetLand.slice(0, 6).map(y => y.name).join(', ')}`);
  if (piersOff.length > coast.length*0.12) fails.push(`${piersOff.length} Naval Yards on the coast with their piers off the water`);
  if (far.length > yards.length*0.15) fails.push(`${far.length} Naval Yards too far from the water to stand on it`);
  if (!yards.some(y => y.mir) || !yards.some(y => !y.mir)) fails.push('the yards are not seen both ways round');
  { const k = yards.find(y => y.name === 'Kolkata'); if (!k || k.kind !== 'river' || k.d > 3.5 || k.water < 0.6 || !k.basin) fails.push('Kolkata: its Naval Yard is not on the Hooghly at the city: ' + JSON.stringify(k)); }
  // (the map's Hamburg stands 53 km south of the Elbe's line: its yard on the Elbe's north bank, about 60 km off)
  { const k = yards.find(y => y.name === 'Hamburg'); if (!k || k.kind !== 'river' || k.d*8.7 > 65 || k.water < 0.6) fails.push('Hamburg: its Naval Yard is not on the Elbe at the city: ' + JSON.stringify(k)); }
  for (const n of ['Mumbai', 'Istanbul']){ const k = yards.find(y => y.name === n); if (!k || k.kind !== 'coast' || k.d*8.7 > 30) fails.push(`${n}: its Naval Yard is not on the sea at the city`); }
  // every building on land (owner's #12): every city with buildings (an Airbase, a Recruiting Office and Fortifications everywhere, the yards above),
  // each picture's footprint at 5 zooms (the first from the mid zoom, the rest from BN_ALL0); small islands (under 40% land within 8 world px) listed apart
  const land = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, out = {n:0, items:0, wet:[], island:[]};
    const caps = new Set(S.nations.filter(N => N.alive).map(N => N.capital));
    for (const P of G.P){ if (P.sea || !(P.city || caps.has(P.id))) continue; Object.assign(S.bld[P.id], {air:Math.max(1, S.bld[P.id].air || 0), rec:Math.max(1, S.bld[P.id].rec || 0), fort:Math.max(1, S.bld[P.id].fort || 0)});
      if (!S.bld[P.id].fac && !S.cons[P.id]) (P.id % 3 ? S.bld[P.id].fac = 1 + P.id % 5 : S.cons[P.id] = {k:'fac', lvl:1, h:30, h0:72}); }   // (an Army Base everywhere, a third of them going up)
    for (const P of G.P){ if (P.sea) continue; const it = im.bn.items(P.id); if (!it.length) continue; const L = im.bn.layout(P.id); out.n++;
      let dry = 0, all = 0; for (let y = -8; y <= 8; y++) for (let x = -8; x <= 8; x++) if (x*x + y*y <= 64){ all++; if (!im.isWet(P.x + x, P.y + y)) dry++; }
      it.forEach((e, i) => { const wx = P.x + L.pos[i][0], wy = P.y + L.pos[i][1]; let w = 0; out.items++;
        for (const nm of e.site && e.k !== 'yard' ? im.bn.stages : [e.nm]){ const F = im.bn.foot(nm), pts = e.k === 'yard' ? F.land : F.all;   // (a site: its three construction pictures)
          for (const h of i ? [56, 80, 140] : [26, 40, 56, 80, 140]) w = Math.max(w, im.bn.wet(nm, pts, wx, wy, im.bn.wsize(P.id, i, h), !!L.mir[i])); }
        if (w > 0.05) (dry/all < 0.4 ? out.island : out.wet).push(`${P.cityName || P.name} ${e.k} ${Math.round(w*100)}%`); }); }
    return out; });
  checks.onLand = {cities:land.n, pictures:land.items, onWater:land.wet, smallIslands:land.island};
  if (land.n < 600) fails.push(`only ${land.n} cities with buildings checked`); if (land.wet.length) fails.push(`${land.wet.length} pictures on the water: ${land.wet.slice(0, 6).join(', ')}`);
  if (land.island.length > 12) fails.push(`${land.island.length} pictures on the water at small islands`);
  // the drawn yard carries its layout's mirror flag
  { const hz = await at(C.ha, 100); const e = hz.L.find(q => q.p === C.ha && q.k === 'yard'), y = yards.find(q => q.p === C.ha); if (!e || !y || e.mir !== y.mir) fails.push('Hamburg: the drawn Naval Yard does not match its coast layout'); }
  // HQ styles: every nation of the nations world has one of the seven
  const styles = await p.evaluate(() => { const im = window.__im, m = {}; im.S.nations.forEach((n, i) => { const st = im.bn.hq(i); (m[st] = m[st] || []).push(n.name); }); return m; });
  checks.hqStyles = Object.fromEntries(Object.entries(styles).map(([k, v]) => [k, v.length])); if (Object.keys(styles).length < 7) fails.push('not all seven HQ styles in use');
  if (!(styles['eastern-europe'] || []).includes('Russia') || !(styles['east-asia'] || []).includes('China') || !(styles['western'] || []).includes('Germany')) fails.push('HQ style of Russia, China or Germany wrong');
  console.log(JSON.stringify({checks, fails, errors}, null, 1));
  await b.close(); process.exit(fails.length || errors.length ? 1 : 0);
})();
