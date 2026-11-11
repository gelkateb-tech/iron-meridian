// Iron Meridian rules: state. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
const WORLD_POWERS = [
  {name:'United States',  country:'United States of America', color:'#3f7fe0'},
  {name:'Canada',         country:'Canada',        color:'#c8323c'},
  {name:'Brazil',         country:'Brazil',        color:'#3fae5a'},
  {name:'United Kingdom', country:'United Kingdom',color:'#9370e6'},
  {name:'France',         country:'France',        color:'#36bcc4'},
  {name:'Germany',        country:'Germany',       color:'#5672a6'},
  {name:'Russia',         country:'Russia',        color:'#a3283f'},
  {name:'Turkey',         country:'Turkey',        color:'#b45aa8'},
  {name:'Iran',           country:'Iran',          color:'#7cc04a'},
  {name:'Egypt',          country:'Egypt',         color:'#c2a070'},
  {name:'South Africa',   country:'South Africa',  color:'#2ea48d'},
  {name:'India',          country:'India',         color:'#ff8a3d'},
  {name:'China',          country:'China',         color:'#e8cf47'},
  {name:'Japan',          country:'Japan',         color:'#b65acc'},
  {name:'Australia',      country:'Australia',     color:'#1fa3a3'},
];
// display colours replaced since older saves (olive Germany read as farmland, brown Russia as steppe, white Japan as snow; rose Poland matched the new
// crimson Russia): old -> new, applied on load. Colour is display only.
const OLD_COLORS = {'#8a9a3e':'#5672a6', '#7a5536':'#a3283f', '#eeeeea':'#b65acc', '#d8566e':'#d6c83c'};
// scenarios: which powers play and which part of the world counts for victory
const PW = n => WORLD_POWERS.find(p => p.name === n);
const SCENARIOS = {
  world:{name:'World War', desc:'Fifteen powers across the whole globe.', powers:WORLD_POWERS, caps:5, box:null, extra:90},
  europe:{name:'European Theatre', desc:'Eight powers fight for Europe and its rim.', caps:4, extra:45, box:L => (L.lon >= -25 && L.lon <= 60 && L.lat >= 33 && L.lat <= 72),
    powers:[PW('United Kingdom'), PW('France'), PW('Germany'), {name:'Italy', country:'Italy', color:'#3fae5a'}, {name:'Spain', country:'Spain', color:'#d9a03a'}, {name:'Poland', country:'Poland', color:'#d6c83c'}, PW('Turkey'), PW('Russia')]},
  pacific:{name:'Pacific Rim', desc:'Eight powers contest the Pacific and East Asia.', caps:4, extra:45, box:L => ((L.lon >= 70 || L.lon <= -95) && L.lat >= -48 && L.lat <= 66),
    powers:[PW('United States'), PW('China'), PW('Japan'), PW('Australia'), PW('India'), PW('Russia'), {name:'Indonesia', country:'Indonesia', color:'#c8323c'}, {name:'Mexico', country:'Mexico', color:'#3fae5a'}]},
};
// The nations world (key world64, docs/NATIONS-PLAN.md): its playable nations come from nations.js (NATIONS: the regions rolled out so far), each
// with a tier, a region, a capital and its list of cities; everything else on the map is independent land. It runs on the tier rules (start kit,
// catch-up, border guards, grace by tier gap, victory numbers by the number of nations). The classic 15-power world above stays as it was.
const HAS_NATIONS = !!NATIONS && Array.isArray(NATIONS.nations) && NATIONS.nations.length > 1;
if (HAS_NATIONS) SCENARIOS.world64 = {name:'World War III', desc:'The nations of the world, close to equal at the start.', powers:NATIONS.nations, caps:winCapsFor(NATIONS.nations.length), box:null, extra:90, tiers:true};
let POWERS = WORLD_POWERS, SCN = 'world';
function useScenario(k){ SCN = SCENARIOS[k] ? k : 'world'; POWERS = SCENARIOS[SCN].powers; WIN_CAPS = SCENARIOS[SCN].caps; scnLandCache = null; scnInCache = null; }
const tiered = () => !!SCENARIOS[SCN].tiers;
// the cities of the nations world: the lists of nations.js, plus the cities world.js gives every country that is not (yet) a playable nation
function nationsWorld(){ const play = new Set(NATIONS.nations.map(n => n.country)), cities = [], names = {};   // (on the map in use: G.D, its province rows)
  for (let id = 0; id < G.D.length; id++){ const d = G.D[id]; if (d[1] >= 0 && (d[2] & 1) && !play.has(WORLD.countries[d[1]])) cities.push(id); }
  for (const n of NATIONS.nations){ for (const c of n.cities) cities.push(c); if (n.names) for (const id in n.names) names[id] = n.names[id]; }
  return {v:NATIONS.v, cities:cities.sort((a, b) => a - b), names}; }
// a power's strength index, from the map alone (the money its land earns at the opening, before any catch-up): used to face border guards
// toward the strongest neighbour, to make friends of the neighbours of a giant and for the difficulty shown on the start screen
function powerStrength(P0){ const ci = powerCountry(P0), cs = new Set(P0.cities || []); let v = 0; if (ci < 0) return 0;
  for (const id of G.countries[ci].provs){ const P = G.P[id], city = P0.cities ? cs.has(id) : G.base.city[id]; v += (city ? 8.5 : 1.8*G.PF) + 0.68*Math.pow(Math.max(0, P.pop0), 0.75); } return v; }
