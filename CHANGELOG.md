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

## Round 26 — A clearer battlefield (art review)
- Only what matters gets models:
  - Independents and powers at peace with you stay as small badges up to close zoom.
  - Past that they get a single small figure instead of a full formation.
  - Your forces, your enemies and anything in battle are drawn as formations.
- Formations fit their province: spacing and figure size are clamped to the province's size. The two sides of a battle are placed on either side of the province, facing each other as two lines instead of a carpet of overlapping figures.
- Day and night follow the real sun: the night shadow is computed per latitude with the seasonal solar declination, so the line between day and night curves and polar nights are longer in winter. Twilight is a wide, soft warm band instead of a hard stripe, and night is deeper. Units keep more night shading while keeping their nation colour.
- Air strike damage appears when the bombers actually arrive over the target, and rolls up with the battle numbers in the same format. Missile hits that do no damage no longer print "−0 HP".
- Scale: ships are about 30% smaller (a frigate is no longer bigger than Denmark) and jets about 20% smaller.
- Muzzle flashes are a 45 ms glow and a narrow cone instead of a white three-pronged star.
- Embarked troops at sea are drawn as a transport ship, not as soldiers standing on the water.

## Round 27 — Gunships, drones and paratroopers
- New Airmobile research branch with three new unit types:
  - **Kite Recon Drone**: a cheap unarmed wing with an 18-hex range. Send it to any province and it reveals that area through the fog for 2 days, reporting how many foreign units it spotted.
  - **Wasp Gunship**: an attack helicopter wing with a short 6-hex range. It hits armour (2.2×) and infantry (1.3×) hard and is nearly harmless to aircraft.
  - **Falcon Paratroopers**: elite infantry trained at airbase cities. An idle paratrooper force in a province with your airbase gets an Air drop button. Tap a drop zone up to 9 hexes away (a range ring shows) and a transport flies them in. They land with −10 morale, and enemy air defence at the drop zone shoots down up to 60% of them.
- New 3D models baked to sprites: the gunship (tandem canopy, stub-wing rocket pods, tail rotor, and a four-blade main rotor whose 4 animation frames spin in flight) and the drone (long straight wings, V-tail, sensor ball, pusher prop). Paratroopers in transit show as a transport aircraft with a "▼ N" troop count.
- New formation names: Airborne Brigade, Gunship Squadron, Recon Squadron. AI powers research and field the new units too.

## Round 28 — QA round: eleven bugs fixed
- Armies no longer freeze after peace. An army mid-march when peace evicted it ended with a corrupt "NaN h" route and never moved again. Eviction now stops the leg cleanly, and any route that went stale (for example after a retreat) is re-planned from where the army actually stands. This dropped from 166 army-days with a frozen timer to 0 in a 70-day test.
- Arriving forces re-check entry rights, so an army whose destination changed hands mid-march to a power it is at peace with turns back instead of standing in that land. Every 6 hours, forces left in land they may not be in, and AI forces too small to capture where they stand, walk back to their nearest own province.
- No more capture deadlocks: when two powers that are not at war with each other both stand in an independent province, the larger force takes it instead of both waiting forever.
- The Preserve stance works: it now measures remaining strength against the force's recent peak (lost units count, not only wounds). The Armies screen health bar uses the same measure.
- The odds chip gives home-soil, fortification and terrain bonuses to whoever owns the province. Counter-attacking an invader in your own province now shows the bonuses on your side, and the Defend stance reacts to such invaders.
- Splitting a force keeps its river-crossing, landing and approach state, so splitting no longer dodges those penalties.
- Jets built while their wing is out and then lost no longer vanish: they form a new wing at the airbase.
- Corrected texts and bars:
  - The capital-loss message says −40% for 14 days.
  - The research bar matches doctrine-adjusted durations.
  - Recruit cards show Mass doctrine's faster training times.
- The victory tracker shows on phones, in a compact size.
- Battle report links can no longer open the wrong battle.
- Performance: each nation's income is computed once per game hour instead of on every call.

## Round 29 — Light and water
- Coasts: the baked terrain gains a wide shallow-water shelf. The sea brightens towards the coast over a broad blurred band from the real coastline, so coasts read as shelves of turquoise shallows rather than flat navy against land.
- Mountains: ridged noise adds sharp peaks and valleys to mountain ranges in the hill-shading, so the Alps, Rockies or Himalaya read as ranges instead of a soft smear at close zoom.
- Night lighting: fires and explosions cast warm light pools on the ground at night, scaled by how dark it is at that longitude. Cities glow with a bright core and a wider halo, larger for capitals.
- Projectiles: shells and missiles fly as short bright streaks along their arc instead of glowing orange balls.

