// The city cache settles at the closest zoom by night (CITIES redo): a nations-world game as India with Kolkata made the capital and every
// building of Kolkata at level V, the clock stopped at night over Kolkata, the view centred on it at hexPx 240 (view.s 20) on a desktop
// 1440x900 at dpr 2. Kolkata's square is the biggest in the delta and the squares of the towns round it (Khulna, Dhaka, Chuadanga, ...) overlap
// the view, so its day and night canvases with theirs are what the city budget (cbakeMax) has to hold.
//  - the map settles (mapBusy() false) within about 30 s of the view being set (35 s allowed: the town's plan and lots first, then its
//    canvases), and Kolkata's own day and night tiers in view are all made (cityDbg.has / night .exact);
//  - the city canvases stay near the budget (cityDbg.mem().total at most 136 MB, the budget's 124 MB and a tenth): over it only what is on
//    screen is made (no stand-in for later, nothing for the layer's margins);
//  - at rest nothing changes: 8 frames 0.85 s apart, the mean difference between one and the next (0-255 a channel) stays at most 0.1.
// (--phone: a Pixel 7 profile, 412x915 at dpr 2.625, touch; the same checks)
// node .test/city-settle.js [--page page.html] [--phone] [--v]   (needs bash tools/mkpage.sh; exit 1 on a failed check)
const { chromium, devices } = require('playwright'); const path = require('path'); const pickNation = require('./pick-nation.js');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d; };
const PAGE = arg('page', process.env.PAGE || 'page.html'), V = process.argv.includes('--v'), PHONE = process.argv.includes('--phone'), CITY = arg('city', 'Kolkata'), NAT = arg('nation', 'India');
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext(PHONE ? {...devices['Pixel 7']} : { viewport:{width:1440, height:900}, deviceScaleFactor:2 });
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + (path.isAbsolute(PAGE) ? PAGE : path.join(__dirname, PAGE))); await p.waitForTimeout(900);
  await p.click('[data-act="pickscn"][data-k="world64"]'); await p.waitForTimeout(300); await pickNation(p, NAT);
  await p.evaluate(() => document.querySelector('[data-act="begin"]').scrollIntoView()); await p.click('[data-act="begin"]'); await p.waitForTimeout(1300);
  if (await p.locator('[data-act="start"]').count()) await p.click('[data-act="start"]'); await p.waitForTimeout(3000);
  const kp = await p.evaluate(([city, nat]) => { const im = window.__im, S = im.S, G = im.G; S.speed = 0; im.SET.tipsOff = true; im.SET.cityLights = true; im.SET.saver = false; im.applySet();
    document.querySelectorAll('.toast,.modal').forEach(t => t.remove());
    const K = G.P.find(q => q.cityName === city), N = S.nations.find(n => n.name === nat), old = N.capital;
    if (old !== K.id){ G.P[old].capFlag = false; K.capFlag = true; N.capital = K.id; }
    for (const k of ['fac', 'air', 'arms', 'rec', 'fort', 'silo', 'yard']) if (k in S.bld[K.id]) S.bld[K.id][k] = 5;
    S.cons[K.id] = null; im.geoDirty();
    const h0 = Math.floor(S.hour/24)*24; let bh = h0, be = 9; for (let h = h0; h < h0 + 24; h++){ S.hour = h; const e = im.sunSinEl(K.id); if (e < be){ be = e; bh = h; } } S.hour = bh;
    const v = im.view, R = document.getElementById('map').getBoundingClientRect(); v.s = 240/12; v.x = R.width/2 - K.x*v.s; v.y = R.height/2 - K.y*v.s; im.redraw(); return K.id; }, [CITY, NAT]);
  const t0 = Date.now(); let settled = -1, ok = 0, last = null;
  while (Date.now() - t0 < 90000){ await p.waitForTimeout(250);
    const s = await p.evaluate(kp => { const im = window.__im, c = im.cityDbg; return {busy:im.mapBusy(), mem:c.mem(), has:c.has(kp), night:c.night(kp), want:c.want().length, jobs:c.jobs().length, st:c.state()}; }, kp);
    last = s; if (V && (Date.now() - t0) % 3000 < 260) console.log(((Date.now() - t0)/1000).toFixed(1) + 's', JSON.stringify(s));
    ok = !s.busy && s.has.exact && s.night.exact ? ok + 1 : 0; if (ok >= 4){ settled = Date.now() - t0 - 750; break; } }   // (not busy, and the town's own canvases all made: a pause in the bakes is no settle)
  const end = await p.evaluate(kp => { const im = window.__im, c = im.cityDbg; return {busy:im.mapBusy(), mem:c.mem(), has:c.has(kp), night:c.night(kp), want:c.want(), jobs:c.jobs(), keys:c.bakeKeys().length}; }, kp);
  // 8 frames at rest, 0.85 s apart: the mean absolute difference per channel between one and the next
  const diffs = []; await p.evaluate(() => { window.__D = null; });
  for (let k = 0; k < 8; k++){ await p.waitForTimeout(850);
    const d = await p.evaluate(() => { const c = document.getElementById('map'), w = c.width, h = c.height, a = c.getContext('2d').getImageData(0, 0, w, h).data, o = window.__D; window.__D = a;
      if (!o) return null; let s = 0; for (let i = 0; i < a.length; i += 4) s += Math.abs(a[i] - o[i]) + Math.abs(a[i + 1] - o[i + 1]) + Math.abs(a[i + 2] - o[i + 2]); return s/(a.length/4*3); });
    if (d != null) diffs.push(+d.toFixed(3)); }
  const res = {settleMs:settled, end:{busy:end.busy, mem:end.mem, has:end.has, night:end.night, want:end.want.slice(0, 30), jobs:end.jobs, keys:end.keys}, last:settled < 0 ? last : undefined, diffs, maxDiff:Math.max(...diffs)};
  console.log(JSON.stringify(res));
  const fails = []; if (settled < 0 || settled > 35000) fails.push(`the map did not settle within 35 s (${settled < 0 ? 'not in 90 s' : settled + ' ms'})`);
  if (!end.has.exact) fails.push(`${CITY}'s day tier ${end.has.S} in view not all made`); if (!end.night.exact) fails.push(`${CITY}'s night tier ${end.night.S} in view not all made`);
  if (end.mem.total > 136) fails.push(`the city canvases hold ${end.mem.total} MB (at most 136)`);
  if (Math.max(...diffs) > 0.1) fails.push('the map changes at rest: ' + diffs.join(' '));
  if (errs.length) fails.push('page errors: ' + errs.slice(0, 3).join(' | '));
  console.log(fails.length ? 'FAIL\n' + fails.join('\n') : 'OK'); await b.close(); process.exit(fails.length ? 1 : 0); })();
