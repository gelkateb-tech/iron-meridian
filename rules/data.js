// Iron Meridian rules: data. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
const WORLD = globalThis.WORLD, LINES = globalThis.LINES;   // the map data (world.js, lines.js), loaded before this file
const NATIONS = globalThis.NATIONS || null;   // the playable nations of the nations world (nations.js); null when a host does not load it
/* ---------------- Rules ---------------- */
// RES_K, the resource scale (owner's request: "resource numbers feel too small"). Every quantity of oil, materials, iron, electronics and rare
// materials (GOODS) is RES_K times what it was: stocks, yields, storage, upkeep, fuel and every price. Money and manpower are not scaled (manpower
// is already counted in thousands of people: 80k). The tables below are written in the old units and multiplied once, at the end of this file
// (the "resource scale" pass); a rule that rounds a goods quantity rounds it to RES_K (kFloor, kRound, kCeil), so the game plays exactly as before.
// The Market quotes its prices per RES_K units (MKT_LOT: $3.20M per 1,000 barrels), the price it had per unit before, and trades in whole lots.
const RES_K = 1000, MKT_LOT = RES_K;
const GOODS = ['oil', 'metal', 'iron', 'elec', 'rare'], isGood = k => GOODS.includes(k);
const kFloor = v => Math.floor(v/RES_K)*RES_K, kRound = v => Math.round(v/RES_K)*RES_K, kCeil = v => Math.ceil(v/RES_K)*RES_K;
const resK = o => { for (const k in o) o[k] *= RES_K; return o; };   // a table of goods quantities written in the old units, scaled
// the Market: money for q units at a price per MKT_LOT units, and the units a sum of money buys (whole lots)
const lotCash = (q, price) => q/MKT_LOT*price, lotsFor = (cash, price) => Math.floor(cash/price)*MKT_LOT;
// req (and req2 for the few that need two): the building, and its level, a city must have to mobilize the unit; tech: the research it needs (null: known from day one).
// Ground units, infantry included, come from an Army Base, aircraft from an Airbase, ships from a Naval Yard. The rule itself is canMobilize()
// The Army Base rule (owner, 2026-11-14): infantry (Motorized, Special Forces and Paratroopers; Paratroopers also need an Airbase) is
// mobilized only in a city with an Army Base (the level each needs: BASE_LV below, owner 2026-11-27). INF_NEEDS lists the buildings infantry needs at level I: ['fac'] the Army Base alone
// (the Recruiting Office unlocks nothing and keeps its training-speed and manpower bonuses), ['fac', 'rec'] both. The one switch between the two.
const INF_NEEDS = ['fac'];
/* NAVAL CITIES (owner 2026-11-19): every coastal city is a NAVAL CITY (navalCity, rules/state.js): the only place a Naval Yard can be built, the only
   place ground forces board ships (one of their own or a friend's) and the only place they come ashore (their own, a friend's, or an enemy's or an
   independent one taken by an assault landing), unless every ground unit of the force is a Marine ('mar', amphibious infantry: boards and lands on
   any coast). NAVAL_CITIES is the one switch: false gives the game exactly as it was before (no Marines, landings on any coast). */
const NAVAL_CITIES = true;
const INF_T = ['inf', 'at', 'spec', 'para', ...(NAVAL_CITIES ? ['mar'] : [])];   // the infantry units (their req and req2 are set from INF_NEEDS below the table)
/* ASF ATTACK ORDER (owner playtest 2026-11-27, item 2a; PROPOSED NUMBERS, the owner OKs them before merge). The Air Superiority Fighter keeps its
   job of winning the air (vs air 3.0, unchanged) and may also be sent to attack enemy ground forces and ships (the Attack button: orderAir with
   want 'strike', rules/air.js asfStrike). These are its damage multipliers against each class on such a strike (its attack 9 x these: 2.25 soft,
   1.8 armoured, 2.7 naval; a Strike Fighter does 9.6 / 12.8 / 8), the same numbers the unit had before, so nothing else changes. Measured with the
   real resolveStrike (one aircraft, open plains, morale 80): about 2.3 HP a sortie on a 10 HP infantry unit (a Strike Fighter 9.4), 1.6 on a tank
   (11.5), 2.3 on artillery (8.8). links: whether its strike also hurts the land under it as a Strike Fighter's does (cuts the road and rail
   links for LINK_DMG.strike hours, adds war damage); false: the forces only. No research needed. Option B, a little stronger: soft 0.3,
   armored 0.3, naval 0.3. */
const ASF_ATTACK = {soft:0.25, armored:0.2, naval:0.3, links:false};
const UNITS = {
  inf:  {name:'Motorized Infantry',short:'INF', cls:'soft',    cost:25, oil:0, metal:0, iron:0, elec:0, rare:0, mp:10, atk:3, def:3, hp:10, spd:4,  build:24, upk:1, fuel:0,   req:{b:'fac', l:1},          tech:null,  role:'Line infantry that holds ground and captures provinces.'},
  art:  {name:'Mobile Artillery',  short:'ART', cls:'soft',    cost:36, oil:3, metal:4, iron:7, elec:0, rare:0, mp:10, atk:7, def:3, hp:9,  spd:3,  build:48, upk:2, fuel:0,   req:{b:'fac', l:1}, tech:null,  vs:{soft:1.4}, role:'Self-propelled howitzer that fires on enemy forces from a distance.'},
  sam:  {name:'Mobile SAM',        short:'SAM', cls:'soft',    cost:44, oil:2, metal:6, iron:3, elec:7, rare:0, mp:8,  atk:5, def:2, hp:8,  spd:4,  build:48, upk:2, fuel:0,   req:{b:'fac', l:2}, tech:null,  vs:{air:3.0, soft:0.3, armored:0.3}, vsU:{swarm:1.4, sdrone:3.2, bomb:4.0}, role:'Mobile surface-to-air missile launcher that guards the sky over your forces.'},
  ifv:  {name:'Infantry Fighting Vehicle',short:'IFV', cls:'armored', cost:32, oil:4, metal:4, iron:7, elec:0, rare:0, mp:10, atk:4, def:4, hp:12, spd:7,  build:36, upk:2, fuel:0.5, req:{b:'fac', l:1}, tech:'inf2', role:'Fast armored infantry carrier.'},
  tank: {name:'Main Battle Tank',  short:'MBT', cls:'armored', cost:40, oil:6, metal:5, iron:11, elec:0, rare:0, mp:12, atk:6, def:4, hp:14, spd:6,  build:48, upk:3, fuel:1,   req:{b:'fac', l:1}, tech:null,  role:'Heavily armoured tracked main battle tank.'},
  jet:  {name:'Strike Fighter',    short:'STK', cls:'air',     cost:70, oil:12, metal:10, iron:0, elec:10, rare:0, mp:6,  atk:8, def:3, hp:9,  spd:18, build:72, upk:6, fuel:2,   req:{b:'air', l:1}, tech:'air1', vs:{armored:1.6}, role:'Multirole jet that flies strike missions.'},
  int:  {name:'Interceptor',       short:'INT', cls:'air',     cost:62, oil:10, metal:8, iron:0, elec:8, rare:0, mp:5,  atk:6, def:4, hp:9,  spd:20, build:60, upk:5, fuel:2,   req:{b:'air', l:1}, tech:'air1', vs:{air:2.0, soft:0.4, armored:0.4, naval:0.6}, vsU:{swarm:3.5, sdrone:5.5, drone:5.0, bomb:6.0, awacs:5.0, mpa:5.0}, role:'Fast jet that guards your airspace.'},
  frig: {name:'Frigate',           short:'FRG', cls:'naval',   cost:52, oil:6, metal:6, iron:12, elec:4, rare:0, mp:6,  atk:4, def:5, hp:14, spd:6,  build:60, upk:3, fuel:1,   req:{b:'yard', l:1}, tech:null,  vs:{air:1.8, soft:0.5, armored:0.4}, vsU:{swarm:1.0, sdrone:1.8}, role:'Escort warship that protects convoys and fleets.'},
  sub:  {name:'Attack Submarine',  short:'SUB', cls:'naval',   cost:48, oil:4, metal:5, iron:10, elec:4, rare:0, mp:5,  atk:6, def:2, hp:9,  spd:5.4, build:60, upk:2, fuel:1,   req:{b:'yard', l:1}, tech:null,  vs:{naval:2.0, soft:0, armored:0, air:0}, role:'Submarine that hunts ships from below the surface.'},
  crui: {name:'Cruiser',           short:'CRU', cls:'naval',   cost:66, oil:10, metal:10, iron:20, elec:6, rare:0, mp:8,  atk:7, def:6, hp:20, spd:5.8, build:96, upk:5, fuel:2,   req:{b:'yard', l:2}, tech:null,  vs:{naval:1.3, soft:1.1, armored:0.8, air:0.6}, role:'Heavy warship with long-range guns.'},
  mlrs: {name:'Rocket Artillery',  short:'MRL', cls:'armored', cost:52, oil:5, metal:5, iron:10, elec:3, rare:0, mp:8,  atk:8, def:2, hp:9,  spd:7,  build:54, upk:3, fuel:1, req:{b:'fac', l:2}, tech:'art2', vs:{soft:1.5, armored:0.9}, role:'Truck-mounted rocket launcher that fires from a distance.'},
  spec: {name:'Special Forces', short:'SOF', cls:'soft', cost:50, oil:0, metal:5, iron:0, elec:2, rare:0, mp:8,  atk:5, def:4, hp:10, spd:5,  build:42, upk:2, fuel:0,   req:{b:'fac', l:1}, tech:'inf3', role:'Elite raiders trained for rough terrain and covert missions.'},
  carr: {name:'Aircraft Carrier', short:'CVN', cls:'naval',   cost:124, oil:14, metal:15, iron:32, elec:10, rare:3, mp:10, atk:3, def:6, hp:26, spd:5, build:120, upk:7, fuel:2, req:{b:'yard', l:2}, tech:'nav2', vs:{air:1.4, soft:0.4, armored:0.3, naval:0.6}, role:'Floating airbase that carries air wings to sea.'},
  heli: {name:'Attack Helicopter', short:'GUN', cls:'air',     cost:56, oil:8, metal:8, iron:0, elec:7, rare:0, mp:6,  atk:7, def:4, hp:10, spd:12, build:54, upk:4, fuel:1.5, req:{b:'air', l:1}, tech:'heli1', vs:{armored:2.2, soft:1.3, air:0.3, naval:0.5}, role:'Armed helicopter that flies close support for the troops.'},
  drone:{name:'Recon UAV',         short:'UAV', cls:'air', dr:'uav', cost:26, oil:2, metal:4, iron:0, elec:5, rare:0, mp:1,  atk:0, def:1, hp:4, spd:16, build:30, upk:1, fuel:0.5, req:{b:'air', l:1}, tech:'drone1', vs:{soft:1.0, armored:1.2, air:0, naval:0.6}, vsU:{sam:1.3, jam:1.6, art:1.4, mlrs:1.4}, role:'Unmanned aircraft that scouts enemy forces; later models carry missiles.'},
  para: {name:'Paratroopers',short:'PAR', cls:'soft',   cost:36, oil:0, metal:4, iron:0, elec:0, rare:0, mp:10, atk:4, def:3, hp:10, spd:4,  build:36, upk:1.5, fuel:0,   req:{b:'fac', l:1}, req2:{b:'air', l:1}, tech:'para1', role:'Airborne infantry that can be dropped from the air.'},
  // V3 air: drones, the jammer that counters them, and specialised aircraft. dr = drone kind (swarm / uav / sdrone); pack = units per recruit card
  swarm:{name:'Swarm Drones',      short:'SWM', cls:'air', dr:'swarm', pack:6, cost:40, oil:2, metal:4, iron:0, elec:5, rare:0, mp:2, atk:1.6, def:0.5, hp:2, spd:14, build:30, upk:0.25, fuel:0.05, req:{b:'fac', l:2}, tech:'swarm1', vs:{soft:1.3, armored:0.35, air:0, naval:0.25}, vsU:{sam:1.8, jam:2.0, art:1.6, mlrs:1.0, ifv:0.9}, role:'Cheap loitering drones launched in packs from trucks.'},
  sdrone:{name:'Strike Drone', short:'SDR', cls:'air', dr:'sdrone', cost:48, oil:3, metal:6, iron:0, elec:7, rare:1, mp:2, atk:5, def:1, hp:5, spd:12, build:42, upk:1.5, fuel:0.4, req:{b:'air', l:1}, tech:'sdrone1', vs:{soft:1.1, armored:1.4, air:0, naval:0.9}, vsU:{sam:1.5, jam:1.8, art:1.6, mlrs:1.6}, role:'Long-range one-way attack drone.'},
  jam:  {name:'Mobile Jammer',     short:'JAM', cls:'soft',    cost:34, oil:1, metal:4, iron:0, elec:7, rare:0, mp:6,  atk:1, def:2, hp:7,  spd:5,  build:30, upk:1.5, fuel:0, req:{b:'fac', l:1}, tech:'jam1', vs:{soft:0.3, armored:0.2, air:0.3, naval:0}, role:'Electronic warfare vehicle that defends against drones.'},
  bomb: {name:'Heavy Bomber', short:'HBR', cls:'air', bmb:1, cost:132, oil:20, metal:24, iron:6, elec:14, rare:0, mp:6, atk:10, def:2, hp:14, spd:9, build:96, upk:7, fuel:3, req:{b:'air', l:2}, tech:'bomb1', vs:{soft:1.2, armored:0.8, naval:0.6, air:0.3}, role:'Long-range bomber that strikes cities and buildings.'},
  mpa:  {name:'Maritime Patrol Aircraft', short:'MPA', cls:'air', cost:74, oil:10, metal:12, iron:0, elec:11, rare:0, mp:5, atk:6, def:2, hp:10, spd:14, build:66, upk:4, fuel:2, req:{b:'air', l:1}, tech:'mpa1', vs:{naval:1.3, soft:0.2, armored:0.1, air:0.1}, vsU:{sub:2.5}, role:'Patrol aircraft that searches the sea for ships and submarines.'},
  awacs:{name:'AWACS',              short:'AEW', cls:'air',     cost:96, oil:10, metal:14, iron:0, elec:18, rare:5, mp:5, atk:0, def:2, hp:10, spd:15, build:72, upk:5, fuel:2, req:{b:'air', l:2}, tech:'awacs1', vs:{soft:0, armored:0, air:0, naval:0}, role:'Airborne radar that spots enemy forces from afar.'},
  asf:  {name:'Air Superiority Fighter', short:'ASF', cls:'air', cost:78, oil:11, metal:12, iron:0, elec:12, rare:2, mp:5, atk:9, def:5, hp:10, spd:22, build:72, upk:6, fuel:2, req:{b:'air', l:2}, tech:'asf1', vs:{air:3.0, soft:ASF_ATTACK.soft, armored:ASF_ATTACK.armored, naval:ASF_ATTACK.naval}, vsU:{bomb:3.0, awacs:3.0, mpa:3.0, drone:2.4, sdrone:2.6, swarm:1.8}, role:'Fighter built to win control of the air; it can also attack ground forces, weakly.'},
  // bmb: bomb load as a share of the Heavy Bomber's (bombers wreck cities, buildings and roads); lo: low-observable airframe, the share of hits that find it
  // (ad: Mobile SAMs, frigates and cruisers; air: fighters and other aircraft), each measured against what the same shooter does to a Heavy Bomber
  stealth:{name:'Stealth Bomber', short:'STB', cls:'air', bmb:0.6, lo:{ad:0.35, air:0.4}, cost:330, oil:26, metal:34, iron:6, elec:40, rare:8, mp:8, atk:8, def:4, hp:12, spd:10, build:168, upk:14, fuel:3.5, req:{b:'air', l:3}, tech:'bomb3', vs:{soft:1.0, armored:0.7, naval:0.6, air:0.2}, role:'Long-range bomber that is hard to detect.'},
};
// Marines (NAVAL CITIES): amphibious infantry, a little stronger and dearer than Motorized Infantry; trained at an Army Base in a coastal city
// (coastal: mobBlock, rules/production.js); a force of Marines alone boards and lands on any coast (amphib, rules/movement.js)
if (NAVAL_CITIES) UNITS.mar = {name:'Marines', short:'MAR', cls:'soft', cost:34, oil:0, metal:3, iron:2, elec:0, rare:0, mp:10, atk:4, def:3, hp:10, spd:4, build:36, upk:1.5, fuel:0, req:{b:'fac', l:1}, tech:null, coastal:1, amph:1, role:'Amphibious infantry: boards ships and lands on any coast, not only at naval cities. Trained at an Army Base in a coastal city.'};
// Anti-Tank Infantry ('at') is gone (owner 2026-11-27, BUILD-REQS): a type in INF_T with no unit is dropped from it here, before anything reads it
// (an old save's Anti-Tank Infantry becomes Motorized Infantry on load: atMigrate, rules/state.js)
for (let i = INF_T.length - 1; i >= 0; i--) if (!UNITS[INF_T[i]]) INF_T.splice(i, 1);
// infantry's buildings from INF_NEEDS: reqs lists every building the unit needs at its level (the Paratroopers' Airbase last); reqsOf reads it
for (const t of INF_T){ const U = UNITS[t], air = U.req2 && U.req2.b === 'air' ? [U.req2] : [];
  U.reqs = [...INF_NEEDS.map(b => ({b, l:1})), ...air]; U.req = U.reqs[0]; if (U.reqs[1]) U.req2 = U.reqs[1]; else delete U.req2; }
