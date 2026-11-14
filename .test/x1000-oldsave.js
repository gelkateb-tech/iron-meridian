// Resource scale (RES_K, rules/data.js) and saves: node .test/x1000-oldsave.js [base commit, default BASE_OLD = 6154c49]   (bash tools/mkpage.sh first)
// 1. A save made by the base build (the last master commit before the x1000 merge: no S.rk, goods in the old units) loads in this build through the real Continue button with its goods
//    multiplied by RES_K once: every nation's oil, materials, iron, electronics and rare materials, Market lots and trade-route cargo are exactly
//    RES_K times the save's, money, manpower and Market prices are as they were, S.rk = RES_K. Restoring the same old save again (in the same page,
//    after a game) scales it again from the save text only: never twice.
// 2. That save then plays 5 days in this build (the same save twice: the same state) and its world totals of money and goods, in the old units
//    (goods / RES_K), stay within 40% of the base build's, for the classic world and the nations world (an exact match is no longer possible: the
//    rules moved on after the base; the x1000 'same game' proof was tools/x1000-check.js at the merge). A pending computer declaration of war carried by the old save (S.decl) is dropped (rules/diplomacy.js, AI_STARTS_WARS):
//    no war after the first day, in either build.
// 3. A save made by this build (S.rk = RES_K) loads unchanged: saveJSON after restore is the same, also after a second save and load (S.bt, the
//    battle panels' history, left out: every load starts it afresh, in the base build too).
// The base build is unpacked once into .test/basemaster (git archive of the page, worlds, rules and tools/mkpage.sh; assets linked, not copied).
const { chromium } = require('playwright'); const pickNation = require('./pick-nation.js'); const path = require('path'), fs = require('fs'), cp = require('child_process');
const ROOT = path.join(__dirname, '..'), // The base is the master commit just before the x1000 merge (6154c49, the parent of 75ceb1c on master; it already has AI_STARTS_WARS false). It used to be
// origin/master, which is wrong now: master has had RES_K since that merge, so its saves carry S.rk and are not old saves.
  BASE_OLD = '6154c49', BASE = process.argv[2] || BASE_OLD, BD = path.join(__dirname, 'basemaster');
const rev = cp.execFileSync('git', ['rev-parse', '--short', BASE + '^{commit}'], {cwd:ROOT}).toString().trim();
if (!fs.existsSync(path.join(BD, '.test', 'page.html')) || (fs.existsSync(path.join(BD, 'REV')) ? fs.readFileSync(path.join(BD, 'REV'), 'utf8').trim() : '') !== rev){
  fs.rmSync(BD, {recursive:true, force:true}); fs.mkdirSync(BD, {recursive:true});
  cp.execSync(`git archive --format=tar ${rev} index.html world.js nations.js lines.js coast.js coast-hi.js units3d.js fx.js rules tools/mkpage.sh tools/vendor | tar -x -C "${BD}"`, {cwd:ROOT});
  fs.symlinkSync(path.join(ROOT, 'assets'), path.join(BD, 'assets')); cp.execSync(`bash "${path.join(BD, 'tools', 'mkpage.sh')}"`, {stdio:'ignore'}); fs.writeFileSync(path.join(BD, 'REV'), rev); }
const OLD = 'file://' + path.join(BD, '.test', 'page.html'), NEW = 'file://' + path.join(__dirname, 'page.html');
const HASH = `s => { let h1 = 0x811c9dc5, h2 = 0x1b873593; for (let i = 0; i < s.length; i++){ const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 + c, 0x85ebca6b) ^ (h2 >>> 13); } return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0'); }`;
// the state in the old units (goods / RES_K; the build without RES_K counts 1), numbers to 10 significant digits, the figures in texts left out
const NORM = `o => { const K = typeof RES_K === 'number' ? RES_K : 1, G0 = ['oil', 'metal', 'iron', 'elec', 'rare'], xs = v => { if (v && typeof v === 'object') for (const k of G0) if (typeof v[k] === 'number') v[k] /= K; };
    delete o.rk; delete o.savedAt; for (const N of o.nations){ xs(N); xs(N.xB); xs(N.surS); if (typeof N.sold === 'number') N.sold /= K; } for (const x of o.book || []){ x.qty /= K; if (typeof x.q0 === 'number') x.q0 /= K; }
    if (o.mkt){ xs(o.mkt.use); xs(o.mkt.dem); } if (o.trade && o.trade.routes) for (const r of o.trade.routes) for (const v of [r.va, r.vb]) if (v && typeof v.q === 'number') v.q /= K;
    for (const D of [o, ...Object.values(o.desks || {})]){ for (const f of (D.offers || [])) if (f && f.deal){ xs(f.deal.give); xs(f.deal.get); } if (D.stats){ xs(D.stats.made); if (typeof D.stats.rareRes === 'number') D.stats.rareRes /= K; } }
    return JSON.stringify(o, (k, v) => typeof v === 'number' ? +v.toPrecision(10) : typeof v === 'string' && k === 'text' ? v.replace(/[\\d][\\d,.]*/g, '#') : v); }`;
