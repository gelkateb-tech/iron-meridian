// The owner's rule "the AI never starts a war, but it fights back fully" (rules/diplomacy.js AI_STARTS_WARS), rules only, no browser (seconds):
//  1. computer nations that hate a weak neighbour and are far stronger still declare nothing over 40 days of diplomacy (diploDay, blocDay)
//  2. a seat declares war on a computer nation: the war is the seat's (rel.by), the victim's ally with a good opinion joins it as a defender
//  3. a coalition: its members join a war the common enemy started against one of them (as defenders); never one a member started
//  4. asked in a message to help, a computer ally joins only against a nation that attacked the asker; otherwise it refuses
//  5. old saves: a computer nation's pending declaration is dropped, a seat's starts its war; a war without a record of its attacker stays
//  6. the attacked nation fights back: within 10 days its forces stand in the attacker's land (the classic world, Germany attacks France)
//  7. the border advisor does not report a computer nation at peace as massing
// node .test/ai-nowar.js   (exit 1 on any failed check or error)
const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..');
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + `\nreturn {IM, get S(){ return S; }, get G(){ return G; }, AI_STARTS_WARS, rel, setRel, atWar, warBy, declareWar, diploDay, diploHour, blocs, blocDay,
  aiReply, addMem, opinion, borders, tick, alliesOf, daily, addArmy};`;
const errors = [], checks = {}, ok = (k, v, i) => { checks[k] = v ? 'PASS' : 'FAIL ' + JSON.stringify(i ?? null); };
const run = (k, f) => { try { f(); } catch (e){ errors.push(k + ': ' + e.stack.split('\n').slice(0, 3).join(' | ')); } };
// (seats by name: 'Germany' is the seat of most checks; the classic world's 15 powers have the same index in both worlds)
function game(scn, seats = []){ const R = new Function(SRC)(); R.IM.api.useScenario(scn); R.IM.api.newGame(4242, 0, []); const ix = seats.map(nm => R.S.nations.findIndex(N => N.name === nm));
  if (ix.some(i => i < 0)) throw new Error('no nation ' + seats); if (ix.length){ R.IM.api.newGame(4242, 0, ix); } R.S.started = true; return R; }
const id = (R, nm) => { const i = R.S.nations.findIndex(N => N.name === nm); if (i < 0) throw new Error('no nation ' + nm); return i; };
const wars = R => Object.keys(R.S.rel).filter(k => R.S.rel[k].st === 'war');

run('flag', () => { const R = game('world'); ok('AI_STARTS_WARS is false', R.AI_STARTS_WARS === false); });
// 1. hatred and power do not start a war
run('no war', () => { for (const scn of ['world', 'world64']){ const R = game(scn), S = R.S;
    for (const A of S.nations) for (const B of S.nations) if (A.id !== B.id) R.addMem(A.id, B.id, -100);   // everyone hates everyone
    for (let d = 0; d < 40; d++){ S.hour += 24; R.diploDay(); R.diploHour(); }
    ok(`${scn}: 40 days of diplomacy with every nation hating every other: no war`, wars(R).length === 0, wars(R).slice(0, 5)); } });
// 2. a seat attacks: the war is the seat's; the victim's ally joins as a defender
run('ally', () => { const R = game('world', ['Germany']), S = R.S, ME = id(R, 'Germany'), fr = id(R, 'France'), it = id(R, 'United Kingdom');
  R.setRel(fr, it, 'ally'); R.addMem(it, fr, 80); R.declareWar(ME, fr);
  ok('the war is the seat\'s (attacker recorded)', R.atWar(ME, fr) && R.warBy(ME, fr) === ME, R.rel(ME, fr));
  ok('the victim\'s ally joins against the attacker, as a defender', R.atWar(it, ME) && R.warBy(it, ME) === ME, R.rel(it, ME));
  ok('the dispatch says it honours its alliance', S.log.some(e => /United Kingdom honours its alliance/.test(e.text)), S.log.slice(0, 4).map(e => e.text)); });
// 3. coalitions: defensive only
run('bloc', () => { const R = game('world', ['Germany']), S = R.S, ME = id(R, 'Germany'), fr = id(R, 'France'), it = id(R, 'United Kingdom');
  // (a) France and the United Kingdom in a coalition (opinion too low for the alliance call), the seat attacks France: the UK joins within 30 days as a defender
  R.setRel(fr, it, 'ally'); R.addMem(it, fr, -100); R.declareWar(ME, fr); const joinedNow = R.atWar(it, ME);
  let d = 0; for (; d < 30 && !R.atWar(it, ME); d++){ S.hour += 24; R.blocDay(); }
  ok('a coalition member joins the war the common enemy started (defender)', !joinedNow && R.atWar(it, ME) && R.warBy(it, ME) === ME, {joinedNow, d, rel:R.rel(it, ME)});
  // (b) the seat in a coalition with Turkey, the seat attacks France: its computer partner never joins
  const R2 = game('world', ['Germany']), S2 = R2.S, me2 = id(R2, 'Germany'), es = id(R2, 'Turkey'), tgt = id(R2, 'France');
  R2.setRel(me2, es, 'ally'); R2.addMem(es, me2, 100); R2.declareWar(me2, tgt);
  for (let k = 0; k < 40; k++){ S2.hour += 24; R2.blocDay(); }
  ok('a computer partner never joins a war its partner started', !R2.atWar(es, tgt) && R2.blocs().length === 1, R2.rel(es, tgt)); });
