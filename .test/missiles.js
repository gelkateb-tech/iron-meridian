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
// building and firing rules (scripted); 10 an old save of master 0fb9d76 (silo with Cruise Missiles only, stocks {cm, bm}) loads and plays 5 days.
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
X('globalThis.__rng0 = rng; globalThis.__ic0 = interceptChance');
const fresh = (seats = ALL, seed = 12345) => { X('rng = globalThis.__rng0; interceptChance = globalThis.__ic0'); api.newGame(seed, 0, seats); S = R.S; G = R.G; S.started = true; return S; };
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

// ---- 1. the numbers
{ const C = MISSILES.chem, N = MISSILES.nuc;
  ok(C.cost === 170 && C.oil === 20*K && C.metal === 24*K && C.iron === 10*K && C.elec === 16*K && C.rare === 12*K && C.build === 84 && C.range === 70 && C.speed === 18 && C.power === 9 && C.minH === 4 && C.pk === 0.05 && C.silo === 1 && C.land, 'chemical missile: $170M, 20/24/10/16/12, 84 h, 70 hexes, speed 18, power 9, 4 h, 5%, Silo I, land only');
  ok(N.cost === 400 && N.oil === 30*K && N.metal === 40*K && N.iron === 16*K && N.elec === 30*K && N.rare === 30*K && N.build === 120 && N.range === 90 && N.speed === 22 && N.minH === 6 && N.pk === 0.04 && N.silo === 2 && !N.land, 'nuclear missile: $400M, 30/40/16/30/30, 108 h at Silo II, 90 hexes, speed 22, 6 h, 4%, Silo II');
  ok(MISSILES.cm.minH === 2 && MISSILES.cm.pk === 0.12 && MISSILES.bm.minH === 4 && MISSILES.bm.pk === 0.05 && MISSILES.cm.silo === 0 && MISSILES.bm.silo === 1, 'cruise and ballistic as before (2 h / 12%, 4 h / 5%)');
  ok(W.chem.perSilo === 2 && W.chem.perNation === 6 && W.chem.cd === 12 && W.chem.zone === 12 && W.chem.zoneLong === 18 && W.chem.rate === 0.025 && W.chem.fight === 0.8 && W.chem.civ === 40 && W.chem.civRural === 20 && W.chem.pop === 0.04, 'chemical limits 2 / 6, 12 h, gas 12 h (18), 2.5%, x0.8, war damage 40 (20), people 4%');
  ok(W.nuc.perSilo === 1 && W.nuc.perNation === 3 && W.nuc.cd === 24 && W.nuc.zone === 48 && W.nuc.rate === 0.02 && W.nuc.fight === 0.9 && W.nuc.soft === 0.5 && W.nuc.hard === 0.4 && W.nuc.nbSoft === 0.12 && W.nuc.nbHard === 0.08 && W.nuc.bunker === 0.5 && W.nuc.ko === 48 && W.nuc.hits === 2 && W.nuc.links === 96 && W.nuc.out === 0.5 && W.nuc.civ === 60 && W.nuc.pop === 0.12 && W.nuc.nbCiv === 20 && W.nuc.nbPop === 0.02, 'nuclear limits 1 / 3, 24 h, 50% / 40%, 12% / 8%, Bunker half, 48 h, 2 hits, 96 h, output half, war damage 60 / 20, people 12% / 2%');
  ok(W.chem.mem.join() === '-30,-15,-8' && W.nuc.mem.join() === '-60,-35,-15' && W.nuc.fallout === -40 && W.chem.mark.v === -25 && W.chem.mark.days === 50 && W.nuc.mark.v === -55 && W.nuc.mark.days === 60 && W.nuc.noPeace === 72, 'diplomacy numbers: -30/-15/-8, -60/-35/-15, fallout -40, marks -25 50 d, -55 60 d, no peace 72 h');
  const nd = (i, day, cash, metal, rare, days, req) => { const n = RN[i], c = n && n.lv[0].c; return !!n && n.lv[0].day === day && c.cash === cash && c.metal === metal*K && c.rare === rare*K && c.days === days && JSON.stringify(n.req) === JSON.stringify(req); };
  ok(nd('msl_chem', 10, 183, 40, 55, 7, ['msl2']) && RN.msl_chem.name === 'Chemical Warhead' && RN.msl_chem.line === 'Chemical Missile', 'Chemical Warhead: day 10, $183M, 40 mat, 55 rare, 7 days, needs Conventional Warhead');
  ok(nd('chem_long', 16, 130, 45, 30, 5, ['msl_chem']) && RN.chem_long.name === 'Persistent Agent', 'Persistent Agent: day 16, $130M, 45, 30, 5 days');
  ok(nd('msl_nuc', 20, 390, 90, 112, 10, ['bm_pow']) && RN.msl_nuc.name === 'Nuclear Warhead' && RN.msl_nuc.line === 'Nuclear Missile', 'Nuclear Warhead: day 20, $390M, 90 mat, 112 rare, 10 days, needs Heavier Warhead');
  ok(nd('cbrn', 9, 110, 40, 30, 5, []) && RN.cbrn.cat === 'cmd' && RN.cbrn.lv.length === 2 && RN.cbrn.lv[1].day === 17 && RN.cbrn.lv[1].c.cash === 160 && RN.cbrn.lv[1].c.metal === 60*K && RN.cbrn.lv[1].c.rare === 45*K && RN.cbrn.lv[1].c.days === 6, 'CBRN Defence 1/2: day 9 / 17, $110M 40 30 5 d / $160M 60 45 6 d, Command & Logistics');
  ok(RN.msl2.name === 'Conventional Warhead' && RN.msl1.lv[0].day === 1 && RN.msl1.lv[0].c.days === 6 && RN.msl2.lv[0].day === 6 && RN.msl2.lv[0].c.days === 8, 'msl2 renamed Conventional Warhead; Cruise Missiles day 1, 6 days; Conventional Warhead day 6, 8 days');
  ok(JSON.stringify(f('CBRN_F')) === '[1,0.5,0.25]' && JSON.stringify(f('CBRN_POP')) === '[1,0.75,0.5]', 'CBRN Defence: forces 50% / 75% less, people a quarter / half fewer'); }

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
  const ind = G.P.find(P => !P.sea && S.owner[P.id] < 0 && f('hexDist')(G.P[w].cc, P.cc) < 60); if (ind){ strip(ind.id); const ci = f('missileCheck')(PL, w, ind.id, 'chem'); ok(!ci.ok && /Independent/.test(ci.why), 'independent land only where enemies stand: ' + ci.why); }
  const peace = G.P.find(P => !P.sea && S.owner[P.id] === CZ).id; ok(!f('missileCheck')(PL, w, peace, 'chem').ok, 'not at a nation you are at peace with');
  const ch = f('missileCheck')(PL, w, q, 'chem'), nh = f('missileCheck')(PL, w, q, 'nuc'); ok(ch.ok && ch.hours === Math.max(4, Math.ceil(ch.d/18)) && ch.hours >= 4, `chemical flight at least 4 h (${ch.hours} h for ${ch.d} hexes)`); ok(nh.ok && nh.hours === Math.max(6, Math.ceil(nh.d/22)) && nh.hours >= 6, `nuclear flight at least 6 h (${nh.hours} h)`);
  ok(f('mslOf')(PL, 'chem').range === 70 && f('mslOf')(PL, 'nuc').range === 90 && (grant(PL, 'bm_rng'), f('mslOf')(PL, 'chem').range === 82 && f('mslOf')(PL, 'nuc').range === 102), 'ranges 70 / 90, +12 with Ballistic Missile Range');
  ok(api.launchMissile(PL, w, q, 'chem') && M.chem === 1 && S.nations[PL].wmdT.chem === S.hour, 'a chemical launch: stock down, the hour recorded');
  const cd = f('missileCheck')(PL, w, q, 'chem'); ok(!cd.ok && /every 12 h/.test(cd.why), 'one chemical launch every 12 h: ' + cd.why); ok(f('missileCheck')(PL, w, q, 'nuc').ok, 'the cooldowns are per kind');
  hours(12); ok(f('missileCheck')(PL, w, q, 'chem').ok, 'again after 12 h');
  ok(api.launchMissile(PL, w, q, 'nuc'), 'a nuclear launch'); M.nuc = 1; const cn = f('missileCheck')(PL, w, q, 'nuc'); ok(!cn.ok && /every 24 h/.test(cn.why), 'one nuclear launch every 24 h: ' + cn.why); hours(23); ok(!f('missileCheck')(PL, w, q, 'nuc').ok, 'not after 23 h'); hours(1); ok(f('missileCheck')(PL, w, q, 'nuc').ok, 'after 24 h');
  // interception: 5% / 4% a SAM-equivalent, the Anti-Missile Shield on top
  const t2 = deLand(); const sam = f('addArmy')(DE, q, {sam:6}); const m = k => ({owner:PL, k, to:q, from:w});
  const ic = k => f('interceptChance')(m(k)); ok(near(ic('chem'), 1 - Math.pow(0.95, 6), 1e-9) && near(ic('nuc'), 1 - Math.pow(0.96, 6), 1e-9) && near(ic('cm'), 1 - Math.pow(0.88, 6), 1e-9) && near(ic('bm'), 1 - Math.pow(0.95, 6), 1e-9), 'interception per SAM: chemical 5%, nuclear 4% (cruise 12%, ballistic 5%)');
  grant(DE, 'msl3'); f('rGrant')(S.nations[DE], 'msl3', 3); ok(near(ic('nuc'), 1 - Math.pow(0.96, 18), 1e-9), 'Anti-Missile Shield 3: six SAMs count as 18 (52%)'); void t2; void sam; }

