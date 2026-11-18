// The unit look (owner's requests): the square badge, the infantry figures and the dug-in shield. node .test/unit-badge.js [W H dpr]
// prints JSON {checks, fails, errors} and exits 1 on any failure.
//  badge   the owner's Conflict of Nations badge: zoomed in 52 x 46 px (flag 20 + bar 26, count about 19 px, white tag 18 with a 15 px navy icon over the
//          bar's left edge), zoomed out a 28 px square with the same tag, no flag, no count; the canvases show a flag, a white count, the tag
//  figures the infantry, anti-tank and special forces squads (m-sol, m-sat, m-ssf) are 3D soldiers, not pictures: each sheet has a soft shadow
//          (semi-transparent dark pixels round the figures) and is not a single-colour blob (the figures' colours vary); close in the map draws
//          them as models (TM debug: no picture for a squad), and a squad on the march still bobs (its drawn spot moves up and down)
//  shield  a dug-in force's badge carries the shield with its own small hit box; hovering it (desktop) or tapping it (touch) shows exactly the
//          owner's sentence and selects nothing; a tap on the badge elsewhere still selects the force
const pickNation = require('./pick-nation.js');
const { chromium } = require('playwright');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), DPR = +(process.argv[4] || 1), PHONE = W <= 820;
const TIP = 'Dug in: +10% defence in the open, +25% inside a city. The unit has held position for 12+ hours, or is in a fortified friendly province.';
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: PHONE, isMobile: false });
  const p = await ctx.newPage(); const errors = [], checks = {};
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.addInitScript(() => { let s = 0x2f6b1d3; Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0)/4294967296; }; });
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
  await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 });
  const sc = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove());
    const im = window.__im, S = im.S, G = im.G, by = n => G.P.find(P => P.cityName === n), nat = n => S.nations.findIndex(q => q.name === n), rk = (a, b) => Math.min(a, b) + ',' + Math.max(a, b);
    S.rel[rk(0, nat('France'))] = { st: 'war', since: S.hour, until: null };
    const ber = by('Berlin'), mun = by('Munich');
    const inf = im.addArmy(0, ber.id, { inf: 6 }); inf.stance = 'defend'; im.addArmy(0, ber.id, { tank: 3, ifv: 2 });
    const sq = im.addArmy(0, mun.id, { spec: 2, at: 2, inf: 2 });
    S.speed = 1; im.tick(); im.tick(); S.speed = 0;
    return { ber: [ber.x, ber.y], mun: [mun.x, mun.y], inf: inf.id, sq: sq.id }; });
  const view = (xy, hp) => p.evaluate(([x, y, hp, W, H]) => { const v = window.__im.view, s = hp/12; v.s = s; v.x = W/2 - x*s; v.y = H/2 - y*s; }, [xy[0], xy[1], hp, W, H]);
  const off = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return [r.left, r.top]; });
  // (1) the badge (owner's Conflict of Nations badge): zoomed in 52 x 46 (flag 20 + bar 26, tag 18 with a 15 px icon), zoomed out a 28 px square; quiet foreign forces the same size (owner, 2026-11-18)
  const zs = PHONE ? [28, 70, 170] : [40, 100, 170];
  const dimsNear = await p.evaluate(() => { const D = window.__im.uicon.dims(14, false, false); return { w: D.w, h: D.h, fh: D.fh, bh: D.bh, tg: D.tg, ti: D.ti, fz: D.fz, ox: D.ox }; });
  const dimsFar = await p.evaluate(() => { const D = window.__im.uicon.dims(14, false, true); return { w: D.w, h: D.h, tg: D.tg, ti: D.ti }; });
  checks.dims = { ok: dimsNear.w === 52 && dimsNear.fh === 20 && dimsNear.bh === 26 && dimsNear.h === 46 && dimsNear.tg === 18 && dimsNear.ti === 15 && dimsNear.fz >= 17 && dimsNear.ox === 9 && dimsFar.w === 28 && dimsFar.h === 28 && dimsFar.tg === 18 && dimsFar.ti === 15, near: dimsNear, far: dimsFar };
  const okD = new Set([46, 28, Math.round(46*0.86*2)/2, Math.round(28*0.86*2)/2, 39.5, 24, 24.5]);
  for (const hp of zs){ await view(sc.ber, hp); await p.waitForTimeout(1500);
    const r = await p.evaluate(() => window.__im.hits.filter(h => !h.unk && h.a > 0.5).map(h => ({ d: h.d, tag: h.tag, ids: h.ids })));
    checks['badge-' + hp] = { ok: r.length > 0 && r.every(h => okD.has(h.d) && (h.tag ? h.d >= 39 : h.d <= 28)), n: r.length, sides: [...new Set(r.map(h => h.d + (h.tag ? 't' : 'f')))] }; }
  // the badge canvases: near = a flag on top (several colours), the bar in the side colour with a white count at its right, a white tag with navy icon over its left edge; far = a side-colour square with a white tag and a navy icon
  const parts = await p.evaluate(() => { const U = window.__im.uicon, d = U.dpr, out = {};
    const stat = (g, E, x, y, w, h) => { const a = g.getImageData(Math.round((E.ox + x)*d), Math.round((E.oy + y)*d), Math.max(1, Math.round(w*d)), Math.max(1, Math.round(h*d))).data; const cols = new Set(); let white = 0, navy = 0, n = 0;
      for (let i = 0; i < a.length; i += 4){ n++; cols.add((a[i] >> 4) + ',' + (a[i + 1] >> 4) + ',' + (a[i + 2] >> 4)); if (a[i] > 225 && a[i + 1] > 225 && a[i + 2] > 225) white++; if (a[i] < 70 && a[i + 1] < 80 && a[i + 2] > 40 && a[i + 2] < 110 && a[i + 3] > 200) navy++; } return { cols: cols.size, white: white/n, navy: navy/n }; };
    for (const [t, side] of [['inf', 'own'], ['mot', 'own'], ['tank', 'war'], ['frig', 'ally'], ['jet', 'other']]){ const D = U.dims(14, false, false), F = U.dims(14, false, true), E = U.badge(t, side, 14, 0, false, false), g = E.c.getContext('2d'), Ef = U.dia(t, side, 14, false), gf = Ef.c.getContext('2d'), cy = D.fh + D.bh/2;
      out[t] = { w: E.c.width/d - 2*(E.ox - D.ox) - D.ox, flag: stat(g, E, 2, 1, D.w - 4, D.fh - 2), count: stat(g, E, D.w - 5 - D.tw, D.fh + 3, D.tw + 1, D.bh - 6), tag: stat(g, E, -D.tg/2 + 3, cy - D.tg/2 + 3, D.tg - 6, D.tg - 6), bar: stat(g, E, D.w - 4, D.fh + 3, 3, D.bh - 6),
        far: stat(gf, Ef, F.w/2 - F.tg/2 + 3, F.h/2 - F.tg/2 + 3, F.tg - 6, F.tg - 6), farEdge: stat(gf, Ef, 2, 2, 5, 5) }; }
    return out; });
  for (const [t, q] of Object.entries(parts)) checks['badge-parts-' + t] = { ok: !!q && q.flag.cols >= 3 && q.count.white > 0.04 && q.tag.white > 0.3 && q.tag.navy > 0.03 && q.far.white > 0.3 && q.far.navy > 0.03 && q.farEdge.white < 0.2 && q.bar.white < 0.05, ...q };
  // (2) the infantry figures: 3D squads with a soft shadow, not single-colour blobs
  const sheets = await p.evaluate(async () => { const out = {};
    for (const t of ['sol', 'sat', 'ssf']){ const im = new Image(); im.src = 'assets/units/m-' + t + '.webp'; try { await im.decode(); } catch (e) { out[t] = { err: 'load' }; continue; }
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      let d; try { d = g.getImageData(0, 0, c.width, c.height).data; } catch (e) { out[t] = { err: 'read' }; continue; }
      let solid = 0, shadow = 0, sl = 0, sl2 = 0; const hues = new Set();
      for (let i = 0; i < d.length; i += 4){ const a = d[i + 3]; if (a > 200){ solid++; const l = 0.3*d[i] + 0.59*d[i + 1] + 0.11*d[i + 2]; sl += l; sl2 += l*l; hues.add((d[i] >> 5) + ',' + (d[i + 1] >> 5) + ',' + (d[i + 2] >> 5)); }
        else if (a > 25 && a < 200 && d[i] + d[i + 1] + d[i + 2] < 120) shadow++; }
      const mean = sl/Math.max(1, solid); out[t] = { solid, shadow, shadowShare: +(shadow/Math.max(1, solid)).toFixed(2), lumSD: +Math.sqrt(Math.max(0, sl2/Math.max(1, solid) - mean*mean)).toFixed(1), colours: hues.size, meta: !!window.U3D.mapMeta(t) }; }
    return out; });
  for (const [t, q] of Object.entries(sheets)) checks['figures-' + t] = { ok: !q.err && q.meta && q.shadowShare > 0.3 && q.lumSD > 18 && q.colours >= 12, ...q };
  // close in the squads are drawn as 3D models (no picture), and they bob on the march
  await view(sc.mun, 200); await p.evaluate(() => { window.__im.TM.dbg.on = true; }).catch(() => {}); await p.waitForTimeout(1800);
  const drawn = await p.evaluate(() => { const L = window.__im.TM && window.__im.TM.dbg; return L ? L.filter(q => /^(sol|sat|ssf)$/.test(q.t)).map(q => ({ t: q.t, art: q.art, lvl: q.lvl, h: q.h })) : null; });
  checks.figuresDrawn = { ok: !!drawn && ['sol', 'sat', 'ssf'].every(t => drawn.some(q => q.t === t && !q.art && q.lvl !== 'art')) && drawn.every(q => q.h >= 15), drawn };
  const bob = await p.evaluate(async ([id]) => { const im = window.__im, S = im.S, G = im.G, a = S.armies.find(q => q.id === id), P = G.P[a.at], t = P.nbs.find(q => !G.P[q].sea && S.owner[q] === 0);
    im.orderMove(a, t); S.speed = 1; const ys = []; for (let i = 0; i < 40; i++){ await new Promise(r => setTimeout(r, 60)); const q = (im.TM.dbg || []).find(z => z.t === 'sol' && z.moving); if (q) ys.push(q.y - q.gl[1]); } S.speed = 0;
    let v = 0; for (let i = 1; i < ys.length; i++) v = Math.max(v, Math.abs(ys[i] - ys[i - 1])); return { n: ys.length, maxStep: +v.toFixed(2), spread: ys.length ? +(Math.max(...ys) - Math.min(...ys)).toFixed(2) : 0 }; }, [sc.sq]);
  checks.figuresBob = { ok: bob.n > 5 && bob.spread > 0.2, ...bob };
  await p.evaluate(() => { window.__im.TM.dbg.on = false; }).catch(() => {});
  // (3) the dug-in shield: its own hit box, the exact tooltip, a tap that selects nothing; the badge elsewhere still selects
  await p.evaluate(() => { window.__im.sel.army = null; }); await view(sc.ber, zs[2]); await p.waitForTimeout(1500);
  const dh = await p.evaluate(() => window.__im.uicon.dughit.map(r => ({ x: r.x, y: r.y, w: r.w, h: r.h, own: r.own })));
  const sh = dh.find(r => r.own && r.x > 20 && r.y > 60 && r.x < W - (PHONE ? 60 : 200) && r.y < H - (PHONE ? 160 : 200));
  checks.shieldBox = { ok: !!sh && sh.w <= 19 && sh.h <= 21 && sh.w >= 10, n: dh.length, box: sh };
  if (sh){ const cx = sh.x + sh.w/2, cy = sh.y + sh.h/2;
    if (!PHONE){ await p.mouse.move(off[0] + cx - 4, off[1] + cy - 4); await p.mouse.move(off[0] + cx, off[1] + cy); await p.waitForTimeout(300);
      const t = await p.evaluate(() => { const e = document.getElementById('tip'); return e && !e.hidden ? e.textContent.trim() : null; });
      checks.shieldHover = { ok: t === TIP, text: t }; await p.mouse.move(off[0] + 5, off[1] + H - 60); }
    await p.evaluate(([x, y]) => window.__im.tap(x, y), [cx, cy]); await p.waitForTimeout(250);
    const r = await p.evaluate(() => { const e = document.getElementById('tip'); return { text: e && !e.hidden ? e.textContent.trim() : null, sel: window.__im.sel.army }; });
    checks.shieldTap = { ok: r.text === TIP && r.sel == null, ...r };
    const hb = await p.evaluate(id => { const h = window.__im.hits.find(q => q.ids.includes(id)); return h && { x: h.x, y: h.y, w: h.w, h: h.h }; }, sc.inf);
    if (hb){ await p.evaluate(([x, y]) => window.__im.tap(x, y), [hb.x + hb.w/2, hb.y + hb.h*0.65]); await p.waitForTimeout(250);
      const s2 = await p.evaluate(() => ({ sel: window.__im.sel.army, ch: !!(document.getElementById('chooser') && !document.getElementById('chooser').hidden) }));
      checks.badgeTap = { ok: s2.sel != null || s2.ch, ...s2 }; } else checks.badgeTap = { ok: false, why: 'no badge box' }; }
  const bad = Object.entries(checks).filter(([, v]) => !v.ok);
  console.log(JSON.stringify({ viewport: [W, H, DPR], checks, fails: bad.map(([k]) => k), errors }, null, 1));
  await b.close(); process.exit(bad.length || errors.length ? 1 : 0);
})();
