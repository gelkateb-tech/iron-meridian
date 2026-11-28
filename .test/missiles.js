// Missiles (owner point 12; docs/MISSILES.md, the approved plan with the answers M1-M15 of 2026-11-26), plain Node, no browser:
//   node .test/missiles.js           every check below (about a minute)
// 1 the numbers (missiles, research, limits); 2 the silo needs Conventional Warhead, cruise missiles from Army Base, Airbase and Naval Yard
// cities (2 a city), an old save's silo built with Cruise Missiles only; 3 chemical and nuclear missiles: Silo I / II, prices, build times, stock
// limits counting queued ones; 4 launch rules: cooldowns 12 / 24 h, never your own land, chemical never at sea, independent land, shortest flights
// 4 / 6 h, ranges, interception 5% / 4% a SAM; 5 the chemical strike: blast, own forces hit, the gas zone (set, renewed, expired), 2.5% an hour,
// armour half, Bunker, CBRN Defence, the battle x0.8, no healing, people and civilian casualties; 6 the nuclear strike: 50% / 40%, 12% / 8% next
// door, a Bunker counts half, buildings knocked out 48 h and two hits, links 96 h, output half, people 12% and 2%, radiation 48 h; the table of
// docs/MISSILES.md 7.3 (mean dice); 7 intercepted: nothing; at peace in flight: self-destructs; a captured city: chemical and nuclear stock
// destroyed, cruise and ballistic stock passes (Q19); 8 diplomacy: memory, the two opinion lines, allies joining, a computer ally leaving, fallout
// on a third nation, every seat told, peace refused for 3 days, opinions back after 60 days; 9 the computer: research weights, silo rule, its
// building and firing rules (scripted); 10 an old save of master 0fb9d76 (silo with Cruise Missiles only, stocks {cm, bm}) loads and plays 5 days;
// 11 polish round 1; 12 polish round 2: MS1 (a chemical strike answered with a chemical one, nuclear only for a nuclear strike or desperation), MS2
// (Conventional Warhead at war, missiles from $220M at war), the silo saved for only with a positive daily income (merge fix 2), mslUp (the
// strip's "Damaged"); 13 MISSILES PLAN 2 (docs/MISSILES-PLAN2.md, owner 2026-11-28): section 1 holds its table (names, ranges in map km, speeds,
// costs, build times, silos, limits, waits, HP, defenders, shield); here the limits and waits by kind and the flight times, the Nuclear Cruise
// Missile (F.4), who counts against a missile and best shots first, the C.2 table and the C.3 worked examples (exact sums and the rules' own dice
// over thousands of seeded trials, the card against the dice over 20,000), the salvo order, the last-hour defence and its messages, the
// computer's new rules (SAMs, the shield, the 35% rule and salvos, the silo nearest its main enemy, the Nuclear Cruise Missile in a Silo I);
// 14 a v74 save (master ee7e438, .test/missiles-v74-make.js: missiles in flight without HP, stocks, waits, silos) loads and plays on.
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn {IM, ev:s => eval(s), get S(){ return S; }, get G(){ return G; }};';
const errors = []; let checks = 0; const ok = (c, msg) => { checks++; if (!c) errors.push(msg); };
const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;
const R = new Function(SRC)(), api = R.IM.api, X = s => R.ev(s);
const K = X('RES_K'), MISSILES = X('MISSILES'), W = X('MSL_WMD'), RN = X('RN');
let toasts = []; R.IM.on('toast', (n, why) => toasts.push(why));
api.useScenario('world64');
let S, G; const ALL = Array.from({length:68}, (_, i) => i);
X('globalThis.__rng0 = rng; globalThis.__md0 = mslDefend');
const fresh = (seats = ALL, seed = 12345) => { X('rng = globalThis.__rng0; mslDefend = globalThis.__md0'); api.newGame(seed, 0, seats); S = R.S; G = R.G; S.started = true; return S; };
fresh();
const id = nm => S.nations.findIndex(N => N.name === nm), PL = id('Poland'), DE = id('Germany'), FR = id('France'), RU = id('Russia'), CZ = id('Czechia') >= 0 ? id('Czechia') : id('Czech Republic'), UA = id('Ukraine'), IT = id('Italy'), ES = id('Spain');
const city = (n, nm) => G.P.find(P => P.city && P.cityName === nm && (n == null || S.owner[P.id] === n));
const f = nm => X(nm);
const grant = (n, ...ids) => { for (const i of ids) f('rGrant')(S.nations[n], i, 1); };
const rich = n => { const N = S.nations[n]; N.cash = 1e5; for (const k of ['oil', 'metal', 'iron', 'elec', 'rare']) N[k] = 1e5*K; N.mp = 1e4; };
const strip = p => { for (const a of S.armies) if (a.at === p) for (const t in a.u){ a.u[t] = 0; a.w[t] = 0; } f('removeEmpty')(); };
const hp = a => f('effHP')(a), cnt = a => f('count')(a);
const log = n => (f('desk')(n).log || []).map(e => e.text);
const hours = h => { for (let i = 0; i < h; i++) api.tick(); };
// a German countryside province, its land neighbours, and a Polish city with a silo of level l in range of it
const deLand = () => G.P.find(P => !P.sea && !P.city && S.owner[P.id] === DE && P.nbs.every(v => !G.P[v].sea) && P.nbs.some(v => S.owner[v] === DE)).id;
function siloAt(n, nm, l = 1){ const P = city(n, nm); S.bld[P.id].silo = l; return P.id; }

// ---- 1. the numbers (MISSILES PLAN 2, docs/MISSILES-PLAN2.md B: the table; A: the names)
{ const M = MISSILES, RES = ['oil', 'metal', 'iron', 'elec', 'rare'], eq = (k, o) => { const bad = Object.entries(o).filter(([j, v]) => M[k][j] !== (RES.includes(j) ? v*K : v)); if (bad.length) console.log('MISMATCH', k, JSON.stringify(bad)); return !bad.length; };
  ok(JSON.stringify(Object.keys(M)) === '["cm","bm","ccm","chem","ncm","nuc"]', 'A / F.3: six missiles now (the Nuclear ICBM is later, no plain or chemical ICBM): ' + Object.keys(M));
  ok(eq('cm', {name:'Cruise Missile', short:'CM', car:'cm', cost:50, build:36, range:16, speed:9, minH:2, silo:0, tech:'msl1', power:7}) && !M.cm.wmd && !M.cm.cd && !M.cm.perNation, 'B.4 Cruise Missile: $50M (was $60M), 36 h, 16 hexes = 2,880 km, speed 9, 2 h, no silo, no wait, no nation limit');
  ok(eq('bm', {name:'Ballistic Missile', short:'BM', car:'bm', cost:140, build:72, range:26, speed:22, minH:4, silo:1, tech:'msl2', power:16}) && !M.bm.cd && !M.bm.perNation, 'B.4 Ballistic Missile: $140M, 72 h, 26 hexes = 4,680 km, speed 22, 4 h, Silo I, no limit, no wait');
  ok(eq('ccm', {name:'Chemical Cruise Missile', short:'CCM', car:'cm', cost:110, build:54, range:16, speed:9, minH:2, silo:1, tech:'msl_chem', wmd:'chem', land:1, perSilo:2, perNation:4, cd:8, zone:8, zoneLong:12, civ:25, civRural:12, pop:0.02}), 'B.4 Chemical Cruise Missile: $110M, 54 h, cruise range and speed, Silo I, 2 a silo, 4 a nation, 8 h wait; gas 8 h (12), war damage 25 / 12, people 2%');
  ok(eq('chem', {name:'Chemical Ballistic Missile', short:'CBM', car:'bm', cost:170, build:84, range:26, speed:22, minH:4, silo:1, tech:'msl_chem', wmd:'chem', land:1, perSilo:2, perNation:6, cd:12, blast:9, zone:12, zoneLong:18, civ:40, civRural:20, pop:0.04, oil:20, metal:24, iron:10, elec:16, rare:12}), 'B.4 Chemical Ballistic Missile (was "Chemical Missile"): $170M, 84 h, 26 hexes, speed 22 (was 18), Silo I, 2 / 6, 12 h; gas 12 h (18), war damage 40 / 20, people 4%');
  ok(eq('ncm', {name:'Nuclear Cruise Missile', short:'NCM', car:'cm', cost:260, build:96, range:16, speed:9, minH:3, silo:1, tech:'msl_nuc', wmd:'nuc', perSilo:1, perNation:2, cd:12, soft:0.3, hard:0.25, nbSoft:0, hits:1, ko:24, links:48, civ:40, pop:0.06, zone:24}) && !M.ncm.grp, 'B.4 / F.4 Nuclear Cruise Missile: $260M, 96 h, Silo I, its own limit 1 a silo and 2 a nation, its own 12 h wait, 3 h at least; 30% (25%), 1 hit, buildings out 24 h, roads 48 h, war damage 40, people 6%, radiation 24 h');
  ok(eq('nuc', {name:'Nuclear Ballistic Missile', short:'NBM', car:'bm', cost:400, build:120, range:26, speed:22, minH:6, silo:2, tech:'msl_nuc', wmd:'nuc', perSilo:1, perNation:3, cd:24, grp:'nucBig', soft:0.5, hard:0.4, nbSoft:0.12, nbHard:0.08, hits:2, ko:48, links:96, civ:60, pop:0.12, nbCiv:20, nbPop:0.02, zone:48, oil:30, metal:40, iron:16, elec:30, rare:30}) && f('MSL_GRP').nucBig === 3, 'B.4 Nuclear Ballistic Missile (was "Tactical Nuclear Missile"): $400M, 120 h, Silo II, 1 a silo, 3 a nation (the group shared later with the ICBM), 24 h; 50% / 40%, 12% / 8% next door, 2 hits, 48 h, 96 h, war damage 60 / 20, people 12% / 2%, radiation 48 h');
  ok(Object.values(M).every(m => !/Tactical/.test(m.name + m.desc)) && !/Tactical/.test(f('BUILD').silo.desc) && !Object.values(RN).some(n => n.cat === 'msl' && /Tactical/.test(n.name + JSON.stringify(n.lv))), 'A.3 / F.6: no "Tactical" in any missile, the silo text or the missile research');
  ok(f('RCATS').some(c => c.name === 'Tactical Air'), 'F.6: the fighters\' research category "Tactical Air" is kept');
  ok(W.chem.rate === 0.025 && W.chem.fight === 0.8 && W.nuc.rate === 0.02 && W.nuc.fight === 0.9 && W.nuc.bunker === 0.5 && W.nuc.out === 0.5, 'the warheads: gas 2.5% an hour, x0.8; radiation 2%, x0.9, Bunker half, output half');
  ok(W.chem.mem.join() === '-30,-15,-8' && W.nuc.mem.join() === '-60,-35,-15' && W.nuc.fallout === -40 && W.chem.mark.v === -25 && W.chem.mark.days === 50 && W.nuc.mark.v === -55 && W.nuc.mark.days === 60 && W.nuc.noPeace === 72, 'diplomacy numbers by warhead (every nuclear missile the same: F.4): -30/-15/-8, -60/-35/-15, fallout -40, marks -25 50 d, -55 60 d, no peace 72 h');
  const C = f('MSL_CAR'), D = f('MSL_DEF');
  ok(C.cm.hp === 12 && C.bm.hp === 16 && C.icbm.hp === 24 && C.cm.hit.join() === '0.25,0.23,0.21' && C.bm.hit.join() === '0.2' && C.icbm.hit.join() === '0.1' && C.cm.max === 6 && C.bm.max === 10 && C.icbm.max === 16, 'C.1: HP 12 / 16 / 24; hit 25% (23, 21 with Speed), 20%, 10%; at most 6 / 10 / 16 shots');
  ok(D.sam.shots === 2 && D.sam.dmg === 6 && D.crui.shots === 3 && D.crui.dmg === 6 && D.frig.shots === 2 && D.frig.dmg === 4 && D.int.shots === 1 && D.int.dmg === 6 && D.asf.shots === 1 && D.asf.air && D.int.air && D.sam.nbFull === 'sam_g2', 'C.1 4: SAM 2 x 6, Cruiser 3 x 6, Frigate 2 x 4, fighters on patrol 1 x 6; the Long-Range SAM counts fully next door');
  ok(D.sam.vs.join() === 'cm,bm,icbm' && D.crui.vs.join() === 'cm,bm,icbm' && D.frig.vs.join() === 'cm,bm' && D.int.vs.join() === 'cm' && !D.tank && !D.inf && !D.jam && !D.awacs && !D.carr, 'C.1 3: who can shoot which body; tanks, infantry, jammers, AWACS and carriers cannot');
  ok(Object.values(D).every(d => typeof d.dmg === 'number' && typeof d.shots === 'number' && typeof d.hit === 'number'), 'the defenders are a data table (unit type -> HP damage per shot, shots an hour, hit chance): a later unit is one more entry');
  ok(f('MSL_SHIELD').join() === '1,1.25,1.5,1.8', 'C.1 6: Anti-Missile Shield x1.25 / 1.5 / 1.8');
  const nd = (i, day, cash, metal, rare, days, req) => { const n = RN[i], c = n && n.lv[0].c; return !!n && n.lv[0].day === day && c.cash === cash && c.metal === metal*K && c.rare === rare*K && c.days === days && JSON.stringify(n.req) === JSON.stringify(req); };
  ok(nd('msl_chem', 10, 183, 40, 55, 7, ['msl2']) && RN.msl_chem.name === 'Chemical Warhead' && /Chemical Cruise and Chemical Ballistic/.test(JSON.stringify(RN.msl_chem.lv)), 'Chemical Warhead: day 10, $183M, 40 mat, 55 rare, 7 days, needs Conventional Warhead; its text names both chemical missiles');
  ok(nd('chem_long', 16, 130, 45, 30, 5, ['msl_chem']) && RN.chem_long.name === 'Persistent Agent', 'Persistent Agent: day 16, $130M, 45, 30, 5 days');
  ok(nd('msl_nuc', 20, 390, 90, 112, 10, ['bm_pow']) && RN.msl_nuc.name === 'Nuclear Warhead' && /Nuclear Cruise Missiles\. Silos II and up also build Nuclear Ballistic Missiles/.test(JSON.stringify(RN.msl_nuc.lv)), 'Nuclear Warhead: day 20, $390M, 90 mat, 112 rare, 10 days, needs Heavier Warhead; the A.3 text');
  ok(/2,880 to 3,240 km/.test(JSON.stringify(RN.cm_rng.lv)) && /3,600 km/.test(JSON.stringify(RN.cm_rng.lv)) && /4,680 to 5,220 km/.test(JSON.stringify(RN.bm_rng.lv)) && /5,760 km/.test(JSON.stringify(RN.bm_rng.lv)) && /25% more often/.test(JSON.stringify(RN.msl3.lv)) && /80% more often/.test(JSON.stringify(RN.msl3.lv)), 'E: the research texts in map km (F.2), the shield 25% / 50% / 80%');
  ok(/Level I: ballistic and chemical missiles, and the Nuclear Cruise Missile\. Level II: Nuclear Ballistic Missiles\. Level III: Nuclear ICBMs \(later\)/.test(f('BUILD').silo.desc), 'A.3: the silo text');
  ok(nd('cbrn', 9, 110, 40, 30, 5, []) && RN.cbrn.cat === 'cmd' && RN.cbrn.lv.length === 2, 'CBRN Defence 1/2 unchanged');
  ok(RN.msl2.name === 'Conventional Warhead' && RN.msl1.lv[0].day === 1 && RN.msl1.lv[0].c.days === 6 && RN.msl2.lv[0].day === 6 && RN.msl2.lv[0].c.days === 8, 'msl2 Conventional Warhead; Cruise Missiles day 1, 6 days; Conventional Warhead day 6, 8 days');
  ok(JSON.stringify(f('CBRN_F')) === '[1,0.5,0.25]' && JSON.stringify(f('CBRN_POP')) === '[1,0.75,0.5]', 'CBRN Defence: forces 50% / 75% less, people a quarter / half fewer');
  // F.1 the ranges with research (map km: hexes x 180), by body; F.2 shown in map km
  fresh(); const r = (k, ...ids) => { S.nations[PL].tech = {}; for (const i of ids) f('rGrant')(S.nations[PL], i, 1); return f('mslOf')(PL, k); };
  const km = v => v*f('KM_HEX');
  ok(['cm', 'ccm', 'ncm'].every(k => km(r(k).range) === 2880 && km(r(k, 'cm_rng').range) === 3240 && (f('rGrant')(S.nations[PL], 'cm_rng', 2), km(f('mslOf')(PL, k).range) === 3600)), 'F.1: every cruise missile 2,880 km, 3,240, 3,600 km with Cruise Missile Range');
  ok(['bm', 'chem', 'nuc'].every(k => km(r(k).range) === 4680 && km(r(k, 'bm_rng').range) === 5220 && (f('rGrant')(S.nations[PL], 'bm_rng', 2), km(f('mslOf')(PL, k).range) === 5760)), 'F.1: every ballistic missile 4,680 km, 5,220, 5,760 km with Ballistic Missile Range');
  ok(['cm', 'ccm', 'ncm'].every(k => r(k, 'cm_spd').speed === 11) && r('bm', 'cm_spd').speed === 22 && r('bm', 'bm_pow').power === 19 && r('chem', 'bm_pow').power === 0 && r('cm', 'bm_rng').range === 16, 'Cruise Missile Speed for every cruise missile only; Heavier Warhead on the Ballistic Missile only; Ballistic Missile Range does not reach cruise missiles');
  ok(f('KM_HEX') === 180, 'map km: one hex is 180 km'); }

