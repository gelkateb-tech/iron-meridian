// BUILD REQUIREMENTS (BUILD-REQS, owner 2026-11-27), in plain Node:   node .test/build-reqs.js   (exit 0 when every check holds)
// 1. every unit's base and level, checked against the owner's lists as written here (not against the rules' own table): Army Base and Airbase
//    as listed (round 1), the Naval Yard as listed in round 2 (I Frigate, III Cruiser and Attack Submarine, V Aircraft Carrier), the units the
//    lists do not name where they were (the Recon Vehicle, a unit since the owner's item 4 of 2026-11-27, at Army Base I as listed); the marked slots
//    (Mobile Anti-Air, Missile Defence; Corvette, Destroyer, Ballistic Missile Submarine) are there and skipped; the mobilize reasons ("Needs Army Base II", Roman numerals on every base) and the building texts say the same
// 2. build speed: levels I-III of every base add none, IV 10%, V 20%, on all three; a unit counts only the base that trains it; the Recruiting Office
//    is unchanged and multiplies; the 30% floor holds. Research days and costs of the unlocks are what they were. All three bases go to level V
// 3. Anti-Tank Infantry is gone: no unit, no research node, no old-tree conversion, no computer pick
// 4. an old save made by master before this change (.test/fixtures/at-oldsave.json, made by .test/at-oldsave-make.js): its Anti-Tank Infantry
//    becomes Motorized Infantry (forces with their share of health, queues with their share trained and the price difference back, repeat orders,
//    the computer's saving), its research line carries over or is refunded at its old price, a project of it running is refunded and its slot
//    freed, the seat is told once; it plays two days without an error; saved and loaded again nothing changes twice
// 5. the computer: 20 days of an all-computer nations world: Army Bases II and III and Airbases II stand, tanks and strike fighters are built
// 6. an old save made by master before the Naval Yard's new levels (.test/fixtures/yard-oldsave.json, made by .test/yard-oldsave-make.js): ships at
//    sea stay, a Cruiser and a Carrier queued in a yard II and a Submarine in a yard I finish as queued, a repeat order of the Submarine pauses
//    with "Needs Naval Yard III", the seat is told once; a new order needs the new level
// 7. the computer and the Naval Yard: 30 days with wars provoked: yards III stand (nations at war and coastal powers), submarines and cruisers
//    are built from them, frigates still from yards I
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n')
  + '\nreturn {IM, UNITS, UT, BUILD, BASE_LV, BASE_SPD, INF_T, RN, RNODES, R_LEGACY, R_FINAL, reqsOf, canMobilize, mobBlock, trainF, trainH, trainBase, buildCost, build, desk, aiPickUnit, recSpeed, TRAIN_MIN, UT_ROLL, count, armyHP, AT_OLD, atWar, warsOf, navalCity, get S(){ return S; }, get G(){ return G; }};';
const load = () => new Function(SRC)();
let bad = 0, n = 0; const ok = (c, msg, info) => { n++; if (!c){ bad++; console.log('FAIL  ' + msg + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 400) : '')); } };
const near = (a, b) => Math.abs(a - b) < 1e-9;

// ---- 1. every unit's base and level (the owner's lists, 2026-11-27; units they do not name keep their place)
const OWNER = {
  fac:{1:['inf', 'rcn', 'art'], 2:['ifv', 'tank', 'para', 'swarm'], 3:['mlrs', 'sam', 'spec', 'jam'], 4:[], 5:[]},
  air:{1:['drone', 'heli', 'asf'], 2:['jet', 'sdrone'], 3:['mpa', 'awacs', 'bomb'], 4:[], 5:['stealth']},
  yard:{1:['frig'], 2:[], 3:['crui', 'sub'], 4:[], 5:['carr']}};   // (round 2; the Corvette, Destroyer and Ballistic Missile Submarine are SLOTS)
