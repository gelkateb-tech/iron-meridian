// Occupation, morale, annexing and rebels (owner points 8-11 of 2026-11-25; docs/REBELS-PLAN.md with the answers R1-R17), plain Node, no browser:
//   node .test/rebels2.js            every check below, with the 30-day trade comparison (plan 5.3; about 3 minutes)
//   node .test/rebels2.js --quick    without the 30-day comparison
// 1 the numbers and the start; 2 the daily step; 3 base targets and every modifier; 4 output, status and administration; 5 the rebel chance
// and its curve; 6 a rising against troops (a real fight, dug in, the annexing carries on) and against an empty city (city, annexing and cost
// lost; back to its country, or independent); 7 Annex City from start to end (price, slot, mobilizing, countryside, lost on capture); 8 land by
// treaty, sale or gift; Incite revolt; 9 trade (point 11): the lost slot, the 25% shock, the end; 10 the computer's habits; 11 an old save with
// the old unrest rule loads and converts (.test/fixtures/unrest-oldsave.json, made by master c779703) and plays on; 12 point 11 over 30 days.
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..')), QUICK = process.argv.includes('--quick');
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const NAMES = 'IM, nearestCity, MOR, ANNEX_COST, REBEL_SIZE, morOf, morShown, setMor, occSt, occFactor, admW, gcKm, natMor, morTarget, morFactors, moraleDay, rebelChance, rebelOdds, rebelRolls, rebelRise, rebelFlip, rebelHour, rebelSize, rebelBand, garrisonOf, rebelsAt, annexCost, annexWhy, annexCity, consHour, mobBlock, canMobilize, capture, addArmy, setRel, atWar, provYield, income, income0, warDamage, casOf, landGiven, cede, sendGift, terrTransfer, spyHour, spyCheck, trS, tradeGen, tradeIncome, trShock, trLost, holdsOcc, lostRoutesOf, removeEmpty, armyById, count, popOf, ownedBy, dugIn, digF, DIG_CITY, aiAnnex, aiBrake, NEUTRAL, bunkerLv, knockOut, score, checkNation, INCC';
const SKIP = "let SKIP_AI = -1; for (const nm of ['aiTurn', 'aiAir', 'aiMissiles', 'aiSpies', 'aiCapBase']) eval(nm + ' = (f => function(n){ if (n === SKIP_AI) return; return f.apply(this, arguments); })(' + nm + ')');";
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\n' + SKIP + '\nreturn {' + NAMES + ', setSkip:v => { SKIP_AI = v; }, get S(){ return S; }, get G(){ return G; }};';
const errors = []; let checks = 0; const ok = (c, msg) => { checks++; if (!c) errors.push(msg); };
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;
const load = () => new Function(SRC)();
const R = load(), api = R.IM.api;
api.useScenario('world64'); api.newGame(12345, 0, []);
let S = R.S, G = R.G;
const id = nm => S.nations.findIndex(N => N.name === nm), city = (n, nm) => G.P.find(P => P.city && P.cityName === nm && (n == null || S.owner[P.id] === n));
const PL = id('Poland'), DE = id('Germany'), FR = id('France'), RU = id('Russia'), US = id('United States'), CZ = -1;
api.newGame(12345, 0, [PL]); S = R.S; G = R.G; S.started = true;
const day = () => { for (let h = 0; h < 24; h++) api.tick(); };
const rowsOf = p => { const F = R.morFactors(p); const o = {}; for (const r of F.rows) o[r.k] = r; return {F, o}; };
const strip = p => { for (const a of S.armies) if (a.at === p && !a.air) for (const t in a.u){ a.u[t] = 0; a.w[t] = 0; } R.removeEmpty(); };
// a German city taken by Poland the way rules/combat.js capture leaves it
const take = (p, to) => { strip(p); R.capture(p, to); };

// ---- 1. the numbers and the start
ok(R.MOR.start === 70 && R.MOR.occ === 25 && R.MOR.lib === 55 && R.MOR.rate === 8, 'start 70, occupied 25, liberated 55, an eighth a day');
ok(R.MOR.home === 90 && R.MOR.anx === 75 && R.MOR.occT === 60 && R.MOR.rural === 100, 'base targets 90 / 75 / 60 / 100');
ok(R.MOR.kmStep === 5 && R.MOR.kmUnit === 1000 && R.MOR.kmMax === 30 && R.MOR.war === 2 && R.MOR.warMax === 25 && R.MOR.foeNb === 5 && R.MOR.foeHere === 1, 'distance, wars, enemy neighbours, enemy units');
ok(R.MOR.low === 40 && R.MOR.lowC === 7 && R.MOR.lowR === 4 && R.MOR.hiC === 3 && R.MOR.hiR === 1, 'low and high neighbours -7/-4, +3/+1');
ok(R.MOR.shortMax === 50 && R.MOR.casMax === 30 && near(R.MOR.casFade, 2/3) && R.MOR.capLost === 20 && R.MOR.cap === 25 && R.MOR.bunk.join() === '0,5,10,20,35,50' && R.MOR.mob === 5, 'shortage 50, casualties 30 fading a third, capital lost 20, capital 25, Bunker 5/10/20/35/50, Mobilisation 5');
ok(R.MOR.occOut === 0.25 && R.MOR.anxOut === 0.5 && R.MOR.occAdm === 0.25 && R.MOR.anxAdm === 0.5, 'output 25% / 50%; administration a quarter / a half');
ok(JSON.stringify(R.ANNEX_COST) === JSON.stringify([{cash:50, mp:10, days:3}, {cash:80, mp:15, days:4}, {cash:120, mp:25, days:5}, {cash:180, mp:40, days:6}]), 'Annex City option B prices');
ok(R.REBEL_SIZE.join() === '3,4,5,6', 'rebels 3/4/5/6');
ok(G.P.every((P, p) => P.sea || S.mor[p] === 70), 'every land province starts at 70');
ok(S.mv === 1 && S.anx && typeof S.anx === 'object' && S.cas && !('unrest' in S), 'a new game carries the morale rule (S.mv), no unrest');

