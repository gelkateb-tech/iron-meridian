# Missiles plan 2: final proposal (planning only, nothing changed)

**In short**
- There are **7 missiles**: Cruise, Ballistic, Chemical Cruise, Chemical Ballistic, Nuclear Cruise and Nuclear Ballistic now, and the Nuclear ICBM later. The word "Tactical" is gone. Two more slots, a conventional ICBM and a chemical ICBM, are shown in the table with numbers but are **not proposed**.
- **Range:** cruise 2,880 km (3,600 km after research). Ballistic 4,680 km (5,760 km after research). The ICBM reaches the whole map. Today's 16,200 km ballistic range is gone.
  - From Berlin a ballistic missile now reaches 21 to 29 of the 67 other capitals, against 66 today. Of the 10 big nations measured, even the best city reaches no more than 39.
- **Blast:** each step up hits a bigger area. A cruise missile hits one province, about 180 km across. A nuclear ballistic missile also hits the ring of provinces next door, out to about 200 to 400 km. An ICBM also hits a second ring of land, out to 540 km.
- **HP:** every missile has HP in flight: cruise 12, ballistic 16, ICBM 24. In the last hour before it lands, defences fire shots at it, and each hit takes HP off. At 0 HP it is shot down.
  - Cruise is the easiest to stop and the ICBM the hardest.
  - **No defence is ever certain.** The best possible defence stops at most 84% of cruise missiles, 76% of ballistic missiles and 32% of ICBMs.
- **Every missile gets a launch card** showing its HP and its chance to get through. A setting lets you skip the card for plain cruise and ballistic missiles.
- **The computer will now defend.** When an enemy has missiles that can reach it, it builds SAMs at its capital and silo cities.
- **Old saves load with no conversion.** The old Chemical Missile becomes the Chemical Ballistic Missile, and the old Tactical Nuclear Missile becomes the Nuclear Ballistic Missile. A missile already in flight starts with full HP.

How the numbers were made:
- The reach numbers come from the real rules, run by `/tmp/claude-0/-home-user-iron-meridian/7fd07611-91e4-5b00-ba43-06c622a65904/scratchpad/missiles-plan2/final/reach3.js` (results in `reach3.json`).
- The shoot-down chances are exact sums, from `/tmp/claude-0/-home-user-iron-meridian/7fd07611-91e4-5b00-ba43-06c622a65904/scratchpad/missiles-plan2/final/odds2.js` (results in `odds2.json`).
- "km" means **map km** (hexes x 180), the same km the game already shows for every range. "Real km" means the true distance on the globe. Question 2 asks which one to show.

---

## A. Names

### A.1 The list

| # | Name | Short | Status |
|---|---|---|---|
| 1 | Cruise Missile | CM | exists, unchanged |
| 2 | Ballistic Missile | BM | exists, unchanged |
| 3 | Chemical Cruise Missile | CCM | **new now** |
| 4 | Chemical Ballistic Missile | CBM | exists, was "Chemical Missile" |
| 5 | Nuclear Cruise Missile | NCM | **new now** |
| 6 | Nuclear Ballistic Missile | NBM | exists, was "Tactical Nuclear Missile" |
| 7 | Nuclear ICBM | ICBM | **later** (section D) |
| 8 | Conventional ICBM | - | not proposed |
| 9 | Chemical ICBM | - | not proposed |

- The old chemical and nuclear missiles keep their place in the save file. Only their names change, so old saves need no conversion (section E).
- Name check: these are plain military words, and the owner chose the nuclear ones. They follow Conflict of Nations' (CoN's) wording but are not CoN brand names. Nothing like CoN's "Theater Defense System" is used.

### A.2 Why chemical comes on two missiles, not three
- CoN has a chemical cruise and a chemical ballistic missile. Its ICBM appears to be nuclear-only, but no page says so outright.
- Gas covers a small area. On a $600M ICBM it would gas one or two provinces, which no player would buy.
- A nuclear-only ICBM keeps it a clear "last step". Numbers for rows 8 and 9 are in the table in case you want them (Question 3).

### A.3 "Tactical" goes everywhere it touches missiles
- Shown to players: the missile's name, the silo text, the Nuclear Warhead research text, the "captured stock destroyed" message and the "hit" message. All five change.
- The old "Chemical Missile" text in the same places changes too.
- Behind the scenes (never shown, cheap to change): the developer button "Tactical nuke" becomes "Nuclear (ballistic)", with a new "Nuclear (cruise)" next to it. The internal effect name "tactical" becomes "nuclear".
- **Not about missiles:** the fighters' research category "Tactical Air". It stays unless you say so (Question 6).

