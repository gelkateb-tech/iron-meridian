// Stealth Bomber (unit 'stealth', research: bomb_up, then the unlock u_stealth): the rules, checked in plain Node with no browser.
//   node .test/stealth.js [quick]
// 1. the unit's numbers, its research (the unlock needs BOTH the Strategic Bomber Upgrade and Stealth Airframes, from day 14) and its building (Airbase III)
// 2. detection: Mobile SAMs, frigates and cruisers hit it 35% as often as a Heavy Bomber, fighters 40% as often (measured over many raids)
// 3. bomb load: 60% of the Heavy Bomber's on cities and buildings, +25% (not +50%) on troops sheltering in a city
// 4. fog of war: in flight only a SAM or jammer in or next to the province sees it; an AWACS only locates it, at half range (250 of its 500 km)
// 5. the AI: no stealth bomber before day 60, none without enemy SAM stacks, never more than one wing per nation (scenario + a played game)
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const NAMES = ['IM', 'UNITS', 'RN', 'rCost', 'rLevel', 'AIR_RANGE', 'airRangeT', 'wingRange', 'st', 'multU', 'mult', 'addArmy', 'aaFire', 'dogfight', 'resolveStrike', 'bombBuildings', 'bombCityF', 'effHP', 'count',
  'canResearch', 'researchWhy', 'startResearch', 'canMobilize', 'ucost', 'trainH', 'loWing', 'loSpotted', 'loLocated', 'loHidden', 'nearList', 'AEW_R', 'hexDist', 'aiStealthWant', 'aiStealthOk', 'aiStealthSite',
  'aiFoeSams', 'visAewKm', 'KM_W', 'visLocAt', 'aiTurn', 'income', 'isStriker', 'airMissionKind', 'armyName', 'removeEmpty', 'stationaryAt', 'isBmb', 'AI_STEALTH_MAX', 'armyVisible', 'visibleSet'];
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn {' + NAMES.join(', ') + ', get S(){ return S; }, get G(){ return G; }, clearVis(){ visCache = null; }};';
const QUICK = process.argv.includes('quick'), errors = [], info = {}, ok = (c, msg, v) => { if (!c) errors.push(msg + (v !== undefined ? ' ' + JSON.stringify(v) : '')); };
const near = (v, t, tol) => Math.abs(v - t) <= tol, r2 = v => Math.round(v*1000)/1000;

