#!/usr/bin/env node
// Writes nations.js: the playable nations of the nations world (scenario world64, docs/NATIONS-PLAN.md), read by rules/state.js.
//   node tools/build-nations.js            write nations.js
//   node tools/build-nations.js --check    exit 1 unless nations.js on disk is what this tool would write (and its lists are sound)
//   node tools/build-nations.js --preview  print the cities the method picks for EVERY nation of the roster (nothing is written)
// The roster (ROSTER) and the city-choice method (pickCities, section 2 of the plan) live here; nations.js is never edited by hand. A step of
// the rollout opens a region by adding it to OPEN: its nations become playable with their planned 7 to 14 cities. Until its region is open,
// one of today's 15 powers plays with the cities world.js gives it today, and every other country is independent land.
// No browser: loads world.js, lines.js and the rules files like tools/headless.js (without nations.js: the rules run without it).
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
const OUT = path.join(ROOT, 'nations.js'), MODE = process.argv[2] || '';

/* ---------- the plan ---------- */
const REGIONS = ['Europe', 'Middle East', 'Africa', 'Asia', 'Americas', 'Oceania'];
const OPEN = ['Europe'];   // regions rolled out so far (step 0, plumbing: none; step 1: Europe, with Greece and Belarus on the split map)
// world.js country name, tier (S superpower, A major, B regional, C minor: table A of the plan, hand corrections included), region.
// split (*): the country is too small on world.js; its provinces are cut smaller on the nations world's map (owner's answer 1: Israel, Greece,
// Cuba and Belarus must be playable; 68 nations in all; tools/build-provsplit.js). It opens with its region like the others; the size of its
// smallest member does not set the scale of the city counts (TC below), so the other nations keep the cities of the plan.
const ROSTER = {
  'Europe': {'United Kingdom':'A', 'France':'A', 'Germany':'A', 'Italy':'B', 'Spain':'B', 'Poland':'B', 'Ukraine':'B', 'Romania':'C', 'Sweden':'C', 'Norway':'C', 'Finland':'C', 'Russia':'S', 'Greece':'C*', 'Belarus':'C*'},
  'Middle East': {'Turkey':'A', 'Iran':'A', 'Saudi Arabia':'B', 'Iraq':'B', 'Syria':'C', 'Yemen':'C', 'Egypt':'B', 'Israel':'C*'},
  'Africa': {'Algeria':'B', 'Morocco':'C', 'Libya':'C', 'Nigeria':'A', 'Ethiopia':'B', 'Sudan':'B', 'Dem. Rep. Congo':'B', 'Angola':'C', 'South Africa':'B', 'Kenya':'C', 'Tanzania':'B', 'Mali':'C', 'Chad':'C', 'Mozambique':'C', 'Cameroon':'C'},
  'Asia': {'China':'S', 'India':'S', 'Japan':'A', 'Pakistan':'A', 'Bangladesh':'C', 'Indonesia':'A', 'South Korea':'B', 'North Korea':'C', 'Vietnam':'B', 'Thailand':'B', 'Myanmar':'B', 'Philippines':'B', 'Malaysia':'C', 'Kazakhstan':'B', 'Uzbekistan':'C', 'Afghanistan':'B', 'Mongolia':'C'},
  'Americas': {'United States of America':'S', 'Canada':'A', 'Mexico':'A', 'Brazil':'A', 'Argentina':'B', 'Colombia':'B', 'Venezuela':'C', 'Peru':'B', 'Chile':'C', 'Bolivia':'C', 'Ecuador':'C', 'Cuba':'C*'},
  'Oceania': {'Australia':'B', 'New Zealand':'C'},
};
// capitals world.js does not flag (it flags only today's 15): the city (cityName) or the province that holds the real capital
const CAPS = {Mexico:'Mexico City', Kazakhstan:'Astana', Nigeria:'Abuja', Pakistan:'Islamabad', Vietnam:'Hanoi', Spain:'Madrid', Italy:'Rome', Indonesia:'Jakarta', 'Saudi Arabia':'Riyadh',
  Philippines:'Manila', Argentina:'Buenos Aires', 'New Zealand':'Wellington', Mozambique:'Maputo', Cameroon:'Yaoundé'};
