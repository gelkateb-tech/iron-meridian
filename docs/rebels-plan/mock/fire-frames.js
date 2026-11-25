// the proposed fire-and-smoke look, drawn frame by frame: desktop (particles: 5 flame tongues, 7 smoke puffs) and phone (a 4-frame flame
// sprite cycled at 8 fps plus one smoke puff every 1.5 s), at two morale bands (33-26%: small; 25% and lower: bigger), on a map-like ground
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(), p = await b.newPage({viewport:{width:1160, height:640}});
  await p.setContent('<body style="margin:0;background:#1d2a30"><canvas id="c" width="1160" height="640"></canvas></body>');
  await p.evaluate(() => { const c = document.getElementById('c'), g = c.getContext('2d');
    const bg = (x, y, w, h) => { const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, '#5d6b4f'); gr.addColorStop(1, '#4b573f'); g.fillStyle = gr; g.fillRect(x, y, w, h);
      g.strokeStyle = 'rgba(240,220,160,.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y + h*0.72); g.lineTo(x + w, y + h*0.6); g.stroke(); g.fillStyle = 'rgba(210,210,200,.5)'; g.fillRect(x + w/2 - 14, y + h*0.66, 28, 12); };
    let s = 11; const rnd = () => (s = (s*16807) % 2147483647)/2147483647;
    // one frame of the desktop look: t (s), big (0 small, 1 big)
    function desk(x0, y0, t, big){ const k = big ? 1.25 : 1, cx = x0 + 60, by = y0 + 112;
      const puffs = big ? 7 : 5; for (let i = 0; i < puffs; i++){ const a0 = ((t*0.35 + i/puffs) % 1), cy = by - 8 - a0*95*k, px = cx + a0*22 + Math.sin(i*2.1 + t)*3, r = (7 + a0*17)*k, al = 0.8*(1 - a0)*(big ? 1 : 0.8);
        const gr = g.createRadialGradient(px, cy, 0, px, cy, r); gr.addColorStop(0, `rgba(${45 + a0*80},${43 + a0*80},${41 + a0*80},${al})`); gr.addColorStop(1, 'rgba(110,110,110,0)'); g.fillStyle = gr; g.beginPath(); g.arc(px, cy, r, 0, 7); g.fill(); }
      g.save(); g.globalCompositeOperation = 'lighter'; const tongues = big ? 7 : 5;
      for (let i = 0; i < tongues; i++){ const fx = cx - (tongues - 1)*3.3 + i*6.6, fl = 0.75 + 0.25*Math.sin(t*2*Math.PI*(6 + i*0.9) + i*1.7), h = (14 + (i % 3)*5)*k*fl, w = 5.5*k;
        const gr = g.createLinearGradient(0, by, 0, by - h); gr.addColorStop(0, 'rgba(255,240,150,.95)'); gr.addColorStop(0.45, 'rgba(255,140,30,.85)'); gr.addColorStop(1, 'rgba(200,40,10,0)'); g.fillStyle = gr;
        g.beginPath(); g.moveTo(fx - w, by); g.quadraticCurveTo(fx - w*0.9, by - h*0.55, fx, by - h); g.quadraticCurveTo(fx + w*0.9, by - h*0.55, fx + w, by); g.closePath(); g.fill(); }
      const gl = g.createRadialGradient(cx, by - 2, 0, cx, by - 2, 26*k); gl.addColorStop(0, 'rgba(255,150,40,.4)'); gl.addColorStop(1, 'rgba(255,120,20,0)'); g.fillStyle = gl; g.beginPath(); g.arc(cx, by - 2, 26*k, 0, 7); g.fill(); g.restore(); }
    // the phone look: frame f of 4 pre-drawn flame shapes (no gradients per frame: one drawImage) and one puff
    const SPR = []; for (let f = 0; f < 4; f++){ const cv = document.createElement('canvas'); cv.width = 40; cv.height = 40; const q = cv.getContext('2d'); q.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++){ const fx = 12 + i*8, h = [18, 24, 20, 22][(f + i) % 4], w = 6; const gr = q.createLinearGradient(0, 38, 0, 38 - h); gr.addColorStop(0, 'rgba(255,240,150,.95)'); gr.addColorStop(0.5, 'rgba(255,140,30,.85)'); gr.addColorStop(1, 'rgba(200,40,10,0)'); q.fillStyle = gr;
        q.beginPath(); q.moveTo(fx - w, 38); q.quadraticCurveTo(fx - w, 38 - h*0.5, fx, 38 - h); q.quadraticCurveTo(fx + w, 38 - h*0.5, fx + w, 38); q.closePath(); q.fill(); } SPR.push(cv); }
    function phone(x0, y0, t, big){ const k = big ? 1.2 : 1, cx = x0 + 60, by = y0 + 112, f = Math.floor(t*8) % 4, a0 = (t/1.5) % 1;
      const r = (9 + a0*14)*k, py = by - 14 - a0*60, gr = g.createRadialGradient(cx + a0*12, py, 0, cx + a0*12, py, r); gr.addColorStop(0, `rgba(70,68,66,${0.7*(1 - a0)})`); gr.addColorStop(1, 'rgba(110,110,110,0)'); g.fillStyle = gr; g.beginPath(); g.arc(cx + a0*12, py, r, 0, 7); g.fill();
      g.drawImage(SPR[f], cx - 20*k, by - 38*k, 40*k, 40*k); }
    g.font = '700 15px sans-serif'; const W = 190, rows = [
      ['Desktop (effects High): particles. 26-33% morale: 5 flame tongues, 5 smoke puffs. Frames 0.1 s apart', (x, y, i) => desk(x + 30, y - 4, i*0.1, false)],
      ['Desktop, 25% morale or lower: 7 tongues, 7 puffs, drawn 25% larger', (x, y, i) => desk(x + 30, y - 4, i*0.1, true)],
      ['Phone (effects Low, the phone default): one 4-frame flame sprite at 8 fps + one smoke puff every 1.5 s. Frames 0.125 s apart', (x, y, i) => phone(x + 30, y - 4, i*0.125, false)],
      ['Phone, 25% morale or lower: the same sprite drawn 20% larger', (x, y, i) => phone(x + 30, y - 4, i*0.125, true)]];
    rows.forEach(([t, fn], r) => { const y0 = 8 + r*158; g.fillStyle = '#e8eef0'; g.fillText(t, 10, y0 + 14); for (let i = 0; i < 6; i++){ const x = 10 + i*W, y = y0 + 22; bg(x, y, W - 10, 128); g.save(); g.beginPath(); g.rect(x, y, W - 10, 128); g.clip(); fn(x, y, i); g.restore(); } });
  });
  await p.screenshot({path:(process.argv[2] || '.') + '/fire-frames.png'}); await b.close(); })();
