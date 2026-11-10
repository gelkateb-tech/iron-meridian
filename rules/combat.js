// Iron Meridian rules: combat. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
// frontage: how many units can fight at once in a province; the rest wait in reserve and fight at 25%
const FRONT_T = {mountain:0.6, urban:0.75, forest:0.8, tundra:0.9, hills:0.85, marsh:0.7, snow:0.75};
const frontage = p => G.P[p].sea ? 18 : Math.round(14*(FRONT_T[G.P[p].terrain] || 1)) + (G.P[p].city ? 2 : 0);
const frontScale = (n, F) => n <= F ? 1 : (F + 0.25*(n - F))/n;
// attack directions: distinct neighbouring provinces the attacking side's forces came from
function dirsOf(arr, p, o){ if (o === S.owner[p]) return 0; const d = new Set(); for (const a of arr){ if (a.owner !== o || !count(a)) continue; for (const f of (a.froms || (a.from != null ? [a.from] : []))) if (f !== p) d.add(G.P[f].sea ? 'sea' : f); } return d.size; }
// directions a force is about to attack from: its own approach plus every other force of its nation already ordered there.
// via: the province a route being planned would enter from (the client's route preview passes it); without it, where the force stands or is heading
function plannedDirs(a, t, via = null){ const d = new Set(), last = x => { const pth = x.path; if (pth.length && pth[pth.length - 1] === t) return pth.length > 1 ? pth[pth.length - 2] : (x.to ?? x.at); if (!pth.length && x.to === t) return x.at; return null; };
  const pv = via != null ? via : (a.to ?? a.at); d.add(G.P[pv].sea ? 'sea' : pv);
  for (const x of S.armies){ if (x === a || x.owner !== a.owner || x.air || !count(x)) continue; const l = last(x); if (l != null) d.add(G.P[l].sea ? 'sea' : l); if (x.at === t && x.to === null) for (const f of (x.froms || [])) d.add(G.P[f].sea ? 'sea' : f); }
  return d.size; }
const flankF = d => 1 + 0.15*Math.min(3, Math.max(0, d - 1));
const sideFront = (p, dirs) => Math.round(frontage(p)*(1 + 0.5*Math.max(0, dirs - 1)));
/* ---------------- Commanders ---------------- */
const TRAITS = {
  blitz:{name:'Blitz', icon:'»', desc:'+15% speed; +10% attack when attacking (×rank)'},
  shield:{name:'Shield', icon:'◆', desc:'Takes 12% less damage when defending (×rank)'},
  gunner:{name:'Artillerist', icon:'✦', desc:'Artillery and SAMs +20% attack (×rank)'},
  supply:{name:'Logistician', icon:'✚', desc:'No attrition when cut off; heals 50% faster (×rank)'},
  siege:{name:'Siegemaster', icon:'▲', desc:'Captures provinces 25% faster (×rank)'},
};
const CMD_FIRST = ['Adair', 'Bram', 'Calla', 'Dorian', 'Elin', 'Farah', 'Galen', 'Hana', 'Ilya', 'Juno', 'Kasimir', 'Lena', 'Marek', 'Nadia', 'Oren', 'Petra', 'Quinn', 'Rhea', 'Soren', 'Talia', 'Udo', 'Vera', 'Wren', 'Yara', 'Zane'];
const CMD_LAST = ['Ashford', 'Brandt', 'Corvin', 'Dahl', 'Ekwall', 'Ferro', 'Garrow', 'Hale', 'Ivers', 'Jasko', 'Kell', 'Lorne', 'Marlow', 'Noor', 'Orlov', 'Pryce', 'Quist', 'Rook', 'Sabre', 'Thorne', 'Ulric', 'Voss', 'Wilde', 'Yates', 'Zorin'];
const CMD_COST = 80, CMD_MAX = 3, RANKS = ['', 'Colonel', 'General', 'Marshal'];
function cmdList(n){ return (S.cmds || (S.cmds = [])).filter(c => c.owner === n && c.alive); }
function newCommander(n){ const r = () => rng(), t = Object.keys(TRAITS)[Math.floor(r()*5)], c = {id:S.nid++, owner:n, name:`${CMD_FIRST[Math.floor(r()*CMD_FIRST.length)]} ${CMD_LAST[Math.floor(r()*CMD_LAST.length)]}`, trait:t, rank:1, xp:0, alive:true, army:null};
  (S.cmds || (S.cmds = [])).push(c); return c; }
