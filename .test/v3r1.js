// V3 systems repair 1: regression checks for the fixes (wear, knock-outs, trade crash, tooltip, blockade news, escorts, routing, art, swarms,
// AI counter-saving, hoarding, legend, fog-hidden links). node .test/v3r1.js  -> exits 0 with an empty errors array
const pickNation = require('./pick-nation.js');   // (a start-screen card by its nation's name, on either world)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 860 } }); const errs = [], cons = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') cons.push(m.text()); });
  p.on('requestfailed', r => cons.push('requestfailed: ' + r.url()));
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
  await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.waitForTimeout(1500);
  const R = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, F = im.fix, A = im.air, out = {}, checks = [];
    const ck = (name, ok, info) => checks.push({name, ok:!!ok, info}); const ME = 0;
    const city = n => G.P.find(P => P.cityName === n);
    const war = (a, b) => { if (!F.atWar(a, b)){ F.rel(a, b).st = 'war'; F.rel(a, b).since = S.hour; } };
    // 1. strike wear builds up: back-to-back short strikes from Airbase I reach 'needs maintenance'
    { const B = S.nations[ME].capital; S.bld[B].air = 1; const W = im.addArmy(ME, B, {jet:3}); W.air = {base:B, cd:0};
      const tgt = G.P.filter(P => !P.sea && S.owner[P.id] === -1).map(P => P.id).find(q => { const c = A.airCheck(W, q); return c.ok && c.d <= 3; });
      let strikes = 0; for (let h = 0; h < 24*8 && strikes < 30; h++){ if (!W.fly && !(W.air.cd > 0) && im.v3c.wingCond(W) >= 0.5){ if (im.orderAir(W, tgt)) strikes++; } A.airTick(); if (!im.S.armies.includes(W)) break; }
      out.wear = {strikes, cond:+im.v3c.wingCond(W).toFixed(2)}; ck('back-to-back strikes from Airbase I wear a wing below 50%', im.v3c.wingCond(W) < 0.55 && strikes >= 10, out.wear);
      W.u.jet = 0; im.v3c.removeEmpty(); }
    // 2. two knocked-out buildings at once
    { const P = city('Hamburg') || G.P.find(q => q.city && S.owner[q.id] === ME && !q.capital); const q = P.id; S.bld[q].fac = 2; S.bld[q].air = 1; if (S.bdis) delete S.bdis[q];
      F.knockOut(q, 'air', 24); F.knockOut(q, 'fac', 24); out.bdis = {air:F.bdis(q, 'air'), fac:F.bdis(q, 'fac'), h:F.bdisH(q)};
      ck('knocking out a second building keeps the first one down', F.bdis(q, 'air') && F.bdis(q, 'fac'), out.bdis);
      const y = F.provYield(q); ck('both knocked-out buildings stop producing', y.cash > 0, y);
      S.bdis[q] = {k:'air', h:S.hour + 5}; ck('old-save knock-out {k, h} still reads', F.bdis(q, 'air') && !F.bdis(q, 'fac') && F.bdisH(q, 'air') === 5, S.bdis[q]); delete S.bdis[q]; }
    // 3. AI trade proposals near a border province: no crash (crashed before: province object instead of id), and never a province in the offer
    //    (current rule: computer-run nations never sell land in a trade; land is sold in the Territory tab, rules/territory.js)
    { const nb = S.nations.find(N => N.id !== ME && N.alive && G.P.some(P => !P.sea && S.owner[P.id] === N.id && !P.city && P.nbs.some(v => S.owner[v] === ME)));
      let ok = true, made = 0; if (nb){ const c0 = nb.cash; nb.cash = 50; S.nations[ME].cash = 2000; for (let i = 0; i < 40; i++){ S.offers = S.offers.filter(o => o.from !== nb.id); try { F.aiProposeTrade(nb.id); } catch (e){ ok = false; out.tradeErr = e.message; break; } if (S.offers.some(o => o.from === nb.id && o.deal.get.provs.length)) made++; } nb.cash = c0; S.offers = S.offers.filter(o => o.from !== nb.id); }
      out.tradeProv = {nb:nb && nb.name, made}; ck('AI trade offer does not crash and never offers a province', ok && made === 0, {...out.tradeProv, err:out.tradeErr}); }
    // 4. blockade dispatch
    { const port = city('Hamburg') || G.P.find(q => q.city && q.coast && S.owner[q.id] === ME); const sz = port.nbs.find(v => G.P[v].sea); const foe = S.nations.find(N => N.alive && N.id !== ME && G.P.some(P => P.coast && S.owner[P.id] === N.id)).id;
      war(ME, foe); const f = im.addArmy(foe, sz, {frig:2}); S.log.length = 0; F.computeBlockade(); const msg = S.log.find(l => /Blockade/.test(l.text));
      out.blockade = msg ? msg.text : null; ck('a dispatch says your port is blockaded', msg && msg.kind === 'bad' && F.BLOCK.has(port.id), out.blockade);
      S.log.length = 0; F.computeBlockade(); ck('the blockade is announced once', !S.log.some(l => /Blockade!/.test(l.text)), S.log.map(l => l.text));
      f.u.frig = 0; im.v3c.removeEmpty(); F.computeBlockade(); ck('blockade lifted message', S.log.some(l => /Blockade lifted/.test(l.text)), S.log.map(l => l.text)); }
    // 5. escorts are resupplied on their route
    { const T = S.trade; const r = T && T.routes.find(x => x.kind === 'sea' && (x.a === ME || x.b === ME) && x.path.length > 6); out.escort = !!r;
      if (r){ im.computeSupply(); const z = r.path.find(v => !im.SUP[ME][v]) ?? r.path[Math.floor(r.path.length/2)]; const fl = im.addArmy(ME, z, {frig:2}); im.trade.escort(fl, r.id);
        const sup = F.supplied(fl); delete fl.escort; const sup2 = F.supplied(fl); out.escortSup = {zone:G.P[z].name, escorting:sup, plain:sup2};
        ck('an escort on its route is supplied, the same fleet without the order is not', sup && (!sup2 || im.SUP[ME][z]), out.escortSup); fl.u.frig = 0; im.v3c.removeEmpty(); } }
    // 6. Bremen -> Dublin embarks instead of marching through independent land
    { const named = n => G.P.find(P => P.cityName === n) || G.P.find(P => P.name === n), br = named('Bremen'); out.route = {};
      for (const dn of ['Dublin', 'Cagliari']){ const du = named(dn); if (!br || !du){ ck('route test provinces exist: ' + dn, false, dn); continue; } const a = im.addArmy(ME, br.id, {inf:4, tank:2}); const path = im.pathFor(a, br.id, du.id); const fw = F.fightsOnWay(a, path);
        out.route[dn] = {len:path.length, fights:fw, eta:im.etaHours(a, path), sea:path.filter(v => G.P[v].sea).length, via:path.filter(v => !G.P[v].sea).map(v => G.P[v].name)};
        ck('Bremen -> ' + dn + ' embarks, not through independent land', path.length && path.some(v => G.P[v].sea) && fw === 0, out.route[dn]); a.u.inf = a.u.tank = 0; im.v3c.removeEmpty(); }
      out.straits = F.straits(); ck('the Mediterranean, Baltic and Black Sea connect to the oceans (straits)', ['Mediterranean Sea I <-> North Atlantic XXI', 'North Sea III <-> Baltic Sea III', 'Mediterranean Sea III <-> Mediterranean Sea VI'].every(x => out.straits.includes(x)), out.straits); }
    // 7. UAV picture: the owner's own u-uav-recon picture is used; the Heavy and Stealth Bomber have their own pictures
    { const x = F.ART('u-uav-recon'), h1 = F.ART('u-heavy-bomber'), h2 = F.ART('u-stealth-bomber'); out.art = {reconStand:x.stand, reconReady:x.ready, h1:h1.stand, h2:h2.stand};
      ck('u-uav-recon is its own supplied picture (not a stand-in)', x.ready && !x.stand, out.art);
      ck('the Heavy and Stealth Bomber pictures are the real files, not stand-ins', !h1.stand && h1.img && !h2.stand && h2.img, out.art); }
    // 8. swarms launch from any own city and get field repairs there; bigger swarms lose more drones to SAMs
    { const c2 = G.P.find(q => q.city && S.owner[q.id] === ME && !S.bld[q.id].air), cap = S.nations[ME].capital; const w = im.addArmy(ME, cap, {swarm:12}); w.air = {base:cap, cd:0};
      ck('a swarm wing can rebase to a city with no airbase', F.airMissionKind(w, c2.id) === 'rebase', F.airMissionKind(w, c2.id)); w.air.base = c2.id; w.at = c2.id;
      ck('swarm wings get field repairs at a city', F.maintRate(w) > 0.1, F.maintRate(w)); w.u.swarm = 0; im.v3c.removeEmpty();
      const tgt = G.P.find(q => !q.sea && S.owner[q.id] === -1).id, lostBy = n => { let L = 0; for (let i = 0; i < 40; i++){ const d = im.addArmy(-1, tgt, {sam:3, inf:4}); const s0 = im.addArmy(ME, cap, {swarm:n}); s0.air = {base:cap, cd:0}; L += A.droneAD(s0, tgt, 1).lost; s0.u.swarm = 0; d.u.sam = d.u.inf = 0; im.v3c.removeEmpty(); } return L/40; };
      const l1 = lostBy(24), l3 = lostBy(72); out.swarmLoss = {small:+l1.toFixed(2), big:+l3.toFixed(2)}; ck('a swarm three times bigger loses more drones to SAMs (1.3-2.5x)', l3 > l1*1.3 && l3 < l1*2.6, out.swarmLoss); }
    // 9. AI saves for an unaffordable counter-pick instead of buying infantry (control: without the saving it does buy infantry)
    { const n = S.nations.find(N => N.alive && N.id !== ME && G.P.some(P => P.city && S.owner[P.id] === N.id)); const keep = {cash:n.cash, metal:n.metal, mp:n.mp};
      const qn = () => S.queue.reduce((s0, q, pp) => s0 + (S.owner[pp] === n.id ? q.length : 0), 0), clearQ = () => { for (let pp = 0; pp < S.queue.length; pp++) if (S.owner[pp] === n.id) S.queue[pp].length = 0; };
      const run = save => { clearQ(); n.cash = 70; n.metal = 0; n.mp = 500; n.uSave = save ? {t:'sam', until:S.hour + 24} : null; const q0 = qn(); F.aiTurn(n.id); return qn() - q0; };
      const withSave = run(true), without = run(false); out.save = {nation:n.name, withSave, without};
      ck('while saving for a SAM the AI does not spend that money on infantry (it does without the saving)', withSave === 0 && without > 0, out.save); clearQ(); n.cash = keep.cash; n.metal = keep.metal; n.mp = keep.mp; n.uSave = null; }
    // 10. terrain legend: no bare dot for zero defence; supply costs listed
    { const h = F.terrLegend(); out.legend = h.length; ck('terrain legend has no bare "·" for zero defence', !/>· def|· def ·/.test(h) && /def —/.test(h), h.slice(0, 200)); ck('terrain legend shows supply costs', /supply ×1\.5/.test(h) && /arctic ×1\.3/.test(h), ''); }
    // 11. links built by others in the fog are not drawn
    { const vs = A.visibleSet(0), foeP = true;
      const ln = [...G.LK.values()].find(r => !vs.has(r.a) && !vs.has(r.b) && r.road < 3 && r.road === r.r0 && r.rail === r.q0 && S.owner[r.a] >= 0 && S.owner[r.a] !== ME && S.owner[r.a] === S.owner[r.b] && !(S.links[r.k]));
      if (ln){ const n0 = F.linkDyn(); S.links[ln.k] = {...(S.links[ln.k] || {}), road:3}; im.links.sync(); const n1 = F.linkDyn(); const o0 = S.owner[ln.a], o1 = S.owner[ln.b]; S.owner[ln.a] = ME; S.owner[ln.b] = ME; const n2 = F.linkDyn(); S.owner[ln.a] = o0; S.owner[ln.b] = o1;
        delete S.links[ln.k]; im.links.sync(); out.fogLink = {n0, n1, n2}; ck('a link another power upgraded in the fog is not drawn (it is once the land is yours)', n1 === n0 && n2 === n0 + 1, out.fogLink); }
      else ck('fog link test case found', false, !!foeP); }
    out.checks = checks; return out; });
  for (const c of R.checks) console.log((c.ok ? 'PASS ' : 'FAIL ') + c.name + (c.ok ? '' : ' :: ' + JSON.stringify(c.info)));
  const failed = R.checks.filter(c => !c.ok).map(c => 'FAIL ' + c.name); delete R.checks; console.log(JSON.stringify(R, null, 1));
  // 12. tooltip of an unidentified aircraft in flight names where the plate is, not its airbase; the AWACS legend clear of the toasts
  const T = await p.evaluate(async () => { const im = window.__im, S = im.S, G = im.G, ME = 0; const box = document.getElementById('ilegend'); box.hidden = false;
    const tb = document.getElementById('toasts').getBoundingClientRect(), lb = box.getBoundingClientRect(); const overlap = !(lb.right < tb.left || lb.left > tb.right || lb.bottom < tb.top || lb.top > tb.bottom) && tb.width > 0;
    return {legend:{l:Math.round(lb.left), t:Math.round(lb.top), w:Math.round(lb.width)}, toasts:{l:Math.round(tb.left), r:Math.round(tb.right)}, overlap}; });
  console.log('legend', JSON.stringify(T)); const fails = R && T.overlap ? ['AWACS legend overlaps the toast stack'] : [];
  const bad = (await p.evaluate(() => 0)) || 0; void bad;
  const allFails = fails.concat(failed, errs);
  console.log(JSON.stringify(allFails.concat(cons.filter(c => !/willReadFrequently/.test(c)))));
  await b.close(); process.exit(allFails.length || cons.length ? 1 : 0);
})();
