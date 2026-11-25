// the whole nations world under today's rule ('now') or the plan ('plan'), computer players only: income, land, risings, morale by kind
//   node sim-world.js now|plan [days] [seed] [key=value ...]   (keys: km troop curve annex annexAI noMob)
'use strict';
const load = require('./load.js'), mk = require('./overlay.js');
const VAR = process.argv[2] || 'plan', DAYS = +(process.argv[3] || 30), SEED = +(process.argv[4] || 12345);
const kv = Object.fromEntries(process.argv.slice(5).map(s => s.split('=')).map(([k, v]) => [k, v === 'true' ? true : v === 'false' ? false : isNaN(+v) ? v : +v]));
const O = mk(kv), R = VAR === 'plan' ? load(O.overlay, O.expose, O.patches) : load('', 'income, ownedBy, provYield, popOf, moraleOf, score');
const api = R.IM.api; api.useScenario('world64'); api.newGame(SEED, 0, []); const S = R.S, G = R.G; S.started = true;
let caps = 0, capsFree = 0; R.IM.on('fxCapture', (p, O2, prev) => { if (O2 >= 0){ caps++; if (prev < 0) capsFree++; } });
const t0 = Date.now(), rows = [];
const snap = d => { const al = S.nations.filter(N => N.alive); let cash = 0, mp = 0, prov = 0; for (const N of al){ const i = R.income(N.id); cash += i.gross.cash; mp += i.gross.mp; prov += R.ownedBy(N.id).length; }
  const kinds = {home:[0, 0], occ:[0, 0], anx:[0, 0]}, cityK = {home:[0, 0], occ:[0, 0], anx:[0, 0]};
  if (VAR === 'plan') for (let p = 0; p < G.P.length; p++){ if (G.P[p].sea || S.owner[p] < 0) continue; const k = R.occSt(p); if (!kinds[k]) continue; kinds[k][0] += R.moraleOf ? 0 : 0; kinds[k][0] += S.mor ? S.mor[p] : 70; kinds[k][1]++; if (G.P[p].city){ cityK[k][0] += S.mor ? S.mor[p] : 70; cityK[k][1]++; } }
  const av = x => x[1] ? (x[0]/x[1]).toFixed(1) + ' (' + x[1] + ')' : '-';
  rows.push({d, alive:al.length, cash:Math.round(cash), mp:Math.round(mp), prov, caps, capsFree, mor:VAR === 'plan' ? {home:av(kinds.home), occ:av(kinds.occ), anx:av(kinds.anx), cityHome:av(cityK.home), cityOcc:av(cityK.occ), cityAnx:av(cityK.anx)} : null,
    rb:VAR === 'plan' ? {rise:R.RBST.rise, empty:R.RBST.riseEmpty, fight:R.RBST.riseFight, won:R.RBST.fightsWon, lost:R.RBST.fightsLost, flipped:R.RBST.flipped, fH:R.RBST.flipsHome, fA:R.RBST.flipsAnx, fO:R.RBST.flipsOcc, annexStart:R.RBST.annexStart, annexDone:R.RBST.annexDone, annexLost:R.RBST.annexLost, rolls:R.RBST.rolls, meanChance:R.RBST.rolls ? +(R.RBST.chanceSum/R.RBST.rolls).toFixed(3) : 0} : null}); };
snap(0);
for (let h = 1; h <= DAYS*24 && !S.over; h++){ for (let q = 0; q < api.BATTLE_Q; q++) api.tickQ(); if (h % 24 === 1 && [1, 2, 5, 10, 15, 20, 30, 45, 60].includes((h - 1)/24)) snap((h - 1)/24); }
snap(DAYS + '.end');
console.log(JSON.stringify({VAR, SEED, DAYS, cfg:VAR === 'plan' ? O.cfg : null, secs:((Date.now() - t0)/1000).toFixed(0), rows}, null, 0));
