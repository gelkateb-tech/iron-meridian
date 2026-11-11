// Iron Meridian rules: data. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
const WORLD = globalThis.WORLD, LINES = globalThis.LINES;   // the map data (world.js, lines.js), loaded before this file
const NATIONS = globalThis.NATIONS || null;   // the playable nations of the nations world (nations.js); null when a host does not load it
/* ---------------- Rules ---------------- */
// req (and req2 for the few that need two): the building, and its level, a city must have to mobilize the unit; tech: the research it needs (null: known from day one).
// Foot units (infantry, anti-tank, special forces, paratroopers) come from a Recruiting Office, vehicles from an Army Base, aircraft from an Airbase,
// ships from a Naval Yard. The rule itself is canMobilize()
const UNITS = {
  inf:  {name:'Motorized Infantry',short:'INF', cls:'soft',    cost:25, oil:0, metal:0, iron:0, elec:0, rare:0, mp:10, atk:3, def:3, hp:10, spd:4,  build:24, upk:1, fuel:0,   req:{b:'rec', l:1},          tech:null,  role:'Cheap line infantry. Holds ground, captures.'},
  at:   {name:'Anti-Tank Infantry',short:'ATI', cls:'soft',    cost:32, oil:0, metal:3, iron:3, elec:0, rare:0, mp:10, atk:3, def:3, hp:9,  spd:4,  build:30, upk:1, fuel:0,   req:{b:'rec', l:1}, tech:null,  vs:{armored:3.5}, role:'Anti-tank infantry: 3.5× damage to armor.'},
  art:  {name:'Mobile Artillery',  short:'ART', cls:'soft',    cost:36, oil:3, metal:4, iron:7, elec:0, rare:0, mp:10, atk:7, def:3, hp:9,  spd:3,  build:48, upk:2, fuel:0,   req:{b:'fac', l:1}, tech:null,  vs:{soft:1.4}, role:'Artillery: shreds infantry, fragile.'},
  sam:  {name:'Mobile SAM',        short:'SAM', cls:'soft',    cost:44, oil:2, metal:6, iron:3, elec:7, rare:0, mp:8,  atk:5, def:2, hp:8,  spd:4,  build:48, upk:2, fuel:0,   req:{b:'fac', l:2}, tech:null,  vs:{air:3.0, soft:0.3, armored:0.3}, vsU:{swarm:1.4, sdrone:3.2, bomb:4.0}, role:'Air defense: triple damage to aircraft; shoots down strike drones and covers its neighbours a little. Swarms saturate it.'},
  ifv:  {name:'Infantry Fighting Vehicle',short:'IFV', cls:'armored', cost:32, oil:4, metal:4, iron:7, elec:0, rare:0, mp:10, atk:4, def:4, hp:12, spd:7,  build:36, upk:2, fuel:0.5, req:{b:'fac', l:1}, tech:'inf2', role:'Fast armored infantry carrier.'},
  tank: {name:'Main Battle Tank',  short:'MBT', cls:'armored', cost:40, oil:6, metal:5, iron:11, elec:0, rare:0, mp:12, atk:6, def:4, hp:14, spd:6,  build:48, upk:3, fuel:1,   req:{b:'fac', l:1}, tech:null,  role:'Main battle tank: strong all-rounder.'},
  jet:  {name:'Strike Fighter',    short:'STK', cls:'air',     cost:70, oil:12, metal:10, iron:0, elec:10, rare:0, mp:6,  atk:8, def:3, hp:9,  spd:18, build:72, upk:6, fuel:2,   req:{b:'air', l:1}, tech:'air1', vs:{armored:1.6}, role:'Strike jet: hunts armor. Cannot capture.'},
  int:  {name:'Interceptor',       short:'INT', cls:'air',     cost:62, oil:10, metal:8, iron:0, elec:8, rare:0, mp:5,  atk:6, def:4, hp:9,  spd:20, build:60, upk:5, fuel:2,   req:{b:'air', l:1}, tech:'air1', vs:{air:2.0, soft:0.4, armored:0.4, naval:0.6}, vsU:{swarm:1.2, sdrone:2.2, drone:1.8, bomb:2.4, awacs:2.6, mpa:2.4}, role:'Fighter: double damage to aircraft; patrols intercept strikes, bombers and drones over one province.'},
  frig: {name:'Frigate',           short:'FRG', cls:'naval',   cost:52, oil:6, metal:6, iron:12, elec:4, rare:0, mp:6,  atk:4, def:5, hp:14, spd:6,  build:60, upk:3, fuel:1,   req:{b:'yard', l:1}, tech:null,  vs:{air:1.8, soft:0.5, armored:0.4}, vsU:{swarm:1.0, sdrone:1.8}, role:'Escort: protects troop convoys, shoots down aircraft and patrol planes.'},
  sub:  {name:'Attack Submarine',  short:'SUB', cls:'naval',   cost:48, oil:4, metal:5, iron:10, elec:4, rare:0, mp:5,  atk:6, def:2, hp:9,  spd:5.4, build:60, upk:2, fuel:1,   req:{b:'yard', l:1}, tech:null,  vs:{naval:2.0, soft:0, armored:0, air:0}, role:'Hunter: double damage to ships, harmless to everything else.'},
  crui: {name:'Cruiser',           short:'CRU', cls:'naval',   cost:66, oil:10, metal:10, iron:20, elec:6, rare:0, mp:8,  atk:7, def:6, hp:20, spd:5.8, build:96, upk:5, fuel:2,   req:{b:'yard', l:2}, tech:null,  vs:{naval:1.3, soft:1.1, armored:0.8, air:0.6}, role:'Capital ship: bombards coasts next to its sea zone.'},
  mlrs: {name:'Rocket Artillery',  short:'MRL', cls:'armored', cost:52, oil:5, metal:5, iron:10, elec:3, rare:0, mp:8,  atk:8, def:2, hp:9,  spd:7,  build:54, upk:3, fuel:1, req:{b:'fac', l:2}, tech:'art2', vs:{soft:1.5, armored:0.9}, role:'Rocket artillery on wheels: shells enemies up to 2 provinces away. Fragile in close combat.'},
  spec: {name:'Special Forces', short:'SOF', cls:'soft', cost:50, oil:0, metal:5, iron:0, elec:2, rare:0, mp:8,  atk:5, def:4, hp:10, spd:5,  build:42, upk:2, fuel:0,   req:{b:'rec', l:1}, tech:'inf3', role:'Elite raiders: hidden from radar and satellites, +40% attack in forest, mountains and cities, cross rough ground fast.'},
  carr: {name:'Aircraft Carrier', short:'CVN', cls:'naval',   cost:124, oil:14, metal:15, iron:32, elec:10, rare:3, mp:10, atk:3, def:6, hp:26, spd:5, build:120, upk:7, fuel:2, req:{b:'yard', l:2}, tech:'nav2', vs:{air:1.4, soft:0.4, armored:0.3, naval:0.6}, role:'Mobile airbase: air wings can base on it and strike far from home. Weak alone; escort it.'},
  heli: {name:'Attack Helicopter', short:'GUN', cls:'air',     cost:56, oil:8, metal:8, iron:0, elec:7, rare:0, mp:6,  atk:7, def:4, hp:10, spd:12, build:54, upk:4, fuel:1.5, req:{b:'air', l:1}, tech:'heli1', vs:{armored:2.2, soft:1.3, air:0.3, naval:0.5}, role:'Attack helicopter: short range (6 hexes), tears through armor and infantry.'},
  drone:{name:'Recon UAV',         short:'UAV', cls:'air', dr:'uav', cost:26, oil:2, metal:4, iron:0, elec:5, rare:0, mp:1,  atk:0, def:1, hp:4, spd:16, build:30, upk:1, fuel:0.5, req:{b:'air', l:1}, tech:'drone1', vs:{soft:1.0, armored:1.2, air:0, naval:0.6}, vsU:{sam:1.3, jam:1.6, art:1.4, mlrs:1.4}, role:'Recon UAV (levels I–V by research): loiters over a province and identifies every enemy force around it — type, size, level and health. Levels I–III are unarmed; UAV IV adds light missiles, UAV V more missiles, range and survivability. Jammers and SAMs shoot it down.'},
  para: {name:'Paratroopers',short:'PAR', cls:'soft',   cost:36, oil:0, metal:4, iron:0, elec:0, rare:0, mp:10, atk:4, def:3, hp:10, spd:4,  build:36, upk:1.5, fuel:0,   req:{b:'rec', l:1}, req2:{b:'air', l:1}, tech:'para1', role:'Elite infantry. From a province with your airbase, can be air-dropped up to 9 hexes away.'},
  // V3 air: drones, the jammer that counters them, and specialised aircraft. dr = drone kind (swarm / uav / sdrone); pack = units per recruit card
  swarm:{name:'Swarm Drones',      short:'SWM', cls:'air', dr:'swarm', pack:6, cost:40, oil:2, metal:4, iron:0, elec:5, rare:0, mp:2, atk:1.6, def:0.5, hp:2, spd:14, build:30, upk:0.25, fuel:0.05, req:{b:'fac', l:2}, tech:'swarm1', vs:{soft:1.3, armored:0.35, air:0, naval:0.25}, vsU:{sam:1.8, jam:2.0, art:1.6, mlrs:1.0, ifv:0.9, at:1.2}, role:'Cheap loitering munitions, six per card, built in an Army Base II city and launched from truck launchers (they can rebase to any of your cities, with field repairs only): short-range strikes (1,080 km) that saturate air defences (SAMs and jammers fire less for hours) and shred infantry, guns and light vehicles. Weak against tanks; jammers and SAMs down them fast.'},
  sdrone:{name:'Strike Drone', short:'SDR', cls:'air', dr:'sdrone', cost:48, oil:3, metal:6, iron:0, elec:7, rare:1, mp:2, atk:5, def:1, hp:5, spd:12, build:42, upk:1.5, fuel:0.4, req:{b:'air', l:1}, tech:'sdrone1', vs:{soft:1.1, armored:1.4, air:0, naval:0.9}, vsU:{sam:1.5, jam:1.8, art:1.6, mlrs:1.6}, role:'Long-range precision drone (3,600 km): hits units and knocks out a building for 24 h (sometimes a whole level). Fragile: SAMs, fighters and jammers kill it.'},
  jam:  {name:'Mobile Jammer',     short:'JAM', cls:'soft',    cost:34, oil:1, metal:4, iron:0, elec:7, rare:0, mp:6,  atk:1, def:2, hp:7,  spd:5,  build:30, upk:1.5, fuel:0, req:{b:'fac', l:1}, tech:'jam1', vs:{soft:0.3, armored:0.2, air:0.3, naval:0}, role:'Anti-drone electronic warfare: downs and jams drones (swarms best, UAVs and strike drones less) over its province and the neighbouring ones, and blunts the damage of those that get through. No use against manned aircraft; weak in a fight.'},
  bomb: {name:'Heavy Bomber', short:'HBR', cls:'air', bmb:1, cost:132, oil:20, metal:24, iron:6, elec:14, rare:0, mp:6, atk:10, def:2, hp:14, spd:9, build:96, upk:7, fuel:3, req:{b:'air', l:2}, tech:'bomb1', vs:{soft:1.2, armored:0.8, naval:0.6, air:0.3}, role:'Strategic bomber: very long range (6,100 km) but slow; devastates cities (troops there take 50% more), wrecks building levels and roads. Easy prey for fighters and SAMs: escort it or clear the sky first.'},
  mpa:  {name:'Maritime Patrol Aircraft', short:'MPA', cls:'air', cost:74, oil:10, metal:12, iron:0, elec:11, rare:0, mp:5, atk:6, def:2, hp:10, spd:14, build:66, upk:4, fuel:2, req:{b:'air', l:1}, tech:'mpa1', vs:{naval:1.3, soft:0.2, armored:0.1, air:0.1}, vsU:{sub:2.5}, role:'Sub hunter: patrols a sea area for 12 h, spotting every ship and submerged submarine around it (2,000 km) and attacking hostile ships, subs above all. Frigates and fighters shoot it down.'},
  awacs:{name:'AWACS',              short:'AEW', cls:'air',     cost:96, oil:10, metal:14, iron:0, elec:18, rare:5, mp:5, atk:0, def:2, hp:10, spd:15, build:72, upk:5, fuel:2, req:{b:'air', l:2}, tech:'awacs1', vs:{soft:0, armored:0, air:0, naval:0}, role:'Airborne radar: orbits for 16 h and detects every enemy force within 3,000 km — location only, as unidentified contacts (?). Your fighters under it cover neighbouring provinces and fight 25% better. Unarmed: protect it from fighters.'},
  asf:  {name:'Air Superiority Fighter', short:'ASF', cls:'air', cost:78, oil:11, metal:12, iron:0, elec:12, rare:2, mp:5, atk:9, def:5, hp:10, spd:22, build:72, upk:6, fuel:2, req:{b:'air', l:2}, tech:'asf1', vs:{air:2.6, soft:0.25, armored:0.2, naval:0.3}, vsU:{bomb:3.8, awacs:3.6, mpa:3.4, drone:2.8, sdrone:3.0, swarm:2.0}, role:'Air superiority fighter: patrols cover the province and its neighbours, intercepting strikes, bombers and drones and hunting loitering UAVs, AWACS and patrol planes. Weak against ground targets.'},
  // bmb: bomb load as a share of the Heavy Bomber's (bombers wreck cities, buildings and roads); lo: low-observable airframe, the share of hits that find it
  // (ad: Mobile SAMs, frigates and cruisers; air: fighters and other aircraft), each measured against what the same shooter does to a Heavy Bomber
  stealth:{name:'Stealth Bomber', short:'STB', cls:'air', bmb:0.6, lo:{ad:0.35, air:0.4}, cost:330, oil:26, metal:34, iron:6, elec:40, rare:8, mp:8, atk:8, def:4, hp:12, spd:10, build:168, upk:14, fuel:3.5, req:{b:'air', l:3}, tech:'bomb3', vs:{soft:1.0, armored:0.7, naval:0.6, air:0.2}, role:'Stealth bomber (Airbase III): the Heavy Bomber\u2019s reach (6,100 km) with 60% of its bomb load. Hard to find: SAMs, frigates and cruisers hit it 35% as often as a Heavy Bomber, fighters 40% as often. In flight only a Mobile SAM or jammer in or next to the province under it sees it; an AWACS gets an unidentified contact at half its radar range. Very expensive.'},
};
const UNIT_NICK = {inf:'Infantry', at:'Anti-tank', art:'Artillery', sam:'SAM', ifv:'IFV', tank:'Tank', jet:'Strike', int:'Interceptor', frig:'Frigate', sub:'Submarine', crui:'Cruiser', mlrs:'MLRS', spec:'SOF', carr:'Carrier', heli:'Helicopter', drone:'UAV', para:'Paras', swarm:'Swarm', sdrone:'Strike drone', jam:'Jammer', bomb:'Bomber', mpa:'MPA', awacs:'AWACS', asf:'ASF', stealth:'Stealth bomber'};
const MISSILES = {
  cm: {name:'Cruise Missile',    short:'CM', cost:60,  oil:10, metal:10, iron:4, elec:8, rare:3, build:36, range:28, speed:9,  power:7,  tech:'msl1', desc:'Flies low and fast. Devastates the forces in one province.'},
  bm: {name:'Ballistic Missile', short:'BM', cost:140, oil:20, metal:24, iron:10, elec:16, rare:8, build:72, range:90, speed:22, power:16, tech:'msl2', desc:'Climbs into space and falls on its target: massive damage, wrecks a building, shakes morale.'},
};
const CLASSES = ['soft', 'armored', 'air', 'naval'];
const CLASS_M = {soft:{soft:1.0, armored:0.5, air:0.2, naval:0.2}, armored:{soft:1.2, armored:1.0, air:0.2, naval:0.3}, air:{soft:1.2, armored:1.3, air:1.0, naval:1.0}, naval:{soft:0.8, armored:0.6, air:0.6, naval:1.0}};
const mult = (t, k) => (UNITS[t].vs && UNITS[t].vs[k] != null) ? UNITS[t].vs[k] : CLASS_M[UNITS[t].cls][k];
// low-observable aircraft (UNITS[s].lo): every shooter gets a counter entry against them, a share of what it does to a Heavy Bomber:
// lo.ad for Mobile SAMs, frigates and cruisers (LO_AD), lo.air for aircraft; guns and everything else hit them like any aircraft
const LO_AD = ['sam', 'frig', 'crui'];
const isBmb = t => !!(UNITS[t] && UNITS[t].bmb);   // a bomber type (Heavy Bomber, Stealth Bomber)
for (const s in UNITS){ const L = UNITS[s].lo; if (!L) continue;
  for (const t in UNITS){ const U = UNITS[t], f = LO_AD.includes(t) ? L.ad : U.cls === 'air' ? L.air : 0; if (!f) continue;
    (U.vsU || (U.vsU = {}))[s] = (U.vsU && U.vsU.bomb != null ? U.vsU.bomb : mult(t, 'air'))*f; } }
