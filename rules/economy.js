// Iron Meridian rules: economy. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
const graceFor = o => o >= 0 && S.nations[o].small ? 24*21 : o >= 0 && S.nations[o].mid ? 24*14 : GRACE_H;   // AI powers leave a compact power alone for three weeks, a medium one for two, the rest for eight days
const inGrace = o => o >= 0 && S.hour < graceFor(o);
// may AI nation a not yet declare war on nation b? The classic world: b's own grace (three weeks for a small power). The nations world: 8 days
// for everyone, 21 days when the attacker stands two or more tiers above its victim (S against B or C, A against C)
const graceOn = (a, b) => S.nations[a].tier ? S.hour < (tierGap(S.nations[a].tier, S.nations[b].tier) >= 2 ? 24*21 : GRACE_H) : inGrace(b);
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
// (war damage v: the province's people fall by 0.12% a point (a Bunker spares the people its level's share, bunkerRed), and each point adds half a
// point of civilian casualties there (S.cas, at most MOR.casMax; they lower its morale target and fade by a third a day: moraleDay). S.dmg keeps
// the damage on record (it heals 2.5 a day); it no longer lowers morale itself (docs/REBELS-PLAN.md 2.5)
function warDamage(p, v){ if (G.P[p].sea) return; S.dmg = S.dmg || G.P.map(() => 0); S.dmg[p] = Math.min(70, (S.dmg[p] || 0) + v); S.pop = S.pop || G.P.map(P => P.pop0); S.pop[p] = Math.max(0.02, S.pop[p]*(1 - v*0.0012*(1 - bunkerRed(bunkerLv(p)))));
  const C = S.cas || (S.cas = {}); C[p] = Math.min(MOR.casMax, (C[p] || 0) + v*MOR.casK); }
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
  for (const p of ownedBy(n)){ const y = provYield(p); provs += admW(p);   // (occupied land counts a quarter, annexed land a half: MOR.occAdm, MOR.anxAdm)
    const m = (S.home[p] === n ? boost : 1)*capHit;
    // (a catch-up below 1 holds money back in full and goods by its square root only: a big country keeps about the goods of the others)
    const mg = boost < 1 && S.home[p] === n ? Math.sqrt(boost)*capHit : m;
    for (const k in g) g[k] += y[k]*(k === 'cash' ? m : k === 'mp' ? (bM != null ? (S.home[p] === n ? bM : 1)*capHit : m) : mg); if (N0.capital === p){ const c = ECO_CAPITAL, rs = N0.reserve; for (const k in c) g[k] += c[k]*(rs && rs.includes(k) ? ECO_RESERVE : 1); } }   // the capital: state industry, labs and recycling (a nations-world reserve doubles a good its cities lack)
  const eff = Math.max(0.6, Math.min(1.6, 80/(40 + provs)));   // administration: large empires run less efficiently (provs: homeland 1, annexed 0.5, occupied 0.25 a province)
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
function postOffer(n, k, qty, price, type = 'sell', priv = false){ const N = S.nations[n]; if (!(price > 0) || !(qty > 0) || !MKT_BASE[k]) return 0;   // (market goods only)
  qty = kFloor(qty);   // whole lots of MKT_LOT units, priced per lot
  if (type === 'sell'){ qty = Math.min(qty, kFloor(N[k])); if (qty <= 0) return 0; N[k] -= qty; }
  else { qty = Math.min(qty, lotsFor(N.cash, price)); if (qty <= 0) return 0; N.cash -= lotCash(qty, price); }
  (S.book || (S.book = [])).push({id:S.nid++, type, seller:n, res:k, qty, q0:qty, price:+price.toFixed(2), exp:S.hour + 72, priv:priv ? blocIdOf(n) : null}); return qty; }
