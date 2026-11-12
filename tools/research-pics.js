// The unit pictures of the research tree (assets/art/rn-<key>.webp): every unit's 3D model (units3d.js, the close-zoom map models, plus the
// models below for the units that have none of their own) rendered from the same 3/4 angle (its front quarter, nose to the right and a little down, 32 degrees above: a long hull lies near the diamond's wide axis), in soft studio light
// (a warm key light with a soft shadow, a cool fill, a rim light from behind and a sky light), on a transparent background with a slight shadow
// under the unit. Each render is 4x supersampled, then trimmed and centred in the diamond: the picture is a square the size of the diamond's
// bounding box, and every unit is scaled so that it reaches the same inscribed diamond (|x| + |y| = PAD of the side), so all units have the same
// padding and none is cropped by the diamond.
//   node tools/research-pics.js [keys]   (comma-separated keys; default all) -> assets/art/rn-<key>.webp, and a contact sheet with --sheet <png>
// The output size (OUT = 256 px) is about twice the largest picture box on screen: a 52 px generation diamond shows a 74 css px box (148 device
// px at 2x); a 44 px phone diamond at 3x needs 187 px. The renders are only ever scaled down.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = 256, RS = 1024, PAD = 0.45, SPAD = 0.49;   // PAD: the unit's reach, SPAD: its shadow's (the diamond's edge is at 0.5)
// the picture keys (rGenArt in index.html: a unit type, or the armed UAV 'drone4' and the Supersonic Bomber 'bomb2')
const KEYS = ['inf', 'at', 'spec', 'para', 'ifv', 'tank', 'art', 'mlrs', 'sam', 'jam', 'heli', 'int', 'jet', 'asf', 'drone', 'drone4', 'swarm', 'sdrone',
  'bomb', 'bomb2', 'stealth', 'mpa', 'awacs', 'frig', 'crui', 'carr', 'sub'];

