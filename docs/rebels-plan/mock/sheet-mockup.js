// MOCKUP (docs/REBELS-PLAN.md section 9): the city sheet with the morale factors list, the Annex City card and the rebels' fire on the map.
// The real page is opened and the proposed parts are drawn into it (nothing of the game is changed): Poland holds Dresden, taken from Germany.
const path = require('path'), ROOT = path.join(__dirname, '../../..'), pickNation = require(path.join(ROOT, '.test/pick-nation.js'));
const { chromium } = require('playwright');
const OUT = (process.argv[2] || '.') + '/', PAGE = path.join(ROOT, '.test/page.html') + '?start=nations';   // (bash tools/mkpage.sh first; pictures go to the folder given, default here)
const CSS = `
#ftip{display:none !important}
.mf{background:linear-gradient(180deg,#2b3f47,#22343b); border-bottom:1px solid #16252b; color:#e8eef0; font:600 13px/1.25 var(--body)}
.mf-hd{display:flex; align-items:center; gap:12px; padding:8px 12px 7px; border-bottom:1px solid rgba(0,0,0,.35); box-shadow:inset 0 -1px 0 rgba(255,255,255,.05)}
.mf-big{display:flex; align-items:baseline; gap:7px; font:800 19px/1 var(--display); letter-spacing:.04em; text-transform:uppercase; white-space:nowrap}
.mf-big em{font-style:normal; font:700 12px/1 var(--body); letter-spacing:.02em; text-transform:none; color:#a9bcc2}
.mf-arrow{color:#8fd8e2; font-weight:800}
.mf-trend{font:700 12px/1 var(--body); color:#f59a90; white-space:nowrap}
.mf-trend.up{color:#8ee08a}
.mf-sp{flex:1}
.mf-rb{display:inline-flex; align-items:center; gap:6px; padding:4px 10px 4px 6px; border-radius:2px; background:linear-gradient(180deg,#d4483e,#a82a24); color:#fff; font:800 12px/1 var(--body); letter-spacing:.03em; text-transform:uppercase; box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 1px 3px rgba(0,0,0,.4); white-space:nowrap}
.mf-rb small{font:700 11px/1 var(--body); text-transform:none; letter-spacing:0; opacity:.9}
.mf-bd{display:grid; grid-template-columns:1fr 1fr; gap:0 22px; padding:6px 12px 4px}
.mf-r{display:flex; align-items:center; gap:8px; height:25px; border-bottom:1px dashed rgba(143,163,170,.18)}
.mf-r .ic{flex:none; width:18px; height:18px; display:grid; place-items:center; color:#8fd8e2}
.mf-r .lb{flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#dfe8ea}
.mf-r .lb i{font-style:normal; color:#94a9b0; font-weight:600}
.mf-r .v{flex:none; min-width:38px; text-align:right; font:800 14px/1 var(--body); font-variant-numeric:tabular-nums}
.mf-r .v.neg{color:#ff9d93} .mf-r .v.pos{color:#8ee08a} .mf-r .v.base{color:#fff}
.mf-r.zero{opacity:.42} .mf-r.zero .v{color:#cfd8db}
.mf-ft{display:flex; align-items:center; gap:14px; padding:7px 12px 9px; border-top:1px solid rgba(0,0,0,.35); box-shadow:inset 0 1px 0 rgba(255,255,255,.05); flex-wrap:wrap}
.mf-tg{font:800 14px/1 var(--body); white-space:nowrap} .mf-tg b{font-size:16px; color:#ffd36b}
.mf-out{font:600 12.5px/1.25 var(--body); color:#c3d2d6} .mf-out b{color:#fff}
.mf-ax{margin-left:auto; display:inline-flex; align-items:center; gap:8px; height:32px; padding:0 12px; border:0; border-radius:2px; color:#fff; font:800 12.5px/1 var(--body); letter-spacing:.05em; text-transform:uppercase; cursor:pointer;
  background:linear-gradient(180deg,#5fc9d6,#2a9aaa); box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 2px 4px rgba(0,0,0,.4); text-shadow:0 1px 1px rgba(0,0,0,.4)}
.mf-ax small{font:700 11.5px/1 var(--body); letter-spacing:0; text-transform:none; opacity:.95}
.mf-note{padding:0 12px 9px; font:600 11.5px/1.3 var(--body); color:#a9bcc2}
.mf-note b{color:#ffd7cf}
.cs-mor.fire{box-shadow:inset 0 0 0 2px #d4483e}
.mor-fire{position:relative; display:inline-block; width:16px; height:18px; margin-left:2px}
.cs-c.annex{background:linear-gradient(180deg,#f4d58b 0%,#d9a43a 50%,#a8761c 100%)}
.cs-c.annex .cs-ci{display:grid; place-items:center}
.cs-c.annex .tag{position:absolute; left:4px; right:4px; top:4px; padding:2px 0; border-radius:2px; background:rgba(20,26,30,.78); font:800 10px/1.1 var(--body); color:#ffe7a8; letter-spacing:.02em}
.mob-off small{color:#ffcf8a !important}
@media (max-width:820px){ .mob-off small{white-space:normal !important; overflow:visible !important; text-overflow:clip !important; line-height:1.15} .cs-c.annex .tag{font-size:8.5px; white-space:nowrap; letter-spacing:0} }
@media (max-width:820px){ .mf-bd{grid-template-columns:1fr; padding:4px 10px 2px} .mf-r{height:23px} .mf-r.zero{display:none} .mf-hd{flex-wrap:wrap; gap:6px 10px; padding:7px 10px 6px} .mf-ft{padding:6px 10px 8px; gap:8px} .mf-ax{margin-left:0; width:100%; justify-content:center} .mf-note{padding:0 10px 8px} }
`;
const FIRE = `<svg viewBox="0 0 16 18" width="16" height="18" aria-hidden="true"><path d="M8 1c1 3.2 4.8 4.6 4.8 9.2A4.8 4.8 0 0 1 3.2 10.2C3.2 7.6 5 6.4 5.6 4.4c.9 1.4 1.1 2.6 1 3.6C7.9 6.6 8.4 4.2 8 1z" fill="#ff8a1e" stroke="#7a1f0a" stroke-width=".8"/><path d="M8 8.2c.8 1.6 2.4 2.2 2.4 4.2a2.4 2.4 0 0 1-4.8 0c0-1.2.8-1.8 1.1-2.8.5.6.6 1.1.6 1.6.6-.8.9-1.8.7-3z" fill="#ffe27a"/></svg>`;
const ICO = {
  base:'<svg viewBox="0 0 16 16" width="16" height="16"><g fill="currentColor"><rect x="1" y="7" width="4" height="8"/><rect x="6" y="3" width="4" height="12"/><rect x="11" y="5" width="4" height="10"/></g></svg>',
  dist:'<svg viewBox="0 0 16 16" width="16" height="16"><g fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="3" cy="12" r="2"/><circle cx="13" cy="4" r="2"/><path d="M4.6 10.6 11.4 5.4" stroke-dasharray="2 1.6"/></g></svg>',
  war:'<svg viewBox="0 0 16 16" width="16" height="16"><g stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 2l12 12M14 2 2 14"/></g></svg>',
  nb:'<svg viewBox="0 0 16 16" width="16" height="16"><g fill="currentColor"><path d="M1 2h6l-1 4 1 4H1z" opacity=".5"/><path d="M9 2h6v8H9l1-4z"/><rect x="7.4" y="1" width="1.2" height="14"/></g></svg>',
  unit:'<svg viewBox="0 0 16 16" width="16" height="16"><g fill="currentColor"><path d="M3 9a5 5 0 0 1 10 0v1H3z"/><rect x="2" y="10" width="12" height="2" rx="1"/></g></svg>',
  low:'<svg viewBox="0 0 16 16" width="16" height="16"><g fill="currentColor"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5 11.6q3-3 6 0" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="6.6" r="1"/><circle cx="10" cy="6.6" r="1"/></g></svg>',
  hi:'<svg viewBox="0 0 16 16" width="16" height="16"><g fill="currentColor"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5 9.6q3 3 6 0" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="6.6" r="1"/><circle cx="10" cy="6.6" r="1"/></g></svg>',
  short:'<svg viewBox="0 0 16 16" width="16" height="16"><g fill="currentColor"><rect x="2" y="3" width="12" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="4" y="9" width="3" height="2"/></g></svg>',
  cas:'<svg viewBox="0 0 16 16" width="16" height="16"><g fill="currentColor"><path d="M2 14V7l6-5 6 5v7h-4v-4H6v4z"/><path d="M11 1l2 3-3 1z" fill="#ff8a1e"/></g></svg>',
  cap:'<svg viewBox="0 0 16 16" width="16" height="16"><path fill="currentColor" d="M8 1l2 4.6 5 .4-3.8 3.2 1.2 4.8L8 11.4 3.6 14l1.2-4.8L1 6l5-.4z"/></svg>',
  capl:'<svg viewBox="0 0 16 16" width="16" height="16"><g fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 1.8l1.8 4.1 4.5.4-3.4 2.9 1 4.3L8 11.2l-3.9 2.3 1-4.3L1.7 6.3l4.5-.4z"/><path d="M2 14 14 2"/></g></svg>',
  bunk:'<svg viewBox="0 0 16 16" width="16" height="16"><path fill="currentColor" d="M1 14V9q7-7 14 0v5h-4v-3H5v3z"/></svg>'};
