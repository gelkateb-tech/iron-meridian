// Iron Meridian: the research redesign as data (docs/RESEARCH.md is written from this file). A prototype, not loaded by the game.
//   node tools/research-proto.js            checks the tree and prints totals and the budget simulation
//   node tools/research-proto.js --md       prints the tree tables (markdown)
//   node tools/research-proto.js --write    rewrites the generated part of docs/RESEARCH.md (between the TREE markers)
// The tree is built from our own unit roster (rules/data.js UNITS) and today's TECH list, so prices follow the units' real prices.
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(__dirname, '..');
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const R = new Function("'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn {UNITS, TECH, TECH_BY, techCost, MARK_F, markCost, MISSILES};')();
const {UNITS, TECH, TECH_BY, techCost, MARK_F} = R;

// ---------- categories (our own names and roles) ----------
const CATS = [
  {id:'inf',  name:'Infantry Corps',           role:'Takes ground and holds it',                       art:'u-infantry'},
  {id:'arm',  name:'Armoured Forces',          role:'Breaks the line and carries the infantry forward', art:'u-tank'},
  {id:'sup',  name:'Artillery & Air Defence',  role:'Long reach on the ground, a roof over the army',   art:'u-rocket-artillery'},
  {id:'aas',  name:'Air Assault',              role:'Short reach from the air: gunships and airborne troops', art:'u-attack-heli'},
  {id:'tac',  name:'Tactical Air',             role:'Fighters and strike jets, medium reach',           art:'u-air-superiority'},
  {id:'uns',  name:'Unmanned Systems',         role:'Cheap eyes and expendable strikes',                art:'u-strike-drone'},
  {id:'str',  name:'Strategic Air',            role:'Bombers and the big sensors, long reach',          art:'u-bomber'},
  {id:'nav',  name:'Navy',                     role:'Sea control, convoys and the silent service',      art:'u-destroyer'},
  {id:'msl',  name:'Strategic Weapons',        role:'Missiles, the shield against them, eyes in orbit', art:'u-missile-launcher'},
  {id:'cmd',  name:'Command & Logistics',      role:'Advantages for every force you field',             art:'u-supply-truck'},
];

// ---------- price formulas (w = the unit's money price) ----------
const GEN_F = [1, 1.7, 2.2, 2.6], GEN_C = [1, 1.5, 2, 2.4];
const P = {
  unlock:(U, days) => ({cash:Math.round(30 + 0.9*U.cost), metal:20, rare:12 + Math.round(U.cost/4), days}),
  // Firepower / Protection level L (1..3): half of what the old Mark (L + 1) cost, a little more rare
  eng:(U, L) => ({cash:Math.round(0.8*U.cost*(L + 1)), metal:6*(L + 1) + Math.ceil((U.metal || 0)*(L + 1)/2), iron:Math.ceil((U.iron || 0)*(L + 1)/2), elec:Math.round((U.elec || 0)*(L + 1)*0.4), rare:[3, 5, 8][L - 1], days:[2, 2, 3][L - 1]}),
  kit:(U, L) => ({cash:Math.round(25 + 0.6*U.cost*L), metal:[20, 30, 45][L - 1], rare:[12, 18, 26][L - 1] + Math.round(U.cost/20), days:[3, 4, 5][L - 1]}),
  gen:(U, g) => ({cash:Math.round((60 + 2.2*U.cost)*GEN_C[g - 2]), metal:g === 2 ? 50 : 80, iron:2*(U.iron || 0), elec:2*(U.elec || 0), rare:Math.round((30 + U.cost/4)*GEN_F[g - 2]), days:g === 2 ? 6 : g === 3 ? 8 : g === 4 ? 8 : 9}),
};
const legacyC = id => { const T = TECH_BY[id], c = techCost(T); return {cash:c.cash, metal:c.metal, rare:c.rare, days:T.days}; };

// ---------- the unit lines: one column each ----------
// u: unit, cat, day: the day the unlock opens, ud: days to research the unlock, std: known from day one, elite: star-and-wings badge
// k: kit nodes [id, name, icon, [[day, fx, text], ...levels], after (2 = needs generation 2)]; g: generations [[gen, day, name, fx, text]]
// fx: flat changes to the unit's own stats (atk, def, hp, spd) and rng (mission radius in hexes); text says the rest
const LINES = [
  {u:'inf', cat:'inf', day:1, std:1, k:[
    ['armor', 'Ceramic Body Armour', 'hp', [[2, {def:1}, 'defense +1']]],
    ['build', 'Rapid Mobilisation', 'build', [[5, {}, 'trains 15% faster'], [14, {}, 'trains 30% faster']]],
    ['terr', 'Rough-Ground Drills', 'terr', [[6, {}, 'half the speed penalty in forest and hills'], [12, {}, 'and in mountains and jungle']]]],
   g:[[2, 9, 'Mechanized Infantry', {atk:2, spd:1, hp:2}, 'attack +2, speed +1, health +2'], [3, 17, 'Assault Infantry', {atk:1, def:1, hp:2}, 'attack +1, defense +1, health +2']]},
  {u:'at', cat:'inf', day:1, std:1, k:[
    ['armor', 'Ceramic Body Armour', 'hp', [[2, {def:1}, 'defense +1']]],
    ['warhead', 'Tandem Warheads', 'dmg', [[5, {atk:1}, 'attack +1'], [11, {atk:1}, 'attack +1 more']]],
    ['eye', 'Thermal Sights', 'eye', [[8, {}, 'sees half a province farther']]]],
   g:[[2, 12, 'Guided Missile Teams', {atk:1, hp:2}, 'attack +1, health +2, damage to armor 3.5x to 4x']]},
  {u:'spec', cat:'inf', day:4, ud:4, elite:1, fam:'inf', k:[
    ['terr', 'Mountain & Arctic Training', 'terr', [[7, {}, 'rough-terrain attack bonus 40% to 50%'], [13, {}, 'to 60%']]],
    ['eye', 'Night Optics', 'eye', [[8, {}, 'sees half a province farther']]],
    ['airlift', 'Air-Transportable', 'airlift', [[10, {}, 'can be air-dropped from an airbase province, up to 6 hexes']]]],
   g:[[2, 16, 'Tier-One Operators', {atk:2, def:1, hp:2}, 'attack +2, defense +1, health +2']]},

  {u:'ifv', cat:'arm', day:1, ud:3, k:[
    ['gun', '30 mm Autocannon', 'dmg', [[5, {atk:2}, 'attack +2']]],
    ['spd', 'Uprated Powerpack', 'spd', [[8, {spd:1}, 'speed +1']]],
    ['terr', 'Amphibious Kit', 'terr', [[10, {}, 'no penalty for attacking across a river']]]],
   g:[[2, 13, 'Heavy IFV', {atk:1, def:1, hp:3}, 'attack +1, defense +1, health +3']]},
  {u:'tank', cat:'arm', day:1, std:1, k:[
    ['armor', 'Composite Armour', 'hp', [[3, {def:2}, 'defense +2']]],
    ['gun', 'Smoothbore Main Gun', 'dmg', [[7, {atk:3}, 'attack +3']]],
    ['terr', 'Wide Tracks', 'terr', [[9, {}, 'half the speed penalty on rough ground']]],
    ['eng', 'Turbine Engines', 'spd', [[11, {spd:2, atk:1}, 'speed +2, attack +1']]]],
   g:[[2, 14, 'Third-Generation MBT', {def:1, hp:4}, 'defense +1, health +4'], [3, 22, 'Next-Generation MBT', {atk:2, def:1, hp:3}, 'attack +2, defense +1, health +3']]},

  {u:'art', cat:'sup', day:1, std:1, k:[
    ['radar', 'Counter-Battery Radar', 'eye', [[3, {atk:2}, 'attack +2']]],
    ['shell', 'Extended-Range Shells', 'rng', [[8, {atk:3, def:2}, 'attack +3, defense +2']]],
    ['guided', 'Guided Shells', 'dmg', [[13, {atk:2, spd:1}, 'attack +2, speed +1']]]],
   g:[[2, 15, 'Long-Barrel Howitzer', {atk:1, hp:3}, 'attack +1, health +3']]},
  {u:'mlrs', cat:'sup', day:5, ud:4, fam:'art', k:[
    ['reload', 'Rapid Reload', 'dmg', [[9, {atk:2}, 'attack +2']]],
    ['rng', 'Extended-Range Rockets', 'rng', [[12, {}, 'shells enemies up to 3 provinces away (was 2)']]]],
   g:[[2, 16, 'Guided Rocket System', {atk:2, hp:2}, 'attack +2, health +2, damage to armor 0.9x to 1.2x']]},
  {u:'sam', cat:'sup', day:1, std:1, k:[
    ['seek', 'Improved Seekers', 'dmg', [[4, {atk:1}, 'attack +1'], [10, {atk:1}, 'attack +1 more']]],
    ['spd', 'Shoot-and-Scoot', 'spd', [[7, {spd:1, def:1}, 'speed +1, defense +1']]]],
   g:[[2, 13, 'Long-Range SAM', {atk:2, hp:2}, 'attack +2, health +2, covers neighbouring provinces at full strength']]},
  {u:'jam', cat:'sup', day:3, ud:3, k:[
    ['band', 'Wideband Jamming', 'eye', [[7, {}, 'downs and jams 20% more drones'], [13, {}, '40% more']]]],
   g:[[2, 16, 'Counter-UAV Laser', {atk:2, def:1, hp:2}, 'attack +2, defense +1, health +2']]},

  {u:'heli', cat:'aas', day:2, ud:4, k:[
    ['rng', 'Long-Range Tanks', 'rng', [[6, {rng:1}, 'range +1 hex (7)'], [12, {rng:1}, 'range +1 more (8)']]],
    ['atgm', 'Fire-and-Forget Missiles', 'dmg', [[8, {atk:1}, 'attack +1']]]],
   g:[[2, 14, 'Heavy Gunship', {atk:2, def:1, hp:3}, 'attack +2, defense +1, health +3']]},
  {u:'para', cat:'aas', day:3, ud:4, elite:1, k:[
    ['airlift', 'Long-Range Airlift', 'airlift', [[7, {}, 'drop range 9 to 11 hexes'], [13, {}, 'to 13 hexes']]]],
   g:[[2, 15, 'Air Assault Brigade', {atk:1, def:1, hp:2}, 'attack +1, defense +1, health +2']]},

  {u:'int', cat:'tac', day:1, ud:4, k:[
    ['msl', 'Radar-Guided Missiles', 'dmg', [[5, {atk:2}, 'attack +2']]],
    ['rng', 'Drop Tanks', 'rng', [[7, {rng:1}, 'range +1 hex'], [13, {rng:1}, 'range +1 more']]]],
   g:[[2, 12, 'Fourth-Generation Interceptor', {atk:1, def:1, hp:2, spd:2}, 'attack +1, defense +1, health +2, speed +2']]},
  {u:'jet', cat:'tac', day:1, ud:4, k:[
    ['pgm', 'Precision Munitions', 'dmg', [[5, {atk:2}, 'attack +2']]],
    ['rng', 'Drop Tanks', 'rng', [[7, {rng:1}, 'range +1 hex'], [13, {rng:1}, 'range +1 more']]],
    ['lo', 'Stealth Airframes', 'hp', [[10, {def:3}, 'defense +3; with the Strategic Bomber Upgrade it opens the Stealth Bomber']]]],
   g:[[2, 14, 'Multirole Strike Fighter', {atk:2, hp:2}, 'attack +2, health +2, damage to armor 1.6x to 1.8x']]},
  {u:'asf', cat:'tac', day:4, ud:5, elite:1, fam:'int', k:[
    ['rng', 'Drop Tanks', 'rng', [[8, {rng:1}, 'range +1 hex'], [14, {rng:1}, 'range +1 more']]],
    ['radar', 'Look-Down Radar', 'eye', [[10, {atk:1}, 'attack +1']]]],
   g:[[2, 17, 'Fifth-Generation Fighter', {atk:2, def:2, hp:2}, 'attack +2, defense +2, health +2']]},

  {u:'drone', cat:'uns', day:2, ud:3, k:[],
   g:[[2, 5, 'UAV II · Long-Endurance Optics', {def:1}, 'sees farther, loiters 16 h, reaches farther, harder to shoot down'], [3, 9, 'UAV III · Low-Observable Airframe', {def:1}, 'loiters 20 h, wider view, air defences hit 40% less'],
      [4, 13, 'UAV IV · Armed UAV', {atk:3}, 'light missiles: one salvo per sortie'], [5, 18, 'UAV V · Hunter-Killer', {atk:2, def:2}, 'two salvos, heavier missiles, longer range and loiter']]},
  {u:'swarm', cat:'uns', day:4, ud:4, k:[
    ['rng', 'Booster Rockets', 'rng', [[8, {rng:1}, 'range +1 hex'], [14, {rng:1}, 'range +1 more']]],
    ['pack', 'Bigger Salvo', 'msl', [[9, {}, 'eight drones per card (was six), same price']]]],
   g:[[2, 15, 'Networked Swarm', {atk:0.6, hp:1}, 'attack +0.6, health +1, damage to armor 0.35x to 0.6x']]},
  {u:'sdrone', cat:'uns', day:6, ud:4, fam:'drone', k:[
    ['rng', 'Satellite Link', 'rng', [[10, {rng:2}, 'range +2 hexes'], [15, {rng:2}, 'range +2 more']]],
    ['hit', 'Bunker-Buster Warhead', 'dmg', [[12, {}, 'knocks a building out for 36 h (was 24 h)']]]],
   g:[[2, 17, 'Low-Observable Strike Drone', {atk:2, hp:2}, 'attack +2, health +2, air defences hit 30% less']]},

  {u:'bomb', cat:'str', day:6, ud:6, k:[
    ['ecm', 'Defensive Jammers', 'hp', [[9, {def:2}, 'defense +2']]],
    ['up', 'Strategic Bomber Upgrade', 'rng', [[11, {atk:1, rng:4}, 'range +4 hexes (+720 km), attack +1; with Stealth Airframes it opens the Stealth Bomber']]]],
   g:[[2, 17, 'Supersonic Bomber', {atk:2, hp:3, spd:3}, 'attack +2, health +3, speed +3']]},
  {u:'stealth', cat:'str', day:14, ud:9, elite:1, req:['bomb_up', 'jet_lo'], k:[
    ['bay', 'Enlarged Bomb Bay', 'msl', [[19, {}, 'bomb load 60% to 75% of a Heavy Bomber’s']]],
    ['rng', 'Flying-Wing Tanks', 'rng', [[21, {rng:4}, 'range +4 hexes']]]],
   g:[]},
  {u:'mpa', cat:'str', day:4, ud:4, k:[
    ['sonar', 'Sonobuoy Field', 'eye', [[8, {}, 'detection radius +20%'], [14, {}, '+40%']]],
    ['torp', 'Homing Torpedoes', 'dmg', [[10, {atk:2}, 'attack +2']]]],
   g:[[2, 15, 'Long-Endurance Patrol Aircraft', {atk:1, hp:2}, 'attack +1, health +2, patrols 18 h (was 12 h)']]},
  {u:'awacs', cat:'str', day:5, ud:5, noFp:1, k:[
    ['radar', 'High-Power Radar', 'eye', [[9, {}, 'radar radius +15%'], [15, {}, '+30%']]],
    ['link', 'Fighter Data Link', 'dmg', [[12, {}, 'fighters under it fight 35% better (was 25%)']]]],
   g:[[2, 17, 'Phased-Array AWACS', {def:1, hp:2}, 'defense +1, health +2, identifies forces within half its radius']]},

  {u:'frig', cat:'nav', day:1, std:1, k:[
    ['gun', 'Naval Gunnery', 'dmg', [[3, {atk:1}, 'attack +1']]],
    ['sonar', 'Towed Sonar', 'eye', [[6, {}, 'hears submarines two sea zones away']]],
    ['aa', 'Area Air Defence', 'hp', [[9, {def:1}, 'defense +1, damage to aircraft 1.8x to 2.1x']]]],
   g:[[2, 14, 'Guided-Missile Frigate', {atk:2, def:1, hp:3}, 'attack +2, defense +1, health +3']]},
  {u:'crui', cat:'nav', day:1, std:1, k:[
    ['gun', 'Naval Gunnery', 'dmg', [[3, {atk:2}, 'attack +2']]],
    ['rng', 'Long-Range Bombardment', 'rng', [[11, {}, 'coastal bombardment 30% stronger']]]],
   g:[[2, 15, 'Missile Cruiser', {atk:2, hp:4}, 'attack +2, health +4']]},
  {u:'carr', cat:'nav', day:7, ud:6, fam:'crui', k:[
    ['deck', 'Flight-Deck Crews', 'deck', [[11, {}, 'wings aboard repair 25% a day (was 20%)'], [16, {}, '30% a day']]],
    ['spd', 'Nuclear Propulsion', 'spd', [[13, {spd:0.8}, 'speed +0.8']]]],
   g:[[2, 18, 'Supercarrier', {def:2, hp:6}, 'defense +2, health +6']]},
  {u:'sub', cat:'nav', day:1, std:1, k:[
    ['torp', 'Heavy Torpedoes', 'dmg', [[4, {atk:1}, 'attack +1'], [10, {atk:1}, 'attack +1 more']]],
    ['quiet', 'Quiet Drive', 'hp', [[7, {def:1}, 'defense +1'], [13, {def:1}, 'defense +1 more']]]],
   g:[[2, 14, 'Nuclear Attack Submarine', {atk:1, hp:3, spd:1.2}, 'attack +1, health +3, speed +1.2']]},
];

// ---------- the two categories that are not unit lines: today's projects keep their ids and prices; new levels are listed here ----------
const SPECIAL = [
  {cat:'msl', line:'Cruise Missile', nodes:[
    {id:'msl1', kind:'unlock', ic:'cm', day:2, lv:[[2, 'Missile Silos can build Cruise Missiles', legacyC('msl1')]]},
    {id:'cm_rng', name:'Cruise Missile Range', kind:'kit', ic:'rng', req:['msl1'], lv:[[7, 'range 28 to 32 hexes', {cash:90, metal:30, rare:20, days:4}], [13, 'to 36 hexes', {cash:130, metal:45, rare:30, days:5}]]},
    {id:'cm_spd', name:'Cruise Missile Speed', kind:'kit', ic:'spd', req:['msl1'], lv:[[9, 'speed 9 to 11: less time for the defences', {cash:90, metal:30, rare:20, days:4}], [15, 'to 13', {cash:130, metal:45, rare:30, days:5}]]}]},
  {cat:'msl', line:'Ballistic Missile', nodes:[
    {id:'msl2', kind:'unlock', ic:'bm', day:6, req:['msl1'], lv:[[6, 'Silos can build Ballistic Missiles', legacyC('msl2')]]},
    {id:'bm_rng', name:'Ballistic Missile Range', kind:'kit', ic:'rng', req:['msl2'], lv:[[11, 'range 90 to 102 hexes', {cash:140, metal:45, rare:34, days:5}], [17, 'to 114 hexes', {cash:190, metal:60, rare:46, days:6}]]},
    {id:'bm_pow', name:'Heavier Warhead', kind:'kit', ic:'dmg', req:['msl2'], lv:[[14, 'power 16 to 19', {cash:170, metal:60, rare:44, days:6}]]}]},
  {cat:'msl', line:'Missile Defence', nodes:[
    {id:'msl3', kind:'kit', ic:'hp', day:9, req:['msl2'], lv:[[9, 'SAMs and Frigates intercept missiles twice as well', legacyC('msl3')], [15, '2.5 times as well', {cash:170, metal:60, rare:60, days:6}], [21, '3 times as well', {cash:220, metal:80, rare:80, days:7}]]}]},
  {cat:'msl', line:'Satellites', nodes:[
    {id:'sat1', kind:'kit', ic:'eye', day:5, req:['msl1'], lv:[[5, 'up to 3 spy satellites', legacyC('sat1')], [11, 'up to 4', {cash:150, metal:50, rare:48, days:5}], [17, 'up to 5, each with a wider swath', {cash:200, metal:70, rare:64, days:6}]]}]},
  {cat:'cmd', line:'Supply', nodes:[{id:'log1', kind:'kit', ic:'spd', lv:[[3, 'All forces move 20% faster; opens high-speed rail', legacyC('log1')]]}]},
  {cat:'cmd', line:'Engineers', nodes:[{id:'log2', kind:'kit', ic:'build', lv:[[4, 'Capture 30% faster; forts cost half; roads and railways 25% cheaper and faster', legacyC('log2')]]}]},
  {cat:'cmd', line:'Landings', nodes:[{id:'nav3', kind:'kit', ic:'terr', lv:[[5, 'Troops landing from the sea fight at 90% instead of 67% on their first day', legacyC('nav3')]]}]},
  {cat:'cmd', line:'Medical', nodes:[{id:'log3', kind:'kit', ic:'hp', lv:[[6, 'Your forces take 15% less damage', legacyC('log3')]]}]},
];

// ---------- build the node list ----------
// node: {id, cat, line, u, kind: unlock | eng | kit | gen, name, ic, req:[node ids], lv:[{day, c:{cash, metal, iron, elec, rare, days}, fx, txt}], std, elite, pic}
const NODES = [], BY = {};
const add = n => { NODES.push(n); BY[n.id] = n; return n; };
const PCT = [12, 25, 40];
for (const L of LINES){ const U = UNITS[L.u], u = L.u, g2 = (L.g.find(g => g[0] === 2) || [])[1];
  add({id:'u_' + u, cat:L.cat, line:u, u, kind:'unlock', name:U.name, ic:'unit', pic:'u-' + u, std:!!L.std, elite:!!L.elite, fam:L.fam, req:L.req || [],
    lv:[{day:L.day, c:L.std ? {cash:0, metal:0, rare:0, days:0} : P.unlock(U, L.ud), fx:{}, txt:L.std ? 'standard issue: known from day one' : 'unlocks the ' + U.name}]});
  const eDay = [Math.max(3, L.day + 2), L.day + 9, Math.max(g2 ? g2 + 3 : 0, L.day + 15)];
  for (const [k, nm, ic, off] of [['fp', 'Firepower', 'dmg', 0], ['pr', 'Protection', 'hp', 1]]){ if (k === 'fp' && L.noFp) continue;
    add({id:u + '_' + k, cat:L.cat, line:u, u, kind:'eng', name:nm, ic, req:['u_' + u], req3:g2 ? u + '_g2' : null,
      lv:[1, 2, 3].map(l => ({day:eDay[l - 1] + off, c:P.eng(U, l), fx:{[k === 'fp' ? 'atkPct' : 'defPct']:PCT[l - 1]}, txt:`${k === 'fp' ? 'attack' : 'defense'} +${PCT[l - 1]}% in all`}))}); }
  for (const [k, nm, ic, lv, after] of L.k)
    add({id:u + '_' + k, cat:L.cat, line:u, u, kind:'kit', name:nm, ic, req:[lv[0][0] > (g2 || 99) || after === 2 ? u + '_g2' : 'u_' + u], lv:lv.map(([day, fx, txt], i) => ({day, c:P.kit(U, i + 1), fx, txt}))});
  for (const [g, day, nm, fx, txt] of L.g)
    add({id:u + '_g' + g, cat:L.cat, line:u, u, kind:'gen', gen:g, name:nm, ic:'unit', pic:`u-${u}-${g}`, req:[g === 2 ? 'u_' + u : `${u}_g${g - 1}`], lv:[{day, c:P.gen(U, g), fx, txt}]});
}
for (const Sx of SPECIAL) for (const n of Sx.nodes)
  add({id:n.id, cat:Sx.cat, line:Sx.line, u:null, kind:n.kind, name:n.name || TECH_BY[n.id].name, ic:n.ic, req:n.req || [], lv:n.lv.map(([day, txt, c]) => ({day, c, fx:{}, txt}))});

// ---------- today's projects and Marks: what an old save converts to ('node' or 'node@level') ----------
const LEGACY = {
  inf1:['inf_armor', 'at_armor'], inf2:['inf_g2', 'at_warhead@1', 'u_ifv'], inf3:['inf_g3', 'u_spec'],
  tank1:['tank_armor'], tank2:['tank_gun', 'ifv_gun', 'at_warhead@2'], tank3:['tank_eng'],
  art1:['art_radar'], art2:['art_shell', 'u_mlrs'], art3:['art_guided'],
  air1:['u_jet', 'u_int'], air2:['jet_pgm', 'int_msl'], air3:['jet_lo'],
  log1:['log1'], log2:['log2'], log3:['log3'], msl1:['msl1'], msl2:['msl2'], msl3:['msl3'], sat1:['sat1'],
  nav1:['frig_gun', 'crui_gun'], nav2:['u_carr'], nav3:['nav3'],
  asf1:['u_asf'], awacs1:['u_awacs'], mpa1:['u_mpa'], bomb1:['u_bomb'], bomb2:['bomb_up'], bomb3:['u_stealth'],
  drone1:['u_drone'], uav2:['drone_g2'], uav3:['drone_g3'], uav4:['drone_g4'], uav5:['drone_g5'],
  jam1:['u_jam'], swarm1:['u_swarm'], sdrone1:['u_sdrone'], heli1:['u_heli'], para1:['u_para'],
};
const ref = s => { const [id, l] = s.split('@'); return {id, l:+(l || 1)}; };

// ---------- checks ----------
const errs = [];
for (const n of NODES){
  for (const q of n.req){ const m = BY[q]; if (!m) { errs.push(`${n.id}: unknown prerequisite ${q}`); continue; }
    const same = m.line === n.line, mslLine = m.cat === 'msl' && n.cat === 'msl', stealth = n.id === 'u_stealth';
    if (!same && !mslLine && !stealth) errs.push(`${n.id}: prerequisite ${q} is outside its unit line`);
    if (m.lv[0].day > n.lv[0].day) errs.push(`${n.id}: opens on day ${n.lv[0].day}, before its prerequisite ${q} (day ${m.lv[0].day})`); }
  for (let i = 1; i < n.lv.length; i++) if (n.lv[i].day <= n.lv[i - 1].day) errs.push(`${n.id}: level ${i + 1} does not open after level ${i}`);
  if (n.kind === 'eng' && n.req3 && BY[n.req3].lv[0].day > n.lv[2].day) errs.push(`${n.id}: level 3 opens before generation 2`);
}
for (const T of TECH){ const m = LEGACY[T.id]; if (!m){ errs.push(`today's project ${T.id} has no equivalent`); continue; }
  const got = {}; for (const s of m){ const {id, l} = ref(s), n = BY[id]; if (!n || !n.lv[l - 1]){ errs.push(`${T.id}: no node ${s}`); continue; }
    if (n.u){ const fx = n.lv[l - 1].fx, g = got[n.u] || (got[n.u] = {}); for (const k in fx) g[k] = (g[k] || 0) + fx[k]; } }
  for (const u in T.fx) for (const k in T.fx[u]) if (!((got[u] || {})[k] >= T.fx[u][k])) errs.push(`${T.id}: gives ${u} ${k} +${T.fx[u][k]}, its nodes give ${(got[u] || {})[k] || 0}`);
  for (const u in UNITS) if (UNITS[u].tech === T.id && !m.includes('u_' + u)) errs.push(`${T.id} unlocks ${u} today, its nodes do not`); }
for (const u in UNITS){ if (!BY['u_' + u]) errs.push(`unit ${u} has no line`); if (!BY[u + '_pr']) errs.push(`unit ${u} has no Protection node for its Marks`); }
PCT.forEach((p, i) => { if (Math.abs(1 + p/100 - MARK_F[i + 2]) > 0.006) errs.push(`Mark ${i + 2} is x${MARK_F[i + 2]}, level ${i + 1} gives +${p}%`); });

// ---------- totals ----------
const steps = NODES.flatMap(n => n.lv.map((l, i) => ({n, i, l}))).filter(s => !(s.n.std && s.n.kind === 'unlock'));
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
const tot = a => ({steps:a.length, rare:sum(a, s => s.l.c.rare || 0), cash:sum(a, s => s.l.c.cash || 0), metal:sum(a, s => s.l.c.metal || 0), days:sum(a, s => s.l.c.days || 0)});
const lineIds = [...new Set(NODES.map(n => n.cat + '|' + n.line))];
const lineSteps = key => steps.filter(s => s.n.cat + '|' + s.n.line === key);

// ---------- budget simulation: two slots, day gates, prerequisites, rare materials and money as they come in ----------
// A nation follows a list of wanted steps in order (a step waits for its day, its prerequisites, a free slot and the money and rare materials).
// Incomes are the measured ones (tools/headless-style runs of economy-v1, seeds 12345, 7 and 99, AI in every seat, 60 days):
// rare materials a day: poorest 1.6, typical 8.3, richest about 19; money a nation puts into research: about 19 a day typical under today's prices.
const ARCH = [
  {name:'No rare-earth city (2 a day)', rare0:40, rare:2.0*0.75, cash0:150, cash:25},
  {name:'Typical, one rare-earth city (8 a day)', rare0:40, rare:8.3*0.75, cash0:150, cash:40},
  {name:'Rich, two rare-earth cities (18 a day)', rare0:40, rare:18*0.75, cash0:150, cash:80},
];
function simulate(A, want, DAYS){ const lvl = {}, done = []; let rare = A.rare0, cash = A.cash0; const slots = [null, null], Q = want.slice();
  for (const n of NODES) if (n.std && n.kind === 'unlock') lvl[n.id] = 1;
  const open = (s, day) => { const n = s.n; if ((lvl[n.id] || 0) !== s.i) return false; if (s.l.day > day) return false;
    if (n.req.some(q => !lvl[q])) return false; if (n.kind === 'eng' && s.i === 2 && n.req3 && !lvl[n.req3]) return false; return true; };
  for (let h = 0; h < DAYS*24; h++){ const day = 1 + h/24;
    rare += A.rare/24; cash += A.cash/24;
    for (let k = 0; k < 2; k++){ const R0 = slots[k]; if (R0 && --R0.h <= 0){ lvl[R0.s.n.id] = R0.s.i + 1; done.push({s:R0.s, day:Math.ceil(day*10)/10}); slots[k] = null; } }
    for (let k = 0; k < 2; k++){ if (slots[k]) continue;
      const i = Q.findIndex(s => open(s, day) && !slots.some(x => x && x.s === s)); if (i < 0) continue; const s = Q[i];
      if (rare < (s.l.c.rare || 0) || cash < (s.l.c.cash || 0)) break;   // saving for the first wanted step that is open
      rare -= s.l.c.rare || 0; cash -= s.l.c.cash || 0; Q.splice(i, 1); slots[k] = {s, h:Math.max(1, s.l.c.days*24)}; } }
  return {done, left:Q, rare, cash}; }
const stepOf = s => { const {id, l} = ref(s); return steps.find(x => x.n.id === id && x.i === l - 1); };
const lineAll = u => steps.filter(s => s.n.line === u).sort((a, b) => a.l.day - b.l.day);
// plan A: a tank power: four unlocks early, then everything in the Main Battle Tank line. Plan B: an air power: fighters first, then the whole Strike Fighter line.
const plan = (unl, u, extra = []) => [...new Set([...unl.map(stepOf), ...extra, ...lineAll(u)])];
const engOf = (u, l) => ['fp', 'pr'].map(k => stepOf(`${u}_${k}@${l}`));
const PLANS = {
  'Armor power: unlock IFV, Interceptor, Gunship and Rocket Artillery, then the whole Main Battle Tank line':plan(['u_ifv', 'u_int', 'u_heli', 'u_mlrs'], 'tank'),
  'Air power: unlock Interceptor, Strike Fighter, UAV and Air Superiority Fighter, then the whole Strike Fighter line':plan(['u_int', 'u_jet', 'u_drone', 'u_asf'], 'jet'),
  'Hone what you field: no unlocks; Firepower and Protection 1 and 2 for Infantry and Artillery, then the whole Main Battle Tank line':plan([], 'tank', [...engOf('inf', 1), ...engOf('art', 1), ...engOf('inf', 2), ...engOf('art', 2)]),
};
// plan C: research everything, cheapest rare first: how much of the tree a nation can reach
const allCheap = steps.slice().sort((a, b) => a.l.day - b.l.day || (a.l.c.rare || 0) - (b.l.c.rare || 0));

// ---------- output ----------
const cTxt = c => [c.cash ? `$${c.cash}M` : '', c.metal ? `${c.metal} mat` : '', c.iron ? `${c.iron} iron` : '', c.elec ? `${c.elec} elec` : '', c.rare ? `${c.rare} rare` : ''].filter(Boolean).join(', ') || 'free';
const KIND = {unlock:'Unlock', eng:'Levels', kit:'Upgrade', gen:'Generation'};
function md(){ let o = '';
  for (const C of CATS){ const ns = NODES.filter(n => n.cat === C.id), lines = [...new Set(ns.map(n => n.line))];
    o += `\n### ${C.name}\n\n*${C.role}.* Banner picture: \`${C.art}\`.\n\n`;
    // the day grid: one column per line, one row per day that holds a node
    const days = [...new Set(ns.flatMap(n => n.lv.map(l => l.day)))].sort((a, b) => a - b);
    const short = (n, i) => n.kind === 'unlock' ? (n.std ? '(standard)' : 'UNLOCK') : n.kind === 'gen' ? 'GEN ' + n.gen : n.kind === 'eng' ? `${n.name} ${i + 1}` : n.name + (n.lv.length > 1 ? ` ${i + 1}` : '');
    o += `| Day | ${lines.map(l => UNITS[l] ? UNITS[l].name + (BY['u_' + l].elite ? ' (elite)' : '') : l).join(' | ')} |\n|---|${lines.map(() => '---').join('|')}|\n`;
    for (const d of days) o += `| ${d} | ${lines.map(l => ns.filter(n => n.line === l).flatMap(n => n.lv.map((x, i) => x.day === d ? short(n, i) : null).filter(Boolean)).join('; ')).join(' | ')} |\n`;
    for (const l of lines){ const ln = ns.filter(n => n.line === l), U = UNITS[l], t = tot(lineSteps(C.id + '|' + l));
      o += `\n**${U ? U.name : l}**${U && BY['u_' + l].elite ? ' (elite badge)' : ''}: ${t.steps} steps, ${t.rare} rare materials, $${t.cash}M, ${t.days} research days in all.` + (U && BY['u_' + l].fam ? ` Family line (dashed, no requirement) from the ${UNITS[BY['u_' + l].fam].name}.` : '') + '\n\n';
      o += `| Day | Node (id) | Type | Effect | Price | Days |\n|---|---|---|---|---|---|\n`;
      const rows = ln.flatMap(n => n.lv.map((x, i) => ({n, i, x}))).sort((a, b) => a.x.day - b.x.day);
      for (const {n, i, x} of rows){ const need = [...(i === 0 ? n.req.filter(q => !(BY[q].std && BY[q].kind === 'unlock')).map(q => BY[q].name + (BY[q].u && BY[q].u !== n.u ? ` (${UNITS[BY[q].u].name})` : '')) : []), ...(n.kind === 'eng' && i === 2 && n.req3 ? ['generation 2'] : [])];
        o += `| ${x.day} | ${n.name}${n.lv.length > 1 ? ` ${i + 1}/${n.lv.length}` : ''} (\`${n.id}\`)${n.pic && n.kind === 'gen' ? `, picture \`${n.pic}\`` : ''} | ${KIND[n.kind]} | ${x.txt}${need.length ? `. Needs ${need.join(' and ')}` : ''} | ${cTxt(x.c)} | ${x.c.days || '-'} |\n`; } }
  }
  return o; }
function report(){ let o = '';
  const T = tot(steps); o += `Whole tree: ${NODES.length} nodes, ${T.steps} research steps, ${T.rare} rare materials, $${T.cash}M, ${T.metal} materials, ${T.days} research days (${Math.round(T.days/2)} days with both slots never idle).\n`;
  const old = TECH.reduce((s, t) => { const c = techCost(t); s.rare += c.rare; s.cash += c.cash; s.days += t.days; return s; }, {rare:0, cash:0, days:0});
  o += `Today's tree: ${TECH.length} projects, ${old.rare} rare materials, $${old.cash}M, ${old.days} research days.\n\n`;
  o += `| Category | Lines | Steps | Rare materials | Money | Research days |\n|---|---|---|---|---|---|\n`;
  for (const C of CATS){ const a = steps.filter(s => s.n.cat === C.id), t = tot(a); o += `| ${C.name} | ${new Set(a.map(s => s.n.line)).size} | ${t.steps} | ${t.rare} | $${t.cash}M | ${t.days} |\n`; }
  o += `\n| Plan | Nation | Steps done by day 30 | Of the chosen line by day 30 | Line finished on day | Steps done by day 60 |\n|---|---|---|---|---|---|\n`;
  for (const pn in PLANS){ const want = PLANS[pn].filter(Boolean), lineU = want[want.length - 1].n.line, ln = want.filter(s => s.n.line === lineU).length;
    for (const A of ARCH){ const r = simulate(A, want, 60), d30 = r.done.filter(x => x.day <= 30), l30 = d30.filter(x => x.s.n.line === lineU).length, last = r.left.length ? null : Math.max(...r.done.map(x => x.day));
      o += `| ${pn} | ${A.name} | ${d30.length} of ${want.length} | ${l30} of ${ln} (${Math.round(l30/ln*100)}%) | ${last ? Math.ceil(last) : 'not by day 60'} | ${r.done.length} of ${want.length} |\n`; } }
  o += `\n| Everything, as it opens | Steps by day 30 | Steps by day 60 | Share of the tree by day 60 |\n|---|---|---|---|\n`;
  for (const A of ARCH){ const r = simulate(A, allCheap, 60); o += `| ${A.name} | ${r.done.filter(x => x.day <= 30).length} | ${r.done.length} | ${Math.round(r.done.length/steps.length*100)}% |\n`; }
  return o; }

if (errs.length){ console.log('TREE ERRORS\n' + errs.join('\n')); process.exit(1); }
if (process.argv.includes('--md')) console.log(md());
else if (process.argv.includes('--write')){ const f = path.join(ROOT, 'docs', 'RESEARCH.md'); let s = fs.readFileSync(f, 'utf8');
  const put = (tag, body) => { const a = `<!-- ${tag}:BEGIN (written by tools/research-proto.js --write) -->`, b = `<!-- ${tag}:END -->`, i = s.indexOf(a), j = s.indexOf(b); if (i < 0 || j < 0) throw new Error('no ' + tag + ' markers in docs/RESEARCH.md'); s = s.slice(0, i + a.length) + '\n' + body + '\n' + s.slice(j); };
  put('TREE', md()); put('BALANCE', report()); fs.writeFileSync(f, s); console.log('docs/RESEARCH.md updated'); }
else console.log('TREE OK\n' + report());
module.exports = {CATS, NODES, LEGACY, simulate, ARCH, PLANS, steps};