## Round 30 — AI strategy layer
- Operational plans: each AI power at war picks one objective in its main enemy's land, preferring the coalition's common enemy. Objectives are weighted towards capitals, cities and oil, and towards targets it can reach from several of its own provinces. It then gathers forces in the neighbouring provinces instead of trickling armies in one by one.
- Concentrated, multi-direction offensives: once the massed forces reach 1.5× the defenders' strength, every staged force attacks at once from its own side, exploiting the frontage and flanking rules. You get a dispatch when one is aimed at you ("France launches a coordinated assault on Cologne from 3 directions!"). Plans are re-evaluated after 8 days or once the objective falls.
- Front defence: before attacking, the AI sends its nearest idle reserves to any border province facing an enemy stack it can't hold, and keeps its capital garrison when threatened.
- Effect in 120-day test campaigns: about 35% more territory changes hands, three or four powers fall instead of one, and coalitions can now win outright.

## Round 31 — Carriers and a naval research branch
- New Naval research branch:
  - **Naval Gunnery**: Frigates +1 attack, Cruisers +2.
  - **Carrier Aviation**: unlocks the Albatross Carrier at a level II Naval Yard.
  - **Amphibious Doctrine**: troops landing from the sea fight at 90% instead of 67% on their first day ashore.
- Albatross Carrier, a mobile airbase. Select an air wing and tap a sea zone holding one of your carriers to rebase onto it. The wing then sails with the carrier, and its range ring and strikes are measured from wherever the carrier is, so you can project air power across oceans. If the carrier is sunk, its wings divert to the nearest airbase in reach or are lost. The carrier itself is weak in a fight (strong only against aircraft), so escort it with frigates.
- New 3D carrier model, baked to sprites: an angled flight deck with a landing strip, a starboard island in nation colours, and parked aircraft on deck. Carrier formations are named "Carrier Group".

## Round 32 — Commanders
- Appoint up to 3 commanders ($80M each) from any ground force's panel. Each gets a generated name and one trait:
  - **Blitz**: +15% speed, +10% attack when attacking.
  - **Shield**: −12% damage taken when defending.
  - **Artillerist**: artillery and SAMs +20% attack.
  - **Logistician**: no attrition when cut off, heals 50% faster.
  - **Siegemaster**: captures provinces 25% faster.
- Commanders gain experience from the damage their force deals in battle. They are promoted from Colonel to General to Marshal, and each rank multiplies the trait. Promotions are announced in the dispatches.
- Assign a free commander to a force or relieve them from the force panel. Merging forces keeps the commander. When a led force is destroyed, its commander has an even chance of capture or escape.
- Forces with a commander show a gold ★ on their strength badge, and the Armies screen lists commanders with their rank stars. AI powers appoint and assign commanders too.

## Round 33 — Campaign replay and achievements
- Campaign replay: every day's territorial changes are recorded compactly in the save. "Watch replay" (on the end screen and in Statistics) plays the whole war on a world map: conquests spread day by day, with play/pause, a scrubber, and a live leaderboard of the eight largest powers.
- Achievements: 15 to unlock, kept across campaigns in your browser. A toast and a fanfare announce each one, and they're listed in Statistics and on the end screen:
  - First Blood, Hammer and Anvil (win attacking from 3+ directions), Blitzkrieg (5 provinces in a day)
  - Spoils of Peace, Grand Alliance, Field Marshal, War Chest
  - Airborne, Eyes in the Sky, Blue-Water Navy, Long Arm, Decapitation
  - Still Standing, Victor, Mk IV

## Round 34 — Accessibility and save slots
- Colour-blind palette (Settings): swaps every nation's colour for a 15-colour set built on the Okabe–Ito colour-blind-safe palette. It recolours borders, fills, sprites, charts and the minimap live, and switches back cleanly.
- Text size: 90%, 100%, 115% or 130%. This scales the top bar, side panel, dialogs, toasts and tutorial card without changing the map.
- Reduced motion: no screen shake, far fewer smoke and dust particles, and no UI transitions.
- Save slots: three manual slots in Settings beside the automatic save, each showing nation, date and scenario. Load a slot at any time to jump back.

## Round 35 — Soundscape
- Positional battle audio: each volley fired on screen plays its own synthesized shot, panned left or right by where it happens and louder as you zoom in. Rifle cracks, tank-gun thumps and artillery or naval booms each have their own low-frequency punch.
- Ambience beds that follow the camera: a distant rumble from the front when battles are on screen (panned towards them), wind that rises as a storm passes over the view, surf when you look out to sea, and a jet-engine drone while aircraft fly overhead. All beds quieten while paused.
- Generative score: a slow minor-key synth pad that changes chords every few seconds. When you are at war it drops into a darker progression with a low pulse beat. It can be turned off in Settings (Music) while keeping effects and ambience.

