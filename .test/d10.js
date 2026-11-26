// D10 (owner, 2026-11-26): a computer nation refuses a deal in which it gives something and gets nothing back, whatever it thinks of you.
// Plain Node, no browser:   node .test/d10.js
// money or goods for nothing from a friendly computer nation -> refused with the reason, no counter-offer, nothing moves; an unwanted province
// does not count as something back; a fair trade, a gift to it and a treaty it wants are judged as before; the trade builder's footer
// (dealPreview) says what the answer will be.
// Tightened (owner's D10 "fix it", 2026-11-26): a token payment does not get round it. What its opinion adds is capped by what it gets back (a
// friendly nation accepts at most about 16% less than it gives), and favours to the same seat within 72 hours get dearer, then stop.
// Polish (critics, 2026-11-26): a favour is a deal in which it got back less than it gave at world prices, so trades at world price stay
// open to a friend; a counter-offer in which it gives nothing is a decline with what it wants; "wants about $X more" is the money that does
// it; an alliance cannot be signed for money and left over and over; signed deals add goodwill once a day per pair.
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n')
  + '\nreturn {IM, dealNorm, dealAnswer, dealValue, dealPreview, dealPropose, offerAct, threadView, setRel, opinion, addMem, emptySide, terrWant, isCapital, RES_K, mktP, lotCash, mem, score, alliesOf, blocLeave, relAct, acceptOffer};';
const SUM = [], errors = [], ok = (c, msg) => { if (!c) errors.push(msg); }, R = new Function(SRC)(), api = R.IM.api;
api.newGame(4242, 0, [0, 5]); const S = api.S, G = api.G; S.started = true;
const US = 0, CA = 1;
const side = (o = {}) => ({...R.emptySide(), ...o}), deal = (give = {}, get = {}, treaty = []) => ({give:side(give), get:side(get), treaty});
const lastReply = () => { const L = R.threadView(US, CA).items.filter(e => e.from === CA && e.t === 'msg'); return L.length ? L[L.length - 1].text : ''; };
const foot = D => { const p = R.dealPreview(US, CA, D), a = R.dealAnswer(US, CA, D); ok(p.verdict === a.act, `footer agrees with the answer: ${p.verdict} vs ${a.act} (${p.text})`); return {p, a}; };

// Canada likes the US as much as it can
R.setRel(US, CA, 'peace'); R.addMem(CA, US, 200); const op = R.opinion(CA, US); SUM.push(`Canada's opinion of the US: ${Math.round(op)}`);
ok(op >= 60, 'Canada is friendly: ' + op);

// 1. money for nothing: before D10 its opinion alone made this a yes (value 43.5 >= 10); now refused with the reason, no counter-offer. Since the
// tightening its opinion adds at most DEAL_OK + 25% of what it gets back (here nothing), so the value itself is below 10 too
{ const D = deal({}, {cash:50}), v = R.dealValue(US, CA, R.dealNorm(D)).v; SUM.push(`$50M for nothing: value to Canada ${Math.round(v)} (43 before the tightening; yes at 10 before D10)`);
  ok(v < 10, 'its opinion alone no longer pays for it (' + v + ')');
  const before = api.saveJSON(), { p, a } = foot(D);
  ok(a.act === 'decline' && a.why === 'We give nothing for nothing' && !a.want, 'money for nothing refused: ' + JSON.stringify({act:a.act, why:a.why, want:a.want}));
  ok(p.verdict === 'decline' && p.text === 'Will not: We give nothing for nothing' && p.why === null, 'footer: ' + p.text + ' (sendable: ' + (p.why === null) + ')');
  ok(api.saveJSON() === before, 'the answer and the footer change nothing');
  const c0 = S.nations[US].cash, k0 = S.nations[CA].cash, n0 = (S.deals || []).length, r = R.dealPropose(US, CA, D);
  ok(r.ok && r.act === 'decline' && r.why === 'We give nothing for nothing', 'proposed: declined ' + JSON.stringify(r));
  ok(S.nations[US].cash === c0 && S.nations[CA].cash === k0 && (S.deals || []).length === n0, 'no money moved, no counter-offer left open');
  ok(lastReply() === 'We give nothing for nothing.', 'its answer in the thread: ' + lastReply()); SUM.push(`answer in the thread: "${lastReply()}"`); }

