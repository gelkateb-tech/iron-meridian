// Iron Meridian rules: vision. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
/* Fog of war: design notes
   Sight is measured in km (KM_W world units a km) from where each sensor actually is, as a circle (a satellite's strip is a capsule) at:
   - a force: its spot at the hour mark (armyXY: a.pos when it stands off-centre, on the road between a.legFrom and the leg's end at a.t while it
     marches: the line the map's drawn position eases along; positions only change on the hour, so the answer is cached for the hour)
   - a flying wing or air drop: flightPos; a city and an airbase: the province point (P.x, P.y), where the map draws the city
   - a UAV on station, an AWACS orbit, a maritime patrol: the mission's target point; a satellite: this hour's stretch of its ground track
   Ranges (km), one table per kind, so each can be tuned: VIS_KM in rules/data.js, UNITS[t].vis per unit type, UAV_LV vis in rules/air.js
   - own and allied land: all of it, whatever stands there
   - city (any level) 80, airbase 100 (the old ~600 km radar ring around every city and airbase is gone)
   - ground force or fleet: the farthest-seeing unit type in it, 50 (UNITS[t].vis), plus the province it is moving to. Recon/scout units 100:
     Special Forces (VIS_RECON; the game has no recon vehicle or scout helicopter). Thermal Sights / Night Optics: Anti-Tank Infantry / Special
     Forces see 50% farther (rSightF)
   - aircraft in flight 150; drones 200 (VIS_DRONE: the Recon UAV, and the armed drones: Strike Drones and Swarm Drones); fighter patrols and any
     wing on a recon mission see at least 200 (VIS_KM.patrol)
   - UAV on station, by its level (UAV I-V): 250, 300, 350, 400, 500; it marks what it sees as identified by UAV (vis.uav) and leaves the provinces
     under it revealed for its loiter plus 12 h (S.reveal, as before)
   - AWACS orbit 500 (High-Power Radar x1.15 / x1.3): location only, '?' contacts (vis.locs); the Phased-Array AWACS identifies within half of it;
     a stealth bomber wing is located within half of it (loLocated). An AWACS in flight never identifies by itself
   - maritime patrol on a hunt 400 (Sonobuoy Field x1.2 / x1.4), sea only: ships and submerged submarines
   - warships' sonar: unchanged, their own sea zone and the ones next to it (Towed Sonar: two), submarines only (vis.sonar)
   - satellite: a strip 150 km to each side (Reconnaissance Satellites III x1.15) along the stretch of track it flies this hour
   Nothing sees the neighbouring provinces by default any more: only what lies inside a range counts.
   What is seen
   - visibleSet(n) stays the province set the rest of the game uses (fog, province sheets, battles, effects): a province is in sight when it is
     own or allied land, revealed (S.reveal), the province one of the nation's forces is moving to (these are vis.whole: everything in them is
     seen), the province a sensor stands in, or when its point (P.x, P.y) lies inside an identifying range
   - armyVisible: a foreign force is seen when it stands in (or marches into, or flies over) a vis.whole province, or its own spot lies inside an
     identifying range. So a force at the far edge of a province in sight can still be hidden: the map draws the fog to match, clearing the
     vis.whole provinces and, elsewhere, exactly the circles (visTouch lists the ranges that reach into a province)
   - kept: a submerged submarine shows only to sonar or a maritime patrol (or in a battle); special forces only inside the range of one of the
     viewer's (or an ally's) own ground forces or fleets, never to cities, aircraft, satellites or radar; a stealth bomber wing in flight only to a
     Mobile SAM or jammer standing in its province or next to it (loSpotted, unchanged) or as an AWACS contact
   Cost: one set per seat per hour (visCache, cleared on the hour and by any rule that changes what is seen); province points sit in a grid so each
   range tests only the provinces near it; each force's answer is cached in its set. Nothing is saved. The AI does not use the fog: it plays on the
   full state (its recon UAVs pick targets by S.reveal), as before. */
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
// where force a is at the hour mark (world units): in flight, at its airbase, at its exact spot, or on the road of the leg it is marching
function armyXY(a){ if (a.fly) return flightPos(a); if (a.air){ const B = G.P[a.air.base]; return [B.x, B.y]; }
  const A = G.P[a.at]; if (a.to === null) return a.pos ? [a.pos[0], a.pos[1]] : [A.x, A.y];
  return legSpot(a); }   // (rules/movement.js: from a.legFrom or the centre to the exact point on the final leg or the next centre)
