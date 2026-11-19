// Rebels in occupied cities (docs/REBELS-PLAN.md; owner rules 18-19, list item 22: one infantry unit in a captured city beats any rebels), in
// plain Node on the rules (rules/economy.js unrestDay, rebelRise, rebelCrush, rebelHour, pacify; rules/ai.js aiPacify, aiGarrison, aiBrake,
// aiRebelHunt; rules/state.js rbMigrate):
//   node .test/rebels.js            exit 0 when every check holds
// 1. the day table: a city captured at 70% morale falls below 30% on day 7 with no troops (day 11 when the country it was taken from is gone),
//    day 14 with 1 unit (with the country gone it falls 1% a day, stays over 50% and is integrated on day 10), never with 2 (integrated on
//    day 10) or 4 (100% by day 5)
// 2. rebels: certain below 30% at the daily update, not in the 3 days' grace after a capture, not within the 5 days' cooldown; 3, 4, 5 or 6 by
//    the city's people; one infantry unit crushes them as they rise and when it marches in; other ground units fight them; a city with none of
//    its holder's troops goes over after 24 hours alone (not 1: the old bug), to the country it was taken from (at least 2 infantry) or to
//    independence (the rebels stay as its garrison)
// 3. original cities never rebel, the countryside stops at 50% unrest and never rebels, an integrated city never rebels
// 4. Pacify through the rules: $40M, -25, needs a unit, once every 3 days; and the computer's habits (Pacify, the garrison, the brake, the hunt)
// 5. old saves: partisans become rebels with their count reset, occupied cities under 30% get the grace, countryside cut to 50%, integration kept,
//    a seat told once; an old fixture (.test/fixtures/bunker-oldsave.json) loads and plays on
// 6. the same game twice gives the same state (a short nations-world run with uprisings)
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') +
  '\nreturn {IM, get S(){ return S; }, get G(){ return G; }, RB, NEUTRAL, unrestDay, rebelHour, rebelCrush, rebelRise, rebelSize, moraleOf, unrestOf, garrisonOf, rebelGuard, integrated, pacify, pacifyWhy, addArmy, removeEmpty, capture, armyName, count, tick, aiPacify, aiGarrison, aiBrake, aiRebelHunt, desk, setRel: typeof setRel === "function" ? setRel : null};';
const load = () => new Function(SRC)();
// every dispatch of every seat (the first seat's list is S.log itself: rules/core.js desk)
const logs = S => [...(S.log || []), ...Object.values(S.desks || {}).flatMap(D => D.log || [])];
let bad = 0, n = 0; const ok = (c, msg) => { n++; if (!c){ bad++; console.log('FAIL  ' + msg); } else if (process.argv.includes('-v')) console.log('ok    ' + msg); };

// a classic-world game with France as the seat (no AI moves its forces); Germany's cities are taken from it
function game(){ const R = load(), api = R.IM.api; api.useScenario('world'); const fr = WORLD ? null : null;
  api.newGame(12345, 0, []); const S0 = R.S, A = S0.nations.find(N => N.name === 'France').id, B = S0.nations.find(N => N.name === 'Germany').id;
  api.newGame(12345, 0, [A]); const S = R.S, G = R.G; S.started = true;
  const caps = new Set(S.nations.map(N => N.capital)), cities = G.P.filter(P => P.city && S.owner[P.id] === B && !caps.has(P.id)).sort((x, y) => x.pop0 - y.pop0).map(P => P.id)
    .concat(G.P.filter(P => P.city && S.owner[P.id] >= 0 && S.owner[P.id] !== A && S.owner[P.id] !== B && !caps.has(P.id)).map(P => P.id));
  return {R, S, G, A, B, cities}; }
// p becomes A's occupied city at 70% morale with g units of type t standing there (home: B, or independent when free)
function occupy(T, p, g, {t = 'inf', free = false} = {}){ const {R, S, A} = T; S.armies = S.armies.filter(a => a.at !== p); S.home[p] = T.B; R.capture(p, A); if (free) S.home[p] = R.NEUTRAL;
  S.unrest[p] = 30; if (S.dmg) S.dmg[p] = 0; delete (S.rcool || {})[p]; if (g) R.addArmy(A, p, {[t]:g}); return p; }
// days of the daily round until rebels rose in p (the cooldown is set the day they rise), up to max days; the morale each day
function daysToRise(T, p, max){ const {R, S} = T, mor = []; for (let d = 1; d <= max; d++){ S.hour += 24; R.unrestDay(); mor.push(Math.round(R.moraleOf(p))); if ((S.rcool || {})[p] > S.hour) return {d, mor}; } return {d:0, mor}; }

