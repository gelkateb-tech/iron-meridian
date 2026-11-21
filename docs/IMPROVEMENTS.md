# Improvements: ideas from the playtest session

The owner makes the final call on every idea here. Nothing in this file is built on master; a prototype, when there is one, lives on its
own branch and is never merged by the session (owner's changes 2026-11-21: at most 1 prototype per round, at most 3 rounds).

This is also where a settled decision that looks wrong goes (docs/DECISIONS.md and the last section of LATER.md): name its id
(for example CMB-3), say why, and leave the code as it is.

Format of an idea (copy the block):

```
## IMP-<n>. <short title>   (round <r>; area: <economy / combat / AI / UI / ...>)

**Problem.** What goes wrong for a player, in one or two sentences.
**Evidence.** The numbers from the harness (tool and options, seeds, days), or the decision id it questions.
**Options.**
1. <option> (what changes, what it costs, what it risks)
2. <option>
3. <option, if any>
**Recommendation.** Which option and why, in one or two sentences.
**Effort.** small / medium / big
**Prototype.** branch name and what it shows, or "none"
**Touches a settled decision?** no / yes: <DECISIONS id> (then it is only a suggestion for the owner)
```

---

<!-- Ideas go below, newest last. -->

## Round 1 ranking   (2026-11-21)

Sources: the military, economy and player hunters (4x90 days on seeds 1007/2016/3025/4034 and 1500-1503 with `--invariants --stats
--provoke 3`; three nations played in the page), the setup baseline (5x60), and the advisor's read-only probes (scratchpad
`autotest/round1/adv/`: sealeg.js, portal.js, portal2.js, air.js). Each idea was checked against docs/DECISIONS.md; an option that would
change a settled decision is marked **PROPOSAL** with its id. Nothing here copies Conflict of Nations.

| Rank | Idea | Area | Effort | Settled decision touched by the recommendation? |
|---|---|---|---|---|
| 1 | IMP-1 Sea legs run centre to centre: invasions take about 2x too long | movement / pacing | medium | no (MOV-3 speed unchanged) — **prototype `idea/sea-legs`** |
| 2 | IMP-2 The order book is dead: AI nations go broke while holding billions of goods | AI economy / market | small-medium | no (fits ECO-9, ECO-10) |
| 3 | IMP-3 Fleets stay in port, naval ranged fire nearly harmless | naval / AI | medium | no |
| 4 | IMP-4 Island and boxed-in nations: First Steps asks for what they cannot do | onboarding | small | no (Marines day 1 is a PROPOSAL, UNI-2) |
| 5 | IMP-5 Declaring war does not warn that your border cities are empty | UI / diplomacy | small | no |
| 6 | IMP-6 The side panel recomputes world-wide counts 4 times a second | performance (side panel) | small | no |
| 7 | IMP-7 Interceptors sit on the ground (about 6% of wing-hours on patrol) | air / AI | small-medium | no (auto-scramble is a new rule) |
| 8 | IMP-8 AI armies are 3/4 infantry; 5 unit types never appear, no missile fired | AI build mix | small | no |
| 9 | IMP-9 AI research slots stay empty while a step is affordable | AI research | small | no (RES-14 kept) |
| 10 | IMP-10 AI churn on independent land: about 5 provinces a day back to rebels | AI / occupation | small | no; re-measure after REB-2 |
| 11 | IMP-11 Ranged fire looks useless on screen | combat feedback | small (UI) | the damage option is a PROPOSAL (CMB-5) |
| 12 | IMP-12 Manpower is full on 54-66% of nation-days | economy balance | owner decision | options are PROPOSALS (ECO-6, BLD-6) |
| 13 | IMP-13 Text and feedback polish (6 items) | UI text | small | no |

## IMP-1. Sea legs run centre to centre: a sea invasion takes about twice the real distance, and troops land at morale ~42   (round 1; area: movement / pacing)

**Problem.** A force moving by sea sails to the centre of every big sea zone it passes. The trip is far longer than the real sailing line,
most of it is spent cut off from supply, so the force lands weak, and the route preview gives no warning. Island and coastal nations feel it
on every landing.
**Evidence.**
- Player hunter (P1-03): Germany, 1st Infantry Division Berlin → Wicklow (Ireland) took 274 h (11.4 game days, about 9 minutes at 8x).
  Centre-to-centre legs 3,537 km against about 1,400 km of real sailing (North Sea III, English Channel, out to the North Atlantic X centre
  and back). Morale 100 → 42, health 74 → 67 on landing.
