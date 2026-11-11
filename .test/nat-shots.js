// Nations world, step 0: start-screen screenshots and a short play. node .test/nat-shots.js <outdir> <tag>
const { chromium } = require('playwright'); const path = require('path');
(async () => { const out = process.argv[2], tag = process.argv[3] || 'plumbing';
  const b = await chromium.launch(); const errs = [];
  const shot = async (vp, name, fn) => { const p = await b.newPage({ viewport: vp, deviceScaleFactor: vp.dpr || 1, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
    p.on('pageerror', e => errs.push(name + ' pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(name + ' console: ' + m.text()); });
    await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(900); await fn(p); await p.close(); };
  await shot({width:1400, height:900}, 'desk', async p => {
    await p.screenshot({ path: `${out}/${tag}-start-classic.png` });
    await p.click('[data-act="pickscn"][data-k="world64"]'); await p.waitForTimeout(300);
    await p.screenshot({ path: `${out}/${tag}-start-americas.png` });
    await p.click('[data-act="pickreg"][data-k="Europe"]'); await p.waitForTimeout(300);
    await p.screenshot({ path: `${out}/${tag}-start-europe.png` });
    const info = await p.evaluate(() => ({cards:[...document.querySelectorAll('.pick')].map(e => e.innerText.replace(/\n/g, ' | ')), lead:document.querySelector('[data-act="begin"]').innerText, p:document.querySelector('.sheet p').innerText}));
    console.log(JSON.stringify(info, null, 1));
    await p.click('[data-act="begin"]'); await p.waitForTimeout(1500); await p.click('[data-act="start"]'); await p.waitForTimeout(2500);
    const st = await p.evaluate(() => ({scn:S.scn, mode:S.mode, me:S.nations[0].name, tier:S.nations[0].tier, n:S.nations.length, caps:WIN_CAPS, need:landNeed(0), w64:S.w64 && S.w64.cities.length, cities:G.P.filter(P => P.city).length}));
    console.log(JSON.stringify(st));
    await p.waitForTimeout(2500); await p.screenshot({ path: `${out}/${tag}-europe-opening.png` });
    await p.evaluate(() => { for (let i = 0; i < 48; i++) window.__im.tick(); }); await p.waitForTimeout(600);
    await p.screenshot({ path: `${out}/${tag}-europe-day3.png` }); });
  await shot({width:390, height:844, dpr:2, mobile:true}, 'phone', async p => {
    await p.tap('[data-act="pickscn"][data-k="world64"]'); await p.waitForTimeout(300); await p.tap('[data-act="pickreg"][data-k="Asia"]'); await p.waitForTimeout(300);
    await p.screenshot({ path: `${out}/${tag}-phone-start.png` });
    await p.evaluate(() => document.querySelector('[data-act="begin"]').scrollIntoView()); await p.waitForTimeout(200); await p.screenshot({ path: `${out}/${tag}-phone-start2.png` });
    await p.tap('[data-act="begin"]'); await p.waitForTimeout(1500); await p.tap('[data-act="start"]'); await p.waitForTimeout(4000);
    await p.screenshot({ path: `${out}/${tag}-phone-opening.png` }); });
  console.log('ERRORS', errs.length ? errs : 'none'); await b.close(); process.exit(errs.length ? 1 : 0); })();
