// Units in cities (owner 2026-11-22): node .test/units-in-cities.js [W H dpr]   (bash tools/mkpage.sh first; exits 1 on any failure, prints JSON)
// A nations-world game as Germany, the clock paused, every force removed, then: your army on Berlin's centre point, one standing (pinned) a short
// way off Hamburg's, one pinned exactly on Munich's point, a Polish army on Szczecin's point (seen by a scout of yours), one that walked through
// Dresden's point to a spot beyond it (a.hrt), and an unidentified contact on Poznan's point. Checks, at play zoom:
//  (H) heartOn agrees with the rules' atHeart for every force that stands on its point, and is false for the force that only walked through
//  (D) the position dot of a force on a point is exactly the city's point; one off it is at least the marker's ring clear of it
//  (R) the ring: Berlin own, Szczecin war, Munich own, Poznan the unidentified contact; none at Hamburg or Dresden
//  (T) the city line: Berlin "In the city: 1st Infantry Division (5 units)", Szczecin names the Polish army, Hamburg "nobody" (and "Nearby:"),
//      Poznan "? Unidentified"; the phone city sheet shows the line after a tap on Berlin's name
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
    const a = im.addArmy(0, B.id, {inf:5}), h = im.addArmy(0, Hm.id, {inf:3, tank:2}); h.pos = [Hm.x + 0.3, Hm.y + 0.2];   // (about 3 km off Hamburg's point)
    const m = im.addArmy(0, M.id, {tank:3}); m.pos = [M.x, M.y];
    const z = im.addArmy(pol, Z.id, {inf:3, tank:2}), sc = im.addArmy(0, Z.id, {spec:1}); sc.pos = [B.x + (Z.x - B.x)*0.75, B.y + (Z.y - B.y)*0.75];
    const d = im.addArmy(0, Dr.id, {inf:2}); d.pos = [Dr.x + 2, Dr.y + 2]; d.hrt = Dr.id;   // (as if it walked through the point to a spot beyond)
    const u = im.addArmy(pol, Po.id, {inf:2}), ue = im.addArmy(0, Po.id, {inf:1}); ue.pos = [Po.x + 3, Po.y + 3];   // (a force of yours in sight of it, not a recon unit: spotted, not identified)
    try { visCache = null; } catch (e) {}
    return {a:a.id, h:h.id, m:m.id, z:z.id, d:d.id, u:u.id, P:{B:[B.id, B.x, B.y], Hm:[Hm.id, Hm.x, Hm.y], M:[M.id, M.x, M.y], Z:[Z.id, Z.x, Z.y], Dr:[Dr.id, Dr.x, Dr.y], Po:[Po.id, Po.x, Po.y]}}; });
  const fail = (k, v) => fails.push(k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v)));
  // (H) heartOn against atHeart
  const H0 = await p.evaluate(I => { const S = window.__im.S, A = id => S.armies.find(a => a.id === id), uc = window.__im.uc; const r = {};
    for (const k of ['a', 'h', 'm', 'z', 'd', 'u']){ const a = A(I[k]); r[k] = {on:uc.heartOn(a), rule:atHeart(a)}; } return r; }, ids);
  out.heart = H0; for (const k of ['a', 'm', 'z', 'u']) if (!H0[k].on || !H0[k].rule) fail('H on the point', [k, H0[k]]);
  if (H0.h.on || H0.h.rule) fail('H off the point', H0.h); if (H0.d.on || !H0.d.rule) fail('H walked through (rules count it, the map shows it where it stands)', H0.d);
  // (D) and (R) at play zoom over each city
  const look = async (P) => { await p.evaluate(([x, y]) => { const im = window.__im, r = document.getElementById('map').getBoundingClientRect(), v = im.view, s = 30/12; v.s = s; v.x = r.width/2 - x*s; v.y = r.height/2 - y*s; im.redraw(); }, [P[1], P[2]]); await p.waitForTimeout(900);
    return p.evaluate(([pid, I]) => { const im = window.__im, uc = im.uc; return {marks:uc.marks().filter(m => m.p === pid), dots:Object.fromEntries(Object.entries(I).filter(([k, v]) => typeof v === 'number').map(([k, id]) => [k, uc.dot(id)])), ringR:uc.ringR(), s:im.view.s}; }, [P[0], ids]); };
  const near = (q, P) => q && Math.abs(q[0] - P[1]) < 1e-9 && Math.abs(q[1] - P[2]) < 1e-9;
  let L = await look(ids.P.B); out.berlin = L; if (!near(L.dots.a, ids.P.B)) fail('D Berlin dot on the point', L.dots.a); if (!(L.marks[0] && L.marks[0].sides.join() === 'own')) fail('R Berlin ring', L.marks);
  L = await look(ids.P.Hm); out.hamburg = L; if (L.marks.length) fail('R Hamburg has no ring', L.marks);
  if (!L.dots.h || Math.hypot(L.dots.h[0] - ids.P.Hm[1], L.dots.h[1] - ids.P.Hm[2])*L.s < L.ringR + 2) fail('D Hamburg dot clear of the marker', {dot:L.dots.h, px:L.dots.h && Math.hypot(L.dots.h[0] - ids.P.Hm[1], L.dots.h[1] - ids.P.Hm[2])*L.s});
  L = await look(ids.P.M); out.munich = L; if (!near(L.dots.m, ids.P.M)) fail('D Munich (pinned on the point) dot on the point', L.dots.m); if (!(L.marks[0] && L.marks[0].sides.join() === 'own')) fail('R Munich ring', L.marks);
  L = await look(ids.P.Z); out.szczecin = L; if (!near(L.dots.z, ids.P.Z)) fail('D Szczecin dot on the point', L.dots.z); if (!(L.marks[0] && L.marks[0].sides.join() === 'war')) fail('R Szczecin ring', L.marks);
  L = await look(ids.P.Dr); out.dresden = L; if (L.marks.length) fail('R Dresden (walked through) has no ring', L.marks);
  L = await look(ids.P.Po); out.poznan = L; if (!(L.marks[0] && L.marks[0].sides.join() === 'unk')) fail('R Poznan ring: the unidentified contact', L.marks);
  // (T) the city line
  const T = await p.evaluate(P => { const uc = window.__im.uc, t = p => { const d = document.createElement('div'); d.innerHTML = uc.line(p); return d.textContent.replace(/\s+/g, ' ').trim(); };
    return {B:t(P.B[0]), Z:t(P.Z[0]), Hm:t(P.Hm[0]), Po:t(P.Po[0]), Dr:t(P.Dr[0])}; }, ids.P);
  out.lines = T;
  if (!/^In the city: 1st Infantry Division \(5 units\)$/.test(T.B)) fail('T Berlin', T.B);
  if (!/^In the city: Poland .*\(5 units\)/.test(T.Z)) fail('T Szczecin', T.Z);
  if (!/^In the city: nobody ?Nearby: .*\(5 units\)/.test(T.Hm)) fail('T Hamburg', T.Hm);
  if (!/^In the city: \? Unidentified/.test(T.Po)) fail('T Poznan', T.Po);
  if (!/^In the city: nobody ?Nearby: .*passed through the centre/.test(T.Dr)) fail('T Dresden', T.Dr);
  if (PHONE){ await look(ids.P.B); const q = await p.evaluate(pid => { const im = window.__im, c = im.nc.names().find(z => z.p === pid), m = document.getElementById('map').getBoundingClientRect(); return c && {x:m.left + (c.b[0] + c.b[2])/2, y:m.top + (c.b[1] + c.b[3])/2}; }, ids.P.B[0]);
    if (!q) fail('T Berlin name on screen', null); else { await p.touchscreen.tap(q.x, q.y); await p.waitForTimeout(900); const s = await p.evaluate(() => { const e = document.querySelector('#csheet .cs-in'); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; }); out.sheet = s;
      if (!s || !s.startsWith('In the city: 1st Infantry Division (5 units)')) fail('T phone city sheet', s); } }
  if (errors.length) fail('E errors', errors.slice(0, 5));
  console.log(JSON.stringify({fails, lines:out.lines, sheet:out.sheet, heart:out.heart}, null, 1)); console.log(fails.length ? 'FAIL' : 'PASS');
  await b.close(); process.exit(fails.length ? 1 : 0); })();
