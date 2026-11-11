// Seats (rules split repair): the rules take any nation, or several, as the seats. Plain Node, no browser.
//   node .test/seats.js [days=12]
// 1. two seats (nations 2 and 5) that give no orders: the AI leaves both alone, each gets its own dispatches and records (desk), fog of war is per nation
// 2. a seat gives orders through the same functions the page uses, with its nation as the first argument
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn IM;';
const days = +(process.argv[2] || 12), errors = [], ok = (c, msg) => { if (!c) errors.push(msg); };
const IM = new Function(SRC)(), api = IM.api, told = {}, cues = {};
IM.on('log', n => { told[n] = (told[n] || 0) + 1; }); IM.on('sfx', n => { cues[n] = (cues[n] || 0) + 1; });
api.newGame(4242, 0, [2, 5]); const S = api.S, G = api.G; S.started = true;
ok(api.seats().join() === '2,5', 'seats are 2 and 5: ' + api.seats().join());
ok(api.desk(2) === S && api.desk(5) !== S && api.desk(5) === S.desks[5], 'first seat keeps its records on S, the second in S.desks');
const army0 = n => S.armies.filter(a => a.owner === n).map(a => a.at + ':' + JSON.stringify(a.u)).join('|');
const before = {2:army0(2), 5:army0(5)}, q0 = [2, 5].map(n => S.queue.filter((q, p) => S.owner[p] === n && q.length).length);
for (let i = 0; i < 48; i++) api.tick();
ok(army0(2) === before[2] && army0(5) === before[5], 'the AI did not move or build for the seats in two days');
ok(S.queue.every((q, p) => !q.length || (S.owner[p] !== 2 && S.owner[p] !== 5)), 'the AI queued nothing for the seats');
ok(S.armies.some(a => a.owner === 3 && (a.path.length || a.to !== null)) || S.queue.some((q, p) => q.length && S.owner[p] === 3), 'the AI does play nation 3');
// orders by nation: seat 5 recruits, posts a market offer, opens a trade route, splits and moves a force
const cap = S.nations[5].capital, a5 = S.armies.find(a => a.owner === 5 && a.at === cap && !a.air);
ok(api.recruit(5, cap, 'inf') === true && S.queue[cap].length === 1, 'seat 5 recruits in its capital');
ok(api.postOffer(5, 'oil', 10, 3) === 10 && api.postOffer(5, 'oil', 0, 3) === 0 && S.book.some(o => o.seller === 5), 'seat 5 posts an offer');
const got = api.fillOffer(2, S.book.find(o => o.seller === 5).id, 4); ok(got === 4, 'seat 2 buys 4 from seat 5: ' + got);
const half = api.splitArmy(a5, [G.P[cap].x + 3, G.P[cap].y]); ok(half && half.owner === 5 && Array.isArray(half.pos), 'seat 5 splits a force; the new one stands beside the given spot');
const nb = G.P[cap].nbs.find(v => !G.P[v].sea && S.owner[v] === 5); if (nb != null){ api.orderMove(half, nb); ok(half.path.length > 0, 'seat 5 moves the new force'); }
// fog of war per nation
const v2 = api.visibleSet(2), v5 = api.visibleSet(5), v3 = api.visibleSet(3);
ok(v2 !== v5 && v2.n === 2 && v5.n === 5, 'each nation has its own fog-of-war set');
ok(v2.has(S.nations[2].capital) && !v2.has(S.nations[5].capital) && v5.has(S.nations[5].capital) && v3.has(S.nations[3].capital), 'a nation sees its own capital, not another seat\'s far away');
const mine = S.armies.find(a => a.owner === 5 && !a.air); ok(api.armyVisible(mine, v5) && !api.armyVisible(mine, v2), 'seat 5 sees its force, seat 2 does not');
let err = null; try { for (let i = 0; i < days*24 && !S.over; i++) api.tick(); } catch (e){ err = e.stack; }
ok(!err, 'ticks ran: ' + err);
ok(told[2] > 0 && told[5] > 0 && Object.keys(told).every(n => n === '2' || n === '5'), 'dispatches went to the seats only: ' + JSON.stringify(told));
ok(S.log.length > 0 && S.desks[5].log.length > 0 && S.log[S.log.length - 1].text.startsWith(S.nations[2].name) && S.desks[5].log[S.desks[5].log.length - 1].text.startsWith(S.nations[5].name), 'each seat has its own dispatch list');
ok((S.papers || []).length > 0 && (S.desks[5].papers || []).length > 0 && (S.stats || {}).peakArmy > 0 && (S.desks[5].stats || {}).peakArmy > 0, 'each seat has its own papers and statistics');
const back = JSON.parse(api.saveJSON()); ok(back.desks && back.desks[5] && back.nations[5].ai === false && back.nations[2].ai === false && back.nations[0].ai === true, 'the save keeps the seats and their records');
console.log(JSON.stringify({day:S.hour/24, seats:api.seats(), told, cues, log2:S.log.length, log5:S.desks[5].log.length, over:S.over, errors}, null, 1));
process.exit(errors.length ? 1 : 0);
