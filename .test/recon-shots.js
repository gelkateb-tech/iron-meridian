// RECON VEHICLE screenshots (owner playtest 2026-11-27, items 3 and 4). Browser, after bash tools/mkpage.sh in the tree whose page is shot:
//   node .test/recon-shots.js <page.html> <label> <outdir> [phone|desk|both] [start,scene,card,figure]
// label names the files (<outdir>/<label>-<desk|phone>-<shot>.png), so a master page and this branch's page shot with the same script give pairs
// with the same camera. Parts (all by default):
//   start   the starting setup of Russia, Germany and Belarus (a small nation): the nation in view, then an outer stack selected (its panel)
//   scene   Russia; in Kazakhstan, east of Astana, a Russian stack of 2 infantry and 1 recon vehicle with Kazakh armies 25 and 45 km away (inside
//           its 70 km), one 85 km away (outside it, spotted by a second Russian stack of 2 infantry 30 km beyond: '?'); each selected; then the
//           same scene with the recon vehicle taken out (only infantry: every army '?'). A build without the recon vehicle shoots the infantry
//           scene only
//   card    the Mobilize list of a city with an Army Base I, the Recon Vehicle's unit card from it, the research tree's Armoured Forces column and
//           the Recon Vehicle's node (a build without it: the list and the column)
//   figure  a recon stack (and a recon vehicle alone) on the map at play zoom and at close zoom (its picture figure and counter)
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs'), pickNation = require('./pick-nation.js');
const PAGE = path.resolve(process.argv[2]), LABEL = process.argv[3], OUT = process.argv[4], MODE = process.argv[5] || 'both', PARTS = (process.argv[6] || 'start,scene,card,figure').split(',');
fs.mkdirSync(OUT, { recursive: true });
const LOGF = path.join(OUT, `${LABEL}-log.txt`); const log = (...a) => { const t = [LABEL, ...a].join(' '); console.log(t); fs.appendFileSync(LOGF, t + '\n'); };
async function open(phone, nation){
  const W = phone ? 440 : 1440, H = phone ? 956 : 900;
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: phone ? 2 : 1, hasTouch: phone, isMobile: false });
  const p = await ctx.newPage(), errors = []; p.setDefaultTimeout(20000); p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await p.goto('file://' + PAGE + '?start=nations'); await p.waitForSelector('[data-act="pick"]', { timeout: 90000 }); await p.waitForTimeout(800);
  await pickNation(p, nation); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 90000 }); await p.waitForTimeout(1500);
  await p.click('[data-act="tip-skip"]', { timeout: 1500 }).catch(() => {}); await p.evaluate(() => { window.__im.S.speed = 0; });
  const tag = phone ? 'phone' : 'desk';
  const clean = () => p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const k = document.querySelector('[data-act="tip-skip"]'); if (k) k.click(); });
  const settle = () => p.waitForFunction(() => !window.__im.mapBusy || !window.__im.mapBusy(), null, { timeout: 25000 }).catch(() => {});
  const shot = async n => { await clean(); await p.waitForTimeout(250); await p.screenshot({ path: path.join(OUT, `${LABEL}-${tag}-${n}.png`) }); log(tag, 'shot', n); };
  // the camera: the point (world units) in the middle of the map that shows (under the top bar, above the command bar and the phone's sheet), at hexPx hp
  const center = async (x, y, hp) => { await p.evaluate(([x, y, hp]) => { const im = window.__im; im.camGo(x, y, hp/(im.hexPx()/im.view.s)); }, [x, y, hp]);
    await p.waitForFunction(() => !window.__im.camFly, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(300);
    await p.evaluate(([x, y]) => { const im = window.__im, v = im.view, r = document.getElementById('map').getBoundingClientRect(), [sx, sy] = im.toScreen(x, y);
      const tops = ['cmdbar', 'side'].map(id => document.getElementById(id)).filter(el => el && !el.hidden && el.getBoundingClientRect().height > 0 && el.getBoundingClientRect().left < r.left + r.width/2 && el.getBoundingClientRect().right > r.left + r.width/2).map(el => el.getBoundingClientRect().top);
      const top = 100, bot = Math.min(r.top + r.height, ...tops.filter(t => t > top + 120)), gx = r.width/2, gy = (top + bot)/2 - r.top; v.x += gx - sx; v.y += gy - sy; im.redraw(); }, [x, y]);
    await p.waitForTimeout(500); await settle(); await p.waitForTimeout(400); };
  const away = () => phone ? null : p.mouse.move(W - 30, H - 30);
  return { b, p, errors, tag, shot, center, away, settle, W, H, phone };
}
const sideText = p => p.evaluate(() => { const s = document.getElementById('side'); return s ? s.innerText.replace(/\s+/g, ' ').slice(0, 300) : ''; });

