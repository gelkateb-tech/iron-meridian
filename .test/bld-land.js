// Building pictures on land, against the water the map draws (owner 2026-11-18: "buildings on land"; 2026-11-14: "the Naval Yard in Kolkata is
// inland ... check every Naval Yard the same way"). A nations-world game; every city and capital gets an Airbase, a Recruiting Office, a Bunker and
// an Army Base (a third of them going up: their three construction pictures), every city by the sea a Naval Yard. Then every city x picture: the
// picture's footprint (its solid cells, bn-foot) at its drawn size at hexPx 26, 60, 140 and 240, each cell's centre tested against the drawn coast
// and lakes (bnWater: the rings the map draws from hexPx BV_B1 on). A picture fails with one cell on the water; a Naval Yard is checked on its land
// half (sheds, cranes, docks) and must have its pier half on the water (the sea, a big lake, or its river's harbour basin) within BN_YMAX world px
// of its city. Kolkata's yard on the Hooghly at the city.
// node .test/bld-land.js [out.json]   (needs bash tools/mkpage.sh; PAGE=other.html to test another page; exit 1 on a failure)
const path = require('path'), fs = require('fs'), pickNation = require('./pick-nation.js'), { chromium } = require('playwright');
const OUT = process.argv[2] || null;
(async () => { let b, tries = 0;
  for (;;){ try { b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const r = await run(b); await b.close(); finish(r); return; }
    catch (e){ try { await b.close(); } catch (e2) {} if (++tries >= 3) { console.log('ERROR ' + e.message); process.exit(2); } console.log('retry after: ' + e.message.split('\n')[0]); } } })();
function finish(r){ if (OUT) fs.writeFileSync(OUT, JSON.stringify(r, null, 1));
  const {checks, fails, errors} = r; console.log(JSON.stringify({checks, fails, errors}, null, 1));
  console.log(fails.length || errors.length ? `FAILED ${fails.length} checks, ${errors.length} errors` : `OK ${checks.pictures} pictures of ${checks.cities} cities on land, ${checks.yards.n} Naval Yards on the water`);
  process.exit(fails.length || errors.length ? 1 : 0); }