// ---- 2. the daily step: every province moves (target - morale)/8 toward the target worked out from the morale of the day before
{ const p = city(DE, 'Dresden').id; const seq = []; let m = 25; for (let i = 0; i < 6; i++){ m = Math.round((m + (55 - m)/8)*100)/100; seq.push(Math.round(m)); }
  ok(seq.join() === '29,32,35,37,40,42', 'a city taken at 25 with a target of 55 shows 29, 32, 35, 37, 40, 42 (plan 2.1): ' + seq.join());
  R.setMor(p, 33.3333); ok(S.mor[p] === 33.33, 'morale stored to two decimals');
  // against the real day change
  for (let p2 = 0; p2 < G.P.length; p2++) if (!G.P[p2].sea && p2 % 7 === 0) R.setMor(p2, 20 + (p2 % 70));
  const prev = S.mor.slice(), want = new Map();
  const I = new Map(), info = o => I.get(o) || I.set(o, R.natMor(o)).get(o);
  for (let q = 0; q < G.P.length; q++){ const o = S.owner[q]; if (G.P[q].sea || !(o >= 0)) continue; const T = R.morTarget(q, v => prev[v], info(o), null, false); want.set(q, Math.round(Math.max(0, Math.min(100, prev[q] + (T - prev[q])/8))*100)/100); }
  const own0 = S.owner.slice(); R.moraleDay(); let bad = 0, n = 0; for (const [q, v] of want){ if (S.owner[q] !== own0[q]) continue; n++; if (S.mor[q] !== v) bad++; }
  ok(n > 2000 && bad === 0, `the day change moves every province an eighth of the way to its target (${n} provinces, ${bad} off)`);
  for (let p2 = 0; p2 < G.P.length; p2++) if (!G.P[p2].sea) S.mor[p2] = 70; }

// ---- 3. base targets and every modifier
const dresden = city(DE, 'Dresden').id, berlin = S.nations[DE].capital, warsaw = S.nations[PL].capital;
{ const { o } = rowsOf(dresden); ok(o.base.v === 90 && o.base.st === 'home', 'a homeland city: base 90');
  const rural = G.P.find(P => !P.sea && !P.city && S.owner[P.id] === DE).id; ok(rowsOf(rural).o.base.v === 100, 'countryside: base 100'); }
// distance: straight line to the capital of the moment, -5 per 1,000 km rounded, at most -30 (question 2)
{ const D = (nat, nm) => { const N = S.nations[id(nat)], P = city(id(nat), nm); return P ? {km:Math.round(R.gcKm(P.id, N.capital)), v:rowsOf(P.id).o.dist.v} : null; };
  const cases = [['Russia', 'Saint Petersburg', 683, -5], ['Russia', 'Novosibirsk', 2816, -15], ['Russia', 'Vladivostok', 6449, -30], ['United States', 'New York', 250, 0], ['United States', 'Los Angeles', 3693, -20], ['United States', 'Anchorage', 5396, -25],
    ['France', 'Lyon', 355, 0], ['France', 'Marseille', 676, -5], ['Germany', 'Cologne', 448, 0], ['China', 'Guangzhou', 1874, -10]];
  for (const [nat, nm, km, v] of cases){ const d = D(nat, nm); ok(d && Math.abs(d.km - km) <= 60 && d.v === v, `${nm}: ${km} km, ${v} (got ${JSON.stringify(d)})`); }
  const cay = city(FR, 'Cayenne'); if (cay){ const d = D('France', 'Cayenne'); ok(d.km > 6500 && d.v === -30, `Cayenne ${d.km} km: -35 limited to -30`); }
  ok(rowsOf(warsaw).o.dist.v === 0, 'the capital itself: 0 km'); }
// the capital +25, Bunker levels, knocked out
{ const { o } = rowsOf(warsaw); ok(o.cap.v === 25, 'the capital city: +25');
  const keep = S.bld[dresden].fort; for (let l = 1; l <= 5; l++){ S.bld[dresden].fort = l; ok(rowsOf(dresden).o.bunker.v === [0, 5, 10, 20, 35, 50][l], `Bunker ${l}: +${[0, 5, 10, 20, 35, 50][l]}`); }
  S.bld[dresden].fort = 3; R.knockOut(dresden, 'fort', 10); ok(rowsOf(dresden).o.bunker.v === 0, 'a knocked-out Bunker gives nothing'); delete S.bdis[dresden]; S.bld[dresden].fort = keep; }
