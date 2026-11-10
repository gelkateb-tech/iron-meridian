// Iron Meridian rules: tick. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
/* ---------------- Simulation ---------------- */
let tickVer = 0;
function tick(){
  S.hour++; tickVer++;
  /*@DEV*/if (DEV.instant || DEV.research || DEV.res) for (const me of seats()) devHour(me);/*@ENDDEV*/
  // production
  for (let p = 0; p < G.P.length; p++) if (S.queue[p].length) prodHour(p);
  // construction
  for (let p = 0; p < G.P.length; p++) if (S.cons[p]) consHour(p);
  // unit upgrades (one at a time, parallel to research)
  for (const N of S.nations) if (N.alive && N.eng) engHour(N);
  // research
  for (const N of S.nations) if (N.alive && (N.research || N.research2)) researchHour(N);   // both slots
  diploHour(); reqHour(); weatherHour(); dropTick(); linkHour(); if (S.hour % 6 === 0) strandedHour(); if (S.hour % 3 === 0) escortHour();
  airTick();
  missileTick();
  spyHour();
  rebelHour();
  // movement
  for (const a of S.armies){
    if (a.air){ a.path = []; continue; }
    if (a.to === null && a.path.length && !canEnter(a.owner, a.path[0])){ if (isSeat(a.owner)) tell(a.owner, `Your force halted: ${placeOwner(a.path[0])} is not open to you.`, 'info', a.at); a.path = []; }
    if (a.to === null && a.path.length && shipsN(a) && !shipsOnly(a) && !portOk(a.owner, a.path[0])){
      const f = addArmy(a.owner, a.at, {}); for (const t of UT) if (UNITS[t].cls === 'naval'){ f.u[t] = a.u[t]; f.w[t] = a.w[t]; a.u[t] = 0; a.w[t] = 0; } f.m = a.m; }
    if (a.to === null && a.path.length && !G.P[a.at].nb.has(a.path[0])){ const dest = a.path[a.path.length - 1]; a.path = dest !== a.at ? pathFor(a, a.at, dest) : []; }   // stale route after a retreat or relocation
    if (a.to === null && a.path.length && canProceed(a)){ a.legFrom = a.pos || null; a.pos = null; a.to = a.path.shift(); a.t = 0; a.forced = false;
      if (a.carry && a.carryH === S.hour - 1 && legMode(a, a.at, a.to) === 'rail') a.t = a.carry/legHours(a, a.at, a.to); a.carry = 0; }   // trains run through: no stop at every station
    if (a.to !== null && !G.P[a.to].sea && !canEnter(a.owner, a.to)){ a.to = null; a.t = 0; a.path = []; if (isSeat(a.owner)) tell(a.owner, `${armyName(a)} turned back: ${placeOwner(a.at)} is no longer open to you.`, 'info', a.at); }
    if (a.to !== null){ const lh = legHours(a, a.at, a.to); a.t += 1/lh;
      if (a.t >= 1){ if (a.path.length && ground(a) && legMode(a, a.at, a.to) === 'rail'){ a.carry = Math.min(1, (a.t - 1)*lh); a.carryH = S.hour; } else a.carry = 0;
        if (G.P[a.at].sea && !G.P[a.to].sea){ a.landed = S.hour; a.m = Math.max(0, (a.m ?? 80) - 5); } a.from = a.at; a.froms = [a.at]; a.at = a.to; a.to = null; a.t = 0; a.legFrom = null;
        if (!a.path.length && a.dest && a.dest.p === a.at){ a.pos = [a.dest.x, a.dest.y]; a.dest = null; } else a.pos = null; } }
  }
  // head-on clash: hostile columns marching in opposite directions on the same road meet and fight at the nearer province
  { const edge = new Map(); for (const a of S.armies) if (a.to !== null && !a.air && !a.fly && count(a)) edge.set(a.at + '>' + a.to, [...(edge.get(a.at + '>' + a.to) || []), a]);
    for (const a of S.armies){ if (a.to === null || a.air || a.fly || !count(a)) continue; const opp = edge.get(a.to + '>' + a.at); if (!opp) continue;
      const b = opp.find(x => x.to !== null && atWar(a.owner, x.owner) && a.t + x.t >= 1); if (!b) continue;
      const meet = a.t >= 0.5 ? a.to : a.at, A0 = G.P[a.at], B0 = G.P[a.to], mx = A0.x + (B0.x - A0.x)*a.t, my = A0.y + (B0.y - A0.y)*a.t;
      for (const x of [a, b]){ x.from = x.at; x.at = meet; x.to = null; x.t = 0; x.path = []; x.legFrom = null; x.dest = null; x.pos = meet === a.at || meet === a.to ? [ (mx + G.P[meet].x)/2, (my + G.P[meet].y)/2 ] : null; x.forced = false; }
      for (const me of new Set([a.owner, b.owner])) if (isSeat(me)) tell(me, `Columns clash near ${G.P[meet].cityName || G.P[meet].name}: ${armyLabel(a, me)} met ${armyLabel(b, me)} on the road.`, 'bad', meet); } }
  // a seat's forces that arrive where another idle force of its own stands join it (same kind: ground with ground, fleets with fleets)
  for (const a of S.armies){ const me = a.owner; if (!isSeat(me) || a.air || a.to !== null || a.path.length || a.from == null || a.arrH === S.hour || !count(a)) continue;
    if (a.lastAt === a.at) continue; a.lastAt = a.at;
    if (S.owner[a.at] !== me && !(S.owner[a.at] >= 0 && rel(me, S.owner[a.at]).st === 'ally')) continue;
    const jt = a.join != null ? armyById(a.join) : null;   // a join order picks its partner
    const into = (jt && jt !== a && jt.owner === me && !jt.air && !jt.fly && jt.at === a.at && jt.to === null && count(jt) ? jt : null) || S.armies.find(b => b !== a && b.owner === me && !b.air && b.at === a.at && b.to === null && !b.path.length && count(b) && shipsOnly(b) === shipsOnly(a));
    if (into) delete a.join;
    if (into){ merge(into, a); IM.emit('merged', a.id, into.id, true); }
  }
  // dug in: the hour each force came to a stop (display only: the sandbag mark on its plate and the sandbag ring at close zoom)
  for (const a of S.armies){ if (a.to !== null || a.path.length || a.fly || a.air){ if (a.still != null) delete a.still; } else if (a.still == null) a.still = S.hour; }
  if (S.hour % 2 === 0) stanceHour();
  rangedHour(); chaseHour(); joinHour(); for (const a of S.armies) if (a.delay > 0) a.delay--;
  // combat
  if (S.hour - supHour >= 6 || !SUP){ computeSupply(); computeBlockade(); }
  const prevBattles = new Set(S.battles); S.battles = [];
  for (const a of S.armies){ a._h = effHP(a); a._n0 = count(a); }
  let by = index();
  for (let p = 0; p < by.length; p++){
    const list = by[p]; if (list.length < 2) continue;
    const sides = new Map(); for (const a of list){ if (!sides.has(a.owner)) sides.set(a.owner, []); sides.get(a.owner).push(a); }
    if (sides.size < 2) continue;
    const owners = [...sides.keys()].filter(o => [...sides.keys()].some(e => atWar(o, e)));
    if (owners.length < 2) continue;
    S.battles.push(p);
    if (!prevBattles.has(p)) for (const me of owners) if (isSeat(me)){
      const foes = owners.filter(o => o !== me).map(nationName).join(', ');
      if (S.owner[p] === me){ tell(me, `${foes} attacks ${G.P[p].cityName || G.P[p].name}! Defend it.`, 'bad', p); alarm(me); }
      else tell(me, `Battle at ${G.P[p].name} against ${foes}.`, 'bad', p);
      cue(me, 'battle');
    }
    const hp = new Map(owners.map(o => [o, sides.get(o).reduce((s, a) => s + armyHP(a), 0)]));
    const dmg = new Map(owners.map(o => [o, {soft:0, armored:0, air:0, naval:0}]));
    const B = (S.bt || (S.bt = {}))[p] || (S.bt[p] = {h0:S.hour, s:{}}); warDamage(p, 0.5);
    for (const o of owners){
      const av = {soft:0, armored:0, air:0, naval:0}, r0 = K*(0.8 + rng()*0.4);
      const nU = sides.get(o).reduce((s0, a) => s0 + count(a), 0), dirs = dirsOf(sides.get(o), p, o), F = sideFront(p, dirs);
      const r = r0*frontScale(nU, F)*flankF(dirs);
      const bs = B.s[o] || (B.s[o] = {peak:0, lost:{}, dirs:0, hp:[]}); bs.peak = Math.max(bs.peak, nU); bs.dirs = Math.max(bs.dirs, dirs); bs.dcur = dirs; bs.F = F; bs.n = nU;
      const sznA = o !== S.owner[p] && season(p) ? SEASON_FX[season(p)].atk : 1;
      for (const a of sides.get(o)){ const m = (a.landed != null && S.hour - a.landed < 24 ? (has(o, 'nav3') ? 0.9 : 0.67) : 1)*(o !== S.owner[p] && a.from != null && G.P[p].river.has(a.from) ? RIVER_ATK : 1)*sznA;
        const mf = moraleF(a);
        const TFo = G.P[p].sea ? null : tuf(G.P[p].terrain || 'plains', o !== S.owner[p], !arctic(o));
        const cB = o !== S.owner[p] ? 1 + 0.1*cmdF(a, 'blitz') : 1, cG = 1 + 0.2*cmdF(a, 'gunner');
        a._dealt0 = 0; for (const t of UT){ if (!a.u[t]) continue; const base = a.u[t]*st(o, t, 'atk')*m*r*mf*(TFo ? TFo[t] : 1)*cB*(t === 'art' || t === 'sam' || t === 'mlrs' ? cG : 1); a._dealt0 += base; for (const k of CLASSES) av[k] += base*mult(t, k); } }
      // shore bombardment: this side's ships in adjacent sea zones add half their firepower to coastal land battles
      if (!G.P[p].sea && G.P[p].coast) for (const sz of G.P[p].nbs){ if (!G.P[sz].sea) continue;
        for (const a of S.armies){ if (a.owner !== o || a.at !== sz || a.to !== null) continue;
          for (const t of UT){ if (!a.u[t] || UNITS[t].cls !== 'naval') continue; const base = 0.5*a.u[t]*st(o, t, 'atk')*r*moraleF(a); for (const k of CLASSES) av[k] += base*mult(t, k); } } }
      const foes = owners.filter(e => atWar(o, e)), tot = foes.reduce((s, e) => s + hp.get(e), 0);
      for (const e of foes){ const d = dmg.get(e); for (const k of CLASSES) d[k] += av[k]*hp.get(e)/tot; }
    }
    for (const o of owners){
      let f = 1;
      if (o === S.owner[p]){ f /= 1.25; f *= Math.pow(0.8, S.bld[p].fort); const dd = docOf(o); if (dd && dd.home && S.home[p] === o) f *= dd.home; }
      if (!G.P[p].sea && (o === S.owner[p] || (S.owner[p] < 0 && o < 0))) f /= terr(p).def;
      if (has(o, 'log3')) f *= 0.85;
      const d = dmg.get(o), tot = hp.get(o);
      const escorted = G.P[p].sea && sides.get(o).some(b => shipsN(b) > 0);
      const bs = B.s[o];
      for (const a of sides.get(o)){ const u0 = {...a.u}; hurt(a, d, f*(G.P[p].sea && ground(a) ? (escorted ? 0.75 : 1.5) : 1)/tot*(o === S.owner[p] ? 1 - 0.12*cmdF(a, 'shield') : 1)); cmdXP(a, (a._dealt0 || 0)*0.5); for (const t of UT) if (u0[t] > a.u[t]) bs.lost[t] = (bs.lost[t] || 0) + u0[t] - a.u[t]; }
      bs.hp.push(Math.round(sides.get(o).reduce((s0, a) => s0 + armyHP(a), 0))); if (bs.hp.length > 96) bs.hp.shift();
    }
    IM.emit('fxBattle', p, owners, sides, list);
    const here = owners.filter(isSeat);   // the seats fighting here: their statistics and dispatches
    for (const me of here){ const size = list.reduce((s0, a) => s0 + (a._n0 ?? count(a)), 0); const D = desk(me), st0 = D.stats || (D.stats = {}); if (size > (st0.bigBattle || 0)){ st0.bigBattle = size; st0.bigBattleAt = G.P[p].cityName || G.P[p].name; st0.bigBattleDay = dayOf(S.hour); } }
    for (const me of here) for (const a of list){ const lost = (a._n0 ?? count(a)) - count(a); if (lost > 0) bump(me, a.owner === me ? 'unitsLost' : 'unitsKilled', lost); }
    for (const a of list) if (count(a) === 0) IM.emit('fxWreck', p, owners);   // the client draws the wreck where its seat fought or can see
    for (const a of list) if (count(a) === 0 && a.cmd != null) cmdLost(a);
    for (const a of list) if (count(a) === 0) for (const me of here){
      if (a.owner === me) tell(me, `${armyName(a)} was destroyed at ${G.P[p].name}.`, 'bad', p);
      else tell(me, `${armyLabel(a, me)} destroyed at ${G.P[p].name}.`, 'good', p);
    }
  }
  removeEmpty();
  for (const p of prevBattles) if (!S.battles.includes(p)) endBattle(p);
  armyUpkeep(prevBattles);
  // capture
  by = index();
  for (let p = 0; p < by.length; p++){
    if (G.P[p].sea) continue;
    const list = by[p], owners = new Set(list.map(a => a.owner));
    let hostileToOwner = [...owners].filter(o => o !== S.owner[p] && atWar(o, S.owner[p]));
    if (hostileToOwner.length > 1 && !hostileToOwner.some(x => hostileToOwner.some(y => x !== y && atWar(x, y)))){ const sz = o => list.filter(a => a.owner === o).reduce((s0, a) => s0 + groundN(a), 0); hostileToOwner = [hostileToOwner.sort((x, y) => sz(y) - sz(x))[0]]; }
    if (owners.size >= 1 && hostileToOwner.length === 1 && ![...owners].some(o => o !== hostileToOwner[0] && atWar(o, hostileToOwner[0]))){
      const O = hostileToOwner[0];
      const gN = list.filter(a => a.owner === O).reduce((s, a) => s + groundN(a), 0);
      if (O !== NEUTRAL && gN >= CAP_MIN){
        if (!S.cap[p] || S.cap[p].by !== O){ S.cap[p] = {by:O, h:0}; if (isSeat(S.owner[p])){ tell(S.owner[p], `${nationName(O)} is occupying ${G.P[p].cityName || G.P[p].name}. Retake it before the capture completes.`, 'bad', p); alarm(S.owner[p]); } }
        S.cap[p].h += 1 + 0.25*Math.max(0, ...list.filter(a => a.owner === O).map(a => cmdF(a, 'siege'))); if (S.cap[p].h >= capNeed(p, O)) capture(p, O);
      } else S.cap[p] = null;
    } else if (owners.size === 0) S.cap[p] = null;
  }
  if (S.hour % 24 === 0){ diploDay(); daily(); }
  // the AI plays every nation that is not a seat
  for (let n = 0; n < S.nations.length; n++) if (!isSeat(n) && (S.hour + n) % 4 === 0){ if ((S.hour + n) % 24 === 0) aiLinks(n); if ((S.hour + n) % 12 === 0) aiTrade(n); aiTurn(n); aiAir(n); if ((S.hour + n) % 12 === 0) aiMissiles(n); if ((S.hour + n) % 24 === 0) aiSpies(n); }
  IM.emit('hour');
  visCache = null;
}
function makePaper(){ for (const me of seats()) makePaperFor(me); }
function makePaperFor(me){
  // summarise the last 24 hours of the seat's dispatches into a front page
  const D = desk(me), day = Math.floor(S.hour/24), from = S.hour - 24, ev = (D.log || []).filter(e => e.h > from && e.h <= S.hour);
  const score0 = e => /has fallen|collapsed|capital/.test(e.text) ? 9 : /declared war on you|attacks|Missile warning/.test(e.text) ? 8 : /declared war/.test(e.text) ? 6 : /alliance|truce|pact/.test(e.text) ? 5 : /captured|took/.test(e.text) ? 4 : /strike|Missile|hit/.test(e.text) ? 4 : /Battle/.test(e.text) ? 3 : 1;
  const top = ev.slice().sort((a, b) => score0(b) - score0(a));
  const rank = S.nations.filter(N => N.alive).sort((a, b) => score(b.id) - score(a.id));
  D.papers = D.papers || []; const paper = {day, head:top[0] ? top[0].text : `Quiet day on the fronts. ${S.nations[me].name} holds ${S.owner.filter(o => o === me).length} provinces.`, items:top.slice(1, 5).map(e => e.text), rank:rank.slice(0, 5).map(N => [N.name, score(N.id), N.color]), big:top[0] ? score0(top[0]) : 0};
  D.papers.unshift(paper); if (D.papers.length > 10) D.papers.length = 10;
  IM.emit('paper', me, paper);
}
function recordStats(){
  const day = Math.floor(S.hour/24);
  { if (!S.own0) S.own0 = S.owner.slice(); const R = S.rec || (S.rec = {last:S.own0.slice(), d:[]}); const diff = []; for (let p = 0; p < S.owner.length; p++) if (S.owner[p] !== R.last[p]){ diff.push(p, S.owner[p]); R.last[p] = S.owner[p]; } R.d.push(diff); }
  IM.emit('statsDay');
  S.hist = S.hist || [];
  S.hist.push({d:day, n:S.nations.map(N => N.alive ? [score(N.id), S.owner.filter(o => o === N.id).length, Math.round(natPower(N.id)), Math.round(income(N.id).net.cash)] : null)});
  if (S.hist.length > 200) S.hist.shift();
  for (const me of seats()){ const D = desk(me), st0 = D.stats || (D.stats = {}); st0.peakArmy = Math.max(st0.peakArmy || 0, Math.round(natPower(me)));
    const rank = S.nations.filter(N => N.alive).sort((a, b) => score(b.id) - score(a.id)).findIndex(N => N.id === me) + 1;
    if (rank && (!st0.bestRank || rank < st0.bestRank)){ st0.bestRank = rank; st0.bestRankDay = day + 1; } }
}
function daily(){
  if (S.airHit) for (const k in S.airHit){ const H = S.airHit[k]; for (const j in H) if (typeof H[j] === 'number') H[j] *= 0.7; if (H.bp) for (const q in H.bp) if (S.hour - H.bp[q] > 96) delete H.bp[q]; }   // air-raid memory fades
  marketDay(); bookDay(); chatDay(); coalitionAid(); convoyDay(); tradeDay(); INCC.v = -1;
  if (S.dmg) for (let p = 0; p < S.dmg.length; p++) if (S.dmg[p] > 0) S.dmg[p] = Math.max(0, S.dmg[p] - 2.5);
  { S.pop = S.pop || G.P.map(P => P.pop0); for (let p = 0; p < G.P.length; p++){ if (G.P[p].sea) continue; if (moraleOf(p) > 70) S.pop[p] = Math.min(G.P[p].pop0*1.25, S.pop[p]*1.0004); } }
  for (const N of S.nations){ if (!N.alive || isSeat(N.id) || !has(N.id, 'sat1') || N.cash < 450 || rng() > 0.1) continue; launchSat(N.id, N.capital); }
  for (const N of S.nations){ if (!N.alive || isSeat(N.id) || N.cash < 300 || cmdList(N.id).length >= 2 || rng() > 0.15) continue; N.cash -= CMD_COST; const c = newCommander(N.id);
    const a = S.armies.filter(x => x.owner === N.id && !x.air && !shipsOnly(x) && x.cmd == null).sort((x, y) => power(y) - power(x))[0]; if (a){ a.cmd = c.id; c.army = a.id; } }
  for (const c of (S.cmds || [])){ if (!c.alive || c.army == null) continue; const a = armyById(c.army); if (!a || a.cmd !== c.id) c.army = null; }
  for (const N of S.nations){ if (!N.alive || isSeat(N.id) || N.eng || N.cash < 300 || rng() > 0.4) continue;
    const tot = {}; for (const a of S.armies) if (a.owner === N.id) for (const t of UT) tot[t] = (tot[t] || 0) + a.u[t];
    const t = UT.filter(t => tot[t] && markOf(N.id, t) < 4).sort((x, y) => tot[y]*UNITS[y].cost - tot[x]*UNITS[x].cost)[0]; if (t) startUpgrade(N.id, t); }
  // the advisor: each seat is warned of a build-up on its border and of idle cities in wartime
  for (const me of seats()) if (S.nations[me].alive){ const D = desk(me), W = D.warn || (D.warn = {}), day = dayOf(S.hour);
    const border = G.P.filter(P => !P.sea && S.owner[P.id] === me && P.nbs.some(v => S.owner[v] >= 0 && S.owner[v] !== me));
    const mass = new Map(); for (const x of S.armies){ if (x.owner < 0 || x.owner === me || x.air || !S.nations[x.owner].alive) continue; const r = rel(me, x.owner).st; if (r === 'ally') continue;
      if (border.some(P => P.nbs.includes(x.at) || P.id === x.at)) mass.set(x.owner, (mass.get(x.owner) || 0) + power(x)); }
    const mine = border.reduce((s0, P) => s0 + S.armies.filter(x => x.owner === me && x.at === P.id && !x.air).reduce((s1, x) => s1 + power(x), 0), 0);
    for (const [o, pw] of mass){ const grew = pw > (W['p' + o] ?? pw)*1.2; W['p' + o] = Math.max(pw*0.9, Math.min(W['p' + o] ?? pw, pw));
      if (day >= 3 && grew && pw > 40 && pw > mine*1.4 && (!W[o] || day - W[o] >= 5)){ W[o] = day; const r = rel(me, o).st;
      tell(me, `${nationName(o)} ${r === 'war' ? 'has' : 'is massing'} ${Math.round(pw)} strength on your border against your ${Math.round(mine)}. ${r === 'war' ? 'Reinforce the front.' : 'Recruit defenders or seek a pact in Diplomacy.'}`, 'bad', border[0].id); } }
    const idle = G.P.filter(P => S.owner[P.id] === me && P.city && !S.queue[P.id].length);
    const N0 = S.nations[me], lowMp = N0.mp < 25, lowMetal = N0.metal < 15, lowIron = N0.iron < 12, lowElec = N0.elec < 8;
    if (warsOf(me).length && idle.length && N0.cash > 250 && (!W.idle || day - W.idle >= 3)){ W.idle = day;
      tell(me, lowMp ? `At war with $${fmt(N0.cash)}M but only ${fmt(N0.mp)}k manpower: money is not your limit. Raise Mobilisation in Production, build Recruiting Offices, or capture populous provinces.`
        : lowMetal ? `At war with $${fmt(N0.cash)}M but only ${fmt(N0.metal)} materials: buy more on the Market (T) or build Foundries.`
        : lowIron ? `At war with $${fmt(N0.cash)}M but only ${fmt(N0.iron)} iron for armor, guns and ships: buy more on the Market (T) or build Foundries.`
        : lowElec ? `At war with $${fmt(N0.cash)}M but only ${fmt(N0.elec)} electronics for aircraft, drones and air defence: buy more on the Market (T) or raise Arms Factories in your big cities.`
        : `At war with $${fmt(N0.cash)}M unspent and ${idle.length} idle ${idle.length === 1 ? 'city' : 'cities'}: open Production (P) to queue defenders.`, 'bad', idle[0].id); } }
  for (const N of S.nations){ if (!N.alive) continue; const inc = income(N.id), was = N.short || {};
    N.short = {};
    const cap = stockCap(N.id);
    for (const R of RES){ const v = N[R.k] + inc.net[R.k]; if (v < 0){ N.short[R.k] = true; N[R.k] = 0; } else N[R.k] = R.k === 'cash' ? v : Math.min(cap, v); }
    if (isSeat(N.id)){ const D = desk(N.id), st0 = D.stats || (D.stats = {}), mk = st0.made || (st0.made = {}); for (const R of RES) mk[R.k] = (mk[R.k] || 0) + Math.max(0, inc.gross[R.k]); }   // produced over the campaign (statistics)
    if (isSeat(N.id)){ for (const k of ['oil', 'iron', 'elec', 'cash']) if (N.short[k] && !was[k]) tell(N.id, SHORT_MSG[k], 'bad'); } }
  unrestDay();
  recordStats();
  makePaper();
  checkEnd();
  IM.emit('day');
}