/* ---------------- Occupation, morale, annexing and rebels (owner points 8-11, 2026-11-25; docs/REBELS-PLAN.md; the numbers: MOR in rules/data.js) ----------------
   Every land province has a morale (S.mor, by province), 70 at the start of a game. Once a day, at the day change after the day's output is paid
   (moraleDay), it moves an eighth of the way toward its target: the base for what the province is to its holder (homeland city 90, annexed city 75,
   occupied city 60, any countryside 100) plus the modifiers (morTarget; morFactors lists them for the city panel). Output follows morale as before
   (provYield: 45% at 0, 100% at full) times the holder's status (occFactor: 100% homeland, 50% annexed, 25% occupied). An occupied city cannot
   mobilize units (rules/production.js mobBlock). Annex City (annexCity, a construction in the city's one slot, priced by its size) turns it into an
   annexed city, with the occupied countryside around it; a capture takes the status away. A city showing 33% or less burns and may rise in revolt
   at the day change (rebelRolls: 0% at 33, 50% at 25, 100% at 10, halved for each of the holder's ground units there). The rebels fight any
   troops in the city in an ordinary battle (the troops count as dug in: +25% in a city); an empty city, or one whose troops are gone, goes over to
   them at once (rebelFlip: back to its own country, or independent). The countryside never rebels. */
// morale of province p (stored to two decimals, so the plan's worked example holds: 25 toward 55 shows 29, 32, 35, 37, 40, 42) and the whole number
// the player sees, which every threshold reads (33, 40, 100)
const morOf = p => { const m = S.mor ? S.mor[p] : null; return m == null ? MOR.start : m; };
const morShown = p => Math.round(morOf(p));
const moraleOf = morOf;
function setMor(p, v){ if (!S.mor) S.mor = G.P.map(P => P.sea ? 0 : MOR.start); S.mor[p] = Math.round(Math.max(0, Math.min(100, v))*100)/100; }
const casOf = p => (S.cas && S.cas[p]) || 0;
const placeNm = p => G.P[p].cityName || G.P[p].name;
// the status of province p for its holder: 'home' (its homeland), 'anx' (annexed by it), 'occ' (occupied), 'free' (independent land, the sea)
const occSt = p => { const o = S.owner[p]; if (!(o >= 0) || G.P[p].sea) return 'free'; if (S.home[p] === o) return 'home'; return S.anx && S.anx[p] === o ? 'anx' : 'occ'; };
// the share of its output the holder gets, and the weight it has in the holder's administration factor (income0)
const occFactor = p => { const s = occSt(p); return s === 'occ' ? MOR.occOut : s === 'anx' ? MOR.anxOut : 1; };
const admW = p => { const s = occSt(p); return s === 'occ' ? MOR.occAdm : s === 'anx' ? MOR.anxAdm : 1; };
// straight-line (great circle) distance in km between two provinces (question 2: the distance to the capital)
let KMC = {G:null, lon:null};
const lonP = p => { if (KMC.G !== G) KMC = {G, lon:G.P.map(P => ((((P.cc % W) + 0.5)/W*360 + WORLD.lon0) + 540) % 360 - 180)}; return KMC.lon[p]; };
function gcKm(p, q){ if (p === q || !(q >= 0)) return 0; const r = Math.PI/180, la1 = G.P[p].lat*r, la2 = G.P[q].lat*r, dl = (lonP(q) - lonP(p))*r;
  const h = Math.pow(Math.sin((la2 - la1)/2), 2) + Math.cos(la1)*Math.cos(la2)*Math.pow(Math.sin(dl/2), 2); return 2*6371*Math.asin(Math.min(1, Math.sqrt(h))); }