const DISPLAY = {'United States of America':'United States', 'Dem. Rep. Congo':'DR Congo'};
// today's 15 powers, in the order of the classic world (rules/state.js WORLD_POWERS): they come first in nations.js, in this order
const TODAY15 = ['United States of America', 'Canada', 'Brazil', 'United Kingdom', 'France', 'Germany', 'Russia', 'Turkey', 'Iran', 'Egypt', 'South Africa', 'India', 'China', 'Japan', 'Australia'];
// map colours. A step that opens a region adds the colours of its nations here; no two nations that share a border or face each other across
// a strait may be closer than COLOR_MIN (checked below for the nations written)
const COLORS = {'United States of America':'#3f7fe0', 'Canada':'#c8323c', 'Brazil':'#3fae5a', 'United Kingdom':'#9370e6', 'France':'#36bcc4', 'Germany':'#5672a6', 'Russia':'#a3283f', 'Turkey':'#b45aa8',
  'Iran':'#7cc04a', 'Egypt':'#c2a070', 'South Africa':'#2ea48d', 'India':'#ff8a3d', 'China':'#e8cf47', 'Japan':'#b65acc', 'Australia':'#1fa3a3',
  // step 1, Europe
  'Italy':'#5cb04a', 'Spain':'#e0a13a', 'Poland':'#d8c440', 'Ukraine':'#3a9be0', 'Romania':'#c96a2e', 'Sweden':'#4a86e0', 'Norway':'#e06a5a', 'Finland':'#6fcf97',
  'Greece':'#6aa8e8', 'Belarus':'#c05a8a'};
const COLOR_MIN = 60;
// hand swaps (plan 2.5): at most one city per nation, each with its reason: {country: {out:'city or province name', in:'province name', why:'...'}}
const SWAPS = {};
// names of promoted cities (the largest town inside the province): {country: {'province name': 'city name'}}. Filled in by the step that opens the region
const NAMES = {
  // step 1, Europe: the largest town inside each promoted province (Natural Earth populated places, on the nations world's map), in its usual
  // English spelling; a province already named after its town keeps that name. Moselle's largest town on the grid is Saarbrücken (Germany): its
  // own prefecture, Metz, is used. Belarus: the piece called Kobryn holds Brest itself; the Brest piece's largest town is Baranovichi.
  'United Kingdom':{'Leicestershire':'Nottingham', 'Suffolk':'Ipswich', 'Buckinghamshire':'Oxford', 'Cumbria':'Carlisle', 'North Yorkshire':'Leeds', 'East Sussex':'Brighton'},
  'France':{'Moselle':'Metz', 'Seine-Maritime':'Rouen', 'Nord':'Lille', 'Guyane française':'Cayenne', 'Cher':'Bourges', 'Haute-Garonne':'Toulouse'},
  'Germany':{'Sachsen':'Dresden', 'Hessen':'Frankfurt'},
  'Italy':{'Firenze':'Florence', 'Macerata':'Ancona'},
  'Spain':{'Sevilla':'Seville', 'Bizkaia':'Bilbao', 'Pontevedra':'Vigo'},
  'Poland':{'Silesian':'Katowice', 'West Pomeranian':'Szczecin', 'Lower Silesian':'Wrocław', 'Subcarpathian':'Rzeszów', 'Pomeranian':'Gdańsk', 'Greater Poland':'Poznań', 'Lesser Poland':'Kraków', 'Warmian-Masurian':'Olsztyn'},
  'Ukraine':{"Donets'k":'Donetsk', "L'viv":'Lviv', "Luhans'k":'Luhansk', "Dnipropetrovs'k":'Dnipro', "Khmel'nyts'kyy":'Khmelnytskyi', 'Zaporizhzhya':'Zaporizhzhia'},
  'Romania':{'Bihor':'Oradea', 'Dolj':'Craiova', 'Iasi':'Iași', 'Braila':'Galați', 'Mures':'Târgu Mureș', 'Covasna':'Brașov', 'Olt':'Pitești', 'Bacau':'Bacău'},
  'Sweden':{'Västra Götaland':'Jönköping', 'Västmanland':'Västerås', 'Kronoberg':'Växjö', 'Östergötland':'Linköping', 'Västerbotten':'Umeå', 'Värmland':'Karlstad'},
  'Norway':{'Troms':'Tromsø', 'Vest-Agder':'Kristiansand', 'Buskerud':'Drammen', 'Sør-Trøndelag':'Trondheim', 'Hordaland':'Bergen', 'Hedmark':'Hamar'},
  'Finland':{'North Karelia':'Joensuu', 'Päijät-Häme':'Lahti', 'Central Ostrobothnia':'Kokkola', 'Satakunta':'Pori', 'Northern Ostrobothnia':'Oulu'},
  'Greece':{'Kentriki Makedonia':'Thessaloniki', 'Voreio Aigaio':'Chios', 'Kriti':'Heraklion', 'Anatoliki Makedonia kai Thraki':'Kavala', 'Ipeiros':'Ioannina', 'Thessalia':'Larissa'},
  'Belarus':{'Kobryn':'Brest', 'Brest':'Baranovichi'},
};

