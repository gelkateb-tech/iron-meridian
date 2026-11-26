// Foreign army intel (owner's MAP-2 feedback, 2026-11-18; rules/vision.js armyKnown): a foreign force that is only spotted shows nothing but a
// '?' badge and 'Unidentified army'; recon (a UAV, a drone, Special Forces, SAM radar, a battle) identifies it; an ally's force is always known.
//   node .test/intel.js [W H]      (run tools/mkpage.sh first; prints JSON {checks, fails, errors} and exits 1 on any failure)
// rules   spotted by infantry: seen, not identified; Special Forces, a drone in flight, a UAV on station (and its 12 h after it leaves),
//         a battle with you, a SAM's radar under a wing: identified; an ally: always; armyView (what a host may tell a seat) has no nation,
//         size, types or name for an unidentified force; an old save without S.intel loads and plays
// ui      the game as Afghanistan (the nations world): the Pakistani force spotted at the border is one '?' plate (no flag, count, type, name or
//         3D models), its hover text, its panel (tap), the province's hover text and sheet, a route to it, Army Info and the diplomacy intel
//         tell nothing more than 'Unidentified army'; after a Recon UAV over it the badge, the models and the panel show its units
const pickNation = require('./pick-nation.js');
const { chromium } = require('playwright');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), PHONE = W <= 820;
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: PHONE });
  const p = await ctx.newPage(); const errors = [], checks = {}, fails = [];
  const ok = (k, c, v) => { checks[k] = v === undefined ? !!c : v; if (!c) fails.push(k + (v !== undefined ? ': ' + JSON.stringify(v) : '')); };
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.addInitScript(() => { let s = 0x2f6b1d3; Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0)/4294967296; }; });
  await p.goto('file://' + __dirname + '/page.html?start=nations'); await p.waitForTimeout(500);
  await pickNation(p, 'Afghanistan'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 });
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im; im.S.speed = 0; im.SET.tipsOff = true; });

  // ---- rules (the globals of rules/*.js) ----
  const R = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, me = 0, out = {}, rk = (a, b) => Math.min(a, b) + ',' + Math.max(a, b);
    const V = () => { visCache = null; return visibleSet(me); }, kn = a => armyKnown(a, V()), seen = a => armyVisible(a, V());
    // a foreign land province far from Afghanistan, and a foe in it
    const FOE = S.nations.findIndex(n => n.name === 'Brazil'), P = G.P.find(q => !q.sea && S.owner[q.id] === FOE && !q.city && q.nbs.some(v => !G.P[v].sea && S.owner[v] === FOE));
    const KEEP = S.armies.slice(), IDN = S.nextId, foe = addArmy(FOE, P.id, {tank:3, inf:2}), clean = () => { S.armies = S.armies.filter(a => a.owner !== me || a.id < 0); };
    S.armies = S.armies.filter(a => a.owner !== me); out.start = [seen(foe), kn(foe)];
    // spotted by infantry standing next to it: seen, not identified
    const inf = addArmy(me, P.id, {inf:3}); inf.pos = [P.x + 20*KM_W, P.y]; out.inf = [seen(foe), kn(foe)];
    const view0 = armyView(foe, V()); out.view = Object.keys(view0).sort().join(',');
    // Special Forces next to it: identified; a drone wing in flight over it: identified
    clean(); const sf = addArmy(me, P.id, {spec:2}); sf.pos = [P.x + 30*KM_W, P.y]; out.spec = [seen(foe), kn(foe)]; out.viewKnown = (v => [v.owner, v.n, Object.keys(v.u).sort().join(','), !!v.name])(armyView(foe, V()));
    clean(); const dr = addArmy(me, P.id, {sdrone:2}); dr.air = {base:P.id, cd:0}; dr.fly = {tgt:P.id, kind:'strike', ph:'out', t:0.99, hrs:0}; out.drone = [seen(foe), kn(foe)];
    // a manned jet in flight over it: spotted only
    clean(); const jt = addArmy(me, P.id, {jet:2}); jt.air = {base:P.id, cd:0}; jt.fly = {tgt:P.id, kind:'patrol', ph:'patrol', t:1, hrs:0}; out.jet = [seen(foe), kn(foe)];
    // a UAV on station: identified; the 12 h after it leaves (S.intel): still identified; after that: not
    clean(); const uv = addArmy(me, P.id, {drone:1}); uv.air = {base:P.id, cd:0}; uv.fly = {tgt:P.id, kind:'recon', ph:'over', t:0, hrs:12, h0:12};
    out.uav = [seen(foe), kn(foe)];
    // Wide-Area Sensors (master's upgrade follow-up): the UAV identifies 15% / 30% farther; a foe 290 km out (UAV I: 250 km) only with Sensors 2
    { const fp = foe.pos, T0 = S.nations[me].tech || (S.nations[me].tech = {}), s0 = T0.drone_sens; foe.pos = [P.x + 290*KM_W, P.y]; delete T0.drone_sens;
      out.uavFar = [uavOf(me).vis, seen(foe), kn(foe)]; T0.drone_sens = 2; out.uavFar2 = [uavOf(me).vis, seen(foe), kn(foe)];
      if (s0 === undefined) delete T0.drone_sens; else T0.drone_sens = s0; foe.pos = fp; }
    const L = uavOf(me); intelNote(me, visProvsAt(P.x, P.y, L.vis), S.hour + L.loiter + 12);
    clean(); const inf2 = addArmy(me, P.id, {inf:1}); inf2.pos = [P.x + 20*KM_W, P.y]; out.uavAfter = [seen(foe), kn(foe)];
    const h0 = S.hour; S.hour = h0 + L.loiter + 13; out.uavLater = [seen(foe), kn(foe)]; S.hour = h0;
    // a battle with you in its province: identified
    S.intel = {}; S.rel[rk(me, FOE)] = {st:'war', since:S.hour, until:null}; inf2.pos = null; S.battles.push(P.id); out.battle = [seen(foe), kn(foe)];
    S.battles.splice(S.battles.indexOf(P.id), 1); S.rel[rk(me, FOE)] = {st:'peace', since:S.hour, until:null};
    // a wing of theirs in flight over a province next to your Mobile SAM: identified (spotted without the SAM)
    clean(); const w = addArmy(FOE, P.id, {jet:2}); w.air = {base:P.id, cd:0}; w.fly = {tgt:P.id, kind:'patrol', ph:'patrol', t:1, hrs:0};
    const Q = G.P[P.nbs.find(v => !G.P[v].sea)], gi = addArmy(me, Q.id, {inf:2}); gi.pos = [P.x + 10*KM_W, P.y]; out.wingNoSam = [seen(w), kn(w)];
    clean(); const sm = addArmy(me, Q.id, {sam:1}); sm.pos = [P.x + 10*KM_W, P.y]; out.wingSam = [seen(w), kn(w)];
    // an ally's force: always identified, wherever it is
    clean(); S.armies = S.armies.filter(a => a !== w); S.rel[rk(me, FOE)] = {st:'ally', since:S.hour, until:null}; out.ally = [seen(foe), kn(foe)]; S.rel[rk(me, FOE)] = {st:'peace', since:S.hour, until:null};
    // the API
    out.api = typeof IM.api.armyKnown === 'function' && typeof IM.api.armyView === 'function';
    S.armies = KEEP; S.intel = {}; visCache = null; return out; });
  ok('rules.start (far away: not seen)', R.start[0] === false && R.start[1] === false, R.start);
  ok('rules.infantry spots only', R.inf[0] === true && R.inf[1] === false, R.inf);
  ok('rules.armyView unidentified: place only', R.view === 'air,at,fly,id,to,unk,x,y', R.view);
  ok('rules.special forces identify', R.spec[0] && R.spec[1], R.spec);
  ok('rules.armyView identified: nation, size, types, name', R.viewKnown[1] === 5 && R.viewKnown[2] === 'inf,tank' && R.viewKnown[3], R.viewKnown);
  ok('rules.drone in flight identifies', R.drone[0] && R.drone[1], R.drone);
  ok('rules.manned jet spots only', R.jet[0] === true && R.jet[1] === false, R.jet);
  ok('rules.UAV on station identifies', R.uav[0] && R.uav[1], R.uav);
  ok('rules.UAV sensors: 290 km out not seen without them', R.uavFar[0] === 250 && !R.uavFar[1] && !R.uavFar[2], R.uavFar);
  ok('rules.UAV sensors 2: 290 km out identified', R.uavFar2[0] === 325 && R.uavFar2[1] && R.uavFar2[2], R.uavFar2);
  ok('rules.UAV reveal lasts after it leaves', R.uavAfter[0] && R.uavAfter[1], R.uavAfter);
  ok('rules.UAV reveal ends (loiter + 12 h)', R.uavLater[0] === true && R.uavLater[1] === false, R.uavLater);
  ok('rules.battle identifies', R.battle[0] && R.battle[1], R.battle);
  ok('rules.wing without SAM: spotted only', R.wingNoSam[0] === true && R.wingNoSam[1] === false, R.wingNoSam);
  ok('rules.wing near a SAM: identified', R.wingSam[0] && R.wingSam[1], R.wingSam);
  ok('rules.ally always known', R.ally[0] && R.ally[1], R.ally);
  ok('rules.api', R.api);
  // an old save (no S.intel) loads and plays
  const OS = await p.evaluate(() => { const im = window.__im, d = JSON.parse(saveJSON()); delete d.intel; let e = null; try { im.restore(d); im.S.speed = 0; tick(); visCache = null; visibleSet(0); } catch (x) { e = String(x); } return {e, intel:im.S.intel === undefined || typeof im.S.intel === 'object'}; });
  ok('oldsave', !OS.e && OS.intel, OS);

  // ---- the page, as Afghanistan: the Pakistani force spotted at the border ----
  const off = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return [r.left, r.top]; });
  const F = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, pk = S.nations.findIndex(n => n.name === 'Pakistan'); visCache = null; const vis = visibleSet(0);
    let a = S.armies.find(x => x.owner === pk && !x.air && x.to === null && armyVisible(x, vis) && !armyKnown(x, vis));
    // (since the owner's fog rule of 2026-11-25 a force outside your land shows only once it is in your land or in your units' sight: a
    // Pakistani force is put in an empty Afghan province by the border, where it is spotted, not identified)
    if (!a){ const v = G.P.find(P => !P.sea && S.owner[P.id] === 0 && !P.city && P.nbs.some(q => S.owner[q] === pk) && !S.armies.some(o => o.at === P.id));
      const b = v && S.armies.find(x => x.owner === pk && !x.air && x.to === null && count(x)); if (!b) return null; atMove(b, v.id); b.pos = null; visCache = null;
      const v2 = visibleSet(0); a = armyVisible(b, v2) && !armyKnown(b, v2) ? b : null; if (!a) return null; }
    const P = G.P[a.at], v = im.view, R = document.getElementById('map').getBoundingClientRect(), sd = document.getElementById('side'), q = sd && sd.getBoundingClientRect(), mw = q && q.width && q.left > R.left + 100 ? q.left - R.left : R.width;
    v.s = 150/12; v.x = mw/2 - P.x*v.s; v.y = R.height/2 - P.y*v.s; im.redraw();
    const names = [...new Set(Object.values(UNITS).map(U => U.name)), 'Division', 'Brigade', 'Squadron', 'Pakistan', 'Pakistani'];
    return {id:a.id, at:a.at, n:count(a), names, pk}; });
  ok('ui.found a spotted Pakistani force', !!F, F);
  if (F){
    const bad = t => { t = t.replace(/Recon identifies it:[^\n]*/, ''); const hits = F.names.filter(n => t.includes(n)); if (new RegExp('\\b' + F.n + '\\s*(unit|×|x\\b)').test(t) || /×\d/.test(t) || /\d+ units?/.test(t)) hits.push('count'); return hits; };
    await p.waitForTimeout(2500);
    const D = await p.evaluate(F => { const im = window.__im, G = im.G, hs = im.hits.filter(h => h.ids.includes(F.id)), pr = (x, y) => { const c = worldToCell(x, y); return c >= 0 ? G.prov[c] : -1; };
      const models = im.TM.dbg.filter(e => pr(e.wx, e.wy) === F.at).length;
      return {hits:hs.map(h => ({unk:!!h.unk, ids:h.ids.length, x:h.x + h.w/2, y:h.y + h.h/2})), models}; }, F);
    ok('ui.map: one ? plate, no badge', D.hits.length === 1 && D.hits[0].unk && D.hits[0].ids === 1, D.hits);
    ok('ui.map: no 3D models in its province', D.models === 0, D.models);
    const H0 = D.hits[0];
    if (H0){
      if (!PHONE){ await p.mouse.move(off[0] + H0.x, off[1] + H0.y); await p.waitForTimeout(700);
        const tip = await p.evaluate(() => { const t = document.getElementById('tip'); return t && !t.hidden ? t.innerText : ''; });
        ok('ui.hover: Unidentified, nothing more', /Unidentified army/i.test(tip) && !bad(tip).length, {tip:tip.slice(0, 200), bad:bad(tip)}); }
      if (PHONE) await p.touchscreen.tap(off[0] + H0.x, off[1] + H0.y); else await p.mouse.click(off[0] + H0.x, off[1] + H0.y); await p.waitForTimeout(900);
      const pan = await p.evaluate(() => document.getElementById('ctx').innerText);
      ok('ui.tap: panel says only Unidentified army', /Unidentified army/.test(pan) && !bad(pan).length && !/Foreign force|Strength|STRENGTH/.test(pan), {pan:pan.slice(0, 240), bad:bad(pan)});
      const info = await p.evaluate(F => { const bt = document.createElement('button'); bt.dataset.act = 'army-info'; bt.dataset.id = F.id; document.getElementById('ctx').appendChild(bt); bt.click(); const m = document.getElementById('modal'); const t = m && !m.hidden ? m.innerText : ''; bt.remove(); return t; }, F);
      ok('ui.army info refused', !/Army Info/.test(info), info.slice(0, 120)); }
    // the province: hover text and sheet; a route of yours to it; the war warning's intel
    const PV = await p.evaluate(F => { const im = window.__im, S = im.S, G = im.G; im.selectProv(F.at); const sheet = document.getElementById('ctx').innerText;
      const mine = S.armies.find(a => a.owner === 0 && !a.air && count(a) > 0); im.selectArmy(mine.id); im.setTarget(mine.id, F.at); const route = document.getElementById('ctx').innerText;
      const intel = im.intel.have(F.pk); im.selectArmy(null); return {sheet, route, intel}; }, F);
    const gar = (PV.sheet.match(/Garrison\s*\n?([^\n]*)/) || [])[1] || '';
    ok('ui.province sheet: garrison unidentified', /Unidentified army/.test(gar) && !bad(gar).length, gar);
    ok('ui.route: no strength of it', /unidentified army/i.test(PV.route) && !/their effective/.test(PV.route), PV.route.slice(0, 300));
    ok('ui.diplomacy: no intel on Pakistan', PV.intel === false, PV.intel);
    // a Recon UAV over it: identified; the badge, the models and the panel show its units
    const K = await p.evaluate(F => { const im = window.__im, S = im.S, G = im.G, kb = G.P.find(q => q.cityName === 'Kabul').id; im.selectArmy(null);
      const w = im.addArmy(0, kb, {drone:1}); w.air = {base:kb, cd:0}; w.fly = {tgt:F.at, kind:'recon', ph:'over', t:0, hrs:12, h0:12, salvo:0}; visCache = null; im.redraw();
      return armyKnown(S.armies.find(a => a.id === F.id), visibleSet(0)); }, F);
    ok('ui.recon: identified', K === true, K);
    await p.waitForTimeout(2500);
    const D2 = await p.evaluate(F => { const im = window.__im, G = im.G, hs = im.hits.filter(h => h.ids.includes(F.id)), pr = (x, y) => { const c = worldToCell(x, y); return c >= 0 ? G.prov[c] : -1; };
      return {hits:hs.map(h => ({unk:!!h.unk, x:h.x + h.w/2, y:h.y + h.h/2})), models:im.TM.dbg.filter(e => pr(e.wx, e.wy) === F.at).length}; }, F);
    ok('ui.recon: its badge', D2.hits.length >= 1 && D2.hits.every(h => !h.unk), D2.hits);
    ok('ui.recon: its models', D2.models > 0, D2.models);
    if (D2.hits[0]){ if (PHONE) await p.touchscreen.tap(off[0] + D2.hits[0].x, off[1] + D2.hits[0].y); else await p.mouse.click(off[0] + D2.hits[0].x, off[1] + D2.hits[0].y); await p.waitForTimeout(900);
      const pan2 = await p.evaluate(() => document.getElementById('ctx').innerText);
      ok('ui.recon: panel shows nation and units', /Pakistan/.test(pan2) && new RegExp(F.n + ' units?').test(pan2), pan2.slice(0, 200)); }
  }
  ok('errors', !errors.length, errors.slice(0, 5));
  console.log(JSON.stringify({ checks, fails, errors: errors.slice(0, 5) }, null, 1));
  await b.close(); process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
