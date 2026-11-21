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
Each one needs pictures later, in the same angled style as the other buildings: one picture per level for each of them.
- **Radar station.** Buildable in any province, not only in cities. About 300 km vision, more with each level. Enemies can see it, target it and destroy it, so players have to build their vision and protect it.
- **Coastal naval battery.** Buildable in coastal provinces. Fires at enemy ships within its range, protecting ports and chokepoints. Upgradeable in levels. Ships and missiles can target and destroy it.
- **Hospital (faster healing in its city).** Buildable in cities, with 5 levels like the other buildings.
  - Each level makes wounded forces in that city heal faster than the level before. The rules already have the hook: `hospitalF(p)` in rules/combat.js, now 1; field healing is 10% a day, an own city 25%.
  - Each level costs more than the one before.
  - Each of the 5 levels needs its own picture, in the same new angled style as the other buildings.
- **Province anti-air site.** Buildable in provinces to defend against aircraft, drones and missiles flying overhead.
  - Weak at low levels: short range and limited damage, so one site alone can't stop an air strike.
  - Strong only when upgraded to high levels and several are stacked in the same area.
  - Upgrades cost a lot, so a real air defence network is a big investment, and players still need Mobile SAMs and fighters.
  - Enemies can target and destroy it.
- **Forward Airstrip.** A small airfield buildable in any province, not only in cities, so aircraft can refuel, rearm and fly from closer to the front (planes have limited range).
  - Cheaper and weaker than a city Airbase.
  - Has levels like the other buildings. Level 1 is small and holds few aircraft; each upgrade holds more, and the top level holds about double what level 1 does.
  - Each upgrade costs more than the one before.
  - Enemies can capture or destroy it.
  - Each level needs its own picture later.
- **Field Hospital.** Buildable in any province near the front, so damaged units heal there instead of going back to a city.
  - Heals slower than a city Hospital.
  - Enemies can capture or destroy it.
  - Needs its own pictures later.

