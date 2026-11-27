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
  for (const me of seats()) repeatHour(me);   // (a seat's Repeat production: rules/production.js)
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
  bunkerHour();   // (damaged bunkers mend)
  rebelHour();
  yield;
  // movement
  const MV0 = meetSnap();   // (where each force on the move stands as the hour starts: meetHour)
  for (const a of S.armies){
    if (a.air){ a.path = []; continue; }
    if (a.fly) continue;   // (paratroopers in the air: rules/air.js dropTick moves them)
    // the part of this hour the force has to move in (hr): all of it, or what is left once a landing from the sea ends within the hour (rules/movement.js
    // landStep: a 45-minute landing leaves 15 minutes to walk, march on or capture); a boarding in a port takes its share below (embStep)
    let hr = landStep(a);
    if (a.wp && a.to === null && !a.path.length && !a.sail) stopNext(a);   // waypoints: a force at its stop sets off for the next one (rules/movement.js; before the checks below, so the next stop's route gets them like any route)
    // ships on a leg from land to land (a save from before ships kept to the water, MOV-4): a fleet goes back to where it set out from and plans
    // its route again over the water; ships marching with troops are left there as a fleet of their own
    if (a.to !== null && !G.P[a.at].sea && !G.P[a.to].sea && shipsN(a)){
      if (shipsOnly(a)){ const dest = a.path.length ? a.path[a.path.length - 1] : a.to; a.to = null; a.t = 0; a.legFrom = null; a.pos = null; a.path = pathFor(a, a.at, dest); if (!a.path.length){ a.dest = null; if (a.wp) delete a.wp; } }
      else { const f = addArmy(a.owner, a.at, {}); for (const t of UT) if (UNITS[t].cls === 'naval'){ f.u[t] = a.u[t]; f.w[t] = a.w[t]; a.u[t] = 0; a.w[t] = 0; } f.m = a.m; } }
    if (a.to === null && a.path.length && !canEnter(a.owner, a.path[0])){ if (isSeat(a.owner)) tell(a.owner, `Your force halted: ${placeOwner(a.path[0])} is not open to you.`, 'info', a.at); a.path = []; if (a.wp) delete a.wp; }
    // ships never go on land (MOV-4): a mixed force leaves its ships behind before a leg into land they may not dock in, or a leg from land to land
    // (troops march from port to port; the ships would sail round)
    if (a.to === null && a.path.length && shipsN(a) && !shipsOnly(a) && (!portOk(a.owner, a.path[0]) || (!G.P[a.at].sea && !G.P[a.path[0]].sea))){
      const f = addArmy(a.owner, a.at, {}); for (const t of UT) if (UNITS[t].cls === 'naval'){ f.u[t] = a.u[t]; f.w[t] = a.w[t]; a.u[t] = 0; a.w[t] = 0; } f.m = a.m; }
    // and a fleet whose next leg runs from land to land (an old route, or one copied from troops when a force split) or ashore where it may not
    // dock (the port was lost) is planned again over the water (rules/movement.js pathFor), or stops where it is
    if (a.to === null && a.path.length && shipsOnly(a) && !G.P[a.path[0]].sea && (!G.P[a.at].sea || !portOk(a.owner, a.path[0]))){ const dest = a.path[a.path.length - 1]; a.path = dest !== a.at ? pathFor(a, a.at, dest) : [];
      if (!a.path.length){ a.dest = null; if (a.wp) delete a.wp; if (isSeat(a.owner)) tell(a.owner, `${armyName(a)} stays at ${G.P[a.at].cityName || G.P[a.at].name}: no way by sea to ${G.P[dest].cityName || G.P[dest].name}${G.P[dest].sea || portOk(a.owner, dest) ? '' : ', which is no port of yours'}. Ships sail over water only.`, 'info', a.at); } }
    if (a.to === null && a.path.length && !G.P[a.at].nb.has(a.path[0])){ const dest = a.path[a.path.length - 1]; a.path = dest !== a.at ? pathFor(a, a.at, dest) : []; }   // stale route after a retreat or relocation
    // ground forces embark only in a naval port (rules/movement.js embStep): a route that would board ships here, where there is no port of the
    // force's own or a friend's (the port was lost, or an old save's route), is planned again through a port, or the force stops
    if (embLeg(a) && !portOk(a.owner, a.at) && !amphib(a)){ const dest = a.path[a.path.length - 1]; a.path = pathFor(a, a.at, dest); delete a.emb;
      if (!a.path.length){ a.dest = null; if (a.wp) delete a.wp; if (isSeat(a.owner)) tell(a.owner, `${armyName(a)} halted at ${G.P[a.at].cityName || G.P[a.at].name}: no naval port there to embark. March to a port first.`, 'info', a.at); } }
    // NAVAL CITIES: troops come ashore only at a naval city, Marines alone on any coast (rules/movement.js landOk): a route whose next leg lands
    // elsewhere (a stack that is no longer Marines alone) is planned again through a naval city, or the force stays at sea. A route given before the
    // rule (an old save: a.oldLand, rules/state.js restore) still lands where it was going
    if (NAVAL_CITIES && a.to === null && a.path.length && G.P[a.at].sea && !G.P[a.path[0]].sea && !a.oldLand && ground(a) && !landOk(a, a.path[0])){ const dest = a.path[a.path.length - 1]; a.path = pathFor(a, a.at, dest);
      if (!a.path.length){ a.dest = null; if (a.wp) delete a.wp; if (isSeat(a.owner)) tell(a.owner, `${armyName(a)} stays at sea: ${G.P[dest].cityName || G.P[dest].name} has no naval city to land at on the way. Troops come ashore only at a naval city; Marines land on any coast.`, 'info', a.at); } }
    if (a.emb != null && !embLeg(a)) delete a.emb;   // (no longer about to board: the embarking starts again next time)
    if (a.sail){ if (a.path.length){ a.pos = sailXY(a); delete a.sail; } else { sailHour(a, hr); continue; } }   // (a force walking, or a fleet sailing, to a spot inside its province: rules/movement.js)
    let e = -1;
    if (a.to === null && a.path.length && canProceed(a) && (e = embStep(a, hr)) >= 0){ hr = e; a.legFrom = a.pos || null; a.pos = null; a.to = a.path.shift(); a.t = 0; a.forced = false;   // (boarding ships: what is left of the hour once aboard)
      if (a.carry && a.carryH === S.hour - 1 && (legMode(a, a.at, a.to) === 'rail' || seaCarry(a))) a.t = a.carry/legH(a); a.carry = 0; }   // trains run through: no stop at every station (and troops at sea: rules/movement.js seaCarry)
    if (a.to !== null && !G.P[a.to].sea && !canEnter(a.owner, a.to)){ a.pos = a.legFrom && provOfPt(a.legFrom[0], a.legFrom[1]) === a.at ? a.legFrom : null; a.to = null; a.t = 0; a.path = []; a.legFrom = null; if (a.wp) delete a.wp; if (isSeat(a.owner)) tell(a.owner, `${armyName(a)} turned back: ${placeOwner(a.at)} is no longer open to you.`, 'info', a.at); }
    // a fleet sailing into a port that is no longer one of its own or a friend's (taken while it sailed): it stops on the water it set out from (MOV-4)
    if (a.to !== null && !G.P[a.to].sea && shipsOnly(a) && !portOk(a.owner, a.to)){ const lost = a.to; a.pos = a.legFrom && provOfPt(a.legFrom[0], a.legFrom[1]) === a.at ? a.legFrom : null; a.to = null; a.t = 0; a.path = []; a.legFrom = null; a.dest = null; if (a.wp) delete a.wp;
      if (isSeat(a.owner)) tell(a.owner, `${armyName(a)} turned back: ${G.P[lost].cityName || G.P[lost].name} is no longer a port of yours.`, 'info', a.at); }
    if (a.to !== null){ const lh = legH(a); a.t += hr/lh;   // (a leg takes time in proportion to its real length: rules/movement.js legRatio)
      if (a.t >= 1){ const ov = Math.max(0, (a.t - 1)*lh), sea = ground(a) && (G.P[a.at].sea || G.P[a.to].sea);   // ov: the time over this hour once the leg ended
        if (a.path.length && ground(a) && (sea || legMode(a, a.at, a.to) === 'rail')){ a.carry = Math.min(1, ov); a.carryH = S.hour; } else a.carry = 0;
        legArrive(a); if (a.land > 0) landOver(a, ov); }   // (troops coming ashore: the time over goes into the landing)
      else if (!(shipsOnly(a) && !G.P[a.to].sea)) legCross(a, lh); }   // a pinpoint move's last leg: the hour it crosses into its province it arrives there and walks on to the point
  }
  meetHour(MV0);   // hostile columns that meet on the way fight there (below)
  // a seat's forces that arrive where another idle force of its own stands join it (same kind: ground with ground, fleets with fleets), as long as
  // the joined force stays within its stack limit (STACK_LIM); a join order (dragged onto the counter) merges anyway, with the stack-limit warning.
  // PINPOINT-3 (owner 2026-11-27, "setting a waypoint still moves the army to the centre of the province"): a force sent to an exact point is
  // looked at only once it STANDS on its last spot: not the hour it crosses the border (it still walks to the point: a.sail), not at a stop
  // with more to come (a.wp), and it joins only a force standing on that very spot (JOIN_R, 0.1 km). Before, it joined any idle force of its own
  // within about 50 km of the point the hour it crossed the border, and the joined force kept its own place: the starting garrison at the city,
  // so a tap anywhere near a city of your own ended at the city, and a middle stop lost the rest of the plan
  for (const a of S.armies){ const me = a.owner; if (!isSeat(me) || a.air || a.fly || a.to !== null || a.path.length || a.from == null || a.arrH === S.hour || a.land > 0 || !count(a)) continue;   // (troops still landing join once ashore)
    if (a.lastAt === a.at) continue;
    if (a.sail || (a.wp && a.wp.length)){ a.lastAt = null; continue; }   // (still on its way: looked at again where it stops)
    a.lastAt = a.at;
    if (S.owner[a.at] !== me && !(S.owner[a.at] >= 0 && rel(me, S.owner[a.at]).st === 'ally')) continue;
    // a join order picks its partner; any other force joins only a force standing on its very point (JOIN_R). A force with no point (a.pos null)
    // stands at the centre, the city: it joins one at the city, not one standing on a spot elsewhere in the province (that kept its own place)
    const jt = a.join != null ? armyById(a.join) : null, P = G.P[a.at], pin = a.pos || [P.x, P.y];
    const into = (jt && jt !== a && jt.owner === me && !jt.air && !jt.fly && jt.at === a.at && jt.to === null && count(jt) ? jt : null) || S.armies.find(b => b !== a && b.owner === me && !b.air && !b.fly && b.at === a.at && b.to === null && !b.path.length && !b.sail && !(b.wp && b.wp.length) && count(b) && shipsOnly(b) === shipsOnly(a) && !stackPenaltyIf(b, a).over && Math.hypot(pin[0] - (b.pos ? b.pos[0] : P.x), pin[1] - (b.pos ? b.pos[1] : P.y)) < JOIN_R);
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
  // capture: at once, the hour a ground force stands at the province's heart with no enemy force there (rules/movement.js atHeart). S.cap, the
  // occupation clock of older versions, is kept empty (an old save's half-done occupations are dropped: a force at the heart takes the province now)
  let by = index();
  for (let p = 0; p < by.length; p++){
    if (G.P[p].sea) continue;
    if (S.cap[p]) S.cap[p] = null;
    if (!by[p].length) continue;
    { const ow = S.owner[p]; if (by[p].every(a => a.owner === ow)) continue; }   // (only the owner's forces here: nothing below changes anything)
    const list = by[p], owners = new Set(list.map(a => a.owner));
    let hostileToOwner = [...owners].filter(o => o !== S.owner[p] && atWar(o, S.owner[p]));
    if (hostileToOwner.length > 1 && !hostileToOwner.some(x => hostileToOwner.some(y => x !== y && atWar(x, y)))){ const sz = o => list.filter(a => a.owner === o).reduce((s0, a) => s0 + groundN(a), 0); hostileToOwner = [hostileToOwner.sort((x, y) => sz(y) - sz(x))[0]]; }
    if (owners.size >= 1 && hostileToOwner.length === 1 && ![...owners].some(o => o !== hostileToOwner[0] && atWar(o, hostileToOwner[0]))){
      const O = hostileToOwner[0];
      const gN = list.filter(a => a.owner === O).reduce((s, a) => s + groundN(a), 0);
      // (the nations world: a computer nation that has grown enough for now, isSated, takes back its own lost land but no more: in the step 4
      // repair Chad, sated at 28 provinces in the middle of overrunning Sudan, took 3 more with the forces already standing in them)
      if (O !== NEUTRAL && gN >= CAP_MIN && !(S.home[p] !== O && isSated(O)) && list.some(a => a.owner === O && atHeart(a))) capture(p, O);
    }
  }
  yield;
  if (S.hour % 24 === 0){ yield* diploDayG(); yield; yield* dailyG(); yield; }
  // the AI plays every nation that is not a seat (in the nations world a nation far from the fighting plans every other turn: aiAway; on the turn it
  // skips it still starts an Army Base in a capital that has none, aiCapBase)
  for (let n = 0; n < S.nations.length; n++) if (!isSeat(n) && (S.hour + n) % 4 === 0){ if ((S.hour + n) % 24 === 0) aiLinks(n); if ((S.hour + n) % 12 === 0) aiTrade(n); if (!((S.hour + n) % 8 === 4 && aiAway(n))) aiTurn(n); else aiCapBase(n, S.nations[n]); aiAir(n); if ((S.hour + n) % 12 === 0) aiMissiles(n); if ((S.hour + n) % 24 === 0) aiSpies(n); yield; }
  IM.emit('hour');
  visCache = null;
}
/* Columns meet (owner 2026-11-25: "enemy units pass each other without fighting. They should meet and fight"). Battles are fought between forces
   standing in a province, and a force on a leg still counts in the province it set out from until it arrives, so two hostile columns could walk
   through each other: on one road in opposite directions, one leaving a province as the other enters it, one catching up with the other, two
   leaving together. The rule now: two hostile forces that are both on the move (marching a leg, sailing, or walking to a spot inside a province)
   MEET the first moment in the hour they are in the same province or sea zone, and both stop there and fight (the battle step of this same
   hour): halfway from where they met to the province's point, 20 km apart, each on its own side (meetSpots). Where a moving force counts: on a leg u -> v, in the province its spot lies in (u until it crosses into v,
   then v); on a leg between land and sea, at the sea end, aboard (EMB-2: troops come ashore only by a landing; a fleet entering a port is still on
   the water); walking inside a province, in it. The hour's path of each force is a straight line from where it stood as the hour began to where it
   stands now (bent at the province centre when it began a new leg within the hour), sampled 8 times and at the two forces' closest approach.
   Not met: aircraft and forces in flight (paratroopers too), a force standing still (a column marching on a standing enemy fights it as it
   arrives at the centre, as before), and two forces in the province both stood in as the hour began (they were there together already: a
   battle there was fought, or one is withdrawing from it). After a meeting a force keeps its order only when the meeting is in the province it
   was going to: it walks on to its point (or the centre) once the battle there is won (rules/movement.js sailHour); any other order, and its
   waypoints, are dropped (the computer plans again). Meetings are taken in time order, then by force id: deterministic, no dice. */
