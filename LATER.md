# LATER: planned work (most of it needs a multiplayer server first)

Plan the code for these, but don't build them yet. (Owner's spec; this replaces the earlier "LATER" list.)

## Multiplayer
- Online multiplayer only, no single-player. Games run for days on a server, and AI fills any empty countries.

## AI (multiplayer games only; the current test campaign AI can stay as it is)
- AI countries never start wars. Once a player attacks them, they fight back fully and can go on the attack and take that player's land.
- AI strength matches the lobby: use the existing difficulty levels (Recruit, Regular, Veteran, Elite), picked from the average level or rank of the players in that lobby.

## Gold
- A currency bought with real money through the App Store and Play Store, with every purchase checked on the server.
- Buys speed-ups, resource packs, a monthly premium pass and cosmetics. Normal mode has daily purchase limits.

## Premium pass (monthly, like Conflict of Nations' Security Council)
- Members get extra unit-training queue slots per city (free players: 2), rally points (set a spot; units finished in that city march there automatically), an Aggressive stance, and Hold for ships.
- Free players keep the basic stances.

## Competitive mode
- No spending limits. Kept completely separate from normal games.
- Military ranks (Private, Sergeant, Lieutenant, Captain, Major, Colonel, General, Marshal), with a few levels inside each. The game already uses Colonel, General and Marshal for commanders, so avoid confusing the two.
- Seasons of about 2 months. Ranks reset each season, and top players get skins, flags and titles. A new unit only every few seasons.
- A minimum player level (around 10) is needed to enter.
- Territory sales in competitive mode: the lowest allowed price is 40% of the province's value for everyone, 25% between coalition partners (normal games: 25%, and 10% between coalition partners who have been together a few days).

## Player levels
- Permanent, separate from ranks, earned in any mode, with a small reward at each level.
- XP comes from destroying enemy units and is based on the unit's cost, so big late-game wars give lots of XP. No hard cap.
- Zero XP for AI units. No XP for killing allies, coalition partners or recent allies.
- XP is cut only when it looks like farming: the same players trading units while nobody gains ground.
- Winning gives bonus gold and extra XP. The winning coalition is rewarded too, and there's a smaller reward just for finishing a game.

## Daily rewards
- A 7-day login streak that gets better each day, with a gold bonus on day 7. Missing a day drops the streak back one step instead of resetting it.
- Daily missions, plus login-only flags, badges and skins that gold can't buy.

## Seasonal art
- A script that makes each season's skins and flags with Google's Gemini API (Nano Banana) and waits for the owner's approval before they go live.

## New buildings (planned, don't build yet; these don't need the multiplayer server)
Each one needs pictures later, in the same aerial style as the other buildings: one picture per level for each of the three.
- **Radar station.** Buildable in any province, not only in cities. About 300 km vision, more with each level. Enemies can see it, target it and destroy it, so players have to build their vision and protect it.
- **Coastal naval battery.** Buildable in coastal provinces. Fires at enemy ships within its range, protecting ports and chokepoints. Upgradeable in levels. Ships and missiles can target and destroy it.
- **Hospital (faster healing in its city).** Buildable in cities. Wounded forces in its city heal faster, more with each level (the rules already have the hook: `hospitalF(p)` in rules/combat.js, now 1; field healing is 10% a day, an own city 25%). Needs pictures like the other buildings.
- **Province anti-air site.** Buildable in provinces to defend against aircraft, drones and missiles flying overhead.
  - Weak at low levels: short range and limited damage, so one site alone can't stop an air strike.
  - Strong only when upgraded to high levels and several are stacked in the same area.
  - Upgrades cost a lot, so a real air defence network is a big investment, and players still need Mobile SAMs and fighters.
  - Enemies can target and destroy it.
