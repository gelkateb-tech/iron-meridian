// Iron Meridian rules: diplomacy. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
// relVer counts every change of a relation (the client redraws its relations map when it moves)
let relVer = 0;
const rkey = (a, b) => a < b ? a + ',' + b : b + ',' + a;
function rel(a, b){ if (a === b) return {st:'self'}; if (a < 0 || b < 0) return {st:'war'}; const k = rkey(a, b); return S.rel[k] || (S.rel[k] = {st:'peace', since:0, until:null}); }
const atWar = (a, b) => a !== b && a !== SEA && b !== SEA && (a < 0 || b < 0 ? true : rel(a, b).st === 'war');
const friendly = (a, b) => a === b || (a >= 0 && b >= 0 && ['pass', 'ally'].includes(rel(a, b).st));
const canEnter = (n, v) => G.P[v].sea || S.owner[v] === n || S.owner[v] < 0 || atWar(n, S.owner[v]) || friendly(n, S.owner[v]);
const warsOf = n => S.nations.filter(m => m.alive && m.id !== n && atWar(n, m.id)).map(m => m.id);
const alliesOf = n => S.nations.filter(m => m.alive && m.id !== n && rel(n, m.id).st === 'ally').map(m => m.id);
let NPC = {v:-1, a:null};
const natPower = n => { if (NPC.v !== tickVer || NPC.S !== S){ const arr = new Float64Array(S.nations.length); for (const a of S.armies) if (a.owner >= 0) arr[a.owner] += power(a); NPC = {v:tickVer, S, a:arr}; } return NPC.a[n]; };
let borderCache = null;
function borders(a, b){
  if (!borderCache || borderCache.h !== S.hour){ const set = new Set();
    for (const P of G.P){ if (P.sea) continue; const o = S.owner[P.id]; if (o < 0) continue; for (const q of P.nbs){ const o2 = S.owner[q]; if (o2 >= 0 && o2 !== o && !G.P[q].sea) set.add(o + ',' + o2); } }
    borderCache = {h:S.hour, set}; }
  return borderCache.set.has(a + ',' + b);
}
function mem(a, b){ return (S.mem[a] && S.mem[a][b]) || 0; }
function addMem(a, b, v){ if (a < 0 || b < 0 || a === b) return; (S.mem[a] || (S.mem[a] = {}))[b] = Math.max(-100, Math.min(100, mem(a, b) + v)); }
function opinionParts(a, b){
  const parts = [];
  if (mem(a, b)) parts.push([mem(a, b) > 0 ? 'Past dealings' : 'Grievances', Math.round(mem(a, b))]);
  if (borders(a, b)) parts.push(['Shares a border', -5]);
  const r = rel(a, b).st; if (r === 'ally') parts.push(['Allies', 30]); if (r === 'nap' || r === 'pass') parts.push(['Treaty', 10]); if (r === 'war') parts.push(['At war', -30]);
  if (S.nations.some(c => c.alive && c.id !== a && c.id !== b && atWar(a, c.id) && atWar(b, c.id))) parts.push(['Common enemy', 20]);
  if (r !== 'ally' && S.blocReg && Object.values(S.blocReg).some(R => R.members && R.members.includes(a) && R.members.includes(b))) parts.push(['Same coalition', 10]);
  const N = S.nations[b]; if (N.breaker != null && S.hour - N.breaker < 50*24) parts.push(['Treaty breaker', -Math.round(25*(1 - (S.hour - N.breaker)/(50*24)))]);
  if (score(b) > 1.5*score(a) && score(b) > 40) parts.push(['Fears its power', -15]);
  return parts;
}
const opinion = (a, b) => Math.max(-100, Math.min(100, opinionParts(a, b).reduce((s0, x) => s0 + x[1], 0)));
function setRel(a, b, st, days = null){
  const prev = rel(a, b).st;
  S.rel[rkey(a, b)] = {st, since:S.hour, until:days ? S.hour + days*24 : null}; relVer++;
  for (const me of [a, b]) if (isSeat(me)){ const D = desk(me), o = me === a ? b : a; D.offers = (D.offers || []).filter(x => x.from !== o); }   // a seat's open offers from the other lapse
  if ((prev === 'war' || prev === 'pass' || prev === 'ally') && !['war', 'pass', 'ally'].includes(st)){ evict(a, b); evict(b, a); }
  visCache = null;
}
// a force left standing in land it may not be in (peace, or too small to capture) walks to its nearest own province
function sendHome(a){ const seen = new Set([a.at]), q = [a.at]; let dest = -1;
  for (let h = 0; h < q.length && dest < 0; h++) for (const v of G.P[q[h]].nbs){ if (seen.has(v)) continue; seen.add(v); if (S.owner[v] === a.owner){ dest = v; break; } q.push(v); }
  if (dest >= 0){ const pth = pathFor(a, a.at, dest); if (pth.length){ a.path = pth; if (a.dest) a.dest = null; a.forced = true; return true; } a.at = dest; a.path = []; if (a.pos) a.pos = null; if (a.dest) a.dest = null; delete a.sail; return true; } return false; }
function strandedHour(){ for (const a of S.armies){ if (a.owner < 0 || a.air || a.fly || a.to !== null || a.path.length || !count(a) || G.P[a.at].sea || shipsN(a)) continue;
    const o = S.owner[a.at]; if (o === a.owner) continue;
    const peaceful = o >= 0 && !atWar(a.owner, o) && !['pass', 'ally'].includes(rel(a.owner, o).st);
    const tooSmall = !isSeat(a.owner) && groundN(a) < CAP_MIN && !S.battles.includes(a.at) && !S.armies.some(b => b !== a && b.owner === a.owner && b.at === a.at);
    if (peaceful || tooSmall) sendHome(a); } }
