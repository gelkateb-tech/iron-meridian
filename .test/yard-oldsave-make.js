'use strict';
// makes .test/fixtures/yard-oldsave.json with MASTER's rules (before BUILD-REQS round 2: Frigates and Attack Submarines at Naval Yard I, Cruisers
// and Aircraft Carriers at II): a nations-world game, 4 days played, then ships in every state an old save can hold them in (seat France: two naval cities, Rouen and Brest):
//   city A, Naval Yard II: a Cruiser part trained and an Aircraft Carrier queued behind it (both too low for the new levels III and V)
//   city B, Naval Yard I: an Attack Submarine in training (now needs III) and a repeat order of it
//   a fleet at sea: 2 Frigates, 1 Attack Submarine, 1 Cruiser, 1 Aircraft Carrier
//   node .test/yard-oldsave-make.js <master root> .test/fixtures/yard-oldsave.json
const fs = require('fs'), path = require('path'), ROOT = process.argv[2] || '/home/user/iron-meridian', OUT = process.argv[3];
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn {IM, UNITS, rGrant, desk, recruit, addArmy, navalCity, get S(){ return S; }, get G(){ return G; }};';
const R = new Function(SRC)(), api = R.IM.api;
if (R.UNITS.crui.req.l !== 2 || R.UNITS.sub.req.l !== 1) throw new Error('these rules already have the new Naval Yard levels: run against master');
api.useScenario('world64'); api.newGame(4243, 0, []);
let S = R.S; const fra = S.nations.findIndex(N => N.name === 'France');   // (POWERS order; the pick becomes nation 0)
api.newGame(4243, fra, [0]); S = R.S; const G = R.G; S.started = true;
for (let h = 0; h < 4*24; h++) api.tick();
const me = 0, N = S.nations[me]; if (N.name !== 'France') throw new Error('the seat is ' + N.name);
for (const k of ['cash', 'mp']) N[k] = Math.max(N[k], 3000);
for (const k of ['oil', 'metal', 'iron', 'elec', 'rare']) N[k] = Math.max(N[k], 600000);
R.rGrant(N, 'u_carr', 1); N.tv = (N.tv || 0) + 1; api.setMember(me, true);
const ports = G.P.filter(P => S.owner[P.id] === me && P.city && R.navalCity(P.id)).map(P => P.id);
if (ports.length < 2) throw new Error('France needs two naval cities');
const [A, B] = ports; for (const p of [A, B]){ S.queue[p].length = 0; S.cons[p] = null; }
S.bld[A].yard = 2; if (!R.recruit(me, A, 'crui') || !R.recruit(me, A, 'carr')) throw new Error('could not queue the cruiser and the carrier');
S.queue[A][0].h = Math.round(S.queue[A][0].h0/2);   // half trained
S.bld[B].yard = 1; if (!R.recruit(me, B, 'sub')) throw new Error('could not queue the submarine');
(R.desk(me).repeat || (R.desk(me).repeat = {}))[B] = 'sub';
const sea = G.P[A].nbs.find(v => G.P[v].sea); const F = R.addArmy(me, sea, {frig:2, sub:1, crui:1, carr:1});
const js = api.saveJSON(); fs.writeFileSync(OUT, js);
console.log('wrote', OUT, js.length, 'bytes; seat', me, N.name, 'hour', S.hour, 'A', A, G.P[A].cityName, JSON.stringify(S.queue[A]), 'B', B, G.P[B].cityName, JSON.stringify(S.queue[B]), 'fleet', F.id, 'at', sea);
