// The Air Superiority Fighter's Attack order and the wing orders added with it (FIGHTER-ASF, owner playtest 2026-11-27, item 2), plain Node:
//   node .test/asf-attack.js        (exit 0 when every check holds; about 20 s)
// 1. the numbers (owner 2026-11-28: "about 1 HP of damage per strike ... as a plain attack number in its stats"): ASF_ATTACK.atk is 1, UNITS.asf
//    reads it against soft, armoured and naval targets (atk / 9), Army Info (unitStrength) shows 1 against infantry, armour, ships and
//    submarines, the air rows and air-to-air (attack 9 x vs air 3.0, vsU) unchanged
// 2. the order (rules/air.js airCheck / orderAir with want 'strike'): an ASF wing may Attack enemy forces (kind 'strike'), the same tap without
//    want is still a patrol; refused on its own land with no enemy there, on a nation it is not at war with, out of range; an Interceptor or an
//    AWACS cannot Attack; a Strike Fighter's own strike is unchanged
// 3. the damage (the real resolveStrike, 400 sorties of one aircraft each): about 1 HP a sortie on one infantry, one tank, one artillery in the
//    open and on a frigate (0.75 to 1.25), troops at sea 1.5x that without warships (AT_SEA; escorted: 10), and it never cuts road or
//    rail links nor adds war damage (ASF_ATTACK.links);
//    3b: on a sea zone it records no convoy raid (S.trade.air), where a Strike Fighter does
// 4. a whole Attack sortie through the hours (tick): out, the strike, the hour over the target, back, 6 h rearming; the foe lost health
// 5. Return (recallAir): a wing flying out turns back from where it is, one on patrol heads home at once, both land and rearm
// 6. Split and Merge for wings (splitWing, mergeWings): half the aircraft leave with the same base, rearm hours and wear; wings of one type
//    parked at one base merge (the longer rearm, the wear averaged), other types stay apart
// 7. saves: an ASF wing on patrol saved by origin/master's rules (git show) loads into this build and keeps patrolling, then comes home
// 8. the Strike Fighter's Patrol (owner 2026-11-28, "like Conflict of Nations"; rules/air.js jetPatrol, want 'patrol'): allowed over its own land,
//    over enemy forces (a patrol, not a strike), over its home airbase and over a nation it is not at war with; refused for helicopters,
//    bombers, AWACS, maritime patrol and drones; a whole patrol through the hours; while on patrol it is one of the fighters over that province
//    and its neighbours (capOver), not on a strike; it shoots down enemy bombers there with its own air-to-air numbers (fewer than an Air
//    Superiority Fighter, more than no patrol at all) and hunts a loitering AWACS; its Strike is unchanged
// 9. HARASSMENT (owner 2026-11-28, rules/air.js provNow, foesIn, asfHome): (a) troops at sea sailing between sea zones and (b) infantry marching
//    towards our capital, both on a leg (not standing anywhere, so no strike found them before): the Attack is allowed on them, sent at the force
//    (fly.foe) it hits it, about 1 HP (1.5 at sea), and they keep going; a Strike Fighter's strike still hits only forces standing there; the
//    wing follows its force into the next province, not beyond its range (it flies on and reports that the force moved out of reach); a target
//    destroyed meanwhile: it hits the others there
// 10. the at-sea factor in air strikes (AT_SEA, rules/combat.js atSeaF): a Strike Fighter's strike on troops at sea, alone and escorted, the same
//    factors as a battle at sea (rules/tick.js); the UAV salvo too
// 11. air-to-air identical to the build before the change (4daba2a, git show): 300 bomber raids into an ASF patrol, 300 Strike Fighter raids into
//    one, an AWACS hunted, the same seed: the same HP to the decimal; Army Info's air rows for the ASF the same
// 12. an old save (4daba2a's rules) with an ASF in the middle of an Attack loads and the strike lands, with this build's damage
// 13. fog of war (repair 1): an Attack sent at a contact its nation has not identified (a '?' plate: rules/vision.js armyKnown false) names no
//    nation anywhere: the strike report on an unidentified hostile convoy reads 'Attack on unidentified forces at sea in ...' (an identified one
//    still 'Attack on <Nation> troops at sea in ...'); a '?' convoy of a nation at peace: the order is taken without 'You are not at war with
//    <Nation>' (an identified one is refused with it), the wing follows it (trailOf) and hits nothing, no war starts, and the report names no
//    nation ('found no targets (the contact it was sent at was not hostile)')
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const EXP = '\nreturn {IM, get S(){ return S; }, get G(){ return G; }, UNITS, ASF_ATTACK: typeof ASF_ATTACK === "undefined" ? null : ASF_ATTACK, setRel, addArmy, count, armyHP, effHP, resolveStrike, removeEmpty, airCheck, capOver: typeof capOver === "undefined" ? null : capOver, loiterHour: typeof loiterHour === "undefined" ? null : loiterHour, nbs: p => G.P[p].nbs, orderAir, wingRange, hexDist, stationaryAt, S_dmg: () => S.dmg, unitStrength, AT_SEA: typeof AT_SEA === "undefined" ? null : AT_SEA, provNow: typeof provNow === "undefined" ? null : provNow, foesIn: typeof foesIn === "undefined" ? null : foesIn, asfHome: typeof asfHome === "undefined" ? null : asfHome, orderMove, armyById, uavSalvo,'
  + ' recallAir: typeof recallAir === "undefined" ? null : recallAir, splitWing: typeof splitWing === "undefined" ? null : splitWing, mergeWings: typeof mergeWings === "undefined" ? null : mergeWings,'
  + ' armyKnown, visibleSet, nationName, atWar, trailOf: typeof trailOf === "undefined" ? null : trailOf, resetVis: () => { visCache = null; }};';
const srcOf = read => { const html = read('index.html'); const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]); return "'use strict';\n" + FILES.map(read).join('\n') + EXP; };
const load = () => new Function(srcOf(f => fs.readFileSync(path.join(ROOT, f), 'utf8')))();
let bad = 0, n = 0; const ok = (c, msg, info) => { n++; if (!c){ bad++; console.log('FAIL  ' + msg + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 400) : '')); } else if (process.env.V) console.log('ok    ' + msg + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 200) : '')); };
const SEATS = Array.from({length:15}, (_, i) => i);   // every nation a seat: no computer moves anything during the checks