function evict(n, host){
  // forces of n standing in host's land go to their nearest own province
  for (let p = 0; p < G.P.length; p++) if (S.cap[p] && S.cap[p].by === n && S.owner[p] === host) S.cap[p] = null;
  for (const a of S.armies){ if (a.owner !== n) continue;
    if (a.to !== null){ if (S.owner[a.to] === host){ a.to = null; a.t = 0; if (a.legFrom) a.legFrom = null; if (a.pos) a.pos = null; } else if (S.owner[a.at] !== host) continue; }
    if (S.owner[a.at] !== host) continue;
    const seen = new Set([a.at]), q = [a.at]; let dest = -1;
    for (let h = 0; h < q.length && dest < 0; h++) for (const v of G.P[q[h]].nbs){ if (seen.has(v)) continue; seen.add(v); if (S.owner[v] === n){ dest = v; break; } q.push(v); }
    if (dest >= 0){ a.at = dest; a.to = null; a.t = 0; a.path = []; if (a.pos) a.pos = null; if (a.legFrom) a.legFrom = null; if (a.dest) a.dest = null; delete a.sail; } else for (const t of UT) a.u[t] = 0; }
  removeEmpty();
}
// crossing a peaceful border or striking a nation you are not at war with starts the war at once
function surpriseWar(a, b){ if (a === b || atWar(a, b)) return;
  const r = rel(a, b).st; if (['nap', 'ally', 'pass', 'truce'].includes(r)) S.nations[a].breaker = S.hour;
  S.decl = S.decl.filter(d => !((d.by === a && d.to === b) || (d.by === b && d.to === a)));
  setRel(a, b, 'war'); addMem(b, a, -60);
  for (const c of S.nations) if (c.alive && c.id !== a && c.id !== b) addMem(c.id, a, opinion(c.id, b) >= 0 ? -20 : -8);
  for (const al of alliesOf(b)){ if (al === a || atWar(al, a) || ['truce', 'nap', 'pass'].includes(rel(al, a).st)) continue;
    if (isSeat(al)){ tell(al, `Your ally ${S.nations[b].name} was attacked by ${S.nations[a].name} without warning. You may join the war from Diplomacy.`, 'info', null); continue; }
    if (opinion(al, b) >= 30){ setRel(al, a, 'war'); tellAll(`${S.nations[al].name} honours its alliance and joins the war against ${S.nations[a].name}.`, me => a === me ? 'bad' : '', null); } }
  for (const me of seats()){
    if (b === me){ tell(me, `${S.nations[a].name} launched a surprise attack on you! You are at war.`, 'bad', S.nations[a].capital); alarm(me); IM.emit('war', me, a); }
    else if (a === me) tell(me, `Surprise attack: you are now at war with ${S.nations[b].name}. Other nations think less of you.`, 'bad', S.nations[b].capital);
    else if (borders(me, a) || borders(me, b)) tell(me, `${S.nations[a].name} launched a surprise attack on ${S.nations[b].name}.`, '', null); }
  relVer++; }
// a route that ignores peace borders, and the nations it would violate
function surprisePath(a, from, to){ const so = shipsOnly(a), ok = v => (G.P[v].sea || S.owner[v] !== SEA) && (!so || G.P[v].sea || (v === to && portOk(a.owner, v)));
  const pth = findPath(from, to, ok, pathMT(a), a.owner); const viol = [...new Set(pth.filter(v => !G.P[v].sea && S.owner[v] >= 0 && S.owner[v] !== a.owner && !canEnter(a.owner, v)).map(v => S.owner[v]))];
  return {pth, viol}; }
function declareWar(a, b){
  if (a === b || atWar(a, b) || S.decl.some(d => d.by === a && d.to === b)) return false;
  const r = rel(a, b);
  if (r.st === 'truce') return false;
  if (r.st === 'nap' || r.st === 'ally' || r.st === 'pass' || (r.st === 'peace' && r.afterTruce && S.hour - r.since < 20*24)) S.nations[a].breaker = S.hour;
  addMem(b, a, -50);
  for (const c of S.nations) if (c.alive && c.id !== a && c.id !== b && opinion(c.id, b) >= 25) addMem(c.id, a, -15);
  if (isSeat(b) && desk(b).chat !== undefined) say(b, a, a, 'Our patience is at an end. We are at war.');
  for (const me of seats()){
    if (b === me){ tell(me, `${S.nations[a].name} has formally declared war on you. Fighting starts now.`, 'bad', S.nations[a].capital); alarm(me); IM.emit('war', me, a); }
    else if (a === me) tell(me, `You formally declared war on ${S.nations[b].name}: you are at war now, without the surprise-attack penalty.`, 'info', S.nations[b].capital);
    else if (S.hour > 0 && (borders(me, a) || borders(me, b) || rel(me, a).st === 'ally' || rel(me, b).st === 'ally')) tell(me, `${S.nations[a].name} declared war on ${S.nations[b].name}.`, '', null); }
  startWar(a, b);   // no waiting period: a formal declaration starts the war at once (it only spares the surprise-attack penalty)
  relVer++; return true;
}
// the war itself, plus allies' calls to arms (also flushes declarations pending in saves from before the 24 h delay was removed)
function startWar(by, to){
  if (!S.nations[by].alive || !S.nations[to].alive || atWar(by, to)) return;
  setRel(by, to, 'war');
  for (const al of alliesOf(to)){ if (al === by || atWar(al, by) || ['truce', 'ally', 'nap', 'pass'].includes(rel(al, by).st)) continue;
    if (isSeat(al)){ tell(al, `Your ally ${S.nations[to].name} is under attack by ${S.nations[by].name}. You may join the war from Diplomacy.`, 'info', null); continue; }
    if (opinion(al, to) < 30) continue;
    setRel(al, by, 'war'); tellAll(`${S.nations[al].name} honours its alliance and joins the war against ${S.nations[by].name}.`, me => by === me ? 'bad' : '', null); } }
