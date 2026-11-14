// The HQ flags (bnFlags in index.html): every HQ on the map flies its nation's real flag (the atlas cell of the province owner) on all of its
// picture's flagpoles; a capture destroys the captured capital's HQ at once (no HQ picture, no flags there, the next frame) and the loser's moved
// capital gets its own HQ with its own flag; the flags show only at close zoom (hidden at the mid zoom); the folds roll only without the Battery
// saver and reduced motion; the flag sprites are cached (no new ones frame after frame); the pole tops in BNMETA are regular (each group of 4
// evenly spaced); a save without the starting capitals (cap0) still has every capital's HQ. node .test/hqflags.js [W H dpr]  prints JSON {checks, fails, errors}, exit 1 on a failure.
const pickNation = require('./pick-nation.js');
const { chromium } = require('playwright');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), DPR = +(process.argv[4] || 1);
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
  const p = await ctx.newPage(); const errors = [], checks = {}, fails = [];
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto('file://' + __dirname + '/page.html?start=nations'); await p.waitForTimeout(500);
  await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 });
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); window.__im.S.speed = 0; });
  const look = (pid, hp) => p.evaluate(([pid, hp]) => { const im = window.__im, v = im.view, s = hp/12, P = im.G.P[pid], R = document.getElementById('map').getBoundingClientRect(); v.s = s; v.x = R.width/2 - P.x*s; v.y = R.height/2 - P.y*s; im.redraw(); }, [pid, hp]);
  const raf = () => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const hqAt = pid => p.evaluate(pid => window.__im.bn.dbg.find(e => e.p === pid && e.hq) || null, pid);
  // (the flags atlas loaded first)
  await p.waitForTimeout(800);
  // 1) every HQ on the map: the owner's flag on all 8 poles at close zoom
  const list = await p.evaluate(() => { const im = window.__im, S = im.S, out = []; for (let q = 0; q < im.G.P.length; q++){ const n = im.bn.hqAt(q); if (n >= 0) out.push({p:q, n, o:S.owner[q], fi:S.owner[q] >= 0 ? im.bn.flagIdx(S.owner[q]) : -1, style:'bn-hq-' + im.bn.hq(n), name:S.nations[n].name}); } return out; });
  let ok = 0, noAtlas = 0; const bad = [];
  for (const h of list){ await look(h.p, 176); await raf(); let e = await hqAt(h.p); if (!e || !e.fl || e.fl[3] === 0){ await p.waitForTimeout(150); await raf(); e = await hqAt(h.p); }
    if (h.fi < 0) noAtlas++;
    if (!e){ bad.push(h.name + ': no HQ drawn'); continue; }
    if (e.nm !== h.style) bad.push(`${h.name}: HQ ${e.nm}, not ${h.style}`);
    if (!e.fl || e.fl[0] !== h.o || e.fl[1] !== h.fi || e.fl[3] !== 8 || e.fl[2] < 0.9) bad.push(`${h.name}: flags ${JSON.stringify(e.fl)} (owner ${h.o}, cell ${h.fi})`); else ok++; }
  checks.allHQs = {hqs:list.length, flagsRight:ok, nationsWithoutAtlasFlag:noAtlas}; if (bad.length) fails.push(...bad.slice(0, 10)); if (list.length < 20) fails.push(`only ${list.length} HQs`);
  // 2) mid zoom: no flags (too small to read), close zoom: flags
  const be = await p.evaluate(() => window.__im.S.nations[0].capital);
  const zs = {}; for (const hp of [30, 60, 90, 120, 176]){ await look(be, hp); await raf(); await raf(); const e = await hqAt(be); zs['z' + hp] = e ? e.fl : null; }
  checks.zoom = zs; if ((zs.z30 && zs.z30[3]) || (zs.z60 && zs.z60[3])) fails.push('flags drawn at the mid zoom'); if (!zs.z176 || zs.z176[3] !== 8) fails.push('no flags at close zoom');
  // 3) the sprites are cached: 20 frames at one zoom make no new one
  await look(be, 176); await raf(); await raf(); const n0 = await p.evaluate(() => window.__im.bn.fcache.size);
  for (let i = 0; i < 20; i++){ await p.evaluate(() => window.__im.redraw()); await raf(); }
  const n1 = await p.evaluate(() => window.__im.bn.fcache.size); checks.cache = {before:n0, after:n1}; if (n1 !== n0) fails.push(`flag sprites made again frame after frame (${n0} -> ${n1})`);
  // 4) capture: Berlin taken by France: its HQ is destroyed at once (the next frame: no HQ picture, no flags); Germany's new capital has its HQ with Germany's flag
  await look(be, 176); await raf(); await raf();
  const cap = await p.evaluate(be => { const im = window.__im, S = im.S, fr = S.nations.find(n => n.name === 'France').id; capture(be, fr); im.redraw(); return {fr, de:im.bn.flagIdx(0), nc:S.nations[0].capital, alive:S.nations[0].alive, hqAt:im.bn.hqAt(be)}; }, be);
  await raf(); let e = await hqAt(be); const items = await p.evaluate(be => window.__im.bn.items(be).map(q => q.k), be);
  checks.capture = {berlinHQ:e && {nm:e.nm, fl:e.fl}, hqAt:cap.hqAt, items, newCapital:cap.nc};
  if (e) fails.push('captured Berlin still shows its HQ: ' + JSON.stringify(e.fl)); if (cap.hqAt !== -1 || items.includes('hq')) fails.push('captured Berlin still has an HQ item');
  if (!cap.alive || cap.nc === be) fails.push('Germany did not move its capital'); else { await look(cap.nc, 176); await raf(); await p.waitForTimeout(500); await raf(); const e2 = await hqAt(cap.nc); checks.capture.moved = e2 && {nm:e2.nm, fl:e2.fl};
    if (!e2 || e2.nm !== 'bn-hq-western' || e2.fl[0] !== 0 || e2.fl[1] !== cap.de || e2.fl[3] !== 8) fails.push('Germany\'s moved capital has no HQ with its flag: ' + JSON.stringify(e2 && e2.fl)); }
  // 5) the wave: off with the Battery saver and with reduced motion
  const wv = await p.evaluate(async () => { const im = window.__im, raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))), o = {}; im.redraw(); await raf(); o.normal = im.bn.wave;
    im.SET.saver = true; im.redraw(); await raf(); o.saver = im.bn.wave; im.SET.saver = false; const m0 = im.SET.motion; im.SET.motion = 'reduced'; im.redraw(); await raf(); o.reduced = im.bn.wave; im.SET.motion = m0; im.redraw(); await raf(); return o; });
  checks.wave = wv; if (!wv.normal || wv.saver || wv.reduced) fails.push('wave on/off wrong: ' + JSON.stringify(wv));
  // 6) the pole tops: each group of four evenly spaced (a top caught on the building would break the step)
  const meta = await p.evaluate(() => { const M = window.__im.bn.meta, o = {}; for (const k in M) if (M[k].flags) o[k] = M[k].flags; return o; }); const irr = [];
  for (const [k, F] of Object.entries(meta)){ if (F.length !== 8) irr.push(k + ': ' + F.length + ' poles'); for (const g of [F.slice(0, 4), F.slice(4)]){ const dy = [1, 2, 3].map(i => g[i][1] - g[i - 1][1]), m = (g[3][1] - g[0][1])/3; if (dy.some(d => Math.abs(d - m) > 0.35*m)) irr.push(k + ' steps ' + dy.map(d => d.toFixed(4)).join(','));
    const base = g.map(f => f[1] + f[2]), bd = [1, 2, 3].map(i => base[i] - base[i - 1]); if (bd.some(d => Math.abs(d - (base[3] - base[0])/3) > 0.35*(base[3] - base[0])/3)) irr.push(k + ' feet ' + bd.map(d => d.toFixed(4)).join(',')); } }
  checks.poles = {pictures:Object.keys(meta).length, irregular:irr}; if (Object.keys(meta).length !== 7) fails.push('not 7 HQ pictures with poles'); if (irr.length) fails.push(...irr);
  // 7) a save from before the starting capitals were kept (no cap0): every living nation's capital still has its HQ
  const old = await p.evaluate(() => { const im = window.__im, S = im.S, keep = S.nations.map(n => n.cap0); S.nations.forEach(n => { delete n.cap0; });
    const miss = S.nations.filter(n => n.alive && im.bn.hqAt(n.capital) !== n.id).map(n => n.name); S.nations.forEach((n, i) => { n.cap0 = keep[i]; }); return miss; });
  checks.noCap0 = {missing:old}; if (old.length) fails.push('without cap0 no HQ at: ' + old.slice(0, 5).join(', '));
  console.log(JSON.stringify({checks, fails, errors}, null, 1));
  await b.close(); process.exit(fails.length || errors.length ? 1 : 0);
})();
