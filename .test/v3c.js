// V3 step 4 controls: flexible splitting, drag-to-merge, naval speeds and sea lanes, auto-deselect, strike wear and maintenance.
// usage: node .test/v3c.js   (exits 1 on page errors or failed checks; screenshots .test/v3-controls-*.png)
const pickNation = require('./pick-nation.js');   // (a start-screen card by its nation's name, on either world)
const { chromium } = require('playwright');
const out = n => __dirname + '/v3-controls-' + n + '.png';
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 880 } }); const errs = [], cons = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) cons.push(m.text()); });
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
  await pickNation(p, 'France'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForTimeout(800);
  // ---------------- A. rules (pure state) ----------------
  const R = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, C = im.v3c, checks = [], info = {};
    const ck = (name, ok, x) => checks.push({name, ok:!!ok, info:x});
    const cnt = a => Object.values(a.u).reduce((x, y) => x + y, 0);
    const N = S.nations[0], cap = N.capital;
    const eff = a => { let s0 = 0; for (const t in a.u) if (a.u[t]) s0 += a.u[t]*({inf:10, tank:14, art:9, at:9, ifv:12}[t] || 10) - a.w[t]; return s0; };
    // ---- sea lanes and naval speeds
    const L = C.laneSet(); info.lanes = L.size; ck('sea lanes defined (>= 60 sea-zone links)', L.size >= 60, L.size);
    const sea = G.P.find(P => P.sea && P.nbs.some(v => G.P[v].sea && !C.isLane(P.id, v)) ), seaNb = sea.nbs.find(v => G.P[v].sea && !C.isLane(sea.id, v));
    const kmd = a => Math.round(C.seaSpeed(a)*180);
    const mk = u => { const a = im.addArmy(0, sea.id, u); return a; };
    const F = {troops:mk({inf:3}), escorted:mk({inf:3, frig:1}), carr:mk({carr:1}), sub:mk({sub:1}), crui:mk({crui:1}), frig:mk({frig:1})};
    const sp = {}; for (const k in F) sp[k] = kmd(F[k]); info.seaKmd = sp;
    const landInf = Math.round(C.unitKmd(0, 'inf')[0]); info.landInf = landInf;
    ck('water speed order: transports < carrier < sub < cruiser <= frigate', sp.troops < sp.carr && sp.escorted < sp.carr && sp.carr < sp.sub && sp.sub < sp.crui && sp.crui <= sp.frig, sp);
    ck('frigates 1.2-1.5x infantry land speed', sp.frig/landInf >= 1.2 && sp.frig/landInf <= 1.5, +(sp.frig/landInf).toFixed(2));
    ck('carriers above infantry land speed, transports below', sp.carr > landInf && sp.troops < landInf, [sp.carr, sp.troops, landInf]);
    let lu = -1, lv = -1; for (const k of L){ const [x, y] = k.split(',').map(Number); lu = x; lv = y; break; }
    const ratio = C.legSpeed(F.frig, lu, lv)/C.legSpeed(F.frig, sea.id, seaNb); info.laneRatio = +ratio.toFixed(3);
    ck('sea lane boost 10-15%', ratio >= 1.1 && ratio <= 1.15, ratio);
    // a lane through Gibraltar: the zone nearest 5.6W 35.9N must have a lane link
    const lon = P => ((((P.cc % 600) + 0.5)/600*360 + (typeof WORLD !== "undefined" ? WORLD : window.WORLD).lon0) + 540) % 360 - 180;
    const gib = G.P.filter(P => P.sea).map(P => [P.id, Math.hypot((lon(P) + 5.6)*Math.cos(0.63), P.lat - 35.9)]).sort((x, y) => x[1] - y[1])[0][0];
    ck('Gibraltar zone is on a sea lane', G.P[gib].nbs.some(v => C.isLane(gib, v)), G.P[gib].name);
    S.armies = S.armies.filter(a => !Object.values(F).includes(a));
    // ---- splitting: rows, damaged units apart, HP and commander kept consistent
    const A0 = im.addArmy(0, cap, {inf:7, tank:3, art:2}); A0.w.tank = 14*0.7; A0.w.inf = 2; A0.m = 64; A0.peak = 200;
    const rows = C.splitRows(A0); info.rows = rows.map(r => `${r.k}×${r.n}@${Math.round(r.hf*100)}`);
    ck('damaged tank listed as its own row', rows.some(r => r.k === 'tank:d' && r.n === 1 && r.dmg) && rows.some(r => r.k === 'tank:h' && r.n === 2), info.rows);
    ck('lightly wounded infantry stays one row', rows.filter(r => r.t === 'inf').length === 1, info.rows);
    const c = C.cmdNew(0); A0.cmd = c.id; c.army = A0.id;
    const hp0 = eff(A0), n0 = cnt(A0);
    const outE = C.splitPlan(A0, C.evenPlan(A0, 3)); const all = [A0, ...outE];
    info.even = all.map(cnt); ck('evenly into 3: three forces of 4 units', all.length === 3 && all.every(a => cnt(a) === 4), info.even);
    ck('split keeps total units and HP', all.reduce((s0, a) => s0 + cnt(a), 0) === n0 && Math.abs(all.reduce((s0, a) => s0 + eff(a), 0) - hp0) < 1e-6, [hp0, all.map(eff)]);
    ck('split keeps morale', all.every(a => a.m === 64), all.map(a => a.m));
    ck('peak strength split by HP', Math.abs(all.reduce((s0, a) => s0 + a.peak, 0) - 200) < 1e-6, all.map(a => a.peak));
    const holder = all.find(a => a.cmd === c.id), bigHP = Math.max(...all.map(eff)); ck('commander with the largest group', holder && eff(holder) === bigHP && c.army === holder.id, all.map(a => [eff(a), a.cmd]));
    for (const x of outE) C.merge(A0, x); C.removeEmpty(); ck('merge back restores the force', cnt(A0) === n0 && Math.abs(eff(A0) - hp0) < 1e-6, cnt(A0));
    // damaged tank leaves alone: its wounds go with it
    const before = A0.w.tank; const [dmgT] = C.splitPlan(A0, [{'tank:d':1}]); ck('damaged unit carries its own wounds', dmgT && dmgT.u.tank === 1 && Math.abs(dmgT.w.tank - before) < 1e-6 && A0.w.tank < 1e-6, [dmgT && dmgT.w.tank, A0.w.tank]);
    C.merge(A0, dmgT); C.removeEmpty();
    const byType = C.splitPlan(A0, C.typePlan(A0)); info.byType = [A0, ...byType].map(a => Object.keys(a.u).filter(t => a.u[t]).join('+'));
    ck('split by unit type: one force per type', byType.length === 2 && [A0, ...byType].every(a => Object.keys(a.u).filter(t => a.u[t]).length === 1), info.byType);
    for (const x of byType) C.merge(A0, x); C.removeEmpty();
    const one = C.splitPlan(A0, C.onePlan(A0)); ck('split off one unit', one.length === 1 && cnt(one[0]) === 1 && cnt(A0) === n0 - 1, cnt(one[0]));
    C.merge(A0, one[0]); C.removeEmpty();
    const multi = C.splitPlan(A0, [{'inf:h':2}, {'tank:h':1, 'tank:d':1}, {'art:h':2}]); ck('several groups in one go', multi.length === 3 && cnt(A0) === 6, [cnt(A0), ...multi.map(cnt)]);
    for (const x of multi) C.merge(A0, x); C.removeEmpty();
    const allOut = C.splitPlan(A0, [{'inf:h':7, 'art:h':2}, {'tank:h':2, 'tank:d':1}]); ck('moving everything keeps the largest group in place', allOut.length === 1 && cnt(A0) + cnt(allOut[0]) === n0, [cnt(A0), allOut.map(cnt)]);
    for (const x of allOut) C.merge(A0, x); C.removeEmpty();
    const h1 = C.splitArmy(A0); ck('classic halving still works', h1 && cnt(h1) === 5 && cnt(A0) === 7, [cnt(A0), h1 && cnt(h1)]);
    C.merge(A0, h1); C.removeEmpty();
    // join: a force sent to another province merges on arrival
    const nbp = G.P[cap].nbs.find(v => !G.P[v].sea && S.owner[v] === 0); const J = im.addArmy(0, nbp, {inf:2});
    C.joinForces(J, A0); let hrs = 0; while (S.armies.includes(J) && cnt(J) && hrs < 96){ im.tick(); hrs++; }
    ck('join order merges on arrival', !S.armies.includes(J) && cnt(A0) === n0 + 2, {hrs, a0:cnt(A0)});
    // ---- selection after an order (single and group). Unit controls changed (Conflict of Nations): an order no longer deselects. With a force
    // selected an order (Move, then a tap; here setTarget + sendToTarget) keeps the force selected with its route drawn; a plain tap on empty land gives no order (.test/controls.js); it is released by a tap on the force
    // again, a second tap on its destination, or Esc (checked here by clearSel, which Esc calls, and in the page below by real taps and Esc).
    const T1 = G.P[cap].nbs.find(v => !G.P[v].sea && S.owner[v] === 0);
    im.selectArmy(A0.id); im.setTarget(A0.id, T1); C.sendToTarget(A0); ck('single order keeps the force selected, route given', im.sel.army === A0.id && A0.path.length + (A0.to !== null ? 1 : 0) > 0 && im.sel.lastOrder && im.sel.lastOrder.ids.includes(A0.id), {sel:im.sel.army, path:A0.path.length});
    C.clearSel(); ck('clearSel (Esc) releases it', im.sel.army === null, im.sel.army);
    A0.path = []; const B1 = im.addArmy(0, cap, {inf:1}), B2 = im.addArmy(0, cap, {inf:1});
    im.selectArmy(B1.id); im.sel.group = [B1.id, B2.id]; im.setTarget(B1.id, T1); C.sendToTarget(B1); ck('group order keeps the group selected, both move', im.sel.army === B1.id && im.sel.group.length === 2 && B1.path.length && B2.path.length && im.sel.lastOrder.ids.length === 2, im.sel);
    C.clearSel(); ck('clearSel releases the whole group', im.sel.army === null && im.sel.group.length === 0, im.sel);
    B1.path = []; B2.path = []; im.selectArmy(B1.id); im.setTarget(B1.id, T1); C.sendToTarget(B1, true); ck('shift order keeps the selection', im.sel.army === B1.id && B1.path.length, im.sel.army);
    B1.path = []; S.armies = S.armies.filter(a => a !== B1 && a !== B2); C.clearSel();
    // ---- strike wear and maintenance
    const E = S.nations.findIndex(n => n.name === 'Germany'); S.rel['0,' + E] = {st:'war', since:S.hour, until:null}; for (const id of ['air1', 'air2']) N.tech[id] = 1; N.tv = (N.tv || 0) + 9;
    S.bld[cap].air = 1; const W = im.addArmy(0, cap, {jet:3}); W.air = {base:cap, cd:0};
    const foeP = G.P.filter(P => !P.sea && S.owner[P.id] === E).sort((x, y) => Math.hypot(x.x - G.P[cap].x, x.y - G.P[cap].y) - Math.hypot(y.x - G.P[cap].x, y.y - G.P[cap].y))[0].id;
    for (const a of S.armies) if (a.at === foeP && a.owner !== 0) for (const t in a.u) a.u[t] = 0; C.removeEmpty();
    const wear = []; for (let i = 0; i < 3; i++){ const w0 = W.air.wear || 0; W.air.cd = 0; const ok = im.orderAir(W, foeP); let h = 0; while (W.fly && h < 60){ C.airTickOnly ? 0 : im.air.airTick(); h++; } wear.push(+((W.air.wear || 0) - w0).toFixed(4)); if (!ok) break; }
    info.wearPerStrike = wear; ck('each unopposed strike wears 3-6%', wear.length === 3 && wear.every(x => x >= 0.03 && x <= 0.06), wear);
    { W.air.wear = 0.3; W.air.cd = 6; for (let h = 0; h < 6; h++) im.air.airTick(); const r0 = 0.3 - (W.air.wear || 0); info.repairWhileRearming = +r0.toFixed(4); ck('no repairs during the 6 h rearm after a sortie', r0 < 1e-6, r0); }
    W.air.wear = 0.5; W.air.cd = 0; const w1 = W.air.wear; for (let h = 0; h < 24; h++){ im.air.airTick(); } const rep1 = w1 - (W.air.wear || 0); info.repairL1 = +rep1.toFixed(3);
    ck('airbase I repairs about 16%/day', rep1 > 0.12 && rep1 < 0.2, rep1);
    W.air.wear = 0.5; W.air.cd = 0; S.bld[cap].air = 5; for (let h = 0; h < 24; h++) im.air.airTick(); const rep5 = 0.5 - (W.air.wear || 0); info.repairL5 = +rep5.toFixed(3); ck('airbase V repairs faster (~40%/day)', rep5 > rep1*1.8, rep5);
    // no airbase: no repairs, no healing
    const city2 = G.P.find(P => P.city && S.owner[P.id] === 0 && !S.bld[P.id].air && P.id !== cap).id; const W2 = im.addArmy(0, city2, {jet:2}); W2.air = {base:city2, cd:0, wear:0.6}; W2.w.jet = 4;
    for (let h = 0; h < 24; h++){ im.air.airTick(); } C.armyUpkeep(); ck('no repairs or healing away from an airbase', W2.air.wear === 0.6 && W2.w.jet === 4 && C.maintRate(W2) === 0, [W2.air.wear, W2.w.jet]);
    ck('worn wing still flies but grounded below 20%', (() => { W2.air.wear = 0.85; const r1 = C.airCheck(W2, foeP); W2.air.wear = 0.6; return !r1.ok && /maintenance/.test(r1.why); })(), null);
    // AI: a worn wing of an AI nation at a city without an airbase flies back to an airbase that repairs it
    const aiN = E, aiCity = G.P.filter(P => P.city && S.owner[P.id] === aiN && !S.bld[P.id].air), aiBase = G.P.find(P => P.city && S.owner[P.id] === aiN && S.bld[P.id].air);
    let aiOk = null; if (aiCity.length && aiBase){ const c0 = aiCity.sort((x, y) => Math.hypot(x.x - aiBase.x, x.y - aiBase.y) - Math.hypot(y.x - aiBase.x, y.y - aiBase.y))[0]; const AW = im.addArmy(aiN, c0.id, {jet:2}); AW.air = {base:c0.id, cd:0, wear:0.6};
      for (const id of ['air1']) S.nations[aiN].tech[id] = 1; im.air.aiAir(aiN); aiOk = !!(AW.fly && AW.fly.kind === 'rebase'); info.aiWorn = AW.fly ? AW.fly.kind + '→' + G.P[AW.fly.tgt].name : 'stayed';
      const AW2 = im.addArmy(aiN, aiBase.id, {jet:2}); AW2.air = {base:aiBase.id, cd:0, wear:0.6}; im.air.aiAir(aiN); ck('AI keeps a worn wing on the ground at a working airbase', !AW2.fly, AW2.fly);
      S.armies = S.armies.filter(a => a !== AW && a !== AW2); }
    ck('AI returns a worn wing to an airbase', aiOk !== false, info.aiWorn);
    S.armies = S.armies.filter(a => a !== W2);
    return {checks, info, A0:A0.id, W:W.id, cap}; });
  // ---------------- B. UI: split panel, drag to merge, info speeds, worn wing ----------------
  const ui = [];
  const uck = (name, ok, x) => ui.push({name, ok:!!ok, info:x});
  await p.evaluate(r => { const im = window.__im, S = im.S, G = im.G, P = G.P[r.cap]; S.speed = 0; im.v3c.centerOn(P.x, P.y, 7); const a = S.armies.find(x => x.id === r.A0); a.path = []; a.to = null; a.at = r.cap; a.w.tank = 14*0.7; im.selectArmy(r.A0); }, R);
  await p.waitForTimeout(400); await p.screenshot({ path: out('info-speeds') });
  const speedTxt = await p.evaluate(() => [...document.querySelectorAll('#ctx dt')].find(d => d.textContent === 'Speed')?.nextElementSibling?.textContent || '');
  uck('info panel shows land and water speeds', /land [\d,]+ km\/day · water [\d,]+ km\/day/.test(speedTxt), speedTxt);
  await p.click('[data-act="split-open"]'); await p.waitForTimeout(300); await p.screenshot({ path: out('split-1-open') });
  uck('split panel lists damaged tanks apart', await p.evaluate(() => document.querySelectorAll('#ctx .sprow.dmg').length === 1 && document.querySelectorAll('#ctx .sprow').length >= 4), null);
  // slider and +/- on the infantry row
  const rng = await p.$('#ctx .sp-rng[data-k="inf:h"]'); const bb = await rng.boundingBox(); await p.mouse.click(bb.x + bb.width*0.75, bb.y + bb.height/2); await p.waitForTimeout(150);
  await p.click('#ctx [data-act="sp-inc"][data-k="art:h"]'); await p.waitForTimeout(150);
  const g1 = await p.evaluate(() => JSON.stringify(window.__im.v3c.SPLIT.plan)); uck('slider and + set the group', /inf:h":[3-7]/.test(g1) && /art:h":1/.test(g1), g1);
  await p.click('#ctx [data-act="sp-add"]'); await p.waitForTimeout(150); await p.click('#ctx [data-act="sp-inc"][data-k="tank:d"]'); await p.click('#ctx [data-act="sp-inc"][data-k="tank:h"]'); await p.waitForTimeout(200);
  await p.screenshot({ path: out('split-2-groups') });
  await p.selectOption('#sp-n', '3'); await p.waitForTimeout(250); await p.click('#ctx [data-act="sp-tab"][data-g="1"]'); await p.waitForTimeout(200); await p.screenshot({ path: out('split-3-even3') });
  const ev = await p.evaluate(() => window.__im.v3c.SPLIT.plan.length); uck('evenly into 3 gives two new groups', ev === 2, ev);
  await p.click('#ctx [data-act="sp-type"]'); await p.waitForTimeout(200); await p.screenshot({ path: out('split-4-bytype') });
  await p.click('#ctx [data-act="sp-half"]'); await p.waitForTimeout(150);
  const before = await p.evaluate(r => window.__im.S.armies.filter(a => a.owner === 0 && a.at === r.cap && !a.air).length, R);
  await p.click('#ctx [data-act="sp-go"]'); await p.waitForTimeout(400);
  const after = await p.evaluate(r => window.__im.S.armies.filter(a => a.owner === 0 && a.at === r.cap && !a.air).length, R);
  uck('Split button creates the new force', after === before + 1, [before, after]);
  await p.screenshot({ path: out('split-5-done') });
  // drag the new counter onto the old one: merges
  await p.evaluate(r => { const im = window.__im, P = im.G.P[r.cap]; im.view.s = 10; im.view.x = 500 - P.x*10; im.view.y = 430 - P.y*10; }, R);
  // (counters that would overlap now fade into the one that covers them (plateFade), and a split force stands about 9 world units from its stack: at the old zoom 7-10 the two counters touch and only one is tapped, so zoom in until they are apart)
  const hitsNow = await p.evaluate(r => { const im = window.__im; im.v3c.clearSel(); im.v3c.centerOn(im.G.P[r.cap].x, im.G.P[r.cap].y, 18); return new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => res(im.v3c.hits().filter(h => h.ids.some(id => { const a = im.S.armies.find(x => x.id === id); return a && a.owner === 0 && a.at === r.cap && !a.air; })))))); }, R);
  uck('split forces get counters of their own', hitsNow.length >= 2, hitsNow.length);
  if (hitsNow.length >= 2){ const [h0, h1] = hitsNow; const n0 = await p.evaluate(() => window.__im.S.armies.filter(a => a.owner === 0 && !a.air).length);
    const mr = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return {x:r.left, y:r.top}; });   // hits are canvas coordinates
    for (const h of [h0, h1]){ h.x += mr.x; h.y += mr.y; }
    await p.mouse.move(h1.x + h1.w/2, h1.y + h1.h/2); await p.mouse.down(); await p.mouse.move(h1.x + h1.w/2 + 20, h1.y + h1.h/2 + 10, {steps:3}); await p.mouse.move(h0.x + h0.w/2, h0.y + h0.h/2, {steps:6}); await p.waitForTimeout(120);
    await p.screenshot({ path: out('drag-merge') }); await p.mouse.up(); await p.waitForTimeout(300);
    const n1 = await p.evaluate(() => window.__im.S.armies.filter(a => a.owner === 0 && !a.air).length); uck('dragging a counter onto another merges', n1 === n0 - 1, [n0, n1]); }
  // right-click order: the force stays selected (route drawn, lastOrder set); a tap on the force again releases it, so does Esc (the other release, a second tap on the destination, is in .test/controls.js)
  const tgt = await p.evaluate(r => { const im = window.__im, G = im.G, a = im.S.armies.find(x => x.id === r.A0) || im.S.armies.find(x => x.owner === 0 && x.at === r.cap && !x.air); im.selectArmy(a.id); const v = G.P[r.cap].nbs.find(q => !G.P[q].sea && im.S.owner[q] === 0); const [x, y] = im.toScreen(G.P[v].x, G.P[v].y); return {x, y, id:a.id}; }, R);
  await p.mouse.click(tgt.x, tgt.y, {button:'right'}); await p.mouse.move(5, 870); await p.waitForTimeout(400); await p.screenshot({ path: out('deselect-route') });
  const ds = await p.evaluate(id => ({sel:window.__im.sel.army, path:window.__im.S.armies.find(x => x.id === id).path.length, last:!!window.__im.sel.lastOrder}), tgt.id); uck('right-click order keeps the force selected and the route drawn', ds.sel === tgt.id && ds.path > 0 && ds.last, ds);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  const ds2 = await p.evaluate(id => ({sel:window.__im.sel.army, path:window.__im.S.armies.find(x => x.id === id).path.length}), tgt.id); uck('Esc releases the force and keeps its route', ds2.sel === null && ds2.path > 0, ds2);
  // a fleet's info panel: water speed only; recruit cards with speeds
  await p.evaluate(r => { const im = window.__im, G = im.G, C0 = G.P[r.cap], sz = G.P.filter(P => P.sea).sort((x, y) => Math.hypot(x.x - C0.x, x.y - C0.y) - Math.hypot(y.x - C0.x, y.y - C0.y))[0].id; const f = im.addArmy(0, sz, {frig:2, sub:1}); im.selectArmy(f.id); }, R);
  await p.waitForTimeout(300); const fleetTxt = await p.evaluate(() => [...document.querySelectorAll('#ctx dt')].find(d => d.textContent === 'Speed')?.nextElementSibling?.textContent || ''); uck('fleet shows its water speed', /^water [\d,]+ km\/day$/.test(fleetTxt), fleetTxt);
  await p.screenshot({ path: out('fleet-speed') });
  await p.evaluate(r => { const im = window.__im; im.S.bld[r.cap].yard = 1; im.S.bld[r.cap].fac = 1; im.selectProv(r.cap); }, R); await p.waitForTimeout(400);
  const cards = await p.evaluate(() => [...document.querySelectorAll('[data-act="recruit"] .st')].map(e => e.textContent)); uck('recruit cards show km/day', cards.some(t => /LAND [\d,]+ · SEA [\d,]+ km\/d/.test(t)) && cards.some(t => /^NAVAL.*SEA [\d,]+ km\/d/.test(t)), cards.slice(0, 3));
  await p.screenshot({ path: out('recruit-speeds') });
  // worn wing: panel and counter
  await p.evaluate(r => { const im = window.__im, W = im.S.armies.find(x => x.id === r.W); W.air.wear = 0.58; W.air.cd = 0; W.fly = null; W.at = W.air.base; im.selectArmy(W.id); }, R); await p.waitForTimeout(400);
  const wt = await p.evaluate(() => document.querySelector('#ctx .cond')?.textContent || ''); uck('wing panel shows condition and maintenance', /Airframe condition\s*42%/.test(wt) && /Needs maintenance/.test(wt), wt.slice(0, 160));
  await p.screenshot({ path: out('worn-wing') });
  await p.evaluate(() => window.__im.v3c.clearSel()); await p.waitForTimeout(300); await p.screenshot({ path: out('worn-wing-map') });
  const allC = [...R.checks, ...ui], bad = allC.filter(c => !c.ok);
  for (const c of allC) console.log((c.ok ? 'PASS ' : 'FAIL ') + c.name + (c.ok ? '' : ' :: ' + JSON.stringify(c.info)));
  console.log(JSON.stringify(R.info));
  console.log(errs, cons.slice(0, 5)); await b.close(); process.exit(errs.length || bad.length ? 1 : 0);
})();
