// Iron Meridian: the map effects module (battle fire, strikes and blasts, particles, battle smoke). Visual only: it reads the rules state
// (S, G, the fog of war) and never changes it, and it never calls the rules' dice (rng). The page creates it once with IMFX(PG): PG is the
// page's read-only view (camera, canvas, settings, unit spots, the wrap helpers), every page name this module reads is PG.<name>.
// The rules' map events (IM.on 'fxRanged' 'fxBattle' 'fxWreck' 'fxStrike' 'fxMissile' ...) are wired to it in index.html (RULES EVENTS).
'use strict';
window.IMFX = function IMFX(PG){
// ---- particle system (world-anchored, pixel offsets) ----
const PART = [], PROJ = [], WRECKS = [], SPR = {};
// a particle's offset, drift and size are given in screen px at the zoom it was born at (times kz, the effects' zoom factor): u keeps the
// world units that px stood for then, so its offset is drawn in world units (q.ox*u*view.s: it stays on its map spot while zooming) and its
// size follows the map too, held within half to twice today's kz size. (Old entries without u keep the screen-px look.)
const kzNow = () => Math.max(0.6, Math.min(2, PG.view.s*HS0/12))*PG.zx();
const kzF = (q, kz) => q.u ? q.u*PG.view.s : kz, kzS = (f, kz) => Math.max(kz*0.5, Math.min(kz*2, f));
function softSprite(key, inner, mid, outer){
  if (SPR[key]) return SPR[key]; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, inner); gr.addColorStop(0.45, mid); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (SPR[key] = c);
}
function puffSprite(i, dark){
  const key = 'puff' + i + (dark ? 'd' : 'l'); if (SPR[key]) return SPR[key];
  const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d'), rr = mulberry(500 + i*17 + (dark ? 3 : 0));
  for (let k = 0; k < 14; k++){ const ang = rr()*Math.PI*2, d = rr()*20, x = 48 + Math.cos(ang)*d, y = 48 + Math.sin(ang)*d*0.85, r = 12 + rr()*16;
    const gr = g.createRadialGradient(x - r*0.25, y - r*0.3, r*0.1, x, y, r);
    if (dark){ gr.addColorStop(0, 'rgba(112,106,98,.55)'); gr.addColorStop(0.6, 'rgba(70,66,62,.35)'); gr.addColorStop(1, 'rgba(60,58,55,0)'); }
    else { gr.addColorStop(0, 'rgba(196,188,174,.5)'); gr.addColorStop(0.6, 'rgba(150,144,134,.28)'); gr.addColorStop(1, 'rgba(130,125,118,0)'); }
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI*2); g.fill(); }
  return (SPR[key] = c);
}
const nightP = p => Math.max(0, Math.min(1, (0.02 - PG.sunSinEl(p))/0.16));   // 0 by day .. 1 once the sun is ~8 degrees down (per province)
const fxNight = (wx, wy) => { const c = worldToCell(wx, wy), p = c >= 0 ? G.prov[c] : -1; return p >= 0 ? nightP(p) : PG.nightAtX(wx); };
// display-only wind shared by all battle and fire smoke (no gameplay effect): its direction and strength drift slowly with the game clock, so
// every column leans and every puff drifts the same way. ux: the direction's screen-x part, wx/wy: the drift (wy flattened: the map is seen from above)
const WIND = {h:NaN, dir:0.6, spd:0.8, ux:0.83, wx:0.66, wy:0.05};
function windSync(){ const h = S ? S.hour + (S.speed && !S.over ? PG.acc : 0) : 0; if (h === WIND.h) return WIND; WIND.h = h;
  const d = 0.15 + 0.75*Math.sin(h/37) + 0.35*Math.sin(h/11.3), sp = 0.6 + 0.4*Math.sin(h/23);   // (a westerly, from between south-west and north-north-west: never straight at the viewer)
  WIND.dir = d; WIND.spd = sp; WIND.ux = Math.cos(d); WIND.wx = Math.cos(d)*sp; WIND.wy = Math.sin(d)*sp*0.35; return WIND; }
const windX = (a, b) => (a + Math.random()*b)*1.3*windSync().wx, windY = (a, b) => (a + Math.random()*b)*1.3*windSync().wy;   // a puff's downwind drift (px per s at kz 1)
const fxh = a => { a |= 0; a = Math.imul(a ^ a >>> 16, 0x45d9f3b); a = Math.imul(a ^ a >>> 16, 0x45d9f3b); return ((a ^ a >>> 16) >>> 0)/4294967296; };
// effects governor: frame-time average, spawn factor k (1 = full effects), smoke area drawn this frame, next allowed graceful retire
const FXG = {ema:16, k:1, area:0, pa:0, ret:0, t:0};   // (area: the drawn particles' smoke and dust, pa: the art puffs', each with its own budget)
const fxBudget = (a, puff) => { const k = puff ? 'pa' : 'area'; if (FXG[k] > 1.2*PG.cw*PG.ch*FXG.k) return false; FXG[k] += a; return true; };   // ~1.2 screens of smoke a frame for each pass (less as frames slow)
// over a cap: the oldest entries fade out over ~0.3 s (staggered so they never all vanish in one frame) instead of being cut
function fxRetire(arr, n, now, local){ let c = 0; for (const q of arr){ if (c >= n) break; if (q.die == null){ q.die = (local ? q.t : now) + 300 + c*12; c++; } } }
const SMOKE = q => puffSprite((q && q.v) || 0, true), SMOKEL = q => puffSprite((q && q.v) || 0, false);
const FIRE = () => softSprite('fire', 'rgba(255,245,200,1)', 'rgba(255,150,40,.75)', 'rgba(200,40,0,0)');
const FOAM = () => softSprite('foam', 'rgba(244,250,252,.85)', 'rgba(230,242,247,.35)', 'rgba(230,242,247,0)');
const GLOW = () => softSprite('glow', 'rgba(255,240,190,1)', 'rgba(255,200,90,.5)', 'rgba(255,150,40,0)');
// the particles are a pool of reused objects (PFREE), at most PART_CAP live (about 150 on High, 60 on Low, none with Effects Off); past the cap
// soft ones (smoke, dust, debris) are dropped and the oldest are faded out. (The strike effects, WFX, have their own caps and are never thinned here.)
const PFREE = [], PART_CAP = [0, 60, 150];
function partDrop(i){ const q = PART[i], L = PART.length - 1; if (i < L) PART[i] = PART[L]; PART.pop(); if (PFREE.length < 300) PFREE.push(q); }
function emit(kind, wx, wy, opt = {}){
  const lv = fxLv(); if (!lv) return;
  const soft = kind === 'smoke' || kind === 'smokel' || kind === 'dust' || kind === 'debris';
  if (soft && lv < 2 && Math.random() < (PG.afxReduced() ? 0.8 : 0.6)) return;
  if (soft && Math.random() > FXG.k) return;   // the governor thins smoke and dust when frames get slow
  const cap = PART_CAP[lv];
  if (PART.length >= cap){ const now = performance.now(); if (now > FXG.ret){ FXG.ret = now + 350; fxRetire(PART, Math.ceil(cap*0.2), now, true); } if (soft || PART.length >= cap*1.3) return; }
  const life = opt.life || ({smoke:2600, smokel:1800, fire:520, spark:600, dust:1100, debris:900, flash:120, core:60, ring:500, splash:900}[kind] || 800);
  const q = PFREE.pop() || {}; q.kind = kind; q.wx = wx; q.wy = wy; q.u = kzNow()/PG.view.s; q.ws = !!opt.ws; q.g = opt.g; q.ox = opt.ox || 0; q.oy = opt.oy || 0;
  q.vx = opt.vx ?? (Math.random() - 0.5)*12; q.vy = opt.vy ?? -(8 + Math.random()*14); q.life = life; q.t = 0; q.s0 = opt.s0 || 6; q.s1 = opt.s1 || 26; q.rot = Math.random()*6; q.spin = (Math.random() - 0.5)*0.6;
  q.v = (Math.random()*4) | 0; q.tn = opt.tn; q.die = null; q.id = 0; PART.push(q);
}
/* ---- art combat effects: fx-explosion bursts, fx-smoke puffs and fx-crater ground decals (assets/art) ----
   Each image is cut once into four cached sizes (mips), so a frame only scales a small canvas. Bursts and puffs are screen-sized like the
   drawn particles (times kz); craters are world-sized decals that fade over three game days. Without the art the drawn particles and
   scorch marks are used as before. SET.fx 'low' keeps only the big bursts and fewer craters; reduced motion drops smoke and pops. */
const AFX = {boom:[], puff:[], crater:[], mips:new Map(), heat:new Map(), tm:new Map(), pop:0, bpn:new Map(), bpa:new Map(), cv:0};   // bpn: live puffs per battle province, bpa: those of its smoke column (both refreshed in drawArtFx); cv: crater edits (deepened, removed) that redo the decal canvas
const afxSync = () => { if (AFX.S !== S){ AFX.S = S; AFX.crater.length = AFX.puff.length = AFX.boom.length = 0; AFX.heat.clear(); AFX.cv++; } };   // a new or loaded game starts clean
function afxMips(name, dark){ const key = name + (dark ? ':d' : ''); let m = AFX.mips.get(key); if (m) return m; if (!PG.ART.ready(name)) return null;
  m = [32, 64, 128, 256].map(px => PG.ART.sprite(name, px, dark ? {tint:'#121418', tintA:0.78} : name === 'fx-smoke' ? {tint:'#4a463f', tintA:0.3} : {})); if (m.some(c => !c)) return null; AFX.mips.set(key, m); return m; }
const afxPick = (m, px) => m.find(c => c.width >= px*0.85) || m[m.length - 1];
// a sprite turned to one of ROTN angles (and squashed to sq of its height after turning, for dust lying on the ground), made once: an
// axis-aligned drawImage of it costs about a third of a rotated one in a software canvas. The effect sprites are all inside their inscribed
// circle, so the turned copy is the same size; each effect keeps a fixed turn for its life
const ROTN = 32;
function rotSpr(src, ang, sq = 1){ const i = ((Math.round(ang/(Math.PI*2)*ROTN) % ROTN) + ROTN) % ROTN; if (!i && sq === 1) return src;
  const C = src.__rot || (src.__rot = new Map()), key = i + (sq === 1 ? '' : ':' + sq); let c = C.get(key); if (c) return c;
  const a = i*Math.PI*2/ROTN, co = Math.abs(Math.cos(a)), si = Math.abs(Math.sin(a)), fx = sq === 1 ? 1 : Math.hypot(co, si*sq), fy = sq === 1 ? 1 : Math.hypot(si, co*sq);   // (squashed: cut to the turned ellipse's box)
  c = document.createElement('canvas'); c.width = Math.ceil(src.width*fx); c.height = Math.ceil(src.height*fy); c.fx = c.width/src.width; c.fy = c.height/src.height; const g = c.getContext('2d'), w = src.width/2, h = src.height/2;
  g.translate(c.width/2, c.height/2); g.rotate(a); if (sq !== 1) g.scale(1, sq); g.drawImage(src, -w, -h); C.set(key, c); return c; }
const afxOff = (wx, wy, pad) => { const [x, y] = PG.toScreen(wx, wy); return x < -pad || y < -pad || x > PG.cw + pad || y > PG.ch + pad; };
// explosion burst: small = a battle pop (rate-limited, dropped on low effects / reduced motion)
function afxBoom(wx, wy, big = 1, small = false, wr = 0){   // wr: a world radius (world-sized: the burst grows with the map)
  if (!PG.booted || !PG.ART.ready('fx-explosion') || !fxLv()) return false; const now = performance.now(), low = PG.SET.fx !== 'high', red = PG.afxReduced();
  if (small){ if (low || red || now - AFX.pop < 90) return false; AFX.pop = now; }
  if (afxOff(wx, wy, 240)) return true;
  const cap = low ? 10 : 30; if (AFX.boom.length >= cap) AFX.boom.splice(0, AFX.boom.length - cap + 1);
  AFX.boom.push({wx, wy, t0:now, dur:(small ? 460 : 640 + 180*Math.min(2, big))*(red ? 0.75 : 1), s:(small ? 8 + 4*big : 15*Math.min(2.3, big)), wr, rot:(Math.random() - 0.5)*0.8, sp:(Math.random() - 0.5)*0.25, red});
  return true; }
// rising, drifting smoke puff (o: s0/s1 screen radius at kz 1, a peak alpha, dur ms, vx/vy px per s, dark)
function afxPuff(wx, wy, o = {}){
  if (!PG.booted || !PG.ART.ready('fx-smoke') || PG.afxReduced() || !fxLv()) return false; if (afxOff(wx, wy, 200) || Math.random() > FXG.k) return true;
  let bp = o.bp ?? -1; if (bp < 0 && S && S.battles.length){ const c = worldToCell(wx, wy), p = c >= 0 ? G.prov[c] : -1; if (p >= 0 && S.battles.includes(p)) bp = p; }   // smoke in a battle counts toward that battle
  if (bp >= 0){ const hx = PG.view.s*HS0, n = AFX.bpn.get(bp) || 0; if (n >= (hx < 26 ? 4 : hx < 76 ? 8 : 12)) return true; AFX.bpn.set(bp, n + 1); if (o.bp != null) AFX.bpa.set(bp, (AFX.bpa.get(bp) || 0) + 1); }   // live puffs per battle, by zoom (last frame's count)
  const low = PG.SET.fx !== 'high', cap = low ? 20 : 60; if (AFX.puff.length >= cap){ fxRetire(AFX.puff, Math.max(8, AFX.puff.length - cap + 1), performance.now()); if (AFX.puff.length >= cap*1.3) return true; }
  AFX.puff.push({wx, wy, u:kzNow()/PG.view.s, t0:performance.now(), bp, amb:o.bp != null, delay:o.delay || 0, dur:o.dur || 3600 + Math.random()*1800, s0:o.s0 || 5, s1:o.s1 || 22, a:o.a || 0.32,
    vx:o.vx ?? windX(3, 5), vy:o.vy ?? -(6 + Math.random()*6) + windY(3, 5), ox:o.ox || 0, oy:o.oy || 0, rot:Math.random()*6.28, spin:(Math.random() - 0.5)*0.5, dark:o.dark ?? (fxNight(wx, wy) > 0.45)});
  return true; }
// ground crater (world radius r, at most 2.5, or o.cap: a missile's 3.5) on land; a hit inside a crater adds a new small one elsewhere in the
// province while it holds fewer than 6, else deepens that crater (never grows it), so a long fight leaves several small craters, not one huge disc
function afxCrater(wx, wy, r, o = {}){
  if (!PG.booted || !PG.ART.ready('fx-crater') || !S) return false; afxSync(); const c = worldToCell(wx, wy); if (c < 0 || G.prov[c] < 0 || G.P[G.prov[c]].sea) return true;
  const h = S.hour + (S.speed && !S.over ? PG.acc : 0), life = o.life || 72, land = (x, y) => { const c1 = worldToCell(x, y); return c1 >= 0 && G.prov[c1] >= 0 && !G.P[G.prov[c1]].sea; };
  const pv = G.prov[c], inQ = (q, x, y, f) => Math.abs(q.wx - x) < q.r*0.55*f && Math.abs(q.wy - y) < q.r*0.45*f; r = Math.min(r, o.cap || 2.5);
  { const hitQ = AFX.crater.find(q => inQ(q, wx, wy, 1));
    if (hitQ){ const Pv = G.P[pv], n = Pv.cells.length; let inP = 0; for (const q of AFX.crater) if (q.p === pv) inP++;
      let best = null, bd = Infinity;
      if (inP < 6 && n) for (let k = 0; k < 10; k++){ const hh = fxh(pv*7919 + AFX.crater.length*131 + k*977 + (h*60 | 0)), cc = cellCenter(Pv.cells[Math.floor(hh*n)]);   // a jittered cell of the province
        const x = cc[0] + (fxh(hh*1e9 + 3) - 0.5)*1.4*HS, y = cc[1] + (fxh(hh*1e9 + 5) - 0.5)*1.2*HS, d = Math.hypot(x - wx, y - wy);
        if (d >= bd || !land(x, y) || worldToCell(x, y) < 0 || G.prov[worldToCell(x, y)] !== pv || AFX.crater.some(q => inQ(q, x, y, 1.6))) continue; best = [x, y]; bd = d; }
      if (best){ wx = best[0]; wy = best[1]; r *= 0.7 + 0.3*fxh(bd*97); }
      else { hitQ.h = h; hitQ.life = Math.max(hitQ.life, life); hitQ.a = Math.min(0.95, hitQ.a + 0.08); AFX.cv++; return true; } } }
  let ok = false; for (let n = 0; n < 7 && r >= 1.2; n++){ ok = true; for (let j = 0; j < 8 && ok; j++) ok = land(wx + Math.cos(j*0.785)*r*0.75, wy + Math.sin(j*0.785)*r*0.6); if (ok) break; r *= 0.78; }   // keep the decal on land at coasts
  if (!ok) return true;   // no room on a tiny island or a sliver of coast: no crater rather than one covering the land
  const cap = PG.SET.fx !== 'high' ? 50 : 120; if (AFX.crater.length >= cap){ AFX.crater.splice(0, AFX.crater.length - cap + 1); AFX.cv++; }
  AFX.crater.push({wx, wy, r, h, life, p:pv, t0:performance.now(), rot:Math.random()*6.28, sq:0.82 + Math.random()*0.16, a:o.a || 0.85}); return true; }
// a city burns for a while after it is bombarded or captured (smoke drawn by afxAmbient)
function afxMark(p, hours){ if (!PG.booted || !S || G.P[p].sea) return; afxSync(); const h = S.hour, m = AFX.heat.get(p); if (!m || h + hours > m.h + m.d) AFX.heat.set(p, {h, d:hours}); }
function afxTimer(key, now, ms){ const t = AFX.tm.get(key) || 0; if (now - t < ms) return false; if (AFX.tm.size > 400) AFX.tm.clear(); AFX.tm.set(key, now); return true; }
// per frame: smoke over burning cities (not in a battle: its smoke is drawBattleSmoke's), rate-limited per province
function afxAmbient(now, vis){
  if (!PG.booted || !fxLv() || PG.SET.fx !== 'high' || PG.afxReduced() || !PG.ART.ready('fx-smoke')) return; const hexPx = PG.view.s*HS0; if (hexPx < 7) return;
  for (const [p, m] of AFX.heat){ const age = S.hour - m.h; if (age < 0 || age > m.d || S.battles.includes(p)){ if (age < 0 || age > m.d) AFX.heat.delete(p); continue; }
    const P = G.P[p]; if (afxOff(P.x, P.y, 100) || !vis.has(p)) continue; const f = 1 - age/m.d;
    if (afxTimer('c' + p, now, 700 + (1 - f)*1400 + Math.random()*400)) afxPuff(P.x + (Math.random() - 0.5)*5, P.y + (Math.random() - 0.5)*3, {s0:4, s1:13 + 9*f, a:0.22 + 0.14*f, dur:5200 + Math.random()*2400, vx:windX(5, 4), vy:-(8 + Math.random()*5) + windY(5, 4)}); } }
// crater decals: settled craters (past their 300 ms grow-in) are drawn once into CRD.cv, a canvas aligned with the layer (same margins, origin,
// scale and pixel ratio), and laid over the map with one 'multiply' blit of the part that holds craters; only the grow-in is drawn live.
// The canvas is redone when the layer moves or rescales, a crater is deepened or removed, or the game hour turns (the slow age fade steps
// hourly); a crater that settles is added to it as it stands
const CRD = {cv:null, key:'', gen:0, tl:null, tw:0, th:0, any:false}, CRD_T = 64;   // tl: the 64 device-px tiles that hold craters (only those are cleared and blitted)
const crdA = (q, age, zin) => { const Pq = q.p != null ? G.P[q.p] : null, cty = Pq && Pq.city && Math.hypot(q.wx - Pq.x, q.wy - Pq.y) < 1.5*HS ? 0.5 : 1;   // (on a city's centre: half, its streets stay readable)
  return 0.7*cty*q.a*zin*Math.min(1, Math.pow(1 - Math.max(0, age)/q.life, 0.7)); };
function crdDraw(g, q, m, h0, L, dp){ const rs = Math.min(35, Math.max(q.r*L.s, q.r*1.5)), x0 = (q.wx*L.s + L.vx + L.mx)*dp, y = (q.wy*L.s + L.vy + L.my)*dp, rd = rs*dp;
  q.dc = CRD.gen; for (const d of PG.wrapPx(x0, rd, L.width, L.s*dp)) crdDraw1(g, q, m, h0, L, dp, rs, x0 + d, y, rd); }   // (each copy of the crater in the layer)
function crdDraw1(g, q, m, h0, L, dp, rs, x, y, rd){
  if (rs < 1.5 || x < -rd || y < -rd || x > L.width + rd || y > L.height + rd) return;
  const zin = Math.min(1, (L.s*HS0 - 6)/5), a = crdA(q, h0 - q.h, zin); if (a <= 0) return; g.globalAlpha = a; const co = Math.cos(q.rot)*dp, si = Math.sin(q.rot)*dp;
  g.setTransform(co, si, -si, co, x, y); g.drawImage(afxPick(m, rd*2), -rs, -rs*q.sq, rs*2, rs*2*q.sq);
  const t0x = Math.max(0, Math.floor((x - rd - 1)/CRD_T)), t1x = Math.min(CRD.tw - 1, Math.floor((x + rd + 1)/CRD_T)), t0y = Math.max(0, Math.floor((y - rd - 1)/CRD_T)), t1y = Math.min(CRD.th - 1, Math.floor((y + rd + 1)/CRD_T));
  for (let ty = t0y; ty <= t1y; ty++) for (let tx = t0x; tx <= t1x; tx++){ CRD.tl[ty*CRD.tw + tx] = 1; CRD.any = true; } }
function crdBuild(m, h0, now, full){ const L = PG.layer, dp = L.dp || PG.dpr; let C = CRD.cv; if (!C) C = CRD.cv = document.createElement('canvas');
  const g = C.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  if (full){ if (C.width !== L.width || C.height !== L.height){ C.width = L.width; C.height = L.height; CRD.tw = Math.ceil(C.width/CRD_T); CRD.th = Math.ceil(C.height/CRD_T); CRD.tl = new Uint8Array(CRD.tw*CRD.th); }
    else if (CRD.any) for (let i = 0; i < CRD.tl.length; i++) if (CRD.tl[i]){ CRD.tl[i] = 0; g.clearRect((i % CRD.tw)*CRD_T, Math.floor(i/CRD.tw)*CRD_T, CRD_T, CRD_T); }
    CRD.any = false; CRD.gen++; }
  for (const q of AFX.crater) if (q.dc !== CRD.gen && now - q.t0 >= 300) crdDraw(g, q, m, h0, L, dp);
  g.globalAlpha = 1; g.setTransform(1, 0, 0, 1, 0, 0); }
function drawCraters(now){
  afxSync(); if (!AFX.crater.length || !S) return; const hexPx = PG.view.s*HS0, m = hexPx >= 6 ? afxMips('fx-crater') : null; if (!m) return;
  const h0 = S.hour + (S.speed && !S.over ? PG.acc : 0), zin = Math.min(1, (hexPx - 6)/5), red = PG.afxReduced(), L = PG.layer;
  let add = false, live = 0; for (let i = AFX.crater.length - 1; i >= 0; i--){ const q = AFX.crater[i], age = h0 - q.h; if (age > q.life || age < -2){ AFX.crater.splice(i, 1); AFX.cv++; continue; }
    if (now - q.t0 < 300) live++; else if (q.dc !== CRD.gen) add = true; }
  if (!L || L.s*HS0 < 6) return;
  const key = L.full + '|' + (L.strips || 0) + '|' + L.vx + ',' + L.vy + '|' + L.s + '|' + (L.dp || PG.dpr) + '|' + L.width + 'x' + L.height + '|' + AFX.cv + '|' + Math.floor(h0);
  if (key !== CRD.key){ CRD.key = key; crdBuild(m, h0, now, true); } else if (add) crdBuild(m, h0, now, false);
  PG.ctx.globalCompositeOperation = 'multiply';   // darkened ground: the roads and the city grid show through
  if (CRD.any){ PG.ctx.setTransform(1, 0, 0, 1, 0, 0); const C = CRD.cv, sc = L.s !== PG.view.s || (L.dp || PG.dpr) !== PG.dpr, f = PG.view.s/L.s, g = sc ? f*PG.dpr/(L.dp || PG.dpr) : 1;   // (a glide: scaled with the layer)
    const lx = sc ? PG.dpr*(PG.view.x - (L.vx + L.mx)*f) : Math.round((PG.view.x - L.vx - L.mx)*PG.dpr), ly = sc ? PG.dpr*(PG.view.y - (L.vy + L.my)*f) : Math.round((PG.view.y - L.vy - L.my)*PG.dpr);
    for (let ty = 0; ty < CRD.th; ty++){ const y0 = ty*CRD_T, y1 = Math.min(C.height, y0 + CRD_T); if (ly + y1*g <= 0 || ly + y0*g >= PG.cv.height) continue;
      for (let tx = 0; tx < CRD.tw; tx++){ if (!CRD.tl[ty*CRD.tw + tx]) continue; let te = tx; while (te + 1 < CRD.tw && CRD.tl[ty*CRD.tw + te + 1]) te++;   // a run of tiles in this row: one blit
        let x0 = tx*CRD_T, x1 = Math.min(C.width, (te + 1)*CRD_T); tx = te; if (lx + x1*g <= 0 || lx + x0*g >= PG.cv.width) continue;
        if (!sc){ x0 = Math.max(x0, -lx); x1 = Math.min(x1, PG.cv.width - lx); const ya = Math.max(y0, -ly), yb = Math.min(y1, PG.cv.height - ly); if (x1 > x0 && yb > ya) PG.ctx.drawImage(C, x0, ya, x1 - x0, yb - ya, lx + x0, ly + ya, x1 - x0, yb - ya); }
        else PG.ctx.drawImage(C, x0, y0, x1 - x0, y1 - y0, lx + x0*g, ly + y0*g, (x1 - x0)*g, (y1 - y0)*g); } } }
  if (live) for (const q of AFX.crater){ if (now - q.t0 >= 300) continue;   // the grow-in, live
    const rs = Math.min(35, Math.max(q.r*PG.view.s, q.r*1.5)*(red ? 1 : 1 + 0.25*Math.max(0, 1 - (now - q.t0)/260))), [x, y] = PG.toScreen(q.wx, q.wy); if (rs < 1.5 || x < -rs || y < -rs || x > PG.cw + rs || y > PG.ch + rs) continue;
    PG.ctx.globalAlpha = crdA(q, h0 - q.h, zin); const co = Math.cos(q.rot)*PG.dpr, si = Math.sin(q.rot)*PG.dpr;
    PG.ctx.setTransform(co, si, -si, co, x*PG.dpr, y*PG.dpr); PG.ctx.drawImage(afxPick(m, rs*2*PG.dpr), -rs, -rs*q.sq, rs*2, rs*2*q.sq); }
  PG.ctx.globalAlpha = 1; PG.ctx.globalCompositeOperation = 'source-over'; PG.ctx.setTransform(1, 0, 0, 1, 0, 0); }