## Round 36 — Player feedback: daylight, calmer weather, surprise attacks
- Lighting follows the game clock where you are looking: the whole view brightens to clear daylight at local noon, warms at dawn and dusk, and darkens to deep blue at night. It is computed from the sun's real position (with the season) at the centre of the screen. This replaces the half-world shadow that left the map looking dark most of the time. City lights and unit night shading follow the same light.
- Calmer weather and effects: rain streaks, falling snow, lightning flashes and the glowing light pools under fires are gone. Clouds are softer and more transparent, and city lights are a small warm glow instead of big halos.
- Surprise attacks, in the style of the genre's border rules:
  - Formal declaration (Diplomacy): war begins after 24 hours, with no reputation penalty.
  - Surprise attack: order a force into a nation you are at peace with (or a strike on it) and the route is allowed. The panel warns "⚠ This route crosses into France: sending it declares war", and the button turns red ("Attack (declares war)").
  - Sending it opens a Declare war? dialog with Continue: declare war and Cancel move. It lists the consequences: the victim's opinion −60, other nations' opinion of you drops, treaty breaking, and allies who may join.
  - Continuing starts the war immediately, with no 24-hour wait.
  - When a power formally declares war on you, you can strike first at any time.
  - AI powers with a big advantage and a grudge sometimes launch surprise attacks too.
- Relation names follow the genre's terms: Right of Way (passage), Shared Intel alliance, Ceasefire (truce).

## Round 37 — Ranged fire, right-click orders, pursuit
- Ranged artillery: idle forces with Hammer Batteries automatically shell enemy forces in neighbouring provinces every hour, without moving in or taking return fire, as ranged units do in the genre. You see shells arc across the border, rolled-up damage numbers on the target and a dispatch. The force panel has Fire at will / Hold fire controls, and AI artillery shells your border stacks too. Bombardment deals roughly a quarter of a full assault's damage, is reduced by fortifications, and trains Artillerist commanders.
- Right-click orders (desktop): with a force selected, right-click a province to move or attack at once, or right-click an enemy force to pursue it. Left-click still plans a route first, and a second click sends it.
- Attack an enemy force: click an enemy counter with your force selected and your force pursues it, re-routing every hour as it moves ("Pursuing France 2nd Armored Division").
- Fixed "from 1 directions" in the coordinated-assault dispatch.

## Round 38 — Command bar
- Selecting a force opens a command bar of large icon buttons at the bottom of the map:
  - **Move (M)**: tap a destination and the force goes at once.
  - **Attack (K)**: tap an enemy force to pursue it, or a province to assault.
  - **Delay (L)**: wait 3, 6 or 12 hours before moving off, to synchronise attacks from several directions. The button counts down ("Wait 3h").
  - **Split**, **Merge**, **Halt (X)**.
  - **Stance**: click to cycle Hold, Defend and Preserve.
  - **Air drop**, for paratroopers.
  - **Close (Esc)**.
  - Air wings get Strike, Patrol or Scout, plus Rebase.
- While a command is armed, the cursor becomes a crosshair, a hint explains what to tap, and Esc cancels. On phones the bar sits above the zoom buttons and scrolls sideways if needed. M only toggles sound when no force is selected.

## Round 39 — Scenario balance
- Theatre victory counts only provinces inside the theatre. Before, an AI could "win Europe" by day 26 thanks to its Middle Eastern land (Turkey), or win the Pacific with Siberia (Russia). Theatre victory now needs 40% of the theatre's land, or your starting theatre provinces plus 45. The victory tracker shows "theatre land" in those scenarios, and coalition land counts the same way.
- The AI's preference for attacking the human player now scales with difficulty: Recruit 0.55×, Regular 0.8×, Veteran 1.05×, Elite 1.3× (previously always 1.1×). In 120-day simulations of every scenario, theatre games no longer end early, several AI powers fall in Europe, and even an idle player survives well over a month.

## Round 40 — Final polish and soak test
- The briefing and rules now explain formal declarations versus surprise attacks, the command bar (Move, Attack, Delay, Split, Merge, Halt, stance), right-click orders and automatic artillery fire, and fronts (frontage, flanking, rivers, highways, winter and mud).
- The tutorial's "Send it" step mentions the command bar and right-click. The keyboard reference lists M, K, L and X.
- Soak test: full campaigns in all three scenarios (World War 120 days, European Theatre, Pacific Rim) ran with no script errors, no invalid or negative stockpiles, and no frozen armies. Save files stay under 400 KB.

