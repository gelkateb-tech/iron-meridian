// The Bunker (owner #17, 2026-11-18: Fortifications become the Bunker, five levels, hidden from other nations), in plain Node:   node .test/bunker.js
// (exit 0 when every check holds). What it checks:
// 1. the levels: the owner's health, protection, morale and upkeep (converted: a hundredth), prices and times, the name, the pictures 1:1
// 2. the garrison: damage taken in a battle step, under ranged fire, an air strike and a missile, alone and dug in (open and city), the morale it
//    fights with and breaks at; the people (war losses); the other buildings (the level 1 shield, whatever the level); the bunker's own health,
//    its levels lost to hits and repairs; capture; upkeep; Combat Engineers' half price
// 3. hidden: another nation (a person's, and the computer's view of the rules) never sees it or one going up, unless it holds the province or the
//    province is revealed; the odds a person's nation is shown leave it out, the computer's do not; an ally's Strength table leaves it out; a raid's
//    report never names it; a sale's value leaves it out
// 4. the computer: the level it wants (capital threatened 3, 4 or 5, at war 1 or 2; a threatened city with a silo 1); a computer capital with an
//    enemy army next to it builds its bunker up level by level; at peace it keeps the starting level 1
// 5. an old save (.test/fixtures/bunker-oldsave.json, made by master cbe8d87: Fortifications I, II, III, and level II under construction) loads,
//    I -> 1, II -> 3, III -> 5, the construction carries on as level 3 with its hours, every province keeps (or gains) protection, the seat is
//    told once, it plays two days, and saving and loading again changes nothing
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const NAMES = ['IM', 'BUILD', 'BUNKER_LV', 'BUNKER_HIT', 'BUNKER_FIX', 'BUNKER_SHIELD_LV', 'BUNKER_OLD', 'DIG_DEF', 'DIG_CITY', 'DIG_H', 'RES_K', 'UNITS', 'buildCost', 'build', 'consHour', 'bunkerLv', 'bunkerRed', 'bunkerF',
  'bunkerHp', 'bunkerHit', 'bunkerHour', 'bunkerTable', 'bldHit', 'bldSeen', 'consSeen', 'bunkerSeen', 'moraleEff', 'moraleF', 'warDamage', 'popOf', 'income', 'bombBuildings', 'preciseHit', 'capture', 'oddsParts',
  'armyStrength', 'provValue', 'aiBunkerWant', 'addArmy', 'hurt', 'effHP', 'digF', 'setRel', 'ownedBy', 'desk', 'rGrant', 'knockOut', 'bdis', 'resolveStrike', 'missileImpact', 'rangedStep', 'tell'];
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + `\nreturn {${NAMES.join(', ')}, get S(){ return S; }, get G(){ return G; }, setS(v){ S = v; }};`;
const load = () => new Function(SRC)();
let bad = 0, n = 0; const ok = (c, msg, info) => { n++; if (!c){ bad++; console.log('FAIL  ' + msg + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 400) : '')); } };
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;
const SEAT = 0, AI = 1;
function game(seed = 12345, seats = [SEAT]){ const R = load(), api = R.IM.api; api.useScenario('world'); api.newGame(seed, 0, seats); R.S.started = true; return {R, api, S:R.S, G:R.G}; }
const cityOf = (R, n, k = 0) => R.ownedBy(n).filter(p => R.G.P[p].city && p !== R.S.nations[n].capital)[k];
const openOf = (R, n) => R.ownedBy(n).find(p => !R.G.P[p].city && !R.G.P[p].sea && !R.G.P[p].nbs.some(v => R.G.P[v].city));
const HIT = {soft:0.002, armored:0.002, air:0.002, naval:0.002};