- `adv/sealeg.js 1500` (134 sea trade routes): graph length over the sailed track, median x1.39, p90 x2.37; on routes under 1,500 km the
  median is **x2.09** (Miami → Havana 275 km sailed against 1,020 km on the graph).
- `adv/portal.js` (seed 1500): ending a sea leg at the zone's border instead of its centre takes the 195 own-port → own-port sea moves from
  a median 99 h to 70 h.
- MOV-3 (325 km/day at sea) is settled; the distance it is applied to is not, so across big zones the real speed is about half the settled one.
**Options.**
1. End each sea leg at a "gate" on the zone's border instead of its centre. The rules already scale a leg's time by its real length
   (`legRatio`), so time, drawn motion and ETA follow. Changes play and the golden on purpose; deterministic; route choice unchanged.
2. Also route by real sailing distance (gate-aware costs in `pathFor`). Best routes; bigger change, touches the AI's path costs.
3. UI only: the route preview warns "by sea · about 11 d · out of supply for about 9 d · morale on landing about 40". Honest, trip stays slow.
**Recommendation.** 1 now (prototyped), then 3 as a small page follow-up for whatever cut-off time remains; 2 only if 1 is liked and routes
still look odd.
**Effort.** medium
**Prototype.** **`idea/sea-legs` @ a0e4982** (one commit on master d573575; never merged). Try it: `git checkout idea/sea-legs`,
`bash tools/mkpage.sh`, open `.test/page.html?start=nations`; send a UK force Edinburgh → Belfast (preview about 36 h; master about 182 h),
or Germany's 1st Infantry Division Berlin → Wicklow (about 225 h; master 281 h).
- What it does: a leg into a sea zone the force sails on from ends at a gate on the border it enters through (not the one it leaves by, so
  the zone a force is counted in matches where it is drawn: blockades, sea battles, `canProceed`). The gate is chosen along the whole
  remaining route, worked back from its end (`seaWay`: up to 12 border cells per zone plus the centre; 1 km over other land counts as 10),
  so each leg picks the cell the forecast picked. Stored with its leg (`a.gate`); old saves finish their current leg at the centre.
  Also a small orderMove fix (a re-ordered leg restarts from where the force was). Page: about 10 lines in the unit-movement drawing so the
  counter and the preview line follow the gates (no hands-off code touched).
- Measured (seed 1500, against master d573575): port-to-port ETA median 99 → 71 h (x0.80, p10 x0.38); UK Edinburgh → Belfast 182 → 36 h,
  Carlisle → Belfast 176 → 30 h, Belfast → Leeds 181 → 31 h; Berlin → Wicklow actual trip 281 → 226 h (forecast 225 h), landing morale
  33.5 → 46.4; drawn sea routes x0.83 long, share over other land 4.8% → 1.8%; all-AI 30 days: landings 130/146 → 154/153, ground forces
  still at sea at day 30 50/44 → 30/27 (seeds 1500/1501). 11 of 195 routes get slower (at most x1.16: they now sail round land that the
  centre lines cut across).
- Checks: split-lint, headless --check (plain, --nations, with every extension) deterministic; nations-balance --quick, stack-duel,
  eco-check --scenarios pass; --scenarios 37/41 with the same 4 warnings and the 45-minute boarding/landing exact; harness 3x60 + 3x45 with
  invariants: no ship-on-land, teleport, exception or save error. Golden changed on purpose (branch only: day 10 `ada915d114540bb3`).
  Old saves (public v3.12, a master save mid-leg on the North Sea) load and play 10 days.
- Watch before any merge: **stuck-force went up** (30 → 48 on 3x60, 20 → 27 on 3x45; at sea 1 → 6 and 0 → 1). Traced cases are war and AI
  behaviour (one Pakistani force flips between a sea and an overland route), but check whether `etaHours` depending on the exact start
  point makes the AI switch routes more often. Frigate ranged volleys halved (11,985 → 5,275), not looked into. Limits: one straight line
  per zone (Berlin → Wicklow clips Kent and Sussex, about 200 km); route choice still uses centre distances; supply at sea unchanged.
**Touches a settled decision?** no. MOV-3 speed and EMB-1/2/3 boarding and landing are unchanged. (The open QUEUE question on long land
detours to naval cities is a different matter.) Owner question Q2.

## IMP-2. The order book is dead: AI nations go broke and short of oil while sitting on billions of goods   (round 1; area: AI economy / market)

