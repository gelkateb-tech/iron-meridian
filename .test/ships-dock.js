// SHIPS NEVER ON LAND (display): a fleet docked in a port (with a garrison of tanks and infantry in the same city) is its own force: ship models
// (never tank or soldier models), standing on water off the city's shore, never on land.   node .test/ships-dock.js   (needs bash tools/mkpage.sh first)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1300, height: 820 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(900);
  await p.click('[data-act="pick"][data-p="5"]'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.click('#sp0'); await p.waitForFunction(() => window.__im && !window.__im.camFly, null, { timeout: 20000 }); await p.waitForTimeout(1500);
  const ports = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, out = [];
    for (const P of G.P) if (!P.sea && P.city && P.coast && S.owner[P.id] === 0 && out.length < 8){ out.push(P.id); im.addArmy(0, P.id, {tank:4, inf:6}); im.addArmy(0, P.id, {frig:2, sub:1, crui:1, carr:1}); } return out; });
  const res = [];
  for (const pid of ports){
    await p.evaluate(id => { const P = window.__im.G.P[id]; window.__im.v3c.centerOn(P.x, P.y, 3); window.__im.geoDirty(); window.__im.redraw(); }, pid); await p.waitForTimeout(700);
    res.push(await p.evaluate(id => { const im = window.__im, TM = im.TM, L = TM.layouts.find(l => l[0] === id), P = im.G.P[id], out = {p:id, name:P.name, roles:[], bad:[]};
      if (!L){ out.bad.push('no layout'); return out; }
      for (const [role, pt] of L[2]){ const wet = im.dock.isWet(pt[0], pt[1]); out.roles.push(role + (wet ? ' wet' : ' dry'));
        if (role[0] === 's' && !wet) out.bad.push('fleet on land: ' + role); if (role[0] === 's' && /sol|hmv|tank|ifv|art|mlrs|sam|truck/.test(role)) out.bad.push('fleet shows land models: ' + role);
        if (role[0] === 'g' && wet) out.bad.push('garrison in the water: ' + role); }
      if (!L[2].some(([r]) => r[0] === 's')) out.bad.push('no fleet role'); if (!L[2].some(([r]) => r[0] === 'g')) out.bad.push('no garrison role'); return out; }, pid)); }
  const bad = res.filter(r => r.bad.length); console.log(res.map(r => r.name + ': ' + r.roles.join(' | ') + (r.bad.length ? '  BAD ' + r.bad.join('; ') : '')).join('\n'));
  console.log(JSON.stringify({ports:ports.length, bad:bad.length}), errs); await b.close(); process.exit(!ports.length || bad.length || errs.length ? 1 : 0);
})();