// ---- 1. the day table
{ const T = game(), {R, S, cities} = T, p = cities[0];
  for (const [g, free, want] of [[0, false, 7], [0, true, 11], [1, false, 14], [1, true, 0], [2, false, 0], [2, true, 0], [4, false, 0]]){
    occupy(T, p, g, {free}); const r = daysToRise(T, p, 45);
    ok(r.d === want, `${g} unit(s), original country ${free ? 'gone' : 'there'}: morale under 30% on day ${want || 'never (45 days)'} (got ${r.d || 'never'}; ${r.mor.slice(0, 12).join(' ')})`);
    if (g === 1 && free) ok(R.integrated(p) && r.mor[9] >= 60, `1 unit, original country gone: morale falls 1% a day and stays over 50%, so the city is integrated on day 10 (${r.mor.slice(0, 11).join(' ')})`);
    if (g === 2) ok(R.integrated(p) && r.mor[9] >= 70, `2 units: integrated on day 10 (count ${S.integ[p + ':' + T.A]}, morale ${r.mor.slice(0, 11).join(' ')})`);
    if (g === 4) ok(r.mor[4] === 100, `4 units: 100% by day 5 (${r.mor.slice(0, 6).join(' ')})`); } }

// ---- 2. rebels
{ const T = game(), {R, S, G, A, B, cities} = T, RB = R.RB;
  // sizes by people
  S.pop = S.pop || G.P.map(P => P.pop0); const sz = [0.8, 1.5, 4.9, 5, 19.9, 20].map(pp => { S.pop[cities[0]] = pp; return R.rebelSize(cities[0]); });
  ok(sz.join() === '3,4,4,5,5,6', `rebels 3/4/5/6 for a town/city/large city/metropolis (${sz.join()})`); S.pop[cities[0]] = G.P[cities[0]].pop0;
  // grace: captured at morale 20 (a damaged city): no rebels in the first 3 days, rebels on day 3's update... the 4th day at the latest
  const p = occupy(T, cities[1], 0); S.unrest[p] = 80; const r0 = daysToRise(T, p, 6);
  ok(r0.d === 3, `the 3 days' grace after a capture: rebels on the first update at least 72 h after it (day ${r0.d})`);
  const reb = S.armies.find(a => a.rebel && a.at === p);
  ok(reb && R.count(reb) === R.rebelSize(p) && reb.u.inf === R.count(reb) && reb.owner === R.NEUTRAL, `an uprising in an empty city: ${reb ? R.count(reb) : 0} rebel infantry (want ${R.rebelSize(p)})`);
  ok(reb && R.armyName(reb) === 'Rebels', `they are called "Rebels" (${reb && R.armyName(reb)})`);
  ok(logs(S).some(e => /^Rebels rose up in .* will be lost in 24 h/.test(e.text)), 'the seat is told rebels rose and the city will be lost in 24 h');
  // the 24 hours (the bug: an unset count took the province within the hour)
  const own = () => S.owner[p]; let h = 0; for (; h < 23; h++){ R.rebelHour(); if (own() !== A) break; }
  ok(h === 23 && own() === A, `rebels alone do not take the city within 23 hours (held for ${h} h)`);
  R.rebelHour(); ok(own() === B, `... and take it in the 24th hour, back to Germany (owner ${own()})`);
  const back = S.armies.filter(a => a.at === p && a.owner === B), left = S.armies.filter(a => a.at === p && a.rebel && R.count(a));
  ok(back.length && back.reduce((s, a) => s + a.u.inf, 0) >= 2 && !left.length, `the rebels become Germany's troops (${back.map(a => a.u.inf).join('+')} infantry), none left as rebels`);
  ok(logs(S).some(e => /revolted and rejoined Germany/.test(e.text)), 'the seat is told the city revolted and rejoined Germany');
  ok(S.occ[p] == null && R.unrestOf(p) === 10, 'the city is Germany\'s own again (no occupation, unrest 10)');
  // independence when the original country is gone (or it was independent)
  const q = occupy(T, cities[2], 0, {free:true}); S.unrest[q] = 75; S.occ[q] = S.hour - 100; R.unrestDay(); const rq = S.armies.find(a => a.rebel && a.at === q);
  for (let i = 0; i < 24; i++) R.rebelHour();
  ok(S.owner[q] === R.NEUTRAL && rq && R.count(rq) > 0 && !rq.rebel, `a city with no country to go back to becomes independent; the rebels stay as its garrison (${rq && R.armyName(rq)})`);
  // one infantry unit crushes them as they rise; the cooldown runs
  const c = occupy(T, cities[3], 1); S.unrest[c] = 75; S.occ[c] = S.hour - 100; R.unrestDay();
  ok(!S.armies.some(a => a.rebel && a.at === c) && S.rcool[c] > S.hour && S.owner[c] === A, 'one infantry unit (level I) in the city: the rebels are crushed the moment they rise');
  ok(R.unrestOf(c) === 75 + RB.city - RB.perUnit - RB.rise, `... morale +15 with the rising (unrest ${R.unrestOf(c)})`);
  for (const t of ['at', 'spec', 'para']){ const c2 = occupy(T, cities[4], 1, {t}); S.unrest[c2] = 75; S.occ[c2] = S.hour - 100; R.unrestDay(); ok(!S.armies.some(a => a.rebel && a.at === c2), `... any infantry type: ${t}`); }
  S.unrest[c] = 90; const cd = []; for (let d = 1; d <= 6; d++){ S.hour += 24; const k = S.rcool[c]; R.unrestDay(); cd.push(S.rcool[c] !== k ? d : 0); }
  ok(cd.filter(Boolean)[0] === 5, `the 5 days' cooldown: the next uprising on day 5 (${cd.join(' ')})`);
  // a tank garrison does not crush them: they fight by the battle rules; the city is not lost while the tanks stand there
  const tk = occupy(T, cities[5], 2, {t:'tank'}); S.unrest[tk] = 75; S.occ[tk] = S.hour - 100; R.unrestDay(); const rt = S.armies.find(a => a.rebel && a.at === tk);
  ok(rt && R.count(rt) > 0, 'a garrison of tanks (no infantry): the rebels rise and fight it');
  for (let i = 0; i < 30; i++) R.rebelHour(); ok(S.owner[tk] === A && rt.hold === 0, 'while the tanks stand there the 24 hours do not run');
  // infantry marching in crushes them (the hour's check after the forces moved, rules/tick.js)
  const nb = [...G.P[tk].nb.keys()].find(v => !G.P[v].sea && S.owner[v] === A) ?? [...G.P[tk].nb.keys()].find(v => !G.P[v].sea);
  S.owner[nb] = A; S.armies = S.armies.filter(a => a.at !== nb); const inf = R.addArmy(A, nb, {inf:1}); R.IM.api.orderMove(inf, tk);
  let k = 0; for (; k < 60 && S.armies.some(a => a.rebel && a.at === tk && R.count(a)); k++) R.tick();
  const mineAt = S.armies.filter(a => a.owner === A && a.at === tk && a.to === null).reduce((s0, a) => s0 + a.u.inf, 0);
  ok(!S.armies.some(a => a.rebel && a.at === tk && R.count(a)) && S.owner[tk] === A && mineAt === 1 && k <= 30, `one infantry unit marching in crushes them on arrival, without losses (${k} h, ${mineAt} infantry there)`);
  ok(logs(S).some(e => /^Your infantry crushed the rebels in /.test(e.text)), 'the seat is told its infantry crushed the rebels'); }

