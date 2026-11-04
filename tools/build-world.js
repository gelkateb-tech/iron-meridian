// Builds world.js: real-world geography rasterized onto the game's hex grid.
// Sources (public domain / open data): world-atlas (Natural Earth admin-0 countries, 1:50m),
// country-state-city (admin-1 region names and coordinates, used to name provinces).
// Run: NODE_PATH=<dir with node_modules> node tools/build-world.js
'use strict';
const fs = require('fs');
const path = require('path');
const topojson = require('topojson-client');
const d3 = require('d3-geo');
const world = require('world-atlas/countries-50m.json');
const { State, City } = require('country-state-city');

const W = 200, H = 105;
const LON0 = -169;                         // left edge of the map (Pacific split)
const LAT_N = 78, LAT_S = -56;
const miller = lat => 1.25*Math.log(Math.tan(Math.PI/4 + 0.4*lat*Math.PI/180));
const invMiller = y => (2.5*Math.atan(Math.exp(0.8*y)) - 0.625*Math.PI)*180/Math.PI;
const YMAX = miller(LAT_N), YMIN = miller(LAT_S);

const cellLonLat = (c, r) => {
  const x = c + 0.5*(r & 1);
  const lon = LON0 + (x + 0.5)/W*360;
  const y = YMAX - (r/(H - 1))*(YMAX - YMIN);
  return [((lon + 540) % 360) - 180, invMiller(y)];
};
const lonLatToCell = (lon, lat) => {
  const y = miller(lat), r = Math.round((YMAX - y)/(YMAX - YMIN)*(H - 1));
  if (r < 0 || r >= H) return -1;
  let x = ((lon - LON0 + 720) % 360)/360*W - 0.5 - 0.5*(r & 1);
  const c = Math.round(x);
  if (c < 0 || c >= W) return -1;
  return r*W + c;
};
const NB_EVEN = [[1,0],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1]], NB_ODD = [[1,0],[1,-1],[0,-1],[-1,0],[0,1],[1,1]];
const nbr = (i, d) => { const c = i % W, r = (i / W) | 0, o = (r & 1) ? NB_ODD[d] : NB_EVEN[d]; const nc = c + o[0], nr = r + o[1]; return (nc < 0 || nr < 0 || nc >= W || nr >= H) ? -1 : nr*W + nc; };
const cube = i => { const c = i % W, r = (i / W) | 0, q = c - (r - (r & 1))/2; return [q, r, -q - r]; };
const hexDist = (a, b) => { const A = cube(a), B = cube(b); return Math.max(Math.abs(A[0]-B[0]), Math.abs(A[1]-B[1]), Math.abs(A[2]-B[2])); };
function mulberry(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; }; }
const rnd = mulberry(20261104);

// ---- 1. countries -> cells
const feats = topojson.feature(world, world.objects.countries).features.filter(f => f.properties.name !== 'Antarctica');
const bounds = feats.map(f => d3.geoBounds(f));
const N = W*H, cellCountry = new Int16Array(N).fill(-1);
for (let r = 0; r < H; r++) for (let c = 0; c < W; c++){
  const [lon, lat] = cellLonLat(c, r);
  for (let k = 0; k < feats.length; k++){
    const [[x0, y0], [x1, y1]] = bounds[k];
    if (lat < y0 - 0.01 || lat > y1 + 0.01) continue;
    if (x0 <= x1 && (lon < x0 - 0.01 || lon > x1 + 0.01)) continue;
    if (d3.geoContains(feats[k], [lon, lat])){ cellCountry[r*W + c] = k; break; }
  }
}
// drop isolated single land cells of countries that have bigger landmasses elsewhere? keep: islands matter.
const countryCells = feats.map(() => []);
for (let i = 0; i < N; i++) if (cellCountry[i] >= 0) countryCells[cellCountry[i]].push(i);
const countries = feats.map((f, k) => ({ name: f.properties.name, cells: countryCells[k].length }));
const keep = countries.map(c => c.cells > 0);