/* BUILD REQUIREMENTS (owner 2026-11-27, BUILD-REQS): the level of its base (b: fac Army Base, air Airbase, yard Naval Yard) each unit needs, one table
   for all three bases; it is written onto each unit's req (and the infantry's reqs) below, so mobBlock, the build lists, their texts and the computer
   read it from there. The Army Base and the Airbase exactly as the owner listed them; levels IV and V add no unit of their own (only the slot for
   Missile Defence at Army Base V, and the Stealth Bomber at Airbase V): they build faster (BASE_SPD). The Naval Yard as the owner listed it in
   round 2 (2026-11-27): I Corvette, Frigate; II Destroyer; III Cruiser, Attack Submarine; IV no new units; V Aircraft Carrier, Ballistic Missile
   Submarine. Units the owner's lists do not name keep the level they had: Marines (Army Base I, coastal cities only) and the Interceptor
   (Airbase I). Paratroopers also keep their Airbase I (req2). Ships already at sea stay, and ships already queued in a yard that is now too
   low finish as queued (the queue never checks the level again: prodHour); only new orders need the new level (yardMigrate tells the seat).
   A key with no unit is a MARKED SLOT, skipped until that unit exists (nothing is made for it):
     rcn   THE RECON SLOT: the recon vehicle, Army Base I (proposed with the starting armies, branch start-armies, under the key 'rcn'; not in the game yet)
     maa   Mobile Anti-Air, Army Base II (no short-range air-defence vehicle in the game; the Mobile SAM, the nearest, is listed at level III)
     mdef  Missile Defence, Army Base V (no such unit; today only the research Anti-Missile Shield, msl3, which works nation-wide with no building)
     corv  Corvette, Naval Yard I (no such ship yet; docs/RESEARCH.md 'Patrol Boat' is the nearest proposal)
     dest  Destroyer, Naval Yard II (no such ship yet; proposed in docs/RESEARCH.md, between the Frigate and the Cruiser)
     ssbn  Ballistic Missile Submarine, Naval Yard V (no such ship yet; proposed in docs/RESEARCH.md) */
const BASE_LV = {
  fac: {inf:1, rcn:1, art:1, mar:1,  ifv:2, tank:2, maa:2, para:2, swarm:2,  mlrs:3, sam:3, spec:3, jam:3,  mdef:5},
  air: {drone:1, heli:1, asf:1, int:1,  jet:2, sdrone:2,  mpa:3, awacs:3, bomb:3,  stealth:5},
  yard:{corv:1, frig:1,  dest:2,  crui:3, sub:3,  carr:5, ssbn:5},
};
for (const b in BASE_LV) for (const t in BASE_LV[b]){ const U = UNITS[t]; if (!U) continue;   // (a marked slot: no unit yet)
  for (const r of U.reqs || [U.req, U.req2]) if (r && r.b === b) r.l = BASE_LV[b][t]; }
// BUILD SPEED (owner 2026-11-27): levels I-III of the three bases only unlock units; levels IV and V train faster, the same on all three. A unit's
// training time is multiplied by the factor for the level of the base that trains it (its first building need, trainBase in rules/production.js:
// the Army Base for ground units, Swarm Drones and Paratroopers, the Airbase for aircraft, the Naval Yard for ships), by level 0 to V. The Recruiting
// Office (10% faster a level, 50% at level V) stays the main way to speed up training. Option B, closer to the old top levels: 0.85 and 0.7
const BASE_SPD = {fac:[1, 1, 1, 1, 0.9, 0.8], air:[1, 1, 1, 1, 0.9, 0.8], yard:[1, 1, 1, 1, 0.9, 0.8]};
const UNIT_NICK = {inf:'Infantry', at:'Anti-tank', art:'Artillery', sam:'SAM', ifv:'IFV', tank:'Tank', jet:'Strike', int:'Interceptor', frig:'Frigate', sub:'Submarine', crui:'Cruiser', mlrs:'MLRS', spec:'SOF', mar:'Marines', carr:'Carrier', heli:'Helicopter', drone:'UAV', para:'Paras', swarm:'Swarm', sdrone:'Strike drone', jam:'Jammer', bomb:'Bomber', mpa:'MPA', awacs:'AWACS', asf:'ASF', stealth:'Stealth bomber'};
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
  {k:'iron',  name:'Iron',     ab:'Iron',  unit:'',  pre:'', use:'armor, artillery, warships, Army Bases, bunkers and railways; those units also use 4% of their iron a day in maintenance (a shortage weakens them)', src:'iron cities (+25% per Arms Industry level), a little from ore deposits and iron hills, your capital, trade', map:'iron cities, ore deposits, iron hills'},
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
const costParts = c => CK.filter(k => c[k] > 0).map(k => k === 'cash' ? `$${c[k]}M` : k === 'mp' ? `${c[k]}k manpower` : `${fmt(c[k])} ${yword(k, c[k])}`);
const costTxt = (c, sep = ' · ') => costParts(c).join(sep);
// what is missing to pay c, in words ('12 more electronics'), or ''
const missTxt = (N, c) => CK.filter(k => c[k] > 0 && (N[k] || 0) < c[k]).map(k => { const q = Math.ceil(c[k] - (N[k] || 0)); return k === 'cash' ? `$${q}M more` : k === 'mp' ? `${q}k more manpower` : `${fmt(q)} more ${yword(k, q)}`; }).join(', ');
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
const FOOT_U = {inf:1, para:1, mar:1}, GUN_U = {art:1, mlrs:1}, TUF = {};
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
/* Speeds on water (hexes/day, one hex ~180 km), slowest to fastest: embarked ground troops (transports) 1.8 < carriers 5 < submarines 5.4 <
   cruisers 5.8 < frigates 6, against 4 for infantry on land. Escorted convoys +15%; sea lanes (major shipping routes) +12%. */
// Embarked troops sail in slow, loaded transports: 1.8 hexes/day (~325 km/day), 45% of infantry's land speed (it was 3.6, 90%: troops at sea were almost as fast as on land).
const SEA_SPEED = 1.8;                // hexes/day for embarked ground units (troop transports)
const LANE_F = 1.12;                  // sea-lane bonus for every force at sea
const KM_HEX = 180;                   // one map hex is roughly 180 km
// Recruiting Office, levels I-V: what it costs to reach each level (money $M, materials, iron, electronics) and how many days it takes.
// A building with such a table (BUILD[k].lv) is priced from it, not from the 1.6x-per-level rule (buildCost in rules/production.js)
const REC_LV = [null, {cash:40, days:2}, {cash:75, metal:10, days:3}, {cash:130, metal:20, iron:10, days:4}, {cash:220, metal:35, iron:20, days:5}, {cash:360, metal:55, iron:30, elec:15, days:6}];
// The Bunker (save key 'fort': it was Fortifications I-III; owner #17, 2026-11-18), levels 1-5, one row a level (docs/COMBAT.md section 7):
//   hp: its health (a hit that wrecks a building level does BUNKER_HIT of it); red: how much less damage its garrison takes (the owner's 33-82%; the
//   people of the province are spared the same share of their war losses, the other buildings BUNKER_SHIELD_LV's share); mrl: the garrison's morale
//   counts that much higher (+5% to +50%, at most 100); upk: money a day (the owner's 100-140 at our scale, a hundredth: $1.0M-1.4M);
//   cash, metal, iron, elec, days: the price of the level (levels 1-3 are Fortifications I-III's prices of today, 4-5 continue at about x1.4)
const BUNKER_LV = [null,
  {hp:20,  red:0.33, mrl:0.05, upk:1.0, cash:36,  metal:8,  iron:8,  days:2},
  {hp:40,  red:0.43, mrl:0.10, upk:1.1, cash:58,  metal:13, iron:13, days:2},
  {hp:65,  red:0.56, mrl:0.20, upk:1.2, cash:92,  metal:20, iron:20, days:2},
  {hp:95,  red:0.69, mrl:0.33, upk:1.3, cash:130, metal:28, iron:28, elec:5, days:2.5},
  {hp:125, red:0.82, mrl:0.50, upk:1.4, cash:180, metal:38, iron:38, elec:8, days:3}];
