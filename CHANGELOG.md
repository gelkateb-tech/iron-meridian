# Iron Meridian — Changelog

## Round 1 — Real-world map
- Replaced the generated continent with a real-world map: 581 land provinces in 154 countries (named after real regions, seeded at 190 major cities) plus 284 named sea zones, built from Natural Earth data by `tools/build-world.js`.
- Added 15 playable powers with a nation picker, troop embarkation across sea zones, a minimap, a hatched fog of war, country borders in each power's color, hover tooltips and original unit counters (type glyph, strength, health bar) that cluster when zoomed out.
- Balance: captured land pays 25% rising to 100% over 10 days, large empires get diminishing income, the AI respects upkeep and an army cap, independent garrisons are stronger, and pathfinding uses a heap.

## Round 2 — Economy, production and clarity
- Five resources (Money, Oil, Metal, Food, Manpower) with an icon resource bar and hover breakdowns. Armies eat food and armor/jets burn oil; shortages weaken troops. Seven buildings with levels and build times (Arms Factory, Airbase, Refinery, Foundry, Farms, Recruiting Office, Fortifications) gate unit types.
- New-player aids: under-attack alerts that drop to 1×, toasts and a clickable dispatch feed, battle-odds verdicts, a first-steps checklist, an unspent-money nudge, and a Home view that fits your country.
- Rules from the design review: captures need 2+ ground units and take longer (home land retaken twice as fast), conquerors annex fallen powers, capital loss costs 25% income for 7 days, landing troops fight at −33% for a day, slower seas, home-income boosts for poor powers, and wins by land share, 8 capitals or top score on day 120 (AIs can win too). QA fixes: saves can no longer be overwritten, province names come from the right country, popups restore speed and close with Esc, the map can't be dragged away.

## Round 3 — Diplomacy, unit classes, speed
- Diplomacy: war, truce, peace, non-aggression, passage and alliance between powers, with AI opinions (borders, grievances, common enemies, treaty breaking, fear of the leader), 24-hour war declarations, allies joining wars, AI peace/pact/alliance offers, war weariness, a diplomacy screen (D) with predicted answers, and a relations map view (V). Powers at peace can't enter each other's land; allies share vision.
- Eight units in three classes (soft, armored, air) with a class damage table and specialists (Lancer anti-tank, Hammer artillery, Skywall SAM, Courser IFV, Bastion MBT, Kestrel striker, Talon interceptor); the AI counter-picks against its enemies' mix.
- Speed and polish from the performance and visual reviews: cached map layer with off-screen culling (about 2× frame rate), chunked terrain build and lighter terrain (boot 2.7 s → 1.5 s), deferred border rebuilds; distinct nation colors, nation-tinted counters with stack plates, a cased route line with an ETA/odds chip, fewer and smaller toasts, and a phone layout that fits.

## Round 4 — Production, reachable victory, smarter diplomacy
- Production overview (P) listing every city's training and construction with one-click and ×5 (shift) queueing, repeat production per city, and parallel training lines from Arms Factory levels.
- Victory is reachable: land target is 25% of land or starting size + 60 (whichever is larger), 5 starting capitals, or the most growth by day 120; gentler administration penalty. Scarcity: research now also costs metal and oil (money cost −40%), non-money stockpiles are capped by territory, tanks burn more fuel; tier-2 military techs hit harder. Lancers deal 3× to armor and Hammer artillery is sturdier; the AI builds two airbases.
- Diplomacy fixes: AI trust grows under pacts and shared wars so alliances form, re-declaring soon after a truce marks a treaty breaker, the AI only offers peace it would accept, AI-vs-AI news is limited to your neighbours, allies respect their own truces (and you choose whether to join), routes into land of powers at peace are blocked up front, peace evicts marching armies, stranded AI armies return home, stale offers are re-checked. New-player fixes: a second tap won't launch a likely-defeat attack, clearer first steps, labeled resources, stable diplomacy list.