New texts:
- Silo: "Level I: ballistic and chemical missiles, and the Nuclear Cruise Missile. Level II: Nuclear Ballistic Missiles. Level III: Nuclear ICBMs (later). Levels II to V build missiles 10% faster per level."
- Nuclear Warhead research: "Missile Silos build Nuclear Cruise Missiles. Silos II and up also build Nuclear Ballistic Missiles."
- Chemical Warhead research: "Missile Silos build Chemical Cruise and Chemical Ballistic Missiles."

---

## B. The table

### B.1 Range, speed and flight time

| # | Missile | Range today | Range proposed | After full range research | Speed | Flight time |
|---|---|---|---|---|---|---|
| 1 | Cruise | 5,040 km (6,480) | **2,880 km** | **3,600 km** (+360 km a step, 2 steps) | 1,620 km/h (1,980 / 2,340 with Speed research) | 2 h for most targets; 3 h at full range (2 h with Speed I) |
| 2 | Ballistic | 16,200 km (20,520) | **4,680 km** | **5,760 km** (+540 km a step, 2 steps) | 3,960 km/h | always 4 h (the shortest flight allowed) |
| 3 | Chemical Cruise | new | 2,880 km | 3,600 km | as cruise | 2 to 3 h |
| 4 | Chemical Ballistic | 12,600 km (16,920) | 4,680 km | 5,760 km | 3,960 km/h (today 3,240) | always 4 h |
| 5 | Nuclear Cruise | new | 2,880 km | 3,600 km | as cruise | always 3 h (shortest allowed) |
| 6 | Nuclear Ballistic | 16,200 km (20,520) | 4,680 km | 5,760 km | 3,960 km/h | always 6 h (shortest allowed, as built) |
| 7 | Nuclear ICBM (later) | - | **whole map** | no range research | 5,400 km/h | **5 to 6 h anywhere** |
| 8 | Conventional ICBM (not proposed) | - | whole map | - | 5,400 km/h | 5 to 6 h |
| 9 | Chemical ICBM (not proposed) | - | whole map | - | 5,400 km/h | 5 to 6 h |

Notes:
- **One missile body, one range.** The warhead does not change range or speed. In CoN, too, a warhead goes on the same missile.
- **Range research:** "Cruise Missile Range" adds +360 km a step to all three cruise missiles. "Ballistic Missile Range" adds +540 km a step to all three ballistic missiles. "Cruise Missile Speed" covers all three cruise missiles.
- The "shortest flight allowed" times are warning time, as approved before. They are not the same thing as speed. The ICBM is now the fastest in every way: it lands in 5 to 6 h from anywhere, sooner than a Nuclear Ballistic Missile's 6 h.
- **Faster also means harder to hit** (section C). Speed research lowers the chance that a shot hits a cruise missile.
- **What CoN says:** cruise has "the shortest range of all missile types", ballistic is "medium-range", and the ICBM is long range. No CoN km figures could be confirmed, so all the km values are our own, kept in CoN's order.

### B.2 What each range reaches

Capitals reached (of the 67 other capitals) and share of all land. "Best city" is the nation's own city that reaches the most, because a silo can be built in any city.

| Nation | Cruise 2,880 km | Cruise 3,600 km | Ballistic 4,680 km | Ballistic 5,760 km |
|---|---|---|---|---|
| Germany, from Berlin | 16 caps, 14% | 19, 18% | 21, 23% | 29, 31% |
| Germany, best city | 16 (Berlin) | 20 (Dresden) | 23 (Munich) | 30 (Munich), 33% |
| Russia, from Moscow | 10, 12% | 16, 17% | 24, 26% | 28, 33% |
| Russia, best city (Rostov) | 15 | 21 | 28 | 34, 39% |
| Iran, from Tehran | 11, 14% | 18, 20% | 25, 31% | 31, 41% |
| Iran, best city (Tabriz) | 14 | 19 | 27 | 38, 43% |
| Turkey, from Ankara | 15, 16% | 21, 23% | 32, 33% | 38, 41% |
| Turkey, best city | 18 (Antalya) | 25 (Izmir) | 34 (Adana) | 39 (Izmir), 41% |
| China, from Beijing | 5, 12% | 9, 15% | 11, 21% | 16, 28% |
| China, best city (Kashgar) | 9 | 12 | 17 | 28, 39% |
| India, from New Delhi | 5, 12% | 11, 17% | 18, 28% | 25, 37% |
| United Kingdom, from London | 11, 11% | 15, 14% | 18, 19% | 25, 28% |
| France, from Paris | 13, 12% | 15, 15% | 21, 22% | 26, 30% |
| Japan, from Tokyo | 3, 7% | 4, 10% | 6, 14% | 11, 19% |
| USA, from Washington | 2, 7% | 4, 10% | 5, 14% | 6, 17% |
| USA, best city (Miami) | 5 | 6 | 7 | 9, 19% |

