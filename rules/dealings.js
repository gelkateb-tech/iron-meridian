// Iron Meridian rules: dealings between nations (owner point 14, 2026-11-25). No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
// What the Diplomacy screens read and do, kept in the rules so a later server runs the same code:
//   - leaders: the invented head of government of each computer nation (display only, never a real politician)
//   - people: the person playing a seat (name, motto, an id for friends), the friends list and who a seat has muted (stored with the game, D3)
//   - conversations: one thread per pair (a seat's desk chat): messages, offer cards and system cards (treaties, sales, wars), unread counts
//   - trades: one deal of money, goods, cities and provinces (every territory rule of rules/territory.js) and treaties both sides sign, checked by
//     dealWhy; a computer nation answers at once (accept, decline or a deterministic counter-offer, dealAnswer; never yes when it gets nothing back,
//     D10); a person gets the offer for 2 days
//   - the screen's pure readers (relInfo, relMenu, natStatsAll, knownArmy, warList, threads, threadView, offersWith, dealPreview): they write nothing
//   - the actions the page used to do itself (aid, tribute, coalition rename and leave, embargo, treaty proposals, offer answers, mark read)
// State (all lazy: an old save has none of it and loads as it is): S.ppl {n:{name, motto, pid, since}}, S.deals [open offers to and from people,
// and a computer nation's counter-offers], a seat's desk .mute {n:true} and .friends [pid]. Chat entries keep the old {from, text, h}; offer and
// system entries add t:'offer' / t:'sys'.
'use strict';

/* ---------------- Leaders (invented; checked one by one against heads of state and politicians, none matched) ---------------- */
const LEADERS = {
  'United States':'Douglas Whitcomb', 'Canada':'Graham Thibodeau', 'Brazil':'Helena Monteiro Assis', 'United Kingdom':'Eleanor Ashcombe', 'France':'Laurent Dessaigne',
  'Germany':'Katrin Wendler', 'Russia':'Vadim Korsunov', 'Turkey':'Levent Oralkan', 'Iran':'Kaveh Mobarez', 'Egypt':'Hossam Wahdan', 'South Africa':'Kagiso Ntuli',
  'India':'Vikram Sabnis', 'China':'Liang Wenhao', 'Japan':'Itsuki Moriwaki', 'Australia':'Callum Ashworth', 'Italy':'Lorenzo Cavalieri', 'Spain':'Inés Montalbetti',
  'Poland':'Konrad Zalewicz', 'Ukraine':'Taras Velychko', 'Romania':'Andrei Văleanu', 'Sweden':'Henrik Lindqvist', 'Norway':'Sigrid Vollaneset', 'Finland':'Aino Järvelä',
  'Greece':'Stavros Mavrakis', 'Belarus':'Ales Zhuravsky', 'Saudi Arabia':'Hamoud al-Shamri', 'Iraq':'Ziad Hamdani', 'Syria':'Rafiq Dabbouri', 'Yemen':'Jalal Samawati',
  'Israel':'Avner Gilboa', 'Algeria':'Samir Ouali', 'Morocco':'Hamza Tazi', 'Libya':'Salem Zawi', 'Nigeria':'Tunde Adeyemi', 'Ethiopia':'Dawit Tesfaye', 'Sudan':'Hatim Elnour',
  'DR Congo':'Didier Mwamba', 'Angola':'Mateus Kiluange', 'Kenya':'Otieno Wafula', 'Tanzania':'Baraka Mfinanga', 'Mali':'Moussa Kébalou', 'Chad':'Abakar Zakaria',
  'Mozambique':'Celso Mabunda', 'Cameroon':'Etienne Ndongo', 'Pakistan':'Farhan Siddiqui', 'Bangladesh':'Tanvir Haque', 'Indonesia':'Adi Santoso', 'South Korea':'Baek Do-hyun',
  'North Korea':'Ryang Gwang-il', 'Vietnam':'Hoàng Minh Khôi', 'Thailand':'Kittipong Sirivat', 'Myanmar':'Zaw Lin Oo', 'Philippines':'Rafael Dimaculangan', 'Malaysia':'Hafiz Rahmat',
  'Kazakhstan':'Daulet Seitkali', 'Uzbekistan':'Bekzod Tursunov', 'Afghanistan':'Farid Mohseni', 'Mongolia':'Temuulen Batsaikhan', 'Mexico':'Rubén Garduño',
  'Argentina':'Facundo Etcheverry', 'Colombia':'Andrés Galvis', 'Venezuela':'Rodrigo Valecillos', 'Peru':'Renato Llacsahuanca', 'Chile':'Matías Valdebenito',
  'Bolivia':'Wilfredo Condori', 'Ecuador':'Esteban Salcedo', 'Cuba':'Reinaldo Montoto', 'New Zealand':'Hemi Calloway' };
const leaderOf = n => { const N = S.nations[n]; return (N && LEADERS[N.name]) || 'Head of government'; };

/* ---------------- People: who plays a seat (D3: stored with the game; an online server fills S.ppl from accounts) ---------------- */
const PPL_NAME = 24, PPL_MOTTO = 80;
const cleanText = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
// the person playing nation n, or null for a computer nation: {name, motto, pid, since, seat:true}
function personOf(n){ if (!(n >= 0) || !S.nations[n]) return null;
  if (isSeat(n)){ const P = (S.ppl && S.ppl[n]) || {}; return {name:P.name || 'Commander', motto:P.motto || '', pid:P.pid || 'local:' + n, since:P.since || 0, seat:true}; }
  /*@DEV*/{ const F = S.devPeople && S.devPeople[n]; if (F) return {name:F.name, motto:F.motto, pid:'dev:' + F.name, since:F.since || 0, seat:false, dev:true}; }/*@ENDDEV*/
  return null; }
const isPerson = n => !!personOf(n);
// a seat sets the person's name and motto (sanitised: name 1 to 24 characters, motto up to 80); pid stays once set
function seatInfo(n, info){ if (!isSeat(n) || !info) return false; const P = (S.ppl || (S.ppl = {}))[n] || (S.ppl[n] = {pid:'local:' + n, since:S.hour});
  if (info.name != null){ const v = cleanText(info.name, PPL_NAME); if (!v) return false; P.name = v; }
  if (info.motto != null) P.motto = cleanText(info.motto, PPL_MOTTO);
  if (info.pid != null && (!P.pid || /^local:/.test(P.pid))){ const v = cleanText(info.pid, 64); if (v) P.pid = v; }
  return true; }
// a seat's desk as it stands, written nowhere (desk() makes a missing desk of a second seat)
const deskView = n => { for (const N of S.nations) if (!N.ai){ if (N.id === n) return S; break; } return (S.desks && S.desks[n]) || {}; };
const isMuted = (me, n) => !!(deskView(me).mute && deskView(me).mute[n]);
// mute or unmute person n for seat me (their messages and trade offers are hidden and not counted; war declarations still show)
function muteSet(me, n, on){ if (!isSeat(me) || me === n || !isPerson(n)) return false; const D = desk(me), M = D.mute || (D.mute = {});
  if (on) M[n] = true; else delete M[n]; if (!on && D.unread) D.unread[n] = 0; return true; }
const friendsOf = me => (deskView(me).friends || []).slice();
// add or remove a friend (a person id: friends follow the person, not the nation)
function friendSet(me, pid, on){ if (!isSeat(me)) return false; pid = cleanText(pid, 64); if (!pid) return false; const D = desk(me), L = D.friends || (D.friends = []), i = L.indexOf(pid);
  if (on && i < 0){ if (L.length >= 200) return false; L.push(pid); } else if (!on && i >= 0) L.splice(i, 1); return true; }

/* ---------------- Conversations ---------------- */
// an entry in seat me's thread with nation n (offers and system cards; messages go through say, rules/diplomacy.js). unread: count it for me
function noteAdd(me, n, e, unread){ if (!isSeat(me) || me === n || !(n >= 0)) return null; const L = chatLog(me, n); e.h = S.hour; L.push(e); if (L.length > 60) L.shift();
  if (unread && (!isMuted(me, n) || e.k === 'war')){ const D = desk(me); (D.unread || (D.unread = {}))[n] = ((D.unread || {})[n] || 0) + 1; } return e; }
// a system card for both sides that are seats (k: 'war', 'treaty', 'sale', 'trade'); a war card counts unread for the side it hits
function sysNote(a, b, text, k = '', hit = -1){ for (const [me, n] of [[a, b], [b, a]]) noteAdd(me, n, {t:'sys', k, text, from:-1}, k === 'war' && me === hit); }
// an offer card for both sides that are seats: src 'treaty' / 'trade' (a computer nation's desk offer), 'deal' (S.deals), 'terr' (S.terr.offers).
// Each side's card is written from its own side: text(me) (a function) or the same text for both, and d, the deal from that side ({give, get})
function offerNote(o, src, text){ for (const [me, n] of [[o.from, o.to], [o.to, o.from]]){ if (!isSeat(me)) continue; const e = {t:'offer', src, id:o.id, from:o.from, to:o.to, exp:o.exp, text:typeof text === 'function' ? text(me) : text};
    if (o.D) e.d = me === o.from ? o.D : dealFlip(o.D); else if (src === 'terr') e.d = terrSides(o, me); noteAdd(me, n, e, me === o.to); } }