// 4. a message asking for help
run('chat', () => { const R = game('world', ['Germany']), S = R.S, ME = id(R, 'Germany'), fr = id(R, 'France'), it = id(R, 'Turkey'), ru = id(R, 'Russia');
  R.setRel(ME, it, 'ally'); R.addMem(it, ME, 100);
  R.declareWar(ME, fr); let a1 = ''; for (let i = 0; i < 20 && !R.atWar(it, fr); i++) a1 = R.aiReply(ME, it, 'help us attack them');
  ok('an ally will not join a war the asker started', !R.atWar(it, fr), a1);
  R.setRel(ru, ME, 'war', null, ru);   // Russia attacked the seat (set by hand: the computer starts no war)
  let a2 = ''; for (let i = 0; i < 40 && !R.atWar(it, ru); i++) a2 = R.aiReply(ME, it, 'help us attack them');
  ok('an ally joins against a nation that attacked the asker', R.atWar(it, ru) && R.warBy(it, ru) === ru, a2);
  const R2 = game('world', ['Germany']), me2 = id(R2, 'Germany'), en = id(R2, 'United Kingdom'); R2.addMem(en, me2, 100); R2.setRel(id(R2, 'Russia'), me2, 'war', null, id(R2, 'Russia'));
  let a3 = ''; for (let i = 0; i < 20; i++) a3 = R2.aiReply(me2, en, 'help us attack them');
  ok('a friendly nation that is no ally does not join', !R2.atWar(en, id(R2, 'Russia')), a3); });
// 5. old saves
run('old saves', () => { const R = game('world', ['Germany']), S = R.S, ME = id(R, 'Germany'), fr = id(R, 'France'), it = id(R, 'United Kingdom'), ru = id(R, 'Russia'), cn = id(R, 'China');
  S.decl.push({by:fr, to:it, h:S.hour}, {by:ME, to:ru, h:S.hour}); S.rel[[cn, ru].sort((a, b) => a - b).join(',')] = {st:'war', since:0, until:null};
  R.diploHour();
  ok('a computer nation\'s pending declaration is dropped', !R.atWar(fr, it) && !S.decl.length);
  ok('a seat\'s pending declaration starts its war', R.atWar(ME, ru) && R.warBy(ME, ru) === ME);
  ok('an old war without its attacker on record goes on', R.atWar(cn, ru) && R.warBy(cn, ru) === -1); });
// 6. fighting back
run('fight back', () => { const R = game('world', ['Germany']), S = R.S, ME = id(R, 'Germany'), fr = id(R, 'France'); R.declareWar(ME, fr);
  let h = 0, inGer = 0; for (; h < 240; h++){ R.tick(); if (S.armies.some(a => a.owner === fr && !a.air && S.owner[a.at] === ME)) inGer++; }
  const took = S.owner.filter((o, p) => o === fr && S.own0[p] === ME).length;
  ok('the attacked nation fights back in the attacker\'s land', inGer > 0, {inGer, took});
  ok('no other war started meanwhile', wars(R).length === 1, wars(R)); });
// 7. the advisor
run('advisor', () => { const R = game('world64', ['United States']), S = R.S, me = id(R, 'United States'), nb = S.nations.find(N => N.id !== me && R.borders(me, N.id));
  if (!nb){ ok('a neighbour to test with', false); return; }
  const P = R.G.P.find(q => !q.sea && S.owner[q.id] === nb.id && q.nbs.some(v => S.owner[v] === me));
  S.log.length = 0; S.warn = {}; for (let d = 0; d < 6; d++){ R.addArmy(nb.id, P.id, {tank:12, inf:20}); S.hour += 24; R.daily(); }
  ok('a computer nation at peace with a big force on the border is not reported as massing', !S.log.some(e => /massing/.test(e.text)), S.log.filter(e => /massing/.test(e.text)).map(e => e.text)); });

console.log(JSON.stringify(checks, null, 1)); console.log('ERRORS', errors.length ? errors : 'none');
const bad = Object.values(checks).filter(v => v !== 'PASS').length + errors.length; console.log(bad ? 'AI-NOWAR FAIL' : 'AI-NOWAR OK'); process.exit(bad ? 1 : 0);