// wars: -2 a nation, 0-VP nations not counted, at most -25, rebels one more while they stand in one of its cities
{ R.setRel(PL, DE, 'war'); ok(rowsOf(warsaw).o.wars.v === -2, 'one war: -2');
  R.setRel(PL, FR, 'war'); ok(rowsOf(warsaw).o.wars.v === -4, 'two wars: -4');
  const ghost = S.nations.find(N => N.id !== PL && N.alive && R.ownedBy(N.id).length < 20 && !R.atWar(PL, N.id)); const held = R.ownedBy(ghost.id); for (const p of held) S.owner[p] = -1;
  R.setRel(PL, ghost.id, 'war'); ok(R.score(ghost.id) === 0 && rowsOf(warsaw).o.wars.v === -4, 'a nation with no land (0 VP) does not count'); for (const p of held) S.owner[p] = ghost.id; R.setRel(PL, ghost.id, 'peace');
  const many = S.nations.filter(N => N.alive && N.id !== PL && !R.atWar(PL, N.id)).slice(0, 14); for (const N of many) R.setRel(PL, N.id, 'war');
  ok(rowsOf(warsaw).o.wars.v === -25, 'sixteen wars: -25 at most'); for (const N of many) R.setRel(PL, N.id, 'peace');
  const pc = G.P.find(P => P.city && S.owner[P.id] === PL && P.id !== warsaw).id, r = R.addArmy(R.NEUTRAL, pc, {inf:3}); r.rebel = true;
  ok(rowsOf(warsaw).o.wars.v === -6 && rowsOf(warsaw).o.wars.reb === 1, 'rebels in one of its cities: one more war (-6)'); strip(pc); R.addArmy(PL, pc, {inf:2}); R.setRel(PL, FR, 'peace'); }
// enemy neighbours (-5 a nation-held neighbour at war; independent land not), enemy units here (-1 whatever their number)
{ const border = G.P.find(P => !P.sea && S.owner[P.id] === PL && P.nbs.filter(v => S.owner[v] === DE).length >= 2 && !P.city);
  const k = border.nbs.filter(v => S.owner[v] === DE).length; ok(rowsOf(border.id).o.foeNb.v === -5*k, `a Polish province with ${k} German neighbours at war: ${-5*k}`);
  const v0 = border.nbs.find(v => S.owner[v] === DE); S.owner[v0] = -1; ok(rowsOf(border.id).o.foeNb.v === -5*(k - 1), 'independent land is not an enemy neighbour'); S.owner[v0] = DE;
  const a1 = R.addArmy(DE, border.id, {inf:1}); ok(rowsOf(border.id).o.foeHere.v === -1, 'an enemy force here: -1'); const a2 = R.addArmy(DE, border.id, {tank:3}); ok(rowsOf(border.id).o.foeHere.v === -1, 'two enemy forces: still -1');
  a1.u.inf = 0; a2.u.tank = 0; R.removeEmpty(); const r = R.addArmy(R.NEUTRAL, border.id, {inf:2}); r.rebel = true; ok(rowsOf(border.id).o.foeHere.v === -1, 'rebels here: -1'); r.u.inf = 0; R.removeEmpty();
  ok(rowsOf(border.id).o.foeHere.v === 0, 'none: 0'); }
// low and high-morale neighbours, by what the neighbour is (question 8), whole numbers shown
{ const P = G.P.find(P => !P.sea && S.owner[P.id] === PL && P.nbs.some(v => G.P[v].city && S.owner[v] === PL) && P.nbs.some(v => !G.P[v].city && !G.P[v].sea && S.owner[v] === PL));
  const c = P.nbs.find(v => G.P[v].city && S.owner[v] === PL), r = P.nbs.find(v => !G.P[v].city && !G.P[v].sea && S.owner[v] === PL);
  const others = P.nbs.filter(v => v !== c && v !== r && S.owner[v] === PL); for (const v of others) S.mor[v] = 70;
  S.mor[c] = 40.4; S.mor[r] = 39; ok(rowsOf(P.id).o.lowNb.v === -11, 'a city neighbour at 40 (40.4 shown 40): -7, a countryside one at 39: -4');
  S.mor[c] = 40.5; S.mor[r] = 41; ok(rowsOf(P.id).o.lowNb.v === 0, 'at 41 (40.5 shown 41): nothing');
  S.mor[c] = 99.5; S.mor[r] = 100; ok(rowsOf(P.id).o.hiNb.v === 4, 'a city neighbour at 100 (99.5): +3, a countryside one: +1');
  S.mor[c] = 99.4; ok(rowsOf(P.id).o.hiNb.v === 1, '99.4 shows 99: nothing for it');
  S.mor[c] = 70; S.mor[r] = 70; }
// shortage: -50 x the share of the day's need unmet, at least -5, at most -50 together
{ const N = S.nations[PL]; N.shortU = {oil:1/3}; ok(rowsOf(warsaw).o.short.v === -17, 'a third of the oil need unmet: -17');
  N.shortU = {elec:0.01}; ok(rowsOf(warsaw).o.short.v === -5, 'a trickle of electronics: -5');
  N.shortU = {iron:1, oil:0.5}; ok(rowsOf(warsaw).o.short.v === -50, 'no iron at all and half the oil: -50 at most'); delete N.shortU;
  ok(rowsOf(warsaw).o.short.v === 0, 'supplied: 0'); }
// civilian casualties: half a point a point of war damage, at most 30, a third off at each day change
{ const p = G.P.find(P => P.city && S.owner[P.id] === PL && P.id !== warsaw).id; R.warDamage(p, 22); ok(near(R.casOf(p), 11) && rowsOf(p).o.cas.v === -11, 'a ballistic missile (22): -11');
  R.warDamage(p, 26); ok(near(R.casOf(p), 24), 'a day of fighting more: 24'); R.warDamage(p, 40); ok(R.casOf(p) === 30, 'at most 30');
  S.cas[p] = 24; R.moraleDay(); ok(near(S.cas[p], 16, 0.01), 'a third off at the day change: 24 -> 16'); R.moraleDay(); ok(near(S.cas[p], 10.67, 0.01), '16 -> 10.7'); delete S.cas[p];
  for (let q = 0; q < G.P.length; q++) if (!G.P[q].sea) S.mor[q] = 70; }
