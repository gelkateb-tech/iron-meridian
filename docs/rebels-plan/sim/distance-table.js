// distance table for the plan: homeland examples (from dist.json) and occupied examples (a capital to a foreign city)
const fs = require('fs'), R = require('./load.js')('', 'WORLD_W, legHours, ownedBy');
const api = R.IM.api; api.useScenario('world64'); api.newGame(12345, 0, []); const S = R.S, G = R.G;
const lonOf = P => ((P.x/R.WORLD_W*360 + window.WORLD.lon0) % 360 + 540) % 360 - 180;
const gc = (A, B) => { const r = Math.PI/180, la1 = A.lat*r, la2 = B.lat*r, dl = (lonOf(B) - lonOf(A))*r; const h = Math.sin((la2 - la1)/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dl/2)**2; return 2*6371*Math.asin(Math.min(1, Math.sqrt(h))); };
const D = JSON.parse(fs.readFileSync(__dirname + '/dist.json', 'utf8').split('\n')[1]);
const pick = {Russia:['Saint Petersburg', 'Kazan', 'Yekaterinburg', 'Novosibirsk', 'Irkutsk', 'Vladivostok'], 'United States':['New York', 'Chicago', 'Miami', 'Dallas', 'Denver', 'Los Angeles', 'Seattle', 'Anchorage'],
  China:['Shanghai', 'Guangzhou', 'Chengdu', 'Ürümqi', 'Lhasa', 'Kashgar'], France:['Lyon', 'Marseille', 'Brest', 'Cayenne'], Brazil:['São Paulo', 'Manaus', 'Porto Alegre'], Canada:['Toronto', 'Winnipeg', 'Vancouver', "St. John's"],
  Australia:['Sydney', 'Perth', 'Darwin', 'Hobart'], India:['Mumbai', 'Kolkata', 'Chennai'], Indonesia:['Surabaya', 'Medan', 'Makassar', 'Jayapura'], 'United Kingdom':['Edinburgh', 'Belfast'], Germany:['Munich', 'Cologne'], Japan:['Osaka', 'Fukuoka', 'Sapporo'], Chile:['Punta Arenas']};
const pen = (km, u) => -5*Math.round(km/u), penH = h => h < 0 ? null : -5*Math.round(h/48);
const rows = [];
for (const [n, cs] of Object.entries(pick)) for (const c of cs){ const r = D.find(x => x.nation === n && x.city === c); if (!r) { rows.push([n, c, 'missing']); continue; } rows.push([n, c, r.km, pen(r.km, 1000), pen(r.km, 1500), r.marchH, penH(r.marchH), r.hops]); }
console.log('HOME'); for (const r of rows) console.log(r.join(' | '));
const occ = [['Poland', 'Dresden'], ['Poland', 'Berlin'], ['Germany', 'Paris'], ['Russia', 'Kyiv'], ['Russia', 'Berlin'], ['Russia', 'Warsaw'], ['United States', 'Havana'], ['United States', 'Baghdad'], ['China', 'Hanoi'], ['China', 'Seoul'], ['Iran', 'Baghdad'], ['India', 'Lahore'], ['Turkey', 'Damascus'], ['Japan', 'Seoul'], ['Brazil', 'Buenos Aires'], ['Egypt', 'Tripoli']];
console.log('OCC');
for (const [n, c] of occ){ const N = S.nations.find(x => x.name === n), P = G.P.find(x => x.cityName === c); if (!N || !P){ console.log(n, c, 'missing'); continue; } const km = Math.round(gc(G.P[N.capital], P)); console.log([n, c, km, pen(km, 1000), pen(km, 1500)].join(' | ')); }
