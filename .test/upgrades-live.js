// Research upgrades reach every unit at once (docs/RESEARCH-UPGRADES.md, owner's decision 2026-11-18), in plain Node:   node .test/upgrades-live.js
// (exit 0 when every check holds). What it checks:
// 1. the three replacements: Rapid Mobilisation -> Infantry Kit (inf_kit), Bigger Salvo -> Thermobaric Warheads (swarm_tb), Flight-Deck Crews ->
//    Close-In Defence (carr_ciws): same days, prices and place in the tree, the review's stats, the old ids gone; carrier repairs stay 20% a day
// 2. the final level of every unit line (the last step by day, a generation on a tie) trains that unit 15% faster, on top of its own upgrade; nothing
//    before it does; the card text says so
// 3. every research step of every unit line changes its unit live (no new unit, no reload): for a person's nation and a computer nation, on a force
//    on land, ground troops embarked at sea, a fleet, an air wing at its base, a wing aboard a carrier and a wing in flight
// 4. the gaps: G1 aircraft fly faster with Fourth-Generation Interceptor (+10%) and Supersonic Bomber (+33%): a wing in flight, the mission hours,
//    the stats card, the computer's wings; G2 one swarm card is six drones everywhere (new, fielded, stack size); G3 units already in a queue train
//    faster the moment the final level is done, keeping the share already trained (also through the research slot finishing); G4 a walk inside a
//    province and a leg between provinces go on at the new speed at once; G5 the computer counts a queued card as the units spawn makes of it
// 5. an old save (.test/fixtures/upgrades-oldsave.json, made by master 76c89ca before the review: Rapid Mobilisation 2, Bigger Salvo, Flight-Deck
//    Crews 1 with level 2 running, a fielded wing of two eight-drone cards, a queue) loads, gets the replacements level for level, is told once,
//    plays on two days, finishes the running project as Close-In Defence 2, and saves and loads again unchanged
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const NAMES = ['IM', 'UNITS', 'UT', 'RN', 'RNODES_U', 'R_FINAL', 'R_PRICE', 'R_RENAMED', 'R_VS', 'CLASSES', 'AIR_SPEED', 'AIR_SPF', 'st', 'multO', 'rLevel', 'rGrant', 'rTrainF', 'rPack', 'rAirSpdF',
  'rSightF', 'rRangeKm', 'rSamNear', 'rJamF', 'rKoHours', 'rAdF', 'rBombF', 'rMpaR', 'rMpaH', 'rAewR', 'rAewF', 'rSpecTerr', 'rDrilled', 'dropOnly', 'dropRange', 'uavLv', 'has', 'rDeckRate',
  'maintRate', 'addArmy', 'power', 'walkSpeed', 'wingSpd', 'wingRange', 'airCheck', 'airTick', 'unitStrength', 'stackSizes', 'spawn', 'trainH', 'recruit', 'prodHour', 'researchSlotHour',
  'RES_K', 'orderSpot', 'sailHour', 'sailHours', 'legH', 'desk', 'ownedBy', 'hexDist', 'armiesOf', 'count'];
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + `\nreturn {${NAMES.join(', ')}, get S(){ return S; }, get G(){ return G; }};`;
const load = () => new Function(SRC)();
let bad = 0, n = 0; const ok = (c, msg, info) => { n++; if (!c){ bad++; console.log('FAIL  ' + msg + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 400) : '')); } };
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;
const SEAT = 0, AI = 1;
// a new classic game with nation 0 a seat (a person's nation) and nation 1 a computer nation; places to put forces: the capital, a sea zone
function game(seed = 12345){ const R = load(), api = R.IM.api; api.useScenario('world'); api.newGame(seed, 0, [SEAT]); R.S.started = true;
  const G = R.G, seaOf = n => { for (const p of R.ownedBy(n)) for (const q of G.P[p].nbs) if (G.P[q].sea) return q; return G.P.find(P => P.sea).id; };
  return {R, api, S:R.S, G, cap:n => R.S.nations[n].capital, sea:seaOf}; }