/* ---------- the map and the rules ---------- */
// the province split (tools/build-provsplit.js writes tools/provsplit.json; docs/NATIONS-PLAN.md 4.6): copied into nations.js as NATIONS.map. The
// cities are chosen on that map (the nations world's), where Israel, Greece, Cuba and Belarus have their new provinces
const SPLIT = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'provsplit.json'), 'utf8'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
globalThis.NATIONS = {v:1, regions:[], open:[], nations:[], map:SPLIT};   // (only the map: the rules see no playable nations here)
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const IM = new Function("'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn IM;')();
IM.api.newGame(12345, 0, []);   // the classic world (rules set up)
if (IM.api.mapNew !== SPLIT.v) throw new Error('the rules did not take the province split of tools/provsplit.json');
const G = IM.api.mapOf(IM.api.mapNew), WORLD = globalThis.WORLD;   // the nations world's map: people, deposits, coasts, neighbours, the split provinces
const flag = P => G.D[P.id][2];   // bit 1: a city of today, bit 2: a capital of today
const C = G.countries.map((c, k) => ({k, name:c.name, provs:c.provs.map(id => G.P[id]).filter(P => !P.sea)})).filter(c => c.provs.length);
for (const c of C){ c.n = c.provs.length; c.cities = c.provs.filter(P => flag(P) & 1); c.cap = c.provs.find(P => flag(P) & 2) || null; c.pop = c.provs.reduce((s, P) => s + P.pop0, 0); }
const byName = new Map(C.map(c => [c.name, c]));
const all = []; for (const r of REGIONS) for (const n in ROSTER[r]){ const c = byName.get(n); if (!c) throw new Error('not in world.js: ' + n); all.push({c, region:r, tier:ROSTER[r][n][0], split:ROSTER[r][n].endsWith('*')}); }

/* ---------- the city-choice method (section 2 of the plan) ---------- */
// how many: 7 for the smallest playable nation up to 14 for the giants (people and land count equally, on a log scale), never more than the provinces minus 2
const sizeOf = c => (Math.log10(Math.max(1, c.pop)) + Math.log10(c.n))/2;
const TC = {lo:Math.min(...all.filter(e => !e.split).map(e => sizeOf(e.c))), hi:sizeOf(byName.get('Russia'))};
const targetCities = c => Math.max(7, Math.min(14, c.n - 2, Math.round(7 + (sizeOf(c) - TC.lo)/(TC.hi - TC.lo)*7)));
// land steps inside the country from the cities chosen so far; a part across the sea counts as far away
function hops(c, from){ const ids = new Set(c.provs.map(P => P.id)), d = new Map(from.map(id => [id, 0])), q = from.slice();
  for (let i = 0; i < q.length; i++) for (const v of G.P[q[i]].nbs) if (ids.has(v) && !d.has(v)){ d.set(v, d.get(q[i]) + 1); q.push(v); } return d; }
const cityScore = P => Math.pow(Math.max(0.02, P.pop0), 0.6)*((flag(P) & 1) ? 1.5 : 1)*(P.coast ? 1.15 : 1)*(P.terrain === 'desert' || P.terrain === 'tundra' || P.terrain === 'snow' ? 0.8 : 1);
// the capital first; while cities of today are left only they compete (a city of today is never passed over for a new one); then, one at a
// time, the best province: people, spread (a province next to a chosen city scores less than half), coast, harsh ground, a missing resource.
// A nation with a rare-earth deposit and no city on one gives its last promoted slot to its richest deposit
function pickCities(c, k = targetCities(c)){
  const want = CAPS[c.name], named = want && (c.provs.find(P => P.cityName === want) || c.provs.find(P => P.name === want));
  if (want && !named) throw new Error('capital not found: ' + c.name + ' ' + want);
  const cap = named || c.cap || c.cities.slice().sort((a, b) => b.pop0 - a.pop0)[0] || c.provs.slice().sort((a, b) => b.pop0 - a.pop0)[0];
  const out = [cap], have = () => ({oil:out.some(P => P.oil), ore:out.some(P => P.ore || P.iron), rare:out.some(P => P.rare > 0)});
  while (out.length < Math.min(k, c.n)){
    const d = hops(c, out.map(P => P.id)), h = have(); let best = null, bs = -1;
    const left = c.cities.filter(P => !out.includes(P)), pool = left.length ? left : c.provs;
    for (const P of pool){ if (out.includes(P)) continue; const dist = d.has(P.id) ? d.get(P.id) : 9;
      const spread = dist <= 1 ? 0.45 : dist === 2 ? 0.85 : dist >= 9 ? 1.25 : 1 + Math.min(0.3, 0.05*dist);
      const res = (!h.oil && P.oil ? 1.6 : 1)*(!h.ore && (P.ore || P.iron) ? 1.3 : 1)*(!h.rare && P.rare > 0 ? 2.2 : 1);
      const sc = cityScore(P)*spread*res; if (sc > bs){ bs = sc; best = P; } }
    if (!best) break; out.push(best); }
  if (!out.some(P => P.rare > 0)){ const R = c.provs.filter(P => P.rare > 0 && !out.includes(P)).sort((a, b) => b.rare - a.rare || b.pop0 - a.pop0)[0];
    let i = out.length - 1; while (i > 0 && (flag(out[i]) & 1)) i--;
    if (R && i > 0) out[i] = R; }
  return out; }
// a nation whose region is not open yet: the cities world.js gives it today, capital first
const todayCities = c => { const cap = c.cap || c.cities[0]; return [cap, ...c.cities.filter(P => P !== cap)]; };
const cname = P => P.cityName || P.name;

function entry(e, open){ const c = e.c, list = open ? pickCities(c) : todayCities(c), swaps = [], names = {};
  const sw = SWAPS[c.name]; if (sw && open){ const i = list.findIndex(P => cname(P) === sw.out || P.name === sw.out), Q = c.provs.find(P => P.name === sw.in || P.cityName === sw.in);
    if (i <= 0 || !Q || list.includes(Q)) throw new Error('bad swap for ' + c.name); swaps.push({out:list[i].id, in:Q.id, why:sw.why}); list[i] = Q; }
  for (const P of list){ const nm = NAMES[c.name] && NAMES[c.name][P.name]; if (nm && !(flag(P) & 1)) names[P.id] = nm; }
  if (!COLORS[c.name]) throw new Error('no colour for ' + c.name + ': add it to COLORS');
  return {name:DISPLAY[c.name] || c.name, country:c.name, region:e.region, tier:e.tier, color:COLORS[c.name], capital:list[0].id, cities:list.map(P => P.id), names, swaps}; }

if (MODE === '--preview'){
  for (const e of all){
    const L = pickCities(e.c); console.log(`${e.region.padEnd(12)} ${(DISPLAY[e.c.name] || e.c.name).padEnd(16)} ${e.tier}  ${String(L.length).padStart(2)}  ${L.map(cname).join(', ')}`); }
  process.exit(0); }
if (MODE === '--preview-ids'){   // the same, as province numbers (tab-separated: region, nation, ids): for tools that name promoted cities
  for (const e of all) console.log(`${e.region}\t${DISPLAY[e.c.name] || e.c.name}\t${pickCities(e.c).map(P => P.id).join(',')}`);
  process.exit(0); }

const isOpen = e => OPEN.includes(e.region);
const live = [...TODAY15.map(n => all.find(e => e.c.name === n)), ...all.filter(e => !TODAY15.includes(e.c.name) && isOpen(e))];
const nations = live.map(e => entry(e, isOpen(e)));
// checks on what is written: capital first, no province twice, cities inside the country, colours apart where nations touch
const fails = [], seen = new Set();
for (const n of nations){ const c = byName.get(n.country), ids = new Set(c.provs.map(P => P.id));
  if (n.cities[0] !== n.capital) fails.push(n.name + ': the capital is not its first city');
  for (const id of n.cities){ if (!ids.has(id)) fails.push(`${n.name}: city ${id} is not its land`); if (seen.has(id)) fails.push(`${n.name}: city ${id} listed twice`); seen.add(id); }
  if (OPEN.includes(n.region) && (n.cities.length < 7 || n.cities.length > 14)) fails.push(`${n.name}: ${n.cities.length} cities (7 to 14 wanted)`);
  // every name given for an open nation names one of its promoted cities (a typo would leave a city under its province's name)
  if (OPEN.includes(n.region)) for (const pn in NAMES[n.country] || {}) if (!n.cities.some(id => G.P[id].name === pn && n.names[id])) fails.push(`${n.name}: no promoted city in province ${pn} to name`); }
// the four nations of the province split (owner's answer 1) must hold 7 cities on the split map whether their region is open or not: at least 9
// provinces (Israel: 8, its one-cell provinces are the finest the map grid allows; tools/build-provsplit.js) and 7 to 14 cities with the method
for (const e of all.filter(e => e.split)){ const L = pickCities(e.c), need = e.c.name === 'Israel' ? 8 : 9;
  if (e.c.n < need) fails.push(`${e.c.name}: ${e.c.n} provinces on the split map (${need} wanted)`);
  if (L.length < 7 || L.length > 14) fails.push(`${e.c.name}: ${L.length} cities on the split map (7 to 14 wanted)`); }
{ const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), dist = (a, b) => Math.hypot(...rgb(a).map((v, i) => v - rgb(b)[i])), ofC = new Map(nations.map(n => [byName.get(n.country).k, n]));
  const pairs = new Set(); for (const P of G.P){ const a = ofC.get(P.country); if (!a || P.sea) continue; for (const v of P.nbs){ const Q = G.P[v];
      const reach = Q.sea ? Q.nbs.filter(w => !G.P[w].sea) : [v];   // by land, or across one sea zone (a strait)
      for (const w of reach){ const b = ofC.get(G.P[w].country); if (b && b !== a && (!Q.sea || G.P[w].nbs.length)) pairs.add([a.name, b.name].sort().join('|')); } } }
  for (const k of pairs){ const [x, y] = k.split('|').map(nm => nations.find(n => n.name === nm)); if (dist(x.color, y.color) < COLOR_MIN) fails.push(`colours too close: ${x.name} ${x.color} and ${y.name} ${y.color}`); } }

