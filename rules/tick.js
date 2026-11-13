// Iron Meridian rules: tick. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
/* ---------------- Simulation ---------------- */
let tickVer = 0;
// the hour runs as a list of steps (tickHourG yields between them: after the morning's chores, after movement and ranged fire, after the battle
// and upkeep, after the captures, around the daily round and after each computer nation's turn). tickHour runs them all at once, as it always did;
// the page may run them over several frames instead (tickQSlice), so no frame waits long for the rules. The steps and their order are the same
// either way: an hour spread over frames gives the same game as one run at once (the page only reads between the steps: rules/core.js keep())
function tickHour(){ const g = tickHourG(); while (!g.next().done){} }
function* tickHourG(){
  S.hour++; tickVer++;
  /*@DEV*/if (DEV.instant || DEV.research || DEV.res) for (const me of seats()) devHour(me);/*@ENDDEV*/
  // production
  for (let p = 0; p < G.P.length; p++) if (S.queue[p].length) prodHour(p);
  // construction
  for (let p = 0; p < G.P.length; p++) if (S.cons[p]) consHour(p);
  // a Mark upgrade left running by a save from before the research redesign (it ends as Firepower and Protection levels)
  for (const N of S.nations) if (N.alive && N.eng) engHour(N);
  // research
  for (const N of S.nations) if (N.alive && (N.research || N.research2)) researchHour(N);   // both slots
  diploHour(); terrHour(); reqHour(); weatherHour(); dropTick(); linkHour(); if (S.hour % 6 === 0) strandedHour(); if (S.hour % 3 === 0) escortHour();
  airTick();
  missileTick();
  spyHour();
  rebelHour();
  yield;
  // movement
  for (const a of S.armies){
    if (a.air){ a.path = []; continue; }
    if (a.to === null && a.path.length && !canEnter(a.owner, a.path[0])){ if (isSeat(a.owner)) tell(a.owner, `Your force halted: ${placeOwner(a.path[0])} is not open to you.`, 'info', a.at); a.path = []; }
    if (a.to === null && a.path.length && shipsN(a) && !shipsOnly(a) && !portOk(a.owner, a.path[0])){
      const f = addArmy(a.owner, a.at, {}); for (const t of UT) if (UNITS[t].cls === 'naval'){ f.u[t] = a.u[t]; f.w[t] = a.w[t]; a.u[t] = 0; a.w[t] = 0; } f.m = a.m; }
    if (a.to === null && a.path.length && !G.P[a.at].nb.has(a.path[0])){ const dest = a.path[a.path.length - 1]; a.path = dest !== a.at ? pathFor(a, a.at, dest) : []; }   // stale route after a retreat or relocation
    if (a.sail){ if (a.path.length){ a.pos = sailXY(a); delete a.sail; } else { sailHour(a); continue; } }   // (a force walking, or a fleet sailing, to a spot inside its province: rules/movement.js)
    if (a.to === null && a.path.length && canProceed(a)){ a.legFrom = a.pos || null; a.pos = null; a.to = a.path.shift(); a.t = 0; a.forced = false;
      if (a.carry && a.carryH === S.hour - 1 && legMode(a, a.at, a.to) === 'rail') a.t = a.carry/legH(a); a.carry = 0; }   // trains run through: no stop at every station
    if (a.to !== null && !G.P[a.to].sea && !canEnter(a.owner, a.to)){ a.pos = a.legFrom && provOfPt(a.legFrom[0], a.legFrom[1]) === a.at ? a.legFrom : null; a.to = null; a.t = 0; a.path = []; a.legFrom = null; if (isSeat(a.owner)) tell(a.owner, `${armyName(a)} turned back: ${placeOwner(a.at)} is no longer open to you.`, 'info', a.at); }
    if (a.to !== null){ const lh = legH(a); a.t += 1/lh;   // (a leg takes time in proportion to its real length: rules/movement.js legRatio)
      if (a.t >= 1){ if (a.path.length && ground(a) && legMode(a, a.at, a.to) === 'rail'){ a.carry = Math.min(1, (a.t - 1)*lh); a.carryH = S.hour; } else a.carry = 0;
        legArrive(a); }
      else if (!(shipsOnly(a) && !G.P[a.to].sea)) legCross(a, lh); }   // a pinpoint move's last leg: the hour it crosses into its province it arrives there and walks on to the point
  }
  // head-on clash: hostile columns marching in opposite directions on the same road meet and fight at the nearer province
  { const edge = new Map(), ek = (u, v) => (u | 0) === u && (v | 0) === v && u >= 0 && v >= 0 && u < 1048576 && v < 1048576 ? u*1048576 + v : u + '>' + v;   // (a number for the road from u to v)
    for (const a of S.armies) if (a.to !== null && !a.air && !a.fly && count(a)){ const k = ek(a.at, a.to), l = edge.get(k); if (l) l.push(a); else edge.set(k, [a]); }
    for (const a of S.armies){ if (a.to === null || a.air || a.fly || !count(a)) continue; const opp = edge.get(ek(a.to, a.at)); if (!opp) continue;
      const b = opp.find(x => x.to !== null && atWar(a.owner, x.owner) && a.t + x.t >= 1); if (!b) continue;
      const meet = a.t >= 0.5 ? a.to : a.at, [mx, my] = legSpot(a);
      for (const x of [a, b]){ x.from = x.at; atMove(x, meet); x.to = null; x.t = 0; x.path = []; x.legFrom = null; x.dest = null; x.pos = ptIn(meet, (mx + G.P[meet].x)/2, (my + G.P[meet].y)/2); x.forced = false; }
      for (const me of new Set([a.owner, b.owner])) if (isSeat(me)) tell(me, `Columns clash near ${G.P[meet].cityName || G.P[meet].name}: ${armyLabel(a, me)} met ${armyLabel(b, me)} on the road.`, 'bad', meet); } }
  // a seat's forces that arrive where another idle force of its own stands join it (same kind: ground with ground, fleets with fleets), as long as
  // the joined force stays within its stack limit (STACK_LIM); a join order (dragged onto the counter) merges anyway, with the stack-limit warning
  for (const a of S.armies){ const me = a.owner; if (!isSeat(me) || a.air || a.to !== null || a.path.length || a.from == null || a.arrH === S.hour || !count(a)) continue;
    if (a.lastAt === a.at) continue; a.lastAt = a.at;
    if (S.owner[a.at] !== me && !(S.owner[a.at] >= 0 && rel(me, S.owner[a.at]).st === 'ally')) continue;
    const jt = a.join != null ? armyById(a.join) : null, pin = a.sail ? a.sail.to : a.pos;   // a join order picks its partner; a force sent to an exact point joins only a force standing at (or by) that point
    const into = (jt && jt !== a && jt.owner === me && !jt.air && !jt.fly && jt.at === a.at && jt.to === null && count(jt) ? jt : null) || S.armies.find(b => b !== a && b.owner === me && !b.air && b.at === a.at && b.to === null && !b.path.length && count(b) && shipsOnly(b) === shipsOnly(a) && !stackPenaltyIf(b, a).over && (!pin || Math.hypot(pin[0] - (b.pos ? b.pos[0] : G.P[b.at].x), pin[1] - (b.pos ? b.pos[1] : G.P[b.at].y)) < JOIN_R));
    if (into) delete a.join;
    if (into){ merge(into, a); IM.emit('merged', a.id, into.id, true); const sp = stackPenalty(into); if (sp.over) tell(me, `${armyName(into)} at ${G.P[into.at].cityName || G.P[into.at].name}: ${stackText(sp)} (${sp.size} ${sp.dom} units, limit ${sp.limit}). Split it to fight at full strength.`, 'bad', into.at); }
  }
  // dug in: the hour each force came to a stop (display only: the sandbag mark on its plate and the sandbag ring at close zoom)
  for (const a of S.armies){ if (a.to !== null || a.path.length || a.fly || a.air || (a.sail && !G.P[a.at].sea)){ if (a.still != null) delete a.still; } else if (a.still == null) a.still = S.hour; }
  if (S.hour % 2 === 0) stanceHour();
  visCache = null;   // forces moved this hour: what each side sees is worked out again (ranged fire needs sight)
  rangedStep(true); chaseHour(); joinHour(); for (const a of S.armies) if (a.delay > 0) a.delay--;
  yield;
  // combat: the hour's own battle step (the last of its four); then morale, upkeep and healing
  if (S.hour - supHour >= 6 || !SUP){ computeSupply(); computeBlockade(); }
  const prevH = new Set(S.battles);   // the fights of the steps just before this one
  battleStep(true);
  armyUpkeep(prevH);
  yield;
  // capture
  let by = index();
  for (let p = 0; p < by.length; p++){
    if (G.P[p].sea) continue;
    if (!by[p].length){ S.cap[p] = null; continue; }   // (no force here: what the lines below come to for an empty province)
    { const ow = S.owner[p]; if (by[p].every(a => a.owner === ow)) continue; }   // (only the owner's forces here: nothing below changes anything)
    const list = by[p], owners = new Set(list.map(a => a.owner));
    let hostileToOwner = [...owners].filter(o => o !== S.owner[p] && atWar(o, S.owner[p]));
    if (hostileToOwner.length > 1 && !hostileToOwner.some(x => hostileToOwner.some(y => x !== y && atWar(x, y)))){ const sz = o => list.filter(a => a.owner === o).reduce((s0, a) => s0 + groundN(a), 0); hostileToOwner = [hostileToOwner.sort((x, y) => sz(y) - sz(x))[0]]; }
    if (owners.size >= 1 && hostileToOwner.length === 1 && ![...owners].some(o => o !== hostileToOwner[0] && atWar(o, hostileToOwner[0]))){
      const O = hostileToOwner[0];
      const gN = list.filter(a => a.owner === O).reduce((s, a) => s + groundN(a), 0);
      // (the nations world: a computer nation that has grown enough for now, isSated, takes back its own lost land but no more: in the step 4
      // repair Chad, sated at 28 provinces in the middle of overrunning Sudan, took 3 more with the forces already standing in them)
      if (O !== NEUTRAL && gN >= CAP_MIN && !(S.home[p] !== O && isSated(O))){
        if (!S.cap[p] || S.cap[p].by !== O){ S.cap[p] = {by:O, h:0}; if (isSeat(S.owner[p])){ tell(S.owner[p], `${nationName(O)} is occupying ${G.P[p].cityName || G.P[p].name}. Retake it before the capture completes.`, 'bad', p); alarm(S.owner[p]); } }
        S.cap[p].h += 1 + 0.25*Math.max(0, ...list.filter(a => a.owner === O).map(a => cmdF(a, 'siege'))); if (S.cap[p].h >= capNeed(p, O)) capture(p, O);
      } else S.cap[p] = null;
    } else if (owners.size === 0) S.cap[p] = null;
  }
  yield;
  if (S.hour % 24 === 0){ yield* diploDayG(); yield; yield* dailyG(); yield; }
  // the AI plays every nation that is not a seat (in the nations world a nation far from the fighting plans every other turn: aiAway)
  for (let n = 0; n < S.nations.length; n++) if (!isSeat(n) && (S.hour + n) % 4 === 0){ if ((S.hour + n) % 24 === 0) aiLinks(n); if ((S.hour + n) % 12 === 0) aiTrade(n); if (!((S.hour + n) % 8 === 4 && aiAway(n))) aiTurn(n); aiAir(n); if ((S.hour + n) % 12 === 0) aiMissiles(n); if ((S.hour + n) % 24 === 0) aiSpies(n); yield; }
  IM.emit('hour');
  visCache = null;
}
// One 15-minute step of game time. S.q counts the battle steps already run this hour (0..3, saved; old saves have none = 0): three steps are battle-only,
// the fourth is the hour's tick. The game loop and tools/headless.js call tickQ; tick() plays a whole game hour (what the tests and tools use).
function tickQ(){ if (TQP !== null){ tickFinish(); return; }   // (an hour the page left half run is this step: it is finished)
  tickDepth++; tickSess++; try { const q = S.q || 0; if (q + 1 < BATTLE_Q){ S.q = q + 1; rangedStep(false); battleStep(false); return; } S.q = 0; tickHour(); } finally { tickDepth--; } }
