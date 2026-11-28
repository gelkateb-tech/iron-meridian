#!/usr/bin/env node
// Missiles (owner point 12; docs/MISSILES.md): the computer's use of chemical and nuclear missiles over whole games, and the auto-test scenarios.
// Plain Node, the rules files of ROOT (this checkout, or IM_ROOT=<folder> for another build), no browser.
//   node tools/missiles-check.js ai [days] [seed,seed]      the nations world, computer players only (default 60 days, seeds 12345,7,99): research,
//                                                          silos, missiles built and fired by kind, every chemical and nuclear launch with its
//                                                          reason (the doctrine of docs/MISSILES.md 10); exit 1 when a nation fires at its own land
//                                                          or outside the doctrine
//   node tools/missiles-check.js wars [days] [seed,seed]    the same with four wars started on day 2 between computer neighbours (Germany-Poland,
//                                                          Russia-Ukraine, India-Pakistan, Iran-Iraq; the computer never starts wars itself, DIP-1)
//   node tools/missiles-check.js --scenarios               missile cases with expected results (auto-test harness, run by tools/headless.js
//                                                          --scenarios): the silo needs Conventional Warhead, cruise missiles from an Army Base
//                                                          city (2 a city), chemical stock limits, cooldown, never at own land, the gas zone, the
//                                                          nuclear blast, self-destruct at peace, a captured city's stock. Exit 1 when one fails
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const RULES = FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
const load = () => new Function("'use strict';\n" + RULES + '\nreturn {IM, ev:s => eval(s), get S(){ return S; }, get G(){ return G; }};')();
const [MODE = 'ai', D0, SD] = process.argv.slice(2), DAYS = +(D0 || 60), SEEDS = (SD || '12345,7,99').split(',').map(Number);

