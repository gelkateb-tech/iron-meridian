# Combat timing today, and the hourly-round proposal (2026-11-27; proposal only, waiting for the owner)

COMBAT TIMING TODAY, AND A PROPOSAL (read-only; nothing in any checkout was changed)

Summary: today's combat ALREADY lands damage on a fixed tick, once every 15 game minutes (4 battle rounds an hour). It is not continuous and not per frame. So the REAL-TICK display variant applies: the countdown and the damage popups should follow the existing 15-minute round. An hourly round like CoN's would be a rules change, proposed in section 3 and not built.

Measurements below were run on a scratch copy only. Files are in /tmp/claude-0/-home-user-iron-meridian/7fd07611-91e4-5b00-ba43-06c622a65904/scratchpad/combat-display/ (today-pace.txt, hourly-pace.txt, today-duel.txt, hourly-duel.txt; the hourly copy of the game is in .../combat-display/hourly/).

====================================================================
1. FOR THE OWNER, IN PLAIN ENGLISH: HOW COMBAT TIMING WORKS NOW
====================================================================
- The game clock runs in quarter hours. At normal speed (1x), one game hour takes 15 real seconds, so a quarter hour takes about 4 seconds.
- A battle starts when enemy armies at war stand in the same province or sea zone. Armies arrive on the hour, so most battles start on the hour. A war declared in the middle of an hour can start one on the next quarter.
- From then on, both sides hit each other every 15 game minutes (:15, :30, :45 and :00). Each hit is a quarter of an hour's damage, and the hour's damage is set to half of the old pace (BATTLE_PACE 0.5). So damage already arrives in fixed rounds, four an hour, not smoothly.
  - At 1x that is a round every 3.75 real seconds.
  - At 2x every 1.9 s, at 4x every 0.9 s, at 8x every half second.
- Artillery, rocket artillery and warships firing from range also hit every 15 minutes. But the damage numbers you see for them are added up and shown once an hour.
- Air strikes and missiles are not part of these rounds. They land once, on the hour, when the aircraft or missile arrives.
- There are no sieges with a timer. A city is taken the moment ground troops reach its centre with no defenders left; that check runs every hour. A bunker only makes the garrison take less damage and break later.
- Morale falls a little every round, and faster when the army loses health. Whether an army breaks and retreats is checked once an hour, right after the hour's round. A broken army walks away at the next hour. Until then it still takes the three quarter-hour rounds in between.
- What you see today:
  - In the army panel: crossed swords and a countdown to the next round, plus "No healing while it fights" and "In battle at X". The enemy is not named.
  - On the map: the counter gets a red pulsing edge and a small crossed-swords badge. There is no countdown and no name on the map.
  - After every round, a red "-N" floats over each side's counter for about 1.3 seconds.

====================================================================
2. HOW IT WORKS, WITH FILE:LINE (master 36f622a)
====================================================================
Game clock
- rules/tick.js:208-224, tickQ. S.q counts the quarter steps already run in the hour (0-3, saved in the save file; old saves without it restore to 0, rules/state.js:276). Three steps fight only (consQuarter, then rangedStep(false), then battleStep(false), line 211). The fourth runs the whole hour (tickHour, lines 9-126), which also increments S.hour.
- Page loop, index.html:13779-13784: acc adds dt*HOURS_PER_SEC[speed] and runs a step each time it crosses (S.q+1)/4. HOURS_PER_SEC = [0, 1/15, 2/15, 4/15, 8/15] (index.html:3518), so 1x is one game hour per 15 real seconds.
- tickQSlice can spread the hour over several frames (tick.js:212-223). The steps and their order are the same either way.
- Hourly work: production, construction, research, air, missiles (tick.js:13-27), movement (29-76), meetHour (77), ranged fire (92), supply every 6 h (95), the hour's battle step (97), upkeep and retreat (98), capture (100-118), daily work at S.hour%24 (120), and the AI every 4 h per nation (123).
- Construction under one hour advances every quarter (rules/production.js:144, consQuarter).

When battles start
- battleStep, tick.js:228-290, rebuilds S.battles at every step. A province is a battle when standing forces (a.to === null, not air, not in flight; index() at rules/combat.js:200) of at least two owners at war are there (tick.js:233-241).
- Arrivals happen only in the hourly movement step (tick.js:71-74) and meetHour (columns that meet on the road stop and fight, tick.js:127-207). So the first round lands at the :00 step of the arrival hour. Later rounds come at :15, :30 and :45 (tick.js:211).
- A war declared mid-hour can start a battle on a quarter step. A force on a leg is not in the province it left (index() skips a.to !== null).