// ---- 2. the silo needs Conventional Warhead; cruise missiles without a silo
{ fresh(); const N = S.nations[PL]; rich(PL); const w = city(PL, 'Warsaw').id;
  N.tech = {}; grant(PL, 'msl1');
  ok(!f('canBuildHere')(w, 'silo'), 'no silo with Cruise Missiles only');
  grant(PL, 'msl2'); ok(f('canBuildHere')(w, 'silo'), 'a silo with Conventional Warhead');
  N.tech = {}; grant(PL, 'msl1');
  // a city with an Army Base, Airbase or Naval Yard builds cruise missiles with only Cruise Missiles researched
  const c2 = G.P.find(P => P.city && S.owner[P.id] === PL && P.id !== w).id; for (const k of ['fac', 'air', 'yard', 'silo']){ S.bld[w][k] = 0; S.bld[c2][k] = 0; }
  ok(f('mslWhy')(PL, w, 'cm') === 'Needs an Army Base, Airbase, Naval Yard or Missile Silo' && !api.buildMissile(PL, w, 'cm'), 'no cruise missile in a city with none of the three');
  S.bld[w].fac = 1; ok(api.buildMissile(PL, w, 'cm') && api.buildMissile(PL, w, 'cm'), 'two cruise missiles in an Army Base city');
  const why = f('mslWhy')(PL, w, 'cm'); ok(!api.buildMissile(PL, w, 'cm') && /At most 2/.test(why), 'a third is refused (2 a city without a silo, stored and building): ' + why);
  ok(f('queueUsed')(w) === 0, 'missiles do not count toward the unit queue (BLD-8)');
  S.bld[c2].air = 1; ok(api.buildMissile(PL, c2, 'cm'), 'an Airbase city builds them'); S.bld[c2].air = 0; S.bld[c2].yard = 1; ok(f('mslWhy')(PL, c2, 'cm') === '', 'a Naval Yard city too');
  ok(f('mslWhy')(PL, w, 'bm').startsWith('Research required') && (grant(PL, 'msl2'), f('mslWhy')(PL, w, 'bm') === 'Needs a Missile Silo'), 'the ballistic missile needs a silo');
  const h0 = S.queue[w][0].h; ok(h0 === 36, 'a cruise missile takes 36 h without a silo');
  f('knockOut')(w, 'fac', 10); const hq = S.queue[w][0].h; hours(3); ok(S.queue[w][0].h === hq, 'its line waits while the Army Base is knocked out');
  S.bdis[w] = {}; hours(40); ok(f('mslStored')(w, 'cm') >= 1, 'the cruise missile is stored in the Army Base city');
  // fired from that city: range from there; refused while every launcher is knocked out
  api.declareWar(PL, DE); const tgt = G.P.filter(P => !P.sea && S.owner[P.id] === DE).sort((a, b) => f('hexDist')(G.P[w].cc, a.cc) - f('hexDist')(G.P[w].cc, b.cc))[0].id;
  const far = G.P.filter(P => !P.sea && S.owner[P.id] === DE).sort((a, b) => f('hexDist')(G.P[w].cc, b.cc) - f('hexDist')(G.P[w].cc, a.cc))[0].id;
  const d = f('hexDist')(G.P[w].cc, G.P[tgt].cc), dfar = f('hexDist')(G.P[w].cc, G.P[far].cc);
  f('knockOut')(w, 'fac', 5); const c0 = f('missileCheck')(PL, w, tgt, 'cm'); ok(!c0.ok && /knocked out/.test(c0.why), 'no launch while its Army Base is knocked out: ' + c0.why); S.bdis[w] = {};
  const c1 = f('missileCheck')(PL, w, tgt, 'cm'); ok(c1.ok && c1.d === d, 'the range is measured from the storing city');
  ok(dfar > MISSILES.cm.range ? !f('missileCheck')(PL, w, far, 'cm').ok : true, 'out of range from there is refused');
  // an old save's silo, built with Cruise Missiles only, stays and builds Cruise Missiles
  fresh(); rich(PL); S.nations[PL].tech = {}; grant(PL, 'msl1'); const k0 = city(PL, 'Krakow') || city(PL, 'Kraków') || G.P.find(P => P.city && S.owner[P.id] === PL && P.id !== S.nations[PL].capital);
  for (const k of ['fac', 'air', 'yard']) S.bld[k0.id][k] = 0; S.bld[k0.id].silo = 1;
  ok(api.buildMissile(PL, k0.id, 'cm') && api.buildMissile(PL, k0.id, 'cm') && api.buildMissile(PL, k0.id, 'cm'), 'an old silo with Cruise Missiles only builds cruise missiles (no limit in a silo city)');
  ok(!f('canBuildHere')(k0.id, 'silo'), 'but a new silo, or the next level, needs Conventional Warhead'); }

// ---- 3. chemical and nuclear missiles: silo levels, prices, times, limits
{ fresh(); rich(PL); grant(PL, 'msl1', 'msl2', 'msl_chem', 'bm_pow', 'msl_nuc'); const N = S.nations[PL];
  const cs = G.P.filter(P => P.city && S.owner[P.id] === PL).map(P => P.id); ok(cs.length >= 4, 'Poland has 4 cities');
  for (const p of cs){ S.bld[p].silo = 0; S.queue[p] = []; }
  ok(f('mslWhy')(PL, cs[0], 'chem') === 'Needs a Missile Silo', 'chemical: needs a silo');
  S.bld[cs[0]].silo = 1; ok(f('mslWhy')(PL, cs[0], 'nuc') === 'Needs a Missile Silo II', 'nuclear: needs a Silo II');
  const cash0 = N.cash, rare0 = N.rare; ok(api.buildMissile(PL, cs[0], 'chem') && near(cash0 - N.cash, 170) && rare0 - N.rare === 12*K, 'a chemical missile pays $170M and 12 rare');
  ok(f('mslH')(cs[0], 'chem') === 84 && (S.bld[cs[0]].silo = 2, f('mslH')(cs[0], 'chem') === 76) && (S.bld[cs[0]].silo = 3, f('mslH')(cs[0], 'chem') === 67), 'chemical: 84 / 76 / 67 h at Silo I / II / III');
  ok((S.bld[cs[0]].silo = 2, f('mslH')(cs[0], 'nuc') === 108) && (S.bld[cs[0]].silo = 3, f('mslH')(cs[0], 'nuc') === 96), 'nuclear: 108 / 96 h at Silo II / III');
  S.bld[cs[0]].silo = 2;
  ok(api.buildMissile(PL, cs[0], 'chem') && !api.buildMissile(PL, cs[0], 'chem') && /per silo/.test(f('mslWhy')(PL, cs[0], 'chem')), 'two chemical missiles a silo, counting the queued ones');
  for (const p of cs.slice(1, 4)) S.bld[p].silo = 2;
  ok(api.buildMissile(PL, cs[1], 'chem') && api.buildMissile(PL, cs[1], 'chem') && api.buildMissile(PL, cs[2], 'chem') && api.buildMissile(PL, cs[2], 'chem') && !api.buildMissile(PL, cs[3], 'chem') && /in all/.test(f('mslWhy')(PL, cs[3], 'chem')), 'six chemical missiles a nation');
  const N2 = cash => N.cash = cash; N2(1e5);
  ok(api.buildMissile(PL, cs[0], 'nuc') && !api.buildMissile(PL, cs[0], 'nuc') && api.buildMissile(PL, cs[1], 'nuc') && api.buildMissile(PL, cs[2], 'nuc') && !api.buildMissile(PL, cs[3], 'nuc') && /in all/.test(f('mslWhy')(PL, cs[3], 'nuc')), 'one nuclear missile a silo, three a nation');
  S.queue[cs[0]] = S.queue[cs[0]].filter(it => it.t === 'nuc'); hours(110); ok(f('mslStored')(cs[0], 'nuc') === 1 && f('mstock')(cs[0]).wo === PL, 'built into the stock, marked as Poland\'s');
  N.tech = {}; ok(f('mslWhy')(PL, cs[3], 'chem').startsWith('Research required'), 'no chemical missile without Chemical Warhead'); }

// ---- 4. launch rules
{ fresh(); rich(PL); grant(PL, 'msl1', 'msl2', 'msl_chem', 'bm_pow', 'msl_nuc'); api.declareWar(PL, DE);
  const w = siloAt(PL, 'Warsaw', 2), M = f('mstock')(w); M.chem = 2; M.nuc = 1; M.wo = PL; M.cm = 2; M.bm = 1;
  const q = deLand(); strip(q); f('addArmy')(DE, q, {inf:4});
  const own = G.P.find(P => !P.sea && S.owner[P.id] === PL && P.id !== w).id; f('addArmy')(DE, own, {inf:2});
  const c = f('missileCheck')(PL, w, own, 'chem'); ok(!c.ok && /own land/.test(c.why), 'never at your own land, even with enemies there: ' + c.why);
  ok(f('missileCheck')(PL, w, own, 'bm').ok, '(a ballistic missile may still hit enemies in your land, as before)');
  const sea = G.P.find(P => P.sea && f('hexDist')(G.P[w].cc, P.cc) < 30).id; f('addArmy')(DE, sea, {frig:2});
  const cs = f('missileCheck')(PL, w, sea, 'chem'); ok(!cs.ok && /land only/.test(cs.why), 'chemical: never at sea: ' + cs.why); ok(f('missileCheck')(PL, w, sea, 'nuc').ok, 'nuclear: at enemy ships at sea');
  const ind = G.P.find(P => !P.sea && S.owner[P.id] < 0 && f('hexDist')(G.P[w].cc, P.cc) < 26); if (ind){ strip(ind.id); const ci = f('missileCheck')(PL, w, ind.id, 'chem'); ok(!ci.ok && /Independent/.test(ci.why), 'independent land only where enemies stand: ' + ci.why); }
  const peace = G.P.find(P => !P.sea && S.owner[P.id] === CZ).id; ok(!f('missileCheck')(PL, w, peace, 'chem').ok, 'not at a nation you are at peace with');
  const ch = f('missileCheck')(PL, w, q, 'chem'), nh = f('missileCheck')(PL, w, q, 'nuc'); ok(ch.ok && ch.hours === Math.max(4, Math.ceil(ch.d/22)) && ch.hours >= 4, `chemical flight at least 4 h (${ch.hours} h for ${ch.d} hexes)`); ok(nh.ok && nh.hours === Math.max(6, Math.ceil(nh.d/22)) && nh.hours >= 6, `nuclear flight at least 6 h (${nh.hours} h)`);
  ok(f('mslOf')(PL, 'chem').range === 26 && f('mslOf')(PL, 'nuc').range === 26 && (grant(PL, 'bm_rng'), f('mslOf')(PL, 'chem').range === 29 && f('mslOf')(PL, 'nuc').range === 29), 'ranges 26 hexes, +3 with Ballistic Missile Range (plan 2)');
  ok(api.launchMissile(PL, w, q, 'chem') && M.chem === 1 && S.nations[PL].wmdT.chem === S.hour, 'a chemical launch: stock down, the hour recorded');
  const cd = f('missileCheck')(PL, w, q, 'chem'); ok(!cd.ok && /every 12 h/.test(cd.why), 'one chemical launch every 12 h: ' + cd.why); ok(f('missileCheck')(PL, w, q, 'nuc').ok, 'the cooldowns are per kind');
  hours(12); ok(f('missileCheck')(PL, w, q, 'chem').ok, 'again after 12 h');
  ok(api.launchMissile(PL, w, q, 'nuc'), 'a nuclear launch'); M.nuc = 1; const cn = f('missileCheck')(PL, w, q, 'nuc'); ok(!cn.ok && /every 24 h/.test(cn.why), 'one nuclear launch every 24 h: ' + cn.why); hours(23); ok(!f('missileCheck')(PL, w, q, 'nuc').ok, 'not after 23 h'); hours(1); ok(f('missileCheck')(PL, w, q, 'nuc').ok, 'after 24 h');
}

