// Stealth Bomber, played in developer mode: node .test/stealth-play.js   (run node tools/build.js first)
// Loads the TEST build (dist/test/play.html), turns developer mode on (research all, unlimited resources, instant production), picks the
// Stealth Bomber in the developer panel's spawn list, mobilizes a wing through the game's own Mobilize button, sends raids on a SAM-defended
// enemy city, gives an AI enemy a stealth wing of its own, and plays at least 5 in-game days at 50x. Exits 1 on a failed check or a console error.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..'), PAGE = path.join(ROOT, 'dist', 'test', 'play.html'), OUT = __dirname;
const THREE_LOCAL = '/home/user/iron-meridian/tools/vendor/three.min.js';
(async () => {
  if (!fs.existsSync(PAGE)){ console.log('missing ' + PAGE + ': run node tools/build.js'); process.exit(1); }
  const b = await chromium.launch(); const errs = [], checks = {}, ok = (k, v, info) => { checks[k] = v ? 'PASS' : 'FAIL' + (info !== undefined ? ' ' + JSON.stringify(info) : ''); };
  const ctx = await b.newContext({ viewport: { width: 1400, height: 860 } });
  if (fs.existsSync(THREE_LOCAL)) await ctx.route('**/three.min.js', r => r.fulfill({ path: THREE_LOCAL, contentType: 'application/javascript' }));
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message + ' ' + String(e.stack || '').split('\n').slice(1, 4).join(' | ')));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto('file://' + PAGE); await p.waitForTimeout(800);
  if (await p.locator('[data-act="pick"]').count()){ await p.click('[data-act="pick"][data-p="0"]'); await p.click('[data-act="begin"]'); }
  await p.click('[data-act="start"]'); await p.click('#sp0'); await p.waitForTimeout(500);
  const act = (attrs) => p.evaluate(a => { const e = document.createElement('button'); for (const k in a) e.setAttribute(k, a[k]); e.style.display = 'none'; document.body.appendChild(e); e.click(); e.remove(); }, attrs);
  await p.click('#devbadge'); await p.waitForTimeout(250);
  await p.click('[data-dev="tog"][data-k="res"]'); await p.click('[data-dev="tog"][data-k="research"]'); await p.click('[data-dev="resall"]'); await p.click('[data-dev="tog"][data-k="instant"]'); await p.waitForTimeout(150);
  ok('research all includes Strategic Bomber Upgrade and Stealth Bombers', await p.evaluate(() => { const t = window.__im.S.nations[0].tech; return !!(t.bomb2 && t.bomb3 && t.air3); }));
  ok('the developer spawn list offers the Stealth Bomber', await p.evaluate(() => [...document.querySelectorAll('#devt option')].some(o => o.value === 'stealth' && /Stealth Bomber/.test(o.textContent))));
  // mobilize through the game's own buttons: Airbase to level III in the capital, then three Stealth Bombers
  const cap = await p.evaluate(() => window.__im.S.nations[0].capital);
  await p.evaluate(c => window.__im.selectProv(c), cap);
  for (let i = 0; i < 4; i++) await act({ 'data-act': 'build', 'data-k': 'fac' });
  for (let i = 0; i < 3; i++) await act({ 'data-act': 'build', 'data-k': 'air' });
  const air = await p.evaluate(c => window.__im.S.bld[c].air, cap);
  for (let i = 0; i < 3; i++) await act({ 'data-act': 'recruit', 'data-t': 'stealth' });
  const w0 = await p.evaluate(c => { const S = window.__im.S, w = S.armies.find(a => a.owner === 0 && a.air && a.u.stealth > 0); return w ? { id: w.id, n: w.u.stealth, base: w.air.base, name: armyName(w), range: wingRange(w) } : null; }, cap);
  ok('mobilized: three Stealth Bombers form one wing at the capital (Airbase III)', air >= 3 && w0 && w0.n === 3 && w0.base === cap && /Stealth Bomber Wing/.test(w0.name), { air, w0 });
  // an enemy within reach, at war, with a SAM stack in its nearest city; and a stealth wing of its own
  const T = await p.evaluate(({ cap, wid }) => { const im = window.__im, S = im.S, G = im.G, w = S.armies.find(a => a.id === wid), r = wingRange(w);
    const cs = G.P.filter(P => S.owner[P.id] > 0 && P.city && !P.sea && hexDist(G.P[cap].cc, P.cc) <= r).sort((x, y) => hexDist(G.P[cap].cc, x.cc) - hexDist(G.P[cap].cc, y.cc)); const P = cs[0], E = S.owner[P.id];
    S.rel['0,' + E] = { st: 'war', since: S.hour, until: null }; S.rel[E + ',0'] = S.rel['0,' + E];
    devSpawn(E, P.id, 'sam', 4); devSpawn(E, P.id, 'inf', 6); S.bld[P.id].fac = Math.max(3, S.bld[P.id].fac || 0);
    const ec = S.nations[E].capital; S.bld[ec].air = Math.max(3, S.bld[ec].air || 0); const ew = devSpawn(E, ec, 'stealth', 2);
    return { p: P.id, name: P.cityName || P.name, E, foe: S.nations[E].name, ew: ew ? ew.id : null, check: airCheck(w, P.id, null) }; }, { cap, wid: w0.id });
  ok('the wing can raid the enemy city', T.check.ok && T.check.kind === 'strike', T);
  ok('developer spawn gives an AI nation a stealth wing', T.ew != null);
    const sent = await p.evaluate(({ wid, t }) => orderAir(window.__im.S.armies.find(a => a.id === wid), t), { wid: w0.id, t: T.p });
  ok('raid ordered', sent === true);
  // play: 50x for at least 5 days; whenever the wing is home and rearmed it goes again
  await p.keyboard.press('`').catch(() => {}); await p.waitForTimeout(100);
  const h0 = await p.evaluate(() => window.__im.S.hour);
  await p.click('#sp6'); await p.waitForTimeout(100);   // the developer 50x button in the top bar
  ok('running at 50x', await p.evaluate(() => window.__im.S.speed === 6));
  let raids = 0, hour = h0; const t0 = Date.now();
  while (hour < h0 + 5*24 + 6 && Date.now() - t0 < 240000){ await p.waitForTimeout(400);
    if (await p.evaluate(() => !document.getElementById('modal').hidden)) await p.keyboard.press('Escape');   // an attack drops the clock to 1x and events open papers: put it back
    if (await p.evaluate(() => window.__im.S.speed !== 6)) await p.click('#sp6').catch(() => {});
    hour = await p.evaluate(({ wid, t }) => { const S = window.__im.S, w = S.armies.find(a => a.id === wid); if (w && !w.fly && !(w.air.cd > 0) && airCheck(w, t, null).ok) orderAir(w, t); return S.hour; }, { wid: w0.id, t: T.p }); }
  await p.screenshot({ path: OUT + '/stealth-play.png' });
  const end = await p.evaluate(({ wid, T }) => { const S = window.__im.S, w = S.armies.find(a => a.id === wid), log = (S.log || []).map(e => e.text);
    return { hour: S.hour, wing: w ? w.u.stealth : 0, raids: log.filter(t => /^Stealth raid on/.test(t)).length, sample: log.filter(t => /Stealth raid|bombers|Dogfight/.test(t)).slice(-4), enemyWing: S.armies.filter(a => a.owner === T.E && a.u.stealth > 0).length,
      sams: S.armies.filter(a => a.owner === T.E && a.at === T.p).reduce((s, a) => s + (a.u.sam || 0), 0), over: !!S.over }; }, { wid: w0.id, T });
  ok('played at least 5 in-game days', end.hour - h0 >= 5*24, { h0, end: end.hour });
  ok('stealth raids were flown and reported', end.raids >= 2, end);
  console.log(JSON.stringify({ days: (end.hour - h0)/24, end, checks }, null, 1));
  console.log('ERRORS', errs.length ? errs.slice(0, 8) : 'none');
  const bad = Object.values(checks).some(v => v !== 'PASS') || errs.length > 0; console.log(bad ? 'STEALTH PLAY FAILED' : 'STEALTH PLAY OK');
  await b.close(); process.exit(bad ? 1 : 0);
})();
