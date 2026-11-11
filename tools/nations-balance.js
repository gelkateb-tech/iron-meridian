#!/usr/bin/env node
// Balance tests of the nations world (scenario world64; docs/NATIONS-PLAN.md 5.2). All-computer games without a browser, like tools/headless.js.
// One PASS or FAIL line per test; exit 1 on any FAIL.
//   node tools/nations-balance.js                 T1 T2 T3 T4 T5 T7 T8 T9 and the checks of each step done (plan 5.4): 5 seeds, 60 game days each
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
    + '\nreturn {IM, UNITS, income, tradeIncome, tierKit, tierMode, TIER_MODES, powerStrength, powerNeighbours, ECO_CAPITAL, winCapsFor, winShareFor, landNeed, cityMain, get WIN_CAPS(){ return WIN_CAPS; }, get POWERS(){ return POWERS; }};')(); }
const hash = s => { let h1 = 0x811c9dc5, h2 = 0x1b873593; for (let i = 0; i < s.length; i++){ const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 + c, 0x85ebca6b) ^ (h2 >>> 13); } return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0'); };
const provs = S => { const c = S.nations.map(() => 0); for (const o of S.owner) if (o >= 0) c[o]++; return c; };
const unitsOf = S => { const c = S.nations.map(() => 0); for (const a of S.armies) if (a.owner >= 0) for (const k in a.u) c[a.owner] += a.u[k] || 0; return c; };

