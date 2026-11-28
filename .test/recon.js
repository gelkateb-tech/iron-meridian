// The Recon Vehicle (rcn; owner playtest 2026-11-27 items 3 and 4, docs/RECON-VEHICLE-PROPOSAL.md, sight option A), in plain Node (the rules only):
//   node .test/recon.js [quick]   (exit 0 when every check holds; quick leaves out the 20-day computer game of check 9)
// 1. the unit: the proposal's numbers (price, health, attack, defence, speed 8, soft, sight 70, Army Base I, known from day one), its research line
//    (Firepower and Protection 1-3, Mast-Mounted Sensors, Uprated Powerpack, Signature Reduction, Recon Vehicle II), R_STEPS +10
// 2. identification: an enemy army inside 70 km of a recon vehicle is identified (types and counts, armyView), one outside it is not seen; with
//    Mast-Mounted Sensors inside 80 km; the same for the owner's allies, and for a nation whose ally owns the recon vehicle
// 3. ordinary ground units only spot: infantry (and tanks) see 50 km and show '?' (unk); a stack of infantry with a recon vehicle identifies
// 4. Special Forces still identify, at 100 km (150 with Night Optics)
// 5. sight never past 80 km: the recon vehicle with every step of its line (and any mix with ordinary units) sees and identifies at most 80 km,
//    the artillery's reach (RANGE_KM.art)
// 6. Signature Reduction: a force of recon vehicles alone of a nation that has it is spotted by enemy ground forces only within half their sight
// 7. speed: wheels (MOVE_T), x1.6 on roads: on a road the recon vehicle takes 7/8 of an IFV's time (same wheels, speed 8 against 7) and well under
//    half of infantry's; a stack of 2 infantry and a recon vehicle marches at infantry pace
// 8. capture: a recon vehicle alone at a province's heart does not take it ("it scouts, it doesn't hold"); with infantry it does
// 9. old saves: a save of master before the Recon Vehicle (.test/fixtures/rcn-oldsave.json, from .test/rcn-oldsave-make.js) loads with every
//    force as saved and no recon vehicle anywhere, plays a day; the computer: in a 20-day all-computer game it builds a few (at most 6 a
//    nation), keeps them in stacks (no lone recon vehicle sent at foreign land, few left alone) and still holds its capitals
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..')), QUICK = process.argv.includes('quick');
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n')
  + '\nreturn {IM, UNITS, RN, RNODES_U, R_STEPS, START_ARMY, VIS_KM, RANGE_KM, KM_W, BASE_LV, MOVE_T, POWERS:() => POWERS, addArmy, count, capN, scoutOnly, armyVisKm, rSightF, moveType, legHours, linkOf, roadLv, railLv,'
  + ' provOfPt, rGrant, unitStrength, rel, clearVis:() => { visCache = null; }, get S(){ return S; }, get G(){ return G; }};';
const load = () => new Function(SRC)();
let bad = 0, n = 0; const ok = (c, msg, info) => { n++; if (!c){ bad++; console.log('FAIL  ' + msg + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 400) : '')); } else console.log('PASS  ' + msg); };
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;
const units = a => Object.fromEntries(Object.entries(a.u).filter(([, v]) => v > 0));

// a nations-world game with Russia the seat (nation 0); the world emptied of forces, so each check sets its own scene
function game(){ const R = load(), api = R.IM.api; api.useScenario('world64'); const ru = R.POWERS().findIndex(p => p.name === 'Russia');
  api.newGame(12345, ru, [0]); const S = R.S; S.started = true; return R; }
const nat = (R, name) => R.S.nations.find(N => N.name === name).id;

