// NAVAL CITIES (owner 2026-11-19: "a naval city icon ... that should let you know that you can build a naval base here and it should be the only
// place units can embark and disembark unless we have amphibious infantry units"), the rules in plain Node:
//  1. every coastal city is a naval city, and the Naval Yard's where:'port' rule matches naval cities exactly;
//  2. boarding only at a naval city of your own or a friend's (the reason shown elsewhere), Marines alone on any coast;
//  3. coming ashore only at a naval city: your own, a friend's, or an enemy's or independent one by an assault landing (45 minutes, the first-day
//     penalty); a route to other land over the sea lands at a naval city and marches on; Marines alone land on any coast; a stack that is no longer
//     Marines alone is planned again; the reason the page shows;
//  4. Marines: a unit of the Infantry Corps, unlocked by its research step, trained at an Army Base in a coastal city only;
//  5. old saves: troops at sea keep their landing orders and land where they were going; fixture saves load and play on;
//  6. the switch: NAVAL_CITIES false gives the old rules (landing anywhere, no Marines);
//  7. the AI (the nations world, 20 days): every landing at a naval city or by Marines alone, no ground force left idle at sea.
// node .test/naval-cities.js  (exit 1 on any failed check or error)
const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..');
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const BODY = FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
const RET = `\nreturn {IM, get S(){ return S; }, get G(){ return G; }, addArmy, setRel, count, tick, restore, saveJSON, orderMove, pathFor, portOk, navalCity, amphib, landOk,
  embarkWhy, NC_BOARD, NC_LAND, landH, embarkH, LAND_H, LAND_PORT_H, canBuildHere, canMobilize, mobBlock, rGrant, RN, UNITS, UT, BUILD, NAVAL_CITIES, ground, NEUTRAL, rLandF,
  armyName, INF_T, R_LINES, unitModel, atWar, friendly};`;
const SRC = "'use strict';\n" + BODY + RET, SRC_OFF = "'use strict';\n" + BODY.replace('const NAVAL_CITIES = true;', 'const NAVAL_CITIES = false;') + RET;
const errors = [], checks = {}, ok = (k, v, i) => { checks[k] = v ? 'PASS' : 'FAIL ' + JSON.stringify(i ?? null); };
const run = (k, f) => { try { f(); } catch (e){ errors.push(k + ': ' + e.stack.split('\n').slice(0, 3).join(' | ')); } };
function game(seats = [0], opt = {}){ const R = new Function(opt.off ? SRC_OFF : SRC)(); if (opt.nations) R.IM.api.useScenario('world64'); R.IM.api.newGame(opt.seed || 77, 0, seats); R.S.started = true; if (opt.clear !== false) R.S.armies.length = 0; return R; }
const zoneBy = (R, p) => R.G.P[p].nbs.find(v => R.G.P[v].sea);
const firstLand = (R, from, path) => { let u = from; for (const v of path){ if (R.G.P[u].sea && !R.G.P[v].sea) return v; u = v; } return -1; };

// 1. naval cities and the Naval Yard
run('naval', () => { const R = game([0], {nations:true}), G = R.G; let n = 0, bad = [], yard = [];
  for (const P of G.P){ const want = !P.sea && !!P.coast && !!P.city; if (R.navalCity(P.id) !== want) bad.push(P.id); if (want) n++;
    if (!P.sea && R.canBuildHere(P.id, 'yard') !== R.navalCity(P.id)) yard.push(P.cityName || P.name); }
  ok(`every coastal city is a naval city, and only those (${n} on the nations map)`, !bad.length && n > 300, {n, bad:bad.slice(0, 5)});
  ok('a Naval Yard can be built exactly at the naval cities (where:\'port\')', !yard.length && R.BUILD.yard.where === 'port', yard.slice(0, 5));
  const by = nm => G.P.find(P => P.cityName === nm);
  ok('Karachi and Hyderabad (Pakistan) are naval cities; Lahore is not', R.navalCity(by('Karachi').id) && R.navalCity(by('Hyderabad').id) && !R.navalCity(by('Lahore').id)); });