function fresh(seed){ const R = new Function(SRC)(); R.IM.api.newGame(seed, 0, []); R.S.started = true; return R; }
{ const R = fresh(777), {UNITS, RN, S, G} = R, U = UNITS.stealth;
  // ---- 1. numbers
  ok(U && U.name === 'Stealth Bomber' && U.short === 'STB' && U.cls === 'air', 'the unit exists');
  const want = {cost:330, oil:26, metal:34, iron:6, elec:40, rare:8, mp:8, build:168, upk:14, fuel:3.5, atk:8, def:4, hp:12, spd:10};
  for (const k in want) ok(U[k] === want[k], `stealth.${k} is ${want[k]}`, U[k]);
  ok(U.vs.soft === 1 && U.vs.armored === 0.7 && U.vs.naval === 0.6 && U.vs.air === 0.2, 'damage by target class', U.vs);
  ok(U.req.b === 'air' && U.req.l === 3 && U.tech === 'u_stealth', 'needs Airbase III and its own unlock', U.req);
  ok(R.AIR_RANGE.stealth === R.AIR_RANGE.bomb && R.AIR_RANGE.stealth === 34, 'range 34 hexes, the Heavy Bomber\'s');
  ok(U.bmb === 0.6 && UNITS.bomb.bmb === 1, 'bomb load 60% of the Heavy Bomber\'s');
  const c = R.ucost(0, 'stealth'), d = S.nations[0].doc; info.cost = c; ok(d || (c.cash === 330 && c.elec === 40 && c.rare === 8 && c.mp === 8), 'price', c);
  // detection table: each shooter against the stealth bomber, as a share of what it does to a Heavy Bomber
  const share = t => R.multU(t, 'stealth')/R.multU(t, 'bomb');
  info.share = Object.fromEntries(['sam', 'frig', 'crui', 'int', 'asf', 'jet', 'inf', 'tank', 'carr'].map(t => [t, r2(share(t))]));
  for (const t of ['sam', 'frig', 'crui']) ok(near(share(t), 0.35, 1e-9), `${t} hits it 35% as often`, share(t));
  for (const t of ['int', 'asf', 'jet']) ok(near(share(t), 0.4, 1e-9), `${t} hits it 40% as often`, share(t));
  ok(near(R.multU('asf', 'stealth'), 0.4*R.multU('asf', 'bomb'), 0.03) && R.multU('asf', 'bomb') === 3.0 && R.multU('int', 'bomb') === 6.0, 'fighters hit a Stealth Bomber at 40% of their anti-bomber bonus (ASF 3.0 to 1.2, Interceptor 6.0 to 2.4)', R.multU('asf', 'stealth'));
  ok(share('inf') === 1 && share('tank') === 1, 'guns hit it like any aircraft');
  // ---- research (the tree by unit): the Strategic Bomber Upgrade on the Heavy Bomber's line, the Stealth Bomber's unlock needs it AND Stealth Airframes
  const N = S.nations[0], B2 = RN.bomb_up, B3 = RN.u_stealth; N.research = N.research2 = null; for (const k of ['cash', 'oil', 'metal', 'iron', 'elec', 'rare', 'mp']) N[k] = 50000;
  ok(B2 && B2.name === 'Strategic Bomber Upgrade' && B2.lv[0].day === 11 && B2.req.join() === 'u_bomb', 'the Strategic Bomber Upgrade is there', B2);
  ok(B3 && B3.name === 'Stealth Bomber' && B3.lv[0].c.days === 9 && B3.lv[0].day === 14 && B3.req.join() === 'bomb_up,jet_lo' && B3.elite, 'the Stealth Bomber unlock is there', B3);
  ok(R.rCost(B3, 1).cash === Math.round(30 + 0.9*330) && R.rCost(B3, 1).rare === 12 + Math.round(330/4), 'priced from the unit\'s own price', R.rCost(B3, 1));
  N.tech = {}; N.tv = (N.tv || 0) + 1; S.hour = 5*24;
  ok(!R.canResearch(0, 'bomb_up') && /Opens on day 11/.test(R.researchWhy(0, 'bomb_up')), 'the upgrade opens on day 11', R.researchWhy(0, 'bomb_up'));
  S.hour = 20*24; ok(!R.canResearch(0, 'bomb_up') && /Needs Heavy Bomber/.test(R.researchWhy(0, 'bomb_up')), 'the upgrade needs the Heavy Bomber', R.researchWhy(0, 'bomb_up'));
  N.tech.u_bomb = 1; ok(R.canResearch(0, 'bomb_up'), 'the upgrade opens after the Heavy Bomber');
  const r0 = R.airRangeT(0, 'bomb'), a0 = R.st(0, 'bomb', 'atk'); N.tech.bomb_up = 1; N.tv++;
  ok(R.airRangeT(0, 'bomb') === r0 + 4 && near(R.st(0, 'bomb', 'atk') - a0, 1*(a0/UNITS.bomb.atk), 0.2), 'the upgrade: Heavy Bomber range +4 and attack +1', [r0, R.airRangeT(0, 'bomb'), a0, R.st(0, 'bomb', 'atk')]);
  ok(R.airRangeT(0, 'stealth') === 34, 'the upgrade does not change the Stealth Bomber\'s range');
  ok(!R.canResearch(0, 'u_stealth') && /Needs Stealth Airframes/.test(R.researchWhy(0, 'u_stealth')), 'with the upgrade only: needs Stealth Airframes', R.researchWhy(0, 'u_stealth'));
  N.tech = {u_bomb:1, u_jet:1, jet_pgm:1, jet_lo:1}; N.tv++;
  ok(!R.canResearch(0, 'u_stealth') && /Needs Strategic Bomber Upgrade/.test(R.researchWhy(0, 'u_stealth')), 'with Stealth Airframes only: needs the upgrade', R.researchWhy(0, 'u_stealth'));
  N.tech = {}; N.tv++; ok(/Strategic Bomber Upgrade and Stealth Airframes/.test(R.researchWhy(0, 'u_stealth')), 'with neither it names both', R.researchWhy(0, 'u_stealth'));
  N.tech = {u_bomb:1, u_jet:1, jet_pgm:1, jet_lo:1}; N.tv++; ok(R.startResearch(0, 'bomb_up'), 'the upgrade starts');
  ok(/Waits for Strategic Bomber Upgrade/.test(R.researchWhy(0, 'u_stealth')), 'the unlock waits while its prerequisite runs', R.researchWhy(0, 'u_stealth'));
  N.research = N.research2 = null; N.tech.bomb_up = 1; N.tv++; ok(R.canResearch(0, 'u_stealth') && R.researchWhy(0, 'u_stealth') === '', 'the unlock opens with both', R.researchWhy(0, 'u_stealth'));
  S.hour = 12*24; ok(/Opens on day 14/.test(R.researchWhy(0, 'u_stealth')), 'and not before day 14', R.researchWhy(0, 'u_stealth')); S.hour = 20*24;
  // ---- mobilizing: the research and an Airbase III
  const cap = N.capital; S.bld[cap].air = 2; ok(/Research required: Stealth Bomber/.test(R.canMobilize(0, cap, 'stealth')), 'not researched: blocked', R.canMobilize(0, cap, 'stealth'));
  N.tech.u_stealth = 1; N.tv++; ok(/Airbase III/.test(R.canMobilize(0, cap, 'stealth')), 'Airbase II is not enough', R.canMobilize(0, cap, 'stealth'));
  S.bld[cap].air = 3; ok(R.canMobilize(0, cap, 'stealth') === '', 'Airbase III: can be mobilized', R.canMobilize(0, cap, 'stealth'));
  ok(R.IM.api.recruit(0, cap, 'stealth') === true && S.queue[cap].some(j => j.t === 'stealth'), 'queued');
  info.trainH = R.trainH(cap, 'stealth', 0);
  const w = R.addArmy(0, cap, {stealth:2}); w.air = {base:cap, cd:0};
  ok(R.isStriker(w) && R.loWing(w) && /Stealth Bomber Wing/.test(R.armyName(w)), 'a wing of them strikes and is named', R.armyName(w));
  ok(R.wingRange(w) === 34 + 2, 'wing range 34 (+2 for the Airbase III it flies from)', R.wingRange(w));
}

