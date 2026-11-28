// Diplomacy rules for the new screens (rules/dealings.js), plain Node, no browser:
//   node .test/dealings.js
// leaders, people and the dev-only pretend player, mute and friends, threads and unread counts, the trade engine (every check, the computer's
// answers and counters, deterministic), deals between two seats (offer, accept, decline, withdraw, expiry), territory inside a deal, treaties
// to people, the actions moved from the page, the screen's readers writing nothing, and old saves loading.
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n')
  + '\nreturn {IM, LEADERS, NATIONS, WORLD_POWERS, TERR, DEV, leaderOf, personOf, isPerson, seatInfo, muteSet, isMuted, friendSet, friendsOf, markRead, msgSend, say, dealNorm, dealWhy, dealAnswer, dealValue,'
  + ' dealPreview, relRows, dealPropose, dealApply, offerAct, offerSeat, aiProposeTrade, relView, relInfo, relMenu, relAct, natStatsAll, knownArmy, warList, offersWith, threads, threadView, unreadAll, treatyPropose,'
  + ' giftCash, payTribute, blocRename, blocLeave, embargoAct, embargoed, setRel, rel, atWar, opinion, addMem, emptySide, desk, terrMin, terrWant, terrWhyNot, provValue, isCapital, devPerson, devWrite, devOffer, devAnswer,'
  + ' dealHour, declareWar, addArmy, NEUTRAL, RES_K, mkt, tick};';
const SUM = [], errors = [], ok = (c, msg) => { if (!c) errors.push(msg); }, R = new Function(SRC)(), api = R.IM.api;
const toasts = []; R.IM.on('toast', (n, why) => toasts.push(n + ':' + why));
api.newGame(4242, 0, [0, 5]); let S = api.S; const G = api.G; S.started = true;
const US = 0, CA = 1, DE = 5, nm = p => G.P[p].cityName || G.P[p].name;
const side = (o = {}) => ({...R.emptySide(), ...o}), deal = (give = {}, get = {}, treaty = []) => ({give:side(give), get:side(get), treaty});
const take = (p, to) => { S.owner[p] = to; S.occ[p] = S.hour; S.mor[p] = 25; S.cap[p] = null; S.queue[p] = []; S.cons[p] = null; };

// 1. leaders: every nation of both worlds has an invented one; nothing from the reference screenshots in the source
{ const all = [...R.NATIONS.nations.map(n => n.name), ...R.WORLD_POWERS.map(p => p.name)], miss = all.filter(n => !R.LEADERS[n]);
  ok(!miss.length, 'every nation has a leader: missing ' + miss.join(', '));
  ok(new Set(Object.values(R.LEADERS)).size === Object.keys(R.LEADERS).length, 'leader names are all different');
  ok(R.leaderOf(CA) === R.LEADERS[S.nations[CA].name], 'leaderOf: ' + R.leaderOf(CA));
  const src = fs.readFileSync(path.join(ROOT, 'rules/dealings.js'), 'utf8');
  for (const bad of ['PatryNostra', 'KumboKumbo', 'Alexander356bc', 'FELPZI1N', 'Hansdaniel', 'user6281493', 'Napoleon.']) ok(!src.includes(bad), 'reference name not used: ' + bad); }

// 2. people: seats are people, computer nations are not; names and mottos are cleaned; the dev switch makes a pretend person
ok(R.isPerson(US) && R.isPerson(DE) && !R.isPerson(CA), 'seats are people, computer nations not');
ok(R.seatInfo(US, {name:'  <b>Iron</b>  Duke with a very long name indeed  ', motto:'Hold\nfast'}) && R.personOf(US).name.length <= 24 && !/[<>]/.test(R.personOf(US).name), 'name cleaned: ' + R.personOf(US).name);
ok(R.personOf(US).motto === 'Hold fast', 'motto cleaned: ' + R.personOf(US).motto);
ok(!R.seatInfo(US, {name:'   '}), 'an empty name is refused');
ok(!R.seatInfo(CA, {name:'X'}), 'a computer nation has no person to set');
ok(R.devPerson(CA, true) && R.isPerson(CA) && R.personOf(CA).dev && !['PatryNostra'].includes(R.personOf(CA).name), 'dev switch: Canada played by ' + R.personOf(CA).name);
ok(S.nations[CA].ai === true, 'the AI keeps playing the pretend person');
R.devPerson(CA, false); ok(!R.isPerson(CA), 'dev switch off');

