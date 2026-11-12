# Economy v1: one main resource per city

> **Resource scale (x1000, owner request).** Every quantity of oil, materials, iron, electronics and rare materials in the game is now 1,000
> times the number written in this document: starting stocks, yields, storage (400,000 + 15,000 per province), upkeep, fuel and maintenance,
> every unit, building, link, missile, satellite and research price, Market lots, trade cargo, AI thresholds. Money and manpower are unchanged
> (manpower was already counted in thousands of people: 80k). Market prices keep their numbers but are now per 1,000 units ($3.20M per 1,000
> barrels). One constant does it, `RES_K` in `rules/data.js`; the game plays exactly as before (`node tools/x1000-check.js`). The numbers
> below are in the old units: multiply goods by 1,000.

Design for owner task 6 and the buildings rework. Everything here is rules (rules/*.js); the UI only reads it.
All numbers were measured with a text-patch prototype of the rules run headless (all-AI world game, 30 days, six seeds:
12345, 7, 2024, 99, 31337, 555). "Today" means branch base 140d490.

Contents: 1 summary, 2 today's economy, 3 city main resources, 4 yields, 5 buildings, 6 the Economy research branch,
7 upkeep and prices, 8 AI, 9 old saves, 10 balance before/after, 11 pictures, 12 implementation checklist, 13 open points.

---

## 1. Summary

- Every city produces ONE main resource: money, oil, materials, iron, electronics or rare materials. It is fixed by the map
  (deterministic, not stored in saves), so old saves get it too.
- The countryside keeps a thin trickle (oil fields, ore, iron hills); most of a nation's oil, materials, iron, electronics and
  rare materials now come from its cities. No nation has a city of every kind: 9 of the 15 world powers have a rare-earth
  city, 6 have none.
- Buildings: Arms Factory becomes **Army Base** (same save key `fac`, same levels, ground units only, no income).
  New **Arms Industry** (`arms`, levels I-V): +25% of the city's main resource per level. Refinery, Foundry and Rare Earth
  Mine are removed and refunded.
- The Economy research branch (eco1, eco2, eco3) is removed. Its boosts are now the Arms Industry (money and oil cities) and
  a higher city manpower base. Saves that researched them keep the full old bonus.
- World income per resource stays within +-13% of today's at day 1, 10, 20 and 30 (six-seed mean, table in section 10).
  Unit prices, upkeep and market base prices are unchanged; research costs about 15% fewer rare materials.

---

## 2. Today's economy (measured)

### 2.1 Where income comes from today (rules/economy.js provYield, income0)

Per province and day, before factors: money city 8.5 or countryside 1.8 x PF, plus 0.68 x pop^0.75, x (1 + 0.2 x Arms Factory level);
oil field 4.2 x (1 + 0.6 x Refinery); materials ore 1.4 + city 0.9 + Foundry 1.4 (1.8 on ore);
iron ore 0.8 + iron hills 0.8 + city 0.8 + Foundry 1.2 (2.4 on ore); electronics city (0.2 + 0.047 x pop^0.75) x (1 + 0.25 x factory);
rare = the deposit + Mine; manpower city 1.2 or 0.25 x PF, plus 0.16 x pop^0.8, plus 3 per Recruiting Office.
The capital adds oil 3, materials 3, iron 3.5, electronics 1.5, rare 1. Then: home-province boost for small powers (1 to 2.5,
set so day-0 money is about 200), administration 80/(40 + provinces) clamped 0.6-1.6, techs eco1 money x1.2, eco2 manpower x1.4,
eco3 oil x1.5, mobilisation, AI difficulty, war weariness, trade routes.

### 2.2 World totals today (seed 12345; all 15 nations, per day)

| | money | oil | materials | iron | electronics | rare | manpower |
|---|---|---|---|---|---|---|---|
| day 0 gross | 4116 | 485 | 323 | 295 | 86 | 92 | 901 |
| of which countryside | 2026 | 290 | 132 | 127 | 8 | 73 | 444 |
| of which cities | 1339 | 42 | 116 | 98 | 49 | 5 | 238 |
| of which buildings | 40 | 0 | 0 | 0 | 2 | 0 | 135 |
| of which trade routes | 569 | 58 | 9 | 2 | 0 | 3 | 0 |
| day 10 gross | 4095 | 460 | 299 | 285 | 84 | 147 | 1004 |
| day 30 gross | 3649 | 395 | 283 | 275 | 75 | 137 | 1028 |
| day 30 upkeep | 1891 | 206 | - | 103 | 12 | - | - |
| day 30 stocks | 1802 | 8595 | 2391 | 2238 | 2001 | 641 | 13131 |

(The table rows "countryside / cities / buildings" are raw, before the boost and administration factors; the capital bonus
makes up the rest.) Today the countryside carries the economy: 60% of oil, 41% of materials, 43% of iron and 80% of rare
materials come from provinces without a city, so every nation has a bit of everything and nobody is forced to trade.

### 2.3 Sinks today (seed 12345, money spent by day 30)

Units 53,554; research 8,766; Arms Factories 4,211; Rare Earth Mines 2,541; Recruiting Offices 2,190; Naval Yards 1,740;
Airbases 1,717; Refineries 440; Fortifications 404; Foundries 50. World-market buying 3,362 in total (materials 2,113,
rare 537, iron 439, electronics 273), selling 50: almost no trade.
Upkeep at day 30: money 1,891 a day (52% of gross), oil 206 (52%), iron 103 (37%), electronics 12 (16%).
Buildings at day 30 (six-seed mean, levels): factories 77, Recruiting Offices 119, Mines 41, Refineries 5, Foundries 3.
Economy techs researched by day 30 (mean of 15 nations): eco1 8.5 nations, eco2 3.7, eco3 1.3.

### 2.4 Market prices today (six-seed mean; base oil 3.2, materials 2.4, iron 2.2, electronics 4.2, rare 6.5)

| day | oil | materials | iron | electronics | rare |
|---|---|---|---|---|---|
| 1 | 3.01 | 2.47 | 2.19 | 4.05 | 8.60 |
| 10 | 2.36 | 3.37 | 2.85 | 3.28 | 9.56 |
| 30 | 3.06 | 2.33 | 2.57 | 3.95 | 7.71 |

---

## 3. Each city's main resource

### 3.1 The rule

`P.main` is one of `'cash' | 'oil' | 'metal' | 'iron' | 'elec' | 'rare'` for every city, `null` elsewhere. It is computed
once in loadWorld (rules/map.js), after P.oil / P.ore / P.rare / P.iron / terrain / pop0 exist, from map data only: no dice,
no game state, nothing saved. A province made a city later (newGame and restore set `G.P[capital].city = true`) has no
main: the yield rule treats a city with `main == null` as a money city.

Per country (every country on the map, playable or not), in the order of WORLD.countries:

1. **Capital = money.** In a country with two or more cities the capital (the province newGame picks: the capital-flag
   city, else the country's first city by province id) is a money city. A one-city country's only city takes its best
   resource by the scores below.
2. **Rare earth, 0 to 2 cities.** Only a country with two or more cities and at least one big deposit (a home province
   with `P.rare >= 1.4`, i.e. a real rare-earth district, not the scattered 0.8 finds). Deposits richest first: the
   non-capital city nearest the deposit (within 12 degrees) becomes a rare city. At most one, or two for a country with
   eight or more cities. A deposit whose nearest city is already taken is skipped.
3. **The other cities, greedy.** Repeatedly take the (city, resource) pair with the highest value
   `score x balance / (1 + 1.5 x cities of this country already on that resource)`:
   - oil: 0.6 + 0.7 x min(3, oil fields around) if any, else 0.15; +1.2 in the Gulf box (lat 12-38, lon 35-62)
   - materials: 0.7 + 0.5 x min(3, ore around)
   - iron: 0.5 + 0.6 x min(3, iron hills + half the ore around) + 0.2 x min(2, hill or mountain provinces next to it)
   - electronics: 0.3 + 1.7 x population percentile among all cities (big cities)
   - money: 0.3 + 1.2 x population percentile, +0.3 on the coast (ports and big cities)
   - "around" = the city province counts 2, each land neighbour 1, each land neighbour of a neighbour 0.5
   - balance = sqrt(share x (done + 6) / (used + 6 x share)) clamped 0.6-1.6, with world target shares money 0.17,
     oil 0.19, materials 0.21, iron 0.19, electronics 0.17 (rare 0.07): it keeps the world mix steady.
   The division by cities already on that resource is what spreads a country over several goods and leaves gaps.

### 3.2 Reference code (tested; paste into rules/map.js and call `cityMains(P, countries)` just before loadWorld returns)

```js
const ECO_SHARE = {cash:0.17, oil:0.19, metal:0.21, iron:0.19, elec:0.17, rare:0.07}, RARE_DEP = 1.4;
function cityMains(P, countries){ const KS = ['cash', 'oil', 'metal', 'iron', 'elec'], cities = P.filter(p => p.city && !p.sea), used = {cash:0, oil:0, metal:0, iron:0, elec:0, rare:0};
  const sorted = cities.map(p => p.pop0).sort((a, b) => a - b), pct = v => { let lo = 0, hi = sorted.length; while (lo < hi){ const m = (lo + hi) >> 1; if (sorted[m] < v) lo = m + 1; else hi = m; } return lo/Math.max(1, sorted.length - 1); };
  const ring = p => { const r1 = p.nbs.filter(v => !P[v].sea), s1 = new Set([p.id, ...r1]), r2 = []; for (const v of r1) for (const w of P[v].nbs) if (!P[w].sea && !s1.has(w)){ s1.add(w); r2.push(w); } return [r1.map(v => P[v]), r2.map(v => P[v])]; };
  const lonOf = p => ((((p.cc % W) + 0.5)/W*360 + WORLD.lon0) + 540) % 360 - 180;
  const feat = new Map();
  for (const p of cities){ const [r1, r2] = ring(p), sum = f => (f(p) ? 2 : 0) + r1.filter(f).length + 0.5*r2.filter(f).length, lon = lonOf(p), hilly = q => q.terrain === 'hills' || q.terrain === 'mountain';
    feat.set(p.id, {oil:sum(q => q.oil), ore:sum(q => q.ore), iron:sum(q => q.iron), hill:r1.filter(hilly).length + (hilly(p) ? 1 : 0), gulf:p.lat > 12 && p.lat < 38 && lon > 35 && lon < 62, pq:pct(p.pop0)}); }
  const score = (p, k) => { const F = feat.get(p.id);
    return k === 'oil' ? (F.oil > 0 ? 0.6 + 0.7*Math.min(3, F.oil) : 0.15) + (F.gulf ? 1.2 : 0)
      : k === 'metal' ? 0.7 + 0.5*Math.min(3, F.ore)
      : k === 'iron' ? 0.5 + 0.6*Math.min(3, F.iron + 0.5*F.ore) + 0.2*Math.min(2, F.hill)
      : k === 'elec' ? 0.3 + 1.7*F.pq
      : 0.3 + 1.2*F.pq + (p.coast ? 0.3 : 0); };
  let done = 0;
  for (const c of countries){ const cs = c.provs.map(v => P[v]).filter(p => p.city && !p.sea); if (!cs.length) continue;
    const n = cs.length, cap = cs.find(p => p.capFlag) || cs[0], loc = {cash:0, oil:0, metal:0, iron:0, elec:0, rare:0}, left = new Set(cs.map(p => p.id));
    const take = (p, k) => { p.main = k; loc[k]++; used[k]++; done++; left.delete(p.id); };
    if (n >= 2){ take(cap, 'cash');
      const deps = c.provs.map(v => P[v]).filter(p => p.rare >= RARE_DEP).sort((x, y) => y.rare - x.rare || x.id - y.id), maxR = n >= 8 ? 2 : 1;
      for (const d of deps){ if (loc.rare >= maxR) break; let bc = null, bd = 12;
        for (const p of cs){ if (p === cap) continue; const dl = ((lonOf(p) - lonOf(d) + 540) % 360) - 180, dist = Math.hypot(dl*Math.cos(d.lat*Math.PI/180), p.lat - d.lat); if (dist < bd){ bd = dist; bc = p; } }
        if (bc && left.has(bc.id)) take(bc, 'rare'); } }
    while (left.size){ let best = null, bv = -1;
      for (const id of left){ const p = P[id]; for (const k of KS){
        const wb = Math.max(0.6, Math.min(1.6, Math.sqrt(ECO_SHARE[k]*(done + 6)/(used[k] + 6*ECO_SHARE[k]))));
        const v = score(p, k)*wb/(1 + 1.5*loc[k]); if (v > bv + 1e-9){ bv = v; best = [p, k]; } } }
      take(best[0], best[1]); } }
  for (const p of P) if (!p.main) p.main = null; }
```

Note for the implementer: in the measured prototype the capital was assigned inside the greedy loop with a score of 99
(so it was counted in `done`/`used` when its turn came, which is first: 99 beats every other score). Taking it up front as
above gives the same result. Acceptance check: the table in 3.3 must come out exactly.

### 3.3 Result on today's map (211 cities in 95 countries)

World: materials 43, iron 42, money 38, electronics 38, oil 35, rare 15 (after the follow-ups; before them materials 44, oil 34).
Rare cities (15, in 10 countries; 85 countries have none): Los Angeles, Denver (USA); Yellowknife, Halifax (Canada);
Sao Paulo (Brazil); Murmansk, Yakutsk (Russia); Istanbul (Turkey); Cape Town (South Africa); Bangalore (India);
Hohhot, Guangzhou (China); Perth, Alice Springs (Australia); Ho Chi Minh City (Vietnam, not playable: a prize).

| Power | Cities and their main resource | Lacks |
|---|---|---|
| United States (14) | Washington, Seattle, Phoenix: money. San Francisco, Atlanta: oil. Minneapolis, Miami: materials. Anchorage, Houston: iron. Chicago, New York, Dallas: electronics. Los Angeles, Denver: rare | nothing, but thin for its size |
| Canada (8) | Ottawa: money. Montreal: oil. Vancouver, Winnipeg: materials. Calgary: iron. Toronto: electronics. Yellowknife, Halifax: rare | - |
| Brazil (7) | Brasilia, Rio de Janeiro: money. Recife: oil. Manaus: materials. Salvador: iron. Porto Alegre: electronics. Sao Paulo: rare | - |
| United Kingdom (4) | London: money. Manchester: materials. Edinburgh: iron. Belfast: electronics | oil city, rare |
| France (5) | Paris: money. Lyon: oil. Brest: materials. Marseille: iron. Bordeaux: electronics | rare |
| Germany (4) | Berlin: money. Cologne: oil. Munich: iron. Hamburg: electronics | materials, rare |
| Russia (19) | Moscow, Kazan: money. Arkhangelsk, Magadan, Rostov, Vladivostok: oil. Norilsk, Anadyr, Yekaterinburg, Volgograd: materials. Krasnoyarsk, Petropavlovsk, Irkutsk, Khabarovsk: iron. Saint Petersburg, Omsk, Novosibirsk: electronics. Murmansk, Yakutsk: rare | - |
| Turkey (4) | Ankara: money. Diyarbakir: oil. Izmir: materials. Istanbul: rare | iron, electronics |
| Iran (5) | Tehran: money. Tabriz, Isfahan: oil. Shiraz: materials. Mashhad: iron | electronics, rare |
| Egypt (3) | Cairo: money. Alexandria: oil. Aswan: electronics | materials, iron, rare |
| South Africa (3) | Pretoria: money. Durban: oil. Cape Town: rare | materials, iron, electronics |
| India (7) | New Delhi: money. Kolkata: oil. Chennai: materials. Ahmedabad, Hyderabad: iron. Mumbai: electronics. Bangalore: rare | - |
| China (14) | Beijing, Shanghai: money. Harbin, Chengdu: oil. Urumqi, Lanzhou, Lhasa: materials. Kashgar, Xi'an, Kunming: iron. Shenyang, Wuhan: electronics. Hohhot, Guangzhou: rare | - |
| Japan (5) | Tokyo: money. Fukuoka: oil. Sendai: materials. Sapporo: iron. Osaka: electronics | rare |
| Australia (11) | Canberra, Hobart: money. Port Hedland: oil (follow-ups: a country with eight or more cities gets one oil city). Brisbane, Cairns, Darwin: materials. Adelaide, Sydney: iron. Melbourne: electronics. Perth, Alice Springs: rare | - |

Scenario powers: Italy (3) money, iron, materials. Spain (2) money, materials. Poland (1) electronics. Indonesia (5) money,
oil, materials, electronics x2. Mexico (3) money, iron, materials.

Playability check ("can every nation still build its basic units"): every nation keeps money, manpower and a floor of
materials and iron from its capital's state industry and its countryside (section 4). The lowest day-1 gross incomes are
materials 7.6 a day (Egypt), iron 5.7 (Egypt), electronics 1.7 (Turkey), rare 2.3 (France), oil 5.7 (Australia). Infantry needs
no goods, anti-tank infantry 3 materials + 3 iron, a tank 5 materials + 11 iron, so every nation can field its basic army
from day one and buys the rest. In all six 30-day runs all 15 nations were alive at day 30, none had an empty treasury,
and one nation in one run (Australia, oil) had an empty stock with a negative balance.

---

## 4. Yields

### 4.1 Province yield (replaces the body of provYield; `f`, `pp`, `pf`, `b` as today)

```js
const ECO_Y = {cash:1.6, oil:9.4, metal:8.2, iron:7.6, elec:3.3, rare:4.7};   // a city's main resource: money is a factor on the city's money, the rest units a day
const ECO_RUR = {oil:2.4, metal:0.8, ironOre:0.5, iron:0.6};                  // countryside: oil field, ore (materials + iron), iron hills
const ECO_CAPITAL = {oil:3, metal:6, iron:4.5, elec:1.5, rare:2.5};           // the capital's state industry (was 3 / 3 / 3.5 / 1.5 / 1)
const ARMS_PCT = 0.25, ECO_CASH_ALL = 1.10, ECO_MP_CITY = 2.0;
// in provYield:
const y = {cash:((P.city ? 8.5 : 1.8*pf) + ECO.cash*pp)*f,
  oil:(P.oil && !P.city ? ECO_RUR.oil : 0)*f, metal:(P.ore && !P.city ? ECO_RUR.metal : 0)*f,
  iron:(P.city ? 0 : (P.ore ? ECO_RUR.ironOre : 0) + (P.iron ? ECO_RUR.iron : 0))*f,
  elec:(P.city ? 0 : 0.004*pp)*f, rare:0,
  mp:((P.city ? ECO_MP_CITY : 0.25*pf) + ECO.mp*Math.pow(Math.max(0, popOf(p)), 0.8) + 3*b.rec)*f};
if (P.city){ const k = P.main || 'cash', a = 1 + ARMS_PCT*(b.arms || 0);
  if (k === 'cash') y.cash *= ECO_Y.cash*a; else y[k] = ECO_Y[k]*(0.8 + 0.4*Math.min(1, pp/8))*a*f; }
return y;
```

In words:

| Source | Today | New |
|---|---|---|
| Money, any city | 8.5 + 0.68 x pop^0.75, +20% per factory level | 8.5 + 0.68 x pop^0.75 (no factory bonus) |
| Money city (main = money) | - | the above x 1.6, +25% per Arms Industry level |
| Oil city | - | 9.4 x size, +25% per level |
| Materials city | 0.9 | 8.2 x size, +25% per level |
| Iron city | 0.8 | 7.6 x size, +25% per level |
| Electronics city | 0.2 + 0.047 x pop^0.75, +25% per factory level | 3.3 x size, +25% per level |
| Rare city | - | 4.7 x size, +25% per level |
| Any other good in a city | oil field 4.2, ore 1.4 + 0.8 | 0: a city yields money, manpower and its main resource only |
| Countryside oil field | 4.2 | 2.4 |
| Countryside ore deposit | 1.4 materials + 0.8 iron | 0.8 materials + 0.5 iron |
| Countryside iron hills | 0.8 iron | 0.6 iron |
| Countryside rare deposit | P.rare (0.8 to 4) | 0 (it only decides which city is the rare city) |
| Countryside electronics | 0.004 x pop^0.75 | unchanged |
| Manpower, city | 1.2 + 0.16 x pop^0.8 + 3 per Recruiting Office | 2.0 + 0.16 x pop^0.8 + 3 per Recruiting Office |
| Capital bonus | oil 3, materials 3, iron 3.5, electronics 1.5, rare 1 | oil 3, materials 6, iron 4.5, electronics 1.5, rare 2.5 |

size = 0.8 + 0.4 x min(1, pop^0.75 / 8): 0.8 for a small town, 1.2 from about 16 million people. So a city's main output
before buildings ranges: oil 7.5-11.3, materials 6.6-9.8, iron 6.1-9.1, electronics 2.6-4.0, rare 3.8-5.6 a day; a money
city makes 14-41 a day against 8.5-29 for a city of the same size on another resource. Occupation, blockade, morale and
convoy factors (`f`) apply as today; a knocked-out Arms Industry counts as level 0 (the existing `bdis` handling).

### 4.2 National income (income0)

- Money: `g.cash *= has(n, 'eco1') ? 1.2 : ECO_CASH_ALL` (everyone gets +10%; see section 6).
- The capital line uses ECO_CAPITAL.
- The start boost in newGame aims at 220 instead of 200: `n.boost = clamp(220 / gross money, 1, 2.5)`.
- eco2 and eco3 lines stay as legacy (`has(n, 'eco2')` manpower x1.4, `has(n, 'eco3')` oil x1.5): only old saves have them.
- Everything else (administration, mobilisation, difficulty, war weariness, trade routes, upkeep) is unchanged.

The home boost multiplies all goods of a small power's home provinces, as today, so one rare city is worth more to Turkey
or South Africa (11 to 14 rare a day) than two are to Russia or the USA (6 to 8).

---

## 5. Buildings

### 5.1 Army Base (save key `fac`, was Arms Factory)

Keeping the key means every old save's factories become Army Bases at the same level with no migration, and the pictures
(`BART.fac = 'military-base'`, b-military-base-1..5) already match.

- Levels I-V, city only, cost unchanged: $25M, 12 materials, 12 iron at level I; x1.6 per level; levels IV-V also cost
  electronics (as today); +40% for every other province of yours that already has an Army Base (FAC_RISE, own count).
- Level I unlocks Mobile Artillery, Main Battle Tank, IFV, Mobile Jammer. Level II unlocks Mobile SAM, Rocket Artillery,
  Swarm Drones. (Exactly today's `req:{b:'fac'}` units: no change to UNITS.)
- Training: one more training line per level (as today), and ground units (every unit whose `req.b` is `fac` or `rec`)
  train 20% faster per level up to III, then 5% per level: time factors 0.8 / 0.6 / 0.4 / 0.35 / 0.30 (today's facF).
  Aircraft and ships no longer get this factor; they keep the Airbase and Naval Yard level bonuses.
- It gives no money, no electronics, no resources.
- A new game still starts with Army Base I in the capital.

Text: `'Unlocks and trains ground units. Level I: mobile artillery, main battle tanks, IFVs and jammers; level II: mobile SAMs, rocket artillery and swarm drones. Each level adds a training line; ground units train 20% faster per level up to III, then 5% per level. No income. Each Army Base you already own in another province makes the next one cost 40% more.'`

### 5.2 Arms Industry (new key `arms`)

`arms: {name:'Arms Industry', max:5, cost:40, metal:12, iron:6, days:3, where:'city'}`; pictures b-arms-industry-1..5 are
already registered (`BART.arms`).

- Effect: +25% of the city's main resource per level (money cities: +25% of the city's money), up to +125% at level V.
- Pricing, "cheap first, pricier each extra": x1.6 per level and +40% for every OTHER province of yours that already has an
  Arms Industry (built or under construction), money, materials and iron alike. `facOthers(n, p, k)` counts per building
  kind; Army Bases and Arms Industries do not raise each other's price.

| Level | Money | Materials | Iron | Electronics | Build time | Total bonus |
|---|---|---|---|---|---|---|
| I | 20 | 6 | 3 | 0 | 72 h | +25% |  (half price since the follow-ups; was 40 / 12 / 6)
| II | 64 | 19 | 10 | 0 | 72 h | +50% |
| III | 102 | 31 | 15 | 0 | 72 h | +75% |
| IV | 164 | 49 | 25 | 16 | 90 h | +100% |
| V | 262 | 79 | 39 | 26 | 108 h | +125% |

(From today's buildCost: x1.6^(level-1); from level IV electronics = 10% of the base money x the same factor and +25% time
per level above III. Multiply the three prices by 1.4 per other city that has one: level I in a second city 28 / 8 / 4, in a third 39 / 12 / 6.)

What one level I is worth a day in a median city at base prices, before the national factors: oil +2.3 ($7.4), rare +1.1 ($7.0),
money +$4.9, materials +1.9 ($4.6), iron +1.7 ($3.8), electronics +0.9 ($3.7); the first one cost about $82 with its
materials and iron and paid back in 11 to 22 days. Since the follow-ups level I is half price (about $41 in all): 6 to 11 days
before the national factors, 4 to 7 days for a small power with its home boost (see Follow-ups at the end).

Text: `'Raises this city's main resource by 25% per level. Each Arms Industry you already own in another province makes the next one cost 40% more.'`
The build menu should say the city's resource: "Arms Industry: +25% oil here".

### 5.3 Removed: Refinery, Foundry, Rare Earth Mine

Delete `ref`, `fdy`, `mine` from BUILD, with `mineLv`, `MINE_T`, the `where:'oil'` and `where:'mine'` cases of canBuildHere,
and their lines in provYield and the AI. Refunds: section 9.

### 5.4 Unchanged

Recruiting Office (not touched: its rework is with the owner), Fortifications, Airbase, Naval Yard, Missile Silo.
Mobilisation rules unchanged: infantry from a Recruiting Office, vehicles from an Army Base, aircraft from an Airbase, ships
from a Naval Yard.

---

## 6. The Economy research branch moves into buildings

Remove eco1, eco2, eco3 from TECH (and the `t.oil = t.id === 'eco3' ? 40 : 0` special case; no tech costs oil any more).

| Tech (today) | Effect today | What replaces it | A save that researched it |
|---|---|---|---|
| eco1 Industrial Automation | money +20%, trade-route money +10% | Arms Industry in money cities (+25% a level); every nation gets +10% money as a base (ECO_CASH_ALL) | keeps the full +20% (instead of the +10%) and the +10% on trade routes |
| eco2 National Service | manpower +40% | cities give 2.0 manpower instead of 1.2; the Recruiting Office's +3 a day is the building route (unchanged) | keeps +40% |
| eco3 Oil Refining | oil +50% | Arms Industry in oil cities (+25% a level) | keeps +50% |

`has(n, 'eco1')` etc. keep working because `N.tech.eco1` stays in the save; only the TECH entries go. The research screen
loses the Economy column (index.html: TGLY and TECH_BLD entries for eco1-3). The AI's research weight `eco1:3` goes.

Research also costs fewer rare materials, because rare income no longer jumps with Mines in the first ten days:
`t.rare = [0, 18, 44, 78][tier] + Math.round(base/12)` (was `[0, 22, 52, 92][tier] + Math.round(base/10)`), about -17%.
Example: Ceramic Body Armor 28 -> 23, Jet Engines 34 -> 28, Ballistic Missiles 76 -> 64, Stealth Airframes 118 -> 100.

---

## 7. Upkeep and prices

- **Unit prices and unit upkeep: unchanged.** With income per resource within +-13% of today's and units fielded within 1%
  at day 30 (1,439 -> 1,433), upkeep is paid as before: world upkeep at day 30 is money 1,882 a day against 1,912 today
  (48% of gross against 49%), oil 204 against 197 (47% against 44%), iron 101 against 97, electronics 13 against 11.
- **Market base prices (MKT_BASE), spread (buy x1.1, sell x0.9), stock cap: unchanged.** The price formula follows supply
  and demand, so it keeps working; what changes is that nations really trade (section 10.3).
- **Research:** rare cost about -17% (section 6).
- **Start stocks:** unchanged (money 220, oil 40, materials 60, iron 70, electronics 30, rare 40, manpower 80).
- **Building prices:** Army Base as the Arms Factory today; Arms Industry per 5.2; the three removed buildings refunded.

---

## 8. AI (rules/ai.js)

All of this was in the measured prototype.

1. **Arms Industry site.** `aiSite(n, k)` now takes a resource: the nation's own city with `main === k`, no construction
   running, level below V; value `(1 + 0.2 x min(4, pop^0.75 / 4)) / (1 + level) x (home ? 1 : 0.6)`, a little dice (x 1 to 1.1).
2. **What to raise at home** (replaces the mine / fdy / ref / fac needs list): rare if net rare < 6 and stock < 140, or its
   rare city is below Arms Industry III; iron if net iron < -1 or the stock is under its reserve (today's test); materials
   if net < 4 and stock < 80; oil if net < 3; electronics by today's test; money if net money < 25 or the treasury is above
   500; Recruiting Office as today.
3. **It must pay.** Payback in days = (money + materials and iron at base prices) / (25% of the city's un-boosted output
   at base prices). A real shortage accepts up to 40 days; otherwise, with more than $200M, the AI adds the single best
   investment if it pays back within 20 days (this is how exporters grow what they are good at). What does not pay is
   imported instead. One Arms Industry under construction at a time (two for empires above 150 provinces), rare first.
4. **Structural trade, once a day.** For each good: if one of its cities produces it and the stock is above
   keep + reserve + 25 days of upkeep (keep: oil 200, materials 120, iron 140, electronics 110, rare 40) and the world
   price is at least 75% of base, it lists up to 80 on the order book at 98% of the world price, or, if it already has a
   listing, sells 12 + excess/8 (at most 50 a day) on the world market. If none of its cities produce the good and the
   stock is below AI_SHORT + reserve + 10 days of upkeep and the price is at most 1.5x base, it buys the gap, at most
   oil 40, materials 40, iron 35, electronics 20, rare 30 a day, order book first, then the world market, never below $120M.
5. **Army Bases only where wanted** (they pay nothing now): the capital, then at most one city in three
   (`max(2, ceil(cities x 0.34))`), cities with a Recruiting Office first (others 15% chance). A Naval Yard no longer
   needs an Army Base in the city.
6. Remove `eco1` from the research weights and every `ref` / `fdy` / `mine` branch.

---

## 9. Old saves (rules/state.js, in restore after resMigrate)

`ecoMigrate()`, run once (flag `S.eco = 1`; newGame sets it too). Save version stays 4.

1. **Arms Factory -> Army Base:** nothing to do (same key `fac`, same level, units in training carry on).
2. **Refinery, Foundry, Rare Earth Mine refunded and removed.** For each province and each of `ref`, `fdy`, `mine`:
   refund the province's current owner every level built, at the un-raised price, then delete the key:

   | Building | Level I | Level II |
   |---|---|---|
   | Refinery | $50M, 10 materials, 5 iron | $80M, 16 materials, 8 iron |
   | Foundry | $50M, 10 materials | $80M, 16 materials |
   | Rare Earth Mine | $55M, 10 materials | $88M, 16 materials |

   One under construction (`S.cons[p].k` is one of the three): cancel it and refund that level. A knocked-out one
   (`S.bdis[p]`) is forgotten. Materials and iron above the storage cap would be lost at the next daily tick, so anything
   over `stockCap(n)` is paid in money at the base price (materials 2.4, iron 2.2). Unowned provinces: just delete.
   Each seat gets one dispatch: "Refineries, Foundries and Rare Earth Mines are gone: N levels refunded ($X M, Y materials,
   Z iron). Build an Arms Industry in a city to raise what it produces."
3. **Economy techs:** `N.tech.eco1/2/3` stay and keep their effect (section 6). A project still running in a research slot
   with one of these ids is completed at once (`N.tech[id] = 1`, slot freed): it was paid for.
4. **City main resources:** from the map, nothing to migrate. A capital that the save made a city counts as a money city.
5. **Arms Industry:** `restore` already fills missing building keys with 0, so `arms` appears at 0 everywhere.
6. Recompute trade-route values (`trValue` for every route) and clear the income cache (`INCC.v = -1`), as resMigrate does.
7. Old dispatches that name the removed buildings may stay (they are history); the shortage texts must change:
   SHORT_MSG iron "…or build an Arms Industry in an iron city", electronics "…or build an Arms Industry in an electronics city".

Test: an old save with a Refinery II, a Foundry under construction, a knocked-out Mine, eco1 researched and eco3 running
must load with the refunds above, no `ref`/`fdy`/`mine` keys, eco1 at +20% money and eco3 complete (extend .test/v3air-oldsave
or .test/save).

---

## 10. Balance: before and after

Six-seed mean, all 15 nations AI, world gross income a day. "Before" = today's rules; "after" = the prototype with the
numbers in this document.

### 10.1 World income per resource

| Day | | Money | Oil | Materials | Iron | Electronics | Rare | Manpower |
|---|---|---|---|---|---|---|---|---|
| 1 | before | 4117 | 502 | 319 | 295 | 86 | 89 | 901 |
| 1 | after | 4494 | 510 | 348 | 296 | 90 | 101 | 959 |
| 1 | change | +9% | +2% | +9% | 0% | +5% | +13% | +6% |
| 10 | before | 4199 | 473 | 299 | 279 | 89 | 140 | 994 |
| 10 | after | 4259 | 480 | 323 | 284 | 84 | 130 | 1033 |
| 10 | change | +1% | +2% | +8% | +2% | -5% | -7% | +4% |
| 20 | before | 4120 | 453 | 292 | 267 | 82 | 136 | 1009 |
| 20 | after | 4023 | 441 | 308 | 274 | 78 | 122 | 1021 |
| 20 | change | -2% | -3% | +5% | +3% | -6% | -10% | +1% |
| 30 | before | 3935 | 447 | 292 | 273 | 78 | 134 | 1034 |
| 30 | after | 3904 | 438 | 303 | 281 | 81 | 117 | 1029 |
| 30 | change | -1% | -2% | +4% | +3% | +3% | -13% | -1% |

All inside the +-15% target. Single seeds at day 30 range wider, as they do today between seeds (wars differ): money
-13..+7%, oil -14..+12%, materials -2..+13%, iron -6..+6%, electronics -8..+17%, rare -20..-7%. Rare is the one to watch:
today it jumps 57% in ten days because every AI rushes Mines; now it starts 13% higher and grows with Arms Industry
levels in 15 cities, and research costs 17% fewer rare materials to match (techs researched by day 30: 98 before, 101 after).

### 10.2 Upkeep, armies, research, prices, stocks (six-seed mean)

| | Day 10 before | Day 10 after | Day 30 before | Day 30 after |
|---|---|---|---|---|
| Money upkeep a day | 1057 | 999 | 1912 | 1882 |
| Oil upkeep | 50 | 46 | 197 | 204 |
| Iron upkeep | 38 | 37 | 97 | 101 |
| Electronics upkeep | 0 | 0 | 11 | 13 |
| Units in the world | 917 | 874 | 1439 | 1433 |
| Techs researched | 23 | 29 | 98 | 101 |
| Oil price (base 3.2) | 2.36 | 2.34 | 3.06 | 2.37 |
| Materials price (2.4) | 3.37 | 3.62 | 2.33 | 1.91 |
| Iron price (2.2) | 2.85 | 3.16 | 2.57 | 2.69 |
| Electronics price (4.2) | 3.28 | 3.46 | 3.95 | 4.08 |
| Rare price (6.5) | 9.56 | 9.69 | 7.71 | 6.92 |
| World stocks: money | 2700 | 2937 | 2107 | 2089 |
| oil | 4796 | 4699 | 9324 | 8657 |
| materials | 747 | 1039 | 1936 | 1731 |
| iron | 1179 | 1391 | 1926 | 2086 |
| electronics | 1369 | 1365 | 2074 | 1583 |
| rare | 417 | 455 | 620 | 580 |

Prices stay between 0.74x and 1.5x base and still move with the game (materials and iron dear during the day-10 build-up,
rare always above base). Oil and materials end a little cheaper because exporters now sell their surplus instead of
hoarding it. Buildings at day 30 (levels, mean): Army Bases 64 (factories 77 before), Arms Industry 51, Recruiting
Offices 125 (119), Naval Yards 32 (21), Airbases 26 (22).

### 10.3 Trade (seed 12345, money moved on the world market by day 30)

| | Before | After |
|---|---|---|
| Bought | 3,362 (materials 2,113, rare 537, iron 439, electronics 273) | 8,453 (materials 3,630, rare 1,929, iron 1,624, electronics 822, oil 448) |
| Sold | 50 | 3,874 (oil 1,624, materials 1,169, rare 624, iron 416, electronics 41) |
| Order-book listings at day 30 | 8 | 21 |

### 10.4 Nation spread, day 1 gross a day (before > after)

| Power | Money | Oil | Materials | Iron | Electronics | Rare | Manpower |
|---|---|---|---|---|---|---|---|
| United States | 273 > 313 | 29.5 > 27.2 | 23.6 > 23.1 | 22.7 > 19.8 | 5.0 > 7.9 | 7.8 > 7.6 | 50 > 56 |
| Canada | 236 > 256 | 34.1 > 29.7 | 31.1 > 31.3 | 26.4 > 20.0 | 4.3 > 5.7 | 9.0 > 12.4 | 44 > 51 |
| Brazil | 229 > 249 | 25.4 > 22.4 | 14.2 > 15.1 | 16.3 > 14.5 | 4.3 > 4.5 | 7.7 > 6.4 | 47 > 49 |
| United Kingdom | 239 > 256 | 28.0 > 19.0 | 15.1 > 24.8 | 15.2 > 21.6 | 5.4 > 8.1 | 1.1 > 2.7 | 59 > 61 |
| France | 244 > 255 | 40.7 > 30.8 | 17.2 > 23.4 | 15.9 > 19.1 | 5.2 > 6.9 | 0.9 > 2.3 | 54 > 57 |
| Germany | 231 > 247 | 18.4 > 36.4 | 16.2 > 10.6 | 16.4 > 25.4 | 6.5 > 9.3 | 1.3 > 3.2 | 61 > 64 |
| Russia | 260 > 299 | 44.1 > 43.9 | 30.5 > 30.0 | 25.6 > 27.2 | 4.3 > 6.7 | 7.0 > 6.1 | 43 > 52 |
| Turkey | 237 > 262 | 43.7 > 43.2 | 26.5 > 28.7 | 22.2 > 11.9 | 5.0 > 1.7 | 4.1 > 12.5 | 56 > 58 |
| Iran | 247 > 265 | 72.1 > 70.1 | 14.0 > 20.3 | 18.4 > 22.6 | 5.7 > 1.8 | 2.8 > 2.4 | 54 > 58 |
| Egypt | 238 > 250 | 39.5 > 44.7 | 14.0 > 7.6 | 12.4 > 5.7 | 6.9 > 9.1 | 5.7 > 3.2 | 64 > 62 |
| South Africa | 225 > 237 | 32.6 > 45.6 | 20.8 > 13.9 | 21.7 > 11.7 | 6.6 > 2.2 | 11.5 > 14.1 | 66 > 65 |
| India | 431 > 480 | 34.9 > 30.6 | 13.1 > 13.8 | 14.6 > 19.9 | 7.3 > 4.6 | 4.8 > 4.9 | 93 > 96 |
| China | 559 > 624 | 34.1 > 37.1 | 24.3 > 26.4 | 22.8 > 26.9 | 7.8 > 7.3 | 12.9 > 7.6 | 111 > 117 |
| Japan | 234 > 253 | 13.3 > 23.8 | 26.9 > 29.0 | 19.0 > 22.4 | 5.8 > 8.5 | 1.0 > 2.6 | 55 > 59 |
| Australia | 233 > 248 | 11.5 > 5.7 | 31.1 > 50.2 | 25.7 > 27.1 | 5.7 > 5.9 | 11.7 > 13.2 | 44 > 53 |

The spread per good is wider than today (electronics 1.7 to 9.3, materials 7.6 to 50, rare 2.3 to 14), which is the point:
Turkey, Iran and South Africa buy electronics, Egypt and Germany buy materials, Australia buys oil and sells materials.

Strength at day 30 (six-seed mean, before > after): units USA 87 > 89, Canada 94 > 109, Brazil 105 > 98, UK 87 > 80,
France 49 > 39, Germany 80 > 86, Russia 103 > 111, Turkey 62 > 52, Iran 66 > 70, Egypt 66 > 75, South Africa 89 > 81,
India 177 > 181, China 218 > 194, Japan 82 > 83, Australia 74 > 87. Nobody collapses; the changes are inside the
seed-to-seed spread. Techs by day 30: the nations with a rare city research a little more than today (Canada 7.0 > 9.3,
Turkey 6.5 > 8.8, South Africa 6.7 > 9.0), the six without research less (UK 6.3 > 4.2, France 6.3 > 3.8, Germany 5.2 > 3.0,
Iran 6.5 > 4.0, Egypt 5.2 > 3.5; Japan 5.0 > 5.7). That is the intended pressure to trade or fight for rare earth; if the
owner finds it too hard on them, raise ECO_CAPITAL.rare from 2.5 to 3.5 (about +1 rare a day for each of them).

---

## 11. Pictures

Every building left in the game has its pictures:

| Building | Pictures | Status |
|---|---|---|
| Army Base I-V | b-military-base-1..5 | have (kept from the Arms Factory) |
| Arms Industry I-V | b-arms-industry-1..5 | have, already registered |
| Airbase, Naval Yard, Missile Silo I-V | b-airfield, b-naval-port, b-missile-silo 1..5 | have |
| Fortifications I-III | b-fortifications-1..3 | have |
| Recruiting Office | b-recruiting-office-1 | have for its single level; levels II-V would be needed only if the 5-level rework is approved |

Still to draw (not buildings): a small badge per main resource for the city panel and the Resources map
(money, oil, materials, iron, electronics, rare). The existing top-bar resource icons can stand in until then.

---

## 12. Implementation checklist

Rules:
1. rules/map.js: `cityMains` (3.2), called at the end of loadWorld.
2. rules/data.js: BUILD (rename `fac`, add `arms`, drop `ref` `fdy` `mine`), TECH (drop eco1-3, rare cost), RES `src` texts,
   the constants of 4.1.
3. rules/economy.js: provYield and income0 (4.1, 4.2), SHORT_MSG texts.
4. rules/production.js: `facOthers(n, p, k)`, buildCost for `arms`, canBuildHere, trainF (ground units only), remove mineLv.
5. rules/ai.js: section 8.
6. rules/state.js: start boost 220, `S.eco`, `ecoMigrate` (section 9).
7. rules/trade.js: nothing (the eco1 legacy lines stay).

UI (index.html, reads the rules only): city panel shows "Produces: oil +9.4 a day" and the Arms Industry line; build menu;
Resources map shows each city's main resource; research screen without the Economy column; Field Manual and tips that
name Arms Factory, Refinery, Foundry, Rare Earth Mine or the Economy techs (44 lines mention them today).

Checks: `node tools/headless.js --check`; the measuring tool gives the tables of section 10; tools/golden-12345.txt will
change (new economy) and must be regenerated; the usual test list, with .test/prod, bld, v3r1, v3r2, v3mkt and the save
tests most likely to need new expectations.

Reproducing the numbers (scratch, not committed: .test is git-ignored; local copies are in this worktree):
`node .test/eco-measure.js --seed 12345` (today) and
`node .test/eco-measure.js --proto --par "$(cat .test/eco-par-r.json)" --seed 12345` (this design;
the patch is /home/user/iron-meridian-eco/.test/eco-proto.js), then `node .test/eco-avg.js r 12345 7 2024 99 31337 555`.

---

## 13. Open points

1. **Army Base and aircraft/ship training.** The owner's text says the Army Base trains ground units only, so this design
   stops its speed bonus for aircraft and ships. The prototype still had the old all-units bonus, so expect air and naval
   build-up to be slightly slower than in the tables; re-run them after implementing. The extra training lines stay
   per city (one queue per city, as today).
2. **Manpower is not "part of buildings" beyond the Recruiting Office**, because that building may not be changed now.
   If its 5-level rework is approved, the 1.2 -> 2.0 city manpower base can move into its levels.
3. **Rare for the have-nots** (section 10.4): one knob, ECO_CAPITAL.rare.
4. **Australia has no oil city** (5.7 oil a day, the lowest). It ran dry in one run of six by day 30. If that proves
   common, raise the AI's daily oil import cap from 40 to 60 rather than changing the map rule.
5. **Rare city placement** is by nearest city to the deposit, which makes Istanbul and Sao Paulo rare cities rather than
   the industrial cities they are. A hand-written override table (country -> city) would be easy to add if the owner
   prefers other cities; the totals do not depend on which city it is.

---

## 14. As implemented (branch economy-v1)

The rules follow this document, with two deliberate differences, and the tables were measured again on the real rules
(`node .test/eco-measure.js`, six seeds, against today's rules at 140d490).

1. **Exports go through the order book only.** Section 8.4 let an exporter with a listing already out also sell 12 to 50 a
   day on the world market. That broke the standing market rule (and its test, .test/v3mkt): only a cash-poor power's
   materials hoard is ever sold on the world market, because dumping flattened prices for everyone. So an AI exporter now
   keeps one listing of up to 120 per good on the order book at 98% of the world price, and importers buy from the listings
   first. Prices stay closer to base than in section 10.2 (day 30: oil 3.19, materials 2.12, iron 2.72, electronics 4.37,
   rare 7.30).
2. **The Army Base speeds up ground units only** (open point 1): the units an Army Base or a Recruiting Office mobilizes.
   Aircraft and ships keep the Airbase and Naval Yard bonuses.

World gross income a day, six-seed mean, before > after:

| Day | Money | Oil | Materials | Iron | Electronics | Rare | Manpower |
|---|---|---|---|---|---|---|---|
| 1 | 4117 > 4494 (+9%) | 502 > 510 (+2%) | 319 > 348 (+9%) | 295 > 296 (0%) | 86 > 90 (+5%) | 89 > 101 (+13%) | 901 > 959 (+6%) |
| 10 | 4199 > 4269 (+2%) | 473 > 483 (+2%) | 299 > 323 (+8%) | 279 > 282 (+1%) | 89 > 86 (-3%) | 140 > 130 (-7%) | 994 > 1036 (+4%) |
| 20 | 4120 > 4028 (-2%) | 453 > 446 (-1%) | 292 > 309 (+6%) | 267 > 268 (0%) | 82 > 82 (-1%) | 136 > 121 (-11%) | 1009 > 1020 (+1%) |
| 30 | 3935 > 3851 (-2%) | 447 > 427 (-4%) | 292 > 309 (+6%) | 273 > 276 (+1%) | 78 > 78 (-1%) | 134 > 122 (-9%) | 1034 > 1023 (-1%) |

Day 30, before > after: upkeep money 1912 > 1866, oil 197 > 204, iron 97 > 100, electronics 11 > 13; units 1439 > 1432;
techs researched 98 > 98; prices oil 3.06 > 3.19, materials 2.33 > 2.12, iron 2.57 > 2.72, electronics 3.95 > 4.37,
rare 7.71 > 7.30; all 15 nations alive in all six runs, no nation with an empty stock and a negative balance.
Buildings at day 30 (levels, mean): Army Bases 59 (factories 77 before), Arms Industry 52, Recruiting Offices 122 (119),
Naval Yards 28 (21), Airbases 24 (22). World-market buying, seed 12345: 3,362 > 9,278; order-book listings at day 30: 8 > 28.
Single seeds at day 30: money -13..+9%, oil -12..+5%, materials 0..+11%, iron -4..+4%, electronics -10..+7%, rare -16..-4%.

Checks: `node tools/eco-check.js` (city resources, buildings, every playable nation of the three scenarios, an old save),
`node tools/headless.js --check`, tools/golden-12345.txt regenerated.

### Repair 1: a person can export too

The AI import code skipped a person's sell offers, so a seat's exports hardly sold (Australia, 60 materials on offer at 5%
under the world price for 30 days: 0, 26 and 0 units sold on seeds 12345, 7 and 2024). A seat's sell offer is now an
ordinary listing: AI importers fill it in their own turn (cheapest first, up to 1.15x the world price) and the daily
order-book pass takes it by the same need rule as another AI's listing; the seat gets a dispatch for each sale. Same lab
after the change: 204, 245 and 205 units sold ($514M, $665M, $522M). What limits it now is demand: the AI world wants about
7 materials a day from one more exporter, so the biggest producer (+50 a day) still fills its storage near day 30 unless it
spends the materials. Games without a seat (the tables above) are unchanged: same state hash.
Lab: node tools/export-lab.js (options --nation, --res, --qty, --disc, --days).

### Merge with master: five-level Recruiting Office and the Stealth Bomber

Master's Recruiting Office rework and Stealth Bomber are merged into this economy. What changed against the tables above:

- Recruiting Office: levels I-V priced from its own table ($40M at level I to $360M at level V, no 40% rise). Manpower a day
  is `recMp(level)` = 3k at level I, +1.5k per level (9k at level V) instead of a flat 3 per office; the city manpower base
  stays 2.0. Every unit trained in its city trains 10% faster per level.
- Training time: the Army Base factor (ground units only) times the Naval Yard or Airbase factor times the Recruiting Office
  factor, with a floor of 30% of the base time (`trainEff`).
- AI: Recruiting Offices by master's site rule (a new office first, upgrades when every province has one or where training
  speed is the limit); Arms Industry by payback as before. The Stealth Bomber needs Airbase III; the bomb2 / bomb3 research
  costs rare materials at this economy's research prices.

World gross income a day after the merge, three-seed mean (12345, 7, 2024), pre-economy baseline > merged:

| Day | Money | Oil | Materials | Iron | Electronics | Rare | Manpower |
|---|---|---|---|---|---|---|---|
| 1 | 4117 > 4494 (+9%) | 502 > 510 (+2%) | 319 > 348 (+9%) | 295 > 296 (0%) | 86 > 90 (+5%) | 89 > 101 (+13%) | 901 > 959 (+6%) |
| 10 | 4158 > 4261 (+2%) | 463 > 481 (+4%) | 299 > 324 (+8%) | 277 > 280 (+1%) | 90 > 86 (-4%) | 139 > 128 (-8%) | 1000 > 1038 (+4%) |
| 30 | 3869 > 3750 (-3%) | 449 > 433 (-3%) | 291 > 306 (+5%) | 274 > 272 (-1%) | 79 > 77 (-2%) | 135 > 124 (-9%) | 1086 > 1033 (-5%) |

Single seeds at day 30: money -11..+7%, oil -9..+8%, materials -1..+12%, iron -2..+1%, electronics -14..+7%, rare -11..-8%,
manpower -9..+2%. Day 30 means: units 1496 > 1420, techs 98 > 99.

### Follow-ups from the economy review (branch eco-followups)

Measured headless, seeds 12345, 7 and 2024, 30 days, against master 15466ee.

1. **Iron for powers without an iron city.** The Market is the order book only, and AI powers listed iron only above 140 in
   stock plus 25 days of upkeep, so nobody sold iron before day 11 to 18. Now a power with an iron city and a net iron income
   of 3 a day or more lists small lots (up to 40) as soon as its stock is above 90 plus what it saves for and 10 days of
   upkeep (AI_XEARLY in rules/ai.js); the full export line is unchanged. Iron on sale by day 10: 0 / 0 / 0 before,
   260 / 182 / 197 after; first iron offer on day 14 / 11 / 12 before, day 3 / 2 / 4 after. A scripted Egypt (a seat that
   builds Army Bases, keeps tanks and artillery in training and buys iron offers up to 1.5x the world price) saw its first
   iron offer on day 18 / 11 / 11 before and day 3 / 3 / 3 after, bought 196 / 381 / 461 iron by day 30 before and
   543 / 553 / 623 after, and could not pay for a tank on 24 / 23 / 15 of the 30 days before, 2 / 5 / 2 after (iron shortage
   from day 21 in one seed before, none after). The iron price at day 30 stays near base (2.33 to 2.58 before, 2.44 to 2.55 after).
2. **Expired offers.** A seat's sell or buy offer that runs out after three days gives a dispatch: what and how much, how
   much of it was sold or bought, and that the goods are back in stock or the held money back in the treasury.
3. **Arms Industry level I at half price** ($20M, 6 materials, 3 iron; BUILD.arms.first = 0.5; levels II to V unchanged).
   Payback of the first level I in a median city at base prices, before the national factors: oil 11 > 6 days, rare 12 > 6,
   money 17 > 8, materials 18 > 9, iron 22 > 11, electronics 22 > 11; for a small power with its home boost about 4 to 7 days
   (Egypt, day 1: oil 5, money 6, electronics 12).
4. **City strip hover text** for the Army Base and the Arms Industry says what the next level does in this city, its price,
   its build time and, for the Arms Industry, today's and the next output and the payback in days.
5. **Resources map colours** follow the resource pictures: money light green, oil red, materials olive, iron steel grey-blue,
   electronics teal, rare materials orange, manpower dark helmet green.
6. **France and Australia.**
   France (48 provinces) was just over the 40-province line of the compact powers, so it started with 13 units and no forts
   beside Germany (38 units, 12 forts) and Britain, and was open to attack from day 8 while they were safe for 21 days: in all
   three seeds Britain and Germany (and Brazil) declared war on it between day 8 and 14. Now powers of 41 to 55 provinces
   (France, Turkey, Iran: nation.mid) start with 3 more infantry and 1 artillery in the capital and AI powers leave them alone
   for 14 days. France at day 30, units: 12 / 58 / 45 (mean 38) before, 41 / 62 / 53 (mean 52) after; provinces 64 > 73.
   Turkey 70 > 51 and Iran 50 > 42 units are inside the seed-to-seed spread (their wars differ run to run).
   Australia had no oil city (5.7 oil a day). A country with eight or more cities and no oil city now turns the smallest city
   of its most common resource into an oil city: Port Hedland (was materials). Day-1 income oil 5.7 > 16.2, materials
   50.2 > 40.9. An AI power also imports a good its cities produce when its forces use more than they make. Day 30: oil balance
   -6.3 / -13.2 / -13.6 (mean -11.0) before, -4.0 / -1.0 / -11.7 (mean -5.6) after; oil imported 167 / 205 / 319 before,
   0 / 0 / 103 after; no day without oil either way; units 88 > 86.

World gross income a day, three-seed mean, before > after: day 1 oil 510 > 521, materials 348 > 338, the rest unchanged;
day 30 money 3951 > 4036, oil 426 > 444, materials 318 > 334, iron 278 > 278, electronics 79 > 83, rare 119 > 114,
units 1392 > 1460.
