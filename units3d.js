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
  let buildFn = null, mapFn = null;
  // the baked map atlases (assets/units/m-<type>.webp): their crop, ground origin and per-direction model boxes, written by tools/bake-assets.js map
  const MAPMETA = {"sol":{"w":214,"h":246,"ox":90,"oy":166.36,"ppm":99.2,"air":false,"sea":false,"bb":[[56,31,159,184],[53,24,163,190],[54,17,156,197],[53,10,139,201],[56,6,120,203],[56,3,120,200],[49,4,119,194],[35,7,120,186],[21,12,124,180],[17,19,127,182],[24,27,126,183],[41,23,127,182],[60,22,124,179],[60,23,124,178],[61,27,131,179],[60,32,145,180]]},"hmv":{"w":316,"h":316,"ox":158,"oy":191.45,"ppm":54.4,"air":false,"sea":false,"bb":[[13,41,305,238],[10,13,309,259],[21,0,297,271],[52,0,265,278],[92,0,224,274],[51,0,264,278],[19,0,295,271],[7,0,306,259],[11,18,303,238],[7,50,306,259],[19,49,295,273],[51,41,264,281],[92,50,224,274],[52,41,265,281],[21,49,297,273],[10,70,309,259]]},"truck":{"w":380,"h":358,"ox":182,"oy":203.63,"ppm":44.8,"air":false,"sea":false,"bb":[[29,75,344,245],[21,48,350,274],[37,21,332,294],[74,10,294,301],[118,17,246,293],[70,10,290,301],[32,21,327,294],[14,48,344,274],[20,75,335,245],[14,41,343,271],[32,14,327,290],[70,3,290,297],[118,9,246,293],[74,3,294,297],[37,14,332,290],[21,41,350,271]]},"tank":{"w":520,"h":520,"ox":260,"oy":289.56,"ppm":48,"air":false,"sea":false,"bb":[[72,116,520,354],[56,93,520,394],[68,81,497,418],[109,80,415,450],[168,82,352,468],[105,71,411,450],[23,71,452,418],[0,83,464,394],[0,143,448,354],[0,133,464,394],[23,47,452,418],[105,0,411,424],[168,0,352,409],[109,0,415,423],[68,47,497,418],[56,133,520,394]]},"ifv":{"w":432,"h":396,"ox":211,"oy":218.5,"ppm":48,"air":false,"sea":false,"bb":[[20,83,405,273],[15,47,409,305],[32,16,389,326],[75,3,346,332],[131,11,291,320],[76,3,347,332],[33,16,391,326],[13,46,407,305],[17,47,401,273],[13,51,407,300],[33,25,391,322],[76,18,347,339],[132,9,290,336],[75,18,346,339],[31,25,389,322],[15,51,409,300]]},"art":{"w":520,"h":520,"ox":260,"oy":287.52,"ppm":44.8,"air":false,"sea":false,"bb":[[91,144,520,345],[75,109,520,382],[86,85,502,418],[122,76,397,453],[178,55,342,466],[123,48,398,453],[18,75,434,418],[0,90,445,383],[0,111,429,345],[0,109,445,383],[18,10,434,407],[123,0,399,412],[178,0,342,399],[122,0,397,412],[86,10,502,407],[75,109,520,383]]},"mlrs":{"w":376,"h":354,"ox":183,"oy":200.56,"ppm":44.8,"air":false,"sea":false,"bb":[[30,64,346,243],[25,46,353,271],[40,19,336,289],[76,8,296,295],[124,13,242,289],[70,8,290,295],[30,19,326,289],[13,46,341,271],[20,46,336,243],[13,20,341,269],[30,8,326,287],[70,3,291,292],[124,9,242,289],[76,3,296,292],[40,13,336,287],[25,38,353,269]]},"sam":{"w":434,"h":386,"ox":209,"oy":214.58,"ppm":41.6,"air":false,"sea":false,"bb":[[38,76,402,256],[36,90,406,292],[60,66,381,317],[106,55,331,330],[152,57,266,330],[88,55,312,330],[37,66,358,317],[12,90,382,292],[16,76,380,256],[12,54,382,286],[37,20,358,307],[88,4,313,319],[152,8,266,318],[106,4,330,319],[60,20,381,307],[36,54,406,285]]},"frig":{"w":418,"h":330,"ox":209,"oy":189.32,"ppm":54.4,"air":false,"sea":true,"bb":[[6,65,413,198],[11,71,397,234],[46,32,353,282],[106,6,287,315],[180,2,238,326],[131,6,312,315],[65,32,372,282],[21,71,407,234],[5,65,412,198],[21,60,407,252],[65,46,372,296],[131,14,312,322],[180,3,238,326],[106,14,287,322],[46,46,353,296],[11,60,397,252]]},"sub":{"w":448,"h":348,"ox":224,"oy":195,"ppm":51.2,"air":false,"sea":true,"bb":[[4,131,415,203],[20,103,400,239],[68,51,359,283],[139,16,299,312],[191,4,257,323],[149,16,309,312],[89,51,380,283],[48,103,428,239],[33,131,444,203],[48,108,428,246],[89,82,380,298],[149,55,309,333],[191,45,257,345],[139,55,299,333],[68,82,359,298],[20,106,400,246]]},"crui":{"w":484,"h":378,"ox":242,"oy":211.72,"ppm":53.0612,"air":false,"sea":true,"bb":[[7,91,478,224],[13,88,460,266],[54,37,409,322],[124,7,332,359],[209,3,275,371],[152,7,360,359],[75,37,430,322],[24,88,471,266],[6,91,477,224],[24,84,471,286],[75,53,430,337],[152,16,360,367],[209,3,275,372],[124,16,332,367],[54,53,409,337],[13,84,460,286]]},"heli":{"w":380,"h":380,"ox":190,"oy":205.55,"ppm":25.6,"air":true,"sea":false,"bb":[[0,81,318,231],[0,59,309,251],[21,19,318,258],[68,0,310,277],[96,0,284,284],[70,0,312,277],[62,19,360,258],[71,59,380,251],[62,81,380,231],[70,60,380,264],[62,54,359,311],[70,61,312,343],[96,78,284,357],[68,61,310,343],[20,54,318,311],[0,60,310,264]]},"jet":{"w":368,"h":350,"ox":184,"oy":190.67,"ppm":20.8,"air":true,"sea":false,"bb":[[18,81,368,263],[19,67,354,240],[31,46,314,274],[53,18,269,306],[70,4,298,317],[98,5,315,305],[54,21,337,274],[14,51,350,240],[0,81,350,263],[14,103,349,276],[54,67,337,293],[98,35,315,305],[70,25,298,308],[53,35,269,303],[31,67,314,293],[19,103,354,276]]},"int":{"w":368,"h":350,"ox":184,"oy":190.67,"ppm":20.8,"air":true,"sea":false,"bb":[[18,67,368,276],[19,51,354,260],[31,46,314,274],[33,18,294,306],[53,4,315,317],[75,5,335,305],[54,21,337,274],[14,51,350,260],[0,67,350,276],[14,85,349,293],[54,67,337,293],[75,35,335,305],[53,25,315,308],[33,35,294,303],[31,67,314,293],[19,85,354,293]]},"drone":{"w":360,"h":300,"ox":175,"oy":154.69,"ppm":19.2,"air":true,"sea":false,"bb":[[65,4,277,273],[66,13,269,264],[53,41,301,238],[18,43,333,216],[6,39,344,222],[17,41,332,216],[49,41,297,238],[81,13,284,264],[73,4,285,273],[80,12,284,263],[49,38,296,235],[17,65,332,245],[6,59,344,250],[18,65,333,243],[54,38,301,235],[66,12,270,263]]},"carr":{"w":476,"h":372,"ox":238,"oy":207.17,"ppm":41.9355,"air":false,"sea":true,"bb":[[6,72,470,246],[10,60,453,265],[44,20,411,318],[105,3,364,355],[146,10,316,367],[122,10,395,355],[69,33,450,318],[23,77,473,270],[6,107,470,235],[23,90,466,293],[65,51,432,336],[112,18,371,364],[160,5,330,367],[81,18,353,364],[26,48,407,336],[3,83,453,287]]}};
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
  function team(dark){ const m = std(dark ? 0x75756e : 0x9a9a92, 0.85, 0.05); m.userData.team = true; m.userData.dark = !!dark; return m; }
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
  const ground = new T.Mesh(new T.PlaneGeometry(60, 60), new T.ShadowMaterial({opacity:0.2})); ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
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

  // ---------- map models (troops standing on the map beside their counters, tools/bake-assets.js map). Original designs, modelled in metres with
  // rounded edges and many small parts, finished in shader-made camouflage (a three-tone disruptive pattern in the model's own space, so it stays put
  // on the hull in every direction), fine grain, dust on the lower parts and varied roughness; lit by a warm north-west sun plus several weak sky
  // lights that each cast a soft shadow (a cheap ambient occlusion: dark under turrets, between wheels, inside the cab), rendered at twice the size
  // and filtered down. Ships are cut at the waterline.
  const CU = {inv:{value:new T.Matrix4()}};
  const GLN = `varying vec3 vMP;
float h3(vec3 p){ p = fract(p*0.3183099 + vec3(0.11, 0.17, 0.13)); p *= 17.0; return fract(p.x*p.y*p.z*(p.x + p.y + p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0 - 2.0*f);
  return mix(mix(mix(h3(i), h3(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 0.0)), h3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
             mix(mix(h3(i + vec3(0.0, 0.0, 1.0)), h3(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 1.0)), h3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
float fbm(vec3 p){ return 0.5*n3(p) + 0.28*n3(p*2.07 + 7.1) + 0.14*n3(p*4.13 + 3.3) + 0.08*n3(p*8.3 + 1.7); }
`;
  const lv = hex => { const c = new T.Color(hex); c.convertSRGBToLinear(); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
  // o: {camo:[c1, c2, c3] (patches over the base colour), cs: patch size (m), grain, dust, dh: dust height (m), wear: lighter worn edges}
  function pbr(col, rough, metal, o = {}){
    const m = lin(new T.MeshStandardMaterial({color:col, roughness:rough, metalness:metal})), key = 'pbr' + JSON.stringify(o);
    m.customProgramCacheKey = () => key; m.userData.pbr = true;
    m.onBeforeCompile = sh => {
      sh.uniforms.uInv = CU.inv;
      sh.vertexShader = 'uniform mat4 uInv;\nvarying vec3 vMP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vMP = (uInv*modelMatrix*vec4(transformed, 1.0)).xyz;');
      let code = '';
      if (o.camo){ const s = (1/(o.cs || 1.4)).toFixed(4);
        code += `{ vec3 q = vMP*${s}; float a = fbm(q), b = fbm(q*1.15 + vec3(11.3, 4.7, 2.1)), c = fbm(q*0.9 + vec3(-5.2, 9.1, 3.7)); vec3 col = diffuseColor.rgb;
  col = mix(col, ${lv(o.camo[0])}, smoothstep(0.5, 0.53, a));
  col = mix(col, ${lv(o.camo[1])}, smoothstep(0.55, 0.58, b));
  col = mix(col, ${lv(o.camo[2])}, smoothstep(0.6, 0.63, c)*${(o.k3 ?? 1).toFixed(2)});
  diffuseColor.rgb = col; }\n`; }
      const gr = (o.grain ?? 0.16).toFixed(3), du = (o.dust ?? 0.3).toFixed(3), dh = (o.dh ?? 1.0).toFixed(3), gs = (o.gs ?? 9).toFixed(2);
      code += `{ float g = n3(vMP*${gs})*0.6 + n3(vMP*${gs}*3.1)*0.4; diffuseColor.rgb *= 1.0 - ${gr}*0.5 + ${gr}*g;
  float d = (1.0 - smoothstep(0.0, ${dh}, vMP.y))*(0.45 + 0.55*n3(vMP*vec3(2.1, 5.0, 2.1))); diffuseColor.rgb = mix(diffuseColor.rgb, ${lv(o.dc || 0x8a7d62)}, clamp(d, 0.0, 1.0)*${du}); }\n`;
      sh.fragmentShader = GLN + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + code)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = clamp(roughnessFactor + (n3(vMP*6.0) - 0.5)*0.24, 0.04, 1.0);');
    };
    return m; }
  const CAMO_LAND = {camo:[0x2c341f, 0x463b29, 0x1b1c16], cs:1.5}, CAMO_SEA = {camo:[0x737b80, 0x5a6166, 0x6a7277], cs:2.2, k3:0.6, dust:0.06, grain:0.1}, CAMO_AIR = {camo:[0x535b61, 0x6c747a, 0x4a5257], cs:2.6, k3:0.6, dust:0.04, grain:0.08};
  const P = {
    olive:pbr(0x515a37, 0.78, 0.08, CAMO_LAND), oliveD:pbr(0x444b2e, 0.85, 0.08, Object.assign({}, CAMO_LAND, {k3:0.6})),
    uni:pbr(0x5f6445, 0.95, 0, {camo:[0x40472d, 0x6d6448, 0x2e2f22], cs:0.16, gs:30, dust:0.35, dh:0.5}),
    gear:pbr(0x56583e, 0.92, 0, {grain:0.2, gs:24, dust:0.2, dh:0.5}), gearD:pbr(0x3b3d2c, 0.92, 0, {grain:0.2, gs:24, dust:0.15, dh:0.5}),
    tarp:pbr(0x55573b, 0.97, 0, {camo:[0x41482d, 0x655c43, 0x2f3123], cs:1.3, grain:0.22, gs:14}),
    skin:pbr(0xa07a5a, 0.75, 0, {grain:0.05, dust:0}), boot:pbr(0x2c2a24, 0.85, 0, {dust:0.15, dh:0.2}),
    steel:pbr(0x3a3d3c, 0.42, 0.7, {grain:0.12, dust:0.15}), gun:pbr(0x232524, 0.5, 0.6, {grain:0.08, dust:0}),
    rubber:pbr(0x1d1e1c, 0.96, 0, {grain:0.12, gs:20, dust:0.45, dh:0.9}), track:pbr(0x2b2a26, 0.7, 0.45, {grain:0.3, gs:30, dust:0.5, dh:1.2, dc:0x7d6f55}),
    dark:pbr(0x262724, 0.8, 0.2, {dust:0.1}), glass:pbr(0x1f3442, 0.06, 0.9, {grain:0, dust:0}), lamp:pbr(0xd8d4c0, 0.2, 0.3, {grain:0, dust:0}),
    navy:pbr(0x7d858a, 0.62, 0.25, CAMO_SEA), navyD:pbr(0x5d656a, 0.66, 0.25, CAMO_SEA), deck:pbr(0x4d5254, 0.85, 0.15, {grain:0.18, gs:6, dust:0}), hullR:pbr(0x5a2b25, 0.7, 0.1, {dust:0}),
    sub:pbr(0x222628, 0.55, 0.2, {grain:0.1, dust:0}), white:pbr(0xd9d7cc, 0.7, 0.05, {grain:0.06, dust:0}),
    air:pbr(0x5d666c, 0.52, 0.35, CAMO_AIR), airD:pbr(0x464d52, 0.56, 0.35, CAMO_AIR), rotor:pbr(0x4a4f4a, 0.6, 0.3, {dust:0}),
    heli:pbr(0x67715b, 0.6, 0.2, {camo:[0x56604b, 0x7b8569, 0x4b5442], cs:2.2, k3:0.5, dust:0.05, grain:0.08}), heliD:pbr(0x515a46, 0.64, 0.2, {camo:[0x454e3b, 0x65705a, 0x3e4635], cs:2.2, k3:0.5, dust:0.04, grain:0.08}),
    bolt:pbr(0x2e302a, 0.55, 0.5, {grain:0.05, dust:0.1}),
    foam:new T.MeshBasicMaterial({color:0xe9f2f4, transparent:true, opacity:0.32, depthWrite:false}),
  };
  const ad = (p, o) => { p.add(o); return o; };
  const mk = (geo, mat, x = 0, y = 0, z = 0) => mesh(geo, mat, x, y, z);
  // a box with rounded edges and corners (r: radius)
  function rbox(w, h, d, r, mat, x = 0, y = 0, z = 0){ r = Math.max(0.005, Math.min(r, w/2 - 0.002, h/2 - 0.002, d/2 - 0.002));
    const W = w/2 - r, H = h/2 - r, c = Math.min(r, W*0.9, H*0.9), sh = new T.Shape();
    sh.moveTo(-W + c, -H); sh.lineTo(W - c, -H); sh.quadraticCurveTo(W, -H, W, -H + c); sh.lineTo(W, H - c); sh.quadraticCurveTo(W, H, W - c, H); sh.lineTo(-W + c, H); sh.quadraticCurveTo(-W, H, -W, H - c); sh.lineTo(-W, -H + c); sh.quadraticCurveTo(-W, -H, -W + c, -H);
    const g = new T.ExtrudeGeometry(sh, {depth:Math.max(0.001, d - 2*r), bevelEnabled:true, bevelThickness:r, bevelSize:r, bevelSegments:2, curveSegments:3}); g.translate(0, 0, -Math.max(0.001, d - 2*r)/2);
    return mk(g, mat, x, y, z); }
  // a side profile [(z, y)...] extruded across x (width), rounded edges
  function side(points, width, mat, bev = 0.06){ const sh = new T.Shape(); sh.moveTo(points[0][0], points[0][1]); for (let i = 1; i < points.length; i++) sh.lineTo(points[i][0], points[i][1]); sh.closePath();
    const g = new T.ExtrudeGeometry(sh, {depth:Math.max(0.001, width - 2*bev), bevelEnabled:bev > 0, bevelThickness:bev, bevelSize:bev, bevelSegments:2}); g.translate(0, 0, -(width - 2*bev)/2); const o = mk(g, mat); o.rotation.y = -Math.PI/2; return o; }
  // a plan outline [(x, z)...] extruded upward from y0 by h
  function plan(points, h, mat, y0 = 0, bev = 0.05){ const sh = new T.Shape(); sh.moveTo(points[0][0], -points[0][1]); for (let i = 1; i < points.length; i++) sh.lineTo(points[i][0], -points[i][1]); sh.closePath();
    const g = new T.ExtrudeGeometry(sh, {depth:Math.max(0.001, h - 2*bev), bevelEnabled:bev > 0, bevelThickness:bev, bevelSize:bev, bevelSegments:2}); g.rotateX(-Math.PI/2); g.translate(0, y0 + bev, 0); return mk(g, mat); }
  const cy = (rt, rb, h, mat, seg = 16, x = 0, y = 0, z = 0) => mk(new T.CylinderGeometry(rt, rb, h, seg), mat, x, y, z);
  const cyX = (r, len, mat, x, y, z, seg = 14) => { const o = cy(r, r, len, mat, seg, x, y, z); o.rotation.z = Math.PI/2; return o; };
  const cyZ = (rt, rb, len, mat, x, y, z, seg = 14) => { const o = cy(rt, rb, len, mat, seg, x, y, z); o.rotation.x = Math.PI/2; return o; };
  const sph = (r, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = mk(new T.SphereGeometry(r, 16, 12), mat, x, y, z); o.scale.set(sx, sy, sz); return o; };
  // a road tyre with a dished rim and a hub (axis along x)
  function tyre(r, w, x, y, z, rimMat){ const g = new T.Group(), ri = r*0.6, pr = [];
    for (let i = 0; i <= 10; i++){ const a = -Math.PI/2 + i/10*Math.PI; pr.push(new T.Vector2(ri + (r - ri)*0.5 + Math.cos(a)*(r - ri)*0.5 + Math.cos(a)*0.02, Math.sin(a)*w/2)); }
    const t = mk(new T.LatheGeometry([new T.Vector2(ri, -w/2), ...pr, new T.Vector2(ri, w/2)], 24), P.rubber); t.rotation.z = Math.PI/2; g.add(t);
    const rim = cy(ri, ri, w*0.8, rimMat || P.oliveD, 18); rim.rotation.z = Math.PI/2; g.add(rim);
    const hub = cy(ri*0.45, ri*0.55, w*0.92, P.dark, 10); hub.rotation.z = Math.PI/2; g.add(hub);
    for (let i = 0; i < 16; i++){ const a = i/16*Math.PI*2, l = rbox(w*0.86, 0.045, r*0.2, 0.012, P.rubber, 0, Math.cos(a)*(r - 0.008), Math.sin(a)*(r - 0.008)); l.rotation.x = -a + (i % 2 ? 0.35 : -0.35); l.castShadow = false; g.add(l); }   // tread lugs
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++){ const a = i/6*Math.PI*2; g.add(cyX(0.022, 0.03, P.bolt, s*w*0.42, Math.cos(a)*ri*0.66, Math.sin(a)*ri*0.66, 6)); }   // wheel nuts
    g.position.set(x, y, z); return g; }
  // a tracked running gear (one side): road wheels, drive sprocket, idler, return rollers, and the track as a loop of links
  function tracks(x, len, h, wR, n, w){ const g = new T.Group(), zF = len/2 - wR*1.1, zR = -len/2 + wR*1.05, yB = 0.04, rF = wR*0.95, yA = h - rF - 0.02;
    for (let i = 0; i < n; i++){ const z = zR + wR*0.9 + i*(zF - zR - wR*1.8)/(n - 1); g.add(tyreRW(wR*0.92, w*0.8, x, wR*0.92 + yB + 0.03, z)); }
    g.add(tyreRW(rF*0.9, w*0.7, x, yA, zF + 0.05)); g.add(tyreRW(rF*0.85, w*0.7, x, yA - 0.04, zR - 0.02));
    const pts = []; const N = 120, segs = [[zR, yB, zF, yB], [zF, yB, zF + rF*0.9, yA - rF*0.6], [zF + rF*0.9, yA - rF*0.6, zF, yA + rF], [zF, yA + rF, zR, yA + rF], [zR, yA + rF, zR - rF*0.95, yA - rF*0.3], [zR - rF*0.95, yA - rF*0.3, zR, yB]];
    const L = segs.reduce((s, q) => s + Math.hypot(q[2] - q[0], q[3] - q[1]), 0);
    for (let i = 0; i < N; i++){ let d = i/N*L; for (const q of segs){ const sl = Math.hypot(q[2] - q[0], q[3] - q[1]); if (d <= sl){ const u = d/sl; pts.push([q[0] + (q[2] - q[0])*u, q[1] + (q[3] - q[1])*u, Math.atan2(q[3] - q[1], q[2] - q[0])]); break; } d -= sl; } }
    for (const [z, y, a] of pts){ const l = rbox(w, 0.075, L/N*0.86, 0.015, P.track, x, y, z); l.rotation.x = -a; g.add(l); }
    return g; }
  function tyreRW(r, w, x, y, z){ const g = new T.Group(); const t = cy(r, r, w, P.rubber, 20); t.rotation.z = Math.PI/2; g.add(t);
    for (const s of [-1, 1]){ const d = cy(r*0.8, r*0.86, 0.04, P.oliveD, 20, s*w/2, 0, 0); d.rotation.z = Math.PI/2; g.add(d); const hb = cy(r*0.26, r*0.3, 0.08, P.dark, 8, s*(w/2 + 0.03), 0, 0); hb.rotation.z = Math.PI/2; g.add(hb); }
    g.position.set(x, y, z); return g; }
  const ant = (x, y, z, l) => { const a = cy(0.012, 0.018, l, P.dark, 5, x, y + l/2, z); a.castShadow = false; return a; };
  const jerry = (x, y, z, ry = 0) => { const j = rbox(0.17, 0.46, 0.34, 0.03, P.oliveD, x, y, z); j.rotation.y = ry; return j; };
  const smokeL = (x, y, z, ry) => { const g = new T.Group(); for (let i = 0; i < 4; i++){ const t = cyZ(0.05, 0.05, 0.28, P.dark, 0, i*0.11, 0, 8); t.rotation.x = Math.PI/2 - 0.5; g.add(t); } g.position.set(x, y, z); g.rotation.y = ry; return g; };

  // a soldier at the ready (~1.8 m): boots, bent knees, plate carrier with pouches, pack, helmet with cover and goggles, rifle held across the chest
  function mRifleman(){
    const g = new T.Group(), U = P.uni, limb = (r0, r1, l, mat) => { const o = new T.Group(), c = cy(r0, r1, l, mat, 10, 0, -l/2, 0); o.add(c); o.add(sph(r0*1.02, mat, 0, 0, 0)); return o; };
    const leg = (sx, fw) => { const hip = new T.Group(); hip.position.set(sx*0.11, 0.93, 0); const th = limb(0.085, 0.07, 0.46, U); hip.add(th); th.rotation.x = -fw;
      const kn = new T.Group(); kn.position.y = -0.46; th.add(kn); const sh = limb(0.068, 0.052, 0.44, U); kn.add(sh); sh.rotation.x = fw*1.35 + 0.08;
      kn.add(rbox(0.1, 0.12, 0.08, 0.03, P.gearD, 0, -0.04, 0.06));   // knee pad
      const bt = rbox(0.11, 0.11, 0.26, 0.04, P.boot, 0, -0.47, 0.05); sh.add(bt); bt.rotation.x = -(fw*1.35 + 0.08) + fw;
      return hip; };
    g.add(leg(-1, 0.32), leg(1, -0.08));
    g.add(sph(0.16, U, 0, 0.95, 0, 1.15, 0.8, 0.85));                                   // hips
    const torso = new T.Group(); torso.position.set(0, 0.97, 0); torso.rotation.x = 0.12; g.add(torso);
    const tb = mk(new T.CylinderGeometry(0.19, 0.155, 0.56, 14), U, 0, 0.3, 0); tb.scale.set(1.05, 1, 0.66); torso.add(tb);
    torso.add(rbox(0.38, 0.4, 0.13, 0.04, P.gear, 0, 0.32, 0.1));                       // plate carrier, front and back
    torso.add(rbox(0.36, 0.38, 0.1, 0.04, P.gear, 0, 0.33, -0.1));
    for (const x of [-0.12, 0, 0.12]) torso.add(rbox(0.1, 0.13, 0.07, 0.02, P.gearD, x, 0.2, 0.18));   // magazine pouches
    torso.add(rbox(0.1, 0.1, 0.06, 0.02, P.gearD, 0.13, 0.42, 0.17));
    torso.add(rbox(0.32, 0.36, 0.18, 0.06, P.gearD, 0, 0.32, -0.23));                    // pack
    torso.add(rbox(0.3, 0.1, 0.12, 0.04, P.tarp, 0, 0.53, -0.25));                       // bed roll
    torso.add(rbox(0.14, 0.2, 0.08, 0.02, P.dark, -0.1, 0.36, -0.34)); torso.add(ant(-0.13, 0.42, -0.36, 0.7));   // radio and its whip antenna
    torso.add(cy(0.045, 0.045, 0.13, P.gearD, 10, 0.19, 0.06, -0.12));                     // canteen
    torso.add(sph(0.2, U, 0, 0.55, 0, 1.15, 0.55, 0.75));                                 // shoulders
    const neck = cy(0.05, 0.06, 0.1, P.skin, 10, 0, 0.64, 0.01); torso.add(neck);
    const head = new T.Group(); head.position.set(0, 0.76, 0.02); head.rotation.x = -0.18; torso.add(head);
    head.add(sph(0.105, P.skin, 0, 0, 0.01, 0.9, 1.05, 1));
    const hel = mk(new T.SphereGeometry(0.135, 18, 12, 0, Math.PI*2, 0, Math.PI*0.56), P.olive, 0, 0.02, -0.005); hel.scale.set(1, 0.95, 1.08); head.add(hel);
    const rim = mk(new T.TorusGeometry(0.128, 0.012, 6, 24), P.oliveD, 0, 0.0, -0.005); rim.rotation.x = Math.PI/2; rim.scale.set(1, 1.08, 1); head.add(rim);
    head.add(rbox(0.13, 0.04, 0.05, 0.015, P.dark, 0, 0.07, 0.12));                    // goggles on the helmet
    head.add(rbox(0.06, 0.05, 0.04, 0.012, P.dark, 0, 0.11, 0.135));                     // NVG mount
    // the rifle, held across the body at the ready, muzzle low and forward
    const rf = new T.Group(); rf.position.set(0.02, 0.27, 0.27); rf.rotation.set(0.32, 0.48, 0); torso.add(rf);
    rf.add(rbox(0.05, 0.08, 0.34, 0.01, P.gun, 0, 0, 0)); rf.add(cyZ(0.013, 0.013, 0.32, P.gun, 0, 0.01, 0.32, 8)); rf.add(rbox(0.055, 0.06, 0.2, 0.012, P.dark, 0, 0.0, 0.25));
    ad(rf, rbox(0.035, 0.13, 0.06, 0.01, P.gun, 0, -0.09, 0.05)).rotation.x = 0.25; ad(rf, rbox(0.04, 0.16, 0.07, 0.012, P.dark, 0, -0.1, 0.13)).rotation.x = 0.2;   // grip, curved magazine
    rf.add(cyZ(0.024, 0.024, 0.12, P.dark, 0, 0.075, 0.08, 10)); rf.add(rbox(0.03, 0.03, 0.04, 0.008, P.glass, 0, 0.075, 0.145));   // optic
    rf.add(rbox(0.012, 0.012, 0.5, 0.004, P.gearD, 0.03, -0.06, 0.02));   // sling rf.add(rbox(0.045, 0.1, 0.18, 0.015, P.dark, 0, -0.02, -0.24)); rf.add(rbox(0.035, 0.045, 0.1, 0.01, P.gun, 0, 0.07, 0.02));
    // arms: the right hand on the grip, the left on the handguard
    const arm = (sx, a1, b1, a2) => { const sh = new T.Group(); sh.position.set(sx*0.2, 0.52, 0); torso.add(sh); const up = limb(0.058, 0.05, 0.28, U); sh.add(up); up.rotation.set(a1, 0, b1);
      const el = new T.Group(); el.position.y = -0.28; up.add(el); const fo = limb(0.05, 0.04, 0.26, U); el.add(fo); fo.rotation.x = a2; fo.add(sph(0.04, P.skin, 0, -0.27, 0)); return sh; };
    arm(1, 0.35, 0.18, -1.45); arm(-1, 0.85, -0.3, -1.25);
    g.add(cy(0.0, 0.0, 0.0, U));
    return {g, ext:1.45, ppm:62, look:0.95}; }

  // a modern main battle tank (~9.8 m with the gun): skirted hull, wedge turret with stowage basket, cupola sight, MG, smoke dischargers
  function mTank(){
    const g = new T.Group(), L = 7.6;
    for (const sx of [-1, 1]) g.add(tracks(sx*1.52, L - 0.2, 1.05, 0.36, 7, 0.62));
    g.add(side([[-3.75, 0.5], [3.0, 0.5], [3.85, 0.95], [3.9, 1.12], [2.7, 1.5], [-3.6, 1.52], [-3.85, 1.25]], 2.4, P.olive, 0.05));       // lower hull
    g.add(side([[-3.8, 1.2], [3.55, 1.2], [3.9, 1.36], [2.75, 1.62], [-3.75, 1.62]], 3.64, P.olive, 0.05));                                    // upper hull over the tracks
    for (const sx of [-1, 1]) for (let i = 0; i < 6; i++){ const p = rbox(0.06, 0.48, 1.12, 0.02, i < 2 ? P.oliveD : P.olive, sx*1.86, 0.98, 2.75 - i*1.15); p.rotation.z = sx*0.06; g.add(p); }   // side skirts
    for (let i = 0; i < 7; i++) g.add(rbox(1.4, 0.05, 0.14, 0.02, P.dark, 0, 1.64, -2.1 - i*0.22));   // engine deck grilles
    g.add(rbox(0.7, 0.06, 0.7, 0.03, P.oliveD, 0, 1.63, 2.45)); g.add(cy(0.24, 0.24, 0.06, P.oliveD, 14, -0.55, 1.65, 2.2));
    for (const sx of [-1.2, 1.2]){ g.add(rbox(0.26, 0.16, 0.12, 0.03, P.dark, sx, 1.36, 3.72)); g.add(rbox(0.18, 0.1, 0.04, 0.02, P.lamp, sx, 1.36, 3.79)); }
    g.add(jerry(-1.45, 1.86, -3.3)); g.add(jerry(-1.05, 1.86, -3.3)); g.add(rbox(0.9, 0.35, 0.5, 0.06, P.tarp, 1.0, 1.8, -3.25));
    for (const sx of [-1, 1]){ g.add(rbox(0.66, 0.05, 0.75, 0.02, P.oliveD, sx*1.55, 1.24, 3.55));   // track guards over the front idlers
      for (let i = 0; i < 2; i++){ const c = cyZ(0.035, 0.035, 4.4, P.steel, sx*(1.5 + i*0.08), 1.66, -0.5, 8); g.add(c); }   // tow cables along the deck edge
      g.add(rbox(0.08, 0.06, 0.45, 0.02, P.dark, sx*1.0, 1.66, 3.1)); }   // headlight guards
    for (let i = 0; i < 5; i++) g.add(rbox(2.6, 0.035, 0.05, 0.01, P.dark, 0, 1.4 - i*0.07, -3.86));   // rear exhaust grille
    for (const [x, z] of [[-0.9, 1.4], [0.9, 1.4], [-0.9, -1.1], [0.9, -1.1]]) g.add(cy(0.04, 0.04, 0.04, P.bolt, 6, x, 1.64, z));
    const tur = new T.Group(); tur.position.set(0, 1.62, -0.25); g.add(tur);
    tur.add(plan([[-1.68, -2.0], [1.68, -2.0], [1.8, 0.5], [1.15, 2.05], [0.35, 2.3], [-0.35, 2.3], [-1.15, 2.05], [-1.8, 0.5]], 0.82, P.olive, 0, 0.07));
    tur.add(plan([[-1.5, -1.8], [1.5, -1.8], [1.6, 0.4], [0.9, 1.9], [-0.9, 1.9], [-1.6, 0.4]], 0.12, P.oliveD, 0.8, 0.04));
    const bk = new T.Group(); bk.position.set(0, 0.25, -2.35); tur.add(bk);   // stowage basket with rolls and boxes
    bk.add(rbox(3.3, 0.06, 0.8, 0.02, P.dark, 0, 0, 0)); for (const x of [-1.6, 1.6]) bk.add(rbox(0.05, 0.4, 0.8, 0.02, P.dark, x, 0.2, 0)); bk.add(rbox(3.3, 0.05, 0.05, 0.02, P.dark, 0, 0.4, -0.4));
    bk.add(cyX(0.2, 1.1, P.tarp, -0.85, 0.24, 0.05)); bk.add(rbox(0.9, 0.36, 0.5, 0.05, P.gearD, 0.35, 0.21, 0)); bk.add(rbox(0.45, 0.3, 0.45, 0.04, P.oliveD, 1.1, 0.18, 0.05));
    const cup = new T.Group(); cup.position.set(-0.7, 0.92, -0.45); tur.add(cup); cup.add(cy(0.36, 0.4, 0.2, P.oliveD, 16)); cup.add(cy(0.3, 0.3, 0.08, P.dark, 16, 0, 0.12, 0));
    const mg = new T.Group(); mg.position.set(0, 0.22, 0.25); cup.add(mg); mg.add(rbox(0.1, 0.12, 0.5, 0.02, P.gun, 0, 0.1, 0)); mg.add(cyZ(0.018, 0.018, 0.6, P.gun, 0, 0.12, 0.5, 6));
    tur.add(rbox(0.5, 0.42, 0.5, 0.06, P.oliveD, 0.85, 1.05, 0.65)); tur.add(rbox(0.4, 0.22, 0.04, 0.03, P.glass, 0.85, 1.1, 0.91));   // gunner's sight
    tur.add(rbox(0.34, 0.3, 0.34, 0.05, P.oliveD, -0.85, 1.25, 0.35)); tur.add(rbox(0.26, 0.15, 0.03, 0.02, P.glass, -0.85, 1.28, 0.53));   // commander's panoramic sight
    tur.add(cy(0.3, 0.3, 0.05, P.oliveD, 14, 0.75, 0.86, -0.85));   // loader's hatch
    tur.add(smokeL(1.55, 0.6, 0.9, 0.5)); tur.add(smokeL(-1.55, 0.6, 0.9, -0.5));
    tur.add(ant(-1.2, 0.82, -1.6, 1.9)); tur.add(ant(1.25, 0.82, -1.7, 1.5));
    for (const sx of [-1, 1]) for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++){ const e = rbox(0.42, 0.28, 0.3, 0.03, c % 2 ? P.olive : P.oliveD, sx*(0.55 + c*0.36), 0.22 + r*0.3, 2.08 - c*0.2); e.rotation.y = -sx*0.5; tur.add(e); }   // ERA blocks on the turret cheeks
    for (let i = 0; i < 6; i++) tur.add(cy(0.035, 0.035, 0.04, P.bolt, 6, -0.7 + Math.cos(i*1.05)*0.42, 1.03, -0.45 + Math.sin(i*1.05)*0.42));   // cupola ring bolts
    const gun = new T.Group(); gun.position.set(0, 0.42, 2.2); tur.add(gun);
    gun.add(rbox(0.82, 0.58, 0.5, 0.08, P.oliveD, 0, 0, 0.05));   // mantlet
    gun.add(cyZ(0.13, 0.14, 1.6, P.oliveD, 0, 0, 1.0, 14)); gun.add(cyZ(0.12, 0.13, 1.6, P.olive, 0, 0, 2.6, 14)); gun.add(cyZ(0.17, 0.17, 0.55, P.oliveD, 0, 0, 2.0, 14));
    gun.add(cyZ(0.105, 0.11, 1.45, P.oliveD, 0, 0, 4.1, 14)); gun.add(cyZ(0.12, 0.12, 0.12, P.dark, 0, 0, 4.85, 14));
    return {g, ext:5.4, ppm:30}; }

  // an 8x8 infantry fighting vehicle (~8 m): faceted hull, remote turret with a 30 mm cannon and missiles, big tyres, stowage, periscopes
  function mIfv(){
    const g = new T.Group();
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) g.add(tyre(0.6, 0.48, sx*1.32, 0.6, 2.55 - i*1.5 - (i > 1 ? 0.25 : 0)));
    g.add(side([[-3.8, 0.62], [2.9, 0.62], [3.95, 1.25], [3.6, 1.6], [2.6, 2.05], [-3.7, 2.1], [-3.9, 1.8]], 2.2, P.olive, 0.06));
    g.add(side([[-3.75, 1.2], [3.3, 1.2], [3.7, 1.45], [2.55, 2.12], [-3.7, 2.18]], 3.02, P.olive, 0.07));      // the sponsons over the wheels
    for (const sx of [-1, 1]){ for (let i = 0; i < 3; i++) g.add(rbox(0.12, 0.42, 1.0, 0.04, P.oliveD, sx*1.55, 1.55, 1.4 - i*1.4)); g.add(rbox(0.07, 0.35, 0.3, 0.02, P.dark, sx*1.52, 1.55, 2.75)); }
    for (const sx of [-0.9, 0.9]){ g.add(rbox(0.28, 0.14, 0.1, 0.03, P.dark, sx, 1.45, 3.82)); g.add(rbox(0.2, 0.08, 0.03, 0.02, P.lamp, sx, 1.45, 3.88)); }
    g.add(rbox(0.6, 0.08, 0.6, 0.03, P.oliveD, -0.7, 2.14, 2.2)); for (const x of [-0.95, -0.7, -0.45]) g.add(rbox(0.12, 0.08, 0.05, 0.02, P.glass, x, 2.18, 2.5));   // driver's hatch and periscopes
    for (let i = 0; i < 4; i++) g.add(rbox(0.9, 0.05, 0.13, 0.02, P.dark, 0.9, 2.15, 1.9 - i*0.2));
    for (const sx of [-1, 1]){ for (let i = 0; i < 9; i++) g.add(cyX(0.028, 0.04, P.bolt, sx*1.53, 1.9, 2.2 - i*0.62, 6)); ad(g, rbox(0.06, 0.12, 0.2, 0.02, P.dark, sx*1.6, 2.05, 3.3)).rotation.y = sx*0.3; }
    g.add(rbox(1.3, 1.0, 0.06, 0.03, P.oliveD, 0, 1.45, -3.87)); g.add(rbox(0.08, 0.1, 0.06, 0.02, P.dark, 0.5, 1.45, -3.91));   // rear door and handle
    g.add(rbox(1.2, 0.08, 0.8, 0.03, P.oliveD, 0, 2.17, -2.6)); g.add(rbox(0.7, 0.3, 0.45, 0.05, P.tarp, 0.9, 2.3, -3.1)); g.add(jerry(-1.2, 2.4, -3.3)); g.add(jerry(-0.95, 2.4, -3.3));
    const tur = new T.Group(); tur.position.set(0, 2.15, -0.15); g.add(tur);
    tur.add(plan([[-1.0, -1.1], [1.0, -1.1], [1.1, 0.3], [0.6, 1.1], [-0.6, 1.1], [-1.1, 0.3]], 0.62, P.olive, 0, 0.06));
    tur.add(rbox(0.44, 0.3, 0.34, 0.05, P.oliveD, 0.6, 0.78, 0.4)); tur.add(rbox(0.3, 0.16, 0.03, 0.02, P.glass, 0.6, 0.8, 0.58));
    tur.add(rbox(0.32, 0.32, 1.3, 0.05, P.oliveD, -1.25, 0.45, -0.1)); ad(tur, cy(0.11, 0.11, 0.02, P.dark, 10, -1.25, 0.45, 0.56)).rotation.x = Math.PI/2;   // missile pod
    tur.add(smokeL(1.05, 0.35, 0.65, 0.6)); tur.add(ant(-0.8, 0.62, -0.9, 1.6));
    const gun = new T.Group(); gun.position.set(0, 0.32, 1.05); tur.add(gun); gun.add(rbox(0.38, 0.3, 0.4, 0.05, P.oliveD, 0, 0, 0.1));
    gun.add(cyZ(0.07, 0.07, 1.2, P.oliveD, 0, 0, 0.8, 10)); gun.add(cyZ(0.042, 0.045, 1.3, P.gun, 0, 0, 2.0, 10)); gun.add(cyZ(0.06, 0.06, 0.16, P.gun, 0, 0, 2.62, 10));
    return {g, ext:4.6, ppm:30}; }

  // a light 4x4 utility vehicle (~4.9 m): wide low body, sloped bonnet with grille, armoured cab, roof gunner's ring with a shield and MG
  function mHmv(){
    const g = new T.Group();
    for (const sx of [-1, 1]) for (const z of [1.48, -1.5]) g.add(tyre(0.47, 0.4, sx*0.98, 0.47, z));
    g.add(side([[-2.45, 0.55], [2.2, 0.55], [2.5, 0.8], [2.42, 1.12], [1.0, 1.3], [-2.45, 1.3]], 2.18, P.olive, 0.06));
    for (const sx of [-1, 1]){ ad(g, side([[1.0, 0.75], [2.15, 0.8], [2.35, 1.05], [0.95, 1.12]], 0.3, P.oliveD, 0.03)).position.x = sx*0.98; ad(g, side([[-2.0, 0.75], [-0.95, 0.75], [-0.95, 1.12], [-2.15, 1.1]], 0.3, P.oliveD, 0.03)).position.x = sx*0.98; }
    g.add(side([[-1.5, 1.26], [0.95, 1.26], [0.55, 1.95], [-1.5, 1.98]], 2.02, P.olive, 0.06));
    const ws = rbox(1.7, 0.6, 0.04, 0.02, P.glass, 0, 1.62, 0.78); ws.rotation.x = -0.52; g.add(ws);
    for (const sx of [-1, 1]) for (const z of [0.25, -0.75]) g.add(rbox(0.03, 0.38, 0.6, 0.02, P.glass, sx*1.02, 1.62, z));
    for (let i = 0; i < 6; i++) g.add(rbox(0.1, 0.24, 0.03, 0.01, P.dark, -0.55 + i*0.22, 0.95, 2.46));
    for (const sx of [-0.8, 0.8]) g.add(rbox(0.16, 0.12, 0.04, 0.02, P.lamp, sx, 1.02, 2.46));
    g.add(rbox(1.98, 0.1, 0.85, 0.03, P.oliveD, 0, 1.33, -2.0)); g.add(rbox(1.2, 0.28, 0.5, 0.05, P.tarp, 0.2, 1.5, -2.05)); g.add(jerry(-0.8, 1.55, -2.25)); ad(g, cyX(0.3, 0.2, P.rubber, 0, 0.98, -2.55)).rotation.set(Math.PI/2, 0, 0);
    const tr = new T.Group(); tr.position.set(0, 1.98, -0.45); g.add(tr); tr.add(cy(0.42, 0.44, 0.16, P.oliveD, 16));
    tr.add(side([[0.3, 0.05], [0.42, 0.05], [0.42, 0.52], [0.3, 0.52]], 0.9, P.oliveD, 0.02)); tr.add(rbox(0.14, 0.14, 0.55, 0.03, P.gun, 0, 0.3, 0.35)); tr.add(cyZ(0.022, 0.022, 0.6, P.gun, 0, 0.3, 0.85, 6));
    g.add(ant(-0.85, 1.95, -1.9, 1.8)); g.add(ant(0.85, 1.95, -1.95, 1.2));
    for (const sx of [-1, 1]){ g.add(rbox(0.04, 0.3, 0.04, 0.01, P.dark, sx*1.15, 1.55, 0.85)); g.add(rbox(0.04, 0.2, 0.14, 0.02, P.glass, sx*1.18, 1.62, 0.85)); }
    g.add(rbox(1.9, 0.16, 0.18, 0.04, P.dark, 0, 0.66, 2.5)); g.add(cyX(0.1, 0.5, P.steel, 0, 0.72, 2.6));   // bumper and winch
    return {g, ext:2.9, ppm:34}; }

  // a 6x6 supply truck (~8 m): forward cab with windows and grille, cargo bed under a camouflaged tilt with hoops, spare wheel, fuel tank
  function mTruck(){
    const g = new T.Group();
    for (const sx of [-1, 1]) for (const z of [2.4, -0.95, -2.25]) g.add(tyre(0.55, 0.42, sx*1.05, 0.55, z));
    g.add(rbox(1.5, 0.3, 6.6, 0.04, P.dark, 0, 0.88, -0.1));
    g.add(side([[1.6, 0.95], [3.45, 0.95], [3.52, 1.75], [3.25, 2.75], [1.6, 2.8]], 2.36, P.olive, 0.07));
    ad(g, rbox(2.0, 0.6, 0.04, 0.02, P.glass, 0, 2.25, 3.32)).rotation.x = -0.1; for (const sx of [-1, 1]) g.add(rbox(0.03, 0.5, 0.8, 0.02, P.glass, sx*1.19, 2.3, 2.6));
    for (let i = 0; i < 7; i++) g.add(rbox(0.12, 0.42, 0.03, 0.01, P.dark, -0.6 + i*0.2, 1.4, 3.52));
    for (const sx of [-1, 1]){ g.add(rbox(0.1, 0.35, 0.1, 0.02, P.dark, sx*1.28, 2.35, 3.2)); g.add(rbox(0.5, 0.1, 0.9, 0.03, P.oliveD, sx*1.05, 1.15, 2.4)); }
    g.add(rbox(2.4, 0.42, 4.7, 0.04, P.oliveD, 0, 1.2, -1.05));
    g.add(rbox(2.36, 1.12, 4.6, 0.06, P.tarp, 0, 1.96, -1.05)); const roof = cyZ(1.18, 1.18, 4.6, P.tarp, 0, 2.48, -1.05, 22); roof.scale.set(1, 0.24, 1); g.add(roof);
    for (let i = 0; i < 5; i++) g.add(rbox(2.4, 0.07, 0.06, 0.02, P.gear, 0, 2.52 + (i % 4 ? 0.06 : 0), 1.2 - i*1.12));
    g.add(cyX(0.28, 0.85, P.dark, -1.0, 0.95, 0.6)); ad(g, cyX(0.5, 0.36, P.rubber, 0, 1.35, 1.25)).rotation.set(0, 0, 0);
    for (const sx of [-1, 1]){ g.add(rbox(0.05, 0.4, 0.04, 0.01, P.dark, sx*1.38, 2.45, 3.0)); g.add(rbox(0.04, 0.26, 0.16, 0.02, P.glass, sx*1.4, 2.5, 3.0));   // mirrors
      g.add(rbox(0.5, 0.42, 0.03, 0.01, P.rubber, sx*1.05, 0.62, -2.95)); for (let i = 0; i < 4; i++) g.add(rbox(0.03, 1.0, 0.05, 0.01, P.gearD, sx*1.2, 1.95, 0.6 - i*1.1)); }   // mud flaps, tie straps
    return {g, ext:4.4, ppm:28}; }

  // a self-propelled howitzer (~11 m with the gun): tracked hull, large slab-sided turret, long barrel with a muzzle brake, raised a little
  function mArt(){
    const g = new T.Group(), L = 7.4;
    for (const sx of [-1, 1]){ g.add(tracks(sx*1.48, L, 1.0, 0.34, 7, 0.6)); for (let i = 0; i < 5; i++) g.add(rbox(0.06, 0.42, 1.36, 0.02, P.olive, sx*1.8, 0.95, 2.6 - i*1.4)); }
    g.add(side([[-3.7, 0.5], [3.0, 0.5], [3.75, 1.0], [3.3, 1.5], [-3.6, 1.52]], 3.5, P.olive, 0.06));
    for (const sx of [-1.15, 1.15]) g.add(rbox(0.24, 0.14, 0.1, 0.03, P.dark, sx, 1.3, 3.55));
    const tur = new T.Group(); tur.position.set(0, 1.5, -0.6); g.add(tur);
    tur.add(plan([[-1.5, -2.6], [1.5, -2.6], [1.55, 1.2], [1.1, 1.8], [-1.1, 1.8], [-1.55, 1.2]], 1.5, P.olive, 0, 0.08));
    tur.add(rbox(2.6, 0.1, 3.6, 0.04, P.oliveD, 0, 1.52, -0.4)); tur.add(cy(0.34, 0.36, 0.22, P.oliveD, 14, 0.6, 1.62, 0.4));
    const mg = new T.Group(); mg.position.set(0.6, 1.8, 0.55); tur.add(mg); mg.add(rbox(0.1, 0.12, 0.5, 0.02, P.gun, 0, 0, 0)); mg.add(cyZ(0.018, 0.018, 0.55, P.gun, 0, 0, 0.45, 6));
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) tur.add(rbox(0.08, 0.36, 0.7, 0.03, P.oliveD, sx*1.58, 0.75, 0.6 - i*0.85));
    tur.add(rbox(1.2, 0.4, 0.7, 0.05, P.tarp, -0.6, 1.75, -1.9)); tur.add(smokeL(1.45, 1.05, 1.25, 0.5)); tur.add(smokeL(-1.45, 1.05, 1.25, -0.5)); tur.add(ant(-1.1, 1.5, -2.2, 1.6));
    const gun = new T.Group(); gun.position.set(0, 0.95, 1.7); gun.rotation.x = -0.12; tur.add(gun);
    gun.add(rbox(0.8, 0.7, 0.6, 0.08, P.oliveD, 0, 0, 0.1)); gun.add(cyZ(0.16, 0.17, 1.6, P.oliveD, 0, 0, 1.1, 14)); gun.add(cyZ(0.13, 0.14, 4.2, P.olive, 0, 0, 3.9, 14));
    gun.add(rbox(0.42, 0.3, 0.6, 0.05, P.dark, 0, 0, 6.1)); gun.add(cyZ(0.2, 0.2, 0.3, P.oliveD, 0, 0, 2.3, 12));
    return {g, ext:5.8, ppm:28}; }

  // a rocket launcher on a 6x6 truck: armoured cab, launcher with two six-tube pods raised a little
  function mMlrs(){
    const g = new T.Group();
    for (const sx of [-1, 1]) for (const z of [2.3, -0.9, -2.2]) g.add(tyre(0.56, 0.44, sx*1.08, 0.56, z));
    g.add(rbox(1.6, 0.36, 6.6, 0.05, P.dark, 0, 0.92, -0.1));
    g.add(side([[1.5, 0.95], [3.45, 0.95], [3.55, 1.7], [3.15, 2.75], [1.5, 2.78]], 2.5, P.olive, 0.07));
    ad(g, rbox(2.0, 0.45, 0.04, 0.02, P.glass, 0, 2.3, 3.32)).rotation.x = -0.45; for (const sx of [-1, 1]) g.add(rbox(0.03, 0.4, 0.7, 0.02, P.glass, sx*1.26, 2.3, 2.5));
    for (let i = 0; i < 7; i++) g.add(rbox(0.12, 0.4, 0.03, 0.01, P.dark, -0.6 + i*0.2, 1.4, 3.52));
    g.add(rbox(2.5, 0.3, 4.6, 0.05, P.oliveD, 0, 1.25, -1.0)); g.add(cy(0.6, 0.7, 0.35, P.oliveD, 16, 0, 1.55, -1.6));
    const pod = new T.Group(); pod.position.set(0, 1.85, -1.4); pod.rotation.x = -0.18; g.add(pod);
    for (const sx of [-0.62, 0.62]){ pod.add(rbox(1.15, 1.0, 4.0, 0.06, P.olive, sx, 0.55, 0.2)); for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++){ const t = cyZ(0.14, 0.14, 0.04, P.dark, sx - 0.36 + c*0.36, 0.32 + r*0.46, 2.21, 12); pod.add(t); } pod.add(rbox(1.0, 0.06, 3.6, 0.02, P.oliveD, sx, 1.07, 0.2)); }
    g.add(ant(-1.0, 2.75, 1.8, 1.4));
    return {g, ext:4.3, ppm:28}; }

  // a self-propelled air defence launcher on an 8x8: cab, four canisters raised on a frame, a folding radar panel
  function mSam(){
    const g = new T.Group();
    for (const sx of [-1, 1]) for (const z of [3.2, 1.9, -1.4, -2.7]) g.add(tyre(0.56, 0.42, sx*1.15, 0.56, z));
    g.add(rbox(2.0, 0.42, 8.6, 0.05, P.dark, 0, 0.95, 0.2));
    g.add(side([[2.75, 1.0], [4.45, 1.0], [4.55, 1.75], [4.2, 2.65], [2.75, 2.7]], 2.55, P.olive, 0.07));
    ad(g, rbox(2.1, 0.5, 0.04, 0.02, P.glass, 0, 2.28, 4.35)).rotation.x = -0.4; for (let i = 0; i < 7; i++) g.add(rbox(0.12, 0.42, 0.03, 0.01, P.dark, -0.6 + i*0.2, 1.4, 4.52));
    g.add(rbox(2.5, 0.35, 5.8, 0.05, P.oliveD, 0, 1.28, -0.4));
    const lau = new T.Group(); lau.position.set(0, 1.6, -3.0); lau.rotation.x = -0.32; g.add(lau);
    for (let i = 0; i < 4; i++){ const x = -0.84 + i*0.56; lau.add(cyZ(0.26, 0.26, 5.4, P.olive, x, 0.3, 2.7, 16)); lau.add(cyZ(0.27, 0.27, 0.12, P.oliveD, x, 0.3, 5.35, 16)); lau.add(cyZ(0.27, 0.27, 0.12, P.oliveD, x, 0.3, 0.1, 16)); }
    lau.add(rbox(2.4, 0.12, 0.3, 0.03, P.dark, 0, 0.0, 1.0)); lau.add(rbox(2.4, 0.12, 0.3, 0.03, P.dark, 0, 0.0, 4.0));
    const rad = rbox(1.5, 1.0, 0.14, 0.04, P.oliveD, 0, 3.15, 2.3); rad.rotation.x = -0.35; g.add(rad); g.add(rbox(0.15, 0.6, 0.15, 0.03, P.dark, 0, 2.7, 2.35));
    return {g, ext:5.4, ppm:26}; }

  // naval: the hull is cut at the waterline (a clipping plane at y = WL) and a faint foam line hugs it
  const WL = 0.32;
  function hullPts(L, B, bowK = 0.32){ const o = []; for (let i = 0; i <= 12; i++){ const u = i/12, z = L/2 - u*L*bowK, x = B/2*Math.sin(u*Math.PI/2); o.push([x, z]); }
    o.push([B/2, -L*0.3], [B*0.46, -L/2]); const l = o.length; for (let i = l - 1; i >= 0; i--) o.push([-o[i][0], o[i][1]]); return o; }
  function foam(L, B){ const pts = hullPts(L*1.02, B*1.12), sh = new T.Shape(); sh.moveTo(pts[0][0], -pts[0][1]); for (const p of pts) sh.lineTo(p[0], -p[1]);
    const hole = new T.Path(); const q = hullPts(L*0.97, B*0.9); hole.moveTo(q[0][0], -q[0][1]); for (const p of q.slice().reverse()) hole.lineTo(p[0], -p[1]); sh.holes.push(hole);
    const g = new T.ShapeGeometry(sh); g.rotateX(-Math.PI/2); const m = mk(g, P.foam, 0, WL + 0.01, 0); m.castShadow = false; m.receiveShadow = false; return m; }
  function mShip(kind){
    const g = new T.Group(), big = kind === 'crui', L = big ? 8.8 : 7.4, B = big ? 1.18 : 1.0;
    g.add(plan(hullPts(L, B), 0.95, P.navyD, -0.1, 0.03));
    const sh = plan(hullPts(L*1.0, B*1.02), 0.3, P.navy, 0.75, 0.03); g.add(sh);
    g.add(plan(hullPts(L*0.97, B*0.92), 0.02, P.deck, 1.04, 0));
    g.add(foam(L, B));
    const sup = new T.Group(); sup.position.set(0, 1.04, big ? 0.35 : 0.2); g.add(sup);
    sup.add(plan([[-B*0.38, -1.4], [B*0.38, -1.4], [B*0.38, 0.9], [B*0.26, 1.2], [-B*0.26, 1.2], [-B*0.38, 0.9]], 0.55, P.navy, 0, 0.03));
    sup.add(plan([[-B*0.3, -0.5], [B*0.3, -0.5], [B*0.3, 0.75], [B*0.2, 1.0], [-B*0.2, 1.0], [-B*0.3, 0.75]], 0.42, P.navy, 0.55, 0.03));
    ad(sup, rbox(B*0.44, 0.05, 0.04, 0.01, P.glass, 0, 0.82, 1.0)).rotation.x = -0.4;
    const mast = new T.Group(); mast.position.set(0, 0.97, 0.15); sup.add(mast); mast.add(plan([[-0.18, -0.25], [0.18, -0.25], [0.12, 0.2], [-0.12, 0.2]], 0.7, P.navy, 0, 0.02));
    mast.add(cy(0.03, 0.04, 0.6, P.dark, 6, 0, 0.95, 0)); mast.add(rbox(0.5, 0.04, 0.08, 0.01, P.dark, 0, 1.05, 0)); mast.add(rbox(0.28, 0.16, 0.16, 0.03, P.white, 0, 0.78, 0.05));
    for (const sx of [-1, 1]) sup.add(rbox(0.04, 0.22, 0.26, 0.01, P.white, sx*B*0.33, 0.68, 0.55));
    const fun = plan([[-0.2, -0.3], [0.2, -0.3], [0.17, 0.25], [-0.17, 0.25]], 0.48, P.navyD, 0.55, 0.03); fun.position.z = -0.9; sup.add(fun); sup.add(rbox(0.3, 0.04, 0.45, 0.01, P.dark, 0, 1.04, -0.9));
    const tur = new T.Group(); tur.position.set(0, 1.04, L*0.3); g.add(tur); tur.add(plan([[-0.22, -0.25], [0.22, -0.25], [0.18, 0.2], [0, 0.32], [-0.18, 0.2]], 0.24, P.navy, 0, 0.03)); tur.add(cyZ(0.035, 0.04, 0.8, P.navyD, 0, 0.15, 0.6, 8));
    tur.add(rbox(0.6, 0.06, 0.5, 0.01, P.dark, 0, 0.0, -0.6));   // VLS hatches
    for (let i = 0; i < 4; i++) tur.add(rbox(0.12, 0.02, 0.1, 0.005, P.navyD, -0.22 + i*0.15, 0.035, -0.6));
    if (big){ const t2 = new T.Group(); t2.position.set(0, 1.04, -L*0.2); g.add(t2); t2.add(rbox(0.9, 0.08, 0.7, 0.02, P.dark, 0, 0, 0)); for (let i = 0; i < 6; i++) t2.add(rbox(0.12, 0.02, 0.1, 0.005, P.navyD, -0.35 + i*0.14, 0.05, 0)); }
    const hd = new T.Group(); hd.position.set(0, 1.06, -L*0.38); g.add(hd); hd.add(rbox(B*0.86, 0.02, 1.2, 0.01, P.deck, 0, 0, 0));
    ad(hd, mk(new T.RingGeometry(0.26, 0.31, 24), P.white, 0, 0.02, 0)).rotation.x = -Math.PI/2; hd.add(rbox(0.03, 0.005, 0.5, 0.002, P.white, 0, 0.02, 0.55));
    for (const sx of [-1, 1]) g.add(rbox(0.16, 0.12, 0.5, 0.04, P.white, sx*B*0.42, 1.18, -0.2));   // boats
    return {g, ext:big ? 4.9 : 4.2, ppm:34, sea:true}; }
  function mSub(){
    const g = new T.Group(), pr = [];
    for (let i = 0; i <= 20; i++){ const u = i/20, r = Math.pow(Math.sin(Math.min(1, u*1.6)*Math.PI/2), 0.6)*(u > 0.75 ? 1 - Math.pow((u - 0.75)/0.25, 2)*0.92 : 1)*0.56 + 0.01; pr.push(new T.Vector2(r, (u - 0.5)*8.6)); }
    const hull = mk(new T.LatheGeometry(pr, 28), P.sub); hull.rotation.x = -Math.PI/2; hull.position.y = WL - 0.2; hull.scale.set(1, 1, 1); g.add(hull);
    const sail = plan([[-0.16, -0.6], [0.16, -0.6], [0.16, 0.35], [0.0, 0.72], [-0.16, 0.35]], 0.95, P.sub, WL + 0.18, 0.05); sail.position.z = 1.6; g.add(sail);
    g.add(rbox(1.3, 0.05, 0.3, 0.02, P.sub, 0, WL + 0.75, 1.75)); g.add(cy(0.03, 0.03, 0.4, P.dark, 6, 0, WL + 1.3, 1.5)); g.add(cy(0.04, 0.04, 0.3, P.dark, 6, 0.06, WL + 1.25, 1.75));
    const fin = rbox(0.06, 0.7, 0.6, 0.02, P.sub, 0, WL + 0.2, -4.0); g.add(fin);
    g.add(foam(7.4, 0.8));
    return {g, ext:4.6, ppm:32, sea:true}; }
  function mCarr(){
    const g = new T.Group(), L = 11, B = 1.75;
    g.add(plan(hullPts(L, B, 0.25), 1.1, P.navyD, -0.1, 0.03));
    g.add(plan([[0, L*0.5], [B*0.8, L*0.4], [B*1.05, L*0.05], [B*1.05, -L*0.48], [-B*0.7, -L*0.48], [-B*1.25, -L*0.1], [-B*1.25, L*0.12], [-B*0.6, L*0.42]], 0.16, P.deck, 1.0, 0.02));
    g.add(foam(L, B));
    const ln = (x0, z0, x1, z1, w, mat) => { const l = Math.hypot(x1 - x0, z1 - z0), o = rbox(w, 0.01, l, 0.003, mat, (x0 + x1)/2, 1.165, (z0 + z1)/2); o.rotation.y = Math.atan2(x1 - x0, z1 - z0); g.add(o); };
    ln(-B*0.1, L*0.47, -B*0.1, L*0.05, 0.04, P.white); ln(B*0.45, L*0.4, B*0.45, L*0.05, 0.04, P.white); ln(-B*1.0, -L*0.0, B*0.1, -L*0.45, 0.04, P.white); ln(-B*0.6, -L*0.05, B*0.5, -L*0.45, 0.03, P.white);
    const isl = new T.Group(); isl.position.set(B*0.85, 1.16, -L*0.08); g.add(isl);
    isl.add(plan([[-0.22, -0.9], [0.22, -0.9], [0.22, 0.8], [-0.22, 0.8]], 0.85, P.navy, 0, 0.03)); isl.add(plan([[-0.2, -0.45], [0.2, -0.45], [0.2, 0.55], [-0.2, 0.55]], 0.45, P.navy, 0.85, 0.03));
    isl.add(rbox(0.42, 0.06, 0.04, 0.01, P.glass, 0, 1.15, 0.56)); isl.add(cy(0.03, 0.04, 0.7, P.dark, 6, 0, 1.6, 0)); isl.add(rbox(0.5, 0.05, 0.1, 0.01, P.dark, 0, 1.7, 0)); isl.add(rbox(0.3, 0.2, 0.2, 0.03, P.white, 0, 1.45, 0.25));
    const jetOn = (x, z, r) => { const p = new T.Group(); p.position.set(x, 1.2, z); p.rotation.y = r; g.add(p);
      p.add(cyZ(0.07, 0.09, 1.15, P.air, 0, 0.04, 0, 10)); p.add(plan([[0, 0.25], [0.48, -0.25], [0.48, -0.36], [-0.48, -0.36], [-0.48, -0.25]], 0.03, P.air, 0.02, 0.01)); p.add(plan([[0, -0.38], [0.2, -0.58], [-0.2, -0.58]], 0.02, P.air, 0.03, 0.005)); };
    jetOn(-0.6, L*0.3, 0.1); jetOn(0.3, L*0.22, -0.2); jetOn(-0.9, -L*0.28, 0.9); jetOn(-0.3, -L*0.38, 0.95); jetOn(B*0.55, -L*0.32, 0);
    return {g, ext:6.2, ppm:30, sea:true}; }

  // aircraft parked on their gear (they cast a short shadow under them)
  function gear(g, pts, h){ for (const [x, z] of pts){ g.add(cy(0.05, 0.05, h, P.dark, 6, x, h/2, z)); g.add(cyX(0.16, 0.12, P.rubber, x, 0.16, z)); } }
  function mJet(kind){
    const g = new T.Group(), s = 1.0, H = 1.25, A = kind === 'int' ? P.air : P.air, AD = P.airD;   // ~17 m twin-engine fighter
    const prof = []; for (let i = 0; i <= 18; i++){ const u = i/18, r = (0.08 + Math.sin(Math.min(1, u*1.45)*Math.PI/2)*0.62*(1 - Math.max(0, u - 0.82)*2.2)); prof.push(new T.Vector2(r, (u - 0.5)*15.5)); }
    const fus = mk(new T.LatheGeometry(prof, 22), A); fus.rotation.x = -Math.PI/2; fus.scale.set(1.1, 1, 0.8); fus.position.y = H + 0.35; g.add(fus);
    const can = sph(0.5, P.glass, 0, H + 0.82, 3.5, 0.72, 0.62, 2.5); g.add(can);
    const wing = kind === 'int' ? [[0, 2.4], [6.2, -2.8], [6.2, -3.8], [1.6, -3.9], [0, -4.2], [-1.6, -3.9], [-6.2, -3.8], [-6.2, -2.8]] : [[0, 2.0], [5.3, -2.2], [5.4, -3.2], [1.4, -3.3], [0, -3.6], [-1.4, -3.3], [-5.4, -3.2], [-5.3, -2.2]];
    g.add(plan(wing, 0.16, A, H + 0.18, 0.04));
    for (const sx of [-1, 1]){ g.add(plan([[sx*0.8, -5.0], [sx*3.0, -6.6], [sx*3.0, -7.3], [sx*0.8, -7.0]], 0.08, A, H + 0.26, 0.02));
      const f = side([[-4.6, 0], [-6.9, 0], [-7.5, 2.4], [-6.6, 2.4]], 0.12, AD, 0.02); f.position.set(sx*1.05, H + 0.5, 0); f.rotation.z = sx*0.35; g.add(f);
      g.add(rbox(0.9, 0.7, 2.6, 0.12, AD, sx*0.95, H + 0.25, 1.2)); g.add(cyZ(0.42, 0.38, 0.6, P.dark, sx*0.62, H + 0.28, -7.65, 14)); }
    g.add(cyZ(0.02, 0.24, 1.2, AD, 0, H + 0.35, 8.2, 14));
    if (kind === 'int') for (const sx of [-6.1, 6.1]) g.add(cyZ(0.08, 0.08, 2.8, P.white, sx, H + 0.18, -2.6, 8));
    else for (const sx of [-2.6, 2.6]){ g.add(cyZ(0.2, 0.2, 2.4, P.dark, sx, H - 0.15, -0.8, 10)); g.add(cy(0.03, 0.03, 0.3, P.dark, 4, sx, H + 0.05, -0.8)); }
    gear(g, [[0, 5.0], [-1.6, -1.0], [1.6, -1.0]], H);
    return {g, ext:8.8, ppm:13, air:true}; }
  function mHeli(){
    const g = new T.Group(), H = 0.55, A = P.heli, AD = P.heliD;   // ~17 m attack helicopter on its wheels (a light grey-green scheme: it reads against the ground)
    const prof = []; for (let i = 0; i <= 14; i++){ const u = i/14, r = 0.12 + Math.sin(Math.min(1, u*1.25)*Math.PI*0.5)*0.85*(1 - Math.max(0, u - 0.62)*2.3); prof.push(new T.Vector2(Math.max(0.1, r), (u - 0.5)*8.0)); }
    const fus = mk(new T.LatheGeometry(prof, 18), A); fus.rotation.x = -Math.PI/2; fus.scale.set(0.95, 1.1, 1); fus.position.set(0, H + 0.95, 0.6); g.add(fus);
    const can = sph(0.55, P.glass, 0, H + 1.45, 2.6, 0.62, 0.62, 1.9); g.add(can); g.add(rbox(0.1, 0.1, 1.6, 0.04, AD, 0, H + 1.8, 2.3));
    g.add(cyZ(0.14, 0.34, 6.4, A, 0, H + 1.25, -5.0, 12)); const fin = side([[-7.8, 0], [-8.6, 0], [-9.0, 1.9], [-8.4, 1.95]], 0.12, AD, 0.03); fin.position.y = H + 1.1; g.add(fin);
    g.add(plan([[0, -7.4], [1.3, -7.7], [1.3, -8.0], [-1.3, -8.0], [-1.3, -7.7]], 0.06, AD, H + 1.3, 0.02));
    g.add(plan([[0, 1.0], [2.0, 0.6], [2.0, -0.2], [-2.0, -0.2], [-2.0, 0.6]], 0.1, AD, H + 0.95, 0.03));
    for (const sx of [-1.75, -1.05, 1.05, 1.75]){ g.add(cyZ(0.17, 0.17, 1.3, P.dark, sx, H + 0.62, 0.3, 10)); g.add(cy(0.03, 0.03, 0.3, P.dark, 4, sx, H + 0.85, 0.3)); }
    for (const sx of [-1, 1]) g.add(rbox(0.55, 0.6, 2.0, 0.2, AD, sx*0.62, H + 1.85, -0.2));   // engine pods
    g.add(cyZ(0.07, 0.07, 0.6, P.gun, 0, H + 0.4, 3.0, 6)); g.add(sph(0.2, P.dark, 0, H + 0.45, 2.7));
    g.add(cy(0.12, 0.15, 0.6, P.dark, 10, 0, H + 2.35, -0.1)); g.add(cy(0.22, 0.22, 0.15, P.dark, 10, 0, H + 2.7, -0.1));
    for (let i = 0; i < 4; i++){ const b = rbox(0.3, 0.035, 5.0, 0.015, P.rotor, 0, 0, 2.55); const arm = new T.Group(); arm.add(b); b.rotation.x = 0.025; arm.position.set(0, H + 2.75, -0.1); arm.rotation.y = i*Math.PI/2 + Math.PI/4; b.rotation.x = 0.04; g.add(arm); }
    const tr = new T.Group(); tr.position.set(0.18, H + 2.4, -8.6); g.add(tr); for (let i = 0; i < 4; i++){ const b = rbox(0.03, 0.6, 0.12, 0.01, P.rotor, 0, 0.3, 0); const a = new T.Group(); a.add(b); a.rotation.x = i*Math.PI/2 + 0.3; tr.add(a); }
    gear(g, [[-0.9, 0.9], [0.9, 0.9]], H); g.add(cy(0.04, 0.04, 0.6, P.dark, 6, 0, H + 0.5, -6.6)); g.add(cyX(0.12, 0.1, P.rubber, 0, 0.12, -6.6));
    return {g, ext:7.4, ppm:16, air:true}; }
  function mDrone(){
    const g = new T.Group(), H = 0.75, A = P.air, AD = P.airD;   // MALE drone (~11 m long, 20 m span) on its gear
    const prof = []; for (let i = 0; i <= 16; i++){ const u = i/16, r = 0.06 + Math.sin(Math.min(1, u*1.9)*Math.PI/2)*0.48*(1 - Math.max(0, u - 0.78)*3.2) + (u > 0.72 && u < 0.85 ? 0.08 : 0); prof.push(new T.Vector2(Math.max(0.05, r), (u - 0.5)*10.6)); }
    const fus = mk(new T.LatheGeometry(prof, 18), A); fus.rotation.x = -Math.PI/2; fus.position.y = H + 0.4; g.add(fus);
    g.add(sph(0.5, A, 0, H + 0.55, 3.6, 0.95, 0.9, 1.6));
    g.add(plan([[0, 1.2], [8.6, 0.55], [8.7, -0.15], [0, -0.15], [-8.7, -0.15], [-8.6, 0.55]], 0.12, A, H + 0.62, 0.04));
    for (const sx of [-1, 1]){ const v = side([[-3.9, 0], [-4.9, 0], [-5.5, 1.5], [-5.0, 1.55]], 0.08, AD, 0.02); v.position.set(sx*0.15, H + 0.5, 0); v.rotation.z = sx*0.8; g.add(v); }
    g.add(sph(0.26, P.glass, 0, H + 0.02, 3.4)); g.add(cyZ(0.12, 0.08, 0.3, P.dark, 0, H + 0.4, -5.45, 10));
    g.add(rbox(2.0, 0.04, 0.14, 0.02, P.rotor, 0, H + 0.4, -5.65));
    for (const sx of [-3.5, 3.5]) g.add(cyZ(0.1, 0.1, 1.4, P.white, sx, H + 0.48, 0.3, 8));
    gear(g, [[0, 3.0], [-1.2, -0.5], [1.2, -0.5]], H);
    return {g, ext:10.0, ppm:12, air:true}; }
  const MAPB = {sol:mRifleman, hmv:mHmv, truck:mTruck, tank:mTank, ifv:mIfv, art:mArt, mlrs:mMlrs, sam:mSam, frig:() => mShip('frig'), crui:() => mShip('crui'), sub:mSub, carr:mCarr, jet:() => mJet('jet'), int:() => mJet('int'), heli:mHeli, drone:mDrone};

  // ---------- the map atlases: one cell per direction (16, no animation) in a 4 x 4 grid, north-west sun (its shadow falls south-east like the
  // terrain's hillshade) plus soft sky shadows and a soft contact shade under the hull, rendered at twice the size and filtered down. Two levels are
  // kept: 'hi' (about 1.6x the old sheets, up to 520 px a cell) and its half; the grid is cropped to what any direction covers (one cell of w x h per
  // direction); kept: the ground origin's pixel (ox, oy), each direction's tight box of the model itself (bb, without its shadow) and ppm (px per m),
  // all for the hi level (the half level is exactly half of each)
  const MS = new T.Scene(), MSUN = new T.DirectionalLight(0xfff0da, 1.75), MSKY = [];
  MS.add(new T.HemisphereLight(0xdde7ee, 0x4b4a38, 0.42));
  MSUN.position.set(-8, 17, -7); MSUN.castShadow = true; MSUN.shadow.mapSize.set(4096, 4096); MSUN.shadow.radius = 3; MSUN.shadow.bias = -0.0003; MSUN.shadow.normalBias = 0.012; MS.add(MSUN);
  for (let i = 0; i < 9; i++){ const a = i*2.4, r = i ? 2.6 : 0.3, x = Math.cos(a)*r, z = Math.sin(a)*r, y = 19; const l = new T.DirectionalLight(0xd8e4ee, 0.075); l.position.set(x, y, z); l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.radius = 9; l.shadow.bias = -0.0006; l.shadow.normalBias = 0.02; MS.add(l); MSKY.push(l); }
  { const f = new T.DirectionalLight(0xb8c8d6, 0.3); f.position.set(6, 6, 12); MS.add(f); }
  const MGND = new T.Mesh(new T.PlaneGeometry(80, 80), new T.ShadowMaterial({opacity:0.5})); MGND.rotation.x = -Math.PI/2; MGND.receiveShadow = true; MS.add(MGND);
  const MEXP = 0.96, MCAM = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 200), CLIP = [new T.Plane(new T.Vector3(0, 1, 0), -WL)], MCOLS = 4, MHI = 1.6, MZMAX = 520;
  // the contact shade: a soft dark ellipse right under the hull (where the sky cannot reach), so a model sits on the ground instead of floating
  let AOT = null; const aoTex = () => { if (AOT) return AOT; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return (AOT = new T.CanvasTexture(c)); };
  function contactShade(model, air){ const bx = new T.Box3().setFromObject(model.g), sx = (bx.max.x - bx.min.x)*(air ? 0.55 : 1.12), sz = (bx.max.z - bx.min.z)*(air ? 0.5 : 1.08);
    const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({map:aoTex(), color:0x000000, transparent:true, opacity:air ? 0.3 : 0.5, depthWrite:false}));
    m.rotation.x = -Math.PI/2; m.scale.set(sx, sz, 1); m.position.set((bx.max.x + bx.min.x)/2, 0.012, (bx.max.z + bx.min.z)/2); m.renderOrder = -1; model.g.add(m); }
  // a thin dark rim round the model itself (not its soft shadow) at one level, so it stands out of the terrain like a rendered miniature
  function rimify(cv){ const g = cv.getContext('2d', {willReadFrequently:true}), w = cv.width, h = cv.height, id = g.getImageData(0, 0, w, h), px = id.data, rim = g.createImageData(w, h), rp = rim.data;
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++){ const i = (y*w + x)*4; if (px[i + 3] > 150) continue; const n = (px[i + 7] > 200) + (px[i - 1] > 200) + (px[i + w*4 + 3] > 200) + (px[i - w*4 + 3] > 200);
      if (n){ rp[i] = 14; rp[i + 1] = 16; rp[i + 2] = 10; rp[i + 3] = Math.min(255, 70 + n*42); } }
    const r = document.createElement('canvas'); r.width = w; r.height = h; r.getContext('2d').putImageData(rim, 0, 0); g.globalCompositeOperation = 'destination-over'; g.drawImage(r, 0, 0); g.globalCompositeOperation = 'source-over'; }
  function mapBuild(type){
    const model = MAPB[type](), air = !!model.air, sea = !!model.sea, dirs = 16, rows = dirs/MCOLS, half = model.ext, ppm = Math.min(model.ppm*MHI, MZMAX/(2*half)), Z = Math.ceil(half*ppm)*2, SS = 2;
    if (!sea) contactShade(model, air);
    const mats = new Set(); model.g.traverse(o => { if (o.isMesh && o.material && o.material.userData && o.material.userData.pbr) mats.add(o.material); });
    for (const m of mats){ m.clippingPlanes = sea ? CLIP : []; m.needsUpdate = true; }
    renderer.localClippingEnabled = true; renderer.setSize(Z*SS, Z*SS); const ex0 = renderer.toneMappingExposure; renderer.toneMappingExposure = MEXP; renderer.shadowMap.needsUpdate = true;
    for (const l of [MSUN, ...MSKY]){ const c = l.shadow.camera; c.left = c.bottom = -half - 2; c.right = c.top = half + 2; c.near = 0.5; c.far = 80; c.updateProjectionMatrix(); }
    MS.add(model.g); MGND.visible = !sea; MGND.material.opacity = air ? 0.42 : 0.5;
    MCAM.left = -half; MCAM.right = half; MCAM.top = half; MCAM.bottom = -half; MCAM.updateProjectionMatrix();
    const dist = 60, el = air ? 0.92 : 0.82, ly = model.look ?? (air ? 1.0 : sea ? 0.6 : 0.9); MCAM.position.set(0, Math.sin(el)*dist + ly, Math.cos(el)*dist); MCAM.lookAt(0, ly, 0); MCAM.updateMatrixWorld();
    const full = document.createElement('canvas'); full.width = Z*MCOLS; full.height = Z*rows; const fx = full.getContext('2d', {willReadFrequently:true}); fx.imageSmoothingEnabled = true; fx.imageSmoothingQuality = 'high';
    const cx0 = d => (d % MCOLS)*Z, cy0 = d => Math.floor(d/MCOLS)*Z;
    for (let d = 0; d < dirs; d++){ model.g.rotation.y = Math.PI/2 - d*Math.PI*2/dirs; model.g.updateMatrixWorld(true); CU.inv.value.copy(model.g.matrixWorld).invert();
      renderer.render(MS, MCAM); fx.drawImage(renderer.domElement, 0, 0, Z*SS, Z*SS, cx0(d), cy0(d), Z, Z); }
    MS.remove(model.g); for (const m of mats){ m.clippingPlanes = []; m.needsUpdate = true; } renderer.localClippingEnabled = false; renderer.setSize(SZ, SZ); renderer.toneMappingExposure = ex0;
    const v = new T.Vector3(0, 0, 0).project(MCAM), ox = (v.x + 1)/2*Z, oy = (1 - v.y)/2*Z;
    const px = fx.getImageData(0, 0, full.width, full.height).data, FW = full.width; let x0 = Z, y0 = Z, x1 = 0, y1 = 0; const bb0 = [];
    for (let d = 0; d < dirs; d++){ let a0 = Z, b0 = Z, a1 = -1, b1 = -1; const X0 = cx0(d), Y0 = cy0(d);
      for (let y = 0; y < Z; y++) for (let x = 0; x < Z; x++){ const al = px[((Y0 + y)*FW + X0 + x)*4 + 3]; if (al > 6){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (al > 170){ if (x < a0) a0 = x; if (x > a1) a1 = x; if (y < b0) b0 = y; if (y > b1) b1 = y; } }
      bb0.push([a0, b0, a1 + 1, b1 + 1]); }
    x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(Z - 1, x1 + 2); y1 = Math.min(Z - 1, y1 + 2); x0 -= x0 % 2; y0 -= y0 % 2;
    const w = Math.min(Z - x0, Math.ceil((x1 - x0 + 1)/2)*2), h = Math.min(Z - y0, Math.ceil((y1 - y0 + 1)/2)*2), hi = document.createElement('canvas'); hi.width = w*MCOLS; hi.height = h*rows; const hx = hi.getContext('2d', {willReadFrequently:true});
    for (let d = 0; d < dirs; d++) hx.drawImage(full, cx0(d) + x0, cy0(d) + y0, w, h, (d % MCOLS)*w, Math.floor(d/MCOLS)*h, w, h);
    const mid = document.createElement('canvas'); mid.width = hi.width/2; mid.height = hi.height/2; const mx = mid.getContext('2d', {willReadFrequently:true}); mx.imageSmoothingEnabled = true; mx.imageSmoothingQuality = 'high'; mx.drawImage(hi, 0, 0, mid.width, mid.height);
    rimify(hi); rimify(mid);
    const bb = bb0.map(q => q[2] > q[0] ? [q[0] - x0, q[1] - y0, q[2] - x0, q[3] - y0] : [0, 0, w, h]);
    return {hi, mid, cols:MCOLS, w, h, ox:+(ox - x0).toFixed(2), oy:+(oy - y0).toFixed(2), ppm:+ppm.toFixed(4), air, sea, bb}; }
  mapFn = mapBuild;
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
  const mapAt = {}; let mapDir = 'assets/units/';
  function mapLevels(m, midCv, hiCv){ const H = {cols:4, w:m.w, h:m.h, ox:m.ox, oy:m.oy, ppm:m.ppm, bb:m.bb, air:!!m.air, sea:!!m.sea};
    const M = {cv:midCv, lvl:0, cols:4, w:m.w/2, h:m.h/2, ox:m.ox/2, oy:m.oy/2, ppm:m.ppm/2, bb:m.bb.map(q => q.map(v => v/2)), air:!!m.air, sea:!!m.sea};
    return {m:H, mid:M, hi:hiCv ? Object.assign({cv:hiCv, lvl:1}, H) : null, hiT:0, hiLoad:!!hiCv}; }
  function hiTrim(keep){ const on = Object.keys(mapAt).filter(t => mapAt[t] && mapAt[t].hi).sort((a, b) => mapAt[b].hiT - mapAt[a].hiT);
    for (const t of on.slice(4)) if (t !== keep){ mapAt[t].hi = null; mapAt[t].hiLoad = false; } }
  const queue = ['inf', 'tank', 'at', 'art', 'ifv', 'sam', 'jet', 'int', 'frig', 'sub', 'crui', 'heli', 'drone', 'carr', 'mlrs', 'spec'];
  let warm = false;
  function warmup(){ if (warm || !buildFn) return; warm = true; let i = 0; const step = () => { if (i >= queue.length) return; try { if (!cache[queue[i]]) buildFn(queue[i]); i++; } catch (e) { i++; } setTimeout(step, 30); }; setTimeout(step, 50); }
  window.U3D = {

    // the map model atlas of a type ({cv, dirs, w, h, ox, oy, ppm, air, sea}), or null while it loads: a baked sheet is fetched the first time it is
    // wanted (no stand-in meanwhile); with three.js present and nothing baked (the bake page) it is rendered here
    map(type, lvl = 0){ let A = mapAt[type];
      if (A === undefined){ const m = MAPMETA[type]; mapAt[type] = A = null;
        if (m && !window.__BAKE){ const im = new Image(); im.decoding = 'async'; im.onload = () => { mapAt[type] = mapLevels(m, im, null); }; im.onerror = () => {}; im.src = mapDir + 'm-' + type + '.webp'; }
        else if (mapFn) try { const R = mapFn(type); mapAt[type] = A = mapLevels(R, R.mid, R.hi); } catch (e) {} }
      if (!A) return null;
      if (lvl > 0){ A.hiT = performance.now(); if (A.hi) return A.hi;
        if (!A.hiLoad && !window.__BAKE){ A.hiLoad = true; const im = new Image(); im.decoding = 'async'; im.onload = () => { if (A.hiLoad) A.hi = Object.assign({cv:im, lvl:1}, A.m); hiTrim(type); }; im.onerror = () => {}; im.src = mapDir + 'm-' + type + '-hi.webp'; }
        return null; }
      return A.mid; },
    // drop the hi sheets not drawn for a while (memory: at most a few are decoded at once)
    mapTrim(now){ for (const t in mapAt){ const A = mapAt[t]; if (A && A.hi && now - A.hiT > 15000){ A.hi = null; A.hiLoad = false; } } },
    mapTypes: () => Object.keys(MAPMETA), mapDir(d){ mapDir = d; },
    // a type's baked sheet meta (hi level: ppm, ground origin, per-direction boxes) without loading the sheet
    mapMeta: type => MAPMETA[type] || (mapAt[type] && mapAt[type].m) || null,
    exportMap(type){ if (!mapFn) return null; const A = mapFn(type); return {hi:A.hi.toDataURL('image/webp', 0.86), img:A.mid.toDataURL('image/webp', 0.9), meta:{w:A.w, h:A.h, ox:A.ox, oy:A.oy, ppm:A.ppm, air:A.air, sea:A.sea, bb:A.bb}}; },
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