// 2. goods for nothing, and money and goods together: the same
for (const D of [deal({}, {oil:R.RES_K}), deal({}, {cash:20, metal:R.RES_K})]){ const { a } = foot(D); ok(a.act === 'decline' && a.why === 'We give nothing for nothing', 'goods for nothing refused: ' + a.why); }

// 3. a province it does not want is not something back: refused with both reasons (before: "This is what we can agree", money for nothing)
{ const far = G.P.filter(P => !P.sea && !P.city && S.owner[P.id] > 1 && S.owner[P.id] !== 5 && !R.isCapital(P.id) && !P.nbs.some(v => S.owner[v] === CA)).map(P => P.id), mine = [];
  for (const p of far){ const o = S.owner[p]; S.owner[p] = US; if (R.terrWant(CA, p, US) <= 0){ mine.push(p); break; } S.owner[p] = o; }   // (land the US took far from Canada)
  ok(mine.length === 1, 'a province Canada does not want'); if (mine.length){ const back = {cash:40, oil:R.RES_K}, { a } = foot(deal({provs:[mine[0]]}, back)), v0 = R.dealValue(US, CA, R.dealNorm(deal({}, back))).v;   // (money and goods: one province for money alone is a territory sale)
    ok(v0 < 10, 'without the province its opinion no longer pays for it either: ' + v0);
    ok(a.act === 'decline' && /not interested in .*\. We give nothing for nothing$/.test(a.why), 'unwanted land is nothing back: ' + a.act + ' ' + a.why); SUM.push(`unwanted province for $40M and 1 lot of oil: ${a.act} (${a.why})`); } }

// 4. judged as before: a fair trade, a gift to it, a treaty it wants, a deal with a little back
{ const fair = deal({cash:120}, {oil:R.RES_K}), { p, a } = foot(fair);
  ok(a.act === 'accept' && /accept/i.test(p.text), 'a fair trade is accepted as before: ' + a.act + ' ' + a.why + ' / ' + p.text); SUM.push(`fair trade ($120M for 1 lot of oil): ${a.act} (${a.why}); footer "${p.text}"`);
  const near = deal({cash:10}, {oil:4*R.RES_K}), b = foot(near).a; ok(b.act !== 'decline' || b.why !== 'We give nothing for nothing', 'a near deal is not a nothing-back deal: ' + b.act + ' ' + b.why);
  const gift = foot(deal({cash:30})).a; ok(gift.act === 'accept', 'a gift to it is accepted: ' + gift.why);
  const nap = foot(deal({}, {}, ['nap'])).a; ok(nap.act === 'accept' || nap.why !== 'We give nothing for nothing', 'a treaty-only deal is judged as before: ' + nap.act + ' ' + nap.why);
  const some = foot(deal({cash:5}, {cash:40})).a; ok(some.why !== 'We give nothing for nothing', 'something back: judged as before (' + some.act + ' ' + some.why + ')'); }

