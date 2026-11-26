// D10 (owner, 2026-11-26): a computer nation refuses a deal in which it gives something and gets nothing back, whatever it thinks of you.
// Plain Node, no browser:   node .test/d10.js
// money or goods for nothing from a friendly computer nation -> refused with the reason, no counter-offer, nothing moves; an unwanted province
// does not count as something back; a fair trade, a gift to it and a treaty it wants are judged as before; the trade builder's footer
// (dealPreview) says what the answer will be.
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n')
  + '\nreturn {IM, dealNorm, dealAnswer, dealValue, dealPreview, dealPropose, threadView, setRel, opinion, addMem, emptySide, terrWant, isCapital, RES_K};';
const SUM = [], errors = [], ok = (c, msg) => { if (!c) errors.push(msg); }, R = new Function(SRC)(), api = R.IM.api;
api.newGame(4242, 0, [0, 5]); const S = api.S, G = api.G; S.started = true;
const US = 0, CA = 1;
const side = (o = {}) => ({...R.emptySide(), ...o}), deal = (give = {}, get = {}, treaty = []) => ({give:side(give), get:side(get), treaty});
const lastReply = () => { const L = R.threadView(US, CA).items.filter(e => e.from === CA && e.t === 'msg'); return L.length ? L[L.length - 1].text : ''; };
const foot = D => { const p = R.dealPreview(US, CA, D), a = R.dealAnswer(US, CA, D); ok(p.verdict === a.act, `footer agrees with the answer: ${p.verdict} vs ${a.act} (${p.text})`); return {p, a}; };

// Canada likes the US as much as it can
R.setRel(US, CA, 'peace'); R.addMem(CA, US, 200); const op = R.opinion(CA, US); SUM.push(`Canada's opinion of the US: ${Math.round(op)}`);
ok(op >= 60, 'Canada is friendly: ' + op);

// 1. money for nothing: before D10 its opinion alone made this a yes (value >= 10); now refused with the reason, no counter-offer
{ const D = deal({}, {cash:50}), v = R.dealValue(US, CA, R.dealNorm(D)).v; SUM.push(`$50M for nothing: value to Canada ${Math.round(v)} (yes at 10 before D10)`);
  ok(v >= 10, 'the case D10 is about: its opinion alone pays for it (' + v + ')');
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
    ok(v0 >= 10, 'without the province its opinion would pay for it: ' + v0);
    ok(a.act === 'decline' && /not interested in .*\. We give nothing for nothing$/.test(a.why), 'unwanted land is nothing back: ' + a.act + ' ' + a.why); SUM.push(`unwanted province for $40M and 1 lot of oil: ${a.act} (${a.why})`); } }

// 4. judged as before: a fair trade, a gift to it, a treaty it wants, a deal with a little back
{ const fair = deal({cash:120}, {oil:R.RES_K}), { p, a } = foot(fair);
  ok(a.act === 'accept' && /accept/i.test(p.text), 'a fair trade is accepted as before: ' + a.act + ' ' + a.why + ' / ' + p.text); SUM.push(`fair trade ($120M for 1 lot of oil): ${a.act} (${a.why}); footer "${p.text}"`);
  const near = deal({cash:10}, {oil:4*R.RES_K}), b = foot(near).a; ok(b.act !== 'decline' || b.why !== 'We give nothing for nothing', 'a near deal is not a nothing-back deal: ' + b.act + ' ' + b.why);
  const gift = foot(deal({cash:30})).a; ok(gift.act === 'accept', 'a gift to it is accepted: ' + gift.why);
  const nap = foot(deal({}, {}, ['nap'])).a; ok(nap.act === 'accept' || nap.why !== 'We give nothing for nothing', 'a treaty-only deal is judged as before: ' + nap.act + ' ' + nap.why);
  const some = foot(deal({cash:5}, {cash:40})).a; ok(some.why !== 'We give nothing for nothing', 'something back: judged as before (' + some.act + ' ' + some.why + ')'); }

// 5. the same at any opinion: a cold Canada refuses money for nothing with the same reason
R.addMem(CA, US, -400); { const { a } = foot(deal({}, {cash:50})); ok(a.act === 'decline' && a.why === 'We give nothing for nothing', 'cold: the same reason: ' + a.why); }

console.log(SUM.join('\n')); console.log(errors.length ? 'FAIL\n  ' + errors.join('\n  ') : 'd10: all checks passed');
process.exit(errors.length ? 1 : 0);
