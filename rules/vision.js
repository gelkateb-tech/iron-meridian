// Iron Meridian rules: vision. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
// each nation's fog-of-war set for this hour, by nation id (null = work them out again); every rule that changes what can be seen clears it
let visCache = null;
// where a flight is at the hour mark:
// an air drop runs from its start to its target, a wing flies base to target and back, and on station it sits on the target
function flightPos(a){ const f = a.fly, T = G.P[f.tgt];
  if (!a.air){ const A = G.P[f.from], t = Math.min(1, f.t); return [A.x + (T.x - A.x)*t, A.y + (T.y - A.y)*t]; }
  const B = G.P[a.air.base], t = Math.min(1, f.t);
  if (f.ph === 'out') return [B.x + (T.x - B.x)*t, B.y + (T.y - B.y)*t];
  if (f.ph === 'back') return [T.x + (B.x - T.x)*t, T.y + (B.y - T.y)*t];
  return [T.x, T.y]; }
// what nation n sees: the provinces in sight (with .uav .loc .sonar: identified by UAV, located by AWACS only, heard by sonar; .n: whose view)
function visibleSet(n){
  const C = visCache || (visCache = new Map()), v0 = C.get(n); if (v0) return v0;
  const v = new Set(); v.n = n; C.set(n, v);
  const al = new Set([n, ...alliesOf(n)]);
  const ring = (p0, r) => { for (const q of nearList(p0, r*LEG)) v.add(q); };
  // a nation's land (and its allies') shows itself; cities and airbases carry radar that also covers the surrounding provinces
  for (let p = 0; p < G.P.length; p++) if (al.has(S.owner[p])){ v.add(p); if (G.P[p].city || S.bld[p].air) for (const q of nearList(p, LEG)) v.add(q); }
  if (S.reveal) for (const k in S.reveal) if (S.reveal[k] > S.hour) v.add(+k);
  const uav = new Set(), loc = new Set(), sonar = new Set();
  for (const a of S.armies){ if (!al.has(a.owner)) continue;
    if (a.fly && a.fly.ph === 'over'){ const f = a.fly;
      if (f.kind === 'recon' && a.u.drone) for (const q of nearList(f.tgt, uavOf(a.owner).vis)){ v.add(q); uav.add(q); }   // UAV: identifies everything around its target
      else if (f.kind === 'hunt') for (const q of nearList(f.tgt, MPA_R)){ if (G.P[q].sea){ v.add(q); sonar.add(q); } }   // maritime patrol: ships and submerged subs
      else if (f.kind === 'orbit') for (const q of nearList(f.tgt, AEW_R)) loc.add(q); }   // AWACS radar: location only
    if (!a.air && !a.fly && G.P[a.at].sea && shipsN(a)){ sonar.add(a.at); for (const q of G.P[a.at].nbs) if (G.P[q].sea) sonar.add(q); }   // warships hear submarines close by
    if (a.fly && a.u.awacs && a.u.awacs === count(a)) continue;   // early warning radar locates, it never identifies
    if (a.fly){ const [wx, wy] = flightPos(a), c = worldToCell(wx, wy), p0 = c >= 0 ? G.prov[c] : -1; if (p0 >= 0) ring(p0, (isDrone(a) || a.fly.ph === 'patrol' || a.fly.ph === 'over' && a.fly.kind === 'recon') ? 2 : 1); continue; }   // aircraft spot what they fly over
    if (a.air) continue;
    for (const q of nearList(a.at, 0.8*LEG)) v.add(q); if (a.to !== null) v.add(a.to); }
  for (const st of (S.sats || [])) if (al.has(st.owner)) for (const p0 of satSwath(st)) v.add(p0);
  /*@DEV*/if (DEV.reveal) for (let p = 0; p < G.P.length; p++) v.add(p);/*@ENDDEV*/   // (in sight = identified; armyVisible shows hidden subs and special forces too)
  for (const q of v) loc.delete(q); v.uav = uav; v.loc = loc; v.sonar = sonar;
  let h = v.size; for (const p of v) h = (h*31 + p) | 0; v.key = h;
  return v;
}
// does the nation whose view `vis` is (vis.n) see force a
function armyVisible(a, vis){ /*@DEV*/if (DEV.reveal) return true;/*@ENDDEV*/
  const me = vis.n;
  if (a.owner !== me && a.owner >= 0 && a.u.spec && a.u.spec === count(a) && !S.armies.some(b => b.owner === me && !b.air && (b.at === a.at || G.P[b.at].nbs.includes(a.at)))) return false;   // special forces: only seen up close
  if (a.owner !== me && a.owner >= 0 && subOnly(a) && G.P[a.at].sea && !S.battles.includes(a.at) && !(vis.sonar && (vis.sonar.has(a.at) || (a.to !== null && vis.sonar.has(a.to)))) && rel(me, a.owner).st !== 'ally') return false;   // submerged: only sonar (warships next to it) or maritime patrol finds it
  return a.owner === me || (a.owner >= 0 && friendly(me, a.owner) && rel(me, a.owner).st === 'ally') || vis.has(a.at) || (a.to !== null && vis.has(a.to)); }
const subOnly = a => a.u.sub > 0 && a.u.sub === count(a);
// AWACS contact: a foreign force inside an early-warning orbit that nothing identifies (not special forces, not a submerged sub)
function armyLocated(a, vis){ const L = vis.loc, me = vis.n; if (!L || !L.size || a.owner === me || a.owner < 0 || a.fly) return false;
  if ((a.u.spec && a.u.spec === count(a)) || (subOnly(a) && G.P[a.at].sea) || rel(me, a.owner).st === 'ally') return false;
  return L.has(a.at) || (a.to !== null && L.has(a.to)); }