function meetSnap(){ const L = [];
  for (const a of S.armies){ if (a.air || a.fly || !(a.to !== null || a.path.length || a.sail || a.wp) || !count(a)) continue;
    L.push({a, at:a.at, to:a.to, xy:armyXY(a), end:a.to !== null ? legEnds(a)[1] : null, bat:a.to === null && S.battles.includes(a.at), land:a.land, landed:a.landed, m:a.m}); }
  return L; }
// the province a force counts as in at point q of its leg u -> v (u === v: walking inside u)
function meetProv(u, v, q){ if (u === v) return u; const su = !!G.P[u].sea, sv = !!G.P[v].sea; if (su !== sv) return su ? u : v;
  const p = provOfPt(q[0], q[1]); if (p === u || p === v) return p; const A = G.P[u], B = G.P[v], dx = B.x - A.x, dy = B.y - A.y, L = dx*dx + dy*dy;
  return L && ((q[0] - A.x)*dx + (q[1] - A.y)*dy)/L >= 0.5 ? v : u; }
// where force r is at fraction s of the hour, and the province it counts as in then
function meetAt(r, s){ const a = r.a;
  if (r.mid){ const d1 = Math.hypot(r.mid[0] - r.xy[0], r.mid[1] - r.xy[1]), d2 = Math.hypot(r.xy1[0] - r.mid[0], r.xy1[1] - r.mid[1]), f = d1 + d2 > 1e-9 ? d1/(d1 + d2) : 1;
    if (s < f || (s === f && s < 1)){ const q = lerpPt(r.xy, r.mid, f > 0 ? s/f : 1); return [q, meetProv(r.u0, r.v0, q)]; }
    const q = lerpPt(r.mid, r.xy1, f < 1 ? (s - f)/(1 - f) : 1); return [q, s >= 1 && a.to === null ? a.at : meetProv(r.u1, r.v1, q)]; }
  const q = lerpPt(r.xy, r.xy1, s); return [q, s >= 1 && a.to === null ? a.at : meetProv(r.u0, r.v0, q)]; }