// the page's game loop: one tickQ step, run a part at a time while more() says the frame has time left (the quarter-hour battle steps run whole; the
// hour pauses between its steps, tickHourG). Returns true when the step is done; false: the hour goes on at the next call (tickPending()).
// Anything else that runs game time, saves or loads first finishes it (tickQ, tick, saveJSON, newGame, restore)
let TQP = null;
const tickPending = () => TQP !== null;
function tickQSlice(more){
  if (TQP === null){ const q = S.q || 0; if (q + 1 < BATTLE_Q){ tickQ(); return true; } S.q = 0; TQP = tickHourG(); }
  tickDepth++; tickSess++;
  try { for (;;){ if (TQP.next().done){ TQP = null; return true; } if (!more()) return false; } }
  catch (e){ TQP = null; throw e; }
  finally { tickDepth--; } }
function tickFinish(){ if (TQP === null || tickDepth > 0) return; tickQSlice(() => true); }   // (ranged fire, rules/combat.js, before each battle step)
function tick(){ if (TQP !== null) tickFinish(); else do tickQ(); while (S.q); }
/* One battle step: every force fighting in a province deals and takes damage. Battles resolve BATTLE_Q (4) times per game hour, one step every 15 in-game minutes,
   each dealing BATTLE_DMG (a quarter of the hourly damage, times the pace constant BATTLE_PACE in rules/combat.js). The hour's own tick runs the last one (hourly = true);
   the other three run between hours (tickQ). Movement, supply, the economy and the capture clock stay hourly. */
