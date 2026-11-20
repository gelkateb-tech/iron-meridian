// The research screen like Conflict of Nations (docs/QUEUE.md RESEARCH-CON): the card's fields, the three node colours, the today line moving one
// row per game day, the nation group's banner colour and emblems, the model names (docs/DOCTRINES.md) and the one picture lookup (unit + nation +
// level -> side and scene picture, falling back to today's pictures), on a 440 px phone.
//   node .test/research-con.js   (bash tools/mkpage.sh first; exits 1 on a failed check or a page error)
// The tank pictures (the tank's atlases, assets/art/ula-tank-*) may or may not be in assets/art: the checks read the page's own table (UL_CELL: the atlas cell of every picture) and expect the lookup
// to follow it either way.
const pickNation = require('./pick-nation.js');
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(), errs = [], checks = [];
  const ck = (name, ok, info) => { checks.push({ name, ok: !!ok, info }); if (process.env.V) console.log(ok ? 'ok  ' : 'FAIL', name); };
  const boot = async nation => { const p = await b.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    p.on('pageerror', e => errs.push(nation + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(nation + ' console: ' + m.text()); });
    await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
    await pickNation(p, nation); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.waitForTimeout(800);
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await p.evaluate(() => { const N = window.__im.S.nations[0]; for (const k of ['cash', 'oil', 'metal', 'iron', 'elec', 'rare', 'mp']) N[k] = 4000*(isGood(k) ? RES_K : 1); N.research = N.research2 = null; window.__im.S.hour = 3*24 + 2; });
    await p.click('[data-act="research-open"]'); await p.waitForTimeout(300); return p; };
  const cat = async (p, c) => { await p.evaluate(() => { const x = document.querySelector('[data-act="rback"]'); if (x) x.click(); }); await p.waitForTimeout(100); await p.click(`[data-act="rbranch"][data-b="${c}"]`); await p.waitForTimeout(250); };
  const tap = async (p, id) => { await p.evaluate(() => { const x = document.querySelector('.rs-card [data-act="rcard-x"]'); if (x) x.click(); }); await p.waitForTimeout(80); await p.evaluate(id => document.querySelector(`.rnode[data-id="${id}"]`).click(), id); await p.waitForTimeout(250); };
  const cardOf = p => p.evaluate(() => { const c = document.querySelector('.rs-card'); if (!c) return null; const q = s => c.querySelector(s), t = s => (q(s) || {}).innerText || '';
    return { head: t('.rk-ch h2'), icon: !!q('.rk-ch > svg'), close: !!q('.rk-ch [data-act="rcard-x"]') && /229, 80, 74|179, 36, 31/.test(getComputedStyle(q('.rk-ch .rk-x')).backgroundImage),
      sdm: !!q('.rk-cs .rk-sdm .dm'), sdmPic: (q('.rk-cs .rk-sdm img') || {}).dataset?.ul || (q('.rk-cs .rk-sdm img') || {}).src || (q('.rk-cs .rk-sdm .rk-scn') || { style: {} }).style.backgroundImage || '', sdmRank: !!q('.rk-cs .rk-sdm .rk-rank'), note: t('.rk-note'),
      unl: t('.rk-unl'), unlLock: !!q('.rk-unl svg'), notch: getComputedStyle(q('.rk-cp'), '::before').borderTopWidth, box: t('.rk-ub b'), rank: c.querySelectorAll('.rk-ub .rk-rank path').length,
      emb: [...c.querySelectorAll('.rk-gs .rk-gi')].map(e => e.title), scene: (q('.rk-scene img') || {}).dataset?.ul || (q('.rk-scene img') || {}).src || '', tint: !!q('.rk-scene .rk-tint') && getComputedStyle(q('.rk-scene .rk-tint')).mixBlendMode === 'color',
      scan: /repeating-linear-gradient/.test(getComputedStyle(q('.rk-scene .rk-scan')).backgroundImage), imgGrey: /grayscale/.test(getComputedStyle(q('.rk-scene img')).filter),
      tags: [...c.querySelectorAll('.rk-scene .rk-tag')].map(e => ({ t: e.innerText.trim(), svg: !!e.querySelector('svg'), dark: /rgba\((3[0-9]|4[0-9]), (4[0-9]|5[0-9])/.test(getComputedStyle(e).backgroundColor), left: Math.round(e.getBoundingClientRect().left - q('.rk-scene').getBoundingClientRect().left) })),
      desc: t('.rk-desc p'), costs: [...c.querySelectorAll('.rk-cf .rk-c')].map(e => ({ img: !!e.querySelector('img'), amt: e.innerText.trim() })), watch: !!q('.rk-cf .rk-time svg'), time: t('.rk-cf .rk-time b'),
      start: (q('.rk-cf [data-act="research"]') || {}).innerText || '', startDis: !!(q('.rk-cf [data-act="research"]') || {}).disabled, startBg: q('.rk-cf [data-act="research"]') ? getComputedStyle(q('.rk-cf [data-act="research"]')).backgroundImage : '',
      inView: (() => { const r = c.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; })() }; });
  // ================= Russia (Eastern group) =================
  const p = await boot('Russia');
  const D = await p.evaluate(() => { const rs = window.__im.rs; return { g: rs.group(0), files: [...rs.ulFiles().keys()], ban: getComputedStyle(document.querySelector('.rk-top')).getPropertyValue('--g1').trim(), emb: !!document.querySelector('.rk-ban .rk-bemb svg.rk-emb'), h1: document.querySelector('.rk-ban h1').innerText, sub: !!document.querySelector('.rs-cnt'),
    back: !!document.querySelector('.rk-ban .rk-back'), x: !!document.querySelector('.rk-ban .rk-x'), slots: [...document.querySelectorAll('.rk-slots .rs-slot')].map(e => ({ t: e.innerText.trim(), dm: !!e.querySelector('.rk-sem'), rib: getComputedStyle(e.querySelector('.rk-rib')).backgroundImage })) }; });
  const HAVE = new Set(D.files);
  ck('banner: RESEARCH in the Eastern group\'s red, back and close buttons, the group emblem in a white diamond, no subtitle', D.g === 'east' && D.ban === '#b21d31' && D.emb && /^research$/i.test(D.h1) && !D.sub && D.back && D.x, D);
  ck('slots: two boxes, each a diamond emblem and a SLOT #n ribbon in the banner colour; no "+" and no "Choose a project"', D.slots.length === 2 && D.slots.every((s, i) => s.t === `SLOT #${i + 1}` && s.dm && /178, 29, 49/.test(s.rib)), D.slots);
  // the lookup and the model names
  const LK = await p.evaluate(() => { const rs = window.__im.rs, N = window.__im.S.nations[0], o = {}; o.l1 = rs.look('tank', 0); for (const id of ['tank_armor', 'tank_fp']) rs.grant(0, id, 1); rs.grant(0, 'tank_pr', 1); o.l4 = rs.look('tank', 0);
    o.l7 = rs.look('tank', 0, 7); o.heli = rs.look('bomb', 0); o.para = rs.look('para', 0, 1); o.uav = rs.look('drone', 0); o.us = rs.look('tank', 1); o.us0 = window.__im.S.nations[1].name;
    o.m = [rs.model('tank', 'east', 1), rs.model('tank', 'east', 2), rs.model('tank', 'east', 3), rs.model('para', 'nato', 2), rs.model('cm', 'china', 1), rs.model('jam', 'europe', 3)];
    for (const id of ['tank_armor', 'tank_fp', 'tank_pr']) delete N.tech[id]; N.tv++; return o; });
  const side = (g, k) => HAVE.has(`ul-tank-${g}-${k}-side`) ? `ul-tank-${g}-${k}-side` : null;
  ck('names: the Eastern tank is T-72, T-90, T-14 by look; Paratroopers share the infantry names; missiles have names; a name not found yet is null', LK.m.join('|') === 'T-72|T-90|T-14|M4A1|CJ-10|' && LK.l1.name === 'T-72' && LK.l4.name === 'T-90' && LK.l7.name === 'T-14', [LK.m, LK.l1.name, LK.l4.name]);
  ck('lookup: unit + nation + level -> the group\'s look (level 1-3 look 1, 4-6 look 2, 7-8 look 3), each from the files that exist', LK.l1.look === 1 && LK.l4.look === 2 && LK.l7.look === 3 && LK.l1.side === side('east', 1) && LK.l4.side === (side('east', 2) || side('east', 1)) && LK.l1.group === 'east', [LK.l1, LK.l4]);
  ck('lookup: a unit with no new pictures falls back to today\'s picture (Strategic Bomber: no side cut-out, the scene ri-u_bomb)', LK.heli.side === null && LK.heli.scene === 'assets/art/ri-u_bomb.webp', LK.heli);
  ck('lookup: the Recon UAV\'s look follows its generations', LK.uav.look === 1, LK.uav);
  // a missing look falls back to the nearest earlier look of the group (the list is the page's: take look 2 out for a moment)
  const FB = await p.evaluate(() => { const F = window.__im.rs.ulFiles(), had = new Map(F), c = F.get('ul-tank-east-1-side') || {}; F.set('ul-tank-east-1-side', c); F.set('ul-tank-east-1-scene', c); F.delete('ul-tank-east-2-side'); F.delete('ul-tank-east-2-scene');
    const r = window.__im.rs.look('tank', 0, 5); F.clear(); for (const [k, v] of had) F.set(k, v); return r; });
  ck('lookup: a look not made yet shows the group\'s nearest earlier look', FB.look === 2 && FB.side === 'ul-tank-east-1-side' && FB.scene === 'ul-tank-east-1-scene', FB);
  // the tree: Air Assault on day 4 (rows 1 3 4 5 6 7 8 14 ...)
  await cat(p, 'aas');
  const T4 = await p.evaluate(() => { const t = document.querySelector('.rk-tree'), cs = getComputedStyle(t), now = document.querySelector('.rk-now').getBoundingClientRect(), g = document.querySelector('.rk-grid').getBoundingClientRect(), rh = parseFloat(cs.getPropertyValue('--rh'));
    const st = id => document.querySelector(`.rnode[data-id="${id}"]`).className;
    return { t: +cs.getPropertyValue('--t'), y: Math.round(now.top + 2 - g.top), rh, days: [...document.querySelectorAll('.rk-days span')].map(e => e.textContent), cal: !!document.querySelector('.rk-thead .rk-cal svg'), catIc: (document.querySelector('.rk-thead .rk-cat') || { innerHTML: '' }).innerHTML.length,
      name: document.querySelector('.rk-thead > b').innerText.trim(), heads: [...document.querySelectorAll('.rk-hd')].map(e => ({ t: e.innerText.trim(), img: !!e.querySelector('img, .rpic-s'), n: !!e.querySelector('small') })),
      heli: st('u_heli'), fp: st('heli_fp'), para: st('u_para'), labels: [...document.querySelectorAll('.rnode')].every(e => !e.innerText.trim() && !e.querySelector('.rbdg, .rlv, .rgn, .rbadge-e')), syms: [...document.querySelectorAll('.rnode.k-eng, .rnode.k-kit')].every(e => e.querySelector('svg.rk-sym') && !e.querySelector('img, .rk-scn')) }; });
  ck('tree: the category header has a calendar, a white silhouette and the name; the day column only the days that hold a node', T4.cal && T4.catIc > 50 && /^Air Assault$/i.test(T4.name) && T4.days.join(' ').startsWith('1 3 4 5 6 7 8 14'), T4);
  ck('tree: column headers are plain text (no picture, no count)', T4.heads.length === 2 && T4.heads.every(h => h.t && !h.img && !h.n), T4.heads);
  ck('today: on day 4 the line sits under the day-4 row (row 3)', T4.t === 3 && Math.abs(T4.y - 3*T4.rh) <= 2, [T4.t, T4.y, T4.rh]);
  ck('colours: an unlock whose day has come is green, an upgrade of a unit not researched grey, Paratroopers (day 3) green', /c-green/.test(T4.heli) && /c-grey/.test(T4.fp) && /c-green/.test(T4.para), [T4.heli, T4.fp, T4.para]);
  ck('nodes: no labels, locks or badges; every upgrade a white symbol drawn in code, no photo', T4.labels && T4.syms, null);
  // the line moves down one row per game day
  await p.evaluate(() => { window.__im.S.hour += 24; window.__im.rs.RV(); }); await cat(p, 'aas');
  const T5 = await p.evaluate(() => ({ t: +getComputedStyle(document.querySelector('.rk-tree')).getPropertyValue('--t'), y: Math.round(document.querySelector('.rk-now').getBoundingClientRect().top + 2 - document.querySelector('.rk-grid').getBoundingClientRect().top) }));
  ck('today: a game day later (day 5) the line has moved down one row', T5.t === 4 && Math.abs(T5.y - T4.y - T4.rh) <= 2, [T4, T5]);
  // researched: blue; its upgrades whose day has come turn green
  await p.evaluate(() => { const N = window.__im.S.nations[0]; N.tech.u_heli = 1; N.tv++; }); await cat(p, 'aas');
  const T6 = await p.evaluate(() => ({ heli: document.querySelector('.rnode[data-id="u_heli"]').className, fp: document.querySelector('.rnode[data-id="heli_fp"]').className, atgm: document.querySelector('.rnode[data-id="heli_atgm"]').className }));
  ck('colours: a researched unit is blue; its Firepower (day 3) turns green; a later upgrade (day 8) stays grey', /c-blue/.test(T6.heli) && /st-done/.test(T6.heli) && /c-green/.test(T6.fp) && /c-grey/.test(T6.atgm), T6);
  // a category before its first day: the line at the top, everything below dimmed, no band
  await p.evaluate(() => { window.__im.S.hour = 2; }); await cat(p, 'str');
  const T0 = await p.evaluate(() => ({ t: +getComputedStyle(document.querySelector('.rk-tree')).getPropertyValue('--t'), band: !!document.querySelector('.rk-band'), first: document.querySelector('.rk-days span').textContent }));
  ck('today: Strategic Air on day 1 (its first day is 2): the line at the top, no band', T0.t === 0 && !T0.band && T0.first === '2', T0);
  await p.evaluate(() => { window.__im.S.hour = 3*24 + 2; });
  // the tank card (Eastern: T-72), a tank upgrade's card and START
  await cat(p, 'arm'); await tap(p, 'u_tank');
  let C = await cardOf(p);
  ck('card header: the research icon, "T-72 LVL. 1" in bold, the red close button', C && C.icon && /^T-72 LVL\. 1$/i.test(C.head) && C.close, C && C.head);
  ck('card: the small diamond with the tank\'s side picture and the rank chevron, the note "Starting level military unit or technology."', C.sdm && C.sdmRank && (HAVE.has('ul-tank-east-1-side') ? /ul-tank-east-1-side$/.test(C.sdmPic) : /ri-u_tank/.test(C.sdmPic)) && C.note === 'Starting level military unit or technology.', [C.sdmPic, C.note]);
  ck('card: the UNLOCKS bar with a lock, pointing down to the unit box "MAIN BATTLE TANK" with one rank chevron', /^unlocks$/i.test(C.unl) && C.unlLock && parseFloat(C.notch) > 10 && /^main battle tank$/i.test(C.box) && C.rank === 1, [C.unl, C.notch, C.box, C.rank]);
  ck('card: the emblem stripe shows the groups that field the T-72 (Eastern only)', C.emb.join('|') === 'Eastern', C.emb);
  ck('card scene: the group\'s tank scene, grey with a blue monitor tint and scanlines drawn in code, two dark tags "T-72 [icon]" and "Level 1" at the top left', (HAVE.has('ul-tank-east-1-scene') ? /ul-tank-east-1-scene$/.test(C.scene) : /ri-u_tank\.webp$/.test(C.scene)) && C.tint && C.scan && C.imgGrey
    && C.tags.length === 2 && C.tags[0].t === 'T-72' && C.tags[0].svg && C.tags[1].t === 'Level 1' && C.tags.every(t => t.dark && t.left < 20), [C.scene, C.tags]);
  ck('card: a short description; standard issue says so instead of START', /armoured tracked main battle tank/i.test(C.desc) && !C.start && C.inView, [C.desc, C.start]);
  await tap(p, 'tank_armor'); C = await cardOf(p);
  ck('card of an upgrade: the level it brings (T-72 LVL. 2), the step named in the note, costs as icons with amounts, the stopwatch and time, a big green START', /^T-72 LVL\. 2$/i.test(C.head) && /Composite Armour/.test(C.note) && C.costs.length >= 3 && C.costs.every(c => c.img && c.amt) && C.watch && /^\d+d( \d+h)?$|^\d+h$/.test(C.time) && /^start$/i.test(C.start.trim()) && !C.startDis && /111, 202, 76|61, 150, 39/.test(C.startBg) && C.inView, C);
  await p.evaluate(() => document.querySelector('.rs-card [data-act="research"]').click()); await p.waitForTimeout(300);
  const ST = await p.evaluate(() => ({ R: window.__im.S.nations[0].research, card: !!document.querySelector('.rs-card'), node: document.querySelector('.rnode[data-id="tank_armor"]').className, slot: document.querySelector('#rslot1').innerText.replace(/\s+/g, ' ') }));
  ck('START starts the research in slot #1 (the rules\' startResearch), the card closes, the node runs (green) and the slot shows it with its bar', ST.R && ST.R.id === 'tank_armor' && !ST.card && /st-run/.test(ST.node) && /c-green/.test(ST.node) && /SLOT #1 Composite Armour/.test(ST.slot), ST);
  await p.close();
  // ================= a model fielded by two groups: South Africa (Export) and the AKM =================
  const n = await boot('South Africa'); await cat(n, 'inf'); await tap(n, 'u_inf');
  const CN = await cardOf(n), NB = await n.evaluate(() => getComputedStyle(document.querySelector('.rk-top')).getPropertyValue('--g1').trim());
  ck('Export: the banner in the Export sand; the AKM card\'s stripe shows every group that fields the AKM (Eastern and Export)', NB === '#917447' && /^AKM LVL\. 1$/i.test(CN.head) && CN.emb.join('|') === 'Eastern|Export', [NB, CN.head, CN.emb]);
  await n.close();
  // ================= United States: the blue banner, its own tank =================
  const u = await boot('United States'); await cat(u, 'arm'); await tap(u, 'u_tank');
  const CU = await cardOf(u), UB = await u.evaluate(() => getComputedStyle(document.querySelector('.rk-top')).getPropertyValue('--g1').trim());
  ck('US/NATO: the blue banner and the M60A3 with its own picture', UB === '#2861c4' && /^M60A3 LVL\. 1$/i.test(CU.head) && (HAVE.has('ul-tank-nato-1-scene') ? /ul-tank-nato-1-scene/.test(CU.scene) : true), [UB, CU.head, CU.scene]);
  await u.close();
  const bad = checks.filter(c => !c.ok);
  console.log(JSON.stringify({ checks: checks.length, failed: bad, errors: errs }, null, 1)); await b.close(); process.exit(bad.length || errs.length ? 1 : 0); })();
