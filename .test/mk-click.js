// city markers removal: clicking / tapping a city selects it as before.  node .test/mk-click.js <page.html> <out.json> [phone]
const { chromium } = require('playwright'); const fs = require('fs');
const page = process.argv[2], out = process.argv[3], PHONE = process.argv[4] === 'phone', W = PHONE ? 390 : 1440, H = PHONE ? 844 : 900;
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: PHONE ? 2 : 1, hasTouch: PHONE, isMobile: PHONE, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.addInitScript(() => { let s = 0x2f6b1d3; Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0)/4294967296; }; window.__dbgBoxes = {};
    try { localStorage.setItem('iron-meridian-tut', '1'); } catch (e) {} });
  await p.goto('file://' + require('path').resolve(page)); await p.waitForTimeout(600);
  await p.click('[data-act="pick"][data-p="5"]'); await p.click('[data-act="begin"]'); await p.waitForTimeout(300); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 40000 }); await p.waitForTimeout(2000);
  await p.evaluate(() => { window.__im.S.speed = 0; document.querySelectorAll('.toast').forEach(t => t.remove()); });
  const OF = await p.evaluate(() => { const r = document.getElementById('map').getBoundingClientRect(); return [r.left, r.top]; }), SX = PHONE ? 180 : 520, SY = PHONE ? 300 : 380, res = {}, sum = { n: 0, city: 0 };
  const setv = async (nm, hp) => { const q = await p.evaluate(([nm, hp, SX, SY]) => { const im = window.__im, P = im.G.P.find(P => P.cityName === nm), v = im.view; im.v3c.clearSel(); v.s = hp/12; v.x = SX - P.x*v.s; v.y = SY - P.y*v.s; im.redraw(); return P.id; }, [nm, hp, SX, SY]);
    await p.waitForTimeout(260); return q; };
  const click = async (nm, hp, dx, dy) => { await setv(nm, hp); const x = SX + dx + OF[0], y = SY + dy + OF[1]; if (PHONE) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(160);
    return p.evaluate(() => { const im = window.__im; return im.sel.army !== null ? 'army' : im.sel.prov; }); };
  for (const nm of ['Berlin', 'Paris', 'Rome', 'Milan', 'Tunis', 'Madrid', 'Hamburg', 'Lyon', 'Cairo', 'Naples', 'Algiers']) for (const hp of [8, 12, 18, 26, 55]){
    const q = await setv(nm, hp); await p.waitForTimeout(300);
    const lab = await p.evaluate(([nm, SX, SY]) => { const L = (window.__dbgBoxes.lab || []).filter(l => l.t === nm).sort((a, b) => Math.abs(a.b[0] - SX) + Math.abs(a.b[1] - SY) - Math.abs(b.b[0] - SX) - Math.abs(b.b[1] - SY))[0]; return L ? L.b : null; }, [nm, SX, SY]);
    const r = { id: q, lab }; r.point = await click(nm, hp, 0, 0); if (lab) r.name = await click(nm, hp, (lab[0] + lab[2])/2 - SX, (lab[1] + lab[3])/2 - SY);
    r.r6 = await click(nm, hp, 6, 0); r.d9 = await click(nm, hp, -6, 7); r.r40 = await click(nm, hp, 40, 0); r.u30 = await click(nm, hp, 0, -30); res[nm + '@' + hp] = r;
    sum.n++; for (const k of ['point', 'name', 'r6', 'd9', 'r40', 'u30']) if (k in r){ sum[k] = sum[k] || [0, 0]; sum[k][1]++; if (r[k] === q) sum[k][0]++; } }
  fs.writeFileSync(out, JSON.stringify(res)); console.log(PHONE ? 'phone' : 'desktop', JSON.stringify(sum), 'errors', errors.length, errors.slice(0, 3)); await b.close(); })();