const line = (R, t) => (R.RNODES_U[t] || []).filter(nd => nd.kind !== 'unlock');

// ---- 1. the replacements
{ const {R} = game();
  for (const old of ['inf_build', 'swarm_pack', 'carr_deck']) ok(!R.RN[old], `the old node ${old} is gone from the tree`);
  ok(JSON.stringify(R.R_RENAMED) === JSON.stringify({inf_build:'inf_kit', swarm_pack:'swarm_tb', carr_deck:'carr_ciws'}), 'old saves map the three old nodes to their replacements', R.R_RENAMED);
  const want = {inf_kit:{name:'Infantry Kit', days:[5, 14], fx:[{hp:2}, {}]}, swarm_tb:{name:'Thermobaric Warheads', days:[9], fx:[{atk:0.2, hp:0.4}]}, carr_ciws:{name:'Close-In Defence', days:[11, 16], fx:[{def:1}, {}]}};
  for (const id in want){ const nd = R.RN[id], W = want[id];
    ok(nd && nd.name === W.name && nd.kind === 'kit', `${id} is the upgrade ${W.name}`, nd && nd.name);
    ok(nd && JSON.stringify(nd.lv.map(L => L.day)) === JSON.stringify(W.days), `${W.name}: the old node's days`, nd && nd.lv.map(L => L.day));
    ok(nd && nd.lv.every((L, i) => { const k = R.R_PRICE.kit(R.UNITS[nd.u], i + 1); return L.c.cash === k.cash && L.c.days === k.days && L.c.metal === k.metal*R.RES_K && L.c.rare === k.rare*R.RES_K; }), `${W.name}: the old node's prices (the upgrade price of its level)`, nd && nd.lv.map(L => L.c));
    ok(nd && JSON.stringify(nd.lv.map(L => L.fx)) === JSON.stringify(W.fx), `${W.name}: the review's flat stats`, nd && nd.lv.map(L => L.fx)); }
  ok(line(R, 'inf').map(nd => nd.id).indexOf('inf_kit') === 3 && line(R, 'swarm').map(nd => nd.id).indexOf('swarm_tb') === 3 && line(R, 'carr').map(nd => nd.id).indexOf('carr_ciws') === 2,
    'each replacement sits where the old node sat in its line', ['inf', 'swarm', 'carr'].map(t => line(R, t).map(nd => nd.id)));
  ok(R.RN.inf_kit.lv[1].rq && R.RN.inf_kit.lv[1].rq[0] === 'inf_g2', 'Infantry Kit 2 needs Mechanized Infantry, as Rapid Mobilisation 2 did');
  // stats, for both kinds of nation
  for (const o of [SEAT, AI]){ const N = R.S.nations[o];
    const hp0 = R.st(o, 'inf', 'hp'); R.rGrant(N, 'inf_kit', 1); ok(near(R.st(o, 'inf', 'hp'), hp0 + 2), `nation ${o}: Infantry Kit 1 gives infantry health +2`, [hp0, R.st(o, 'inf', 'hp')]);
    ok(R.multO(o, 'inf', 'armored') === 0.5 && R.multO(o, 'inf', 'air') === 0.2, `nation ${o}: Infantry Kit 1 leaves the damage to armour and aircraft as it was`);
    R.rGrant(N, 'inf_kit', 2); ok(R.multO(o, 'inf', 'armored') === 0.7 && R.multO(o, 'inf', 'air') === 0.35 && R.multO(o, 'inf', 'soft') === 1, `nation ${o}: Infantry Kit 2: damage to armour 0.5x to 0.7x, to aircraft 0.2x to 0.35x`, CLASSESv(R, o, 'inf'));
    const a0 = R.st(o, 'swarm', 'atk'), h0 = R.st(o, 'swarm', 'hp'); R.rGrant(N, 'swarm_tb', 1);
    ok(near(R.st(o, 'swarm', 'atk'), a0 + 0.2) && near(R.st(o, 'swarm', 'hp'), h0 + 0.4) && R.rPack(o, 'swarm') === 6, `nation ${o}: Thermobaric Warheads: attack 1.6 to 1.8, health 2 to 2.4, still six drones a card`, [R.st(o, 'swarm', 'atk'), R.st(o, 'swarm', 'hp'), R.rPack(o, 'swarm')]);
    const d0 = R.st(o, 'carr', 'def'); R.rGrant(N, 'carr_ciws', 1); ok(near(R.st(o, 'carr', 'def'), d0 + 1) && R.multO(o, 'carr', 'air') === 1.4, `nation ${o}: Close-In Defence 1: defence +1`, [d0, R.st(o, 'carr', 'def')]);
    R.rGrant(N, 'carr_ciws', 2); ok(R.multO(o, 'carr', 'air') === 1.8, `nation ${o}: Close-In Defence 2: damage to aircraft 1.4x to 1.8x`, R.multO(o, 'carr', 'air'));
    ok(R.rDeckRate(o) === 0.2, `nation ${o}: wings aboard a carrier repair 20% a day`); }
  // the stats card agrees with the rules
  const U = R.unitStrength(SEAT, 'inf'), Ub = R.unitStrength(SEAT, 'inf', {u_inf:1});
  ok(U.hp === Ub.hp + 2, 'the stats card shows the Infantry Kit health', [Ub.hp, U.hp]);
  const rowA = R.unitStrength(SEAT, 'carr').rows.find(r => r.k === 'jet'), rowB = R.unitStrength(SEAT, 'carr', {u_carr:1}).rows.find(r => r.k === 'jet');
  ok(rowA && rowB && rowA.atk > rowB.atk*1.25, 'the stats card shows the carrier hitting aircraft harder with Close-In Defence 2', [rowB && rowB.atk, rowA && rowA.atk]);
  // a carrier wing repairs at 20% a day
  { const {R: R2, S, G, sea} = game(), z = sea(SEAT), cv = R2.addArmy(SEAT, z, {carr:1}), w = R2.addArmy(SEAT, z, {jet:2}); w.air = {base:z, cd:0, car:cv.id, wear:0.3};
    ok(R2.maintRate(w) === 0.2, 'a wing aboard a carrier repairs 20% a day', R2.maintRate(w)); }
}
function CLASSESv(R, o, t){ const v = {}; for (const k of R.CLASSES) v[k] = R.multO(o, t, k); return v; }