// 3. friends and mute
ok(R.friendSet(US, 'local:5', true) && R.friendsOf(US).includes('local:5'), 'friend added');
ok(R.friendSet(US, 'local:5', false) && !R.friendsOf(US).length, 'friend removed');
ok(!R.muteSet(US, CA, true), 'a computer nation cannot be muted');
{ ok(R.msgSend(DE, US, 'hello there').ok, 'seat writes to seat'); ok((S.unread || {})[DE] === 1, 'one unread for the US: ' + JSON.stringify(S.unread));
  ok(R.threadView(DE, US).items.some(e => e.text === 'hello there' && e.mine), 'the sender sees it in its own thread');
  R.markRead(US, DE); ok(!S.unread[DE], 'read');
  ok(R.muteSet(US, DE, true) && R.isMuted(US, DE), 'muted');
  R.msgSend(DE, US, 'spam'); ok(!S.unread[DE], 'a muted person adds nothing unread');
  ok(R.threadView(US, DE).items.length === 0 && R.threadView(US, DE).muted, 'muted thread hides messages');
  ok(R.unreadAll(US) === 0, 'muted people left out of the badge');
  R.muteSet(US, DE, false); ok(R.threadView(US, DE).items.some(e => e.text === 'spam'), 'unmuted: the messages are back'); }

// 4. a message to a computer nation: answered at once, nothing left unread
{ const r = R.msgSend(US, CA, 'Hello'); ok(r.ok && typeof r.reply === 'string' && r.reply.length > 0, 'computer reply: ' + r.reply);
  ok(!(S.unread || {})[CA], 'its reply is read'); ok(R.threadView(US, CA).items.length === 2, 'two messages in the thread');
  ok(!R.msgSend(US, CA, '   ').ok, 'an empty message is not sent'); }

// 5. deal checks (dealWhy)
const caBorder = G.P.filter(P => !P.sea && S.owner[P.id] === CA && !R.isCapital(P.id) && P.nbs.some(v => S.owner[v] === US));
const cCity = caBorder.filter(P => P.city).map(P => P.id), cLand = caBorder.filter(P => !P.city).map(P => P.id);
ok(cCity.length >= 2 && cLand.length >= 1, 'Canadian border provinces');
const [p1, p2] = cCity, q1 = cLand[0]; for (const p of [p1, p2, q1]) take(p, US);
const usHome = G.P.find(P => !P.sea && S.owner[P.id] === US && !R.isCapital(P.id) && S.home[P.id] === US && P.id !== p1).id;
const W = (D, a = US, b = CA) => R.dealWhy(a, b, R.dealNorm(D));
ok(/zero or more/.test(W(deal({cash:-5}))), 'negative money refused: ' + W(deal({cash:-5})));
ok(/zero or more/.test(W(deal({oil:NaN}))), 'not-a-number refused');
ok(/empty/.test(W(deal())), 'empty deal refused');
ok(/not have/.test(W(deal({cash:1e9}))), 'more money than you have refused: ' + W(deal({cash:1e9})));
ok(/never sells land/.test(W(deal({cash:50}, {provs:[S.nations[CA].capital]}))), 'a computer nation never sells land');
ok(/home country/.test(W(deal({provs:[usHome]}, {cash:20}))), 'home land is never sold: ' + W(deal({provs:[usHome]}, {cash:20})));
ok(/twice/.test(W(deal({provs:[p1, p1]}, {cash:500}))), 'a province twice refused');
ok(/lowest price/.test(W(deal({provs:[p1]}, {cash:1}))), 'under the floor refused: ' + W(deal({provs:[p1]}, {cash:1})));
ok(W(deal({provs:[p1]}, {cash:R.terrMin(US, CA, p1)})) === null, 'at the floor allowed: ' + W(deal({provs:[p1]}, {cash:R.terrMin(US, CA, p1)})));
ok(/not at war/.test(W(deal({}, {}, ['peace']))), 'no ceasefire when not at war');
R.setRel(US, CA, 'war', null, US);
ok(/during a war/.test(W(deal({provs:[p1]}, {cash:20}))), 'no land during a war: ' + W(deal({provs:[p1]}, {cash:20})));
ok(/ceasefire comes first/.test(W(deal({}, {}, ['peace', 'nap']))), 'a ceasefire comes alone');
ok(/at war/.test(W(deal({}, {}, ['nap']))), 'no NAP at war');
R.setRel(US, CA, 'peace');
{ const M = R.mkt(); M.emb[US + '>' + CA] = 1; ok(/embargo/.test(W(deal({cash:10}))), 'no money or goods under an embargo'); ok(W(deal({}, {}, ['nap'])) === null, 'a treaty under an embargo is fine'); delete M.emb[US + '>' + CA]; }
{ S.terr = S.terr || {offers:[], lock:{}, log:[]}; S.terr.lock[p2] = {by:US, until:S.hour + 30}; ok(/resold/.test(W(deal({provs:[p2]}, {cash:20}))), 'a locked province refused'); delete S.terr.lock[p2]; }

