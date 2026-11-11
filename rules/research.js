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
// level 3 of Firepower and Protection generation 2 where the line has one; every level needs the level before it (levels are researched in order)
const rReqs = (nd, lv) => lv <= 1 ? nd.req : lv === 3 && nd.req3 ? [nd.req3] : [];
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
// saves from before two slots held a queued project for slot #2 (N.rqueue): it starts now if it can (paying as usual), else it is dropped
function rqueueMigrate(){ for (const N of S.nations){ const q = N.rqueue; delete N.rqueue; delete N.rqWarn; if (q && RN[q] && canResearch(N.id, q)) startResearch(N.id, q); } }
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
