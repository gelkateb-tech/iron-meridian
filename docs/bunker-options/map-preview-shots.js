// PREVIEW ONLY: swaps bn-fort-1 / bn-fort-5 (game fortifications level 1 / 3) in the TEST BUILD (.test) for each option's cut-out; nothing in assets/ or index.html changes.
const fs = require('fs'), path = require('path');
const ROOT = '/home/user/iron-meridian-ba', SP = process.argv[2];
const pickNation = require(ROOT + '/.test/pick-nation.js');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const pg0 = fs.readFileSync(ROOT + '/.test/page.html', 'utf8');
  const orig = {1: fs.readFileSync(ROOT + '/assets/art/bn-fort-1.webp'), 5: fs.readFileSync(ROOT + '/assets/art/bn-fort-5.webp')};
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  for (const opt of ['today', 'a', 'b', 'c']) for (const lv of [1, 5]) {
    const dir = opt === 'today' ? null : `${SP}/cut-${opt}`;
    fs.writeFileSync(ROOT + `/.test/assets/art/bn-fort-${lv}.webp`, dir ? fs.readFileSync(`${dir}/bn-fort-${lv}.webp`) : orig[lv]);
    let pg = pg0;
    if (dir) { const m = JSON.parse(fs.readFileSync(`${dir}/bn-meta.json`))[`bn-fort-${lv}`];
      pg = pg.replace(new RegExp(`"bn-fort-${lv}":\\{[^}]*\\}`), `"bn-fort-${lv}":${JSON.stringify(m)}`); }
    fs.writeFileSync(ROOT + '/.test/page-preview.html', pg);
    const ctx = await b.newContext({ viewport: { width: 440, height: 900 }, deviceScaleFactor: 2, hasTouch: true });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + ROOT + '/.test/page-preview.html?start=nations'); await p.waitForTimeout(500);
    await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
    await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 });
    const be = await p.evaluate((lv) => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im, S = im.S, G = im.G; S.speed = 0;
      const be = G.P.find(q => q.cityName === 'Berlin'); Object.assign(S.bld[be.id], {fac:4, air:3, arms:2, rec:2, fort: lv === 1 ? 1 : 3, silo:1}); return [be.x, be.y]; }, lv);
    await p.waitForTimeout(800);
    await p.evaluate(() => { try { window.__im.S.armies.splice(0); } catch (e) {} });
    await p.evaluate(([x, y, hp, W, H]) => { const im = window.__im, v = im.view, s = hp/12; v.s = s; v.x = W/2 - x*s; v.y = H/2 - y*s; im.redraw(); }, [be[0], be[1], 150, 440, 900]);
    await p.waitForTimeout(1500);
    let f = null; for (let t = 0; t < 6 && !f; t++) { await p.evaluate(() => window.__im.redraw()); await p.waitForTimeout(400); f = await p.evaluate(() => { const e = window.__im.bn.dbg.find(e => e.k === 'fort'); return e && {wx:e.wx, wy:e.wy, pic:e.pic || e.nm}; }); }
    if (f) { await p.evaluate(([x, y, hp, W, H]) => { const im = window.__im, v = im.view, s = hp/12; v.s = s; v.x = W/2 - x*s; v.y = H/2 - y*s; im.redraw(); }, [(f.wx + be[0])/2, (f.wy + be[1])/2 + 3, 210, 440, 900]); await p.waitForTimeout(1500); }
    const info = f;
    await p.screenshot({ path: `${SP}/map-${opt}-L${lv === 1 ? 1 : 5}.png` });
    console.log(opt, lv, info, errs.length ? errs : 'no errors');
    await ctx.close();
  }
  fs.writeFileSync(ROOT + '/.test/assets/art/bn-fort-1.webp', orig[1]); fs.writeFileSync(ROOT + '/.test/assets/art/bn-fort-5.webp', orig[5]);
  await b.close();
})();