**Today**, a ballistic missile from Berlin reaches 66 capitals and 96% of all land.

Map km and real km:
- Our map stretches Europe and Russia about 1.6 times and the Middle East about 1.2 times.
- For example, Berlin to Moscow is 2,580 map km but 1,589 real km.
- So in real terms the cruise missile is long-range (1,600 to 2,500 real km from Berlin) and the ballistic missile is "intermediate range".

**Said plainly: the USA, Japan, Australia and Brazil have almost no missile war until the ICBM.** Their cities are too far from any rival. Even the best US city (Miami) reaches only 9 capitals, all in the Americas. No US city is close enough to Russia, China or Japan, Alaska included (Anchorage is 11,100 map km from Beijing). Europe, Russia, Turkey, Iran, India and China fight their missile wars with cruise and ballistic missiles. The earliest ICBM is about day 44 (Question 5).

Missile distance stays measured as today. It does not cross the map's edge in the Pacific, so Russia's Far East to Alaska is measured the long way. With the new ranges this only matters around the Bering Strait, so it is left alone.

### B.3 Blast

Sizes in km:
- **Target province:** about 180 km across (130 to 220 km).
- **Next-door ring:** the provinces touching the target, out to about 200 to 400 km from its centre.
- **Second ring (ICBM only):** every land province within 540 map km of the target's centre (about 400 to 550 real km). It does not reach across the sea. Measured at capitals, it covers 12 to 39 provinces and touches 0 to 4 other nations.

| # | Missile | Target province | Next-door ring | Second ring | Gas or radiation | Buildings, roads, people |
|---|---|---|---|---|---|---|
| 1 | Cruise | enemy forces only: about 13 to 14 health from a stack | - | - | - | war damage 12; roads and rails cut 48 h |
| 2 | Ballistic | enemy forces only: about 30 health; morale -25 | - | - | - | 1 building hit; war damage 22; roads cut 72 h |
| 3 | Chemical Cruise | small blast (about 15 health) on every force there, whoever owns it | - | - | gas 8 h (12 h with Persistent Agent) | war damage 25 in a city, 12 outside; 2% of people lost |
| 4 | Chemical Ballistic | blast (about 27 health) on every force | - | - | gas 12 h (18 h) | war damage 40 / 20; 4% of people lost |
| 5 | Nuclear Cruise | every force loses 30% of its health (armour and ships 25%) | - | - | radiation 24 h; output halved while it lasts | 1 building hit; all buildings out 24 h; roads cut 48 h; war damage 40; 6% of people lost |
| 6 | Nuclear Ballistic | 50% (armour and ships 40%) | 12% (8%) | - | radiation 48 h; output halved | 2 building hits; all buildings out 48 h; roads cut 96 h; war damage 60, 12% of people; next door 20 and 2% |
| 7 | Nuclear ICBM (later) | 60% (50%) | 20% (15%) | 5% (3%) | radiation 72 h in the target, 24 h next door | 3 building hits; all buildings out 72 h; roads cut 120 h; war damage 80, 18% of people; next door 30 and 4%; second ring 10 and 1% |
| 8 | Conventional ICBM (not proposed) | enemy forces, strong hit | light hit | - | - | 2 building hits; roads cut 96 h |
| 9 | Chemical ICBM (not proposed) | big blast | small blast | - | gas 18 h, 12 h next door | war damage 50; 6% of people |

- A Bunker still halves the nuclear hit, as built.
- The rule "each step up has a bigger blast" is yours. CoN backs the range order, but its own blast sizes do not strictly follow it.
- **Diplomacy goes by warhead.** Any nuclear missile has the same opinion cost, pulls allies into the war, is seen by everyone in flight, and blocks the launcher's peace offers for 72 h. Both chemical missiles share the chemical rules. A third nation's land in a ring gets the -40 fallout.

### B.4 Cost, build time, silo, limits and wait between launches

| Missile | Cost | Build | Silo | Limit | Wait between launches | Research |
|---|---|---|---|---|---|---|
| Cruise | **$50M** (today $60M) | 36 h | none needed: any Army Base, Airbase or Naval Yard city holds 2; a silo city has no limit | as today | none | Cruise Missiles |
| Ballistic | $140M | 72 h | I | none | none | Conventional Warhead |
| Chemical Cruise | $110M | 54 h | I | 2 a silo, 4 a nation | 8 h | Chemical Warhead |
| Chemical Ballistic | $170M | 84 h | I | 2 a silo, 6 a nation | 12 h | Chemical Warhead |
| Nuclear Cruise | $260M | 96 h | **I** | 1 a silo, 2 a nation | 12 h | Nuclear Warhead |
| Nuclear Ballistic | $400M | 120 h | II | 1 a silo, 3 a nation (shared with ICBMs) | 24 h | Nuclear Warhead |
| Nuclear ICBM (later) | $600M | 144 h | III | 1 a silo, at most 2 a nation, inside the 3 | 24 h | Intercontinental Missiles |

