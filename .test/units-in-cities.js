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
//      Up to hex 20 (mid zoom, the world view) its dot is just outside the ring (never inside it, never under the city's counter: see (M));
//      from there out its dot and counter keep the play-zoom gaps. Everywhere its dot and its counter's middle stay on its own country's land, never the sea
//      At play zoom its counter (when not stacked with another) stands by its own dot (within 16 px), never across the ring from it
//  (L) the same at coastal and border cities (Szczecin NW, Hamburg NW and N, Berlin N and E, Munich SE, Poznan S), 4 and 15 km out, at hex 12, 30,
//      60 and 240: the dot and the counter's middle (unless it joined the city's counter: see (M)) over its own country's land (tmGround, and the drawn border: provAt), never the sea; close in
//      (hex 240, where a province is large on screen) the dot in its own province
//  (N) the city's own name stays on its own spot over its own land while a force stands 4 km off its point (Berlin, Szczecin, Poznan; hex 30; at
//      hex 12, where the stacks may take it as on master, a name drawn is over its own land and never under the off-point force's counter)
//  (A) the empty map (no force anywhere), centres Berlin, Paris and Warsaw, hex 8, 12, 16, 20, 25 and 30: every city name master draws (its
//      point on screen) is drawn within 3 px of master's spot, with its naval anchor where master has one; none added, none dropped. Master's
//      places are in .test/fixtures/uc-names-master.json, captured from origin/master's page (440 x 956): to refresh it, build master's page and
//      run UC_NAMES_SAVE=1 UC_PAGE=<master>/.test/page.html node .test/units-in-cities.js. The markers give way to the names, never the reverse
//  (M) mid zoom (hex 12 and 20), a holder on the point and a second army of its side 4 km off it in 8 directions, at Berlin, Szczecin, Poznan, Munich
//      and Hamburg: the second army's counter stands in its own city's area: its middle nearer its own city's point than any other city's, or (where the
//      city has no room for a second counter: out at hex 12 its own ground is narrower than two counters) joined to the city's counter, its dot still
//      outside the ring; in at least 38 of the 40 cases at each zoom. And the other cities' names it would hide: master's names round it (fixtures/
//      uc-mid-master.json, captured as for (A) with UC_MID_SAVE=1) dropped at most 1 per view. Also at play zoom (hex 30): its own city's area in 38 of 40
//  (S) mid zoom, no holder: a lone army 2 to 15 km off Berlin's, Munich's or Poznan's point (N and E), hex 8, 12, 16 and 20: its dot at least the
//      ring's radius + 2 px from the point (never inside the marker), no ring
//  (B) Hamburg held at hex 12 (mid zoom, every city's name up): "Berlin" is drawn nearer Berlin's point than Hamburg's (a held ring never
//      reads as Berlin's)
//  (E) no console or page error
const pickNation = require('./pick-nation.js'); const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const W = +(process.argv[2] || 440), H = +(process.argv[3] || 956), DPR = +(process.argv[4] || 2), PHONE = W <= 820;
const MID_FIX = path.join(__dirname, 'fixtures', 'uc-mid-master.json'), MID_CITIES = ['Berlin', 'Szczecin', 'Poznań', 'Munich', 'Hamburg'], MID_HEX = [12, 20, 30], D8 = {N:[0, -1], NE:[1, -1], E:[1, 0], SE:[1, 1], S:[0, 1], SW:[-1, 1], W:[-1, 0], NW:[-1, -1]};
const NAMES_FIX = path.join(__dirname, 'fixtures', 'uc-names-master.json'), NAMES_AT = ['Berlin', 'Paris', 'Warsaw'], NAMES_HEX = [8, 12, 16, 20, 25, 30];
// (A) and (B): a game of its own (Germany, the clock paused at noon, every force removed; Math.random seeded so master and branch draw alike)
async function namesOpen(b, page){ const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: PHONE, hasTouch: PHONE }), p = await ctx.newPage(); p.errs = [];
  p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') p.errs.push(m.text()); });
  await p.addInitScript(() => { let s = 0x2f6b1d3; Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0)/4294967296; }; });
  await p.goto('file://' + page); await p.waitForTimeout(600);
  await p.click('[data-act="pickscn"][data-k="world64"]'); await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.waitForTimeout(800);
  if (await p.locator('[data-act="start"]').count()) await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 90000 }); await p.waitForTimeout(1000);
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im, S = im.S; S.speed = 0; im.SET.tipsOff = true; im.SET.saver = false; S.sunOff = 0;
    S.hour = (Math.floor(S.hour/24) + 1)*24 + 11; S.armies.length = 0; S.ncnt = {}; S.battles.length = 0; im.sel.prov = null; im.sel.army = null; try { visCache = null; } catch (e) {} im.redraw(); });
  return p; }
