// V3 air: drones, UAV levels, jammers, bombers, maritime patrol, AWACS contacts. Scripted scenarios with averaged outcomes + screenshots.
// usage: node .test/v3air.js   (exits 1 on page errors or failed checks)
const pickNation = require('./pick-nation.js');   // (a start-screen card by its nation's name, on either world)
const { chromium } = require('playwright');
const out = n => __dirname + '/v3-air-' + n + '.png';
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 880 } }); const errs = [], cons = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) cons.push(m.text()); });
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
  await pickNation(p, 'France'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForTimeout(800);
  const R = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, A = im.air, checks = [];
    const ck = (name, ok, info) => checks.push({name, ok:!!ok, info});
    const E = S.nations.findIndex(n => n.name === 'Germany'); S.hour = 24*12 + 12; S.rel['0,' + E] = {st:'war', since:S.hour, until:null};
    for (const id of ['u_jet', 'u_int', 'jet_pgm', 'int_msl', 'u_drone', 'drone_g2', 'u_jam', 'u_swarm', 'u_sdrone', 'u_asf', 'u_bomb', 'u_mpa', 'u_awacs']){ S.nations[0].tech[id] = 1; S.nations[E].tech[id] = 1; }
    S.nations[0].tv = (S.nations[0].tv || 0) + 50; S.nations[E].tv = (S.nations[E].tv || 0) + 50;
    const cnt = a => Object.values(a.u).reduce((x, y) => x + y, 0);
    const clear = ids => { S.armies = S.armies.filter(a => !ids.includes(a.id)); };
    // a German province next to France (front) and a French base province next to it
    let fp = -1, gp = -1; for (const P of G.P){ if (P.sea || S.owner[P.id] !== 0) continue; const v = P.nbs.find(q => S.owner[q] === E && !G.P[q].sea); if (v != null){ fp = P.id; gp = v; break; } }
    const gcity = G.P.filter(P => S.owner[P.id] === E && P.city && !P.sea).map(P => P.id).sort((x, y) => Math.hypot(G.P[x].x - G.P[fp].x, G.P[x].y - G.P[fp].y) - Math.hypot(G.P[y].x - G.P[fp].x, G.P[y].y - G.P[fp].y))[0];
    const strip = p0 => { for (const a of S.armies) if (a.at === p0 && a.owner !== 0) for (const t in a.u) a.u[t] = 0; S.armies = S.armies.filter(a => cnt(a) > 0); };
    const wing = (o, base, u) => { const w = im.addArmy(o, base, u); w.air = {base, cd:0}; return w; };
    const avg = xs => Math.round(xs.reduce((x, y) => x + y, 0)/xs.length*100)/100;
    const res = {};
    // ---- A. swarm vs an air-defended province (12 swarm drones = 2 cards) against SAMs, jammers or nothing; then jets after the swarm
    const swarmRun = (def, n = 30) => { const lost = [], adKilled = [], softKilled = [], sat = [];
      for (let i = 0; i < n; i++){ strip(gp); const d = im.addArmy(E, gp, def), d0 = {...d.u}; const w = wing(0, fp, {swarm:12}); A.resolveStrike(w, gp);
        lost.push(12 - (w.u.swarm || 0)); adKilled.push((d0.sam || 0) - (d.u.sam || 0) + (d0.jam || 0) - (d.u.jam || 0)); softKilled.push((d0.inf || 0) - (d.u.inf || 0)); sat.push(d.sat || 0); clear([d.id, w.id]); }
      return {swarmLost:avg(lost), adKilled:avg(adKilled), infKilled:avg(softKilled), sat:avg(sat)}; };
    res.swarmVsSam = swarmRun({sam:3, inf:4}); res.swarmVsJam = swarmRun({jam:3, inf:4}); res.swarmVsNone = swarmRun({inf:4}); res.swarmVsTanks = (() => { const k = []; for (let i = 0; i < 30; i++){ strip(gp); const d = im.addArmy(E, gp, {tank:4}); const w = wing(0, fp, {swarm:12}); A.resolveStrike(w, gp); k.push(4 - d.u.tank + d.w.tank/14); clear([d.id, w.id]); } return {tankEquivKilled:avg(k)}; })();
    const jetRun = (pre, n = 30) => { const lost = []; for (let i = 0; i < n; i++){ strip(gp); const d = im.addArmy(E, gp, {sam:3, inf:4}); if (pre){ const s0 = wing(0, fp, {swarm:12}); A.resolveStrike(s0, gp); clear([s0.id]); }
        const w = wing(0, fp, {jet:3}), h0 = 27; A.resolveStrike(w, gp); lost.push(h0 - (w.u.jet*9 - w.w.jet)); clear([d.id, w.id]); } return avg(lost); };
    res.jetHpLostVsSam = jetRun(false); res.jetHpLostAfterSwarm = jetRun(true);
    ck('swarm: jammers down more swarm drones than SAMs', res.swarmVsJam.swarmLost > res.swarmVsSam.swarmLost, [res.swarmVsJam.swarmLost, res.swarmVsSam.swarmLost]);
    ck('swarm: wears down SAMs (kills some, saturates the rest)', res.swarmVsSam.adKilled > 0.3 && res.swarmVsSam.sat > 0.1, res.swarmVsSam);
    ck('swarm: weak vs tanks', res.swarmVsTanks.tankEquivKilled < 1.2, res.swarmVsTanks);
    ck('swarm saturation makes the following jets safer', res.jetHpLostAfterSwarm < res.jetHpLostVsSam, [res.jetHpLostVsSam, res.jetHpLostAfterSwarm]);
    // ---- B. strike drone on a building (enemy city): knocked out / level lost, airbase grounding; SAM cover kills drones
    { strip(gcity); const B0 = S.bld[gcity]; B0.fac = 1; B0.air = 2; B0.silo = 0; const bw = wing(E, gcity, {jet:2});
      const w = wing(0, fp, {sdrone:3}); const before = {...S.bld[gcity]}; A.resolveStrike(w, gcity);
      const after = {...S.bld[gcity]}, dis = S.bdis && S.bdis[gcity] && Object.keys(S.bdis[gcity]).length ? Object.fromEntries(Object.entries(S.bdis[gcity]).map(([k, h]) => [k, h - S.hour])) : null;
      const grounded = A.airCheck(bw, fp); res.strikeDrone = {before:{fac:before.fac, air:before.air, silo:before.silo}, after:{fac:after.fac, air:after.air, silo:after.silo}, knockedOut:dis, enemyWingGrounded:dis && dis.air ? !grounded.ok : 'n/a', why:grounded.why, log:S.log[0].text};
      ck('strike drone hits a building (knocked out or level lost)', dis || after.fac + after.air + after.silo < before.fac + before.air + before.silo, res.strikeDrone);
      clear([bw.id, w.id]); if (S.bdis) delete S.bdis[gcity];
      const surv = []; for (let i = 0; i < 30; i++){ strip(gp); const d = im.addArmy(E, gp, {sam:3, inf:2}); const w2 = wing(0, fp, {sdrone:3}); A.resolveStrike(w2, gp); surv.push(w2.u.sdrone || 0); clear([d.id, w2.id]); }
      res.strikeDroneSurvivorsVs3Sam = avg(surv); ck('SAMs shred strike drones', res.strikeDroneSurvivorsVs3Sam < 1.5, res.strikeDroneSurvivorsVs3Sam); }
    // ---- C. UAV recon (identified, full details) vs AWACS (located only)
    { const far = G.P.filter(P => !P.sea && S.owner[P.id] === E && !A.visibleSet(0).has(P.id)).map(P => P.id).sort((x, y) => Math.hypot(G.P[x].x - G.P[fp].x, G.P[x].y - G.P[fp].y) - Math.hypot(G.P[y].x - G.P[fp].x, G.P[y].y - G.P[fp].y));
      const t1 = far[0], t2 = far[Math.min(far.length - 1, 6)]; strip(t1); strip(t2);
      const e1 = im.addArmy(E, t1, {tank:3, inf:2}), e2 = im.addArmy(E, t2, {art:2, sam:1}); e1.w.tank = 7;
      let v = A.visibleSet(0); const pre = {e1:A.armyVisible(e1, v), e1loc:A.armyLocated(e1, v)};
      const aw = wing(0, fp, {awacs:1}); aw.fly = {tgt:fp, kind:'orbit', ph:'over', t:0, hrs:16}; v = A.visibleSet(0);
      const withAwacs = {e1vis:A.armyVisible(e1, v), e1loc:A.armyLocated(e1, v), e2vis:A.armyVisible(e2, v), e2loc:A.armyLocated(e2, v), locProvs:v.loc.size};
      const uv = wing(0, fp, {drone:2}); uv.fly = {tgt:t1, kind:'recon', ph:'over', t:0, hrs:12, h0:12, salvo:0}; v = A.visibleSet(0);
      const withUav = {e1vis:A.armyVisible(e1, v), e1uav:v.uav.has(t1), e1loc:A.armyLocated(e1, v), e2vis:A.armyVisible(e2, v), e2loc:A.armyLocated(e2, v)};
      res.intel = {pre, withAwacs, withUav, t1:G.P[t1].name, t2:G.P[t2].name, uavLv:A.uavLv(0)};
      ck('fog hides the far German force at first', !pre.e1 && !pre.e1loc, pre);
      ck('AWACS locates but does not identify', withAwacs.e1loc && !withAwacs.e1vis, withAwacs);
      ck('UAV identifies (full details) where it watches', withUav.e1vis && withUav.e1uav && !withUav.e1loc, withUav);
      window.__scnC = {t1, t2, e1:e1.id, e2:e2.id, aw:aw.id, uv:uv.id, fp}; }
    // ---- D. heavy bombers vs a city, with and without enemy fighters (Air Superiority patrol over the city)
    { const bombRun = (fighters, n = 20) => { const bl = [], lv = [], dmg = [], broke = []; for (let i = 0; i < n; i++){ strip(gcity); const B0 = S.bld[gcity]; B0.fac = 3; B0.air = 2; B0.fdy = 1; B0.fort = 1;
          const lv0 = Object.values(S.bld[gcity]).reduce((x, y) => x + y, 0); const g = im.addArmy(E, gcity, {inf:6, at:2}), h0 = 6*10 + 2*9;
          let f = null; if (fighters){ f = wing(E, gcity, {asf:3}); f.fly = {tgt:gcity, kind:'patrol', ph:'patrol', t:0, hrs:12}; }
          const w = wing(0, fp, {bomb:3}); const L0 = S.log.length; A.resolveStrike(w, gcity);
          bl.push(3 - (w.u.bomb || 0)); lv.push(lv0 - Object.values(S.bld[gcity]).reduce((x, y) => x + y, 0)); dmg.push(h0 - (g.u.inf*10 - g.w.inf + g.u.at*9 - g.w.at)); broke.push(S.log.slice(0, 3).some(l => /jettison/.test(l.text)) ? 1 : 0);
          clear([g.id, w.id].concat(f ? [f.id] : [])); }
        return {bombersLost:avg(bl), buildingLevelsWrecked:avg(lv), garrisonHpLost:avg(dmg), raidsBrokenUp:avg(broke)}; };
      res.bomberNoFighters = bombRun(false); res.bomberVsAsf = bombRun(true);
      ck('bombers wreck buildings and garrison without fighters', res.bomberNoFighters.buildingLevelsWrecked >= 1.5 && res.bomberNoFighters.garrisonHpLost > 20, res.bomberNoFighters);
      ck('fighters make bombing costly and less effective', res.bomberVsAsf.bombersLost > res.bomberNoFighters.bombersLost + 0.5 && res.bomberVsAsf.buildingLevelsWrecked < res.bomberNoFighters.buildingLevelsWrecked, res.bomberVsAsf); }
    // ---- E. maritime patrol finds and hunts a submerged submarine
    { const sz = G.P.filter(P => P.sea && !S.armies.some(a => a.owner === 0 && a.at === P.id) && !P.nbs.some(q => S.armies.some(a => a.owner === 0 && a.at === q && a.u.frig))).map(P => P.id).sort((x, y) => Math.hypot(G.P[x].x - G.P[fp].x, G.P[x].y - G.P[fp].y) - Math.hypot(G.P[y].x - G.P[fp].x, G.P[y].y - G.P[fp].y))[2];
      const sub = im.addArmy(E, sz, {sub:3}); let v = A.visibleSet(0); const before = A.armyVisible(sub, v);
      const base = G.P.filter(P => S.owner[P.id] === 0 && P.city).sort((x, y) => Math.hypot(x.x - G.P[sz].x, x.y - G.P[sz].y) - Math.hypot(y.x - G.P[sz].x, y.y - G.P[sz].y))[0].id;
      const m = wing(0, base, {mpa:2}); const ok = A.airCheck(m, sz); im.orderAir(m, sz); let hrs = 0; while (m.fly && m.fly.ph !== 'over' && hrs < 30){ im.tick(); hrs++; }
      v = A.visibleSet(0); const after = A.armyVisible(sub, v); for (let i = 0; i < 7; i++) im.tick();
      res.mpa = {zone:G.P[sz].name, kind:ok.kind, flightHours:hrs, subSeenBefore:before, subSeenWithPatrol:after, subsLeft:sub.u.sub, subHP:Math.round(sub.u.sub*9 - sub.w.sub), mpaLeft:m.u.mpa, log:S.log.filter(l => /patrol/i.test(l.text)).slice(0, 2).map(l => l.text)};
      ck('submerged sub hidden until the patrol arrives', !before && after, res.mpa); ck('maritime patrol damages the sub', res.mpa.subHP < 27, res.mpa);
      clear([sub.id, m.id]); }
    // ---- F. AI: counter-picks and use of the new air units
    { const mixBase = A.enemyMix(E); const ds = []; const dw = wing(0, fp, {swarm:60}), dw2 = wing(0, fp, {sdrone:12}); im.tick();
      const mixDr = A.enemyMix(E); const city = gcity; S.bld[city].fac = 2; S.bld[city].air = 2;
      const pick = n0 => { const c = {}; for (let i = 0; i < 400; i++){ const t = A.aiPickUnit(E, city); c[t] = (c[t] || 0) + 1; } return c; };
      const picksDr = pick(); clear([dw.id, dw2.id].concat(ds));
      const bw = wing(0, fp, {bomb:8}); im.tick(); const picksBomb = pick(); clear([bw.id]);
      res.ai = {mixDroneShare:Math.round(mixDr.drone*100) + '%', jamPicksVsDrones:picksDr.jam || 0, asfPicksVsDrones:picksDr.asf || 0, asfPicksVsBombers:picksBomb.asf || 0, samPicksVsBombers:picksBomb.sam || 0, samPicksVsDrones:picksDr.sam || 0};
      ck('AI buys jammers against drones', (picksDr.jam || 0) >= 25, res.ai);
      // AI wings of every new type get missions
      const types = ['swarm', 'sdrone', 'drone', 'bomb', 'mpa', 'awacs', 'asf'], wings = {}; strip(gp); const tgtArmy = im.addArmy(0, gp, {sam:2, inf:3, art:2});
      const seaE = G.P.find(P => P.sea && P.nbs.includes(city)) || G.P.find(P => P.sea && P.nbs.some(q => S.owner[q] === E));
      const fsub = seaE ? im.addArmy(0, seaE.id, {sub:2, frig:1}) : null;
      for (const t of types){ const w = wing(E, city, {[t]:t === 'swarm' ? 12 : 2}); wings[t] = w; }
      A.aiAir(E); res.aiMissions = Object.fromEntries(types.map(t => [t, wings[t].fly ? wings[t].fly.kind + ' @ ' + (G.P[wings[t].fly.tgt].cityName || G.P[wings[t].fly.tgt].name) : 'idle']));
      ck('AI flies its drones and new aircraft', types.filter(t => wings[t].fly).length >= 5, res.aiMissions);
      clear(Object.values(wings).map(w => w.id).concat([tgtArmy.id], fsub ? [fsub.id] : [])); }
    // ---- G. a swarm card brings six drones; old wings and saves keep working
    { const q = S.queue[S.nations[0].capital]; A.spawn(0, S.nations[0].capital, 'swarm'); const w = S.armies.find(a => a.owner === 0 && a.air && a.u.swarm); res.swarmCard = w ? w.u.swarm : 0; ck('one swarm card = 6 drones', res.swarmCard === 6, res.swarmCard); if (w) clear([w.id]); }
    return {checks, res, gp, fp, gcity, E};
  });
  console.log(JSON.stringify(R.res, null, 1));
  // ---------------- screenshots
  const hideToasts = () => p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
  // 1. intel: AWACS only first (unidentified '?' contacts), then the UAV over Hessen identifies the forces around it; tooltips over both kinds
  const sc = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, c = window.__scnC, E = S.armies.find(a => a.id === c.e1).owner; const P1 = G.P[c.t1], s = 3.2;
    const uv = S.armies.find(a => a.id === c.uv); window.__uvFly = uv.fly; uv.fly = null;
    let n = 0; for (const P of G.P){ if (P.sea || S.owner[P.id] !== E || n > 14) continue; const d = Math.hypot(P.x - P1.x, P.y - P1.y); if (d < 150 && d > 25 && (P.id % 5) === 0){ im.addArmy(E, P.id, {inf:3, tank:1}); n++; } }
    im.view.s = s; im.view.x = 700 - P1.x*s; im.view.y = 430 - P1.y*s; im.selectProv(c.fp);
    const v = im.air.visibleSet(0), loc = S.armies.filter(a => im.air.armyLocated(a, v) && !a.air && a.to === null).map(a => im.toScreen(G.P[a.at].x, G.P[a.at].y)).filter(q => q[0] > 100 && q[0] < 900 && q[1] > 120 && q[1] < 800);
    return {loc:loc[0], nLoc:loc.length, e1:im.toScreen(P1.x, P1.y)}; });
  await hideToasts(); await p.waitForTimeout(900); await p.screenshot({ path: out('contacts') });
  { const uh = (await p.evaluate(() => window.__im.air.unkHits())).filter(q => q[0] > 200 && q[0] < 900 && q[1] > 200 && q[1] < 800); if (uh.length) sc.loc = [uh[0][0], uh[0][1]]; }
  { const r = await p.evaluate(() => { const b = document.getElementById('map').getBoundingClientRect(); return [b.left, b.top]; }); for (const q of [sc.loc, sc.e1]) if (q){ q[0] += r[0]; q[1] += r[1]; } sc.off = r; }
  if (sc.loc){ await p.mouse.move(sc.loc[0], sc.loc[1]); await p.waitForTimeout(500); await p.screenshot({ path: out('tip-awacs') }); }
  const sc2 = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, c = window.__scnC; const uv = S.armies.find(a => a.id === c.uv); uv.fly = window.__uvFly; const v = im.air.visibleSet(0); const e1 = S.armies.find(a => a.id === c.e1); return {vis:im.air.armyVisible(e1, v), e1:im.toScreen(G.P[c.t1].x, G.P[c.t1].y)}; });
  await p.mouse.move(5, 500); await p.waitForTimeout(700); await p.screenshot({ path: out('uav-identified') });
  { const fh = (await p.evaluate(() => window.__im.air.foeHits())).filter(q => q[0] > 500 && q[0] < 900 && q[1] > 250 && q[1] < 700); if (fh.length){ sc2.e1 = fh[0]; } }
  await p.mouse.move(sc2.e1[0] + sc.off[0], sc2.e1[1] + sc.off[1]); await p.waitForTimeout(500); await p.screenshot({ path: out('tip-uav') });
  console.log('contacts', JSON.stringify({nLoc:sc.nLoc, e1VisibleWithUav:sc2.vis}));
  // 2. UAV wing panel (info panel): recon only, weapons unlock at UAV IV
  await p.evaluate(() => { const im = window.__im, c = window.__scnC; im.selectArmy(c.uv); }); await p.waitForTimeout(300);
  await p.screenshot({ path: out('wing-uav'), clip:{x:960, y:0, width:440, height:880} });
  // 3. recruit cards in a city with Airbase II and Arms Factory II
  await p.evaluate(() => { const im = window.__im, S = im.S, cap = S.nations[0].capital; S.bld[cap].air = 2; S.bld[cap].fac = 2; S.nations[0].cash = 5000; S.nations[0].metal = 2000*RES_K; S.nations[0].oil = 2000*RES_K; im.selectProv(cap);
    const side = document.getElementById('side'); const u = side.querySelector('.units'); if (u) u.scrollIntoView(); });
  await p.waitForTimeout(300); await p.screenshot({ path: out('cards'), clip:{x:960, y:0, width:440, height:880} });
  // 4. guide (unit info panel + counter table)
  await p.evaluate(() => window.__im.air.guide()); await p.waitForTimeout(400); await p.screenshot({ path: out('guide') });
  await p.evaluate(() => { const sh = document.getElementById('sheet'); sh.scrollTop = sh.scrollHeight; }); await p.waitForTimeout(200); await p.screenshot({ path: out('guide2') });
  await p.click('[data-act="resume"]').catch(() => {});
  // 5. close zoom: parked wings of every new type, a jammer in a formation, embarked troops on cargo ships, UAV IV armed art
  const cz = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, cap = S.nations[0].capital; S.nations[0].tech.drone_g3 = 1; S.nations[0].tech.drone_g4 = 1; S.nations[0].tv += 5;
    const P = G.P[cap]; const nb = P.nbs.filter(q => !G.P[q].sea && S.owner[q] === 0);
    const w = (t, n, at) => { const a = im.addArmy(0, at, {[t]:n}); a.air = {base:at, cd:0}; return a; };
    w('drone', 2, cap); im.addArmy(0, nb[0], {jam:3, inf:4, sam:2}); w('bomb', 2, nb[1] ?? cap);
    const sz = G.P.find(q => q.sea && q.nbs.some(v => S.owner[v] === 0) && q.cells.length > 20); const emb = im.addArmy(0, sz.id, {inf:6, tank:3}); emb.at = sz.id;
    const s = 9; im.view.s = s; im.view.x = 700 - P.x*s; im.view.y = 440 - P.y*s;
    return {cap:P.name, sea:sz.id, sx:sz.x, sy:sz.y}; });
  await hideToasts(); await p.waitForTimeout(1200); await p.screenshot({ path: out('closeup') });
  await p.evaluate(c => { const im = window.__im, s = 8; im.view.s = s; im.view.x = 700 - c.sx*s; im.view.y = 440 - c.sy*s; }, cz); await p.waitForTimeout(900); await p.screenshot({ path: out('cargo') });
  // 6. gallery: one parked wing of every new aircraft type on its own province, spaced out, at close zoom (stand-in pictures)
  const gal = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, cap = S.nations[0].capital, P = G.P[cap]; S.armies = S.armies.filter(a => a.owner !== 0 || !a.air);
    const pool = G.P.filter(q => !q.sea && S.owner[q.id] === 0 && Math.hypot(q.x - P.x, q.y - P.y) < 130).sort((x, y) => Math.hypot(x.x - P.x, x.y - P.y) - Math.hypot(y.x - P.x, y.y - P.y)), pick = [];
    for (const q of pool){ if (pick.every(r => Math.hypot(r.x - q.x, r.y - q.y) > 30)) pick.push(q); if (pick.length >= 8) break; }
    ['awacs', 'mpa', 'asf', 'bomb', 'sdrone', 'swarm', 'drone'].forEach((t, i) => { const at = pick[(i + 1) % pick.length].id; const a = im.addArmy(0, at, {[t]:t === 'swarm' ? 6 : 1}); a.air = {base:at, cd:0}; });
    const s = 5.2; im.view.s = s; im.view.x = 600 - P.x*s; im.view.y = 440 - P.y*s; return im.air.ART(); });
  await hideToasts(); await p.waitForTimeout(1000); await p.screenshot({ path: out('gallery') });
  // 7. strikes in flight: an enemy bomber raid and a swarm over the front
  await p.evaluate(r => { const im = window.__im, S = im.S, G = im.G; const w = im.addArmy(0, r.fp, {swarm:12}); w.air = {base:r.fp, cd:0}; im.orderAir(w, r.gp); const b2 = im.addArmy(r.E, r.gcity, {bomb:3}); b2.air = {base:r.gcity, cd:0}; im.orderAir(b2, r.fp);
    const P = G.P[r.fp], s = 4; im.view.s = s; im.view.x = 700 - P.x*s; im.view.y = 440 - P.y*s; im.tick(); }, {fp:R.fp, gp:R.gp, gcity:R.gcity, E:R.E});
  await p.click('#sp1').catch(() => {}); await hideToasts(); await p.waitForTimeout(2500); await p.screenshot({ path: out('flight') });
  console.log('art', JSON.stringify(gal));
  for (const c of R.checks) console.log((c.ok ? 'PASS ' : 'FAIL ') + c.name + (c.ok ? '' : ' :: ' + JSON.stringify(c.info)));
  console.log(JSON.stringify(errs.concat(cons)));
  await b.close(); process.exit(errs.length || R.checks.some(c => !c.ok) ? 1 : 0);
})();