// a game with nation 0's capital wing, an enemy province next to it (nation 1, at war) and one of our own provinces
function setup(R){ const api = R.IM.api; api.newGame(4242, 0, SEATS); const S = R.S, G = R.G; S.started = true;
  const land = v => !G.P[v].sea, base = G.P.find(q => land(q.id) && S.owner[q.id] === 0 && q.city && S.bld[q.id].air) || G.P.find(q => land(q.id) && S.owner[q.id] === 0 && q.city);
  if (!S.bld[base.id].air) S.bld[base.id].air = 1;
  const foeP = G.P.filter(q => land(q.id) && S.owner[q.id] === 1 && !q.city).sort((a, b) => R.hexDist(base.cc, a.cc) - R.hexDist(base.cc, b.cc))[0];
  const ownP = G.P.find(q => land(q.id) && S.owner[q.id] === 0 && q.id !== base.id && R.hexDist(base.cc, q.cc) <= 4);
  R.setRel(0, 1, 'war'); return {api, S, G, base:base.id, foeP:foeP.id, ownP:ownP.id}; }
const wingAt = (R, base, t, k = 1) => { const w = R.addArmy(0, base, {[t]:k}); w.air = {base, cd:0}; w.m = 80; return w; };

// ---- 1. the numbers
{ const R = load(), A = R.ASF_ATTACK, vs = R.UNITS.asf.vs, E = setup(R);
  ok(A && A.atk === 1 && A.links === false && Object.keys(A).length === 2, 'ASF_ATTACK is one plain attack number, 1, and no links', A);
  ok([vs.soft, vs.armored, vs.naval].every(v => Math.abs(v*R.UNITS.asf.atk - A.atk) < 1e-12), 'UNITS.asf uses it against the ground and the sea (atk / 9 each)', vs);
  ok(vs.air === 3.0 && R.UNITS.asf.atk === 9 && R.UNITS.asf.vsU.bomb === 3.0 && R.UNITS.asf.vsU.awacs === 3.0, 'air-to-air unchanged (vs air 3.0, attack 9, vs bombers and AWACS 3.0)', vs);
  const rows = R.unitStrength(0, 'asf', {u_asf:1}).rows, at = k => rows.find(r => r.k === k).atk;
  console.log('Army Info, ASF attack by row:', JSON.stringify(Object.fromEntries(rows.map(r => [r.k, r.atk == null ? null : +r.atk.toFixed(2)]))));
  ok(['inf', 'armor', 'ship', 'sub'].every(k => Math.abs(at(k) - 1) < 1e-9), 'Army Info shows attack 1 against infantry, armour, ships and submarines', rows.map(r => [r.k, r.atk]));
  const inf = R.unitStrength(0, 'inf', {}).rows.find(r => r.k === 'inf').atk, tank = R.unitStrength(0, 'tank', {}).rows.find(r => r.k === 'armor').atk, jet = R.unitStrength(0, 'jet', {u_jet:1}).rows.find(r => r.k === 'inf').atk;
  ok(inf === 3 && tank === 6 && Math.abs(jet - 9.6) < 1e-9, 'on the same scale as every unit: Motorized Infantry 3, Main Battle Tank 6, a Strike Fighter 9.6 against infantry', {inf, tank, jet}); }

// ---- 2. the order
{ const R = load(), E = setup(R), S = E.S; S.armies = S.armies.filter(a => !a.air);
  const foe = R.addArmy(1, E.foeP, {inf:2}), w = wingAt(R, E.base, 'asf');
  const c0 = R.airCheck(w, E.foeP), c1 = R.airCheck(w, E.foeP, null, 'strike');
  ok(c0.ok && c0.kind === 'patrol', 'an ASF wing sent over enemy forces without Attack still patrols', c0);
  ok(c1.ok && c1.kind === 'strike', 'with Attack (want strike) it strikes them', c1);
  const c2 = R.airCheck(w, E.ownP, null, 'strike');
  ok(!c2.ok && /No enemy forces/.test(c2.why), 'Attack on its own land with no enemy there is refused', c2);
  R.addArmy(1, E.ownP, {inf:1}); const c2b = R.airCheck(w, E.ownP, null, 'strike');
  ok(c2b.ok && c2b.kind === 'strike', 'Attack on enemy forces standing on its own land is allowed', c2b);
  R.setRel(0, 1, 'peace'); const c3 = R.airCheck(w, E.foeP, null, 'strike'), c3s = R.airCheck(w, E.foeP, [1], 'strike'); R.setRel(0, 1, 'war');
  ok(!c3.ok && /not at war/.test(c3.why), 'Attack on a nation it is not at war with is refused', c3);
  ok(c3s.ok && c3s.kind === 'strike', 'unless the player confirms a surprise attack on it (surprise list)', c3s);
  const far = E.G.P.find(q => !q.sea && R.hexDist(E.G.P[E.base].cc, q.cc) > R.wingRange(w) + 1 && R.stationaryAt(q.id).length);
  if (far){ const c4 = R.airCheck(w, far.id, null, 'strike'); ok(!c4.ok && /Out of range/.test(c4.why), 'Attack out of range is refused', c4); }
  const wi = wingAt(R, E.base, 'int'), ci = R.airCheck(wi, E.foeP, null, 'strike'), wa = wingAt(R, E.base, 'awacs'), ca = R.airCheck(wa, E.foeP, null, 'strike');
  ok(!ci.ok && !ca.ok, 'an Interceptor or an AWACS cannot Attack', [ci, ca]);
  const wj = wingAt(R, E.base, 'jet'), cj = R.airCheck(wj, E.foeP), cj2 = R.airCheck(wj, E.foeP, null, 'strike');
  ok(cj.ok && cj.kind === 'strike' && cj2.ok && cj2.kind === 'strike', 'a Strike Fighter strikes as before, with or without Attack', [cj, cj2]);
  ok(R.orderAir(w, E.foeP, 'strike') && w.fly.kind === 'strike' && w.fly.ph === 'out', 'orderAir(wing, p, "strike") sends the ASF on a strike', w.fly);
  ok(!R.orderAir(wingAt(R, E.base, 'asf'), E.base, 'strike'), 'Attack on its own airbase with no enemy is refused'); }

