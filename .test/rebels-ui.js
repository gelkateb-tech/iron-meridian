// Rebels in the page (docs/REBELS-PLAN.md 7; owner, list item 22): desktop 1440 x 900 at dpr 2, France playing, German cities captured.
// Checks: a rebel force shows on the map at play zoom with the crossed-rifles badge (grey band, the rifles on the tag) and as the rebel squad's
// 3D soldiers at close zoom (model 'reb'); the city sheet of a captured city shows its occupation row (morale, its daily fall, the troops, the
// integration count) and the "Rebels likely" warning; rebels in an empty city show "Rebels!" with the hours left, the city flips after 24 hours
// with a dispatch; the same city held by one infantry unit crushes the next uprising at once (dispatch) and stays yours; another nation's city
// shows its rebels only once identified, never the holder's garrison or clock. The owner's pictures
// (JPG, quality 88, at most 2400 px wide) go to OUT.
// node .test/rebels-ui.js [out dir]   (run bash tools/mkpage.sh first)
const fs = require('fs'), path = require('path'), pickNation = require('./pick-nation.js'), { chromium } = require('playwright');
const OUT = process.argv[2] || path.join(__dirname, 'rebels-ui'); fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }), ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }), p = await ctx.newPage();
  const errors = [], checks = {}, fails = [], ok = (k, c, v) => { checks[k] = c ? 'PASS' : 'FAIL ' + JSON.stringify(v ?? null); if (!c) fails.push(k); };
  p.on('pageerror', e => errors.push(e.message));
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
  await pickNation(p, 'France'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 });
  const quiet = () => p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const h = document.getElementById('hint'); if (h) h.style.visibility = 'hidden'; });
  // the cities: France's three nearest German cities (not the capital), emptied
  const C = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G; S.speed = 0; if (im.SET) im.SET.tipsOff = true;
    const ger = S.nations.find(N => N.name === 'Germany').id, par = G.P[S.nations[seats()[0]].capital];
    const cs = G.P.filter(P => P.city && S.owner[P.id] === ger && P.id !== S.nations[ger].capital).sort((x, y) => Math.hypot(x.x - par.x, x.y - par.y) - Math.hypot(y.x - par.x, y.y - par.y)).slice(0, 2).map(P => P.id);
    for (const q of cs){ S.armies = S.armies.filter(a => a.at !== q); capture(q, seats()[0]); S.occ[q] = S.hour - 100; }
    const r = document.getElementById('map').getBoundingClientRect(); return {ger, cs, names:cs.map(q => G.P[q].cityName || G.P[q].name), xy:cs.map(q => [G.P[q].x, G.P[q].y]), w:r.width, h:r.height, x:r.left, y:r.top}; });
  const [p1, p2] = C.cs;
  // the map's free part: left of the side panel (always open on a desktop); the subject is put at (cx, cy) of it
  const SL = await p.evaluate(() => { const e = document.getElementById('side'); return e ? e.getBoundingClientRect().left : 1440; }), MW = Math.min(1440, SL) - C.x;
  const view = (hp, at, cy = 375) => p.evaluate(([x, y, hp, sx, sy]) => { const im = window.__im, v = im.view, s = hp/12; v.s = s; v.x = sx - x*s; v.y = sy - y*s; im.air.visibleSet(); im.redraw && im.redraw(); }, [at[0], at[1], hp, MW/2, cy - C.y]);
  const MAPC = { x: C.x, y: 0, width: Math.round(MW), height: 750 }, SHEETC = { x: C.x, y: 150, width: Math.round(MW), height: 750 };
  const shots = [], shot = async (nm, clip) => { await quiet(); await p.waitForTimeout(300); const f = path.join(OUT, nm + '.jpg'); await p.screenshot({ path: f, type: 'jpeg', quality: 88, clip: clip || { x: 0, y: 0, width: 1200, height: 750 } }); shots.push(f); return f; };
  const center = (at, w = 1200, h = 750) => { const sx = C.x + C.w/2, sy = C.y + C.h/2; return { x: Math.max(0, Math.min(1440 - w, sx - w/2)), y: Math.max(0, Math.min(900 - h, sy - h/2)), width: w, height: h }; };
  const sheet = () => p.evaluate(() => { const e = document.querySelector('#csheet .cs-oc'); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; });
  const close = async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(250); };
  const logHas = re => p.evaluate(src => (window.__im.S.log || []).some(e => new RegExp(src).test(e.text)), re.source);

  // 1. rebels rise in the empty city p1 (morale 22% at the daily update): the badge at play zoom, the 3D squad at close zoom
  const R1 = await p.evaluate(q => { const S = window.__im.S; S.unrest[q] = 72; unrestDay(); const r = S.armies.find(a => a.rebel && a.at === q); window.__rbdbg = []; return r ? {id:r.id, n:count(r), name:armyName(r), at:r.pos || null} : null; }, p1);
  ok('rebels rise in the empty captured city (morale under 30%)', !!R1 && R1.name === 'Rebels', R1);
  ok('the seat is told: rebels rose, the city will be lost in 24 h', await logHas(/^Rebels rose up in .*lost in 24 h unless troops arrive/));
  await view(48, C.xy[0]); await p.waitForTimeout(1500); await view(48, C.xy[0]); await p.waitForTimeout(800);
  const b48 = await p.evaluate(id => (window.__rbdbg || []).filter(e => e.id === id).slice(-1)[0] || null, R1 && R1.id);
  ok('play zoom: the rebel badge is drawn with the crossed rifles (tag icon "reb", grey band with the rifles)', b48 && b48.icon === 'reb' && (b48.far || b48.band), b48);
  await shot('1-rebels-play-zoom', MAPC);
  await view(600, C.xy[0]); await p.waitForTimeout(2500); await view(600, C.xy[0]); await p.waitForTimeout(1500);
  const m3 = await p.evaluate(() => window.__im.TM.dbg.map(e => e.t)), bin = await p.evaluate(id => (window.__rbdbg || []).filter(e => e.id === id).slice(-1)[0] || null, R1 && R1.id);
  console.log('close zoom hexPx', await p.evaluate(() => window.__im.hexPx()));
  ok('close zoom: the rebels stand as the rebel squad\'s 3D soldiers (model "reb")', m3.includes('reb'), m3);
  ok('close zoom: the badge over them has the grey band with the crossed rifles', bin && bin.icon === 'reb' && bin.band && !bin.far, bin);
  await shot('2-rebels-close-zoom', MAPC);
  // the tag icon and the band, enlarged (the drawing itself)
  const art = await p.evaluate(() => { const c = document.createElement('canvas'); c.width = 360; c.height = 200; const g = c.getContext('2d'); g.fillStyle = '#3a4a52'; g.fillRect(0, 0, 360, 200);
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect(20, 40, 120, 120, 22); g.fill(); const U = window.__im.uicon; g.drawImage(U.navy('reb', 104), 28, 48); g.drawImage(U.rband(90, 45), 170, 55, 170, 90);
    const d = g.getImageData(190, 60, 130, 80).data; let w = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240) w++; return {url:c.toDataURL('image/png'), white:w}; });
  ok('the band carries the white crossed rifles', art.white > 300, art.white);

  // 2. p2: a captured city with its morale falling: the occupation row and "Rebels likely" in its sheet
  await p.evaluate(q => { const S = window.__im.S; S.unrest[q] = 54; unrestDay(); unrestDay(); }, p2);   // (two daily updates: 60 → 66 unrest, morale 34%)
  await view(60, C.xy[1], 330); await p.evaluate(q => window.__im.selectProv(q), p2); await p.waitForTimeout(900);
  const t2 = await sheet();
  ok('the sheet of a captured city: "Occupied · morale 34% −6%/day · 0 troops · 2 hold it, 3 raise it · integrating 0/10"', t2 && /Occupied · morale 34% −6%\/day · 0 troops · 2 hold it, 3 raise it · integrating 0\/10/.test(t2), t2);
  ok('... and the warning: "Rebels likely", rebels rise below 30% (in about 1 day)', t2 && /Rebels likely/.test(t2) && /Rebels will rise when morale is below 30% \(in about 1 day\)/.test(t2), t2);
  ok('the seat was told when morale fell under 40%', await logHas(/^Morale in .* is 3\d% and falling 6% a day\. Rebels will rise below 30%/));
  await shot('3-sheet-falling-morale', SHEETC);
  await close();

  // 3. p1 left empty: "Rebels!" and the hours left, then the flip after 24 hours alone
  await p.evaluate(q => { for (let i = 0; i < 18; i++) rebelHour(); }, p1);
  await view(60, C.xy[0], 330); await p.evaluate(q => window.__im.selectProv(q), p1); await p.waitForTimeout(900);
  const t3 = await sheet();
  ok('rebels in the empty city: "Rebels!" and "the city is lost in 6 h unless troops arrive"', t3 && /Rebels!/.test(t3) && /lost in 6 h unless troops arrive/.test(t3), t3);
  await shot('4-empty-city-rebels', SHEETC);
  const fl = await p.evaluate(([q, ger]) => { for (let i = 0; i < 6; i++) rebelHour(); return {owner:window.__im.S.owner[q], ger}; }, [p1, C.ger]);
  ok('after 24 hours alone the city revolts and rejoins Germany', fl.owner === C.ger, fl);
  ok('... with a dispatch: "revolted and rejoined Germany"', await logHas(/revolted and rejoined Germany/));
  await close(); await p.evaluate(() => { const b = document.querySelector('[data-act="tab"][data-tab="log"]'); if (b) b.click(); }); await p.waitForTimeout(200);
  await p.evaluate(() => { if (!document.body.classList.contains('side-open')){ const b = document.querySelector('[data-act="notif"]'); if (b) b.click(); } }); await p.waitForTimeout(700);
  await view(60, C.xy[0]); await p.waitForTimeout(900);
  await shot('5-city-flipped', { x: 1440 - 1200, y: 0, width: 1200, height: 750 });
  await p.evaluate(() => { const b = document.querySelector('[data-act="notif"]'); if (document.body.classList.contains('side-open') && b) b.click(); }); await p.evaluate(() => { const x = document.querySelector('#side [data-act="close"], #side .x'); if (x) x.click(); });

  // 4. the same city taken again and held by ONE infantry unit (level I): the next uprising is crushed at once
  const H = await p.evaluate(q => { const S = window.__im.S; S.armies = S.armies.filter(a => a.at !== q); capture(q, seats()[0]); S.occ[q] = S.hour - 100; delete S.rcool[q];
    const g = window.__im.addArmy(seats()[0], q, {inf:1}); S.unrest[q] = 74; unrestDay(); return {rebels:S.armies.filter(a => a.rebel && a.at === q && count(a)).length, owner:S.owner[q], g:count(g), mor:Math.round(moraleOf(q))}; }, p1);
  ok('the same city with one infantry unit: the uprising is crushed the moment it rises, the city stays yours', H.rebels === 0 && H.owner === 0 && H.g === 1, H);
  ok('... with a dispatch: "your infantry there crushed them at once"', await logHas(/^Rebels rose up in .*your infantry there crushed them at once/));
  await view(235, C.xy[0], 330); await p.waitForTimeout(2000); await p.evaluate(q => window.__im.selectProv(q), p1); await p.waitForTimeout(1500);
  const t4 = await sheet(), m4 = await p.evaluate(() => window.__im.TM.dbg.map(e => e.t));
  ok('its sheet: 1 troop, and "Your infantry here will crush them"', t4 && /1 troop/.test(t4) && /Your infantry here will crush them/.test(t4), t4);
  ok('close zoom: your infantry squad stands in the city, no rebel squad', m4.includes('sol') && !m4.includes('reb'), m4);
  await shot('6-held-by-one-infantry', SHEETC);
  await close();
  // 5. another nation's city (a Russian city Germany took, far from France): its rebels, garrison and clock stay hidden from France unless France
  // has identified the rebels there, and then only the rebels show, never "your" troops (review: the sheet leaked the holder's state)
  const F = await p.evaluate(ger => { const im = window.__im, S = im.S, G = im.G, rus = S.nations.find(N => N.name === 'Russia').id;
    const q = G.P.filter(P => P.city && S.owner[P.id] === rus && P.id !== S.nations[rus].capital).sort((x, y) => x.x - y.x)[0].id;
    S.armies = S.armies.filter(a => a.at !== q); capture(q, ger); S.occ[q] = S.hour - 100; S.unrest[q] = 75; unrestDay();
    const reb = S.armies.find(a => a.rebel && a.at === q), vis = visibleSet(seats()[0]);
    return {q, reb:!!reb, seen:vis.has(q), known:reb ? armyKnown(reb, vis) : null, prov:im.provHTML(q).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')}; }, C.ger);
  await p.evaluate(q => window.__im.selectProv(q), F.q); await p.waitForTimeout(900); F.sheet = await sheet(); await close();
  await p.evaluate(q => { const S = window.__im.S, reb = S.armies.find(a => a.rebel && a.at === q), k0 = window.armyKnown; window.__k0 = k0; window.armyKnown = (a, v) => a === reb || k0(a, v); }, F.q);   // (as if France had identified them: recon over the city)
  await p.evaluate(q => window.__im.selectProv(q), F.q); await p.waitForTimeout(900); F.sheetK = await sheet(); await close(); await p.evaluate(() => { window.armyKnown = window.__k0; });
  ok('another nation\'s city with rebels France has not identified: no occupation row, no rebels in its details', F.reb && !F.known && F.sheet === null && !/rebels/i.test(F.prov), F);
  ok('... once France has identified them: only "Rebels! · 5 rebel units hold out against Germany", none of the holder\'s troops, count or clock', !!F.sheetK && /Rebels!/.test(F.sheetK) && /rebel units? hold out against Germany here/.test(F.sheetK) && !/your|troop|integrating|lost in| h /i.test(F.sheetK), F.sheetK);
  // the badge art enlarged, as a small extra picture
  { const f = path.join(OUT, '7-badge-art.png'); fs.writeFileSync(f, Buffer.from(art.url.split(',')[1], 'base64')); shots.push(f); }
  ok('no page errors', !errors.length, errors.slice(0, 3));
  console.log(JSON.stringify({ checks, shots, errors: errors.slice(0, 5) }, null, 1));
  console.log(fails.length || errors.length ? `FAILED ${fails.length} checks, ${errors.length} errors` : `OK ${Object.keys(checks).length} checks`);
  await b.close(); process.exit(fails.length || errors.length ? 1 : 0); })();
