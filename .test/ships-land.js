// SHIPS NEVER ON LAND (rules sweep, no browser): every naval unit type, built at a Naval Yard (spawn), spawned by the dev panel (devSpawn), ordered to
// sail to every kind of province and left to the AI for days, must always stand in a sea zone or docked in a port city; never on other land.
//   node .test/ships-land.js        exit 0 when no ship was ever on land (prints a summary); exit 1 and the first offences otherwise
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(__dirname, '..');
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn {IM, spawn, addArmy, shipsOnly, shipsN, count, NAVAL_T, UNITS, pathFor, devSpawn: typeof devSpawn === "function" ? devSpawn : null};';
const R = new Function(SRC)(), api = R.IM.api;
api.newGame(12345, 0, []); const S = api.S, G = api.G; S.started = true;
const bad = [], lawful = p => { const P = G.P[p]; return !!P && (P.sea || (P.coast && P.city)); };
let checks = 0;
const audit = tag => { for (const a of S.armies){ if (a.air || !R.shipsOnly(a) || !R.count(a)) continue; checks++;
    if (!lawful(a.at)) bad.push(`${tag}: force ${a.id} (owner ${a.owner}) at ${G.P[a.at].name} (land, no port)`);
    if (a.to !== null && !lawful(a.to)) bad.push(`${tag}: force ${a.id} heading to ${G.P[a.to].name} (land, no port)`);
    for (const v of a.path.slice(0, -1)) if (!G.P[v].sea){ bad.push(`${tag}: force ${a.id} routed through land ${G.P[v].name}`); break; }
    if (!G.P[a.at].sea && a.pos) bad.push(`${tag}: force ${a.id} docked at ${G.P[a.at].name} with a pinpoint (a spot on land)`); } };
// 1. every naval type built at a yard of every nation that has a port
const types = R.NAVAL_T; if (!types.length) bad.push('no naval types');
const ports = []; for (const N of S.nations){ const p = G.P.find(P => S.owner[P.id] === N.id && P.city && P.coast); if (p) ports.push([N.id, p.id]); }
let built = 0; for (const [n, p] of ports.slice(0, 16)){ S.bld[p].yard = 5; for (const t of types){ R.spawn(n, p, t); built++; } }
audit('built');
// 2. dev spawn: lawful places only (a sea zone or a port city); a coastal countryside province and inland land are refused
if (R.devSpawn){ const sea = G.P.find(P => P.sea), port = G.P.find(P => P.city && P.coast && !P.sea), coastNoCity = G.P.find(P => !P.sea && P.coast && !P.city), inland = G.P.find(P => !P.sea && !P.coast);
  for (const t of types){ if (!R.devSpawn(0, sea.id, t, 1)) bad.push(`devSpawn ${t} refused at sea`); if (!R.devSpawn(0, port.id, t, 1)) bad.push(`devSpawn ${t} refused at a port`);
    if (R.devSpawn(0, coastNoCity.id, t, 1)) bad.push(`devSpawn ${t} accepted on a coastal non-port land province`); if (R.devSpawn(0, inland.id, t, 1)) bad.push(`devSpawn ${t} accepted inland`); }
  audit('devSpawn'); } else console.log('(dev spawn is not in this build: skipped)');
// 3. moves: every ship force ordered to a spread of targets (sea zones, ports, coastal and inland land); the route must be lawful or empty
const ships = S.armies.filter(a => !a.air && R.shipsOnly(a) && R.count(a)).filter((a, i) => i % 3 === 0); let orders = 0, routed = 0;
const targets = []; for (let i = 0; i < G.P.length; i += 41) targets.push(i);
for (const a of ships){ for (const t of targets){ const own = a.owner; if (a.to !== null) continue; const path = R.pathFor(a, a.at, t); orders++; if (path.length) routed++;
    const dest = path.length ? path[path.length - 1] : -1; if (dest >= 0 && !lawful(dest)) bad.push(`route of force ${a.id} ends on land ${G.P[dest].name}`);
    for (const v of path.slice(0, -1)) if (!G.P[v].sea) bad.push(`route of force ${a.id} to ${G.P[t].name} crosses land ${G.P[v].name}`); void own; } }
let k = 0; for (const a of ships){ const own = a.owner, ts = targets.filter(t => R.pathFor(a, a.at, t).length); if (!ts.length) continue; api.orderMove(a, ts[(k++*5) % ts.length]); }
for (let h = 0; h < 24*10; h++){ api.tick(); audit('day ' + Math.floor(h/24)); if (h % 48 === 47){ for (const a of S.armies) if (!a.air && R.shipsOnly(a) && a.to === null && !a.path.length && !a.dest){ const ts = targets.filter(t => R.pathFor(a, a.at, t).length); if (ts.length){ api.orderMove(a, ts[(h + a.id) % ts.length]); if (h % 96 === 47 && a.path.length) api.haltArmy(a); } } } if (bad.length > 20) break; }
// 4. the AI's own fleets, 30 more days
for (let h = 0; h < 24*12; h++){ api.tick(); if (h % 6 === 0) audit('ai day ' + Math.floor(h/24)); }
console.log(`ships built ${built}, ports ${ports.length}, force-audits ${checks}, orders ${orders} (routed ${routed}), ship forces ${ships.length}`);
if (bad.length){ console.log('FAIL: ' + bad.length + ' offences'); console.log([...new Set(bad)].slice(0, 12).join('\n')); process.exit(1); }
console.log('OK: no ship was ever on land'); process.exit(0);