const BUNKER_HIT = 20;        // the health one building hit takes from a bunker (a bomber's wrecked level, a ballistic missile, a precision hit, sabotage): level 1 falls to one hit, as every building level does
const BUNKER_SHIELD_LV = 1;   // the other buildings of the province are shielded with this level's protection, whatever the bunker's level ("up to level 1")
const BUNKER_FIX = 2.5;       // health a bunker repairs an hour (a lost level is not repaired: it is built again)
const BUILD = {
  fac:  {name:'Army Base',         max:5, cost:25, ecost:55, metal:12, iron:12, days:3, lv1:{cost:10, metal:2, iron:2, hours:0.5}, where:'city', desc:''},   // (desc: written from BASE_LV and BASE_SPD, baseDesc below the table)
  air:  {name:'Airbase',           max:5, cost:85, metal:22, elec:5, days:4, where:'city', desc:''},   // (desc: written from BASE_LV and BASE_SPD, baseDesc below the table)
  arms: {name:'Arms Industry',     max:5, cost:40, metal:12, iron:6, days:3, first:0.5, where:'city', desc:'Raises this city\u2019s main resource (money, oil, materials, iron, electronics or rare materials) by 25% per level. Level I is half price and pays for itself in about a week. Each Arms Industry you already own in another province makes the next one cost 40% more.'},   // first: level I at half price (levels II-V as before)
  rec:  {name:'Recruiting Office', max:5, cost:40, metal:0,  days:2, where:'any',  lv:REC_LV, desc:(INF_NEEDS.includes('rec') ? 'Needed, with an Army Base, to mobilize infantry in this city: Motorized Infantry, Special Forces and (with an Airbase) Paratroopers. ' : 'Unlocks no units (infantry comes from the Army Base). ') + 'Each level: every unit trained in this city trains 10% faster (50% at level V) and +1.5k manpower a day (+3k at level I, +9k at level V).'},
  fort: {name:'Bunker',            max:5, cost:36, metal:8, iron:8, days:2, where:'any',  lv:BUNKER_LV, desc:`Hidden from other nations. Your garrison here takes ${Math.round(BUNKER_LV[1].red*100)}% less damage at level I, up to ${Math.round(BUNKER_LV[5].red*100)}% at level V, and its morale counts ${Math.round(BUNKER_LV[1].mrl*100)}% to ${Math.round(BUNKER_LV[5].mrl*100)}% higher; the people here lose that much less to war, and the other buildings here take ${Math.round(BUNKER_LV[BUNKER_SHIELD_LV].red*100)}% less damage. Upkeep $${BUNKER_LV[1].upk.toFixed(1)}M to $${BUNKER_LV[5].upk.toFixed(1)}M a day.`},
  silo: {name:'Missile Silo',      max:5, cost:140, metal:40, iron:15, elec:10, days:5, where:'city', desc:'Builds and stores cruise and ballistic missiles (needs Strategic research). Levels II\u2013V: missiles build 10% faster per level above I.'},
  yard: {name:'Naval Yard',        max:5, cost:75, metal:15, iron:15, days:4, where:'port', desc:''},   // (desc: written from BASE_LV and BASE_SPD, baseDesc below the table)
};
const BK = Object.keys(BUILD);
/* ---- occupation, morale, annexing and rebels (owner points 8-11, 2026-11-25; docs/REBELS-PLAN.md with the owner's answers R1-R17 of 2026-11-26).
   The rules are in rules/economy.js (morale, status, rebels, Annex City), rules/trade.js (point 11) and rules/ai.js (the computer's habits).
   MOR: morale per province, a whole number shown (stored to two decimals).
     start 70 at the start of a game; occ 25 when a province is captured (or passed to the nation that destroyed its holder); lib 55 when a
     province of the holder's own homeland is taken back or handed back. Each day change morale moves (target - morale)/rate toward its target.
     Base targets: home 90 (a city of the holder's homeland), anx 75 (an annexed city), occT 60 (an occupied city), rural 100 (any countryside).
     Modifiers: kmStep (-5 per kmUnit 1,000 km straight line to the capital of the moment, rounded, at most kmMax -30); war (-2 per nation at war
     with the holder that holds land, rebels in one of its cities count as one more, at most warMax -25); foeNb (-5 per neighbouring province held
     by a nation at war with the holder: nations only); foeHere (-1, whatever their number, for enemy or rebel forces standing in the province);
     lowC/lowR (-7 for each neighbouring city of the holder showing low (40) or less, -4 for each such countryside province, read as they stood
     before the day's step); hiC/hiR (+3 / +1 for each such neighbour showing 100); shortMax (shortage: -50 x the share of the day's need unmet,
     at least shortMin -5 a resource, at most -50); casMax (civilian casualties: casK, half a point per point of war damage, at most 30, x casFade
     at each day change); capLost (-20 on every province while the original capital is held by another); cap (+25 for the capital city itself);
     bunk (the Bunker's working level 1-5: +5/+10/+20/+35/+50); mob (-5 per Mobilisation level on homeland provinces: question 12).
     Output: occOut 25% for occupied land, anxOut 50% for annexed land, 100% for homeland (times today's morale link, rules/economy.js provYield);
     against the administration factor occupied land counts occAdm, annexed anxAdm (question 17).
     Rebels: a city showing rebelAt (33) or less burns and can rise. The chance at the day change: 0 at 33, +6.25 points per point down to 50%
     at rebel25 (25), then a straight line to 100% at sure (10); each of the holder's ground units standing in the city halves it.
     The computer: aiGar (garrisons in cities showing 38 or less), aiCash/aiMp (what it keeps after paying for an annexing), aiBrake (no new attack
     while this many of its cities show rebelAt or less) */
const MOR = {start:70, occ:25, lib:55, rate:8, home:90, anx:75, occT:60, rural:100, kmStep:5, kmUnit:1000, kmMax:30, war:2, warMax:25, foeNb:5, foeHere:1,
  low:40, lowC:7, lowR:4, hiC:3, hiR:1, shortMax:50, shortMin:5, casK:0.5, casMax:30, casFade:2/3, capLost:20, cap:25, bunk:[0, 5, 10, 20, 35, 50], mob:5,
  occOut:0.25, anxOut:0.5, occAdm:0.25, anxAdm:0.5, rebelAt:33, rebel25:25, sure:10, aiGar:38, aiCash:150, aiMp:40, aiBrake:2};