// ---- 1. the unit and its research line
{ const R = game(), U = R.UNITS.rcn;
  ok(!!U && U.name === 'Recon Vehicle' && U.cls === 'soft', 'the Recon Vehicle exists (rcn), class soft', U && {name:U.name, cls:U.cls});
  const want = {cost:30, oil:2, metal:3, iron:2, elec:3, rare:0, mp:6, atk:2, def:2, hp:7, spd:8, build:30, upk:1.5, fuel:0.3, vis:70};
  const goods = new Set(['oil', 'metal', 'iron', 'elec', 'rare', 'fuel']), val = k => goods.has(k) ? U[k]/1000 : U[k];   // (goods at the resource scale RES_K)
  ok(Object.keys(want).every(k => near(val(k), want[k])), 'its numbers are the proposal\'s (section 1: $30M, 2 oil, 3 mat, 2 iron, 3 elec, 6k, 7/2/2, speed 8, 30 h, upkeep 1.5, fuel 0.3, sight 70)', Object.fromEntries(Object.keys(want).map(k => [k, val(k)])));
  ok(R.BASE_LV.fac.rcn === 1 && U.req.b === 'fac' && U.req.l === 1 && U.tech === null, 'Army Base I, known from day one (no research needed)', {req:U.req, tech:U.tech});
  ok(R.MOVE_T.rcn === 'wheel', 'it moves on wheels (MOVE_T)');
  const L = (R.RNODES_U.rcn || []).map(nd => `${nd.id}:${nd.lv.map(l => l.day).join('/')}`).join(' ');
  ok(L === 'u_rcn:1 rcn_fp:3/10/16 rcn_pr:4/11/17 rcn_optics:4 rcn_spd:7 rcn_camo:10 rcn_g2:13', 'the research line: Firepower 3/10/16, Protection 4/11/17, Sensors 4, Powerpack 7, Signature Reduction 10, Recon Vehicle II 13', L);
  ok(R.RN.u_rcn.std && R.RN.u_rcn.fam === 'ifv' && R.RN.u_rcn.cat === 'arm', 'known from the start, in Armoured Forces, a family line from the IFV');
  ok(R.R_STEPS === 299, 'the tree has 10 more research steps (289 to 299)', R.R_STEPS);
  const s = R.unitStrength(0, 'rcn', {u_rcn:1}), s2 = R.unitStrength(0, 'rcn', {u_rcn:1, rcn_optics:1, rcn_spd:1, rcn_g2:1});
  ok(s.vis === 70 && s2.vis === 80 && s2.hp === 9 && s.rows.find(r => r.k === 'inf').atk === 2 && s.rows.find(r => r.k === 'armor').atk === 1, 'Army Info: sight 70 (80 with Sensors), health 7 (9 with Recon Vehicle II), attack 2 on infantry, 1 on armour', {vis:[s.vis, s2.vis], hp:s2.hp, rows:s.rows.slice(0, 2)});
  ok(R.START_ARMY.recon && R.START_ARMY.recon.rcn === 1, 'every outer starting stack holds one (START_ARMY.recon {rcn:1}; .test/start-armies.js checks the stacks)'); }

// ---- the scene for 2 to 6: a spot in Kazakhstan, enemy armies due east (or the first direction that stays on foreign land) at set distances
function scene(R){ const S = R.S, G = R.G, me = 0, kz = nat(R, 'Kazakhstan'), by = nat(R, 'Belarus'), C = G.P[S.nations[kz].capital];
  S.armies.length = 0; S.reveal = {}; S.intel = {}; S.sats = [];
  const DIST = [20, 40, 65, 75, 90, 120], at = (x, y) => R.provOfPt(x, y);
  let dir = null; for (let k = 0; k < 16 && !dir; k++){ const t = k*Math.PI/8, d = [Math.cos(t), Math.sin(t)];
    if ([0, ...DIST, 160].every(km => { const p = at(C.x + d[0]*km*R.KM_W, C.y + d[1]*km*R.KM_W); return p >= 0 && !G.P[p].sea && S.owner[p] !== me && S.owner[p] !== by; })) dir = d; }
  if (!dir) throw new Error('no direction from Astana stays on foreign land');
  const pt = km => [C.x + dir[0]*km*R.KM_W, C.y + dir[1]*km*R.KM_W];
  const put = (o, km, u) => { const [x, y] = pt(km), a = R.addArmy(o, at(x, y), u); a.pos = [x, y]; R.clearVis(); return a; };
  const foes = {}; for (const km of DIST) foes[km] = put(kz, km, {inf:3, tank:1});
  return {me, kz, by, pt, put, foes}; }
const look = (R, n, a) => { R.clearVis(); const v = R.IM.api.armyView(a, R.IM.api.visibleSet(n)); return v === null ? 'none' : v.unk ? '?' : JSON.stringify(v.u); };
const ID = JSON.stringify({inf:3, tank:1});
const sees = (R, n, sc) => Object.fromEntries(Object.entries(sc.foes).map(([km, a]) => [km, look(R, n, a)]));