const cmdOf = a => a && a.cmd != null && S.cmds ? S.cmds.find(c => c.id === a.cmd && c.alive) || null : null;
const cmdF = (a, t) => { const c = cmdOf(a); return c && c.trait === t ? c.rank : 0; };
function cmdLost(a){ const c = cmdOf(a); if (!c) return; c.army = null; a.cmd = null;
  if (rng() < 0.5){ c.alive = false; if (isSeat(a.owner)) tell(a.owner, `${RANKS[c.rank]} ${c.name} was captured when ${armyName(a)} was destroyed.`, 'bad', a.at); }
  else if (isSeat(a.owner)) tell(a.owner, `${RANKS[c.rank]} ${c.name} escaped when ${armyName(a)} was destroyed and awaits a new command.`, 'info', S.nations[a.owner].capital); }
function cmdXP(a, dealt){ const c = cmdOf(a); if (!c || dealt <= 0) return; c.xp += dealt; const need = [0, 200, 600, 1e9][c.rank];
  if (c.xp >= need && c.rank < 3){ c.rank++; if (isSeat(a.owner)) tell(a.owner, `${c.name} promoted to ${RANKS[c.rank]}: the ${TRAITS[c.trait].name} trait is now ${c.rank}× as strong.`, 'good', a.at); } }
function stationaryAt(p){ return S.armies.filter(a => a.at === p && a.to === null && !a.fly && !a.air); }
function enemiesAt(p, owner){ return S.armies.some(a => a.at === p && a.to === null && !a.fly && !a.air && atWar(a.owner, owner) && count(a) > 0); }
function index(){ const by = G.P.map(() => []); for (const a of S.armies) if (a.to === null && !a.fly && !a.air) by[a.at].push(a); return by; }
// a force is dug in when it has stood 12 game hours or more on its own ground (or in a friendly fortified province), or holds the Defend stance
const DIG_H = 12;
const dugIn = a => !!a && !a.air && !a.fly && a.to === null && !a.path.length && !G.P[a.at].sea && count(a) > 0 &&
  (a.stance === 'defend' || (a.still != null && S.hour - a.still >= DIG_H && (S.owner[a.at] === a.owner || (S.bld[a.at].fort > 0 && S.owner[a.at] >= 0 && a.owner >= 0 && friendly(a.owner, S.owner[a.at])))));
function endBattle(p){
  const B = S.bt && S.bt[p]; if (!B) return; delete S.bt[p];
  const os = Object.keys(B.s).map(Number);
  for (const me of os) if (isSeat(me)) battleReport(p, B, os, me); }
