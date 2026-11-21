// Iron Meridian: the rules without a browser (owner task 5, the proof that the rules stand on their own).
// Loads world.js, lines.js and the rules files in plain Node, starts a new world game, lets the AI play every nation (no seat is taken)
// for N game days and prints a short summary. No DOM, no canvas, no page: this is how a multiplayer server will run the rules.
//   node tools/headless.js                    30 days, seed 12345
//   node tools/headless.js --days 10 --seed 7
//   node tools/headless.js --seat 3           nation 3 is a seat (a person's nation) that gives no orders: the AI plays the others
//   node tools/headless.js --nations          the nations world (scenario world64, nations.js) instead of the classic 15-power world
//   node tools/headless.js --check            plays the same seed twice from scratch; exit 1 unless both summaries and state hashes are equal
// The state hash is for Node against Node only: Node and Chromium differ in the last digit of a few floats.
//
// The playtest harness (auto-test, 2026-11-21): opt-in flags; without them the tool runs and prints exactly as before.
//   --games N | --seeds a,b,c  all-computer games (the nations world unless --classic), --days each, --jobs J at once (child processes, default 2)
//   --invariants              the state checked after every game hour (cheap pass) and every game day (deep pass: relations, trade routes,
//                             references, a save/load round trip in a second copy of the rules; --rt D: every D days, 0 none). Each violation
//                             is reported once (type, nation, ids, game hour, details) with how many hours it was seen
//   --stats                   units built per type and nation (and never built), losses, kills and battle fire by type, share of the armies,
//                             wars (start, end, length), economy per nation per day, stocks piling up, idle hours per nation, ms per game day
//   --provoke K               every 10 days the harness makes K pairs of neighbouring computer nations at peace declare war (the computer never
//                             starts one, AI_STARTS_WARS), so there is fighting to measure. Uses the harness's own dice, never the rules'
//   --json <file>             the whole report as JSON;  --check (with the flags above): the first seed is also played with no observer and
//                             the state hashes must be equal (observation changes nothing and uses none of the rules' dice)
//   --selftest                faults put on purpose into copies of a saved game (a ship on land, NaN money, a never-ending timer, a bad
//                             reference...), then RULE MUTANTS: the rules files themselves broken one at a time, in memory (a ship spawned
//                             on land, a price taken ten times, the boarding / rearm / research timers stopped, an order accepted that does
//                             nothing, a force put in a far province, a field left out of the save or reset on load): every one must be
//                             flagged; exit 1 if one is not.  --nomutants: the state faults only
//   --scenarios               scripted mechanic checks on the real api (research, mobilizing, embark/disembark and their timers, movement over
//                             land and sea, convoys and blockades, diplomacy), then the --scenarios modes of tools/stack-duel.js (combat, ranged),
//                             tools/eco-check.js (economy, trade) and tools/rebels-sim.js (occupation). Each order is also checked for "an action
//                             that does nothing" (accepted, no state change, no reason) and for refusals that give no reason
// e.g. node tools/headless.js --games 5 --days 60 --invariants --stats --provoke 3 --jobs 3 --json /tmp/r.json
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] !== undefined ? +process.argv[i + 1] : d; };
const DAYS = arg('days', 30), SEED = arg('seed', 12345), SEAT = arg('seat', -1), CHECK = process.argv.includes('--check'), NATIONS_WORLD = process.argv.includes('--nations');

// the map data scripts set window.WORLD and window.LINES; in Node "window" is the global object and nothing else of a browser exists
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));

// the rules files, in the order the page loads them (its <script src="rules/x.js"> tags)
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn IM;';

const hash = s => { let h1 = 0x811c9dc5, h2 = 0x1b873593; for (let i = 0; i < s.length; i++){ const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 + c, 0x85ebca6b) ^ (h2 >>> 13); } return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0'); };

// one game in a fresh evaluation of the rules (nothing is shared between two runs but the read-only map data)
function play(seed, days){
  const IM = new Function(SRC)(), api = IM.api, events = {};
  for (const t of ['log', 'fxCapture', 'over']) IM.on(t, () => { events[t] = (events[t] || 0) + 1; });
  // no seats: the AI plays every nation. With --seat N nation N is a seat nobody plays: the AI leaves it alone and the rules address its dispatches to it
  if (NATIONS_WORLD) api.useScenario('world64');
  api.newGame(seed, 0, SEAT >= 0 ? [SEAT] : []); const S = api.S; S.started = true;
  const t0 = Date.now(); let hours = 0;
  while (hours < days*24 && !S.over){ for (let q = 0; q < api.BATTLE_Q; q++) api.tickQ(); hours++; }   // a game hour = four quarter-hour steps (battles resolve every 15 minutes)
  return {lines:summary(api, events, seed, days, NATIONS_WORLD), ms:Date.now() - t0, hours};
}
function summary(api, events, seed, days, nw){ const S = api.S, G = api.G;
  const prov = S.nations.map(() => 0); for (const o of S.owner) if (o >= 0 && o < prov.length) prov[o]++;
  const alive = S.nations.map((N, n) => n).filter(n => S.nations[n].alive !== false && prov[n] > 0);
  const wars = []; for (const k in S.rel){ const r = S.rel[k]; if (r && r.st === 'war') wars.push(k); }
  let units = 0; const perN = S.nations.map(() => 0);
  for (const a of S.armies){ let u = 0; if (a.u) for (const k in a.u) u += a.u[k] || 0; units += u; if (a.owner >= 0) perN[a.owner] += u; }
  const o = JSON.parse(api.saveJSON()); delete o.savedAt;
  return [
    `${nw ? 'nations world  ' : ''}seed ${seed}  day ${(S.hour/24).toFixed(S.hour % 24 ? 2 : 0)} of ${days}${S.over ? '  (game over)' : ''}  provinces ${G.P.length}`,
    `nations alive ${alive.length} of ${S.nations.length}`,
    'provinces per nation  ' + S.nations.map((N, n) => `${N.name} ${prov[n]}`).join(', '),
    `wars ${wars.length}` + (wars.length ? '  ' + wars.map(k => k.split(/[^0-9]+/).filter(Boolean).map(i => S.nations[+i] ? S.nations[+i].name : i).join(' v ')).join(', ') : ''),
    `units ${Math.round(units)} in ${S.armies.length} forces  ` + S.nations.map((N, n) => `${N.name} ${Math.round(perN[n])}`).filter((s, n) => perN[n] > 0).join(', ') + `, unaligned ${Math.round(units - perN.reduce((x, y) => x + y, 0))}`,
    `provinces captured ${events.fxCapture || 0}  ` + (SEAT >= 0 ? `dispatches to seat ${SEAT} (${S.nations[SEAT].name}) ${events.log || 0}  ` : '') + `dice state ${S.rs}`,
    `state hash ${hash(JSON.stringify(o))}`]; }

/* ==================================================================================================================================
   The playtest harness. Everything below runs only with its flags (or when tools/perf.js --watch asks for the watcher).
   ================================================================================================================================== */
// the same rules source, returning the rule helpers the observer reads as well (the rules are not changed: only what the evaluation returns)
const XN = ['count', 'groundN', 'shipsN', 'shipsOnly', 'ground', 'shipPlaceOk', 'navalCity', 'amphib', 'UNITS', 'UT', 'R_SLOTS', 'RN', 'RNODES', 'R_LEGACY', 'BUILD', 'MISSILES',
  'wingRange', 'dropRange', 'hexDist', 'stockCap', 'income', 'CK', 'GOODS', 'NEUTRAL', 'SEA', 'embarkH', 'landH', 'EMBARK_H', 'LAND_H', 'LAND_PORT_H', 'bdis', 'reqsOf', 'rOpenSteps', 'rCost', 'hasC', 'ucost',
  'LAND_MIN', 'trainH', 'unlocked', 'canMobilize', 'researchWhy', 'canResearch', 'embarkWhy', 'etaHours', 'addArmy', 'setRel', 'armyById', 'routeById', 'blockadeSet', 'raidSet', 'escortSet', 'trRefresh', 'trS',
  'trStatus', 'trState0', 'computeBlockade', 'stopsEta', 'legH', 'natPower', 'QUEUE_MAX', 'rLevel', 'has', 'buildCost', 'DOM_T', 'RANGE_KM', 'rangedOf', 'rangeOf', 'orderBombard', 'bombardInfo',
  'tradeIncome', 'RES_K', 'cmdList', 'removeEmpty', 'armyHP', 'effHP', 'rng', 'warsOf0', 'portOk', 'landOk', 'canEnter', 'moraleOf', 'unrestOf', 'popOf', 'rPack', 'canBuildHere', 'linkCheck',
  'frontage', 'atMove', 'airCheck', 'canDrop', 'rNextLv', 'rOpen', 'nextLvl', 'canRecruit', 'queueWhy', 'warTerms', 'friendly', 'trSpot', 'trDetour', 'armyXY', 'kmBetween', 'seaIndex'];
const XRET = '\nreturn {IM, X:{' + XN.map(n => `${n}: typeof ${n} === 'undefined' ? undefined : ${n}`).join(', ') + '}};', SRCX = SRC.replace(/\nreturn IM;$/, XRET);
// a rule mutant (--selftest): the same source with one text in one rules file replaced, in memory only (the files on disk are not touched).
// n: how many times the text was found (it must be 1: a rule that changed since the mutant was written shows as "mutation point not found")
function mutSrc(file, from, to){ let n = 0; const src = "'use strict';\n" + FILES.map(f => { let t = fs.readFileSync(path.join(ROOT, f), 'utf8'); if (f === file){ n = t.split(from).length - 1; t = t.replace(from, () => to); } return t; }).join('\n') + XRET;
  return {n, srcx:src}; }
const has = k => process.argv.includes('--' + k), sarg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d; };
const MULTI = ['games', 'seeds', 'invariants', 'stats', 'json', 'provoke'].some(has);

// relations read from the table only (rel() and atWar() of the rules create a missing entry: the observer never calls them)
const rk = (a, b) => a < b ? a + ',' + b : b + ',' + a;
const relSt = (S, a, b) => { if (a === b) return 'self'; if (a < 0 || b < 0) return a === -2 || b === -2 ? 'none' : 'war'; const r = S.rel[rk(a, b)]; return r ? r.st : 'peace'; };
const friendlyRO = (S, a, b) => a === b || (a >= 0 && b >= 0 && (relSt(S, a, b) === 'pass' || relSt(S, a, b) === 'ally'));
const REL_OK = new Set(['peace', 'war', 'ally', 'pass', 'nap', 'truce']);
const STUCK_H = 48, IDLE_CASH = 300;
const short = e => String(e && e.stack || e).split('\n').slice(0, 6).map(s => s.trim()).join(' | ');
// CPU time of this thread in ms (what the rules and the observers cost, whatever else the machine is doing); the wall clock where there is none
const cpu = () => { const u = process.threadCpuUsage ? process.threadCpuUsage() : process.cpuUsage(); return (u.user + u.system)/1000; };

