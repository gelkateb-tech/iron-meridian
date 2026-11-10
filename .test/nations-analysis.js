// Iron Meridian: measured data for docs/NATIONS-PLAN.md (owner task 7). No browser: loads world.js, lines.js and the rules like tools/headless.js.
//   node .test/nations-analysis.js raw            every country in world.js: provinces, cities, people, deposits, coast, land neighbours
//   node .test/nations-analysis.js plan           the plan's tables (playable nations with their chosen cities, AI-only list, pairings) as Markdown
//   node .test/nations-analysis.js trial [days]   TODAY'S rules with the 64 nations and their planned cities, all AI: opening incomes, speed, who is alive
//   node .test/nations-analysis.js check          exit 1 unless the plan's own rules hold (7-14 cities, capital, resources, counts)
// The list of playable nations (PLAY) and the city-choice method (pickCities) below ARE the plan; task 8 moves them into the game data.
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const IM = new Function("'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nIM.__plan = {setPowers(L){ POWERS = L; scnLandCache = null; scnInCache = null; }, income, landNeed};\nreturn IM;')();   // __plan: the trial's way in (this script only)
IM.api.newGame(12345, 0, []);
const SAVE15 = IM.api.saveJSON().length;   // a new 15-power game's save, for comparison
const G = IM.api.G, S = IM.api.S, WORLD = globalThis.WORLD, Wd = WORLD.W;
const lonOf = P => ((((P.cc % Wd) + 0.5)/Wd*360 + WORLD.lon0) + 540) % 360 - 180;
const MODE = process.argv[2] || 'plan';

/* ---------- the plan: 64 playable nations in 6 regions (world.js country name, display name where it differs, tier) ---------- */
// tier: S superpower, A major power, B regional power, C minor power. Tiers are derived below from measured data and only overridden where noted.
const PLAY = {
  'Europe': ['United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Poland', 'Ukraine', 'Romania', 'Sweden', 'Norway', 'Finland', 'Russia'],
  'Middle East': ['Turkey', 'Iran', 'Saudi Arabia', 'Iraq', 'Syria', 'Yemen', 'Egypt'],
  'Africa': ['Algeria', 'Morocco', 'Libya', 'Nigeria', 'Ethiopia', 'Sudan', 'Dem. Rep. Congo', 'Angola', 'South Africa', 'Kenya', 'Tanzania', 'Mali', 'Chad', 'Mozambique', 'Cameroon'],
  'Asia': ['China', 'India', 'Japan', 'Pakistan', 'Bangladesh', 'Indonesia', 'South Korea', 'North Korea', 'Vietnam', 'Thailand', 'Myanmar', 'Philippines', 'Malaysia', 'Kazakhstan', 'Uzbekistan', 'Afghanistan', 'Mongolia'],
  'Americas': ['United States of America', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Colombia', 'Venezuela', 'Peru', 'Chile', 'Bolivia', 'Ecuador'],
  'Oceania': ['Australia', 'New Zealand'],
};
// capitals world.js does not flag (it flags only today's 15): the city (cityName) or, where the country has no city yet, the province that holds the real capital
const CAPS = {Mexico:'Mexico City', Kazakhstan:'Astana', Nigeria:'Abuja', Pakistan:'Islamabad', Vietnam:'Hanoi', Spain:'Madrid', Italy:'Rome', Indonesia:'Jakarta', 'Saudi Arabia':'Riyadh',
  Philippines:'Manila', Argentina:'Buenos Aires', 'New Zealand':'Wellington', Mozambique:'Maputo', Cameroon:'Yaoundé'};
const MIN_PROV = 9;   // a seat needs at least this many land provinces (7 cities and room to manoeuvre)
const DISPLAY = {'United States of America':'United States', 'Dem. Rep. Congo':'DR Congo'};
const TODAY15 = ['United States of America', 'Canada', 'Brazil', 'United Kingdom', 'France', 'Germany', 'Russia', 'Turkey', 'Iran', 'Egypt', 'South Africa', 'India', 'China', 'Japan', 'Australia'];
const REGION_OF = {}; for (const r in PLAY) for (const c of PLAY[r]) REGION_OF[c] = r;

/* ---------- measured per-country data ---------- */
const C = G.countries.map((c, k) => ({k, name:c.name, provs:c.provs.map(id => G.P[id]).filter(P => !P.sea)})).filter(c => c.provs.length);
// S.owner / P.city were touched by newGame (capitals of the 15 powers become cities): read the city flag from world.js itself
const flag = P => WORLD.provinces[P.id][2];
for (const c of C){
  c.n = c.provs.length; c.cities = c.provs.filter(P => flag(P) & 1); c.cap = c.provs.find(P => flag(P) & 2) || null;
  c.pop = c.provs.reduce((s, P) => s + P.pop0, 0); c.cells = c.provs.reduce((s, P) => s + P.cells.length, 0);
  c.oil = c.provs.filter(P => P.oil).length; c.ore = c.provs.filter(P => P.ore).length; c.iron = c.provs.filter(P => P.iron).length; c.rare = c.provs.filter(P => P.rare > 0).length;
  c.rareOut = c.provs.reduce((s, P) => s + (P.rare || 0), 0); c.coast = c.provs.filter(P => P.coast).length;
  const nb = new Map(); for (const P of c.provs) for (const v of P.nbs){ const Q = G.P[v]; if (!Q.sea && Q.country !== c.k) nb.set(Q.country, (nb.get(Q.country) || 0) + 1); }
  c.nb = [...nb.keys()].map(k => G.countries[k].name);
  // land components (islands, exclaves)
  const ids = new Set(c.provs.map(P => P.id)), seen = new Set(); c.parts = [];
  for (const P of c.provs){ if (seen.has(P.id)) continue; const q = [P.id]; seen.add(P.id); for (let i = 0; i < q.length; i++) for (const v of G.P[q[i]].nbs) if (ids.has(v) && !seen.has(v)){ seen.add(v); q.push(v); } c.parts.push(q.length); }
  { const main = new Set(), q0 = (c.cap || c.provs.slice().sort((a, b) => b.pop0 - a.pop0)[0]).id, q = [q0]; main.add(q0);   // the landmass of the capital (or biggest province)
    for (let i = 0; i < q.length; i++) for (const v of G.P[q[i]].nbs) if (ids.has(v) && !main.has(v)){ main.add(v); q.push(v); }
    const nm = new Set(); for (const id of main) for (const v of G.P[id].nbs){ const Q = G.P[v]; if (!Q.sea && Q.country !== c.k) nm.add(Q.country); }
    c.nbHome = [...nm].map(k => G.countries[k].name); c.overseas = c.n - main.size; }
  c.parts.sort((a, b) => b - a);
  c.lat = c.provs.reduce((s, P) => s + P.lat, 0)/c.n; c.lon = lonOf(c.cap || c.provs[0]);
}
const byName = new Map(C.map(c => [c.name, c]));
const f1 = x => x.toFixed(1), pad = (s, n) => String(s).padEnd(n), padL = (s, n) => String(s).padStart(n);

/* ---------- the city-choice method (section 2 of the plan) ---------- */
// target city count from people and land: 7 for the smallest playable nation up to 14 for the giants, never more than the nation's provinces minus 2
const sizeOf = c => (Math.log10(Math.max(1, c.pop)) + Math.log10(c.n))/2;   // people and land count equally, on a log scale
function targetCities(c){ const s = sizeOf(c);
  return Math.max(7, Math.min(14, c.n - 2, Math.round(7 + (s - TC.lo)/(TC.hi - TC.lo)*7))); }
const TC = {lo:0, hi:1};
// hop distance inside the country (land steps); sea-separated parts count as far away
function hops(c, from){ const ids = new Set(c.provs.map(P => P.id)), d = new Map(from.map(id => [id, 0])), q = from.slice();
  for (let i = 0; i < q.length; i++) for (const v of G.P[q[i]].nbs) if (ids.has(v) && !d.has(v)){ d.set(v, d.get(v) + 0 || d.get(q[i]) + 1); q.push(v); } return d; }
const cityScore = P => Math.pow(Math.max(0.02, P.pop0), 0.6)*((flag(P) & 1) ? 1.5 : 1)*(P.coast ? 1.15 : 1)*(P.terrain === 'desert' || P.terrain === 'tundra' || P.terrain === 'snow' ? 0.8 : 1);
// greedy: capital first, then repeatedly the best-scoring province, discounted when it sits next to a city already chosen (spread) and
// boosted the first time it brings a main resource the nation's cities lack (oil, ore/iron, rare earth) or a second landmass
function pickCities(c, k = targetCities(c)){
  const want = CAPS[c.name], named = want && (c.provs.find(P => P.cityName === want) || c.provs.find(P => P.name === want));
  if (want && !named) throw new Error('capital not found: ' + c.name + ' ' + want);
  const cap = named || c.cap || c.cities.slice().sort((a, b) => b.pop0 - a.pop0)[0] || c.provs.slice().sort((a, b) => b.pop0 - a.pop0)[0];
  const out = [cap], why = new Map([[cap.id, 'capital']]), have = () => ({oil:out.some(P => P.oil), ore:out.some(P => P.ore || P.iron), rare:out.some(P => P.rare > 0)});
  // keep-rule: while the nation still has cities of today that are not chosen, only those compete (a city of today is never passed over for a
  // promoted province); a nation with more cities than its target therefore only loses cities, one with fewer keeps them all and promotes the rest
  while (out.length < Math.min(k, c.n)){
    const d = hops(c, out.map(P => P.id)), h = have(); let best = null, bs = -1, bw = '';
    const left = c.cities.filter(P => !out.includes(P)), pool = left.length ? left : c.provs;
    for (const P of pool){ if (out.includes(P)) continue; const dist = d.has(P.id) ? d.get(P.id) : 9;
      const spread = dist <= 1 ? 0.45 : dist === 2 ? 0.85 : dist >= 9 ? 1.25 : 1 + Math.min(0.3, 0.05*dist);
      const res = (!h.oil && P.oil ? 1.6 : 1)*(!h.ore && (P.ore || P.iron) ? 1.3 : 1)*(!h.rare && P.rare > 0 ? 2.2 : 1);
      const sc = cityScore(P)*spread*res; if (sc > bs){ bs = sc; best = P;
        bw = (flag(P) & 1) ? 'city today' : res > 1 ? 'promoted: ' + [!h.oil && P.oil ? 'oil' : '', !h.ore && (P.ore || P.iron) ? 'ore' : '', !h.rare && P.rare > 0 ? 'rare earth' : ''].filter(Boolean).join('+') : dist >= 9 ? 'promoted: second landmass' : 'promoted: people'; } }
    if (!best) break; out.push(best); why.set(best.id, bw); }
  // rare-earth swap: a nation that has a deposit but no city on one gives its last promoted slot to its richest deposit province
  // (cities of today are never cut for this: the four giants keep their sets)
  if (!out.some(P => P.rare > 0)){ const R = c.provs.filter(P => P.rare > 0 && !out.includes(P)).sort((a, b) => b.rare - a.rare || b.pop0 - a.pop0)[0];
    let i = out.length - 1; while (i > 0 && (flag(out[i]) & 1)) i--;
    if (R && i > 0){ why.delete(out[i].id); out[i] = R; why.set(R.id, 'promoted: rare earth (swap)'); } }
  return {cap, list:out, why};
}
// the economy plan's "one main resource per city" (docs/ECONOMY.md, branch economy-v1, not yet written when this plan was made). ASSUMED rule:
// rare earth on the 2 richest deposits at most, oil / materials / iron on cities that sit on a deposit (about a fifth of the cities each at most),
// electronics in the capital and the most populous cities (a quarter), the rest money (coast) or manpower (inland). Then the minimum-access
// rule: every nation has at least 3 of the 4 industrial goods (oil, materials, iron, electronics); a missing one is granted to its smallest
// money/manpower city (marked +) until it has 3.
function assignRes(L, odd){ const N = L.length, res = new Map(), free = () => L.filter(P => !res.has(P)), q5 = Math.max(1, Math.round(N/5)), granted = new Set();
  free().filter(P => P.rare > 0 && P !== L[0]).sort((a, b) => b.rare - a.rare).slice(0, 2).forEach(P => res.set(P, 'rare'));
  free().filter(P => P.oil && P !== L[0]).sort((a, b) => a.pop0 - b.pop0).slice(0, q5).forEach(P => res.set(P, 'oil'));
  free().filter(P => P.ore && P !== L[0]).sort((a, b) => a.pop0 - b.pop0).slice(0, q5).forEach(P => res.set(P, 'metal'));
  free().filter(P => (P.iron || P.ore) && P !== L[0]).sort((a, b) => a.pop0 - b.pop0).slice(0, q5).forEach(P => res.set(P, 'iron'));
  res.set(L[0], 'elec'); free().sort((a, b) => b.pop0 - a.pop0).slice(0, Math.max(0, Math.round(N/4) - 1)).forEach(P => res.set(P, 'elec'));
  free().forEach(P => res.set(P, P.coast ? 'cash' : 'mp'));
  const hasK = k => [...res.values()].includes(k), ind = () => ['oil', 'metal', 'iron', 'elec'].filter(hasK).length;
  for (const k of (odd ? ['iron', 'oil', 'metal'] : ['metal', 'oil', 'iron'])){ if (ind() >= 3) break; if (hasK(k)) continue;
    const P = L.filter(P => res.get(P) === 'cash' || res.get(P) === 'mp').sort((a, b) => a.pop0 - b.pop0)[0]; if (!P) break; res.set(P, k); granted.add(P); }
  return {res, granted}; }
const cityName = P => P.cityName || P.name;

/* ---------- strength index and tiers ---------- */
// index = today's opening economy without the catch-up boost: sum of province cash yields at full morale (people^0.75), cities weighted as in provYield
function strength(c, cities){ const cs = new Set(cities.map(P => P.id)); let v = 0; for (const P of c.provs) v += (cs.has(P.id) ? 8.5 : 1.8*G.PF) + 0.68*Math.pow(Math.max(0, P.pop0), 0.75); return v; }

if (MODE === 'raw'){
  console.log(`${C.length} countries with land in world.js, ${G.landCount} land provinces, ${G.P.filter(P => !P.sea && (flag(P) & 1)).length} city provinces, ${G.P.filter(P => !P.sea && (flag(P) & 2)).length} capitals flagged`);
  console.log(pad('country', 28) + ['prov', 'city', 'cap', 'pop M', 'cells', 'oil', 'ore', 'iron', 'rare', 'coast', 'parts'].map(s => padL(s, 7)).join('') + '  land neighbours');
  for (const c of C.slice().sort((a, b) => b.n - a.n))
    console.log(pad(c.name, 28) + [c.n, c.cities.length, c.cap ? 'y' : '-', f1(c.pop), c.cells, c.oil, c.ore, c.iron, c.rare, c.coast, c.parts.length].map(s => padL(s, 7)).join('') + '  ' + c.nb.join(', '));
  process.exit(0);
}

/* ---------- plan tables ---------- */
const playable = Object.values(PLAY).flat().map(n => { const c = byName.get(n); if (!c) throw new Error('not in world.js: ' + n); return c; });
// the scale runs from the smallest playable nation (7 cities) to Russia (14): Russia is the smallest of the four giants, so all four get 14
{ const s = playable.map(sizeOf); TC.lo = Math.min(...s); TC.hi = sizeOf(byName.get('Russia')); }
for (const c of playable){ c.pick = pickCities(c); c.str = strength(c, c.pick.list); c.res = assignRes(c.pick.list, c.k % 2 === 1); }
const rank = playable.slice().sort((a, b) => b.str - a.str);
// tiers by rank of the strength index (4 / 12 / 24 / 24), then the plan's few hand corrections (design choices, not measurements): today's
// industrial powers keep their weight, very poor or very small populous countries drop one tier
const TIER_FIX = {'United Kingdom':'A', 'Germany':'A', 'South Korea':'B', 'Philippines':'B', 'Dem. Rep. Congo':'B', 'Bangladesh':'C'};
rank.forEach((c, i) => { c.rank = i + 1; c.tier0 = i < 4 ? 'S' : i < 16 ? 'A' : i < 40 ? 'B' : 'C'; c.tier = TIER_FIX[c.name] || c.tier0; });
const ai = C.filter(c => !REGION_OF[c.name]);
const name = c => DISPLAY[c.name] || c.name;
const resOfCities = c => { const m = {}; c.pick.list.forEach(P => { const r = c.res.res.get(P); m[r] = (m[r] || 0) + 1; }); return m; };
const RESN = {cash:'money', mp:'manpower', oil:'oil', metal:'materials', iron:'iron', elec:'electronics', rare:'rare earth'};

if (MODE === 'check'){
  const bad = [];
  if (playable.length !== 64) bad.push('playable count ' + playable.length);
  for (const c of playable){ const L = c.pick.list, m = resOfCities(c);
    if (L.length < 7 || L.length > 14) bad.push(`${c.name}: ${L.length} cities`);
    if (new Set(L.map(P => P.id)).size !== L.length) bad.push(`${c.name}: duplicate city`);
    if (c.n < MIN_PROV) bad.push(`${c.name}: only ${c.n} provinces`);
    if ((m.rare || 0) > 2) bad.push(`${c.name}: ${m.rare} rare-earth cities`);
    if (['oil', 'metal', 'iron', 'elec'].filter(k => m[k]).length < 3) bad.push(`${c.name}: fewer than 3 industrial goods`);
    if (c.cities.length <= L.length && c.cities.some(P => !L.includes(P))) bad.push(`${c.name}: a city of today was passed over`);
    if (L.length > c.n - 2) bad.push(`${c.name}: ${L.length} cities of ${c.n} provinces`); }
  for (const c of ai) if (c.n >= 30 && c.pop >= 20) bad.push(`AI-only but large: ${c.name} (${c.n} provinces, ${f1(c.pop)}M)`);
  console.log(bad.length ? 'FAILED\n' + bad.join('\n') : `OK: 64 playable nations, every one with 7-14 cities; ${ai.length} AI-only countries`);
  process.exit(bad.length ? 1 : 0);
}

if (MODE === 'trial'){
  // the plan's cities and capitals laid over the loaded world (in memory only), the 64 nations as the list of powers, then a new all-AI game
  const DAYS = +(process.argv[3] || 30);
  for (const c of playable){ const L = new Set(c.pick.list); for (const P of c.provs){ P.city = L.has(P); P.capFlag = P === c.pick.list[0]; } }
  IM.__plan.setPowers(playable.map(c => ({name:name(c), country:c.name, color:'#888888'})));
  IM.api.newGame(12345, 0, []); const S2 = IM.api.S; S2.started = true;
  const inc0 = S2.nations.map(N => IM.__plan.income(N.id).gross), units0 = S2.nations.map(() => 0);
  for (const a of S2.armies) if (a.owner >= 0) for (const k in a.u) units0[a.owner] += a.u[k] || 0;
  console.log(`### TABLE H. Trial: today's rules, 64 nations with the planned cities (seed 12345, all AI)`); console.log('');
  console.log('| Nation | Tier | Provinces | Cities | Raw money a day (before the catch-up) | Catch-up boost | Opening money a day | Manpower a day | Opening units | Land needed to win today |'); console.log('|---|---|---|---|---|---|---|---|---|---|');
  S2.nations.forEach((N, i) => { const c = playable[N.power]; console.log(`| ${N.name} | ${c.tier} | ${c.n} | ${c.pick.list.length} | ${Math.round(inc0[i].cash/N.boost)} | ${N.boost.toFixed(2)} | ${Math.round(inc0[i].cash)} | ${Math.round(inc0[i].mp)} | ${units0[i]} | ${IM.__plan.landNeed(N.id)} |`); });
  const save0 = IM.api.saveJSON().length;
  const t0 = Date.now(); let h = 0; const snap = {};
  while (h < DAYS*24 && !S2.over){ IM.api.tick(); h++; if (h % 240 === 0 || h === DAYS*24){ const pr = S2.nations.map(() => 0); for (const o of S2.owner) if (o >= 0) pr[o]++; snap[h/24] = pr; } }
  const ms = Date.now() - t0, pr = S2.nations.map(() => 0); for (const o of S2.owner) if (o >= 0) pr[o]++;
  const dead = S2.nations.filter(N => !N.alive).map(N => N.name), wars = Object.values(S2.rel).filter(r => r && r.st === 'war').length;
  console.log(''); console.log(`Speed: ${Math.round(ms/Math.max(1, h/24))} ms per game day with 64 AI nations (${(ms/1000).toFixed(0)} s for ${(h/24).toFixed(0)} days).`);
  console.log(`Save text: ${Math.round(SAVE15/1024)} KB for a new 15-power game, ${Math.round(save0/1024)} KB for a new 64-nation game, ${Math.round(IM.api.saveJSON().length/1024)} KB after ${(h/24).toFixed(0)} days (${Object.keys(S2.rel).length} relation records).`);
  console.log(`After ${(h/24).toFixed(0)} days${S2.over ? ' (game over: ' + S2.over + ' ' + (S2.overReason || '') + ')' : ''}: ${S2.nations.length - dead.length} of 64 alive, ${wars} wars, eliminated: ${dead.join(', ') || 'none'}.`);
  const g = S2.nations.map((N, i) => ({n:N.name, t:playable[N.power].tier, d:pr[i] - N.prov0, p:pr[i], p0:N.prov0}));
  console.log(`Biggest gains: ${g.slice().sort((a, b) => b.d - a.d).slice(0, 8).map(x => `${x.n} ${x.p0} to ${x.p}`).join(', ')}.`);
  console.log(`Biggest losses: ${g.slice().sort((a, b) => a.d - b.d).slice(0, 8).map(x => `${x.n} ${x.p0} to ${x.p}`).join(', ')}.`);
  for (const t of ['S', 'A', 'B', 'C']){ const L = g.filter(x => x.t === t); console.log(`Tier ${t}: provinces ${L.reduce((s, x) => s + x.p0, 0)} to ${L.reduce((s, x) => s + x.p, 0)} (${L.filter(x => x.d < 0).length} of ${L.length} nations smaller than at the start).`); }
  console.log(`Independent (AI-only) land: ${G.landCount - g.reduce((s, x) => s + x.p0, 0)} provinces at the start, ${G.landCount - g.reduce((s, x) => s + x.p, 0)} after ${(h/24).toFixed(0)} days.`);
  process.exit(0);
}

const out = [];
out.push(`<!-- generated by: node .test/nations-analysis.js plan -->`);
out.push(`World in world.js: ${C.length} countries with land, ${G.landCount} land provinces, ${G.P.filter(P => !P.sea && (flag(P) & 1)).length} provinces flagged as cities, ${G.P.filter(P => !P.sea && (flag(P) & 2)).length} flagged capitals.`);
out.push(`Playable: ${playable.length} nations holding ${playable.reduce((s, c) => s + c.n, 0)} land provinces (${Math.round(playable.reduce((s, c) => s + c.n, 0)/G.landCount*100)}%) and ${f1(playable.reduce((s, c) => s + c.pop, 0))}M of ${f1(C.reduce((s, c) => s + c.pop, 0))}M people. AI-only: ${ai.length} countries, ${ai.reduce((s, c) => s + c.n, 0)} provinces.`);
out.push('');
out.push('### TABLE A. Playable nations: measured data');
out.push('');
out.push('| Region | Nation | Tier | Rank | Provinces | People (M) | Cities today | Cities planned | Oil / ore / iron / rare provinces | Coastal provinces | Landmasses | Strength index | Playable today |');
out.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const r in PLAY) for (const n of PLAY[r]){ const c = byName.get(n);
  out.push(`| ${r} | ${name(c)} | ${c.tier}${c.tier !== c.tier0 ? ' (' + c.tier0 + ')' : ''} | ${c.rank} | ${c.n} | ${f1(c.pop)} | ${c.cities.length} | ${c.pick.list.length} | ${c.oil} / ${c.ore} / ${c.iron} / ${c.rare} | ${c.coast} | ${c.parts.length} | ${Math.round(c.str)} | ${TODAY15.includes(n) ? 'yes' : ''} |`); }
out.push('');
out.push('### TABLE B. Starting cities of every playable nation');
out.push('');
out.push('The first city is the capital. *Italic* = a province promoted to a city by the method in section 2 (not a city in world.js today). A promoted city is listed under its province name; task 8 names it after the largest town inside it. The letter after a city is its assumed main resource: $ money, M manpower, O oil, T materials, I iron, E electronics, R rare earth; + marks a resource granted by the minimum-access rule (no deposit there).');
out.push('');
const RL = {cash:'$', mp:'M', oil:'O', metal:'T', iron:'I', elec:'E', rare:'R'};
for (const r in PLAY){ out.push(`**${r}**`); out.push(''); out.push('| Nation | Capital | Cities | Starting cities (main resource) | Dropped cities (stay ordinary provinces) | Main resources of its cities |'); out.push('|---|---|---|---|---|---|');
  for (const n of PLAY[r]){ const c = byName.get(n), L = c.pick.list, m = resOfCities(c), dropped = c.cities.filter(P => !L.includes(P));
    out.push(`| ${name(c)} | ${cityName(L[0])} | ${L.length} | ${L.map((P, i) => ((flag(P) & 1) || i === 0 ? cityName(P) : '*' + cityName(P) + '*') + ' ' + RL[c.res.res.get(P)] + (c.res.granted.has(P) ? '+' : '')).join(', ')} | ${dropped.length ? dropped.map(cityName).join(', ') : 'none'} | ${Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${RESN[k]} ${v}`).join(', ')} |`); }
  out.push(''); }
out.push('### TABLE C. Promotions and cuts');
out.push('');
out.push('| Nation | Cities today | Planned | Promoted (reason) | Cut |');
out.push('|---|---|---|---|---|');
for (const c of playable){ const L = c.pick.list, pro = L.filter((P, i) => i > 0 && !(flag(P) & 1)), cut = c.cities.filter(P => !L.includes(P));
  if (!pro.length && !cut.length) continue;
  out.push(`| ${name(c)} | ${c.cities.length} | ${L.length} | ${pro.map(P => `${cityName(P)} (${c.pick.why.get(P.id).replace('promoted: ', '')}, ${f1(P.pop0)}M)`).join('; ') || 'none'} | ${cut.map(P => `${cityName(P)} (${f1(P.pop0)}M)`).join('; ') || 'none'} |`); }
out.push('');
out.push('### TABLE D. Neighbour pairings (land borders of the home landmass; overseas parts such as French Guiana are left out)');
out.push('');
out.push('| Nation | Tier | Playable land neighbours (tier) | Strongest neighbour / own strength | AI-only land neighbours |');
out.push('|---|---|---|---|---|');
for (const c of playable){ const pn = c.nbHome.map(n => byName.get(n)).filter(x => x && REGION_OF[x.name]), an = c.nbHome.filter(n => !REGION_OF[n]);
  const top = pn.slice().sort((a, b) => b.str - a.str)[0]; c.ratio = top ? top.str/c.str : 0;
  out.push(`| ${name(c)} | ${c.tier} | ${pn.map(x => `${name(x)} (${x.tier})`).join(', ') || 'none (sea only)'} | ${top ? (c.ratio).toFixed(1) + 'x ' + name(top) : '-'} | ${an.join(', ') || 'none'} |`); }
out.push('');
out.push('### TABLE E. AI-only countries and territories');
out.push('');
out.push('| Country | Provinces | People (M) | Cities today | Class | Why not playable |');
out.push('|---|---|---|---|---|---|');
const cls = c => c.n <= 3 ? 'microstate / island' : c.n < MIN_PROV ? 'small state' : 'reserve (large enough, not chosen)';
const whyNot = c => c.n <= 3 ? 'too small for 7 cities' : c.n < MIN_PROV ? `only ${c.n} provinces (a seat needs ${MIN_PROV})` : c.pop < 8 ? `only ${f1(c.pop)}M people` : c.parts.length === c.n ? 'scattered islands' : 'next in line if a seat is added';
for (const c of ai.slice().sort((a, b) => b.n - a.n)) out.push(`| ${c.name} | ${c.n} | ${f1(c.pop)} | ${c.cities.length} | ${cls(c)} | ${whyNot(c)} |`);
out.push('');
out.push('### TABLE F. Tier summary');
out.push('');
out.push('| Tier | Nations | Provinces (min-median-max) | People M (min-median-max) | Cities planned (min-max) | Strength index (min-median-max) |');
out.push('|---|---|---|---|---|---|');
const med = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length/2)]; };
for (const t of ['S', 'A', 'B', 'C']){ const L = playable.filter(c => c.tier === t), q = (f, d = 0) => { const a = L.map(f); return `${Math.min(...a).toFixed(d)}-${med(a).toFixed(d)}-${Math.max(...a).toFixed(d)}`; };
  out.push(`| ${t} | ${L.length}: ${L.sort((a, b) => a.rank - b.rank).map(name).join(', ')} | ${q(c => c.n)} | ${q(c => c.pop)} | ${Math.min(...L.map(c => c.pick.list.length))}-${Math.max(...L.map(c => c.pick.list.length))} | ${q(c => c.str)} |`); }
out.push('');
// victory numbers
const land = G.landCount, need25 = Math.ceil(land*0.25);
out.push('### TABLE G. Victory numbers measured');
out.push('');
out.push(`Land provinces ${land}; a quarter of them is ${need25}. Largest playable nation at the start: ${rank.slice().sort((a, b) => b.n - a.n).slice(0, 5).map(c => `${name(c)} ${c.n}`).join(', ')}. Planned starting cities in total: ${playable.reduce((s, c) => s + c.pick.list.length, 0)}; city provinces in AI-only countries: ${ai.reduce((s, c) => s + c.cities.length, 0)}.`);
{ const sm = playable.filter(c => c.n <= 40), rr = playable.filter(c => (resOfCities(c).rare || 0) > 0), cnt = k => playable.filter(c => resOfCities(c)[k]).length;
  out.push('');
  out.push(`Nations with rare-earth deposits anywhere in their land: ${playable.filter(c => c.rare > 0).length} of 64. Borders where the stronger playable neighbour is more than 3 times the weaker: ${playable.filter(c => c.ratio > 3).map(c => name(c)).join(', ')}.`);
  out.push(`Nations at or under 40 provinces (today's "small nation" rule: denser dug-in home army, three weeks of grace): ${sm.length} of 64. Nations with a rare-earth city: ${rr.length} of 64 (${playable.reduce((s, c) => s + (resOfCities(c).rare || 0), 0)} rare-earth cities in all); with an oil city ${cnt('oil')}, a materials city ${cnt('metal')}, an iron city ${cnt('iron')}; cities granted a resource by the minimum-access rule: ${playable.reduce((s, c) => s + c.res.granted.size, 0)}.`);
  out.push(`Today's opening catch-up (income boost = 200 / raw money income, between 1 and 2.5) applied to the strength index: ${playable.filter(c => c.str < 80).length} nations would sit at the 2.5 cap (index under 80), ${playable.filter(c => c.str >= 200).length} would get no boost (index 200 or more).`); }
console.log(out.join('\n'));