function battleStep(hourly){
  const prevBattles = new Set(S.battles); S.battles = [];
  for (const a of S.armies){ a._h = effHP(a); a._n0 = count(a); }
  let by = index();
  for (let p = 0; p < by.length; p++){
    const list = by[p]; if (list.length < 2) continue;
    { const o0 = list[0].owner; let i = 1; while (i < list.length && list[i].owner === o0) i++; if (i === list.length) continue; }   // (one side only: what sides.size < 2 below comes to)
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
      const av = {soft:0, armored:0, air:0, naval:0}, r0 = K*BATTLE_DMG*(0.8 + rng()*0.4);
      const nU = sides.get(o).reduce((s0, a) => s0 + count(a), 0), dirs = dirsOf(sides.get(o), p, o), F = sideFront(p, dirs);
      const r = r0*frontScale(nU, F)*flankF(dirs);
      const bs = B.s[o] || (B.s[o] = {peak:0, lost:{}, dirs:0, hp:[]}); bs.peak = Math.max(bs.peak, nU); bs.dirs = Math.max(bs.dirs, dirs); bs.dcur = dirs; bs.F = F; bs.n = nU;
      const sznA = o !== S.owner[p] && season(p) ? SEASON_FX[season(p)].atk : 1;
      for (const a of sides.get(o)){ const m = (a.landed != null && S.hour - a.landed < 24 ? rLandF(o) : 1)*sznA, riv = o !== S.owner[p] && a.from != null && G.P[p].river.has(a.from) ? RIVER_ATK : 1;   // (riv: attacking across a river; an IFV with the Amphibious Kit is exempt)
        const mf = moraleF(a), se = stackEffs(a);   // se: stack efficiency per domain (over the stack limit the force's units deal less)
        const TFo = G.P[p].sea ? null : tuf(G.P[p].terrain || 'plains', o !== S.owner[p], !arctic(o));
        const cB = o !== S.owner[p] ? 1 + 0.1*cmdF(a, 'blitz') : 1, cG = 1 + 0.2*cmdF(a, 'gunner');
        a._dealt0 = 0; for (const t of UT){ if (!a.u[t]) continue; const base = a.u[t]*st(o, t, 'atk')*m*(t === 'ifv' && riv < 1 && has(o, 'ifv_terr') ? 1 : riv)*r*mf*(TFo ? (t === 'spec' ? rSpecTerr(o, TFo[t]) : TFo[t]) : 1)*cB*(t === 'art' || t === 'sam' || t === 'mlrs' ? cG : 1)*se[DOM_T[t]]; a._dealt0 += base; for (const k of CLASSES) av[k] += base*multO(o, t, k); } }
      // (warships no longer add fire to coastal battles from a neighbouring sea zone: they hit what lies within their range, rules/combat.js rangedStep)
      const foes = owners.filter(e => atWar(o, e)), tot = foes.reduce((s, e) => s + hp.get(e), 0);
      for (const e of foes){ const d = dmg.get(e); for (const k of CLASSES) d[k] += av[k]*hp.get(e)/tot; }
    }
    for (const o of owners){
      let f = 1;
      if (o === S.owner[p]){ f /= 1.25; f *= Math.pow(0.8, S.bld[p].fort); const dd = docOf(o); if (dd && dd.home && S.home[p] === o) f *= dd.home; }
      if (!G.P[p].sea && (o === S.owner[p] || (S.owner[p] < 0 && o < 0))) f /= terr(p).def;
      f *= rHospF(o);
      const d = dmg.get(o), tot = hp.get(o);
      const escorted = G.P[p].sea && sides.get(o).some(b => shipsN(b) > 0);
      const bs = B.s[o];
      for (const a of sides.get(o)){ const u0 = {...a.u}; hurt(a, d, f*(G.P[p].sea && ground(a) ? (escorted ? 0.75 : 1.5) : 1)/tot*(o === S.owner[p] ? 1 - 0.12*cmdF(a, 'shield') : 1)); cmdXP(a, (a._dealt0 || 0)*0.5); for (const t of UT) if (u0[t] > a.u[t]) bs.lost[t] = (bs.lost[t] || 0) + u0[t] - a.u[t]; }
      if (hourly){ bs.hp.push(Math.round(sides.get(o).reduce((s0, a) => s0 + armyHP(a), 0))); if (bs.hp.length > 96) bs.hp.shift(); }   // (the history keeps one point per game hour)
    }
    // morale: a force in a fight loses 1 a game hour and 40 × the share of its health lost, spread over the hour's battle steps (the break and retreat check is hourly: armyUpkeep)
    for (const a of list){ if (a.owner < 0 || !count(a)) continue; const lost = a._h ? Math.max(0, (a._h - effHP(a))/a._h) : 0; a.m = Math.max(0, (a.m ?? 80) - 1/BATTLE_Q - 40*lost); }
    IM.emit('fxBattle', p, owners, sides, list);
    const here = owners.filter(isSeat);   // the seats fighting here: their statistics and dispatches
    for (const me of here){ const size = list.reduce((s0, a) => s0 + (a._n0 ?? count(a)), 0); const D = desk(me), st0 = D.stats || (D.stats = {}); if (size > (st0.bigBattle || 0)){ st0.bigBattle = size; st0.bigBattleAt = G.P[p].cityName || G.P[p].name; st0.bigBattleDay = dayOf(S.hour); } }
    for (const me of here) for (const a of list){ const lost = (a._n0 ?? count(a)) - count(a); if (lost > 0) bump(me, a.owner === me ? 'unitsLost' : 'unitsKilled', lost); }
    for (const a of list) if (count(a) === 0) IM.emit('fxWreck', p, owners, a);   // the client draws the wreck where its seat fought or can see
    for (const a of list) if (count(a) === 0 && a.cmd != null) cmdLost(a);
    for (const a of list) if (count(a) === 0) for (const me of here){
      if (a.owner === me) tell(me, `${armyName(a)} was destroyed at ${G.P[p].name}.`, 'bad', p);
      else tell(me, `${armyLabel(a, me)} destroyed at ${G.P[p].name}.`, 'good', p);
    }
  }
  removeEmpty();
  for (const p of prevBattles) if (!S.battles.includes(p)) endBattle(p);
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
  S.hist.push({d:day, n:S.nations.map(N => N.alive ? [score(N.id), ownedBy(N.id).length, Math.round(natPower(N.id)), Math.round(income(N.id).net.cash)] : null)});
  if (S.hist.length > 200) S.hist.shift();
  for (const me of seats()){ const D = desk(me), st0 = D.stats || (D.stats = {}); st0.peakArmy = Math.max(st0.peakArmy || 0, Math.round(natPower(me)));
    const rank = S.nations.filter(N => N.alive).sort((a, b) => score(b.id) - score(a.id)).findIndex(N => N.id === me) + 1;
    if (rank && (!st0.bestRank || rank < st0.bestRank)){ st0.bestRank = rank; st0.bestRankDay = day + 1; } }
}
// thinking in turns (docs/NATIONS-PLAN.md 3.7), the nations world only: a computer nation at peace whose land touches no person's land plans its
// economy, recruits and moves every 8 hours instead of every 4 (one turn in two); at war, or next to a person's nation, every 4 as before. Its
// trade, links, aircraft, missiles and agents keep their hours. The rules are the same for every nation; only the planning of the quiet ones is
// spread out, so 30 to 68 computer nations cost little more than 15. The classic world and the theatres are untouched.
function aiAway(n){ if (!tiered() || warsOf(n).length) return false; for (const s of seats()) if (borders(n, s) || borders(s, n)) return false; return true; }
// (a generator, as the hour: pauses between its rounds)
function daily(){ const g = dailyG(); while (!g.next().done){} }
function* dailyG(){
  if (S.airHit) for (const k in S.airHit){ const H = S.airHit[k]; for (const j in H) if (typeof H[j] === 'number') H[j] *= 0.7; if (H.bp) for (const q in H.bp) if (S.hour - H.bp[q] > 96) delete H.bp[q]; }   // air-raid memory fades
  marketDay(); bookDay(); chatDay(); coalitionAid(); yield; convoyDay(); yield; tradeDay(); terrDay(); INCC.v = -1; yield;
  if (S.dmg) for (let p = 0; p < S.dmg.length; p++) if (S.dmg[p] > 0) S.dmg[p] = Math.max(0, S.dmg[p] - 2.5);
  { S.pop = S.pop || G.P.map(P => P.pop0); for (let p = 0; p < G.P.length; p++){ if (G.P[p].sea) continue; if (moraleOf(p) > 70) S.pop[p] = Math.min(G.P[p].pop0*1.25, S.pop[p]*1.0004); } }
  for (const N of S.nations){ if (!N.alive || isSeat(N.id) || !has(N.id, 'sat1') || N.cash < 450 || rng() > 0.1) continue; launchSat(N.id, N.capital); }
  for (const N of S.nations){ if (!N.alive || isSeat(N.id) || N.cash < 300 || cmdList(N.id).length >= 2 || rng() > 0.15) continue; N.cash -= CMD_COST; const c = newCommander(N.id);
    const a = armiesOf(N.id).filter(x => !x.air && !shipsOnly(x) && x.cmd == null).sort((x, y) => power(y) - power(x))[0]; if (a){ a.cmd = c.id; c.army = a.id; } }
  for (const c of (S.cmds || [])){ if (!c.alive || c.army == null) continue; const a = armyById(c.army); if (!a || a.cmd !== c.id) c.army = null; }
  yield;
  // the advisor: each seat is warned of a build-up on its border and of idle cities in wartime
  for (const me of seats()) if (S.nations[me].alive){ const D = desk(me), W = D.warn || (D.warn = {}), day = dayOf(S.hour);
    const border = G.P.filter(P => !P.sea && S.owner[P.id] === me && P.nbs.some(v => S.owner[v] >= 0 && S.owner[v] !== me));
    const mass = new Map(); for (const x of S.armies){ if (x.owner < 0 || x.owner === me || x.air || !S.nations[x.owner].alive) continue; const r = rel(me, x.owner).st; if (r === 'ally') continue;
      if (border.some(P => P.nbs.includes(x.at) || P.id === x.at)) mass.set(x.owner, (mass.get(x.owner) || 0) + power(x)); }
    const mine = border.reduce((s0, P) => s0 + armiesOf(me).filter(x => x.at === P.id && !x.air).reduce((s1, x) => s1 + power(x), 0), 0);
    for (const [o, pw] of mass){ const grew = pw > (W['p' + o] ?? pw)*1.2; W['p' + o] = Math.max(pw*0.9, Math.min(W['p' + o] ?? pw, pw));
      if (day >= 3 && grew && pw > 40 && pw > mine*1.4 && (!W[o] || day - W[o] >= 5)){ W[o] = day; const r = rel(me, o).st;
      tell(me, `${nationName(o)} ${r === 'war' ? 'has' : 'is massing'} ${Math.round(pw)} strength on your border against your ${Math.round(mine)}. ${r === 'war' ? 'Reinforce the front.' : 'Recruit defenders or seek a pact in Diplomacy.'}`, 'bad', border[0].id); } }
    const idle = G.P.filter(P => S.owner[P.id] === me && P.city && !S.queue[P.id].length);
    const N0 = S.nations[me], lowMp = N0.mp < 25, lowMetal = N0.metal < 15, lowIron = N0.iron < 12, lowElec = N0.elec < 8;
    if (warsOf(me).length && idle.length && N0.cash > 250 && (!W.idle || day - W.idle >= 3)){ W.idle = day;
      tell(me, lowMp ? `At war with $${fmt(N0.cash)}M but only ${fmt(N0.mp)}k manpower: money is not your limit. Raise Mobilisation in Production, build Recruiting Offices, or capture populous provinces.`
        : lowMetal ? `At war with $${fmt(N0.cash)}M but only ${fmt(N0.metal)} materials: buy more on the Market (T) or build an Arms Industry in a materials city.`
        : lowIron ? `At war with $${fmt(N0.cash)}M but only ${fmt(N0.iron)} iron for armor, guns and ships: buy more on the Market (T) or build an Arms Industry in an iron city.`
        : lowElec ? `At war with $${fmt(N0.cash)}M but only ${fmt(N0.elec)} electronics for aircraft, drones and air defence: buy more on the Market (T) or build an Arms Industry in an electronics city.`
        : `At war with $${fmt(N0.cash)}M unspent and ${idle.length} idle ${idle.length === 1 ? 'city' : 'cities'}: open Production (P) to queue defenders.`, 'bad', idle[0].id); } }
  for (const N of S.nations){ if (!N.alive) continue; const inc = income(N.id), was = N.short || {};
    N.short = {};
    const cap = stockCap(N.id);
    for (const R of RES){ const v = N[R.k] + inc.net[R.k]; if (v < 0){ N.short[R.k] = true; N[R.k] = 0; } else N[R.k] = R.k === 'cash' ? v : Math.min(cap, v); }
    if (isSeat(N.id)){ const D = desk(N.id), st0 = D.stats || (D.stats = {}), mk = st0.made || (st0.made = {}); for (const R of RES) mk[R.k] = (mk[R.k] || 0) + Math.max(0, inc.gross[R.k]); }   // produced over the campaign (statistics)
    if (isSeat(N.id)){ for (const k of ['oil', 'iron', 'elec', 'cash']) if (N.short[k] && !was[k]) tell(N.id, SHORT_MSG[k], 'bad'); } }
  yield;
  unrestDay();
  recordStats();
  makePaper();
  checkEnd();
  IM.emit('day');
}
