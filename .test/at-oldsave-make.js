'use strict';
// makes .test/fixtures/at-oldsave.json with MASTER's rules (before BUILD-REQS): a nations-world game, seat 0 (Germany if found), 6 days played,
// then Anti-Tank Infantry everywhere it can be: forces (with wounds), a queued and an in-training unit, a repeat order, its research line
// (levels held, a project running, the computer's pick), and a computer nation saving for it
const fs = require('fs'), path = require('path'), ROOT = process.argv[2] || '/home/user/iron-meridian', OUT = process.argv[3];
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn {IM, UNITS, RN, rGrant, desk, startResearch, recruit, addArmy, get S(){ return S; }, get G(){ return G; }};';
const R = new Function(SRC)(), api = R.IM.api;
if (!R.UNITS.at) throw new Error('these rules have no Anti-Tank Infantry: run against master');
api.useScenario('world64'); api.newGame(4242, 0, []);
let S = R.S; const ger = S.nations.findIndex(N => N.name === 'Germany');
api.newGame(4242, ger, [ger]); S = R.S; const G = R.G; S.started = true;
for (let h = 0; h < 6*24; h++) api.tick();
const me = ger, N = S.nations[me], cap = N.capital;
for (const k of ['cash', 'mp']) N[k] = Math.max(N[k], 2000);
for (const k of ['oil', 'metal', 'iron', 'elec', 'rare']) N[k] = Math.max(N[k], 400000);
// forces: a mixed force with wounded Anti-Tank Infantry, and one of Anti-Tank Infantry alone (its name)
const A = R.addArmy(me, cap, {inf:2, art:1}); A.u.at = 3; A.w.at = 6; A.w.inf = 4;
const B = R.addArmy(me, cap, {}); B.u.at = 2; B.w.at = 0; B.nm = '9th Anti-Tank Brigade';
// production: an Army Base, then Anti-Tank Infantry queued behind infantry, and a repeat order
api.setMember(me, true); S.bld[cap].fac = Math.max(1, S.bld[cap].fac); S.queue[cap].length = 0; S.cons[cap] = null;
if (!R.recruit(me, cap, 'at')) throw new Error('could not recruit at'); if (!R.recruit(me, cap, 'inf')) throw new Error('could not recruit inf');
S.queue[cap][0].h = 12;   // part trained
const c2 = G.P.find(P => S.owner[P.id] === me && P.city && P.id !== cap); S.bld[c2.id].fac = Math.max(1, S.bld[c2.id].fac); S.queue[c2.id].length = 0; R.recruit(me, c2.id, 'at');
(R.desk(me).repeat || (R.desk(me).repeat = {}))[cap] = 'at';
// research: Ceramic Body Armour 1 (infantry has none), Firepower 2 (infantry 3), Protection 2 (infantry none), Tandem Warheads 2, Guided Missile Teams
N.tech.inf_armor = 0; delete N.tech.inf_armor; R.rGrant(N, 'at_armor', 1); R.rGrant(N, 'inf_fp', 3); R.rGrant(N, 'at_fp', 2); R.rGrant(N, 'at_pr', 2); R.rGrant(N, 'at_eye', 1); R.rGrant(N, 'at_g2', 1);
N.research = null; N.research2 = null; if (!R.startResearch(me, 'at_warhead')) throw new Error('could not start at_warhead');
N.rPick = {id:'at_g2', until:S.hour + 24};
// a computer nation saving for one
const ai = S.nations.find(M => M.id !== me && M.alive); ai.uSave = {t:'at', until:S.hour + 24};
const js = api.saveJSON(); fs.writeFileSync(OUT, js);
const o = JSON.parse(js), cnt = {u:0, q:0};
for (const a of o.armies) cnt.u += (a.u && a.u.at) || 0; for (const q of Object.values(o.queue.at || o.queue)) if (Array.isArray(q)) for (const it of q) if (it.t === 'at') cnt.q++;
console.log('wrote', OUT, js.length, 'bytes; seat', me, N.name, 'hour', S.hour, 'at units in forces', cnt.u, 'tech', JSON.stringify(Object.fromEntries(Object.entries(N.tech).filter(([k]) => /^at_|^inf_/.test(k)))), 'slot', JSON.stringify(N.research || N.research2));
