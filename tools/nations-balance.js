#!/usr/bin/env node
// Balance tests of the nations world (scenario world64; docs/NATIONS-PLAN.md 5.2). All-computer games without a browser, like tools/headless.js.
// One PASS or FAIL line per test; exit 1 on any FAIL.
//   node tools/nations-balance.js                 T1 T2 T3 T4 T5 T7 T8 T9 and the step's own checks: 5 seeds, 60 game days each
//   node tools/nations-balance.js --quick         T1 T2 T9 only (seconds)
//   node tools/nations-balance.js --long          T6: two seeds, 300 days (slow)
//   node tools/nations-balance.js --jobs 2        games played at the same time (default 3)
//   node tools/nations-balance.js --seeds 3 --days 30    a shorter look (the tests that need day 60 are skipped)
//   node tools/nations-balance.js --table         the opening of every nation (tier, money and manpower a day, units) and stop
// T10 (browser tests) and T11 (save size at the last step) are run by hand; the old world against tools/golden-12345.txt is tools/split-golden.js.
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
const has = k => process.argv.includes('--' + k), arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] !== undefined ? +process.argv[i + 1] : d; };
const SEEDS = [12345, 7, 2026, 31337, 99].slice(0, arg('seeds', 5)), DAYS = arg('days', 60), JOBS = arg('jobs', 3);
const TIERS = ['S', 'A', 'B', 'C'];

function load(){ globalThis.window = globalThis; if (!globalThis.WORLD){ require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js')); }
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
  return new Function("'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n')
    + '\nreturn {IM, income, tradeIncome, tierKit, tierMode, TIER_MODES, powerStrength, powerNeighbours, winCapsFor, winShareFor, landNeed, cityMain, get WIN_CAPS(){ return WIN_CAPS; }, get POWERS(){ return POWERS; }};')(); }
const hash = s => { let h1 = 0x811c9dc5, h2 = 0x1b873593; for (let i = 0; i < s.length; i++){ const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 + c, 0x85ebca6b) ^ (h2 >>> 13); } return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0'); };
const provs = S => { const c = S.nations.map(() => 0); for (const o of S.owner) if (o >= 0) c[o]++; return c; };
const unitsOf = S => { const c = S.nations.map(() => 0); for (const a of S.armies) if (a.owner >= 0) for (const k in a.u) c[a.owner] += a.u[k] || 0; return c; };

// ---- one game (child process): plays `days` days of seed `seed`, all computer, and prints one JSON line
function playOne(seed, days, scn, seat){ const R = load(), api = R.IM.api; let logs = 0; R.IM.on('log', () => logs++);
  api.useScenario(scn); api.newGame(seed, 0, seat >= 0 ? [seat] : []); const S = api.S, G = api.G; S.started = true;
  const nat = () => { const c = S.nations.map(() => 0); for (let p = 0; p < S.owner.length; p++) if (S.owner[p] >= 0 && S.own0[p] >= 0) c[S.owner[p]]++; return c; };   // land that was a nation's at the start, by who holds it now
  const out = {seed, scn, names:S.nations.map(N => N.name), tiers:S.nations.map(N => N.tier || ''), p0:provs(S), free0:S.own0.filter(o => o === -1).length, land:G.landCount, at:{}, nat:{}, dead:{}, over:null, wars:{}};
  const t0 = Date.now(); let h = 0;
  for (; h < days*24 && !S.over; h++){ api.tick();
    if (S.hour % 24 === 0){ const d = S.hour/24; for (const N of S.nations) if (!N.alive && out.dead[N.id] == null) out.dead[N.id] = d;
      if ([21, 30, 45, 60, 120, 250, 300].includes(d)){ out.at[d] = provs(S); out.nat[d] = nat(); out.wars[d] = Object.keys(S.rel).filter(k => S.rel[k] && S.rel[k].st === 'war').map(k => k.split(',').map(Number)); } } }
  if (S.over) out.over = {day:Math.ceil(S.hour/24), what:S.over, who:S.overReason};
  out.ms = Math.round((Date.now() - t0)/Math.max(1, h/24)); out.logs = logs; out.end = provs(S); out.cash = S.nations.map(N => Math.round(N.cash));
  const o = JSON.parse(api.saveJSON()); delete o.savedAt; out.hash = hash(JSON.stringify(o));
  return out; }
if (has('child')){ console.log(JSON.stringify(playOne(arg('seed', 12345), arg('days', 60), process.argv[process.argv.indexOf('--scn') + 1] || 'world64', arg('seat', -1)))); process.exit(0); }
const child = (seed, days, scn = 'world64', seat = -1) => new Promise((res, rej) => cp.execFile(process.execPath, [__filename, '--child', '--seed', seed, '--days', days, '--scn', scn, '--seat', seat], {maxBuffer:1 << 26}, (e, so, se) => e ? rej(new Error(se || e.message)) : res(JSON.parse(so.trim().split('\n').pop()))));
async function pool(tasks, n){ const out = new Array(tasks.length); let i = 0; await Promise.all(Array.from({length:Math.min(n, tasks.length)}, async () => { while (i < tasks.length){ const k = i++; out[k] = await tasks[k](); } })); return out; }

// ---- the tests
const lines = []; let failed = 0;
const say = (t, ok, text) => { if (!ok) failed++; const l = `${ok ? 'PASS' : 'FAIL'}  ${t}  ${text}`; lines.push(l); console.log(l); };
const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1)/2] : (s[s.length/2 - 1] + s[s.length/2])/2) : 0; };

