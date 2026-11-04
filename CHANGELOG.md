# Iron Meridian — Changelog

## Round 1 — Real-world map
- Replaced the generated continent with a real-world map: 581 land provinces in 154 countries (named after real regions, seeded at 190 major cities) plus 284 named sea zones, built from Natural Earth data by `tools/build-world.js`.
- Added 15 playable powers with a nation picker, troop embarkation across sea zones, a minimap, a hatched fog of war, country borders in each power's color, hover tooltips and original unit counters (type glyph, strength, health bar) that cluster when zoomed out.
- Balance: captured land pays 25% rising to 100% over 10 days, large empires get diminishing income, the AI respects upkeep and an army cap, independent garrisons are stronger, and pathfinding uses a heap.
