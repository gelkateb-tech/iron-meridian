// Taps on the unit display (Part 2 repair): zoomed in a tap on a force's PICTURE selects it (not only its flag tag); zoomed out a tap on a
// counter stacked beside the one that covers it (another side's, HITX sat) acts on that force: yours selects it, a foe's (with one of yours
// selected) is targeted. node .test/unit-taps.js [W H dpr]   prints JSON {checks, errors} and exits 1 on any failure.
const { chromium } = require('playwright');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), DPR = +(process.argv[4] || 1), PHONE = W <= 820;
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: PHONE, isMobile: false });
  const p = await ctx.newPage(); const errors = [], checks = {};
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.addInitScript(() => { let s = 0x2f6b1d3; Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0)/4294967296; }; });
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
  await p.click('[data-act="pick"][data-p="5"]'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 });
  const sc = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove());
    const im = window.__im, S = im.S, G = im.G, N = S.nations, by = n => G.P.find(P => P.cityName === n), nat = n => N.findIndex(q => q.name === n), rk = (a, b) => Math.min(a, b) + ',' + Math.max(a, b);
    const fr = nat('France'), uk = nat('United Kingdom');
    S.rel[rk(0, fr)] = { st: 'war', since: S.hour, until: null }; S.rel[rk(0, uk)] = { st: 'ally', since: S.hour, until: null };
    const ber = by('Berlin'), WI = 631, KA = 632, SEA = 3346;
    im.addArmy(0, ber.id, { tank: 3, inf: 3, ifv: 2 }); im.addArmy(uk, ber.id, { inf: 2, tank: 1 });
    im.addArmy(0, WI, { inf: 3, tank: 1 }); im.addArmy(fr, WI, { tank: 3, inf: 2 }); im.addArmy(fr, KA, { inf: 2, sam: 1 });
    const sh = im.addArmy(0, SEA, { frig: 3, sub: 1, crui: 1 });
    S.speed = 1; im.tick(); im.tick(); S.speed = 0;
    return { ber: [ber.x, ber.y], wi: [G.P[WI].x, G.P[WI].y], sea: [G.P[SEA].x, G.P[SEA].y], sh: sh.id, fr }; });
  const view = (xy, hp) => p.evaluate(([x, y, hp, W, H]) => { const v = window.__im.view, s = hp/12; v.s = s; v.x = W/2 - x*s; v.y = H/2 - y*s; }, [xy[0], xy[1], hp, W, H]);
  const clear = () => p.evaluate(() => { window.__im.sel.army = null; window.__im.sel.group.length = 0; window.__im.sel.chase = null; });
  // a point inside box h that no counter (hits) and no other tap target drawn above it covers
  const freePt = (h, hits) => { for (let fy = 0.5; fy < 0.95; fy += 0.1) for (let fx = 0.5; fx < 0.95; fx += 0.1) for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]){
      const x = h.x + h.w*(0.5 + sx*(fx - 0.5)), y = h.y + h.h*(0.5 + sy*(fy - 0.5)); if (!hits.some(q => x >= q.x - 2 && x <= q.x + q.w + 2 && y >= q.y - 2 && y <= q.y + q.h + 2)) return [x, y]; } return null; };
  // (1) zoomed in: a tap on the ships' picture, then on the German stack's picture at Berlin, selects that force
  for (const [nm, xy, hp] of [['sea', sc.sea, 170], ['berlin', sc.ber, 170]]){
    await view(xy, hp); await p.waitForTimeout(1500); await clear();
    const st = await p.evaluate(() => ({ hits: window.__im.hits.map(h => ({ x: h.x, y: h.y, w: h.w, h: h.h, ids: h.ids })), hitx: window.__im.hitx.map(h => ({ x: h.x, y: h.y, w: h.w, h: h.h, ids: h.ids, art: !!h.art, sat: !!h.sat })) }));
    const mineIds = await p.evaluate(() => window.__im.S.armies.filter(a => a.owner === 0).map(a => a.id));
    const own = st.hitx.filter(h => h.art).find(h => h.ids.some(id => nm === 'sea' ? id === sc.sh : mineIds.includes(id)) && freePt(h, st.hits.concat(st.hitx.filter(q => q.sat))));
    if (!own){ checks['art-' + nm] = { ok: false, why: 'no picture box', n: st.hitx.length }; continue; }
    const pt = freePt(own, st.hits.concat(st.hitx.filter(q => q.sat)));
    await p.evaluate(([x, y]) => window.__im.tap(x, y), pt); await p.waitForTimeout(150);
    const s1 = await p.evaluate(() => window.__im.sel.army), chooser = await p.evaluate(() => { const el = document.getElementById('chooser'); return el && !el.hidden ? [...el.querySelectorAll('[data-act="choose-army"]')].map(e => +e.dataset.id) : null; });
    const mine = await p.evaluate(ids => ids.filter(id => { const a = window.__im.S.armies.find(q => q.id === id); return a && a.owner === 0; }), own.ids);
    // (in a city of yours a tap on your forces opens the chooser of the forces there, as a tap on their counter does)
    checks['art-' + nm] = { ok: mine.length ? mine.includes(s1) || !!(chooser && mine.some(id => chooser.includes(id))) : true, sel: s1, chooser, ids: own.ids, at: pt.map(Math.round) };
    await p.evaluate(() => { const el = document.getElementById('chooser'); if (el) el.hidden = true; }); }
  // (2) zoomed out: find stacked counters (HITX sat); tap each: one of yours selects it, a foe's with your force selected targets it
  let found = 0;
  for (const [xy, hp] of [[sc.wi, 14], [sc.wi, 10], [sc.ber, 14], [sc.wi, 20], [sc.ber, 8], [sc.wi, 28]]){
    await view(xy, hp); await p.waitForTimeout(1300); await clear(); await p.waitForTimeout(200);
    // (the stacks are read again before each tap: a tap that zooms in, and the view set back, may leave a stack laid out a little differently,
    // as the counters' fades keep their state a moment; what is tapped is always what is on screen at that moment)
    const rd = () => p.evaluate(() => ({ hits: window.__im.hits.map(h => ({ x: h.x, y: h.y, w: h.w, h: h.h, ids: h.ids })), sats: window.__im.hitx.filter(h => h.sat).map(h => ({ x: h.x, y: h.y, w: h.w, h: h.h, ids: h.ids, cx: h.cx, cy: h.cy, a: h.a })) }));
    // (and only once the view has come to rest: a tap that zoomed in glides the camera for a moment after the view is set back)
    const settle = async () => { let last = ''; for (let i = 0; i < 40; i++){ const v = await p.evaluate(() => { const im = window.__im, v = im.view; return [v.s, v.x, v.y].map(q => q.toFixed(3)).join(',') + (im.camFly ? 'f' : ''); }); if (v === last) break; last = v; await p.waitForTimeout(120); } await p.waitForTimeout(250); };
    const st = await rd(), done = new Set();
    for (let it = 0; it < 24; it++){ if (it) await settle(); const cur = it ? await rd() : st, q = cur.sats.find(z => !done.has(z.ids.join(','))); if (!q) break; done.add(q.ids.join(',')); found++; const own = await p.evaluate(ids => ids.filter(id => { const a = window.__im.S.armies.find(z => z.id === id); return a && a.owner === 0; }), q.ids);
      const spread = await p.evaluate(ids => new Set(ids.map(id => { const a = window.__im.S.armies.find(z => z.id === id); return a ? a.at : -1; })).size > 1, q.ids);
      if (spread){ await clear(); const s0 = await p.evaluate(() => window.__im.view.s); await p.evaluate(([x, y]) => window.__im.tap(x, y), [q.cx, q.cy]); await p.waitForTimeout(700); const s1 = await p.evaluate(() => window.__im.view.s);   // (forces from more than one province: a tap zooms in on them, or in a city of yours opens the chooser, as a tap on any counter does)
        const ch = await p.evaluate(() => { const el = document.getElementById('chooser'); const r = el && !el.hidden; if (el) el.hidden = true; return r; });
        checks['sat-spread-' + hp + '-' + q.ids[0]] = { ok: s1 > s0*1.3 || ch, s0, s1, chooser: ch }; await settle(); await view(xy, hp); await p.waitForTimeout(600); continue; }
      if (own.length){ await clear(); await p.evaluate(([x, y]) => window.__im.tap(x, y), [q.cx, q.cy]); await p.waitForTimeout(120); const s1 = await p.evaluate(() => window.__im.sel.army); checks['sat-own-' + hp + '-' + q.ids[0]] = { ok: own.includes(s1), sel: s1, ids: q.ids }; }
      else { const mine = st.hits.map(h => h.ids).flat(); const myId = await p.evaluate(ids => { const a = window.__im.S.armies.find(z => ids.includes(z.id) && z.owner === 0 && !z.air); return a ? a.id : null; }, mine);
        if (myId == null) continue; await clear(); await p.evaluate(id => window.__im.selectArmy(id), myId); await p.waitForTimeout(150);
        const war = await p.evaluate(ids => ids.some(id => { const im = window.__im, a = im.S.armies.find(z => z.id === id); return a && a.owner > 0 && im.S.rel[Math.min(0, a.owner) + ',' + Math.max(0, a.owner)] && im.S.rel[Math.min(0, a.owner) + ',' + Math.max(0, a.owner)].st === 'war'; }), q.ids);
        await p.evaluate(([x, y]) => window.__im.tap(x, y), [q.cx, q.cy]); await p.waitForTimeout(120); const ch = await p.evaluate(() => window.__im.sel.chase);
        checks['sat-foe-' + hp + '-' + q.ids[0]] = { ok: war ? q.ids.includes(ch) : true, chase: ch, ids: q.ids }; } }
    // every stacked counter is full size (no 13 px pips): at least 20 css px across
    for (const q of st.sats) if (Math.min(q.w, q.h) < 20) checks['sat-size-' + hp + '-' + q.ids[0]] = { ok: false, w: q.w, h: q.h }; }
  checks.satsFound = { ok: found > 0, n: found };
  const bad = Object.entries(checks).filter(([, v]) => !v.ok);
  console.log(JSON.stringify({ viewport: [W, H, DPR], checks, fails: bad.map(([k]) => k), errors }, null, 1));
  await b.close(); process.exit(bad.length || errors.length ? 1 : 0);
})();
