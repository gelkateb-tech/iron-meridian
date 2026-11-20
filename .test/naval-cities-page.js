// NAVAL CITIES on the page (owner 2026-11-19, with a Conflict of Nations screenshot of Karachi and Hyderabad): the anchor in a small square frame
// beside every naval city's name (index.html ncPlace / ncMark), never over the name, a counter, its position dot or another name; none beside a
// city that is not a naval city; shown with the city names, not zoomed far out; its tooltip and the city sheet's line; boarding refused away from a
// naval city with the reason shown; an assault landing into an enemy naval city (planned, then under way); Marines landing on an open coast; the Marines card in the research
// tree. A Pakistan game in the nations world, desktop 1440x900.
//   node .test/naval-cities-page.js [out-dir]   (bash tools/mkpage.sh first; with out-dir: the owner's sheets there, deviceScaleFactor 2, JPG 88)
// Prints JSON {checks, fails, errors}; exit 1 on a failure.
const pickNation = require('./pick-nation.js'), { chromium } = require('playwright'), path = require('path'), fs = require('fs');
const OUT = process.argv[2] || null, W = 1440, H = 900;
(async () => { if (OUT) fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: OUT ? 2 : 1 }), p = await ctx.newPage();
  const errors = [], checks = {}, fails = [], ok = (k, v, i) => { checks[k] = v ? 'PASS' : 'FAIL'; if (!v) fails.push(k + ' ' + JSON.stringify(i ?? null)); };
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FILE|net::/.test(m.text())) errors.push(m.text()); });
  await p.goto('file://' + __dirname + '/page.html?start=nations'); await p.waitForTimeout(500);
  await pickNation(p, 'Pakistan'); await p.click('[data-act="begin"]'); await p.waitForTimeout(400); if (await p.locator('[data-act="start"]').count()) await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 60000 });
  await p.emulateMedia({ reducedMotion: 'reduce' });
  const C = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G; S.speed = 0; const by = n => G.P.find(q => q.cityName === n && S.owner[q.id] === 0) || G.P.find(q => q.cityName === n);
    const k = by('Karachi'), h = by('Hyderabad'), mu = G.P.find(q => q.cityName === 'Mumbai'); return { me: S.nations[0].name, k: k.id, kxy: [k.x, k.y], h: h.id, hxy: [h.x, h.y], mu: mu.id, muxy: [mu.x, mu.y] }; });
  ok('playing Pakistan', C.me === 'Pakistan', C.me);
  const clear = () => p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const k = document.querySelector('[data-act="tip-skip"]'); if (k) k.click(); window.__im.nc.tipHide(); });
  const side = open => p.evaluate(o => { if (!o) window.__im.nc.closeSide(); }, open);
  const look = (x, y, hp) => p.evaluate(([x, y, hp, W, H]) => { const v = window.__im.view, s = hp/12; v.s = s; v.x = W/2 - x*s; v.y = H/2 - y*s; window.__im.redraw && window.__im.redraw(); }, [x, y, hp, W, H]);
  const settle = async () => { for (let i = 0; i < 16; i++){ await p.waitForTimeout(250); if (!(await p.evaluate(() => window.__im.mapBusy && window.__im.mapBusy()))) break; }
    await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); await p.waitForTimeout(150); };
  // (a sheet with a panel: the whole screen, 2880 px, then scaled to 2400 px wide, JPG 88, by Pillow)
  const FULL = 'full', shot = async (name, clip = { x: 120, y: 75, width: 1200, height: 750 }) => { if (!OUT) return; const f = path.join(OUT, name + '.jpg');
    if (clip !== FULL) return p.screenshot({ path: f, type: 'jpeg', quality: 88, clip });
    const tmp = path.join(OUT, name + '.tmp.png'); await p.screenshot({ path: tmp });
    require('child_process').execFileSync('python3', ['-c', 'import sys; from PIL import Image; im = Image.open(sys.argv[1]).convert("RGB"); im.resize((2400, round(im.height*2400/im.width)), Image.LANCZOS).save(sys.argv[2], quality=88)', tmp, f]); fs.unlinkSync(tmp); };
  // a map-only sheet: the map left of the side panel, below the resource bar, without the hint line and the minimap (the side panel stays on a desktop)
  const mapShot = async name => { if (!OUT) return; const r = await p.evaluate(() => { const s = document.getElementById('side').getBoundingClientRect(), m = document.getElementById('map').getBoundingClientRect(), hd = document.querySelector('header'), hb = hd ? hd.getBoundingClientRect().bottom : 0;
      const st = document.createElement('style'); st.id = 'ncshot'; st.textContent = '#hint,#mini,#miniframe,.mapctl{visibility:hidden !important}'; document.head.appendChild(st); return { x: Math.max(0, m.left), y: Math.max(m.top, hb), w: Math.min(s.left, m.right) - Math.max(0, m.left), h: m.bottom - Math.max(m.top, hb) }; });
    await p.waitForTimeout(150); await shot(name, { x: r.x, y: r.y, width: Math.min(1200, r.w), height: Math.min(860, r.h) }); await p.evaluate(() => document.getElementById('ncshot').remove()); };
  const ov = (a, q) => a[0] < q[2] && a[2] > q[0] && a[1] < q[3] && a[3] > q[1];
  const state = () => p.evaluate(() => ({ nc: window.__im.nc.hits(), names: window.__im.nc.names(), hits: window.__im.hits.map(h => [h.x, h.y, h.x + h.w, h.y + h.h]), pts: window.__im.nc.cityPts() }));
  const audit = (tag, st) => { const bad = [];
    for (const q of st.nc){ const a = q.slice(0, 4);
      for (const nm of st.names) if (ov(a, nm.b)) bad.push(`${tag}: anchor of ${q[4]} over the name of ${nm.p}`);
      for (const h of st.hits) if (ov(a, h)) bad.push(`${tag}: anchor of ${q[4]} over a counter`);
      for (const m of st.pts) if (m.p !== q[4] && ov(a, [m.x - m.r, m.y - m.r, m.x + m.r, m.y + m.r])) bad.push(`${tag}: anchor of ${q[4]} over the point of city ${m.p}`); }
    return bad; };
  await side(false); await clear();
  const MR = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return { x: r.left, y: r.top }; });   // (map canvas px to page px)

  // 1. Karachi and Hyderabad at play zoom: an anchor beside each name
  await look((C.kxy[0] + C.hxy[0])/2 + 8, (C.kxy[1] + C.hxy[1])/2, 110); await settle(); await clear(); await settle();
  let st = await state(); const has = id => st.nc.some(q => q[4] === id);
  ok('Karachi and Hyderabad show the naval-city anchor at play zoom', has(C.k) && has(C.h), st.nc);
  ok('the anchors keep clear of every name, counter and city point (play zoom)', !audit('play', st).length, audit('play', st));
  { const q = st.nc.find(x => x[4] === C.k), nm = st.names.find(x => x.p === C.k); ok('Karachi\'s anchor stands right beside its name, sized to it (12 to 17 px)', q && nm && Math.abs((q[1] + q[3])/2 - (nm.b[1] + nm.b[3])/2) < 4 && (Math.abs(q[2] - nm.b[0]) < 3 || Math.abs(q[0] - nm.b[2]) < 3) && q[2] - q[0] >= 13 && q[2] - q[0] <= 19, { q, nm }); }
  await mapShot('1-karachi-hyderabad');
  // its tooltip
  { const q = st.nc.find(x => x[4] === C.k); await p.mouse.move(MR.x + (q[0] + q[2])/2, MR.y + (q[1] + q[3])/2); await p.waitForTimeout(500);
    const t = await p.evaluate(() => { const e = document.getElementById('tip'); return e && !e.hidden ? e.innerText : ''; });
    ok('hovering the anchor: "Naval city: Naval Yard can be built here; troops board and land here"', /Naval city: Naval Yard can be built here; troops board and land here/.test(t) && /Karachi/i.test(t), t);
    await mapShot('1b-anchor-tooltip'); await p.mouse.move(5, 450); await p.evaluate(() => window.__im.nc.tipHide()); }
  // zoomed far out: no anchors (no city names either)
  await look(C.kxy[0], C.kxy[1], 6); await settle(); st = await state(); ok('zoomed far out (hexPx 6): no anchors', !st.nc.length, st.nc.length);

  // 2. a coast with naval and other cities (India's west coast and Gujarat): an anchor at each naval city, none inland
  await look(C.muxy[0] + 10, C.muxy[1] - 25, 40); await settle(); await clear(); await settle(); st = await state();
  const kinds = await p.evaluate(ids => ids.map(id => navalCity(id)), st.names.map(n => n.p));
  { const navalNamed = st.names.filter((n, i) => kinds[i]), otherNamed = st.names.filter((n, i) => !kinds[i]), anc = new Set(st.nc.map(q => q[4]));
    ok(`a coast with several naval cities and other cities named (${navalNamed.length} naval, ${otherNamed.length} other)`, navalNamed.length >= 3 && otherNamed.length >= 3, { navalNamed: navalNamed.length, otherNamed: otherNamed.length });
    ok('no anchor beside a city that is not a naval city', otherNamed.every(n => !anc.has(n.p)) && [...anc].every(id => navalNamed.some(n => n.p === id)), [...anc]);
    ok('most naval cities named show their anchor (the rest boxed in)', anc.size >= Math.ceil(navalNamed.length*0.7), { anc: anc.size, named: navalNamed.length });
    ok('the anchors keep clear of every name, counter and city point (the coast)', !audit('coast', st).length, audit('coast', st)); }
  await mapShot('2-coast-naval-and-other-cities');

  // 3. the city sheet: Karachi
  await look(C.kxy[0], C.kxy[1], 72); await p.evaluate(id => window.__im.selectProv(id), C.k); await p.waitForTimeout(500); await clear();
  { const t = await p.evaluate(() => (document.querySelector('#side') || {}).innerText || '');
    ok('the city sheet: "Naval city: Naval Yard can be built here; troops board and land here"', /Naval city\s*\n?\s*Naval Yard can be built here; troops board and land here/.test(t) || (/Naval city/.test(t) && /Naval Yard can be built here; troops board and land here/.test(t)), t.slice(0, 600)); }
  await p.evaluate(() => { const e = document.querySelector('#side [data-nc]'); if (e) e.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(200);
  await shot('3-city-sheet-naval-line', FULL);
  // a coast that is not a naval city says so
  const T = await p.evaluate(() => { const G = window.__im.G, S = window.__im.S, P = G.P.find(q => q.name === 'Turbat' && S.owner[q.id] === 0) || G.P.find(q => !q.sea && q.coast && !q.city && S.owner[q.id] === 0); return { p: P.id, xy: [P.x, P.y] }; });
  await p.evaluate(id => window.__im.selectProv(id), T.p); await p.waitForTimeout(400);
  ok('a coast without a city: "Not a naval city"', /Not a naval city/.test(await p.evaluate(() => document.querySelector('#side').innerText)));
  await side(false);

  // 4. boarding refused away from a naval city: infantry on that coast ordered onto the sea
  const B = await p.evaluate(t => { const im = window.__im, S = im.S, G = im.G, P = G.P[t], z = P.nbs.find(v => G.P[v].sea);
    for (const a of S.armies) if (a.at === t && a.owner === 0) for (const k in a.u) a.u[k] = 0; removeEmpty();
    const a = im.addArmy(0, t, { inf: 4 }); a.m = 85;
    // a water cell of the zone near the coast: where the tap goes
    let best = null, bd = 1e9; for (const c of G.P[z].cells){ const q = cellCenter(c); if (!im.isWet || im.isWet(q[0], q[1])){ const d = Math.hypot(q[0] - P.x, q[1] - P.y); if (d < bd && d > 8){ bd = d; best = q; } } }
    return { a: a.id, z, sea: best, xy: [P.x, P.y] }; }, T.p);
  await look((B.xy[0] + B.sea[0])/2, (B.xy[1] + B.sea[1])/2, 56); await settle(); await clear();
  await p.evaluate(id => window.__im.selectArmy(id), B.a); await p.waitForTimeout(300); await p.click('#cmdbar [data-act="cm-move"]'); await p.waitForTimeout(200);
  { const s = await p.evaluate(xy => window.__im.toScreen(xy[0], xy[1]), B.sea); await p.mouse.click(MR.x + s[0], MR.y + s[1]); await p.waitForTimeout(300);
    const t = await p.evaluate(() => [...document.querySelectorAll('.toast')].map(e => e.innerText).join(' | '));
    await shot('4-boarding-refused-reason', FULL);   // (at once: the refusal's toast is up for 4.5 s)
    { const sb = await p.evaluate(() => { const b = document.querySelector('#side [data-act="send"]'); return b ? {dis:b.disabled, op:getComputedStyle(b).opacity} : null; });
      ok('the panel\'s Send button is off for the refused route', !sb || sb.dis, sb); }
    const a = await p.evaluate(id => { const a = window.__im.S.armies.find(x => x.id === id); return { path: a.path, to: a.to }; }, B.a);
    ok('boarding refused away from a naval city, the reason shown', /No naval city here: troops board ships only at a naval city/.test(t) && !a.path.length && a.to === null, { t, a }); }
  if (await p.evaluate(() => window.__im.cmdMode === 'move')) await p.click('#cmdbar [data-act="cm-move"]'); await side(false); await clear();

  // 5. an assault landing into an enemy naval city (Mumbai, India at war)
  const A = await p.evaluate(mu => { const im = window.__im, S = im.S, G = im.G, ind = S.nations.findIndex(N => N.name === 'India'); setRel(0, ind, 'war');
    const z = G.P[mu].nbs.find(v => G.P[v].sea), a = im.addArmy(0, z, { inf: 6, at: 2 }); a.m = 90; return { a: a.id, z, zxy: [G.P[z].x, G.P[z].y], ind }; }, C.mu);
  // planning it: the panel's route says "assault landing"
  await look((C.muxy[0] + A.zxy[0])/2, (C.muxy[1] + A.zxy[1])/2 + 6, 64); await p.evaluate(id => window.__im.selectArmy(id), A.a); await p.waitForTimeout(200);
  await p.evaluate(([id, mu]) => { window.__im.setTarget(id, mu); window.dispatchEvent(new Event("im-bart")); }, [A.a, C.mu]); await settle(); await clear();
  { const t = await p.evaluate(() => document.querySelector('#side').innerText);
    ok('planning it: the route says "lands at Mumbai (assault landing) (45 min)"', /lands at Mumbai \(assault landing\) \(45 min\)/.test(t), t.slice(0, 500)); }
  await shot('5-assault-landing-enemy-naval-city', FULL);
  A.path = await p.evaluate(([id, mu]) => { const a = window.__im.S.armies.find(x => x.id === id); window.__im.orderMove(a, mu); return a.path.slice(); }, [A.a, C.mu]);
  ok('the assault landing: straight into Mumbai', A.path.length === 1 && A.path[0] === C.mu, A.path);
  { let L = null; for (let i = 0; i < 400; i++){ L = await p.evaluate(id => { const a = window.__im.S.armies.find(x => x.id === id); window.__im.tick(); return a ? { at: a.at, land: a.land || 0, to: a.to } : null; }, A.a); if (!L || L.at === C.mu) break; }
    ok('the force arrived at Mumbai from the sea', L && L.at === C.mu, L);
    await p.evaluate(id => { const a = window.__im.S.armies.find(x => x.id === id); if (a && !(a.land > 0)) a.land = 0.75*0.6; }, A.a);   // (the moment of the landing: 27 minutes still to go, for the army bar)
    await look(C.muxy[0], C.muxy[1] + 6, 80); await p.evaluate(id => window.__im.selectArmy(id), A.a); await settle(); await clear();
    const t = await p.evaluate(() => document.querySelector('#side').innerText);
    ok('the army bar counts the landing down', /Landing/.test(t), t.slice(0, 300)); }
  await shot('5b-assault-landing-under-way', FULL);
  await side(false); await clear();

  // 6. Marines landing on an open coast (an Indian beach that is not a naval city), next to infantry that must go by a naval city
  const M = await p.evaluate(([ind, k]) => { const im = window.__im, S = im.S, G = im.G, K = G.P[k]; rGrant(S.nations[0], 'u_mar', 1);
    const beach = G.P.filter(P => !P.sea && P.coast && !P.city && S.owner[P.id] === ind && P.nbs.some(v => G.P[v].sea)).sort((a, b) => Math.hypot(a.x - K.x, a.y - K.y) - Math.hypot(b.x - K.x, b.y - K.y))[0];
    const z = beach.nbs.find(v => G.P[v].sea), m = im.addArmy(0, z, { mar: 6 }); m.m = 90; im.orderMove(m, beach.id);
    return { m: m.id, beach: beach.id, name: beach.name, xy: [beach.x, beach.y], z, zxy: [G.P[z].x, G.P[z].y], path: m.path.slice() }; }, [A.ind, C.k]);
  ok(`Marines go straight onto the beach at ${M.name}`, M.path.length === 1 && M.path[0] === M.beach, M.path);
  { let L = null; for (let i = 0; i < 400; i++){ L = await p.evaluate(id => { const a = window.__im.S.armies.find(x => x.id === id); window.__im.tick(); return a ? { at: a.at, land: a.land || 0 } : null; }, M.m); if (!L || L.at === M.beach) break; }
    ok('the Marines came ashore on the open coast', L && L.at === M.beach, L);
    await p.evaluate(id => { const a = window.__im.S.armies.find(x => x.id === id); if (a && !(a.land > 0)) a.land = 0.75*0.6; }, M.m);
    await look(M.xy[0], M.xy[1] + 4, 80); await p.evaluate(id => window.__im.selectArmy(id), M.m); await settle(); await clear();
    const t = await p.evaluate(() => document.querySelector('#side').innerText); ok('their panel names them Marines', /Marine/.test(t), t.slice(0, 300)); }
  await shot('6-marines-land-on-open-coast', FULL);
  await side(false); await clear();

  // 7. the Marines card in the research tree (Infantry Corps)
  await p.evaluate(() => { const N = window.__im.S.nations[0]; delete N.tech.u_mar; for (const k of ['cash', 'oil', 'metal', 'iron', 'elec', 'rare', 'mp']) N[k] = 4000*(isGood(k) ? RES_K : 1); N.research = N.research2 = null; window.__im.S.hour = 4*24 + 2; });
  await p.click('[data-act="research-open"]'); await p.waitForTimeout(400);
  await p.evaluate(() => { const x = document.querySelector('[data-act="rback"]'); if (x) x.click(); }); await p.waitForTimeout(100);
  await p.click('[data-act="rbranch"][data-b="inf"]'); await p.waitForTimeout(300);
  ok('the Infantry Corps tree has the Marines column', await p.locator('.rnode[data-id="u_mar"]').count() === 1 && await p.locator('.rnode[data-id="mar_g2"]').count() === 1);
  await p.evaluate(() => document.querySelector('.rnode[data-id="u_mar"]').click()); await p.waitForTimeout(500);
  { const c = await p.evaluate(() => { const c = document.querySelector('.rs-card'); if (!c) return null; const im = [...c.querySelectorAll('img, i')].map(e => (e.dataset && e.dataset.ul) || e.src || e.style.backgroundImage || '').filter(Boolean); return { t: c.innerText, im }; });
    ok('the Marines card: name, what it does, its costs, START', c && /marines/i.test(c.t) && /any coast/.test(c.t) && /START/i.test(c.t), c && c.t.slice(0, 400));
    ok('until the Marines pictures exist the card shows the infantry\'s (no missing picture)', c && c.im.some(s => /ul-inf-|ri-u_inf/.test(s)) && !c.im.some(s => /ri-u_mar|ul-mar-/.test(s) && !/ul-mar-/.test(s)), c && c.im); }
  await shot('7-research-marines-card', FULL);
  // the Marines' own pictures as they arrive from unit-art-3: a group that has some shows its own, every other group the infantry's; a look or a
  // kind of picture missing in a group that has some falls back to the infantry's; never a missing file (index.html ulUnits, ulArt)
  { const r = await p.evaluate(() => { const rs = window.__im.rs, S = window.__im.S, F = rs.ulFiles(), g0 = rs.group(0), o = S.nations.findIndex((N, i) => i > 0 && rs.group(i) !== g0);
      const fake = `ul-mar-${g0}-1-side`, had = F.has(fake); F.set(fake, F.get(`ul-inf-${g0}-1-side`));   // (UL_CELL: the atlas table, a picture name -> its cell)
      const A = rs.look('mar', 0, 1), B = rs.look('mar', o, 1), A3 = rs.look('mar', 0, 8); if (!had) F.delete(fake);
      const C = rs.look('mar', 0, 1), real = s => { const k = s && s.replace(/^assets\/art\//, '').replace(/\.webp$/, ''); return !s || /ri-u_/.test(s) || F.has(k) || k === fake; };
      return { g0, A, B, A3, C, ok: [A, B, A3, C].every(x => real(x.side) && real(x.scene) && !/ri-u_mar/.test(x.scene)) }; });
    ok('Marines pictures: a group with its own shows them, another group the infantry\'s, a missing kind the infantry\'s, never a missing file',
      r.ok && /ul-mar-/.test(r.A.side) && /ul-inf-|ri-u_inf/.test(r.A.scene || '') && /ul-inf-/.test(r.B.side || '') && /ul-mar-/.test(r.A3.side) && !/ul-mar-/.test(r.C.side || ''), r); }
  await b.close();
  console.log(JSON.stringify({ checks, fails, errors }, null, 1));
  console.log(fails.length || errors.length ? `FAILED ${fails.length} checks, ${errors.length} errors` : `OK ${Object.keys(checks).length} checks`);
  process.exit(fails.length || errors.length ? 1 : 0); })();
