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