// capital lost (-20 everywhere), Mobilisation (-5 a level on homeland only)
{ const cp = S.nations[PL].capital, keep = S.owner[cp]; S.owner[cp] = DE; const pc = G.P.find(P => P.city && S.owner[P.id] === PL).id; ok(rowsOf(pc).o.capLost.v === -20, 'the original capital held by another: -20'); S.owner[cp] = keep;
  S.nations[PL].mob = 2; ok(rowsOf(pc).o.mob.v === -10, 'Mobilisation level 2: -10 on homeland'); S.nations[PL].mob = 0; }
// target kept within 0-100; the city panel's figures
{ const { F } = rowsOf(warsaw); ok(F.target <= 100 && F.target >= 0 && F.rows.length === 13, 'the target within 0-100, 13 rows (base and 12 modifiers)');
  const sum = F.rows.reduce((s0, r) => s0 + r.v, 0); ok(F.target === Math.max(0, Math.min(100, sum)), `the target is the sum of the rows, kept within 0-100 (${sum} -> ${F.target})`); }

// ---- 4. output by status and morale; administration
{ const p = dresden, y0 = R.provYield(p).cash, m = R.morOf(p); take(p, PL); R.setMor(p, m);
  ok(R.occSt(p) === 'occ' && near(R.provYield(p).cash/y0, 0.25, 1e-9), `occupied: 25% of the output (${(R.provYield(p).cash/y0).toFixed(3)})`);
  S.anx[p] = PL; ok(R.occSt(p) === 'anx' && near(R.provYield(p).cash/y0, 0.5, 1e-9), 'annexed: 50%'); delete S.anx[p];
  R.setMor(p, 0); const y00 = R.provYield(p).cash; R.setMor(p, 100); ok(near(R.provYield(p).cash/y00, 1/0.45, 1e-6), 'the morale link as before: 45% at 0, 100% at 100');
  ok(R.admW(p) === 0.25 && R.admW(warsaw) === 1, 'administration: an occupied province counts a quarter'); S.anx[p] = PL; ok(R.admW(p) === 0.5, 'an annexed one a half'); delete S.anx[p];
  ok(R.morShown(p) === 100 && (R.setMor(p, 30), true), ''); }

// ---- 5. the rebel chance (question 1): 0 at 33, 50% at 25, 100% at 10; halved for each ground unit of the holder in the city
{ const T = {33:0, 32:6.25, 31:12.5, 30:18.75, 29:25, 28:31.25, 27:37.5, 26:43.75, 25:50, 22:60, 20:66.67, 17:76.67, 15:83.33, 12:93.33, 10:100, 5:100, 0:100, 34:0, 70:0};
  for (const m in T) ok(near(R.rebelChance(+m)*100, T[m], 0.01), `chance at ${m}%: ${T[m]}% (got ${(R.rebelChance(+m)*100).toFixed(2)})`);
  const p = dresden; strip(p); R.setMor(p, 28); ok(near(R.rebelOdds(p, PL), 0.3125), 'Dresden at 28, empty: 31%');
  R.addArmy(PL, p, {inf:2}); ok(near(R.rebelOdds(p, PL), 0.3125/4), 'with 2 units: 8%'); const t = R.addArmy(PL, p, {tank:1}); ok(near(R.rebelOdds(p, PL), 0.3125/8), 'any ground unit counts: 3 units, 4%');
  const w = R.addArmy(PL, p, {jet:2}); w.air = {base:p, cd:0}; ok(near(R.rebelOdds(p, PL), 0.3125/8), 'aircraft do not count'); w.u.jet = 0; R.removeEmpty();
  const F = R.morFactors(p); ok(F.burning && F.units === 3 && near(F.chance, 0.3125/8) && F.size === R.rebelSize(p), 'the panel: burning, 3 units, the chance after the troop rule');
  // the bands by people
  ok([0.9, 1.5, 4.9, 5, 19.9, 20].map(v => { S.pop[p] = v; return R.rebelSize(p); }).join() === '3,4,4,5,5,6', 'rebel sizes by people: 3 under 1.5M, 4, 5 from 5M, 6 from 20M'); S.pop[p] = G.P[p].pop0;
  // no roll above 33 or in the countryside; the measured rate at 25% with 1 unit (25%)
  strip(p); R.addArmy(PL, p, {inf:1}); R.setMor(p, 25); let rises = 0; const N0 = 600, h = R.IM.on('rising', () => rises++);
  for (let i = 0; i < N0; i++){ S.rs = (i*2654435761) | 0; R.rebelRolls(); const r = R.rebelsAt(p); if (r){ r.u.inf = 0; R.removeEmpty(); S.rbl = []; } }
  ok(rises > N0*0.19 && rises < N0*0.31, `at 25% with one unit about a quarter of the nights see a rising: ${rises}/${N0}`);
  const r0 = rises; R.setMor(p, 34); for (let i = 0; i < 100; i++){ S.rs = i; R.rebelRolls(); } ok(rises === r0, 'none at 34%');
  const rural = G.P.find(P => !P.sea && !P.city && S.owner[P.id] === PL).id; R.setMor(rural, 0); R.setMor(p, 70); for (let i = 0; i < 50; i++){ S.rs = i; R.rebelRolls(); } ok(rises === r0 && S.owner[rural] === PL, 'the countryside never rebels'); R.setMor(rural, 70); }