// unit-specific counters (vsU, e.g. swarms vs SAMs, maritime patrol vs subs, fighters vs bombers): a damage channel 'u_<type>' next to the four classes.
// Only air missions fill these channels (sideAV); everywhere else hurt() falls back to the class value.
const UK = Object.fromEntries(Object.keys(UNITS).map(t => [t, 'u_' + t]));
const VSU_T = [...new Set(Object.values(UNITS).flatMap(U => Object.keys(U.vsU || {})))];
const multU = (t, u) => (UNITS[t].vsU && UNITS[t].vsU[u] != null) ? UNITS[t].vsU[u] : mult(t, UNITS[u].cls);
// ab: the short top-bar label; use / src: what it is for and where it comes from (top-bar tooltips, market, field manual); map: the Resources map legend
const RES = [
  {k:'cash',  name:'Money',    ab:'Money', unit:'M', pre:'$', use:'pays for everything: units, buildings, research, roads, and every unit’s daily upkeep', src:'taxes from your provinces (cities most; money cities 60% more, and +25% per Arms Industry level there), trade routes', map:'money cities and populous land'},
  {k:'oil',   name:'Oil',      ab:'Oil',   unit:'',  pre:'', use:'fuel: vehicles, aircraft and ships burn it daily and need some to build; a shortage slows and weakens them', src:'oil cities (+25% per Arms Industry level), a little from oil fields in the countryside, your capital, trade', map:'oil cities, oil fields'},
  {k:'metal', name:'Materials', ab:'Mat.', unit:'', pre:'', use:'nearly every unit, building, road and research project', src:'materials cities (+25% per Arms Industry level), a little from ore deposits, your capital, trade', map:'materials cities, ore deposits'},
  {k:'iron',  name:'Iron',     ab:'Iron',  unit:'',  pre:'', use:'armor, artillery, warships, Army Bases, forts and railways; those units also use 4% of their iron a day in maintenance (a shortage weakens them)', src:'iron cities (+25% per Arms Industry level), a little from ore deposits and iron hills, your capital, trade', map:'iron cities, ore deposits, iron hills'},
  {k:'elec',  name:'Electronics', ab:'Elec.', unit:'', pre:'', use:'aircraft, drones, air defence, missiles, satellites and high-speed rail; those units also use 2% of their electronics a day in maintenance (a shortage weakens them)', src:'electronics cities (+25% per Arms Industry level), your capital, trade', map:'electronics cities'},
  {k:'rare',  name:'Rare Materials', ab:'Rare Mat.', unit:'', pre:'', use:'research: every technology costs it (more each tier); also advanced aircraft, carriers and missiles', src:'rare-earth cities (only one or two per country, many countries have none; +25% per Arms Industry level), your capital, trade', map:'rare-earth cities'},
  {k:'mp',    name:'Manpower', ab:'Manp.', unit:'k', pre:'', use:'crews for every unit', src:'population, Recruiting Offices (+3k to +9k a day by level), Mobilisation', map:'populous countryside'},
];
const RLBL = {cash:'money', oil:'oil', metal:'materials', iron:'iron', elec:'electronics', rare:'rare materials', mp:'manpower'}, rlbl = k => RLBL[k] || k;   // player-facing resource words (the save key stays 'metal')
const yword = (k, v) => v === 1 && k === 'metal' ? 'material' : v === 1 && k === 'rare' ? 'rare material' : rlbl(k);   // '1 material', '3 materials'
// everything a price can ask for; the goods with no daily upkeep (their world demand is what nations spend on them); goods traded on the market and in deals
const CK = ['cash', 'oil', 'metal', 'iron', 'elec', 'rare', 'mp'], SPEND_K = ['metal', 'iron', 'elec', 'rare'], DEAL_K = ['cash', 'oil', 'metal', 'iron', 'elec', 'rare'];
// a price {cash, oil, metal, iron, elec, rare, mp} (any subset): can nation N pay it, pay it, and say it in words
function hasC(N, c){ for (let i = 0; i < CK.length; i++){ const k = CK[i], q = c[k]; if (q > 0 && !((N[k] || 0) >= q)) return false; } return true; }
function payC(N, c){ for (let i = 0; i < CK.length; i++){ const k = CK[i], q = c[k]; if (q > 0){ N[k] = (N[k] || 0) - q; if (SPEND_K.includes(k)) useRes(k, q); } } }
const costParts = c => CK.filter(k => c[k] > 0).map(k => k === 'cash' ? `$${c[k]}M` : k === 'mp' ? `${c[k]}k manpower` : `${c[k]} ${yword(k, c[k])}`);
const costTxt = (c, sep = ' · ') => costParts(c).join(sep);
// what is missing to pay c, in words ('12 more electronics'), or ''
const missTxt = (N, c) => CK.filter(k => c[k] > 0 && (N[k] || 0) < c[k]).map(k => { const q = Math.ceil(c[k] - (N[k] || 0)); return k === 'cash' ? `$${q}M more` : k === 'mp' ? `${q}k more manpower` : `${q} more ${yword(k, q)}`; }).join(', ');
const pluN = (n, w, p) => `${n} ${n === 1 ? w : (p || w + 's')}`;   // '1 unit', '6 units'
const artA = w => (/^[aeiou]/i.test(String(w)) ? 'an ' : 'a ') + w;   // 'an Iran–Indonesia convoy'
const UT = Object.keys(UNITS);
// maintenance: each day a unit uses 4% of the iron and 2% of the electronics it was built with (spare parts, servicing, avionics); a swarm card's price covers six drones.
// It is the steady demand for both goods: without it they were spent once and piled up all game
const MAINT_F = {iron:0.04, elec:0.02}, MAINT = Object.fromEntries(UT.map(t => [t, {iron:(UNITS[t].iron || 0)*MAINT_F.iron/(UNITS[t].pack || 1), elec:(UNITS[t].elec || 0)*MAINT_F.elec/(UNITS[t].pack || 1)}]));
// terrain: def = damage taken by the holder is divided by it; armor = armored attackers' punch; spd = ground movement (with TERR_F per movement type);
// foot / spec / art = combat factor of infantry, special forces and guns fighting there (both sides); cold = non-arctic ground forces; sup = supply-line cost
const TERRAIN = {
  plains:   {name:'Plains',     def:1.00, armor:1.00, spd:1.00, col:'#7d8f45', foot:1.00, spec:1.00, art:1.00, sup:1.00},
  forest:   {name:'Forest',     def:1.15, armor:0.75, spd:0.80, col:'#2e6b34', foot:1.20, spec:1.40, art:0.85, sup:1.00},
  hills:    {name:'Hills',      def:1.20, armor:0.90, spd:0.85, col:'#a8834a', foot:1.10, spec:1.25, art:1.05, sup:1.10},
  mountain: {name:'Mountains',  def:1.30, armor:0.70, spd:0.60, col:'#7b6a5c', foot:1.25, spec:1.40, art:0.85, sup:1.30},
  urban:    {name:'Urban',      def:1.25, armor:0.75, spd:1.00, col:'#a3a39e', foot:1.20, spec:1.40, art:1.00, sup:1.00},
  marsh:    {name:'Marsh',      def:1.15, armor:0.70, spd:0.65, col:'#3f8a86', foot:1.00, spec:1.20, art:0.85, sup:1.15},
  desert:   {name:'Desert',     def:1.00, armor:1.05, spd:0.90, col:'#d8bb6e', foot:1.00, spec:1.00, art:1.00, sup:1.50},
  tundra:   {name:'Tundra',     def:1.05, armor:0.90, spd:0.80, col:'#93a7a6', foot:1.00, spec:1.00, art:1.00, sup:1.20, supA:1.10},
  snow:     {name:'Snow & ice', def:1.10, armor:0.80, spd:0.60, col:'#e8f0f5', foot:1.00, spec:1.15, art:0.90, sup:1.50, supA:1.30, cold:0.90},
};
const TERR_KEYS = Object.keys(TERRAIN);
const terr = p => TERRAIN[G.P[p].terrain] || TERRAIN.plains;
// river crossings: a leg across a river line without a highway bridge takes 30% longer (10% with one); attackers across it fight at −20%
const RIVER_X = 1.3, RIVER_XB = 1.1, RIVER_ATK = 0.8;
const riverX = (from, to) => G.P[from].river.has(to) && !G.P[to].sea && !G.P[from].sea;
// per-unit-type terrain combat factor: [atk 0/1][cold 0/1] -> {type: factor}; aircraft and ships ignore terrain
const FOOT_U = {inf:1, para:1, at:1}, GUN_U = {art:1, mlrs:1}, TUF = {};
function tuf(k, atk, cold){ const key = k + (atk ? 1 : 0) + (cold ? 1 : 0); let r = TUF[key]; if (r) return r; const T = TERRAIN[k] || TERRAIN.plains; r = TUF[key] = {};
  for (const t of Object.keys(UNITS)){ const c = UNITS[t].cls; let f = 1;
    if (c !== 'air' && c !== 'naval'){ f = t === 'spec' ? T.spec : FOOT_U[t] ? T.foot : GUN_U[t] ? T.art : 1; if (c === 'armored' && atk) f *= T.armor; if (cold) f *= T.cold || 1; }
    r[t] = f; } return r; }