// The watcher: reads the state after every game hour (W.hour) and game day (W.day). R: a rules evaluation of SRCX ({IM, X}).
// opts: inv (the invariants), stats (the statistics), rtEvery (days between save/load round trips; 0 none), probe (selftest only: run inside the pass)
function makeWatch(R, opts = {}){
  const IM = R.IM, api = IM.api, X = R.X, UT = X.UT, UNITS = X.UNITS, AIR = UT.filter(t => UNITS[t].cls === 'air'), INV = !!opts.inv, STATS = !!opts.stats, RT = opts.rtEvery == null ? 1 : opts.rtEvery;
  const V = new Map(); let overflow = 0, on = true, R2 = null;
  const W = {wms:0, rtms:0, rt:0, part:{invHour:0, statHour:0, invDay:0, statDay:0}};
  const S_ = () => api.S, G_ = () => api.G;
  const nm = n => { const S = S_(); return n == null ? '' : n === -1 ? 'Independent' : n === -2 ? 'Sea' : S.nations[n] ? S.nations[n].name : String(n); };
  // a violation, once per (type, nation, ids): its first hour, last hour and how many passes saw it
  function flag(type, n, ids, d){ const S = S_(), key = type + '|' + n + '|' + ids.join(','), v = V.get(key); if (v){ v.k++; v.last = S.hour; return; }
    if (V.size >= 3000){ overflow++; return; } V.set(key, {type, n, nation:nm(n), ids, h:S.hour, day:+(S.hour/24).toFixed(2), last:S.hour, k:1, d:typeof d === 'function' ? d() : d || ''}); }
  W.flag = flag;
  // what the hour before looked like
  const prevAt = new Map(), prevTo = new Map(), prevOwn = new Map(), sig = new Map(), landT = new Map(), seaIdle = new Map(), flySeen = new WeakSet(), qHead = new Map(), consPrev = new Map(), resPrev = new Map(), escH = new Map(),
    embT = new Map(), cdT = new Map(), closedT = new Map(), flyPrev = new Set(); let lastH = null;
  function remember(){ const S = S_();
    prevAt.clear(); prevTo.clear(); prevOwn.clear(); flyPrev.clear(); for (const a of S.armies){ prevAt.set(a.id, a.at); prevTo.set(a.id, a.to); prevOwn.set(a.id, S.owner[a.at]); if (a.fly) flyPrev.add(a.id); }
    const q0 = new Map(qHead); qHead.clear(); for (let p = 0; p < S.queue.length; p++){ const q = S.queue[p]; if (q && q.length){ const pr = q0.get(p); qHead.set(p, {it:q[0], h:q[0].h, o:S.owner[p], since:pr && pr.it === q[0] && pr.h === q[0].h ? pr.since : S.hour}); } } }

  // ---- the cheap pass, every game hour
  function invHour(){ const S = S_(), G = G_(), NNa = S.nations.length;
    const okOwner = o => o === -1 || (Number.isInteger(o) && o >= 0 && o < NNa);
    // t within three legs of s (a force moves at most a leg or two in an hour)
    const near3 = (s, t) => { const A = G.P[s]; if (!A || s === t || A.nb.has(t)) return true; for (const u of A.nbs){ const U = G.P[u]; if (U.nb.has(t)) return true; for (const v of U.nbs) if (G.P[v].nb.has(t)) return true; } return false; };   // (nb: a Map of neighbours, nbs: the list)
    // where a ship may be, written here from the decision (open sea, or a coastal city: its port), not read from the rules' own shipPlaceOk, so a
    // rule that wrongly lets a ship onto land is caught even when the broken rule is that helper itself
    const shipOk = p => { const P = G.P[p]; return !!P && (P.sea || (!!P.coast && !!P.city)); };
    for (const a of S.armies){ const id = a.id, o = a.owner;
      if (!okOwner(o)) flag('invalid-owner', o, [id], `force ${id} owner ${o}`);
      else if (o >= 0 && !S.nations[o].alive && X.count(a) > 0) flag('force-of-dead-nation', o, [id], () => `force ${id} of fallen ${nm(o)} still has ${X.count(a)} units at ${G.P[a.at] ? G.P[a.at].name : a.at}`);
      if (!G.P[a.at]){ flag('invalid-ref', o, [id], `force ${id} stands in province ${a.at}, which does not exist`); continue; }
      if (a.to !== null && (!G.P[a.to] || !G.P[a.at].nb.has(a.to))) flag('invalid-ref', o, [id, 'leg'], `force ${id} on a leg ${a.at} -> ${a.to}, not neighbours`);
      let n = 0; for (let i = 0; i < UT.length; i++){ const t = UT[i], v = a.u[t]; if (v === 0) { if (a.w[t] !== 0 && a.w[t] != null && !(Math.abs(a.w[t]) < 1e-6)) flag('bad-wounds', o, [id, t], `force ${id} ${t}: 0 units, wounds ${a.w[t]}`); continue; }
        if (v === undefined) continue; if (!Number.isFinite(v) || v < 0 || v !== Math.round(v)) flag('bad-unit-count', o, [id, t], `force ${id} ${t} = ${v}`); else n += v;
        const w = a.w ? a.w[t] : 0; if (w != null && (!Number.isFinite(w) || w < -1e-6 || w > v*UNITS[t].hp + 1e-3)) flag('bad-wounds', o, [id, t], `force ${id} ${t}: ${v} units, wounds ${w}`); }
      if (a.m != null && (!Number.isFinite(a.m) || a.m < -1e-6 || a.m > 120)) flag('bad-morale', o, [id], `force ${id} morale ${a.m}`);
      if (!n && !(a.air && a.air.pend && Object.values(a.air.pend).some(v => v > 0))) flag('empty-force', o, [id], `force ${id} with no units still listed at ${G.P[a.at].name}`);
      const P = G.P[a.at], sh = X.shipsN(a), gr = X.ground(a);
      if (sh > 0 && !P.sea && (!X.shipPlaceOk(a.at) || !shipOk(a.at))) flag('ship-on-land', o, [id], () => `${sh} ships of ${nm(o)} in ${P.name}, land that is not a port city`);
      if (sh > 0 && a.to !== null && G.P[a.to] && !G.P[a.to].sea && (!X.shipPlaceOk(a.to) || !shipOk(a.to))) flag('ship-on-land', o, [id, 'leg'], () => `ships of ${nm(o)} sailing into ${G.P[a.to].name}, land that is not a port city`);
      // aircraft: in wings only, a wing at its base unless it flies, missions within range
      let airN = 0; for (let i = 0; i < AIR.length; i++){ const v = a.u[AIR[i]]; if (v > 0) airN += v; }
      if (airN && !a.air) flag('air-outside-wing', o, [id], () => `${airN} aircraft in force ${id} (not a wing) at ${P.name}`);
      if (a.air){ if (gr || sh) flag('mixed-wing', o, [id], `wing ${id} also holds ground units or ships`);
        const b = a.air.base; if (!G.P[b]) flag('invalid-ref', o, [id, 'base'], `wing ${id} base ${b} does not exist`);
        else { if (!a.fly && a.air.car == null && a.at !== b) flag('wing-not-at-base', o, [id], () => `wing ${id} at ${P.name} but its base is ${G.P[b].name}`);
          const f = a.fly; if (f && !flySeen.has(f)){ flySeen.add(f);
            if (!G.P[f.tgt]) flag('invalid-ref', o, [id, 'tgt'], `wing ${id} flies to province ${f.tgt}, which does not exist`);
            else if (f.kind !== 'drop'){ const b0 = a.air.car != null && G.P[a.at] ? a.at : b, d = X.hexDist(G.P[b0].cc, G.P[f.tgt].cc), r = X.wingRange(a); if (d > r + 1e-9) flag('air-out-of-range', o, [id], () => `${f.kind} mission to ${G.P[f.tgt].name}: ${d.toFixed(1)} hexes from base ${G.P[b0].name}, range ${r}`); } } }   // (a carrier wing: from where it took off, a.at; its base follows the carrier's next stop)
        const cd = a.air.cd; if (cd != null && (!Number.isFinite(cd) || cd < 0 || cd > 72)) flag('bad-timer', o, [id, 'air.cd'], `wing ${id} rearm timer ${cd}`); }
      if (a.fly && a.fly.kind === 'drop' && !flySeen.has(a.fly)){ const f = a.fly; flySeen.add(f); if (X.dropRange && G.P[f.from] && G.P[f.tgt]){ const d = X.hexDist(G.P[f.from].cc, G.P[f.tgt].cc), r = X.dropRange(a); if (d > r + 1e-9) flag('air-out-of-range', o, [id, 'drop'], `air drop ${d.toFixed(1)} hexes, reach ${r}`); } }
      // ground forces board ships only at a naval port of their own or a friend's (Marines alone anywhere) and come ashore at a naval city
      const pa = prevAt.get(id), pt = prevTo.get(id);
      if (gr && !a.air){
        const ow = prevOwn.has(id) ? prevOwn.get(id) : S.owner[a.at];   // (the port's holder when the hour began: it may be taken later in the same hour)
        if (a.to !== null && pt === null && !P.sea && G.P[a.to] && G.P[a.to].sea && !(X.navalCity(a.at) && (ow === o || S.owner[a.at] === o || friendlyRO(S, o, ow))) && !X.amphib(a))
          flag('embark-without-port', o, [id], () => `force ${id} sets sail from ${P.name}, not a naval port of ${nm(o)} or a friend's`);
        if (pa != null && pa !== a.at && G.P[pa] && !G.P[pa].sea && P.sea && !G.P[pa].nb.has(a.at)) flag('teleported-to-sea', o, [id], () => `force ${id} moved from land ${G.P[pa].name} to sea ${P.name}, not a neighbour`);
        if (pa != null && pa !== a.at && G.P[pa] && G.P[pa].sea && !P.sea && !X.navalCity(a.at) && !X.amphib(a) && !a.oldLand) flag('landed-off-port', o, [id], () => `force ${id} came ashore at ${P.name}, not a naval city`);
        if (P.sea && a.land > 0) flag('landing-at-sea', o, [id], `force ${id} at sea in ${P.name} with a landing timer ${a.land}`);
        if (P.sea && a.emb != null) flag('embark-timer-at-sea', o, [id], `force ${id} at sea with a boarding timer ${a.emb}`);
        if (P.sea && a.to === null && !a.path.length && !a.sail){ const h0 = seaIdle.get(id) ?? S.hour; seaIdle.set(id, h0); if (S.hour - h0 >= 72) flag('troops-idle-at-sea', o, [id], () => `force ${id} (${X.groundN(a)} ground units) idle at sea in ${P.name} since hour ${h0}`); } else seaIdle.delete(id); }
      // a force (not a wing, not a para drop) that moved further in one hour than three legs: a jump to a province it could not have reached.
      // A force sent home from foreign land (evict, on peace or a territory sale) lands in its own land: that is allowed
      if (!a.air && pa != null && pa !== a.at && G.P[pa] && !flyPrev.has(id) && !a.fly && !near3(pa, a.at) && !(pt != null && near3(pt, a.at)) && !(S.owner[a.at] === o && prevOwn.get(id) !== o))
        flag('teleported', o, [id, pa, a.at], () => `force ${id} of ${nm(o)} went from ${G.P[pa].name} to ${P.name} in one hour, more than three legs apart`);
      // a force (not a wing) in the land of a nation it is neither at war with nor allowed in (ally, passage) for 2 hours: the rules evict such
      // forces (rules/diplomacy.js evict) and never let one walk in (canEnter)
      if (!a.air && o >= 0 && !P.sea){ const ho = S.owner[a.at]; if (ho >= 0 && ho !== o && relSt(S, o, ho) !== 'war' && !friendlyRO(S, o, ho)){ const h0 = closedT.get(id) ?? S.hour; closedT.set(id, h0);
          if (S.hour - h0 >= 2) flag('force-in-closed-land', o, [id, a.at], () => `force ${id} of ${nm(o)} (${X.count(a)} units) in ${P.name}, ${nm(ho)}'s land (${relSt(S, o, ho)}), since hour ${h0}`); } else closedT.delete(id); } else closedT.delete(id);
      // the timers of a force: boarding, landing, delay, leg progress
      if (a.emb != null && (!Number.isFinite(a.emb) || a.emb < 0 || a.emb > X.embarkH(a)*1.001 + 1e-6)) flag('bad-timer', o, [id, 'emb'], () => `force ${id} boarding timer ${a.emb} (boarding takes ${X.embarkH(a)} h)`);
      if (a.land != null && a.land !== 0 && (!Number.isFinite(a.land) || a.land < 0 || a.land > Math.max(X.LAND_H || 0.75, X.LAND_PORT_H || 0.75)*2 + 1e-6)) flag('bad-timer', o, [id, 'land'], `force ${id} landing timer ${a.land}`);
      if (a.land > 0){ const L = landT.get(id); if (L && L.v === a.land){ if (S.hour - L.h >= 3) flag('bad-timer', o, [id, 'land-stuck'], `force ${id} landing timer stuck at ${a.land} since hour ${L.h}`); } else landT.set(id, {v:a.land, h:S.hour}); } else landT.delete(id);
      // a boarding timer (the embark "cooldown": 45 minutes) that has not moved for 3 hours outside a battle, and a wing's rearm timer that has not
      // moved for 2 hours on the ground: timers that never finish
      if (a.emb != null){ const E = embT.get(id); if (E && E.v === a.emb){ if (S.hour - E.h >= 3 && !S.battles.includes(a.at)) flag('bad-timer', o, [id, 'emb-stuck'], `force ${id} boarding timer stuck at ${a.emb} h since hour ${E.h} (boarding takes ${X.embarkH(a)} h)`); } else embT.set(id, {v:a.emb, h:S.hour}); } else embT.delete(id);
      // the full boarding and landing times of a force that is boarding or landing: 45 minutes, cut by upgrades, never under LAND_MIN (15 minutes)
      if (a.emb != null || a.land > 0){ const f0 = X.LAND_MIN ?? 0.25, e = X.embarkH(a), l = X.landH(a, a.at); if (!(e >= f0 - 1e-9 && e <= 0.75 + 1e-9 && l >= f0 - 1e-9 && l <= 0.75 + 1e-9)) flag('bad-timer', o, [id, 'floor'], `force ${id}: boarding takes ${e} h, landing ${l} h (45 minutes, never under ${f0*60} minutes)`); }
      if (a.air && !a.fly && a.air.cd > 0){ const C = cdT.get(id); if (C && C.v === a.air.cd){ if (S.hour - C.h >= 2) flag('bad-timer', o, [id, 'cd-stuck'], `wing ${id} rearm timer stuck at ${a.air.cd} h since hour ${C.h}`); } else cdT.set(id, {v:a.air.cd, h:S.hour}); } else cdT.delete(id);
      if (a.delay != null && (!Number.isFinite(a.delay) || a.delay < 0 || a.delay > 24*30)) flag('bad-timer', o, [id, 'delay'], `force ${id} delay ${a.delay}`);
      if (a.to !== null && (!Number.isFinite(a.t) || a.t < -1e-9 || a.t > 1.5)) flag('bad-timer', o, [id, 'leg'], `force ${id} leg progress ${a.t}`);
      // stuck: an order (a route, a leg, a walk) and no progress for STUCK_H hours, outside a battle
      if (!a.air && (a.path.length || a.to !== null || a.sail)){ const s = a.at + '|' + a.to + '|' + (+a.t || 0).toFixed(5) + '|' + a.path.length + '|' + (a.sail ? (+a.sail.t || 0).toFixed(5) : '') + '|' + (a.emb ?? '') + '|' + (a.land || 0);
        const g = sig.get(id); if (g && g.s === s){ if (S.hour - g.h >= STUCK_H && !S.battles.includes(a.at)) flag('stuck-force', o, [id], () => { const nx = a.to ?? a.path[0], ow = nx != null && G.P[nx] ? S.owner[nx] : null;
            const others = [...new Set(S.armies.filter(b => b.at === a.at && b.to === null && !b.air && b.owner !== o && b.owner !== S.owner[a.at] && X.count(b)).map(b => b.owner))].map(nm);
            const hold = S.owner[a.at], why = a.delay > 0 ? 'waiting (delay)' : a.land > 0 ? 'landing' : ow != null && !G.P[nx].sea && ow >= 0 && ow !== o && relSt(S, o, ow) !== 'war' && !friendlyRO(S, o, ow) ? `next province ${G.P[nx].name} is ${nm(ow)}'s, closed to it`
              : !P.sea && hold !== o && relSt(S, o, hold) === 'war' ? `standing in ${nm(hold)} land it has not taken${others.length ? ', with forces of ' + others.join(', ') + ' there too (one taker at a time)' : ''}${a.forced ? '' : ' (not ordered on until it is taken: canProceed)'}`
              : !P.sea && hold !== o ? `standing in ${nm(hold)} land (${relSt(S, o, hold)})${others.length ? ' with forces of ' + others.join(', ') : ''}` : 'no reason found';
            return `force ${id} (${X.count(a)} units) at ${P.name}, ${a.path.length} legs to go, no progress for ${S.hour - g.h} h: ${why}`; }); }
        else sig.set(id, {s, h:S.hour}); } else sig.delete(id);
      if (a.escort != null){ if (!X.routeById(a.escort)){ const h0 = escH.get(id) ?? S.hour; escH.set(id, h0); if (S.hour - h0 > 3) flag('invalid-ref', o, [id, 'escort'], `fleet ${id} escorts route ${a.escort}, which is gone`); } else escH.delete(id); }
      if (a.blk && !X.shipsOnly(a)) flag('convoy-state', o, [id, 'blk'], `force ${id} blockades but is not a fleet`);
      if (a.raid && a.raid.r != null && !X.routeById(a.raid.r)) flag('convoy-state', o, [id, 'raid'], `fleet ${id} raids route ${a.raid.r}, which is gone`); }
    // nations: stocks, research slots, capital, land
    const land = new Int32Array(NNa); for (let p = 0; p < S.owner.length; p++){ const o = S.owner[p]; if (G.P[p].sea){ if (o !== -2) flag('bad-owner', o, [p], `sea zone ${G.P[p].name} owned by ${o}`); continue; }
      if (!okOwner(o)){ flag('bad-owner', o, [p], `province ${G.P[p].name} owner ${o}`); continue; } if (o >= 0) land[o]++; }
    for (const N of S.nations){ const n = N.id;
      for (const k of X.CK){ const v = N[k]; if (typeof v !== 'number' || !Number.isFinite(v)) flag('bad-resource', n, [k], `${N.name} ${k} = ${v}`); else if (v < -1e-6) flag('bad-resource', n, [k, 'neg'], `${N.name} ${k} = ${v}`); }
      if (N.alive && !land[n]) flag('alive-without-land', n, [], `${N.name} is alive with no province`);
      if (!N.alive && land[n]) flag('dead-nation-owns-land', n, [], `fallen ${N.name} still owns ${land[n]} provinces`);
      if (N.alive && S.owner[N.capital] !== n) flag('capital-not-owned', n, [N.capital], () => `${N.name}'s capital ${G.P[N.capital] ? G.P[N.capital].name : N.capital} is held by ${nm(S.owner[N.capital])}`);
      for (const s of X.R_SLOTS){ const R0 = N[s], key = n + s; if (!R0){ resPrev.delete(key); continue; }
        if (!X.RN[R0.id] && !(X.R_LEGACY && X.R_LEGACY[R0.id])) flag('invalid-ref', n, [s, R0.id], `${N.name} researches unknown node ${R0.id}`);
        if (!Number.isFinite(R0.h) || R0.h <= 0 || !Number.isFinite(R0.h0) || R0.h > R0.h0 + 1e-9 || R0.h0 > 24*400) flag('bad-timer', n, [s], `${N.name} research ${R0.id}: ${R0.h} of ${R0.h0} h`);
        const pr = resPrev.get(key); if (N.alive && pr && pr.R === R0 && R0.h !== pr.h - 1) flag('research-not-progressing', n, [s, R0.id], `${N.name} research ${R0.id}: ${pr.h} h left an hour ago, ${R0.h} now`); resPrev.set(key, {R:R0, h:R0.h}); } }
    // provinces: training queues (mobilizing), construction
    for (let p = 0; p < S.queue.length; p++){ const q = S.queue[p], o = S.owner[p];
      if (q && q.length){ if (o < 0) flag('queue-of-nobody', o, [p], `${G.P[p].name} (owner ${o}) still has ${q.length} units in training`);
        for (const it of q){ if (!(it.msl ? X.MISSILES[it.t] : UNITS[it.t])) flag('invalid-ref', o, [p, it.t], `${G.P[p].name} trains unknown ${it.t}`);
          if (!Number.isFinite(it.h) || it.h < 1 - 1e-9 || !Number.isFinite(it.h0) || it.h > it.h0 + 1e-9 || it.h0 > 24*60) flag('bad-timer', o, [p, 'queue'], `${G.P[p].name} ${it.t} training ${it.h} of ${it.h0} h`); }
        const pr = qHead.get(p); if (pr && pr.it === q[0] && pr.h === q[0].h && pr.o === o && S.hour - pr.since >= 24){ const reqs = q[0].msl ? [{b:'silo'}] : (X.reqsOf ? X.reqsOf(q[0].t) : []);
          if (!reqs.some(r => X.bdis(p, r.b))) flag('production-stalled', o, [p], `${G.P[p].name}: ${q[0].t} has stayed at ${q[0].h} h for ${S.hour - pr.since} h`); } }
      const c = S.cons[p]; if (c){ if (o < 0) flag('construction-of-nobody', o, [p], `${G.P[p].name} (owner ${o}) still builds ${c.k}`);
        if (!X.BUILD[c.k]) flag('invalid-ref', o, [p, c.k], `${G.P[p].name} builds unknown ${c.k}`);
        else if (!(c.lvl >= 1 && c.lvl <= X.BUILD[c.k].max)) flag('bad-building-level', o, [p, c.k], `${G.P[p].name} builds ${c.k} level ${c.lvl}`);
        if (!Number.isFinite(c.h) || c.h <= 0 || !Number.isFinite(c.h0) || c.h > c.h0 + 1e-9 || c.h0 > 24*120) flag('bad-timer', o, [p, 'cons'], `${G.P[p].name} ${c.k}: ${c.h} of ${c.h0} h`);
        const pc = consPrev.get(p); if (pc && pc.c === c && c.h !== pc.h - 1) flag('construction-not-progressing', o, [p, c.k], `${G.P[p].name} ${c.k}: ${pc.h} h left an hour ago, ${c.h} now`); consPrev.set(p, {c, h:c.h}); } else consPrev.delete(p); } }

  // ---- the deep pass, every game day
  function invDay(){ const S = S_(), G = G_(), NNa = S.nations.length;
    for (const k in S.rel){ const r = S.rel[k], m = /^(\d+),(\d+)$/.exec(k);
      if (!m || +m[1] >= +m[2] || +m[2] >= NNa){ flag('relation-table', -1, [k], `relation key "${k}"`); continue; } const a = +m[1], b = +m[2];
      if (!r || !REL_OK.has(r.st)){ flag('relation-table', a, [k, r && r.st], `relation ${k} state ${r && r.st}`); continue; }
      if (r.since != null && (!Number.isFinite(r.since) || r.since > S.hour)) flag('relation-table', a, [k, 'since'], `relation ${k} since ${r.since} (hour ${S.hour})`);
      if (r.until != null && (!Number.isFinite(r.until) || r.until < S.hour)) flag('relation-table', a, [k, 'until'], `relation ${k} (${r.st}) until hour ${r.until}, now ${S.hour}: a timer that has run out and is still there`);
      if (r.st === 'war' && (!S.nations[a].alive || !S.nations[b].alive)) flag('war-with-fallen-nation', a, [k], () => `war ${nm(a)} v ${nm(b)} goes on after ${!S.nations[a].alive ? nm(a) : nm(b)} fell`);
      if (r.st === 'war' && r.by != null && r.by !== a && r.by !== b) flag('relation-table', a, [k, 'by'], `war ${k} started by ${r.by}`); }
    for (const d of S.decl || []) if (!(d.by >= 0 && d.by < NNa && d.to >= 0 && d.to < NNa)) flag('relation-table', d.by, ['decl'], `declaration ${JSON.stringify(d)}`);
    for (const a in S.mem) for (const b in S.mem[a]){ const v = S.mem[a][b]; if (!Number.isFinite(v) || v < -100 || v > 100) flag('relation-table', +a, ['mem', b], `opinion memory ${a}->${b} = ${v}`); }
    if (S.trade && Array.isArray(S.trade.routes)){ const ids = new Set();
      for (const r of S.trade.routes){ if (ids.has(r.id)) flag('convoy-state', r.a, [r.id, 'dup'], `trade route id ${r.id} twice`); ids.add(r.id);
        if (!(r.a >= 0 && r.a < NNa) || !(r.b === -1 || (r.b >= 0 && r.b < NNa))){ flag('convoy-state', r.a, [r.id], `route ${r.id} between ${r.a} and ${r.b}`); continue; }
        if (!S.nations[r.a].alive || (r.b >= 0 && !S.nations[r.b].alive)) flag('convoy-state', r.a, [r.id, 'dead'], () => `route ${r.id} ${nm(r.a)}-${nm(r.b)} runs with a fallen partner`);
        if (r.b >= 0 && relSt(S, r.a, r.b) === 'war') flag('convoy-state', r.a, [r.id, 'war'], () => `route ${r.id} ${nm(r.a)}-${nm(r.b)} still runs between enemies`);
        if (!Number.isFinite(r.f) || r.f < 0 || r.f > 1) flag('convoy-state', r.a, [r.id, 'f'], `route ${r.id} flow ${r.f}`);
        if (r.kind !== 'sea' && r.kind !== 'land') flag('convoy-state', r.a, [r.id, 'kind'], `route ${r.id} kind ${r.kind}`);
        if (!Array.isArray(r.path) || r.path.some(v => !G.P[v])) flag('convoy-state', r.a, [r.id, 'path'], `route ${r.id} path has a province that does not exist`);
        if (r.pause != null && r.pause !== r.a && r.pause !== r.b) flag('convoy-state', r.a, [r.id, 'pause'], `route ${r.id} paused by ${r.pause}, not a partner`); } }
    for (const a of S.armies){ for (const t in a.u) if (!UNITS[t] && a.u[t]) flag('invalid-ref', a.owner, [a.id, t], `force ${a.id} holds unknown unit type ${t}`);
      if (a.cmd != null){ const c = (S.cmds || []).find(x => x.id === a.cmd); if (!c || !c.alive || c.army !== a.id) flag('invalid-ref', a.owner, [a.id, 'cmd'], `force ${a.id} has commander ${a.cmd}, ${!c ? 'unknown' : !c.alive ? 'dead' : 'assigned to force ' + c.army}`); }
      if (a.air && a.air.car != null){ const cv = X.armyById(a.air.car); if (!cv || !(cv.u.carr > 0) || cv.owner !== a.owner) flag('invalid-ref', a.owner, [a.id, 'car'], `wing ${a.id} on carrier ${a.air.car}, which is gone`); }
      if (a.join != null && !X.armyById(a.join)) flag('invalid-ref', a.owner, [a.id, 'join'], `force ${a.id} joins force ${a.join}, which is gone`); }
    for (const c of S.cmds || []) if (c.alive && c.army != null){ const a = X.armyById(c.army); if (!a || a.cmd !== c.id) flag('invalid-ref', c.owner, ['cmd', c.id], `commander ${c.id} leads force ${c.army}, which ${a ? 'has another commander' : 'is gone'}`); }
    for (let p = 0; p < S.bld.length; p++){ const b = S.bld[p]; if (!b) continue; for (const k in b){ const v = b[k]; if (!v) continue; if (!X.BUILD[k]) flag('invalid-ref', S.owner[p], [p, k], `${G.P[p].name} has unknown building ${k}`); else if (!Number.isInteger(v) || v < 0 || v > X.BUILD[k].max) flag('bad-building-level', S.owner[p], [p, k], `${G.P[p].name} ${k} level ${v}`); } }
    // save and load: what the game saves must load into a fresh copy of the rules and save again the same
    if (RT > 0 && Math.round(S.hour/24) % RT === 0){ const t0 = cpu(); try { const s1 = api.saveJSON(); if (!R2) R2 = new Function(opts.srcx || SRCX)();
        const ok = R2.IM.api.restore(JSON.parse(s1)); if (!ok) flag('save-load', -1, ['restore'], 'the saved game did not load: ' + (R2.IM.api.restore.why || 'no reason'));
        else { const s2 = R2.IM.api.saveJSON(), dk = new Set(); if (s2 !== s1){ const A = JSON.parse(s1), B = JSON.parse(s2); for (const k of new Set([...Object.keys(A), ...Object.keys(B)])){ const d = jsonDiff(A[k], B[k], k); if (!d.length) continue;
              const empty = v => v != null && typeof v === 'object' && !Object.keys(v).length;   // (a field a load adds empty: harmless, reported apart)
              if (A[k] === undefined && empty(B[k])) flag('save-load-adds-empty', -1, [k], `a load adds an empty ${k} that the save did not have`);
              else flag('save-load', -1, ['diff', k], 'save, load, save gives another save: ' + d.slice(0, 3).join('; ')); dk.add(k); } }
          // the game as loaded against the game as it was: a field the save leaves out (or a load resets) and the rules then fill with a default
          // saves the same twice over, so only this comparison sees it. S.battles is saved empty on purpose (rules/tick.js makes it again every battle step)
          const L = JSON.parse(JSON.stringify(S)), M = JSON.parse(JSON.stringify(R2.IM.api.S));
          for (const k of new Set([...Object.keys(L), ...Object.keys(M)])){ if (k === 'battles' || dk.has(k)) continue; const d = jsonDiff(L[k], M[k], k, [], 2e-3); if (!d.length) continue;
            if (L[k] === undefined && M[k] != null && typeof M[k] === 'object' && !Object.keys(M[k]).length) continue;   // (an empty field a load adds: save-load-adds-empty)
            flag('save-load', -1, ['live', k], 'the game as loaded differs from the game that was saved: ' + d.slice(0, 3).join('; ')); } } }
      catch (e){ flag('save-load', -1, ['throw'], 'save/load threw: ' + short(e)); } W.rtms += cpu() - t0; W.rt++; } }

  // ---- statistics
  const st = W.st = {strikes:{}, adLost:{}, ranged:{}, built:{}, missiles:{}, lost:{}, kills:{}, killsT:{}, lostT:{}, fireT:{}, unitHours:{}, cancelled:0, wars:[], eco:[], pile:{}, idle:{}, shareSum:{}, powSum:{}, shareDays:0, couldResearch:{}};
  let cens = null; const warOpen = new Map(), bat = new Map(), bIdx = {k:-1, m:null};
  const bump = (o, a, b, v = 1) => { const x = o[a] || (o[a] = {}); x[b] = (x[b] || 0) + v; };
  const census = () => { const S = S_(), c = S.nations.map(() => new Float64Array(UT.length)); for (const a of S.armies){ if (a.owner < 0 || !c[a.owner]) continue; const r = c[a.owner];
      for (let i = 0; i < UT.length; i++){ const v = a.u[UT[i]]; if (v > 0) r[i] += v; } if (a.air && a.air.pend) for (const t in a.air.pend){ const i = UT.indexOf(t); if (i >= 0) r[i] += a.air.pend[t] || 0; } } return c; };
  // kills and fire in battles, from the rules' own battle record (S.bt[p].s[owner].lost) as each battle step ends; this handler only reads
  IM.on('fxBattle', (p, owners) => { if (!on || !STATS) return; const S = S_(), B = S.bt && S.bt[p]; if (!B) return; const key = p + ':' + B.h0, rec = bat.get(key) || bat.set(key, {}).get(key);
    const qk = S.hour*8 + (S.q || 0); if (bIdx.k !== qk){ bIdx.k = qk; bIdx.m = new Map(); for (const a of S.armies) if (a.to === null && !a.fly && !a.air){ const l = bIdx.m.get(a.at); if (l) l.push(a); else bIdx.m.set(a.at, [a]); } }
    const list = (bIdx.m.get(p) || []).filter(a => owners.includes(a.owner));
    const wsum = a => { let ws = 0; for (const t of UT) if (a.u[t] > 0) ws += a.u[t]*(UNITS[t].atk || 0.1); return ws; };
    for (const a of list){ const f = a._dealt0 || 0, ws = wsum(a); if (!(f > 0) || !ws) continue; for (const t of UT) if (a.u[t] > 0) st.fireT[t] = (st.fireT[t] || 0) + f*a.u[t]*(UNITS[t].atk || 0.1)/ws; }
    for (const o of owners){ const s = B.s[o]; if (!s) continue; const r = rec[o] || (rec[o] = {}); let d = 0;
      for (const t in s.lost){ const k = (s.lost[t] || 0) - (r[t] || 0); if (k > 0){ d += k; st.lostT[t] = (st.lostT[t] || 0) + k; } r[t] = s.lost[t]; }
      if (!d) continue; const foes = list.filter(b => b.owner !== o && relSt(S, b.owner, o) === 'war'), tot = foes.reduce((s0, b) => s0 + (b._dealt0 || 0), 0); if (!(tot > 0)) continue;
      for (const b of foes){ const sh = (b._dealt0 || 0)/tot, ws = wsum(b); if (!sh) continue; if (b.owner >= 0) st.kills[b.owner] = (st.kills[b.owner] || 0) + d*sh;
        if (ws) for (const t of UT) if (b.u[t] > 0) st.killsT[t] = (st.killsT[t] || 0) + d*sh*b.u[t]*(UNITS[t].atk || 0.1)/ws; } }
    if (bat.size > 4000) bat.clear(); });
  IM.on('fxStrike', e => { if (!on || !STATS || !e || !e.a) return; const x = st.strikes[e.T] || (st.strikes[e.T] = {n:0, dealt:0, killed:0}); x.n++; x.dealt += +e.dealt || 0; x.killed += +e.killed || 0; });
  IM.on('fxAD', e => { if (!on || !STATS || !e || !e.a) return; const t = Object.keys(e.a.u).find(k => e.a.u[k] > 0) || '?'; st.adLost[t] = (st.adLost[t] || 0) + (+e.lost || 0); });
  // ranged fire: IM.emit hands a handler four arguments (rules/core.js), so this reads (shooter, target or null, province, damage): a volley, or the damage it did
  const RG = Object.keys(X.RANGE_KM || {}); IM.on('fxRanged', (a, b, p, lost) => { if (!on || !STATS || !a || !a.u) return; const ts = RG.filter(t => a.u[t] > 0); if (!ts.length) return;
    for (const t of ts){ const x = st.ranged[t] || (st.ranged[t] = {n:0, dmg:0}); if (b) x.dmg += (+lost || 0)/ts.length; else x.n++; } });
  IM.on('fxMissile', e => { if (!on || !STATS || !e || !e.m) return; const x = st.missileHits || (st.missileHits = {fired:0, hit:0}); x.fired++; if (e.hit) x.hit++; });
  const idleOf = n => st.idle[n] || (st.idle[n] = {h:0, idle:0, idleRich:0, streak:0, best:0, noRes:0, noRes2:0, noProd:0, noProdRich:0, noCons:0, noOrders:0});
  function statHour(){ const S = S_(), NNa = S.nations.length, bh = {};
    // units built: a training head gone from its queue with one hour left (prodHour); anything else is a cancelled order
    for (const [p, s] of qHead){ const q = S.queue[p]; if (q[0] === s.it || q.includes(s.it)) continue;
      if (s.h <= 1 && S.owner[p] === s.o && s.o >= 0){ if (s.it.msl) bump(st.missiles, s.o, s.it.t); else { const k = X.rPack ? X.rPack(s.o, s.it.t) : 1; bump(st.built, s.o, s.it.t, k); bump(bh, s.o, s.it.t, k); } } else st.cancelled++; }
    // losses: this hour's units against the hour before plus what was built (a fallen nation's units count as lost)
    const c = census(); if (cens) for (let n = 0; n < NNa; n++) for (let i = 0; i < UT.length; i++){ const d = (cens[n] ? cens[n][i] : 0) + ((bh[n] && bh[n][UT[i]]) || 0) - c[n][i]; if (d > 1e-9) bump(st.lost, n, UT[i], d); }
    cens = c; for (let n = 0; n < NNa; n++) for (let i = 0; i < UT.length; i++) if (c[n][i] > 0) st.unitHours[UT[i]] = (st.unitHours[UT[i]] || 0) + c[n][i];
    // wars: from the relation table
    for (const k in S.rel){ const r = S.rel[k], w = warOpen.get(k); if (r.st === 'war'){ if (!w) warOpen.set(k, {k, h0:r.since ?? S.hour, by:r.by ?? -1}); } else if (w){ warOpen.delete(k); st.wars.push({...w, h1:S.hour, end:r.st}); } }
    // idle: no research running, no unit in training, nothing under construction, no force with orders
    const prod = new Uint8Array(NNa), cons = new Uint8Array(NNa), ord = new Uint8Array(NNa);
    for (let p = 0; p < S.queue.length; p++){ const o = S.owner[p]; if (o < 0) continue; if (S.queue[p].length) prod[o] = 1; if (S.cons[p]) cons[o] = 1; }
    for (const a of S.armies) if (a.owner >= 0 && (a.path.length || a.to !== null || a.fly || a.sail)) ord[a.owner] = 1;
    for (const N of S.nations){ if (!N.alive) continue; const n = N.id, I = idleOf(n), r0 = !N.research && !N.research2, r1 = !N.research || !N.research2, rich = N.cash > IDLE_CASH;
      I.h++; if (r0) I.noRes++; if (r1) I.noRes2++; if (!prod[n]){ I.noProd++; if (rich) I.noProdRich++; } if (!cons[n]) I.noCons++; if (!ord[n]) I.noOrders++;
      if (r0 && !prod[n] && !cons[n] && !ord[n]){ I.idle++; if (rich) I.idleRich++; if (++I.streak > I.best) I.best = I.streak; } else I.streak = 0; } }
  const lastStock = {};
  function statDay(){ const S = S_(), G = G_(), d = Math.round(S.hour/24), K = X.RES_K || 1000, NNa = S.nations.length;
    const row = {d, n:[]}, land = new Int32Array(NNa), units = new Float64Array(NNa), pw = new Float64Array(NNa);
    for (let p = 0; p < S.owner.length; p++) if (S.owner[p] >= 0 && !G.P[p].sea) land[S.owner[p]]++;
    for (const a of S.armies) if (a.owner >= 0) for (const t of UT){ const v = a.u[t]; if (v > 0){ units[a.owner] += v; pw[a.owner] += v*(UNITS[t].atk + UNITS[t].def)*UNITS[t].hp/10; } }
    for (const N of S.nations){ if (!N.alive){ row.n.push(null); continue; } const n = N.id; let inc = null; try { inc = X.income(n); } catch (e){ flag('exception', n, ['income'], 'income() threw: ' + short(e)); }
      const cap = X.stockCap(n), capM = X.stockCap(n, 'mp'), P = st.pile[n] || (st.pile[n] = {});
      for (const k of X.CK){ const v = N[k], g = inc ? inc.gross[k] : 0, x = P[k] || (P[k] = {atCap:0, days:0, stockDaysSum:0, spent:0, net:0});
        x.days++; if (k !== 'cash' && v >= (k === 'mp' ? capM : cap)*0.99) x.atCap++; if (g > 0) x.stockDaysSum += v/g; x.net += inc ? Math.max(0, inc.net[k]) : 0;
        const ls = lastStock[n + k]; if (ls != null && inc){ const sp = ls + inc.net[k] - v; if (sp > 0) x.spent += sp; } lastStock[n + k] = v; }
      // [cash, gross money a day, net money a day, manpower, oil, metal, iron, elec, rare (thousands), provinces, units, strength, research slots busy]
      row.n.push([Math.round(N.cash), inc ? Math.round(inc.gross.cash) : null, inc ? Math.round(inc.net.cash) : null, Math.round(N.mp), ...X.GOODS.map(k => Math.round(N[k]/K)), land[n], Math.round(units[n]), Math.round(pw[n]), (N.research ? 1 : 0) + (N.research2 ? 1 : 0)]); }
    st.eco.push(row);
    // the share of the armies by type (count) and strength
    const tot = {}; let all = 0; for (const a of S.armies) if (a.owner >= 0) for (const t of UT){ const v = a.u[t]; if (v > 0){ tot[t] = (tot[t] || 0) + v; all += v; } }
    for (const t of UT){ st.shareSum[t] = (st.shareSum[t] || 0) + (all ? (tot[t] || 0)/all : 0); st.powSum[t] = (st.powSum[t] || 0) + (tot[t] || 0)*(UNITS[t].atk + UNITS[t].def)*UNITS[t].hp/10; } st.shareDays++;
    // a free research slot and an open step the nation can pay for, not taken
    for (const N of S.nations){ if (!N.alive || (N.research && N.research2)) continue; try { if (X.rOpenSteps(N.id).some(s => X.hasC(N, X.rCost(s.nd, s.lv)))) st.couldResearch[N.id] = (st.couldResearch[N.id] || 0) + 1; } catch (e){} } }

  W.start = () => { remember(); cens = census(); };
  W.hour = () => { if (!on) return; const S = S_(), t0 = cpu(), rs0 = S.rs;
    if (INV && lastH != null && S.hour !== lastH + 1) flag('clock', -1, [lastH], `the game clock went from hour ${lastH} to ${S.hour} in one game hour`); lastH = S.hour;
    try { if (INV){ const t = cpu(); invHour(); W.part.invHour += cpu() - t; } if (STATS){ const t = cpu(); statHour(); W.part.statHour += cpu() - t; } if (opts.probe) opts.probe(); } catch (e){ flag('watcher-error', -1, ['hour', String(e && e.message).slice(0, 60)], short(e)); for (const m of [resPrev, consPrev, sig, landT, embT, cdT, closedT]) m.clear(); }   // (a pass cut short: its records of the hour before are not trusted)
    remember();
    if (S.rs !== rs0){ flag('observer-used-dice', -1, ['hour'], `the observer moved the dice from ${rs0} to ${S.rs}: put back`); S.rs = rs0; }
    W.wms += cpu() - t0; };
  let nrel = -1;
  W.day = () => { if (!on) return; const S = S_(), t0 = cpu(), rs0 = S.rs, n0 = INV ? Object.keys(S.rel).length : 0;
    if (INV && nrel >= 0 && n0 < nrel) flag('relation-table', -1, ['shrank'], `the relation table lost ${nrel - n0} entries`);
    if (INV){ const ids = new Set(S.armies.map(a => a.id)); for (const m of [sig, landT, seaIdle, escH, embT, cdT, closedT]) for (const k of m.keys()) if (!ids.has(k)) m.delete(k); }   // (forces that are gone)
    try { if (INV){ const t = cpu(); invDay(); W.part.invDay += cpu() - t; } if (STATS){ const t = cpu(); statDay(); W.part.statDay += cpu() - t; } } catch (e){ flag('watcher-error', -1, ['day', String(e && e.message).slice(0, 60)], short(e)); }
    if (S.rs !== rs0){ flag('observer-used-dice', -1, ['day'], `the observer moved the dice from ${rs0} to ${S.rs}: put back`); S.rs = rs0; }
    if (INV){ const n1 = Object.keys(S.rel).length; if (n1 !== n0) flag('observer-changed-state', -1, ['rel'], 'the observer added relation entries'); nrel = n1; }
    W.wms += cpu() - t0; };
  W.exception = (e, where) => flag('exception', -1, [where || 'tick', String(e && e.message).slice(0, 80)], short(e));
  W.stop = () => { on = false; };
  W.finish = () => { for (const w of warOpen.values()) st.wars.push({...w, h1:null, end:'ongoing'}); warOpen.clear(); if (overflow) flag('watcher-overflow', -1, [], `${overflow} more violations not recorded`); };
  W.violations = () => [...V.values()];
  return W; }