// ---- 6. a rising against troops: a real battle with the +25% dug-in bonus, the city stays the holder's, the annexing carries on
{ const p = city(DE, 'Nürnberg') ? city(DE, 'Nürnberg').id : G.P.find(P => P.city && S.owner[P.id] === DE && P.id !== berlin).id; take(p, PL); R.setMor(p, 20);
  S.nations[PL].cash = 2000; S.nations[PL].mp = 500; ok(R.annexCity(PL, p) && S.cons[p] && S.cons[p].k === 'annex', 'Annex City started while the city burns');
  const g = R.addArmy(PL, p, {inf:6}); g.still = S.hour;   // (arrived this hour: not dug in yet)
  R.setSkip(DE); const n = R.rebelSize(p), rb = R.rebelRise(p, PL); ok(rb && rb.rebel && R.count(rb) === n && S.owner[p] === PL, `rebels rise (${n}) and fight; the city stays Poland's`);
  ok(R.dugIn(g) && near(R.digF(g), R.DIG_CITY), 'the garrison counts as dug in for the fight (+25% in a city), however long it has stood there');
  const h0 = S.cons[p].h; let fought = false, crushed = 0; const hc = R.IM.on('rebelsCrushed', () => crushed++);
  for (let h = 0; h < 24*6 && R.rebelsAt(p); h++){ api.tick(); if (S.battles.includes(p)) fought = true; }
  api.tick();   // (the end of the fight is told at the next hour)
  ok(fought && !R.rebelsAt(p) && S.owner[p] === PL && crushed === 1, `a real battle; 6 dug-in infantry crush ${n} rebels; the city stays (${JSON.stringify({fought, crushed, owner:S.owner[p]})})`);
  ok(S.cons[p] && S.cons[p].k === 'annex' && S.cons[p].h < h0, 'the annexing carried on through the fight');
  // a rising against too small a garrison: the rebels win and take the city
  const q = G.P.find(P => P.city && S.owner[P.id] === DE && P.id !== berlin && P.id !== p).id; take(q, PL); R.addArmy(PL, q, {inf:1}); R.setMor(q, 15); const cash0 = S.nations[PL].cash; R.annexCity(PL, q); const paid = cash0 - S.nations[PL].cash;
  let lost = null; R.IM.on('rebelFlip', (pp, o, to, how) => { if (pp === q) lost = how; }); R.rebelRise(q, PL);
  for (let h = 0; h < 24*4 && S.owner[q] === PL; h++) api.tick();
  ok(S.owner[q] === DE && lost === 'fought' && !S.cons[q] && S.nations[PL].cash <= cash0 - paid + 1e3, `one infantry loses to the rebels: the city goes back to Germany, the annexing and its $${paid}M are lost (${lost})`);
  ok(R.morOf(q) === 55 && S.armies.some(a => a.owner === DE && a.at === q && R.count(a) >= 2) && !S.armies.some(a => a.rebel && a.at === q), 'Germany gets it back liberated (55) with the rebels as its troops'); }
// a garrison as large as the rebel band that has just fought for the city (battle morale 60) holds it: against rebels alone it loses no battle
// morale and never breaks or retreats (RULES CRITIC 1: before, it broke at 15 and walked out, and the rebels took the city as 'fought')
{ const r = G.P.filter(P => P.city && S.owner[P.id] === DE && P.id !== berlin && !S.battles.includes(P.id) && R.rebelBand(P.id) === 1)[0].id; take(r, PL); R.setMor(r, 20);
  const n = R.rebelSize(r), g = R.addArmy(PL, r, {inf:n}); g.m = 60; g.still = S.hour - 24; R.setSkip(DE);
  const said = []; R.IM.on('log', (nn, t) => { if (nn === PL) said.push(t); });
  let broke = false, mMin = 100, fought = false; R.rebelRise(r, PL);
  for (let h = 0; h < 24*8 && R.rebelsAt(r) && S.owner[r] === PL; h++){ api.tick(); if (S.battles.includes(r)) fought = true; if (R.count(g)){ mMin = Math.min(mMin, g.m); if (g.retreating || g.at !== r || g.path && g.path.length) broke = true; } }
  ok(fought && S.owner[r] === PL && !R.rebelsAt(r) && !broke && mMin >= 60, `${n} tired infantry (morale 60) against ${n} rebels: they hold and crush them, never breaking (${JSON.stringify({owner:S.owner[r], broke, mMin, left:R.count(g)})})`);
  const txt = said.join('\n');
  ok(!/Independent attacks/.test(txt) && !/Rebels attack/.test(txt) && /Rebels rose up in/.test(txt), 'a rising is told once, as rebels, never as "Independent attacks"');
  R.setMor(r, 70); }
// an empty city: taken at once; a homeland city goes independent and the rebels stay as its garrison
{ const q = G.P.find(P => P.city && S.owner[P.id] === DE && P.id !== berlin && P.id !== dresden && !S.battles.includes(P.id)).id; take(q, PL); strip(q); R.setMor(q, 20); R.annexCity(PL, q);
  R.rebelRise(q, PL); ok(S.owner[q] === DE && !S.cons[q] && !(S.anx && S.anx[q] != null), 'an empty occupied city: taken at once, back to Germany; the annexing lost');
  const h = G.P.find(P => P.city && S.owner[P.id] === PL && P.id !== warsaw).id; strip(h); R.setMor(h, 10); R.rebelRise(h, PL);
  ok(S.owner[h] === R.NEUTRAL && S.armies.some(a => a.owner === R.NEUTRAL && a.at === h && !a.rebel && R.count(a) === R.rebelSize(h)), 'a homeland city that rebels becomes independent; the rebels are its garrison');
  // no new rising while rebels are in the city
  const c2 = G.P.find(P => P.city && S.owner[P.id] === PL && P.id !== warsaw && P.id !== h).id; strip(c2); R.addArmy(PL, c2, {inf:8}); const rr = R.addArmy(R.NEUTRAL, c2, {inf:3}); rr.rebel = true; R.setMor(c2, 5);
  let more = 0; const hh = R.IM.on('rising', pp => { if (pp === c2) more++; }); for (let i = 0; i < 20; i++){ S.rs = i; R.rebelRolls(); } ok(more === 0, 'no rising while rebels are in the city'); rr.u.inf = 0; R.removeEmpty(); R.setMor(c2, 70); }

