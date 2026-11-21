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

## Round 2 ranking   (2026-11-21)

Sources: the military hunter (4x90 days, seeds 2007/3016/4025/5034, `--invariants --stats --provoke 3`, the order fuzz, probes m1-m21 and
scan.js), the economy hunter (4x100 days, seeds 2500-2503, same options), the player hunter (USA on desktop; Israel and Vietnam on a phone
at CPU 4x), the verifier's rejected list, and the advisor's read-only probes (scratchpad `autotest/round2/adv/`: port.js, port2.js,
port3.js, bk.js; they patch the rules in memory only). Each idea was checked against docs/DECISIONS.md and the last section of LATER.md; an
option that would change a settled decision is marked **PROPOSAL** with its id. Nothing here copies Conflict of Nations.

| Rank | Idea | Area | Effort | Settled decision touched by the recommendation? |
|---|---|---|---|---|
| 1 | IMP-14 A docked warship holds a port forever: land armies cannot take it, and neither side is hurt | combat / naval / capture | small-medium | no (reads CMB-6's "defenders" as ground defenders, as MOV-4 puts ships on the water); owner question Q15 — **prototype `idea/port-sortie`** |
| 2 | IMP-15 An empty treasury has no consequence: upkeep goes unpaid for good | economy rules | small | no settled decision exists; a new rule for the owner (Q21) |
| 3 | IMP-16 Small nations' surplus goods have no outlet; the order book cannot be fixed from the buyer side (IMP-2 follow-up) | AI economy / market | small | no for 1-2 (ECO-9 fits); option 3 is ECO-9 (Q4) |
| 4 | IMP-17 Opening Diplomacy takes about 1.5 s on an older phone, and drawing it writes rule state | performance / UI-1 | small | no |
| 5 | IMP-18 Small nations have little to do on days 1-2 while money piles up | pacing / onboarding | small (text) | options 2 and 3 are PROPOSALS (NAT-5, RES-2 calendar) |
| 6 | IMP-19 The march ETA is late by up to 4 h on long land routes | movement / UI accuracy | small | no (display only) |
| 7 | IMP-20 Harness: invariants for this round's military states, `--fuzz`, and the two noisy kinds | tools | small | no (JOB-6: extends headless.js) |
| 8 | IMP-13 (g)-(j) four more text items | UI text | small | no |

Why IMP-14 is the one to prototype: it is the only idea this round where a player's order produces a state that never resolves (a "stuck"
army and a "battle" that does nothing), it happens in AI games too, the fix is small and local (three places in the rules, no randomness, no
save fields), it is measurable before and after, and it touches no settled decision or hands-off area. IMP-15 needs the owner to pick the rule
first; IMP-16 option 1 measured weak (see there); IMP-17 is a good round-3 candidate (small, page plus a pure rules memo).

## IMP-14. A docked warship holds a port forever: land armies cannot take it, and neither side is hurt   (round 2; area: combat / naval / capture)

**Problem.** A player marches an army into an enemy port where one frigate is docked. The army stops at the edge of the province, a battle
starts, nobody takes damage, the battle fizzles out and the army stands there for good. The port never falls. AI wars have the same hole.
**Evidence.**
- Military hunter (MR2-02, rejected as a bug because it is a design reading): `m14b.js`, seed 2007, Tromsø: 1 frigate against 12 infantry,
  4 tanks and 2 artillery, after 600 h the port is still Norway's; battle in the province for 75 of the 600 h; the frigate has 0 wounds and the
  army is untouched (morale 100). The same with 1 carrier, and with 3 infantry against 1 frigate (65 battle hours).
- Cause: `canProceed` (rules/movement.js:481) stops a ground force in a province where any idle enemy force stands, ships included, so it
  never reaches the heart; and the capture step (rules/tick.js:111) refuses while any force at war with the attacker is in the province.
  Land units do x0.2-0.3 against naval targets (data.js CLASS_M) and docked ships hardly hit back, so the battle never decides it.
