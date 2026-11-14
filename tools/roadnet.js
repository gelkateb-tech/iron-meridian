// The movement network of lines.js (MAP-3), used by tools/build-lines.js:
//   ROADS  every land province with a land neighbour has at least one road (level 2 or 3) to a neighbour, and every road link between two
//          neighbouring provinces is a drawn way from one province's centre point (P.x, P.y: the city, or the cell nearest the middle of a
//          province without one) to the other's, so the roads of a province meet at its centre. The way follows the Natural Earth roads where
//          they run (they are joined where the way leaves or meets them) and is generated where there is no road data: a least-cost walk over a
//          lattice of points a third of a cell apart, on land only (the baked land mask and the lakes), costed by the ground it crosses (per-cell
//          terrain: mountains, marshes, hills and forest cost more, so a new road goes round them through the plains and valleys).
//   LANES  the sea-lane network the warships sail on: one way through open water from each sea zone's centre to each neighbouring zone's,
//          through the straits and canals where two waters meet only there, and one from each coastal province's centre out to each sea zone it
//          touches (the ports). The same lattice walk, on water, kept off the land.
// Everything is deterministic (no randomness, fixed orders). Both maps of the game get theirs: the map of world.js (classic) and the nations
// world's province split laid over it (nations.js NATIONS.map); what is the same on both is written once.
'use strict';
const path = require('path'), fs = require('fs'), zlib = require('zlib');
const ROOT = path.join(__dirname, '..');

// ---- the baked land mask (assets/landmask.png, alpha = land) with the big lakes (coast.js LAKES) cut out
function readPNG(file){ const d = fs.readFileSync(file); let p = 8, w = 0, h = 0, ct = 0, bd = 0, il = 0; const idat = [];
  while (p < d.length){ const len = d.readUInt32BE(p), type = d.toString('latin1', p + 4, p + 8), body = d.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR'){ w = body.readUInt32BE(0); h = body.readUInt32BE(4); bd = body[8]; ct = body[9]; il = body[12]; } else if (type === 'IDAT') idat.push(body); else if (type === 'IEND') break; p += 12 + len; }
  if (bd !== 8 || (ct !== 6 && ct !== 4) || il) throw new Error('landmask.png: only 8-bit RGBA / grey+alpha, not interlaced');
  const bpp = ct === 6 ? 4 : 2, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w*bpp, out = Buffer.alloc(h*stride), A = new Uint8Array(w*h);
  for (let y = 0; y < h; y++){ const f = raw[y*(stride + 1)], src = y*(stride + 1) + 1, o = y*stride;
    for (let x = 0; x < stride; x++){ const a = x >= bpp ? out[o + x - bpp] : 0, b = y ? out[o - stride + x] : 0, c = x >= bpp && y ? out[o - stride + x - bpp] : 0, v = raw[src + x];
      let r; switch (f){ case 0: r = v; break; case 1: r = v + a; break; case 2: r = v + b; break; case 3: r = v + ((a + b) >> 1); break;
        case 4: { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); break; }
        default: throw new Error('landmask.png: filter ' + f); }
      out[o + x] = r & 255; }
    for (let x = 0; x < w; x++) A[y*w + x] = out[o + x*bpp + bpp - 1]; }
  return {w, h, A}; }

