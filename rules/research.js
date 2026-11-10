// Iron Meridian rules: research. No DOM, canvas, window, storage, audio or camera in this file (node tools/rules-lint.js checks it).
'use strict';
// ---------- research rules: every nation runs two projects at once, slot #1 (N.research) and slot #2 (N.research2), each {id, h, h0} or null.
// Both slots progress at full speed; a project's costs are paid when it starts; a project whose prerequisite is still running in the other slot
// waits until that one is done. Pure rules (no drawing): the UI asks researchWhy / canResearch and calls startResearch.
const R_SLOTS = ['research', 'research2'];
const rFree = N => !N.research ? 'research' : !N.research2 ? 'research2' : null;   // the free slot (slot #1 first), or null when both are busy
const rFreeN = N => R_SLOTS.reduce((c, k) => c + (N[k] ? 0 : 1), 0);   // how many slots are free
const rRunning = (N, id) => R_SLOTS.find(k => N[k] && N[k].id === id) || null;   // the slot running this project, or null
const rSlotNo = k => k === 'research2' ? 2 : 1;
// why nation n cannot start project id now ('' when it can)
function researchWhy(n, id){ const N = S.nations[n], T = TECH_BY[id];
  if (!T || !N || !N.alive) return 'Not available'; if (has(n, id)) return 'Researched'; { const k = rRunning(N, id); if (k) return `Running in slot #${rSlotNo(k)}`; }
  if (T.req && !has(n, T.req)){ const k = rRunning(N, T.req); return k ? `Waits for ${TECH_BY[T.req].name} (slot #${rSlotNo(k)})` : `Needs ${TECH_BY[T.req].name}`; }
  if (!rFree(N)) return 'Both slots busy';
  return hasC(N, techCost(T)) ? '' : `Needs ${missTxt(N, techCost(T))}`; }
function canResearch(n, id){ const N = S.nations[n], T = TECH_BY[id]; return !!T && N.alive && !!rFree(N) && !has(n, id) && !rRunning(N, id) && (!T.req || has(n, T.req)) && hasC(N, techCost(T)); }
// start project id in the free slot (paying its costs); returns false when it cannot start
function startResearch(n, id){ if (!canResearch(n, id)) return false; const N = S.nations[n], T = TECH_BY[id], k = rFree(N); payC(N, techCost(T));
  const h = Math.round(T.days*24*(docOf(n) ? docOf(n).res : 1)); N[k] = {id, h, h0:h};
  if (n === PLAYER){ (S.tut || (S.tut = {})).research = true; bump('rareRes', techCost(T).rare || 0); } return true; }
// one game hour of one slot: completion frees the slot
function researchSlotHour(N, k){ const R = N[k]; if (!R) return;
  if (--R.h <= 0){ const T = TECH_BY[R.id]; N[k] = null; if (!T) return; N.tech[T.id] = 1; N.tv = (N.tv || 0) + 1;
    if (N.id === PLAYER){ log(`Research complete: ${T.name}. ${T.desc}.`, 'good'); sfx('research'); } } }
// the hourly research step: both slots advance
function researchHour(N){ for (const k of R_SLOTS) researchSlotHour(N, k); }
// saves from before two slots held a queued project for slot #2 (N.rqueue): it starts now if it can (paying as usual), else it is dropped
function rqueueMigrate(){ for (const N of S.nations){ const q = N.rqueue; delete N.rqueue; delete N.rqWarn; if (q && TECH_BY[q] && canResearch(N.id, q)) startResearch(N.id, q); } }