// ---- 2. cities (curated list of major cities; capitals of the playable powers flagged with *)
const CITIES = `*Washington,38.9,-77.04;New York,40.71,-74.0;Los Angeles,34.05,-118.24;Chicago,41.88,-87.63;Houston,29.76,-95.37;Seattle,47.6,-122.33;Miami,25.76,-80.19;Denver,39.74,-104.99;Atlanta,33.75,-84.39;San Francisco,37.77,-122.42;Anchorage,61.22,-149.9;Dallas,32.78,-96.8;Phoenix,33.45,-112.07;Minneapolis,44.98,-93.27;
*Ottawa,45.42,-75.7;Toronto,43.65,-79.38;Vancouver,49.28,-123.12;Montreal,45.5,-73.57;Calgary,51.05,-114.07;Winnipeg,49.9,-97.14;Halifax,44.65,-63.58;Yellowknife,62.45,-114.37;
Mexico City,19.43,-99.13;Monterrey,25.69,-100.32;Guadalajara,20.66,-103.35;Havana,23.11,-82.37;Bogotá,4.71,-74.07;Caracas,10.48,-66.9;Lima,-12.05,-77.04;Santiago,-33.45,-70.67;Buenos Aires,-34.6,-58.38;*Brasília,-15.79,-47.88;São Paulo,-23.55,-46.63;Rio de Janeiro,-22.91,-43.17;Manaus,-3.12,-60.02;Salvador,-12.97,-38.5;Recife,-8.05,-34.9;Porto Alegre,-30.03,-51.23;Quito,-0.18,-78.47;La Paz,-16.5,-68.15;Montevideo,-34.9,-56.16;Asunción,-25.26,-57.58;Córdoba,-31.42,-64.18;
*London,51.51,-0.13;Edinburgh,55.95,-3.19;Belfast,54.6,-5.93;Manchester,53.48,-2.24;Dublin,53.35,-6.26;*Paris,48.86,2.35;Marseille,43.3,5.37;Lyon,45.76,4.84;Bordeaux,44.84,-0.58;Brest,48.39,-4.49;*Berlin,52.52,13.4;Hamburg,53.55,9.99;Munich,48.14,11.58;Cologne,50.94,6.96;Madrid,40.42,-3.7;Barcelona,41.39,2.17;Lisbon,38.72,-9.14;Rome,41.9,12.5;Milan,45.46,9.19;Naples,40.85,14.27;Amsterdam,52.37,4.9;Brussels,50.85,4.35;Vienna,48.21,16.37;Warsaw,52.23,21.01;Prague,50.08,14.44;Budapest,47.5,19.04;Bucharest,44.43,26.1;Athens,37.98,23.73;Stockholm,59.33,18.07;Oslo,59.91,10.75;Helsinki,60.17,24.94;Copenhagen,55.68,12.57;Kyiv,50.45,30.52;Minsk,53.9,27.56;Belgrade,44.79,20.45;Sofia,42.7,23.32;Reykjavík,64.15,-21.94;Nuuk,64.18,-51.72;
*Moscow,55.76,37.62;Saint Petersburg,59.93,30.36;Murmansk,68.97,33.08;Arkhangelsk,64.54,40.54;Kazan,55.8,49.1;Volgograd,48.71,44.51;Rostov,47.24,39.71;Yekaterinburg,56.84,60.6;Novosibirsk,55.03,82.92;Omsk,54.99,73.37;Krasnoyarsk,56.01,92.85;Irkutsk,52.29,104.3;Yakutsk,62.03,129.73;Khabarovsk,48.48,135.08;Vladivostok,43.12,131.89;Norilsk,69.35,88.2;Magadan,59.56,150.8;Petropavlovsk,53.04,158.65;Anadyr,64.73,177.5;
*Ankara,39.93,32.86;Istanbul,41.01,28.98;Izmir,38.42,27.14;Diyarbakır,37.91,40.24;*Tehran,35.69,51.39;Mashhad,36.3,59.6;Isfahan,32.65,51.67;Tabriz,38.08,46.29;Shiraz,29.59,52.58;Baghdad,33.31,44.36;Damascus,33.51,36.28;Riyadh,24.71,46.68;Jeddah,21.49,39.19;Dubai,25.2,55.27;Muscat,23.59,58.41;Sana'a,15.37,44.19;Kabul,34.56,69.21;Karachi,24.86,67.0;Lahore,31.55,74.34;Islamabad,33.68,73.05;Tashkent,41.3,69.24;Almaty,43.24,76.89;Astana,51.17,71.45;Baku,40.41,49.87;
*Cairo,30.04,31.24;Alexandria,31.2,29.92;Aswan,24.09,32.9;Tripoli,32.89,13.19;Tunis,36.81,10.18;Algiers,36.75,3.06;Casablanca,33.57,-7.59;Dakar,14.72,-17.47;Lagos,6.52,3.38;Abuja,9.08,7.4;Kinshasa,-4.44,15.27;Nairobi,-1.29,36.82;Addis Ababa,9.03,38.74;Khartoum,15.5,32.56;Luanda,-8.84,13.23;Dar es Salaam,-6.79,39.21;*Pretoria,-25.75,28.19;Cape Town,-33.92,18.42;Durban,-29.86,31.02;Antananarivo,-18.88,47.51;Accra,5.6,-0.19;Bamako,12.64,-8.0;N'Djamena,12.13,15.05;Lusaka,-15.39,28.32;Harare,-17.83,31.05;Mogadishu,2.05,45.32;Windhoek,-22.56,17.08;Niamey,13.51,2.13;
*New Delhi,28.61,77.21;Mumbai,19.08,72.88;Kolkata,22.57,88.36;Chennai,13.08,80.27;Bangalore,12.97,77.59;Hyderabad,17.39,78.49;Ahmedabad,23.02,72.57;Dhaka,23.81,90.41;Colombo,6.93,79.86;Kathmandu,27.72,85.32;
*Beijing,39.9,116.4;Shanghai,31.23,121.47;Guangzhou,23.13,113.26;Chengdu,30.57,104.07;Wuhan,30.59,114.31;Xi'an,34.34,108.94;Harbin,45.8,126.53;Shenyang,41.8,123.43;Ürümqi,43.83,87.62;Lhasa,29.65,91.17;Kunming,25.04,102.71;Lanzhou,36.06,103.83;Hohhot,40.84,111.75;Ulaanbaatar,47.89,106.91;Taipei,25.03,121.57;Seoul,37.57,126.98;Pyongyang,39.04,125.76;Kashgar,39.47,75.99;
*Tokyo,35.68,139.69;Osaka,34.69,135.5;Sapporo,43.06,141.35;Fukuoka,33.59,130.4;Sendai,38.27,140.87;
Bangkok,13.76,100.5;Hanoi,21.03,105.85;Ho Chi Minh City,10.82,106.63;Yangon,16.87,96.2;Kuala Lumpur,3.14,101.69;Jakarta,-6.2,106.85;Surabaya,-7.25,112.75;Medan,3.6,98.67;Makassar,-5.15,119.43;Manila,14.6,120.98;Davao,7.19,125.46;Port Moresby,-9.44,147.18;Jayapura,-2.53,140.72;
*Canberra,-35.28,149.13;Sydney,-33.87,151.21;Melbourne,-37.81,144.96;Brisbane,-27.47,153.03;Perth,-31.95,115.86;Adelaide,-34.93,138.6;Darwin,-12.46,130.84;Alice Springs,-23.7,133.88;Cairns,-16.92,145.77;Port Hedland,-20.31,118.6;Auckland,-36.85,174.76;Wellington,-41.29,174.78;Hobart,-42.88,147.33`
  .split(';').map(s => s.trim()).filter(Boolean).map(s => { const cap = s[0] === '*'; const [n, la, lo] = (cap ? s.slice(1) : s).split(','); return { name: n, lat: +la, lon: +lo, cap }; });