function drawArtFx(now, kz){
  AFX.bpn.clear(); AFX.bpa.clear(); PG.ctx.setTransform(PG.dpr, 0, 0, PG.dpr, 0, 0);
  if (AFX.puff.length){ const m = afxMips('fx-smoke'), md = afxMips('fx-smoke', true);
    if (m && md) for (let i = AFX.puff.length - 1; i >= 0; i--){ const q = AFX.puff[i], t = now - q.t0 - q.delay; const k = t/q.dur; if (k >= 1 || (q.die != null && now >= q.die)){ AFX.puff.splice(i, 1); continue; }
      if (q.bp >= 0){ AFX.bpn.set(q.bp, (AFX.bpn.get(q.bp) || 0) + 1); if (q.amb) AFX.bpa.set(q.bp, (AFX.bpa.get(q.bp) || 0) + 1); } if (t < 0) continue;
      const ts = t/1000, f = kzF(q, kz), [bx, by] = PG.toScreen(q.wx, q.wy), x = bx + (q.ox + q.vx*ts*(1 + 0.6*k))*f, y = by + (q.oy + q.vy*ts*(1 - 0.35*k))*f, sz = (q.s0 + (q.s1 - q.s0)*(1 - (1 - k)*(1 - k)))*kzS(f, kz);
      if (x < -sz || y < -sz || x > PG.cw + sz || y > PG.ch + sz) continue;
      /*@TEST*/if (WFX.dbg) WFX.dbg.push(['a' + (q.id || (q.id = ++WFX.id)), x, y, PG.view.s, PG.view.x, PG.view.y]);/*@ENDTEST*/
      if (!fxBudget(sz*sz*4, true)) continue;   // past the smoke budget this frame: the older puffs wait a frame
      const fd = q.die != null ? Math.min(1, Math.max(0, (q.die - now)/300)) : 1;
      PG.ctx.globalAlpha = fd*q.a*(k < 0.12 ? k/0.12 : Math.pow((1 - k)/0.88, 1.3));
      PG.ctx.drawImage(rotSpr(afxPick(q.dark ? md : m, sz*2*PG.dpr > 64 && k > 0.6 ? sz*1.4*PG.dpr : sz*2*PG.dpr), q.rot), x - sz, y - sz, sz*2, sz*2);   // (a big, spread-out puff: the next smaller mip)
      if (q.dark && k < 0.3 && FXG.k >= 0.7){ PG.ctx.globalCompositeOperation = 'lighter'; PG.ctx.globalAlpha = fd*0.22*(1 - k/0.3); PG.ctx.drawImage(GLOW(), x - sz*0.8, y - sz*0.05, sz*1.6, sz*0.9); PG.ctx.globalCompositeOperation = 'source-over'; } } }
  if (AFX.boom.length){ const m = afxMips('fx-explosion');
    if (m) for (let i = AFX.boom.length - 1; i >= 0; i--){ const q = AFX.boom[i], k = (now - q.t0)/q.dur; if (k >= 1){ AFX.boom.splice(i, 1); continue; } if (k < 0) continue;
      const [x, y] = PG.toScreen(q.wx, q.wy), e = 1 - (1 - k)*(1 - k)*(1 - k), sz = (q.wr ? q.wr*PG.view.s : q.s*kz)*(q.red ? 0.9 : 0.35 + 0.75*e); if (x < -sz || y < -sz || x > PG.cw + sz || y > PG.ch + sz) continue;
      const im = rotSpr(afxPick(m, sz*2*PG.dpr), q.rot);
      PG.ctx.globalAlpha = k < 0.08 ? k/0.08 : Math.pow(1 - (k - 0.08)/0.92, 1.6); PG.ctx.drawImage(im, x - sz, y - sz, sz*2, sz*2);
      if (k < 0.3){ PG.ctx.globalCompositeOperation = 'lighter'; PG.ctx.globalAlpha = 0.32*(1 - k/0.3); PG.ctx.drawImage(im, x - sz*0.5, y - sz*0.5, sz, sz); PG.ctx.globalCompositeOperation = 'source-over'; } } }
  PG.ctx.globalAlpha = 1; PG.ctx.setTransform(PG.dpr, 0, 0, PG.dpr, 0, 0); }
function explode(wx, wy, big = 1, air = false, lite = false, fz = 1){   // fz: the flash's scale (a plate's shells, very close in)
  const art = afxBoom(wx, wy, big, big < 1);   // sprite burst; the drawn fire then only adds sparkle
  if (!lite) emit('core', wx, wy, {s0:(4 + 3*Math.min(1.5, big))*Math.min(1, 2.6/PKZ), s1:2, life:60});   // a small white core for the first frames of the impact (held in scale very close in)
  emit('flash', wx, wy, {s0:(art ? 18 : 28)*big*fz, s1:10*fz, life:140});
  if (lite){ for (let i = 0; i < 2*big; i++) emit('fire', wx, wy, {vx:(Math.random() - 0.5)*60*big, vy:-(10 + Math.random()*40)*big, s0:10*big, s1:3, life:420 + Math.random()*260}); return; }
  for (let i = 0; i < (art ? 5 : 8); i++) emit('dust', wx, wy, {vx:(Math.random() - 0.5)*140*big, vy:-(2 + Math.random()*6), s0:6, s1:30*big, life:1400});
  if (PG.booted && !(big >= 1 && !air && afxCrater(wx, wy, 1.4 + 1.5*big)) && !(big < 1 && PG.ART.ready('fx-crater'))){ SCORCH.push({wx, wy, r:6 + 6*big, t0:performance.now()}); if (SCORCH.length > 60) SCORCH.shift(); }
  for (let i = 0; i < (art ? 2 : 5)*big; i++) emit('fire', wx, wy, {vx:(Math.random() - 0.5)*60*big, vy:-(10 + Math.random()*40)*big, s0:10*big, s1:3, life:420 + Math.random()*260});
  const sb = Math.min(big, 1.4); let puffs = 0; if (art) for (let i = 0; i < (big >= 1 ? 3 : 1); i++) puffs += afxPuff(wx, wy, {delay:120 + i*160, ox:(Math.random() - 0.5)*12*sb, s0:5*sb, s1:(12 + Math.random()*8)*sb, a:0.4, dur:3000 + Math.random()*1800, vx:(Math.random() - 0.5)*6 + windX(3, 4), vy:-(7 + Math.random()*9) + windY(3, 4)}) ? 1 : 0;
  if (!puffs) for (let i = 0; i < Math.round(5*big); i++) emit('smoke', wx, wy, {ox:(Math.random() - 0.5)*14*sb, vx:(Math.random() - 0.5)*26, vy:-(6 + Math.random()*16), s0:7*sb, s1:(20 + Math.random()*14)*sb, life:2000 + Math.random()*1600});
  for (let i = 0; i < 6*big; i++) emit('debris', wx, wy, {vx:(Math.random() - 0.5)*110*big, vy:-(40 + Math.random()*70)*big, s0:1.6, s1:1.2, life:700 + Math.random()*400});
}
/* ---- strike and blast effects (WFX), all drawn with code (no video): one look per weapon. cm: cruise missile (a quick, sharp blast: bright
   orange fireball, sparks, a small dark smoke puff); bm: ballistic missile (white flash, ground shock ring, big fireball, thick smoke column);
   chem: chemical (a small burst, then a sickly yellow-green gas cloud that spreads slowly and lingers); tac: tactical nuclear (blinding flash,
   fireball, fast shock ring, small mushroom cloud); icbm: the biggest (a screen-wide flash, huge fireball, large shock ring, tall mushroom
   cloud, then burning ground for several game hours); and combat blasts by size: exS (infantry, drones), exM (tanks, aircraft), exL (ships,
   buildings). Every part lives in WORLD units round its world spot: its offset, rise, spread and size, so an effect stays fixed to the map and
   scales with it while zooming and panning (far out a blast keeps a minimum size, drawn bigger about its spot, so it still reads; close in a
   mushroom cloud is drawn smaller about its foot, so it stays on screen). Each part is a pure function of the effect's age (no per-frame
   state), drawn from cached noise sprites: fire over a hot additive core, smoke lit from above (lifted and warmed at night, so it still shows),
   gas as a flat translucent sheet, soft dust bands for shock fronts and base surges; on High (and without the Battery saver) a shock front also
   bends the map under it (the canvas copied onto itself, magnified, in an elliptic band: a canvas 2D 'shader'). An ICBM's flash also whitens
   the page round the map (a veil that fades on its own clock). Battery: at most wfxCap() heavy and light effects at once (fewer on Low and with the Battery saver:
   the oldest fades out), none started off screen, off-screen ones not drawn, frames asked (animFast) only while one on screen runs; the burning
   ground after an ICBM moves on the paused game clock (animAmb). Low: fewer parts, no smoke column, no ripple, shorter.
   The rules can trigger the warheads they do not have yet with IM.emit('fxWarhead', {kind, p, by}) (kind cm, bm, chem, tac, icbm), and a blast
   with IM.emit('fxBlast', {size:'S'|'M'|'L', p}); the page's own entry points are FXW.cruise / ballistic / chemical / tactical / icbm / blast. */
const WFX = {list:[], burn:[], flash:null, veil:null, area:0, bud:0, S:null, id:0, ks:1, occ:[], og:null/*@TEST*/, fz:0, dbg:null/*@ENDTEST*/};   // occ: last frame's dense fire and smoke (wfxOcc), og: the group being drawn
const WFX_R = {cm:2.6, bm:4.2, chem:0.9, tac:4.5, icbm:12, exS:1.6, exM:2.4, exL:3.6};   // the fireball's world radius (a world unit is about 8.7 km; a province about 12)
const WFX_MP = {cm:18, bm:28, chem:9, tac:20, icbm:26, exS:12, exM:14, exL:16};   // the fireball's smallest drawn radius (css px): at mid zoom a blast still reads, a ballistic one plainly bigger than a cruise one
// on a phone-sized map those floors grow (up to 1.5x on a 430 px screen), so a cruise blast or a small combat blast still reads at mid zoom
const wfxPh = () => { const m = Math.min(PG.cw, PG.ch); return m >= 640 ? 1 : m <= 440 ? 1.5 : 1 + 0.5*(640 - m)/200; };
const wfxKr = e => Math.max(PG.view.s, WFX_MP[e.k]*wfxPh()/e.R);   // an effect's world-to-screen scale: the map's, or bigger about its spot far out (the floor)
const wfxHeavy = k => k[0] !== 'e';
const wfxCap = heavy => { const low = PG.SET.fx !== 'high', sv = PG.saverOn(); return heavy ? (low ? 3 : 6) - (sv ? (low ? 1 : 2) : 0) : (low ? 6 : 12) - (sv ? (low ? 2 : 4) : 0); };
const wfxSync = () => { if (WFX.S !== S){ WFX.S = S; WFX.list.length = WFX.burn.length = 0; WFX.occ = []; WFX.flash = null; wfxVeil(0); } };
// ---- sprites: noise-textured, baked once per variant at 128 px and 48 px (the small one for small draws: no sparkle from a big texture shrunk)
function wfxNoise(seed){ const n = PG.makeNoise(mulberry(seed)); return (x, y) => n(x, y)*0.55 + n(x*2.03 + 17.3, y*2.03 + 5.1)*0.3 + n(x*4.1 + 31.7, y*4.1 + 11.9)*0.15; }
const wfxSm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a)/(b - a))); return t*t*(3 - 2*t); };
function wfxBake(key, N, mk, br){ if (SPR[key]) return SPR[key]; const px = mk(), c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++){ const o = (y*N + x)*4, q = px((x + 0.5)/N*2 - 1, (y + 0.5)/N*2 - 1); if (!q) continue; d[o] = q[0]; d[o + 1] = q[1]; d[o + 2] = q[2]; d[o + 3] = q[3]; }
  if (br) wfxBlur(d, N, br); g.putImageData(im, 0, 0); return (SPR[key] = c); }
// a soft copy: the sprite blurred in place (premultiplied, a box of radius br px run twice each way, so about a tent twice as wide), for smoke
// that has spread and lost its edges
function wfxBlur(d, N, br){ const n = N*N, a = new Float32Array(n*4), b = new Float32Array(n*4), w = 2*br + 1;
  for (let i = 0; i < n*4; i += 4){ const al = d[i + 3]/255; a[i] = d[i]*al; a[i + 1] = d[i + 1]*al; a[i + 2] = d[i + 2]*al; a[i + 3] = d[i + 3]; }
  const run = (src, dst, st, ln) => { for (let l = 0; l < N; l++) for (let ch = 0; ch < 4; ch++){ const o0 = l*ln + ch; let s = 0;
      for (let i = 0; i <= br && i < N; i++) s += src[o0 + i*st];
      for (let i = 0; i < N; i++){ dst[o0 + i*st] = s/w; if (i - br >= 0) s -= src[o0 + (i - br)*st]; if (i + br + 1 < N) s += src[o0 + (i + br + 1)*st]; } } };
  for (let k = 0; k < 2; k++){ run(a, b, 4, N*4); run(b, a, N*4, 4); }
  for (let i = 0; i < n*4; i += 4){ const al = a[i + 3], f = al > 0.5 ? 255/al : 0; d[i] = a[i]*f; d[i + 1] = a[i + 1]*f; d[i + 2] = a[i + 2]*f; d[i + 3] = al; } }
// a billow: 11 overlapping spheres (seeded per variant) seen from above, the sample point warped by noise so no outline is round; per pixel the
// blended top surface (a soft maximum of the spheres' heights, so there is no seam where two meet), its normal and how far inside the union
// it lies. Smoke shades that surface by its normal (puffs lit from the upper left), fire colours it by heat
function wfxBillow(seed){ const r = mulberry(seed), B = [], wn = wfxNoise(seed + 3), K = 9;
  for (let k = 0; k < 11; k++){ const a = r()*Math.PI*2, d = k ? 0.14 + 0.36*r() : 0, rb = k ? 0.2 + 0.2*r() : 0.42; B.push([Math.cos(a)*d, Math.sin(a)*d*0.9, rb, r()*0.2]); }
  return (x0, y0) => { const x = x0 + (wn(x0*2.2 + 9, y0*2.2 + 9) - 0.5)*0.34, y = y0 + (wn(x0*2.2 + 41, y0*2.2 + 3) - 0.5)*0.34; let sw = 0, nx = 0, ny = 0, nz = 0, cov = 0, zs = 0;
    for (const [cx, cy, rb, cz] of B){ const ux = (x - cx)/rb, uy = (y - cy)/rb, q = 1 - ux*ux - uy*uy; if (q <= 0) continue; const h = Math.sqrt(q), z = cz + h*rb, w = Math.exp(K*z);
      sw += w; nx += ux*w; ny += uy*w; nz += h*w; zs += z*w; cov = Math.max(cov, q); }
    if (!sw) return null; const l = Math.hypot(nx, ny, nz) || 1; return {nx:nx/l, ny:ny/l, nz:nz/l, cov, top:zs/sw}; }; }
const WFX_FIRE = [[0, 120, 26, 6], [0.2, 190, 52, 10], [0.42, 238, 108, 24], [0.64, 255, 168, 60], [0.82, 255, 220, 140], [1, 255, 248, 222]];
function wfxRamp(R, t){ for (let i = 1; i < R.length; i++) if (t <= R[i][0]){ const a = R[i - 1], b = R[i], f = (t - a[0])/(b[0] - a[0]); return [a[1] + (b[1] - a[1])*f, a[2] + (b[2] - a[2])*f, a[3] + (b[3] - a[3])*f]; } const l = R[R.length - 1]; return [l[1], l[2], l[3]]; }
// fire: a billow of flame, white-yellow deep inside, orange, then deep red at its edge, mottled by noise
function wfxFire(v, small){ const key = 'wf' + v + (small ? 's' : ''); if (SPR[key]) return SPR[key];
  return wfxBake(key, small ? 48 : 128, () => { const nz = wfxNoise(7100 + v*31), bl = wfxBillow(7150 + v*13); return (dx, dy) => { const r = Math.hypot(dx, dy); if (r >= 1) return null; const n = nz((dx + 1)*2.4, (dy + 1)*2.4), nf = nz((dx + 1)*7 + 13, (dy + 1)*7 + 7), b = bl(dx*1.1, dy*1.1); if (!b) return null;
    const dn = b.cov + (nf - 0.5)*0.45; if (dn <= 0) return null; const t = Math.max(0, Math.min(1, 0.12 + 0.62*b.nz*(1 - 0.5*r) + (n - 0.5)*0.7 + (nf - 0.5)*0.35)), c = wfxRamp(WFX_FIRE, t);
    return [c[0], c[1], c[2], 255*wfxSm(0, 0.36, dn)*wfxSm(1, 0.9, r)]; }; }); }
// smoke: a billow lit from the upper left (sky light: each sphere shaded by its normal), soft and frayed at the rim; tones [shadow, lit].
// soft: the same billow blurred (smoke that has spread and lost its edges; drawn cross-faded in as a puff ages)
const WFX_TONE = {dark:[[22, 20, 18], [104, 96, 86]], grey:[[56, 53, 49], [168, 162, 152]], mush:[[64, 46, 36], [212, 194, 170]], light:[[104, 99, 94], [240, 236, 228]],
  dust:[[86, 70, 50], [198, 178, 142]], spray:[[150, 166, 174], [252, 253, 253]]};
// a tone's colour at light li (0 shadow .. 1 lit): by day the tone's own; at night dimmed to the night map's level, the lit side a little cool
// (moonlight). Never lifted or warmed: smoke gives off no light of its own (a fire's glow is drawn by the fire), so dark smoke stays dark
const wfxTone = (T, li, night) => { const c = [0, 1, 2].map(i => T[0][i] + (T[1][i] - T[0][i])*li); return night ? [c[0]*0.44 + 6 + 2*li, c[1]*0.44 + 6 + 5*li, c[2]*0.44 + 7 + 11*li] : c; };
function wfxSmoke(tone, v, night, small, soft){ const key = 'ws' + tone + v + (night ? 'n' : '') + (small ? 's' : '') + (soft ? 'f' : ''); if (SPR[key]) return SPR[key];
  return wfxBake(key, small ? 48 : 128, () => { const T = WFX_TONE[tone] || WFX_TONE.dark, nz = wfxNoise(7300 + v*37), bl = wfxBillow(7350 + v*17), L = [-0.46, -0.62, 0.64]; return (dx, dy) => { const r = Math.hypot(dx, dy); if (r >= 1) return null; const n = nz((dx + 1)*3.2, (dy + 1)*3.2), nf = nz((dx + 1)*8 + 21, (dy + 1)*8 + 5), b = bl(dx*1.08, dy*1.08); if (!b) return null;
    const dn = b.cov + (n - 0.5)*0.35 + (nf - 0.5)*0.3; if (dn <= 0) return null; const dif = Math.max(0, b.nx*L[0] + b.ny*L[1] + b.nz*L[2]), li = Math.max(0, Math.min(1, 0.18 + 0.7*dif + (n - 0.5)*0.35 + (nf - 0.5)*0.4)), c = wfxTone(T, li, night);
    return [c[0], c[1], c[2], 255*0.94*wfxSm(0, 0.65, dn)*wfxSm(1, 0.86, r)]; }; }, soft ? Math.round((small ? 48 : 128)*0.05) : 0); }
// a mushroom stem's puff: a soft blob shaded as a piece of a column (lit from the left by x alone, so a stack of them reads as one smooth
// column, without a bright top on each piece), streaked by noise stretched up the stem; drawn taller than wide
function wfxStemP(tone, v, night, small){ const key = 'wt' + tone + (v & 1) + (night ? 'n' : '') + (small ? 's' : ''); if (SPR[key]) return SPR[key];
  return wfxBake(key, small ? 40 : 96, () => { const T = WFX_TONE[tone] || WFX_TONE.dark, nz = wfxNoise(7800 + (v & 1)*41), nf = wfxNoise(7850 + (v & 1)*43); return (dx, dy) => { const r = Math.hypot(dx, dy); if (r >= 1) return null;
    const n = nz((dx + 1)*2.2, (dy + 1)*1.2), f = nf((dx + 1)*6 + 5, (dy + 1)*2.4 + 3), dn = 1 - r + (n - 0.5)*0.75 + (f - 0.5)*0.4; if (dn <= 0) return null;
    const cz = Math.sqrt(Math.max(0, 1 - dx*dx)), li = Math.max(0, Math.min(1, 0.14 + 0.62*Math.max(0, -dx*0.6 + cz*0.8) + (n - 0.5)*0.7 + (f - 0.5)*0.5)), c = wfxTone(T, li, night);
    return [c[0], c[1], c[2], 255*0.92*wfxSm(0, 0.55, dn)*wfxSm(1, 0.8, r)]; }; }); }
// gas: a low, flat sheet of noise lying on the ground (no shading), a dull sickly olive: paler khaki-yellow where it is dense, darker olive at
// its thin edge, so the cloud shows on green fields by its colour and its rim; at night only dimmed with the map (it gives off no light)
const WFX_GAS = [[0, 66, 72, 26], [0.4, 124, 132, 50], [1, 186, 186, 96]];
function wfxGas(v, night, small){ const key = 'wg' + v + (night ? 'n' : '') + (small ? 's' : ''); if (SPR[key]) return SPR[key];
  return wfxBake(key, small ? 48 : 128, () => { const nz = wfxNoise(7600 + v*23), nf = wfxNoise(7650 + v*29), k = night ? 0.42 : 1; return (dx, dy) => { const r = Math.hypot(dx, dy); if (r >= 1) return null;
    const n = nz((dx + 1)*1.7 + v, (dy + 1)*1.7), f = nf((dx + 1)*4.6 + 3, (dy + 1)*4.6 + 9), dn = 1 - r*1.02 + (n - 0.5)*0.8 + (f - 0.5)*0.3; if (dn <= 0) return null;
    const de = wfxSm(0, 0.7, dn), c = wfxRamp(WFX_GAS, Math.max(0, Math.min(1, 0.08 + 0.84*de + 0.5*(f - 0.5))));
    return [c[0]*k, c[1]*k, c[2]*k, 255*0.86*Math.pow(de, 0.5)*wfxSm(1, 0.8, r)]; }; }); }
// rings (256 px): the shock front (a thin bright band, soft inside) and the base surge (a broad, broken dust band); the burnt-ground decal
function wfxRing(dust){ const key = dust ? 'wrd' : 'wrs'; if (SPR[key]) return SPR[key];
  return wfxBake(key, 256, () => { const nz = wfxNoise(dust ? 7700 : 7710), T = WFX_TONE.dust; return (dx, dy) => { const r = Math.hypot(dx, dy); if (r >= 1) return null;
    if (!dust){ const an = Math.atan2(dy, dx), n = nz(Math.cos(an)*4 + 6 + r*3, Math.sin(an)*4 + 6 + r*3), b = (r - 0.84)/(r < 0.84 ? 0.2 : 0.09), a = Math.exp(-b*b)*(0.45 + 0.7*n)*wfxSm(1, 0.97, r); if (a < 0.006) return null;
      const li = 0.55 + 0.45*n; return [196 + 46*li, 186 + 50*li, 168 + 56*li, 255*Math.min(1, a*0.9)]; }
    const an = Math.atan2(dy, dx), n = nz(Math.cos(an)*3 + 4 + r*5, Math.sin(an)*3 + 4 + r*5), a = wfxSm(0.45, 0.82, r)*wfxSm(1, 0.9, r)*(0.45 + 0.75*n); if (a < 0.01) return null;
    const li = Math.min(1, 0.3 + 0.9*n); return [T[0][0] + (T[1][0] - T[0][0])*li, T[0][1] + (T[1][1] - T[0][1])*li, T[0][2] + (T[1][2] - T[0][2])*li, 255*Math.min(1, a)]; }; }); }
function wfxScorch(){ if (SPR.wsc) return SPR.wsc;
  return wfxBake('wsc', 128, () => { const nz = wfxNoise(7900); return (dx, dy) => { const r = Math.hypot(dx, dy); if (r >= 1) return null; const n = nz((dx + 1)*4, (dy + 1)*4), dn = 1 - r*1.08 + (n - 0.5)*0.55; if (dn <= 0) return null;
    const c = dn > 0.45 ? [34, 26, 22] : [74, 54, 40]; return [c[0], c[1], c[2], 255*0.9*wfxSm(0, 0.3, dn)*wfxSm(1, 0.85, r)]; }; }); }
