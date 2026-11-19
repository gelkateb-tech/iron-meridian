// Iron Meridian rules: economy. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
const graceFor = o => o >= 0 && S.nations[o].small ? 24*21 : o >= 0 && S.nations[o].mid ? 24*14 : GRACE_H;   // AI powers leave a compact power alone for three weeks, a medium one for two, the rest for eight days
const inGrace = o => o >= 0 && S.hour < graceFor(o);
// may AI nation a not yet declare war on nation b? The classic world: b's own grace (three weeks for a small power). The nations world: 8 days
// for everyone, 21 days when the attacker stands two or more tiers above its victim (S against B or C, A against C)
const graceOn = (a, b) => S.nations[a].tier ? S.hour < (tierGap(S.nations[a].tier, S.nations[b].tier) >= 2 ? 24*21 : GRACE_H) : inGrace(b);
const occFactor = p => S.occ && S.occ[p] != null ? Math.min(1, 0.25 + 0.75*(S.hour - S.occ[p])/240) : 1;
let BLOCK = new Set();
function computeBlockade(){ BLOCK = new Set(); const by = new Map(); for (const a of S.armies){ if (a.to !== null || !G.P[a.at].sea || !shipsN(a) || a.owner < 0) continue; for (const v of G.P[a.at].nbs){ const o = S.owner[v]; if (!G.P[v].sea && o >= 0 && atWar(a.owner, o)){ BLOCK.add(v); if (isSeat(o)){ const m = by.get(o) || by.set(o, new Map()).get(o); if (!m.has(v)) m.set(v, a.owner); } } } } tradeBlockade(); for (const me of seats()) blockNews(me, by.get(me) || new Map()); }
// dispatch to seat `me` when enemy warships start (or stop) blockading its ports (by: port -> blockader); the seat's blk remembers what was
// announced, so a reload does not repeat it
function blockNews(me, by){ if (!S.started) return; const D = desk(me), was = new Set(Array.isArray(D.blk) ? D.blk : []), now = [...by.keys()], nw = now.filter(p => !was.has(p)), gone = [...was].filter(p => !by.has(p));
  const nm = p => G.P[p].cityName || G.P[p].name, list = ps => ps.length === 1 ? nm(ps[0]) : ps.length === 2 ? nm(ps[0]) + ' and ' + nm(ps[1]) : `${nm(ps[0])}, ${nm(ps[1])} and ${ps.length - 2} more`;
  if (nw.length && (nw.some(p => G.P[p].city) || S.hour - (D.blkT ?? -1e9) >= 24)){ D.blkT = S.hour; const ps = nw.sort((x, y) => (G.P[y].city ? 1 : 0) - (G.P[x].city ? 1 : 0)), foes = [...new Set(nw.map(p => by.get(p)))].map(nationName).join(' and ');
    tell(me, `Blockade! ${foes} warships off ${list(ps)}: output there falls 25%. Send ships to break it.`, 'bad', ps[0]); }
  if (gone.length && !now.length) tell(me, `Blockade lifted at ${list(gone)}.`, 'good', gone[0]);
  D.blk = now; }
const popOf = p => (S.pop && S.pop[p] != null) ? S.pop[p] : G.P[p].pop0;
const dmgOf = p => (S.dmg && S.dmg[p]) || 0;
const moraleOf = p => Math.max(0, Math.min(100, 100 - unrestOf(p) - dmgOf(p)));
// (war damage v: the province's morale falls by v, and its people by 0.12% a point; a Bunker spares the people its level's share, bunkerRed)
function warDamage(p, v){ if (G.P[p].sea) return; S.dmg = S.dmg || G.P.map(() => 0); S.dmg[p] = Math.min(70, (S.dmg[p] || 0) + v); S.pop = S.pop || G.P.map(P => P.pop0); S.pop[p] = Math.max(0.02, S.pop[p]*(1 - v*0.0012*(1 - bunkerRed(bunkerLv(p))))); }
function provYield(p){ const P = G.P[p], f = occFactor(p)*(BLOCK.has(p) ? 0.75 : 1)*(0.45 + 0.55*moraleOf(p)/100)*(CONVOY_LOST.has(p) ? 0 : 1), b = bdisH(p) ? (o => { for (const k in S.bdis[p]) if (S.bdis[p][k] > S.hour) o[k] = 0; return o; })({...S.bld[p]}) : S.bld[p], pp = Math.pow(Math.max(0, popOf(p)), 0.75);
  // a city yields money, manpower and its ONE main resource (P.main; 'cash' when it has none): a money city 60% more money, the others ECO_Y units a day
  // times the city-size factor (0.8 for a town, 1.2 from about 16 million people); the Arms Industry adds 25% of it per level. The countryside keeps a
  // thin trickle: oil fields, ore deposits (materials and a little iron), iron hills, a trace of electronics; rare materials come from rare-earth cities only
  const pf = G.PF, y = {cash:((P.city ? 8.5 : 1.8*pf) + ECO.cash*pp)*f, oil:(P.oil && !P.city ? ECO_RUR.oil : 0)*f, metal:(P.ore && !P.city ? ECO_RUR.metal : 0)*f,
    iron:(P.city ? 0 : (P.ore ? ECO_RUR.ironOre : 0) + (P.iron ? ECO_RUR.iron : 0))*f, elec:(P.city ? 0 : 0.004*RES_K*pp)*f, rare:0,
    mp:((P.city ? ECO_MP_CITY : 0.25*pf) + ECO.mp*Math.pow(Math.max(0, popOf(p)), 0.8) + recMp(b.rec))*f};
  if (P.city){ const k = P.main || 'cash', a = 1 + ARMS_PCT*(b.arms || 0); if (k === 'cash') y.cash *= ECO_Y.cash*a; else y[k] = ECO_Y[k]*citySize(pp)*a*f; }
  return y; }
