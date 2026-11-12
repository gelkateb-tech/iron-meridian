// Iron Meridian rules: territory sales. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
// A nation sells land it captured (never its home country, never its capital) to another nation for money, without war; both sides must agree.
// Computer-run nations never sell land. They may buy captured land from a person (a seat), and they answer a person's offers at once.
//   value: provValue(p), $M, the suggested price; the seller may go down to the floor (terrFloor): 25% of the value, 10% between coalition partners
//   who have been in the same coalition for 3 days or more. A bought province cannot be resold for 3 days.
// State: S.terr = {offers:[...], lock:{p:{by, until}}, log:[...]}, made on the first offer (old saves have none and load as they are).
'use strict';
const TERR = {
  floor:0.25, floorBloc:0.10,          // lowest price, share of the value: everyone / coalition partners together for blocH hours or more
  compFloor:0.40, compFloorBloc:0.25,  // the same in competitive mode (COMPETITIVE, not active yet: LATER.md)
  blocH:72,                            // coalition partners count as such for the lower floor after 3 days together
  lockH:72,                            // a bought province cannot be resold for 3 days
  offerH:48,                           // an offer stands for 2 days
  rounds:6,                            // offers and counter-offers on one province between two nations, at most
  // the value, $M: the land, a city, its people, an oil field, 10 days of what it yields at base prices, half of what its buildings cost
  vLand:15, vCity:60, vPop:9, vOil:20, vDays:10, vBld:0.5,
  // computer buyers: what they pay at most, as a share of the value (their own lost home land, a province on their border), +25% for a city
  // making a resource none of their cities makes, x0.8 while at war; never more than 45% of their money, and they keep $120M
  aiHome:1.5, aiBorder:1.0, aiNeed:0.25, aiWar:0.8, aiCash:0.45, aiKeep:120, aiOp:-30,
  aiBidP:0.25, aiBidMin:0.5, aiBidF:0.8,   // a day's chance that one bids for a seat's captured land; only for land worth at least half its value to it; its opening bid
};
const COMPETITIVE = false;   // the hook for competitive mode (LATER.md): floors 40% for everyone, 25% between coalition partners. Not active.
const provName = p => G.P[p].cityName || G.P[p].name;
// who held the province when the game began (S.own0, kept since round 33; restore fills it for older saves). Land a nation holds that was not its
// own at the start is captured land; only that can be sold
const origOwner = p => (S.own0 && S.own0[p] != null) ? S.own0[p] : S.home[p];
const capturedFrom = p => { const o = S.owner[p]; if (o < 0 || G.P[p].sea) return null; const f = origOwner(p); return f !== o ? f : null; };
// what a building's levels cost to build (money, and goods at base prices), for the value
function bldWorth(k, l){ const B = BUILD[k], m = Math.pow(1.6, l - 1)*(l === 1 && B.first ? B.first : 1), c = B.lv ? lvCost(k, l) : {cash:B.cost*m, metal:B.metal*m, iron:(B.iron || 0)*m, elec:(B.elec || 0)*m};
  return c.cash + (c.metal || 0)/MKT_LOT*MKT_BASE.metal + (c.iron || 0)/MKT_LOT*MKT_BASE.iron + (c.elec || 0)/MKT_LOT*MKT_BASE.elec; }   // (MKT_BASE: per MKT_LOT units)
// what the province yields in a normal day (provYield without occupation, blockade, morale, convoy or knocked-out buildings): money and goods
function terrYield(p){ const P = G.P[p], pp = Math.pow(Math.max(0, popOf(p)), 0.75), b = S.bld[p] || {}, y = {cash:(P.city ? 8.5 : 1.8*G.PF) + ECO.cash*pp, oil:0, metal:0, iron:0, elec:0, rare:0};
  if (P.city){ const k = P.main || 'cash', a = 1 + ARMS_PCT*(b.arms || 0); if (k === 'cash') y.cash *= ECO_Y.cash*a; else y[k] = ECO_Y[k]*citySize(pp)*a; }
  else { y.oil = P.oil ? ECO_RUR.oil : 0; y.metal = P.ore ? ECO_RUR.metal : 0; y.iron = (P.ore ? ECO_RUR.ironOre : 0) + (P.iron ? ECO_RUR.iron : 0); y.elec = 0.004*RES_K*pp; }
  return y; }