const WGLOW = () => softSprite('wglow', 'rgba(255,255,252,1)', 'rgba(255,238,206,.42)', 'rgba(255,206,150,0)');
// ---- building an effect: its parts, from one seed. Units: world (y up the screen is negative), ms; t0 the part's start, d its life
function wfxBuild(e){ const k = e.k, R = e.R, r = mulberry(e.seed), L = e.low, red = e.red, q = (L ? 0.5 : 1)*Math.max(0.55, FXG.k)*(PG.saverOn() ? 0.8 : 1), n = m => Math.max(1, Math.round(m*q)), tl = L ? 0.7 : 1, E = e.els;
  const ang = () => r()*Math.PI*2, j = s => (r() - 0.5)*2*s;
  const light = (t0, d, r0, r1, a, gr) => E.push({k:gr ? 'G' : 'L', t0, d, r0, r1, a});
  const ring = (kind, t0, d, r1, a) => { if (kind === 'rip' && (L || red || PG.saverOn())) return; E.push({k:'R', kind, t0, d:d*tl, r1, a}); };
  // fire lobes: born within rr of the spot, flung out up to `spread` and up by `rise`, growing from r0 to r1
  const fire = (cnt, rr, t0, t1, life, rise, spread, r0, r1, a = 1) => { for (let i = 0; i < n(cnt); i++){ const th = ang(), d0 = rr*Math.sqrt(r()), d1 = spread*(0.4 + 0.6*r());
    E.push({k:'F', t0:t0 + (t1 - t0)*r(), d:life*(0.75 + 0.5*r())*tl, x:Math.cos(th)*d0, y:Math.sin(th)*d0*0.6, dx:Math.cos(th)*d1, dy:Math.sin(th)*d1*0.6 - rise*(0.6 + 0.8*r()), r0:r0*(0.8 + 0.4*r()), r1:r1*(0.8 + 0.4*r()), a, v:r()*4 | 0}); } };
  // smoke lobes (o: w the share of the wind drift, sq a squash for smoke lying on the ground, p the spread's ease, fi/fo fade in/out, sf the
  // span of its life over which it goes soft, its edges blurring as it spreads; gas lies as a sheet and stays as it is)
  const smoke = (cnt, tone, rr, t0, t1, life, rise, spread, r0, r1, a, o = {}) => { for (let i = 0; i < n(cnt); i++){ const th = ang(), d0 = rr*Math.sqrt(r()), d1 = spread*(o.even ? Math.sqrt(0.08 + 0.92*r()) : 0.3 + 0.7*r());
    E.push({k:'S', tone, t0:t0 + (t1 - t0)*(o.late ? r()*r() : r()), d:life*(0.8 + 0.4*r())*tl, x:Math.cos(th)*d0, y:Math.sin(th)*d0*0.6, dx:Math.cos(th)*d1, dy:Math.sin(th)*d1*(o.sq ? 0.62 : 0.6) - rise*(0.7 + 0.6*r()),
      r0:r0*(0.8 + 0.4*r()), r1:r1*(0.8 + 0.4*r()), a:a*(0.8 + 0.3*r()), v:r()*4 | 0, w:o.w ?? 1, sq:o.sq || 1, p:o.p || 1.7, fi:o.fi || 0.12, fo:o.fo || 0.45, sf:tone === 'gas' ? null : o.sf || [0.12, 0.7]}); } };
  // sparks (hot) and debris: thrown out at up to sp world/s, falling at g world/s2
  const sparks = (cnt, sp, g, life, hot = true) => { if (red) return; for (let i = 0; i < n(cnt); i++){ const th = ang(), v = sp*(0.4 + 0.6*r()), up = sp*(0.25 + 0.85*r());
    E.push({k:hot ? 'K' : 'D', t0:40*r(), d:life*(0.6 + 0.6*r())*tl, vx:Math.cos(th)*v, vy:Math.sin(th)*v*0.55 - up, g}); } };
  const core = (d, r0, r1, rise, a = 1) => E.push({k:'F', t0:0, d:d*tl, x:0, y:0, dx:0, dy:-rise, r0, r1, a, v:r()*4 | 0});   // the fireball's main body
  const mush = (d, H, Rc, nc, ns) => E.push({k:'M', t0:0, d:d*tl, H, Rc, nc:n(nc), ns:n(ns), sd:r()*1e6 | 0});
  if (k === 'cm'){ light(0, 140, R*0.9, R*2.4, 1); light(0, 800, R*2, R*3.2, 0.5, true); ring('dust', 30, 1000, R*1.7, 0.32);
    core(560, R*0.5, R*1.0, R*0.3); fire(8, R*0.2, 0, 70, 700, R*0.4, R*0.42, R*0.36, R*0.8);
    smoke(6, 'dark', R*0.28, 140, 420, 4000, R*1.5, R*0.45, R*0.4, R*0.95, 0.86, {fi:0.06, fo:0.36, sf:[0.06, 0.45]});   // a small dark puff, rising and thinning, soft within a second or two
    sparks(12, R*7, R*15, 520); sparks(5, R*4.5, R*13, 750, false); }
  else if (k === 'bm'){ light(0, 220, R*1.1, R*3.2, 1); light(0, 1400, R*2.4, R*4, 0.6, true); ring('rip', 0, 950, R*3.8, 1); ring('shock', 0, 760, R*3.4, 0.28); ring('dust', 80, 3000, R*3.3, 0.6);
    smoke(7, 'dust', R*0.7, 160, 600, 3400, R*0.25, R*1.5, R*0.4, R*1.05, 0.42, {w:0.4, sq:0.58});
    core(1100, R*0.55, R*1.05, R*0.5); fire(14, R*0.28, 0, 130, 1300, R*0.65, R*0.48, R*0.4, R*0.9);
    if (!L) for (let i = 0, N = 16; i < N; i++){ const f = i/(N - 1); E.push({k:'S', tone:f < 0.2 ? 'dust' : 'dark', t0:180 + f*1000 + 80*r(), d:(6800 + 1600*r())*tl, x:j(R*0.18), y:-R*0.15, dx:j(R*0.28)*f, dy:-R*(0.3 + 4.1*f),
      r0:R*0.42, r1:R*(0.58 + 0.55*f)*(0.9 + 0.2*r()), a:0.78, v:r()*4 | 0, w:0.25 + 1.3*f, sq:1, p:1.35, fi:0.08, fo:0.55, sf:[0.65, 1]}); }   // the smoke column: lobes stacked to 4.4 R, widening up, leaning downwind (going soft late)
    else smoke(8, 'dark', R*0.3, 150, 500, 3600, R*1.7, R*0.6, R*0.4, R*1.0, 0.64);
    sparks(16, R*6, R*12, 800); sparks(7, R*4, R*10, 1000, false); }
  else if (k === 'chem'){ light(0, 130, R, R*2.4, 0.85); light(0, 600, R*1.5, R*2.4, 0.4, true); core(420, R*0.5, R*1.1, R*0.2); fire(4, R*0.2, 0, 50, 460, R*0.3, R*0.3, R*0.3, R*0.72); sparks(8, R*5, R*14, 460);
    smoke(2, 'dark', R*0.2, 120, 260, 1700, R*1.1, R*0.3, R*0.3, R*0.85, 0.5);
    const G = 10, life = L ? 15000 : 26000;   // the gas: a low, translucent sheet that spreads over about a province and a half, drifts with the wind and lingers
    smoke(10, 'gas', R*0.3, 40, 400, life*0.55, 0.4, G*0.4, R*1.2, 3, 0.6, {even:true, w:0.35, sq:0.6, p:2.2, fi:0.015, fo:0.45});   // the first cloud, rolling out of the burst
    smoke(30, 'gas', R*0.45, 250, 2600, life, -0.2, G, R*0.8, 5.4, 0.42, {even:true, late:true, w:0.5, sq:0.55, p:1.25, fi:0.1, fo:0.58});   // then spreading over the area,
    smoke(8, 'gas', R*0.5, 900, 3500, life*1.05, -0.1, G*0.7, 3, G*0.75, 0.3, {even:true, w:0.55, sq:0.5, p:1.15, fi:0.18, fo:0.6}); }   // a thin haze joining the lobes
  else if (k === 'tac'){ light(0, 340, R*2, R*9, 1); light(0, 2800, R*3, R*6.2, 0.85, true); ring('rip', 0, 1150, R*5.6, 1); ring('shock', 0, 900, R*5, 0.32); ring('shock', 140, 1350, R*6.6, 0.12); ring('dust', 160, 4400, R*3.7, 0.55);
    smoke(10, 'dust', R*1.1, 250, 900, 5200, R*0.35, R*2.3, R*0.5, R*1.3, 0.48, {w:0.4, sq:0.56}); mush(red ? 6000 : 10500, R*4, R*1.6, 18, 16); sparks(20, R*5, R*8, 1150); }
  else if (k === 'icbm'){ light(0, 520, R*2, R*7, 1); light(0, 5200, R*2.6, R*5.2, 0.9, true); ring('rip', 0, 1950, R*5.6, 1); ring('shock', 0, 1650, R*5, 0.32); ring('shock', 220, 2300, R*6.6, 0.12); ring('dust', 300, 7200, R*3.4, 0.6);
    smoke(14, 'dust', R*1.1, 300, 1300, 8000, R*0.35, R*2.6, R*0.5, R*1.4, 0.5, {w:0.4, sq:0.55}); mush(red ? 8000 : 15500, R*4.2, R*1.75, 22, 18); sparks(26, R*3.5, R*5, 1500); }
  else { const sz = k[2], big = sz === 'L', med = sz === 'M';   // combat blasts: infantry and drones (S), tanks and aircraft (M), ships and buildings (L)
    light(0, big ? 150 : 90, R*0.8, R*(big ? 2.2 : 1.8), 0.95); if (!e.sea || big) light(0, big ? 900 : 500, R*1.6, R*2.6, 0.45, true);
    core(big ? 650 : med ? 480 : 340, R*0.5, R*0.95, R*0.25); fire(big ? 9 : med ? 6 : 4, R*0.2, 0, 50, big ? 850 : med ? 600 : 400, R*0.3, R*0.38, R*0.32, R*0.75);
    if (big) fire(4, R*0.5, 200, 450, 620, R*0.4, R*0.4, R*0.25, R*0.6, 0.9);   // a secondary blast (magazine, fuel)
    sparks(big ? 14 : med ? 10 : 7, R*6, R*15, big ? 650 : 480); if (big || med) sparks(big ? 8 : 5, R*4, R*12, 800, false);
    if (e.sea) smoke(big ? 7 : 4, 'spray', R*0.25, 0, 120, 1500, R*1.7, R*0.45, R*0.3, R*0.8, 0.7, {w:0.2, p:2.2, fo:0.35});   // a white water plume
    smoke(big ? 5 : med ? 3 : 2, 'dark', R*0.3, 100, 320, big ? 3900 : med ? 2700 : 1900, R*(big ? 1.9 : 1.3), R*0.45, R*0.32, R*(big ? 1.15 : 0.95), big || med ? 0.6 : 0.72, {sf:[0.1, 0.6]}); }
  const rk = {G:0, R:1, S:2, M:3, F:4, K:5, D:5, L:6}; E.forEach((o, i) => { o.i = i; o.rk = o.kind === 'rip' ? -1 : rk[o.k] + (o.k === 'S' && o.sq === 1 ? 1 : 0); });   // (the ripple first: it bends the map only, not the blast's own light)
  E.sort((a, b) => a.rk - b.rk || a.i - b.i);   // ground light, rings, ground smoke and gas, then smoke and the cloud, fire over them, sparks, the flash on top
  let d = 0, ext = R*2, top = R; for (const o of E){ d = Math.max(d, o.t0 + o.d);
    if (o.k === 'S' || o.k === 'F'){ ext = Math.max(ext, Math.abs(o.x) + Math.abs(o.dx) + o.r1 + R*0.5); top = Math.max(top, -(o.y + o.dy) + o.r1); }
    else if (o.k === 'R' || o.k === 'L' || o.k === 'G') ext = Math.max(ext, o.r1 || 0, o.r1 || o.r0 || 0);
    else if (o.k === 'M'){ ext = Math.max(ext, o.Rc*1.8); top = Math.max(top, o.H + o.Rc*1.4); }
    else top = Math.max(top, R*4); }
  e.d = d; e.ext = ext*1.15; e.top = top*1.2; }
// the hard limit on the list (24): past it the entries already fading out go first (the ones soonest gone), then the oldest combat blasts; a
// live heavy effect (a strike, a mushroom cloud) is never cut (the caps keep at most 6 of them live, so the limit never reaches one)
function wfxTrim(keep){ const L = WFX.list; let over = L.length - 24; if (over <= 0) return;
  const dying = L.filter(q => q.die != null && q !== keep).sort((a, b) => a.die - b.die);
  for (const q of dying){ if (over <= 0) break; L.splice(L.indexOf(q), 1); over--; }
  for (let i = 0; i < L.length && over > 0; i++) if (!wfxHeavy(L[i].k) && L[i] !== keep){ L.splice(i--, 1); over--; } }
// ---- starting one: o.sea (a blast at sea: a water plume), o.force (start it even off screen: the developer buttons). Returns the effect or null
function wfxStart(k, wx, wy, o = {}){ if (!PG.booted || !S || !WFX_R[k] || !fxLv()) return null; wfxSync(); const now = performance.now(), R = WFX_R[k], heavy = wfxHeavy(k);
  const [sx, sy] = PG.toScreen(wx, wy), mg = Math.max(R*6*PG.view.s, 120); if (!o.force && (sx < -mg || sy < -mg || sx > PG.cw + mg || sy > PG.ch + mg*1.6)) return null;   // off screen: not started
  const live = WFX.list.filter(e => wfxHeavy(e.k) === heavy && e.die == null), cap = wfxCap(heavy);
  for (let i = 0; i <= live.length - cap; i++) live[i].die = now + 350;   // over the cap: the oldest fade out over 0.35 s
  const c = worldToCell(wx, wy), p = c >= 0 ? G.prov[c] : -1, e = {k, wx, wy, R, t0:now, id:++WFX.id, seed:(Math.random()*2**31) | 0, low:PG.SET.fx !== 'high', red:PG.afxReduced(), sea:o.sea ?? (p >= 0 && G.P[p].sea), night:fxNight(wx, wy), els:[]};
  wfxBuild(e); WFX.list.push(e); wfxTrim(e);
  if (k === 'icbm' || k === 'tac'){ const a = (k === 'icbm' ? 1 : 0.42)*(e.red ? 0.3 : 1);   // the flash: the whole map whitens (an ICBM) or a strong white veil (tactical)
    if (!WFX.flash || a > WFX.flash.a*(1 - (now - WFX.flash.t0)/WFX.flash.d)){ WFX.flash = {t0:now, d:k === 'icbm' ? (e.low ? 650 : 950) : 450, a}; wfxVeil(k === 'icbm' ? a*0.85 : 0, WFX.flash.d*0.8); } }
  if (k === 'icbm'){ WFX.burn.push({wx, wy, r:R*1.5, h0:S.hour + (S.speed && !S.over ? PG.acc : 0), life:10, seed:e.seed}); if (WFX.burn.length > 6) WFX.burn.shift(); }   // burning ground: ten game hours
  PG.redraw(); return e; }
// a strike: the effect, the crater and the burning city it leaves, the shake and the sound (o.p: the province hit)
function wfxStrike(k, wx, wy, o = {}){ const e = wfxStart(k, wx, wy, o), p = o.p ?? (() => { const c = worldToCell(wx, wy); return c >= 0 ? G.prov[c] : -1; })(), land = p >= 0 && !G.P[p].sea;
  if (land && k !== 'chem') afxCrater(wx, wy, k === 'cm' ? 3 : 3.5, {a:0.95, life:k === 'icbm' ? 160 : k === 'tac' ? 120 : 96, cap:3.5});
  if (land && k !== 'chem') afxMark(p, {cm:30, bm:48, tac:72, icbm:120}[k] || 24);
  if (e) bigShake(wx, wy, k); PG.sfx('boom'); return e; }   // (the shake: only for a big blast near the middle of the view, see bigShake)
const FXW = {cruise:(x, y, o) => wfxStrike('cm', x, y, o), ballistic:(x, y, o) => wfxStrike('bm', x, y, o), chemical:(x, y, o) => wfxStrike('chem', x, y, o),
  tactical:(x, y, o) => wfxStrike('tac', x, y, o), icbm:(x, y, o) => wfxStrike('icbm', x, y, o), blast:(size, x, y, o) => wfxStart('ex' + size, x, y, o)};
// ---- drawing (under the counters, after the small particles); the flash over everything at the end of the frame
// one sprite at (x, y) css px, radii rx, ry, alpha a, blend op; culled off screen; smoke (budget) is charged to the frame's fill budget
function wfxSpr(big, small, x, y, rx, ry, a, op, budget){ if (a < 0.004 || rx < 0.3 || x + rx < 0 || x - rx > PG.cw || y + ry < 0 || y - ry > PG.ch) return;
  if (budget){ if (WFX.area > WFX.bud) return; WFX.area += Math.min(2*rx, PG.cw)*Math.min(2*ry, PG.ch); }
  PG.ctx.globalAlpha = Math.min(1, a); PG.ctx.globalCompositeOperation = op || 'source-over'; PG.ctx.drawImage(small && rx*PG.dpr < 34 ? small : big, x - rx, y - ry, 2*rx, 2*ry); }
// a dense part of an effect drawn this frame (css px; rx, ry where it hides what lies under it, alpha a), kept in world units for the next
// frame's names (wfxCover), grouped per effect with the group's box
function wfxOcc(x, y, rx, ry, a){ const g = WFX.og; if (!g || rx < 2.5 || a < 0.25) return; const s = PG.view.s, wx = (x - PG.view.x)/s, wy = (y - PG.view.y)/s, qx = rx/s, qy = ry/s, B = g.b;
  g.o.push(wx, wy, qx, qy, Math.min(1, a)); if (wx - qx < B[0]) B[0] = wx - qx; if (wy - qy < B[1]) B[1] = wy - qy; if (wx + qx > B[2]) B[2] = wx + qx; if (wy + qy > B[3]) B[3] = wy + qy; }
// how much of a name centred at (x, y) css px, w wide, last frame's live blasts and clouds hide (0 clear .. 1 hidden), tested at its middle and
// near both ends: a name under a fireball or a thick smoke cloud fades out with it (and back as it thins), so the fire never reads as a decal
// under a crisp label. The gas sheet and the flashes hide nothing (the names show through them)
function wfxCover(x, y, w){ if (!WFX.list.length || !WFX.occ.length) return 0; const s = PG.view.s, wx = (x - PG.view.x)/s, wy = (y - PG.view.y)/s, hw = 0.35*w/s; let hid = 0;
  for (const px of [wx - hw, wx, wx + hw]){ let clr = 1;
    for (const g of WFX.occ){ const B = g.b, O = g.o; if (px < B[0] || px > B[2] || wy < B[1] || wy > B[3]) continue;
      for (let i = 0; i < O.length; i += 5){ const dx = (px - O[i])/O[i + 2], dy = (wy - O[i + 1])/O[i + 3], d = dx*dx + dy*dy; if (d < 1) clr *= 1 - O[i + 4]*wfxSm(1, 0.35, Math.sqrt(d)); } }
    hid = Math.max(hid, 1 - clr); }
  return hid; }
function wfxDrawOne(e, tau, now){ const ks = PG.view.s, kr = wfxKr(e), [bx, by] = PG.toScreen(e.wx, e.wy), nt = e.night > 0.5, WD = windSync(), fd = e.die != null ? Math.max(0, (e.die - now)/350) : 1;
  // (far out, where the floor kr > ks holds, the whole blast is drawn bigger about its spot: offsets and sizes alike, so its shape stays;
  // from the zoom where kr = ks every part sits on its own world spot. The gas sheet keeps its own, lower floor.)
  const kg = Math.max(ks, 5.5), sx = (s, k = kr) => bx + s*k, sy = (s, k = kr) => by + s*k; /*@TEST*/const dbg = WFX.dbg, dk = k => dbg && k === ks;/*@ENDTEST*/
  const og = WFX.og = {b:[Infinity, Infinity, -Infinity, -Infinity], o:[]};
  for (const o of e.els){ const t = tau - o.t0; if (t < 0 || t >= o.d) continue; const u = t/o.d, ts = t/1000;
    if (o.k === 'S'){ const gas = o.tone === 'gas', m = 1 - Math.pow(1 - u, o.p), dw = (o.w || 0)*e.R*0.12*ts, kk = gas ? kg : kr, x = sx(o.x + o.dx*m + WD.wx*dw, kk), y = sy(o.y + o.dy*m + WD.wy*dw, kk), rr = (o.r0 + (o.r1 - o.r0)*(1 - (1 - u)*(1 - u)))*kk;
      const a = fd*o.a*Math.min(1, u/o.fi)*(u > o.fo ? Math.pow((1 - u)/(1 - o.fo), 1.2) : 1);
      if (gas) wfxSpr(wfxGas(o.v, nt), wfxGas(o.v, nt, true), x, y, rr, rr*o.sq, a, 'source-over', true);
      else { const sv = o.sf ? wfxSm(o.sf[0], o.sf[1], u) : 0, c = a*(1 - sv);   // spreading smoke loses its edges: cross-faded into its blurred copy as it ages (the pair as dense as the one)
        if (c > 0.004) wfxSpr(wfxSmoke(o.tone, o.v, nt), wfxSmoke(o.tone, o.v, nt, true), x, y, rr, rr*o.sq, c, 'source-over', true);
        if (sv > 0.01) wfxSpr(wfxSmoke(o.tone, o.v, nt, false, true), wfxSmoke(o.tone, o.v, nt, true, true), x, y, rr, rr*o.sq, (a - c)/Math.max(0.01, 1 - c), 'source-over', true);
        wfxOcc(x, y, rr*0.78, rr*o.sq*0.78, a*(1 - 0.35*sv)); }
      /*@TEST*/if (dk(kk)) dbg.push([e.id + ':' + o.i, x, y, ks, PG.view.x, PG.view.y]);/*@ENDTEST*/ continue; }
    if (o.k === 'F'){ const m = 1 - Math.pow(1 - u, 2.4), x = sx(o.x + o.dx*m), y = sy(o.y + o.dy*m), rr = (o.r0 + (o.r1 - o.r0)*(1 - Math.pow(1 - u, 3)))*kr, at = fd*o.a*Math.min(1, u/0.06);
      wfxSpr(wfxFire(o.v), wfxFire(o.v, true), x, y, rr, rr, at*Math.pow(1 - u, 0.9), 'source-over'); wfxOcc(x, y, rr*0.8, rr*0.8, at*Math.pow(1 - u, 0.9));
      if (u > 0.18) wfxSpr(wfxSmoke('dark', o.v, nt), wfxSmoke('dark', o.v, nt, true), x, y - rr*0.1, rr*0.98, rr*0.98, at*0.9*Math.pow((u - 0.18)/0.82, 1.1)*Math.pow(1 - u, 0.35), 'source-over');   // cooling into smoke
      wfxSpr(wfxFire(o.v), wfxFire(o.v, true), x, y, rr*0.62, rr*0.62, at*0.85*Math.pow(1 - u, 2.5), 'lighter');   // the hot core
      /*@TEST*/if (dk(kr)) dbg.push([e.id + ':' + o.i, x, y, ks, PG.view.x, PG.view.y]);/*@ENDTEST*/ continue; }
    if (o.k === 'K' || o.k === 'D'){ const pt = s => [sx(o.vx*s), sy(o.vy*s + 0.5*o.g*s*s)], [x, y] = pt(ts), [x0, y0] = pt(Math.max(0, ts - 0.035)), l = Math.hypot(x - x0, y - y0) || 1, ml = Math.max(1.5, l);
      PG.ctx.globalAlpha = fd*(1 - u)*(o.k === 'K' ? 1 : 0.85); PG.ctx.globalCompositeOperation = o.k === 'K' ? 'lighter' : 'source-over'; PG.ctx.strokeStyle = o.k === 'K' ? (u < 0.4 ? '#ffe7b0' : '#ff9d4a') : '#1f1c19';
      PG.ctx.lineWidth = o.k === 'K' ? 1 : 1.3; PG.ctx.beginPath(); PG.ctx.moveTo(x - (x - x0)/l*ml, y - (y - y0)/l*ml); PG.ctx.lineTo(x, y); PG.ctx.stroke();
      /*@TEST*/if (dk(kr)) dbg.push([e.id + ':' + o.i, x, y, ks, PG.view.x, PG.view.y]);/*@ENDTEST*/ continue; }
    if (o.k === 'L' || o.k === 'G'){ const rr = (o.r0 + (o.r1 - o.r0)*Math.min(1, u*3))*kr, a = fd*o.a*(u < 0.04 ? u/0.04 : Math.pow(1 - u, o.k === 'L' ? 2 : 1.5))*(o.k === 'G' ? 0.45 + 0.55*e.night : 1);
      wfxSpr(o.k === 'L' ? WGLOW() : GLOW(), null, bx, by - (o.k === 'L' ? e.R*0.2*kr : 0), rr, rr*(o.k === 'G' ? 0.46 : 1), a, 'lighter'); continue; }
    if (o.k === 'R'){ const m = 1 - Math.pow(1 - u, o.kind === 'dust' ? 2.6 : 2.2), rr = o.r1*m*kr; if (rr < 1) continue;
      if (o.kind === 'rip'){ wfxRipple(bx, by, rr, Math.max(4, rr*0.09), 0.05*(1 - u)); continue; }
      if (o.kind === 'shock'){ const a = fd*o.a*Math.min(1, u/0.04)*Math.pow(1 - u, 1.3)*(1 - 0.45*e.night);   // the shock front: a soft pale band of raised dust, broken by noise, no line
        wfxSpr(wfxRing(false), null, bx, by, rr, rr*0.5, a*1.6, 'source-over', true); if (u < 0.3) wfxSpr(wfxRing(false), null, bx, by, rr, rr*0.5, a*0.5*(1 - u/0.3), 'lighter'); }
      else wfxSpr(wfxRing(true), null, bx, by, rr, rr*0.5, fd*o.a*Math.min(1, u/0.1)*Math.pow(1 - u, 1.2), 'source-over', true);
      continue; }
    if (o.k === 'M') wfxMush(e, o, t, bx, by, ks, kr, fd, nt); }
  PG.ctx.globalAlpha = 1; PG.ctx.globalCompositeOperation = 'source-over'; }
// the map under a shock front, bent: the band between two ellipses copied onto itself magnified by 1 + amp about the blast (High only)
function wfxRipple(x, y, rr, w, amp){ if (amp < 0.004 || PG.ctx !== PG.MCTX) return; const c = PG.ctx.canvas, d = PG.dpr, x0 = Math.max(0, Math.floor((x - rr - w)*d)), y0 = Math.max(0, Math.floor((y - (rr + w)*0.5)*d)),
    x1 = Math.min(c.width, Math.ceil((x + rr + w)*d)), y1 = Math.min(c.height, Math.ceil((y + (rr + w)*0.5)*d)); if (x1 - x0 < 4 || y1 - y0 < 4) return;
  const m = 1 + amp; PG.ctx.save(); PG.ctx.setTransform(1, 0, 0, 1, 0, 0); PG.ctx.beginPath(); PG.ctx.ellipse(x*d, y*d, (rr + w)*d, (rr + w)*0.5*d, 0, 0, Math.PI*2); PG.ctx.ellipse(x*d, y*d, Math.max(1, rr - w)*d, Math.max(1, rr - w)*0.5*d, 0, 0, Math.PI*2); PG.ctx.clip('evenodd');
  PG.ctx.globalAlpha = 0.9; PG.ctx.drawImage(c, x0, y0, x1 - x0, y1 - y0, x*d + (x0 - x*d)*m, y*d + (y0 - y*d)*m, (x1 - x0)*m, (y1 - y0)*m); PG.ctx.restore(); }