const citySize = pp => 0.8 + 0.4*Math.min(1, pp/8);   // pp = population^0.75
// what a city produces (for the city sheet, the build menu and the AI): its main resource, today's output of it, and the output before the Arms Industry
const cityMain = p => G.P[p].city ? (G.P[p].main || 'cash') : null;
function cityOut(p){ const k = cityMain(p); if (!k) return null; const y = provYield(p)[k], lv = bdis(p, 'arms') ? 0 : (S.bld[p].arms || 0); return {k, y, base:y/(1 + ARMS_PCT*lv), lv}; }
const ECO = GS > 1 ? {cash:0.68, mp:0.16, elec:0.047} : {cash:0.9, mp:0.22, elec:0.06};
// ---- convoys: provinces cut off by land from the capital ship their output home; enemy warships on the route sink it
let CONVOY_LOST = new Set();
function homeComponent(n){ const N = S.nations[n], seen = new Set([N.capital]), q = [N.capital];
  for (let i = 0; i < q.length; i++) for (const v of G.P[q[i]].nbs){ if (seen.has(v) || G.P[v].sea) continue; const o = S.owner[v]; if (o === n || (o >= 0 && friendly(n, o))){ seen.add(v); q.push(v); } }
  return seen; }
// the convoys' sea routes between two sea zones depend only on the map and the sea legs' costs: kept from day to day (findPath's memo)
const SEA_ONLY = v => G.P[v].sea, CVPM = new Map();
function convoyDay(){ CONVOY_LOST = new Set(); S.convoys = (S.convoys || []).filter(c => S.hour - c.t0 < 14);
  for (const N of S.nations){ if (!N.alive || S.owner[N.capital] !== N.id) continue; const n = N.id, home = homeComponent(n);
    const over = ownedBy(n).map(p => G.P[p]).filter(P => !P.sea && !home.has(P.id)); if (!over.length) continue;
    const homePorts = new Set(); for (const p of home) for (const v of G.P[p].nbs) if (G.P[v].sea) homePorts.add(v); if (!homePorts.size) continue;
    const hostile = v => S.armies.some(a => a.at === v && a.to === null && a.owner >= 0 && atWar(n, a.owner) && (a.u.sub || a.u.frig || a.u.crui));
    const groups = new Map(); for (const P of over){ const sz = P.nbs.find(v => G.P[v].sea); if (sz == null) continue; if (!groups.has(sz)) groups.set(sz, []); groups.get(sz).push(P.id); }
    for (const [sz, provs] of groups){ let best = null; for (const hp of homePorts){ const pth = hp === sz ? [sz] : findPath(sz, hp, SEA_ONLY, 'foot', -1, null, CVPM); const route = hp === sz ? [sz] : (pth.length ? [sz, ...pth] : null); if (route && (!best || route.length < best.length)) best = route; }
      if (!best) continue; const raidAt = best.findIndex(hostile);
      if (raidAt >= 0){ const lost = {}; if (isSeat(n)) for (const p of provs){ const y = provYield(p); for (const k in y) lost[k] = (lost[k] || 0) + y[k]; }   // what the convoy carried (before the loss zeroes it)
        for (const p of provs) CONVOY_LOST.add(p); const by = S.armies.find(a => a.at === best[raidAt] && a.owner >= 0 && atWar(n, a.owner) && (a.u.sub || a.u.frig || a.u.crui));
        if (isSeat(n)) tell(n, `Convoy from ${G.P[provs[0]].cityName || G.P[provs[0]].name} sunk by ${nationName(by.owner)} warships in ${G.P[best[raidAt]].name}: today's output from ${provs.length} overseas province${provs.length > 1 ? 's' : ''} is lost (${yieldStr(lost)}). Escort the route or clear it.`, 'bad', best[raidAt]);
        if (by && isSeat(by.owner)) tell(by.owner, `Your warships in ${G.P[best[raidAt]].name} sank ${artA(N.name)} convoy.`, 'good', best[raidAt]); }
      if (best.length > 1) S.convoys.push({owner:n, route:best, t0:S.hour, raidAt}); } }
  if (S.convoys.length > 60) S.convoys.splice(0, S.convoys.length - 60); }