// ---- 3. the damage, the real resolveStrike (one aircraft a sortie, open plains, morale 80, flying an Attack)
{ const R = load(), E = setup(R), S = E.S, G = E.G, P = G.P[E.foeP]; P.terrain = 'plains'; P.river = new Set();
  const z = G.P.filter(q => q.sea && R.hexDist(G.P[E.base].cc, q.cc) <= 5).sort((a, b) => R.hexDist(G.P[E.base].cc, a.cc) - R.hexDist(G.P[E.base].cc, b.cc))[0].id;
  const run = (T, tgt, p = E.foeP, N = 400) => { let dealt = 0, cut = 0, dmg = 0;
    for (let i = 0; i < N; i++){ S.armies = S.armies.filter(a => a.owner !== 1 && !a.air); const D = R.addArmy(1, p, {...tgt}); D.still = S.hour; const h0 = R.effHP(D);
      if (!G.P[p].sea) for (const r of G.P[p].lk.values()) r.dmg = 0; const d0 = (S.dmg && S.dmg[p]) || 0;
      const w = wingAt(R, E.base, T); w.fly = {tgt:p, kind:'strike', ph:'out', t:1, hrs:0}; R.resolveStrike(w, p);
      dealt += h0 - R.effHP(D);
      if (!G.P[p].sea) for (const r of G.P[p].lk.values()) if (r.dmg > 0) { cut++; break; } dmg += ((S.dmg && S.dmg[p]) || 0) - d0; if (S.dmg) S.dmg[p] = 0; }
    return {hp:+(dealt/N).toFixed(3), cutShare:+(cut/N).toFixed(2), warDmg:+(dmg/N).toFixed(2)}; };
  const out = {inf:run('asf', {inf:1}), tank:run('asf', {tank:1}), art:run('asf', {art:1}), frig:run('asf', {frig:1}, z), sub:run('asf', {sub:1}, z), infSea:run('asf', {inf:1}, z), jetInf:run('jet', {inf:1})};
  console.log('ASF sorties, HP dealt per sortie by one aircraft:', JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.hp]))));
  for (const k of ['inf', 'tank', 'art', 'frig']) ok(out[k].hp > 0.75 && out[k].hp < 1.25, `about 1 HP a sortie on ${k === 'frig' ? 'a frigate' : k === 'inf' ? 'infantry' : k === 'tank' ? 'a tank' : 'artillery'}`, out[k]);
  ok(out.infSea.hp/out.inf.hp > 1.35 && out.infSea.hp/out.inf.hp < 1.65, 'infantry at sea without warships: 1.5x what it takes on land', {sea:out.infSea.hp, land:out.inf.hp});
  ok(out.jetInf.hp > 8, '(a Strike Fighter still does about 9.4 on infantry)', out.jetInf);
  ok(out.inf.cutShare === 0 && out.tank.cutShare === 0 && out.inf.warDmg === 0, 'the ASF never cuts roads or rails and adds no war damage (ASF_ATTACK.links false)', out.inf);
  ok(run('jet', {inf:1}, E.foeP, 60).cutShare > 0.5, 'a Strike Fighter still cuts them'); }

// ---- 3b. a sea Attack is no convoy raid (polish 1): an ASF striking ships in a sea zone records no trade raid there (S.trade.air, rules/trade.js
//      trRaidMap), where a Strike Fighter's strike does (one ASF's raid weight, power(a), was 11.2 against a Strike Fighter's 7.9)
{ const R = load(), E = setup(R), S = E.S, G = E.G; S.armies = S.armies.filter(a => !a.air);
  const z = G.P.filter(q => q.sea && R.hexDist(G.P[E.base].cc, q.cc) <= 5).sort((a, b) => R.hexDist(G.P[E.base].cc, a.cc) - R.hexDist(G.P[E.base].cc, b.cc))[0];
  if (!z || !S.trade){ ok(false, 'a sea zone within reach and trade state for the sea Attack check', {z:!!z, trade:!!S.trade}); }
  else { const raid = T => { S.armies = S.armies.filter(a => !a.air && a.owner !== 1); delete S.trade.air[z.id]; const D = R.addArmy(1, z.id, {frig:1}); D.still = S.hour;
      R.resolveStrike(wingAt(R, E.base, T), z.id); return S.trade.air[z.id] ? S.trade.air[z.id].pw : 0; };
    const ra = raid('asf'), rj = raid('jet');
    ok(ra === 0 && rj > 0, 'an ASF Attack on ships records no convoy raid; a Strike Fighter strike still does', {asf:ra, jet:rj}); } }

// ---- 4. a whole Attack sortie, hour by hour
{ const R = load(), E = setup(R), S = E.S; S.armies = S.armies.filter(a => !a.air && a.owner !== 1);
  const foe = R.addArmy(1, E.foeP, {inf:3}), h0 = R.effHP(foe), w = wingAt(R, E.base, 'asf', 2);
  ok(R.orderAir(w, E.foeP, 'strike'), 'Attack ordered');
  const seen = []; let h = 0; for (; h < 30 && (w.fly || !seen.length); h++){ E.api.tick(); seen.push(w.fly ? w.fly.ph : 'home'); }
  ok(seen.includes('over') && seen.includes('back') && !w.fly, 'the sortie flies out, strikes, holds over the target, comes back', seen);
  ok(w.air.cd >= 5 && w.air.cd <= 6, 'and rearms 6 h on landing', w.air.cd);
  ok(R.effHP(foe) < h0 - 0.5 || !R.count(foe), 'the enemy force lost health', {h0, now:R.effHP(foe)}); }