// the mushroom cloud: the fireball rises and spreads into a cap that rolls (a torus of lobes: up through the middle, down the outside, the
// far side drawn first), on a stem of dusty smoke wide at the foot; glowing orange at first, then brown-grey and pale, leaning downwind, fading
function wfxMush(e, o, t, bx, by, ks, kr, fd, nt){ const T = o.d, u = t/T, s = t/1000, R = e.R, rnd = mulberry(o.sd), fade = fd*(1 - wfxSm(0.55, 0.97, u));   // (it thins as a whole, without a long faint tail)
  // close in the cloud would leave the top of the screen: it is drawn smaller about its foot (which stays on its world spot), at most 55% of the map's height
  const fit = Math.min(1, PG.ch*0.55/((o.H + o.Rc*1.3)*kr)), k0 = kr === ks, kv = kr*fit; kr *= Math.sqrt(fit);   // (kv: the rise; kr: widths and sizes)
  const hc = o.H*(1 - Math.exp(-t/(T*0.16))), rc = R*0.72 + (o.Rc - R*0.72)*(1 - Math.exp(-t/(T*0.2))), heat = Math.exp(-t/(T*0.07)), warm = Math.exp(-t/(T*0.28)), WD = windSync(), sh = WD.wx*R*0.35*u*u;
  const X = v => bx + v*kr, Y = v => by + v*kv, Yc = d => by - hc*kv + d*kr; /*@TEST*/const dbg = fit === 1 && k0 && WFX.dbg;/*@ENDTEST*/   // (Yc: inside the cap, about its centre)
  const pale = wfxSm(0.35, 0.85, u)*0.45;   // the cloud pales from brown-grey towards light grey (a cross-fade, never all the way)
  // (the cloud is the effect's centrepiece: never cut by the frame's smoke budget, which would leave it full of holes; its lobe count is fixed)
  const puff = (tone, v, x, y, rx, ry, a) => { if (pale > 0 && tone === 'mush'){ wfxSpr(wfxSmoke('mush', v, nt), wfxSmoke('mush', v, nt, true), x, y, rx, ry, a*(1 - pale*0.6), 'source-over'); wfxSpr(wfxSmoke('light', v, nt), wfxSmoke('light', v, nt, true), x, y, rx, ry, a*pale, 'source-over'); }
    else wfxSpr(wfxSmoke(tone, v, nt), wfxSmoke(tone, v, nt, true), x, y, rx, ry, a, 'source-over'); };
  // the stem: from the ground up to under the cap, once the cap has lifted off it: one continuous column of column-shaded puffs drawn taller
  // than wide, each overlapping its neighbours several times on every effects level (no beads), narrow in the middle, flared into the dust
  // skirt at its foot (round there)
  const ns = Math.max(12, o.ns), stem = (tone, v, x, y, rx, ry, a) => { const P = (tn, aa) => wfxSpr(wfxStemP(tn, v, nt), wfxStemP(tn, v, nt, true), x, y, rx, ry, aa, 'source-over');
    if (pale > 0 && tone === 'mush'){ P('mush', a*(1 - pale*0.6)); P('light', a*pale); } else P(tone, a); wfxOcc(x, y, rx*0.75, ry*0.8, a); };
  for (let k = 0; k < ns; k++){ const f = (k + 0.5)/ns, h = hc*f*0.92, rs = R*(0.3 + 0.8*Math.pow(1 - f, 4) + 0.3*wfxSm(0.72, 1, f) + 0.03*Math.sin(k*1.7 + s*0.6)), a = fade*0.86*wfxSm(R*0.4, R*1.2, hc*f), v = (k + (o.sd & 3)) & 3;
    const x = X(sh*f*f + Math.sin(s*0.7 + k*1.3)*rs*0.05), y = Y(-h), tone = f < 0.28 ? 'dust' : 'mush', rx = rs*kr*1.25*(0.88 + 0.24*fxh(o.sd + k*7)), ry = rx*(1 + 0.8*wfxSm(0.1, 0.4, f));
    stem(tone, v, x, y, rx, ry, a);
    if (warm > 0.05 && f > 0.4) wfxSpr(wfxFire(v), wfxFire(v, true), x, y, rs*kr*0.7, rs*kr*0.7*ry/rx, fade*0.45*warm*f*Math.min(1, 14/ns), 'lighter');
    /*@TEST*/if (dbg) dbg.push([e.id + ':m' + k, x, y, ks, PG.view.x, PG.view.y]);/*@ENDTEST*/ }
  const cx = X(sh), cy = Yc(0), ca = fade*(1 - heat*0.6);
  // the cap's body first: broad overlapping masses (its shadowed underside, then its middle), so the rolling lobes over it read as one cloud
  puff('grey', (o.sd >> 3) & 3, cx, Yc(rc*0.26), rc*kr*1.02, rc*kr*0.42, ca*0.95);
  for (let j = -1; j <= 1; j++) puff('mush', (j + 2 + (o.sd & 1)) & 3, X(sh + j*rc*0.42), Yc(-rc*0.08 + Math.abs(j)*rc*0.06), rc*kr*(j ? 0.66 : 0.82), rc*kr*(j ? 0.5 : 0.6), ca);
  wfxOcc(cx, Yc(0), rc*kr*0.95, rc*kr*0.55, ca*0.95);
  // the rolling torus: lobes round its rim (up through the middle, down the outside), the far side first; no lobe strays off the cap
  const L = [], rho = rc*0.6, rm = rc*0.3, om = -0.42;
  for (let j = 0; j < o.nc; j++){ const th = j/o.nc*Math.PI*2 + (rnd() - 0.5)*0.18, ph = rnd()*Math.PI*2 + s*om*(0.9 + 0.2*rnd()), lr = rc*0.4*(0.92 + 0.16*rnd()), v = rnd()*4 | 0;
    const rad = rho + rm*Math.cos(ph)*0.7, z = rad*Math.sin(th); L.push({x:rad*Math.cos(th), y:-rm*Math.sin(ph)*0.5 - z*0.24, z, lr:lr*(1 + 0.08*Math.sin(ph)), up:Math.sin(ph), v, id:j}); }
  for (let j = 0; j < 5; j++){ const a0 = j/5*Math.PI*2 + rnd()*0.5, d0 = (0.2 + 0.5*rnd())*rho, z = d0*Math.sin(a0); L.push({x:d0*Math.cos(a0), y:-rm*(0.75 + 0.2*rnd()) - z*0.2, z, lr:rc*(0.36 + 0.06*rnd()), up:1, v:j & 3, id:'d' + j}); }   // its dome
  L.sort((a, b) => b.z - a.z);
  for (const q of L){ const x = X(q.x + sh), y = Yc(q.y), lr = q.lr*kr, lit = q.up > -0.3;
    puff(lit ? 'mush' : 'grey', q.v, x, y, lr, lr*0.9, ca*0.95); wfxOcc(x, y, lr*0.75, lr*0.68, ca*0.95);
    if (heat > 0.02) wfxSpr(wfxFire(q.v), wfxFire(q.v, true), x, y, lr*1.05, lr*1.05, fade*Math.min(1, heat*1.4), 'source-over');
    if (warm > 0.04 && !lit) wfxSpr(wfxFire(q.v), wfxFire(q.v, true), x, y, lr*0.7, lr*0.7, fade*0.5*warm, 'lighter');   // the underside still glows from the fire below
    /*@TEST*/if (dbg) dbg.push([e.id + ':c' + q.id, x, y, ks, PG.view.x, PG.view.y]);/*@ENDTEST*/ }
  if (warm > 0.05) wfxSpr(GLOW(), null, cx, Yc(rc*0.3), rc*kr*1.1, rc*kr*0.5, fade*0.55*warm, 'lighter');   // the fire under the cap lights it from below
  if (heat > 0.03){ const fr = rc*1.05*kr; wfxSpr(wfxFire((o.sd >> 2) & 3), wfxFire((o.sd >> 2) & 3, true), cx, cy, fr, fr*0.92, fade*Math.min(1, heat*1.6), 'source-over');   // the fireball's body,
    wfxSpr(wfxFire(o.sd & 3), wfxFire(o.sd & 3, true), cx, cy, rc*kr*0.75, rc*kr*0.7, fade*heat*0.9, 'lighter'); } }   // its white-hot heart
// the ground still burning after an ICBM: a charred patch (multiplied in) with fires flickering over it and wisps of smoke, on the paused game
// clock (still while paused); it fades over its game hours. Returns whether one is on screen
function wfxDrawBurn(){ const h0 = S.hour + (S.speed && !S.over ? PG.acc : 0), gt = PG.FXQ.gt, ks = PG.view.s; let on = false;
  for (let i = WFX.burn.length - 1; i >= 0; i--){ const B = WFX.burn[i], age = h0 - B.h0; if (age > B.life || age < -1){ WFX.burn.splice(i, 1); continue; }
    const f = Math.max(0, 1 - age/B.life), [x, y] = PG.toScreen(B.wx, B.wy), rr = Math.max(B.r*ks, 10); if (x + rr < 0 || x - rr > PG.cw || y + rr*1.6 < 0 || y - rr*0.6 > PG.ch) continue; on = true;
    const ni = fxNight(B.wx, B.wy), rnd = mulberry(B.seed), fl = Math.pow(f, 0.6);
    wfxSpr(wfxScorch(), null, x, y, rr, rr*0.55, 0.85*Math.min(1, f*2), 'multiply');
    for (let k = 0, nk = PG.SET.fx !== 'high' ? 14 : 30; k < nk; k++){ const a0 = rnd()*Math.PI*2, d0 = Math.sqrt(rnd())*0.8, fx0 = x + Math.cos(a0)*d0*rr, fy0 = y + Math.sin(a0)*d0*rr*0.52, fs = Math.max(1.8, B.r*ks*(0.022 + 0.03*rnd())), ph = rnd()*7;
      const fk = 0.6 + 0.4*Math.sin(gt/90 + ph)*Math.sin(gt/53 + ph*1.3); if (rnd() > fl*1.1) continue;
      wfxSpr(GLOW(), null, fx0, fy0, fs*4.2, fs*2, (0.14 + 0.32*ni)*fl*fk, 'lighter'); wfxSpr(wfxFire(k & 3), wfxFire(k & 3, true), fx0, fy0 - fs*0.6, fs, fs*1.6, 0.9*fl*fk, 'source-over');
      wfxSpr(wfxFire(k & 3), wfxFire(k & 3, true), fx0, fy0 - fs*0.45, fs*0.62, fs*1.05, 0.75*fl*fk, 'lighter');   // the hot heart of the flame
      /*@TEST*/if (WFX.dbg) WFX.dbg.push(['b' + i + ':' + k, fx0, fy0, ks, PG.view.x, PG.view.y]);/*@ENDTEST*/ }
    for (let k = 0; k < 6; k++){ const P = 7000, cyc = gt/P + k/6, c = Math.floor(cyc), w = cyc - c, hh = fxh(B.seed + c*131 + k*17), hv = fxh(B.seed + c*71 + k*29), a0 = hh*Math.PI*2, d0 = Math.sqrt(hv)*0.7;
      const wx0 = B.wx + Math.cos(a0)*d0*B.r, wy0 = B.wy + Math.sin(a0)*d0*B.r*0.52, sr = B.r*(0.1 + 0.22*w), WD = windSync();
      const px = PG.wrapSX((wx0 + WD.wx*B.r*0.35*w)*ks + PG.view.x), py = (wy0 - B.r*0.75*w)*ks + PG.view.y, a = 0.55*fl*Math.min(1, w/0.15)*Math.pow(1 - w, 1.2);
      wfxSpr(wfxSmoke('dark', k & 3, ni > 0.5), wfxSmoke('dark', k & 3, ni > 0.5, true), px, py, Math.max(3, sr*ks), Math.max(3, sr*ks), a, 'source-over', true); } }
  PG.ctx.globalAlpha = 1; PG.ctx.globalCompositeOperation = 'source-over'; return on; }
function drawWFX(now){ wfxSync(); if (!WFX.list.length && !WFX.burn.length) return; const t0 = /*@TEST*/WFX.fz ||/*@ENDTEST*/ now;
  WFX.area = 0; WFX.bud = (PG.SET.fx !== 'high' ? 3 : 5)*PG.cw*PG.ch*Math.max(0.5, FXG.k); PG.ctx.save(); PG.ctx.setTransform(PG.dpr, 0, 0, PG.dpr, 0, 0);
  const burn = WFX.burn.length ? wfxDrawBurn() : false, occ = []; let run = false;
  for (let i = 0; i < WFX.list.length; i++){ const e = WFX.list[i], tau = Math.max(0, t0 - e.t0); if (tau >= e.d || (e.die != null && now >= e.die)){ WFX.list.splice(i--, 1); continue; }
    const [x, y] = PG.toScreen(e.wx, e.wy), kr = wfxKr(e), ex = e.ext*kr, up = e.top*kr; if (x + ex < 0 || x - ex > PG.cw || y + ex*0.6 < 0 || y - up > PG.ch) continue;   // off screen: not drawn (its clock runs on)
    run = true; wfxDrawOne(e, tau, now); if (WFX.og.o.length) occ.push(WFX.og); }
  WFX.occ = occ; WFX.og = null;   // (what this frame's effects hide: the next frame's names fade under it)
  PG.ctx.restore(); if (run) PG.animFast(); else if (burn && S.speed && !S.over) PG.animAmb(); }
// (the veil fades on its own clock, so it can never stay up when the map stops drawing: a menu, the globe, the tab hidden)
function wfxVeil(a, d){ let v = WFX.veil; if (!v){ if (!(a > 0)) return; v = WFX.veil = document.createElement('div'); v.id = 'wfxveil'; v.setAttribute('aria-hidden', 'true');
    v.style.cssText = 'position:fixed;inset:0;background:#fffaf0;pointer-events:none;z-index:2147483000;opacity:0'; document.body.appendChild(v); }
  try { if (v.an) v.an.cancel(); v.an = null; if (a > 0 && v.animate) v.an = v.animate([{opacity:a}, {opacity:a, offset:0.05}, {opacity:0}], {duration:d, easing:'ease-in'}); } catch (e) {} }
function drawWFXFlash(now){ const F = WFX.flash; if (!F) return; const k = Math.max(0, ((/*@TEST*/WFX.fz ||/*@ENDTEST*/ now) - F.t0)/F.d); if (k >= 1){ WFX.flash = null; return; }
  const a = F.a*(k < 0.05 ? 1 : Math.pow(1 - (k - 0.05)/0.95, 2.2));
  PG.ctx.save(); PG.ctx.setTransform(1, 0, 0, 1, 0, 0); PG.ctx.globalCompositeOperation = 'source-over'; PG.ctx.globalAlpha = a; PG.ctx.fillStyle = '#fffaf0'; PG.ctx.fillRect(0, 0, PG.ctx.canvas.width, PG.ctx.canvas.height); PG.ctx.restore();
  PG.animFast(); }
let VOLA = 1;   // the fade-in of the figures firing (figVolley: their alpha as they appear), stored on their shots
function shoot(kind, from, to, opt = {}){ const pr = projGet(); if (!pr) return; Object.assign(pr, {sn:++PRSN, kind, from, to, u:opt.ws ? 1 : kzNow()/PG.view.s, ws:!!opt.ws, hit:opt.hit, t0:performance.now() + (opt.delay || 0), dur:opt.dur || 400, arc:opt.arc || 0, big:opt.big || 1, last:0, lite:!!opt.lite, a:VOLA, fz:opt.fz || 1, dots:!!opt.dots}); }   // (ws: from, to and arc in world px: world-sized, like the figures that fire it)
let lastPart = 0, PKZ = 1; const PRJEND = [];
// battle effects in two passes. drawParticlesUnder runs before the counters (scorch, wreck fires, smoke, fire, flashes, rings, dust, the night
// ground glow and the art bursts and puffs: the plates always sit on top of them); drawParticlesOver runs after them, clipped off every plate
// (tracers, shells and missiles in flight, muzzle stars, sparks and debris). PART is advanced once per frame, in the first pass.
function drawParticlesUnder(now){
  const dt = /*@TEST*/WFX.fz ? 0 :/*@ENDTEST*/ Math.min(0.1, (now - (lastPart || now))/1000); lastPart = now;
  const kz = PKZ = Math.max(0.6, Math.min(2, PG.view.s*HS0/12))*PG.zx();
  // scorch marks on the ground fade over 20 s
  for (let i = SCORCH.length - 1; i >= 0; i--){ const sc0 = SCORCH[i], age = now - sc0.t0; if (age > 20000){ SCORCH.splice(i, 1); continue; }
    const [x, y] = PG.toScreen(sc0.wx, sc0.wy), r = sc0.r*kz; PG.ctx.globalAlpha = 0.5*(1 - age/20000); PG.ctx.fillStyle = '#16120e'; PG.ctx.beginPath(); PG.ctx.ellipse(x, y, r, r*0.5, 0, 0, Math.PI*2); PG.ctx.fill(); }
  PG.ctx.globalAlpha = 1;
  // wrecks: their smoke plume and fire are drawn by drawBattleSmoke (world-anchored, for 26 s)
  for (let i = WRECKS.length - 1; i >= 0; i--) if (now - WRECKS[i].t0 > 26000) WRECKS.splice(i, 1);
  // particles (sparks and debris are drawn by drawParticlesOver)
  let nl = 0;   // night light pass: at most 24 ground glows per frame
  for (let i = PART.length - 1; i >= 0; i--){ const q = PART[i]; q.t += dt*1000; if (q.t >= q.life || (q.die != null && q.t >= q.die)){ partDrop(i); continue; }
    const k = q.t/q.life, fd = q.die != null ? Math.min(1, Math.max(0, (q.die - q.t)/300)) : 1; q.ox += q.vx*dt; q.oy += q.vy*dt;
    if (q.kind === 'debris'){ q.vy += (q.ws ? q.g || 20 : 220)*dt; } else if (q.kind === 'smoke' || q.kind === 'smokel'){ q.vx *= 0.99; q.vy *= 0.985; }
    const f = q.ws ? PG.view.s : kzF(q, kz), [bx, by] = PG.toScreen(q.wx, q.wy), x = bx + q.ox*f, y = by + q.oy*f, sz = (q.s0 + (q.s1 - q.s0)*k)*(q.ws ? PG.view.s : kzS(f, kz));   // (ws: a world-sized particle: offsets, speeds and sizes in world px)
    if (x < -60 || y < -60 || x > PG.cw + 60 || y > PG.ch + 60) continue;
    /*@TEST*/if (WFX.dbg) WFX.dbg.push(['p' + (q.id || (q.id = ++WFX.id)), x, y, PG.view.s, PG.view.x, PG.view.y]);/*@ENDTEST*/
    if (q.kind === 'smoke' || q.kind === 'smokel'){ if (!fxBudget(sz*sz*4)) continue; PG.ctx.globalAlpha = fd*0.55*(k < 0.12 ? k/0.12 : 1 - (k - 0.12)/0.88); PG.ctx.drawImage(rotSpr(q.kind === 'smoke' ? SMOKE(q) : SMOKEL(q), q.rot), x - sz, y - sz, sz*2, sz*2); }
    else if (q.kind === 'core'){ PG.ctx.globalCompositeOperation = 'lighter'; PG.ctx.globalAlpha = 0.9*fd*(1 - k*k); PG.ctx.drawImage(PG.BCORE(), x - sz, y - sz, sz*2, sz*2); PG.ctx.globalCompositeOperation = 'source-over'; }
    else if ((q.kind === 'fire' || q.kind === 'flash') && nl < 24){ const nq = fxNight(q.wx ?? 0, q.wy ?? 0); if (nq > 0.2){ nl++; PG.ctx.globalCompositeOperation = 'lighter'; PG.ctx.globalAlpha = fd*0.18*(1 - k)*nq; PG.ctx.drawImage(GLOW(), x - sz*3.2, y - sz*2.2, sz*6.4, sz*4.4); PG.ctx.globalCompositeOperation = 'source-over'; } }   // fire lights the ground at night
    if (q.kind === 'fire' || q.kind === 'flash'){ PG.ctx.globalCompositeOperation = 'lighter'; PG.ctx.globalAlpha = fd*(1 - k); PG.ctx.drawImage(q.kind === 'flash' ? GLOW() : FIRE(), x - sz, y - sz, sz*2, sz*2); PG.ctx.globalCompositeOperation = 'source-over'; }
    else if (q.kind === 'splash'){ const sp = Math.sin(Math.min(1, k*1.25)*Math.PI), hh = sz*3.2*sp, ww = sz*(0.7 + 0.5*k); if (hh > 0.5){ PG.ctx.globalAlpha = fd*0.85*(1 - k*k);   // white water: a plume that climbs and falls back
        PG.ctx.drawImage(FOAM(), x - ww, y - hh, ww*2, hh + ww*0.5); PG.ctx.drawImage(FOAM(), x - ww*1.3, y - ww*0.45, ww*2.6, ww*0.9); } }
    else if (q.kind === 'ring'){ PG.ctx.globalAlpha = fd*0.8*(1 - k); PG.ctx.strokeStyle = 'rgb(120,104,84)'; PG.ctx.lineWidth = 1 + 1.5*(1 - k); PG.ctx.beginPath(); PG.ctx.ellipse(x, y, sz, sz*0.45, 0, 0, Math.PI*2); PG.ctx.stroke(); }
    else if (q.kind === 'dust' && !q.tn){ if (!fxBudget(sz*sz*2.4)) continue; PG.ctx.globalAlpha = fd*0.32*(k < 0.1 ? k/0.1 : 1 - k); const im = rotSpr(puffSprite(q.v, false), q.rot, 0.6), fx = im.fx || 1, fy = im.fy || 1; PG.ctx.drawImage(im, x - sz*fx, y - sz*fy, sz*2*fx, sz*2*fy); }   // (squashed in its own frame, then turned)   // (march dust is drawn under the figures by drawTrailDust)
  }
  PG.ctx.globalAlpha = 1;
  drawArtFx(/*@TEST*/WFX.fz ||/*@ENDTEST*/ now, kz);
  // muzzle stars (45 ms): under the counters, so a star on a plate's rim is never cut into a bar by the plate clip of the pass over them
  for (let i = MUZZ.length - 1; i >= 0; i--){ const m0 = MUZZ[i], age = now - m0.t0; if (age > 45 && m0.dr){ MUZZ.splice(i, 1); continue; } m0.dr = 1;   // (each star is drawn at least once, also on a slow frame)
    { const [x, y] = PG.toScreen(m0.wx, m0.wy), L0 = m0.wl ? Math.max(2, m0.wl*PG.view.s*0.6) : 9*m0.big*kz, k3 = Math.max(0.35, 1 - age/45)*(m0.a ?? 1), Lg = L0; PG.ctx.save(); PG.ctx.globalCompositeOperation = 'lighter'; PG.ctx.globalAlpha = k3; PG.ctx.drawImage(GLOW(), x - Lg, y - Lg, Lg*2, Lg*2);
      PG.ctx.translate(x, y); PG.ctx.rotate(m0.ang); PG.ctx.fillStyle = 'rgba(255,214,140,.9)'; PG.ctx.beginPath(); PG.ctx.moveTo(0, -1.2); PG.ctx.lineTo(L0*1.4, 0); PG.ctx.lineTo(0, 1.2); PG.ctx.closePath(); PG.ctx.fill(); PG.ctx.restore(); continue; }
    const [x, y] = PG.toScreen(m0.wx, m0.wy), L0 = 10*m0.big*kz; PG.ctx.save(); PG.ctx.globalCompositeOperation = 'lighter'; PG.ctx.translate(x, y); PG.ctx.rotate(m0.ang); PG.ctx.fillStyle = 'rgba(255,226,150,.95)';
    for (const [a0, len] of [[0, 1], [0.7, 0.55], [-0.7, 0.55]]){ PG.ctx.beginPath(); PG.ctx.moveTo(0, 0); PG.ctx.lineTo(Math.cos(a0 - 0.12)*L0*len, Math.sin(a0 - 0.12)*L0*len); PG.ctx.lineTo(Math.cos(a0)*L0*len*1.4, Math.sin(a0)*L0*len*1.4); PG.ctx.lineTo(Math.cos(a0 + 0.12)*L0*len, Math.sin(a0 + 0.12)*L0*len); PG.ctx.closePath(); PG.ctx.fill(); }
    PG.ctx.restore(); }
  PG.ctx.globalAlpha = 1;
}
function drawParticlesOver(now){
  const kz = PKZ;
  // projectiles
  const ENDQ = PRJEND; ENDQ.length = 0;
  for (let i = PROJ.length - 1; i >= 0; i--){ const pr = PROJ[i], k = (now - pr.t0)/pr.dur; if (k < 0) continue;   // (a burst's later rounds wait)
    if (pr.v2){ const kc = pr.cut != null ? Math.min(k, pr.cut) : k; prEvents(pr, Math.min(1, kc)); if (k >= 1 || (pr.cut != null && k >= pr.cut)){ const L = PROJ.length - 1; if (i < L) PROJ[i] = PROJ[L]; PROJ.pop(); ENDQ.push(pr); continue; } prDraw(pr, k, now); continue; }
    const [fx0, fy0] = PG.toScreen(pr.from[0], pr.from[1]), [tx0, ty0] = PG.toScreen(pr.to[0], pr.to[1]);
    if (k >= 1){ { const L = PROJ.length - 1; if (i < L) PROJ[i] = PROJ[L]; PROJ.pop(); ENDQ.push(pr); } if (pr.hit === 'kick') kick(pr.to[0], pr.to[1]); else if (pr.hit) bfxHit(pr.to[0], pr.to[1], pr.hit); else if (pr.kind === 'shell' || pr.kind === 'missile') explode(pr.to[0], pr.to[1], pr.big, false, pr.lite, pr.fz || 1); else if (pr.kind === 'tracer') emit('spark', pr.to[0], pr.to[1], {s0:2.5, s1:1, life:250}); continue; }
    const ak = pr.arc*kzF(pr, kz), x = fx0 + (tx0 - fx0)*k, y = fy0 + (ty0 - fy0)*k - Math.sin(k*Math.PI)*ak; PG.ctx.globalAlpha = pr.a ?? 1;
    if (pr.kind === 'tracer' && pr.dots){ const an = Math.atan2(ty0 - fy0, tx0 - fx0), x2 = x - Math.cos(an)*Math.max(2.5, 0.45*PG.view.s), y2 = y - Math.sin(an)*Math.max(2.5, 0.45*PG.view.s), r = Math.max(0.8, 0.07*PG.view.s);   // a rifle burst: small tracer dots
      PG.ctx.fillStyle = 'rgba(255,226,150,.95)'; PG.ctx.beginPath(); PG.ctx.arc(x, y, r, 0, Math.PI*2); PG.ctx.arc(x2, y2, r, 0, Math.PI*2); PG.ctx.fill(); }
    else if (pr.kind === 'tracer'){ const tl = pr.ws ? Math.min(0.4, 1.3/(Math.hypot(pr.to[0] - pr.from[0], pr.to[1] - pr.from[1]) || 1)) : 0.18, x2 = fx0 + (tx0 - fx0)*Math.max(0, k - tl), y2 = fy0 + (ty0 - fy0)*Math.max(0, k - tl);   // (a figure's tracer: a short streak, about 1.3 world px)
      PG.ctx.strokeStyle = 'rgba(255,225,140,.9)'; PG.ctx.lineWidth = pr.ws ? Math.max(0.8, Math.min(1.6, 0.07*PG.view.s)) : 1.2*Math.min(1.8, Math.sqrt(kz)); PG.ctx.lineCap = 'round'; PG.ctx.beginPath(); PG.ctx.moveTo(x2, y2); PG.ctx.lineTo(x, y); PG.ctx.stroke(); PG.ctx.lineCap = 'butt'; }
    else { if (pr.kind === 'missile' && now - pr.last > 30){ pr.last = now; const [wx, wy] = PG.screenToWorld(x, y); emit('smokel', wx, wy, {vx:(Math.random() - 0.5)*4, vy:-2, s0:4, s1:14, life:1300}); }
      const kb = Math.max(0, k - 0.07), xb = fx0 + (tx0 - fx0)*kb, yb = fy0 + (ty0 - fy0)*kb - Math.sin(kb*Math.PI)*ak;
      PG.ctx.save(); PG.ctx.globalCompositeOperation = 'lighter'; PG.ctx.strokeStyle = pr.kind === 'missile' ? 'rgba(255,190,120,.9)' : 'rgba(255,236,190,.95)'; PG.ctx.lineWidth = pr.kind === 'missile' ? 1.6 : 1.2; PG.ctx.beginPath(); PG.ctx.moveTo(xb, yb); PG.ctx.lineTo(x, y); PG.ctx.stroke();
      PG.ctx.globalAlpha = 0.6*(pr.a ?? 1); PG.ctx.drawImage(GLOW(), x - 4, y - 4, 8, 8); PG.ctx.restore(); } }
  PG.ctx.globalAlpha = 1;
  for (const pr of ENDQ){ if (pr.v2) try { prEnd(pr); } catch (e){ console.error(e); } } for (const pr of ENDQ) PRFREE.push(pr); ENDQ.length = 0;   // (back to the pool only now: an end may start new shots)
  // sparks and debris (draw only: drawParticlesUnder advanced and pruned them)
  for (const q of PART){ if (q.kind !== 'spark' && q.kind !== 'debris') continue; const k = q.t/q.life; if (k >= 1) continue;
    const f = q.ws ? PG.view.s : kzF(q, kz), zs = q.ws ? PG.view.s : kzS(f, kz), fd = q.die != null ? Math.min(1, Math.max(0, (q.die - q.t)/300)) : 1, [bx, by] = PG.toScreen(q.wx, q.wy), x = bx + q.ox*f, y = by + q.oy*f, sz = (q.s0 + (q.s1 - q.s0)*k)*zs;
    if (x < -60 || y < -60 || x > PG.cw + 60 || y > PG.ch + 60) continue;
    /*@TEST*/if (WFX.dbg) WFX.dbg.push(['p' + (q.id || (q.id = ++WFX.id)), x, y, PG.view.s, PG.view.x, PG.view.y]);/*@ENDTEST*/
    const sp = q.kind === 'spark', ln = q.ws ? Math.max(sp ? 1.5 : 2, Math.hypot(q.vx, q.vy)*0.03*zs) : Math.max(sp ? 1.5 : 2, Math.hypot(q.vx, q.vy)*0.03)*zs, vl = Math.hypot(q.vx, q.vy) || 1;   // a streak from p - v*0.03 s to p (at least 1.5-2 px)
    PG.ctx.globalAlpha = fd*(1 - k); PG.ctx.strokeStyle = sp ? '#ffd27a' : '#2a2a26'; PG.ctx.lineWidth = sp ? 1 : Math.max(1, Math.min(1.5, sz*0.9)); PG.ctx.lineCap = 'round';
    if (sp) PG.ctx.globalCompositeOperation = 'lighter'; PG.ctx.beginPath(); PG.ctx.moveTo(x - q.vx/vl*ln, y - q.vy/vl*ln); PG.ctx.lineTo(x, y); PG.ctx.stroke(); if (sp) PG.ctx.globalCompositeOperation = 'source-over'; }
  PG.ctx.globalAlpha = 1; PG.ctx.lineCap = 'butt';
}
// the plates of last frame's counters (AFX.avoid, screen boxes with each battle badge) and a spot moved off them: bursts and smoke are
// drawn under the counters, so a spot on a plate would be hidden; it goes just past the nearest edge (pad + 2-8 px), at most 3 moves
function fxOff(wx, wy, pad = 4){ const R = AFX.avoid; if (!R || !R.length) return [wx, wy]; let [x, y] = PG.toScreen(wx, wy), moved = false;
  for (let t = 0; t < 4; t++){ const r = R.find(r => x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad); if (!r) return moved ? PG.screenToWorld(x, y) : [wx, wy]; if (t === 3) break;
    const j = 2 + Math.random()*6, dl = x - r.x + pad, dr = r.x + r.w + pad - x, du = y - r.y + pad, dd = r.y + r.h + pad - y, m = Math.min(dl, dr, du, dd); moved = true;
    if (m === dl) x = r.x - pad - j; else if (m === dr) x = r.x + r.w + pad + j; else if (m === du) y = r.y - pad - j; else y = r.y + r.h + pad + j; }
  return [wx, wy]; }