const KEPT = {mar:['fac', 1], int:['air', 1]};
const SLOTS = {maa:['fac', 2], mdef:['fac', 5], corv:['yard', 1], dest:['yard', 2], ssbn:['yard', 5]};   // marked slots: no such unit yet (the recon vehicle's, rcn, was one until the unit was added)
const ROM = ['', 'I', 'II', 'III', 'IV', 'V'];
{ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(12345, 0, [0]); const S = R.S, G = R.G;
  const want = {}; for (const b in OWNER) for (const l in OWNER[b]) for (const t of OWNER[b][l]) want[t] = [b, +l]; for (const t in KEPT) want[t] = KEPT[t];
  ok(Object.keys(R.UNITS).sort().join() === Object.keys(want).sort().join(), 'every unit is accounted for: the owner\'s lists plus the units they do not name', {units:Object.keys(R.UNITS), want:Object.keys(want)});
  for (const t in want){ const r = R.reqsOf(t)[0], [b, l] = want[t]; ok(r && r.b === b && r.l === l, `${t}: needs ${b} level ${l}`, R.reqsOf(t)); ok(R.trainBase(t) === b, `${t}: trained (and sped up) by ${b}`, R.trainBase(t)); }
  ok(JSON.stringify(R.reqsOf('para')) === JSON.stringify([{b:'fac', l:2}, {b:'air', l:1}]), 'Paratroopers: Army Base II and still an Airbase I', R.reqsOf('para'));
  ok(Object.keys(R.UNITS).every(t => R.reqsOf(t).length === (t === 'para' ? 2 : 1)), 'no other unit needs a second building');
  for (const k in SLOTS){ const [b, l] = SLOTS[k]; ok(R.BASE_LV[b][k] === l && !R.UNITS[k] && !R.RN['u_' + k], `marked slot ${k}: ${b} level ${l}, skipped (no unit, no research)`); }
  ok(Object.keys(R.BASE_LV).sort().join() === 'air,fac,yard' && Object.keys(R.BASE_LV).every(b => Object.keys(R.BASE_LV[b]).every(t => R.UNITS[t] || SLOTS[t])), 'the table holds the three bases and only units or marked slots');
  // the reasons a city gives (mobBlock): one city of the seat with every research, base by base
  const N = S.nations[0], city = G.P.find(P => S.owner[P.id] === 0 && P.city && P.coast).id, B = S.bld[city]; N.cash = 9000;
  for (const t of R.UT) if (R.UNITS[t].tech) N.tech[R.UNITS[t].tech] = 1; for (const id of ['bomb_up', 'jet_lo']) N.tech[id] = 1; N.tv = (N.tv || 0) + 1;
  for (const b of ['fac', 'air', 'yard']) for (let lv = 0; lv <= 5; lv++){ B.fac = B.air = B.yard = 0; B[b] = lv;
    for (const t in want){ if (want[t][0] !== b) continue; const need = want[t][1], why = R.canMobilize(0, city, t), k = R.mobBlock(0, city, t);
      if (lv >= need && t !== 'para') ok(why === '', `${b} ${lv}: ${t} can be mobilized`, why);
      else if (lv < need) ok(k && k.kind === 'bld' && k.b === b && k.l === need && (b === 'fac' || need > 1 ? why === `Needs ${R.BUILD[b].name} ${ROM[need]}` : /^Build an? /.test(why)), `${b} ${lv}: ${t} says it needs ${b} ${need}`, why); } }
  // the wording (owner 2026-11-27, point 4): Roman numerals on every base, like the Airbase and the Naval Yard; never "level 2"
  B.fac = B.air = B.yard = 0; ok(R.canMobilize(0, city, 'inf') === 'Needs Army Base I', 'no Army Base: infantry says "Needs Army Base I"', R.canMobilize(0, city, 'inf'));
  B.fac = 1; ok(R.canMobilize(0, city, 'tank') === 'Needs Army Base II' && R.canMobilize(0, city, 'ifv') === 'Needs Army Base II', 'Army Base I: tanks and IFVs say "Needs Army Base II"', [R.canMobilize(0, city, 'tank'), R.canMobilize(0, city, 'ifv')]);
  B.fac = 2; ok(R.canMobilize(0, city, 'sam') === 'Needs Army Base III', 'Army Base II: Mobile SAMs say "Needs Army Base III"', R.canMobilize(0, city, 'sam'));
  B.yard = 1; ok(R.canMobilize(0, city, 'sub') === 'Needs Naval Yard III' && R.canMobilize(0, city, 'crui') === 'Needs Naval Yard III' && R.canMobilize(0, city, 'carr') === 'Needs Naval Yard V' && R.canMobilize(0, city, 'frig') === '', 'Naval Yard I: frigates train, submarines and cruisers say "Needs Naval Yard III", carriers "Needs Naval Yard V"', ['sub', 'crui', 'carr', 'frig'].map(t => R.canMobilize(0, city, t)));
  B.yard = 0; ok(/^Build a Naval Yard first$/.test(R.canMobilize(0, city, 'frig')), 'no Naval Yard: a frigate says to build one', R.canMobilize(0, city, 'frig'));
  { let lvl = []; for (const b of ['fac', 'air', 'yard']) for (let lv = 0; lv <= 5; lv++){ B.fac = B.air = B.yard = 0; B[b] = lv; for (const t of R.UT){ const w = R.canMobilize(0, city, t); if (/level \d/.test(w)) lvl.push(w); } }
    ok(!lvl.length, 'no reason anywhere says "level 1/2/3" any more', [...new Set(lvl)]); }
  B.fac = 2; B.air = 0; ok(/^Build an Airbase first$/.test(R.canMobilize(0, city, 'para')), 'Paratroopers at Army Base II without an Airbase: build one', R.canMobilize(0, city, 'para'));
  B.air = 1; ok(R.canMobilize(0, city, 'para') === '', 'and with an Airbase I they train');
  // the building texts: every level's units, the speed of IV and V
  const D = R.BUILD.fac.desc, A = R.BUILD.air.desc, Y = R.BUILD.yard.desc;
  ok(/Level I: Motorized Infantry, Recon Vehicle, Mobile Artillery/.test(D) && /Level II: Infantry Fighting Vehicle, Main Battle Tank, Paratroopers \(also need an Airbase\), Swarm Drones/.test(D)
    && /Level III: Rocket Artillery, Mobile SAM, Special Forces, Mobile Jammer/.test(D) && /Level IV: no new units; units train 10% faster here/.test(D) && /Level V: no new units; units train 20% faster here/.test(D) && !/Anti-Tank/.test(D), 'the Army Base text lists every level', D);
  ok(/Level I: Recon UAV, Attack Helicopter, Air Superiority Fighter, Interceptor/.test(A) && /Level II: Strike Fighter, Strike Drone/.test(A) && /Level III: Maritime Patrol Aircraft, AWACS, Heavy Bomber/.test(A)
    && /Level IV: no new units; units train 10% faster/.test(A) && /Level V: Stealth Bomber; units train 20% faster/.test(A), 'the Airbase text lists every level', A);
  ok(/Level I: Frigate\. /.test(Y) && /Level II: no new units\. /.test(Y) && /Level III: Cruiser, Attack Submarine\. /.test(Y) && /Level IV: no new units; units train 10% faster/.test(Y) && /Level V: Aircraft Carrier; units train 20% faster/.test(Y)
    && !/Corvette|Destroyer|Ballistic/.test(Y), 'the Naval Yard text lists every level (round 2), the marked slots left out', Y);
  ok(!/Anti-Tank/.test(R.BUILD.rec.desc) && /Unlocks no units/.test(R.BUILD.rec.desc), 'the Recruiting Office text names no Anti-Tank Infantry', R.BUILD.rec.desc); }