**Problem.** The Market is the order book (ECO-9). AI sellers list their surplus but almost nobody buys it. A seller with $6-11B of goods at
base prices runs out of cash and oil for weeks, and the surplus over the storage cap is cut each day. A person's sell offer meets the same
empty book, so posting one almost never does anything.
**Evidence.**
- Economy hunter, seed 1502, 45 days: 2,196 AI sell listings, 178M units listed, 156M came back unsold (oil 99%, every other good 100% of
  closed listings); aiBookBuy called once in 30 days. A person's 10 sell offers of 50K at 0.95x and 0.8x the world price: after 71 h only
  16K oil had sold (ECO-R1-2, rejected as a bug: nothing breaks, listings expire on schedule).
- 4x90 (seeds 1500-1503): 351 of 16,154 nation-days (2.2%, day 30 on) broke (cash < $100M, net ≤ $10M a day) while holding more than $2B of
  goods. Kazakhstan 38 days (day 80: $45M cash, −$3M a day, oil 0, metal and rare at the cap, about $10.9B of goods; its 509-hour fully idle
  streak is this); Iran 34, Uzbekistan 31, Romania 29, United Kingdom 24 (ECO-R1-3).
- Cause (rules/economy.js:139-142, 171, 182): AI buyers fill a listing only when their own stock is below AI_NEED (metal 140K, x2 when
  cheap); sellers list from BOOK_HI (metal 900K). The two thresholds never overlap.
**Options.**
1. AI buyers also take book listings **for stock** when the ask is below the world buy price and they have cash for N days of upkeep and
   less than, say, 30 days of use in store. What ECO-9/ECO-10 already describe; moves money from rich to broke AIs.
2. Make the thresholds overlap (raise AI_NEED, or a cash-poor seller lists from a lower BOOK_HI). Small, hand tuning.
3. **PROPOSAL (ECO-9):** a cash-poor or oil-short AI may sell any good above ~60% of the cap on the world market. Fast cure; risks the price
   crash ECO-9 was made to stop.
**Recommendation.** 1, measured with the broke-with-goods count and the `bookDay` probe (scratchpad `autotest/round1/eco/probes/book.js`).
3 only if 1 is not enough, and only with the owner's OK (Q4).
**Effort.** small-medium
**Prototype.** none this round (strong candidate for round 2).
**Touches a settled decision?** no for 1 and 2; option 3 is ECO-9.

## IMP-3. Fleets stay in port, and naval ranged fire is nearly harmless   (round 1; area: naval / AI)

**Problem.** Frigates are the second most built unit, but a player rarely meets an AI fleet at sea, and when ships shoot it hardly shows.
**Evidence.**
- Military 4x90: 2,892 frigates (6.5% of units), kill/loss 0.71. Seed 1007, 30 days: on average 4 ships at sea in fleets against 154 inside
  land garrisons. Ranged fire: frigates 17,189 volleys for 64 damage, submarines 2,829 for 8, cruisers 9 for 0. 6-11 cruisers and 0
  carriers built in 360 game-days.
