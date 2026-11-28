// The research tree by unit, in the page (docs/RESEARCH.md; the CoN layout of docs/QUEUE.md RESEARCH-CON): category list, a category's day grid, colours,
// the card, a project in each slot, day gates, levels, one node per cell, the worded upgrades' rules, the computer's picks, and the phone layout.
//   node .test/v4research.js   (bash tools/mkpage.sh first; exits 1 on a failed check or a page error)
const pickNation = require('./pick-nation.js');   // (a start-screen card by its nation's name, on either world)
const { chromium } = require('playwright');
const T0 = Date.now();
(async () => { const b = await chromium.launch(); const errs = [], checks = [];
  const ck = (name, ok, info) => { checks.push({ name, ok: !!ok, info }); if (process.env.V) console.log(((Date.now() - T0)/1000).toFixed(1), ok ? 'ok  ' : 'FAIL', name); };
  const boot = async vp => { const p = await b.newPage(vp); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
    await pickNation(p, 'France'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.waitForTimeout(800);
    await p.evaluate(() => { const N = window.__im.S.nations[0]; for (const k of ['cash', 'oil', 'metal', 'iron', 'elec', 'rare', 'mp']) N[k] = 4000*(isGood(k) ? RES_K : 1); N.research = N.research2 = null; }); return p; };
  const p = await boot({ viewport: { width: 1440, height: 900 } });
  const node = id => p.evaluate(id => { const e = document.querySelector(`.rnode[data-id="${id}"]`); if (!e) return null; const cs = getComputedStyle(e.querySelector('.dm')); return { cls: e.className, title: e.title, text: e.innerText.replace(/\s+/g, ' ').trim(), bg: cs.backgroundImage, row: +getComputedStyle(e).getPropertyValue('--r'), col: +getComputedStyle(e).getPropertyValue('--c'), sym: ((e.querySelector('svg.rk-sym') || {}).className || {}).baseVal || '', badge: !!e.querySelector('.rbdg, .rlv, .rgn, .rbadge-e, .rn, .rx') }; }, id);
  const cat = async c => { await p.evaluate(() => { const x = document.querySelector('[data-act="rback"]'); if (x) x.click(); }); await p.waitForTimeout(120); await p.click(`[data-act="rbranch"][data-b="${c}"]`); await p.waitForTimeout(250); };
  const card = () => p.evaluate(() => { const c = document.querySelector('.rs-card'); return c ? { cls: c.className, text: c.innerText.replace(/\s+/g, ' ').trim(), head: (c.querySelector('.rk-ch h2') || {}).innerText || '', btn: (c.querySelector('.rs-db .btn') || {}).innerText || '', title: (c.querySelector('.rs-db .btn') || {}).title || '', dis: !!(c.querySelector('.rs-db .btn') || {}).disabled } : null; });
  const shut = () => p.evaluate(() => { const x = document.querySelector('.rs-card [data-act="rcard-x"]'); if (x) x.click(); });   // the card covers the tree: close it before the next tap
  // ---- the tree as data
  const T = await p.evaluate(() => { const im = window.__im, L = im.rs.TECH(); return { n: L.length, steps: im.rs.steps(), day1: L.filter(t => t.kind === 'unlock' && t.day === 1).map(t => t.id), cats: [...new Set(L.map(t => t.cat))], lv3: L.filter(t => t.levels === 3).length, done0: im.rs.done(0) }; });
  ck('the tree: 163 researchable nodes, 289 steps, ten categories', T.n === 163 && T.steps === 289 && T.cats.length === 10 && T.done0 === 0, T);
  // ---- category list
  await p.click('[data-act="research-open"]'); await p.waitForTimeout(350);
  const list = await p.evaluate(() => [...document.querySelectorAll('.rs-ban')].map(e => ({ b: e.dataset.b, name: e.querySelector('.rs-bt b').textContent, role: e.querySelector('.rs-bt span').textContent, dm: !!e.querySelector('.rs-dm svg, .rs-dm .rface.p i'), pic: e.classList.contains('scene') ? e.style.getPropertyValue('--rbs').includes(`assets/art/rbs-${e.dataset.b}.webp`) : (e.querySelector('.rs-bpic') || {}).getAttribute && e.querySelector('.rs-bpic').getAttribute('src') === `assets/art/rb-${e.dataset.b}.webp` && !e.querySelector('.rs-bph, .rs-bimg'), cnt: e.querySelector('.rs-bpt > b').textContent, open: (e.querySelector('.rs-open') || {}).textContent || '' })));
  // the banner pictures: loaded, whole inside the banner, clear of the name and the count, not darkened (no filter, nothing over them but the fade)
  const pics = await p.evaluate(async () => { const out = []; for (const e of document.querySelectorAll('.rs-ban:not(.scene)')){ const im = e.querySelector('.rs-bpic'); if (!im.complete) await new Promise(r => { im.onload = im.onerror = r; setTimeout(r, 2000); });
      const B = e.getBoundingClientRect(), I = im.getBoundingClientRect(), T = e.querySelector('.rs-bt').getBoundingClientRect(), P = e.querySelector('.rs-bp').getBoundingClientRect(), cs = getComputedStyle(im);
      out.push({ b: e.dataset.b, ok: im.naturalWidth > 0, inside: I.left >= B.left - 0.5 && I.right <= B.right + 0.5 && I.top >= B.top - 0.5 && I.bottom <= B.bottom + 0.5, clear: I.right <= P.left + 0.5 && I.left >= T.right - 12, h: Math.round(I.height), filter: cs.filter, bg: getComputedStyle(e).backgroundImage.includes('rgba(var') || /255, 226, 196|180, 118, 88|29, 90, 134/.test(getComputedStyle(e).backgroundImage) }); }
    return out; });
  const SCN = await p.evaluate(async () => { const out = []; for (const e of document.querySelectorAll('.rs-ban.scene')){ const u = (e.style.getPropertyValue('--rbs').match(/url\(['"]?([^'")]+)/) || [])[1];
      const ok = await new Promise(r => { const im = new Image(); im.onload = () => r(im.naturalWidth >= 1000 && im.naturalWidth/im.naturalHeight > 3); im.onerror = () => r(false); im.src = u; setTimeout(() => r(false), 3000); });
      out.push({ b: e.dataset.b, ok, cover: /cover|1[5-9]\d%|200%/.test(getComputedStyle(e).backgroundSize) }); } return out; });
  ck('scene banners (rbs-<category>): the wide picture loads and covers the whole banner', SCN.every(x => x.ok && x.cover), SCN);
  ck('banners: all ten categories show their scene (no cut-out unit pictures left)', SCN.length === 10 && !(await p.evaluate(() => document.querySelector('.rs-bpic'))), SCN.length);
  // every research picture: each node's key (its own, its shared upgrade type, a generation its unit's unlock) and each category's icon loads
  const RP = await p.evaluate(async () => { const P = window.__im.rs.pics(), N = P.nodes, keys = [...new Set([...N.map(n => n.key), ...P.cats.map(c => 'cat-' + c)])], bad = [];
    await Promise.all(keys.map(k => new Promise(r => { const im = new Image(); im.onload = () => { if (im.naturalWidth !== 256) bad.push(k); r(); }; im.onerror = () => { bad.push(k); r(); }; im.src = `assets/art/ri-${k}.webp`; })));
    const sh = N.filter(n => n.kind === 'eng'), gen = N.filter(n => n.kind === 'gen');
    return { n: keys.length, bad, fp: new Set(sh.filter(n => n.eng === 'fp').map(n => n.key)).size, pr: new Set(sh.filter(n => n.eng === 'pr').map(n => n.key)).size, gen: gen.every(n => n.key === 'u_' + n.u),
      drop: new Set(N.filter(n => n.name === 'Drop Tanks').map(n => n.key)).size }; });
  ck('pictures: every node and category has its 256 px scene (101 pictures: Firepower, Protection and Drop Tanks share one each, generations show their unit)', RP.bad.length === 0 && RP.n === 101 && RP.fp === 1 && RP.pr === 1 && RP.drop === 1 && RP.gen, RP);
  ck('list: ten category banners with a diamond icon, a name, a role line and the unit picture', list.length === 10 && list.every(x => x.dm && x.pic && x.name && x.role) && list[0].name === 'Infantry Corps' && list[9].name === 'Command & Logistics', list.map(x => x.name));
  ck('list: steps count and the green "open" chip (day 1: the IFV and Composite Armour, two fighters, the Frigate\'s gunnery; nine categories have one, Strategic Air opens on day 2)', list[1].cnt === '0/23' && /2 open/i.test(list[1].open) && /2 open/i.test(list[4].open) && /1 open/i.test(list[7].open) && list.filter(x => x.open).length === 9 && !list[6].open, list.map(x => [x.b, x.cnt, x.open]));
  ck('list: no Unit upgrades banner (Marks are in the tree)', await p.evaluate(() => !document.querySelector('.rs-ban.marks') && !/Marks/.test(document.querySelector('.rs-list').innerText)), null);
  ck('list: the note says Firepower and Protection cost few rare materials', await p.evaluate(() => /Firepower and Protection cost few rare materials/.test(document.querySelector('.rs-note').innerText)), null);
  // ---- Armoured Forces on day 1
  await cat('arm');
  const g = await p.evaluate(() => ({ heads: [...document.querySelectorAll('.rk-hd .rnl')].map(e => e.textContent), days: [...document.querySelectorAll('.rk-days span')].map(e => +e.textContent), rows: +getComputedStyle(document.querySelector('.rk-tree')).getPropertyValue('--rows'), t: +getComputedStyle(document.querySelector('.rk-tree')).getPropertyValue('--t'), tag: (document.querySelector('.rk-dtag') || {}).textContent || '', sticky: getComputedStyle(document.querySelector('.rk-days')).position + '/' + getComputedStyle(document.querySelector('.rk-hds')).position }));
  ck('grid: one column per unit line (plain names), a day column with only the days that hold a node (day 1 takes two rows: the tank and Composite Armour), the today line under day 1', g.heads.join('|') === 'Infantry Fighting Vehicle|Main Battle Tank' && g.days[0] === 1 && g.days.every((d, i) => !i || d > g.days[i - 1]) && g.days.includes(14) && g.days.includes(22) && !g.days.includes(2) && g.rows === g.days.length + 1 && g.t === 2 && /day/i.test(g.tag) && g.sticky === 'sticky/sticky', g);
  let mbt = await node('u_tank'), ifv = await node('u_ifv'), g2 = await node('tank_g2'), fp = await node('tank_fp'), arm = await node('tank_armor');
  ck('colours: standard issue is blue', mbt && /st-done/.test(mbt.cls) && /c-blue/.test(mbt.cls) && /75, 147, 201|154, 210, 243/.test(mbt.bg), mbt);
  ck('colours: a unit unlock open on day 1 is green', ifv && /st-open/.test(ifv.cls) && /c-green/.test(ifv.cls) && /88, 162, 83|147, 209, 136/.test(ifv.bg), ifv);
  ck('colours: a later node is grey, on the row of its day', g2 && /st-lock/.test(g2.cls) && /c-grey/.test(g2.cls) && g2.row === g.rows - g.days.length + g.days.indexOf(14) && /Opens on day 14/.test(g2.title) && /125, 137, 142|173, 183, 187/.test(g2.bg), [g2, g.days]);
  ck('layout: one column per line, the unlock on top; the day-1 upgrade beside the unlock takes the next row (one node per cell)', mbt.row === 0 && mbt.col === 1 && arm.row === 1 && arm.col === 1 && g2.col === 1 && fp.col === 1 && g2.row > fp.row, [mbt, arm, g2.row, fp.row]);
  ck('nodes carry no labels, locks or badges (the card names them)', [mbt, ifv, g2, fp, arm].every(x => !x.text && !x.badge), [mbt.text, fp.text]);
  // ---- the CoN grid: one straight line per column, white symbols by kind of upgrade (the same symbol everywhere), the today band and the dimmed rows
  ck('lines: one straight vertical line per column, no horizontal or dashed connectors', await p.evaluate(() => document.querySelectorAll('.rk-vl').length === 2 && !document.querySelector('.rs-lines, .rk-grid > svg')), null);
  ck('symbols: Firepower a crosshair, Protection a shield, engines speed, Wide Tracks terrain, Composite Armour a defence upgrade; the IFV\'s Firepower the same symbol as the tank\'s; no picture in an upgrade', await p.evaluate(() => { const k = id => { const s = document.querySelector(`.rnode[data-id="${id}"] svg.rk-sym`); return s ? s.getAttribute('class') : ''; }; return /s-fire\b/.test(k('tank_fp')) && /s-fire\b/.test(k('ifv_fp')) && /s-shield\b/.test(k('tank_pr')) && /s-speed/.test(k('tank_eng')) && /s-terrain/.test(k('tank_terr')) && /s-shieldUp/.test(k('tank_armor')) && !document.querySelector('.rnode.k-kit img, .rnode.k-eng img, .rnode.k-kit .rk-scn, .rnode.k-eng .rk-scn'); }), null);
  ck('today: a glowing line under today\'s rows, a tinted band above it, the rows below dimmed, a DAY tag at its left end', await p.evaluate(() => { const n = document.querySelector('.rk-now'), b = document.querySelector('.rk-band'), d = document.querySelector('.rk-dim'), tg = document.querySelector('.rk-dtag'); if (!n || !b || !d || !tg) return false; const N = n.getBoundingClientRect(), B = b.getBoundingClientRect(), D = d.getBoundingClientRect(), T = tg.getBoundingClientRect(); return Math.abs(B.bottom - N.top - 2) < 2 && Math.abs(D.top - N.top - 2) < 2 && getComputedStyle(n).boxShadow !== 'none' && T.top >= N.top - 1 && T.right <= N.left + 1; }), null);
  ck('grid: alternating column shading and + marks at the inner cell corners', await p.evaluate(() => /repeating-linear-gradient/.test(getComputedStyle(document.querySelector('.rk-colbg')).backgroundImage) && document.querySelectorAll('.rk-pl').length === +getComputedStyle(document.querySelector('.rk-tree')).getPropertyValue('--rows')), null);
  // ---- detail card and the two slots
  await p.click('.rnode[data-id="u_ifv"]'); await p.waitForTimeout(250);
  let c = await card();
  ck('card: tapping selects (does not start) and shows the model and level (France: AMX-10P), the unit, what it does, price, time, needs and START', c && /^AMX-10P LVL\. 1$/i.test(c.head) && /Infantry Fighting Vehicle/i.test(c.text) && /Fast armored infantry carrier/.test(c.text) && /Open since day 1/.test(c.text) && /\$59M/.test(c.text) && /^start$/i.test(c.btn.trim()) && /slot #1/i.test(c.title) && !c.dis && await p.evaluate(() => !window.__im.S.nations[0].research), c);
  await p.click('.rs-card .rs-db .btn'); await p.waitForTimeout(300);
  ifv = await node('u_ifv');
  const s1 = await p.evaluate(() => ({ slot: document.querySelector('#rslot1').innerText.replace(/\s+/g, ' '), R: { ...window.__im.S.nations[0].research }, cash: window.__im.S.nations[0].cash }));
  ck('slot #1: the project starts there, is paid for, the card closes and the node shows it runs', /Infantry Fighting Vehicle/.test(s1.slot) && s1.R.id === 'u_ifv' && s1.R.lv === 1 && s1.R.h === 72 && Math.round(s1.cash) === 4000 - 59 && /st-run/.test(ifv.cls) && /c-green/.test(ifv.cls) && !(await card()), [s1, ifv.cls]);
  await cat('tac'); await p.click('.rnode[data-id="u_int"]'); await p.waitForTimeout(200); c = await card();
  ck('card: the next project offers slot #2', /^start$/i.test(c.btn.trim()) && /slot #2/i.test(c.title), c);
  await p.click('.rs-card .rs-db .btn'); await p.waitForTimeout(300);
  const s2 = await p.evaluate(() => ({ slot: document.querySelector('#rslot2').innerText.replace(/\s+/g, ' '), R2: { ...window.__im.S.nations[0].research2 } })); const int = await node('u_int');
  ck('slot #2: runs at the same time', /Interceptor/.test(s2.slot) && s2.R2.id === 'u_int' && /st-run/.test(int.cls) && / q/.test(int.cls), [s2, int.cls]);
  await p.click('.rnode[data-id="u_jet"]'); await p.waitForTimeout(200); c = await card();
  ck('card: with both slots busy the button gives the reason from the rules', c.dis && /Both slots busy/.test(c.btn), c.btn);
  const asf = await node('u_asf');
  ck('elite: the Air Superiority Fighter keeps its gold star badge in its column header, none on the diamond', !asf.badge && await p.evaluate(() => !!document.querySelectorAll('.rk-hd')[2].querySelector('.relite') && document.querySelectorAll('.rk-hd')[2].classList.contains('elite')), asf);
  ck('connectors: no family or elbow lines, one straight line per column (three columns)', await p.evaluate(() => document.querySelectorAll('.rk-vl').length === 3 && !document.querySelector('.rs-lines')), null);
  await shut(); await p.waitForTimeout(150);
  await p.click('#rslot1'); await p.waitForTimeout(250);
  ck('tapping a running slot opens that node in its category', await p.evaluate(() => /Armoured Forces/i.test(document.querySelector('.rs-thead > b').innerText) && /sel/.test(document.querySelector('.rnode[data-id="u_ifv"]').className)), null);
  // ---- rules: days, levels, the spine
  const R = await p.evaluate(() => { const im = window.__im, S = im.S, N = S.nations[0], rs = im.rs, o = {}; N.research = N.research2 = null;
    o.day1 = [rs.can(0, 'tank_fp'), rs.why(0, 'tank_fp')]; S.hour = 2*24 + 1; o.day3 = [rs.can(0, 'tank_fp'), rs.why(0, 'tank_fp'), rs.day()];
    o.atk0 = rs.st(0, 'tank', 'atk'); o.def0 = rs.st(0, 'tank', 'def'); o.hp0 = rs.st(0, 'tank', 'hp');
    rs.start(0, 'tank_fp'); o.slot = { ...N.research }; for (let i = 0; i < 48; i++) rs.hour(0); o.fp1 = [rs.level(0, 'tank_fp'), rs.st(0, 'tank', 'atk'), N.research];
    o.fp2 = rs.why(0, 'tank_fp'); S.hour = 20*24; rs.grant(0, 'tank_fp', 2); o.fp3 = rs.why(0, 'tank_fp'); o.g3 = rs.why(0, 'tank_g3'); o.kitAfter = rs.why(0, 'u_stealth');
    rs.grant(0, 'tank_g2', 1); o.fp3b = rs.why(0, 'tank_fp'); o.hp1 = rs.st(0, 'tank', 'hp'); o.def1 = rs.st(0, 'tank', 'def');
    rs.grant(0, 'tank_fp', 3); rs.grant(0, 'tank_pr', 3); rs.grant(0, 'tank_armor', 1); rs.grant(0, 'tank_gun', 1); rs.grant(0, 'tank_eng', 1); rs.grant(0, 'tank_g3', 1);
    o.full = [rs.st(0, 'tank', 'atk'), rs.st(0, 'tank', 'def'), rs.st(0, 'tank', 'hp'), rs.st(0, 'tank', 'spd')]; o.done = rs.why(0, 'tank_fp');
    // health is taken as less damage
    const cap = N.capital, a = im.addArmy(0, cap, { tank: 10 }), a2 = im.addArmy(1, S.nations[1].capital, { tank: 10 }); rs.hurt(a, { armored: 0.02, soft: 0, air: 0, naval: 0 }, 1); rs.hurt(a2, { armored: 0.02, soft: 0, air: 0, naval: 0 }, 1);
    o.hurt = [a.w.tank + (10 - a.u.tank)*14, a2.w.tank + (10 - a2.u.tank)*14, (4 + rs.st(1, 'tank', 'def'))/(4 + rs.st(0, 'tank', 'def'))*14/21];
    // a later level dated after generation 2 needs it too (docs/RESEARCH.md 2.4): Rough-Ground Drills 2 (day 12) after Mechanized Infantry (day 9)
    S.hour = 12*24 + 1; N.research = N.research2 = null; o.terr1 = rs.why(0, 'inf_terr');   // level 1 (day 6) needs only the unlock
    rs.grant(0, 'inf_terr', 1); o.terr2 = rs.why(0, 'inf_terr'); rs.grant(0, 'inf_g2', 1); o.terr2b = rs.why(0, 'inf_terr');
    return o; });
  ck('levels: a later level dated after generation 2 needs it (Rough-Ground Drills 2 needs Mechanized Infantry; level 1 only the unlock)', R.terr2 === 'Needs Mechanized Infantry' && R.terr2b === '' && R.terr1 === '', [R.terr2, R.terr2b, R.terr1]);
  ck('days: a node cannot be started before its day (the tank\'s Firepower opens on day 3)', R.day1[0] === false && R.day1[1] === 'Opens on day 3' && R.day3[0] === true && R.day3[2] === 3, [R.day1, R.day3]);
  ck('levels: Firepower 1 takes 2 days and gives +12% attack', R.slot.id === 'tank_fp' && R.slot.lv === 1 && R.slot.h === 48 && R.fp1[0] === 1 && Math.abs(R.fp1[1] - R.atk0*1.12) < 1e-9 && R.fp1[2] === null, [R.slot, R.fp1]);
  ck('levels: each level has its own day; level 3 needs generation 2', R.fp2 === 'Opens on day 10' && R.fp3 === 'Needs Third-Generation MBT' && R.fp3b === '' && R.done === 'Researched', [R.fp2, R.fp3, R.fp3b, R.done]);
  ck('the spine: generation 3 needs generation 2; the Stealth Bomber needs two lines', R.g3 === 'Opens on day 22' && R.kitAfter === 'Needs Strategic Bomber Upgrade and Stealth Airframes', [R.g3, R.kitAfter]);
  ck('generations add health and defense (Third-Generation MBT: health 14 to 18, defense +1)', R.hp0 === 14 && R.hp1 === 18 && Math.abs(R.def1 - (R.def0 + 1)) < 1e-9, [R.hp0, R.hp1, R.def0, R.def1]);
  ck('a fully researched tank: attack 16.8, defense 11.2, health 21, speed 8 (the plan, section 6.4)', Math.abs(R.full[0] - 16.8) < 1e-6 && Math.abs(R.full[1] - 11.2) < 1e-6 && R.full[2] === 21 && R.full[3] === 8, R.full);
  ck('health counts in battle: the same hit wounds the upgraded tanks less, by health and defense', R.hurt[0] < R.hurt[1] && Math.abs(R.hurt[0]/R.hurt[1] - R.hurt[2]) < 1e-6, R.hurt);
  // ---- the screen after research: partly levelled, done, the card's level list and before / after
  await p.evaluate(() => { const im = window.__im; im.S.nations[0].tech.tank_fp = 2; im.S.nations[0].tech.tank_pr = 1; im.S.nations[0].tv++; im.S.hour = 10*24 + 2; im.S.nations[0].rare = 1*RES_K; });
  await cat('arm'); fp = await node('tank_fp'); const pr = await node('tank_pr'), gun = await node('tank_gun');
  ck('colours: a partly levelled node whose next level waits for generation 2 is blue', /part/.test(fp.cls) && /c-blue/.test(fp.cls) && /st-lock/.test(fp.cls) && !fp.badge, fp);
  ck('colours: a partly levelled node whose next level is open is green (Protection 2 on day 11), also when it cannot be paid for yet', /part/.test(pr.cls) && /c-green/.test(pr.cls) && /st-open/.test(pr.cls) && !pr.badge, pr);
  await p.click('.rnode[data-id="tank_pr"]'); await p.waitForTimeout(200); c = await card();
  ck('card: every level with its day, price and time; before and after for your nation; rare materials short in days of income', /^[\w -]+ LVL\. [1-8]$/i.test(c.head) && /Protection 2 for every Main Battle Tank/.test(c.text) && /Defense \+12% in all/.test(c.text) && /Defense \+25% in all/.test(c.text) && /Day 18/.test(c.text) && /Defense [\d.]+ [\d.]+/.test(c.text.replace(/\s+/g, ' ')) && /rare materials? short/.test(c.text) && c.dis && /Needs [\d,]+ more rare materials?/.test(c.btn), c);
  await p.evaluate(() => { window.__im.S.nations[0].rare = 4000*RES_K; });
  // ---- Strategic Air: the Stealth Bomber's two requirements
  await cat('str'); const stl = await node('u_stealth'), up = await node('bomb_up');
  ck('Stealth Bomber: its own column, on a row below the Strategic Bomber Upgrade, no tag or line on the tree (the card names both needs)', stl && up && stl.col !== up.col && stl.row > up.row && !stl.badge && !stl.text && /c-grey/.test(stl.cls), [stl, up]);
  await p.click('.rnode[data-id="u_stealth"]'); await p.waitForTimeout(200);
  await p.click('.rs-card button.rs-dr.jump'); await p.waitForTimeout(300);
  ck('card: tapping the requirement from another category jumps there', await p.evaluate(() => /Tactical Air/i.test(document.querySelector('.rs-thead > b').innerText) && /sel/.test(document.querySelector('.rnode[data-id="jet_lo"]').className)), null);
  await shut(); await cat('uns'); await p.click('.rnode[data-id="drone_g2"]'); await p.waitForTimeout(200); c = await card();
  ck('card: a generation is a step of the unit (UAV II keeps look 1: CL-289 for France), shown with the unit\'s scene, tinted', /^CL-289 LVL\. \d$/i.test(c.head) && /a new generation of the Recon UAV/.test(c.text) && await p.evaluate(() => !!document.querySelector('.rs-card .rk-scene img') && !!document.querySelector('.rs-card .rk-tint') && !!document.querySelector('.rs-card .rk-scan')), c);
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
    for (const n of [1, 2, 3]){ const N = S.nations[n]; N.research = N.research2 = null; N.rPick = null; for (const k of ['cash', 'metal', 'iron', 'elec', 'rare']) N[k] = 3000*(k === 'cash' ? 1 : RES_K); for (let i = 0; i < 6 && (!N.research || !N.research2); i++) rs.aiTurn(n);
      o.kinds.push([N.research && K[N.research.id], N.research2 && K[N.research2.id]]); }
    return o; });
  ck('computer players fill both slots: one with science, one with engineering', A.kinds.every(k => k[0] && k[1] && (k[0] === 'eng') !== (k[1] === 'eng')), A.kinds);
  await p.close();
  // ---- phone: four columns fit beside the day column (no sideways scroll), the headers and the day column stay put, the card is a box over the tree
  const q = await boot({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await q.emulateMedia({ reducedMotion: 'reduce' });
  await q.evaluate(() => { window.__im.S.hour = 5*24; }); await q.click('[data-act="research-open"]'); await q.waitForTimeout(350); await q.click('[data-act="rbranch"][data-b="sup"]'); await q.waitForTimeout(300);
  const ph0 = await q.evaluate(() => { const sc = document.getElementById('rtscroll'); return { sw: sc.scrollWidth, cw: sc.clientWidth, pageW: document.documentElement.scrollWidth, card: !!document.querySelector('.rs-card'), cols: document.querySelectorAll('.rk-hd').length }; });
  ck('phone: four columns fit the phone beside the day column, nothing scrolls sideways', ph0.cols === 4 && ph0.sw <= ph0.cw + 1 && ph0.pageW <= 431 && !ph0.card, ph0);
  await q.evaluate(() => { document.getElementById('rtscroll').scrollTop = 120; }); await q.waitForTimeout(100);
  const ph1 = await q.evaluate(() => { const sc = document.getElementById('rtscroll').getBoundingClientRect(), d = document.querySelector('.rk-days').getBoundingClientRect(), h = document.querySelector('.rk-hds').getBoundingClientRect(); return { dayLeft: Math.round(d.left - sc.left), headTop: Math.round(h.top - sc.top) }; });
  ck('phone: the column headers stay in place while the tree scrolls, the day column at the left edge', ph1.dayLeft === 0 && ph1.headTop === 0, ph1);
  await q.evaluate(() => { document.querySelector('.rnode[data-id="art_radar"]').click(); }); await q.waitForTimeout(350);
  const ph2 = await q.evaluate(() => { const c = document.querySelector('.rs-card'), r = c.getBoundingClientRect(), x = c.querySelector('.rs-db').getBoundingClientRect(); return { pos: getComputedStyle(c.parentElement).position, l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), btn: x.bottom <= r.bottom + 1 && x.top >= r.top, text: c.innerText.replace(/\s+/g, ' ').slice(0, 300) }; });
  ck('phone: the card is a box over the tree, whole inside the screen, with START in view', ph2.pos === 'fixed' && ph2.l >= 0 && ph2.r <= 430 && ph2.t >= 0 && ph2.b <= 932 && ph2.btn && /Counter-Battery Radar/.test(ph2.text), ph2);
  await q.evaluate(() => { document.querySelector('.rs-card .rc-x').click(); }); await q.waitForTimeout(200);
  const ph3 = await q.evaluate(() => { const vis = e => !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; const h = document.querySelector('.rk-hd'); return { card: !!document.querySelector('.rs-card'), short: vis(h.querySelector('.rns')) && h.querySelector('.rns').textContent, long: vis(h.querySelector('.rnl')) }; });
  ck('phone: Esc-free close (the red button), and the column headers use the short names', !ph3.card && ph3.short === 'Artillery' && !ph3.long, ph3);
  await q.evaluate(() => { document.querySelector('[data-act="rback"]').click(); }); await q.waitForTimeout(150); await q.click('[data-act="rbranch"][data-b="cmd"]'); await q.waitForTimeout(300);
  const ph4 = await q.evaluate(() => ({ cols: document.querySelectorAll('.rk-hd').length, nodes: document.querySelectorAll('.rnode').length, solo: document.querySelectorAll('.rsolo').length, ftip: !document.getElementById('ftip').hidden, w: document.documentElement.scrollWidth }));
  ck('phone: Command & Logistics shows one column per doctrine (five since CBRN Defence), a diamond each; no tip card over the tree', ph4.cols === 5 && ph4.nodes === 5 && !ph4.solo && !ph4.ftip && ph4.w <= 431, ph4);
  // a 390 px phone: the banners stay scenes with their names whole; in every category every diamond is whole inside the tree, clear of the day column
  const r3 = await boot({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await r3.click('[data-act="research-open"]'); await r3.waitForTimeout(500);
  ck('phone 390: every banner is a scene; names not cut', await r3.evaluate(() => [...document.querySelectorAll('.rs-ban')].every(e => e.classList.contains('scene') && e.querySelector('.rs-bt b').scrollWidth <= e.querySelector('.rs-bt b').clientWidth + 1)), null);
  const lab = [];
  for (const c of ['inf', 'arm', 'sup', 'aas', 'tac', 'uns', 'str', 'nav', 'msl', 'cmd']){ await r3.evaluate(() => { const x = document.querySelector('[data-act="rback"]'); if (x) x.click(); }); await r3.waitForTimeout(120); await r3.click(`[data-act="rbranch"][data-b="${c}"]`); await r3.waitForTimeout(250);
    lab.push(await r3.evaluate(c => { const d = document.querySelector('.rk-days').getBoundingClientRect(), sc = document.getElementById('rtscroll'), W = document.documentElement.clientWidth, cells = new Set();
      let bad = 0, dup = 0; for (const n of document.querySelectorAll('.rnode')){ const r = n.querySelector('.dm').getBoundingClientRect(), k = getComputedStyle(n).getPropertyValue('--c') + ':' + getComputedStyle(n).getPropertyValue('--r'); if (cells.has(k)) dup++; cells.add(k); if (r.left < d.right - 2 || r.right > W) bad++; }
      return { c, bad, dup, side: sc.scrollWidth > sc.clientWidth + 1 }; }, c)); }
  ck('phone 390: in every category one node per cell, every diamond inside the screen and clear of the day column, no sideways scroll', lab.length === 10 && lab.every(x => !x.bad && !x.dup && !x.side), lab);
  await r3.close();
  await q.close();
  const bad = checks.filter(c => !c.ok);
  console.log(JSON.stringify({ checks: checks.length, failed: bad, errors: errs }, null, 1)); await b.close(); process.exit(bad.length || errs.length ? 1 : 0); })();