// 2. and 3. boarding and landing (the classic world, nation 0)
run('board-land', () => { const R = game([0]), S = R.S, G = R.G, n = 0;
  const ports = G.P.filter(P => R.navalCity(P.id) && S.owner[P.id] === n && zoneBy(R, P.id) != null), coasts = G.P.filter(P => !P.sea && P.coast && !P.city && S.owner[P.id] === n && zoneBy(R, P.id) != null);
  const P0 = ports[0], C0 = coasts[0]; ok('an own naval city and an own coast without one', !!P0 && !!C0); if (!P0 || !C0) return;
  // boarding
  { const a = R.addArmy(n, C0.id, {inf:3}), z = zoneBy(R, C0.id); R.orderMove(a, z);
    ok('boarding refused on a coast that is not a naval city, with the reason', !a.path.length && R.embarkWhy(a, z) === R.NC_BOARD && /naval city/.test(R.NC_BOARD), R.embarkWhy(a, z));
    const m = R.addArmy(n, C0.id, {mar:3}); R.orderMove(m, z); ok('Marines alone board there', m.path.length === 1 && R.embarkWhy(m, z) === '', m.path);
    const b = R.addArmy(n, P0.id, {inf:3}); R.orderMove(b, zoneBy(R, P0.id)); ok('boarding allowed at an own naval city', b.path.length === 1);
    for (const x of [a, m, b]) S.armies.splice(S.armies.indexOf(x), 1); }
  // landing on a plain coast: ordinary troops land at a naval city and march on; Marines go straight in
  { const z = zoneBy(R, C0.id), a = R.addArmy(n, z, {inf:3, tank:1}), m = R.addArmy(n, z, {mar:4}); R.orderMove(a, C0.id); R.orderMove(m, C0.id);
    const fl = firstLand(R, z, a.path);
    ok('troops sent to a plain coast come ashore at a naval city first, then march', a.path.length > 1 && fl >= 0 && R.navalCity(fl) && a.path[a.path.length - 1] === C0.id, {path:a.path, fl});
    ok('Marines alone land straight onto the beach', m.path.length === 1 && m.path[0] === C0.id && R.amphib(m) && !R.amphib(a), m.path);
    ok('the old rule (any coast) would land straight there', R.pathFor(a, z, C0.id, 'land').length === 1);
    // no naval city within reach: refused, with the landing reason (the whole map's naval cities closed off)
    const keep = G.P.map(P => P.city); for (const P of G.P) if (P.coast && P.id !== C0.id) P.city = false;
    const c = R.addArmy(n, z, {inf:2}); R.orderMove(c, C0.id);
    ok('no naval city to land at: refused, the reason names naval cities and Marines', !c.path.length && R.embarkWhy(c, C0.id) === R.NC_LAND && /Marines/.test(R.NC_LAND), R.embarkWhy(c, C0.id));
    G.P.forEach((P, i) => { P.city = keep[i]; }); R.IM.api && 0;
    // a Marine stack joined by infantry at sea: the beach landing is planned again through a naval city
    let arr = -1; m.u.inf = 2; for (let i = 0; i < 4; i++){ R.tick(); if (m.to !== null) break; }
    const fl2 = firstLand(R, m.to !== null && G.P[m.at].sea ? m.at : z, m.to !== null ? [m.to, ...m.path] : m.path);
    ok('a stack that is no longer Marines alone does not land on the beach', !R.amphib(m) && fl2 !== C0.id && (fl2 < 0 || R.navalCity(fl2)), {to:m.to, path:m.path, fl2});
    for (const x of [a, m, c]) if (S.armies.includes(x)) S.armies.splice(S.armies.indexOf(x), 1); }
  // assault landings: into an enemy naval city and an independent one, 45 minutes, the first-day penalty (every nation a seat: no garrison turns up)
  { const Re = game(R.S.nations.map((N, i) => i)), Se = Re.S, Ge = Re.G; const E = Ge.P.find(P => Re.navalCity(P.id) && Se.owner[P.id] >= 0 && Se.owner[P.id] !== n && zoneBy(Re, P.id) != null);
    const I = Ge.P.find(P => Re.navalCity(P.id) && Se.owner[P.id] === Re.NEUTRAL && zoneBy(Re, P.id) != null);
    ok('found an enemy and an independent naval city', !!E && !!I);
    for (const [T, nm] of [[E, 'enemy'], [I, 'independent']]){ if (!T) continue; if (Se.owner[T.id] >= 0) Re.setRel(n, Se.owner[T.id], 'war');
      const b = Re.addArmy(n, zoneBy(Re, T.id), {inf:4}), lh = Re.landH(b, T.id); Re.orderMove(b, T.id);
      ok(`assault landing into an ${nm} naval city: straight in`, b.path.length === 1 && b.path[0] === T.id, b.path);
      ok(`${nm}: 45 minutes (LAND_H)`, Math.abs(lh - Re.LAND_H) < 1e-9 && Re.LAND_H === 0.75, lh);
      for (let i = 0; i < 300 && b.at !== T.id; i++) Re.tick();
      ok(`${nm}: ashore, at the first-day penalty (${Re.rLandF(n)})`, b.at === T.id && b.landed != null && Re.rLandF(n) < 1, {at:b.at, landed:b.landed}); }
    // a force at sea next to a friendly-held but foreign naval city (no war, no right of way) may not land there
    const F = Ge.P.find(P => Re.navalCity(P.id) && Se.owner[P.id] >= 0 && Se.owner[P.id] !== n && zoneBy(Re, P.id) != null && !Re.atWar(n, Se.owner[P.id]) && !Re.friendly(n, Se.owner[P.id]));
    if (F){ const c = Re.addArmy(n, zoneBy(Re, F.id), {inf:2}); Re.orderMove(c, F.id); ok('a neutral power\'s naval city (no war, no passage): no landing', !c.path.length || firstLand(Re, zoneBy(Re, F.id), c.path) !== F.id, c.path); } } });