// the range a force on the ground or at sea sees (km): its farthest-seeing unit type
function armyVisKm(a){ let k = 0; for (const t of UT) if (a.u[t] > 0) k = Math.max(k, UNITS[t].vis*rSightF(a.owner, t)); return k || VIS_KM.ground; }
const visAewKm = n => VIS_KM.aew*rAewK(n), visMpaKm = n => VIS_KM.mpa*rMpaK(n);
// a range: [x1, y1, x2, y2, r, kind] in world units (a circle has x2 = x1, y2 = y1). kind (VK): id identifies; gf a ground force's or fleet's own
// (it also finds special forces); uav a UAV on station; sea a maritime patrol (identifies only what is at sea)
const VK = {id:0, gf:1, uav:2, sea:3};
// squared distance from (x, y) to a range's centre line, across the map's east-west seam
function visD2(s, x, y){ x += Math.round(((s[0] + s[2])/2 - x)/WORLD_W)*WORLD_W; const dx = s[2] - s[0], dy = s[3] - s[1], L = dx*dx + dy*dy;
  const t = L ? Math.max(0, Math.min(1, ((x - s[0])*dx + (y - s[1])*dy)/L)) : 0, ex = s[0] + dx*t - x, ey = s[1] + dy*t - y; return ex*ex + ey*ey; }
const visIn = (s, x, y) => visD2(s, x, y) <= s[4]*s[4];
// province points (and each province's bounding box) in a grid of VGRID world units, built once per map
const VGRID = 24; let VG = null;
function visGrid(){ if (VG && VG.G === G) return VG; const cols = Math.ceil(WORLD_W/VGRID) + 1, rows = Math.ceil(WORLD_H/VGRID) + 1, c = Array.from({length:cols*rows}, () => []), bb = [];
  let ext = 0; for (const P of G.P){ c[Math.max(0, Math.min(rows - 1, Math.floor(P.y/VGRID)))*cols + Math.max(0, Math.min(cols - 1, Math.floor(P.x/VGRID)))].push(P.id);
    let x0 = P.x, y0 = P.y, x1 = P.x, y1 = P.y; for (const i of P.cells){ const [x, y] = cellCenter(i); if (x - HS < x0) x0 = x - HS; if (x + HS > x1) x1 = x + HS; if (y - HS < y0) y0 = y - HS; if (y + HS > y1) y1 = y + HS; }
    bb[P.id] = [x0, y0, x1, y1]; ext = Math.max(ext, P.x - x0, x1 - P.x, P.y - y0, y1 - P.y); }
  return VG = {G, cols, rows, c, bb, ext}; }
// the provinces whose point lies inside range s, or (m > 0) within m world units of its bounding box; cb(p) for each
function visEach(s, cb, m = 0){ const g = visGrid(), r = s[4] + m, xa = Math.min(s[0], s[2]) - r, xb = Math.max(s[0], s[2]) + r, cs = new Set(),
    add = (a, b) => { for (let cx = Math.max(0, Math.floor(a/VGRID)); cx <= Math.min(g.cols - 1, Math.floor(b/VGRID)); cx++) cs.add(cx); },
    y0 = Math.max(0, Math.floor((Math.min(s[1], s[3]) - r)/VGRID)), y1 = Math.min(g.rows - 1, Math.floor((Math.max(s[1], s[3]) + r)/VGRID));
  add(xa, xb); if (xa < 0) add(xa + WORLD_W, WORLD_W); if (xb > WORLD_W) add(0, xb - WORLD_W);
  for (const cx of cs) for (let cy = y0; cy <= y1; cy++) for (const p of g.c[cy*g.cols + cx]){ if (m || visIn(s, G.P[p].x, G.P[p].y)) cb(p); } }
