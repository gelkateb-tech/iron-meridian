// The research tree by unit, in the page (docs/RESEARCH.md): category list, a category's day grid, colours and badges, the detail card,
// a project in each slot, day gates, levels, connectors, the worded upgrades' rules, the computer's picks, and the phone layout.
//   node .test/v4research.js   (bash tools/mkpage.sh first; exits 1 on a failed check or a page error)
const { chromium } = require('playwright');
const T0 = Date.now();
(async () => { const b = await chromium.launch(); const errs = [], checks = [];
  const ck = (name, ok, info) => { checks.push({ name, ok: !!ok, info }); if (process.env.V) console.log(((Date.now() - T0)/1000).toFixed(1), ok ? 'ok  ' : 'FAIL', name); };
  const boot = async vp => { const p = await b.newPage(vp); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
    await p.click('[data-act="pick"][data-p="4"]'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.waitForTimeout(800);
    await p.evaluate(() => { const N = window.__im.S.nations[0]; for (const k of ['cash', 'oil', 'metal', 'iron', 'elec', 'rare', 'mp']) N[k] = 4000; N.research = N.research2 = null; }); return p; };
  const p = await boot({ viewport: { width: 1440, height: 900 } });
  const node = id => p.evaluate(id => { const e = document.querySelector(`.rnode[data-id="${id}"]`); if (!e) return null; const cs = getComputedStyle(e.querySelector('.dm')); return { cls: e.className, title: e.title, text: e.innerText.replace(/\s+/g, ' ').trim(), bg: cs.backgroundImage, row: +getComputedStyle(e).getPropertyValue('--r'), col: +getComputedStyle(e).getPropertyValue('--c'), lane: +getComputedStyle(e).getPropertyValue('--l'), elite: !!e.querySelector('.rbadge-e'), lv: (e.querySelector('.rlv') || {}).textContent || '', mark: (e.querySelector('.rbdg') || {}).className || '' }; }, id);
  const cat = async c => { await p.evaluate(() => { const x = document.querySelector('[data-act="rback"]'); if (x) x.click(); }); await p.waitForTimeout(120); await p.click(`[data-act="rbranch"][data-b="${c}"]`); await p.waitForTimeout(250); };
  const card = () => p.evaluate(() => { const c = document.querySelector('.rs-card'); return c ? { cls: c.className, text: c.innerText.replace(/\s+/g, ' ').trim(), btn: (c.querySelector('.rs-db .btn') || {}).innerText || '', dis: !!(c.querySelector('.rs-db .btn') || {}).disabled } : null; });
  // ---- the tree as data
  const T = await p.evaluate(() => { const im = window.__im, L = im.rs.TECH(); return { n: L.length, steps: im.rs.steps(), day1: L.filter(t => t.kind === 'unlock' && t.day === 1).map(t => t.id), cats: [...new Set(L.map(t => t.cat))], lv3: L.filter(t => t.levels === 3).length, done0: im.rs.done(0) }; });
  ck('the tree: 162 researchable nodes, 285 steps, ten categories', T.n === 162 && T.steps === 285 && T.cats.length === 10 && T.done0 === 0, T);
  // ---- category list
  await p.click('[data-act="research-open"]'); await p.waitForTimeout(350);
  const list = await p.evaluate(() => [...document.querySelectorAll('.rs-ban')].map(e => ({ b: e.dataset.b, name: e.querySelector('.rs-bt b').textContent, role: e.querySelector('.rs-bt span').textContent, dm: !!e.querySelector('.rs-dm svg'), pic: !!e.querySelector('.rs-bimg'), cnt: e.querySelector('.rs-bpt > b').textContent, open: (e.querySelector('.rs-open') || {}).textContent || '' })));
  ck('list: ten category banners with a diamond icon, a name, a role line and a picture', list.length === 10 && list.every(x => x.dm && x.pic && x.name && x.role) && list[0].name === 'Infantry Corps' && list[9].name === 'Command & Logistics', list.map(x => x.name));
  ck('list: steps count and the green "open" chip (day 1: the IFV in Armoured Forces, two fighters in Tactical Air, nothing in Navy)', list[1].cnt === '0/23' && /1 open/i.test(list[1].open) && /2 open/i.test(list[4].open) && !list[7].open, list.map(x => [x.b, x.cnt, x.open]));
  ck('list: no Unit upgrades banner (Marks are in the tree)', await p.evaluate(() => !document.querySelector('.rs-ban.marks') && !/Marks/.test(document.querySelector('.rs-list').innerText)), null);
  ck('list: the note says Firepower and Protection cost few rare materials', await p.evaluate(() => /Firepower and Protection cost few rare materials/.test(document.querySelector('.rs-note').innerText)), null);
  // ---- Armoured Forces on day 1
  await cat('arm');
  const g = await p.evaluate(() => ({ heads: [...document.querySelectorAll('.rt-hd b')].map(e => e.textContent), days: [...document.querySelectorAll('.rt-days span b')].map(e => +e.textContent), today: (document.querySelector('.rt-days span.now') || {}).innerText || '', nodes: document.querySelectorAll('.rnode').length, sticky: getComputedStyle(document.querySelector('.rt-days')).position + '/' + getComputedStyle(document.querySelector('.rt-hd')).position }));
  ck('grid: one column per unit line, a day scale with only the days that hold a node, today marked', g.heads.join('|') === 'Infantry Fighting Vehicle|Main Battle Tank' && g.days[0] === 1 && g.days.every((d, i) => !i || d > g.days[i - 1]) && g.days.includes(14) && g.days.includes(22) && !g.days.includes(2) && /1\s*Today/i.test(g.today) && g.sticky === 'sticky/sticky', g);
  let mbt = await node('u_tank'), ifv = await node('u_ifv'), g2 = await node('tank_g2'), fp = await node('tank_fp'), arm = await node('tank_armor');
  ck('colours: standard issue is blue with a check', mbt && /st-done/.test(mbt.cls) && /90, 169, 214|195, 229, 246|95, 166, 207/.test(mbt.bg) && /ok/.test(mbt.mark) && /Standard issue/.test(mbt.text), mbt);
  ck('colours: a unit unlock open on day 1 is green', ifv && /st-open/.test(ifv.cls) && /pay/.test(ifv.cls) && /111, 184, 95|201, 239, 184|47, 122, 54/.test(ifv.bg), ifv);
  ck('colours: a later node is grey with a lock and its day', g2 && /st-lock/.test(g2.cls) && /lk/.test(g2.mark) && /Day 14/.test(g2.text) && /Opens on day 14/.test(g2.title) && /139, 152, 157|201, 210, 213/.test(g2.bg), g2);
  ck('layout: the unlock tops its column, generations sit on the spine below it, Firepower left and Protection right', mbt.row === 0 && mbt.lane === 0 && g2.lane === 0 && g2.row > mbt.row && fp.lane === -1 && (await node('tank_pr')).lane === 1 && arm.lane !== 0, [mbt.row, g2.row, fp.lane]);
  ck('badges: a levelled node shows its number of levels; a generation its numeral', fp.lv === '3' && /II/.test(g2.text), [fp.lv, g2.text]);
  // ---- detail card and the two slots
  await p.click('.rnode[data-id="u_ifv"]'); await p.waitForTimeout(250);
  let c = await card();
  ck('card: tapping selects (does not start) and shows what it does, price, time, needs and the button', c && /Infantry Fighting Vehicle/.test(c.text) && /Fast armored infantry carrier/.test(c.text) && /Open since day 1/.test(c.text) && /\$59M/.test(c.text) && /Research in slot #1/i.test(c.btn) && !c.dis && await p.evaluate(() => !window.__im.S.nations[0].research), c);
  await p.click('.rs-card .rs-db .btn'); await p.waitForTimeout(300);
  ifv = await node('u_ifv');
  const s1 = await p.evaluate(() => ({ slot: document.querySelector('#rslot1').innerText.replace(/\s+/g, ' '), R: { ...window.__im.S.nations[0].research }, cash: window.__im.S.nations[0].cash }));
  ck('slot #1: the project starts there, is paid for, and the node shows the slot ring', /Infantry Fighting Vehicle/.test(s1.slot) && s1.R.id === 'u_ifv' && s1.R.lv === 1 && s1.R.h === 72 && Math.round(s1.cash) === 4000 - 59 && /st-run/.test(ifv.cls) && /run/.test(ifv.mark), [s1, ifv.cls]);
  await cat('tac'); await p.click('.rnode[data-id="u_int"]'); await p.waitForTimeout(200); c = await card();
  ck('card: the next project offers slot #2', /Research in slot #2/i.test(c.btn), c.btn);
  await p.click('.rs-card .rs-db .btn'); await p.waitForTimeout(300);
  const s2 = await p.evaluate(() => ({ slot: document.querySelector('#rslot2').innerText.replace(/\s+/g, ' '), R2: { ...window.__im.S.nations[0].research2 } })); const int = await node('u_int');
  ck('slot #2: runs at the same time, in the second colour', /Interceptor/.test(s2.slot) && s2.R2.id === 'u_int' && /st-run/.test(int.cls) && / q/.test(int.cls) && /qd/.test(int.mark), [s2, int.cls]);
  await p.click('.rnode[data-id="u_jet"]'); await p.waitForTimeout(200); c = await card();
  ck('card: with both slots busy the button gives the reason from the rules', c.dis && /Both slots busy/.test(c.btn), c.btn);
  const asf = await node('u_asf');
  ck('elite: the Air Superiority Fighter carries the star-and-wings badge on its diamond and in its column header', asf.elite && await p.evaluate(() => !!document.querySelectorAll('.rt-hd')[2].querySelector('.relite')), asf);
  ck('connectors: a dashed family line (Interceptor to Air Superiority Fighter), solid spine and elbows', await p.evaluate(() => document.querySelectorAll('.rs-lines path.fam').length === 1 && document.querySelectorAll('.rs-lines path.sp').length > 4 && getComputedStyle(document.querySelector('.rs-lines path.fam')).strokeDasharray !== 'none'), null);
  await p.click('#rslot1'); await p.waitForTimeout(250);
  ck('tapping a running slot opens that node in its category', await p.evaluate(() => /Armoured Forces/i.test(document.querySelector('.rs-thead > b').innerText) && /sel/.test(document.querySelector('.rnode[data-id="u_ifv"]').className)), null);
  // ---- rules: days, levels, the spine
  const R = await p.evaluate(() => { const im = window.__im, S = im.S, N = S.nations[0], rs = im.rs, o = {}; N.research = N.research2 = null;
    o.day1 = [rs.can(0, 'tank_armor'), rs.why(0, 'tank_armor')]; S.hour = 2*24 + 1; o.day3 = [rs.can(0, 'tank_armor'), rs.why(0, 'tank_armor'), rs.day()];
    o.atk0 = rs.st(0, 'tank', 'atk'); o.def0 = rs.st(0, 'tank', 'def'); o.hp0 = rs.st(0, 'tank', 'hp');
    rs.start(0, 'tank_fp'); o.slot = { ...N.research }; for (let i = 0; i < 48; i++) rs.hour(0); o.fp1 = [rs.level(0, 'tank_fp'), rs.st(0, 'tank', 'atk'), N.research];
    o.fp2 = rs.why(0, 'tank_fp'); S.hour = 20*24; rs.grant(0, 'tank_fp', 2); o.fp3 = rs.why(0, 'tank_fp'); o.g3 = rs.why(0, 'tank_g3'); o.kitAfter = rs.why(0, 'u_stealth');
    rs.grant(0, 'tank_g2', 1); o.fp3b = rs.why(0, 'tank_fp'); o.hp1 = rs.st(0, 'tank', 'hp'); o.def1 = rs.st(0, 'tank', 'def');
    rs.grant(0, 'tank_fp', 3); rs.grant(0, 'tank_pr', 3); rs.grant(0, 'tank_armor', 1); rs.grant(0, 'tank_gun', 1); rs.grant(0, 'tank_eng', 1); rs.grant(0, 'tank_g3', 1);
    o.full = [rs.st(0, 'tank', 'atk'), rs.st(0, 'tank', 'def'), rs.st(0, 'tank', 'hp'), rs.st(0, 'tank', 'spd')]; o.done = rs.why(0, 'tank_fp');
    // health is taken as less damage
    const cap = N.capital, a = im.addArmy(0, cap, { tank: 10 }), a2 = im.addArmy(1, S.nations[1].capital, { tank: 10 }); rs.hurt(a, { armored: 0.02, soft: 0, air: 0, naval: 0 }, 1); rs.hurt(a2, { armored: 0.02, soft: 0, air: 0, naval: 0 }, 1);
    o.hurt = [a.w.tank + (10 - a.u.tank)*14, a2.w.tank + (10 - a2.u.tank)*14, (4 + rs.st(1, 'tank', 'def'))/(4 + rs.st(0, 'tank', 'def'))*14/21];
    return o; });
  ck('days: a node cannot be started before its day (Composite Armour opens on day 3)', R.day1[0] === false && R.day1[1] === 'Opens on day 3' && R.day3[0] === true && R.day3[2] === 3, [R.day1, R.day3]);
  ck('levels: Firepower 1 takes 2 days and gives +12% attack', R.slot.id === 'tank_fp' && R.slot.lv === 1 && R.slot.h === 48 && R.fp1[0] === 1 && Math.abs(R.fp1[1] - R.atk0*1.12) < 1e-9 && R.fp1[2] === null, [R.slot, R.fp1]);
  ck('levels: each level has its own day; level 3 needs generation 2', R.fp2 === 'Opens on day 10' && R.fp3 === 'Needs Third-Generation MBT' && R.fp3b === '' && R.done === 'Researched', [R.fp2, R.fp3, R.fp3b, R.done]);
  ck('the spine: generation 3 needs generation 2; the Stealth Bomber needs two lines', R.g3 === 'Opens on day 22' && R.kitAfter === 'Needs Strategic Bomber Upgrade and Stealth Airframes', [R.g3, R.kitAfter]);
  ck('generations add health and defense (Third-Generation MBT: health 14 to 18, defense +1)', R.hp0 === 14 && R.hp1 === 18 && Math.abs(R.def1 - (R.def0 + 1)) < 1e-9, [R.hp0, R.hp1, R.def0, R.def1]);
  ck('a fully researched tank: attack 16.8, defense 11.2, health 21, speed 8 (the plan, section 6.4)', Math.abs(R.full[0] - 16.8) < 1e-6 && Math.abs(R.full[1] - 11.2) < 1e-6 && R.full[2] === 21 && R.full[3] === 8, R.full);
  ck('health counts in battle: the same hit wounds the upgraded tanks less, by health and defense', R.hurt[0] < R.hurt[1] && Math.abs(R.hurt[0]/R.hurt[1] - R.hurt[2]) < 1e-6, R.hurt);
  // ---- the screen after research: partly levelled, done, the card's level list and before / after
  await p.evaluate(() => { const im = window.__im; im.S.nations[0].tech.tank_fp = 2; im.S.nations[0].tech.tank_pr = 1; im.S.nations[0].tv++; im.S.hour = 10*24 + 2; im.S.nations[0].rare = 1; });
  await cat('arm'); fp = await node('tank_fp'); const pr = await node('tank_pr'), gun = await node('tank_gun');
  ck('badges: a partly levelled node is blue with done/total; the next level locked until generation 2 is named', /part/.test(fp.cls) && fp.lv === '2/3' && /90, 169, 214/.test(fp.bg), fp);
  ck('badges: green ring when the next level is open (Protection 2 on day 11), a coin mark when it cannot be paid for', /part/.test(pr.cls) && /nxt/.test(pr.cls) && /cn/.test(pr.mark) && pr.lv === '1/3', pr);
  await p.click('.rnode[data-id="tank_pr"]'); await p.waitForTimeout(200); c = await card();
  ck('card: every level with its day, price and time; before and after for your nation; rare materials short in days of income', /1\/3/.test(c.text) && /Defense \+12% in all/.test(c.text) && /Defense \+25% in all/.test(c.text) && /Day 18/.test(c.text) && /Defense [\d.]+ [\d.]+/.test(c.text.replace(/\s+/g, ' ')) && /rare materials? short/.test(c.text) && c.dis && /Needs \d+ more rare materials?/.test(c.btn), c);
  await p.evaluate(() => { window.__im.S.nations[0].rare = 4000; });
  // ---- Strategic Air: the Stealth Bomber's two requirements
  await cat('str'); const stl = await node('u_stealth'), up = await node('bomb_up');
  ck('Stealth Bomber: a solid line from the Strategic Bomber Upgrade and a tag for Stealth Airframes (Tactical Air)', stl && /Stealth Airframes \(Tactical Air\)/.test(stl.text) && stl.elite && up.lane === 1 && await p.evaluate(() => document.querySelectorAll('.rs-lines path.xr').length === 1), stl);
  await p.click('.rnode[data-id="u_stealth"]'); await p.waitForTimeout(200);
  await p.click('.rs-card button.rs-dr.jump'); await p.waitForTimeout(300);
  ck('card: tapping the requirement from another category jumps there', await p.evaluate(() => /Tactical Air/i.test(document.querySelector('.rs-thead > b').innerText) && /sel/.test(document.querySelector('.rnode[data-id="jet_lo"]').className)), null);
  await cat('uns'); await p.click('.rnode[data-id="drone_g2"]'); await p.waitForTimeout(200);
  ck('card: a generation shows the old and the new picture side by side', await p.evaluate(() => document.querySelectorAll('.rs-card .rc-gen figure').length === 2 && /Generation II/i.test(document.querySelector('.rs-card .rc-gen').innerText)), null);
  // ---- the worded upgrades are rules
  const W = await p.evaluate(() => { const im = window.__im, S = im.S, rs = im.rs, o = {}, N = S.nations[0], cap = N.capital;
    o.cm0 = rs.mslOf(0, 'cm').range; rs.grant(0, 'msl1', 1); rs.grant(0, 'cm_rng', 2); rs.grant(0, 'cm_spd', 1); o.cm = [rs.mslOf(0, 'cm').range, rs.mslOf(0, 'cm').speed]; o.bm0 = rs.mslOf(1, 'bm').power; rs.grant(0, 'msl2', 1); rs.grant(0, 'bm_pow', 1); o.bm = rs.mslOf(0, 'bm').power;
    const a = im.addArmy(0, cap, { para: 2 }); o.drop0 = rs.dropRange(a); rs.grant(0, 'para_airlift', 2); o.drop = rs.dropRange(a);
    o.heli0 = rs.airRange(1, 'heli'); rs.grant(0, 'heli_rng', 2); o.heli = rs.airRange(0, 'heli');
    o.uav = [im.air.uavLv(0)]; rs.grant(0, 'u_drone', 1); rs.grant(0, 'drone_g2', 1); rs.grant(0, 'drone_g3', 1); o.uav.push(im.air.uavLv(0));
    return o; });
  ck('missiles: range, speed and power follow research (Cruise 28 to 36 hexes, speed 9 to 11; Ballistic power 16 to 19)', W.cm0 === 28 && W.cm[0] === 36 && W.cm[1] === 11 && W.bm0 === 16 && W.bm === 19, W);
  ck('air drops: Long-Range Airlift 9 to 13 hexes', W.drop0 === 9 && W.drop === 13, [W.drop0, W.drop]);
  ck('UAV levels follow the Recon UAV generations', W.uav[0] === 2 || W.uav[0] === 1 ? W.uav[1] === 3 : false, W.uav);
  if (W.heli != null) ck('gunship range grows with Long-Range Tanks (6 to 8 hexes)', W.heli0 === 6 && W.heli === 8, [W.heli0, W.heli]);
  // ---- the computer: it researches, with science in one slot and engineering in the other
  const A = await p.evaluate(() => { const im = window.__im, S = im.S, rs = im.rs, o = { kinds: [], steps: [] }, K = Object.fromEntries(rs.TECH().map(t => [t.id, t.kind]));
    for (const n of [1, 2, 3]){ const N = S.nations[n]; N.research = N.research2 = null; N.rPick = null; for (const k of ['cash', 'metal', 'iron', 'elec', 'rare']) N[k] = 3000; for (let i = 0; i < 6 && (!N.research || !N.research2); i++) rs.aiTurn(n);
      o.kinds.push([N.research && K[N.research.id], N.research2 && K[N.research2.id]]); }
    return o; });
  ck('computer players fill both slots: one with science, one with engineering', A.kinds.every(k => k[0] && k[1] && (k[0] === 'eng') !== (k[1] === 'eng')), A.kinds);
  await p.close();
  // ---- phone: the grid scrolls sideways beside a sticky day column, the card is a bottom sheet
  const q = await boot({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await q.emulateMedia({ reducedMotion: 'reduce' });   // (the card slides up: measured at rest)
  await q.evaluate(() => { window.__im.S.hour = 5*24; }); await q.click('[data-act="research-open"]'); await q.waitForTimeout(350); await q.click('[data-act="rbranch"][data-b="sup"]'); await q.waitForTimeout(300);
  const ph0 = await q.evaluate(() => { const sc = document.getElementById('rtscroll'), sh = document.getElementById('sheet'); return { sw: sc.scrollWidth, cw: sc.clientWidth, sheetScroll: sh.scrollHeight - sh.clientHeight, pageW: document.documentElement.scrollWidth, card: getComputedStyle(document.querySelector('.rs-card')).display, cols: document.querySelectorAll('.rt-hd').length }; });
  ck('phone: four columns scroll sideways inside the grid, the page itself does not', ph0.cols === 4 && ph0.sw > ph0.cw + 40 && ph0.pageW <= 431 && ph0.card === 'none', ph0);
  await q.evaluate(() => { document.getElementById('rtscroll').scrollLeft = 200; document.getElementById('rtscroll').scrollTop = 120; }); await q.waitForTimeout(100);
  const ph1 = await q.evaluate(() => { const sc = document.getElementById('rtscroll').getBoundingClientRect(), d = document.querySelector('.rt-days').getBoundingClientRect(), h = document.querySelector('.rt-hd').getBoundingClientRect(); return { dayLeft: Math.round(d.left - sc.left), headTop: Math.round(h.top - sc.top) }; });
  ck('phone: the day column and the column headers stay in place while the grid scrolls', ph1.dayLeft === 0 && ph1.headTop === 0, ph1);
  await q.evaluate(() => { document.querySelector('.rnode[data-id="art_radar"]').click(); }); await q.waitForTimeout(350);
  const ph2 = await q.evaluate(() => { const c = document.querySelector('.rs-card'), r = c.getBoundingClientRect(), bd = document.querySelector('.rs-body').getBoundingClientRect(), n = document.querySelector('.rnode.sel .dm').getBoundingClientRect(), sc = document.getElementById('rtscroll'); return { pos: getComputedStyle(c).position, bottom: Math.round(bd.bottom - r.bottom), w: Math.round(r.width), nodeClear: n.bottom <= r.top + 1, kept: sc.scrollLeft > 0, text: c.innerText.replace(/\s+/g, ' ').slice(0, 200), btnVis: (() => { const x = c.querySelector('.rs-db .btn').getBoundingClientRect(); return x.bottom <= innerHeight && x.top >= r.top; })() }; });
  ck('phone: the detail card is a bottom sheet, full width, with the selected node clear of it and the button in view', ph2.pos === 'absolute' && Math.abs(ph2.bottom) <= 1 && ph2.w === 430 && ph2.nodeClear && ph2.btnVis && /Counter-Battery Radar/.test(ph2.text), ph2);
  await q.close();
  const bad = checks.filter(c => !c.ok);
  console.log(JSON.stringify({ checks: checks.length, failed: bad, errors: errs }, null, 1)); await b.close(); process.exit(bad.length || errs.length ? 1 : 0); })();