const PLAY = `(sv) => { const K = typeof RES_K === 'number' ? RES_K : 1, totals = () => { const t = {cash:0}; for (const k of ['oil', 'metal', 'iron', 'elec', 'rare']) t[k] = 0; for (const N of S.nations) if (N.alive){ t.cash += N.cash; for (const k of ['oil', 'metal', 'iron', 'elec', 'rare']) t[k] += N[k]/K; } return t; };   // (world totals of money and goods, in the old units)
    const ok = restore(JSON.parse(sv)); if (!ok) return {ok}; tick(); for (let i = 0; i < 23; i++) tick(); const wars1 = Object.values(S.rel).filter(r => r.st === 'war').length, decl1 = S.decl.length;
    for (let i = 0; i < 96; i++) tick(); return {ok, hour:S.hour, scn:S.scn, wars1, decl1, wars:Object.values(S.rel).filter(r => r.st === 'war').length, tot:totals(), hash:(${HASH})((${NORM})(JSON.parse(saveJSON())))}; }`;
// the scaled fields of a loaded old save against the save text: {checked, bad: [first differences]}
const CMP = `(sv) => { const o = JSON.parse(sv), K = RES_K, G0 = ['oil', 'metal', 'iron', 'elec', 'rare'], bad = []; let checked = 0;
    const eq = (at, a, b) => { checked++; if (!(a === b || Math.abs(a - b) <= 1e-9*Math.max(1, Math.abs(a), Math.abs(b)))) bad.push(at + ': ' + a + ' vs ' + b); };
    S.nations.forEach((N, i) => { const O = o.nations[i]; for (const k of G0) eq(N.name + '.' + k, N[k], O[k]*K); eq(N.name + '.cash', N.cash, O.cash); eq(N.name + '.mp', N.mp, O.mp); });
    (S.book || []).forEach((b, i) => { eq('book' + i + '.qty', b.qty, o.book[i].qty*K); eq('book' + i + '.price', b.price, o.book[i].price); });
    for (const k of G0) if (S.mkt && S.mkt.p) eq('price.' + k, S.mkt.p[k], o.mkt.p[k]);
    (S.trade && S.trade.routes || []).forEach((r, i) => { const R = o.trade.routes[i]; for (const v of ['va', 'vb']) if (r[v] && typeof r[v].q === 'number') eq('route' + i + '.' + v + '.q', r[v].q, R[v].q*K); });
    return {rk:S.rk, checked, bad:bad.slice(0, 5), book:(S.book || []).length, routes:(S.trade && S.trade.routes || []).length}; }`;