- Part of this was a bug (MIL-R1-02, new ships joining the port's ground garrison), **fixed on auto-test/fixes in 3df6ae0**: with provoked
  wars, ships inside mixed forces 121.7 → 0 per sample, about 21 fleets at sea per sample (fixer's `fix/t9c.js`). The 3x60 run after the
  fixes shows the games play differently once fleets act (more convoy-state reports).
**Options.**
1. Fix MIL-R1-02 (done on auto-test/fixes), then re-measure kill/loss and ranged damage.
2. Give the AI fleet jobs at war: escort its own sea routes, raid enemy routes, blockade an enemy port (aiPickUnit already reacts to raided
   routes, ai.js:186-189; the fleet orders are missing).
3. Re-tune naval ranged damage (RANGED_F for frigates and submarines) once fleets sail. Small, needs stack-duel numbers;
   **PROPOSAL (CMB-5)** if it changes the 28%.
**Recommendation.** 1 (done), re-measure in round 2, then 2; 3 only with numbers. IMP-1 also helps: shorter sea legs make fleet moves worth
ordering.
**Effort.** medium
**Prototype.** none (option 1 is a bug fix)
**Touches a settled decision?** no for 1 and 2; option 3 may touch CMB-5.

## IMP-4. Island and boxed-in nations: First Steps says "capture a weak independent neighbour", which 15 of 68 nations cannot do   (round 1; area: onboarding / nations balance)

**Problem.** A new player as Cuba, Japan, New Zealand, Mongolia, Peru or Ecuador follows the First Steps panel and finds no target. Cuba gets
"No naval city to land at on the way…" for Jamaica or the Bahamas. The first capture needs Marines (research day 3, 3 days) or a war, so
the opening is idle for about a week with no explanation.
**Evidence.**
- Player hunter (P1-04): 15 nations have no land-adjacent independent on day 1 (Cuba, Canada, Japan, Australia, Norway, Finland, South
  Korea, North Korea, Philippines, Malaysia, Mongolia, Peru, Chile, Ecuador, New Zealand). 9 of them also have no landable independent
  naval city within about 1,700 km; Cuba's nearest is Nuuk, about 6,000 km away (the Caribbean and Central American independents have no
  cities, so no naval cities).
- The AI also hardly uses Marines: 16 built in 4x90 game-days. Adds evidence to the owner's open QUEUE item ("The AI hardly builds Marines:
  raise its build weight?").
**Options.**
1. First Steps per nation: with no reachable independent, say "research Marines (day 3), train them in a coastal city with an Army Base,
   then land on any coast", or name the nearest target. Page text only; the rules already know the answer.
2. **PROPOSAL (UNI-2: `u_mar` on day 3):** nations with no reachable independent get Marines on day 1.
3. **PROPOSAL (EMB-1):** give some cityless independents (Caribbean, Central America, Pacific) a landing point.
**Recommendation.** 1 now (small, no rule change); 2 for the owner (Q3).
**Effort.** small
**Prototype.** none
**Touches a settled decision?** 1 no; 2 UNI-2; 3 EMB-1.

## IMP-5. Declaring war does not warn that your border cities are empty   (round 1; area: UI / diplomacy)

**Problem.** The war dialog says only "War starts at once. −50 opinion with them." A player who sent the capital's garrison overseas loses the
capital within hours.
**Evidence.** Player hunter (P1-09): Germany declared war on Poland at hour 344 with Berlin empty; "Poland captured Berlin" by hour 360,
capital moved to Hamburg, income −40% for 14 days. The useful nudge ("At war with $3,077M unspent and 10 idle cities") comes only after.
**Options.**
1. The confirm step lists own cities bordering the target with no or few defenders, capital first ("Berlin: no troops · Poland has 3 forces
   next to it"). The rules' own counts; page only.
2. A dispatch when your capital is left empty next to a nation you are at war with.
3. Both.
**Recommendation.** 1 (informs at the moment of the choice); 2 later if players still lose capitals.
**Effort.** small
**Prototype.** none
**Touches a settled decision?** no (DIP-2 "no 24-hour delay" stays).

## IMP-6. The side panel recomputes world-wide counts 4 times a second (phones)   (round 1; area: performance, index.html side panel)

**Problem.** Older phones pan at about 12 fps. Most of that is canvas painting (map job, logged in docs/ROUND_LOG.md "Bugs for other jobs"),
but a visible part is the side panel recomputing values that change once a game hour.
**Evidence.** Player hunter (P1-06), phone 440 px at 2x, CPU 4x throttle: renderSide is 7.2% of a 17.9 s pan profile and 8.1% of a 1x clock
run. index.html:11786 calls renderSide every 0.25 s, also while panning or paused; index.html:9776 runs
`S.nations.map(n => S.owner.filter(...))` (68 x about 3,500 provinces); growth() → score() (rules/state.js:430) has no cache outside a tick.
**Options.**
1. Cache the counts and growth by `S.hour` plus the ownership version (OWNV); rebuild only when either changes.
2. Skip renderSide while the map is dragged or zoomed (catch up on release).
3. Both.
**Recommendation.** 1 (small, nothing visible changes, about 3-7% of phone CPU back); 2 if profiling still shows it.
**Effort.** small
**Prototype.** none
**Touches a settled decision?** no (helps PRF-1 and PRF-5). The bigger phone cost also supports the owner's open item "phone map drawn at
pixel ratio 1.5 instead of 2" (QUEUE "Speed options that change play"): native raster and compositing are 67.5% of a pan profile.

## IMP-7. Interceptors sit on the ground: about 6% of wing-hours on patrol, 3 of 55 strikes met a fighter   (round 1; area: air / AI)

**Problem.** The AI fields 125-140 interceptors per game by day 40 ($62M each). They rarely fly, so a strike is almost never intercepted; a
player sees fighters that do nothing, and air defence is all SAMs.
**Evidence.**
- `adv/air.js`, 40 days with provoked wars: seed 1500, interceptors on patrol 1,185 of 20,377 wing-hours (5.8%); 43 strikes, 3 met a patrol;
  4 dogfights, 14 attackers shot down, 1 interceptor lost. Seed 1502: patrol 7.3%; 12 strikes, 0 intercepted, 0 dogfights.
- 4x90 runs: interceptors 555-698 built, "0 kills"; air superiority fighters 41-63 built, 0 kills (MIL-R1-I2, ECO-R1-11). This is partly a
  **harness counting gap**: the DOMINANCE table credits battle fire only, not dogfights (the probe shows real dogfight kills).
- AI patrol choice (ai.js:110-114) needs a score ≥ 2 over an own province; interceptors cover only `b.fly.tgt === p` (air.js:146).
**Options.**
1. The AI buys interceptors only when an enemy fields or flies bombers, drones, AWACS or patrol planes.
2. At war, the AI keeps its fighter wings on rotating patrol over its threatened cities and battles in range (it already records strike
   history, H.bp).
3. New rule (owner): idle interceptors scramble against a strike within range of their base, with no order.
**Recommendation.** 2 + 1 (AI only). 3 is the owner's question (Q5). Also credit dogfight kills in the harness (round 2 tool note).
**Effort.** small-medium
**Prototype.** none
**Touches a settled decision?** no for 1 and 2 (UNI-3 roles kept); option 3 is a new rule.

## IMP-8. AI armies are three-quarters infantry; five unit types never appear and no missile is fired   (round 1; area: AI build mix)

**Problem.** Every AI army looks the same: infantry with a few tanks and artillery. Rocket artillery, carriers, helicopters, paratroopers
and stealth bombers never appear in 360 game-days; silos and missiles exist but nobody uses them. Unused units also hide bugs: the carrier
rearm bug (MIL-R1-01) and the paradrop wound bug (MIL-R1-06) were found only by scripted play.
**Evidence.** Infantry 75.6% of units (baseline), 72.5-72.8% (4x90 runs); tanks best kill/loss (2.99-3.18), infantry 1.06-1.17. Never built
in any run: mlrs, carr, heli, para, stealth. Missiles: 1-11 cruise missiles built, 0 fired (ai.js:125-129, 571, 580: fire only at targets of
power ≥30 for cm, ≥60 for bm).
**Options.**
1. A small "use every arm" weight: a mid or large power fields one or two of each researched type it can build.
2. Lower the AI's missile thresholds at war and allow ballistic missiles at buildings.
3. Leave it and rely on a fuzz harness (MIL-R1-T2, see ROUND_LOG round 1) as the test net for those units.
**Recommendation.** 1 + 2 (small, AI only), and 3 as the test net anyway.
**Effort.** small
**Prototype.** none
**Touches a settled decision?** no (AI-1 same rules; RES-14 research weights untouched).

## IMP-9. AI research slots stay empty while a step is affordable   (round 1; area: AI research)

**Problem.** Computer nations leave research idle for weeks, fall behind, and the late game gets easier than it should.
**Evidence.** At least one slot empty a median 24% of hours (baseline) and 23% (economy 4x90, p90 47%); days with a free slot and an open step
it could pay for: median 18 of 90, at most 56. Likely cause, not traced yet: aiResearch (ai.js:388-418) saves rare materials for the best
step ("about five days of rare income", `rOk`) instead of starting an affordable one.
**Options.**
1. After a slot has been free 24 h, start the best affordable step even if a better one waits on rare materials.
2. The "save for it" rule may hold only one slot; the other always runs.
3. Measure first: log why the AI skipped (no step / saving / weight 0).
**Recommendation.** 3 then 1 (small); no research weights change.
**Effort.** small
**Prototype.** none
**Touches a settled decision?** no (RES-14 weights and slot rules kept).

## IMP-10. AI churn on independent land: in a no-war game about 5 provinces a day go back to independent   (round 1; area: AI / occupation)

**Problem.** The AI takes independent provinces with one unit, the province revolts and returns to independent, and the AI takes it again:
units spent, partisans appear, borders flicker.
**Evidence.** Economy hunter (ECO-R1-9), seed 1500, 60 days, no provoked wars: 331 risings, all in land taken from independents; 319 went
back to independent. With the 24-hour partisan fix (ECO-R1-1, now on auto-test/fixes 0c9b468): 347 risings, 314 still flip. Independent
land climbs +3/+5 unrest a day with one unit (economy.js:207 needs 2+ units to integrate).
**Options.**
1. The AI leaves 2 units in each taken city until it integrates.
2. The AI takes only land it can garrison.
3. Independent land rises more slowly (no nation to return to).
**Recommendation.** Re-measure on the `rebels` branch first: under REB-1 (one level-1 infantry beats any rebels) the churn may vanish when
that branch merges. If not, 1 (AI only).
**Effort.** small
**Prototype.** none
**Touches a settled decision?** no for 1 and 2; option 3 changes the partisan rule that REB-1/REB-2 are replacing, so not recommended.

## IMP-11. Ranged fire looks useless on screen   (round 1; area: combat feedback)

**Problem.** Artillery, frigates and submarines fire thousands of volleys for single-digit damage numbers. Players read "my artillery does
nothing", although artillery does well in battle (kill/loss 1.57).
**Evidence.** Economy 4x90: artillery 28,706 volleys for 847 damage (0.03 a volley), frigates 23,578 for 107, submarines 1,464 for 12,
cruisers 34 for 0. Baseline: 17,105 artillery volleys for 239 damage shown (hits under 0.5 not shown). Ranged damage is 28% of battle
damage an hour, spread over quarter-hour steps (CMB-1, CMB-5). Related known display bug: `IM.emit` passes 4 arguments, `fxRanged` sends 6,
so the page never gets the target point or kill details (setup baseline, not fixed yet).
**Options.**
1. UI: sum a bombardment's damage per hour or per target and show it once ("Artillery shelled Noord-Brabant: 3.2 damage, 1 unit lost this
   hour").
2. **PROPOSAL (CMB-5):** raise RANGED_F for artillery and ships.
3. New rule (owner): ranged fire also lowers the target's morale or dig-in.
**Recommendation.** 1 (small, page only, after the IM.emit fix); 2 and 3 only after stack-duel numbers and the owner's OK (Q6).
**Effort.** small (1); medium (2, 3)
**Prototype.** none
**Touches a settled decision?** 1 no; 2 CMB-5; 3 is a new rule.

## IMP-12. Manpower is full on 54-66% of nation-days   (round 1; area: economy balance)

**Problem.** Manpower almost never limits anyone; money does. The manpower part of the Recruiting Office and the manpower line in each price
mean little, and the storage-full tooltip shows most of the game.
**Evidence.** Manpower at the storage cap: 53.6% of nation-days (baseline), 66.1% (economy 4x90); used 0.80 of what came in. Money used at
0.99 of income.
**Options.**
1. **PROPOSAL (ECO-6):** lower the city manpower base (2.0) or the manpower cap, so mass armies cost manpower.
2. **PROPOSAL (BLD-6):** the Recruiting Office trades its manpower bonus for something that binds (more training speed).
3. Leave it: manpower is the buffer for wartime losses; check again once wars are long.
**Recommendation.** 3 for now; re-measure at day 90+ in long wars. Only the owner can pick 1 or 2 (Q7).
**Effort.** small (numbers) / owner decision
**Prototype.** none
**Touches a settled decision?** yes: ECO-6 (option 1), BLD-6 (option 2). Suggestions only.

## IMP-13. Text and feedback polish   (round 1; area: UI text)

**Problem and evidence** (all page text, except (f)):
- (a) "Shift-click a card to fill the queue" is shown to phone users; two taps do it on touch (P1-10a).
- (b) The move hint says "press Send" while the button reads "Attack (declares war)" (index.html:9825 against 10726) (P1-10b).
- (c) A sea route reads "Porto Alegre → Montevideo (via Porto Alegre)" (P1-10c).
- (d) The route mix "rail 38% · road 63%" adds up to 101% (mixText rounding) (P1-10d).
- (e) After a declaration of war, the trade route with that nation still reads "Open" and flows for a few hours: the rules cut it at the
  next 6-hourly pass and end it at 0:00 (trade.js trStatus, by design). Show "War: closes at dawn" (P1-08, rejected as a bug, kept here).
- (f) Bombard out of range returns false with no reason (combat.js orderBombard). The page checks bombardInfo first, but a `refuse()` reason
  helps any host such as a server (MIL-R1-08, rejected as a bug, kept here; one line in the rules).
**Options.** 1. Fix the wording as listed. 2. Leave (b) and (d) for the final polish pass.
**Recommendation.** 1, all in one small change.
**Effort.** small
**Prototype.** none
**Touches a settled decision?** no