- **Each missile type has its own limit and its own wait.** So the cruise versions are worth buying. They come sooner, at a cheaper Silo I, they are cheaper, and they do not use up the Nuclear Ballistic Missile's 3 slots. Their weakness is a shorter range, a smaller blast and being easier to shoot down.
- This raises the most nukes a nation can hold from 3 to 5 (2 cruise and 3 ballistic or ICBM). Question 4 asks if that is OK.
- **A nuke now needs only a Silo I** ($140M) instead of a Silo II (another $224M). Nukes come cheaper and sooner after Nuclear Warhead (Question 4).
- Cruise drops to $50M because it is now shorter-range and easier to stop.
- Silo levels II to V still build 10% faster per level. A captured city still loses its chemical and nuclear stock.

---

## C. HP in flight

### C.1 The rule in plain words

1. Every missile in flight has HP. The warhead does not change it.

   | | Cruise missiles (all 3) | Ballistic missiles (all 3) | ICBM |
   |---|---|---|---|
   | HP | **12** | **16** | **24** |
   | Chance one shot hits | **25%** (23% with Speed I, 21% with Speed II) | **20%** | **10%** |
   | Most shots it can take | **6** (it flies low, so radar sees it late) | **10** | **16** (seen from far off, but rarely hit) |
   | Who can shoot | SAMs, Cruisers, Frigates, fighters on patrol | SAMs, Cruisers, Frigates | SAMs and Cruisers |

   These numbers are our own. They follow CoN's order. One CoN player report from 2020, which could not be checked, gives ballistic 15 HP and ICBM 22 HP.

2. **When:** the defence fires once, in the last hour before the missile lands. The damage shows on the marker for that hour ("HP 4/16"). If the missile reaches 0 HP it falls, and if not, it lands the next hour.
3. **Who counts:**
   - Forces in the target province count fully.
   - Forces next door count at half. A SAM with the Long-Range SAM research counts fully next door.
   - Fighters count when they patrol over the target.
   - As today, a defender must be at war with the launcher, standing still and not flying (fighters on patrol aside). Swarm drones still weaken the defence.
4. **Shots:**

   | Defender | Shots an hour | HP off per hit |
   |---|---|---|
   | Mobile SAM | 2 | 6 |
   | Cruiser | 3 | 6 |
   | Frigate | 2 | 4 |
   | Fighter on patrol (Interceptor or Air Superiority Fighter) | 1 | 6 |

   Tanks, infantry, jammers, AWACS and carriers cannot shoot missiles. A carrier's fighters count if they are on patrol.
5. **The best shots go first.** Shots that take off the most HP are fired first. The "most shots" limit then stops the rest.
6. **Anti-Missile Shield** research raises the hit chance: x1.25, x1.5 and x1.8 at levels I, II and III.
7. **Salvos beat defences.** A defender's shots in an hour are shared by every missile landing in that hour. **The most dangerous missile is shot at first**: nuclear, then chemical, then plain; ICBM before ballistic before cruise; then the most hurt one. So cheap missiles cannot shield a nuke, but a salvo of the same kind still gets through.
8. A damaged missile that gets through still does its full damage.
9. Today's single dice roll with an 85% cap goes away. The new limit on shots keeps "no defence is certain".

### C.2 How hard each one is to stop

Chance to stop one missile (cruise / ballistic / ICBM), all SAMs in the target province:

| Shield | 1 SAM | 2 SAMs | 3 SAMs | 4 SAMs | 5 SAMs | 8 SAMs | Best possible |
|---|---|---|---|---|---|---|---|
| none | 6 / 0 / 0% | 26 / 3 / 0% | 47 / 10 / 0% | 47 / 20 / 1% | 47 / 32 / 1% | 47 / 32 / 7% | 47 / 32 / 7% |
| I | 10 / 0 / 0% | 37 / 5 / 0% | 61 / 17 / 0% | 61 / 32 / 1% | 61 / 47 / 3% | 61 / 47 / 13% | 61 / 47 / 13% |
| II | 14 / 0 / 0% | 48 / 8 / 0% | 73 / 26 / 1% | 73 / 45 / 2% | 73 / 62 / 5% | 73 / 62 / 21% | 73 / 62 / 21% |
| III | 20 / 0 / 0% | 61 / 14 / 0% | 84 / 37 / 1% | 84 / 60 / 4% | 84 / 76 / 9% | 84 / 76 / 32% | 84 / 76 / 32% |