// 4. Marines
run('marines', () => { const R = game([0], {nations:true}), S = R.S, G = R.G, U = R.UNITS.mar, N = S.nations[0];
  ok('Marines: infantry-like (soft, foot), amphibious', !!U && U.cls === 'soft' && U.amph && U.coastal && R.INF_T.includes('mar') && R.UT.includes('mar'), U);
  ok('Marines stats: attack 4, defense 3, health 10, speed 4, $34M, 3 materials, 2 iron, 10k manpower, 36 h', U.atk === 4 && U.def === 3 && U.hp === 10 && U.spd === 4 && U.cost === 34 && U.metal === 3000 && U.iron === 2000 && U.mp === 10 && U.build === 36, U);
  const nd = R.RN.u_mar; ok('the Marines unlock is a research step of the Infantry Corps (day 3, 3 days, from Motorized Infantry)', !!nd && nd.cat === 'inf' && nd.fam === 'inf' && nd.lv[0].day === 3 && nd.lv[0].c.days === 3 && U.tech === 'u_mar', nd && {cat:nd.cat, fam:nd.fam, lv:nd.lv});
  ok('its line: Firepower, Protection, Ceramic Body Armour, Assault Kit, Amphibious Assault Battalion', ['mar_fp', 'mar_pr', 'mar_armor', 'mar_kit', 'mar_g2'].every(k => R.RN[k]));
  ok('model names for every group', ['nato', 'east', 'china', 'europe', 'export'].every(g => R.unitModel('mar', g, 1)));
  const own = G.P.filter(P => S.owner[P.id] === 0 && P.city), cst = own.find(P => R.navalCity(P.id)), inl = own.find(P => !P.coast);
  ok('a coastal and an inland city of nation 0', !!cst && !!inl, N.name); if (!cst || !inl) return;
  S.bld[cst.id].fac = 1; S.bld[inl.id].fac = 1;
  ok('before the research: refused (research required)', /Research required/.test(R.canMobilize(0, cst.id, 'mar')), R.canMobilize(0, cst.id, 'mar'));
  R.rGrant(N, 'u_mar', 1);
  ok('researched: trained at an Army Base in a coastal city', R.canMobilize(0, cst.id, 'mar') === '', R.canMobilize(0, cst.id, 'mar'));
  ok('not in an inland city, with the reason', /coastal city/.test(R.canMobilize(0, inl.id, 'mar')), R.canMobilize(0, inl.id, 'mar'));
  const a = R.addArmy(0, cst.id, {mar:3}); ok('a Marine force is named a Marine Brigade', /Marine Brigade/.test(R.armyName(a)), R.armyName(a)); });

