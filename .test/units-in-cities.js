// Units in cities (owner 2026-11-22): node .test/units-in-cities.js [W H dpr]   (bash tools/mkpage.sh first; exits 1 on any failure, prints JSON)
// A nations-world game as Germany, the clock paused, every force removed, then: your army on Berlin's centre point, one standing (pinned) a short
// way off Hamburg's, one pinned exactly on Munich's point, a Polish army on Szczecin's point (seen by a scout of yours), one that walked through
// Dresden's point to a spot beyond it (a.hrt), and an unidentified contact on Poznan's point. Checks, at play zoom:
//  (H) heartOn agrees with the rules' atHeart for every force that stands on its point, and is false for the force that only walked through
//  (D) the position dot of a force on a point is exactly the city's point; one off it is at least the marker's ring clear of it
//  (R) the ring: Berlin own, Szczecin war, Munich own, Poznan the unidentified contact; none at Hamburg or Dresden
//  (T) the city line: Berlin "In the city: 1st Infantry Division (5 units)", Szczecin names the Polish army, Hamburg "nobody" (and "Nearby:"),
//      Poznan "? Unidentified"; the phone city sheet shows the line after a tap on Berlin's name
//  (C) close in, the force on Berlin's point has its tag just above the ring and its pictures nearer it than the force off the point (tag farther too)
//  (X) a force off a held point in each of 8 directions, 4 and 15 km out, yours and an enemy's, at hex 12 to 240: clearly outside, its dot and
//      its counter clear of the city's counter (see below; UC_NO_DIRS=1 skips it)
//  (E) no console or page error
const pickNation = require('./pick-nation.js'); const { chromium } = require('playwright'); const path = require('path');
const W = +(process.argv[2] || 440), H = +(process.argv[3] || 956), DPR = +(process.argv[4] || 2), PHONE = W <= 820;
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }), errors = [], fails = [], out = {};
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: PHONE, hasTouch: PHONE }); const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(600);
  await p.click('[data-act="pickscn"][data-k="world64"]'); await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.waitForTimeout(800);
  if (await p.locator('[data-act="start"]').count()) await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 90000 }); await p.waitForTimeout(1000);
  const ids = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im, S = im.S, G = im.G; S.speed = 0; im.SET.tipsOff = true;
    const nat = n => S.nations.findIndex(q => q.name === n), pol = nat('Poland'), rk = (a, b) => Math.min(a, b) + ',' + Math.max(a, b); S.rel[rk(0, pol)] = { st: 'war', since: S.hour, until: null };
    S.armies.length = 0; S.ncnt = {}; S.battles.length = 0; const by = n => G.P.find(P => P.cityName === n && !P.sea);
    const B = by('Berlin'), Hm = by('Hamburg'), M = by('Munich'), Z = by('Szczecin'), Dr = by('Dresden'), Po = by('Poznań');
    const a = im.addArmy(0, B.id, {inf:5}), b2 = im.addArmy(0, B.id, {tank:2}); b2.pos = [B.x + 0.75, B.y + 0.7];   // (and one of yours about 9 km off Berlin's point, at the same time)
    const Wa = by('Warsaw'), w = im.addArmy(pol, Wa.id, {inf:3});   // (a Polish army in Warsaw you cannot see)
    const h = im.addArmy(0, Hm.id, {inf:3, tank:2}); h.pos = [Hm.x + 0.3, Hm.y + 0.2];   // (about 3 km off Hamburg's point)
    const m = im.addArmy(0, M.id, {tank:3}); m.pos = [M.x, M.y];
    const z = im.addArmy(pol, Z.id, {inf:3, tank:2}), sc = im.addArmy(0, Z.id, {spec:1}); sc.pos = [B.x + (Z.x - B.x)*0.75, B.y + (Z.y - B.y)*0.75];
    const d = im.addArmy(0, Dr.id, {inf:2}); d.pos = [Dr.x + 2, Dr.y + 2]; d.hrt = Dr.id;   // (as if it walked through the point to a spot beyond)
    const u = im.addArmy(pol, Po.id, {inf:2}), ue = im.addArmy(0, Po.id, {inf:1}); ue.pos = [Po.x + 3, Po.y + 3];   // (a force of yours in sight of it, not a recon unit: spotted, not identified)
    try { visCache = null; } catch (e) {}
    return {a:a.id, b2:b2.id, w:w.id, h:h.id, m:m.id, z:z.id, d:d.id, u:u.id, P:{B:[B.id, B.x, B.y], Hm:[Hm.id, Hm.x, Hm.y], M:[M.id, M.x, M.y], Z:[Z.id, Z.x, Z.y], Dr:[Dr.id, Dr.x, Dr.y], Po:[Po.id, Po.x, Po.y], Wa:[Wa.id, Wa.x, Wa.y]}}; });
  const fail = (k, v) => fails.push(k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v)));
  // (H) heartOn against atHeart
  const H0 = await p.evaluate(I => { const S = window.__im.S, A = id => S.armies.find(a => a.id === id), uc = window.__im.uc; const r = {};
    for (const k of ['a', 'b2', 'h', 'm', 'z', 'd', 'u']){ const a = A(I[k]); r[k] = {on:uc.heartOn(a), rule:atHeart(a)}; } return r; }, ids);
  out.heart = H0; for (const k of ['a', 'm', 'z', 'u']) if (!H0[k].on || !H0[k].rule) fail('H on the point', [k, H0[k]]);
  if (H0.h.on || H0.h.rule) fail('H off the point', H0.h); if (H0.b2.on || H0.b2.rule) fail('H off Berlin\'s point', H0.b2); if (H0.d.on || !H0.d.rule) fail('H walked through (rules count it, the map shows it where it stands)', H0.d);
  // (D) and (R) at play zoom over each city
  const look = async (P) => { await p.evaluate(([x, y]) => { const im = window.__im, r = document.getElementById('map').getBoundingClientRect(), v = im.view, s = 30/12; v.s = s; v.x = r.width/2 - x*s; v.y = r.height/2 - y*s; im.redraw(); }, [P[1], P[2]]); await p.waitForTimeout(900);
    return p.evaluate(([pid, I]) => { const im = window.__im, uc = im.uc; return {marks:uc.marks().filter(m => m.p === pid && m.sides.length), dots:Object.fromEntries(Object.entries(I).filter(([k, v]) => typeof v === 'number').map(([k, id]) => [k, uc.dot(id)])), ringR:uc.ringR(), s:im.view.s}; }, [P[0], ids]); };
  const near = (q, P) => q && Math.abs(q[0] - P[1]) < 1e-9 && Math.abs(q[1] - P[2]) < 1e-9;
  let L = await look(ids.P.B); out.berlin = L; if (!near(L.dots.a, ids.P.B)) fail('D Berlin dot on the point', L.dots.a); if (!(L.marks[0] && L.marks[0].sides.join() === 'own')) fail('R Berlin ring', L.marks);
  // (M) a force of yours just off the point while another stands on it: never merged into the city's counter, its own dot clear of the ring
  if (!L.dots.b2 || near(L.dots.b2, ids.P.B) || Math.hypot(L.dots.b2[0] - ids.P.B[1], L.dots.b2[1] - ids.P.B[2])*L.s < L.ringR + 2) fail('M Berlin: the force off the point has its own dot clear of the ring', L.dots.b2);
  { const C = await p.evaluate(I => { window.__uclOn = true; window.__im.redraw(); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => { const q = (window.__ucl || []).find(c => c.ids.includes(I.a)); window.__uclOn = false; r(q ? q.ids.concat(q.ml) : null); }))); }, ids);
    if (!C || C.includes(ids.b2)) fail('M Berlin: the off-point force is not in the city stack', C); }
  L = await look(ids.P.Wa); if (L.marks.length) fail('R Warsaw (an army you cannot see) has no ring', L.marks);
  L = await look(ids.P.Hm); out.hamburg = L; if (L.marks.length) fail('R Hamburg has no ring', L.marks);
  if (!L.dots.h || Math.hypot(L.dots.h[0] - ids.P.Hm[1], L.dots.h[1] - ids.P.Hm[2])*L.s < L.ringR + 2) fail('D Hamburg dot clear of the marker', {dot:L.dots.h, px:L.dots.h && Math.hypot(L.dots.h[0] - ids.P.Hm[1], L.dots.h[1] - ids.P.Hm[2])*L.s});
  L = await look(ids.P.M); out.munich = L; if (!near(L.dots.m, ids.P.M)) fail('D Munich (pinned on the point) dot on the point', L.dots.m); if (!(L.marks[0] && L.marks[0].sides.join() === 'own')) fail('R Munich ring', L.marks);
  L = await look(ids.P.Z); out.szczecin = L; if (!near(L.dots.z, ids.P.Z)) fail('D Szczecin dot on the point', L.dots.z); if (!(L.marks[0] && L.marks[0].sides.join() === 'war')) fail('R Szczecin ring', L.marks);
  L = await look(ids.P.Dr); out.dresden = L; if (L.marks.length) fail('R Dresden (walked through) has no ring', L.marks);
  L = await look(ids.P.Po); out.poznan = L; if (!(L.marks[0] && L.marks[0].sides.join() === 'unk')) fail('R Poznan ring: the unidentified contact', L.marks);
  // (T) the city line
  const T = await p.evaluate(P => { const uc = window.__im.uc, t = p => { const d = document.createElement('div'); d.innerHTML = uc.line(p); return d.textContent.replace(/\s+/g, ' ').trim(); };
    return {B:t(P.B[0]), Z:t(P.Z[0]), Hm:t(P.Hm[0]), Po:t(P.Po[0]), Dr:t(P.Dr[0]), Wa:t(P.Wa[0])}; }, ids.P);
  out.lines = T;
  if (!/^In the city: 1st Infantry Division \(5 units\) ?Nearby: .*\(2 units\)$/.test(T.B)) fail('T Berlin', T.B);
  if (!/^In the city: .*\(Poland, 5 units\)/.test(T.Z)) fail('T Szczecin', T.Z);
  if (T.Wa !== 'In the city: not seen') fail('T Warsaw (fog: not seen)', T.Wa);
  if (!/^In the city: nobody ?Nearby: .*\(5 units\)/.test(T.Hm)) fail('T Hamburg', T.Hm);
  if (!/^In the city: \? Unidentified/.test(T.Po)) fail('T Poznan', T.Po);
  if (!/^In the city: nobody ?Nearby: .*walked through the centre/.test(T.Dr)) fail('T Dresden', T.Dr);
  if (PHONE){ await look(ids.P.B); const q = await p.evaluate(pid => { const im = window.__im, c = im.nc.names().find(z => z.p === pid), m = document.getElementById('map').getBoundingClientRect(); return c && {x:m.left + (c.b[0] + c.b[2])/2, y:m.top + (c.b[1] + c.b[3])/2}; }, ids.P.B[0]);
    if (!q) fail('T Berlin name on screen', null); else { await p.touchscreen.tap(q.x, q.y); await p.waitForTimeout(900); const s = await p.evaluate(() => { const e = document.querySelector('#csheet .cs-in'); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; }); out.sheet = s;
      if (!s || !s.startsWith('In the city: 1st Infantry Division (5 units)')) fail('T phone city sheet', s); } }
  // (C) close in (hex 240) over Berlin: the force on the point has its tag just above the ring and its pictures nearer the ring than those of the
  //     force of yours standing off it, whose tag stands well farther off too
  { await p.evaluate(() => { const im = window.__im; im.sel.prov = null; im.sel.army = null; }); await p.keyboard.press('Escape');
    await p.evaluate(([x, y]) => { const im = window.__im, r = document.getElementById('map').getBoundingClientRect(), v = im.view, s = 240/12; v.s = s; v.x = r.width/2 - x*s; v.y = r.height/2 - y*s; im.redraw(); }, [ids.P.B[1], ids.P.B[2]]); await p.waitForTimeout(3000);
    const C = await p.evaluate(I => new Promise(r => { window.__uclOn = true; window.__im.redraw(); requestAnimationFrame(() => requestAnimationFrame(() => { const im = window.__im, P = im.G.P[I.P.B[0]], m = im.toScreen(P.x, P.y), L = window.__ucl || []; window.__uclOn = false;
      const f = id => L.find(c => c.ids.includes(id)), bp = b => b ? Math.hypot(Math.max(b[0] - m[0], 0, m[0] - b[2]), Math.max(b[1] - m[1], 0, m[1] - b[3])) : null, a = f(I.a), o = f(I.b2);
      r(a && o ? {aTagOn:a.tag, aTag:Math.round(Math.hypot(a.tx - m[0], a.ty - m[1])), oTag:Math.round(Math.hypot(o.tx - m[0], o.ty - m[1])), aFm:bp(a.fm), oFm:bp(o.fm)} : {miss:[!!a, !!o]}); })); }), ids);
    out.close = C; if (!(C.aTagOn && C.aTag < 45 && C.oTag > C.aTag + 40 && C.aFm != null && C.oFm != null && C.oFm >= C.aFm + 16)) fail('C close in: the force in the city is the one at the ring', C); }
  // (X) every direction: a force of yours standing 4 km and 15 km (KM_W world units a km) N, NE, E, SE, S, SW, W and NW of Berlin's point
  //     while another holds it, and the same for a Polish army off Poznan's point (seen by a Special Operations unit of yours), at hex 12, 30, 60,
  //     120 and 240: the force on the point keeps its dot on the marker; the one off it has its dot clear of the ring and never under (or touching)
  //     the city's counter or the room down to the ring, and its counter (or the stack it stands in) keeps a clear gap from the city's counter
  //     (6 px between their boxes with the marks, 15 at the same height: never side by side above the ring)
  if (!process.env.UC_NO_DIRS){ out.dirs = 0; const DIRS = {N:[0, -1], NE:[1, -1], E:[1, 0], SE:[1, 1], S:[0, 1], SW:[-1, 1], W:[-1, 0], NW:[-1, -1]};
    const gap = (a, q) => Math.max(a[0] - q[2], q[0] - a[2], a[1] - q[3], q[1] - a[3]), pd = (b2, x, y) => Math.hypot(Math.max(b2[0] - x, 0, x - b2[2]), Math.max(b2[1] - y, 0, y - b2[3]));
    const KW = await p.evaluate(() => KM_W); for (const side of ['own', 'enemy']) for (const km of [4, 15]) for (const [dn, dv] of Object.entries(DIRS)){ const l = Math.hypot(dv[0], dv[1]), dist = km*KW, off = [dv[0]/l*dist, dv[1]/l*dist];
      const I = await p.evaluate(([side, off]) => { const im = window.__im, S = im.S, G = im.G; S.armies.length = 0; S.ncnt = {}; S.battles.length = 0; const by = n => G.P.find(P => P.cityName === n && !P.sea), pol = S.nations.findIndex(q => q.name === 'Poland');
        const C = by(side === 'own' ? 'Berlin' : 'Poznań'), o = side === 'own' ? 0 : pol, a = im.addArmy(o, C.id, side === 'own' ? {inf:4, tank:2} : {inf:3, tank:2}), b2 = im.addArmy(o, C.id, {inf:2}); b2.pos = [C.x + off[0], C.y + off[1]];
        if (side !== 'own'){ const sc = im.addArmy(0, C.id, {spec:1}); sc.pos = [C.x + 3, C.y + 3]; } try { visCache = null; } catch (e) {} return {a:a.id, b:b2.id, p:C.id, x:C.x, y:C.y}; }, [side, off]);
      for (const hp of [12, 30, 60, 120, 240]){ await p.evaluate(([x, y, hp]) => { const im = window.__im, r = document.getElementById('map').getBoundingClientRect(), v = im.view, s = hp/12; v.s = s; v.x = r.width/2 - x*s; v.y = r.height/2 - y*s; im.redraw(); }, [I.x, I.y, hp]); await p.waitForTimeout(hp >= 120 ? 1200 : 400);
        const m = await p.evaluate(I => new Promise(res => { window.__uclOn = true; window.__im.redraw(); requestAnimationFrame(() => requestAnimationFrame(() => { const im = window.__im, L = window.__ucl || []; window.__uclOn = false; const P = im.G.P[I.p], pt = im.toScreen(P.x, P.y);
          const h = L.find(c => c.ids.includes(I.a)), o = L.find(c => c.ids.includes(I.b)); let sb = null; for (const c of L) for (const q of c.sb || []) if (q.ids.includes(I.b)) sb = q.b;
          res(h && o ? {pt, R:im.uc.ringR(), hd:[h.px, h.py], hb:h.bx, od:[o.px, o.py], ob:sb || o.bx, tag:o.tag} : null); })); }), I);
        const k = `${side} ${km} km ${dn} hex ${hp}`; out.dirs++; if (!m){ fail('X counters missing', k); continue; }
        const hOn = Math.hypot(m.hd[0] - m.pt[0], m.hd[1] - m.pt[1]), oPt = Math.hypot(m.od[0] - m.pt[0], m.od[1] - m.pt[1]), oHb = pd([m.hb[0], m.hb[1], m.hb[2], Math.max(m.hb[3], m.pt[1] - m.R)], m.od[0], m.od[1]);
        const row = Math.min(m.ob[3], m.hb[3]) > Math.max(m.ob[1], m.hb[1]), g = gap(m.ob, m.hb), need = m.tag ? 6 : row ? 15 : 6;
        if (hOn > 0.01 || oPt < m.R + 9 || oHb < 8 || g < need - 0.6) fail('X off the point, clearly outside', {k, hOn:+hOn.toFixed(2), oPt:+oPt.toFixed(1), dotToCityCounter:+oHb.toFixed(1), counterGap:+g.toFixed(1), need}); } } }
  if (errors.length) fail('E errors', errors.slice(0, 5));
  console.log(JSON.stringify({fails, lines:out.lines, sheet:out.sheet, heart:out.heart, close:out.close, dirs:out.dirs}, null, 1)); console.log(fails.length ? 'FAIL' : 'PASS');
  await b.close(); process.exit(fails.length ? 1 : 0); })();
