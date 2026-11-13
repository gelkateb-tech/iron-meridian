// Iron Meridian rules: movement. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
const seaSpeed = a => ground(a) ? SEA_SPEED*rMoveF(a.owner)*(shipsN(a) ? 1.15 : 1)*stackSpd(a) : landSpeed(a);   // open water, no lane
const legSpeed = (a, from, to) => (G.P[from].sea || G.P[to].sea) ? seaSpeed(a)*(isLane(from, to) ? LANE_F : 1) : landSpeed(a);
// one unit type's base speeds in km/day: [land or null, water] (land: plains, no road; water: open sea, no lane; ships on land only enter ports)
function unitKmd(o, t){ const U = UNITS[t], v = st(o, t, 'spd')*rMoveF(o); if (U.cls === 'air') return [null, null];
  return U.cls === 'naval' ? [null, Math.round(v*KM_HEX/10)*10] : [Math.round(v*KM_HEX/10)*10, Math.round(SEA_SPEED*rMoveF(o)*KM_HEX/10)*10]; }
const kmd = v => `${fmtK(v)} km/day`;
const fmtK = v => v >= 1000 ? v.toLocaleString('en-US') : String(v);
const MOVE_T = {inf:'foot', at:'foot', spec:'foot', para:'foot', art:'track', tank:'track', ifv:'wheel', sam:'wheel', mlrs:'wheel'};
const ROAD_F = {wheel:1.6, track:1.25, foot:1.15};
// movement-type factors on top of TERRAIN.spd: wheels bog down off-road, tracks less so, infantry climbs and wades
const TERR_F = {wheel:{forest:0.85, mountain:0.7, desert:1.1, tundra:0.85, hills:0.85, marsh:0.7, snow:0.7}, track:{forest:0.95, mountain:0.85, desert:1.1, tundra:0.95, hills:0.95, marsh:0.75, snow:0.8}, foot:{forest:1.1, mountain:1.3, urban:1.05, hills:1.15, marsh:0.95, snow:0.9}};
function moveType(a){ let slow = null, sv = 1e9; for (const t of UT){ if (!a.u[t] || !MOVE_T[t]) continue; const v = st(a.owner, t, 'spd'); if (v < sv){ sv = v; slow = t; } } return slow ? MOVE_T[slow] : 'foot'; }
// terrain and season part of a ground leg (the road or rail bonus is applied in legHours)
function moveF(a, from, to){ const mt = moveType(a), P = G.P[to]; let f = (TERR_F[mt] && TERR_F[mt][P.terrain]) || 1; const sz = season(to); if (sz === 'mud' && mt === 'wheel') f *= 0.8; if (sz === 'snow' && mt === 'wheel') f *= 0.9; if (a.u.spec === count(a)) f = Math.max(f, 1);
  { const b = terr(to).spd*f; if (b < 1 && rDrilled(a, P.terrain)) f *= (1 + b)/2/b; }   // trained for rough ground: half the terrain's speed penalty
  return f; }
/* ---------------- Roads and railways ----------------
   Each linked pair of neighbouring land provinces has a road level (0 none, 1 track, 2 road, 3 highway) and a rail level (0 none, 1 railway, 2 high-speed).
   Static levels come from lines.js; S.links stores only the differences ("a,b" -> {road, rail, dmg, bld}), so saves stay small.
   Ground forces: road bonus by class (×1.12 / ×1.35 / ×1.7 on the base, scaled by movement type as wheels gain most), rail ×2.6 / ×3.4 for every
   ground unit, ignoring terrain and rivers, only while the line is intact and both provinces are yours or an ally's. Strikes damage a province's links:
   rail out and road one class down until repaired. */
const LINK_NAME = ['No road', 'Track', 'Road', 'Highway'], RAIL_NAME = ['No railway', 'Railway', 'High-speed rail'];
const LINK_SPD = [1, 1.12, 1.35, 1.7], RAIL_SPD = [1, 2.6, 3.4];
const LINK_MT = {wheel:(ROAD_F.wheel - 1)/0.35, track:(ROAD_F.track - 1)/0.35, foot:(ROAD_F.foot - 1)/0.35};   // share of the road bonus: a road gives wheels ×1.6, tracks ×1.25, foot ×1.15
const roadMul = (mt, lv) => 1 + (LINK_SPD[lv] - 1)*(LINK_MT[mt] ?? 1);
const LINK_DMG = {strike:36, cm:48, bm:72};            // hours a strike puts a province's links out
const LINK_COST = {road:[null, {cash:10, metal:2, iron:1, d:1}, {cash:34, metal:5, iron:4, d:2}, {cash:85, metal:12, iron:10, d:4}], rail:[null, {cash:100, metal:10, iron:12, d:5}, {cash:220, metal:20, iron:25, elec:10, d:8}]};
const LINK_ROUGH = {mountain:1.6, hills:1.25, marsh:1.35, snow:1.3, forest:1.12, tundra:1.15, urban:1.1};
const SUP_LINK = [1, 0.92, 0.8, 0.68], SUP_RAIL = 0.45, SUP_DMG = 1.35;   // supply step cost multipliers along links
let LINKV = 1, LINKD = 1;                               // LINKV: link speeds changed (paths, supply); LINKD: the drawn network changed (map layer)
let LLOG = [];                                          // links whose speeds changed, in order (LLOG[i] is change LINKV - LLOG.length + i + 1)
// the links changed since version v, or null when the consumer must rebuild everything (log trimmed, too many, or a resync)
function linkChangesSince(v){ const n = LINKV - v; if (n <= 0) return []; if (n > LLOG.length || n > 400) return null; return LLOG.slice(LLOG.length - n); }
function linkTouched(r){ LINKV++; LLOG.push(r); if (LLOG.length > 1200) LLOG = LLOG.slice(-600); }
const linkOf = (a, b) => G.P[a].lk.get(b) || null;
function linkMake(a, b){ let r = G.P[a].lk.get(b); if (r) return r; const lo = Math.min(a, b), hi = Math.max(a, b); r = {a:lo, b:hi, k:lo + ',' + hi, r0:0, q0:0, road:0, rail:0, dmg:0, bld:null, gap:false}; G.LK.set(r.k, r); G.P[a].lk.set(b, r); G.P[b].lk.set(a, r); return r; }
const roadLv = r => r ? (r.dmg > 0 ? Math.max(0, r.road - 1) : r.road) : 0;
const railLv = r => r && !(r.dmg > 0) ? r.rail : 0;
const allyOf = (a, b) => { const r0 = S.rel[rkey(a, b)]; return !!r0 && r0.st === 'ally'; };   // read-only (rel() would create missing entries)
const railFriend = (n, p) => { const o = S.owner[p]; return o === n || (o >= 0 && n >= 0 && allyOf(n, o)); };
const railOk = (n, from, to) => { const r = linkOf(from, to); return railLv(r) > 0 && railFriend(n, from) && railFriend(n, to); };
// rebuild live link state from the static data plus the save's differences (new game, load)
function linksSync(){ if (!G.LK) return; for (const r of G.LK.values()){ r.road = r.r0; r.rail = r.q0; r.dmg = 0; r.bld = null; }
  if (!S.links || typeof S.links !== 'object' || Array.isArray(S.links)) S.links = {};
  for (const k of Object.keys(S.links)){ const d = S.links[k], [a, b] = k.split(',').map(Number);
    if (!d || !G.P[a] || !G.P[b] || !G.P[a].nb.has(b) || G.P[a].sea || G.P[b].sea){ delete S.links[k]; continue; } const r = linkMake(a, b);
    if (d.road != null) r.road = Math.max(0, Math.min(3, d.road | 0)); if (d.rail != null) r.rail = Math.max(0, Math.min(2, d.rail | 0)); r.dmg = Math.max(0, d.dmg || 0); r.bld = d.bld && d.bld.k ? d.bld : null; if (r.bld) S.links[k].bld = r.bld; }
  LINKV += 1000; LLOG = []; LINKD++; }   // full rebuild for every consumer