// Annex City (question 1, option B): by the city's size band (rebelBand: a town under 1.5 million people, a city, a large city from 5 million, a
// metropolis from 20 million): money ($M), manpower (k) and days. Paid when it starts; one construction slot, as a building
const ANNEX_COST = [{cash:50, mp:10, days:3}, {cash:80, mp:15, days:4}, {cash:120, mp:25, days:5}, {cash:180, mp:40, days:6}];
const REBEL_SIZE = [3, 4, 5, 6];   // rebel infantry by the same size band
// constructions that are not buildings (S.cons[p].k): their name for the dispatches and the page. consB(k) reads either table
const CONS_X = {annex:{name:'Annex City', max:1}};
const consB = k => BUILD[k] || CONS_X[k];
// a building's price table for level l: level I of a building with lv1 (the Army Base: cheap and quick, so every nation can open one in every starting
// city on day 1, with an Arms Industry and its first infantry research besides; owner 2026-11-25) has its own money, materials, iron and time (hours:
// game hours, a fraction allowed: 0.5 is 30 minutes, counted down in quarter-hour steps by consQuarter, rules/production.js); every other level comes from the building's line (cost, metal, iron, elec, days; x1.6 a level, see buildCost)
const bldLv = (k, l) => l === 1 && BUILD[k].lv1 ? BUILD[k].lv1 : BUILD[k];
// ---- economy: every city produces ONE main resource (P.main, set from the map in rules/map.js cityMains; a city without one is a money city)
const ECO_Y = {cash:1.6, oil:9.4, metal:8.2, iron:7.6, elec:3.3, rare:4.7};   // a city's main resource a day: money is a factor on the city's money, the rest are units (times the city-size factor)
const ECO_RUR = {oil:2.4, metal:0.8, ironOre:0.5, iron:0.6};                  // the countryside trickle: an oil field, an ore deposit (materials and iron), iron hills
const ECO_CAPITAL = {oil:3, metal:6, iron:4.5, elec:1.5, rare:2.5};           // the capital's state industry, labs and recycling
const ECO_RESERVE = 2;   // the nations world: the capital makes twice its share of an industrial good that none of the nation's cities produces at the start (N.reserve; the minimum-access rule's fourth good, docs/NATIONS-PLAN.md 3.3)
const ARMS_PCT = 0.25, ECO_CASH_ALL = 1.10, ECO_MP_CITY = 2.0;                // Arms Industry: +25% of the city's main resource per level; every nation's money +10%; a city's manpower base
const ECO_SHARE = {cash:0.17, oil:0.19, metal:0.21, iron:0.19, elec:0.17, rare:0.07}, RARE_DEP = 1.4;   // world mix the city resources aim at; a rare-earth district is a deposit of 1.4 or more
const MAIN_NAME = {cash:'money', oil:'oil', metal:'materials', iron:'iron', elec:'electronics', rare:'rare materials'};
// buildings removed by the city-resource economy: their level-I price, refunded when an old save is loaded (rules/state.js ecoMigrate)
const ECO_OLD = {ref:{name:'Refinery', cost:50, metal:10, iron:5}, fdy:{name:'Foundry', cost:50, metal:10, iron:0}, mine:{name:'Rare Earth Mine', cost:55, metal:10, iron:0}};
const ECO_OLD_TECH = {eco1:'Industrial Automation', eco2:'National Service', eco3:'Oil Refining'};   // the removed Economy research branch: a nation that researched one keeps its bonus (has(n, 'eco1') ...)
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
// the three bases' descriptions (the build list's text and tooltips), written from BASE_LV and BASE_SPD so they always say what the rules do: what
// each level unlocks and how much faster levels IV and V train. baseUnits: the names of the units level l of base b unlocks (marked slots left out)
const baseUnits = (b, l) => Object.keys(BASE_LV[b]).filter(t => UNITS[t] && BASE_LV[b][t] === l).map(t => UNITS[t].name + (t === 'mar' ? ' (coastal cities)' : t === 'para' ? ' (also need an Airbase)' : ''));
const baseSpdPct = (b, l) => Math.round((1 - BASE_SPD[b][Math.max(0, Math.min(BASE_SPD[b].length - 1, l))])*100);
const baseLevelTxt = (b, l) => { const u = baseUnits(b, l), f = baseSpdPct(b, l); return `Level ${ROMAN[l]}: ${[u.length ? u.join(', ') : 'no new units', ...(f ? [`units train ${f}% faster here`] : [])].join('; ')}`; };
function baseDesc(b){ const L = []; for (let l = 1; l <= BUILD[b].max; l++) L.push(baseLevelTxt(b, l)); return L.join('. ') + '.'; }
BUILD.fac.desc = `Unlocks and trains ground units, infantry included. ${baseDesc('fac')} Levels I–III only unlock units; the Recruiting Office is the main way to train faster. With a membership, Army Base I opens a second training line. No income. Level I is cheap (30 minutes) and costs the same in every city. Levels II–V: your first two cost the base price; from the third on, each other province where you already have level II or higher makes the next cost 40% more.`;
BUILD.air.desc = `Unlocks and trains aircraft (with their research). ${baseDesc('air')} Levels I–III only unlock aircraft; the Recruiting Office is the main way to train faster. Wings based here reach 1 hex farther per level above I and repair faster.`;
// (the Naval Yard's text in the table above is replaced here too, so all three bases read alike)
BUILD.yard.desc = `Coastal cities only. ${baseDesc('yard')} Levels I–III only unlock ships; the Recruiting Office is the main way to train faster. Damaged ships repair fast here, 20% faster per level above II.`;
// ---------- the research tree (docs/RESEARCH.md): organised by unit. Ten categories; inside a category one column ("line") per unit type.
// A node sits on a day (it cannot be started before that day) and has one or more levels, each with its own day, price and research time.
// Node kinds: unlock (lets you build the unit; units known from day one are "standard issue"), eng (Firepower / Protection, three levels:
// attack or defense +12%, +25%, +40%, the old unit Marks), kit (one named upgrade, some with levels), gen (a newer model of the same unit).
// A node only needs another node of its own unit line (the spine: unlock, generation 2, generation 3), or of the missile line; the one
// exception is the Stealth Bomber, which needs two lines. N.tech[id] holds the level a nation has researched (rules/research.js).
const RCATS = [
  {id:'inf',  name:'Infantry Corps',           role:'Takes ground and holds it',                       art:'u-infantry'},
  {id:'arm',  name:'Armoured Forces',          role:'Breaks the line and carries the infantry forward', art:'u-tank'},
  {id:'sup',  name:'Artillery & Air Defence',  role:'Long reach on the ground, a roof over the army',   art:'u-artillery'},
  {id:'aas',  name:'Air Assault',              role:'Short reach from the air: gunships and airborne troops', art:'u-attack-heli'},
  {id:'tac',  name:'Tactical Air',             role:'Fighters and strike jets, medium reach',           art:'u-air-superiority'},
  {id:'uns',  name:'Unmanned Systems',         role:'Cheap eyes and expendable strikes',                art:'u-strike-drone'},
  {id:'str',  name:'Strategic Air',            role:'Bombers and the big sensors, long reach',          art:'u-awacs'},
  {id:'nav',  name:'Navy',                     role:'Sea control, convoys and the silent service',      art:'u-carrier'},
  {id:'msl',  name:'Strategic Weapons',        role:'Missiles, the shield against them, eyes in orbit', art:'u-ballistic-missile'},
  {id:'cmd',  name:'Command & Logistics',      role:'Advantages for every force you field',             art:'u-supply-truck'},
];
const RCAT_BY = Object.fromEntries(RCATS.map(c => [c.id, c]));
// price formulas on the unit's own money price (docs/RESEARCH.md section 5)
const R_GEN_F = [1, 1.7, 2.2, 2.6], R_GEN_C = [1, 1.5, 2, 2.4];
const R_PRICE = {
  unlock:(U, days) => ({cash:Math.round(30 + 0.9*U.cost), metal:20, rare:12 + Math.round(U.cost/4), days}),
  eng:(U, L) => ({cash:Math.round(0.8*U.cost*(L + 1)), metal:6*(L + 1) + Math.ceil((U.metal || 0)*(L + 1)/2), iron:Math.ceil((U.iron || 0)*(L + 1)/2), elec:Math.round((U.elec || 0)*(L + 1)*0.4), rare:[3, 5, 8][L - 1], days:[2, 2, 3][L - 1]}),
  kit:(U, L) => ({cash:Math.round(25 + 0.6*U.cost*L), metal:[20, 30, 45][L - 1], rare:[12, 18, 26][L - 1] + Math.round(U.cost/20), days:[3, 4, 5][L - 1]}),
  gen:(U, g) => ({cash:Math.round((60 + 2.2*U.cost)*R_GEN_C[g - 2]), metal:g === 2 ? 50 : 80, iron:2*(U.iron || 0), elec:2*(U.elec || 0), rare:Math.round((30 + U.cost/4)*R_GEN_F[g - 2]), days:g === 2 ? 6 : g === 3 ? 8 : g === 4 ? 8 : 9}),
};
// the unit lines, one column each. u: unit, cat, day: the day the unlock opens, ud: days to research the unlock, std: known from day one,
// elite: star-and-wings badge, fam: the related unit it came out of (a dashed family line on the screen, no requirement), noFp: no Firepower node, fpLate: no Firepower 1 and 2 but a one-level Firepower at the third step's day (the Recon UAV)
// k: upgrades [id, name, icon, [[day, fx, text], ...levels], price table (default 'kit'; 'eng' = priced and required like a Firepower step)]; g: generations [[generation, day, name, fx, text]]
// fx: flat changes to the unit's own stats (atk, def, hp, spd) and rng (mission radius in hexes); the text says the rest (rules read the level)
const R_LINES = [
  {u:'inf', cat:'inf', day:1, std:1, k:[
    ['armor', 'Ceramic Body Armour', 'armor', [[1, {def:1}, 'defense +1']]],
    ['kit', 'Infantry Kit', 'vest', [[5, {hp:2}, 'health +2'], [14, {}, 'light anti-tank and anti-air missiles: damage to armor 0.5x to 0.7x, to aircraft 0.2x to 0.35x']]],
    ['terr', 'Rough-Ground Drills', 'terr', [[6, {}, 'half the speed penalty in forest and hills'], [12, {}, 'and in mountains and jungle']]]],
   g:[[2, 9, 'Mechanized Infantry', {atk:2, spd:1, hp:2}, 'attack +2, speed +1, health +2'], [3, 17, 'Assault Infantry', {atk:1, def:1, hp:2}, 'attack +1, defense +1, health +2']]},
  {u:'spec', cat:'inf', day:4, ud:4, elite:1, fam:'inf', k:[
    ['terr', 'Mountain & Arctic Training', 'terr', [[7, {}, 'rough-terrain attack bonus 40% to 50%'], [13, {}, 'to 60%']]],
    ['eye', 'Night Optics', 'scope', [[8, {}, 'sees 50% farther']]],
    ['airlift', 'Air-Transportable', 'airlift', [[10, {}, 'can be air-dropped from an airbase province, up to 6 hexes']]]],
   g:[[2, 16, 'Tier-One Operators', {atk:2, def:1, hp:2}, 'attack +2, defense +1, health +2']]},
  // Marines (NAVAL CITIES): the infantry corps' amphibious line, out of Motorized Infantry (the dashed family line)
  ...(NAVAL_CITIES ? [{u:'mar', cat:'inf', day:3, ud:3, fam:'inf', k:[
    ['armor', 'Ceramic Body Armour', 'armor', [[4, {def:1}, 'defense +1']]],
    ['kit', 'Assault Kit', 'vest', [[8, {atk:1}, 'attack +1'], [13, {hp:2}, 'health +2']]]],
   g:[[2, 12, 'Amphibious Assault Battalion', {atk:1, def:1, hp:2}, 'attack +1, defense +1, health +2']]}] : []),

  {u:'ifv', cat:'arm', day:1, ud:3, k:[
    ['gun', '30 mm Autocannon', 'autocannon', [[5, {atk:2}, 'attack +2']]],
    ['spd', 'Uprated Powerpack', 'engine', [[8, {spd:1}, 'speed +1']]],
    ['terr', 'Amphibious Kit', 'wave', [[10, {}, 'no penalty for attacking across a river']]]],
   g:[[2, 13, 'Heavy IFV', {atk:1, def:1, hp:3}, 'attack +1, defense +1, health +3']]},
  {u:'tank', cat:'arm', day:1, std:1, k:[
    ['armor', 'Composite Armour', 'armor', [[1, {def:2}, 'defense +2']]],
    ['gun', 'Smoothbore Main Gun', 'cannon', [[7, {atk:3}, 'attack +3']]],
    ['terr', 'Wide Tracks', 'tracks', [[9, {}, 'half the speed penalty on rough ground']]],
    ['eng', 'Turbine Engines', 'engine', [[11, {spd:2, atk:1}, 'speed +2, attack +1']]]],
   g:[[2, 14, 'Third-Generation MBT', {def:1, hp:4}, 'defense +1, health +4'], [3, 22, 'Next-Generation MBT', {atk:2, def:1, hp:3}, 'attack +2, defense +1, health +3']]},

  {u:'art', cat:'sup', day:1, std:1, k:[
    ['radar', 'Counter-Battery Radar', 'radar', [[1, {atk:2}, 'attack +2']]],
    ['shell', 'Extended-Range Shells', 'shell', [[8, {atk:3, def:2}, 'attack +3, defense +2']]],
    ['guided', 'Guided Shells', 'guided', [[13, {atk:2, spd:1}, 'attack +2, speed +1']]]],
   g:[[2, 15, 'Long-Barrel Howitzer', {atk:1, hp:3}, 'attack +1, health +3']]},
  {u:'mlrs', cat:'sup', day:5, ud:4, fam:'art', k:[
    ['reload', 'Rapid Reload', 'reload', [[9, {atk:2}, 'attack +2']]],
    ['rng', 'Extended-Range Rockets', 'rng', [[12, {}, 'range 150 to 200 km']]]],
   g:[[2, 16, 'Guided Rocket System', {atk:2, hp:2}, 'attack +2, health +2, damage to armor 0.9x to 1.2x']]},
  {u:'sam', cat:'sup', day:1, std:1, k:[
    ['seek', 'Improved Seekers', 'seeker', [[4, {atk:1}, 'attack +1'], [10, {atk:1}, 'attack +1 more']]],
    ['spd', 'Shoot-and-Scoot', 'spd', [[7, {spd:1, def:1}, 'speed +1, defense +1']]]],
   g:[[2, 13, 'Long-Range SAM', {atk:2, hp:2}, 'attack +2, health +2, covers neighbouring provinces at full strength']]},
  {u:'jam', cat:'sup', day:3, ud:3, k:[
    ['band', 'Wideband Jamming', 'jam', [[7, {}, 'downs and jams 20% more drones'], [13, {}, '40% more']]]],
   g:[[2, 16, 'Counter-UAV Laser', {atk:2, def:1, hp:2}, 'attack +2, defense +1, health +2']]},

  {u:'heli', cat:'aas', day:1, ud:4, k:[
    ['rng', 'Long-Range Tanks', 'fuel', [[6, {rng:1}, 'range +1 hex (7)'], [12, {rng:1}, 'range +1 more (8)']]],
    ['atgm', 'Fire-and-Forget Missiles', 'rocket', [[8, {atk:1}, 'attack +1']]]],
   g:[[2, 14, 'Heavy Gunship', {atk:2, def:1, hp:3}, 'attack +2, defense +1, health +3']]},
  {u:'para', cat:'aas', day:3, ud:4, elite:1, k:[
    ['airlift', 'Long-Range Airlift', 'airlift', [[7, {}, 'drop range 9 to 11 hexes'], [13, {}, 'to 13 hexes']]]],
   g:[[2, 15, 'Air Assault Brigade', {atk:1, def:1, hp:2}, 'attack +1, defense +1, health +2']]},

  {u:'int', cat:'tac', day:1, ud:4, k:[
    ['msl', 'Radar-Guided Missiles', 'rocket', [[5, {atk:2}, 'attack +2']]],
    ['rng', 'Drop Tanks', 'fuel', [[7, {rng:1}, 'range +1 hex'], [13, {rng:1}, 'range +1 more']]]],
   g:[[2, 12, 'Fourth-Generation Interceptor', {atk:1, def:1, hp:2, spd:2}, 'attack +1, defense +1, health +2, speed +2 (flies 10% faster)']]},
  {u:'jet', cat:'tac', day:1, ud:4, k:[
    ['pgm', 'Precision Munitions', 'bomb', [[5, {atk:2}, 'attack +2']]],
    ['rng', 'Drop Tanks', 'fuel', [[7, {rng:1}, 'range +1 hex'], [13, {rng:1}, 'range +1 more']]],
    ['lo', 'Stealth Airframes', 'stealth', [[10, {def:3}, 'defense +3; with the Strategic Bomber Upgrade it opens the Stealth Bomber']]]],
   g:[[2, 14, 'Multirole Strike Fighter', {atk:2, hp:2}, 'attack +2, health +2, damage to armor 1.6x to 1.8x']]},
  {u:'asf', cat:'tac', day:4, ud:5, elite:1, fam:'int', k:[
    ['rng', 'Drop Tanks', 'fuel', [[8, {rng:1}, 'range +1 hex'], [14, {rng:1}, 'range +1 more']]],
    ['radar', 'Look-Down Radar', 'radar', [[10, {atk:1}, 'attack +1']]]],
   g:[[2, 17, 'Fifth-Generation Fighter', {atk:2, def:2, hp:2}, 'attack +2, defense +2, health +2']]},

  {u:'drone', cat:'uns', day:1, ud:3, noFp:1, fpLate:1, k:[
    ['sens', 'Wide-Area Sensors', 'radar', [[3, {}, 'on station it sees 15% farther'], [10, {}, '30% farther']], 'eng']],
   g:[[2, 5, 'UAV II · Long-Endurance Optics', {def:1}, 'sees farther, loiters 16 h, reaches farther, harder to shoot down'], [3, 9, 'UAV III · Low-Observable Airframe', {def:1}, 'loiters 20 h, wider view, air defences hit 40% less'],
      [4, 13, 'UAV IV · Armed UAV', {atk:3}, 'light missiles: one salvo per sortie'], [5, 18, 'UAV V · Hunter-Killer', {atk:2, def:2}, 'two salvos, heavier missiles, longer range and loiter']]},
  {u:'swarm', cat:'uns', day:4, ud:4, k:[
    ['rng', 'Booster Rockets', 'booster', [[8, {rng:1}, 'range +1 hex'], [14, {rng:1}, 'range +1 more']]],
    ['tb', 'Thermobaric Warheads', 'warhead', [[9, {atk:0.2, hp:0.4}, 'attack +0.2, health +0.4']]]],
   g:[[2, 15, 'Networked Swarm', {atk:0.6, hp:1}, 'attack +0.6, health +1, damage to armor 0.35x to 0.6x']]},
  {u:'sdrone', cat:'uns', day:6, ud:4, fam:'drone', k:[
    ['rng', 'Satellite Link', 'sat', [[10, {rng:2}, 'range +2 hexes'], [15, {rng:2}, 'range +2 more']]],
    ['hit', 'Bunker-Buster Warhead', 'bunker', [[12, {}, 'knocks a building out for 36 h (was 24 h)']]]],
   g:[[2, 17, 'Low-Observable Strike Drone', {atk:2, hp:2}, 'attack +2, health +2, air defences hit 30% less']]},

  {u:'bomb', cat:'str', day:6, ud:6, k:[
    ['ecm', 'Defensive Jammers', 'jam', [[9, {def:2}, 'defense +2']]],
    ['up', 'Strategic Bomber Upgrade', 'rng', [[11, {atk:1, rng:4}, 'range +4 hexes (+720 km), attack +1; with Stealth Airframes it opens the Stealth Bomber']]]],
   g:[[2, 17, 'Supersonic Bomber', {atk:2, hp:3, spd:3}, 'attack +2, health +3, speed +3 (flies 33% faster)']]},
  {u:'stealth', cat:'str', day:14, ud:9, elite:1, req:['bomb_up', 'jet_lo'], k:[
    ['bay', 'Enlarged Bomb Bay', 'msl', [[19, {}, 'bomb load 60% to 75% of a Heavy Bomber’s']]],
    ['rng', 'Flying-Wing Tanks', 'fuel', [[21, {rng:4}, 'range +4 hexes']]]],
   g:[]},
  {u:'mpa', cat:'str', day:2, ud:4, k:[
    ['sonar', 'Sonobuoy Field', 'sonar', [[8, {}, 'detection radius +20%'], [14, {}, '+40%']]],
    ['torp', 'Homing Torpedoes', 'torpedo', [[10, {atk:2}, 'attack +2']]]],
   g:[[2, 15, 'Long-Endurance Patrol Aircraft', {atk:1, hp:2}, 'attack +1, health +2, patrols 18 h (was 12 h)']]},
  {u:'awacs', cat:'str', day:5, ud:5, noFp:1, k:[
    ['radar', 'High-Power Radar', 'radar', [[9, {}, 'radar radius +15%'], [15, {}, '+30%']]],
    ['link', 'Fighter Data Link', 'link', [[12, {}, 'fighters under it fight 35% better (was 25%)']]]],
   g:[[2, 17, 'Phased-Array AWACS', {def:1, hp:2}, 'defense +1, health +2, identifies forces within half its radius']]},

  {u:'frig', cat:'nav', day:1, std:1, k:[
    ['gun', 'Naval Gunnery', 'cannon', [[1, {atk:1}, 'attack +1']]],
    ['sonar', 'Towed Sonar', 'sonar', [[6, {}, 'hears submarines two sea zones away']]],
    ['aa', 'Area Air Defence', 'flak', [[9, {def:1}, 'defense +1, damage to aircraft 1.8x to 2.1x']]]],
   g:[[2, 14, 'Guided-Missile Frigate', {atk:2, def:1, hp:3}, 'attack +2, defense +1, health +3']]},
  {u:'crui', cat:'nav', day:1, std:1, k:[
    ['gun', 'Naval Gunnery', 'cannon', [[3, {atk:2}, 'attack +2']]],
    ['rng', 'Long-Range Bombardment', 'shell', [[11, {}, 'coastal bombardment 30% stronger']]]],
   g:[[2, 15, 'Missile Cruiser', {atk:2, hp:4}, 'attack +2, health +4']]},
  {u:'carr', cat:'nav', day:7, ud:6, fam:'crui', k:[
    ['ciws', 'Close-In Defence', 'flak', [[11, {def:1}, 'defense +1'], [16, {}, 'damage to aircraft 1.4x to 1.8x']]],
    ['spd', 'Nuclear Propulsion', 'engine', [[13, {spd:0.8}, 'speed +0.8']]]],
   g:[[2, 18, 'Supercarrier', {def:2, hp:6}, 'defense +2, health +6']]},
  {u:'sub', cat:'nav', day:1, std:1, k:[
    ['torp', 'Heavy Torpedoes', 'torpedo', [[2, {atk:1}, 'attack +1'], [10, {atk:1}, 'attack +1 more']]],
    ['quiet', 'Quiet Drive', 'quiet', [[7, {def:1}, 'defense +1'], [13, {def:1}, 'defense +1 more']]]],
   g:[[2, 14, 'Nuclear Attack Submarine', {atk:1, hp:3, spd:1.2}, 'attack +1, health +3, speed +1.2']]},
];
// the two categories that are not unit lines. The first level of each keeps the id, price and time it had before the redesign.
const R_SPECIAL = [
  {cat:'msl', line:'Cruise Missile', pic:'cm', nodes:[
    {id:'msl1', name:'Cruise Missiles', kind:'unlock', ic:'cm', lv:[[1, 'Missile Silos can build Cruise Missiles', {cash:96, metal:20, rare:31, days:6}]]},
    {id:'cm_rng', name:'Cruise Missile Range', kind:'kit', ic:'rng', req:['msl1'], lv:[[7, 'range 28 to 32 hexes', {cash:90, metal:30, rare:20, days:4}], [13, 'to 36 hexes', {cash:130, metal:45, rare:30, days:5}]]},
    {id:'cm_spd', name:'Cruise Missile Speed', kind:'kit', ic:'spd', req:['msl1'], lv:[[9, 'speed 9 to 11: less time for the defences', {cash:90, metal:30, rare:20, days:4}], [15, 'to 13', {cash:130, metal:45, rare:30, days:5}]]}]},
  {cat:'msl', line:'Ballistic Missile', pic:'bm', nodes:[
    {id:'msl2', name:'Ballistic Missiles', kind:'unlock', ic:'bm', req:['msl1'], lv:[[6, 'Silos can build Ballistic Missiles', {cash:144, metal:35, rare:64, days:8}]]},
    {id:'bm_rng', name:'Ballistic Missile Range', kind:'kit', ic:'rng', req:['msl2'], lv:[[11, 'range 90 to 102 hexes', {cash:140, metal:45, rare:34, days:5}], [17, 'to 114 hexes', {cash:190, metal:60, rare:46, days:6}]]},
    {id:'bm_pow', name:'Heavier Warhead', kind:'kit', ic:'warhead', req:['msl2'], lv:[[14, 'power 16 to 19', {cash:170, metal:60, rare:44, days:6}]]}]},
  {cat:'msl', line:'Missile Defence', pic:'def', nodes:[
    {id:'msl3', name:'Anti-Missile Shield', kind:'kit', ic:'def2', req:['msl2'], lv:[[9, 'your SAMs and Frigates intercept missiles twice as well', {cash:132, metal:60, rare:96, days:7}], [15, '2.5 times as well', {cash:170, metal:60, rare:60, days:6}], [21, '3 times as well', {cash:220, metal:80, rare:80, days:7}]]}]},
  {cat:'msl', line:'Satellites', pic:'sat', nodes:[
    {id:'sat1', name:'Reconnaissance Satellites', kind:'kit', ic:'sat', req:['msl1'], lv:[[5, 'launch up to 3 spy satellites from a silo or your capital: each sweeps the globe once a day', {cash:120, metal:35, rare:61, days:6}], [11, 'up to 4 satellites', {cash:150, metal:50, rare:48, days:5}], [17, 'up to 5, each with a wider swath', {cash:200, metal:70, rare:64, days:6}]]}]},
  // Command & Logistics: four doctrines, each with a second level (its rule reads the level: rMoveF, rCapF, rRoadF, rLandF, rHospF in rules/research.js)
  {cat:'cmd', line:'Supply', pic:'truck', nodes:[{id:'log1', name:'Motorized Supply', kind:'kit', ic:'truck', lv:[[1, 'all forces move 20% faster; opens high-speed rail', {cash:66, metal:20, rare:27, days:4}], [10, 'all forces move 30% faster', {cash:110, metal:30, rare:30, days:5}]]}]},
  {cat:'cmd', line:'Engineers', pic:'wrench', nodes:[{id:'log2', name:'Combat Engineers', kind:'kit', ic:'wrench', lv:[[2, 'troops embark at ports 30% faster; bunkers cost half; roads and railways 25% cheaper and faster to build', {cash:78, metal:20, rare:29, days:5}], [11, 'troops embark 40% faster; roads and railways 35% cheaper and faster to build', {cash:120, metal:30, rare:32, days:5}]]}]},
  {cat:'cmd', line:'Landings', pic:'anchor', nodes:[{id:'nav3', name:'Amphibious Doctrine', kind:'kit', ic:'anchor', lv:[[3, 'landings from the sea take half the time, and the troops fight at 90% instead of 67% on their first day ashore', {cash:114, metal:20, rare:34, days:7}], [12, 'they fight at full strength on their first day', {cash:140, metal:30, rare:36, days:6}]]}]},
  {cat:'cmd', line:'Medical', pic:'cross', nodes:[{id:'log3', name:'Field Hospitals', kind:'kit', ic:'cross', lv:[[4, 'your forces take 15% less damage', {cash:102, metal:20, rare:32, days:7}], [13, '20% less damage', {cash:150, metal:30, rare:40, days:7}]]}]},
];
// the node list. node: {id, cat, line, u, kind, name, ic, req:[node ids], req3 (Firepower / Protection level 3 needs it), std, elite, fam, gen, pic,
// lv:[{day, c:{cash, metal, iron, elec, rare, days}, fx, txt, rq (a later level of an upgrade dated after generation 2: [that generation])}]}
const R_PCT = [12, 25, 40];
const RNODES = [], RN = {};
{ const add = n => { n.i = RNODES.length; RNODES.push(n); RN[n.id] = n; return n; };
  for (const L of R_LINES){ const U = UNITS[L.u], u = L.u, g2 = (L.g.find(g => g[0] === 2) || [])[1];
    add({id:'u_' + u, cat:L.cat, line:u, u, kind:'unlock', name:U.name, ic:'unit', pic:u, std:!!L.std, elite:!!L.elite, fam:L.fam || null, req:L.req || [],
      lv:[{day:L.day, c:L.std ? {cash:0, metal:0, rare:0, days:0} : R_PRICE.unlock(U, L.ud), fx:{}, txt:L.std ? 'standard issue: known from day one' : 'unlocks the ' + U.name}]});
    const eDay = [Math.max(3, L.day + 2), L.day + 9, Math.max(g2 ? g2 + 3 : 0, L.day + 15)];
    for (const [k, nm, ic, off] of [['fp', 'Firepower', 'dmg', 0], ['pr', 'Protection', 'hp', 1]]){ if (k === 'fp' && L.noFp) continue;
      add({id:u + '_' + k, cat:L.cat, line:u, u, kind:'eng', eng:k, name:nm, ic, req:['u_' + u], req3:g2 ? u + '_g2' : null,
        lv:[1, 2, 3].map(l => ({day:eDay[l - 1] + off, c:R_PRICE.eng(U, l), fx:{}, txt:`${k === 'fp' ? 'attack' : 'defense'} +${R_PCT[l - 1]}% in all`}))}); }
    if (L.fpLate) add({id:u + '_fp3', cat:L.cat, line:u, u, kind:'eng', eng:'fp', name:'Firepower', ic:'dmg', req:['u_' + u, ...(g2 ? [u + '_g2'] : [])], lv:[{day:eDay[2], c:R_PRICE.eng(U, 3), fx:{}, txt:`attack +${R_PCT[2]}% in all`}]});   // (the Recon UAV has no attack before UAV IV)
    for (const [k, nm, ic, lv, pf] of L.k)
      add({id:u + '_' + k, cat:L.cat, line:u, u, kind:'kit', name:nm, ic, req:[lv[0][0] > (g2 || 99) ? u + '_g2' : 'u_' + u],
        lv:lv.map(([day, fx, txt], i) => ({day, c:R_PRICE[pf || 'kit'](U, i + 1), fx, txt, ...(i && g2 && day > g2 && lv[0][0] <= g2 && !pf ? {rq:[u + '_g2']} : {})}))});   // rq: a later level dated after generation 2 needs it
    for (const [g, day, nm, fx, txt] of L.g)
      add({id:u + '_g' + g, cat:L.cat, line:u, u, kind:'gen', gen:g, name:nm, ic:'unit', pic:u, req:[g === 2 ? 'u_' + u : `${u}_g${g - 1}`], lv:[{day, c:R_PRICE.gen(U, g), fx, txt}]}); }
  for (const Sx of R_SPECIAL) for (const n of Sx.nodes)
    add({id:n.id, cat:Sx.cat, line:Sx.line, u:null, kind:n.kind, name:n.name, ic:n.ic, pic:Sx.pic, req:n.req || [], lv:n.lv.map(([day, txt, c]) => ({day, c, fx:{}, txt}))});
  for (const L of R_LINES) UNITS[L.u].tech = L.std ? null : 'u_' + L.u;   // the research a unit needs: its own unlock node
}
const RNODES_U = {};   // the nodes of each unit's line (what st() sums)
for (const n of RNODES) if (n.u) (RNODES_U[n.u] || (RNODES_U[n.u] = [])).push(n);
// the final level of every unit line (docs/RESEARCH-UPGRADES.md section 3, owner 2026-11-18): the line's last research step by day, a generation
// when two share the last day. On top of its own upgrade it makes that unit type train R_FINAL_F of the time (15% faster): rTrainF reads it
const R_FINAL_F = 0.85, R_FINAL = {};
for (const u in RNODES_U){ let b = null;
  for (const nd of RNODES_U[u]) if (nd.kind !== 'unlock') nd.lv.forEach((L, i) => { if (!b || L.day > b.day || (L.day === b.day && nd.kind === 'gen' && b.nd.kind !== 'gen')) b = {nd, lv:i + 1, day:L.day}; });
  if (b){ R_FINAL[u] = {id:b.nd.id, lv:b.lv}; const L = b.nd.lv[b.lv - 1]; L.train = R_FINAL_F; L.txt += ', and trains 15% faster'; } }