// the province's value in $M, the suggested price: land, city, population, oil field, output and buildings (the city level follows its buildings)
function provValue(p){ const P = G.P[p]; if (!P || P.sea) return 0; const pp = Math.pow(Math.max(0, popOf(p)), 0.75), y = terrYield(p), b = S.bld[p] || {};
  let v = TERR.vLand + P.cells.length*2/(GS*GS) + (P.city ? TERR.vCity : 0) + TERR.vPop*pp + (P.oil ? TERR.vOil : 0);
  v += TERR.vDays*(y.cash + MKT_K.reduce((s0, k) => s0 + y[k]/MKT_LOT*MKT_BASE[k], 0));
  for (const k of BK) for (let l = 1; l <= (b[k] || 0); l++) v += TERR.vBld*bldWorth(k, l);
  return Math.max(10, Math.round(v/5)*5); }
// since when nations a and b have been in the same coalition (linked by alliances), from the hour each alliance was signed (S.rel since):
// the chain of alliances between them whose newest link is oldest. null when they are not in one coalition
function blocSince(a, b){ if (a === b || a < 0 || b < 0 || !S.nations[a] || !S.nations[b] || !S.nations[a].alive || !S.nations[b].alive) return null;
  const E = []; for (const k in S.rel){ const r = S.rel[k]; if (!r || r.st !== 'ally') continue; const [x, y] = k.split(',').map(Number); if (S.nations[x] && S.nations[y] && S.nations[x].alive && S.nations[y].alive) E.push([x, y, r.since || 0]); }
  const t = new Map([[a, -Infinity]]); let ch = true;
  for (let i = 0; i < S.nations.length && ch; i++){ ch = false; for (const [x, y, s] of E) for (const [u, v] of [[x, y], [y, x]]){ if (!t.has(u)) continue; const w = Math.max(t.get(u), s); if (!t.has(v) || w < t.get(v)){ t.set(v, w); ch = true; } } }
  return t.has(b) ? Math.max(0, t.get(b)) : null; }
// hours left before seller and buyer count as coalition partners for the lower floor (0: they do; null: not in one coalition)
const blocWait = (a, b) => { const s0 = blocSince(a, b); return s0 == null ? null : Math.max(0, s0 + TERR.blocH - S.hour); };
// the lowest share of the value the seller may ask from the buyer
const terrFloor = (seller, buyer, comp = COMPETITIVE) => { const partners = blocWait(seller, buyer) === 0; return comp ? (partners ? TERR.compFloorBloc : TERR.compFloor) : (partners ? TERR.floorBloc : TERR.floor); };
const terrMin = (seller, buyer, p, comp = COMPETITIVE) => Math.max(1, Math.ceil(provValue(p)*terrFloor(seller, buyer, comp)));
// hours before a bought province may be sold again (0: it may)
const terrLockH = p => { const L = S.terr && S.terr.lock && S.terr.lock[p]; return L && L.by === S.owner[p] ? Math.max(0, L.until - S.hour) : 0; };
// why nation n cannot sell province p (null: it can)
function terrWhyNot(n, p){ const P = G.P[p];
  if (!P || P.sea || S.owner[p] !== n) return 'it is not yours';
  if (origOwner(p) === n) return 'it is part of your home country';
  if (isCapital(p)) return 'it is your capital';
  if (S.battles.includes(p)) return 'a battle is being fought there';
  if (S.cap[p]) return 'it is being captured';
  const L = terrLockH(p); if (L > 0) return `you bought it: it can be resold in ${L >= 24 ? Math.floor(L/24) + ' d ' : ''}${L % 24} h`;
  if (P.city && !G.P.some(Q => Q.city && Q.id !== p && S.owner[Q.id] === n)) return 'it is your last city';
  return null; }
// why seller cannot sell p to buyer at price (null: the deal is possible)
function terrDealWhy(seller, buyer, p, price){ const w = terrWhyNot(seller, p); if (w) return w;
  const B = S.nations[buyer]; if (!B || buyer === seller) return 'no buyer';
  if (!B.alive) return `${B.name} is gone`;
  if (atWar(seller, buyer)) return 'you are at war';
  if (embargoed(seller, buyer)) return 'an embargo is in force';
  const mn = terrMin(seller, buyer, p); if (!(price >= mn)) return `the lowest price is $${fmt(mn)}M (${Math.round(terrFloor(seller, buyer)*100)}% of its $${fmt(provValue(p))}M value)`;
  if (B.cash < price) return `${B.name} has only $${Math.floor(B.cash)}M`;
  return null; }
