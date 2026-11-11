// An economy-v1 save (before the research redesign) loads into the new tree and loses nothing (docs/RESEARCH.md 7.4).
// The fixture .test/fixtures/eco-v1-save.json was made by the old rules (commit 1eb7231): nation 0 has researched projects, unit Marks,
// a project in each slot and a Mark upgrade running; its "stats" are st() of every unit type under the old rules.
//   node .test/v4research-oldsave.js   (bash tools/mkpage.sh first; exits 1 on a failed check or a page error)
const { chromium } = require('playwright'); const fs = require('fs');
const FX = JSON.parse(fs.readFileSync(__dirname + '/fixtures/eco-v1-save.json', 'utf8'));
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); const errs = [], checks = [];
  const ck = (name, ok, info) => checks.push({ name, ok: !!ok, info });
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
  await p.click('[data-act="pick"][data-p="4"]'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.waitForTimeout(700);
  const r = await p.evaluate(save => { const im = window.__im, ok = im.restore(JSON.parse(JSON.stringify(save))), S = im.S, N = S.nations[0], out = {ok, rsv:S.rsv, day:im.rs.day(), stats:{}, lv:{}};
    for (const n of [0, 3]){ out.stats[n] = {}; for (const t of im.mob.UT()) out.stats[n][t] = {atk:im.rs.st(n, t, 'atk'), def:im.rs.st(n, t, 'def'), spd:im.rs.st(n, t, 'spd'), hp:im.rs.st(n, t, 'hp'), can:im.rs.unlocked(n, t)}; }
    for (const id of ['inf_armor', 'at_armor', 'inf_g2', 'inf_g3', 'at_warhead', 'u_ifv', 'u_spec', 'tank_armor', 'tank_gun', 'ifv_gun', 'u_jet', 'u_int', 'jet_pgm', 'int_msl', 'jet_lo', 'u_bomb', 'bomb_up', 'u_drone', 'drone_g2', 'frig_gun', 'crui_gun', 'u_carr', 'log1', 'msl1', 'sat1', 'art_radar', 'art_shell', 'u_mlrs', 'u_jam', 'u_heli', 'eco1',
      'tank_fp', 'tank_pr', 'inf_fp', 'inf_pr', 'awacs_pr', 'awacs_fp', 'bomb_fp', 'at_fp', 'at_pr', 'art_fp', 'art_guided', 'u_asf']) out.lv[id] = im.rs.level(0, id);
    out.old = Object.keys(N.tech).filter(id => /^(inf|tank|art|air|nav)[123]$|^(asf|awacs|mpa|bomb|drone|jam|swarm|sdrone|heli|para)1$|^uav\d$|^bomb[23]$/.test(id)); out.mk = N.mk === undefined; out.eng = N.eng && {...N.eng};
    out.slots = [N.research && {...N.research}, N.research2 && {...N.research2}]; out.uav = im.air.uavLv(0); out.lv3 = {tank_armor:im.rs.level(3, 'tank_armor'), inf_fp:im.rs.level(3, 'inf_fp'), drone_g2:im.rs.level(3, 'drone_g2')};
    out.log = ((S.log || [])[0] || {}).text || ''; return out; }, FX.save);
  ck('the old save loads', r.ok && r.rsv === 2, [r.ok, r.rsv]);
  { const low = []; for (const n of [0, 3]) for (const t in FX.stats[n]) for (const k of ['atk', 'def', 'spd', 'hp']) if (r.stats[n][t][k] < FX.stats[n][t][k] - 1e-9) low.push(`${n} ${t} ${k}: ${FX.stats[n][t][k]} -> ${r.stats[n][t][k]}`);
    ck('no unit stat is lower than under the old rules (two nations, every type)', !low.length, low);
    const lost = []; for (const n of [0, 3]) for (const t in FX.stats[n]) if (FX.stats[n][t].can && !r.stats[n][t].can) lost.push(n + ' ' + t);
    ck('every unit that could be built still can', !lost.length, lost);
    const s0 = FX.stats[0], s1 = r.stats[0];
    ck('same attack and defense where nothing was added (tank: armour, gun and Mark III)', Math.abs(s1.tank.atk - s0.tank.atk) < 1e-9 && Math.abs(s1.tank.def - s0.tank.def) < 1e-9, [s0.tank, s1.tank]);
    ck('Mechanized and Assault Infantry carry health now (infantry +4)', s1.inf.hp === s0.inf.hp + 4 && Math.abs(s1.inf.atk - s0.inf.atk) < 1e-9, [s0.inf, s1.inf]); }
  ck('old project ids are gone from N.tech, the Marks map too', !r.old.length && r.mk, [r.old, r.mk]);
  ck('projects became their nodes', ['inf_armor', 'at_armor', 'inf_g2', 'inf_g3', 'u_ifv', 'u_spec', 'tank_armor', 'tank_gun', 'ifv_gun', 'u_jet', 'u_int', 'jet_pgm', 'int_msl', 'jet_lo', 'u_bomb', 'bomb_up', 'u_drone', 'drone_g2', 'frig_gun', 'crui_gun', 'u_carr', 'log1', 'msl1', 'sat1', 'art_radar', 'art_shell', 'u_mlrs', 'u_jam', 'u_heli', 'eco1'].every(id => r.lv[id] === 1) && r.lv.at_warhead === 2 && r.uav === 2, r.lv);
  ck('Marks became Firepower and Protection levels (tank III -> 2, infantry II -> 1, anti-tank IV -> 3)', r.lv.tank_fp === 2 && r.lv.tank_pr === 2 && r.lv.inf_fp === 1 && r.lv.inf_pr === 1 && r.lv.at_fp === 3 && r.lv.at_pr === 3 && r.lv.bomb_fp === 1, r.lv);
  ck('the AWACS has Protection only', r.lv.awacs_pr === 3 && r.lv.awacs_fp === 0, [r.lv.awacs_pr, r.lv.awacs_fp]);
  ck('another nation is converted too', r.lv3.tank_armor === 1 && r.lv3.inf_fp === 1 && r.lv3.drone_g2 === 1, r.lv3);
  ck('converted levels stay although their day has not come (Heavy Bomber on day 5, its unlock opens on day 6)', r.day === 5 && r.lv.u_bomb === 1 && r.stats[0].bomb.can, [r.day, r.lv.u_bomb]);
  ck('the running projects keep running under their old ids', r.slots[0] && r.slots[0].id === 'art3' && r.slots[0].h === 30 && r.slots[1] && r.slots[1].id === 'asf1' && r.slots[1].h === 50, r.slots);
  ck('the running Mark upgrade keeps running', r.eng && r.eng.t === 'art' && r.eng.m === 2 && r.eng.h === 20, r.eng);
  ck('a dispatch explains the new tree', /New research tree/.test(r.log), r.log.slice(0, 120));
  // the screen: both old projects in their slots, and the small engineering bar
  await p.click('[data-act="research-open"]'); await p.waitForTimeout(400);
  const scr = await p.evaluate(() => ({ s1: (document.querySelector('#rslot1') || {}).innerText || '', s2: (document.querySelector('#rslot2') || {}).innerText || '', eng: (document.querySelector('.rs-eng') || {}).innerText || '', bans: document.querySelectorAll('.rs-ban').length }));
  ck('screen: the old projects show in the slots by name', /Guided Shells/.test(scr.s1) && /Air Superiority Fighters/.test(scr.s2), scr);
  ck('screen: the engineering bar of the earlier game shows', /Engineering \(from your earlier game\): Mobile Artillery Mk II/.test(scr.eng), scr.eng);
  await p.screenshot({ path: __dirname + '/v4research-oldsave.png' });
  // run them to the end: the projects convert, the Mark gives its two levels
  const e = await p.evaluate(() => { const im = window.__im, S = im.S, N = S.nations[0]; for (let i = 0; i < 60; i++) im.tick();
    return { art_guided: im.rs.level(0, 'art_guided'), u_asf: im.rs.level(0, 'u_asf'), art_fp: im.rs.level(0, 'art_fp'), art_pr: im.rs.level(0, 'art_pr'), eng: N.eng, slots: [N.research, N.research2].map(x => x && x.id), asf: im.rs.unlocked(0, 'asf'), art3: N.tech.art3, asf1: N.tech.asf1 }; });
  ck('the running projects finish and convert (Guided Shells, Air Superiority Fighter)', e.art_guided === 1 && e.u_asf === 1 && e.asf && e.art3 === undefined && e.asf1 === undefined, e);
  ck('the running Mark finishes as Firepower 1 and Protection 1', e.art_fp === 1 && e.art_pr === 1 && !e.eng, e);
  ck('screen: the engineering bar is gone when it is done', await p.evaluate(() => !/rs-eng/.test(window.__im.rs.html()) && /rs-slot empty/.test(window.__im.rs.html())), null);
  // saved again and loaded again: nothing is converted twice
  const again = await p.evaluate(() => { const im = window.__im, d = JSON.parse(im.rs.save()), before = JSON.stringify(im.S.nations[0].tech); const ok = im.restore(d); return { ok, same: JSON.stringify(im.S.nations[0].tech) === before, rsv: im.S.rsv, w: im.rs.level(0, 'at_warhead') }; });
  ck('a save of the new format is not converted again', again.ok && again.same && again.rsv === 2 && again.w === 2, again);
  // saves from before two slots: a project queued for slot #2 under an old id is read in the new tree (art1 -> Counter-Battery Radar starts);
  // one that cannot start yet (bomb3 -> the Stealth Bomber opens on day 14, the save is on day 5) is dropped with a dispatch that says why
  const q = await p.evaluate(save => { const im = window.__im, d = JSON.parse(JSON.stringify(save)), n0 = d.nations[0], n3 = d.nations[3];
    n0.research2 = null; n0.rqueue = 'bomb3'; n3.research = null; n3.research2 = null; n3.rqueue = 'art1'; for (const k of ['cash', 'metal', 'rare']) n3[k] = Math.max(n3[k] || 0, 400);
    const ok = im.restore(d), S = im.S, N0 = S.nations[0], N3 = S.nations[3];
    return { ok, s3: [N3.research && N3.research.id, N3.research2 && N3.research2.id], s0: [N0.research && N0.research.id, N0.research2 && N0.research2.id], rq: [N0.rqueue, N3.rqueue], log: (S.log || []).slice(0, 3).map(l => l.text) }; }, FX.save);
  ck('a queued old project starts in the new tree (art1 -> Counter-Battery Radar)', q.ok && q.s3.includes('art_radar') && q.rq[1] === undefined, q);
  ck('a queued old project that cannot start yet is reported, not dropped without a word (bomb3 -> Stealth Bomber, day 14)', q.s0[1] === null && q.rq[0] === undefined && q.log.some(t => /queued research Stealth Bombers did not start/.test(t) && /Stealth Bomber/.test(t) && /day 14/.test(t)), q);
  const bad = checks.filter(c => !c.ok);
  console.log(JSON.stringify({ checks: checks.length, failed: bad, errors: errs }, null, 1)); await b.close(); process.exit(bad.length || errs.length ? 1 : 0); })();
