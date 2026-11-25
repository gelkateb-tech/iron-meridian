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

## Q15. Should warships docked in a port count as its garrison and stop land forces from taking it?   (round 2)

**Why it matters.** Today they do, land units barely hurt them and they barely hurt back, so one frigate holds a port for good (600 h against
18 units; 10 AI cases / 597 h on 2 seeds). IMP-14.
**Options.** **A: no: docked ships sortie to sea when the port falls (try `idea/port-sortie`)** / B: they defend, but as soft targets / C: they
are captured or scuttled.
**Until you answer.** A is only on the prototype branch `idea/port-sortie` (d7a2ea0, not merged); auto-test/fixes keeps today's rule (ships
hold the port).

## Q16. May fleets pass between neighbouring port cities over land (canals such as Kiel, Corinth), or only by sea?   (round 2)

**Why it matters.** MR2-01: all 187 neighbouring port pairs are land shortcuts for fleets today (Ipoh → Kuantan across Malaya, Carlisle →
Leeds across England). Suez and Panama are already sea links (MAP-8).
**Options.** **A: only by sea; Suez and Panama as they are** / B: also a short list of canals (name them).
**Until you answer.** A: fixed as a bug on auto-test/fixes (a9e2226, MOV-4): fleets sail over water only, no canal shortcuts. Name any
canals you want and they can be added as allowed pairs.

## Q17. Should artillery and warships be able to fire at independent garrisons?   (round 2)

**Why it matters.** rangedFoe requires an owner ≥ 0, so ranged fire never aims at independents although land battles with them happen
(m19.js: 4 artillery next to Tartu, 0 targets). Independent land is then harder to take than enemy land.
**Options.** **A: yes, like any enemy at war** / B: no (keeps the AI from wasting fire on rebels).
**Until you answer.** Unchanged (no ranged fire at independents).

## Q18. Paratroopers in the air when peace is made or the target changes hands: abort, land at home, or drop anyway?   (round 2; extends Q8)

**Why it matters.** MR2-06: they drop into a nation at peace and are walked home within 6 h by strandedHour.
**Options.** **A: abort and land back at the airbase (same answer as Q8 A)** / B: drop anyway (today).
**Until you answer.** A: fixed as a bug on auto-test/fixes (9c3af00): the drop is called off and the paratroopers stay at their airbase,
with a dispatch. The same happens when the target changed hands to a nation they are not at war with; otherwise they drop as before.

## Q19. A captured missile silo: does its stock pass to the captor, and may the captor fire missiles it has not researched?   (round 2)

**Why it matters.** ECO-R2-Q1: the US took Krasnoyarsk (2 ballistic, 1 cruise) with no missile research and fired a ballistic missile; capture()
clears the queue and construction but not `S.mstock[p]`.
**Options.** **A: the stock is destroyed on capture** / B: it passes to the captor, fired only with the research / C: it passes and may be fired
(today).
**Until you answer.** Unchanged.

## Q20. Should the coalition-offensive reward ($150M) come out of the leader's treasury?   (round 2)

**Why it matters.** ECO-R2-Q2: diplomacy.js:229 creates the money; the message says "$150M from <leader>", who pays nothing.
**Options.** **A: the leader pays; no reward if it cannot** / B: keep it created (a coalition bonus); fix the message.
**Until you answer.** Unchanged.

## Q21. What should an empty treasury do?   (round 2)

**Why it matters.** IMP-15: nothing reads it; Thailand left about $2B of upkeep unpaid over 60 days at full strength; a person can do the same.
**Options.** **A: forces lose 5 morale a day while upkeep is unpaid (floor 30); the AI disbands its weakest units after 3 days** / B: disband
the dearest units / C: debt, no new orders until repaid / D: nothing (today).
**Until you answer.** Unchanged.

## Q22. The day number rolls over at 10:00 (the game's start hour) while the calendar date changes at midnight: align them?   (round 2)

**Why it matters.** P2-14: at hour 43 the top bar shows day 2 at 05:00 on the third calendar date; research says "opens on day 3", trade
routes "end at 0:00". RES-2 fixes the day as 1 + floor(hours/24), so the rule stays.
**Options.** **A: display only: start the game clock at 00:00 so day and date turn together** / B: show only "Day N, hh:00" (drop the date) /
C: keep.
**Until you answer.** Unchanged.

## Q23. One confirm style for war everywhere?   (round 2)

