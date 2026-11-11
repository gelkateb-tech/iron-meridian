// Unit display by zoom (Part 2): screenshots of the map zoomed out (diamond counters: yours, an ally's, the enemy's, others'; an overlap),
// zoomed in (pictures with flag tags: a city with several stacks, a force on the march, ships in port, parked aircraft) and the cross-fade
// half way. node .test/unit-display-shots.js [outDir] [W H dpr]   (exit 1 on page errors)
const { chromium } = require('playwright');
const OUT = process.argv[2] || __dirname, W = +(process.argv[3] || 1440), H = +(process.argv[4] || 900), DPR = +(process.argv[5] || 1), PHONE = W <= 820, TAG = PHONE ? 'phone' : 'desk';
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: PHONE, isMobile: false });
  const p = await ctx.newPage(); const errors = [];
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.addInitScript(() => { let s = 0x2f6b1d3; Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0)/4294967296; }; });
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
  await p.click('[data-act="pick"][data-p="5"]'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 });
  const sc = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove());
    const im = window.__im, S = im.S, G = im.G, N = S.nations, by = n => G.P.find(P => P.cityName === n), nat = n => N.findIndex(q => q.name === n), rk = (a, b) => Math.min(a, b) + ',' + Math.max(a, b);
    const fr = nat('France'), uk = nat('United Kingdom'), it = nat('Italy');
    S.rel[rk(0, fr)] = { st: 'war', since: S.hour, until: null };
    if (uk >= 0) S.rel[rk(0, uk)] = { st: 'ally', since: S.hour, until: null };
    const ber = by('Berlin'), mun = by('Munich'), ham = by('Hamburg'), WI = 631, KA = 632, SEA = 3346;
    im.addArmy(0, ber.id, { tank: 3, inf: 3, ifv: 2 }); im.addArmy(0, ber.id, { mlrs: 2, sam: 1, inf: 1 }); im.addArmy(0, ber.id, { art: 2, at: 2 });
    if (uk >= 0) im.addArmy(uk, ber.id, { inf: 2, tank: 1 });
    try { im.air.spawn(0, ber.id, 'jet'); im.air.spawn(0, ber.id, 'heli'); } catch (e) {}
    im.addArmy(0, WI, { inf: 3, tank: 1 }); im.addArmy(fr, WI, { tank: 3, inf: 2 }); im.addArmy(fr, KA, { inf: 2, sam: 1 });
    im.addArmy(0, SEA, { frig: 3, sub: 1, crui: 1 }); im.addArmy(0, ham.id, { frig: 2, crui: 1, carr: 1 });   // (a fleet at sea, and one docked at Hamburg)
    const mu = im.addArmy(0, mun.id, { tank: 4, art: 3, inf: 2 });
    im.addArmy(0, 564, { mlrs: 3, sam: 2, ifv: 2, inf: 1 });
    if (it >= 0){ const P = G.P.find(q => S.owner[q.id] === it && q.city); if (P) im.addArmy(it, P.id, { inf: 3, tank: 2 }); }
    if (uk >= 0){ const P = G.P.find(q => S.owner[q.id] === uk && q.city); if (P) im.addArmy(uk, P.id, { inf: 2, art: 1 }); }
    S.speed = 1; im.tick(); im.tick(); S.speed = 0;
    const mto = mun.nbs.find(q => !G.P[q].sea && S.owner[q] === 0) ?? mun.nbs[0]; im.orderMove(mu, mto);
    return { ber: [ber.x, ber.y], wi: [G.P[WI].x, G.P[WI].y], sea: [G.P[SEA].x, G.P[SEA].y], mun: [mun.x, mun.y], ham: [ham.x, ham.y] }; });
  const view = (xy, hp, dx = 0, dy = 0) => p.evaluate(([x, y, hp, W, H]) => { const v = window.__im.view, s = hp/12; v.s = s; v.x = W/2 - x*s; v.y = H/2 - y*s; }, [xy[0] + dx, xy[1] + dy, hp, W, H]);
  const shot = async (n, xy, hp, dx, dy, ms = 1800) => { await view(xy, hp, dx, dy); await p.waitForTimeout(ms); await p.screenshot({ path: `${OUT}/ud-${TAG}-${n}.png` }); };
  await shot('out-europe', sc.ber, PHONE ? 10 : 14, -60, 40);
  await shot('out-germany', sc.ber, 34, -60, 50);
  await shot('mid-germany', sc.wi, 64, 30, -40);
  await shot('out-overlap-rhine', sc.wi, PHONE ? 18 : 22, 20, -20);   // (forces of several sides close together: stacked beside each other, none hidden)
  await shot('fade-early-berlin', sc.ber, 125); await shot('fade-berlin', sc.ber, 129); await shot('fade-late-berlin', sc.ber, 133);   // (the diamond fades out over the band's first half, the flag tag in over its second: never both)
  await shot('in-berlin', sc.ber, 170);
  await shot('in-wiesbaden', sc.wi, 160);
  await shot('in-sea', sc.sea, 160);
  await shot('in-port-hamburg', sc.ham, 170);
  await p.evaluate(() => { window.__im.S.speed = 2; }); await p.waitForTimeout(300);
  await shot('in-munich-march', sc.mun, 150, 0, 0, 2500);
  await p.evaluate(() => { window.__im.S.speed = 0; });
  console.log(JSON.stringify({ errors }, null, 1));
  await b.close(); process.exit(errors.length ? 1 : 0);
})();