function meetHour(L){ const M = [];
  for (const r of L){ const a = r.a; if (a.air || a.fly || !count(a)) continue; const q = armyXY(a);
    if (a.at === r.at && a.to === r.to && q[0] === r.xy[0] && q[1] === r.xy[1]) continue;   // (did not move)
    r.xy1 = q; r.mid = null;
    // the legs it was on this hour: the one it began on (or set off on), and the next one when it began another within the hour
    if (r.to !== null){ r.u0 = r.at; r.v0 = r.to; if (a.at === r.to && a.to !== null){ r.mid = r.end; r.u1 = a.at; r.v1 = a.to; } }
    else if (a.at !== r.at){ r.u0 = r.at; r.v0 = a.at; if (a.to !== null){ r.mid = [G.P[a.at].x, G.P[a.at].y]; r.u1 = a.at; r.v1 = a.to; } }
    else { r.u0 = r.at; r.v0 = a.to !== null ? a.to : r.at; }
    M.push(r); }
  if (M.length < 2) return;
  const by = new Map(), C = []; for (const r of M) for (const p of new Set([r.u0, r.v0, r.u1 ?? r.u0, r.v1 ?? r.v0])){ const l = by.get(p); if (l) l.push(r); else by.set(p, [r]); }
  const done = new Set();
  for (const l of by.values()) for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++){ let r = l[i], q = l[j]; if (r.a.owner === q.a.owner || !atWar(r.a.owner, q.a.owner)) continue;
    if (r.a.id > q.a.id) [r, q] = [q, r]; const k = r.a.id + ':' + q.a.id; if (done.has(k)) continue; done.add(k);
    if (r.bat && q.bat && r.at === q.at) continue;   // (fighting each other as the hour began: one is withdrawing)
    // the samples: 8 steps, and the moment the two straight paths come closest
    const ts = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1], wx = r.xy[0] - q.xy[0], wy = r.xy[1] - q.xy[1], vx = (r.xy1[0] - r.xy[0]) - (q.xy1[0] - q.xy[0]), vy = (r.xy1[1] - r.xy[1]) - (q.xy1[1] - q.xy[1]), vv = vx*vx + vy*vy;
    if (vv > 1e-12){ const tc = -(wx*vx + wy*vy)/vv; if (tc > 0 && tc < 1){ ts.push(tc); ts.sort((x, y) => x - y); } }
    for (const s of ts){ const [pr, ar] = meetAt(r, s), [pq, aq] = meetAt(q, s); if (ar !== aq || (ar === r.at && ar === q.at)) continue;   // (the province both stood in as the hour began: below)
      C.push({s, p:ar, r, q, pr, pq, ts}); break; } }
  if (!C.length) return;
  C.sort((x, y) => x.s - y.s || x.r.a.id - y.r.a.id || x.q.a.id - y.q.a.id);
  const met = new Map(), say = (a, b, p) => { for (const me of new Set([a.owner, b.owner])) if (isSeat(me)) tell(me, `Columns clash near ${G.P[p].cityName || G.P[p].name}: ${armyLabel(a, me)} met ${armyLabel(b, me)} on the road.`, 'bad', p); };
  for (const c of C){ const a = c.r.a, b = c.q.a, ma = met.get(a), mb = met.get(b); if (ma && mb) continue;
    if (!ma && !mb){ const [sr, sq] = meetSpots(c); meetStop(a, c.r, sr, c.p); meetStop(b, c.q, sq, c.p); met.set(a, {s:c.s, p:c.p, r:c.r}); met.set(b, {s:c.s, p:c.p, r:c.q}); say(a, b, c.p); continue; }
    // one of the two has already met another force and stopped there: the other meets it too if it comes into that province later in the hour
    const m = ma || mb, ur = ma ? c.q : c.r, u = ur.a;
    for (const s of c.ts){ if (s < m.s) continue; const [pu, au] = meetAt(ur, s); if (au !== m.p || (au === ur.at && au === m.r.at)) continue;
      const o = m.r.a, op = o.pos || [G.P[au].x, G.P[au].y]; let dx = wrapDX(ur.xy[0] - op[0]), dy = ur.xy[1] - op[1], d = Math.hypot(dx, dy); if (d < 1e-6){ dx = 1; dy = 0; d = 1; }
      meetStop(u, ur, [op[0] + dx/d*2*MEET_SEP*KM_W, op[1] + dy/d*2*MEET_SEP*KM_W], au); met.set(u, {s, p:au, r:ur}); say(a, b, au); break; } } }   // (it stands on its own side of the force it met)