function visProvsIn(s){ const a = []; visEach(s, p => a.push(p)); return a; }
// the provinces a circle of km around (x, y) covers: those whose point lies inside it, and the one it stands in
const visProvsAt = (x, y, km) => { const a = visProvsIn([x, y, x, y, km*KM_W]), c = worldToCell(x, y), p0 = c >= 0 ? G.prov[c] : -1; if (p0 >= 0 && !a.includes(p0)) a.push(p0); return a; };
// what nation n sees (see the notes above): the provinces in sight, with .whole (everything in them seen), .ids (the identifying ranges),
// .locs (AWACS ranges: location only), .uav .loc .sonar (provinces identified by UAV, only located by AWACS, heard by sonar), .n (whose view)
function visibleSet(n){
  const C = visCache || (visCache = new Map()), v0 = C.get(n); if (v0) return v0;
  const v = new Set(); v.n = n; C.set(n, v);
  const al = new Set([n, ...alliesOf(n)]), whole = new Set(), ids = [], locs = [], uav = new Set(), loc = new Set(), sonar = new Set();
  const circ = (x, y, km, k = VK.id) => { if (km > 0) ids.push([x, y, x, y, km*KM_W, k]); };
  // a nation's land (and its allies') shows itself; cities and airbases see around their point
  for (let p = 0; p < G.P.length; p++) if (al.has(S.owner[p])){ whole.add(p); const P = G.P[p], ab = S.bld[p] && S.bld[p].air; if (P.city || ab) circ(P.x, P.y, Math.max(P.city ? VIS_KM.city : 0, ab ? VIS_KM.airbase : 0)); }
  if (S.reveal) for (const k in S.reveal) if (S.reveal[k] > S.hour) whole.add(+k);
  for (const a of S.armies){ if (!al.has(a.owner)) continue; const f = a.fly;
    if (f && f.ph === 'over'){ const T = G.P[f.tgt];
      if (f.kind === 'recon' && a.u.drone) circ(T.x, T.y, uavOf(a.owner).vis, VK.uav);   // UAV: identifies everything around its target
      else if (f.kind === 'hunt') circ(T.x, T.y, visMpaKm(a.owner), VK.sea);   // maritime patrol: ships and submerged subs
      else if (f.kind === 'orbit'){ locs.push([T.x, T.y, T.x, T.y, visAewKm(a.owner)*KM_W]); if (a.u.awacs && has(a.owner, 'awacs_g2')) circ(T.x, T.y, visAewKm(a.owner)/2); } }   // AWACS radar: location only
    if (!a.air && !a.fly && G.P[a.at].sea && shipsN(a)){ sonar.add(a.at); const far = a.u.frig && has(a.owner, 'frig_sonar'); for (const q of G.P[a.at].nbs) if (G.P[q].sea){ sonar.add(q); if (far) for (const w of G.P[q].nbs) if (G.P[w].sea) sonar.add(w); } }   // warships hear submarines close by
    if (f && a.u.awacs && a.u.awacs === count(a)) continue;   // early warning radar locates, it never identifies
    if (f){ const [x, y] = flightPos(a); let km = a.air ? 0 : VIS_KM.air;   // aircraft see around them as they fly (an air drop: its transports)
      if (a.air) for (const t of AIR_T) if (a.u[t] > 0) km = Math.max(km, UNITS[t].vis);
      if (f.ph === 'patrol' || f.kind === 'recon') km = Math.max(km, VIS_KM.patrol); circ(x, y, km); continue; }
    if (a.air) continue;
    const [x, y] = armyXY(a); circ(x, y, armyVisKm(a), VK.gf); if (a.to !== null) whole.add(a.to); }   // a force: around its spot, and the province it is moving to
  for (const st of (S.sats || [])) if (al.has(st.owner)) ids.push([...satStrip(st), VK.id]);
  /*@DEV*/if (DEV.reveal) for (let p = 0; p < G.P.length; p++) whole.add(p);/*@ENDDEV*/   // (in sight = identified; armyVisible shows hidden subs and special forces too)
  for (const p of whole) v.add(p);
  for (const s of ids){ const k = s[5], put = p => { if (k === VK.sea && !G.P[p].sea) return; v.add(p); if (k === VK.uav) uav.add(p); if (k === VK.sea) sonar.add(p); };
    visEach(s, put); const c = worldToCell(s[0], s[1]); if (c >= 0 && G.prov[c] >= 0) put(G.prov[c]); }   // (and the province the sensor stands in)
  for (const s of locs) visEach(s, p => loc.add(p));
  for (const q of v) loc.delete(q); v.uav = uav; v.loc = loc; v.sonar = sonar; v.whole = whole; v.ids = ids; v.locs = locs; v.seen = new Map();
  let h = v.size; for (const p of v) h = (h*31 + p) | 0; for (const s of ids) h = (h*31 + Math.round(s[0]*4) + 7*Math.round(s[1]*4) + 13*Math.round(s[2]*4) + 17*Math.round(s[4]*4)) | 0; v.key = h;
  return v;
}
const subOnly = a => a.u.sub > 0 && a.u.sub === count(a);
const specOnly = a => a.u.spec > 0 && a.u.spec === count(a);
// does the nation whose view `vis` is (vis.n) see force a (cached in the set for the hour)
function armyVisible(a, vis){ /*@DEV*/if (DEV.reveal) return true;/*@ENDDEV*/
  if (a.owner === vis.n) return true;
  const M = vis.seen, c = M && M.get(a); if (c !== undefined) return c;
  const r = armySeen(a, vis); if (M) M.set(a, r); return r; }