// ---- 2. identification inside 70 km (80 with Sensors), for the owner and its allies
{ const R = game(), S = R.S, sc = scene(R), rc = sc.put(sc.me, 0, {rcn:1});
  let v = sees(R, sc.me, sc);
  ok(v[20] === ID && v[40] === ID && v[65] === ID, 'a recon vehicle identifies the enemy armies 20, 40 and 65 km away: types and counts (3 infantry, 1 tank)', v);
  ok(v[75] === 'none' && v[90] === 'none', 'and does not see the ones 75 and 90 km away (outside its 70 km)', v);
  ok(near(R.armyVisKm(rc), 70), 'its sight is 70 km', R.armyVisKm(rc));
  R.rGrant(S.nations[sc.me], 'rcn_optics', 1); S.nations[sc.me].tv = (S.nations[sc.me].tv || 0) + 1; v = sees(R, sc.me, sc);
  ok(near(R.armyVisKm(rc), 80) && v[75] === ID && v[90] === 'none', 'with Mast-Mounted Sensors: 80 km, the army 75 km away identified, the one 90 km away still unseen', {km:R.armyVisKm(rc), v});
  delete S.nations[sc.me].tech.rcn_optics; S.nations[sc.me].tv++;
  // allies: Belarus allied to Russia sees what Russia's recon vehicle identifies, and Russia what a Belarusian one does
  R.rel(sc.me, sc.by).st = 'ally'; const va = sees(R, sc.by, sc);
  ok(va[40] === ID && va[65] === ID && va[75] === 'none', 'an ally (Belarus) sees the same armies identified', va);
  rc.owner = sc.by; R.clearVis(); v = sees(R, sc.me, sc);
  ok(v[40] === ID && v[65] === ID && v[75] === 'none', 'and a recon vehicle of the ally identifies them for Russia', v); }

// ---- 3. ordinary ground units only spot ('?'); with a recon vehicle in the stack they identify
{ const R = game(), sc = scene(R), f = sc.put(sc.me, 0, {inf:2}); let v = sees(R, sc.me, sc);
  ok(v[20] === '?' && v[40] === '?' && v[65] === 'none', 'infantry alone: the armies 20 and 40 km away only spotted (\'?\'), the one 65 km away unseen (50 km sight)', v);
  f.u.tank = 2; v = sees(R, sc.me, sc); ok(v[40] === '?' && v[65] === 'none', 'tanks with them: still only spotted', v);
  f.u.tank = 0; f.u.rcn = 1; v = sees(R, sc.me, sc);
  ok(v[20] === ID && v[40] === ID && v[65] === ID && v[75] === 'none', '2 infantry with a recon vehicle (the starting stack): identified out to 70 km', v);
  ok(R.IM.api.armyView(sc.foes[40], (R.clearVis(), R.IM.api.visibleSet(sc.me))).name, 'an identified army shows its name', R.IM.api.armyView(sc.foes[40], R.IM.api.visibleSet(sc.me))); }

// ---- 4. Special Forces still identify at 100 km (150 with Night Optics)
{ const R = game(), S = R.S, sc = scene(R); sc.put(sc.me, 0, {spec:1}); let v = sees(R, sc.me, sc);
  ok(v[40] === ID && v[90] === ID && v[120] === 'none', 'Special Forces identify out to 100 km (the army 90 km away identified, 120 km unseen)', v);
  R.rGrant(S.nations[sc.me], 'spec_eye', 1); S.nations[sc.me].tv = (S.nations[sc.me].tv || 0) + 1; v = sees(R, sc.me, sc);
  ok(v[120] === ID, 'with Night Optics 150 km (the army 120 km away identified)', v); }