// ---- 5. Return
{ const R = load(), E = setup(R), S = E.S; S.armies = S.armies.filter(a => !a.air);
  ok(typeof R.recallAir === 'function', 'recallAir exists');
  const far = E.G.P.filter(q => !q.sea && S.owner[q.id] === 0 && R.hexDist(E.G.P[E.base].cc, q.cc) >= 6 && R.hexDist(E.G.P[E.base].cc, q.cc) <= 10)[0];
  const w = wingAt(R, E.base, 'asf'); ok(R.orderAir(w, far.id), 'a patrol ordered 6-10 hexes out', R.hexDist(E.G.P[E.base].cc, far.cc));
  E.api.tick(); const t1 = w.fly.t; ok(w.fly.ph === 'out' && t1 > 0 && t1 < 1, 'it is on its way out', w.fly);
  ok(R.recallAir(w) && w.fly.ph === 'back' && Math.abs(w.fly.t - (1 - t1)) < 1e-9, 'Return: it turns back from where it is', w.fly);
  ok(!R.recallAir(w), 'a second Return changes nothing (already flying back)');
  let h = 0; while (w.fly && h < 20){ E.api.tick(); h++; } ok(!w.fly && w.at === E.base && w.air.cd >= 5, 'it lands at its base and rearms', {h, at:w.at, cd:w.air.cd});
  w.air.cd = 0; ok(R.orderAir(w, E.ownP), 'a patrol over its own province'); h = 0; while (w.fly && w.fly.ph !== 'patrol' && h < 10){ E.api.tick(); h++; }
  ok(w.fly && w.fly.ph === 'patrol' && w.fly.hrs > 6, 'on patrol', w.fly); ok(R.recallAir(w) && w.fly.ph === 'back' && w.fly.t === 0, 'Return on patrol: it heads home at once', w.fly);
  h = 0; while (w.fly && h < 10){ E.api.tick(); h++; } ok(!w.fly && w.air.cd >= 5, 'and lands', {h, cd:w.air.cd});
  ok(!R.recallAir(w), 'Return on the ground does nothing'); }

// ---- 6. Split and Merge
{ const R = load(), E = setup(R), S = E.S; S.armies = S.armies.filter(a => !a.air);
  const w = wingAt(R, E.base, 'asf', 4); w.air.cd = 3; w.air.wear = 0.2; w.w.asf = 6;
  const b = R.splitWing(w); ok(b && R.count(w) === 2 && R.count(b) === 2 && b.air.base === E.base && b.air.cd === 3 && b.air.wear === 0.2 && Math.abs(w.w.asf + b.w.asf - 6) < 1e-9, 'Split: half leave with the same base, rearm hours, wear and wounds', b && {u:[R.count(w), R.count(b)], air:b.air, w:[w.w.asf, b.w.asf]});
  b.air.cd = 5; b.air.wear = 0.4; const one = wingAt(R, E.base, 'asf', 1), jet = wingAt(R, E.base, 'jet', 2);
  ok(!R.splitWing(one), 'a wing of one aircraft does not split');
  w.fly = {tgt:E.ownP, kind:'patrol', ph:'out', t:0.2, hrs:0}; ok(!R.splitWing(w) && R.mergeWings(w) === 0, 'a wing in the air neither splits nor merges'); w.fly = null;
  const m = R.mergeWings(w); ok(m === 2 && R.count(w) === 5 && w.air.cd === 5 && Math.abs(w.air.wear - (0.2*2 + 0.4*2 + 0)/5) < 1e-9, 'Merge: the ASF wings parked there join (longer rearm, wear averaged by aircraft)', {m, n:R.count(w), cd:w.air.cd, wear:w.air.wear});
  ok(R.count(jet) === 2 && S.armies.includes(jet), 'a Strike Fighter wing at the same base stays apart', R.count(jet)); }

// ---- 7. an old save (origin/master's rules) with an ASF wing on patrol
{ let base = null; try { cp.execSync('git rev-parse --verify origin/master', {cwd:ROOT, stdio:'ignore'}); base = f => cp.execSync(`git show origin/master:${f}`, {cwd:ROOT, maxBuffer:1 << 26}).toString(); } catch (e) {}
  if (!base){ console.log('skip 7: no origin/master'); }
  else { const Rm = new Function(srcOf(base))(), Em = setup(Rm), Sm = Em.S; Sm.armies = Sm.armies.filter(a => !a.air);
    const wm = wingAt(Rm, Em.base, 'asf'); Rm.orderAir(wm, Em.foeP); let h = 0; while (wm.fly && wm.fly.ph !== 'patrol' && h < 10){ Em.api.tick(); h++; } Em.api.tick();
    const id = wm.id, hrs = wm.fly && wm.fly.hrs, save = Em.api.saveJSON();
    const R = load(); R.IM.api.newGame(1, 0, SEATS); const okL = R.IM.api.restore(typeof save === 'string' ? JSON.parse(save) : save), S = R.S, w = S.armies.find(a => a.id === id);
    ok(okL && w && w.fly && w.fly.ph === 'patrol' && w.fly.hrs === hrs, 'an ASF patrol saved by origin/master loads, still on patrol', w && w.fly);
    const phs = []; h = 0; while (w.fly && h < 30){ R.IM.api.tick(); phs.push(w.fly ? w.fly.ph : 'home'); h++; }
    ok(phs.filter(p => p === 'patrol').length >= hrs - 2 && !w.fly && w.at === Em.base, 'it keeps patrolling its hours, then comes home', phs.join(' ')); } }