## Round 41 — Slower game clock
- New pace, by request: at 1× one real minute is four game minutes. A game hour takes 15 seconds, a game day 6 minutes, and a 120-day campaign about 12 hours of play. 2×, 4× and 8× are multiples of that (8, 16 and 32 game minutes per real minute), and the speed buttons' tooltips say so. Before, 1× ran a game day in 12 seconds.
- Persistent campaigns keep running at the same 1× pace while you are away, with up to 30 days of catch-up.
- Aircraft now follow the simulated flight exactly at the slower pace, catching up if behind, and their bombs land when they actually reach the target.

## Round 42 — Animated city buildings
- Every building now appears in its city on the map once you zoom in (about 18 px per hex), arranged around the city marker, growing with zoom and drawn under the troops:
  - **Arms Factory**: sawtooth-roofed works with one chimney per level, each puffing smoke.
  - **Airbase**: an angled runway with centreline marks, a hangar and a spinning radar. Runway lights come on at night.
  - **Refinery**: storage tanks and a flare stack with a flickering flame.
  - **Foundry**: a furnace door that pulses with an orange glow.
  - **Farms**: striped crop fields (more per level) and a turning windmill.
  - **Recruiting Office**: a barracks with a flag in the owner's colour waving on its pole.
  - **Fortifications**: wall segments with towers ringing the city, wider with each level.
  - **Missile Silo**: a striped hatch with a blinking red warning light.
  - **Naval Yard**: a dock, slipway and a slowly swinging harbour crane.
  - **Under construction**: scaffolding that rises as work progresses, a slewing tower crane, a gold progress ring and drifting dust.
- At night, building windows light up warm yellow.

## Round 43 — City or troops?
- Clicking a city where your forces stand (on the city or on its troops) opens a small menu at the click point: City (recruit, build, details) or any of the forces stationed there, each with its formation name and unit count. Pick one to select it; Esc, panning or clicking elsewhere closes the menu. Once a force is selected, clicks plan routes as before.
- The tutorial's capital and army steps mention the menu.

## Round 44 — Real fog of war, aircraft spotting, UAVs and satellites
- Stricter fog of war:
  - Your provinces reveal only themselves. Cities and airbases carry radar that also covers the neighbouring provinces.
  - Ground forces and fleets see their own province and the next one around. Shared Intel allies share their vision.
  - Every other army, including independent garrisons, is hidden under the fog until something of yours spots it.
- Aircraft spot enemies: strikers, gunships and interceptors in flight reveal the provinces around them as they fly. Patrolling wings and UAVs watch everything within two provinces.
- UAVs: the drone is now the **Kite Recon UAV**. It flies to any province within 18 hexes and loiters there for 12 hours, watching everything within two provinces live. The area stays revealed for 12 hours after it leaves, and a dispatch reports how many foreign units it saw.
- Reconnaissance satellites (new Strategic research, after Cruise Missiles):
  - Launch up to 3 from a missile silo or your capital for $250M each.
  - Each follows a looping ground track that crosses the whole map once per game day. Everything inside its footprint (roughly 1,400 km across) is revealed as it passes.
  - On the map you see the satellite with its solar panels and a blinking beacon. Your own also show a dashed scanning footprint and their track.
  - AI powers launch satellites too, and theirs appear in the sky with a red beacon.

## Round 45 — Messages, trade deals, Right of Way airbases, open market
- Direct messages: every nation in Diplomacy has Message and Trade deal buttons, a generated flag and an unread badge.
  - The chat window takes free text, plus quick buttons: Hello, Propose peace, Ask Right of Way, Propose alliance, Ask for help, Threaten.
  - The AI answers according to its opinion of you and the situation, and acts on requests. It may accept peace, grant Right of Way, ally with you, or even declare war on your enemy if it likes you enough. Threats sour relations.
  - AI nations also message you first: peace feelers, border warnings, alliance invitations, war notices. Unread messages appear as toasts and on the Diplomacy badge.
- Trade deals: a two-column deal builder.
  - Each side can include money, oil, metal and food, any number of provinces (buy or sell territory), and treaties: peace, Right of Way, non-aggression, alliance.
  - A live verdict says whether they would likely accept, or roughly how much more value they want.
  - The AI values provinces by city, oil, ore and size. It won't give up its capital or its last provinces, and it charges more for peace when it thinks it's winning.
  - Ceded provinces transfer for good, and troops left inside are evicted.
  - AI nations send you trade proposals too, such as selling a border province or trading goods for cash. These appear as offers in Diplomacy with Accept and Decline.
- Right of Way now also opens airbases: allied and Right of Way partners' air wings can rebase onto each other's airbases and stay there.
- Coalitions: name your coalition or leave it from Diplomacy. Allying with nations founds or grows it.
- Open market: below the exchange, nations post sell offers of oil, metal and food from their surpluses, each with the seller's flag, quantity, price against the exchange rate, and time left.
  - Buying pays the seller directly.
  - Offers from nations at war with you are highlighted red with an ENEMY tag. Hovering says "This offer is made by an enemy: Russia. Buying from them funds their war."
  - You can post your own offers for 3 days (the goods are held until sold or returned), and AI nations buy them when they are short and your price is fair.