function armySeen(a, vis){ const me = vis.n;
  if (a.owner >= 0 && friendly(me, a.owner) && rel(me, a.owner).st === 'ally') return true;
  const ids = vis.ids || [], [x, y] = armyXY(a), sea = !a.air && !a.fly && G.P[a.at].sea, W0 = vis.whole || vis;
  if (a.owner >= 0 && specOnly(a)) return ids.some(s => s[5] === VK.gf && visIn(s, x, y));   // special forces: only seen up close, by a force
  if (a.owner >= 0 && subOnly(a) && sea && !S.battles.includes(a.at) && rel(me, a.owner).st !== 'ally')   // submerged: only sonar (warships next to it) or maritime patrol finds it
    return (!!vis.sonar && (vis.sonar.has(a.at) || (a.to !== null && vis.sonar.has(a.to)))) || ids.some(s => s[5] === VK.sea && visIn(s, x, y));
  if (a.fly){ const c = worldToCell(x, y), p0 = c >= 0 ? G.prov[c] : -1; if (p0 >= 0 && W0.has(p0)) return true; }   // flying over own or allied land (or revealed ground)
  else if (W0.has(a.at) || (a.to !== null && W0.has(a.to))) return true;   // on own or allied land, revealed, or where a force of yours is going
  for (const s of ids) if ((s[5] !== VK.sea || sea) && visIn(s, x, y)) return true;
  return false; }
// is point (x, y) under an AWACS orbit of the set's nation or its allies (location only)
const visLocAt = (vis, x, y) => !!vis.locs && vis.locs.some(s => visIn(s, x, y));
// AWACS contact: a foreign force inside an early-warning orbit that nothing identifies (not special forces, not a submerged sub)
function armyLocated(a, vis){ const L = vis.locs, me = vis.n; if (!L || !L.length || a.owner === me || a.owner < 0 || a.fly) return false;
  if (specOnly(a) || (subOnly(a) && G.P[a.at].sea) || rel(me, a.owner).st === 'ally') return false;
  if (armyVisible(a, vis)) return false; const [x, y] = armyXY(a); return visLocAt(vis, x, y); }
// the identifying ranges that reach into land province p (for drawing the fog: a province outside vis.whole is clear only inside them), cached in the set
function visTouch(vis, p){ if (!vis.ids) return []; if (!vis.touch){ const T = vis.touch = new Map(), g = visGrid();
    for (const s of vis.ids){ if (s[5] === VK.sea) continue; const r = s[4], x0 = Math.min(s[0], s[2]) - r, x1 = Math.max(s[0], s[2]) + r, y0 = Math.min(s[1], s[3]) - r, y1 = Math.max(s[1], s[3]) + r;
      visEach(s, q => { const b = g.bb[q]; if (G.P[q].sea || b[2] < x0 || b[0] > x1 || b[3] < y0 || b[1] > y1) return; let l = T.get(q); if (!l) T.set(q, l = []); l.push(s); }, g.ext + 1); } }
  return vis.touch.get(p) || []; }
// low-observable aircraft in flight (a wing of Stealth Bombers): radar, satellites, UAVs and other aircraft do not show them to a foreign nation.
// Nation n sees such a wing over province p0 only from a Mobile SAM or jammer of its own standing in p0 or next to it (loSpotted); an early-warning
// orbit of its own or of an ally gives a location-only contact within half the radar's range (measured from the orbit's point to the wing at x, y;
// the province point of p0 when not given), never an identification (loLocated). On the ground the wing is seen like any other.
const loWing = a => !!a.air && count(a) > 0 && AIR_T.every(t => !a.u[t] || !!UNITS[t].lo);
function loSpotted(n, p0){ if (p0 < 0) return false; for (const b of S.armies) if (b.owner === n && !b.air && (b.u.sam || b.u.jam) && (b.at === p0 || G.P[b.at].nbs.includes(p0))) return true; return false; }
function loLocated(n, p0, x, y){ if (p0 < 0) return false; if (x == null){ x = G.P[p0].x; y = G.P[p0].y; }
  for (const b of S.armies) if (b.fly && b.fly.kind === 'orbit' && b.fly.ph === 'over' && b.u.awacs && (b.owner === n || (b.owner >= 0 && n >= 0 && rel(n, b.owner).st === 'ally'))){ const T = G.P[b.fly.tgt];
    if (visIn([T.x, T.y, T.x, T.y, visAewKm(b.owner)/2*KM_W], x, y)) return true; }
  return false; }
// is wing a, flying over province p0, hidden from nation n by its low-observable airframe (its own and its allies' wings never are)
function loHidden(a, n, p0){ /*@DEV*/if (DEV.reveal) return false;/*@ENDDEV*/
  return !!a.fly && a.owner !== n && loWing(a) && !(a.owner >= 0 && n >= 0 && rel(n, a.owner).st === 'ally') && !loSpotted(n, p0); }