const text = '// Generated by tools/build-nations.js (roster and city-choice method of docs/NATIONS-PLAN.md). Do not edit: change the tool and run it again.\n'
  + '// The playable nations of the nations world: tier, region, capital and cities (province numbers of world.js, capital first), names of promoted\n'
  + '// cities, hand swaps. Every other country on the map is independent land. Regions are opened one rollout step at a time (open).\n'
  + '// map: the province split of the nations world (tools/build-provsplit.js; new provinces appended after those of world.js, each with its parent).\n'
  + 'window.NATIONS = {"v":1,"regions":' + JSON.stringify(REGIONS) + ',"open":' + JSON.stringify(OPEN) + ',"nations":[\n' + nations.map(n => JSON.stringify(n)).join(',\n') + '\n],\n"map":' + JSON.stringify(SPLIT) + '};\n';
if (fails.length){ console.log('NATIONS FAILED\n  ' + fails.join('\n  ')); process.exit(1); }
if (MODE === '--check'){ const same = fs.existsSync(OUT) && fs.readFileSync(OUT, 'utf8') === text;
  console.log(same ? `nations.js is up to date: ${nations.length} nations, regions open: ${OPEN.join(', ') || 'none'}` : 'nations.js DIFFERS from what tools/build-nations.js writes: run the tool'); process.exit(same ? 0 : 1); }
fs.writeFileSync(OUT, text);
console.log(`nations.js: ${nations.length} nations (${REGIONS.map(r => r + ' ' + nations.filter(n => n.region === r).length).join(', ')}), ${nations.reduce((s, n) => s + n.cities.length, 0)} cities, regions open: ${OPEN.join(', ') || 'none'}; roster ${all.length} (${all.filter(e => e.split).length} on split provinces: ${SPLIT.provinces.length} new provinces in the map)`);