// ---- 1. the levels
{ const {R} = game(), B = R.BUILD.fort, L = R.BUNKER_LV;
  ok(B.name === 'Bunker' && B.max === 5 && B.where === 'any', 'Fortifications are the Bunker, five levels, anywhere', [B.name, B.max]);
  const want = [[20, 0.33, 0.05, 1.0], [40, 0.43, 0.10, 1.1], [65, 0.56, 0.20, 1.2], [95, 0.69, 0.33, 1.3], [125, 0.82, 0.50, 1.4]];
  ok(want.every((w, i) => L[i + 1].hp === w[0] && L[i + 1].red === w[1] && L[i + 1].mrl === w[2] && L[i + 1].upk === w[3]), "the owner's health, protection, morale and upkeep (100-140 at a hundredth) for levels 1-5", L.slice(1));
  const c = [1, 2, 3, 4, 5].map(l => R.buildCost(SEAT, 'fort', l, -1));
  ok(c[0].cash === 36 && c[0].metal === 8*R.RES_K && c[0].iron === 8*R.RES_K && c[0].h === 48, 'level 1 costs what Fortifications I cost ($36M, 8k, 8k, 2 days)', c[0]);
  ok(c[1].cash === 58 && c[2].cash === 92 && c[1].metal === 13*R.RES_K && c[2].metal === 20*R.RES_K, 'levels 2 and 3 cost what Fortifications II and III cost', [c[1], c[2]]);
  ok(c[3].cash === 130 && c[4].cash === 180 && c[3].elec === 5*R.RES_K && c[4].elec === 8*R.RES_K && c[3].h === 60 && c[4].h === 72, 'levels 4 and 5: $130M and $180M, with electronics, 2.5 and 3 days', [c[3], c[4]]);
  const T = R.bunkerTable(); ok(T.length === 5 && T.every((r, i) => near(r.lessOpen, 1 - (1 - L[i + 1].red)*R.DIG_DEF) && near(r.lessCity, 1 - (1 - L[i + 1].red)*R.DIG_CITY)), 'the table multiplies the bunker with dug-in (open 1/1.1, city 1/1.25)', T.map(r => [r.less, r.lessOpen, r.lessCity]));
  ok(near(R.DIG_DEF, 1/1.1) && near(R.DIG_CITY, 1/1.25), 'dug-in is +10% in the open and +25% in a city');
  ok(/bn-\$\{cut && k === 'fort' \? 'fortcut' : k\}-\$\{Math.max\(1, Math.min\(5, lv\)\)\}/.test(html) && /fort:5\}/.test(html), 'the pictures map 1:1 (bn-fort-N on the map, bn-fortcut-N in the panels)');
  ok(!/Fortifications/.test(R.BUILD.fort.desc) && /bunkers cost half/.test(fs.readFileSync(path.join(ROOT, 'rules/data.js'), 'utf8')), 'the research card says bunkers'); }

