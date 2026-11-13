// AI war audit (owner's rule: the AI never starts a war, it only fights back). Plain Node, no browser, like tools/headless.js.
// Plays N days (default 30) of both worlds (classic 15 powers, the 68-nations world) for 3 seeds, all computer, and counts every war that starts and who
// started it: 'ai' (a computer nation declared or attacked unprovoked: diploDay, blocDay, a chat answer), 'ally' (an ally of the attacked joins), 'bloc'
// (a coalition member joins against the coalition's enemy), 'seat' (a person's nation). Also: wars at the end, provinces that changed hands, nations alive.
// --provoke: a seat (Germany in the classic world, the United States in the nations world) declares war on a neighbour on day 2 and gives no other orders:
// the attacked nation must fight back (its forces enter the seat's land) and its allies may join; still no war started by the AI.
// --mass: the nations world, the United States a seat: the strongest neighbour's power on the US border on day 5, and the 'is massing' warnings in 30 days.
//   node .test/ai-wars.js [--days 30] [--seeds 3] [--provoke] [--mass] [--json]
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
const has = k => process.argv.includes('--' + k), arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] !== undefined ? +process.argv[i + 1] : d; };
const DAYS = arg('days', 30), SEEDS = [12345, 7, 2026].slice(0, arg('seeds', 3));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
// instrumentation: every change of a relation to 'war' is recorded with the function that caused it (the rules' own bindings are wrapped, so internal calls are seen)
const PATCH = `
const __W = []; let __ctx = [];
{ const _sr = setRel; setRel = function(a, b, st, ...r){ const was = rel(a, b).st; const out = _sr(a, b, st, ...r); if (st === 'war' && was !== 'war') __W.push({a, b, h:S.hour, ctx:__ctx.slice()}); return out; };
  const wrap = (nm, f) => function(...x){ __ctx.push(nm + ':' + x.slice(0, 2).join(',')); try { return f.apply(this, x); } finally { __ctx.pop(); } };
  declareWar = wrap('declareWar', declareWar); surpriseWar = wrap('surpriseWar', surpriseWar); startWar = wrap('startWar', startWar);
  diploDay = wrap('diploDay', diploDay); blocDay = wrap('blocDay', blocDay); aiReply = wrap('aiReply', aiReply); }`;
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + PATCH + '\nreturn {IM, __W, isSeat, rel, atWar, borders, power, get AI_STARTS_WARS(){ try { return AI_STARTS_WARS; } catch (e) { return undefined; } }};';

function kindOf(w, isSeat){ const c = w.ctx, top = c[c.length - 1] || '';
  const main = (nm, x) => x.startsWith(nm + ':') && (([p, q]) => (+p === w.a && +q === w.b) || (+p === w.b && +q === w.a))(x.split(':')[1].split(','));
  if (!(main('startWar', top) || main('surpriseWar', top))) return top.startsWith('startWar') || top.startsWith('surpriseWar') ? 'ally' : 'other:' + top;
  const by = +top.split(':')[1].split(',')[0];
  if (isSeat(by)) return 'seat'; if (c.some(x => x.startsWith('blocDay'))) return 'bloc'; if (c.some(x => x.startsWith('aiReply'))) return 'chat'; return 'ai'; }