// write one link's difference from the static data into the save; speed = its speeds changed
function linkSave(r, speed = true){ const d = {}; if (r.road !== r.r0) d.road = r.road; if (r.rail !== r.q0) d.rail = r.rail; if (r.dmg > 0) d.dmg = r.dmg; if (r.bld) d.bld = r.bld;
  if (Object.keys(d).length) S.links[r.k] = d; else delete S.links[r.k]; if (speed) linkTouched(r); }
// strikes knock out every link of a province: rail closed, road one class down, for h hours (repairs run on their own)
function damageLinks(p, h){ if (!G.P[p] || G.P[p].sea) return 0; let n = 0;
  for (const r of G.P[p].lk.values()){ if (!r.road && !r.rail) continue; const was = r.dmg > 0; r.dmg = Math.max(r.dmg, h); if (!was) n++; linkSave(r, !was); }
  return n; }
function linkCost(n, a, b, k, lv){ const C = LINK_COST[k][lv], w = Math.max(0.6, Math.min(2.2, G.P[a].nb.get(b) || 1)), rough = Math.max(LINK_ROUGH[G.P[a].terrain] || 1, LINK_ROUGH[G.P[b].terrain] || 1), eng = rRoadF(n);
  return {cash:Math.round(C.cash*w*rough*eng), metal:Math.round(C.metal*w*rough*eng), iron:Math.round((C.iron || 0)*w*rough*eng), elec:Math.round((C.elec || 0)*w*rough*eng), h:Math.max(12, Math.round(C.d*24*Math.sqrt(w)*Math.sqrt(rough)*eng))}; }
const linkProjects = n => { let c = 0; for (const k in S.links){ const d = S.links[k]; if (d.bld && d.bld.n === n) c++; } return c; };
const linkMaxProj = n => { const M = linkMaxProj.m || (linkMaxProj.m = {}), f = () => Math.min(6, 2 + Math.floor(ownedBy(n).length/40)); if (M.h !== S.hour || M.S !== S){ if (!keep()) return f(); M.h = S.hour; M.S = S; M.v = {}; }
  return M.v[n] ?? (keep() ? (M.v[n] = f()) : f()); };
function linkCheck(n, a, b, k){ const P = G.P;
  if (!P[a] || !P[b] || !P[a].nb.has(b) || P[a].sea || P[b].sea) return {ok:false, why:'No land link there.'};
  const r = linkOf(a, b), cur = r ? (k === 'rail' ? r.rail : r.road) : 0, max = k === 'rail' ? 2 : 3;
  if (cur >= max) return {ok:false, max:true, why:`Already ${k === 'rail' ? RAIL_NAME[cur] : LINK_NAME[cur]}.`};
  const lv = cur + 1, c = linkCost(n, a, b, k, lv), N = S.nations[n];
  const fail = why => ({ok:false, why, c, lv});
  if (S.owner[a] !== n || S.owner[b] !== n) return fail('Both provinces must be yours.');
  if (r && r.bld) return fail('Construction already under way on this link.');
  if (r && r.dmg > 0) return fail(`Damaged: repairs finish in ${r.dmg} h.`);
  if (k === 'rail' && lv === 2 && !has(n, 'log1')) return fail('High-speed rail needs Motorized Supply research.');
  if (k === 'rail' && lv === 1 && (r ? r.road : 0) < 1) return fail('Lay at least a track first.');
  if (linkProjects(n) >= linkMaxProj(n)) return fail(`At most ${linkMaxProj(n)} link projects at once.`);
  if (!hasC(N, c)) return fail(`Needs ${costTxt(c, ', ')} (${missTxt(N, c)}).`);
  return {ok:true, c, lv}; }
function buildLink(n, a, b, k){ const ck = linkCheck(n, a, b, k); if (!ck.ok){ refuse(n, ck.why); return false; }
  const N = S.nations[n]; payC(N, ck.c); const r = linkMake(a, b); r.bld = {n, k, lv:ck.lv, h:ck.c.h, h0:ck.c.h}; linkSave(r, false);
  if (isSeat(n)) tell(n, `Work started: ${k === 'rail' ? RAIL_NAME[ck.lv] : LINK_NAME[ck.lv]} ${G.P[a].cityName || G.P[a].name} – ${G.P[b].cityName || G.P[b].name}, ${Math.round(ck.c.h/2.4)/10} days.`, 'info', a);
  return true; }
// hourly: repairs count down, construction advances (paused while damaged, cancelled if either end is lost)
function linkHour(){ if (!S.links) return;
  for (const k of Object.keys(S.links)){ const d = S.links[k], r = G.LK.get(k); if (!r){ delete S.links[k]; continue; }
    if (r.dmg > 0){ r.dmg--; if (r.dmg <= 0){ r.dmg = 0; linkSave(r); } else d.dmg = r.dmg; }
    const B = r.bld; if (!B) continue;
    if (S.owner[r.a] !== B.n || S.owner[r.b] !== B.n){ r.bld = null; linkSave(r, false); if (isSeat(B.n)) tell(B.n, `Link works ${G.P[r.a].cityName || G.P[r.a].name} – ${G.P[r.b].cityName || G.P[r.b].name} abandoned: the province was lost.`, 'bad', r.a); continue; }
    if (r.dmg > 0) continue;
    if (--B.h <= 0){ if (B.k === 'rail') r.rail = B.lv; else r.road = B.lv; r.bld = null; linkSave(r); LINKD++;
      if (isSeat(B.n)){ tell(B.n, `${B.k === 'rail' ? RAIL_NAME[B.lv] : LINK_NAME[B.lv]} opened: ${G.P[r.a].cityName || G.P[r.a].name} – ${G.P[r.b].cityName || G.P[r.b].name}.`, 'good', r.a); fxAt('ready', r.a, {}, null, B.n); } } } }
function legHours(a, from, to){ const w = G.P[from].nb.get(to);
  if (G.P[to].sea || !ground(a)) return w*24/legSpeed(a, from, to);
  const r = linkOf(from, to), lv = roadLv(r), ws = weatherSpd(to);
  let f = terr(to).spd*ws*moveF(a, from, to)*roadMul(moveType(a), lv);
  if (riverX(from, to)) f /= lv >= 2 ? RIVER_XB : RIVER_X;
  const rl = railLv(r); if (rl && railFriend(a.owner, from) && railFriend(a.owner, to)){ const fr = RAIL_SPD[rl]*Math.sqrt(ws); if (fr > f) f = fr; }   // trains ignore terrain and rivers
  return w*24/(legSpeed(a, from, to)*f); }
// how a leg is travelled: 'rail', 'hw', 'road', 'track', 'off' (cross-country) or 'sea'
function legMode(a, from, to){ if (G.P[to].sea || G.P[from].sea) return 'sea'; if (!ground(a)) return 'off';
  const r = linkOf(from, to), lv = roadLv(r), rl = railLv(r);
  if (rl && railFriend(a.owner, from) && railFriend(a.owner, to)){ const ws = weatherSpd(to), f = terr(to).spd*ws*moveF(a, from, to)*roadMul(moveType(a), lv); if (RAIL_SPD[rl]*Math.sqrt(ws) > f) return 'rail'; }
  return lv >= 3 ? 'hw' : lv === 2 ? 'road' : lv === 1 ? 'track' : 'off'; }
