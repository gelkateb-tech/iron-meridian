# Questions for the owner (playtest session)

The session does not stop to ask (owner's request 2026-11-21): each question is logged here and the work carries on with the default
named under it. Answer in any order; the number is enough ("Q3: yes").

Format (copy the block):

```
## Q<n>. <the question, one line>   (round <r>)

**Why it matters.** One or two sentences, with the evidence.
**Options.** A ... / B ... (suggested answer in bold)
**Until you answer.** What the session does meanwhile.
```

---

<!-- Questions go below, newest last. -->

## Q1. "Embark/disembark cooldowns": is the boarding and landing time (45 minutes each) the cooldown you mean?   (setup)

**Why it matters.** Your request asks the harness to cover embark/disembark "and their cooldowns". The rules have no separate cooldown: boarding
takes 45 minutes, landing 45 minutes (never under 15 with upgrades), and a force fights its first day ashore at the landing penalty
(docs/DECISIONS.md EMB-2 to EMB-4).
**Options.** **A: yes, those times and the first-day penalty are the cooldowns; test those.** B: you want a real cooldown (for example no
re-boarding for some hours after landing): that is a new rule for you to decide, not something the session adds.
**Until you answer.** The harness checks the 45-minute times (`headless.js --scenarios`), the 15-minute floor and boarding, landing and
rearm timers that stop counting down (`--invariants`, and rule mutants in `--selftest`), and that no force boards or lands outside a naval
city (Marines aside). The first-day landing penalty is not checked yet (round 1).

## Q2. Should time at sea follow the real sailing distance instead of the centres of sea zones?   (round 1)

**Why it matters.** Short sea hops take about 2x their real length (median x2.09 on routes under 1,500 km). Berlin → Wicklow takes 11.4 days
and the troops land at morale 33-42 (IMP-1).
**Options.** **A: yes, try branch `idea/sea-legs` (a0e4982: a leg ends at the zone's border; speed unchanged)** / B: keep as is and only warn
in the route preview.
**Until you answer.** Master and auto-test/fixes are unchanged; the prototype branch shows A (it raises stuck-force reports somewhat: see
IMP-1 before any merge).

## Q3. Nations with no reachable independent land (Cuba, Japan, NZ, Mongolia, Peru, Ecuador...): a different opening?   (round 1)

**Why it matters.** 15 of 68 nations cannot make the first capture First Steps asks for; 9 cannot land anywhere near for about a week (IMP-4).
**Options.** **A: tailored First Steps text only** / B: also Marines open on day 1 for them (changes UNI-2) / C: give some cityless
independents a landing point (changes EMB-1).
**Until you answer.** Logged only; A is listed as a small page change.

## Q4. May a cash-poor or oil-short computer nation sell goods other than metal on the world market (ECO-9)?   (round 1)

**Why it matters.** Order-book listings almost never sell; nations with $6-11B of goods go broke and short of oil for up to 38 days (IMP-2).
**Options.** **A: no; first make AI buyers take cheap book listings for stock (no decision touched)** / B: yes, above about 60% of the cap.
**Until you answer.** A is recommended (round 2 prototype candidate). Nothing built.

## Q5. Should idle interceptors scramble on their own against a strike within range of their base?   (round 1)

**Why it matters.** Interceptors are on patrol about 6% of their hours; 3 of 55 strikes met a fighter (IMP-7).
**Options.** A: yes, a new rule / **B: no; the AI flies patrols better and buys interceptors only against air threats**.
**Until you answer.** B is the recommendation. Nothing built.

## Q6. Ranged fire: show it per hour (UI), or also make it hit harder (CMB-5's 28%)?   (round 1)

**Why it matters.** Artillery shows 0.03 damage a volley on screen (IMP-11), though it does well in battle.
**Options.** **A: UI summary only** / B: raise RANGED_F / C: ranged fire also lowers morale or dig-in (new rule).
**Until you answer.** A only, as a suggestion. Nothing built.

## Q7. Manpower is full most of the game: change anything (ECO-6, BLD-6)?   (round 1)

**Why it matters.** At the cap on 54-66% of nation-days; 0.80 of income used (IMP-12).
**Options.** **A: leave it; re-check in long wars** / B: lower the city manpower base or cap / C: the Recruiting Office gives training speed
instead of manpower.
**Until you answer.** A.

## Q8. A missile or air strike under way when peace is made (or its target changes hands): abort, or hit?   (round 1)

**Why it matters.** Before the fix a missile launched just before peace still wrecked a building and added war damage in a nation now at
peace, and a ballistic missile wrecked its own side's newly taken Army Base (MIL-R1-05; bombers likewise cut roads and rails at peace).
**Options.** **A: the missile self-destructs (stock lost) and the strike turns back with nothing done** / B: it hits anyway (the old
behaviour) / C: the strike turns back and the missile is refunded.
**Until you answer.** Fixed minimally on auto-test/fixes (6195531): the shot still arrives but does land damage (war damage, links,
buildings) only where the land is hostile (nobody's, or at war with the launcher) or enemy forces stand. No toast yet; A would add the abort.

## Q9. The first-day landing penalty (EMB-4): into own or friendly ports too, and should it pass to a garrison the landed troops join?   (round 1)

**Why it matters.** Troops landing in their own port fight at 67% for 24 h, the same as an assault. When landed troops join a garrison that
did not land, the penalty disappears (merge() does not carry `landed`; t11.js: gone after 3 h). Ships docking also got it (bug MIL-R1-07,
fixed in 0a325a6: only ground forces get the stamp and the −5 morale).
**Options.** **A: assault landings only (enemy or independent naval city); none into own or friendly ports; never for ships** / B: every
landing, as today, and a merge keeps the later stamp (or weights it by size).
**Until you answer.** Only the ships part is fixed. Own-port landings keep the penalty; merges still drop it.

## Q10. What should a sated AI nation's forces do when they already stand in enemy land they may not take?   (round 1)

**Why it matters.** They stood on the province's heart for days (one Sudan stack 136 h), neither taking it nor moving (MIL-R1-04, DIP-6).
**Options.** **A: they go home (nearest own province) as soon as the nation is sated** / B: they hold where they are but count as defending
/ C: a sated nation may still take the province it stands on.
**Until you answer.** A is on auto-test/fixes (5b22d3b, AI only; the sated rule itself unchanged): "standing in land it has not taken"
reports went from 26 to 1 on the same 3x60 seeds.

## Q11. Should a new ship finished in a port form its own docked fleet, or join the city's ground garrison (MOB-3)?   (round 1)

**Why it matters.** MOB-3 says new units join an idle force there within the stack limit; the code comment says "of the same kind", but ships
joined ground garrisons, hiding fleets and blocking Escort, Raid and Blockade (MIL-R1-02; about 70% of AI ships sat inside land forces).
**Options.** **A: ships join only a docked fleet (ships only), otherwise form a new fleet; ground units join only forces with no ships** /
B: the old behaviour.
**Until you answer.** A is on auto-test/fixes (3df6ae0, also keeps fleets apart when the AI packs idle stacks). The golden changes from day 9.

## Q12. A computer ground force at sea with no reachable home (its coast lost): land at a friend's port, disband, or stay at sea?   (round 1)

**Why it matters.** Syria's force 369 sat idle at sea 20+ days paying upkeep, Israel's force 388 10 days (ECO-R1-4).
**Options.** A: land at the nearest allied or passage naval city and walk home; if none, disband with a dispatch / **B: disband after 72 h
with no route (the AI's own home search already passes through friends' ports that lead home)** / C: stay at sea.
**Until you answer.** B is on auto-test/fixes (bc19049).

## Q13. Must a loaded game play on bit-exactly as the game that was not saved?   (round 1)

**Why it matters.** The save rounds wounds and `_h` to 3 decimals on purpose (compaction), so a loaded game drifts from the live one after a
quarter step (ECO-R1-10). Harmless for one player; it matters only for lockstep multiplayer or replays from saves (LATER.md).
**Options.** A: yes: save full precision (bigger saves) or round live too / **B: "close" is enough today; revisit with multiplayer**.
**Until you answer.** B. Nothing changed.

## Q14. A carrier wing in flight returns to wherever its carrier sailed: may it fly past its range to get there?   (round 1)

**Why it matters.** With the carrier fix (MIL-R1-01, 2c48619) carrier wings fly again; a flying wing's base follows the carrier's next stop,
so a carrier that sails away during a strike can leave the wing a return trip longer than its range. The harness now measures a carrier
wing's mission from where it took off.
**Options.** **A: allowed (the carrier is the base; nothing new)** / B: a carrier wing's return is limited to its range, and a wing that
cannot reach the carrier lands at the nearest own base.
**Until you answer.** A (what the fixed code does).
