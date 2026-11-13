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
/* Stack efficiency (limits and factors: STACK_* in rules/data.js; the table: docs/COMBAT.md).
   Size is counted per domain inside one force: land = its ground units (embarked troops at sea count as land), sea = its ships, air = its
   aircraft in cards (a card of swarm drones counts once). Over its limit a domain's units deal stackEffN of their damage and the force moves
   at stackSpdN of its speed (the worst domain sets the pace). It scales each FORCE's damage; frontage still scales each SIDE's damage in a
   province: side damage = Σ_forces (unit damage × stackEff(force)) × frontScale(side units, front) × flank bonus. Both sides of a fight see the
   same frontage for the same number of units, so one stack of 128 deals 25% of what thirteen stacks of 10 deal in the same place: splitting never
   loses. Splitting helps fully only when the front is wide enough: attack from several provinces (sideFront) to bring more units into line. */
const stackEffN = (n, L) => n <= L ? 1 : Math.max(STACK_FLOOR, 1 - STACK_K*Math.log(n/L));
const stackSpdN = (n, L) => n <= L ? 1 : Math.max(STACK_SPD_FLOOR, 1 - STACK_SPD_K*Math.log(n/L));
const domT = t => UNITS[t].cls === 'air' ? 'air' : UNITS[t].cls === 'naval' ? 'sea' : 'land', DOM_T = Object.fromEntries(UT.map(t => [t, domT(t)]));
// a force's size per domain: {land, sea, air}
function stackSizes(a){ const r = {land:0, sea:0, air:0}; if (!a || !a.u) return r;
  for (const t of UT){ const v = a.u[t]; if (!v) continue; const d = DOM_T[t]; r[d] += d === 'air' ? Math.ceil(v/rPack(a.owner >= 0 ? a.owner : 0, t) - 1e-9) : v; }
  return r; }
// damage factors per domain of force a: {land, sea, air} (1 at or under the limit); index with DOM_T[unit type]
const STACK_ONE = Object.freeze({land:1, sea:1, air:1});
const stackEffs = a => { if (count(a) <= 5) return STACK_ONE; const z = stackSizes(a); return {land:stackEffN(z.land, STACK_LIM.land), sea:stackEffN(z.sea, STACK_LIM.sea), air:stackEffN(z.air, STACK_LIM.air)}; };
// the stack penalty of a force, for the rules and the panels: the domain that is furthest over its limit (or the force's main domain), its limit
// and size, the damage and speed factors (1 = no penalty), and the per-domain detail
function stackPenalty(a){ const z = stackSizes(a); let dom = null, dmg = 1, spd = 1;
  for (const d of ['land', 'sea', 'air']){ if (!z[d]) continue; const e = stackEffN(z[d], STACK_LIM[d]), s = stackSpdN(z[d], STACK_LIM[d]);
    if (!dom || e < dmg || (e === dmg && z[d]/STACK_LIM[d] > z[dom]/STACK_LIM[dom])) dom = d; dmg = Math.min(dmg, e); spd = Math.min(spd, s); }
  dom = dom || (a && a.air ? 'air' : 'land');
  return {dom, limit:STACK_LIM[dom], size:z[dom], dmg, spd, over:z[dom] > STACK_LIM[dom], sizes:z}; }
// what forces a and b would be merged together (the merge warning)
function stackPenaltyIf(a, b){ const m = {owner:a.owner, air:a.air || b.air, u:{}}; for (const t of UT) m.u[t] = (a.u[t] || 0) + (b.u[t] || 0); return stackPenalty(m); }
// the force's damage and speed factors as a short text: "Over stack limit: −39% damage, −10% speed" ('' when within the limit)
const stackText = P => P.over ? `Over stack limit: −${Math.round((1 - P.dmg)*100)}% damage, −${Math.round((1 - P.spd)*100)}% speed` : '';
const stackSpd = a => { if (count(a) <= 5) return 1; const z = stackSizes(a); return Math.min(stackSpdN(z.land, STACK_LIM.land), stackSpdN(z.sea, STACK_LIM.sea), stackSpdN(z.air, STACK_LIM.air)); };   // (no domain is over its limit in a force of 5 or fewer)
// the weighted damage factor of a whole force (the odds preview and the AI's estimates)
function stackDmg(a){ const e = stackEffs(a); if (e.land === 1 && e.sea === 1 && e.air === 1) return 1; let s = 0, w = 0; for (const t of UT){ const v = a.u[t]; if (!v) continue; const k = v*(UNITS[t].atk || 0.1); s += k*e[DOM_T[t]]; w += k; } return w ? s/w : 1; }
/* Battle pace. Battles resolve in BATTLE_Q steps per game hour (one every 15 in-game minutes, rules/tick.js: battleStep); each step deals BATTLE_DMG of the
   old hourly damage, so the damage per hour is the old one times BATTLE_PACE. BATTLE_PACE is THE slowdown knob: 1 = today's pace; docs/COMBAT-PACE.md proposes a
   lower value (fights last several hours; big ones a day or more). Air strikes, missiles, artillery shelling and buildings do not use it. */