if (process.argv.includes('--scenarios')){ const out = [], chk = (name, c, d) => out.push({name, ok:!!c, d});
  const R = load(), api = R.IM.api, X = s => R.ev(s); api.useScenario('world64'); const ALL = Array.from({length:68}, (_, i) => i);
  let S, G; const fresh = () => { api.newGame(2468, 0, ALL); S = R.S; G = R.G; S.started = true; };
  fresh(); const id = nm => S.nations.findIndex(N => N.name === nm), PL = id('Poland'), DE = id('Germany'), K = X('RES_K');
  const grant = (n, ...ids) => { for (const i of ids) X('rGrant')(S.nations[n], i, 1); }, rich = n => { const N = S.nations[n]; N.cash = 1e5; for (const k of ['oil', 'metal', 'iron', 'elec', 'rare']) N[k] = 1e5*K; };
  const strip = p => { for (const a of S.armies) if (a.at === p) for (const t in a.u){ a.u[t] = 0; a.w[t] = 0; } X('removeEmpty')(); };
  const deLand = () => G.P.find(P => !P.sea && !P.city && S.owner[P.id] === DE && P.nbs.some(v => S.owner[v] === DE)).id, war = G.P.find(P => P.city && P.cityName === 'Warsaw').id;
  // 1. the silo needs Conventional Warhead
  { rich(PL); S.nations[PL].tech = {}; grant(PL, 'msl1'); const a = api.build(PL, war, 'silo'); grant(PL, 'msl2'); S.cons[war] = null; const b = api.build(PL, war, 'silo');
    chk('the Missile Silo needs Conventional Warhead (Cruise Missiles alone: refused)', a === false && b === true, `with msl1 only ${a}, with msl2 ${b}`); }
  // 2. cruise missiles from an Army Base city, at most 2
  { fresh(); rich(PL); S.nations[PL].tech = {}; grant(PL, 'msl1'); const c = G.P.find(P => P.city && S.owner[P.id] === PL && P.id !== war).id; for (const k of ['silo', 'air', 'yard']) S.bld[c][k] = 0; S.bld[c].fac = 1; S.queue[c] = [];
    const r = [0, 1, 2].map(() => api.buildMissile(PL, c, 'cm')); chk('cruise missiles in an Army Base city with Cruise Missiles only, 2 at most', r.join() === 'true,true,false', `${r.join(', ')}: ${X('mslWhy')(PL, c, 'cm')}`); }
  // 3. chemical: Silo I, 2 a silo; cooldown 12 h; never at own land
  { fresh(); rich(PL); grant(PL, 'msl1', 'msl2', 'msl_chem'); S.bld[war].silo = 1; S.queue[war] = []; const r = [0, 1, 2].map(() => api.buildMissile(PL, war, 'chem'));
    chk('chemical missiles: 2 a silo, stored and building', r.join() === 'true,true,false', `${r.join(', ')}: ${X('mslWhy')(PL, war, 'chem')}`);
    api.declareWar(PL, DE); const M = X('mstock')(war); M.chem = 2; M.wo = PL; const q = deLand(); strip(q); X('addArmy')(DE, q, {inf:6});
    const own = G.P.find(P => !P.sea && S.owner[P.id] === PL && P.id !== war).id; X('addArmy')(DE, own, {inf:2}); const c3 = X('missileCheck')(PL, war, own, 'chem');
    const l1 = api.launchMissile(PL, war, q, 'chem'), c2 = X('missileCheck')(PL, war, q, 'chem');
    chk('one chemical launch every 12 h; never at your own land', l1 === true && !c2.ok && /12 h/.test(c2.why) && !c3.ok && /own land/.test(c3.why), `${c2.why} / ${c3.why}`); }
  // 4. the gas zone and the nuclear blast
  { fresh(); api.declareWar(PL, DE); X('mslDefend = () => {}'); const q = deLand(); strip(q); const a = X('addArmy')(DE, q, {inf:10}), mine = X('addArmy')(PL, q, {inf:2}), h0 = X('effHP')(a), m0 = X('effHP')(mine);
    X('missileImpact')({id:S.nid++, owner:PL, k:'chem', from:war, to:q, t:1, dt:1}); const z = S.haz && S.haz[q], h1 = X('effHP')(a); S.hour++; X('hazHour')(); const h2 = X('effHP')(a);
    chk('a chemical strike: blast, your own forces too, a 12 h gas zone, 2.5% an hour', z && z.k === 'gas' && z.until === S.hour - 1 + 12 && h1 < h0 && X('effHP')(mine) < m0 && Math.abs(h2 - h1*0.975) < 1e-6, `zone ${JSON.stringify(z)}, health ${h0} -> ${h1.toFixed(1)} -> ${h2.toFixed(1)}`);
    fresh(); api.declareWar(PL, DE); const p2 = deLand(); strip(p2); const b = X('addArmy')(DE, p2, {inf:10}), hb = X('effHP')(b); X('missileImpact')({id:S.nid++, owner:PL, k:'nuc', from:war, to:p2, t:1, dt:1});
    const hb1 = X('effHP')(b); chk('a nuclear strike: half the health, radiation 48 h', Math.abs(hb1 - hb*0.5) < 0.6 && S.haz[p2].k === 'rad' && S.haz[p2].until === S.hour + 48, `health ${hb} -> ${hb1}`); }
  // 5. self-destruct at peace; a captured city's chemical stock
  { fresh(); X('mslDefend = () => {}'); rich(PL); grant(PL, 'msl1', 'msl2', 'msl_chem'); api.declareWar(PL, DE); S.bld[war].silo = 1; const M = X('mstock')(war); M.chem = 1; M.wo = PL; M.bm = 1; const q = deLand(); strip(q); const a = X('addArmy')(DE, q, {inf:6}), h0 = X('effHP')(a);
    api.launchMissile(PL, war, q, 'chem'); api.applyDeal(PL, DE, 'peace'); for (let h = 0; h < 12; h++) api.tick();
    chk('peace made while a chemical missile flies: it self-destructs', X('effHP')(a) === h0 && !(S.haz && S.haz[q]), `health ${h0} -> ${X('effHP')(a)}`);
    M.chem = 1; M.wo = PL; api.declareWar(DE, PL); strip(war); X('capture')(war, DE); api.tick();
    chk('a captured city: its chemical stock is destroyed, its ballistic stock passes (Q19)', M.chem === 0 && X('mslStored')(war, 'bm') === 1, JSON.stringify(M)); }
  console.log('MISSILE SCENARIOS (nations world, every nation a seat that gives no orders)');
  for (const c of out) console.log(`  ${c.ok ? 'PASS' : 'FAIL'}  ${c.name}   [${c.d}]`);
  const nb = out.filter(c => !c.ok).length; console.log(nb ? `MISSILE SCENARIOS FAILED: ${nb}` : `MISSILE SCENARIOS OK: ${out.length}`); process.exit(nb ? 1 : 0); }

