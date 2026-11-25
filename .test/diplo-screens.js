// Diplomacy screens (owner point 14: the reference layout): every view opens, reads the right data, writes nothing while drawing, and every action
// Diplomacy had before is still reachable in the new layout ("nothing gets removed": docs/DIPLOMACY-OPTIONS.md's inventory, one check per row).
//   node .test/diplo-screens.js [W H]   (run tools/mkpage.sh first; 440 900 = the phone; prints JSON {checks, fails, errors}; exits 1 on any failure)
const pickNation = require('./pick-nation.js');
const { chromium } = require('playwright');
const W = +(process.argv[2] || 440), H = +(process.argv[3] || 900), PHONE = W <= 820;
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: PHONE, isMobile: PHONE }); const p = await ctx.newPage();
  const errors = [], checks = {}, fails = [];
  const ok = (k, c, v) => { checks[k] = v === undefined ? !!c : v; if (!c) fails.push(k + (v !== undefined ? ': ' + JSON.stringify(v) : '')); };
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_FILE_NOT_FOUND/.test(m.text())) errors.push(m.text()); });
  await p.addInitScript(() => { let s = 0x2f6b1d3; Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0)/4294967296; }; });
  await p.goto('file://' + __dirname + '/page.html?start=nations'); await p.waitForTimeout(500);
  await pickNation(p, 'United States'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 60000 });
  const I = await p.evaluate(() => { const im = window.__im, S = im.S, G = im.G, me = 0, id = nm => S.nations.findIndex(n => n.name === nm); S.speed = 0; im.SET.tipsOff = true; document.querySelectorAll('.toast').forEach(t => t.remove());
    S.nations[me].cash = 2400; for (const k of ['oil', 'metal', 'iron', 'elec', 'rare']) S.nations[me][k] = Math.max(S.nations[me][k], 60*RES_K);
    const I = {}; for (const nm of ['Russia', 'Iran', 'China', 'Canada', 'Mexico', 'Brazil', 'United Kingdom', 'France', 'Japan', 'Germany', 'Italy', 'Cuba', 'Venezuela', 'Colombia', 'Ukraine', 'Poland', 'Australia', 'Spain', 'Egypt', 'Israel', 'Argentina']) I[nm] = id(nm);
    setRel(me, I.Russia, 'war'); setRel(me, I.China, 'truce', 6); setRel(me, I.Canada, 'ally'); setRel(me, I['United Kingdom'], 'ally'); setRel(me, I.Mexico, 'pass'); setRel(me, I.Brazil, 'nap', 14); setRel(me, I.Japan, 'nap', 18);
    setRel(I.Russia, I.Ukraine, 'war'); setRel(I.Germany, I.France, 'ally'); blocs();
    for (const nm of ['Canada', 'Mexico', 'Japan', 'United Kingdom']) tradeOpen(me, I[nm]);
    setEmbargo(me, I.Cuba, true); setEmbargo(I.Canada, I.Argentina, true);
    const ven = G.P.filter(P => !P.sea && S.owner[P.id] === I.Venezuela && !isCapital(P.id)).sort((a, b) => (b.city ? 1 : 0) - (a.city ? 1 : 0) || a.id - b.id).slice(0, 2); for (const P of ven) S.owner[P.id] = me;
    msgSend(me, I.France, 'Hello.'); offerSeat(me, I.Brazil, 'pass'); aiProposeTrade(I.Japan, me);
    const col = G.P.filter(P => !P.sea && S.owner[P.id] === I.Colombia && !isCapital(P.id)).sort((a, b) => (b.city ? 1 : 0) - (a.city ? 1 : 0) || a.id - b.id)[0]; S.owner[col.id] = me; terrOffer(me, I.Colombia, col.id, Math.floor(S.nations[I.Colombia].cash/5)*5);
    devPerson(I.Germany, true); devWrite(I.Germany, me); devOffer(I.Germany, me); devPerson(I.Poland, true); devWrite(I.Poland, me); muteSet(me, I.Poland, true);
    declareWar(I.Iran, me);   // (a war declared on you: its red card pins the thread)
    I.ven = ven.map(P => P.id); return I; });
  const ev = (f, a) => p.evaluate(f, a), has = sel => ev(s => !!document.querySelector('#sheet ' + s), sel), txt = sel => ev(s => { const e = document.querySelector('#sheet ' + s); return e ? e.innerText : ''; }, sel);
  const click = async sel => { await p.click('#sheet ' + sel); await p.waitForTimeout(80); };
  const save = () => ev(() => saveJSON());

  // ---- the list: band, three tabs, sort, direction, search; one row per nation; their / your diamonds ----
  await p.keyboard.press('d'); await p.waitForTimeout(200);
  ok('list: DIPLOMACY band with close and map toggle', await txt('.rhead h1') === 'DIPLOMACY' || /diplomacy/i.test(await txt('.rhead h1')), await txt('.rhead h1'));
  ok('list: red close', await has('.rhead > .mx[data-act="resume"]'));
  ok('list: three tabs', (await ev(() => [...document.querySelectorAll('#sheet .dp-tab')].map(t => t.dataset.k).join(','))) === 'info,coal,msg');
  ok('list: sort, direction, search', await has('#dp-sort') && await has('[data-act="dp-dir"]') && await has('[data-act="dp-search"]'));
  const L = await ev(() => { const im = window.__im, S = im.S, rows = [...document.querySelectorAll('#sheet .dp-row')]; return { n:rows.length, alive:S.nations.filter(N => N.alive).length, first:rows[0].dataset.id, you:!!document.querySelector('#sheet .dp-row.you .dp-you'), youDm:!!document.querySelector('#sheet .dp-row.you .dp-dm'),
    dm:document.querySelectorAll('#sheet .dp-row:not(.you) .dp-dm').length, otherBtns:document.querySelectorAll('#sheet .dp-row button, #sheet .dp-row [data-act]:not(.dp-row)').length, vp:rows.slice(0, 5).map(r => +r.querySelector('.dp-vp b').textContent.replace(/,/g, '')) }; });
  ok('list: a row per living nation, yours with YOU and no diamonds', L.n === L.alive && L.you && !L.youDm, L);
  ok('list: two diamonds on every other row, no other buttons', L.dm === 2*(L.alive - 1) && L.otherBtns === 0, L);
  ok('list: sorted by points (default)', L.vp.every((v, i) => !i || v <= L.vp[i - 1]), L.vp);
  const rus = await ev(n => { const r = document.querySelector(`#sheet .dp-row[data-id="${n}"]`); return [...r.querySelectorAll('.dp-dm')].map(d => d.getAttribute('aria-label')); }, I.Russia);
  ok('list: diamonds show the relation (war, aria label)', rus.length === 2 && /Their relation: War/.test(rus[0]) && /Your relation: War/.test(rus[1]), rus);
  const cub = await ev(n => [...document.querySelector(`#sheet .dp-row[data-id="${n}"]`).querySelectorAll('.dp-dm')].map(d => !!d.querySelector('.dp-emb')), I.Cuba);
  ok('list: embargo crate only on the side that set it (yours)', !cub[0] && cub[1], cub);
  ok('list: a pending proposal rings their diamond (Brazil wants right of way)', await ev(n => !!document.querySelector(`#sheet .dp-row[data-id="${n}"] .dp-rc:first-child .dp-dm.want`), I.Brazil));
  ok('list: player name with person glyph, leader names for computer nations', await ev(([g, f]) => /RiverMarshal|SteelHeron|NorthwindKai|Marigold77|QuietTundra|LanternFox|Cobalt_Ash|OrchardWolf/.test(document.querySelector(`#sheet .dp-row[data-id="${g}"] .pp`).textContent) && document.querySelector(`#sheet .dp-row[data-id="${f}"] .ld`).textContent === 'Laurent Dessaigne', [I.Germany, I.France]));
  ok('list: coalition emblem and name on the row', await ev(n => /Northern|Meridian|Atlantic|Eastern|Southern|Pacific|Continental|Iron/.test((document.querySelector(`#sheet .dp-row[data-id="${n}"] .dp-co`) || {}).textContent || ''), I.Canada));
  await p.selectOption('#dp-sort', 'name'); await p.waitForTimeout(80);
  const nm = await ev(() => [...document.querySelectorAll('#sheet .dp-row .dp-nm b')].slice(0, 3).map(b => b.textContent)); ok('sort: by name A to Z', nm[0] <= nm[1] && nm[1] <= nm[2], nm);
  await click('[data-act="dp-dir"]'); const nm2 = await ev(() => [...document.querySelectorAll('#sheet .dp-row .dp-nm b')].slice(0, 2).map(b => b.textContent)); ok('sort: the direction toggle reverses it', nm2[0] >= nm2[1], nm2);
  await p.selectOption('#dp-sort', 'pts'); await p.waitForTimeout(80);
  await click('[data-act="dp-search"]'); await p.keyboard.type('dessaigne'); await p.waitForTimeout(80);
  const vis = await ev(() => [...document.querySelectorAll('#sheet .dp-row')].filter(r => !r.hidden).map(r => r.dataset.id)); ok('search: matches a leader name (accents ignored)', vis.length === 1 && +vis[0] === I.France, vis);
  await p.fill('#dp-q', 'rivermarshal'); await p.waitForTimeout(60); ok('search: matches a player name', (await ev(() => [...document.querySelectorAll('#sheet .dp-row')].filter(r => !r.hidden).length)) === 1);
  await click('[data-act="dp-qx"]'); ok('search: × clears it', (await ev(() => [...document.querySelectorAll('#sheet .dp-row')].filter(r => !r.hidden).length)) === L.alive);

  // ---- drawing writes nothing: saveJSON is the same byte for byte after opening every view (the game paused) ----
  await ev(n => { markRead(0, n); }, I.France);
  const s0 = await save();
  for (const step of [() => ev(() => { window.__im.dp.DV.tab = 'coal'; window.__im.dp.render(); }), () => ev(() => { window.__im.dp.DV.tab = 'msg'; window.__im.dp.DV.routes = true; window.__im.dp.render(); }),
    () => ev(n => window.__im.dp.nation(n), I.Japan), () => click('.dp-chev'), () => click('[data-act="dp-rel"][data-k="war"]'), () => click('.dp-op'),
    () => ev(n => window.__im.dp.nation(n), I.Germany), () => ev(n => window.__im.dp.go('profile', n), I.Germany), () => ev(() => window.__im.dp.go('profile', 0)),
    () => ev(n => window.__im.dp.go('chat', n), I.France), () => ev(([n, v]) => { window.__im.dp.trade(n); const T = window.__im.dp.DV.T; T.give.provs = [v[1]]; T.get.cash = 60; T.treaty = ['nap']; T.pk = 'give'; T.loc = v[1]; window.__im.dp.render(); }, [I.Colombia, I.ven]),
    () => ev(n => window.__im.dp.trade(n, {gift:true}), I.Canada), () => ev(() => window.__im.dp.open())]) await step();
  const s1 = await save(); ok('drawing writes nothing (saveJSON before = after every view)', s0 === s1, s0 === s1 ? '' : 'differs');

  // ---- the nation pages ----
  await ev(n => window.__im.dp.nation(n), I.Japan);
  ok('computer page: ABOUT PLAYER, back, close', /about player/i.test(await txt('.rhead h1')) && await has('.rhead [data-act="dp-back"]') && await has('.rhead > .mx'));
  ok('computer page: the leader, no motto, Computer nation tag', await txt('.dp-pn b') === 'Kenji Tadokoro' && !(await has('.dp-motto')) && await has('.dp-tag'));
  ok('computer page: only New Trade beside the flag', (await ev(() => [...document.querySelectorAll('#sheet .dp-acts [data-act]')].map(x => x.dataset.act).join(','))) === 'dp-trade');
  ok('computer page: no Add Friend, Send Message, Profile or Mute', !(await has('[data-act="dp-friend"]')) && !(await has('[data-act="dp-chat"]')) && !(await has('[data-act="dp-profile"]')) && !(await has('[data-act="dp-mute"]')));
  ok('computer page: progress towards victory', /\d+%/.test(await txt('.dp-pg')) && /progress towards victory/i.test(await txt('.dp-fb')));
  const stats = (await txt('.dp-stats')).toUpperCase();
  ok('computer page: stats rows', ['PROVINCES', 'AVERAGE MORALE', 'VICTORY POINTS', 'CAPITAL', 'KNOWN ARMY SIZE', 'AT WAR WITH'].every(k => stats.includes(k)), stats);
  ok('computer page: Known Army Size is Unknown far away (fog of war)', /KNOWN ARMY SIZE:\s*UNKNOWN/.test(stats), stats);
  await ev(n => window.__im.dp.nation(n), I.Canada); ok('ally page: the army you see (intel) is known', !/KNOWN ARMY SIZE:\s*UNKNOWN/.test((await txt('.dp-stats')).toUpperCase()));
  await ev(n => window.__im.dp.nation(n), I.Russia); ok('At War With lists nations', /UKRAINE/.test((await txt('.dp-stats')).toUpperCase()) && /YOU/.test((await txt('.dp-stats')).toUpperCase()));
  await ev(n => window.__im.dp.nation(n), I.Germany);
  ok('player page: name, Add Friend, motto', /RiverMarshal|SteelHeron|NorthwindKai|Marigold77|QuietTundra|LanternFox|Cobalt_Ash|OrchardWolf/.test(await txt('.dp-pn b')) && await has('[data-act="dp-friend"]') && (await txt('.dp-motto')).length > 3);
  ok('player page: Send Message, Player Profile, Mute Player', (await ev(() => [...document.querySelectorAll('#sheet .dp-acts [data-act]')].map(x => x.dataset.act).join(','))) === 'dp-chat,dp-profile,dp-mute');
  await click('[data-act="dp-friend"]'); ok('Add Friend: turns into Friend ✓ and is stored', /Friend ✓/i.test(await txt('[data-act="dp-friend"]')) && (await ev(() => friendsOf(0).length)) === 1);
  await click('[data-act="dp-friend"]'); ok('Friend ✓ again: removed', (await ev(() => friendsOf(0).length)) === 0);

  // ---- the relation menu (Japan: NAP -> the treaty-breaker warning) ----
  await ev(n => window.__im.dp.nation(n), I.Japan); await click('.dp-chev');
  ok('menu: opens under the diamonds', await has('.dp-menu'));
  await click('[data-act="dp-rel"][data-k="war"]'); const wc = await txt('.dp-warc');
  ok('menu: declare war asks first, with the treaty-breaker warning', /treaty breaker/i.test(wc) && /−50|50 less/.test(wc), wc);
  await click('[data-act="dp-warno"]'); ok('menu: Cancel closes the confirm', !(await has('.dp-warc')) && (await ev(n => relView(0, n).st, I.Japan)) === 'nap');
  await ev(n => window.__im.dp.nation(n), I.China); await click('.dp-chev');
  ok('menu: no war during a ceasefire (greyed, with the days left)', await ev(() => { const b = document.querySelector('#sheet [data-act="dp-rel"][data-k="war"]'); return !!b && b.disabled && /Ceasefire: \d+ d left/.test(b.innerText); }));

  // ---- the conversation ----
  await ev(n => { devPerson(n, true); window.__im.dp.go('chat', n); }, I.Italy);
  ok('conversation: the empty state, exactly', (await txt('.dp-empty')) === 'Create a new trade or type a message below to start this conversation.', await txt('.dp-empty'));
  ok('conversation: header name, back, close; Send Message, New Trade, Mute Player', await has('.dp-chh [data-act="dp-back"]') && await has('.dp-chh > .mx') && (await ev(() => [...document.querySelectorAll('#sheet .dp-cbs [data-act]')].map(x => x.dataset.act).join(','))) === 'dp-send,dp-trade,dp-mute');
  await p.fill('#dp-text', 'Hello there'); await click('[data-act="dp-send"]');
  ok('conversation: a message to a player goes into both threads', await ev(n => { const T = threadView(0, n); return T.items.length === 1 && T.items[0].text === 'Hello there' && T.items[0].mine; }, I.Italy) && /Hello there/.test(await txt('.dp-msg.me')));
  await ev(n => window.__im.dp.go('chat', n), I.Germany);
  const ocard = await ev(() => { const c = document.querySelector('#sheet .dp-offer.st-waiting'); return c ? [...c.querySelectorAll('[data-act]')].map(x => (x.dataset.a || x.dataset.act)).join(',') : ''; });
  ok('conversation: a player\'s trade offer shows Accept, Decline, Counter', ocard === 'accept,decline,dp-counter', ocard);
  ok('conversation: offer card from my side (They give / You give)', /THEY GIVE[\s\S]*YOU GIVE/i.test(await txt('.dp-offer.st-waiting .dp-og')));
  await click('[data-act="dp-counter"]'); ok('Counter: opens the builder prefilled (counter-offer)', /counter-offer/i.test(await txt('.rhead h1')) && (await ev(() => { const T = window.__im.dp.DV.T; return !!T && !!T.counterOf; })));
  await ev(() => { const T = window.__im.dp.DV.T; T.give.cash += 10; window.__im.dp.render(); }); await click('[data-act="dp-tsend"]');
  ok('Counter: sent, the old offer is countered, mine waits (Withdraw)', await ev(n => { const O = offersWith(0, n); return O.length === 1 && O[0].mine && O[0].can.withdraw; }, I.Germany) && await has('.dp-offer.st-waiting [data-a="withdraw"]'));
  await ev(n => { devAnswer((S => S.deals.filter(o => o.from === 0 && o.to === n).pop().id)(window.__im.S), 'accept'); window.__im.dp.render(); }, I.Germany);
  ok('dev switch: the pretend player accepts my counter', /accepted/i.test(await ev(() => [...document.querySelectorAll('#sheet .dp-offer')].map(c => c.innerText).join(' | '))));
  await click('[data-act="dp-mute"]');
  ok('Mute: history hidden, notice and Unmute shown, unread not counted', await has('.dp-mutedn') && !(await has('.dp-msg')) && (await ev(n => isMuted(0, n), I.Germany)));
  await ev(n => { devWrite(n, 0); }, I.Germany); ok('Mute: their new messages are not counted', (await ev(n => threads(0).find(t => t.n === n).unread, I.Germany)) === 0);
  await click('.dp-mutedn [data-act="dp-mute"]'); ok('Unmute: history back', await has('.dp-msg') && !(await ev(n => isMuted(0, n), I.Germany)));
  // a computer nation's thread (D1): the six quick messages, the reply
  await ev(n => window.__im.dp.go('chat', n), I.France);
  ok('computer thread: six quick messages, no Mute', (await ev(() => document.querySelectorAll('#sheet .dp-quick [data-act="dp-quick"]').length)) === 6 && !(await has('[data-act="dp-mute"]')));
  const n0 = await ev(n => threadView(0, n).items.length, I.France); await click('[data-act="dp-quick"][data-t="Hello."]');
  ok('computer thread: a quick message gets the AI reply', (await ev(n => threadView(0, n).items.length, I.France)) === n0 + 2);

  // ---- trades with a computer nation: accept, counter, decline with reasons ----
  const tr = async (give, get, tre = []) => { await ev(([n, g, t, tr]) => { window.__im.dp.trade(n); const T = window.__im.dp.DV.T; Object.assign(T.give, g); Object.assign(T.get, t); T.treaty = tr; window.__im.dp.render(); }, [I.Mexico, give, get, tre]); const v = await txt('.dp-verdict'); await click('[data-act="dp-tsend"]'); return v; };
  const v1 = await tr({cash:200}, {oil:2000}); ok('trade: the footer predicts, the computer accepts', /accept/i.test(v1) && /Agreed/.test(await ev(n => threadView(0, n).items.slice(-1)[0].text, I.Mexico)), v1);
  await tr({cash:100}, {oil:40000}); ok('trade: the computer counters with a reason and an offer card', await ev(n => offersWith(0, n).some(o => !o.mine && o.src === 'deal'), I.Mexico) && /more in value/.test(await ev(n => threadView(0, n).items.filter(e => e.t === 'msg').slice(-1)[0].text, I.Mexico)));
  await tr({cash:10}, {oil:30000}); ok('trade: the computer declines with its reason', /not a serious offer/i.test(await ev(n => threadView(0, n).items.slice(-1)[0].text, I.Mexico)));
  ok('conversation: scrolled up to older messages, it stays there when the page refreshes', await ev(n => { window.__im.dp.go('chat', n); const h = document.getElementById('dp-hist'); const end = h.scrollTop > 0; h.scrollTop = 0; window.__im.dp.side(); return end && document.getElementById('dp-hist').scrollTop === 0; }, I.Mexico));
  ok('trade: the Messages & Trades row marks the waiting answer', await ev(n => { window.__im.dp.open(); window.__im.dp.DV.tab = 'msg'; window.__im.dp.render(); return !!document.querySelector(`#sheet .dp-th[data-id="${n}"] .dp-ans`); }, I.Mexico));
  // the builder: money, goods, a province (floor, lock, why), treaties both sides sign
  await ev(n => window.__im.dp.trade(n), I.Colombia);
  ok('builder: both sides, money quick buttons, goods, cities & provinces, Both sides sign', await has('.dp-ts.give') && await has('.dp-ts.get') && await has('[data-act="dp-tadd"][data-v="50"]') && (await ev(() => document.querySelectorAll('#sheet .dp-ts.give .dp-gd').length)) === 5 && await has('[data-act="dp-tpick"]') && (await ev(() => document.querySelectorAll('#sheet .dp-trs [data-act="dp-ttre"]').length)) === 4);
  ok('builder: a computer nation never sells land', /never sells land/.test(await txt('.dp-ts.get')));
  await click('[data-act="dp-tpick"][data-side="give"]'); ok('builder: the land picker lists captured land with value and floor', (await ev(() => document.querySelectorAll('#sheet .dp-pr').length)) >= 1 && /floor \$/.test(await txt('.dp-pr')));
  await click(`.dp-pr[data-id="${I.ven[1]}"]`); ok('builder: picking a province shows the locator and Show on map', await has('#terr-map') && await has('.dp-loc [data-act="goto"]') && (await ev(() => window.__im.dp.DV.T.give.provs.length)) === 1);
  ok('builder: the floor line in the footer', /Lowest price for your land/.test(await txt('.dp-tf')));
  ok('builder: the ceasefire chip is greyed with why (not at war)', await ev(() => document.querySelector('#sheet [data-act="dp-ttre"][data-k="peace"]').disabled));
  await p.fill('[data-act="dp-tv"][data-side="give"][data-k="cash"]', '-5'); await p.waitForTimeout(60);
  ok('builder: a negative amount is never sent (boxes stay at 0 or more)', (await ev(() => window.__im.dp.DV.T.give.cash)) === 0);
  await click('[data-act="dp-tclear"]'); ok('builder: Clear empties it', (await ev(() => { const T = window.__im.dp.DV.T; return T.give.provs.length + T.give.cash + T.treaty.length; })) === 0);
  // coalition gift (ECO-13)
  await ev(n => window.__im.dp.trade(n, {gift:true}), I.Canada);
  ok('gift: manpower box, no other side, Send to', (await ev(() => document.querySelectorAll('#sheet .dp-ts.give .dp-gd').length)) === 6 && !(await has('.dp-ts.get')) && /Send to/i.test(await txt('.dp-tf')));
  const c0 = await ev(n => window.__im.S.nations[n].cash, I.Canada); await ev(() => { window.__im.dp.DV.T.give.cash = 30; window.__im.dp.render(); }); await click('[data-act="dp-tsend"]');
  ok('gift: sent', (await ev(n => window.__im.S.nations[n].cash, I.Canada)) === c0 + 30);

  // ---- nothing removed: every action Diplomacy had today, in its new place ----
  const inv = [];
  const find = async (name, open, sel) => { await open(); const f = await has(sel); inv.push([name, f]); ok('inventory: ' + name, f, sel); };
  const list = tab => async () => { await ev(t => { window.__im.dp.open(); window.__im.dp.DV.tab = t; window.__im.dp.DV.routes = true; window.__im.dp.render(); }, tab); };
  const page = n => async () => { await ev(n => window.__im.dp.nation(n), n); };
  const menu = n => async () => { await ev(n => { window.__im.dp.nation(n); window.__im.dp.DV.menu = true; window.__im.dp.render(); }, n); };
  const chat = n => async () => { await ev(n => window.__im.dp.go('chat', n), n); };
  await find('help (i)', list('info'), '.dp-hb .itip');
  await find('relations on the map', list('info'), '.dp-hb [data-act="relmode"]');
  await find('close / back to the map', list('info'), '.rhead > .mx[data-act="resume"]');
  await find('treaty offer: Accept', chat(I.Brazil), '.dp-offer [data-a="accept"]');
  await find('treaty offer: Decline', chat(I.Brazil), '.dp-offer [data-a="decline"]');
  await find('computer trade proposal: Accept / Decline', chat(I.Japan), '.dp-offer [data-a="accept"] ~ [data-a="decline"]');
  await find('territory offer: Accept / Decline / Counter', chat(I.Colombia), '.dp-offer [data-a="accept"] ~ [data-a="decline"] ~ [data-act="dp-counter"]');
  await find('war thread pinned at the top (until read)', list('msg'), '.dp-th.war:first-child');
  await find('war declared on you (red card)', chat(I.Iran), '.dp-sys.war');
  await find('trade routes card', list('msg'), '.dp-routes');
  await find('route: Show', list('msg'), '.trr [data-act="goto"]');
  await find('route: Escort (sea)', list('msg'), '.trr [data-act="trade-escort"]');
  await find('route: Pause', list('msg'), '.trr [data-act="trade-pause"][data-v="1"]');
  await find('route: Close', list('msg'), '.trr [data-act="trade-close"]');
  await find('open a route with… (independent partners too)', list('msg'), '#tropen option[value^="c"]');
  await find('Open route', list('msg'), '[data-act="trade-open"]');
  await ev(n => { const R = window.__im.S.trade.routes.find(r => r.key === trKey(0, n)); if (R) tradeClose(0, R.id); }, I['United Kingdom']);
  await find('closed route: reopen ↺', list('msg'), '.chipx [data-act="trade-reopen"]');
  await ev(n => { const R = window.__im.S.trade.routes.find(r => r.key === trKey(0, n)); if (R) tradePause(0, R.id, true); }, I.Japan);
  await find('route: Resume', list('msg'), '.trr [data-act="trade-pause"][data-v="0"]');
  await find('coalition list (emblem, members, leader ★, common enemy, provinces, capitals)', list('coal'), '.dp-card .dp-mem b');
  await find('coalition: Rename', list('coal'), '.dp-card.mine [data-act="dp-bloc-rename"]');
  await find('coalition: Leave', list('coal'), '.dp-card.mine [data-act="dp-bloc-leave"]');
  await find('coalition: Give per partner', list('coal'), '.dp-card.mine [data-act="dp-give"]');
  await find('coalition victory text', list('coal'), '.dp-foot');
  await find('row: flag, name, coalition emblem', list('info'), '.dp-row .flg ~ .dp-rm .dp-co');
  await find('unread badge (tab)', list('info'), '.dp-tab[data-k="msg"] .badge');
  await find('provinces / known army / at war with', page(I.Russia), '.dp-sr.war');
  await find('trade route row on the page (Show / Close)', page(I.Mexico), '.dp-stats [data-act="trade-close"]');
  await find('relation and days left', page(I.China), '.dp-notes span');
  await find('opinion and its reasons', page(I.France), '.dp-op');
  await find('Message (player): Send Message', page(I.Germany), '[data-act="dp-chat"]');
  await find('Message (computer): Write to a nation', list('msg'), '#dp-newchat');
  await find('Trade deal: New Trade', page(I.Japan), '[data-act="dp-trade"]');
  await find('Propose peace: Offer ceasefire', menu(I.Russia), '[data-act="dp-rel"][data-k="peace"]');
  await find('Pay $X for peace', menu(I.Russia), '[data-act="dp-rel"][data-k="tribute"]');
  await find('Offer NAP', menu(I.France), '[data-act="dp-rel"][data-k="nap"]');
  await find('Ask passage', menu(I.France), '[data-act="dp-rel"][data-k="pass"]');
  await find('Propose alliance', menu(I.France), '[data-act="dp-rel"][data-k="ally"]');
  await find('Declare war', menu(I.France), '[data-act="dp-rel"][data-k="war"]');
  await find('Open trade route', menu(I.France), '[data-act="dp-rel"][data-k="route-open"]');
  await find('Close trade route', menu(I.Mexico), '[data-act="dp-rel"][data-k="route-close"]');
  await find('Embargo', menu(I.France), '[data-act="dp-rel"][data-k="embargo"]');
  await find('Join embargo', menu(I.Argentina), '[data-act="dp-rel"][data-k="embargo-join"]');
  await find('Lift embargo', menu(I.Cuba), '[data-act="dp-rel"][data-k="embargo-lift"]');
  await find('Territory: cities & provinces in the builder', async () => { await ev(n => window.__im.dp.trade(n), I.Colombia); }, '[data-act="dp-tpick"][data-side="give"]');
  await find('Territory: Show on map', async () => { await ev(([n, v]) => { window.__im.dp.trade(n); const T = window.__im.dp.DV.T; T.pk = 'give'; T.loc = v[0]; window.__im.dp.render(); }, [I.Colombia, I.ven]); }, '.dp-loc [data-act="goto"]');
  await find('Territory: sales become cards (history)', async () => { await ev(([n, v]) => { terrSell(0, n, v[1], 90); window.__im.dp.go('chat', n); }, [I.Brazil, I.ven]); }, '.dp-sys.sale');
  await find('Give (coalition) in the menu', menu(I.Canada), '[data-act="dp-rel"][data-k="give"]');
  await find('Gift $50M: Send $50M aid', menu(I.Canada), '[data-act="dp-rel"][data-k="aid"]');
  await find('quick messages, text box, Send', chat(I.France), '.dp-quick ~ .dp-comp [data-act="dp-send"]');
  await find('Withdraw my offer', async () => { await ev(n => { dealPropose(0, n, {give:{...emptySide(), cash:10}, get:emptySide()}); window.__im.dp.go('chat', n); }, I.Germany); }, '.dp-offer [data-a="withdraw"]');
  await find('Back (nation page)', page(I.France), '.rhead [data-act="dp-back"]');
  ok('inventory: openNationPage for other screens (Market seller flags)', await ev(n => { window.__im.dp.nation(n); return window.__im.dp.DV.view === 'nation' && window.__im.dp.DV.n === n; }, I.Spain));
  // entry points that stay: the D key, the bottom bar, buttons elsewhere (diplo-open)
  await p.keyboard.press('Escape'); await p.waitForTimeout(80); await p.keyboard.press('d'); await p.waitForTimeout(120);
  ok('entry: D key opens the list', (await ev(() => window.__im.dp.modalKind())) === 'diplo' && await has('.dp-tabs'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(80); await p.click('#dipbtn'); await p.waitForTimeout(120); ok('entry: the bar button opens the list', await has('.dp-tabs'));
  ok('entry: the bar badge leaves out muted players', await ev(n => { muteSet(0, n, true); devWrite(n, 0); window.__im.dp.side(); const b = document.getElementById('dipbadge'); const k = +b.textContent; devWrite(n, 0); window.__im.dp.side(); return +document.getElementById('dipbadge').textContent === k; }, I.Poland));

  // ---- actions that change the game, last: war from the menu, leaving the coalition ----
  await ev(n => { window.__im.dp.nation(n); window.__im.dp.DV.menu = true; window.__im.dp.render(); }, I.France);
  await click('[data-act="dp-rel"][data-k="war"]'); await click('[data-act="dp-rel"][data-k="war"][data-sure="1"]');
  ok('war: declared from the confirm panel', (await ev(n => relView(0, n).st, I.France)) === 'war');
  await ev(() => { window.__im.dp.open(); window.__im.dp.DV.tab = 'coal'; window.__im.dp.render(); });
  await click('.dp-card.mine [data-act="dp-bloc-leave"]'); ok('coalition: Leave asks first', await has('.dp-warc [data-sure="1"]'));
  await click('.dp-warc [data-sure="1"]'); ok('coalition: left (allies now at peace)', (await ev(n => relView(0, n).st, I.Canada)) === 'peace');

  console.log(JSON.stringify({ size:[W, H], checks:Object.keys(checks).length, fails, errors, inventory:inv.length }, null, 1));
  await b.close(); process.exit(fails.length || errors.length ? 1 : 0);
})();