const BATTLE_Q = 4, BATTLE_PACE = 0.5, BATTLE_DMG = BATTLE_PACE/BATTLE_Q;
// healing: a hospital building (planned, LATER.md) will multiply the healing in its city: the one place to hook it in
const hospitalF = p => 1;
// units' healing per day, as a share of their health: 25% in an own city (ships 40% and more in an own shipyard city), 10% in the field, aircraft by maintenance; the Logistician commander +50% per rank
function healPerDay(a){ const own = a.to === null && S.owner[a.at] === a.owner;
  return (a.air ? maintRate(a)*1.2 : (own && S.bld[a.at].yard && shipsN(a) ? 0.4*(1 + 0.2*Math.max(0, S.bld[a.at].yard - 2)) : own && G.P[a.at].city ? 0.25 : 0.10)*(1 + 0.5*cmdF(a, 'supply')))*(own ? hospitalF(a.at) : 1); }
// what a force's wounds are doing now, for the army bar: {kind:'fight'|'cut'|'heal'|'full'|'move', rate (share of health a day), city}
function healInfo(a){ const hurtN = UT.some(t => a.w[t] > 0.01);
  if (a.to === null && S.battles.includes(a.at)) return {kind:'fight', rate:0, city:false};
  if (!a.air && !supplied(a) && !cmdF(a, 'supply')) return {kind:'cut', rate:0.04, city:false};
  if (!hurtN) return {kind:'full', rate:0, city:false};
  const own = a.to === null && S.owner[a.at] === a.owner && !!G.P[a.at].city; return {kind:'heal', rate:healPerDay(a), city:own}; }
// damage factors of the missiles against each class of unit (a missile's strength times these)
const MSL_VS = {soft:1.2, armored:1, air:0.4, naval:0.9};
/* ---------------- Army Info: the Strength table ----------------
   For each kind of target (the owner's ten rows) the average attack, and the average defence against an attacker of that kind, of one unit of the force as it is NOW
   (current, after every modifier the rules apply in a fight in the force's province: terrain, morale and supply, stack efficiency, commander, landing, season, river,
   shortages of fuel, iron and electronics, home soil, fortifications) and as it would be with none of them (base: the unit's research-boosted stat times the damage class table).
   It reads the same numbers battleStep reads; it is a pure function (armyStrength(a) -> {rows, ctx}). Class mapping (what the rules have for each row):
     infantry -> class soft (an Infantry unit as the target)      armour -> class armored (a Tank)       jets -> class air (a Strike Jet)    helicopters -> class air (an Attack Helicopter)
     drones -> class air (a Strike Drone)       ships -> class naval (a Frigate)      submarines -> class naval (a Submarine; patrol planes hit them hardest)
     missiles: attack = the chance this force's SAMs and frigates shoot down a cruise missile; defence = the damage a missile does to its units (MSL_VS)
     buildings: attack = bomb load (a Heavy Bomber = 1; no other unit wrecks buildings by combat); defence = none (a dash)
     population: attack = war damage a strike adds (bombers 3 per bomber, artillery shelling 1.2 a game hour); defence = none (a dash) */
const STR_ROWS = [{k:'inf', name:'Infantry', t:'inf'}, {k:'armor', name:'Armour', t:'tank'}, {k:'jet', name:'Jets', t:'jet'}, {k:'heli', name:'Helicopters', t:'heli'}, {k:'drone', name:'Drones', t:'sdrone'},
  {k:'msl', name:'Missiles', t:null}, {k:'ship', name:'Ships', t:'frig'}, {k:'sub', name:'Submarines', t:'sub'}, {k:'bld', name:'Buildings', t:null}, {k:'pop', name:'Population', t:null}];
// the part of a stat st() takes off for a shortage of fuel, iron or electronics (mirrors st() in rules/state.js)
function shortFx(o, t, k){ if (o < 0 || !S.nations[o]) return 1; const sh = S.nations[o].short || {}, U = UNITS[t]; let f = 1;
  if (sh.oil && U.fuel && k === 'atk') f *= 0.7;
  if (sh.iron && MAINT[t].iron >= 0.05*RES_K){ if (k === 'atk') f *= 0.8; if (k === 'def') f *= 0.85; }
  if (sh.elec && MAINT[t].elec >= 0.05*RES_K){ if (k === 'atk') f *= 0.8; if (k === 'def') f *= 0.9; }
  return f; }