// ---- 5. the chemical strike
const strike = (k, from, to, n = PL) => { f('missileImpact')({id:S.nid++, owner:n, k, from, to, t:1, dt:1, vic:f('wmdVictim')(n, to)}); };
{ fresh(); grant(PL, 'msl_chem'); api.declareWar(PL, DE); X('interceptChance = () => 0');
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
    for (const k of ['chem12', 'chem4', 'nuc', 'nuc48', 'next']){ fresh(); X('rng = () => 0.5'); X('interceptChance = () => 0'); api.declareWar(PL, DE); const q = deLand(), w = city(PL, 'Warsaw').id;
      const at = k === 'next' ? G.P[q].nbs.find(v => !G.P[v].sea) : q; strip(q); strip(at); const a = f('addArmy')(DE, at, {...u}); const h0 = hp(a);
      strike(k.startsWith('chem') ? 'chem' : 'nuc', w, q); const hrs = {chem12:12, chem4:4, nuc48:48}[k] || 0; for (let h = 0; h < hrs; h++){ S.hour++; f('hazHour')(); }
      T[nm].push(Math.round(h0 - hp(a))); } }
  for (const nm in T){ const [c12, c4, nb, n48, nx] = T[nm], P = PLAN[nm];
    ok(Math.abs(nb - P[2]) <= Math.max(1, 0.1*P[2]) && Math.abs(n48 - P[3]) <= Math.max(1, 0.1*P[3]) && Math.abs(nx - P[4]) <= Math.max(1, 0.1*P[4]), `7.3 nuclear, ${nm}: blast ${nb}, 48 h ${n48}, next door ${nx} (plan ${P[2]}, ${P[3]}, ${P[4]}; within 10%)`);
    ok(Math.abs(c12 - P[0]) <= 0.15*P[0] && Math.abs(c4 - P[1]) <= 0.15*P[1], `7.3 chemical, ${nm}: 12 h ${c12}, out after 4 h ${c4} (plan ${P[0]}, ${P[1]}; within 15%: the blast is the ballistic missile's rule)`); }
  console.log('7.3 measured (damage: chemical 12 h, chemical 4 h, nuclear blast, nuclear 48 h, next door):', JSON.stringify(T));
  // the rest of the nuclear strike
  fresh(); X('interceptChance = () => 0'); api.declareWar(PL, DE); const w = city(PL, 'Warsaw').id;
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
  ok(near(f('popOf')(c), pop0*(1 - 0.12*(1 - red*0.5)), 1e-9) && near(f('popOf')(nb), popN*0.98, 1e-9), '12% of the people (the Bunker counting half), 2% next door');
  f('INCC').v = -1; X('INCC.v = -1'); ok(near(f('hazOut')(c), 0.5) && f('provYield')(c).cash < y0*0.6, 'output half while the radiation lasts');
  const i1 = hp(g); S.hour++; f('hazHour')(); ok(near(hp(g), i1*(1 - 0.02*47/48), 1e-6), 'radiation: 2% an hour falling to 0 over 48 h');
  ok(f('hazFight')(c) === 0.9, 'the battle factor in radiation: x0.9');
  ok(f('mem')(FR, PL) === memFR0, '(memory moves at launch, not at impact)'); }

