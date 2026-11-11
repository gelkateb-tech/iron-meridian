// Old-world proof (nations step 0): a save made by the build BEFORE the nations world (commit 1eb7231, .test/base1eb) loads in the current build,
// is the classic 15-power world, plays 5 days without an error, and after those 5 days its state is exactly what the old build itself reaches
// from the same save. node .test/nat-oldsave.js
// (the old build: mkdir -p .test/base1eb && git archive 1eb7231 | tar -x -C .test/base1eb && bash .test/base1eb/tools/mkpage.sh)
const { chromium } = require('playwright'); const path = require('path');
const OLD = 'file://' + path.join(__dirname, 'base1eb', '.test', 'page.html'), NEW = 'file://' + path.join(__dirname, 'page.html');
const HASH = `s => { let h1 = 0x811c9dc5, h2 = 0x1b873593; for (let i = 0; i < s.length; i++){ const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 + c, 0x85ebca6b) ^ (h2 >>> 13); } return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0'); }`;
(async () => { const b = await chromium.launch(), errs = [];
  const mk = async url => { const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } }), p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); }); await p.goto(url); await p.waitForTimeout(600); return p; };
  // the old build: Germany (index 5), 4 days, then the save text
  const o = await mk(OLD); await o.click('[data-act="pick"][data-p="5"]'); await o.click('[data-act="begin"]'); await o.click('[data-act="start"]');
  const save = await o.evaluate(() => { newGame(4242, 5, [0]); S.started = true; S.diff = 'regular'; for (let i = 0; i < 96; i++) tick(); return saveJSON(); });
  const play = `(sv) => { const ok = restore(JSON.parse(sv)); if (!ok) return {ok}; for (let i = 0; i < 120; i++) tick(); const o = JSON.parse(saveJSON()); delete o.savedAt;
    return {ok, hour:S.hour, scn:S.scn, w64:!!S.w64, nations:S.nations.length, tier:S.nations[0].tier || null, caps:WIN_CAPS, need:landNeed(0), cities:G.P.filter(P => P.city).length, hash:(${HASH})(JSON.stringify(o))}; }`;
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
