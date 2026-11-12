// Territory sales (rules/territory.js), plain Node, no browser:
//   node .test/territory.js
// value, what may be sold (captured land only, never home land or a capital, no battle), the floors (25%; 10% between coalition partners after 3 days;
// competitive 40% / 25%), the 3-day resale lock, offer / counter / accept / decline between two seats, troops leaving a sold province, buildings staying,
// the AI never selling but buying (its answers and its own bids), the trade deal refusing land, and old saves loading.
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n')
  + '\nreturn {IM, TERR, provValue, capturedFrom, origOwner, terrWhyNot, terrFloor, terrMin, terrOffer, terrAnswer, terrWant, terrDay, terrHour, terrLockH, blocSince, setRel, rkey, dealOK, emptySide, isCapital, friendly, atWar, desk, nearestAirbase};';
const errors = [], ok = (c, msg) => { if (!c) errors.push(msg); }, R = new Function(SRC)(), api = R.IM.api;
const toasts = []; R.IM.on('toast', (n, why) => toasts.push(n + ':' + why));
api.newGame(4242, 0, [0, 5]); const S = api.S, G = api.G; S.started = true;
const US = 0, CA = 1, BR = 2, DE = 5, AU = 14, nm = p => G.P[p].cityName || G.P[p].name;
// 'capture' a province of nation `from` for nation `to` (as rules/combat.js capture leaves it: owner, occupation, unrest)
const take = (p, to) => { S.owner[p] = to; S.occ[p] = S.hour; S.unrest[p] = G.P[p].city ? 30 : 15; S.cap[p] = null; S.queue[p] = []; S.cons[p] = null; };
// Canadian provinces on the US border: two cities and a countryside province, none a capital
const caBorder = G.P.filter(P => !P.sea && S.owner[P.id] === CA && !R.isCapital(P.id) && P.nbs.some(v => S.owner[v] === US));
const cCity = caBorder.filter(P => P.city).map(P => P.id), cLand = caBorder.filter(P => !P.city).map(P => P.id);
ok(cCity.length >= 2 && cLand.length >= 2, `Canadian border provinces found: ${cCity.length} cities, ${cLand.length} others`);
const [p1, p2] = cCity, [q1, q2] = cLand;
for (const p of [p1, p2, q1, q2]) take(p, US);

// 1. value: whole $5M, a city above countryside, buildings and their levels add, an oil field adds
const v1 = R.provValue(p1), vq = R.provValue(q1);
ok(v1 % 5 === 0 && vq % 5 === 0 && vq >= 10, `values are whole $5M: ${v1}, ${vq}`);
ok(v1 > vq, `a city (${v1}) is worth more than countryside (${vq})`);
{ const b0 = S.bld[p1].arms; S.bld[p1].arms = 2; const va = R.provValue(p1); S.bld[p1].arms = 3; const vb = R.provValue(p1); S.bld[p1].arms = b0; ok(vb > va && va > v1, `Arms Industry levels raise the value: ${v1} -> ${va} -> ${vb}`); }
{ const P = G.P[q1], o0 = P.oil; P.oil = true; const vo = R.provValue(q1); P.oil = o0; ok(vo > vq + R.TERR.vOil - 1, `an oil field adds: ${vq} -> ${vo}`); }
{ const pop0 = (S.pop || (S.pop = G.P.map(P => P.pop0)))[p1]; S.pop[p1] = pop0*4; const vp = R.provValue(p1); S.pop[p1] = pop0; ok(vp > v1, `more people, more value: ${v1} -> ${vp}`); }

// 2. what may be sold
ok(R.capturedFrom(p1) === CA && R.origOwner(p1) === CA, 'captured from Canada');
ok(R.terrWhyNot(US, p1) === null && R.terrWhyNot(US, q1) === null, 'captured land may be sold: ' + R.terrWhyNot(US, p1));
const usHome = G.P.find(P => !P.sea && S.owner[P.id] === US && !R.isCapital(P.id)).id;
ok(/home country/.test(R.terrWhyNot(US, usHome)), 'home land may not be sold: ' + R.terrWhyNot(US, usHome));
ok(/capital/.test(R.terrWhyNot(US, S.nations[US].capital)) || /home/.test(R.terrWhyNot(US, S.nations[US].capital)), 'the capital may not be sold');
{ const capCA = S.nations[CA].capital, keep = S.owner[capCA]; S.owner[capCA] = US; S.nations[CA].capital0 = capCA;
  // a captured capital is not the seller's capital: it may be sold, unless it is the seller's own capital (checked above)
  ok(R.terrWhyNot(US, capCA) === null, 'a captured foreign capital may be sold: ' + R.terrWhyNot(US, capCA)); S.owner[capCA] = keep; }
