// Point 11: occupying a trade partner against occupying a non-partner, 30 days, the real rules plus the plan (overlay.js).
// Attacker A (a seat that gives no other orders) declares war on V on day 2 and takes V's nearest non-capital cities (2 on day 3, 2 on day 6),
// leaving a garrison of 6 infantry in each (enough that no rebels rise: troop rule 'size'). V's computer turn is off (no counter-attack).
//   node sim-trade.js A V partner|none trade11(A|B|C) annex(0|1) [days] [seed] [cities]
'use strict';
const load = require('./load.js'), mk = require('./overlay.js');
const [An, Vn, MODE = 'partner', T11 = 'A', ANX = '0', DAYS0 = '30', SEED0 = '12345', NC = '4', EFFW = '0'] = process.argv.slice(2);
const DAYS = +DAYS0, SEED = +SEED0, NCITY = +NC;
const SKIP = "let SKIP_AI = -1; for (const nm of ['aiTurn', 'aiAir', 'aiMissiles', 'aiSpies', 'aiCapBase']) eval(nm + ' = (f => function(n){ if (n === SKIP_AI) return; return f.apply(this, arguments); })(' + nm + ')');";
const O = mk({trade11:T11, annexAI:false, effW:EFFW === '1'}), R = load(O.overlay + SKIP, O.expose + ', tradeClose, trS, tradeGen, MKT_BASE, setSkip:v => { SKIP_AI = v; }', O.patches);
const api = R.IM.api; api.useScenario('world64');
const pre = R.IM.api; let S, G;
// find the nations by name on a scratch game first (the seat's index)
{ api.newGame(SEED, 0, []); }
S = R.S; G = R.G; const A = S.nations.findIndex(N => N.name === An), V = S.nations.findIndex(N => N.name === Vn);
api.newGame(SEED, 0, [A]); S = R.S; G = R.G; S.started = true; R.setSkip(V);
// V does not fight back (its computer turn is skipped); everything else plays as usual
{ const f = R.aiTurn; void f; }
const SRC_OFF = new Set([V]);
const IMs = R.IM; const origTick = api.tickQ;
// (aiTurn is called by name inside the rules: skip V by giving it no armies to move: its forces stay home and are not in the taken cities)
const routeAV = () => S.trade && S.trade.routes.find(r => (r.a === A && r.b === V) || (r.a === V && r.b === A));
const val = (o, cashK = 'cash') => { const M = R.mkt(); let v = o[cashK] || 0; for (const k of ['oil', 'metal', 'iron', 'elec', 'rare']) v += (o[k] || 0)/R.RES_K*M.p[k]; return v; };
const rows = [], targets = [];
const tickDay = () => { for (let h = 0; h < 24; h++) for (let q = 0; q < api.BATTLE_Q; q++) api.tickQ(); };
let note = '';
for (let d = 1; d <= DAYS; d++){
  if (d === 1){ // day 1: the partner case keeps the A-V route; the non-partner case closes it (the freed slot goes to another partner the next day)
    const r = routeAV(); note += `day1 route A-V: ${r ? r.kind + ' $' + R.trSide(r, A).cash : 'none'}; `;
    if (MODE === 'none' && r) R.tradeClose(A, r.id);
    if (MODE === 'partner' && !r) note += 'NO ROUTE TO BEGIN WITH; ';
  }
  if (d === 2 && MODE !== 'peace'){ R.declareWar(A, V);
    const cap = S.nations[V].capital, Ac = S.nations[A].capital;
    targets.push(...G.P.filter(P => P.city && S.owner[P.id] === V && P.id !== cap).map(P => P.id).sort((x, y) => R.gcKm(x, Ac) - R.gcKm(y, Ac)).slice(0, NCITY)); }
  if ((d === 3 || d === 6) && MODE !== 'waronly' && MODE !== 'peace') for (const p of (d === 3 ? targets.slice(0, 2) : targets.slice(2))){
    for (const a of S.armies) if (a.owner === V && a.at === p){ a.at = S.nations[V].capital; a.to = null; a.path = []; }   // (V's troops leave the city first: no battle)
    R.capture(p, A); const g = R.addArmy(A, p, {inf:6}); g.m = 80;
    for (const v of G.P[p].nbs) if (!G.P[v].sea && !G.P[v].city && S.owner[v] === V){ for (const a of S.armies) if (a.owner === V && a.at === v){ a.at = S.nations[V].capital; a.to = null; a.path = []; } R.capture(v, A); }   // (and the countryside around it)
    if (ANX === '1') { const ok = R.annexStart(A, p); note += `annex ${G.P[p].cityName} ${ok ? 'started' : 'NOT affordable'} d${d}; `; } }
  // V's forces stay out of A's land: send any that wander in back home
  for (const a of S.armies) if (a.owner === V && S.owner[a.at] === A){ a.at = S.nations[V].capital; a.to = null; a.path = []; }
  tickDay();
  const i = R.income(A), t = i.trade, occ = targets.filter(p => S.owner[p] === A);
  let occY = {cash:0, oil:0, metal:0, iron:0, elec:0, rare:0, mp:0}; for (const p of occ){ const y = R.provYield(p); for (const k in occY) occY[k] += y[k]*i.eff; }
  rows.push({d, eff:+i.eff.toFixed(3), gross:+i.gross.cash.toFixed(1), grossVal:+val(i.gross).toFixed(1), net:+i.net.cash.toFixed(1), netVal:+val(i.net).toFixed(1), trade:+t.cash.toFixed(1), tradeVal:+val(t).toFixed(1), routes:t.n, shock:t.shock ? 1 : 0,
    occCities:occ.length, occCash:+occY.cash.toFixed(2), occVal:+val(occY).toFixed(2), occMp:+occY.mp.toFixed(2), mor:occ.map(p => Math.round(S.mor[p])), st:occ.map(p => R.occSt(p)), cash:Math.round(S.nations[A].cash), mp:Math.round(S.nations[A].mp)});
}
console.log(JSON.stringify({A:An, V:Vn, MODE, T11, ANX, SEED, note, targets:targets.map(p => [G.P[p].cityName, +R.popOf(p).toFixed(2), R.sizeBand(p), Math.round(R.gcKm(p, S.nations[A].capital))]), rows}));