// distance shares of a route by rail, roads (road + highway), tracks and cross-country
function routeMix(a, path){ const m = {rail:0, road:0, track:0, off:0, sea:0}; let u = a.to ?? a.at, tot = 0;
  for (const v of path){ const w = G.P[u].nb.get(v) || 0, k = legMode(a, u, v); m[k === 'hw' ? 'road' : k] += w; tot += w; u = v; }
  if (tot) for (const k in m) m[k] /= tot; return m; }
const mixText = m => [m.rail >= 0.05 ? `rail ${Math.round(m.rail*100)}%` : '', m.road >= 0.05 ? `road ${Math.round(m.road*100)}%` : ''].filter(Boolean).join(' · ');
const dominant = a => UT.reduce((b, t) => a.u[t]*UNITS[t].hp > a.u[b]*UNITS[b].hp ? t : b, 'inf');
function merge(into, from){   // (display: a column absorbed on arrival hands no drawn motion to the stack, which stays put; its models glide into the stack's group)
  if (from.cmd != null && into.cmd == null){ into.cmd = from.cmd; const c = cmdOf(into); if (c) c.army = into.id; } from.cmd = null; if (into.at === from.at){ const f = new Set([...(into.froms || (into.from != null ? [into.from] : [])), ...(from.froms || (from.from != null ? [from.from] : []))]); into.froms = [...f]; } const hi = armyHP(into), hf = armyHP(from); if (hi + hf > 0) into.m = ((into.m ?? 80)*hi + (from.m ?? 80)*hf)/(hi + hf); for (const t of UT){ into.u[t] += from.u[t]; into.w[t] += from.w[t]; from.u[t] = 0; from.w[t] = 0; } }
/* ---------------- Flexible splitting ----------------
   A force's rows: each unit type, with its damaged units (below 60% health) as a row of their own. A type's wounds are pooled (a.w) and sit on as
   few units as possible: nd = ceil(w/hp) units carry them; when those are below 60% they form the damaged row, otherwise the wounds are spread
   over the whole type. A plan lists, per new group, how many units of each row leave; the rest stays. Hit points move with the units that carry
   them, morale and orders are shared, peak strength splits by HP, and the commander stays with the largest group. */
const DMG_T = 0.6, SPLIT_MAX = 8;
function splitRows(a){ const rows = [];
  for (const t of UT){ const n = a.u[t]; if (!n) continue; const hp = UNITS[t].hp, w = Math.max(0, Math.min(a.w[t] || 0, n*hp - 0.01));
    const nd = w > 1e-6 ? Math.min(n, Math.ceil(w/hp - 1e-9)) : 0, dh = nd ? 1 - w/(nd*hp) : 1;
    if (nd && dh < DMG_T){ if (n > nd) rows.push({k:t + ':h', t, n:n - nd, wu:0, hf:1}); rows.push({k:t + ':d', t, n:nd, wu:w/nd, hf:dh, dmg:true}); }
    else rows.push({k:t + ':h', t, n, wu:w/n, hf:1 - w/(n*hp)}); }
  return rows; }
// spread new groups around the parent's spot inside its province, so each gets a counter of its own (drag one onto another to merge).
// spot: where the client draws the parent's counter (the split order may carry it); without it, the parent's own place or the province centre
function splitSpot(a, i, spot){ const P = G.P[a.at], c0 = a.pos || spot || [P.x, P.y];
  for (const r of [7, 5, 10, 3.5]) for (let j = 0; j < 8; j++){ const ang = (i*2.4 + j*0.785) % (Math.PI*2), x = c0[0] + Math.cos(ang)*r*1.3, y = c0[1] + Math.sin(ang)*r, c = worldToCell(x, y);
    if (c >= 0 && G.prov[c] === a.at) return [x, y]; }
  return null; }
// carry out a plan: [{rowKey: units}, ...] → the new forces (groups that move nothing are skipped; if nothing would stay, the largest group stays)
function splitPlan(a, plan, spot = null){
  if (!a || a.air || a.fly || count(a) < 2) return [];
  const R = new Map(splitRows(a).map(r => [r.k, r])), tot = new Map();
  let G0 = (plan || []).map(g => { const o = {}; for (const k in g){ const r = R.get(k), v = Math.max(0, Math.floor(+g[k] || 0)); if (r && v) o[k] = v; } return o; }).filter(g => Object.keys(g).length);
  for (const g of G0) for (const k in g){ const r = R.get(k), left = r.n - (tot.get(k) || 0); g[k] = Math.min(g[k], left); tot.set(k, (tot.get(k) || 0) + g[k]); }
  G0 = G0.filter(g => Object.values(g).some(v => v > 0));
  const stay = [...R.values()].reduce((s0, r) => s0 + r.n - (tot.get(r.k) || 0), 0);
  if (!stay && G0.length){ let bi = 0, bv = -1; G0.forEach((g, i) => { const v = Object.keys(g).reduce((s0, k) => s0 + g[k]*(UNITS[R.get(k).t].hp - R.get(k).wu), 0); if (v > bv){ bv = v; bi = i; } }); G0.splice(bi, 1); }
  if (!G0.length) return [];
  const pk = a.peak, h0 = effHP(a), out = [];
  G0.forEach((g, i) => { const b = addArmy(a.owner, a.at, {});
    b.to = a.to; b.t = a.t; b.path = a.path.slice(); b.m = a.m; b.stance = a.stance; b.from = a.from; b.froms = a.froms ? a.froms.slice() : undefined; b.landed = a.landed;
    b.forced = a.forced; b.fire = a.fire; b.delay = a.delay; b.home = a.home; b.retreating = a.retreating; b.chase = a.chase; b.legFrom = a.legFrom; if (a.dest) b.dest = {...a.dest};
    if (a.to === null && isSeat(a.owner)) b.pos = splitSpot(a, i, spot);   // a seat's groups get places of their own (the AI's stay on the province centre)
    for (const k in g){ const r = R.get(k), v = g[k]; b.u[r.t] += v; b.w[r.t] += v*r.wu; a.u[r.t] -= v; a.w[r.t] = Math.max(0, a.w[r.t] - v*r.wu); if (!a.u[r.t]) a.w[r.t] = 0; }
    out.push(b); });
  if (pk){ const all = [a, ...out]; for (const x of all) x.peak = h0 > 0 ? pk*effHP(x)/h0 : pk/all.length; }
  // the commander stays with the largest group
  const c = cmdOf(a); if (c){ const big = [a, ...out].reduce((x, y) => effHP(y) > effHP(x) + 1e-6 ? y : x, a); if (big !== a){ big.cmd = a.cmd; a.cmd = null; c.army = big.id; } }
  return out; }
// the classic halving (also used by the AI): half of every unit type leaves, HP in proportion; one unit if nothing would move
function halfPlan(a){ const g = {}; for (const r of splitRows(a)){ const k = Math.floor(r.n/2); if (k) g[r.k] = k; }
  if (!Object.keys(g).length){ const r = splitRows(a).find(r0 => r0.n > 1) || splitRows(a)[1]; if (r) g[r.k] = 1; } return [g]; }