// 5. old saves: troops at sea keep their landing order; fixture saves load and play on
run('oldsave', () => { const R = game([0]), S = R.S, G = R.G, n = 0;
  const C0 = G.P.find(P => !P.sea && P.coast && !P.city && S.owner[P.id] === n && zoneBy(R, P.id) != null), z = zoneBy(R, C0.id);
  const a = R.addArmy(n, z, {inf:3}), b = R.addArmy(n, z, {inf:3}); a.path = [C0.id]; b.path = [C0.id]; a.forced = b.forced = true;
  const o = JSON.parse(R.saveJSON()); delete o.nc; for (const x of o.armies) delete x.oldLand;   // (the save as a build before naval cities wrote it)
  const R2 = new Function(SRC)(); ok('a save with troops at sea headed for a plain coast loads', R2.restore(o) !== false);
  const a2 = R2.S.armies.find(x => x.id === a.id); ok('their route is kept from before the rule (oldLand)', a2 && a2.oldLand === 1 && a2.path[0] === C0.id, a2 && {old:a2.oldLand, path:a2.path});
  for (let i = 0; i < 400 && a2.at !== C0.id; i++) R2.tick();
  ok('and they land where they were going', a2.at === C0.id && !a2.oldLand, {at:a2.at});
  // a save of this build (S.nc) is loaded as it was: no flag, so the hourly check plans such a route again just as playing on would
  { const o5 = JSON.parse(R.saveJSON()), R5 = new Function(SRC)(); ok('a save of this build carries the naval-cities mark (S.nc)', o5.nc === 1, o5.nc);
    R5.restore(o5); const a5 = R5.S.armies.find(x => x.id === a.id); ok('loading it flags nothing (a load changes nothing playing on would not)', a5 && !a5.oldLand && a5.path[0] === C0.id, a5 && {old:a5.oldLand, path:a5.path}); }
  // a force still on land in that save, with a planned sail to a plain coast: not flagged (only troops already at sea keep such a route), planned
  // again on load through a naval city
  { let pick = null; for (const P of G.P){ if (P.sea || !R.navalCity(P.id) || S.owner[P.id] !== n) continue;
      for (const zz of P.nbs.filter(v => G.P[v].sea)){ const B = G.P[zz].nbs.find(v => !G.P[v].sea && !R.navalCity(v) && v !== P.id && S.owner[v] === n); if (B != null){ pick = {p:P.id, z:zz, B}; break; } } if (pick) break; }
    ok('a naval city and a plain coast on one sea zone', !!pick);
    if (pick){ const c = R.addArmy(n, pick.p, {inf:2}); c.path = [pick.z, pick.B]; const o2 = JSON.parse(R.saveJSON()); delete o2.nc; for (const x of o2.armies) delete x.oldLand;
      const R4 = new Function(SRC)(); R4.restore(o2); const c2 = R4.S.armies.find(x => x.id === c.id), fl2 = firstLand(R4, c2.at, c2.path);
      ok('an old-save force still on land is not flagged; its route is planned again (lands only at a naval city)', c2 && !c2.oldLand && c2.path[c2.path.length - 1] === pick.B && (fl2 < 0 || R4.navalCity(fl2)), c2 && {old:c2.oldLand, path:c2.path, fl2});
      for (let i = 0; i < 600 && c2.at !== pick.B; i++) R4.tick(); ok('and it gets there', c2.at === pick.B, {at:c2.at}); R.S.armies.splice(R.S.armies.indexOf(c), 1); } }
  // the same route in a game of this build (no flag): planned again through a naval city
  for (let i = 0; i < 3; i++) R.tick(); const fl = firstLand(R, b.to !== null ? b.at : z, b.to !== null ? [b.to, ...b.path] : b.path);
  ok('the same route given in this build is planned again through a naval city', b.at !== C0.id && (fl < 0 || R.navalCity(fl)), {at:b.at, to:b.to, path:b.path});
  for (const f of ['eco-v1-save.json', 'bunker-oldsave.json', 'upgrades-oldsave.json']){ const fx = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8')), sv = fx.save || fx;
    const R3 = new Function(SRC)(); R3.IM.api.newGame(77, 0, [0]); let err = '', ld = false; try { ld = R3.restore(sv) !== false; for (let i = 0; i < 48; i++) R3.tick(); } catch (e){ err = e.message; }
    ok(`old fixture save ${f} loads and plays 2 days`, ld && !err, err); } });