// ---- one game (child process): plays `days` days of seed `seed`, all computer, and prints one JSON line
function playOne(seed, days, scn, seat){ const R = load(), api = R.IM.api, UNITS = R.UNITS; let logs = 0; R.IM.on('log', () => logs++);
  api.useScenario(scn); api.newGame(seed, 0, seat >= 0 ? [seat] : []); const S = api.S, G = api.G; S.started = true;
  const nat = () => { const c = S.nations.map(() => 0); for (let p = 0; p < S.owner.length; p++) if (S.owner[p] >= 0 && S.own0[p] >= 0) c[S.owner[p]]++; return c; };   // land that was a nation's at the start, by who holds it now
  const free = () => { const c = S.nations.map(() => 0); for (let p = 0; p < S.owner.length; p++) if (S.owner[p] >= 0 && S.own0[p] === -1) c[S.owner[p]]++; return c; };   // independent land at the start, by who holds it now
  const out = {seed, scn, names:S.nations.map(N => N.name), tiers:S.nations.map(N => N.tier || ''), p0:provs(S), free0:S.own0.filter(o => o === -1).length, land:G.landCount, at:{}, nat:{}, free:{}, dead:{}, over:null, wars:{}, oil:{}};
  const took = S.nations.map(() => new Set());
  // ships of each nation, counted once a day: a day with more than the day before means it built some (step 4's check of the sea nations)
  const navy = () => { const c = S.nations.map(() => 0); for (const a of S.armies) if (a.owner >= 0) for (const k in a.u) if (UNITS[k] && UNITS[k].cls === 'naval') c[a.owner] += a.u[k] || 0; return c; };
  let nav = navy(); out.navBuilt = S.nations.map(() => 0);
  const t0 = Date.now(); let h = 0;
  for (; h < days*24 && !S.over; h++){ api.tick();
    if (S.hour % 24 === 0){ const d = S.hour/24; for (const N of S.nations) if (!N.alive && out.dead[N.id] == null) out.dead[N.id] = d;
      { const v = navy(); v.forEach((k, n) => { if (k > nav[n]) out.navBuilt[n] += k - nav[n]; }); nav = v; }
      if (d >= 30 && d <= 60){ const F = out.foes || (out.foes = S.nations.map(() => [])); for (const k in S.rel) if (S.rel[k] && S.rel[k].st === 'war'){ const [a, b] = k.split(',').map(Number);   // every enemy of each nation in the second month (step 4's check)
        if (a >= 0 && b >= 0){ if (!F[a].includes(b)) F[a].push(b); if (!F[b].includes(a)) F[b].push(a); } } }
      if (d === 60){ out.gain60 = S.nations.map(() => 0); for (let p = 0; p < S.owner.length; p++) if (S.owner[p] >= 0 && S.own0[p] !== S.owner[p]) out.gain60[S.owner[p]]++; }   // provinces held on day 60 that it did not start with
      if (d <= 30) for (let p = 0; p < S.owner.length; p++) if (S.own0[p] === -1 && S.owner[p] >= 0) took[S.owner[p]].add(p);   // independent land taken by day 30, held or lost again since
      if (d === 30) out.took30 = took.map(t => t.size);
      if (d === 30){ out.cash30 = S.nations.map(N => Math.round(N.cash)); out.net30 = S.nations.map(N => N.alive ? Math.round(R.income(N.id).net.cash) : null); }   // treasury and money a day on day 30 (step 3's check)
      if (d === 1 || d === 60) out.oil[d] = S.mkt && S.mkt.p ? +S.mkt.p.oil.toFixed(3) : null;   // the world oil price (step 2's check)
      if ([21, 30, 45, 60, 120, 250, 300].includes(d)){ out.at[d] = provs(S); out.nat[d] = nat(); out.free[d] = free(); out.wars[d] = Object.keys(S.rel).filter(k => S.rel[k] && S.rel[k].st === 'war').map(k => k.split(',').map(Number)); } } }
  if (S.over){ out.over = {day:Math.ceil(S.hour/24), what:S.over, who:S.overReason};   // a game won early: the later checkpoints hold the final state
    for (const d of [21, 30, 45, 60, 120, 250, 300]) if (d <= days && !out.at[d]){ out.at[d] = provs(S); out.nat[d] = nat(); out.free[d] = free(); out.wars[d] = []; }
    if (!out.took30) out.took30 = took.map(t => t.size); if (!out.cash30) out.cash30 = S.nations.map(N => Math.round(N.cash)); if (!out.net30) out.net30 = S.nations.map(() => 0);
    if (!out.gain60) out.gain60 = S.nations.map(() => 0); if (out.oil[60] == null) out.oil[60] = S.mkt && S.mkt.p ? +S.mkt.p.oil.toFixed(3) : null; }
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
    // (the medians count the nations of the regions rolled out, with their planned cities, once a region is open: a nation still on today's
    // cities, Turkey's 4 or Japan's 5, opens with fewer units because it has fewer cities, not because of its tier)
    const done = NAT.open.length ? open.filter(o => NAT.open.includes(R.POWERS[o.N.power].region)) : open, tt = tiers.filter(t => done.some(o => o.N.tier === t));
    const mm = tt.map(t => med(done.filter(o => o.N.tier === t).map(o => o.mp))), mu = tt.map(t => med(done.filter(o => o.N.tier === t).map(o => o.units)));
    const inOrder = a => a.every((v, i) => i === 0 || v <= a[i - 1] + 1e-9) && (a.length < 2 || a[0] > a[a.length - 1]);
    if (!inOrder(mm)) bad.push('median manpower a day not in tier order: ' + tt.map((t, i) => t + ' ' + mm[i].toFixed(0)).join(', '));
    if (!inOrder(mu)) bad.push('median opening units not in tier order: ' + tt.map((t, i) => t + ' ' + mu[i]).join(', '));
    say('T2 Opening', !bad.length, bad.length ? bad.join('; ') : `money a day ${Math.min(...open.map(o => o.cash)).toFixed(0)} to ${Math.max(...open.map(o => o.cash)).toFixed(0)} (targets ${tiers.map((t, i) => t + ' ' + tg[i]).join(', ')}); median manpower ${tt.map((t, i) => t + ' ' + mm[i].toFixed(0)).join(', ')}; median units ${tt.map((t, i) => t + ' ' + mu[i]).join(', ')}${NAT.open.length ? ` (medians over the ${done.length} nations of ${NAT.open.join(', ')})` : ''}`); }

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
    // step 0 (no region open): the four giants are not smaller on day 60 than at the start in at least 3 seeds of 5
    if (!NAT.open.length){ const giants = ['Russia', 'China', 'United States', 'India'].filter(nm => id(nm) >= 0), bad = giants.filter(nm => games.filter(g => g.at[60] && g.at[60][id(nm)] >= g.p0[id(nm)]).length < Math.min(3, games.length));
      say('Step 0  giants hold', !bad.length, giants.map(nm => `${nm} ${games.map(g => `${g.p0[id(nm)]}>${(g.at[60] || g.end)[id(nm)]}`).join(' ')}`).join('; ') + (bad.length ? `  (smaller in too many seeds: ${bad.join(', ')})` : '')); }
    // step 1, Europe (from then on): Norway and Finland alive on day 45 in at least 4 seeds of 5, Poland and Ukraine on day 30 in at least 4 (and
    // Greece and Belarus, the two small nations of the split, the same); Russia holds at least 85% of its start on day 60 in 3 of 5; Germany,
    // hemmed in by six independent states, has taken at least 3 independent provinces by day 30 in at least 4 of 5 (it must not sit still)
    if (NAT.open.includes('Europe')){ const need = k => Math.min(k, games.length), alive = (nm, d) => games.filter(g => !(g.dead[id(nm)] != null && g.dead[id(nm)] <= d)).length;
      const surv = [['Norway', 45], ['Finland', 45], ['Poland', 30], ['Ukraine', 30], ['Greece', 30], ['Belarus', 30]], low = surv.filter(([nm, d]) => alive(nm, d) < need(4));
      say('Step 1  Europe survives', !low.length, surv.map(([nm, d]) => `${nm} alive on day ${d} in ${alive(nm, d)} of ${games.length}`).join(', '));
      const ru = id('Russia'), held = games.filter(g => g.at[60][ru] >= 0.85*g.p0[ru]).length;
      say('Step 1  Russia holds', held >= need(3), `Russia at least 85% of its start on day 60 in ${held} of ${games.length} (${games.map(g => `${g.p0[ru]}>${g.at[60][ru]}`).join(' ')})`);
      // (taken by day 30, as the plan words it: a province taken and lost again in a war with a neighbour still shows Germany did not sit still)
      const de = id('Germany'), took = games.filter(g => g.took30[de] >= 3).length;
      say('Step 1  Germany moves', took >= need(4), `Germany has taken 3 or more independent provinces by day 30 in ${took} of ${games.length} (${games.map(g => g.took30[de]).join(', ')}; still held on day 30: ${games.map(g => g.free[30][de]).join(', ')})`); }
    // step 2, the Middle East (from then on): Syria and Yemen alive on day 30 in at least 4 seeds of 5 (and Israel, the small nation of the split,
    // the same); Turkey and Iran, which lost half their land in the plan's trial, hold at least 75% of their start on day 60 in 3 of 5; every
    // nation of the region has an oil city or oil in the capital trickle; the world oil price on day 60 is within half and double its day-1 value
    if (NAT.open.includes('Middle East')){ const need = k => Math.min(k, games.length), alive = (nm, d) => games.filter(g => !(g.dead[id(nm)] != null && g.dead[id(nm)] <= d)).length;
      const surv = [['Syria', 30], ['Yemen', 30], ['Israel', 30]], low = surv.filter(([nm, d]) => alive(nm, d) < need(4));
      say('Step 2  Middle East survives', !low.length, surv.map(([nm, d]) => `${nm} alive on day ${d} in ${alive(nm, d)} of ${games.length}`).join(', '));
      const hold = ['Turkey', 'Iran'].map(nm => { const n = id(nm); return {nm, k:games.filter(g => g.at[60][n] >= 0.75*g.p0[n]).length, l:games.map(g => `${g.p0[n]}>${g.at[60][n]}`).join(' ')}; });
      say('Step 2  Turkey and Iran hold', hold.every(h => h.k >= need(3)), hold.map(h => `${h.nm} at least 75% of its start on day 60 in ${h.k} of ${games.length} (${h.l})`).join('; '));
      const me = open.filter(o => R.POWERS[o.N.power].region === 'Middle East'), oilC = me.filter(o => o.cities.some(P => R.cityMain(P.id) === 'oil')).map(o => o.N.name), trickle = R.ECO_CAPITAL.oil > 0;
      const dry = me.filter(o => !oilC.includes(o.N.name) && !trickle).map(o => o.N.name);
      say('Step 2  oil for all', !dry.length, `${oilC.length} of ${me.length} with an oil city` + (oilC.length < me.length ? ` (${me.filter(o => !oilC.includes(o.N.name)).map(o => o.N.name).join(', ')} on the capital's oil, ${R.ECO_CAPITAL.oil} a day)` : '') + `; every capital makes ${R.ECO_CAPITAL.oil} oil a day`);
      const pr = games.map(g => g.oil[60]/g.oil[1]), wild = games.filter((g, i) => !(pr[i] >= 0.5 && pr[i] <= 2));
      say('Step 2  oil price', !wild.length, `world oil price day 60 against day 1: ${games.map((g, i) => `${g.oil[1]}>${g.oil[60]} (x${pr[i].toFixed(2)})`).join(', ')}`); }
    // step 3, Africa (from then on): no African nation more than doubles its provinces by day 60 in more than 1 seed of 5 (Mali tripled in the
    // plan's trial); the two landlocked desert nations, Mali and Chad, have money in the treasury (above zero) on day 30 in every seed
    if (NAT.open.includes('Africa')){ const af = names.map((_, n) => n).filter(n => R.POWERS[S.nations[n].power].region === 'Africa');
      const dbl = af.map(n => ({n, k:games.filter(g => g.at[60][n] > 2*g.p0[n]).length})), many = dbl.filter(x => x.k > 1), some = dbl.filter(x => x.k);
      const anySeed = games.filter(g => af.some(n => g.at[60][n] > 2*g.p0[n])).length;
      say('Step 3  Africa no doubling', !many.length, (some.length ? some.map(x => `${names[x.n]} more than doubled in ${x.k} of ${games.length} (${games.map(g => `${g.p0[x.n]}>${g.at[60][x.n]}`).join(' ')})`).join('; ') : `no African nation more than doubled by day 60`)
        + `; seeds with any African nation doubled: ${anySeed} of ${games.length}; largest growth: ${af.map(n => ({n, r:Math.max(...games.map(g => g.at[60][n]/g.p0[n]))})).sort((x, y) => y.r - x.r).slice(0, 4).map(x => `${names[x.n]} x${x.r.toFixed(2)}`).join(', ')}`);
      // (positive money: money coming in on day 30, more than its upkeep, in every seed, and a treasury not in debt; a computer nation spends its
      // treasury down to what it keeps, so the treasury alone says little)
      const dry = ['Mali', 'Chad'].map(nm => ({nm, c:games.map(g => g.cash30[id(nm)]), net:games.map(g => g.net30[id(nm)]), dead:games.filter(g => g.dead[id(nm)] != null && g.dead[id(nm)] <= 30).length}));
      say('Step 3  Mali and Chad solvent', dry.every(x => !x.dead && x.net.every(v => v > 0) && x.c.every(c => c >= 0)), dry.map(x => `${x.nm} on day 30: money a day ${x.net.map(v => (v > 0 ? '+' : '') + v).join(', ')}, treasury ${x.c.join(', ')}` + (x.dead ? ` (eliminated by day 30 in ${x.dead})` : '')).join('; ')); }
    // step 4, Asia (from then on): North Korea, Mongolia and Bangladesh, the three weakest pairings on the map, alive on day 30 in at least 4
    // seeds of 5; China and India at war with each other or with a tier S or A nation, not only with smaller ones, in at least 3 of 5 on
    // day 60, as the plan words it (the enemies of the whole second month, days 30 to 60, are printed beside it);
    // the sea nations Japan, Indonesia and the Philippines each hold on day 60 a province they did not start with, or have built ships, in at
    // least 3 of 5 (the computer must not be stuck on its islands)
    if (NAT.open.includes('Asia')){ const need = k => Math.min(k, games.length), alive = (nm, d) => games.filter(g => !(g.dead[id(nm)] != null && g.dead[id(nm)] <= d)).length;
      const surv = [['North Korea', 30], ['Mongolia', 30], ['Bangladesh', 30]], low = surv.filter(([nm, d]) => alive(nm, d) < need(4));
      say('Step 4  Asia survives', !low.length, surv.map(([nm, d]) => `${nm} alive on day ${d} in ${alive(nm, d)} of ${games.length}`).join(', '));
      const big = ['China', 'India'].map(nm => { const n = id(nm), on60 = g => (g.wars[60] || []).filter(w => w.includes(n)).map(w => w[0] === n ? w[1] : w[0]), month = g => (g.foes || [])[n] || [];
        const peer = m => tiers[m] === 'S' || tiers[m] === 'A', ok = games.filter(g => month(g).some(peer)).length, ok60 = games.filter(g => on60(g).some(peer)).length;
        return {nm, ok, ok60, l:games.map(g => (month(g).map(m => `${names[m]} ${tiers[m]}`).join('+') || 'peace') + ` [day 60: ${on60(g).map(m => names[m]).join('+') || 'peace'}]`).join('; ')}; });
      say('Step 4  China and India fight their weight', big.every(b => b.ok60 >= need(3)), big.map(b => `${b.nm} at war with ${b.nm === 'China' ? 'India' : 'China'} or a tier S or A nation on day 60 in ${b.ok60} of ${games.length}, in days 30 to 60 in ${b.ok} (${b.l})`).join('; '));
      const sea = ['Japan', 'Indonesia', 'Philippines'].map(nm => { const n = id(nm), ok = games.filter(g => g.gain60[n] > 0 || g.navBuilt[n] > 0).length;
        return {nm, ok, l:games.map(g => `${g.gain60[n]} new, ${g.navBuilt[n]} ships`).join('; ')}; });
      say('Step 4  sea nations move', sea.every(x => x.ok >= need(3)), sea.map(x => `${x.nm} took land or built ships in ${x.ok} of ${games.length} (${x.l})`).join('; ')); }
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