## Round 5 — Morale, supply and a cleaner interface
- Morale and supply: armies carry morale (lost in hard fights, landings and capital loss; regained when resting) that scales their attack, and broken armies retreat or surrender. Supply reaches 8 hexes from your cities: supplied troops finally heal (faster in cities), cut-off troops lose strength daily. Counters show a morale bar and a red dashed outline when cut off; the AI rests tired armies.
- Interface: the side panel is tabbed (Command / Powers / Dispatches with an unread badge), the recruit list is compact with locked units folded away, a done-able First steps list can be hidden, Production/Research/Diplomacy sit in one header group, diplomacy rows are grouped (At war / Neighbours / Others) with one main action and a More menu, toasts moved to the top-left, Russia is no longer a danger-red.
- Juice: capture flashes with a floating label, unit-ready rings, destroyed-force bursts, marching dashes on routes, resource chips flash on daily changes, modals rise in.

## Round 6 — Navy, war warnings, objectives
- Navy: Gannet Frigate (escort, anti-air), Moray Submarine (ship hunter) and Tempest Cruiser (shore bombardment), built at a new Naval Yard in coastal cities. Ships stay at sea or in friendly ports, split off when troops land on hostile shores, cut the damage escorted troops take at sea, blockade enemy coasts (−25% output) and bombard adjacent coastal battles. The AI builds yards and runs patrol fleets.
- New-player fixes: a war-declaration briefing that pauses the game and lists threatened border provinces with a Go-there button, peace for tribute, food upkeep shown on unit cards with a deficit warning and a Build Farms shortcut, a second set of objectives, a victory-progress bar in the header, city names in force lists, NAPs that expire after 20 days, and Declare war needing a confirming second click.
- QA fixes: supply and other caches reset between campaigns, cut-off armies only surrender when clearly losing (and their morale bottoms out at 30), the locked-units fold stays open, the phone hint no longer covers the map, the unread badge counts by time, resource flashes play fully.

## Round 7 — Statistics, sound, speed
- World statistics screen (S): a ranked table of all powers (score, growth, provinces, capitals, military, techs, wars), your campaign record (provinces taken/lost, enemy units destroyed, units lost, peak army, best rank) and history charts for score and military; the end screen now shows a campaign summary with the biggest battle and a score chart.
- Sound: synthesized in the browser (no audio files) for orders, battles, captures, losses, alarms, unit-ready, research and victory, with a mute toggle (M) remembered per browser.
- Speed and fixes from the performance review: per-hour caches for national power, per-province defence, enemy unit mix and unit stats; fixed a crash that froze the side panel once all First steps were done; the header fits one row from 1280 to 1920 px.

## Round 8 — Air war and living units
- Real air power: Strikers and Interceptors now live in air wings at airbases. Select a wing to see its range ring, tap a target and the planes visibly fly out in formation with contrails. Strikers hit everything hostile there with concentrated firepower while SAMs, Interceptors and Frigates shoot back, then fly home and rearm for 6 hours. Interceptors patrol a province for 12 hours and dogfight incoming strikes. Wings can rebase between airbases; the AI flies strike and patrol missions too.
- Animated unit sprites replace the square counters: soldiers that walk, tanks with rolling treads and recoiling guns, IFVs, artillery that fires, SAM trucks launching, jets and ships with wakes, each in its nation's color with a strength badge, health and morale bars, and a second figure for mixed stacks. Units now glide smoothly between hours.
- Combat you can see: floating damage numbers for every side each combat hour, muzzle flashes, impact sparks and smoke, strike explosions. Unit panels list every unit type with its own icon and a current/max HP bar; recruit cards show the unit's silhouette.

