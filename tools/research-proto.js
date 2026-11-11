// Iron Meridian: the research tree checked and reported (the tree is data in rules/data.js; the generated parts of docs/RESEARCH.md are written from it).
//   node tools/research-proto.js            checks the tree and prints totals and the budget simulation
//   node tools/research-proto.js --md       prints the tree tables (markdown)
//   node tools/research-proto.js --write    rewrites the generated part of docs/RESEARCH.md (between the TREE markers)
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(__dirname, '..');
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const R = new Function("'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn {UNITS, RCATS, RNODES, RN, R_LEGACY, R_PCT, MARK_F, MISSILES};')();
const {UNITS, MARK_F} = R;
// the tree itself lives in the rules (rules/data.js: RCATS, R_LINES, R_SPECIAL, RNODES); this tool reads it, checks it and reports on it
const CATS = R.RCATS, NODES = R.RNODES, BY = R.RN, PCT = R.R_PCT;
const LEGACY = Object.fromEntries(Object.entries(R.R_LEGACY).map(([k, v]) => [k, v.map(x => x.endsWith('@') ? x.slice(0, -1) + '@1' : x)]));
for (const id of ['log1', 'log2', 'log3', 'nav3', 'msl1', 'msl2', 'msl3', 'sat1']) LEGACY[id] = [id];   // unchanged: same id, level 1
// the tree before the redesign (38 projects), kept here so the conversion of old saves stays checked: what each gave and what it cost
const OLD = {
  inf1:{name:"Ceramic Body Armor", fx:{inf:{def:1}, at:{def:1}}, unl:[], c:{cash:36, metal:20, rare:23, days:3}},
  inf2:{name:"Mechanized Infantry", fx:{inf:{atk:2, spd:1}, at:{atk:1}}, unl:["ifv"], c:{cash:66, metal:35, rare:53, days:5}},
  inf3:{name:"Special Forces", fx:{inf:{atk:1, def:1}}, unl:["spec"], c:{cash:108, metal:60, rare:93, days:7}},
  tank1:{name:"Composite Armor", fx:{tank:{def:2}}, unl:[], c:{cash:54, metal:20, rare:26, days:4}},
  tank2:{name:"Smoothbore Main Gun", fx:{tank:{atk:3}, ifv:{atk:2}, at:{atk:1}}, unl:[], c:{cash:90, metal:35, rare:57, days:6}},
  tank3:{name:"Turbine Engines", fx:{tank:{spd:2, atk:1}}, unl:[], c:{cash:120, metal:60, rare:95, days:7}},
  art1:{name:"Counter-Battery Radar", fx:{art:{atk:2}}, unl:[], c:{cash:48, metal:20, rare:25, days:4}},
  art2:{name:"Rocket Artillery", fx:{art:{atk:3, def:2}}, unl:["mlrs"], c:{cash:90, metal:35, rare:57, days:6}},
  art3:{name:"Guided Shells", fx:{art:{atk:2, spd:1}}, unl:[], c:{cash:126, metal:60, rare:96, days:8}},
  air1:{name:"Jet Engines", fx:{}, unl:["jet", "int"], c:{cash:72, metal:20, rare:28, days:5}},
  air2:{name:"Precision Munitions", fx:{jet:{atk:2}, int:{atk:2}}, unl:[], c:{cash:108, metal:35, rare:59, days:6}},
  air3:{name:"Stealth Airframes", fx:{jet:{def:3}}, unl:[], c:{cash:156, metal:60, rare:100, days:8}},
  log1:{name:"Motorized Supply", fx:{}, unl:[], c:{cash:66, metal:20, rare:27, days:4}},
  log2:{name:"Combat Engineers", fx:{}, unl:[], c:{cash:78, metal:20, rare:29, days:5}},
  log3:{name:"Field Hospitals", fx:{}, unl:[], c:{cash:102, metal:20, rare:32, days:7}},
  msl1:{name:"Cruise Missiles", fx:{}, unl:["cm"], c:{cash:96, metal:20, rare:31, days:6}},
  msl2:{name:"Ballistic Missiles", fx:{}, unl:["bm"], c:{cash:144, metal:35, rare:64, days:8}},
  msl3:{name:"Anti-Missile Shield", fx:{}, unl:[], c:{cash:132, metal:60, rare:96, days:7}},
  sat1:{name:"Reconnaissance Satellites", fx:{}, unl:[], c:{cash:120, metal:35, rare:61, days:6}},
  nav1:{name:"Naval Gunnery", fx:{frig:{atk:1}, crui:{atk:2}}, unl:[], c:{cash:54, metal:20, rare:26, days:4}},
  nav2:{name:"Carrier Aviation", fx:{}, unl:["carr"], c:{cash:102, metal:20, rare:32, days:7}},
  nav3:{name:"Amphibious Doctrine", fx:{}, unl:[], c:{cash:114, metal:20, rare:34, days:7}},
  asf1:{name:"Air Superiority Fighters", fx:{}, unl:["asf"], c:{cash:114, metal:20, rare:34, days:7}},
  awacs1:{name:"Airborne Early Warning", fx:{}, unl:["awacs"], c:{cash:102, metal:20, rare:32, days:6}},
  mpa1:{name:"Maritime Patrol", fx:{}, unl:["mpa"], c:{cash:84, metal:20, rare:30, days:5}},
  bomb1:{name:"Strategic Bombers", fx:{}, unl:["bomb"], c:{cash:138, metal:20, rare:37, days:8}},
  bomb2:{name:"Strategic Bomber Upgrade", fx:{bomb:{atk:1}}, unl:[], c:{cash:156, metal:35, rare:66, days:8}},
  bomb3:{name:"Stealth Bombers", fx:{}, unl:["stealth"], c:{cash:252, metal:60, rare:113, days:11}},
  drone1:{name:"UAV I \u00b7 Unmanned Recon", fx:{}, unl:["drone"], c:{cash:54, metal:20, rare:26, days:4}},
  uav2:{name:"UAV II \u00b7 Long-Endurance Optics", fx:{drone:{def:1}}, unl:[], c:{cash:66, metal:35, rare:53, days:4}},
  uav3:{name:"UAV III \u00b7 Low-Observable Airframe", fx:{drone:{def:1}}, unl:[], c:{cash:84, metal:60, rare:90, days:5}},
  uav4:{name:"UAV IV \u00b7 Armed UAV", fx:{drone:{atk:3}}, unl:[], c:{cash:102, metal:60, rare:92, days:6}},
  uav5:{name:"UAV V \u00b7 Hunter-Killer", fx:{drone:{atk:2, def:2}}, unl:[], c:{cash:126, metal:60, rare:96, days:7}},
  jam1:{name:"Counter-Drone Jamming", fx:{}, unl:["jam"], c:{cash:48, metal:20, rare:25, days:3}},
  swarm1:{name:"Swarm Drones", fx:{}, unl:["swarm"], c:{cash:72, metal:20, rare:28, days:5}},
  sdrone1:{name:"Strike Drones", fx:{}, unl:["sdrone"], c:{cash:90, metal:20, rare:31, days:6}},
  heli1:{name:"Rotary Wing", fx:{}, unl:["heli"], c:{cash:90, metal:20, rare:31, days:6}},
  para1:{name:"Airborne Forces", fx:{}, unl:["para"], c:{cash:114, metal:20, rare:34, days:7}},
};
const TECH = Object.entries(OLD).map(([id, T]) => ({id, ...T}));
const ref = s => { const [id, l] = s.split('@'); return {id, l:+(l || 1)}; };

// ---------- checks ----------
const errs = [];
for (const n of NODES){
  for (const q of n.req){ const m = BY[q]; if (!m) { errs.push(`${n.id}: unknown prerequisite ${q}`); continue; }
    const same = m.line === n.line, mslLine = m.cat === 'msl' && n.cat === 'msl', stealth = n.id === 'u_stealth';
    if (!same && !mslLine && !stealth) errs.push(`${n.id}: prerequisite ${q} is outside its unit line`);
    if (m.lv[0].day > n.lv[0].day) errs.push(`${n.id}: opens on day ${n.lv[0].day}, before its prerequisite ${q} (day ${m.lv[0].day})`); }
  for (let i = 1; i < n.lv.length; i++) if (n.lv[i].day <= n.lv[i - 1].day) errs.push(`${n.id}: level ${i + 1} does not open after level ${i}`);
  if (n.kind === 'eng' && n.req3 && BY[n.req3].lv[0].day > n.lv[2].day) errs.push(`${n.id}: level 3 opens before generation 2`);
}
for (const T of TECH){ const m = LEGACY[T.id]; if (!m){ errs.push(`today's project ${T.id} has no equivalent`); continue; }
  const got = {}; for (const s of m){ const {id, l} = ref(s), n = BY[id]; if (!n || !n.lv[l - 1]){ errs.push(`${T.id}: no node ${s}`); continue; }
    if (n.u){ const fx = n.lv[l - 1].fx, g = got[n.u] || (got[n.u] = {}); for (const k in fx) g[k] = (g[k] || 0) + fx[k]; } }
  for (const u in T.fx) for (const k in T.fx[u]) if (!((got[u] || {})[k] >= T.fx[u][k])) errs.push(`${T.id}: gives ${u} ${k} +${T.fx[u][k]}, its nodes give ${(got[u] || {})[k] || 0}`);
  for (const u of T.unl) if (UNITS[u] && !m.includes('u_' + u)) errs.push(`${T.id} unlocked ${u}, its nodes do not`); }
for (const u in UNITS){ if (!BY['u_' + u]) errs.push(`unit ${u} has no line`); if (!BY[u + '_pr']) errs.push(`unit ${u} has no Protection node for its Marks`); }
PCT.forEach((p, i) => { if (Math.abs(1 + p/100 - MARK_F[i + 2]) > 0.006) errs.push(`Mark ${i + 2} is x${MARK_F[i + 2]}, level ${i + 1} gives +${p}%`); });

// ---------- totals ----------
const steps = NODES.flatMap(n => n.lv.map((l, i) => ({n, i, l}))).filter(s => !(s.n.std && s.n.kind === 'unlock'));
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
const tot = a => ({steps:a.length, rare:sum(a, s => s.l.c.rare || 0), cash:sum(a, s => s.l.c.cash || 0), metal:sum(a, s => s.l.c.metal || 0), days:sum(a, s => s.l.c.days || 0)});
const lineIds = [...new Set(NODES.map(n => n.cat + '|' + n.line))];
const lineSteps = key => steps.filter(s => s.n.cat + '|' + s.n.line === key);

// ---------- budget simulation: two slots, day gates, prerequisites, rare materials and money as they come in ----------
// A nation follows a list of wanted steps in order (a step waits for its day, its prerequisites, a free slot and the money and rare materials).
// Incomes are the measured ones (tools/headless-style runs of economy-v1, seeds 12345, 7 and 99, AI in every seat, 60 days):
// rare materials a day: poorest 1.6, typical 8.3, richest about 19; money a nation puts into research: about 19 a day typical under today's prices.
const ARCH = [
  {name:'No rare-earth city (2 a day)', rare0:40, rare:2.0*0.75, cash0:150, cash:25},
  {name:'Typical, one rare-earth city (8 a day)', rare0:40, rare:8.3*0.75, cash0:150, cash:40},
  {name:'Rich, two rare-earth cities (18 a day)', rare0:40, rare:18*0.75, cash0:150, cash:80},
];
function simulate(A, want, DAYS){ const lvl = {}, done = []; let rare = A.rare0, cash = A.cash0; const slots = [null, null], Q = want.slice();
  for (const n of NODES) if (n.std && n.kind === 'unlock') lvl[n.id] = 1;
  const open = (s, day) => { const n = s.n; if ((lvl[n.id] || 0) !== s.i) return false; if (s.l.day > day) return false;
    if (n.req.some(q => !lvl[q])) return false; if (n.kind === 'eng' && s.i === 2 && n.req3 && !lvl[n.req3]) return false; return true; };
  for (let h = 0; h < DAYS*24; h++){ const day = 1 + h/24;
    rare += A.rare/24; cash += A.cash/24;
    for (let k = 0; k < 2; k++){ const R0 = slots[k]; if (R0 && --R0.h <= 0){ lvl[R0.s.n.id] = R0.s.i + 1; done.push({s:R0.s, day:Math.ceil(day*10)/10}); slots[k] = null; } }
    for (let k = 0; k < 2; k++){ if (slots[k]) continue;
      const i = Q.findIndex(s => open(s, day) && !slots.some(x => x && x.s === s)); if (i < 0) continue; const s = Q[i];
      if (rare < (s.l.c.rare || 0) || cash < (s.l.c.cash || 0)) break;   // saving for the first wanted step that is open
      rare -= s.l.c.rare || 0; cash -= s.l.c.cash || 0; Q.splice(i, 1); slots[k] = {s, h:Math.max(1, s.l.c.days*24)}; } }
  return {done, left:Q, rare, cash}; }
const stepOf = s => { const {id, l} = ref(s); return steps.find(x => x.n.id === id && x.i === l - 1); };
const lineAll = u => steps.filter(s => s.n.line === u).sort((a, b) => a.l.day - b.l.day);
// plan A: a tank power: four unlocks early, then everything in the Main Battle Tank line. Plan B: an air power: fighters first, then the whole Strike Fighter line.
const plan = (unl, u, extra = []) => [...new Set([...unl.map(stepOf), ...extra, ...lineAll(u)])];
const engOf = (u, l) => ['fp', 'pr'].map(k => stepOf(`${u}_${k}@${l}`));
const PLANS = {
  'Armor power: unlock IFV, Interceptor, Gunship and Rocket Artillery, then the whole Main Battle Tank line':plan(['u_ifv', 'u_int', 'u_heli', 'u_mlrs'], 'tank'),
  'Air power: unlock Interceptor, Strike Fighter, UAV and Air Superiority Fighter, then the whole Strike Fighter line':plan(['u_int', 'u_jet', 'u_drone', 'u_asf'], 'jet'),
  'Hone what you field: no unlocks; Firepower and Protection 1 and 2 for Infantry and Artillery, then the whole Main Battle Tank line':plan([], 'tank', [...engOf('inf', 1), ...engOf('art', 1), ...engOf('inf', 2), ...engOf('art', 2)]),
};
// plan C: research everything, cheapest rare first: how much of the tree a nation can reach
const allCheap = steps.slice().sort((a, b) => a.l.day - b.l.day || (a.l.c.rare || 0) - (b.l.c.rare || 0));

// ---------- output ----------
const cTxt = c => [c.cash ? `$${c.cash}M` : '', c.metal ? `${c.metal} mat` : '', c.iron ? `${c.iron} iron` : '', c.elec ? `${c.elec} elec` : '', c.rare ? `${c.rare} rare` : ''].filter(Boolean).join(', ') || 'free';
const KIND = {unlock:'Unlock', eng:'Levels', kit:'Upgrade', gen:'Generation'};
function md(){ let o = '';
  for (const C of CATS){ const ns = NODES.filter(n => n.cat === C.id), lines = [...new Set(ns.map(n => n.line))];
    o += `\n### ${C.name}\n\n*${C.role}.* Banner picture: \`${C.art}\`.\n\n`;
    // the day grid: one column per line, one row per day that holds a node
    const days = [...new Set(ns.flatMap(n => n.lv.map(l => l.day)))].sort((a, b) => a - b);
    const short = (n, i) => n.kind === 'unlock' ? (n.std ? '(standard)' : 'UNLOCK') : n.kind === 'gen' ? 'GEN ' + n.gen : n.kind === 'eng' ? `${n.name} ${i + 1}` : n.name + (n.lv.length > 1 ? ` ${i + 1}` : '');
    o += `| Day | ${lines.map(l => UNITS[l] ? UNITS[l].name + (BY['u_' + l].elite ? ' (elite)' : '') : l).join(' | ')} |\n|---|${lines.map(() => '---').join('|')}|\n`;
    for (const d of days) o += `| ${d} | ${lines.map(l => ns.filter(n => n.line === l).flatMap(n => n.lv.map((x, i) => x.day === d ? short(n, i) : null).filter(Boolean)).join('; ')).join(' | ')} |\n`;
    for (const l of lines){ const ln = ns.filter(n => n.line === l), U = UNITS[l], t = tot(lineSteps(C.id + '|' + l));
      o += `\n**${U ? U.name : l}**${U && BY['u_' + l].elite ? ' (elite badge)' : ''}: ${t.steps} steps, ${t.rare} rare materials, $${t.cash}M, ${t.days} research days in all.` + (U && BY['u_' + l].fam ? ` Family line (dashed, no requirement) from the ${UNITS[BY['u_' + l].fam].name}.` : '') + '\n\n';
      o += `| Day | Node (id) | Type | Effect | Price | Days |\n|---|---|---|---|---|---|\n`;
      const rows = ln.flatMap(n => n.lv.map((x, i) => ({n, i, x}))).sort((a, b) => a.x.day - b.x.day);
      for (const {n, i, x} of rows){ const need = [...(i === 0 ? n.req.filter(q => !(BY[q].std && BY[q].kind === 'unlock')).map(q => BY[q].name + (BY[q].u && BY[q].u !== n.u ? ` (${UNITS[BY[q].u].name})` : '')) : []), ...(n.kind === 'eng' && i === 2 && n.req3 ? ['generation 2'] : [])];
        o += `| ${x.day} | ${n.name}${n.lv.length > 1 ? ` ${i + 1}/${n.lv.length}` : ''} (\`${n.id}\`)${n.kind === 'gen' ? `, picture \`u-${n.u}-${n.gen}\`` : ''} | ${KIND[n.kind]} | ${x.txt}${need.length ? `. Needs ${need.join(' and ')}` : ''} | ${cTxt(x.c)} | ${x.c.days || '-'} |\n`; } }
  }
  return o; }
function report(){ let o = '';
  const T = tot(steps); o += `Whole tree: ${NODES.length} nodes, ${T.steps} research steps, ${T.rare} rare materials, $${T.cash}M, ${T.metal} materials, ${T.days} research days (${Math.round(T.days/2)} days with both slots never idle).\n`;
  const old = TECH.reduce((s, t) => { s.rare += t.c.rare; s.cash += t.c.cash; s.days += t.c.days; return s; }, {rare:0, cash:0, days:0});
  o += `The tree before the redesign: ${TECH.length} projects, ${old.rare} rare materials, $${old.cash}M, ${old.days} research days.\n\n`;
  o += `| Category | Lines | Steps | Rare materials | Money | Research days |\n|---|---|---|---|---|---|\n`;
  for (const C of CATS){ const a = steps.filter(s => s.n.cat === C.id), t = tot(a); o += `| ${C.name} | ${new Set(a.map(s => s.n.line)).size} | ${t.steps} | ${t.rare} | $${t.cash}M | ${t.days} |\n`; }
  o += `\n| Plan | Nation | Steps done by day 30 | Of the chosen line by day 30 | Line finished on day | Steps done by day 60 |\n|---|---|---|---|---|---|\n`;
  for (const pn in PLANS){ const want = PLANS[pn].filter(Boolean), lineU = want[want.length - 1].n.line, ln = want.filter(s => s.n.line === lineU).length;
    for (const A of ARCH){ const r = simulate(A, want, 60), d30 = r.done.filter(x => x.day <= 30), l30 = d30.filter(x => x.s.n.line === lineU).length, last = r.left.length ? null : Math.max(...r.done.map(x => x.day));
      o += `| ${pn} | ${A.name} | ${d30.length} of ${want.length} | ${l30} of ${ln} (${Math.round(l30/ln*100)}%) | ${last ? Math.ceil(last) : 'not by day 60'} | ${r.done.length} of ${want.length} |\n`; } }
  o += `\n| Everything, as it opens | Steps by day 30 | Steps by day 60 | Share of the tree by day 60 |\n|---|---|---|---|\n`;
  for (const A of ARCH){ const r = simulate(A, allCheap, 60); o += `| ${A.name} | ${r.done.filter(x => x.day <= 30).length} | ${r.done.length} | ${Math.round(r.done.length/steps.length*100)}% |\n`; }
  return o; }

if (errs.length){ console.log('TREE ERRORS\n' + errs.join('\n')); process.exit(1); }
if (process.argv.includes('--md')) console.log(md());
else if (process.argv.includes('--write')){ const f = path.join(ROOT, 'docs', 'RESEARCH.md'); let s = fs.readFileSync(f, 'utf8');
  const put = (tag, body) => { const a = `<!-- ${tag}:BEGIN (written by tools/research-proto.js --write) -->`, b = `<!-- ${tag}:END -->`, i = s.indexOf(a), j = s.indexOf(b); if (i < 0 || j < 0) throw new Error('no ' + tag + ' markers in docs/RESEARCH.md'); s = s.slice(0, i + a.length) + '\n' + body + '\n' + s.slice(j); };
  put('TREE', md()); put('BALANCE', report()); fs.writeFileSync(f, s); console.log('docs/RESEARCH.md updated'); }
else console.log('TREE OK\n' + report());
module.exports = {CATS, NODES, LEGACY, simulate, ARCH, PLANS, steps};