// storage: goods RES_K times 400 + 15 per province; manpower (k = 'mp', in thousands of people, not scaled) 400 + 15 per province
const stockCap = (n, k) => (k === 'mp' ? 1 : RES_K)*(400 + 15*ownedBy(n).length);
const SHORT_MSG = {oil:'Oil shortage: Armor and Strike Jets are slowed and weakened.', iron:'Iron shortage: armor, artillery and warships go without spare parts (-20% attack, -15% defence). Buy iron on the Market (T) or build an Arms Industry in an iron city.', elec:'Electronics shortage: aircraft, drones, air defence and warships go without spares (-20% attack, -10% defence). Buy electronics on the Market (T) or build an Arms Industry in an electronics city.', cash:'Treasury empty: upkeep is unpaid.'};
let INCC = {v:-1, S:null, m:[]};
function income(n){ if (!keep()) return (INCC.v === tickVer && INCC.S === S && INCC.m[n]) || income0(n); if (INCC.v !== tickVer || INCC.S !== S) INCC = {v:tickVer, S, m:[]}; return INCC.m[n] || (INCC.m[n] = income0(n)); }
function income0(n){
  const g = {cash:0, oil:0, metal:0, iron:0, elec:0, rare:0, mp:0}, u = {cash:0, oil:0, metal:0, iron:0, elec:0, rare:0, mp:0}; let provs = 0;
  const N0 = S.nations[n], boost = N0.boost || 1, capHit = N0.capHit != null && S.hour - N0.capHit < 24*14 ? 0.6 : 1, bM = N0.boostM;   // boostM: the nations world's own catch-up for manpower
  for (const p of ownedBy(n)){ const y = provYield(p); provs++;
    const m = (S.home[p] === n ? boost : 1)*capHit;
    // (a catch-up below 1 holds money back in full and goods by its square root only: a big country keeps about the goods of the others)
    const mg = boost < 1 && S.home[p] === n ? Math.sqrt(boost)*capHit : m;
    for (const k in g) g[k] += y[k]*(k === 'cash' ? m : k === 'mp' ? (bM != null ? (S.home[p] === n ? bM : 1)*capHit : m) : mg); if (N0.capital === p){ const c = ECO_CAPITAL, rs = N0.reserve; for (const k in c) g[k] += c[k]*(rs && rs.includes(k) ? ECO_RESERVE : 1); } }   // the capital: state industry, labs and recycling (a nations-world reserve doubles a good its cities lack)
  const eff = Math.max(0.6, Math.min(1.6, 80/(40 + provs)));   // administration: large empires run less efficiently
  for (const k in g) g[k] *= eff;
  g.cash *= has(n, 'eco1') ? 1.2 : ECO_CASH_ALL; if (has(n, 'eco2')) g.mp *= 1.4; if (has(n, 'eco3')) g.oil *= 1.5;   // eco1-3: the old Economy research (now part of buildings); a nation that researched one keeps its bonus
  const mob = N0.mob || 0; if (mob){ g.mp *= 1 + 0.4*mob; g.cash *= 1 - 0.06*mob; }
  if (!isSeat(n) && S.diff){ const dm = diffOf().inc; for (const k in g) g[k] *= dm; }
  if (S.rel){ const tired = warsOf(n).filter(m => S.hour - rel(n, m).since > 240).length; g.cash *= 1 - Math.min(0.2, 0.05*tired); }
  const trade = tradeIncome(n); for (const k of DEAL_K) g[k] += trade[k];   // trade routes (after the administration and difficulty factors)
  for (const a of armiesOf(n)) for (const t of UT){ const q = a.u[t]; if (!q) continue; u.cash += q*UNITS[t].upk; u.oil += q*UNITS[t].fuel; u.iron += q*MAINT[t].iron; u.elec += q*MAINT[t].elec; }
  for (const p of ownedBy(n)){ const l = S.bld[p].fort; if (l > 0) u.cash += BUNKER_LV[Math.min(BUNKER_LV.length - 1, l)].upk; }   // the Bunker's upkeep (money a day; the only building with one)
  { const dd = n >= 0 && S.nations[n] ? DOCTRINES[S.nations[n].doc] : null; if (dd && dd.upk) u.cash *= dd.upk; }
  const net = {}; for (const k in g) net[k] = g[k] - u[k];
  return {gross:g, upkeep:u, net, eff, cash:g.cash, upk:u.cash, trade};
}
/* ---------------- World market ---------------- */
const MKT_BASE = {oil:3.2, metal:2.4, iron:2.2, elec:4.2, rare:6.5}, MKT_K = Object.keys(MKT_BASE), AI_SELL_DAY = 40*RES_K, AI_HOARD_DAY = 30*RES_K;   // AI metal sale on the world market: units a day at most (surplus / real hoard). MKT_BASE: $M per MKT_LOT units
// metal is never part of upkeep, so the world demand for it is what nations spend: units, buildings, links, research, upgrades, missiles.
// Without this the demand side read zero and the world metal price sank to its 0.7x floor in every game.
// (the same for iron, electronics and rare materials)
function useRes(k, q){ if (!(q > 0) || !S || !S.mkt) return; const U = S.mkt.use || (S.mkt.use = {}); U[k] = (U[k] || 0) + q; }
function mkt(){ if (!S.mkt){ S.mkt = {p:{...MKT_BASE}, prev:{...MKT_BASE}, hist:Object.fromEntries(MKT_K.map(k => [k, []])), press:Object.fromEntries(MKT_K.map(k => [k, 0])), emb:{}}; } return S.mkt; }
// an old save's market: food dropped, the new goods start at their base price
function mktFix(){ const M = S.mkt; if (!M) return; for (const o of [M.p, M.prev, M.hist, M.press, M.use, M.dem]) if (o) delete o.food;
  M.prev = M.prev || {}; M.hist = M.hist || {}; M.press = M.press || {};
  for (const k of MKT_K){ if (!(M.p[k] > 0)) M.p[k] = MKT_BASE[k]; if (!(M.prev[k] > 0)) M.prev[k] = M.p[k]; if (!Array.isArray(M.hist[k])) M.hist[k] = []; if (typeof M.press[k] !== 'number') M.press[k] = 0; } }
const embargoes = n => S.nations.filter(m => m.alive && m.id !== n && mkt().emb[m.id + '>' + n]).length;
// EMBARGO (a real rule): emb['a>b'] = a has an embargo on b. It is not war and changes no map colour or fog; it shuts all trade between the two:
// no trade routes (existing ones close with a notice), no order-book deals either way, and b's market prices worsen (sanctionF).
// Coalition partners can join: M.join['p>b'] = the partner whose embargo p follows (an AI follower lifts it when that partner does).
// (the value is the hour + 1: hour 0 is the first hour of the game and must still count as "on")
const embargoed = (a, b) => !!(mkt().emb[a + '>' + b] || mkt().emb[b + '>' + a]);
const embargoLeaders = (n, m) => S.nations.filter(p => p.alive && p.id !== n && p.id !== m && mkt().emb[p.id + '>' + m] && blocIdOf(p.id) && blocIdOf(p.id) === blocIdOf(n)).map(p => p.id);
function setEmbargo(n, m, on, lead = null){ const M = mkt(), key = n + '>' + m; M.join = M.join || {};
  if (on){ if (M.emb[key] || n === m) return false; M.emb[key] = S.hour + 1; if (lead != null) M.join[key] = lead; else delete M.join[key]; trCutEmbargo(); }
  else { if (!M.emb[key]) return false; delete M.emb[key]; delete M.join[key]; }
  return true; }