// ---- 7. Annex City: price by size, the slot, mobilizing, the time, the countryside, lost on capture
{ const p = dresden; ok(S.owner[p] === PL && R.occSt(p) === 'occ', 'Dresden occupied by Poland');
  const band = R.rebelBand(p), c = R.annexCost(p); ok(c.cash === R.ANNEX_COST[band].cash && c.mp === R.ANNEX_COST[band].mp && c.h === 24*R.ANNEX_COST[band].days, `price by size band ${band}: $${c.cash}M, ${c.mp}k, ${c.days} days`);
  ok(R.mobBlock(PL, p, 'inf') && R.mobBlock(PL, p, 'inf').kind === 'occ' && /annex/.test(R.canMobilize(PL, p, 'inf')), 'occupied: no mobilizing ("annex the city")');
  ok(R.annexWhy(PL, warsaw) === 'it is part of your homeland', 'refused in a homeland city');
  const rural = G.P.find(P => !P.sea && !P.city && S.owner[P.id] === PL).id; ok(R.annexWhy(PL, rural) === 'only a city can be annexed', 'refused in the countryside');
  const N = S.nations[PL]; N.cash = c.cash - 1; ok(/needs \$/.test(R.annexWhy(PL, p)), 'refused without the money'); N.cash = 2000; N.mp = c.mp - 1; ok(/manpower/.test(R.annexWhy(PL, p)), 'refused without the manpower'); N.mp = 500;
  S.cons[p] = {k:'fort', lvl:1, h:10, h0:10}; ok(/building/.test(R.annexWhy(PL, p)), 'refused while the slot is busy'); S.cons[p] = null;
  // the countryside around it, taken from Germany, whose nearest city it is
  const around = G.P[p].nbs.filter(v => !G.P[v].sea && !G.P[v].city && S.owner[v] === DE); for (const v of around){ strip(v); R.capture(v, PL); }
  const c0 = N.cash, m0 = N.mp; ok(R.annexCity(PL, p) && near(c0 - N.cash, c.cash) && near(m0 - N.mp, c.mp), 'paid when it starts');
  ok(!R.annexCity(PL, p) && R.annexWhy(PL, p) === 'it is being annexed', 'one at a time');
  const mor0 = R.morOf(p); for (let h = 0; h < c.h - 1; h++) R.consHour(p); ok(R.occSt(p) === 'occ' && S.cons[p], 'not done an hour early');
  R.consHour(p); ok(R.occSt(p) === 'anx' && !S.cons[p] && R.morOf(p) === mor0, `annexed after ${c.days} days; morale does not jump`);
  ok(!R.mobBlock(PL, p, 'inf') || R.mobBlock(PL, p, 'inf').kind !== 'occ', 'annexed: it may mobilize');
  ok(rowsOf(p).o.base.v === 75, 'annexed city: base 75');
  // the countryside annexed with its city: the occupied provinces taken from the same country whose nearest city it is (question 4)
  { let c2 = -1, rs = []; for (const P of G.P){ if (!P.city || S.owner[P.id] !== DE || P.id === berlin) continue; const l = P.nbs.filter(v => !G.P[v].sea && !G.P[v].city && S.owner[v] === DE && S.home[v] === DE && R.nearestCity(v) === P.id); if (l.length){ c2 = P.id; rs = l; break; } }
    const other = G.P[c2].nbs.filter(v => !G.P[v].sea && !G.P[v].city && S.owner[v] === DE && R.nearestCity(v) !== c2);
    for (const v of [c2, ...rs, ...other]){ strip(v); R.capture(v, PL); } R.annexCity(PL, c2); for (let h = 0; h < R.annexCost(c2).h; h++) R.consHour(c2);
    ok(R.occSt(c2) === 'anx' && rs.every(v => R.occSt(v) === 'anx') && other.every(v => R.occSt(v) === 'occ'), `${G.P[c2].cityName} annexed with the ${rs.length} countryside province(s) whose nearest city it is; ${other.length} others stay occupied`); }
  // capture takes the status away
  R.setRel(PL, DE, 'war'); strip(p); R.capture(p, DE); ok(R.occSt(p) === 'home' && R.morOf(p) === 55 && !(S.anx[p] != null), 'retaken by Germany: its homeland, liberated at 55; the annexed status gone');
  strip(p); R.capture(p, PL); ok(R.occSt(p) === 'occ' && R.morOf(p) === 25, 'taken again: occupied, 25'); }