S.battles.push(q2); ok(/battle/.test(R.terrWhyNot(US, q2)), 'no sale during a battle there'); S.battles.length = 0;
ok(/not yours/.test(R.terrWhyNot(DE, p1)), 'only the holder sells');

// 3. floors: 25%; 10% between coalition partners after 3 days together; competitive 40% / 25%
ok(R.terrFloor(US, DE) === 0.25 && R.terrMin(US, DE, p1) === Math.ceil(v1*0.25), `floor 25%: min $${R.terrMin(US, DE, p1)}M of $${v1}M`);
ok(R.terrFloor(US, DE, true) === 0.40, 'competitive floor 40% (hook, not active)');
R.setRel(US, DE, 'ally'); const t0 = S.hour;
ok(R.blocSince(US, DE) === t0, 'coalition partners since the alliance: ' + R.blocSince(US, DE));
ok(R.terrFloor(US, DE) === 0.25, 'new partners: still 25%');
S.hour = t0 + 71; ok(R.terrFloor(US, DE) === 0.25, '71 h together: still 25%');
S.hour = t0 + 72; ok(R.terrFloor(US, DE) === 0.10 && R.terrMin(US, DE, p1) === Math.ceil(v1*0.10), `72 h together: 10% (min $${R.terrMin(US, DE, p1)}M)`);
ok(R.terrFloor(US, DE, true) === 0.25, 'competitive partners: 25%');
// a chain of alliances: a third nation that joined later counts from its own alliance
R.setRel(DE, BR, 'ally'); ok(R.blocSince(US, BR) === S.hour && R.terrFloor(US, BR) === 0.25, 'a newer partner (via an ally) counts from its own alliance');
S.hour = t0 + 72;

