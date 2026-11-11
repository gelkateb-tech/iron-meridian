// The unit icon sheet: every unit icon (window.__im.uicon, the game's own code) at 16, 24 and 48 px in white on the dark UI, as a UI tile, and on
// counters in each side colour. node .test/uicon-sheet.js [out.png] [dpr]
const { chromium } = require('playwright');
const OUT = process.argv[2] || __dirname + '/uicon-sheet.png', DPR = +(process.argv[3] || 1);
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const errs = [];
  const p = await b.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: DPR });
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForTimeout(600);
  const n = await p.evaluate(() => {
    const UI = window.__im.uicon, NM = Object.assign({}, ...Object.keys(UNITS).map(t => ({[t]: UNITS[t].name})));
    // the icons in sheet order, each with what uses it
    const L = [['inf', 'Infantry (plain helmet) · default for Motorized Infantry'], ['mot', 'Motorized infantry (option for inf)'], ['at'], ['spec'], ['para'], ['ifv'], ['tank'], ['art'], ['mlrs'], ['sam'], ['jam'],
      ['heli'], ['jet'], ['int'], ['asf'], ['bomb'], ['stealth'], ['mpa'], ['awacs'], ['drone', 'Recon UAV (UAV I-III)'], ['drone4', 'Armed UAV (UAV IV+)'], ['sdrone'], ['swarm'],
      ['frig'], ['crui'], ['carr'], ['sub'], ['cargo', 'Cargo ship (convoys)'], ['cm', 'Cruise Missile'], ['bm', 'Ballistic Missile'], ['icbm', 'ICBM'], ['stack', 'Mixed stack'], ['truck', 'Supply truck']];
    const SIDES = [['Mine', '#5b9a4c', '#3d7331'], ['Ally', '#4a86c4', '#2d5f94'], ['Enemy', '#c24a3f', '#8b2e28'], ['Neutral', '#7a7d74', '#54574f']];
    
    const wrap = document.createElement('div'); wrap.id = 'sheet0'; wrap.style.cssText = 'position:absolute;left:0;top:0;z-index:2147483647;background:#1b2327;font:12px system-ui,sans-serif;padding:10px 12px;width:1150px;box-sizing:border-box;display:grid;grid-template-columns:repeat(3, 1fr);gap:6px';
    const head = document.createElement('div'); head.style.cssText = 'grid-column:1/-1;font-size:15px;color:#fff;padding:2px 2px 6px';
    head.textContent = 'Iron Meridian unit icons: 16, 24, 48 px white on the dark UI; the UI tile (22 px); counters (Mine, Ally, Enemy, Neutral)'; wrap.appendChild(head);
    const dpr = window.devicePixelRatio || 1;
    for (const [k, label] of L){
      const row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;gap:9px;background:#10171a;border:1px solid #26333a;border-radius:4px;padding:5px 7px;color:#fff';
      const nm = document.createElement('div'); nm.style.cssText = 'width:84px;font-size:11px;line-height:1.25;color:#b8c6ca'; nm.innerHTML = `<b style="color:#fff">${k}</b><br>${label || NM[k] || ''}`; row.appendChild(nm);
      for (const px of [16, 24, 48]){ const s = document.createElement('span'); s.style.cssText = 'display:inline-flex;color:#fff'; s.innerHTML = UI.svg(k, px); row.appendChild(s); }
      const tile = document.createElement('span'); tile.innerHTML = `<i class="ut uic sm">${UI.svg(k, 22)}</i>`; row.appendChild(tile);
      // counters: a square tilted like a diamond in the side colour, white rim, the icon upright in the middle
      const C = 26, cv = document.createElement('canvas'); cv.width = (C*4 + 8*3 + 4)*dpr; cv.height = (C + 8)*dpr; cv.style.width = (C*4 + 8*3 + 4) + 'px'; cv.style.height = (C + 8) + 'px';
      const g = cv.getContext('2d'); g.scale(dpr, dpr);
      SIDES.forEach(([nmS, c0, c1], i) => { const cx = 2 + C/2 + i*(C + 8) + 1, cy = (C + 8)/2, r = C/2;
        g.save(); g.translate(cx, cy); g.rotate(Math.PI/4); const h = r/Math.SQRT2*1.0;
        const gr = g.createLinearGradient(-h, -h, h, h); gr.addColorStop(0, c0); gr.addColorStop(1, c1);
        g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 3; g.shadowOffsetY = 1; g.fillStyle = gr; g.beginPath(); g.rect(-h, -h, 2*h, 2*h); g.fill(); g.shadowColor = 'transparent';
        g.lineWidth = 1.5; g.strokeStyle = '#f4f1e8'; g.stroke(); g.restore();
        const W = Math.round(15*dpr), ic = UI.c(k, W, '#ffffff', 0); g.drawImage(ic, Math.round((cx - 7.5)*dpr)/dpr, Math.round((cy - 7.5)*dpr)/dpr, W/dpr, W/dpr); });
      row.appendChild(cv); wrap.appendChild(row); }
    document.body.appendChild(wrap); return L.length; });
  await p.waitForTimeout(200);
  const el = await p.$('#sheet0'); await el.screenshot({ path: OUT });
  console.log(JSON.stringify({ icons: n, out: OUT, errs }));
  await b.close();
})();
