// Play test as a player (owner: "play the current dev build as a player for 3 game days at 1x, 4x and 8x"). Loads the TEST build (dist/test/play.html,
// run node tools/build.js first) on the players' start screen (?start=nations: region tabs, the 68 nations), picks a nation, does what a player does
// (city sheet, build, mobilize, a pinpoint move, research, diplomacy, market, cities tab, army bar, save and load) and then runs the clock for N game days
// at each speed. Measures: console errors and warnings, page errors, freezes (long tasks and animation frames over 500 ms), the frame rate idle (paused),
// while panning and while the clock runs, and the real time one game day takes at each speed. Prints a table and one JSON line; exit 1 on a failed
// check, a page error or a console error.
//   node .test/playtest.js [--page dist/test/play.html] [--nation Germany] [--phone] [--speeds 1,4,8] [--days 3] [--out dir] [--label before]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const pickNation = require('./pick-nation.js');
const ROOT = path.join(__dirname, '..');
const A = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d; };
const PAGE = path.resolve(A('page', path.join(ROOT, 'dist', 'test', 'play.html'))), NATION = A('nation', 'Germany'), PHONE = process.argv.includes('--phone');
const SPEEDS = A('speeds', '1,4,8').split(',').map(Number), DAYS = +A('days', 3), OUT = A('out', __dirname), LABEL = A('label', '');
const BTN = {1:'#sp1', 2:'#sp2', 4:'#sp3', 8:'#sp4'}, SPV = {1:1, 2:2, 4:3, 8:4};   // speed -> its button and S.speed value
const VW = PHONE ? [390, 844] : [1440, 900];
const THREE_LOCAL = [path.join(ROOT, 'tools/vendor/three.min.js'), '/home/user/iron-meridian/tools/vendor/three.min.js'].find(f => fs.existsSync(f));
fs.mkdirSync(OUT, {recursive:true});
const tag = (LABEL ? LABEL + '-' : '') + (PHONE ? 'phone' : 'desk') + '-' + NATION.replace(/\W+/g, '');
(async () => {
  if (!fs.existsSync(PAGE)){ console.log('missing ' + PAGE + ': run node tools/build.js'); process.exit(1); }
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: VW[0], height: VW[1] }, deviceScaleFactor: PHONE ? 2 : 1, hasTouch: PHONE });
  if (THREE_LOCAL) await ctx.route('**/three.min.js', r => r.fulfill({ path: THREE_LOCAL, contentType: 'application/javascript' }));
  // frame and long-task recorder, from the first script on
  await ctx.addInitScript(() => { const R = window.__pt = { long: [], fr: [], t0: performance.now() };
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) R.long.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); } catch (e) { R.noLong = String(e); }
    let last = 0; const f = t => { if (last) R.fr.push([Math.round(t), +(t - last).toFixed(1)]); last = t; if (R.fr.length > 200000) R.fr.splice(0, 100000); requestAnimationFrame(f); }; requestAnimationFrame(f); });
  const p = await ctx.newPage(); const errs = [], warns = [], checks = {}, ok = (k, v, i) => { checks[k] = v ? 'PASS' : 'FAIL ' + JSON.stringify(i ?? null); };
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { const t = m.text(); if (/Failed to load resource|ERR_FILE|net::/.test(t)) return; if (m.type() === 'error') errs.push('console: ' + t); else if (m.type() === 'warning') warns.push(t); });
  const now = () => p.evaluate(() => performance.now());
  // frames between two page times: fps, the worst frame, frames over 500 ms; long tasks over 500 ms in that window
  const win = (t0, t1) => p.evaluate(([t0, t1]) => { const R = window.__pt, F = R.fr.filter(f => f[0] > t0 && f[0] <= t1), L = R.long.filter(l => l[0] >= t0 && l[0] <= t1);
    const d = F.map(f => f[1]).sort((x, y) => x - y); return { fps: +(F.length/((t1 - t0)/1000)).toFixed(1), worst: d.length ? Math.round(d[d.length - 1]) : null, p95: d.length ? Math.round(d[Math.floor(d.length*0.95)]) : null,
      slowF: F.filter(f => f[1] > 500).length, long: L.length, long500: L.filter(l => l[1] > 500).length, longMax: L.reduce((m, l) => Math.max(m, l[1]), 0) }; }, [t0, t1]);
  const st = () => p.evaluate(() => { const im = window.__im, S = im.S, me = S.nations.findIndex(N => !N.ai); let wars = 0, mine = 0; for (const k in S.rel) if (S.rel[k].st === 'war'){ wars++; if (k.split(',').map(Number).includes(me)) mine++; }
    return { hour: S.hour, speed: S.speed, over: S.over || null, modal: !document.getElementById('modal').hidden ? im.modalKind() : null, wars, mine, me }; });
  const shot = n => p.screenshot({ path: path.join(OUT, `pt-${tag}-${n}.png`) }).catch(() => {});
  const T = {}; const tl0 = Date.now();
  // ---- the start screen
  await p.goto('file://' + PAGE + '?start=nations'); await p.waitForSelector('[data-act="pick"]', { timeout: 60000 }); T.startScreenMs = Date.now() - tl0;
  const regs = await p.$$eval('[data-act="pickreg"]', a => a.map(x => x.dataset.k)); ok('start screen: no region tabs, one search box', regs.length === 0 && await p.locator('#pickq').count() === 1, regs);
  await shot('start');
  // one A-Z list of every nation
  const names = await p.$$eval('[data-act="pick"] b', a => a.map(x => x.textContent)); ok('start screen: all nations in one A-Z list', names.length === 68 && names.join() === names.slice().sort((x, y) => x.localeCompare(y)).join(), names.length);
  await pickNation(p, NATION); await p.waitForTimeout(150); await shot('picked');
  const tb = Date.now(); await p.click('[data-act="begin"]'); await p.waitForSelector('[data-act="start"]', { timeout: 60000 }); T.beginMs = Date.now() - tb;
  await p.click('[data-act="start"]'); await p.waitForFunction(() => window.__im && window.__im.S && window.__im.S.started && !window.__im.camFly, null, { timeout: 60000 }).catch(() => {});
  await p.click('#sp0').catch(() => {}); await p.waitForTimeout(1500);
  const me = await p.evaluate(n => { const S = window.__im.S, i = S.nations.findIndex(N => !N.ai); return { id: i, name: S.nations[i].name, cap: S.nations[i].capital, scn: S.scn || 'world' }; }, NATION);
  ok('the picked nation is played', me.name === NATION, me); await shot('home');
  // ---- idle (paused) and panning frame rates
  { const t0 = await now(); await p.waitForTimeout(5000); const t1 = await now(); T.idle = await win(t0, t1); }
  { const box = await p.locator('#map').boundingBox(), cx = box.x + box.width/2, cy = box.y + box.height/2; const t0 = await now();
    for (let k = 0; k < 4; k++){ await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 30; i++) await p.mouse.move(cx + (k % 2 ? -1 : 1)*i*8, cy + (k < 2 ? 1 : -1)*i*4); await p.mouse.up(); await p.waitForTimeout(150); }
    const t1 = await now(); T.pan = await win(t0, t1); }
  // ---- what a player does
  const esc = async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(150); };
  const center = (pid, z = 3) => p.evaluate(([q, z]) => { const im = window.__im, P = im.G.P[q]; im.v3c.centerOn(P.x, P.y, z); im.geoDirty(); }, [pid, z]);
  const clickWorld = async (x, y) => { const s = await p.evaluate(([x, y]) => window.__im.toScreen(x, y), [x, y]); const box = await p.locator('#map').boundingBox(); await p.mouse.click(box.x + s[0], box.y + s[1]); };
  // city sheet: a tap on the capital
  await center(me.cap); await p.waitForTimeout(600);
  { const P = await p.evaluate(q => { const P = window.__im.G.P[q]; return [P.x, P.y, P.cityName || P.name]; }, me.cap); await clickWorld(P[0], P[1]); await p.waitForTimeout(500);
    const side = await p.evaluate(() => { const s = document.getElementById('side'); return s ? s.innerText : ''; }); const selP = await p.evaluate(() => window.__im.sel.prov);
    if (selP !== me.cap){ await p.evaluate(q => window.__im.selectProv(q), me.cap); await p.waitForTimeout(300); }
    ok('city sheet opens on the capital', selP === me.cap || (await p.evaluate(() => window.__im.sel.prov)) === me.cap, { selP, side: side.slice(0, 80) }); await shot('city'); }
  // build: the first building button that is enabled
  { const r = await p.evaluate(q => { const S = window.__im.S, b = [...document.querySelectorAll('[data-act="build"]')].find(x => !x.disabled); if (!b) return { none: true }; const k = b.dataset.k; b.click(); return { k, cons: S.cons[q] ? S.cons[q].k : null }; }, me.cap);
    ok('build from the city sheet', r.cons != null, r); }
  // mobilize / train: an infantry (or the first unit that can be trained here)
  { await p.evaluate(q => window.__im.selectProv(q), me.cap); await p.waitForTimeout(200);
    const r = await p.evaluate(q => { const S = window.__im.S, q0 = S.queue[q].length, B = [...document.querySelectorAll('[data-act="recruit"]')].filter(x => !x.disabled), b = B.find(x => x.dataset.t === 'inf') || B[0]; if (!b) return { none: true, q0 }; b.click(); return { t: b.dataset.t, q0, q1: S.queue[q].length }; }, me.cap);
    ok('mobilize a unit in the capital', r.q1 > r.q0, r); }
  // a pinpoint move: an own land force to a point in a neighbouring own province (Move, then a tap on the map)
  { const pick = await p.evaluate(me => { const im = window.__im, S = im.S, G = im.G;
      const a = S.armies.filter(x => x.owner === me && !x.air && x.to === null && !x.path.length && !G.P[x.at].sea && Object.values(x.u).some(v => v > 0)).sort((x, y) => x.id - y.id)[0]; if (!a) return null;
      const q = G.P[a.at].nbs.find(v => !G.P[v].sea && S.owner[v] === me); if (q == null) return null; const P = G.P[q], A0 = G.P[a.at]; return { id: a.id, at: a.at, q, x: P.x + (A0.x - P.x)*0.15, y: P.y + (A0.y - P.y)*0.15 }; }, me.id);
    if (!pick) ok('a force to move', false);
    else { await center(pick.q, 3); await p.waitForTimeout(500); await p.evaluate(id => window.__im.selectArmy(id), pick.id); await p.waitForTimeout(250);
      const bar = await p.evaluate(() => !!document.querySelector('.abar') && document.querySelector('.abar').offsetParent !== null);
      ok('army bar shows for the selected force', bar); await shot('armybar');
      await p.keyboard.press('m'); await p.waitForTimeout(150); await clickWorld(pick.x, pick.y); await p.waitForTimeout(400);
      const r = await p.evaluate(id => { const a = window.__im.S.armies.find(x => x.id === id); return a ? { dest: a.dest || null, path: a.path.slice(), to: a.to } : null; }, pick.id);
      ok('pinpoint move ordered (Move + tap)', r && (r.path.length || r.to !== null) && r.dest && r.dest.p === pick.q, { pick, r }); await esc(); } }
  // research, diplomacy, market, cities: each opens (keys R, D, T, C) and closes
  for (const [key, kind] of [['r', 'research'], ['d', 'diplo'], ['t', 'market'], ['c', 'cities'], ['p', 'prod'], ['a', 'armies']]){
    await p.keyboard.press(key); await p.waitForTimeout(500); const k = await p.evaluate(() => !document.getElementById('modal').hidden ? window.__im.modalKind() : null);
    ok(`${kind} opens (${key.toUpperCase()})`, k === kind, k); await shot(kind);
    if (kind === 'research'){   // a tap on a project selects it; its Research button starts it (the first project that can start now)
      // (the research screen opens on its branches: a branch first, then its projects)
      const r = await p.evaluate(async () => { const N = window.__im.S.nations.find(N => !N.ai), wait = () => new Promise(r => setTimeout(r, 40)); let tried = 0, ids = 0;
        const brs = [...document.querySelectorAll('#modal [data-act="rbranch"]')].map(x => x.dataset.b);
        for (const br of brs.length ? brs : [null]){ if (br != null){ const bb = document.querySelector(`#modal [data-act="rbranch"][data-b="${br}"]`); if (!bb) continue; bb.click(); await wait(); }
          const L = [...new Set([...document.querySelectorAll('#modal [data-act="rsel"]')].map(x => x.dataset.id))]; ids += L.length;
          for (const id of L){ const s = document.querySelector(`#modal [data-act="rsel"][data-id="${id}"]`); if (!s) continue; s.click(); tried++; await wait();
            const b = [...document.querySelectorAll('#modal [data-act="research"]')].find(x => !x.disabled); if (b){ b.click(); return { branch: br, id: b.dataset.id, tried, on: !!(N.research || N.research2) }; } if (tried > 80) break; } }
        return { none: true, tried, ids, branches: brs.length }; });
      ok('start a research project', r.on, r); }
    await esc(); }
  // save to slot 1 and load it back (Settings)
  { await p.keyboard.press('o'); await p.waitForTimeout(400); const h0 = (await st()).hour, has = await p.locator('[data-act="slot-save"]').count();
    if (has){ await p.locator('[data-act="slot-save"]').first().click(); await p.waitForTimeout(400); await p.locator('[data-act="slot-load"]').first().click(); await p.waitForTimeout(1500); }
    const s = await st(); ok('save to a slot and load it', has > 0 && s.hour === h0 && (await p.evaluate(() => window.__im.S.nations.find(N => !N.ai).name)) === NATION, { has, h0, s }); await esc(); }
  await p.click('#sp0').catch(() => {}); await center(me.cap, 2); await p.waitForTimeout(500);
  // ---- the clock: N game days at each speed
  const runs = [];
  for (const sp of SPEEDS){ const s0 = await st(), btn = BTN[sp]; await p.click(btn); const tw0 = Date.now(), t0 = await now(); const marks = []; let resets = 0, modals = {}, lastH = s0.hour, stall = Date.now();
    const target = s0.hour + DAYS*24, limit = (sp === 1 ? 6*60 : sp === 4 ? 90 : 45)*1000*DAYS*2.5 + 60000;
    while (Date.now() - tw0 < limit){ const s = await st(); if (s.over) break;
      if (Math.floor(s.hour/24) > Math.floor(lastH/24)) marks.push([s.hour, Date.now()]); if (s.hour !== lastH){ lastH = s.hour; stall = Date.now(); }
      if (s.hour >= target) break;
      if (s.modal){ modals[s.modal] = (modals[s.modal] || 0) + 1; await esc(); }
      if (s.speed !== SPV[sp] && !s.modal){ resets++; await p.click(btn).catch(() => {}); }
      if (Date.now() - stall > 60000){ marks.push(['stalled', Date.now()]); break; }
      await p.waitForTimeout(250); }
    const t1 = await now(), s1 = await st(), wall = (Date.now() - tw0)/1000, days = (s1.hour - s0.hour)/24;
    const dayMs = []; for (let i = 1; i < marks.length; i++) if (typeof marks[i][0] === 'number' && typeof marks[i - 1][0] === 'number') dayMs.push(marks[i][1] - marks[i - 1][1]);
    const w = await win(t0, t1); await p.click('#sp0').catch(() => {}); await shot('x' + sp);
    runs.push({ speed: sp + 'x', days: +days.toFixed(2), wallS: Math.round(wall), secPerDay: +(wall/Math.max(days, 1e-6)).toFixed(1), dayS: dayMs.map(x => +(x/1000).toFixed(1)), fps: w.fps, worstFrameMs: w.worst, p95FrameMs: w.p95, frames500: w.slowF, longTasks: w.long, long500: w.long500, longMaxMs: w.longMax, speedResets: resets, modals, wars: s1.wars, warsWithMe: s1.mine, stalled: marks.some(m => m[0] === 'stalled') }); }
  const end = await st();
  const logs = await p.evaluate(() => { const S = window.__im.S, me = S.nations.findIndex(N => !N.ai), D = S.desks ? S.desks[me] : null, L = (D && D.log) || (window.__im.S.log) || []; return L.filter(e => /war|massing|attack/i.test(e.text)).slice(0, 12).map(e => `d${Math.floor(e.h/24) + 1} ${e.text}`); }).catch(() => []);
  const allLong = await p.evaluate(() => ({ n: window.__pt.long.length, over500: window.__pt.long.filter(l => l[1] > 500).map(l => l[1]), noLong: window.__pt.noLong || null }));
  ok('no page errors', !errs.some(e => e.startsWith('pageerror')), errs.slice(0, 5));
  ok('no console errors', !errs.some(e => e.startsWith('console')), errs.slice(0, 5));
  for (const r of runs) ok(`${r.speed}: ${DAYS} game days played`, r.days >= DAYS - 0.05 && !r.stalled, r);
  // ---- report
  const row = (c) => c.map((x, i) => String(x).padEnd([7, 7, 9, 22, 7, 10, 9, 9, 9, 8, 8].at(i) || 8)).join(' ');
  console.log(`PLAY TEST ${LABEL} ${PHONE ? 'phone 390x844' : 'desktop 1440x900'}  ${NATION} (${me.scn})  start screen ${T.startScreenMs} ms, building the campaign ${T.beginMs} ms`);
  console.log(`idle (paused) ${T.idle.fps} fps (worst frame ${T.idle.worst} ms, long tasks ${T.idle.long}, over 500 ms ${T.idle.long500})   panning ${T.pan.fps} fps (worst ${T.pan.worst} ms, p95 ${T.pan.p95} ms, long tasks ${T.pan.long}, over 500 ms ${T.pan.long500})`);
  console.log(row(['speed', 'days', 's/day', 'each day (s)', 'fps', 'worst ms', 'p95 ms', '>500ms', 'longmax', 'resets', 'wars(me)']));
  for (const r of runs) console.log(row([r.speed, r.days, r.secPerDay, r.dayS.join(' / ') || '-', r.fps, r.worstFrameMs, r.p95FrameMs, r.frames500 + r.long500, r.longMaxMs, r.speedResets, `${r.wars}(${r.warsWithMe})`]) + (Object.keys(r.modals).length ? '  popups ' + JSON.stringify(r.modals) : ''));
  console.log('long tasks in all: ' + allLong.n + (allLong.over500.length ? ', over 500 ms: ' + allLong.over500.join(', ') + ' ms' : ', none over 500 ms') + (allLong.noLong ? ' (no longtask API: ' + allLong.noLong + ')' : ''));
  if (logs.length) console.log('war dispatches:\n  ' + logs.join('\n  '));
  console.log('console warnings ' + warns.length + (warns.length ? ': ' + [...new Set(warns)].slice(0, 6).join(' | ') : ''));
  console.log('ERRORS ' + (errs.length ? errs.length + ': ' + [...new Set(errs)].slice(0, 8).join(' | ') : 'none'));
  const fails = Object.entries(checks).filter(([, v]) => v !== 'PASS'); for (const [k, v] of fails) console.log('FAIL ' + k + ' ' + v.slice(0, 300));
  console.log('JSON ' + JSON.stringify({ label: LABEL, phone: PHONE, nation: NATION, T, runs, end, checks, errs: errs.slice(0, 20), warns: warns.length }));
  console.log(fails.length || errs.length ? 'PLAYTEST FAIL' : 'PLAYTEST OK');
  await b.close(); process.exit(fails.length || errs.length ? 1 : 0);
})().catch(e => { console.log('PLAYTEST CRASH ' + (e.stack || e)); process.exit(2); });