## Round 9 — Terrain, command, balance
- Terrain from real regions (mountains, forests, deserts, tundra, urban, plains) changes defence (+15–30%), armor effectiveness and movement speed, shows on odds chips and tooltips, and is drawn as relief marks on the map. Map modes: Political, Relations, Supply, Terrain and Resources (top-right or V).
- Commanding many armies: shift-click or shift-drag a box to select several forces and send them together, Ctrl+4…9 to save groups and 4…9 to recall, and per-city rally points for newly trained units.
- Balance from 64 simulated games: bigger powers need +90 provinces to win by land, tanks burn less fuel and the AI stops queuing armor when short of oil, manpower and ore yields cut, AI builds two yards and cruisers (cheaper), Lancers and artillery strengthened late-game, Precision Munitions toned down. Art pass: fixed mixed-stack figures drawing black, larger units when zoomed in, distinct IFV/Lancer/Interceptor/Striker shapes, volley-timed muzzle flashes with smoke and tracers, tank dust, ship outlines, a tug-of-war strength bar over battles, thicker health bars with draining damage, per-plane contrails and shadows, strike orbits with falling bombs, separate parked wings per aircraft type.

## Round 10 — 3D units, particles, day and night
- Pre-rendered 3D units: every unit (rifle squads, lancer teams, howitzers, SAM launchers, IFVs, main battle tanks, strike jets, interceptors, frigates, submarines, cruisers) is an original 3D model built in code with three.js, lit by a sun and sky with soft ground shadows, rendered into sprite sheets in 8 directions (16 for aircraft and ships) with walk and recoil frames, and tinted per nation in a military finish. Units face their direction of travel or the enemy; the old vector figures remain as a fallback.
- Particle effects: tracer streams, tank and naval shells, artillery shells arcing between armies, anti-tank and SAM missiles with smoke trails, explosions with fireballs, shockwave rings, debris and smoke, bombs from strike jets, afterburner flames, and burning wrecks that smoke for a while where forces were destroyed.
- A day/night line sweeps the globe with the game clock, with city lights on the night side. QA fixes: old saves no longer lose their armies, parked air wings stay out of ground combat (they escape or are destroyed when their base falls), wings no longer cover the city's ground army, strikes and patrols work over your own airbases, dogfights are logged, wing-specific hints.

## Round 11 — A realistic world and rebuilt units
- Realistic map renderer: the hex tiles are gone. A terrain texture is generated pixel by pixel with smoothly blended biomes (temperate lowlands, steppe, savanna, forest, jungle, rocky mountains with snowcaps, desert, tundra, polar ice), hill shading lit from the north-west, natural noise-perturbed coastlines with surf, and depth-graded oceans. Nation colors are clipped to the real coastline and softened; national, country and provincial borders are smoothed curves.
- 3D units rebuilt from the art review: modelled in real-world metres (infantry are now properly small next to vehicles), a correct color pipeline with weathered military tints, a detailed main battle tank (visible track runs and seven road wheels, wedge turret, bustle rack, smoke dischargers, fume extractor, 6-frame recoil with turret rock), an 8×8 wheeled IFV, a self-propelled howitzer, a heavier SAM truck, five-soldier fireteams, haze-grey ships with nation markings only on the funnel and deck, afterburners that light only on attack runs, sharper sprites on high-density screens.
- Effects: natural irregular smoke puffs that rotate and never fully hide units, ground dust under moving vehicles and from big guns, star-shaped muzzle blasts, scorch marks that fade over 20 seconds, no more cartoon shockwave rings; units are night-tinted on the dark side of the planet and the night is deeper.

