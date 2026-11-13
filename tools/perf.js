// Iron Meridian: rules speed in plain Node (no browser), both worlds: ms per game day and where the time goes.
//   node tools/perf.js                       the nations world (68 nations) and the classic world, 10 days each, seed 12345
//   node tools/perf.js --days 20 --seed 7    --world nations | classic (one world only)   --no-phases (no per-function clocks)
// Each world is played twice: once as it is (the ms per day and the state hash), once with clocks on the phases. Wall time and the main thread's CPU time are both printed (the CPU time is what the rules cost; the wall time also holds waiting for a busy machine,
// see the load average). The phase table is the time spent in each listed rules function, exclusive of the other listed functions it calls
// in CPU time of the main thread (every function is wrapped with a clock in a copy of the rules source; the rules themselves are not changed), plus "tickHour (own)": the hour's
// movement, clashes, merges, dug-in marks and captures, written inline in tickHour. The state hash is the one tools/headless.js prints.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d; };
const DAYS = +arg('days', 10), SEED = +arg('seed', 12345), ONLY = arg('world', ''), PHASES = !process.argv.includes('--no-phases');
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
// --sliced: every hour is run a step at a time (tickQSlice, as the page's game loop does), and between the steps the page's kind of reads are made
// (income, power, borders, ports, fog of a nation): the state hash must be the one of the hours run at once
const SLICED = process.argv.includes('--sliced'), RET = "\nreturn {IM, slice: typeof tickQSlice === 'function' ? tickQSlice : null, look: n => { if (typeof income === 'function') income(n); if (typeof natPower === 'function') natPower(n); if (typeof borders === 'function') borders(n, n + 1); if (typeof visibleSet === 'function') visibleSet(n); if (typeof natPorts === 'function') natPorts(n); if (typeof enemyMix === 'function') enemyMix(n); if (typeof provPowers === 'function') provPowers(); if (typeof aiCountsOf === 'function') aiCountsOf(n); if (typeof aiArmyCap === 'function') aiArmyCap(n); if (typeof airMine === 'function') airMine(n); if (typeof isCapital === 'function') isCapital(0); } };";
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC0 = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + RET;
let SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
// the phases: hourly and daily steps, the AI's turns, and the helpers that show up in a profile
const NAMES = ['tickHour', 'battleStep', 'rangedStep', 'prodHour', 'consHour', 'researchHour', 'diploHour', 'terrHour', 'reqHour', 'weatherHour', 'dropTick', 'linkHour', 'strandedHour', 'escortHour',
  'airTick', 'missileTick', 'spyHour', 'rebelHour', 'stanceHour', 'chaseHour', 'joinHour', 'computeSupply', 'computeBlockade', 'armyUpkeep', 'capture', 'diploDay', 'daily',
  'aiLinks', 'aiTrade', 'aiTurn', 'aiAir', 'aiMissiles', 'aiSpies', 'aiResearch', 'aiPickUnit', 'aiOperate', 'aiGuns', 'aiFleet', 'aiPlan', 'aiSplitToLimit',
  'findPath', 'pathFor', 'removeEmpty', 'visibleSet', 'income0', 'tradeDay', 'convoyDay', 'marketDay', 'bookDay', 'terrDay', 'unrestDay', 'recordStats', 'checkEnd', 'tradeGen', 'trDetour', 'trAstar',
  'threatNear', 'enemiesAt', 'stationaryAt', 'index', 'opinion', 'legArrive', 'splitPlan', 'merge', 'rangedGrid', 'rangedTargets', 'provPowers', 'enemyMix0', 'aiTarget', 'armiesAt', 'armiesOf', 'ownIndex',
  'aiTurn0', 'aiPlan', 'aiArmyCap', 'aiMains', 'aiSite', 'aiArmsPay', 'aiBookBuy', 'trade', 'build', 'recruit', 'blocDay', 'acceptOffer', 'commonEnemy', 'opinionParts', 'aiAway', 'borders'];
const TIMED = [];
if (PHASES) for (const nm of NAMES){ const re = new RegExp('(^|\\n)function ' + nm + '\\('); if (!re.test(SRC)) continue; TIMED.push(nm);
  SRC = SRC.replace(re, `$1function ${nm}(){ return __T(${TIMED.length - 1}, __R_${nm}, this, arguments); }\nfunction __R_${nm}(`); }