const sanctionF = n => Math.min(3, embargoes(n))*0.15;
const buyPrice = (n, k) => mkt().p[k]*1.1*(1 + sanctionF(n));
const sellPrice = (n, k) => mkt().p[k]*0.9*(1 - sanctionF(n));
// nation n buys (qty > 0) or sells (qty < 0) on the world market, in whole lots of MKT_LOT units; returns the units traded
function trade(n, k, qty){ const N = S.nations[n], M = mkt(); qty = Math.trunc(qty/MKT_LOT)*MKT_LOT;
  if (qty > 0){ qty = Math.min(qty, kFloor(stockCap(n) - N[k]), lotsFor(N.cash, buyPrice(n, k))); if (qty <= 0) return 0; N.cash -= lotCash(qty, buyPrice(n, k)); N[k] += qty; }
  else { qty = -Math.min(-qty, kFloor(N[k])); if (qty >= 0) return 0; N.cash += lotCash(-qty, sellPrice(n, k)); N[k] += qty; }
  const lots = qty/MKT_LOT; M.press[k] += lots/1500; M.p[k] = Math.max(MKT_BASE[k]*0.4, Math.min(MKT_BASE[k]*3.5, M.p[k]*(1 + lots/4000))); return qty; }
function marketDay(){ const M = mkt(), incs = S.nations.map(N => N.alive ? income(N.id) : null);
  const U = M.use || (M.use = {}), D = M.dem || (M.dem = {});
  for (const k of MKT_K){ let sup = 0, dem = 0; for (const inc of incs){ if (!inc) continue; sup += inc.gross[k]; dem += inc.upkeep[k]; }
    if (SPEND_K.includes(k)){ const used = U[k] || 0; U[k] = 0; D[k] = D[k] == null ? Math.max(used, sup*0.45) : D[k]*0.75 + used*0.25; dem += (k === 'metal' ? 0.3 : k === 'rare' ? 0.6 : 0.45)*D[k]; }   // smoothed daily spending, weighted 0.3 for materials (stockpiles and build-ups are lumpy), 0.6 for rare materials (research, all of their demand), 0.45 for the rest (an old save starts near the usual level)
    const ratio = dem/Math.max(RES_K, sup), target = MKT_BASE[k]*Math.max(0.7, Math.min(2.6, 0.6 + 1.0*ratio + 4*M.press[k]));
    M.prev[k] = M.p[k]; M.p[k] = Math.max(MKT_BASE[k]*0.4, Math.min(MKT_BASE[k]*3.5, M.p[k] + (target - M.p[k])*0.2 + M.p[k]*(rng() - 0.5)*0.06));
    M.press[k] *= 0.7; M.hist[k].push(+M.p[k].toFixed(2)); if (M.hist[k].length > 60) M.hist[k].shift(); }
  // AI trading and sanctions (no owner or relation changes here: every nation's land and enemies are counted once, quietly)
  quietly(() => { for (const N of S.nations){ if (!N.alive || isSeat(N.id)) continue; const cap = stockCap(N.id);
    void cap;
    for (const O of S.nations){ if (!O.alive || O.id === N.id) continue; const key = N.id + '>' + O.id, op = opinion(N.id, O.id), war = atWar(N.id, O.id);
      if (!M.emb[key] && (op < -45 || war) && rng() < 0.25){ M.emb[key] = S.hour + 1; if (isSeat(O.id)) tell(O.id, `${N.name} imposes an embargo on you: your market prices worsen by 15% per embargo (${embargoes(O.id)} now).`, 'bad', null); }
      else if (M.emb[key] && M.join && M.join[key] != null){ const ld = M.join[key]; if (!M.emb[ld + '>' + O.id] || blocIdOf(ld) !== blocIdOf(N.id) || !blocIdOf(N.id)){ setEmbargo(N.id, O.id, false); if (isSeat(O.id)) tell(O.id, `${N.name} lifts its embargo on you.`, 'good', null); } }   // a joined embargo ends when the partner's does
      else if (M.emb[key] && op > -20 && !war && rng() < 0.2){ delete M.emb[key]; if (isSeat(O.id)) tell(O.id, `${N.name} lifts its embargo on you.`, 'good', null); }
      else if (!M.emb[key] && !war && rng() < 0.08 && blocIdOf(N.id) && blocIdOf(N.id) !== blocIdOf(O.id) && opinion(N.id, O.id) < 25){ const ls = embargoLeaders(N.id, O.id);   // coalition partners join an embargo (AI)
        if (ls.length){ setEmbargo(N.id, O.id, true, ls[0]); if (isSeat(O.id)) tell(O.id, `${N.name} joins ${S.nations[ls[0]].name}'s embargo on you: your market prices worsen by 15% per embargo (${embargoes(O.id)} now).`, 'bad', null); } } } } });
}
/* ---- market: only what nations list. Sell offers (goods held) and buy offers (money held); nothing else ---- */
const isBid = o => o.type === 'buy';
// coalition-only listings are the one private channel: only members of that coalition see and fill them
const blocIdOf = n => { const R = S.blocReg && Object.entries(S.blocReg).find(([, r]) => r.members && r.members.includes(n)); return R ? R[0] : null; };
const canSee = (o, n) => !o.priv || blocIdOf(n) === o.priv;
function settle(buyer, seller, k, q, price){ const B = S.nations[buyer], Sl = S.nations[seller]; B[k] += q; Sl.cash += lotCash(q, price); }
// AI order-book thresholds: a buy listing below AI_BID_LO, other AIs' sell listings filled below AI_NEED (metal for units and buildings above all, rare materials for research)
const AI_BID_LO = resK({oil:40, metal:40, iron:40, elec:30, rare:35}), AI_NEED = resK({oil:220, metal:140, iron:220, elec:160, rare:160});
// stocks listed for sale from BOOK_HI down to BOOK_LO (and 55% / 35% of the storage cap): oil from 600, a metal hoard from 900, iron from 300, electronics from 260, rare materials from 240
// (oil: the producers' surplus reaches the importers short of fuel through the order book instead of piling up at home)
const BOOK_HI = resK({oil:600, metal:900, iron:300, elec:260, rare:240}), BOOK_LO = resK({oil:380, metal:600, iron:200, elec:170, rare:150});
function bookDay(){ const M = mkt(); S.book = (S.book || []).filter(o => o.qty > 0 && S.nations[o.seller].alive); for (const o of S.book) o.priv = null;
  // expired listings: goods (sell) or money (buy) go back to their owner
  for (const o of S.book) if (o.exp <= S.hour){ const N = S.nations[o.seller]; if (isBid(o)) N.cash += lotCash(o.qty, o.price); else N[o.res] += o.qty;
    // a seat is told what lapsed and what came back: the goods of a sell offer, the money held for a buy offer
    if (isSeat(o.seller)){ const q = fmt(o.qty), g = rlbl(o.res), part = o.q0 > o.qty ? ` (${fmt(o.q0 - o.qty)} of the ${fmt(o.q0)} were ${isBid(o) ? 'bought' : 'sold'})` : '', full = !isBid(o) && N[o.res] > stockCap(o.seller);
      tell(o.seller, isBid(o) ? `Your buy offer for ${q} ${g} at ${lotPriceTxt(o.res, o.price)} expired unfilled${part}. The $${fmt(lotCash(o.qty, o.price))}M held for it is back in your treasury.`
        : `Your sell offer of ${q} ${g} at ${lotPriceTxt(o.res, o.price)} expired unsold${part}. The ${q} ${g} are back in your stock${full ? ', which is now over your storage limit: use or sell them before the next day, or the excess is lost' : ''}.`, 'info', null); }
    o.qty = 0; }
  S.book = S.book.filter(o => o.qty > 0);
  // the biggest surplus first (a nation holds at most five listings); a hoard well above the line goes in bigger lots (up to 250) and a little cheaper,
  // so a rare-earth giant's stock reaches the nations short of it instead of piling up all game
  for (const N of S.nations){ if (!N.alive || isSeat(N.id)) continue; const cap = stockCap(N.id); let mine = S.book.filter(o => o.seller === N.id).length;
    const hiOf = k => Math.min(cap*0.55, BOOK_HI[k] || 1e9);
    for (const k of MKT_K.slice().sort((a, b) => N[b]/hiOf(b) - N[a]/hiOf(a))){ if (mine >= 5) break;
      const hi = hiOf(k), lo = Math.min(cap*0.35, BOOK_LO[k] || 1e9);   // a metal hoard is listed from 900 units (sold nation to nation: no effect on the world price)
      if (N[k] > hi && rng() < 0.45 && !S.book.some(o => o.seller === N.id && o.res === k && !isBid(o))){ const big = N[k] > 2*hi, qty = kRound(Math.min(N[k] - lo, 250*RES_K, (30 + rng()*60)*RES_K + 0.25*(N[k] - hi))); if (qty < 10*RES_K) continue;
        N[k] -= qty; mine++; S.book.push({id:S.nid++, type:'sell', seller:N.id, res:k, qty, price:+(M.p[k]*(big ? 0.86 + rng()*0.18 : 0.92 + rng()*0.25)).toFixed(2), exp:S.hour + 72}); }
      else if (N[k] < AI_BID_LO[k] && N.cash > 260 && rng() < 0.5 && !S.book.some(o => o.seller === N.id && o.res === k && isBid(o))){ const price = +(M.p[k]*(1 + rng()*0.22)).toFixed(2), lots = Math.round(Math.min(60, 25 + rng()*40, (N.cash - 200)/price)), qty = lots*MKT_LOT; if (lots < 10) continue;
        N.cash -= lots*price; mine++; S.book.push({id:S.nid++, type:'buy', seller:N.id, res:k, qty, price, exp:S.hour + 72}); } } }
  // matching between listings (never between nations at war); the earlier listing's price stands
  for (const bid of S.book.filter(isBid)){ for (const ask of S.book.filter(o => !isBid(o) && o.res === bid.res && o.price <= bid.price && o.seller !== bid.seller && !atWar(o.seller, bid.seller) && !embargoed(o.seller, bid.seller) && canSee(o, bid.seller) && canSee(bid, o.seller)).sort((x, y) => x.price - y.price)){
      if (bid.qty <= 0) break; if (ask.qty <= 0 || isSeat(bid.seller) || isSeat(ask.seller)) continue; const q = Math.min(bid.qty, ask.qty); settle(bid.seller, ask.seller, bid.res, q, ask.price); S.nations[bid.seller].cash += lotCash(q, bid.price - ask.price); bid.qty -= q; ask.qty -= q; } }
  // AIs short of a resource (metal for units and buildings above all) fill sell listings at a fair price (up to 1.15x the world price), another AI's and
  // a seat's alike (the seat is told of each sale); never an enemy's, never across an embargo
  for (const ask of S.book){ if (isBid(ask) || ask.qty <= 0 || ask.price > M.p[ask.res]*1.15) continue; const seat = isSeat(ask.seller);
    for (const N of S.nations){ if (ask.qty <= 0) break; if (!N.alive || isSeat(N.id) || N.id === ask.seller || atWar(N.id, ask.seller) || embargoed(ask.seller, N.id) || !canSee(ask, N.id) || rng() > 0.6) continue;
      // oil: a big consumer keeps about 25 days of fuel; running out of it, a power buys with less money in hand
      const need = aiBookNeed(N, ask), dry = ask.res === 'oil' && N.oil < 80*RES_K && income(N.id).net.oil < 0;
      if (N[ask.res] >= need || N.cash < (dry ? 120 : 230)) continue;
      const q = Math.min(ask.qty, 50*RES_K, lotsFor(N.cash - (dry ? 80 : 160), ask.price), kFloor(stockCap(N.id) - N[ask.res])); if (q < 5*RES_K) continue;
      N.cash -= lotCash(q, ask.price); N[ask.res] += q; S.nations[ask.seller].cash += lotCash(q, ask.price); ask.qty -= q;
      if (seat) tell(ask.seller, `${N.name} bought ${fmt(q)} ${rlbl(ask.res)} from your offer for $${fmt(lotCash(q, ask.price))}M.`, 'good', null); } }
  // AI nations sell into a seat's buy offer when the price suits them (a seat's sell offer is taken above, like any other listing)
  for (const o of S.book){ const me = o.seller; if (!isSeat(me)) continue;   // a seat's offers: the AI nations may take them
    for (const N of S.nations){ if (!N.alive || isSeat(N.id) || atWar(N.id, me) || embargoed(N.id, me) || o.qty <= 0 || !canSee(o, N.id) || rng() > 0.5) continue;
      if (!isBid(o)) continue;
      { if (N[o.res] < 120*RES_K || o.price < M.p[o.res]*0.95) continue; const q = Math.min(o.qty, 40*RES_K, kFloor(N[o.res] - 80*RES_K)); if (q < 5*RES_K) continue; N[o.res] -= q; N.cash += lotCash(q, o.price); S.nations[me][o.res] += q; o.qty -= q; tell(me, `${N.name} sold you ${fmt(q)} ${rlbl(o.res)} through your buy offer for $${fmt(lotCash(q, o.price))}M.`, 'good', null); } } }
  S.book = S.book.filter(o => o.qty > 0); }
