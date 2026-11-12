// Fog of war by km (the owner's vision ranges), checked in plain Node with no browser: node .test/vision.js
// 1. a city sees a force 70 km away but not 90 km; an airbase 100 km
// 2. a ground force sees 50 km, Special Forces 100 km; the province a force is moving to is seen whole
// 3. aircraft in flight 150 km, a fighter patrol 200 km; UAV I on station 250 km (UAV V 500 km)
// 4. AWACS orbit 500 km: location only ('?'), never identified; a stealth bomber is located only within 250 km
// 5. maritime patrol 400 km, sea only; a satellite's strip 150 km to each side of its track
// 6. no automatic neighbour provinces: a neighbouring province whose point is out of range is not in sight, and nothing in it is seen
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const NAMES = ['IM', 'UNITS', 'VIS_KM', 'KM_W', 'UAV_LV', 'addArmy', 'visibleSet', 'armyVisible', 'armyLocated', 'loLocated', 'worldToCell', 'count', 'satStrip', 'satPos', 'WORLD_W'];
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn {' + NAMES.join(', ') + ', get S(){ return S; }, get G(){ return G; }, clearVis(){ visCache = null; }};';
const errors = [], info = {}, ok = (c, msg, v) => { if (!c) errors.push(msg + (v !== undefined ? ' ' + JSON.stringify(v) : '')); };
const R = new Function(SRC)(); R.IM.api.newGame(4242, 0, []); R.S.started = true;
const {S, G, KM_W} = R, ME = 0;
ok(R.VIS_KM.city === 80 && R.VIS_KM.airbase === 100 && R.VIS_KM.aew === 500 && R.VIS_KM.mpa === 400 && R.VIS_KM.sat === 150, 'the place and mission ranges', R.VIS_KM);
ok(R.UNITS.inf.vis === 50 && R.UNITS.tank.vis === 50 && R.UNITS.frig.vis === 50 && R.UNITS.spec.vis === 100 && R.UNITS.jet.vis === 150 && R.UNITS.sdrone.vis === 200 && R.UNITS.swarm.vis === 200, 'per unit type ranges');
ok(R.UAV_LV.slice(1).map(l => l.vis).join() === '250,300,350,400,500', 'UAV levels I-V see 250-500 km', R.UAV_LV.slice(1).map(l => l.vis));
// a clean board: none of my forces, no cities of mine near the test area (the test area is foreign land far from my own)
S.armies = S.armies.filter(a => a.owner !== ME);
const provAt = (x, y) => { const c = R.worldToCell(x, y); return c >= 0 ? G.prov[c] : -1; };
const mineNear = (x, y, km) => G.P.some(P => S.owner[P.id] === ME && Math.hypot(P.x - x, P.y - y) < km*KM_W);
const foreign = p => p >= 0 && !G.P[p].sea && S.owner[p] !== ME, FOE = S.owner.find(o => o >= 0 && o !== ME);   // (any land not mine; the test forces are FOE's)
// a foreign land province point P0 and a direction in which the points at the given distances (km) all lie on foreign land, outside P0's province
function spot(dists, needCity){ for (const P of G.P){ if (!foreign(P.id) || (needCity && !P.city) || mineNear(P.x, P.y, 1500)) continue;
    for (let ang = 0; ang < 360; ang += 15){ const r = ang*Math.PI/180, pts = dists.map(d => [P.x + Math.cos(r)*d*KM_W, P.y + Math.sin(r)*d*KM_W]);
      if (pts.every(([x, y]) => foreign(provAt(x, y)) && provAt(x, y) !== P.id)) return {P, pts}; } } return null; }