function play(scn, seed, opt = {}){ const R = new Function(SRC)(), api = R.IM.api; let massMsg = 0, massTexts = [];
  R.IM.on('log', (me, t) => { t = String(t || ''); if (/is massing/.test(t)){ massMsg++; if (massTexts.length < 3) massTexts.push(`day ${Math.floor(api.S.hour/24) + 1}: ${t}`); } });
  api.useScenario(scn); const nm = s => api.S.nations.findIndex(N => N.name === s);
  // a seat: pick it by name after a throwaway start (indices differ between the worlds)
  let seat = -1; if (opt.seat){ api.newGame(seed, 0, []); seat = api.S.nations.findIndex(N => N.name === opt.seat); }
  api.newGame(seed, 0, seat >= 0 ? [seat] : []); const S = api.S, G = api.G; S.started = true;
  let provokedTo = -1, mass5 = null, enter = 0;
  for (let h = 0; h < DAYS*24 && !S.over; h++){ api.tick();
    if (opt.provoke && seat >= 0 && S.hour === 48){ const nb = S.nations.filter(N => N.alive && N.id !== seat && R.borders(seat, N.id)).sort((x, y) => x.id - y.id); provokedTo = nb.length ? nb[0].id : -1; if (provokedTo >= 0) api.declareWar(seat, provokedTo); }
    if (provokedTo >= 0 && S.armies.some(a => a.owner === provokedTo && S.owner[a.at] === seat && !a.air)) enter++;
    if (opt.mass && S.hour === 5*24){ const border = G.P.filter(P => !P.sea && S.owner[P.id] === seat && P.nbs.some(v => S.owner[v] >= 0 && S.owner[v] !== seat)), m = new Map();
      for (const x of S.armies){ if (x.owner < 0 || x.owner === seat || x.air) continue; if (border.some(P => P.nbs.includes(x.at) || P.id === x.at)) m.set(x.owner, (m.get(x.owner) || 0) + R.power(x)); }
      mass5 = [...m.entries()].sort((x, y) => y[1] - x[1]).slice(0, 3).map(([o, pw]) => `${S.nations[o].name} ${Math.round(pw)}`).join(', '); } }
  const kinds = {}; for (const w of R.__W){ const k = kindOf(w, R.isSeat); kinds[k] = (kinds[k] || 0) + 1; }
  const first = R.__W.filter(w => kindOf(w, R.isSeat) === 'ai').slice(0, 3).map(w => `d${Math.floor(w.h/24) + 1} ${S.nations[w.a].name}>${S.nations[w.b].name}`);
  // provinces that changed hands: taken from a nation (it held it at the start) / independent land taken by a nation
  let changed = 0, taken = 0, indep = 0; for (let p = 0; p < S.owner.length; p++){ if (!S.own0 || G.P[p].sea || S.owner[p] === S.own0[p]) continue; changed++; if (S.own0[p] >= 0) taken++; else if (S.owner[p] >= 0) indep++; }
  let warsNow = 0; for (const k in S.rel) if (S.rel[k] && S.rel[k].st === 'war') warsNow++;
  const alive = S.nations.filter(N => N.alive).length;
  return {scn, seed, flag:R.AI_STARTS_WARS, started:R.__W.length, kinds, ai:kinds.ai || 0, warsNow, changed, taken, indep, alive, of:S.nations.length, first, provokedTo:provokedTo >= 0 ? S.nations[provokedTo].name : null, enterHours:enter, mass5, massMsg, massTexts, over:S.over || null}; }

const rows = [];
if (has('mass')){ for (const seed of SEEDS){ const r = play('world64', seed, {seat:'United States', mass:true}); rows.push(r); console.log(`mass  nations seed ${seed}: border power day 5 ${r.mass5}; 'is massing' warnings in ${DAYS} days ${r.massMsg}${r.massTexts.length ? '\n   ' + r.massTexts.join('\n   ') : ''}  (AI wars ${r.ai}, all ${r.started})`); } }
else for (const scn of ['world', 'world64']) for (const seed of SEEDS){
  const r = play(scn, seed, has('provoke') ? {seat:scn === 'world' ? 'Germany' : 'United States', provoke:true} : {}); rows.push(r);
  console.log(`${scn === 'world' ? 'classic' : 'nations'} seed ${String(seed).padEnd(5)} AI_STARTS_WARS=${r.flag}  wars started ${String(r.started).padStart(3)} (by AI unprovoked ${r.ai}; ${JSON.stringify(r.kinds)})  wars at end ${String(r.warsNow).padStart(3)}  provinces changed hands ${String(r.changed).padStart(4)} (from nations ${String(r.taken).padStart(3)}, independent land ${String(r.indep).padStart(3)})  nations alive ${r.alive}/${r.of}${r.provokedTo ? `  provoked ${r.provokedTo}: its forces in the seat's land ${r.enterHours} h` : ''}${r.first.length ? '  first: ' + r.first.join('; ') : ''}${r.over ? '  over ' + r.over : ''}`); }
if (has('json')) console.log(JSON.stringify(rows));
const bad = rows.reduce((s, r) => s + r.ai, 0); if (has('strict') && bad) { console.log(`FAIL: ${bad} wars started by the AI unprovoked`); process.exit(1); }