// ---- ai / wars: whole games, the computer on every nation. Counted too (MISSILES PLAN 2): the nations that built a missile and that fired one,
// missiles built by kind, missiles shot down (the rules' fxMissile event with hit false), silos standing at the end; works on an older build too
// (IM_ROOT=<folder>: the kinds are read from its MISSILES)
function game(seed, days, wars){ const R = load(), api = R.IM.api, X = s => R.ev(s); api.useScenario('world64'); api.newGame(seed, 0, []); const S = R.S, G = R.G; S.started = true;
  const id = nm => S.nations.findIndex(N => N.name === nm), pairs = [['Germany', 'Poland'], ['Russia', 'Ukraine'], ['India', 'Pakistan'], ['Iran', 'Iraq']];
  const MS = X('MISSILES'), KS = Object.keys(MS), wmdOf = k => MS[k].wmd || (k === 'chem' || k === 'nuc' ? k : null);
  const fired = {}, built = {}, down = {}; for (const k of KS){ fired[k] = 0; built[k] = 0; down[k] = 0; } const bad = [], wmd = [], nBuilt = new Set(), nFired = new Set();
  R.IM.on('fxMissile', E => { if (E && E.hit === false && E.m) down[E.m.k] = (down[E.m.k] || 0) + 1; });
  // every launch: kind, from, to, and the doctrine's reason (read before the launch changes anything)
  const L0 = X('launchMissile'); X('globalThis.__L = launchMissile');
  R.ev(`launchMissile = function(n, from, to, k){ const pre = globalThis.__wmdOf(k) ? globalThis.__why(n, from, to, k) : null; const r = globalThis.__L(n, from, to, k); if (r) globalThis.__fired(n, from, to, k, pre); return r; }`);
  globalThis.__wmdOf = wmdOf;
  globalThis.__why = (n, from, to, k) => { const own = S.owner[to] === n; let why = '';
    if (wmdOf(k) === 'chem'){ const e = X('aiFoeMass')(n, 6).get(to); why = e ? `${e.u} enemy units, power ${Math.round(e.pw)}${e.own ? ', OWN FORCES THERE' : ''}` : 'NO ENEMY MASS';
      const ans = (S.wmd || []).some(e2 => S.hour - e2.h <= 168 && e2.by !== n && wmdOf(e2.k) === 'chem' && (e2.on === n || (e2.on >= 0 && X('rel')(n, e2.on).st === 'ally')));
      if (!e || e.own || (ans ? e.u < 4 || e.pw < 40 : e.u < 8 || e.pw < 80)) bad.push(`chemical outside the doctrine: ${why}`); }
    else { const ans = (S.wmd || []).some(e => S.hour - e.h <= 168 && e.by !== n && (e.on === n || (e.on >= 0 && X('rel')(n, e.on).st === 'ally'))); why = ans ? 'answer to a strike' : 'desperate'; }
    if (own) bad.push(`${S.nations[n].name} fired a ${k} missile at its own land`); return why; };
  globalThis.__fired = (n, from, to, k, why) => { fired[k]++; nFired.add(n); if (why != null) wmd.push(`day ${Math.floor(S.hour/24) + 1}: ${S.nations[n].name} ${k} at ${G.P[to].cityName || G.P[to].name} (${S.owner[to] >= 0 ? S.nations[S.owner[to]].name : 'independent'}): ${why}`); };
  const B0 = X('buildMissile'); X('globalThis.__B = buildMissile'); globalThis.__built = (n, k) => { built[k]++; nBuilt.add(n); };
  R.ev(`buildMissile = function(n, p, k){ const r = globalThis.__B(n, p, k); if (r) globalThis.__built(n, k); return r; }`); void L0; void B0;
  const snap = {};
  for (let d = 1; d <= days && !S.over; d++){ if (wars && d === 2) for (const [a, b] of pairs) if (id(a) >= 0 && id(b) >= 0) api.declareWar(id(a), id(b));
    for (let h = 0; h < 24; h++) api.tick();
    if (d === 20 || d === 40 || d === days){ const has = t => S.nations.filter(N => N.alive && X('has')(N.id, t)).length; snap['day' + d] = {msl1:has('msl1'), msl2:has('msl2'), chemW:has('msl_chem'), nucW:has('msl_nuc'), shield:has('msl3'), cbrn:has('cbrn'), silos:G.P.filter(P => S.bld[P.id].silo > 0).length, silo2:G.P.filter(P => S.bld[P.id].silo >= 2).length, wars:Object.values(S.rel).filter(r => r.st === 'war').length}; } }
  const silos = G.P.filter(P => S.bld[P.id].silo > 0).length;
  return {seed, days, wars:!!wars, nationsBuilt:nBuilt.size, nationsFired:nFired.size, built, fired, down, silos, research:snap, wmd, bad}; }
let fail = 0;
for (const seed of SEEDS){ const t0 = Date.now(), r = game(seed, DAYS, MODE === 'wars'); r.s = Math.round((Date.now() - t0)/1000); console.log(JSON.stringify(r)); if (r.bad.length) fail++; }
process.exit(fail ? 1 : 0);