// ---- 7. intercepted, at peace in flight, captured stock
{ fresh(); grant(PL, 'msl1', 'msl2', 'msl_chem', 'bm_pow', 'msl_nuc'); api.declareWar(PL, DE); const w = siloAt(PL, 'Warsaw', 2), M = f('mstock')(w); M.chem = 2; M.nuc = 1; M.wo = PL;
  const q = deLand(); strip(q); const a = f('addArmy')(DE, q, {inf:10}), h0 = hp(a);
  X('interceptChance = () => 1'); strike('chem', w, q); strike('nuc', w, q); ok(hp(a) === h0 && !(S.haz && S.haz[q]), 'intercepted: no blast, no gas, no radiation');
  X('interceptChance = () => 0'); api.launchMissile(PL, w, q, 'chem'); api.applyDeal(PL, DE, 'peace'); hours(10); ok(hp(a) === h0 && !(S.haz && S.haz[q]) && log(PL).some(t => /self-destructed/.test(t)), 'peace made in flight: it self-destructs');
  // the city changes hands: chemical and nuclear stock destroyed, cruise and ballistic stock passes to the captor (Q19)
  fresh(); grant(PL, 'msl1', 'msl2', 'msl_chem'); grant(DE, 'msl1', 'msl2'); api.declareWar(DE, PL); const kr = siloAt(PL, 'Warsaw', 1), st = f('mstock')(kr); st.chem = 2; st.wo = PL; st.cm = 2; st.bm = 1;
  strip(kr); f('capture')(kr, DE); hours(1);
  ok(st.chem === 0 && st.cm === 2 && st.bm === 1 && f('mslStored')(kr, 'bm') === 1 && f('mslStored')(kr, 'chem') === 0, 'a captured silo: its chemical stock is destroyed, its cruise and ballistic stock passes');
  ok(log(PL).some(t => /were destroyed/.test(t)) && log(DE).some(t => /none passes to you/.test(t)), 'both are told');
  const tg = G.P.filter(P => !P.sea && S.owner[P.id] === PL).sort((x, y) => f('hexDist')(G.P[kr].cc, x.cc) - f('hexDist')(G.P[kr].cc, y.cc))[0].id; ok(f('missileCheck')(DE, kr, tg, 'bm').ok, 'and the captor may fire it'); }