- Flags are original designs generated from each nation's colour (bands, crosses, chevrons and emblems), not real-world flag designs.

## Round 46 — Who am I buying from?
- The market's top section is now labelled "Anonymous exchange (no nation)", and trades there say no nation is involved. Each resource row shows the cheapest offer from a nation: its flag, name, quantity, price and a Buy button. Enemy sellers are highlighted red with an ENEMY tag and a hover warning.
- Every purchase from a nation names the seller, in the toast and in the dispatches ("Bought 10 metal from France for $22M"). Buying from an enemy is flagged as such.

## Round 47 — A market of real listings, with private coalition trades
- The anonymous exchange is gone. The market shows only what nations list:
  - **Sell offers**: you buy and your money goes to the seller.
  - **Buy offers**: you sell to the nation that asked, and it pays you.
  - If nobody has listed anything, the section says "No nation is selling/buying right now". A new campaign starts empty, and offers appear as nations build surpluses or run short.
- AI nations trade only through these listings: they post sell offers from surpluses and buy offers when short, and fill each other's offers (never between nations at war). No hidden trades remain.
- You can post sell offers (goods are held) or buy offers (money is held) for 3 days. AI nations fill them when the price suits them. Embargoing nations won't trade with you.
- Private coalition channel: the only hidden trades are inside a coalition. Coalition members can post "Coalition only" listings, marked 🔒 COALITION, which only that coalition's members can see and fill. You get a checkbox for this when you're in a coalition.

## Round 48 — Coalition giving in Messages
- Coalition trading moved from the market to Messages. Coalition-only market listings are removed, and every market listing is public again.
- Coalition partners get a Give button on their Diplomacy row and a Give (coalition) tab in their window. Send money, oil, metal, food or provinces at once, with nothing asked in return. The gift is noted in your chat, the partner thanks you, and they like you more.
- AI coalition partners send you supplies on their own when you run low on oil, metal or food, and tell you in Messages.
- Message, Trade deal and Give always show on each nation's row; the rarer actions stay under More.

