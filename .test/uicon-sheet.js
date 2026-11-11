// The unit icon sheet: every unit icon (window.__im.uicon, the game's own code) at 16, 24 and 48 px in white on the dark UI, as a UI tile
// (22 px), and inside the map's own diamond counters (diaBody) in each side colour: Mine, Ally, Enemy, Neutral.
// node .test/uicon-sheet.js [out.png] [dpr]
const { chromium } = require('playwright');
const OUT = process.argv[2] || __dirname + '/uicon-sheet.png', DPR = +(process.argv[3] || 1);
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const errs = [];
  const p = await b.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: DPR });
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(800);
  const n = await p.evaluate(() => {
    const UI = window.__im.uicon, NM = Object.assign({}, ...Object.keys(UNITS).map(t => ({[t]: UNITS[t].name})));
    // the icons in sheet order, each with what uses it
    const L = [['inf', 'Infantry (plain helmet), default for Motorized Infantry'], ['mot', 'Motorized infantry (option for inf)'], ['at'], ['spec'], ['para'], ['ifv'], ['tank'], ['art'], ['mlrs'], ['sam'], ['jam'],
      ['heli'], ['jet'], ['int'], ['asf'], ['bomb'], ['stealth'], ['mpa'], ['awacs'], ['drone', 'Recon UAV (UAV I-III)'], ['drone4', 'Armed UAV (UAV IV+)'], ['sdrone'], ['swarm'],
      ['frig'], ['crui'], ['carr'], ['sub'], ['cargo', 'Cargo ship (convoys)'], ['cm', 'Cruise Missile'], ['bm', 'Ballistic Missile'], ['icbm', 'ICBM'], ['stack', 'Mixed stack'], ['truck', 'Supply truck']];
    const SIDES = ['own', 'ally', 'war', 'other'];
    const wrap = document.createElement('div'); wrap.id = 'sheet0'; wrap.style.cssText = 'position:absolute;left:0;top:0;z-index:2147483647;background:#1b2327;font:12px system-ui,sans-serif;padding:10px 12px;width:980px;box-sizing:border-box;display:grid;grid-template-columns:repeat(2, 1fr);gap:6px';
    const head = document.createElement('div'); head.style.cssText = 'grid-column:1/-1;font-size:15px;color:#fff;padding:2px 2px 6px';
    head.textContent = 'Iron Meridian unit icons: 16, 24, 48 px white on the dark UI; the UI tile (22 px); the map counters: Mine, Ally, Enemy, Neutral'; wrap.appendChild(head);
    const dpr = UI.dpr;
    for (const [k, label] of L){
      const row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;gap:9px;background:#10171a;border:1px solid #26333a;border-radius:4px;padding:5px 7px;color:#fff';
      const nm = document.createElement('div'); nm.style.cssText = 'width:112px;flex:none;font-size:11px;line-height:1.25;color:#b8c6ca'; nm.innerHTML = `<b style="color:#fff">${k}</b><br>${label || NM[k] || ''}`; row.appendChild(nm);
      for (const px of [16, 24, 48]){ const s = document.createElement('span'); s.style.cssText = 'display:inline-flex;color:#fff'; s.innerHTML = UI.svg(k, px); row.appendChild(s); }
      const tile = document.createElement('span'); tile.innerHTML = `<i class="ut uic sm">${UI.svg(k, 22)}</i>`; row.appendChild(tile);
      // the map's own diamond counters (the same canvases the map draws), one per side
      for (const sd of SIDES){ const E = UI.dia(k, sd, 3, k === 'stack'), c = E.c, cv = document.createElement('canvas'); cv.width = c.width; cv.height = c.height; cv.style.width = c.width/dpr + 'px'; cv.style.height = c.height/dpr + 'px'; cv.style.flex = 'none';
        cv.getContext('2d').drawImage(c, 0, 0); row.appendChild(cv); }
      wrap.appendChild(row); }
    document.body.appendChild(wrap); return L.length; });
  await p.waitForTimeout(200);
  const el = await p.$('#sheet0'); await el.screenshot({ path: OUT });
  console.log(JSON.stringify({ icons: n, out: OUT, errs }));
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