// ---- 2. build speed, max levels, research days and prices
{ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(12345, 0, [0]); const S = R.S, G = R.G;
  const SPD = [1, 1, 1, 1, 0.9, 0.8];
  for (const b of ['fac', 'air', 'yard']) ok(JSON.stringify(R.BASE_SPD[b]) === JSON.stringify(SPD), `${b}: no speed at levels I-III, 10% at IV, 20% at V`, R.BASE_SPD[b]);
  const city = G.P.find(P => S.owner[P.id] === 0 && P.city && P.coast).id, B = S.bld[city];
  const by = {fac:['inf', 'tank', 'sam', 'para', 'swarm'], air:['jet', 'asf', 'bomb', 'stealth', 'drone'], yard:['frig', 'carr']};
  for (const b in by) for (let lv = 0; lv <= 5; lv++){ B.fac = B.air = B.yard = B.rec = 0; B[b] = lv;
    for (const t of by[b]) ok(near(R.trainF(city, t), SPD[lv]), `${b} ${lv}: ${t} trains x${SPD[lv]}`, R.trainF(city, t)); }
  B.fac = 0; B.air = 5; B.rec = 0; ok(near(R.trainF(city, 'swarm'), 1) && near(R.trainF(city, 'para'), 1), 'Swarm Drones and Paratroopers are sped up by the Army Base alone (an Airbase V adds nothing)');
  B.fac = 5; B.air = 0; B.yard = 0; ok(near(R.trainF(city, 'jet'), 1) && near(R.trainF(city, 'frig'), 1), 'an Army Base V does not speed up aircraft or ships');
  B.fac = 3; B.rec = 2; ok(near(R.trainF(city, 'tank'), 0.8), 'Army Base III and a Recruiting Office II: the office\'s 20% only');
  B.fac = 5; B.rec = 5; ok(near(R.trainF(city, 'tank'), 0.4) && R.trainH(city, 'tank', 0) === Math.round(R.UNITS.tank.build*Math.max(R.TRAIN_MIN, 0.4)), 'Army Base V and a Recruiting Office V multiply (0.8 x 0.5), above the 30% floor', R.trainH(city, 'tank', 0));
  for (let l = 0; l <= 5; l++){ B.rec = l; B.fac = 0; ok(near(R.recSpeed(city), 1 - 0.1*l), `the Recruiting Office ${l} is unchanged (${10*l}% faster)`); } B.rec = 0;
  for (const b of ['fac', 'air', 'yard']){ ok(R.BUILD[b].max === 5, `${b} goes up to level V`);
    for (let l = 1; l <= 5; l++){ const c = R.buildCost(0, b, l, city); ok(c.cash > 0 && c.h > 0, `${b} level ${l} has a price and a time`, c); } }
  B.fac = 5; S.cons[city] = null; S.nations[0].cash = 9e4; ok(R.build(0, city, 'fac') === false, 'no level VI');
  // research days and prices of the unlocks (owner: keep them): as recorded on master 9f01407 (day, days, money)
  const RES = {ifv:[1, 3, 59], spec:[4, 4, 75], jam:[3, 3, 61], mar:[3, 3, 61], para:[3, 4, 62], mlrs:[5, 4, 77], swarm:[4, 4, 66], drone:[1, 3, 53], heli:[1, 4, 80], jet:[1, 4, 93], int:[1, 4, 86], sdrone:[6, 4, 73], mpa:[2, 4, 97], asf:[4, 5, 100], bomb:[6, 6, 149], awacs:[5, 5, 116], stealth:[14, 9, 327], carr:[7, 6, 142]};
  for (const t in RES){ const L = R.RN['u_' + t].lv[0]; ok(L.day === RES[t][0] && L.c.days === RES[t][1] && L.c.cash === RES[t][2], `${t}: research day ${RES[t][0]}, ${RES[t][1]} days, $${RES[t][2]}M as before`, [L.day, L.c.days, L.c.cash]); }
  ok(['inf', 'art', 'tank', 'sam', 'frig', 'sub', 'crui'].every(t => !R.UNITS[t].tech), 'the standard-issue units stay standard issue'); }