// ---- 5. the chemical strike
const strike = (k, from, to, n = PL) => { f('missileImpact')({id:S.nid++, owner:n, k, from, to, t:1, dt:1, vic:f('wmdVictim')(n, to)}); };
{ fresh(); grant(PL, 'msl_chem'); api.declareWar(PL, DE); X('mslDefend = () => {}');
  const q = deLand(), w = city(PL, 'Warsaw').id; strip(q); const de = f('addArmy')(DE, q, {inf:10}), mine = f('addArmy')(PL, q, {inf:4}), tk = f('addArmy')(DE, q, {tank:6});
  const h0 = [hp(de), hp(mine), hp(tk)], pop0 = f('popOf')(q), cas0 = f('casOf')(q);
  strike('chem', w, q); const z = S.haz && S.haz[q];
  ok(z && z.k === 'gas' && z.until === S.hour + 12 && z.by === PL, 'a gas zone for 12 h');
  ok(hp(de) < h0[0] && hp(mine) < h0[1], 'the blast hits every force there, your own too');
  ok(near(f('casOf')(q) - cas0, 10, 1e-6), 'countryside: war damage 20, so civilian casualties 10');
  ok(near(f('popOf')(q), Math.max(0.02, pop0*(1 - 0.04)), 1e-9), 'the people: 4% fewer');
  const i1 = hp(de), a1 = hp(tk); S.hour++; f('hazHour')(); ok(near(hp(de), i1*0.975, 1e-6) && near(hp(tk), a1*(1 - 0.0125), 1e-6), 'gas: 2.5% of present health an hour, armour 1.25%');
  ok(f('hazFight')(q) === 0.8 && f('hazFight')(w) === 1, 'the battle factor in the gas: x0.8');
  de.w.inf = 5; const wb = de.w.inf; f('armyUpkeep')(new Set()); ok(de.w.inf === wb, 'no healing in the gas');
  // CBRN Defence and the Bunker
  grant(DE, 'cbrn'); let i2 = hp(de); S.hour++; f('hazHour')(); ok(near(hp(de), i2*(1 - 0.0125), 1e-6), 'CBRN Defence 1: the gas 50% less');
  f('rGrant')(S.nations[DE], 'cbrn', 2); i2 = hp(de); S.hour++; f('hazHour')(); ok(near(hp(de), i2*(1 - 0.025*0.25), 1e-6), 'CBRN Defence 2: 75% less');
  S.nations[DE].tech.cbrn = 0; S.bld[q].fort = 2; f('bunkerFull')(q); i2 = hp(de); const red = f('bunkerRed')(2); S.hour++; f('hazHour')(); ok(near(hp(de), i2*(1 - 0.025*(1 - red)), 1e-6), `the Bunker shields the garrison (level II: ${Math.round(red*100)}%)`);
  ok(hp(mine) < h0[1]*0.95, 'your own forces in the gas take it too');
  // renewal and the end
  S.bld[q].fort = 0; const u0 = z.until; S.hour += 3; strike('chem', w, q); ok(S.haz[q].until === S.hour + 12 && S.haz[q].until > u0, 'a second strike renews the clock (the longer wins)');
  grant(PL, 'chem_long'); strike('chem', w, q); ok(S.haz[q].until === S.hour + 18, 'Persistent Agent: 18 h');
  S.hour = S.haz[q].until; f('hazHour')(); ok(!S.haz || !S.haz[q], 'the zone ends at its hour');
  // a city: war damage 40, so casualties 20
  const c = G.P.find(P => P.city && S.owner[P.id] === DE && !S.bld[P.id].fort && P.id !== S.nations[DE].capital).id, cp0 = f('popOf')(c), cc0 = f('casOf')(c); strike('chem', w, c);
  ok(near(f('casOf')(c) - cc0, 20, 1e-6) && near(f('popOf')(c), cp0*0.96, 1e-9), 'a city: civilian casualties 20, 4% of its people');
  // the full 12 hours, as in docs/MISSILES.md 7.3 (mean dice)
  X('rng = () => 0.5'); }

// ---- 6. the nuclear strike, and the 7.3 table
{ const T = {}; const stacks = {'10 inf':{inf:10}, '6 tanks + 4 inf':{tank:6, inf:4}, '20 units':{inf:8, tank:6, art:3, sam:3}, '40 units':{inf:16, tank:12, art:6, sam:6}};
  const PLAN = {'10 inf':[40, 26, 50, 69, 12], '6 tanks + 4 inf':[35, 22, 54, 72, 12], '20 units':[59, 32, 99, 135, 22], '40 units':[105, 49, 198, 270, 45]};
  for (const [nm, u] of Object.entries(stacks)){ T[nm] = [];
    for (const k of ['chem12', 'chem4', 'nuc', 'nuc48', 'next']){ fresh(); X('rng = () => 0.5'); X('mslDefend = () => {}'); api.declareWar(PL, DE); const q = deLand(), w = city(PL, 'Warsaw').id;
      const at = k === 'next' ? G.P[q].nbs.find(v => !G.P[v].sea) : q; strip(q); strip(at); const a = f('addArmy')(DE, at, {...u}); const h0 = hp(a);
      strike(k.startsWith('chem') ? 'chem' : 'nuc', w, q); const hrs = {chem12:12, chem4:4, nuc48:48}[k] || 0; for (let h = 0; h < hrs; h++){ S.hour++; f('hazHour')(); }
      T[nm].push(Math.round(h0 - hp(a))); } }
  for (const nm in T){ const [c12, c4, nb, n48, nx] = T[nm], P = PLAN[nm];
    ok(Math.abs(nb - P[2]) <= Math.max(1, 0.1*P[2]) && Math.abs(n48 - P[3]) <= Math.max(1, 0.1*P[3]) && Math.abs(nx - P[4]) <= Math.max(1, 0.1*P[4]), `7.3 nuclear, ${nm}: blast ${nb}, 48 h ${n48}, next door ${nx} (plan ${P[2]}, ${P[3]}, ${P[4]}; within 10%)`);
    ok(Math.abs(c12 - P[0]) <= 0.15*P[0] && Math.abs(c4 - P[1]) <= 0.15*P[1], `7.3 chemical, ${nm}: 12 h ${c12}, out after 4 h ${c4} (plan ${P[0]}, ${P[1]}; within 15%: the blast is the ballistic missile's rule)`); }
  console.log('7.3 measured (damage: chemical 12 h, chemical 4 h, nuclear blast, nuclear 48 h, next door):', JSON.stringify(T));
  // the rest of the nuclear strike
  fresh(); X('mslDefend = () => {}'); api.declareWar(PL, DE); const w = city(PL, 'Warsaw').id;
  const c = G.P.find(P => P.city && S.owner[P.id] === DE && P.id !== S.nations[DE].capital && P.nbs.some(v => !G.P[v].sea && S.owner[v] === DE)).id; strip(c);
  for (const k of ['fac', 'air', 'arms', 'rec']) S.bld[c][k] = 2; S.bld[c].fort = 2; f('bunkerFull')(c);
  const g = f('addArmy')(DE, c, {inf:10}), tk = f('addArmy')(DE, c, {tank:5}), red = f('bunkerRed')(2); const nb = G.P[c].nbs.find(v => !G.P[v].sea); strip(nb); const ng = f('addArmy')(DE, nb, {inf:10});
  const hg = hp(g), ht = hp(tk), hn = hp(ng), pop0 = f('popOf')(c), popN = f('popOf')(nb), cas0 = f('casOf')(c), casN = f('casOf')(nb), y0 = f('provYield')(c).cash, lv0 = f('BK').reduce((s0, k) => s0 + (S.bld[c][k] || 0), 0);
  const memFR0 = f('mem')(FR, PL);
  strike('nuc', w, c);
  ok(near(hp(g), hg*(1 - 0.5*(1 - red*0.5)), 0.6), `the garrison loses half its health, a Bunker II counting half (${Math.round(red*50)}%)`);
  ok(near(hp(tk), ht*(1 - 0.4*(1 - red*0.5)), 0.6), 'armour 40%');
  ok(near(hp(ng), hn*0.88, 0.6), 'next door 12%');
  ok(f('BK').every(k => !(S.bld[c][k] > 0) || f('bdis')(c, k)) && f('bdisH')(c, 'fac') === 48, 'every building knocked out for 48 h');
  const lv1 = f('BK').reduce((s0, k) => s0 + (S.bld[c][k] || 0), 0); ok(lv0 - lv1 >= 1 && lv0 - lv1 <= 2, `two building hits (${lv0 - lv1} levels lost, the Bunker shields as for any hit)`);
  ok([...G.P[c].lk.values()].filter(r => r.road || r.rail).every(r => r.dmg >= 96), 'roads and rails cut 96 h');
  ok(S.haz[c].k === 'rad' && S.haz[c].until === S.hour + 48, 'radiation for 48 h');
  ok(near(f('casOf')(c) - cas0, 30, 1e-6) && near(f('casOf')(nb) - casN, 10, 1e-6), 'civilian casualties 30 (the limit), 10 next door');
  { const red2 = f('bunkerRed')(S.bld[c].fort || 0);   // (the Bunker's level after the two building hits, before every building is knocked out: a hit may wreck a level of it first)
    ok(near(f('popOf')(c), pop0*(1 - 0.12*(1 - red2*0.5)), 1e-9) && near(f('popOf')(nb), popN*0.98, 1e-9), `12% of the people (the Bunker counting half), 2% next door: ${f('popOf')(c)/pop0} ${f('popOf')(nb)/popN} (Bunker ${red2})`); }
  f('INCC').v = -1; X('INCC.v = -1'); ok(near(f('hazOut')(c), 0.5) && f('provYield')(c).cash < y0*0.6, 'output half while the radiation lasts');
  const i1 = hp(g); S.hour++; f('hazHour')(); ok(near(hp(g), i1*(1 - 0.02*47/48), 1e-6), 'radiation: 2% an hour falling to 0 over 48 h');
  ok(f('hazFight')(c) === 0.9, 'the battle factor in radiation: x0.9');
  ok(f('mem')(FR, PL) === memFR0, '(memory moves at launch, not at impact)'); }

// ---- 7. intercepted, at peace in flight, captured stock
{ fresh(); grant(PL, 'msl1', 'msl2', 'msl_chem', 'bm_pow', 'msl_nuc'); api.declareWar(PL, DE); const w = siloAt(PL, 'Warsaw', 2), M = f('mstock')(w); M.chem = 2; M.nuc = 1; M.wo = PL;
  const q = deLand(); strip(q); const a = f('addArmy')(DE, q, {inf:10}), h0 = hp(a);
  X('mslDefend = L => { for (const m of L){ m.def = 1; m.hp = 0; } }'); strike('chem', w, q); strike('nuc', w, q); ok(hp(a) === h0 && !(S.haz && S.haz[q]), 'intercepted: no blast, no gas, no radiation');
  X('mslDefend = () => {}'); api.launchMissile(PL, w, q, 'chem'); api.applyDeal(PL, DE, 'peace'); hours(10); ok(hp(a) === h0 && !(S.haz && S.haz[q]) && log(PL).some(t => /self-destructed/.test(t)), 'peace made in flight: it self-destructs');
  // the city changes hands: chemical and nuclear stock destroyed, cruise and ballistic stock passes to the captor (Q19)
  fresh(); grant(PL, 'msl1', 'msl2', 'msl_chem'); grant(DE, 'msl1', 'msl2'); api.declareWar(DE, PL); const kr = siloAt(PL, 'Warsaw', 1), st = f('mstock')(kr); st.chem = 2; st.wo = PL; st.cm = 2; st.bm = 1;
  strip(kr); f('capture')(kr, DE); hours(1);
  ok(st.chem === 0 && st.cm === 2 && st.bm === 1 && f('mslStored')(kr, 'bm') === 1 && f('mslStored')(kr, 'chem') === 0, 'a captured silo: its chemical stock is destroyed, its cruise and ballistic stock passes');
  ok(log(PL).some(t => /were destroyed/.test(t)) && log(DE).some(t => /none passes to you/.test(t)), 'both are told');
  const tg = G.P.filter(P => !P.sea && S.owner[P.id] === PL).sort((x, y) => f('hexDist')(G.P[kr].cc, x.cc) - f('hexDist')(G.P[kr].cc, y.cc))[0].id; ok(f('missileCheck')(DE, kr, tg, 'bm').ok, 'and the captor may fire it'); }

// ---- 8. diplomacy
{ fresh([PL, FR, DE, RU]); grant(PL, 'msl1', 'msl2', 'msl_chem', 'bm_pow', 'msl_nuc'); X('mslDefend = () => {}');
  api.declareWar(PL, DE); const w = siloAt(PL, 'Warsaw', 2), M = f('mstock')(w); M.chem = 1; M.nuc = 1; M.wo = PL; const q = deLand(); strip(q); f('addArmy')(DE, q, {inf:10});
  const others = S.nations.filter(N => N.alive && N.id !== PL && N.id !== DE).map(N => N.id); const atWarDE = others.find(o => o !== RU); f('setRel')(atWarDE, DE, 'war', null, atWarDE);
  const m0 = new Map(S.nations.map(N => [N.id, f('mem')(N.id, PL)])), op0 = f('opinion')(IT, PL);
  api.launchMissile(PL, w, q, 'chem');
  ok(f('mem')(DE, PL) - m0.get(DE) === -30, 'chemical: the victim -30');
  ok(f('mem')(IT, PL) - m0.get(IT) === -15 && f('mem')(atWarDE, PL) - m0.get(atWarDE) === -8, 'everyone else -15, -8 if at war with the victim');
  const part = f('opinionParts')(IT, PL).find(x => x[0] === 'Used chemical weapons'); ok(part && part[1] === -25, '"Used chemical weapons" -25 with everyone');
  ok(op0 - f('opinion')(IT, PL) === 40, 'a third nation thinks 40 less (memory -15, the mark -25)');
  // nuclear: allies join, a computer ally of the user leaves, fallout, every seat told
  fresh([PL, FR]); grant(PL, 'msl1', 'msl2', 'bm_pow', 'msl_nuc'); X('mslDefend = () => {}'); api.declareWar(PL, DE);
  const w2 = siloAt(PL, 'Warsaw', 2), M2 = f('mstock')(w2); M2.nuc = 1; M2.wo = PL;
  const deAlly = IT, plAlly = ES; f('setRel')(DE, deAlly, 'ally'); f('setRel')(PL, plAlly, 'ally'); f('setRel')(DE, FR, 'ally');
  const qq = deLand(); strip(qq); f('addArmy')(DE, qq, {inf:10}); const memRU = f('mem')(RU, PL);
  api.launchMissile(PL, w2, qq, 'nuc');
  ok(f('atWar')(deAlly, PL), 'the victim\'s computer ally joins the war'); ok(!f('atWar')(FR, PL) && log(FR).some(t => /You may join the war/.test(t)), 'a seat ally is told, not dragged in');
  ok(f('rel')(PL, plAlly).st !== 'ally', 'the user\'s computer ally (opinion now below 0) ends the alliance');
  ok(log(FR).some(t => /Nuclear launch detected|nuclear/i.test(t)), 'every seat hears of a nuclear launch');
  ok(f('mem')(RU, PL) - memRU === -35 && f('opinionParts')(RU, PL).find(x => x[0] === 'Used nuclear weapons')[1] === -55, 'nuclear: -35 memory and "Used nuclear weapons" -55 with everyone else');
  ok(!f('acceptOffer')(DE, PL, 'peace').ok && /nuclear/.test(f('acceptOffer')(DE, PL, 'peace').why), 'its peace offers are refused for 3 days');
  hours(80); ok(!/nuclear/.test(f('acceptOffer')(DE, PL, 'peace').why || ''), '...and heard again after 3 days');
  // fallout on a third nation: the province next door held by someone else
  fresh([PL]); grant(PL, 'msl1', 'msl2', 'bm_pow', 'msl_nuc'); X('mslDefend = () => {}'); api.declareWar(PL, DE);
  const bq = G.P.find(P => !P.sea && S.owner[P.id] === DE && P.nbs.some(v => !G.P[v].sea && S.owner[v] >= 0 && S.owner[v] !== DE && S.owner[v] !== PL)); if (bq){ const th = S.owner[bq.nbs.find(v => !G.P[v].sea && S.owner[v] >= 0 && S.owner[v] !== DE && S.owner[v] !== PL)];
    const m1 = f('mem')(th, PL); strike('nuc', city(PL, 'Warsaw').id, bq.id); ok(f('mem')(th, PL) - m1 === -40 && !f('atWar')(th, PL), `fallout on ${S.nations[th].name}'s land: memory -40, no war`); }
  // opinions back after 60 days (memory moves 1 a day back to 0; the marks fade to 0)
  fresh([PL]); grant(PL, 'msl1', 'msl2', 'bm_pow', 'msl_nuc'); api.declareWar(PL, DE); const w3 = siloAt(PL, 'Warsaw', 2), M3 = f('mstock')(w3); M3.nuc = 1; M3.wo = PL; const q3 = deLand(); strip(q3); f('addArmy')(DE, q3, {inf:5});
  const o0 = f('opinion')(RU, PL); api.launchMissile(PL, w3, q3, 'nuc'); const o1 = f('opinion')(RU, PL); S.hour += 60*24; for (let d = 0; d < 60; d++) f('diploDay')();
  ok(o0 - o1 >= 85 && Math.abs(f('opinion')(RU, PL) - o0) <= 5, `opinion ${o0} -> ${o1} at launch -> ${f('opinion')(RU, PL)} 60 days later`); }