const kmMod = km => -Math.min(MOR.kmMax, MOR.kmStep*Math.round(km/MOR.kmUnit));
// rebels standing in one of nation n's cities (they count as one more war: question 9)
function rebelWar(n){ for (const a of S.armies) if (a.rebel && a.to === null && S.owner[a.at] === n && count(a) > 0) return 1; return 0; }
// what the same for every province of nation n: the wars, the shortage, the capital lost, the capital of the moment, Mobilisation.
// peace: the peacetime figures (no war, no shortage), for the opening calibration (morPeace)
function natMor(n, peace = false){ const N = S.nations[n], c0 = N.cap0 != null ? N.cap0 : N.capital, cap = S.owner[N.capital] === n ? N.capital : -1;
  if (peace) return {peace, nw:0, reb:0, wars:0, sh:{}, short:0, capLost:0, c0, cap, mob:0};
  let w = 0; for (const M of S.nations) if (M.alive && M.id !== n && atWar(n, M.id) && score(M.id) > 0) w++;   // (a nation with no land left, 0 VP, does not count)
  const reb = rebelWar(n), sh = {}; let short = 0; const U = N.shortU; if (U) for (const k in U){ const v = Math.max(MOR.shortMin, Math.round(MOR.shortMax*U[k])); sh[k] = v; short += v; }
  return {peace, nw:w, reb, wars:Math.min(MOR.warMax, MOR.war*(w + reb)), sh, short:Math.min(MOR.shortMax, short), capLost:S.owner[c0] !== n ? MOR.capLost : 0, c0, cap, mob:N.mob || 0}; }
// enemy forces standing in province p (a nation at war with its holder o, or rebels; not marching, not aircraft): list, the forces standing there
const foeHere = (p, o, list) => { for (const a of list || stationaryAt(p)) if (a.at === p && a.to === null && !a.air && !a.fly && count(a) > 0 && (a.rebel || (a.owner >= 0 && a.owner !== o && atWar(o, a.owner)))) return true; return false; };
// the morale target of province p: I its holder's natMor, prev(v) a neighbour's morale as it stood before today's step, here: enemy forces in p.
// rows (optional): every modifier, for the city panel ({k, v, ...}: base, dist, wars, foeNb, lowNb, hiNb, foeHere, short, cas, capLost, cap, bunker, mob)
function morTarget(p, prev, I, rows = null, here = false){ const P = G.P[p], o = S.owner[p], st = occSt(p);
  let t = !P.city ? MOR.rural : st === 'home' ? MOR.home : st === 'anx' ? MOR.anx : MOR.occT;
  if (rows) rows.push({k:'base', v:t, st, city:!!P.city});
  const add = (k, v, x) => { t += v; if (rows) rows.push(x ? Object.assign({k, v}, x) : {k, v}); };
  const km = gcKm(p, I.cap); add('dist', kmMod(km), {km:Math.round(km), cap:I.cap});
  add('wars', -I.wars, {n:I.nw, reb:I.reb});
  let fn = 0, lc = 0, lr = 0, hc = 0, hr = 0;
  for (const v of P.nbs){ const Q = G.P[v]; if (Q.sea) continue; const ov = S.owner[v];
    if (ov === o){ const m = Math.round(prev(v)); if (m <= MOR.low){ if (Q.city) lc++; else lr++; } else if (m >= 100){ if (Q.city) hc++; else hr++; } }
    else if (!I.peace && ov >= 0 && atWar(o, ov)) fn++; }   // (independent land is not a nation: question 6)
  add('foeNb', -MOR.foeNb*fn, {n:fn});
  add('lowNb', -(MOR.lowC*lc + MOR.lowR*lr), {c:lc, r:lr});
  add('hiNb', MOR.hiC*hc + MOR.hiR*hr, {c:hc, r:hr});
  add('foeHere', here ? -MOR.foeHere : 0);
  add('short', -I.short, {sh:I.sh});
  const cs = I.peace ? 0 : casOf(p); add('cas', -Math.round(cs), {cas:Math.round(cs*10)/10});
  add('capLost', -I.capLost, {c0:I.c0});
  add('cap', p === I.cap ? MOR.cap : 0);
  const bl = bunkerLv(p); add('bunker', MOR.bunk[bl] || 0, {lv:bl});
  add('mob', st === 'home' ? -MOR.mob*I.mob : 0, {lv:I.mob});
  return Math.max(0, Math.min(100, t)); }