// ---- 3. Anti-Tank Infantry is gone
{ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(12345, 0, []); const S = R.S;
  ok(!R.UNITS.at && !R.UT.includes('at') && !R.INF_T.includes('at'), 'no Anti-Tank Infantry unit (UNITS, UT, INF_T)', R.INF_T);
  ok(!R.RNODES.some(nd => nd.u === 'at' || /^at_|^u_at$/.test(nd.id)) && !R.R_FINAL.at, 'no research node of its line (unlock, upgrades, Firepower, Protection, generation, final level)');
  ok(!Object.values(R.R_LEGACY).some(L => L.some(s => /^at_/.test(s))), 'the old tree\'s projects no longer turn into its nodes');
  ok(R.UT_ROLL === true, 'the fast unit counts (UT_ROLL) stay on with the new unit list');
  const a = {u:{}, w:{}}; for (const t of R.UT){ a.u[t] = 1; a.w[t] = 0; } let hp = 0; for (const t of R.UT) hp += R.UNITS[t].hp;
  ok(R.count(a) === R.UT.length && R.armyHP(a) === hp, 'and they count every unit type', [R.count(a), R.armyHP(a), hp]);
  const picks = new Set(); S.started = true;
  for (const N of S.nations.slice(0, 20)){ const p = N.capital; S.bld[p].fac = 5; S.bld[p].air = 5; for (let i = 0; i < 40; i++){ const t = R.aiPickUnit(N.id, p); if (t) picks.add(t); } }
  ok(!picks.has('at') && picks.has('inf') && picks.has('tank'), 'the computer never picks it (and still picks infantry and tanks)', [...picks]); }