// ---- 9. the computer
{ fresh([]); const n = DE, N = S.nations[n]; rich(n); grant(n, 'msl1'); const cap = N.capital; S.bld[cap].silo = 0; S.cons[cap] = null;
  for (const k of ['fac', 'rec', 'air', 'fort', 'arms', 'yard']) if (f('canBuildHere')(cap, k)) S.bld[cap][k] = f('BUILD')[k].max;   // (the capital has every other building: the silo is the next thing it builds)
  for (let i = 0; i < 40; i++) f('aiTurn')(n); ok(!S.bld[cap].silo && !(S.cons[cap] && S.cons[cap].k === 'silo'), 'the computer builds no silo with Cruise Missiles only');
  grant(n, 'msl2'); rich(n); for (let i = 0; i < 60 && !(S.cons[cap] && S.cons[cap].k === 'silo') && !S.bld[cap].silo; i++){ S.cons[cap] = null; f('aiTurn')(n); } ok(S.bld[cap].silo || (S.cons[cap] && S.cons[cap].k === 'silo'), 'it builds one in its capital with Conventional Warhead');
  // building: at war only, one chemical a silo, one nuclear in all, never under $250M left
  fresh([]); rich(DE); grant(DE, 'msl1', 'msl2', 'msl_chem', 'bm_pow', 'msl_nuc'); const c2 = S.nations[DE].capital; S.bld[c2].silo = 2; S.queue[c2] = [];
  f('aiWmdBuild')(DE, c2, S.nations[DE]); ok(!S.queue[c2].length, 'no chemical or nuclear missile at peace');
  api.declareWar(PL, DE); f('aiWmdBuild')(DE, c2, S.nations[DE]); f('aiWmdBuild')(DE, c2, S.nations[DE]); f('aiWmdBuild')(DE, c2, S.nations[DE]);
  ok(S.queue[c2].filter(it => it.t === 'nuc').length === 1 && S.queue[c2].filter(it => it.t === 'chem').length === 1, 'at war: one nuclear and one chemical missile, no more');
  fresh([]); rich(DE); S.nations[DE].cash = 400; grant(DE, 'msl1', 'msl2', 'msl_chem'); const c3 = S.nations[DE].capital; S.bld[c3].silo = 1; S.queue[c3] = []; api.declareWar(PL, DE); f('aiWmdBuild')(DE, c3, S.nations[DE]); ok(S.queue[c3].length === 1 && S.queue[c3][0].t === 'ccm', 'not with under $250M left: with $400M not the $170M Chemical Ballistic Missile, the $110M Chemical Cruise Missile instead');
  S.queue[c3] = []; S.nations[DE].cash = 350; f('aiWmdBuild')(DE, c3, S.nations[DE]); ok(!S.queue[c3].length, 'with $350M no chemical missile at all ($350M - $110M is under $250M)');
  // chemical use: a big enemy stack in an enemy-held province, none of its own there
  fresh([PL]); X('mslDefend = () => {}'); grant(DE, 'msl1', 'msl2', 'msl_chem'); api.declareWar(PL, DE); const ds = S.nations[DE].capital; S.bld[ds].silo = 1; const st = f('mstock')(ds); st.chem = 1; st.wo = DE;
  const pq = G.P.filter(P => !P.sea && S.owner[P.id] === PL && f('hexDist')(G.P[ds].cc, P.cc) <= 60 && P.id !== S.nations[PL].capital)[0].id; strip(pq);
  const small = f('addArmy')(PL, pq, {inf:5}); f('aiChem')(DE, ds); ok(st.chem === 1, 'no chemical missile at 5 units');
  small.u.inf = 12; small.u.tank = 6; f('aiChem')(DE, ds); ok(st.chem === 0 && S.inflight.some(m => m.k === 'chem' && m.to === pq && m.owner === DE), 'one at 18 units of power 80 or more');
  // forces on the move count (IMP-8): a column arriving within 6 hours
  fresh([PL]); X('mslDefend = () => {}'); grant(DE, 'msl1', 'msl2', 'msl_chem'); api.declareWar(PL, DE); const ds2 = S.nations[DE].capital; S.bld[ds2].silo = 1; const st2 = f('mstock')(ds2); st2.chem = 1; st2.wo = DE;
  const pq2 = G.P.filter(P => !P.sea && S.owner[P.id] === PL && f('hexDist')(G.P[ds2].cc, P.cc) <= 60 && P.nbs.some(v => S.owner[v] === PL && !G.P[v].sea))[0], from = pq2.nbs.find(v => S.owner[v] === PL && !G.P[v].sea); strip(pq2.id); strip(from);
  const col = f('addArmy')(PL, from, {inf:12, tank:6}); col.to = pq2.id; col.t = 0.9; f('aiChem')(DE, ds2); ok(st2.chem === 0, 'a column arriving within 6 hours counts');
  // its own forces there: no
  fresh([PL]); grant(DE, 'msl1', 'msl2', 'msl_chem'); api.declareWar(PL, DE); const ds3 = S.nations[DE].capital; S.bld[ds3].silo = 1; const st3 = f('mstock')(ds3); st3.chem = 1; st3.wo = DE;
  const pq3 = G.P.filter(P => !P.sea && S.owner[P.id] === PL && f('hexDist')(G.P[ds3].cc, P.cc) <= 60)[0].id; strip(pq3); f('addArmy')(PL, pq3, {inf:12, tank:6}); f('addArmy')(DE, pq3, {inf:1}); f('aiChem')(DE, ds3); ok(st3.chem === 1, 'not where its own forces stand');
  // nuclear: not without a reason; in answer to a chemical strike on itself
  fresh([PL]); X('mslDefend = () => {}'); grant(DE, 'msl1', 'msl2', 'bm_pow', 'msl_nuc'); api.declareWar(PL, DE); const dn = S.nations[DE].capital; S.bld[dn].silo = 2; const sn = f('mstock')(dn); sn.nuc = 1; sn.wo = DE;
  const pn = G.P.filter(P => !P.sea && S.owner[P.id] === PL && f('hexDist')(G.P[dn].cc, P.cc) <= 80 && P.nbs.every(v => !S.armies.some(a => a.owner === DE && a.at === v)))[0].id; strip(pn); f('addArmy')(PL, pn, {inf:20});
  f('aiNuc')(DE, dn); ok(sn.nuc === 1, 'no nuclear missile without an answer to give or a desperate war');
  S.wmd = [{by:PL, on:DE, k:'chem', h:S.hour - 10, p:dn}]; f('aiNuc')(DE, dn); ok(sn.nuc === 1, 'not in answer to a chemical strike (MS1: that is answered with a chemical one)');
  S.wmd = [{by:PL, on:DE, k:'nuc', h:S.hour - 10, p:dn}]; f('aiNuc')(DE, dn); ok(sn.nuc === 0 && S.inflight.some(m => m.k === 'nuc' && m.owner === DE), 'in answer to a nuclear strike on itself within 7 days');
  // research weights
  fresh([]); const w0 = f('aiWmdW')(PL); ok(w0.msl_chem === 0.3 && w0.msl_nuc === 0.15 && w0.chem_long === 0.2 && w0.cbrn === 0.2, 'research weights at peace: 0.3, 0.15, 0.2, 0.2');
  api.declareWar(RU, PL); const w1 = f('aiWmdW')(PL); ok(w1.msl_chem === (f('natPower')(RU) >= 1.3*f('natPower')(PL) ? 1 : 0.3), `Chemical Warhead 1 at war with an army 1.3 times its own (Russia ${Math.round(f('natPower')(RU))} against ${Math.round(f('natPower')(PL))}: ${w1.msl_chem})`);
  grant(RU, 'msl_chem', 'msl_nuc'); const w2 = f('aiWmdW')(PL); ok(w2.msl_nuc === 1 && w2.cbrn === 2, 'Nuclear Warhead 1 against a nuclear enemy, CBRN Defence 2 against one with Chemical Warhead');
  // walking out of a zone
  fresh([PL]); api.declareWar(PL, DE); const zq = deLand(); strip(zq); const za = f('addArmy')(DE, zq, {inf:4}); f('setHaz')(zq, 'gas', 12, PL); S.hour++; f('hazHour')(); ok(za.path.length && !f('hazAt')(za.path[0]), 'a computer force walks out of the gas');
  const pa = f('addArmy')(PL, city(PL, 'Warsaw').id, {inf:2}); f('setHaz')(city(PL, 'Warsaw').id, 'gas', 12, DE); S.hour++; f('hazHour')(); ok(!pa.path.length, 'a person\'s force stays where it was put'); }