// 6. the computer's answers: deterministic, pure (no state change), accept / counter / decline
{ const before = api.saveJSON();
  const good = deal({cash:120}, {oil:R.RES_K}), a1 = R.dealAnswer(US, CA, good), a2 = R.dealAnswer(US, CA, good);
  ok(a1.act === 'accept' && JSON.stringify(a1) === JSON.stringify(a2), 'a generous deal is accepted, the same answer twice: ' + a1.act + ' ' + a1.why);
  const silly = deal({}, {cash:2000}), a3 = R.dealAnswer(US, CA, silly);
  ok(a3.act === 'decline' && /serious|not have/.test(a3.why), 'a silly deal is declined: ' + a3.why);
  const near = deal({cash:10}, {oil:4*R.RES_K}), a4 = R.dealAnswer(US, CA, near);
  ok(a4.act === 'counter' || a4.act === 'accept', 'a near deal is countered (or accepted): ' + a4.act + ' ' + a4.why);
  if (a4.act === 'counter') ok(R.dealValue(US, CA, a4.D).v >= 10, 'its counter is one it would sign: ' + R.dealValue(US, CA, a4.D).v);
  ok(R.dealAnswer(US, CA, near, 6).act === 'decline' || a4.act === 'accept', 'round 6: no more counters');
  SUM.push(`near deal: ${a4.act} (${a4.why})`);
  const pv = R.dealPreview(US, CA, good); ok(pv.verdict === 'accept' && /accept/i.test(pv.text), 'preview: ' + pv.text);
  ok(api.saveJSON() === before, 'dealAnswer and dealPreview change nothing'); }

// 7. a deal with a computer nation: accepted at once (money moves), or a counter-offer to answer
{ const c0 = S.nations[US].cash, o0 = S.nations[US].oil, r = R.dealPropose(US, CA, deal({cash:120}, {oil:R.RES_K}));
  ok(r.ok && r.act === 'accept' && Math.abs(S.nations[US].cash - (c0 - 120)) < 1e-6 && S.nations[US].oil > o0, 'accepted and carried out: ' + JSON.stringify(r));
  const th = R.threadView(US, CA); ok(th.items.some(e => e.t === 'offer' && e.st === 'accepted') && th.items.some(e => e.t === 'sys' && e.k === 'trade'), 'proposal card accepted, system card');
  const r2 = R.dealPropose(US, CA, deal({cash:10}, {oil:4*R.RES_K})); SUM.push(`proposed near deal: ${r2.act}`);
  if (r2.act === 'counter'){ const o = R.offersWith(US, CA).find(x => x.src === 'deal' && !x.mine); ok(!!o && o.can.accept && o.can.counter, 'the counter-offer waits for me');
    const c1 = S.nations[US].cash, a = R.offerAct(US, 'deal', o.id, 'accept'); ok(a.ok && S.nations[US].cash <= c1, 'counter accepted: ' + JSON.stringify(a));
    ok(!R.offersWith(US, CA).some(x => x.id === o.id), 'and closed'); }
  else ok(r2.act === 'accept', 'near deal: ' + r2.act);
  const r3 = R.dealPropose(US, CA, deal({}, {cash:5000})); ok(r3.act === 'decline' || !r3.ok, 'a silly deal is declined: ' + JSON.stringify(r3)); }