// where two forces stand once they have met (meeting c): halfway from the meeting point to the province's point, as the old head-on clash had it
// (a meeting is mostly near a border, and the drawn border runs up to a cell off the cells' edge: this keeps the battle inside the province as
// drawn), MEET_SEP km either side of it along the line they came together on, each on its own side: the two face each other, and neither
// counter, nor its troops, covers the other's
const MEET_SEP = 10;   // km
const wrapDX = d => d - Math.round(d/WORLD_W)*WORLD_W;   // (across the map's east-west seam)
function meetSpots(c){ const P = G.P[c.p], s0 = Math.max(0, c.s - 0.125), r0 = meetAt(c.r, s0)[0], q0 = meetAt(c.q, s0)[0];
  let dx = wrapDX(r0[0] - q0[0]), dy = r0[1] - q0[1];   // (from q to r just before they met; else against their motion relative to each other)
  if (Math.hypot(dx, dy) < 1e-6){ dx = wrapDX(c.r.xy[0] - c.r.xy1[0]) - wrapDX(c.q.xy[0] - c.q.xy1[0]); dy = (c.r.xy[1] - c.r.xy1[1]) - (c.q.xy[1] - c.q.xy1[1]); }
  let d = Math.hypot(dx, dy); if (d < 1e-6){ dx = 1; dy = 0; d = 1; }
  const ux = dx/d*MEET_SEP*KM_W, uy = dy/d*MEET_SEP*KM_W, mx = c.pq[0] + wrapDX(c.pr[0] - c.pq[0])/2, my = (c.pr[1] + c.pq[1])/2, bx = mx + wrapDX(P.x - mx)/2, by = (my + P.y)/2;
  return [[bx + ux, by + uy], [bx - ux, by - uy]]; }