// ---- 11. polish round 1 (the rules critic's findings)
{ // M8: a chemical missile at independent land, or a nuclear one at sea, self-destructs when no enemy of the user stands there any more
  fresh(); grant(PL, 'msl1', 'msl2', 'msl_chem', 'bm_pow', 'msl_nuc'); X('mslDefend = () => {}'); api.declareWar(PL, DE);
  const w = siloAt(PL, 'Warsaw', 2), M = f('mstock')(w); M.chem = 2; M.nuc = 1; M.wo = PL;
  const q = G.P.find(P => !P.sea && !P.city && S.owner[P.id] === DE && f('hexDist')(G.P[w].cc, P.cc) < 40).id; S.owner[q] = -1; X('ownChanged()'); strip(q);
  const a = f('addArmy')(DE, q, {inf:10}), h0 = hp(a);
  ok(api.launchMissile(PL, w, q, 'chem'), 'chemical at independent land where German forces stand: allowed'); api.applyDeal(PL, DE, 'peace'); hours(12);
  ok(hp(a) === h0 && !(S.haz && S.haz[q]) && log(PL).some(t => /self-destructed.*no longer at war with Germany/.test(t)) && !log(DE).some(t => /used chemical/.test(t)), 'independent land, peace in flight: it self-destructs (M8)');
  fresh(); grant(PL, 'msl1', 'msl2', 'bm_pow', 'msl_nuc'); X('mslDefend = () => {}'); api.declareWar(PL, DE);
  const w2 = siloAt(PL, 'Warsaw', 2), M2 = f('mstock')(w2); M2.nuc = 1; M2.wo = PL;
  const sq = G.P.filter(P => P.sea && f('hexDist')(G.P[w2].cc, P.cc) < 60).sort((x, y) => f('hexDist')(G.P[w2].cc, x.cc) - f('hexDist')(G.P[w2].cc, y.cc))[0].id; strip(sq);
  const sh = f('addArmy')(DE, sq, {frig:4}), s0 = hp(sh);
  ok(api.launchMissile(PL, w2, sq, 'nuc'), 'nuclear at German ships at sea: allowed'); api.applyDeal(PL, DE, 'peace'); hours(12);
  ok(hp(sh) === s0 && log(PL).some(t => /self-destructed/.test(t)), 'at sea, peace in flight: it self-destructs (M8)');
  // a neutral garrison alone is no enemy: independent land with only it cannot take a chemical or nuclear missile
  fresh(); grant(PL, 'msl1', 'msl2', 'msl_chem'); api.declareWar(PL, DE); const w3 = siloAt(PL, 'Warsaw', 1), M3 = f('mstock')(w3); M3.chem = 1; M3.wo = PL;
  const q3 = G.P.find(P => !P.sea && !P.city && S.owner[P.id] === DE && f('hexDist')(G.P[w3].cc, P.cc) < 40).id; S.owner[q3] = -1; X('ownChanged()'); strip(q3); f('addArmy')(-1, q3, {inf:6});
  const c3 = f('missileCheck')(PL, w3, q3, 'chem'); ok(!c3.ok && /Independent land/.test(c3.why), 'independent land with only a neutral garrison: refused');
  // a silo kind launches only from a silo: the silo wrecked, an Army Base left, its chemical missiles wait
  const tq = deLand(); strip(tq); f('addArmy')(DE, tq, {inf:10}); S.bld[w3].fac = 1; M3.cm = 1; S.bld[w3].silo = 0;
  const c4 = f('missileCheck')(PL, w3, tq, 'chem'); ok(!c4.ok && /No Missile Silo/.test(c4.why), 'no silo (an Army Base still stands): the chemical missile cannot launch');
  ok(f('missileCheck')(PL, w3, G.P.filter(P => S.owner[P.id] === DE && !P.sea).sort((x, y) => f('hexDist')(G.P[w3].cc, x.cc) - f('hexDist')(G.P[w3].cc, y.cc))[0].id, 'cm').why !== c4.why, '...a cruise missile there is not refused for the silo');
  // a nuclear missile building in a Silo II waits when the silo falls to I
  fresh(); rich(PL); grant(PL, 'msl1', 'msl2', 'bm_pow', 'msl_nuc'); const w5 = siloAt(PL, 'Warsaw', 2); S.queue[w5] = []; ok(api.buildMissile(PL, w5, 'nuc'), 'a nuclear missile starts in a Silo II');
  S.bld[w5].silo = 1; const h5 = S.queue[w5][0].h; hours(3); ok(S.queue[w5][0] && S.queue[w5][0].h === h5, 'its silo down to I: the missile waits');
  S.bld[w5].silo = 2; hours(1); ok(S.queue[w5][0].h === h5 - 1, '...and goes on once Silo II stands again');
  // a city lost and retaken within one hour: its chemical stock is destroyed all the same
  fresh(); grant(PL, 'msl1', 'msl2', 'msl_chem'); api.declareWar(DE, PL); const w6 = siloAt(PL, 'Warsaw', 1), M6 = f('mstock')(w6); M6.chem = 2; M6.wo = PL;
  strip(w6); f('capture')(w6, DE); f('capture')(w6, PL); hours(1); ok(f('mstock')(w6).chem === 0 && f('mslStored')(w6, 'chem') === 0, 'lost and retaken within the hour: the chemical stock is gone');
  // healing in a zone: ground forces none (and the army bar is told so), ships in its port heal
  fresh(); api.declareWar(PL, DE); const zq = deLand(); strip(zq); const g = f('addArmy')(DE, zq, {inf:4}); g.w.inf = 5; f('setHaz')(zq, 'gas', 12, PL);
  ok(f('healInfo')(g).kind === 'haz' && f('healInfo')(g).z === 'gas', 'healInfo: a ground force in the gas reads "no healing" (kind haz)');
  const port = G.P.find(P => P.city && S.owner[P.id] === DE && P.nbs.some(v => G.P[v].sea)).id; strip(port); const fl = f('addArmy')(DE, port, {frig:2}); fl.w.frig = 4; f('setHaz')(port, 'rad', 48, PL);
  ok(!f('hazHeal')(fl) && f('healInfo')(fl).kind !== 'haz', 'ships in an irradiated port still heal');
  // the computer's garrisons hold their capital, and a city with enemies next door, through the gas; a march into its own gassed land stops short
  fresh([PL]); api.declareWar(PL, DE); const cap = S.nations[DE].capital; strip(cap); const gar = f('addArmy')(DE, cap, {inf:5}); f('setHaz')(cap, 'gas', 12, PL); S.hour++; f('hazHour')();
  ok(!gar.path.length, 'a computer garrison stays in its gassed capital');
  const dc = G.P.find(P => P.city && S.owner[P.id] === DE && P.id !== cap && P.nbs.some(v => !G.P[v].sea && S.owner[v] === DE)), dn = dc.nbs.find(v => !G.P[v].sea && S.owner[v] === DE); strip(dc.id); strip(dn);
  const g2 = f('addArmy')(DE, dc.id, {inf:4}); f('setHaz')(dc.id, 'gas', 12, PL); S.hour++; f('hazHour')(); ok(g2.path.length > 0, 'a quiet city: its garrison walks out of the gas');
  g2.path = []; f('addArmy')(PL, dn, {inf:6}); S.hour++; f('hazHour')(); ok(!g2.path.length, '...but holds it with enemies next door');
  const ww = G.P.find(P => !P.sea && S.owner[P.id] === DE && P.id !== dc.id && P.nbs.includes(dc.id) && P.id !== dn); if (ww){ strip(ww.id); const mv = f('addArmy')(DE, ww.id, {inf:3}); const dz = G.P.find(P => !P.sea && !P.city && S.owner[P.id] === DE && P.nbs.includes(ww.id)); if (dz){ strip(dz.id); f('setHaz')(dz.id, 'gas', 12, PL); mv.path = [dz.id]; f('aiHazRoutes')(DE); ok(!mv.path.length, 'a computer march ending in its own gassed land stops short of it'); } }
  // nuclear: no answer at a 1-unit target; a desperate launch only at the front
  fresh([PL]); X('mslDefend = () => {}'); grant(DE, 'msl1', 'msl2', 'bm_pow', 'msl_nuc'); api.declareWar(PL, DE); const dn2 = S.nations[DE].capital; S.bld[dn2].silo = 2; const sn = f('mstock')(dn2); sn.nuc = 1; sn.wo = DE;
  for (const P of G.P) if (S.owner[P.id] === PL) strip(P.id);
  const pn = G.P.filter(P => !P.sea && S.owner[P.id] === PL && f('hexDist')(G.P[dn2].cc, P.cc) <= 80 && P.nbs.every(v => !S.armies.some(a => a.owner === DE && a.at === v)))[0].id; f('addArmy')(PL, pn, {inf:1});
  S.wmd = [{by:PL, on:DE, k:'nuc', h:S.hour - 10, p:dn2}]; f('aiNuc')(DE, dn2); ok(sn.nuc === 1, 'an answer, but only a 1-unit enemy force in range: no nuclear missile');
  strip(pn); f('addArmy')(PL, pn, {inf:12, tank:6}); f('aiNuc')(DE, dn2); ok(sn.nuc === 0, '...one at 18 units of power 80 or more');
  // the computer aims cruise missiles at a column arriving within 4 hours (IMP-8), and builds them in a city with an Army Base (at war)
  fresh([PL]); X('mslDefend = () => {}'); grant(DE, 'msl1'); api.declareWar(PL, DE); const dc2 = S.nations[DE].capital, sc = f('mstock')(dc2); S.bld[dc2].silo = 1; sc.cm = 1;
  for (const P of G.P) if (S.owner[P.id] === PL) strip(P.id);
  const tgt = G.P.filter(P => !P.sea && S.owner[P.id] === PL && f('hexDist')(G.P[dc2].cc, P.cc) <= 26 && P.nbs.some(v => !G.P[v].sea && S.owner[v] === PL))[0]; if (tgt){ const fr = tgt.nbs.find(v => !G.P[v].sea && S.owner[v] === PL);
    const colm = f('addArmy')(PL, fr, {inf:12, tank:6}); colm.to = tgt.id; colm.t = 0.9; f('aiMissiles')(DE); ok(sc.cm === 0 && S.inflight.some(m => m.k === 'cm' && m.owner === DE && m.to === tgt.id), 'a cruise missile at a column arriving within 4 hours'); }
  fresh([]); rich(DE); grant(DE, 'msl1'); api.declareWar(PL, DE); const hc = G.P.filter(P => P.city && S.owner[P.id] === DE && !S.bld[P.id].silo).map(P => P.id); for (const p of hc){ S.bld[p].fac = Math.max(1, S.bld[p].fac || 0); S.queue[p] = []; }
  for (let i = 0; i < 40; i++) f('aiTurn')(DE); ok(hc.some(p => S.queue[p].some(it => it.msl && it.t === 'cm') || f('mstock')(p).cm > 0), 'at war, the computer builds cruise missiles in an Army Base city without a silo (AI-1)'); }

// ---- 12. polish round 2 (owner 2026-11-27: MS1, MS2, the strip's "Damaged")
{ // MS1: a chemical strike on a computer nation that holds both kinds is answered with a chemical missile, not a nuclear one; a nuclear strike still
  // draws a nuclear answer; desperation (its first capital held, half its home cities held, its capital about to fall) still allows one
  const setup = () => { fresh([PL]); X('mslDefend = () => {}'); grant(DE, 'msl1', 'msl2', 'msl_chem', 'bm_pow', 'msl_nuc'); api.declareWar(PL, DE);
    const ds = S.nations[DE].capital; S.bld[ds].silo = 2; const st = f('mstock')(ds); st.chem = 1; st.nuc = 1; st.wo = DE;
    for (const P of G.P) if (S.owner[P.id] === PL) strip(P.id);
    const ws = siloAt(PL, 'Warsaw', 1);   // (the Polish silo the strike came from: the old rule's nuclear target)
    const pq = G.P.filter(P => !P.sea && !P.city && S.owner[P.id] === PL && f('hexDist')(G.P[ds].cc, P.cc) <= 60 && P.nbs.every(v => !S.armies.some(a => a.owner === DE && a.at === v)))[0].id;
    f('addArmy')(PL, pq, {inf:4, tank:2}); return {ds, st, ws, pq}; };
  const fl = k => (S.inflight || []).filter(m => m.owner === DE && m.k === k);
  { const {st, pq} = setup(); f('aiMissiles')(DE); ok(st.chem === 1 && !fl('chem').length && !fl('nuc').length, 'no strike to answer: no chemical missile at a 6-unit force, no nuclear one'); }
  { const {st, ws, pq} = setup(); S.wmd = [{by:PL, on:DE, k:'chem', h:S.hour - 10, p:S.nations[DE].capital, f:ws}]; f('aiMissiles')(DE);
    ok(fl('chem').length === 1 && fl('chem')[0].to === pq && st.chem === 0, 'MS1: a chemical strike on it: it answers with a chemical missile at the attacker\'s forces (6 units are enough for an answer)');
    ok(!fl('nuc').length && st.nuc === 1, 'MS1: ...and not with a nuclear one (it holds one; the attacker\'s silo city is in range)');
    S.hour += 5; f('aiMissiles')(DE); ok(!fl('nuc').length && st.nuc === 1, 'MS1: nor a nuclear one later, while the chemical strike is the only one'); }
  { const {st, ws} = setup(); S.wmd = [{by:PL, on:DE, k:'nuc', h:S.hour - 10, p:S.nations[DE].capital, f:ws}]; f('aiMissiles')(DE);
    ok(fl('nuc').length === 1 && fl('nuc')[0].to === ws && st.nuc === 0, 'a nuclear strike on it: a nuclear answer at the attacker\'s silo city, as before'); }
  { const {st} = setup(); S.wmd = [{by:PL, on:IT, k:'chem', h:S.hour - 10, p:S.nations[IT].capital}]; f('setRel')(DE, IT, 'ally'); f('aiMissiles')(DE);
    ok(fl('chem').length === 1 && !fl('nuc').length, 'a chemical strike on an ally: answered with a chemical missile too, no nuclear one'); }
  { setup(); const N = S.nations[DE]; ok(!f('aiDesperate')(DE, PL), 'not desperate at the start of a war');
    const c0 = N.cap0, o0 = S.owner[c0]; S.owner[c0] = PL; X('ownChanged()'); ok(f('aiDesperate')(DE, PL), 'desperate: its first capital held by the enemy'); S.owner[c0] = o0; X('ownChanged()');
    const hc = G.P.filter(P => P.city && S.home[P.id] === DE && P.id !== c0).map(P => P.id), half = Math.ceil(G.P.filter(P => P.city && S.home[P.id] === DE).length/2);
    for (const q of hc.slice(0, half - 1)) S.owner[q] = PL; X('ownChanged()'); ok(!f('aiDesperate')(DE, PL), 'not desperate with under half its home cities lost');
    S.owner[hc[half - 1]] = PL; X('ownChanged()'); ok(f('aiDesperate')(DE, PL), 'desperate: half its home cities held by the enemy'); }
  // MS2: Conventional Warhead (and Cruise Missiles) researched readily at war; a silo at war builds missiles from $220M
  const W = f('AI_MSLW'); ok(W[0].msl1 === 1 && W[0].msl2 === 1 && W[1].msl1 === 20 && W[1].msl2 === 30, 'MS2: research weights 1 / 1 at peace, 20 / 30 at war');
  const picks = war => { fresh([]); S.hour = 10*24; if (war) api.declareWar(PL, DE); const N = S.nations[DE]; grant(DE, 'msl1'); let k = 0;
    for (let i = 0; i < 300; i++){ N.research = null; N.research2 = null; N.rPick = null; rich(DE); f('aiResearch')(DE); if ([N.research, N.research2].some(r => r && r.id === 'msl2')) k++; } return k; };
  const kp = picks(false), kw = picks(true); ok(kw >= 3*Math.max(1, kp) && kw >= 15, `MS2: Conventional Warhead picked ${kw} times in 300 at war, ${kp} at peace`);
  const mb = war => { fresh([]); grant(DE, 'msl1', 'msl2'); if (war) api.declareWar(PL, DE); const c = S.nations[DE].capital; S.bld[c].silo = 1; let k = 0;
    for (let i = 0; i < 60; i++){ S.queue[c] = []; rich(DE); S.nations[DE].cash = 260; f('aiTurn')(DE); if (S.queue[c].some(it => it.msl && (it.t === 'cm' || it.t === 'bm'))) k++; } return k; };
  const mp = mb(false), mw = mb(true); console.log(`MS2 measured: Conventional Warhead started ${kw} times in 300 rolls at war, ${kp} at peace; a silo with $260M builds missiles in ${mw} of 60 turns at war, ${mp} at peace`); ok(mp === 0 && mw > 0, `MS2: with $260M a silo builds cruise or ballistic missiles at war (${mw} turns in 60), not at peace (${mp})`);
  // MS2: at war with Conventional Warhead and no silo, it saves for one and builds it in its capital before a Bunker; then a first ballistic missile
  { fresh([]); grant(DE, 'msl1', 'msl2'); const N = S.nations[DE], c = N.capital; S.bld[c].silo = 0; S.bld[c].fac = Math.max(1, S.bld[c].fac); S.cons[c] = null; rich(DE); N.cash = 200;
    ok(f('aiMslSave')(DE) === null, 'MS2: at peace it saves for nothing');
    f('aiTurn')(DE); ok(!(S.cons[c] && S.cons[c].k === 'silo') && !S.bld[c].silo, 'MS2: at peace with $200M: no silo (that needs over $260M)');
    api.declareWar(PL, DE); S.cons[c] = null; N.cash = 100; const r0 = f('aiReserve')(DE); ok(f('aiMslSave')(DE) === 'silo' && r0 >= f('buildCost')(DE, 'silo', 1, c).cash, 'MS2: at war it saves for a silo (reserve ' + Math.round(r0) + ')');
    rich(DE); N.cash = 200; f('aiTurn')(DE); ok(S.cons[c] && S.cons[c].k === 'silo', 'MS2: at war with $200M: the silo goes up in its capital first');
    S.cons[c] = null; S.bld[c].silo = 1; S.queue[c] = []; ok(f('aiMslSave')(DE) === 'bm', 'MS2: the silo stands: it saves for a first ballistic missile');
    N.cash = 200; f('aiTurn')(DE); ok(S.queue[c].some(it => it.msl && it.t === 'bm') && f('aiMslSave')(DE) === null, 'MS2: ...builds it from $160M and saves no more'); }
  // merge fix 2 (owner 2026-11-28, "silo saving only with positive income"): a nation at war with Conventional Warhead and no silo saves for one
  // only while its daily income is positive. Broke (its far cities lost, 40 artillery to pay for): nothing set aside, a unit its money covers is
  // bought, and with $900 its turn recruits instead of putting up a silo. Positive income: it still saves, the same unit waits, the silo goes up
  { fresh([]); grant(DE, 'msl1', 'msl2'); const N = S.nations[DE], c = N.capital; api.declareWar(PL, DE); S.bld[c].fac = Math.max(1, S.bld[c].fac); S.bld[c].silo = 0; S.cons[c] = null;
    for (const P of G.P.filter(P => S.owner[P.id] === DE && P.id !== c && !P.nbs.includes(c))) S.owner[P.id] = PL; X('ownChanged()');
    f('addArmy')(DE, c, {art:40}); rich(DE); X('INCC.v = -1'); const net = f('income')(DE).net.cash, tc = f('ucost')(DE, 'tank').cash; N.cash = tc + 40;
    ok(net < 0 && f('aiMslSave')(DE) === null && f('aiReserve')(DE) === 0 && f('aiReserve')(DE, 'metal') === 0, `silo saving: a broke nation (daily income ${net.toFixed(1)}) sets nothing aside for a silo (reserve ${f('aiReserve')(DE)})`);
    ok(f('aiSpare')(DE, 'tank'), 'silo saving: ...and a tank its money covers ($' + Math.round(N.cash) + ') is bought');
    N.cash = 900; const q = () => f('ownedBy')(DE).reduce((s0, p) => s0 + S.queue[p].filter(it => !it.msl).length, 0), q0 = q(); f('aiTurn')(DE);
    ok(q() > q0 && !(S.cons[c] && S.cons[c].k === 'silo'), `silo saving: ...its turn with $900 recruits (${q0} -> ${q()} units queued) and puts up no silo`); }
  { fresh([]); grant(DE, 'msl1', 'msl2'); const N = S.nations[DE], c = N.capital; api.declareWar(PL, DE); S.bld[c].fac = Math.max(1, S.bld[c].fac); S.bld[c].silo = 0; S.cons[c] = null; rich(DE); X('INCC.v = -1');
    const net = f('income')(DE).net.cash, tc = f('ucost')(DE, 'tank').cash; N.cash = tc + 40;
    ok(net > 0 && f('aiMslSave')(DE) === 'silo' && f('aiReserve')(DE) >= f('buildCost')(DE, 'silo', 1, c).cash && !f('aiSpare')(DE, 'tank'), `silo saving: with a positive daily income (${net.toFixed(1)}) it still saves for the silo (reserve ${f('aiReserve')(DE)}) and the tank waits`);
    N.cash = 200; f('aiTurn')(DE); ok(S.cons[c] && S.cons[c].k === 'silo', 'silo saving: ...and builds its silo with $200'); }
  // the strip's "Damaged": mslUp counts the missiles that can launch now
  fresh(); grant(PL, 'msl1', 'msl2', 'msl_chem'); const w = siloAt(PL, 'Warsaw', 1), M = f('mstock')(w); M.chem = 1; M.bm = 1; M.wo = PL;
  const kr = G.P.find(P => P.city && S.owner[P.id] === PL && P.id !== w).id; S.bld[kr].silo = 0; S.bld[kr].fac = 1; f('mstock')(kr).cm = 2;
  let u = f('mslUp')(PL, 'chem'); ok(u.held === 1 && u.up === 1 && u.h === 0, 'mslUp: a chemical missile in a working silo is up');
  f('knockOut')(w, 'silo', 48); u = f('mslUp')(PL, 'chem'); const ub = f('mslUp')(PL, 'bm'), uc = f('mslUp')(PL, 'cm');
  ok(u.held === 1 && u.up === 0 && u.h === 48 && ub.up === 0 && uc.up === 2, 'mslUp: the silo knocked out: its chemical and ballistic missiles are down (48 h), the cruise missiles in an Army Base city are not');
  ok(/knocked out/.test(f('missileCheck')(PL, w, deLand(), 'chem').why), '...and the picker still gives the reason');
  S.bld[w].silo = 0; u = f('mslUp')(PL, 'chem'); ok(u.held === 1 && u.up === 0 && u.h === 0, 'mslUp: the silo gone: down, no hours'); }

