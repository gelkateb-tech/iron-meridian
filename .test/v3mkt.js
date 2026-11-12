// V3 repair 3: the AI surplus sale unloads a hoard without flooding the world market; manned specialists keep a quota under the aircraft cap.
// V3 UI step 4: a real hoard (over 1,000) of a cash-poor power sells up to 90 a day down to 0.5-0.6x the base price; an ordinary surplus keeps the 0.8x floor.
// node .test/v3mkt.js  (exits 1 on any failed check or page error)
const pickNation = require('./pick-nation.js');   // (a start-screen card by its nation's name, on either world)
const { chromium } = require('playwright');
const fails = [], ok = (c, m, extra) => { if (!c) fails.push(m + (extra !== undefined ? ' ' + JSON.stringify(extra) : '')); };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 800 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(400);
  await pickNation(p, 'United States'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.click('#sp0');

  const r = await p.evaluate(() => { const im = window.__im, S = im.S, ru = S.nations.findIndex(N => N.name === 'Russia'), N = S.nations[ru], M = S.mkt || (im.tick(), S.mkt), out = {K:RES_K}, g = o => { for (const k in o) if (k !== 'cash') o[k] *= RES_K; return o; };   // (stocks written in the old units, scaled to RES_K; sales are counted in lots of MKT_LOT, the old units)
    const base = {oil:3.2, metal:2.4, iron:2.2, elec:4.2, rare:6.5}, reset = () => { for (const k in base){ M.p[k] = base[k]; M.press[k] = 0; } N.sold = 0; N.sellD = Math.floor(S.hour/24); N.mHoard = 0; };
    // market sales show as negative market pressure (each trade adds qty/1500); buildings and units also use stock, so stock deltas are not the sale
    const run = (k0, n) => { const pr0 = {...M.press}; for (let i = 0; i < n; i++){ N.cash = 100; im.fix.aiTurn(ru); } const sold = k => Math.round(Math.max(0, -(M.press[k] - pr0[k])*1500)); return {oil:sold('oil'), metal:sold('metal'), iron:sold('iron'), elec:sold('elec'), rare:sold('rare'), sold:N.sold, p:{...M.p}}; };
    // 1. a metal hoard: metal is sold, at most the daily cap, oil, iron, electronics and rare materials untouched
    reset(); Object.assign(N, g({metal:3000, oil:150, iron:150, elec:150, rare:150})); out.metal = run('metal', 12);
    // 2. every resource hoarded: only one resource a day, still within the cap
    reset(); Object.assign(N, g({metal:3000, oil:3000, iron:3000, elec:3000, rare:3000})); out.all = run('all', 12);
    // 3. a depressed price: nothing is sold below 0.9x the base price
    reset(); Object.assign(N, g({metal:3000, oil:150, iron:150, elec:150, rare:150})); M.p.metal = base.metal*0.75; out.low = run('low', 12);
    reset(); Object.assign(N, g({metal:3000, oil:150, iron:150, elec:150, rare:150})); M.p.metal = base.metal*0.45; out.floor = run('floor', 12);
    reset(); Object.assign(N, g({metal:900, oil:150, iron:150, elec:150, rare:150})); M.p.metal = base.metal*0.75; out.surplus = run('surplus', 12);
    // 3b. oil and the other goods are not sold on the world market (a stock near the storage cap is listed on the order book instead)
    const cap = Math.floor(400 + 15*S.owner.filter(o => o === ru).length);
    reset(); Object.assign(N, g({metal:150, oil:Math.min(2000, cap*0.6), iron:Math.min(2000, cap*0.6), elec:Math.min(2000, cap*0.6), rare:Math.min(2000, cap*0.6)})); out.midOil = run('midOil', 12);
    reset(); Object.assign(N, g({metal:150, oil:cap - 5, iron:150, elec:150, rare:150})); M.p.oil = base.oil*1.2; out.capOil = run('capOil', 12);

    // 4. the next day the sale goes on
    reset(); Object.assign(N, g({metal:3000, oil:150, iron:150, elec:150, rare:150})); run('d1', 6); S.hour += 24; const d2 = run('d2', 6); out.nextDay = d2;
    // 5. rich powers do not sell
    reset(); Object.assign(N, g({metal:3000, oil:3000, iron:3000, elec:3000, rare:3000})); const pr0 = M.press.metal + M.press.oil + M.press.iron + M.press.elec + M.press.rare; N.cash = 900; im.fix.aiTurn(ru); out.rich = Math.round(-(M.press.metal + M.press.oil + M.press.iron + M.press.elec + M.press.rare - pr0)*1500);
    return out; });
  console.log('sale', JSON.stringify(r));
  ok(r.metal.metal > 0 && r.metal.metal <= 90.5 && r.metal.oil <= 0 && r.metal.iron <= 0 && r.metal.elec <= 0 && r.metal.rare <= 0, 'a metal hoard is sold within the daily cap, nothing else', r.metal);
  ok(r.metal.p.metal >= 2.4*0.8 - 0.01, 'the sale does not push metal below 0.8x base', r.metal.p);
  const soldK = ['oil', 'metal', 'iron', 'elec', 'rare'].filter(k => r.all[k] > 0);
  ok(soldK.join() === 'metal' && r.all.sold <= 90.5*r.K, 'only metal is sold on the world market, within the cap', r.all);
  ok(r.low.metal > 0, 'a real hoard still sells at 0.75x the base price', r.low);
  ok(r.floor.metal <= 0, 'no hoard sale below 0.5x the base price', r.floor);
  ok(r.surplus.metal <= 0, 'an ordinary surplus is not sold below 0.8x the base price', r.surplus);
  ok(r.midOil.oil <= 0 && r.midOil.iron <= 0 && r.midOil.elec <= 0 && r.midOil.rare <= 0, 'oil and other stocks well below the storage cap are kept', r.midOil);
  ok(r.capOil.oil <= 0, 'oil is never dumped on the world market, even at the storage cap', r.capOil);
  ok(r.nextDay.metal > 0, 'the sale resumes the next day', r.nextDay);
  ok(r.rich <= 0, 'a power with money does not sell its stock', r.rich);

  // the aircraft cap: a power full of strike jets that is being bombed still picks air-superiority fighters (and AWACS) at an Airbase II
  const a = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, cn = S.nations.findIndex(N => N.name === 'China'), jp = S.nations.findIndex(N => N.name === 'Japan'), N = S.nations[cn], g = o => { for (const k in o) if (k !== 'cash') o[k] *= RES_K; return o; };
    for (const id of ['u_jet', 'u_int', 'jet_pgm', 'int_msl', 'u_asf', 'u_awacs', 'u_bomb', 'u_mpa']) N.tech[id] = 1; N.cash = 300;
    const P = G.P.find(q => S.owner[q.id] === cn && q.city); S.bld[P.id].air = 2; S.bld[P.id].fac = Math.max(1, S.bld[P.id].fac || 0); S.bld[P.id].rec = 1;   /* infantry needs a Recruiting Office (mobilization rule) */
    if (!im.fix.atWar(cn, jp)) S.rel[[cn, jp].sort((x, y) => x - y).join(',')] = {st:'war', since:S.hour, until:null};
    // the wing is a stand-in counted by the pick (not a flying wing): it is removed before the next tick
    let wing = null; const tally = u => { if (wing) S.armies = S.armies.filter(x => x !== wing); im.tick(); wing = im.addArmy(cn, P.id, u); wing.air = true;
      // stocks for the heavy aircraft (AWACS and ASF need electronics and rare materials; without them the pick is a coin toss), and a fixed random stream
      (S.airHit || (S.airHit = {}))[cn] = {drone:0, bomb:3, air:1}; Object.assign(N, g({cash:300, oil:600, metal:600, iron:600, elec:800, rare:400})); S.rs = 20261106;
      const c = {}; for (let i = 0; i < 600; i++){ const t = im.aiPickUnit(cn, P.id); c[t] = (c[t] || 0) + 1; } return c; };
    const c1 = tally({jet:150, int:50}), c2 = tally({jet:150, int:50, asf:6, awacs:1}); S.armies = S.armies.filter(x => x !== wing);
    return {c1, c2}; });
  console.log('picks', JSON.stringify(a));
  ok((a.a = (a.c1.asf || 0)) >= 60, 'bombed power over the manned cap still builds ASF', a.c1);
  ok((a.c1.asf || 0) > (a.c1.int || 0), 'ASF are the first answer to bombers', a.c1);
  ok((a.c1.awacs || 0) >= 5, 'an AWACS is wanted while none flies', a.c1);
  ok((a.c2.asf || 0) < (a.c1.asf || 0)*0.6 && !(a.c2.awacs > 3), 'the cap applies again once the quota is met', a.c2);

  console.log(JSON.stringify(errs)); console.log(fails.length ? 'FAILS:\n' + fails.join('\n') : 'ALL OK');
  await b.close(); process.exit(fails.length || errs.length ? 1 : 0);
})();