async function partStart(phone){
  for (const nation of ['Russia', 'Germany', 'Belarus']){ const o = await open(phone, nation), p = o.p, k = nation.toLowerCase();
    const sc = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, N = S.nations[0], F = S.armies.filter(a => a.owner === 0 && !a.air);
      const pts = F.map(a => [G.P[a.at].x, G.P[a.at].y]), xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
      return { cap:N.capital, forces:F.map(a => ({ id:a.id, at:G.P[a.at].cityName || G.P[a.at].name, cap:a.at === N.capital, u:Object.fromEntries(Object.entries(a.u).filter(([, v]) => v > 0)) })),
        box:[Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] }; });
    log(o.tag, nation, 'start', JSON.stringify(sc.forces));
    const span = Math.max(sc.box[2] - sc.box[0], (sc.box[3] - sc.box[1])*1.8, 20), hp = Math.max(8, Math.min(60, (o.phone ? 280 : 720)/span*12));
    await o.center((sc.box[0] + sc.box[2])/2, (sc.box[1] + sc.box[3])/2, hp); await o.away(); await p.waitForTimeout(600); await o.shot(`start-${k}`);
    const outer = sc.forces.find(f => !f.cap);
    await p.evaluate(id => { const im = window.__im; im.clearSel(); im.selectArmy(id); }, outer.id); await p.waitForTimeout(700); await o.shot(`start-${k}-stack`);
    log(o.tag, nation, 'panel', await sideText(p)); if (o.errors.length) log(o.tag, 'ERRORS', JSON.stringify(o.errors.slice(0, 5))); await o.b.close(); } }

async function partScene(phone){ const o = await open(phone, 'Russia'), p = o.p;
  const has = await p.evaluate(() => !!window.__im.S && typeof UNITS !== 'undefined' && !!UNITS.rcn).catch(() => false);
  const sc = await p.evaluate(rcn => { const im = window.__im, S = im.S, G = im.G, kz = S.nations.findIndex(N => N.name === 'Kazakhstan'), C = G.P[S.nations[kz].capital];
    im.fix.declareWar(0, kz); S.armies = S.armies.filter(a => a.owner !== kz || a.air);
    const KM = KM_W, at = (x, y) => { const c = worldToCell(x, y); return c >= 0 ? G.prov[c] : -1; };
    let dir = null; for (let k = 0; k < 16 && !dir; k++){ const t = k*Math.PI/8, d = [Math.cos(t), Math.sin(t)]; if ([0, 25, 45, 85, 115, 140].every(km => { const q = at(C.x + d[0]*km*KM, C.y + d[1]*km*KM); return q >= 0 && !G.P[q].sea && S.owner[q] === kz; })) dir = d; }
    const pt = km => [C.x + dir[0]*km*KM, C.y + dir[1]*km*KM], put = (o, km, u, side = 0) => { const [x0, y0] = pt(km), x = x0 - dir[1]*side*KM, y = y0 + dir[0]*side*KM, a = im.addArmy(o, at(x, y), u); a.pos = [x, y]; a.m = 80; return a; };
    const me = put(0, 0, rcn ? { inf:2, rcn:1 } : { inf:2 }), me2 = put(0, 115, { inf:2 });
    const f1 = put(kz, 25, { inf:3, tank:2 }, 8), f2 = put(kz, 45, { inf:2, art:1, sam:1 }, -10), f3 = put(kz, 85, { inf:4, ifv:2 }, 6);
    S.reveal = {}; S.intel = {}; im.redraw(); const [mx, my] = pt(50);
    return { me:me.id, me2:me2.id, foes:[f1.id, f2.id, f3.id], cx:mx, cy:my }; }, has);
  log(o.tag, 'scene', has ? 'recon vehicle' : 'infantry only (no recon vehicle in this build)', JSON.stringify(sc));
  const views = () => p.evaluate(ids => (visCache = null, ids).map(id => { const im = window.__im, a = im.S.armies.find(x => x.id === id), v = armyView(a, visibleSet(0)); return v ? (v.unk ? '?' : JSON.stringify(v.u)) : 'unseen'; }), sc.foes);
  const run = async tagS => { log(o.tag, tagS, 'views', JSON.stringify(await views()));
    await p.evaluate(() => window.__im.clearSel()); await o.center(sc.cx, sc.cy, o.phone ? 110 : 150); await o.away(); await o.shot(`${tagS}-map`);
    for (const [i, id] of sc.foes.entries()){ await p.evaluate(id => { const im = window.__im; im.clearSel(); im.selectFoe(id); }, id); await p.waitForTimeout(700); await o.shot(`${tagS}-foe${i + 1}`); log(o.tag, tagS, 'foe', i + 1, await sideText(p)); } };
  if (has){ await run('scene-recon');
    await p.evaluate(id => { const im = window.__im, a = im.S.armies.find(x => x.id === id); a.u.rcn = 0; a.w.rcn = 0; visCache = null; im.redraw(); }, sc.me); }
  await run('scene-inf');
  if (o.errors.length) log(o.tag, 'ERRORS', JSON.stringify(o.errors.slice(0, 5))); await o.b.close(); }