// the report of a finished battle for a seat that fought in it (its Reports list, with a dispatch that opens it)
function battleReport(p, B, os, me){ const D = desk(me);
  const here = new Set(S.armies.filter(a => a.at === p && a.to === null && !a.air).map(a => a.owner));
  const lostN = o => Object.values(B.s[o].lost).reduce((x, y) => x + y, 0);
  const mine = lostN(me), theirs = os.filter(o => o !== me).reduce((x, o) => x + lostN(o), 0);
  const res = here.has(me) && !os.some(o => o !== me && here.has(o) && atWar(o, me)) ? 'win' : !here.has(me) && os.some(o => o !== me && here.has(o)) ? (mine >= theirs*0.5 ? 'loss' : 'draw') : 'draw';
  const R = {p, h0:B.h0, h1:S.hour, s:B.s, res, terrain:G.P[p].sea ? 'Open sea' : terr(p).name, front:frontage(p)};
  (D.reports || (D.reports = [])).unshift(R); if (D.reports.length > 20) D.reports.length = 20;
  if (res === 'win' && B.s[me] && B.s[me].dirs >= 3) IM.emit('achieve', me, 'flanker');
  const nm = G.P[p].cityName || G.P[p].name, hrs = S.hour - B.h0;
  const e = tell(me, `Battle of ${nm} ${res === 'win' ? 'won' : res === 'loss' ? 'lost' : 'ended'} after ${hrs} h: you lost ${mine} unit${mine === 1 ? '' : 's'}, they lost ${theirs}. Click for the report.`, res === 'win' ? 'good' : res === 'loss' ? 'bad' : 'info', p);
  e.rep = S.hour*10000 + p;  R.id = e.rep;
}
function rangedHour(){ let by = null;   // stationary forces per province, built once per hour on first use (stationaryAt scans every army)
  for (const a of S.armies){ if (a.owner < 0 || !(a.u.art || a.u.mlrs) || a.air || a.fly || a.to !== null || G.P[a.at].sea || S.battles.includes(a.at) || a.fire === 'hold') continue;
    if (!by) by = index(); const stAt = v => by[v];
    const near = new Set(G.P[a.at].nbs.filter(v => !G.P[v].sea)), far = new Set(); if (a.u.mlrs) for (const v of near) for (const w of G.P[v].nbs) if (!G.P[w].sea && w !== a.at && !near.has(w)) far.add(w);
    let best = -1, bp = 0; for (const v of [...near, ...far]){ const foes = stAt(v).filter(b => b.owner >= 0 && atWar(a.owner, b.owner) && count(b) > 0); const pw = foes.reduce((s0, b) => s0 + power(b), 0)*(near.has(v) ? 1.1 : 1); if (pw > bp){ bp = pw; best = v; } }
    if (best < 0) continue;
    const foes = stAt(best).filter(b => b.owner >= 0 && atWar(a.owner, b.owner) && count(b) > 0), tot = foes.reduce((s0, b) => s0 + armyHP(b), 0) || 1;
    const av = {soft:0, armored:0, air:0, naval:0}, shooters = (near.has(best) ? [['art', a.u.art], ['mlrs', a.u.mlrs]] : [['mlrs', a.u.mlrs]]).filter(e => e[1]);
    const cov = Math.min(1, terr(best).art); let base = 0; for (const [t, n] of shooters){ const b0 = n*st(a.owner, t, 'atk')*K*0.28*moraleF(a)*(1 + 0.2*cmdF(a, 'gunner'))*(0.8 + rng()*0.4)*cov; base += b0; for (const k of CLASSES) av[k] += b0*mult(t, k); }
    if (!base) continue;
    for (const b of foes){ const h0 = effHP(b), u0 = count(b); hurt(b, av, (b.owner === S.owner[best] ? Math.pow(0.8, S.bld[best].fort) : 1)/tot); const lost = Math.max(0, h0 - effHP(b));
      if (lost >= 0.5) IM.emit('fxRanged', a, b, best, lost);   // the client shows the damage number
      if (u0 - count(b) > 0){ bump(a.owner, 'unitsKilled', u0 - count(b)); bump(b.owner, 'unitsLost', u0 - count(b)); } }
    cmdXP(a, base*0.4); warDamage(best, 1.2);
    IM.emit('fxRanged', a, null, best, 0);   // the client draws the shells
    if (!a.lastFireLog || S.hour - a.lastFireLog > 12){ a.lastFireLog = S.hour; if (isSeat(a.owner)) tell(a.owner, `${armyName(a)} is shelling enemy forces in ${G.P[best].cityName || G.P[best].name}.`, 'info', best); }
  }
  removeEmpty(); }