// nations whose home soil includes polar or ice provinces are trained for snow and ignore its cold penalty
let ARC = {S:null, v:null};
function arctic(o){ if (o < 0 || !S) return true; if (ARC.S !== S || !ARC.v || ARC.v.length !== S.nations.length){ const c = S.nations.map(() => 0), H0 = S.home || S.owner;
    for (let p = 0; p < G.P.length; p++){ const h = H0[p], t = G.P[p].terrain; if (h >= 0 && h < c.length && (t === 'snow' || t === 'tundra')) c[h]++; } ARC = {S, v:c.map(x => x >= 4)}; } return ARC.v[o]; }
// an army's attack-weighted terrain fit: 1 = neutral, < 1 its mix suffers there (tanks in marsh), > 1 it thrives (infantry in forest)
function fitW(a){ const w = []; let tot = 0; for (const t of UT){ if (!a.u[t]) continue; const v = a.u[t]*UNITS[t].atk*UNITS[t].hp; w.push([t, v]); tot += v; } if (tot) for (const e of w) e[1] /= tot; return w; }
function fitOf(w, k, atk, cold){ if (!w.length) return 1; const T = tuf(k, atk, cold); let s = 0; for (const [t, v] of w) s += v*T[t]; return s; }
function terrFit(a, p, atk){ if (G.P[p].sea || !count(a)) return 1; return fitOf(fitW(a), G.P[p].terrain || 'plains', atk, !arctic(a.owner)); }
// roughness of a terrain for armor (0 open ground .. 1 tank trap), used by the AI's recruiting
const rough = k => Math.max(0, Math.min(1, (1 - (TERRAIN[k] || TERRAIN.plains).armor)/0.3));
/* Speeds on water (hexes/day, one hex ~180 km), slowest to fastest: embarked ground troops (transports) 3.6 < carriers 5 < submarines 5.4 <
   cruisers 5.8 < frigates 6, against 4 for infantry on land. Escorted convoys +15%; sea lanes (major shipping routes) +12%. */