// ---- 8. diplomacy
{ fresh([PL, FR, DE, RU]); grant(PL, 'msl1', 'msl2', 'msl_chem', 'bm_pow', 'msl_nuc'); X('interceptChance = () => 0');
  api.declareWar(PL, DE); const w = siloAt(PL, 'Warsaw', 2), M = f('mstock')(w); M.chem = 1; M.nuc = 1; M.wo = PL; const q = deLand(); strip(q); f('addArmy')(DE, q, {inf:10});
  const others = S.nations.filter(N => N.alive && N.id !== PL && N.id !== DE).map(N => N.id); const atWarDE = others.find(o => o !== RU); f('setRel')(atWarDE, DE, 'war', null, atWarDE);
  const m0 = new Map(S.nations.map(N => [N.id, f('mem')(N.id, PL)])), op0 = f('opinion')(IT, PL);
  api.launchMissile(PL, w, q, 'chem');
  ok(f('mem')(DE, PL) - m0.get(DE) === -30, 'chemical: the victim -30');
  ok(f('mem')(IT, PL) - m0.get(IT) === -15 && f('mem')(atWarDE, PL) - m0.get(atWarDE) === -8, 'everyone else -15, -8 if at war with the victim');
  const part = f('opinionParts')(IT, PL).find(x => x[0] === 'Used chemical weapons'); ok(part && part[1] === -25, '"Used chemical weapons" -25 with everyone');
  ok(op0 - f('opinion')(IT, PL) === 40, 'a third nation thinks 40 less (memory -15, the mark -25)');
  // nuclear: allies join, a computer ally of the user leaves, fallout, every seat told
  fresh([PL, FR]); grant(PL, 'msl1', 'msl2', 'bm_pow', 'msl_nuc'); X('interceptChance = () => 0'); api.declareWar(PL, DE);
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
  fresh([PL]); grant(PL, 'msl1', 'msl2', 'bm_pow', 'msl_nuc'); X('interceptChance = () => 0'); api.declareWar(PL, DE);
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
  fresh([]); rich(DE); S.nations[DE].cash = 400; grant(DE, 'msl1', 'msl2', 'msl_chem'); const c3 = S.nations[DE].capital; S.bld[c3].silo = 1; S.queue[c3] = []; api.declareWar(PL, DE); f('aiWmdBuild')(DE, c3, S.nations[DE]); ok(!S.queue[c3].length, 'not with under $250M left ($400M - $170M)');
  // chemical use: a big enemy stack in an enemy-held province, none of its own there
  fresh([PL]); X('interceptChance = () => 0'); grant(DE, 'msl1', 'msl2', 'msl_chem'); api.declareWar(PL, DE); const ds = S.nations[DE].capital; S.bld[ds].silo = 1; const st = f('mstock')(ds); st.chem = 1; st.wo = DE;
  const pq = G.P.filter(P => !P.sea && S.owner[P.id] === PL && f('hexDist')(G.P[ds].cc, P.cc) <= 60 && P.id !== S.nations[PL].capital)[0].id; strip(pq);
  const small = f('addArmy')(PL, pq, {inf:5}); f('aiChem')(DE, ds); ok(st.chem === 1, 'no chemical missile at 5 units');
  small.u.inf = 12; small.u.tank = 6; f('aiChem')(DE, ds); ok(st.chem === 0 && S.inflight.some(m => m.k === 'chem' && m.to === pq && m.owner === DE), 'one at 18 units of power 80 or more');
  // forces on the move count (IMP-8): a column arriving within 6 hours
  fresh([PL]); X('interceptChance = () => 0'); grant(DE, 'msl1', 'msl2', 'msl_chem'); api.declareWar(PL, DE); const ds2 = S.nations[DE].capital; S.bld[ds2].silo = 1; const st2 = f('mstock')(ds2); st2.chem = 1; st2.wo = DE;
  const pq2 = G.P.filter(P => !P.sea && S.owner[P.id] === PL && f('hexDist')(G.P[ds2].cc, P.cc) <= 60 && P.nbs.some(v => S.owner[v] === PL && !G.P[v].sea))[0], from = pq2.nbs.find(v => S.owner[v] === PL && !G.P[v].sea); strip(pq2.id); strip(from);
  const col = f('addArmy')(PL, from, {inf:12, tank:6}); col.to = pq2.id; col.t = 0.9; f('aiChem')(DE, ds2); ok(st2.chem === 0, 'a column arriving within 6 hours counts');
  // its own forces there: no
  fresh([PL]); grant(DE, 'msl1', 'msl2', 'msl_chem'); api.declareWar(PL, DE); const ds3 = S.nations[DE].capital; S.bld[ds3].silo = 1; const st3 = f('mstock')(ds3); st3.chem = 1; st3.wo = DE;
  const pq3 = G.P.filter(P => !P.sea && S.owner[P.id] === PL && f('hexDist')(G.P[ds3].cc, P.cc) <= 60)[0].id; strip(pq3); f('addArmy')(PL, pq3, {inf:12, tank:6}); f('addArmy')(DE, pq3, {inf:1}); f('aiChem')(DE, ds3); ok(st3.chem === 1, 'not where its own forces stand');
  // nuclear: not without a reason; in answer to a chemical strike on itself
  fresh([PL]); X('interceptChance = () => 0'); grant(DE, 'msl1', 'msl2', 'bm_pow', 'msl_nuc'); api.declareWar(PL, DE); const dn = S.nations[DE].capital; S.bld[dn].silo = 2; const sn = f('mstock')(dn); sn.nuc = 1; sn.wo = DE;
  const pn = G.P.filter(P => !P.sea && S.owner[P.id] === PL && f('hexDist')(G.P[dn].cc, P.cc) <= 80 && P.nbs.every(v => !S.armies.some(a => a.owner === DE && a.at === v)))[0].id; strip(pn); f('addArmy')(PL, pn, {inf:20});
  f('aiNuc')(DE, dn); ok(sn.nuc === 1, 'no nuclear missile without an answer to give or a desperate war');
  S.wmd = [{by:PL, on:DE, k:'chem', h:S.hour - 10, p:dn}]; f('aiNuc')(DE, dn); ok(sn.nuc === 0 && S.inflight.some(m => m.k === 'nuc' && m.owner === DE), 'in answer to a chemical strike on itself within 7 days');
  // research weights
  fresh([]); const w0 = f('aiWmdW')(PL); ok(w0.msl_chem === 0.3 && w0.msl_nuc === 0.15 && w0.chem_long === 0.2 && w0.cbrn === 0.2, 'research weights at peace: 0.3, 0.15, 0.2, 0.2');
  api.declareWar(RU, PL); const w1 = f('aiWmdW')(PL); ok(w1.msl_chem === (f('natPower')(RU) >= 1.3*f('natPower')(PL) ? 1 : 0.3), `Chemical Warhead 1 at war with an army 1.3 times its own (Russia ${Math.round(f('natPower')(RU))} against ${Math.round(f('natPower')(PL))}: ${w1.msl_chem})`);
  grant(RU, 'msl_chem', 'msl_nuc'); const w2 = f('aiWmdW')(PL); ok(w2.msl_nuc === 1 && w2.cbrn === 2, 'Nuclear Warhead 1 against a nuclear enemy, CBRN Defence 2 against one with Chemical Warhead');
  // walking out of a zone
  fresh([PL]); api.declareWar(PL, DE); const zq = deLand(); strip(zq); const za = f('addArmy')(DE, zq, {inf:4}); f('setHaz')(zq, 'gas', 12, PL); S.hour++; f('hazHour')(); ok(za.path.length && !f('hazAt')(za.path[0]), 'a computer force walks out of the gas');
  const pa = f('addArmy')(PL, city(PL, 'Warsaw').id, {inf:2}); f('setHaz')(city(PL, 'Warsaw').id, 'gas', 12, DE); S.hour++; f('hazHour')(); ok(!pa.path.length, 'a person\'s force stays where it was put'); }