// ---- 8. the Strike Fighter's Patrol
{ const R = load(), E = setup(R), S = E.S, G = E.G; S.armies = S.armies.filter(a => !a.air);
  const wj = wingAt(R, E.base, 'jet', 2), foe = R.addArmy(1, E.foeP, {inf:2});
  const c0 = R.airCheck(wj, E.ownP, null, 'patrol'), c1 = R.airCheck(wj, E.foeP, null, 'patrol'), c2 = R.airCheck(wj, E.base, null, 'patrol'), c3 = R.airCheck(wj, E.foeP);
  ok(c0.ok && c0.kind === 'patrol', 'a Strike Fighter wing may Patrol over its own land', c0);
  ok(c1.ok && c1.kind === 'patrol', 'Patrol over enemy forces is a patrol, not a strike', c1);
  ok(c2.ok && c2.kind === 'patrol', 'Patrol over its own home airbase is allowed', c2);
  ok(c3.ok && c3.kind === 'strike', 'without Patrol (its Strike button) the same tap is still a strike', c3);
  R.setRel(0, 1, 'peace'); const c4 = R.airCheck(wj, E.foeP, null, 'patrol'), c4s = R.airCheck(wj, E.foeP); R.setRel(0, 1, 'war');
  ok(c4.ok && c4.kind === 'patrol' && !c4s.ok, 'Patrol needs no war (a strike there still does)', [c4, c4s]);
  const others = ['heli', 'bomb', 'awacs', 'mpa', 'sdrone', 'drone'].map(t => { const w = wingAt(R, E.base, t), c = R.airCheck(w, E.ownP, null, 'patrol'); S.armies.splice(S.armies.indexOf(w), 1); return [t, c.ok, c.why]; });
  ok(others.every(x => !x[1] && /does not fly patrols/.test(x[2])), 'helicopters, bombers, AWACS, maritime patrol and drones are refused a Patrol order', others);
  const wa = wingAt(R, E.base, 'asf'), ca = R.airCheck(wa, E.ownP, null, 'patrol'); S.armies.splice(S.armies.indexOf(wa), 1);
  ok(ca.ok && ca.kind === 'patrol', 'an ASF given the same order simply patrols', ca);
  const far = G.P.find(q => !q.sea && R.hexDist(G.P[E.base].cc, q.cc) > R.wingRange(wj) + 1);
  if (far){ const cf = R.airCheck(wj, far.id, null, 'patrol'); ok(!cf.ok && /Out of range/.test(cf.why), 'Patrol out of range is refused', cf); }
  // a whole patrol, hour by hour
  ok(R.orderAir(wj, E.ownP, 'patrol') && wj.fly.kind === 'patrol', 'orderAir(wing, p, "patrol") sends the Strike Fighters on patrol', wj.fly);
  const seen = []; let h = 0; for (; h < 40 && wj.fly; h++){ E.api.tick(); seen.push(wj.fly ? wj.fly.ph : 'home'); }
  const np = seen.filter(x => x === 'patrol').length;
  ok(np >= 11 && np <= 13 && seen.includes('back') && !wj.fly && wj.at === E.base && wj.air.cd >= 5, 'it flies out, patrols 12 h, comes home and rearms', {np, seen:seen.join(' '), cd:wj.air.cd});
  ok(R.count(foe) === 2 && R.effHP(foe) > 0, '(the enemy force under nothing it patrolled was not struck)'); }

// ---- 8b. on patrol it is a fighter over the province and its neighbours: enemy bombers lose aircraft to it, with its own numbers
{ const R = load(), E = setup(R), S = E.S, G = E.G, P = G.P[E.ownP];
  const nb = R.nbs(E.ownP).find(v => !G.P[v].sea) ?? R.nbs(E.ownP)[0];
  const onPatrol = (t, k, p = E.ownP) => { const w = wingAt(R, E.base, t, k); w.fly = {tgt:p, kind:'patrol', ph:'patrol', t:0, hrs:12}; return w; };
  S.armies = S.armies.filter(a => !a.air && a.owner !== 1);
  { const w = onPatrol('jet', 2), cap = R.capOver(E.ownP, 1), capN = R.capOver(nb, 1);
    ok(cap.includes(w) && capN.includes(w), 'a patrolling Strike Fighter wing guards its province and the neighbours (capOver)', {own:cap.map(b => b.id), nb:capN.map(b => b.id), w:w.id});
    w.fly = {tgt:E.ownP, kind:'strike', ph:'over', t:0, hrs:1}; ok(!R.capOver(E.ownP, 1).includes(w), 'on a strike it is not a patrol fighter'); S.armies.splice(S.armies.indexOf(w), 1); }
  // enemy bomber raids on a province, our patrol over it (none, two Strike Fighters, two ASF): bomber HP lost per raid over 300 raids
  const raids = (t, N = 300) => { let lost = 0, downed = 0;
    for (let i = 0; i < N; i++){ S.armies = S.armies.filter(a => !a.air); const g = t ? onPatrol(t, 2) : null; const B = R.addArmy(1, E.foeP, {bomb:2}); B.air = {base:E.foeP, cd:0}; B.m = 80; const h0 = R.effHP(B);
      R.resolveStrike(B, E.ownP); lost += h0 - R.effHP(B); downed += 2 - R.count(B); }
    S.armies = S.armies.filter(a => !a.air); return {hp:+(lost/N).toFixed(2), downed:+(downed/N).toFixed(3)}; };
  const r0 = raids(null), rj = raids('jet'), ra = raids('asf');
  console.log('bomber raids (HP and bombers lost per raid): no patrol', JSON.stringify(r0), 'Strike Fighters', JSON.stringify(rj), 'ASF', JSON.stringify(ra));
  ok(rj.hp > r0.hp + 0.5, 'two patrolling Strike Fighters hurt an enemy bomber raid (vs no patrol)', {r0, rj});
  ok(ra.hp > rj.hp*1.5, 'with their own air-to-air numbers: well under what two Air Superiority Fighters do', {rj, ra});
  // a loitering enemy AWACS over a neighbour of the patrol loses aircraft to it
  { let lost = 0; for (let i = 0; i < 200; i++){ S.armies = S.armies.filter(a => !a.air); onPatrol('jet', 2); const A = R.addArmy(1, E.foeP, {awacs:1}); A.air = {base:E.foeP, cd:0}; A.m = 80; A.fly = {tgt:nb, kind:'orbit', ph:'over', t:0, hrs:16}; const h0 = R.effHP(A); R.loiterHour(A); lost += h0 - R.effHP(A); }
    S.armies = S.armies.filter(a => !a.air); ok(lost/200 > 0.2, 'it hunts a loitering AWACS over a neighbouring province', +(lost/200).toFixed(2)); } }