- **Today**, 3 SAMs stop a ballistic missile 14% of the time and a cruise missile 32%. With Shield III, 37% and 68%.
- One SAM alone can no longer stop a ballistic missile: it takes 3 hits, and a SAM fires 2 shots.
- Cruise Missile Speed research: 3 SAMs with no shield stop 47% of cruise missiles, 42% after Speed I and 37% after Speed II.

Ships and fighters (no shield, then Shield III):
- 2 Frigates: 5 / 0 / 0%, then 24 / 2 / 0%.
- 2 Cruisers: 47 / 10 / 0%, then 84 / 37 / 1%.
- 2 Cruisers and 2 Frigates: 47 / 26 / 0%, then 84 / 68 / 1%.
- 4 fighters on patrol: 26% of cruise missiles, then 61%. Nothing else.

**Why cruise is easiest and the ICBM hardest:** a cruise missile is hit most often and needs only 2 SAM hits. A ballistic missile is hit less often and needs 3. An ICBM is hit least often, needs 4 hits, and only SAMs and Cruisers can shoot it.

### C.3 Worked examples

1. **A ballistic missile at a defended city:** 3 SAMs in the target and 2 next door.
   - With Long-Range SAM, 5 SAMs fire 10 shots. It gets through **68%** of the time with no shield, **53%** with Shield I, **38%** with Shield II and **24%** with Shield III.
   - Without Long-Range SAM, the 2 next door count as 1: it gets through 80 / 68 / 55 / 40%.
   - With no shield, of the ones that get through, 45% land with HP 4/16, 40% with HP 10/16 and 16% unhurt.
2. **A cruise missile at the same city:** it gets through **53 / 39 / 27 / 16%**. Fire cruise missiles at lightly defended targets, or in salvos.
3. **Salvos:**
   - 3 ballistic missiles in the same hour into 4 SAMs with Shield II: on average **2.5 of the 3 get through**. One fired alone gets through 55% of the time.
   - 4 cruise missiles into 3 SAMs with no shield: **3.5 of the 4 get through**. One alone: 53%.
4. **A cheap missile cannot shield a nuke.** A Nuclear Ballistic Missile and 2 cruise missiles land in the same hour on 6 SAMs with Shield II. The SAMs shoot at the nuke first: it gets through 38% of the time. If they shot at the cheap ones first, the nuke would always get through. That is why the order rule exists.
5. **A Nuclear ICBM (later) at a capital with Shield III:**
   - 4 SAMs in the target: stopped 4% of the time.
   - 4 SAMs and 2 next door with Long-Range SAM: 16%.
   - 6 SAMs and 2 Cruisers: 32%. That is the 16-shot limit, so more defenders do not help.
   - With no shield, it is stopped 7% of the time at most. As in CoN, an ICBM can be stopped, but only by a big, fully researched defence, and never reliably.

### C.4 How HP shows

**On the missile marker:**
- A thin HP bar sits under the missile picture: 20 px long for cruise, 26 px for ballistic, 32 px for an ICBM. It is white when full, amber below two thirds and red below one third.
- A small chip next to it reads "HP 16/16". It shows for your own missiles, missiles aimed at you, and any missile that has been hit. On phones it shows only when zoomed in. The bar always shows.
- When hit, the chip flashes red, the number drops and a small spark shows.
- A ballistic missile often flies above the top of the screen. Then the HP also shows on the target's warning tag ("NUCLEAR · HP 10/16") or on the edge arrow.
- You can tap a missile to see its name, HP, where it came from, where it is going and "lands in N h". It does not get in the way while you are aiming.
- Cruise kinds use the cruise missile picture, ballistic kinds the ballistic one, and the ICBM the ICBM picture that already exists.

**The launch card:**
- **Every missile gets the card** (today only chemical and nuclear do). Cruise and ballistic get a short card: target, lands in N h, HP and chance, stock left, then Launch or Cancel.
- A setting, **"Quick fire for cruise and ballistic missiles"**, skips the short card. It is off by default (Question 7).
- HP and the chance share one line, and the Launch and Cancel buttons always stay in view at the bottom:

```
Nuclear Ballistic Missile · from Minsk (Silo II)
Nuclear strike on Vilnius?
Lands in 6 h at the earliest
HP 16 · gets through about 80% · you can see 4 SAMs there
...what it hits, opinion cost, wait, stock left...
[Launch]  [Cancel]
```