// a territory offer as a deal from seat me's side (the seller gives the province, the buyer the price)
const terrSides = (o, me) => { const D = {give:emptySide(), get:emptySide()}; if (o.seller === me){ D.give.provs = [o.p]; D.get.cash = o.price; } else { D.get.provs = [o.p]; D.give.cash = o.price; } return D; };
// an offer card's words from each side: 'Proposal: you give ...; they give ...'
const dealNoteText = (o, label) => me => `${label}: ${dealSay(me === o.from ? o.D : dealFlip(o.D), 'they')}.`;
// the status written on an offer card once it is settled ('accepted', 'declined', 'countered', 'withdrawn', 'void')
function offerSt(a, b, src, id, st){ for (const [me, n] of [[a, b], [b, a]]){ if (!isSeat(me)) continue; const L = (deskView(me).chat || {})[n]; if (!L) continue;
  for (const e of L) if (e.t === 'offer' && e.src === src && e.id === id) e.st = st; } }
// seat me has read its thread with n (writes only when something was unread)
function markRead(me, n){ const D = deskView(me); if (D.unread && D.unread[n]) D.unread[n] = 0; }
// seat me writes to nation n: to a person, into both threads; to a computer nation, its answer follows at once (aiReply). Returns {ok, reply}
function msgSend(me, n, text){ const t = cleanText(text, 160); if (!t || !isSeat(me) || me === n || !S.nations[n] || !S.nations[n].alive) return {ok:false, why:'nothing to send'};
  say(me, n, me, t);
  if (isSeat(n)){ say(n, me, me, t); return {ok:true}; }
  if (isPerson(n)) return {ok:true};
  const reply = aiReply(me, n, t); say(me, n, n, reply); markRead(me, n); return {ok:true, reply}; }

/* ---------------- Trades ---------------- */
// a deal is {give:side, get:side} from the proposer's side (give: what it hands over; get: what the other side hands over); a side is
// {cash, oil, metal, iron, elec, rare, provs:[], treaty:[]}. Treaties bind both sides: both lists hold the same treaties (dealNorm)
const TREATY_K = ['peace', 'nap', 'pass', 'ally'];
const TREATY_NAME = {peace:'Ceasefire (peace after 10 days)', nap:'Non-aggression pact (20 days)', pass:'Right of way', ally:'Alliance (shared intel)'};
// (a copy: amounts kept as given, so dealWhy can refuse a negative or a non-number; missing ones are 0; old saves' food is dropped)
const sideNorm = sd => { const o = {provs:Array.isArray(sd && sd.provs) ? sd.provs.slice() : [], treaty:Array.isArray(sd && sd.treaty) ? sd.treaty.slice() : []};
  for (const k of DEAL_K){ const v = sd ? sd[k] : null; o[k] = v == null || v === '' ? 0 : typeof v === 'number' ? v : Number(v); } return o; };
function dealNorm(D0){ const D = {give:sideNorm(D0 && D0.give), get:sideNorm(D0 && D0.get)};
  const T = [...new Set([...(D0 && D0.treaty || []), ...D.give.treaty, ...D.get.treaty])]; D.give.treaty = T.slice(); D.get.treaty = T.slice(); return D; }
const dealFlip = D => ({give:D.get, get:D.give});
// the deal in words, from the proposer's side ("you give $50M; they give Halifax; both sign: right of way")
const TREATY_SHORT = {peace:'ceasefire', nap:'non-aggression pact', pass:'right of way', ally:'alliance'};
function dealSay(D0, who = 'they'){ const D = dealNorm(D0), part = sd => [...DEAL_K.map(k => !(sd[k] > 0) ? '' : k === 'cash' ? `$${fmt(sd.cash)}M` : `${fmt(sd[k])} ${yword(k, sd[k])}`), ...sd.provs.map(provName)].filter(Boolean).join(', ') || 'nothing';
  const T = D.give.treaty; return `you give ${part(D.give)}; ${who} ${who === 'they' || who === 'you' ? 'give' : 'gives'} ${part(D.get)}${T.length ? `; both sign: ${T.map(k => TREATY_SHORT[k] || k).join(', ')}` : ''}`; }
const mktP = () => (S.mkt && S.mkt.p) || MKT_BASE;
// what a side's money and goods are worth at world prices ($M)
const sideCash = sd => { const P = mktP(); let v = 0; for (const k of DEAL_K) v += k === 'cash' ? +sd[k] || 0 : lotCash(+sd[k] || 0, P[k]); return v; };
const sideLand = sd => sd.provs.reduce((s0, p) => s0 + provValue(p), 0);
const dealEmpty = D => !D.give.treaty.length && !D.give.provs.length && !D.get.provs.length && DEAL_K.every(k => !(D.give[k] > 0) && !(D.get[k] > 0));
const hasGoods = sd => DEAL_K.some(k => sd[k] > 0);
// why nations a and b cannot sign treaty k now (null: they can)
function treatyWhy(a, b, k){ const st = relView(a, b).st;
  if (!TREATY_K.includes(k)) return 'unknown treaty';
  if (k === 'peace') return st === 'war' ? null : 'you are not at war';
  if (st === 'war') return 'you are at war: agree a ceasefire first';
  if (k === 'nap') return st === 'peace' || st === 'truce' ? null : st === 'nap' ? 'a non-aggression pact is already in force' : st === 'ally' ? 'you are allies' : 'right of way is in force';
  if (k === 'pass') return st === 'peace' || st === 'nap' ? null : st === 'pass' ? 'right of way is already in force' : st === 'ally' ? 'allies already have right of way' : 'not during a ceasefire';
  if (k === 'ally'){ if (st === 'ally') return 'you are already allies';
    // the alliance limits of acceptOffer (rules/diplomacy.js), for people too: 3 allies each at most, and a coalition of 4 members at most
    const allies = n => S.nations.reduce((c, m) => c + (m.alive && m.id !== n && relView(n, m.id).st === 'ally' ? 1 : 0), 0);
    if (allies(a) >= 3 || allies(b) >= 3) return `too many allies: ${allies(a) >= 3 ? S.nations[a].name : S.nations[b].name} has 3`;
    const BL = blocsView(), Ba = BL.find(B => B.members.includes(a)), Bb = BL.find(B => B.members.includes(b));
    if (!(Ba && Ba === Bb) && (Ba ? Ba.members.length : 1) + (Bb ? Bb.members.length : 1) > 4) return 'a coalition has 4 members at most';
    return null; }
  return null; }
// the lowest a side may receive for the provinces it gives (DIP-5 floors: 25% of the value, 10% between coalition partners after 3 days)
const floorFor = (seller, buyer, provs) => provs.reduce((s0, p) => s0 + terrMin(seller, buyer, p), 0);
// why the deal D between nations a (proposer; gives D.give) and b (gives D.get) cannot be made (null: it can)
function dealWhy(a, b, D){ const A = S.nations[a], B = S.nations[b];
  if (!A || !B || a === b) return 'no other side';
  if (!A.alive || !B.alive) return `${(A.alive ? B : A).name} is gone`;
  for (const sd of [D.give, D.get]){ for (const k of DEAL_K){ const v = sd[k]; if (v != null && v !== 0 && !(Number.isFinite(v) && v >= 0)) return 'amounts must be zero or more'; }
    if (!Array.isArray(sd.provs) || sd.provs.some(p => !Number.isInteger(p) || !G.P[p])) return 'unknown province'; }
  if (dealEmpty(D)) return 'the deal is empty';
  const all = [...D.give.provs, ...D.get.provs]; if (new Set(all).size !== all.length) return 'a province is listed twice';
  for (const k of DEAL_K){ const e = 0.01*(isGood(k) ? RES_K : 1); if ((D.give[k] || 0) > A[k] + e) return `${isSeat(a) ? 'you do' : A.name + ' does'} not have ${resFull(k, D.give[k])}`; if ((D.get[k] || 0) > B[k] + e) return `${B.name} does not have ${resFull(k, D.get[k])}`; }
  if (D.give.treaty.length > 1) return D.give.treaty.includes('peace') ? 'a ceasefire comes first: other treaties can follow it' : 'one treaty per deal: sign the next one in another deal';
  for (const k of D.give.treaty){ const w = treatyWhy(a, b, k); if (w) return `${TREATY_NAME[k] || k}: ${w}`; }
  if (D.get.provs.length && !isSeat(b)) return `${B.name} never sells land`;
  if (D.give.provs.length && !isSeat(a)) return `${A.name} never sells land`;
  if (all.length && atWar(a, b)) return 'no land changes hands during a war: the peace terms settle occupied land';
  if (embargoed(a, b) && (all.length || hasGoods(D.give) || hasGoods(D.get))) return 'an embargo is in force: only treaties can be agreed';
  for (const p of D.give.provs){ const w = terrWhyNot(a, p); if (w) return `${provName(p)}: ${w}`; }
  for (const p of D.get.provs){ const w = terrWhyNot(b, p); if (w) return `${provName(p)}: ${w.replace(/\byour\b/g, 'their').replace(/\byou\b/g, 'they')}`; }
  for (const [seller, buyer, gives, gets] of [[a, b, D.give, D.get], [b, a, D.get, D.give]]){ if (!gives.provs.length) continue;
    const mn = floorFor(seller, buyer, gives.provs), got = sideCash(gets) + sideLand(gets);
    if (got < mn) return `the lowest price for ${gives.provs.map(provName).join(', ')} is $${fmt(mn)}M (${Math.round(terrFloor(seller, buyer)*100)}% of the value); ${seller === a && isSeat(a) ? 'you would get' : S.nations[seller].name + ' would get'} $${fmt(got)}M`; }
  return null; }