// ---- 9. HARASSMENT: troops at sea and an army on the move
{ const R = load(), E = setup(R), S = E.S, G = E.G, B = G.P[E.base]; S.armies = S.armies.filter(a => !a.air && a.owner !== 1);
  const z = G.P.filter(q => q.sea && R.hexDist(B.cc, q.cc) >= 4 && R.hexDist(B.cc, q.cc) <= 9).sort((a, b) => R.hexDist(B.cc, a.cc) - R.hexDist(B.cc, b.cc))[0];
  const far = G.P.filter(q => q.sea && R.hexDist(z.cc, q.cc) >= 3 && R.hexDist(B.cc, q.cc) <= 12).sort((a, b) => R.hexDist(B.cc, a.cc) - R.hexDist(B.cc, b.cc))[0];
  const onLeg = (foe, h = 0) => { while (foe.to === null && h < 30){ E.api.tick(); h++; } return foe.to !== null; };
  const sortie = (w, foe) => { const h0 = R.effHP(foe); let h = 0; while (w.fly && w.fly.ph === 'out' && h < 12){ E.api.tick(); h++; } return h0 - R.effHP(foe) + 0.0834*h; };   // (+ what it healed in those hours, at most 1/12 HP an hour)
  const feed = () => (S.log || []).map(x => x.text);
  // (a) troops at sea, sailing from one sea zone to the next
  { const foe = R.addArmy(1, z.id, {inf:2}); R.orderMove(foe, far.id);
    ok(onLeg(foe) && G.P[R.provNow(foe)].sea && R.provNow(foe) === z.id, 'troops at sea under way, on a leg between sea zones', {at:foe.at, to:foe.to, now:R.provNow(foe)});
    const p = R.provNow(foe);
    ok(!R.stationaryAt(p).some(b => b.owner === 1), '(nothing of theirs stands in the zone: other strikes find no target there)');
    const wj = wingAt(R, E.base, 'jet'), cj = R.airCheck(wj, p); S.armies.splice(S.armies.indexOf(wj), 1);
    const w = wingAt(R, E.base, 'asf'), c = R.airCheck(w, p, null, 'strike', foe.id), cp0 = R.airCheck(w, p, null, 'strike');
    ok(c.ok && c.kind === 'strike' && cp0.ok, 'an ASF may Attack the troops at sea, sent at the force or at the zone', [c, cp0]);
    ok(R.orderAir(w, p, 'strike', foe.id) && w.fly.foe === foe.id, 'the Attack records the force it was sent at (fly.foe)', w.fly);
    const d = sortie(w, foe), l = feed().find(t => /^Attack on .*(troops|forces) at sea/.test(t));
    console.log('troops at sea struck:', d.toFixed(2), 'HP;', l);
    ok(d > 0.8 && d < 2.1, 'it hits them, about 1.5 HP (one aircraft, troops at sea alone: 1.5x)', d);
    ok(foe.to !== null || foe.path.length || foe.at === far.id, 'and they sail on (harassment: it does not stop them)', {to:foe.to, path:foe.path});
    ok(!!l, 'the report reads "Attack on ... troops at sea in ..." (unidentified: "Attack on unidentified forces at sea in ...", 13)', feed().slice(0, 3));
    ok(cj.ok, '(a Strike Fighter may still strike the zone, and hits only forces standing in it: unchanged)', cj); }
  // (b) infantry marching towards our capital
  { S.armies = S.armies.filter(a => !a.air && a.owner !== 1); const foe = R.addArmy(1, E.foeP, {inf:2}); R.orderMove(foe, E.base);
    const dest = () => foe.path.length ? foe.path[foe.path.length - 1] : foe.to;
    ok(onLeg(foe) && dest() === E.base, 'infantry marching towards our capital, on a leg', {at:foe.at, to:foe.to, dest:dest()});
    const p = R.provNow(foe), w = wingAt(R, E.base, 'asf');
    ok(!R.stationaryAt(p).some(b => b.owner === 1) && R.foesIn(p, 0).includes(foe), 'it stands nowhere (stationaryAt) but counts in the province it marches through (foesIn)');
    ok(R.airCheck(w, p, null, 'strike').ok, 'an Attack on that province is allowed (before: "No enemy forces there to attack")');
    ok(R.orderAir(w, p, 'strike', foe.id), 'Attack sent at the marching force');
    const d = sortie(w, foe), l = feed().find(t => /^Attack on .*forces on the move/.test(t));
    console.log('marching infantry struck:', d.toFixed(2), 'HP;', l);
    ok(d > 0.6 && d < 1.5, 'it hits it, about 1 HP', d);
    ok(dest() === E.base && (foe.to !== null || foe.path.length), 'and it marches on towards our capital', {to:foe.to, path:foe.path});
    ok(!!l, 'the report reads "Attack on ... forces on the move at ..."', feed().slice(0, 3)); }
  // (c) the wing follows its force into the next province, not beyond its range
  { S.armies = S.armies.filter(a => !a.air && a.owner !== 1); const w = wingAt(R, E.base, 'asf'), X = E.foeP;
    const Y = G.P[X].nbs.find(v => !G.P[v].sea && R.hexDist(B.cc, G.P[v].cc) <= R.wingRange(w) - 1 && R.hexDist(B.cc, G.P[v].cc) !== R.hexDist(B.cc, G.P[X].cc));
    const foe = R.addArmy(1, Y, {inf:1}); w.fly = {tgt:X, kind:'strike', ph:'out', t:0.4, hrs:0, foe:foe.id};
    const d0 = R.hexDist(B.cc, G.P[X].cc), d1 = R.hexDist(B.cc, G.P[Y].cc);
    ok(R.asfHome(w) && w.fly.tgt === Y && Math.abs(w.fly.t*Math.max(1, d1) - 0.4*Math.max(1, d0)) < 1e-9, 'its force moved into the next province: the wing turns there, the distance flown kept', {tgt:w.fly.tgt, t:w.fly.t, d0, d1});
    const Fz = G.P.find(q => !q.sea && R.hexDist(B.cc, q.cc) > R.wingRange(w) + 1 && R.hexDist(B.cc, q.cc) < R.wingRange(w) + 6);
    foe.at = Fz.id; w.fly.tgt = X; w.fly.t = 0.4;
    ok(!R.asfHome(w) && w.fly.tgt === X, 'moved out of its range: the wing flies on to where it was going', w.fly);
    const other = R.addArmy(1, X, {inf:1}), h0 = R.effHP(other), hf = R.effHP(foe); R.resolveStrike(w, X);
    ok(R.effHP(other) < h0 && R.effHP(foe) === hf && feed().some(t => /moved out of reach/.test(t)), 'there it hits the enemy forces it finds, and says its force moved out of reach', feed().slice(0, 2));
    w.fly.foe = foe.id; foe.u.inf = 0; const h1 = R.effHP(other); R.resolveStrike(w, X);
    ok(R.effHP(other) < h1, 'its force destroyed meanwhile: it hits the others there'); } }

