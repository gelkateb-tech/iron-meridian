# LATER — needs a multiplayer server first

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