// the powers of list L that touch power i by land on its home landmass (the one of its capital; overseas parts are left out)
function powerNeighbours(L, i){ const ci = powerCountry(L[i]); if (ci < 0) return []; const ids = new Set(G.countries[ci].provs), byC = new Map(L.map((p, k) => [powerCountry(p), k]));
  const c0 = L[i].capital ?? G.countries[ci].provs.find(id => G.base.cap[id]) ?? G.countries[ci].provs.find(id => G.base.city[id]) ?? G.countries[ci].provs[0], seen = new Set([c0]), q = [c0], out = new Set();
  for (let h = 0; h < q.length; h++) for (const v of G.P[q[h]].nbs){ const Q = G.P[v]; if (Q.sea) continue; if (ids.has(v)){ if (!seen.has(v)){ seen.add(v); q.push(v); } } else if (byC.has(Q.country) && byC.get(Q.country) !== i) out.add(byC.get(Q.country)); }
  return [...out]; }
// how hard a nation of the nations world is to play: its tier and its strongest land neighbour against its own strength
function powerDifficulty(L, i){ const s0 = powerStrength(L[i]), r = Math.max(0, ...powerNeighbours(L, i).map(k => powerStrength(L[k])/Math.max(1, s0))), t = L[i].tier;
  return r > 3 ? 'Very hard' : r > 2 ? 'Hard' : (t === 'S' || t === 'A') && r <= 1.5 ? 'Easy' : 'Normal'; }
let scnLandCache = null, scnInCache = null;
function inScn(p){ if (!scnInCache || scnInCache.S !== SCN){ const box = SCENARIOS[SCN].box; scnInCache = {S:SCN, a:G.P.map(P => !P.sea && (!box || box({lat:P.lat, lon:((((P.cc % W) + 0.5)/W*360 + WORLD.lon0) + 540) % 360 - 180})))}; } return scnInCache.a[p]; }
const landHeld = n => { let c = 0; for (let p = 0; p < S.owner.length; p++) if (S.owner[p] === n && inScn(p)) c++; return c; };
function scnLand(){ if (scnLandCache) return scnLandCache; const box = SCENARIOS[SCN].box; if (!box) return (scnLandCache = G.landCount);
  return (scnLandCache = G.P.filter(P => !P.sea && box({lat:P.lat, lon:((((P.cc % W) + 0.5)/W*360 + WORLD.lon0) + 540) % 360 - 180})).length); }