// ---- 2 and 3: raids. A fresh game per series; nation 0 at war with nation E, a target province of E's next to a province of 0's
function arena(seed){ const R = fresh(seed), {S, G} = R; let E = -1, fp = -1, gp = -1;
  for (const P of G.P){ if (P.sea || S.owner[P.id] !== 0) continue; const v = P.nbs.find(q => S.owner[q] > 0 && !G.P[q].sea); if (v != null){ fp = P.id; gp = v; E = S.owner[v]; break; } }
  if (E < 0){ for (const P of G.P){ if (P.sea || S.owner[P.id] <= 0 || !P.city) continue; gp = P.id; E = S.owner[P.id]; break; } fp = S.nations[0].capital; }
  S.rel['0,' + E] = {st:'war', since:S.hour, until:null}; S.rel[E + ',0'] = S.rel['0,' + E];
  const strip = p => { for (const a of S.armies) if (a.at === p) for (const t in a.u) a.u[t] = 0; R.removeEmpty(); };
  const wing = (o, base, u) => { const w = R.addArmy(o, base, u); w.air = {base, cd:0}; return w; };
  const drop = (...as) => { for (const a of as) for (const t in a.u) a.u[t] = 0; R.removeEmpty(); };
  return {R, S, G, E, fp, gp, strip, wing, drop}; }
{ const A = arena(4242), {R, S, G, E, fp, gp, strip, wing, drop} = A, U = R.UNITS, N = QUICK ? 150 : 600;
  ok(R.IM.api.S === S && E > 0 && gp >= 0, 'arena found');
  // hits: the air-defence fire that lands on a wing, in "hits" (HP lost, with the airframe's own armour taken out: hurt() scales by 4/(4+def))
  const hits = (t, n, def, fire) => { let h = 0, lost = 0; for (let i = 0; i < N; i++){ strip(gp); const d = R.addArmy(E, gp, def), w = wing(0, fp, {[t]:n}), hp0 = R.effHP(w); fire(w, d);
      h += (hp0 - R.effHP(w))*(4 + R.st(0, t, 'def'))/4; lost += n - (w.u[t] || 0); drop(w, d); } return {hits:h/N, lost:lost/N}; };
  const aa = (w, d) => R.aaFire(w, [d], 1.2);
  for (const [name, def] of [['sam', {sam:3}], ['frig', {frig:4}], ['crui', {crui:6}], ['sam+inf', {sam:2, inf:6}]]){
    const hb = hits('bomb', 40, def, aa), sb = hits('stealth', 40, def, aa), ratio = sb.hits/hb.hits; info['aa ' + name] = {bomberHits:r2(hb.hits), stealthHits:r2(sb.hits), ratio:r2(ratio), bombersLost:r2(hb.lost), stealthLost:r2(sb.lost)};
    if (name !== 'sam+inf') ok(near(ratio, 0.35, 0.025), `${name}: hits on a stealth bomber are 35% of those on a Heavy Bomber`, info['aa ' + name]);
    else ok(ratio > 0.35 && ratio < 0.5, 'SAMs with infantry: a little above 35% (rifles and guns are not fooled)', info['aa ' + name]); }
  // fighters: a patrol of Interceptors / Air Superiority Fighters meets the raid
  for (const [name, cap] of [['int', {int:4}], ['asf', {asf:4}]]){
    const run = t => { let h = 0; for (let i = 0; i < N; i++){ const c = wing(E, gp, cap), w = wing(0, fp, {[t]:40}), hp0 = R.effHP(w); R.dogfight(w, [c], gp, 2); h += (hp0 - R.effHP(w))*(4 + R.st(0, t, 'def'))/4; drop(w, c); } return h/N; };
    const hb = run('bomb'), sb = run('stealth'); info['fighters ' + name] = {bomberHits:r2(hb), stealthHits:r2(sb), ratio:r2(sb/hb)};
    ok(near(sb/hb, 0.4, 0.03), `${name}: fighters hit a stealth bomber 40% as often`, info['fighters ' + name]); }
  // whole raids on a SAM-defended city: aircraft lost per raid (4 aircraft, 6 SAMs), the way the game plays it
  { const city = G.P.find(P => S.owner[P.id] === E && P.city && !P.sea).id;
    const raid = t => { let lost = 0, lv = 0, dmg = 0, troops = 0; for (let i = 0; i < N; i++){ strip(city); S.cons[city] = null; S.bld[city] = {...S.bld[city], fac:5, air:5, rec:5, fort:0, silo:0}; if (S.dmg) S.dmg[city] = 0;
        const d = R.addArmy(E, city, {sam:6, inf:10}), w = wing(0, fp, {[t]:4}), b0 = S.bld[city].fac + S.bld[city].air + S.bld[city].rec, hp0 = R.effHP(d);
        R.resolveStrike(w, city); lost += 4 - (w.u[t] || 0); lv += b0 - (S.bld[city].fac + S.bld[city].air + S.bld[city].rec); dmg += (S.dmg && S.dmg[city]) || 0; troops += hp0 - R.effHP(d); drop(w, d); }
      return {lost:lost/N, levels:lv/N, cityDamage:dmg/N, troopHP:troops/N}; };
    const hb = raid('bomb'), sb = raid('stealth'); info.raid = {bomber:Object.fromEntries(Object.entries(hb).map(([k, v]) => [k, r2(v)])), stealth:Object.fromEntries(Object.entries(sb).map(([k, v]) => [k, r2(v)])), lostRatio:r2(sb.lost/hb.lost)};
    ok(sb.lost < hb.lost*0.5 && hb.lost > 0.5, 'a stealth raid on a SAM city (6 SAMs) loses far fewer aircraft', info.raid);
    // undefended city: the pure bomb load
    const bare = t => { let lv = 0, dmg = 0; for (let i = 0; i < N; i++){ strip(city); S.cons[city] = null; S.bld[city] = {...S.bld[city], fac:5, air:5, rec:5, fort:0, silo:0}; S.dmg = S.dmg || G.P.map(() => 0); S.dmg[city] = 0;
        const w = wing(0, fp, {[t]:4}), b0 = S.bld[city].fac + S.bld[city].air + S.bld[city].rec; R.resolveStrike(w, city); lv += b0 - (S.bld[city].fac + S.bld[city].air + S.bld[city].rec); dmg += S.dmg[city]; drop(w); } return {levels:lv/N, cityDamage:dmg/N}; };
    const b0 = bare('bomb'), s0 = bare('stealth'); info.load = {bomber:b0, stealth:s0};
    ok(near(b0.cityDamage, 4*6, 1e-6) && near(s0.cityDamage, 4*3.6, 1e-6), 'city damage per aircraft: 6 for the Heavy Bomber, 3.6 for the Stealth Bomber', info.load);
    ok(near(b0.levels, 3, 1e-9) && near(s0.levels, 1.8, 0.12), 'building levels wrecked by 4 aircraft: floor(4*0.75 + dice) = 3 against floor(4*0.45 + dice) = 1 or 2 (1.8 on average)', info.load);
    const open = G.P.find(P => S.owner[P.id] === E && !P.city && !P.sea).id; strip(open); S.dmg[open] = 0; const w = wing(0, fp, {stealth:5}); R.resolveStrike(w, open);
    ok(near(S.dmg[open], 5*1.8, 1e-6), 'outside a city: 1.8 per aircraft', S.dmg[open]); drop(w);
    ok(R.bombCityF('bomb') === 1.5 && R.bombCityF('stealth') === 1.25, 'troops sheltering in a city: +50% from a Heavy Bomber, +25% from a Stealth Bomber'); }
  // ---- 4. fog of war (nation E looks for nation 0's wing in flight over gp)
  { strip(gp); for (const v of G.P[gp].nbs) strip(v);
    const w = wing(0, fp, {stealth:2}); w.fly = {tgt:gp, kind:'strike', ph:'out', t:0.9, hrs:0};
    ok(R.loHidden(w, E, gp) === true, 'no SAM or jammer near: hidden from the enemy, even over his own land');
    ok(R.loHidden(w, 0, gp) === false, 'never hidden from its owner');
    const nbE = G.P[gp].nbs.find(v => !G.P[v].sea && S.owner[v] === E), far = G.P.find(P => S.owner[P.id] === E && !P.sea && P.id !== gp && !G.P[gp].nbs.includes(P.id) && !P.nbs.some(v => G.P[gp].nbs.includes(v))).id;
    const inf = R.addArmy(E, gp, {inf:10, tank:5}); ok(R.loHidden(w, E, gp), 'troops without air defence do not see it');
    const s1 = R.addArmy(E, far, {sam:4}); ok(R.loHidden(w, E, gp), 'a SAM two provinces away does not see it');
    drop(s1); const s2 = R.addArmy(E, nbE != null ? nbE : gp, {sam:1}); ok(!R.loHidden(w, E, gp), 'a SAM in the next province sees it');
    drop(s2); const j = R.addArmy(E, gp, {jam:1}); ok(!R.loHidden(w, E, gp), 'a jammer in the province sees it'); drop(j, inf);
    const hb = wing(0, fp, {bomb:2}); hb.fly = {tgt:gp, kind:'strike', ph:'out', t:0.9, hrs:0}; ok(!R.loHidden(hb, E, gp), 'a Heavy Bomber is not hidden'); drop(hb);
    w.fly = null; ok(!R.loHidden(w, E, gp), 'on the ground it is seen like any wing');
    w.fly = {tgt:gp, kind:'strike', ph:'out', t:0.9, hrs:0};
    // AWACS: location only, at half range
    const km = q => Math.hypot(G.P[q].x - G.P[gp].x, G.P[q].y - G.P[gp].y)/R.KM_W, ring = G.P.filter(P => !P.sea && km(P.id) > 260 && km(P.id) < 490).map(P => P.id);   // (the orbit's radar: 500 km before research)
    const aw = wing(E, S.nations[E].capital, {awacs:1}); aw.fly = {tgt:gp, kind:'orbit', ph:'over', t:0, hrs:10}; R.clearVis();
    ok(R.loLocated(E, gp) && R.loHidden(w, E, gp), 'under an AWACS: located, never identified');
    ok(R.visAewKm(E) === 500, 'the AWACS radar reaches 500 km', R.visAewKm(E));
    ok(ring.length > 0 && !R.loLocated(E, ring[0]) && R.visLocAt(R.visibleSet(E), G.P[ring[0]].x, G.P[ring[0]].y), 'beyond half the radar range (250 km) the AWACS does not find it (other forces there, within 500 km, are still contacts)', ring.length);
    aw.fly.ph = 'out'; ok(!R.loLocated(E, gp), 'an AWACS on its way is not orbiting yet'); drop(aw, w); }
}