## Final visual polish pass (the last week before launch; don't start earlier)
Owner, 2026-11-15. Model: Fable 5.2 (the owner's explicit choice for this pass).
- Scope: the whole game's look and theme, not just the sea: the map (land textures, a sea with lots of moving waves, coasts, borders, cities, lighting, day and night), the UI panels, colours, fonts, icons and animations, so everything feels like one premium, expensive-looking game.
- Creative freedom: it may redesign anything that makes the game look better, as long as gameplay and rules stay the same (golden fingerprint unchanged) and the game stays fast on phones (battery saver respected, phone frame rate no worse).
- Before merging: before-and-after screenshots of each area to the owner, and wait for the owner's OK for each.

## Removed, deferred and settled (playtest session: never change these)

Added 2026-11-21 by the autonomous playtest session (owner's request and changes of 2026-11-21). Everything above this heading is the owner's
text, unchanged. This section only lists what is already decided, so the playtest never undoes it; the full list with file references is
docs/DECISIONS.md. If one of these looks wrong, the session writes it in docs/IMPROVEMENTS.md and changes nothing.

### Removed features (do not bring back)
- **The classic 15-power world on the start screen.** Only "Nations of the world" (68 nations) is offered; the classic world stays in the
  rules so old saves load (`pickClassic = false` in index.html). Source: owner's answer 3, 2026-11-10 (docs/NATIONS-PLAN.md 6).
- **The Classic / Persistent choice** (always Classic). Source: docs/QUEUE.md Done.
- **From the unit panel:** the Commander picker (commanders already on a force keep their bonus), Split in half, Build here, Deselect.
  Source: RELEASES.md "Unit panel cleanup".
- **Health and balance bars on the map** (the army bar shows health). Source: RELEASES.md "Army bar and Army Info, like Conflict of Nations".
- **The Economy research branch** (Industrial Automation, National Service, Oil Refining) and the **Refinery, Foundry and Rare Earth Mine**
  (refunded in old saves). Source: docs/ECONOMY.md 5.3, 6.
- **Unit Marks and the engineering slot** (now Firepower and Protection levels in the research tree). Source: docs/RESEARCH.md 1, 13.
- **A separate faster-mobilization research node** (now +15% training on a unit line's final level). Source: owner, 2026-11-18 (UPGRADES).
- **The three do-nothing upgrades** (replaced by Infantry Kit, Thermobaric Warheads, Close-In Defence), **Bigger Salvo** (replaced by
  Thermobaric Warheads) and **Recon UAV Firepower 1-2** (now Wide-Area Sensors 1-2). Source: owner, 2026-11-18; docs/RESEARCH-UPGRADES.md.
- **Fortifications as such** (now the five-level Bunker, hidden from other nations). Source: owner #17, 2026-11-18.
- **The occupation clock and the capture radius** (a province falls when a ground force reaches its heart). Source: owner request,
  RELEASES.md "Capture at the heart"; docs/COMBAT.md 6.
- **The 24-hour delay before a war starts.** Source: docs/QUEUE.md Done.
- **A starting Army Base in any city.** Source: owner, START-RULES 2026-11-15 (Dev Build v51).
- **Computer nations starting wars** (`AI_STARTS_WARS = false`). Source: owner's rule (URGENT Dev Build fix A).
- **City markers, city levels, hatching, free neighbouring-province vision and city radar.** Source: docs/QUEUE.md Done (v3.12, v50, fog of war).
- **Wheel and parachute icons on infantry badges** (every infantry type shows the owner's helmet). Source: owner OK 2026-11-18 (ICON-FIX).
- **The old doctrine picker** (Precision, Mass, Defence in Depth stay switched off; the five nation groups replace them when built).
  Source: owner's answer 3, 2026-11-18 (docs/DOCTRINES.md 10).

### The unit panel layout (settled)
- Army bar like Conflict of Nations: name and flag, one health bar with numbers, a stats row (morale, speed, strength, battle countdown),
  the healing rate, the stack penalty, one diamond per unit type with count and level badge (tap for the unit's details); the i button opens
  Army Info with the Strength table and green or red arrows. Split (choose amounts), Merge forces here, stances and Halt stay.
- A tap only selects a force; it moves after Move (M) or Attack (K) and a tap on the destination. Rally points per city.
- Badges like Conflict of Nations (flag, side-colour bar, count, the owner's helmet tag), one size for everyone; foreign forces are a grey
  '?' until identified.
- Sources: RELEASES.md (unit panel cleanup, army bar, unit controls); owner OK 2026-11-18 (BADGE-CON, badge size); owner's MAP-2 feedback 2026-11-18.

### The research structure (settled)
- Organised by unit: 10 categories, one column per unit type, 170 nodes / 289 steps; every node on a day; a node needs only the spine node
  above it in its own line (exceptions: the missile line, the Stealth Bomber); two slots at full speed, paid at the start.
- Upgrades apply to every unit of the type at once (fielded, queued, in transport), for the AI too.
- The screen is laid out like Conflict of Nations' (owner's RESEARCH-CON spec, 2026-11-15 and 2026-11-18) with our own art; the screen
  only asks the rules.
- 3 unit looks per unit (levels 1-3, 4-6, 7-8), every nation group its own design.
- Sources: docs/RESEARCH.md 1-2, 13, 14.12; owner 2026-11-15 and 2026-11-18.

### The economy rules (settled)
- One main resource per city; the owner's resource balance rule (7-14 cities; every nation at least 1 city of each of the six resources,
  at most 2 of any; 13-14 city nations may reach 3); real geography where possible.
- Resources x1000 (money and manpower not scaled); market prices per 1,000 units.
- Unit prices, upkeep and market base prices unchanged by the economy rework; daily maintenance of 4% iron and 2% electronics.
- The Market is the order book; AI exporters list there, a person's sell offer is an ordinary listing.
- Army Base I $18M / 6k materials / 6k iron / 1 day, the first two at base price then +40% each; Arms Industry +25% a level, level I half
  price, +40% per other one; Recruiting Office 5 levels from its own table; training queue 2 per city; the Bunker the only building with upkeep.
- Normal-mode starts close to equal by tier.
- Sources: docs/ECONOMY.md 1, 3.4, 5, 7, 14; owner 2026-11-10, 2026-11-14, 2026-11-15.

### Other settled items
- Naval cities: board and land only at naval cities (Marines on any coast); boarding and landing 45 minutes each, exact to the minute,
  never under 15 minutes. Source: owner, 2026-11-19.
- Stack limits land 10, air 5, sea 5 with the Conflict-of-Nations penalty; battles every 15 game minutes; battle pace 0.5; one ground unit
  captures. Source: docs/COMBAT.md 1, 6; owner approved battle pace 0.5.
- Ranged fire in km (artillery 80, rockets 150/200, frigate 80, cruiser 150, submarine 40); blockade reach (frigate 80, cruiser 150,
  carrier 120, submarine 40); eight chokepoints. Source: docs/COMBAT.md 5; docs/QUEUE.md Done.
- Vision in km from where things are; spotted vs identified; the AI plays without fog. Source: docs/QUEUE.md Done; docs/COMBAT.md 8.
- Rebels: the plan in docs/REBELS-PLAN.md with the suggested answers and the owner's change (one level-1 infantry beats any rebels; an
  empty city still flips); its branch waits for the owner's merge OK. Source: docs/QUEUE.md item 7.
- Nation groups (doctrines), their numbers and the five unique units: approved, not built yet. Source: owner, 2026-11-18 (docs/DOCTRINES.md 10).
- Art: the Art Bible's standing rule (ask before redoing any picture), the eight anchor buildings, STYLE_V2, the Gemini check only flags,
  the $12 stop-and-ask line; this session redoes no art. Source: docs/ART-BIBLE.md; owner 2026-11-15, 2026-11-18, 2026-11-21.
- Release: dev build first; public only on the owner's "move to public"; the golden fingerprint and old saves must hold. Source: RELEASES.md, BUILD.md.
- Everything planned above in this file is a plan only: not built in the playtest session.