// ---- 5. sight never past 80 km
{ const R = game(), S = R.S, N = S.nations[0], sc = scene(R), ids = [...R.RNODES_U.rcn].filter(nd => !nd.std);
  for (const nd of ids) R.rGrant(N, nd.id, nd.lv.length); N.tv = (N.tv || 0) + 1;
  const kms = [{rcn:1}, {rcn:3}, {rcn:1, inf:2}, {rcn:1, tank:2, art:1}, {rcn:1, ifv:1, sam:1}].map(u => { const a = sc.put(0, 0, u), k = R.armyVisKm(a); S.armies.splice(S.armies.indexOf(a), 1); return k; });
  ok(kms.every(k => k <= 80) && near(Math.max(...kms), 80), 'with every step of its line, in any stack without Special Forces, it sees at most 80 km', kms);
  ok(R.RANGE_KM.art === 80 && near(R.UNITS.rcn.vis*R.rSightF(0, 'rcn'), 80) && R.UNITS.rcn.vis*R.rSightF(0, 'rcn') <= 80, 'exactly the artillery\'s reach (80 km), never past it', R.UNITS.rcn.vis*R.rSightF(0, 'rcn'));
  sc.put(0, 0, {rcn:1}); R.clearVis(); const idn = R.IM.api.visibleSet(0).idn;
  ok(idn.length === 1 && idn[0][4] <= 80*R.KM_W + 1e-9, 'its identifying circle is 80 km at most', idn.map(s => s[4]/R.KM_W)); }

// ---- 6. Signature Reduction
{ const R = game(), S = R.S, sc = scene(R); for (const km in sc.foes) sc.foes[km].u = {...sc.foes[km].u, inf:0, tank:0, rcn:1};
  sc.put(sc.me, 0, {inf:2}); let v = sees(R, sc.me, sc);
  ok(v[20] === '?' && v[40] === '?', 'enemy recon vehicles alone: spotted by infantry within its 50 km', v);
  R.rGrant(S.nations[sc.kz], 'rcn_camo', 1); S.nations[sc.kz].tv = (S.nations[sc.kz].tv || 0) + 1; v = sees(R, sc.me, sc);
  ok(v[20] === '?' && v[40] === 'none', 'with Signature Reduction only within half of it: 20 km spotted, 40 km not', v);
  sc.foes[40].u.inf = 1; v = sees(R, sc.me, sc); ok(v[40] === '?', 'a recon vehicle with infantry is spotted as usual', v); }

// ---- 7. speed: wheels on roads
{ const R = game(), S = R.S, G = R.G; S.armies.length = 0; let link = null;
  for (const P of G.P){ if (P.sea || S.owner[P.id] !== 0) continue; for (const v of P.nbs){ const r = R.linkOf(P.id, v); if (r && R.roadLv(r) >= 2 && !R.railLv(r) && !G.P[v].sea && S.owner[v] === 0){ link = [P.id, v, R.roadLv(r)]; break; } } if (link) break; }
  const hrs = u => { const a = R.addArmy(0, link[0], u), h = R.legHours(a, link[0], link[1]); S.armies.splice(S.armies.indexOf(a), 1); return h; };
  const rc = R.addArmy(0, link[0], {rcn:1}); ok(R.moveType(rc) === 'wheel', 'a recon vehicle alone moves on wheels (not on foot)', R.moveType(rc)); S.armies.splice(S.armies.indexOf(rc), 1);
  const hR = hrs({rcn:1}), hI = hrs({ifv:1}), hF = hrs({inf:1}), hS = hrs({inf:2, rcn:1});
  ok(near(hR, hI*7/8, 1e-9), `on a road (level ${link[2]}): 7/8 of an IFV's time (speed 8 against 7, both on wheels: x1.6 on roads)`, {rcn:hR, ifv:hI});
  ok(hR < hF/2, 'well under half of infantry\'s time', {rcn:hR, inf:hF});
  ok(near(hS, hF), 'a stack of 2 infantry and a recon vehicle marches at infantry pace (to scout fast, split the recon vehicle off)', {stack:hS, inf:hF}); }

// ---- 8. capture: alone it does not take a province, with infantry it does
{ const R = game(), S = R.S, G = R.G; S.armies.length = 0;
  const free = G.P.filter(P => !P.sea && S.owner[P.id] === -1 && P.nbs.some(v => S.owner[v] === 0)).map(P => P.id);
  ok(free.length >= 2, 'independent land next to Russia to take', free.length);
  const [p1, p2] = free; R.addArmy(0, p1, {rcn:1}); R.addArmy(0, p2, {rcn:1, inf:2});
  ok(R.capN({u:{rcn:2, inf:0}}) === 0 && R.scoutOnly(S.armies[0]) && R.capN(S.armies[1]) === 2, 'capN: a recon vehicle alone counts 0 toward a capture, with 2 infantry 2');
  R.IM.api.tick();
  ok(S.owner[p1] === -1, 'a recon vehicle alone at the heart of an independent province does not take it', G.P[p1].name);
  ok(S.owner[p2] === 0, 'a recon vehicle with 2 infantry does', G.P[p2].name); }