SRC += RET;
const hash = s => { let h1 = 0x811c9dc5, h2 = 0x1b873593; for (let i = 0; i < s.length; i++){ const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 + c, 0x85ebca6b) ^ (h2 >>> 13); } return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0'); };
const now = () => performance.now(), cpu = () => { const u = process.threadCpuUsage ? process.threadCpuUsage() : process.cpuUsage(); return (u.user + u.system)/1000; };
function play(world, timed){
  const acc = new Float64Array(TIMED.length + 1), calls = new Float64Array(TIMED.length + 1), stack = []; let mark = 0;
  // exclusive time: the clock runs for the innermost timed function on the stack
  globalThis.__T = (i, f, self, args) => { const t = cpu(); if (stack.length) acc[stack[stack.length - 1]] += t - mark; stack.push(i); calls[i]++; mark = t;
    try { return f.apply(self, args); } finally { const t2 = cpu(); acc[stack.pop()] += t2 - mark; mark = t2; } };
  const R0 = new Function(timed ? SRC : SRC0)(), IM = R0.IM, api = IM.api;
  if (world === 'nations') api.useScenario('world64');
  api.newGame(SEED, 0, []); const S = api.S; S.started = true; acc.fill(0); calls.fill(0);
  const days = [], c0 = cpu(), w0 = now(); let hours = 0, worstH = 0;
  let looks = 0;
  while (hours < DAYS*24 && !S.over){ const t = now();
    if (SLICED && R0.slice){ for (let q = 0; q < api.BATTLE_Q; q++) while (!R0.slice(() => false)){ R0.look(looks++ % S.nations.length); } }
    else for (let q = 0; q < api.BATTLE_Q; q++) api.tickQ();
    const d = now() - t; if (d > worstH) worstH = d; hours++; if (hours % 24 === 0) days.push(now()); }
  const wall = now() - w0, cp = cpu() - c0;
  let units = 0; for (const a of S.armies) for (const k in a.u) units += a.u[k] || 0;
  const o = JSON.parse(api.saveJSON()); delete o.savedAt;
  return {world, nations:S.nations.length, units:Math.round(units), forces:S.armies.length, hours, wall, cpu:cp, worstH, hash:hash(JSON.stringify(o)), acc, calls}; }
const worlds = ONLY ? [ONLY] : ['nations', 'classic'], out = [];
console.log(`rules speed, seed ${SEED}, ${DAYS} days, load average ${os.loadavg().map(x => x.toFixed(2)).join(' ')}${PHASES ? '' : ' (no phase clocks)'}${SLICED ? ', every hour run a step at a time with reads between the steps (--sliced)' : ''}`);
for (const w of worlds){ const r = play(w, false), d = r.hours/24, rt = PHASES ? play(w, true) : null; out.push(r);
  console.log(`\n${w.padEnd(8)} ${r.nations} nations, ${r.units} units in ${r.forces} forces at the end   ${(r.wall/d).toFixed(0)} ms per game day (wall), ${(r.cpu/d).toFixed(0)} ms (CPU)   worst hour ${r.worstH.toFixed(0)} ms   state hash ${r.hash}`);
  if (rt){ if (rt.hash !== r.hash) console.log('  THE TIMED RUN GAVE ANOTHER STATE HASH: ' + rt.hash); const tot = rt.acc.reduce((s, x) => s + x, 0)/d, rows = TIMED.map((nm, i) => [nm === 'tickHour' ? 'tickHour (own)' : nm, rt.acc[i]/d, rt.calls[i]/d]).filter(x => x[1] >= 0.5).sort((x, y) => y[1] - x[1]);
    console.log(`  phase (CPU, second run with clocks: ${(rt.cpu/d).toFixed(0)} ms/day)   ms/day    share   calls/day`); for (const [nm, ms, c] of rows) console.log(`  ${nm.padEnd(20)} ${ms.toFixed(1).padStart(7)}  ${(100*ms/tot).toFixed(1).padStart(5)}%  ${Math.round(c).toString().padStart(9)}`);
    console.log(`  (timed total ${tot.toFixed(0)} ms/day of CPU time, the clocks' own cost included)`); } }
module.exports = out;