// ---- 10. the at-sea factor in air strikes: a Strike Fighter on troops at sea alone and escorted, the UAV salvo
{ const R = load(), E = setup(R), S = E.S, G = E.G, P = G.P[E.foeP]; P.terrain = 'plains'; P.river = new Set();
  const z = G.P.filter(q => q.sea && R.hexDist(G.P[E.base].cc, q.cc) <= 5).sort((a, b) => R.hexDist(G.P[E.base].cc, a.cc) - R.hexDist(G.P[E.base].cc, b.cc))[0].id;
  ok(R.AT_SEA && R.AT_SEA.alone === 1.5 && R.AT_SEA.escort === 0.75, 'AT_SEA: 1.5x alone, 0.75x escorted (the battle-at-sea numbers, rules/tick.js)', R.AT_SEA);
  const run = (T, p, other, N = 300) => { let dealt = 0;
    for (let i = 0; i < N; i++){ S.armies = S.armies.filter(a => a.owner !== 1 && !a.air); const D = R.addArmy(1, p, {inf:3}); D.still = S.hour; if (other) R.addArmy(1, p, other).still = S.hour; const h0 = R.effHP(D);
      const w = wingAt(R, E.base, T); if (T === 'drone') R.uavSalvo(w, p); else R.resolveStrike(w, p); dealt += h0 - R.effHP(D); }
    return dealt/N; };
  const land = run('jet', E.foeP), sea = run('jet', z), landT = run('jet', E.foeP, {tank:1}), seaF = run('jet', z, {frig:1});
  console.log('Strike Fighter on 3 infantry: land', land.toFixed(2), 'at sea', sea.toFixed(2), '| beside a 14 HP force: land (a tank)', landT.toFixed(2), 'at sea escorted (a frigate)', seaF.toFixed(2));
  ok(sea/land > 1.35 && sea/land < 1.65, 'a Strike Fighter strike on troops at sea without warships: 1.5x', sea/land);
  ok(seaF/landT > 0.65 && seaF/landT < 0.85, 'with a frigate of theirs in the zone: 0.75x', seaF/landT);
  Object.assign(S.nations[0].tech, {u_drone:1, drone_g2:1, drone_g3:1, drone_g4:1}); S.nations[0].tv = (S.nations[0].tv || 0) + 1;   // (armed UAV: level IV)
  const uL = run('drone', E.foeP), uS = run('drone', z);
  ok(uL > 0 && uS/uL > 1.3 && uS/uL < 1.7, 'the UAV salvo too: 1.5x on troops at sea', {land:uL, sea:uS}); }

// ---- 11. air-to-air identical to the build before the change (4daba2a)
{ let old = null; try { cp.execSync('git cat-file -e 4daba2a', {cwd:ROOT, stdio:'ignore'}); old = f => cp.execSync(`git show 4daba2a:${f}`, {cwd:ROOT, maxBuffer:1 << 26}).toString(); } catch (e) {}
  if (!old){ console.log('skip 11: 4daba2a not in this checkout'); }
  else { const air = R => { const E = setup(R), S = E.S, G = E.G, nb = R.nbs(E.ownP).find(v => !G.P[v].sea) ?? R.nbs(E.ownP)[0], out = {};
      const patrol = (t, k) => { const w = wingAt(R, E.base, t, k); w.fly = {tgt:E.ownP, kind:'patrol', ph:'patrol', t:0, hrs:12}; return w; };
      for (const [nm, T, k] of [['bombers', 'bomb', 2], ['strikeFighters', 'jet', 2], ['enemyASF', 'asf', 2]]){ let a0 = 0, a1 = 0;
        for (let i = 0; i < 300; i++){ S.armies = S.armies.filter(a => !a.air); const g = patrol('asf', 2), X = R.addArmy(1, E.foeP, {[T]:k}); X.air = {base:E.foeP, cd:0}; X.m = 80; const hx = R.effHP(X), hg = R.effHP(g);
          R.resolveStrike(X, E.ownP); a0 += hx - R.effHP(X); a1 += hg - R.effHP(g); }
        out[nm] = [+a0.toFixed(6), +a1.toFixed(6)]; }
      let aw = 0; for (let i = 0; i < 200; i++){ S.armies = S.armies.filter(a => !a.air); patrol('asf', 2); const A = R.addArmy(1, E.foeP, {awacs:1}); A.air = {base:E.foeP, cd:0}; A.m = 80; A.fly = {tgt:nb, kind:'orbit', ph:'over', t:0, hrs:16}; const h0 = R.effHP(A); R.loiterHour(A); aw += h0 - R.effHP(A); }
      out.awacs = +aw.toFixed(6); out.rows = R.unitStrength(0, 'asf', {u_asf:1}).rows.filter(r => ['jet', 'heli', 'drone'].includes(r.k)).map(r => [r.k, r.atk, r.def]); return out; };
    const a = air(new Function(srcOf(old))()), b = air(load());
    console.log('air-to-air, 4daba2a vs now (HP lost by the raiders and by the ASF patrol over 300 raids):', JSON.stringify(a), '|', JSON.stringify(b));
    ok(JSON.stringify(a) === JSON.stringify(b), 'dogfights identical to the decimal: bombers, Strike Fighters and enemy ASFs into an ASF patrol, an AWACS hunted, Army Info air rows', {a, b}); } }