// the city panel's morale factors list (any land province held by a nation): morale, target, the daily move, every modifier (rows), status, output
// and, for a city, the rebel chance at the day change (before and after the troop rule)
function morFactors(p){ const o = S.owner[p], P = G.P[p]; if (!P || P.sea || !(o >= 0)) return null;
  const rows = [], T = morTarget(p, morOf, natMor(o), rows, foeHere(p, o)), m = morOf(p), sh = Math.round(m), g = P.city ? garrisonOf(p, o) : 0;
  return {mor:m, shown:sh, target:T, step:Math.round((T - m)/MOR.rate*10)/10, rows, st:occSt(p), out:occFactor(p), link:0.45 + 0.55*m/100,
    burning:!!P.city && sh <= MOR.rebelAt, chance0:P.city ? rebelChance(sh) : 0, chance:P.city ? rebelOdds(p, o) : 0, units:g, size:P.city ? rebelSize(p) : 0, rebels:!!rebelsAt(p)}; }
// the morale every province would settle at in peace (no war, shortage or casualties): the daily step run `days` times from today's morale, on a
// copy. The opening calibration of the catch-up multipliers reads incomes at these values, not at the starting 70 (docs/REBELS-PLAN.md 2.6)
function morPeace(days = 120){ const L = G.P.length, m = S.mor ? S.mor.slice() : G.P.map(P => P.sea ? 0 : MOR.start), I = new Map(), info = o => I.get(o) || I.set(o, natMor(o, true)).get(o);
  for (let d = 0; d < days; d++){ const prev = m.slice(), pv = v => prev[v];
    for (let p = 0; p < L; p++){ const o = S.owner[p]; if (G.P[p].sea || !(o >= 0)) continue; const T = morTarget(p, pv, info(o)); m[p] = Math.round((prev[p] + (T - prev[p])/MOR.rate)*100)/100; } }
  return m; }
// fn() with every province at its peacetime morale (morPeace), the incomes worked out afresh before and after
function atPeaceMor(fn){ const keep = S.mor; S.mor = morPeace(); INCC.v = -1; try { return fn(); } finally { S.mor = keep; INCC.v = -1; } }
// the day change: each land province held by a nation moves an eighth of the way to its target; then the casualties fade, and the cities that
// burn roll for rebels. A seat is told when one of its cities starts burning (once each time it falls to 33%)
function moraleDay(){ if (!S.mor) S.mor = G.P.map(P => P.sea ? 0 : MOR.start);
  const I = new Map(), info = o => I.get(o) || I.set(o, natMor(o)).get(o), prev = S.mor.slice(), pv = v => prev[v], by = index();
  for (let p = 0; p < G.P.length; p++){ const P = G.P[p], o = S.owner[p]; if (P.sea || !(o >= 0)) continue;
    const T = morTarget(p, pv, info(o), null, foeHere(p, o, by[p])); setMor(p, prev[p] + (T - prev[p])/MOR.rate);
    if (P.city && isSeat(o) && Math.round(prev[p]) > MOR.rebelAt && morShown(p) <= MOR.rebelAt) tell(o, `${placeNm(p)} is burning: morale ${morShown(p)}%. If it falls further, rebels may rise at the day change (6% at 32%, 50% at 25%), halved for each of your units there. Station troops, or annex it.`, 'bad', p); }
  if (S.cas) for (const k in S.cas){ const v = S.cas[k]*MOR.casFade; if (v < 0.05) delete S.cas[k]; else S.cas[k] = Math.round(v*1000)/1000; }
  rebelRolls(); }
// the size band of a city by its people (0 a town under 1.5 million, 1 a city, 2 a large city from 5 million, 3 a metropolis from 20 million):
// the rebels' number and the price of Annex City
const rebelBand = p => { const pp = popOf(p); return pp >= 20 ? 3 : pp >= 5 ? 2 : pp >= 1.5 ? 1 : 0; };
const rebelSize = p => REBEL_SIZE[rebelBand(p)];
// nation o's ground units standing in province p (not marching, not in the air)
function garrisonOf(p, o){ let s = 0; for (const a of byAt(p) || S.armies) if (a.owner === o && a.at === p && a.to === null && !a.fly && !a.air && !a.rebel) s += groundN(a); return s; }
const rebelsAt = p => { for (const a of byAt(p) || S.armies) if (a.rebel && a.at === p && count(a) > 0) return a; return null; };
// the holder's ground force a standing in its own city with a live rising (an S.rbl entry) whose only foes there are rebels: it holds the city (it
// loses no battle morale and never breaks or retreats), so the fight is decided by strength, the holder dug in (+25%; owner's points 8 and 10)
function risingHold(a){ if (a.owner < 0 || a.air || a.fly || a.to !== null || a.rebel || !S.rbl || !S.rbl.length) return false; const p = a.at;
  if (S.owner[p] !== a.owner || !S.rbl.some(e => e.p === p && e.o === a.owner)) return false;
  for (const b of byAt(p) || S.armies) if (b.at === p && b.to === null && !b.rebel && b.owner !== a.owner && count(b) > 0 && atWar(a.owner, b.owner)) return false;
  return true; }