function armyStrength(a, blind = false){   // blind: a force that is not yours: the base stats of its unit types only (its research, morale and condition are not known to you)
  const o = a.owner, p = a.at, P = G.P[p], sea = !!P.sea, holder = S.owner[p], atkr = o !== holder, mine = o >= 0 && holder === o, N = o >= 0 ? S.nations[o] : null;
  const stv = (t, k) => blind ? UNITS[t][k] : st(o, t, k), shF = (t, k) => blind ? 1 : shortFx(o, t, k), types = UT.filter(t => a.u[t] > 0), n = types.reduce((s0, t) => s0 + a.u[t], 0);
  const TFo = sea ? null : tuf(P.terrain || 'plains', atkr, !arctic(o)), se = stackEffs(a), mrl = a.owner < 0 ? 1 : 0.5 + 0.5*(a.m ?? 80)/100, sup = a.owner < 0 || supplied(a) ? 1 : 0.85, wear = a.air && a.air.wear ? 1 - 0.45*a.air.wear : 1;
  const cB = atkr ? 1 + 0.1*cmdF(a, 'blitz') : 1, cG = 1 + 0.2*cmdF(a, 'gunner'), land = a.landed != null && S.hour - a.landed < 24 ? rLandF(o) : 1, szn = atkr && season(p) ? SEASON_FX[season(p)].atk : 1;
  const riv = atkr && a.from != null && !sea && P.river.has(a.from) ? RIVER_ATK : 1;
  // factors on the attack of one unit of type t: name -> factor
  const aF = t => blind ? {} : ({morale:mrl*wear, supply:sup, terrain:TFo ? (t === 'spec' ? rSpecTerr(o, TFo[t]) : TFo[t]) : 1, stack:se[DOM_T[t]], commander:cB*(t === 'art' || t === 'sam' || t === 'mlrs' ? cG : 1),
    landing:land, season:szn, river:t === 'ifv' && riv < 1 && has(o, 'ifv_terr') ? 1 : riv, shortage:shortFx(o, t, 'atk')});
  // the damage taken is scaled by dF (the product of these): the defence is its inverse
  const fort = mine ? S.bld[p].fort || 0 : 0, dd = docOf(o), sea1 = sea && ground(a) ? (shipsN(a) > 0 ? 0.75 : 1.5) : 1;
  const dTake = t => blind ? {} : ({'home soil':mine ? 1/1.25 : 1, fortifications:mine ? Math.pow(0.8, fort) : 1, doctrine:mine && dd && dd.home && S.home[p] === o ? dd.home : 1, terrain:!sea && (mine || (holder < 0 && o < 0)) ? 1/terr(p).def : 1,
    'field hospitals':rHospF(o), 'at sea':UNITS[t].cls === 'soft' || UNITS[t].cls === 'armored' ? sea1 : 1, commander:mine ? 1 - 0.12*cmdF(a, 'shield') : 1, 'dug in':digF(a)});
  const out = [];
  for (const R of STR_ROWS){
    const row = {k:R.k, name:R.name, atk:{base:null, cur:null, why:[], unit:'', total:false}, def:{base:null, cur:null, why:[], unit:'', immune:false}};
    // weighted mean of each factor: why[label] = [sum(w*f), sum(w)]
    const wa = {}, wd = {}, add = (W, nm, f, w) => { const e = W[nm] || (W[nm] = [0, 0]); e[0] += w*f; e[1] += w; };
    if (R.t){
      let aB = 0, aC = 0, aN = 0, dB = 0, dC = 0, dN = 0, imm = true;
      for (const t of types){ const c = a.u[t], U = UNITS[t];
        const a0 = stv(t, 'atk')/shF(t, 'atk'), M = multU(t, R.t);
        if (a0 > 0){ const f = aF(t); let prod = 1; for (const k in f) prod *= f[k]; const b = a0*M; aB += c*b; aC += c*b*prod; aN += c; for (const k in f) add(wa, k, f[k], c*b); }
        const Md = multU(R.t, t), d0 = stv(t, 'def')/shF(t, 'def');
        if (Md > 0.001){ imm = false; const f = dTake(t), sf = shF(t, 'def'); let prod = 1; for (const k in f) prod *= f[k]; const b = d0/Md; dB += c*b; dC += c*b*sf/prod; dN += c; for (const k in f) add(wd, k, 1/f[k], c*b); add(wd, 'shortage', sf, c*b); }
        else { dN += c; } }
      if (aN){ row.atk.base = aB/aN; row.atk.cur = aC/aN; }
      if (dN && !imm){ row.def.base = dB/dN; row.def.cur = dC/dN; } else if (imm && dN) row.def.immune = true;
    } else if (R.k === 'msl'){
      const sams = (a.u.sam || 0) + 0.6*(a.u.frig || 0), sh = blind ? 1 : rShield(o), sat = blind ? 1 : 1 - (a.sat || 0);
      if (sams > 0){ row.atk.unit = '%'; row.atk.total = true; row.atk.base = 100*(1 - Math.pow(1 - 0.12, sams*sh)); row.atk.cur = 100*(1 - Math.pow(1 - 0.12, sams*sh*sat)); if (sat < 1) add(wa, 'saturated', sat, 1); }
      let dB = 0, dN = 0, dC = 0; for (const t of types){ const c = a.u[t], d0 = stv(t, 'def')/shF(t, 'def'), Md = MSL_VS[UNITS[t].cls], f = dTake(t), sf = shF(t, 'def'); let prod = 1; for (const k in f) prod *= f[k]; dB += c*d0/Md; dC += c*d0/Md*sf/prod; dN += c; for (const k in f) add(wd, k, 1/f[k], c*d0/Md); add(wd, 'shortage', sf, c*d0/Md); }
      if (dN){ row.def.base = dB/dN; row.def.cur = dC/dN; }
    } else if (R.k === 'bld'){
      let bB = 0, bC = 0; for (const t of types){ const c = a.u[t]; if (!UNITS[t].bmb) continue; bB += c*UNITS[t].bmb; bC += c*(blind ? UNITS[t].bmb : rBombF(o, t)); }
      if (bB){ row.atk.base = bB; row.atk.cur = bC; row.atk.total = true; row.atk.unit = ' bomb load'; }
    } else if (R.k === 'pop'){
      let w = 0; for (const t of types) if (UNITS[t].bmb) w += a.u[t]*3*(blind ? UNITS[t].bmb : rBombF(o, t)); if (a.u.art || a.u.mlrs) w += 1.2;
      if (w){ row.atk.base = w; row.atk.cur = w; row.atk.total = true; row.atk.unit = ' war damage'; }
    }
    const fin = (W, why) => { for (const k in W){ const [sw, w] = W[k], f = w > 0 ? sw/w : 1; if (Math.abs(f - 1) > 0.004) why.push([k, f]); } };
    fin(wa, row.atk.why); fin(wd, row.def.why);
    out.push(row); }
  return {rows:out, units:n, ctx:{blind, attacking:atkr, home:mine, dug:!blind && digF(a) < 1, terrain:sea ? 'Open sea' : terr(p).name, stack:stackPenalty(a), morale:Math.round(a.m ?? 80), supplied:sup === 1}};
}
/* ---------------- Unit stats by research (the research card's i button) ----------------
   unitStrength(n, t, T): the full stats of ONE unit of type t for nation n with the research levels T ({node id: level}; omitted: the nation's own),
   before any battle modifier, so a player can compare units: health, speed (km/day: marching or sailing speed, aircraft their flight speed), vision
   (km), attack range (km: the guns' and launchers' reach, or an aircraft's mission radius; null: it fights where it stands), and for each Army Info
   row but population (STR_ROWS) the attack and the defence the way armyStrength reads its base values: the research-boosted stat (with the nation's
   doctrine) times the damage class table, with the counters research changes (R_VS). Pure: nothing is changed.
   unitSteps(n, t): the research steps of t's line that change any of those numbers, in the tree's order (Firepower and Protection by level, the
   upgrades that change a stat, the generations): [{id, lv, T}], T being the line's unlock plus that step (a generation with the ones before it). */