// a force that met an enemy: it stops in province p at point xy (keeping on only to its point in p, when p is where it was going: meetHour)
function meetStop(x, r, xy, p){
  // where it was going: the province, and the point there (its exact point; the end of its walk; the centre; where it already stands)
  const fin = x.dest ? x.dest.p : x.path.length ? x.path[x.path.length - 1] : x.to !== null ? x.to : x.at;
  const goal = fin !== p ? null : x.dest ? [x.dest.x, x.dest.y] : x.sail ? (x.sail.nx || x.sail.to) : x.to !== null || x.path.length ? [G.P[p].x, G.P[p].y] : r.xy1;
  if (p !== x.at){ x.from = x.at; x.froms = [x.at]; atMove(x, p); } else if (r.at !== p){ x.from = r.at; x.froms = [r.at]; }
  if (G.P[p].sea && x.land > 0 && !(r.land > 0)){ delete x.land; x.landed = r.landed; x.m = r.m; }   // (met on the water before coming ashore: still aboard)
  x.to = null; x.t = 0; x.path = []; x.legFrom = null; x.dest = null; x.carry = 0; x.forced = false; delete x.hrt; delete x.sail; delete x.emb; if (x.wp) delete x.wp;
  x.pos = shipsOnly(x) && !G.P[p].sea ? null : ptIn(p, xy[0], xy[1]);
  if (goal && x.pos){ const D = Math.hypot(goal[0] - x.pos[0], goal[1] - x.pos[1]);   // (it walks on once the battle there is won: rules/movement.js sailHour)
    if (D/KM_W >= 1){ const ws = walkSpeed(x, p); x.sail = sailTo(x, p, x.pos, [goal[0], goal[1]], d => Math.max(1e-6, d/KM_W*24/(ws*KM_HEX))); } } }