async function run(b){ const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }), p = await ctx.newPage(), errors = [], fails = [], checks = {};
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto('file://' + path.resolve(__dirname, process.env.PAGE || 'page.html') + '?start=nations'); await p.waitForTimeout(500);
  await pickNation(p, 'India'); await p.click('[data-act="begin"]'); await p.waitForTimeout(500); if (await p.locator('[data-act="start"]').count()) await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 60000 });
  const R = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im, S = im.S, G = im.G, bn = im.bn; S.speed = 0;
    const caps = new Set(S.nations.filter(N => N.alive).map(N => N.capital)), H = [26, 60, 140, 240];
    for (const P of G.P){ if (P.sea || !(P.city || caps.has(P.id))) continue; const B = S.bld[P.id];
      Object.assign(B, {air:Math.max(1, B.air || 0), rec:Math.max(1, B.rec || 0), fort:Math.max(1, B.fort || 0)}); if (P.coast && !B.yard) B.yard = 1 + P.id % 5;
      if (!B.fac && !S.cons[P.id]) (P.id % 3 ? B.fac = 1 + P.id % 5 : S.cons[P.id] = {k:'fac', lvl:1, h:30, h0:72}); }
    bn.reset(); const out = {cities:0, pictures:0, wet:[], yards:[], hidden:[], name:[]};
    for (const P of G.P){ if (P.sea) continue; const it = bn.items(P.id); if (!it.length) continue; const L = bn.layout(P.id); out.cities++;
      it.forEach((e, i) => { const wx = P.x + L.pos[i][0], wy = P.y + L.pos[i][1], mir = !!L.mir[i]; out.pictures++; let w = 0;
        if (!L.shr[i]){ out.hidden.push(`${P.cityName || P.name} ${e.k}`); return; }   // (no dry room for it: not drawn)
        for (const nm of e.site && e.k !== 'yard' ? bn.stages : [e.nm]){ const F = bn.foot(nm), pts = e.k === 'yard' ? F.land : F.all;
          for (const h of H){ const s = bn.wsize(P.id, i, h); if (!(s > 0)) continue; w = Math.max(w, bn.wet(nm, pts, wx, wy, s, mir)); } }
        if ((P.city || bn.hqAt(P.id) >= 0) && i){ const k = 12/bn.NAMEH, hw = ((P.cityName || P.name || '').length*6.2 + 6)/2*k, nb = [-hw, 21*k, hw, 37*k], sz = bn.wsize(P.id, i, bn.NAMEH);   // (the city's name at hexPx NAMEH: no picture over it)
          for (const nm of e.site && e.k !== 'yard' ? bn.stages : [e.nm]){ const q = bn.box(nm, mir), bb = [L.pos[i][0] + q[0]*sz, L.pos[i][1] + q[1]*sz, L.pos[i][0] + q[2]*sz, L.pos[i][1] + q[3]*sz];
            const ov = Math.max(0, Math.min(bb[2], nb[2]) - Math.max(bb[0], nb[0]))*Math.max(0, Math.min(bb[3], nb[3]) - Math.max(bb[1], nb[1])); if (ov > 0.15*(nb[2] - nb[0])*(nb[3] - nb[1])){ out.name.push(`${P.cityName || P.name} ${e.k}`); break; } } }
        if (w > 0) out.wet.push({city:P.cityName || P.name, p:P.id, k:e.k, site:e.site ? 1 : 0, cells:+(w*100).toFixed(1)});
        if (e.k === 'yard'){ const sh = L.shore || {}, F = bn.foot(e.nm), s = bn.wsize(P.id, i, 140), pw = bn.wet(e.nm, F.pier, wx, wy, s, mir, true), pwr = bn.pierWater(P.id);
          out.yards.push({city:P.cityName || P.name, p:P.id, kind:sh.riv ? 'river' : sh.far ? 'cluster' : 'coast', d:+Math.hypot(L.pos[i][0], L.pos[i][1]).toFixed(2), pier:+pw.toFixed(3), water:pwr ? +pwr.water.toFixed(3) : 0, real:pwr ? +(pwr.sea + pwr.river).toFixed(3) : 0, touch:(() => { for (const r of [0, 1.5, 3, 4.5]) for (let k = 0; k < 16; k++) if (bn.water(wx + Math.cos(k*Math.PI/8)*r, wy + Math.sin(k*Math.PI/8)*r)) return 1; return 0; })(), basin:sh.bas ? 1 : 0, mir:mir ? 1 : 0}); } }); }
    // the rings' water against the 1:50m mask the layouts used before (how far apart they are, round the cities)
    let dis = 0, n = 0; for (const P of G.P){ if (P.sea || !P.city) continue; for (let k = 0; k < 40; k++){ const a = k*2.4, r = 1 + (k % 8); const x = P.x + Math.cos(a)*r, y = P.y + Math.sin(a)*r; n++; if (bn.water(x, y) !== bn.isWet(x, y)) dis++; } }
    out.maskDiff = +(dis/n*100).toFixed(2); return out; });
  const cl = R.yards.filter(y => y.kind === 'cluster'), REAL = ['Oslo', 'Helsinki', 'Murmansk', 'Recife', 'Fortaleza', 'Oran', 'Port Hedland', 'Bremen', 'Nuuk', 'Kolkata', 'Mumbai', 'Hamburg'], onW = R.yards.filter(y => y.kind !== 'cluster'), off = onW.filter(y => y.water < 0.3);
  checks.cities = R.cities; checks.pictures = R.pictures; checks.onWater = R.wet.length; checks.onWaterList = R.wet.slice(0, 40).map(w => `${w.city} ${w.k}${w.site ? ' (site)' : ''} ${w.cells}%`);
  checks.maskDiffPct = R.maskDiff; checks.hidden = R.hidden; checks.overName = R.name;
  if (R.name.length) fails.push(`${R.name.length} pictures over their city's name: ${R.name.slice(0, 8).join(', ')}`);
  if (R.hidden.length > 8) fails.push(`${R.hidden.length} pictures with no dry room at all (not drawn): ${R.hidden.slice(0, 8).join(', ')}`);
  checks.yards = {n:R.yards.length, maxDist:Math.max(...R.yards.map(y => y.d)), coast:R.yards.filter(y => y.kind === 'coast').length, river:R.yards.filter(y => y.kind === 'river').length, cluster:cl.length, clusters:cl.map(y => y.city), piersOffWater:off.map(y => `${y.city} ${Math.round(y.water*100)}%`), maxFromCity:Math.max(...onW.map(y => y.d))};
  const ko = R.yards.find(y => y.city === 'Kolkata'); checks.kolkata = ko;
  if (R.cities < 600) fails.push(`only ${R.cities} cities checked`);
  if (R.wet.length) fails.push(`${R.wet.length} pictures with part of their footprint on the water: ${checks.onWaterList.slice(0, 8).join(', ')}`);
  { const c = cl.filter(y => REAL.includes(y.city)); if (c.length) fails.push('real ports with their Naval Yard inland: ' + c.map(y => y.city).join(', ')); }
  if (cl.length > 25) fails.push(`${cl.length} Naval Yards not on the water`);
  if (R.yards.length < 300) fails.push(`only ${R.yards.length} Naval Yards`);
  // (owner 2026-11-19 review: a yard on land with only its painted dock basin as "water" counted as on the water: the real water under the piers, or the water at the yard's edge, is what counts)
  { const coastY = R.yards.filter(y => y.kind === 'coast'), bare = coastY.filter(y => !y.basin && y.real < 0.12), bas = coastY.filter(y => y.basin), far = bas.filter(y => !y.touch);
    checks.piersNoRealWater = bare.map(y => y.city); checks.basinYards = bas.length; checks.basinNotTouching = far.map(y => y.city);
    if (bare.length) fails.push(`${bare.length} Naval Yards on a coast with no water under their piers and no dock basin: ${bare.slice(0, 8).map(y => y.city).join(', ')}`);
    if (far.length) fails.push(`${far.length} Naval Yards on a dock basin that does not reach the water: ${far.slice(0, 8).map(y => y.city).join(', ')}`);
    if (bas.length > coastY.length*0.4) fails.push(`${bas.length} of ${coastY.length} coast Naval Yards stand on a dock basin only`); }
  if (off.length > onW.length*0.12) fails.push(`${off.length} Naval Yards with their piers off the water`);
  if (onW.some(y => y.d > 32.5)) fails.push('a Naval Yard more than 32 world px from its city');
  // (Kolkata: where the map draws the Hooghly as water, its estuary, about 70 km down from the city's point; on its thin river line in the town it looked inland)
  if (!ko || ko.kind !== 'coast' || ko.d > 10 || ko.water < 0.5) fails.push('Kolkata: its Naval Yard is not on the Hooghly where the map draws it as water: ' + JSON.stringify(ko));
  return {checks, fails, errors, yards:R.yards, wet:R.wet}; }