function unitStrength(n, t, T){
  const N = n >= 0 && S.nations[n] ? S.nations[n] : null, U = UNITS[t], dc = N ? DOCTRINES[N.doc] : null; T = T || (N && N.tech) || {};
  const lv = id => T[id] != null ? +T[id] || 0 : RN[id] && RN[id].std ? 1 : 0, hasT = id => lv(id) > 0, air = U.cls === 'air';
  const stat = k => { let v = U[k] || 0; for (const nd of RNODES_U[t] || []){ const l = +T[nd.id] || 0; for (let i = 0; i < l && i < nd.lv.length; i++){ const x = nd.lv[i].fx[k]; if (x) v += x; } }
    if (k === 'atk' || k === 'def'){ v *= MARK_F[Math.min(3, +T[t + (k === 'atk' ? '_fp' : '_pr')] || 0) + 1]; if (dc) v *= dc[k] || 1; } return v; };   // (as st(), without shortages)
  const mo = k => { const r = R_VS[t] && R_VS[t][k]; return r && hasT(r[0]) ? r[1] : mult(t, k); }, mU = u => U.vsU && U.vsU[u] != null ? U.vsU[u] : mo(UNITS[u].cls);
  const ul = (() => { const i = UAV_TECH.findIndex(id => !hasT(id)); return Math.max(1, i < 0 ? UAV_TECH.length : i); })(), uav = t === 'drone' ? UAV_LV[ul] : null;
  const atk = stat('atk'), def = stat('def');
  const vis = uav ? uav.vis : t === 'awacs' ? VIS_KM.aew*([1, 1.15, 1.3][lv('awacs_radar')] || 1) : t === 'mpa' ? VIS_KM.mpa*([1, 1.2, 1.4][lv('mpa_sonar')] || 1)
    : U.vis*((t === 'at' && hasT('at_eye')) || (t === 'spec' && hasT('spec_eye')) ? 1.5 : 1);
  const rng = air ? (uav ? uav.range : (AIR_RANGE[t] || 12) + stat('rng'))*KM_HEX : RANGE_KM[t] ? RANGE_KM[t] + (t === 'mlrs' && hasT('mlrs_rng') ? RANGE_ER : 0) : null;
  const spd = Math.round((air ? AIR_SPEED*(AIR_SPF[t] || 1)*24 : stat('spd'))*KM_HEX/10)*10;
  const rows = STR_ROWS.filter(R => R.k !== 'pop').map(R => { const r = {k:R.k, name:R.name, atk:null, def:null, immune:false, unit:''};
    if (R.t){ if (atk > 0) r.atk = atk*mU(R.t); const Md = multU(R.t, t); if (Md > 0.001) r.def = def/Md; else r.immune = true; }
    else if (R.k === 'msl'){ const w = t === 'sam' ? 1 : t === 'frig' ? 0.6 : 0; if (w){ r.atk = 100*(1 - Math.pow(1 - 0.12, w*([1, 2, 2.5, 3][lv('msl3')] || 1))); r.unit = '%'; } r.def = def/MSL_VS[U.cls]; }
    else if (R.k === 'bld' && U.bmb){ r.atk = t === 'stealth' && hasT('stealth_bay') ? 0.75 : U.bmb; r.unit = 'bomb load'; }
    return r; });
  return {t, hp:stat('hp'), spd, vis:Math.round(vis), rng:rng == null ? null : Math.round(rng), rngKind:air ? 'mission' : rng == null ? null : 'fire', rows}; }
function unitSteps(n, t){ const L = (RNODES_U[t] || []).filter(nd => nd.kind !== 'unlock'), base = {['u_' + t]:1}, key = T => JSON.stringify(unitStrength(n, t, T)), k0 = key(base), out = [];
  for (const nd of L) for (let l = 1; l <= nd.lv.length; l++){ const T = {...base, [nd.id]:l};
    if (nd.kind === 'gen') for (const m of L) if (m.kind === 'gen' && m.gen < nd.gen) T[m.id] = 1;
    if (key(T) !== k0) out.push({id:nd.id, lv:l, T}); }
  return out; }