function snapLand(cell){
  if (cell < 0) return -1;
  if (cellCountry[cell] >= 0) return cell;
  let best = -1, bd = 9;
  for (let i = 0; i < N; i++) if (cellCountry[i] >= 0){ const d = hexDist(i, cell); if (d < bd){ bd = d; best = i; } }
  return bd <= 2 ? best : -1;
}
for (const ct of CITIES) ct.cell = snapLand(lonLatToCell(ct.lon, ct.lat));

// ---- 3. region names
const CLEAN = [/^(London Borough of|Royal Borough of|Metropolitan Borough of|County Borough of) /i, / (Prefecture|Province|Region|Governorate|District|Council|Borough|County|Municipality|Department|Oblast|Krai|Autonomous Okrug|Autonomous Region|Autonomous Oblast|Republic|State|Territory)$/i, /^(Province|Region|Governorate|State|Republic) of /i, /^City of /i];
const cleanName = n => { let s = n; for (let k = 0; k < 2; k++) for (const re of CLEAN) s = s.replace(re, ''); return s.trim() || n; };
const allStates = State.getAllStates().filter(s => s.latitude && s.longitude);
const regions0 = allStates.map(s => ({ name: cleanName(s.name), code: s.countryCode, cell: lonLatToCell(+s.longitude, +s.latitude) })).filter(s => s.cell >= 0 && cellCountry[s.cell] >= 0);
// each map country's ISO code = the most common code among regions landing in it; drop regions with mismatched codes (bad source coordinates)
const featCode = feats.map((f, k) => { const c = {}; for (const s of regions0) if (cellCountry[s.cell] === k) c[s.code] = (c[s.code] || 0) + 1; let b = null, bn = 0; for (const x in c) if (c[x] > bn){ bn = c[x]; b = x; } return b; });
const regions = regions0.filter(s => featCode[cellCountry[s.cell]] === s.code);
const regionsByCountry = feats.map(() => []);
for (const s of regions) regionsByCountry[cellCountry[s.cell]].push(s);
// put each city in its own country: its country is that of the nearest region point
for (const ct of CITIES){
  let best = null, bd = 1e9; for (const s of allStates){ const d = (+s.latitude - ct.lat)**2 + ((+s.longitude - ct.lon)*Math.cos(ct.lat*Math.PI/180))**2; if (d < bd){ bd = d; best = s; } }
  const code = best && best.countryCode, c0 = lonLatToCell(ct.lon, ct.lat);
  if (!code || c0 < 0) continue;
  if (ct.cell >= 0 && featCode[cellCountry[ct.cell]] === code) continue;
  let pick = -1, pd = 4; for (let i = 0; i < N; i++) if (cellCountry[i] >= 0 && featCode[cellCountry[i]] === code){ const d = hexDist(i, c0); if (d < pd){ pd = d; pick = i; } }
  if (pick >= 0) ct.cell = pick;
}