## Round 12 — Strategic missiles and a fast engine
- Strategic missiles: a new Strategic research branch (Cruise Missiles, Ballistic Missiles, Anti-Missile Shield), a Missile Silo city building that builds and stockpiles missiles, targeting with a range ring, missiles visibly flying (cruise low and fast, ballistic in a high arc) with smoke trails, interception by SAMs and Frigates near the target, and impacts with multi-blast explosions, screen shake, building damage and morale loss for ballistic hits. Missile warnings alert you when you're targeted; the AI researches, builds silos and fires missiles too.
- Performance from the review: the terrain texture, land mask and all 3D unit sprite sheets are now baked into images by tools/bake-assets.js, so the game no longer loads the 3D library or renders models at startup (picker in about 0.8 s instead of 5–6 s); panning shifts a pre-rendered map layer with a margin and redraws once you stop (60 fps instead of ~30); night is a shared silhouette pass instead of a tinted copy per nation, tinted sheets are capped, province outlines are smoothed lazily.

## Round 13 — Tutorial, settings, the daily newspaper
- Interactive tutorial (offered on the first briefing, replayable from Settings): ten guided steps that highlight the control or province involved and wait for you to do it — find your nation, read the resource bar, open your capital, recruit, select your army, plan an attack and read the odds chip, send it, start the clock, start research — then point out Production, Diplomacy, map modes and the newspaper.
- Settings (⚙ or O): AI difficulty per campaign (Recruit / Regular / Veteran / Elite, also chosen in the nation picker; scales AI income and war appetite), an 8× speed, a sound-volume slider, pop-up alert density (all, threats only, none), effects quality, and whether the newspaper pops up at dawn.
- The Meridian Herald: every dawn a front page summarises the previous day's biggest events (falls of nations, war declarations, missile strikes, captures) with world standings; it pops up when something major happened and is always available at the top of Dispatches (or N). QA fixes: the day/night overlay now darkens the correct half of the world, small provinces keep their true outline size, hit boxes cover mixed stacks' second sprite, sprite drawing errors fall back to 2D instead of freezing.

## Round 14 — Occupation, espionage, readability
- Occupation unrest: conquered provinces gather unrest every day unless garrisoned (faster if their old owner still stands), which cuts their output; above 60% partisans rise up, and if they hold the province for a day it revolts back to its original nation or declares independence. Pacify for $40M, see it in tooltips and the new Stability map mode.
- Espionage: train up to five agents ($60M) and send them from any foreign province on Reconnaissance (reveals the area through the fog for 3 days), Sabotage (destroys a building level or halts construction), Incite unrest (occupied land only) or Steal technology. Missions take a day; idle enemy agents act as counter-intelligence, failed agents are lost and sour relations. The AI trains agents and runs missions against its enemies.
- Readability from the genre review: night darkness capped near 35%, independent garrisons shown as small badges until you zoom in (rebels in red), speeds and ranges in km instead of hexes, and the defeat screen names the resource that actually ran out.

## Round 15 — A rebuilt world map
- Provinces are now sized by real population density, using the locations of about 148,000 towns: dense Europe, India, East Asia and the US coasts are cut into many small provinces, while Siberia, the Arctic, the Sahara and the outback become large ones. Germany now starts with 6 provinces against Russia's 69 (before it was 3 against 112). The world has 738 land provinces instead of 581, and every playable country has at least a few provinces to manoeuvre in.
- Province names: provinces take the name of the nearest unused state or region, then a compass or Upper/Lower/Central prefix, then the nearest real town, so "Greenland 1–19" and "Iowa 41" are gone. Tiny islands join the nearest province of their country instead of becoming their own province.
- Fairer starts for compact powers (10 provinces or fewer): a fortified capital, an extra field army with armour and artillery, and dug-in garrisons on land borders. An idle Germany now survives to day 120 in most test campaigns.
- The terrain texture and land mask were rebaked for the new map. Saves moved to a new format, so campaigns from earlier versions won't load.