// the stock below which an AI takes a sell listing: oil about 25 days of fuel for a big consumer, twice the usual line when the listing is cheap
function aiBookNeed(N, ask){ return (ask.res === 'oil' ? Math.max(AI_NEED.oil, 25*income(N.id).upkeep.oil) : AI_NEED[ask.res] || 70*RES_K)*(ask.price < MKT_BASE[ask.res]*0.85 ? 2 : 1); }
// nation n takes q units of order-book offer id (buys from a sell offer, sells into a buy offer); returns the amount traded
function fillOffer(n, id, q){ const o = (S.book || []).find(x => x.id === id), N = S.nations[n]; if (!o || o.seller === n || !canSee(o, n)) return 0;
  if (embargoed(o.seller, n)) return 0;   // an embargo either way closes the deal
  q = kFloor(q);   // whole lots of MKT_LOT units
  if (!isBid(o)){ q = Math.min(q, o.qty, lotsFor(N.cash, o.price), kFloor(stockCap(n) - N[o.res])); if (q <= 0) return 0; N.cash -= lotCash(q, o.price); N[o.res] += q; S.nations[o.seller].cash += lotCash(q, o.price); }
  else { q = Math.min(q, o.qty, kFloor(N[o.res])); if (q <= 0) return 0; N[o.res] -= q; N.cash += lotCash(q, o.price); S.nations[o.seller][o.res] += q; }
  o.qty -= q; addMem(o.seller, n, 1); if (o.qty <= 0) S.book = S.book.filter(x => x !== o); return q; }
