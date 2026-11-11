// Iron Meridian rules: research. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
'use strict';
// ---------- research rules: every nation runs two projects at once, slot #1 (N.research) and slot #2 (N.research2), each {id, lv, h, h0} or null.
// Both slots progress at full speed; a project's costs are paid when it starts; a project whose prerequisite is still running in the other slot
// waits until that one is done. Pure rules (no drawing): the UI asks researchWhy / canResearch and calls startResearch.
const R_SLOTS = ['research', 'research2'];
const rFree = N => !N.research ? 'research' : !N.research2 ? 'research2' : null;   // the free slot (slot #1 first), or null when both are busy
const rFreeN = N => R_SLOTS.reduce((c, k) => c + (N[k] ? 0 : 1), 0);   // how many slots are free
const rRunning = (N, id) => R_SLOTS.find(k => N[k] && N[k].id === id) || null;   // the slot running this node (any level of it), or null
const rSlotNo = k => k === 'research2' ? 2 : 1;
// ---------- levels, days and prerequisites (docs/RESEARCH.md section 2). N.tech[id] is the level a nation holds of node id (0: none);
// the unlock of a standard-issue unit counts as level 1 for everyone. A slot holds {id, lv, h, h0}: lv is the level being researched.
const rLevel = (n, id) => { if (n < 0 || !S || !S.nations[n]) return 0; const v = S.nations[n].tech && S.nations[n].tech[id]; return v ? +v || 1 : RN[id] && RN[id].std ? 1 : 0; };
const rDay = () => dayOf(S.hour);                                   // the game day the top bar shows: day 1 is the first 24 hours
const rNextLv = (n, id) => { const nd = RN[id], l = rLevel(n, id); return nd && l < nd.lv.length ? l + 1 : 0; };   // the level a nation would research next (0: all done)
// what level lv of a node needs: level 1 the node's own prerequisites (its spine node; the missile line; two lines for the Stealth Bomber),
// level 3 of Firepower and Protection generation 2 where the line has one, a later level of an upgrade dated after generation 2 that generation (rq);
// every level needs the level before it (levels are researched in order)
const rReqs = (nd, lv) => lv <= 1 ? nd.req : lv === 3 && nd.req3 ? [nd.req3] : nd.lv[lv - 1].rq || [];
const rReqsOk = (n, nd, lv) => rReqs(nd, lv).every(q => rLevel(n, q) > 0);
// the next level of node id is open to nation n: its day has come and what it needs is researched (money and slots aside)
const rOpen = (n, id) => { const lv = rNextLv(n, id), nd = RN[id]; return !!lv && nd.lv[lv - 1].day <= rDay() && rReqsOk(n, nd, lv); };
// every step a nation could start now if it had a slot and the price: [{nd, lv}] (not running, day reached, prerequisites researched)
function rOpenSteps(n){ const N = S.nations[n], out = []; for (const nd of RNODES){ if (rOpen(n, nd.id) && !rRunning(N, nd.id)) out.push({nd, lv:rNextLv(n, nd.id)}); } return out; }
const rHours = (n, nd, lv) => Math.max(1, Math.round(nd.lv[lv - 1].c.days*24*(docOf(n) ? docOf(n).res : 1)));   // research time in hours, with the doctrine
// research steps a nation has done (standard-issue unlocks are not steps)
const rDone = n => { const T = S.nations[n].tech || {}; let k = 0; for (const id in T) if (RN[id] && !RN[id].std) k += Math.min(RN[id].lv.length, +T[id] || 1); return k; };
// the generation of unit type t a nation fields (1: the first model)
const rGenOf = (n, t) => { let g = 1; for (const nd of RNODES_U[t] || []) if (nd.kind === 'gen' && nd.gen > g && rLevel(n, nd.id) > 0) g = nd.gen; return g; };
// why nation n cannot start the next level of node id now ('' when it can)
function researchWhy(n, id){ const N = S.nations[n], nd = RN[id];
  if (!nd || !N || !N.alive) return 'Not available'; const lv = rNextLv(n, id); if (!lv) return 'Researched'; { const k = rRunning(N, id); if (k) return `Running in slot #${rSlotNo(k)}`; }
  if (nd.lv[lv - 1].day > rDay()) return `Opens on day ${nd.lv[lv - 1].day}`;
  { const miss = rReqs(nd, lv).filter(q => !rLevel(n, q)), idle = miss.filter(q => !rRunning(N, q));
    if (idle.length) return `Needs ${idle.map(q => RN[q].name.split(' · ')[0]).join(' and ')}`;
    if (miss.length) return `Waits for ${miss.map(q => `${RN[q].name.split(' · ')[0]} (slot #${rSlotNo(rRunning(N, q))})`).join(' and ')}`; }
  if (!rFree(N)) return 'Both slots busy';
  return hasC(N, rCost(nd, lv)) ? '' : `Needs ${missTxt(N, rCost(nd, lv))}`; }
function canResearch(n, id){ const N = S.nations[n], nd = RN[id]; return !!nd && !!N && N.alive && !!rFree(N) && !rRunning(N, id) && rOpen(n, id) && hasC(N, rCost(nd, rNextLv(n, id))); }
// start the next level of node id in the free slot (paying its price); returns false when it cannot start
function startResearch(n, id){ if (!canResearch(n, id)) return false; const N = S.nations[n], nd = RN[id], lv = rNextLv(n, id), k = rFree(N), c = rCost(nd, lv); payC(N, c);
  const h = rHours(n, nd, lv); N[k] = {id, lv, h, h0:h};
  if (isSeat(n)){ const D = desk(n); (D.tut || (D.tut = {})).research = true; bump(n, 'rareRes', c.rare || 0); } return true; }
// give a nation a level of a node outright (research finished, a stolen design, an old save converted); never lowers a level
function rGrant(N, id, lv){ const nd = RN[id]; if (!nd) return; const T = N.tech || (N.tech = {}); T[id] = Math.max(+T[id] || 0, Math.min(nd.lv.length, lv || 1)); N.tv = (N.tv || 0) + 1; }
// a project of the old tree: its nodes (R_LEGACY: 'node' = level 1, 'node@' = one level more)
function rGrantLegacy(N, old){ for (const s of R_LEGACY[old] || []){ const add = s.endsWith('@'), id = add ? s.slice(0, -1) : s; rGrant(N, id, add ? (+(N.tech && N.tech[id]) || 0) + 1 : 1); } }
// what a spy of nation n could steal from nation o: the nodes o holds at a higher level (one level is taken at a time; days do not matter)
const rStealable = (n, o) => Object.keys(S.nations[o].tech || {}).filter(t => RN[t] && rLevel(o, t) > rLevel(n, t));
// ---------- upgrades worded rather than a flat stat (docs/RESEARCH.md phase 4): each is one small rule read from the nation's level
// class multipliers a generation or an upgrade changes: unit -> class -> [node, new value]
const R_VS = {at:{armored:['at_g2', 4]}, mlrs:{armored:['mlrs_g2', 1.2]}, jet:{armored:['jet_g2', 1.8]}, swarm:{armored:['swarm_g2', 0.6]}, frig:{air:['frig_aa', 2.1]}};
const multO = (o, t, k) => { const r = R_VS[t] && R_VS[t][k]; return r && o >= 0 && has(o, r[0]) ? r[1] : mult(t, k); };
const multUO = (o, t, u) => (UNITS[t].vsU && UNITS[t].vsU[u] != null) ? UNITS[t].vsU[u] : multO(o, t, UNITS[u].cls);
const rTrainF = (n, t) => t === 'inf' ? [1, 0.85, 0.7][rLevel(n, 'inf_build')] || 1 : 1;                 // Rapid Mobilisation: Motorized Infantry trains 15% / 30% faster
// rough-ground training: a force made up only of trained types loses half the terrain's speed penalty (Rough-Ground Drills: forest and hills, then
// mountains and jungle too; Wide Tracks: any rough ground). Special Forces already cross rough ground at full speed
const R_DRILL = [null, {forest:1, hills:1}, {forest:1, hills:1, mountain:1, jungle:1}];
function rDrilled(a, terrain){ const o = a.owner; if (o < 0) return false; let any = false;
  for (const t of UT){ if (!a.u[t]) continue; if (t === 'spec') continue; if (t === 'inf'){ const D = R_DRILL[rLevel(o, 'inf_terr')]; if (!D || !D[terrain]) return false; any = true; } else if (t === 'tank'){ if (!has(o, 'tank_terr')) return false; any = true; } else return false; }
  return any; }
const rSpecTerr = (n, f) => f > 1 ? 1 + (f - 1)*[1, 1.25, 1.5][rLevel(n, 'spec_terr')] : f;             // Mountain & Arctic Training: the rough-terrain attack bonus 40% -> 50% -> 60%
const rSightF = a => a.owner >= 0 && ((a.u.at && has(a.owner, 'at_eye')) || (a.u.spec && has(a.owner, 'spec_eye'))) ? 1.3 : 0.8;   // Thermal Sights, Night Optics: half a province farther (in legs)
const rMlrsReach = n => has(n, 'mlrs_rng') ? 3 : 2;                                                   // Extended-Range Rockets: provinces
const rSamNear = n => has(n, 'sam_g2') ? 1 : 0.35;                                                    // Long-Range SAM: neighbouring provinces at full strength
const rJamF = n => [1, 1.2, 1.4][rLevel(n, 'jam_band')] || 1;                                         // Wideband Jamming
const rPack = (n, t) => (UNITS[t].pack || 1) + (t === 'swarm' && has(n, 'swarm_pack') ? 2 : 0);       // Bigger Salvo: eight swarm drones per card
const rKoHours = n => has(n, 'sdrone_hit') ? 36 : 24;                                                 // Bunker-Buster Warhead
const rAdF = (n, t) => t === 'sdrone' && has(n, 'sdrone_g2') ? 0.7 : 1;                               // Low-Observable Strike Drone: air defences hit 30% less
const rBombF = (n, t) => t === 'stealth' && has(n, 'stealth_bay') ? 0.75 : UNITS[t].bmb || 0;         // Enlarged Bomb Bay
const rMpaR = n => MPA_R*([1, 1.2, 1.4][rLevel(n, 'mpa_sonar')] || 1), rMpaH = n => has(n, 'mpa_g2') ? 18 : 12;   // Sonobuoy Field; Long-Endurance Patrol Aircraft
const rAewR = n => AEW_R*([1, 1.15, 1.3][rLevel(n, 'awacs_radar')] || 1), rAewF = n => has(n, 'awacs_link') ? 1.35 : 1.25;   // High-Power Radar; Fighter Data Link
const rDeckRate = n => [0.2, 0.25, 0.3][rLevel(n, 'carr_deck')] || 0.2;                               // Flight-Deck Crews: repairs aboard a carrier, per day
// Command & Logistics, by level: Motorized Supply (speed), Combat Engineers (capture work, road and rail price), Amphibious Doctrine (first day ashore), Field Hospitals (damage taken)
const rMoveF = n => [1, 1.2, 1.3][rLevel(n, 'log1')] || 1, rCapF = n => [1, 0.7, 0.6][rLevel(n, 'log2')] || 1, rRoadF = n => [1, 0.75, 0.65][rLevel(n, 'log2')] || 1;
const rLandF = n => [0.67, 0.9, 1][rLevel(n, 'nav3')] || 0.67, rHospF = n => [1, 0.85, 0.8][rLevel(n, 'log3')] || 1;
// missiles: range, speed and power by research (Cruise Missile Range / Speed, Ballistic Missile Range, Heavier Warhead)
function mslOf(n, k){ const M0 = MISSILES[k]; if (!M0 || n < 0) return M0; const r = k === 'cm' ? rLevel(n, 'cm_rng')*4 : rLevel(n, 'bm_rng')*12, s = k === 'cm' ? rLevel(n, 'cm_spd')*2 : 0, p = k === 'bm' && has(n, 'bm_pow') ? 3 : 0;
  return r || s || p ? {...M0, range:M0.range + r, speed:M0.speed + s, power:M0.power + p} : M0; }
const rShield = n => [1, 2, 2.5, 3][rLevel(n, 'msl3')] || 1;                                          // Anti-Missile Shield: how much better SAMs and Frigates intercept
const rSatMax = n => [0, 3, 4, 5][rLevel(n, 'sat1')] || 0, rSatR = n => SAT_R*(rLevel(n, 'sat1') >= 3 ? 1.15 : 1);   // Reconnaissance Satellites: how many, and the swath
// who may be air-dropped: Paratroopers, and Special Forces once they are Air-Transportable; how far (the shortest reach in the force)
const dropOnly = a => !!a && !a.air && count(a) > 0 && (a.u.para || 0) + (a.owner >= 0 && has(a.owner, 'spec_airlift') ? a.u.spec || 0 : 0) === count(a);
const dropRange = a => Math.min(a.u.para ? PARA_RANGE + 2*rLevel(a.owner, 'para_airlift') : 99, a.u.spec ? 6 : 99);
// one game hour of one slot: completion frees the slot
function researchSlotHour(N, k){ const R = N[k]; if (!R) return;
  if (--R.h <= 0){ const nd = RN[R.id]; N[k] = null;
    if (!nd || (!R.lv && R_LEGACY[R.id])){   // a project of the old tree that was still running when the save was converted: it turns into its nodes now
      if (R_LEGACY[R.id]){ rGrantLegacy(N, R.id); if (isSeat(N.id)){ tell(N.id, `Research complete: ${R_LEGACY_NAME[R.id]}. It is now ${R_LEGACY[R.id].map(s => RN[s.replace('@', '')].name.split(' · ')[0]).join(', ')} in the new research tree.`, 'good'); cue(N.id, 'research'); } }
      return; }
    const lv = R.lv || rNextLv(N.id, R.id) || nd.lv.length; rGrant(N, nd.id, lv);
    if (isSeat(N.id)){ tell(N.id, `Research complete: ${rName(nd, lv)}. ${cap1(nd.lv[lv - 1].txt)}.`, 'good'); cue(N.id, 'research'); } } }
// the hourly research step: both slots advance
function researchHour(N){ for (const k of R_SLOTS) researchSlotHour(N, k); }
// saves from before two slots held a queued project for slot #2 (N.rqueue). It runs after researchMigrate, so the queue is read in the new tree:
// a project of the old tree becomes its first node (R_LEGACY) that the nation can start now, which starts (paying as usual). When none can
// (its day has not come, the money is short) the queue is dropped and a person's nation is told why, so the project is not lost without a word.
function rqueueMigrate(){ for (const N of S.nations){ const q = N.rqueue; delete N.rqueue; delete N.rqWarn; if (!q || !N.alive) continue;
    const ids = RN[q] ? [q] : (R_LEGACY[q] || []).map(s => s.replace('@', '')).filter(id => RN[id] && rNextLv(N.id, id) && !rRunning(N, id));
    const go = ids.find(id => canResearch(N.id, id)); if (go){ startResearch(N.id, go); continue; }
    if (isSeat(N.id) && ids.length){ const D = desk(N.id), nm = R_LEGACY_NAME[q] || (RN[q] ? RN[q].name : q);
      if (Array.isArray(D.log)) D.log.unshift({h:S.hour, kind:'info', p:N.capital, text:`Your queued research ${nm} did not start: in the new tree it is ${ids.map(id => RN[id].name).join(' and ')} (${researchWhy(N.id, ids[0]).replace(/^./, c => c.toLowerCase())}). Choose it again in Research when it opens.`}); } } }
// saves from before the research redesign (S.rsv unset): every researched project becomes the nodes that give the same bonus or more (R_LEGACY),
// every unit Mark II to IV becomes levels 1 to 3 of that unit's Firepower and Protection. Nothing is lost: converted levels stay whatever the
// new days and prerequisites say. A project still running keeps running under its old id and converts when it finishes (researchSlotHour);
// a Mark upgrade still running (N.eng) runs to its end (engHour) and then gives its two levels.
function researchMigrate(){ if (S.rsv >= 2) return; S.rsv = 2;
  for (const N of S.nations){ const T = N.tech || (N.tech = {}); let k = 0, m = 0;
    for (const old of Object.keys(R_LEGACY)) if (T[old]){ delete T[old]; rGrantLegacy(N, old); k++; }
    if (N.mk){ for (const t in N.mk){ const l = Math.min(3, (+N.mk[t] || 1) - 1); if (l > 0 && UNITS[t]){ m++; for (const e of ['fp', 'pr']) rGrant(N, t + '_' + e, l); } } delete N.mk; }
    N.rPick = null; N.tv = (N.tv || 0) + 1;
    if (isSeat(N.id)){ const D = desk(N.id); if (Array.isArray(D.log)) D.log.unshift({h:S.hour, kind:'info', p:N.capital, text:'New research tree: research is now organised by unit, with a day for every project, levels and newer generations.'
      + (k ? ` Your ${k} researched project${k > 1 ? 's' : ''} became the matching upgrades: every bonus is the same or better.` : '') + (m ? ` Unit Marks are now Firepower and Protection levels in the tree (${m} unit type${m > 1 ? 's' : ''} converted).` : '')
      + (N.eng ? ' The Mark upgrade in progress will finish and count.' : '')}); } } }
// a Mark upgrade that was running when an old save was converted (N.eng = {t, m, h}): when it ends it gives level m - 1 of Firepower and Protection
function engHour(N){ if (--N.eng.h <= 0){ const {t, m} = N.eng; N.eng = null; if (!UNITS[t]) return; for (const e of ['fp', 'pr']) rGrant(N, t + '_' + e, Math.min(3, m - 1));
    if (isSeat(N.id)){ tell(N.id, `${UNITS[t].name}: Firepower and Protection level ${Math.min(3, m - 1)} (the Mark ${ROMAN[m]} upgrade from your earlier game): +${Math.round((MARK_F[m] - 1)*100)}% attack and defense.`, 'good'); cue(N.id, 'research'); } } }
