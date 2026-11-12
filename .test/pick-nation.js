// Picks a nation card on the start screen by its name (not by its index): node tests do `const pickNation = require('./pick-nation.js');`
// then `await pickNation(p, 'Germany')`. Works on both worlds of the start screen: the classic 15 powers (test pages open on it) show every card;
// the nations world (the players' start screen, page.html?start=nations, the public build) shows the cards of one region at a time, so each
// region's tab is tried until the card shows. The 15 classic powers have the same index in both worlds, but a name does not depend on that.
module.exports = async function pickNation(p, name){
  const card = () => p.locator('[data-act="pick"]').filter({ has: p.locator('b', { hasText: new RegExp('^' + name + '$') }) });
  if (!await card().count()) for (const k of await p.$$eval('[data-act="pickreg"]', a => a.map(x => x.dataset.k))){ await p.click('[data-act="pickreg"][data-k="' + k + '"]'); if (await card().count()) break; }
  if (!await card().count()) throw new Error('pickNation: no card for ' + name + ' on the start screen');
  await card().first().click(); };