function splitArmy(a, spot = null){ if (!a || count(a) < 2) return null; return splitPlan(a, halfPlan(a), spot)[0] || null; }
// evenly into n forces (n - 1 new groups); remainders rotate so the group totals stay level
function evenPlan(a, n){ n = Math.max(2, Math.min(SPLIT_MAX, n)); const plan = Array.from({length:n - 1}, () => ({})); let off = 0;
  for (const r of splitRows(a)){ const base = Math.floor(r.n/n), ex = r.n % n; for (let gi = 0; gi < n; gi++){ const v = base + (((gi - off) % n + n) % n < ex ? 1 : 0); if (gi > 0 && v) plan[gi - 1][r.k] = v; } off = (off + ex) % n; }
  return plan; }
// one group per unit type (damaged units go with their type); the largest type stays
function typePlan(a){ const rows = splitRows(a), types = [...new Set(rows.map(r => r.t))].sort((x, y) => a.u[y]*UNITS[y].hp - a.u[x]*UNITS[x].hp);
  const plan = []; for (const t of types.slice(1, SPLIT_MAX)){ const g = {}; for (const r of rows) if (r.t === t) g[r.k] = r.n; plan.push(g); }
  for (const t of types.slice(SPLIT_MAX)) for (const r of rows) if (r.t === t) plan[plan.length - 1][r.k] = r.n;   // more types than groups: the last group takes the rest
  return plan; }
// one healthy unit of the most numerous type leaves
function onePlan(a){ const rows = splitRows(a).filter(r => !r.dmg), r = rows.sort((x, y) => y.n - x.n)[0] || splitRows(a)[0]; return r ? [{[r.k]:1}] : [{}]; }
// count(a) > 0, stopping at the first unit found (unit counts are never negative; were one ever, the full sum decides)
function hasUnits(a){ const u = a.u; if (UT_ROLL){ let v; v = u.inf; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.at; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.art; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.sam; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.ifv; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.tank; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.jet; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.int; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.frig; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.sub; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.crui; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.mlrs; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.spec; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.carr; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.heli; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.drone; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.para; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.swarm; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.sdrone; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.jam; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.bomb; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.mpa; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.awacs; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.asf; if (v > 0) return true; if (v < 0) return count(a) > 0; v = u.stealth; if (v > 0) return true; if (v < 0) return count(a) > 0; return false; } for (let i = 0; i < UT.length; i++){ const v = u[UT[i]]; if (v > 0) return true; if (v < 0) return count(a) > 0; } return false; }
function removeEmpty(){
  { let any = false; for (const a of S.armies) if (!hasUnits(a)){ any = true; break; } if (!any) return; }   // the usual case: nothing to remove, no new array
  for (const a of S.armies){ if (count(a) > 0 || !a.air || !a.air.pend) continue; const pend = a.air.pend; a.air.pend = null; const base = S.owner[a.air.base] === a.owner ? a.air.base : nearestAirbase(a.owner, a.air.base); if (base < 0) continue;
    const w = addArmy(a.owner, base, {}); w.air = {base, cd:0}; for (const t in pend) w.u[t] = pend[t]; }
  S.armies = S.armies.filter(a => count(a) > 0); }
/* binary-heap A* over the province + sea-zone graph. Leg costs are relative leg times for the force's movement type (terrain, road class,
   rivers; sea legs 1.6), rail legs (the faster of road and train) count when both ends are friendly to the owner. The straight-line heuristic is
   scaled by the cheapest cost per distance found on any leg, so it never overestimates and A* stays exact. */
let FP = null;
const PATH_MT = ['foot', 'wheel', 'track', 'none'];
// static speed factor of a land leg for a movement type (no weather or season): terrain × road class, river crossing
function legFactor(mt, u, v){ const P = G.P[v], T = TERRAIN[P.terrain] || TERRAIN.plains, lv = roadLv(linkOf(u, v));
  let f = mt === 'none' ? 1 : T.spd*((TERR_F[mt] && TERR_F[mt][P.terrain]) || 1)*roadMul(mt, lv);
  if (mt !== 'none' && G.P[u].river.has(v)) f /= lv >= 2 ? RIVER_XB : RIVER_X; return f; }
function fpWeights(mt){ if (FP.w[mt]) return FP.w[mt]; const inv = 1/(HS0*SQ3); let k = Infinity;
  const W = G.P.map(P => Float64Array.from([...P.nb].map(([v, w0]) => { const c = (P.sea || G.P[v].sea) ? w0*1.6/(isLane(P.id, v) ? LANE_F : 1) : w0/legFactor(mt, P.id, v), hd = Math.hypot(P.x - G.P[v].x, P.y - G.P[v].y)*inv; if (hd > 1e-6 && hd < w0*3 + 2) k = Math.min(k, c/hd); return c; })));
  // rail legs: the cheaper of road and train; their own floor for the heuristic when rails may be used
  let kq = k; for (let u = 0; u < G.P.length; u++){ const Q = FP.q[u]; if (!Q) continue; const A = FP.adj[u]; for (let j = 0; j < A.length; j++){ if (!Q[j]) continue; const hd = Math.hypot(G.P[u].x - G.P[A[j]].x, G.P[u].y - G.P[A[j]].y)*inv; if (hd > 1e-6) kq = Math.min(kq, Math.min(W[u][j], Q[j])/hd); } }
  W.k = Math.min(1, k); W.kq = Math.min(1, kq); return FP.w[mt] = W; }
function fpPatch(recs){ const inv = 1/(HS0*SQ3);
  for (const r of recs) for (const [u, v] of [[r.a, r.b], [r.b, r.a]]){ const j = FP.adj[u].indexOf(v); if (j < 0) continue;
    const w0 = G.P[u].nb.get(v), rl = railLv(r), qc = rl ? w0/RAIL_SPD[rl] : 0, hd = Math.hypot(G.P[u].x - G.P[v].x, G.P[u].y - G.P[v].y)*inv, okH = hd > 1e-6 && hd < w0*3 + 2;
    if (qc && !FP.q[u]) FP.q[u] = new Float64Array(FP.adj[u].length); if (FP.q[u]) FP.q[u][j] = qc;
    for (const mt in FP.w){ const W = FP.w[mt], c = w0/legFactor(mt, u, v); W[u][j] = c; if (okH){ W.k = Math.min(W.k, c/hd); if (qc) W.kq = Math.min(W.kq, Math.min(c, qc)/hd); } } } }   // costs only fall with new links: keep the heuristic floor below them
