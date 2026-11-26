// The REBELS screens' scenes (shared by .test/rebels2-screens.js and the Before / After sheets): a nations game as Poland at war with Germany,
// Dresden (a German city) taken, with or without Polish troops, its morale set, the game paused at a fixed hour. Works on a page from before this
// rule too (master: no S.mor, the old unrest): there the same morale is set through unrest, so both columns show the same city at the same hour.
//   const SC = require('./rebels2-scene.js'); await SC.start(page, 'Poland'); const s = await SC.dresden(page, {mor:28, inf:2, hour:...});
const pickNation = require('./pick-nation.js');
exports.start = async function start(p, nation = 'Poland', page){
  await p.goto('file://' + page + '?start=nations'); await p.waitForSelector('[data-act="pick"]'); await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await pickNation(p, nation); await p.click('[data-act="begin"]'); await p.click('[data-act="start"]');
  await p.waitForFunction(() => window.__im && window.__im.S && !window.__im.camFly, null, {timeout:60000}); await p.waitForTimeout(400);
  await p.addStyleTag({content:'#ftip{display:none !important}'}); p._hideToasts = await p.addStyleTag({content:'#toasts, .toast, #toast{display:none !important}'});
  await p.evaluate(() => { const S = window.__im.S; S.speed = 0; }); };
// the scene: city `city` (default Dresden) held by the player, morale m, inf infantry of the player there, rebels n (0: none), the hour h
exports.city = async function city(p, o = {}){
  return p.evaluate(o => { const im = window.__im, S = im.S, G = im.G, me = 0, nm = o.city || 'Dresden', from = o.from || 'Germany';
    const DE = S.nations.findIndex(N => N.name === from), c = G.P.find(P => P.city && P.cityName === nm).id;
    if (o.war !== false) setRel(me, DE, 'war');
    for (const a of S.armies) if (a.at === c && !a.air) for (const k in a.u) a.u[k] = 0; removeEmpty();
    if (S.owner[c] !== me) capture(c, me);
    if (o.inf) addArmy(me, c, {inf:o.inf});
    if (o.hour != null){ S.hour = o.hour; }
    const setM = (p, m) => { if (S.mor) S.mor[p] = m; else { S.unrest[p] = Math.max(0, 100 - m - (S.dmg ? S.dmg[p] || 0 : 0)); } };
    if (o.mor != null) setM(c, o.mor);
    if (o.nb) for (const v of G.P[c].nbs) if (!G.P[v].sea && S.owner[v] === me) setM(v, o.nb);
    if (o.rebels && typeof rebelRise === 'function'){ const r = addArmy(-1, c, {inf:o.rebels}); r.rebel = true; (S.rbl || (S.rbl = [])).push({id:r.id, p:c, o:me}); }
    else if (o.rebels){ const r = addArmy(-1, c, {inf:o.rebels}); r.rebel = true; }
    if (o.cash) S.nations[me].cash = o.cash; if (o.mp) S.nations[me].mp = o.mp;
    im.geoDirty && im.geoDirty(); if (o.select !== false) im.selectProv(c); return {c, DE, x:G.P[c].x, y:G.P[c].y}; }, o); };
// the camera on province c at hexPx (the map's zoom: view.s*HS0), the city at the middle of the map (or at frac of the map's height)
exports.camera = async function camera(p, c, hexPx, frac = 0.5){
  await p.evaluate(({c, hexPx, frac}) => { const im = window.__im, P = im.G.P[c], v = im.view, R = document.getElementById('map').getBoundingClientRect(), HS0v = im.hexPx()/v.s;
    const s = hexPx/HS0v; v.s = s; v.x = R.width/2 - P.x*s; v.y = R.height*frac - P.y*s; }, {c, hexPx, frac});
  await p.waitForTimeout(300); };
// show the dispatches' toasts again (the scenes hide them so that panels stand clear)
exports.toasts = async function toasts(p){ if (p._hideToasts){ await p._hideToasts.evaluate(e => e.remove()); p._hideToasts = null; } };