// ---- 3. who never rebels
{ const T = game(), {R, S, G, A, cities} = T;
  const home = G.P.find(P => P.city && S.owner[P.id] === A && P.id !== S.nations[A].capital).id; S.armies = S.armies.filter(a => a.at !== home); S.unrest[home] = 90;
  const rural = G.P.find(P => !P.city && !P.sea && S.owner[P.id] === T.B).id; S.armies = S.armies.filter(a => a.at !== rural); R.capture(rural, A); S.unrest[rural] = 45;
  const ig = occupy(T, cities[0], 2); for (let d = 0; d < 10; d++){ S.hour += 24; R.unrestDay(); } S.armies = S.armies.filter(a => a.at !== ig); S.unrest[ig] = 90;
  for (let d = 0; d < 12; d++){ S.hour += 24; R.unrestDay(); }
  ok(!S.armies.some(a => a.rebel) && S.owner[home] === A, 'your original cities never rebel (90% unrest, no troops, 12 days)');
  ok(R.unrestOf(rural) === 50 && R.moraleOf(rural) >= 50 && S.owner[rural] === A, `the countryside stops at 50% morale and never rebels (unrest ${R.unrestOf(rural)})`);
  ok(R.integrated(ig) && S.owner[ig] === A && R.unrestOf(ig) === 90 - 4*12, `an integrated city never rebels and recovers 4% a day (unrest ${R.unrestOf(ig)})`); }

