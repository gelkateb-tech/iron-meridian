// Iron Meridian rules: api. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
// The last rules file: IM.api names what a host calls (the page today, tools/headless.js, later a multiplayer server). Names only, no logic.
// Orders take the nation id (or the force) as their first argument. PLAYER (rules/data.js) is still seat 0 for the dispatches the rules
// address to "the player"; per-seat delivery comes with the server.
'use strict';
IM.api = {
  // the game: start, load, save, one hour
  newGame, restore, saveJSON, tick,
  get S(){ return S; }, get G(){ return G; },
  // orders
  recruit, build, buildMissile, startResearch, buildLink,
  orderMove, splitArmy, merge,
  orderAir, orderDrop, launchMissile, launchSat,
  declareWar, surpriseWar, acceptOffer,
  tradeOpen, tradeClose, postOffer, fillOffer
};
