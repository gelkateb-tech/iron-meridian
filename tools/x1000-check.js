#!/usr/bin/env node
// The resource scale (RES_K in rules/data.js, the owner's "multiply every resource but money by 1,000") must not change how the game plays.
// This plays the same all-computer games with the rules of a base commit (default origin/master: without the scale) and with the rules on disk, and
// compares them in the old units (every quantity of oil, materials, iron, electronics and rare materials divided by RES_K):
//   every game day: the dice state, and for every nation its provinces, units in service and in training by type, research done and running,
//   money, goods and manpower; the battles under way, provinces captured so far, Market listings and prices;
//   on the last day: the whole saved state (saveJSON), field by field.
// Numbers must agree to 1e-9 (relative): multiplying by 1,000 can move the last bit of a float, never a decision. The report gives the largest
// drift seen in money and in goods, and the first difference (day, nation, field) of any game that is not the same.
//   node tools/x1000-check.js                       30 days, seeds 12345 7 2026, the classic world and the nations world
//   node tools/x1000-check.js --days 10 --seeds 12345 --worlds world
//   node tools/x1000-check.js --base <commit>       compare with another commit's rules (default origin/master, else master; unpacked with git archive)
//   node tools/x1000-check.js --tmp <dir>           where the base commit's files are unpacked (default: the system's temporary folder)
//   node tools/x1000-check.js --jobs 2              games played at the same time (default 3)
// Exit 1 when any game differs.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const ROOT = path.resolve(path.join(__dirname, '..'));
const argS = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d; };
const GOODS = ['oil', 'metal', 'iron', 'elec', 'rare'];