**Why it matters.** P2-15: a move across a border opens a clear "DECLARE WAR?" dialog; Diplomacy's Declare war only relabels its button for
3 s, which a phone user does not see (the first tap looks dead).
**Options.** **A: the same dialog in both places (with IMP-5's empty-border-cities list)** / B: keep both.
**Until you answer.** B. The phone menu is fixed (0298973: the menu stays on screen and "Confirm war?" shows); the two styles stay.

## Q24. In a surprise war, should an ally of both sides join against the attacker?   (round 2)

**Why it matters.** ECO-R2-8 (rejected as a bug): surpriseWar's skip list leaves out allies while startWar includes them, so a common ally
turns on the surprise attacker; each seat gets a dispatch.
**Options.** **A: yes, keep it (betrayal has a price)** / B: a common ally stays out, as in a declared war.
**Until you answer.** Unchanged.

## Q25. A force that must go home at peace but has no land route (an expedition across the sea): jump, sail, or disband?   (round 3)

**Why it matters.** Today `sendHome` and evict move such a force over the water at once to the nearest own province on any coast
(MIL-R3-02: 17-22 jumps per 40 days, e.g. Brussels → Norfolk, Baku → Aktau). Since B2.12, a third nation's capture triggers it too. One
case lands off a naval city (ECO-R3-7, Norway at Windsor), against EMB-1.

**Options.**
- A: keep the jump, but land only at an own naval city.
- **B: the force puts to sea from the province's coast and sails home like any sea trip (slow, can be caught at sea) for people; A for
  the AI.**
- C: it stays where it is, able to move only towards home, until `strandedHour`.
- D: it disbands after 72 h with no route (as B1.7 / Q12 for idle AI forces at sea).

**Until you answer.** A, as the smallest bug fix that keeps EMB-1 (auto-test/fixes 22d6d2b, B3.3; the same helper for evict in
aee2fa5, B3.4): a force whose way home crosses water is moved at once to the nearest own naval city (any own province only if the nation
has no naval city) and drops its boarding and landing timers. B (sailing home) waits for you.

## Q26. A routed force with no way home (a beachhead in an enemy port, an island garrison): surrender, last stand, or evacuate?   (round 3)

**Why it matters.** MIL-R3-01: it stays "retreating" in the battle for good. The dispatch falsely says "retreating to …", and the force
can never surrender (96 cases, 1,684 h per 40 days, seed 3007). B2.24 (a fleet that routs towards land) has the same root.

**Options.**
- A: it surrenders like an encircled force (the existing rule: unsupplied, morale under 10, outnumbered 2:1).
- B: a "last stand": no retreat, it fights on, with a truthful dispatch ("cut off at X: no way back").
- **C: invaders holding a port's coast put to sea in an emergency embark (longer than 45 min) and sail home; otherwise A. Fleets retreat
  to the nearest own naval city or an open sea zone away from the battle.**

**Until you answer.** A. The bug fix (auto-test/fixes eca1461, B3.2) makes the state truthful: a routed force retreats only to a
province it has a route to (fleets to an own naval city), the dispatch names that city, and a force with no route is not marked
"retreating" but goes to the existing encircled-surrender check. No evacuation (C) is built.

## Q27. Partisans in land that went back to their own nation (sale back, annexation, gift back) or was ceded at peace: disband, or keep fighting?   (round 3)

**Why it matters.** ECO-R3-2: today they make the province independent within 24 h, even when it went back to their own home nation.
This also concerns the rebels branch (REB-2).

**Options.**
- **A: they disband when the province's holder is its home nation, and also after a peace cede (the peace settles it).**
- B: they disband only when it returns to the home nation.
- C: today's rule.

**Until you answer.** A, both halves. The fix (auto-test/fixes 0156928, B3.10) stands the partisans down whenever the province is
home land of its holder. A peace cede makes the ceded land the receiver's home land (cede() sets `S.home`), so it is covered too:
rebelhome.js peace on the branch keeps Tromsø with Finland (it went independent before). If you want partisans to keep fighting in land
ceded at peace (B), that is one condition to undo for the cede path.

## Q28. A coalition gift of captured land: does it become the receiver's home land at once, or stay occupied land as in a territory sale?   (round 3)

**Why it matters.** ECO-R3-5: `sendGift` (diplomacy.js:355) gives the receiver home title (`S.home`) and clears occupation. `terrSell`
(territory.js:137-141) keeps sold land occupied unless it was the buyer's own home. ECO-13 settles who may gift, not the title.

**Options.**
- **A: follow terrSell: home title only when it was the receiver's home land; otherwise it stays occupied (rebels and integration
  apply).**
- B: keep the gift rule as it is (a reason to gift rather than sell).