// ---- 2. the final level of every line: 15% faster training
{ const {R, S, cap} = game();
  const WANT = {inf:'inf_g3', at:'at_pr', spec:'spec_pr', ifv:'ifv_pr', tank:'tank_g3', art:'art_pr', mlrs:'mlrs_pr', sam:'sam_pr', jam:'jam_pr', heli:'heli_pr', para:'para_pr', int:'int_pr', jet:'jet_pr',
    asf:'asf_pr', drone:'drone_g5', swarm:'swarm_pr', sdrone:'sdrone_pr', bomb:'bomb_pr', stealth:'stealth_pr', mpa:'mpa_pr', awacs:'awacs_pr', frig:'frig_pr', crui:'crui_pr', carr:'carr_pr', sub:'sub_pr'};
  ok(Object.keys(R.R_FINAL).length === 25 && Object.keys(WANT).every(t => R.R_FINAL[t] && R.R_FINAL[t].id === WANT[t] && R.R_FINAL[t].lv === (/_pr$/.test(WANT[t]) ? 3 : 1)),
    'the final level of each of the 25 lines is the review\'s (section 3 table)', R.R_FINAL);
  for (const t in R.R_FINAL){ const f = R.R_FINAL[t], L = R.RN[f.id].lv[f.lv - 1];
    ok(/and trains 15% faster$/.test(L.txt) && L.train === 0.85, `${t}: the final level's card says "and trains 15% faster"`, L.txt);
    const others = line(R, t).flatMap(nd => nd.lv.map((x, i) => ({nd, i}))).filter(x => !(x.nd.id === f.id && x.i === f.lv - 1));
    ok(others.every(x => !x.nd.lv[x.i].train && !/trains/.test(x.nd.lv[x.i].txt)), `${t}: no other step of the line speeds up training`); }
  for (const o of [SEAT, AI]){ const N = S.nations[o], p = cap(o);
    // every step of the infantry and tank lines but the last leaves the training time alone; the last cuts it 15% (before rounding)
    for (const t of ['inf', 'tank']){ const f = R.R_FINAL[t], h0 = R.trainH(p, t, o);
      for (const nd of line(R, t)) for (let l = 1; l <= nd.lv.length; l++) if (!(nd.id === f.id && l === f.lv)){ R.rGrant(N, nd.id, l); }
      ok(R.rTrainF(o, t) === 1 && R.trainH(p, t, o) === h0, `nation ${o}: ${t}: every step but the final level leaves training time at ${h0} h`, [R.rTrainF(o, t), R.trainH(p, t, o)]);
      R.rGrant(N, f.id, f.lv); ok(R.rTrainF(o, t) === 0.85, `nation ${o}: ${t}: the final level makes it train 15% faster`);
      const raw = R.UNITS[t].build; ok(R.trainH(p, t, o) <= Math.round(h0*0.85 + 1) && R.trainH(p, t, o) < h0, `nation ${o}: ${t}: a new order takes about 85% of the time`, [h0, R.trainH(p, t, o), raw]); } }
}