/* ---------------- State ---------------- */
let G = null, S = null;
const powerCountry = p => WORLD.countries.indexOf(p.country);
function resetCaches(){ if (S){ S.bt = {}; } SUP = null; supHour = -1; BLOCK = new Set(); visCache = null; borderCache = null; trLastH = -1; NEUP = null; SEAA = new Map(); IM.emit('reset'); }
// seed: the dice; pick: the power that takes nation 0; humans: the nations people play (the seats, none unless given); the AI plays the rest
function newGame(seed, pick, humans = []){
  const T = tiered(); useMap(T ? MAP_NEW : 0);   // the nations world: the map with the province split (when nations.js has one); any other world: world.js
  const W64 = T ? nationsWorld() : null, mode = T && TIER_MODES[newGame.mode] ? newGame.mode : 'normal';
  useWorld(T ? {cities:W64.cities, caps:POWERS.map(p => p.capital), names:W64.names} : null);
  resetCaches();
  const order = [pick, ...POWERS.map((_, i) => i).filter(i => i !== pick)];
  const owner = G.P.map(p => p.sea ? SEA : NEUTRAL);
  const nations = order.map((pi, k) => {
    const P0 = POWERS[pi], ci = powerCountry(P0), provs = ci >= 0 ? G.countries[ci].provs : [];
    for (const id of provs) owner[id] = k;
    const capital = (T ? P0.capital : null) ?? provs.find(id => G.P[id].capFlag) ?? provs.find(id => G.P[id].city) ?? provs[0];
    G.P[capital].city = true;
    const N = {id:k, power:pi, name:P0.name, color:P0.color, ai:!humans.includes(k), cash:220, oil:40, metal:60, iron:70, elec:30, rare:40, mp:80, short:{}, alive:true, capital, tech:{}, research:null, research2:null, mk:{}, eng:null, doc:null};   // no national doctrines
    if (T){ N.tier = P0.tier || 'B'; N.region = P0.region || ''; }
    return N;
  });
  S = {v:4, scn:SCN, len:DAY_LIMIT, persist:!!newGame.persist, seed, hour:0, speed:0, owner, bld:G.P.map(() => newBld()), cons:G.P.map(() => null), queue:G.P.map(() => []),
       armies:[], cap:G.P.map(() => null), occ:G.P.map(() => null), home:owner.slice(), rel:{}, mem:{}, decl:[], offers:[], unrest:G.P.map(() => 0), spies:[], log:[], nid:1, rs:(seed ^ 0x9e3779b9) | 0, over:null, battles:[], nations, links:{}};
  S.mob = 1;   // made under the mobilization rule (see mobMigrate)
  S.eco = 1;   // made under the city-resource economy (see ecoMigrate)
  if (T){ S.w64 = W64; S.mode = mode; if (G.map) S.map = G.map; }   // (S.map: the map the save needs; absent for world.js)   // the nations world: its cities travel with the save, so a save keeps its own world when nations.js grows
  linksSync();
  if (T) tierStart(mode);
  else for (const n of S.nations){
    const np = S.owner.filter(o => o === n.id).length;
    n.cap0 = n.capital; n.small = np <= (GS > 1 ? 40 : 10);
    n.boost = 1; n.boost = Math.max(1, Math.min(2.5, 220/Math.max(1, income(n.id).gross.cash)));
    S.bld[n.capital].fac = 1;
    for (const p of startRecs(n.id)) S.bld[p].rec = 1;   // infantry needs a Recruiting Office: the capital and the two biggest other cities start with one
    addArmy(n.id, n.capital, {inf:4, tank:1});
    for (const P of G.P) if (S.owner[P.id] === n.id && P.city && P.id !== n.capital) addArmy(n.id, P.id, {inf:2});
    // compact powers (Germany, Japan, Britain...) start with a denser, dug-in home army
    if (n.small){ S.bld[n.capital].fort = 1; addArmy(n.id, n.capital, {inf:3, tank:1, art:1});
      for (const P of G.P) if (S.owner[P.id] === n.id && P.id !== n.capital && !P.city && P.nbs.some(m => S.owner[m] !== n.id && !G.P[m].sea)) { addArmy(n.id, P.id, {inf:2}); S.bld[P.id].fort = 1; } }
  }
  for (const n of S.nations){ n.score0 = score(n.id); n.prov0 = S.owner.filter(o => o === n.id).length; n.prov0In = landHeld(n.id); }
  S.own0 = S.owner.slice();
  for (const me of seats()) desk(me).sunOff = sunOffFor(me);   // display only: the seat's opening view over its capital is in daylight
  for (const P of G.P) if (S.owner[P.id] === NEUTRAL){ if (P.city) addArmy(NEUTRAL, P.id, {inf:5 + Math.floor(rng()*4)}); else if (GS === 1 || rng() < 0.4) addArmy(NEUTRAL, P.id, {inf:2 + Math.floor(rng()*2)}); }
  INCC.v = -1; trS(); tradeGen(); INCC.v = -1;
  if (T){ tierCatchUp(mode); INCC.v = -1; }
  tellAll(me => `${S.nations[me].name} mobilizes. ${cap1(NUMW[S.nations.length - 1] || String(S.nations.length - 1))} rival powers are moving too.`, '');
  IM.emit('newGame');
}
// ---- the nations world: the start by tier (docs/NATIONS-PLAN.md 3.2 to 3.5; the numbers are tierKit's, rules/data.js)
// Every nation: its tier's stocks, an Army Base and a Recruiting Office in the capital, more offices in its biggest cities, the capital force,
// 2 infantry in every other city (a tank more in the biggest), border guards facing the strongest neighbour first (in a level 1 fort for tiers
// B and C), a Naval Yard in the biggest port for coastal nations of tiers S and A (in place of kit.yardGuards guards), a level 1 fort in a tier C capital.
// Neighbours of the same giant (a land neighbour more than 3 times their strength) start as friends. No dice are used.
function tierStart(mode){ const L = S.nations.map(N => POWERS[N.power]), str = L.map(powerStrength), nbs = L.map((_, i) => powerNeighbours(L, i));   // by nation id
  for (const N of S.nations){ const n = N.id, kit = tierKit(N.tier, mode);
    N.cap0 = N.capital;
    const cities = G.P.filter(P => S.owner[P.id] === n && P.city && P.id !== N.capital).sort((a, b) => popOf(b.id) - popOf(a.id) || a.id - b.id);
    for (const k of ['cash', 'mp', 'oil', 'metal', 'iron', 'elec']) N[k] = kit[k];
    N.rare = [N.capital, ...cities.map(P => P.id)].some(p => G.P[p].main === 'rare') ? 40 : 60;   // no rare-earth city: a little more in stock for the first weeks
    S.bld[N.capital].fac = 1; for (const p of startRecs(n, kit.recs)) S.bld[p].rec = 1;
    if (kit.fortCap) S.bld[N.capital].fort = 1;
    addArmy(n, N.capital, {inf:kit.inf, tank:kit.tank, art:kit.art});
    cities.forEach((P, k) => addArmy(n, P.id, k < kit.cityTanks ? {inf:2, tank:1} : {inf:2}));
    let guards = kit.guards;
    if (kit.yard){ const port = [G.P[N.capital], ...cities].filter(P => P.coast).sort((a, b) => popOf(b.id) - popOf(a.id) || a.id - b.id)[0]; if (port){ S.bld[port.id].yard = 1; guards = Math.max(0, guards - kit.yardGuards); } }
    // border provinces that are not cities, by the neighbour they face: playable neighbours strongest first, then independent land; one guard per neighbour in turn
    const face = new Map();
    for (const P of G.P){ if (S.owner[P.id] !== n || P.city) continue; for (const v of P.nbs){ const o = S.owner[v]; if (G.P[v].sea || o === n || o === SEA) continue; const f = face.get(o) || face.set(o, []).get(o); if (!f.includes(P.id)) f.push(P.id); } }
    const order = [...face.keys()].sort((a, b) => (b < 0 ? -1 : str[b]) - (a < 0 ? -1 : str[a]) || a - b), used = new Set();
    for (const f of face.values()) f.sort((a, b) => popOf(b) - popOf(a) || a - b);
    for (let g = 0, turn = 0, idle = 0; g < guards && order.length && idle < order.length; turn++){ const p = face.get(order[turn % order.length]).find(q => !used.has(q));
      if (p == null){ idle++; continue; } idle = 0; used.add(p); addArmy(n, p, {inf:2}); if (kit.fortGuards) S.bld[p].fort = 1; g++; }
  }
  // friends of a shared giant
  const giants = S.nations.map(N => nbs[N.id].filter(k => str[k] > 3*str[N.id]));
  for (const A of S.nations) for (const B of S.nations) if (A.id < B.id && giants[A.id].some(k => giants[B.id].includes(k))){ addMem(A.id, B.id, 25); addMem(B.id, A.id, 25); }
}
// the opening catch-up by tier: money and manpower a day are brought to the tier's targets by a multiplier on the nation's home provinces (boost
// for money and goods, boostM for manpower), between the mode's floor and 2.5; a nation already between its target and 10% above is left alone,
// a richer one is held to 10% above (as far as the floor allows). Conquests are worth the same to everyone.
function tierCatchUp(mode){ const mult = (raw, trade, T, floor) => { const home = Math.max(1, raw - trade), lo = T - trade, hi = 1.1*T - trade; return Math.max(floor, Math.min(2.5, home < lo ? lo/home : home > hi ? hi/home : 1)); };
  for (const N of S.nations){ N.boost = 1; N.boostM = 1; } INCC.v = -1;
  const raw = S.nations.map(N => income(N.id).gross), tr = S.nations.map(N => tradeIncome(N.id).cash);
  for (const N of S.nations){ const kit = tierKit(N.tier, mode); N.boost = mult(raw[N.id].cash, tr[N.id], kit.day, kit.floor); N.boostM = mult(raw[N.id].mp, 0, kit.mpDay, kit.floor); } }
