// Picks a nation card on the start screen by its name (not by its index): node tests do `const pickNation = require('./pick-nation.js');`
// then `await pickNation(p, 'Germany')`. Works on both worlds of the start screen: the classic 15 powers (test pages open on it) show every card;
// the nations world (the players' start screen, page.html?start=nations, the public build) shows one A-Z list of all nations with a search box; the card is clicked in the list (or found by typing its name in the search box). The 15 classic powers have the same index in both worlds, but a name does not depend on that.
module.exports = async function pickNation(p, name){
  const card = () => p.locator('[data-act="pick"]').filter({ has: p.locator('b', { hasText: new RegExp('^' + name + '$') }) });
  if (!await card().count()) throw new Error('pickNation: no card for ' + name + ' on the start screen');
  if (!await card().first().isVisible()){ await p.fill('#pickq', name); }   // (a search left in the box hides other nations: search for this one)
  await card().first().click(); };