/* ---------------- Commanders ---------------- */
const TRAITS = {
  blitz:{name:'Blitz', icon:'»', desc:'+15% speed; +10% attack when attacking (×rank)'},
  shield:{name:'Shield', icon:'◆', desc:'Takes 12% less damage when defending (×rank)'},
  gunner:{name:'Artillerist', icon:'✦', desc:'Artillery and SAMs +20% attack (×rank)'},
  supply:{name:'Logistician', icon:'✚', desc:'No attrition when cut off; heals 50% faster (×rank)'},
  siege:{name:'Siegemaster', icon:'▲', desc:'Embarks at ports and lands from the sea 20% faster (×rank)'},   // (captures are immediate at a province's heart: rules/movement.js cmdEmbF)
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
// the forces in each province (a.at), in S.armies order: a tick's lookup (rules/core.js), made again when the list of forces changes (a new list,
// or forces added to it: addArmy appends them) or a force changed province (atMove). byAt(p) is S.armies.filter(a => a.at === p), p a province
let AX = null;
const axOk = () => AX !== null && AX.A === S.armies && AX.n === S.armies.length && AX.v === ATV && AX.t === tickSess && AX.G === G;
function armiesAt(){ if (axOk()) return AX.by; const A = S.armies;
  const by = new Array(G.P.length).fill(NONE); let up = true, last = -Infinity;
  for (const a of A){ if (!(a.id > last)) up = false; last = a.id; const p = a.at; if ((p | 0) !== p) continue; const l = by[p]; if (l === undefined) continue; if (l === NONE) by[p] = [a]; else l.push(a); }
  AX = {A, n:A.length, v:ATV, t:tickSess, G, by, up, last}; return by; }
// a force moves to province p: while the lookup is current and S.armies runs in id order (addArmy numbers the forces in turn, so it does), the
// force leaves its old list and joins the new one at its place by id: the lists stay S.armies.filter(a => a.at === p)
function atMove(a, p){ const o = a.at, ok = axOk() && AX.up; a.at = p; ATV++; if (!ok) return;
  const L = AX.by[o], N = AX.by[p], i = L ? L.indexOf(a) : -1; if ((o | 0) !== o || (p | 0) !== p || i < 0 || N === undefined) return;
  if (L.length === 1) AX.by[o] = NONE; else L.splice(i, 1);
  if (N === NONE) AX.by[p] = [a]; else { let lo = 0, hi = N.length; while (lo < hi){ const m = (lo + hi) >> 1; if (N[m].id < a.id) lo = m + 1; else hi = m; } N.splice(lo, 0, a); }
  AX.v = ATV; }
const byAt = p => { if (tickDepth > 0 && (p | 0) === p){ const l = armiesAt()[p]; if (l !== undefined) return l; } return null; };   // null: scan S.armies
function stationaryAt(p){ const l = byAt(p); return (l || S.armies).filter(a => a.at === p && a.to === null && !a.fly && !a.air); }
function enemiesAt(p, owner){ const l = byAt(p); return (l || S.armies).some(a => a.at === p && a.to === null && !a.fly && !a.air && atWar(a.owner, owner) && count(a) > 0); }
// (provinces with no such force share one empty, frozen list: the callers only read the lists)
const IDX0 = Object.freeze([]);
function index(){ const by = new Array(G.P.length).fill(IDX0); for (const a of S.armies) if (a.to === null && !a.fly && !a.air){ const l = by[a.at]; if (l === IDX0) by[a.at] = [a]; else l.push(a); } return by; }
// a force is dug in when it has stood 12 game hours or more on its own ground (or in a friendly fortified province), or holds the Defend stance
const DIG_H = 12;
const dugIn = a => !!a && !a.air && !a.fly && a.to === null && !a.path.length && !G.P[a.at].sea && count(a) > 0 &&
  (a.stance === 'defend' || (a.still != null && S.hour - a.still >= DIG_H && (S.owner[a.at] === a.owner || (S.bld[a.at].fort > 0 && S.owner[a.at] >= 0 && a.owner >= 0 && friendly(a.owner, S.owner[a.at])))));
// a dug-in force defending where it stands takes DIG_DEF times the damage (0.8: about +25% defence), like home soil and fortifications: in its
// battles (tick.js battleStep), under ranged fire (rangedStep), under air strikes (air.js) and in the odds. Only while it defends its own or a
// friend's province: a force on the move is never dug in (dugIn), and one with the Defend stance in a province held by a foe is attacking
const DIG_DEF = 0.8;
const digF = a => dugIn(a) && (S.owner[a.at] === a.owner || friendly(a.owner, S.owner[a.at])) ? DIG_DEF : 1;
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
/* ---------------- Ranged fire: the attack range (Conflict of Nations) ----------------
   Mobile Artillery, Rocket Artillery and the warships (RANGE_KM, RANGE_HIT in rules/data.js; the table: docs/COMBAT.md) fire from where they stand
   (armyXY: their exact spot, not the province centre) at enemy forces whose own spot lies within their range AND that their side can see
   (rules/vision.js armyVisible: no firing blind), without moving into the province. Land guns fire from land at forces on land; frigates and
   cruisers at ships and at forces on the coast (shore bombardment); submarines torpedo ships only. A shooter fires while it stands (not marching,
   not fighting a battle in its own province, fire not on 'hold'); its targets may stand, fight or march.
   It runs in every 15-minute battle step (rules/tick.js), each step a quarter (1/BATTLE_Q) of the hourly damage; BATTLE_PACE does not apply.
   Damage per hour of a unit type: n × attack × K × RANGED_F (the old artillery shelling factor), × morale and supply, × the Artillerist commander
   (guns), × the force's stack efficiency, × a ±20% roll, × the target province's cover for shells (terrain .art, at most 1; none at sea), and the
   holder's fortifications; Long-Range Bombardment (crui_rng) +30% for cruisers against the coast. Each unit type's damage is shared by the forces
   of the fired-at group that it reaches, by their health, as in a battle.
   Target: the player's Bombard order (a.tgt: {id} one force, {p} the forces in one province; orderBombard) while it is in range and seen; else
   the province holding the strongest visible enemy power in range (as the old rule chose a province). */
// the ranged unit types of force a that can fire where it is: [[type, count, km]] (land guns only from land: embarked guns at sea do not fire)
function rangedOf(a){ const r = []; if (!a || !a.u || a.air || a.fly) return r; const sea = G.P[a.at].sea;
  for (const t of RANGED_T){ const n = a.u[t]; if (!n || (RANGE_HIT[t] === 'land' && sea)) continue; r.push([t, n, rRangeKm(a.owner, t)]); } return r; }
// a force's longest attack range in km (0: no ranged unit that can fire where it is)
const rangeOf = a => rangedOf(a).reduce((m, e) => Math.max(m, e[2]), 0);
// km between two points of the map, across its east-west seam
function kmBetween(x1, y1, x2, y2){ let dx = Math.abs(x1 - x2); dx = Math.min(dx, WORLD_W - dx); return Math.hypot(dx, y1 - y2)/KM_W; }
// can a unit of type t hit force b: land guns hit forces on land, torpedoes only warships at sea, naval guns both
function rangedHits(t, b){ const sea = G.P[b.at].sea, h = RANGE_HIT[t]; return h === 'land' ? !sea : h === 'ships' ? sea && shipsN(b) > 0 : true; }
// is force b an enemy of nation o that ranged fire can aim at (a force on the ground or at sea, not an air wing)
const rangedFoe = (o, b) => b.owner >= 0 && b.owner !== o && !b.air && !b.fly && count(b) > 0 && atWar(o, b.owner);
// the enemy forces force a can fire at from (x, y) (default: where it stands), out of `list` (default: every force): visible ones only,
// [{b, km, x, y, ts: the unit types of a that reach and can hit it}]
function rangedTargets(a, x, y, list){ const R = rangedOf(a); if (!R.length) return []; if (x == null) [x, y] = armyXY(a);
  const mx = R.reduce((m, e) => Math.max(m, e[2]), 0), out = []; let vis = null;
  for (const b of list || S.armies){ if (!rangedFoe(a.owner, b)) continue; const [bx, by] = armyXY(b), km = kmBetween(x, y, bx, by); if (km > mx) continue;
    const ts = []; for (const e of R) if (e[2] >= km && rangedHits(e[0], b)) ts.push(e[0]); if (!ts.length) continue;
    if (!armyVisible(b, vis || (vis = visibleSet(a.owner)))) continue; out.push({b, km, x:bx, y:by, ts}); }
  return out; }
// the forces ranged fire may aim at, in a grid of RG_C world units by where they stand (built once per step, only when something can fire)
const RG_C = 24, RT_ROLL = RANGED_T.join(',') === 'art,mlrs,frig,crui,sub';   // (RT_ROLL: the ranged types written out below)
function rangedGrid(){ const g = new Map(), NC = Math.ceil(WORLD_W/RG_C);
  for (const b of S.armies){ if (b.owner < 0 || b.air || b.fly || !count(b)) continue;
    let x, y; if (b.to === null){ const ps = b.pos; if (ps){ x = ps[0]; y = ps[1]; } else { const A = G.P[b.at]; x = A.x; y = A.y; } } else [x, y] = legSpot(b);   // (armyXY for a force on the ground or at sea, without its new array)
    const k = (((Math.floor(x/RG_C) % NC) + NC) % NC)*65536 + Math.floor(y/RG_C) + 1024; let l = g.get(k); if (!l) g.set(k, l = []); l.push(b); }
  return g; }
function rangedNear(g, x, y, km){ const NC = Math.ceil(WORLD_W/RG_C), r = Math.ceil(km*KM_W/RG_C), cx = Math.floor(x/RG_C), cy = Math.floor(y/RG_C), out = [];
  for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++){ const l = g.get((((cx + i) % NC) + NC) % NC*65536 + cy + j + 1024); if (l) for (const b of l) out.push(b); }
  return out; }