## Round 16 — Frontage, flanking, battle reports, new-player fixes
- Combat frontage: only so many units fit on a front (14 on open ground, 8 in mountains, 10 in cities, 18 at sea). Units beyond that wait in reserve and fight at 25%, so doom stacks soak damage but don't win faster. The odds chip warns when your force is too big for the front.
- Multi-direction attacks: forces attacking a province from different neighbouring provinces (or from the sea) widen the front by half per extra direction and gain +15% attack each, up to +45%. The AI now splits oversized stacks and sends half around to a second side.
- Battle reports: every battle you fight ends with a dispatch ("Battle of Tamaulipas won after 28 h: you lost 4 units, they lost 24"). Click it to open a report with an hour-by-hour strength chart, peak sizes, units lost by type, frontage and flank bonuses. A province in battle shows a live summary: hours elapsed, units engaged versus in reserve, directions and losses.
- From the new-player review:
  - The odds chip shows the defenders' effective strength after home-soil, terrain and fort bonuses, so it no longer says "Likely defeat · your 34 vs their 30".
  - The tutorial's attack step rings the weakest independent province your army can actually beat. If none is close, it lets you tap Next instead of stalling.
  - Tapping the capital's troops in step 3 counts as tapping the capital. On phones the tutorial card docks at the top and says "panel below".
  - Finishing the tutorial deselects your army.
  - Forces that arrive where another of your idle forces stands merge into it automatically. Merge forces shows how many forces it will combine, or why it is unavailable.
  - War warnings count enemy armies up to 3 provinces from your border. A new early warning fires when a neighbour masses more than 1.4× your border strength, and a wartime alert flags idle cities while money sits unspent.

## Round 17 — Command tools: named formations, Armies screen, stances, waypoints
- Every force now has a formation name based on its main unit type and numbered per nation: "1st Infantry Division", "3rd Armored Division", "2nd Fleet", "5th Air Wing". Names appear in the force panel, dispatches ("3rd Armored Division broke at Hesse"), enemy losses ("Russia 2nd Mechanized Division destroyed") and the province army list. Click a name to rename the force.
- Armies screen (A, or Armies in the top bar): every force with location and destination, unit mix, health and morale, status, supply and stance, with Select to jump to it. It also shows how many forces are idle.
- Standing orders (stances) per ground force:
  - **Hold** (default) stays put.
  - **Defend** reacts to enemies inside your land within 3 provinces when it can win, then returns to its post.
  - **Preserve** falls back to the nearest city of yours once health drops below 40%.
- Waypoints: with a force or group selected and moving, shift-click more provinces to chain legs onto its route.
- Press **.** (or Tab) to jump to the next idle force.

## Round 18 — World market and embargoes
- World market (T, or Market in the top bar): buy and sell oil, metal and food in lots of 10 or 50. Prices are recalculated every dawn from total world production against total consumption: wars that burn fuel push oil up, big trades move prices immediately, and pressure fades over a few days. Each resource shows its price, the day's change, buy and sell prices (10% spread) and a 60-day price chart.
- AI powers trade too: they buy whatever they run short of when they have cash, and sell surpluses near their storage cap.
- Embargoes: powers at war with you, or with very low opinion of you, may impose an embargo. Each one worsens your buy and sell prices by 15% (up to three). They lift embargoes once relations recover. You can embargo or lift embargoes from Diplomacy (−15 or +5 opinion), and the panel notes who embargoes you.
- The top bar switches to short labels (Prod, Mkt, Army, Tech, Diplo) on screens under 1560 px wide.