// what computer nation ai thinks of the deal D from seat me (D from me's side): its value to ai ($M; it says yes at 10 or more), and the firm
// no's: parts it will not take at any price (land it does not want, an alliance it refuses, its own land)
const DEAL_OK = 10;
// what treaty k is worth to computer nation ai, signed with me ($M; null: an alliance it refuses at any price)
function treatyValue(me, ai, k){ const a = acceptOffer(ai, me, k), op = opinion(ai, me);
  if (k === 'peace') return a.ok ? 60 : -(140 + natPower(ai)*0.4);
  if (k === 'nap') return a.ok ? 20 : -110;
  if (k === 'pass') return (a.ok ? -10 : op >= 0 ? -90 : -300) + 30;   // (right of way is mutual: it gives and receives it)
  if (k === 'ally') return a.ok ? 40 : null;
  return 0; }
// D10, tightened (owner, 2026-11-26: "a computer nation refuses deals where it gets nothing back"; a token payment must not get round it).
// What its opinion of you adds to a deal is capped by what it gets back: at most DEAL_OK + OP_SHARE x that value, so a friendly nation accepts
// at most about 16% less than it gives (it says yes when back x 1.25 >= what it gives x 1.05). Each favour it did the same seat in the last
// FAVOUR_H hours (a deal it signed that was below DEAL_OK on its own value: S.favours, written by dealApply) halves that cap, and from
// FAVOUR_MAX favours on its opinion adds nothing: a deal fair on its own value still passes. A cold opinion counts against you in full, as before.
const OP_SHARE = 0.25, FAVOUR_H = 72, FAVOUR_MAX = 2;
const favourL = () => Array.isArray(S.favours) ? S.favours : [];   // (saves from before the ledger have none: no favours)
const favourN = (ai, me) => favourL().reduce((c, f) => c + (f.ai === ai && f.me === me && S.hour - f.h < FAVOUR_H ? 1 : 0), 0);
function opCredit(me, ai, back){ const c = opinion(ai, me)*1.2; if (c <= 0) return c;
  const k = favourN(ai, me); return k >= FAVOUR_MAX ? 0 : Math.min(c, (DEAL_OK + OP_SHARE*back)/2**k); }
// {v: its value to ai with its opinion, own: without it, back: what ai gets back ($M: money, goods, land it wants, treaties worth something), firm}
function dealValue(me, ai, D){ const firm = []; let back = sideCash(D.give);
  let v = sideCash(D.give) - sideCash(D.get)*1.05;   // (as dealValueFor: what it gives counts 5% more)
  for (const p of D.give.provs){ const w = terrWant(ai, p, me); if (w <= 0) firm.push({k:'prov', p, why:`${S.nations[ai].name} is not interested in ${provName(p)}`}); else back += w; v += w; }
  for (const p of D.get.provs) firm.push({k:'own', p, why:`${S.nations[ai].name} never sells land`});
  for (const k of D.give.treaty){ const t = treatyValue(me, ai, k); if (t == null) firm.push({k:'treaty', t:k, why:`no alliance: ${acceptOffer(ai, me, k).why}`}); else { v += t; if (t > 0) back += t; } }
  return {v:v + opCredit(me, ai, back), own:v, back, firm}; }
// a computer nation that gives something in a deal it would not sign on its own value has done seat me a favour: noted for FAVOUR_H hours
// (older ones pruned). A gift to it is no favour
function favourNote(me, ai, D){ if (!aiGives(me, ai, D) || dealValue(me, ai, D).own >= DEAL_OK) return;
  S.favours = favourL().filter(f => S.hour - f.h < FAVOUR_H); S.favours.push({ai, me, h:S.hour}); }
// D10 (owner, 2026-11-26): a computer nation gives nothing for nothing, whatever it thinks of you. True when, in deal D from seat me, computer
// nation ai gives something (money, goods, its land, or a treaty that costs it) and gets nothing of value back (no money or goods, no land it
// wants, no treaty worth something to it). Its own gifts and offers (coalition aid, the trades it proposes to you) do not come here.
// (aiGives: it gives money, goods, its land, or signs a treaty that costs it)
const aiGives = (me, ai, D) => sideCash(D.get) > 0 || D.get.provs.length > 0 || D.give.treaty.some(k => (treatyValue(me, ai, k) || 0) < 0);
function dealOneWay(me, ai, D){ if (!aiGives(me, ai, D)) return false;
  return !(sideCash(D.give) > 0 || D.give.provs.some(p => terrWant(ai, p, me) > 0) || D.give.treaty.some(k => (treatyValue(me, ai, k) || 0) > 0)); }
const NOTHING_BACK = 'We give nothing for nothing';
const dealSame = (A, B) => JSON.stringify(dealNorm(A)) === JSON.stringify(dealNorm(B));
// computer nation ai's answer to seat me's deal D (round: 1 for a first offer, +1 for each counter on either side). Pure: decides, changes nothing.
// {act:'accept'|'counter'|'decline', why, D (the deal it would sign: the same, or its counter-offer), want ($M it still misses on a decline)}
function dealAnswer(me, ai, D0, round = 1){ const D = dealNorm(D0), A = S.nations[ai], name = A ? A.name : 'They';
  const no = (why, want = 0) => ({act:'decline', why, D, want});
  if (!A || !A.alive || isSeat(ai)) return no('no computer nation to answer');
  // 1: a deal that cannot be made is declined with the reason (its own land aside: that comes out below)
  { const D1 = dealNorm(D); D1.get.provs = []; if (dealEmpty(D1)) return no(`${name} never sells land`); const w = dealWhy(me, ai, D1); if (w) return no(w); }
  // 2: its firm no's come out (its own land, land it does not want, an alliance it refuses)
  const v0 = dealValue(me, ai, D); let changed = false; const drop = [];
  for (const f of v0.firm){ changed = true; drop.push(f.why);
    if (f.k === 'prov') D.give.provs = D.give.provs.filter(p => p !== f.p); else if (f.k === 'own') D.get.provs = D.get.provs.filter(p => p !== f.p);
    else if (f.k === 'treaty'){ D.give.treaty = D.give.treaty.filter(k => k !== f.t); D.get.treaty = D.give.treaty.slice(); } }
  if (changed && dealEmpty(D)) return no(drop[0]);
  { const w = dealWhy(me, ai, D); if (w) return no(w); }
  // D10: it gives and gets nothing back: no, at any opinion (and no counter-offer of its own: you make the next one)
  if (dealOneWay(me, ai, D)) return no(drop.length ? `${drop.join('; ')}. ${NOTHING_BACK}` : NOTHING_BACK);
  // 3: the floor on the land it buys: its money and goods must reach it
  if (D.give.provs.length){ const mn = floorFor(me, ai, D.give.provs), got = sideCash(D.get);
    if (got < mn){ const need = Math.ceil(mn - got); if (D.get.cash + need > A.cash) return no(`${name} cannot pay the lowest price, $${fmt(mn)}M`); D.get.cash += need; changed = true; } }
  let V = dealValue(me, ai, D).v;
  const why = () => { const t = D.give.treaty[0]; if (t) return acceptOffer(ai, me, t).why || 'a fair exchange';
    const gain = sideCash(D.give) + sideLand(D.give) - sideCash(D.get)*1.05; return gain > Math.max(50, sideCash(D.get)) ? 'a generous offer' : 'a fair exchange'; };
  if (V >= DEAL_OK) return changed ? (round >= TERR.rounds ? no('Enough counter-offers: accept or decline') : {act:'counter', why:`${drop.length ? drop.join('; ') + '. ' : ''}This is what we can agree`, D}) : {act:'accept', why:`Agreed: ${why()}`, D};
  // 5: the gap, rounded up to $10M; too far apart is not a serious offer
  const gap0 = Math.ceil((DEAL_OK - V)/10)*10, traded = sideCash(D.give) + sideCash(D.get) + sideLand(D.give) + sideLand(D.get);
  if (gap0 > Math.max(60, traded/2)) return no('That is not a serious offer', gap0);
  if (round >= TERR.rounds) return no('Enough counter-offers: accept or decline', gap0);
  const P = mktP(), N = S.nations[me], lot = k => lotCash(RES_K, P[k]), emb = embargoed(me, ai);
  const mn = D.give.provs.length ? floorFor(me, ai, D.give.provs) : 0, keepFloor = dv => sideCash(D.get) - dv >= mn - 1e-9;
  // a: it gives less: its goods, whole lots, the dearest lot first, then its money in $10M steps (never under the floor). V is worked out again
  // after each step: what its opinion adds depends on what it gets back
  const val = () => dealValue(me, ai, D).v;
  for (const k of DEAL_K.filter(k => k !== 'cash').sort((x, y) => P[y] - P[x])){ while (V < DEAL_OK && D.get[k] >= RES_K && keepFloor(lot(k))){ D.get[k] -= RES_K; V = val(); changed = true; } }
  while (V < DEAL_OK && D.get.cash > 0){ const s = Math.min(10, D.get.cash); if (!keepFloor(s)) break; D.get.cash -= s; V = val(); changed = true; }
  // b: you add money in $10M steps, up to what you have
  if (!emb) while (V < DEAL_OK && D.give.cash + 1e-9 < Math.floor(N.cash)){ const s = Math.min(10, Math.floor(N.cash) - D.give.cash); D.give.cash += s; V = val(); changed = true; }
  // c: you add goods, whole lots, the good you hold the most value of first
  if (!emb) for (const k of DEAL_K.filter(k => k !== 'cash').sort((x, y) => kFloor(N[y])*P[y] - kFloor(N[x])*P[x])){ while (V < DEAL_OK && D.give[k] + RES_K <= kFloor(N[k])){ D.give[k] += RES_K; V = val(); changed = true; } }
  if (V < DEAL_OK) return no(`They want about $${fmt(Math.ceil((DEAL_OK - V)/10)*10)}M more`, Math.ceil((DEAL_OK - V)/10)*10);
  { const w = dealWhy(me, ai, D); if (w) return no(w, gap0); }
  return {act:'counter', why:`${drop.length ? drop.join('; ') + '. ' : ''}We would need about $${fmt(gap0)}M more in value`, D}; }