const pathMT = a => a && ground(a) ? moveType(a) : 'none';
function findPath(a, b, ok = null, mt = 'foot', owner = -1){
  if (a === b) return [];
  const n = G.P.length;
  if (!FP || FP.G !== G){ FP = {G, d:new Float64Array(n), prev:new Int32Array(n), gen:new Uint32Array(n), hc:new Float64Array(n), hg:new Uint32Array(n), g:0, hk:new Float64Array(1 << 16), hv:new Int32Array(1 << 16),
    adj:G.P.map(P => Int32Array.from(P.nb.keys())), lv:-1}; }
  if (FP.lv !== LINKV){ const ch = FP.q ? linkChangesSince(FP.lv) : null; FP.lv = LINKV;
    if (ch) fpPatch(ch);                               // a few links changed: patch their legs
    else { FP.w = {};                                  // otherwise rebuild leg costs lazily per movement type
      FP.q = G.P.map(P => { if (P.sea || !P.lk.size) return null; let any = false; const Q = Float64Array.from([...P.nb].map(([v, w0]) => { const rl = railLv(P.lk.get(v)); if (!rl) return 0; any = true; return w0/RAIL_SPD[rl]; })); return any ? Q : null; }); } }
  const Wm = fpWeights(PATH_MT.includes(mt) ? mt : 'foot'), useRail = owner >= 0 && mt !== 'none';
  let fr = null; if (useRail){ fr = new Uint8Array(S.nations.length + 1); for (let i = 0; i < S.nations.length; i++) fr[i] = i === owner || allyOf(owner, i) ? 1 : 0; }
  const isFr = v => { const o = S.owner[v]; return o >= 0 && fr[o] === 1; };
  const d = FP.d, prev = FP.prev, gen = FP.gen, g = ++FP.g, B = G.P[b], inv = (useRail ? Wm.kq : Wm.k)/(HS0*SQ3);
  let hk = FP.hk, hv = FP.hv, hn = 0;
  const push = (k, v) => { if (hn === hk.length){ const k2 = new Float64Array(hn*2), v2 = new Int32Array(hn*2); k2.set(hk); v2.set(hv); hk = FP.hk = k2; hv = FP.hv = v2; }
    let i = hn++; while (i > 0){ const p = (i - 1) >> 1; if (hk[p] <= k) break; hk[i] = hk[p]; hv[i] = hv[p]; i = p; } hk[i] = k; hv[i] = v; };
  const pop = () => { const v = hv[0]; hn--; if (hn > 0){ const lk = hk[hn], lv = hv[hn]; let i = 0;
      for (;;){ const l = 2*i + 1, r = l + 1; let m = -1, mk = lk; if (l < hn && hk[l] < mk){ m = l; mk = hk[l]; } if (r < hn && hk[r] < mk){ m = r; mk = hk[r]; } if (m < 0) break; hk[i] = hk[m]; hv[i] = hv[m]; i = m; } hk[i] = lk; hv[i] = lv; } return v; };
  const hc = FP.hc, hg = FP.hg, h = v => { if (hg[v] === g) return hc[v]; const P = G.P[v], r = Math.hypot(P.x - B.x, P.y - B.y)*inv; hg[v] = g; hc[v] = r; return r; };   // (once per province a search)
  gen[a] = g; d[a] = 0; prev[a] = -1; push(h(a), a);
  let found = false;
  while (hn){ const key = hk[0], u = pop(); if (u === b){ found = true; break; } const du = d[u]; if (key > du + h(u) + 1e-9) continue;   // stale heap entry
    const A = FP.adj[u], Wt = Wm[u], Qt = useRail ? FP.q[u] : null, ru = Qt && isFr(u);
    for (let j = 0; j < A.length; j++){ const v = A[j]; if (ok && v !== b && !ok(v)) continue;
      let c = Wt[j]; if (ru && Qt[j] && Qt[j] < c && isFr(v)) c = Qt[j];
      const nd = du + c; if (gen[v] !== g || nd < d[v]){ gen[v] = g; d[v] = nd; prev[v] = u; push(nd + h(v), v); } } }
  if (!found) return [];
  const path = []; for (let v = b; v !== a; v = prev[v]) path.push(v); return path.reverse();
}
// ground forces do not march through independent land on the way to somewhere else (every garrison there is a battle): they embark at a port
// instead when the sea allows it, and only cross independents when there is no other way
// (canEnter per owner once a route: no relation changes while one is found, and the search asks it for every province it reaches)
const pathFor = (a, from, to) => { const so = shipsOnly(a), n = a.owner, ce = [], enter = v => { if (G.P[v].sea) return true; const o = S.owner[v]; if (o === n || o < 0) return true; if ((o | 0) !== o) return canEnter(n, v);
    let r = ce[o]; if (r === undefined) r = ce[o] = atWar(n, o) || friendly(n, o); return r; }, ok = v => enter(v) && (!so || portOk(a.owner, v)); if (!ok(to)) return [];
  const mt = pathMT(a);
  if (so) return findPath(from, to, v => (G.P[v].sea || v === to) && ok(v), mt, a.owner);   // ships sail over water only: a port is where a route ends, never a way through land
  if (so || a.air) return findPath(from, to, ok, mt, a.owner);
  const p = findPath(from, to, ok, mt, a.owner); let k = 0; for (let i = 0; i < p.length - 1; i++) if (!G.P[p[i]].sea && S.owner[p[i]] === NEUTRAL){ k = 1; break; } if (!k) return p;
  const p2 = findPath(from, to, v => v === to || G.P[v].sea || S.owner[v] !== NEUTRAL ? ok(v) : false, mt, a.owner); return p2.length ? p2 : p; };
// provinces on the way (not the destination) where the force will have to fight: independent land, and land of powers you are at war with
const fightsOnWay = (a, path) => path.slice(0, -1).filter(v => !G.P[v].sea && S.owner[v] !== a.owner && (S.owner[v] < 0 || atWar(a.owner, S.owner[v]))).length;
/* ---------------- Pinpoint movement ----------------
   A move order targets an exact point (a.dest {p, x, y}: the province or sea zone p that holds the point). The route runs province to province as
   always; only its last leg ends at the point instead of the centre. A force belongs to the province it stands in (a.at) for combat, supply,
   capture, vision, stack limits and frontage, so on that last leg, the hour its spot crosses into p it ARRIVES there (as at the end of any leg:
   capture, battle, landing) and walks the rest of the way inside p (a.sail, below). Every leg takes time in proportion to its real length
   (legRatio: from where the force stands, or the province centre, to the point, or the next centre), so a short last leg is quick and a
   long one slow, never a free jump. Ships do the same inside sea zones, on water only (a point on land is moved to the nearest water of the
   zone); air units fly missions and take no point. Old saves (no a.dest, no a.pos) keep the province centres. */
const JOIN_R = 6;   // world units (about 50 km): a force arriving at an exact point merges only with a force of its own standing that close (rules/tick.js)
const provOfPt = (x, y) => { const c = worldToCell(x, y); return c >= 0 ? G.prov[c] : -1; };
// the point (x, y) if it lies in province (or sea zone) p, else the nearest point of p (the centre of its nearest cell): a zone's cells are water
function ptIn(p, x, y){ if (!G.P[p] || !Number.isFinite(x) || !Number.isFinite(y)) return null; if (provOfPt(x, y) === p) return [x, y];
  let best = G.P[p].cc, bd = Infinity; for (const c of G.P[p].cells){ const [cx, cy] = cellCenter(c), d = (cx - x)*(cx - x) + (cy - y)*(cy - y); if (d < bd){ bd = d; best = c; } }
  return cellCenter(best); }
const lerpPt = (p1, p2, t) => [p1[0] + (p2[0] - p1[0])*t, p1[1] + (p2[1] - p1[1])*t];
// the two ends of force a's current leg: where it set out from (its spot, else the centre) and the exact point on the final leg, else the next centre
function legEnds(a){ const A = G.P[a.at], B = G.P[a.to]; return [a.legFrom || [A.x, A.y], !a.path.length && a.dest && a.dest.p === a.to ? [a.dest.x, a.dest.y] : [B.x, B.y]]; }
// the ends of the leg an idle force with a route starts next
function nextLegEnds(a){ const A = G.P[a.at], n0 = a.path[0], B = G.P[n0]; return [a.sail ? sailXY(a) : a.pos || [A.x, A.y], a.path.length === 1 && a.dest && a.dest.p === n0 ? [a.dest.x, a.dest.y] : [B.x, B.y]]; }
// a leg's real length over the centre-to-centre length its time is reckoned on (1 between centres)
function legRatio(from, to, p1, p2){ const A = G.P[from], B = G.P[to]; if (p1[0] === A.x && p1[1] === A.y && p2[0] === B.x && p2[1] === B.y) return 1;
  const D = Math.hypot(B.x - A.x, B.y - A.y); return D > 1e-9 ? Math.max(0.02, Math.min(3, Math.hypot(p2[0] - p1[0], p2[1] - p1[1])/D)) : 1; }