// where a nation's first Recruiting Offices stand: its capital, then its biggest other cities (k of them)
function startRecs(n, k = 2){ const N = S.nations[n], cs = G.P.filter(P => S.owner[P.id] === n && P.city && P.id !== N.capital).sort((a, b) => popOf(b.id) - popOf(a.id) || a.id - b.id).slice(0, k).map(P => P.id); return [N.capital, ...cs]; }
// saves from before infantry needed a Recruiting Office: every living nation gets one at its capital if it has none (units already in training carry on)
function mobMigrate(){ if (S.mob) return; S.mob = 1; const got = new Set();
  for (const N of S.nations){ const c = N.capital; if (!N.alive || S.owner[c] !== N.id || !S.bld[c] || S.bld[c].rec) continue; S.bld[c].rec = 1; got.add(N.id); }
  for (const me of seats()){ const D = desk(me); if (Array.isArray(D.log)) D.log.unshift({h:S.hour, text:`New rule: infantry is mobilized only in cities with a Recruiting Office.${got.has(me) ? ' Your capital has been given one' : ' Your capital has one'}; build more in your other cities. Units already in training carry on.`, kind:'info', p:S.nations[me].capital}); } }
// saves from before the city-resource economy (each city one main resource; Arms Factory -> Army Base under the same key; Arms Industry new):
// Refineries, Foundries and Rare Earth Mines are gone. Every level built is refunded to the province's owner at the un-raised price (money, materials
// and iron), one under construction is cancelled and refunded, a knocked-out one forgotten. Materials and iron that would not fit in the stores are
// paid in money at the base price. The Economy research branch is gone too: what was researched keeps its effect (income0), a project still running
// is completed at once (it was paid for). City main resources come from the map, so there is nothing to migrate for them.
function ecoMigrate(){ if (S.eco) return; S.eco = 1; const got = {};
  const refund = (o, k, lvl) => { if (o == null || o < 0 || !S.nations[o]) return; const B = ECO_OLD[k], m = Math.pow(1.6, lvl - 1), r = got[o] || (got[o] = {lv:0, cash:0, metal:0, iron:0}); r.lv++; r.cash += Math.round(B.cost*m); r.metal += Math.round(B.metal*m); r.iron += Math.round(B.iron*m); };
  for (let p = 0; p < S.bld.length; p++){ const b = S.bld[p], o = S.owner[p], d = bdisOf(p);
    for (const k in ECO_OLD){ if (b && b[k] > 0) for (let l = 1; l <= b[k]; l++) refund(o, k, l); if (b) delete b[k]; if (d && typeof d === 'object') delete d[k]; }
    const c = S.cons[p]; if (c && ECO_OLD[c.k]){ refund(o, c.k, c.lvl || 1); S.cons[p] = null; } }
  for (const o in got){ const N = S.nations[o], r = got[o], cap = stockCap(+o); N.cash += r.cash; r.paid = r.cash;
    for (const k of ['metal', 'iron']){ const fit = Math.max(0, Math.min(r[k], Math.floor(cap - N[k]))); N[k] += fit; if (r[k] > fit){ const x = (r[k] - fit)*MKT_BASE[k]; N.cash += x; r.paid += x; r[k] = fit; } } }
  for (const N of S.nations){ if (!N.tech) N.tech = {}; for (const s of R_SLOTS){ const R = N[s]; if (R && ECO_OLD_TECH[R.id]){ N.tech[R.id] = 1; N.tv = (N.tv || 0) + 1; N[s] = null; } } if (N.rPick && ECO_OLD_TECH[N.rPick.id]) N.rPick = null; }
  if (S.trade && Array.isArray(S.trade.routes)) for (const r of S.trade.routes) trValue(r);
  INCC.v = -1;
  for (const me of seats()){ const D = desk(me), r = got[me], N = S.nations[me], kept = Object.keys(ECO_OLD_TECH).filter(id => N.tech && N.tech[id]).map(id => ECO_OLD_TECH[id]);
    if (Array.isArray(D.log)) D.log.unshift({h:S.hour, kind:'info', p:N.capital, text:'New economy: every city now produces one main resource (money, oil, materials, iron, electronics or rare materials); build an Arms Industry in a city to raise what it produces by 25% per level. Arms Factories are now Army Bases: they mobilize ground units and give no income.'
      + (r ? ` Refineries, Foundries and Rare Earth Mines are gone: ${r.lv} level${r.lv > 1 ? 's' : ''} refunded ($${fmt(r.paid)}M${r.metal ? ', ' + fmt(r.metal) + ' materials' : ''}${r.iron ? ', ' + fmt(r.iron) + ' iron' : ''}).` : '')
      + (kept.length ? ` The Economy research branch moved into buildings; you keep the bonus of ${kept.join(', ')}.` : '')}); } }