## Round 19 — Visual overhaul: formations, visible air strikes, cleaner map
- Close-zoom formations: zoom in past about 36 px per hex and each force is drawn as a formation of up to 10 animated figures, roughly one per two units, with its actual mix. Armour leads, infantry fills the middle ranks, artillery and air defence sit at the back. Formations face their heading or the enemy, march as two-wide columns, and lean forward in battle, with each figure walking and firing on its own rhythm. When units die, figures drop out and leave a fading dark wreck and smoke. Units keep growing up to 3× as you zoom instead of stopping at 2×, while city icons and labels stay compact.
- Air strikes you can watch: a presentation layer flies each wing out at a visible speed, orbits the target, and only bombs on arrival (a string of explosions and smoke). It holds there briefly, then flies home. Aircraft are smaller (no longer bigger than tanks), climb and descend near their base, and their shadows grow with altitude.
- Damage numbers roll up: hourly losses per side accumulate into one counting-up number beside that side's force, instead of separate numbers printed on top of each other and the province names.
- Less clutter at mid zoom: below 30 px per hex, independents and powers at peace with you are small badges in their colour. Only your forces, your enemies and anything in battle get full sprites. Fortifications are a small shield beside the city instead of an arc under the armies.
- Lighting: a warm dusk band along the day/night line, a slightly deeper night, and units keep their nation colour at night. Muzzle flashes are roughly half their previous size.
- The "massing troops" warning now ignores starting garrisons. It fires only from day 3, when a neighbour's border force grows by 20% or more.

## Round 20 — Real coastlines, rivers and highways
- Real coastlines: the terrain texture and land mask are now baked from Natural Earth land polygons at almost twice the previous resolution, instead of from smoothed 180 km hex cells. Britain, Ireland, Denmark, Italy, Scandinavia, the Baltic, Japan and every other coast have their true shapes. Nation borders, province edges and fills are clipped to the coastline, so they never bulge into the sea as round bubbles.
- Rivers: 685 major rivers from Natural Earth are drawn on the map, thicker for great rivers (Rhine, Danube, Volga, Mississippi, Nile and others) and appearing progressively as you zoom in.
- River lines matter in combat: 482 province borders that run along a river are river lines (for example Baden-Württemberg and Haut-Rhin on the Rhine, or Kyiv and Gomel on the Dnieper). Forces attacking across one fight at −20%. The odds chip warns about it, and the province panel lists the river lines.
- Highways: major roads are drawn at close zoom. 481 neighbouring province pairs are linked by highways, and ground forces move 35% faster along them. The province panel shows how many highway links a province has.

## Round 21 — Doctrines and unit Marks
- Doctrines, chosen in the nation picker; every AI power gets one too:
  - **Precision**: units attack 10% harder and research runs 15% faster, but every unit costs 15% more.
  - **Mass**: units cost 15% less and train 25% faster, but attack 5% weaker.
  - **Bastion**: forces defending their own home provinces take 15% less damage, fortifications build twice as fast, and army upkeep is 10% lower.
- Unit Marks II–IV: a new Unit upgrades section under Research. Engineering runs in parallel with research, one upgrade at a time. Each Mark raises attack and defense for every unit of that type you have or build: Mk II +12%, Mk III +25%, Mk IV +40%. Costs and time rise with each Mark. Forces show their Mark beside each unit ("Rifle Corps Mk II ×6"), and AI powers upgrade their most-used unit types too.
- Recruit cards show doctrine-adjusted prices.

## Round 22 — Veteran review: real flanking, mobilisation, victory tracker
- Multi-direction attacks now work as intended:
  - Your forces only auto-merge on your own or allied ground, never inside a province they are assaulting.
  - When stacks do merge, each one's approach direction is kept.
  - Directions are counted from live stacks only (empty stacks no longer inflate the count).
  - The odds chip counts every other force you have already ordered to the same target: "Attacking from 3 directions: front 32 units, +30% attack".
  - The AI's flanking halves are no longer merged back inside enemy provinces.
- Mobilisation policy (Production screen): Peacetime, Partial (+40% manpower, −6% cash income) or Total (+80% manpower, −12% cash). The strain shows as up to 15% or 30% unrest at home.
- The wartime idle-cities alert names the real bottleneck: low manpower or metal, rather than telling you to spend money you can't use.
- Wars bite harder: losing your capital now cuts income by 40% for 14 days (was 25% for 7 days).
- Victory tracker under the clock: provinces held against the target, capitals held out of 5, and the day out of 120.
- Occupation settles down:
  - A conquered province garrisoned by 2+ units for 10 days becomes integrated, and its unrest stays below 30%.
  - You get a warning when a province passes 50% unrest, before it revolts.