// exactly one province against money only: the territory path (rules/territory.js terrOffer: its own counters, rounds and log)
function dealIsLand(D){ const one = (sd, other) => sd.provs.length === 1 && !hasGoods({...sd, cash:0}) && !(sd.cash > 0) && !other.provs.length && !hasGoods({...other, cash:0}) && other.cash > 0;
  return !D.give.treaty.length && (one(D.give, D.get) || one(D.get, D.give)); }
// the deal itself between a (gives D.give) and b (gives D.get): money and goods, land (terrTransfer), treaties, goodwill, cards and dispatches
function dealApply(a, b, D0){ const D = dealNorm(D0), why = dealWhy(a, b, D); if (why){ refuse(a, `Not possible: ${why}.`); refuse(b, `Not possible: ${why}.`); return false; }
  const A = S.nations[a], B = S.nations[b], comp = n => !isSeat(n) && !isPerson(n);
  // (a favour is judged on the deal as it stands, before anything moves: its value depends on who holds the land)
  if (isSeat(a) && comp(b)) favourNote(a, b, D); else if (isSeat(b) && comp(a)) favourNote(b, a, dealFlip(D));
  for (const k of DEAL_K){ const d = (D.get[k] || 0) - (D.give[k] || 0); A[k] += d; B[k] -= d; }
  if (D.give.treaty.includes('peace')) applyDeal(a, b, 'peace');
  for (const [seller, buyer, gives, gets] of [[a, b, D.give, D.get], [b, a, D.get, D.give]]){ if (!gives.provs.length) continue;
    const pay = sideCash(gets), tot = sideLand(gives) || 1;
    for (const p of gives.provs){ const share = Math.round(pay*provValue(p)/tot); terrTransfer(seller, buyer, p, share); } }
  for (const k of D.give.treaty) if (k !== 'peace') applyDeal(a, b, k);
  addMem(b, a, 4); addMem(a, b, 4);
  const txt = dealSay(D, 'they');
  sysNote(a, b, `Trade agreed: ${txt}.`, 'trade');
  tell(a, `Trade with ${B.name} completed: ${dealSay(D, 'they')}.`, 'good', null); tell(b, `Trade with ${A.name} completed: ${dealSay(dealFlip(D), 'they')}.`, 'good', null);
  for (const p of [...D.give.provs, ...D.get.provs]) checkNation(S.owner[p] === a ? b : a, S.owner[p]);
  checkEnd(); return true; }
const dealsS = () => S.deals || (S.deals = []);
// the offer seat me counters with a new deal to n: it must be open and made to me by n. {o, round} (round: the countered offer's + 1), or null
function counterBase(me, n, co){ if (!co) return {o:null, round:1};
  if (co.src === 'deal'){ const o = (S.deals || []).find(x => x.id === co.id); return o && o.to === me && o.from === n ? {o, round:(o.n || 1) + 1} : null; }
  if (co.src === 'treaty' || co.src === 'trade'){ const o = (deskView(me).offers || []).find(x => x.id === co.id); return o && o.from === n ? {o, round:2} : null; }
  if (co.src === 'terr'){ const o = S.terr && S.terr.offers.find(x => x.id === co.id); return o && o.to === me && o.from === n ? {o, round:(o.n || 1) + 1} : null; }
  return null; }
// an offer made before the two went to war lapses (a ceasefire offer aside): offers made during the war stand
const dealStale = o => atWar(o.from, o.to) && !o.war0 && !(o.D && o.D.give.treaty.includes('peace'));
const DEAL_H = 48;   // an offer to a person stands 2 days
// seat me proposes deal D to nation n. opts: {counterOf:{src, id}} (a counter-offer replaces the offer it answers, which must be n's offer to me;
// its round is that offer's + 1). A computer nation answers at once; a person (or a territory sale between two seats) gets the offer. Returns {ok, act, why, o}
function dealPropose(me, n, D0, opts = {}){ const D = dealNorm(D0), N = S.nations[n];
  if (!isSeat(me)) return {ok:false, why:'not a seat'};
  if (!N || !N.alive || n === me) return {ok:false, why:'no other side'};
  const co = opts.counterOf, cb = counterBase(me, n, co); if (!cb) return {ok:false, why:'that offer is not yours to counter'};
  const round = cb.round, closeOld = () => { if (!co) return; offerClose(me, co.src, co.id, 'countered'); };
  // one province against money only: the territory sale (its offer, counters and log)
  if (dealIsLand(D) && (isSeat(n) || !isPerson(n))){ const sell = D.give.provs.length === 1, p = sell ? D.give.provs[0] : D.get.provs[0], price = sell ? D.get.cash : D.give.cash;
    if (co && co.src === 'terr'){ const o0 = S.terr && S.terr.offers.find(x => x.id === co.id), r = terrAnswer(me, co.id, 'counter', price); if (o0 && !S.terr.offers.includes(o0)) offerSt(o0.from, o0.to, 'terr', o0.id, 'countered');
      return {ok:!!(r.ok || r.countered || r.declined), act:r.done ? 'accept' : r.countered ? 'counter' : r.declined ? 'decline' : r.ok ? 'sent' : 'refused', why:r.why || '', o:r.o}; }
    const r = terrOffer(me, n, p, price, round); if (!r.ok && !r.countered && !r.declined) return {ok:false, why:r.why};
    closeOld();
    if (!isSeat(n)){ say(me, n, me, `Offer: ${sell ? 'we sell you' : 'we buy'} ${provName(p)} for $${fmt(price)}M.`); say(me, n, n, r.done ? 'Agreed. The land is ours.' : r.countered ? `Too much. We offer $${fmt(r.price)}M instead.` : `${r.why}.`); markRead(me, n); }
    return {ok:true, act:r.done ? 'accept' : r.countered ? 'counter' : r.declined ? 'decline' : 'sent', why:r.why || '', o:r.o}; }
  const why = isPerson(n) ? dealWhy(me, n, D) : (D1 => (D1.get.provs = [], dealEmpty(D1) ? `${N.name} never sells land` : dealWhy(me, n, D1)))(dealNorm(D));
  if (why){ refuse(me, `Not possible: ${why}.`); return {ok:false, why}; }
  closeOld();
  if (isPerson(n)){ const o = {id:S.nid++, from:me, to:n, D, n:round, h:S.hour, exp:S.hour + DEAL_H}; if (co) o.counterOf = co.id; if (atWar(me, n)) o.war0 = true;
    dealsS().push(o); offerNote(o, 'deal', dealNoteText(o, 'Proposal'));
    if (!isMuted(n, me)){ if (isSeat(n)) tell(n, `${personOf(me).name} (${S.nations[me].name}) sent you a trade offer. Answer in Diplomacy (D).`, 'info', null); IM.emit('deal', n, o); }   // (muted: kept in the thread, no dispatch)
    return {ok:true, act:'sent', o}; }
  // a computer nation: its answer now
  const ans = dealAnswer(me, n, D, round), mine = {id:S.nid++, from:me, to:n, exp:S.hour, n:round};
  noteAdd(me, n, {t:'offer', src:'deal', id:mine.id, from:me, to:n, exp:S.hour, text:`Proposal: ${dealSay(D, 'they')}.`, d:D, st:ans.act === 'accept' ? 'accepted' : ans.act === 'counter' ? 'countered' : 'declined'}, false);
  if (ans.act === 'accept'){ if (!dealApply(me, n, D)) return {ok:false, why:'the deal failed'}; say(me, n, n, `${ans.why}.`); markRead(me, n); return {ok:true, act:'accept', why:ans.why}; }
  if (ans.act === 'counter'){ const o = {id:S.nid++, from:n, to:me, D:dealFlip(ans.D), n:round + 1, h:S.hour, exp:S.hour + DEAL_H, counterOf:mine.id}; if (atWar(me, n)) o.war0 = true;
    dealsS().push(o); say(me, n, n, `${ans.why}.`); offerNote(o, 'deal', dealNoteText(o, 'Counter-offer')); markRead(me, n); return {ok:true, act:'counter', why:ans.why, o}; }
  say(me, n, n, `${ans.why}.`); markRead(me, n); return {ok:true, act:'decline', why:ans.why, want:ans.want}; }