- `scan.js` (hunter, 2 seeds x 60 days): ports held only by docked ships while enemy ground forces stand in them 10 cases / 597 h;
  `m21.js`: 73 ports with docked fleets at day 20 since B1.3 (fleets now form in port instead of hiding in garrisons).
- Advisor `port2.js` (45 days, provoked wars): seed 2007 1 port / 20 h; seed 4025 5 ports / 410 h.
- Docked ships are drawn on the water off the city (MOV-4, RELEASES "ships never on land: a fleet in port now sits on the water off the
  city's shore"), so to a player they are not in the city.
**Options.**
1. Docked ships do not hold a port against land forces. A ships-only force no longer stops a ground force's walk to the heart, nor the capture
   step; when the port falls, every docked ships-only force of a nation not friendly with the captor sorties to the port's sea zone (no route,
   −10 morale, a dispatch to its owner). Ground defenders still hold the port as now, and a fleet with troops aboard (mixed) still counts.
2. Docked ships fight a land battle as soft targets (land damage multipliers as against soft units, no own-province or terrain defence), so
   the army sinks or drives them off first. Keeps "ships defend"; needs stack-duel numbers; slower and less clear to read.
3. Ships in port cannot fight land units at all and are captured or scuttled when the port falls. Harsh; loses fleets to a 3-infantry raid.
**Recommendation.** 1. It ends the deadlock, keeps the fleet alive (it is just pushed out to sea, where it can fight on or go home), matches
what the map shows (ships on the water), and is easy to explain ("a fleet cannot hold a city"). Measured in memory (`adv/port.js`, `port2.js`):
the four Tromsø cases go from "held after 300 h" to "taken after 22-34 h" (the march time), the fleet ends in Norwegian Sea IV at morale 90;
all-AI 45 days, ports held by docked ships while nation armies wait: seed 2007 20 h → 0, seed 4025 410 h → 372 h, and **all 372 remaining
hours are rebels (owner −1) under the old partisan rule** (Dublin, Ahvaz), which this option leaves alone (REB-2: the rebels branch
replaces that rule). No ship on land in either game; captures 938 → 1,015 (seed 2007) and 966 → 970 (4025); ships-only fleets at sea per
daily sample 28.3 → 28.9 and 40.2 → 38.6.
**Effort.** small-medium
**Prototype.** **`idea/port-sortie` @ d7a2ea0** (round 2; one commit on master cb1730a, never merged; there is no separate `dev` branch,
master is the Dev Build's source). What it does: `canProceed` lets a ground force walk past an idle ships-only enemy force on land; the
capture step counts only forces that are not ships-only; a new `sortieFleets(p, O)` in combat.js `capture()` moves every docked ships-only
force of a nation not friendly with the captor to the port's sea zone (route cleared, −10 morale, `SORTIE_M` in data.js, dispatch "Your
fleet sailed out of <port> as it fell to <captor>."; no sea zone → nearest own port; none → lost with a dispatch). No `rng()`, no new save
fields, golden unchanged. Page text only: the move preview says "Only ships in port: they cannot hold it…", Send reads "Send force here", no
"Likely defeat" toast, the route chip reads Favourable. Checker `node tools/port-sortie.js` (6 cases at Tromsø, seed 2007).
- **Try it:** start as Russia, declare war on Norway, park a frigate (or carrier) in Tromsø with the dev spawn, march on it from Muonio
  (Finnish on this map: take it or use Finland's border). The port falls when the army reaches the city (about 22 h) and the fleet appears in
  Norwegian Sea IV at −10 morale. Play Norway to see the dispatch.
- **Measured on the branch (real code, against master):** the four docked-fleet cases (1 frigate v 3 inf; 1 frigate or 1 carrier v 12 inf,
  4 tanks, 2 art; 2 frigates v 2 inf, 1 tank) go from "still held after 300 h" to taken in 22-34 h, fleet at sea at morale 90, no ship on
  land. Ground defenders still hold: a frigate with or beside 1 infantry holds 50-52 h against the big army, until the infantry is beaten
  (master: never taken, 400 h); 3 infantry against frigate + infantry lose and fall back. All-AI 45 days (port2.js): ports held only by
  docked ships while a nation's army waits: seed 4025 43 h → 0; seed 2007 0 → 0 (130 h at Dublin by rebels on both); seed 3016 1 h → 1 h
  (the arrival hour). `headless.js --games 3 --days 60 --invariants --stats --provoke 3 --check`: 127 → 105 violations, same 6 kinds, no new
  kind; captures 4,301 → 4,376 (+1.7%); deterministic. All standard checks equal to master (lint, golden same, selftest, scenarios 37/41,
  stack-duel, nations-balance, eco-check known FAIL only); old saves (v3.12, v3.11, round-2 economy saves, a master save of the Tromsø
  standoff) load and play 10 days.
- **What to watch:** the AI's attack planning still counts docked fleets in odds(), so the AI may still avoid ports with a big fleet; fleets
  pushed out may meet enemy fleets at sea; a fleet sailing into a port as it falls is not handled here; rebels still held off by docked ships
  (old partisan rule, for the rebels branch). The capture step and canProceed are also changed on auto-test/fixes, so merging both later
  may need a small manual merge.
**Touches a settled decision?** no. CMB-6 ("captured the hour a ground force reaches its heart with no defenders; one ground unit is
enough; air never captures") is read as "no ground defenders", the reading MOV-4 supports (ships never on land; fleets dock on the water).
The verifier noted it can be read either way, so it is also Q15; nothing merges without the owner.

## IMP-15. An empty treasury has no consequence: upkeep goes unpaid for good   (round 2; area: economy rules)

**Problem.** When money runs out the game says "Treasury empty: upkeep is unpaid." and nothing follows. A person can over-build an army it
cannot pay for and keep it at full strength; an AI does the same for months.
**Evidence.**
- Economy hunter (ECO-R2-I1): at the daily step a negative balance is set to 0 and marked short (tick.js:260); `shortFx` (combat.js:78-82)
  and the AI weights (ai.js:212-215) read only oil, iron and electronics shortages, nothing reads `short.cash`.
- Thailand (seed 2503) at $0 from day 39 to day 100 with net money −$23M to −$54M a day: about $2B of unpaid upkeep, 15 units at full
  strength. 4x100: 292 nation-days broke (cash under $10M, net below 0), 1.1%.
- No settled decision covers it (ECONOMY, QUEUE, LATER, DECISIONS: nothing). The oil, iron and electronics shortages already have teeth
  (SHORT_MSG), so money is the odd one out.
**Options.**
1. Unpaid upkeep costs morale: every force of a nation whose money is short loses 5 morale a day (floor 30) until upkeep is paid again;
   the dispatch says so. Fits the existing shortage pattern; the AI's disband logic (2) can follow.
2. Disband the dearest units until upkeep fits income (a dispatch names them). Clear but harsh; a person can lose a carrier overnight.
3. Debt: money may go negative; no new builds, units or research while below 0; repaid from income first. Honest, but a medium change
   to the UI (red treasury, refusals with reasons) and to the AI.
**Recommendation.** 1 (small, rules only, no randomness), plus an AI rule: a nation short of money for 3 days disbands its weakest
non-garrison unit each day. The owner picks the rule (Q21).
**Effort.** small (1), medium (3)
**Prototype.** none (needs the owner's choice first)
**Touches a settled decision?** no settled decision exists; any option is a new rule (Q21).

## IMP-16. Small nations' surplus goods have no outlet; the order book cannot be fixed from the buyer side   (round 2; area: AI economy / market; follows IMP-2)

**Problem.** Small AI nations go broke while their goods sit unsold. IMP-2 blamed the buyers' thresholds; the round-2 numbers show the
buyers have no money to spend, and the sellers' one outlet (the metal hoard sale) is out of reach for any nation under 40 provinces.
**Evidence.**
- Economy hunter (ECO-R2-I2): `ai.js:509` flags a hoard only above 1,000K metal, but the storage cap is 400K + 15K a province (ECO-14), so
  no nation under 40 provinces can reach it: 69.2% of nation-days (17,966 of 25,973) in 4x100. 311 of the 318 broke-with-goods
  nation-days (cash under $20M, net below 0, over $2B of goods) are nations under 40 provinces. Thailand (seed 2503, cap 745K), days
  36-52: cash $0-9M, metal 170-400K, the normal cash-poor sale needs a price of 0.8x base and the world price sat at $1.78-1.91 (0.74-0.80x)
  every day; its book listings (metal, iron, rare) sat unsold.
- Advisor `bk.js` (60 days, provoked wars): broke-with-goods nation-days from day 20: seed 2503 72 of 2,678 (2.69%), seed 2501 3 of 2,657.
- **IMP-2 option 1 does not work as written.** Patched in memory (an AI also fills a listing at or below the world price for stock, up to
  45% of its cap, if it keeps $250M plus 5 days of upkeep): 0 purchases in 60 days on both seeds, the same games to the last hash. At the
  moment of a fill, 0 of 21,998 candidate checks had that much cash (seed 2503, 30 days); median AI treasury $120-154M. Matches the hunter's
  "no unit in training 55% of hours, 0% with more than $300M": the AI spends what it has, so nobody has money to buy goods with.
- Option 1 below, patched in memory: seed 2503 72 → 44 (−39%), seed 2501 3 → 3; but the world metal price at day 60 falls 0.80 → 0.53x
  base (2501: 0.78 → 0.54), the price flattening ECO-9 was written to stop. With a 0.7x floor on the hoard sale (option 1b): 72 → 55 (−24%),
  2501 3 → 5, metal 0.68-0.70x; poorest tenth of treasuries $43M → $44M and $36M → $81M.
**Options.**
1. Scale the hoard line to the cap: a hoard is metal over min(1,000K, 0.8 x cap), sold down to min(650K, 0.55 x cap); keep the sale's price
   floor at 0.7x base (1b) so small hoards do not crash metal. Inside ECO-9's own words ("a cash-poor power's materials hoard is sold").
2. The AI keeps a small cash reserve (e.g. 3 days of upkeep) before training or building, so book buyers exist at all; then IMP-2 option 1
   has money to act on. Changes AI spending everywhere; measure war strength with nations-balance first.
3. **PROPOSAL (ECO-9):** a cash-poor AI may sell any good above about 60% of its cap on the world market (Q4).
**Recommendation.** 1b now (small, AI only, measured −24% broke-with-goods on the bad seed at a bearable metal price), then decide 3 with
the owner (Q4, now with the evidence that the buyer side is empty). Drop IMP-2 option 1 unless 2 is done first.
**Effort.** small (1b), small-medium (2)
**Prototype.** none this round
**Touches a settled decision?** 1 and 2 no (ECO-9 fits 1; keep ECO-9's price rationale in mind); 3 is ECO-9.

## IMP-17. Opening Diplomacy takes about 1.5 s on an older phone, and drawing it writes rule state   (round 2; area: performance, index.html diploHTML and rules/diplomacy.js)

**Problem.** Every tap on the Diplomacy tab freezes an older phone for 1.5 s. Opening the screen also registers coalitions and can send a
"form the …" dispatch, so a page that only reads changes the game state.
**Evidence.**
- Player hunter (P2-05): phone 440 px at 2x, CPU 4x, Israel day 2: tap → modal 1,564 / 1,548 / 1,643 ms (Market 732, Cities 569). CDP
  profile: diploHTML 1,366 ms, of it blocs() 580, acceptOffer 462, blocOf 465, sameBloc 294, opinionParts 291, score 224. diploHTML calls
  acceptOffer() 3-4 times per nation for 67 nations, and sameBloc()/blocOf() call blocs() afresh each time; blocs() rebuilds every
  coalition and sorts members by score().
- rules/diplomacy.js:197-207: blocs() writes `S.blocReg` (new ids, names, members, leader) and calls `tell()` when a coalition is new. UI-1
  says the page only reads; a player who opens Diplomacy gets the dispatch and the registry at a different hour than one who does not.
**Options.**
1. Page: compute blocs() once per render and pass it to the row builders.
2. Rules: split blocs() into a pure read (memo keyed on `S.hour` and the relation version that `relChanged()` bumps) and the registration
   (`blocSync`, called only from the rules' own hourly/daily steps). No randomness involved; the golden must stay the same.
3. Build the rows lazily (neighbours and partners first, "Others" on scroll).
**Recommendation.** 2 + 1 (small). Measure with the player hunter's driver (target: under 0.5 s on the throttled phone) and split-golden.
**Effort.** small
**Prototype.** none (round-3 candidate)
**Touches a settled decision?** no (helps PRF-5 and UI-1). The state write from the page may count as a UI-1 bug on its own: logged as
B2.25 in docs/ROUND_LOG.md round 2 for round 3 to verify.

## IMP-18. Small nations have little to do on days 1-2 while money piles up   (round 2; area: pacing / onboarding)

**Problem.** A new player as a small nation builds one Army Base and then waits: no unit until it is done, few research steps open, and the
first capture takes a day. Money piles up, and the first nudge comes at war.
**Evidence.** Player hunter (P2-13): Israel, Army Base I 24 h before any recruit (NAT-5, BLD-2); 12 research steps open on day 1, most on day 3;
first independent capture (5 units against 2, no losses) took a 22 h battle plus 3 h march; cash $214M → $592M by h52 with $39M spent.
USA: $275M unspent at h48 when the game nudged "At war with $275M unspent and 13 idle cities". Economy hunt: nothing under construction 71%
of hours (AI), a research slot empty 23%.
**Options.**
1. First Steps (text only): on day 1 suggest a second Army Base in another city, two research steps, and an Arms Industry in the money city,
   with the money each costs ("you can afford all three").
2. **PROPOSAL (NAT-5):** the capital starts with Army Base I.
3. **PROPOSAL (RES-2 calendar / docs/RESEARCH.md days):** more day-1 steps.
**Recommendation.** 1 (small, page only); 2 and 3 for the owner.
**Effort.** small
**Prototype.** none
**Touches a settled decision?** 1 no; 2 NAT-5; 3 the research calendar (RES-2).

## IMP-19. The march ETA is late by up to 4 h on long land routes   (round 2; area: movement / UI accuracy)

**Problem.** "Arrives in 99 h" arrives in 103 h; on a timed attack from two sides the second force comes late.
**Evidence.** Military hunter (IMP-R2-2): `m11.js` seed 3016, 60 overland marches in own land (median 8 legs, ETA median 33 h): late by a
median 1 h, at most 4 h (Brazil → São José dos Campos, 13 legs, 99 vs 103); 18% late by more than 1 h. Sea routes (`m9.js`, seed 2007, 40):
6 late by 2 h (Mataram → Palembang 90 vs 92). Cause: tick.js carries the rest of the hour only for rail and sea legs (`a.carry`); etaHours
(movement.js:481) adds continuous time.
**Options.** (a) carry the rest of the hour on every leg (marches get faster; golden changes); (b) etaHours counts whole-hour leg starts as
movement does (display only); (c) show "about N h".
**Recommendation.** (b).
**Effort.** small
**Prototype.** none
**Touches a settled decision?** no (MOV-2 "movement runs once a game hour" kept).

## IMP-20. Harness: invariants for this round's military states, `--fuzz`, and the two noisy kinds   (round 2; area: tools/headless.js)

**Problem.** Plain AI games caught none of MR2-01/02/04/05; they were found by scripts. Two reported kinds are noise.
**Evidence.** Military hunter (IMP-R2-3): scan.js found 6 fleet legs land-to-land, 10 ports held by docked ships, 1 fleet docked in an enemy
port in AI games the watcher passed. The fuzz found MR2-04 and B1.17 again. Verifier: war-with-fallen-nation has no effect on play (a fallen
nation is filtered by warsOf and never revives); save-load S.bt is a deliberate reset on load (battles restart). Economy: of the 26 wars older
than 50 days, 25 involve a fallen nation (the noise inflates war-length stats).
**Options.**
1. Add to `--invariants` (default output unchanged): fleet on a land-to-land leg; a wing idle away from its base; a fleet docked in a port of
   a nation at war with it; a port held only by docked ships while enemy ground forces stand idle there over 24 h; a ground force that came
   from the sea onto land without a landing stamp; no stuck-force clock during a battle (MIL-R1-T1). Make the fuzz `headless.js --fuzz N`
   with its own dice (MIL-R1-T2). Drop war-with-fallen-nation (or clear relations in checkNation) and whitelist S.bt in the save check.
   Leave fallen nations out of the war-length stats.
2. Only the two noise fixes.
**Done in round 2 (auto-test/fixes):** the fleet-on-a-land-to-land-leg check (`ship-on-land-leg`, a9e2226, with a selftest mutant);
MIL-R1-T1, no stuck-force clock during a battle (da4f05f); force-in-closed-land only for an idle force after more than 6 h (d0c02b2).
**Recommendation.** 1 for the rest (wing idle away from base, fleet docked in an enemy port, port held only by docked ships, sea-to-land
without a landing stamp, `--fuzz`, the two noise kinds), in the fixer's tool step of round 3.
**Effort.** small
**Prototype.** none (tools)
**Touches a settled decision?** no (JOB-6).

## IMP-13 additions (round 2): (g)-(j)

- (g) The battle report header "BATTLE REPORT · DAY 1, 22 HOURS" reads like a time of day (index.html:4946); write "Began day 1 · lasted
  22 h" (P2-07).
- (h) Touch hints still name keys: "Press Move (M), then tap … or press Esc" (index.html:9825), "open Production (P) to queue defenders"
  (tick.js:267 dispatch), (R)/(D) in tooltips. Use a touch wording when `matchMedia('(pointer:coarse)')` (page) and a key-free dispatch text
  (rules: "open Production"). Extends (a) (P2-08).
- (i) Market: a 10K offer shows both "Buy 10K" and "Buy all · $21M", the same order (index.html:4598); hide "Buy all" when the offer is not
  bigger than one buy step (P2-09).
- (j) orderDrop during a landing silently replaces the landing route; refuse with a reason ("Landing: wait 30 min") (MR2-07, rejected as a
  bug: no broken state).

## Evidence added to earlier ideas (round 2)

- **IMP-2:** option 1 measured with no effect (0 purchases in 60 days, 2 seeds; no AI ever had the spare cash): see IMP-16, which replaces
  its recommendation. 4x100: 318 broke-with-goods nation-days (1.2%), 311 in nations under 40 provinces.
- **IMP-3:** fleets now sail (B1.3): 28-40 ships-only fleets at sea per daily sample (adv `port2.js`, 45 days) against about 4 ships at sea in
  round 1. Naval fire is still nearly harmless: frigates 8,986 volleys for 34 damage, submarines 1,942 for 18, cruisers 101 for 0 (military
  4x90). Option 2 (AI fleet jobs) is next; IMP-14 removes one reason fleets idle in port (they hold it).
- **IMP-6:** renderSide 5.4% of an 8x-clock profile on the throttled phone, and 1,131 ms in the window of one Diplomacy open (P2-05, P2-11).
- **IMP-7:** interceptors 487 built, 0 kills credited (military 4x90); the dogfight credit in the harness is still missing (IMP-20).
- **IMP-8:** infantry 73.0% (4x90) and 72.3% (4x100); never built in either: mlrs, carr, heli, para, stealth; cruise missiles 1 and 5 built,
  0 fired.
- **IMP-9:** a research slot empty a median 23% of hours (4x100). AI idleness overall is cash-bound: "no unit in training" 55% of hours, 0%
  when the nation holds over $300M (IMP-16).
- **IMP-11:** artillery 20,470 volleys for 687 damage (0.034 a volley), military 4x90.
- **IMP-12:** the round-1 recommendation was "re-check at day 90+ in long wars". Manpower at the cap rises with game length: 65.5% of
  nation-days (90 days) and 69.0% (100 days), against 53.6% at 60 days, with 100-112 wars per run. It does not bind in long wars either;
  still the owner's call (Q7).