function acceptOffer(ai, from, kind){
  const op = opinion(ai, from), wars = warsOf(ai);
  if (kind === 'peace'){
    if (!atWar(ai, from)) return {ok:false, why:'not at war'};
    const age = (S.hour - rel(ai, from).since)/24, lost = G.P.filter(P => S.home[P.id] === ai && S.owner[P.id] === from).length;
    if (natPower(ai) < 0.8*natPower(from)) return {ok:true, why:'they are outmatched'};
    if (lost >= 3) return {ok:true, why:'they have lost land'};
    // against a power fighting on three fronts, one that has taken a good piece of its home land settles once the war is a week old: the peace terms make that land its own
    if (age >= 7 && warsOf(from).length >= 3 && G.P.reduce((c, P) => c + (S.home[P.id] === from && S.owner[P.id] === ai ? 1 : 0), 0) >= 5) return {ok:true, why:'they would keep the land they hold'};
    if (age > 20 && op > -40) return {ok:true, why:'they are tired of war'};
    return {ok:false, why:`they think they are winning (opinion ${Math.round(op)})`};
  }
  if (atWar(ai, from)) return {ok:false, why:'you are at war'};
  if (kind === 'nap') return op >= (wars.length ? -20 : 0) ? {ok:true, why:`opinion ${Math.round(op)}`} : {ok:false, why:`opinion ${Math.round(op)}, needs ${wars.length ? -20 : 0}`};
  if (kind === 'pass') return op >= 25 ? {ok:true, why:`opinion ${Math.round(op)}`} : {ok:false, why:`opinion ${Math.round(op)}, needs 25`};
  if (kind === 'ally'){
    if (alliesOf(ai).length >= 3 || alliesOf(from).length >= 3) return {ok:false, why:'too many allies'};
    { const Ba = blocOf(ai), Bf = blocOf(from); if (Ba !== Bf && (Ba ? Ba.members.length : 1) + (Bf ? Bf.members.length : 1) > 4) return {ok:false, why:'their coalition is full (4 members)'}; }
    const common = S.nations.some(c => c.alive && c.id !== ai && c.id !== from && atWar(ai, c.id) && atWar(from, c.id));
    if (!common) return {ok:false, why:'no common enemy'};
    if (score(from) > 2*score(ai)) return {ok:false, why:'they fear your size'};
    return op >= 35 ? {ok:true, why:`opinion ${Math.round(op)}`} : {ok:false, why:`opinion ${Math.round(op)}, needs 35`};
  }
  return {ok:false, why:''};
}
// peace for tribute: what nation m asks of nation `me`, and whether m would take it
const tribute = (me, m) => Math.round(Math.max(100, 0.15*S.nations[me].cash + 3*G.P.filter(P => S.owner[P.id] === m).length)/10)*10;
const tributeOk = (me, m) => atWar(m, me) && (S.hour - rel(m, me).since)/24 >= 2 && natPower(m) < 2.5*Math.max(1, natPower(me));
// provinces each side holds of the other's home land: these change hands for good when peace is signed
function warTerms(a, b){ const toA = [], toB = []; for (const P of G.P){ if (P.sea) continue; if (S.home[P.id] === b && S.owner[P.id] === a) toA.push(P.id); else if (S.home[P.id] === a && S.owner[P.id] === b) toB.push(P.id); } return {toA, toB}; }
function cede(list, to){ for (const p of list){ S.home[p] = to; if (S.occ) S.occ[p] = null; if (S.unrest) S.unrest[p] = Math.min(unrestOf(p), 10); } if (list.length) geoChanged(); }
// the land terms of a peace in words, as read by nation `me` ("you" where it is a party)
const termsText = (a, b, T, me) => { const nm = id => G.P[id].cityName || G.P[id].name, part = (lst, from, to) => lst.length ? `${S.nations[from].name} cedes ${lst.slice(0, 3).map(nm).join(', ')}${lst.length > 3 ? ` and ${lst.length - 3} more` : ''} to ${to === me ? 'you' : S.nations[to].name}` : '';
  return [part(T.toA, b, a), part(T.toB, a, b)].filter(Boolean).join('; ') || 'No land changes hands'; };
