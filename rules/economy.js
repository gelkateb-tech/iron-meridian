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
  for (const k of MKT_K){ if (!(M.p[k] > 0)) M.p[k] = MKT_BASE[k]; if (!(M.prev[k] > 0)) M.prev[k] = M.p[k]; if (!Array.isArray(M.hist[k])) M.hist[k] = []; if (typeof M.press[k] !== 'number') M.press[k] = 0; }
  if (!M.hg && M.hist[MKT_K[0]].length) histSeed(M); }   // (a save from before the whole-game history: the days it kept)
// the whole game's world prices for the Market's chart (M.hist keeps the last 60 days for the AI): M.hg = {d0, st, oil:[cents...], ...}, one point
// every st days from day d0 (dayOf); past 360 points neighbouring pairs are averaged and st doubles (a long game costs about 7 KB at most).
// pend holds the days of a point still being summed. An old save starts from the M.hist it has (histSeed)
function histSeed(M){ const L = (M.hist[MKT_K[0]] || []).length, H = M.hg = {d0:dayOf(S.hour) - L + 1, st:1}; for (const k of MKT_K) H[k] = (M.hist[k] || []).slice(-L).map(v => Math.round(v*100)); return H; }
function histDay(M){ if (!M.hg){ if (M.hist[MKT_K[0]].length > 1) histSeed(M); else { const H = M.hg = {d0:dayOf(S.hour) - 1, st:1}; for (const k of MKT_K) H[k] = [Math.round(M.prev[k]*100), Math.round(M.p[k]*100)]; } return; }
  const H = M.hg, P = H.pend || (H.pend = {c:0, s:{}}); P.c++; for (const k of MKT_K) P.s[k] = (P.s[k] || 0) + Math.round(M.p[k]*100);
  if (P.c < H.st) return; for (const k of MKT_K) (H[k] || (H[k] = [])).push(Math.round(P.s[k]/P.c)); delete H.pend;
  if (H[MKT_K[0]].length >= 360){ for (const k of MKT_K){ const a = H[k], b = []; for (let i = 0; i + 1 < a.length; i += 2) b.push(Math.round((a[i] + a[i + 1])/2)); H[k] = b; } H.st *= 2; } }
// (the page's reader) good k's world price over the game: [{d, p}], d the first day of the point, p in $M per MKT_LOT units
function worldHistory(k){ const H = S.mkt && S.mkt.hg; if (!H || !Array.isArray(H[k])) return []; const out = H[k].map((c, i) => ({d:H.d0 + i*H.st, p:c/100}));
  if (H.pend && H.pend.c && H.pend.s[k] != null) out.push({d:H.d0 + H[k].length*H.st, p:H.pend.s[k]/H.pend.c/100}); return out; }
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
// nation n buys (qty > 0) or sells (qty < 0), in whole lots of MKT_LOT units; returns the units traded. A computer nation trades on the order book
// first (ECO-9: goods and money pass between nations): a buy takes sell offers priced at most what the world would charge it (buyPrice), cheapest
// first; a sale fills buy offers paying at least what the world would pay it (sellPrice), highest first, up to each buyer's free storage. Only the
// rest goes to the anonymous world market (tradeWorld). The same exclusions as every order-book deal: never an enemy, never across an embargo.
// (a seat trades on the world market directly; no button of the page does today)
function trade(n, k, qty){ qty = Math.trunc(qty/MKT_LOT)*MKT_LOT; if (!qty) return 0; if (isSeat(n)) return tradeWorld(n, k, qty);
  if (qty > 0){ const got = bookTake(n, k, qty, buyPrice(n, k)); return got + (qty - got >= MKT_LOT ? tradeWorld(n, k, qty - got) : 0); }
  const got = bookHit(n, k, -qty, sellPrice(n, k)); return -got + (-qty - got >= MKT_LOT ? tradeWorld(n, k, qty + got) : 0); }
