// Iron Meridian — pre-rendered 3D unit sprites.
// Every model is an original design built procedurally from three.js primitives, modelled in metres,
// lit and rendered once per direction/animation frame into a sprite atlas, plus a mask of the
// nation-marked parts so each power's units can be tinted at draw time.
(function(){
  'use strict';
  const T = window.THREE;
  const META = {inf:{dirs:8, frames:8}, at:{dirs:8, frames:8}, tank:{dirs:8, frames:6}, ifv:{dirs:8, frames:2}, art:{dirs:8, frames:4}, sam:{dirs:8, frames:2},
                jet:{dirs:16, frames:2, air:true}, int:{dirs:16, frames:2, air:true}, frig:{dirs:16, frames:1, sea:true}, sub:{dirs:16, frames:1, sea:true}, crui:{dirs:16, frames:1, sea:true},
                heli:{dirs:16, frames:4, air:true}, drone:{dirs:16, frames:1, air:true}, carr:{dirs:16, frames:1, sea:true}, mlrs:{dirs:8, frames:3}, spec:{dirs:8, frames:8}};
  const ALIAS = {para:'inf'};
  const BAKE_SZ = 136;
  const SZ = window.__BAKE ? BAKE_SZ : ((window.devicePixelRatio || 1) > 1.3 && (window.innerWidth || 1000) > 820 ? 136 : 112);   // pixels per frame
  const cache = {};
  let buildFn = null;
  if (T) (function(){
  let renderer;
  try { renderer = new T.WebGLRenderer({antialias:true, alpha:true, preserveDrawingBuffer:true}); } catch (e){ return; }
  renderer.setPixelRatio(1); renderer.setSize(SZ, SZ); renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  if (T.sRGBEncoding) renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping || 0; renderer.toneMappingExposure = 1.05;

  // ---------- materials (colours authored in sRGB, converted to linear for correct lighting)
  const lin = m => { if (m.color && m.color.convertSRGBToLinear) m.color.convertSRGBToLinear(); return m; };
  const std = (c, r, mt) => lin(new T.MeshStandardMaterial({color:c, roughness:r, metalness:mt}));
  const M = {
    steel: std(0x34383a, 0.5, 0.55), dark: std(0x202321, 0.9, 0.05), rubber: std(0x161716, 0.95, 0),
    glass: std(0x3e5a68, 0.12, 0.5), skin: std(0xb08a68, 0.8, 0), gear: std(0x4a4d3a, 0.88, 0), gearD: std(0x34362b, 0.9, 0),
    deck: std(0x55595a, 0.8, 0.2), haze: std(0x7c8388, 0.7, 0.25), hazeD: std(0x5b6266, 0.75, 0.25), white: std(0xbcbab2, 0.7, 0.05),
    exhaust: new T.MeshBasicMaterial({color:0xffa24a}),
  };
  const isTeam = m => m && m.userData && m.userData.team;
  function team(dark){ const m = std(dark ? 0x75756e : 0x9a9a92, 0.85, 0.05); m.userData.team = true; return m; }
  function mesh(geo, mat, x = 0, y = 0, z = 0){ const o = new T.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o; }
  const box = (w, h, d, mat, x, y, z) => mesh(new T.BoxGeometry(w, h, d), mat, x, y, z);
  const cyl = (rt, rb, h, mat, seg = 16) => mesh(new T.CylinderGeometry(rt, rb, h, seg), mat);
  const wheel = (r, wdt, mat, x, y, z) => { const w = cyl(r, r, wdt, mat, 18); w.rotation.z = Math.PI/2; w.position.set(x, y, z); return w; };
  function extrudeSide(points, width, mat){
    // side profile in (z, y), extruded along x by width, centred
    const sh = new T.Shape(); sh.moveTo(points[0][0], points[0][1]); for (let i = 1; i < points.length; i++) sh.lineTo(points[i][0], points[i][1]); sh.closePath();
    const g = new T.ExtrudeGeometry(sh, {depth:width, bevelEnabled:true, bevelThickness:0.05, bevelSize:0.05, bevelSegments:1});
    g.translate(0, 0, -width/2); const o = mesh(g, mat); o.rotation.y = -Math.PI/2; return o;
  }
  function extrudeTop(points, height, mat, bevel = 0.04){
    const sh = new T.Shape(); sh.moveTo(points[0][0], points[0][1]); for (let i = 1; i < points.length; i++) sh.lineTo(points[i][0], points[i][1]); sh.closePath();
    const g = new T.ExtrudeGeometry(sh, {depth:height, bevelEnabled:bevel > 0, bevelThickness:bevel, bevelSize:bevel, bevelSegments:1});
    const o = mesh(g, mat); o.rotation.x = Math.PI/2; o.position.y = height; return o;
  }
  function trackRun(x, len, mat){
    // tracked running gear seen from the side: top and bottom track runs, end rollers, seven road wheels
    const g = new T.Group();
    g.add(box(0.62, 0.07, len - 0.6, mat, x, 0.98, 0)); g.add(box(0.62, 0.07, len - 1.1, mat, x, 0.04, 0));
    g.add(wheel(0.36, 0.62, mat, x, 0.6, len/2 - 0.35)); g.add(wheel(0.32, 0.62, mat, x, 0.58, -len/2 + 0.32));
    for (let i = 0; i < 7; i++) g.add(wheel(0.33, 0.5, M.dark, x, 0.36, -len/2 + 0.95 + i*(len - 1.9)/6));
    return g;
  }

  // ---------- models (metres; face +z; y up; ground at y = 0)
  function mbt(){
    const g = new T.Group(), t = team(), td = team(true), L = 7.9;
    for (const sx of [-1.48, 1.48]){ g.add(trackRun(sx, L - 0.3, M.rubber)); g.add(box(0.1, 0.42, L - 1.4, td, sx*1.24, 0.9, 0.1)); }
    g.add(extrudeSide([[-3.95, 0.72], [3.2, 0.72], [3.95, 1.0], [3.55, 1.28], [2.6, 1.55], [-3.85, 1.6]], 3.3, t));
    g.add(box(3.0, 0.3, 0.5, M.dark, 0, 1.25, -3.9));
    const tur = new T.Group(); tur.name = 'turret';
    tur.add(extrudeSide([[-2.3, 0], [0.9, 0], [2.25, 0.18], [1.75, 0.82], [-2.05, 0.9]], 3.1, t));
    tur.add(box(2.4, 0.5, 0.9, M.gearD, 0, 0.45, -2.6));                       // bustle rack
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++){ const sd = cyl(0.07, 0.07, 0.35, M.dark, 8); sd.rotation.x = 1.1; sd.position.set(sx*(1.25 + i*0.12), 0.72, 1.35 - i*0.12); tur.add(sd); }
    const cupola = cyl(0.36, 0.42, 0.28, td); cupola.position.set(-0.75, 1.05, -0.5); tur.add(cupola);
    const sight = box(0.45, 0.32, 0.45, M.dark, 0.85, 1.05, 0.55); tur.add(sight);
    const ant = cyl(0.015, 0.015, 2.0, M.dark, 5); ant.position.set(1.1, 1.8, -1.9); tur.add(ant);
    const gun = new T.Group(); gun.name = 'gun';
    const barrel = cyl(0.085, 0.1, 5.4, M.steel); barrel.rotation.x = Math.PI/2; barrel.position.set(0, 0.42, 4.2); gun.add(barrel);
    const fume = cyl(0.16, 0.16, 0.7, M.steel); fume.rotation.x = Math.PI/2; fume.position.set(0, 0.42, 3.6); gun.add(fume);
    const mant = box(0.9, 0.55, 0.45, td, 0, 0.42, 1.65); gun.add(mant);
    tur.add(gun); tur.position.set(0, 1.62, -0.35); g.add(tur);
    return {g, ext:6.6};
  }
  function ifv(){
    // 8x8 wheeled infantry carrier
    const g = new T.Group(), t = team(), td = team(true);
    for (const sx of [-1.38, 1.38]) for (let i = 0; i < 4; i++) g.add(wheel(0.55, 0.42, M.rubber, sx, 0.55, 2.5 - i*1.55));
    g.add(extrudeSide([[-3.7, 0.65], [3.0, 0.65], [3.75, 1.2], [3.1, 1.85], [-3.6, 2.05]], 2.7, t));
    g.add(box(2.4, 1.0, 0.1, td, 0, 1.4, -3.68));
    const tur = new T.Group(); tur.name = 'turret';
    tur.add(extrudeSide([[-0.9, 0], [0.6, 0], [1.0, 0.25], [0.7, 0.62], [-0.9, 0.65]], 1.7, td));
    const gun = new T.Group(); gun.name = 'gun'; const b = cyl(0.045, 0.05, 2.4, M.steel, 10); b.rotation.x = Math.PI/2; b.position.set(0.25, 0.35, 1.9); gun.add(b); tur.add(gun);
    const atgm = box(0.3, 0.3, 1.2, M.gearD, -0.95, 0.5, 0.1); tur.add(atgm);
    tur.position.set(0, 2.05, 0.4); g.add(tur);
    return {g, ext:6.6};
  }
  function arty(){
    // self-propelled howitzer: tracked chassis, big boxy turret, long gun
    const g = new T.Group(), t = team(), td = team(true), L = 7.4;
    for (const sx of [-1.45, 1.45]){ g.add(trackRun(sx, L, M.rubber)); g.add(box(0.1, 0.4, L - 1.3, td, sx*1.24, 0.9, 0)); }
    g.add(extrudeSide([[-3.7, 0.72], [3.0, 0.72], [3.7, 1.05], [3.2, 1.45], [-3.6, 1.5]], 3.2, t));
    const tur = new T.Group(); tur.name = 'turret';
    tur.add(box(3.0, 1.45, 3.9, t, 0, 0.72, -0.6));
    tur.add(box(3.1, 0.12, 4.0, td, 0, 1.48, -0.6));
    const gun = new T.Group(); gun.name = 'gun';
    const b = cyl(0.11, 0.13, 6.4, M.steel); b.rotation.x = Math.PI/2; b.position.set(0, 0, 3.4); gun.add(b);
    const brake = box(0.42, 0.3, 0.5, M.steel, 0, 0, 6.6); gun.add(brake);
    gun.position.set(0, 0.9, 1.3); gun.rotation.x = -0.42; tur.add(gun);
    tur.position.set(0, 1.5, -0.2); g.add(tur);
    return {g, ext:7.2};
  }
  function sam(){
    const g = new T.Group(), t = team(), td = team(true);
    for (const z of [3.4, 2.0, -1.6, -3.0]) for (const sx of [-1.25, 1.25]) g.add(wheel(0.55, 0.4, M.rubber, sx, 0.55, z));
    g.add(box(2.5, 0.45, 9.6, M.dark, 0, 0.95, 0.1));
    g.add(box(2.6, 1.6, 1.9, t, 0, 1.95, 3.85));
    g.add(box(2.3, 0.7, 0.08, M.glass, 0, 2.25, 4.81));
    const lau = new T.Group(); lau.name = 'gun';
    for (let i = 0; i < 4; i++){ const tube = box(0.62, 0.62, 5.8, td, -0.36 + (i % 2)*0.72, (i >> 1)*0.72, 0); lau.add(tube); lau.add(box(0.56, 0.56, 0.05, M.white, -0.36 + (i % 2)*0.72, (i >> 1)*0.72, 2.92)); }
    lau.position.set(0, 1.9, -1.2); lau.rotation.x = -0.55; g.add(lau);
    const radar = box(1.4, 0.9, 0.12, M.white, 0.6, 3.1, 3.4); radar.rotation.x = -0.3; g.add(radar);
    return {g, ext:7.8};
  }
  function soldier(t, tube){
    const s = new T.Group(), k = 1.16;
    const legL = new T.Group(), legR = new T.Group(); legL.name = 'legL'; legR.name = 'legR';
    for (const L of [legL, legR]){ L.add(box(0.17*k, 0.66*k, 0.2*k, M.gear, 0, -0.33*k, 0)); L.add(box(0.18*k, 0.11*k, 0.28*k, M.dark, 0, -0.66*k, 0.04)); }
    legL.position.set(-0.12*k, 0.72*k, 0); legR.position.set(0.12*k, 0.72*k, 0); s.add(legL, legR);
    s.add(box(0.46*k, 0.6*k, 0.28*k, t, 0, 1.03*k, 0));
    s.add(box(0.5*k, 0.32*k, 0.32*k, M.gearD, 0, 0.98*k, 0));                    // webbing / vest
    s.add(box(0.36*k, 0.44*k, 0.2*k, M.gear, 0, 1.06*k, -0.24*k));
    s.add(mesh(new T.SphereGeometry(0.135*k, 12, 10), M.skin, 0, 1.47*k, 0.02));
    s.add(mesh(new T.SphereGeometry(0.165*k, 12, 8, 0, Math.PI*2, 0, Math.PI/2), team(true), 0, 1.5*k, 0));
    const armR = new T.Group(); armR.name = 'armR'; armR.add(box(0.13*k, 0.52*k, 0.13*k, t, 0, -0.23*k, 0)); armR.position.set(0.3*k, 1.27*k, 0); s.add(armR);
    const armL = new T.Group(); armL.name = 'armL'; armL.add(box(0.13*k, 0.52*k, 0.13*k, t, 0, -0.23*k, 0)); armL.position.set(-0.3*k, 1.27*k, 0); s.add(armL);
    if (tube){ const tb = cyl(0.1, 0.1, 1.3, M.gear, 10); tb.rotation.x = Math.PI/2; tb.position.set(0.22, 1.48*k, 0.05); s.add(tb); }
    else { const rifle = box(0.07, 0.1, 0.95, M.dark, 0.2, 1.08*k, 0.36); rifle.rotation.x = -0.22; s.add(rifle); armR.rotation.x = -0.95; armL.rotation.x = -0.75; }
    return s;
  }
  function mlrs(){
    const g = new T.Group(), t = team(), td = team(true);
    for (const z of [2.2, 0.9, -0.6, -1.9]) for (const sx of [-1.15, 1.15]){ const w = cyl(0.55, 0.55, 0.42, M.rubber, 14); w.rotation.z = Math.PI/2; w.position.set(sx, 0.55, z); g.add(w); const hub = cyl(0.22, 0.22, 0.44, M.gearD, 8); hub.rotation.z = Math.PI/2; hub.position.set(sx, 0.55, z); g.add(hub); }
    g.add(box(2.1, 0.5, 6.0, td, 0, 1.0, 0.1));                                       // chassis
    g.add(extrudeSide([[1.9, 1.25], [3.25, 1.25], [3.25, 2.1], [2.9, 2.75], [1.9, 2.75]], 2.2, t));   // cab
    g.add(box(1.9, 0.5, 0.06, M.glass, 0, 2.35, 2.98));
    const pod = new T.Group(); pod.name = 'pod'; pod.position.set(0, 1.55, -0.9);
    const body = box(1.9, 1.0, 3.2, t, 0, 0.5, 0); pod.add(body);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++){ const tb = cyl(0.17, 0.17, 0.08, M.dark, 10); tb.rotation.x = Math.PI/2; tb.position.set(-0.6 + c*0.6, 0.28 + r*0.46, 1.62); pod.add(tb); }
    const flame = mesh(new T.ConeGeometry(0.35, 1.6, 10), M.exhaust); flame.rotation.x = Math.PI/2; flame.position.set(0, 0.5, -2.1); flame.name = 'flame'; flame.castShadow = false; pod.add(flame);
    g.add(pod);
    return {g, ext:4.6};
  }
  function squad(tube, spec){
    const g = new T.Group(), t = team();
    const spots = tube ? [[-1.1, 0.4], [0.2, -0.6], [1.3, 0.5]] : [[-2.0, 0.6], [-0.9, -0.7], [0.2, 0.5], [1.3, -0.6], [2.3, 0.4]];
    const sp = spec ? [[-1.0, 0.3], [0.1, -0.5], [1.1, 0.4]] : spots;
    sp.forEach(([x, z], i) => { const s = soldier(spec ? team(true) : t, tube && i !== 1); s.position.set(x, 0, z); s.rotation.y = (i % 2 ? 0.25 : -0.2); s.userData.ph = i*1.7; s.name = 'soldier'; if (spec){ s.scale.set(1, 0.9, 1); s.rotation.x = 0.12; } g.add(s); });
    return {g, ext:4.2};
  }
  function jet(kind){
    const g = new T.Group(), t = team(), td = team(true), s = 2.9;          // ~16-18 m long fighter
    const prof = []; for (let i = 0; i <= 14; i++){ const u = i/14; prof.push(new T.Vector2((0.06 + Math.sin(Math.min(1, u*1.6)*Math.PI/2)*0.42*(1 - Math.max(0, u - 0.85)*3))*s, (u - 0.5)*5.6*s)); }
    const fus = mesh(new T.LatheGeometry(prof, 18), t); fus.rotation.x = Math.PI/2; g.add(fus);
    const nose = mesh(new T.ConeGeometry(0.2*s, 0.9*s, 16), M.hazeD); nose.rotation.x = Math.PI/2; nose.position.z = 3.2*s; g.add(nose);
    const can = mesh(new T.SphereGeometry(0.28*s, 16, 10), M.glass); can.scale.set(0.8, 0.62, 2.0); can.position.set(0, 0.36*s, 1.4*s); g.add(can);
    const wing = kind === 'int' ? [[0, 1.3], [3.0, -1.6], [3.0, -2.0], [0, -1.7], [-3.0, -2.0], [-3.0, -1.6]] : [[0, 1.0], [2.9, -0.7], [2.9, -1.3], [0.4, -1.1], [-0.4, -1.1], [-2.9, -1.3], [-2.9, -0.7]];
    g.add(extrudeTop(wing.map(([x, z]) => [x*s, z*s]), 0.12, td));
    g.add(extrudeTop([[0, -1.9], [1.3, -2.8], [1.3, -3.0], [0, -2.8], [-1.3, -3.0], [-1.3, -2.8]].map(([x, z]) => [x*s, z*s]), 0.08, td)).position.y = 0.1;
    for (const sx of kind === 'int' ? [-0.38, 0.38] : [0]){ const fin = extrudeSide([[-2.9, 0], [-1.9, 0], [-2.4, 1.0], [-2.9, 1.05]].map(([z, y]) => [z*s, y*s]), 0.1, t); fin.position.x = sx*s; fin.rotation.z = sx*0.5; g.add(fin); }
    if (kind === 'int'){ for (const sx of [-3.0, 3.0]){ const m = cyl(0.07*s, 0.07*s, 1.3*s, M.white, 8); m.rotation.x = Math.PI/2; m.position.set(sx*s, -0.03*s, -1.3*s); g.add(m); } }
    else { for (const sx of [-1.5, 1.5]){ const bomb = cyl(0.15*s, 0.15*s, 1.0*s, M.dark, 10); bomb.rotation.x = Math.PI/2; bomb.position.set(sx*s, -0.24*s, -0.4*s); g.add(bomb); } }
    const flame = mesh(new T.ConeGeometry(0.24*s, 1.1*s, 12), M.exhaust); flame.rotation.x = -Math.PI/2; flame.position.z = -3.35*s; flame.name = 'flame'; flame.castShadow = false; g.add(flame);
    return {g, ext:9.8, air:true};
  }
  // attack helicopter (~17 m): slim fuselage, stepped tandem canopy, stub wings with pods, tail boom; frames spin the rotor
  function heli(){
    const g = new T.Group(), t = team(), td = team(true), s = 1.6;
    const prof = []; for (let i = 0; i <= 12; i++){ const u = i/12; prof.push(new T.Vector2((0.1 + Math.sin(Math.min(1, u*1.3)*Math.PI*0.5)*0.55*(1 - Math.max(0, u - 0.7)*2.6))*s, (u - 0.5)*5.0*s)); }
    const fus = mesh(new T.LatheGeometry(prof, 16), t); fus.rotation.x = Math.PI/2; fus.scale.set(0.8, 1, 1.15); g.add(fus);
    const can = mesh(new T.SphereGeometry(0.42*s, 14, 10), M.glass); can.scale.set(0.7, 0.75, 2.1); can.position.set(0, 0.42*s, 1.0*s); g.add(can);
    const boom = cyl(0.12*s, 0.24*s, 4.2*s, t, 10); boom.rotation.x = Math.PI/2; boom.position.set(0, 0.2*s, -3.3*s); g.add(boom);
    const fin = extrudeSide([[-5.4, 0], [-4.9, 0], [-5.2, 1.2], [-5.6, 1.25]].map(([z, y]) => [z*s, y*s]), 0.08, td); fin.position.y = 0.15*s; g.add(fin);
    g.add(extrudeTop([[0.0, -4.6], [0.9, -4.9], [0.9, -5.1], [-0.9, -5.1], [-0.9, -4.9]].map(([x, z]) => [x*s, z*s]), 0.06, td)).position.y = 0.3*s;
    g.add(extrudeTop([[0, 0.5], [1.6, 0.2], [1.6, -0.4], [-1.6, -0.4], [-1.6, 0.2]].map(([x, z]) => [x*s, z*s]), 0.08, td)).position.y = -0.1*s;
    for (const sx of [-1.35, 1.35]){ const pod = cyl(0.17*s, 0.17*s, 1.1*s, M.dark, 10); pod.rotation.x = Math.PI/2; pod.position.set(sx*s, -0.3*s, 0); g.add(pod); }
    const mast = cyl(0.1*s, 0.1*s, 0.5*s, M.dark, 8); mast.position.set(0, 0.85*s, 0.1*s); g.add(mast);
    const rotor = new T.Group(); rotor.name = 'rotor'; rotor.position.set(0, 1.1*s, 0.1*s);
    for (let i = 0; i < 4; i++){ const bl = box(0.28*s, 0.04*s, 7.2*s, M.dark, 0, 0, 0); bl.rotation.y = i*Math.PI/2 + Math.PI/4; bl.castShadow = false; rotor.add(bl); }
    const disc = mesh(new T.CircleGeometry(3.6*s, 32), new T.MeshBasicMaterial({color:0x111111, transparent:true, opacity:0.18})); disc.rotation.x = -Math.PI/2; disc.castShadow = false; rotor.add(disc);
    g.add(rotor);
    const tr = box(0.05*s, 0.9*s, 0.12*s, M.dark, 0.18*s, 0.8*s, -5.3*s); tr.name = 'trotor'; g.add(tr);
    return {g, ext:6.6, air:true};
  }
  // recon drone (~11 m span): long straight wings, V-tail, rear pusher prop, sensor ball
  function drone(){
    const g = new T.Group(), t = team(), td = team(true), s = 1.0;
    const prof = []; for (let i = 0; i <= 12; i++){ const u = i/12; prof.push(new T.Vector2((0.08 + Math.sin(Math.min(1, u*2.2)*Math.PI/2)*0.42*(1 - Math.max(0, u - 0.8)*3.5))*s, (u - 0.5)*7.6*s)); }
    const fus = mesh(new T.LatheGeometry(prof, 14), t); fus.rotation.x = Math.PI/2; g.add(fus);
    g.add(extrudeTop([[0, 0.7], [5.6, 0.35], [5.6, -0.15], [0, 0.05], [-5.6, -0.15], [-5.6, 0.35]].map(([x, z]) => [x*s, z*s]), 0.07, td));
    for (const sx of [-1, 1]){ const v = extrudeSide([[-3.6, 0], [-2.8, 0], [-3.5, 1.0], [-3.9, 1.0]].map(([z, y]) => [z*s, y*s]), 0.06, td); v.position.x = sx*0.15*s; v.rotation.z = sx*0.75; g.add(v); }
    const ball = mesh(new T.SphereGeometry(0.28*s, 12, 8), M.glass); ball.position.set(0, -0.32*s, 2.8*s); g.add(ball);
    const prop = box(1.4*s, 0.04*s, 0.12*s, M.dark, 0, 0, -3.9*s); g.add(prop);
    return {g, ext:6.4, air:true};
  }
  function hullShape(L, B){ return [[0, L/2], [B*0.42, L*0.3], [B/2, 0], [B*0.48, -L*0.38], [B*0.38, -L/2], [-B*0.38, -L/2], [-B*0.48, -L*0.38], [-B/2, 0], [-B*0.42, L*0.3]]; }
  function ship(kind){
    // haze-grey hulls; only the funnel band and deck roundel carry the nation colour
    const g = new T.Group(), t = team();
    if (kind === 'sub'){
      const prof = []; for (let i = 0; i <= 14; i++){ const u = i/14; prof.push(new T.Vector2(Math.sin(u*Math.PI)*0.6 + 0.02, (u - 0.5)*8)); }
      const hull = mesh(new T.LatheGeometry(prof, 18), M.dark); hull.rotation.x = Math.PI/2; hull.position.y = 0.2; hull.scale.y = 0.75; g.add(hull);
      g.add(box(0.4, 0.8, 1.3, M.dark, 0, 0.85, 0.9)); g.add(box(0.42, 0.14, 0.5, t, 0, 1.2, 0.9));
      g.add(box(1.6, 0.06, 0.32, M.dark, 0, 1.0, 0.9)); g.add(box(0.06, 0.7, 0.55, M.dark, 0, 0.35, -3.7));
      return {g, ext:5.2, sea:true};
    }
    if (kind === 'carr'){
      // ~300 m carrier: wide flat flight deck with an angled landing strip, starboard island, a few aircraft on deck
      const L = 10.5, B = 1.7;
      const hull = extrudeTop(hullShape(L, B), 0.7, M.hazeD); hull.position.y = 0.55; g.add(hull);
      const deck = extrudeTop([[0, L*0.5], [B*0.95, L*0.36], [B*1.15, -L*0.2], [B*0.9, -L*0.5], [-B*0.95, -L*0.5], [-B*1.05, L*0.05], [-B*0.6, L*0.42]], 0.12, M.deck, 0); deck.position.y = 1.25; g.add(deck);
      const strip = extrudeTop([[-B*0.15, L*0.32], [B*0.15, L*0.34], [-B*0.55, -L*0.42], [-B*0.85, -L*0.4]], 0.01, M.white, 0); strip.position.y = 1.38; g.add(strip);
      g.add(box(0.5, 1.1, 1.6, M.haze, B*0.85, 1.95, -L*0.08)); g.add(box(0.42, 0.5, 0.9, M.haze, B*0.85, 2.7, -L*0.08));
      g.add(box(0.44, 0.14, 0.92, t, B*0.85, 3.0, -L*0.08));
      const mast = cyl(0.05, 0.07, 1.1, M.dark, 6); mast.position.set(B*0.85, 3.5, -L*0.08); g.add(mast);
      for (const [x, z, r] of [[-0.5, L*0.28, 0.2], [0.4, L*0.18, -0.3], [-0.7, -L*0.25, 0.9], [0.1, -L*0.36, 1.1]]){ const pl = new T.Group();
        pl.add(box(0.16, 0.12, 1.0, M.white, 0, 0, 0)); pl.add(box(0.95, 0.04, 0.32, M.white, 0, 0, -0.05)); pl.add(box(0.4, 0.04, 0.16, M.white, 0, 0, -0.42));
        pl.position.set(x, 1.45, z); pl.rotation.y = r; g.add(pl); }
      return {g, ext:6.6, sea:true};
    }
    const big = kind === 'crui', L = big ? 8.6 : 7.2, B = big ? 1.55 : 1.3;
    const hull = extrudeTop(hullShape(L, B), 0.6, M.hazeD); hull.position.y = 0.6; g.add(hull);
    g.add(extrudeTop(hullShape(L*0.96, B*0.92), 0.03, M.deck, 0)).position.y = 0.65;
    g.add(box(B*0.72, 0.75, L*0.22, M.haze, 0, 1.02, -0.2));
    g.add(box(B*0.52, 0.5, L*0.14, M.haze, 0, 1.62, -0.1));
    const fun = box(B*0.32, 0.55, 0.5, M.hazeD, 0, 1.75, -L*0.12); g.add(fun); g.add(box(B*0.34, 0.14, 0.52, t, 0, 1.92, -L*0.12));
    const mast = cyl(0.06, 0.08, 1.5, M.dark, 6); mast.position.set(0, 2.3, -0.1); g.add(mast);
    g.add(box(0.75, 0.08, 0.18, M.white, 0, 2.75, -0.1));
    for (const z of big ? [L*0.32, -L*0.33] : [L*0.32]){ const tu = new T.Group(); tu.add(cyl(0.34, 0.4, 0.32, M.haze, 14)); const b = cyl(0.05, 0.05, 1.05, M.steel, 8); b.rotation.x = Math.PI/2; b.position.set(0, 0.07, z > 0 ? 0.58 : -0.58); tu.add(b); tu.position.set(0, 0.84, z); g.add(tu); }
    if (big) g.add(box(B*0.5, 0.12, 0.85, M.dark, 0, 0.7, L*0.12));
    else { g.add(box(B*0.85, 0.02, 1.05, M.deck, 0, 0.68, -L*0.38)); const rd = cyl(0.3, 0.3, 0.02, t, 16); rd.position.set(0, 0.7, -L*0.38); g.add(rd); }
    return {g, ext:big ? 5.6 : 4.9, sea:true};
  }
  const BUILDERS = {tank:mbt, ifv, art:arty, sam, inf:() => squad(false), at:() => squad(true), jet:() => jet('jet'), int:() => jet('int'), frig:() => ship('frig'), sub:() => ship('sub'), crui:() => ship('crui'), carr:() => ship('carr'), heli, drone, mlrs, spec:() => squad(false, true)};
  const SPEC = {inf:{dirs:8, frames:8}, at:{dirs:8, frames:8}, tank:{dirs:8, frames:6}, ifv:{dirs:8, frames:2}, art:{dirs:8, frames:4}, sam:{dirs:8, frames:2},
                jet:{dirs:16, frames:2}, int:{dirs:16, frames:2}, frig:{dirs:16, frames:1}, sub:{dirs:16, frames:1}, crui:{dirs:16, frames:1}, carr:{dirs:16, frames:1}, heli:{dirs:16, frames:4}, drone:{dirs:16, frames:1}, mlrs:{dirs:8, frames:3}, spec:{dirs:8, frames:8}};

  // ---------- scene
  const scene = new T.Scene();
  scene.add(new T.HemisphereLight(0xcfdbe6, 0x2b2f24, 0.7));
  const sun = new T.DirectionalLight(0xfff0d8, 1.6); sun.position.set(-7, 14, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); const sc = sun.shadow.camera; sc.left = sc.bottom = -12; sc.right = sc.top = 12; sc.near = 1; sc.far = 60; sun.shadow.bias = -0.001; sun.shadow.radius = 3; scene.add(sun);
  const fill = new T.DirectionalLight(0x9fb6c8, 0.35); fill.position.set(8, 6, -6); scene.add(fill);
  const ground = new T.Mesh(new T.PlaneGeometry(60, 60), new T.ShadowMaterial({opacity:0.42})); ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
  const cam = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  const blackMat = new T.MeshBasicMaterial({color:0x000000}), whiteMat = new T.MeshBasicMaterial({color:0xffffff});

  function pose(model, type, frame){
    const g = model.g;
    if (type === 'inf' || type === 'at' || type === 'spec'){ g.traverse(o => { if (o.name !== 'soldier') return; const ph = frame/8*Math.PI*2 + (o.userData.ph || 0), sw = Math.sin(ph)*0.55;
      o.getObjectByName('legL').rotation.x = sw; o.getObjectByName('legR').rotation.x = -sw; o.position.y = Math.abs(Math.cos(ph))*0.07;
      const aL = o.getObjectByName('armL'), aR = o.getObjectByName('armR'); if (aL && aR && frame){ aL.rotation.x = -0.75 - sw*0.25; aR.rotation.x = -0.95 + sw*0.2; } }); }
    const pod = g.getObjectByName('pod'); if (pod) pod.rotation.x = frame ? -0.55 : 0;
    const gun = g.getObjectByName('gun'), tur = g.getObjectByName('turret');
    if (gun && (type === 'tank' || type === 'art' || type === 'ifv')){
      if (gun.userData.z0 === undefined) gun.userData.z0 = gun.position.z;
      const rec = type === 'tank' ? [0, 0.6, 0.45, 0.25, 0.1, 0][frame] : type === 'art' ? [0, 0.8, 0.4, 0.15][frame] : [0, 0.12][frame];
      gun.position.z = gun.userData.z0 - (rec || 0);
      if (tur && type === 'tank') tur.rotation.x = [0, -0.035, -0.02, -0.01, 0, 0][frame] || 0;
    }
    if (type === 'sam'){ const l = g.getObjectByName('gun'); if (l) l.rotation.x = frame ? -0.75 : -0.55; }
    const fl = g.getObjectByName('flame'); if (fl) fl.visible = type === 'mlrs' ? frame === 2 : frame === 1;
    const ro = g.getObjectByName('rotor'); if (ro) ro.rotation.y = frame*Math.PI/8;
    const tro = g.getObjectByName('trotor'); if (tro) tro.rotation.x = frame*Math.PI/4;
  }
  function build(type){
    if (cache[type]) return cache[type];
    const spec = SPEC[type], model = BUILDERS[type]();
    const {dirs, frames} = spec, base = document.createElement('canvas'), mask = document.createElement('canvas');
    base.width = mask.width = SZ*frames; base.height = mask.height = SZ*dirs;
    const bc = base.getContext('2d'), mc = mask.getContext('2d', {willReadFrequently:true});
    scene.add(model.g); ground.visible = !model.air;
    const half = model.ext; cam.left = -half; cam.right = half; cam.top = half; cam.bottom = -half; cam.updateProjectionMatrix();
    const dist = 60, el = model.air ? 1.3 : 0.8;
    cam.position.set(0, Math.sin(el)*dist, Math.cos(el)*dist); cam.lookAt(0, model.air ? 0 : 0.9, 0);
    const mats = []; model.g.traverse(o => { if (o.isMesh) mats.push([o, o.material]); });
    for (let d = 0; d < dirs; d++){
      model.g.rotation.y = Math.PI/2 - d*Math.PI*2/dirs;
      for (let f = 0; f < frames; f++){
        pose(model, type, f);
        for (const [o, m] of mats) o.material = m;
        renderer.render(scene, cam); bc.drawImage(renderer.domElement, f*SZ, d*SZ);
        for (const [o, m] of mats) o.material = isTeam(m) ? whiteMat : (m === M.exhaust ? blackMat : blackMat);
        const gv = ground.visible; ground.visible = false; renderer.render(scene, cam); mc.drawImage(renderer.domElement, f*SZ, d*SZ); ground.visible = gv;
      }
    }
    for (const [o, m] of mats) o.material = m;
    scene.remove(model.g);
    const id = mc.getImageData(0, 0, mask.width, mask.height), px = id.data;
    for (let i = 0; i < px.length; i += 4){ const v = px[i]; px[i] = px[i + 1] = px[i + 2] = 255; px[i + 3] = px[i + 3] ? v : 0; }
    mc.putImageData(id, 0, 0);
    return (cache[type] = {base, mask, dirs, frames, air:!!model.air, sea:!!model.sea});
  }
  buildFn = build;
  })();
  function mixCol(hex, base, t){ const A = parseInt(hex.slice(1), 16), B = parseInt(base.slice(1), 16); const m = sh => Math.round(((A >> sh) & 255)*(1 - t) + ((B >> sh) & 255)*t); return `rgb(${m(16)},${m(8)},${m(0)})`; }
  const tinted = new Map(); let scratch = null;
  function tint(type, color){
    const k = type + color; if (tinted.has(k)){ const v = tinted.get(k); tinted.delete(k); tinted.set(k, v); return v; }
    const a = cache[type], c = document.createElement('canvas'); c.width = a.base.width; c.height = a.base.height;
    const x = c.getContext('2d');
    // military finish: nation colour blended into olive drab (ground) or grey (sea/air), then brightened to undo the multiply
    let col = color;
    if (color[0] === '#') col = a.sea ? mixCol(color, '#8c9499', 0.25) : a.air ? mixCol(color, '#8a9298', 0.55) : mixCol(color, '#6f7652', 0.55);
    if (!scratch) scratch = document.createElement('canvas'); const cc = scratch; if (cc.width < c.width || cc.height < c.height){ cc.width = Math.max(cc.width, c.width); cc.height = Math.max(cc.height, c.height); } const cx = cc.getContext('2d'); cx.globalCompositeOperation = 'source-over'; cx.clearRect(0, 0, cc.width, cc.height);
    cx.drawImage(a.mask, 0, 0); cx.globalCompositeOperation = 'source-in'; cx.fillStyle = col; cx.fillRect(0, 0, c.width, c.height);
    x.drawImage(a.base, 0, 0); x.globalCompositeOperation = 'multiply'; x.drawImage(cc, 0, 0, c.width, c.height, 0, 0, c.width, c.height);
    x.globalCompositeOperation = 'soft-light'; x.globalAlpha = 0.35; x.drawImage(cc, 0, 0, c.width, c.height, 0, 0, c.width, c.height); x.globalAlpha = 1;
    x.globalCompositeOperation = 'destination-in'; x.drawImage(a.base, 0, 0);
    tinted.set(k, c); while (tinted.size > 36) tinted.delete(tinted.keys().next().value);
    return c;
  }
  const shadowSheets = {};
  function nightSheet(type){ if (shadowSheets[type]) return shadowSheets[type]; const a = cache[type], c = document.createElement('canvas'); c.width = a.base.width; c.height = a.base.height; const x = c.getContext('2d'); x.drawImage(a.base, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#0a1426'; x.fillRect(0, 0, c.width, c.height); return (shadowSheets[type] = c); }
  function loadImg(src){ return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; }); }
  async function loadBaked(dir){
    const types = Object.keys(META);
    await Promise.all(types.map(async t => { const [b, m] = await Promise.all([loadImg(dir + t + '.png'), loadImg(dir + t + '_m.png')]); const meta = META[t], sc = SZ/BAKE_SZ;
      const mk = im => { const c = document.createElement('canvas'); c.width = Math.round(im.width*sc); c.height = Math.round(im.height*sc); const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, c.width, c.height); return c; };
      cache[t] = {base:mk(b), mask:mk(m), dirs:meta.dirs, frames:meta.frames, air:!!meta.air, sea:!!meta.sea}; }));
    return true;
  }
  const queue = ['inf', 'tank', 'at', 'art', 'ifv', 'sam', 'jet', 'int', 'frig', 'sub', 'crui', 'heli', 'drone', 'carr', 'mlrs', 'spec'];
  let warm = false;
  function warmup(){ if (warm || !buildFn) return; warm = true; let i = 0; const step = () => { if (i >= queue.length) return; try { if (!cache[queue[i]]) buildFn(queue[i]); i++; } catch (e) { i++; } setTimeout(step, 30); }; setTimeout(step, 50); }
  window.U3D = {
    SZ, has: type => !!cache[ALIAS[type] || type], warmup, loadBaked, canRender: () => !!buildFn,
    exportAtlas(type){ if (!cache[type] && buildFn) buildFn(type); const a = cache[type]; return a ? {base:a.base.toDataURL('image/png'), mask:a.mask.toDataURL('image/png')} : null; },
    // draw a unit sprite centred on (x, y) at on-screen height h; ang in radians (screen space)
    draw(ctx, type, color, x, y, h, ang, frame = 0, night = false){
      type = ALIAS[type] || type; const a = cache[type]; if (!a) return false;
      const sheet = tint(type, color);
      const d = Math.round(((ang % (Math.PI*2)) + Math.PI*2) % (Math.PI*2)/(Math.PI*2)*a.dirs) % a.dirs, f = Math.max(0, Math.min(a.frames - 1, frame | 0));
      const q = ctx.imageSmoothingQuality; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(sheet, f*SZ, d*SZ, SZ, SZ, x - h/2, y - h*0.62, h, h);
      if (night){ const ga = ctx.globalAlpha; ctx.globalAlpha = ga*0.32; ctx.drawImage(nightSheet(type), f*SZ, d*SZ, SZ, SZ, x - h/2, y - h*0.62, h, h); ctx.globalAlpha = ga; }
      ctx.imageSmoothingQuality = q;
      return true;
    },
  };
})();