// ---- 4. Pacify, and the computer's habits
{ const T = game(), {R, S, G, A, B, cities} = T, N = S.nations[A];
  const p = occupy(T, cities[0], 0); S.unrest[p] = 60; N.cash = 100;
  ok(R.pacifyWhy(A, p) === 'needs a unit in the province' && !R.pacify(A, p), `Pacify needs a unit of yours in the city ("${R.pacifyWhy(A, p)}")`);
  R.addArmy(A, p, {tank:1}); ok(R.pacify(A, p) && R.unrestOf(p) === 35 && N.cash === 60, `Pacify: $40M, unrest -25 (unrest ${R.unrestOf(p)}, cash ${N.cash})`);
  ok(/^again in 3 days$/.test(R.pacifyWhy(A, p)) && !R.pacify(A, p), `... once every 3 days ("${R.pacifyWhy(A, p)}")`);
  S.hour += 72; ok(R.pacifyWhy(A, p) === '' && R.pacify(A, p), '... and again after 3 days');
  N.cash = 30; S.hour += 72; ok(R.pacifyWhy(A, p) === 'needs $40M', `... and it costs $40M ("${R.pacifyWhy(A, p)}")`);
  ok(typeof R.IM.api.pacify === 'function' && typeof R.IM.api.pacifyWhy === 'function', 'Pacify is an order of the rules API (IM.api.pacify, pacifyWhy)');
  // the computer: B (an AI nation) holds a city it took from A
  const q = cities[1]; S.armies = S.armies.filter(a => a.at !== q); S.owner[q] = A; S.home[q] = A; R.capture(q, B); S.unrest[q] = 60; const NB = S.nations[B]; NB.cash = 500; R.addArmy(B, q, {inf:1});
  R.aiPacify(B, NB); ok(R.unrestOf(q) === 35 && NB.cash === 460, `the AI pays for Pacify in a captured city under 45% morale with a unit in it (unrest ${R.unrestOf(q)})`);
  NB.cash = 90; S.hour += 80; S.unrest[q] = 60; R.aiPacify(B, NB); ok(R.unrestOf(q) === 60, '... only while it holds $100M or more');
  // the garrison: an idle stack in a captured city leaves 2 units, infantry first
  S.armies = S.armies.filter(a => a.at !== q); const st = R.addArmy(B, q, {inf:3, tank:3}), idleBy = new Map([[q, [st]]]); R.aiGarrison(B, idleBy);
  const gar = S.armies.filter(a => a.owner === B && a.at === q && a !== st);
  ok(gar.length === 1 && gar[0].u.inf === 2 && R.count(gar[0]) === 2 && idleBy.get(q).includes(st) && R.count(st) === 4, `the AI keeps 2 infantry in a captured city; the rest of the stack stays free (${gar.map(a => JSON.stringify(a.u)).join()})`);
  const st2 = R.addArmy(B, cities[2], {tank:2}); S.owner[cities[2]] = B; S.home[cities[2]] = A; const ib2 = new Map([[cities[2], [st2]]]); R.aiGarrison(B, ib2);
  ok(!ib2.get(cities[2]).length, 'a small stack in a captured city stays there whole');
  // the brake: 2 captured cities under 40% morale
  for (const c of [cities[3], cities[4]]){ S.armies = S.armies.filter(a => a.at !== c); S.owner[c] = A; S.home[c] = A; R.capture(c, B); S.unrest[c] = 30; }
  const b0 = R.aiBrake(B); S.unrest[cities[3]] = 65; const b1 = R.aiBrake(B); S.unrest[cities[4]] = 65; const b2 = R.aiBrake(B);
  ok(!b0 && !b1 && b2, `the AI starts no new attack while 2 captured cities are under 40% morale (none: ${b0}, 1: ${b1}, 2: ${b2})`);
  // the hunt: rebels in a city of its own, the nearest idle force with infantry goes in
  const h = cities[5]; S.armies = S.armies.filter(a => a.at !== h); S.owner[h] = A; S.home[h] = A; R.capture(h, B); const rb = R.addArmy(R.NEUTRAL, h, {inf:4}); rb.rebel = true; rb.hold = 0;
  const nb = [...G.P[h].nb.keys()].find(v => !G.P[v].sea); S.owner[nb] = B; const hunter = R.addArmy(B, nb, {inf:2, tank:2}), used = new Set(); R.aiRebelHunt(B, [hunter], used);
  ok(used.has(hunter) && hunter.path[hunter.path.length - 1] === h, `the AI sends the nearest idle force with infantry against rebels in its city (path ${hunter.path.join(' ')})`); }