const R_STEPS = RNODES.reduce((s, n) => s + (n.std ? 0 : n.lv.length), 0);   // research steps in the whole tree (standard-issue unlocks are not steps)
const rLineName = n => n.u ? UNITS[n.u].name : n.line;
// a node's name for one level: "Firepower 2 · Main Battle Tank", "Cruise Missile Range 1", "Heavy IFV"
const rName = (n, lv) => n.name + (n.lv.length > 1 ? ' ' + lv : '') + (n.kind === 'eng' ? ' · ' + UNITS[n.u].name : '');
const rCost = (n, lv) => { const c = n.lv[lv - 1].c; return {cash:c.cash || 0, metal:c.metal || 0, iron:c.iron || 0, elec:c.elec || 0, rare:c.rare || 0}; };
// ---------- the projects of the old tree (before the research redesign): what each converts to when an old save is loaded.
// 'node' sets that node to level 1; 'node@' adds one level to it. Projects whose id did not change (log1, msl1, sat1 ...) are not listed.
const R_LEGACY = {
  inf1:['inf_armor'], inf2:['inf_g2', 'u_ifv'], inf3:['inf_g3', 'u_spec'],
  tank1:['tank_armor'], tank2:['tank_gun', 'ifv_gun'], tank3:['tank_eng'],
  art1:['art_radar'], art2:['art_shell', 'u_mlrs'], art3:['art_guided'],
  air1:['u_jet', 'u_int'], air2:['jet_pgm', 'int_msl'], air3:['jet_lo'],
  nav1:['frig_gun', 'crui_gun'], nav2:['u_carr'],
  asf1:['u_asf'], awacs1:['u_awacs'], mpa1:['u_mpa'], bomb1:['u_bomb'], bomb2:['bomb_up'], bomb3:['u_stealth'],
  drone1:['u_drone'], uav2:['drone_g2'], uav3:['drone_g3'], uav4:['drone_g4'], uav5:['drone_g5'],
  jam1:['u_jam'], swarm1:['u_swarm'], sdrone1:['u_sdrone'], heli1:['u_heli'], para1:['u_para'],
};
// upgrades replaced after the upgrades review (owner 2026-11-18): an old save's level of the old node becomes the same level of its replacement
// (same days, prices and place in the tree), a project of it still running carries on as the replacement (rRenameMigrate)
const R_RENAMED = {inf_build:'inf_kit', swarm_pack:'swarm_tb', carr_deck:'carr_ciws'};
const R_RENAMED_NAME = {inf_build:'Rapid Mobilisation', swarm_pack:'Bigger Salvo', carr_deck:'Flight-Deck Crews', drone_fp:'Recon UAV Firepower'};
// the Recon UAV's Firepower 1 and 2 (days 3 and 10) became Wide-Area Sensors 1 and 2 (owner 2026-11-18: it has no attack until UAV IV); Firepower 3 (day 16)
// is its own node now. An old level l of drone_fp becomes Sensors min(l, 2), and Firepower when l is 3; a running project of it carries on as the same step
const R_FP_SPLIT = {drone_fp:{sens:'drone_sens', fp:'drone_fp3'}};
const R_LEGACY_NAME = {inf1:'Ceramic Body Armor', inf2:'Mechanized Infantry', inf3:'Special Forces', tank1:'Composite Armor', tank2:'Smoothbore Main Gun', tank3:'Turbine Engines',
  art1:'Counter-Battery Radar', art2:'Rocket Artillery', art3:'Guided Shells', air1:'Jet Engines', air2:'Precision Munitions', air3:'Stealth Airframes', nav1:'Naval Gunnery', nav2:'Carrier Aviation',
  asf1:'Air Superiority Fighters', awacs1:'Airborne Early Warning', mpa1:'Maritime Patrol', bomb1:'Strategic Bombers', bomb2:'Strategic Bomber Upgrade', bomb3:'Stealth Bombers',
  drone1:'UAV I · Unmanned Recon', uav2:'UAV II · Long-Endurance Optics', uav3:'UAV III · Low-Observable Airframe', uav4:'UAV IV · Armed UAV', uav5:'UAV V · Hunter-Killer',
  jam1:'Counter-Drone Jamming', swarm1:'Swarm Drones', sdrone1:'Strike Drones', heli1:'Rotary Wing', para1:'Airborne Forces'};