// One 15-minute step of game time. S.q counts the battle steps already run this hour (0..3, saved; old saves have none = 0): three steps are battle-only,
// the fourth is the hour's tick. The game loop and tools/headless.js call tickQ; tick() plays a whole game hour (what the tests and tools use).
function tickQ(){ if (TQP !== null){ tickFinish(); return; }   // (an hour the page left half run is this step: it is finished)
  tickDepth++; tickSess++; try { const q = S.q || 0; if (q + 1 < BATTLE_Q){ S.q = q + 1; consQuarter(); rangedStep(false); battleStep(false); return; } S.q = 0; tickHour(); } finally { tickDepth--; } }
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
      const fo = owners.filter(o => o !== me), reb = fo.every(o => sides.get(o).every(a => a.rebel)), foes = fo.map(o => sides.get(o).every(a => a.rebel) ? 'Rebels' : nationName(o)).join(', ');
      if (S.owner[p] === me){ if (!(reb && S.rbl && S.rbl.some(e => e.p === p && e.o === me))) tell(me, `${foes} attack${fo.length > 1 || reb ? '' : 's'} ${G.P[p].cityName || G.P[p].name}! Defend it.`, 'bad', p); alarm(me); }   // (a rising: its own dispatch, rebelRise, has said it)
      else tell(me, `Battle at ${G.P[p].cityName || G.P[p].name} against ${foes}.`, 'bad', p);
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
      if (o === S.owner[p]){ f /= 1.25; f *= 1 - bunkerRed(bunkerLv(p)); const dd = docOf(o); if (dd && dd.home && S.home[p] === o) f *= dd.home; }
      if (!G.P[p].sea && (o === S.owner[p] || (S.owner[p] < 0 && o < 0))) f /= terr(p).def;
      f *= rHospF(o);
      const d = dmg.get(o), tot = hp.get(o);
      const escorted = G.P[p].sea && sides.get(o).some(b => shipsN(b) > 0);
      const bs = B.s[o];
      for (const a of sides.get(o)){ const u0 = {...a.u}; hurt(a, d, f*(G.P[p].sea && ground(a) ? (escorted ? 0.75 : 1.5) : 1)/tot*(o === S.owner[p] ? 1 - 0.12*cmdF(a, 'shield') : 1)*digF(a)); cmdXP(a, (a._dealt0 || 0)*0.5); for (const t of UT) if (u0[t] > a.u[t]) bs.lost[t] = (bs.lost[t] || 0) + u0[t] - a.u[t]; }
      if (hourly){ bs.hp.push(Math.round(sides.get(o).reduce((s0, a) => s0 + armyHP(a), 0))); if (bs.hp.length > 96) bs.hp.shift(); }   // (the history keeps one point per game hour)
    }
    // morale: a force in a fight loses 1 a game hour (not a garrison holding its city against a rising: risingHold) and 40 × the share of its health lost, spread over the hour's battle steps (the break and retreat check is hourly: armyUpkeep)
    for (const a of list){ if (a.owner < 0 || !count(a) || risingHold(a)) continue; const lost = a._h ? Math.max(0, (a._h - effHP(a))/a._h) : 0; a.m = Math.max(0, (a.m ?? 80) - 1/BATTLE_Q - 40*lost); }
    IM.emit('fxBattle', p, owners, sides, list);
    const here = owners.filter(isSeat);   // the seats fighting here: their statistics and dispatches
    for (const me of here){ const size = list.reduce((s0, a) => s0 + (a._n0 ?? count(a)), 0); const D = desk(me), st0 = D.stats || (D.stats = {}); if (size > (st0.bigBattle || 0)){ st0.bigBattle = size; st0.bigBattleAt = G.P[p].cityName || G.P[p].name; st0.bigBattleDay = dayOf(S.hour); } }
    for (const me of here) for (const a of list){ const lost = (a._n0 ?? count(a)) - count(a); if (lost > 0) bump(me, a.owner === me ? 'unitsLost' : 'unitsKilled', lost); }
    for (const a of list) if (count(a) === 0) IM.emit('fxWreck', p, owners, a);   // the client draws the wreck where its seat fought or can see
    for (const a of list) if (count(a) === 0 && a.cmd != null) cmdLost(a);
    for (const a of list) if (count(a) === 0) for (const me of here){
      if (a.owner === me) tell(me, `${armyName(a)} was destroyed at ${G.P[p].cityName || G.P[p].name}.`, 'bad', p);
      else if (!(a.rebel && S.rbl && S.rbl.some(e => e.id === a.id && e.o === me))) tell(me, `${armyLabel(a, me)} destroyed at ${G.P[p].cityName || G.P[p].name}.`, 'good', p);   // (a rising crushed: rebelHour reports it once)
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
    // (a computer nation at peace is left out: it never starts a war, AI_STARTS_WARS, and its forces near the border are its own cities' garrisons)
    // (only forces the seat has identified, armyKnown: the warning names their nation and strength, which a force only spotted ('?') does not
    // tell, and an army outside its land and out of its units' sight tells it nothing, owner 2026-11-25)
    const mass = new Map(), sv = visibleSet(me); for (const x of S.armies){ if (x.owner < 0 || x.owner === me || x.air || !S.nations[x.owner].alive) continue; const r = rel(me, x.owner).st; if (r === 'ally' || (!AI_STARTS_WARS && r !== 'war' && !isSeat(x.owner)) || !armyKnown(x, sv)) continue;
      if (border.some(P => P.nbs.includes(x.at) || P.id === x.at)) mass.set(x.owner, (mass.get(x.owner) || 0) + power(x)); }
    const mine = border.reduce((s0, P) => s0 + armiesOf(me).filter(x => x.at === P.id && !x.air).reduce((s1, x) => s1 + power(x), 0), 0);
    for (const [o, pw] of mass){ const grew = pw > (W['p' + o] ?? pw)*1.2; W['p' + o] = Math.max(pw*0.9, Math.min(W['p' + o] ?? pw, pw));
      if (day >= 3 && grew && pw > 40 && pw > mine*1.4 && (!W[o] || day - W[o] >= 5)){ W[o] = day; const r = rel(me, o).st;
      tell(me, `${nationName(o)} ${r === 'war' ? 'has' : 'is massing'} ${Math.round(pw)} strength on your border against your ${Math.round(mine)}. ${r === 'war' ? 'Reinforce the front.' : 'Recruit defenders or seek a pact in Diplomacy.'}`, 'bad', border[0].id); } }
    const idle = G.P.filter(P => S.owner[P.id] === me && P.city && !S.queue[P.id].length);
    const N0 = S.nations[me], lowMp = N0.mp < 25, lowMetal = N0.metal < 15*RES_K, lowIron = N0.iron < 12*RES_K, lowElec = N0.elec < 8*RES_K;
    if (warsOf(me).length && idle.length && N0.cash > 250 && (!W.idle || day - W.idle >= 3)){ W.idle = day;
      tell(me, lowMp ? `At war with $${fmt(N0.cash)}M but only ${fmt(N0.mp)}k manpower: money is not your limit. Raise Mobilisation in Production, build Recruiting Offices, or capture populous provinces.`
        : lowMetal ? `At war with $${fmt(N0.cash)}M but only ${fmt(N0.metal)} materials: buy more on the Market (T) or build an Arms Industry in a materials city.`
        : lowIron ? `At war with $${fmt(N0.cash)}M but only ${fmt(N0.iron)} iron for armor, guns and ships: buy more on the Market (T) or build an Arms Industry in an iron city.`
        : lowElec ? `At war with $${fmt(N0.cash)}M but only ${fmt(N0.elec)} electronics for aircraft, drones and air defence: buy more on the Market (T) or build an Arms Industry in an electronics city.`
        : `At war with $${fmt(N0.cash)}M unspent and ${idle.length} idle ${idle.length === 1 ? 'city' : 'cities'}: open Production (P) to queue defenders.`, 'bad', idle[0].id); } }
  for (const N of S.nations){ if (!N.alive) continue; const inc = income(N.id), was = N.short || {};
    N.short = {}; const SU = {}; let su = false;   // SU: the share of the day's need of each short resource left unmet (the morale target's shortage: rules/economy.js natMor)
    const cap = stockCap(N.id), capMp = stockCap(N.id, 'mp');   // (goods at RES_K; manpower in thousands)
    for (const R of RES){ const v = N[R.k] + inc.net[R.k]; if (v < 0){ N.short[R.k] = true; N[R.k] = 0; const need = inc.upkeep[R.k] || 0; SU[R.k] = need > 0 ? Math.round(Math.min(1, -v/need)*1000)/1000 : 1; su = true; } else N[R.k] = R.k === 'cash' ? v : Math.min(R.k === 'mp' ? capMp : cap, v); }
    if (su) N.shortU = SU; else delete N.shortU;
    if (isSeat(N.id)){ const D = desk(N.id), st0 = D.stats || (D.stats = {}), mk = st0.made || (st0.made = {}); for (const R of RES) mk[R.k] = (mk[R.k] || 0) + Math.max(0, inc.gross[R.k]); }   // produced over the campaign (statistics)
    if (isSeat(N.id)){ for (const k of ['oil', 'iron', 'elec', 'cash']) if (N.short[k] && !was[k]) tell(N.id, SHORT_MSG[k], 'bad'); } }
  yield;
  moraleDay();   // (morale, casualties and rebels: rules/economy.js)
  recordStats();
  makePaper();
  checkEnd();
  IM.emit('day');
}