// 4. seat to seat: offer, refused under the floor, counter, accept; troops leave, buildings stay, cash moves, the lock
S.nations[DE].cash = 5000; S.nations[US].cash = 1000; R.setRel(DE, BR, 'peace'); R.setRel(US, DE, 'peace');
ok(R.terrFloor(US, DE) === 0.25, 'the alliance ended: back to 25%');
S.bld[p1].arms = 2; S.bld[p1].fort = 1; const val = R.provValue(p1), mn = R.terrMin(US, DE, p1);
let r = R.terrOffer(US, DE, p1, mn - 1); ok(!r.ok && /lowest price/.test(r.why), 'under the floor is refused: ' + r.why);
r = R.terrOffer(US, DE, p1, val); ok(r.ok && S.terr.offers.some(o => o.id === r.o.id && o.to === DE && o.price === val), 'offer to the other seat stands');
ok(R.desk(DE).log.some(e => /offers to sell you/.test(e.text)), 'the buyer seat is told');
const id1 = r.o.id; r = R.terrAnswer(DE, id1, 'counter', mn - 5); ok(!r.ok && /lowest price/.test(r.why), 'a counter under the floor is refused');
r = R.terrAnswer(DE, id1, 'counter', Math.round(val*0.6)); ok(r.ok && r.o.from === DE && r.o.to === US && r.o.n === 2 && !S.terr.offers.some(o => o.id === id1), 'counter-offer goes back to the seller and replaces the first');
ok(R.terrAnswer(DE, r.o.id, 'accept').ok === false, 'only the side it is addressed to can accept');
// forces in the province: the seller's, an ally of the buyer, a third power at peace with the buyer
const mine = S.armies.find(a => a.owner === US && !a.air && !a.u.frig && !a.u.sub);
const addA = (o, at, u) => { const a = {id:S.nid++, owner:o, at, to:null, t:0, path:[], forced:false, m:80, u:{}, w:{}}; for (const t of Object.keys(mine.u)){ a.u[t] = u[t] || 0; a.w[t] = 0; } S.armies.push(a); return a; };
const aUS = addA(US, p1, {inf:3}), aFR = addA(4, p1, {inf:2}), aRU = addA(6, p1, {inf:1}); R.setRel(4, DE, 'ally');
const cashUS = S.nations[US].cash, cashDE = S.nations[DE].cash, price = r.o.price;
r = R.terrAnswer(US, r.o.id, 'accept'); ok(r.ok && S.owner[p1] === DE, 'accepted: Germany owns it');
ok(S.nations[US].cash === cashUS + price && S.nations[DE].cash === cashDE - price, 'the price changed hands');
ok(S.bld[p1].arms === 2 && S.bld[p1].fort === 1, 'buildings and their levels stay');
ok(aUS.at !== p1 && S.owner[aUS.at] === US && aUS.to === null && !aUS.path.length, `the seller's troops moved to its own province (${nm(aUS.at)})`);
ok(G.P[p1].nbs.some(v => S.owner[v] === US) ? G.P[p1].nbs.includes(aUS.at) : true, 'nearest: a neighbouring province of the seller');
ok(aFR.at === p1, "the buyer's ally stays");
ok(aRU.at !== p1, 'a power with no right to be there leaves');
ok(R.terrLockH(p1) === 72 && /resold in 3 d/.test(R.terrWhyNot(DE, p1)), 'bought: locked for 3 days: ' + R.terrWhyNot(DE, p1));
S.hour += 71; ok(/resold in 1 h/.test(R.terrWhyNot(DE, p1) || ''), '71 h later still locked');
S.hour += 1; ok(R.terrWhyNot(DE, p1) === null, '72 h later it may be resold (captured land for Germany too)');
ok(S.terr.log.length === 1 && S.terr.log[0].seller === US && S.terr.log[0].buyer === DE && S.terr.log[0].price === price, 'history log');
ok(R.desk(US).log.some(e => /You sold/.test(e.text)) && R.desk(DE).log.some(e => /You bought/.test(e.text)), 'both seats get a dispatch');
ok(S.home[p1] === CA && S.occ[p1] != null, 'occupied land stays occupied land for the buyer');
// decline and withdraw
r = R.terrOffer(US, DE, q2, R.provValue(q2)); ok(r.ok, 'second offer'); ok(R.terrAnswer(DE, r.o.id, 'decline').ok && !S.terr.offers.length, 'declined');
r = R.terrOffer(US, DE, q2, R.provValue(q2)); ok(R.terrAnswer(US, r.o.id, 'withdraw').ok && !S.terr.offers.length, 'withdrawn');
// war and embargo block a sale
R.setRel(US, DE, 'war'); r = R.terrOffer(US, DE, q2, R.provValue(q2)); ok(!r.ok && /at war/.test(r.why), 'no sale at war'); R.setRel(US, DE, 'peace');