async function partCard(phone){ const o = await open(phone, 'Russia'), p = o.p;
  const has = await p.evaluate(() => typeof UNITS !== 'undefined' && !!UNITS.rcn);
  const city = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, N = S.nations[0], P = G.P.find(q => (q.cityName || q.name) === 'Saint Petersburg'); S.bld[P.id].fac = 1; N.cash = 900; im.selectProv(P.id); return P.id; });
  await p.waitForTimeout(600); await o.center(o.p ? await p.evaluate(c => window.__im.G.P[c].x, city) : 0, await p.evaluate(c => window.__im.G.P[c].y, city), 60);
  await p.evaluate(c => window.__im.selectProv(c), city); await p.waitForTimeout(500);
  await p.click('[data-act="cs-mob"]').catch(e => log(o.tag, 'no cs-mob', e.message)); await p.waitForTimeout(700); await o.shot('card-mobilize');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300); await p.evaluate(() => window.__im.clearSel());
  await p.click('[data-act="research-open"]'); await p.waitForTimeout(500); await p.click('[data-act="rbranch"][data-b="arm"]').catch(() => {}); await p.waitForTimeout(600); await o.shot('card-research');
  if (has){ await p.evaluate(() => { const e = document.querySelector('.rnode[data-id="u_rcn"]'); if (e) e.scrollIntoView({ block:'center', inline:'center' }); }); await p.waitForTimeout(300); await o.shot('card-research-line');
    await p.evaluate(() => { const e = document.querySelector('.rnode[data-id="rcn_g2"]'); if (e) e.scrollIntoView({ block:'center', inline:'center' }); }); await p.waitForTimeout(300); await o.shot('card-research-line2');
    await p.click('.rnode[data-id="u_rcn"]').catch(e => log(o.tag, 'no u_rcn node', e.message)); await p.waitForTimeout(700); await o.shot('card-research-node');
    // the unit card's i button: the unit's numbers by research (unitStrength)
    await p.click('.rs-card [data-act="rstats"]').catch(e => log(o.tag, 'no rstats', e.message)); await p.waitForTimeout(700); await o.shot('card-unit-stats');
    log(o.tag, 'stats', await p.evaluate(() => { const m = document.querySelector('.rs-stats, #modal, .rs-card'); return m ? m.innerText.replace(/\s+/g, ' ').slice(0, 400) : ''; }));
    await p.click('[data-act="rstats-x"]').catch(() => {}); await p.waitForTimeout(200);
    await p.click('.rs-card [data-act="rcard-x"]').catch(() => {}); await p.waitForTimeout(200); await p.click('.rnode[data-id="rcn_optics"]').catch(e => log(o.tag, 'no rcn_optics', e.message)); await p.waitForTimeout(700); await o.shot('card-research-sensors'); }
  if (o.errors.length) log(o.tag, 'ERRORS', JSON.stringify(o.errors.slice(0, 5))); await o.b.close(); }

async function partFigure(phone){ const o = await open(phone, 'Russia'), p = o.p;
  const sc = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, N = S.nations[0], A = S.armies.find(a => a.owner === 0 && !a.air && a.at !== N.capital && a.u.rcn > 0) || S.armies.find(a => a.owner === 0 && !a.air && a.at !== N.capital), P = G.P[A.at];
    const nb = P.nbs.find(v => !G.P[v].sea && S.owner[v] === 0), solo = typeof UNITS !== 'undefined' && UNITS.rcn ? im.addArmy(0, nb, { rcn:1 }) : null; im.redraw();
    return { id:A.id, x:P.x, y:P.y, solo:solo && solo.id, sx:solo ? G.P[nb].x : null, sy:solo ? G.P[nb].y : null, u:A.u }; });
  log(o.tag, 'figure', JSON.stringify(sc));
  await o.center(sc.x, sc.y, 50); await o.away(); await o.shot('figure-play');
  await p.evaluate(id => { const im = window.__im; im.clearSel(); im.selectArmy(id); }, sc.id); await p.waitForTimeout(600); await o.shot('figure-play-sel');
  await p.evaluate(() => window.__im.clearSel()); await o.center(sc.x, sc.y, 220); await o.away(); await p.waitForTimeout(1500); await o.settle(); await o.shot('figure-close');
  if (sc.solo){ await o.center(sc.sx, sc.sy, 50); await o.away(); await o.shot('figure-solo-play'); await o.center(sc.sx, sc.sy, 220); await p.waitForTimeout(1500); await o.settle(); await o.shot('figure-solo-close'); }
  if (o.errors.length) log(o.tag, 'ERRORS', JSON.stringify(o.errors.slice(0, 5))); await o.b.close(); }

(async () => { for (const phone of MODE === 'both' ? [false, true] : [MODE === 'phone']){
    for (const part of PARTS){ const t0 = Date.now(); try { await { start:partStart, scene:partScene, card:partCard, figure:partFigure }[part](phone); } catch (e){ log(phone ? 'phone' : 'desk', part, 'FAILED', e.message.split('\n')[0]); }
      log(phone ? 'phone' : 'desk', part, 'done in', Math.round((Date.now() - t0)/1000), 's'); } } })();