// ---- 4. an old save
{ const FIX = path.join(__dirname, 'fixtures', 'at-oldsave.json'), old = fs.readFileSync(FIX, 'utf8'), O = JSON.parse(old);
  const me = O.nations.findIndex(N => N.ai === false), N0 = O.nations[me], cap = N0.capital;
  const atU = o => o.armies.reduce((s0, a) => s0 + ((a.u && a.u.at) || 0), 0), infU = o => o.armies.reduce((s0, a) => s0 + ((a.u && a.u.inf) || 0), 0);
  const q0 = O.queue;
  ok(!O.noAt && atU(O) > 0 && Array.isArray(q0) && q0[cap].some(it => it.t === 'at') && N0.tech.at_armor === 1 && N0.research && N0.research.id === 'at_warhead', 'the fixture is an old save with Anti-Tank Infantry in forces, queues and research', {at:atU(O), tech:N0.tech});
  const R = load(), api = R.IM.api; ok(api.restore(JSON.parse(old)) !== false, 'the old save loads'); const S = R.S, N = S.nations[me];
  ok(S.noAt === 1, 'it is marked as converted');
  ok(S.armies.every(a => !('at' in a.u) && !('at' in a.w)), 'no force holds Anti-Tank Infantry');
  ok(infU(S) === infU(O) + atU(O), 'every Anti-Tank Infantry unit became Motorized Infantry', [infU(S), infU(O), atU(O)]);
  // the share of health: a force's Anti-Tank wounds (of 9 HP a unit) are the same share of the infantry they became (10 HP)
  { const ids = O.armies.filter(a => a.u && a.u.at).map(a => a.id); let worst = 0;
    for (const id of ids){ const o = O.armies.find(a => a.id === id), a = S.armies.find(x => x.id === id); if (!a) continue; const ou = o.u, ow = o.w || {};
      const want = (ow.inf || 0) + (ow.at || 0)*10/9; worst = Math.max(worst, Math.abs(a.w.inf - Math.min(a.u.inf*10, want))); if (a.u.inf !== (ou.inf || 0) + ou.at) worst = 99; }
    ok(worst < 1e-9, 'each force keeps its units and its share of health (wounds x 10/9)', worst); }
  { const o = O.armies.find(a => a.nm === '9th Anti-Tank Brigade'), a = o && S.armies.find(x => x.id === o.id); ok(a && a.nm == null, 'a force named for it loses the name (it is named again when next shown)', a && a.nm); }
  { const Q0 = q0[cap], Q = S.queue[cap], i = Q0.findIndex(it => it.t === 'at');
    ok(Q.length === Q0.length && Q[i].t === 'inf' && Q[i].h === Math.max(1, Math.round(Q0[i].h*24/30)) && Q[i].h0 === Math.max(Q[i].h, Math.round(Q0[i].h0*24/30)), 'a queued Anti-Tank Infantry became Motorized Infantry with its share trained (hours x 24/30)', [Q0[i], Q[i]]);
    ok(S.queue.every(q => q.every(it => it.t !== 'at')), 'no queue anywhere holds one'); }
  ok(R.desk(me).repeat[cap] === 'inf', 'the repeat order repeats Motorized Infantry', R.desk(me).repeat);
  ok(S.nations.every(M => !(M.uSave && M.uSave.t === 'at')), 'no computer nation saves for one');
  // research: carried over or refunded at the old price
  const T = N.tech, T0 = N0.tech;
  ok(Object.keys(T).every(id => !/^at_|^u_at$/.test(id)), 'no research node of its line is held', T);
  ok(T.inf_armor === 1 && T.inf_pr === 2 && T.inf_fp === 3, 'Ceramic Body Armour 1 and Protection 2 carried over to Motorized Infantry; its Firepower 3 kept', {inf_armor:T.inf_armor, inf_pr:T.inf_pr, inf_fp:T.inf_fp});
  ok(!N.research && !N.research2, 'the Tandem Warheads project running is stopped and its slot freed', [N.research, N.research2]);
  ok(N.rPick == null, 'the computer-style research pick on it is dropped');
  const L = R.AT_OLD.lv, sum = ids => ids.reduce((s0, [id, l]) => s0 + L[id][l - 1][0], 0);
  // refunded: Firepower 1-2 (the infantry's level 3 is higher), Thermal Sights, Guided Missile Teams, the running Tandem Warheads 1; and $7M for
  // each queued unit (doctrine price factor: none at the start)
  const qn = q0.reduce((s0, q) => s0 + (Array.isArray(q) ? q.filter(it => it.t === 'at').length : 0), 0), qMine = O.queue.reduce((s0, q, p) => s0 + (O.owner[p] === me ? q.filter(it => it.t === 'at').length : 0), 0);
  const cash = sum([['at_fp', 1], ['at_fp', 2], ['at_eye', 1], ['at_g2', 1], ['at_warhead', 1]]) + 7*qMine;
  ok(N.cash - N0.cash >= cash - 1e-6 && N.cash - N0.cash < cash + 250, 'the refund in money: the research levels that add nothing now and the price difference of the queued units (goods that do not fit paid in money on top)', {got:N.cash - N0.cash, want:cash, qn, qMine});
  const log = (R.desk(me).log || []).filter(e => /Anti-Tank Infantry is no longer in the game/.test(e.text || ''));
  ok(log.length === 1 && /Motorized Infantry/.test(log[0].text) && /refunded: /.test(log[0].text) && /carries over/.test(log[0].text), 'the seat is told once, with what was converted and refunded', log.map(e => e.text));
  // two days of play, then save and load again: nothing converts twice
  let err = null; try { for (let h = 0; h < 48; h++) api.tick(); } catch (e){ err = e.message; }
  ok(!err, 'the converted save plays two days', err);
  const js = api.saveJSON(), R2 = load(); ok(R2.IM.api.restore(JSON.parse(js)) !== false, 'and loads again');
  ok((R2.desk(me).log || []).filter(e => /Anti-Tank Infantry is no longer in the game/.test(e.text || '')).length === 1 && R2.S.nations[me].cash === R.S.nations[me].cash, 'a converted save is not converted or told again');
  // a base above the levels it needed keeps its level (no base max changed): an Army Base V stays V
  const o2 = JSON.parse(old); o2.bld[cap].fac = 5; o2.bld[cap].air = 5; const R3 = load(); R3.IM.api.restore(o2); ok(R3.S.bld[cap].fac === 5 && R3.S.bld[cap].air === 5, 'bases at level V in an old save stay at level V'); }