How damage is applied
- Per step and per side: r0 = K*BATTLE_DMG*(0.8 + rng()*0.4) (tick.js:250), with BATTLE_Q = 4, BATTLE_PACE = 0.5 and BATTLE_DMG = 0.5/4 (rules/combat.js:48-51).
- Other factors: frontage and flanks (combat.js:3-15, tick.js:251-252), morale (moraleF, movement.js:533), stack efficiency, terrain, river, season, commanders.
- Damage is split among enemy sides by their health share (tick.js:261-263). It is reduced by home soil x1/1.25, bunker, doctrine, terrain and field hospitals (tick.js:265-268), dug in (digF, combat.js:212-215), and changed for troops at sea (x1.5, or x0.75 escorted).
- hurt() (combat.js:384-391) adds wounds; a unit dies when its wounds reach its health.
- The battle record S.bt[p] holds h0 and per-side peak, lost, dirs and n, plus an hp history with one point per hour (tick.js:247, 254, 273). It ends in endBattle and battleReport (combat.js:260-280).
- S.bt is reset on load (state.js:276).
- The damage for one round is available per force: a._h is set at the start of the step (tick.js:230), so a._h - effHP(a) is what that force took.

Ranged fire
- rangedStep (combat.js:325-357) runs every step: once in the hour after movement (tick.js:92) and once before each quarter battle step (tick.js:211).
- Damage per step is n*atk*K*RANGED_F/BATTLE_Q*... (combat.js:343). BATTLE_PACE does not apply (comment at combat.js:283).
- A shooter fires only when it is standing, not in a battle in its own province, and not on hold (combat.js:333). It needs sight of the target.
- Shells are drawn every step (fxRanged, combat.js:353). The damage numbers are summed in RANGED_SHOWN and emitted only on the hourly step (combat.js:320 and 356; UI at index.html:13949-13950).

Air strikes and missiles
- airTick is hourly (tick.js:23, air.js:259-293). A strike resolves once when the outbound flight completes (air.js:270-277, resolveStrike at 209). Enemy fighters over the target intercept first (air.js:214-215). The wing then loiters 1 h, flies home and rearms (cd 6, air.js:290).
- Air wings never take part in province battles, because index() excludes a.air.
- missileTick is hourly (tick.js:24, air.js:327-330); the impact comes on the hour.

Sieges
- There is no siege clock. Capture happens at once in the hourly capture step when ground troops (at least CAP_MIN) stand at the heart with no enemy there (tick.js:100-118). The old occupation clock S.cap is emptied.
- A bunker cuts the garrison's damage and raises its morale (moraleEff, combat.js:212-245) and repairs every hour (bunkerHour, tick.js:26).
- The "Siegemaster" commander only speeds up embarking and landing (combat.js:165, movement.js:443).

Morale and retreat timing
- Each step, every force in the fight loses 1/BATTLE_Q morale plus 40 x the share of health it lost that step (tick.js:275-276). That is 1 a game hour plus the losses.
- The break check is hourly, in armyUpkeep (movement.js:537-563), called right after the hour's battle step (tick.js:98). A force breaks below 25 morale, or below 15 in its own city; bunker morale counts (moraleEff). It then gets a route to the nearest supplied own province within 6 steps, or it surrenders if it is unsupplied, below 10 morale and has under half the enemy's health.
- A broken force leaves in the next hour's movement step, so it still takes the three quarter rounds in between.
- The Retreat stance is checked every 2 h (tick.js:90; stanceHour at combat.js:415-421), when strength is under 40%.
- No healing while fighting (healInfo, combat.js:57-58; movement.js:540). Out of battle: +2 morale an hour, +10 the hour after a battle ends. The retreating flag clears at 40.

What the UI shows today during a fight
- Army bar, armyBarHTML (index.html:12602-12622):
  - Stats row: a "fight" cell with the map's crossed swords and the countdown to the next 15-minute step (abTickText at 12582-12585, refreshed every 180 ms by abTickPatch at 13785; tooltip "both sides deal damage every 15 game minutes", 12607).
  - "No healing while it fights" (abHeal, 12589-12590).
  - Status line "In battle at X" (statusText, 12441, shown in armyHTML at 12658ff); "in battle" in the lists.
  - No enemy is named.
  - The foreign read-only bar (foeHTML, 12627) is the same.
