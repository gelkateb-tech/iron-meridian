# Logistics Depot: proposal (waiting for your OK)

Nothing has been built or changed in the game. No file in any worktree was edited, committed or pushed.

Preview pictures were made from a scratch copy of the game with a small test-only drawing step added to that copy (not to the game):
- Desktop 1440x900: `/tmp/claude-0/-home-user-iron-meridian/7fd07611-91e4-5b00-ba43-06c622a65904/scratchpad/logistics/sheet-desktop.jpg`
- Phone 440 px wide: `/tmp/claude-0/-home-user-iron-meridian/7fd07611-91e4-5b00-ba43-06c622a65904/scratchpad/logistics/sheet-phone.jpg`
- Numbers and worked example: `/tmp/claude-0/-home-user-iron-meridian/7fd07611-91e4-5b00-ba43-06c622a65904/scratchpad/logistics/sheet-numbers.jpg`

The preview puts depots in three German provinces in a row towards Poland: Sachsen-Anhalt, Berlin and Cottbus. Each picture shows "today" next to "with depots", at normal play zoom and at the closest zoom, by day and by night. They are not on the shots branch yet, because this step was not allowed to push. They need a go-ahead to push.

---

## 1. What it is

- Name: **Logistics Depot**.
- You can build it in **any province you own**, city or countryside. The province must have at least one land neighbour. (98 provinces have no land link at all, such as islands. A depot there would do almost nothing and show nothing.)
- One per province. No levels. Once built, the build list says "Already built".
- It gives your armies **+25% speed** in that province. It changes the roads there: they are drawn **thicker**. There is no model on the map.

## 2. Cost and build time

| | Logistics Depot | For comparison |
|---|---|---|
| Money and goods | **$50M, 10k materials, 5k iron** | Bunker level 1: $36M, 8k, 8k. One road upgrade: about $34M |
| Build time | **2 days** | Bunker level 1: 2 days. Road upgrade: 2 days |
| Upkeep | **none** | A typical nation earns about $160M a day |
| Limit | **1 for every 5 provinces you own, rounded up, at least 2** | Germany 5, Russia 58, Israel 2 |

- The limit stops "a depot everywhere", which would just be a tax on every player.
- What happens at the edges of the limit: you keep every depot you have. You can only start a new one while you are under the limit. Depots you capture count towards your limit.
- Please note: income is almost the same for big and small nations, so a big nation can afford more depots than its income would suggest. That is the trade-off of a size-based limit.
- A province builds one thing at a time, and that already covers cities. So a depot being built in a city holds up an Army Base or Airbase there for 2 days, and the other way round. (Question 7.)
- Value check: for infantry and tanks, a depot is worth about three road upgrades, because it helps every road out of the province. The price is the same on every kind of ground, so it is the best deal in mountains. I think that is fine and close to Conflict of Nations. It could be made dearer later if it turns out too strong.

## 3. The +25% rule, exactly

An army moves from the centre of one province to the centre of the next. Half of that trip is in the province it leaves and half is in the province it enters. **The depot speeds up the half that lies in its own province.**

| Depots on the trip | Trip time | Speed |
|---|---|---|
| none | 1.00 | as today |
| only one end | 0.90 | about +11% |
| both ends | 0.80 | +25% |
| walking inside a depot province (pinpoint moves) | 0.80 | +25% |

So a chain of depots gives the full +25% all the way, and a single depot helps every trip in and out of it.

**How it stacks with the rest.** It multiplies. It never adds.
- **Roads:** the road bonus stays as it is today. It depends on the unit type: a highway gives foot ×1.30, tanks ×1.50 and wheels ×2.20. The depot multiplies on top. Example: infantry on a highway between two depots gets 1.30 × 1.25 = ×1.63.
- **Railways stay the fastest way to move.** A depot never speeds up a train. It can also never lift a road above ×2.5, which is just under the railway's ×2.6. Only wheeled units (IFV, SAM, MLRS) on a highway reach that cap. They get about +14% instead of +25%. Without the cap they would beat the railway.
- **Stack-size penalty:** the depot does not soften it. It is just one more multiplier. Example: a 20-unit stack moves at 0.896 × 1.25 = 1.12 of normal speed.
- **Terrain, season, mud, snow, storms, rivers, Motorized Supply research and Blitz commanders:** they all still apply. The depot multiplies with them.
- **Supply:** no effect.
- **Damaged roads in the province:** the depot still works. The road itself is slower, as today.
- **A depot hit by a strike or sabotage:** no bonus until it is repaired.
- **Timing:** when a depot is finished, lost, hit or repaired, armies already on the move change speed at once. This includes armies walking inside the province.

**Who gets it:** you and your allies, and only while you or an ally owns the province. This is the same rule as railways. Enemy armies passing through get nothing. If they capture the province, the depot becomes theirs.