const SEA_SPEED = 3.6;                // hexes/day for embarked ground units (troop transports)
const LANE_F = 1.12;                  // sea-lane bonus for every force at sea
const KM_HEX = 180;                   // one map hex is roughly 180 km
// Recruiting Office, levels I-V: what it costs to reach each level (money $M, materials, iron, electronics) and how many days it takes.
// A building with such a table (BUILD[k].lv) is priced from it, not from the 1.6x-per-level rule (buildCost in rules/production.js)
const REC_LV = [null, {cash:40, days:2}, {cash:75, metal:10, days:3}, {cash:130, metal:20, iron:10, days:4}, {cash:220, metal:35, iron:20, days:5}, {cash:360, metal:55, iron:30, elec:15, days:6}];
const BUILD = {
  fac:  {name:'Army Base',         max:5, cost:25, ecost:55, metal:12, iron:12, days:3, where:'city', desc:'Unlocks and trains ground units. Level I: mobile artillery, main battle tanks, IFVs and jammers; level II: mobile SAMs, rocket artillery and swarm drones. Each level adds a training line; ground units train 20% faster per level up to III, then 5% per level. No income. Each Army Base you already own in another province makes the next one cost 40% more.'},
  air:  {name:'Airbase',           max:5, cost:85, metal:22, elec:5, days:4, where:'city', desc:'Needed for strike fighters and interceptors (with Jet Engines research). Levels II\u2013V: aircraft build 10% faster and wings based here reach 1 hex farther per level above I.'},
  arms: {name:'Arms Industry',     max:5, cost:40, metal:12, iron:6, days:3, where:'city', desc:'Raises this city\u2019s main resource (money, oil, materials, iron, electronics or rare materials) by 25% per level. Each Arms Industry you already own in another province makes the next one cost 40% more.'},
  rec:  {name:'Recruiting Office', max:5, cost:40, metal:0,  days:2, where:'any',  lv:REC_LV, desc:'Needed to mobilize infantry in this city: Motorized Infantry, Anti-Tank Infantry, Special Forces and (with an Airbase) Paratroopers. Each level: every unit trained in this city trains 10% faster (50% at level V) and +1.5k manpower a day (+3k at level I, +9k at level V).'},
  fort: {name:'Fortifications',    max:3, cost:36, metal:8, iron:8, days:2, where:'any',  desc:'Defenders here take 20% less damage per level.'},
  silo: {name:'Missile Silo',      max:5, cost:140, metal:40, iron:15, elec:10, days:5, where:'city', desc:'Builds and stores cruise and ballistic missiles (needs Strategic research). Levels II\u2013V: missiles build 10% faster per level above I.'},
  yard: {name:'Naval Yard',        max:5, cost:75, metal:15, iron:15, days:4, where:'port', desc:'Coastal cities only. Level I builds Frigates and Submarines, level II Cruisers. Damaged ships repair fast here. Levels III\u2013V: ships build 10% faster and repair 20% faster per level above II.'},
};
const BK = Object.keys(BUILD);
// ---- economy: every city produces ONE main resource (P.main, set from the map in rules/map.js cityMains; a city without one is a money city)
const ECO_Y = {cash:1.6, oil:9.4, metal:8.2, iron:7.6, elec:3.3, rare:4.7};   // a city's main resource a day: money is a factor on the city's money, the rest are units (times the city-size factor)
const ECO_RUR = {oil:2.4, metal:0.8, ironOre:0.5, iron:0.6};                  // the countryside trickle: an oil field, an ore deposit (materials and iron), iron hills
const ECO_CAPITAL = {oil:3, metal:6, iron:4.5, elec:1.5, rare:2.5};           // the capital's state industry, labs and recycling
const ARMS_PCT = 0.25, ECO_CASH_ALL = 1.10, ECO_MP_CITY = 2.0;                // Arms Industry: +25% of the city's main resource per level; every nation's money +10%; a city's manpower base
const ECO_SHARE = {cash:0.17, oil:0.19, metal:0.21, iron:0.19, elec:0.17, rare:0.07}, RARE_DEP = 1.4;   // world mix the city resources aim at; a rare-earth district is a deposit of 1.4 or more
const MAIN_NAME = {cash:'money', oil:'oil', metal:'materials', iron:'iron', elec:'electronics', rare:'rare materials'};
// buildings removed by the city-resource economy: their level-I price, refunded when an old save is loaded (rules/state.js ecoMigrate)
const ECO_OLD = {ref:{name:'Refinery', cost:50, metal:10, iron:5}, fdy:{name:'Foundry', cost:50, metal:10, iron:0}, mine:{name:'Rare Earth Mine', cost:55, metal:10, iron:0}};
const ECO_OLD_TECH = {eco1:'Industrial Automation', eco2:'National Service', eco3:'Oil Refining'};   // the removed Economy research branch: a nation that researched one keeps its bonus (has(n, 'eco1') ...)
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
// every unit can be unlocked from day one; a tech only needs another when it upgrades that same unit (UAV I to V, Infantry, Armor, Artillery, jets),
// or for the missile line (Cruise, then Ballistic, Anti-Missile Shield and satellites)
const TECH = [
  {id:'inf1',  branch:'Infantry',  name:'Ceramic Body Armor',   cost:60,  days:3, req:null,    desc:'Infantry and anti-tank defense +1',       fx:{inf:{def:1}, at:{def:1}}},
  {id:'inf2',  branch:'Infantry',  name:'Mechanized Infantry',  cost:110, days:5, req:'inf1',  desc:'Infantry attack +2 and speed +1',      fx:{inf:{atk:2, spd:1}, at:{atk:1}}},
  {id:'inf3',  branch:'Infantry',  name:'Special Forces',       cost:180, days:7, req:'inf2',  desc:'Infantry attack +1 and defense +1',    fx:{inf:{atk:1, def:1}}},
  {id:'tank1', branch:'Armor',     name:'Composite Armor',      cost:90,  days:4, req:null,    desc:'Armor defense +2',                     fx:{tank:{def:2}}},
  {id:'tank2', branch:'Armor',     name:'Smoothbore Main Gun',  cost:150, days:6, req:'tank1', desc:'Armor attack +3, IFV attack +2, anti-tank attack +1', fx:{tank:{atk:3}, ifv:{atk:2}, at:{atk:1}}},
  {id:'tank3', branch:'Armor',     name:'Turbine Engines',      cost:200, days:7, req:'tank2', desc:'Armor speed +2 and attack +1',         fx:{tank:{spd:2, atk:1}}},
  {id:'art1',  branch:'Artillery', name:'Counter-Battery Radar',cost:80,  days:4, req:null,    desc:'Artillery attack +2',                  fx:{art:{atk:2}}},
  {id:'art2',  branch:'Artillery', name:'Rocket Artillery',     cost:150, days:6, req:'art1',  desc:'Artillery attack +3 and defense +2',   fx:{art:{atk:3, def:2}}},
  {id:'art3',  branch:'Artillery', name:'Guided Shells',        cost:210, days:8, req:'art2',  desc:'Artillery attack +2 and speed +1',     fx:{art:{atk:2, spd:1}}},
  {id:'air1',  branch:'Air',       name:'Jet Engines',          cost:120, days:5, req:null,    desc:'Unlocks strike fighters and interceptors',                  fx:{}},
  {id:'air2',  branch:'Air',       name:'Precision Munitions',  cost:180, days:6, req:'air1',  desc:'Jet attack +2 (Strikers and Interceptors)', fx:{jet:{atk:2}, int:{atk:2}}},
  {id:'air3',  branch:'Air',       name:'Stealth Airframes',    cost:260, days:8, req:'air2',  desc:'Strike Jet defense +3',                fx:{jet:{def:3}}},
  {id:'log1',  branch:'Logistics', name:'Motorized Supply',     cost:110, days:4, req:null,    desc:'All forces move 20% faster',           fx:{}},
  {id:'log2',  branch:'Logistics', name:'Combat Engineers',     cost:130, days:5, req:null,  desc:'Capture 30% faster; forts cost half; roads and railways 25% cheaper and faster to build',  fx:{}},
  {id:'log3',  branch:'Logistics', name:'Field Hospitals',      cost:170, days:7, req:null,  desc:'Your forces take 15% less damage',     fx:{}},
  {id:'msl1',  branch:'Strategic', name:'Cruise Missiles',      cost:160, days:6, req:null,    desc:'Missile Silos can build Cruise Missiles', fx:{}},
  {id:'msl2',  branch:'Strategic', name:'Ballistic Missiles',   cost:240, days:8, req:'msl1',  desc:'Silos can build Ballistic Missiles',   fx:{}},
  {id:'msl3',  branch:'Strategic', name:'Anti-Missile Shield',  cost:220, days:7, req:'msl2',  desc:'Your SAMs and Frigates intercept missiles twice as well', fx:{}},
  {id:'sat1',  branch:'Strategic', name:'Reconnaissance Satellites', cost:200, days:6, req:'msl1', desc:'Launch up to 3 spy satellites from a silo or your capital: each sweeps the globe once a day, revealing a wide swath', fx:{}},
  {id:'nav1',  branch:'Naval',     name:'Naval Gunnery',       cost:90,  days:4, req:null,    desc:'Frigates +1 attack, Cruisers +2 attack', fx:{frig:{atk:1}, crui:{atk:2}}},
  {id:'nav2',  branch:'Naval',     name:'Carrier Aviation',    cost:170, days:7, req:null,  desc:'Unlocks aircraft carriers (Naval Yard II): mobile airbases at sea', fx:{}},
  {id:'nav3',  branch:'Naval',     name:'Amphibious Doctrine', cost:190, days:7, req:null,  desc:'Troops landing from the sea fight at 90% instead of 67% on their first day', fx:{}},
  {id:'asf1',  branch:'Air',       name:'Air Superiority Fighters', cost:190, days:7, req:null, desc:'Unlocks air superiority fighters (Airbase II): patrols cover neighbouring provinces and beat bombers, AWACS, patrol planes and drones', fx:{}},
  {id:'awacs1', branch:'Air',      name:'Airborne Early Warning', cost:170, days:6, req:null, desc:'Unlocks AWACS aircraft (Airbase II): locate every enemy force in a huge radius, as unidentified contacts', fx:{}},
  {id:'mpa1',  branch:'Air',       name:'Maritime Patrol',      cost:140, days:5, req:null,  desc:'Unlocks maritime patrol aircraft: find submerged submarines and hunt ships', fx:{}},
  {id:'bomb1', branch:'Air',       name:'Strategic Bombers',    cost:230, days:8, req:null,  desc:'Unlocks heavy bombers (Airbase II): very long range, wreck cities and buildings', fx:{}},
  {id:'bomb2', branch:'Air',       name:'Strategic Bomber Upgrade', cost:260, days:8, req:'bomb1', desc:'Heavy Bomber range +720 km and attack +1', fx:{bomb:{atk:1}}},
  {id:'bomb3', branch:'Air',       name:'Stealth Bombers',      cost:420, days:11, req:'bomb2', req2:'air3', desc:'Unlocks stealth bombers (Airbase III): the Heavy Bomber\u2019s reach with 60% of its bombs; SAMs hit them 35% as often, fighters 40% as often, and only a SAM or jammer close by sees them. Needs Stealth Airframes too', fx:{}},
  {id:'drone1', branch:'Drones',   name:'UAV I · Unmanned Recon', cost:90, days:4, req:null, desc:'Unlocks recon UAVs: loiter over any area in range and identify every enemy force around it (recon only, no weapons)', fx:{}},
  {id:'uav2',  branch:'Drones',    name:'UAV II · Long-Endurance Optics', cost:110, days:4, req:'drone1', desc:'UAVs see farther, loiter 16 h, reach farther and are harder to shoot down', fx:{drone:{def:1}}},
  {id:'uav3',  branch:'Drones',    name:'UAV III · Low-Observable Airframe', cost:140, days:5, req:'uav2', desc:'UAVs loiter 20 h with a wider view; stealthy airframe: air defences hit 40% less', fx:{drone:{def:1}}},
  {id:'uav4',  branch:'Drones',    name:'UAV IV · Armed UAV', cost:170, days:6, req:'uav3', desc:'UAVs carry light missiles: one precise salvo per sortie on units (and sometimes a building), still spotting', fx:{drone:{atk:3}}},
  {id:'uav5',  branch:'Drones',    name:'UAV V · Hunter-Killer', cost:210, days:7, req:'uav4', desc:'Two salvos per sortie, heavier missiles, longer range and loiter, best survivability', fx:{drone:{atk:2, def:2}}},
  {id:'jam1',  branch:'Drones',    name:'Counter-Drone Jamming', cost:80, days:3, req:null,   desc:'Unlocks Static Jammers: down and jam drones over a province and its neighbours', fx:{}},
  {id:'swarm1', branch:'Drones',   name:'Swarm Drones',         cost:120, days:5, req:null, desc:'Unlocks swarm drones (six per card, Army Base II): saturate air defences, shred light units', fx:{}},
  {id:'sdrone1', branch:'Drones',  name:'Strike Drones',        cost:150, days:6, req:null,  desc:'Unlocks strike drones: long-range precision hits on units and buildings', fx:{}},
  {id:'heli1',  branch:'Airmobile', name:'Rotary Wing',         cost:150, days:6, req:null, desc:'Unlocks attack helicopters: short-range attack helicopters that shred armor', fx:{}},
  {id:'para1',  branch:'Airmobile', name:'Airborne Forces',     cost:190, days:7, req:null,  desc:'Unlocks paratroopers, air-dropped behind enemy lines', fx:{}},
];
// research prices: money, materials and rare materials (the main research resource: by tier, a little more for the dearer projects); no project costs oil
for (const t of TECH){ const tier = t.req ? (TECH.find(x => x.id === t.req).req ? 3 : 2) : 1, base = t.cost; t.tier = tier; t.cost = Math.round(base*0.6); t.metal = [0, 20, 35, 60][tier]; t.rare = [0, 18, 44, 78][tier] + Math.round(base/12); t.oil = 0; }
const techCost = T => ({cash:T.cost, metal:T.metal, rare:T.rare, oil:T.oil});
const TECH_BY = Object.fromEntries(TECH.map(t => [t.id, t]));
// national doctrines, chosen at the start of a campaign
const DOCTRINES = {
  precision:{name:'Precision', tag:'Fewer, better forces', desc:'Units attack 10% harder and research runs 15% faster, but every unit costs 15% more.', atk:1.10, def:1, cost:1.15, build:1, res:0.85},
  mass:{name:'Mass', tag:'Numbers win wars', desc:'Units cost 15% less and train 25% faster, but attack 5% weaker.', atk:0.95, def:1, cost:0.85, build:0.75, res:1},
  bastion:{name:'Defence in Depth', tag:'Hold every inch', desc:'Forces defending your own provinces take 15% less damage, fortifications build twice as fast, and upkeep is 10% lower.', atk:1, def:1, cost:1, build:1, res:1, home:0.85, fort:0.5, upk:0.9},
};
const docOf = n => n >= 0 && S.nations[n] ? DOCTRINES[S.nations[n].doc] || null : null;
// unit Marks: each unit type can be upgraded to Mk II, III and IV (+12% attack and defense per mark)
const MARK_F = [1, 1, 1.12, 1.25, 1.4];
const markOf = (n, t) => n >= 0 && S.nations[n] && S.nations[n].mk ? S.nations[n].mk[t] || 1 : 1;
const markCost = (t, m) => { const U = UNITS[t]; return {cash:Math.round(U.cost*1.6*m), metal:12*m + (U.metal || 0)*m, iron:(U.iron || 0)*m, elec:Math.round((U.elec || 0)*m*0.8), rare:2*(m - 1), days:1 + m}; };
const NUMW = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'];
const cap1 = w => w[0].toUpperCase() + w.slice(1);
const NEUTRAL = -1, SEA = -2;
const W = WORLD.W, H = WORLD.H, GS = WORLD.GS || 1, HS0 = 12, HS = HS0/GS, SQ3 = Math.sqrt(3);   // GS: cells per old map hex
const K = 0.25;                       // combat damage per hour factor
const DIFFS = [{k:'recruit', name:'Recruit', inc:0.75, war:0.6}, {k:'regular', name:'Regular', inc:1, war:1}, {k:'veteran', name:'Veteran', inc:1.2, war:1.3}, {k:'elite', name:'Elite', inc:1.45, war:1.6}];
const diffOf = () => DIFFS.find(d => d.k === (S && S.diff)) || DIFFS[1];
const GRACE_H = 24*8;                 // AI powers stay out of other powers' land for the first week
const WIN_SHARE = 0.25;               // share of land provinces needed to win
let WIN_CAPS = 5;                     // or hold this many starting capitals (5 of 15; 4 of 8 in theatre scenarios)
// The nations world (scenario world64, docs/NATIONS-PLAN.md): victory numbers follow the number of playable nations in the game
const winCapsFor = k => Math.max(5, Math.round(k/6));               // starting capitals to hold: a sixth of the nations, never fewer than 5
const winShareFor = k => k <= 27 ? 0.25 : k <= 41 ? 0.22 : 0.2;    // share of the world's land provinces to hold
// Tiers (S superpower, A major, B regional, C minor): what a nation starts with. TIER_FULL is the plan's wide table (3.2), TIER_EVEN an equal
// start for everyone; a game mode sits between the two by its spread (0 = everyone equal, 1 = the wide table). Normal mode is close to equal
// (the owner's rule: big countries are bigger, not much richer at the start); a later competitive mode is mildly more distinctive.
//   day / mpDay: money and manpower a day the opening catch-up aims at; cash..elec: stocks; inf/tank/art: the capital's force;
//   cityTanks: that many of the biggest other cities get a tank; guards: border guards (2 infantry each); recs: Recruiting Offices outside the capital
const TIER_RANK = {S:0, A:1, B:2, C:3};
const TIER_EVEN = {day:220, mpDay:58, cash:220, mp:90, oil:40, metal:60, iron:70, elec:30, inf:4, tank:1, art:0, cityTanks:0, guards:3, recs:2};
const TIER_FULL = {
  S:{day:310, mpDay:84, cash:320, mp:140, oil:60, metal:80, iron:90, elec:40, inf:6, tank:3, art:2, cityTanks:4, guards:5, recs:4},
  A:{day:262, mpDay:70, cash:260, mp:110, oil:50, metal:70, iron:80, elec:35, inf:5, tank:2, art:1, cityTanks:2, guards:4, recs:3},
  B:{day:220, mpDay:58, cash:220, mp:90, oil:40, metal:60, iron:70, elec:30, inf:4, tank:1, art:1, cityTanks:0, guards:3, recs:2},
  C:{day:201, mpDay:52, cash:200, mp:80, oil:40, metal:60, iron:70, elec:30, inf:4, tank:1, art:0, cityTanks:0, guards:3, recs:2}};
