// Nations world playtest in the page (step 0): Germany (a small tier A nation) for 25 days at speed, opening the main screens on the way;
// no console error may appear. Step 6 (plan 5.4, the full world): any nation by name, picked from its region's tab, as a person would
// (New Zealand and Mongolia, 10 days each). node .test/nat-play.js [days] [nation]
const { chromium } = require('playwright'); const path = require('path');
(async () => { const days = +(process.argv[2] || 25), who = process.argv[3] || 'Germany', b = await chromium.launch(), errs = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 860 } }); p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(800);
  if (await p.locator('[data-act="pickscn"][data-k="world64"]').count()) await p.click('[data-act="pickscn"][data-k="world64"]');
  const pk = await p.evaluate(nm => { const L = SCENARIOS.world64.powers, i = L.findIndex(P => P.name === nm); return {i, region:i >= 0 ? L[i].region : null}; }, who);
  if (pk.i < 0){ console.log('no such nation: ' + who); await b.close(); process.exit(1); }
  await p.click(`[data-act="pickreg"][data-k="${pk.region}"]`); await p.click(`[data-act="pick"][data-p="${pk.i}"]`); await p.click('[data-act="begin"]'); await p.waitForTimeout(1500); await p.click('[data-act="start"]'); await p.waitForTimeout(800);
  const out = [];
  for (let d = 0; d < days; d += 5){
    await p.evaluate(() => { for (let i = 0; i < 120 && !S.over; i++) window.__im.tick(); }); await p.waitForTimeout(300);
    for (const k of ['d', 't', 'c', 'r']){ await p.keyboard.press(k); await p.waitForTimeout(250); await p.keyboard.press('Escape'); await p.waitForTimeout(100); }
    await p.click('#helpbtn', { force: true }).catch(() => {}); await p.waitForTimeout(250); await p.keyboard.press('Escape');
    out.push(await p.evaluate(() => `day ${S.hour/24}: ${S.nations.map(n => n.name.slice(0, 3) + ' ' + S.owner.filter(o => o === n.id).length + (n.alive ? '' : 'x')).join(' ')} wars ${Object.values(S.rel).filter(r => r.st === 'war').length}${S.over ? ' OVER ' + S.over : ''}`)); }
  const fin = await p.evaluate(() => ({me:S.nations[0].name, alive:S.nations[0].alive, provs:S.owner.filter(o => o === 0).length, cash:Math.round(S.nations[0].cash), nations:S.nations.length, scn:S.scn, hour:S.hour, over:S.over, vbar:document.getElementById('vbar').innerText.replace(/\s+/g, ' '), saveKB:Math.round(saveJSON().length/1024)}));
  console.log(out.join('\n')); console.log(JSON.stringify(fin)); console.log('ERRORS', errs.length ? errs : 'none'); await b.close(); process.exit(errs.length || fin.me !== who ? 1 : 0); })();