// 5. D10 tightened: token payments, and repeated favours to the same seat
{ const sum = D => R.dealNorm(D);
  for (const [n, D] of [['$1M for $40M', deal({cash:1}, {cash:40})], ['$1M for $75M', deal({cash:1}, {cash:75})], ['$30M + a NAP for nothing', deal({}, {cash:30}, ['nap'])]]){
    const { p, a } = foot(D); ok(a.act !== 'accept', n + ' is not accepted: ' + a.act + ' ' + a.why);
    if (a.act === 'counter'){ const C = a.D, v = R.dealValue(US, CA, C); ok(v.v >= 10, n + ': its counter is one it signs: ' + v.v);
      ok(C.get.cash > C.give.cash, n + ': in its counter it still gives something: ' + JSON.stringify({gives:C.get.cash, you:C.give.cash}));
      ok(C.get.cash*1.05 <= v.back*1.25 + 1e-9, n + ': in its counter it gives at most about 16% more than it gets back: ' + JSON.stringify({gives:C.get.cash, back:v.back})); }
    if (a.act === 'decline' && a.want){ const W = sum(D); W.give.cash += a.want; ok(R.dealAnswer(US, CA, W).act === 'accept', n + `: adding the $${a.want}M it wants is a yes`);
      W.give.cash -= 10; ok(R.dealAnswer(US, CA, W).act !== 'accept', n + `: $10M less than it wants is not (${a.want})`); }
    SUM.push(`${n}: ${a.act} (${a.why})${a.act === 'counter' ? ` -> you give $${a.D.give.cash}M${a.D.give.treaty.length ? ' + ' + a.D.give.treaty.join(',') : ''}, Canada gives $${a.D.get.cash}M` : ''}; footer "${p.text}"`); }
  { const a = foot(deal({cash:1}, {cash:40})).a; ok(a.act === 'decline' && a.want === 40, '$1M for $40M: no counter in which it gives nothing, it wants $40M more: ' + JSON.stringify({act:a.act, want:a.want})); }
  // the line: $40M for $40M and $34M for $40M (15% less) are a yes, $32M for $40M (20% less) is not (its only counter would give you nothing)
  for (const [x, act] of [[40, 'accept'], [34, 'accept'], [32, 'decline']]){ const { a } = foot(deal({cash:x}, {cash:40})); ok(a.act === act, `$${x}M for $40M: ${act} expected, got ${a.act} (${a.why})`); }
  // repeated favours: the cheapest price Canada accepts for $40M of its money, proposed and signed 5 times within 72 hours
  const cheapest = (q = 40) => { for (let x = 1; x <= 2*q; x++) if (R.dealAnswer(US, CA, sum(deal({cash:x}, {cash:q}))).act === 'accept') return x; return null; };
  const prices = []; let gain = 0;
  for (let i = 0; i < 5; i++){ const x = cheapest(); prices.push(x); const c0 = S.nations[US].cash, r = R.dealPropose(US, CA, deal({cash:x}, {cash:40}));
    ok(r.act === 'accept', `favour ${i + 1}: $${x}M for $40M accepted (${r.act} ${r.why})`); gain += S.nations[US].cash - c0; S.hour += 6; }
  SUM.push(`cheapest price for $40M of Canada's money, 5 deals 6 hours apart: ${prices.map(x => '$' + x + 'M').join(', ')}; total gain $${Math.round(gain)}M; favours noted ${S.favours.length}`);
  ok(prices[0] === 34 && prices[1] > prices[0] && prices.slice(2).every(x => x >= 42), 'favours get dearer, then only a deal that pays its way: ' + prices);
  ok(S.favours.length === 2, 'only the deals in which it gave more than it got are favours: ' + S.favours.length);
  ok(gain <= 10, 'the total gain from repeated favours is small: ' + gain);
  { const a = foot(deal({cash:40}, {cash:40})).a; ok(a.act !== 'accept', 'after 2 favours even $40M for $40M is no longer a yes');
    ok(/We have done you 2 favours in the last 3 days: this one must pay its way/.test(a.why), 'it says why: ' + a.why); SUM.push(`after 2 favours, $40M for $40M: ${a.act} (${a.why})`); }
  ok(foot(deal({cash:120}, {oil:R.RES_K})).a.act === 'accept', 'a generous trade still passes after the favours');
  // a trade at world price (plus its 5%) still passes after the favours
  { const P = R.mktP(), lot = k => R.lotCash(R.RES_K, P[k]); ok(foot(deal({cash:Math.ceil(lot('oil')*1.05*10)/10}, {oil:R.RES_K})).a.act === 'accept', 'buying 1 lot of oil at world price + 5% after the favours'); }
  // 72 hours after the last favour: the same price as at first
  S.hour += 72; ok(cheapest() === prices[0], 'after 72 hours the first price again: ' + cheapest());
  // the counter-offer path: accepting its counter is a favour too; a second counter made before it then lapses, with plain words
  { const r = R.dealPropose(US, CA, deal({cash:30}, {cash:45})), r2 = R.dealPropose(US, CA, deal({cash:30}, {cash:45}));
    ok(r.act === 'counter' && r.o && r2.act === 'counter' && r2.o, '$30M for $45M, twice: two counter-offers ' + r.act + ' ' + r.why);
    if (r.o && r2.o){ const x = R.offerAct(US, 'deal', r.o.id, 'accept'); ok(x.ok, 'its counter accepted: ' + JSON.stringify(x));
      ok(S.favours.length === 1 && S.favours[0].ai === CA && S.favours[0].me === US, 'the favour is noted, the older ones pruned: ' + JSON.stringify(S.favours));
      SUM.push(`$30M for $45M: counter "${r.why}" (you give $${r.o.D.get.cash}M, Canada gives $${r.o.D.give.cash}M), accepted: favour noted`);
      const y = R.offerAct(US, 'deal', r2.o.id, 'accept'); ok(!y.ok && y.why === 'after your last deal with them this offer no longer stands', 'the second counter lapses with plain words: ' + JSON.stringify(y));
      SUM.push(`the second, identical counter, accepted after the first: ${y.ok ? 'signed' : 'refused: ' + y.why}`); } }
  // a gift to it is no favour; saves from before the ledger (no S.favours) answer as with none
  { const n0 = S.favours.length; R.dealPropose(US, CA, deal({cash:30})); ok(S.favours.length === n0, 'a gift to it is no favour'); }
  S.hour += 72; Reflect.deleteProperty(S, 'favours'); const s0 = api.saveJSON();
  ok(foot(deal({cash:34}, {cash:40})).a.act === 'accept', 'an old save without the ledger: no favours');
  ok(api.saveJSON() === s0 && JSON.parse(s0).favours === undefined, 'the answer and the footer write nothing (no ledger until a favour)');
  // trades at world price, either way, are no favours: a friend keeps trading at its price (critics: one fair trade stopped trading for 72 h)
  { S.hour += 72; const P = R.mktP(), lot = k => R.lotCash(R.RES_K, P[k]), fav0 = (S.favours || []).length, seen = [];
    S.nations[US].oil += 20*R.RES_K; S.nations[US].metal += 20*R.RES_K; S.nations[CA].oil += 20*R.RES_K; S.nations[CA].iron += 20*R.RES_K; S.nations[CA].cash += 500; S.nations[US].cash += 500;
    for (let i = 0; i < 5; i++){
      for (const [n, D] of [['buy 1 lot of oil at world price', deal({cash:Math.round(lot('oil')*10)/10}, {oil:R.RES_K})], ['sell 1 lot of oil at world price', deal({oil:R.RES_K}, {cash:Math.floor(lot('oil')*10)/10})],
        ['sell 10 lots of oil for 95%', deal({oil:10*R.RES_K}, {cash:Math.floor(lot('oil')*9.5)})], ['swap 1 lot of metal for 1 lot of iron', deal({metal:R.RES_K}, {iron:R.RES_K})]]){
        const a = foot(D).a, r = R.dealPropose(US, CA, D); ok(r.act === 'accept', `${n}, time ${i + 1}: accepted (${a.act} ${a.why})`); if (!i) seen.push(`${n}: ${r.act}`); }
      S.hour += 2; }
    ok((S.favours || []).length === fav0, 'trades at world price are no favours: ' + JSON.stringify(S.favours));
    SUM.push(`5 rounds of trades at world price: ${seen.join('; ')}; all 20 accepted, favours noted ${(S.favours || []).length - fav0}`); }
  // large favours get dearer too (critics: the second $900M favour cost the same as the first)
  { S.hour += 72; S.nations[US].cash += 3000; S.nations[CA].cash += 3000; const big = [];
    for (let i = 0; i < 3; i++){ let x = 700; while (R.dealAnswer(US, CA, sum(deal({cash:x}, {cash:900}))).act !== 'accept') x++; big.push(x); R.dealPropose(US, CA, deal({cash:x}, {cash:900})); S.hour += 6; }
    ok(big[1] > big[0] && big[2] > big[1] && big[2] >= 945, '$900M favours get dearer each time: ' + big); SUM.push(`cheapest price for $900M, 3 times: ${big.map(x => '$' + x + 'M').join(', ')}`); } }