function applyDeal(a, b, kind){
  if (kind === 'peace'){ const T = warTerms(a, b); setRel(a, b, 'truce', 10); cede(T.toA, a); cede(T.toB, b); for (const me of [a, b]) if (isSeat(me)){ const D = desk(me); (D.tut || (D.tut = {})).survived = true; }
    if (T.toA.length + T.toB.length) for (const me of seats()) if (a === me || b === me || borders(me, a) || borders(me, b)) tell(me, `Peace conference between ${S.nations[a].name} and ${S.nations[b].name}: ${termsText(a, b, T, me)}.`, a === me || b === me ? 'good' : '', null); }
  else if (kind === 'nap') setRel(a, b, 'nap', 20);
  else if (kind === 'pass') setRel(a, b, 'pass');
  else if (kind === 'ally') setRel(a, b, 'ally');
  const word = {peace:'signed a 10-day truce', nap:'signed a non-aggression pact', pass:'agreed on right of passage', ally:'formed an alliance'}[kind];
  for (const me of seats()){
    if (a === me || b === me) tell(me, `${S.nations[a === me ? b : a].name} and you ${word}.`, 'good', null);
    else if (kind === 'ally' || ((kind === 'peace') && (borders(me, a) || borders(me, b)))) tell(me, `${S.nations[a].name} and ${S.nations[b].name} ${word}.`, '', null); }
}
function diploHour(){
  while (S.decl.length){ const d = S.decl.pop(); startWar(d.by, d.to); }   // old saves: a pending declaration starts its war now
  for (const k in S.rel){ const r = S.rel[k]; if (r.until == null || S.hour < r.until) continue;
    if (r.st === 'truce'){ r.st = 'peace'; r.until = null; r.since = S.hour; r.afterTruce = true; } else if (r.st === 'nap'){ r.st = 'peace'; r.until = null; r.since = S.hour; const [x, y] = k.split(',').map(Number); for (const me of [x, y]) if (isSeat(me)) tell(me, `Your non-aggression pact with ${S.nations[x === me ? y : x].name} has expired.`, 'info', null); } }
  for (const me of seats()){ const D = desk(me); D.offers = (D.offers || []).filter(o => o.exp > S.hour && S.nations[o.from].alive); }
}
const BLOC_NAMES = ['Northern Compact', 'Meridian Accord', 'Atlantic Concord', 'Eastern Covenant', 'Southern League', 'Pacific Charter', 'Continental Pact', 'Iron Concord'];
// coalitions: groups of 2+ powers linked by alliances, led by the strongest member, with a common enemy
function blocs(){ const seen = new Set(), out = [];
  for (const N of S.nations){ if (!N.alive || seen.has(N.id) || !alliesOf(N.id).length) continue; const comp = [N.id]; seen.add(N.id);
    for (let i = 0; i < comp.length; i++) for (const m of alliesOf(comp[i])) if (!seen.has(m)){ seen.add(m); comp.push(m); }
    if (comp.length >= 2) out.push(comp.sort((a, b) => a - b)); }
  const reg = S.blocReg || (S.blocReg = {});
  const res = out.map(m => { const leader = m.slice().sort((a, b) => score(b) - score(a))[0];
    let id = Object.keys(reg).find(k => reg[k].members.some(x => m.includes(x)) && !out.some(o => o !== m && reg[k].members.every(x => o.includes(x))));
    if (!id){ const used = new Set(Object.values(reg).map(r => r.name)); id = 'b' + (Object.keys(reg).length + 1); reg[id] = {name:BLOC_NAMES.find(nm => !used.has(nm)) || `Coalition ${Object.keys(reg).length + 1}`}; for (const me of seats()) if (m.includes(me) || S.hour > 0) tell(me, `${m.map(x => S.nations[x].name).join(', ')} form the ${reg[id].name}.`, m.includes(me) ? 'good' : 'info', null); }
    reg[id].members = m; reg[id].leader = leader; return {id, name:reg[id].name, members:m, leader, focus:reg[id].focus ?? null}; });
  for (const k in reg) if (!res.some(B => B.id === k)) reg[k].members = [];   // dissolved coalitions: nobody is a member any more
  return res; }
const blocOf = n => blocs().find(b => b.members.includes(n)) || null;
function blocDay(){ const reg = S.blocReg || (S.blocReg = {}), day = Math.floor(S.hour/24);
  for (const B of blocs()){ const R = reg[B.id];
    // the leader names a common enemy: the power at war with most members, else the weakest bordering rival
    const cnt = new Map(); for (const m of B.members) for (const e of warsOf(m)) if (!B.members.includes(e)) cnt.set(e, (cnt.get(e) || 0) + 1);
    let focus = [...cnt.entries()].sort((x, y) => y[1] - x[1] || natPower(x[0]) - natPower(y[0]))[0]?.[0] ?? null;
    if (focus !== R.focus){ R.focus = focus; if (focus != null) for (const me of B.members) if (isSeat(me)) tell(me, `The ${B.name} names ${S.nations[focus].name} as its common enemy.`, 'info', S.nations[focus].capital); }
    if (focus == null) continue;
    for (const m of B.members){ if (isSeat(m) || atWar(m, focus) || S.decl.some(d => d.by === m && d.to === focus) || ['truce', 'nap', 'ally'].includes(rel(m, focus).st) || rng() > 0.25) continue; declareWar(m, focus); }
    // the AI leader asks a member seat for a coordinated offensive
    for (const me of B.members){ const D = isSeat(me) ? desk(me) : null; if (!D || B.leader === me || isSeat(B.leader) || !(!D.req || D.req.until < S.hour) || !(!R.lastReq || day - R.lastReq >= 4) || !atWar(me, focus)) continue;
      const near = G.P.filter(P => !P.sea && S.owner[P.id] === focus && P.nbs.some(v => S.owner[v] === me)).sort((x, y) => (y.city ? 1 : 0) - (x.city ? 1 : 0));
      if (near.length){ const tP = near[0]; R.lastReq = day; D.req = {from:B.leader, p:tP.id, until:S.hour + 48, bloc:B.id};
        tell(me, `${S.nations[B.leader].name} asks you to attack ${tP.cityName || tP.name} within 48 h as part of ${artA(B.name)} offensive. Reward: $150M and goodwill.`, 'info', tP.id); } } }
  for (const me of seats()){ const D = desk(me); if (!(D.req && S.hour >= D.req.until)) continue; const q = D.req; D.req = null; if (S.nations[q.from].alive){ addMem(q.from, me, -10); tell(me, `You did not join the offensive on ${G.P[q.p].cityName || G.P[q.p].name}: ${S.nations[q.from].name} is disappointed.`, 'bad', null); } }
}
// a seat that takes (or fights in) the province its coalition leader asked for is paid and trusted more
function reqHour(){ for (const me of seats()){ const D = desk(me), q = D.req; if (!q) continue;
  const fought = S.battles.includes(q.p) && S.armies.some(a => a.owner === me && a.at === q.p);
  if (S.owner[q.p] === me || fought){ D.req = null; S.nations[me].cash += 150; const B = blocOf(me); for (const m of (B ? B.members : [q.from])) if (m !== me) addMem(m, me, 10);
    tell(me, `Offensive on ${G.P[q.p].cityName || G.P[q.p].name} joined: $150M from ${S.nations[q.from].name}, and your coalition partners trust you more.`, 'good', q.p); } } }