// 8. land inside a mixed deal: sold to the computer nation that wants it, with goods; the territory rules apply (lock, log, title)
{ const want = R.terrWant(CA, q1, US); ok(want > 0, 'Canada wants its lost border land: $' + want);
  const pr = Math.max(R.terrMin(US, CA, q1), Math.min(want, Math.floor(want*0.6))), c0 = S.nations[US].cash, D = deal({provs:[q1], oil:0}, {cash:pr});
  // one province for money only: the territory path (terrOffer)
  const r = R.dealPropose(US, CA, D); SUM.push(`land for money: ${r.act} ${r.why || ''}`); ok(r.ok && (r.act === 'accept' || r.act === 'counter'), 'land for money goes the territory way: ' + JSON.stringify({act:r.act, why:r.why}));
  if (r.act === 'accept'){ ok(S.owner[q1] === CA && S.nations[US].cash === c0 + pr && S.terr.log.some(l => l.p === q1), 'sold: owner, money, log'); }
  // a mixed deal: a province plus goods for money
  const D2 = deal({provs:[p1], oil:R.RES_K}, {cash:Math.max(R.terrMin(US, CA, p1), 1) + 80}), a = R.dealAnswer(US, CA, D2); SUM.push(`mixed land deal: ${a.act} (${a.why})`);
  ok(['accept', 'counter', 'decline'].includes(a.act), 'mixed land deal answered: ' + a.act + ' ' + a.why);
  if (a.act !== 'decline'){ const pre = S.terr.log.length; ok(R.dealApply(US, CA, a.D), 'the deal it would sign goes through'); ok(S.owner[p1] === CA && S.terr.lock[p1] && S.terr.lock[p1].by === CA && S.terr.log.length === pre + 1, 'land moved with lock and log'); } }

// 9. two seats: an offer stands, is answered, withdrawn or lapses
{ R.setRel(US, DE, 'peace'); const c0 = S.nations[US].cash, d0 = S.nations[DE].cash;
  const r = R.dealPropose(US, DE, deal({cash:30}, {oil:R.RES_K})); ok(r.ok && r.act === 'sent' && S.deals.length === 1, 'offer to a person stands');
  ok(R.threads(DE).some(t => t.n === US && t.answer && t.unread > 0), 'the other seat sees it waiting: ' + JSON.stringify(R.threads(DE).find(t => t.n === US)));
  ok(!R.offerAct(US, 'deal', r.o.id, 'accept').ok, 'the proposer cannot accept its own offer');
  ok(R.offerAct(DE, 'deal', r.o.id, 'accept').ok && S.nations[US].cash === c0 - 30 && S.nations[DE].cash === d0 + 30, 'accepted: money moved');
  ok(R.threadView(US, DE).items.some(e => e.t === 'offer' && e.st === 'accepted'), 'the card says accepted');
  const r2 = R.dealPropose(US, DE, deal({cash:10})); ok(R.offerAct(US, 'deal', r2.o.id, 'withdraw').ok && !S.deals.length, 'withdrawn');
  const r3 = R.dealPropose(US, DE, deal({cash:10})); ok(R.offerAct(DE, 'deal', r3.o.id, 'decline').ok && !S.deals.length, 'declined');
  const r4 = R.dealPropose(US, DE, deal({cash:10})); S.hour += 49; R.dealHour(); ok(!S.deals.length && R.threadView(US, DE).items.some(e => e.id === r4.o.id && e.st === 'expired'), 'lapses after 2 days');
  // a treaty to a person is an offer; accepted, the relation changes
  const t = R.treatyPropose(US, DE, 'nap'); ok(t.ok && t.act === 'sent', 'NAP offered to a person');
  ok(R.relInfo(DE, US).wantsTheirs.includes('nap') && R.relInfo(US, DE).wantsMine.includes('nap'), 'pending rings on both sides');
  ok(R.offerAct(DE, 'deal', t.o.id, 'accept').ok && R.rel(US, DE).st === 'nap', 'NAP signed');
  ok(R.threadView(US, DE).items.some(e => e.t === 'sys' && e.k === 'treaty'), 'treaty card'); }

// 10. a counter between two seats replaces the offer it answers
{ R.setRel(US, DE, 'peace'); const r = R.dealPropose(US, DE, deal({cash:10}, {oil:R.RES_K}));
  const c = R.dealPropose(DE, US, deal({oil:R.RES_K}, {cash:20}), {round:2, counterOf:{src:'deal', id:r.o.id}});
  ok(c.ok && S.deals.length === 1 && S.deals[0].id === c.o.id && R.threadView(US, DE).items.some(e => e.id === r.o.id && e.st === 'countered'), 'countered');
  R.offerAct(US, 'deal', c.o.id, 'decline'); }