module.exports = function roadnet({WD, R, maps, neRoads, terrc, lakes, proj, log = console.log}){
  const {W, H} = WD, HS = R.HS, SQ3 = Math.sqrt(3), CW = HS*SQ3, RH = HS*1.5, OX = R.OX, OY = R.OY, KY = RH/CW;   // KY: a row's height in cell widths (0.866)
  const S = 1/3;                                                    // lattice spacing (cell widths)
  // ---- coordinates: Q = the grid x20 integers lines.js stores (fx*20, fy*20); m = metric (cell widths, rows scaled by KY); w = world
  const q2m = (X, Y) => [X/20, Y/20*KY], m2w = (mx, my) => [OX + CW*mx, OY + RH*my/KY], w2q = (x, y) => [Math.round((x - OX)/CW*20), Math.round((y - OY)/RH*20)];
  const m2q = (mx, my) => [Math.round(mx*20), Math.round(my/KY*20)], ll2m = (lon, lat) => { const [fx, fy] = proj(lon, lat); return [fx, fy*KY]; };
  // ---- land mask + lakes
  const MK = readPNG(path.join(ROOT, 'assets/landmask.png')), WW = CW*(W + 0.5) + 16, WH = RH*(H - 1) + 2*HS + 16, kx = MK.w/WW, ky = MK.h/WH;
  { const L = new Uint8Array(MK.w*MK.h);   // even-odd fill of the lake rings, then cut from the mask
    for (const ring of lakes){ let x = 0, y = 0; const pts = []; for (let i = 0; i < ring.length; i += 2){ x += ring[i]; y += ring[i + 1]; const [wx, wy] = [OX + CW*x/10, OY + RH*y/10]; pts.push([wx*kx, wy*ky]); }
      let y0 = Infinity, y1 = -Infinity; for (const p of pts){ y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
      for (let py = Math.max(0, Math.floor(y0)); py <= Math.min(MK.h - 1, Math.ceil(y1)); py++){ const yc = py + 0.5, xs = [];
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++){ const [xa, ya] = pts[i], [xb, yb] = pts[j]; if ((ya > yc) !== (yb > yc)) xs.push(xa + (yc - ya)/(yb - ya)*(xb - xa)); }
        xs.sort((a, b) => a - b); for (let k = 0; k + 1 < xs.length; k += 2) for (let px = Math.max(0, Math.ceil(xs[k] - 0.5)); px <= Math.min(MK.w - 1, Math.floor(xs[k + 1] - 0.5)); px++) L[py*MK.w + px] ^= 1; } }
    for (let i = 0; i < L.length; i++) if (L[i]) MK.A[i] = 0; }
  const landAtW = (x, y) => { const px = Math.floor(x*kx), py = Math.floor(y*ky); return px >= 0 && py >= 0 && px < MK.w && py < MK.h && MK.A[py*MK.w + px] >= 128; };
  const landAtM = (mx, my) => { const [x, y] = m2w(mx, my); return landAtW(x, y); };
  // ---- terrain per cell (index.html TERRC: plains, forest, mountain, desert, tundra, hills, marsh, snow), as a road builder's cost
  const TCLS = new Uint8Array(W*H); { const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', ix = new Int8Array(128).fill(-1); for (let i = 0; i < 64; i++) ix[AL.charCodeAt(i)] = i;
    let k = 0; for (let i = 0; i < terrc.length && k < W*H;){ const v = ix[terrc.charCodeAt(i++)], L = v & 7, n = L < 7 ? L + 1 : ix[terrc.charCodeAt(i++)]*64 + ix[terrc.charCodeAt(i++)] + 8; TCLS.fill(v >> 3, k, Math.min(W*H, k + n)); k += n; }
    if (k !== W*H) throw new Error('TERRC does not cover the grid'); }
  const TCOST = [1, 1.3, 2.6, 1.08, 1.2, 1.6, 1.9, 2.2];
  const cellAtM = (mx, my) => { const [x, y] = m2w(mx, my); return R.worldToCell(x, y); };

  // ---- the road graph: polylines of vertex objects {X, Y} (Q units); the Natural Earth roads (lines.js roads, untouched; junctions where a way
  // joins them are recorded as insertions) and the generated ones. tag: 's' shared by both maps, else the map's number (a map's own phase)
  const lines = [];   // {id, cls, v:[vertex], ne:index in lines.js roads or -1, tag, dead}
  for (let i = 0; i < neRoads.length; i++){ const L = neRoads[i]; lines.push({id:lines.length, cls:L.cls, v:L.pts.map(([X, Y]) => ({X, Y, o:true})), ne:i, tag:'s', dead:false}); }
  const GB = 4;   // segment index: blocks of GB cells (metric)
  const grid = new Map(), gk = (bx, by) => bx*65536 + by;
  const indexLine = L => { const seen = new Set(); for (let i = 1; i < L.v.length; i++){ const [ax, ay] = q2m(L.v[i - 1].X, L.v[i - 1].Y), [bx, by] = q2m(L.v[i].X, L.v[i].Y);
      for (let x = Math.floor(Math.min(ax, bx)/GB); x <= Math.floor(Math.max(ax, bx)/GB); x++) for (let y = Math.floor(Math.min(ay, by)/GB); y <= Math.floor(Math.max(ay, by)/GB); y++){ const k = gk(x, y); if (seen.has(k)) continue; seen.add(k); let g = grid.get(k); if (!g) grid.set(k, g = []); g.push(L.id); } } };
  for (const L of lines) indexLine(L);
  const RCOST = [0.75, 0.62, 0.48, 0.4];   // cost per length along a road of class 1..3 (0: unused)

  // ---- one least-cost walk on the lattice (plus roads for ROADS), inside the cells `ok` allows, from point A to point B (metric)
  // opt: {pass(mx, my, cell) -> cost factor or 0 (impassable), roads:{lv, shared:bool (only vertices of shared lines may be joined)}, bbox}
  function walk(A, B, okCell, opt){
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const c of opt.cells){ const [x, y] = R.cellCenter(c), mx = (x - OX)/CW, my = (y - OY)/CW; x0 = Math.min(x0, mx); x1 = Math.max(x1, mx); y0 = Math.min(y0, my); y1 = Math.max(y1, my); }
    x0 -= 0.8; y0 -= 0.8; x1 += 0.8; y1 += 0.8; const i0 = Math.floor(x0/S), j0 = Math.floor(y0/S), NI = Math.ceil(x1/S) - i0 + 1, NJ = Math.ceil(y1/S) - j0 + 1, NL = NI*NJ;
    if (NL > 4e6) return null;
    // lattice nodes: cost factor (0: impassable)
    const fac = new Float32Array(NL);
    for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++){ const mx = (i0 + i)*S, my = (j0 + j)*S, c = cellAtM(mx, my); if (c < 0 || !okCell(c)) continue; fac[j*NI + i] = opt.pass(mx, my, c); }
    // road access points (ROADS only): every vertex of a line within the cells, and points along its segments about S apart
    const AX = [], AY = [], AREF = [];   // AREF: per access point, its places on lines [{L, U, V, t, v}] (v: the vertex itself, or null between U and V)
    const aAdj = [];   // per access point: [[node, cost, line], ...] (along the lines)
    const nodeOfV = new Map();   // vertex key "X,Y" -> access index (lines meeting at one point share it)
    if (opt.roads){ const ids = new Set(); for (let x = Math.floor(x0/GB); x <= Math.floor(x1/GB); x++) for (let y = Math.floor(y0/GB); y <= Math.floor(y1/GB); y++){ const g = grid.get(gk(x, y)); if (g) for (const id of g) ids.add(id); }
      const addA = (mx, my, ref) => { const k = ref.v ? ref.v.X + ',' + ref.v.Y : null; if (k !== null && nodeOfV.has(k)){ const n = nodeOfV.get(k); AREF[n].push(ref); return n; } const n = AX.length; AX.push(mx); AY.push(my); AREF.push([ref]); aAdj.push([]); if (k !== null) nodeOfV.set(k, n); return n; };
      const join = (p, a, L) => { const w = Math.hypot(AX[a] - AX[p], AY[a] - AY[p])*RCOST[L.cls]*(L.cls < opt.roads.lv ? 1.15 : 1); aAdj[p].push([a, w, L]); aAdj[a].push([p, w, L]); };
      for (const id of [...ids].sort((a, b) => a - b)){ const L = lines[id]; if (L.dead || (L.tag !== 's' && L.tag !== opt.tag)) continue; const fixed = opt.roads.shared && L.tag === 's' && opt.tag !== 's';
        let prev = -1;
        for (let s = 0; s < L.v.length; s++){ const V = L.v[s], [mx, my] = q2m(V.X, V.Y), c = cellAtM(mx, my), inR = c >= 0 && okCell(c);
          if (s > 0){ const U = L.v[s - 1], [ux, uy] = q2m(U.X, U.Y), len = Math.hypot(mx - ux, my - uy), n = fixed ? 1 : Math.max(1, Math.ceil(len/S));
            for (let k = 1; k < n; k++){ const t = k/n, px = ux + (mx - ux)*t, py = uy + (my - uy)*t, cc = cellAtM(px, py);
              if (!(cc >= 0 && okCell(cc))){ prev = -1; continue; } const a = addA(px, py, {L, U, V, t, v:null}); if (prev >= 0) join(prev, a, L); prev = a; } }
          if (!inR){ prev = -1; continue; }
          const a = addA(mx, my, {L, U:V, V, t:0, v:V}); if (prev >= 0 && prev !== a) join(prev, a, L); prev = a; } } }
    const NA = AX.length, NN = NL + NA + 2, nA = NL + NA, nB = nA + 1;   // node ids: lattice, access points, A, B
    // links between access points and the lattice (and A, B), in both directions
    const extra = new Map(), addE = (u, v, w) => { let e = extra.get(u); if (!e) extra.set(u, e = []); e.push([v, w]); e = extra.get(v); if (!e) extra.set(v, e = []); e.push([u, w]); };
    const near = (mx, my, r) => { const out = []; for (let j = Math.floor((my - r)/S) - j0; j <= Math.ceil((my + r)/S) - j0; j++) for (let i = Math.floor((mx - r)/S) - i0; i <= Math.ceil((mx + r)/S) - i0; i++){ if (i < 0 || j < 0 || i >= NI || j >= NJ) continue; const n = j*NI + i; if (!fac[n]) continue; const d = Math.hypot((i0 + i)*S - mx, (j0 + j)*S - my); if (d <= r) out.push([n, d]); } return out; };
    for (let a = 0; a < NA; a++) for (const [n, d] of near(AX[a], AY[a], S*1.05)) addE(NL + a, n, Math.max(1e-4, d)*fac[n]);
    for (const [id, P] of [[nA, A], [nB, B]]){ let got = false; for (const [n, d] of near(P[0], P[1], S*1.6)){ addE(id, n, Math.max(1e-4, d)*fac[n]); got = true; }
      for (let a = 0; a < NA; a++){ const d = Math.hypot(AX[a] - P[0], AY[a] - P[1]); if (d <= S*1.6){ addE(id, NL + a, Math.max(1e-4, d)*1.0); got = true; } }
      if (!got){ const nn = near(P[0], P[1], S*4); nn.sort((x, y) => x[1] - y[1]); for (const [n, d] of nn.slice(0, 3)) addE(id, n, d*3); } }
    // Dijkstra (binary heap)
    const dist = new Float64Array(NN).fill(Infinity), prev = new Int32Array(NN).fill(-1), via = new Array(NN).fill(null), hk = [], hv = [];
    const push = (k, v) => { let i = hk.length; hk.push(k); hv.push(v); while (i > 0){ const p = (i - 1) >> 1; if (hk[p] <= k) break; hk[i] = hk[p]; hv[i] = hv[p]; i = p; } hk[i] = k; hv[i] = v; };
    const pop = () => { const v = hv[0], lk = hk.pop(), lv = hv.pop(); if (hk.length){ let i = 0; for (;;){ const l = 2*i + 1, r = l + 1; let m = -1, mk = lk; if (l < hk.length && hk[l] < mk){ m = l; mk = hk[l]; } if (r < hk.length && hk[r] < mk){ m = r; mk = hk[r]; } if (m < 0) break; hk[i] = hk[m]; hv[i] = hv[m]; i = m; } hk[i] = lk; hv[i] = lv; } return v; };
    const DI = [1, 1, 0, -1, -1, -1, 0, 1], DJ = [0, 1, 1, 1, 0, -1, -1, -1];
    dist[nA] = 0; push(0, nA);
    while (hk.length){ const d0 = hk[0], u = pop(); if (d0 > dist[u]) continue; if (u === nB) break;
      const relax = (v, w, L = null) => { const nd = d0 + w; if (nd < dist[v]){ dist[v] = nd; prev[v] = u; via[v] = L; push(nd, v); } };
      if (u < NL){ const i = u % NI, j = (u - i)/NI, fu = fac[u]; for (let k = 0; k < 8; k++){ const ii = i + DI[k], jj = j + DJ[k]; if (ii < 0 || jj < 0 || ii >= NI || jj >= NJ) continue; const v = jj*NI + ii, fv = fac[v]; if (!fv) continue; relax(v, (k & 1 ? S*SQ3*0.8165 : S)*(fu + fv)/2); } }   // (diagonal: S*sqrt(2))
      else if (u < nA) for (const [v, w, L] of aAdj[u - NL]) relax(NL + v, w, L);
      const e = extra.get(u); if (e) for (const [v, w] of e) relax(v, w); }
    if (!(dist[nB] < Infinity)) return null;
    const seq = []; for (let v = nB; v >= 0; v = prev[v]) seq.push(v); seq.reverse();
    const pt = v => v === nA ? A : v === nB ? B : v < NL ? [(i0 + v % NI)*S, (j0 + Math.floor(v/NI))*S] : [AX[v - NL], AY[v - NL]];
    return seq.map(v => ({p:pt(v), a:v >= NL && v < nA ? AREF[v - NL] : null, via:via[v], end:v === nA || v === nB})); }

  // simplify a free run (metric points), keeping each kept segment on passable ground (samples every 0.08 cells)
  function simplifyOk(pts, tol, okSeg){ if (pts.length < 3) return pts; const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; const st = [[0, pts.length - 1]];
    while (st.length){ const [a, b] = st.pop(); if (b - a < 2) continue; let md = -1, mi = a + 1; const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-9;
      for (let i = a + 1; i < b; i++){ const d = Math.abs((pts[i][0] - ax)*dy - (pts[i][1] - ay)*dx)/L; if (d > md){ md = d; mi = i; } }
      if (md > tol || !okSeg(pts[a], pts[b])){ keep[mi] = 1; st.push([a, mi], [mi, b]); } }
    return pts.filter((_, i) => keep[i]); }
  const segOk = pass => (p, q) => { const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1])/0.08)); for (let k = 1; k < n; k++){ const t = k/n, x = p[0] + (q[0] - p[0])*t, y = p[1] + (q[1] - p[1])*t; if (!pass(x, y)) return false; } return true; };

  // a junction on line L (between its vertices U and V, share t): an existing vertex when one is close (0.12 cells), else a new vertex there
  function junction(ref, tag){ if (ref.v) return ref.v; const L = ref.L, iU = L.v.indexOf(ref.U), iV = L.v.indexOf(ref.V); if (iU < 0 || iV < iU) throw new Error('junction: segment lost');
    const [ux, uy] = q2m(ref.U.X, ref.U.Y), [vx, vy] = q2m(ref.V.X, ref.V.Y), px = ux + (vx - ux)*ref.t, py = uy + (vy - uy)*ref.t;
    for (let i = iU; i <= iV; i++){ const [x, y] = q2m(L.v[i].X, L.v[i].Y); if (Math.hypot(x - px, y - py) < 0.12) return L.v[i]; }
    if (tag !== 's' && L.tag === 's') throw new Error('junction: a map phase may not split a shared line');
    const du = Math.hypot(px - ux, py - uy); let at = iU + 1; while (at < iV){ const [x, y] = q2m(L.v[at].X, L.v[at].Y); if (Math.hypot(x - ux, y - uy) >= du) break; at++; }
    const [X, Y] = m2q(px, py), J = {X, Y, o:false, ins:tag}; L.v.splice(at, 0, J); return J; }
  // the place of access point n on line L (its vertex there, or the junction made there)
  const on = (n, L, tag) => { const r = n.a.find(x => x.L === L); if (!r) throw new Error('access point not on the line'); return junction(r, tag); };
  // turn a walk into steps along lines: [{L, from, to}] (from/to: vertex objects); free runs become new lines (class cls, tag)
  function toSteps(seq, cls, tag, pass, A, B){ const steps = [], vA = {X:A.Q[0], Y:A.Q[1], o:true}, vB = {X:B.Q[0], Y:B.Q[1], o:true}, last = seq.length - 1;
    const vert = (i, L) => i === 0 ? vA : i === last ? vB : L ? on(seq[i], L, tag) : on(seq[i], seq[i].a[0].L, tag);
    let i = 0;
    while (i < last){
      if (seq[i + 1].via){ const L = seq[i + 1].via; let j = i + 1; while (j < last && seq[j + 1].via === L) j++;   // along a road
        const f = vert(i, L), t = vert(j, L); if (f !== t) steps.push({L, from:f, to:t}); i = j; continue; }
      let j = i + 1; while (j < last && !seq[j].a) j++;   // a free run: to the next access point or the end
      // (from the end of a road run: the vertex on that road; else any line through the access point)
      const prevL = i > 0 && seq[i].via ? seq[i].via : null, nextL = j < last && seq[j + 1] && seq[j + 1].via ? seq[j + 1].via : null;
      const from = vert(i, prevL), to = vert(j, nextL);
      const raw = seq.slice(i, j + 1).map(s => s.p), simp = simplifyOk(raw, 0.12, segOk(pass));
      const vs = [from, ...simp.slice(1, -1).map(p => { const [X, Y] = m2q(p[0], p[1]); return {X, Y, o:true}; }), to];
      if (vs.length === 2 && vs[0].X === vs[1].X && vs[0].Y === vs[1].Y){ i = j; continue; }
      const L = {id:lines.length, cls, v:vs, ne:-1, tag, dead:false, gen:true}; lines.push(L); indexLine(L); steps.push({L, from:vs[0], to:vs[vs.length - 1]}); i = j; }
    return {steps, vA, vB}; }
  // the vertex keys of a way, expanded along its lines as they are now (with every junction inserted since)
  function expand(W){ const out = []; const add = V => { const l = out[out.length - 1]; if (!l || l[0] !== V.X || l[1] !== V.Y) out.push([V.X, V.Y]); };
    add(W.vA); for (const s of W.steps){ const a = s.L.v.indexOf(s.from), b = s.L.v.indexOf(s.to); if (a < 0 || b < 0) throw new Error('lost vertex');
      if (a <= b) for (let k = a; k <= b; k++) add(s.L.v[k]); else for (let k = a; k >= b; k--) add(s.L.v[k]); }
    add(W.vB); return out; }

  // ---- per map: the link levels (which neighbours a road joins, and how good it is)
  const pkey = (a, b) => a < b ? a + ',' + b : b + ',' + a;
  function levels(M){ const G = M.G, P = G.P, land = p => p >= 0 && !P[p].sea, out = new Map(), cd = (a, b) => Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y);
    for (const [k, lv] of M.pairs) out.set(k, {lv, gen:false, up:false});
    const lnb = p => P[p].nbs.filter(q => land(q)).sort((a, b) => a - b);
    // a track to the two nearest neighbours (same country first) for a province no line reaches; then each country's net joined into one piece
    for (const p0 of P){ const p = p0.id; if (!land(p)) continue; const nb = lnb(p); if (!nb.length || nb.some(q => out.has(pkey(p, q)))) continue;
      const same = nb.filter(q => P[q].country === P[p].country).sort((a, b) => cd(p, a) - cd(p, b) || a - b), pool = same.length ? same : nb.slice().sort((a, b) => cd(p, a) - cd(p, b) || a - b);
      for (const q of pool.slice(0, 2)) out.set(pkey(p, q), {lv:1, gen:true, up:false}); }
    { const par = Int32Array.from({length:P.length}, (_, i) => i), find = x => { while (par[x] !== x){ par[x] = par[par[x]]; x = par[x]; } return x; };
      for (const k of out.keys()){ const [a, b] = k.split(',').map(Number); if (P[a].country === P[b].country) par[find(a)] = find(b); }
      const cand = []; for (const A of P){ if (!land(A.id)) continue; for (const q of lnb(A.id)) if (q > A.id && P[q].country === A.country) cand.push([cd(A.id, q), A.id, q]); }
      cand.sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2]);
      for (const [, p, q] of cand){ const rp = find(p), rq = find(q); if (rp === rq) continue; out.set(pkey(p, q), {lv:1, gen:true, up:false}); par[rp] = rq; } }
    // the owner's rule (MAP-3): every province with a land neighbour has a road (level 2+). Grown out from the road net in rounds: a province
    // without one gets the road to its nearest neighbour that has one (its existing link there first, then the same country); a cluster no road
    // reaches gets one at its first province (to its nearest neighbour), and the rounds go on from there
    const has2 = new Uint8Array(P.length); for (const [k, r] of out) if (r.lv >= 2){ const [a, b] = k.split(',').map(Number); has2[a] = has2[b] = 1; }
    const need = P.filter(A => land(A.id) && !has2[A.id] && lnb(A.id).length).map(A => A.id);
    let left = need.filter(p => !has2[p]), rounds = 0, made = 0, raised = 0;
    const up = (p, q) => { const k = pkey(p, q), r = out.get(k); if (r){ if (r.lv < 2){ r.lv = 2; r.up = true; raised++; } } else { out.set(k, {lv:2, gen:true, up:true}); made++; } };
    while (left.length){ rounds++; const fr = left.filter(p => lnb(p).some(q => has2[q])), done = [];
      if (!fr.length){ const p = left[0], q = lnb(p).sort((a, b) => (out.has(pkey(p, b)) - out.has(pkey(p, a))) || (P[b].country === P[p].country) - (P[a].country === P[p].country) || cd(p, a) - cd(p, b) || a - b)[0]; up(p, q); has2[p] = has2[q] = 1; left = left.filter(x => !has2[x]); continue; }
      for (const p of fr){ const q = lnb(p).filter(x => has2[x]).sort((a, b) => (out.has(pkey(p, b)) - out.has(pkey(p, a))) || (P[b].country === P[p].country) - (P[a].country === P[p].country) || cd(p, a) - cd(p, b) || a - b)[0]; up(p, q); done.push(p); }
      for (const p of done) has2[p] = 1; left = left.filter(x => !has2[x]); }
    M.lvStat = {need:need.length, raised, made, rounds};
    return out; }

  // ---- ROADS
  const T = new Set(); if (maps[1]){ const a = maps[0].G.prov, b = maps[1].G.prov; for (let c = 0; c < a.length; c++) if (a[c] !== b[c]){ T.add(a[c]); T.add(b[c]); } T.delete(-1); }
  for (const M of maps){ M.lv = levels(M); M.cq = M.G.P.map(P => w2q(P.x, P.y)); }
  const M0 = maps[0], landPass = (mx, my, c) => landAtM(mx, my) ? TCOST[TCLS[c]] || 1 : 0, landOk = (x, y) => landAtM(x, y);
  function roadWay(M, a, b, lv, tag){ const G = M.G, P = G.P, cells = P[a].cells.concat(P[b].cells), A = {Q:M.cq[a]}, B = {Q:M.cq[b]}; A.m = q2m(...A.Q); B.m = q2m(...B.Q);
    const inAB = c => G.prov[c] === a || G.prov[c] === b;
    let seq = walk(A.m, B.m, inAB, {cells, pass:landPass, roads:{lv, shared:true}, tag}), pass = landOk, how = 'land';
    if (!seq){ seq = walk(A.m, B.m, inAB, {cells, pass:(x, y, c) => (landAtM(x, y) ? 1 : 4)*(TCOST[TCLS[c]] || 1), roads:{lv, shared:true}, tag}); pass = () => true; how = 'shore'; }   // (a province the mask shows as mostly water: allowed, at a cost)
    if (!seq){ const box = cells.slice(); for (const c of cells) for (let d = 0; d < 6; d++){ const m = R.nbr(c, d); if (m >= 0 && G.prov[m] >= 0 && !P[G.prov[m]].sea) box.push(m); }
      const allow = new Set(box.map(c => G.prov[c])); seq = walk(A.m, B.m, c => allow.has(G.prov[c]), {cells:box, pass:(x, y, c) => (landAtM(x, y) ? 1 : 4)*(TCOST[TCLS[c]] || 1), roads:{lv, shared:true}, tag}); pass = () => true; how = 'wide'; }
    if (!seq){ seq = [{p:A.m, a:null, end:true}, {p:B.m, a:null, end:true}]; pass = () => true; how = 'straight'; }
    const W = toSteps(seq, Math.max(1, lv), tag, pass, A, B); W.how = how; return W; }
  // which links each phase builds: shared (the same on both maps: in both, touching no cut province), then each map's own
  const shared = [], own = maps.map(() => []);
  for (const [k, r] of M0.lv){ const [a, b] = k.split(',').map(Number), sh = !T.has(a) && !T.has(b) && (!maps[1] || maps[1].lv.has(k)); (sh ? shared : own[0]).push([a, b, r]); }
  if (maps[1]) for (const [k, r] of maps[1].lv){ const [a, b] = k.split(',').map(Number); if (T.has(a) || T.has(b) || !M0.lv.has(k)) own[1].push([a, b, r]); }
  const order = (L, M = M0) => { const P = M.G.P, d = q => Math.hypot(P[q[0]].x - P[q[1]].x, P[q[0]].y - P[q[1]].y); return L.sort((x, y) => (y[2].lv - x[2].lv) || ((x[2].gen ? 1 : 0) - (y[2].gen ? 1 : 0)) || (d(x) - d(y)) || x[0] - y[0] || x[1] - y[1]); };
  const how = {}, ways = new Map();   // key -> W (shared); per map: maps[i].ways
  for (const [a, b, r] of order(shared)){ const W = roadWay(M0, a, b, r.lv, 's'); how[W.how] = (how[W.how] || 0) + 1; ways.set(pkey(a, b), {a, b, W}); }
  const sharedOut = {ins:[], roads:[], links:[]};
  // the shared phase is final: its junctions on Natural Earth lines and its new lines are written now (the maps' phases may not split them)
  const enc = pts => { const o = [pts[0][0], pts[0][1]]; for (let i = 1; i < pts.length; i++) o.push(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return o; };
  const linkOut = (a, b, W) => ({a, b, pts:expand(W)});   // (encoded as fork choices by tools/build-lines.js, once the graph is final)
  for (const {a, b, W} of ways.values()) sharedOut.links.push(linkOut(a, b, W));
  { let r0 = 0; for (const L of lines){ if (L.ne < 0) continue; let k = -1, O = null; for (const V of L.v){ if (V.o){ k++; O = V; continue; } sharedOut.ins.push(L.ne - r0, k, V.X - O.X, V.Y - O.Y); r0 = L.ne; } } }   // (flat: road (delta), after point k, offset)
  for (const L of lines){ if (L.ne >= 0) continue;
    if (L.tag === 's') sharedOut.roads.push([L.cls, ...enc(L.v.map(V => [V.X, V.Y]))]); }
  // (the new lines in order of their first point, each first point as an offset from the line before's)
  const relStart = list => { list.sort((x, y) => x[1] - y[1] || x[2] - y[2] || x.length - y.length || x[0] - y[0]); let px = 0, py = 0; for (const R of list){ const x = R[1], y = R[2]; R[1] -= px; R[2] -= py; px = x; py = y; } return list; };
  relStart(sharedOut.roads);
  const nLines = lines.length; for (const L of lines) L.frozen = true;
  const mapOut = maps.map(() => ({roads:[], links:[]}));
  maps.forEach((M, mi) => {
    const ws = []; for (const [a, b, r] of order(own[mi], M)){ const W = roadWay(M, a, b, r.lv, mi); how[W.how] = (how[W.how] || 0) + 1; ws.push([a, b, W]); }
    for (const [a, b, W] of ws) mapOut[mi].links.push(linkOut(a, b, W));   // (once the phase is done: its later ways may add junctions to its lines)
    for (const L of lines) if (L.tag === mi && !L.dead){ mapOut[mi].roads.push([L.cls, ...enc(L.v.map(V => [V.X, V.Y]))]); L.dead = true; } relStart(mapOut[mi].roads); });   // (a map's own lines are not seen by the next map)
  // (shared lines never get a map's junction: a map's phase joins them only at their vertices, see walk opt.roads.shared)
  for (let i = 0; i < nLines; i++){ const L = lines[i]; if (L.v.some(V => V.ins !== undefined && V.ins !== 's')) throw new Error('a map phase split a shared line'); }
  log(`  roads: links ${shared.length} shared + ${own.map(o => o.length).join('/')} per map; ways ${JSON.stringify(how)}; new road lines ${sharedOut.roads.length} shared + ${mapOut.map(o => o.roads.length).join('/')}, junctions on Natural Earth roads ${sharedOut.ins.length/4}`);
  for (const M of maps) log(`  map ${M.v}: provinces needing a road ${M.lvStat.need}: ${M.lvStat.raised} links raised to road, ${M.lvStat.made} new roads, ${M.lvStat.rounds} rounds`);

  // ---- LANES (sea): zone to zone through open water (straits: the land of the provinces touching both may be crossed, at a high cost); a port's
  // way from its centre out to the zone's centre (its own land may be crossed to reach the water)
  // the real channels where two waters meet only through land on the map's grid (zone names of world.js; points lon, lat): the lane runs
  // through them (Gibraltar, the Dardanelles and the Bosporus, the Danish straits, Bab-el-Mandeb, Hormuz, the Panama Canal, ...)
  const CHANNELS = {
    'Mediterranean Sea I|North Atlantic XXI':[[-4.2, 36.1], [-5.4, 35.95], [-5.9, 35.93], [-6.6, 36.0]],
    'Mediterranean Sea III|Mediterranean Sea VI':[[25.9, 39.8], [26.3, 40.1], [26.7, 40.42], [27.6, 40.75], [28.9, 40.98], [29.05, 41.13], [29.15, 41.24], [29.5, 41.6]],
    'North Sea III|Baltic Sea III':[[8.6, 57.6], [10.7, 57.85], [11.6, 57.1], [12.2, 56.3], [12.65, 55.75], [12.85, 55.4], [13.6, 55.15]],
    'Red Sea II|Arabian Sea V':[[42.6, 13.9], [43.25, 12.85], [43.45, 12.6], [44.2, 12.35], [45.5, 12.2]],
    'Persian Gulf|Arabian Sea I':[[53.8, 26.4], [55.6, 26.45], [56.35, 26.55], [56.65, 26.15], [57.2, 25.3]],
    'Yellow Sea|East China Sea I':[[123.4, 34.0], [123.0, 32.6], [122.6, 31.6]],
    'Caribbean Sea I|Central Pacific XI':[[-79.9, 9.45], [-79.92, 9.36], [-79.85, 9.26], [-79.73, 9.15], [-79.64, 9.02], [-79.56, 8.91], [-79.5, 8.75], [-79.4, 8.4]],
  };
  const seaPass = (mx, my) => landAtM(mx, my) ? 0 : 1;
  const finish = (pts, A, B) => { const q = pts.map(p => m2q(p[0], p[1])); q[0] = A.Q; q[q.length - 1] = B.Q; const o = []; for (let i = 1; i < q.length - 1; i++) o.push(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]); return o; };   // (the interior points, delta from u's centre on; v's centre is the end)
  const laneStat = {land:0, chan:0, wide:0};
  function laneWay(M, u, v, kind){ const G = M.G, P = G.P, A = {Q:M.cq[u]}, B = {Q:M.cq[v]}; A.m = q2m(...A.Q); B.m = q2m(...B.Q);
    if (kind === 'port'){ const cells = P[u].cells.concat(P[v].cells), ok = c => G.prov[c] === u || G.prov[c] === v, seq = walk(A.m, B.m, ok, {cells, pass:(x, y) => landAtM(x, y) ? 8 : 1, roads:null}) || [{p:A.m}, {p:B.m}];
      return finish(simplifyOk(seq.map(s => s.p), 0.15, () => true), A, B); }
    // open water: the two zones first, their neighbouring zones if need be (a little dearer), over land only where nothing else joins them
    const near = new Set([u, v]); for (const z of [u, v]) for (const w of P[z].nb.keys()) if (P[w].sea) near.add(w);
    const br = kind === 'strait' ? P.filter(Q => !Q.sea && Q.nb.has(u) && Q.nb.has(v)).map(Q => Q.id) : [], all = new Set([...near, ...br]);
    const cells = [...all].flatMap(z => P[z].cells), ok = c => all.has(G.prov[c]), w0 = (c) => G.prov[c] === u || G.prov[c] === v ? 1 : 1.3;
    const ch = CHANNELS[P[u].name + '|' + P[v].name] || (CHANNELS[P[v].name + '|' + P[u].name] || []).slice().reverse();
    if (ch.length){ laneStat.chan++; const W = ch.map(([lon, lat]) => ll2m(lon, lat)), lp = (x, y, c) => (landAtM(x, y) ? 25 : 1)*w0(c);
      const s1 = walk(A.m, W[0], ok, {cells, pass:lp, roads:null}) || [{p:A.m}, {p:W[0]}], s3 = walk(W[W.length - 1], B.m, ok, {cells, pass:lp, roads:null}) || [{p:W[W.length - 1]}, {p:B.m}];
      const p1 = simplifyOk(s1.map(s => s.p), 0.15, segOk((x, y) => !landAtM(x, y))), p3 = simplifyOk(s3.map(s => s.p), 0.15, segOk((x, y) => !landAtM(x, y)));
      return finish([...p1.slice(0, -1), ...W, ...p3.slice(1)], A, B); }
    const ok2 = c => G.prov[c] === u || G.prov[c] === v, cells2 = P[u].cells.concat(P[v].cells);
    let seq = walk(A.m, B.m, ok2, {cells:cells2, pass:seaPass, roads:null}), sOk = (x, y) => !landAtM(x, y);
    if (!seq){ seq = walk(A.m, B.m, ok, {cells, pass:(x, y, c) => landAtM(x, y) ? 0 : w0(c), roads:null}); if (seq) laneStat.wide++; }
    if (!seq){ seq = walk(A.m, B.m, ok, {cells, pass:(x, y, c) => (landAtM(x, y) ? 25 : 1)*w0(c), roads:null}); sOk = () => true; laneStat.land++; log(`    lane over land: ${P[u].name} - ${P[v].name}${kind === "strait" ? " (strait)" : ""}`); }
    if (!seq) seq = [{p:A.m}, {p:B.m}];
    return finish(simplifyOk(seq.map(s => s.p), 0.15, segOk(sOk)), A, B); }
  const laneOut = {lanes:[], ports:[]}, laneMap = maps.map(() => ({ports:[]}));
  { const G = M0.G, st = new Set(G.straits.map(([a, b]) => pkey(a, b))), done = new Set(); let nS = 0, nT = 0;
    for (const P of G.P){ if (!P.sea) continue; for (const v of [...P.nb.keys()].sort((a, b) => a - b)){ if (!G.P[v].sea || v < P.id) continue; const k = pkey(P.id, v); if (done.has(k)) continue; done.add(k);
      const kind = st.has(k) ? 'strait' : 'sea'; laneOut.lanes.push([P.id, v, ...laneWay(M0, P.id, v, kind)]); kind === 'strait' ? nT++ : nS++; } }
    const ports = (M, pick) => { const out = []; for (const P of M.G.P){ if (P.sea || !P.coast || !pick(P.id)) continue; for (const z of [...P.nb.keys()].sort((a, b) => a - b)) if (M.G.P[z].sea) out.push([P.id, z, ...laneWay(M, P.id, z, 'port')]); } return out; };
    laneOut.ports = ports(M0, p => !T.has(p)); maps.forEach((M, mi) => { laneMap[mi].ports = ports(M, p => T.has(p)); });
    log(`  lanes: ${nS} between sea zones, ${nT} through straits (${laneStat.chan} along a real channel, ${laneStat.wide} by a neighbouring zone's water, ${laneStat.land} over land: no water joins them on the map); port ways ${laneOut.ports.length} + ${laneMap.map(o => o.ports.length).join('/')} per map`); }
  return {sharedOut, mapOut, laneOut, laneMap, T, levels:maps.map(M => M.lv)};
};