const buyOffer = fillOffer;
// nation n posts an offer on the order book; returns the quantity listed (what it holds or can pay for), 0 when nothing was
function postOffer(n, k, qty, price, type = 'sell', priv = false){ const N = S.nations[n]; if (!(price > 0) || !(qty > 0)) return 0;
  qty = kFloor(qty);   // whole lots of MKT_LOT units, priced per lot
  if (type === 'sell'){ qty = Math.min(qty, kFloor(N[k])); if (qty <= 0) return 0; N[k] -= qty; }
  else { qty = Math.min(qty, lotsFor(N.cash, price)); if (qty <= 0) return 0; N.cash -= lotCash(qty, price); }
  (S.book || (S.book = [])).push({id:S.nid++, type, seller:n, res:k, qty, q0:qty, price:+price.toFixed(2), exp:S.hour + 72, priv:priv ? blocIdOf(n) : null}); return qty; }
/* ---------------- Occupation, morale and rebels (docs/REBELS-PLAN.md; owner rules 18-19 and list item 22) ----------------
   A province you captured is occupied (its home, S.home, is another country's or independent). Once a day its unrest moves (morale = 100 - unrest
   - war damage): a city +6 while the country it was taken from still exists, +4 when that country is gone or the city was independent, the
   countryside +2; each of your ground units standing there takes 3 off, counting at most 4 (so 2 hold a city steady and 4 raise its morale). The
   countryside's unrest stops at 50 and it never rebels. A day with at least 1 of your units there and morale at 50% or more counts toward
   integration, a bad day takes one off; at 10 the province is integrated (S.integ, by province and holder): unrest falls 4 a day as on your own land
   and it never rebels while you hold it. An occupied city that is not integrated and is below 30% morale has rebels for certain at the daily
   update: not in the first 3 days after its capture, not within 5 days of its last uprising (S.rcool), not while rebels are there. They are 3, 4,
   5 or 6 infantry by its people (a town under 1.5 million, a city, a large city from 5 million, a metropolis from 20 million) and their rising
   lowers its unrest by 15. Owner, list item 22: ONE infantry unit of the holder (any infantry type) standing in the city beats any rebels: they are
   crushed the moment they rise or the moment the infantry is there; only a city with no infantry fights them (other ground units, by the battle
   rules) and only a city with no ground unit of its holder for 24 hours in a row goes over to them: back to the country it was taken from if it
   still exists (the rebels become its troops, at least 2 infantry), otherwise independent (they stay as its garrison). Pacify: $40M, unrest -25,
   needs a unit of yours in the province, once every 3 days per province (S.pcool). */
