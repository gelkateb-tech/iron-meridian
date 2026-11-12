// Iron Meridian: the rules without a browser (owner task 5, the proof that the rules stand on their own).
// Loads world.js, lines.js and the rules files in plain Node, starts a new world game, lets the AI play every nation (no seat is taken)
// for N game days and prints a short summary. No DOM, no canvas, no page: this is how a multiplayer server will run the rules.
//   node tools/headless.js                    30 days, seed 12345
//   node tools/headless.js --days 10 --seed 7
//   node tools/headless.js --seat 3           nation 3 is a seat (a person's nation) that gives no orders: the AI plays the others
//   node tools/headless.js --check            plays the same seed twice from scratch; exit 1 unless both summaries and state hashes are equal
// The state hash is for Node against Node only: Node and Chromium differ in the last digit of a few floats.
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] !== undefined ? +process.argv[i + 1] : d; };
const DAYS = arg('days', 30), SEED = arg('seed', 12345), SEAT = arg('seat', -1), CHECK = process.argv.includes('--check');

// the map data scripts set window.WORLD and window.LINES; in Node "window" is the global object and nothing else of a browser exists
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));

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
  api.newGame(seed, 0, SEAT >= 0 ? [SEAT] : []); const S = api.S, G = api.G; S.started = true;
  const t0 = Date.now(); let hours = 0;
  while (hours < days*24 && !S.over){ for (let q = 0; q < api.BATTLE_Q; q++) api.tickQ(); hours++; }   // a game hour = four quarter-hour steps (battles resolve every 15 minutes)
  const prov = S.nations.map(() => 0); for (const o of S.owner) if (o >= 0 && o < prov.length) prov[o]++;
  const alive = S.nations.map((N, n) => n).filter(n => S.nations[n].alive !== false && prov[n] > 0);
  const wars = []; for (const k in S.rel){ const r = S.rel[k]; if (r && r.st === 'war') wars.push(k); }
  let units = 0; const perN = S.nations.map(() => 0);
  for (const a of S.armies){ let u = 0; if (a.u) for (const k in a.u) u += a.u[k] || 0; units += u; if (a.owner >= 0) perN[a.owner] += u; }
  const o = JSON.parse(api.saveJSON()); delete o.savedAt;
  const lines = [
    `seed ${seed}  day ${(S.hour/24).toFixed(S.hour % 24 ? 2 : 0)} of ${days}${S.over ? '  (game over)' : ''}  provinces ${G.P.length}`,
    `nations alive ${alive.length} of ${S.nations.length}`,
    'provinces per nation  ' + S.nations.map((N, n) => `${N.name} ${prov[n]}`).join(', '),
    `wars ${wars.length}` + (wars.length ? '  ' + wars.map(k => k.split(/[^0-9]+/).filter(Boolean).map(i => S.nations[+i] ? S.nations[+i].name : i).join(' v ')).join(', ') : ''),
    `units ${Math.round(units)} in ${S.armies.length} forces  ` + S.nations.map((N, n) => `${N.name} ${Math.round(perN[n])}`).filter((s, n) => perN[n] > 0).join(', ') + `, unaligned ${Math.round(units - perN.reduce((x, y) => x + y, 0))}`,
    `provinces captured ${events.fxCapture || 0}  ` + (SEAT >= 0 ? `dispatches to seat ${SEAT} (${S.nations[SEAT].name}) ${events.log || 0}  ` : '') + `dice state ${S.rs}`,
    `state hash ${hash(JSON.stringify(o))}`];
  return {lines, ms:Date.now() - t0, hours};
}

const A = play(SEED, DAYS);
console.log(`${FILES.length} rules files, no browser`); console.log(A.lines.join('\n'));
console.log(`(${(A.ms/1000).toFixed(1)} s, ${Math.round(A.ms/Math.max(1, A.hours/24))} ms per game day)`);
if (CHECK){ const B = play(SEED, DAYS), bad = A.lines.findIndex((l, i) => l !== B.lines[i]);
  console.log(bad < 0 ? `DETERMINISTIC: a second run of seed ${SEED} gave the same summary and state hash` : `NOT DETERMINISTIC: the second run differs\n  first   ${A.lines[bad]}\n  second  ${B.lines[bad]}`);
  process.exit(bad < 0 ? 0 : 1); }
process.exit(0);
