// Iron Meridian rules: api. No DOM, canvas, window, storage, audio or camera in this file (node tools/split-lint.js checks it).
// The last rules file: IM.api names what a host calls (the page today, tools/headless.js, later a multiplayer server). Names only, no logic.
// Orders take the nation that gives them (or its force) as their first argument; nothing here names a seat. newGame takes the list of
// seats (the nations people play); what the rules report is addressed to a seat (see rules/core.js), and visibleSet(n) is nation n's fog of war.
'use strict';
IM.api = {
  // the game: start, load, save, one quarter hour (tickQ: three of four are battle-only steps, the fourth is the hour's tick; S.q counts them) and a whole hour (tick)
  newGame, restore, saveJSON, tickQ, tick,
  // the same quarter hour run a part at a time (the page's game loop: tickQSlice(more) runs while more() is true, returns true when done; tickPending)
  tickQSlice, tickPending,
  // which world the next new game is (a scenario key: 'world' the classic 15 powers, 'world64' the nations world of nations.js)
  useScenario,
  // the maps (0 world.js; mapNew the nations world's, with the province split): a map's provinces without switching to it, or the switch itself
  mapOf, useMap, get mapNew(){ return MAP_NEW; },
  get S(){ return S; }, get G(){ return G; }, get BATTLE_Q(){ return BATTLE_Q; },
  // seats and what a seat sees; a seat's membership (the mobilization queue: rules/production.js; no payment in the rules)
  seats, isSeat, desk, isMember, setMember, visibleSet, armyVisible, armyShown, armyKnown, armyView,
  // orders (first argument: the nation, or its force)
  recruit, build, buildMissile, startResearch, buildLink,
  orderMove, haltArmy, splitArmy, splitPlan, merge, addStop, undoStop, stopsOf, stopsEta,
  orderAir, recallAir, splitWing, mergeMates, mergeWings, orderDrop, launchMissile, launchSat, startSpy,
  declareWar, surpriseWar, acceptOffer, applyDeal,
  // the Diplomacy screens (rules/dealings.js): people, threads, trades and the relation menu (first argument: the seat), and their pure readers
  leaderOf, personOf, isPerson, seatInfo, muteSet, isMuted, friendSet, friendsOf, markRead, msgSend, dealNorm, dealWhy, dealAnswer, dealPreview, dealPropose, dealApply, offerAct,
  relView, relRows, relInfo, relMenu, relAct, natStats, natStatsAll, knownArmy, warList, offersWith, threads, threadView, unreadAll, treatyWhy, treatyPropose, giftCash, payTribute, blocRename, blocLeave, embargoAct, terrTransfer, blocsView,
  tradeOpen, tradeClose, postOffer, fillOffer, escortSet,
  // the Market: withdraw one's own offer; what the page reads (the best offers for a good, what limits taking one, the whole game's world prices)
  cancelOffer, topOffers, fillLimit, worldHistory,
  // a seat's dealings with an AI nation (first argument: the seat)
  say, aiReply, dealOK, dealValueFor, applyTrade, sendGift, tribute, tributeOk,
  // territory sales (rules/territory.js): a nation offers or answers; the value, the floor and what may be sold
  terrOffer, terrAnswer, provValue, terrMin, terrFloor, terrWhyNot, capturedFrom,
  // occupation, morale and rebels (rules/economy.js): Annex City (the nation, the city) and why it may not now ('' when it may), its price; a
  // province's morale factors (the city panel), its status, the rebel chance tonight; the routes a nation lost to war (rules/trade.js)
  annexCity, annexWhy, annexCost, morFactors, occSt, rebelOdds, lostRoutesOf
};