// ---- 3. every step of every unit line changes its unit live, wherever the unit is, for a person's nation and a computer nation
{ const {R, S, G, cap, sea} = game();
  const TYPE = t => R.UNITS[t].cls === 'air' ? 'air' : R.UNITS[t].cls === 'naval' ? 'naval' : 'ground';
  // what the rules read for a force of one type: its stats, its counters, the worded upgrades of its line, and the force's own strength and speed
  function fp(o, t, a){ const v = {}; for (const k of ['atk', 'def', 'spd', 'hp', 'rng']) v['st.' + k] = R.st(o, t, k); for (const k of R.CLASSES) v['vs.' + k] = R.multO(o, t, k);
    Object.assign(v, {sight:R.rSightF(o, t), range:R.rRangeKm(o, t), train:R.rTrainF(o, t), flight:R.rAirSpdF(o, t), pack:R.rPack(o, t), power:R.power(a)});
    if (a.air) Object.assign(v, {wingSpd:R.wingSpd(a), wingRange:R.wingRange(a)}); else v.walk = R.walkSpeed(a, a.at);
    if (t === 'drone') v.uav = R.uavLv(o); if (t === 'sam') v.samNear = R.rSamNear(o); if (t === 'jam') v.jam = R.rJamF(o); if (t === 'sdrone'){ v.ko = R.rKoHours(o); v.ad = R.rAdF(o, t); }
    if (t === 'bomb' || t === 'stealth') v.bombs = R.rBombF(o, t); if (t === 'mpa'){ v.mpaR = R.rMpaR(o); v.mpaH = R.rMpaH(o); } if (t === 'awacs'){ v.aewR = R.rAewR(o); v.aewF = R.rAewF(o); }
    if (t === 'spec'){ v.terr = R.rSpecTerr(o, 1.4); v.drop = R.dropOnly(a); } if (t === 'para') v.dropR = R.dropRange(a);
    if (t === 'inf' || t === 'tank'){ v.forest = R.rDrilled(a, 'forest'); v.mountain = R.rDrilled(a, 'mountain'); }
    // upgrades the rules read with has() at the moment they act (vision.js, combat.js, tick.js): by nation and type, so live by construction
    for (const [u, id] of [['frig', 'frig_sonar'], ['crui', 'crui_rng'], ['ifv', 'ifv_terr'], ['awacs', 'awacs_g2']]) if (t === u) v[id] = R.has(o, id);
    return JSON.stringify(v); }
  let steps = 0; const unarmed = new Set();
  for (const o of [SEAT, AI]){ const N = S.nations[o], p = cap(o), z = sea(o);
    for (const t of R.UT){ const kind = TYPE(t), F = [];
      if (kind === 'ground'){ F.push(['on land', R.addArmy(o, p, {[t]:3})], ['embarked at sea', R.addArmy(o, z, {[t]:3})]); }
      else if (kind === 'naval') F.push(['at sea', R.addArmy(o, z, {[t]:2})]);
      else { const b = R.addArmy(o, p, {[t]:2}); b.air = {base:p, cd:0};
        const cv = R.addArmy(o, z, {carr:1}), c = R.addArmy(o, z, {[t]:2}); c.air = {base:z, cd:0, car:cv.id};
        const f = R.addArmy(o, p, {[t]:2}); f.air = {base:p, cd:0}; f.fly = {tgt:z, kind:'patrol', ph:'out', t:0.2, hrs:0};
        F.push(['at its airbase', b], ['aboard a carrier', c], ['in flight', f]); }
      for (const nd of line(R, t)) for (let l = 1; l <= nd.lv.length; l++){
        // (Firepower on a unit with no attack yet, the unarmed Recon UAV before UAV IV, multiplies nothing until the unit has one: checked below)
        const idle = nd.eng === 'fp' && R.st(o, t, 'atk') === 0; if (idle) unarmed.add(`${t} Firepower ${l}`);
        const before = F.map(([, a]) => fp(o, t, a)); R.rGrant(N, nd.id, l); steps++;
        if (!idle) F.forEach(([where, a], i) => ok(fp(o, t, a) !== before[i], `${o === SEAT ? 'person' : 'computer'} nation: ${R.RN[nd.id].name}${nd.lv.length > 1 ? ' ' + l : ''} (${nd.id}) changes a ${t} force ${where} at once`)); }
      if (t === 'drone'){ const base = R.UNITS.drone.atk + 3 + 2; ok(near(R.st(o, 'drone', 'atk'), base*1.4), `nation ${o}: the armed UAV's attack carries Firepower 3 (x1.4) once it has missiles`, R.st(o, 'drone', 'atk')); } } }
  ok(steps === 2*249, 'every one of the 249 unit-line steps was checked for both nations', steps);
  ok([...unarmed].join() === 'drone Firepower 1,drone Firepower 2,drone Firepower 3', 'only the Recon UAV\'s Firepower meets a unit with no attack (in tree order; by day, levels 1 and 2 come before UAV IV)', [...unarmed]);
}