- Air power: strikes deliver twice the firepower. Jets built while their wing is out on a mission join it when it lands, instead of forming a separate one-plane wing.
- Fixes:
  - Battles you left after inflicting heavier losses are reported as "ended", not "lost".
  - The dawn newspaper pops up only for news that concerns you or a fallen nation.
  - Compact powers get a 21-day early grace period (was 14).

## Round 23 — Coalitions and peace conferences
- Coalitions: powers linked by alliances form named blocs such as the Northern Compact or the Meridian Accord, up to 4 members, led by the strongest. Each coalition names a common enemy (the power fighting most of its members). Members' AIs focus their offensives on that enemy, and members at peace with it may join the war.
- Coordinated offensives: if you belong to a coalition led by an AI, the leader periodically asks you to attack a specific enemy province within 48 h ("Russia asks you to attack Kharkiv"). The request shows in the Command panel with a Show button. Fight there or take it to earn $150M and goodwill with every partner; ignoring it costs opinion.
- Shared victory: a coalition wins together by holding 8 starting capitals or 1.8× the land victory target. Rival coalitions can win too, so watch them in Diplomacy's new Coalitions panel (members, leader, common enemy, provinces and capitals held). Members of the same coalition like each other more, and nations may now hold three alliances.
- Peace conferences: peace treaties now hand every province each side occupies to it for good. Ceded provinces become home provinces, so they stop gathering unrest and can't revolt back. Peace offers spell out the terms ("France cedes Alsace, Lorraine to you"), and AI-to-AI treaties redraw the map too. In a test campaign, 45 provinces changed hands by treaty by day 80.

## Round 24 — Weather and seasons
- A real calendar: the campaign opens on 15 November and a 120-day game runs through the northern winter into the March thaw. The clock shows the date ("14 Dec · 06:00").
- Seasons by latitude:
  - **Northern winter** (December–February; November and March in the far north): snow covers high latitudes and mountains. Movement there is 30% slower and attackers fight 15% worse.
  - **Spring thaw** (March–April, 44°–62°): mud slows movement by 25% and attackers by 5%.
  - The southern hemisphere runs six months offset.
  - Snow-covered provinces turn white on the map and mud provinces brown, both changing month by month.
- Storm systems: about seven storms and blizzards drift across the world, west to east in the mid-latitudes and east to west in the tropics. They slow movement by 20% and ground aircraft. Wings can't launch from or to a province under a storm, and a strike heading into a storm that closes over its target turns back.
- Weather visuals: drifting procedural clouds that cast shadows on the ground, darker thunderheads with lightning flashes, and at close zoom falling rain streaks or snowflakes.
- Province tooltips and the odds chip show the weather and seasonal penalties. Seasons are cached per day and the market computes each nation's income once per dawn, so the simulation runs faster than before this round.

## Round 25 — Scenarios, campaign length, persistent mode
- Scenarios in the nation picker:
  - **World War**: the original 15 powers.
  - **European Theatre**: the United Kingdom, France, Germany, Italy, Spain, Poland, Turkey and Russia.
  - **Pacific Rim**: the United States, China, Japan, Australia, India, Russia, Indonesia and Mexico.
  - Theatre scenarios count only land inside their region towards the victory target and need 4 starting capitals instead of 5. Texts adapt to the number of powers.
- Campaign length: 60, 120 or 240 days.
- Persistent mode: like the genre's always-on servers, the war keeps running while you're away, at one game day per real hour, with up to 14 days of catch-up. When you return you get a "While you were away" special edition of the Herald: days passed, provinces, units and treasury gained or lost, and the key dispatches. Your forces keep following their stances meanwhile. Classic mode (time only runs while you play) stays the default.
- Saves remember the scenario, length and mode.