**Until you answer.** B (unchanged: gifts give home title as today).

## Q29. Units in training when their city is captured: lose them silently, tell the loser, or give something back?   (round 3)

**Why it matters.** 253 queued orders were lost in 4x100 games, with no dispatch naming them (IMP-23).

**Options.**
- A: lost, with a dispatch that names them.
- **B: A, plus the goods (not money or manpower) of items that had not started come back to the old owner.**
- C: the queue moves to the nearest own city with room.
- D: today's rule (lost, no word).

**Until you answer.** D (today's rule). IMP-23 option 1 (the dispatch) is suggested as a small change; no refund is built.

## Q30. Should independent garrisons be known before you attack them, or should First Steps stop advising "look for a Favourable odds chip"?   (round 3)

**Why it matters.** First Steps tells a new player to capture a weak independent neighbour and look for a Favourable odds chip. But
independent garrisons are "Unknown (fog)" and the route chip shows no odds (P3-Q1, Lumbini). India lost a 2-infantry force at Seti to a
2-infantry garrison it could never see. P3-01 (the forces you fight stay unidentified during the battle) is a separate bug and is being
fixed. This question is only about before the battle.

**Options.**
- A, a **PROPOSAL** on UNI-9 / VIS-2: independent garrisons count as identified (they are not a rival nation), so odds show for them.
- B, a PROPOSAL: they are identified when an own force stands next to them.
- **C: no rule change. First Steps drops the odds advice for independents and says "independent garrisons are 2-6 infantry: send at
  least twice that".**

**Until you answer.** Unchanged (no rule or text change made). C is a small text change for whoever takes IMP-13. Separately, the
forces you fight are now identified for the whole battle (P3-01, fixed in 14efd66, B3.8; page only).

## Q31. Phones: how should a player select several forces?   (round 3)

**Why it matters.** IMP-21: a phone has no multi-select, so a 10-unit stack takes about 15 taps (median 13 starting forces per nation).

**Options.**
- **A: long press adds or removes a force (prototype `idea/phone-group`).**
- B: a "Select" toggle in the action bar.
- C: a "Gather here" button on your own province that sends all idle forces within N hours.
- A and C together are also possible.

**Until you answer.** Only the prototype branch `idea/phone-group` (4ac62da) has A. Nothing is merged.


## Questions from the owner notes of 2026-11-25

Jobs FOG-CLASH, ECON-START, PROPOSALS, CITY BUILDING LOTS and UI-FIXES log their questions here (each with the default used) as they report.

### Diplomacy (owner's reference layout, point 14)

**D1. Quick messages to computer nations.** Today you can send a computer nation six quick messages (Message tab). Your computer-nation page has no Send Message button, but you also said "nothing gets removed". **Default:** the quick messages move into that nation's thread in Messages & Trades, under its trades; the page itself shows only New Trade.

**D2. "Their" and "your" relation.** In our rules a treaty (ceasefire, peace, NAP, right of way, alliance) binds both sides, so the two diamonds usually match. They differ only for one-sided things: an embargo, or right of way given one way. **Default:** both diamonds show the treaty; a one-sided embargo or passage shows only on the side that set it.

**D3. Real-player features before online play.** Add Friend, Player Profile, Mute and chat need a server for real players. **Default:** they are built and work locally now (friends list, profile page, mute and chat stored with your game), with one connection point for the server later. A dev-only test switch marks a computer nation as "played by a real player" so the screens can be tested and shown. The public build never fakes real players.

**Answers from the built job (branch diplomacy-ref 20ecbc2).** D1-D3 were built with the defaults above. New questions, default after the arrow:

- **D4. Several treaties in one trade?** → One treaty per trade.
- **D5. May two nations at war trade money and goods directly?** → Yes, as computer nations already could; offers made before the war lapse.
- **D6. Should a computer nation's refusal of your trade cost opinion?** → No, as before.
- **D7. Pop-up notes on a phone while Diplomacy is open** cover the tabs for a few seconds. → Done (be33bed): below the tabs and sort bar, taps pass through.
- **D8. Province details and price aids in the land picker** (value, floor, suggested price, locator map). → Kept.
- **D9. Keep the Neighbours sort and the Border row on the nation page?** → Yes.
- **D10. A computer nation that likes you keeps giving money for nothing** (already so before this work). → Unchanged for now; one option is that it refuses deals where it gets nothing.
- **D11. Invented leader names:** a few share a surname with a real minister (higher risk: Syria's Nabil Sabbagh, Yemen's Tawfiq al-Mikhlafi; lower: Japan's Tadokoro, Spain's Valcárcel, Norway's Haugland, Mali's Tangara). → Done (be33bed): Syria Rafiq Dabbouri, Yemen Jalal Samawati, Japan Itsuki Moriwaki, Spain Inés Montalbetti, Norway Sigrid Vollaneset, Mali Moussa Kébalou. Please skim them once.
- **D12. The computer's own alliance check can wrongly say "coalition is full"** (already so before this work). → Unchanged, so computer-only games stay identical.
- **D13. Known Army Size** compares the forces you have seen with their whole military, so Russia with one force seen reads "8 units, weaker military". → Done (be33bed): "8 units seen"; the comparison shows only when all their forces are known.

### MARKET (point 13; branch market-ref 246d48c). Default after the arrow.

- **K1. Is "offers on both sides all game, many more sales, fewer oil shortages" enough,** even though about 95% of computer sell offers still expire unsold? → Yes; deeper computer demand later if you want it.
- **K2. Computer nations near their storage limit may sell into your buy offer at down to 0.75× the world price.** → Allowed.
- **K3. Should players' own offers be held to a price band** (closes a money-transfer trick between two players that already exists)? → No change in this job.
- **K4. "All goods" in the Order Book shows 5 offers per good,** with "All ›" and "Show all". → 5.
- **K5. After tapping a flag, a "◀ Market" button brings you back** to the same tab and scroll. → Yes.
- **K6. The old one-screen view of all five goods is gone;** each tab shows its price instead. → OK.
- **K7. On day 1 the sell side of a scarce good is filled by small premium lots** at about 1.25-1.35× the world price. → Yes.
- **K8. Tapping a flag opens today's nation window** until Diplomacy merges; then it opens the new ABOUT PLAYER page (one line). → Yes.

### Rebels plan (points 8-11; docs/REBELS-PLAN.md on plans-1125, 19dd3af). Suggested answer after the arrow; REBELS waits for your OK on R1.

- **R1. The three proposals.** → Annex City option B (town $50M · 10k · 3 days, city $80M · 15k · 4 days, large city $120M · 25k · 5 days, metropolis $180M · 40k · 6 days); distance as straight-line km from the capital, −5 per 1,000 km rounded; each of your ground units in the city halves the rebel chance. Also: the chance reaches 100% at 10% morale; shortage scales with the share of the day's need unmet; casualties come from the province's war damage.
- **R2.** Cap distance at −30 (your rule has no cap; Baghdad held by the US would be −50)? → Yes.
- **R3.** Liberated homeland always 55%, also land handed back by treaty? → Yes.
- **R4.** Countryside around an annexed city annexed with it (occupied countryside whose nearest city it is, same country)? → Yes.
- **R5.** Land received by treaty, sale or gift → arrives annexed, unless it was your homeland.
- **R6.** Independent land counts as an enemy neighbour? → No.
- **R7.** Enemy units in the province −1: flat or per unit? → Flat.
- **R8.** Neighbour −7/−4 and +3/+1 by the neighbour's type or the province's own? → The neighbour's.
- **R9.** "Rebels included" in wars: only while rebels stand in one of your cities? → Yes, only while present.
- **R10.** Homeland and annexed cities can rebel too at 33% or lower (supersedes REB-3)? → Yes.
- **R11.** Keep Pacify? → No.
- **R12.** Keep Mobilisation's strain on homeland morale as −5 per level? → Yes.
- **R13.** The spy's "Incite unrest" becomes "Incite revolt" (−20 morale at once in an occupied city)? → Yes.
- **R14.** Rebels take an empty city at once? → Yes.
- **R15.** Trade partners (point 11): option C (the lost route's slot stays empty while at war or holding their cities unannexed, and your other routes pay 25% less until you annex)? → C. B is the literal "I lose that trade".
- **R16.** Show the fire on foreign cities wherever you can see the city? → Yes.
- **R17.** Administration: occupied land counts a quarter and annexed land a half against the administration factor (today every province counts fully, so conquest by a small nation never pays)? → Yes; point 11's results depend on it.

### Missiles plan (point 12; docs/MISSILES-PLAN.md on plans-1125). MISSILES waits for your OK on the plan.

- **M1.** Cruise missiles need no silo: built in any city with an Army Base, Airbase or Naval Yard, 2 stored there? → Yes.
- **M2.** Nuclear Warhead needs Heavier Warhead rather than Chemical Warhead? → Yes.
- **M3.** ICBM now or later? → Later.
- **M4.** Your own forces are hit by your own gas and blast, with a warning? → Yes.
- **M5.** No target in your own land, even with enemies or rebels there? → Yes.
- **M6.** Every nation sees a nuclear launch? → Yes.
- **M7.** The victim's allies join the war; a computer ally of the launcher leaves below opinion 0? → Yes.
- **M8.** Chemical and nuclear missiles self-destruct at peace and are destroyed when their silo is captured? → Yes.
- **M9.** The computer's strict use rule, and fix "the computer fires no missiles" (IMP-8) in the same build? → Yes and yes.
- **M10.** Generic names, no pictures of real weapons? → Yes.
- **M11.** One CBRN Defence research node instead of an upgrade in every ground line? → Yes.
- **M12.** Limits, cooldowns and damage as written; the build's balance run may tune them by up to a fifth? → Yes.
- **M13.** Gas and radiation zone markers as mocked up? → Yes.
- **M14.** Build missiles after auto-test/fixes is merged (it fixes the same missile functions) and after REBELS? → Yes to both.
- **M15.** Also cut morale at once when a strike lands? → No; one rule for all civilian losses.

The Diplomacy layout options (A/B/C) from the same job are superseded by your reference layout; their button inventory is the checklist of actions to keep.

### UI-FIXES (points 3 and 4; branch ui-fixes d26f181)

- **U1.** You said blue for an affordable Build button; the game's main button colour is green. → A new blue matching the selected Build/Train tab (green is a one-line change).
- **U2.** Unit cards in the Mobilize list are full-width rows, not buttons. → A blue tint and a blue left bar when affordable, not a solid blue block.
- **U3.** "Build Army Base" in the Mobilize panel was always green. → Now blue when affordable and grey when not, like every other Build button.
- **U4.** The soldier picture now fits like the others, but because he is tall and narrow he looks a little smaller than the vehicles next to him. Give tall pictures a slightly bigger size cap? → No change.

### ECON-START (points 5-7; branch econ-start 1ad3cd3)

- **E1.** A membership's queue of 2 trains both units at once (doubles a city's ground output). Intended, or should the second wait? → Both at once (as today).
- **E2.** Until there is a store every public player has no membership. Public build: membership off, "With a membership…" wording shown? → Yes.
- **E3.** Should computer nations fly their start fighter on patrol and scouting (only 7 of 68 did in 10 days)? → Left idle at peace.
- **E4.** The start fighter is folded into the capital's counter at play zoom on phones (own counter from city zoom, and in the forces list). → Left to UNITS IN CITIES.
- **E5.** Island nations reach little on day one with their fighter (New Zealand: Lord Howe and Macquarie). → Acceptable.
- **E6.** Old saves: an Army Base already being built keeps its 24-hour clock. → Yes.
- **E7.** Anyone can switch membership on from the browser console or a save edit until payments exist. → Acceptable; the payment system must check membership on its own side.
- **E8.** Readings used: the day-one infantry research is Ceramic Body Armour; your "20 hours" was 24 h in the game, now exactly 30 min; "an Arms Industry in any city" = one Arms Industry at the unchanged price; Army Base level 1 no longer gets dearer per city (levels 2-5 still rise 40%, counting only cities with level 2+); the computer now builds about twice as many interceptors and 15% fewer infantry (balance passes); the start fighter costs about $6M a day upkeep. → All yes.

### FOG-CLASH (points 1-2; branch fog-clash 0f5ba0f)

- **F1.** Guns reach further than units see (artillery 80 km, rockets and cruisers 150, a force sees 50). Give guns an extra sight ring around your cities? → No: one sight rule for everything; guns need a spotter (in computer wars ranged fire drops a lot because of this).
- **F1b.** Show the edge of your units' sight on the map? → Keep today's faint veil.
- **F2.** Should the border warning also say "unidentified armies are gathering" for '?' forces? → No, identified forces only.
- **F3.** Two columns that meet stand 20 km apart, halfway between where they met and the province's centre. Or stay exactly where they met? → Halfway.
- **F4.** A force that wins a meeting outside the province it was going to loses its order. Carry on instead? → It stops; the computer plans again.
- **F5.** You attack blind until one of your units is within 50 km (the odds chip shows no defenders). OK? → Yes.
- **F6.** Other defaults: AWACS '?' contacts stay; ordinary sight only spots ('?'), recon identifies; no meeting with a force standing just off the road; a column fights a standing enemy at the centre; submarine-only forces are stopped by a meeting; enemy air wings show only where they fly in your sight. → All as listed.
