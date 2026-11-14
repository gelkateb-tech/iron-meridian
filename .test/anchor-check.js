// Objective measuring harness for army counters and the forces' pictures (unit display by zoom: zoomed out a square badge on each force's spot, zoomed in
// the force's pictures with the same badge pinned above them, cross-faded over one band of zoom; 'plates' below are the counters, the far badge or the
// pinned one, whichever leads at that zoom, keyed apart; 'models' are the pictures, or the 3D models standing in for types without one). Read-only: it drives the view through the game's own wheel
// handler and camGo, and reads the file:// hooks (__im.hits, __im.TM.dbg, window.__dbgBoxes); it never edits the game.
//   node .test/anchor-check.js [W H dpr]      (default 1440 900 1; runs with the Battery saver off, SAVER=on to try it on)
// prints JSON {metrics..., fails:[...]} and exits 1 when any check fails.
//
// THE PRINCIPLE: a counter's and a model's world position is a pure function of the game state, never of the zoom. Zoom may only change
// the drawn size and the visibility (in-place cross-fades). So, on EVERY frame of continuous zooms (wheel ticks every frame: fast and slow,
// in and out, through the whole range) and of a far camGo jump, keyed by army id with no grouping of any kind:
//  (1) ANCHOR       every visible (alpha > 0.2) plate's pin and model's foot stays on one world point (> 1 world px, or > 2 css px at
//                   the zoom it is drawn at, fails)
//  (P) CONTAINMENT  every plate pin and model foot inside its own province (or on its path while moving; parked air: its base)
//  (9) PLATES     two counters never cover each other: far badges measured by their own squares, pinned badges by their boxes
//  (G) GAP          the gap between a flag tag's bottom and the top of its group stays 4-16 css px at every zoom models show (the diamond
//                   stands on its group's middle and fades out as the pictures fade in: it is left out of (G) and of covering its own group)
//  (D) DEPTH        stacks with >= 3 unit classes show >= 3 distinct models at max zoom
//  (H) HUD          a plate or model under the HUD (rail, controls, minimap, side panel, dock) is faded to <= 30%
//  (T) TOGETHER     a group's models fade in together (equal alpha) and are big enough when they appear (soldier >= 15 css px tall,
//                   tank >= 27 css px long)
// plus the earlier checks: plates over plates / over the HQ, battle bar, ownership, overlap, battle gap, size, composition, jitter,
// departure (smooth and never on the garrison it leaves).
// Scene (seeded): Germany. Berlin: three German stacks + a British stack + a parked jet and helicopter; Wiesbaden (631): a battle, German
// vs French; a French stack at Karlsruhe (632); ships off Jutland (North Sea III, 3346); Munich: a garrison and a stack that departs;
// Sachsen-Anhalt (564): a lone mixed stack.
const pickNation = require('./pick-nation.js');   // (a start-screen card by its nation's name, on either world)
const { chromium } = require('playwright');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), DPR = +(process.argv[4] || 1), PHONE = W <= 820;
const HPMIN = 6, HPMAX = 240;
const LIM = { worldPx: 1, scrPx: 2, gap: [4, 16], tankLen: 75, solTall: 40, solMin: 15, tankMin: 27, depart: 3, battleGap: 8, jitter: 0.5, grow: 1,
  plateOv: 0.03, barGap: 2, groupOv: 0.12, coverOv: 0.10, hudA: 0.3, togetherA: 0.06, departOv: 0.25, ownTol: 10 };   // (ownTol: a model is misread only when another counter is clearly nearer: by more than ~a third of a plate)
const SQUAD = new Set(['sol', 'sat', 'ssf']);   // (the infantry squads: 3D soldiers, measured by their height)
const ALLOW = { inf: ['sol', 'hmv'], para: ['sol'], spec: ['ssf'], at: ['sat'], jam: ['hmv', 'truck'], ifv: ['ifv'], tank: ['tank'], art: ['art'], mlrs: ['mlrs'], sam: ['sam'],
  frig: ['frig'], sub: ['sub'], crui: ['crui'], carr: ['carr'], jet: ['jet'], bomb: ['bomb'], stealth: ['stealth'], mpa: ['mpa'], awacs: ['awacs'], int: ['int'], asf: ['asf'], heli: ['heli'],
  drone: ['drone'], sdrone: ['sdrone'], swarm: ['swarm'] };
const r2 = v => Math.round(v*100)/100, r1 = v => Math.round(v*10)/10;
const area = b => Math.max(0, b[2] - b[0])*Math.max(0, b[3] - b[1]);
const ov = (p, q) => Math.max(0, Math.min(p[2], q[2]) - Math.max(p[0], q[0]))*Math.max(0, Math.min(p[3], q[3]) - Math.max(p[1], q[1]));
const ctr = b => [(b[0] + b[2])/2, (b[1] + b[3])/2];
const med = v => v.slice().sort((a, b) => a - b)[v.length >> 1];