// Anti-Tank Infantry as it was before it was removed (owner 2026-11-27, BUILD-REQS), kept only for old saves (atMigrate, rules/state.js): its
// health and training time, its price over Motorized Infantry's (refunded for one queued), and the price of every level of its research line
// ([cash, materials, iron, rare materials], goods in the old units: scaled by RES_K where used). carry: the upgrades that carry over to Motorized
// Infantry's own (the higher level of the two is kept); the others are refunded
const AT_OLD = {hp:9, build:30, extra:{cash:7, metal:3, iron:3},
  lv:{at_fp:[[51, 15, 3, 3], [77, 23, 5, 5], [102, 30, 6, 8]], at_pr:[[51, 15, 3, 3], [77, 23, 5, 5], [102, 30, 6, 8]], at_armor:[[44, 20, 0, 14]],
    at_warhead:[[44, 20, 0, 14], [63, 30, 0, 20]], at_eye:[[44, 20, 0, 14]], at_g2:[[130, 50, 6, 38]]},
  carry:{at_fp:'inf_fp', at_pr:'inf_pr', at_armor:'inf_armor'},
  name:{at_fp:'Firepower', at_pr:'Protection', at_armor:'Ceramic Body Armour', at_warhead:'Tandem Warheads', at_eye:'Thermal Sights', at_g2:'Guided Missile Teams'}};
// national doctrines, chosen at the start of a campaign
const DOCTRINES = {
  precision:{name:'Precision', tag:'Fewer, better forces', desc:'Units attack 10% harder and research runs 15% faster, but every unit costs 15% more.', atk:1.10, def:1, cost:1.15, build:1, res:0.85},
  mass:{name:'Mass', tag:'Numbers win wars', desc:'Units cost 15% less and train 25% faster, but attack 5% weaker.', atk:0.95, def:1, cost:0.85, build:0.75, res:1},
  bastion:{name:'Defence in Depth', tag:'Hold every inch', desc:'Forces defending your own provinces take 15% less damage, bunkers build twice as fast, and upkeep is 10% lower.', atk:1, def:1, cost:1, build:1, res:1, home:0.85, fort:0.5, upk:0.9},
};
const docOf = n => n >= 0 && S.nations[n] ? DOCTRINES[S.nations[n].doc] || null : null;
// Firepower and Protection levels 1 to 3 multiply attack and defense by MARK_F[level + 1] (they were the unit Marks II to IV before the research redesign)
const MARK_F = [1, 1, 1.12, 1.25, 1.4];
// the Firepower or Protection level (0 to 3) in a tech table T: the Recon UAV's only Firepower step is its day-16 one, worth level 3 (+40%)
const rMarkT = (T, t, e) => e === 'fp' && t === 'drone' ? (+T.drone_fp3 ? 3 : 0) : Math.min(3, +T[t + '_' + e] || 0);
// ---------- nation groups (docs/DOCTRINES.md, plan approved 18 November 2026): who is in which group, its colour and emblem, and every unit's
// model name per group and look. Data only: the doctrine rules (strengths, weaknesses, version trades, unique units) are NOT built, so nothing here
// changes a number. The research screen reads it (banner colour, emblem stripe, model names); the doctrine build reuses it (N.doc from ngroupOf).
// NGROUPS: key, name, identity, colour (section 1), emblem (section 5: drawn in code by the page). Every nation of nations.js and of the classic
// worlds is listed once (section 2); a name not listed is Export.
const NGROUPS = [
  {k:'nato',   name:'US/NATO', idn:'Quality',    col:'#3f7fe0', emb:'chevron'},
  {k:'east',   name:'Eastern', idn:'Mass',       col:'#a3283f', emb:'shield'},
  {k:'china',  name:'China',   idn:'Production', col:'#e8b23a', emb:'triangle'},
  {k:'europe', name:'Europe',  idn:'Technology', col:'#36a8b4', emb:'ring'},
  {k:'export', name:'Export',  idn:'Home Guard', col:'#b89a62', emb:'globe'},
];
const NGROUP_BY = Object.fromEntries(NGROUPS.map(g => [g.k, g]));
const NGROUP_OF = {};
for (const [g, s] of Object.entries({
  nato:'United States|Canada|Turkey|Japan|Australia|Poland|Egypt|Saudi Arabia|South Korea|Philippines|Romania|Israel|Morocco|New Zealand',
  europe:'United Kingdom|France|Germany|Brazil|Italy|Spain|Ukraine|Sweden|Norway|Finland|Greece|Chile',
  east:'Russia|India|Iran|Kazakhstan|Algeria|Vietnam|Ethiopia|Belarus|Uzbekistan|Mongolia|Syria|North Korea|Angola|Venezuela|Cuba',
  china:'China|Pakistan|Myanmar|Tanzania|Sudan|Bangladesh',
  export:'Nigeria|Indonesia|Mexico|Iraq|DR Congo|South Africa|Thailand|Afghanistan|Argentina|Colombia|Peru|Yemen|Libya|Kenya|Mali|Chad|Mozambique|Cameroon|Malaysia|Ecuador|Bolivia'})) for (const nm of s.split('|')) NGROUP_OF[nm] = g;
const ngroupOf = name => NGROUP_OF[name] || 'export';
// model names (section 3, the build's checks done: the dagger and double-dagger marks dropped): unit -> group -> [look 1, look 2, look 3].
// Paratroopers share the Motorized Infantry names (UNIT_NAME_OF); cm and bm are the Cruise and Ballistic Missile lines of Strategic Weapons (names
// only). null: no name found yet (Europe's newest jammer); the screen shows the unit type instead
const UNIT_NAMES = {
  inf:{nato:['M16A1', 'M4A1', 'M7'], east:['AKM', 'AK-74M', 'AK-12'], china:['Type 56', 'QBZ-95', 'QBZ-191'], europe:['G3A3', 'G36A2', 'G95A1'], export:['AKM', 'AK-103', 'M4']},
  spec:{nato:['XM177E2', 'Mk 18 Mod 1', 'M7'], east:['AKMS', 'AK-105', 'AK-12K'], china:['Type 56-1', 'QBZ-95-1', 'QBZ-192'], europe:['MP5', 'G36KA4', 'G95K'], export:['AKMS', 'M4', 'AK-104']},
  mar:{nato:['M16A2', 'M27 IAR', 'M27'], east:['AK-74', 'AK-74M', 'AK-12'], china:['Type 81', 'QBZ-95-1', 'QBZ-191'], europe:['FAMAS F1', 'HK416F', 'G95A1'], export:['AKM', 'M4', 'AK-103']},
  ifv:{nato:['M2A1', 'M2A3', 'XM30'], east:['BMP-1', 'BMP-3', 'T-15'], china:['Type 86', 'ZBL-08', 'ZBD-04A'], europe:['AMX-10P', 'Strf 9040C', 'VBCI-2'], export:['BMP-1', 'M2A2', 'BMP-3M']},
  tank:{nato:['M60A3', 'M1', 'M1A2 SEPv3'], east:['T-72', 'T-90', 'T-14'], china:['Type 79', 'Type 96A', 'Type 99A'], europe:['AMX-30B2', 'AMX-56', 'KF51'], export:['T-55', 'T-72M1', 'VT-4']},
  art:{nato:['M109A2', 'M109A6', 'M109A7'], east:['2S1', '2S19', '2S35'], china:['Type 83', 'PLZ-05', 'PCL-181'], europe:['AuF1', 'PzH 2000', 'RCH 155'], export:['2S1', '2S19', 'SH-15']},
  mlrs:{nato:['M270', 'M142', 'M270A2'], east:['BM-21', 'BM-30', '9K515'], china:['Type 81', 'PHL-03', 'PHL-16'], europe:['LARS 2', 'MARS II', 'M270A2'], export:['Type 63', 'BM-27', 'SR5']},
  sam:{nato:['MIM-23B', 'MIM-104F', 'MIM-104F MSE'], east:['9K37', 'S-400', 'S-500'], china:['HQ-7', 'HQ-9', 'HQ-9B'], europe:['Roland 2', 'SAMP/T', 'SAMP/T NG'], export:['S-125', '9K37M1', 'FD-2000']},
  jam:{nato:['AN/MLQ-34', 'AN/VLQ-12', 'TLS-BCT'], east:['SPN-2', '1L269', 'RB-109A'], china:['Type 95', 'PGL-625', 'LW-30'], europe:['Hummel', 'Fuchs EloKa', null], export:['SPN-2', 'Type 95', '1L269']},
  heli:{nato:['AH-1F', 'AH-64D', 'AH-64E'], east:['Mi-24V', 'Ka-52', 'Mi-28NM'], china:['Z-9W', 'Z-10', 'Z-10ME'], europe:['PAH-1', 'EC665', 'AW249'], export:['Mi-24D', 'Mi-35M', 'Z-10ME']},
  int:{nato:['F-4E', 'F-14D', 'F-15EX'], east:['MiG-23', 'MiG-31', 'MiG-31BM'], china:['J-7', 'J-10A', 'J-10C'], europe:['F-104G', 'JAS 39C', 'JAS 39E'], export:['MiG-21bis', 'MiG-29', 'JF-17 Block III']},
  jet:{nato:['F-16A', 'F/A-18E', 'F-35A'], east:['MiG-27', 'Su-34', 'Su-34M'], china:['Q-5', 'J-16', 'J-35A'], europe:['PA-200', 'EF-2000 T3', 'F-35A'], export:['Su-22M4', 'Su-30MK2', 'J-10CE']},
  asf:{nato:['F-15A', 'F-22A', 'F-47'], east:['Su-27', 'Su-35S', 'Su-57'], china:['J-11', 'J-20', 'J-36'], europe:['F-4F', 'EF-2000 T1', 'EF-2000 T4'], export:['MiG-23MF', 'Su-27SK', 'Su-35SE']},
  drone:{nato:['RQ-2A', 'MQ-9A', 'RQ-170'], east:['Pchela-1T', 'Forpost-R', 'S-70'], china:['ASN-206', 'GJ-2', 'WZ-7'], europe:['CL-289', 'MQ-9A', 'nEUROn'], export:['Searcher II', 'TB2', 'CH-7']},
  swarm:{nato:['Perdix', 'LASSO-300', 'LASSO-600'], east:['KUB-BLA', 'Lancet-3', 'Izdeliye 53'], china:['ASN-301', 'FH-901', 'FH-97A'], europe:['DAR', 'Warmate', 'HX-2'], export:['Harpy', 'KUB-BLA', 'Lancet-3']},
  sdrone:{nato:['MQ-1C', 'XQ-58A', 'YFQ-42A'], east:['Geran-2', 'Grom', 'S-70B'], china:['CH-4B', 'CH-7', 'GJ-11'], europe:['MQ-9A', 'nEUROn', 'Taranis'], export:['Shahed-136', 'GJ-2', 'TB3']},
  mpa:{nato:['P-3A', 'P-8A', 'MQ-4C'], east:['Be-12', 'Tu-142M3', 'Il-38N'], china:['SH-5', 'KQ-200', 'Y-9Q'], europe:['Br 1150', 'ATL2', 'P-8A'], export:['Be-12', 'Il-38', 'C-295MPA']},
  awacs:{nato:['E-2C', 'E-3G', 'E-7A'], east:['Tu-126', 'A-50U', 'A-100'], china:['KJ-200', 'KJ-500', 'KJ-500A'], europe:['E-2C', 'E-3F', 'E-7A'], export:['Ka-31', 'EMB-145 AEW', 'A-50EI']},
  bomb:{nato:['B-52G', 'B-1B', 'B-52J'], east:['Tu-16', 'Tu-22M3', 'Tu-160M'], china:['H-5', 'H-6K', 'H-6N'], europe:['B-52G', 'B-1B', 'B-52J'], export:['Tu-16', 'Tu-22M3', 'H-6K']},
  stealth:{nato:['B-2A Block 10', 'B-2A Block 30', 'B-21A'], east:['Tu-160', 'Tu-160M2', 'PAK DA'], china:['H-6N', 'H-20', 'H-20A'], europe:['B-2A Block 10', 'B-2A Block 30', 'B-21A'], export:['Tu-160', 'Tu-160M2', 'PAK DA']},
  frig:{nato:['FF-1052', 'LCS-2', 'FFG-62'], east:['Project 1135', 'Project 22350', 'Project 22350M'], china:['Type 053H', 'Type 054A', 'Type 054B'], europe:['Type 122', 'FREMM', 'Type 26'], export:['Project 1159', 'F-22P', 'Type 054A/P']},
  crui:{nato:['CG-26', 'DDG-51 Flight III', 'DDG-1000'], east:['Project 956', 'Project 1144', 'Project 1144M'], china:['Type 051', 'Type 052D', 'Type 055'], europe:['Type 42', 'Horizon', 'Type 45'], export:['Project 61', 'Type 051C', 'Type 052D']},
  sub:{nato:['SSN-637', 'SSN-21', 'SSN-774 Block V'], east:['Project 641', 'Project 971', 'Project 885M'], china:['Type 033', 'Type 039A', 'Type 093B'], europe:['Type 209', 'Astute', 'Suffren'], export:['Project 633', 'Project 636', 'S26T']},
  carr:{nato:['CV-41', 'CVN-68', 'CVN-78'], east:['Project 1143', 'Project 1143.5', 'Project 23000E'], china:['Type 001', 'Type 003', 'Type 004'], europe:['Clemenceau', 'Charles de Gaulle', 'Queen Elizabeth'], export:['Colossus', 'Project 1143.4', 'Type 002']},
  cm:{nato:['AGM-86B', 'AGM-158A', 'AGM-158B'], east:['Kh-55', 'Kh-101', '3M22'], china:['CJ-10', 'CJ-100', 'YJ-21'], europe:['AS-30L', 'KEPD 350', 'FC/ASW'], export:['P-15M', '3M-14E', 'CJ-10']},
  bm:{nato:['MGM-31A', 'MGM-140B', 'LRHW'], east:['R-17', '9K720', 'Kh-47M2'], china:['DF-11', 'DF-16', 'DF-17'], europe:['Pluton', 'MGM-140B', 'LRHW'], export:['R-17E', '9K720E', 'DF-11A']}};