// 5. the AI never sells
const caOwn = G.P.find(P => !P.sea && S.owner[P.id] === CA && !R.isCapital(P.id)).id;
r = R.terrOffer(US, CA, caOwn, 500); ok(!r.ok && /never sells/.test(r.why), 'a computer-run nation never sells: ' + r.why);
{ const D = {give:R.emptySide(), get:R.emptySide()}; D.get.provs = [caOwn]; D.give.cash = 900; ok(/never sells/.test(R.dealOK(US, CA, D) || ''), 'a trade deal asking for its land is refused'); }
{ const D = {give:R.emptySide(), get:R.emptySide()}; D.give.provs = [q2]; ok(/Territory/.test(R.dealOK(US, CA, D) || ''), 'land is not handed over in a trade deal'); }
// 6. the AI buys: its own lost land back at up to 150% of the value
S.nations[CA].cash = 3000; S.mem[CA] = {}; S.mem[CA][US] = 0;
const w2 = R.terrWant(CA, p2, US), vp2 = R.provValue(p2); ok(w2 >= vp2*1.2, `Canada wants its own city back: up to $${w2}M for $${vp2}M`);
ok(R.terrWant(AU, p2, US) === 0, 'a far-away power is not interested');
r = R.terrOffer(US, CA, p2, vp2); ok(r.ok && r.done && S.owner[p2] === CA, 'Canada buys its city back at the value');
ok(S.home[p2] === CA && S.occ[p2] == null && S.unrest[p2] <= 5, 'back home: no occupation, unrest low');
ok(R.terrWhyNot(CA, p2) !== null, 'and it is home land again for Canada');
// too dear: it counters at what it would pay, then declines a second higher ask
r = R.terrOffer(US, CA, q1, R.provValue(q1)*5); ok(!r.ok && r.countered && r.price <= R.terrWant(CA, q1, US) && r.o.from === CA && r.o.to === US, 'too dear: a counter-offer: ' + JSON.stringify(r.price));
const cid = r.o.id; r = R.terrAnswer(US, cid, 'counter', R.provValue(q1)*4); ok(!r.ok && !r.countered && /will not pay/.test(r.why || ''), 'the AI does not raise its counter: ' + r.why);
r = R.terrOffer(US, AU, q2, R.provValue(q2)); ok(!r.ok && /not interested/.test(r.why), 'Australia declines: ' + r.why);
// its own bids for a seat's captured land (once a day, a chance)
S.terr.offers = []; S.terr.no = {}; let bid = null;
for (let i = 0; i < 60 && !bid; i++){ R.terrDay(); bid = S.terr.offers.find(o => o.to === US); }
ok(bid && bid.from === CA && bid.seller === US && bid.price >= R.terrMin(US, CA, bid.p) && bid.price <= R.terrWant(CA, bid.p, US), 'the AI bids for captured land it wants: ' + JSON.stringify(bid && {p:nm(bid.p), price:bid.price, value:bid.value}));
ok(R.desk(US).log.some(e => /offers to buy/.test(e.text)), 'the seat is told of the bid');
if (bid){ const before = S.owner[bid.p]; r = R.terrAnswer(US, bid.id, 'counter', Math.round(bid.value*0.95)); ok(r.ok !== undefined, 'a counter to the AI bid gets an answer');
  if (r.countered) ok(r.price > bid.price, 'the AI raises once'); if (!r.ok && !r.countered) ok(S.owner[bid.p] === before, 'declined: nothing changed'); }

// 7. old saves: no S.terr, no own0 (very old): load, the home owner counts as the original owner, ticks run, an old AI land offer is refused
{ const txt = api.saveJSON(), o = JSON.parse(txt); delete o.terr; delete o.own0; const qq = [q1, q2, p1].find(p => o.owner[p] === US);
  o.offers = [{id:999999, from:CA, kind:'trade', deal:{give:{cash:100, oil:0, metal:0, iron:0, elec:0, rare:0, provs:[], treaty:[]}, get:{cash:0, oil:0, metal:0, iron:0, elec:0, rare:0, provs:[caOwn], treaty:[]}}, exp:o.hour + 48}];
  ok(api.restore(o) === true, 'old save restores'); const S2 = api.S;
  ok(Array.isArray(S2.own0) && S2.own0.length === S2.owner.length && S2.own0[qq] === CA, 'own0 rebuilt from the home owners: captured land stays captured');
  ok(R.terrWhyNot(US, qq) === null, 'captured land in an old save can be sold: ' + R.terrWhyNot(US, qq) + ' owner ' + S2.owner[qq]);
  ok(/never sells/.test(R.dealOK(US, CA, S2.offers[0].deal) || ''), 'an old pending AI land offer no longer works');
  let err = null; try { for (let i = 0; i < 48; i++) api.tick(); } catch (e){ err = e.stack; } ok(!err, 'ticks run on the old save: ' + err);
  const back = JSON.parse(api.saveJSON()); ok(api.restore(back) === true, 'and the save with territory state restores'); }
// a save from before territory sales with own0 (every save since round 33): own0 kept as it is
{ const fx = path.join(__dirname, 'fixtures', 'eco-v1-save.json'); if (fs.existsSync(fx)){ const o = JSON.parse(fs.readFileSync(fx, 'utf8')).save; const had = Array.isArray(o.own0);
    ok(api.restore(o) === true, 'eco-v1 fixture save loads'); const S3 = api.S; ok(!had || S3.own0.every((x, i) => x === o.own0[i]), 'its own0 kept');
    let err = null; try { for (let i = 0; i < 30; i++) api.tick(); } catch (e){ err = e.stack; } ok(!err, 'the fixture save plays: ' + err); } }
console.log(JSON.stringify({value:{city:v1, land:vq}, floors:{normal:0.25, partner:0.10}, sold:S.terr ? S.terr.log : null, toasts:toasts.length, errors}, null, 1));
process.exit(errors.length ? 1 : 0);