// ---- 5. old saves
{ const T = game(), {R, S, G, A, cities} = T, api = R.IM.api;
  const low = occupy(T, cities[0], 0); S.unrest[low] = 80; S.occ[low] = S.hour - 300;
  const rural = G.P.find(P => !P.city && !P.sea && S.owner[P.id] === T.B).id; S.armies = S.armies.filter(a => a.at !== rural); R.capture(rural, A); S.unrest[rural] = 85;
  const pq = occupy(T, cities[1], 0); S.unrest[pq] = 40; const pt = R.addArmy(R.NEUTRAL, pq, {inf:4}); pt.rebel = true;   // partisans of the old rule: no count
  const ig = occupy(T, cities[2], 0); (S.integ || (S.integ = {}))[ig + ':' + A] = 14; S.unrest[ig] = 20;
  const d = JSON.parse(api.saveJSON()); delete d.rb; delete d.rcool; delete d.pcool; for (const a of d.armies) if (a.rebel) delete a.hold;
  const R2 = load(), a2 = R2.IM.api; ok(a2.restore(d), 'an old save (before the rebels rule) loads');
  const S2 = R2.S, pt2 = S2.armies.find(a => a.rebel && a.at === pq);
  ok(S2.rb === 1 && pt2 && pt2.hold === 0 && R2.armyName(pt2) === 'Rebels', 'its partisans are rebels now, their 24 hours start again');
  ok(S2.rcool[low] === S2.hour + 72 && R2.unrestOf(rural) === 50 && R2.integrated(ig), `the grace for an occupied city under 30% (${S2.rcool[low] - S2.hour} h), countryside cut to 50% unrest (${R2.unrestOf(rural)}), integration kept`);
  ok(logs(S2).some(e => /^New rule: rebels/.test(e.text)), 'the seat is told about the new rule');
  for (let h = 0; h < 23; h++) a2.tick(); ok(S2.owner[pq] === A, 'the old partisans do not take their city within the hour (23 h after the load: still yours)');
  for (let h = 0; h < 2; h++) a2.tick(); ok(S2.owner[pq] !== A, 'they take it after 24 hours alone');
  ok(!S2.armies.some(a => a.rebel && a.at === low), 'no uprising in the city under 30% during the grace (one day after the load)');
  for (let h = 0; h < 72; h++) a2.tick(); ok(S2.armies.some(a => a.rebel && a.at === low) || S2.owner[low] !== A, 'after the grace the rebels rise there');
  const s3 = a2.saveJSON(), R3 = load(); ok(R3.IM.api.restore(JSON.parse(s3)) && R3.S.rb === 1 && JSON.stringify(R3.S.rcool) === JSON.stringify(S2.rcool), 'a save of this build loads unchanged (no second migration)');
  // a real save of an older build (bunker rule fixture: a classic game, day 30, occupied land) loads and plays on
  const old = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'bunker-oldsave.json'), 'utf8')), R4 = load();
  ok(R4.IM.api.restore(old) && R4.S.rb === 1, 'the bunker fixture (an older build\'s save) loads'); let err = null; try { for (let h = 0; h < 5*24; h++) R4.IM.api.tick(); } catch (e) { err = e.message; }
  ok(!err && R4.S.nations.filter(N => N.alive).every(N => N.cash > -1e-6), `... and plays 5 days on with every nation solvent (${err || 'no error'})`); }

// ---- 6. the same game twice (the nations world, 12 days: captures and uprisings)
{ const run = () => { const R = load(), api = R.IM.api; api.useScenario('world64'); api.newGame(7, 0, []); R.S.started = true; let ris = 0;
    for (let h = 0; h < 12*24; h++){ for (let q = 0; q < api.BATTLE_Q; q++) api.tickQ(); } const o = JSON.parse(api.saveJSON()); delete o.savedAt; const s = JSON.stringify(o);
    let h1 = 0x811c9dc5; for (let i = 0; i < s.length; i++) h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619); return (h1 >>> 0).toString(16); };
  const x = run(), y = run(); ok(x === y, `the same seed twice: the same state (${x} ${y})`); }

console.log(bad ? `FAILED ${bad} of ${n} checks` : `OK ${n} checks`); process.exit(bad ? 1 : 0);