// a force sent to join another (dragged onto its counter) merges into it on arrival; it follows if the other force moved on
function joinHour(){ let any = false; for (const a of S.armies){ if (a.join == null || !count(a)) continue; const b = armyById(a.join);
    if (!b || b === a || b.owner !== a.owner || !count(b) || b.air || b.fly){ delete a.join; continue; }
    if (a.to !== null || a.path.length) continue;
    if (a.at === b.at && b.to === null){ delete a.join; merge(b, a); any = true; if (isSeat(a.owner)){ tell(a.owner, `${armyName(a)} joined ${armyName(b)} at ${G.P[b.at].cityName || G.P[b.at].name}: ${pluN(count(b), 'unit')}.`, 'good', b.at); IM.emit('merged', a.id, b.id); } continue; }
    const pth = pathFor(a, a.at, b.to ?? b.at); if (pth.length){ a.path = pth; a.forced = true; } else delete a.join; }
  if (any) removeEmpty(); }
function chaseHour(){ for (const a of S.armies){ if (a.chase == null) continue; const e = armyById(a.chase);
    if (!e || !count(e) || !atWar(a.owner, e.owner)){ a.chase = null; continue; }
    const dest = e.to ?? e.at, last = a.path.length ? a.path[a.path.length - 1] : a.to;
    if ((a.at === e.at && a.to === null) || dest === last) continue;
    const pth = pathFor(a, a.to ?? a.at, dest); if (pth.length) a.path = pth; } }
