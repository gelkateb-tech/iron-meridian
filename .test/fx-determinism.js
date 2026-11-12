// The effects are visual only: node .test/fx-determinism.js [days=3] [seed=12345]
// Plays the same seeded world game for N days in the page, one battle step (15 game minutes) per drawn frame, with the camera following a
// battle close in (figures firing, shells, impacts, missiles, strikes all drawn), once each with Effects High, Low and Off and with the Battery
// saver on and off. After every game day it records one hash of the whole saved rules state (as tools/split-golden.js does). All runs must give
// the same hashes, the same dice state (S.rs) and no page errors; exit 1 otherwise. It also reports how many effects each run drew.
const { chromium } = require('playwright'); const path = require('path');
const DAYS = +(process.argv[2] || 3), SEED = +(process.argv[3] || 12345);
const RUNS = [['high', false], ['low', false], ['off', false], ['high', true], ['low', true]];
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const out = [], errors = [];
  for (const [fx, saver] of RUNS){ const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
    p.on('pageerror', e => errors.push(`${fx}${saver ? '+saver' : ''}: ${e.message}`)); p.on('console', m => { if (m.type() === 'error') errors.push(`${fx}: ${m.text()}`); });
    await p.goto('file://' + path.join(__dirname, 'page.html')); await p.waitForTimeout(500);
    await p.click('[data-act="pick"][data-p="0"]'); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
    await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, { timeout: 30000 }); await p.waitForTimeout(800);
    const r = await p.evaluate(async ([days, seed, fx, saver]) => { const im = window.__im; newGame(seed, 0, [0]); S.started = true; S.speed = 0; im.SET.fx = fx; im.SET.saver = saver;
      const hash = s => { let h1 = 0x811c9dc5, h2 = 0x1b873593; for (let i = 0; i < s.length; i++){ const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 + c, 0x85ebca6b) ^ (h2 >>> 13); } return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0'); };
      const fr = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const sig = []; let maxP = 0, maxJ = 0, shots = 0;
      const look = () => { const p = S.battles[0] ?? (S.inflight && S.inflight[0] ? S.inflight[0].to : null); if (p == null) return; const P = G.P[p], s = 12; im.view.s = s; im.view.x = innerWidth/2 - P.x*s; im.view.y = 400 - P.y*s; };
      const fire = () => { if (!S.battles.length) return; const P = G.P[S.battles[0]]; for (const w of ['tank', 'art', 'mlrs', 'inf', 'ship', 'fighter', 'bomber', 'drone', 'swarm']) im.cfx.fire(w, [P.x - 6, P.y + 2], [P.x + 2, P.y], { hit: Math.random() < 0.7 }); im.cfx.fire('cruise', [P.x - 12, P.y], [P.x, P.y]); im.cfx.intercept([P.x - 3, P.y + 3], [P.x, P.y], { kind: 'cm' }); shots++; };
      for (let h = 0; h < days*24; h++){ if (h % 3 === 0){ look(); fire(); } for (let q = 0; q < 4; q++){ tickQ(); im.redraw(); await fr(); maxP = Math.max(maxP, im.cfx.stats().partFx); maxJ = Math.max(maxJ, im.cfx.PROJ.length); }
        if (h % 24 === 23){ const o = JSON.parse(saveJSON()); delete o.savedAt; sig.push(`day ${S.hour/24} ${hash(JSON.stringify(o))} rs ${S.rs} forces ${S.armies.length}`); } }
      return { sig, maxP, maxJ, shots, battles: S.battles.length }; }, [DAYS, SEED, fx, saver]);
    out.push({ run: fx + (saver ? '+saver' : ''), ...r }); console.log(out[out.length - 1].run, JSON.stringify({ maxFiringParticles: r.maxP, maxProj: r.maxJ, volleys: r.shots, battles: r.battles }), '\n  ' + r.sig.join('\n  '));
    await p.context().close(); }
  const ref = out[0].sig.join('|'), same = out.every(o => o.sig.join('|') === ref && o.sig.length === DAYS);
  console.log(same ? `SAME: ${out.length} runs (Effects High, Low, Off; Battery saver on/off) give identical rules state hashes for ${DAYS} days` : 'DIFFERENT: the effects changed the rules state');
  if ((out.find(o => o.run === 'off') || {}).maxP > 0) errors.push('Effects Off still made particles');
  if (out.some(o => o.maxP > 150*1.3)) errors.push('firing-particle cap (about 150) exceeded: ' + out.map(o => o.maxP).join(' '));
  console.log('ERRORS', errors.length ? errors.slice(0, 8) : 'none'); await b.close(); process.exit(same && !errors.length ? 0 : 1); })();