// ---- in the page: the scene, the extra models and the render (three.js r128 and units3d.js's model kit, exposed as window.__U3DX)
function inPage({ keys, RS, OUT, PAD, SPAD }){
  const X = window.__U3DX, T = X.T, P = X.P, { pbr, rbox, side, plan, cy, cyX, cyZ, sph, mk, ad, gear, ant } = X;
  const recolor = (m, map) => { m.g.traverse(o => { if (o.isMesh && map.has(o.material)) o.material = map.get(o.material); }); return m; };
  const line = (par, a, b, r, mat) => { const d = new T.Vector3().subVectors(b, a), o = cy(r, r, d.length(), mat, 5); o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize()); o.castShadow = false; par.add(o); };
  // a fuselage along z: length L, radius r, nose share kn, tail share kt (r: the round body; sy squashes it)
  const fus = (L, r, kn, kt, mat, y, sy = 1, seg = 24) => { const pr = []; for (let i = 0; i <= 24; i++){ const u = i/24; let k = 1; if (u > 1 - kn) k = Math.sqrt(Math.max(0, 1 - Math.pow((u - (1 - kn))/kn, 2))); if (u < kt) k = 0.35 + 0.65*Math.sin(u/kt*Math.PI/2);
      pr.push(new T.Vector2(Math.max(0.03, r*k), (u - 0.5)*L)); } const o = mk(new T.LatheGeometry(pr, seg), mat); o.rotation.x = -Math.PI/2; o.scale.set(1, 1, sy); o.position.y = y; return o; };
  const mirror = pts => pts.concat(pts.slice().reverse().filter(p => p[0] !== 0).map(([x, z]) => [-x, z]));
  const fin = (g, z0, z1, z2, z3, h, th, y, mat) => { const f = side([[z0, 0], [z1, 0], [z2, h], [z3, h]], th, mat, 0.03); f.position.y = y; g.add(f); return f; };
  const prop = (par, x, y, z, r, n, mat) => { const h = new T.Group(); h.position.set(x, y, z); par.add(h); h.add(sph(r*0.16, P.dark, 0, 0, 0.05, 1, 1, 1.6));
    for (let i = 0; i < n; i++){ const b = rbox(0.08*r, r, 0.035*r + 0.02, 0.01, mat, 0, r*0.5, 0); const a = new T.Group(); a.rotation.z = i*Math.PI*2/n + 0.4; b.rotation.y = 0.5; a.add(b); h.add(a); } return h; };
  const airG = pbr(0x4c5459, 0.55, 0.3, { camo:[0x434a4f, 0x5a6267, 0x3b4146], cs:2.6, k3:0.6, dust:0.04, grain:0.08 }), airD = pbr(0x3d4448, 0.58, 0.3, { camo:[0x353b3f, 0x484f53, 0x2f3438], cs:2.6, k3:0.6, dust:0.03, grain:0.08 });
  const dkG = pbr(0x3f464b, 0.55, 0.35, { camo:[0x353b40, 0x4a5156, 0x2f3438], cs:3.2, k3:0.5, dust:0.03, grain:0.07 });
  const stG = pbr(0x2f3438, 0.62, 0.3, { grain:0.05, dust:0 });
  const ltG = pbr(0x8a9298, 0.5, 0.3, { grain:0.06, dust:0.02 });
  const EXTRA = {
    // motorized infantry: a rifleman by his 4x4
    inf(){ const g = new T.Group(), s = X.MAPB.sol(), h = X.MAPB.hmv(); h.g.position.set(-0.6, 0, -1.6); h.g.rotation.y = 0.12; s.g.position.set(-2.1, 0, 1.0); s.g.rotation.y = 0.35; s.g.scale.setScalar(1.6); g.add(h.g, s.g); return { g }; },
    // anti-tank infantry: a rifleman with a launcher tube over his right shoulder
    at(){ const m = X.MAPB.sol(), t = new T.Group(); t.position.set(0.21, 1.58, 0.02); t.rotation.set(0.05, -0.05, 0); m.g.add(t);
      t.add(cyZ(0.07, 0.07, 1.2, P.oliveD, 0, 0, 0, 16)); t.add(cyZ(0.1, 0.075, 0.26, P.dark, 0, 0, 0.66, 16)); t.add(cyZ(0.075, 0.1, 0.22, P.dark, 0, 0, -0.66, 16));
      t.add(rbox(0.09, 0.1, 0.18, 0.02, P.dark, -0.11, 0.04, 0.2)); t.add(rbox(0.04, 0.14, 0.06, 0.01, P.dark, 0, -0.1, 0.12)); return m; },
    // special forces: the same kit in a darker pattern
    spec(){ const u = pbr(0x3a3e33, 0.95, 0, { camo:[0x26291f, 0x4f4c3b, 0x18191a], cs:0.16, gs:30, dust:0.2, dh:0.5 }), gr = pbr(0x2e302b, 0.9, 0, { grain:0.18, gs:24, dust:0.1, dh:0.5 }),
        hl = pbr(0x34372e, 0.75, 0.05, { grain:0.12, dust:0 }); return recolor(X.MAPB.sol(), new Map([[P.uni, u], [P.gear, gr], [P.gearD, gr], [P.olive, hl], [P.oliveD, hl], [P.tarp, gr]])); },
    // paratroopers: a rifleman under his canopy, just above the ground
    para(){ const g = new T.Group(), s = X.MAPB.sol(), lift = 0.7; s.g.position.y = lift; g.add(s.g); const ch = pbr(0x5d6446, 0.9, 0, { camo:[0x454c33, 0x6e6a4c, 0x353827], cs:0.9, grain:0.12, dust:0 });
      const R = 1.35, Y = lift + 3.1, can = mk(new T.SphereGeometry(R, 30, 12, 0, Math.PI*2, 0, Math.PI*0.4), ch, 0, Y, 0); can.scale.set(1, 0.62, 1); can.material = ch; ch.side = T.DoubleSide; g.add(can);
      const rr = R*Math.sin(Math.PI*0.4), ry = Y + R*Math.cos(Math.PI*0.4)*0.62;
      for (let i = 0; i < 12; i++){ const a = i/12*Math.PI*2; line(g, new T.Vector3(Math.cos(a)*rr, ry, Math.sin(a)*rr), new T.Vector3(Math.cos(a) > 0 ? 0.17 : -0.17, lift + 1.62, 0), 0.008, P.dark); }
      return { g, air:true, olive:true }; },
    // the mobile jammer: the 4x4 with a mast, a dish and antenna panels on its back
    jam(){ const m = X.MAPB.hmv(), g = m.g; g.add(rbox(1.5, 0.45, 0.9, 0.06, P.oliveD, 0, 1.62, -1.95)); g.add(cy(0.06, 0.08, 1.5, P.dark, 8, 0.45, 2.55, -2.1));
      const d = mk(new T.SphereGeometry(0.62, 24, 8, 0, Math.PI*2, 0, 0.62), P.white, 0, 0, 0); d.material = P.white; const dg = new T.Group(); dg.position.set(-0.2, 2.35, -1.85); dg.rotation.x = 1.0; dg.add(d); g.add(dg);
      dg.add(cy(0.03, 0.03, 0.5, P.dark, 6, 0, 0.35, 0)); for (const a of [0, 2.1, 4.2]) { const p = rbox(0.34, 0.5, 0.05, 0.02, P.oliveD, 0.45 + Math.cos(a)*0.2, 3.25, -2.1 + Math.sin(a)*0.2); p.rotation.y = a; g.add(p); }
      g.add(ant(0.6, 1.85, -2.35, 1.4)); return m; },
    // air superiority fighter: the interceptor in a darker two-tone grey, with missiles under the body
    asf(){ const m = recolor(X.MAPB.int(), new Map([[P.air, dkG], [P.airD, stG]])); for (const sx of [-0.55, 0.55]) m.g.add(cyZ(0.09, 0.09, 2.6, P.white, sx, 1.05, 0.6, 8)); return m; },
    // the recon UAV: the map model with its V-tail rebuilt as two fins canted out from the tail cone (the map model's fins are drawn for the view from above)
    drone(){ const m = X.MAPB.drone(), H = 0.75, old = []; m.g.children.forEach(o => { if (o.isMesh && Math.abs(Math.abs(o.rotation.z) - 0.8) < 1e-6) old.push(o); }); old.forEach(o => m.g.remove(o));
      for (const sx of [-1, 1]){ const v = new T.Group(); v.position.set(0, H + 0.42, 0); v.rotation.z = sx*0.72; m.g.add(v); v.add(side([[-4.1, 0], [-5.1, 0], [-5.55, 1.45], [-5.05, 1.5]], 0.08, P.airD, 0.02)); } return m; },
    // the strike fighter: the map model in a green-grey ground-attack scheme (beside the interceptor's plain grey), with its bombs under the wings
    jet(){ const m = X.MAPB.jet(), g1 = pbr(0x535a49, 0.6, 0.25, { camo:[0x464d3d, 0x646a55, 0x3a4034], cs:2.6, k3:0.7, dust:0.04, grain:0.08 }), g2 = pbr(0x434939, 0.62, 0.25, { grain:0.08, dust:0.03 });
      m.olive = true; return recolor(m, new Map([[P.air, g1], [P.airD, g2]])); },
    // the armed UAV (UAV IV): the recon UAV with four missiles under its wings
    drone4(){ const m = EXTRA.drone(), H = 0.75; for (const sx of [-4.6, -2.6, 2.6, 4.6]){ m.g.add(rbox(0.06, 0.25, 0.4, 0.02, P.dark, sx, H + 0.5, 0.45)); m.g.add(cyZ(0.085, 0.085, 1.5, P.white, sx, H + 0.3, 0.5, 10)); m.g.add(cyZ(0.01, 0.085, 0.22, P.dark, sx, H + 0.3, 1.36, 10)); } return m; },
    // the strike drone: a delta-wing one-way drone in flight, pusher propeller, winglets
    sdrone(){ const g = new T.Group(), Y = 1.4; g.add(fus(3.5, 0.24, 0.24, 0.12, airG, Y));
      g.add(plan([[0, 1.0], [1.55, -1.15], [1.55, -1.45], [0.45, -1.3], [0, -1.5], [-0.45, -1.3], [-1.55, -1.45], [-1.55, -1.15]], 0.07, airG, Y - 0.03, 0.02));
      for (const sx of [-1.55, 1.55]){ const w = side([[-1.0, 0], [-1.48, 0], [-1.55, 0.5], [-1.3, 0.5]], 0.04, P.airD, 0.01); w.position.set(sx, Y, 0); g.add(w); }
      prop(g, 0, Y, -1.82, 0.48, 2, P.blade); return { g, air:true }; },
    // the swarm: three small quadcopters in the air
    swarm(){ const g = new T.Group(), q = (x, y, z, ry) => { const d = new T.Group(); d.position.set(x, y, z); d.rotation.y = ry; g.add(d); d.add(rbox(0.26, 0.11, 0.42, 0.04, ltG, 0, 0, 0)); d.add(sph(0.06, P.dark, 0, -0.06, 0.18));
        for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]){ const a = rbox(0.045, 0.035, 0.36, 0.01, ltG, sx*0.16, 0.02, sz*0.16); a.rotation.y = sx*sz*0.785; d.add(a); d.add(cy(0.035, 0.035, 0.07, P.dark, 8, sx*0.29, 0.06, sz*0.29));
          const r = cy(0.17, 0.17, 0.008, P.blade, 20, sx*0.29, 0.1, sz*0.29); r.material = P.blade; d.add(r); } };
      q(0, 1.1, 0.7, 0.1); q(-0.85, 1.45, -0.35, -0.2); q(0.85, 1.75, -0.45, 0.25); return { g, air:true }; },
    // the heavy bomber: a long body, a high swept wing with four twin-engine pods, a tall fin
    bomb(){ const g = new T.Group(), H = 1.0, Y = H + 1.35; g.add(fus(24, 1.25, 0.2, 0.28, airG, Y, 1.05)); g.add(sph(0.8, P.glass, 0, Y + 0.65, 9.3, 1, 0.55, 1.5));
      const wl = mirror([[0, 3.6], [13, -5.4], [13, -6.6], [0, -1.2]]); g.add(plan(wl, 0.28, airG, Y + 0.75, 0.06));
      for (const x of [4.6, 8.6]) for (const s of [-1, 1]){ const z = 3.6 - x*0.69 + 0.2; g.add(rbox(0.16, 0.6, 1.4, 0.05, P.airD, s*x, Y + 0.45, z - 0.6)); for (const dx of [-0.38, 0.38]) { g.add(cyZ(0.33, 0.3, 2.5, P.airD, s*x + dx, Y + 0.05, z, 14)); g.add(cyZ(0.24, 0.24, 0.05, P.dark, s*x + dx, Y + 0.05, z + 1.26, 12)); } }
      fin(g, -8.6, -11.9, -12.6, -10.4, 4.6, 0.22, Y + 0.6, P.airD); g.add(plan(mirror([[0, -9.4], [4.6, -11.6], [4.6, -12.3], [0, -11.9]]), 0.14, airG, Y + 0.35, 0.03));
      gear(g, [[0, 6.5], [-0.8, -2.0], [0.8, -2.0], [-11.2, -4.6], [11.2, -4.6]], H); return { g, air:true }; },
    // the supersonic bomber: a blended swing-wing body, wings swept back, four engines in two nacelles, a fin with low tailplanes
    bomb2(){ const g = new T.Group(), H = 1.1, Y = H + 1.15, A = dkG; g.add(fus(23, 1.05, 0.26, 0.2, A, Y, 0.9)); g.add(sph(0.6, P.glass, 0, Y + 0.65, 8.2, 1, 0.5, 1.6));
      g.add(plan(mirror([[0, 4.2], [2.6, 1.2], [3.0, -5.5], [0, -6.5]]), 0.5, A, Y - 0.15, 0.08));
      g.add(plan(mirror([[2.6, 0.6], [11.5, -5.6], [11.5, -6.5], [2.8, -3.0]]), 0.18, A, Y + 0.1, 0.04));
      for (const s of [-1, 1]){ g.add(rbox(1.5, 0.95, 6.0, 0.3, stG, s*1.6, Y - 0.75, -3.2)); for (const dx of [-0.38, 0.38]) g.add(cyZ(0.34, 0.3, 0.3, P.dark, s*1.6 + dx, Y - 0.75, -6.3, 12)); }
      fin(g, -7.4, -10.8, -11.4, -9.2, 4.0, 0.22, Y + 0.5, stG); g.add(plan(mirror([[0, -8.6], [4.4, -10.4], [4.4, -11.1], [0, -11.0]]), 0.12, A, Y + 0.25, 0.03));
      gear(g, [[0, 7.0], [-1.6, -2.4], [1.6, -2.4]], H); return { g, air:true }; },
    // the stealth bomber: a flying wing with a saw-tooth trailing edge and a raised centre body
    stealth(){ const g = new T.Group(), H = 0.9, Y = H + 0.3, A = pbr(0x34393d, 0.66, 0.25, { grain:0.05, dust:0 });
      g.add(plan(mirror([[0, 7.2], [15.5, -2.4], [15.5, -3.2], [11.2, -0.8], [7.4, -3.6], [3.6, -1.4], [0, -3.4]]), 0.42, A, Y, 0.12));
      g.add(sph(2.2, A, 0, Y + 0.32, 2.2, 1.15, 0.38, 2.4)); g.add(rbox(1.2, 0.08, 0.5, 0.04, P.glass, 0, Y + 1.12, 4.0));
      for (const s of [-1, 1]){ g.add(sph(0.9, A, s*2.4, Y + 0.38, 0.3, 1, 0.35, 2.1)); g.add(rbox(0.9, 0.12, 0.25, 0.05, P.dark, s*2.4, Y + 0.55, 1.6)); }
      gear(g, [[0, 4.5], [-2.8, -0.6], [2.8, -0.6]], H); return { g, air:true }; },
    // the maritime patrol aircraft: four turboprops on a straight low wing, a magnetic-anomaly boom at the tail
    mpa(){ const g = new T.Group(), H = 1.0, Y = H + 1.35; g.add(fus(20, 1.4, 0.16, 0.3, airG, Y)); g.add(rbox(1.6, 0.4, 0.5, 0.15, P.glass, 0, Y + 0.85, 8.6));
      g.add(plan(mirror([[0, 1.8], [15, 0.5], [15, -0.9], [0, -2.2]]), 0.3, airG, Y - 0.85, 0.06));
      for (const x of [4.2, 8.2]) for (const s of [-1, 1]){ g.add(cyZ(0.45, 0.35, 3.4, P.airD, s*x, Y - 0.7, 1.1, 14)); prop(g, s*x, Y - 0.7, 2.95, 1.7, 4, P.blade); }
      fin(g, -6.5, -9.5, -10.2, -8.2, 4.0, 0.2, Y + 0.6, P.airD); g.add(plan(mirror([[0, -7.8], [4.6, -9.0], [4.6, -9.8], [0, -9.8]]), 0.12, airG, Y + 0.3, 0.03));
      g.add(cyZ(0.18, 0.12, 2.6, P.airD, 0, Y + 0.25, -11.0, 10)); gear(g, [[0, 6.5], [-4.2, 0.2], [4.2, 0.2]], H); return { g, air:true }; },
    // the AWACS: an airliner body with four engines under a swept wing and the radar dome on two struts
    awacs(){ const g = new T.Group(), H = 1.1, Y = H + 1.6; g.add(fus(24, 1.6, 0.14, 0.3, ltG, Y)); g.add(rbox(1.7, 0.4, 0.4, 0.15, P.glass, 0, Y + 0.95, 10.7));
      g.add(plan(mirror([[0, 2.8], [14.5, -4.6], [14.5, -5.8], [0, -2.6]]), 0.3, ltG, Y - 1.0, 0.06));
      for (const x of [5.0, 9.6]) for (const s of [-1, 1]){ const z = 2.8 - x*0.512 + 1.4; g.add(cyZ(0.55, 0.48, 2.6, ltG, s*x, Y - 1.65, z, 16)); g.add(cyZ(0.42, 0.42, 0.06, P.dark, s*x, Y - 1.65, z + 1.32, 14)); g.add(rbox(0.16, 0.6, 1.4, 0.05, ltG, s*x, Y - 1.2, z - 0.4)); }
      for (const z of [-2.6, -4.6]) g.add(rbox(0.25, 2.0, 0.7, 0.08, ltG, 0, Y + 2.2, z));
      g.add(cy(4.4, 4.4, 0.65, P.white, 40, 0, Y + 3.3, -3.6)); g.add(cy(4.42, 4.42, 0.14, P.dark, 40, 0, Y + 3.3, -3.6));
      fin(g, -7.8, -11.2, -12.0, -9.6, 4.6, 0.24, Y + 0.9, ltG); g.add(plan(mirror([[0, -9.2], [5.2, -11.2], [5.2, -12.0], [0, -11.8]]), 0.14, ltG, Y + 0.5, 0.03));
      gear(g, [[0, 9.0], [-2.6, -1.8], [2.6, -1.8]], H); return { g, air:true }; },
  };
  // (the map models' pale grey reads on the dark map; on the light diamonds the aircraft wear a darker grey)
  const BUILD = k => { const m = EXTRA[k] ? EXTRA[k]() : X.MAPB[k](); if (k === 'heli') m.olive = true; if (m.air && !m.olive) recolor(m, new Map([[P.air, airG], [P.airD, airD]])); return m; };
  // ---- the studio
  const R = new T.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true });
  R.setPixelRatio(1); R.setSize(RS, RS); R.setClearColor(0x000000, 0); R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
  R.outputEncoding = T.sRGBEncoding; R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 0.98; R.localClippingEnabled = true;
  const S = new T.Scene(); S.add(new T.HemisphereLight(0xe4edf3, 0x4d4b3c, 0.42));
  const key = new T.DirectionalLight(0xfff0dc, 2.1); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 5; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; S.add(key, key.target);
  const fill = new T.DirectionalLight(0xb4c6d6, 0.5), rim = new T.DirectionalLight(0xe2ecf4, 1.1); S.add(fill, fill.target, rim, rim.target);
  const ground = new T.Mesh(new T.PlaneGeometry(400, 400), new T.ShadowMaterial({ opacity:0.3 })); ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; S.add(ground);
  let AOT = null; const ao = () => { if (AOT) return AOT; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 2, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.5, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return (AOT = new T.CanvasTexture(c)); };
  const cam = new T.PerspectiveCamera(18, 1, 0.1, 2000), AZ = 58*Math.PI/180, EL = 32*Math.PI/180;
  const work = document.createElement('canvas'); work.width = work.height = RS; const wx = work.getContext('2d', { willReadFrequently:true });
  const out = {};
  for (const k of keys){
    const m = BUILD(k), g = m.g, sea = !!m.sea; g.updateMatrixWorld(true); X.CU.inv.value.copy(g.matrixWorld).invert();
    const mats = new Set(); g.traverse(o => { if (o.isMesh && o.material && o.material.userData && o.material.userData.pbr) mats.add(o.material); });
    for (const mt of mats){ mt.clippingPlanes = sea ? [new T.Plane(new T.Vector3(0, 1, 0), -X.WL)] : []; mt.needsUpdate = true; }
    const bx = new T.Box3().setFromObject(g), c = bx.getCenter(new T.Vector3()), sz = bx.getSize(new T.Vector3()), r = sz.length()/2;
    // a soft contact shade under the hull (ground units and parked aircraft; a darker wake shade for ships)
    const cs = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map:ao(), color:0x000000, transparent:true, opacity:sea ? 0.28 : m.air ? 0.22 : 0.42, depthWrite:false }));
    cs.rotation.x = -Math.PI/2; cs.scale.set(sz.x*(m.air ? 0.6 : 1.12), sz.z*(m.air ? 0.6 : 1.1), 1); cs.position.set(c.x, (sea ? X.WL : 0) + 0.01, c.z); cs.renderOrder = -1; g.add(cs);
    ground.position.y = sea ? X.WL : 0; S.add(g);
    const look = new T.Vector3(c.x, Math.max(c.y*0.85, sz.y*0.4) + (sea ? X.WL*0.5 : 0), c.z);
    const dir = new T.Vector3(-Math.sin(AZ)*Math.cos(EL), Math.sin(EL), Math.cos(AZ)*Math.cos(EL)), dist = r/Math.sin(18*Math.PI/360)*1.04;
    cam.position.copy(look).addScaledVector(dir, dist); cam.near = dist - r*2; cam.far = dist + r*3; cam.lookAt(look); cam.updateProjectionMatrix();
    // key light: high, from the viewer's left and a little in front; fill from the right; rim from behind
    const L = (lt, v, k2) => { lt.position.copy(look).addScaledVector(v.normalize(), r*k2); lt.target.position.copy(look); lt.target.updateMatrixWorld(); };
    L(key, new T.Vector3(-0.45, 4.0, 0.35), 4); L(fill, new T.Vector3(1.2, 0.6, 0.9), 4); L(rim, new T.Vector3(0.6, 0.9, -1.4), 4);
    const sc = key.shadow.camera; sc.left = sc.bottom = -r*1.6; sc.right = sc.top = r*1.6; sc.near = 0.1; sc.far = r*10; sc.updateProjectionMatrix();
    // two renders: the unit alone (its extent sets the centre and the scale), then with its shadow (which may reach a little further, never past the diamond)
    R.toneMappingExposure = sea ? 0.88 : m.air && !m.olive ? 0.8 : m.air ? 0.88 : 0.98;   // (grey ships and aircraft a little darker: their pale paint washes out)
    const ext = all => { R.shadowMap.needsUpdate = true; ground.visible = cs.visible = all; R.render(S, cam); wx.clearRect(0, 0, RS, RS); wx.drawImage(R.domElement, 0, 0); const px = wx.getImageData(0, 0, RS, RS).data, e = [1e9, -1e9, 1e9, -1e9, 0];
      for (let y = 0; y < RS; y++) for (let x = 0; x < RS; x++){ if (px[(y*RS + x)*4 + 3] < 22) continue; const u = x + y, v = x - y; if (u < e[0]) e[0] = u; if (u > e[1]) e[1] = u; if (v < e[2]) e[2] = v; if (v > e[3]) e[3] = v;
        if (x <= 1 || y <= 1 || x >= RS - 2 || y >= RS - 2) e[4] = 1; } return e; };
    // trim and centre in diamond space: u = x + y, v = x - y (|x| + |y| = max(|u|, |v|)); the unit's extent in u and v sets its centre and scale
    const e0 = ext(false), e1 = ext(true); S.remove(g); for (const mt of mats){ mt.clippingPlanes = []; mt.needsUpdate = true; }
    const uc = (e0[0] + e0[1])/2, vc = (e0[2] + e0[3])/2, xc = (uc + vc)/2, yc = (uc - vc)/2, hM = Math.max(e0[1] - e0[0], e0[3] - e0[2])/2, hA = Math.max(uc - e1[0], e1[1] - uc, vc - e1[2], e1[3] - vc);
    const s = 2*Math.min(PAD*OUT/hM, SPAD*OUT/hA);   // (at 2x the output size)
    const D = OUT*2, mid = document.createElement('canvas'); mid.width = mid.height = D; const mx = mid.getContext('2d'); mx.imageSmoothingEnabled = true; mx.imageSmoothingQuality = 'high';
    // halve the render until it is within 2x of its final size, then draw it trimmed and centred at twice the output size, then halve once more
    let src = work, k2 = s; while (k2 < 0.5){ const h = document.createElement('canvas'); h.width = Math.ceil(src.width/2); h.height = Math.ceil(src.height/2); const hx = h.getContext('2d'); hx.imageSmoothingQuality = 'high'; hx.drawImage(src, 0, 0, h.width, h.height); src = h; k2 *= 2; }
    const f = src.width/RS; mx.setTransform(k2, 0, 0, k2, D/2 - xc*f*k2, D/2 - yc*f*k2); mx.drawImage(src, 0, 0);
    const fin2 = document.createElement('canvas'); fin2.width = fin2.height = OUT; const fx = fin2.getContext('2d'); fx.imageSmoothingQuality = 'high'; fx.drawImage(mid, 0, 0, OUT, OUT);
    out[k] = { url:fin2.toDataURL('image/webp', 0.92), clip:!!(e0[4] || e1[4]), scale:+(s/2).toFixed(3), shadowBound:SPAD/hA < PAD/hM };
  }
  return out; }