function diploDay(){
  for (const a in S.mem) for (const b in S.mem[a]){ const v = S.mem[a][b]; S.mem[a][b] = v > 0 ? Math.max(0, v - 1) : Math.min(0, v + 1); }
  // treaties and shared wars build trust between AIs over time
  for (const A of S.nations){ if (!A.ai || !A.alive) continue; for (const B of S.nations){ if (B.id === A.id || !B.alive) continue;
    const r = rel(A.id, B.id).st; let d = 0; if (r === 'nap' || r === 'pass') d += 2; if (r === 'ally') d += 2;
    if (S.nations.some(c => c.alive && c.id !== A.id && c.id !== B.id && atWar(A.id, c.id) && atWar(B.id, c.id))) d += 3;
    if (d) addMem(A.id, B.id, Math.min(d, 60 - mem(A.id, B.id) > 0 ? d : 0)); } }
  blocDay();
  const day = S.hour/24;
  for (const N of S.nations){ if (!N.ai || !N.alive) continue; const n = N.id, wars = warsOf(n);
    // peace with the weakest enemy when stretched, or after a long war
    for (const m of wars){ const age = (S.hour - rel(n, m).since)/24;
      const lostTo = wars.length >= 3 ? G.P.reduce((c, P) => c + (S.home[P.id] === n && S.owner[P.id] === m ? 1 : 0), 0) : 0;   // fighting on three fronts: cede what one attacker holds to end that war
      if (age < 5 || !((wars.length >= 2 && natPower(m) === Math.min(...wars.map(natPower))) || age > 20 || natPower(n) < 0.7*natPower(m) || lostTo >= 5)) continue;
      if (!acceptOffer(n, m, 'peace').ok) continue;
      if (isSeat(m)) offerSeat(m, n, 'peace');
      else if (acceptOffer(m, n, 'peace').ok){ applyDeal(n, m, 'peace'); break; } }
    // declare war
    const pending = S.decl.some(d => d.by === n);
    if (day >= 8 && warsOf(n).length <= 1 && !pending && rng() < 0.22*diffOf().war){
      let best = -1, bs = 0; const myP = natPower(n);
      for (const M of S.nations){ const m = M.id; if (m === n || !M.alive || !borders(n, m) || rel(n, m).st !== 'peace' || inGrace(m)) continue;
        if (opinion(n, m) >= 0 || myP < 1.1*natPower(m)) continue;
        const cnt = G.P.filter(P => S.owner[P.id] === m).length, sc = (cnt + 5)/(natPower(m) + 10)*(isSeat(m) ? ({recruit:0.55, regular:0.8, veteran:1.05, elite:1.3}[diffOf().k] || 0.8) : 1);
        if (sc > bs){ bs = sc; best = m; } }
      if (best >= 0){ if (natPower(n) > 1.6*natPower(best) && opinion(n, best) < -25 && rng() < 0.35) surpriseWar(n, best); else declareWar(n, best); }
    }
    // treaties
    if (rng() < 0.12){ const nbs = S.nations.filter(M => M.alive && M.id !== n && borders(n, M.id) && rel(n, M.id).st === 'peace' && opinion(n, M.id) >= 0);
      const M = nbs[Math.floor(rng()*nbs.length)]; if (M){ if (isSeat(M.id)) offerSeat(M.id, n, 'nap'); else if (acceptOffer(M.id, n, 'nap').ok) applyDeal(n, M.id, 'nap'); } }
    if (rng() < 0.07 && alliesOf(n).length < 3){ const c = S.nations.filter(M => M.alive && M.id !== n && rel(n, M.id).st !== 'ally' && !atWar(n, M.id) && opinion(n, M.id) >= 35 && acceptOffer(n, M.id, 'ally').ok);
      const M = c[0]; if (M){ if (isSeat(M.id)) offerSeat(M.id, n, 'ally'); else if (acceptOffer(M.id, n, 'ally').ok) applyDeal(n, M.id, 'ally'); } }
  }
}
/* ---------------- Direct messages and trade deals ---------------- */
// the messages between seat `me` and nation n; say adds one (from: who wrote it) and counts it unread when the other side wrote
function chatLog(me, n){ const D = desk(me), C = D.chat || (D.chat = {}); return C[n] || (C[n] = []); }
function say(me, n, from, text){ const L = chatLog(me, n); L.push({from, text, h:S.hour}); if (L.length > 60) L.shift(); if (from !== me){ const D = desk(me); (D.unread || (D.unread = {}))[n] = ((D.unread || {})[n] || 0) + 1; IM.emit('chat', me, n, from, text); } }
// how nation n feels about nation `me`, and its answer to a message from `me`
const mood = (me, n) => { const op = opinion(n, me); return op >= 40 ? 'warm' : op >= 10 ? 'friendly' : op > -20 ? 'neutral' : op > -50 ? 'cold' : 'hostile'; };
function aiReply(me, n, text){ const t = text.toLowerCase(), op = opinion(n, me), m = mood(me, n), war = atWar(n, me);
  const pick = arr => arr[Math.floor(rng()*arr.length)];
  if (/\b(peace|ceasefire|truce|stop)\b/.test(t)){ if (!war) return 'We are not at war with you.'; const a = acceptOffer(n, me, 'peace'); if (a.ok){ applyDeal(n, me, 'peace'); return `Agreed: ${a.why}. Our guns fall silent. ${termsText(me, n, {toA:[], toB:[]}, me) ? '' : ''}`; } return `No peace yet: ${a.why}. Make it worth our while in a trade.`; }
  if (/right of way|passage|cross|transit/.test(t)){ const a = acceptOffer(n, me, 'pass'); if (a.ok){ applyDeal(n, me, 'pass'); return 'You may cross our land and use our airfields.'; } return `Not now (${a.why}).`; }
  if (/\b(ally|alliance|coalition|join)\b/.test(t)){ const a = acceptOffer(n, me, 'ally'); if (a.ok){ applyDeal(n, me, 'ally'); return 'We stand with you. Together we are stronger.'; } return `An alliance is not possible: ${a.why}.`; }
  if (/\b(help|support|attack|strike)\b/.test(t) && /\b(them|enemy|against|help|support)\b/.test(t)){ const common = warsOf(me).filter(e => !atWar(n, e) && e !== n); if (common.length && op >= 30 && rng() < 0.5){ const e = common[0]; declareWar(n, e); return `Very well. We declare war on ${S.nations[e].name}.`; } return op >= 10 ? 'We sympathise, but we will not risk our people for you.' : 'Fight your own wars.'; }
  if (/\b(threat|destroy|crush|surrender|or else|warn)\b/.test(t)){ addMem(n, me, -8); return natPower(n) < natPower(me)*0.6 ? 'We hear you. We have no wish for conflict.' : pick(['Empty words. Come and try.', 'Threats only harden our resolve.', 'We will remember this.']); }
  if (/\b(trade|deal|buy|sell|offer)\b/.test(t)) return 'Send us a proposal in the Trade tab and we will consider it.';
  if (/\b(hello|hi|greetings|hey)\b/.test(t)) return {warm:'Greetings, friend!', friendly:'Hello. Good to hear from you.', neutral:'Greetings.', cold:'What do you want?', hostile:'Speak quickly.'}[m];
  if (/\b(thanks|thank you)\b/.test(t)){ addMem(n, me, 1); return 'You are welcome.'; }
  return {warm:'We value our friendship. What do you propose?', friendly:'Interesting. Tell us more, or send a proposal.', neutral:'We have noted your message.', cold:'We do not trust you.', hostile:'We have nothing to discuss.'}[m]; }