const row = (ic, lb, v, cls = '') => `<div class="mf-r ${v === 0 ? 'zero' : ''}"><span class="ic">${ICO[ic]}</span><span class="lb">${lb}</span><span class="v ${cls || (v > 0 ? 'pos' : v < 0 ? 'neg' : '')}">${v === 0 ? '0' : (v > 0 && cls !== 'base' ? '+' : v < 0 ? '−' : '') + Math.abs(v)}</span></div>`;
const PANEL = `<div class="mf" id="mf">
  <div class="mf-hd"><span class="mf-big">Morale 28% <span class="mf-arrow">➜</span> 29% <em>target</em></span><span class="mf-trend up">+0.1 a day</span><span class="mf-sp"></span>
    <span class="mf-rb">${FIRE}Rebels 8% <small>at the day change</small></span></div>
  <div class="mf-bd">
    ${row('base', 'Occupied city <i>(home 90 · annexed 75)</i>', 60, 'base')}
    ${row('unit', 'Enemy units in the city', 0)}
    ${row('dist', '531 km from Warsaw <i>(−5 per 1,000 km)</i>', -5)}
    ${row('hi', 'High-morale neighbours', 0)}
    ${row('war', 'At war with 1 nation <i>(Germany)</i>', -2)}
    ${row('short', 'Resource shortage', 0)}
    ${row('nb', '2 neighbours held by Germany', -10)}
    ${row('capl', 'Capital lost', 0)}
    ${row('low', '2 neighbours at 40% or less <i>(countryside)</i>', -8)}
    ${row('bunk', 'Bunker', 0)}
    ${row('cas', 'Civilian casualties <i>(fades by a third a day)</i>', -6)}
    ${row('cap', 'The capital city <i>(+25)</i>', 0)}
  </div>
  <div class="mf-ft"><span class="mf-tg">Target <b>29%</b></span>
    <span class="mf-out">Output <b>15%</b> of a home city: <b>25%</b> occupied × <b>60%</b> at this morale</span>
    <button class="mf-ax">Annex city <small>$80M · 15k · 4 d</small></button></div>
  <div class="mf-note"><b>Rebels can rise at 33% morale or lower.</b> Tonight's chance: 31% at 28% morale, halved for each of your 2 units: <b>8%</b>. Each unit you add halves it again. They fight your troops here; an empty city is lost to them.</div>
</div>`;
const ANNEX_CARD = `<button class="cs-c annex" title="Annex City: $80M and 15k manpower, 4 days. Output 50% (from 25%), morale target 75% (from 60%), units can be mobilized here."><span class="cs-ci"><svg viewBox="0 0 48 48" width="50" height="50"><g fill="none" stroke="#3b2606" stroke-width="2.6"><rect x="9" y="7" width="30" height="34" rx="2" fill="#fff6dc"/><path d="M14 15h20M14 21h20M14 27h12"/></g><circle cx="33" cy="33" r="9" fill="#c4302a" stroke="#6e130f" stroke-width="2"/><path d="M29 33l3 3 5-6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg></span><span class="tag">$80M · 15k · 4 d</span><span class="cs-cn">Annex City</span></button>`;
(async () => { const b = await chromium.launch();
  for (const [dev, vp] of [['desk', {viewport:{width:1440, height:900}}], ['phone', {viewport:{width:390, height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2}]]){
    const ctx = await b.newContext(vp), p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + PAGE); await p.waitForSelector('[data-act="pick"]');
    await pickNation(p, 'Poland'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
    await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, {timeout:60000}); await p.waitForTimeout(500);
    await p.addStyleTag({content:'#ftip{display:none !important}'});
    const info = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G; S.speed = 0; const me = S.nations.findIndex(N => N.name === 'Poland');
      const P = G.P.find(x => x.cityName === 'Dresden'); S.owner[P.id] = me; S.occ[P.id] = S.hour; S.unrest[P.id] = 72; im.addArmy(me, P.id, {inf:2}); im.geoDirty(); im.selectProv(P.id); return {p:P.id}; });
    await p.waitForTimeout(2500);
    await p.screenshot({path:OUT + 'before2-' + dev + '.png'});
    await p.evaluate(({CSS, PANEL, ANNEX_CARD, FIRE, dev}) => { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
      const sh = document.getElementById('csheet'), body = sh.querySelector('.cs-body'), stat = body.querySelector('.cs-stat');
      const mor = stat.querySelector('.cs-mor'); mor.classList.add('fire'); const bb = mor.querySelector('b'); bb.innerHTML = '28%'; const ii = mor.querySelector('i'); if (ii) ii.style.width = '28%';
      mor.classList.remove('hi', 'mid'); mor.classList.add('lo'); bb.insertAdjacentHTML('beforebegin', `<span class="mor-fire">${FIRE}</span>`);
      const stl = body.querySelector('.cs-st > span'); if (stl) stl.textContent = 'Occupied City · 25% output';
      stat.insertAdjacentHTML('afterend', PANEL);
      const rl = body.querySelector('.cs-rl'); if (rl) rl.remove();
      const blds = body.querySelector('.cs-blds'); blds.insertAdjacentHTML('afterbegin', ANNEX_CARD); blds.scrollLeft = 0;
      for (const d of document.querySelectorAll('.status')) if (/Unrest/.test(d.textContent)) d.innerHTML = 'Morale 28% · target 29% · <b style="color:#ff9d93">rebels 8% at the day change</b>';
      for (const d of document.querySelectorAll('dd')) if (/unrest/.test(d.textContent)) d.textContent = '28% · target 29%';
      const mob = sh.querySelector('.cs-mob small'); if (mob){ mob.textContent = 'Occupied: annex the city to mobilize here'; mob.parentElement.parentElement.classList.add('mob-off'); }
    }, {CSS, PANEL, ANNEX_CARD, FIRE, dev});
    await p.waitForTimeout(400);
    await p.screenshot({path:OUT + 'after-' + dev + '.png'});

    // the map close-up: the sheet closed, the view on Dresden, one still frame of the proposed fire and smoke
    await p.evaluate(({pid}) => { const im = window.__im, P = im.G.P[pid]; const cl = document.querySelector('[data-act="clear"]'); if (cl) cl.click();
      const R = document.getElementById('map').getBoundingClientRect(), v = im.view, s = v.s*4; v.s = s; v.x = R.width/2 - P.x*s; v.y = R.height*0.45 - P.y*s; im.geoDirty(); }, {pid:info.p});
    await p.waitForTimeout(3000);
    await p.screenshot({path:OUT + 'map-nofire-' + dev + '.png'});
    // fire on the map: a still frame drawn where Dresden is
    await p.evaluate(({pid, dev}) => { const im = window.__im, P = im.G.P[pid], [x, y] = im.toScreen(P.x, P.y), map = document.getElementById('map'), R = map.getBoundingClientRect();
      const k = dev === 'phone' ? 0.75 : 1, W = 90*k, H = 120*k, c = document.createElement('canvas'), dpr = window.devicePixelRatio || 1; c.width = W*dpr; c.height = H*dpr;
      c.style.cssText = `position:fixed; left:${R.left + x - W/2}px; top:${R.top + y - H + 18*k}px; width:${W}px; height:${H}px; pointer-events:none; z-index:3`;
      const g = c.getContext('2d'); g.scale(dpr*k, dpr*k); let s = 7; const rnd = () => (s = (s*16807) % 2147483647)/2147483647;
      // smoke: 7 soft grey puffs rising and widening, drifting right (wind), darker at the base
      for (let i = 0; i < 7; i++){ const t = i/6, cx = 45 + t*16 + (rnd() - .5)*6, cy = 92 - t*78, r = 9 + t*16, a = 0.85*(1 - t*0.6);
        const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, `rgba(${40 + t*70},${38 + t*70},${36 + t*70},${a})`); gr.addColorStop(0.6, `rgba(${50 + t*70},${48 + t*70},${46 + t*70},${a*0.6})`); gr.addColorStop(1, 'rgba(120,120,120,0)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); }
      // flames: 5 teardrops, additive, orange to yellow core, flickering heights (a still frame)
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++){ const fx = 32 + i*6.5 + (rnd() - .5)*3, h = 16 + rnd()*14, w = 6 + rnd()*3, fy = 104;
        const gr = g.createLinearGradient(0, fy, 0, fy - h); gr.addColorStop(0, 'rgba(255,240,150,.95)'); gr.addColorStop(0.45, 'rgba(255,140,30,.85)'); gr.addColorStop(1, 'rgba(200,40,10,0)'); g.fillStyle = gr;
        g.beginPath(); g.moveTo(fx - w, fy); g.quadraticCurveTo(fx - w*0.9, fy - h*0.55, fx, fy - h); g.quadraticCurveTo(fx + w*0.9, fy - h*0.55, fx + w, fy); g.closePath(); g.fill(); }
      const gl = g.createRadialGradient(45, 102, 0, 45, 102, 26); gl.addColorStop(0, 'rgba(255,150,40,.45)'); gl.addColorStop(1, 'rgba(255,120,20,0)'); g.fillStyle = gl; g.beginPath(); g.arc(45, 102, 26, 0, 7); g.fill();
      document.body.appendChild(c); }, {pid:info.p, dev});
    await p.waitForTimeout(300);
    await p.screenshot({path:OUT + 'map-fire-' + dev + '.png'});
    console.log(dev, errs.slice(0, 3));
    await ctx.close(); }
  await b.close(); })();
