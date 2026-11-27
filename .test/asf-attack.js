// The Air Superiority Fighter's Attack order and the wing orders added with it (FIGHTER-ASF, owner playtest 2026-11-27, item 2), plain Node:
//   node .test/asf-attack.js        (exit 0 when every check holds; about 20 s)
// 1. the numbers: ASF_ATTACK (rules/data.js) is what UNITS.asf uses against soft, armoured and naval targets; air-to-air (3.0) unchanged
// 2. the order (rules/air.js airCheck / orderAir with want 'strike'): an ASF wing may Attack enemy forces (kind 'strike'), the same tap without
//    want is still a patrol; refused on its own land with no enemy there, on a nation it is not at war with, out of range; an Interceptor or an
//    AWACS cannot Attack; a Strike Fighter's own strike is unchanged
// 3. the damage (the real resolveStrike, 300 sorties each on one infantry, one tank, one artillery in the open): the ASF hits weakly, between
//    10% and 40% of a Strike Fighter on infantry and under 25% on tanks, and never cuts road or rail links nor adds war damage (ASF_ATTACK.links);
//    3b: on a sea zone it records no convoy raid (S.trade.air), where a Strike Fighter does
// 4. a whole Attack sortie through the hours (tick): out, the strike, the hour over the target, back, 6 h rearming; the foe lost health
// 5. Return (recallAir): a wing flying out turns back from where it is, one on patrol heads home at once, both land and rearm
// 6. Split and Merge for wings (splitWing, mergeWings): half the aircraft leave with the same base, rearm hours and wear; wings of one type
//    parked at one base merge (the longer rearm, the wear averaged), other types stay apart
// 7. saves: an ASF wing on patrol saved by origin/master's rules (git show) loads into this build and keeps patrolling, then comes home
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const EXP = '\nreturn {IM, get S(){ return S; }, get G(){ return G; }, UNITS, ASF_ATTACK: typeof ASF_ATTACK === "undefined" ? null : ASF_ATTACK, setRel, addArmy, count, armyHP, effHP, resolveStrike, removeEmpty, airCheck, orderAir, wingRange, hexDist, stationaryAt, S_dmg: () => S.dmg,'
  + ' recallAir: typeof recallAir === "undefined" ? null : recallAir, splitWing: typeof splitWing === "undefined" ? null : splitWing, mergeWings: typeof mergeWings === "undefined" ? null : mergeWings};';
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
{ const R = load(), A = R.ASF_ATTACK, vs = R.UNITS.asf.vs;
  ok(A && A.soft === 0.25 && A.armored === 0.2 && A.naval === 0.3 && A.links === false, 'ASF_ATTACK holds the proposed numbers (soft 0.25, armoured 0.2, naval 0.3, no links)', A);
  ok(vs.soft === A.soft && vs.armored === A.armored && vs.naval === A.naval, 'UNITS.asf uses ASF_ATTACK against the ground and the sea', vs);
  ok(vs.air === 3.0 && R.UNITS.asf.atk === 9 && R.UNITS.asf.vsU.bomb === 3.0, 'air-to-air unchanged (vs air 3.0, attack 9, vs bombers 3.0)', vs); }

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

// ---- 3. the damage, the real resolveStrike
{ const R = load(), E = setup(R), S = E.S, P = E.G.P[E.foeP]; P.terrain = 'plains'; P.river = new Set();
  const run = (T, tgt, N = 300) => { let dealt = 0, cut = 0, dmg = 0;
    for (let i = 0; i < N; i++){ S.armies.length = 0; const D = R.addArmy(1, E.foeP, {...tgt}); D.still = S.hour; const h0 = R.effHP(D);
      for (const r of P.lk.values()) r.dmg = 0; const d0 = (S.dmg && S.dmg[E.foeP]) || 0;
      const w = wingAt(R, E.base, T); R.resolveStrike(w, E.foeP); dealt += h0 - R.effHP(D);
      for (const r of P.lk.values()) if (r.dmg > 0) { cut++; break; } dmg += ((S.dmg && S.dmg[E.foeP]) || 0) - d0; if (S.dmg) S.dmg[E.foeP] = 0; }
    return {hp:+(dealt/N).toFixed(2), cutShare:+(cut/N).toFixed(2), warDmg:+(dmg/N).toFixed(2)}; };
  const out = {};
  for (const [k, tgt] of [['inf', {inf:1}], ['tank', {tank:1}], ['art', {art:1}]]) out[k] = {jet:run('jet', tgt), asf:run('asf', tgt)};
  console.log('sorties (HP dealt per sortie, share of sorties that cut links, war damage):', JSON.stringify(out));
  const r = k => out[k].asf.hp/out[k].jet.hp;
  ok(out.inf.asf.hp > 0.5 && r('inf') > 0.1 && r('inf') < 0.4, 'the ASF hurts infantry, weakly: 10-40% of a Strike Fighter', {asf:out.inf.asf.hp, jet:out.inf.jet.hp});
  ok(out.tank.asf.hp > 0.3 && r('tank') < 0.25, 'tanks: under a quarter of a Strike Fighter', {asf:out.tank.asf.hp, jet:out.tank.jet.hp});
  ok(r('art') > 0.1 && r('art') < 0.45, 'artillery: 10-45% of a Strike Fighter', {asf:out.art.asf.hp, jet:out.art.jet.hp});
  ok(out.inf.asf.cutShare === 0 && out.tank.asf.cutShare === 0 && out.inf.asf.warDmg === 0, 'the ASF never cuts roads or rails and adds no war damage (ASF_ATTACK.links false)', out.inf.asf);
  ok(out.inf.jet.cutShare > 0.5, 'a Strike Fighter still cuts them', out.inf.jet); }

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

console.log(`${n - bad}/${n} checks passed`); process.exit(bad ? 1 : 0);