// hours of force a's current leg / of the leg it starts next (the leg's speed, times its real length)
const legH = a => { const [p1, p2] = legEnds(a); return legHours(a, a.at, a.to)*legRatio(a.at, a.to, p1, p2); };
const nextLegH = a => { const [p1, p2] = nextLegEnds(a); return legHours(a, a.at, a.path[0])*legRatio(a.at, a.path[0], p1, p2); };
// where on its leg a moving force is now
const legSpot = a => { const [p1, p2] = legEnds(a); return lerpPt(p1, p2, Math.max(0, Math.min(1, a.t))); };
// pt: the exact point to go to ([x, y], or omitted for the province centre). A ship's point is water (in a sea zone); a ship sent to a port docks
// at the quay. A point in the force's own province is a walk inside it (orderSpot).
function orderMove(a, target, pt = null){ delete a.tgt;   // (a move ends a Bombard order, rules/combat.js orderBombard)
  const q = pt && !a.air && G.P[target] && !(shipsOnly(a) && !G.P[target].sea) ? ptIn(target, pt[0], pt[1]) : null;
  if (q && a.to === null && target === a.at){ a.dest = null; orderSpot(a, q[0], q[1]); IM.emit('ordered', a); return; }
  if (a.sail){ a.pos = sailXY(a); delete a.sail; }   // (a force walking or sailing inside its province sets off from where it is now)
  const end0 = a.to !== null ? legEnds(a)[1] : null;
  if (q) a.dest = {p:target, x:q[0], y:q[1]}; else if (a.dest) a.dest = null;
  if (a.to !== null){ a.path = target === a.to ? [] : pathFor(a, a.to, target);
    const end1 = legEnds(a)[1]; if (end1[0] !== end0[0] || end1[1] !== end0[1]){ a.legFrom = legSpot(a); a.t = 0; } }   // the leg now ends elsewhere: it runs on from where the force is
  else { a.path = pathFor(a, a.at, target); a.forced = a.path.length > 0; }
  IM.emit('ordered', a);   // (display only: the client marks where the counter starts from)
}
// HALT: stop a force right now, exactly where it is. Movement is province to province (a.at -> a.to, a.t = 0..1 along the leg), but an idle force
// may stand at any point (a.pos), so a force on the road halts AT that point and becomes the force of the province that point lies in (the one it
// left or the one ahead; when the point lies in neither, the nearer of the two, and it stands at that province's nearest point). A force on a leg
// between land and sea stays registered where it set out from, at the point of that province nearest its spot. Fleets always stop on water:
// a fleet halting between two sea zones holds the water of one of them, and one halting on a leg between a port and the sea has no exact spot
// (it holds its zone or its dock). Also cancels queued legs and chase/join/escort.
function haltArmy(a){
  if (a.air){ if (a.fly) return false; a.path = []; return true; }
  if (a.to !== null){
    const A = G.P[a.at], B = G.P[a.to], t = Math.max(0, Math.min(1, a.t)), spot = legSpot(a), same = !!B.sea === !!A.sea, inP = provOfPt(spot[0], spot[1]);
    const near = !same ? a.at : inP === a.at || inP === a.to ? inP : t >= 0.5 ? a.to : a.at;
    if (near !== a.at){ a.from = a.at; a.froms = [a.at]; atMove(a, near); }
    a.to = null; a.t = 0; a.legFrom = null; a.carry = 0; a.forced = false; a.pos = shipsOnly(a) && !same ? null : ptIn(a.at, spot[0], spot[1]); }
  if (a.sail){ const s = sailXY(a); a.pos = ptIn(a.at, s[0], s[1]); delete a.sail; }   // a force walking or a fleet sailing inside its province stops where it is
  a.path = []; a.dest = null; a.chase = null; delete a.join; delete a.escort; delete a.tgt; delete a.raid;
  IM.emit('halted', a);   // (display only)
  return true;
}
/* A move to another spot inside the force's own province or sea zone (a.pos: forces may stand anywhere in it), and the rest of a pinpoint move
   once the force has crossed into the province of its point: the force WALKS (a fleet SAILS) there (a.sail {f: from, to: the spot, t: 0..1,
   h: hours}): a fleet at its sea speed (km a day: the slowest ship, research and the stack penalty, as abSpd shows it), a ground force at its
   speed over that province's terrain and weather (no roads inside a province), drawn on the move (armyXY), and until it arrives it is under
   way: it does not fire, blockade, escort or raid (rules/combat.js rangedStep, rules/trade.js seaIndex and trBlkIndex skip it). It already
   counts in the province for battles, supply and capture; a ground force caught in a battle there stops walking until the battle ends. Halt
   stops it where it is; a move order sets off from there. Deterministic: advanced once an hour in the movement step (rules/tick.js). */
const sailXY = a => { const s = a.sail, t = Math.max(0, Math.min(1, s.t)); return [s.f[0] + (s.to[0] - s.f[0])*t, s.f[1] + (s.to[1] - s.f[1])*t]; };
const sailing = a => !!a.sail;
// a force's speed inside province p (old map hexes a day)
const walkSpeed = (a, p) => G.P[p].sea || !ground(a) ? seaSpeed(a) : landSpeed(a)*terr(p).spd*weatherSpd(p)*moveF(a, p, p);
function orderSpot(a, x, y){ if (!a || a.air || a.fly || a.to !== null) return false;
  const q = ptIn(a.at, x, y); if (!q) return false; [x, y] = q;
  const [x0, y0] = armyXY(a), km = Math.hypot(x - x0, y - y0)/KM_W; a.path = []; a.dest = null; delete a.tgt;
  if (km < 1){ delete a.sail; a.pos = [x, y]; return true; }
  a.sail = {f:[x0, y0], to:[x, y], t:0, h:Math.max(1, Math.round(km*24/(walkSpeed(a, a.at)*KM_HEX)))}; a.pos = [x0, y0]; return true; }
// hours left for a force walking or sailing inside its province
const sailHours = a => a.sail ? Math.max(1, Math.ceil((1 - a.sail.t)*a.sail.h - 1e-9)) : 0;
// the hourly step of a force walking or sailing inside its province (rules/tick.js movement)
function sailHour(a){ const s = a.sail; if (!s) return; if (a.to !== null || a.path.length || (shipsOnly(a) && !G.P[a.at].sea)){ delete a.sail; return; }
  if (!G.P[a.at].sea && S.battles.includes(a.at)) return;   // (a ground force fighting where it stands stops walking until the battle ends)
  s.t = Math.min(1, s.t + 1/s.h); a.pos = sailXY(a); if (s.t >= 1 - 1e-9){ a.pos = [s.to[0], s.to[1]]; delete a.sail; } }
// the end of a leg (rules/tick.js movement): the force reaches the province it was heading for and stands at its exact point on the final leg
function legArrive(a){ if (G.P[a.at].sea && !G.P[a.to].sea){ a.landed = S.hour; a.m = Math.max(0, (a.m ?? 80) - 5); } a.from = a.at; a.froms = [a.at]; atMove(a, a.to); a.to = null; a.t = 0; a.legFrom = null;
  if (!a.path.length && a.dest && a.dest.p === a.at){ a.pos = shipsOnly(a) && !G.P[a.at].sea ? null : [a.dest.x, a.dest.y]; a.dest = null; } else a.pos = null; }   // (ships docking in a port take no pinpoint: they sit at the quay, never on land)