// the screen boxes effects keep off: each plate (as counter() returns it) and its battle badge, which sits just off the plate's corner
const plateBoxes = hs => { const out = []; for (const h of hs){ out.push(h); if (h.bg) out.push(h.bg); } return out; };
// the clip that keeps effects off the plates: the screen minus the union of the boxes (pad 3 px), cut into disjoint pixel-aligned rects so
// that overlapping plates stay holes under 'evenodd'
function plateClip(rs){ const P = new Path2D(); P.rect(0, 0, PG.cw, PG.ch); if (!rs.length) return P;
  const R = []; for (const r of rs){ const x0 = Math.floor((r.x - 3)*PG.dpr)/PG.dpr, x1 = Math.ceil((r.x + r.w + 3)*PG.dpr)/PG.dpr, y0 = Math.floor((r.y - 3)*PG.dpr)/PG.dpr, y1 = Math.ceil((r.y + r.h + 3)*PG.dpr)/PG.dpr;
    if (x1 < 0 || y1 < 0 || x0 > PG.cw || y0 > PG.ch) continue; R.push([Math.max(0, x0), Math.max(0, y0), Math.min(PG.cw, x1), Math.min(PG.ch, y1)]); }
  if (!R.length) return P; const xs = [...new Set(R.flatMap(r => [r[0], r[2]]))].sort((a, c) => a - c);
  for (let i = 0; i + 1 < xs.length; i++){ const a0 = xs[i], a1 = xs[i + 1], iv = []; for (const r of R) if (r[0] <= a0 && r[2] >= a1) iv.push([r[1], r[3]]); if (!iv.length) continue;
    iv.sort((p, q) => p[0] - q[0]); let c0 = iv[0][0], c1 = iv[0][1];
    for (let j = 1; j <= iv.length; j++){ if (j < iv.length && iv[j][0] <= c1){ c1 = Math.max(c1, iv[j][1]); continue; } P.rect(a0, c0, a1 - a0, c1 - c0); if (j < iv.length){ c0 = iv[j][0]; c1 = iv[j][1]; } } }
  return P; }
let PLATECLIP = null, PLATEBOX = null;   // the clip is built from this frame's plate boxes on first use
const plateClipOn = () => { if (!PLATECLIP && PLATEBOX){ PLATECLIP = plateClip(PLATEBOX); PLATEBOX = null; } if (PLATECLIP) PG.ctx.clip(PLATECLIP, 'evenodd'); };
// march dust (tinted puffs left by moving figures) lies on the ground: drawn before the counters so it never veils the vehicles that raise it
function drawTrailDust(){ const kz = Math.max(0.6, Math.min(2, PG.view.s*HS0/12))*PG.zx(); PG.ctx.setTransform(PG.dpr, 0, 0, PG.dpr, 0, 0);
  for (const q of PART){ if (q.kind !== 'dust' || !q.tn) continue; const k = q.t/q.life; if (k >= 1) continue;
    const f = kzF(q, kz), [bx, by] = PG.toScreen(q.wx, q.wy), x = bx + q.ox*f, y = by + q.oy*f, sz = (q.s0 + (q.s1 - q.s0)*Math.sqrt(k))*kzS(f, kz); if (x < -sz || y < -sz || x > PG.cw + sz || y > PG.ch + sz) continue;
    PG.ctx.globalAlpha = (q.die != null ? Math.min(1, Math.max(0, (q.die - q.t)/300)) : 1)*0.42*(k < 0.12 ? k/0.12 : Math.pow(1 - k, 1.4)); PG.ctx.drawImage(rotSpr(PG.dustSprite(q.v, q.tn), q.rot), x - sz, y - sz*0.62, sz*2, sz*2*0.62); }
  PG.ctx.globalAlpha = 1; PG.ctx.setTransform(PG.dpr, 0, 0, PG.dpr, 0, 0); }
// battle sound for a fighting cluster that is not firing on the map (no figures drawn: counters only), once per volley cycle
const lastVolley = new Map(), lastDust = new Map(), SCORCH = [], MUZZ = [], CLPOS = new Map();
function volley(c, main, now, sx){
  const a = c.list[0], seed = a.id % 13, period = 650 + (seed*977 % 600), cyc = Math.floor((now + seed*131)/period);
  if (lastVolley.get(a.id) === cyc) return; lastVolley.set(a.id, cyc);
  if (!c.enemy || PG.muted || !PG.AC || now - (PG.shotAt.last || 0) <= 70) return; PG.shotAt.last = now;
  PG.shotAt(sx, main === 'art' || UNITS[main].cls === 'naval' ? 'art' : main === 'tank' || main === 'sam' ? 'tank' : 'inf'); }
/* ---- battle fire from the figures (BFX): the hook every figure display feeds ----
   Each frame, whatever draws a force's figures in a battle (the 3D models in troopModels today; the unit pictures of the unit display) calls
   bfxFigure once per figure it drew. That fills BFX.pts: per battle province, per side, the figure's ground point (world: the target spot,
   radius r), its weapon's muzzle (world), facing, model type, weapon kind (rifle, cannon, barrel, gun, rocket, sam, ship) and fade-in alpha.
   The counter loop then fires each side's volleys from its own figures' muzzles at the ground round the enemy's figures (figVolley): soldiers
   fire tracers from their rifles, tanks shells from their barrels, artillery arcing shells from its guns. A battle with no figures drawn this
   frame (zoomed out to counters only) fires nothing on the map: its plates show the crossed-swords badge (battleBadge) and its sound plays.
   Everything is world-anchored and world-sized (shoot/emit with ws: world px, so it moves and scales with the map like the figures). */
const BFX = {pts:new Map()};   // battle province -> Map(owner -> [{wx, wy, mx, my, ang, t, k, r, a, c}])
// the weapon of each model type: [forward of the model's centre, height above the ground (both in its own metres), kind, flash length (m)]
const BFX_GUN = {sol:[0.55, 1.3, 'rifle', 1], hmv:[0.2, 2.2, 'rifle', 1.2], ifv:[2.7, 2.3, 'cannon', 1.8], tank:[5, 2.2, 'barrel', 3.2], art:[5.3, 3.3, 'gun', 4],
  mlrs:[-1.6, 3, 'rocket', 2.6], sam:[-0.6, 3.2, 'sam', 2], frig:[2.4, 0.9, 'ship', 2], crui:[2.9, 1.1, 'ship', 2.4], carr:[1, 1.4, 'ship', 1.4]};
// one figure drawn this frame: c its cluster (at, owner), t its model type, (x, y) its ground spot on screen (css px), ang its facing (screen
// radians, 0 east), a its alpha. o.top: a picture seen from straight above (no camera tilt: the muzzle lies on the ground plane); o.len: its
// length in world px (default: the model's). Figures of a force not in a battle, or of a type without a weapon, are ignored.
function bfxFigure(c, t, x, y, ang, a, o = {}){ const G0 = BFX_GUN[t]; if (!G0 || !c || c.moving || c.air || !(a > 0.02) || !S.battles.includes(c.at)) return;
  const wpm = o.len ? o.len/((PG.TMG[t] || [8])[0]) : PG.tmWpm(t), [gx, gy] = PG.screenToWorld(x, y), sq = o.top ? 1 : PG.TM_SIN_EL, up = o.top ? 0 : Math.cos(0.82);
  const ca = Math.cos(ang), sa = Math.sin(ang), mx = gx + ca*G0[0]*wpm, my = gy + sa*G0[0]*wpm*sq - G0[1]*wpm*up;
  let M = BFX.pts.get(c.at); if (!M) BFX.pts.set(c.at, M = new Map()); let L = M.get(c.owner); if (!L) M.set(c.owner, L = []);
  L.push({wx:gx, wy:gy, mx, my, ang, t, k:G0[2], fl:G0[3]*wpm, r:(o.len || PG.tmRW()*((PG.TMG[t] || [0, 1])[1]))*0.5, a, c}); }
// a side's own figures and the figures of everyone it is at war with in that battle
const bfxOwn = c => { const M = BFX.pts.get(c.at); return M && M.get(c.owner) || null; };
function bfxFoes(c){ const M = BFX.pts.get(c.at); if (!M) return null; let T = null; for (const [o, L] of M) if (o !== c.owner && atWar(o, c.owner)) T = T ? T.concat(L) : L; return T; }
// the battle's fade-in (its figures' alpha) and its sides' ground centres (world)
function bfxBattle(p){ const M = BFX.pts.get(p); if (!M || M.size < 2) return null; let a = 0; const sides = [];
  for (const [o, L] of M){ let x = 0, y = 0; for (const q of L){ x += q.wx; y += q.wy; a = Math.max(a, q.a); } sides.push({o, x:x/L.length, y:y/L.length, L}); }
  return {a, sides}; }
const BFX_WANT = {inf:'rifle', at:'rifle', ifv:'cannon', tank:'barrel', art:'gun', sam:'sam'};
// one volley from a side's figures (at most one a cycle per force; Low effects / Battery saver: half as often, no gun smoke)
function figVolley(c, main, now, F, T){
  if (!fxLv()) return false;
  const a = c.list[0], seed = a.id % 13, lo = PG.SET.fx !== 'high' || PG.saverOn(), period = (420 + (seed*977 % 420))*(lo ? 2 : 1), cyc = Math.floor((now + seed*131)/period);
  if (lastVolley.get(a.id) === cyc) return false; lastVolley.set(a.id, cyc);
  const want = UNITS[main] && UNITS[main].cls === 'naval' ? 'ship' : BFX_WANT[main], cand = F.filter(f => f.k === want || (want === 'gun' && f.k === 'rocket'));
  const f = (cand.length ? cand : F)[Math.floor(Math.random()*(cand.length || F.length))], k = f.k, tq = T[Math.floor(Math.random()*T.length)];
  const tgt = (q = tq) => { const th = Math.random()*Math.PI*2, d = q.r*(0.45 + 0.9*Math.random()); return [q.wx + Math.cos(th)*d, q.wy + Math.sin(th)*d*0.7]; };   // round the figure, not on it
  const A0 = Math.min(1, f.a), dist = Math.hypot(tq.wx - f.mx, tq.wy - f.my), an = Math.atan2(tq.wy - f.my, tq.wx - f.mx), sx = PG.wrapSX(f.mx*PG.view.s + PG.view.x), nt0 = fxNight(f.mx, f.my);
  VOLA = A0; const sh = (kind, to, o) => shoot(kind, [f.mx, f.my], to, Object.assign(o, {ws:true})), sh2 = (kind, to, o) => { const pr = shot2(kind, [f.mx, f.my], to, o); if (pr){ pr.a = A0; pr.ws = true; } return pr; };   // (ws: a figure's shot)
  const fsea = (() => { const q = tgt(); return seaAt(q[0], q[1]); })();
  if (!PG.muted && PG.AC && now - (PG.shotAt.last || 0) > 70){ PG.shotAt.last = now; PG.shotAt(sx, k === 'gun' || k === 'rocket' || k === 'ship' ? 'art' : k === 'barrel' || k === 'sam' ? 'tank' : 'inf'); }
  const heavy = k === 'barrel' || k === 'gun' || k === 'ship' || k === 'rocket';
  MUZZ.push({wx:f.mx, wy:f.my, ang:an, wl:f.fl, big:heavy ? 0.9 : 0.45, t0:now, a:A0});
  emit('flash', f.mx, f.my, {ws:1, s0:f.fl*(heavy ? 0.9 : 0.7)*(1 + 0.5*nt0), s1:f.fl*0.3, life:heavy ? 110 : 70, vx:0, vy:0});
  const fid = a.id;   // (in a battle the force already faces the enemy: tmForms)
  if (k === 'rifle' || k === 'cannon'){ const n = k === 'cannon' ? 3 : 3 + (Math.random() < 0.5 ? 1 : 0);   // short bursts of tracer dots, dust kicked up round the enemy
    for (let i = 0; i < n; i++){ const to = tgt(Math.random() < 0.7 ? tq : T[Math.floor(Math.random()*T.length)]); sh('tracer', to, {dur:(130 + Math.random()*90)*(1 + dist/40), delay:i*(k === 'cannon' ? 110 : 60) + Math.random()*25, hit:k === 'cannon' && i === n - 1 ? 'small' : 'kick', dots:k === 'rifle'}); }
    if (main === 'at') sh('missile', tgt(), {dur:520 + dist*8, arc:0.6, hit:'small'}); snd('fire', k === 'cannon' ? 'tank' : 'gun', f.mx, f.my); }
  else if (k === 'barrel'){ unitRecoil(fid, an, 3); emit('dust', f.wx - Math.cos(an)*0.4, f.wy - Math.sin(an)*0.3, {ws:1, s0:0.3*f.fl, s1:1*f.fl, life:700, vx:-Math.cos(an)*0.5, vy:-0.25});   // recoil, the muzzle flash on the side facing the enemy, a dust puff, a fast flat tracer
    sh2('trc', tgt(), {dur:Math.min(500, 100 + dist*8), z:'M', sea:fsea, size:0.8}); if (!lo) bsmPuff(f.mx, f.my, {r0:0.35*f.fl, r1:1.1*f.fl, dur:2200, vx:Math.cos(an)*0.6, vy:-0.5, tone:'grey', a:0.75}); snd('fire', 'tank', f.mx, f.my); }
  else if (k === 'gun'){ unitRecoil(fid, an, 5); snd('fire', 'art', f.mx, f.my); sh2('shell', tgt(), {dur:Math.max(1000, Math.min(3000, 900 + dist*40)), arc:Math.max(4, Math.min(40, dist*0.45)), z:'M', sea:fsea, size:0.8});   /* strong recoil, a high arc (1-3 s by distance) */ if (!lo){ bsmPuff(f.mx, f.my, {r0:0.3*f.fl, r1:1*f.fl, dur:2800, vx:Math.cos(an)*0.5, vy:-0.9, tone:'grey', a:0.8}); bsmPuff(f.wx, f.wy, {r0:0.25*f.fl, r1:0.8*f.fl, dur:1600, vx:(Math.random() - 0.5)*1.2, vy:-0.1, tone:'dust', a:0.55, sq:0.55}); } }
  else if (k === 'rocket'){ const n = lo ? 6 : 6 + Math.floor(Math.random()*7); unitRecoil(fid, an, 2); snd('fire', 'rocket', f.mx, f.my);   // a ripple salvo of 6-12 rockets, 80 ms apart, impacts spread round the enemy
    for (let i = 0; i < n; i++) sh2('rkt', tgt(T[Math.floor(Math.random()*T.length)]), {delay:i*80, dur:Math.max(900, Math.min(2600, 800 + dist*30)), arc:Math.max(3, Math.min(25, dist*0.35)), z:'M', sea:fsea, size:0.8}); if (!lo) bsmPuff(f.mx, f.my, {r0:0.3*f.fl, r1:1.2*f.fl, dur:2600, vx:-Math.cos(an)*0.8, vy:-0.3, tone:'grey', a:0.7}); }
  else if (k === 'sam') sh('missile', tgt(), {dur:700 + dist*8, arc:Math.max(3, dist*0.4), hit:'tank'});
  else if (k === 'ship'){ unitRock(fid); snd('fire', 'art', f.mx, f.my); for (let i = 0; i < (lo ? 1 : 2); i++) sh2('shell', tgt(), {delay:i*140, dur:Math.max(900, Math.min(2600, 700 + dist*30)), arc:Math.max(2, Math.min(25, dist*0.3)), z:'M', sea:fsea, size:0.8});   /* the gun flash, the ship rocks, shells arc in (white water at sea) */ if (!lo) bsmPuff(f.mx, f.my, {r0:0.3*f.fl, r1:0.9*f.fl, dur:2000, vy:-0.6, tone:'grey', a:0.7}); }
  VOLA = 1; return true; }
// a world-sized hit where a figure's shot lands (kind: spark from a tracer, small from a cannon or missile, tank, art), world-sized like its figures
function bfxHit(wx, wy, kind){ const sea = (() => { const c = worldToCell(wx, wy), p = c >= 0 ? G.prov[c] : -1; return p >= 0 && G.P[p].sea; })(), lo = PG.SET.fx !== 'high' || PG.saverOn();
  if (kind === 'spark'){ emit('spark', wx, wy, {ws:1, s0:0.12, s1:0.06, life:240, vx:(Math.random() - 0.5)*5, vy:-(1 + Math.random()*3)}); if (!lo && Math.random() < 0.3) bsmPuff(wx, wy, {r0:0.12, r1:0.4, dur:900, vy:-0.3, tone:sea ? 'spray' : 'dust', a:0.6, sq:0.7}); return; }
  const R = kind === 'art' ? 1.5 : kind === 'tank' ? 1 : 0.55;   // the burst's world radius (a tank is 4.2 world px long)
  afxBoom(wx, wy, R, false, R); emit('flash', wx, wy, {ws:1, s0:R*1.9, s1:R*0.8, life:140, vx:0, vy:0}); emit('core', wx, wy, {ws:1, s0:R*0.45, s1:R*0.15, life:60, vx:0, vy:0});
  for (let i = 0; i < (kind === 'small' ? 1 : lo ? 2 : 4); i++) emit('fire', wx, wy, {ws:1, vx:(Math.random() - 0.5)*R*5, vy:-(1 + Math.random()*3)*R, s0:R*0.55, s1:R*0.15, life:380 + Math.random()*260});
  if (kind !== 'small') for (let i = 0; i < (lo ? 3 : 6); i++) emit('debris', wx, wy, {ws:1, vx:(Math.random() - 0.5)*R*9, vy:-(3 + Math.random()*6)*R, s0:0.1, s1:0.08, life:600 + Math.random()*400, g:18*R});
  const nS = kind === 'small' ? 1 : lo ? 1 : kind === 'art' ? 3 : 2;
  for (let i = 0; i < nS; i++) bsmPuff(wx + (Math.random() - 0.5)*R*0.8, wy + (Math.random() - 0.5)*R*0.4, {delay:80 + i*140, r0:R*0.35, r1:R*(1 + 0.4*Math.random()), dur:2600 + Math.random()*1600, vx:(Math.random() - 0.5)*0.5, vy:-(0.5 + Math.random()*0.6), tone:sea ? 'spray' : 'dark', a:0.85});
  if (!sea && kind !== 'small'){ bsmPuff(wx, wy + R*0.2, {r0:R*0.5, r1:R*1.6, dur:1900, vx:(Math.random() - 0.5)*0.8, vy:-0.1, tone:'dust', a:0.5, sq:0.5}); if (kind === 'art') afxCrater(wx, wy, 1.3 + 0.5*Math.random()); }}
/* ---- battle smoke and fire (BSM): world-anchored and world-sized, drawn as vector puffs at the current zoom ----
   Every puff is a cluster of round lobes filled in three crisp layers (its shadow side, a lit layer shifted toward the light from the upper
   left, a small highlight), so it has hard, clean edges and is sharp at every zoom (no scaled bitmaps, no blur). A battle's smoke stands in a
   few plumes on fixed world spots round the fight (seeded per battle and plume cycle: a plume burns 25-40 s on the paused clock, then a new
   one rises elsewhere); each plume is a column of puffs rising and growing in world units, leaning with the shared display wind, some with a
   fire at the foot. Short puffs (gun smoke, impacts, dust) drift and grow the same way. Night: the smoke goes dark, fires glow and light the
   smoke above them from below. Capped per frame (High / Low / Battery saver), culled off screen, frozen with reduced motion. */
const BSM = {b:new Map(), puffs:[], lob:[], n:0, id:0};
const BSM_TONE = {dark:[[44, 40, 36], [88, 81, 72], [158, 149, 134]], grey:[[104, 101, 96], [156, 152, 145], [222, 219, 211]], pale:[[84, 80, 75], [138, 132, 124], [204, 199, 189]],
  dust:[[110, 92, 68], [158, 139, 108], [208, 192, 160]], spray:[[150, 164, 170], [200, 212, 216], [240, 246, 248]]};   // [shadow side, body, sunlit top]
const BSM_NT = {dark:[[12, 11, 11], [24, 22, 22], [44, 44, 50]], grey:[[30, 30, 32], [48, 48, 52], [78, 80, 88]], pale:[[20, 19, 20], [36, 35, 38], [62, 63, 72]],
  dust:[[34, 30, 25], [54, 48, 40], [80, 74, 66]], spray:[[40, 48, 54], [66, 76, 82], [100, 110, 118]]};   // night: no light of its own (moonlit tops)