// the chance of a rising at morale m (the whole number shown): 0 at 33, 50% at 25 (6.25 points a point), then 50% to 100% at 10 (question 1)
const rebelChance = m => m > MOR.rebelAt ? 0 : m >= MOR.rebel25 ? 0.5*(MOR.rebelAt - m)/(MOR.rebelAt - MOR.rebel25) : m <= MOR.sure ? 1 : 0.5 + 0.5*(MOR.rebel25 - m)/(MOR.rebel25 - MOR.sure);
// the chance tonight in city p of nation o: halved for each of o's ground units standing there (question 1)
const rebelOdds = (p, o) => rebelChance(morShown(p))*Math.pow(0.5, garrisonOf(p, o));
// the day change's rolls (none in the first 24 hours after an old save was converted: S.rbG): every city held by a nation that shows 33% or less and has no rebels in it already, in province order, one die each
function rebelRolls(){ if (S.rbG != null){ if (S.hour < S.rbG) return; delete S.rbG; }   // (an old save just converted: no rising before a full day has passed, moraleMigrate)
  for (let p = 0; p < G.P.length; p++){ const P = G.P[p], o = S.owner[p]; if (!P.city || !(o >= 0) || morShown(p) > MOR.rebelAt || rebelsAt(p)) continue;
    const ch = rebelOdds(p, o); if (ch > 0 && rng() < ch) rebelRise(p, o); }
  removeEmpty(); }
// the holder's forces standing in p count as dug in against the rebels, however long they have stood there (the owner's +25% in a city)
function rebelDig(p, o){ for (const a of byAt(p) || S.armies) if (a.owner === o && a.at === p && a.to === null && !a.air && !a.fly && (a.still == null || S.hour - a.still < DIG_H)) a.still = S.hour - DIG_H; }
// rebels rise in city p of nation o: they fight its troops there, or take the city at once when it has none
function rebelRise(p, o){ const n = rebelSize(p), g = garrisonOf(p, o), nm = placeNm(p); IM.emit('rising', p, o, n, g);
  if (!g){ rebelFlip(p, o, n, 'empty'); return null; }
  const r = addArmy(NEUTRAL, p, {inf:n}); r.rebel = true; (S.rbl || (S.rbl = [])).push({id:r.id, p, o}); rebelDig(p, o);
  if (isSeat(o)) tell(o, `Rebels rose up in ${nm} (${n} units)! Your ${g} unit${g > 1 ? 's' : ''} there ${g > 1 ? 'are' : 'is'} fighting them.`, 'bad', p);
  const h = S.home[p]; if (h >= 0 && h !== o && isSeat(h)) tell(h, `Rebels rose up against ${nationName(o)} in ${nm}, a city of yours it holds.`, 'info', p);
  return r; }