(async () => {
  const args = process.argv.slice(2), si = args.indexOf('--sheet'), sheet = si >= 0 ? args.splice(si, 2)[1] : null, keys = args[0] ? args[0].split(',') : KEYS;
  for (const k of keys) if (!KEYS.includes(k)) throw new Error('unknown key ' + k);
  const three = fs.existsSync(path.join(ROOT, 'tools/vendor/three.min.js')) ? path.join(ROOT, 'tools/vendor/three.min.js') : null; if (!three) throw new Error('tools/vendor/three.min.js missing');
  // units3d.js as the game ships it, plus one line that hands its model kit to this script (the game file is not changed)
  let u3 = fs.readFileSync(path.join(ROOT, 'units3d.js'), 'utf8'); const hook = 'mapFn = mapBuild;';
  if (!u3.includes(hook)) throw new Error('units3d.js: "' + hook + '" not found');
  u3 = u3.replace(hook, hook + ' window.__U3DX = {T, P, CU, WL, pbr, rbox, side, plan, cy, cyX, cyZ, sph, mk, ad, gear, ant, MAPB};');
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('about:blank'); await p.addScriptTag({ path:three }); await p.addScriptTag({ content:u3 });
  if (!(await p.evaluate(() => !!window.__U3DX))) throw new Error('units3d.js did not expose its model kit (no WebGL?)');
  const res = await p.evaluate(inPage, { keys, RS, OUT, PAD, SPAD });
  for (const k of keys){ const r = res[k]; fs.writeFileSync(path.join(ROOT, 'assets/art', `rn-${k}.webp`), Buffer.from(r.url.split(',')[1], 'base64'));
    console.log(`rn-${k}.webp ${(fs.statSync(path.join(ROOT, 'assets/art', `rn-${k}.webp`)).size/1024).toFixed(1)}K scale ${r.scale}${r.shadowBound ? '  (scaled by its shadow)' : ''}${r.clip ? '  CLIPPED: the render touches its frame' : ''}`); }
  if (sheet){ // a contact sheet: each picture on the diamond colours it is shown on (researched blue, open green, locked grey), at 1x the output
    const html = `<body style="margin:0;background:#1f2b31;display:flex;flex-wrap:wrap;gap:8px;padding:8px;width:${7*(OUT + 8)}px">` + keys.map(k => `<div style="position:relative;width:${OUT}px;height:${OUT}px;background:radial-gradient(circle at 50% 45%, #c3e5f6 0, #5fa6cf 48%, #25648c 100%);clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)"><img src="${res[k].url}" style="position:absolute;inset:0;width:100%;height:100%"></div>`).join('') + '</body>';
    await p.setContent(html); await p.waitForTimeout(300); await p.screenshot({ path:sheet, fullPage:true }); }
  await b.close(); if (errs.length){ console.log('errors', errs); process.exit(1); } })();