// ---- 13. MISSILES PLAN 2 (owner 2026-11-28, docs/MISSILES-PLAN2.md, defaults on F.1-F.4 and F.6-F.8): the limits and waits by kind, the flight
// times, the Nuclear Cruise Missile (F.4), HP in flight (C: who counts, shots, best shots first, the shield, salvo order, the C.2 table and the
// C.3 worked examples, exact and measured over seeded dice), the messages, the computer's new rules
const PLAN2 = {};   // the measured numbers, printed at the end
{ // limits and waits by kind (B.4): every kind its own
  fresh(); rich(PL); grant(PL, 'msl1', 'msl2', 'msl_chem', 'bm_pow', 'msl_nuc'); const cs = G.P.filter(P => P.city && S.owner[P.id] === PL).map(P => P.id); for (const p of cs){ S.bld[p].silo = 1; S.queue[p] = []; }
  ok(f('mslWhy')(PL, cs[0], 'ncm') === '' && f('mslWhy')(PL, cs[0], 'nuc') === 'Needs a Missile Silo II' && f('mslWhy')(PL, cs[0], 'ccm') === '', 'F.4: the Nuclear Cruise Missile comes at a Silo I (the Nuclear Ballistic Missile still needs a Silo II); the Chemical Cruise Missile at a Silo I');
  ok(api.buildMissile(PL, cs[0], 'ncm') && !api.buildMissile(PL, cs[0], 'ncm') && api.buildMissile(PL, cs[1], 'ncm') && !api.buildMissile(PL, cs[2], 'ncm') && /At most 2 Nuclear Cruise Missiles in all/.test(f('mslWhy')(PL, cs[2], 'ncm')), 'F.4: Nuclear Cruise Missiles 1 a silo, 2 a nation');
  for (const p of cs) S.bld[p].silo = 2; ok(api.buildMissile(PL, cs[0], 'nuc') && api.buildMissile(PL, cs[1], 'nuc') && api.buildMissile(PL, cs[2], 'nuc') && !api.buildMissile(PL, cs[3], 'nuc'), 'F.4: ...and they do not use up the Nuclear Ballistic Missile\'s 3: five nuclear missiles a nation in all');
  ok(f('mslNation')(PL, 'ncm') === 2 && f('mslNation')(PL, 'nuc') === 3 && f('mslGrpN')(PL, 'nuc') === 3 && f('mslGrp')('nuc').join() === 'nuc', 'the group cap (3, shared later with the ICBM) counts the Nuclear Ballistic Missiles only');
  for (const p of cs) S.queue[p] = [];
  ok(api.buildMissile(PL, cs[0], 'ccm') && api.buildMissile(PL, cs[0], 'ccm') && !api.buildMissile(PL, cs[0], 'ccm') && api.buildMissile(PL, cs[1], 'ccm') && api.buildMissile(PL, cs[1], 'ccm') && !api.buildMissile(PL, cs[2], 'ccm') && /At most 4 Chemical Cruise/.test(f('mslWhy')(PL, cs[2], 'ccm')), 'B.4: Chemical Cruise Missiles 2 a silo, 4 a nation');
  ok(api.buildMissile(PL, cs[2], 'chem') && api.buildMissile(PL, cs[0], 'chem'), '...the Chemical Ballistic Missile\'s own limits are untouched by them');
  const h = k => f('mslH')(cs[0], k); S.bld[cs[0]].silo = 1; ok(h('ccm') === 54 && h('ncm') === 96 && h('cm') === 36 && h('bm') === 72 && h('chem') === 84, 'B.4 build times at Silo I: 54 / 96 / 36 / 72 / 84 h');
  // waits: each kind its own clock; launches and flight times
  fresh(); rich(PL); grant(PL, 'msl1', 'msl2', 'msl_chem', 'bm_pow', 'msl_nuc'); api.declareWar(PL, DE); X('mslDefend = () => {}');
  const w = siloAt(PL, 'Warsaw', 2), M = f('mstock')(w); Object.assign(M, {cm:3, bm:2, ccm:2, chem:2, ncm:2, nuc:1, wo:PL});
  const tg = G.P.filter(P => !P.sea && S.owner[P.id] === DE).sort((a, b) => f('hexDist')(G.P[w].cc, a.cc) - f('hexDist')(G.P[w].cc, b.cc)); for (const P of tg.slice(0, 6)) f('addArmy')(DE, P.id, {inf:3});
  const q = tg[0].id, d = f('hexDist')(G.P[w].cc, G.P[q].cc), ch = k => f('missileCheck')(PL, w, q, k);
  ok(ch('cm').hours === Math.max(2, Math.ceil(d/9)) && ch('ccm').hours === ch('cm').hours && ch('ncm').hours === Math.max(3, Math.ceil(d/9)) && ch('bm').hours === 4 && ch('chem').hours === 4 && ch('nuc').hours === 6, `B.1 flight times (${Math.round(d*180)} km): cruise ${ch('cm').hours} h, NCM ${ch('ncm').hours} h (3 at least), ballistic and CBM 4 h, NBM 6 h`);
  ok(api.launchMissile(PL, w, q, 'ncm') && S.nations[PL].wmdT.ncm === S.hour && ch('nuc').ok && ch('chem').ok && ch('ccm').ok && !ch('ncm').ok && /every 12 h/.test(ch('ncm').why), 'F.4: the Nuclear Cruise Missile\'s own 12 h wait (the other kinds still fire)');
  ok(api.launchMissile(PL, w, q, 'ccm') && !ch('ccm').ok && /every 8 h/.test(ch('ccm').why) && ch('chem').ok, 'B.4: the Chemical Cruise Missile\'s own 8 h wait');
  hours(8); ok(ch('ccm').ok && !ch('ncm').ok, '...8 h later a Chemical Cruise Missile again, not yet a Nuclear Cruise Missile'); hours(4); ok(ch('ncm').ok, '...12 h after it, the Nuclear Cruise Missile');
  ok(ch('cm').ok && api.launchMissile(PL, w, q, 'cm') && ch('cm').ok && api.launchMissile(PL, w, q, 'bm') && ch('bm').ok, 'cruise and ballistic missiles have no wait');
  // F.2 map km in the messages: the out-of-range reason
  const far = G.P.filter(P => !P.sea && S.owner[P.id] === RU).sort((a, b) => f('hexDist')(G.P[w].cc, b.cc) - f('hexDist')(G.P[w].cc, a.cc))[0]; api.declareWar(PL, RU); f('addArmy')(RU, far.id, {inf:2});
  const fr = f('missileCheck')(PL, w, far.id, 'bm'); ok(!fr.ok && /max 4,680 km/.test(fr.why), 'F.2: ranges read in map km: ' + fr.why); }
{ // F.4: the Nuclear Cruise Missile costs the same opinion as any nuke: memory, the mark, allies told, everyone sees it, peace refused 3 days
  fresh([PL, FR]); grant(PL, 'msl1', 'msl2', 'bm_pow', 'msl_nuc'); X('mslDefend = () => {}'); api.declareWar(PL, DE);
  const w = siloAt(PL, 'Warsaw', 1), M = f('mstock')(w); M.ncm = 1; M.wo = PL; const q = deLand(); strip(q); f('addArmy')(DE, q, {inf:10}); const m0 = f('mem')(RU, PL), v0 = f('mem')(DE, PL);
  ok(api.launchMissile(PL, w, q, 'ncm') && S.inflight.some(m => m.k === 'ncm' && m.all), 'a Nuclear Cruise Missile from a Silo I: every nation sees it fly');
  PLAN2.victimMem = [f('mem')(DE, PL) - v0];
  ok(f('mem')(RU, PL) - m0 === -35 && f('opinionParts')(RU, PL).find(x => x[0] === 'Used nuclear weapons')[1] === -55, 'F.4: the same opinion cost as any nuke (-35 everyone, "Used nuclear weapons" -55)');
  ok(f('nucShunned')(PL) && /nuclear/.test(f('acceptOffer')(DE, PL, 'peace').why || ''), '...its peace offers refused for 3 days'); ok(log(FR).some(t => /Nuclear launch detected/.test(t)), '...every seat hears of the launch');
  // the strike: 30% (armour 25%), nothing next door, one building hit, 24 h out, radiation 24 h halving output
  const c = G.P.find(P => P.city && S.owner[P.id] === DE && P.id !== S.nations[DE].capital && !S.bld[P.id].fort && P.nbs.some(v => !G.P[v].sea && S.owner[v] === DE)).id; strip(c); const nb = G.P[c].nbs.find(v => !G.P[v].sea); strip(nb);
  for (const k of ['fac', 'air']) S.bld[c][k] = 2; const g = f('addArmy')(DE, c, {inf:10}), tk = f('addArmy')(DE, c, {tank:5}), ng = f('addArmy')(DE, nb, {inf:10}), hg = hp(g), ht = hp(tk), hn = hp(ng), pop0 = f('popOf')(c), popN = f('popOf')(nb);
  const lv0 = f('BK').reduce((s0, k) => s0 + (S.bld[c][k] || 0), 0);
  strike('ncm', w, c);
  ok(near(hp(g), hg*0.7, 0.6) && near(hp(tk), ht*0.75, 0.6) && hp(ng) === hn && near(f('popOf')(nb), popN, 1e-9), 'B.3 Nuclear Cruise Missile: every force there loses 30% (armour 25%); nothing next door');
  ok(f('BK').reduce((s0, k) => s0 + (S.bld[c][k] || 0), 0) >= lv0 - 1 && f('bdisH')(c, 'fac') === 24 && S.haz[c].k === 'rad' && S.haz[c].until === S.hour + 24 && near(f('popOf')(c), pop0*0.94, 1e-9), 'B.3: one building hit, every building out 24 h, radiation 24 h, 6% of the people');
  X('INCC.v = -1'); ok(near(f('hazOut')(c), 0.5), 'its radiation halves the output while it lasts'); }
{ // F.4: the victim's memory moves as for a Nuclear Ballistic Missile (the same setup)
  fresh([PL, FR]); grant(PL, 'msl1', 'msl2', 'bm_pow', 'msl_nuc'); X('mslDefend = () => {}'); api.declareWar(PL, DE); const w2 = siloAt(PL, 'Warsaw', 2), M2 = f('mstock')(w2); M2.nuc = 1; M2.wo = PL;
  const q2 = deLand(); strip(q2); f('addArmy')(DE, q2, {inf:10}); const v1 = f('mem')(DE, PL); api.launchMissile(PL, w2, q2, 'nuc'); PLAN2.victimMem.push(f('mem')(DE, PL) - v1);
  ok(PLAN2.victimMem[0] === PLAN2.victimMem[1], 'F.4: the victim\'s memory moves as for a Nuclear Ballistic Missile: ' + PLAN2.victimMem); }
{ // C.3 who counts, C.1 5 best shots first, the ballistic / cruise bodies, the shield
  fresh(); api.declareWar(PL, DE); const q = deLand(); strip(q); for (const v of G.P[q].nbs) strip(v); const nb = G.P[q].nbs.find(v => !G.P[v].sea);
  const L = (k, n = PL) => f('mslShotList')({owner:n, k, to:q, from:0}, null);
  f('addArmy')(DE, q, {sam:1}); ok(L('bm').length === 2 && L('bm').every(([d, p]) => d === 6 && near(p, 0.2)), 'a SAM in the target: 2 shots of 6 HP at 20% (ballistic)');
  const nbS = f('addArmy')(DE, nb, {sam:1}); ok(L('bm').length === 3, 'a SAM next door counts half: 1 shot more');
  grant(DE, 'sam_g2'); ok(L('bm').length === 4, '...with Long-Range SAM it counts fully next door');
  nbS.to = q; ok(L('bm').length === 2, 'a SAM on the move does not shoot'); nbS.to = null;
  f('setRel')(PL, DE, 'peace'); ok(L('bm').length === 0, 'a defender at peace with the launcher does not shoot'); api.declareWar(PL, DE);
  strip(q); strip(nb); f('addArmy')(DE, q, {frig:2, crui:2, tank:4, inf:4, jam:2}); const sh = L('bm'); ok(sh.length === 10 && sh.slice(0, 6).every(x => x[0] === 6) && sh.slice(6).every(x => x[0] === 4), 'best shots first: the Cruisers\' 6 HP shots, then the Frigates\' 4 HP; tanks, infantry and jammers fire none');
  ok(L('cm').length === 6 && L('cm').every(x => x[0] === 6), 'a cruise missile takes at most 6 shots: the 6 HP ones');
  grant(PL, 'cm_spd'); ok(near(L('cm')[0][1], 0.23), 'Cruise Missile Speed I: 23% a shot'); f('rGrant')(S.nations[PL], 'cm_spd', 2); ok(near(L('cm')[0][1], 0.21), 'Speed II: 21%');
  grant(DE, 'msl3'); ok(near(L('bm')[0][1], 0.25), 'Anti-Missile Shield I: 20% x1.25'); f('rGrant')(S.nations[DE], 'msl3', 3); ok(near(L('bm')[0][1], 0.36) && near(L('cm')[0][1], 0.21*1.8), 'Shield III: x1.8 (36% ballistic)');
  // fighters on patrol over the target count against cruise missiles only; parked ones do not
  strip(q); const base = city(DE, 'Berlin').id, wg = f('addArmy')(DE, base, {int:2, asf:2}); wg.air = {base, cd:0};
  ok(L('cm').length === 0, 'fighters parked at their airbase do not shoot'); wg.fly = {kind:'patrol', ph:'patrol', tgt:q, t:0, hrs:12};
  ok(L('cm').length === 4 && L('bm').length === 0, 'four fighters on patrol over the target: 4 shots at a cruise missile, none at a ballistic one'); wg.fly = null;
  // swarm drones' saturation weakens the defence
  strip(q); const sa = f('addArmy')(DE, q, {sam:2}); ok(L('bm').length === 4, 'two SAMs: 4 shots'); sa.sat = 0.5; ok(L('bm').length === 2, 'saturated by half (swarm drones): 2 shots'); }