// ---- one game in this process (a child): the rules of `root`, scenario scn, seed, days. Prints one JSON line: the daily fingerprints and the end state
function child(root, scn, seed, days, file){
  globalThis.window = globalThis; require(path.join(root, 'world.js')); require(path.join(root, 'nations.js')); require(path.join(root, 'lines.js'));
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
  const R = new Function("'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n') + "\nreturn {IM, UT, K:typeof RES_K === 'number' ? RES_K : 1};")();
  const api = R.IM.api, K = R.K; let caps = 0, bst = 0, bprev = new Set(); R.IM.on('fxCapture', () => caps++);
  api.useScenario(scn); api.newGame(seed, 0, []); const S = api.S; S.started = true;
  const fp = () => { const prov = S.nations.map(() => 0); for (const o of S.owner) if (o >= 0) prov[o]++;
    const units = S.nations.map(() => ({})), train = S.nations.map(() => ({}));
    for (const a of S.armies) if (a.owner >= 0) for (const t of R.UT) if (a.u[t]) units[a.owner][t] = (units[a.owner][t] || 0) + a.u[t];
    S.queue.forEach((q, p) => { const o = S.owner[p]; if (o >= 0) for (const it of q) train[o][it.t] = (train[o][it.t] || 0) + 1; });
    const M = S.mkt || {p:{}}, wars = Object.keys(S.rel).filter(k => S.rel[k] && S.rel[k].st === 'war').sort();
    return {h:S.hour, rs:S.rs, battles:S.battles.slice().sort((a, b) => a - b), bstart:bst, captures:caps, wars, price:GOODS.map(k => M.p[k] || 0),
      book:(S.book || []).map(o => [o.seller, o.type, o.res, o.qty/K, o.price]),
      n:S.nations.map((N, i) => ({alive:N.alive, prov:prov[i], cash:N.cash, mp:N.mp, goods:GOODS.map(k => N[k]/K), units:units[i], train:train[i],
        tech:Object.keys(N.tech || {}).sort().map(id => id + ':' + N.tech[id]), research:[N.research && N.research.id + ':' + N.research.lv, N.research2 && N.research2.id + ':' + N.research2.lv]}))}; };
  const out = {days:[], end:null};
  for (let h = 0; h < days*24 && !S.over; h++){ for (let q = 0; q < api.BATTLE_Q; q++){ api.tickQ(); for (const p of S.battles) if (!bprev.has(p)) bst++; bprev = new Set(S.battles); } if (S.hour % 24 === 0) out.days.push(fp()); }   // (bst: battles begun)
  // the end state in the old units: every stored goods quantity divided by K (the fields resKMigrate in rules/state.js scales)
  const o = JSON.parse(api.saveJSON()); delete o.rk; delete o.savedAt;
  const xs = v => { if (v && typeof v === 'object') for (const k of GOODS) if (typeof v[k] === 'number') v[k] /= K; };
  for (const N of o.nations){ xs(N); xs(N.xB); xs(N.surS); if (typeof N.sold === 'number') N.sold /= K; }
  for (const b of o.book || []){ b.qty /= K; if (typeof b.q0 === 'number') b.q0 /= K; }
  if (o.mkt){ xs(o.mkt.use); xs(o.mkt.dem); }
  if (o.trade && o.trade.routes) for (const r of o.trade.routes) for (const v of [r.va, r.vb]) if (v && typeof v.q === 'number') v.q /= K;
  out.end = o; fs.writeFileSync(file, JSON.stringify(out));   // (a file: a big result on a pipe is cut short when the process exits)
}
if (process.argv[2] === '--child'){ child(process.argv[3], process.argv[4], +process.argv[5], +process.argv[6], process.argv[7]); process.exit(0); }

// ---- the parent: extract the base rules, play every game twice (base, current), compare
const git = (...a) => cp.execFileSync('git', a, {cwd:ROOT, maxBuffer:1 << 30});
const hasRef = r => { try { git('rev-parse', '--verify', '--quiet', r + '^{commit}'); return true; } catch (e) { return false; } };
const DAYS = +argS('days', 30), SEEDS = String(argS('seeds', '12345,7,2026')).split(',').map(Number), WORLDS = String(argS('worlds', 'world,world64')).split(','), BASE = argS('base', hasRef('origin/master') ? 'origin/master' : 'master'), JOBS = +argS('jobs', 3);
const baseDir = fs.mkdtempSync(path.join(argS('tmp', os.tmpdir()), 'x1000-base-')), baseRev = git('rev-parse', '--short', BASE + '^{commit}').toString().trim();
// the base commit's page, worlds and rules files, unpacked from git archive (only those files: no assets)
cp.execSync(`git archive --format=tar ${baseRev} index.html world.js nations.js lines.js rules | tar -x -C "${baseDir}"`, {cwd:ROOT, maxBuffer:1 << 30});
const jobs = []; for (const w of WORLDS) for (const s of SEEDS) for (const [tag, root] of [['base', baseDir], ['now', ROOT]]) jobs.push({w, s, tag, root});
const run = J => new Promise((ok, bad) => { const f = path.join(baseDir, `out-${J.tag}-${J.w}-${J.s}.json`), c = cp.spawn(process.execPath, ['--max-old-space-size=4096', __filename, '--child', J.root, J.w, String(J.s), String(DAYS), f]); let e = '';
  c.stdout.on('data', () => {}); c.stderr.on('data', d => e += d); c.on('close', code => code === 0 ? ok(JSON.parse(fs.readFileSync(f, 'utf8'))) : bad(new Error(`${J.tag} ${J.w} seed ${J.s}: exit ${code}\n${e}`))); });
// a deep comparison with a relative tolerance on numbers; drift: the largest relative difference seen under money and goods fields
const near = (a, b) => a === b || Math.abs(a - b) <= 1e-9*Math.max(1, Math.abs(a), Math.abs(b));
function diff(a, b, at, drift, out){ if (out.length > 4) return;
  if (typeof a === 'number' && typeof b === 'number'){ const d = Math.abs(a - b)/Math.max(1, Math.abs(a), Math.abs(b)), key = /cash|price|\.p\.|prev|hist|capt/.test(at) ? 'money' : /goods|\.(oil|metal|iron|elec|rare|qty|q0|q|sold)\b|use|dem|xB|surS|book/.test(at) ? 'goods' : 'other';
    if (d > drift[key]) drift[key] = d; if (!near(a, b)) out.push(`${at}: ${a} (base) vs ${b} (now)`); return; }
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object'){ if (a !== b) out.push(`${at}: ${JSON.stringify(a)} (base) vs ${JSON.stringify(b)} (now)`); return; }
  if (Array.isArray(a) !== Array.isArray(b)){ out.push(`${at}: array vs object`); return; }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])){ if (!(k in a) || !(k in b)){ out.push(`${at}.${k}: only in ${k in a ? 'base' : 'now'}`); continue; } diff(a[k], b[k], `${at}.${k}`, drift, out); } }