const RB = {city:6, cityFree:4, rural:2, perUnit:3, maxUnits:4, ruralCap:50, below:30, warn:40, grace:72, cool:120, integDays:10, integMor:50, integUp:4, rise:15, hold:24, pacCost:40, pacDrop:25, pacCool:72};
const unrestOf = p => (S.unrest && S.unrest[p]) || 0;
const placeNm = p => G.P[p].cityName || G.P[p].name;
// rebels for a city of popOf(p) million people
const rebelSize = p => { const pp = popOf(p); return pp >= 20 ? 6 : pp >= 5 ? 5 : pp >= 1.5 ? 4 : 3; };
// nation o's ground units standing in province p (not marching, not in the air)
function garrisonOf(p, o){ let s = 0; for (const a of byAt(p) || S.armies) if (a.owner === o && a.at === p && a.to === null && !a.fly && !a.air && !a.rebel) s += groundN(a); return s; }
// an infantry unit of nation o standing in province p: it beats any rebels there (owner, list item 22)
function rebelGuard(p, o){ if (!(o >= 0)) return false; for (const a of byAt(p) || S.armies) if (a.owner === o && a.at === p && a.to === null && !a.fly && !a.air && INF_T.some(t => a.u[t] > 0)) return true; return false; }
// occupied: held by a nation that is not its home; integrated: the holder's count reached RB.integDays
const occupied = p => { const o = S.owner[p]; return o >= 0 && !G.P[p].sea && S.home[p] !== o; };
const integDays = p => (S.integ && S.integ[p + ':' + S.owner[p]]) || 0;
const integrated = p => integDays(p) >= RB.integDays;
const rebelsAt = p => { for (const a of byAt(p) || S.armies) if (a.rebel && a.at === p && count(a) > 0) return a; return null; };
// the daily change of an occupied province's unrest (positive: morale falls) with g of its holder's ground units there
const unrestRate = (p, g) => { const P = G.P[p], home = S.home[p]; return (P.city ? (home >= 0 && S.nations[home] && S.nations[home].alive ? RB.city : RB.cityFree) : RB.rural) - RB.perUnit*Math.min(RB.maxUnits, g); };
// a captured province starts its occupation afresh: a holder that took it before counts its integration again
function occReset(p, O){ if (S.integ) delete S.integ[p + ':' + O]; }
function unrestDay(){
  S.unrest = S.unrest || G.P.map(() => 0);
  // mobilisation strains the home front
  for (const N of S.nations){ if (!N.alive || !N.mob) continue; for (const p of ownedBy(N.id)) if (S.home[p] === N.id) S.unrest[p] = Math.max(unrestOf(p) - 4, Math.min(15*N.mob, unrestOf(p) + 3*N.mob)); }
  S.integ = S.integ || {}; S.rcool = S.rcool || {};
  for (let p = 0; p < G.P.length; p++){ if (G.P[p].sea) continue; const o = S.owner[p], home = S.home[p], P = G.P[p];
    if (o < 0 || home === o){ if (!(o >= 0 && S.nations[o].mob)) S.unrest[p] = Math.max(0, unrestOf(p) - 4); continue; }
    const ik = p + ':' + o; if ((S.integ[ik] || 0) >= RB.integDays){ S.unrest[p] = Math.max(0, unrestOf(p) - RB.integUp); continue; }
    const g = garrisonOf(p, o);
    S.integ[ik] = g >= 1 && moraleOf(p) >= RB.integMor ? (S.integ[ik] || 0) + 1 : Math.max(0, (S.integ[ik] || 0) - 1);
    if (S.integ[ik] >= RB.integDays){ S.unrest[p] = Math.max(0, unrestOf(p) - RB.integUp); tell(o, `${placeNm(p)} is integrated: its people accept your rule. It will not rebel again while you hold it.`, 'good', p); continue; }
    const d = unrestRate(p, g), m0 = moraleOf(p);
    S.unrest[p] = Math.max(0, Math.min(P.city ? 100 : RB.ruralCap, unrestOf(p) + d));
    if (!P.city) continue;
    const m1 = moraleOf(p), here = rebelsAt(p);
    if (m0 >= RB.warn && m1 < RB.warn && d > 0 && !here) tell(o, `Morale in ${placeNm(p)} is ${Math.round(m1)}% and falling ${d}% a day. Rebels will rise below ${RB.below}%${m1 >= RB.below ? ` (in about ${Math.max(1, Math.ceil((m1 - RB.below + 0.01)/d))} day${Math.ceil((m1 - RB.below + 0.01)/d) > 1 ? 's' : ''})` : ''}. Station troops there or Pacify it.`, 'bad', p);
    if (m1 < RB.below && !here && !(S.occ && S.occ[p] != null && S.hour - S.occ[p] < RB.grace) && !(S.rcool[p] > S.hour)) rebelRise(p, o, g); }
}
// rebels rise in occupied city p of nation o (g: its ground units there)
function rebelRise(p, o, g){ const n = rebelSize(p), nm = placeNm(p);
  S.unrest[p] = Math.max(0, unrestOf(p) - RB.rise); S.rcool[p] = S.hour + RB.cool;
  if (rebelGuard(p, o)){ tell(o, `Rebels rose up in ${nm} (${n} units), and your infantry there crushed them at once. Morale is still ${Math.round(moraleOf(p))}%: keep the infantry there until the city is integrated.`, 'info', p); return null; }
  const r = addArmy(NEUTRAL, p, {inf:n}); r.rebel = true; r.hold = 0;
  if (!g){ r.lw = 1; tell(o, `Rebels rose up in ${nm} (${n} units)! The city has no troops: it will be lost in 24 h unless troops arrive. One infantry unit is enough to crush them.`, 'bad', p); }
  else tell(o, `Rebels rose up in ${nm} (${n} units)! Your garrison of ${g} is fighting them. One infantry unit there would crush them at once.`, 'bad', p);
  if (S.home[p] >= 0 && S.home[p] !== o) tell(S.home[p], `Rebels rose up against ${nationName(o)} in ${nm}, a city of yours it holds.`, 'info', p);
  return r; }