// a puff's lobes (unit radius, 16 seeded shapes): a centre lobe and five round it, all inside the unit circle
function bsmLobes(v){ v &= 15; if (BSM.lob[v]) return BSM.lob[v]; const r = mulberry(4021 + v*97), L = [[0, 0.06, 0.6]], n = 6 + (v & 1);
  for (let i = 0; i < n; i++){ const th = (i + 0.35*r())/n*Math.PI*2, d = 0.34 + 0.12*r(), lr = Math.min(0.98 - d, 0.36 + 0.2*r()); L.push([Math.cos(th)*d, Math.sin(th)*d*0.9, lr]); }
  for (let i = 0; i < 3 + (v & 2); i++){ const th = -Math.PI*(0.15 + 0.7*r()), d = 0.62 + 0.12*r(), lr = Math.min(0.98 - d, 0.16 + 0.1*r()); L.push([Math.cos(th)*d, Math.sin(th)*d, lr]); }   // small knobs on the top rim: a cauliflower edge
  return (BSM.lob[v] = L); }
const bsmMix = (A, B, t) => A.map((c, i) => c.map((v, j) => Math.round(v + (B[i][j] - v)*t)));
const bsmRGB = c => `rgb(${c[0]},${c[1]},${c[2]})`;
// one puff at (x, y) css px, radius R px, turned rot, squashed sq (lying on the ground), tone [shadow, mid, light], alpha a, warm 0..1: lit from below by a fire
function bsmDraw(x, y, R, rot, v, sq, T, a, warm){ if (R < 0.6 || a < 0.01 || x < -R*1.2 || y < -R*1.2 || x > PG.cw + R*1.2 || y > PG.ch + R*1.2) return; const L = bsmLobes(v), co = Math.cos(rot), si = Math.sin(rot);
  // (each layer one path of the lobes, so a layer has no seams; only: just the lobes on the upper part (screen), for the sunlit tops)
  const layer = (ox, oy, k, col, al, only) => { PG.ctx.beginPath(); for (const [lx, ly, lr] of L){ const px = lx*co - ly*si, py = lx*si + ly*co; if (only != null && py > only) continue; const cx = x + (px*k + ox)*R, cy = y + (py*k + oy)*R*sq, rr = lr*k*R; PG.ctx.moveTo(cx + rr, cy); PG.ctx.ellipse(cx, cy, rr, rr*sq, 0, 0, Math.PI*2); }
    PG.ctx.globalAlpha = al; PG.ctx.fillStyle = col; PG.ctx.fill(); };
  layer(0, 0, 1, bsmRGB(T[0]), a); layer(-0.12, -0.15, 0.8, bsmRGB(T[1]), a); layer(-0.24, -0.3, 0.6, bsmRGB(T[2]), a*0.9, 0.05);
  if (warm > 0.02){ layer(0.03, 0.26, 0.66, 'rgb(196,84,30)', a*0.6*warm, null); layer(0.03, 0.4, 0.4, 'rgb(255,160,64)', a*0.5*warm, null); } }
// a short-lived puff (gun smoke, an impact's smoke, dust): world radii r0 -> r1, drift vx, vy world px a second, on the real clock
function bsmPuff(wx, wy, o){ if (!PG.booted || PG.afxReduced() || !fxLv()) return; const lo = PG.SET.fx !== 'high' || PG.saverOn(), cap = lo ? 30 : 70; if (BSM.puffs.length >= cap) BSM.puffs.splice(0, BSM.puffs.length - cap + 1);
  if (afxOff(wx, wy, 80)) return;
  BSM.puffs.push({wx, wy, t0:performance.now() + (o.delay || 0), dur:o.dur || 2400, r0:o.r0 || 0.3, r1:o.r1 || 1, vx:(o.vx || 0) + windSync().wx*0.5, vy:(o.vy ?? -0.6) + windSync().wy*0.5, tone:o.tone || 'dark', a:o.a ?? 0.8, sq:o.sq || 1, v:(Math.random()*16) | 0, rot:Math.random()*6.28, id:++BSM.id}); }
// a plume's spot for cycle ci of slot k of battle p: on the ground between the two sides (most) or among one side's figures, clear of them
function bsmSpot(p, k, ci, sides){ const h = p*7919 + k*613 + ci*131, A = sides[0], B = sides[1], dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1, nx = -dy/L, ny = dx/L;
  const all = sides[0].L.concat(sides[1].L), clear = (x, y) => all.every(q => Math.hypot(q.wx - x, q.wy - y) > q.r + 0.8 && !(Math.abs(q.wx - x - 2*windSync().wx) < q.r + 2.2 && q.wy < y && q.wy > y - 9));   // (nor rising over a figure behind it)
  for (let j = 0; j < 10; j++){ const hj = h + j*977, at = k % 3 === 2 && j < 5, t = at ? (fxh(hj) < 0.5 ? 0.08 + 0.1*fxh(hj + 1) : 0.82 + 0.1*fxh(hj + 1)) : 0.25 + 0.5*fxh(hj + 1), o = (fxh(hj + 2) - 0.5)*Math.max(4, 0.7*L);
    const x = A.x + dx*t + nx*o, y = A.y + dy*t + ny*o*0.8; if (clear(x, y)) return [x, y, fxh(hj + 3)]; }
  return [A.x + dx*0.5 + nx*(fxh(h + 7) - 0.5)*4, A.y + dy*0.5 + ny*(fxh(h + 7) - 0.5)*3, fxh(h + 9)]; }   // (no clear spot: the middle of the open ground between the sides)
// the battle smoke of every battle with figures drawn this frame, and the short puffs; called under the counters
function drawBattleSmoke(now){ if (!fxLv()) return; const red = PG.afxReduced(), lo = PG.SET.fx !== 'high' || PG.saverOn(), gt = PG.FXQ.gt, run = !!S.speed && !S.over, WD = windSync(), t0 = /*@TEST*/WFX.fz ||/*@ENDTEST*/ now;
  PG.ctx.save(); PG.ctx.setTransform(PG.dpr, 0, 0, PG.dpr, 0, 0); let drawn = 0, cap = lo ? 70 : 220;
  for (const k0 of BSM.b.keys()) if (!S.battles.includes(k0)) BSM.b.delete(k0);
  const items = [];   // every puff and fire of this frame, drawn back to front by their ground's y
  for (const p of S.battles){ const B = bfxBattle(p); if (!B) continue; const sides = B.sides.length >= 2 ? B.sides : null; if (!sides) continue;
    let st = BSM.b.get(p); if (!st){ st = {slots:[]}; BSM.b.set(p, st); }
    const nP = lo ? 2 : 4, nPuff = lo ? 6 : 10, gs = gt/1000;
    for (let k = 0; k < nP; k++){ const life = 25 + 15*fxh(p*31 + k*7), off = life*fxh(p*17 + k*3), ci = Math.floor((gs + off)/life), ph = ((gs + off)/life) % 1;
      let sl = st.slots[k]; if (!sl || sl.ci !== ci){ const s = bsmSpot(p, k, ci, sides); sl = st.slots[k] = {ci, wx:s[0], wy:s[1], fire:k % 3 === 2 || s[2] < 0.45, sd:(p*13 + k*7 + ci*5) & 0xffff, sz:0.8 + 0.5*s[2], H:6 + 5*fxh(p + k*11 + ci)}; }
      const env = Math.min(1, ph/0.12)*Math.min(1, (1 - ph)/0.25)*B.a; if (env <= 0.01) continue; const [sx, sy] = PG.toScreen(sl.wx, sl.wy), Hs = sl.H*sl.sz*PG.view.s;
      if (sx < -Hs || sx > PG.cw + Hs || sy < -40 || sy > PG.ch + Hs*1.2) continue;   // off screen: nothing
      items.push({y:sl.wy, pl:sl, env, nPuff, ph}); } }
  for (const w of WRECKS){ const age = (now - w.t0)/26000; if (age >= 1 || age < 0) continue; const [sx, sy] = PG.toScreen(w.wx, w.wy); if (sx < -200 || sx > PG.cw + 200 || sy < -40 || sy > PG.ch + 300) continue;
    if (!w.pl) w.pl = {wx:w.wx, wy:w.wy, fire:true, sd:(w.t0 | 0) & 0xffff, sz:1, H:7};
    items.push({y:w.wy, pl:w.pl, env:Math.min(1, age/0.03)*Math.min(1, (1 - age)/0.3), nPuff:lo ? 4 : 6, ph:age}); }
  items.sort((a, b) => a.y - b.y);
  for (const it of items){ const P = it.pl, nt = fxNight(P.wx, P.wy), H = P.H*P.sz, per = 9 + 4*fxh(P.sd), [bx, by] = PG.toScreen(P.wx, P.wy);
    if (run && !red) PG.animAmb();
    const fl = P.fire ? (red ? 0.8 : 0.75 + 0.25*Math.sin(gt/90 + P.sd)*Math.sin(gt/57 + P.sd*1.3)) : 0;
    if (P.fire){ const fr = 0.75*P.sz*PG.view.s; PG.ctx.globalCompositeOperation = 'lighter'; PG.ctx.globalAlpha = it.env*(0.25 + 0.5*nt)*fl; PG.ctx.drawImage(GLOW(), bx - fr*2.6, by - fr*1.1, fr*5.2, fr*2.2); PG.ctx.globalCompositeOperation = 'source-over'; }
    // the column: puffs rising from the foot (newest at the bottom, drawn last: in front), growing and leaning downwind; the top thins out
    const n = it.nPuff;
    for (let i = n - 1; i >= 0; i--){ if (drawn >= cap) break; const u = (((red ? 0.37 : gt/1000/per) + i/n) % 1), e = Math.pow(u, 1.25), hi = fxh(P.sd*31 + i*7), R = P.sz*(0.5 + 1.5*Math.pow(u, 0.7))*(0.8 + 0.4*hi)*PG.view.s;
      const x = bx + (WD.wx*H*0.6*Math.pow(u, 1.6) + (hi - 0.5)*0.9*P.sz*(0.3 + u) + Math.sin(u*4 + P.sd)*0.25*P.sz)*PG.view.s, y = by - (0.5*P.sz + H*e)*PG.view.s + WD.wy*H*0.4*u*PG.view.s;   // (rising, spreading, leaning downwind)
      const al = it.env*Math.min(1, u/0.035)*Math.pow(1 - u, 0.8)*(P.fire ? 0.96 : 0.9), T = bsmMix(bsmMix(BSM_TONE.dark, BSM_TONE.pale, Math.min(1, u*1.3)), bsmMix(BSM_NT.dark, BSM_NT.pale, u), nt);
      /*@TEST*/if (WFX.dbg) WFX.dbg.push(['s' + P.sd + ':' + i, x, y, PG.view.s, PG.view.x, PG.view.y]);/*@ENDTEST*/
      bsmDraw(x, y, R, P.sd + i*1.7 + u*0.8, P.sd + i, 1, T, al, P.fire ? Math.max(0, 1 - u*2.5)*(0.3 + 0.7*nt)*fl : 0); drawn++; }
    if (P.fire) bsmFire(bx, by, P, it.env, gt, red, nt); }
  PG.ctx.globalAlpha = 1;
  // the short puffs
  for (let i = BSM.puffs.length - 1; i >= 0; i--){ const q = BSM.puffs[i], t = t0 - q.t0, k = t/q.dur; if (k >= 1){ BSM.puffs.splice(i, 1); continue; } if (k < 0){ PG.animFast(); continue; } if (drawn >= cap + 60) break;
    PG.animFast(); const ts = t/1000, e = 1 - (1 - k)*(1 - k), x = PG.wrapSX((q.wx + q.vx*ts*(1 - 0.3*k))*PG.view.s + PG.view.x), y = (q.wy + q.vy*ts*(1 - 0.3*k))*PG.view.s + PG.view.y, R = (q.r0 + (q.r1 - q.r0)*e)*PG.view.s;
    /*@TEST*/if (WFX.dbg) WFX.dbg.push(['q' + q.id, x, y, PG.view.s, PG.view.x, PG.view.y]);/*@ENDTEST*/
    const nt = fxNight(q.wx, q.wy), T = bsmMix(BSM_TONE[q.tone] || BSM_TONE.dark, BSM_NT[q.tone] || BSM_NT.dark, nt);
    bsmDraw(x, y, R, q.rot + k*0.6, q.v, q.sq, T, q.a*Math.min(1, k/0.08)*Math.pow(1 - k, 1.2), 0); drawn++; }
  PG.ctx.globalAlpha = 1; PG.ctx.globalCompositeOperation = 'source-over'; PG.ctx.restore(); }
// a fire at a plume's foot: a few flame tongues (vector, world-sized) flickering on the paused clock, glowing (brighter at night)
function bsmFire(bx, by, P, env, gt, red, nt){ const s = PG.view.s*P.sz, n = 5, lean = windSync().ux*0.18; if (s < 1.5) return;
  const tongue = (k, col, al) => { PG.ctx.beginPath();
    for (let i = 0; i < n; i++){ const ph = P.sd*0.37 + i*1.9, hi = fxh(P.sd*11 + i), f = red ? 0.85 : 0.65 + 0.35*Math.abs(Math.sin(gt/63 + ph)*Math.sin(gt/101 + ph*1.7)), w = (0.2 + 0.1*hi)*s*k, h = (0.35 + 0.55*hi)*(i === 2 ? 1.4 : 1)*s*f*k;
      const x = bx + (i - 2)*0.24*s + (hi - 0.5)*0.1*s, y = by + 0.04*s, sw = ((red ? 0 : Math.sin(gt/150 + ph)*0.1) + lean)*h;
      PG.ctx.moveTo(x - w, y); PG.ctx.bezierCurveTo(x - w*1.1, y - h*0.45, x + sw*0.4 - w*0.25, y - h*0.7, x + sw, y - h); PG.ctx.bezierCurveTo(x + sw*0.4 + w*0.35, y - h*0.65, x + w*1.1, y - h*0.4, x + w, y); PG.ctx.closePath(); }
    PG.ctx.globalAlpha = al; PG.ctx.fillStyle = col; PG.ctx.fill(); };
  tongue(1, 'rgb(214,70,22)', env*0.92); tongue(0.72, 'rgb(250,146,40)', env*0.95); tongue(0.42, 'rgb(255,228,150)', env*0.95);   // red-orange outside, orange, a pale yellow heart
  PG.ctx.globalCompositeOperation = 'lighter'; PG.ctx.globalAlpha = env*(0.25 + 0.45*nt); const gr = s*1.5; PG.ctx.drawImage(GLOW(), bx - gr, by - gr*1.25, gr*2, gr*1.6); PG.ctx.globalCompositeOperation = 'source-over'; }
// the crossed-swords battle mark: two swords crossed on a small dark disc with a red rim, centred at (x, y), radius R (css px); drawn in code.
// One function for every place that marks a force in a fight (the fighting counters' badge; the army bar's armies in a fight)
function battleBadge(x, y, R, g = PG.ctx){ g.save(); g.beginPath(); g.arc(x, y, R, 0, Math.PI*2); g.fillStyle = '#1a0f0e'; g.fill(); g.lineWidth = Math.max(1, R*0.2); g.strokeStyle = '#e0574f'; g.stroke();
  const L = R*0.64, bw = Math.max(0.9, R*0.2); g.lineCap = 'round';
  for (const s of [1, -1]){ const hx = x - s*L, hy = y + L, tx = x + s*L, ty = y - L, ux = (tx - hx)/(2*L*Math.SQRT2), uy = (ty - hy)/(2*L*Math.SQRT2), nx = -uy, ny = ux, gx = hx + ux*R*0.42, gy = hy + uy*R*0.42;
    g.beginPath(); g.moveTo(gx + nx*bw*0.5, gy + ny*bw*0.5); g.lineTo(tx - ux*bw*0.2, ty - uy*bw*0.2); g.lineTo(gx - nx*bw*0.5, gy - ny*bw*0.5); g.closePath(); g.fillStyle = '#f1e6d6'; g.fill();   // the blade, tapering to its point
    g.lineWidth = bw*0.9; g.strokeStyle = '#d7a548'; g.beginPath(); g.moveTo(gx + nx*R*0.3, gy + ny*R*0.3); g.lineTo(gx - nx*R*0.3, gy - ny*R*0.3); g.stroke();   // the guard
    g.beginPath(); g.moveTo(gx, gy); g.lineTo(hx + ux*R*0.06, hy + uy*R*0.06); g.stroke(); }   // the grip
  g.restore(); }

/* ================= Combat effects: firing by weapon, impacts, the forces' reactions (owner's request, Parts 1-2) =================
   Everything here is visual only: it is started by the rules' map events (index.html, RULES EVENTS: who fired, at whom, with which unit types,
   hit or miss, destroyed) or by the developer's Effects test panel, reads the rules state and never changes it (no rng: Math.random only).
   Positions are world points (x, y; a height h above the ground is drawn as y - h), so every effect follows the map's pan and zoom, and each
   one is drawn on the copy of the map nearest the screen's middle (the map wraps east-west: a shot is laid out from its own start, so it
   never breaks at the seam). Shots, particles and unit reactions come from fixed pools (PROJ, PART: objects reused, never made per frame). */
// the effects quality: 2 High, 1 Low (also with the Battery saver or the reduce-motion setting), 0 Off (no particles and no animations; only
// the static markers the game needs: the crossed swords, the missile warning, the target marker)
const fxLv = () => { const f = PG.SET.fx; return f === 'off' ? 0 : f === 'low' || PG.saverOn() || PG.afxReduced() ? 1 : 2; };
// zoomed far out (a province only a few px across): simple flashes instead of full effects
const fxFar = () => PG.view.s*HS0 < 30;
// the shortest east-west step from x0 to x1 across the map's seam
const wdx = (x0, x1) => { const d = x1 - x0; return d - Math.round(d/WORLD_W)*WORLD_W; };
const seaAt = (wx, wy) => { const c = worldToCell(wx, wy), p = c >= 0 ? G.prov[c] : -1; return p >= 0 && !!G.P[p].sea; };
// on screen (with a margin, css px)?
const onScr = (x, y, m = 40) => x > -m && y > -m && x < PG.cw + m && y < PG.ch + m;
// a real-time queue for the steps of one effect (the turn before firing, a salvo's rounds, a bomb run): runs whether or not the game runs
const CQ = []; let cqT = 0;
function cqAdd(ms, fn){ if (CQ.length > 300) CQ.shift(); CQ.push({t:performance.now() + ms, fn}); PG.animFast(); }
function cqRun(now){ if (!CQ.length) return; for (let i = 0; i < CQ.length; i++){ const q = CQ[i]; if (q.t > now) continue; CQ.splice(i--, 1); try { q.fn(); } catch (e){ console.error(e); } } if (CQ.length) PG.animFast(); }

// ---- the forces' reactions: facing the target, recoil, the hit flash and shake, a ship's rock ----
// per force (army id): fa the world angle it faces to fire (held 8 s), rk/ra/rp its recoil (start, angle, px), hit/hz its hit flash, rock a ship's roll
const ANIM = new Map();
function anim(id){ let A = ANIM.get(id); if (!A){ A = {fa:NaN, ft:-1e9, rk:-1e9, ra:0, rp:0, hit:-1e9, hz:1, rock:-1e9}; ANIM.set(id, A); if (ANIM.size > 400) ANIM.delete(ANIM.keys().next().value); } return A; }
function unitFace(id, ang, T){ if (id == null) return; const A = anim(id); A.fa = ang; A.ft = performance.now(); if (T){ A.tx = T[0]; A.ty = T[1]; } PG.redraw(); }   // (T: the world point it aims at, for a tap)
function unitRecoil(id, ang, px){ if (id == null || fxLv() === 0) return; const A = anim(id); A.rk = performance.now(); A.ra = ang; A.rp = px; PG.animFast(); }
function unitHit(id, z){ if (id == null || fxLv() === 0) return; const A = anim(id); A.hit = performance.now(); A.hz = z === 'S' ? 1 : z === 'M' ? 1.5 : 2.2; PG.animFast(); }
function unitRock(id){ if (id == null || fxLv() === 0) return; anim(id).rock = performance.now(); PG.animFast(); }
// what the page applies to a force's drawn figures or counter this frame (one shared object, filled per call): dx, dy (css px), rot (rad),
// red (0..1, the hit flash), face (the world angle to face, or null). null when nothing applies.
const UA = {dx:0, dy:0, rot:0, red:0, face:null};
/*@TEST*/const RX = {on:true};   // (tests of the layout's stability hold the reactions still: setReact(false))/*@ENDTEST*/
function unitAnim(ids, now){ /*@TEST*/if (!RX.on) return null;/*@ENDTEST*/ let A = null; for (const id of ids){ const q = ANIM.get(typeof id === 'object' ? id.id : id); if (q && (!A || Math.max(q.rk, q.hit, q.rock, q.ft) > Math.max(A.rk, A.hit, A.rock, A.ft))) A = q; }
  if (!A) return null; UA.dx = UA.dy = UA.rot = UA.red = 0; UA.face = now - A.ft < 8000 && isFinite(A.fa) ? A.fa : null; let live = false;
  const tr = now - A.rk; if (tr >= 0 && tr < 170){ live = true; const k = tr < 30 ? tr/30 : Math.pow(1 - (tr - 30)/140, 2); UA.dx -= Math.cos(A.ra)*A.rp*k; UA.dy -= Math.sin(A.ra)*A.rp*k; }   // kicks back, springs back (~150 ms)
  const th = now - A.hit; if (th >= 0 && th < 360){ live = true; const k = 1 - th/360, am = 1.3*A.hz*k; UA.dx += Math.sin(th*0.11)*am; UA.dy += Math.cos(th*0.17)*am*0.6; UA.red = Math.min(1, k*1.25); }
  const tk = now - A.rock; if (tk >= 0 && tk < 1100){ live = true; UA.rot = Math.sin(tk/1100*Math.PI*3)*0.075*(1 - tk/1100); }
  if (live) PG.animFast(); if (!live && UA.face == null) return null; return UA; }
// the red of a hit, over a figure or a counter's box (css px)
function unitHitMark(x, y, w, h, red){ if (!(red > 0.02)) return; const g = PG.ctx, r = Math.max(w, h)*0.7; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55*red;
  g.drawImage(softSprite('hitred', 'rgba(255,60,40,1)', 'rgba(255,40,30,.45)', 'rgba(255,30,20,0)'), x + w/2 - r, y + h/2 - r, r*2, r*2); g.restore(); }

// ---- the shots: PROJ, a pool of reused objects (cap 90 High, 40 Low, none Off). A shot of the new kinds (v2) is a world path from `from` to
// `to` with a height profile; its look and its end (the impact) follow its kind ----
const PRFREE = [], PROJ_CAP = [0, 40, 90]; let PRSN = 0;   // (sn: each shot's serial number: the pool reuses the objects)
function projGet(){ const lv = fxLv(); if (!lv) return null; while (PROJ.length >= PROJ_CAP[lv]){ const q = PROJ[0]; PROJ[0] = PROJ[PROJ.length - 1]; PROJ.pop(); PRFREE.push(q); }
  const pr = PRFREE.pop() || {}; for (const k in pr) pr[k] = undefined; PROJ.push(pr); return pr; }
// a new-style shot. o: delay (ms), dur (ms), arc (world px: the top of its path), size, ev (its events: a strafing run, a bomb line), z (impact size
// S M L XL), sea, kill, bid (the force hit), miss, end (called at the end instead of the impact), cut (it is stopped at that share of its path)
function shot2(kind, from, to, o = {}){ const pr = projGet(); if (!pr) return null; const now = performance.now();
  pr.v2 = true; pr.sn = ++PRSN; pr.kind = kind; pr.from = from; pr.to = [from[0] + wdx(from[0], to[0]), to[1]]; pr.t0 = now + (o.delay || 0); pr.dur = o.dur || 600; pr.arc = o.arc || 0;
  pr.size = o.size || 1; pr.z = o.z; pr.sea = o.sea; pr.kill = !!o.kill; pr.bid = o.bid; pr.end = o.end; pr.cut = o.cut; pr.ev = o.ev; pr.n = 0; pr.seed = Math.random()*6.28;
  pr.img = o.img; pr.a = 1; pr.snd = o.snd; pr.miss = !!o.miss; if (o.snd) snd('flight', o.snd, from[0], from[1]); PG.animFast(); return pr; }
// its point at share k of the way: [x, y, h] (world px; h the height above the ground)
function prAt(pr, k){ const dx = pr.to[0] - pr.from[0], dy = pr.to[1] - pr.from[1]; let x = pr.from[0] + dx*k, y = pr.from[1] + dy*k, h = 0;
  switch (pr.kind){
    case 'shell': case 'rkt': case 'bm': case 'icbm': h = Math.sin(k*Math.PI)*pr.arc; break;
    case 'cm': { h = pr.arc*Math.min(1, k/0.12, (1 - k)/0.08); const L = Math.hypot(dx, dy) || 1, w = Math.sin(k*Math.PI*5 + pr.seed)*Math.min(1.1, L*0.02)*Math.sin(k*Math.PI); x += -dy/L*w; y += dx/L*w; break; }   // low and flat, a slight weave
    case 'drn': h = pr.arc*Math.pow(1 - k, 1.4); break;   // a dive onto the target
    case 'dot': h = pr.arc*(1 - k)*(0.6 + 0.4*Math.sin(k*Math.PI + pr.seed)); break;
    case 'bomb': h = pr.arc*(1 - k*k); break;   // falling
    case 'jet': h = pr.arc; break;
    case 'icpt': h = pr.arc*Math.sin(k*Math.PI/2); break;   // climbing to meet its target
  } return [x, y, h]; }