const foeAt = ([x, y], u = {inf:3}) => { const p = provAt(x, y), a = R.addArmy(FOE, p, u); a.pos = [x, y]; return a; };
const drop = (...as) => { S.armies = S.armies.filter(a => !as.includes(a)); };
const view = () => { R.clearVis(); return R.visibleSet(ME); };
const seen = a => R.armyVisible(a, view());
// 1. a city (any level): 80 km; an airbase: 100 km
{ const T = spot([70, 90, 95], true); ok(!!T, 'found a foreign city to test with');
  if (T){ const {P, pts} = T, o0 = S.owner[P.id]; S.owner[P.id] = ME; const near = foeAt(pts[0]), far = foeAt(pts[1]);
    ok(seen(near), 'a city sees a force 70 km away'); ok(!seen(far), 'a city does not see a force 90 km away');
    const b0 = S.bld[P.id].air; S.bld[P.id].air = 1; const f95 = foeAt(pts[2]); ok(seen(f95) && seen(far), 'an airbase sees 95 km'); S.bld[P.id].air = b0; drop(near, far, f95); S.owner[P.id] = o0; } }
// 2. ground forces 50 km; Special Forces 100 km; the province a force is moving to
{ const T = spot([45, 60, 95]);
  if (T){ const {P, pts} = T, me = R.addArmy(ME, P.id, {inf:2}); me.pos = [P.x, P.y]; const a45 = foeAt(pts[0]), a60 = foeAt(pts[1]), a95 = foeAt(pts[2]);
    ok(seen(a45) && !seen(a60), 'a ground force sees 45 km, not 60 km', info.g = {a45:seen(a45), a60:seen(a60)});
    me.u.spec = 1; ok(seen(a60) && seen(a95), 'with Special Forces in it: 100 km'); me.u.spec = 0;
    const p60 = a60.at; me.to = p60; me.t = 0; me.path = []; me.pos = null; me.at = P.id; ok(seen(a60) && view().has(p60), 'the province it is moving to is seen whole');
    me.to = null; drop(me, a45, a60, a95); } }
// 3. aircraft: a strike wing in flight 150 km, a patrol 200 km; UAV I on station 250 km, UAV V 500 km
{ const T = spot([140, 170, 190, 240, 260, 480, 520]);
  if (T){ const {P, pts} = T, base = G.P.find(q => S.owner[q.id] === ME && q.city).id, fs0 = pts.map(q => foeAt(q));
    const w = R.addArmy(ME, base, {jet:2}); w.air = {base, cd:0}; w.fly = {tgt:P.id, kind:'strike', ph:'over', t:0, hrs:0};
    ok(seen(fs0[0]) && !seen(fs0[1]), 'a wing in flight sees 140 km, not 170 km');
    w.fly.ph = 'patrol'; w.fly.kind = 'patrol'; ok(seen(fs0[2]) && !seen(fs0[3]), 'a fighter patrol sees 190 km, not 240 km');
    drop(w); const u = R.addArmy(ME, base, {drone:1}); u.air = {base, cd:0}; u.fly = {tgt:P.id, kind:'recon', ph:'over', t:0, hrs:12, h0:12, salvo:0};
    ok(seen(fs0[3]) && !seen(fs0[4]), 'UAV I on station sees 240 km, not 260 km');
    for (const id of ['u_drone', 'drone_g2', 'drone_g3', 'drone_g4', 'drone_g5']) S.nations[ME].tech[id] = 1;
    ok(seen(fs0[5]) && !seen(fs0[6]), 'UAV V sees 480 km, not 520 km'); for (const id of ['drone_g2', 'drone_g3', 'drone_g4', 'drone_g5']) delete S.nations[ME].tech[id];
    drop(u);
    // 4. AWACS: location only within 500 km; a stealth bomber located within 250 km only
    const aw = R.addArmy(ME, base, {awacs:1}); aw.air = {base, cd:0}; aw.fly = {tgt:P.id, kind:'orbit', ph:'over', t:0, hrs:16}; const v = view();
    ok(!R.armyVisible(fs0[5], v) && R.armyLocated(fs0[5], v), 'AWACS: a force 480 km away is a location-only contact');
    ok(!R.armyVisible(fs0[6], v) && !R.armyLocated(fs0[6], v), 'AWACS: nothing at 520 km');
    ok(!R.armyVisible(fs0[0], v) && R.armyLocated(fs0[0], v), 'AWACS never identifies, even close (140 km)');
    ok(R.loLocated(ME, provAt(...pts[3]), ...pts[3]) && !R.loLocated(ME, provAt(...pts[4]), ...pts[4]), 'a stealth bomber 240 km from the orbit is located, at 260 km not');
    drop(aw, ...fs0); } }