// the C.2 table, exact (mslOdds: the card's sum) for 1 to 8 SAMs and the shield, cruise / ballistic / ICBM (a test ICBM on the body table: the
// ICBM itself is the later job). The plan's numbers, rounded
const ICBM = () => X("MISSILES.icbm_t = {...MISSILES.nuc, car:'icbm', name:'test ICBM', grp:null}"), ICBM0 = () => X('delete MISSILES.icbm_t');
{ const T = {none:[[6, 0, 0], [26, 3, 0], [47, 10, 0], [47, 20, 1], [47, 32, 1], [47, 32, 7]], I:[[10, 0, 0], [37, 5, 0], [61, 17, 0], [61, 32, 1], [61, 47, 3], [61, 47, 13]], II:[[14, 0, 0], [48, 8, 0], [73, 26, 1], [73, 45, 2], [73, 62, 5], [73, 62, 21]], III:[[20, 0, 0], [61, 14, 0], [84, 37, 1], [84, 60, 4], [84, 76, 9], [84, 76, 32]]};
  fresh(); api.declareWar(PL, DE); ICBM(); const q = deLand(); strip(q); for (const v of G.P[q].nbs) strip(v); const sam = f('addArmy')(DE, q, {sam:1}); let bad = 0; const got = {};
  ['none', 'I', 'II', 'III'].forEach((sl, lv) => { S.nations[DE].tech.msl3 = lv; got[sl] = [];
    [1, 2, 3, 4, 5, 8].forEach((n, i) => { sam.u.sam = n; const r = ['cm', 'bm', 'icbm_t'].map(k => Math.round(100*(1 - f('mslOdds')(-1, 0, q, k, PL).p))); got[sl].push(r.join('/')); if (r.some((v, j) => Math.abs(v - T[sl][i][j]) > 1)) bad++; }); });
  ICBM0(); PLAN2.c2 = got; ok(!bad, 'C.2: the table of stop chances (1, 2, 3, 4, 5, 8 SAMs; no shield to Shield III; within 1 point): ' + JSON.stringify(got));
  // Speed: 3 SAMs, no shield: 47 / 42 / 37%
  sam.u.sam = 3; S.nations[DE].tech.msl3 = 0; const sp = [0, 1, 2].map(l => { S.nations[PL].tech.cm_spd = l; return Math.round(100*(1 - f('mslOdds')(-1, 0, q, 'cm', PL).p)); }); S.nations[PL].tech.cm_spd = 0;
  ok(sp.join() === '47,42,37', 'C.2: Cruise Missile Speed: 3 SAMs stop 47 / 42 / 37% of cruise missiles: ' + sp);
  // ships and fighters, no shield and Shield III
  const row = () => { ICBM(); const r = ['cm', 'bm', 'icbm_t'].map(k => Math.round(100*(1 - f('mslOdds')(-1, 0, q, k, PL).p))).join('/'); ICBM0(); return r; }, both = () => { S.nations[DE].tech.msl3 = 0; const a = row(); S.nations[DE].tech.msl3 = 3; const b = row(); S.nations[DE].tech.msl3 = 0; return a + ' then ' + b; };
  strip(q); f('addArmy')(DE, q, {frig:2}); const r1 = both(); strip(q); f('addArmy')(DE, q, {crui:2}); const r2 = both(); f('addArmy')(DE, q, {frig:2}); const r3 = both();
  strip(q); const base = city(DE, 'Berlin').id, wg = f('addArmy')(DE, base, {int:4}); wg.air = {base, cd:0}; wg.fly = {kind:'patrol', ph:'patrol', tgt:q, t:0, hrs:12}; const r4 = both(); wg.u.int = 0; f('removeEmpty')();
  PLAN2.ships = {frig2:r1, crui2:r2, crui2frig2:r3, fighters4:r4};
  ok(r1 === '5/0/0 then 24/2/0' && r2 === '47/10/0 then 84/37/1' && r3 === '47/26/0 then 84/68/1' && r4 === '26/0/0 then 61/0/0', 'C.2 ships and fighters: 2 Frigates 5/0/0 then 24/2/0; 2 Cruisers 47/10/0 then 84/37/1; both 47/26/0 then 84/68/1; 4 fighters 26% then 61%, nothing else: ' + JSON.stringify(PLAN2.ships)); }