// the anonymous world market: the money comes from (or goes to) no nation, and the world price moves with the lots traded
function tradeWorld(n, k, qty){ const N = S.nations[n], M = mkt(); qty = Math.trunc(qty/MKT_LOT)*MKT_LOT;
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
  histDay(M);
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
// the order of the queue: sell offers cheapest first, buy offers highest first, the older offer first at one price
const byAsk = (x, y) => x.price - y.price || x.id - y.id, byBid = (x, y) => y.price - x.price || x.id - y.id;
// may nation n trade with offer o (not its own, its maker alive, no war and no embargo either way, visible to n)?
const bookOK = (n, o) => o.seller !== n && S.nations[o.seller].alive && !atWar(n, o.seller) && !embargoed(o.seller, n) && canSee(o, n);
// a deterministic jitter in [0, 1) for the computer's offers (no rng(): the rolls the rules already make stay where they are)
const mkH = (a, b, c) => { let h = (a*73856093) ^ (b*19349663) ^ (c*83492791); h = Math.imul(h ^ (h >>> 13), 0x5bd1e995); return ((h ^ (h >>> 15)) >>> 0)/4294967296; };
// r units of offer o went to (or came from) nation n at price pr: the offer's maker is told when it is a seat; a computer seller's ask price
// steps back up (mkU); an offer from before q0 was kept learns it had a sale
function bookNote(o, n, r, pr = o.price){ const B = S.nations[o.seller]; if (o.q0 == null) o.q0 = o.qty + r;
  if (!isBid(o) && B.mkU && B.mkU[o.res]) mkStep(B, o.res, false);
  if (isSeat(o.seller)) tell(o.seller, isBid(o) ? `${S.nations[n].name} sold you ${fmt(r)} ${rlbl(o.res)} through your buy offer for $${fmt(lotCash(r, pr))}M.` : `${S.nations[n].name} bought ${fmt(r)} ${rlbl(o.res)} from your offer for $${fmt(lotCash(r, pr))}M.`, 'good', null); }
// a computer nation's sell offer of good k that ran out unsold makes its next one 5% cheaper (six steps at most, never below 0.72x); a sale resets it
function mkStep(N, k, unsold){ const U = N.mkU || (N.mkU = {}); if (unsold) U[k] = Math.min(6, (U[k] || 0) + 1); else delete U[k]; if (!Object.keys(U).length) delete N.mkU; }
// a computer nation buys up to q units of good k from sell offers priced at most maxP (cheapest first); returns what it got
function bookTake(n, k, q, maxP){ const N = S.nations[n]; let got = 0;
  for (const o of (S.book || []).filter(o => !isBid(o) && o.res === k && o.qty > 0 && o.price <= maxP && bookOK(n, o)).sort(byAsk)){
    const r = Math.min(q - got, o.qty, lotsFor(N.cash, o.price), kFloor(stockCap(n) - N[k])); if (r <= 0) break;
    N.cash -= lotCash(r, o.price); N[k] += r; S.nations[o.seller].cash += lotCash(r, o.price); o.qty -= r; got += r; bookNote(o, n, r);
    if (got >= q) break; }
  if (got) S.book = S.book.filter(o => o.qty > 0); return got; }
// a computer nation sells up to q units of good k into buy offers paying at least minP (highest first), each up to its buyer's free storage
function bookHit(n, k, q, minP){ const N = S.nations[n]; let got = 0;
  for (const o of (S.book || []).filter(o => isBid(o) && o.res === k && o.qty > 0 && o.price >= minP && bookOK(n, o)).sort(byBid)){
    const B = S.nations[o.seller], r = Math.min(q - got, o.qty, kFloor(N[k]), kFloor(stockCap(o.seller) - B[k])); if (kFloor(N[k]) <= 0) break; if (r <= 0) continue;
    N[k] -= r; N.cash += lotCash(r, o.price); B[k] += r; o.qty -= r; got += r; bookNote(o, n, r);
    if (got >= q) break; }
  if (got) S.book = S.book.filter(o => o.qty > 0); return got; }
// AI order-book thresholds: other AIs' sell listings filled below AI_NEED (metal for units and buildings above all, rare materials for research)
const AI_NEED = resK({oil:220, metal:140, iron:220, elec:160, rare:160});
// a computer nation short of a good posts a buy offer below BID_LINE plus 12 days of its upkeep of it, when it has the money above its floor (aiFloor:
// $40M or two days of its money upkeep): up to 40 lots at 0.90-1.06x the world price, dearer the shorter it is, with at most 40% of the money it can spare
const BID_LINE = resK({oil:120, metal:120, iron:110, elec:80, rare:90});
const bidLine = (N, k) => BID_LINE[k] + 12*Math.max(0, income(N.id).upkeep[k]), aiFloor = N => Math.max(40, 2*income(N.id).upkeep.cash);
// stocks listed for sale from BOOK_HI down to BOOK_LO (and 55% / 35% of the storage cap): oil from 600, a metal hoard from 900, iron from 300, electronics from 260, rare materials from 240
// (oil: the producers' surplus reaches the importers short of fuel through the order book instead of piling up at home)
const BOOK_HI = resK({oil:600, metal:900, iron:300, elec:260, rare:240}), BOOK_LO = resK({oil:380, metal:600, iron:200, elec:170, rare:150});
// The order book's day. Every computer offer is funded (goods or money held) and goes back to its maker when it expires; nothing is made or lost here.
// 1. expiry; 2. a computer nation under $5M withdraws its standing and depth bids; 3. computer listings (surplus asks, shortage bids); 4. each
// computer nation's standing bid (aiAllowance); 5. crossing offers match (a seat's too, against a computer's); 6. computer nations short of a good take
// asks; 7. computer holders sell into bids; 8. the depth floor (depthFloor): at least 3 computer offers on each side of every good
function bookDay(){ const M = mkt(); S.book = (S.book || []).filter(o => o.qty > 0 && S.nations[o.seller].alive); for (const o of S.book) o.priv = null;
  // expired listings: goods (sell) or money (buy) go back to their owner
  for (const o of S.book) if (o.exp <= S.hour){ const N = S.nations[o.seller]; if (isBid(o)) N.cash += lotCash(o.qty, o.price); else { N[o.res] += o.qty; if (!isSeat(o.seller) && !o.depth) mkStep(N, o.res, o.qty >= (o.q0 || o.qty)); }
    // a seat is told what lapsed and what came back: the goods of a sell offer, the money held for a buy offer
    if (isSeat(o.seller)){ const q = fmt(o.qty), g = rlbl(o.res), part = o.q0 > o.qty ? ` (${fmt(o.q0 - o.qty)} of the ${fmt(o.q0)} were ${isBid(o) ? 'bought' : 'sold'})` : '', full = !isBid(o) && N[o.res] > stockCap(o.seller);
      tell(o.seller, isBid(o) ? `Your buy offer for ${q} ${g} at ${lotPriceTxt(o.res, o.price)} expired unfilled${part}. The $${fmt(lotCash(o.qty, o.price))}M held for it is back in your treasury.`
        : `Your sell offer of ${q} ${g} at ${lotPriceTxt(o.res, o.price)} expired unsold${part}. The ${q} ${g} are back in your stock${full ? ', which is now over your storage limit: use or sell them before the next day, or the excess is lost' : ''}.`, 'info', null); }
    o.qty = 0; }
  // a computer nation nearly out of money takes back the money held in its standing and depth bids
  for (const o of S.book) if (o.qty > 0 && isBid(o) && (o.stock || o.depth) && S.nations[o.seller].cash < 5){ S.nations[o.seller].cash += lotCash(o.qty, o.price); o.qty = 0; }
  S.book = S.book.filter(o => o.qty > 0);
  // the biggest surplus first (a nation holds at most five listings; standing and depth offers do not count); a hoard well above the line goes in
  // bigger lots (up to 250) and a little cheaper, so a rare-earth giant's stock reaches the nations short of it instead of piling up all game; a good
  // whose last listings ran out unsold is offered 5% cheaper a time (mkStep). Short of a good: a funded buy offer (BID_LINE)
  for (const N of S.nations){ if (!N.alive || isSeat(N.id)) continue; const cap = stockCap(N.id); let mine = S.book.filter(o => o.seller === N.id && !o.stock && !o.depth).length;
    const hiOf = k => Math.min(cap*0.55, BOOK_HI[k] || 1e9);
    for (const k of MKT_K.slice().sort((a, b) => N[b]/hiOf(b) - N[a]/hiOf(a))){ if (mine >= 5) break;
      const hi = hiOf(k), lo = Math.min(cap*0.35, BOOK_LO[k] || 1e9);   // a metal hoard is listed from 900 units (sold nation to nation: no effect on the world price)
      if (N[k] > hi && rng() < 0.45 && !S.book.some(o => o.seller === N.id && o.res === k && !isBid(o))){ const big = N[k] > 2*hi, qty = kRound(Math.min(N[k] - lo, 250*RES_K, (30 + rng()*60)*RES_K + 0.25*(N[k] - hi))); if (qty < 10*RES_K) continue;
        N[k] -= qty; mine++; S.book.push({id:S.nid++, type:'sell', seller:N.id, res:k, qty, q0:qty, price:+(M.p[k]*Math.max(0.72, (big ? 0.86 + rng()*0.18 : 0.92 + rng()*0.25) - 0.05*((N.mkU || {})[k] || 0))).toFixed(2), exp:S.hour + 72}); }
      else if (N[k] < bidLine(N, k) && N.cash - aiFloor(N) > 7.5*M.p[k] && rng() < 0.5 && !S.book.some(o => o.seller === N.id && o.res === k && isBid(o))){ const L = bidLine(N, k), urg = Math.max(0, Math.min(1, 1 - N[k]/L)), price = +(M.p[k]*(0.9 + 0.12*urg + 0.04*mkH(N.id, S.hour, MKT_K.indexOf(k)))).toFixed(2);
        const lots = Math.floor(Math.min(40, (L - N[k])/MKT_LOT, (N.cash - aiFloor(N))*0.4/price, (cap - N[k])/MKT_LOT)), qty = lots*MKT_LOT; if (lots < 3) continue;
        N.cash -= lots*price; mine++; S.book.push({id:S.nid++, type:'buy', seller:N.id, res:k, qty, q0:qty, price, exp:S.hour + 72}); } } }
  aiAllowance();
  // matching between listings (never between nations at war, never across an embargo): a computer nation's buy offer and a sell offer priced at or below
  // it, a seat's offer against a computer nation's alike (the seat is told), never a nation's own two offers nor two seats'; the deal is at the sell
  // offer's price (the buyer gets back what it held above it), up to the buyer's free storage
  for (const bid of S.book.filter(isBid)){ const B = S.nations[bid.seller];
    for (const ask of S.book.filter(o => !isBid(o) && o.res === bid.res && o.qty > 0 && o.price <= bid.price && o.seller !== bid.seller && !(isSeat(o.seller) && isSeat(bid.seller)) && !atWar(o.seller, bid.seller) && !embargoed(o.seller, bid.seller) && canSee(o, bid.seller) && canSee(bid, o.seller)).sort(byAsk)){
      const q = Math.min(bid.qty, ask.qty, kFloor(stockCap(bid.seller) - B[bid.res])); if (q <= 0) break;
      settle(bid.seller, ask.seller, bid.res, q, ask.price); B.cash += lotCash(q, bid.price - ask.price); bid.qty -= q; ask.qty -= q; bookNote(ask, bid.seller, q); bookNote(bid, ask.seller, q, ask.price); } }
  // AIs short of a resource (metal for units and buildings above all) fill sell listings at a fair price (up to 1.15x the world price), another AI's and
  // a seat's alike (the seat is told of each sale); never an enemy's, never across an embargo
  for (const ask of S.book){ if (isBid(ask) || ask.qty <= 0 || ask.price > M.p[ask.res]*1.15) continue;
    for (const N of S.nations){ if (ask.qty <= 0) break; if (!N.alive || isSeat(N.id) || N.id === ask.seller || atWar(N.id, ask.seller) || embargoed(ask.seller, N.id) || !canSee(ask, N.id) || rng() > 0.6) continue;
      // oil: a big consumer keeps about 25 days of fuel; running out of it, a power buys with less money in hand
      const need = aiBookNeed(N, ask), dry = ask.res === 'oil' && N.oil < 80*RES_K && income(N.id).net.oil < 0;
      if (N[ask.res] >= need || N.cash < (dry ? 120 : 230)) continue;
      const q = Math.min(ask.qty, 50*RES_K, lotsFor(N.cash - (dry ? 80 : 160), ask.price), kFloor(stockCap(N.id) - N[ask.res])); if (q < 5*RES_K) continue;
      N.cash -= lotCash(q, ask.price); N[ask.res] += q; S.nations[ask.seller].cash += lotCash(q, ask.price); ask.qty -= q; bookNote(ask, N.id, q); } }
  // computer nations holding plenty (over 120) sell into buy offers, a seat's and another computer nation's alike, down to 80 and never more than the
  // buyer's storage holds: at 0.95x the world price or better for a seat's offer, 0.90x for a computer's; a holder above 70% of its storage cap
  // accepts down to 0.75x (selling beats losing goods at the cap). Never to an enemy, never across an embargo
  for (const o of S.book){ const me = o.seller; if (!isBid(o)) continue;
    for (const N of S.nations){ if (!N.alive || isSeat(N.id) || N.id === me || atWar(N.id, me) || embargoed(N.id, me) || o.qty <= 0 || !canSee(o, N.id) || rng() > 0.5) continue;
      if (N[o.res] < 120*RES_K || o.price < M.p[o.res]*(N[o.res] > 0.7*stockCap(N.id) ? 0.75 : isSeat(me) ? 0.95 : 0.9)) continue;
      const q = Math.min(o.qty, 40*RES_K, kFloor(N[o.res] - 80*RES_K), kFloor(stockCap(me) - S.nations[me][o.res])); if (q < 5*RES_K) continue;
      N[o.res] -= q; N.cash += lotCash(q, o.price); S.nations[me][o.res] += q; o.qty -= q; bookNote(o, N.id, q); } }
  S.book = S.book.filter(o => o.qty > 0);
  depthFloor(false); }
// each computer nation keeps one standing buy offer (stock:1), worth about six hours of its money income (never leaving it under $10M): for the good
// it is shortest of against its line (twice its shortage line or 20 days of upkeep, at most 60% of its storage) at 0.84-0.94x the world price; when it
// is short of nothing, a bargain bid at 0.72-0.80x for a good it has room for (under 75% of its storage), a different good every three days. Up to 40
// lots, re-posted when it is filled or runs out
function aiAllowance(){ const M = mkt();
  for (const N of S.nations){ if (!N.alive || isSeat(N.id) || S.book.some(o => o.seller === N.id && isBid(o) && o.stock)) continue; const cap = stockCap(N.id), inc = income(N.id);
    const line = k => Math.min(0.6*cap, Math.max(2*AI_SHORT[k], 20*Math.max(0, inc.upkeep[k]))); let k = MKT_K.slice().sort((a, b) => N[a]/line(a) - N[b]/line(b) || MKT_K.indexOf(a) - MKT_K.indexOf(b))[0], f, room;
    if (N[k] < line(k)){ f = 0.84 + 0.10*mkH(N.id, S.hour, 7); room = line(k) - N[k]; }
    else { const d = Math.floor(S.hour/72); k = null; for (let i = 0; i < MKT_K.length; i++){ const kk = MKT_K[(N.id + d + i) % MKT_K.length]; if (N[kk] < 0.75*cap){ k = kk; break; } } if (!k) continue; f = 0.72 + 0.08*mkH(N.id, S.hour, 9); room = 0.75*cap - N[k]; }
    const price = +(M.p[k]*f).toFixed(2), V = Math.min(N.cash - 10, 0.25*Math.max(0, inc.gross.cash)), lots = Math.floor(Math.min(V/price, room/MKT_LOT, 40)); if (lots < 2) continue;
    N.cash -= lots*price; S.book.push({id:S.nid++, type:'buy', seller:N.id, res:k, qty:lots*MKT_LOT, q0:lots*MKT_LOT, price, exp:S.hour + 72, stock:1}); } }
// the depth floor: every good has at least 3 computer offers on each side. A side with fewer gets bargain bids (2-8 lots at 0.74-0.82x the world price,
// at most 6% of the bidder's money above $10M) from the richest computer nations with room (under 75% of their storage) and no bid of their own for it,
// and premium asks (1.06-1.16x) from the biggest holders above their shortage line and 15 days of upkeep (a third of that surplus, 10-30K). In the first
// week nobody has a surplus yet (every nation starts below its shortage line): small lots (5-10K, a third of the stock above its low line AI_LOW) at 1.25-1.35x, dear enough that the computer nations
// do not buy them back (they pay 1.15x at most), so a person can buy a little from day 1. Marked depth:1; they do not count toward a nation's five listings. Also run once at the start
// of a game (bookOpen), so the first day's market is not empty. No rng(): the prices are jittered by mkH
function depthFloor(open){ const M = mkt(), AIs = S.nations.filter(N => N.alive && !isSeat(N.id)), early = open || S.hour < 24*7; if (!S.book) S.book = [];
  for (const k of MKT_K){ const ai = o => o.res === k && !isSeat(o.seller); let nb = S.book.filter(o => ai(o) && isBid(o)).length, na = S.book.filter(o => ai(o) && !isBid(o)).length;
    if (nb < 3) for (const N of AIs.slice().sort((a, b) => b.cash - a.cash || a.id - b.id)){ if (nb >= 3) break; const cap = stockCap(N.id); if (N[k] >= 0.75*cap || S.book.some(o => o.seller === N.id && o.res === k && isBid(o))) continue;
      const price = +(M.p[k]*(0.74 + 0.08*mkH(N.id, S.hour, 17))).toFixed(2), lots = Math.floor(Math.min(8, 0.06*(N.cash - 10)/price, (0.75*cap - N[k])/MKT_LOT)); if (lots < 2) continue;
      N.cash -= lots*price; S.book.push({id:S.nid++, type:'buy', seller:N.id, res:k, qty:lots*MKT_LOT, q0:lots*MKT_LOT, price, exp:S.hour + 72, depth:1}); nb++; }
    if (na < 3) for (const N of AIs.slice().sort((a, b) => b[k] - a[k] || a.id - b.id)){ if (na >= 3) break; if (S.book.some(o => o.seller === N.id && o.res === k)) continue;
      const sur = early ? N[k] - AI_LOW[k] : N[k] - AI_SHORT[k] - 15*Math.max(0, income(N.id).upkeep[k]), q = kFloor(Math.min(early ? 10*RES_K : 30*RES_K, sur/3)); if (q < (early ? 5 : 10)*RES_K) continue;
      N[k] -= q; S.book.push({id:S.nid++, type:'sell', seller:N.id, res:k, qty:q, q0:q, price:+(M.p[k]*(early ? 1.25 + 0.10*mkH(N.id, S.hour, 19) : 1.06 + 0.10*mkH(N.id, S.hour, 19))).toFixed(2), exp:S.hour + 72, depth:1}); na++; } } }
// a new game (newGame, rules/state.js): the depth floor, so the Market shows offers from the first hour
function bookOpen(){ mkt(); depthFloor(true); }
// the stock below which an AI takes a sell listing: oil about 25 days of fuel for a big consumer, twice the usual line when the listing is cheap
function aiBookNeed(N, ask){ return (ask.res === 'oil' ? Math.max(AI_NEED.oil, 25*income(N.id).upkeep.oil) : AI_NEED[ask.res] || 70*RES_K)*(ask.price < MKT_BASE[ask.res]*0.85 ? 2 : 1); }
// nation n takes q units of order-book offer id (buys from a sell offer, sells into a buy offer); returns the amount traded. It takes what it asked for,
// the offer, its money and its storage (or its stock and the buyer's storage) allow at most (fillLimit says which)
function fillOffer(n, id, q){ const o = (S.book || []).find(x => x.id === id), N = S.nations[n]; if (!o || o.seller === n || !canSee(o, n)) return 0;
  if (embargoed(o.seller, n)) return 0;   // an embargo either way closes the deal
  if (!Number.isFinite(+q) || !(+q > 0)) return 0; q = kFloor(+q);   // whole lots of MKT_LOT units (no amount, or not a number: nothing)
  if (!isBid(o)){ q = Math.min(q, o.qty, lotsFor(N.cash, o.price), kFloor(stockCap(n) - N[o.res])); if (q <= 0) return 0; N.cash -= lotCash(q, o.price); N[o.res] += q; S.nations[o.seller].cash += lotCash(q, o.price); }
  else { q = Math.min(q, o.qty, kFloor(N[o.res]), kFloor(stockCap(o.seller) - S.nations[o.seller][o.res])); if (q <= 0) return 0; N[o.res] -= q; N.cash += lotCash(q, o.price); S.nations[o.seller][o.res] += q; }
  o.qty -= q; addMem(o.seller, n, 1); if (o.qty <= 0) S.book = S.book.filter(x => x !== o); return q; }
const buyOffer = fillOffer;
// (the page's readers) what nation n can take of offer id now and what limits it: {q, why}, why one of 'offer' (all of it), 'money', 'storage' (n's
// own), 'stock' (what n holds), 'room' (the buyer's storage), 'gone' (no such offer, n's own, or closed to n: war is allowed, an embargo is not)
function fillLimit(n, id){ const o = (S.book || []).find(x => x.id === id), N = S.nations[n]; if (!o || o.seller === n || !canSee(o, n) || embargoed(o.seller, n)) return {q:0, why:'gone'};
  const c = isBid(o) ? [['offer', o.qty], ['stock', kFloor(N[o.res])], ['room', kFloor(stockCap(o.seller) - S.nations[o.seller][o.res])]] : [['offer', o.qty], ['money', lotsFor(N.cash, o.price)], ['storage', kFloor(stockCap(n) - N[o.res])]];
  let b = c[0]; for (const x of c) if (x[1] < b[1]) b = x; return {q:Math.max(0, b[1]), why:b[0]}; }
// the offers nation n can take for good k, best first: side 'ask' the sell offers it can buy from (cheapest first), 'bid' the buy offers it can sell
// to (highest first); not its own, not across an embargo either way (an enemy's are included: the page marks them); cnt 0 = all of them
function topOffers(n, k, side, cnt = 3){ const L = (S.book || []).filter(o => o.res === k && o.qty > 0 && (side === 'bid') === isBid(o) && o.seller !== n && S.nations[o.seller].alive && !embargoed(o.seller, n) && canSee(o, n)).sort(side === 'bid' ? byBid : byAsk); return cnt ? L.slice(0, cnt) : L; }
// nation n withdraws its own offer id: the goods of a sell offer, or the money held for a buy offer, go back to it. Returns the amount withdrawn (0: none)
function cancelOffer(n, id){ const o = (S.book || []).find(x => x.id === id); if (!o || o.seller !== n || !(o.qty > 0)) return 0; const N = S.nations[n], q = o.qty;
  if (isBid(o)) N.cash += lotCash(q, o.price); else N[o.res] += q; S.book = S.book.filter(x => x !== o); return q; }
// nation n posts an offer on the order book; returns the quantity listed (what it holds or can pay for), 0 when nothing was
// (the price is rounded to whole cents first and the money held at that price, so the listing, its fills and its refund all use one price; below BOOK_MIN_PRICE nothing is listed)
const BOOK_MIN_PRICE = 0.01;   // the lowest price per lot an offer can carry ($M per MKT_LOT units)
function postOffer(n, k, qty, price, type = 'sell', priv = false){ const N = S.nations[n]; if (!(price > 0) || !(qty > 0) || !MKT_BASE[k] || (type !== 'sell' && type !== 'buy')) return 0;   // (market goods only; a sell or a buy offer)
  const pr = Math.round(price*100)/100; if (!(pr >= BOOK_MIN_PRICE)) return 0;
  qty = kFloor(qty);   // whole lots of MKT_LOT units, priced per lot
  if (type === 'sell'){ qty = Math.min(qty, kFloor(N[k])); if (qty <= 0) return 0; N[k] -= qty; }
  else { qty = Math.min(qty, lotsFor(N.cash, pr)); if (qty <= 0) return 0; N.cash -= lotCash(qty, pr); }
  (S.book || (S.book = [])).push({id:S.nid++, type, seller:n, res:k, qty, q0:qty, price:pr, exp:S.hour + 72, priv:priv ? blocIdOf(n) : null}); return qty; }
/* ---------------- Occupation unrest ---------------- */
const unrestOf = p => (S.unrest && S.unrest[p]) || 0;
function unrestDay(){
  S.unrest = S.unrest || G.P.map(() => 0);
  // mobilisation strains the home front; long garrisons integrate conquests
  for (const N of S.nations){ if (!N.alive || !N.mob) continue; for (const p of ownedBy(N.id)) if (S.home[p] === N.id) S.unrest[p] = Math.max(unrestOf(p) - 4, Math.min(15*N.mob, unrestOf(p) + 3*N.mob)); }
  S.integ = S.integ || {};
  for (let p = 0; p < G.P.length; p++){ if (G.P[p].sea) continue; const o = S.owner[p], home = S.home[p];
    if (o < 0 || home === o){ if (!(o >= 0 && S.nations[o].mob)) S.unrest[p] = Math.max(0, unrestOf(p) - 4); continue; }
    const garrison = S.armies.reduce((s0, a) => s0 + (a.owner === o && a.at === p && a.to === null && !a.fly ? groundN(a) : 0), 0);
    const ik = p + ':' + o; S.integ[ik] = garrison >= 2 ? (S.integ[ik] || 0) + 1 : Math.max(0, (S.integ[ik] || 0) - 1);
    if (S.integ[ik] >= 10){ S.unrest[p] = Math.min(unrestOf(p), 30); if (S.integ[ik] === 10) tell(o, `${G.P[p].cityName || G.P[p].name} is integrated: unrest there stays below 30%.`, 'good', p); continue; }
    const homeAlive = home >= 0 && S.nations[home].alive, d = (homeAlive ? 5 : 3) + (G.P[p].city ? 2 : 0) - Math.min(9, garrison*1.5);
    const before = unrestOf(p); S.unrest[p] = Math.max(0, Math.min(100, before + d));
    if (isSeat(o) && before <= 50 && S.unrest[p] > 50) tell(o, `${G.P[p].cityName || G.P[p].name} is close to revolt (${Math.round(S.unrest[p])}% unrest): garrison 2+ units there or pacify it.`, 'bad', p);
    if (S.unrest[p] > 60 && rng() < (S.unrest[p] - 60)/160 && !S.armies.some(a => a.rebel && a.at === p)){
      const r = addArmy(NEUTRAL, p, {inf:2 + Math.floor(rng()*3) + (G.P[p].city ? 2 : 0)}); r.rebel = true; S.unrest[p] -= 20;
      if (isSeat(o)) tell(o, `Partisans rose up in ${G.P[p].cityName || G.P[p].name}! Garrison or pacify occupied land to prevent revolts.`, 'bad', p);
    } }
}
function rebelHour(){
  // partisans holding a province alone for a day hand it back to its original nation (or independence)
  for (const a of S.armies){ if (!a.rebel || !count(a) || a.to !== null) continue; const p = a.at;
    if (S.armies.some(b => b !== a && b.at === p && b.to === null && !b.fly && b.owner === S.owner[p] && count(b))){ a.hold = 0; continue; }
    if (++a.hold < 24) continue;
    const prev = S.owner[p], home = S.home[p], to = home >= 0 && S.nations[home].alive && home !== prev ? home : NEUTRAL;
    S.owner[p] = to; ownChanged(); S.cap[p] = null; S.queue[p] = []; S.cons[p] = null; S.unrest[p] = 10; geoChanged(); for (const t of UT) a.u[t] = 0;
    if (to >= 0) addArmy(to, p, {inf:2});
    if (isSeat(prev)) tell(prev, `${G.P[p].cityName || G.P[p].name} revolted and ${to >= 0 ? 'rejoined ' + S.nations[to].name : 'declared independence'}.`, 'bad', p);
    if (isSeat(to)) tell(to, `Partisans liberated ${G.P[p].cityName || G.P[p].name} for you!`, 'good', p);
    if (prev >= 0) checkNation(prev);
  }
  removeEmpty();
}