// now and then an AI nation writes to a seat
function chatDay(){ for (const me of seats()) for (const N of S.nations){ if (!N.alive || isSeat(N.id) || rng() > 0.04) continue; const n = N.id, op = opinion(n, me), war = atWar(n, me);
    if (war && acceptOffer(n, me, 'peace').ok) say(me, n, n, 'This war bleeds us both. Shall we talk peace?');
    else if (!war && op < -45 && borders(n, me)) say(me, n, n, 'Your troops near our border are noted. Do not test us.');
    else if (op >= 35 && rel(n, me).st !== 'ally' && alliesOf(n).length < 3) say(me, n, n, 'We would welcome closer ties. An alliance, perhaps?');
    else if (op >= 10 && rng() < 0.5) aiProposeTrade(n, me); } }
// a deal between seat `me` and AI nation ai: {give:{cash,oil,metal,iron,elec,rare,provs:[],treaty:[]}, get:{...}} from the seat's point of view
const emptySide = () => ({cash:0, oil:0, metal:0, iron:0, elec:0, rare:0, provs:[], treaty:[]});
// an old save's deal side: food dropped, the new goods filled in
function sideFix(sd){ if (!sd) return emptySide(); delete sd.food; for (const k of DEAL_K) if (!(sd[k] >= 0)) sd[k] = 0; sd.provs = sd.provs || []; sd.treaty = sd.treaty || []; return sd; }
function dealValueFor(me, ai, D){ // value of the deal to the AI: what it receives minus what it gives
  const M = mkt(), res = side => DEAL_K.reduce((s0, k) => s0 + (side[k] || 0)*(k === 'cash' ? 1 : M.p[k]), 0);
  let v = res(D.give) - res(D.get)*1.05;
  for (const p of D.give.provs) v += (isCapital(p) ? 1e6 : provValue(p))*(G.P[p].nbs.some(q => S.owner[q] === ai) ? 1 : 0.55);
  for (const p of D.get.provs){ v -= (isCapital(p) ? 1e6 : provValue(p))*1.6; if (S.owner.filter(o => o === ai).length - D.get.provs.length < 2) v -= 1e6; }
  const tv = (k, aiGives) => { const a = acceptOffer(ai, me, k); if (k === 'peace') return a.ok ? 60 : -(140 + natPower(ai)*0.4);
    if (k === 'pass') return aiGives ? (a.ok ? -10 : opinion(ai, me) >= 0 ? -90 : -300) : 30; if (k === 'nap') return a.ok ? 20 : -110; if (k === 'ally') return a.ok ? 40 : -1e6; return 0; };
  for (const k of new Set([...D.give.treaty, ...D.get.treaty])) v += k === 'pass' ? (D.get.treaty.includes(k) ? tv(k, true) : 0) + (D.give.treaty.includes(k) ? tv(k, false) : 0) : tv(k, true);
  return v + opinion(ai, me)*1.2; }
function dealOK(me, ai, D){ const N = S.nations[me], A = S.nations[ai];
  for (const k of DEAL_K){ if ((D.give[k] || 0) > N[k] + 0.01) return `you do not have ${D.give[k]} ${rlbl(k)}`; if ((D.get[k] || 0) > A[k] + 0.01) return `they do not have ${D.get[k]} ${rlbl(k)}`; }
  if (D.give.provs.some(p => S.owner[p] !== me) || D.get.provs.some(p => S.owner[p] !== ai)) return 'a province changed hands';
  if (D.give.provs.some(p => isCapital(p)) ) return 'you cannot hand over your capital';
  if (D.get.provs.length) return `${A.name} never sells territory`;   // land is sold in the Territory tab (rules/territory.js), never by a computer-run nation
  if (D.give.provs.length) return 'land is sold in the Territory tab, for money';
  if (D.give.treaty.includes('peace') && !atWar(ai, me)) return 'you are not at war';
  return null; }