// rebels meeting an infantry unit of the city's holder are crushed (each hour, and again once the forces have moved: rules/tick.js)
function rebelCrush(){ let any = false;
  for (const a of S.armies){ if (!a.rebel || a.to !== null || !count(a)) continue; const p = a.at, o = S.owner[p];
    if (!rebelGuard(p, o)) continue;
    for (const t of UT){ a.u[t] = 0; a.w[t] = 0; } any = true;
    tell(o, `Your infantry crushed the rebels in ${placeNm(p)}.`, 'good', p); }
  if (any) removeEmpty(); }
// air wings based in a province that changed hands escape to their nation's nearest airbase, or are destroyed on the ground (capture, a revolt)
function wingsFlee(p, O){ for (const w of S.armies){ if (!w.air || w.fly || w.air.base !== p || w.owner === O) continue; const nb = nearestAirbase(w.owner, p); if (nb >= 0 && nb !== p){ w.air.base = nb; atMove(w, nb); w.air.cd = 4; if (isSeat(w.owner)) tell(w.owner, `Your air wing escaped from ${placeNm(p)} to ${placeNm(nb)}.`, 'info', nb); } else { for (const t of UT) w.u[t] = 0; if (isSeat(w.owner)) tell(w.owner, `Your air wing was destroyed on the ground at ${placeNm(p)}.`, 'bad', p); } } }
function rebelHour(){
  rebelCrush();
  // rebels holding a province with none of its holder's ground units for 24 hours in a row hand it back to its original nation (or independence)
  for (const a of S.armies){ if (!a.rebel || !count(a) || a.to !== null) continue; const p = a.at, o = S.owner[p];
    if (o < 0){ delete a.rebel; delete a.hold; delete a.lw; continue; }   // (the province is independent already: they are its garrison)
    if (garrisonOf(p, o) > 0){ a.hold = 0; a.lw = 0; continue; }
    a.hold = (+a.hold || 0) + 1;   // (an unset count starts at 0: the first hour alone is hour 1 of 24)
    if (!a.lw){ a.lw = 1; tell(o, `Your last troops in ${placeNm(p)} are gone: the rebels will take it in 24 h unless troops arrive.`, 'bad', p); }
    if (a.hold < RB.hold) continue;
    const prev = o, home = S.home[p], to = home >= 0 && S.nations[home].alive && home !== prev ? home : NEUTRAL, n = count(a);
    S.owner[p] = to; ownChanged(); S.cap[p] = null; S.queue[p] = []; S.cons[p] = null; S.bld[p].fort = Math.max(0, (S.bld[p].fort || 0) - 1); bunkerFull(p);
    if (S.occ) S.occ[p] = null; S.unrest[p] = 10; geoChanged(); wingsFlee(p, to);
    if (to >= 0){ for (const t of UT){ a.u[t] = 0; a.w[t] = 0; } addArmy(to, p, {inf:Math.max(2, n)}); } else { delete a.rebel; delete a.hold; delete a.lw; }
    if (isSeat(prev)){ bump(prev, 'lost'); tell(prev, `${placeNm(p)} revolted and ${to >= 0 ? 'rejoined ' + S.nations[to].name : 'declared independence'}. Retake it with an ordinary attack.`, 'bad', p); }
    tell(to, `Rebels liberated ${placeNm(p)}: it is yours again.`, 'good', p);
    if (prev >= 0) checkNation(prev);
  }
  removeEmpty();
}
// Pacify (the page's button and the computer, one checked order): why nation n may not pacify province p now ('' when it may)
function pacifyWhy(n, p){ const P = G.P[p]; if (!P || P.sea || S.owner[p] !== n) return 'not yours'; if (unrestOf(p) < 1) return 'no unrest';
  if (garrisonOf(p, n) < 1) return 'needs a unit in the province'; const c = (S.pcool || {})[p]; if (c > S.hour){ const d = Math.ceil((c - S.hour)/24); return `again in ${d} day${d > 1 ? 's' : ''}`; }
  if (S.nations[n].cash < RB.pacCost) return `needs $${RB.pacCost}M`; return ''; }
function pacify(n, p){ if (pacifyWhy(n, p)) return false; S.nations[n].cash -= RB.pacCost; S.unrest[p] = Math.max(0, unrestOf(p) - RB.pacDrop); (S.pcool || (S.pcool = {}))[p] = S.hour + RB.pacCool; return true; }