- **The chance counts only the defences you can see.** Hidden SAMs can make the real chance lower. The computer players get the same limit: they do not know where hidden SAMs are.
- Other places: the aim hint reads "Ballistic Missile · 1,380 of 4,680 km · lands in 4 h · HP 16 · gets through about 80%". The range ring label shows "4,680 km". The silo panel reads "range 4,680 km · HP 16" instead of a bare number. The missile strip tooltip adds the HP.
- The Army Info panel's missile row becomes "Stops a lone cruise missile: 47%" (today it is a fixed 12% for every missile).

Messages:
- "Your Cruise Missile was shot down over Warsaw."
- "Air defences hit an enemy Ballistic Missile over Warsaw: HP 4/16."

---

## D. The ICBM, later: how it fits

- **Research: "Intercontinental Missiles"**, in the nuclear missile line.
  - Opens on day 28 and takes 10 research days. It costs $420M, 120 metal and 120 rare (as in the approved plan).
  - Needs Nuclear Warhead **and** Ballistic Missile Range step I.
  - Text: "Missile Silos III and up build Nuclear ICBMs. They reach the whole map."
  - It has no range or speed research of its own (CoN has 4 ICBM levels; we keep one).
- **Silo III** builds it: 144 h, or 115 h at Silo III, 101 h at IV and 86 h at V. The silo text already names it.
- **Earliest ICBM:** about day 44. Research opens on day 28, takes 10 days, then the silo must reach level III and the missile takes about 5 days.
- **Limits:** 1 a silo, at most 2 a nation, and inside the 3 shared with Nuclear Ballistic Missiles. Its own 24 h wait.
- **Flight:** 5 to 6 h to anywhere. Seen by everyone, like every nuke. The flight line on screen takes the short way across the Pacific.
- **Defences:** SAMs and Cruisers only. 24 HP, 10% a shot, at most 16 shots (example C.3.5).
- **Look:** the existing ICBM picture, strike effect and sound. No new art.
- **Computer players:** they upgrade silos only to level II today. That cap rises to III for a nation that has Intercontinental Missiles.
- **What gets built now so it fits later:** each missile type's own limit and wait, a missile-body field (cruise, ballistic, ICBM), the flight-time rule, and the "best shots first" defence with its shot limits. The ICBM entry itself, its research, its second blast ring and the computer's silo change all come in the ICBM job. The ICBM is **not** put in the data now: menus list every missile, and one with no research would break them.

---

## E. Effects on what exists

**Research tree.** No research names in the save change, so nothing needs converting. These texts change:
- Cruise Missile Range: "range 2,880 to 3,240 km", then "to 3,600 km". Covers all cruise missiles.
- Ballistic Missile Range: "range 4,680 to 5,220 km", then "to 5,760 km". Covers all ballistic missiles.
- Cruise Missile Speed: covers all cruise missiles, and "harder to hit".
- Heavier Warhead stays on the plain Ballistic Missile only.
- Anti-Missile Shield: "your air defences hit missiles 25% / 50% / 80% more often".
- Chemical and Nuclear Warhead: as in A.3. New later: Intercontinental Missiles.

**Computer players:**
- **New: it defends.** When an enemy holds missiles that can reach it, or has fired missiles at it, it builds 2 to 4 Mobile SAMs at its capital and at its silo cities, and it researches the Anti-Missile Shield.
- It fires only when it has at least a 35% chance to get through, or it fires a salvo of 2 to 3 at a defended target.
- It builds its next silo in its city nearest its main enemy, not only at its capital. Old silos stay where they are, and stock that is now out of range just waits.
- It builds Nuclear Cruise Missiles in a Silo I and Nuclear Ballistic Missiles in a Silo II.
- Open questions from the missiles sheets: MS1, it answers a chemical strike with a chemical one and keeps nuclear answers for nuclear strikes or desperation. MS2, it researches Conventional Warhead more readily while at war.

**Old saves** (same save version, no conversion step):
- Stock: the old chemical stock becomes Chemical Ballistic Missiles and the old nuclear stock Nuclear Ballistic Missiles. The new types start at 0.
- No old save can be over a new limit: the old types keep their limits, and the new ones start empty.
- Missiles in flight: an old one has no HP saved, so it starts with full HP. It keeps its saved speed and lands even if it is now out of range (range is only checked at launch). If it reaches its target before the defence has fired at it, the defence fires right then.
- Waits between launches: the old saved clocks belong to the Chemical Ballistic and Nuclear Ballistic Missiles, which is exactly right.

**Checks to run:**
- The missiles check tool and the missiles tests (new ranges, HP, names, limits).
- The stack-damage measurement in the plan doc, plus the two new types.
- A new check: the real dice against the chance shown in the card, over 20,000 missiles. They must agree within 2 points.
- 60-day computer games: how many nations fire missiles, how many nukes are used, no runaway escalation, SAMs at capitals by day 20 and 40, and the share of missiles stopped.
- The reach table (B.2), and loading both an old master save and an old missiles-branch save.
- **The same-seed game fingerprint will change** (new ranges, new dice for defence, computer silos placed by the enemy, new stock types). Record the new one with its reason, as the plan doc requires, and re-run the other checks.