// what the client shows of ranged fire: the damage dealt to each force, summed over the hour's steps and shown on the hour (display only, never saved)
const RANGED_SHOWN = new Map();
// one battle step of ranged fire (hourly: the hour's own step, which also shows the hour's damage numbers)
function rangedStep(hourly){ let grid = null, gone = false;
  for (const a of S.armies){ if (a.owner < 0 || a.air || a.fly || a.to !== null || a.sail || !count(a)) continue;   // (a fleet sailing to a spot in its zone fires once there)
    let gun = false; if (RT_ROLL){ const u = a.u; gun = !!(u.art || u.mlrs || u.frig || u.crui || u.sub); } else for (const t of RANGED_T) if (a.u[t]){ gun = true; break; } if (!gun) continue;
    if (a.tgt && a.tgt.id != null){ const tb = armyById(a.tgt.id); if (!tb || !count(tb) || !atWar(a.owner, tb.owner)) delete a.tgt; }   // the ordered target is gone
    if (a.tgt && a.path.length) delete a.tgt;   // (a route given since ends the order)
    if (a.fire === 'hold' || S.battles.includes(a.at)) continue;
    const km = rangeOf(a); if (!km) continue;
    if (!grid) grid = rangedGrid();
    const [x, y] = armyXY(a), T = rangedTargets(a, x, y, rangedNear(grid, x, y, km)); if (!T.length) continue;
    // the group fired at: the ordered target while it is in range and seen, else the province with the strongest visible enemy power in range
    let G0 = a.tgt ? T.filter(e => a.tgt.id != null ? e.b.id === a.tgt.id : e.b.at === a.tgt.p) : [];
    if (!G0.length){ const pw = new Map(); for (const e of T) pw.set(e.b.at, (pw.get(e.b.at) || 0) + power(e.b)); let bp = -1, bv = -1; for (const [p, v] of pw) if (v > bv){ bv = v; bp = p; } G0 = T.filter(e => e.b.at === bp); }
    const best = G0[0].b.at, land = !G.P[best].sea, cov = land ? Math.min(1, terr(best).art) : 1, se = stackEffs(a), mf = moraleF(a), cG = 1 + 0.2*cmdF(a, 'gunner'), av = new Map();
    let base = 0; const fired = [];   // (fired: the unit types that fired, for the client's effects only)
    for (const [t, n] of rangedOf(a)){ const hit = G0.filter(e => e.ts.includes(t)); if (!hit.length) continue; fired.push(t);
      const tot = hit.reduce((s0, e) => s0 + armyHP(e.b), 0) || 1;
      const b0 = n*st(a.owner, t, 'atk')*K*RANGED_F/BATTLE_Q*mf*(RANGE_HIT[t] === 'land' ? cG : 1)*(t === 'crui' && land && has(a.owner, 'crui_rng') ? 1.3 : 1)*(0.8 + rng()*0.4)*cov*se[DOM_T[t]];
      base += b0;
      for (const e of hit){ let d = av.get(e); if (!d) av.set(e, d = {soft:0, armored:0, air:0, naval:0}); for (const k of CLASSES) d[k] += b0*multO(a.owner, t, k)/tot; } }
    if (!base) continue;
    for (const [e, d] of av){ const b = e.b, h0 = effHP(b), u0 = count(b);
      hurt(b, d, (land && b.owner === S.owner[best] ? Math.pow(0.8, S.bld[best].fort || 0) : 1)*digF(b));
      const lost = Math.max(0, h0 - effHP(b)), k = a.id + ':' + b.id, R = RANGED_SHOWN.get(k); if (R) R.lost += lost; else RANGED_SHOWN.set(k, {a, b, p:b.at, lost, x:e.x, y:e.y});
      if (u0 - count(b) > 0){ bump(a.owner, 'unitsKilled', u0 - count(b)); bump(b.owner, 'unitsLost', u0 - count(b)); if (!count(b)) gone = true; } }
    cmdXP(a, base*0.4); if (land) warDamage(best, 1.2/BATTLE_Q);
    const e0 = G0.reduce((m, e) => power(e.b) > power(m.b) ? e : m, G0[0]);
    IM.emit('fxRanged', a, null, best, 0, [e0.x, e0.y], {types:fired, b:e0.b.id, kill:!count(e0.b)});   // the client draws the shells (or the naval salvo): which unit types fired, at which force, and whether it was destroyed
    if (!a.lastFireLog || S.hour - a.lastFireLog > 12){ a.lastFireLog = S.hour; if (isSeat(a.owner)) tell(a.owner, `${armyName(a)} is ${shipsOnly(a) ? 'bombarding' : 'shelling'} enemy forces ${G.P[best].sea ? 'at sea in' : 'in'} ${G.P[best].cityName || G.P[best].name}.`, 'info', best); }
  }
  if (hourly){ for (const R of RANGED_SHOWN.values()) if (R.lost >= 0.5) IM.emit('fxRanged', R.a, R.b, R.p, R.lost, [R.x, R.y]); RANGED_SHOWN.clear(); }   // the client shows the damage numbers
  if (gone) removeEmpty(); }
