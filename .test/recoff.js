// Recruiting Office levels I-V: node .test/recoff.js  (run tools/mkpage.sh first).
// Costs and build times per level, manpower per level, faster training for every unit in the city, the 30% floor, queued units sped up when a level
// completes, saves, the AI's upgrade rule, and the wording in the building tooltip and the Mobilize panel.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, hasTouch: true });
  const p = await ctx.newPage(); const errors = [], checks = [];
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const ok = (name, v, info) => { checks.push({ name, ok: !!v, ...(v ? {} : { info }) }); };
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(600);
  const idx = await p.evaluate(() => { const r = [...document.querySelectorAll('[data-act="pick"]')].find(x => /Russia/i.test(x.textContent)); return r.dataset.p; });
  await p.click(`[data-act="pick"][data-p="${idx}"]`); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.waitForTimeout(1200);
  /* global S, G, BUILD, UNITS, UT, buildCost, build, consHour, trainH, trainF, recMp, recPct, recSpeed, provYield, recruit, saveJSON, restore, aiRecSlow, aiRecSite, canMobilize, TRAIN_MIN */
  const r = await p.evaluate(() => { const o = {}, N = S.nations[0], cap = N.capital, B = S.bld[cap]; S.speed = 0; N.doc = null;
    const keep = {...B};
    o.max = BUILD.rec.max; o.cost = [1, 2, 3, 4, 5].map(l => buildCost(0, 'rec', l, cap));
    o.mp = [0, 1, 2, 3, 4, 5].map(l => recMp(l)); o.pct = [0, 1, 2, 3, 4, 5].map(l => recPct(l));
    // manpower of the city by level (the same morale and season for all)
    o.y = [0, 1, 2, 3, 4, 5].map(l => { B.rec = l; return provYield(cap).mp; }); B.rec = 1;
    // training hours by level, no factory: infantry (24 h) and a tank
    B.fac = 0; o.inf = [0, 1, 2, 3, 4, 5].map(l => { B.rec = l; return trainH(cap, 'inf', 0); }); o.tank = [0, 1, 2, 3, 4, 5].map(l => { B.rec = l; return trainH(cap, 'tank', 0); }); o.base = {inf:UNITS.inf.build, tank:UNITS.tank.build};
    // stacking with the Army Base: they multiply (Base I 0.8 x Office II 0.8 = 0.64)
    B.fac = 1; B.rec = 2; o.stack = trainF(cap, 'tank');
    // the floor: every unit, every level of every building, every doctrine: never under 30% of the base time
    let worst = 9, bad = [];
    for (const doc of [null, 'precision', 'mass', 'bastion']){ N.doc = doc;
      for (let f = 0; f <= 5; f++) for (let a = 0; a <= 5; a++) for (let y = 0; y <= 5; y += 5) for (let l = 0; l <= 5; l++){ B.fac = f; B.air = a; B.yard = y; B.rec = l;
        for (const t of UT){ const h = trainH(cap, t, 0), lo = UNITS[t].build*TRAIN_MIN; worst = Math.min(worst, h/UNITS[t].build); if (h < Math.round(lo) || h < lo - 0.5) bad.push([doc, f, a, y, l, t, h]); } } }
    N.doc = null; o.worst = worst; o.bad = bad.slice(0, 5); o.min = TRAIN_MIN;
    B.fac = 5; B.rec = 5; B.air = 0; B.yard = 0; o.floorTank = trainH(cap, 'tank', 0); B.fac = 5; B.rec = 0; o.fac5Tank = trainH(cap, 'tank', 0);
    Object.assign(B, keep);
    // ---- a level completes: units queued or in training get their remaining time cut by the new ratio at once
    B.fac = 0; B.rec = 1; S.queue[cap].length = 0; S.cons[cap] = null; N.cash = 5000; N.mp = 500; N.metal = 500; N.iron = 500; N.elec = 500;
    recruit(0, cap, 'inf'); recruit(0, cap, 'inf'); recruit(0, cap, 'at'); S.queue[cap].push({t:'cm', h:36, h0:36, msl:true});
    S.queue[cap][0].h = 15;   // the first one is part trained
    o.q0 = S.queue[cap].map(it => [it.t, it.h, it.h0]);
    const c0 = {cash:N.cash, metal:N.metal};
    o.built = build(0, cap, 'rec'); o.cons = S.cons[cap] && {...S.cons[cap]}; o.paid = {cash:c0.cash - N.cash, metal:c0.metal - N.metal};
    S.cons[cap].h = 1; consHour(cap); o.lvl = B.rec; o.q1 = S.queue[cap].map(it => [it.t, it.h, it.h0]); o.consAfter = S.cons[cap];
    o.newInf = trainH(cap, 'inf', 0);
    // at the floor already: nothing changes
    B.fac = 5; B.rec = 4; S.queue[cap].length = 0; recruit(0, cap, 'tank'); const hF = S.queue[cap][0].h; S.cons[cap] = {k:'rec', lvl:5, h:1, h0:144}; consHour(cap); o.floorKeep = [hF, S.queue[cap][0].h, B.rec];
    // another building finishing does not retime
    B.fac = 0; B.rec = 2; S.queue[cap].length = 0; recruit(0, cap, 'inf'); const h2 = S.queue[cap][0].h; S.cons[cap] = {k:'fort', lvl:1, h:1, h0:48}; consHour(cap); o.other = [h2, S.queue[cap][0].h];
    // max level: no sixth
    B.rec = 5; S.cons[cap] = null; o.sixth = build(0, cap, 'rec');
    // infantry still needs level I
    B.rec = 0; o.need = canMobilize(0, cap, 'inf'); B.rec = 3; o.need3 = canMobilize(0, cap, 'inf');
    // saves: the level is kept; an office from an old save (level 1) stays level 1
    B.rec = 3; S.queue[cap].length = 0; const js = saveJSON(); o.saveHas = typeof js === 'string';
    Object.assign(B, keep); S.queue[cap].length = 0; S.cons[cap] = null;
    return o; });
  ok('five levels', r.max === 5, r.max);
  const want = [{cash:40, metal:0, iron:0, elec:0, h:48}, {cash:75, metal:10, iron:0, elec:0, h:72}, {cash:130, metal:20, iron:10, elec:0, h:96}, {cash:220, metal:35, iron:20, elec:0, h:120}, {cash:360, metal:55, iron:30, elec:15, h:144}];
  ok('costs and build times per level', JSON.stringify(r.cost) === JSON.stringify(want), r.cost);
  ok('manpower +3k / +4.5k / +6k / +7.5k / +9k a day', JSON.stringify(r.mp) === '[0,3,4.5,6,7.5,9]' && JSON.stringify(r.pct) === '[0,10,20,30,40,50]', r);
  { const d = r.y.map(v => v - r.y[0]), u = d[1]/3; ok('the city really yields that much more manpower by level', u > 0 && d.every((v, i) => Math.abs(v - r.mp[i]*u) < 1e-6), r.y); }
  ok('training 10% faster per level (infantry 24 h: 22, 19, 17, 14, 12)', JSON.stringify(r.inf) === JSON.stringify([0, 1, 2, 3, 4, 5].map(l => Math.round(r.base.inf*(1 - 0.1*l)))) && r.inf[5] === 12, r.inf);
  ok('every unit trained there, not only infantry (tank)', JSON.stringify(r.tank) === JSON.stringify([0, 1, 2, 3, 4, 5].map(l => Math.round(r.base.tank*(1 - 0.1*l)))), r.tank);
  ok('Army Base and Recruiting Office multiply', Math.abs(r.stack - 0.64) < 1e-9, r.stack);
  ok('no unit ever trains under 30% of its base time (all buildings, levels, doctrines)', r.bad.length === 0 && r.worst >= 0.29 && r.min === 0.3, { worst: r.worst, bad: r.bad });
  ok('Army Base V + Office V tank sits at the floor', r.floorTank === Math.round(r.base.tank*0.3) && r.fac5Tank === Math.round(r.base.tank*0.3), r);
  ok('upgrade to II: paid $75M + 10 materials, 3 days', r.built === true && r.cons.k === 'rec' && r.cons.lvl === 2 && r.cons.h === 72 && r.paid.cash === 75 && r.paid.metal === 10, r);
  { const f = 0.8/0.9, exp = r.q0.map(([t, h, h0]) => t === 'cm' ? [t, h, h0] : [t, Math.max(1, Math.round(h*f)), Math.round(h0*f)]);
    ok('level done: remaining time of the unit in training and the queued ones cut by the new ratio (a missile is not a unit)', r.lvl === 2 && r.consAfter === null && JSON.stringify(r.q1) === JSON.stringify(exp) && r.q1[0][1] < r.q0[0][1] && r.q1[1][1] < r.q0[1][1] && Math.abs(r.q1[1][1] - r.newInf) <= 1, { q0: r.q0, q1: r.q1, exp }); }
  ok('already at the 30% floor: the level changes nothing', r.floorKeep[0] === r.floorKeep[1] && r.floorKeep[2] === 5, r.floorKeep);
  ok('another building finishing leaves the queue alone', r.other[0] === r.other[1], r.other);
  ok('no level VI; infantry needs level I (any level will do)', r.sixth === false && r.need === 'Build a Recruiting Office first' && r.need3 === '', r);
  // ---- the whole thing through real game hours: queue, upgrade, watch the units come out sooner
  const flow = await p.evaluate(() => { const im = window.__im, N = S.nations[0], cap = N.capital, B = S.bld[cap]; B.fac = 0; B.rec = 1; S.queue[cap].length = 0; S.cons[cap] = null; N.cash = 5000; N.mp = 500; N.metal = 500;
    for (let i = 0; i < 3; i++) recruit(0, cap, 'inf'); const before = S.queue[cap].map(it => it.h); build(0, cap, 'rec'); S.cons[cap].h = 3;
    const seen = []; for (let i = 0; i < 4; i++){ im.tick(); seen.push([B.rec, S.queue[cap].map(it => it.h)]); } S.speed = 0;
    const o = {before, seen}; S.queue[cap].length = 0; return o; });
  { const s = flow.seen, b0 = flow.before[1];   // the second tank waits in the queue (one line): its hours only change when the level lands
    ok('in play: queued units keep their time until the level lands, then drop to the new time', s[1][0] === 1 && s[1][1][1] === b0 && s[2][0] === 2 && s[2][1][1] === Math.round(b0*0.8/0.9) && s[2][1][0] < s[1][1][0] - 1, flow); }
  // ---- saves
  const sv = await p.evaluate(() => { const N = S.nations[0], cap = N.capital; S.bld[cap].rec = 4; const js = saveJSON(); const o = JSON.parse(js);
    const others = S.nations.filter(M => M.alive && M.id).map(M => S.bld[M.capital].rec);
    S.bld[cap].rec = 1; restore(JSON.parse(js)); const a = S.bld[S.nations[0].capital].rec;
    // an old save: offices are plain 1s (there was only one level); nothing else to migrate
    const old = JSON.parse(js); old.bld[cap].rec = 1; restore(old); const b2 = S.bld[S.nations[0].capital].rec, t1 = trainH(S.nations[0].capital, 'inf', 0) <= Math.round(24*0.9);
    S.speed = 0; return {a, b2, t1, others:others.every(l => l === 1), keys:Object.keys(o).length}; });
  ok('saves keep the level; an old save\'s office is level I and gives the level I bonus', sv.a === 4 && sv.b2 === 1 && sv.t1 && sv.others, sv);
  // ---- AI: upgrades only when manpower or training speed limits it
  const ai = await p.evaluate(() => { const n = S.nations.find(M => M.alive && M.id && M.ai !== false).id, N = S.nations[n], cap = N.capital, B = S.bld[cap], o = {};
    const wars = warsOf(n).length; N.cash = 2000; S.queue[cap].length = 0; S.cons[cap] = null; B.rec = 1;
    o.peaceIdle = aiRecSlow(n, cap); S.queue[cap].push({t:'inf', h:20, h0:20}, {t:'inf', h:20, h0:20}); o.peaceFull = wars ? null : aiRecSlow(n, cap);
    const m = S.nations.find(M => M.alive && M.id !== n && M.id).id; setRel(n, m, 'war'); o.war = warsOf(n).length > 0; o.warFull = aiRecSlow(n, cap);
    N.cash = 200; o.warPoor = aiRecSlow(n, cap); N.cash = 2000; S.queue[cap].length = 1; o.warShort = aiRecSlow(n, cap); B.rec = 5; S.queue[cap].push({t:'inf', h:20, h0:20}); o.warMax = aiRecSlow(n, cap); B.rec = 1; S.queue[cap].length = 0;
    const site = aiRecSite(n); o.site = site >= 0 ? S.bld[site].rec || 0 : -1; o.hasEmpty = G.P.some(P => S.owner[P.id] === n && !S.cons[P.id] && !P.sea && !S.bld[P.id].rec);
    return o; });
  ok('AI: no upgrade at peace or with a short queue or without spare money or at the top level; upgrades when a full queue at war holds it back', ai.peaceIdle === false && (ai.peaceFull === null || ai.peaceFull === false) && ai.war && ai.warFull === true && ai.warPoor === false && ai.warShort === false && ai.warMax === false, ai);
  ok('AI short of manpower: a new office before any upgrade', ai.hasEmpty ? ai.site === 0 : ai.site >= 1, ai);
  // ---- wording: building tooltip, build list, Mobilize panel header, times in the Mobilize list
  const cap = await p.evaluate(() => { const N = S.nations[0], cap = N.capital; S.bld[cap].rec = 3; S.bld[cap].fac = 0; S.queue[cap].length = 0; S.cons[cap] = null; window.__im.selectProv(cap); return cap; }); await p.waitForTimeout(500);
  const T3 = 'Recruiting Office III: needed to mobilize infantry here. 30% faster training and +6k manpower a day in this city. Next level: 40% faster, +7.5k/day.';
  const u1 = await p.evaluate(() => { const c = [...document.querySelectorAll('#csheet .cs-c')].find(e => /Recruiting Office/.test(e.textContent)); return {ttl:c && c.getAttribute('title'), lv:c && c.querySelector('.cs-lvb') && c.querySelector('.cs-lvb').textContent, img:c && c.querySelector('.cs-ci').getAttribute('style')}; });
  ok('city sheet: the building card tooltip says the bonus and the next level', u1.ttl && u1.ttl.includes(T3) && u1.lv === '3', u1);
  await p.click('#csheet [data-act="cs-mob"]'); await p.waitForTimeout(400);
  const u2 = await p.evaluate(() => { const h = document.querySelector('#sheet .rs-rec'), c = document.querySelector('#sheet .unit[data-t="inf"] .st'), r = h && h.getBoundingClientRect(), eb = document.querySelector('#sheet .eyebrow .rec-b');
    return {head:h && h.textContent, vis:!!r && r.width > 20 && r.height > 5 && r.right <= innerWidth + 1, st:c && c.textContent, dup:!!eb && eb.offsetParent !== null, exp:+(trainH(S.nations[0].capital, 'inf', 0)/24).toFixed(1), h:trainH(S.nations[0].capital, 'inf', 0)}; });
  ok('Mobilize panel header: Recruiting Office: 30% faster training', u2.head === 'Recruiting Office: 30% faster training' && u2.vis && !u2.dup, u2);
  ok('Mobilize list times include the bonus (infantry 17 h = 0.7 d)', u2.h === 17 && u2.st && u2.st.includes(u2.exp + ' d'), u2);
  await p.screenshot({ path: __dirname + '/recoff-mob.png' });
  await p.click('#sheet [data-act="resume"]'); await p.waitForTimeout(250);
  await p.click('#csheet [data-act="cs-bld"]'); await p.waitForTimeout(400);
  const u3 = await p.evaluate(() => { const row = document.querySelector('#sheet .bld[data-bk="rec"]'); return {ds:row && row.querySelector('.ds').textContent, lv:row && row.querySelector('.lv').textContent, btn:row && row.querySelector('button') && row.querySelector('button').textContent.replace(/\s+/g, ' '), head:!!document.querySelector('#sheet .rs-rec')}; });
  ok('Build panel: level III/V, the same sentence, the next level priced $220M, 5 d', u3.ds === T3 && /Level III\/V/.test(u3.lv) && /Upgrade · 5 d/.test(u3.btn) && /220/.test(u3.btn) && !u3.head, u3);
  await p.screenshot({ path: __dirname + '/recoff-bld.png' });
  await p.click('#sheet [data-act="resume"]'); await p.waitForTimeout(200);
  // level V and no office, read from the panel itself
  const u5 = await p.evaluate(async () => { const cap = S.nations[0].capital, out = {}, other = G.P.find(P => S.owner[P.id] === 0 && P.id !== cap && !P.sea).id; for (const l of [5, 0, 1]){ S.bld[cap].rec = l; window.__im.selectProv(other); await new Promise(r => setTimeout(r, 120)); window.__im.selectProv(cap); await new Promise(r => setTimeout(r, 250));
      const c = [...document.querySelectorAll('#csheet .cs-c')].find(e => /Recruiting Office/.test(e.textContent)); out[l] = c ? c.getAttribute('title') : null; } return out; });
  ok('level V says highest level; no office says what level I gives; level I matches', /Recruiting Office V: needed to mobilize infantry here\. 50% faster training and \+9k manpower a day in this city\. Highest level\./.test(u5[5]) && /Level I: every unit trained in this city trains 10% faster and the city gives \+3k manpower a day/.test(u5[0]) && /Recruiting Office I: needed to mobilize infantry here\. 10% faster training and \+3k manpower a day in this city\. Next level: 20% faster, \+4\.5k\/day\./.test(u5[1]), u5);
  const failed = checks.filter(c => !c.ok);
  console.log(JSON.stringify({ checks: checks.length, failed, errors }, null, 1));
  await b.close(); process.exit(failed.length || errors.length ? 1 : 0);
})();