// ---- 8. land by treaty, sale or gift arrives annexed (question 5); handed back homeland at 55 (question 3); Incite revolt (question 13)
{ const q = G.P.find(P => !P.sea && S.owner[P.id] === DE && P.id !== berlin && !P.city).id; S.owner[q] = PL; R.cede([q], PL); ok(R.occSt(q) === 'anx' && S.home[q] === DE, 'ceded by treaty: annexed, its home unchanged');
  const h = G.P.find(P => !P.sea && S.owner[P.id] === PL && S.home[P.id] === PL && !P.city && P.id !== q).id; S.owner[h] = DE; R.setMor(h, 80); S.owner[h] = PL; R.landGiven(h, PL); ok(R.occSt(h) === 'home' && R.morOf(h) === 55, 'its own homeland handed back: 55, always');
  // an annexing under way when a treaty makes the city annexed: called off and refunded (RULES CRITIC minor 5)
  { const c = G.P.find(P => P.city && S.owner[P.id] === DE && P.id !== berlin && !S.battles.includes(P.id) && P.id !== dresden).id; take(c, PL); R.addArmy(PL, c, {inf:6}); R.setMor(c, 50);
    const N = S.nations[PL]; N.cash = 2000; N.mp = 500; R.annexCity(PL, c); const paid = 2000 - N.cash, mp0 = N.mp; R.cede([c], PL);
    ok(paid > 0 && !S.cons[c] && N.cash === 2000 && N.mp === 500 && mp0 < 500 && R.occSt(c) === 'anx', `an annexing under way is refunded when a treaty annexes the city ($${paid}M back)`); }
  // Incite revolt: an occupied city only, -20 at once
  const p = dresden; R.setMor(p, 50); S.nations[DE].cash = 500; S.spies.push({id:9e6, owner:DE, op:null});
  ok(R.spyCheck(DE, warsaw, 'incite').ok === false && /occupied city/.test(R.spyCheck(DE, warsaw, 'incite').why), 'Incite revolt refused in a homeland city');
  ok(R.spyCheck(DE, p, 'incite').ok === true, 'Incite revolt allowed in an occupied city'); S.spies = S.spies.filter(a => a.owner !== DE);
  for (let i = 0; i < 40 && R.morOf(p) === 50; i++){ S.spies.push({id:9e6 + i + 1, owner:DE, op:{k:'incite', p, h:1}}); S.rs = i*977; R.spyHour(); }
  ok(R.morOf(p) === 30, `Incite revolt: -20 at once (50 -> ${R.morOf(p)})`); S.spies = S.spies.filter(a => a.owner !== DE); }

// ---- 9. trade (point 11, option C): the slot of a route lost to war stays empty; the 25% shock while a partner's city is held unannexed
{ const T = R.trS(); T.lost = {}; R.setRel(PL, DE, 'peace'); R.setRel(PL, FR, 'peace'); R.tradeGen(); const key = Math.min(PL, DE) + ':' + Math.max(PL, DE);
  if (!T.routes.some(r => r.key === key)){ T.want[key] = 'land'; R.tradeGen(); }
  ok(T.routes.some(r => r.key === key), 'Poland and Germany trade');
  for (const p of R.ownedBy(PL)) if (S.home[p] === DE){ delete S.anx[p]; }
  const n0 = T.routes.filter(r => r.a === PL || r.b === PL).length, inc0 = R.tradeIncome(PL).cash;
  R.setRel(PL, DE, 'war'); R.tradeGen(); ok(T.lost[key] && !T.routes.some(r => r.key === key), 'war: the route ends and is kept as lost');
  for (let d = 0; d < 3; d++) R.tradeGen(); const n1 = T.routes.filter(r => r.a === PL || r.b === PL).length;
  ok(n1 === n0 - 1, `its slot stays empty (${n0} -> ${n1} routes)`);
  ok(R.holdsOcc(PL, DE) && R.trShock(PL) && R.tradeIncome(PL).shock === 0.25, 'holding an occupied German city: the other routes pay 25% less');
  ok(!R.trShock(DE), 'the side that lost the cities has no shock');
  ok(R.lostRoutesOf(PL).length === 1 && R.lostRoutesOf(PL)[0].partner === DE, 'the lost route is listed for the trade panel');
  // annexing ends the shock; the slot waits for peace
  const held = R.ownedBy(PL).filter(p => G.P[p].city && S.home[p] === DE); for (const p of held) S.anx[p] = PL; R.INCC.v = -1;
  ok(!R.trShock(PL) && !R.tradeIncome(PL).shock, 'annexing those cities ends the shock'); R.tradeGen(); ok(T.lost[key], 'the slot still waits for peace');
  R.setRel(PL, DE, 'peace'); R.tradeGen(); ok(!T.lost[key], 'peace with the cities annexed: the lost route is over');
  for (const p of held) delete S.anx[p];
  // a war on a non-partner: nothing is kept as lost
  const other = T.routes.find(r => (r.a === PL || r.b === PL) && r.b >= 0), m = other ? (other.a === PL ? other.b : other.a) : -1;
  if (m >= 0){ R.tradeGen(); ok(true, ''); } }

// ---- 10. the computer: annexing (habit 2) and the self-brake (habit 4)
{ const N = S.nations[DE]; const pc = G.P.find(P => P.city && S.owner[P.id] === PL && P.id !== warsaw && !S.cons[P.id]).id; R.setRel(PL, DE, 'war'); strip(pc); R.capture(pc, DE); R.addArmy(DE, pc, {inf:4});
  N.cash = 100; N.mp = 100; R.aiAnnex(DE, N); ok(!S.cons[pc], 'the computer keeps $150M over the price: no annexing with $100M');
  N.cash = 1000; R.aiAnnex(DE, N); ok(S.cons[pc] && S.cons[pc].k === 'annex', 'with the money it annexes its occupied city');
  { const cs = G.P.filter(P => P.city && S.owner[P.id] === PL && P.id !== warsaw && P.id !== pc && !S.cons[P.id] && !S.battles.includes(P.id)).sort((x, y) => R.popOf(y.id) - R.popOf(x.id));
    const big = cs.find(P => R.rebelBand(P.id) >= 1), small = cs.slice().reverse().find(P => R.rebelBand(P.id) < R.rebelBand(big.id));
    if (big && small){ for (const q of [big.id, small.id]){ strip(q); R.capture(q, DE); R.addArmy(DE, q, {inf:4}); }
      N.cash = R.annexCost(small.id).cash + 150; N.mp = 1000; R.aiAnnex(DE, N);
      ok(!S.cons[big.id] && S.cons[small.id] && S.cons[small.id].k === 'annex', `a city it cannot afford (${big.cityName}) does not stop it annexing a cheaper one (${small.cityName})`); R.setMor(big.id, 70); R.setMor(small.id, 70); }
    else ok(false, 'no big and small Polish city found for the aiAnnex check'); }
  const mine = G.P.filter(P => P.city && S.owner[P.id] === DE).slice(0, 2).map(P => P.id); ok(!R.aiBrake(DE), 'no burning city: no brake');
  for (const p of mine) R.setMor(p, 33); ok(R.aiBrake(DE), 'two cities at 33%: no new offensive'); for (const p of mine) R.setMor(p, 70); }

