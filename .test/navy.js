const pickNation = require('./pick-nation.js');   // (a start-screen card by its nation's name, on either world)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 800 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(400);
  await pickNation(p, 'United Kingdom'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.click('#sp0');
  const r = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G;
    // player (UK) gets a yard in the capital and a frigate; fleet-only path must stay at sea/ports
    const cap = S.nations[0].capital; S.bld[cap].yard = 2; S.nations[0].cash = 2000; S.nations[0].metal = 500*RES_K; S.nations[0].oil = 500*RES_K;
    const yardOk = G.P[cap].coast;
    for (let i = 0; i < 24*60; i++) im.tick();
    let ships = 0, yards = 0, fleets = 0; for (const a of S.armies) if (a.owner > 0){ ships += a.u.frig + a.u.sub + a.u.crui; if (a.u.frig + a.u.sub + a.u.crui === Object.values(a.u).reduce((x, y) => x + y, 0)) fleets++; }
    for (const P of G.P) if (S.owner[P.id] > 0 && S.bld[P.id].yard) yards++;
    const landShips = S.armies.filter(a => (a.u.frig + a.u.sub + a.u.crui) > 0 && !G.P[a.at].sea && !G.P[a.at].coast).length;
    return { yardOk, aiShips: ships, aiYards: yards, aiFleets: fleets, shipsInland: landShips, blockLog: S.log.filter(l => /lockad/.test(l.text)).length };
  });
  console.log(JSON.stringify(r), errs); await b.close();
})();
