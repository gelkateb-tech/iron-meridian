// The tutorial, step by step (START-RULES: no city starts with an Army Base, so the tutorial builds one in the capital, starts the clock and recruits
// once it stands):   node .test/tut.js   (after bash tools/mkpage.sh; prints the step after each action, exit 1 when a step is not the expected one)
const pickNation = require('./pick-nation.js');   // (a start-screen card by its nation's name, on either world)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 860 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForSelector('[data-act="pick"]');
  await p.click('[data-act="pickdiff"][data-k="veteran"]'); await pickNation(p, 'United States'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]'); await p.evaluate(() => window.__im.tutGo(0));
  const step = () => p.evaluate(() => (document.querySelector('#tut .tp')?.textContent || 'none') + ' ' + (document.querySelector('#tut b')?.textContent || ''));
  const out = [await step()];
  await p.click('[data-act="tut-next"]'); out.push(await step());   // Your nation -> Open your capital
  const cap = await p.evaluate(() => window.__im.S.nations[0].capital);
  await p.evaluate(c => window.__im.selectProv(c), cap); await p.waitForTimeout(400); out.push(await step());   // -> Build an Army Base
  const card = await p.evaluate(() => document.querySelector('#tut p')?.textContent || '');
  const price = await p.evaluate(c => window.__im.buildCost(0, 'fac', 1, c).cash, cap);   // (Army Base I: $10M, 30 minutes, owner point 6)
  await p.click('#csheet [data-act="cs-bld"]'); await p.waitForTimeout(300); await p.click('#sheet .bld[data-bk="fac"] [data-act="build"]'); await p.waitForTimeout(400); out.push(await step());   // -> Start the clock
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await p.click('#sp1'); await p.waitForTimeout(400); out.push(await step());   // -> Resources
  await p.evaluate(() => { window.__im.S.speed = 0; });
  await p.click('[data-act="tut-next"]'); out.push(await step());   // -> Recruit (the base is still going up: a Next button)
  const waitNext = await p.evaluate(() => !!document.querySelector('#tut [data-act="tut-next"]'));
  await p.evaluate(() => { for (let i = 0; i < 26; i++) window.__im.tick(); }); await p.waitForTimeout(600);
  await p.evaluate(c => window.__im.selectProv(c), cap); await p.waitForTimeout(400);
  await p.click('[data-act="recruit"][data-t="inf"]'); await p.waitForTimeout(400); out.push(await step());   // -> Select your army
  await p.screenshot({ path: __dirname + '/r13-tut.png' });
  const aid = await p.evaluate(c => window.__im.S.armies.find(a => a.owner === 0 && a.at === c && !a.air).id, cap);
  await p.evaluate(id => window.__im.selectArmy(id), aid); await p.waitForTimeout(400); out.push(await step());   // -> Plan an attack
  await p.evaluate(id => { const im = window.__im, a = im.S.armies.find(x => x.id === id); const t = im.G.P[a.at].nbs.find(v => !im.G.P[v].sea) ; im.setTarget(id, t); }, aid); await p.waitForTimeout(400); out.push(await step());   // -> Send it
  await p.click('[data-act="send"]'); await p.waitForTimeout(400); out.push(await step());   // -> Dug in
  const diff = await p.evaluate(() => window.__im.S.diff);
  await p.keyboard.press('o'); await p.waitForTimeout(200); await p.screenshot({ path: __dirname + '/r13-settings.png' }); await p.keyboard.press('Escape');
  await p.evaluate(() => { for (let i = 0; i < 24*3; i++) window.__im.tick(); }); await p.keyboard.press('n'); await p.waitForTimeout(200); await p.screenshot({ path: __dirname + '/r13-paper.png' });
  const want = ['Your nation', 'Open your capital', 'Build an Army Base', 'Start the clock', 'Resources', 'Recruit', 'Select your army', 'Plan an attack', 'Send it', 'Dug in'];
  const bad = want.filter((w, i) => !(out[i] || '').endsWith(' ' + w));
  const fail = bad.length || errs.length || !waitNext || !card.includes('$' + price + 'M, 30 min');
  console.log(JSON.stringify(out), 'diff', diff, '| build step:', card, '| recruit waits with Next:', waitNext, errs);
  console.log(fail ? 'FAIL ' + bad.join(', ') : 'PASS the tutorial builds an Army Base, starts the clock and recruits once it stands');
  await b.close(); process.exit(fail ? 1 : 0);
})();