// ---- 2. the garrison, the people, the buildings, the bunker itself
{ const {R, S, G} = game(), cap = S.nations[SEAT].capital, op = openOf(R, SEAT);
  const taken = (p, lv, dug, o = SEAT) => { S.bld[p].fort = lv; const a = R.addArmy(o, p, {inf:30}); a.still = dug ? S.hour - R.DIG_H - 1 : S.hour; const h0 = R.effHP(a); R.hurt(a, HIT, R.bunkerF(a, p)*R.digF(a)); const d = h0 - R.effHP(a); S.armies.splice(S.armies.indexOf(a), 1); return d; };
  const base = taken(cap, 0, false), baseO = taken(op, 0, false);
  for (let l = 1; l <= 5; l++){ const r = R.BUNKER_LV[l].red;
    ok(near(taken(cap, l, false)/base, 1 - r, 1e-6), `level ${l}: the garrison takes ${Math.round(r*100)}% less damage`);
    ok(near(taken(op, l, true)/baseO, (1 - r)*R.DIG_DEF, 1e-6) && near(taken(cap, l, true)/base, (1 - r)*R.DIG_CITY, 1e-6), `level ${l}: with dug-in in the open and in a city`); }
  S.bld[cap].fort = 3; const foe = R.addArmy(AI, cap, {inf:30}); ok(R.bunkerF(foe, cap) === 1, 'a foreign force in the province gets nothing from the bunker');
  S.armies.splice(S.armies.indexOf(foe), 1);
  // the battle step (rules/tick.js) uses it: a seat garrison attacked in its capital, with and without the bunker
  const fight = lv => { const R2 = game().R, S2 = R2.S, c2 = S2.nations[SEAT].capital; S2.bld[c2].fort = lv; for (const a of S2.armies.filter(b => b.at === c2)) S2.armies.splice(S2.armies.indexOf(a), 1);
    R2.setRel(SEAT, AI, 'war'); const d = R2.addArmy(SEAT, c2, {inf:20}); d.still = S2.hour; const at = R2.addArmy(AI, c2, {inf:20, tank:5}); S2.battles = [c2]; const h0 = R2.effHP(d), a0 = R2.effHP(at);
    R2.IM.api.tickQ(); return [(h0 - R2.effHP(d))/(a0 - R2.effHP(at) || 1), h0 - R2.effHP(d)]; };
  const f0 = fight(0), f5 = fight(5); ok(f5[1] > 0 && f5[1] < f0[1]*0.4, 'in a battle a level 5 garrison loses far less (about 18% of what it loses without)', [f0, f5]);
  // morale
  S.bld[cap].fort = 5; const g = R.addArmy(SEAT, cap, {inf:5}); g.m = 60; ok(R.moraleEff(g) === 90 && near(R.moraleF(g), (0.5 + 0.45)*1, 1e-9), 'level 5: a garrison at 60% morale fights as 90%', [R.moraleEff(g), R.moraleF(g)]);
  g.m = 80; ok(R.moraleEff(g) === 100, 'never above 100%'); S.bld[cap].fort = 1; g.m = 60; ok(near(R.moraleEff(g), 63), 'level 1: +5%');
  S.bld[cap].fort = 0; ok(R.moraleEff(g) === 60, 'no bunker: its own morale'); S.armies.splice(S.armies.indexOf(g), 1);
  // the people
  const loss = lv => { S.bld[cap].fort = lv; S.pop = S.pop || G.P.map(P => P.pop0); S.pop[cap] = 10; R.warDamage(cap, 20); return 10 - S.pop[cap]; };
  const l0 = loss(0); for (const l of [1, 3, 5]) ok(near(loss(l), l0*(1 - R.BUNKER_LV[l].red), 1e-9), `level ${l}: the people lose ${Math.round(R.BUNKER_LV[l].red*100)}% less to war damage`);
  // the bunker's health and levels
  S.bld[cap].fort = 5; delete S.bhp; ok(R.bunkerHp(cap) === 125, 'a level 5 bunker has 125 health');
  const lv = []; for (let i = 0; i < 7; i++){ R.bunkerHit(cap, R.BUNKER_HIT); lv.push(S.bld[cap].fort); }
  ok(JSON.stringify(lv) === JSON.stringify([5, 4, 3, 3, 2, 1, 0]), 'hits of 20: level 5 falls to 4 at 95 health, 3 at 65, 2 at 40, 1 at 20 and is gone after seven hits', lv);
  S.bld[cap].fort = 1; delete S.bhp; R.bunkerHit(cap, R.BUNKER_HIT); ok(S.bld[cap].fort === 0, 'level 1 falls to one hit, as any building level');
  S.bld[cap].fort = 3; delete S.bhp; R.bunkerHit(cap, 20); ok(S.bld[cap].fort === 3 && R.bunkerHp(cap) === 45, 'a hit on level 3 leaves it standing with 45 health');
  for (let h = 0; h < 7; h++) R.bunkerHour(); ok(R.bunkerHp(cap) === 62.5, `it repairs ${R.BUNKER_FIX} an hour`, R.bunkerHp(cap)); for (let h = 0; h < 3; h++) R.bunkerHour(); ok(R.bunkerHp(cap) === 65 && !(S.bhp && cap in S.bhp), 'up to its full health');
  // the shield: other buildings lose a third fewer levels (bombs), whatever the bunker's level; none without it
  const raid = (lv, N = 3000) => { let lost = 0, bk = 0; for (let i = 0; i < N; i++){ Object.assign(S.bld[cap], {fac:5, air:5, rec:5, arms:5, silo:0, yard:0, fort:lv}); delete S.bhp; S.cons[cap] = null; const before = ['fac', 'air', 'rec', 'arms'].reduce((s0, k) => s0 + S.bld[cap][k], 0);
    R.bombBuildings(cap, 2); lost += before - ['fac', 'air', 'rec', 'arms'].reduce((s0, k) => s0 + S.bld[cap][k], 0); } return lost/N; };
  const r0 = raid(0), r1 = raid(1), r5 = raid(5); ok(r1/r0 > 0.6 && r1/r0 < 0.74, 'bombers wreck about a third fewer levels of the other buildings with a bunker of level 1', [r0, r1]);
  ok(r5 < r1, 'at level 5 too (the shield is level 1\'s; the bunker also draws hits onto itself)', [r1, r5]);
  // a precision strike's knock-out is cut short by the shield
  Object.assign(S.bld[cap], {fac:0, air:0, rec:0, arms:0, silo:3, yard:0, fort:2}); delete S.bdis; S.rs = 1; const t = R.preciseHit(cap, 0, 12); ok(/Missile Silo knocked out for 8 h/.test(t), 'a 12 h knock-out of another building lasts 8 h', t);
  // capture: the captor gets the bunker a level lower, at full health
  S.bld[cap].fort = 4; S.bhp = {[cap]:50}; R.setRel(SEAT, AI, 'war'); const capOwner = S.owner[cap]; R.capture(cap, AI); ok(S.bld[cap].fort === 3 && R.bunkerHp(cap) === 65 && R.bunkerSeen(cap, AI) && !R.bunkerSeen(cap, SEAT), 'captured: a level lower, full health, the captor sees it and the old owner no longer does', [S.bld[cap].fort, R.bunkerHp(cap), capOwner]); }