// 11. computer treaty offers and trade proposals become cards; answering them works as before
{ R.setRel(US, CA, 'peace'); S.offers.length = 0; R.offerSeat(US, CA, 'nap'); const o = R.offersWith(US, CA).find(x => x.src === 'treaty');
  ok(!!o && R.threadView(US, CA).items.some(e => e.t === 'offer' && e.src === 'treaty' && e.st === 'waiting'), 'treaty offer card waiting');
  ok(R.offerAct(US, 'treaty', o.id, 'accept').ok && R.rel(US, CA).st === 'nap', 'accepted: NAP'); R.setRel(US, CA, 'peace'); }

// 12. the relation menu and the actions moved from the page
{ R.setRel(US, CA, 'truce', 10); const w = R.relMenu(US, CA).find(x => x.k === 'war'); ok(w && !w.ok && /Ceasefire: \d+ d left/.test(w.why), 'no war in a ceasefire: ' + (w && w.why));
  R.setRel(US, CA, 'nap', 20); const w2 = R.relMenu(US, CA).find(x => x.k === 'war'); ok(w2 && w2.ok && w2.breaker && /treaty breaker/.test(w2.warn), 'breaker warning on a NAP');
  ok(R.relMenu(US, CA).some(x => x.k === 'pass') && !R.relMenu(US, CA).some(x => x.k === 'nap'), 'NAP: ask right of way, no second NAP');
  R.setRel(US, CA, 'peace');
  ok(!R.giftCash(US, CA).ok, 'aid only for allies and partners');
  const e = R.embargoAct(US, CA); ok(e.ok && e.on && R.embargoed(US, CA), 'embargo on'); ok(R.embargoAct(US, CA).ok && !R.embargoed(US, CA), 'embargo lifted');
  R.setRel(US, CA, 'war', null, US); ok(R.relMenu(US, CA).some(x => x.k === 'peace') && R.relMenu(US, CA).some(x => x.k === 'tribute'), 'at war: ceasefire and tribute');
  S.nations[US].cash = 0; ok(!R.payTribute(US, CA).ok, 'no tribute without money'); S.nations[US].cash = 5000;
  R.setRel(US, CA, 'peace'); const r = R.relAct(US, CA, 'war'); ok(r.ok && R.atWar(US, CA) && R.threadView(US, CA).items.some(x => x.t === 'sys' && x.k === 'war'), 'declare war from the menu: a war card');
  R.setRel(US, CA, 'peace'); }

// 13. the readers write nothing (saveJSON byte for byte), and are complete
{ const before = api.saveJSON();
  const st = R.natStatsAll(); ok(st.length === S.nations.length && st[US].provinces > 0 && st[US].vp > 0 && st[US].progress > 0 && st[US].progress <= 1 && st[US].capitalName, 'stats: ' + JSON.stringify(st[US]).slice(0, 200));
  for (const N of S.nations){ R.relInfo(US, N.id); if (N.id !== US){ R.relMenu(US, N.id); R.knownArmy(US, N.id); } R.warList(N.id); R.offersWith(US, N.id); R.threadView(US, N.id); R.dealPreview(US, N.id, deal({cash:10})); }
  R.threads(US); R.unreadAll(US); { const rr = R.relRows(US); ok(rr.length === S.nations.length && rr[US].st === 'self' && rr.every(x => x.st === R.relView(US, x.n).st || x.n === US), 'relRows'); }
  ok(api.saveJSON() === before, 'opening every view changes nothing'); }

// 14. known army: unknown under fog, known for an ally; at war with: rebels listed
{ const k = R.knownArmy(US, CA); ok(k === null || k.units >= 0, 'known army for a neighbour: ' + JSON.stringify(k));
  const far = S.nations.find(N => N.id !== US && N.id !== DE && N.alive && !G.P.some(P => S.owner[P.id] === N.id && P.nbs.some(v => S.owner[v] === US)));
  ok(R.knownArmy(US, far.id) === null, `far away ${far.name}: Unknown`);
  R.setRel(US, CA, 'ally'); const ka = R.knownArmy(US, CA); ok(ka && ka.units > 0, 'an ally\'s forces are known: ' + JSON.stringify(ka)); R.setRel(US, CA, 'peace');
  const rp = G.P.find(P => !P.sea && S.owner[P.id] === CA && !P.city).id, rb = R.addArmy(R.NEUTRAL, rp, {inf:3}); rb.rebel = true;
  const wl = R.warList(CA); ok(!!wl.rebels, 'rebels in its land: ' + wl.rebels); S.armies = S.armies.filter(a => a !== rb); }