// city p of nation o goes over to the rebels (n of them): back to its own country (S.home) if that still exists and is not o (the rebels become
// its troops, at least 2 infantry; its morale is that of land liberated), otherwise independent (the rebels stay as its garrison). As on a
// capture: the production queue and any construction are lost (an annexing too, with its cost), the Bunker loses a level, air wings escape
function rebelFlip(p, o, n, how){ const nm = placeNm(p), home = S.home[p], to = home >= 0 && home !== o && S.nations[home] && S.nations[home].alive ? home : NEUTRAL, c = S.cons[p];
  S.owner[p] = to; ownChanged(); S.cap[p] = null; S.queue[p] = []; S.cons[p] = null; S.bld[p].fort = Math.max(0, (S.bld[p].fort || 0) - 1); bunkerFull(p);
  if (S.occ) S.occ[p] = null; if (S.anx) delete S.anx[p]; if (to >= 0) setMor(p, MOR.lib);
  let left = false; for (const a of S.armies) if (a.rebel && a.at === p && count(a) > 0){ if (to >= 0){ for (const t of UT){ a.u[t] = 0; a.w[t] = 0; } } else { delete a.rebel; left = true; } }
  if (to >= 0) addArmy(to, p, {inf:Math.max(2, n)}); else if (!left) addArmy(NEUTRAL, p, {inf:n});
  wingsFlee(p, to); geoChanged(); IM.emit('rebelFlip', p, o, to, how);
  if (isSeat(o)){ bump(o, 'lost'); tell(o, how === 'fought' ? `The rebels destroyed your garrison and took ${nm}.${to >= 0 ? ` It has gone back to ${S.nations[to].name}.` : ' It is independent now.'} Retake it with an ordinary attack.`
    : `Rebels rose up in ${nm} (${n} units) and took the empty city. ${to >= 0 ? `It has gone back to ${S.nations[to].name}.` : 'It is independent now.'} Retake it with an ordinary attack.`, 'bad', p);
    if (c && c.k === 'annex') tell(o, `The annexing of ${nm} was lost with the city.`, 'bad', p); }
  if (isSeat(to)) tell(to, `Rebels liberated ${nm}: it is yours again.`, 'good', p);
  checkNation(o); }
// every hour: a rising whose rebels are gone was crushed; rebels standing in a city whose holder has no ground unit there any more take it at once
// (an old save's partisans once wait until a.rbH: moraleMigrate); the holder's troops there keep counting as dug in
function rebelHour(){
  if (S.rbl && S.rbl.length) S.rbl = S.rbl.filter(e => { if (S.owner[e.p] !== e.o) return false; const a = armyById(e.id); if (a && a.rebel && count(a) > 0) return true;
    IM.emit('rebelsCrushed', e.p, e.o); if (isSeat(e.o)) tell(e.o, `Your troops crushed the rebels in ${placeNm(e.p)}.`, 'good', e.p); return false; });
  const flip = [];
  for (const a of S.armies){ if (!a.rebel || a.to !== null || !count(a)) continue; const p = a.at, o = S.owner[p];
    if (!(o >= 0)){ delete a.rebel; continue; }   // (independent land already: they are its garrison)
    if (garrisonOf(p, o) > 0){ rebelDig(p, o); continue; }
    if (a.rbH != null && S.hour < a.rbH) continue;
    flip.push(a); }
  for (const a of flip){ const p = a.at, o = S.owner[p]; if (!(o >= 0) || !a.rebel || !count(a)) continue; rebelFlip(p, o, count(a), S.rbl && S.rbl.some(e => e.id === a.id) ? 'fought' : 'empty'); }
  removeEmpty(); }
// air wings based in a province that changed hands escape to their nation's nearest airbase, or are destroyed on the ground (a capture, a revolt)
function wingsFlee(p, O){ for (const w of S.armies){ if (!w.air || w.fly || w.air.base !== p || w.owner === O) continue; const nb = nearestAirbase(w.owner, p);
    if (nb >= 0 && nb !== p){ w.air.base = nb; atMove(w, nb); w.air.cd = 4; if (isSeat(w.owner)) tell(w.owner, `Your air wing escaped from ${placeNm(p)} to ${placeNm(nb)}.`, 'info', nb); }
    else { for (const t of UT) w.u[t] = 0; if (isSeat(w.owner)) tell(w.owner, `Your air wing was destroyed on the ground at ${placeNm(p)}.`, 'bad', p); } } }