function newBld(){ const b = {}; for (const k of BK) b[k] = 0; return b; }
function serialize(){ return JSON.parse(saveJSON()); }
// the save as text in one pass: zero unit counts and wounds, and zero building levels, are left out (restore fills them back in), wounds rounded
function saveJSON(){ const BLD = S.bld; return JSON.stringify({...S, battles:[]}, function(k, v){
  if (v && typeof v === 'object' && !Array.isArray(v)){
    if ((k === 'u' || k === 'w') && this && this.id != null && this.at != null){ const o = {}; for (const t in v){ const x = v[t]; if (x) o[t] = k === 'w' ? Math.round(x*1000)/1000 : x; } return o; }
    if (this === BLD){ const o = {}; for (const t in v) if (v[t]) o[t] = v[t]; return o; } }
  return v; }); }
function restore(data){
  if (!data || data.v !== 4 || typeof data.seed !== 'number') return false;
  // the map the save was made on (data.map; none: world.js), checked before anything changes: a refused save leaves the game in play as it was
  restore.why = ''; const mv = data.map || 0, g = mapOf(mv);
  if (!g){ restore.why = 'This save is from a newer version of the nations world than this build has. Update the game to load it.'; return false; }
  if (!Array.isArray(data.owner) || data.owner.length !== g.P.length) return false;
  // a save of the nations world carries its own cities (data.w64); it needs a build that has that world and knows its format
  const n64 = data.scn === 'world64';
  if (n64 && (!SCENARIOS.world64 || !data.w64 || !Array.isArray(data.w64.cities) || data.w64.v > NATIONS.v)){ restore.why = 'This save is from a newer version of the nations world than this build has. Update the game to load it.'; return false; }
  useMap(mv);
  S = data; S.battles = []; S.bt = {}; S.speed = 0; S.started = true;
  useWorld(n64 ? {cities:S.w64.cities, caps:S.nations.map(N => N.cap0 ?? N.capital), names:S.w64.names} : null);
  linksSync();
  { const nc = c => c && OLD_COLORS[String(c).toLowerCase()]; for (const N of S.nations){ if (nc(N.color)) N.color = nc(N.color); if (nc(N.color0)) N.color0 = nc(N.color0); } }   // old palette entries -> current ones
  useScenario(n64 ? 'world64' : 'world'); DAY_LIMIT = Infinity;   // older saves with a scenario or a day limit continue as an open-ended world war
  if (n64) WIN_CAPS = winCapsFor(S.nations.length);   // (the save's own number of nations, not this build's)
  resetCaches();
  for (const a of S.armies){ if (a.m == null) a.m = 80; for (const t of UT){ if (a.u[t] == null) a.u[t] = 0; if (a.w[t] == null) a.w[t] = 0; } }
  for (const b of S.bld) for (const k of BK) if (b[k] == null) b[k] = 0;
  S.rel = S.rel || {}; S.mem = S.mem || {}; S.decl = S.decl || []; S.offers = S.offers || []; S.mstock = S.mstock || {}; S.inflight = S.inflight || []; S.unrest = S.unrest || G.P.map(() => 0); S.spies = S.spies || [];
  fixWings();
  if (!S.trade){ trS(); tradeGen(); } else trS();   // saves from before trade routes: lay them out now
  for (const N of S.nations) if (N.ai === undefined) N.ai = N.id !== 0;   // (every save so far carries the flag: nation 0 is the seat of a one-player game)
  for (const N of S.nations){ if (!N.tech) N.tech = {}; if (N.research === undefined) N.research = null; if (N.research2 === undefined) N.research2 = null; G.P[N.capital].city = true; }
  for (const me of seats()){ const D = desk(me); if (D.sunOff == null) D.sunOff = sunOffFor(me); }   // older saves: the same display-only daylight offset
  resMigrate();
  rqueueMigrate();
  mobMigrate();
  ecoMigrate();
  IM.emit('restored');
  return true;
}
// saves from before iron, electronics and rare materials (and with food): food is dropped everywhere, the new goods start at the new-game stocks
function resMigrate(){
  for (const N of S.nations){ delete N.food; if (N.short) delete N.short.food; for (const [k, v] of [['iron', 50], ['elec', 30], ['rare', 40]]) if (typeof N[k] !== 'number' || !isFinite(N[k])) N[k] = v; }
  // Farms are gone: each level is refunded ($20M), a farm under construction is cancelled (refunded), a knocked-out one forgotten
  for (let p = 0; p < S.bld.length; p++){ const b = S.bld[p], o = S.owner[p], N = o >= 0 ? S.nations[o] : null;
    if (b && b.farm){ if (N) N.cash += 20*b.farm; } if (b) delete b.farm;
    const c = S.cons[p]; if (c && !BUILD[c.k] && !ECO_OLD[c.k]){ if (N) N.cash += 20; S.cons[p] = null; }
    if (S.bdis && S.bdis[p] && typeof S.bdis[p] === 'object') delete S.bdis[p].farm; }
  // food listings: a sell offer's food is gone, a buy offer's money goes back to its owner
  if (Array.isArray(S.book)) S.book = S.book.filter(o => { if (MKT_K.includes(o.res)) return true; if (isBid(o) && S.nations[o.seller]) S.nations[o.seller].cash += o.qty*o.price; return false; });
  mktFix();
  // a pending trade offer that moved food no longer balances once the food is gone (and one that only sold food would ask money for nothing): drop it; the rest just lose the food key
  const hadFood = sd => !!(sd && sd.food > 0);
  if (Array.isArray(S.offers)) S.offers = S.offers.filter(o => !(o.deal && (hadFood(o.deal.give) || hadFood(o.deal.get))));
  for (const o of S.offers || []) if (o.deal){ o.deal.give = sideFix(o.deal.give); o.deal.get = sideFix(o.deal.get); }
  // old messages, dispatches and front pages that talk about food or farms are forgotten
  const oldTxt = t => typeof t === 'string' && /\b(food|farms?)\b/i.test(t);
  if (Array.isArray(S.log)) S.log = S.log.filter(e => !(e && oldTxt(e.text)));
  if (S.chat && typeof S.chat === 'object') for (const n in S.chat) if (Array.isArray(S.chat[n])) S.chat[n] = S.chat[n].filter(m => !(m && oldTxt(m.text)));
  for (const P of Array.isArray(S.papers) ? S.papers : []){ if (Array.isArray(P.items)) P.items = P.items.filter(t => !oldTxt(t)); if (oldTxt(P.head)) P.head = P.items && P.items.length ? P.items.shift() : 'Quiet day on the fronts.'; }
  if (S.trade && Array.isArray(S.trade.routes)) for (const r of S.trade.routes) if ((r.va && !MKT_K.includes(r.va.k)) || (r.vb && !MKT_K.includes(r.vb.k))) trValue(r);
  INCC.v = -1; }