function applyTrade(me, ai, D){ const N = S.nations[me], A = S.nations[ai];
  for (const k of DEAL_K){ const d = (D.get[k] || 0) - (D.give[k] || 0); N[k] += d; A[k] -= d; }
  const cedeTo = (p, to) => { const prev = S.owner[p]; S.owner[p] = to; S.home[p] = to; S.cap[p] = null; S.queue[p] = []; S.cons[p] = null; if (S.occ) S.occ[p] = null; if (S.unrest) S.unrest[p] = 0; evict(prev, to); geoChanged(); if (prev >= 0) checkNation(prev, to); };
  if (D.give.treaty.includes('peace') || D.get.treaty.includes('peace')) if (atWar(ai, me)) setRel(ai, me, 'truce', 10);
  for (const p of D.give.provs) cedeTo(p, ai); for (const p of D.get.provs) cedeTo(p, me);
  for (const k of new Set([...D.give.treaty, ...D.get.treaty])) if (k !== 'peace') applyDeal(ai, me, k);
  addMem(ai, me, 4); checkEnd(); }
function dealText(D, who){ const part = (side, ownerName) => [...DEAL_K.map(k => !side[k] ? '' : k === 'cash' ? `$${fmt(side.cash)}M` : `${side[k]} ${yword(k, side[k])}`), ...side.provs.map(p => G.P[p].cityName || G.P[p].name), ...side.treaty.map(k => ({peace:'peace', pass:'Right of Way', nap:'non-aggression', ally:'alliance'})[k])].filter(Boolean).join(', ') || 'nothing';
  return `you give ${part(D.give)}; ${who} ${who === "they" || who === "you" ? "give" : "gives"} ${part(D.get)}`; }
// AI nation n proposes a trade to seat `me`
function aiProposeTrade(n, me){ const DK = desk(me); if ((DK.offers || (DK.offers = [])).some(o => o.from === n)) return; const N = S.nations[n], M = mkt(), D = {give:emptySide(), get:emptySide()};
  // (computer-run nations never sell land: they only buy it, rules/territory.js terrDay)
  { const k = MKT_K[Math.floor(rng()*MKT_K.length)], q = M.p[k] > 4 ? 20 : 40; if (N[k] < q*2) return; D.get[k] = q; D.give.cash = Math.round(q*M.p[k]*0.95); }
  if (dealOK(me, n, D)) return; DK.offers.push({id:S.nid++, from:n, kind:'trade', deal:D, exp:S.hour + 48}); say(me, n, n, `Proposal: ${dealText(D, 'we').replace('you give', 'you give us')}.`); }
const sameBloc = (me, n) => { blocs(); const a = blocIdOf(me); return !!a && n !== me && a === blocIdOf(n); };   // fresh: alliances can break mid-day
const GIFT_K = ['cash', 'oil', 'metal', 'iron', 'elec', 'rare', 'mp'];
const giftRoom = (n, k) => k === 'cash' ? 1e9 : Math.max(0, Math.floor(stockCap(n) - S.nations[n][k]));   // what the recipient can store
// nation `me` gives stocks and provinces (g) to its coalition partner n
function sendGift(me, n, g){ const M0 = S.nations[me], N = S.nations[n]; if (!g || !sameBloc(me, n)) return false; const parts = [];
  for (const k of GIFT_K){ const q = Math.max(0, Math.min(g[k] || 0, Math.floor(M0[k]), giftRoom(n, k))); if (!q) continue; M0[k] -= q; N[k] += q; parts.push(k === 'cash' ? `$${fmt(q)}M` : k === 'mp' ? `${q}k manpower` : `${q} ${rlbl(k)}`); }
  for (const p of g.provs){ if (S.owner[p] !== me || isCapital(p)) continue; S.owner[p] = n; S.home[p] = n; S.cap[p] = null; S.queue[p] = []; S.cons[p] = null; if (S.occ) S.occ[p] = null; evict(me, n); geoChanged(); parts.push(G.P[p].cityName || G.P[p].name); }
  if (!parts.length) return false; addMem(n, me, Math.min(15, 2 + parts.length*2));
  if (isSeat(me)){ say(me, n, me, `Sending you ${parts.join(', ')}.`); say(me, n, n, 'Received with thanks. The coalition stands together.'); const D = desk(me); if (D.unread) D.unread[n] = 0; }
  tell(me, `You sent ${parts.join(', ')} to your coalition partner ${N.name}.`, 'good', null); checkEnd(); return true; }
// AI partners offer supplies when you run short, and send them if you say yes
// AI partners send supplies straight to coalition members who run short (the player included); nothing goes through the market
const AID = {cash:{low:40, rich:700, keep:450, max:150}, oil:{low:25, rich:150, keep:100, max:60}, metal:{low:25, rich:150, keep:100, max:60}, iron:{low:20, rich:150, keep:100, max:50}, elec:{low:15, rich:120, keep:80, max:40}, rare:{low:15, rich:120, keep:80, max:30}, mp:{low:15, rich:140, keep:90, max:40}};
function coalitionAid(){ const BL = blocs(), ask = S.aidAsk || (S.aidAsk = {});
  for (const B of BL) for (const m of B.members){ const R = S.nations[m]; if (!R.alive) continue;
    for (const k of GIFT_K){ const A = AID[k]; if (R[k] > A.low && !(R.short && R.short[k])) continue;
      const donor = B.members.map(x => S.nations[x]).find(N => N.alive && N.id !== m && !isSeat(N.id) && N[k] > A.rich && !(ask[N.id] > S.hour)); if (!donor || rng() >= 0.5) continue;
      const q = Math.min(A.max, Math.floor(donor[k] - A.keep), giftRoom(m, k)); if (q < 1) continue; donor[k] -= q; R[k] += q; ask[donor.id] = S.hour + 72; addMem(m, donor.id, 3);
      const what = k === 'cash' ? `$${q}M` : k === 'mp' ? `${q}k manpower` : `${q} ${rlbl(k)}`;
      if (isSeat(m)){ say(m, donor.id, donor.id, `We saw you were short of ${rlbl(k)}, so we sent you ${what}. That is what partners are for.`); tell(m, `${donor.name} sent you ${what} as coalition aid.`, 'good', null); }
      for (const me of B.members) if (me !== m && isSeat(me)) tell(me, `${donor.name} sent ${what} to your coalition partner ${R.name}.`, '', null); } } }