// what computer-run nation ai would pay at most for province p of seller (0: not interested)
function terrWant(ai, p, seller){ const A = S.nations[ai]; if (!A || !A.alive || isSeat(ai) || ai === seller || S.owner[p] !== seller) return 0;
  const P = G.P[p], home = origOwner(p) === ai, nb = P.nbs.some(v => S.owner[v] === ai); if (!home && !nb) return 0;
  if (atWar(ai, seller) || embargoed(ai, seller) || opinion(ai, seller) < TERR.aiOp) return 0;
  let m = home ? TERR.aiHome : TERR.aiBorder; const k = cityMain(p); if (k && k !== 'cash' && !G.P.some(Q => Q.city && S.owner[Q.id] === ai && cityMain(Q.id) === k)) m += TERR.aiNeed;
  if (warsOf(ai).length) m *= TERR.aiWar;
  return Math.max(0, Math.floor(Math.min(provValue(p)*m, A.cash*TERR.aiCash, A.cash - TERR.aiKeep))); }
const terrS = () => S.terr || (S.terr = {offers:[], lock:{}, log:[]});
const terrOffers = n => ((S.terr && S.terr.offers) || []).filter(o => o.from === n || o.to === n);
const r5 = v => Math.round(v/5)*5;
// nation `from` offers nation `to` a deal on province p for price ($M): to sell it (from owns it) or to buy it (to owns it).
// A computer-run nation answers at once: it never sells; as a buyer it accepts, counters or declines. A person gets the offer to answer
function terrOffer(from, to, p, price, round = 1, lastAi = null){ price = Math.round(+price || 0); const no = why => { refuse(from, `Not possible: ${why}.`); return {ok:false, why}; };
  if (!S.nations[to] || from === to) return no('no other side');
  const seller = S.owner[p], buyer = seller === from ? to : seller === to ? from : -1;
  if (buyer < 0) return no(`${provName(p)} belongs to neither side`);
  if (!isSeat(seller)) return no(`${S.nations[seller].name} never sells territory`);
  const why = terrDealWhy(seller, buyer, p, price); if (why) return no(why);
  const T = terrS(); T.offers = T.offers.filter(o => !(o.p === p && ((o.from === from && o.to === to) || (o.from === to && o.to === from))));
  const o = {id:S.nid++, p, seller, buyer, from, to, price, value:provValue(p), n:round, h:S.hour, exp:S.hour + TERR.offerH}; if (lastAi != null) o.lastAi = lastAi;
  if (!isSeat(to)) return terrAiAnswer(o);
  T.offers.push(o);
  tell(to, `${S.nations[from].name} offers to ${from === seller ? 'sell you' : 'buy'} ${provName(p)} for $${fmt(price)}M (value $${fmt(o.value)}M). Answer in Diplomacy (D).`, 'info', p);
  if (isSeat(from)) tell(from, `Offer sent to ${S.nations[to].name}: ${provName(p)} for $${fmt(price)}M.`, 'info', p);
  IM.emit('terr', o.to, o); return {ok:true, o}; }
// a computer buyer's answer to offer o (it is o.to; it never sells): yes at or under what it would pay, else a counter-offer at that, else no
function terrAiAnswer(o){ const ai = o.to, me = o.from, want = terrWant(ai, o.p, o.seller), A = S.nations[ai];
  if (o.price <= want){ terrSell(o.seller, o.buyer, o.p, o.price); return {ok:true, done:true, why:'accepted'}; }
  const mn = terrMin(o.seller, ai, o.p), c = Math.max(mn, Math.floor(want/5)*5);
  if (want >= mn && o.n < TERR.rounds && c < o.price && (o.lastAi == null || c > o.lastAi)){
    const T = terrS(), o2 = {id:S.nid++, p:o.p, seller:o.seller, buyer:ai, from:ai, to:me, price:c, value:o.value, n:o.n + 1, h:S.hour, exp:S.hour + TERR.offerH, lastAi:c};
    T.offers.push(o2); tell(me, `${A.name} will not pay $${fmt(o.price)}M for ${provName(o.p)}: it offers $${fmt(c)}M. Answer in Diplomacy (D).`, 'info', o.p); IM.emit('terr', me, o2);
    return {ok:false, countered:true, price:c, o:o2, why:`${A.name} offers $${fmt(c)}M instead`}; }
  (terrS().no || (S.terr.no = {}))[o.p + ':' + ai] = S.hour + 5*24;   // it does not bid for this province itself for 5 days
  const why = want <= 0 ? `${A.name} is not interested in ${provName(o.p)}` : `${A.name} will not pay that much`;
  tell(me, `${why}.`, 'info', o.p); return {ok:false, why, declined:true}; }
