// Unit icons in the UI: mobilize list, army panel, research tree. node .test/uicon-ui-shots.js [outdir]
const { chromium } = require('playwright');
const OUT = process.argv[2] || __dirname;
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const errs = [];
  for (const [name, vp, mob] of [['desk', { width: 1440, height: 900 }, false], ['phone', { width: 390, height: 844 }, true]]){
    const ctx = await b.newContext({ viewport: vp, isMobile: mob, hasTouch: mob, deviceScaleFactor: mob ? 2 : 1 }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(name + ' console: ' + m.text()); });
    await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
    await p.click('[data-act="pick"][data-p="0"]'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
    await p.waitForFunction(() => window.__im && !window.__im.camFly, null, { timeout: 15000 }).catch(() => {});
    const info = await p.evaluate(() => { const im = window.__im, S = im.S, N = S.nations[0], cap = N.capital;
      for (const T of ['inf1', 'inf2', 'inf3', 'para1', 'art2', 'heli1', 'drone1', 'air1', 'swarm1', 'sdrone1', 'jam1', 'bomb1', 'mpa1', 'awacs1', 'asf1', 'nav2', 'msl1', 'msl2']) N.tech[T] = 1;
      N.cash += 5000; N.rare += 500; N.metal += 500; N.elec += 500; N.oil += 500; N.iron += 500;
      Object.assign(S.bld[cap], { fac: 3, air: 3, yard: 2, rec: 2, silo: 1 });
      document.querySelectorAll('.toast').forEach(t => t.remove());
      const a = im.addArmy(0, cap, { inf: 3, at: 2, tank: 4, art: 2, mlrs: 1, sam: 1, ifv: 2, spec: 1, jam: 1 });
      return { cap, id: a.id }; });
    const shot = async k => { await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}/uicon-${name}-${k}.png` }); };
    await p.evaluate(q => window.__im.selectProv(q), info.cap); await p.waitForTimeout(500);
    await p.evaluate(() => { const sd = document.getElementById('side'), e = [...sd.querySelectorAll('.eyebrow')].find(x => /Recruit/.test(x.textContent)); if (e) e.scrollIntoView(); });
    await shot('mobilize');
    await p.evaluate(q => { const im = window.__im, N = im.S.nations[0]; im.recruit(0, q, 'tank'); im.recruit(0, q, 'heli'); im.buildMissile(0, q, 'cm'); N.tech.msl1 = N.tech.msl2 = 1; im.selectProv(q); }, info.cap); await shot('training');
    await p.evaluate(() => { const d = document.querySelector('[data-act="msl-dd"]'); if (d) d.click(); }); await shot('missiles');
    await p.evaluate(() => { const d = document.querySelector('[data-act="msl-dd"]'); if (d) d.click(); });
    await p.evaluate(id => window.__im.selectArmy(id), info.id); await shot('army');
    await p.evaluate(() => document.querySelector('[data-act="research-open"]').click()); await p.waitForTimeout(300);
    await p.evaluate(() => { const b0 = document.querySelector('#sheet [data-act="rbranch"][data-b="Armor"]'); if (b0) b0.click(); }); await shot('res-armor');
    await p.evaluate(() => { const b0 = document.querySelector('#sheet [data-act="rback"]'); if (b0) b0.click(); });
    await p.evaluate(() => { const b0 = document.querySelector('#sheet [data-act="rbranch"][data-b="Air"]'); if (b0) b0.click(); }); await shot('res-air');
    await ctx.close();
  }
  console.log(JSON.stringify(errs));
  await b.close();
})();