## Round 49 — Province economy: population, morale, convoys
- Population: every province now has a population in millions. It is derived from the real density of known towns (now stored in the world file), its area and terrain, latitude, cities and capitals, with South and East Asia weighted up to offset gaps in the town data. Examples: Germany ~72M, the United States ~390M, India and China ~450M. Money and manpower now grow with population, so populous nations produce more (China ~$400M a day against Germany's ~$210M). Population grows slowly where morale is high and shrinks under bombardment.
- Province morale: morale = 100 − unrest − war damage.
  - War damage: battles fought there (+0.5 an hour), artillery shelling (+1.2 an hour), air strikes (+5) and missile hits (+12, or +22 for ballistic). It heals 2.5 a day.
  - Output scales with morale (45% at zero, full at 100).
  - The province panel and tooltip show population, morale, war damage and unrest.
- Convoys: provinces cut off by land from your capital (islands, distant coasts, overseas conquests) ship their output home every day along a sea route.
  - Enemy submarines, frigates or cruisers stationed on that route sink the convoy, and that day's output from those provinces is lost. You get a dispatch naming the attacker and where; your own warships sinking enemy convoys are reported too.
  - Convoys are drawn as small cargo ships with wakes sailing their routes, and raided ones go down in an explosion and smoke.

## Round 50 — More realistic units: new types, livelier models, movement by type
- New unit: **Thunder MLRS**, wheeled rocket artillery (Arms Factory II, Rocket Artillery research). It shells enemy forces up to 2 provinces away every hour without engaging, but is fragile in close combat. Its new 3D model has an 8-wheel truck chassis, a cab, and a six-tube launcher pod with three animation frames: stowed, raised and firing with exhaust flame.
- New unit: **Wraith Special Forces** (Special Forces research). Enemy radar, airbases and satellites can't spot them; only troops in the same or a neighbouring province see them. They get +40% attack in forest, mountains and cities and cross rough ground without slowing. Their model is a darker, crouching three-soldier team.
- Livelier infantry: soldiers swing their arms against their stride and bob as they march (all infantry, anti-tank, special forces and paratroopers).
- Movement by type: each force moves like its slowest unit's drive type.
  - **Wheels** (IFV, SAM, MLRS) are 60% faster on highways but slower in forest, mountains and tundra, and bog down in spring mud and snow.
  - **Tracks** (tanks, artillery) take 25% from highways and handle rough ground better.
  - **Foot** troops gain least from roads but cross mountains and forests best.
- Formation names: Rocket Artillery Brigade, Special Operations Group. Artillery panels show range 2 when rocket artillery is present.

## Round 51 — Free movement
- Exact destinations: the point you click is where the force goes. It travels to that province and then to the exact spot. Several of your forces can hold different positions in the same province, each drawn at its own spot instead of merging into one stack. Tapping elsewhere in a selected force's own province repositions it there.
- Smooth routes: forces follow curved routes through each province instead of zigzagging between centres. Planned and active routes are drawn as smooth curves ending at the chosen point, and groups spread out around it.
- Head-on clashes: hostile columns marching toward each other along the same road meet where they cross and fight at the nearer province ("Columns clash near Haut-Rhin"), instead of passing through each other.

## Round 52 — Visual round 1: real borders, 3,052 provinces
- New map from real administrative borders: provinces now follow actual states, provinces, oblasts and counties (Natural Earth admin-1, public domain), drawn on a grid three times finer (about 65 km per cell instead of 180 km). The world has **3,052 land provinces and 413 sea zones**, up from 738 and 284. Russia has 287, China 248, the US 230, India 127, France 48, the UK 34 and Germany 22.
- Province size follows population (Natural Earth populated places): small provinces in dense regions, large ones in Siberia, the Sahara and the Arctic. Tiny regions merge into neighbours. Large regions split around their main towns and take their names (Houston, Dallas, El Paso). Empty land is named after islands, ranges and plateaus (Baffin Island, Mackenzie Mountains). Micro-states and atolls stay off the map.
- Real geography in the terrain: mountain ranges, deserts and tundra come from Natural Earth geography regions instead of random rolls, and the terrain texture is re-baked from it per cell. Rivers, roads and coastlines are rebuilt for the finer grid.
- Real populations: national totals (~2024) are spread over provinces by towns and density, so India shows 1.43 billion and France 68 million. Economy coefficients were re-tuned so national incomes match the old map.
- Clean borders: each stretch of border between two provinces is smoothed once and shared by both sides. Fills, province lines, country lines and nation borders now follow the same curve, with no hex steps or overlap bands.
- Readability: province labels are ranked (capitals, cities, then big provinces) and never overlap. Sea names appear once per area, without numbering. Oil icons only show where a province is big enough on screen. Province borders are easier to see. Nation names sit on their main landmass. The home view ignores far-flung islands.
- Same distances, finer map: ranges, speeds, supply (about 4,800 km over land) and fog-of-war vision are measured in kilometres, so smaller provinces don't shrink them. Range messages now say km instead of hexes. Most neutral land outside cities is ungarrisoned.
- Speed: route-finding uses A* with cached adjacency (~4× faster), and the minimap is drawn from pixel data. A game day takes about 340–400 ms to simulate with four times as many provinces. Saves move to a new slot (v5) because province ids changed.

## Round 53 — Visual round 2: real coastlines
- Crisp vector coastlines (Natural Earth 1:50m, simplified, 80 KB) when zoomed in. Nation colours are clipped to the real shore instead of a blurred raster mask, so coasts stay sharp at any zoom.
- The sea is washed in its own colour outside the real shore, so the terrain texture's soft land edge no longer bleeds into the water. Soft teal shallow-water bands now run along every coast.
- Province edges facing the sea are pushed out to sea before clipping, so nation colours reach all the way to the actual coastline. Nation borders no longer trace coasts; the shoreline does that.
- Country and sea names claim their space before town names, biggest countries first, so names never overlap at mid zoom. Oil icons only show on provinces that are large on screen.

## Round 54 — Visual round 3: territory bands and a calmer map
- Each power's land carries a soft band of its colour just inside its border (clipped to its own land), so territories read at a glance like a strategy map. The band widens as you zoom in.
- Oil fields and ore deposits are rarer but richer on the finer map: world totals are unchanged, but the Middle East is no longer covered in oil icons.
- Unit counters that would overlap on screen merge at mid zoom. Independent garrisons stay hidden until you zoom in, unless the province is selected, targeted or fighting.

## Round 55 — Visual round 4: city markers by size
- Cities are drawn as round markers sized by population: regular cities, large cities (2.5 million+) and megacities (8 million+, with a dark core). Each has a ring in the holder's colour, so you can see who owns a city at a glance.
- Capitals get a bigger star on a dark disc ringed in the owner's colour.
- City names scale with size (megacities bold), sit closer to their marker and win label space over smaller towns. Night glow grows with population.

## Round 56 — Visual round 5: front lines and compact forts
- Front lines: your borders with every power you're at war with are drawn as a glowing red line with marching dashes, so active fronts stand out at any zoom.
- Fortifications are a small star fort (one bastion ring per level, with the level number) beside the city, in place of a ring of wall segments that spilled across neighbouring provinces on the finer map.
- City buildings shrink to fit small provinces instead of overlapping their neighbours.

## Round 57 / v1 — Polish round 1 (audited, fixed, verified)
- Smooth map: the cached map layer re-renders far less and much faster (single overlay pass, bucketed border paths, cheaper fog, a soft-light grain instead of per-province detail). Panning in the test browser went from 3–4 fps to 26–39 fps. Terrain is baked at 1.5× resolution.
- Operational counter plates: below close zoom, every stack is a compact plate (owner tab, unit glyph, strength, health and morale bars, status marks for selected, fighting, moving and cut off) instead of oversized sprites and overlapping badges. Stacks sit above city markers, and tapping a marker always picks that city.
- Real day/night: a terminator with a twilight band and per-province night replaces the single screen-wide tint. The top bar is one 52 px command bar: labelled resources, a victory-progress line, speed controls and icon buttons.

## v2 — Iron Meridian: World War III (your art)
- Renamed to **Iron Meridian: World War III** (page title, title screen, picker, briefing, end screens). The main menu sits on the war-room background with a live three.js globe over the hologram: day/night textures blended by the sun with a twilight band, ocean glint, atmosphere rim and a drifting cloud layer (earth maps stretched to 2:1, cloud seam blended, polar ice kept off the clouds). Zooming out past the flat map (or the new globe button) opens the same globe in game with the political map on it; double-click or zoom in to return to that spot.
- Your art throughout: 18 top-down unit images on the map at close zoom (rotated to heading, shadows, nation rings) and in the recruit cards, army rows and tooltips; buildings in 5 levels (city, military base = Arms Factory, naval port = Naval Yard, airfield, missile silo) that switch art as they level up, with a crossfade, scale and ring upgrade animation and a construction progress ring; explosion, smoke and crater combat effects; the panel texture on every panel; faction emblems on the picker, header, Powers and diplomacy lists, end screens and beside each capital. Backgrounds were removed from all unit, marker, effect and emblem images (tools/prep-art.py; originals kept in assets/art-src).
- Rules change (requested): Arms Factory, Naval Yard, Airbase and Missile Silo now go up to level V, with rising costs and per-level effects; the AI only goes past the old caps when rich. City art level follows the city's total building levels (+1 for capitals).

## v3 preview — real flags, realistic cities, and the v3 gameplay systems
- Real flags for every country (flag-icons, MIT; Somaliland drawn by hand) in the top bar, picker, Powers, diplomacy, trade and market rows, tooltips and as flag pins at capitals on the map. The four emblems now mark coalitions only. Cities and bases are frameless aerial patches that blend into the terrain at close zoom (no more metal discs); normal zoom uses clean markers. Every counter shows its unit's icon.
- Terrain types with real placement and effects (plains, forest, hills, mountains, desert, marsh, tundra, snow/ice, urban; river crossings): movement, defence, unit strengths, supply reach; shown in tooltips, the province panel and the Terrain map mode.
- Road and railway network from real data (tracks, roads, highways, rail, high-speed rail): much faster movement along roads and fastest by rail, routes prefer them, links can be built and upgraded, strikes damage them, and captured provinces cut rail use. Plus drones (swarm, strike, recon UAV I–V that becomes armed at IV), anti-drone jammers, heavy bombers, maritime patrol aircraft, AWACS (locations only, shown as unidentified contacts) and air-superiority fighters, each with a counter; flexible troop splitting (any counts, halves, N groups, by type, damaged units, drag to merge); slower water crossings with a realistic speed order; auto-deselect after orders; strike wear with maintenance at airbases and carriers; trade routes with cargo convoys, blockades, raids and escorts; coalition gifts checked. The ten new unit images use code-drawn stand-ins until the art arrives.

## v3 — CoN-style interface, unit motion, closer zoom
- New shell: a slim 44 px top bar (real flag and country name; money, oil, materials, food and manpower as clean icons with +income and rich tooltips; date, victory line, speed pill, notification bell) and a vertical icon dock on the left (Production, Market, Army, Research, Diplomacy, Intelligence; settings, sound and help at the bottom) with hover labels, active states and notification badges; panels open beside the dock. One panel style everywhere (panel texture, angled corner, hairline edges), lists without boxes, real flags next to every country name.
- Animation: panels slide in, buttons and rows react to hover and press, resource numbers count up or down with a green/red flash, country selection and game start get short transitions. Units look different moving and idle: they turn to their heading, ground units leave dust, ships leave wakes, helicopters show rotor blur and jets contrails, with a gentle bob; idle units breathe; dug-in or defending stacks show a sandbag marker. Zoom goes much closer (up to 20×) with sharp art.
- Field manual explains all v3 features; the AI no longer hoards materials late game and now researches and builds air-superiority fighters against bombers, AWACS and drones.

## v3.1 (in progress) — Cities on the map
- No more flags on the map (capital flag pins and independent countries' flags are gone); flags stay in the top bar, panels, lists and tooltips.
- Cities are part of the map now: each city is an irregular built-up area in map coordinates sized by population (about twice the real urban radius), so it grows and shrinks with the terrain instead of being a fixed-size picture. Every footprint is unique (seeded by the city): a dense, darker core, districts on a second street grid, sprawl along the roads and rails out of town and along the coast, patchy suburbs with green between them and satellite towns, clipped to land. It is textured from the supplied aerial city art (seamless tiles, own picks, angle, scale and colour grade per city) and glows with warm city lights at night. City markers and names sit on the city centre; town lights are map-sized too.
- Buildings on the map are clean symbols now instead of pictures: from the mid zoom on, a city's (or province's) buildings show as one small dark tray under its name with original vector symbols (factory for the Arms Factory, jet for the Airbase, anchor for the Naval Yard, missile for the Missile Silo, star fort for Fortifications, columns with a flare for the Refinery, anvil for the Foundry, an ore cart of crystals for the Rare Earth Mine, helmet for the Recruiting Office), each with level pips. The tray keeps a fixed screen size like the names, sits under or beside the name and never covers a name, a unit plate, a control or another city (a long tray wraps to two lines, and it is left out if there is no room). Construction shows the symbol dimmed inside a thin progress arc with its next pip blinking; a level rise pops the symbol with a bright ring and sparks. At low zoom the small fort and silo marks remain. The building pictures stay in the city panel and the build menu.
- Cities read clearly at play zoom (repair): bigger on the map (two to three times the real urban radius, at least about 34 km, so small towns such as Reykjavik, Murmansk and Sydney show); concrete is lifted on fields and woods and turned a deeper, neutral grey on sand, tundra and snow, most strongly while a city is small on screen; city markers step back from the mid zoom so the city shows around them; the political tint no longer colours the cities, and winter snow thins over them; urban provinces no longer get a lighter field pattern 'halo' (they take the pattern of their own ground). At night the street lights brighten towards the centre and thin out at the edges, over darkened concrete. No more pop-in after a jump: city bakes are several times faster (the colour grade is applied to the small tile, not as a filter over a big canvas), a low version of every city is prepared in idle time and kept, and a visible city with nothing ready gets a quick low version first.
- Units are drawn from the owner's pictures (merged from units-v31): sharper 512 px unit pictures and new 128 px icons, counters show the stack's main type as a picture tile edged in the relation colour (yours green, enemies red, others grey), close-zoom formations are made of the pictures (soldier squads for infantry, no silhouettes or toy models), and the same pictures appear in every menu (force cards, recruit lists, production, reports, dispatches).
- Air wings parked at a city stand just west of its marker (the airfield is a tray symbol now, not a compound on the map), so the star, the city name, the building tray and the stacks lifted above the marker all keep their places; a stack at a crowded city still leaves the marker even when its vehicles reach a neighbour's badge.
- Economy (merged from setup-v31): Food is gone (no food stocks, upkeep, farms, market goods or deals). Three new goods: Iron (ore deposits, iron hills, cities and Foundries), Electronics (big cities and Arms Factories) and Rare Materials (rare-earth deposits and the new Rare Earth Mine, which replaces Farms). Every research project costs money, materials and rare materials, more each tier; units, buildings, links, missiles and satellites use the new costs. The top bar shows seven resources; market, trade routes, deals, gifts and the AI handle the new goods; old saves are converted (farms refunded, food dropped). On the map the Rare Earth Mine is a tray symbol (an ore cart of crystals) with level pips like the other buildings.

## v3.8 — Conflict-of-Nations layout (UI only; map untouched apart from counters and the HQ)
- Slate-teal CoN palette for everything except the map (bars, panels, modals, buttons, toasts, tooltips).
- Two-row top bar: flag and nation, boxed day and clock with speed controls, victory meter; resource strip (icon over amount) with a missile-crate dropdown (cruise/ballistic stock, in production, silos).
- Bottom nav (Diplomacy, Market, Cities, Research, More) with red badges; new Cities list; shield buttons on the right edge (home, dispatches, relations).
- Research: SLOT #1 / SLOT #2 (queued next research auto-starts), full-width branch banners with diamond icons and taglines, diamond trees with tier rows and connectors.
- City bottom sheet: flag banner, name and status, morale, production, building cards with level badges, MOBILIZE UNIT and BUILD.
- Army counters: small real flag, slanted relation-tone plate, white tab with unit silhouette, bold italic count, fixed pixel size at every zoom.
- Headquarters building beside your capital replaces the YOUR CAPITAL tag (whole game).
