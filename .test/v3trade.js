// V3 step 5: trade routes, blockades, convoy raids, escorts, AI trade war, Diplomacy UI, old saves, coalition gifting.
// node .test/v3trade.js  (exits 1 on any failed check or page error; screenshots .test/v3-trade-*.png)
const pickNation = require('./pick-nation.js');   // (a start-screen card by its nation's name, on either world)
const { chromium } = require('playwright');
const fails = [], ok = (c, m, extra) => { if (!c) fails.push(m + (extra !== undefined ? ' ' + JSON.stringify(extra) : '')); };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1400, height: 860 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(400);
  await pickNation(p, 'United States'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.click('#sp0');
  await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));

  // 1. routes at the start: every power trades by sea, routes pay both sides, income shows them
  const r1 = await p.evaluate(() => { const im = window.__im, S = im.S, T = S.trade, alive = S.nations.filter(N => N.alive);
    const seaBy = alive.map(N => T.routes.filter(r => (r.a === N.id || r.b === N.id) && r.kind === 'sea').length);
    const land = T.routes.filter(r => r.kind === 'land').length, neu = T.routes.filter(r => r.b < 0).length;
    const inc = im.income(0), tr = im.trade.income(0);
    return {n:T.routes.length, seaMin:Math.min(...seaBy), land, neu, both:T.routes.filter(r => r.b >= 0).every(r => r.va && r.vb && r.va.cash > 0 && r.vb.cash > 0), trCash:tr.cash, incTrade:inc.trade.cash, tip:document.querySelector('.chip.res-cash').title}; });
  console.log('start', JSON.stringify({...r1, tip:r1.tip.slice(0, 160)}));
  ok(r1.n >= 25, 'at least 25 routes', r1.n); ok(r1.seaMin >= 1, 'every power has a sea route', r1.seaMin); ok(r1.land >= 2, 'some land routes'); ok(r1.neu >= 8, 'routes with independents');
  ok(r1.both, 'power-power routes pay both sides'); ok(r1.trCash > 5 && Math.abs(r1.trCash - r1.incTrade) < 0.01, 'trade in income', r1); ok(/Trade routes/.test(r1.tip), 'economy tooltip lists trade');

  // 2. blockade: enemy frigates on a sea zone of the US-Brazil route stop it; own warships contest it (half); income follows
  const r2 = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, T = S.trade, br = S.nations.findIndex(N => N.name === 'Brazil'), ru = S.nations.findIndex(N => N.name === 'Russia');
    const r = T.routes.find(x => x.kind === 'sea' && ((x.a === 0 && x.b === br) || (x.b === 0 && x.a === br))) || T.routes.find(x => x.kind === 'sea' && (x.a === 0 || x.b === 0) && x.b >= 0 && x.len >= 5);
    S.rel[[0, ru].sort((a, b) => a - b).join(',')] = {st:'war', since:S.hour, until:null}; S.nations[ru].ai = false; if (r.b >= 0) S.nations[r.a === 0 ? r.b : r.a].ai = false;   // (Russia and the partner give no orders of their own here: Russia's AI would blockade the US ports, the partner's pause the raided route)
    const B = im.trade.base(r), [bx, by] = B.pts[0], z = G.prov[B.cells[0]]; im.trade.block(); const f0 = r.f, i0 = im.trade.income(0).cash, net0 = im.income(0).net.cash;
    const foe = im.addArmy(ru, z, {frig:3}); foe.pos = [bx, by]; foe.raid = {r:r.id, z, t:S.hour + 1e6}; im.trade.block(); const fNo = r.f;   // (not ordered to blockade: no blockade)
    im.trade.blockade(foe, true); im.trade.block(); const f1 = r.f, why1 = r.why, i1 = im.trade.income(0).cash, html = im.trade.html(); const vAll = S.trade.routes.filter(x => (x.a === 0 || x.b === 0) && x.f === 0).reduce((s0, x) => s0 + (x.a === 0 ? x.va.cash : x.vb.cash), 0);
    const own = im.addArmy(0, z, {frig:2}); own.pos = [bx + 2, by]; im.trade.block(); const f2 = r.f, why2 = r.why;
    S.armies = S.armies.filter(a => a !== own); r.acc = 0; r.accN = 0; im.trade.block();
    return {id:r.id, z, bx, by, zname:G.P[z].name, partner:r.b === 0 ? r.a : r.b, f0, fNo, f1, why1, f2, why2, i0, i1, v:r.a === 0 ? r.va.cash : r.vb.cash, net0, blockTxt:/Port blockaded: Russia warships/.test(html), foe:foe.id, vAll}; });
  console.log('blockade', JSON.stringify(r2));
  ok(r2.f0 === 1 && r2.fNo === 1 && r2.f1 === 0 && r2.why1 === 'port', 'enemy frigates ordered to blockade the approach to a port cut the route (not without the order)', r2); ok(r2.f2 === 0.5 && r2.why2 === 'contested', 'own warships contest the blockade', r2);
  ok(Math.abs((r2.i0 - r2.i1) - r2.vAll) < 0.05 && r2.vAll >= r2.v, 'blockade removes the income of every route through the zone', r2); ok(r2.blockTxt, 'diplomacy shows the blockade');
  // income with the blockade held all day: the day's treasury gain is the net income minus the route's money
  const r2b = await p.evaluate(r2 => { const im = window.__im, S = im.S; S.nations[0].cash = 5000; let guard = 0; while (S.hour % 24 !== 23 && guard++ < 30) im.tick(); im.trade.block();
    const exp = im.income(0).net.cash, c0 = S.nations[0].cash; im.tick(); const got = S.nations[0].cash - c0, r = im.trade.route(r2.id);
    return {exp, got, f:r && r.f}; }, r2);
  console.log('blockade day', JSON.stringify(r2b));
  ok(r2b.f === 0 && Math.abs(r2b.got - r2b.exp) < Math.max(2, Math.abs(r2b.exp)*0.03), 'a blockaded day pays no route income', r2b);
  await p.evaluate(r2 => { const im = window.__im, S = im.S, G = im.G, P = G.P[r2.z]; S.armies.forEach(a => { if (a.id === r2.foe){ a.u.frig = 0; a.w.frig = 0; } }); im.trade.block(); im.view.s = 1.6; im.view.x = 700 - P.x*1.6; im.view.y = 430 - P.y*1.6;
    const f2 = im.addArmy(S.nations.findIndex(N => N.name === 'Russia'), r2.z, {frig:3}); f2.pos = [r2.bx, r2.by]; im.trade.blockade(f2, true); im.trade.block(); document.querySelectorAll('.toast').forEach(t => t.remove()); }, r2);
  const noon = async () => p.evaluate(() => { const S = window.__im.S; window.__h0 = S.hour; S.hour = Math.floor(S.hour/24)*24 + 14; });
  const unNoon = async () => p.evaluate(() => { window.__im.S.hour = window.__h0; });
  await noon(); await p.waitForTimeout(700); await p.screenshot({ path: __dirname + '/v3-trade-blockade.png' }); await unNoon();
  const r2c = await p.evaluate(r2 => { const im = window.__im, S = im.S; S.armies.forEach(a => { if (a.owner !== 0 && a.at === r2.z){ a.u.frig = 0; a.w.frig = 0; } }); S.armies = S.armies.filter(a => Object.values(a.u).some(v => v > 0)); im.trade.block(); return im.trade.route(r2.id).f; }, r2);
  ok(r2c === 1, 'blockade lifts when the warships leave', r2c);

  // 3. raided convoy: Russian submarines on the route sink the day's convoy (income lost, log)
  const r3 = await p.evaluate(r2 => { const im = window.__im, S = im.S, r = im.trade.route(r2.id), ru = S.nations.findIndex(N => N.name === 'Russia'); r.raid = -1e9;
    const sb = im.addArmy(ru, r2.z, {sub:6}); sb.pos = [r2.bx, r2.by]; sb.raid = {r:r.id, z:r2.z, t:S.hour + 1e6}; let guard = 0; while (S.hour % 24 !== 23 && guard++ < 30) im.tick(); im.trade.block(); const exp0 = im.income(0).net.cash, c0 = S.nations[0].cash;
    const mineR = () => S.trade.routes.filter(x => x.a === 0 || x.b === 0), fv = () => mineR().reduce((s0, x) => s0 + (x.a === 0 ? x.va.cash : x.vb.cash)*x.f, 0); im.tick(); 
    const got = S.nations[0].cash - c0, lg = S.log.filter(l => l.h === S.hour && /sank your convoy/.test(l.text)).map(l => l.text);
    const v = S.trade.routes.filter(x => (x.a === 0 || x.b === 0) && x.why === 'sunk' && x.raid === S.hour).reduce((s0, x) => s0 + (x.a === 0 ? x.va.cash : x.vb.cash), 0);
    return {why:r.why, bk:r.bk, bko:(S.armies.find(a => a.id === r.bk) || {}).owner, by:r.by, blks:S.armies.filter(a => a.blk).map(a => a.owner + "@" + a.at), sunk:r.why === "sunk", f:r.f, raidZ:r.raidZ, lost:exp0 - got, v, v1:r.a === 0 ? r.va.cash : r.vb.cash, log:lg[0] || null, hit:S.trade.hit[0]}; }, r2);
  console.log('raid', JSON.stringify(r3));
  ok(r3.sunk && r3.f === 0 && r3.log, 'submarines sink the convoy and it is logged', r3); ok(r3.lost >= r3.v1 - 0.5 && r3.lost <= r3.v + 3, 'the sunk day loses the route income', r3); ok(r3.hit >= 1, 'AI trade-hit memory');

  // 4. escorts: frigates escorting the route beat off most raids and damage the raiders; unescorted convoys are lost
  const r4 = await p.evaluate(r2 => { const im = window.__im, S = im.S, r = im.trade.route(r2.id), ru = S.nations.findIndex(N => N.name === 'Russia');
    S.armies = S.armies.filter(a => !(a.at === r2.z && a.owner === ru)); const sub = im.addArmy(ru, r2.z, {sub:3}); sub.pos = [r2.bx, r2.by]; sub.raid = {r:r.id, z:r2.z, t:S.hour + 1e6};
    const tally = esc => { let saved = 0, sunk = 0, dmg = 0; for (let i = 0; i < 40; i++){ sub.u.sub = 3; sub.w.sub = 0; if (esc){ esc.u.frig = 6; esc.w.frig = 0; } r.raid = -1e9; im.trade.seaIndex(); im.trade.status(r); const R = im.trade.raid(r); if (!R) continue; if (R.saved) saved++; else sunk++; dmg += R.dealt; } return {saved, sunk, dmg}; };
    const none = tally(null); const esc = im.addArmy(0, S.nations[0].capital, {}); esc.at = r2.z; esc.u.frig = 6; im.trade.escort(esc, r.id); const withE = tally(esc);
    return {none, withE, escort:esc.escort === r.id, status:im.trade.html().includes('escorted by')}; }, r2);
  console.log('escort', JSON.stringify(r4));
  ok(r4.none.saved === 0 && r4.none.sunk >= 25, 'unescorted convoys are sunk', r4.none); ok(r4.withE.saved > r4.withE.sunk*1.5 && r4.withE.dmg > 0, 'escorts repel most raids and hurt raiders', r4.withE); ok(r4.escort && r4.status, 'escort order and status');
  // the escort order sails a fleet from port to the route
  const r4b = await p.evaluate(r2 => { const im = window.__im, S = im.S, G = im.G, r = im.trade.route(r2.id); S.armies = S.armies.filter(a => !(a.at === r2.z));
    const port = G.P.find(P => S.owner[P.id] === 0 && P.cityName === 'New York' && P.nbs.some(v => G.P[v].sea)) || G.P.find(P => S.owner[P.id] === 0 && P.city && P.nbs.some(v => G.P[v].sea));
    const f = im.addArmy(0, port.id, {frig:2}); im.trade.escort(f, r.id); const p0 = f.path.length; for (let i = 0; i < 120 && (f.path.length || f.to !== null); i++) im.tick();
    return {p0, at:f.at, onRoute:r.path.includes(f.at) || r.path.some(z => G.P[z].nbs.includes(f.at)), escort:f.escort === r.id, st:document.body.innerText.length > 0}; }, r2);
  console.log('escort sail', JSON.stringify(r4b));
  ok(r4b.p0 > 0 && r4b.onRoute && r4b.escort, 'escort fleet sails to its route', r4b);
  // fleet panel: the Escort route selector
  const r4c = await p.evaluate(() => { const im = window.__im, S = im.S, f = S.armies.find(a => a.owner === 0 && a.escort != null); im.selectArmy(f.id); const s0 = document.querySelector('select[data-act="escort-set"]'); return {has:!!s0, val:s0 && s0.value, id:f.escort, opts:s0 ? s0.options.length : 0}; });
  ok(r4c.has && +r4c.val === r4c.id && r4c.opts >= 2, 'fleet panel escort selector', r4c);
  await p.selectOption('select[data-act="escort-set"]', ''); const r4d = await p.evaluate(() => window.__im.S.armies.filter(a => a.owner === 0 && a.escort != null).length);
  ok(r4d === 0, 'escort cleared from the panel', r4d);

  // 5. port blockade: enemy warships next to the port (off the lane) blockade the route; air raids add to the raid power
  const r5 = await p.evaluate(r2 => { const im = window.__im, S = im.S, G = im.G, r = im.trade.route(r2.id), ru = S.nations.findIndex(N => N.name === 'Russia'); r.raid = -1e9;
    const B = im.trade.base(r), e = B.cells[B.cells.length - 1], [ex, ey] = B.pts[B.pts.length - 1];
    const f = im.addArmy(ru, G.prov[e], {crui:2}); f.pos = [ex + 60*0.11547, ey]; im.trade.blockade(f, true); im.trade.block(); const why = r.why, fv = r.f; S.armies = S.armies.filter(a => a !== f); im.trade.block();
    im.trade.air(ru, r2.z, 30); im.trade.seaIndex(); let hits = 0; for (let i = 0; i < 20; i++){ r.raid = -1e9; im.trade.status(r); const R = im.trade.raid(r); if (R && !R.saved) hits++; }
    return {why, f:fv, airHits:hits}; }, r2);
  console.log('port', JSON.stringify(r5));
  ok(r5.skip || (r5.why === 'port' && r5.f === 0), 'port blockade stops the route', r5); ok(r5.airHits >= 10, 'patrol/strike aircraft raid convoys', r5);
  await p.evaluate(r2 => { const S = window.__im.S; delete S.trade.air[r2.z]; S.trade.routes.forEach(r => r.raid = -1e9); }, r2);

  // 6. AI trade war: Japan at war with China raids Chinese trade with submarines; China escorts its raided route; AI builds escorts when raided
  const r6 = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, jp = S.nations.findIndex(N => N.name === 'Japan'), cn = S.nations.findIndex(N => N.name === 'China');
    S.rel[[jp, cn].sort((a, b) => a - b).join(',')] = {st:'war', since:S.hour, until:null}; im.trade.gen();
    const jport = G.P.find(P => S.owner[P.id] === jp && P.city && P.nbs.some(v => G.P[v].sea)), cport = G.P.find(P => S.owner[P.id] === cn && P.city && P.nbs.some(v => G.P[v].sea));
    const sub = im.addArmy(jp, jport.id, {sub:3}); im.trade.seaIndex(); for (let i = 0; i < 20 && !sub.raid; i++) im.trade.ai(jp);
    const cr = S.trade.routes.filter(r => r.kind === 'sea' && (r.a === cn || r.b === cn)); cr.forEach(r => r.raid = -1e9); cr[0].raid = S.hour; cr[0].raidZ = cr[0].path[0];
    S.bld[cport.id].yard = 1; const fr = im.addArmy(cn, cport.id, {frig:3}); im.trade.ai(cn); im.trade.seaIndex(); im.trade.escortHour();
    const pick = h => { S.trade.hit[cn] = h; let fq = 0; for (let i = 0; i < 300; i++) if (im.aiPickUnit(cn, cport.id) === 'frig') fq++; return fq; };
    const f0 = pick(0), f4 = pick(4); S.trade.hit[cn] = 0;
    const hunt = im.trade.hunt(jp, jport.id, 30);
    return {raid:sub.raid || null, subPath:sub.path.length, cnRoutes:cr.length, escort:fr.escort, escortRoute:cr[0].id, frPath:fr.path.length, jpcn:S.trade.routes.some(r => (r.a === jp && r.b === cn) || (r.a === cn && r.b === jp)), f0, f4, hunt}; });
  console.log('ai', JSON.stringify(r6));
  ok(r6.raid && r6.subPath >= 0, 'AI sends submarines to raid enemy trade', r6); ok(r6.escort != null && r6.frPath > 0, 'AI escorts its raided route', r6); ok(!r6.jpcn, 'war ends the route between the belligerents');
  ok(r6.f4 > r6.f0, 'AI builds more frigates when its convoys are sunk', r6); ok(r6.hunt >= 0, 'AI patrol aircraft hunt over trade routes', r6);
  // AI-vs-AI trade war over 10 days: raids happen and escorts get assigned, nothing breaks
  const r6b = await p.evaluate(() => { const im = window.__im, S = im.S, jp = S.nations.findIndex(N => N.name === 'Japan'), cn = S.nations.findIndex(N => N.name === 'China'); let maxRaid = 0;
    for (let i = 0; i < 240; i++){ im.tick(); maxRaid = Math.max(maxRaid, S.armies.filter(a => a.raid).length); }
    return {raiders:maxRaid, escorts:S.armies.filter(a => a.escort != null).length, sunk:S.trade.routes.reduce((s0, r) => s0 + (r.sunk || 0), 0), routes:S.trade.routes.length, hour:S.hour}; });
  console.log('ai 10 days', JSON.stringify(r6b));
  ok(r6b.raiders >= 1 && r6b.routes >= 20, 'AI raid fleets in a long run', r6b);

  // 7. Diplomacy: trade list, close / reopen / open, screenshot; map lanes with convoys
  const openDiplo = async () => { const vis = () => p.evaluate(() => { const m = document.getElementById('modal'), b = m.querySelector('.trl [data-act="trade-close"]'); return !m.hidden && !!b && b.getClientRects().length > 0; });
    for (let k = 0; k < 5; k++){ await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); if (await vis()) return;
      // another popup (an event, a briefing) is in front: close it first; 'd' toggles, so it is only pressed with no popup open
      const open = await p.evaluate(() => { const m = document.getElementById('modal'); if (m.hidden) return false; const x = m.querySelector('[data-act="resume"]'); if (x) x.click(); return true; });
      if (open){ await p.waitForTimeout(150); if (!(await p.evaluate(() => document.getElementById('modal').hidden))){ await p.keyboard.press('Escape'); await p.waitForTimeout(150); } continue; }
      await p.keyboard.press('d'); await p.waitForFunction(() => { const m = document.getElementById('modal'), b = m.querySelector('.trl [data-act="trade-close"]'); return !m.hidden && !!b && b.getClientRects().length > 0; }, null, { timeout: 1500 }).catch(() => {}); } };
  await p.waitForTimeout(300); await openDiplo(); await p.waitForTimeout(100);
  const r7 = await p.evaluate(() => ({rows:document.querySelectorAll('.trr').length, mine:window.__im.S.trade.routes.filter(r => r.a === 0 || r.b === 0).length, hasOpen:!!document.querySelector('[data-act="trade-open"]')}));
  await p.evaluate(() => { const el = document.querySelector('.trl'); if (el) el.scrollIntoView(); }); await p.waitForTimeout(150);
  await p.screenshot({ path: __dirname + '/v3-trade-diplo.png' });
  ok(r7.rows === r7.mine && r7.rows >= 2 && r7.hasOpen, 'diplomacy lists the routes', r7);
  await openDiplo(); const id0 = await p.evaluate(() => { const el = document.querySelector('.trl [data-act="trade-close"]'); return el ? +el.dataset.id : null; });
  await p.click(`.trr [data-act="trade-close"][data-id="${id0}"]`); await p.waitForSelector('[data-act="trade-reopen"]', { timeout: 2000 }).catch(() => {}); await p.waitForTimeout(100);
  const r7b = await p.evaluate(id0 => ({gone:!window.__im.S.trade.routes.some(r => r.id === id0), chip:!!document.querySelector('[data-act="trade-reopen"]'), closed:Object.keys(window.__im.S.trade.closed).length}), id0);
  ok(r7b.gone && r7b.chip && r7b.closed === 1, 'closing a route', r7b);
  await p.click('[data-act="trade-reopen"]'); await p.waitForFunction(() => !Object.keys(window.__im.S.trade.closed).length, null, { timeout: 2000 }).catch(() => {}); await p.waitForTimeout(150);
  const r7c = await p.evaluate(() => ({closed:Object.keys(window.__im.S.trade.closed).length, rows:document.querySelectorAll('.trr').length}));
  ok(r7c.closed === 0 && r7c.rows === r7.rows, 'reopening a route', r7c);
  await p.evaluate(() => { const im = window.__im, S = im.S, port = im.G.P.find(P => S.owner[P.id] === 0 && P.city && P.nbs.some(v => im.G.P[v].sea)); im.addArmy(0, port.id, {frig:2, crui:1}); S.armies.forEach(a => { if (a.owner === 0) delete a.escort; }); });
  await p.click('.trr [data-act="trade-escort"]'); await p.waitForFunction(() => { const el = document.querySelector('.trl'); return el && /escorted by/.test(el.innerText); }, null, { timeout: 3000 }).catch(() => {});
  const r7e = await p.evaluate(() => ({esc:window.__im.S.armies.filter(a => a.owner === 0 && a.escort != null).length, txt:/escorted by/.test(document.querySelector('.trl').innerText)}));
  ok(r7e.esc === 1 && r7e.txt, 'Escort button in Diplomacy assigns a fleet', r7e);
  const opt = await p.evaluate(() => { const o = [...document.querySelectorAll('#tropen option')].find(x => x.value[0] === 'c'); return o ? o.value : null; });
  if (opt){ await p.selectOption('#tropen', opt); await p.click('[data-act="trade-open"]'); await p.waitForTimeout(150); }
  const r7d = await p.evaluate(() => document.querySelectorAll('.trr').length);
  ok(!opt || r7d === r7.rows + 1, 'opening a route with an independent', {opt, r7d});
  await p.evaluate(() => { const el = document.querySelector('.trl'); if (el) el.scrollIntoView(); }); await p.waitForTimeout(100);
  await p.screenshot({ path: __dirname + '/v3-trade-diplo2.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  // lanes and convoys: world, mid and close views
  for (const [nm, city, s] of [['lanes-world', 'Cairo', 0.33], ['lanes-mid', 'Algiers', 1.0], ['lanes-close', 'Marseille', 3.4]]){
    await p.evaluate(([city, s]) => { const im = window.__im, G = im.G; document.querySelectorAll('.toast').forEach(t => t.remove()); const best = G.P.find(P => P.cityName === city) || G.P[0]; im.view.s = s; im.view.x = 520 - best.x*s; im.view.y = 430 - best.y*s; }, [city, s]);
    await noon(); await p.waitForTimeout(700); await p.screenshot({ path: __dirname + '/v3-trade-' + nm + '.png' }); await unNoon(); }

  // 8. war between partners ends the route; embargo too
  const r8 = await p.evaluate(() => { const im = window.__im, S = im.S, r = S.trade.routes.find(x => (x.a === 0 && x.b > 0) || (x.b === 0 && x.a > 0)), o = r.a === 0 ? r.b : r.a;
    S.rel[[0, o].sort((a, b) => a - b).join(',')] = {st:'war', since:S.hour, until:null}; im.trade.gen(); const gone = !S.trade.routes.some(x => x.key === r.key);
    return {gone, log:S.log.some(l => /trade route has ended: war/.test(l.text))}; });
  ok(r8.gone && r8.log, 'war ends a trade route', r8);

  // 9. coalition support: direct gifts both ways, every resource, limits, AI->player and AI->AI aid, nothing on the market
  const r9 = await p.evaluate(() => { const im = window.__im, S = im.S, T = im.trade, ca = S.nations.findIndex(N => N.name === 'Canada'), brz = S.nations.findIndex(N => N.name === 'Brazil'), ru = S.nations.findIndex(N => N.name === 'Russia');
    const key = (a, b) => [a, b].sort((x, y) => x - y).join(','); S.rel[key(0, ca)] = {st:'ally', since:S.hour, until:null}; S.rel[key(ca, brz)] = {st:'ally', since:S.hour, until:null}; S.rel[key(0, brz)] = {st:'peace', since:S.hour, until:null};
    const bl = T.blocs(); const me = S.nations[0], C = S.nations[ca], B = S.nations[brz], out = {bloc:bl.find(x => x.members.includes(0))?.members.length};
    const book0 = JSON.stringify(S.book || []), mk0 = JSON.stringify(S.mkt && S.mkt.p);
    const g = o => { for (const k in o) if (GOODS.includes(k)) o[k] *= RES_K; return o; }, k1 = v => v/RES_K;   // (goods written in the old units, scaled to RES_K)
    Object.assign(me, g({cash:1000, oil:100, metal:100, rare:100, mp:100})); Object.assign(C, g({cash:500, oil:50, metal:50, rare:50, mp:50}));
    T.setGift(g({n:ca, cash:100, oil:10, metal:20, rare:30, mp:5, provs:[]})); out.sent = T.sendGift(ca);
    out.me = [me.cash, k1(me.oil), k1(me.metal), k1(me.rare), me.mp]; out.ca = [C.cash, k1(C.oil), k1(C.metal), k1(C.rare), C.mp];
    // to a partner of a partner (same coalition, not directly allied)
    T.setGift(g({n:brz, cash:50, oil:0, metal:0, rare:0, mp:0, provs:[]})); const b0 = B.cash; out.sentB = T.sendGift(brz); out.bGot = B.cash - b0;
    // limits: more than you have, more than they can store
    T.setGift(g({n:ca, cash:1e9, oil:0, metal:0, rare:0, mp:0, provs:[]})); const c0 = C.cash; T.sendGift(ca); out.capCash = [me.cash, C.cash - c0];
    me.cash = 1000; me.oil = 300*RES_K; C.oil = (Math.floor(400 + 15*S.owner.filter(o => o === ca).length) - 5)*RES_K; T.setGift(g({n:ca, cash:0, oil:50, metal:0, rare:0, mp:0, provs:[]})); const o0 = C.oil, mo0 = me.oil; T.sendGift(ca); out.capOil = [k1(C.oil - o0), k1(mo0 - me.oil)];
    // not a coalition partner: refused
    T.setGift(g({n:ru, cash:10, oil:0, metal:0, rare:0, mp:0, provs:[]})); out.foreign = T.sendGift(ru);
    // AI -> player: every resource type when short
    out.aid = {};
    for (const k of ['cash', 'oil', 'metal', 'iron', 'elec', 'rare', 'mp']){ Object.assign(me, g({cash:900, oil:200, metal:200, iron:200, elec:200, rare:200, mp:200})); me[k] = k === 'cash' ? 10 : k === 'mp' ? 5 : 5*RES_K; Object.assign(C, g({cash:3000, oil:300, metal:300, iron:300, elec:300, rare:300, mp:300})); Object.assign(B, g({cash:3000, oil:300, metal:300, iron:300, elec:300, rare:300, mp:300}));
      let got = 0; for (let i = 0; i < 30 && !got; i++){ S.aidAsk = {}; const v0 = me[k]; T.coalitionAid(); got = me[k] - v0; } out.aid[k] = got; }
    // AI -> AI: Brazil short of oil, Canada rich, player fine
    Object.assign(me, g({cash:900, oil:200, metal:200, iron:200, elec:200, rare:200, mp:200})); B.oil = 2*RES_K; let gotB = 0; for (let i = 0; i < 30 && !gotB; i++){ S.aidAsk = {}; const v0 = B.oil; T.coalitionAid(); gotB = B.oil - v0; } out.aiAi = gotB;
    out.bookSame = JSON.stringify(S.book || []) === book0; out.mktSame = JSON.stringify(S.mkt && S.mkt.p) === mk0;
    // leaving the coalition: no more gifts
    S.rel[key(0, ca)] = {st:'peace', since:S.hour, until:null}; T.setGift(g({n:ca, cash:10, oil:0, metal:0, rare:0, mp:0, provs:[]})); out.afterLeave = T.sendGift(ca);
    S.rel[key(0, ca)] = {st:'ally', since:S.hour, until:null}; T.blocs();
    return out; });
  console.log('coalition', JSON.stringify(r9));
  ok(r9.bloc === 3, 'three-member coalition', r9.bloc); ok(r9.sent && r9.me.join() === '900,90,80,70,95' && r9.ca.join() === '600,60,70,80,55', 'player -> AI gift of every resource', r9);
  ok(r9.sentB && Math.abs(r9.bGot - 50) < 0.01, 'gift to a partner of a partner', r9.bGot); ok(r9.capCash[0] === 0 && r9.capCash[1] > 0, 'cannot give more than you have', r9.capCash);
  ok(r9.capOil[0] === 5 && r9.capOil[1] === 5, 'gift limited by the recipient storage', r9.capOil); ok(r9.foreign === false, 'no gifts outside the coalition');
  ok(Object.values(r9.aid).every(v => v > 0), 'AI partners send every resource type to the player', r9.aid); ok(r9.aiAi > 0, 'AI partners aid each other', r9.aiAi);
  ok(r9.bookSame && r9.mktSame, 'gifts bypass the market', r9); ok(r9.afterLeave === false, 'leaving the coalition stops gifts');
  // the Give tab in the UI has every resource including manpower
  await p.waitForTimeout(300); await p.evaluate(() => { const m = document.getElementById('modal'); if (!m.hidden){ const x = m.querySelector('[data-act="resume"]'); if (x) x.click(); } }); await p.keyboard.press('d'); await p.waitForTimeout(200);
  const caId = await p.evaluate(() => window.__im.S.nations.findIndex(N => N.name === 'Canada'));
  await p.click(`[data-act="nat-open"][data-id="${caId}"][data-k="give"]`); await p.waitForTimeout(150);
  const r9b = await p.evaluate(() => [...document.querySelectorAll('input[data-act="gift-res"]')].map(i => i.dataset.k).join(','));
  ok(r9b === 'cash,oil,metal,iron,elec,rare,mp', 'give tab lists every resource', r9b);
  await p.screenshot({ path: __dirname + '/v3-trade-give.png' }); await p.keyboard.press('Escape');

  // 10. an old save (step-4 build, no trade) loads and lays out routes
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errs.push('old: ' + e.message));
  await p2.goto('file://' + __dirname + '/page_s4.html'); await p2.evaluate(() => localStorage.clear()); await p2.reload(); await p2.waitForTimeout(400);
  await pickNation(p2, 'France'); await p2.click('[data-act="begin"]'); await p2.click('[data-act="start"]');
  await p2.evaluate(() => { for (let i = 0; i < 30; i++) window.__im.tick(); document.dispatchEvent(new Event('visibilitychange')); localStorage.setItem('iron-meridian-save-v5', JSON.stringify(window.__im.S)); });
  await p2.goto('file://' + __dirname + '/page.html'); await p2.waitForTimeout(600); await p2.click('[data-act="continue"]');
  const r10 = await p2.evaluate(() => { const im = window.__im, S = im.S; const n0 = S.trade ? S.trade.routes.length : -1; for (let i = 0; i < 48; i++) im.tick(); return {n0, n1:S.trade.routes.length, hour:S.hour, name:S.nations[0].name, tr:Math.round(im.income(0).trade.cash)}; });
  console.log('old save', JSON.stringify(r10));
  ok(r10.n0 > 10 && r10.n1 > 10 && r10.name === 'France' && r10.tr > 0, 'old save gets trade routes', r10);

  console.log(JSON.stringify(errs)); console.log(fails.length ? 'FAILS:\n' + fails.join('\n') : 'ALL OK');
  await b.close(); process.exit(fails.length || errs.length ? 1 : 0);
})();
