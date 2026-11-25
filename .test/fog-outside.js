// The owner's fog rule (2026-11-25, point 2: "enemy armies outside my territory still show as 'unidentified'. They shouldn't show at all. I only
// see them once they cross into my land, or when one of my units sees them within its sight range (infantry sees only up close; a fighter on
// patrol sees much further)"), checked in plain Node with no browser on the nations world: node .test/fog-outside.js (IM_ROOT=<tree>)
// A. an enemy army standing outside my land, none of my units near: not shown at all (no '?', no AWACS contact, nothing in armyView); also
//    just past the border, within 70 km of my city (cities and airbases no longer see past the border)
// B. an enemy column marching into my land: hidden while its spot is outside, shown (as '?', unidentified) from the moment it crosses the border
// C. the same army standing inside my land: shown, '?' until identified
// D. my infantry beside it (outside my land): seen at 40 km, not at 70 km
// E. my fighter patrol: sees it 180 km away, not 260 km
// F. a force of mine setting off into its province does not reveal it
// G. fighting it: shown and identified for the whole battle, wherever the two stand (B3.8, fightsMe)
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const L = new Function("'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn {IM, ev: s => eval(s), clearVis(){ visCache = null; }};')();
const api = L.IM.api, ev = L.ev, errors = [], info = {}, ok = (c, msg, v) => { if (!c) errors.push(msg + (v !== undefined ? ' ' + JSON.stringify(v) : '')); };
api.useScenario('world64');
// a city province u of a nation (the seat, ME) with a foreign neighbour v (nation Q) whose centre lies at least 100 km from u's, while some of
// v lies within 70 km of u's city; Q at war with me; the board cleared of my forces
api.newGame(12345, 0, []); let G = api.G, S = api.S, T = null; const KM_W = ev('KM_W'), cellCenter = ev('cellCenter');
for (let u = 0; u < G.P.length && !T; u++){ const o = S.owner[u]; if (G.P[u].sea || o < 0 || !G.P[u].city) continue;
  for (const v of G.P[u].nbs){ const Q = S.owner[v]; if (G.P[v].sea || Q < 0 || Q === o || Math.hypot(G.P[v].x - G.P[u].x, G.P[v].y - G.P[u].y) < 100*KM_W || !G.P[v].cells.some(c => { const [x, y] = cellCenter(c); return Math.hypot(x - G.P[u].x, y - G.P[u].y) < 70*KM_W; })) continue; T = {u, v, Q}; break; } }
const ME = T ? S.owner[T.u] : 0; api.newGame(12345, 0, [ME]); S = api.S; G = api.G; S.started = true;
const addArmy = ev('addArmy'), armyXY = ev('armyXY'), provOfPt = ev('provOfPt'), shown = ev("typeof armyShown === 'function' ? armyShown : armyVisible"), known = ev('armyKnown'), located = ev('armyLocated');
const view = () => { L.clearVis(); return api.visibleSet(ME); };
const state = a => { const v = view(); return shown(a, v) ? (known(a, v) ? 'identified' : '?') : located(a, v) ? 'AWACS ?' : 'hidden'; };
ok(!!T, 'found a border to test with');
if (T){ const {u, v, Q} = T, U = G.P[u], V = G.P[v]; S.nations[Q].ai = false; api.declareWar(ME, Q); info.where = `${U.name} (mine) / ${V.name} (${S.nations[Q].name})`;
  S.armies = S.armies.filter(a => a.owner !== ME); S.sats = [];
  // A. standing at the centre of v
  const E = addArmy(Q, v, {inf:3, tank:2}); E.pos = [V.x, V.y];
  ok(state(E) === 'hidden' && api.armyView(E, view()) === null, 'A: an enemy army outside my land with none of my units near is not shown at all', state(E));
  // A2. the same army just past my border, within 70 km of my city (the city's old 80 km ring): still not shown
  { let q = null, bd = 70; for (const c of V.cells){ const [x, y] = cellCenter(c), d = Math.hypot(x - U.x, y - U.y)/KM_W; if (d < bd && provOfPt(x, y) === v){ bd = d; q = [x, y]; } } info.nearCityKm = Math.round(bd);
    if (q){ E.pos = q; ok(state(E) === 'hidden', 'A2: an enemy army just past my border, 70 km or less from my city, is not shown', state(E)); E.pos = [V.x, V.y]; } }
  // B. marching v -> u: hidden while its spot is outside my land, '?' once it has crossed the border
  { E.pos = null; E.to = u; E.path = []; const seq = []; let bad = 0;
    for (let t = 0; t <= 1.0001; t += 0.05){ E.t = Math.min(1, t); const [x, y] = armyXY(E), inMine = S.owner[provOfPt(x, y)] === ME, st = state(E); seq.push((inMine ? 'IN ' : 'out ') + st);
      if (inMine ? st !== '?' : st !== 'hidden') bad++; }
    ok(!bad && seq.some(s => s.startsWith('IN')) && seq.some(s => s.startsWith('out')), 'B: a column marching in is hidden until its spot crosses my border, then shown as ?', seq);
    E.to = null; E.t = 0; }
  // C. standing in my land
  E.at = u; E.pos = [U.x, U.y]; ok(state(E) === '?', 'C: the army standing inside my land is shown, unidentified', state(E)); E.at = v; E.pos = [V.x, V.y];
  // D. my infantry outside my land, 40 km and 70 km from it (points of v, or any foreign land, around its centre)
  { const prov = (x, y) => provOfPt(x, y); let D = null;
    for (let ang = 0; ang < 360 && !D; ang += 10){ const r = ang*Math.PI/180, at = d => [V.x + Math.cos(r)*d*KM_W, V.y + Math.sin(r)*d*KM_W], a = at(40), b = at(70);
      if ([a, b].every(q => { const p = prov(...q); return p >= 0 && !G.P[p].sea && S.owner[p] !== ME; })) D = {a, b}; }
    ok(!!D, 'D: found foreign ground around the army');
    if (D){ const I = addArmy(ME, prov(...D.a), {inf:2}); I.pos = D.a; ok(state(E) === '?', 'D: my infantry 40 km away sees it (spotted, not identified)', state(E));
      I.at = prov(...D.b); I.pos = D.b; ok(state(E) === 'hidden', 'D: my infantry 70 km away does not', state(E)); S.armies = S.armies.filter(a => a !== I); } }
  // E. my fighter patrol over a province point of mine; the army 180 km from it (seen), then 260 km (not), on foreign land
  { const base = G.P.find(P => S.owner[P.id] === ME && P.city).id; let Z = null;
    for (const P of G.P){ if (P.sea || S.owner[P.id] !== ME || Z) continue;
      for (let ang = 0; ang < 360 && !Z; ang += 10){ const r = ang*Math.PI/180, at = d => [P.x + Math.cos(r)*d*KM_W, P.y + Math.sin(r)*d*KM_W], a = at(180), b = at(260);
        if ([a, b].every(q => { const p = provOfPt(...q); return p >= 0 && !G.P[p].sea && S.owner[p] >= 0 && S.owner[p] !== ME; })) Z = {P, a, b}; } }
    ok(!!Z, 'E: found foreign land 180 and 260 km from a point of mine');
    if (Z){ const at0 = E.at, p0 = E.pos, W = addArmy(ME, base, {jet:2}); W.air = {base, cd:0}; W.fly = {tgt:Z.P.id, kind:'patrol', ph:'patrol', t:0, hrs:6};
      E.at = provOfPt(...Z.a); E.pos = Z.a; ok(state(E) === '?', 'E: my fighter patrol sees the army 180 km away', state(E));
      E.at = provOfPt(...Z.b); E.pos = Z.b; ok(state(E) === 'hidden', 'E: not 260 km away', state(E));
      S.armies = S.armies.filter(a => a !== W); E.at = at0; E.pos = p0; ok(state(E) === 'hidden', 'E: back outside my land with nothing near: hidden', state(E)); } }
  // F. my force heading into v does not reveal v
  { const o0 = S.owner[v]; const M = addArmy(ME, u, {inf:1}); M.to = v; M.t = 0; M.path = []; M.pos = null;
    const far = Math.hypot(armyXY(M)[0] - E.pos[0], armyXY(M)[1] - E.pos[1])/KM_W; info.moverKm = Math.round(far);
    if (far > 60) ok(state(E) === 'hidden' && !view().whole.has(v), 'F: my force setting off into its province does not reveal it', state(E));
    S.armies = S.armies.filter(a => a !== M); S.owner[v] = o0; }
  // G. fighting it: one of mine standing in v, far from it, in a battle there
  { const F = addArmy(ME, v, {inf:2}); const c = G.P[v].cells[G.P[v].cells.length - 1]; F.pos = cellCenter(c); S.battles.push(v);
    ok(state(E) === 'identified', 'G: an army my force is fighting is shown and identified', state(E)); S.battles = S.battles.filter(p => p !== v); S.armies = S.armies.filter(a => a !== F); } }
console.log(JSON.stringify({info, errors}, null, 1));
process.exit(errors.length ? 1 : 0);
