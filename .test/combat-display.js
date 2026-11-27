// Combat display (owner 2026-11-27: "make fights read like Conflict of Nations"): while two armies fight, each army's bar and map label say
// "Fighting" and the enemy army it fights, count down to the next damage round (the rules' own 15-minute battle step, rules/tick.js battleStep)
// and, after each round, show what each side lost in it. Display only: no rule changes (tools/golden-12345.txt stays the same).
// node .test/combat-display.js [out dir] [W H dpr] [--shots] [--clip]   (bash tools/mkpage.sh first; exits 1 on any failure, prints JSON)
//   CD_PAGE=<page.html> runs another build's page (an older build: use --shots, pictures only, no checks)
// A classic-world game as Germany; every German force removed. Your army and a neighbour's (at war) in one German province; two other powers at
// war with each other (at peace with you) in another German province, the one force seen by your Special Forces (identified), the other not.
// Checks:
//  (P) your force's bar: "Fighting", the enemy's name and the next round's countdown; its status line "Fighting <enemy> at ..."
//  (L) the map labels of both armies: full ("FIGHTING", the foe's name: yours names theirs, theirs names yours), the countdown, the ring
//  (D) just after a round: a red chip with each side's loss (−x%) on its label, gone again after about 2 s; the bar's "last round" line with
//      this force's loss in health points and as a share and the enemy's as a share; the numbers are what each side's health fell by in the round
//  (C) the countdown and the ring move with the game's time (1x: seconds, down to "1 s", never "now" before the round) and read "N min" while
//      paused; 8x: "<1 s", not a flickering "now"
//  (R) the round's loss counts fire that hit the force between two rounds (artillery, air strikes, missiles: before the battle step); a force
//      split off in the battle is no loss
//  (U) fog: the foreign force fighting an unidentified one: its bar "Fighting ? Unidentified", never the other's nation or size; its label when
//      selected "? Unidentified"; no label on the unidentified contact itself; your own label never names it
//  (E) no console or page error
const fs = require('fs'), path = require('path'), pickNation = require('./pick-nation.js'), { chromium } = require('playwright');
const ARGS = process.argv.slice(2), POS = ARGS.filter(a => !a.startsWith('--')), SHOTS = ARGS.includes('--shots'), CLIP = ARGS.includes('--clip');
const OUT = POS[0] || path.join(__dirname, 'combat-display'), W = +(POS[1] || 1440), H = +(POS[2] || 900), DPR = +(POS[3] || (W <= 820 ? 2 : 1)), PHONE = W <= 820, TAG = PHONE ? 'phone' : 'desk';
const PAGE = process.env.CD_PAGE || path.join(__dirname, 'page.html'); fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: PHONE, isMobile: PHONE, ...(CLIP ? { recordVideo: { dir: OUT, size: { width: W, height: H } } } : {}) }), p = await ctx.newPage();
  const errors = [], checks = {}, fails = [], ok = (k, c, v) => { checks[k] = c ? 'PASS' : 'FAIL ' + JSON.stringify(v ?? null); if (!c) fails.push(k); };
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|net::ERR/.test(m.text())) errors.push('console: ' + m.text()); });
  await p.goto('file://' + PAGE); await p.waitForTimeout(500);
  await pickNation(p, 'Germany'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 120000 });
  // the scene (speed 0): your army and the neighbour's in one province, at war; two other powers at war in another German province
  const C = await p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); const im = window.__im, S = im.S, G = im.G; S.speed = 0; if (im.SET) im.SET.tipsOff = true;
    const de = G.P.filter(q => !q.sea && S.owner[q.id] === 0), far = (x, y) => de.filter(q => !q.city).sort((a, b) => Math.hypot(b.x - x, b.y - y) - Math.hypot(a.x - x, a.y - y));
    // the neighbour: the power owning most land next to Germany
    const nb = {}; for (const q of de) for (const v of q.nbs){ const o = S.owner[v]; if (o > 0 && !G.P[v].sea) nb[o] = (nb[o] || 0) + 1; } const foeN = +Object.keys(nb).sort((x, y) => nb[y] - nb[x])[0];
    const A = de.filter(q => !q.city && q.nbs.some(v => S.owner[v] === foeN)).sort((x, y) => y.cells - x.cells || 0)[0] || de.find(q => !q.city);
    const others = S.nations.map((n, i) => i).filter(i => i > 0 && i !== foeN && S.nations[i].alive && rel(0, i).st !== 'ally' && !atWar(0, i)), X = others[0], Y = others.find(i => i !== X && rel(X, i).st !== 'ally');
    // the other battle: the widest German province away from A (room for the two forces 150 km and more apart)
    const pAt = (x, y) => { const c = worldToCell(x, y); return c >= 0 ? G.prov[c] : -1; }, span = q => { let x0 = q.x, x1 = q.x; for (let d = 0; d < 60; d += 0.25){ if (pAt(q.x - d, q.y) === q.id) x0 = q.x - d; if (pAt(q.x + d, q.y) === q.id) x1 = q.x + d; } return [x0, x1]; };
    const B = de.filter(q => q.id !== A.id && !q.city && !q.nbs.includes(A.id) && Math.hypot(q.x - A.x, q.y - A.y) > 30).map(q => ({q, s:span(q)})).sort((u, v) => (v.s[1] - v.s[0]) - (u.s[1] - u.s[0]))[0];
    for (const a of S.armies) if (a.owner === 0 || ((a.owner === foeN || a.owner === X || a.owner === Y) && (a.at === A.id || a.at === B.q.id || de.some(q => q.id === a.at)))) for (const t in a.u) a.u[t] = 0;
    removeEmpty();
    const own = im.addArmy(0, A.id, {inf:6, tank:3, ifv:2}); own.pos = [A.x - 2.2, A.y + 0.4];
    const foe = im.addArmy(foeN, A.id, {inf:5, tank:2, at:2}); foe.pos = [A.x + 2.2, A.y - 0.4];
    setRel(0, foeN, 'war');
    const [bx0, bx1] = B.s, xa = im.addArmy(X, B.q.id, {inf:5, tank:2}), ya = im.addArmy(Y, B.q.id, {inf:6, art:2});
    xa.pos = [bx0 + 1.2, B.q.y]; ya.pos = [bx1 - 1.2, B.q.y]; setRel(X, Y, 'war'); setRel(0, X, 'peace'); setRel(0, Y, 'peace');
    const sx = bx0 - 1.2, sp = pAt(sx, B.q.y), spec = im.addArmy(0, sp >= 0 && S.owner[sp] === 0 ? sp : B.q.id, {spec:2}); spec.pos = [sx, B.q.y];   // your Special Forces just across the border from X's force (not in the battle): they identify within 100 km
    for (const a of [own, foe, xa, ya, spec]){ a.to = null; a.path = []; a.m = 80; }
    im.computeSupply && im.computeSupply(); im.tick(); for (const a of [own, foe, xa, ya, spec]){ a.to = null; a.path = []; } im.air.visibleSet();
    const r = document.getElementById('map').getBoundingClientRect();
    return { own: own.id, foe: foe.id, xa: xa.id, ya: ya.id, spec: spec.id, A: A.id, B: B.q.id, Aname: A.name, Bname: B.q.name, foeN, X, Y, foeNat: S.nations[foeN].name, Xnat: S.nations[X].name, Ynat: S.nations[Y].name,
      cA: [A.x, A.y], cB: [(bx0 + bx1)/2, B.q.y], cX: [bx0 + 1.2, B.q.y], km: (bx1 - bx0 - 2.4)/KM_W, w: r.width, h: r.height, x: r.left, y: r.top }; });
  const view = async (hp, at, dy = 0) => { await p.waitForFunction(() => !window.__im.camFly, null, { timeout: 10000 }).catch(() => {}); return p.evaluate(([x, y, hp, w, h, dy]) => { const v = window.__im.view, s = hp/12; v.s = s; v.x = w/2 - x*s; v.y = h/2 + dy - y*s; window.__im.redraw && window.__im.redraw(); }, [at[0], at[1], hp, C.w, C.h, dy]); };
  const st = () => p.evaluate(() => ({ q: window.__im.S.q, hour: window.__im.S.hour, battles: window.__im.S.battles.slice() }));
  const pills = () => p.evaluate(() => window.__imFight ? JSON.parse(JSON.stringify(window.__imFight.pills)) : []);
  const bar = () => p.evaluate(() => { const t = s => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; }; return { fight: t('.ab-fight'), tick: t('.ab-fight .ab-tick'), status: t('#ctx .status'), name: t('.ab-nm h2'), all: t('#ctx') }; });
  const clean = () => p.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); document.querySelectorAll('[data-act="tip-ok"], .ftip button').forEach(b => b.click()); });
  // runs the clock at 1x until the next battle step has run (and the hour's tick, if one comes, is over), then pauses after `after` ms
  const nextRound = async (after = 350, keep = false) => { const s0 = await st(); await p.evaluate(() => { window.__im.S.speed = 1; });
    await p.waitForFunction(([q, h]) => { const S = window.__im.S; return (S.q !== q || S.hour !== h) && !tickPending(); }, [s0.q, s0.hour], { timeout: 60000 }).catch(e => { console.log(JSON.stringify({ stuck: true, errors })); throw e; }); await p.waitForTimeout(after);
    if (!keep) await p.evaluate(() => { window.__im.S.speed = 0; }); return st(); };
  // (a screenshot of a busy machine can take longer than the 2 s the chips show: the test build's hold keeps them on while it is taken)
  const shot = async (nm) => { await p.evaluate(() => { if (window.__imFight) window.__imFight.hold = true; }); await clean(); const f = path.join(OUT, `${TAG}-${nm}.png`); await p.screenshot({ path: f }); await p.evaluate(() => { if (window.__imFight) window.__imFight.hold = false; }); return f; };
  const shots = [];
  // (a busy machine can take longer than the chips' 2 s between the round and the read: held keeps them on while it reads; (D) checks they go)
  const held = async f => { await p.evaluate(() => { if (window.__imFight) window.__imFight.hold = true; }); await p.waitForTimeout(100); const r = await f(); await p.evaluate(() => { if (window.__imFight) window.__imFight.hold = false; }); return r; };
  const shortN = t => (t = t.replace(/ Division$/, ' Div.').replace(/ Brigade$/, ' Bde.')).length > 18 ? t.slice(0, 17).trimEnd() + '…' : t;   // (the map label's short name)
  const ownName = await p.evaluate(id => window.__im.S.armies.find(a => a.id === id) && armyName(window.__im.S.armies.find(a => a.id === id)), C.own);
  const foeName = await p.evaluate(id => armyName(window.__im.S.armies.find(a => a.id === id)), C.foe), foeLabel = C.foeNat + ' ' + foeName;
  // ---- the battle starts (the first round at 1x); your force selected, the bar open
  const dy = PHONE ? -H*0.2 : 0, ZP = PHONE ? 120 : 150, ZU = PHONE ? 70 : 90;   // (hex px: the play zoom; the other battle a little further out)
  await view(ZP, C.cA, dy); await p.waitForTimeout(600);
  let s1 = await nextRound(50); ok('setup: both battles are on (started on the hour)', s1.battles.includes(C.A) && s1.battles.includes(C.B), { s1, C });
  await p.evaluate(id => window.__im.selectArmy(id), C.own); await view(ZP, C.cA, dy);
  s1 = await nextRound(300);
  // (the bar's countdown is refreshed every 180 ms, abTickPatch: read once it has caught up with the pause, 400 ms; held: the chips stay on while it waits)
  await p.evaluate(() => { window.__imFight.hold = true; }); await p.waitForTimeout(400);
  const P1 = await pills(), b1 = await bar(); await p.evaluate(() => { window.__imFight.hold = false; });
  shots.push(await shot('panel-after-round'));
  if (!SHOTS){
    ok('(P) your bar: "Fighting" and the enemy army by name', !!b1.fight && /^Fighting/.test(b1.fight) && b1.fight.includes(foeLabel), { b1, foeLabel });
    ok('(P) your bar: the next round\'s countdown (paused: game minutes)', !!b1.tick && /^\d+ min$/.test(b1.tick) && b1.fight.includes('Next round ' + b1.tick), b1);
    ok('(P) its status line: "Fighting <enemy> at <province>"', !!b1.status && b1.status.startsWith('Fighting ' + foeLabel + ' at '), b1.status);
    const po = P1.find(q => q.ids.includes(C.own)), pf = P1.find(q => q.ids.includes(C.foe));
    ok('(L) your map label: full, names the enemy army, countdown and ring', !!po && po.full && po.name === shortN(foeName) && /^\d+ min$/.test(po.time) && po.ring >= 0 && po.ring <= 1, { po, foeName });
    ok('(L) the enemy\'s map label names your army', !!pf && pf.full && pf.name === shortN(ownName), { pf, ownName });
    ok('(L) the label stands over or under its counter, inside the map', !!po && (po.y + po.h <= po.plate[1] || po.y >= po.plate[1] + po.plate[3]) && po.x >= 0 && po.x + po.w <= C.w && Math.abs(po.x + po.w/2 - (po.plate[0] + po.plate[2]/2)) < po.w, po);
    // (D) the round's losses: the chips, and the bar's line
    const R = await p.evaluate(([o, f, A]) => { const im = window.__im, c = window.__imFight.cbr(A), m = new Map(c.f); const e = m.get(o), g = m.get(f); return { own: e, foe: g, k: c.k, now: c.now }; }, [C.own, C.foe, C.A]);
    const pct = e => '−' + (e.lost/e.h0*100 < 9.95 ? (e.lost/e.h0*100).toFixed(1) : String(Math.round(e.lost/e.h0*100))) + '%';
    ok('(D) just after a round: your label\'s chip is your loss in it ("lost −x%")', !!po && !!R.own && R.own.lost > 0 && po.chip === 'lost ' + pct(R.own) && po.chipA > 0.5, { po, R });
    ok('(D) ... and the enemy\'s chip its loss', !!pf && !!R.foe && R.foe.lost > 0 && pf.chip === 'lost ' + pct(R.foe), { pf, R });
    ok('(D) the bar: "last round: this force −N (x%) · enemy −y%"', b1.fight.includes(`last round: this force −${R.own.lost < 9.95 ? R.own.lost.toFixed(1) : Math.round(R.own.lost)} (${pct(R.own).slice(1)}) · enemy ${pct(R.foe)}`), { b1, R });
    await p.waitForTimeout(2300); const P2 = await pills(); const po2 = P2.find(q => q.ids.includes(C.own));
    ok('(D) the chip is gone about 2 s after the round', !!po2 && po2.chip === '', po2);
  }
  // ---- the map label alone (the bar closed), just after a round
  await p.evaluate(() => window.__im.clearSel()); await view(ZP, C.cA, 0); await p.waitForTimeout(300);
  await nextRound(350); const P3 = await held(pills); shots.push(await shot('map-after-round'));
  if (!SHOTS){ const po = P3.find(q => q.ids.includes(C.own)); ok('(L) with nothing selected your label is still full, the chip on', !!po && po.full && po.name === shortN(foeName) && /^lost −/.test(po.chip), po); }
  // close in (the flag tag over the pictures) and far out (the world view), just after a round
  for (const [nm, hp] of [['close', 240], ['far', PHONE ? 30 : 40]]){ await view(hp, C.cA, 0); await p.waitForTimeout(900); await nextRound(350); const P4 = await held(pills); shots.push(await shot('map-' + nm));
    if (!SHOTS){ const po = P4.find(q => q.ids.includes(C.own)); ok(`(L) ${nm} zoom: the label and the chip`, !!po && po.full && /^lost −/.test(po.chip), { po, cbr: await p.evaluate(A => window.__imFight.cbr(A), C.A) }); } }
  // ---- (C) the countdown moves with the clock
  if (!SHOTS){ await view(ZP, C.cA, 0); await p.evaluate(id => window.__im.selectArmy(id), C.own); await p.waitForTimeout(400);
    await nextRound(150, true); await p.waitForTimeout(200); const a0 = await pills(), t0 = await bar(); await p.waitForTimeout(1300); const a1 = await pills(), t1 = await bar(); await p.evaluate(() => { window.__im.S.speed = 0; });
    const q0 = a0.find(q => q.ids.includes(C.own)), q1 = a1.find(q => q.ids.includes(C.own));
    ok('(C) 1x: the bar counts down in seconds', /^\d+ s$/.test(t0.tick || '') && /^\d+ s$/.test(t1.tick || '') && +t1.tick.split(' ')[0] < +t0.tick.split(' ')[0], [t0.tick, t1.tick]);
    ok('(C) 1x: the label counts down with it and its ring fills', !!q0 && !!q1 && /^\d+ s$/.test(q1.time) && +q1.time.split(' ')[0] < +q0.time.split(' ')[0] && q1.ring > q0.ring, [q0, q1]);
    await p.evaluate(() => { window.__im.S.speed = 4; }); await p.waitForTimeout(700); const f8 = await pills(), b8 = await bar(); await p.evaluate(() => { window.__im.S.speed = 0; });
    const q8 = f8.find(q => q.ids.includes(C.own)); ok('(C) 8x (a round every half second): "<1 s", not "now"', !!q8 && q8.time === '<1 s' && b8.tick === '<1 s', [q8, b8.tick]);
    // 1x through two rounds, every animation frame: the label's countdown reads 4 s, 3 s, 2 s, 1 s, never "now"
    const seq = await p.evaluate(async own => { const out = []; window.__im.S.speed = 1; const t0 = performance.now();
      await new Promise(res => { const f = () => { const q = (window.__imFight.pills || []).find(z => z.ids.includes(own)), e = document.querySelector('.ab-fight .ab-tick'); out.push([q ? q.time : null, e ? e.textContent : null]); if (performance.now() - t0 < 8500) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
      window.__im.S.speed = 0; return out; }, C.own);
    const tx = new Set(seq.flatMap(v => v).filter(Boolean)); ok('(C) 1x: the countdown runs down to "1 s" and never reads "now"', tx.has('1 s') && tx.has('2 s') && !tx.has('now') && seq.filter(v => v[0] === '<1 s').length < 6, { texts:[...tx], lt1:seq.filter(v => v[0] === '<1 s').length });   // ("<1 s" only for the few frames the hour's own step runs over)
    await p.evaluate(() => window.__im.clearSel()); }
  // ---- (R) fire between rounds: a hit on your force while the clock is paused (as ranged fire, an air strike or a missile lands before the battle step)
  if (!SHOTS){ await nextRound(100); const hit = await p.evaluate(id => { const a = window.__im.S.armies.find(q => q.id === id), h = effHP(a); a.w.tank = (a.w.tank || 0) + 6; return h - effHP(a); }, C.own);
    await nextRound(100); const R2 = await p.evaluate(([o, A]) => new Map(window.__imFight.cbr(A).f).get(o), [C.own, C.A]);
    ok('(R) the round\'s loss counts the fire that hit your force since the round before', !!R2 && hit > 5.9 && R2.lost >= hit && R2.lost < hit + 15, { hit, R2 });
  }
  // ---- (U) a fight with an unidentified enemy: the other battle, the identified force selected
  await view(ZU, C.cB, PHONE ? -H*0.2 : 0); await p.waitForTimeout(600);
  await p.evaluate(id => window.__im.selectFoe(id), C.xa); await view(ZU, C.cB, PHONE ? -H*0.2 : 0); await p.waitForTimeout(300);
  await nextRound(350); const PU = await pills(), bu = await bar(); shots.push(await shot('unidentified'));
  if (!SHOTS){ const vis = await p.evaluate(([x, y]) => { const im = window.__im, a = id => im.S.armies.find(q => q.id === id); return { xKnown: im.intel.knowA(a(x)), yKnown: im.intel.knowA(a(y)), foes: window.__imFight.foes(x) }; }, [C.xa, C.ya]);
    ok('(U) setup: the one force identified, the other not (seen, a \'?\' contact)', vis.xKnown && !vis.yKnown && vis.foes && vis.foes.unk && vis.foes.main === null, { vis, km: C.km });
    ok('(U) its bar: "Fighting ? Unidentified"', !!bu.fight && bu.fight.startsWith('Fighting ? Unidentified'), bu);
    ok('(U) no word of the unidentified force\'s nation, name or size anywhere in the bar', !!bu.all && !bu.all.includes(C.Ynat) && !/\b8 units\b/.test(bu.all) && !/· enemy/.test(bu.fight), { bu, Ynat: C.Ynat });
    const px = PU.find(q => q.ids.includes(C.xa)); ok('(U) its label (selected): "? Unidentified" and the countdown', !!px && px.full && px.name === '? Unidentified' && px.more === 0, px);
    ok('(U) no label on the unidentified contact', !PU.some(q => q.ids.includes(C.ya)), PU);
    // not selected: another power's battle you only watch gets the ring and the countdown alone
    await p.evaluate(() => window.__im.clearSel()); await p.waitForTimeout(400); const PV = await pills(), pv = PV.find(q => q.ids.includes(C.xa));
    ok('(U) not selected: a battle of others shows the ring and countdown only', !!pv && !pv.full && pv.name === '', pv || PV); }
  // ---- (R) a force split off in your battle (last: it changes the scene)
  if (!SHOTS && !CLIP){ const sp = await p.evaluate(id => { const a = window.__im.S.armies.find(q => q.id === id), h = effHP(a), b = splitArmy(a); return { off: b ? effHP(b) : 0, b: b && b.id, h }; }, C.own);
    await nextRound(100); const R3 = await p.evaluate(([o, A]) => new Map(window.__imFight.cbr(A).f).get(o), [C.own, C.A]);
    ok('(R) a force split off in the battle is no loss of the one it left', sp.off > 5 && !!R3 && R3.lost < sp.off/2 && R3.h0 < sp.h - sp.off/2, { sp, R3 }); }
  // ---- a short clip: the fight with the countdown and two rounds (desktop)
  let clip = null;
  if (CLIP){ await p.evaluate(() => window.__im.clearSel()); await view(170, C.cA, 0); await p.evaluate(id => window.__im.selectArmy(id), C.own); await view(170, C.cA, 0); await clean();
    await p.evaluate(() => { window.__im.S.speed = 1; }); await p.waitForTimeout(11000); await p.evaluate(() => { window.__im.S.speed = 0; }); clip = await p.video().path(); }
  if (SHOTS) { for (const k in checks) checks[k] = 'skipped (--shots)'; fails.length = 0; }
  await ctx.close(); await b.close();
  console.log(JSON.stringify({ page: PAGE, size: [W, H, DPR], scene: { battle: C.Aname, vs: C.foeNat, other: C.Bname, X: C.Xnat, Y: C.Ynat, km: Math.round(C.km) }, checks, shots, clip, errors }, null, 1));
  console.log(fails.length || errors.length ? `FAILED ${fails.length} checks, ${errors.length} errors` : `OK ${Object.keys(checks).length} checks`);
  process.exit(fails.length || errors.length ? 1 : 0); })();