function addArmy(owner, at, units){
  const a = {id:S.nid++, owner, at, to:null, t:0, path:[], forced:false, m:80, u:{}, w:{}}; for (const t of UT){ a.u[t] = 0; a.w[t] = 0; }
  for (const t of UT) if (units[t]) a.u[t] = units[t];
  S.armies.push(a); return a;
}
const has = (n, id) => n >= 0 && !!(S.nations[n].tech && S.nations[n].tech[id]);
const KIND_NAME = {mlrs:'Rocket Artillery Brigade', spec:'Special Operations Group', inf:'Infantry Division', at:'Anti-Tank Brigade', art:'Artillery Brigade', sam:'Air Defence Brigade', ifv:'Mechanized Division', tank:'Armored Division', para:'Airborne Brigade', heli:'Gunship Squadron', drone:'UAV Squadron', swarm:'Drone Swarm Group', sdrone:'Strike Drone Squadron', bomb:'Bomber Wing', stealth:'Stealth Bomber Wing', mpa:'Maritime Patrol Squadron', awacs:'Early Warning Squadron', asf:'Fighter Wing', jam:'Electronic Warfare Battalion', air:'Air Wing', sea:'Fleet', sub:'Submarine Flotilla', carr:'Carrier Group'};
function armyName(a){ if (!a) return ''; if (a.nm) return a.nm; if (a.owner === NEUTRAL) return a.rebel ? 'Partisans' : 'Garrison';
  let k = a.air ? (['heli', 'drone', 'swarm', 'sdrone', 'bomb', 'stealth', 'mpa', 'awacs', 'asf'].find(t => a.u[t]) || 'air') : shipsOnly(a) ? (a.u.carr ? 'carr' : a.u.sub === count(a) ? 'sub' : 'sea') : null;
  if (!k){ let best = 'inf', bv = -1; for (const t of ['inf', 'at', 'art', 'sam', 'ifv', 'tank', 'para', 'mlrs', 'spec', 'jam']){ const v = a.u[t]*UNITS[t].cost; if (v > bv){ bv = v; best = t; } } k = best; }
  const c = (S.ncnt || (S.ncnt = {})), key = a.owner + ':' + k; c[key] = (c[key] || 0) + 1;
  a.nm = `${ord(c[key])} ${KIND_NAME[k]}`; return a.nm; }