(async () => {
  const t0 = Date.now(), res = new Map(); let next = 0;
  await Promise.all(Array.from({length:Math.min(JOBS, jobs.length)}, async () => { while (next < jobs.length){ const J = jobs[next++]; res.set(`${J.w} ${J.s} ${J.tag}`, await run(J)); } }));
  console.log(`resource scale check: base ${BASE} (${baseRev}) against the rules on disk, ${DAYS} days, seeds ${SEEDS.join(' ')}, ${WORLDS.map(w => w === 'world' ? 'classic world' : 'nations world').join(' and ')} (${((Date.now() - t0)/1000).toFixed(0)} s)`);
  let bad = 0; const all = {money:0, goods:0, other:0};
  for (const w of WORLDS) for (const s of SEEDS){ const A = res.get(`${w} ${s} base`), B = res.get(`${w} ${s} now`), drift = {money:0, goods:0, other:0}, out = [];
    if (A.days.length !== B.days.length) out.push(`days played: ${A.days.length} (base) vs ${B.days.length} (now)`);
    for (let d = 0; d < Math.min(A.days.length, B.days.length) && !out.length; d++) diff(A.days[d], B.days[d], `day ${d + 1}`, drift, out);
    if (!out.length) diff(A.end, B.end, 'end state', drift, out);
    for (const k in all) all[k] = Math.max(all[k], drift[k]);
    const L = B.days[B.days.length - 1] || {n:[]}, sum = f => L.n.reduce((s0, N) => s0 + f(N), 0);
    const built = sum(N => Object.values(N.units).reduce((x, y) => x + y, 0) + Object.values(N.train).reduce((x, y) => x + y, 0)), tech = sum(N => N.tech.length), prov = sum(N => N.prov), cash = sum(N => N.cash), goods = sum(N => N.goods.reduce((x, y) => x + y, 0));
    console.log(`${out.length ? 'DIFFERENT' : 'SAME     '}  ${w === 'world' ? 'classic world' : 'nations world'} seed ${s}: ${B.days.length} days, dice ${L.rs}, ${L.n.filter(N => N.alive).length} nations alive, ${built} units in service and training, ${prov} provinces owned, ${L.bstart} battles, ${tech} research nodes, ${L.captures} provinces captured, ${L.wars.length} wars, money $${cash.toFixed(1)}M, goods / RES_K ${goods.toFixed(1)}, ${L.book.length} Market listings; largest drift: money ${drift.money.toExponential(1)}, goods ${drift.goods.toExponential(1)}`);
    if (out.length){ bad++; for (const l of out) console.log('   ' + l); } }
  fs.rmSync(baseDir, {recursive:true, force:true});
  console.log(bad ? `X1000 CHECK FAILED: ${bad} game(s) play differently` : `X1000 CHECK OK: every game plays the same (decisions, dice, units, provinces, battles, research, money and goods / RES_K); largest drift money ${all.money.toExponential(1)}, goods ${all.goods.toExponential(1)}, other ${all.other.toExponential(1)}`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e.message); try { fs.rmSync(baseDir, {recursive:true, force:true}); } catch (e2) {} process.exit(2); });
