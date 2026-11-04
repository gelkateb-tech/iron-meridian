// Iron Meridian — pre-rendered 3D unit sprites.
// Every model is built procedurally from three.js primitives (original designs, no external assets),
// lit and rendered once per direction/animation frame into a sprite atlas, plus a mask of the
// nation-colored parts so each power's units can be tinted at draw time.
(function(){
  'use strict';
  const T = window.THREE;
  if (!T){ window.U3D = null; return; }
  let renderer;
  try {
    renderer = new T.WebGLRenderer({antialias:true, alpha:true, preserveDrawingBuffer:true});
  } catch (e){ window.U3D = null; return; }
  const SZ = 112;                                   // pixels per frame
  renderer.setPixelRatio(1); renderer.setSize(SZ, SZ); renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  if (T.sRGBEncoding) renderer.outputEncoding = T.sRGBEncoding;

  // ---------- materials
  const M = {
    team:   () => new T.MeshStandardMaterial({color:0xd8d8d0, roughness:0.62, metalness:0.15}),
    teamD:  () => new T.MeshStandardMaterial({color:0xa9a9a2, roughness:0.7, metalness:0.1}),
    steel:  new T.MeshStandardMaterial({color:0x3c403e, roughness:0.45, metalness:0.6}),
    dark:   new T.MeshStandardMaterial({color:0x1d201f, roughness:0.9, metalness:0.05}),
    rubber: new T.MeshStandardMaterial({color:0x151615, roughness:0.95}),
    glass:  new T.MeshStandardMaterial({color:0x6f9fb8, roughness:0.15, metalness:0.4}),
    skin:   new T.MeshStandardMaterial({color:0xc9a684, roughness:0.8}),
    gear:   new T.MeshStandardMaterial({color:0x4a4f3c, roughness:0.85}),
    white:  new T.MeshStandardMaterial({color:0xe9e7df, roughness:0.6}),
    deck:   new T.MeshStandardMaterial({color:0x5a5f60, roughness:0.75, metalness:0.2}),
  };
  const isTeam = m => m && m.userData && m.userData.team;
  function team(dark){ const m = dark ? M.teamD() : M.team(); m.userData.team = true; return m; }
  function mesh(geo, mat, x = 0, y = 0, z = 0){ const o = new T.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o; }
  const box = (w, h, d, mat, x, y, z) => mesh(new T.BoxGeometry(w, h, d), mat, x, y, z);
  const cyl = (rt, rb, h, mat, seg = 14) => mesh(new T.CylinderGeometry(rt, rb, h, seg), mat);
  function extrudeSide(points, width, mat){
    // points: side profile in (z, y); extruded along x by width, centred
    const sh = new T.Shape(); sh.moveTo(points[0][0], points[0][1]); for (let i = 1; i < points.length; i++) sh.lineTo(points[i][0], points[i][1]); sh.closePath();
    const g = new T.ExtrudeGeometry(sh, {depth:width, bevelEnabled:true, bevelThickness:0.03, bevelSize:0.03, bevelSegments:1});
    g.translate(0, 0, -width/2); const o = mesh(g, mat); o.rotation.y = -Math.PI/2; return o;
  }
  function extrudeTop(points, height, mat){
    // points: top outline in (x, z); extruded upward by height
    const sh = new T.Shape(); sh.moveTo(points[0][0], points[0][1]); for (let i = 1; i < points.length; i++) sh.lineTo(points[i][0], points[i][1]); sh.closePath();
    const g = new T.ExtrudeGeometry(sh, {depth:height, bevelEnabled:true, bevelThickness:0.04, bevelSize:0.04, bevelSegments:1});
    const o = mesh(g, mat); o.rotation.x = Math.PI/2; o.position.y = height; return o;
  }
  function wheelsRow(n, x, y, z0, z1, r, mat){ const g = new T.Group(); for (let i = 0; i < n; i++){ const w = cyl(r, r, 0.22, mat, 16); w.rotation.z = Math.PI/2; w.position.set(x, y, z0 + (z1 - z0)*i/(n - 1)); g.add(w); } return g; }

  // ---------- models (all face +z; y up; ground at y = 0)
  function mbt(){
    const g = new T.Group(), t = team(), td = team(true);
    for (const sx of [-0.78, 0.78]){ g.add(box(0.42, 0.42, 3.5, M.rubber, sx, 0.26, 0)); g.add(wheelsRow(6, sx*1.02, 0.25, -1.35, 1.35, 0.2, M.dark)); g.add(box(0.5, 0.16, 3.3, td, sx, 0.52, 0)); }
    g.add(extrudeSide([[-1.7, 0.42], [1.35, 0.42], [1.8, 0.62], [1.45, 0.9], [-1.6, 0.92]], 1.5, t));
    const tur = new T.Group(); tur.name = 'turret';
    tur.add(extrudeSide([[-1.0, 0], [0.55, 0], [1.05, 0.12], [0.9, 0.42], [-0.95, 0.46]], 1.25, t));
    const gun = new T.Group(); gun.name = 'gun';
    const barrel = cyl(0.06, 0.075, 2.6, M.steel); barrel.rotation.x = Math.PI/2; barrel.position.set(0, 0.24, 2.2); gun.add(barrel);
    const brake = cyl(0.1, 0.1, 0.22, M.steel); brake.rotation.x = Math.PI/2; brake.position.set(0, 0.24, 3.45); gun.add(brake);
    const mantlet = box(0.5, 0.32, 0.3, td, 0, 0.24, 1.0); gun.add(mantlet);
    tur.add(gun);
    const hatch = cyl(0.18, 0.2, 0.12, td); hatch.position.set(-0.3, 0.52, -0.3); tur.add(hatch);
    const ant = cyl(0.012, 0.012, 1.1, M.dark, 5); ant.position.set(0.45, 1.0, -0.8); tur.add(ant);
    tur.position.set(0, 0.92, -0.15); g.add(tur);
    return {g, size:4.6};
  }
  function ifv(){
    const g = new T.Group(), t = team(), td = team(true);
    for (const sx of [-0.8, 0.8]){ g.add(wheelsRow(6, sx, 0.32, -1.25, 1.25, 0.3, M.rubber)); }
    g.add(extrudeSide([[-1.6, 0.4], [1.3, 0.4], [1.75, 0.75], [1.25, 1.2], [-1.6, 1.25]], 1.55, t));
    g.add(box(1.0, 0.5, 0.06, td, 0, 0.8, -1.63));
    const tur = new T.Group(); tur.name = 'turret';
    tur.add(box(0.75, 0.32, 0.8, td, 0, 0.16, 0));
    const gun = new T.Group(); gun.name = 'gun'; const b = cyl(0.035, 0.035, 1.3, M.steel, 8); b.rotation.x = Math.PI/2; b.position.set(0.1, 0.2, 0.95); gun.add(b); tur.add(gun);
    tur.position.set(0, 1.25, 0.2); g.add(tur);
    return {g, size:4.0};
  }
  function arty(){
    const g = new T.Group(), t = team(), td = team(true);
    for (const sx of [-0.65, 0.65]){ const w = cyl(0.45, 0.45, 0.25, M.rubber, 18); w.rotation.z = Math.PI/2; w.position.set(sx, 0.45, 0); g.add(w); }
    for (const sx of [-1, 1]){ const leg = box(0.14, 0.14, 2.0, td, sx*0.35, 0.25, -1.0); leg.rotation.y = sx*0.22; leg.rotation.x = 0.12; g.add(leg); }
    g.add(box(1.5, 0.18, 0.7, t, 0, 0.62, 0.1));
    const shield = box(1.6, 0.8, 0.08, t, 0, 1.0, 0.55); shield.rotation.x = -0.15; g.add(shield);
    const gun = new T.Group(); gun.name = 'gun';
    const cradle = box(0.36, 0.3, 1.0, M.steel, 0, 0, 0.1); gun.add(cradle);
    const b = cyl(0.08, 0.1, 3.0, M.steel); b.rotation.x = Math.PI/2; b.position.set(0, 0, 1.6); gun.add(b);
    gun.position.set(0, 0.95, 0.1); gun.rotation.x = -0.55; g.add(gun);
    return {g, size:4.4};
  }
  function sam(){
    const g = new T.Group(), t = team(), td = team(true);
    for (const z of [1.25, 0.05, -0.85]) for (const sx of [-0.78, 0.78]){ const w = cyl(0.33, 0.33, 0.24, M.rubber, 16); w.rotation.z = Math.PI/2; w.position.set(sx, 0.33, z); g.add(w); }
    g.add(box(1.5, 0.3, 3.6, M.dark, 0, 0.55, 0.1));
    const cab = box(1.5, 0.95, 1.0, t, 0, 1.15, 1.45); g.add(cab);
    g.add(box(1.3, 0.45, 0.06, M.glass, 0, 1.35, 1.97));
    const lau = new T.Group(); lau.name = 'gun';
    for (let i = 0; i < 4; i++){ const tube = cyl(0.17, 0.17, 2.4, td, 10); tube.rotation.x = Math.PI/2; tube.position.set(-0.27 + (i % 2)*0.54, (i >> 1)*0.36, 0); lau.add(tube); const cap = cyl(0.15, 0.15, 0.04, M.white, 10); cap.rotation.x = Math.PI/2; cap.position.set(-0.27 + (i % 2)*0.54, (i >> 1)*0.36, 1.21); lau.add(cap); }
    lau.position.set(0, 1.25, -0.5); lau.rotation.x = -0.75; g.add(lau);
    const dish = cyl(0.32, 0.05, 0.12, M.white, 16); dish.rotation.x = 1.2; dish.position.set(0.45, 1.85, 1.2); g.add(dish);
    return {g, size:4.6};
  }
  function soldier(t, tube){
    const s = new T.Group();
    const legL = new T.Group(), legR = new T.Group(); legL.name = 'legL'; legR.name = 'legR';
    legL.add(box(0.16, 0.62, 0.18, M.gear, 0, -0.31, 0)); legR.add(box(0.16, 0.62, 0.18, M.gear, 0, -0.31, 0));
    legL.add(box(0.17, 0.1, 0.26, M.dark, 0, -0.62, 0.04)); legR.add(box(0.17, 0.1, 0.26, M.dark, 0, -0.62, 0.04));
    legL.position.set(-0.11, 0.68, 0); legR.position.set(0.11, 0.68, 0); s.add(legL, legR);
    s.add(box(0.44, 0.58, 0.26, t, 0, 0.98, 0));                      // torso (team uniform)
    s.add(box(0.36, 0.42, 0.18, M.gear, 0, 1.0, -0.2));               // backpack
    const head = mesh(new T.SphereGeometry(0.13, 12, 10), M.skin, 0, 1.4, 0.02); s.add(head);
    const helm = mesh(new T.SphereGeometry(0.155, 12, 8, 0, Math.PI*2, 0, Math.PI/2), team(true), 0, 1.42, 0); s.add(helm);
    const armR = new T.Group(); armR.name = 'armR'; armR.add(box(0.12, 0.5, 0.12, t, 0, -0.22, 0)); armR.position.set(0.28, 1.22, 0); s.add(armR);
    const armL = new T.Group(); armL.name = 'armL'; armL.add(box(0.12, 0.5, 0.12, t, 0, -0.22, 0)); armL.position.set(-0.28, 1.22, 0); s.add(armL);
    if (tube){ const tb = cyl(0.09, 0.09, 1.2, M.gear, 10); tb.rotation.x = Math.PI/2; tb.position.set(0.2, 1.38, 0.05); s.add(tb); }
    else { const rifle = box(0.06, 0.08, 0.8, M.dark, 0.18, 1.05, 0.32); rifle.rotation.x = -0.25; s.add(rifle); armR.rotation.x = -0.9; armL.rotation.x = -0.7; }
    return s;
  }
  function squad(tube){
    const g = new T.Group(), t = team();
    const spots = tube ? [[-0.42, 0.2], [0.42, -0.2]] : [[-0.6, 0.3], [0.05, -0.25], [0.65, 0.28]];
    spots.forEach(([x, z], i) => { const s = soldier(t, tube && i === 0); s.position.set(x, 0, z); s.userData.ph = i*1.9; s.name = 'soldier'; g.add(s); });
    return {g, size:2.5};
  }
  function jet(kind){
    const g = new T.Group(), t = team(), td = team(true);
    const prof = []; for (let i = 0; i <= 12; i++){ const u = i/12; prof.push(new T.Vector2(0.06 + Math.sin(Math.min(1, u*1.6)*Math.PI/2)*0.42*(1 - Math.max(0, u - 0.85)*3), (u - 0.5)*5.6)); }
    const fus = mesh(new T.LatheGeometry(prof, 16), t); fus.rotation.x = Math.PI/2; g.add(fus);
    const nose = mesh(new T.ConeGeometry(0.2, 0.9, 14), M.dark); nose.rotation.x = Math.PI/2; nose.position.z = 3.2; g.add(nose);
    const can = mesh(new T.SphereGeometry(0.28, 14, 10), M.glass); can.scale.set(0.8, 0.65, 2.0); can.position.set(0, 0.38, 1.4); g.add(can);
    const wing = kind === 'int' ? [[0, 1.3], [3.0, -1.6], [3.0, -2.0], [0, -1.7], [-3.0, -2.0], [-3.0, -1.6]] : [[0, 1.0], [2.9, -0.7], [2.9, -1.3], [0.4, -1.1], [-0.4, -1.1], [-2.9, -1.3], [-2.9, -0.7]];
    const w = extrudeTop(wing, 0.07, td); w.position.y = 0.0; g.add(w);
    const tailH = extrudeTop([[0, -1.9], [1.3, -2.8], [1.3, -3.0], [0, -2.8], [-1.3, -3.0], [-1.3, -2.8]], 0.05, td); tailH.position.y = 0.05; g.add(tailH);
    for (const sx of kind === 'int' ? [-0.38, 0.38] : [0]){ const fin = extrudeSide([[-2.9, 0], [-1.9, 0], [-2.4, 1.0], [-2.9, 1.05]], 0.06, t); fin.position.x = sx; fin.rotation.z = sx*0.5; g.add(fin); }
    if (kind === 'int'){ for (const sx of [-3.0, 3.0]){ const m = cyl(0.06, 0.06, 1.3, M.white, 8); m.rotation.x = Math.PI/2; m.position.set(sx, -0.02, -1.3); g.add(m); } }
    else { for (const sx of [-1.5, 1.5]){ const bomb = cyl(0.14, 0.14, 1.0, M.dark, 10); bomb.rotation.x = Math.PI/2; bomb.position.set(sx, -0.22, -0.4); g.add(bomb); } }
    const flame = mesh(new T.ConeGeometry(0.22, 0.8, 12), new T.MeshBasicMaterial({color:0xffa24a})); flame.rotation.x = -Math.PI/2; flame.position.z = -3.2; flame.name = 'flame'; g.add(flame);
    return {g, size:6.6, air:true};
  }
  function hullShape(L, B){ return [[0, L/2], [B*0.42, L*0.3], [B/2, 0], [B*0.48, -L*0.38], [B*0.38, -L/2], [-B*0.38, -L/2], [-B*0.48, -L*0.38], [-B/2, 0], [-B*0.42, L*0.3]]; }
  function ship(kind){
    const g = new T.Group(), t = team(), td = team(true);
    if (kind === 'sub'){
      const prof = []; for (let i = 0; i <= 12; i++){ const u = i/12; prof.push(new T.Vector2(Math.sin(u*Math.PI)*0.55 + 0.02, (u - 0.5)*7)); }
      const hull = mesh(new T.LatheGeometry(prof, 18), td); hull.rotation.x = Math.PI/2; hull.position.y = 0.15; hull.scale.y = 0.75; g.add(hull);
      g.add(box(0.36, 0.7, 1.1, t, 0, 0.75, 0.8));
      g.add(box(1.4, 0.05, 0.3, t, 0, 0.9, 0.8));
      g.add(box(0.05, 0.6, 0.5, td, 0, 0.3, -3.2));
      return {g, size:7.6, sea:true};
    }
    const big = kind === 'crui', L = big ? 8.4 : 7.0, B = big ? 1.5 : 1.25;
    const hull = extrudeTop(hullShape(L, B), 0.55, td); hull.position.y = 0.55; g.add(hull);
    g.add(extrudeTop(hullShape(L*0.96, B*0.92), 0.03, M.deck)).position.y = 0.6;
    g.add(box(B*0.7, 0.7, L*0.22, t, 0, 0.95, -0.2));
    g.add(box(B*0.5, 0.45, L*0.14, t, 0, 1.5, -0.1));
    const mast = cyl(0.06, 0.08, 1.4, M.dark, 6); mast.position.set(0, 2.2, -0.1); g.add(mast);
    const radar = box(0.7, 0.08, 0.16, M.white, 0, 2.6, -0.1); g.add(radar);
    for (const z of big ? [L*0.32, -L*0.33] : [L*0.32]){ const tu = new T.Group(); tu.add(cyl(0.32, 0.38, 0.3, t, 14)); const b = cyl(0.05, 0.05, 1.0, M.steel, 8); b.rotation.x = Math.PI/2; b.position.set(0, 0.06, z > 0 ? 0.55 : -0.55); tu.add(b); tu.position.set(0, 0.8, z); g.add(tu); }
    if (big) g.add(box(B*0.5, 0.12, 0.8, M.dark, 0, 0.66, L*0.12));
    else g.add(box(B*0.85, 0.02, 1.0, M.white, 0, 0.62, -L*0.38));
    return {g, size:big ? 9 : 7.8, sea:true};
  }
  const BUILDERS = {tank:mbt, ifv, art:arty, sam, inf:() => squad(false), at:() => squad(true), jet:() => jet('jet'), int:() => jet('int'), frig:() => ship('frig'), sub:() => ship('sub'), crui:() => ship('crui')};
  const SPEC = {inf:{dirs:8, frames:8}, at:{dirs:8, frames:8}, tank:{dirs:8, frames:4}, ifv:{dirs:8, frames:2}, art:{dirs:8, frames:4}, sam:{dirs:8, frames:2},
                jet:{dirs:16, frames:1}, int:{dirs:16, frames:1}, frig:{dirs:16, frames:1}, sub:{dirs:16, frames:1}, crui:{dirs:16, frames:1}};

  // ---------- scene
  const scene = new T.Scene();
  const hemi = new T.HemisphereLight(0xdfe8ef, 0x2d3326, 0.75); scene.add(hemi);
  const sun = new T.DirectionalLight(0xfff1dc, 1.25); sun.position.set(-6, 12, 7); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); const sc = sun.shadow.camera; sc.left = sc.bottom = -8; sc.right = sc.top = 8; sc.near = 1; sc.far = 40; sun.shadow.bias = -0.0015; scene.add(sun);
  const ground = new T.Mesh(new T.PlaneGeometry(40, 40), new T.ShadowMaterial({opacity:0.38})); ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
  const cam = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  const ELEV = 0.78;                                     // ~45 degrees looking down
  const blackMat = new T.MeshBasicMaterial({color:0x000000}), whiteMat = new T.MeshBasicMaterial({color:0xffffff});

  function pose(model, type, frame){
    const g = model.g;
    if (type === 'inf' || type === 'at'){ g.traverse(o => { if (o.name !== 'soldier') return; const ph = frame/8*Math.PI*2 + (o.userData.ph || 0), sw = Math.sin(ph)*0.55;
      o.getObjectByName('legL').rotation.x = sw; o.getObjectByName('legR').rotation.x = -sw; o.position.y = Math.abs(Math.cos(ph))*0.05; }); }
    if (type === 'tank' || type === 'art' || type === 'ifv'){ const gun = g.getObjectByName('gun'); if (gun){ const rec = [0, 0.45, 0.25, 0.1][frame] || 0; if (!gun.userData.z0 && gun.userData.z0 !== 0) gun.userData.z0 = gun.position.z; gun.position.z = gun.userData.z0 - rec; } }
    if (type === 'sam'){ const l = g.getObjectByName('gun'); if (l) l.rotation.x = frame ? -0.95 : -0.75; }
  }
  const cache = {};
  function build(type){
    if (cache[type]) return cache[type];
    const spec = SPEC[type], model = BUILDERS[type]();
    const {dirs, frames} = spec, base = document.createElement('canvas'), mask = document.createElement('canvas');
    base.width = mask.width = SZ*frames; base.height = mask.height = SZ*dirs;
    const bc = base.getContext('2d'), mc = mask.getContext('2d');
    scene.add(model.g); ground.visible = !model.air;
    const half = model.size*0.62; cam.left = -half; cam.right = half; cam.top = half; cam.bottom = -half; cam.updateProjectionMatrix();
    const dist = 30, el = model.air ? 1.25 : ELEV;
    cam.position.set(0, Math.sin(el)*dist, Math.cos(el)*dist); cam.lookAt(0, model.air ? 0 : 0.5, 0);
    const mats = []; model.g.traverse(o => { if (o.isMesh) mats.push([o, o.material]); });
    for (let d = 0; d < dirs; d++){
      // direction d: screen angle d*360/dirs measured clockwise from "east" (to the right)
      const screenAng = d*Math.PI*2/dirs;
      model.g.rotation.y = Math.PI/2 - screenAng;
      for (let f = 0; f < frames; f++){
        pose(model, type, f);
        for (const [o, m] of mats) o.material = m;
        renderer.render(scene, cam); bc.drawImage(renderer.domElement, f*SZ, d*SZ);
        for (const [o, m] of mats) o.material = isTeam(m) ? whiteMat : blackMat;
        const gv = ground.visible; ground.visible = false; renderer.render(scene, cam); mc.drawImage(renderer.domElement, f*SZ, d*SZ); ground.visible = gv;
      }
    }
    for (const [o, m] of mats) o.material = m;
    scene.remove(model.g);
    // mask: keep only white (team) pixels as alpha
    const id = mc.getImageData(0, 0, mask.width, mask.height), px = id.data;
    for (let i = 0; i < px.length; i += 4){ const v = px[i]; px[i] = px[i + 1] = px[i + 2] = 255; px[i + 3] = px[i + 3] ? v : 0; }
    mc.putImageData(id, 0, 0);
    return (cache[type] = {base, mask, dirs, frames, size:model.size, air:!!model.air, sea:!!model.sea});
  }
  const tinted = {};
  function mixCol(hex, base, t){ const A = parseInt(hex.slice(1), 16), B = parseInt(base.slice(1), 16); const m = sh => Math.round(((A >> sh) & 255)*(1 - t) + ((B >> sh) & 255)*t); return `rgb(${m(16)},${m(8)},${m(0)})`; }
  function tint(type, color){
    const k = type + color; if (tinted[k]) return tinted[k];
    const a = build(type), c = document.createElement('canvas'); c.width = a.base.width; c.height = a.base.height;
    // military finish: nation colour blended into olive drab (ground) or naval/air grey
    if (color[0] === '#') color = a.air || a.sea ? mixCol(color, '#8a9298', 0.42) : mixCol(color, '#6f7652', 0.38);
    const x = c.getContext('2d');
    const col = document.createElement('canvas'); col.width = c.width; col.height = c.height; const cx = col.getContext('2d');
    cx.drawImage(a.mask, 0, 0); cx.globalCompositeOperation = 'source-in'; cx.fillStyle = color; cx.fillRect(0, 0, c.width, c.height);
    x.drawImage(a.base, 0, 0); x.globalCompositeOperation = 'multiply'; x.drawImage(col, 0, 0);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(a.base, 0, 0);       // restore the base alpha
    return (tinted[k] = c);
  }
  const queue = Object.keys(BUILDERS);
  let warm = false;
  function warmup(){ if (warm) return; warm = true; let i = 0; const step = () => { if (i >= queue.length) return; try { build(queue[i++]); } catch (e) { i++; } setTimeout(step, 30); }; setTimeout(step, 50); }
  window.U3D = {
    SZ,
    has: type => !!cache[type],
    warmup,
    // draw a unit sprite centred on (x, y) at the given on-screen height; ang in radians (screen space), frame index
    draw(ctx, type, color, x, y, h, ang, frame = 0){
      const a = cache[type]; if (!a) return false;
      const sheet = tint(type, color);
      let d = Math.round(((ang % (Math.PI*2)) + Math.PI*2) % (Math.PI*2)/(Math.PI*2)*a.dirs) % a.dirs;
      const f = Math.max(0, Math.min(a.frames - 1, frame | 0));
      ctx.drawImage(sheet, f*SZ, d*SZ, SZ, SZ, x - h/2, y - h*0.62, h, h);
      return true;
    },
  };
})();
