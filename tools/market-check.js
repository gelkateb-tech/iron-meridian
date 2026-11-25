// Iron Meridian: the order book's checks (the Market, ECO-9), in plain Node like tools/headless.js. Exit 1 on any failed check.
//   node tools/market-check.js            the scenarios and a 30-day nations-world game, seed 12345
//   node tools/market-check.js --days 50 --seed 2503
// 1. conservation: every daily book step (expiry, computer listings and bids, matching, fills, the depth floor) moves money and goods between
//    nations and the offers that hold them, and creates or destroys none (money held in buy offers and goods held in sell offers count with their owner)
// 2. both sides: from day 1 every good has buy and sell offers (the depth floor; IMP-2: the computer nations post both)
// 3. the rules a person meets: cancelOffer refunds; fillOffer and the matching stop at the buyer's storage; a computer nation's world-market buy takes a
//    person's cheaper sell offer first (trade routes through the book); topOffers' order; fillLimit's reason; the whole-game price history and its
//    downsampling; an old save without it starts from the 60 days it kept
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] !== undefined ? +process.argv[i + 1] : d; };
const DAYS = arg('days', 30), SEED = arg('seed', 12345);
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
let src = FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
// the daily book step, wrapped: totals of money and goods before and after (a copy of the rules for this check only)
src = src.replace('function bookDay(){', `function __tot(){ let c = 0; const g = {}; for (const N of S.nations){ c += N.cash; for (const k of MKT_K) g[k] = (g[k] || 0) + N[k]; }
  for (const o of S.book || []){ if (o.type === 'buy') c += o.qty/MKT_LOT*o.price; else g[o.res] = (g[o.res] || 0) + o.qty; } return {c, g}; }
function bookDay(){ const a = __tot(); bookDay0(); const b = __tot(); const C = globalThis.__C; C.days++; C.cash = Math.max(C.cash, Math.abs(b.c - a.c)); for (const k in a.g) C.goods = Math.max(C.goods, Math.abs(b.g[k] - a.g[k])); }
function bookDay0(){`);
const SRC = "'use strict';\n" + src + '\nreturn {IM, MKT_K, MKT_BASE, stockCap, isBid, mkt, trade, cancelOffer, fillOffer, postOffer, topOffers, fillLimit, worldHistory, histDay, mktFix, bookDay, setRel:typeof setRel === "function" ? setRel : null};';
const fails = [], ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m + (x !== undefined ? '  ' + JSON.stringify(x) : '')); if (!c) fails.push(m); };

// ---- 1 and 2: a nations-world game with no seat
globalThis.__C = {days:0, cash:0, goods:0};
{ const R = new Function(SRC)(), api = R.IM.api; api.useScenario('world64'); api.newGame(SEED, 0, []); const S = api.S; S.started = true;
  const sides = []; for (let h = 0; h < DAYS*24 && !S.over; h++){ for (let q = 0; q < api.BATTLE_Q; q++) api.tickQ(); if (S.hour % 24 === 12){ const b = S.book || []; sides.push({d:S.hour/24 | 0, t:Object.fromEntries(R.MKT_K.map(k => [k, [b.filter(o => o.res === k && !R.isBid(o)).length, b.filter(o => o.res === k && R.isBid(o)).length]]))}); } }
  const C = globalThis.__C; ok(C.days >= DAYS - 1 && C.cash < 1e-6 && C.goods < 1e-4, `conservation over ${C.days} daily book steps: money and goods neither made nor lost`, {cash:C.cash, goods:C.goods});
  const noBid = sides.filter(x => R.MKT_K.some(k => !x.t[k][1])).map(x => x.d), noAsk = sides.filter(x => R.MKT_K.some(k => !x.t[k][0])).map(x => x.d);
  ok(!noBid.length, 'every good has buy offers on every day from day 1', noBid);
  ok(noAsk.length <= 2, 'every good has sell offers on (nearly) every day from day 1', noAsk);
  const AIc = S.nations.filter(N => N.alive).map(N => N.cash); ok(AIc.every(c => c > -1), 'no computer nation goes into debt', Math.min(...AIc));
  const H = R.worldHistory('oil'); ok(H.length >= DAYS - 1 && H[H.length - 1].p === +S.mkt.p.oil.toFixed(2), 'the oil history runs over the whole game to today', {n:H.length, last:H[H.length - 1], p:S.mkt.p.oil});
}