**Important: the game counts road trips in whole hours.** Today, a trip by road or off-road ends in the hour it is finished, and the part of that hour that is left over is lost. Only trains and ships carry it into their next trip. Because of this, the +25% shows up unevenly. Small gains often disappear, and some trips gain a whole hour. Question 1 asks whether to fix this for all land trips.

## 4. Worked example (real game numbers)

The route is 3 typical trips, about 720 km: start A, then B and C, then finish D. Plains, fair weather, no research. The first number is what players see with today's whole-hour trips. The number in brackets is what they would see with carry-over (question 1).

| Army and way | No depots | Depots in B and C | Depots in A, B, C, D |
|---|---|---|---|
| Infantry ×3, road | 21 h (21) | 20 h (19) | 18 h (17) |
| Infantry ×20, road | 24 h (24) | 21 h (21) | 21 h (19) |
| Tanks ×3, road | 15 h (13) | 12 h (12) | 12 h (11) |
| Tanks ×20, road | 15 h (15) | 14 h (13) | 12 h (12) |
| Infantry ×3, highway | 21 h (19) | 17 h (16) | 15 h (15) |
| Infantry ×3, off-road | 24 h (24) | 23 h (21) | 21 h (20) |
| Tanks ×3, off-road | 18 h (16) | 15 h (14) | 15 h (13) |
| IFV ×3, road | 9 h (9) | 9 h (8) | 9 h (7) |
| IFV ×3, highway (capped) | 9 h (7) | 6 h (6) | 6 h (6) |
| Own railway, infantry / tanks | 10 h / 7 h | unchanged | unchanged |

In short: a day-long march gets about 2-3 hours shorter. That is useful, but it is less than a railway gives. With today's whole-hour trips some cases gain nothing at all (IFV on a road). Because the bonus only works on your own or allied ground, it mostly helps defending and gathering forces behind your border. It does not speed up a push into enemy land.

## 5. The look: thicker roads, no model

What the preview shows (see the sheets):
- In a depot province, every road and highway is drawn about **1.8 times thicker** than normal, **at least 2.5 screen pixels**, with a dark edge, from the province centre out to the province border. The colours are the same as normal roads. At the border the road goes back to normal width, so a chain of depots reads as one thick road. In the preview, the thick road from Cottbus clearly ends at the Polish border.
- **Normal play zoom:** normal roads are faint there. They are drawn at about half strength and with no dark edge. So depot roads get their own minimum strength and always keep their dark edge. In the preview they read clearly on both desktop and phone, by day and by night.
- **Closest zoom:** the thicker roads are clear but quieter, because normal roads are already wide there.
- **Night:** the thick roads are drawn again over the night shading, as normal roads are, from the same zoom as by day.
- **Tracks:** they get thicker too, in their own track colour, but only from the zoom where tracks appear. That avoids a thick stub with no road leading to it. Every province that has any land link also has at least one road or highway, so every depot shows at play zoom.
- **Cities:** the main roads that run through the town get thicker too (you can see it in Berlin). The town's own street drawing does not change. The art bible rule is kept, because there is no model at all.
- **Who sees it:** your own and allied depots always show. An enemy depot shows only while you can see **that province itself**. Seeing a neighbouring province is not enough, so there is no peeking through the fog.
- **Build list:** a small flat road icon, only in the build panel, never on the map.
- **Limits you should know:**
  - When zoomed fully out (world view), no roads are drawn, so depots do not show.
  - **On a phone, the game starts a little further out (zoom 21) than the zoom where roads start to appear (22).** So depots show after one small zoom-in (question 8).
- **Speed:** about 1,000 short extra lines for 300 depots. They are made once, and only the area around a changed depot is redrawn. The frame rate should not change.

## 6. What the computer does

- It checks once a day, at the same time as it plans roads and railways. It works on 1 depot at a time and skips some days at random, as the road builder does.
- **Where:** on its main routes, from its capital to its borders. "Border" here means **any province next to another nation**, not only one at war. (The computer never starts wars, so otherwise it would almost never build on borders in peacetime.) Borders facing an enemy, a rival or a big foreign army nearby come first. At war, the provinces next to its attack target come first.
- **Order along a route:** it starts at the **border end and works back towards the capital**. It scores each province on the route: closer to the border is better, and countryside gets a bonus so it does not block city projects.
- **How many:** its own target is lower than the limit: 3 + (border provinces ÷ 3), and never more than the limit. Russia builds up to 16 ($800M in all, over about 6 weeks), the USA 13, Germany 5 and Israel 2.
- **Money:** it only starts a depot when it has more than about $250M in cash and earns more than about $10M a day. Most nations start with about $220M, so they do not start on day 1. It never starts a depot while it is saving up for a road or railway job, because a railway is worth more.

