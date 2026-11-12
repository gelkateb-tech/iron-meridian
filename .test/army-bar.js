// The army bar and Army Info (owner request): a battle on the map (crossed swords, no health bars), the army bar of a mixed stack in a fight
// (health 192/192-style, stats row, diamonds with Mark badges, countdown, i button), a unit's own details, Army Info with the Strength table
// (a modified value with its arrow and base), a foreign force's read-only bar. node .test/army-bar.js [outDir]   (run bash tools/mkpage.sh first)
const pickNation = require('./pick-nation.js');   // (a start-screen card by its nation's name, on either world)
const { chromium } = require('playwright');
const OUT = process.argv[2] || __dirname;
const RES = [['desk', 1440, 900, 2], ['phone', 390, 844, 2]];
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const errors = [], checks = {}, ok = (k, v, i) => { checks[k] = v ? 'PASS' : 'FAIL ' + JSON.stringify(i ?? null); };
  for (const [TAG, W, H, DPR] of RES){
    const PHONE = W <= 820;
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: PHONE, isMobile: false });
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(TAG + ' pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) errors.push(TAG + ' console: ' + m.text()); });
    await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
    await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
    await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 });
    const sc = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove());
      const im = window.__im, S = im.S, G = im.G, N = S.nations, nat = n => N.findIndex(q => q.name === n), rk = (a, b) => Math.min(a, b) + ',' + Math.max(a, b), fr = nat('France'), WI = 631;
      S.rel[rk(0, fr)] = { st: 'war', since: S.hour, until: null };
      const mine = im.addArmy(0, WI, { tank: 5, inf: 6, art: 2, ifv: 2, sam: 1 }), foe = im.addArmy(fr, WI, { tank: 4, inf: 6, art: 1 });
      N[0].tech = N[0].tech || {}; N[0].tech.tank_fp = 2; N[0].tech.inf_pr = 1; N[0].tv = (N[0].tv || 0) + 1;
      mine.m = 62; im.tick(); for (let i = 0; i < 3; i++) im.tickQ();   // a few battle steps in: some wounds
      im.S.speed = 0;
      return { id: mine.id, foe: foe.id, wi: [G.P[WI].x, G.P[WI].y], inBattle: S.battles.includes(WI), q: S.q }; });
    ok(TAG + ' battle on the map', sc.inBattle, sc);
    const view = (xy, hp, dx = 0, dy = 0) => p.evaluate(([x, y, hp, W, H]) => { const v = window.__im.view, s = hp/12; v.s = s; v.x = (W - (W > 820 ? 360 : 0))/2 - x*s; v.y = H/2 - y*s; }, [xy[0] + dx, xy[1] + dy, hp, W, H]);
    const mapShot = async (n, hp, dx = 0, dy = 0) => { await view(sc.wi, hp, dx, dy); await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/ab-${TAG}-map-${n}.png` }); };
    await mapShot('far', PHONE ? 12 : 16, 0, 20);
    await mapShot('mid', 60, 0, PHONE ? 30 : 0);
    await mapShot('close', 160, 0, 0);
    // select your stack: the army bar
    await p.evaluate(() => { document.querySelectorAll('[data-act="tip-ok"], .ftip button').forEach(b => b.click()); window.__im.S.speed = 0; });
    await p.evaluate(id => window.__im.selectArmy(id), sc.id); await p.waitForTimeout(1200);
    await view(sc.wi, PHONE ? 40 : 60, 0, PHONE ? 4 : 0); await p.waitForTimeout(1200);
    const bar = await p.evaluate(() => { const q = s => document.querySelector(s), t = s => { const e = q(s); return e ? e.textContent.trim() : null; };
      return { hp: t('.ab-hp b'), name: t('.ab-nm h2'), stats: [...document.querySelectorAll('.abs')].map(e => e.textContent.replace(/\s+/g, ' ').trim()), dias: document.querySelectorAll('.dia').length, marks: [...document.querySelectorAll('.dia .dl')].map(e => e.textContent), tick: t('.ab-tick'), i: !!q('.ab-i'), flag: !!q('.ab-top .flag, .ab-top img, .ab-top svg'), swords: !!q('canvas.ab-sw'), heal: t('.ab-heal'),
        swPx: (() => { const c = q('canvas.ab-sw'); if (!c) return 0; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; return n; })() }; });
    ok(TAG + ' bar: health as cur/max', /^\d+\/\d+$/.test(bar.hp || ''), bar.hp); ok(TAG + ' bar: name', /(Division|Brigade)/.test(bar.name || ''), bar.name); ok(TAG + ' bar: stats row has morale, speed, strength', bar.stats.length >= 4 && /Morale/.test(bar.stats[0]) && /Speed/.test(bar.stats[1]) && /Strength/.test(bar.stats[2]), bar.stats);
    ok(TAG + ' bar: a diamond per unit type with Mark badges', bar.dias === 5 && bar.marks.length === 5, bar); ok(TAG + ' bar: countdown, swords, i button', !!bar.tick && bar.swords && bar.swPx > 30 && bar.i, bar);
    await p.screenshot({ path: `${OUT}/ab-${TAG}-bar.png` });
    // the countdown moves with the game's time
    const t0 = await p.evaluate(() => window.__im.abTick()); await p.evaluate(() => { window.__im.S.speed = 1; }); await p.waitForTimeout(1300); const t1 = await p.evaluate(() => window.__im.abTick()); await p.evaluate(() => { window.__im.S.speed = 0; });
    ok(TAG + ' countdown ticks at speed 1', t0 !== t1 && /^\d+ s$/.test(t1), [t0, t1]);
    // a unit's own details
    await p.click('.dia[data-t="tank"]'); await p.waitForTimeout(400);
    const ud = await p.evaluate(() => { const e = document.querySelector('.ab-ud'); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; });
    ok(TAG + ' unit details open', !!ud && /Armored|Tank/i.test(ud) && /Attack/.test(ud), ud);
    await p.evaluate(() => { const e = document.querySelector('.ab-ud'); e && e.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/ab-${TAG}-unit.png` });
    await p.click('.ab-x'); await p.waitForTimeout(300);
    // Army Info
    await p.evaluate(() => { const e = document.querySelector('.ab-i'); e.scrollIntoView({ block: 'center' }); }); await p.click('.ab-i'); await p.waitForTimeout(600);
    const info = await p.evaluate(() => ({ rows: document.querySelectorAll('.sitab tbody tr').length, up: document.querySelectorAll('.sitab td.up').length, dn: document.querySelectorAll('.sitab td.dn').length, arrows: document.querySelectorAll('.sitab .ar').length, note: /health, terrain|health[^.]*terrain/i.test(document.querySelector('.si-note') ? document.querySelector('.si-note').textContent : ''), icons: document.querySelectorAll('.sitab tbody th svg').length, kind: window.__im.modalKind ? window.__im.modalKind() : null, text: document.querySelector('.sitab').innerText.replace(/\s+/g, ' ').slice(0, 400) }));
    ok(TAG + ' info: ten rows with icons', info.rows === 10 && info.icons >= 10, info); ok(TAG + ' info: modified values show an arrow and the base', info.arrows > 0 && info.dn > 0 && info.up > 0, info); ok(TAG + ' info: the note on health, terrain and efficiency', info.note, info.note);
    await p.screenshot({ path: `${OUT}/ab-${TAG}-info.png` });
    await p.evaluate(() => { const sh = document.getElementById('sheet'); sh.scrollTop = sh.scrollHeight; const m = document.getElementById('modal'); m.scrollTop = m.scrollHeight; }); await p.waitForTimeout(250); await p.screenshot({ path: `${OUT}/ab-${TAG}-info-note.png` });
    await p.click('[data-act="resume"]'); await p.waitForTimeout(300);
    // the foreign force: a read-only bar
    await p.evaluate(id => { window.__im.S.speed = 0; window.__im.selectFoe(id); }, sc.foe); await p.waitForTimeout(700);
    const foe = await p.evaluate(() => ({ nm: (document.querySelector('.ab-nm h2') || {}).textContent, hp: (document.querySelector('.ab-hp b') || {}).textContent, ren: !!document.querySelector('.ab-nm [data-act="rename"]'), acts: !!document.querySelector('[data-act="split-open"]'), morale: /Morale/.test(document.querySelector('.ab-stats').textContent) }));
    ok(TAG + ' foreign bar: read-only, health as a share, no morale or orders', /France/.test(foe.nm) && /%$/.test(foe.hp) && !foe.ren && !foe.acts && !foe.morale, foe);
    await p.screenshot({ path: `${OUT}/ab-${TAG}-foe.png` });
    await ctx.close();
  }
  console.log(JSON.stringify({ checks, errors }, null, 1));
  await b.close(); process.exit(errors.length || Object.values(checks).some(v => v !== 'PASS') ? 1 : 0);
})();
