// CoN layout pass: full UI playthrough at desktop and phone sizes. Usage: node .test/con-verify.js [w h tag]
const pickNation = require('./pick-nation.js');   // (a start-screen card by its nation's name, on either world)
const { chromium } = require('playwright');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), TAG = process.argv[4] || (W > 820 ? 'desk' : 'phone');
const fails = [], notes = [];
const ok = (c, msg, extra) => { if (!c) fails.push(msg + (extra !== undefined ? ' :: ' + JSON.stringify(extra) : '')); else notes.push('PASS ' + msg); };
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: W <= 820, isMobile: false });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const shot = n => p.screenshot({ path: `${__dirname}/con-verify-${TAG}-${n}.png` });
  const vis = sel => p.evaluate(s => { const e = document.querySelector(s); if (!e || e.hidden) return false; const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false; return true; }, sel);
  // is the element's centre actually hittable (not covered by another bar/panel)?
  const hit = sel => p.evaluate(s => { const e = document.querySelector(s); if (!e) return 'missing'; const r = e.getBoundingClientRect(); const x = r.left + r.width/2, y = r.top + r.height/2; if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return 'offscreen ' + [x, y]; const t = document.elementFromPoint(x, y); return t && (t === e || e.contains(t)) ? 'ok' : 'covered by ' + (t ? (t.id || t.className || t.tagName) : 'null'); }, sel);
  const mk = () => p.evaluate(() => window.__im.modalKind());
  const modalOpen = () => p.evaluate(() => !document.getElementById('modal').hidden);
  const closeM = async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(150); if (await modalOpen()) { await p.evaluate(() => { const r = document.querySelector('#modal [data-act="resume"]'); if (r) r.click(); }); await p.waitForTimeout(150); } };
  const hscroll = () => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1 || document.body.scrollWidth > innerWidth + 1);

  await p.goto('file://' + __dirname + '/page.html');   // this checkout's own test page (bash tools/mkpage.sh) await p.waitForTimeout(500);
  await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 }); await p.waitForTimeout(400);
  const nat = await p.evaluate(() => window.__im.S.nations[0].name); notes.push('playing ' + nat);
  ok(!(await hscroll()), 'no horizontal scroll at start');
  await shot('0-start');

  // header pieces
  for (const s of ['#res', '#mslbtn', '#clock', '#vbar', '#dipbtn', '#mktbtn', '#citybtn', '#resbtn', '#morebtn', '#zhome', '#railnotif'].concat(W <= 820 ? ['#railside'] : ['#side']))
    ok(await vis(s), 'visible ' + s);
  for (const s of ['#dipbtn', '#mktbtn', '#citybtn', '#resbtn', '#morebtn', '#mslbtn', '#zhome']) { const h = await hit(s); ok(h === 'ok', 'hittable ' + s, h); }

  // bottom-nav tabs
  for (const [id, kind] of [['#dipbtn', 'diplo'], ['#mktbtn', 'market'], ['#citybtn', 'cities'], ['#resbtn', 'research']]) {
    await p.click(id); await p.waitForTimeout(250);
    ok(await modalOpen() && (await mk()) === kind, `tab ${id} opens ${kind}`, await mk());
    ok(!(await hscroll()), `no hscroll in ${kind}`);
    await shot('1-tab-' + kind);
    await closeM(); ok(!(await modalOpen()), `${kind} closes`);
  }
  // More menu
  await p.click('#morebtn'); await p.waitForTimeout(250);
  ok(await vis('#morepop'), 'More menu opens'); await shot('2-more');
  const items = await p.evaluate(() => [...document.querySelectorAll('#morepop [data-act]')].map(e => '#' + e.id));
  ok(items.length >= 6, 'More menu has items', items);
  for (const it of items) { const h = await hit(it); ok(h === 'ok', 'More item hittable ' + it, h); }
  for (const [id, kind] of [['#prodbtn', 'prod'], ['#armbtn', 'armies'], ['#intelbtn', 'intel'], ['#setbtn', 'settings'], ['#helpbtn', 'help']]) {
    if (!(await vis('#morepop'))) { await p.click('#morebtn'); await p.waitForTimeout(200); }
    await p.click(id); await p.waitForTimeout(250);
    ok(await modalOpen() && (await mk()) === kind, `More > ${id} opens ${kind}`, await mk());
    ok(!(await vis('#morepop')), `More menu closes after ${id}`);
    await closeM();
  }
  if (!(await vis('#morepop'))) { await p.click('#morebtn'); await p.waitForTimeout(200); }
  const m0 = await p.evaluate(() => document.getElementById('mutebtn').getAttribute('aria-pressed'));
  await p.click('#mutebtn'); await p.waitForTimeout(150);
  const m1 = await p.evaluate(() => document.getElementById('mutebtn').getAttribute('aria-pressed'));
  ok(m0 !== m1, 'mute toggles', [m0, m1]);
  if (await vis('#morepop')) { await p.click('#morebtn'); await p.waitForTimeout(150); }
  ok(!(await vis('#morepop')), 'More menu closes on second tap');

  // missile dropdown
  await p.click('#mslbtn'); await p.waitForTimeout(350);
  ok(await vis('#mslmenu'), 'missile dropdown opens');
  const cells = await p.evaluate(() => [...document.querySelectorAll('#mslmenu [data-act="msl-cell"]')].map(e => e.dataset.k + ':' + e.innerText.replace(/\s+/g, ' ').trim()));
  ok(cells.length >= 2, 'missile dropdown has cells', cells); notes.push('missile cells ' + JSON.stringify(cells));
  await shot('3-missiles');
  await p.click('#mslbtn'); await p.waitForTimeout(300);
  ok(!(await vis('#mslmenu')), 'missile dropdown closes');

  // research: list, branch tree, node, start, queue
  await p.click('#resbtn'); await p.waitForTimeout(300);
  const bans = await p.evaluate(() => [...document.querySelectorAll('#sheet [data-act="rbranch"]')].map(e => e.dataset.b));
  ok(bans.length >= 10, 'research list banners', bans);
  ok(await vis('.rs-slots'), 'research slot boxes visible');
  await shot('4-research-list');
  const plan = await p.evaluate(() => { const im = window.__im, S = im.S, N = S.nations[0]; return { cash: N.cash, metal: N.metal, rare: N.rare, research: N.research }; });
  notes.push('resources ' + JSON.stringify(plan));
  // the research tree by unit: categories by id (inf, arm, sup, aas, tac, uns, str, nav, msl, cmd); on day 1 several are open
  await p.click('#sheet [data-act="rbranch"][data-b="inf"]'); await p.waitForTimeout(300);
  const nodes = await p.evaluate(() => [...document.querySelectorAll('#sheet .rnode')].map(e => e.dataset.id + ':' + [...e.classList].filter(c => c.startsWith('st-')).join('')));
  ok(nodes.length >= 2, 'branch tree nodes', nodes); notes.push('Infantry nodes ' + JSON.stringify(nodes));
  await shot('5-research-tree');
  // select an open node (a unit unlock first, else any): the first category with one
  const openIn = () => p.evaluate(() => { const e = document.querySelector('#sheet .rnode.k-unlock.st-open') || document.querySelector('#sheet .rnode.st-open'); return e && e.dataset.id; });
  let open = await openIn();
  for (const br of ['arm', 'tac', 'uns', 'aas']) { if (open) break; await p.click('#sheet [data-act="rback"]'); await p.waitForTimeout(200); await p.click(`#sheet [data-act="rbranch"][data-b="${br}"]`); await p.waitForTimeout(250); open = await openIn(); }
  ok(!!open, 'an open research node exists');
  await p.click(`#sheet .rnode[data-id="${open}"]`); await p.waitForTimeout(250);
  ok(await p.evaluate(id => !!document.querySelector(`#sheet .rnode.sel[data-id="${id}"]`) && !!document.querySelector('#sheet .rs-card:not(.hint)'), open), 'node selected with detail card');
  await shot('6-research-node');
  const rbtn = `#sheet [data-act="research"][data-id="${open}"]`;
  const can = await p.evaluate(s => { const e = document.querySelector(s); return e ? !e.disabled : null; }, rbtn);
  ok(can === true, 'Research button enabled for open node', { can, open });
  if (can === false) { // give resources so the flow can be exercised
    await p.evaluate(() => { const N = window.__im.S.nations[0]; N.cash += 5000; N.metal += 500; N.rare += 500; });
    await p.click('#resbtn').catch(() => {}); }
  { const h = await hit(rbtn); ok(h === 'ok', 'Research button hittable', h); }
  await p.click(rbtn); await p.waitForTimeout(250);
  const r1 = await p.evaluate(() => { const N = window.__im.S.nations[0]; return N.research && N.research.id; });
  ok(r1 === open, 'research started in slot #1', { r1, open });
  // queue a second one: another open node anywhere
  const second = await p.evaluate(run => { const im = window.__im; return null; }, r1);
  let qid = await p.evaluate(() => { const e = [...document.querySelectorAll('#sheet .rnode.st-open')][0]; return e && e.dataset.id; });
  if (!qid) { await p.click('#sheet [data-act="rback"]'); await p.waitForTimeout(200);
    for (const br of bans) { await p.click(`#sheet [data-act="rbranch"][data-b="${br}"]`); await p.waitForTimeout(150); qid = await p.evaluate(() => { const e = document.querySelector('#sheet .rnode.st-open'); return e && e.dataset.id; }); if (qid) break; await p.click('#sheet [data-act="rback"]'); await p.waitForTimeout(120); } }
  ok(!!qid, 'second open node found');
  await p.click(`#sheet .rnode[data-id="${qid}"]`); await p.waitForTimeout(250);
  // two slots: with slot #1 busy, tapping an open project starts it in slot #2 (paid now); else its Research button does
  let rq = await p.evaluate(() => { const R = window.__im.S.nations[0].research2; return R && R.id; });
  if (rq !== qid) { await p.evaluate(() => { const N = window.__im.S.nations[0]; N.cash += 2000; N.metal += 200; N.rare += 200; }); const qb = `#sheet [data-act="research"][data-id="${qid}"]`; if (await p.$(qb)) { await p.click(qb); await p.waitForTimeout(200); } rq = await p.evaluate(() => { const R = window.__im.S.nations[0].research2; return R && R.id; }); }
  ok(rq === qid, 'second research running in slot #2', { rq, qid });
  ok(await p.evaluate(() => document.querySelectorAll('.rs-slots .rs-slot.full').length === 2 && /SLOT #2/i.test(document.querySelector('.rs-slots').innerText)), 'both slot boxes show a running project');
  await shot('7-research-two');
  await closeM();
  // run time: both slots advance together and each finishes at its own time
  const run = await p.evaluate(({ a, q }) => { const im = window.__im, N = im.S.nations[0]; const ha = N.research.h, hq = N.research2.h; let h = 0, da = -1, dq = -1;
    while (h < 24*60 && (da < 0 || dq < 0)) { im.tick(); h++; if (da < 0 && N.tech[a]) da = h; if (dq < 0 && N.tech[q]) dq = h; }
    return { ha, hq, da, dq, after: [N.research, N.research2], log: im.S.log.slice(0, 4).map(l => l.text) }; }, { a: r1, q: qid });
  notes.push('research run ' + JSON.stringify(run));
  ok(run.da === run.ha, 'first research completed on time', run);
  ok(run.dq === run.hq, 'second research completed on time (in parallel)', run);
  await p.waitForTimeout(300);

  // own city -> sheet -> MOBILIZE UNIT and BUILD
  const cap = await p.evaluate(() => { const im = window.__im, S = im.S, P = im.G.P[S.nations[0].capital]; im.camGo(P.x, P.y, 3.2); return P.id; });
  await p.waitForFunction(() => !window.__im.camFly, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(400);
  const tapProv = async pid => { const xy = await p.evaluate(id => { const im = window.__im, P = im.G.P[id]; const [x, y] = im.toScreen(P.x, P.y), r = document.getElementById('map').getBoundingClientRect(); return [x + r.left, y + r.top]; }, pid);
    await p.mouse.click(xy[0], xy[1]); await p.waitForTimeout(300);
    if (await vis('#chooser')) { await p.click('#chooser [data-act="choose-prov"]'); await p.waitForTimeout(300); }
    return xy; };
  await tapProv(cap);
  let sp = await p.evaluate(() => window.__im.sel.prov);
  if (sp !== cap) { notes.push('tap on capital selected ' + sp + ', falling back to selectProv'); await p.evaluate(id => window.__im.selectProv(id), cap); await p.waitForTimeout(300); sp = await p.evaluate(() => window.__im.sel.prov); }
  ok(sp === cap, 'own capital selected', sp);
  ok(await vis('#csheet'), 'city sheet shows for own city');
  await shot('8-city-own');
  for (const s of ['[data-act="cs-mob"]', '[data-act="cs-bld"]']) { const h = await hit('#csheet ' + s); ok(h === 'ok', 'city sheet button hittable ' + s, h); }
  const q0 = await p.evaluate(id => (window.__im.S.queue[id] || []).length, cap);
  await p.click('#csheet [data-act="cs-mob"]'); await p.waitForTimeout(300);
  ok((await mk()) === 'mob', 'MOBILIZE UNIT opens recruit modal', await mk());
  await shot('9-mobilize');
  const rec = await p.evaluate(() => { const e = document.querySelector('#sheet [data-act="recruit"]:not([disabled])'); return e && e.dataset.t; });
  ok(!!rec, 'an enabled recruit button exists');
  if (rec) { await p.click(`#sheet [data-act="recruit"][data-t="${rec}"]:not([disabled])`); await p.waitForTimeout(250); }
  const q1 = await p.evaluate(id => (window.__im.S.queue[id] || []).map(x => x.t), cap);
  ok(q1.length === q0 + 1 && q1[q1.length - 1] === rec, 'unit queued from MOBILIZE', { q0, q1, rec });
  await closeM();
  ok(await vis('#csheet'), 'city sheet back after closing modal');
  const c0 = await p.evaluate(id => window.__im.S.cons[id], cap);
  await p.click('#csheet [data-act="cs-bld"]'); await p.waitForTimeout(300);
  ok((await mk()) === 'cbld', 'BUILD opens build modal', await mk());
  await shot('10-build');
  const bk = await p.evaluate(() => { const e = document.querySelector('#sheet [data-act="build"]:not([disabled])'); return e && e.dataset.k; });
  ok(!!bk, 'an enabled build button exists', { c0 });
  if (bk) { await p.click(`#sheet [data-act="build"][data-k="${bk}"]:not([disabled])`); await p.waitForTimeout(250); }
  const c1 = await p.evaluate(id => window.__im.S.cons[id], cap);
  ok(c1 && c1.k === bk, 'building queued from BUILD', { c0, c1, bk });
  await closeM();
  const csAfter = await p.evaluate(() => document.getElementById('csheet').innerText.replace(/\s+/g, ' ').slice(0, 300)); notes.push('own sheet: ' + csAfter);
  // a building card tap
  const card = await p.evaluate(() => { const e = document.querySelector('#csheet [data-act="cs-card"]'); return e && e.dataset.k; });
  if (card) { await p.click(`#csheet [data-act="cs-card"][data-k="${card}"]`); await p.waitForTimeout(250); notes.push('card tap -> modal ' + (await mk())); await closeM(); }
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);

  // foreign city
  const fc = await p.evaluate(() => { const im = window.__im, S = im.S, fr = S.nations.findIndex(n => n.name === 'France'); const P = im.G.P[S.nations[fr].capital]; im.camGo(P.x, P.y, 3.2); return P.id; });
  await p.waitForFunction(() => !window.__im.camFly, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(400);
  await tapProv(fc);
  let fs = await p.evaluate(() => window.__im.sel.prov);
  if (fs !== fc) { notes.push('tap on Paris selected ' + fs + ', falling back to selectProv'); await p.evaluate(id => window.__im.selectProv(id), fc); await p.waitForTimeout(300); fs = await p.evaluate(() => window.__im.sel.prov); }
  ok(fs === fc, 'foreign city selected', fs);
  ok(await vis('#csheet'), 'city sheet shows for foreign city');
  const fsh = await p.evaluate(() => ({ t: document.getElementById('csheet').innerText.replace(/\s+/g, ' ').slice(0, 200), mob: !!document.querySelector('#csheet [data-act="cs-mob"]'), dip: !!document.querySelector('#csheet [data-act="diplo-open"]') }));
  ok(!fsh.mob && fsh.dip, 'foreign sheet offers Diplomacy, not Mobilize', fsh);
  await shot('11-city-foreign');
  await p.click('#csheet [data-act="diplo-open"]'); await p.waitForTimeout(250);
  ok((await mk()) === 'diplo', 'foreign sheet Diplomacy opens diplomacy'); await closeM();
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);

  // army: click its counter, then move it
  const ar = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G; const a = S.armies.find(x => x.owner === 0 && !x.air && !x.naval && x.at !== S.nations[0].capital && !x.to) || S.armies.find(x => x.owner === 0 && !x.air);
    const P = G.P[a.at]; im.camGo(P.x, P.y, 3.2); return { id: a.id, at: a.at }; });
  await p.waitForFunction(() => !window.__im.camFly, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(600);
  const hxy = await p.evaluate(id => { const im = window.__im, r = document.getElementById('map').getBoundingClientRect(); const h = im.hits.find(h => h.ids && h.ids.includes(id)); return h ? { x: h.cx + r.left, y: h.cy + r.top, n: h.ids.length, w: h.w, hh: h.h } : null; }, ar.id);
  ok(!!hxy, 'army counter drawn (hit rect)', hxy);
  if (hxy) { await p.mouse.click(hxy.x, hxy.y); await p.waitForTimeout(300); if (await vis('#chooser')) { notes.push('chooser shown on counter tap'); const ca = await p.$(`#chooser [data-act="choose-army"]`); if (ca) await ca.click(); await p.waitForTimeout(250); } }
  let sa = await p.evaluate(() => window.__im.sel.army);
  ok(sa != null, 'counter click selects an army', { sa, want: ar.id });
  await shot('12-army-selected');
  if (sa != null) {
    const tgt = await p.evaluate(id => { const im = window.__im, S = im.S, G = im.G, a = S.armies.find(x => x.id === id); const busy = new Set(S.armies.filter(b => b.owner === 0).flatMap(b => [b.at, b.to])); const t = G.P[a.at].nbs.map(v => G.P[v]).find(P => S.owner[P.id] === 0 && !P.sea && !P.city && !busy.has(P.id)) || G.P[a.at].nbs.map(v => G.P[v]).find(P => S.owner[P.id] === 0 && !P.sea) || G.P[G.P[a.at].nbs[0]]; const [x, y] = im.toScreen(t.x, t.y), r = document.getElementById('map').getBoundingClientRect(); return { t: t.id, x: x + r.left, y: y + r.top, from: a.at }; }, sa);
    // phone-style: tap the destination (falls back to right-click on desktop if a tap does not order)
    await p.mouse.click(tgt.x, tgt.y); await p.waitForTimeout(300);
    notes.push('after first tap on destination: sel.target=' + (await p.evaluate(() => window.__im.sel.target)) + ' army sel=' + (await p.evaluate(() => window.__im.sel.army)));
    await shot('12b-army-target');
    await p.mouse.click(tgt.x, tgt.y); await p.waitForTimeout(300);   // second tap on the same place confirms
    if (await vis('#chooser')) { const ch = await p.evaluate(() => document.getElementById('chooser').innerText.replace(/\s+/g, ' ').slice(0, 120)); notes.push('chooser after dest tap: ' + ch); }
    let mv = await p.evaluate(id => { const a = window.__im.S.armies.find(x => x.id === id); return a ? { to: a.to, path: (a.path || []).slice(), at: a.at } : null; }, sa);
    notes.push('after tapping destination ' + JSON.stringify(mv));
    if (!(mv && (mv.to != null || mv.path.length))) {
      // use the command bar Move button, then tap
      const mvb = await p.evaluate(() => { const e = [...document.querySelectorAll('#cmdbar .cb')].find(b => /move/i.test(b.innerText)); return e ? true : false; });
      if (mvb) { await p.evaluate(() => { if (window.__im.sel.army == null) return; }); }
      if (await p.evaluate(() => window.__im.sel.army == null)) { await p.evaluate(id => window.__im.selectArmy(id), sa); await p.waitForTimeout(200); }
      const btn = await p.$('#cmdbar .cb >> text=/Move/i');
      if (btn) { await btn.click(); await p.waitForTimeout(150); await p.mouse.click(tgt.x, tgt.y); await p.waitForTimeout(300); notes.push('used cmdbar Move'); }
      else { await p.mouse.click(tgt.x, tgt.y, { button: 'right' }); await p.waitForTimeout(300); notes.push('used right-click'); }
      mv = await p.evaluate(id => { const a = window.__im.S.armies.find(x => x.id === id); return a ? { to: a.to, path: (a.path || []).slice(), at: a.at } : null; }, sa);
    }
    ok(mv && (mv.to === tgt.t || mv.path.includes(tgt.t)), 'army ordered to move', { mv, tgt });
    await shot('13-army-moving');
    const arrived = await p.evaluate(({ id, t }) => { const im = window.__im; for (let i = 0; i < 96; i++){ const a = im.S.armies.find(x => x.id === id); if (!a || a.at === t) break; im.tick(); } const a = im.S.armies.find(x => x.id === id); return a ? a.at : 'gone; own armies at target: ' + im.S.armies.filter(x => x.owner === 0 && x.at === t).length; }, { id: sa, t: tgt.t });
    ok(arrived === tgt.t, 'army arrived', { arrived, t: tgt.t });
  }
  await p.waitForTimeout(400);
  await shot('14-end');
  ok(!(await hscroll()), 'no horizontal scroll at end');
  ok(errs.length === 0, 'no page/console errors', errs);
  console.log(TAG, W + 'x' + H); console.log(notes.join('\n'));
  console.log('FAILS', JSON.stringify(fails, null, 1));
  console.log(errs);
  await b.close(); process.exit(fails.length || errs.length ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message); console.log('FAILS', JSON.stringify(fails, null, 1)); process.exit(2); });