// ---- 4. the gaps
// G1: flight speed
{ const {R, S, G, cap, sea} = game();
  for (const o of [SEAT, AI]){ const N = S.nations[o], p = cap(o);
    for (const [t, id, f] of [['int', 'int_g2', 1.1], ['bomb', 'bomb_g2', 4/3]]){
      const far = G.P.filter(P => P.sea || S.owner[P.id] === o).sort((x, y) => R.hexDist(G.P[p].cc, y.cc) - R.hexDist(G.P[p].cc, x.cc)).find(P => R.hexDist(G.P[p].cc, P.cc) <= 10) || G.P[p];
      const w = R.addArmy(o, p, {[t]:2}); w.air = {base:p, cd:0}; const card0 = R.unitStrength(o, t).spd, s0 = R.wingSpd(w), c0 = R.airCheck(w, far.id), h0 = c0.hours;
      const fl = R.addArmy(o, p, {[t]:2}); fl.air = {base:p, cd:0}; fl.fly = {tgt:far.id, kind:'patrol', ph:'out', t:0, hrs:0};
      const tick = () => { const t0 = fl.fly.t; R.airTick(); return fl.fly.t - t0; }, d0 = tick();
      R.rGrant(N, id, 1);
      ok(near(R.wingSpd(w)/s0, f, 1e-9), `nation ${o}: ${R.RN[id].name}: the wing flies ${Math.round((f - 1)*100)}% faster`, [s0, R.wingSpd(w)]);
      ok(near(R.unitStrength(o, t).spd/card0, f, 0.02), `nation ${o}: the stats card shows the faster flight speed`, [card0, R.unitStrength(o, t).spd]);
      const d1 = tick(); ok(near(d1/d0, f, 1e-9), `nation ${o}: a ${t} wing already in flight covers ${Math.round((f - 1)*100)}% more of its way the next hour`, [d0, d1]);
      const h1 = R.airCheck(w, far.id).hours; ok(h1 <= h0 && h1 === Math.max(1, Math.ceil(R.hexDist(G.P[p].cc, far.cc)/R.wingSpd(w))), `nation ${o}: ${t}: the mission hours shown before an order use the new speed`, [h0, h1, c0.why]);
      ok(R.rAirSpdF(o, t) === f || near(R.rAirSpdF(o, t), f), `nation ${o}: rAirSpdF ${t} = ${f}`); }
    ok(R.rAirSpdF(o, 'jet') === 1 && R.rAirSpdF(o, 'asf') === 1, `nation ${o}: aircraft without a speed upgrade keep their speed`); }
  // a shortage of oil does not slow aircraft (st() slows ground units; flight speed reads only research)
  { const o = SEAT, w = R.addArmy(o, cap(o), {int:2}); w.air = {base:cap(o), cd:0}; const v0 = R.wingSpd(w); S.nations[o].short = {oil:true}; S.nations[o].tv++; ok(R.wingSpd(w) === v0, 'an oil shortage does not change flight speed'); S.nations[o].short = {}; S.nations[o].tv++; }
}
// G2 and G5: one swarm card is six drones, new or fielded, for everyone
{ const {R, S, cap} = game();
  for (const o of [SEAT, AI]){ R.rGrant(S.nations[o], 'u_swarm', 1); R.rGrant(S.nations[o], 'swarm_tb', 1);
    const before = R.armiesOf(o).filter(a => a.u.swarm).reduce((s0, a) => s0 + a.u.swarm, 0); R.spawn(o, cap(o), 'swarm');
    const after = R.armiesOf(o).filter(a => a.u.swarm).reduce((s0, a) => s0 + a.u.swarm, 0);
    ok(after - before === 6 && R.rPack(o, 'swarm') === 6, `nation ${o}: a new card is six drones`, after - before);
    const old = R.addArmy(o, cap(o), {swarm:16}); old.air = {base:cap(o), cd:0}; ok(R.stackSizes(old).air === 3, `nation ${o}: a fielded wing of 16 drones counts as 3 cards of six`, R.stackSizes(old)); }
  const ai = fs.readFileSync(path.join(ROOT, 'rules/ai.js'), 'utf8');
  ok(/for \(const it of S\.queue\[p\]\) if \(!it\.msl && UNITS\[it\.t\]\) cnt\[it\.t\] = \(cnt\[it\.t\] \|\| 0\) \+ rPack\(n, it\.t\)/.test(ai), 'G5: the computer counts a queued card as rPack units, what spawn makes of it');
}
// G3: units in a queue train faster the moment the final level is done, keeping the share already trained
{ const {R, S, cap} = game();
  for (const o of [SEAT, AI]){ const N = S.nations[o], p = cap(o), q = S.queue[p]; q.length = 0;
    q.push({t:'inf', h:20, h0:24}, {t:'tank', h:40, h0:48}, {t:'inf', h:24, h0:24});
    R.rGrant(N, 'inf_g2', 1); ok(q[0].h === 20 && q[2].h === 24, `nation ${o}: a step that is not the final level leaves the queue alone`);
    R.rGrant(N, 'inf_g3', 1);
    ok(q[0].h === 17 && q[0].h0 === 20 && q[2].h === 20 && q[2].h0 === 20, `nation ${o}: queued infantry: the hours left drop 15% at once (20 -> 17, 24 -> 20)`, q);
    ok(Math.abs((q[0].h0 - q[0].h)/q[0].h0 - 4/24) < 1/q[0].h0, `nation ${o}: the share already trained is kept (within an hour's rounding)`, q[0]);
    ok(q[1].h === 40 && q[1].h0 === 48, `nation ${o}: queued tanks are not affected by the infantry's final level`, q[1]);
    // the research slot finishing (the normal way) does the same
    q.length = 0; q.push({t:'tank', h:30, h0:48}); R.rGrant(N, 'tank_g2', 1); N.research = {id:'tank_g3', lv:1, h:1, h0:192}; R.researchSlotHour(N, 'research');
    ok(R.rLevel(o, 'tank_g3') === 1 && q[0].h === 26 && q[0].h0 === 41, `nation ${o}: Next-Generation MBT finishing in a research slot cuts the queued tank 30 -> 26 h`, q[0]);
    // and the unit comes out sooner than without the step
    const h = q[0].h; let hrs = 0; while (q.length && hrs < 100){ R.prodHour(p); hrs++; } ok(hrs === h, `nation ${o}: the queued tank comes out after the shortened ${h} h`, hrs); }
}
// G4: a walk inside a province and a leg between provinces go on at the new speed at once
{ const {R, S, G, cap} = game();
  for (const o of [SEAT, AI]){ const N = S.nations[o];
    // the biggest land province of the nation: walk across it
    const p = R.ownedBy(o).filter(q => !G.P[q].sea).sort((x, y) => G.P[y].cells.length - G.P[x].cells.length)[0], P = G.P[p];
    const mk = () => { const a = R.addArmy(o, p, {inf:3}); a.pos = [P.x, P.y]; return a; };
    // a spot as far from the heart as the province allows (orderSpot keeps it inside the province) that is 4 h or more away
    const A = mk(), B = mk(); let tgt = null;
    for (const r of [400, 300, 200, 150, 100, 60, 40, 20]){ for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7]]){
        const x = P.x + dx*r, y = P.y + dy*r; if (R.orderSpot(A, x, y) && A.sail && A.sail.h >= 4){ tgt = [x, y]; break; } delete A.sail; } if (tgt) break; }
    if (!tgt){ ok(false, `nation ${o}: found a walk of 4 h or more inside province ${p}`); continue; }
    R.orderSpot(B, tgt[0], tgt[1]); const h0 = R.sailHours(A); R.sailHour(A); R.sailHour(B); const t1 = A.sail.t, left0 = R.sailHours(A), v0 = R.walkSpeed(A, p);
    R.rGrant(N, 'inf_g2', 1);   // Mechanized Infantry: speed 4 -> 5
    const v1 = R.walkSpeed(A, p); ok(v1 > v0, `nation ${o}: Mechanized Infantry makes the infantry walk faster`, [v0, v1]);
    ok(A.sail.t === t1 && R.sailHours(A) < left0, `nation ${o}: a walk under way keeps what it has done and needs fewer hours for the rest`, [left0, R.sailHours(A)]);
    let ha = 0, hb = 0; while (A.sail && ha < 200){ R.sailHour(A); ha++; } while (B.sail && hb < 200){ R.sailHour(B); hb++; }
    ok(ha === hb && ha < h0 - 1, `nation ${o}: both forces walking when the step finished arrive at the same, earlier hour`, [h0, ha, hb]);
    // a leg between two provinces: the hours of the leg are read every hour
    const nb = P.nbs.find(q => !G.P[q].sea); if (nb == null) continue;
    const L = R.addArmy(o, p, {tank:2}); L.to = nb; L.t = 0.3; const lh0 = R.legH(L); R.rGrant(N, 'tank_eng', 1); const lh1 = R.legH(L);
    ok(lh1 < lh0, `nation ${o}: Turbine Engines shorten the leg a tank force is on at once`, [lh0, lh1]); }
}