async function namesView(p, city, hp, dx = 0){ await p.evaluate(([city, hp, dx]) => { const im = window.__im, Q = im.G.P.find(q => q.cityName === city && !q.sea), r = document.getElementById('map').getBoundingClientRect(), v = im.view, s = hp/12;
    v.s = s; v.x = r.width/2 - (Q.x + dx)*s; v.y = r.height/2 - Q.y*s; im.redraw(); }, [city, hp, dx]);
  await p.waitForTimeout(400); for (let i = 0, ok = 0; i < 60 && ok < 3; i++){ await p.waitForTimeout(150); ok = await p.evaluate(() => { const im = window.__im; im.redraw(); return im.mapBusy ? !im.mapBusy() : true; }) ? ok + 1 : 0; } await p.waitForTimeout(300); }
// the city names drawn (by province; in: its point on screen, clear of the bars) and their naval anchors
const namesNow = p => p.evaluate(() => new Promise(res => { window.__im.redraw(); requestAnimationFrame(() => requestAnimationFrame(() => { const im = window.__im, G = im.G, r = document.getElementById('map').getBoundingClientRect(), nc = new Map(im.nc.hits().map(h => [h[4], h.slice(0, 4)]));
  res(im.nc.names().map(c => { const Q = G.P[c.p], x = Q.x*im.view.s + im.view.x, y = Q.y*im.view.s + im.view.y; return {p:c.p, t:Q.cityName || Q.name, b:c.b.map(v => +v.toFixed(1)), nc:nc.get(c.p) || null, in:x >= 20 && x <= r.width - 20 && y >= 120 && y <= r.height - 120 ? 1 : 0}; })); })); }));
async function namesAll(p){ const out = []; for (const at of NAMES_AT) for (const hp of NAMES_HEX){ await namesView(p, at, hp); out.push({at, hp, n:await namesNow(p)}); } return out; }
// (M): the scene (a holder and a second army 4 km off, of the city's holder's side; Poland's seen), then per zoom the names drawn and where the
// second army's counter stands (its own, or the city counter it joined)
const midView = async (p, city, hp) => { await p.evaluate(([city, hp]) => { const im = window.__im, Q = im.G.P.find(q => q.cityName === city && !q.sea), r = document.getElementById('map').getBoundingClientRect(), v = im.view, s = hp/12;
  v.s = s; v.x = r.width/2 - Q.x*s; v.y = r.height/2 - Q.y*s; im.redraw(); }, [city, hp]); await p.waitForTimeout(350); };   // (names and counters only: no wait for the city pictures)