// nation n answers offer id: 'accept', 'decline', 'counter' (with a new price) or 'withdraw' (its own offer)
function terrAnswer(n, id, act, price){ const T = S.terr, o = T && T.offers.find(x => x.id === id); if (!o) return {ok:false, why:'the offer is gone'};
  const drop = () => { T.offers = T.offers.filter(x => x !== o); };
  if (act === 'withdraw'){ if (o.from !== n) return {ok:false, why:'not your offer'}; drop(); tell(o.to, `${S.nations[n].name} withdrew its offer for ${provName(o.p)}.`, 'info', o.p); return {ok:true}; }
  if (o.to !== n) return {ok:false, why:'not your offer to answer'};
  if (act === 'decline'){ drop(); if (!isSeat(o.from)){ addMem(o.from, n, -2); (T.no || (T.no = {}))[o.p + ':' + o.from] = S.hour + 5*24; } tell(o.from, `${S.nations[n].name} declined your offer for ${provName(o.p)} ($${fmt(o.price)}M).`, 'info', o.p); return {ok:true}; }
  if (act === 'accept'){ const why = terrDealWhy(o.seller, o.buyer, o.p, o.price); if (why){ drop(); refuse(n, `That offer no longer works: ${why}.`); return {ok:false, why}; } terrSell(o.seller, o.buyer, o.p, o.price); return {ok:true, done:true}; }
  if (act === 'counter'){ if (o.n >= TERR.rounds){ refuse(n, 'Enough counter-offers on this province: accept or decline.'); return {ok:false, why:'too many rounds'}; }
    const why = terrDealWhy(o.seller, o.buyer, o.p, Math.round(+price || 0)); if (why){ refuse(n, `Not possible: ${why}.`); return {ok:false, why}; }
    drop(); return terrOffer(n, o.from, o.p, price, o.n + 1, o.lastAi); }
  return {ok:false, why:'unknown answer'}; }
// the forces that must leave a sold province: the seller's, and any other that may not stay in the buyer's land (allies and right of way stay).
// Ground forces go to their nearest own province (fewest steps), air wings to their nearest airbase, fleets in the port to the sea beside it
function terrMoveOut(p, seller, buyer){ let dest = -1;
  const near = (n, ok) => { const seen = new Set([p]), q = [p]; for (let h = 0; h < q.length; h++) for (const v of G.P[q[h]].nbs){ if (seen.has(v)) continue; seen.add(v); if (S.owner[v] === n && !G.P[v].sea && ok(v)) return v; q.push(v); } return -1; };
  for (const a of S.armies){ if (a.owner < 0 || a.owner === buyer || friendly(a.owner, buyer) || !count(a)) continue;
    if (a.air){ if (a.fly || a.air.base !== p) continue; const nb = nearestAirbase(a.owner, p); if (nb >= 0 && nb !== p){ a.air.base = nb; a.at = nb; a.air.cd = Math.max(a.air.cd || 0, 2); } else for (const t of UT) a.u[t] = 0; continue; }
    if (a.to === p){ a.to = null; a.t = 0; a.path = []; a.legFrom = null; a.dest = null; a.forced = false; continue; }   // on the way in: it stays where it set out from
    if (a.at !== p || a.to !== null) continue;   // (leaving already: it goes on)
    const d = shipsOnly(a) ? (G.P[p].nbs.find(v => G.P[v].sea) ?? near(a.owner, v => portOk(a.owner, v))) : near(a.owner, () => true);
    if (d < 0 || d == null){ for (const t of UT) a.u[t] = 0; continue; }
    a.at = d; a.to = null; a.t = 0; a.path = []; a.pos = null; a.legFrom = null; a.dest = null; a.forced = false; if (a.owner === seller && dest < 0) dest = d; }
  removeEmpty(); return dest; }