// floor: how far the catch-up may hold a rich nation back (income multiplier, home provinces only)
const TIER_MODES = {normal:{name:'Normal', spread:0.3, floor:0.3}, competitive:{name:'Competitive', spread:0.6, floor:0.75}};
const tierMode = k => TIER_MODES[k] || TIER_MODES.normal;
function tierKit(tier, mode){ const F = TIER_FULL[tier] || TIER_FULL.B, M = tierMode(mode), k = {};
  for (const key in TIER_EVEN) k[key] = Math.round(TIER_EVEN[key] + M.spread*(F[key] - TIER_EVEN[key]));
  k.floor = M.floor; k.fortCap = tier === 'C'; k.fortGuards = tier === 'B' || tier === 'C'; k.yard = tier === 'S' || tier === 'A';
  // the Naval Yard of a coastal S or A nation takes the place of border guards only as starts grow distinct: none in normal mode (spread 0.3; with
  // 2 guards gone a major power opened with fewer units than a regional one of as many cities), one at spread 0.6, two in the full table (plan 3.2)
  k.yardGuards = k.yard ? Math.floor(2*M.spread + 1e-9) : 0; return k; }
const tierGap = (a, b) => (TIER_RANK[b] ?? 2) - (TIER_RANK[a] ?? 2);   // how many tiers b stands below a
const TIER_WARS = {S:2, A:1, B:1, C:0};
// choosing a victim in the nations world: land beyond TIER_LAND provinces does not make a nation more tempting (with close-to-equal incomes a big
// country has the most land per soldier, and every neighbour went for it), and a computer nation already in TIER_GANG wars is left alone
// (two equal neighbours at once take any nation apart)
const TIER_LAND = 60, TIER_GANG = 1;   // an AI nation starts a war only while it is in at most this many wars of its own making
let DAY_LIMIT = Infinity;             // no day limit: the war runs until someone wins by land share or capitals
const CAP_MIN = 2;                    // ground units needed to capture
const OX = HS*SQ3/2 + 8, OY = HS + 8;
const WORLD_W = HS*SQ3*(W + 0.5) + 16, WORLD_H = HS*1.5*(H - 1) + 2*HS + 16;
/* ---------------- RNG / noise ---------------- */
function mulberry(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function rng(){ let a = (S.rs = (S.rs + 0x6D2B79F5) | 0); let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
/* ---------------- Hex grid ---------------- */
const idx = (c, r) => r*W + c;
const NB_EVEN = [[1,0],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1]];
const NB_ODD  = [[1,0],[1,-1],[0,-1],[-1,0],[0,1],[1,1]];
function nbr(i, d){ const c = i % W, r = (i / W) | 0, o = (r & 1) ? NB_ODD[d] : NB_EVEN[d]; const nc = c + o[0], nr = r + o[1]; return (nc < 0 || nr < 0 || nc >= W || nr >= H) ? -1 : idx(nc, nr); }
function cube(i){ const c = i % W, r = (i / W) | 0, q = c - (r - (r & 1)) / 2; return [q, r, -q - r]; }
function hexDist(a, b){ const A = cube(a), B = cube(b); return Math.max(Math.abs(A[0]-B[0]), Math.abs(A[1]-B[1]), Math.abs(A[2]-B[2]))/GS; }
function cellCenter(i){ const c = i % W, r = (i / W) | 0; return [OX + HS*SQ3*(c + 0.5*(r & 1)), OY + HS*1.5*r]; }
function worldToCell(x, y){
  x -= OX; y -= OY;
  const q = (SQ3/3*x - y/3)/HS, r = (2/3*y)/HS, s = -q - r;
  let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
  const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs; else if (dr > ds) rr = -rq - rs;
  const row = rr, col = rq + (rr - (rr & 1)) / 2;
  if (col < 0 || row < 0 || col >= W || row >= H) return -1;
  return idx(col, row);
}
const miller = lat => 1.25*Math.log(Math.tan(Math.PI/4 + 0.4*lat*Math.PI/180));
const invMiller = y => (2.5*Math.atan(Math.exp(0.8*y)) - 0.625*Math.PI)*180/Math.PI;
const YMAX = miller(WORLD.latN), YMIN = miller(WORLD.latS);
const cellLat = i => invMiller(YMAX - (((i / W) | 0)/(H - 1))*(YMAX - YMIN));
// formation names: "3rd Armored Division", "2nd Fleet", "5th Air Wing" (numbered per nation and kind)
const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const fmt1 = v => Math.abs(v) >= 10 ? String(Math.round(v)) : String(Math.round(v*10)/10);
const fmt = n => Math.floor(n).toLocaleString('en-US');
const YK = ['cash', 'oil', 'metal', 'iron', 'elec', 'rare', 'mp'], fmtY = v => v < 1.95 ? Math.round(v*10)/10 : Math.round(v);   // small yields (rare materials) keep a decimal
const yieldStr = y => YK.filter(k => y[k] >= (k === 'rare' ? 0.25 : 0.5)).map(k => k === 'cash' ? `$${Math.round(y[k])}M` : k === 'mp' ? `${Math.round(y[k])}k manpower` : `${fmtY(y[k])} ${yword(k, fmtY(y[k]))}`).join(' · ') || '—';