// ---- 5. the computer builds the new levels (20 days, all computer)
{ const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(12345, 0, []); const S = R.S, G = R.G; S.started = true; const seen = new Set(), built = {};
  for (let h = 0; h < 20*24; h++){ api.tick(); for (const q of S.queue) for (const it of q) if (!it.msl && !seen.has(it)){ seen.add(it); built[it.t] = (built[it.t] || 0) + 1; } }
  const lv = k => { const c = [0, 0, 0, 0, 0, 0]; for (const P of G.P) if (P.city && S.owner[P.id] >= 0) c[S.bld[P.id][k] || 0]++; return c; };
  const F = lv('fac'), A = lv('air');
  ok(F[2] + F[3] >= 40, 'Army Bases II and III stand (the capitals first)', F);
  ok(A[2] + A[3] >= 5, 'Airbases II stand', A);
  ok((built.tank || 0) >= 50 && (built.jet || 0) >= 3 && !built.at, 'tanks and strike fighters are built, Anti-Tank Infantry never', built);
  ok(S.nations.filter(N => N.alive).every(N => S.bld[N.capital].fac >= 1), 'every living nation has an Army Base in its capital');
  // ---- 7. the same world on to day 30, with 3 wars provoked on days 20 and 25 (neighbours, as .test/ai-wars.js does): the Naval Yard
  let x = 12345; const rnd = () => ((x = (x*1664525 + 1013904223) >>> 0)/4294967296);
  const provoke = k => { const pairs = new Set(); for (let p = 0; p < G.P.length; p++){ const o = S.owner[p]; if (o < 0 || G.P[p].sea) continue; for (const v of G.P[p].nbs){ const q = S.owner[v]; if (q >= 0 && q !== o && !G.P[v].sea) pairs.add(o < q ? o + ',' + q : q + ',' + o); } }
    const L = [...pairs].sort().map(t => t.split(',').map(Number)).filter(([a, b]) => S.nations[a].alive && S.nations[b].alive && !R.atWar(a, b)); for (let i = 0; i < k && L.length; i++){ const [a, b] = L.splice(Math.floor(rnd()*L.length), 1)[0]; api.declareWar(a, b); } };
  const sh = {frig:0, sub:0, crui:0, carr:0}, low = [];
  for (let h = 20*24; h < 30*24; h++){ if (h === 20*24 || h === 25*24) provoke(3); api.tick();
    for (let p = 0; p < S.queue.length; p++) for (const it of S.queue[p]) if (!it.msl && !seen.has(it)){ seen.add(it); if (it.t in sh){ sh[it.t]++; const y = S.bld[p].yard || 0; if (y < R.BASE_LV.yard[it.t]) low.push([it.t, p, y]); } } }
  const Y = lv('yard'), coast = S.nations.filter(N => N.alive && G.P.filter(P => S.owner[P.id] === N.id && P.city && R.navalCity(P.id)).length >= 3), best = n => Math.max(0, ...G.P.filter(P => S.owner[P.id] === n && P.city).map(P => S.bld[P.id].yard || 0));
  const sea = S.nations.filter(N => N.alive && R.warsOf(N.id).length && G.P.filter(P => S.owner[P.id] === N.id && P.city && R.navalCity(P.id)).length >= 2);
  ok(Y[3] + Y[4] + Y[5] >= 8, 'Naval Yards III stand by day 30 (cruisers and submarines)', Y);
  ok(coast.filter(N => best(N.id) >= 2).length >= coast.length/4, 'a quarter or more of the coastal powers have their main yard at II or higher, on the way to III', [coast.filter(N => best(N.id) >= 2).length, coast.length]);
  { const sy = sea.filter(N => best(N.id) >= 1), going = N => best(N.id) >= 3 || (N.ySave && N.ySave.until > S.hour) || G.P.some(P => S.owner[P.id] === N.id && S.cons[P.id] && S.cons[P.id].k === 'yard');
    ok(sy.length >= 3 && sy.every(going), 'every nation at war with a coast and a yard has a yard III, or is building or saving for the next level', sy.map(N => [N.name, best(N.id), N.ySave])); }
  ok(sh.sub + sh.crui >= 3 && sh.frig >= 40, 'submarines and cruisers are built (days 20-30), frigates still plenty', sh);
  ok(!low.length, 'no ship is ever queued in a yard below its level', low.slice(0, 5)); }

