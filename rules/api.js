// Iron Meridian rules: api. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
// The last rules file: IM.api names what a host calls (the page today, tools/headless.js, later a multiplayer server). Names only, no logic.
// Orders take the nation that gives them (or its force) as their first argument; nothing here names a seat. newGame takes the list of
// seats (the nations people play); what the rules report is addressed to a seat (see rules/core.js), and visibleSet(n) is nation n's fog of war.
'use strict';
IM.api = {
  // the game: start, load, save, one quarter hour (tickQ: three of four are battle-only steps, the fourth is the hour's tick; S.q counts them) and a whole hour (tick)
  newGame, restore, saveJSON, tickQ, tick,
  get S(){ return S; }, get G(){ return G; }, get BATTLE_Q(){ return BATTLE_Q; },
  // seats and what a seat sees
  seats, isSeat, desk, visibleSet, armyVisible,
  // orders (first argument: the nation, or its force)
  recruit, build, buildMissile, startResearch, buildLink,
  orderMove, haltArmy, splitArmy, splitPlan, merge,
  orderAir, orderDrop, launchMissile, launchSat, startSpy,
  declareWar, surpriseWar, acceptOffer, applyDeal,
  tradeOpen, tradeClose, postOffer, fillOffer, escortSet,
  // a seat's dealings with an AI nation (first argument: the seat)
  say, aiReply, dealOK, dealValueFor, applyTrade, sendGift, tribute, tributeOk
};