(async () => {
  const R = load(), api = R.IM.api, NAT = globalThis.NATIONS;
  api.useScenario('world64'); api.newGame(12345, 0, []); const S = api.S, G = api.G, mode = S.mode;
  const kitOf = N => R.tierKit(N.tier, mode);
  const open = S.nations.map(N => { const g = R.income(N.id).gross; return {N, cash:g.cash, mp:g.mp, units:unitsOf(S)[N.id], kit:kitOf(N), cities:G.P.filter(P => S.owner[P.id] === N.id && P.city)}; });
  if (has('table')){ console.log(`nations world, ${S.nations.length} nations, mode ${mode} (spread ${R.tierMode(mode).spread}, floor ${R.tierMode(mode).floor}); capitals to win ${R.WIN_CAPS}, land to win ${R.landNeed(0)}+`);
    for (const o of open) console.log(`${o.N.tier} ${o.N.name.padEnd(15)} ${String(R.POWERS[o.N.power].region).padEnd(12)} prov ${String(provs(S)[o.N.id]).padStart(4)} cities ${String(o.cities.length).padStart(3)}  $/day ${o.cash.toFixed(0).padStart(4)} (target ${o.kit.day}, x${o.N.boost.toFixed(2)})  mp/day ${o.mp.toFixed(0).padStart(3)} (target ${o.kit.mpDay}, x${o.N.boostM.toFixed(2)})  units ${String(o.units).padStart(3)}  stock $${o.N.cash} mp ${o.N.mp} rare ${o.N.rare}  mains ${o.cities.map(P => (R.cityMain(P.id) || '?')[0]).sort().join('')}`);
    process.exit(0); }

  // T1 structure: nations.js is what the tool writes; every nation has a capital among its cities; nations of open regions have 7 to 14 cities;
  // at most 2 rare-earth cities; at least 3 of the 4 industrial goods among the cities (nations still on today's cities are listed, not failed)
  { let ok = true; const notes = [], bad = [];
    try { cp.execFileSync(process.execPath, [path.join(__dirname, 'build-nations.js'), '--check'], {stdio:'pipe'}); } catch (e) { ok = false; bad.push('nations.js is not what tools/build-nations.js writes'); }
    for (const o of open){ const P0 = R.POWERS[o.N.power], isOpen = NAT.open.includes(P0.region), mains = o.cities.map(P => R.cityMain(P.id)), ind = ['oil', 'metal', 'iron', 'elec'].filter(k => mains.includes(k)).length, rare = mains.filter(k => k === 'rare').length;
      if (!P0.cities.includes(P0.capital) || !G.P[o.N.capital].city) bad.push(o.N.name + ': capital is not a city');
      if (o.cities.length !== P0.cities.length) bad.push(`${o.N.name}: ${o.cities.length} cities on the map, ${P0.cities.length} in nations.js`);
      if (rare > 2) bad.push(`${o.N.name}: ${rare} rare-earth cities`);
      if (isOpen && (o.cities.length < 7 || o.cities.length > 14)) bad.push(`${o.N.name}: ${o.cities.length} cities`);
      if (ind < 3) (isOpen ? bad : notes).push(`${o.N.name}: ${ind} of 4 industrial goods`);
      if (!isOpen && o.cities.length < 7) notes.push(`${o.N.name}: ${o.cities.length} cities until ${P0.region} opens`); }
    say('T1 Structure', ok && !bad.length, bad.length ? bad.join('; ') : `${open.length} nations, regions open: ${NAT.open.join(', ') || 'none'}` + (notes.length ? ` (not yet reworked: ${notes.join('; ')})` : '')); }

  // T2 opening (owner: normal mode starts close to equal): money a day within 10% of the tier's target, or up to 1.3 times it for a nation the
  // catch-up holds back at its floor; the targets of the richest and poorest tier at most 25% apart; median manpower a day and median opening
  // units in tier order (S at least A at least B at least C, and S above the lowest tier present)
  { const bad = [], tiers = TIERS.filter(t => open.some(o => o.N.tier === t));
    for (const o of open){ const r = o.cash/o.kit.day; if (r < 0.9 || r > 1.3 || (r > 1.105 && o.N.boost > o.kit.floor + 1e-9)) bad.push(`${o.N.name} $${o.cash.toFixed(0)} a day (target ${o.kit.day})`); }
    const tg = tiers.map(t => R.tierKit(t, mode).day), spread = Math.max(...tg)/Math.min(...tg); if (spread > 1.25) bad.push(`tier targets ${spread.toFixed(2)} apart`);
    const mm = tiers.map(t => med(open.filter(o => o.N.tier === t).map(o => o.mp))), mu = tiers.map(t => med(open.filter(o => o.N.tier === t).map(o => o.units)));
    const inOrder = a => a.every((v, i) => i === 0 || v <= a[i - 1] + 1e-9) && (a.length < 2 || a[0] > a[a.length - 1]);
    if (!inOrder(mm)) bad.push('median manpower a day not in tier order: ' + tiers.map((t, i) => t + ' ' + mm[i].toFixed(0)).join(', '));
    if (!inOrder(mu)) bad.push('median opening units not in tier order: ' + tiers.map((t, i) => t + ' ' + mu[i]).join(', '));
    say('T2 Opening', !bad.length, bad.length ? bad.join('; ') : `money a day ${Math.min(...open.map(o => o.cash)).toFixed(0)} to ${Math.max(...open.map(o => o.cash)).toFixed(0)} (targets ${tiers.map((t, i) => t + ' ' + tg[i]).join(', ')}); median manpower ${tiers.map((t, i) => t + ' ' + mm[i].toFixed(0)).join(', ')}; median units ${tiers.map((t, i) => t + ' ' + mu[i]).join(', ')}`); }

  // T9 seats: a nation started as a seat nobody plays, 3 days: no error and it receives its dispatches (every new nation of the step; at step 0 two of the 15)
  { const newOnes = S.nations.filter(N => NAT.open.includes(R.POWERS[N.power].region)).map(N => N.id), list = newOnes.length ? newOnes : [0, 6], bad = [];
    const res = await pool(list.map(n => () => child(12345, 3, 'world64', n).catch(e => ({err:String(e.message).slice(0, 200)}))), JOBS);
    res.forEach((r, i) => { if (r.err) bad.push(`${S.nations[list[i]].name}: ${r.err}`); else if (!r.logs) bad.push(`${S.nations[list[i]].name}: no dispatches`); });
    say('T9 Seats', !bad.length, bad.length ? bad.join('; ') : `${list.length} seats played 3 days, dispatches ${res.map(r => r.logs).join(', ')}`); }
  if (has('quick')){ console.log(failed ? `${failed} FAILED` : 'ALL PASS (quick)'); process.exit(failed ? 1 : 0); }

  if (has('long')){   // T6 length: two seeds, 300 days: no win before day 60; the day of the win is noted (from step 4 on one of the two must be decided by day 250)
    const res = await pool(SEEDS.slice(0, 2).map(s => () => child(s, 300)), 2), early = res.filter(r => r.over && r.over.day < 60);
    say('T6 Length', !early.length && (NAT.open.length < 4 || res.some(r => r.over && r.over.day <= 250)), res.map(r => `seed ${r.seed}: ${r.over ? `${r.over.who || r.over.what} wins on day ${r.over.day}` : 'no winner by day 300'}`).join('; '));
    console.log(failed ? `${failed} FAILED` : 'ALL PASS (long)'); process.exit(failed ? 1 : 0); }

  // the games: every seed for DAYS days; seed 1 once more for T8; the classic world and the nations world side by side for T7
  const t0 = Date.now();
  const [games, again, spd] = await Promise.all([pool(SEEDS.map(s => () => child(s, DAYS)), JOBS), null, null]);
  const full = DAYS >= 60, names = games[0].names, tiers = games[0].tiers, id = nm => names.indexOf(nm);
  const strong = S.nations.map(N => { const L = S.nations.map(M => R.POWERS[M.power]), s0 = R.powerStrength(L[N.id]); return R.powerNeighbours(L, N.id).some(k => R.powerStrength(L[k]) > 3*s0); });

  // T3 survival: nobody is eliminated before day 21 in any seed; a nation with a neighbour over 3 times its strength falls before day 30 in at most 1 seed
  { const bad = []; for (const g of games) for (const n in g.dead) if (g.dead[n] < 21) bad.push(`${names[n]} fell on day ${g.dead[n]} (seed ${g.seed})`);
    names.forEach((nm, n) => { if (strong[n] && games.filter(g => g.dead[n] != null && g.dead[n] < 30).length > 1) bad.push(`${nm} (next to a giant) fell before day 30 in more than 1 seed`); });
    say('T3 Survival', !bad.length, bad.length ? bad.join('; ') : `no nation eliminated before day 21 in ${games.length} seeds` + (Object.keys(Object.assign({}, ...games.map(g => g.dead))).length ? `; later: ${games.flatMap(g => Object.keys(g.dead).map(n => `${names[n]} day ${g.dead[n]} (seed ${g.seed})`)).join(', ')}` : '')); }
  if (full){
    // T4 and T5 are the plan's tests for a full world, where little land is independent. While more than a quarter of the world is still
    // independent (the first steps: 15 nations and half the world free to take, where the classic world grows the same way), every nation swells
    // on free land, so the two tests count the land that was a nation's at the start (what nations win from each other); the plain numbers
    // are printed beside them. From the step where independent land is under a quarter, they are the plan's tests to the letter.
    const freeShare = games[0].free0/games[0].land, own = freeShare > 0.25, H = g => own ? g.nat[60] : g.at[60];
    const mode5 = own ? ` [counted on land won from other nations: ${Math.round(freeShare*100)}% of the world is still independent]` : '';
    // T4 no runaway: in at most 1 seed does a nation hold more than twice its start plus 40 on day 60; nobody has won by day 60
    { const over = g => H(g).map((v, n) => v > 2*g.p0[n] + 40 ? `${names[n]} ${g.p0[n]} to ${v}` : '').filter(Boolean), run = games.filter(g => over(g).length), won = games.filter(g => g.over && g.over.day <= 60);
      const plain = games.map(g => g.at[60].map((v, n) => v > 2*g.p0[n] + 40 ? names[n] + ' ' + g.p0[n] + ' to ' + v : '').filter(Boolean)).filter(l => l.length);
      say('T4 No runaway', run.length <= 1 && !won.length, `${run.length} of ${games.length} seeds with a nation over twice its start plus 40` + (run.length ? ' (' + run.map(g => `seed ${g.seed}: ${over(g).join(', ')}`).join('; ') + ')' : '') + `; won by day 60: ${won.length ? won.map(g => `${g.over.who} day ${g.over.day} (seed ${g.seed})`).join(', ') : 'nobody'}` + mode5 + (own && plain.length ? ` (with independent land: ${plain.map(l => l.join(', ')).join('; ')})` : '')); }
    // T5 tier fairness: on day 60 each tier's land is between 85% and 150% of its start, and at most a quarter of a tier's nations have lost over a third
    { const bad = [], notes = [], plain = [];
      for (const t of TIERS){ const ns = names.map((_, n) => n).filter(n => tiers[n] === t); if (!ns.length) continue; const rs = [], rp = [];
        for (const g of games){ const E = H(g), a = ns.reduce((s, n) => s + g.p0[n], 0), r = ns.reduce((s, n) => s + E[n], 0)/a, lost = ns.filter(n => g.at[60][n] < g.p0[n]*2/3).length; rs.push(r); rp.push(ns.reduce((s, n) => s + g.at[60][n], 0)/a);
          if (r < 0.85 || r > 1.5) bad.push(`tier ${t} ${Math.round(r*100)}% (seed ${g.seed})`); if (lost > Math.max(ns.length/4, ns.length < 4 ? 1 : 0)) bad.push(`tier ${t}: ${lost} of ${ns.length} lost over a third (seed ${g.seed})`); }
        notes.push(`${t} ${Math.round(Math.min(...rs)*100)}-${Math.round(Math.max(...rs)*100)}%`); plain.push(`${t} ${Math.round(Math.min(...rp)*100)}-${Math.round(Math.max(...rp)*100)}%`); }
      say('T5 Tier fairness', !bad.length, (bad.length ? bad.join('; ') + '; ' : '') + 'land on day 60 against the start: ' + notes.join(', ') + mode5 + (own ? ` (with independent land: ${plain.join(', ')})` : '')); }
    // the step's own checks (plan 5.4)
    { const giants = ['Russia', 'China', 'United States', 'India'].filter(nm => id(nm) >= 0), bad = giants.filter(nm => games.filter(g => g.at[60] && g.at[60][id(nm)] >= g.p0[id(nm)]).length < Math.min(3, games.length));
      say('Step 0  giants hold', !bad.length, giants.map(nm => `${nm} ${games.map(g => `${g.p0[id(nm)]}>${(g.at[60] || g.end)[id(nm)]}`).join(' ')}`).join('; ') + (bad.length ? `  (smaller in too many seeds: ${bad.join(', ')})` : '')); }
  } else console.log(`(T4, T5 and the step checks need 60 days: skipped at ${DAYS})`);

  // T7 speed: milliseconds a game day, all computer, against the budget of the step (500 with 15 nations when the classic world takes 444 on the
  // same machine; the two are measured one after the other here, so a busy machine does not decide the test)
  { const BUDGET = {0:500, 1:650, 2:720, 3:950, 4:1150, 5:1250, 6:1250}[NAT.open.length] || 1250;
    const a = await child(12345, 10, 'world'), b = await child(12345, 10, 'world64'), a2 = await child(12345, 10, 'world'), b2 = await child(12345, 10, 'world64'), base = Math.min(a.ms, a2.ms), mine = Math.min(b.ms, b2.ms), scaled = mine/base*444;   // the faster of two runs each
    say('T7 Speed', scaled <= BUDGET, `${mine} ms a game day, the classic world ${Math.round(base)} ms on this machine now: ${Math.round(scaled)} ms on the plan's scale (budget ${BUDGET})`); }
  // T8 same seed, same game (the new world; the old world against the golden file is tools/split-golden.js and node tools/headless.js --check)
  { const a = await child(SEEDS[0], Math.min(DAYS, 20)), b = await child(SEEDS[0], Math.min(DAYS, 20));
    say('T8 Same seed, same game', a.hash === b.hash, `seed ${SEEDS[0]}, ${Math.min(DAYS, 20)} days twice: state hash ${a.hash}${a.hash === b.hash ? '' : ' against ' + b.hash}`); }
  console.log(`(${games.length} seeds, ${DAYS} days, ${Math.round((Date.now() - t0)/1000)} s; ms a game day ${games.map(g => g.ms).join(', ')})`);
  console.log(failed ? `${failed} FAILED` : 'ALL PASS'); process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