// close an offer without carrying it out (st: the card's status)
function offerClose(me, src, id, st){ if (src === 'deal'){ const o = (S.deals || []).find(x => x.id === id && (x.from === me || x.to === me)); if (o){ S.deals = S.deals.filter(x => x !== o); offerSt(o.from, o.to, 'deal', id, st); } return; }
  if (src === 'treaty' || src === 'trade'){ const D = desk(me), o = (D.offers || []).find(x => x.id === id); if (o){ D.offers = D.offers.filter(x => x !== o); offerSt(me, o.from, src, id, st); } return; }
  if (src === 'terr'){ const T = S.terr, o = T && T.offers.find(x => x.id === id && (x.from === me || x.to === me)); if (o){ T.offers = T.offers.filter(x => x !== o); offerSt(o.from, o.to, 'terr', id, st); } } }
// seat me answers an offer: act 'accept', 'decline' or 'withdraw' (its own). src as offerNote. A counter-offer is sent with dealPropose
// (opts.counterOf), or for a territory offer with terrAnswer. Returns {ok, why}
function offerAct(me, src, id, act){ if (!isSeat(me)) return {ok:false, why:'not a seat'};
  if (src === 'terr'){ const T = S.terr, o = T && T.offers.find(x => x.id === id); if (!o) return {ok:false, why:'the offer is gone'};
    if (act !== 'accept' && act !== 'decline' && act !== 'withdraw') return {ok:false, why:'unknown answer'};
    const r = terrAnswer(me, id, act); if (!S.terr.offers.includes(o)) offerSt(o.from, o.to, 'terr', id, act === 'accept' ? (r.ok ? 'accepted' : 'void') : act === 'withdraw' ? 'withdrawn' : 'declined');
    if (r.ok) markRead(me, o.from === me ? o.to : o.from); return r; }
  if (src === 'treaty' || src === 'trade'){ const D = desk(me), o = (D.offers || []).find(x => x.id === id); if (!o) return {ok:false, why:'the offer is gone'};
    D.offers = D.offers.filter(x => x !== o); markRead(me, o.from);
    if (act === 'accept'){ if (o.kind === 'trade'){ const why = dealOK(me, o.from, o.deal); if (why){ offerSt(me, o.from, src, id, 'void'); refuse(me, `That trade no longer works: ${why}.`); return {ok:false, why}; }
        applyTrade(me, o.from, o.deal); tell(me, `Trade with ${S.nations[o.from].name} completed: ${dealSay(o.deal, 'they')}.`, 'good', null); }
      else { const w = treatyWhy(o.from, me, o.kind); if (w){ offerSt(me, o.from, src, id, 'void'); tell(me, `That offer no longer applies: ${w}.`, 'info', null); return {ok:false, why:'that offer no longer applies'}; } applyDeal(o.from, me, o.kind); }
      offerSt(me, o.from, src, id, 'accepted'); return {ok:true}; }
    addMem(o.from, me, -5); offerSt(me, o.from, src, id, 'declined'); return {ok:true}; }
  if (src === 'deal'){ const o = (S.deals || []).find(x => x.id === id); if (!o) return {ok:false, why:'the offer is gone'};
    if (act === 'withdraw'){ if (o.from !== me) return {ok:false, why:'not your offer'}; offerClose(me, 'deal', id, 'withdrawn'); if (isSeat(o.to)) tell(o.to, `${S.nations[me].name} withdrew its trade offer.`, 'info', null); return {ok:true}; }
    if (o.to !== me) return {ok:false, why:'not your offer to answer'};
    markRead(me, o.from);
    if (act === 'decline'){ offerClose(me, 'deal', id, 'declined'); if (!isSeat(o.from)) addMem(o.from, me, -2); else tell(o.from, `${S.nations[me].name} declined your trade offer.`, 'info', null); return {ok:true}; }
    if (act === 'accept'){ const why = (dealStale(o) ? 'you are now at war' : null) || dealWhy(o.from, me, o.D) || (!isSeat(o.from) && !isPerson(o.from) && dealValue(me, o.from, dealFlip(o.D)).v < DEAL_OK ? 'their terms have changed' : null);
      if (why){ offerClose(me, 'deal', id, 'void'); refuse(me, `That offer no longer works: ${why}.`); return {ok:false, why}; }
      S.deals = S.deals.filter(x => x !== o); dealApply(o.from, me, o.D); offerSt(o.from, me, 'deal', id, 'accepted'); return {ok:true}; }
    return {ok:false, why:'unknown answer'}; }
  return {ok:false, why:'unknown offer'}; }
// every hour (rules/diplomacy.js diploHour): offers to people that ran out, whose sides fell, or made before the two went to war, lapse
function dealHour(){ const L = S.deals; if (!L || !L.length) return;
  S.deals = L.filter(o => { const live = o.exp > S.hour && S.nations[o.from].alive && S.nations[o.to].alive, ok = live && !dealStale(o); if (!ok){ offerSt(o.from, o.to, 'deal', o.id, live ? 'void' : 'expired'); if (isSeat(o.from) && o.exp <= S.hour) tell(o.from, `Your trade offer to ${S.nations[o.to].name} expired.`, 'info', null); } return ok; }); }

/* ---------------- Moved from the page: the actions it used to carry out itself (same rules) ---------------- */
// $50M of aid to an ally or coalition partner: +5 opinion (ECO-13: only inside an alliance or coalition). The money is spent, as before
function giftCash(me, n){ const M0 = S.nations[me]; if (!M0 || M0.cash < 50) return {ok:false, why:'needs $50M'};
  if (!(relView(me, n).st === 'ally' || sameBloc(me, n))) return {ok:false, why:'only for allies and coalition partners'};
  M0.cash -= 50; addMem(n, me, 5); tell(me, `You sent $50M in aid to ${S.nations[n].name}.`, '', null); return {ok:true}; }
// peace for tribute (the price tribute(me, m) asks): a ceasefire with the land terms when m takes it
function payTribute(me, m){ const tr = tribute(me, m), M0 = S.nations[me]; if (!atWar(me, m)) return {ok:false, why:'you are not at war'};
  if (M0.cash < tr) return {ok:false, why:`needs $${fmt(tr)}M`};
  if (!tributeOk(me, m)){ tell(me, `${S.nations[m].name} refused your tribute: they think they can take more by force.`, 'info', null); return {ok:false, why:'they think they can take more by force'}; }
  M0.cash -= tr; S.nations[m].cash += tr; applyDeal(me, m, 'peace'); return {ok:true}; }