// where two saves differ (paths), for the save/load check
function jsonDiff(a, b, at = '', out = [], tol = 0){ if (out.length >= 6 || a === b || (a === 0 && b === undefined) || (a === undefined && b === 0)) return out;   // (a zero the save writes and a load leaves out: the same)
  if (tol && typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= tol*Math.max(1, Math.abs(a))) return out;   // (tol: wounds are saved rounded)
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object'){ out.push(`${at || '(root)'}: ${String(JSON.stringify(a)).slice(0, 60)} -> ${String(JSON.stringify(b)).slice(0, 60)}`); return out; }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) jsonDiff(a[k], b[k], at + '.' + k, out, tol); return out; }

// the harness's own dice (never the rules' S.rs): a small LCG
const lcg = s => () => ((s = (Math.imul(s, 1664525) + 1013904223) | 0) >>> 0)/4294967296;
// --provoke: k pairs of neighbouring living computer nations at peace; one of each declares war on the other (api.declareWar, as a person's order)
function provoke(api, k, rnd){ const S = api.S, G = api.G, pairs = new Set();
  for (let p = 0; p < G.P.length; p++){ const o = S.owner[p]; if (o < 0 || G.P[p].sea) continue; for (const v of G.P[p].nbs){ const q = S.owner[v]; if (q >= 0 && q !== o && !G.P[v].sea) pairs.add(o < q ? o + ',' + q : q + ',' + o); } }
  const L = [...pairs].sort().map(s => s.split(',').map(Number)).filter(([a, b]) => S.nations[a].alive && S.nations[b].alive && relSt(S, a, b) === 'peace'), out = [];
  for (let i = 0; i < k && L.length; i++){ const [a, b] = L.splice(Math.floor(rnd()*L.length), 1)[0], by = rnd() < 0.5 ? a : b, to = by === a ? b : a; if (api.declareWar(by, to)) out.push([by, to]); }
  return out; }

// one watched game: the report (violations, statistics, timings, final state hash). o.watch false: the same game with no observer (for --check)
function playWatched(seed, days, o = {}){ const R = new Function(SRCX)(), api = R.IM.api, events = {};
  for (const t of ['log', 'fxCapture', 'over']) R.IM.on(t, () => { events[t] = (events[t] || 0) + 1; });
  const nw = !o.classic; if (nw) api.useScenario('world64');
  api.newGame(seed, 0, []); const S = api.S; S.started = true;
  const W = o.watch === false ? null : makeWatch(R, {inv:o.inv, stats:o.stats, rtEvery:o.rtEvery}); if (W) W.start();
  const rnd = lcg(seed ^ 0x5bd1e995), provoked = [];
  let hours = 0, msRules = 0, wallRules = 0, err = null; const t0 = Date.now();
  while (hours < days*24 && !S.over){
    if (o.provoke && S.hour % 240 === 0 && S.hour > 0){ for (const [a, b] of provoke(api, o.provoke, rnd)) provoked.push({h:S.hour, by:a, to:b}); }
    const t1 = cpu(), w1 = Date.now(); try { for (let q = 0; q < api.BATTLE_Q; q++) api.tickQ(); } catch (e){ err = e; if (W) W.exception(e); break; } msRules += cpu() - t1; wallRules += Date.now() - w1; hours++;
    if (W){ W.hour(); if (S.hour % 24 === 0) W.day(); } }
  if (W) W.finish();
  let lines; try { lines = summary(api, events, seed, days, nw); } catch (e){ lines = ['summary failed: ' + e.message]; }
  const X = R.X, rep = {seed, world:nw ? 'world64' : 'world', days, hours, over:S.over ? {what:S.over, who:S.overReason, day:+(S.hour/24).toFixed(1)} : null, error:err ? short(err) : null,
    names:S.nations.map(N => N.name), alive:S.nations.map(N => N.alive), ms:{total:Date.now() - t0, rules:Math.round(msRules), rulesWall:wallRules, watch:W ? W.wms : 0, roundtrip:W ? W.rtms : 0, roundtrips:W ? W.rt : 0, part:W ? W.part : null, perDay:Math.round(msRules/Math.max(1, hours/24)), perDayWall:Math.round(wallRules/Math.max(1, hours/24))},
    hash:(lines[lines.length - 1] || '').replace('state hash ', ''), summary:lines, provoked, captures:events.fxCapture || 0, units:X.UT.slice(), cost:Object.fromEntries(X.UT.map(t => [t, X.UNITS[t].cost]))};
  if (W){ rep.violations = W.violations(); if (o.stats) rep.stats = W.st; }
  return rep; }

// ---- many games' reports put together (the text report)
function aggregate(reps, o){ const out = [], U = reps[0].units, cost = reps[0].cost, sum = (o2, k, v) => { o2[k] = (o2[k] || 0) + v; }, med = v => v.length ? v[v.length >> 1] : 0, pct = (v, q) => v.length ? v[Math.min(v.length - 1, Math.floor(v.length*q))] : 0;
  const days = reps.reduce((s, r) => s + r.hours/24, 0);
  out.push(`games ${reps.length} (${reps[0].world === 'world64' ? 'nations world' : 'classic world'}), seeds ${reps.map(r => r.seed).join(',')}, ${o.days} days each${o.provoke ? `, ${o.provoke} wars provoked every 10 days` : ''}`);
  out.push(`time: ${(o.wall/1000).toFixed(1)} s wall for all (${o.jobs} at once); CPU per game day: rules ${Math.round(reps.reduce((s, r) => s + r.ms.rules, 0)/days)} ms (wall ${Math.round(reps.reduce((s, r) => s + (r.ms.rulesWall || 0), 0)/days)} ms on this machine now), observer ${Math.round(reps.reduce((s, r) => s + r.ms.watch, 0)/days)} ms per game day (save/load round trips ${Math.round(reps.reduce((s, r) => s + r.ms.roundtrip, 0)/days)} of it${reps[0].ms.part ? '; ' + Object.keys(reps[0].ms.part).map(k => k + ' ' + Math.round(reps.reduce((s, r) => s + r.ms.part[k], 0)/days)).join(', ') : ''})`);
  for (const r of reps) out.push(`  seed ${r.seed}: day ${(r.hours/24).toFixed(1)}${r.over ? `, game over (${r.over.what}: ${r.over.who}) on day ${r.over.day}` : ''}${r.error ? ', EXCEPTION ' + r.error : ''}, rules ${r.ms.perDay} ms CPU/day, ${r.captures} captures, ${r.provoked.length} wars provoked, ${r.alive.filter(x => x).length} nations alive, state hash ${r.hash}`);
  if (reps[0].violations){ const by = new Map(); for (const r of reps) for (const v of r.violations){ const b = by.get(v.type) || by.set(v.type, {n:0, k:0, games:new Set(), ex:[]}).get(v.type); b.n++; b.k += v.k; b.games.add(r.seed); if (b.ex.length < 3) b.ex.push(`seed ${r.seed} day ${v.day} ${v.nation ? v.nation + ': ' : ''}${v.d}${v.k > 1 ? ` (seen ${v.k} times, until day ${(v.last/24).toFixed(1)})` : ''}`); }
    out.push(`INVARIANTS: ${by.size ? [...by.values()].reduce((s, b) => s + b.n, 0) + ' distinct violations of ' + by.size + ' kinds' : 'no violation'}`);
    for (const [t, b] of [...by].sort((x, y) => y[1].n - x[1].n)){ out.push(`  ${t}: ${b.n} distinct (${b.k} sightings) in ${b.games.size} of ${reps.length} games`); for (const e of b.ex) out.push('     ' + e.slice(0, 280)); } }
  if (reps[0].stats){ const built = {}, lost = {}, kills = {}, fire = {}, uh = {}, share = {}, miss = {}; let shareDays = 0;
    for (const r of reps){ const s = r.stats; for (const n in s.built) for (const t in s.built[n]) sum(built, t, s.built[n][t]); for (const n in s.lost) for (const t in s.lost[n]) sum(lost, t, s.lost[n][t]);
      for (const t in s.killsT) sum(kills, t, s.killsT[t]); for (const t in s.fireT) sum(fire, t, s.fireT[t]); for (const t in s.unitHours) sum(uh, t, s.unitHours[t]); for (const t in s.shareSum) sum(share, t, s.shareSum[t]); shareDays += s.shareDays;
      for (const n in s.missiles) for (const t in s.missiles[n]) sum(miss, t, s.missiles[n][t]); }
    out.push(`UNITS BUILT (all games): ${U.filter(t => built[t]).sort((a, b) => built[b] - built[a]).map(t => `${t} ${Math.round(built[t])}`).join(', ')}${Object.keys(miss).length ? '; missiles ' + Object.entries(miss).map(([k, v]) => k + ' ' + v).join(', ') : '; no missile'}`);
    out.push(`  never built by anyone: ${U.filter(t => !built[t]).join(', ') || 'none'}`);
    out.push(`  living nations that built nothing at all, per game: ${reps.map(r => r.names.filter((_, n) => r.alive[n] && !Object.keys(r.stats.built[n] || {}).length).length).join(', ')}; orders cancelled (queue lost) ${reps.reduce((s, r) => s + r.stats.cancelled, 0)}`);
    out.push('DOMINANCE (all games; share = of all units, daily average; fire = battle firepower dealt; kills credited by each side\'s share of the fire; losses from battles, strikes and fallen nations):');
    out.push('  type    share  built   lost  kills  kills/lost  fire per unit-day  fire per $1000M fielded a day');
    for (const t of U.filter(t => (share[t] || 0) > 0 || built[t] || lost[t]).sort((a, b) => (share[b] || 0) - (share[a] || 0))){ const sh = (share[t] || 0)/Math.max(1, shareDays), fu = uh[t] ? (fire[t] || 0)/(uh[t]/24) : 0;
      out.push(`  ${t.padEnd(7)} ${(sh*100).toFixed(1).padStart(5)}% ${String(Math.round(built[t] || 0)).padStart(6)} ${String(Math.round(lost[t] || 0)).padStart(6)} ${String(Math.round(kills[t] || 0)).padStart(6)} ${(lost[t] ? (kills[t] || 0)/lost[t] : 0).toFixed(2).padStart(10)}  ${fu.toFixed(2).padStart(17)}  ${(fu/cost[t]*1000).toFixed(1).padStart(10)}`); }
    { const sk = {}, ad = {}, rg = {}; let mf = 0, mh = 0; for (const r of reps){ const s = r.stats; for (const t in s.strikes){ const x = sk[t] || (sk[t] = {n:0, dealt:0, killed:0}); for (const k in x) x[k] += s.strikes[t][k]; } for (const t in s.adLost) sum(ad, t, s.adLost[t]);
        for (const t in s.ranged){ const x = rg[t] || (rg[t] = {n:0, dmg:0}); x.n += s.ranged[t].n; x.dmg += s.ranged[t].dmg; } if (s.missileHits){ mf += s.missileHits.fired; mh += s.missileHits.hit; } }
      out.push(`AIR STRIKES (not in the battle table): ${Object.keys(sk).length ? Object.entries(sk).map(([t, x]) => `${t} ${x.n} sorties, ${x.killed} units killed, ${Math.round(x.dealt)} damage`).join('; ') : 'none'}; aircraft lost to air defence ${Object.keys(ad).length ? Object.entries(ad).map(([t, v]) => t + ' ' + v).join(', ') : 'none'}`);
      out.push(`RANGED FIRE (forces firing at a quarter-hour step, health taken off the targets): ${Object.keys(rg).length ? Object.entries(rg).map(([t, x]) => `${t} ${x.n} volleys, ${Math.round(x.dmg)} damage`).join('; ') : 'none'}; missiles fired ${mf}, hit ${mh}`); }
    const wars = reps.flatMap(r => r.stats.wars.map(w => ({...w, seed:r.seed, names:r.names, endH:r.hours})));
    const done = wars.filter(w => w.h1 != null).map(w => (w.h1 - w.h0)/24).sort((a, b) => a - b), on = wars.filter(w => w.h1 == null).map(w => (w.endH - w.h0)/24).sort((a, b) => a - b), ends = {};
    for (const w of wars) ends[w.end] = (ends[w.end] || 0) + 1;
    out.push(`WARS: ${wars.length} (${Object.entries(ends).map(([k, v]) => `${k === 'ongoing' ? 'still running' : 'ended in ' + k} ${v}`).join(', ')})${done.length ? `; ended wars lasted median ${med(done).toFixed(1)} days (${done[0].toFixed(1)} to ${done[done.length - 1].toFixed(1)})` : ''}${on.length ? `; running ones median ${med(on).toFixed(1)} days old` : ''}`);
    for (const w of wars.slice(0, 8)){ const [a, b] = w.k.split(',').map(Number); out.push(`  seed ${w.seed}: ${w.names[a]} v ${w.names[b]}${w.by >= 0 ? ' (started by ' + w.names[w.by] + ')' : ''}, day ${(w.h0/24).toFixed(1)} -> ${w.h1 == null ? 'running' : (w.h1/24).toFixed(1) + ' (' + w.end + ')'}`); }
    const gr = []; for (const r of reps){ const E = r.stats.eco; if (E.length < 2) continue; const a = E[0], b = E[E.length - 1]; r.names.forEach((nm, n) => { if (a.n[n] && b.n[n] && a.n[n][1] > 0) gr.push({nm, seed:r.seed, g0:a.n[n][1], g1:b.n[n][1], c1:b.n[n][0], l0:a.n[n][9], l1:b.n[n][9], d0:a.d, d1:b.d}); }); }
    if (gr.length){ gr.sort((x, y) => x.g1/x.g0 - y.g1/y.g0); const m = med(gr), f = x => `${x.nm} x${(x.g1/x.g0).toFixed(2)} ($${x.g0}M -> $${x.g1}M a day, ${x.l0} -> ${x.l1} provinces)`;
      out.push(`ECONOMY (gross money a day, day ${gr[0].d0} -> ${gr[0].d1}): median x${(m.g1/m.g0).toFixed(2)}; lowest ${gr.slice(0, 3).map(f).join('; ')}; highest ${gr.slice(-3).reverse().map(f).join('; ')}`);
      const cash = gr.map(x => x.c1).sort((a, b) => a - b); out.push(`  treasury at the end: median $${med(cash)}M; largest ${gr.slice().sort((x, y) => y.c1 - x.c1).slice(0, 4).map(x => `${x.nm} $${x.c1}M (seed ${x.seed})`).join(', ')}`); }
    const pile = {}; for (const r of reps) for (const n in r.stats.pile) for (const k in r.stats.pile[n]){ const x = r.stats.pile[n][k], p = pile[k] || (pile[k] = {atCap:0, days:0, sd:[], spent:0, net:0}); p.atCap += x.atCap; p.days += x.days; p.sd.push(x.days ? x.stockDaysSum/x.days : 0); p.spent += x.spent; p.net += x.net; }
    out.push('RESOURCES PILING UP (per nation-day: at the storage cap; stock-days = stock / gross income a day; used = drawn from stock / net income gained):');
    for (const k of ['cash', 'mp', 'oil', 'metal', 'iron', 'elec', 'rare']) if (pile[k]){ const p = pile[k], sd = p.sd.sort((a, b) => a - b);
      out.push(`  ${k.padEnd(6)} at cap ${k === 'cash' ? '  n/a' : ((100*p.atCap/Math.max(1, p.days)).toFixed(1) + '%').padStart(6)}; stock-days median ${med(sd).toFixed(1)}, 90th pct ${pct(sd, 0.9).toFixed(1)}; used ${(p.net > 0 ? p.spent/p.net : 0).toFixed(2)} of what came in`); }
    const I = []; for (const r of reps) for (const n in r.stats.idle){ const x = r.stats.idle[n]; I.push({nm:r.names[n], seed:r.seed, ...x, could:r.stats.couldResearch[n] || 0}); }
    if (I.length){ const pc = f => { const v = I.map(f).sort((a, b) => a - b); return `median ${(100*med(v)).toFixed(0)}%, 90th pct ${(100*pct(v, 0.9)).toFixed(0)}%`; };
      out.push(`IDLE (share of each living nation's hours; ${I.length} nation-games):`);
      out.push(`  both research slots empty ${pc(x => x.noRes/x.h)}; at least one empty ${pc(x => x.noRes2/x.h)}; days with a free slot and an open step it could pay for: median ${med(I.map(x => x.could).sort((a, b) => a - b))}, most ${Math.max(...I.map(x => x.could))}`);
      out.push(`  no unit in training ${pc(x => x.noProd/x.h)} (with more than $${IDLE_CASH}M in the treasury ${pc(x => x.noProdRich/x.h)}); nothing under construction ${pc(x => x.noCons/x.h)}; no force with orders ${pc(x => x.noOrders/x.h)}`);
      out.push(`  all four at once ${pc(x => x.idle/x.h)} (with more than $${IDLE_CASH}M ${pc(x => x.idleRich/x.h)}); longest such streaks ${I.slice().sort((a, b) => b.best - a.best).slice(0, 4).map(x => `${x.nm} ${x.best} h (seed ${x.seed})`).join(', ')}`); } }
  return out; }

// ---- a pool of child processes, one game each (each prints its report as one JSON line)
function runChild(seed, o){ const cp = require('child_process'), argv = [__filename, '--child', '--seed', String(seed), '--days', String(o.days)];
  if (o.inv) argv.push('--invariants'); if (o.stats) argv.push('--stats'); if (o.classic) argv.push('--classic'); if (o.provoke) argv.push('--provoke', String(o.provoke)); if (o.rtEvery != null) argv.push('--rt', String(o.rtEvery)); if (o.watch === false) argv.push('--nowatch');
  return new Promise((res, rej) => cp.execFile(process.execPath, argv, {maxBuffer:1 << 28}, (e, so, se) => { if (e) return rej(new Error((se || '') + e.message)); try { res(JSON.parse(so.trim().split('\n').pop())); } catch (x){ rej(x); } })); }
async function pool(tasks, n){ const out = new Array(tasks.length); let i = 0; await Promise.all(Array.from({length:Math.min(n, tasks.length)}, async () => { while (i < tasks.length){ const k = i++; out[k] = await tasks[k](); } })); return out; }

/* ---- --selftest: faults put on purpose into copies of a saved game; each must be flagged ---- */
function selftest(){ const R = new Function(SRCX)(), api = R.IM.api, X = R.X; api.useScenario('world64'); api.newGame(SEED, 0, []); api.S.started = true;
  for (let h = 0; h < 30; h++) api.tick(); const base = api.saveJSON(), res = [];
  let probe = null; const fresh = () => { api.restore(JSON.parse(base)); const S = api.S; S.started = true; probe = null; const W = makeWatch(R, {inv:true, rtEvery:1, probe:() => probe && probe()}); W.start(); return {S, G:api.G, W}; };
  const land = (G, f) => G.P.find(P => !P.sea && f(P)), own = S => S.nations.find(N => N.alive && N.id > 0), groundF = S => S.armies.find(x => x.owner >= 0 && X.ground(x) && !x.air && !x.path.length && x.to === null);
  // [what, the violation type it must raise, set the fault up (may return a step run before each pass), passes (default: one hour and one day; 'tick': play an hour)]
  const F = [
    ['a ship spawned on land (inland, not a port)', 'ship-on-land', (S, G) => { const N = own(S), P = land(G, P => S.owner[P.id] === N.id && !P.city && !P.coast); X.addArmy(N.id, P.id, {frig:2}); }],
    ['ground troops set sail from a coast with no port', 'embark-without-port', (S, G, W) => { const P = land(G, P => S.owner[P.id] >= 0 && P.coast && !P.city && P.nbs.some(v => G.P[v].sea)); const a = X.addArmy(S.owner[P.id], P.id, {inf:2}); W.start(); a.to = P.nbs.find(v => G.P[v].sea); a.t = 0.1; }],
    ['troops come ashore on a coast that is not a naval city', 'landed-off-port', (S, G, W) => { const P = land(G, P => S.owner[P.id] >= 0 && P.coast && !P.city && P.nbs.some(v => G.P[v].sea)); const a = X.addArmy(S.owner[P.id], P.nbs.find(v => G.P[v].sea), {inf:2}); W.start(); a.at = P.id; }],
    ['troops moved from inland straight onto the sea', 'teleported-to-sea', (S, G, W) => { const N = own(S), P = land(G, P => S.owner[P.id] === N.id && !P.coast); const a = X.addArmy(N.id, P.id, {inf:2}); W.start(); a.at = G.P.find(Q => Q.sea).id; }],
    ['troops at sea with a landing timer', 'landing-at-sea', (S, G) => { const a = X.addArmy(own(S).id, G.P.find(P => P.sea).id, {inf:2}); a.land = 0.5; }],
    ['money is NaN', 'bad-resource', S => { own(S).cash = NaN; }],
    ['oil is negative', 'bad-resource', S => { own(S).oil = -5; }],
    ['metal is Infinity', 'bad-resource', S => { own(S).metal = Infinity; }],
    ['a research timer that never ends (1e9 hours)', 'bad-timer', S => { own(S).research = {id:X.RNODES[0].id, lv:1, h:1e9, h0:1e9}; }],
    ['a research project that stops counting down', 'research-not-progressing', S => { const N = own(S); N.research = {id:X.RNODES[0].id, lv:1, h:50, h0:60}; }, 2],
    ['a training timer below zero', 'bad-timer', (S, G) => { const N = own(S), P = land(G, P => S.owner[P.id] === N.id && P.city); S.queue[P.id].push({t:'inf', h:-5, h0:24}); }],
    ['a unit in training that never finishes', 'production-stalled', (S, G) => { const N = own(S), P = land(G, P => S.owner[P.id] === N.id && P.city && !S.queue[P.id].length); S.queue[P.id].push({t:'inf', h:10, h0:24}); return () => { S.hour++; }; }, 30],
    ['a construction timer that is NaN', 'bad-timer', (S, G) => { const N = own(S), P = land(G, P => S.owner[P.id] === N.id && !S.cons[P.id]); S.cons[P.id] = {k:'fort', lvl:1, h:NaN, h0:48}; }],
    ['a boarding timer below zero', 'bad-timer', S => { groundF(S).emb = -1; }],
    ['a landing timer that does not count down', 'bad-timer', (S, G) => { const N = own(S), P = land(G, P => S.owner[P.id] === N.id && P.city); const a = X.addArmy(N.id, P.id, {inf:1}); a.land = 0.5; return () => { S.hour++; }; }, 5],
    ['an empty force left in the list', 'empty-force', S => { X.addArmy(own(S).id, own(S).capital, {}); }],
    ['a force of a fallen nation', 'force-of-dead-nation', S => { S.nations.find(M => M.alive && M.id > 2).alive = false; }],
    ['a fallen nation that still owns land', 'dead-nation-owns-land', S => { S.nations.find(M => M.alive && M.id > 2).alive = false; }],
    ['a force owned by a nation that does not exist', 'invalid-owner', S => { S.armies.find(x => x.owner >= 0).owner = 999; }],
    ['a province owned by a nation that does not exist', 'bad-owner', (S, G) => { S.owner[land(G, () => true).id] = 777; }],
    ['a fleet escorting a trade route that does not exist', 'invalid-ref', (S, G) => { const a = X.addArmy(own(S).id, G.P.find(P => P.sea).id, {frig:1}); a.escort = 99999; return () => { S.hour++; }; }, 5],
    ['a training item of an unknown unit type', 'invalid-ref', (S, G) => { const N = own(S), P = land(G, P => S.owner[P.id] === N.id && P.city); S.queue[P.id].push({t:'zzz', h:5, h0:24}); }],
    ['a force with a commander that does not exist', 'invalid-ref', S => { groundF(S).cmd = 987654; }],
    ['a relation with an unknown state', 'relation-table', S => { S.rel['1,2'] = {st:'bogus', since:0, until:null}; }],
    ['a relation key in the wrong order', 'relation-table', S => { S.rel['5,3'] = {st:'war', since:0, until:null}; }],
    ['a truce whose end has passed', 'relation-table', S => { S.rel['1,2'] = {st:'truce', since:0, until:S.hour - 30}; }],
    ['a trade route between nations at war', 'convoy-state', S => { const r = S.trade.routes.find(x => x.b >= 0); S.rel[rk(r.a, r.b)] = {st:'war', since:S.hour, until:null}; }],
    ['a trade route with a NaN flow', 'convoy-state', S => { S.trade.routes[0].f = NaN; }],
    ['a blockade order on a ground force', 'convoy-state', S => { groundF(S).blk = {t:S.hour}; }],
    ['a strike mission beyond the wing\'s range', 'air-out-of-range', (S, G) => { const N = own(S), b = N.capital, a = X.addArmy(N.id, b, {jet:1}); a.air = {base:b, cd:0}; const far = G.P.reduce((m, P) => X.hexDist(G.P[b].cc, P.cc) > X.hexDist(G.P[b].cc, G.P[m].cc) ? P.id : m, b); a.fly = {tgt:far, kind:'strike', ph:'out', t:0, hrs:0}; }],
    ['aircraft in a ground force (not a wing)', 'air-outside-wing', S => { groundF(S).u.jet = 1; }],
    ['a force whose route makes no progress', 'stuck-force', (S, G) => { const N = own(S), P = land(G, P => S.owner[P.id] === N.id && P.nbs.some(v => S.owner[v] === N.id)); const a = X.addArmy(N.id, P.id, {inf:2}); a.path = [P.nbs.find(v => S.owner[v] === N.id)]; return () => { S.hour++; }; }, 52],
    ['a unit count that is not a whole number', 'bad-unit-count', S => { groundF(S).u.inf = 2.5; }],
    ['a boarding timer longer than boarding takes (a load cuts it: save != load)', 'save-load', S => { groundF(S).emb = 5; }],
    ['the observer itself draws the rules\' dice', 'observer-used-dice', () => { probe = () => X.rng(); }],
    ['an exception in the rules (a force in a province that does not exist)', 'exception', S => { S.armies.find(x => x.owner >= 0).at = 1e9; }, 'tick'],
    ['a force that jumped across the map in one hour', 'teleported', (S, G, W) => { const N = own(S), P = land(G, P => S.owner[P.id] === N.id); const a = X.addArmy(N.id, P.id, {inf:2}); W.start();
      a.at = G.P.find(Q => !Q.sea && S.owner[Q.id] >= 0 && S.owner[Q.id] !== N.id && X.hexDist(P.cc, Q.cc) > 30).id; }],
    ['a force standing in the land of a nation it is at peace with', 'force-in-closed-land', (S, G) => { const N = own(S), Q = land(G, Q => S.owner[Q.id] >= 0 && S.owner[Q.id] !== N.id && relSt(S, N.id, S.owner[Q.id]) === 'peace'); X.addArmy(N.id, Q.id, {inf:2}); return () => { S.hour++; }; }, 4],
    ['a boarding timer (the embark cooldown) that does not count down', 'bad-timer#emb-stuck', S => { groundF(S).emb = 0.5; return () => { S.hour++; }; }, 5],
    ['a rearm timer (the air cooldown) that does not count down', 'bad-timer#cd-stuck', S => { const N = own(S), a = X.addArmy(N.id, N.capital, {jet:1}); a.air = {base:N.capital, cd:4}; return () => { S.hour++; }; }, 4],
    ['the game clock skips an hour', 'clock', S => () => { S.hour += 2; }, 3],
  ];
  { const {W} = fresh(); W.hour(); W.day(); res.push({name:'control (no fault)', expect:'-', base:W.violations().map(v => v.type + ': ' + v.d)}); W.stop(); }
  const baseTypes = new Set(res[0].base.map(s => s.split(':')[0]));
  for (const [name, type, apply, mode] of F){ const {S, G, W} = fresh(); let got = [];
    try { const step = apply(S, G, W);
      if (mode === 'tick'){ try { api.tick(); } catch (e){ W.exception(e); } }
      else if (typeof mode === 'number'){ for (let i = 0; i < mode; i++){ if (step) step(); W.hour(); } }
      else { W.hour(); W.day(); }
      const [ty, idp] = type.split('#'); got = W.violations().filter(v => v.type === ty && (!idp || v.ids.includes(idp))); }
    catch (e){ res.push({name, expect:type, ok:false, why:'the fault could not be set up: ' + short(e)}); W.stop(); continue; }
    W.stop(); res.push({name, expect:type, ok:got.length > 0, extra:baseTypes.has(type), d:got[0] ? got[0].d : ''}); }
  api.restore(JSON.parse(base));
  // the rule mutants: the rules themselves broken, one at a time, in memory (MUTANTS below). A game mutant plays the saved game on (with its
  // setup) under the broken rules and under the real ones: it is caught when a violation it must raise appears more often than with the real
  // rules. A mechanic mutant runs the mechanic checks of --scenarios: it is caught when a check fails or an order does nothing that did not before
  if (!has('nomutants')){ let mech0 = null;
    for (const m of MUTANTS){ const r = {name:'RULE MUTANT ' + m.what, expect:m.mech ? 'a mechanic check fails' : m.expect.join(' or '), mut:m.key};
      try { const mu = runMutant(m, base, true); if (mu.err){ res.push({...r, ok:false, why:mu.err}); continue; }
        if (m.mech){ if (!mech0) mech0 = runMutant(m, base, false); const odd0 = new Set(mech0.odd), fails = mu.fails || [], odd = (mu.odd || []).filter(x => !odd0.has(x));
          r.ok = !!(mu.threw || fails.length || odd.length); r.d = mu.threw ? 'the checks threw: ' + mu.threw : [...fails.map(f => 'FAIL ' + f), ...odd].join('; '); }
        else { const c0 = runMutant(m, base, false), fresh = t => (mu.cnt[t] || []).filter(v => !(c0.cnt[t] || []).some(w => w.k === v.k)), hit = m.expect.filter(t => fresh(t).length);   // (new: a violation the real rules do not raise)
          r.ok = hit.length > 0; r.d = hit.length ? `${hit.map(t => `${t} ${fresh(t).length} new (real rules ${(c0.cnt[t] || []).length})`).join(', ')}: ${fresh(hit[0])[0].d}` : `nothing the real rules do not raise too (${m.expect.map(t => t + ' ' + (mu.cnt[t] || []).length + '/' + (c0.cnt[t] || []).length).join(', ')})`; } }
      catch (e){ r.ok = false; r.why = 'the mutant could not be run: ' + short(e); }
      res.push(r); } }
  return res; }

/* ---- the rule mutants (--selftest; tools/headless.js exports them so a script can also write one to disk for a real-file test). Each replaces one
   text in one rules file. from must be found exactly once. Game mutants: setup (S, G, X, api) on the saved game, then hours played; expect: the
   violation types (type#id: with that id) of which at least one must appear more often than under the real rules. mech: the mechanic checks ---- */
const MUTANTS = [
  {key:'ship-spawn-inland', what:'(a) a finished ship is put on land: spawn() places it in an inland province next to its port', file:'rules/production.js',
    from:"  if (!a){ a = addArmy(n, p, {}); if (air) a.air = {base:p, cd:0}; }",
    to:"  if (UNITS[t].cls === 'naval'){ const q = G.P[p].nbs.find(v => !G.P[v].sea && !G.P[v].coast); if (q != null) a = addArmy(n, q, {}); }\n  if (!a){ a = addArmy(n, p, {}); if (air) a.air = {base:p, cd:0}; }",
    expect:['ship-on-land'], hours:4, setup:(S, G, X) => { const P = G.P.find(P => X.navalCity(P.id) && S.owner[P.id] >= 0 && P.nbs.some(v => !G.P[v].sea && !G.P[v].coast)); S.queue[P.id] = [{t:'frig', h:1, h0:24}]; }},
  {key:'pay-ten-times', what:'(b) a resource goes negative: payC() takes ten times the price that was checked', file:'rules/data.js',
    from:'N[k] = (N[k] || 0) - q;', to:'N[k] = (N[k] || 0) - q*10;', expect:['bad-resource'], hours:24},
  {key:'boarding-never-ends', what:'(c) a timer never finishes: the boarding timer (the embark cooldown, 45 minutes) does not count down', file:'rules/movement.js',
    from:'const u = Math.min(hr, a.emb); a.emb -= u;', to:'const u = Math.min(hr, a.emb); a.emb -= 0;', expect:['bad-timer#emb-stuck', 'stuck-force'], hours:8,
    setup:(S, G, X, api) => { for (const N of S.nations){ if (!N.alive) continue; const P = G.P.find(P => S.owner[P.id] === N.id && X.navalCity(P.id) && P.nbs.some(v => G.P[v].sea)); if (!P) continue;
      const a = X.addArmy(N.id, P.id, {inf:2}); api.orderMove(a, P.nbs.find(v => G.P[v].sea)); return; } }},
  {key:'rearm-never-ends', what:'(c) a timer never finishes: a wing\'s rearm timer (the air cooldown) does not count down', file:'rules/air.js',
    from:'if (a.air.cd > 0) a.air.cd--;', to:'if (a.air.cd > 0) a.air.cd -= 0;', expect:['bad-timer#cd-stuck'], hours:4,
    setup:(S, G, X) => { const N = S.nations.find(M => M.alive && M.id > 0), b = N.capital; S.bld[b].air = Math.max(1, S.bld[b].air || 0); const a = X.addArmy(N.id, b, {jet:1}); a.air = {base:b, cd:4}; }},
  {key:'research-never-ends', what:'(c) a timer never finishes: a research project does not count down', file:'rules/research.js',
    from:'  if (--R.h <= 0){ const nd = RN[R.id]; N[k] = null;', to:'  if (R.h <= 0){ const nd = RN[R.id]; N[k] = null;', expect:['research-not-progressing'], hours:3,
    setup:(S, G, X, api) => { for (const N of S.nations){ if (!N.alive || N.research) continue; const st = X.rOpenSteps(N.id).find(s => X.hasC(N, X.rCost(s.nd, s.lv))); if (st && api.startResearch(N.id, st.nd.id)) return; } }},
  {key:'recruit-does-nothing', what:'(d) an accepted order does nothing: recruit() says yes, queues nothing and takes nothing', file:'rules/production.js',
    from:'  if (!canRecruit(n, p, t)) return false;', to:'  if (!canRecruit(n, p, t)) return false; if (n >= 0) return true;', mech:true},
  {key:'research-does-nothing', what:'(d) an accepted order does nothing: startResearch() says yes and starts nothing', file:'rules/research.js',
    from:'function startResearch(n, id){ if (!canResearch(n, id)) return false;', to:'function startResearch(n, id){ if (!canResearch(n, id)) return false; if (n >= 0) return true;', mech:true},
  {key:'arrive-elsewhere', what:'(e) a force in an impossible province: a force at the end of a leg is put in a province far from it', file:'rules/movement.js',
    from:'  a.from = a.at; a.froms = [a.at]; atMove(a, a.to); a.to = null;', to:'  a.from = a.at; a.froms = [a.at]; atMove(a, (a.to*7919 + 13) % G.P.length); a.to = null;',
    expect:['teleported', 'teleported-to-sea', 'ship-on-land', 'landed-off-port', 'force-in-closed-land', 'exception'], hours:24},
  {key:'save-drops-morale', what:'(f) a field dropped from the save: saveJSON() leaves out each force\'s morale (a load puts 80 back)', file:'rules/state.js',
    from:'return JSON.stringify(o, function(k, v){\n', to:"return JSON.stringify(o, function(k, v){\n  if (k === 'm' && this && this.id != null && this.at != null) return undefined;\n", expect:['save-load'], hours:20},
  {key:'load-drops-unrest', what:'(f) a field dropped on load: restore() starts every province\'s unrest at 0', file:'rules/state.js',
    from:'S.unrest = S.unrest || G.P.map(() => 0);', to:'S.unrest = G.P.map(() => 0);', expect:['save-load'], hours:20,
    setup:(S, G) => { let k = 0; for (const P of G.P) if (!P.sea && S.owner[P.id] >= 0 && k < 5){ S.unrest[P.id] = 50; k++; } }},
];
// one rule mutant (or, mutated false, the real rules with the same setup): {cnt: type -> [{k: the violation's key, d: details}]} for a game mutant, {fails, odd} for a mechanic one
function runMutant(m, base, mutated){ const src = mutated ? mutSrc(m.file, m.from, m.to) : {n:1, srcx:SRCX};
  if (src.n !== 1) return {err:`mutation point found ${src.n} times in ${m.file} (the rule changed: update the mutant)`};
  if (m.mech){ try { const r = mechanics(src.srcx); return {fails:r.res.filter(x => x.ok === false).map(x => x.cs + ': ' + x.name), odd:r.note.filter(e => /DOES NOTHING|REFUSED SILENTLY|THREW|QUERY/.test(e.kind)).map(e => e.kind + ': ' + e.label)}; }
    catch (e){ return {threw:short(e)}; } }
  const R = new Function(src.srcx)(), api = R.IM.api; api.useScenario('world64'); api.restore(JSON.parse(base)); const S = api.S; S.started = true;
  const W = makeWatch(R, {inv:true, rtEvery:1, srcx:src.srcx}); if (m.setup) m.setup(S, api.G, R.X, api); W.start();
  for (let h = 0; h < m.hours; h++){ try { api.tick(); } catch (e){ W.exception(e); break; } W.hour(); if (S.hour % 24 === 0) W.day(); }
  W.day(); W.stop(); const cnt = {};
  for (const v of W.violations()) for (const t of m.expect){ const [ty, idp] = t.split('#'); if (v.type === ty && (!idp || v.ids.includes(idp))) (cnt[t] || (cnt[t] = [])).push({k:v.type + '|' + v.n + '|' + v.ids.join(','), d:v.d}); }
  return {cnt}; }

module.exports = {makeWatch, SRCX, FILES, ROOT, relSt, playWatched, aggregate, MUTANTS, mutSrc, mechanics};

if (require.main === module){
  if (has('selftest')){ const t0 = Date.now(), res = selftest(); let bad = 0;
    console.log(`SELFTEST: faults put into copies of a saved game (nations world, seed ${SEED}, hour 30); each must be flagged`);
    for (const r of res){ if (r.expect === '-'){ console.log(`  control, no fault: ${r.base.length ? r.base.length + ' violation(s) already there: ' + r.base.join('; ').slice(0, 400) : 'clean'}`); continue; }
      if (r.mut && r === res.find(x => x.mut)) console.log('RULE MUTANTS: the rules broken on purpose, one at a time, in memory (the files are not touched); each must be flagged');
      if (!r.ok) bad++; console.log(`  ${r.ok ? 'CAUGHT' : 'MISSED'}  ${r.name.padEnd(76)} -> ${r.expect}${r.ok ? '' : r.why ? ' (' + r.why + ')' : ''}${r.extra ? ' (that kind is in the control too)' : ''}${r.d ? '   [' + String(r.d).slice(0, r.ok ? 160 : 300) + ']' : ''}`); }
    console.log(bad ? `SELFTEST FAILED: ${bad} fault(s) not flagged` : `SELFTEST OK: all ${res.length - 1} faults flagged (${((Date.now() - t0)/1000).toFixed(1)} s)`); process.exit(bad ? 1 : 0); }
  else if (has('scenarios')) scenarios();
  else if (has('child')){ const j = JSON.stringify(playWatched(SEED, DAYS, {inv:has('invariants'), stats:has('stats'), classic:has('classic'), provoke:arg('provoke', 0), rtEvery:arg('rt', 1), watch:!has('nowatch')}));
    process.stdout.write(j + '\n', () => process.exit(0)); }   // (a large report: exit only once the pipe has it all)
  else if (MULTI){ (async () => { const seeds = has('seeds') ? sarg('seeds', '').split(',').filter(Boolean).map(Number) : Array.from({length:arg('games', 1)}, (_, i) => SEED + i*1009);
      const o = {days:DAYS, inv:has('invariants'), stats:has('stats'), classic:has('classic'), provoke:arg('provoke', 0), rtEvery:arg('rt', 1), jobs:arg('jobs', 2)}, t0 = Date.now();
      const reps = (seeds.length === 1 && !CHECK ? [playWatched(seeds[0], DAYS, o)] : await pool(seeds.map(s => () => runChild(s, o).catch(e => { console.error(`seed ${s}: the game process failed: ${short(e)}`); return null; })), o.jobs)).filter(Boolean);
      if (!reps.length){ console.error('no game finished'); process.exit(2); }
      let same = null, checkLine = ''; if (CHECK){ const plain = await runChild(seeds[0], {...o, watch:false}); same = plain.hash === reps[0].hash;
        checkLine = same ? `DETERMINISTIC: seed ${seeds[0]} played with the observers on and with none gave the same state hash ${plain.hash}` : `THE OBSERVERS CHANGED THE GAME: seed ${seeds[0]} state hash ${reps[0].hash} watched, ${plain.hash} not watched`; }
      o.wall = Date.now() - t0; const lines = aggregate(reps, o); if (checkLine) lines.push(checkLine); console.log(lines.join('\n'));
      const jf = sarg('json', ''); if (jf){ fs.mkdirSync(path.dirname(path.resolve(jf)), {recursive:true}); fs.writeFileSync(path.resolve(jf), JSON.stringify({made:'tools/headless.js', argv:process.argv.slice(2), text:lines, games:reps})); console.log('report written to ' + path.resolve(jf)); }
      process.exit(same === false || reps.some(r => r.error) ? 1 : 0); })().catch(e => { console.error(e); process.exit(2); }); }
  else {
    const A = play(SEED, DAYS);
    console.log(`${FILES.length} rules files, no browser`); console.log(A.lines.join('\n'));
    console.log(`(${(A.ms/1000).toFixed(1)} s, ${Math.round(A.ms/Math.max(1, A.hours/24))} ms per game day)`);
    if (CHECK){ const B = play(SEED, DAYS), bad = A.lines.findIndex((l, i) => l !== B.lines[i]);
      console.log(bad < 0 ? `DETERMINISTIC: a second run of seed ${SEED} gave the same summary and state hash` : `NOT DETERMINISTIC: the second run differs\n  first   ${A.lines[bad]}\n  second  ${B.lines[bad]}`);
      process.exit(bad < 0 ? 0 : 1); }
    process.exit(0); }
}

/* ---- --scenarios: scripted mechanic checks on the real api. Every nation is a seat that gives no orders (no AI moves anything), so each case
   sees only its own orders. act() runs one order and says what came of it: done (the state changed), refused with a reason (a toast to the seat,
   or a reason function of the rules: what the UI shows), refused silently (no reason anywhere), or DOES NOTHING (accepted, no change, no reason) */
function mechanics(srcx = SRCX){ const t0 = Date.now(), R = new Function(srcx)(), api = R.IM.api, X = R.X; let toasts = [];
  R.IM.on('toast', (n, why) => toasts.push(why)); api.useScenario('world64');
  const res = [], note = [], fresh = seed => { api.newGame(seed, 0, Array.from({length:68}, (_, i) => i)); api.S.started = true; return {S:api.S, G:api.G}; };
  const fp = () => { const o = JSON.parse(api.saveJSON()); delete o.savedAt; delete o.log; delete o.desks; return hash(JSON.stringify(o)); };
  function act(label, fn, why, query = false){ const h0 = fp(), t0n = toasts.length; let r, err = null; try { r = fn(); } catch (e){ err = e; } const h1 = fp(), ts = toasts.slice(t0n), changed = h0 !== h1;
    const refused = r === false || r === null || (typeof r === 'string' && r !== '') || (r && typeof r === 'object' && r.ok === false);
    let w = ''; try { w = why ? why() || '' : ''; } catch (e){ w = ''; }
    const kind = err ? 'THREW' : query ? (changed ? 'QUERY CHANGED THE STATE' : 'answer') : refused ? (ts.length ? 'refused, toast' : w ? 'refused, reason from the rules' : typeof r === 'string' ? 'refused, reason returned' : 'REFUSED SILENTLY') : changed ? 'done' : ts.length ? 'refused, toast' : 'DOES NOTHING';
    const e = {label, kind, r:typeof r === 'object' ? JSON.stringify(r) : String(r), toast:ts.join(' / '), why:w || (typeof r === 'string' ? r : ''), changed, err:err ? short(err) : ''}; note.push(e); return {r, e}; }
  const check = (cs, name, ok, detail) => { res.push({cs, name, ok:ok === 'warn' ? 'warn' : !!ok, detail}); };   // 'warn': the rule holds but the api gives no reason (a finding, not a failure)
  const reasoned = a => a.e.kind !== 'REFUSED SILENTLY' && a.e.kind !== 'DOES NOTHING';
  const hours = (n, stop) => { let h = 0; for (; h < n; h++){ api.tick(); if (stop && stop()) return h + 1; } return h; };
  const countAt = (S, n, p, t) => S.armies.filter(a => a.owner === n && a.at === p && a.to === null).reduce((s0, a) => s0 + (a.u[t] || 0), 0);
  // ---- research: start to finish, both slots, refusals
  { const {S} = fresh(101), n = 3, N = S.nations[n]; const st = X.rOpenSteps(n).filter(s => X.hasC(N, X.rCost(s.nd, s.lv))).sort((a, b) => a.nd.lv[a.lv - 1].c.days - b.nd.lv[b.lv - 1].c.days);
    check('research', 'an open, affordable step exists on day 1', st.length > 0, `${st.length} steps`);
    if (st.length >= 3){ const s1 = st[0], c = X.rCost(s1.nd, s1.lv), cash0 = N.cash, l0 = X.rLevel(n, s1.nd.id);
      const a1 = act(`startResearch ${s1.nd.id} (${s1.nd.name})`, () => api.startResearch(n, s1.nd.id), () => X.researchWhy(n, s1.nd.id));
      check('research', 'the order is taken: slot #1 holds it, the price is paid', a1.r === true && N.research && N.research.id === s1.nd.id && Math.abs(N.cash - (cash0 - c.cash)) < 1e-6, `slot ${JSON.stringify(N.research)}, money ${cash0} -> ${N.cash} (price ${c.cash})`);
      const h0 = N.research ? N.research.h0 : 0, h = hours(h0 + 3, () => !N.research);
      check('research', `it completes in its time (${h0} h) and the level is granted`, !N.research && X.rLevel(n, s1.nd.id) === l0 + 1 && Math.abs(h - h0) <= 1, `took ${h} h, level ${l0} -> ${X.rLevel(n, s1.nd.id)}`);
      const s2 = st[1], s3 = st[2]; api.startResearch(n, s2.nd.id); const ok3 = api.startResearch(n, s3.nd.id);
      check('research', 'two projects run at once', ok3 === true && N.research && N.research2, `${N.research && N.research.id} + ${N.research2 && N.research2.id}`);
      const s4 = X.rOpenSteps(n).find(s => !X.R_SLOTS.some(k => N[k] && N[k].id === s.nd.id));
      if (s4){ const a = act(`startResearch ${s4.nd.id} with both slots busy`, () => api.startResearch(n, s4.nd.id), () => X.researchWhy(n, s4.nd.id)); check('research', 'a third project is refused, with a reason', a.r === false && /busy/i.test(a.e.why), a.e.kind + ': ' + a.e.why); }
      const a = act(`startResearch ${s2.nd.id} again while it runs`, () => api.startResearch(n, s2.nd.id), () => X.researchWhy(n, s2.nd.id)); check('research', 'the same project twice is refused', a.r === false, a.e.kind + ': ' + a.e.why);
      const a2 = act('startResearch of an unknown node', () => api.startResearch(n, 'no_such_node'), () => X.researchWhy(n, 'no_such_node')); check('research', 'an unknown node is refused', a2.r === false, a2.e.kind + ': ' + a2.e.why);
      N.research = null; N.research2 = null; N.cash = 0; const s5 = X.rOpenSteps(n)[0];
      if (s5){ const a3 = act(`startResearch ${s5.nd.id} with no money`, () => api.startResearch(n, s5.nd.id), () => X.researchWhy(n, s5.nd.id)); check('research', 'with no money it is refused, with a reason', a3.r === false && /Needs/.test(a3.e.why), a3.e.kind + ': ' + a3.e.why); } } }
  // ---- mobilizing: Army Base first, a unit trained in its time, the queue limit
  { const {S, G} = fresh(102), n = 5, N = S.nations[n], p = N.capital; N.cash = 5000; for (const k of X.CK) if (k !== 'cash') N[k] = Math.max(N[k], k === 'mp' ? 500 : 500*X.RES_K);
    const fac0 = S.bld[p].fac || 0;
    if (!fac0){ const a = act(`recruit inf in ${G.P[p].cityName} with no Army Base`, () => api.recruit(n, p, 'inf'), () => X.canMobilize(n, p, 'inf')); check('mobilize', 'infantry without an Army Base is refused, with a reason', a.r === false && /Army Base/.test(a.e.why), a.e.kind + ': ' + a.e.why);
      const b = act(`build Army Base in ${G.P[p].cityName}`, () => api.build(n, p, 'fac')); const c = S.cons[p];
      check('mobilize', 'the Army Base goes under construction', b.r === true && c && c.k === 'fac', JSON.stringify(c));
      const h = hours((c ? c.h0 : 24) + 2, () => !S.cons[p]); check('mobilize', `the Army Base is done in its time (${c && c.h0} h)`, S.bld[p].fac === 1 && Math.abs(h - (c ? c.h0 : 0)) <= 1, `took ${h} h, level ${S.bld[p].fac}`); }
    const inf0 = countAt(S, n, p, 'inf'), need = X.trainH(p, 'inf', n), cash0 = N.cash;
    const r1 = act(`recruit inf in ${G.P[p].cityName}`, () => api.recruit(n, p, 'inf'), () => X.canMobilize(n, p, 'inf'));
    check('mobilize', 'the unit is queued and paid', r1.r === true && S.queue[p].length === 1 && N.cash < cash0, `queue ${JSON.stringify(S.queue[p])}, money ${cash0} -> ${N.cash}`);
    const r2 = act('recruit a second inf', () => api.recruit(n, p, 'inf')), r3 = act('recruit a third inf (queue limit 2)', () => api.recruit(n, p, 'inf'), () => X.queueWhy(n, p));
    check('mobilize', 'the training queue holds 2 and refuses a third, with a reason', r2.r === true && r3.r === false && /queue/i.test(r3.e.why), r3.e.kind + ': ' + r3.e.why);
    const h = hours(need + 2, () => countAt(S, n, p, 'inf') > inf0); check('mobilize', `the unit is ready in its time (${need} h) at the city`, countAt(S, n, p, 'inf') === inf0 + 1 && Math.abs(h - need) <= 1, `took ${h} h, infantry ${inf0} -> ${countAt(S, n, p, 'inf')}`);
    const q = G.P.find(P => S.owner[P.id] === n && !P.city && !P.sea); if (q){ const a = act(`recruit inf in ${q.name} (not a city)`, () => api.recruit(n, q.id, 'inf'), () => X.canMobilize(n, q.id, 'inf')); check('mobilize', 'outside a city it is refused, with a reason', a.r === false && a.e.why, a.e.kind + ': ' + a.e.why); }
    const t = X.UT.find(u => X.UNITS[u].tech && !X.unlocked(n, u) && X.UNITS[u].cls !== 'air'); if (t){ const a = act(`recruit ${t} (not researched)`, () => api.recruit(n, p, t), () => X.canMobilize(n, p, t)); check('mobilize', 'a unit not researched is refused, with a reason', a.r === false && /Research/.test(a.e.why), a.e.kind + ': ' + a.e.why); } }
  // ---- embark at a port, sail, land at a port; boarding and landing times; refused boarding away from a port
  { const {S, G} = fresh(103); let n = -1, p = -1, z = -1;
    for (const N of S.nations){ const P = G.P.find(P => S.owner[P.id] === N.id && X.navalCity(P.id) && P.nbs.some(v => G.P[v].sea)); if (P){ n = N.id; p = P.id; z = P.nbs.find(v => G.P[v].sea); break; } }
    const a = X.addArmy(n, p, {inf:3}); const eta = X.etaHours(a, [z]);
    const o1 = act(`orderMove 3 inf from port ${G.P[p].cityName} to sea ${G.P[z].name}`, () => api.orderMove(a, z), () => X.embarkWhy(a, z));
    check('embark', 'troops in a naval city may sail', o1.e.kind === 'done' && a.path.length === 1, `path ${JSON.stringify(a.path)}, eta ${eta} h`);
    let embSeen = null, h = 0; for (; h < 200 && !(a.at === z && a.to === null); h++){ api.tick(); if (a.emb != null && embSeen == null) embSeen = a.emb; }
    check('embark', `they reach the sea zone close to the ETA given at the order (${eta} h)`, a.at === z && Math.abs(h - eta) <= 1, `took ${h} h; boarding timer seen ${embSeen}; boarding time ${X.embarkH(a)} h`);
    const back = X.etaHours(a, [p]), o2 = act(`orderMove the troops back to port ${G.P[p].cityName}`, () => api.orderMove(a, p), () => X.embarkWhy(a, p));
    let landSeen = null; h = 0; for (; h < 200 && !(a.at === p && a.to === null && !(a.land > 0)); h++){ api.tick(); if (a.land > 0 && landSeen == null) landSeen = a.land; }
    check('embark', `they land at the port close to the ETA (${back} h), with a landing time`, o2.e.kind === 'done' && a.at === p && Math.abs(h - back) <= 1, `took ${h} h, landing timer seen ${landSeen} (landing ${X.landH(a, p)} h)`);
    const c = G.P.find(P => S.owner[P.id] === n && P.coast && !X.navalCity(P.id) && P.nbs.some(v => G.P[v].sea));
    if (c){ const b = X.addArmy(n, c.id, {inf:2}), zz = c.nbs.find(v => G.P[v].sea);
      const o3 = act(`orderMove 2 inf from ${c.name} (coast, no naval city) to sea`, () => api.orderMove(b, zz), () => X.embarkWhy(b, zz));
      check('embark', 'boarding away from a naval city is refused, with a reason', !b.path.length && o3.e.why ? (o3.e.kind === 'DOES NOTHING' ? 'warn' : true) : false, o3.e.kind + ' (the order changes nothing and tells nothing; the rules\' embarkWhy has the reason): ' + o3.e.why);
      const m = X.addArmy(n, c.id, {mar:2}); const o4 = act(`orderMove 2 Marines from ${c.name} to sea`, () => api.orderMove(m, zz), () => X.embarkWhy(m, zz));
      check('embark', 'Marines alone board on any coast', m.path.length === 1, o4.e.kind + `, path ${JSON.stringify(m.path)}`); } }
  // ---- movement over land and over sea: ETA at the order against the hours it really took
  { const {S, G} = fresh(104), out = [];
    for (const N of S.nations.slice(0, 40)){ const n = N.id, P = G.P.find(P => S.owner[P.id] === n && !P.sea && P.nbs.filter(v => S.owner[v] === n && !G.P[v].sea).length >= 1 && P.id !== N.capital);
      if (!P) continue; const q = P.nbs.find(v => S.owner[v] === n && !G.P[v].sea); const a = X.addArmy(n, P.id, out.length % 2 ? {tank:2} : {inf:2}); api.orderMove(a, q); out.push({a, q, eta:X.etaHours(a), n}); if (out.length >= 8) break; }
    let h = 0; for (; h < 120 && out.some(x => !(x.a.at === x.q && x.a.to === null)); h++){ api.tick(); for (const x of out) if (x.h == null && x.a.at === x.q && x.a.to === null) x.h = h + 1; }
    const bad = out.filter(x => x.h == null || Math.abs(x.h - x.eta) > 1);
    check('move', `${out.length} land moves to a neighbouring province arrive within an hour of their ETA`, out.length && !bad.length, out.map(x => `${x.eta}/${x.h}`).join(' ') + (bad.length ? ' (ETA/actual)' : ''));
    const N = S.nations.find(M => G.P.some(P => S.owner[P.id] === M.id && X.navalCity(P.id))), port = G.P.find(P => S.owner[P.id] === N.id && X.navalCity(P.id) && P.nbs.some(v => G.P[v].sea));
    const z0 = port.nbs.find(v => G.P[v].sea), z2 = (G.P[z0].nbs.map(v => G.P[v]).find(P => P.sea && P.id !== z0 && !port.nbs.includes(P.id)) || G.P[z0]).id, f = X.addArmy(N.id, port.id, {frig:2});
    const o = act(`orderMove 2 frigates from ${port.cityName} to ${G.P[z2].name}`, () => api.orderMove(f, z2)), e2 = X.etaHours(f), legs = f.path.length; h = 0; for (; h < 200 && !(f.at === z2 && f.to === null && !f.sail); h++) api.tick();
    check('move', `a fleet sails ${legs} legs within an hour of the ETA given at the order (${e2} h)`, o.e.kind === 'done' && f.at === z2 && Math.abs(h - e2) <= 1, `took ${h} h`);
    const inl = G.P.find(P => S.owner[P.id] === N.id && !P.sea && !P.coast); if (inl){ const o2 = act(`orderMove the fleet inland to ${inl.name}`, () => api.orderMove(f, inl.id)); check('move', 'a fleet ordered inland does not move (and says why)', !f.path.length ? (reasoned(o2) ? true : 'warn') : false, o2.e.kind); }
    const g = X.addArmy(N.id, N.capital, {inf:1}), far = G.P.find(P => !P.sea && S.owner[P.id] >= 0 && S.owner[P.id] !== N.id && relSt(S, N.id, S.owner[P.id]) === 'peace' && P.nbs.some(v => S.owner[v] === N.id));
    if (far){ const o3 = act(`orderMove infantry into ${far.name} (${S.nations[S.owner[far.id]].name}'s, at peace)`, () => api.orderMove(g, far.id)); check('move', 'a force does not walk into a nation at peace (and says why)', !g.path.length ? (reasoned(o3) ? true : 'warn') : false, o3.e.kind + (o3.e.why ? ': ' + o3.e.why : '')); }
    // an air wing: its mission, then the rearm time before the next one
    const ab = G.P.find(P => S.owner[P.id] === N.id && P.city); S.bld[ab.id].air = 1; const w = X.addArmy(N.id, ab.id, {jet:1}); w.air = {base:ab.id, cd:0};
    const tgt = G.P.find(P => !P.sea && S.owner[P.id] === N.id && P.id !== ab.id && X.hexDist(ab.cc, P.cc) >= 2 && X.hexDist(ab.cc, P.cc) <= 6);
    if (tgt){ const o4 = act(`orderAir patrol over ${tgt.name}`, () => api.orderAir(w, tgt.id), () => X.airCheck(w, tgt.id).why); h = 0; for (; h < 72 && w.fly; h++) api.tick();
      const cd = w.air.cd, o5 = act('orderAir again at once (rearming)', () => api.orderAir(w, tgt.id), () => X.airCheck(w, tgt.id).why);
      check('air', 'a wing flies its mission, comes back and must rearm before the next', o4.e.kind === 'done' && !w.fly && cd > 0 && o5.r === false && /Rearm/i.test(o5.e.why + o5.e.toast), `back after ${h} h, rearm ${cd} h; second order: ${o5.e.kind} ${o5.e.toast || o5.e.why}`);
      const farT = G.P.find(P => !P.sea && X.hexDist(ab.cc, P.cc) > X.wingRange(w) + 2); w.air.cd = 0; if (farT){ const o6 = act(`orderAir to ${farT.name}, out of range`, () => api.orderAir(w, farT.id), () => X.airCheck(w, farT.id).why); check('air', 'a mission out of range is refused, with a reason', o6.r === false && /range/i.test(o6.e.toast + o6.e.why), o6.e.kind + ': ' + (o6.e.toast || o6.e.why)); } } }
  // ---- convoys and blockades
  { const {S, G} = fresh(105); const T = X.trS(), r = T.routes.find(x => x.kind === 'sea' && x.b >= 0 && x.path && x.path.length >= 3);
    check('convoy', 'the new game has sea trade routes between nations', !!r, `${T.routes.length} routes, ${T.routes.filter(x => x.kind === 'sea').length} by sea`);
    if (r){ const inc0 = X.tradeIncome(r.a).cash, e = S.nations.find(N => N.id !== r.a && N.id !== r.b && N.alive && relSt(S, N.id, r.a) === 'peace' && relSt(S, N.id, r.b) === 'peace').id;
      const d = act(`declareWar ${S.nations[e].name} on ${S.nations[r.a].name}`, () => api.declareWar(e, r.a)); const z = r.path.filter(v => G.P[v].sea)[Math.floor(r.path.filter(v => G.P[v].sea).length/2)];
      const f = X.addArmy(e, z, {frig:3}), sp = X.trSpot(r, z); if (sp) f.pos = [sp.x, sp.y];   // (on the lane itself: a blockade reaches BLOCKADE_KM from where the fleet stands)
      const b = act(`blockadeSet: 3 ${S.nations[e].name} frigates on the route's lane in ${G.P[z].name}`, () => X.blockadeSet(f, true));
      check('convoy', 'a blockade on the route reroutes, contests or cuts it', d.r === true && b.r === true && (r.why !== '' || r.f0 < 1), `route ${r.id} ${S.nations[r.a].name}-${S.nations[r.b].name}: why "${r.why}", flow now ${r.f0}`);
      const fr = r.f; hours(25); check('convoy', 'the next daily trade counts the blockade (flow below 1 or the route rerouted)', r.f < 1 || r.why === 'rerouted' || !T.routes.includes(r), `flow ${fr} -> ${r.f}, why "${r.why}", money from trade ${inc0.toFixed(1)} -> ${X.tradeIncome(r.a).cash.toFixed(1)}`);
      const esc = X.addArmy(r.a, z, {frig:1}); const es = act(`escortSet: a ${S.nations[r.a].name} frigate escorts route ${r.id}`, () => api.escortSet(esc, r.id)); check('convoy', 'a fleet can be set to escort its route', esc.escort === r.id, es.e.kind);
      const raidr = T.routes.find(x => x.kind === 'sea' && (x.a === r.a || x.b === r.a) && x !== r); if (raidr){ const rf = X.addArmy(e, raidr.path.find(v => G.P[v].sea), {sub:2}); const ra = act(`raidSet: ${S.nations[e].name} submarines raid route ${raidr.id}`, () => X.raidSet(rf, raidr.id)); check('convoy', 'a fleet can be set to raid an enemy route', ra.r === true && rf.raid && rf.raid.r === raidr.id, ra.e.kind); }
      const tc = act(`tradeOpen ${S.nations[r.a].name} with ${S.nations[e].name} (at war)`, () => api.tradeOpen(r.a, e)); check('convoy', 'a route with an enemy is refused, with a reason', typeof tc.r === 'string', tc.e.kind + ': ' + tc.r); } }
  // ---- diplomacy: war, a second declaration, peace (truce), its end, an alliance
  { const {S, G} = fresh(106); const pr = (() => { for (const P of G.P){ const o = S.owner[P.id]; if (o < 0 || P.sea) continue; for (const v of P.nbs){ const q = S.owner[v]; if (q >= 0 && q !== o && !G.P[v].sea) return [o, q]; } } })(), [a, b] = pr;
    const d1 = act(`declareWar ${S.nations[a].name} on ${S.nations[b].name}`, () => api.declareWar(a, b)); const R0 = S.rel[rk(a, b)];
    check('diplomacy', 'a declaration starts the war at once, by the declarer', d1.r === true && R0.st === 'war' && R0.by === a, JSON.stringify(R0));
    const d2 = act('declareWar again', () => api.declareWar(a, b)); check('diplomacy', 'a second declaration is refused', d2.r === false, d2.e.kind);
    const acc = act(`acceptOffer: would ${S.nations[b].name} take peace?`, () => api.acceptOffer(b, a, 'peace'), null, true); check('diplomacy', 'the AI answers a peace offer with a reason, and the question changes nothing', acc.r && typeof acc.r.why === 'string' && acc.e.kind === 'answer', acc.e.kind + ' ' + acc.e.r);
    const pc = act('applyDeal peace', () => api.applyDeal(a, b, 'peace')); const R1 = S.rel[rk(a, b)];
    check('diplomacy', 'peace makes a 10-day truce', R1.st === 'truce' && R1.until === S.hour + 240, JSON.stringify(R1));
    const d3 = act('declareWar during the truce', () => api.declareWar(a, b)); check('diplomacy', 'war during a truce is refused (with a reason)', d3.r === false ? (reasoned(d3) ? true : 'warn') : false, d3.e.kind + ' (declareWar returns false, no toast)');
    R1.until = S.hour + 2; hours(3); const R2r = S.rel[rk(a, b)]; check('diplomacy', 'the truce ends at its time and becomes peace', R2r.st === 'peace' && R2r.afterTruce, JSON.stringify(R2r));
    const al = act('applyDeal ally', () => api.applyDeal(a, b, 'ally')); check('diplomacy', 'an alliance is made', S.rel[rk(a, b)].st === 'ally', al.e.kind);
    const c = S.nations.find(N => N.id !== a && N.id !== b && relSt(S, N.id, b) === 'peace' && relSt(S, N.id, a) === 'peace').id, d4 = act(`declareWar ${S.nations[c].name} on ${S.nations[b].name} (ally of ${S.nations[a].name})`, () => api.declareWar(c, b));
    check('diplomacy', 'an attacked ally may be joined (a seat is told, not dragged in)', d4.r === true && relSt(S, c, a) !== 'war', `${S.nations[a].name} v ${S.nations[c].name}: ${relSt(S, c, a)}`); }
  return {res, note, s:(Date.now() - t0)/1000}; }
// the mechanic checks (above, in this copy of the rules) printed, then the --scenarios modes of the other tools
function scenarios(){ const {res, note, s} = mechanics();
  console.log(`MECHANIC SCENARIOS (nations world, every nation a seat that gives no orders; ${s.toFixed(1)} s)`);
  for (const r of res) console.log(`  ${r.ok === 'warn' ? 'WARN' : r.ok ? 'PASS' : 'FAIL'}  ${r.cs.padEnd(10)} ${r.name}${r.detail ? '   [' + String(r.detail).slice(0, 220) + ']' : ''}`);
  const odd = note.filter(e => e.kind === 'DOES NOTHING' || e.kind === 'REFUSED SILENTLY' || e.kind === 'THREW' || e.kind === 'QUERY CHANGED THE STATE');
  console.log(`ORDERS: ${note.length} given; ${note.filter(e => e.kind === 'done').length} done, ${note.filter(e => /^refused/.test(e.kind)).length} refused with a reason, ${note.filter(e => e.kind === 'answer').length} questions answered, ${odd.length} odd (an action that does nothing, or a refusal with no reason anywhere):`);
  for (const e of odd) console.log(`  ${e.kind}: ${e.label} -> returned ${e.r}${e.err ? ' ' + e.err : ''}`);
  const bad = res.filter(r => r.ok === false).length;
  // the scenario modes of the other tools (combat and ranged, economy and trade, occupation)
  let other = 0; for (const t of ['stack-duel.js', 'eco-check.js', 'rebels-sim.js']){ const cp = require('child_process'); const r = cp.spawnSync(process.execPath, [path.join(__dirname, t), '--scenarios'], {encoding:'utf8', maxBuffer:1 << 26});
    console.log(`\n== node tools/${t} --scenarios (exit ${r.status})`); console.log((r.stdout || '').trim()); if (r.stderr) console.log(r.stderr.trim().split('\n').slice(0, 8).join('\n')); if (r.status) other++; }
  console.log(`\nSCENARIOS ${bad || other ? 'FAILED' : 'OK'}: ${res.filter(r => r.ok === true).length} of ${res.length} mechanic checks passed here, ${res.filter(r => r.ok === 'warn').length} with a warning (no reason given), ${bad} failed${other ? `; ${other} other tool(s) failed` : ''}`);
  process.exit(bad || other ? 1 : 0); }
