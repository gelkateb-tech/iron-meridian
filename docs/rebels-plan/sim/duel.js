// rebels against a dug-in garrison in a captured city, today's battle rules (owner's +25% dug-in city bonus, holder's defence), 8 cities per match-up
'use strict';
const load = require('./load.js');
const res = {}, T = 8, SEED = 777;
const R0 = load('', 'addArmy, count, NEUTRAL'); const a0 = R0.IM.api; a0.useScenario('world64'); a0.newGame(SEED, 0, []);
const cities = R0.G.P.filter(P => P.city && R0.S.owner[P.id] >= 0 && R0.S.nations[R0.S.owner[P.id]].capital !== P.id && !R0.G.P[P.id].sea).map(P => P.id);
for (const [g, r] of [[1, 3], [2, 3], [3, 3], [1, 4], [2, 4], [3, 4], [4, 4], [2, 5], [3, 5], [4, 5], [5, 5], [3, 6], [4, 6], [6, 6]]){ let win = 0, left = 0, hrs = 0;
  for (let i = 0; i < T; i++){ const R = load('', 'addArmy, count, NEUTRAL, dugIn'), api = R.IM.api; api.useScenario('world64'); api.newGame(SEED + i, 0, []); const S = R.S; S.started = true;
    const p = cities[(i*53 + g*7 + r) % cities.length], B = S.owner[p], A = S.nations.findIndex(N => N.id !== B && N.alive); S.armies = S.armies.filter(a => a.at !== p);
    S.owner[p] = A; S.occ[p] = S.hour; const ga = R.addArmy(A, p, {inf:g}); ga.still = S.hour - 24; ga.m = 80; const ra = R.addArmy(R.NEUTRAL, p, {inf:r}); ra.rebel = true; ra.hold = 0; ra.m = 80;
    let h = 0; for (; h < 300 && R.count(ga) && R.count(ra); h++){ api.tick(); }
    hrs += h; if (R.count(ga) && !R.count(ra)){ win++; left += R.count(ga); } }
  res[g + ' v ' + r] = {win:win + '/' + T, left:win ? +(left/win).toFixed(1) : 0, hours:Math.round(hrs/T)}; }
console.log(JSON.stringify(res));