(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: PHONE, isMobile: false });
  const p = await ctx.newPage(); const errors = [], fails = [], M = { viewport: [W, H, DPR] };
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.addInitScript(() => { let s = 0x2f6b1d3; Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0)/4294967296; }; window.__dbgBoxes = {}; });
  // the Battery saver (on by default on a touch screen) caps the frame rate and drops the full-ratio overlay on a 3x screen: these per-frame
  // checks are made for the full overlay at every frame (like dpr 2, which never passed them), so they run with it off unless SAVER=on
  await p.addInitScript(on => { try { const k = 'iron-meridian-settings', o = JSON.parse(localStorage.getItem(k) || '{}'); o.saver = on; localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} }, process.env.SAVER === 'on');
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
  await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 });
  const sc = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); window.__dbgBoxes = window.__dbgBoxes || {};
    const im = window.__im, S = im.S, G = im.G, N = S.nations, by = n => G.P.find(P => P.cityName === n), out = {};
    const fr = N.findIndex(n => n.name === 'France'), uk = N.findIndex(n => n.name === 'United Kingdom');
    S.rel[Math.min(0, fr) + ',' + Math.max(0, fr)] = { st: 'war', since: S.hour, until: null };
    const ber = by('Berlin'), mun = by('Munich'), ham = by('Hamburg'), WI = 631, KA = 632, SEA = 3346;
    const A = im.addArmy(0, ber.id, { tank: 3, inf: 3, ifv: 2 }), B = im.addArmy(0, ber.id, { mlrs: 2, sam: 1, inf: 1 }), C = im.addArmy(0, ber.id, { art: 2, at: 2 });
    const U = im.addArmy(uk, ber.id, { inf: 2, tank: 1 });
    try { im.air.spawn(0, ber.id, 'jet'); im.air.spawn(0, ber.id, 'heli'); } catch (e) { out.airErr = e.message; }
    const gw = im.addArmy(0, WI, { inf: 3, tank: 1 }), fw = im.addArmy(fr, WI, { tank: 3, inf: 2 }), fk = im.addArmy(fr, KA, { inf: 2, sam: 1 });
    const sh = im.addArmy(0, SEA, { frig: 3, sub: 1, crui: 1 });
    const mg = S.armies.some(a => a.owner === 0 && a.at === mun.id && !a.air) ? null : im.addArmy(0, mun.id, { inf: 2 });   // Munich's garrison
    const mu = im.addArmy(0, mun.id, { tank: 4, art: 3, inf: 2 });
    const mx = im.addArmy(0, 564, { mlrs: 3, sam: 2, ifv: 2, inf: 1 });
    S.speed = 1; im.tick(); im.tick(); S.speed = 0;
    const mto = mun.nbs.find(q => !G.P[q].sea && S.owner[q] === 0) ?? mun.nbs[0];
    Object.assign(out, { ber: [ber.x, ber.y], mun: [mun.x, mun.y], wi: [G.P[WI].x, G.P[WI].y], ka: [G.P[KA].x, G.P[KA].y], sea: [G.P[SEA].x, G.P[SEA].y], ham: ham.id, mto, munId: mun.id,
      ids: { A: A.id, B: B.id, C: C.id, U: U.id, gw: gw.id, fw: fw.id, fk: fk.id, sh: sh.id, mu: mu.id, mx: mx.id, mg: mg && mg.id }, battles: S.battles.slice(), fr, uk,
      tank240: im.TM.scale('tank', 240)*9.8, sol240: im.TM.scale('sol', 240)*1.8 });
    const cvR = () => document.getElementById('map').getBoundingClientRect();
    let HUD = null, hudT = 0;
    const hud = () => { const t = performance.now(); if (HUD && t - hudT < 300) return HUD; hudT = t; const cr = cvR(), o = [];
      for (const s of ['.mapctl', '#modes', '#mini', '#tlegend', '#ilegend', '#side', '#dock', '#sheet', '#rail']){ const e = document.querySelector(s); if (!e || e.hidden || getComputedStyle(e).display === 'none' || getComputedStyle(e).visibility === 'hidden') continue;
        const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue; const q = [r.left - cr.left, r.top - cr.top, r.right - cr.left, r.bottom - cr.top, s];
        if (q[2] < 0 || q[3] < 0 || q[0] > cr.width || q[1] > cr.height) continue; o.push(q); }
      return (HUD = o); };
    const provW = (x, y) => { const v = im.rd ? { x: im.rd.vx, y: im.rd.vy, s: im.rd.vs } : im.view; return im.provAt(x*v.s + v.x, y*v.s + v.y); };
    // the provinces a force may stand in: standing, its own (parked air: its base); marching, also where it goes
    const allowed = ids => { const s = new Set(); for (const id of ids){ const a = S.armies.find(q => q.id === id); if (!a) continue; if (a.air){ s.add(a.air.base ?? a.at); continue; }
      s.add(a.at); if (a.to != null) s.add(a.to); for (const q of a.path) s.add(q); } return s; };
    const moving = ids => ids.some(id => { const a = S.armies.find(q => q.id === id); return a && (a.to !== null || a.path.length); });
    // (with the redraw scheduler, a frame the map was not drawn on (the Battery saver's 30 fps cap) has nothing new to measure: null; and what
    // is on screen belongs to the view of the last drawn frame, which a zoom step since may have moved on)
    window.__acCap = () => { if (im.rd){ if (im.rd.n === window.__acN) return null; window.__acN = im.rd.n; } const v = im.rd ? { x: im.rd.vx, y: im.rd.vy, s: im.rd.vs } : im.view, D = window.__dbgBoxes || {};
      const plates = im.hits.filter(h => !h.unk && h.w > 0).map(h => { const own = (h.own || h.ids).slice().sort((a, b) => a - b), wx = (h.cx - v.x)/v.s, wy = (h.cy - v.y)/v.s, al = allowed(own), pv = provW(wx, wy);
        return { k: own.join(',') + (h.tag ? 'T' : ''), ids: h.ids, own, r: [h.x, h.y, h.x + h.w, h.y + h.h], d: h.d, c: [h.cx, h.cy], w: [wx, wy], a: h.a == null ? 1 : h.a, mv: moving(own) ? 1 : 0, inP: al.has(pv) ? 1 : 0, pv, tag: h.tag ? 1 : 0 }; });
      const models = im.TM.dbg.map(q => { const a = S.armies.find(z => z.id === q.id), al = allowed(q.ids), pv = provW(q.wx, q.wy);
        return { k: q.id + ':' + q.t, id: q.id, ids: q.ids, t: q.t, at: a && a.at, cut: q.cut, x: q.x, y: q.y, w: [q.wx, q.wy], box: q.box, len: q.len, a: q.a, tiny: q.tiny, owner: q.owner, mv: q.moving, air: q.air, sea: q.sea, inP: al.has(pv) ? 1 : 0, pv }; });
      return { hp: v.s*12, v: [v.x, v.y, v.s], plates, models, hud: hud(), lab: (D.lab || []).map(l => l.b), pn: (D.pn || []).filter(q => q.b).map(q => q.b), mk: (D.mk || []).map(m => [m[0] - m[2], m[1] - m[2], m[0] + m[2], m[1] + m[2]]), hq: D.tb && (D.tba == null || D.tba > 0.5) ? D.tb : null, bbar: D.bbar || [] }; };
    window.__acUnits = ids => { const u = {}; for (const id of ids){ const a = S.armies.find(q => q.id === id); if (a) for (const t in a.u) if (a.u[t] > 0) u[t] = (u[t] || 0) + a.u[t]; } return u; };
    // a continuous zoom through the game's own wheel handler: one wheel tick every frame (dy css px of wheel delta) until hp1 is reached and
    // the glide has settled; captures the frame drawn before each tick
    window.__acWheel = (wx, wy, sx, sy, hp0, hp1, dy) => new Promise(res => { const v = im.view, s0 = hp0/12, cv = document.getElementById('map'), cr = cvR(); v.s = s0; v.x = sx - wx*s0; v.y = sy - wy*s0;
      const out = []; let n = 0, settle = 0; const inn = hp1 > hp0;
      const f = () => { if (n === 2){ const q = im.toScreen(wx, wy); sx = Math.max(20, Math.min(cr.width - 20, q[0])); sy = Math.max(20, Math.min(cr.height - 20, q[1])); }   // (far out the map clamps the view: zoom about where the focus really is)
        if (n++ > 2){ const c = window.__acCap(); if (c) out.push(c); }
        const hp = v.s*12, past = inn ? hp >= hp1*0.995 : hp <= hp1*1.005;
        if (!past && n > 2) cv.dispatchEvent(new WheelEvent('wheel', { deltaY: inn ? -Math.abs(dy) : Math.abs(dy), clientX: cr.left + sx, clientY: cr.top + sy, bubbles: true, cancelable: true }));
        else settle++;
        if (settle > 12 || n > 900) res(out); else requestAnimationFrame(f); };
      requestAnimationFrame(f); });
    // a far camGo jump: every frame of the flight
    window.__acJump = (x0, y0, hp0, x1, y1, hp1) => new Promise(res => { const v = im.view, s0 = hp0/12; v.s = s0; v.x = innerWidth/2 - x0*s0; v.y = innerHeight/2 - y0*s0; const out = []; let n = 0;
      const f = () => { n++; if (n === 8) im.camGo(x1, y1, hp1/12, { far: true }); if (n > 8){ const c = window.__acCap(); if (c) out.push(c); } if (n > 8 && !im.camFly && n > 70) res(out); else if (n > 400) res(out); else requestAnimationFrame(f); };
      requestAnimationFrame(f); });
    return out; });
  M.scene = { battles: sc.battles, airErr: sc.airErr || null }; if (!sc.battles.includes(631)) errors.push('no battle at Wiesbaden (631): ' + JSON.stringify(sc.battles));
  const raf = n => p.evaluate(n => new Promise(res => { let i = 0; const f = () => (++i >= n ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const setView = (wx, wy, hp, sx, sy) => p.evaluate(([wx, wy, hp, sx, sy]) => { const v = window.__im.view, s = hp/12; v.s = s; v.x = sx - wx*s; v.y = sy - wy*s; }, [wx, wy, hp, sx, sy]);
  const units = {}; const unitsOf = async ids => { const k = ids.slice().sort((a, b) => a - b).join(','); if (!units[k]) units[k] = await p.evaluate(ids => window.__acUnits(ids), ids); return units[k]; };
  const foci = [['berlin', sc.ber], ['wiesbaden', sc.wi], ['karlsruhe', sc.ka], ['jutland', sc.sea], ['munich', sc.mun]];
  for (const [, xy] of foci) for (const hp of [110, 240]){ await setView(xy[0], xy[1], hp, W/2, H/2); await p.waitForTimeout(700); }   // warm the model sheets

  // ---------------- continuous zooms: fast and slow wheel, in and out, through the whole range; then a far camGo jump
  const caps = []; const t0 = Date.now();
  const VIS = r => r[2] > 0 && r[0] < W && r[3] > 0 && r[1] < H;
  const QUICK = process.env.AC_QUICK;   // (a quick look while iterating: one focus, the fast sweeps)
  for (const [name, xy] of foci){ if (QUICK && name !== QUICK) continue; const sx = Math.round(W*(name === 'berlin' ? 0.5 : 0.45)), sy = Math.round(H*0.5);
    for (const [mode, dy] of QUICK ? [['fast', 70]] : [['fast', 70], ['slow', 9]]){
      for (const [dir, h0, h1] of [['in', HPMIN, HPMAX], ['out', HPMAX, HPMIN]]){
        if (mode === 'slow' && name !== 'berlin' && name !== 'wiesbaden' && dir === 'out') continue;   // (time: one slow sweep out is enough elsewhere)
        const fr = await p.evaluate(a => window.__acWheel(...a), [xy[0], xy[1], sx, sy, h0, h1, dy]);
        for (const c of fr){ c.focus = name; c.mode = mode + '-' + dir; caps.push(c); } } } }
  { const fr = await p.evaluate(a => window.__acJump(...a), [sc.sea[0], sc.sea[1], 30, sc.ber[0], sc.ber[1], 150]); for (const c of fr){ c.focus = 'berlin'; c.mode = 'camGo'; caps.push(c); }
    const fr2 = await p.evaluate(a => window.__acJump(...a), [sc.wi[0], sc.wi[1], 200, sc.ber[0], sc.ber[1], 220]); for (const c of fr2){ c.focus = 'berlin'; c.mode = 'camGo2'; caps.push(c); } }
  M.sweeps = {}; for (const c of caps){ const k = c.focus + ' ' + c.mode, E = M.sweeps[k] || (M.sweeps[k] = [Infinity, 0, 0]); E[0] = Math.min(E[0], r1(c.hp)); E[1] = Math.max(E[1], r1(c.hp)); E[2]++; }
  M.topModels = caps.filter(c => c.hp >= HPMAX*0.99).map(c => c.focus + ' ' + c.mode + ' ' + r1(c.hp) + ' ' + c.models.length).slice(0, 12);
  M.frames = caps.length; M.sweepSec = Math.round((Date.now() - t0)/1000);

  // (1) ANCHOR: per army key, every visible frame
  { const PL = new Map(), MO = new Map();
    const put = (Mp, k, w, sc0, s, c, a) => { let E = Mp.get(k); if (!E) Mp.set(k, E = []); E.push({ w, s, sc: sc0, hp: c.hp, mode: c.mode, a }); };
    for (const c of caps){ for (const q of c.plates) if (q.a > 0.2 && VIS(q.r) && !q.mv) put(PL, q.k, q.w, q.c, c.v[2], c, q.a);
      for (const m of c.models) if (m.a > 0.2 && !m.mv) put(MO, m.k, m.w, [m.x, m.y], c.v[2], c, m.a); }
    const judge = Mp => [...Mp].filter(([, L]) => L.length >= 3).map(([k, L]) => { const mx = med(L.map(q => q.w[0])), my = med(L.map(q => q.w[1]));
      let wd = 0, sd = 0, wq = null; for (const q of L){ const d = Math.hypot(q.w[0] - mx, q.w[1] - my); if (d > wd){ wd = d; } if (d*q.s > sd){ sd = d*q.s; wq = q; } }
      return { k, n: L.length, worldPx: r2(wd), cssPx: r1(sd), at: wq ? `${wq.mode}@${r1(wq.hp)}` : '' }; });
    const pj = judge(PL), mj = judge(MO), bad = q => q.worldPx > LIM.worldPx || q.cssPx > LIM.scrPx;
    M.anchor = { plates: pj.length, platesBad: pj.filter(bad).length, models: mj.length, modelsBad: mj.filter(bad).length,
      plateWorst: pj.sort((a, b) => b.cssPx - a.cssPx).slice(0, 6), modelWorst: mj.sort((a, b) => b.cssPx - a.cssPx).slice(0, 6) };
    if (M.anchor.platesBad) fails.push(`(1) ${M.anchor.platesBad}/${pj.length} plates move while zooming (worst ${pj[0].k}: ${pj[0].worldPx} world px, ${pj[0].cssPx} css px at ${pj[0].at})`);
    if (M.anchor.modelsBad) fails.push(`(1) ${M.anchor.modelsBad}/${mj.length} models move while zooming (worst ${mj[0].k}: ${mj[0].worldPx} world px, ${mj[0].cssPx} css px at ${mj[0].at})`);
    if (!pj.length || !mj.length) fails.push('(1) nothing measured: plates ' + pj.length + ' models ' + mj.length); }

  // (P) CONTAINMENT
  { let n = 0, bad = 0; const ex = new Map();
    for (const c of caps){ for (const q of c.plates){ if (q.a <= 0.2 || !VIS(q.r)) continue; n++; if (!q.inP){ bad++; if (!ex.has('p ' + q.k)) ex.set('p ' + q.k, `plate ${q.k} in prov ${q.pv} ${c.mode}@${r1(c.hp)}`); } }
      for (const m of c.models){ if (m.a <= 0.2) continue; n++; if (!m.inP){ bad++; if (!ex.has('m ' + m.k)) ex.set('m ' + m.k, `model ${m.k} (at ${m.at}) foot in prov ${m.pv} ${c.mode}@${r1(c.hp)}`); } } }
    M.containment = { samples: n, bad, keys: ex.size, examples: [...ex.values()].slice(0, 8) };
    if (bad) fails.push(`(P) ${bad}/${n} plate/model samples stand outside their own province (${ex.size} forces: ${[...ex.values()].slice(0, 3).join('; ')})`); }

  // (G) PLATE-TO-GROUP GAP, (T) TOGETHER and size floor at appearance
  { let n = 0, bad = 0, tn = 0, tbad = 0, small = 0; const ex = [], tex = [], sex = []; const gaps = [];
    for (const c of caps){ const grp = {}; for (const m of c.models) if (!m.air) (grp[m.id] = grp[m.id] || []).push(m);
      for (const [id, g] of Object.entries(grp)){ const al = g.map(m => m.a); tn++; if (Math.max(...al) - Math.min(...al) > LIM.togetherA){ tbad++; if (tex.length < 5) tex.push(`${c.mode}@${r1(c.hp)} ${id}: ${g.map(m => m.t + ' ' + r2(m.a)).join(', ')}`); }
        for (const m of g){ if (m.a <= 0.2) continue; const h = m.box[3] - m.box[1], L = m.len || Math.max(m.box[2] - m.box[0], h);   // (a picture: its drawn length)
          if ((SQUAD.has(m.t) && h < LIM.solMin) || (m.t === 'tank' && L < LIM.tankMin)){ small++; if (sex.length < 4) sex.push(`${c.mode}@${r1(c.hp)} ${m.k} ${r1(SQUAD.has(m.t) ? h : L)} px`); } }
        const vis0 = g.filter(m => m.a > 0.2); if (!vis0.length || g.some(m => m.mv || m.cut)) continue;   // (a group partly off screen draws only its pictures on screen: its top is not measured)
        const pl = c.plates.find(q => q.own.includes(+id) && q.a > 0.2 && q.tag); if (!pl || !VIS(pl.r)) continue;   // (the flag tag: the diamond stands on its pictures' middle and fades out as they fade in)
        const top = Math.min(...vis0.map(m => m.box[1])), gap = top - pl.r[3]; n++; gaps.push(gap);
        if (gap < LIM.gap[0] || gap > LIM.gap[1]){ bad++; if (ex.length < 6) ex.push(`${c.mode}@${r1(c.hp)} ${pl.k}: ${r1(gap)} px`); } } }
    M.gap = { samples: n, bad, min: gaps.length ? r1(Math.min(...gaps)) : null, max: gaps.length ? r1(Math.max(...gaps)) : null, examples: ex };
    M.together = { groups: tn, bad: tbad, examples: tex, tooSmall: small, smallExamples: sex };
    if (bad) fails.push(`(G) ${bad}/${n} plate-to-models gaps outside ${LIM.gap[0]}-${LIM.gap[1]} px (min ${M.gap.min}, max ${M.gap.max})`);
    if (!n) fails.push('(G) no plate-to-models gap measured');
    if (tbad) fails.push(`(T) ${tbad}/${tn} groups fade in model by model`);
    if (small) fails.push(`(T) ${small} model samples shown smaller than the floor (${sex.slice(0, 2).join('; ')})`); }

  // (H) HUD COVER
  { let n = 0, bad = 0; const ex = [];
    const chk = (box, a, what, c) => { for (const h of c.hud){ const f = ov(box, h)/Math.max(1, area(box)); if (f > 0.1){ n++; if (a > LIM.hudA){ bad++; if (ex.length < 6) ex.push(`${c.mode}@${r1(c.hp)} ${what} under ${h[4]} alpha ${r2(a)}`); } return; } } };
    for (const c of caps){ for (const q of c.plates) if (VIS(q.r)) chk(q.r, q.a, 'plate ' + q.k, c); for (const m of c.models) chk(m.box, m.a, 'model ' + m.k, c); }
    M.hud = { samples: n, bad, examples: ex };
    if (bad) fails.push(`(H) ${bad}/${n} plates/models under the HUD not faded (${ex.slice(0, 2).join('; ')})`); }

  // (9) PLATES OVER PLATES, (10) OVER YOUR HQ, (11) BATTLE BAR beside its counter
  { let pairs = 0, bad = 0, worst = 0, hqBad = 0, hqN = 0, barN = 0, barBad = 0; const ex = [], hqEx = [], barEx = [];
    for (const c of caps){ const pl = c.plates.filter(q => VIS(q.r) && !q.mv && q.a > 0.2);
      // (two far badges overlap by their own squares (not their boxes with the marks): the area they share as a share of the smaller square.
      // A badge pinned over its pictures by its box)
      const SQ = PHONE ? 36 : 32, dov = (p, q) => { const a = p.d || SQ, b = q.d || SQ, h = (a + b)/2, ox = Math.max(0, h - Math.abs(p.c[0] - q.c[0])), oy = Math.max(0, h - Math.abs(p.c[1] - q.c[1])); return Math.min(ox, a, b)*Math.min(oy, a, b)/Math.min(a, b)**2; };
      for (let i = 0; i < pl.length; i++) for (let j = i + 1; j < pl.length; j++){ pairs++; const f = !pl[i].tag && !pl[j].tag ? dov(pl[i], pl[j]) : ov(pl[i].r, pl[j].r)/Math.max(1, Math.min(area(pl[i].r), area(pl[j].r))); if (f > worst) worst = f;
        if (f > LIM.plateOv){ bad++; if (ex.length < 6) ex.push(`${c.mode}@${r1(c.hp)} ${pl[i].k} / ${pl[j].k} ${Math.round(f*100)}%`); } }
      if (c.hq) for (const q of pl){ hqN++; if (ov(q.r, c.hq) > 0){ hqBad++; if (hqEx.length < 6) hqEx.push(`${c.mode}@${r1(c.hp)} ${q.k}`); } }
      for (const B of c.bbar){ const bb = [B[0], B[1], B[0] + B[2], B[1] + B[3]]; let d = Infinity; for (const q of c.plates){ const g = Math.max(q.r[0] - bb[2], bb[0] - q.r[2], q.r[1] - bb[3], bb[1] - q.r[3], 0); d = Math.min(d, g); }
        barN++; if (d > LIM.barGap){ barBad++; if (barEx.length < 4) barEx.push(`${c.mode}@${r1(c.hp)} ${B[4]} ${r1(d)} px`); } } }
    M.plates = { pairs, bad, worstPct: Math.round(worst*100), examples: ex, hqSamples: hqN, hqBad, hqExamples: hqEx, battleBars: barN, barBad, barExamples: barEx };
    if (bad) fails.push(`(9) ${bad}/${pairs} visible plate pairs overlap > ${LIM.plateOv*100}% (${ex.slice(0, 2).join('; ')})`);
    if (hqBad) fails.push(`(10) ${hqBad}/${hqN} plate samples cover the HQ`);
    if (barBad) fails.push(`(11) ${barBad}/${barN} battle bars stand apart from every counter`); }

  // (2) OWNERSHIP, (3) OVERLAP, (7) BATTLE
  { let own = 0, ownBad = 0, grpPairs = 0, grpBad = 0, cov = 0, covBad = 0; const ownEx = [], grpEx = [], covEx = [], kinds = {}; const gaps = [];
    for (const c of caps){ const ms = c.models.filter(m => m.a > 0.2); if (!ms.length) continue; const plates = c.plates.filter(q => VIS(q.r) && q.a > 0.2);
      for (const m of ms){ const mc = ctr(m.box), mine = plates.find(q => q.own.includes(m.id));
        if (mine){ own++; const dOwn = Math.hypot(mc[0] - ctr(mine.r)[0], mc[1] - ctr(mine.r)[1]);
          const other = plates.filter(q => q !== mine && q.a >= 0.6).map(q => [q, Math.hypot(mc[0] - ctr(q.r)[0], mc[1] - ctr(q.r)[1])]).sort((a, b) => a[1] - b[1])[0];
          if (other && other[1] < dOwn - LIM.ownTol){ ownBad++; if (ownEx.length < 6) ownEx.push(`${c.mode}@${r1(c.hp)} ${m.k}: own ${r1(dOwn)} px, plate ${other[0].k} ${r1(other[1])} px`); } }
        const A = area(m.box); if (A < 1) continue; cov++; let worst = 0, what = '';
        const test = (bx, kind) => { const f = ov(m.box, bx)/A; if (f > worst){ worst = f; what = kind; } };
        for (const q of plates) if (q.tag || !q.own.includes(m.id)) test(q.r, q.own.includes(m.id) ? 'ownPlate' : 'plate'); if (!m.tiny) for (const b0 of c.lab.concat(c.pn)) test(b0, 'name');   // (a force in a province of two cells cannot stand clear of its own city's name, which is drawn over it) for (const b0 of c.mk) test(b0, 'marker'); if (c.hq) test(c.hq, 'hq');
        if (worst > LIM.coverOv){ covBad++; kinds[what] = (kinds[what] || 0) + 1; if (covEx.length < 8) covEx.push(`${c.mode}@${r1(c.hp)} ${m.k} ${what} ${Math.round(worst*100)}%`); } }
      const grp = {}; for (const m of ms) (grp[m.id] = grp[m.id] || []).push(m);
      for (const g of Object.values(grp)) for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++){ grpPairs++; const f = ov(g[i].box, g[j].box)/Math.max(1, Math.min(area(g[i].box), area(g[j].box)));
        if (f > LIM.groupOv){ grpBad++; if (grpEx.length < 8) grpEx.push(`${c.mode}@${r1(c.hp)} ${g[i].k}/${g[j].t} ${Math.round(f*100)}%`); } }
      for (const bp of sc.battles){ const sides = {}; for (const m of ms) if (m.at === bp && !m.air) (sides[m.owner] = sides[m.owner] || []).push(m);
        const os = Object.keys(sides); if (os.length < 2) continue; const u = g => [Math.min(...g.map(m => m.box[0])), Math.min(...g.map(m => m.box[1])), Math.max(...g.map(m => m.box[2])), Math.max(...g.map(m => m.box[3]))];
        for (let i = 0; i < os.length; i++) for (let j = i + 1; j < os.length; j++){ const a = u(sides[os[i]]), bb = u(sides[os[j]]); gaps.push([r1(c.hp), r1(Math.max(bb[0] - a[2], a[0] - bb[2], bb[1] - a[3], a[1] - bb[3])), bp]); } } }
    M.ownership = { checked: own, bad: ownBad, examples: ownEx };
    M.overlap = { pairs: grpPairs, groupBad: grpBad, groupExamples: grpEx, models: cov, coverBad: covBad, coverKinds: kinds, coverExamples: covEx };
    M.battle = { samples: gaps.length, minGap: gaps.length ? Math.min(...gaps.map(g => g[1])) : null, bad: gaps.filter(g => g[1] < LIM.battleGap).length };
    if (ownBad) fails.push(`(2) ${ownBad}/${own} model samples nearer another plate than their own`);
    if (!own) fails.push('(2) no model matched to its plate');
    if (grpBad) fails.push(`(3) ${grpBad}/${grpPairs} model pairs in a group overlap > ${LIM.groupOv*100}%`);
    if (covBad) fails.push(`(3) ${covBad}/${cov} model samples covered > ${LIM.coverOv*100}% by a plate/name/marker/HQ (${Object.entries(kinds).map(e => e.join(' ')).join(', ')})`);
    if (!gaps.length) fails.push('(7) battle: both sides never had models at once');
    else if (M.battle.bad) fails.push(`(7) battle sides closer than ${LIM.battleGap} px in ${M.battle.bad}/${gaps.length} frames (min gap ${M.battle.minGap})`); }

  // (4) SIZE at max zoom, never shrinking while zooming in
  { const top = caps.filter(c => c.hp >= HPMAX*0.99);
    const len = t => { const ms = top.flatMap(c => c.models.filter(m => m.t === t && m.a > 0.2)); return ms.length ? Math.max(...ms.map(m => t === 'sol' ? m.box[3] - m.box[1] : m.len || Math.max(m.box[2] - m.box[0], m.box[3] - m.box[1]))) : null; };
    const tank = len('tank'), sol = len('sol');
    M.size = { tankMaxZoomCssPx: tank && r1(tank), soldierMaxZoomCssPx: sol && r1(sol), nominal240: { tankLen: r1(sc.tank240), solTall: r1(sc.sol240) } };
    if (!PHONE && DPR === 1){ if (!(tank >= LIM.tankLen)) fails.push(`(4) tank at max zoom ${tank && r1(tank)} css px long < ${LIM.tankLen}`); if (!(sol >= LIM.solTall)) fails.push(`(4) soldier at max zoom ${sol && r1(sol)} css px tall < ${LIM.solTall}`); } }

  // (5) COMPOSITION and (D) DEPTH
  { let groups = 0, phantom = 0, missing = 0, deep = 0, shallow = 0; const ex = [], dex = [];
    for (const c of caps){ if (c.hp < 130) continue; const grp = {}; for (const m of c.models) if (m.a > 0.2) (grp[m.id] = grp[m.id] || []).push(m);
      for (const g of Object.values(grp)){ if (g.some(m => m.cut)) continue; groups++; const u = await unitsOf(g[0].ids), ts = Object.keys(u).filter(t => ALLOW[t]), have = new Set(g.map(m => m.t)), ok = new Set(ts.flatMap(t => ALLOW[t]));
        const ph = [...have].filter(t => !ok.has(t)); if (g.some(m => m.sea) && !ts.some(t => ['frig', 'sub', 'crui', 'carr'].includes(t))) ph.length = 0;
        const byN = ts.slice().sort((a, b) => u[b] - u[a]), need = []; if (byN.length){ const th = u[byN[Math.min(2, byN.length - 1)]], above = byN.filter(t => u[t] > th), tied = byN.filter(t => u[t] === th);
          for (const t of above) if (!ALLOW[t].some(m => have.has(m))) need.push(t);
          const want = Math.min(3 - above.length, tied.length), got = tied.filter(t => ALLOW[t].some(m => have.has(m))).length; if (got < want) need.push(tied.filter(t => !ALLOW[t].some(m => have.has(m))).join('|') + ` (${got}/${want} of tied)`); }
        if (ph.length) phantom++; if (need.length) missing++;
        if ((ph.length || need.length) && ex.length < 6){ const s = `${c.focus}@${r1(c.hp)} units ${JSON.stringify(u)} models ${[...have].join(',')}` + (ph.length ? ' phantom ' + ph.join(',') : '') + (need.length ? ' missing ' + need.join(',') : ''); if (!ex.includes(s)) ex.push(s); }
        if (c.hp >= HPMAX*0.99 && !g[0].air){ const cls = new Set(ts.map(t => ALLOW[t].join('/'))); if (cls.size >= 3){ deep++; if (have.size < 3){ shallow++; if (dex.length < 4) dex.push(`${c.focus} ${JSON.stringify(u)} shows ${[...have].join(',')}`); } } } } }
    M.composition = { groups, phantom, missingTop3: missing, examples: ex, deepStacks: deep, shallow, depthExamples: dex };
    if (phantom) fails.push(`(5) ${phantom}/${groups} group samples show a model type the stack does not have`);
    if (missing) fails.push(`(5) ${missing}/${groups} group samples (hexPx >= 130) miss one of the stack's top-3 unit types`);
    if (!deep) fails.push('(D) no stack with >= 3 classes seen at max zoom');
    if (shallow) fails.push(`(D) ${shallow}/${deep} stacks with >= 3 classes show fewer than 3 models at max zoom (${dex[0]})`); }

  if (QUICK){ M.fails = fails; M.errors = errors; console.log(JSON.stringify(M, null, 1)); await b.close(); process.exit(fails.length || errors.length ? 1 : 0); }
  // (8) JITTER: game running at 1x, fixed camera, 60 frames
  { await p.evaluate(() => { window.__im.S.speed = 1; window.__im.cfx.M.setReact(false); }); const out = {};   // (the forces' combat reactions, recoil and the hit shake, are meant to move them: held still here)
    for (const [nm, xy, hp] of [['berlin110', sc.ber, 110], ['berlin200', sc.ber, 200], ['wiesbaden160', sc.wi, 160], ['jutland130', sc.sea, 130]]){
      await setView(xy[0], xy[1], hp, W/2, H/2); await p.waitForTimeout(1500);
      const fr = await p.evaluate(() => new Promise(res => { const o = []; let n = 0; const f = () => { const c = window.__acCap(); if (c) o.push(c); if (++n < 60) requestAnimationFrame(f); else res(o); }; requestAnimationFrame(f); }));
      const st = {}; for (const c of fr){ for (const m of c.models) if (!m.mv && m.a > 0.2) (st['m ' + m.k] = st['m ' + m.k] || []).push([m.x, m.y, m.box[0], m.box[1]]);
        for (const q of c.plates) if (!q.mv && VIS(q.r) && q.a > 0.2) (st['p ' + q.k] = st['p ' + q.k] || []).push([q.r[0], q.r[1], q.r[2], q.r[3]]); }
      let worst = 0, wk = ''; for (const [k, L] of Object.entries(st)){ if (L.length < 30) continue; for (let j = 0; j < 4; j++){ const v = L.map(q => q[j]), d = Math.max(...v) - Math.min(...v); if (d > worst){ worst = d; wk = k; } } }
      out[nm] = { tracked: Object.keys(st).length, worstPx: r2(worst), worst: wk }; if (worst >= LIM.jitter) fails.push(`(8) jitter ${nm}: ${wk} moves ${r2(worst)} px over 60 frames`); }
    await p.evaluate(() => { window.__im.S.speed = 0; }); M.jitter = out; }

  // (6) DEPARTURE: the Munich stack leaves its garrison; a Berlin stack (not the lead) leaves for Hamburg. Fixed camera, 4x speed, per-frame
  // motion; the departing force never sits on the garrison it leaves (plates or model groups)
  { const out = {};
    for (const [nm, id, to, xy, hp] of [['berlin', sc.ids.B, sc.ham, sc.ber, 130], ['munich', sc.ids.mu, sc.mto, sc.mun, 130]]){
      await setView(xy[0], xy[1], hp, W/2, H/2); await p.waitForTimeout(1200);
      const gids = await p.evaluate(id => { const S = window.__im.S, a = S.armies.find(q => q.id === id); return S.armies.filter(q => q !== a && q.owner === a.owner && q.at === a.at && !q.air).map(q => q.id); }, id);
      const fr = await p.evaluate(([id, to]) => new Promise(res => { const im = window.__im, a = im.S.armies.find(q => q.id === id); im.orderMove(a, to); im.S.speed = 4; const o = []; let n = 0;
        const f = () => { const c = window.__acCap(), ref = {}; if (c) for (const m of c.models) if (ref[m.id] == null){ const L = im.S.armies.find(q => q.id === m.id); if (L){ const w = im.dispPos(L); ref[m.id] = im.toScreen(w[0], w[1]); } }
          if (c){ c.ref = ref; o.push(c); } if (++n < 240) requestAnimationFrame(f); else { im.S.speed = 0; res(o); } }; requestAnimationFrame(f); }), [id, to]);
      let worst = 0, wk = '', jumps = 0, moved = 0, onG = 0, onGm = 0; const ex = [], gex = [];
      const U = g => [Math.min(...g.map(m => m.box[0])), Math.min(...g.map(m => m.box[1])), Math.max(...g.map(m => m.box[2])), Math.max(...g.map(m => m.box[3]))];
      for (let i = 0; i < fr.length; i++){ const B = fr[i];
        const dp = B.plates.find(q => q.own.includes(id) && q.mv && q.a > 0.2), gp = B.plates.find(q => !q.mv && q.a > 0.2 && q.own.some(o => gids.includes(o)));
        if (dp && gp){ const f = ov(dp.r, gp.r)/Math.max(1, Math.min(area(dp.r), area(gp.r))); if (f > LIM.departOv){ onG++; if (gex.length < 4) gex.push(`plate f${i} ${Math.round(f*100)}% on ${gp.k}`); } }
        const dm = B.models.filter(m => m.id === id && m.a > 0.2), gm = gp ? B.models.filter(m => gp.own.includes(m.id) && m.a > 0.2) : [];
        if (dm.length && gm.length){ const a = U(dm), g = U(gm), f = ov(a, g)/Math.max(1, Math.min(area(a), area(g))); if (f > LIM.departOv){ onGm++; if (gex.length < 6) gex.push(`models f${i} ${Math.round(f*100)}%`); } }
        if (!i) continue; const A = fr[i - 1], prev = new Map(A.models.map(m => [m.k, m]));
        for (const m of B.models){ const q = prev.get(m.k); if (!q || !A.ref[m.id] || !B.ref[m.id]) continue;
          const d = Math.hypot((m.x - q.x) - (B.ref[m.id][0] - A.ref[m.id][0]), (m.y - q.y) - (B.ref[m.id][1] - A.ref[m.id][1]));
          if (m.mv) moved++; if (d > worst){ worst = d; wk = `${m.k} frame ${i}`; } if (d > LIM.depart){ jumps++; if (ex.length < 5) ex.push(`${m.k} f${i} ${r1(d)} px`); } } }
      out[nm] = { garrison: gids, frames: fr.length, movingModelSamples: moved, worstExcessPx: r2(worst), worst: wk, jumps, examples: ex, onGarrisonPlate: onG, onGarrisonModels: onGm, garrisonExamples: gex };
      if (jumps) fails.push(`(6) departure ${nm}: ${jumps} model jumps > ${LIM.depart} px beyond the army's motion (worst ${r2(worst)} px, ${wk})`);
      if (!moved) fails.push(`(6) departure ${nm}: no moving model seen`);
      if (onG || onGm) fails.push(`(6) departure ${nm}: the departing force sits on the garrison it leaves in ${onG} plate / ${onGm} model frames`); }
    M.departure = out; }

  M.fails = fails; M.errors = errors;
  console.log(JSON.stringify(M, null, 1));
  await b.close(); process.exit(fails.length || errors.length ? 1 : 0);
})();