const UNIT_NAME_OF = {para:'inf'};
// a unit's research level (docs/RESEARCH.md 14.1): 1 + every step done in its own line, up to 8; its look: 1 at levels 1-3, 2 at 4-6, 3 at 7-8
const UL_MAX = 8, ulLook = lv => lv >= 7 ? 3 : lv >= 4 ? 2 : 1;
// the model name of unit (or missile line) key u for group g at look k (1-3), or null
const unitModel = (u, g, k) => { const T = UNIT_NAMES[UNIT_NAME_OF[u] || u]; return T && T[g] ? T[g][Math.max(1, Math.min(3, k)) - 1] || null : null; };
const NUMW = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'];
const cap1 = w => w[0].toUpperCase() + w.slice(1);
const NEUTRAL = -1, SEA = -2;
const W = WORLD.W, H = WORLD.H, GS = WORLD.GS || 1, HS0 = 12, HS = HS0/GS, SQ3 = Math.sqrt(3);   // GS: cells per old map hex
const KM_W = HS0*SQ3/KM_HEX;          // world units per km (an old map hex is about 180 km across; one world unit is about 8.7 km)
// sight ranges in km (rules/vision.js measures them from where each unit, city or mission actually is). Places and missions here; each unit type
// carries its own (UNITS[t].vis): ground forces and fleets 50, recon/scout units (VIS_RECON) 100, aircraft in flight 150, drones (VIS_DRONE) 200.
// patrol: fighter patrols and any wing on a recon mission see at least this far; aew/mpa: AWACS orbit (location only) and maritime patrol (sea only)
// before research; sat: half the width of a satellite's strip. The UAV on station sees by its level (UAV_LV vis, rules/air.js).
const VIS_KM = {city:80, airbase:100, ground:50, recon:100, air:150, drone:200, patrol:200, aew:500, mpa:400, sat:150};
const VIS_RECON = ['spec'], VIS_DRONE = ['drone', 'sdrone', 'swarm'];
for (const t in UNITS) if (UNITS[t].vis == null) UNITS[t].vis = VIS_RECON.includes(t) ? VIS_KM.recon : VIS_DRONE.includes(t) ? VIS_KM.drone : UNITS[t].cls === 'air' ? VIS_KM.air : VIS_KM.ground;
// Attack range (km, Conflict of Nations style): these units fire from where they stand (armyXY) at enemy forces whose spot lies within this distance AND
// that their side can see (rules/vision.js armyVisible), without moving into the province (rules/combat.js rangedStep; the table and the reasons:
// docs/COMBAT.md). Scaled to the sight ranges above (ground forces see 50 km, recon 100): artillery reaches a little past its own sight, so it
// needs a spotter (a city, own land, another force, a UAV, a satellite); rockets and a cruiser's guns reach about one province.
// RANGE_HIT: what each can hit: land = forces on land (guns fire only from land), any = at sea and on land (shore bombardment), ships = only forces
// with warships at sea (torpedoes). Extended-Range Rockets research adds RANGE_ER km to Rocket Artillery (rRangeKm in rules/research.js). The
// Aircraft Carrier has no gun range (its air wings strike); missiles keep their own ranges (MISSILES range, in hexes).
const RANGE_KM = {art:80, mlrs:150, frig:80, crui:150, sub:40}, RANGE_ER = 50;
const RANGE_HIT = {art:'land', mlrs:'land', frig:'any', crui:'any', sub:'ships'};
const RANGED_T = Object.keys(RANGE_KM);
// Trade war reach (km, rules/trade.js): how far around its actual spot (armyXY) a warship stops convoys when its fleet is ordered to Blockade, and
// attacks the convoys of a route that passes within it (Raid). Frigates and cruisers use their gun range (RANGE_KM); a carrier's air wing covers
// 120 km; a submarine only its torpedo range (40 km), so submarines raid but blockade only a narrow strait or a port's approach.
// A fleet covers the longest reach among its ship types. The sea map's cells are 60 km across (rules/trade.js trCell*).
const BLOCKADE_KM = {frig:RANGE_KM.frig, crui:RANGE_KM.crui, carr:120, sub:RANGE_KM.sub};
// Chokepoints: the narrow seas the trade lanes squeeze through (one or two blockading warships close them; the open ocean needs a screen of
// several spread out). p: the passage itself (lon, lat; snapped to the nearest sea cell, where the map labels it and where a fleet blockades it);
// a, b: open water on either side (rules/trade.js chokeClosed checks the way through between them, within CHOKE_KM of the passage).
// Suez and Panama are canals: Suez is a sea link between the Mediterranean and the Red Sea (rules/map.js loadWorld canals; convoys sail its cells over TR_CANALS) that warships, troops at sea and convoys all use, whoever holds Egypt; Panama is open water on the grid.
const CHOKEPOINTS = [
  {k:'hormuz', name:'Strait of Hormuz', p:[56.4, 26.4], a:[52.5, 26.8], b:[58.8, 24.6]},
  {k:'malacca', name:'Strait of Malacca', p:[100.8, 2.9], a:[98.6, 4.6], b:[103.6, 1.4]},
  {k:'gibraltar', name:'Strait of Gibraltar', p:[-5.6, 35.95], a:[-2.5, 36.2], b:[-8.5, 36.0]},
  {k:'suez', name:'Suez Canal', p:[32.4, 30.6], a:[32.2, 31.8], b:[33.0, 28.8]},
  {k:'mandeb', name:'Bab-el-Mandeb', p:[43.4, 12.6], a:[41.8, 14.6], b:[45.5, 12.1]},
  {k:'bosporus', name:'Bosporus', p:[29.1, 41.2], a:[26.0, 40.0], b:[30.5, 42.4]},
  {k:'panama', name:'Panama Canal', p:[-79.7, 9.1], a:[-79.6, 10.2], b:[-79.4, 7.8]},
  {k:'danish', name:'Danish Straits', p:[11.6, 55.9], a:[10.6, 57.6], b:[13.5, 55.0]}];
const CHOKE_KM = 600;
// ranged damage per game hour, as a share of what the same units deal fighting in a battle (the old artillery shelling factor, kept)
const RANGED_F = 0.28;
const K = 0.25;                       // combat damage per hour factor
// Stack limits (stack efficiency, see rules/combat.js stackPenalty and docs/COMBAT.md): units of one domain in one force above its limit fight
// worse and move slower. Damage: 1 − STACK_K·ln(n ÷ limit), never below STACK_FLOOR; speed: 1 − STACK_SPD_K·ln(n ÷ limit), never below STACK_SPD_FLOOR
const STACK_LIM = {land:10, air:5, sea:5};
const STACK_K = 0.56, STACK_FLOOR = 0.25, STACK_SPD_K = 0.15, STACK_SPD_FLOOR = 0.5;
const DIFFS = [{k:'recruit', name:'Recruit', inc:0.75, war:0.6}, {k:'regular', name:'Regular', inc:1, war:1}, {k:'veteran', name:'Veteran', inc:1.2, war:1.3}, {k:'elite', name:'Elite', inc:1.45, war:1.6}];
const diffOf = () => DIFFS.find(d => d.k === (S && S.diff)) || DIFFS[1];
const GRACE_H = 24*8;                 // AI powers stay out of other powers' land for the first week
const WIN_SHARE = 0.25;               // share of land provinces needed to win
let WIN_CAPS = 5;                     // or hold this many starting capitals (5 of 15; 4 of 8 in theatre scenarios)
// The nations world (scenario world64, docs/NATIONS-PLAN.md): victory numbers follow the number of playable nations in the game
const winCapsFor = k => Math.max(5, Math.round(k/6));               // starting capitals to hold: a sixth of the nations, never fewer than 5
// share of the world's land provinces to hold. From 50 nations a tenth (step 4, Asia: with 58 nations no nation held more than 384 provinces in
// two 300-day games, a fifth is 615; a tenth, 308, decided both between day 120 and day 250, the plan's aim in 3.6). From 60 nations 7% (step 5,
// the Americas: with 67 nations the land Brazil and Canada had won on in step 4 is nations of its own, and neither 300-day game had a winner; on
// day 150 the nearest were Russia at 317 of its 460, Canada at 202 of its 308 and India at 175 of 308). With all 68 nations 6% (step 6, the full
// world; with TIER_WIN_UP 0.5 below): the war rules of step 6 keep the giants whole and neither 300-day game had a winner with 7% and 0.6 (on day
// 180 Brazil at 199 of its 216, Russia at 401 of its 460); measured on the same games, 6% and 0.5 decide one of the two on day 235 (Russia) and
// nobody before day 160 in either
const winShareFor = k => k <= 27 ? 0.25 : k <= 41 ? 0.22 : k <= 49 ? 0.2 : k <= 59 ? 0.1 : k <= 67 ? 0.07 : 0.06;
// Tiers (S superpower, A major, B regional, C minor): what a nation starts with. TIER_FULL is the plan's wide table (3.2), TIER_EVEN an equal
// start for everyone; a game mode sits between the two by its spread (0 = everyone equal, 1 = the wide table). Normal mode is close to equal
// (the owner's rule: big countries are bigger, not much richer at the start); a later competitive mode is mildly more distinctive.
//   day / mpDay: money and manpower a day the opening catch-up aims at; cash..elec: stocks; recs: Recruiting Offices outside the capital.
//   (The starting army is no longer by tier: START_ARMY below, the same for every nation; owner playtest 2026-11-27, item 3)
const TIER_RANK = {S:0, A:1, B:2, C:3};
// The Bunker at the start (owner, 2026-11-14, as Fortifications): every nation's capital starts with a Bunker of this level, and no other province has any
// (before, a tier C capital and the border guards' provinces of tiers B and C had level I, and the classic world's small powers their capital and borders: about 150 forts)
const START_FORT = 1;
// The Airbase at the start (owner, 2026-11-25): every nation's capital also starts with an Airbase of this level and one wing of START_AIR_UNIT based
// there (one Air Superiority Fighter), so every nation can patrol and scout from day one; computer nations alike. New games only (startAir, rules/state.js)
const START_AIR = 1, START_AIR_UNIT = 'asf';
// The starting army in the nations world (owner playtest 2026-11-27, item 3): the same for every nation, seats and computer nations alike, in every
// game mode; no tanks. New games only (tierStart, rules/state.js; old saves keep their armies). The whole start is this one table:
//   capital: the capital's force (beside START_AIR's fighter at its Airbase, made by startAir as before)
//   outer:   the force of each of the outerN stacks that stand in cities outside the capital (which cities: startOuter, rules/state.js, by START_OUTER)
//   recon:   THE RECON SLOT of every outer stack: added to each outer stack once the recon vehicle exists. It does not exist yet (proposal sent to the
//            owner, not approved), so it is null and skipped; on approval it becomes the new unit's key and count, e.g. {rcn:1}. A key that is not
//            a unit yet is skipped too (startForce)
//   cities:  a garrison for every other city (null: none; the start before 2026-11-27 had {inf:2})
//   guards / guard: how many border guards and their force (0: none; facing the strongest neighbour first, as before)
const START_ARMY = {capital:{inf:2, art:1}, outerN:2, outer:{inf:2}, recon:null, cities:null, guards:0, guard:{inf:2}};
// which cities hold the outer stacks (startOuter): only cities the capital reaches over the nation's own land, not next to the capital (unless fewer
// than 2 remain); weight = people, times border for a city on another nation's land border (independent land does not count) and times highway
// for one on a highway (equal weights: the more populous); the first stack the heaviest, the second the heaviest not next to the first and away
// from it: at least apart degrees from it as seen from the capital, or at least far times the capital's distance to it from both it and the capital
const START_OUTER = {apart:60, far:0.75, border:1.5, highway:1.5};
const TIER_EVEN = {day:220, mpDay:58, cash:220, mp:90, oil:40, metal:60, iron:70, elec:30, recs:2};
const TIER_FULL = {
  S:{day:310, mpDay:84, cash:320, mp:140, oil:60, metal:80, iron:90, elec:40, recs:4},
  A:{day:262, mpDay:70, cash:260, mp:110, oil:50, metal:70, iron:80, elec:35, recs:3},
  B:{day:220, mpDay:58, cash:220, mp:90, oil:40, metal:60, iron:70, elec:30, recs:2},
  C:{day:201, mpDay:52, cash:200, mp:80, oil:40, metal:60, iron:70, elec:30, recs:2}};