// the sale itself: money, the province with its buildings, the troops out, the 3-day resale lock, the log and a dispatch to each side
function terrSell(seller, buyer, p, price){ const A = S.nations[seller], B = S.nations[buyer], value = provValue(p), back = origOwner(p) === buyer, T = terrS();
  B.cash -= price; A.cash += price;
  S.owner[p] = buyer; S.cap[p] = null; S.queue[p] = []; S.cons[p] = null;
  // the seller's title passes on: land it held by treaty becomes the buyer's by treaty; land it only occupied stays occupied land (the occupation
  // clock and the unrest carry over). Land sold back to the country it was taken from is home again: no occupation, unrest down to 5% at most
  if (back || S.home[p] === seller) S.home[p] = buyer;
  if (back){ if (S.occ) S.occ[p] = null; if (S.unrest) S.unrest[p] = Math.min(unrestOf(p), 5); }
  const moved = terrMoveOut(p, seller, buyer);
  T.lock[p] = {by:buyer, until:S.hour + TERR.lockH};
  for (const q in T.lock) if (T.lock[q].until <= S.hour) delete T.lock[q];
  T.offers = T.offers.filter(o => o.p !== p);
  T.log.push({h:S.hour, p, seller, buyer, price, value}); if (T.log.length > 100) T.log.shift();
  addMem(buyer, seller, 3); addMem(seller, buyer, 3);
  geoChanged(); visCache = null; INCC.v = -1;
  tell(seller, `You sold ${provName(p)} to ${B.name} for $${fmt(price)}M (value $${fmt(value)}M).${moved >= 0 ? ` Your troops there moved to ${provName(moved)}.` : ''}`, 'good', p);
  tell(buyer, `You bought ${provName(p)} from ${A.name} for $${fmt(price)}M (value $${fmt(value)}M). Its buildings are yours; it cannot be resold for 3 days.`, 'good', p);
  IM.emit('terrSold', p, seller, buyer, price);
  checkNation(seller, buyer); checkEnd(); return true; }
// every hour: offers that ran out, or whose province changed hands, lapse
function terrHour(){ const T = S.terr; if (!T || !T.offers.length) return;
  T.offers = T.offers.filter(o => { const ok = o.exp > S.hour && S.owner[o.p] === o.seller && S.nations[o.from].alive && S.nations[o.to].alive && !atWar(o.from, o.to);
    if (!ok && o.exp <= S.hour) tell(o.from, `Your offer to ${S.nations[o.to].name} for ${provName(o.p)} expired.`, 'info', o.p); return ok; }); }
// every day: a computer-run nation may bid for a person's captured land it wants (its own lost land, or land on its border)
function terrDay(){ if (S.terr && S.terr.no) for (const k in S.terr.no) if (S.terr.no[k] <= S.hour) delete S.terr.no[k];
  for (const me of seats()){ if (!S.nations[me].alive) continue;
    const mine = G.P.filter(P => S.owner[P.id] === me && !P.sea && !terrWhyNot(me, P.id)); if (!mine.length) continue;
    const open = terrOffers(me); let best = null;
    for (const P of mine){ const p = P.id, v = provValue(p); if (open.some(o => o.p === p)) continue;
      for (const N of S.nations){ const ai = N.id; if (!N.alive || isSeat(ai) || open.some(o => o.from === ai) || (S.terr && S.terr.no && S.terr.no[p + ':' + ai] > S.hour)) continue;
        const w = terrWant(ai, p, me); if (w < v*TERR.aiBidMin) continue; const mn = terrMin(me, ai, p); if (w < mn) continue;
        const sc = w/v; if (!best || sc > best.sc) best = {p, ai, w, v, mn, sc}; } }
    if (!best || rng() >= TERR.aiBidP) continue;
    const price = Math.max(best.mn, Math.min(best.w, r5(Math.min(best.w, best.v)*TERR.aiBidF))), T = terrS();
    const o = {id:S.nid++, p:best.p, seller:me, buyer:best.ai, from:best.ai, to:me, price, value:best.v, n:1, h:S.hour, exp:S.hour + TERR.offerH, lastAi:price};
    T.offers.push(o); tell(me, `${S.nations[best.ai].name} offers to buy ${provName(best.p)} for $${fmt(price)}M (value $${fmt(best.v)}M). Answer in Diplomacy (D).`, 'info', best.p); IM.emit('terr', me, o); } }
