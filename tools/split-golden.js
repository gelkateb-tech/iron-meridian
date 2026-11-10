// Rules split (owner task 5): the behaviour fingerprint. Plays a fixed-seed game for N days with no input and prints one hash of the whole
// saved state per day. Every step of the split must print exactly the same hashes as the step before it (same rules, same AI, same dice).
//   node tools/split-golden.js [days=10] [seed=12345] [page]      (run tools/mkpage.sh first; works the same when copied to tools/)
// newGame / tick / S / saveJSON are reached as globals: they are declared in the rules files (rules/*.js), which are global scripts.
// With seed 12345 it also compares against tools/golden-12345.txt and exits 1 on a difference.
const { chromium } = require('playwright'); const path = require('path'), TEST = path.join(process.env.IM_ROOT || path.join(__dirname, '..'), '.test'), fs = require('fs');
(async () => { const days = +(process.argv[2] || 10), seed = +(process.argv[3] || 12345);
  let page = process.argv[4] || 'page.html';
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1300, height: 820 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const load = async f => { await p.goto('file://' + path.join(TEST, f)); await p.waitForTimeout(800); return p.evaluate(() => typeof newGame === 'function' && typeof tick === 'function' && typeof saveJSON === 'function'); };
  if (!(await load(page)) && !process.argv[4] && fs.existsSync(path.join(TEST, 'split-noiife.html'))){ page = 'split-noiife.html'; await load(page); }
  if (await p.locator('[data-act="pick"]').count()){ await p.click('[data-act="pick"][data-p="0"]'); await p.click('[data-act="begin"]'); }
  await p.click('[data-act="start"]'); await p.waitForTimeout(300);
  const out = await p.evaluate(([d, sd]) => { if (typeof newGame !== 'function') return null; newGame(sd, 0); S.started = true; const sig = [];
    const hash = s => { let h1 = 0x811c9dc5, h2 = 0x1b873593; for (let i = 0; i < s.length; i++){ const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 + c, 0x85ebca6b) ^ (h2 >>> 13); } return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0'); };
    for (let i = 0; i < d*24; i++){ tick(); if (i % 24 === 23){ const o = JSON.parse(saveJSON()); delete o.savedAt; sig.push(`day ${String(S.hour/24).padStart(2)}  ${hash(JSON.stringify(o))}  rs ${S.rs}  forces ${S.armies.length}  log ${S.log.length}`); } } return sig; }, [days, seed]);
  console.log(out ? `${page}  seed ${seed}\n` + out.join('\n') : 'newGame is not reachable on ' + page);
  const gold = path.join(__dirname, 'golden-' + seed + '.txt'); let same = true;   // the recorded fingerprint (tools/golden-12345.txt): the days played must match it line for line
  if (out && fs.existsSync(gold)){ const G0 = fs.readFileSync(gold, 'utf8').split('\n').filter(Boolean); const bad = out.findIndex((l, i) => i < G0.length && l !== G0[i]); same = bad < 0;
    console.log(same ? `GOLDEN same (${Math.min(out.length, G0.length)} days against ${path.basename(gold)})` : `GOLDEN DIFFERENT from day ${bad + 1}: expected ${G0[bad]}`); } console.log('ERRORS', errs.length ? errs.slice(0, 5) : 'none'); await b.close(); process.exit(out && !errs.length && same ? 0 : 1); })();