### E.1 For the developer (not for the owner's sheets)
- **Fields, not keys.** Add `car:'cm'|'bm'|'icbm'` to each `MISSILES` entry, next to the existing `wmd`. Add helpers `mslCar(k)` and `mslW(k) = MSL_WMD[MISSILES[k].wmd]`. Route every kind literal through them: air.js `missileCheck` (298, 307), `launchMissile` `k === 'nuc'` broadcast (320), `wmdLaunch` (426-430), `missileImpact` dispatch (358-359), `warDamage`/`LINK_DMG` `m.k === 'bm'` (364); index.html `missilePos` arc (6446), `mslCfHTML`, the aim hint `MSL_WMD[aimMsl.k]` (11927), the menu `N0.wmdT[k]`; fx.js `cm`/`nuc` tests, sprite choice and `MSL_LOOK` keys; ai.js 136-181. Keep keys `chem` and `nuc`; new keys `ccm`, `ncm`, later `icbm`.
- **Limits and waits per kind:** per-kind `perSilo`, `perNation` and `cd` on `MISSILES`, plus a group cap (`grp:'nucBig'`, 3) for NBM and ICBM. `N.wmdT[k]` keyed by kind: old keys `chem`/`nuc` already match. `S.wmd[].k` keeps the kind; read the warhead with `MISSILES[e.k].wmd` (old entries 'chem'/'nuc' map to themselves), so `nucShunned` and the counter-strike in `aiNuc` keep working.
- **Blast per missile:** move soft, hard, nb, ko, hits, links, civ, pop, zone length and gas length into each `MISSILES` entry. `nucImpact` and `chemImpact` read them from the missile, not from `MSL_WMD.nuc`. `MSL_WMD` keeps the warhead rules (opinion, mark, hourly rate). NCM radiation halves output (as `hazOut` does for any radiation zone) and fades over its 24 h.
- **Stock:** `mstock()` fills every missing key, not only when `chem` is missing (a missiles-branch save already has `chem`). `mslDone` and `wmdSweep` handle the new keys.
- **HP and defence:** `m.hp` (missing = full) and `m.def` (missing = not yet fired at). In `missileTick`, run the defence when `m.t + m.dt >= 1`, or at impact if `m.def` is unset. Build each defender's shot budget fresh every tick (not saved), and hand it out in a fixed order: most dangerous first, then `S.inflight` order. Emit a rules event `'mslHit' {m, dmg, by}` for the spark. The flight-time rule for the ICBM is `max(5, ceil(d/30))`.
- **Odds:** `mslOdds(viewer, from, to, k)`, an exact sum (at most 16 shots, 24 HP), counting only forces the viewer can see. It must never call `rng()`. Shared by the card, the hint, the Army Info row and the computer.
- **Research:** `mslOf` adds range by `car` (cm: `cm_rng` +2 hex, `cm_spd`; bm: `bm_rng` +3 hex; `bm_pow` on `bm` only). Base range cm 16 hex, bm 26 hex. `msl_icbm` needs `['msl_nuc','bm_rng']` (`rReqsOk` checks level > 0, which is step I).
- **UI:** a separate missile tap list filled in `drawMissiles`, checked only when not aiming, with a 32 px minimum box. Do not add the moving HP chip to `hazObstacles` (it would make the zone chips jitter); draw it above them on a dark plate. Add HP to `warnTag`/`edgeArrow`. `#mslcf`: a sticky button row; the HP and chance on one line.
- **Old-save tests:** keep `.test/fixtures/missiles-oldsave.json` and add a missiles-branch save with chemical and nuclear stock and missiles in flight without `hp`.
- **Golden:** re-record `tools/golden-12345.txt` with its reason; re-run headless `--check`, `--nations --check`, split-lint and `.test/fx-determinism.js`.
- **Names:** rules/data.js:73, 74, 190, 403, 404, 407; rules/air.js:422, 455, 479; index.html:13366; fx key `'tac'` and `FXW.tactical`; docs/MISSILES.md and docs/COMBAT.md:155; tests .test/missiles-page.js:27 and .test/missiles.js:50.

---

## F. Questions for you (my default in brackets)