- Province panel (12827-12828): "Battle in progress · N h · front N", then per side flag, units, engaged, directions and lost. A side you have not identified shows as "? Unidentified army".
- Map, badgeDraw (index.html:9050-9064): red breathing edge and the crossed-bars battleBadge to the right of the plate. There is no name label on the map (counters carry flag, icon and count only) and no countdown.
- Damage, fxBattle handler (index.html:14000-14005): at every 15-minute step, each visible side gets a "-N" by its counter (drawFX at 5405-5415, 1.3 s; numbers merge within 1 s at high speed, 5395). Blasts are spread over the hour, and hit forces flash.
- Air strike damage shows through STRIKEQ; missile "-N" over the blast (13973).
- Stale text: the tutorial at index.html:11861 says "Battles are fought hour by hour".

====================================================================
3. PROPOSAL: A CoN-STYLE FIXED HOURLY ROUND (not to be built this round)
====================================================================
Note first: the 15-minute steps (decision CMB-1, docs/DECISIONS.md:156; ".test/battle-tick.js: owner request 4") were an earlier request, so hourly rounds would reverse them. The owner should confirm. The alternative is to keep the 15-minute round and only make it readable (the display plan below works for either).

What changes (rules only, small)
- Keep BATTLE_Q = 4 as the quarter-hour CLOCK. Construction under an hour, acc, S.q, the UI and LAND_MIN keep working, and old saves need no clamping.
- Add a separate round rate, e.g. BATTLE_ROUNDS = 1:
  - battleStep runs only in the hour's own step (tick.js:97). The quarter steps stop calling battleStep(false) and rangedStep(false) (tick.js:211).
  - Per-round damage = BATTLE_PACE: the same damage per hour, in one hit.
  - Ranged fire also once an hour: K*RANGED_F per round instead of /BATTLE_Q (combat.js:343), so all damage lands at :00, together with air strikes and missiles, which already land on the hour.
  - Morale: -1 per round plus 40 x the share lost.
- Order within the hour stays: movement -> ranged -> battle -> upkeep/retreat -> capture.
- Important side effect: a force that breaks now leaves before the next round. Today it eats about 0.75 h of extra damage while it waits. Retreats get cheaper.

Balance, measured on a scratch copy with the closest proxy (BATTLE_Q = 1, which also coarsens the clock to whole hours)
- Stack duel (tools/stack-duel.js): all 11 required cases still pass. Hours change by 0 to 2 (for example 58 -> 57, 70 -> 69, 41 -> 39), and losses by at most 2 units a side. The split-stack rule is unaffected.
- Combat pace (tools/combat-pace.js): battle lengths within about ±1 h in every case (3:1 attack on 10 units on plains: 13.25 -> 14 h; 100 vs 100 on plains: 48.25 -> 49 h).
- One visible difference: even 1:1 meeting battles in the open, which today end "none" (both sides break together), end "defender" (the attacker breaks first by a hair). The cause was not investigated.
- "First loss" times now land only on whole hours.
- Per-round variance roughly doubles (one ±20% roll an hour instead of four averaged), so single rounds swing more. Totals are the same.

Same-seed golden
- It changes for certain. rng() is called per side per step (tick.js:250) and per ranged unit type per step (combat.js:343), so the dice sequence shifts at the first battle of the 10-day run.
- tools/golden-12345.txt must be re-recorded with the owner's OK. start-armies, build-reqs and missiles each re-record it too, so do the round change after those merge and record once.
- Also to update:
  - .test/battle-tick.js ("both sides lose health at every 15 minute step")
  - tools/combat-pace.js (its quarters column)
  - docs/COMBAT.md:170, docs/COMBAT-PACE.md, DECISIONS CMB-1 and UNI-6, RELEASES
  - UI texts "every 15 game minutes" (index.html:12607) and "every 15 minutes" (bombard line, ~12664)

Old saves
- No format change. S.q is still the quarter clock, and S.bt is reset on load anyway (state.js:276). A save made mid-hour resumes, and its next round is at the coming :00.
- Do not set BATTLE_Q itself to 1. That would need S.q clamped in restore (state.js:276) and would break consQuarter timings.

AI
- No AI code reads S.q or BATTLE_* (grep of rules/ai.js). The AI plans from odds()/oddsParts, which do not depend on the pace, every 4 h, and reads S.battles, which the hourly step still sets.
- The AI breaks and retreats through the same armyUpkeep, so it gets the same cheaper-retreat effect.
- No AI change is needed.

====================================================================
4. DISPLAY PLAN FOR THE FOUR BULLETS
====================================================================
Variant: REAL TICK. The countdown targets the next 15-minute step: abTickText's formula, ((S.q+1)/4 - acc), shown in real seconds while running and game minutes while paused. The popups fire on each fxBattle, which is each step. If the owner later approves hourly rounds, only the period and the trigger change (one constant).

