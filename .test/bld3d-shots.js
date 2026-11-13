// Buildings on the map at three zoom levels (out: none; mid: one per city; close: the full clusters with the HQ), for the owner, plus a zoom-drift
// proof and (with the 3D models) a model sheet of every building type at levels 1, 3 and 5 and its construction site.
//   node .test/bld3d-shots.js <outDir> <tag> [page.html]      (run bash tools/mkpage.sh first; tag: before / after)
// Germany (Berlin the capital, Hamburg a port, Munich with a new Airbase under construction, Frankfurt raising its Army Base) and the United States
// (Washington, New York), desktop 1440x900 and phone 390x844, both at dpr 2, nations world, in daylight.
const { chromium } = require('playwright'); const path = require('path');
const OUT = process.argv[2] || __dirname, TAG = process.argv[3] || 'after', PAGE = process.argv[4] || 'page.html';
const RES = [['desk', 1440, 900, 2], ['phone', 390, 844, 2]];
const ZOOMS = [['out', 16], ['mid', 36], ['close', 96]];
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const errors = [], info = {};
  for (const [DEV, W, H, DPR] of RES){
    const PHONE = W <= 820;
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: PHONE, isMobile: PHONE });
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(DEV + ' ' + e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(DEV + ' console: ' + m.text()); });
    await p.goto('file://' + path.join(__dirname, PAGE) + '?start=nations'); await p.waitForTimeout(900);
    const tap = s => PHONE ? p.tap(s) : p.click(s);
    if (await p.locator('[data-act="pickscn"][data-k="world64"]').count()) await tap('[data-act="pickscn"][data-k="world64"]');
    await tap('[data-act="pickreg"][data-k="Europe"]'); await p.waitForTimeout(250);
    const i = await p.evaluate(() => SCENARIOS.world64.powers.findIndex(P => P.name === 'Germany')); await tap(`[data-act="pick"][data-p="${i}"]`); await p.waitForTimeout(250);
    await p.evaluate(() => document.querySelector('[data-act="begin"]').scrollIntoView()); await tap('[data-act="begin"]'); await p.waitForTimeout(1300);
    if (await p.locator('[data-act="start"]').count()) await tap('[data-act="start"]'); await p.waitForTimeout(3000);
    const C = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G; S.speed = 0; document.querySelectorAll('.toast').forEach(t => t.remove());
      const P = n => G.P.find(q => q.cityName === n) || G.P.find(q => q.name === n);
      const set = (n, o) => { const Q = P(n); if (!Q) return null; Object.assign(S.bld[Q.id], o); return Q.id; };
      const be = set('Berlin', {fac:4, air:3, arms:2, rec:2, fort:1, silo:1}), ha = set('Hamburg', {yard:3, fac:1, arms:1}), mu = set('Munich', {fac:1}), fr = set('Frankfurt', {fac:1, arms:1});
      if (mu != null) S.cons[mu] = {k:'air', lvl:1, h:40, h0:96};
      if (fr != null) S.cons[fr] = {k:'fac', lvl:2, h:20, h0:72};
      const wa = P('Washington'), ny = P('New York');
      if (wa) Object.assign(S.bld[wa.id], {fac:5, air:5, silo:3, rec:3, fort:3}); if (ny) Object.assign(S.bld[ny.id], {yard:5, arms:4, fac:2, air:2});
      im.tick(); const xy = q => q == null ? null : [G.P[q].x, G.P[q].y];
      return {be:xy(be), ha:xy(ha), mu:xy(mu), fr:xy(fr), wa:wa ? [wa.x, wa.y] : null, ny:ny ? [ny.x, ny.y] : null, ids:{be, ha, mu, fr, wa:wa && wa.id, ny:ny && ny.id}}; });
    info[DEV] = C;
    // the view: centred on world (x, y) at hexPx hp, the sun high over the place
    const look = (x, y, hp, hr) => p.evaluate(([x, y, hp, W, H, PHONE, hr]) => { const im = window.__im, v = im.view, s = hp/12; im.S.sunOff = ((hr - im.S.hour) % 24 + 24) % 24;
      v.s = s; v.x = (W - (PHONE ? 0 : 360))/2 - x*s; v.y = H/2 - y*s; document.querySelectorAll('.toast').forEach(t => t.remove()); }, [x, y, hp, W, H, PHONE, hr]);
    const scenes = [['de', C.be && C.ha ? [(C.be[0]*0.45 + C.ha[0]*0.3 + (C.mu || C.be)[0]*0.25), (C.be[1]*0.45 + C.ha[1]*0.3 + (C.mu || C.be)[1]*0.25)] : C.be, 11], ['us', C.wa && C.ny ? [(C.wa[0] + C.ny[0])/2, (C.wa[1] + C.ny[1])/2] : C.wa, 17]];
    for (const [sc, at, hr] of scenes){ if (!at) continue;
      for (const [zn, hp] of ZOOMS){
        let ctr = at; if (zn === 'close') ctr = sc === 'de' ? C.be : C.wa;   // close in: the capital's cluster with its HQ
        await look(ctr[0], ctr[1], hp, hr); await p.waitForTimeout(2600); await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.waitForTimeout(300);
        await p.screenshot({ path: `${OUT}/${TAG}-${sc}-${zn}-${DEV}.png` }); }
      if (sc === 'de'){ for (const [nm, q] of [['hamburg', C.ha], ['munich', C.mu], ['frankfurt', C.fr]]) if (q){ await look(q[0], q[1], 96, hr); await p.waitForTimeout(2200); await p.screenshot({ path: `${OUT}/${TAG}-de-close-${nm}-${DEV}.png` }); } }
      if (sc === 'us' && C.ny){ await look(C.ny[0], C.ny[1], 96, hr); await p.waitForTimeout(2200); await p.screenshot({ path: `${OUT}/${TAG}-us-close-newyork-${DEV}.png` }); } }
    // the zoom-drift proof: the same spot (Berlin) at two zooms, a cross on each building's anchor (toScreen of its world point) and on the city point
    if (C.be) for (const hp of [72, 150]){ await look(C.be[0], C.be[1], hp, 11); await p.waitForTimeout(2400);
      await p.evaluate(() => { document.querySelectorAll('.b3x').forEach(e => e.remove()); const im = window.__im, L = (im.b3d && im.b3d.dbg) || [];
        const R = document.getElementById('map').getBoundingClientRect();
        const mark = (x, y, c) => { const d = document.createElement('div'); d.className = 'b3x'; d.style.cssText = `position:fixed;left:${R.left + x - 6}px;top:${R.top + y - 6}px;width:12px;height:12px;z-index:99999;pointer-events:none;background:linear-gradient(${c},${c}) center/12px 2px no-repeat,linear-gradient(${c},${c}) center/2px 12px no-repeat`; document.body.appendChild(d); };
        for (const e of L){ const [sx, sy] = im.toScreen(e.wx, e.wy); mark(sx, sy, e.hq ? '#ff3b30' : '#00e5ff'); } });
      await p.screenshot({ path: `${OUT}/${TAG}-drift-z${hp}-${DEV}.png` }); await p.evaluate(() => document.querySelectorAll('.b3x').forEach(e => e.remove())); }
    // the model sheet: every building type at levels 1, 3 and 5 (Fortifications 1, 2, 3) and its construction site, plus the HQ, drawn by the game
    if (!PHONE) for (let i = 0; i < 30; i++){ if (await p.evaluate(() => !!(window.__im.b3d && window.__im.b3d.sheet && window.__im.b3d.sheet()))) break; await p.waitForTimeout(300); }
    if (!PHONE) { const ok = await p.evaluate(() => { const im = window.__im; if (!im.b3d || !im.b3d.sheet) return false; const c = im.b3d.sheet(); if (!c) return false;
        c.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:#56603f'; c.id = 'b3sheet'; document.body.appendChild(c); return [c.width, c.height]; });
      if (ok){ await p.waitForTimeout(400); const el = await p.$('#b3sheet'); await el.screenshot({ path: `${OUT}/${TAG}-model-sheet.png` }); await p.evaluate(() => document.getElementById('b3sheet').remove()); } }
    await ctx.close(); }
  await b.close(); console.log(JSON.stringify({ errors, info }, null, 1));
})();