// 5. maritime patrol 400 km, sea only; a satellite strip 150 km to each side
{ let T = null; for (const P of G.P){ if (!P.sea || mineNear(P.x, P.y, 1500)) continue;
    for (let ang = 0; ang < 360 && !T; ang += 15){ const r = ang*Math.PI/180, pt = d => [P.x + Math.cos(r)*d*KM_W, P.y + Math.sin(r)*d*KM_W], q = [pt(380), pt(420)];
      if (q.every(([x, y]) => provAt(x, y) >= 0 && G.P[provAt(x, y)].sea && provAt(x, y) !== P.id)) T = {P, q}; } if (T) break; }
  ok(!!T, 'found open sea to test with');
  if (T){ const {P, q} = T, base = G.P.find(x => S.owner[x.id] === ME && x.city).id, E = S.owner.find(o => o >= 0 && o !== ME);
    const s1 = R.addArmy(E, provAt(...q[0]), {sub:2}), s2 = R.addArmy(E, provAt(...q[1]), {frig:2}); s1.pos = q[0]; s2.pos = q[1];
    const m = R.addArmy(ME, base, {mpa:1}); m.air = {base, cd:0}; m.fly = {tgt:P.id, kind:'hunt', ph:'over', t:0, hrs:12};
    ok(seen(s1), 'maritime patrol: a submerged submarine 380 km away is found'); ok(!seen(s2), 'maritime patrol: not a frigate 420 km away'); drop(m, s1, s2); }
  let done = false; for (let ph = 0; ph < 1 && !done; ph += 0.01){ const st = {id:999, owner:ME, ph, amp:0.2, k:1, h0:S.hour}; S.sats = [st]; const [x1, y1, x2, y2, r] = R.satStrip(st);
    if (!ph) ok(Math.abs(r/KM_W - 150) < 1e-6, 'satellite strip: 150 km to each side', r/KM_W);
    const mx = (x1 + x2)/2, my = (y1 + y2)/2, L = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1)/L, ny = (x2 - x1)/L, at = d => [mx + nx*d*KM_W, my + ny*d*KM_W];
    if (!foreign(provAt(...at(140))) || !foreign(provAt(...at(165))) || mineNear(mx, my, 1000)) continue; done = true;
    const a = foeAt(at(140)), b = foeAt(at(165)); ok(seen(a) && !seen(b), 'satellite: sees 140 km off its track, not 165 km'); drop(a, b); }
  ok(done, 'found land under a satellite strip'); S.sats = []; }
// 6. no automatic neighbour provinces
{ let T = null; for (const P of G.P){ if (!foreign(P.id) || mineNear(P.x, P.y, 1500)) continue; const nb = P.nbs.find(q => foreign(q) && Math.hypot(G.P[q].x - P.x, G.P[q].y - P.y) > 60*KM_W); if (nb != null){ T = {P, nb}; break; } }
  ok(!!T, 'found a province with a neighbour more than 60 km away');
  if (T){ const me = R.addArmy(ME, T.P.id, {inf:2, tank:2}); me.pos = [T.P.x, T.P.y]; const Q = G.P[T.nb], f = R.addArmy(FOE, T.nb, {inf:2});
    const v = view(); ok(v.has(T.P.id), 'a force sees the province it stands in'); ok(!v.has(T.nb), 'its neighbour (point farther than 50 km) is not in sight');
    ok(!R.armyVisible(f, v), 'a force in the neighbouring province, farther than 50 km, is not seen', Math.round(Math.hypot(Q.x - T.P.x, Q.y - T.P.y)/KM_W));
    drop(me, f); } }
// own land: everything inside it
{ const p = G.P.find(P => S.owner[P.id] === ME && !P.city && !S.bld[P.id].air), E = S.owner.find(o => o >= 0 && o !== ME), f = R.addArmy(E, p.id, {inf:1}); ok(seen(f), 'a foreign force on my land is seen'); drop(f); }
console.log(JSON.stringify({info, errors}, null, 1));
process.exit(errors.length ? 1 : 0);
