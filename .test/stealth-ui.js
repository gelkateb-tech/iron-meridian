// Stealth Bomber in the page: research tree (bomb2, bomb3 with two prerequisites), Mobilize list, unit guide, a wing's mission panel,
// and the fog rule on the map (an enemy stealth wing in flight is drawn only near your SAMs / jammers; AWACS gives a '?' at half range).
//   node .test/stealth-ui.js   (bash tools/mkpage.sh first; screenshots .test/stealth-*.png; exits 1 on a failed check or a page error)
const { chromium } = require('playwright');
const out = n => __dirname + '/stealth-' + n + '.png';
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 900 } }); const errs = [], checks = [];
  const ck = (name, ok, info) => checks.push({ name, ok: !!ok, info });
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
  await p.click('[data-act="pick"][data-p="4"]'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.waitForTimeout(900);
  // ---- research: the Air branch
  await p.evaluate(() => { const S = window.__im.S, N = S.nations[0]; for (const k of ['cash', 'oil', 'metal', 'iron', 'elec', 'rare', 'mp']) N[k] = 5000; for (const id of ['air1', 'air2', 'bomb1']) N.tech[id] = 1; N.tv = (N.tv || 0) + 1; N.research = N.research2 = null; });
  await p.click('[data-act="research-open"]'); await p.waitForTimeout(300); await p.click('[data-act="rbranch"][data-b="Air"]'); await p.waitForTimeout(300);
  const node = id => p.evaluate(id => { const e = document.querySelector(`.rnode[data-id="${id}"]`); return e ? { cls: e.className, title: e.title, text: e.innerText.replace(/\s+/g, ' ').trim(), row: getComputedStyle(e).getPropertyValue('--r').trim() } : null; }, id);
  let n2 = await node('bomb2'), n3 = await node('bomb3'), a3 = await node('air3');
  ck('tree: Strategic Bomber Upgrade is open after Strategic Bombers', n2 && /st-open/.test(n2.cls), n2);
  ck('tree: Stealth Bombers is locked and names both prerequisites', n3 && /st-lock/.test(n3.cls) && /Needs Strategic Bomber Upgrade and Stealth Airframes/.test(n3.title) && /and Stealth Airframes/.test(n3.text), n3);
  ck('tree: Stealth Bombers sits below both of its prerequisites', n3 && a3 && n2 && +n3.row > +a3.row && +n3.row > +n2.row, [n2 && n2.row, a3 && a3.row, n3 && n3.row]);
  const lines = await p.evaluate(() => document.querySelectorAll('.rs-lines path').length), techN = await p.evaluate(() => document.querySelectorAll('.rnode').length);
  ck('tree: one more line than a single-prerequisite tree would draw', lines >= techN - 4, [lines, techN]);
  await p.click('.rnode[data-id="bomb3"]'); await p.waitForTimeout(250);
  const det = await p.evaluate(() => ({ req: [...document.querySelectorAll('.rs-det .rs-dr')].map(e => e.innerText.trim()), btn: (document.querySelector('.rs-det .rs-db') || {}).innerText }));
  ck('detail: two "Requires" lines and a disabled button that says why', det.req.length === 2 && /Strategic Bomber Upgrade/.test(det.req[0]) && /Stealth Airframes/.test(det.req[1]) && /needs/i.test(det.btn || ''), det);
  await p.screenshot({ path: out('tree-locked') });
  await p.evaluate(() => { const N = window.__im.S.nations[0]; N.tech.bomb2 = 1; N.tech.air3 = 1; N.tv++; });
  await p.click('.rnode[data-id="bomb2"]'); await p.waitForTimeout(150); await p.click('.rnode[data-id="bomb3"]'); await p.waitForTimeout(250);
  n3 = await node('bomb3'); ck('tree: with both researched Stealth Bombers opens', n3 && /st-open/.test(n3.cls), n3);
  const btn = await p.evaluate(() => { const e = document.querySelector('.rs-det [data-act="research"]'); return e ? { dis: e.disabled, text: e.innerText.replace(/\s+/g, ' ') } : null; });
  ck('detail: the Research button is live (11 days)', btn && !btn.dis && /11 d/.test(btn.text), btn);
  await p.screenshot({ path: out('tree-open') });
  await p.click('.rs-det [data-act="research"]'); await p.waitForTimeout(250);
  ck('research starts in a slot', await p.evaluate(() => { const N = window.__im.S.nations[0]; return [N.research, N.research2].some(r => r && r.id === 'bomb3'); }));
  await p.evaluate(() => { const N = window.__im.S.nations[0]; N.research = N.research2 = null; N.tech.bomb3 = 1; N.tv++; });
  await p.click('#sheet [data-act="resume"]').catch(() => {}); await p.waitForTimeout(200);
  // ---- Mobilize list in the capital: greyed with Airbase II, live with Airbase III
  const cap = await p.evaluate(() => { const im = window.__im, S = im.S, c = S.nations[0].capital; S.bld[c].air = 2; S.bld[c].fac = Math.max(1, S.bld[c].fac); im.selectProv(c); return c; });
  await p.waitForTimeout(300); await p.click('#csheet [data-act="cs-mob"]'); await p.waitForTimeout(400);
  const card = () => p.evaluate(() => { const e = document.querySelector('#sheet .unit[data-t="stealth"]'); return e ? { cls: e.className, title: e.title, text: e.innerText.replace(/\s+/g, ' ').trim(), pic: !!e.querySelector('.ut') } : null; });
  let c1 = await card(); ck('Mobilize: the Stealth Bomber is listed, blocked: needs Airbase III', c1 && /blk/.test(c1.cls) && /Airbase III/.test(c1.title + c1.text) && c1.pic, c1);
  await p.screenshot({ path: out('mobilize-blocked') });
  await p.click('#sheet [data-act="resume"]').catch(() => {}); await p.waitForTimeout(150);
  await p.evaluate(c => { const im = window.__im; im.S.bld[c].air = 3; im.selectProv(c); }, cap); await p.waitForTimeout(250);
  await p.click('#csheet [data-act="cs-mob"]'); await p.waitForTimeout(400);
  c1 = await card(); ck('Mobilize: with Airbase III it can be ordered; the tooltip explains it', c1 && !/blk/.test(c1.cls) && /35% as often/.test(c1.title) && /330/.test(c1.text), c1);
  await p.hover('#sheet .unit[data-t="stealth"]'); await p.waitForTimeout(500); await p.screenshot({ path: out('mobilize') });
  await p.click('#sheet .unit[data-t="stealth"]', { force: true }); await p.waitForTimeout(300);
  ck('Mobilize: queued in the capital', await p.evaluate(c => window.__im.S.queue[c].some(j => j.t === 'stealth'), cap));
  await p.click('#sheet [data-act="resume"]').catch(() => {}); await p.waitForTimeout(200);
  // ---- a wing: mission panel, range, the strike plan text
  const R = await p.evaluate(c => { const im = window.__im, S = im.S, G = im.G; S.queue[c] = [];
    const E = S.nations.findIndex((n, i) => i > 0 && n.alive !== false); S.rel['0,' + E] = { st: 'war', since: S.hour, until: null }; S.rel[E + ',0'] = S.rel['0,' + E];
    const w = im.addArmy(0, c, { stealth: 3 }); w.air = { base: c, cd: 0 };
    const tg = G.P.filter(P => S.owner[P.id] === E && P.city && !P.sea).sort((x, y) => Math.hypot(x.x - G.P[c].x, x.y - G.P[c].y) - Math.hypot(y.x - G.P[c].x, y.y - G.P[c].y))[0].id;
    im.selectArmy ? im.selectArmy(w.id) : null; return { id: w.id, E, tg, name: armyName(w), range: wingRange(w), kind: airCheck(w, tg, [E]) }; }, cap);
  ck('wing: named, 36 hexes from an Airbase III, plans a strike', /Stealth Bomber Wing/.test(R.name) && R.range === 36 && (R.kind.kind === 'strike' || /range/i.test(R.kind.why || '')), R);
  // ---- fog on the map (the page records what each frame did with every wing in flight: window.__airSeen[id] = drawn / hidden / contact)
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  const F = await p.evaluate(({ c, E }) => { const im = window.__im, S = im.S, G = im.G;
    const own = G.P.filter(P => S.owner[P.id] === 0 && !P.sea && P.nbs.filter(v => S.owner[v] === 0 && !G.P[v].sea).length >= 2); const P = own.sort((x, y) => Math.hypot(x.x - G.P[c].x, x.y - G.P[c].y) - Math.hypot(y.x - G.P[c].x, y.y - G.P[c].y))[1];
    for (const a of S.armies) if (a.owner === 0 && (a.u.sam || a.u.jam)){ a.u.sam = 0; a.u.jam = 0; } removeEmpty();
    const nbs = P.nbs.filter(v => S.owner[v] === 0 && !G.P[v].sea), half = nearList(P.id, AEW_R/2), ring = nearList(P.id, AEW_R).filter(q => !half.includes(q));
    im.v3c.centerOn(P.x, P.y, 3); return { p: P.id, base: nbs[0], nb: nbs[1], far: ring[0], E }; }, { c: cap, E: R.E });
  const seenAs = async (t, o, setup) => { const id = await p.evaluate(({ t, F, o, setup }) => { const im = window.__im, S = im.S;
      for (const a of S.armies) if (a.tag === 'tw') for (const k in a.u) a.u[k] = 0; removeEmpty();
      if (setup === 'sam'){ const s = im.addArmy(0, F.nb, { sam: 1 }); s.tag = 'tw'; }
      if (setup === 'jam'){ const s = im.addArmy(0, F.p, { jam: 1 }); s.tag = 'tw'; }
      if (setup === 'awacs' || setup === 'awacs-far'){ const s = im.addArmy(0, S.nations[0].capital, { awacs: 1 }); s.tag = 'tw'; s.air = { base: S.nations[0].capital, cd: 0 }; s.fly = { tgt: setup === 'awacs' ? F.p : F.far, kind: 'orbit', ph: 'over', t: 0, hrs: 99 }; }
      const w = im.addArmy(o, F.base, { [t]: 3 }); w.tag = 'tw'; w.air = { base: F.base, cd: 0 }; w.fly = { tgt: F.p, kind: 'strike', ph: 'over', t: 0, hrs: 99 }; visCache = null; window.__airSeen = {}; return w.id; }, { t, F, o, setup });
    for (let i = 0; i < 12; i++){ await p.evaluate(() => { window.__airSeen = {}; window.__im.redraw && window.__im.redraw(0); }); await p.waitForTimeout(250); }
    return p.evaluate(id => (window.__airSeen || {})[id] || 'none', id); };
  const fog = { bomber: await seenAs('bomb', F.E), stealth: await seenAs('stealth', F.E), sam: await seenAs('stealth', F.E, 'sam'), jam: await seenAs('stealth', F.E, 'jam'),
    awacs: await seenAs('stealth', F.E, 'awacs'), awacsFar: await seenAs('stealth', F.E, 'awacs-far'), bomberAwacsFar: await seenAs('bomb', F.E, 'awacs-far'), own: await seenAs('stealth', 0) };
  await p.screenshot({ path: out('map-own-wing') });
  ck('map: an enemy Heavy Bomber over your land is drawn', fog.bomber === 'drawn', fog);
  ck('map: an enemy stealth wing over your land is not drawn (no SAM or jammer near)', fog.stealth === 'hidden', fog);
  ck('map: a SAM of yours in the next province shows it', fog.sam === 'drawn', fog);
  ck('map: a jammer of yours in the province shows it', fog.jam === 'drawn', fog);
  ck('map: your AWACS orbiting there gives a ? contact only', fog.awacs === 'contact', fog);
  ck('map: an AWACS beyond half its radar range gives nothing', fog.awacsFar === 'hidden', fog);
  ck('map: your own stealth wing is always drawn', fog.own === 'drawn', fog);
  console.log(JSON.stringify({ checks: checks.filter(c => !c.ok), passed: checks.filter(c => c.ok).length, total: checks.length, errors: errs }, null, 1));
  await b.close(); process.exit(errs.length || checks.some(c => !c.ok) ? 1 : 0);
})();