// a force as nation `me` names it: its own by name alone, another's with the nation in front
const armyLabel = (a, me) => a.owner === me ? armyName(a) : `${nationName(a.owner)} ${armyName(a)}`;
const STC = [];
function st(o, t, k){
  if (o < 0) return UNITS[t][k];
  const N = S.nations[o], T = N.tech || {}, sh = N.short || {}, key = (N.tv || 0)*8 + (sh.oil ? 1 : 0) + (sh.iron ? 2 : 0) + (sh.elec ? 4 : 0);
  let c = STC[o];
  if (!c || c.key !== key || c.S !== S){ c = STC[o] = {key, S, v:{}};
    for (const u of UT){ const r = {}; for (const kk of ['atk', 'def', 'spd', 'hp']){ let v = UNITS[u][kk];
        for (const id in T){ const fx = TECH_BY[id] && TECH_BY[id].fx[u]; if (fx && fx[kk]) v += fx[kk]; }
        if (sh.oil && UNITS[u].fuel){ if (kk === 'atk') v *= 0.7; if (kk === 'spd') v *= 0.6; }
        if (sh.iron && MAINT[u].iron >= 0.05){ if (kk === 'atk') v *= 0.8; if (kk === 'def') v *= 0.85; }   // no spare parts: armor, guns and warships fight worse
        if (sh.elec && MAINT[u].elec >= 0.05){ if (kk === 'atk') v *= 0.8; if (kk === 'def') v *= 0.9; }   // no avionics or radar spares: aircraft, drones, air defence and warships
        if (kk === 'atk' || kk === 'def'){ v *= MARK_F[(N.mk && N.mk[u]) || 1]; const d = DOCTRINES[N.doc]; if (d) v *= d[kk] || 1; }
        r[kk] = v; } c.v[u] = r; } }
  return c.v[t][k];
}
const unlocked = (n, t) => !UNITS[t].tech || has(n, UNITS[t].tech);
// buildings knocked out by a precision strike (strike drone, armed UAV) work again after a while: S.bdis[p] = {<building>: hour it is back, ...},
// one entry per building type, so knocking out a second building keeps the first one down (old saves held a single {k, h}: converted on read)
const bdisOf = p => { const d = S.bdis && S.bdis[p]; if (d && typeof d.k === 'string'){ const o = {}; if (d.h > 0) o[d.k] = d.h; return S.bdis[p] = o; } return d; };
const bdis = (p, k) => { const d = bdisOf(p); return !!d && (d[k] || 0) > S.hour; };
const bdisH = (p, k) => { const d = bdisOf(p); if (!d) return 0; let h = 0; for (const b in d) if ((k == null || b === k) && d[b] - S.hour > h) h = d[b] - S.hour; return h; };
function knockOut(p, k, h){ const d = bdisOf(p) || ((S.bdis || (S.bdis = {}))[p] = {}); for (const b in d) if (d[b] <= S.hour) delete d[b]; d[k] = Math.max(S.hour + h, d[k] || 0); }
const count = a => { const u = a.u; let s = 0; for (let i = 0; i < UT.length; i++){ const v = u[UT[i]]; if (v) s += v; } return s; };
const GROUND_T = Object.keys(UNITS).filter(t => UNITS[t].cls === 'soft' || UNITS[t].cls === 'armored'), NAVAL_T = Object.keys(UNITS).filter(t => UNITS[t].cls === 'naval');
const groundN = a => { const u = a.u; let s = 0; for (let i = 0; i < GROUND_T.length; i++){ const v = u[GROUND_T[i]]; if (v) s += v; } return s; };
const shipsN = a => { const u = a.u; let s = 0; for (let i = 0; i < NAVAL_T.length; i++){ const v = u[NAVAL_T[i]]; if (v) s += v; } return s; };
const shipsOnly = a => shipsN(a) > 0 && shipsN(a) === count(a);
const portOk = (n, v) => G.P[v].sea || (G.P[v].coast && (S.owner[v] === n || friendly(n, S.owner[v])));
const ground = a => groundN(a) > 0;
const armyHP = a => { const u = a.u; let s = 0; for (let i = 0; i < UT.length; i++){ const t = UT[i], v = u[t]; if (v) s += v*UNITS[t].hp; } return s; };
const healthFrac = a => { const hp = armyHP(a); return hp ? 1 - UT.reduce((s, t) => s + a.w[t], 0)/hp : 0; };
// remaining strength against the force's recent peak (units lost count, not just wounds)
const strengthFrac = a => { const cur = effHP(a), pk = Math.max(a.peak || 0, cur); return pk ? cur/pk : 0; };
const power = a => { const u = a.u; let s = 0; for (let i = 0; i < UT.length; i++){ const t = UT[i], v = u[t]; if (v) s += v*(st(a.owner, t, 'atk') + st(a.owner, t, 'def'))*UNITS[t].hp/10; } return s*(typeof moraleF === 'function' && S && S.armies ? moraleF(a) : 1); };
const landSpeed = a => Math.min(...UT.filter(t => a.u[t] > 0).map(t => st(a.owner, t, 'spd')), 99)*(has(a.owner, 'log1') ? 1.2 : 1)*(1 + 0.15*cmdF(a, 'blitz'));
const armyById = id => S.armies.find(a => a.id === id);
const nationName = o => o === NEUTRAL ? 'Independent' : o === SEA ? 'Open sea' : S.nations[o].name;
const placeOwner = p => G.P[p].sea ? 'Open sea' : S.owner[p] === NEUTRAL ? `${G.countries[G.P[p].country].name} · Independent` : S.nations[S.owner[p]].name;
const isCapital = p => S.nations.some(n => n.alive && n.capital === p && S.owner[p] === n.id);
const dayOf = h => Math.floor(h/24) + 1;
function checkNation(n, by = NEUTRAL){
  const N = S.nations[n]; if (!N.alive) return;
  const cities = G.P.filter(p => S.owner[p.id] === n && p.city);
  if (!cities.length){
    N.alive = false;
    const annex = by >= 0 && S.nations[by].alive;
    for (let p = 0; p < G.P.length; p++) if (S.owner[p] === n){ S.queue[p] = []; S.cons[p] = null;
      if (annex){ S.owner[p] = by; S.occ[p] = S.hour; } else { S.owner[p] = NEUTRAL; addArmy(NEUTRAL, p, {inf:2}); } }
    for (const a of S.armies) if (a.owner === n) for (const t of UT) a.u[t] = 0;
    removeEmpty(); geoChanged();
    tellAll(me => n === me ? `${N.name} has fallen.` : annex ? `${N.name} has collapsed. ${S.nations[by].name} annexes its remaining land.` : `${N.name} has collapsed. Its land is now independent.`, me => n === me ? 'bad' : by === me ? 'good' : 'info');
  } else if (S.owner[N.capital] !== n){
    const home = cities.filter(c => S.home[c.id] === n);
    const nc = (home.length ? home : cities)[0];
    N.capital = nc.id; N.capHit = S.hour; nc.city = true;
    for (const a of S.armies) if (a.owner === n) a.m = Math.max(0, (a.m ?? 80) - 15);
    tellAll(`${N.name} lost its capital and moved it to ${nc.cityName || nc.name}. Its income drops 40% for 14 days.`, me => n === me ? 'bad' : 'info', nc.id);
  }
}
function score(n){ let s0 = 0; for (let p = 0; p < G.P.length; p++) if (S.owner[p] === n){ s0 += G.P[p].city ? 4 : 1; } for (const N of S.nations) if (S.owner[N.cap0] === n) s0 += 10; return s0; }
const winShare = () => tiered() ? winShareFor(S.nations.length) : WIN_SHARE;
const coalCaps = () => tiered() ? Math.round(WIN_CAPS*1.5) : WIN_CAPS + 3;   // capitals a coalition needs together
const landNeed = n => SCN === 'world' || tiered() ? Math.max(Math.ceil(scnLand()*winShare()), (S.nations[n].prov0 || 0) + SCENARIOS[SCN].extra)
  : Math.max(Math.ceil(scnLand()*0.4), (S.nations[n].prov0In ?? S.nations[n].prov0 ?? 0) + SCENARIOS[SCN].extra);
