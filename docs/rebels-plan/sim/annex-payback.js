// a city's full output by size band (home city, morale 100, no Arms Industry), money plus goods at the world base price; and the annex payback
const R = require('./load.js')('', 'provYield, popOf, MKT_BASE, RES_K, income, ownedBy');
const api = R.IM.api; api.useScenario('world64'); api.newGame(12345, 0, []); const S = R.S, G = R.G;
const band = pp => pp >= 20 ? 3 : pp >= 5 ? 2 : pp >= 1.5 ? 1 : 0, NM = ['town (<1.5M)', 'city (1.5-5M)', 'large (5-20M)', 'metropolis (20M+)'];
const B = [0, 1, 2, 3].map(() => ({n:0, cash:0, goods:0, mp:0, list:[]}));
for (const P of G.P){ if (!P.city || S.owner[P.id] < 0) continue; const y = R.provYield(P.id), b = B[band(R.popOf(P.id))]; let g = 0; for (const k of ['oil', 'metal', 'iron', 'elec', 'rare']) g += y[k]/R.RES_K*R.MKT_BASE[k];
  // (a nation's own multipliers, boost and administration, are left out: the city's own yield)
  b.n++; b.cash += y.cash; b.goods += g; b.mp += y.mp; if (b.list.length < 4 && Math.random() < 0.05) b.list.push(P.cityName); }
const occF = m => 0.25*(0.45 + 0.55*m/100), anxF = m => 0.5*(0.45 + 0.55*m/100);
const COST = {A:[[30, 5, 2], [45, 8, 3], [70, 12, 4], [110, 20, 5]], B:[[50, 10, 3], [80, 15, 4], [120, 25, 5], [180, 40, 6]], C:[[90, 15, 4], [140, 25, 5], [210, 40, 6], [320, 60, 7]]};
const out = B.map((b, i) => { const cash = b.cash/b.n, goods = b.goods/b.n, mp = b.mp/b.n, val = cash + goods, gain = val*(anxF(65) - occF(50)), gainMp = mp*(anxF(65) - occF(50));
  return {band:NM[i], cities:b.n, cash:+cash.toFixed(1), goods:+goods.toFixed(1), value:+val.toFixed(1), mp:+mp.toFixed(2), occ50:+(val*occF(50)).toFixed(1), anx65:+(val*anxF(65)).toFixed(1), gain:+gain.toFixed(1), gainMp:+gainMp.toFixed(2),
    payback:Object.fromEntries(Object.entries(COST).map(([k, c]) => [k, {cash:c[i][0], mp:c[i][1], days:c[i][2], payDays:+(c[i][0]/gain).toFixed(0), mpDays:+(c[i][1]/gainMp).toFixed(0)}]))}; });
console.log(JSON.stringify(out, null, 1));
const inc = S.nations.filter(N => N.alive).map(N => R.income(N.id)); console.log('median gross cash', inc.map(i => i.gross.cash).sort((a, b) => a - b)[34].toFixed(0), 'median gross mp', inc.map(i => i.gross.mp).sort((a, b) => a - b)[34].toFixed(1), 'median stock cash/mp', S.nations.map(N => N.cash).sort((a, b) => a - b)[34], S.nations.map(N => N.mp).sort((a, b) => a - b)[34]);