// ---- 10. an old save (master 0fb9d76: a silo built with Cruise Missiles only, stocks {cm, bm})
{ const fx = path.join(__dirname, 'fixtures', 'missiles-oldsave.json');
  if (!fs.existsSync(fx)) ok(false, 'the old-save fixture is missing: ' + fx);
  else { const sv = JSON.parse(fs.readFileSync(fx, 'utf8')); const okR = api.restore(sv); S = R.S; G = R.G; ok(okR, 'the old save loads');
    const sp = Object.keys(S.mstock).map(Number).find(p => S.bld[p].silo > 0); ok(sp != null && !('chem' in (sv.mstock[sp] || {})), 'it has a silo and a stock without chemical or nuclear entries');
    const n = S.owner[sp], cm0 = S.mstock[sp].cm; ok(!f('has')(n, 'msl2') && api.buildMissile(n, sp, 'cm'), 'its silo (Cruise Missiles only) builds cruise missiles');
    ok(f('mstock')(sp).chem === 0 && f('mstock')(sp).nuc === 0 && f('mstock')(sp).cm === cm0, 'its stock reads chem and nuc as 0, nothing lost');
    let err = null; try { hours(120); } catch (e){ err = e; } ok(!err, 'it plays 5 days: ' + (err && err.stack)); const out = api.saveJSON(); ok(out.length > 1000 && api.restore(JSON.parse(out)), 'it saves and loads again'); } }

console.log(`missiles: ${checks - errors.length} of ${checks} checks passed`);
if (errors.length){ for (const e of errors) console.log('FAIL ' + e); process.exit(1); }
console.log('OK');
