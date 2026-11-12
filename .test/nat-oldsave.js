// Old-world proof (nations step 0; since the merge into master, against master as it was before the merge): a save made by the build BEFORE the
// nations world (master 8d9051c, .test/base8d9; on the nations branch it was 1eb7231) loads in the current build, is the classic 15-power world,
// plays 5 days without an error, and after those 5 days its state is exactly what the old build itself reaches from the same save.
// node .test/nat-oldsave.js
// (the old build: mkdir -p .test/base8d9 && git archive 8d9051c | tar -x -C .test/base8d9 && bash .test/base8d9/tools/mkpage.sh)
const { chromium } = require('playwright'); const pickNation = require('./pick-nation.js'); const path = require('path');
const OLD = 'file://' + path.join(__dirname, 'base8d9', '.test', 'page.html'), NEW = 'file://' + path.join(__dirname, 'page.html');
const HASH = `s => { let h1 = 0x811c9dc5, h2 = 0x1b873593; for (let i = 0; i < s.length; i++){ const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 + c, 0x85ebca6b) ^ (h2 >>> 13); } return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0'); }`;
(async () => { const b = await chromium.launch(), errs = [];
  const mk = async url => { const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } }), p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); }); await p.goto(url); await p.waitForTimeout(600); return p; };
  // the old build: Germany (index 5), 4 days, then the save text
  const o = await mk(OLD); await pickNation(o, 'Germany'); await o.click('[data-act="begin"]'); await o.click('[data-act="start"]');
  const save = await o.evaluate(() => { newGame(4242, 5, [0]); S.started = true; S.diff = 'regular'; for (let i = 0; i < 96; i++) tick(); return saveJSON(); });
  const play = `(sv) => { const ok = restore(JSON.parse(sv)); if (!ok) return {ok}; for (let i = 0; i < 120; i++) tick(); const o = JSON.parse(saveJSON()); delete o.savedAt;
    // (the resource scale, RES_K: the new build counts goods 1,000 times larger. Both states are compared in the old units: goods divided back, the
    // numbers to 10 significant digits, the figures in the dispatch and chat texts left out)
    const K = typeof RES_K === 'number' ? RES_K : 1, G0 = ['oil', 'metal', 'iron', 'elec', 'rare'], xs = v => { if (v && typeof v === 'object') for (const k of G0) if (typeof v[k] === 'number') v[k] /= K; };
    delete o.rk; for (const N of o.nations){ xs(N); xs(N.xB); xs(N.surS); if (typeof N.sold === 'number') N.sold /= K; } for (const x of o.book || []){ x.qty /= K; if (typeof x.q0 === 'number') x.q0 /= K; }
    if (o.mkt){ xs(o.mkt.use); xs(o.mkt.dem); } if (o.trade && o.trade.routes) for (const r of o.trade.routes) for (const v of [r.va, r.vb]) if (v && typeof v.q === 'number') v.q /= K;
    for (const D of [o, ...Object.values(o.desks || {})]){ for (const f of (D.offers || [])) if (f && f.deal){ xs(f.deal.give); xs(f.deal.get); } if (D.stats){ xs(D.stats.made); if (typeof D.stats.rareRes === 'number') D.stats.rareRes /= K; } }
    const norm = JSON.stringify(o, (k, v) => typeof v === 'number' ? +v.toPrecision(10) : typeof v === 'string' && k === 'text' ? v.replace(/[\d][\d,.]*/g, '#') : v);
    return {ok, hour:S.hour, scn:S.scn, w64:!!S.w64, nations:S.nations.length, tier:S.nations[0].tier || null, caps:WIN_CAPS, need:landNeed(0), cities:G.P.filter(P => P.city).length, hash:(${HASH})(norm)}; }`;
  const ro = await o.evaluate(`(${play})(${JSON.stringify(save)})`);
  // the current build: through the real Continue button, then the same 5 days
  const n = await mk(NEW); await n.evaluate(sv => localStorage.setItem('iron-meridian-save-v5', sv), save); await n.reload(); await n.waitForTimeout(700);
  await n.click('[data-act="continue"]'); await n.waitForTimeout(500);
  const cont = await n.evaluate(() => ({hour:S.hour, me:S.nations[0].name, scn:SCN}));
  const rn = await n.evaluate(`(${play})(${JSON.stringify(save)})`);
  // and once more after a nations-world game was played in the same page (the world switch must give the old world back)
  const rn2 = await n.evaluate(`(() => { useScenario('world64'); newGame(1, 0, [0]); for (let i = 0; i < 24; i++) tick(); return (${play})(${JSON.stringify(save)}); })()`);
  const same = ro.ok && rn.ok && ro.hash === rn.hash && rn2.hash === ro.hash, classic = rn.scn === 'world' && !rn.w64 && rn.nations === 15 && rn.tier === null && rn.caps === 5 && rn.cities === ro.cities;
  console.log(JSON.stringify({saveKB:Math.round(save.length/1024), cont, old:ro, now:rn, afterNationsGame:rn2.hash, same, classic}, null, 1));
  console.log('ERRORS', errs.length ? errs : 'none'); await b.close(); process.exit(errs.length || !same || !classic || cont.hour !== 96 ? 1 : 0); })();