// ---- 11. an old save with the old unrest rule (made by master c779703: Germany holds French cities)
{ const R2 = load(), a2 = R2.IM.api, txt = fs.readFileSync(path.join(__dirname, 'fixtures', 'unrest-oldsave.json'), 'utf8'), d = JSON.parse(txt);
  const U = d.unrest, D0 = d.dmg || [], occ = d.occ, hour = d.hour, ger = d.nations.findIndex(N => N.name === 'Germany');
  const reb = d.armies.filter(a => a.rebel).map(a => ({id:a.id, at:a.at, city:null}));
  ok(Array.isArray(U) && !('mv' in d) && reb.length >= 2, 'the fixture has unrest and partisans and no morale rule');
  ok(a2.restore(JSON.parse(txt)), 'it loads'); const S2 = R2.S, G2 = R2.G;
  let same = 0, n = 0; for (let p = 0; p < G2.P.length; p++){ if (G2.P[p].sea) continue; n++; if (Math.abs(S2.mor[p] - Math.max(0, Math.min(100, 100 - (U[p] || 0) - (D0[p] || 0)))) < 0.051) same++; }
  ok(same === n, `morale on load = 100 - unrest - war damage everywhere (${same}/${n})`);
  ok(!('unrest' in S2) && !('integ' in S2) && S2.mv === 1, 'unrest and integration dropped');
  let anx = 0, occ1 = 0; for (let p = 0; p < G2.P.length; p++){ const o = S2.owner[p]; if (G2.P[p].sea || !(o >= 0) || S2.home[p] === o) continue; const old = occ[p] == null || hour - occ[p] >= 240;
    if (old ? R2.occSt(p) === 'anx' : R2.occSt(p) === 'occ') (old ? anx++ : occ1++); else errors.push('status of ' + p); }
  ok(anx > 0 && occ1 > 0, `held 10 days or more: annexed (${anx}); less: occupied (${occ1})`);
  const rb = S2.armies.filter(a => a.rebel); ok(rb.every(a => G2.P[a.at].city), 'partisans in the countryside stood down');
  ok(rb.some(a => a.rbH === hour + 24), 'partisans in an empty city wait 24 hours once');
  ok(S2.log.some(e => /New rule: morale/.test(e.text)), 'the seat is told');
  ok(S2.rbG === hour + 24, 'no city rises in the first 24 hours after the conversion (S.rbG)');
  { let early = 0; const hr = R2.IM.on('rising', () => { if (S2.hour < hour + 24) early++; }); const low = G2.P.filter(P => P.city && S2.owner[P.id] >= 0 && R2.morShown(P.id) <= 33).length;
    for (let h = 0; h < 24; h++) a2.tick(); ok(early === 0, `no rising in the first 24 hours (${low} cities at 33% or less on load)`); }
  for (let h = 0; h < 24*2; h++) a2.tick(); ok(S2.hour === hour + 72, 'it plays 3 days');
  ok(!S2.armies.some(a => a.rebel && a.rbH != null && S2.owner[a.at] === ger && R2.garrisonOf(a.at, ger) === 0), 'after the 24 hours an empty city held by rebels went over to them');
  // it saves and loads again unchanged
  const s1 = a2.saveJSON(); a2.restore(JSON.parse(s1)); const s2 = a2.saveJSON(), o1 = JSON.parse(s1), o2 = JSON.parse(s2), dk = Object.keys(o1).filter(k => k !== 'bt' && JSON.stringify(o1[k]) !== JSON.stringify(o2[k]));   // (S.bt, the battle charts, start afresh on a load)
  ok(dk.length === 0, 'a converted save saves and loads unchanged: ' + dk.join()); }

// ---- 12. point 11 over 30 days (plan 5.3): Poland occupies 4 German cities; Germany a trade partner against a non-partner
if (!QUICK){ const { execFileSync } = require('child_process');
  const out = execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'rebels-check.js'), 'trade', '30', '12345'], {encoding:'utf8', env:Object.assign({}, process.env, {IM_ROOT:ROOT}), maxBuffer:1 << 26}).trim().split('\n').map(l => JSON.parse(l));
  const [a, b, d] = out; ok(a.partner && !b.partner && a.rows.length && b.rows.length, 'both runs done');
  const tA = a.rows[a.rows.length - 1], tB = b.rows[b.rows.length - 1];
  ok(tA.routes === tB.routes - 1 && tA.shock === 1 && tB.shock === 0, `day 30: the partner case has one route fewer and the shock (${tA.routes}/${tB.routes} routes)`);
  ok(d.partnerMinusNon.trade < -300 && d.partnerMinusNon.gross < -300, `over 30 days occupying a partner costs clearly more: trade ${d.partnerMinusNon.trade}, gross ${d.partnerMinusNon.gross} ($M of value)`);
  console.log('point 11, seed 12345:', JSON.stringify({partner:{trade:a.tradeSum, gross:a.grossSum, day30:tA}, nonPartner:{trade:b.tradeSum, gross:b.grossSum, day30:tB}, diff:d.partnerMinusNon})); }

console.log(`${checks} checks, ${errors.length} failed`);
if (errors.length){ for (const e of errors) console.log('FAIL', e); process.exit(1); }
console.log('REBELS2 OK');