(async () => { const b = await chromium.launch(), errs = [], checks = []; const ck = (name, ok, info) => { checks.push({name, ok:!!ok}); console.log((ok ? 'ok   ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };
  const mk = async url => { const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } }), p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); }); await p.goto(url); await p.waitForTimeout(600); return p; };
  console.log(`base build ${BASE} (${rev}) against this build`);
  const o = await mk(OLD); await pickNation(o, 'Germany'); await o.click('[data-act="begin"]'); await o.click('[data-act="start"]'); await o.waitForTimeout(300);
  ck('the base build has no resource scale (RES_K undefined)', await o.evaluate(() => typeof RES_K === 'undefined'));
  // the base build's saves: the classic world (Germany, day 4) and the nations world (day 3), each with a pending computer declaration of war
  const mkSave = async (scn, seed, hours) => o.evaluate(([scn, seed, hours]) => { useScenario(scn); newGame(seed, 5, [0]); S.started = true; S.diff = 'regular'; for (let i = 0; i < hours; i++) tick();
    const ai = S.nations.filter(N => N.alive && N.id !== 0).map(N => N.id), a = ai[0], c = ai.find(x => x !== a && rel(a, x).st === 'peace'); S.decl.push({by:a, to:c, at:S.hour + 24}); return saveJSON(); }, [scn, seed, hours]);
  const saves = {world:await mkSave('world', 4242, 96), world64:await mkSave('world64', 77, 72)};
  for (const scn of ['world', 'world64']){ const sv = saves[scn], O = JSON.parse(sv), n = await mk(NEW);   // (a page of its own: its own local storage)
    ck(`${scn}: the base save has no scale marker and a pending computer declaration`, O.rk === undefined && O.decl.length === 1, {kb:Math.round(sv.length/1024), hour:O.hour, book:(O.book || []).length, routes:O.trade && O.trade.routes.length});
    // through the real Continue button: the page's own load
    await n.evaluate(s => localStorage.setItem('iron-meridian-save-v5', s), sv); await n.reload(); await n.waitForTimeout(700); await n.click('[data-act="continue"]'); await n.waitForTimeout(300);
    const cont = await n.evaluate(sv => { const O = JSON.parse(sv), N = S.nations[1], N0 = O.nations[1]; return {rk:S.rk, scn:S.scn, hour:S.hour, oilRatio:N.oil/N0.oil, ironRatio:N.iron/N0.iron, cash:[N.cash, N0.cash]}; }, sv);
    ck(`${scn}: Continue loads the base save scaled once (S.rk ${cont.rk}, oil and iron about ${Math.round(cont.oilRatio)} times the save's)`, cont.rk === 1000 && cont.scn === scn && cont.oilRatio > 900 && cont.oilRatio < 1100 && cont.ironRatio > 900 && cont.ironRatio < 1100, cont);
    // the same save restored directly (the function Continue calls), compared field by field at once
    const c1 = await n.evaluate(`(() => { const ok = restore(JSON.parse(${JSON.stringify(sv)})); return {ok, ...(${CMP})(${JSON.stringify(sv)})}; })()`);
    ck(`${scn}: every stock, Market lot and route cargo is exactly RES_K times the save's; money, manpower and prices unchanged`, c1.ok && c1.rk === 1000 && !c1.bad.length && c1.checked > 100, c1);
    // twice in one page (after the first load): scaled from the save text again, not from the state in memory
    const c2 = await n.evaluate(`(() => { const ok = restore(JSON.parse(${JSON.stringify(sv)})); for (let i = 0; i < 5; i++) tick(); const ok2 = restore(JSON.parse(${JSON.stringify(sv)})); return {ok:ok && ok2, ...(${CMP})(${JSON.stringify(sv)})}; })()`);
    ck(`${scn}: loading the base save a second time scales it once again from the save, never twice`, c2.ok && !c2.bad.length, {bad:c2.bad});
    // a save of this build (S.rk set) loads unchanged, and again after a second save and load
    const rt = await n.evaluate(`(() => { restore(JSON.parse(${JSON.stringify(sv)})); for (let i = 0; i < 24; i++) tick(); const s1 = saveJSON(), a = JSON.parse(s1); delete a.savedAt; delete a.bt;
      restore(JSON.parse(s1)); const s2 = saveJSON(), b2 = JSON.parse(s2); delete b2.savedAt; delete b2.bt; restore(JSON.parse(s2)); const b3 = JSON.parse(saveJSON()); delete b3.savedAt; delete b3.bt;
      const N = a.nations[1]; return {rk:a.rk, same1:JSON.stringify(a) === JSON.stringify(b2), same2:JSON.stringify(b2) === JSON.stringify(b3), oil:[N.oil, S.nations[1].oil]}; })()`);
    ck(`${scn}: a save made by this build (S.rk = ${rt.rk}) loads unchanged, twice`, rt.rk === 1000 && rt.same1 && rt.same2, rt);
    // 5 days from the old save: the base build and this build reach the same state in the old units; the pending computer declaration starts no war
    const ro = await o.evaluate(`(${PLAY})(${JSON.stringify(sv)})`), rn = await n.evaluate(`(${PLAY})(${JSON.stringify(sv)})`);
    // (Since the x1000 merge master's rules have moved on (combat, movement, dug-in, research cards ...), so the two builds can no longer reach the same
    // state hash; that equality is tools/x1000-check.js's job against the commit of the merge. What an old save needs from this build: it plays on
    // (the same save twice gives the same hash), and its goods stay in the old units' ballpark after 5 days: the world totals, divided by RES_K,
    // within 40% of the base build's (a missed or doubled x1000 would be a factor of 1,000), money likewise.)
    const rn2 = await n.evaluate(`(${PLAY})(${JSON.stringify(sv)})`), rel = k => Math.abs(rn.tot[k] - ro.tot[k])/Math.max(1, Math.abs(ro.tot[k])), worst = Object.keys(ro.tot).map(k => [k, +rel(k).toFixed(3)]).sort((x, y) => y[1] - x[1])[0];
    ck(`${scn}: 5 days from the base save: plays on, the same save twice gives the same state (${rn.hash}), world totals in the old units within 40% of the base build's (worst ${worst[0]} ${worst[1]})`, rn.ok && rn2.hash === rn.hash && rn.hour === ro.hour && worst[1] < 0.4, {old:ro.tot, now:rn.tot, hashes:[rn.hash, rn2.hash]});
    ck(`${scn}: the old save's pending computer declaration is dropped: no war after the first day`, rn.decl1 === 0 && rn.wars1 === 0 && rn.wars === 0 && ro.wars1 === 0, {old:[ro.decl1, ro.wars1], now:[rn.decl1, rn.wars1, rn.wars]}); }
  console.log('ERRORS', errs.length ? errs.slice(0, 5) : 'none'); const bad = checks.filter(c => !c.ok).length;
  console.log(bad || errs.length ? `X1000 OLDSAVE FAILED: ${bad} of ${checks.length} checks` : `X1000 OLDSAVE OK: ${checks.length} checks`);
  await b.close(); process.exit(bad || errs.length ? 1 : 0); })();