// ---- 9. old saves; the computer
{ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(1, 0, [0]);
  const raw = fs.readFileSync(path.join(__dirname, 'fixtures', 'rcn-oldsave.json'), 'utf8'), old = JSON.parse(raw), okL = api.restore(JSON.parse(raw)), S = R.S;
  ok(okL, 'a save of master before the Recon Vehicle loads', R.IM.api.restore.why);
  const want = (old.armies || []).length, now = S.armies.length;
  ok(okL && now === want && S.armies.every(a => a.u.rcn === 0 && a.w.rcn === 0), `every force as saved (${now} of ${want}), none with a recon vehicle (rcn filled with 0)`);
  ok(S.nations.every(N => !Object.keys(N.tech || {}).some(k => k.startsWith('rcn_'))), 'no nation holds a step of the new line');
  let err = null; try { for (let h = 0; h < 24; h++) api.tick(); } catch (e){ err = e.message; }
  ok(!err, 'it plays a day on', err);
  const R2 = load(), a2 = R2.IM.api; a2.useScenario('world64'); a2.newGame(1, 0, [0]); const s2 = api.saveJSON();
  const strip = t => { const o = JSON.parse(t); delete o.savedAt; delete o.bt; return JSON.stringify(o); };   // (bt, the battle display's history, is not carried over a load in master either)
  ok(a2.restore(JSON.parse(s2)) && strip(a2.saveJSON()) === strip(s2), 'saved again it loads to the same save'); }
if (!QUICK){ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(7, 0, []); const S = R.S, G = R.G; S.started = true;
  let sentAlone = 0; const seen = new Set(), maxBy = {};
  for (let h = 1; h <= 20*24; h++){ api.tick();
    for (const a of S.armies){ if (a.owner < 0 || !a.u.rcn) continue; if (R.scoutOnly(a) && a.path.length){ const d = a.path[a.path.length - 1]; if (S.owner[d] !== a.owner && !seen.has(a.id)){ seen.add(a.id); sentAlone++; } } }
    if (h % 24 === 0) for (const N of S.nations){ let k = 0; for (const a of S.armies) if (a.owner === N.id) k += a.u.rcn || 0; maxBy[N.name] = Math.max(maxBy[N.name] || 0, k); } }
  const tot = S.armies.reduce((s, a) => s + (a.owner >= 0 ? a.u.rcn || 0 : 0), 0), start = 2*S.nations.length;
  const lone = S.armies.filter(a => a.owner >= 0 && R.scoutOnly(a) && !a.path.length && a.to === null), inStacks = S.armies.filter(a => a.owner >= 0 && a.u.rcn > 0 && !R.scoutOnly(a)).reduce((s, a) => s + a.u.rcn, 0);
  const built = S.nations.reduce((s, N) => s + Math.max(0, maxBy[N.name] - 2), 0);
  console.log(`(20 days, seed 7: ${tot} recon vehicles in the field (${start} at the start), ${inStacks} of them in stacks, ${lone.length} forces of recon vehicles alone standing; most a nation held: ${Math.max(...Object.values(maxBy))})`);
  ok(built >= 5, 'the computer builds a few recon vehicles beyond the starting ones', {built});
  ok(Object.values(maxBy).every(k => k <= 6), 'never more than 6 a nation', Object.entries(maxBy).filter(([, k]) => k > 6));
  ok(sentAlone === 0, 'no recon vehicle alone is sent at foreign land', sentAlone);
  ok(tot > 0 && inStacks >= 0.8*tot, 'at least 80% of them ride in stacks with other ground units', {tot, inStacks});
  const empty = S.nations.filter(N => N.alive !== false && !S.armies.some(a => a.owner === N.id && a.at === N.capital && a.to === null && !a.air && R.capN(a) > 0)).map(N => N.name);
  ok(empty.length <= 2, 'the computer capitals keep ground units that can hold them (at most 2 of 68 without, as wars go)', empty); }

console.log(bad ? `${bad} of ${n} checks FAILED` : `ALL ${n} CHECKS PASS: the Recon Vehicle (numbers, identification, sight, speed, capture, old saves, the computer)`);
process.exit(bad ? 1 : 0);