// drawing one (screen px: the shot's own point by toScreen, the rest of it laid out from there, so it never breaks at the seam)
function prDraw(pr, k, now){ const g = PG.ctx, s = PG.view.s, [x, y, h] = prAt(pr, k), [sx, sy] = PG.toScreen(x, y), hx = sx, hy = sy - h*s;
  if (!onScr(sx, sy, 80 + h*s) && !onScr(hx, hy, 80)) return;
  const rel = (q) => [sx + (q[0] - x)*s, sy + (q[1] - y)*s - q[2]*s];   // another point of its path, laid out from this one
  const vel = () => { const q = prAt(pr, Math.min(1, k + 0.01)), p = prAt(pr, Math.max(0, k - 0.01)); return Math.atan2((q[1] - q[2]) - (p[1] - p[2]), wdx(p[0], q[0])); };
  const trail = (span, n, w0, col, a0, grow) => { if (k <= 0.001) return; g.lineCap = 'round'; let [px, py] = [hx, hy];   // a fading trail back along the path
    for (let j = 1; j <= n; j++){ const kk = k - span*j/n; if (kk < 0) break; const [qx, qy] = rel(prAt(pr, kk)), f = 1 - j/n; g.globalAlpha = a0*f*pr.a; g.strokeStyle = col; g.lineWidth = Math.max(1, w0*s*(1 + (grow || 0)*(1 - f))); g.beginPath(); g.moveTo(px, py); g.lineTo(qx, qy); g.stroke(); px = qx; py = qy; } };
  const glow = (r, a) => { g.globalCompositeOperation = 'lighter'; g.globalAlpha = a*pr.a; g.drawImage(GLOW(), hx - r, hy - r, r*2, r*2); g.globalCompositeOperation = 'source-over'; };
  const shade = (r) => { if (h <= 0.05) return; g.globalAlpha = 0.28*pr.a; g.fillStyle = '#0b0c0b'; g.beginPath(); g.ellipse(sx, sy, r, r*0.5, 0, 0, Math.PI*2); g.fill(); };   // a soft shadow on the ground under it, in a straight line
  const pic = (name, L, ang) => { const im = name && PG.ART.sprite(name, Math.round(L*PG.dpr)); if (!im) return false; g.save(); g.globalAlpha = pr.a; g.translate(hx, hy); g.rotate(ang + Math.PI/2); g.drawImage(im, -L/2, -L/2, L, L); g.restore(); return true; };
  switch (pr.kind){
    case 'trc': { const L = Math.max(8, 2.6*s*pr.size), an = Math.atan2(pr.to[1] - pr.from[1], pr.to[0] - pr.from[0]);   // a fast, flat tank tracer
      g.globalAlpha = pr.a; g.strokeStyle = 'rgba(255,214,130,.95)'; g.lineWidth = Math.max(1.6, 0.22*s*pr.size); g.lineCap = 'round'; g.beginPath(); g.moveTo(hx - Math.cos(an)*L, hy - Math.sin(an)*L); g.lineTo(hx, hy); g.stroke(); glow(Math.max(3, 0.4*s), 0.7); break; }
    case 'dots': { const an = Math.atan2(pr.to[1] - pr.from[1], pr.to[0] - pr.from[0]), d = Math.max(3, 0.6*s); g.globalAlpha = pr.a; g.fillStyle = 'rgba(255,226,150,.95)';   // a rifle burst: two small tracer dots
      for (let j = 0; j < 2; j++){ const r = Math.max(1.1, 0.1*s); g.beginPath(); g.arc(hx - Math.cos(an)*d*j, hy - Math.sin(an)*d*j, r, 0, Math.PI*2); g.fill(); } break; }
    case 'shell': { const hn = pr.arc > 0 ? h/pr.arc : 0, r0 = Math.max(1.6, 0.3*s*pr.size);   // grows as it climbs, shrinks as it falls; its shadow runs straight beneath
      shade(Math.max(1.6, 0.4*s*pr.size)*(1 - 0.35*hn)); trail(0.06, 4, 0.14*pr.size, 'rgba(255,230,190,.8)', 0.5);
      g.globalAlpha = pr.a; g.fillStyle = '#3a3630'; g.beginPath(); g.arc(hx, hy, r0*(1 + 1.1*hn), 0, Math.PI*2); g.fill(); glow(r0*(2.2 + 1.5*hn), 0.55); break; }
    case 'rkt': trail(0.32, 8, 0.16*pr.size, 'rgba(206,200,190,1)', 0.5, 1.4); glow(Math.max(2.5, 0.45*s), 0.9); g.globalAlpha = pr.a; g.fillStyle = '#fff0c8'; g.beginPath(); g.arc(hx, hy, Math.max(1, 0.1*s), 0, Math.PI*2); g.fill(); break;
    case 'cm': { const L = Math.max(10, 2.6*s*pr.size), an = vel(); shade(Math.max(1.2, 0.3*s)); trail(0.22, 9, 0.12, 'rgba(222,220,214,1)', 0.45, 1); glow(Math.max(3, 0.5*s), 0.8);
      if (!pic('u-cruise-missile', L, an)){ g.save(); g.translate(hx, hy); g.rotate(an); g.globalAlpha = pr.a; g.fillStyle = '#e8e4da'; g.strokeStyle = '#1a1c1b'; g.lineWidth = 1; g.beginPath(); g.moveTo(L/2, 0); g.lineTo(-L/2, -L*0.14); g.lineTo(-L/2, L*0.14); g.closePath(); g.fill(); g.stroke(); g.restore(); } break; }
    case 'bm': case 'icbm': { const big = pr.kind === 'icbm' ? 1.7 : 1, L = Math.max(12, 3.4*s*big*pr.size), an = vel();   // the smoke column it climbs on, a bright exhaust
      trail(Math.min(k, 0.5), 14, 0.28*big, 'rgba(226,224,218,1)', 0.55, 2.2); shade(Math.max(1.4, 0.36*s*big)*(1 - 0.5*(pr.arc > 0 ? h/pr.arc : 0))); glow(Math.max(5, 0.9*s*big), 1);
      if (!pic(pr.kind === 'icbm' ? 'u-icbm' : 'u-ballistic-missile', L, an)){ g.save(); g.translate(hx, hy); g.rotate(an); g.globalAlpha = pr.a; g.fillStyle = '#ece8dc'; g.strokeStyle = '#1a1c1b'; g.lineWidth = 1; g.beginPath(); g.moveTo(L/2, 0); g.lineTo(-L/2, -L*0.12); g.lineTo(-L/2, L*0.12); g.closePath(); g.fill(); g.stroke(); g.restore(); } break; }
    case 'icpt': trail(0.35, 8, 0.07, 'rgba(240,244,248,1)', 0.7); glow(Math.max(3, 0.45*s), 0.95); break;   // the interceptor's streak
    case 'drn': { const L = Math.max(13, 2.6*s*pr.size), an = vel(); shade(Math.max(1, 0.25*s)); trail(0.15, 4, 0.05, 'rgba(200,200,200,1)', 0.35);
      if (!pic(pr.img || 'u-strike-drone', L, an)){ g.save(); g.translate(hx, hy); g.rotate(an); g.globalAlpha = pr.a; g.fillStyle = '#2b2d2a'; g.beginPath(); g.moveTo(L/2, 0); g.lineTo(-L/2, -L*0.45); g.lineTo(-L*0.25, 0); g.lineTo(-L/2, L*0.45); g.closePath(); g.fill(); g.restore(); } break; }
    case 'dot': trail(0.12, 3, 0.05, 'rgba(40,42,40,1)', 0.45); g.globalAlpha = pr.a; g.fillStyle = '#1e201e'; g.beginPath(); g.arc(hx, hy, Math.max(1.8, 0.22*s), 0, Math.PI*2); g.fill(); break;   // a swarm drone
    case 'bomb': { const r = Math.max(1.2, 0.18*s)*(0.6 + 0.6*(pr.arc > 0 ? h/pr.arc : 0)); shade(r*1.1); g.globalAlpha = pr.a; g.fillStyle = '#22231f'; g.beginPath(); g.ellipse(hx, hy, r, r*1.5, 0, 0, Math.PI*2); g.fill(); break; }
    case 'jet': { const L = Math.max(16, 4.2*s*pr.size), an = Math.atan2(pr.to[1] - pr.from[1], wdx(pr.from[0], pr.to[0]));   // a strafing fighter or a bomber over the target: its picture, its shadow below
      const im = PG.ART.sprite(pr.img || 'u-jet', Math.round(L*PG.dpr)); g.save(); g.translate(sx + h*s*0.35, sy); g.rotate(an + Math.PI/2); g.globalAlpha = 0.25*pr.a;
      if (im){ g.filter = 'brightness(0)'; g.drawImage(im, -L/2, -L/2, L, L); g.filter = 'none'; } else { g.fillStyle = '#000'; g.beginPath(); g.moveTo(0, -L/2); g.lineTo(L*0.4, L*0.3); g.lineTo(-L*0.4, L*0.3); g.closePath(); g.fill(); } g.restore();
      g.save(); g.translate(hx, hy); g.rotate(an + Math.PI/2); g.globalAlpha = pr.a; if (im) g.drawImage(im, -L/2, -L/2, L, L); else { g.fillStyle = '#cfd3d6'; g.strokeStyle = '#1a1c1b'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -L/2); g.lineTo(L*0.42, L*0.28); g.lineTo(0, L*0.12); g.lineTo(-L*0.42, L*0.28); g.closePath(); g.fill(); g.stroke(); } g.restore(); break; }
  }
  g.globalAlpha = 1; }
// a strafing run (fighters: bursts down along the target) or a bomb line (bombers: bombs that walk across it), on the shot's own clock
function prEvents(pr, k){ if (!pr.ev || pr.kind !== 'jet') return; const E = pr.ev, lo = fxLv() < 2;
  if (E.t === 'strafe'){ const step = lo ? 0.09 : 0.05; while (k >= E.k0 + pr.n*step && E.k0 + pr.n*step <= E.k1){ const kk = E.k0 + pr.n*step; pr.n++; const [x, y, h] = prAt(pr, kk), dx = pr.to[0] - pr.from[0], dy = pr.to[1] - pr.from[1], L = Math.hypot(dx, dy) || 1, gx = x + dx/L*2.2 + (Math.random() - 0.5)*0.6, gy = y + dy/L*2.2 + (Math.random() - 0.5)*0.6;
      shot2('dots', [x, y - h], [gx, gy], {dur:90, end:() => kick(gx, gy, E.sea)}); if (pr.n % 3 === 1) snd('fire', 'gun', x, y); } }
  else if (E.t === 'bombs'){ const n = E.n, step = (E.k1 - E.k0)/Math.max(1, n - 1); while (pr.n < n && k >= E.k0 + pr.n*step){ const kk = E.k0 + pr.n*step; pr.n++; const [x, y, h] = prAt(pr, kk), dx = pr.to[0] - pr.from[0], dy = pr.to[1] - pr.from[1], L = Math.hypot(dx, dy) || 1, gx = x + dx/L*1.6, gy = y + dy/L*1.6;
      shot2('bomb', [x, y], [gx, gy], {arc:h, dur:620, z:'M', sea:E.sea, kill:E.kill && pr.n === n, bid:pr.n === Math.ceil(n/2) ? E.bid : null}); } } }
// a shot's end: its impact (or its own end), or an air burst where it was stopped
function prEnd(pr){ const [x, y, h] = prAt(pr, pr.cut != null ? pr.cut : 1);
  if (pr.end){ pr.end(x, y, h); return; }
  if (pr.cut != null){ airBurst(x, y - h, pr.kind === 'bm' || pr.kind === 'icbm' ? 1.4 : 0.9); return; }
  if (pr.kind === 'jet' || pr.kind === 'dots') return;
  const z = pr.z || 'S';
  if (pr.kind === 'cm') return strikeAt('cm', x, y, pr);
  if (pr.kind === 'bm' || pr.kind === 'icbm') return strikeAt(pr.kind, x, y, pr);
  impact(z, x, y, {sea:pr.sea, kill:pr.kill, bid:pr.bid, art:pr.kind === 'shell' || pr.kind === 'rkt'}); }
// the heavy strikes (cruise, ballistic, ICBM): the strike effects (WFX: their own caps, never thinned by the particle cap), the unit hit
function strikeAt(k, x, y, pr){ const q = fxLv(); if (!q) return; if (pr && pr.bid != null) unitHit(pr.bid, 'L');
  if (fxFar()){ flashAt(x, y, k === 'icbm' ? 4 : 2.4); bigShake(x, y, k); snd('impact', k === 'icbm' ? 'XL' : 'L', x, y); return; }
  wfxStrike(k, x, y, {force:true, sea:pr ? pr.sea : undefined}); snd('impact', k === 'icbm' ? 'XL' : 'L', x, y); }
// impacts sized by the weapon: S small arms and drones, M tanks, guns, bombs, L missiles, XL ICBM. A hit force flashes red and shakes; a
// destroyed one gets a bigger blast and a smoke column; a hit at sea throws up white water
function impact(z, x, y, o = {}){ const lv = fxLv(); if (!lv) return; const sea = o.sea ?? seaAt(x, y);
  if (o.bid != null) unitHit(o.bid, z);
  if (fxFar()){ flashAt(x, y, z === 'S' ? 0.7 : z === 'M' ? 1.1 : z === 'L' ? 2 : 3.5); if (o.kill) flashAt(x, y, 2); return; }
  if (sea){ splash(x, y, z === 'S' ? 0.5 : z === 'M' ? 1 : 1.8); if (z === 'L' || z === 'XL') FXW.blast('L', x, y, {sea:true}); }
  else if (z === 'S') bfxHit(x, y, 'small');
  else if (z === 'M') bfxHit(x, y, o.art ? 'art' : 'tank');
  else if (z === 'L') FXW.blast('L', x, y, {sea:false});
  else wfxStrike('icbm', x, y, {force:true});
  if (o.kill) destroyed(x, y, sea);
  snd('impact', z, x, y); }
// a force destroyed: a bigger blast and a smoke column that fades out (drawn with the battle smoke, 26 s)
function destroyed(x, y, sea){ if (!fxLv()) return; if (fxFar()){ flashAt(x, y, 2.2); return; } FXW.blast(sea ? 'L' : 'M', x, y, {sea}); WRECKS.push({wx:x, wy:y, t0:performance.now()}); if (WRECKS.length > 30) WRECKS.shift(); snd('impact', 'L', x, y); }
// far out: a plain flash, screen-sized (r: about a province's share)
function flashAt(x, y, r){ emit('flash', x, y, {s0:6*r, s1:2*r, life:220, vx:0, vy:0}); }
// an air burst (a missile and its interceptor meet): a flash, a small fireball, sparks and a puff of smoke, world-sized
function airBurst(x, y, r){ if (!fxLv()) return; if (fxFar()){ flashAt(x, y, 1.2*r); return; }
  emit('flash', x, y, {ws:1, s0:2.6*r, s1:1*r, life:180, vx:0, vy:0}); emit('core', x, y, {ws:1, s0:0.9*r, s1:0.3*r, life:90, vx:0, vy:0});
  for (let i = 0; i < (fxLv() < 2 ? 2 : 4); i++) emit('fire', x, y, {ws:1, vx:(Math.random() - 0.5)*5*r, vy:(Math.random() - 0.5)*4*r, s0:0.7*r, s1:0.2*r, life:350 + Math.random()*250});
  for (let i = 0; i < (fxLv() < 2 ? 3 : 7); i++) emit('spark', x, y, {ws:1, s0:0.12, s1:0.06, life:500, vx:(Math.random() - 0.5)*14*r, vy:(Math.random() - 0.3)*10*r});
  bsmPuff(x, y, {r0:0.4*r, r1:1.4*r, dur:2400, vx:0.3, vy:-0.2, tone:'grey', a:0.7}); snd('impact', 'S', x, y); }
// dust kicked up by small-arms fire (a spark on water)
function kick(x, y, sea){ if (fxFar()) return; if (sea ?? seaAt(x, y)){ emit('splash', x, y, {ws:1, s0:0.18, s1:0.3, life:420, vx:0, vy:0}); return; }
  emit('dust', x, y, {ws:1, s0:0.2, s1:0.65, life:650, vx:(Math.random() - 0.5)*0.8, vy:-0.4}); if (Math.random() < 0.5) emit('spark', x, y, {ws:1, s0:0.1, s1:0.05, life:200, vx:(Math.random() - 0.5)*4, vy:-2}); }
// white water: a plume that climbs and falls back, a ring of foam (world radius r)
function splash(x, y, r){ emit('splash', x, y, {ws:1, s0:r*0.55, s1:r*1.1, life:900 + 300*r, vx:0, vy:0}); emit('ring', x, y, {ws:1, s0:r*0.4, s1:r*2.2, life:800, vx:0, vy:0}); if (fxLv() > 1) for (let i = 0; i < 3; i++) emit('splash', x + (Math.random() - 0.5)*r, y + (Math.random() - 0.5)*r*0.5, {ws:1, s0:r*0.25, s1:r*0.45, life:600, vx:0, vy:0}); }
// screen shake: only for big blasts, on screen and near the middle of the view; never on Low or Off, with reduced motion, or when turned off
function bigShake(x, y, k){ if (fxLv() < 2 || PG.SET.shake === false) return; const [sx, sy] = PG.toScreen(x, y), d = Math.hypot(sx - PG.cw/2, sy - PG.ch/2)/Math.max(1, Math.min(PG.cw, PG.ch));
  if (!onScr(sx, sy, 0) || d > 0.45) return; const f = 1 - d/0.45, amp = ({cm:3, bm:5, tac:7, icbm:9, chem:1.5}[k] || 2.5)*f; if (amp >= 1) PG.shake(amp, k === 'icbm' ? 1100 : 600); }

