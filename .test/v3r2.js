// V3 systems repair 2: rivers drawn again (tile data + pixels), AI heavy-bomber doctrine and its counters, buying missing oil/metal for a save,
// surplus sales, manned-aircraft cap, capital garrison, peace for land against a power fighting on three fronts.
// node .test/v3r2.js  -> exits 0 with an empty errors array; screenshot .test/v3r2-Kyiv-3.2.png
const pickNation = require('./pick-nation.js');   // (a start-screen card by its nation's name, on either world)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 860 } }); const errs = [], cons = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') cons.push(m.text()); });
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
  await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.waitForTimeout(1500);
  const checks = [], ck = (name, ok, info) => checks.push({name, ok:!!ok, info});
  // 1. river tiles: every river class has tiles with real bounds (the broken build had none: map(tiledPath) passed the index as the tile size)
  const rv = await p.evaluate(() => window.__im.r2.rivers());
  ck('river layers hold tiles with bounds (3 classes)', rv.length === 3 && rv.every(r => r.tiles > 0 && r.bounded === r.tiles) && rv.reduce((s, r) => s + r.tiles, 0) > 60, rv);
  // 2. river pixels over Kyiv (Dnieper): the map with rivers differs from the same view with the river tiles emptied
  // (each shot: 3 s, then until the map has converged (no bands, tiles or city bakes left: __im.mapBusy false for 0.6 s; at most 12 s more), so a
  // loaded machine that lays the detail and the towns more slowly compares finished pictures)
  const settle = () => p.evaluate(() => new Promise(res => { const t0 = performance.now(); let ok = 0; const iv = setInterval(() => { ok = window.__im.mapBusy ? (window.__im.mapBusy() ? 0 : ok + 1) : 99; if (ok >= 6 || performance.now() - t0 > 12000){ clearInterval(iv); res(); } }, 100); }));
  const shot = async () => { await p.waitForTimeout(3000); await settle(); return p.screenshot({ clip:{x:200, y:150, width:900, height:560} }); };
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im; im.S.hour = 12; im.S.sunOff = 0; im.S.storms = []; im.S.speed = 0; const P = im.G.P.find(q => q.cityName === 'Kyiv'); const s = 3.2; im.view.s = s; im.view.x = 650 - P.x*s; im.view.y = 430 - P.y*s; });
  const withR = await shot(); require('fs').writeFileSync(__dirname + '/v3r2-Kyiv-3.2.png', withR);
  await p.evaluate(() => { window.__R0 = window.__im.r2.riverSwap([0, 1, 2].map(() => ({tiles:[], k:null, p:null}))); });
  const noR = await shot(); await p.evaluate(() => { window.__im.r2.riverSwap(window.__R0); });
  const back = await shot();
  const diff = await p.evaluate(async ([a, c, d]) => { const load = u => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = 'data:image/png;base64,' + u; });
    const [A, B, C] = await Promise.all([load(a), load(c), load(d)]); const cv = document.createElement('canvas'); cv.width = A.width; cv.height = A.height; const g = cv.getContext('2d');
    const px = I => { g.clearRect(0, 0, cv.width, cv.height); g.drawImage(I, 0, 0); return g.getImageData(0, 0, cv.width, cv.height).data; };
    const pa = px(A), pb = px(B), pc = px(C); let blue = 0, blue0 = 0, same = 0, chg = 0; const isRiver = (q, i) => q[i + 2] > q[i] + 45 && q[i + 1] > q[i] + 25 && q[i + 2] > 120;
    for (let i = 0; i < pa.length; i += 4){ if (isRiver(pa, i) && !isRiver(pb, i)) blue++; if (isRiver(pb, i) && !isRiver(pa, i)) blue0++; if (Math.abs(pa[i] - pb[i]) + Math.abs(pa[i + 1] - pb[i + 1]) + Math.abs(pa[i + 2] - pb[i + 2]) > 36) chg++; if (Math.abs(pa[i] - pc[i]) + Math.abs(pa[i + 1] - pc[i + 1]) + Math.abs(pa[i + 2] - pc[i + 2]) < 12) same++; }
    return {riverPx:blue, riverChanged:chg, extraWithout:blue0, restoredSame:+(same/(pa.length/4)).toFixed(3)}; }, [withR.toString('base64'), noR.toString('base64'), back.toString('base64')]);
  // (Kyiv is outside Germany's sight, so the fog veil greys the map: the river is drawn but no longer 'blue' pixel by pixel. The check is the pixels the river tiles change, which the veil does not hide)
  ck('rivers are drawn: pixels over Kyiv change when the river tiles are emptied (blue ones too when the map is not fogged)', diff.riverChanged > 800 || diff.riverPx > 1500, diff);
  ck('restoring the river tiles restores the picture', diff.restoredSame > 0.97, diff);

  const R = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, F = im.fix, A = im.air, out = {}, checks = []; const ck = (name, ok, info) => checks.push({name, ok:!!ok, info});
    const ME = 0, war = (a, b) => { if (!F.atWar(a, b)){ F.rel(a, b).st = 'war'; F.rel(a, b).since = S.hour; } }, peace = (a, b) => { const r = F.rel(a, b); r.st = 'peace'; r.since = S.hour; };
    const qOf = (n, t) => S.queue.reduce((s0, q, pp) => s0 + (S.owner[pp] === n ? q.filter(j => j.t === t).length : 0), 0), clearQ = n => { for (let pp = 0; pp < S.queue.length; pp++) if (S.owner[pp] === n) S.queue[pp].length = 0; };
    const cities = n => G.P.filter(P => P.city && S.owner[P.id] === n);
    // a mid-size AI with a few cities and a land enemy
    const n = S.nations.find(N => N.alive && N.id !== ME && cities(N.id).length >= 3 && G.P.some(P => S.owner[P.id] === N.id && P.nbs.some(v => S.owner[v] >= 0 && S.owner[v] !== N.id && S.owner[v] !== ME))).id;
    const foe = (() => { for (const P of G.P) if (S.owner[P.id] === n) for (const v of P.nbs){ const o = S.owner[v]; if (o >= 0 && o !== n && o !== ME) return o; } return -1; })();
    const N = S.nations[n], keep = {cash:N.cash, metal:N.metal, oil:N.oil, mp:N.mp, tech:{...N.tech}};
    const C2 = cities(n).find(P => P.id !== N.capital) || cities(n)[0];
    const setup = () => { for (const k of ['u_jet', 'u_int', 'jet_pgm', 'int_msl', 'u_bomb']) N.tech[k] = 1; S.bld[C2.id].air = 2; S.bld[C2.id].fac = Math.max(1, S.bld[C2.id].fac); S.bld[C2.id].rec = 1; N.cash = 3000; N.metal = 600*RES_K; N.oil = 400*RES_K; N.mp = 600; N.uSave = null; N.research = N.research || {id:'eco1', h:999, h0:999}; clearQ(n); };
    // 3. bomber doctrine: at war, Strategic Bombers and an Airbase II -> the AI wants bombers and queues one
    setup(); war(n, foe); out.want = im.r2.bomberWant(n);
    let turns = 0; for (; turns < 72 && !qOf(n, 'bomb'); turns++) im.tick();   // three days of play (its turns come every 4 h)
    out.bomber = {nation:N.name, foe:S.nations[foe].name, city:C2.name, want:out.want, turns, queued:qOf(n, 'bomb'), save:N.uSave && N.uSave.t, q:S.queue[C2.id].map(j => j.t), cash:Math.round(N.cash), metal:Math.round(N.metal/RES_K), oil:Math.round(N.oil/RES_K), mp:Math.round(N.mp), air:S.bld[C2.id].air, owner:S.owner[C2.id] === n};
    ck('an AI at war with Strategic Bombers and an Airbase II wants 2-4 bombers', out.want >= 2 && out.want <= 4, out.bomber);
    ck('... and queues one at its Airbase II within three days', qOf(n, 'bomb') >= 1 && S.queue[C2.id].some(j => j.t === 'bomb'), out.bomber);
    // control: at peace (or without the research) it does not want any
    clearQ(n); peace(n, foe); for (const o of S.nations) if (o.id !== n && F.atWar(n, o.id)) peace(n, o.id); out.wantPeace = im.r2.bomberWant(n); war(n, foe); N.tech.u_bomb = 0; delete N.tech.u_bomb; out.wantNoTech = im.r2.bomberWant(n); N.tech.u_bomb = 1;
    ck('no bomber wanted at peace or without Strategic Bombers', out.wantPeace === 0 && out.wantNoTech === 0, {peace:out.wantPeace, noTech:out.wantNoTech});
    // 4. saving for a bomber with no oil: the AI buys the missing oil on the world market and then builds it
    setup(); war(n, foe); N.oil = 0; N.uSave = {t:'bomb', until:S.hour + 48}; const cash0 = N.cash; F.aiTurn(n);
    out.oilBuy = {oil:Math.round(N.oil/RES_K), queued:qOf(n, 'bomb'), spent:Math.round(cash0 - N.cash)};
    ck('saving for a bomber without oil buys the oil (and builds it)', (N.oil >= 20 || qOf(n, 'bomb') >= 1) && cash0 > N.cash, out.oilBuy);
    // 5. the AI flies its bombers against enemy cities (and the enemy counters: fighters, SAMs and ASF picks rise once bombed)
    { const W = im.addArmy(n, C2.id, {bomb:3}); W.air = {base:C2.id, cd:0}; const tgt = G.P.filter(P => P.city && S.owner[P.id] === foe).sort((p1, p2) => Math.hypot(p1.x - C2.x, p1.y - C2.y) - Math.hypot(p2.x - C2.x, p2.y - C2.y))[0]; for (const k of ['fac', 'air']) S.bld[tgt.id][k] = Math.max(2, S.bld[tgt.id][k]);
      for (const b of S.armies) if (b.owner === foe && b.fly && b.fly.ph === 'patrol') delete b.fly;
      S.storms = []; if (S.bdis && S.bdis[C2.id]) delete S.bdis[C2.id];   // weather and a knocked-out airbase ground any raid (airCheck): keep this check about the AI's choice   // a controlled raid: the nearest enemy city, no enemy fighter patrol up yet (the foe's own AI may have launched one during the earlier ticks)
      let flew = false; for (let i = 0; i < 8 && !flew; i++){ F.aiAir(n); flew = !!W.fly; if (!flew){ W.air.cd = 0; } }
      out.bombFly = {flew, to:W.fly ? (G.P[W.fly.tgt] || {}).name : null, tgt:tgt.name, ready:im.r2.bombDbg ? im.r2.bombDbg(W, tgt.id) : null}; ck('the AI sends its bombers on a raid', flew, out.bombFly); W.u.bomb = 0; delete W.fly; im.v3c.removeEmpty(); }
    { const pick = (m, k) => { const c = {}; const cp = cities(m).find(P => S.bld[P.id].air >= 2) || cities(m)[0]; for (const kk of ['u_jet', 'u_int', 'jet_pgm', 'int_msl', 'u_asf']) S.nations[m].tech[kk] = 1; S.bld[cp.id].air = 2; S.bld[cp.id].fac = Math.max(2, S.bld[cp.id].fac);
        for (let i = 0; i < k; i++){ const t = A.aiPickUnit(m, cp.id); c[t] = (c[t] || 0) + 1; } return c; };
      const H = (S.airHit || (S.airHit = {})); const h0 = H[foe]; H[foe] = {drone:0, bomb:0, air:0}; const base = pick(foe, 600); H[foe] = {drone:0, bomb:3, air:0}; const hit = pick(foe, 600); H[foe] = h0 || {drone:0, bomb:0, air:0};
      const share = c => ['int', 'asf', 'sam'].reduce((s0, t) => s0 + (c[t] || 0), 0)/600; out.counter = {base:+share(base).toFixed(3), bombed:+share(hit).toFixed(3)};
      ck('a power being bombed picks clearly more fighters, ASF and SAMs', out.counter.bombed > out.counter.base*1.4 && out.counter.bombed > 0.15, out.counter); }
    // 6. surplus sale: a cash-poor AI sitting on metal sells some of it
    setup(); N.cash = 80; N.metal = 2000*RES_K; N.uSave = null; const m0 = N.metal, c0 = N.cash; F.aiTurn(n); out.sale = {metalSold:Math.round((m0 - N.metal)/RES_K), cashGot:Math.round(N.cash - c0)};
    ck('a cash-poor AI sells surplus metal on the world market', m0 - N.metal >= 20*RES_K, out.sale);
    // 7. manned aircraft cap: a force already 30% fighters stops picking more of them (repair 3: the specialists keep a small quota of their own,
    //    a few ASF and one AWACS, so the wing here already holds that quota; v3mkt.js checks the quota itself)
    { const cp = C2.id; setup(); const g = im.addArmy(n, N.capital, {inf:20}); const f = im.addArmy(n, cp, {int:12, asf:4, awacs:1}); f.air = {base:cp, cd:0}; S.bld[cp].air = 2; N.tech.u_asf = 1;
      const cnt = () => { const c = {}; for (let i = 0; i < 600; i++){ const t = A.aiPickUnit(n, cp); c[t] = (c[t] || 0) + 1; } return ['int', 'asf', 'jet', 'awacs'].reduce((s0, t) => s0 + (c[t] || 0), 0)/600; };
      im.tick(); const capped = cnt(); f.u.int = 0; f.u.asf = 0; f.u.awacs = 0; im.v3c.removeEmpty(); im.tick(); const free = cnt(); g.u.inf = 0; im.v3c.removeEmpty();
      out.mannedCap = {capped:+capped.toFixed(3), free:+free.toFixed(3)}; ck('manned-aircraft picks drop once fighters are a large share of the force', capped < free*0.5, out.mannedCap); }
    // 8. capital garrison: at war a small mixed stack at the capital does not march out and leave it empty
    { setup(); war(n, foe); const cap = N.capital; for (const a of S.armies) if (a.owner === n && a.at === cap && !a.air) for (const t in a.u) a.u[t] = 0; im.v3c.removeEmpty();
      const a = im.addArmy(n, cap, {inf:4, tank:2}); a.m = 90; for (let i = 0; i < 6; i++){ F.aiTurn(n); S.hour += 4; }
      const held = S.armies.filter(b => b.owner === n && b.at === cap && !b.path.length && !b.air).reduce((s0, b) => s0 + (b.u.inf || 0), 0); out.garrison = {inf:held};
      ck('at war the capital keeps its infantry garrison', held >= 4, out.garrison); }
    // 9. peace for land: against a power at war on three fronts, a victor holding 5+ of its home provinces accepts peace (and keeps them)
    { const big = im.addArmy(foe, S.nations[foe].capital, {inf:400}); im.tick();   // the victor clearly stronger: the 'outmatched' rule does not apply
      const others = S.nations.filter(o => o.alive && o.id !== n && o.id !== foe && o.id !== ME).slice(0, 2).map(o => o.id); for (const o of others) war(n, o); war(n, foe);
      F.rel(n, foe).since = S.hour - 24*8; const home = G.P.filter(P => !P.sea && S.home[P.id] === n && S.owner[P.id] === n && !P.capital && !P.city).slice(0, 6), own0 = home.map(P => S.owner[P.id]);
      const before = im.r2.acceptOffer(foe, n, 'peace'); for (const P of home) S.owner[P.id] = foe; const after = im.r2.acceptOffer(foe, n, 'peace');
      for (const o of others) peace(n, o); const two = im.r2.acceptOffer(foe, n, 'peace'); home.forEach((P, i) => S.owner[P.id] = own0[i]);
      out.peace = {before:before.why, after:after.why, twoFronts:two.why};
      ck('a victor holding 5+ home provinces of a power on three fronts accepts peace', after.ok && /keep the land/.test(after.why), out.peace);
      ck('... but not when that power fights on fewer fronts', !(two.ok && /keep the land/.test(two.why)), out.peace); peace(n, foe); big.u.inf = 0; im.v3c.removeEmpty(); }
    clearQ(n); Object.assign(N, {cash:keep.cash, metal:keep.metal, oil:keep.oil, mp:keep.mp, uSave:null}); N.tech = keep.tech;
    out.checks = checks; return out; });
  for (const c of checks.concat(R.checks)) console.log((c.ok ? 'PASS ' : 'FAIL ') + c.name + (c.ok ? '' : ' :: ' + JSON.stringify(c.info)));
  const failed = checks.concat(R.checks).filter(c => !c.ok).map(c => 'FAIL ' + c.name); delete R.checks; console.log(JSON.stringify({rivers:rv, diff, ...R}, null, 1));
  const all = failed.concat(errs, cons.filter(c => !/willReadFrequently/.test(c)));
  console.log(JSON.stringify(all)); await b.close(); process.exit(all.length ? 1 : 0);
})();
