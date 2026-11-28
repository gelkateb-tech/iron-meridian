// plan stats per city (CITIES redo): style, lattice cell, cells, buildings per level, trees, parks, plan time
const { chromium } = require('playwright'); const path = require('path'); const pickNation = require('./pick-nation.js');
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const ctx = await b.newContext({ viewport:{width:1440, height:900}, deviceScaleFactor:2 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, process.env.PAGE || 'page.html')); await p.waitForTimeout(900);
  await p.click('[data-act="pickscn"][data-k="world64"]'); await p.waitForTimeout(300); await pickNation(p, 'Germany');
  await p.evaluate(() => document.querySelector('[data-act="begin"]').scrollIntoView()); await p.click('[data-act="begin"]'); await p.waitForTimeout(1300);
  if (await p.locator('[data-act="start"]').count()) await p.click('[data-act="start"]'); await p.waitForTimeout(2500);
  const names = (process.argv[2] || 'Berlin,Kabul,Damascus,Chicago,Moscow,Paris,Kolkata').split(',');
  const r = await p.evaluate(names => { const im = window.__im; im.S.speed = 0; const out = {};
    for (const nm of names){ const P = im.G.P.find(q => q.cityName === nm); if (!P){ out[nm] = null; continue; } im.view.s = 30/12; im.cityDbg.time(P.id, 128); out[nm] = im.cityDbg.plan(P.id); for (const k of ['ms', 'E', 's']) out[nm][k] = +out[nm][k].toFixed(1); }
    return out; }, names);
  for (const [k, v] of Object.entries(r)) console.log(k, JSON.stringify(v)); console.log('ERR', errs.slice(0, 3)); await b.close(); })();