Readability concern: at 4x and 8x a round comes every 0.9 s or 0.5 s. Show digits at 1x/2x. At 4x/8x show "now" or a small progress ring on the swords badge instead of flickering digits, and let the existing 1-second merge in fx('dmg') sum the popups.

(a) "Fighting" plus the enemy
- Panel:
  - A new fight row in the army bar, placed in the ab-sub or ab-top area (index.html:12609) or built on the `sw` line (12607): "⚔ Fighting 2nd Armoured Division (Germany) +1 · next round 3 s".
  - statusText (12441): "Fighting <enemy> at X"; short form "fighting".
  - The same row in foeHTML (12627) for a visible foreign force.
- Map: a small dark pill drawn under the counter plate, next to the battle badge at 9064: "⚔ 3 s · vs 2nd Armoured +1".
  - Draw it outside the cached badge body (UCC), because its text changes about once a second.
  - Zoomed out on a cluster: one pill per side of a battle.
  - Declutter: full text only for the player's and allies' battles and for the selected force; other visible battles get only the countdown ring.
- Who the enemy is: no pairing exists in the rules (damage is split by health share, tick.js:261-263). So "the enemy" means every hostile standing force at war in the same province (stationaryAt(a.at) filtered by atWar). Name the biggest by power and add "+N" for the rest. Rebels show as "Rebels" (armyLabel, state.js:387). With several enemy nations, the biggest one's flag plus "+N".

(b) Countdown in panel and map
- Reuse .ab-tick and abTickPatch (refreshed every 180 ms) in the panel.
- On the map, compute the same value per frame. Paused: "12 min".
- Phone at 440 px: the pill is at most about 110 px wide, 10-11 px font, tabular digits, enemy name cut with an ellipsis (about 14 characters). The panel row wraps to two short lines ("⚔ Fighting · next round 3 s" / "vs 2nd Armoured Div. +1").

(c) Damage each side took after each round
- Already partly there: the per-side "-N" at CLPOS in fxBattle (14000-14001).
- Add a UI-only map (not saved) of last-round damage per force (a._h - effHP(a) at fxBattle), with side totals.
- Panel: "Last round: this force -12 · enemy -9", kept until the next round. The province panel's battle block can add the same line for each side.
- Make the map popups a little longer and clearly paired: one number per side, side colours as today.

(d) Fog rules
- Enemy names only through knowA(b) and armyLabel(b, PLAYER). Otherwise "? Unidentified", never the name, units or count. Note: foeLabel (index.html:6571) returns "an unidentified army" in sentence form, so a "? Unidentified" form is needed.
- A battle the player or an ally is in identifies the enemy (fightsMe and armyKnown, rules/vision.js:161-173; P3-01), so those name it.
- A battle between foreign nations that the player only sees: unidentified sides stay "?".
- An unidentified '?' plate (unkPlate) gets no fight pill with details.
- A battle the player cannot see shows nothing (same check as 12827).

(e) Ranged attackers
- They are not "Fighting" unless their own province is a battle.
- Shooter panel: "Bombarding <target> · next salvo 3 s" (it fires every step).
- Target panel (the player's force under fire, not in battle): "Under fire from <shooter>", with the shooter named only if knowA(shooter), else "? Unidentified artillery". The rules need only the shooter to see the target, not the other way round.
- Ranged numbers are hourly sums today (combat.js:320/356). To match "after each round", emit them every step: a one-line, emission-only change in rules/combat.js that affects no saved state, so the golden should stay the same (verify it). Or leave them hourly and say so.

(f) Air attackers
- Strikes and missiles are one-off hits on the hour, not rounds. Keep their own popups (STRIKEQ, fxMissile) and add a line to the struck force's "Last round" panel ("air strike -N").
- Wings never carry the Fighting tag, because air is never in a province battle.

Keeping merges clean
- Leave rules/*.js alone; it is display only. pinpoint-3 edits tick.js:78-87 and combat.js:375; missiles edits tick.js.
- In index.html, avoid lines other branches change:
  - missiles: 12590 (abHeal), 12613 (the abDugHTML line), 12834, 13968-13972
  - cities-redo: 12578-12579
  - fighter-asf: 12480-12523 and draw/tap/cmdBarHTML
  - pinpoint-3: 10833 and 10922
  - build-reqs: 12786 and 12318
- Safe places: a new helper block just after statusText (around 12458), the lines 12441, 12607 and 12609, badgeDraw around 9064, the fxBattle handler at 14000-14005, and the tutorial text at 11861.