// AI nation `from` puts a treaty offer on the desk of seat `me` (one open offer per nation, at most one every five days)
function offerSeat(me, from, kind){ const D = desk(me), L = D.offers || (D.offers = []);
  if (L.some(o => o.from === from) || (D.lastOffer && D.lastOffer[from] && S.hour - D.lastOffer[from] < 5*24)) return;
  if (kind !== 'peace' && rel(from, me).st === kind) return;
  L.push({id:S.nid++, from, kind, exp:S.hour + 48}); (D.lastOffer || (D.lastOffer = {}))[from] = S.hour;
  tell(me, `${S.nations[from].name} proposes ${{peace:'peace', nap:'a non-aggression pact', pass:'right of passage', ally:'an alliance'}[kind]}. Open Diplomacy (D) to answer.`, 'info', null);
}
/* ---------------- Espionage ---------------- */
const SPY_OPS = {
  recon:   {name:'Reconnaissance', cost:20,  base:0.85, desc:'Reveals the province and its neighbours for 3 days.'},
  sabotage:{name:'Sabotage',       cost:40,  base:0.55, desc:'Destroys one building level (or halts construction).'},
  incite:  {name:'Incite unrest',  cost:35,  base:0.65, desc:'+35 unrest in occupied land; may spark a revolt.'},
  steal:   {name:'Steal technology', cost:60, base:0.35, desc:'Takes one technology the owner has and you lack.'},
};
const agentsOf = n => (S.spies || []).filter(a => a.owner === n);
const idleAgents = n => agentsOf(n).filter(a => !a.op);
function trainAgent(n){ const N = S.nations[n]; if (N.cash < 60 || agentsOf(n).length >= 5) return false; N.cash -= 60; (S.spies || (S.spies = [])).push({id:S.nid++, owner:n, op:null}); return true; }
function spyChance(n, p, op){ const o = S.owner[p]; const counter = o >= 0 ? idleAgents(o).length*0.08 : 0; return Math.max(0.1, SPY_OPS[op].base - counter); }
function spyCheck(n, p, op){
  const O = SPY_OPS[op], o = S.owner[p], N = S.nations[n];
  if (!idleAgents(n).length) return {ok:false, why:'No idle agents. Train one in your capital (Intel).'};
  if (o === n) return {ok:false, why:'That is your own province.'};
  if (G.P[p].sea) return {ok:false, why:'Agents work on land.'};
  if (N.cash < O.cost) return {ok:false, why:`Needs $${O.cost}M.`};
  if (op === 'incite' && (o < 0 || S.home[p] === o)) return {ok:false, why:'Only occupied land can be incited.'};
  if (op === 'steal' && (o < 0 || !rStealable(n, o).length)) return {ok:false, why:'They have no technology you lack.'};
  if (op === 'sabotage' && !BK.some(k => S.bld[p][k]) && !S.cons[p]) return {ok:false, why:'Nothing to sabotage there.'};
  return {ok:true, chance:spyChance(n, p, op)};
}
function startSpy(n, p, op){ const c = spyCheck(n, p, op); if (!c.ok){ refuse(n, c.why); return false; }
  const ag = idleAgents(n)[0]; S.nations[n].cash -= SPY_OPS[op].cost; ag.op = {k:op, p, h:24};
  if (isSeat(n)) tell(n, `Agent dispatched to ${G.P[p].cityName || G.P[p].name}: ${SPY_OPS[op].name} (${Math.round(c.chance*100)}% chance, 24 h).`, 'info', p); return true; }
function spyHour(){
  for (const ag of (S.spies || [])){ if (!ag.op || --ag.op.h > 0) continue;
    const {k, p} = ag.op, n = ag.owner, o = S.owner[p], where = G.P[p].cityName || G.P[p].name; ag.op = null;
    if (!S.nations[n].alive){ continue; }
    if (rng() > spyChance(n, p, k)){ S.spies = S.spies.filter(x => x !== ag); if (o >= 0) addMem(o, n, -20);
      if (isSeat(n)) tell(n, `Your agent was caught in ${where}${o >= 0 ? ` by ${S.nations[o].name} (relations −20)` : ''}.`, 'bad', p);
      if (o !== n && isSeat(o)) tell(o, `Counter-intelligence caught ${artA(S.nations[n].name)} agent in ${where}.`, 'good', p); continue; }
    let res = '';
    if (k === 'recon'){ S.reveal = S.reveal || {}; for (const v of [p, ...G.P[p].nbs]) S.reveal[v] = S.hour + 72; visCache = null; res = 'the area is revealed for 3 days'; }
    else if (k === 'sabotage'){ if (S.cons[p]){ S.cons[p] = null; res = 'construction destroyed'; } else { const ks = BK.filter(b => S.bld[p][b]); const b = ks[Math.floor(rng()*ks.length)]; if (b){ S.bld[p][b]--; res = `${BUILD[b].name} damaged`; } } }
    else if (k === 'incite'){ S.unrest = S.unrest || G.P.map(() => 0); S.unrest[p] = Math.min(100, unrestOf(p) + 35); res = `unrest now ${Math.round(S.unrest[p])}%`; }
    else if (k === 'steal' && o >= 0){ const ts = rStealable(n, o).filter(t => rReqsOk(n, RN[t], rLevel(n, t) + 1)); const t = ts[Math.floor(rng()*ts.length)]; if (t){ const lv = rLevel(n, t) + 1; rGrant(S.nations[n], t, lv); res = `${rName(RN[t], lv)} acquired`; } else res = 'nothing usable found'; }
    if (isSeat(n)) tell(n, `${SPY_OPS[k].name} in ${where} succeeded: ${res}.`, 'good', p);
    if (o !== n && isSeat(o) && k !== 'recon') tell(o, `Enemy agents struck ${where}: ${res}.`, 'bad', p);
  }
}