// ---- 5. the AI
{ const A = arena(99), {R, S, G, E} = A, n = E, N = S.nations[n], cap = N.capital, foe = 0;
  const rich = () => { for (const k of ['cash', 'oil', 'metal', 'iron', 'elec', 'rare', 'mp']) N[k] = 40000; };
  const mine = () => ({wings:S.armies.filter(a => a.owner === n && a.air && a.u.stealth > 0).length, planes:S.armies.reduce((s, a) => s + (a.owner === n ? a.u.stealth || 0 : 0), 0), queued:S.queue.reduce((s, q, p) => s + (S.owner[p] === n ? q.filter(j => j.t === 'stealth').length : 0), 0)});
  const turns = k => { for (let i = 0; i < k; i++){ rich(); R.aiTurn(n); } };
  N.tech = {...N.tech, u_jet:1, u_int:1, jet_pgm:1, jet_lo:1, u_bomb:1, bomb_up:1, u_stealth:1}; N.tv = (N.tv || 0) + 1; S.bld[cap].air = 3; S.bld[cap].fac = Math.max(1, S.bld[cap].fac); rich();
  const fc = S.nations[foe].capital; for (const a of S.armies) if (a.owner === foe) a.u.sam = 0;
  S.hour = 30*24; ok(!R.aiFoeSams(n), 'the enemy has no SAM stack yet');
  const sams = R.addArmy(foe, fc, {sam:3}); ok(R.aiFoeSams(n), 'now it has');
  ok(R.aiStealthWant(n, R.income(n)) === 0 && !R.aiStealthOk(n), 'day 31, enemy SAM stacks, everything researched and built: no stealth bomber before day 60');
  turns(40); ok(mine().queued === 0 && mine().planes === 0, 'day 31: the AI queues none in 40 turns', mine());
  S.hour = 58*24 + 23; ok(!R.aiStealthOk(n), 'day 59, 23:00: still none'); S.hour = 59*24; ok(R.aiStealthOk(n), 'day 60: allowed');
  sams.u.sam = 1; ok(!R.aiFoeSams(n) && R.aiStealthWant(n, R.income(n)) === 0, 'day 60 but a single SAM is no stack: none');
  for (const q of S.queue) if (q.length) for (let i = q.length - 1; i >= 0; i--) if (q[i].t === 'stealth') q.splice(i, 1);
  turns(40); ok(mine().queued === 0, 'day 60 without enemy SAM stacks: the AI queues none in 40 turns', mine());
  sams.u.sam = 3; ok(R.aiStealthWant(n, R.income(n)) === R.AI_STEALTH_MAX && R.aiStealthSite(n) === cap, 'day 60 with enemy SAM stacks: it wants its one wing, at its Airbase III', [R.aiStealthWant(n, R.income(n)), R.aiStealthSite(n), cap]);
  S.rel['0,' + n] = {st:'peace', since:S.hour, until:null}; S.rel[n + ',0'] = S.rel['0,' + n];
  const others = S.nations.some(o => o.id !== n && o.id !== foe && R.aiFoeSams(n)); if (!others) ok(R.aiStealthWant(n, R.income(n)) === 0, 'at peace with the SAM power: none');
  S.rel['0,' + n] = {st:'war', since:S.hour, until:null}; S.rel[n + ',0'] = S.rel['0,' + n];
  // play on: hourly ticks with money to spare; a second Airbase III city to tempt it into a second wing
  const c2 = G.P.find(P => S.owner[P.id] === n && P.city && P.id !== cap); if (c2){ S.bld[c2.id].air = 3; S.bld[c2.id].fac = Math.max(1, S.bld[c2.id].fac); }
  let maxW = 0, maxP = 0, seen = 0, err = null; const days = QUICK ? 12 : 30;
  try { for (let h = 0; h < days*24 && !S.over; h++){ rich(); if (!S.armies.some(a => a.owner === foe && (a.u.sam || 0) >= 2)) R.addArmy(foe, fc, {sam:3}); R.IM.api.tick(); const m = mine(); maxW = Math.max(maxW, m.wings); maxP = Math.max(maxP, m.planes + m.queued); if (m.planes) seen++; } } catch (e){ err = e.stack; }
  ok(!err, 'the game ran', err); info.aiScenario = {days, maxWings:maxW, maxAircraft:maxP, hoursWithStealth:seen, alive:N.alive};
  ok(maxP >= 1, 'with the research, an Airbase III, an enemy SAM stack and money the AI does build one', info.aiScenario);
  ok(maxP <= R.AI_STEALTH_MAX, `never more than one wing's worth (${R.AI_STEALTH_MAX} aircraft) per nation`, info.aiScenario);
}
// a played game: every nation has the research and an Airbase III from day 50; the rules hold for all of them every hour
if (!QUICK){ const R = fresh(12345), {S, G} = R; let err = null, first = null, maxW = 0, noSam = 0, built = 0; const per = {};
  const census = () => { const w = {}, q = {}; for (const a of S.armies) if (a.owner >= 0 && a.air && a.u.stealth > 0) w[a.owner] = (w[a.owner] || 0) + 1;
    S.queue.forEach((l, p) => { for (const j of l) if (j.t === 'stealth') q[S.owner[p]] = (q[S.owner[p]] || 0) + 1; }); return {w, q}; };
  try { for (let h = 0; h < 80*24 && !S.over; h++){
      if (h === 49*24) for (const N of S.nations){ if (!N.alive) continue; Object.assign(N.tech, {u_jet:1, u_int:1, jet_pgm:1, jet_lo:1, u_bomb:1, bomb_up:1, u_stealth:1}); N.tv = (N.tv || 0) + 1; S.bld[N.capital].air = 3; }
      if (h >= 49*24 && h % 24 === 0) for (const N of S.nations) if (N.alive){ N.cash = Math.max(N.cash, 1500); for (const k of ['oil', 'metal', 'iron', 'elec', 'rare', 'mp']) N[k] = Math.max(N[k], 400); }
      const q0 = census().q; R.IM.api.tick(); const c = census();
      for (const n in c.w) maxW = Math.max(maxW, c.w[n]);
      for (const n in c.q) if ((c.q[n] || 0) > (q0[n] || 0)){ built++; per[S.nations[n].name] = (per[S.nations[n].name] || 0) + 1; if (first == null) first = S.hour; if (!R.aiFoeSams(+n)) noSam++; }
      if ((Object.keys(c.w).length || Object.keys(c.q).length) && S.hour < 59*24 && first == null) first = S.hour; } } catch (e){ err = e.stack; }
  ok(!err, 'the played game ran', err); info.aiGame = {days:r2(S.hour/24), ordered:built, byNation:per, firstOrderDay:first == null ? null : Math.floor(first/24) + 1, maxWingsPerNation:maxW, orderedWithoutEnemySamStack:noSam};
  ok(first == null || first >= 59*24, 'no nation ordered a stealth bomber before day 60', info.aiGame);
  ok(maxW <= 1, 'no nation ever had two stealth wings', info.aiGame);
  ok(noSam === 0, 'every order was placed while at war with a power that fields a SAM stack', info.aiGame);
  ok(Object.values(per).every(v => v <= 4), 'orders per nation stay small (replacements only)', info.aiGame);
}
console.log(JSON.stringify({info, errors}, null, 1));
process.exit(errors.length ? 1 : 0);