// 15. dev-only pretend person: writes, offers, answers
{ R.devPerson(CA, true); const before = (S.deals || []).length; R.devWrite(CA, US); ok(R.threadView(US, CA).items.some(e => !e.mine && e.t === 'msg'), 'pretend person writes');
  const o = R.devOffer(CA, US); ok(S.deals.length === before + 1 && R.offersWith(US, CA).some(x => x.id === o.id && !x.mine), 'pretend person offers');
  R.offerAct(US, 'deal', o.id, 'decline');
  const r = R.dealPropose(US, CA, deal({cash:10}, {oil:R.RES_K})); ok(r.act === 'sent', 'an offer to a pretend person waits');
  const c = R.devAnswer(r.o.id, 'counter'); ok(c.ok && R.offersWith(US, CA).some(x => x.id === c.o.id && !x.mine), 'pretend counter');
  R.offerAct(US, 'deal', c.o.id, 'decline'); ok(R.muteSet(US, CA, true), 'a pretend person can be muted'); R.muteSet(US, CA, false); R.devPerson(CA, false); }

// 15b. review fixes: alliance limits and one treaty per deal between people, counters only of your own offers (round from the offer),
// mute hides offer dispatches, no opinion cost for a computer's refusal, offers made before a war lapse, embargo keys do only what they say
{ const others = S.nations.filter(N => N.alive && ![US, DE, CA].includes(N.id)).map(N => N.id); for (const N of S.nations) for (const M of S.nations) if (N.id < M.id && R.rel(N.id, M.id).st === 'ally') R.setRel(N.id, M.id, 'peace');
  R.setRel(US, DE, 'peace'); for (const x of others.slice(0, 3)) R.setRel(US, x, 'ally');
  let w = R.dealWhy(US, DE, R.dealNorm(deal({}, {}, ['ally']))); ok(/too many allies/.test(w || ''), 'people: 3 allies at most: ' + w);
  for (const x of others.slice(1, 3)) R.setRel(US, x, 'peace'); R.setRel(DE, others[3], 'ally'); R.setRel(DE, others[4], 'ally');
  w = R.dealWhy(US, DE, R.dealNorm(deal({}, {}, ['ally']))); ok(/4 members/.test(w || ''), 'people: a coalition of 4 at most (2 + 3): ' + w);
  ok(!R.dealPropose(US, DE, deal({}, {}, ['ally'])).ok, 'and the offer is refused');
  R.setRel(US, others[0], 'peace'); R.setRel(DE, others[3], 'peace'); R.setRel(DE, others[4], 'peace');
  w = R.dealWhy(US, DE, R.dealNorm(deal({}, {}, ['ally', 'nap']))); ok(/one treaty per deal/.test(w || ''), 'one treaty per deal: ' + w);
  // counters: only of an offer made to you, by that nation; the round follows the offer, whatever the caller says
  R.devPerson(CA, true); R.setRel(US, CA, 'peace'); const o1 = R.dealPropose(US, CA, deal({cash:10})).o, n0 = S.deals.length;
  const bad = R.dealPropose(DE, US, deal({cash:5}), {counterOf:{src:'deal', id:o1.id}}); ok(!bad.ok && S.deals.some(x => x.id === o1.id) && S.deals.length === n0, 'a third side cannot close an offer by countering it: ' + JSON.stringify(bad));
  const bad2 = R.dealPropose(US, DE, deal({cash:5}), {counterOf:{src:'deal', id:o1.id}}); ok(!bad2.ok && S.deals.some(x => x.id === o1.id), 'nor can its own maker');
  const t0 = R.dealPropose(DE, US, deal({cash:5})).o, c1 = R.dealPropose(US, DE, deal({cash:6}), {round:1, counterOf:{src:'deal', id:t0.id}});
  ok(c1.ok && c1.o.n === t0.n + 1, 'the round comes from the countered offer: ' + (c1.o && c1.o.n)); R.offerAct(DE, 'deal', c1.o.id, 'decline'); R.offerAct(US, 'deal', o1.id, 'withdraw'); R.devPerson(CA, false);
  // mute: the offer waits in the thread, no dispatch and no event
  const ev = []; R.IM.on('deal', (n, o) => ev.push(o.id)); R.muteSet(US, DE, true); const l0 = (S.log || []).length;
  const m = R.dealPropose(DE, US, deal({cash:5})); ok(m.ok && !ev.includes(m.o.id) && (S.log || []).length === l0, 'muted: no dispatch or event for the offer');
  ok(!R.threads(US).find(t => t.n === DE).answer, 'muted: no Answer mark'); R.muteSet(US, DE, false); R.offerAct(DE, 'deal', m.o.id, 'withdraw');
  // a computer nation's refusal costs no opinion; an impossible deal is refused before it is asked, also at no cost
  R.setRel(US, CA, 'peace'); const op0 = R.opinion(CA, US), L0 = R.threadView(US, CA).items.length;
  ok(!R.dealPropose(US, CA, deal({cash:-5})).ok && !R.dealPropose(US, CA, deal({oil:1e12})).ok && R.threadView(US, CA).items.length === L0, 'impossible deals refused, no card');
  const dl = R.dealPropose(US, CA, deal({}, {cash:Math.floor(S.nations[CA].cash)})); ok(dl.act === 'decline' && Math.abs(R.opinion(CA, US) - op0) < 1e-9, 'declined at no cost: ' + dl.why);
  // offers made in peace lapse when a war starts; offers made during a war stand
  R.setRel(US, DE, 'peace'); const pz = R.dealPropose(US, DE, deal({cash:5})).o; R.setRel(US, DE, 'war', null, US);
  ok(!R.offerAct(DE, 'deal', pz.id, 'accept').ok, 'an offer from before the war cannot be accepted');
  const wz = R.dealPropose(US, DE, deal({cash:5})).o; R.dealHour(); ok(!S.deals.some(x => x.id === pz.id) && S.deals.some(x => x.id === wz.id), 'the old one lapses, the war-time one stands');
  ok(R.threadView(US, DE).items.some(e => e.id === pz.id && e.st === 'void'), 'its card says no longer possible'); R.offerAct(US, 'deal', wz.id, 'withdraw'); R.setRel(US, DE, 'peace');
  // embargo: a double tap on Embargo keeps it, Lift only lifts
  R.relAct(US, CA, 'embargo'); R.relAct(US, CA, 'embargo'); ok(R.embargoed(US, CA), 'Embargo twice: still on');
  R.relAct(US, CA, 'embargo-lift'); ok(!R.embargoed(US, CA) && !R.relAct(US, CA, 'embargo-lift').ok && !R.embargoed(US, CA), 'Lift twice: still off'); }