const growth = n => score(n) - (S.nations[n].score0 || 0);
const capsHeld = n => S.nations.filter(N => S.owner[N.cap0] === n).length;
// the verdict for seat `me`, if the game is decided for it: S.over ('win' or 'lose') and S.overReason
function verdict(me){
  const mine = landHeld(me);
  if (!S.nations[me].alive) S.over = 'lose';
  else if (S.nations.every(n => n.id === me || !n.alive) || mine >= landNeed(me) || capsHeld(me) >= WIN_CAPS) S.over = 'win';
  else if ((B => B && (B.members.reduce((s0, m) => s0 + landHeld(m), 0) >= Math.ceil(landNeed(me)*1.8) || B.members.reduce((s0, m) => s0 + capsHeld(m), 0) >= coalCaps()))(blocOf(me))){ S.over = 'win'; S.overReason = 'coalition'; }
  else if (Number.isFinite(DAY_LIMIT) && S.hour >= DAY_LIMIT*24){ const top = S.nations.filter(n => n.alive).sort((a, b) => growth(b.id) - growth(a.id))[0]; S.over = top.id === me ? 'win' : 'lose'; S.overReason = 'time'; }
  else { const rival = S.nations.find(n => n.id !== me && n.alive && (landHeld(n.id) >= landNeed(n.id) || capsHeld(n.id) >= WIN_CAPS)); if (rival){ S.over = 'lose'; S.overReason = rival.name; }
    else { const RB = blocs().find(B => !B.members.includes(me) && (B.members.reduce((s0, m) => s0 + capsHeld(m), 0) >= coalCaps())); if (RB){ S.over = 'lose'; S.overReason = `the ${RB.name}`; } } }
}
// the game ends with the first seat's verdict (S.over is kept once per game: one seat today; a game with several seats needs one each).
// With no seat at all the game ends when a nation reaches the victory conditions: S.over 'end', S.overReason its name
function checkEnd(){
  if (S.over) return;
  const L = seats(); for (const me of L){ verdict(me); if (S.over) break; }
  if (!L.length){ const top = S.nations.find(n => n.alive && (landHeld(n.id) >= landNeed(n.id) || capsHeld(n.id) >= WIN_CAPS)); if (top){ S.over = 'end'; S.overReason = top.name; } }
  if (S.over) IM.emit('over');
}