function hurt(a, d, f){
  // d: damage per defender class for the whole side; each unit type takes its HP share of its class's value
  if (a.air && a.air.wear) f *= 1 + 0.4*a.air.wear;   // worn airframes
  for (const t of UT){ const n = a.u[t]; if (!n) continue; const dv = d[UK[t]];
    a.w[t] += (dv !== undefined ? dv : d[UNITS[t].cls])*f*(n*UNITS[t].hp)*4/(4 + st(a.owner, t, 'def'));
    while (a.w[t] >= UNITS[t].hp && a.u[t] > 0){ a.w[t] -= UNITS[t].hp; a.u[t]--; }
    if (!a.u[t]) a.w[t] = 0; }
}
function capture(p, O){
  const prev = S.owner[p], wasCap = isCapital(p);
  IM.emit('fxCapture', p, O, prev);   // before the owner changes: the client marks the capture on the map
  S.owner[p] = O; S.cap[p] = null; S.queue[p] = []; S.cons[p] = null; S.bld[p].fort = Math.max(0, S.bld[p].fort - 1);
  if (!S.occ) S.occ = G.P.map(() => null);
  S.occ[p] = (S.home && S.home[p] === O) ? null : S.hour;
  S.unrest = S.unrest || G.P.map(() => 0); S.unrest[p] = S.home[p] === O ? 0 : Math.max(unrestOf(p), G.P[p].city ? 30 : 15);
  geoChanged();
  const nm = G.P[p].name;
  if (isSeat(O)){ const D = desk(O); (D.tut || (D.tut = {})).capture = true; bump(O, 'taken'); cue(O, 'capture'); }
  for (const w of S.armies){ if (!w.air || w.fly || w.air.base !== p || w.owner === O) continue; const nb = nearestAirbase(w.owner, p); if (nb >= 0 && nb !== p){ w.air.base = nb; w.at = nb; w.air.cd = 4; if (isSeat(w.owner)) tell(w.owner, `Your air wing escaped from ${G.P[p].cityName || G.P[p].name} to ${G.P[nb].cityName || G.P[nb].name}.`, 'info', nb); } else { for (const t of UT) w.u[t] = 0; if (isSeat(w.owner)) tell(w.owner, `Your air wing was destroyed on the ground at ${G.P[p].cityName || G.P[p].name}.`, 'bad', p); } }
  if (isSeat(prev)){ bump(prev, 'lost'); cue(prev, 'lose'); }
  tellAll(me => O === me ? `You captured ${nm}${wasCap ? `, capital of ${nationName(prev)}` : ''}.` : prev === me ? `${nationName(O)} captured ${nm}.` : wasCap ? `${nationName(O)} took ${nm}, capital of ${nationName(prev)}.` : null, me => O === me ? 'good' : prev === me ? 'bad' : '', p);
  if (prev >= 0) checkNation(prev, O);
  checkEnd();
}
function stanceHour(){
  // stances are the standing orders of a seat's forces (the AI moves its own forces itself)
  for (const a of S.armies){ if (isSeat(a.owner) && !a.air){ const cur = effHP(a); a.peak = Math.max(cur, S.battles.includes(a.at) ? (a.peak || cur) : (a.peak || cur)*0.996); } }
  for (const a of S.armies){ const me = a.owner; if (!isSeat(me) || a.air || !a.stance || a.stance === 'hold' || !count(a) || shipsOnly(a)) continue;
    const idle = a.to === null && !a.path.length, inBattle = S.battles.includes(a.at);
    if (a.stance === 'retreat' && strengthFrac(a) < 0.4 && (inBattle || S.owner[a.at] !== me || !G.P[a.at].city)){
      let best = -1, bd = 1e9; for (const P of G.P){ if (S.owner[P.id] !== me || !P.city || P.id === a.at || S.battles.includes(P.id)) continue; const d = Math.hypot(P.x - G.P[a.at].x, P.y - G.P[a.at].y); if (d < bd){ bd = d; best = P.id; } }
      if (best >= 0 && (a.path.length === 0 || a.path[a.path.length - 1] !== best)){ const pth = pathFor(a, a.to !== null ? a.to : a.at, best); if (pth.length){ a.path = pth; a.forced = true; a.home = null; tell(me, `${armyName(a)} is falling back to ${G.P[best].cityName || G.P[best].name} to recover.`, 'info', best); } } continue; }
    if (a.stance === 'defend' && idle && !inBattle){
      if (a.home == null) a.home = a.at;
      const seen = new Map([[a.at, 0]]), q = [a.at]; let tgt = -1;
      for (let h = 0; h < q.length && tgt < 0; h++){ const u = q[h], du = seen.get(u); if (du >= 3) continue;
        for (const v of G.P[u].nbs){ if (seen.has(v) || G.P[v].sea || S.owner[v] !== me) continue; seen.set(v, du + 1); q.push(v);
          const foes = stationaryAt(v).filter(b => atWar(me, b.owner)); if (foes.length && odds(a, v, foes) >= 1){ tgt = v; break; } } }
      if (tgt >= 0){ const pth = pathFor(a, a.at, tgt); if (pth.length){ a.path = pth; a.forced = true; tell(me, `${armyName(a)} moves to defend ${G.P[tgt].cityName || G.P[tgt].name}.`, 'info', tgt); } }
      else if (a.home !== a.at && !S.armies.some(b => b !== a && atWar(me, b.owner) && b.at === a.at)){ const pth = pathFor(a, a.at, a.home); if (pth.length){ a.path = pth; } else a.home = a.at; } }
  }
}
function oddsParts(a, t, foes, dirs, via = null){ if (dirs === undefined) dirs = plannedDirs(a, t, via);
  const F = frontage(t), fn = foes.reduce((s, b) => s + count(b), 0), raw = foes.reduce((s, b) => s + power(b), 0);
  const defOwn = foes.some(b => b.owner === S.owner[t]), ownBonus = (G.P[t].sea ? 1 : terr(t).def)*1.25/Math.pow(0.8, S.bld[t].fort || 0);
  let d = raw*frontScale(fn, F)*(defOwn ? ownBonus : 1);
  const pv = via != null ? via : (a.to ?? a.at), river = !G.P[t].sea && G.P[t].river.has(pv) && S.owner[t] !== a.owner;
  const fitA = terrFit(a, t, S.owner[t] !== a.owner), fitD = foes.length ? foes.reduce((s, b) => s + power(b)*terrFit(b, t, S.owner[t] !== b.owner), 0)/Math.max(1e-6, raw) : 1; d *= fitD;
  return {mine:power(a)*frontScale(count(a), sideFront(t, dirs))*flankF(dirs)*(river ? RIVER_ATK : 1)*(S.owner[t] === a.owner ? ownBonus : 1)*fitA, theirs:d, raw, river, dirs, defOwn, fitA, fitD};
}
function odds(a, t, foes, dirs, via){
  if (!foes.length) return Infinity;
  const o = oddsParts(a, t, foes, dirs, via); return o.mine/Math.max(1, o.theirs);
}