// floor: how far the catch-up may hold a rich nation back (income multiplier, home provinces only)
const TIER_MODES = {normal:{name:'Normal', spread:0.3, floor:0.3}, competitive:{name:'Competitive', spread:0.6, floor:0.75}};
const tierMode = k => TIER_MODES[k] || TIER_MODES.normal;
function tierKit(tier, mode){ const F = TIER_FULL[tier] || TIER_FULL.B, M = tierMode(mode), k = {};
  for (const key in TIER_EVEN) k[key] = Math.round(TIER_EVEN[key] + M.spread*(F[key] - TIER_EVEN[key]))*(isGood(key) ? RES_K : 1);   // (the stocks in RES_K units)
  k.floor = M.floor; k.yard = tier === 'S' || tier === 'A';   // (Fortifications: only the capital starts with them, START_FORT, every tier alike)
  // (the Naval Yard of a coastal S or A nation no longer takes the place of border guards: the starting army is the same for every nation, START_ARMY)
  return k; }
const tierGap = (a, b) => (TIER_RANK[b] ?? 2) - (TIER_RANK[a] ?? 2);   // how many tiers b stands below a
// (step 6, the full world: S was 2. A computer superpower in three wars of its own making, most of them across the sea against small nations with
// armies near its own, left its long borders bare: the United States lost 6 to 16% of its land in 3 seeds of 5, to Canada, Mexico and a
// Venezuelan landing that marched from Savannah to New York)
const TIER_WARS = {S:1, A:1, B:1, C:0};
// choosing a victim in the nations world: land beyond TIER_LAND provinces does not make a nation more tempting (with close-to-equal incomes a big
// country has the most land per soldier, and every neighbour went for it), and a computer nation already in TIER_GANG wars is left alone
// (two equal neighbours at once take any nation apart)
const TIER_LAND = 60, TIER_GANG = 1;   // an AI nation starts a war only while it is in at most this many wars of its own making
// growth of a computer nation in the nations world (step 3, Africa: nations of 9 to 15 provinces amid wide independent land tripled or quadrupled
// in 60 days). It goes for independent provinces only while it holds less than TIER_FREE times its starting land (it still fights nations, and
// takes back its own lost land, beyond that); holding TIER_SATED times its start it makes peace with its enemies and starts no new war
const TIER_FREE = 1.5, TIER_SATED = 2;
// (step 4, Asia: with the two limits for good no computer nation could win, by land or capitals, in 300 days.) "For now" ends: from day TIER_LATE
// both limits grow by their first value every TIER_LATE days (day 90: 1.5 times, day 120: twice), so the land race opens up once the opening is over
const TIER_LATE = 60, tierGrow = h => 1 + Math.max(0, h/24 - TIER_LATE)/TIER_LATE;
// a war between peers (step 4, Asia: China and India, among equals, never had the 1.1 times the power the computer wants against any victim): a
// computer nation of tier S or A attacks a nation of tier S or A with TIER_PEER times its power, and counts it TIER_PEER_W times as tempting
const TIER_PEER = 0.95, TIER_PEER_W = 1.5;
// rivals (step 4 repair: China, weaker in arms than India and Russia through most of the second month, and with both always at war with somebody
// so the TIER_GANG limit shut them out, fought only smaller nations on day 60 in 3 seeds of 5): a computer nation of tier S attacks another of
// tier S with TIER_RIVAL times its power, and may be that nation's second enemy (the TIER_GANG limit is one more, as for a person's nation)
const TIER_RIVAL = 0.85;
// a second front against a major power (step 5, the Americas: the United States declared war on Canada and on Mexico a day or two apart, at 1.1
// to 1.5 times the power of each but less than both, and lost a fifth of its land in 4 seeds of 5): a computer nation of tier S or A already at
// war with a nation of tier A attacks another nation of tier S or A (not its rival of tier S) only with the power for all of them: its thresholds
// above against the new peer's power plus TIER_FRONT times the power of the tier A nations it already fights. A war of two rivals of tier S is
// not counted as a front (counting it too, India, at war with China, no longer took on Pakistan: on day 60 it fought China or a peer in 1 seed of 5)
const TIER_FRONT = 1;
// the long war of two rivals (step 5: with the Americas open, India fought China or a peer on day 60 in 2 seeds of 5, though in all 5 in the second
// month: computer nations tire of a war after 20 days, and the rivals' wars of the first month were over by day 60): two computer nations of tier
// S tire of their war only after TIER_RIVAL_WAR days (being outmatched, losing land or fighting on three fronts still ends it sooner)
// (step 6, the full world: 40 before. With 68 nations China's wars with India and Russia began in the first two weeks and were over before day 60
// in 4 seeds of 5)
const TIER_RIVAL_WAR = 60, warTires = (a, b) => S.nations[a].tier === 'S' && S.nations[b].tier === 'S' && S.nations[a].ai && S.nations[b].ai ? TIER_RIVAL_WAR : 20;
// whom a computer nation may attack, by tier (step 6, the full world: the United States held 95% of its land on day 60 in 2 seeds of 5 and China
// fought a peer on day 60 in 1). With close-to-equal incomes a big country has no bigger army than a small one and the most border to hold, so a
// war it starts at near-even odds costs it its home: the United States declared on Mexico at 1.16 times Mexico's power, on Cuba at 1.2 and on
// Venezuela at 1.5, lost the army it had, and its other neighbour took the bare border. The peer threshold (TIER_PEER) is for nations of one tier
// and an attacker one tier above; besides it:
//   TIER_DOWN_A  a computer superpower attacks a nation of tier A only with this many times its power (a major power is no easy war)
//   TIER_UP      a computer nation that is not a superpower attacks one only with this many times its power (Canada declared at 0.98)
//   TIER_BULLY   a computer nation two or more tiers above its victim (S against B or C, A against C) attacks only with this many times its power
//                (plan 3.5: giants are steered toward each other; a small nation fights for its life). Tried at 1.5: the United States took on
//                Venezuela at 1.51 and lost 42 provinces in one seed
const TIER_DOWN_A = 1.6, TIER_UP = 1.3, TIER_BULLY = 2;
// land to win in the nations world: the share of the world (winShareFor), or the starting land plus 90 provinces or plus TIER_WIN_UP of it if
// that is more (step 4: with a tenth of the world, 308, the United States, 230 provinces, won on day 25 on independent land alone; then it needed 368;
// step 6: 0.6 before, the United States now needs 345, Russia 431, China 372)
const TIER_WIN_UP = 0.5;
let DAY_LIMIT = Infinity;             // no day limit: the war runs until someone wins by land share or capitals
const CAP_MIN = 1;                    // ground units needed to capture (one, as in Conflict of Nations; it was 2)
const OX = HS*SQ3/2 + 8, OY = HS + 8;
const WORLD_W = HS*SQ3*(W + 0.5) + 16, WORLD_H = HS*1.5*(H - 1) + 2*HS + 16;
/* ---------------- Resource scale ---------------- */
// the one place the tables above are scaled to RES_K (see RES_K at the top): units (prices, fuel, maintenance), missiles, buildings and their
// level tables, every research price (computed in the old units first, so its rounding is unchanged), the yields of cities, the countryside and the
// capital, and the refunds of the removed buildings. Starting stocks: tierKit (above) and newGame / tierStart (rules/state.js); storage: stockCap,
// the market and the AI's thresholds: rules/economy.js, rules/ai.js; links, satellites, aid: their own files, each with RES_K beside the number.
{ const seen = new Set(), xK = o => { if (!o || seen.has(o)) return; seen.add(o); for (const k of GOODS) if (typeof o[k] === 'number') o[k] *= RES_K; };
  for (const t in UNITS){ xK(UNITS[t]); UNITS[t].fuel *= RES_K; MAINT[t].iron *= RES_K; MAINT[t].elec *= RES_K; }
  for (const k in MISSILES) xK(MISSILES[k]);
  for (const k in BUILD){ xK(BUILD[k]); xK(BUILD[k].lv1); } for (const L of REC_LV) xK(L); for (const L of BUNKER_LV) xK(L);
  for (const k in ECO_OLD) xK(ECO_OLD[k]);
  for (const nd of RNODES) for (const l of nd.lv) xK(l.c);
  xK(ECO_Y); xK(ECO_CAPITAL); for (const k in ECO_RUR) ECO_RUR[k] *= RES_K; }
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
const yieldStr = y => YK.filter(k => y[k] >= (k === 'rare' ? 0.25 : 0.5)*(isGood(k) ? RES_K : 1)).map(k => k === 'cash' ? `$${Math.round(y[k])}M` : k === 'mp' ? `${Math.round(y[k])}k manpower` : `${fmt(Math.round(y[k]))} ${rlbl(k)}`).join(' · ') || '—';
// goods in numbers and words (RES_K). RES_UNIT: what one unit of a good is. Electronics come in crates (a crate of avionics, radios, sensors);
// manpower is kept in thousands of people (80k) and said as people
const RES_UNIT = {oil:['barrel', 'barrels'], metal:['ton', 'tons'], iron:['ton', 'tons'], elec:['crate', 'crates'], rare:['ton', 'tons'], mp:['person', 'people']};
// the short form where space is tight: 950, 9.5K, 40K, 950K, 1.2M, 12M (cut, not rounded up: 39,960 is 39K, never a 40K it does not have)
const fmtQ = v => { const a = Math.abs(v), s = v <= -1 ? '-' : '', d1 = x => String(Math.floor(x*10 + 1e-9)/10);
  return s + (a < 1e3 ? String(Math.floor(a + 1e-9)) : a < 1e4 ? d1(a/1e3) + 'K' : a < 1e6 ? Math.floor(a/1e3 + 1e-9) + 'K' : a < 1e7 ? d1(a/1e6) + 'M' : Math.floor(a/1e6 + 1e-9) + 'M'); };
// the full amount with its unit: '40,000 barrels of oil', '70,000 tons of iron', '80,000 people' (manpower), '$220M'
const resFull = (k, v) => { if (k === 'cash') return `$${fmt(v)}M`; if (k === 'mp') return `${fmt(v*1000)} people`; const u = RES_UNIT[k] || ['unit', 'units'], q = Math.floor(v); return `${fmt(q)} ${q === 1 ? u[0] : u[1]} of ${rlbl(k)}`; };
// a Market price, quoted per MKT_LOT units: '$3.20M per 1,000 barrels'
const lotPriceTxt = (k, price) => `$${(+price).toFixed(2)}M per ${fmt(MKT_LOT)} ${(RES_UNIT[k] || ['unit', 'units'])[1]}`;
