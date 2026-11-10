// Developer mode play test: node .test/devplay.js   (run node tools/build.js first)
// Loads the TEST build (dist/test/play.html over file://), starts a game, turns developer mode on and runs it at 50x for at least
// 5 in-game days while it exercises spawn (land, sea and air units for you and an AI nation), instant research (one project and
// "research all"), instant building / training / missiles, reveal map and unlimited resources. Prints the checks, the days played
// and the console errors; exits 1 if any check fails or any error was logged. Screenshots: .test/dev-*.png
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..'), PAGE = path.join(ROOT, 'dist', 'test', 'play.html'), OUT = __dirname;
const THREE_LOCAL = '/home/user/iron-meridian/tools/vendor/three.min.js';
(async () => {
  if (!fs.existsSync(PAGE)){ console.log('missing ' + PAGE + ': run node tools/build.js'); process.exit(1); }
  const b = await chromium.launch(); const errs = [], checks = {}, ok = (k, v, info) => { checks[k] = v ? 'PASS' : 'FAIL' + (info !== undefined ? ' ' + JSON.stringify(info) : ''); };
  const ctx = await b.newContext({ viewport: { width: 1400, height: 860 } });
  if (fs.existsSync(THREE_LOCAL)) await ctx.route('**/three.min.js', r => r.fulfill({ path: THREE_LOCAL, contentType: 'application/javascript' }));   // offline: local three.js
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto('file://' + PAGE); await p.waitForTimeout(800);
  if (await p.locator('[data-act="pick"]').count()){ await p.click('[data-act="pick"][data-p="0"]'); await p.click('[data-act="begin"]'); }
  await p.click('[data-act="start"]'); await p.click('#sp0'); await p.waitForTimeout(500);
  ok('test hooks present', await p.evaluate(() => !!window.__im));
  ok('DEV badge shown', await p.locator('#devbadge').isVisible());
  // the panel: badge click opens it, the backquote key toggles it
  await p.click('#devbadge'); await p.waitForTimeout(250);
  ok('panel opens from the badge', await p.locator('#devpanel').isVisible());
  await p.keyboard.press('`'); await p.waitForTimeout(100); const shut = await p.locator('#devpanel').isHidden();
  await p.keyboard.press('`'); await p.waitForTimeout(250); ok('backquote toggles the panel', shut && await p.locator('#devpanel').isVisible());
  await p.screenshot({ path: OUT + '/dev-panel.png' });
  const act = (attrs) => p.evaluate(a => { const e = document.createElement('button'); for (const k in a) e.setAttribute(k, a[k]); e.style.display = 'none'; document.body.appendChild(e); e.click(); e.remove(); }, attrs);   // a click on the game's own UI buttons
  const st = () => p.evaluate(() => { const S = window.__im.S, N = S.nations[0]; return { res: ['cash', 'oil', 'metal', 'iron', 'elec', 'rare', 'mp'].map(k => Math.round(N[k] || 0)), tech: Object.keys(N.tech || {}).length, armies: S.armies.length, hour: S.hour, speed: S.speed }; });
  // unlimited resources
  await p.click('[data-dev="tog"][data-k="res"]'); await p.waitForTimeout(100);
  let s0 = await st(); ok('unlimited resources: all 7 topped up', s0.res.every(v => v >= 500000), s0.res);
  // instant research: one project started through the research button completes at once (game paused)
  await p.click('[data-dev="tog"][data-k="research"]');
  const cand = await p.evaluate(() => { const N = window.__im.S.nations[0]; return window.__im.r2.tables().TECH.filter(t => !N.tech[t.id]).map(t => t.id); });
  let researched = null;
  for (const id of cand){ await act({ 'data-act': 'research', 'data-id': id }); const has = await p.evaluate(id => !!window.__im.S.nations[0].tech[id], id); if (has){ researched = id; break; } }
  const h0 = (await st()).hour;
  ok('instant research: a started project completes at once', !!researched && (await st()).hour === h0 && await p.evaluate(() => !window.__im.S.nations[0].research), { researched });
  await p.click('[data-dev="resall"]'); await p.waitForTimeout(100);
  const techAll = await p.evaluate(() => { const N = window.__im.S.nations[0], T = window.__im.r2.tables().TECH; return [T.filter(t => N.tech[t.id]).length, T.length]; });
  ok('research all: every technology', techAll[0] === techAll[1], techAll);
  // instant building, training and missiles in the capital (through the game's own build / recruit / missile buttons)
  await p.click('[data-dev="tog"][data-k="instant"]');
  const cap = await p.evaluate(() => window.__im.S.nations[0].capital);
  await p.evaluate(c => window.__im.selectProv(c), cap);
  const bld0 = await p.evaluate(c => ({ ...window.__im.S.bld[c] }), cap);
  for (const k of ['fac', 'silo', 'air']) await act({ 'data-act': 'build', 'data-k': k });
  const bld1 = await p.evaluate(c => ({ b: { ...window.__im.S.bld[c] }, cons: window.__im.S.cons[c] }), cap);
  ok('instant building: factory, silo, airbase done at once', bld1.b.fac > (bld0.fac || 0) && bld1.b.silo > (bld0.silo || 0) && bld1.b.air > (bld0.air || 0) && !bld1.cons, { bld0, bld1 });
  const tanks0 = await p.evaluate(c => window.__im.S.armies.filter(a => a.owner === 0 && a.at === c).reduce((s, a) => s + (a.u.tank || 0), 0), cap);
  for (let i = 0; i < 3; i++) await act({ 'data-act': 'recruit', 'data-t': 'tank' });
  const tr = await p.evaluate(c => ({ q: window.__im.S.queue[c].length, tanks: window.__im.S.armies.filter(a => a.owner === 0 && a.at === c).reduce((s, a) => s + (a.u.tank || 0), 0) }), cap);
  ok('instant production: 3 tanks trained at once', tr.q === 0 && tr.tanks === tanks0 + 3, { tanks0, tr });
  const cm0 = await p.evaluate(c => ((window.__im.S.mstock || {})[c] || { cm: 0 }).cm, cap);
  await act({ 'data-act': 'msl-build', 'data-k': 'cm' });
  const cm1 = await p.evaluate(c => ((window.__im.S.mstock || {})[c] || { cm: 0 }).cm, cap);
  ok('instant missiles: a cruise missile ready at once', cm1 === cm0 + 1, { cm0, cm1 });
  // reveal map
  await p.click('[data-dev="tog"][data-k="reveal"]'); await p.waitForTimeout(100);
  const rv = await p.evaluate(() => { const im = window.__im, v = im.air.visibleSet(0); const foes = im.S.armies.filter(a => a.owner > 0); return { vis: v.size, all: im.G.P.length, uav: v.uav.size, loc: v.loc.size, foes: foes.length, seen: foes.filter(a => im.air.armyVisible(a, v)).length }; });
  ok('reveal map: every province visible and identified, every force seen', rv.vis === rv.all && rv.loc === 0 && rv.seen === rv.foes, rv);
  // spawn: pick type / owner / count in the panel, arm the pick, click provinces on the map
  const spawnAt = async (t, o, k, which) => {
    await p.selectOption('#devt', t); await p.selectOption('#devo', String(o)); await p.fill('#devk', String(k)); await p.press('#devk', 'Tab'); await p.waitForTimeout(50);
    if (await p.getAttribute('[data-dev="pick"]', 'aria-pressed') !== 'true') await p.click('[data-dev="pick"]');
    const tgt = await p.evaluate(([w, o]) => { const im = window.__im, S = im.S, G = im.G, P = G.P;
      const land = q => !P[q].sea, mine = q => S.owner[q] === o;
      let q = -1;
      if (w === 'own') q = S.nations[o].capital;
      else if (w === 'sea'){ const c = S.nations[o].capital; const seas = P.filter(x => x.sea).map(x => x.id); q = seas.sort((a, b) => Math.hypot(P[a].x - P[c].x, P[a].y - P[c].y) - Math.hypot(P[b].x - P[c].x, P[b].y - P[c].y))[0]; }
      else if (w === 'border'){ const c = S.nations[o].capital; q = P[c].nbs.find(x => land(x) && mine(x)); }
      im.v3c.centerOn(P[q].x, P[q].y, 3); im.geoDirty();
      const [sx, sy] = im.toScreen(P[q].x, P[q].y); return { q, sx, sy, name: P[q].name }; }, [which, o]);
    await p.waitForTimeout(300);
    // the province under the click (the map's own lookup), then the click itself
    const hit = await p.evaluate(([x, y]) => window.__im.provAt(x, y), [tgt.sx, tgt.sy]);
    const n0 = await p.evaluate(() => window.__im.S.armies.length);
    const box = await p.locator('#map').boundingBox();   // (toScreen / provAt work in map-canvas pixels)
    await p.mouse.click(box.x + tgt.sx, box.y + tgt.sy); await p.waitForTimeout(150);
    const r = await p.evaluate(([n0, t, o, hit]) => { const S = window.__im.S, a = S.armies.slice(n0).find(a => a.owner === o && a.u[t] > 0 && a.at === hit); return { made: S.armies.length - n0, n: a ? a.u[t] : 0, air: a ? !!a.air : null, note: document.querySelector('#devpanel .dv-n').textContent }; }, [n0, t, o, hit]);
    return { ...tgt, hit, ...r };
  };
  const ai = await p.evaluate(() => window.__im.S.nations.find(N => N.id > 0 && N.alive).id);
  const sp = {};
  sp.tankMine = await spawnAt('tank', 0, 6, 'own');
  sp.infAI = await spawnAt('inf', ai, 4, 'own');
  sp.frigMine = await spawnAt('frig', 0, 2, 'sea');
  sp.subAI = await spawnAt('sub', ai, 3, 'sea');
  sp.jetMine = await spawnAt('jet', 0, 2, 'border');
  sp.artMine = await spawnAt('art', 0, 3, 'border');
  await p.evaluate(c => { const P = window.__im.G.P[c]; window.__im.v3c.centerOn(P.x - 20, P.y, 2.2); window.__im.geoDirty(); }, cap); await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/dev-spawn.png' });
  sp.tankAtSea = await spawnAt('tank', 0, 1, 'sea');
  const good = x => x.made === 1 && x.n > 0;
  ok('spawn: tanks for you on land', good(sp.tankMine) && sp.tankMine.n === 6, sp.tankMine);
  ok('spawn: infantry for an AI nation on land', good(sp.infAI) && sp.infAI.n === 4, sp.infAI);
  ok('spawn: frigates for you at sea', good(sp.frigMine) && sp.frigMine.n === 2, sp.frigMine);
  ok('spawn: submarines for an AI nation at sea', good(sp.subAI) && sp.subAI.n === 3, sp.subAI);
  ok('spawn: strike jets for you (an air wing)', good(sp.jetMine) && sp.jetMine.air === true, sp.jetMine);
  ok('spawn: artillery for you', good(sp.artMine), sp.artMine);
  ok('spawn: no tanks at sea', sp.tankAtSea.made === 0 && /cannot/.test(sp.tankAtSea.note), sp.tankAtSea);
  await p.keyboard.press('Escape');
  // 50x for at least 5 in-game days (an attack drops the clock to 1x and events open papers: put it back)
  await p.click('#sp6'); await p.waitForTimeout(100);
  ok('50x speed button', (await st()).speed === 6);
  await p.keyboard.press('9'); const s9 = (await st()).speed; await p.keyboard.press('9'); await p.keyboard.press('9');
  ok('key 9 cycles the developer speeds', s9 === 7 && (await st()).speed === 6, s9);
  const start = await st(), t0 = Date.now(); let resets = 0;
  while (Date.now() - t0 < 150000){
    const s = await st(); if (s.hour - start.hour >= 5*24 + 2) break;
    const modal = await p.evaluate(() => !document.getElementById('modal').hidden);
    if (modal) await p.keyboard.press('Escape');
    if (s.speed !== 6 && !(await p.evaluate(() => window.__im.S.over))){ await p.click('#sp6').catch(() => {}); resets++; }
    await p.waitForTimeout(1000);
  }
  const end = await st(), secs = (Date.now() - t0)/1000, days = (end.hour - start.hour)/24;
  ok('played at least 5 in-game days at 50x', days >= 5, { days, secs });
  ok('resources still topped up after play', end.res.every(v => v >= 400000), end.res);
  ok('research stays complete', end.tech >= techAll[1], end.tech);
  await p.screenshot({ path: OUT + '/dev-play.png' });
  // switches persist in localStorage
  const saved = await p.evaluate(() => { try { return JSON.parse(localStorage.getItem('iron-meridian-dev')); } catch (e) { return null; } });
  ok('switches saved in localStorage', saved && saved.res && saved.research && saved.instant && saved.reveal, saved);
  // phone: the badge stays in the top bar, the panel fits
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
  await p.click('#sp0').catch(() => {});
  if (await p.locator('#devpanel').isHidden()) await p.click('#devbadge');
  await p.waitForTimeout(300);
  const ph = await p.evaluate(() => { const b = document.getElementById('devbadge').getBoundingClientRect(), d = document.getElementById('devpanel').getBoundingClientRect(), h = document.querySelector('header').getBoundingClientRect();
    return { badge: [b.left, b.top, b.right, b.bottom].map(Math.round), panel: [d.left, d.top, d.right, d.bottom].map(Math.round), hdr: Math.round(h.bottom), sw: document.documentElement.scrollWidth, vw: innerWidth }; });
  ok('phone: badge in the top bar, panel on screen', ph.badge[3] <= ph.hdr && ph.badge[2] <= ph.vw && ph.panel[0] >= 0 && ph.panel[2] <= ph.vw && ph.sw <= ph.vw, ph);
  await p.screenshot({ path: OUT + '/dev-phone.png' });
  const fails = Object.entries(checks).filter(([, v]) => v !== 'PASS');
  console.log(JSON.stringify({ daysPlayed: +days.toFixed(2), realSeconds: Math.round(secs), speedResets: resets, hourStart: start.hour, hourEnd: end.hour, checks }, null, 1));
  console.log('ERRORS', errs.length ? errs : 'none');
  console.log(fails.length || errs.length ? 'DEVPLAY FAIL' : 'DEVPLAY OK');
  await b.close(); process.exit(fails.length || errs.length ? 1 : 0);
})();