// 16. old saves: none of the new state; the readers and actions work, the new fields appear only when used
{ const o = JSON.parse(api.saveJSON()); delete o.ppl; delete o.deals; delete o.devPeople; delete o.mute; delete o.friends; if (o.desks) for (const k in o.desks){ delete o.desks[k].mute; delete o.desks[k].friends; }
  if (o.chat) for (const k in o.chat) o.chat[k] = o.chat[k].filter(e => !e.t);   // (old entries: messages only)
  ok(api.restore(o) === true, 'old save restores'); S = api.S;
  ok(!S.deals && !S.ppl, 'no new state on load');
  const before = api.saveJSON(); R.threads(US); R.threadView(US, CA); R.natStatsAll(); R.relMenu(US, CA); ok(api.saveJSON() === before, 'old save: readers write nothing');
  ok(R.personOf(US).name === 'Commander', 'default name on an old save');
  const r = R.dealPropose(US, DE, deal({cash:5})); ok(r.ok && S.deals.length === 1, 'and a new offer works');
  const fx = path.join(ROOT, '.test', 'base8d9'); if (fs.existsSync(fx)){ for (const f of fs.readdirSync(fx).filter(f => /\.json$/.test(f)).slice(0, 3)){ const d = JSON.parse(fs.readFileSync(path.join(fx, f), 'utf8'));
    ok(api.restore(d) === true, 'fixture save loads: ' + f); const b = api.saveJSON(); R.threads(api.S.nations.find(N => !N.ai).id); R.natStatsAll(); ok(api.saveJSON() === b, 'fixture: readers write nothing ' + f); } } }

console.log(SUM.join('\n')); console.log(errors.length ? 'FAIL\n  ' + errors.join('\n  ') : 'dealings: all checks passed');
process.exit(errors.length ? 1 : 0);