// ---- 5. an old save from before the review
{ const R = load(), api = R.IM.api, js = fs.readFileSync(path.join(__dirname, 'fixtures/upgrades-oldsave.json'), 'utf8'), old = JSON.parse(js);
  ok(old.nations[0].tech.inf_build === 2 && old.nations[0].tech.swarm_pack === 1 && old.nations[0].tech.carr_deck === 1 && old.nations[0].research2.id === 'carr_deck', 'the fixture holds the old nodes (master 76c89ca)', old.nations[0].tech);
  ok(api.restore(JSON.parse(js)), 'the old save loads', R.IM.api.restore.why);
  const S = R.S, T0 = S.nations[0].tech, T1 = S.nations[1].tech;
  ok(!['inf_build', 'swarm_pack', 'carr_deck'].some(id => id in T0 || id in T1), 'no old node is left in any nation\'s research');
  ok(T0.inf_kit === 2 && T0.swarm_tb === 1 && T0.carr_ciws === 1, 'the seat\'s levels became the same levels of the replacements', T0);
  ok(T1.inf_kit === 1 && T1.swarm_tb === 1, 'the computer nation\'s too', T1);
  ok(S.nations[0].research2 && S.nations[0].research2.id === 'carr_ciws' && S.nations[0].research2.lv === 2 && S.nations[0].research2.h === 30, 'the running Flight-Deck Crews 2 carries on as Close-In Defence 2 with its 30 h left', S.nations[0].research2);
  const D = R.desk(0), msg = (D.log || []).find(e => /Research update/.test(e.text));
  ok(msg && /Rapid Mobilisation is now Infantry Kit 2/.test(msg.text) && /Bigger Salvo is now Thermobaric Warheads/.test(msg.text) && /Flight-Deck Crews is now Close-In Defence 1/.test(msg.text), 'the seat is told what became of each', msg && msg.text);
  ok(R.st(0, 'inf', 'hp') === R.UNITS.inf.hp + 2 + 2 && R.multO(0, 'inf', 'armored') === 0.7, 'the converted Infantry Kit 2 works (health +2 on top of Mechanized Infantry, damage to armour 0.7x)', [R.st(0, 'inf', 'hp'), R.multO(0, 'inf', 'armored')]);
  const w = S.armies.find(a => a.owner === 0 && a.u.swarm); ok(w && w.u.swarm === 16 && R.stackSizes(w).air === 3 && R.rPack(0, 'swarm') === 6, 'the fielded drones are all kept; the wing counts as cards of six', w && [w.u.swarm, R.stackSizes(w)]);
  const cap = S.nations[0].capital, q0 = JSON.stringify(S.queue[cap]); ok(/"t":"inf"/.test(q0) && /"t":"swarm"/.test(q0), 'the queue is kept', q0);
  let err = null; try { for (let h = 0; h < 48; h++) for (let k = 0; k < api.BATTLE_Q; k++) api.tickQ(); } catch (e){ err = e; }
  ok(!err, 'the old save plays on two days', err && String(err.stack).slice(0, 300));
  ok(S.nations[0].tech.carr_ciws === 2, 'the running project finished as Close-In Defence 2', S.nations[0].tech);
  const again = api.saveJSON(), R2 = load(); ok(R2.IM.api.restore(JSON.parse(again)), 'saved and loaded again');
  ok(JSON.stringify(R2.S.nations[0].tech) === JSON.stringify(S.nations[0].tech) && !(R2.desk(0).log || []).filter(e => /Research update/.test(e.text)).slice(1).length, 'a second load changes nothing and says nothing more');
}

console.log(`${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