// a province changes hands by force (a capture, the land of a fallen nation passed on): its holder's homeland taken back is liberated (55), any
// other land is occupied (25); an annexed status goes with the old holder
function morCaptured(p, O){ if (S.anx) delete S.anx[p]; setMor(p, S.home[p] === O ? MOR.lib : MOR.occ); }
// land received by a treaty, a sale or a gift (questions 3 and 5): the receiver's own homeland is handed back (liberated, 55); any other land arrives
// annexed (its morale as it was)
function landGiven(p, to){ if (S.occ) S.occ[p] = null; if (S.anx) delete S.anx[p];
  { const c = S.cons[p]; if (c && c.k === 'annex'){ const N = S.nations[c.o]; S.cons[p] = null; if (N){ N.cash += c.cash || 0; N.mp += c.mp || 0; if (isSeat(c.o)) tell(c.o, `The annexing of ${placeNm(p)} changed hands by treaty or sale: the annexing under way there was called off and its $${c.cash}M and ${c.mp}k manpower refunded.`, 'info', p); } } }   // (an annexing under way is pointless now: refunded to whoever paid)
  if (S.home[p] === to) setMor(p, MOR.lib); else (S.anx || (S.anx = {}))[p] = to; }
/* ---- Annex City (point 8): a construction in the city's one slot (S.cons[p] = {k:'annex', o, h, h0, cash, mp}), ANNEX_COST by the city's size
   band, paid when it starts; any time, even while the city burns, rebels are in it or it is under attack. It ends with S.anx[p] = the holder, and the
   holder's occupied countryside provinces taken from the same country whose nearest city it is are annexed with it (question 4). A capture or a
   revolt loses it with its cost (S.cons is cleared). */
const annexCost = p => { const c = ANNEX_COST[rebelBand(p)]; return {cash:c.cash, mp:c.mp, days:c.days, h:c.days*24}; };
// why nation n may not annex city p now ('' when it may): the page's button and the computer, one checked order
function annexWhy(n, p){ const P = G.P[p]; if (!P || P.sea || S.owner[p] !== n) return 'not your city'; if (!P.city) return 'only a city can be annexed';
  const st = occSt(p); if (st === 'home') return 'it is part of your homeland'; if (st === 'anx') return 'it is annexed already';
  const c = S.cons[p]; if (c) return c.k === 'annex' ? 'it is being annexed' : `the city is building ${artA(consB(c.k).name)}`;
  const k = annexCost(p), N = S.nations[n]; if (N.cash < k.cash) return `needs $${k.cash}M`; if (N.mp < k.mp) return `needs ${k.mp}k manpower`; return ''; }
function annexCity(n, p){ if (annexWhy(n, p)) return false; const k = annexCost(p), N = S.nations[n]; N.cash -= k.cash; N.mp -= k.mp;
  S.cons[p] = {k:'annex', lvl:1, o:n, h:k.h, h0:k.h, cash:k.cash, mp:k.mp}; IM.emit('annexStart', p, n);
  if (isSeat(n)) tell(n, `Annexing ${placeNm(p)}: done in ${k.days} days.`, 'info', p); return true; }
// the city nearest to province q (straight line on the map)
function nearestCity(q){ const Q = G.P[q]; let best = -1, bd = Infinity; for (const P of G.P){ if (!P.city) continue; const d = kmBetween(P.x, P.y, Q.x, Q.y); if (d < bd){ bd = d; best = P.id; } } return best; }
function annexDone(p){ const n = S.owner[p], A = S.anx || (S.anx = {}); S.cons[p] = null; A[p] = n; let k = 0;
  for (const q of ownedBy(n)) if (!G.P[q].city && occSt(q) === 'occ' && S.home[q] === S.home[p] && nearestCity(q) === p){ A[q] = n; k++; }
  INCC.v = -1; IM.emit('annexed', p, n, k);
  if (isSeat(n)) tell(n, `${placeNm(p)} is annexed: 50% output, units can be mobilized there${k ? `, and ${k} countryside province${k > 1 ? 's' : ''} around it ${k > 1 ? 'are' : 'is'} annexed with it` : ''}.`, 'good', p); }