// ---- 3: the rules a person meets (classic world, seat 0)
{ const R = new Function(SRC)(), api = R.IM.api; api.useScenario('world'); api.newGame(7, 0, [0]); const S = api.S; S.started = true; for (let h = 0; h < 30; h++) api.tick();
  const me = S.nations[0], ai = S.nations.find(N => N.id > 0 && N.alive), K = 1000;
  // cancelOffer: the goods or the money come back, and only the owner can
  S.book = []; me.oil = 200*K; me.cash = 500; const q1 = R.postOffer(0, 'oil', 50*K, 3, 'sell'), q2 = R.postOffer(0, 'iron', 20*K, 2, 'buy');
  ok(q1 === 50*K && me.oil === 150*K && Math.abs(me.cash - 460) < 1e-9, 'posting holds the goods and the money', {oil:me.oil, cash:me.cash});
  const o1 = S.book.find(o => o.res === 'oil'), o2 = S.book.find(o => o.res === 'iron');
  ok(R.cancelOffer(ai.id, o1.id) === 0 && S.book.length === 2, 'another nation cannot cancel my offer');
  ok(R.cancelOffer(0, o1.id) === 50*K && me.oil === 200*K && R.cancelOffer(0, o2.id) === 20*K && Math.abs(me.cash - 500) < 1e-9 && !S.book.length, 'cancelOffer gives back the goods and the money held', {oil:me.oil, cash:me.cash});
  ok(R.cancelOffer(0, 99999) === 0, 'cancelling an offer that is gone does nothing');
  // fillOffer into a buy offer: no more than the buyer's storage holds
  S.book = []; ai.cash = 1000; ai.iron = R.stockCap(ai.id, 'iron') - 10*K; R.postOffer(ai.id, 'iron', 40*K, 2, 'buy'); const bid = S.book[0]; me.iron = 100*K;
  const L = R.fillLimit(0, bid.id); ok(L.q === 10*K && L.why === 'room', 'fillLimit names the buyer\'s storage as the limit', L);
  ok(R.fillOffer(0, bid.id, 40*K) === 10*K && ai.iron === R.stockCap(ai.id, 'iron') && me.iron === 90*K, 'selling into a buy offer stops at the buyer\'s storage cap');
  // a computer nation's world-market buy takes a person's cheaper sell offer first (and the person is told)
  S.book = []; me.metal = 100*K; ai.cash = 2000; ai.metal = 0; const p0 = S.mkt.p.metal, log0 = (S.log || []).length; R.postOffer(0, 'metal', 30*K, +(p0*0.95).toFixed(2), 'sell');
  const c0 = me.cash, got = R.trade(ai.id, 'metal', 50*K);
  ok(got === 50*K && !S.book.length && Math.abs(me.cash - c0 - 30*+(p0*0.95).toFixed(2)) < 1e-6, 'a computer nation\'s buy takes the cheaper sell offer first, the rest from the world', {got, paid:me.cash - c0});
  ok((S.log || []).length > log0, 'the seller is told');
  S.book = []; R.postOffer(0, 'metal', 30*K, +(p0*1.3).toFixed(2), 'sell'); R.trade(ai.id, 'metal', 10*K); ok(S.book.length === 1 && S.book[0].qty === 30*K, 'an offer dearer than the world price is left alone');
  // topOffers: cheapest sell offers first (the older first at one price), highest buy offers first; never my own
  S.book = []; const others = S.nations.filter(N => N.id > 0 && N.alive).slice(0, 4); for (const N of others){ N.oil = 100*K; N.cash = 500; }
  R.postOffer(others[0].id, 'oil', 10*K, 3.1, 'sell'); R.postOffer(others[1].id, 'oil', 10*K, 2.9, 'sell'); R.postOffer(others[2].id, 'oil', 10*K, 2.9, 'sell'); R.postOffer(0, 'oil', 10*K, 2.5, 'sell');
  R.postOffer(others[0].id, 'oil', 10*K, 2.0, 'buy'); R.postOffer(others[3].id, 'oil', 10*K, 2.2, 'buy');
  const A = R.topOffers(0, 'oil', 'ask', 3), B = R.topOffers(0, 'oil', 'bid', 3);
  ok(A.map(o => o.seller).join() === [others[1].id, others[2].id, others[0].id].join() && B.map(o => o.price).join() === '2.2,2', 'topOffers: cheapest asks first (older first), highest bids first, not my own', {A:A.map(o => [o.seller, o.price]), B:B.map(o => o.price)});
  // matching: a computer nation's bid at or above my ask fills it at my price, once a day, up to its storage
  S.book = []; const X = others[3]; X.cash = 800; X.oil = 0; me.oil = 100*K; R.postOffer(0, 'oil', 20*K, 2.0, 'sell'); R.postOffer(X.id, 'oil', 30*K, 2.4, 'buy'); const cm = me.cash, cx = X.cash; R.bookDay();
  ok(!S.book.some(o => o.seller === 0) && X.oil >= 20*K && Math.abs(me.cash - cm - 40) < 1e-6, 'a computer bid above my ask fills it at my price in the daily step', {mine:S.book.filter(o => o.seller === 0).length, xOil:X.oil, paid:me.cash - cm, xCash:cx - X.cash});
  // the history: one point a day; past 360 points pairs are averaged and the step doubles; an old save starts from the 60 days it kept
  const M = R.mkt(); delete M.hg; M.hist = Object.fromEntries(R.MKT_K.map(k => [k, [3, 3.2, 3.4]])); R.mktFix();
  ok(M.hg && M.hg.oil.join() === '300,320,340' && M.hg.st === 1, 'an old save\'s history starts from the days it kept', M.hg && M.hg.oil);
  for (let i = 0; i < 400; i++) R.histDay(M); const n = M.hg.oil.length;
  ok(n <= 360 && M.hg.st === 2 && R.worldHistory('oil').length >= 200, 'past 360 points the history halves and keeps one point every 2 days', {n, st:M.hg.st, w:R.worldHistory('oil').length});
  ok(JSON.stringify(M.hg).length < 8000, 'the history stays small (bytes)', JSON.stringify(M.hg).length);
}
console.log(fails.length ? `MARKET CHECK: ${fails.length} FAILED` : 'MARKET CHECK OK'); process.exit(fails.length ? 1 : 0);