// 7. loops the critics found: an alliance signed for money and left again, and goodwill from a run of token deals
{ S.hour += 72; const AL = S.nations.find(N => N.alive && N.id !== US && N.id !== CA && R.score(US) <= 2*R.score(N.id) && !(S.devPeople || {})[N.id]);
  const EN = S.nations.find(N => N.alive && N.id !== US && N.id !== CA && AL && N.id !== AL.id);
  ok(AL && EN, 'a partner of a fair size and a common enemy');
  if (AL && EN){ const al = AL.id; R.setRel(US, EN.id, 'war'); R.setRel(al, EN.id, 'war'); R.setRel(US, al, 'peace'); R.addMem(al, US, 200);
    const a0 = R.acceptOffer(al, US, 'ally'); ok(a0.ok, 'it would ally: ' + a0.why);
    const c0 = S.nations[US].cash, r1 = R.dealPropose(US, al, deal({}, {cash:30}, ['ally'])); ok(r1.act === 'accept' && R.alliesOf(US).includes(al), 'an alliance with $30M from it: ' + r1.act + ' ' + r1.why);
    R.blocLeave(US); ok(!R.alliesOf(US).includes(al), 'the seat left the alliance');
    const a1 = R.acceptOffer(al, US, 'ally'); ok(!a1.ok && /you left our alliance: we will consider a new one in 20 d/.test(a1.why), 'no new alliance at once: ' + a1.why);
    const r2 = R.dealPropose(US, al, deal({}, {cash:30}, ['ally'])); ok(r2.act !== 'accept' && !R.alliesOf(US).includes(al), 'the alliance-for-money deal again: refused: ' + r2.act + ' ' + r2.why);
    SUM.push(`alliance + $30M from ${AL.name}: ${r1.act}; left; at once again: ${r2.act} (${r2.why}); seat gained $${Math.round(S.nations[US].cash - c0)}M`);
    S.hour += 20*24; ok(R.acceptOffer(al, US, 'ally').ok, 'after 20 days it would ally again: ' + R.acceptOffer(al, US, 'ally').why); }
  // goodwill: three $1M gifts within a day add +4 once, a gift the next day +4 again
  { const m0 = R.mem(CA, US); R.addMem(CA, US, 50 - m0); const g0 = R.mem(CA, US); for (let i = 0; i < 3; i++){ R.dealPropose(US, CA, deal({cash:1})); S.hour += 1; }
    const g1 = R.mem(CA, US); ok(g1 - g0 === 4, 'three token gifts in a day: +4 once: ' + (g1 - g0)); S.hour += 24; R.dealPropose(US, CA, deal({cash:1}));
    ok(R.mem(CA, US) - g1 === 4, 'the next day: +4 again: ' + (R.mem(CA, US) - g1)); SUM.push(`goodwill from 3 token gifts in a day: +${g1 - g0}; next day +${R.mem(CA, US) - g1}`); R.addMem(CA, US, 200); } }

// 6. the same at any opinion: a cold Canada refuses money for nothing with the same reason
R.addMem(CA, US, -400); { const { a } = foot(deal({}, {cash:50})); ok(a.act === 'decline' && a.why === 'We give nothing for nothing', 'cold: the same reason: ' + a.why); }

console.log(SUM.join('\n')); console.log(errors.length ? 'FAIL\n  ' + errors.join('\n  ') : 'd10: all checks passed');
process.exit(errors.length ? 1 : 0);