// the final leg of a pinpoint move crossing into its province (rules/tick.js movement, after the hour's progress lh): the force arrives there now,
// at the spot it has reached, and walks the rest of the leg's time inside it. Not for ships docking in a port (no point on land)
function legCross(a, lh){ if (a.path.length || !a.dest || a.dest.p !== a.to || a.t >= 1) return false;
  const s = legSpot(a); if (provOfPt(s[0], s[1]) !== a.to) return false;
  const to = [a.dest.x, a.dest.y], rem = (1 - a.t)*lh; legArrive(a);
  if (Math.hypot(to[0] - s[0], to[1] - s[1])/KM_W < 1 || rem < 1e-6){ a.pos = to; return true; }
  a.pos = s; a.sail = {f:s, to, t:0, h:rem}; return true; }
function canProceed(a){
  if (a.delay > 0) return false;
  if (a.forced) return true;
  if ((byAt(a.at) || S.armies).some(b => b.at === a.at && b.to === null && atWar(a.owner, b.owner) && count(b) > 0)) return false;
  if (!G.P[a.at].sea && S.owner[a.at] !== a.owner && ground(a) && atWar(a.owner, S.owner[a.at])) return false;
  return true;
}
function capNeed(p, by = NEUTRAL){ const P = G.P[p]; return (16 + (P.city ? 16 : 0) + (isCapital(p) ? 16 : 0))*(1 + 0.25*S.bld[p].fort)*rCapF(by)*(S.home && S.home[p] === by ? 0.5 : 1); }
// hours to the end of a route (path: a.path, or a route the player is weighing; end: its exact point, else the province centre)
function etaHours(a, path = a.path, end = path === a.path ? a.dest : null){
  if (a.to === null && !path.length) return sailHours(a);
  let h = 0, from = a.at, p1 = a.sail ? sailXY(a) : a.pos || [G.P[a.at].x, G.P[a.at].y];
  if (a.to !== null){ h += (1 - a.t)*legH(a); from = a.to; p1 = [G.P[a.to].x, G.P[a.to].y]; }
  for (let i = 0; i < path.length; i++){ const p = path[i], p2 = i === path.length - 1 && end && end.p === p ? [end.x, end.y] : [G.P[p].x, G.P[p].y]; h += legHours(a, from, p)*legRatio(from, p, p1, p2); from = p; p1 = p2; }
  return Math.ceil(h);
}
/* ---------------- Supply & morale ---------------- */
const SUPPLY_RANGE = 8, LEG = GS > 1 ? 3.33 : 1;   // LEG: a supply step is one province of the old map (~3.3 hexes, ~600 km)
let SUP = null, supHour = -1;
let SUPF = null, SUPFA = null, SUPE = null, SUPV = -1;   // SUPFA: the same for arctic powers, whose supply columns know the snow
function computeSupply(){
  if (!SUPF || SUPF.length !== G.P.length){ SUPF = Float32Array.from(G.P.map(P => P.sea ? 2 : terr(P.id).sup)); SUPFA = Float32Array.from(G.P.map(P => P.sea ? 2 : terr(P.id).supA || terr(P.id).sup)); }
  // per-leg multipliers by link (aligned with each province's neighbour order): roads and rail carry supply further, damaged links less
  if (!SUPE || SUPV !== LINKV){ const ch = SUPE ? linkChangesSince(SUPV) : null; SUPV = LINKV;
    const supRow = P => { if (P.sea || !P.lk.size) return null; const E = new Float32Array(P.nb.size); let j = 0;
      for (const v of P.nb.keys()){ const r = P.lk.get(v); E[j++] = !r ? 1 : railLv(r) ? -SUP_RAIL : SUP_LINK[roadLv(r)]*(r.dmg > 0 ? SUP_DMG : 1); } return E; };   // negative: rail (needs a friendly far end)
    if (ch) for (const r of ch){ SUPE[r.a] = supRow(G.P[r.a]); SUPE[r.b] = supRow(G.P[r.b]); } else SUPE = G.P.map(supRow); }
  SUP = S.nations.map(() => null);
  const CT = []; for (const P of G.P) if (P.city) CT.push(P.id);   // (the cities, in province order: where each nation's supply starts)
  for (const N of S.nations){ if (!N.alive) continue; const n = N.id, d = new Float32Array(G.P.length).fill(99), sup = new Uint8Array(G.P.length), SF = arctic(n) ? SUPFA : SUPF;
    const fm = [], own = v => { const o = S.owner[v]; if (o === n) return true; if (!(o >= 0)) return friendly(n, o); const f = fm[o]; return f !== undefined ? f : (fm[o] = friendly(n, o)); };   // (friendly per owner once: relations do not change here)
    const q = []; for (const p of CT) if (own(p)){ d[p] = 0; q.push(p); }
    // small graph: repeated relaxation by layers (costs 1 on land, 2 at sea)
    for (let h = 0; h < q.length; h++){ const u = q[h]; if (d[u] > SUPPLY_RANGE) continue; sup[u] = 1;
      if (!G.P[u].sea && !own(u)) continue;              // supply reaches one step into foreign land, no further
      const E = SUPE[u]; let j = 0;
      for (const [v, w] of G.P[u].nb){ let m = E ? E[j] : 1; j++; if (m < 0) m = own(v) ? -m : SUP_LINK[roadLv(G.P[u].lk.get(v))];
        const c = d[u] + (G.P[v].sea ? 2 : SF[v])*w/LEG*m; if (c < d[v] - 1e-6 && c <= SUPPLY_RANGE){ d[v] = c; q.push(v); } } }
    SUP[n] = sup; }
  supHour = S.hour;
}
// a fleet escorting one of its trade routes and standing on (or next to) it is resupplied at sea by the convoys it guards
const escortSup = a => { if (a.escort == null || !G.P[a.at].sea) return false; const r = routeById(a.escort); return !!r && r.kind === 'sea' && (r.path.includes(a.at) || r.path.some(v => G.P[v].nb.has(a.at))); };
const supplied = a => a.owner < 0 || (SUP && SUP[a.owner] ? !!SUP[a.owner][a.at] || (a.escort != null && escortSup(a)) : true);
const moraleF = a => a.owner < 0 ? 1 : (0.5 + 0.5*(a.m ?? 80)/100)*(supplied(a) ? 1 : 0.85)*(a.air && a.air.wear ? 1 - 0.45*a.air.wear : 1);
const effHP = UT_ROLL ? a => { const u = a.u, w = a.w; let s = 0, v; v = u.inf; if (v) s += v*UNITS.inf.hp - w.inf; v = u.at; if (v) s += v*UNITS.at.hp - w.at; v = u.art; if (v) s += v*UNITS.art.hp - w.art; v = u.sam; if (v) s += v*UNITS.sam.hp - w.sam; v = u.ifv; if (v) s += v*UNITS.ifv.hp - w.ifv; v = u.tank; if (v) s += v*UNITS.tank.hp - w.tank; v = u.jet; if (v) s += v*UNITS.jet.hp - w.jet; v = u.int; if (v) s += v*UNITS.int.hp - w.int; v = u.frig; if (v) s += v*UNITS.frig.hp - w.frig; v = u.sub; if (v) s += v*UNITS.sub.hp - w.sub; v = u.crui; if (v) s += v*UNITS.crui.hp - w.crui; v = u.mlrs; if (v) s += v*UNITS.mlrs.hp - w.mlrs; v = u.spec; if (v) s += v*UNITS.spec.hp - w.spec; v = u.carr; if (v) s += v*UNITS.carr.hp - w.carr; v = u.heli; if (v) s += v*UNITS.heli.hp - w.heli; v = u.drone; if (v) s += v*UNITS.drone.hp - w.drone; v = u.para; if (v) s += v*UNITS.para.hp - w.para; v = u.swarm; if (v) s += v*UNITS.swarm.hp - w.swarm; v = u.sdrone; if (v) s += v*UNITS.sdrone.hp - w.sdrone; v = u.jam; if (v) s += v*UNITS.jam.hp - w.jam; v = u.bomb; if (v) s += v*UNITS.bomb.hp - w.bomb; v = u.mpa; if (v) s += v*UNITS.mpa.hp - w.mpa; v = u.awacs; if (v) s += v*UNITS.awacs.hp - w.awacs; v = u.asf; if (v) s += v*UNITS.asf.hp - w.asf; v = u.stealth; if (v) s += v*UNITS.stealth.hp - w.stealth; return s; } : a => { const u = a.u, w = a.w; let s = 0; for (let i = 0; i < UT.length; i++){ const t = UT[i], v = u[t]; if (v) s += v*UNITS[t].hp - w[t]; } return s; };
// a day's healing at rate r, an hour's share (the loop over UT, written out: see count, rules/state.js)
const healW = UT_ROLL ? (a, r) => { const u = a.u, w = a.w; let v; v = u.inf; if (v) w.inf = Math.max(0, w.inf - v*UNITS.inf.hp*r/24); v = u.at; if (v) w.at = Math.max(0, w.at - v*UNITS.at.hp*r/24); v = u.art; if (v) w.art = Math.max(0, w.art - v*UNITS.art.hp*r/24); v = u.sam; if (v) w.sam = Math.max(0, w.sam - v*UNITS.sam.hp*r/24); v = u.ifv; if (v) w.ifv = Math.max(0, w.ifv - v*UNITS.ifv.hp*r/24); v = u.tank; if (v) w.tank = Math.max(0, w.tank - v*UNITS.tank.hp*r/24); v = u.jet; if (v) w.jet = Math.max(0, w.jet - v*UNITS.jet.hp*r/24); v = u.int; if (v) w.int = Math.max(0, w.int - v*UNITS.int.hp*r/24); v = u.frig; if (v) w.frig = Math.max(0, w.frig - v*UNITS.frig.hp*r/24); v = u.sub; if (v) w.sub = Math.max(0, w.sub - v*UNITS.sub.hp*r/24); v = u.crui; if (v) w.crui = Math.max(0, w.crui - v*UNITS.crui.hp*r/24); v = u.mlrs; if (v) w.mlrs = Math.max(0, w.mlrs - v*UNITS.mlrs.hp*r/24); v = u.spec; if (v) w.spec = Math.max(0, w.spec - v*UNITS.spec.hp*r/24); v = u.carr; if (v) w.carr = Math.max(0, w.carr - v*UNITS.carr.hp*r/24); v = u.heli; if (v) w.heli = Math.max(0, w.heli - v*UNITS.heli.hp*r/24); v = u.drone; if (v) w.drone = Math.max(0, w.drone - v*UNITS.drone.hp*r/24); v = u.para; if (v) w.para = Math.max(0, w.para - v*UNITS.para.hp*r/24); v = u.swarm; if (v) w.swarm = Math.max(0, w.swarm - v*UNITS.swarm.hp*r/24); v = u.sdrone; if (v) w.sdrone = Math.max(0, w.sdrone - v*UNITS.sdrone.hp*r/24); v = u.jam; if (v) w.jam = Math.max(0, w.jam - v*UNITS.jam.hp*r/24); v = u.bomb; if (v) w.bomb = Math.max(0, w.bomb - v*UNITS.bomb.hp*r/24); v = u.mpa; if (v) w.mpa = Math.max(0, w.mpa - v*UNITS.mpa.hp*r/24); v = u.awacs; if (v) w.awacs = Math.max(0, w.awacs - v*UNITS.awacs.hp*r/24); v = u.asf; if (v) w.asf = Math.max(0, w.asf - v*UNITS.asf.hp*r/24); v = u.stealth; if (v) w.stealth = Math.max(0, w.stealth - v*UNITS.stealth.hp*r/24); } : (a, r) => { for (const t of UT) if (a.u[t]) a.w[t] = Math.max(0, a.w[t] - a.u[t]*UNITS[t].hp*r/24); };
function armyUpkeep(prevBattles){
  for (const a of S.armies){ if (a.owner < 0 || !count(a) || a.fly) continue;
    const N = S.nations[a.owner], here = a.to === null, inBattle = here && S.battles.includes(a.at);
    if (inBattle){ /* morale falls in battleStep, every 15 minutes: no healing, no rest here */ }
    else if (a.air || supplied(a) || cmdF(a, 'supply')){ const r = healPerDay(a);   // (healPerDay, rules/combat.js: slow in the field, faster in an own city; the hook for a future Hospital)
      healW(a, r);
      a.m += 2; if (here && prevBattles.has(a.at)) a.m += 10; }
    else { for (const t of UT){ if (!a.u[t]) continue; a.w[t] += a.u[t]*UNITS[t].hp*0.04/24; while (a.w[t] >= UNITS[t].hp && a.u[t] > 0){ a.w[t] -= UNITS[t].hp; a.u[t]--; } if (!a.u[t]) a.w[t] = 0; }
      if (a.m > 30) a.m = Math.max(30, a.m - 1); }
    a.m = Math.max(0, Math.min(100, a.m));
    // broken morale: retreat to the nearest supplied own province, or surrender
    const limit = here && S.owner[a.at] === a.owner && G.P[a.at].city ? 15 : 25;
    if (inBattle && a.m < limit && !a.retreating){
      const seen = new Set([a.at]), q = [[a.at, 0]]; let dest = -1;
      for (let h = 0; h < q.length && dest < 0; h++){ const [u, du] = q[h]; if (du >= 6) continue;
        for (const v of G.P[u].nbs){ if (seen.has(v) || !canEnter(a.owner, v)) continue; seen.add(v);
          if (S.owner[v] === a.owner && SUP[a.owner] && SUP[a.owner][v] && !S.battles.includes(v)){ dest = v; break; } q.push([v, du + 1]); } }
      if (dest >= 0){ a.path = pathFor(a, a.at, dest); if (a.dest) a.dest = null; a.forced = true; a.retreating = true;
        if (isSeat(a.owner)) tell(a.owner, `${armyName(a)} broke at ${G.P[a.at].name} and is retreating to ${G.P[dest].name}.`, 'bad', a.at); }
      else if (!supplied(a) && a.m < 10 && (() => { const mine = S.armies.filter(b => b.at === a.at && b.to === null && b.owner === a.owner).reduce((s0, b) => s0 + effHP(b), 0), foe = S.armies.filter(b => b.at === a.at && b.to === null && atWar(a.owner, b.owner)).reduce((s0, b) => s0 + effHP(b), 0); return mine < foe*0.5; })()){ if (isSeat(a.owner)) tell(a.owner, `Your encircled force at ${G.P[a.at].name} surrendered.`, 'bad', a.at); for (const t of UT) a.u[t] = 0; }
    }
    if (!inBattle && a.retreating && a.m >= 40) a.retreating = false;
  }
  removeEmpty();
}