// ---- 12. an old save (4daba2a) with an ASF in the middle of an Attack
{ let old = null; try { cp.execSync('git cat-file -e 4daba2a', {cwd:ROOT, stdio:'ignore'}); old = f => cp.execSync(`git show 4daba2a:${f}`, {cwd:ROOT, maxBuffer:1 << 26}).toString(); } catch (e) {}
  if (!old){ console.log('skip 12: 4daba2a not in this checkout'); }
  else { const Rm = new Function(srcOf(old))(), Em = setup(Rm), Sm = Em.S; Sm.armies = Sm.armies.filter(a => !a.air && a.owner !== 1);
    const fm = Rm.addArmy(1, Em.foeP, {inf:2}), wm = wingAt(Rm, Em.base, 'asf'); Rm.orderAir(wm, Em.foeP, 'strike'); Em.api.tick();
    const id = wm.id, fid = fm.id, fly0 = JSON.stringify(wm.fly), save = Em.api.saveJSON();
    const R = load(); R.IM.api.newGame(1, 0, SEATS); const okL = R.IM.api.restore(typeof save === 'string' ? JSON.parse(save) : save), S = R.S, w = S.armies.find(a => a.id === id), foe = S.armies.find(a => a.id === fid);
    ok(okL && w && w.fly && w.fly.ph === 'out' && w.fly.kind === 'strike' && w.fly.foe === undefined, 'an ASF mid-Attack saved by 4daba2a loads, still flying out', fly0);
    const h0 = R.effHP(foe), phs = []; let h = 0; while (w.fly && h < 20){ R.IM.api.tick(); phs.push(w.fly ? w.fly.ph : 'home'); h++; }
    const d = h0 - R.effHP(foe) + 0.0834*h;
    ok(phs.includes('over') && !w.fly && w.at === Em.base && d > 0.5 && d < 1.6, 'its strike lands with this build\'s damage (about 1 HP) and it comes home', {phs:phs.join(' '), d}); } }

// ---- 13. fog of war: a '?' contact sent at names no nation and starts no war
{ const R = load(), E = setup(R), S = E.S, G = E.G, B = G.P[E.base]; S.armies = S.armies.filter(a => !a.air && a.owner !== 1 && a.owner !== 2);
  const z = G.P.filter(q => q.sea && R.hexDist(B.cc, q.cc) >= 4 && R.hexDist(B.cc, q.cc) <= 9).sort((a, b) => R.hexDist(B.cc, a.cc) - R.hexDist(B.cc, b.cc))[0];
  const feed = () => (S.log || []).map(x => x.text), N1 = R.nationName(1), N2 = R.nationName(2), known = b => R.armyKnown(b, R.visibleSet(0));
  let fr = null; const reveal = (p, on) => { if (fr){ S.armies.splice(S.armies.indexOf(fr), 1); fr = null; } if (on) fr = R.addArmy(0, p, {frig:1}); R.resetVis(); };   // (identified: a frigate of ours beside it)
  ok(!R.atWar(0, 2), '(nation 2 is at peace with us)');
  // (a) a hostile convoy at sea, not identified
  { const foe = R.addArmy(1, z.id, {inf:2}), w = wingAt(R, E.base, 'asf'); S.log = []; reveal(z.id, false);
    ok(!known(foe), 'a hostile convoy at sea that we have not identified (a ? contact)', {at:foe.at});
    ok(R.orderAir(w, z.id, 'strike', foe.id), 'Attack sent at it'); R.resolveStrike(w, z.id); const l = feed().find(t => /^Attack on /.test(t)) || '';
    console.log('unidentified convoy report:', l);
    ok(/^Attack on unidentified forces at sea in /.test(l) && !l.includes(N1), 'the report names no nation and no type: "Attack on unidentified forces at sea in ..."', l);
    reveal(z.id, true); ok(known(foe), '(identified: a frigate of ours sails beside it)'); S.log = []; w.fly = {tgt:z.id, kind:'strike', ph:'out', t:0.9, hrs:0, foe:foe.id}; R.resolveStrike(w, z.id);
    const l2 = feed().find(t => /^Attack on /.test(t)) || ''; console.log('identified convoy report:', l2);
    ok(l2.startsWith(`Attack on ${N1} troops at sea in `), 'identified, it names them as before: "Attack on <Nation> troops at sea in ..."', l2); }
  // (b) a convoy of a nation at peace, not identified
  { reveal(z.id, false); S.armies = S.armies.filter(a => !a.air && a.owner !== 1 && a.owner !== 2); S.log = []; R.resetVis();
    const far = G.P.filter(q => q.sea && q.id !== z.id && G.P[z.id].nbs.includes(q.id) && R.hexDist(B.cc, q.cc) <= 8)[0];
    const foe = R.addArmy(2, z.id, {inf:2}), w = wingAt(R, E.base, 'asf'), h0 = R.effHP(foe); R.resetVis();
    ok(!known(foe), 'a convoy of a nation at peace, not identified (a ? contact)');
    const c = R.airCheck(w, z.id, null, 'strike', foe.id);
    ok(c.ok && !JSON.stringify(c).includes(N2), 'the Attack on it is taken, naming no nation (not "You are not at war with ...")', c);
    reveal(z.id, true); const ck = R.airCheck(w, z.id, null, 'strike', foe.id); reveal(z.id, false);
    ok(!ck.ok && ck.why === `You are not at war with ${N2}.`, 'identified, the same Attack is refused as before (the panel offers the surprise attack)', ck);
    R.resetVis(); ok(R.orderAir(w, z.id, 'strike', foe.id) && w.fly.foe === foe.id && R.trailOf(w) === foe, 'sent: the wing goes after it (trailOf) as after a hostile one', w.fly);
    if (far){ foe.at = far.id; ok(R.asfHome(w) && w.fly.tgt === far.id, 'it follows the contact into the next sea zone', {tgt:w.fly.tgt, far:far.id}); foe.at = z.id; w.fly.tgt = z.id; }
    S.log = []; R.resolveStrike(w, z.id); const l = feed().find(t => /^Strike on |^Attack on /.test(t)) || ''; console.log('peace contact report:', l);
    ok(R.effHP(foe) === h0 && !R.atWar(0, 2), 'it hits nothing and starts no war', {hp:[h0, R.effHP(foe)]});
    ok(/found no targets \(the contact it was sent at was not hostile\)|found no targets: the contact it was sent at was not hostile/.test(l) && !l.includes(N2), 'the report names no nation ("... found no targets: the contact it was sent at was not hostile")', l); } }

console.log(`${n - bad}/${n} checks passed`); process.exit(bad ? 1 : 0);