// ---- the missile warning: a pulsing red marker on the target (from a few seconds before impact; always for a missile aimed at the player) ----
const WARN = [];   // {wx, wy, t1 (impact, performance clock), t0, big, mine}
function warnAt(x, y, t1, big, mine){ if (WARN.length > 20) WARN.shift(); WARN.push({wx:x, wy:y, t0:performance.now(), t1, big, mine}); PG.animFast(); }
function warnMark(x, y, now, big, urgent, label){ const g = PG.ctx, p = 0.5 + 0.5*Math.sin(now/(urgent ? 90 : 180)), R = (14 + 6*big)*(1 + 0.18*p);
  g.save(); g.lineWidth = 2.2; g.strokeStyle = `rgba(232,72,60,${0.55 + 0.4*p})`; g.beginPath(); g.arc(x, y, R, 0, Math.PI*2); g.stroke();
  g.lineWidth = 1.4; g.beginPath(); for (let i = 0; i < 4; i++){ const a = i*Math.PI/2; g.moveTo(x + Math.cos(a)*R*0.55, y + Math.sin(a)*R*0.55); g.lineTo(x + Math.cos(a)*R*1.3, y + Math.sin(a)*R*1.3); } g.stroke();
  g.fillStyle = `rgba(232,72,60,${0.12 + 0.12*p})`; g.beginPath(); g.arc(x, y, R, 0, Math.PI*2); g.fill();
  if (label){ g.font = `800 10px ${PG.BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText(label).width + 10, ly = y - R - 12; g.fillStyle = 'rgba(70,12,10,.9)'; g.fillRect(x - w/2, ly - 8, w, 16); g.fillStyle = '#ffd9d4'; g.fillText(label, x, ly); }
  g.restore(); }
// a target of the player's off screen: a red arrow on the edge of the map pointing at it
function edgeArrow(tx, ty, now){ const g = PG.ctx, cx = PG.cw/2, cy = PG.ch/2, an = Math.atan2(ty - cy, tx - cx), m = 26, k = Math.min((cx - m)/Math.max(1e-6, Math.abs(Math.cos(an))), (cy - m)/Math.max(1e-6, Math.abs(Math.sin(an)))), x = cx + Math.cos(an)*k, y = cy + Math.sin(an)*k, p = 0.6 + 0.4*Math.sin(now/120);
  g.save(); g.translate(x, y); g.rotate(an); g.globalAlpha = p; g.fillStyle = '#e8483c'; g.strokeStyle = 'rgba(3,6,8,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(14, 0); g.lineTo(-8, -10); g.lineTo(-4, 0); g.lineTo(-8, 10); g.closePath(); g.stroke(); g.fill(); g.restore(); }
function drawWarn(now){ for (let i = WARN.length - 1; i >= 0; i--){ const W0 = WARN[i]; if (now > W0.t1 + 200){ WARN.splice(i, 1); continue; } if (W0.t1 - now > 3500 && !W0.mine) continue;
    const [x, y] = PG.toScreen(W0.wx, W0.wy); if (!onScr(x, y)) continue; warnMark(x, y, now, W0.big, W0.t1 - now < 3500, W0.mine && now - W0.t0 < 4000 ? 'INCOMING' : ''); }
  if (WARN.length) PG.animFast(); }

// ---- firing, by weapon. A and B: world points (the shooter's drawn spot, the target's); o: aid (the shooter's force), bid (the target's),
// hit (false: a miss, it lands beside), kill (the target was destroyed), from (false: the shooter cannot be seen, only the incoming fire shows),
// sea (the target is at sea). Weapons: tank art mlrs inf ship cruise ballistic icbm fighter bomber drone swarm recon sam ----
const CFX_W = ['tank', 'art', 'mlrs', 'inf', 'ship', 'cruise', 'ballistic', 'icbm', 'fighter', 'bomber', 'drone', 'swarm', 'recon', 'sam'];
// the weapon of a unit type
const weaponOf = t => ({tank:'tank', ifv:'tank', art:'art', mlrs:'mlrs', inf:'inf', at:'inf', spec:'inf', para:'inf', jam:'inf', sam:'sam', frig:'ship', crui:'ship', sub:'ship', carr:'ship', lst:'ship',
  jet:'fighter', int:'fighter', asf:'fighter', heli:'fighter', bomb:'bomber', stealth:'bomber', sdrone:'drone', swarm:'swarm', drone:'recon', awacs:'recon', mpa:'recon'})[t] || 'inf';
// the picture of an aircraft type (assets/art), for its strafing pass or bomb run
const AIR_IMG = {jet:'u-jet', int:'u-jet', asf:'u-air-superiority', heli:'u-attack-heli', bomb:'u-bomber', stealth:'u-bomber', sdrone:'u-strike-drone', swarm:'u-swarm-drone', drone:'u-uav-recon', mpa:'u-naval-patrol', awacs:'u-awacs'};
const airImg = t => AIR_IMG[t] || null;
function cfxFire(w, A, B, o = {}){ const lv = fxLv(); if (!lv || w === 'recon') return false;
  B = [A[0] + wdx(A[0], B[0]), B[1]]; const dx = B[0] - A[0], dy = B[1] - A[1], dist = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx), lo = lv < 2, vis = o.from !== false;
  const sea = o.sea ?? seaAt(B[0], B[1]), miss = o.hit === false, kill = !!o.kill && !miss, bid = miss ? null : o.bid;
  const spot = (r) => { const th = Math.random()*Math.PI*2, d = miss ? r*(1.4 + Math.random()*1.3) : r*Math.sqrt(Math.random()); return [B[0] + Math.cos(th)*d, B[1] + Math.sin(th)*d*0.7]; };
  const from = vis ? A : [A[0] + dx*0.55, A[1] + dy*0.55];   // (an unseen shooter: the fire shows from halfway)
  const turn = vis && o.aid != null && ['tank', 'art', 'mlrs', 'ship', 'inf', 'sam'].includes(w) ? 240 : 0; if (turn) unitFace(o.aid, ang, B);   // it turns to face the target first
  const far = fxFar();
  if (far){ cqAdd(turn, () => { if (vis) flashAt(A[0], A[1], 0.6); }); const tt = turn + Math.min(2500, 300 + dist*20); cqAdd(tt, () => { const z = w === 'icbm' ? 'XL' : w === 'cruise' || w === 'ballistic' ? 'L' : w === 'inf' || w === 'swarm' ? 'S' : 'M';
      if (w === 'cruise' || w === 'ballistic' || w === 'icbm') strikeAt(w === 'icbm' ? 'icbm' : w === 'ballistic' ? 'bm' : 'cm', B[0], B[1], {bid, sea}); else impact(z, ...spot(1), {sea, kill, bid}); }); return true; }
  const muzzle = (big, wl) => { if (!vis) return; MUZZ.push({wx:A[0], wy:A[1], ang, wl, big, t0:performance.now(), a:1}); emit('flash', A[0], A[1], {ws:1, s0:wl*1.6*big, s1:wl*0.5, life:120, vx:0, vy:0}); };
  switch (w){
    case 'tank': cqAdd(turn, () => { muzzle(1, 1.1); unitRecoil(o.aid, ang, 3); if (vis) emit('dust', A[0] - Math.cos(ang)*0.6, A[1] - Math.sin(ang)*0.4, {ws:1, s0:0.5, s1:1.5, life:800, vx:-Math.cos(ang)*0.6, vy:-0.3}); snd('fire', 'tank', A[0], A[1]);
      shot2('trc', from, spot(0.8), {dur:Math.min(600, 110 + dist*8), z:'M', sea, kill, bid}); }); break;
    case 'art': cqAdd(turn, () => { muzzle(1.5, 1.5); unitRecoil(o.aid, ang, 5); if (vis && !lo) bsmPuff(A[0], A[1], {r0:0.5, r1:1.8, dur:2800, vx:Math.cos(ang)*0.5, vy:-0.9, tone:'grey', a:0.8}); snd('fire', 'art', A[0], A[1]);
      shot2('shell', from, spot(1.2), {dur:Math.max(1000, Math.min(3000, 900 + dist*40)), arc:Math.max(4, Math.min(45, dist*0.42)), z:'M', sea, kill, bid, snd:'shell'}); }); break;   // a long shot takes longer to land (1-3 s)
    case 'mlrs': { const n = lo ? 6 : 6 + Math.floor(Math.random()*7), du = Math.max(900, Math.min(2600, 800 + dist*30)), sp = Math.max(1.5, dist*0.07);   // a ripple salvo, 80 ms apart
      cqAdd(turn, () => { unitRecoil(o.aid, ang, 2); if (vis && !lo) bsmPuff(A[0], A[1], {r0:0.5, r1:2.2, dur:3000, vx:-Math.cos(ang)*0.8, vy:-0.3, tone:'grey', a:0.7}); snd('fire', 'rocket', A[0], A[1]); });
      for (let i = 0; i < n; i++){ const T = spot(sp); cqAdd(turn + i*80, () => { muzzle(0.6, 0.7); shot2('rkt', [from[0] + (Math.random() - 0.5)*0.6, from[1] + (Math.random() - 0.5)*0.4], T, {dur:du, arc:Math.max(2, Math.min(28, dist*0.3)), z:'M', sea, kill:kill && i === n - 1, bid:i === 0 ? bid : null}); }); } break; }
    case 'inf': { const nb = lo ? 2 : 3; for (let b = 0; b < nb; b++) for (let i = 0; i < 4; i++){ const T = spot(0.9), last = b === nb - 1 && i === 3;
        cqAdd(turn + b*360 + i*60, () => { if (i === 0){ muzzle(0.5, 0.45); snd('fire', 'gun', A[0], A[1]); } shot2('dots', from, T, {dur:Math.min(420, 90 + dist*6), end:(x, y) => { kick(x, y, sea); if (last && !miss) impact('S', x, y, {sea, kill, bid}); }}); }); } break; }
    case 'ship': { const n = lo ? 2 : 3; cqAdd(turn, () => { muzzle(1.3, 1.4); unitRock(o.aid); if (vis && !lo) bsmPuff(A[0], A[1], {r0:0.5, r1:1.6, dur:2200, vy:-0.6, tone:'grey', a:0.7}); snd('fire', 'art', A[0], A[1]); });
      for (let i = 0; i < n; i++){ const T = spot(1.4); cqAdd(turn + i*140, () => shot2('shell', from, T, {dur:Math.max(900, Math.min(2600, 800 + dist*30)), arc:Math.max(3, Math.min(30, dist*0.3)), z:'M', sea:o.sea ?? seaAt(T[0], T[1]), kill:kill && i === n - 1, bid:i === 0 ? bid : null})); } break; }   // a hit on water: white plumes; a miss lands nearby
    case 'cruise': { const du = Math.max(2000, Math.min(5000, 1600 + dist*28)); if (vis){ bsmPuff(A[0], A[1], {r0:0.4, r1:1.6, dur:2400, vy:-0.5, tone:'grey', a:0.7}); snd('fire', 'rocket', A[0], A[1]); }
      return shot2('cm', from, miss ? spot(1.5) : B, {dur:du, arc:1.6, sea, bid, kill, snd:'missile'}); }
    case 'ballistic': case 'icbm': { const ic = w === 'icbm', du = ic ? Math.max(7000, Math.min(12000, 6000 + dist*12)) : Math.max(3500, Math.min(7000, 3000 + dist*18));
      if (vis){ for (let i = 0; i < (lo ? 2 : 5); i++) bsmPuff(A[0] + (Math.random() - 0.5)*0.8, A[1], {delay:i*160, r0:(ic ? 0.9 : 0.6), r1:(ic ? 3.2 : 2.2), dur:4200, vx:(Math.random() - 0.5)*0.3, vy:-(1.2 + i*0.5), tone:'grey', a:0.85});   // the launch plume and its smoke column
        emit('flash', A[0], A[1], {ws:1, s0:ic ? 4 : 2.6, s1:1, life:400, vx:0, vy:0}); snd('fire', ic ? 'icbm' : 'launch', A[0], A[1]); }
      const pr = shot2(ic ? 'icbm' : 'bm', from, B, {dur:du, arc:ic ? Math.max(120, dist*0.9) : Math.max(40, dist*0.6), sea, bid, kill, snd:'missile'}); if (pr) warnAt(B[0], B[1], pr.t0 + du, ic ? 2 : 1, !!o.mine); return pr; }
    case 'fighter': case 'bomber': { const bomber = w === 'bomber', L = bomber ? 9 : 6, ux = dx/dist, uy = dy/dist, P0 = [B[0] - ux*L, B[1] - uy*L], P1 = [B[0] + ux*L, B[1] + uy*L];   // a pass along the target, coming in from the shooter's side
      return shot2('jet', P0, P1, {dur:bomber ? 2300 : 1200, arc:bomber ? 4 : 2.4, size:bomber ? 1.3 : 1, img:o.img || (bomber ? 'u-bomber' : 'u-jet'), snd:'jet',
        ev:bomber ? {t:'bombs', n:lo ? 4 : 6, k0:0.34, k1:0.66, sea, kill, bid} : {t:'strafe', k0:0.22, k1:0.62, sea}, end:() => { if (!bomber && bid != null && !miss) impact('S', ...spot(0.5), {sea, kill, bid}); }}); }
    case 'drone': { const ux = dx/dist, uy = dy/dist, S0 = [B[0] - ux*4, B[1] - uy*4]; snd('fire', 'drone', B[0], B[1]); return shot2('drn', S0, miss ? spot(1) : B, {dur:1100, arc:6, z:'M', sea, kill, bid, img:o.img}); }   // a strike drone dives straight in
    case 'swarm': { const n = lo ? 4 : 7, a0 = ang + Math.PI; for (let i = 0; i < n; i++){ const th = a0 + (i - (n - 1)/2)*0.55 + (Math.random() - 0.5)*0.3, R = 5 + Math.random()*2, S0 = [B[0] + Math.cos(th)*R, B[1] + Math.sin(th)*R*0.7], T = spot(0.9);   // several small dots converging from different angles
        shot2('dot', S0, T, {delay:i*70, dur:900 + Math.random()*300, arc:2.5, z:'S', sea, kill:kill && i === n - 1, bid:i === 0 ? bid : null}); } snd('fire', 'drone', B[0], B[1]); return true; }
    case 'sam': return intercept(A, B, o); }
  return true; }
// air defence: an interceptor streak climbs from A and meets an incoming missile (or drone) over B; both burst. The incoming one is drawn on its
// last stretch (it flies in from the far side), so the player sees the shot being stopped
function intercept(A, B, o = {}){ if (!fxLv()) return false; B = [A[0] + wdx(A[0], B[0]), B[1]]; const k = o.kind || 'cm', hM = k === 'bm' ? 9 : k === 'dot' ? 2 : 3, du = 900;
  const dir = o.dir ?? (Math.atan2(B[1] - A[1], B[0] - A[0]) + Math.PI*0.6), inA = [B[0] + Math.cos(dir)*14, B[1] + Math.sin(dir)*10];
  if (fxFar()){ cqAdd(du, () => airBurst(B[0], B[1] - hM, 1)); return true; }
  const inc = shot2(k === 'bm' ? 'bm' : k === 'dot' ? 'drn' : 'cm', inA, B, {dur:du/0.8, arc:1, cut:0.8}); if (inc) inc.arc = hM/Math.max(0.05, prAt(inc, 0.8)[2]);   // stopped at 80 % of its run, at height hM
  const M = inc ? prAt(inc, 0.8) : [B[0], B[1], hM]; if (o.aid != null) unitFace(o.aid, Math.atan2(M[1] - A[1], M[0] - A[0]));
  cqAdd(Math.max(0, du - 520), () => { if (o.from !== false){ emit('flash', A[0], A[1], {ws:1, s0:1.2, s1:0.4, life:140, vx:0, vy:0}); snd('fire', 'sam', A[0], A[1]); } shot2('icpt', o.from !== false ? A : [(A[0] + M[0])/2, (A[1] + M[1])/2], [M[0], M[1]], {dur:520, arc:M[2], end:(x, y, h) => airBurst(x, y - h, k === 'bm' ? 1.4 : 1)}); });
  return true; }

// ---- missiles in flight (the rules' S.inflight): a cruise missile low and weaving with its exhaust trail, a ballistic missile on a tall arc
// over its smoke column, the launch plume; the warning on a target of the player's (a pulsing red marker, INCOMING at first). Shown when the
// player launched it, can see where it flies from or to, or is its target (always) ----
const MSL = {seen:new Map()};   // missile id -> when first drawn (its launch plume, the alert)
function drawMissiles(now, vis){ const L = S.inflight; if (!L || !L.length){ if (MSL.seen.size) MSL.seen.clear(); return; } const g = PG.ctx, s = PG.view.s, lv = fxLv();
  for (const m of L){ const B = G.P[m.to], mine = S.owner[m.to] === PG.PLAYER || stationaryAt(m.to).some(b => b.owner === PG.PLAYER);
    if (!(m.owner === PG.PLAYER || mine || vis.has(m.to) || vis.has(m.from))) continue;
    const q0 = PG.missilePos(m), A = q0.A, first = !MSL.seen.has(m.id); if (first){ MSL.seen.set(m.id, now); if (MSL.seen.size > 200) MSL.seen.delete(MSL.seen.keys().next().value);
      if (lv && q0.t < 0.15 && (m.owner === PG.PLAYER || vis.has(m.from))){ for (let i = 0; i < (lv < 2 ? 2 : 4); i++) bsmPuff(A.x + (Math.random() - 0.5)*0.8, A.y, {delay:i*150, r0:0.6, r1:m.k === 'bm' ? 2.4 : 1.4, dur:4000, vy:-(0.8 + i*0.5), tone:'grey', a:0.8}); snd('fire', m.k === 'bm' ? 'launch' : 'rocket', A.x, A.y); }
      if (mine && m.owner !== PG.PLAYER){ snd('alert', 'alert', B.x, B.y, true); if (PG.missileAlert) PG.missileAlert(m); } }
    const [x, y] = PG.toScreen(q0.x, q0.y), t = q0.t, d = Math.hypot(B.x - A.x, B.y - A.y), hpx = PG.HOURS_PER_SEC[S.speed] || 0, left = hpx > 0 ? (1 - t)/m.dt/hpx*1000 : Infinity;
    const at = tt => { tt = Math.max(0, Math.min(1, tt)); let px = A.x + (B.x - A.x)*tt, py = A.y + (B.y - A.y)*tt - Math.sin(tt*Math.PI)*q0.arc; if (m.k !== 'bm'){ const w = Math.sin(tt*Math.PI*9 + m.id)*Math.min(1.2, d*0.01)*Math.sin(tt*Math.PI); px += -(B.y - A.y)/(d || 1)*w; py += (B.x - A.x)/(d || 1)*w; } return [x + (px - q0.x)*s, y + (py - q0.y)*s]; };
    const [hx, hy] = at(t);
    if (onScr(hx, hy, 60)){ if (lv){ const span = m.k === 'bm' ? Math.min(t, 0.3) : 0.12, n = lv < 2 ? 6 : 12; g.lineCap = 'round'; let [px, py] = [hx, hy];   // the trail (no particles: a fading line back along the path)
        for (let j = 1; j <= n; j++){ const [qx, qy] = at(t - span*j/n), f = 1 - j/n; g.globalAlpha = (m.k === 'bm' ? 0.6 : 0.45)*f; g.strokeStyle = 'rgb(226,224,218)'; g.lineWidth = Math.max(1, (m.k === 'bm' ? 0.35 : 0.14)*s*(1 + 1.5*(1 - f))); g.beginPath(); g.moveTo(px, py); g.lineTo(qx, qy); g.stroke(); px = qx; py = qy; } g.globalAlpha = 1; }
      const [nx, ny] = at(t + 0.01), ang = Math.atan2(ny - hy, nx - hx);
      g.save(); g.translate(hx, hy); g.rotate(ang); g.globalCompositeOperation = 'lighter'; g.drawImage(GLOW(), -22, -9, 22, 18); g.globalCompositeOperation = 'source-over';
      const L0 = m.k === 'bm' ? 16 : 11, MQ = L0*1.5/0.95, mp = PG.ART.sprite(m.k === 'bm' ? 'u-ballistic-missile' : 'u-cruise-missile', Math.round(MQ*PG.dpr));   // the owner's missile picture (nose up: turned along the flight) once loaded, else the drawn arrowhead
      if (mp){ g.rotate(Math.PI/2); g.drawImage(mp, -MQ/2, -MQ/2, MQ, MQ); } else { g.fillStyle = '#e8e4da'; g.strokeStyle = '#1a1c1b'; g.lineWidth = 1; g.beginPath(); g.moveTo(L0/2, 0); g.lineTo(-L0/2, -2.2); g.lineTo(-L0/2, 2.2); g.closePath(); g.fill(); g.stroke(); }
      g.restore(); }
    // the target: a pulsing red marker when it is the player's (all through the flight, INCOMING for the first 4 s), and for any missile in the last seconds
    if (mine && m.owner !== PG.PLAYER){ const [tx, ty] = PG.toScreen(B.x, B.y); if (!onScr(tx, ty, -10)) edgeArrow(tx, ty, now); }
    if ((mine && m.owner !== PG.PLAYER) || left < 4000){ const [tx, ty] = PG.toScreen(B.x, B.y); if (onScr(tx, ty)) warnMark(tx, ty, now, m.k === 'bm' ? 1 : 0.6, left < 4000, mine && m.owner !== PG.PLAYER && now - MSL.seen.get(m.id) < 4000 ? 'INCOMING' : ''); } }
  PG.animFast(); }

// ---- sound: each effect has three slots, fire, flight and impact, played by synthesized placeholders (WebAudio noise and oscillator envelopes,
// original), louder near the middle of the view and when zoomed in, silent far off screen; off with the game's mute or the Effect sounds setting ----
const SND = {nb:null, last:new Map(), n:0, t:0};
function sndNoise(c){ if (SND.nb && SND.nb.sampleRate === c.sampleRate) return SND.nb; const n = c.sampleRate, b = c.createBuffer(1, n, n), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random()*2 - 1; return (SND.nb = b); }
// gain for an effect at world (x, y): by its distance from the middle of the view (screens) and the zoom
function sndGain(x, y){ const [sx, sy] = PG.toScreen(x, y), d = Math.hypot(sx - PG.cw/2, sy - PG.ch/2)/Math.max(1, Math.max(PG.cw, PG.ch)); if (d > 1.1) return 0;
  const z = Math.max(0.3, Math.min(1, PG.view.s*HS0/90)); return Math.max(0, 1 - d/1.1)*z; }
const SND_DEF = {   // slot:kind -> [noise filter Hz, noise s, osc start Hz, osc end Hz, osc s, gain]
  'fire:gun':[2400, 0.06, 0, 0, 0, 0.18], 'fire:tank':[700, 0.18, 120, 50, 0.22, 0.45], 'fire:art':[420, 0.35, 90, 38, 0.4, 0.55], 'fire:rocket':[1600, 0.6, 0, 0, 0, 0.28],
  'fire:launch':[500, 1.4, 70, 40, 1.2, 0.5], 'fire:icbm':[320, 2.4, 55, 30, 2, 0.6], 'fire:sam':[2000, 0.5, 0, 0, 0, 0.25], 'fire:drone':[0, 0, 220, 240, 0.6, 0.08],
  'flight:shell':[3000, 0.4, 0, 0, 0, 0.05], 'flight:missile':[900, 1.2, 0, 0, 0, 0.12], 'flight:jet':[600, 1.6, 0, 0, 0, 0.2],
  'impact:S':[1800, 0.12, 0, 0, 0, 0.18], 'impact:M':[600, 0.45, 80, 35, 0.4, 0.45], 'impact:L':[300, 1.2, 60, 25, 1, 0.7], 'impact:XL':[180, 3, 40, 18, 2.6, 0.9],
  'alert:alert':[0, 0, 880, 660, 0.5, 0.18]};
function snd(slot, kind, x, y, always){ const c = PG.AC; if (!c || PG.muted || !PG.master || PG.SET.fxSnd === false || !fxLv() || c.state !== 'running') return;
  const D = SND_DEF[slot + ':' + kind]; if (!D) return; const now = performance.now(), key = slot + kind; if (now - (SND.last.get(key) || 0) < (slot === 'fire' && kind === 'gun' ? 90 : 60)) return;
  if (now - SND.t > 100){ SND.t = now; SND.n = 0; } if (++SND.n > 5) return;   // at most 5 sounds started per 100 ms
  const gn = always ? 1 : sndGain(x, y); if (gn < 0.03) return; SND.last.set(key, now);
  try { const t = c.currentTime, out = c.createGain(); out.gain.value = D[5]*gn; out.connect(PG.master);
    if (D[1] > 0){ const src = c.createBufferSource(); src.buffer = sndNoise(c); const f = c.createBiquadFilter(); f.type = slot === 'flight' ? 'bandpass' : 'lowpass'; f.frequency.setValueAtTime(D[0], t); if (slot === 'flight') f.frequency.exponentialRampToValueAtTime(D[0]*0.5, t + D[1]);
      const e = c.createGain(); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(1, t + (slot === 'flight' ? D[1]*0.4 : 0.008)); e.gain.exponentialRampToValueAtTime(0.0001, t + D[1]);
      src.connect(f); f.connect(e); e.connect(out); src.start(t, Math.random()*0.5, D[1] + 0.05); }
    if (D[4] > 0){ const o = c.createOscillator(), e = c.createGain(); o.type = kind === 'alert' ? 'square' : 'sine'; o.frequency.setValueAtTime(D[2], t); o.frequency.exponentialRampToValueAtTime(D[3], t + D[4]);
      e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(kind === 'alert' ? 0.4 : 1, t + 0.01); e.gain.exponentialRampToValueAtTime(0.0001, t + D[4]); o.connect(e); e.connect(out); o.start(t); o.stop(t + D[4] + 0.05); }
  } catch (e) {} }

/* ================= Aircraft flight (Part 3): no gliding =================
   The page's drawn flight (index.html wingVis) moves with flightStep: the aircraft flies along its own heading and turns towards its goal (the
   rules' position at the hour, flightPos / wingPos, the target, a point ahead on its patrol loop, its base) at a capped turn rate, so its path is
   a smooth curve and its nose points along it; it speeds up after take-off and slows down to land (within ~26 world px of its base); when the
   rules' position runs ahead it catches up and is never more than `lim` behind (a steady pull, no jump); v.turn (rad/s) gives the bank. */
const smooth01f = t => t <= 0 ? 0 : t >= 1 ? 1 : t*t*(3 - 2*t);
function flightStep(v, gx, gy, dt, o){ const dx = wdx(v.x, gx), dy = gy - v.y, d = Math.hypot(dx, dy); if (!(dt > 0)){ v.turn = 0; return d < 0.05; }
  if (v.hd === undefined || !isFinite(v.hd)) v.hd = d > 1e-4 ? Math.atan2(dy, dx) : 0;
  let spd = o.spd; if (o.base){ const dB = Math.hypot(wdx(v.x, o.base[0]), v.y - o.base[1]); spd *= 0.28 + 0.72*smooth01f(dB/26); }   // slow near its base: the take-off run and the landing
  if (o.chase && d > 4) spd *= Math.min(2.2, 1 + (d - 4)/18);   // behind the rules' position: it catches up
  const da = Math.atan2(Math.sin(Math.atan2(dy, dx) - v.hd), Math.cos(Math.atan2(dy, dx) - v.hd)), w = Math.max(1.6, Math.min(8, spd/Math.max(2, d)*1.6)), lim = w*dt;
  const turn = d > 1e-4 ? Math.max(-lim, Math.min(lim, da)) : 0; v.hd = Math.atan2(Math.sin(v.hd + turn), Math.cos(v.hd + turn)); v.turn = turn/dt; v.want = v.hd;
  const step = spd*dt*(Math.abs(da) > 2 && d < 8 ? 0.45 : 1);   // (a sharp turn close to its goal: it slows rather than overshoots)
  if (d <= step*1.1){ v.x += dx; v.y = gy; return true; }
  v.x += Math.cos(v.hd)*step; v.y += Math.sin(v.hd)*step;
  if (o.lim){ const ex = wdx(v.x, gx), ey = gy - v.y, e = Math.hypot(ex, ey); if (e > o.lim){ const k = (e - o.lim)/e; v.x += ex*k; v.y += ey*k; } }
  v.x = gx - wdx(v.x, gx);   // (on the copy of the world nearest its goal: across the seam its distances stay short)
  return false; }

/* ================= Orders and taps (Part 4): target marker, dashed line, range ring =================
   An attack order (a Bombard, or a move onto enemy forces) shows a target marker on the target and a dashed line from the attacker to it for
   3.5 s, and the attacker turns to face it; tapping a force in combat shows its range ring and its current target for 2.5 s; the Effects test
   panel marks its test target. The markers are static with Effects Off (the dashes do not run), and are drawn over the counters. */
const MARKS = [];   // {aid, bid: forces (their drawn spot), A, B: world points when no force, r: a range ring round the attacker (world px), t0, dur, kind}
function orderMark(o){ const m = Object.assign({t0:performance.now(), dur:3500, kind:'order'}, o); MARKS.push(m); if (MARKS.length > 12) MARKS.shift();
  const A = markPt(m.aid, m.A), B = markPt(m.bid, m.B); if (m.kind === 'order' && m.aid != null && A && B) unitFace(m.aid, Math.atan2(B[1] - A[1], wdx(A[0], B[0])), B);
  PG.redraw(); PG.animFast(); return m; }
function markPt(id, P){ if (id != null){ const a = armyById(id); if (a && count(a)) return PG.dispPos(a); } return P || null; }
// the target marker: a ring with four brackets (css px)
function targetMark(g, x, y, R, col, a){ g.save(); g.globalAlpha = a; g.lineWidth = 3.5; g.strokeStyle = 'rgba(3,6,8,.55)'; const path = () => { g.beginPath(); g.arc(x, y, R, 0, Math.PI*2);
    for (let i = 0; i < 4; i++){ const an = Math.PI/4 + i*Math.PI/2, c = Math.cos(an), s0 = Math.sin(an); g.moveTo(x + c*R*1.25, y + s0*R*1.25); g.lineTo(x + c*R*1.7, y + s0*R*1.7); }
    g.moveTo(x - 3, y); g.lineTo(x + 3, y); g.moveTo(x, y - 3); g.lineTo(x, y + 3); }; path(); g.stroke(); g.lineWidth = 1.8; g.strokeStyle = col; path(); g.stroke(); g.restore(); }
function drawMarks(now){ if (!MARKS.length) return; const g = PG.ctx, s = PG.view.s, lv = fxLv();
  for (let i = MARKS.length - 1; i >= 0; i--){ const m = MARKS[i], age = now - m.t0; if (age > m.dur){ MARKS.splice(i, 1); continue; }
    const a = Math.min(1, age/150, (m.dur - age)/600), A = markPt(m.aid, m.A), B = markPt(m.bid, m.B); if (!A && !B) continue;
    const [ax, ay] = A ? PG.toScreen(A[0], A[1]) : [0, 0], [bx, by] = B ? (A ? [ax + wdx(A[0], B[0])*s, ay + (B[1] - A[1])*s] : PG.toScreen(B[0], B[1])) : [0, 0];
    const col = m.kind === 'tap' ? 'rgba(255,214,120,.95)' : 'rgba(255,120,96,.95)';
    if (A && m.r > 0){ g.save(); g.globalAlpha = a*0.9; g.setLineDash([6, 5]); g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,214,120,.85)'; g.beginPath(); g.arc(ax, ay, Math.max(8, m.r*s), 0, Math.PI*2); g.stroke(); g.setLineDash([]); g.restore(); }
    if (A && B && Math.hypot(bx - ax, by - ay) > 6){ g.save(); g.globalAlpha = a; g.lineCap = 'round'; g.setLineDash([8, 6]); g.lineDashOffset = lv ? -now/40 : 0;   // the dashes run towards the target
      g.lineWidth = 3.4; g.strokeStyle = 'rgba(3,6,8,.45)'; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); g.lineWidth = 1.8; g.strokeStyle = col; g.stroke(); g.setLineDash([]); g.restore(); }
    if (B) targetMark(g, bx, by, 11 + (lv ? 2*Math.sin(age/140) : 0), col, a); }
  if (MARKS.length){ if (lv) PG.animFast(); else PG.redraw(250); } }
// tapping a force in combat (fighting in a battle, firing at a target, or fired at in the last 8 s): its range ring and its current target, briefly
function tapCombat(a){ if (!a || a.air || !count(a)) return false; const A = ANIM.get(a.id), now = performance.now(), fighting = S.battles.includes(a.at);
  let bid = null, B = null;
  if (a.tgt){ if (a.tgt.id != null && armyById(a.tgt.id)) bid = a.tgt.id; else if (a.tgt.p != null) B = [G.P[a.tgt.p].x, G.P[a.tgt.p].y]; }
  if (bid == null && !B && A && now - A.ft < 8000 && A.tx != null) B = [A.tx, A.ty];
  if (bid == null && !B && fighting){ const foe = S.armies.find(b => b.at === a.at && b !== a && count(b) && !b.air && atWar(a.owner, b.owner)); if (foe) bid = foe.id; }
  if (!fighting && bid == null && !B) return false;
  const km = rangeOf(a); orderMark({aid:a.id, bid, B, r:km > 0 ? km*KM_W : 3, dur:2500, kind:'tap'}); return true; }

/* ================= Phones and battery (Part 5) =================
   One animation loop for everything: the page's redraw scheduler (RD). Every effect registers a fast frame only while it runs (PROJ, PART, CQ,
   WARN, MARKS, the strike effects ...), so the loop stops drawing when nothing is active (Battery saver: no draws when static). Off-screen
   effects are not drawn (their clocks run on). Effects quality: SET.fx 'high' | 'low' | 'off' (fxLv); the default is High on a desktop, Low
   on a phone, and the device's reduce-motion setting counts as Low (no screen shake, fewer particles, no contrails). */
const fxStats = () => ({part:PART.length, proj:PROJ.length, cq:CQ.length, warn:WARN.length, marks:MARKS.length, wfx:WFX.list.length, puffs:BSM.puffs.length, art:AFX.puff.length + AFX.boom.length, pool:[PFREE.length, PRFREE.length]});

return {/*@TEST*/setReact:v => { RX.on = !!v; },/*@ENDTEST*/ AFX, orderMark, drawMarks, tapCombat, targetMark, fxStats, flightStep, airImg, wdx, fxLv, fxFar, cfxFire, CFX_W, weaponOf, intercept, impact, destroyed, strikeAt, unitAnim, unitHitMark, unitFace, unitHit, drawMissiles, drawWarn, warnMark, cqRun, snd, airBurst, splash, ANIM, WARN, CQ,
  BFX,
  BSM,
  CLPOS,
  FXG,
  FXW,
  GLOW,
  MUZZ,
  PART,
  get PLATEBOX(){ return PLATEBOX; }, set PLATEBOX(v){ PLATEBOX = v; },
  get PLATECLIP(){ return PLATECLIP; }, set PLATECLIP(v){ PLATECLIP = v; },
  PROJ,
  SCORCH,
  SPR,
  get VOLA(){ return VOLA; }, set VOLA(v){ VOLA = v; },
  WFX,
  WRECKS,
  afxAmbient,
  afxCrater,
  afxMark,
  afxPuff,
  battleBadge,
  bfxFigure,
  bfxFoes,
  bfxOwn,
  drawBattleSmoke,
  drawCraters,
  drawParticlesOver,
  drawParticlesUnder,
  drawTrailDust,
  drawWFX,
  drawWFXFlash,
  emit,
  explode,
  figVolley,
  fxOff,
  fxRetire,
  fxh,
  lastDust,
  plateBoxes,
  plateClipOn,
  shoot,
  softSprite,
  volley,
  wfxCap,
  wfxCover,
  wfxFire,
  wfxRing,
  wfxScorch,
  wfxSmoke,
  wfxStart,
  wfxStrike};
};