// the Bombard order, for the order preview: can force a fire at force b (or, with b null, at the enemy forces in province p) from where it stands?
// {ok, km (to the target or the nearest enemy force seen there; the province point when none is seen), range (its longest, km), n (forces in range),
//  seen (an enemy force is seen there), ranged (it has a unit with a range that can fire where it is), moving}
function bombardInfo(a, p, b = null){ const R = rangedOf(a), range = R.reduce((m, e) => Math.max(m, e[2]), 0), moving = a.to !== null || !!a.sail;
  if (b) p = b.at; const [x, y] = armyXY(a), vis = visibleSet(a.owner);
  const foes = S.armies.filter(f => (b ? f === b : f.at === p) && rangedFoe(a.owner, f) && armyVisible(f, vis));
  const hit = range && !moving ? rangedTargets(a, x, y, foes) : [];
  let km = Infinity; for (const f of foes){ const [fx, fy] = armyXY(f); km = Math.min(km, kmBetween(x, y, fx, fy)); }
  if (km === Infinity) km = kmBetween(x, y, G.P[p].x, G.P[p].y);
  return {ok:hit.length > 0, km, range, n:hit.length, seen:foes.length > 0, ranged:R.length > 0, moving}; }
// order force a to stay where it is and fire at force b (or at the enemy forces in province p) while they are in range and seen. False, with
// nothing changed, when nothing there is in range now. A move order or Halt ends it; meanwhile, with the target out of range, it fires at will.
function orderBombard(a, p, b = null){ if (!bombardInfo(a, p, b).ok) return false;
  a.path = []; a.chase = null; a.dest = null; if (a.wp) delete a.wp; delete a.join; a.tgt = b ? {id:b.id} : {p}; if (a.fire === 'hold') a.fire = 'free'; return true; }