// rename one's coalition (28 characters, no markup) or leave it (every alliance ends: peace, -10 opinion with each former ally)
function blocRename(me, name){ const B = blocOf(me), v = cleanText(name, 28).replace(/[&"]/g, ''); if (!B || !v || !S.blocReg || !S.blocReg[B.id]) return false;
  S.blocReg[B.id].name = v; tell(me, `Your coalition is now called the ${v}.`, 'good', null); return true; }
function blocLeave(me){ const B = blocOf(me); if (!B) return false; for (const m of alliesOf(me)){ setRel(me, m, 'peace'); addMem(m, me, -10); } tell(me, `You left the ${B.name}.`, 'info', null); return true; }
// embargo on nation m, joining a coalition partner's when join (DIP-4), or lifting one's own: -15 / +5 opinion
function embargoAct(me, m, join = false){ const key = me + '>' + m;
  if (mkt().emb[key]){ setEmbargo(me, m, false); addMem(m, me, 5); tell(me, `You lifted your embargo on ${S.nations[m].name}.`, '', null); return {ok:true, on:false}; }
  const ls = join ? embargoLeaders(me, m) : []; setEmbargo(me, m, true, ls.length ? ls[0] : null); addMem(m, me, -15);
  tell(me, ls.length ? `You joined ${S.nations[ls[0]].name}'s embargo on ${S.nations[m].name}: no trade routes or market deals with them.` : `You imposed an embargo on ${S.nations[m].name}: no trade routes or market deals with them.`, '', null); return {ok:true, on:true}; }
// a treaty proposed by seat me to nation n: a computer nation answers now (a refusal costs 2 opinion, as before); a person gets an offer
function treatyPropose(me, n, k){ if (!TREATY_K.includes(k)) return {ok:false, why:'unknown treaty'};
  if (isPerson(n)) return dealPropose(me, n, {give:emptySide(), get:emptySide(), treaty:[k]});
  const w = treatyWhy(me, n, k); if (w){ refuse(me, `Not possible: ${w}.`); return {ok:false, why:w}; }
  const r = acceptOffer(n, me, k); if (r.ok){ applyDeal(me, n, k); return {ok:true, act:'accept', why:r.why}; }
  tell(me, `${S.nations[n].name} refused: ${r.why}.`, 'info', null); addMem(n, me, -2); return {ok:false, act:'decline', why:r.why}; }

/* ---------------- The screen's readers: pure, they write nothing (UI-1; IMP-17: opening Diplomacy must not change the game) ---------------- */
const REL_NONE = Object.freeze({st:'peace', since:0, until:null});
const relView = (a, b) => a === b ? {st:'self'} : (S.rel && S.rel[rkeyC(a, b)]) || REL_NONE;
// every nation's numbers in one pass: victory points (land held, as the top bar), provinces, cities, average morale, capital, progress towards
// victory (0..1: the better of land and capitals), coalition ({id, name, members, leader} or null)
function natStatsAll(){ const K = S.nations.length, prov = new Array(K).fill(0), cities = new Array(K).fill(0), mor = new Array(K).fill(0);
  for (let p = 0; p < G.P.length; p++){ const o = S.owner[p]; if (!(o >= 0) || G.P[p].sea) continue; prov[o]++; if (G.P[p].city) cities[o]++; mor[o] += moraleOf(p); }
  const BL = blocsView(), out = [];
  for (const N of S.nations){ const n = N.id, vp = landHeld(n), need = landNeed(n), caps = capsHeld(n), B = BL.find(b => b.members.includes(n)) || null;
    out.push({n, alive:N.alive, vp, provinces:prov[n], cities:cities[n], morale:prov[n] ? Math.round(mor[n]/prov[n]) : 0, capital:N.alive ? N.capital : -1,
      capitalName:N.alive && G.P[N.capital] ? provName(N.capital) : '', progress:Math.min(1, Math.max(need ? vp/need : 0, caps/WIN_CAPS)), need, caps, bloc:B}); }
  return out; }
const natStats = n => natStatsAll()[n];
// what seat me knows of nation n's forces: units it has identified (the fog-of-war rule: rules/vision.js armyView, identified only), and how that
// compares with its own power; null when it has identified none ("Unknown")
function knownArmy(me, n){ if (me === n){ let u = 0; for (const a of S.armies) if (a.owner === n) u += count(a); return {units:u, cmp:'', all:true}; }
  const vis = visibleSet(me); let units = 0, pw = 0, seen = 0, total = 0;
  for (const a of S.armies){ if (a.owner !== n || !count(a)) continue; total++; const v = armyView(a, vis); if (!v || v.unk) continue; units += v.n; pw += power(a); seen++; }
  if (!seen) return null;
  // the weaker / similar / stronger call is made only when every one of its forces is known; with some unseen it is just the units seen
  const all = seen === total, r = pw/Math.max(1, natPower(me)); return {units, forces:seen, all, cmp:all ? (r < 0.7 ? 'weaker' : r > 1.4 ? 'stronger' : 'similar') : ''}; }
// who nation n is at war with: nations, and rebels (partisans) standing in its land ({nations:[ids], rebels:label or ''})
function warList(n){ const ids = S.nations.filter(m => m.alive && m.id !== n && relView(n, m.id).st === 'war').map(m => m.id);
  let reb = ''; for (const a of S.armies) if (a.rebel && count(a) && S.owner[a.at] === n){ reb = armyName(a); break; }
  return {nations:ids, rebels:reb}; }
// the relation between seat me and nation n as the two diamonds show it, with the notes under them
function relInfo(me, n){ const r = relView(me, n), M = S.mkt || {emb:{}}, emb = M.emb || {}, left = r.until != null ? Math.max(0, Math.ceil((r.until - S.hour)/24)) : null, notes = [];
  if (r.st === 'truce') notes.push(`Ceasefire: ${left} d left, then peace`);
  if (r.st === 'nap') notes.push(`Non-aggression pact: ${left} d left`);
  if (r.st === 'peace' && r.afterTruce && S.hour - r.since < 20*24) notes.push(`Peace since ${Math.floor((S.hour - r.since)/24)} d: declaring war within 20 days of the ceasefire breaks a treaty`);
  const mine = !!emb[me + '>' + n], theirs = !!emb[n + '>' + me];
  if (mine) notes.push('Your embargo is in force: no trade with them');
  if (theirs) notes.push('They embargo you: no trade with them');
  const Bm = blocOfView(me), ls = !mine && Bm ? Bm.members.filter(p => p !== me && p !== n && S.nations[p].alive && emb[p + '>' + n]) : [];
  if (ls.length) notes.push(`${ls.map(x => S.nations[x].name).join(', ')} (your coalition) embargo them: you can join`);
  const d = (S.decl || []).find(x => (x.by === me && x.to === n) || (x.by === n && x.to === me)); if (d && d.at != null) notes.push(d.by === me ? `War begins in ${Math.max(0, d.at - S.hour)} h` : `They attack in ${Math.max(0, d.at - S.hour)} h`);
  const pend = offersWith(me, n).filter(o => o.src === 'deal' || o.src === 'treaty'), wants = side => [...new Set(pend.filter(o => o.mine === side).flatMap(o => o.treaties))];
  return {st:r.st, theirs:r.st, yours:r.st, daysLeft:left, since:r.since, afterTruce:!!r.afterTruce, embMine:mine, embTheirs:theirs, embJoin:ls, notes,
    opinion:n === me ? 0 : Math.round(opinion(n, me)), parts:n === me ? [] : opinionParts(n, me), wantsMine:wants(true), wantsTheirs:wants(false), breaker:S.nations[me].breaker != null && S.hour - S.nations[me].breaker < 50*24}; }
// the list screen's diamonds for every nation at once, light (no opinion, no notes): {n, st, embMine, embTheirs, wantsMine, wantsTheirs}
function relRows(me){ const emb = (S.mkt && S.mkt.emb) || {}, want = new Map(), add = (n, mine, ks) => { let w = want.get(n); if (!w) want.set(n, w = {m:new Set(), t:new Set()}); for (const k of ks) (mine ? w.m : w.t).add(k); };
  for (const o of S.deals || []){ if (o.from === me) add(o.to, true, o.D.give.treaty); else if (o.to === me && !isMuted(me, o.from)) add(o.from, false, o.D.give.treaty); }
  for (const o of deskView(me).offers || []) if (o.kind !== 'trade' && !isMuted(me, o.from)) add(o.from, false, [o.kind]);
  return S.nations.map(N => { const n = N.id, w = want.get(n); return {n, st:n === me ? 'self' : relView(me, n).st, embMine:!!emb[me + '>' + n], embTheirs:!!emb[n + '>' + me], wantsMine:w ? [...w.m] : [], wantsTheirs:w ? [...w.t] : []}; }); }
// the actions seat me has towards nation n, grouped for the relation menu: {k, g ('treaty'|'trade'|'goodwill'|'war'), label, ok, why, likely, ...}.
// With a person, treaties are offers they answer (likely: null)
function relMenu(me, n){ const r = relView(me, n), st = r.st, person = isPerson(n), N = S.nations[n], M0 = S.nations[me], out = [], emb = (S.mkt && S.mkt.emb) || {}, Bm = blocOfView(me), partner = !!Bm && Bm.members.includes(n);
  const like = k => person ? null : acceptOffer(n, me, k);
  const tre = (k, label, extra = {}) => { const w = treatyWhy(me, n, k), a = w ? null : like(k); out.push({k, g:'treaty', label, ok:!w, why:w || (a ? a.why : ''), likely:a ? a.ok : null, offer:person, ...extra}); };
  if (st === 'war'){ tre('peace', 'Offer ceasefire (peace after 10 days)', {terms:termsText(me, n, warTerms(me, n), me)});
    if (!person){ const tr = tribute(me, n); out.push({k:'tribute', g:'treaty', label:`Pay $${fmt(tr)}M for ceasefire`, ok:M0.cash >= tr, why:M0.cash >= tr ? (tributeOk(me, n) ? 'likely accepted' : 'they are winning too clearly') : `needs $${fmt(tr)}M`, likely:tributeOk(me, n), cost:tr}); } }
  if (st === 'peace' || st === 'truce') tre('nap', 'Offer NAP (20 days)');
  if (st === 'peace' || st === 'nap') tre('pass', 'Ask for right of way');
  if (st !== 'ally' && st !== 'war') tre('ally', 'Propose alliance (shared intel)');
  { const R = S.trade && S.trade.routes.find(x => x.key === trKey(me, n)), pend = (S.decl || []).some(d => (d.by === me && d.to === n) || (d.by === n && d.to === me));
    if (R) out.push({k:'route-close', g:'trade', label:'Close trade route', ok:true, why:'−4 opinion', id:R.id});
    else if (st !== 'war' && !pend){ const lim = S.trade ? S.trade.routes.filter(x => x.a === me || x.b === me).length >= TR_MAX : false, w = embargoed(me, n) ? 'an embargo is in force' : opinion(n, me) < -30 ? `${N.name} refuses: opinion too low` : lim ? `you can run at most ${TR_MAX} trade routes: close one first` : null;
      out.push({k:'route-open', g:'trade', label:'Open trade route', ok:!w, why:w || 'money and goods for both sides every day'}); } }
  { const mine = !!emb[me + '>' + n], ls = mine || !Bm ? [] : Bm.members.filter(p => p !== me && p !== n && S.nations[p].alive && emb[p + '>' + n]);
    out.push(mine ? {k:'embargo-lift', g:'trade', label:'Lift embargo', ok:true, why:'trade can resume, +5 opinion'} : ls.length ? {k:'embargo-join', g:'trade', label:`Join ${S.nations[ls[0]].name}'s embargo`, ok:true, why:'no trade routes or market deals with them, −15 opinion', lead:ls[0]} : {k:'embargo', g:'trade', label:'Embargo', ok:true, why:'no trade routes or market deals with them, −15 opinion'}); }
  if (st === 'ally' || partner){ out.push({k:'aid', g:'goodwill', label:'Send $50M aid (+5 opinion)', ok:M0.cash >= 50, why:M0.cash >= 50 ? '' : 'needs $50M'}); if (partner) out.push({k:'give', g:'goodwill', label:'Give (coalition)', ok:true, why:'resources and provinces, free'}); }
  if (st !== 'war' && !(S.decl || []).some(d => d.by === me && d.to === n)){ const left = r.until != null ? Math.max(0, Math.ceil((r.until - S.hour)/24)) : 0;
    const breaker = st === 'nap' || st === 'ally' || st === 'pass' || (st === 'peace' && !!r.afterTruce && S.hour - r.since < 20*24);
    const join = alliesOf(n).filter(al => al !== me && !atWar(al, me) && !['truce', 'ally', 'nap', 'pass'].includes(relView(al, me).st));
    out.push({k:'war', g:'war', label:'Declare war', ok:st !== 'truce', why:st === 'truce' ? `Ceasefire: ${left} d left` : `−50 opinion with ${N.name}`, breaker, allies:join,
      warn:breaker ? 'Breaking this treaty marks you as a treaty breaker: every nation trusts you less for 50 days (up to −25 opinion).' : ''}); }
  return out; }
// carry out a relation-menu action k (relMenu's keys) of seat me towards n: one entry point for the page
function relAct(me, n, k, arg){ if (!isSeat(me) || me === n || !S.nations[n] || !S.nations[n].alive) return {ok:false, why:'no other side'};
  if (TREATY_K.includes(k)) return treatyPropose(me, n, k);
  if (k === 'tribute') return payTribute(me, n);
  if (k === 'route-open'){ const r = tradeOpen(me, n); if (r !== true){ refuse(me, `Not possible: ${r}.`); return {ok:false, why:r}; } return {ok:true}; }
  if (k === 'route-close'){ const R = S.trade && S.trade.routes.find(x => x.key === trKey(me, n)); if (!R) return {ok:false, why:'no route'}; tradeClose(me, R.id); return {ok:true}; }
  if (k === 'embargo' || k === 'embargo-join' || k === 'embargo-lift'){ const on = !!(S.mkt && S.mkt.emb && S.mkt.emb[me + '>' + n]);   // (each key does only what it says: a double tap changes nothing)
    if ((k === 'embargo-lift') !== on) return {ok:false, why:on ? 'your embargo is already in force' : 'you have no embargo on them'}; return embargoAct(me, n, k === 'embargo-join'); }
  if (k === 'aid') return giftCash(me, n);
  if (k === 'give') return sendGift(me, n, arg) ? {ok:true} : {ok:false, why:'choose something you have to send'};
  if (k === 'war'){ const ok = declareWar(me, n); return ok ? {ok:true} : {ok:false, why:relView(me, n).st === 'truce' ? 'a ceasefire is in force' : 'not possible now'}; }
  return {ok:false, why:'unknown action'}; }
// the open offers between seat me and nation n, newest first, the same shape whatever their source:
// {src, id, from, to, mine (me made it), kind ('treaty'|'trade'|'deal'|'terr'), treaties, D (from me's side), text, exp, round, can:{accept, decline, counter, withdraw}}
function offersWith(me, n){ const out = [], muted = isMuted(me, n), D0 = deskView(me);
  for (const o of D0.offers || []) if (o.from === n && !muted) out.push({src:o.kind === 'trade' ? 'trade' : 'treaty', id:o.id, from:n, to:me, mine:false, kind:o.kind, treaties:o.kind === 'trade' ? [] : [o.kind],
    D:o.kind === 'trade' ? o.deal : {give:emptySide(), get:emptySide(), treaty:[o.kind]}, text:o.kind === 'trade' ? `Proposal: ${dealSay(o.deal, 'they')}` : `${S.nations[n].name} proposes ${{peace:'a ceasefire (peace after 10 days)', nap:'a non-aggression pact (20 days)', pass:'right of way', ally:'an alliance'}[o.kind]}${o.kind === 'peace' ? `. Terms: ${termsText(me, n, warTerms(me, n), me)}` : ''}`, exp:o.exp, h:o.exp - 48, round:1});
  for (const o of S.deals || []){ if (!((o.from === me && o.to === n) || (o.from === n && o.to === me)) || (o.from === n && muted)) continue; const mine = o.from === me, D = mine ? o.D : dealFlip(o.D);
    out.push({src:'deal', id:o.id, from:o.from, to:o.to, mine, kind:'deal', treaties:o.D.give.treaty.slice(), D, text:dealSay(D, 'they'), exp:o.exp, h:o.h, round:o.n}); }
  for (const o of (S.terr && S.terr.offers) || []){ if (!((o.from === me && o.to === n) || (o.from === n && o.to === me)) || (o.from === n && muted)) continue; const mine = o.from === me, sell = o.seller === me;
    const D = {give:emptySide(), get:emptySide()}; if (sell){ D.give.provs = [o.p]; D.get.cash = o.price; } else { D.get.provs = [o.p]; D.give.cash = o.price; }
    out.push({src:'terr', id:o.id, from:o.from, to:o.to, mine, kind:'terr', treaties:[], D, p:o.p, price:o.price, value:o.value, text:`${provName(o.p)} for $${fmt(o.price)}M (value $${fmt(o.value)}M)`, exp:o.exp, h:o.h, round:o.n}); }
  for (const o of out) o.can = o.mine ? {withdraw:o.src === 'deal' || o.src === 'terr'} : {accept:true, decline:true, counter:o.src !== 'terr' || o.round < TERR.rounds};
  return out.sort((x, y) => y.h - x.h || y.id - x.id); }
// a card's status: 'waiting' while open, else what settled it ('expired' once its time ran out)
function noteStatus(me, e, open){ if (e.t !== 'offer') return ''; if (open.has(e.src + ':' + e.id)) return 'waiting'; return e.st || (S.hour >= e.exp ? 'expired' : 'closed'); }
// seat me's thread with nation n, oldest first, with each offer card's status; muted: a person me muted (the page shows only war cards then)
function threadView(me, n){ const L = (deskView(me).chat || {})[n] || [], open = new Set(offersWith(me, n).map(o => o.src + ':' + o.id)), muted = isMuted(me, n);
  return {n, person:personOf(n), leader:isPerson(n) ? '' : leaderOf(n), muted, unread:((deskView(me).unread || {})[n]) || 0, offers:offersWith(me, n),
    items:L.map(e => ({t:e.t || 'msg', k:e.k || '', from:e.from, text:e.text, h:e.h, src:e.src, id:e.id, d:e.d || null, st:noteStatus(me, e, open), mine:e.from === me})).filter(e => !muted || (e.t === 'sys' && e.k === 'war'))}; }
// every thread of seat me for the Messages & Trades tab, newest first: an unread war card pins its thread to the top, muted threads go last
function threads(me){ const D = deskView(me), C = D.chat || {}, U = D.unread || {}, ids = new Set(Object.keys(C).map(Number));
  for (const o of D.offers || []) ids.add(o.from); for (const o of S.deals || []) if (o.from === me || o.to === me) ids.add(o.from === me ? o.to : o.from);
  for (const o of (S.terr && S.terr.offers) || []) if (o.from === me || o.to === me) ids.add(o.from === me ? o.to : o.from);
  const out = []; for (const n of ids){ if (n === me || !S.nations[n]) continue; const L = C[n] || [], last = L[L.length - 1] || null, muted = isMuted(me, n), offers = offersWith(me, n);
    const un = U[n] || 0, war = un > 0 && L.slice(Math.max(0, L.length - un)).some(e => e.t === 'sys' && e.k === 'war');
    out.push({n, alive:S.nations[n].alive, person:isPerson(n), muted, unread:muted ? (war ? un : 0) : un, answer:!muted && offers.some(o => !o.mine), war, h:Math.max(last ? last.h : -1, ...offers.map(o => o.h)), last:muted || !last ? null : {t:last.t || 'msg', text:last.text, from:last.from, h:last.h}}); }
  return out.sort((x, y) => (y.war ? 1 : 0) - (x.war ? 1 : 0) || (x.muted ? 1 : 0) - (y.muted ? 1 : 0) || y.h - x.h || x.n - y.n); }
// the unread count for the tab badge (muted people left out)
const unreadAll = me => { const U = deskView(me).unread || {}; let s0 = 0; for (const k in U) if (!isMuted(me, +k)) s0 += U[k] || 0; return s0; };
// the trade builder's footer for seat me and nation n: what each side gives and gets in $M, the land floors, and the verdict
// {why (it cannot be sent), give, get, floors:[{seller, min}], verdict ('accept'|'counter'|'decline'|'person'), text, want}
function dealPreview(me, n, D0){ const D = dealNorm(D0), give = sideCash(D.give) + sideLand(D.give), get = sideCash(D.get) + sideLand(D.get);
  const floors = []; if (D.give.provs.length) floors.push({seller:me, min:floorFor(me, n, D.give.provs), share:terrFloor(me, n)}); if (D.get.provs.length) floors.push({seller:n, min:floorFor(n, me, D.get.provs), share:terrFloor(n, me)});
  const base = {give:Math.round(give), get:Math.round(get), floors};
  if (isPerson(n)){ const w = dealWhy(me, n, D); return {...base, why:w, verdict:w ? 'decline' : 'person', text:w ? `Not possible: ${w}` : `${personOf(n).name} decides; the offer stands 2 days`}; }
  if (dealEmpty(D)) return {...base, why:'the deal is empty', verdict:'decline', text:'Add something to the deal'};
  if (dealIsLand(D)){ const sell = D.give.provs.length === 1, p = sell ? D.give.provs[0] : D.get.provs[0], price = sell ? D.get.cash : D.give.cash;
    if (!sell) return {...base, why:`${S.nations[n].name} never sells land`, verdict:'decline', text:`Will not: ${S.nations[n].name} never sells land`};
    const w = terrDealWhy(me, n, p, price); if (w) return {...base, why:w, verdict:'decline', text:`Not possible: ${w}`};
    const want = terrWant(n, p, me), mn = terrMin(me, n, p);
    return {...base, why:null, verdict:price <= want ? 'accept' : want >= mn ? 'counter' : 'decline', text:price <= want ? 'Would likely accept' : want >= mn ? `Would likely offer about $${fmt(Math.max(mn, Math.floor(want/5)*5))}M` : want <= 0 ? `Will not: not interested in ${provName(p)}` : 'Will not pay that much', want:Math.max(0, price - want)}; }
  const a = dealAnswer(me, n, D);
  return {...base, why:a.act === 'decline' && /not possible|lowest|embargo|never|at war|empty|twice|not have|treaty|ceasefire|already|allies|province/i.test(a.why) && !a.want ? a.why : null, verdict:a.act,
    text:a.act === 'accept' ? 'Would likely accept' : a.act === 'counter' ? 'Would likely counter' : a.want ? `Wants about $${fmt(a.want)}M more` : `Will not: ${a.why}`, want:a.want || 0, counter:a.act === 'counter' ? a.D : null}; }

/*@DEV*/
// developer switch (dev builds only; tools/build.js strips this block and fails the public build if any of these names is left): a computer
// nation shown as played by a person, with an invented name and motto, so the screens for real players can be tried. The AI keeps playing it.
const DEV_PEOPLE = {names:['SteelHeron', 'NorthwindKai', 'Marigold77', 'QuietTundra', 'LanternFox', 'RiverMarshal', 'Cobalt_Ash', 'OrchardWolf'],
  mottos:['Hold the line.', 'Patience wins wars.', 'Trade first, fight last.', 'No retreat from the river.', 'Friends close, borders closer.', 'Fortune favours the prepared.']};
function devPerson(n, on){ if (!(n >= 0) || !S.nations[n] || isSeat(n)) return false; const F = S.devPeople || (S.devPeople = {});
  if (on) F[n] = {name:DEV_PEOPLE.names[n % DEV_PEOPLE.names.length], motto:DEV_PEOPLE.mottos[n % DEV_PEOPLE.mottos.length], since:S.hour}; else delete F[n]; return true; }
// the pretend person n writes to seat me
function devWrite(n, me){ const T = ['Hello neighbour. Shall we keep this border quiet?', 'Your fleet near my coast worries me.', 'I could use some oil. Interested in a trade?', 'Good luck out there.'];
  say(me, n, n, T[Math.floor(S.hour/24) % T.length]); return true; }
// the pretend person n offers seat me a trade: two lots of the good it holds most of, for money at world price
function devOffer(n, me){ const N = S.nations[n], P = mktP(), k = MKT_K.slice().sort((x, y) => N[y] - N[x] || (x < y ? -1 : 1))[0], q = Math.min(2*RES_K, kFloor(N[k]));
  const D = {give:emptySide(), get:emptySide()}; if (q >= RES_K){ D.give[k] = q; D.get.cash = Math.max(10, Math.round(lotCash(q, P[k]))); } else D.give.cash = 20;
  const o = {id:S.nid++, from:n, to:me, D:dealNorm(D), n:1, h:S.hour, exp:S.hour + DEAL_H}; if (atWar(n, me)) o.war0 = true; dealsS().push(o); offerNote(o, 'deal', dealNoteText(o, 'Proposal')); return o; }
// the pretend person answers seat me's open offer id: 'accept', 'decline' or 'counter' (it asks $10M more, or one lot less of its goods)
function devAnswer(id, act){ const o = (S.deals || []).find(x => x.id === id); if (!o || isSeat(o.to)) return {ok:false, why:'no offer to a pretend person'}; const n = o.to, me = o.from;
  if (act === 'accept'){ const w = (dealStale(o) ? 'you are now at war' : null) || dealWhy(me, n, o.D); if (w){ offerClose(me, 'deal', id, 'void'); return {ok:false, why:w}; } S.deals = S.deals.filter(x => x !== o); dealApply(me, n, o.D); offerSt(me, n, 'deal', id, 'accepted'); say(me, n, n, 'Deal.'); return {ok:true}; }
  if (act === 'decline'){ offerClose(me, 'deal', id, 'declined'); say(me, n, n, 'No thanks.'); return {ok:true}; }
  const D = dealNorm(o.D); if (S.nations[me].cash >= D.give.cash + 10) D.give.cash += 10; else { const k = DEAL_K.find(x => x !== 'cash' && D.get[x] >= RES_K); if (k) D.get[k] -= RES_K; else D.give.cash = Math.floor(S.nations[me].cash); }
  offerClose(me, 'deal', id, 'countered'); const o2 = {id:S.nid++, from:n, to:me, D:dealFlip(D), n:o.n + 1, h:S.hour, exp:S.hour + DEAL_H, counterOf:id}; dealsS().push(o2);
  say(me, n, n, 'Close. Here is my counter-offer.'); offerNote(o2, 'deal', dealNoteText(o2, 'Counter-offer')); return {ok:true, o:o2}; }
/*@ENDDEV*/
