// Research redesign: screenshots of the category list, two category trees and a node's detail card, desktop and phone.
//   node .test/v4research-shots.js [outdir]   (bash tools/mkpage.sh first)
const { chromium } = require('playwright');
const OUT = process.argv[2] || __dirname;
(async () => { const b = await chromium.launch(); const errs = [];
  for (const [tag, vp] of [['d', { width: 1440, height: 900 }], ['p', { width: 430, height: 932 }]]){
    const p = await b.newPage({ viewport: vp, deviceScaleFactor: tag === 'p' ? 2 : 1, isMobile: tag === 'p', hasTouch: tag === 'p' });
    p.on('pageerror', e => errs.push(tag + ' ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(tag + ' ' + m.text()); });
    await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(500);
    await p.click('[data-act="pick"][data-p="4"]'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.waitForTimeout(900);
    // a nation part of the way in: day 12, some research done, one project in each slot
    await p.evaluate(() => { const im = window.__im, S = im.S, N = S.nations[0]; S.hour = 11*24 + 6; for (const k of ['cash', 'metal', 'iron', 'elec']) N[k] = 900; N.rare = 60;
      const g = (id, lv) => im.rs.grant(0, id, lv); g('tank_armor', 1); g('tank_fp', 1); g('tank_pr', 2); g('inf_armor', 1); g('inf_g2', 1); g('inf_fp', 1); g('u_ifv', 1); g('u_int', 1); g('u_jet', 1); g('jet_pgm', 1); g('int_fp', 1); g('u_spec', 1); g('u_drone', 1); g('drone_g2', 1);
      N.research = N.research2 = null; im.rs.start(0, 'tank_gun'); im.rs.start(0, 'jet_rng'); N.research.h = Math.round(N.research.h0*0.45); N.research2.h = Math.round(N.research2.h0*0.7); N.rare = 31; });
    const shot = async n => { await p.waitForTimeout(350); await p.screenshot({ path: `${OUT}/${tag}-${n}.png` }); };
    await p.click('[data-act="research-open"]'); await shot('1-list');
    for (const [c, sel, n] of [['arm', 'tank_g2', '2-armoured'], ['tac', 'u_asf', '3-tactical-air'], ['inf', 'inf_terr', '4-infantry'], ['str', 'u_stealth', '5-strategic-air'], ['msl', null, '6-strategic-weapons'], ['uns', 'drone_g3', '7-unmanned']]){
      await p.evaluate(() => { const b0 = document.querySelector('[data-act="rback"]'); if (b0) b0.click(); }); await p.waitForTimeout(150);
      await p.click(`[data-act="rbranch"][data-b="${c}"]`); await shot(n);
      if (sel){ await p.click(`.rnode[data-id="${sel}"]`); await shot(n + '-card'); } }
    await p.close(); }
  console.log(JSON.stringify({ errors: errs })); await b.close(); process.exit(errs.length ? 1 : 0); })();