// ---- 4. provinces per country
const prov = new Int16Array(N).fill(-1);
const provinces = [];   // {name, country, city, cap, cells:[]}
const compass = (from, to) => { const A = cube(from), B = cube(to); const dx = (B[0] + B[1]/2) - (A[0] + A[1]/2), dy = B[1] - A[1]; return Math.abs(dx) > Math.abs(dy)*1.2 ? (dx > 0 ? 'East' : 'West') : (dy > 0 ? 'South' : 'North'); };
// population proxy: number of known towns per cell (148k places), smoothed over neighbours
const dens0 = new Float32Array(N);
const townAt = new Array(N).fill(null);
for (const c of City.getAllCities()){ const cell = lonLatToCell(+c.longitude, +c.latitude); if (cell >= 0 && cellCountry[cell] >= 0){ dens0[cell] += 1; if (!townAt[cell] && c.name.length <= 16 && /^[A-Za-z' .-]+$/.test(c.name)) townAt[cell] = c.name; } }
const dens = new Float32Array(N); for (let i = 0; i < N; i++){ let sum = dens0[i], n = 1; for (let d = 0; d < 6; d++){ const m = nbr(i, d); if (m >= 0){ sum += dens0[m]*0.5; n += 0.5; } } dens[i] = sum/n; }
// province spacing: ~2 cells in dense lands, up to 7 in empty ones
const spacing = c => Math.max(2, Math.min(7, 6.6 - 1.5*Math.log(1 + dens[c])));
for (let k = 0; k < feats.length; k++){
  const cells = countryCells[k]; if (!cells.length) continue;
  const seeds = [];  // {cell, name, city, cap}
  const farEnough = (c, minD) => seeds.every(s => hexDist(s.cell, c) >= minD);
  for (const ct of CITIES) if (ct.cell >= 0 && cellCountry[ct.cell] === k && farEnough(ct.cell, Math.min(3, spacing(ct.cell)))) seeds.push({ cell: ct.cell, city: ct.name, cap: ct.cap });
  const regs = regionsByCountry[k].slice();
  const nearestRegion = c => { let best = null, bd = 1e9; for (const s of regs){ const d = hexDist(s.cell, c); if (d < bd){ bd = d; best = s; } } return best; };
  // densest places first, each needing its local spacing from every seed
  const order = cells.slice().sort((a, b) => (dens[b] + rnd()*0.8) - (dens[a] + rnd()*0.8));
  for (const c of order){ const r = spacing(c); if (seeds.every(s => hexDist(s.cell, c) >= Math.max(r, Math.min(3, spacing(s.cell))))) seeds.push({ cell: c }); }
  if (!seeds.length) seeds.push({ cell: cells[Math.floor(cells.length/2)] });
  // every playable country gets enough provinces to manoeuvre: fill farthest-point to ~1 per 14 cells
  const meanD = cells.reduce((a, c) => a + dens[c], 0)/cells.length;
  const minSeeds = Math.min(Math.floor(cells.length/3), Math.max(2, Math.round(Math.sqrt(cells.length)*0.8*Math.min(1, 0.2 + meanD*3))));
  while (seeds.length < minSeeds){
    let best = -1, bv = 2; for (const c of cells){ const v = seeds.reduce((m, sd) => Math.min(m, hexDist(sd.cell, c)), 1e9) + rnd()*0.3; if (v > bv){ bv = v; best = c; } }
    if (best < 0) break; seeds.push({ cell: best });
  }
  const base = provinces.length;
  const usedNames = new Map();
  const PRE = ['Upper', 'Lower', 'Central', 'Greater', 'Inner', 'Outer', 'Coastal', 'Highland'];
  const uniq = (name, cell) => {
    if (!usedNames.has(name)) return name;
    const alt = `${compass(usedNames.get(name), cell)} ${name.replace(/^(North|South|East|West) /, '')}`; if (!usedNames.has(alt)) return alt;
    for (const pre of PRE){ const a = `${pre} ${name.replace(/^(North|South|East|West) /, '')}`; if (!usedNames.has(a)) return a; }
    let bt = null, bd = 1e9; for (let i = 0; i < N; i++) if (townAt[i] && cellCountry[i] === k && !usedNames.has(townAt[i])){ const d = hexDist(i, cell); if (d < bd){ bd = d; bt = townAt[i]; } }
    if (bt) return bt;
    for (const suf of ['Reach', 'March', 'Frontier', 'Expanse', 'Wilds', 'Steppe']){ const a = `${name} ${suf}`; if (!usedNames.has(a)) return a; }
    return `${name} ${usedNames.size}`;
  };
  // seeds with a real city take names first; others prefer the nearest region not yet used
  const order2 = seeds.map((s, i) => i).sort((a, b) => (seeds[b].city ? 1 : 0) - (seeds[a].city ? 1 : 0));
  const named = new Array(seeds.length);
  for (const i of order2){
    const s = seeds[i];
    let reg = null, bd = 1e9; for (const r of regs){ if (usedNames.has(r.name)) continue; const d = hexDist(r.cell, s.cell); if (d < bd){ bd = d; reg = r; } }
    if (!reg || bd > 5){ reg = nearestRegion(s.cell); }
    let name = reg ? reg.name : countries[k].name;
    if (reg && hexDist(reg.cell, s.cell) > 5 && !usedNames.has(name)) name = name; 
    name = uniq(name, s.cell);
    usedNames.set(name, s.cell); named[i] = name;
  }
  seeds.forEach((s, i) => {
    const name = named[i];
    provinces.push({ name, country: k, city: s.city || null, cap: !!s.cap, cells: [] });
    prov[s.cell] = base + i;
  });
  // grow within the country
  let frontier = seeds.map(s => s.cell);
  while (frontier.length){
    const next = [];
    for (const c of frontier) for (let d = 0; d < 6; d++){ const m = nbr(c, d); if (m >= 0 && cellCountry[m] === k && prov[m] < 0){ prov[m] = prov[c]; next.push(m); } }
    frontier = next;
  }
  // unreached islands of this country
  for (const c of cells) if (prov[c] < 0){
    const comp = [c]; prov[c] = -2;
    for (let h = 0; h < comp.length; h++) for (let d = 0; d < 6; d++){ const m = nbr(comp[h], d); if (m >= 0 && cellCountry[m] === k && prov[m] === -1){ prov[m] = -2; comp.push(m); } }
    // small islands join the nearest province of the same country instead of becoming "Name 17"
    if (comp.length < 5 && seeds.length){ let bs = -1, bd = 1e9; seeds.forEach((sd, si) => { const d = hexDist(sd.cell, c); if (d < bd){ bd = d; bs = si; } });
      if (bd <= 10){ for (const m of comp) prov[m] = base + bs; continue; } }
    const reg = nearestRegion(c);
    let name = reg ? reg.name : countries[k].name; if (usedNames.has(name)) name = name + ' Isles'; name = uniq(name, c);
    usedNames.set(name, c);
    const city = CITIES.find(ct => comp.includes(ct.cell));
    provinces.push({ name, country: k, city: city ? city.name : null, cap: city ? city.cap : false, cells: [] });
    for (const m of comp) prov[m] = provinces.length - 1;
  }
}
for (let i = 0; i < N; i++) if (prov[i] >= 0) provinces[prov[i]].cells.push(i);
// any city inside a province that did not get one
for (const ct of CITIES) if (ct.cell >= 0 && prov[ct.cell] >= 0){ const p = provinces[prov[ct.cell]]; if (!p.city){ p.city = ct.name; p.cap = ct.cap; } else if (ct.cap && !p.cap){ p.city = ct.name; p.cap = true; } }

// ---- 5. sea zones
const water = []; for (let i = 0; i < N; i++) if (cellCountry[i] < 0) water.push(i);
const seaSeeds = [];
const order = water.slice().sort(() => rnd() - 0.5);
for (const minD of [7, 5]) for (const c of order){ if (seaSeeds.length >= Math.round(water.length/50)) break; if (seaSeeds.every(s => hexDist(s, c) >= minD)) seaSeeds.push(c); }
const seaBase = provinces.length;
const SEAS = [ // [name, lonMin, lonMax, latMin, latMax]
  ['Mediterranean Sea', -6, 36, 30, 46], ['Black Sea', 27, 42, 40.5, 47.5], ['Caspian Sea', 46, 55, 36, 47.5], ['Red Sea', 32, 44, 12, 30], ['Persian Gulf', 47, 57, 23, 31],
  ['Baltic Sea', 9, 31, 53, 66], ['North Sea', -4, 9, 51, 61], ['Norwegian Sea', -10, 16, 61, 72], ['Barents Sea', 16, 60, 68, 80], ['Kara Sea', 60, 100, 68, 80],
  ['Laptev Sea', 100, 140, 70, 80], ['East Siberian Sea', 140, 180, 68, 80], ['Bering Sea', 162, 200, 51, 66], ['Sea of Okhotsk', 135, 162, 43, 62], ['Sea of Japan', 127, 142, 33, 52],
  ['East China Sea', 117, 131, 23, 34], ['Yellow Sea', 117, 127, 34, 41], ['South China Sea', 99, 121, 0, 23], ['Philippine Sea', 121, 145, 5, 30], ['Java Sea', 105, 120, -9, -2],
  ['Banda Sea', 120, 135, -9, 0], ['Arafura Sea', 130, 142, -12, -6], ['Coral Sea', 142, 165, -30, -9], ['Tasman Sea', 147, 175, -48, -30], ['Bay of Bengal', 79, 99, 5, 23],
  ['Arabian Sea', 50, 77, 5, 26], ['Gulf of Mexico', -98, -80, 18, 31], ['Caribbean Sea', -88, -60, 9, 22], ['Hudson Bay', -95, -75, 51, 66], ['Labrador Sea', -65, -44, 52, 66],
  ['Baffin Bay', -80, -55, 66, 80], ['Gulf of Alaska', -160, -130, 52, 62], ['Gulf of Guinea', -10, 10, -6, 6], ['Mozambique Channel', 35, 50, -26, -10], ['Greenland Sea', -25, 10, 70, 80],
  ['Beaufort Sea', -160, -120, 68, 80],
];
function seaName(cell){
  const [lon, lat] = cellLonLat(cell % W, (cell / W) | 0);
  for (const [n, a, b, c, d] of SEAS){ const L = lon < a && lon + 360 <= b ? lon + 360 : lon; if (L >= a && L <= b && lat >= c && lat <= d) return n; }
  let ocean = (lon > -70 && lon < 20) ? 'Atlantic' : (lon >= 20 && lon < 120 && lat < 25) ? 'Indian Ocean' : 'Pacific';
  if (lat > 66) return 'Arctic Ocean';
  if (lat < -45) return 'Southern Ocean';
  if (ocean === 'Indian Ocean') return lat > -15 ? 'North Indian Ocean' : 'South Indian Ocean';
  const ns = lat > 30 ? 'North ' : lat < -10 ? 'South ' : 'Central ';
  return ns + ocean;
}
const seaNames = new Map();
seaSeeds.forEach((s, i) => {
  let nm = seaName(s); const n = (seaNames.get(nm) || 0) + 1; seaNames.set(nm, n);
  provinces.push({ name: nm, country: -1, sea: true, cells: [], _n: n });
  prov[s] = seaBase + i;
});
let fr = seaSeeds.slice();
while (fr.length){ const next = []; for (const c of fr) for (let d = 0; d < 6; d++){ const m = nbr(c, d); if (m >= 0 && cellCountry[m] < 0 && prov[m] < 0){ prov[m] = prov[c]; next.push(m); } } fr = next; }
// enclosed water with no seed (small lakes) -> merge into neighbouring land province
for (let i = 0; i < N; i++) if (prov[i] < 0){
  for (let d = 0; d < 6; d++){ const m = nbr(i, d); if (m >= 0 && prov[m] >= 0 && !provinces[prov[m]].sea){ prov[i] = prov[m]; cellCountry[i] = provinces[prov[m]].country; break; } }
}
for (let i = 0; i < N; i++) if (prov[i] < 0){ for (let d = 0; d < 6; d++){ const m = nbr(i, d); if (m >= 0 && prov[m] >= 0){ prov[i] = prov[m]; break; } } }
for (const p of provinces) p.cells = [];
for (let i = 0; i < N; i++) if (prov[i] >= 0) provinces[prov[i]].cells.push(i);
// number duplicate sea names
const seaCount = new Map(); for (const p of provinces) if (p.sea) seaCount.set(p.name, (seaCount.get(p.name) || 0) + 1);
const roman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
for (const p of provinces) if (p.sea && seaCount.get(p.name) > 1) p.name = `${p.name} ${roman[p._n] || p._n}`;
// drop empty provinces (seed overwritten) by remapping ids
const remap = new Int32Array(provinces.length).fill(-1); const finalP = [];
provinces.forEach((p, i) => { if (p.cells.length){ remap[i] = finalP.length; finalP.push(p); } });
for (let i = 0; i < N; i++) prov[i] = prov[i] >= 0 ? remap[prov[i]] : -1;

// ---- 6. encode
const enc = n => n < 0 ? '..' : n.toString(36).padStart(2, '0');
let cellStr = ''; for (let i = 0; i < N; i++) cellStr += enc(prov[i]);
const usedCountries = [...new Set(finalP.filter(p => !p.sea).map(p => p.country))].sort((a, b) => a - b);
const cIndex = new Map(usedCountries.map((k, i) => [k, i]));
const out = {
  W, H, lon0: LON0, latN: LAT_N, latS: LAT_S,
  countries: usedCountries.map(k => countries[k].name),
  provinces: finalP.map(p => p.sea ? [p.name, -1, 0, ''] : [p.name, cIndex.get(p.country), (p.city ? 1 : 0) | (p.cap ? 2 : 0), p.city || '']),
  cells: cellStr,
};
const file = path.join(__dirname, '..', 'world.js');
fs.writeFileSync(file, `// Generated by tools/build-world.js from Natural Earth (public domain) and country-state-city (open data).\nwindow.WORLD = ${JSON.stringify(out)};\n`);
const land = finalP.filter(p => !p.sea).length, sea = finalP.length - land;
console.log(`provinces: ${land} land + ${sea} sea = ${finalP.length}; countries ${usedCountries.length}; cities ${finalP.filter(p => p.city).length}; file ${(fs.statSync(file).size/1024).toFixed(0)} KB`);
const missingCaps = CITIES.filter(c => c.cap && !finalP.some(p => p.cap && p.city === c.name)).map(c => c.name);
console.log('capitals missing:', missingCaps.join(', ') || 'none');