// a force sent to join another (dragged onto its counter) merges into it on arrival; it follows if the other force moved on
function joinHour(){ let any = false; for (const a of S.armies){ if (a.join == null || !count(a)) continue; const b = armyById(a.join);
    if (!b || b === a || b.owner !== a.owner || !count(b) || b.air || b.fly){ delete a.join; continue; }
    if (a.to !== null || a.path.length) continue;
    if (a.at === b.at && b.to === null){ delete a.join; merge(b, a); any = true; if (isSeat(a.owner)){ const sp = stackPenalty(b); tell(a.owner, `${armyName(a)} joined ${armyName(b)} at ${G.P[b.at].cityName || G.P[b.at].name}: ${pluN(count(b), 'unit')}.${sp.over ? ` ${stackText(sp)}.` : ''}`, sp.over ? 'bad' : 'good', b.at); IM.emit('merged', a.id, b.id); } continue; }
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
    // (health from research, a newer generation, is taken as less damage: wounds stay in the unit's base health, so nothing else changes)
    a.w[t] += (dv !== undefined ? dv : d[UNITS[t].cls])*f*(n*UNITS[t].hp)*4/(4 + st(a.owner, t, 'def'))*UNITS[t].hp/st(a.owner, t, 'hp');
    while (a.w[t] >= UNITS[t].hp && a.u[t] > 0){ a.w[t] -= UNITS[t].hp; a.u[t]--; }
    if (!a.u[t]) a.w[t] = 0; }
}
function capture(p, O){
  const prev = S.owner[p], wasCap = isCapital(p);
  IM.emit('fxCapture', p, O, prev);   // before the owner changes: the client marks the capture on the map
  S.owner[p] = O; ownChanged(); S.cap[p] = null; S.queue[p] = []; S.cons[p] = null; S.bld[p].fort = Math.max(0, S.bld[p].fort - 1);
  for (const a of S.armies) if (a.hrt === p) delete a.hrt;   // (the heart reached: done with, rules/movement.js atHeart)
  if (!S.occ) S.occ = G.P.map(() => null);
  S.occ[p] = (S.home && S.home[p] === O) ? null : S.hour;
  S.unrest = S.unrest || G.P.map(() => 0); S.unrest[p] = S.home[p] === O ? 0 : Math.max(unrestOf(p), G.P[p].city ? 30 : 15);
  geoChanged();
  const nm = G.P[p].name;
  if (isSeat(O)){ const D = desk(O); (D.tut || (D.tut = {})).capture = true; bump(O, 'taken'); cue(O, 'capture'); }
  for (const w of S.armies){ if (!w.air || w.fly || w.air.base !== p || w.owner === O) continue; const nb = nearestAirbase(w.owner, p); if (nb >= 0 && nb !== p){ w.air.base = nb; atMove(w, nb); w.air.cd = 4; if (isSeat(w.owner)) tell(w.owner, `Your air wing escaped from ${G.P[p].cityName || G.P[p].name} to ${G.P[nb].cityName || G.P[nb].name}.`, 'info', nb); } else { for (const t of UT) w.u[t] = 0; if (isSeat(w.owner)) tell(w.owner, `Your air wing was destroyed on the ground at ${G.P[p].cityName || G.P[p].name}.`, 'bad', p); } }
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
  const F = frontage(t), fn = foes.reduce((s, b) => s + count(b), 0), raw = foes.reduce((s, b) => s + power(b)*stackDmg(b)/digF(b), 0);   // (a dug-in defender: DIG_DEF)   // (stack efficiency per force)
  const defOwn = foes.some(b => b.owner === S.owner[t]), ownBonus = (G.P[t].sea ? 1 : terr(t).def)*1.25/Math.pow(0.8, S.bld[t].fort || 0);
  let d = raw*frontScale(fn, F)*(defOwn ? ownBonus : 1);
  const pv = via != null ? via : (a.to ?? a.at), river = !G.P[t].sea && G.P[t].river.has(pv) && S.owner[t] !== a.owner;
  const fitA = terrFit(a, t, S.owner[t] !== a.owner), fitD = foes.length ? foes.reduce((s, b) => s + power(b)*stackDmg(b)*terrFit(b, t, S.owner[t] !== b.owner), 0)/Math.max(1e-6, raw) : 1; d *= fitD;
  const sk = stackPenalty(a);
  return {stack:sk, mine:power(a)*stackDmg(a)*frontScale(count(a), sideFront(t, dirs))*flankF(dirs)*(river ? RIVER_ATK : 1)*(S.owner[t] === a.owner ? ownBonus : 1)*fitA, theirs:d, raw, river, dirs, defOwn, fitA, fitD};
}
function odds(a, t, foes, dirs, via){
  if (!foes.length) return Infinity;
  const o = oddsParts(a, t, foes, dirs, via); return o.mine/Math.max(1, o.theirs);
}