// 6. the switch
run('switch', () => { const R = game([0], {off:true}), S = R.S, G = R.G, n = 0;
  const C0 = G.P.find(P => !P.sea && P.coast && !P.city && S.owner[P.id] === n && zoneBy(R, P.id) != null), z = zoneBy(R, C0.id), a = R.addArmy(n, z, {inf:3}); R.orderMove(a, C0.id);
  ok('NAVAL_CITIES false: no Marines, no Marine research, landings on any coast (the old rules)', !R.NAVAL_CITIES && !R.UNITS.mar && !R.RN.u_mar && !R.UT.includes('mar') && a.path.length === 1 && a.path[0] === C0.id, a.path); });

// 7. the AI, the nations world, 20 days
run('ai', () => { const R = game([], {nations:true, clear:false, seed:5}), S = R.S, G = R.G; let lands = 0, bad = [], mar = 0, marR = 0; const seen = new Set(), sea0 = new Map();
  for (let h = 0; h < 24*20; h++){ R.tick();
    for (const a of S.armies){ if (a.owner < 0 || a.air || !R.count(a) || !R.ground(a)) continue;
      if (a.to !== null && G.P[a.at].sea && !G.P[a.to].sea){ const k = a.id + ':' + a.at + '>' + a.to; if (!seen.has(k)){ seen.add(k); lands++; if (!R.landOk(a, a.to)) bad.push(k); } }
      if (G.P[a.at].sea && a.to === null && !a.path.length){ if (!sea0.has(a.id)) sea0.set(a.id, h); } else sea0.delete(a.id); } }
  for (const a of S.armies) if (a.owner >= 0) mar += a.u.mar || 0; for (const N of S.nations) if (N.tech && N.tech.u_mar) marR++;
  const stuck = [...sea0].filter(([id, h0]) => 24*20 - h0 > 48 && S.armies.some(a => a.id === id && R.count(a)));
  console.log('AI, 20 days of the nations world:', JSON.stringify({landings:lands, marinesFielded:mar, nationsWithMarines:marR, idleAtSea:sea0.size, stuck48h:stuck.length}));
  ok('every AI landing at a naval city, or by Marines alone', lands > 0 && !bad.length, {lands, bad:bad.slice(0, 5)});
  ok('no AI ground force idle at sea for more than two days (no stall)', stuck.length === 0, stuck.slice(0, 5));
  ok('the AI researches Marines', marR > 0, marR); });

const bad = Object.entries(checks).filter(([, v]) => v !== 'PASS');
for (const [k, v] of Object.entries(checks)) console.log(v === 'PASS' ? 'PASS ' : 'FAIL ', k, v === 'PASS' ? '' : v);
console.log(bad.length || errors.length ? `FAILED ${bad.length} checks, ${errors.length} errors` : `OK ${Object.keys(checks).length} checks`, errors.length ? errors : '');
process.exit(bad.length || errors.length ? 1 : 0);