## 7. Old saves

- Old saves load as they are. The game already fills in any missing building with 0 when it loads a save, so old saves simply have no depots. The save format does not change.
- Every list that covers all buildings gets the depot: bombing value (a small building, value 1), territory worth, and the sabotage and missile target lists. Without it, bombing and the computer's target choices would break.
- Captured: it passes to the new owner, the same as roads.

## 8. How it gets built (for the builder)

- **Rules** go in `rules/*.js`, kept separate from the screen code:
  - the BUILD row with `key logi`, `max:1`, `where:'any'` plus the land-neighbour check and the limit check in `canBuildHere`;
  - `BLD_VAL`;
  - the half-trip factor in `legHours`: multiply f by 1/(0.5/fA + 0.5/fB) before the rail comparison, capped so a road plus depot stays at 2.5 or below and never drops below today's f;
  - the same factor in `walkSpeed`, re-timing walks when a depot changes;
  - the computer step next to `aiLinks`.
- **Route finder:** `legFactor` uses the same half-trip factor in `fpWeights` and `fpPatch`. When a depot changes, every link of the province (including links that never changed in game) is marked touched. The route finder's rough guess counts every depot, including other nations' depots. Real travel times count only yours and your allies'.
- **Drawing** goes in `index.html`:
  - a cached "depot roads" path: each depot's link ways from the centre to the province edge;
  - stroked in `drawWaysOver` (full and quick modes, always with the dark edge, its own minimum strength from zoom 22) and in `drawRoadsNight` (from zoom 22);
  - a separate depot snapshot is compared each time, so only the boxes around changed depots are redrawn. The road snapshot only sees links changed in game, so it would miss most depots.
- **Order with other jobs:**
  - After **build-reqs**, which rewrites the building table and the computer's build code.
  - Coordinate with **pinpoint-3**: the same movement code, and `rules/tick.js` if question 1 is a yes.
  - Reuse the **Field Hospital** plan's limit pattern.
  - **cities-redo** is not touched.
  - The seed-12345 check file (`tools/golden-12345.txt`) must be made again. Question 1 would change it too.

---

## Questions for you (my suggestion in brackets)

1. **Whole hours:** today a road trip loses the part of the hour left over at its end. Should that part carry into the next trip, as it already does for trains? Then the depot's +25% is real every time, but all marching also gets a little faster (by 0-2 hours on a day-long march, about 5-10% on average; most for fast units). [Yes, as its own small step, done first]
2. **Cost:** $50M, 10k materials, 5k iron, 2 days, no upkeep. OK? [Yes]
3. **Limit:** 1 depot per 5 provinces (at least 2)? Or no limit, with $0.2M a day upkeep for each depot? [The limit]
4. **Enemies passing through:** should they get the bonus too? [No: only you and your allies, like railways]
5. **Half-trip rule:** +25% when both ends of a trip have a depot and about +11% when one end does. Or should one depot at either end give the full +25%? [Half-trip rule]
6. **Rail cap:** a depot can never make a road faster than a railway. Only wheeled units on highways are trimmed, to about +14%. OK? [Yes]
7. **Building slot:** should a depot share the province's one building slot, so it blocks city projects while it is built, or have its own slot? [Share it, as today]
8. **Phone start zoom:** phones start just outside the zoom where roads appear. Should depot roads show a bit further out (they would be the only roads drawn there), or appear with the other roads? [Appear with the other roads]
9. **The look in the sheets:** about 1.8 times thicker, at least 2.5 px, a bit brighter than normal roads at play zoom. OK? [Yes]

---

## Appendix: review points not taken, or changed

- **Rail fix, "pick rail or road before the depot, then add the depot only if the road wins":** not taken. I used a simple cap at ×2.5 instead. It is easier to explain, a road can never beat the railway, and the trip type the game shows does not change.
- **"Raise the price to $60-70M, or scale it with rough ground":** not taken for now. A flat $50M is simpler. Section 2 says the depot is the best deal in mountains, so it can be raised later if that turns out too strong.
- **Combat Engineers discount:** dropped. The draft said Combat Engineers would make depots cheaper "like roads". The review found that this needs new code, because that research only applies to roads today. Keeping the depot simple.
- **Two depot projects at a time for big computer nations:** dropped. One at a time for everyone keeps Russia's spending at about a tenth of its income.
- **"Draw a track at road thickness in track-only provinces":** dropped. A count found no track-only provinces: every province with a land link has a road or highway. The 98 "no road" provinces have no land links at all, so the depot is now not allowed there.
- **Corrected from the draft:** "in a city only the roads outside the town get thicker" was wrong. The preview shows the main roads through Berlin get thicker too. Only the town's own streets stay the same.
- **Already answered by you, now stated as facts:** depots can go in any province, cities included, and there is no extra mark at world zoom.