// upkeep and Combat Engineers
{ const {R, S} = game();
  // (income is cached for the tick: compare two fresh copies of the rules)
  const R2 = game().R, S2 = R2.S, cap2 = S2.nations[SEAT].capital, c2 = cityOf(R2, SEAT); S2.bld[cap2].fort = 0; const b0 = R2.income(SEAT).upkeep.cash;
  const R3 = game().R, S3 = R3.S, cap3 = S3.nations[SEAT].capital, c3 = cityOf(R3, SEAT); S3.bld[cap3].fort = 5; S3.bld[c3].fort = 1; const b1 = R3.income(SEAT).upkeep.cash;
  ok(near(b1 - b0, 1.4 + 1.0, 1e-9), 'upkeep: a level 5 and a level 1 bunker cost $2.4M a day', [b0, b1]);
  R.rGrant(S.nations[SEAT], 'log2', 1); const h = R.buildCost(SEAT, 'fort', 5, -1); ok(h.cash === 90 && h.metal === 19*R.RES_K && h.elec === 4*R.RES_K, 'Combat Engineers: a bunker at half price', h); }

// ---- 3. hidden from other nations
{ const {R, S, G} = game(12345, [SEAT, AI]), P2 = 2, cap1 = S.nations[AI].capital;
  S.bld[cap1].fort = 4; S.cons[cap1] = null;
  ok(R.bunkerSeen(cap1, AI) && !R.bunkerSeen(cap1, SEAT) && !R.bunkerSeen(cap1, P2), 'only the holder sees its bunker');
  ok(R.bldSeen(cap1, SEAT).fort === 0 && R.bldSeen(cap1, AI).fort === 4 && R.bldSeen(cap1, SEAT).rec === S.bld[cap1].rec && S.bld[cap1].fort === 4, 'another nation sees the other buildings, not the bunker (the rules keep it)');
  R.setRel(SEAT, AI, 'ally'); ok(!R.bunkerSeen(cap1, SEAT), 'not even an ally'); R.setRel(SEAT, AI, 'peace');
  const c1 = cityOf(R, AI); S.cons[c1] = {k:'fort', lvl:1, h:20, h0:48}; ok(R.consSeen(c1, SEAT) === null && R.consSeen(c1, AI) === S.cons[c1], 'one going up is hidden too'); S.cons[c1] = null;
  S.reveal = {[cap1]:S.hour + 10}; ok(R.bunkerSeen(cap1, SEAT) && R.bldSeen(cap1, SEAT).fort === 4, 'a revealed province (spy reconnaissance, a UAV) shows it'); S.reveal = {};
  // the odds: a seat attacking does not count the unseen bunker; the computer does
  R.setRel(SEAT, AI, 'war'); const def = S.armies.filter(a => a.at === cap1 && a.owner === AI); for (const a of def) a.m = 60;
  const nb = G.P[cap1].nbs.find(v => !G.P[v].sea), me = R.addArmy(SEAT, nb, {inf:10, tank:4}), ai2 = R.addArmy(P2, nb, {inf:10, tank:4}); R.setRel(P2, AI, 'war');
  const o4 = R.oddsParts(me, cap1, def), a4 = R.oddsParts(ai2, cap1, def); S.bld[cap1].fort = 0; const o0 = R.oddsParts(me, cap1, def), a0 = R.oddsParts(ai2, cap1, def); S.bld[cap1].fort = 4;
  ok(near(o4.theirs, o0.theirs, 1e-6) && !o4.bunker, 'a person\'s odds against an unseen bunker are the odds without it (protection and morale)', [o4.theirs, o0.theirs]);
  ok(a4.theirs > a0.theirs*2.5 && a4.bunker === 4, 'the computer\'s odds count it (it reads every building)', [a4.theirs, a0.theirs]);
  S.reveal = {[cap1]:S.hour + 10}; const oR = R.oddsParts(me, cap1, def); ok(oR.bunker === 4 && near(oR.theirs, a4.theirs, 1e-6), 'revealed, a person\'s odds count it'); S.reveal = {};
  // an ally's Strength table
  R.setRel(SEAT, AI, 'ally'); const g = def[0], X0 = R.armyStrength(g, false, SEAT), X1 = R.armyStrength(g, false, AI);
  ok(!X0.ctx.bunker && X1.ctx.bunker === 4 && !X0.rows.some(r => r.def.why.some(w => w[0] === 'bunker')) && X1.rows.some(r => r.def.why.some(w => w[0] === 'bunker')), 'an ally\'s Strength table leaves out its bunker; its own shows it', [X0.ctx, X1.ctx]);
  R.setRel(SEAT, AI, 'war');
  // a raid's report never names it
  let named = false; for (let i = 0; i < 400; i++){ Object.assign(S.bld[cap1], {fort:5, fac:1, air:0, rec:0, arms:0, silo:0, yard:0}); delete S.bhp; const t = R.bombBuildings(cap1, 3); if (/Bunker|Fortif/.test(t)) named = true; }
  ok(!named, 'a bombing report never names the bunker');
  Object.assign(S.bld[cap1], {fort:3, fac:0, air:0, rec:0, arms:0, silo:0, yard:0}); let pn = false; for (let i = 0; i < 50; i++){ delete S.bdis; const t = R.preciseHit(cap1, 0.5, 12); if (/Bunker/.test(t)) pn = true; S.bld[cap1].fort = 3; }
  ok(!pn, 'nor does a precision strike on it');
  // a sale's value
  const v1 = R.provValue(cap1); S.bld[cap1].fort = 0; const v0 = R.provValue(cap1); ok(v1 === v0, 'a sale\'s value leaves the bunker out', [v0, v1]);
  // the page: the map and the panels read the seen buildings
  ok(/function bnItems\(p\)\{ const B = bldSeen\(p, PLAYER\), o = S.owner\[p\], c = o >= 0 \? consSeen\(p, PLAYER\)/.test(html) && /const bnHas = \(p, caps\) => \{ if \(caps.has\(p\)\) return true; const B = bldSeen\(p, PLAYER\), c = consSeen\(p, PLAYER\)/.test(html), 'the map draws the buildings as the player sees them');
  ok((html.match(/bldSeen\(/g) || []).length >= 7, 'the panels list them so too'); }

// ---- 4. the computer
{ const {R, S, G} = game(12345, []), N = S.nations[AI], cap = N.capital;
  ok(R.aiBunkerWant(AI, cap, N, 100) === 0, 'at peace and unthreatened: none wanted');
  R.setRel(AI, 2, 'war'); N.cash = 200; ok(R.aiBunkerWant(AI, cap, N, 100) === 1, 'at war: level 1 in the capital'); N.cash = 400; ok(R.aiBunkerWant(AI, cap, N, 100) === 2, 'at war with money to spare: level 2');
  const nb = G.P[cap].nbs.find(v => !G.P[v].sea); R.addArmy(2, nb, {inf:3});
  ok(R.aiBunkerWant(AI, cap, N, 100) === 3 && R.aiBunkerWant(AI, cap, N, 200) === 5, 'enemies next to the capital: level 3 (5 for an empire of over 150 provinces)');
  N.cash = 800; ok(R.aiBunkerWant(AI, cap, N, 100) === 4, 'level 4 with money to spare'); N.cash = 300;
  const c = R.ownedBy(AI).find(p => G.P[p].city && p !== cap); S.bld[c].silo = 1; const nc = G.P[c].nbs.find(v => !G.P[v].sea); R.addArmy(2, nc, {inf:3}); ok(R.aiBunkerWant(AI, c, N, 100) === 1, 'a threatened city with a Missile Silo: level 1');
  S.bld[c].silo = 0; S.bld[c].air = 0; S.bld[c].yard = 0; S.bld[c].fac = 0; ok(R.aiBunkerWant(AI, c, N, 100) === 0, 'a threatened city with nothing to shield: none'); }
// (computer nations start no wars among themselves: a person's nation at war with one, its army next to the computer's capital)
{ const {R, api, S, G} = game(7, [SEAT]), N = S.nations[AI], cap = N.capital; R.setRel(SEAT, AI, 'war'); N.cash = 900;
  const nb = G.P[cap].nbs.find(v => !G.P[v].sea && S.owner[v] === AI) ?? G.P[cap].nbs.find(v => !G.P[v].sea); const L = [];
  for (let d = 0; d < 8; d++){ for (let h = 0; h < 24; h++){ const a = S.armies.find(b => b.owner === SEAT && b.at === nb && b.tag === 'bk'); if (!a){ const f = R.addArmy(SEAT, nb, {inf:40, tank:10}); f.tag = 'bk'; f.stance = 'hold'; } N.cash = Math.max(N.cash, 900); api.tick(); } L.push(S.bld[cap].fort); }
  ok(L[L.length - 1] >= 3 && L.some((l, i) => i && l > L[i - 1]), 'a computer capital with enemies next to it builds its bunker up level by level (to 3 or more)', L); console.log('  computer capital bunker, day by day, enemies next to it: ' + L.join(' ')); }
{ const lv = [0, 0, 0, 0, 0, 0], {R, api, S} = game(7, []); for (let h = 0; h < 10*24; h++) api.tick(); S.bld.forEach(b => { if (b.fort) lv[b.fort]++; });
  ok(lv[1] === S.nations.length && !lv.slice(2).some(Boolean), 'at peace the computer keeps its starting level 1 bunkers (no upkeep spent on more)', lv); }

// ---- 5. an old save made by master cbe8d87
{ const js = fs.readFileSync(path.join(__dirname, 'fixtures/bunker-oldsave.json'), 'utf8'), old = JSON.parse(js), R = load(), api = R.IM.api;
  const forts = []; old.bld.forEach((b, p) => { if (b && b.fort) forts.push([p, b.fort]); }); const cons = old.cons.map((c, p) => c && c.k === 'fort' ? [p, c] : null).filter(Boolean);
  ok(!old.bk && forts.some(f => f[1] === 1) && forts.some(f => f[1] === 2) && forts.some(f => f[1] === 3) && cons.length === 1 && cons[0][1].lvl === 2, 'the fixture holds Fortifications I, II, III and a level II going up (master cbe8d87)', [forts.length, cons]);
  ok(api.restore(JSON.parse(js)), 'the old save loads', api.restore.why); const S = R.S;
  ok(forts.every(([p, l]) => S.bld[p].fort === [0, 1, 3, 5][l]), 'Fortifications I, II, III are Bunker levels 1, 3, 5', forts.map(([p, l]) => [l, S.bld[p].fort]));
  ok(S.bld.filter(b => b.fort).length === forts.length, 'no bunker gained or lost');
  ok(forts.every(([p, l]) => R.bunkerRed(S.bld[p].fort) > 1 - Math.pow(0.8, l)), 'every province is at least as well protected as before (old 20/36/49% less damage)');
  const [cp, c0] = cons[0]; ok(S.cons[cp] && S.cons[cp].k === 'fort' && S.cons[cp].lvl === 3 && S.cons[cp].h === c0.h && S.cons[cp].h0 === c0.h0, 'the Fortifications II going up carries on as Bunker level 3, its hours kept', S.cons[cp]);
  const msg = (R.desk(SEAT).log || []).filter(e => /Fortifications are now the Bunker/.test(e.text)); ok(msg.length === 1 && /levels 1, 3 and 5/.test(msg[0].text), 'the seat is told once', msg.map(e => e.text));
  let err = null; try { for (let h = 0; h < 48; h++) for (let k = 0; k < api.BATTLE_Q; k++) api.tickQ(); } catch (e){ err = e; }
  ok(!err, 'it plays on two days', err && String(err.stack).slice(0, 300));
  ok(S.bld[cp].fort === 3 && !S.cons[cp], 'the construction finished as level 3', [S.bld[cp].fort, S.cons[cp]]);
  const again = api.saveJSON(), R2 = load(); ok(R2.IM.api.restore(JSON.parse(again)), 'saved and loaded again');
  ok(JSON.stringify(R2.S.bld.map(b => b.fort)) === JSON.stringify(S.bld.map(b => b.fort)) && (R2.desk(SEAT).log || []).filter(e => /Fortifications are now the Bunker/.test(e.text)).length === 1, 'a second load maps nothing again and says nothing more'); }

console.log(`${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
