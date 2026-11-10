// Rules split (owner task 5): the architect's assignment of every top-level declaration of the game script to a rules file or to the UI.
// Usage: node tools/split-plan.js            prints the summary (units per file, the UI names the rules still reach, load-order problems)
//        node tools/split-plan.js <file>     lists the units planned for rules/<file>.js with what each still needs from the UI
//        node tools/split-plan.js --json     writes tools/split-plan.json (name -> file) for tools
// It parses index.html as it is NOW (acorn), so line numbers follow the file as steps land; names already moved out are simply not found.
// Ranges are [first line, last line, file] against master a8680fe; OVERRIDE wins over ranges (by declared name).
'use strict';
const fs = require('fs'), path = require('path');
const { analyse } = require('./split-lint.js');
const ROOT0 = process.env.IM_ROOT || path.join(__dirname, '..');
const ORDER = ['core', 'data', 'map', 'state', 'research', 'production', 'economy', 'trade', 'movement', 'diplomacy', 'combat', 'air', 'vision', 'ai', 'tick'];
// by declared name (the first name of a multi-name declaration). 'ui' keeps a unit in index.html.
const PLAN = {
  core: ['log', 'alarm', 'bump'],
  data: ['UNITS', 'UNIT_NICK', 'MISSILES', 'CLASSES', 'CLASS_M', 'mult', 'UK', 'VSU_T', 'multU', 'RES', 'RLBL', 'yword', 'CK', 'hasC', 'payC', 'costParts', 'costTxt', 'missTxt', 'pluN', 'artA',
    'UT', 'MAINT_F', 'TERRAIN', 'TERR_KEYS', 'terr', 'RIVER_X', 'riverX', 'FOOT_U', 'tuf', 'ARC', 'arctic', 'fitW', 'fitOf', 'terrFit', 'rough', 'SEA_SPEED', 'LANE_F', 'KM_HEX', 'BUILD', 'BK', 'ROMAN',
    'TECH', 'techCost', 'TECH_BY', 'DOCTRINES', 'docOf', 'MARK_F', 'markOf', 'markCost', 'NUMW', 'cap1', 'NEUTRAL', 'W', 'K', 'DIFFS', 'diffOf', 'GRACE_H', 'WIN_SHARE', 'WIN_CAPS', 'DAY_LIMIT', 'CAP_MIN',
    'OX', 'WORLD_W', 'mulberry', 'rng', 'idx', 'NB_EVEN', 'NB_ODD', 'nbr', 'cube', 'hexDist', 'cellCenter', 'worldToCell', 'miller', 'invMiller', 'YMAX', 'cellLat', 'fmt', 'YK', 'yieldStr', 'fmt1', 'ord'],
  map: ['loadWorld', 'LANE_ROUTES', 'LANES', 'laneSet', 'isLane', 'NEARC', 'nearList', 'MONTHS', 'calDate', 'SZC', 'season', 'season0', 'SEASON_FX', 'stormAt', 'weatherSpd', 'weatherHour', 'capLon', 'sunOffFor'],
  state: ['WORLD_POWERS', 'OLD_COLORS', 'PW', 'SCENARIOS', 'POWERS', 'useScenario', 'scnLandCache', 'inScn', 'landHeld', 'scnLand', 'G', 'powerCountry', 'resetCaches', 'newGame', 'startRecs', 'mobMigrate', 'newBld',
    'serialize', 'saveJSON', 'restore', 'resMigrate', 'addArmy', 'has', 'KIND_NAME', 'armyName', 'armyLabel', 'STC', 'st', 'unlocked', 'bdisOf', 'bdis', 'bdisH', 'knockOut',
    'count', 'GROUND_T', 'groundN', 'shipsN', 'shipsOnly', 'portOk', 'ground', 'armyHP', 'healthFrac', 'strengthFrac', 'power', 'landSpeed', 'armyById', 'nationName', 'placeOwner', 'isCapital', 'dayOf',
    'checkNation', 'score', 'landNeed', 'growth', 'capsHeld', 'checkEnd'],
  research: ['R_SLOTS', 'rFree', 'rFreeN', 'rRunning', 'rSlotNo', 'researchWhy', 'canResearch', 'startResearch', 'researchSlotHour', 'researchHour', 'rqueueMigrate'],
  production: ['ucost', 'canUpgrade', 'startUpgrade', 'reqsOf', 'bldOk', 'mobBlock', 'canMobilize', 'reqText', 'nextLvl', 'FAC_RISE', 'facOthers', 'buildCost', 'facF', 'trainF', 'trainH', 'mslH', 'MINE_T', 'mineLv', 'canBuildHere',
    'canAfford', 'canRecruit', 'recruit', 'build', 'spawn', 'mstock', 'mslCost', 'canBuildMissile', 'buildMissile', 'prodHour', 'consHour', 'engHour', 'devFill', 'devDone', 'devHour', 'devResearchAll', 'devSpawnOk', 'devSpawn'],
  economy: ['graceFor', 'inGrace', 'occFactor', 'BLOCK', 'computeBlockade', 'blockNews', 'popOf', 'dmgOf', 'moraleOf', 'warDamage', 'provYield', 'ECO', 'CONVOY_LOST', 'homeComponent', 'convoyDay',
    'stockCap', 'SHORT_MSG', 'INCC', 'income', 'income0', 'MKT_BASE', 'useRes', 'mkt', 'mktFix', 'embargoes', 'sanctionF', 'buyPrice', 'sellPrice', 'trade', 'marketDay',
    'isBid', 'blocIdOf', 'canSee', 'settle', 'AI_BID_LO', 'BOOK_HI', 'bookDay', 'fillOffer', 'buyOffer', 'postOffer', 'unrestOf', 'unrestDay', 'rebelHour'],
  trade: ['TR_K', 'TR_SURF', 'trS', 'trKey', 'trMine', 'trOther', 'trName', 'routesOf', 'routeById', 'isPort', 'unitPw', 'pName', 'trHostile', 'trFriend', 'NATP', 'natPorts', 'natPorts0', 'NEUP', 'neuPorts', 'portsOf',
    'TRPC', 'seaRoute', 'SEACMP', 'seaComp', 'seaNb', 'trPlace', 'trPortsOk', 'trInvalid', 'TR_WHY', 'trMake', 'trEnded', 'trGdp', 'neuGdp', 'neuGood', 'TR_GOODS', 'trGoods', 'trValue', 'trSide', 'tradeIncome',
    'SEAA', 'seaIndex', 'surfPw', 'navPw', 'trStatus', 'trLastH', 'tradeBlockade', 'escortsAt', 'tradeAirRaid', 'trRaidPower', 'trRaid', 'tradeDay', 'tradeGen', 'tradeOpen', 'tradeClose', 'escortHour',
    'TR_MAX', 'trStateText', 'trState0', 'trRisk', 'escortSet'],
  movement: ['seaSpeed', 'legSpeed', 'unitKmd', 'kmd', 'fmtK', 'MOVE_T', 'ROAD_F', 'TERR_F', 'moveType', 'moveF', 'LINK_NAME', 'LINK_SPD', 'LINK_MT', 'roadMul', 'LINK_DMG', 'LINK_COST', 'LINK_ROUGH', 'SUP_LINK', 'LINKV', 'LLOG',
    'linkChangesSince', 'linkTouched', 'linkOf', 'linkMake', 'roadLv', 'railLv', 'allyOf', 'railFriend', 'railOk', 'linksSync', 'linkSave', 'damageLinks', 'linkCost', 'linkProjects', 'linkMaxProj', 'linkCheck', 'buildLink', 'linkHour',
    'legHours', 'legMode', 'routeMix', 'mixText', 'dominant', 'merge', 'DMG_T', 'splitRows', 'splitSpot', 'splitPlan', 'halfPlan', 'splitArmy', 'evenPlan', 'typePlan', 'onePlan', 'removeEmpty',
    'FP', 'PATH_MT', 'legFactor', 'fpWeights', 'fpPatch', 'pathMT', 'findPath', 'pathFor', 'fightsOnWay', 'orderMove', 'canProceed', 'capNeed', 'etaHours',
    'SUPPLY_RANGE', 'SUP', 'SUPF', 'computeSupply', 'escortSup', 'supplied', 'moraleF', 'effHP', 'armyUpkeep'],
  diplomacy: ['rkey', 'rel', 'atWar', 'friendly', 'canEnter', 'warsOf', 'alliesOf', 'NPC', 'natPower', 'borderCache', 'borders', 'mem', 'addMem', 'opinionParts', 'opinion', 'setRel', 'sendHome', 'strandedHour', 'evict',
    'surpriseWar', 'surprisePath', 'declareWar', 'acceptOffer', 'tribute', 'tributeOk', 'warTerms', 'cede', 'termsText', 'applyDeal', 'diploHour', 'BLOC_NAMES', 'blocs', 'blocOf', 'blocDay', 'reqHour', 'diploDay',
    'chatLog', 'say', 'mood', 'aiReply', 'chatDay', 'emptySide', 'sideFix', 'provValue', 'dealValueFor', 'dealOK', 'applyTrade', 'dealText', 'aiProposeTrade', 'sameBloc', 'GIFT_K', 'giftRoom', 'sendGift',
    'AID', 'coalitionAid', 'offerPlayer', 'SPY_OPS', 'agentsOf', 'idleAgents', 'trainAgent', 'spyChance', 'spyCheck', 'startSpy', 'spyHour'],
  combat: ['FRONT_T', 'frontage', 'frontScale', 'dirsOf', 'plannedDirs', 'flankF', 'sideFront', 'TRAITS', 'CMD_FIRST', 'CMD_LAST', 'CMD_COST', 'cmdList', 'newCommander', 'cmdOf', 'cmdF', 'cmdLost', 'cmdXP',
    'stationaryAt', 'enemiesAt', 'index', 'DIG_H', 'dugIn', 'endBattle', 'rangedHour', 'joinHour', 'chaseHour', 'hurt', 'capture', 'stanceHour', 'oddsParts', 'odds'],
  air: ['AIR_SPEED', 'AIR_RANGE', 'AIR_SPF', 'UAV_LV', 'UAV_TECH', 'uavLv', 'uavOf', 'airRangeT', 'STRIKE', 'wingRange', 'isStriker', 'isDrone', 'swarmPad', 'AIR_T', 'wingT', 'wingSpd', 'isFighterWing', 'WEAR_MAX', 'wingCond', 'wornWing',
    'wearWing', 'maintRate', 'maintBase', 'AEW_R', 'nearestAirbase', 'fixWings', 'carrierAt', 'airMissionKind', 'airCheck', 'orderAir', 'PARA_RANGE', 'paraOnly', 'canDrop', 'orderDrop', 'dropTick',
    'sideAV', 'avScale', 'AD_PK', 'AD_CAP', 'adAround', 'droneAD', 'saturate', 'AEWC', 'aewCover', 'capOver', 'dogfight', 'noteHit', 'BLD_VAL', 'bestBld', 'preciseHit', 'bombBuildings', 'aaFire', 'uavSalvo', 'mpaHunt',
    'loiterHour', 'resolveStrike', 'airTick', 'missileCheck', 'launchMissile', 'interceptChance', 'missileTick', 'missileImpact', 'SAT_MAX', 'satPos', 'satSwath', 'launchSat'],
  vision: ['visibleSet', 'armyVisible', 'subOnly', 'armyLocated'],
  ai: ['aiTrade', 'aiTradeHunt', 'aiFoesNear', 'aiDroneTarget', 'aiBombTarget', 'aiReconTarget', 'aiOrbitTarget', 'aiSeaHunt', 'aiForward', 'aiAir', 'aiInterdict', 'aiMissiles', 'aiSpies',
    'PPC', 'provPowers', 'defPower', 'threatNear', 'EMC', 'enemyMix', 'enemyMix0', 'FRC', 'frontRough', 'AIRM', 'airMine', 'AI_SCARCE', 'aiPickUnit', 'aiFleet', 'focusOf', 'aiPlan', 'aiOperate', 'aiLinks',
    'aiBomberWant', 'aiAsfWant', 'AI_CTR', 'aiBookBuy', 'AI_KEEP', 'AI_LOW', 'aiSite', 'aiReserve', 'aiBuyFor', 'aiKeepRes', 'aiSpare', 'ARMYC', 'aiArmyCap', 'aiTurn'],
  tick: ['tickVer', 'tick', 'makePaper', 'recordStats', 'daily'],
};
const fileOf = new Map(); for (const f of ORDER) for (const n of PLAN[f]){ if (fileOf.has(n)) throw new Error('planned twice: ' + n); fileOf.set(n, f); }
// the planned home of a parsed unit ('ui' = stays in index.html)
const homeOf = u => { for (const n of u.names) if (fileOf.has(n)) return fileOf.get(n); return u.kind === 's' && u.names.length === 0 && /^for \(const t of TECH\)/.test(u.head) ? 'data' : 'ui'; };
module.exports = { ORDER, PLAN, fileOf, homeOf };
if (require.main === module){
  const ROOT = ROOT0, A = analyse(ROOT), U = A.units.filter(u => u.file === 'index.html');
  const by = new Map(); U.forEach((u, i) => u.names.forEach(n => by.set(n, i)));
  const fOf = homeOf;
  const arg = process.argv[2];
  if (arg === '--json'){ const o = {}; for (const u of U){ const f = fOf(u); if (f !== 'ui') for (const n of u.names) o[n] = f; } fs.writeFileSync(path.join(__dirname, 'split-plan.json'), JSON.stringify(o, null, 0)); console.log('wrote tools/split-plan.json', Object.keys(o).length, 'names'); process.exit(0); }
  const missing = [...fileOf.keys()].filter(n => !by.has(n) && !A.units.some(u => u.file !== 'index.html' && u.names.includes(n)));
  const cnt = {}, bytes = {}; for (const u of U){ const f = fOf(u); cnt[f] = (cnt[f] || 0) + 1; bytes[f] = (bytes[f] || 0) + u.len; }
  const leaks = {}, leakBy = {};
  for (const u of U){ const f = fOf(u); if (f === 'ui') continue;
    for (const d of u.deps){ const j = by.get(d); if (j == null) continue; if (fOf(U[j]) !== 'ui') continue; (leaks[d] || (leaks[d] = new Set())).add(u.names[0] || 'stmt'); (leakBy[u.names[0] || 'stmt'] || (leakBy[u.names[0] || 'stmt'] = new Set())).add(d); }
    for (const g of u.globals) if (A.BROWSER.has(g)){ (leaks['<' + g + '>'] || (leaks['<' + g + '>'] = new Set())).add(u.names[0] || 'stmt'); (leakBy[u.names[0] || 'stmt'] || (leakBy[u.names[0] || 'stmt'] = new Set())).add('<' + g + '>'); } }
  if (arg && PLAN[arg]){ for (const u of U) if (fOf(u) === arg) console.log(`${u.line}-${u.end} ${u.kind} ${u.names.join(',') || u.head.slice(0, 30)}` + (leakBy[u.names[0] || 'stmt'] ? '   NEEDS UI: ' + [...leakBy[u.names[0] || 'stmt']].join(' ') : '')); process.exit(0); }
  console.log('units still in index.html, by planned home:', ORDER.concat('ui').map(f => `${f}:${cnt[f] || 0}`).join(' '));
  console.log('bytes:', ORDER.concat('ui').map(f => `${f}:${Math.round((bytes[f] || 0)/1024)}K`).join(' '));
  if (missing.length) console.log('planned names not found (already moved, or renamed):', missing.join(' '));
  console.log('\nUI names / browser globals the planned rules units still reach (name <= rule units):');
  for (const [k, v] of Object.entries(leaks).sort((a, b) => b[1].size - a[1].size)) console.log('  ' + k + ' <= ' + [...v].join(' '));
  // load order: a rules unit whose top-level initialiser (not a function body) needs a name planned for a later file, or for the UI
  const bad = [];
  for (const u of U){ const f = fOf(u); if (f === 'ui') continue; for (const d of u.eager){ const j = by.get(d); if (j == null) continue; const g = fOf(U[j]);
    if (g === 'ui' || ORDER.indexOf(g) > ORDER.indexOf(f)) bad.push(`${u.names[0] || 'stmt'} (${f}, line ${u.line}) needs ${d} (${g}) while loading`);
    else if (g === f && j > U.indexOf(u) && U[j].kind !== 'f') bad.push(`${u.names[0] || 'stmt'} (${f}, line ${u.line}) needs ${d}, declared below it`); } }
  console.log('\nload-order problems:', bad.length ? '\n  ' + bad.join('\n  ') : 'none');
  // UI units that are free of browser/UI needs and are only used by rules would show here if any were forgotten
  const usedByRules = new Set(); for (const u of U) if (fOf(u) !== 'ui') for (const d of u.deps) usedByRules.add(d);
}