// C.3 the worked examples: exact, and measured with the rules' own dice (mslDefend) over many seeded trials
{ fresh(); api.declareWar(PL, DE); const q = deLand(); strip(q); for (const v of G.P[q].nbs) strip(v); const nb = G.P[q].nbs.filter(v => !G.P[v].sea);
  let sid = 1e6; const mk = k => ({id:sid++, owner:PL, k, from:0, to:q, t:0.9, dt:0.2});
  // trials: n salvos of the missiles ks landing together; the number of each that gets through, and the HP of those that do
  const trial = (ks, n) => { const thr = ks.map(() => 0), hp = ks.map(() => new Map()); for (let i = 0; i < n; i++){ const L = ks.map(mk); S.inflight = L.slice(); f('mslDefend')(L);
      L.forEach((m, j) => { const h = f('mslHP')(m); if (h > 0){ thr[j]++; hp[j].set(h, (hp[j].get(h) || 0) + 1); } }); } S.inflight = []; return {thr:thr.map(v => v/n), hp}; };
  const exact = k => f('mslOdds')(-1, 0, q, k, PL).p, pc = v => Math.round(v*100), N1 = 4000;
  const sams = (t, n) => { strip(q); for (const v of nb) strip(v); f('addArmy')(DE, q, {sam:t}); if (n) f('addArmy')(DE, nb[0], {sam:n}); };
  // 1. a ballistic missile, 3 SAMs in the target and 2 next door: Long-Range SAM 68 / 53 / 38 / 24%; without it 80 / 68 / 55 / 40%
  const ex1 = {}; for (const lr of [1, 0]){ S.nations[DE].tech.sam_g2 = lr; sams(3, 2); ex1[lr ? 'lr' : 'no'] = [0, 1, 2, 3].map(l => { S.nations[DE].tech.msl3 = l; const t = trial(['bm'], N1); return [pc(exact('bm')), pc(t.thr[0])]; }); }
  S.nations[DE].tech.msl3 = 0; S.nations[DE].tech.sam_g2 = 1; sams(3, 2); const t1 = trial(['bm'], 20000), dx = f('mslDist')(f('mslShotList')(mk('bm'), null), 16), through = [...dx].filter(([h]) => h > 0).reduce((s0, [, v]) => s0 + v, 0);
  const share = h => pc((dx.get(h) || 0)/through), shareM = h => pc((t1.hp[0].get(h) || 0)/(t1.thr[0]*20000));
  PLAN2.ex1 = {...ex1, hpExact:[share(4), share(10), share(16)], hpMeasured:[shareM(4), shareM(10), shareM(16)], card:pc(exact('bm')), dice20000:+(t1.thr[0]*100).toFixed(1)};
  ok(ex1.lr.map(x => x[0]).join() === '68,53,38,24' && ex1.no.map(x => x[0]).join() === '80,68,55,40', 'C.3.1 exact: Long-Range SAM 68/53/38/24%, without 80/68/55/40%: ' + JSON.stringify(ex1));
  ok([...ex1.lr, ...ex1.no].every(([e, m]) => Math.abs(e - m) <= 3), 'C.3.1 measured over ' + N1 + ' trials each within 3 points of the exact sums');
  ok(share(4) === 45 && share(10) === 40 && share(16) === 16 && Math.abs(shareM(4) - 45) <= 2 && Math.abs(shareM(10) - 40) <= 2 && Math.abs(shareM(16) - 16) <= 2, `C.3.1: of those that get through, 45% HP 4/16, 40% HP 10/16, 16% unhurt (exact ${share(4)}/${share(10)}/${share(16)}, measured ${shareM(4)}/${shareM(10)}/${shareM(16)})`);
  ok(Math.abs(t1.thr[0]*100 - exact('bm')*100) <= 2, `E checks: the dice against the card's chance over 20,000 missiles agree within 2 points (card ${(exact('bm')*100).toFixed(1)}%, dice ${(t1.thr[0]*100).toFixed(1)}%)`);
  // 2. a cruise missile at the same city: 53 / 39 / 27 / 16%
  const ex2 = [0, 1, 2, 3].map(l => { S.nations[DE].tech.msl3 = l; return [pc(exact('cm')), pc(trial(['cm'], N1).thr[0])]; }); PLAN2.ex2 = ex2;
  ok(ex2.map(x => x[0]).join() === '53,39,27,16' && ex2.every(([e, m]) => Math.abs(e - m) <= 3), 'C.3.2 a cruise missile there: 53/39/27/16% (exact, measured): ' + JSON.stringify(ex2));
  // 3. salvos: 3 ballistic into 4 SAMs with Shield II: 2.5 of 3 get through, one alone 55%; 4 cruise into 3 SAMs, no shield: 3.5 of 4, one alone 53%
  S.nations[DE].tech.sam_g2 = 0; sams(4, 0); S.nations[DE].tech.msl3 = 2; const s3 = trial(['bm', 'bm', 'bm'], N1), avg3 = s3.thr.reduce((a, b) => a + b, 0), one3 = exact('bm');
  sams(3, 0); S.nations[DE].tech.msl3 = 0; const s4 = trial(['cm', 'cm', 'cm', 'cm'], N1), avg4 = s4.thr.reduce((a, b) => a + b, 0), one4 = exact('cm');
  PLAN2.ex3 = {bm3:+avg3.toFixed(2), bmAlone:pc(one3), cm4:+avg4.toFixed(2), cmAlone:pc(one4)};
  ok(Math.abs(avg3 - 2.5) <= 0.1 && pc(one3) === 55 && Math.abs(avg4 - 3.5) <= 0.1 && pc(one4) === 53, 'C.3.3 salvos: 3 ballistic into 4 SAMs (Shield II) 2.5 of 3 get through, one alone 55%; 4 cruise into 3 SAMs 3.5 of 4, one alone 53%: ' + JSON.stringify(PLAN2.ex3));
  // 4. a cheap missile cannot shield a nuke: an NBM and 2 cruise missiles on 6 SAMs with Shield II: the nuke 38% (it is shot at first, whatever the order of launch)
  sams(6, 0); S.nations[DE].tech.msl3 = 2; const s5 = trial(['cm', 'cm', 'nuc'], N1), nukeEx = exact('nuc'); PLAN2.ex4 = {nukeExact:pc(nukeEx), nukeMeasured:pc(s5.thr[2]), cruise:s5.thr.slice(0, 2).map(pc)};
  PLAN2.ex4.cruiseAlone = pc(exact('cm'));
  ok(pc(nukeEx) === 38 && Math.abs(s5.thr[2] - nukeEx) <= 0.03 && s5.thr[0] > exact('cm') + 0.1 && s5.thr[1] > exact('cm') + 0.1, 'C.3.4: the nuke is shot at first and gets through 38%, as if alone, though the two cruise missiles were launched before it; they only get the shots it leaves (each gets through more often than one alone): ' + JSON.stringify(PLAN2.ex4));
  { const L = [mk('cm'), mk('chem'), mk('bm'), mk('nuc'), mk('ccm'), mk('ncm')], o = []; X("globalThis.__mp = mslPools"); X('mslPools = (m, b, s) => { globalThis.__ord.push(m.k); return globalThis.__mp(m, b, s); }'); globalThis.__ord = o; S.inflight = L.slice(); f('mslDefend')(L); X('mslPools = globalThis.__mp'); S.inflight = [];
    ok(o.join() === 'nuc,ncm,chem,ccm,bm,cm', 'C.1 7: the salvo order: nuclear, then chemical, then plain; ballistic before cruise: ' + o); }
  // 5. the Nuclear ICBM (later; a test ICBM on its body): Shield III, 4 SAMs 4%; 4 SAMs and 2 next door with Long-Range SAM 16%; 6 SAMs and 2 Cruisers 32% (the 16-shot limit); no shield at most 7%
  ICBM(); const st = () => pc(1 - exact('icbm_t')); S.nations[DE].tech.msl3 = 3; sams(4, 0); const i1 = st(); S.nations[DE].tech.sam_g2 = 1; sams(4, 2); const i2 = st(); sams(6, 0); f('addArmy')(DE, q, {crui:2}); const i3 = st(); f('addArmy')(DE, q, {sam:6, crui:4}); const i4 = st();
  S.nations[DE].tech.msl3 = 0; const i5 = st(); const mi3 = pc(1 - (() => { sams(6, 0); f('addArmy')(DE, q, {crui:2}); S.nations[DE].tech.msl3 = 3; return trial(['icbm_t'], N1).thr[0]; })()); ICBM0();
  PLAN2.ex5 = {sam4:i1, sam4nb2:i2, sam6crui2:i3, more:i4, noShieldMax:i5, sam6crui2Measured:mi3};
  ok(i1 === 4 && i2 === 16 && i3 === 32 && i4 === 32 && i5 === 7 && Math.abs(mi3 - 32) <= 3, 'C.3.5 ICBM (its body): 4 / 16 / 32% (more defenders do not help: 32%), no shield 7%; measured 6 SAMs + 2 Cruisers ' + mi3 + '%: ' + JSON.stringify(PLAN2.ex5));
  // 9: no defence is certain: the best possible 84 / 76%
  S.nations[DE].tech.msl3 = 3; sams(30, 0); f('addArmy')(DE, q, {crui:10}); ok(pc(1 - exact('cm')) === 84 && pc(1 - exact('bm')) === 76, 'C.1 9: the best possible defence stops 84% of cruise and 76% of ballistic missiles, never all'); }
{ // C.1 2: the defence fires in the last hour; the HP shows for that hour; at 0 HP it falls; the messages (C.4)
  fresh(); rich(PL); grant(PL, 'msl1', 'msl2'); api.declareWar(PL, DE); const w = siloAt(PL, 'Warsaw', 1), M = f('mstock')(w); M.bm = 2; M.cm = 2;
  const tg = G.P.filter(P => !P.sea && !P.city && S.owner[P.id] === DE && f('hexDist')(G.P[w].cc, P.cc) <= 16).map(P => P.id)[0]; strip(tg); for (const v of G.P[tg].nbs) strip(v); const g = f('addArmy')(DE, tg, {inf:6, sam:3}), h0 = hp(g);
  let hits = []; R.IM.on('mslHit', e => hits.push(e)); const sure = () => X('rng = () => 0.01'), back = () => X('rng = globalThis.__rng0');   // (sure: every shot hits, for the hour of the defence)
  ok(api.launchMissile(PL, w, tg, 'bm'), 'a ballistic missile at 3 SAMs'); const m = S.inflight[S.inflight.length - 1]; hours(2); ok(!m.def && m.hp == null, 'two hours in: not fired at yet');
  sure(); hours(1); back(); ok(m.def && m.hp === 0 && !S.inflight.includes(m) && log(PL).some(t => /Your Ballistic Missile was shot down over/.test(t)) && log(DE).some(t => /Air defences shot down an enemy Ballistic Missile over/.test(t)), 'the last hour: the defence fires (3 hits of 6 HP): it falls; "Your Ballistic Missile was shot down over ..."');
  hours(2); ok(near(hp(g), h0, 1e-6), 'a missile shot down does no damage');
  hits = []; strip(tg); const g2 = f('addArmy')(DE, tg, {inf:6, sam:1}), h2 = hp(g2); api.launchMissile(PL, w, tg, 'bm'); const m2 = S.inflight[S.inflight.length - 1]; hours(2); sure(); hours(1); back();
  ok(m2.hp === 4 && S.inflight.includes(m2) && hits.length === 1 && hits[0].dmg === 12 && log(DE).some(t => /Air defences hit an enemy Ballistic Missile over .*: HP 4\/16\./.test(t)) && log(PL).some(t => /HP 4\/16/.test(t)), 'one SAM, both shots hit: HP 4/16 for its last hour ("Air defences hit an enemy Ballistic Missile over ...: HP 4/16."), the rules\' mslHit event');
  hours(1); ok(!S.inflight.includes(m2) && hp(g2) < h2, 'C.1 8: it lands the next hour and does its full damage');
  // the save keeps hp and def; a missile with neither starts full and is fired at on arrival
  const m3 = {id:S.nid++, owner:PL, k:'cm', from:w, to:tg, t:0.99, dt:0.5}; S.inflight.push(m3); sure(); hours(1); back(); ok(!S.inflight.includes(m3) && m3.def && m3.hp === 0, 'a missile reaching its target before the defence fired (no def saved): the defence fires right then'); }
{ // the computer: defends (SAMs at its capital and silo cities, the Anti-Missile Shield), the 35% rule and salvos, the silo nearest its main enemy, NCM in a Silo I
  fresh([]); rich(DE); grant(DE, 'msl1', 'msl2'); grant(PL, 'msl1', 'msl2'); api.declareWar(PL, DE); const cap = S.nations[DE].capital;
  ok(f('aiMslThreat')(DE) === 0, 'no enemy missile in reach: no threat');
  const pw = city(PL, 'Warsaw').id; S.bld[pw].silo = 1; f('mstock')(pw).bm = 1; const dd = f('hexDist')(G.P[pw].cc, G.P[cap].cc);
  ok(f('aiMslThreat')(DE) === (dd <= 26 ? 1 : 0), `a Polish ballistic missile ${Math.round(dd*180)} km from Berlin: threat ${f('aiMslThreat')(DE)}`);
  S.nations[DE].mslAt = S.hour; ok(f('aiMslThreat')(DE) >= 2 && f('AI_SAM_WANT')[f('aiMslThreat')(DE)] >= 3, 'fired at within 7 days: threat 2, it wants 3 SAMs');
  S.bld[cap].fac = 3; S.queue[cap] = []; const s0 = f('aiSamsAt')(DE, cap); for (let d = 0; d < 5; d++){ S.nations[DE].mslAt = S.hour; rich(DE); hours(24); } const s1 = f('aiSamsAt')(DE, cap);
  ok(s1 > s0 && s1 >= 2, `it builds Mobile SAMs at its capital (${s0} -> ${s1} standing or training there after 5 days)`);
  const rw = (() => { let k = 0; for (let i = 0; i < 200; i++){ const N = S.nations[DE]; N.research = null; N.research2 = null; N.rPick = null; rich(DE); S.hour = Math.max(S.hour, 22*24); S.nations[DE].mslAt = S.hour; f('aiResearch')(DE); if ([N.research, N.research2].some(r => r && r.id === 'msl3')) k++; } return k; })();
  ok(rw >= 15, `...and researches the Anti-Missile Shield (${rw} picks in 200 under threat)`);
  // the 35% rule: a lone cruise missile not at a target with 3 SAMs (47% to stop it); two or three of them in a salvo
  fresh([PL]); grant(DE, 'msl1'); f('rGrant')(S.nations[PL], 'msl3', 2); api.declareWar(PL, DE); const ds = S.nations[DE].capital; S.bld[ds].silo = 1; const sc = f('mstock')(ds); sc.cm = 1;
  for (const P of G.P) if (S.owner[P.id] === PL) strip(P.id);
  const tq = G.P.filter(P => !P.sea && S.owner[P.id] === PL && f('hexDist')(G.P[ds].cc, P.cc) <= 16).sort((a, b) => f('hexDist')(G.P[ds].cc, a.cc) - f('hexDist')(G.P[ds].cc, b.cc))[0]; if (tq){ f('addArmy')(PL, tq.id, {inf:12, tank:6, sam:4}); (S.reveal || (S.reveal = {}))[tq.id] = S.hour + 48; X('visCache = null');   // (in its sight: the computer counts only the defences it sees)
    const od = f('mslOdds')(DE, ds, tq.id, 'cm').p; f('aiMissiles')(DE); ok(od < 0.35 && sc.cm === 1, `E: a lone cruise missile is not fired where it gets through ${Math.round(od*100)}% (4 SAMs it sees, Shield II; under 35%)`);
    sc.cm = 3; f('aiMissiles')(DE); ok(sc.cm === 0 && S.inflight.filter(m => m.owner === DE && m.to === tq.id).length === 3, 'E: ...it fires a salvo of 3 at the defended target instead');
    S.inflight = []; strip(tq.id); f('addArmy')(PL, tq.id, {inf:12, tank:6}); sc.cm = 2; f('aiMissiles')(DE); ok(S.inflight.filter(m => m.owner === DE).length === 1 && sc.cm === 1, 'E: an undefended target: one missile is enough'); }
  // the silo nearest its main enemy
  fresh([]); grant(DE, 'msl1', 'msl2'); const pc0 = S.nations[PL].capital; ok(f('aiSiloSite')(DE) === S.nations[DE].capital, 'at peace its silo goes to its capital');
  api.declareWar(PL, DE); const site = f('aiSiloSite')(DE), exp = G.P.filter(P => P.city && S.owner[P.id] === DE && f('canBuildHere')(P.id, 'silo')).sort((a, b) => f('hexDist')(a.cc, G.P[pc0].cc) - f('hexDist')(b.cc, G.P[pc0].cc))[0].id;
  ok(site === exp, `E: at war its silo goes to its city nearest its main enemy's capital (${G.P[site].cityName}; capital ${G.P[S.nations[DE].capital].cityName})`);
  // a Nuclear Cruise Missile in a Silo I, a Nuclear Ballistic Missile in a Silo II
  fresh([]); rich(DE); grant(DE, 'msl1', 'msl2', 'bm_pow', 'msl_nuc'); api.declareWar(PL, DE); const c4 = S.nations[DE].capital; S.bld[c4].silo = 1; S.queue[c4] = []; f('aiWmdBuild')(DE, c4, S.nations[DE]);
  ok(S.queue[c4].length === 1 && S.queue[c4][0].t === 'ncm', 'E: at war in a Silo I it builds a Nuclear Cruise Missile');
  S.bld[c4].silo = 2; f('aiWmdBuild')(DE, c4, S.nations[DE]); ok(S.queue[c4].length === 1, '...one nuclear missile in all, of either kind');
  S.queue[c4] = []; f('aiWmdBuild')(DE, c4, S.nations[DE]); ok(S.queue[c4][0] && S.queue[c4][0].t === 'nuc', '...in a Silo II, a Nuclear Ballistic Missile'); }
console.log('PLAN 2 measured:', JSON.stringify(PLAN2));

// ---- 10. an old save (master 0fb9d76: a silo built with Cruise Missiles only, stocks {cm, bm})
{ const fx = path.join(__dirname, 'fixtures', 'missiles-oldsave.json');
  if (!fs.existsSync(fx)) ok(false, 'the old-save fixture is missing: ' + fx);
  else { const sv = JSON.parse(fs.readFileSync(fx, 'utf8')); const okR = api.restore(sv); S = R.S; G = R.G; ok(okR, 'the old save loads');
    const sp = Object.keys(S.mstock).map(Number).find(p => S.bld[p].silo > 0); ok(sp != null && !('chem' in (sv.mstock[sp] || {})), 'it has a silo and a stock without chemical or nuclear entries');
    const n = S.owner[sp], cm0 = S.mstock[sp].cm; ok(!f('has')(n, 'msl2') && api.buildMissile(n, sp, 'cm'), 'its silo (Cruise Missiles only) builds cruise missiles');
    ok(f('mstock')(sp).chem === 0 && f('mstock')(sp).nuc === 0 && f('mstock')(sp).cm === cm0, 'its stock reads chem and nuc as 0, nothing lost');
    let err = null; try { hours(120); } catch (e){ err = e; } ok(!err, 'it plays 5 days: ' + (err && err.stack)); const out = api.saveJSON(); ok(out.length > 1000 && api.restore(JSON.parse(out)), 'it saves and loads again'); } }

// ---- 14. a v74 save (Dev Build v74, master ee7e438: .test/missiles-v74-make.js): its missiles in flight (no HP saved), stocks, waits and silos
// load and play on with MISSILES PLAN 2's rules, with no conversion step
{ const fx = path.join(__dirname, 'fixtures', 'missiles-v74-save.json');
  if (!fs.existsSync(fx)) ok(false, 'the v74 fixture is missing: ' + fx);
  else { const txt = fs.readFileSync(fx, 'utf8'), sv = JSON.parse(txt); X('mslDefend = globalThis.__md0; rng = globalThis.__rng0'); ok(api.restore(JSON.parse(txt)), 'the v74 save loads'); S = R.S; G = R.G;
    const pl = S.nations.findIndex(N => N.name === 'Poland'), w = G.P.find(P => P.cityName === 'Warsaw').id, s0 = sv.mstock[w], st = f('mstock')(w);
    ok(!('ccm' in s0) && !('ncm' in s0) && st.ccm === 0 && st.ncm === 0 && st.chem === s0.chem && st.nuc === s0.nuc && st.cm === s0.cm && st.bm === s0.bm && st.wo === pl, 'E: the stock: chem and nuc kept (now the Chemical and Nuclear Ballistic Missiles), the new kinds read 0: ' + JSON.stringify(st));
    ok(f('mslStored')(w, 'chem') === s0.chem && f('mslStored')(w, 'nuc') === s0.nuc && MISSILES.chem.name === 'Chemical Ballistic Missile' && MISSILES.nuc.name === 'Nuclear Ballistic Missile', '...stored and usable under their new names');
    const L0 = sv.inflight.map(m => m.id), inf0 = S.inflight.filter(m => L0.includes(m.id)); ok(inf0.length === 4 && inf0.every(m => m.hp == null && m.def == null && f('mslHP')(m) === f('MSL_CAR')[f('mslCar')(m.k)].hp), 'E: four missiles in flight with no HP saved: each starts with full HP');
    const clk = S.nations[pl].wmdT, h0 = S.hour; ok(clk.chem === sv.nations[pl].wmdT.chem && clk.nuc === sv.nations[pl].wmdT.nuc, 'E: the launch clocks are the Chemical and Nuclear Ballistic Missiles\' own');
    const de = S.nations.findIndex(N => N.name === 'Germany'), tq = G.P.filter(P => !P.sea && S.owner[P.id] === de && f('hexDist')(G.P[w].cc, P.cc) <= 26 && f('stationaryAt')(P.id).some(b => b.owner === de)).map(P => P.id)[0];
    const cc = f('missileCheck')(pl, w, tq, 'chem'); ok(h0 - clk.chem < 12 ? !cc.ok && /every 12 h/.test(cc.why) : cc.ok, 'the chemical wait from the save holds: ' + (cc.why || 'ok'));
    const ev = []; R.IM.on('fxMissile', e => { if (L0.includes(e.m.id)) ev.push([e.m.k, e.hit]); }); R.IM.on('mslGone', e => { if (L0.includes(e.m.id)) ev.push([e.m.k, 'gone']); });
    let err = null; try { hours(8); } catch (e){ err = e; } ok(!err, 'it plays on: ' + (err && err.stack));
    ok(!S.inflight.some(m => L0.includes(m.id)) && ev.length === 4, 'every missile in flight from the save landed, fell or self-destructed: ' + JSON.stringify(ev));
    hours(4); const ch2 = f('missileCheck')(pl, w, tq, 'chem'); ok(ch2.ok || !/every 12 h/.test(ch2.why), 'the chemical wait has passed: ' + (ch2.why || 'ok'));
    ok(f('mslWhy')(pl, w, 'ncm') === '' && f('mslWhy')(pl, w, 'ccm') === '', 'its silo builds the new kinds');
    try { hours(4*24 - 4); } catch (e){ err = e; } ok(!err, 'it plays 4 more days: ' + (err && err.stack));
    const out = api.saveJSON(); ok(out.length > 1000 && api.restore(JSON.parse(out)), 'it saves and loads again'); } }

console.log(`missiles: ${checks - errors.length} of ${checks} checks passed`);
if (errors.length){ for (const e of errors) console.log('FAIL ' + e); process.exit(1); }
console.log('OK');