1. **Ranges:** cruise 2,880 to 3,600 km, ballistic 4,680 to 5,760 km, ICBM whole map. This also shortens today's cruise missile (5,040 km). OK? [yes]
2. **Which km to show:** map km (as for every other range today; Europe reads about 1.6 times long) or real km? [map km]
3. **7 missiles:** chemical on cruise and ballistic only, and no plain or chemical ICBM? [yes]
4. **Nuclear Cruise Missile:** it comes at Silo I, has its own limit (2 a nation) and its own 12 h wait, so a nation can hold up to 5 nukes instead of 3. It costs the same opinion as any nuke. OK? [yes]
5. **The USA, Japan, Australia and Brazil** have almost no missile war until the ICBM, about day 44 at the earliest. Keep it, open the ICBM sooner (day 22, earliest about day 38), or plan cruise missiles fired from ships as a later job? [keep it now; ships as a later job]
6. **"No Tactical anywhere":** rename the fighters' research category "Tactical Air" too? [no, missiles only; "Fighter Aviation" if yes]
7. **Launch card for every missile:** with a "Quick fire" setting for cruise and ballistic, off by default? [yes]
8. **Salvos:** shots shared, with the most dangerous missile shot first. Keep? [yes]
9. **The open questions MS1 to MS5** from the missiles sheets: take my defaults? [yes: chemical answered with chemical; Conventional Warhead researched readily at war; the launcher's peace offers refused for 3 days; the card for chemical strikes stays (it is now on every missile); side panel closed on phones while aiming any missile]

**The sheets** are in `/tmp/claude-0/-home-user-iron-meridian/7fd07611-91e4-5b00-ba43-06c622a65904/scratchpad/missiles-plan2/sheets/`. They still need to be copied to the shots branch at `shots/2026-11-27/missiles-plan2/` and pushed, with a message in `messages/2026-11-27/`. This planning job did not write to any worktree.

---

## G. Appendix: what changed after review, and what I did not take

Taken:
- Ballistic range cut further, to 4,680 to 5,760 km, after measuring from each nation's best city. The best-city numbers are in B.2.
- The Alaska claim is removed. The plan now says plainly that the USA, Japan, Australia and Brazil have almost no missile war until the ICBM. Question 5 offers options.
- Each missile type has a "most shots" limit (6 / 10 / 16), so no defence is ever certain (best: 84 / 76 / 32%).
- The cruise versions get their own limits and waits, so they are worth buying.
- The computer builds SAMs and the shield when threatened.
- Every missile gets a launch card, with a "Quick fire" setting.
- Shots along a cruise missile's path are dropped. They were random. Speed research now lowers the hit chance instead.
- Salvo order: the most dangerous missile is shot at first.
- The ICBM's second ring is set by distance (540 km, land only). Ring sizes are given in km.
- ICBM flight time is 5 to 6 h, set by distance.
- Cruise drops to $50M and gets 12 HP.
- The chance in the card counts only defences you can see, for the computer too.
- The nuclear gate moving to Silo I is shown as a choice (Question 4).
- The checks for kind keys are listed by warhead and missile body (E.1).
- "Tactical" is renamed in the developer button and the internal effect name too.
- The ICBM is not put in the data now (it would break the menus).
- The defence fires one hour before landing, so the HP drop can be seen.
- The fingerprint change, the golden re-record and the other checks are listed.
- The ICBM research needs Ballistic Missile Range step I, which the research tree can check today.
- On phones the card replaces the hover hint. HP and the chance share one line, and the buttons stay in view.
- The moving HP chip is kept out of the zone chips' obstacle list, and HP shows on the warning tag when the missile is off screen.
- Missile taps have their own tap list.
- The CoN claims are softened: our HP numbers are our own, the blast order is your rule, "high-level Cruisers got better against missiles", and "CoN's ICBM appears to be nuclear-only".
- The Army Info row keeps a number.
- The old-save gaps are covered: every missing stock type is filled, and waits and records are kept by type with the warhead read from it.
- The Nuclear Cruise Missile's radiation halving output is now in the table.
- Code names are kept out of the sheets and moved into E.1.

Not taken, or taken differently:
- **Missiles measured across the Pacific edge (wrap).** I dropped this change. With the shorter ranges it only matters at the Bering Strait. It would also need the aim ring drawn twice and would change the fingerprint for little gain. The critic's best-city figures used the wrapped distance; I re-measured with the game's own distance.
- **A "later" flag on the ICBM data.** I chose the other fix offered: add the ICBM together with its research in the ICBM job.
- **A top hit chance for each missile type after the shield.** It is not needed. With base chances 25 / 20 / 10% and Shield x1.8, the tops are 45 / 36 / 18%, the same as the critic's caps.
- **Moving the computer's old out-of-range stock to another silo.** Left out to keep it simple. The computer builds its next silo nearer the enemy instead.
- **Cruise missiles fired at a moving force (CoN style).** Not added now. The cruise versions get their own limits instead. It could come later with ship-launched cruise missiles (Question 5).