async function midAll(p){ const out = [], KW = await p.evaluate(() => KM_W);
  for (const city of MID_CITIES) for (const [dn, dv] of Object.entries(D8)){ const l = Math.hypot(dv[0], dv[1]), off = [dv[0]/l*4*KW, dv[1]/l*4*KW];
    const I = await p.evaluate(([city, off]) => { const im = window.__im, S = im.S, G = im.G; S.armies.length = 0; S.ncnt = {}; S.battles.length = 0; const C = G.P.find(P => P.cityName === city && !P.sea), o = S.owner[C.id];
      const a = im.addArmy(o, C.id, {inf:4, tank:2}), b2 = im.addArmy(o, C.id, {inf:2}); b2.pos = [C.x + off[0], C.y + off[1]]; try { DEV.reveal = true; } catch (e) {} try { visCache = null; } catch (e) {} return {a:a.id, b:b2.id, p:C.id}; }, [city, off]);
    for (const hp of MID_HEX){ await midView(p, city, hp);
      const r = await p.evaluate(I => new Promise(res => { window.__uclOn = true; window.__im.redraw(); requestAnimationFrame(() => requestAnimationFrame(() => { try { const im = window.__im, G = im.G, L = window.__ucl || []; window.__uclOn = false;
        const TS = Q => [Q.x*im.view.s + im.view.x, Q.y*im.view.s + im.view.y], o = L.find(c => c.ids.includes(I.b)), j = L.find(c => c.hp != null && (c.ml || []).includes(I.b)); let bx = o ? o.bx : null, sat = false;
        for (const c of L) for (const q of c.sb || []) if (q.ids.includes(I.b)){ bx = q.b; sat = true; }
        if (j && o && !o.pv) bx = j.bx; const cs = []; for (const Q of G.P) if (Q.cityName && !Q.sea){ const q = TS(Q); if (q[0] > -60 && q[0] < innerWidth + 60 && q[1] > -60 && q[1] < innerHeight + 60) cs.push([Q.id, q[0], q[1]]); }
        const cx = bx ? (bx[0] + bx[2])/2 : null, cy = bx ? (bx[1] + bx[3])/2 : null, ds = bx ? cs.map(z => [z[0], Math.hypot(z[1] - cx, z[2] - cy)]).sort((x, y) => x[1] - y[1]) : [];
        res({joined:!!(j && o && !o.pv), sat, near:ds.length ? ds[0][0] : null, dOwn:bx ? +Math.hypot(TS(G.P[I.p])[0] - cx, TS(G.P[I.p])[1] - cy).toFixed(1) : null, dot:o ? [o.px, o.py] : null, pt:TS(G.P[I.p]), R:im.uc ? im.uc.ringR() : 0}); } catch (e) { res({exc:e.message}); } })); }), I);
      out.push({city, dn, hp, p:I.p, ...r, n:await namesNow(p)}); } }
  return out; }
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }), errors = [], fails = [], out = {};
  if (process.env.UC_MID_SAVE){ const p = await namesOpen(b, process.env.UC_PAGE || path.join(__dirname, 'page.html')), N = await midAll(p);
    fs.writeFileSync(MID_FIX, JSON.stringify({W, H, from:process.env.UC_PAGE || 'page.html', views:N.map(v => ({city:v.city, dn:v.dn, hp:v.hp, n:v.n.filter(l => l.in).map(l => l.p)}))})); console.log('saved', MID_FIX, N.length, p.errs.slice(0, 3)); await b.close(); return; }
  if (process.env.UC_NAMES_SAVE){ const p = await namesOpen(b, process.env.UC_PAGE || path.join(__dirname, 'page.html')), N = await namesAll(p);
    fs.writeFileSync(NAMES_FIX, JSON.stringify({W, H, from:process.env.UC_PAGE || 'page.html', views:N})); console.log('saved', NAMES_FIX, N.map(v => v.n.length).join(' '), p.errs.slice(0, 3)); await b.close(); return; }
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
          const bA = im.S.armies.find(a => a.id === I.b), rs = im.toScreen(bA.pos[0], bA.pos[1]), ob = sb || (o && o.bx);
          const jn = !o.pv && (h.ml || []).includes(I.b);   /* (mid zoom, no room by its dot in its city's area: its counter joined the city's, above the ring; its dot is its own) */
          res(h && o ? {pt, R:im.uc.ringR(), hd:[h.px, h.py], hb:h.bx, od:[o.px, o.py], ob, stk:!!sb, jn, tag:o.tag, real:rs, land:[im.uc.land(bA.at, o.px, o.py)].concat(jn ? [] : [im.uc.land(bA.at, (ob[0] + ob[2])/2, (ob[1] + ob[3])/2)])} : null); })); }), I);
        const k = `${side} ${km} km ${dn} hex ${hp}`; out.dirs++; if (!m){ fail('X counters missing', k); continue; }
        const hOn = Math.hypot(m.hd[0] - m.pt[0], m.hd[1] - m.pt[1]), oPt = Math.hypot(m.od[0] - m.pt[0], m.od[1] - m.pt[1]), oHb = pd([m.hb[0], m.hb[1], m.hb[2], Math.max(m.hb[3], m.pt[1] - m.R)], m.od[0], m.od[1]);
        const row = Math.min(m.ob[3], m.hb[3]) > Math.max(m.ob[1], m.hb[1]), g = gap(m.ob, m.hb), need = m.tag ? 6 : row ? 15 : 6;
        const atReal = Math.hypot(m.od[0] - m.real[0], m.od[1] - m.real[1]) < 0.5;
        if (hOn > 0.01 || (hp <= 20 ? oPt < m.R + 2.4 + 3 || oHb < 1 : (oPt < m.R + 9 || oHb < 8 || g < need - 0.6))) fail('X off the point, clearly outside', {k, hOn:+hOn.toFixed(2), oPt:+oPt.toFixed(1), atReal, dotToCityCounter:+oHb.toFixed(1), counterGap:+g.toFixed(1), need});
        if (m.land.some(z => !z.own)) fail('X off the point: dot and counter on its own land', {k, land:m.land});
        const dB = Math.hypot(Math.max(m.ob[0] - m.od[0], 0, m.od[0] - m.ob[2]), Math.max(m.ob[1] - m.od[1], 0, m.od[1] - m.ob[3]));   // (its counter by its own dot, never across the ring from it)
        if (hp > 20 && hp <= 60 && !m.stk && dB > 16) fail('X off the point: its counter beside its own dot', {k, dotToCounter:+dB.toFixed(1)}); } } }
  // (L) coastal and border cities: the force off the point is never drawn in the sea or across a border
  if (!process.env.UC_NO_DIRS){ out.land = 0; const KW = await p.evaluate(() => KM_W), D8 = {N:[0, -1], NE:[1, -1], E:[1, 0], SE:[1, 1], S:[0, 1], SW:[-1, 1], W:[-1, 0], NW:[-1, -1]};
    for (const [city, dn] of [['Szczecin', 'NW'], ['Hamburg', 'NW'], ['Hamburg', 'N'], ['Berlin', 'N'], ['Berlin', 'E'], ['Munich', 'SE'], ['Poznań', 'S']]) for (const km of [4, 15]){ const dv = D8[dn], l = Math.hypot(dv[0], dv[1]), off = [dv[0]/l*km*KW, dv[1]/l*km*KW];
      const I = await p.evaluate(([city, off]) => { const im = window.__im, S = im.S, G = im.G; S.armies.length = 0; S.ncnt = {}; S.battles.length = 0; const C = G.P.find(P => P.cityName === city && !P.sea), o = S.owner[C.id];
        const a = im.addArmy(o, C.id, {inf:4, tank:2}), b2 = im.addArmy(o, C.id, {inf:2}); b2.pos = [C.x + off[0], C.y + off[1]]; if (o !== 0){ const sc = im.addArmy(0, C.id, {spec:1}); sc.pos = [C.x + 3, C.y + 3]; }
        try { visCache = null; } catch (e) {} return {a:a.id, b:b2.id, p:C.id, x:C.x, y:C.y}; }, [city, off]);
      for (const hp of [12, 30, 60, 240]){ await p.evaluate(([x, y, hp]) => { const im = window.__im, r = document.getElementById('map').getBoundingClientRect(), v = im.view, s = hp/12; v.s = s; v.x = r.width/2 - x*s; v.y = r.height/2 - y*s; im.redraw(); }, [I.x, I.y, hp]); await p.waitForTimeout(hp >= 120 ? 1200 : 400);
        const m = await p.evaluate(I => new Promise(res => { window.__uclOn = true; window.__im.redraw(); requestAnimationFrame(() => requestAnimationFrame(() => { const im = window.__im, L = window.__ucl || []; window.__uclOn = false;
          const o = L.find(c => c.ids.includes(I.b)); let ob = o && o.bx; for (const c of L) for (const q of c.sb || []) if (q.ids.includes(I.b)) ob = q.b; const at = im.S.armies.find(a => a.id === I.b).at;
          const jn = o && !o.pv && L.some(c => c.hp != null && (c.ml || []).includes(I.b));   // (its counter joined the city's: only its dot is its own)
          res(o ? [im.uc.land(at, o.px, o.py)].concat(jn ? [] : [im.uc.land(at, (ob[0] + ob[2])/2, (ob[1] + ob[3])/2)]) : null); })); }), I);
        const k = `${city} ${km} km ${dn} hex ${hp}`; out.land++; if (!m){ fail('L counters missing', k); continue; } if (m.some(z => !z.own)) fail('L off the point: dot and counter on its own land', {k, land:m}); else if (hp >= 120 && m[0].g !== 'prov') fail('L close in: the dot in its own province', {k, land:m}); } } }
  // (N) the city's own name stays where it is (owner: "City names stay where they are"): a second force 4 km off a held point (Berlin E, SE and S,
  //     Szczecin S, SE and SW, Poznan S, SE and E) at hex 30 and 12: the city's name is drawn on its own spot below the point (within 3 px of
  //     where the label pass first puts it: heartNames), over its own country's land; the off-point force's counter never covers that name and
  //     at play zoom its dot is in no drawn name's box
  if (!process.env.UC_NO_NAMES){ out.names = 0;   // (UC_NO_NAMES=1 skips it; UC_NO_DIRS=1 does not)
    const KW = await p.evaluate(() => KM_W), D8 = {E:[1, 0], SE:[1, 1], S:[0, 1], SW:[-1, 1]};
    for (const [city, dirs] of [['Berlin', ['E', 'SE', 'S']], ['Szczecin', ['S', 'SE', 'SW']], ['Poznań', ['S', 'SE', 'E']]]) for (const dn of dirs){ const dv = D8[dn], l = Math.hypot(dv[0], dv[1]), off = [dv[0]/l*4*KW, dv[1]/l*4*KW];
      const I = await p.evaluate(([city, off]) => { const im = window.__im, S = im.S, G = im.G; S.armies.length = 0; S.ncnt = {}; S.battles.length = 0; const C = G.P.find(P => P.cityName === city && !P.sea), o = S.owner[C.id];
        const a = im.addArmy(o, C.id, {inf:4, tank:2}), b2 = im.addArmy(o, C.id, {inf:2}); b2.pos = [C.x + off[0], C.y + off[1]]; if (o !== 0){ const sc = im.addArmy(0, C.id, {spec:1}); sc.pos = [C.x + 3, C.y + 3]; }
        try { visCache = null; } catch (e) {} return {a:a.id, b:b2.id, p:C.id, x:C.x, y:C.y, n:C.cityName}; }, [city, off]);
      for (const hp of [30, 12]){ await p.evaluate(([x, y, hp]) => { const im = window.__im, r = document.getElementById('map').getBoundingClientRect(), v = im.view, s = hp/12; v.s = s; v.x = r.width/2 - x*s; v.y = r.height/2 - y*s; im.redraw(); }, [I.x, I.y, hp]); await p.waitForTimeout(400);
        const m = await p.evaluate(([I, hp]) => new Promise(res => { window.__uclOn = true; window.__dbgBoxes = {}; window.__im.redraw(); requestAnimationFrame(() => requestAnimationFrame(() => { const im = window.__im, S = im.S, G = im.G, L = window.__ucl || [], D = window.__dbgBoxes || {}; window.__uclOn = false; window.__dbgBoxes = null;
          const pt = im.toScreen(G.P[I.p].x, G.P[I.p].y), own = S.owner[I.p], labs = D.lab || [], lab = labs.find(q => q.t === I.n), e = im.uc.names(I.p, hp).own;
          const o = L.find(c => c.ids.includes(I.b)); let ob = o && o.bx; for (const c of L) for (const q of c.sb || []) if (q.ids.includes(I.b)) ob = q.b;
          let nb = 0, nt = 0; if (lab) for (let i = 0; i <= 8; i++) for (let j = 0; j <= 2; j++){ const q = im.provAt(lab.b[0] + (lab.b[2] - lab.b[0])*i/8, lab.b[1] + (lab.b[3] - lab.b[1])*j/2); nt++; if (q < 0 || G.P[q].sea || S.owner[q] !== own) nb++; }
          res({lab:lab && lab.b, exp:e && [e[0] + pt[0], e[1] + pt[1], e[2] + pt[0], e[3] + pt[1]], bad:nt ? nb/nt : 1, ob, dot:o && [o.px, o.py], dotIn:o ? labs.filter(q => o.px > q.b[0] - 1 && o.px < q.b[2] + 1 && o.py > q.b[1] - 1 && o.py < q.b[3] + 1).map(q => q.t) : []}); })); }), [I, hp]);
        const k = `${city} 4 km ${dn} hex ${hp}`; out.names++; if (hp < 20 && !m.lab) continue;   // (mid zoom: a name with no free spot is left out, as on master)
        if (!m.lab || !m.exp){ fail('N the city name is drawn', {k, m}); continue; }
        const dx = (m.lab[0] + m.lab[2] - m.exp[0] - m.exp[2])/2, dy = (m.lab[1] + m.lab[3] - m.exp[1] - m.exp[3])/2;
        if (Math.hypot(dx, dy) > 3 && hp > 20) fail('N the city name stays on its own spot', {k, dx:+dx.toFixed(1), dy:+dy.toFixed(1)});
        if (m.bad > 0.25) fail('N the city name over its own land', {k, bad:+m.bad.toFixed(2)});
        if (m.ob && m.lab[0] < m.ob[2] - 1 && m.lab[2] > m.ob[0] + 1 && m.lab[1] < m.ob[3] - 1 && m.lab[3] > m.ob[1] + 1) fail('N the off-point counter clear of the city name', {k, ob:m.ob, lab:m.lab});
        if (hp > 20 && m.dotIn.length) fail('N the off-point dot in no name', {k, dotIn:m.dotIn}); } } }
  // (M) mid zoom: a second army off a held point stands in its own city's area and hides no more than one other name a view; (S) a lone army's dot
  if (!process.env.UC_NO_MID){ const F = fs.existsSync(MID_FIX) ? JSON.parse(fs.readFileSync(MID_FIX)) : null, q = await namesOpen(b, path.join(__dirname, 'page.html')), V = await midAll(q); out.mid = {};
    for (const hp of MID_HEX){ const L = V.filter(v => v.hp === hp), own = L.filter(v => v.joined || v.near === v.p).length, R = {cases:L.length, ownArea:own, joined:L.filter(v => v.joined).length}; out.mid['hex ' + hp] = R;
      if (own < 38) fail('M the second army\'s counter in its own city\'s area (38 of 40)', {hp, ...R, other:L.filter(v => !(v.joined || v.near === v.p)).map(v => v.city + ' ' + v.dn)});
      for (const v of L){ const dd = v.dot ? Math.hypot(v.dot[0] - v.pt[0], v.dot[1] - v.pt[1]) : null; if (hp <= 20 && (dd == null || dd < v.R + 2)) fail('M its dot outside the ring', {k:`${v.city} ${v.dn} hex ${hp}`, dot:dd && +dd.toFixed(1), R:+v.R.toFixed(1)}); } }
    if (!F) fail('M master\'s names (fixtures/uc-mid-master.json)', 'missing'); else if (F.W !== W || F.H !== H) out.mid.names = 'skipped: master captured at ' + F.W + ' x ' + F.H;
    else { let mx = 0, tot = 0; for (let i = 0; i < F.views.length; i++){ const m = F.views[i], v = V[i], drawn = new Set(v.n.map(l => l.p)), dr = m.n.filter(p => p !== v.p && !drawn.has(p)); mx = Math.max(mx, dr.length); tot += dr.length;
        if (dr.length > 1) fail('M other names dropped against master: at most 1 a view', {k:`${m.city} ${m.dn} hex ${m.hp}`, dropped:dr.length}); } out.mid.names = {maxDroppedPerView:mx, total:tot}; }
    out.solo = 0; const KW = await q.evaluate(() => KM_W);
    for (const city of ['Berlin', 'Munich', 'Poznań']) for (const km of [2, 4, 8, 15]) for (const dn of ['N', 'E']){ const dv = D8[dn];
      const I = await q.evaluate(([city, off]) => { const im = window.__im, S = im.S, G = im.G; S.armies.length = 0; S.ncnt = {}; S.battles.length = 0; const C = G.P.find(P => P.cityName === city && !P.sea);
        const a = im.addArmy(S.owner[C.id], C.id, {tank:2}); a.pos = [C.x + off[0], C.y + off[1]]; try { DEV.reveal = true; } catch (e) {} try { visCache = null; } catch (e) {} return {a:a.id, p:C.id}; }, [city, [dv[0]*km*KW, dv[1]*km*KW]]);
      for (const hp of [8, 12, 16, 20]){ await midView(q, city, hp);
        const r = await q.evaluate(I => new Promise(res => { window.__uclOn = true; window.__im.redraw(); requestAnimationFrame(() => requestAnimationFrame(() => { const im = window.__im, P = im.G.P[I.p], L = window.__ucl || []; window.__uclOn = false;
          const c = L.find(c => c.ids.includes(I.a)), pt = [P.x*im.view.s + im.view.x, P.y*im.view.s + im.view.y], mk = im.uc.marks().find(m => m.p === I.p);
          res({d:c ? Math.hypot(c.px - pt[0], c.py - pt[1]) : null, R:im.uc.ringR(), ring:mk ? mk.sides.length : 0}); })); }), I);
        out.solo++; if (r.d == null || r.d < r.R + 2 || r.ring) fail('S a lone army off the point: its dot outside the marker, no ring', {k:`${city} ${km} km ${dn} hex ${hp}`, d:r.d && +r.d.toFixed(1), R:+r.R.toFixed(1), ring:r.ring}); } }
    errors.push(...q.errs); await q.context().close(); }
  // (A) the empty map: every city name master draws stays on master's spot (with its anchor), none added or dropped; (B) Hamburg held at hex 12
  if (!process.env.UC_NO_EMPTY){ const F = fs.existsSync(NAMES_FIX) ? JSON.parse(fs.readFileSync(NAMES_FIX)) : null, q = await namesOpen(b, path.join(__dirname, 'page.html')); out.empty = 0;
    if (!F) fail('A master\'s name places (fixtures/uc-names-master.json)', 'missing');
    else if (F.W !== W || F.H !== H) out.empty = 'skipped: master captured at ' + F.W + ' x ' + F.H;
    else { const B = await namesAll(q), cen = z => [(z[0] + z[2])/2, (z[1] + z[3])/2];
      for (let i = 0; i < F.views.length; i++){ const m = F.views[i], v = B[i], k = `${m.at} hex ${m.hp}`, bm = new Map(v.n.map(l => [l.p, l])), mm = new Map(m.n.map(l => [l.p, l]));
        for (const l of m.n){ if (!l.in) continue; out.empty++; const z = bm.get(l.p); if (!z){ fail('A a name master draws is drawn', {k, t:l.t}); continue; }
          const a = cen(l.b), c = cen(z.b), d = Math.hypot(a[0] - c[0], a[1] - c[1]); if (d > 3) fail('A a name stays on master\'s spot', {k, t:l.t, px:+d.toFixed(1)});
          if (!!l.nc !== !!z.nc || (l.nc && Math.hypot(l.nc[0] - z.nc[0], l.nc[1] - z.nc[1]) > 3)) fail('A the naval anchor as on master', {k, t:l.t, master:l.nc, now:z.nc}); }
        for (const l of v.n) if (l.in && !mm.has(l.p)) fail('A no name added', {k, t:l.t}); } }
    const r = await q.evaluate(() => { const im = window.__im, G = im.G, Hm = G.P.find(P => P.cityName === 'Hamburg' && !P.sea); im.addArmy(0, Hm.id, {inf:4, tank:2}); try { visCache = null; } catch (e) {} return Hm.id; });
    await namesView(q, 'Hamburg', 12, 0.3);
    const h = await q.evaluate(hm => new Promise(res => { window.__im.redraw(); requestAnimationFrame(() => requestAnimationFrame(() => { const im = window.__im, G = im.G, pt = P => [P.x*im.view.s + im.view.x, P.y*im.view.s + im.view.y], Bp = G.P.find(P => P.cityName === 'Berlin' && !P.sea);
      const gap = (b, x) => Math.hypot(Math.max(b[0] - x[0], 0, x[0] - b[2]), Math.max(b[1] - x[1], 0, x[1] - b[3])), nb = im.nc.names().find(c => c.p === Bp.id), ring = im.uc.marks().filter(m => m.p === hm && m.sides.length).length;
      res({ring, berlin:nb ? {own:+gap(nb.b, pt(Bp)).toFixed(1), hamburg:+gap(nb.b, pt(G.P[hm])).toFixed(1)} : null}); })); }), r);
    out.heldHamburg = h; if (!h.ring) fail('B Hamburg held: its ring', h);
    if (!h.berlin || !(h.berlin.own < h.berlin.hamburg)) fail('B Hamburg held: "Berlin" nearer Berlin\'s point than Hamburg\'s', h.berlin);
    errors.push(...q.errs); await q.context().close(); }
  if (errors.length) fail('E errors', errors.slice(0, 5));
  console.log(JSON.stringify({fails, lines:out.lines, sheet:out.sheet, heart:out.heart, close:out.close, dirs:out.dirs, land:out.land, mid:out.mid, solo:out.solo, names:out.names, empty:out.empty, heldHamburg:out.heldHamburg}, null, 1)); console.log(fails.length ? 'FAIL' : 'PASS');
  await b.close(); process.exit(fails.length ? 1 : 0); })();
