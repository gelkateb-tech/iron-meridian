'use strict';
// makes .test/fixtures/rcn-oldsave.json with the rules of master before the Recon Vehicle (Dev Build v73, b4acd66): a nations-world game, seat
// Germany, 3 days played (forces on the move, training queues, research running), saved. .test/recon.js loads it into this build.
//   node .test/rcn-oldsave-make.js <folder with master's files, e.g. a git archive of b4acd66> .test/fixtures/rcn-oldsave.json
const fs = require('fs'), path = require('path'), ROOT = process.argv[2], OUT = process.argv[3];
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn {IM, UNITS, get S(){ return S; }};';
const R = new Function(SRC)(), api = R.IM.api;
if (R.UNITS.rcn) throw new Error('these rules already have the Recon Vehicle: run against master before it (b4acd66)');
api.useScenario('world64'); api.newGame(4242, 0, []);
const ger = R.S.nations.findIndex(N => N.name === 'Germany');
api.newGame(4242, ger, [0]); const S = R.S; S.started = true;
for (let h = 0; h < 3*24; h++) api.tick();
fs.writeFileSync(OUT, api.saveJSON()); console.log('wrote', OUT, fs.statSync(OUT).size, 'bytes, hour', S.hour, 'forces', S.armies.length);