// ---- 6. an old save with ships queued in a yard that is now too low (made by master: .test/yard-oldsave-make.js)
{ const FIX = path.join(__dirname, 'fixtures', 'yard-oldsave.json'), old = fs.readFileSync(FIX, 'utf8'), O = JSON.parse(old), me = O.nations.findIndex(N => N.ai === false);
  const A = O.queue.findIndex(q => Array.isArray(q) && q.some(it => it.t === 'crui')), B = O.queue.findIndex(q => Array.isArray(q) && q.some(it => it.t === 'sub'));
  ok(O.yl == null && A >= 0 && B >= 0 && O.bld[A].yard === 2 && O.bld[B].yard === 1 && O.queue[A].map(it => it.t).join() === 'crui,carr', 'the fixture is a master save: a Cruiser and a Carrier queued at Naval Yard II, a Submarine at Naval Yard I', {A, B, qA:O.queue[A], qB:O.queue[B]});
  const ships = o => { const c = {frig:0, sub:0, crui:0, carr:0}; for (const a of o.armies) if (a.owner === me) for (const t in c) c[t] += (a.u && a.u[t]) || 0; return c; };
  const R = load(), api = R.IM.api; ok(api.restore(JSON.parse(old)) !== false, 'the old save loads'); const S = R.S;
  ok(S.yl === 1, 'it is marked as read under the new levels');
  ok(JSON.stringify(ships(S)) === JSON.stringify(ships(O)), 'every ship at sea stays', [ships(S), ships(O)]);
  ok(JSON.stringify(S.queue[A]) === JSON.stringify(O.queue[A]) && JSON.stringify(S.queue[B]) === JSON.stringify(O.queue[B]), 'the queues are as they were (nothing dropped, refunded or retimed)', [S.queue[A], S.queue[B]]);
  ok(S.bld[A].yard === 2 && S.bld[B].yard === 1, 'the yards keep their levels');
  ok(R.canMobilize(me, A, 'crui') === 'Needs Naval Yard III' && R.canMobilize(me, A, 'carr') === 'Needs Naval Yard V' && R.canMobilize(me, B, 'sub') === 'Needs Naval Yard III' && R.canMobilize(me, B, 'frig') === '', 'a new order needs the new level (frigates still train at I)', [R.canMobilize(me, A, 'crui'), R.canMobilize(me, A, 'carr'), R.canMobilize(me, B, 'sub')]);
  const told = d => (d.log || []).filter(e => /New Naval Yard levels/.test(e.text || ''));
  { const L = told(R.desk(me)); ok(L.length === 1 && /Frigate at level I, Cruiser and Attack Submarine at level III, Aircraft Carrier at level V/.test(L[0].text) && /The 3 ships already in training in a yard now too low for them finish as queued/.test(L[0].text) && /A repeat order of such ships pauses/.test(L[0].text) && /ships at sea stay/.test(L[0].text), 'the seat is told once: the new levels, the 3 ships finish as queued, the repeat order pauses', L.map(e => e.text)); }
  ok(S.nations.every((N, i) => i === me || !told(R.desk(i)).length), 'no other nation is told');
  // play until all three are out: they finish as queued
  const s0 = ships(S); let err = null; try { for (let h = 0; h < 200; h++) api.tick(); } catch (e){ err = e.message; }
  const s1 = ships(S); ok(!err, 'the save plays on', err);
  ok(s1.crui === s0.crui + 1 && s1.carr === s0.carr + 1 && s1.sub >= s0.sub + 1, 'the Cruiser, the Carrier and the Submarine came out of their yards (II and I)', [s0, s1]);
  ok(!S.queue[B].some(it => it.t === 'sub'), 'the repeat order queued no new Submarine at Naval Yard I', S.queue[B]);
  ok((R.desk(me).log || []).some(e => /Repeat production paused in .*needs Naval Yard III for Attack Submarine/.test(e.text || '')), 'the repeat order paused and said why', (R.desk(me).log || []).filter(e => /Repeat/.test(e.text || '')).map(e => e.text));
  const js = api.saveJSON(), R2 = load(); ok(R2.IM.api.restore(JSON.parse(js)) !== false && told(R2.desk(me)).length === 1, 'saved and loaded again: told once, not twice');
  const R3 = load(); R3.IM.api.useScenario('world64'); R3.IM.api.newGame(12345, 0, [0]); ok(R3.S.yl === 1 && !told(R3.desk(0)).length, 'a new game is made under the new levels (nothing to tell)'); }

console.log(bad ? `${bad} of ${n} checks FAILED` : `ALL ${n} CHECKS PASS: build requirements (the Naval Yard of round 2 included), build speed, Anti-Tank Infantry removed, old saves, the computer`);
process.exit(bad ? 1 : 0);
