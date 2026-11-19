# Iron Meridian: World War III - Doctrines (nation groups)

**Status: plan only, nothing built, no picture made.** Written 18 November 2026 from the owner's brief of 15 November (`docs/QUEUE.md`, item 1). **The owner answered all ten questions on 18 November 2026** (section 10): the suggested answers, except the art question, where every group gets its own pictures and each unit has 3 looks (sections 3, 8, 9).

Short version: every nation belongs to one of five groups. Each group has one small strength and one small weakness. Every unit gets a real model name per look (3 looks: levels 1-3, 4-6 and 7-8; `docs/RESEARCH.md` section 14), shown as "T-90 · Main Battle Tank" with the group's colour stripe. Versions differ by a few percent. Five unique units, one per group. Pictures: **every group has its own design for every unit** (Export too), 3 looks each, every look a new generation: **365 pictures, about $14.60, plus about $1.10 for the Gemini check** (section 8).

---

## 1. The five groups and their identity

| Group | Key | Colour | Identity | Strength | Weakness |
|---|---|---|---|---|---|
| **US/NATO** | `nato` | blue `#3f7fe0` | Quality | attack **+10%** | every unit costs **10% more** |
| **Eastern** | `east` | crimson `#a3283f` | Mass | units cost **10% less** and train **15% faster** | attack and defence **-7%** |
| **China** | `china` | gold `#e8b23a` | Production | units train **25% faster** | defence **-5%** |
| **Europe** | `europe` | teal `#36a8b4` | Technology | research runs **15% faster** | every unit costs **5% more** |
| **Export** | `export` | sand `#b89a62` | Home Guard | forces in their own provinces take **10% less damage** | research runs **10% slower** |

"Units" means everything built in an Army Base, Airbase or Naval Yard (missiles and buildings are not affected). Costs mean money and materials, as the old doctrines did.

**Why it is balanced.** The measure is fighting value per money spent: attack x defence / cost, at the same economy.

| Group | Value per money | Extra | Net |
|---|---|---|---|
| US/NATO | 1.10 x 1.00 / 1.10 = **1.00** | none | even |
| Eastern | 0.93 x 0.93 / 0.90 = 0.96 | 15% faster training (forces arrive sooner, worth about +4%) | about even |
| China | 1.00 x 0.95 / 1.00 = 0.95 | 25% faster training (about +5%) | about even |
| Europe | 1.00 x 1.00 / 1.05 = 0.95 | 15% faster research: upgrades and looks come about 15% sooner (about +5%) | about even |
| Export | 1.00 at home, 1.11 when defending | 10% slower research (about -5%) | even at home, a little behind abroad; fits the smaller C and B nations, which mostly defend |

The build checks this with `tools/balance.js` and `tools/combat-pace.js` (each group's army against each other group's, same money): no group may come out more than 3% ahead; if one does, its strength is trimmed by a point or two.

**It reuses what is there.** The game already has three doctrines in `rules/data.js` (`DOCTRINES`: Precision, Mass, Defence in Depth), switched off since `N.doc` is always empty. Their hooks are wired: attack and defence (`stRows` in `rules/state.js`), cost (`ucost`), training time (`trainEff`), research time (`rHours`) and damage taken at home (combat and tick). The five groups replace those three entries and use the same hooks; the groups are close relatives of them (US/NATO of Precision, Eastern of Mass, Export of Defence in Depth). A nation's group is fixed by its nation, not picked.

---

## 2. All nations by group

`nations.js` has **68 playable nations**, the same as the owner's number. Every one is in exactly one group, picked by the main equipment its forces use today (where it buys its tanks, jets and ships), not by its politics.

| Group | Count | Tiers | Nations |
|---|---|---|---|
| **US/NATO** | 14 | 1 S, 3 A, 6 B, 4 C | United States (S), Canada (A), Turkey (A), Japan (A), Australia (B), Poland (B), Egypt (B), Saudi Arabia (B), South Korea (B), Philippines (B), Romania (C), Israel (C), Morocco (C), New Zealand (C) |
| **Europe** | 12 | 4 A, 3 B, 5 C | United Kingdom (A), France (A), Germany (A), Brazil (A), Italy (B), Spain (B), Ukraine (B), Sweden (C), Norway (C), Finland (C), Greece (C), Chile (C) |
| **Eastern** | 15 | 2 S, 1 A, 4 B, 8 C | Russia (S), India (S), Iran (A), Kazakhstan (B), Algeria (B), Vietnam (B), Ethiopia (B), Belarus (C), Uzbekistan (C), Mongolia (C), Syria (C), North Korea (C), Angola (C), Venezuela (C), Cuba (C) |
| **China** | 6 | 1 S, 1 A, 3 B, 1 C | China (S), Pakistan (A), Myanmar (B), Tanzania (B), Sudan (B), Bangladesh (C) |
| **Export** | 21 | 3 A, 8 B, 10 C | Nigeria (A), Indonesia (A), Mexico (A), Iraq (B), DR Congo (B), South Africa (B), Thailand (B), Afghanistan (B), Argentina (B), Colombia (B), Peru (B), Yemen (C), Libya (C), Kenya (C), Mali (C), Chad (C), Mozambique (C), Cameroon (C), Malaysia (C), Ecuador (C), Bolivia (C) |
| **Total** | **68** | 4 S, 12 A, 24 B, 28 C | |

Choices worth a look (section 10, question 2):

- **Ukraine in Europe**, not Eastern: its army is moving to Western equipment, and a "Russia/Eastern" label on Ukraine would read badly.
- **India in Eastern**: most of its tanks, jets, SAMs and submarines are Russian designs (T-90, Su-30, S-400).
- **Turkey, Egypt, Saudi Arabia, Morocco, Poland, Romania in US/NATO**: American tanks, jets and air defence.
- **Brazil and Chile in Europe**: Leopard tanks, Swedish jets (Brazil), European frigates and submarines.
- **China's group is small (6)** because few nations field mostly Chinese equipment; Export holds the mixed buyers.

---

## 3. Every unit: three model names per group, and small version differences

How to read the tables: the three columns are the three looks (look 1 at levels 1-3, look 2 at 4-6, look 3 at 7-8; see `docs/RESEARCH.md` 14.1). Each look is a new generation of the unit, and its name is the model of that generation. **The owner's decision of 18 November cut the names from four to three per unit**: the tables kept the first, the third and the fourth name of the earlier four-name version (the oldest, the main modern one and the newest), because the second name was usually an upgrade of the first, not a new generation. Exceptions: the US/NATO tank keeps M60A3, M1 and M1A2 SEPv3 (the M1A2 is the same generation as the SEPv3); the European jammers keep their first, second and fourth name (the third is still to be found). The Recon UAV columns follow its generations (UAV I-III, IV, V; see `docs/RESEARCH.md` 14.1). Names are bare designations (section 6). A dagger (†) marks a prototype or planned type; a double dagger (‡) marks a name to be checked before the build (real designations are hard to confirm).

**Export** fields the most widely exported models of each era, from every maker. Its names come from those models, but **its pictures are its own** (owner, 18 November): original designs of the mixed, widely exported older-pattern look, not borrowed from another group (section 8).

### 3.1 Infantry

**Motorized Infantry** (and **Paratroopers**, which share its picture and so share its names: "M4A1 · Paratroopers"). Named by the service rifle, which is what the soldier picture shows.

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | M16A1 | M4A1 | M7 |
| Eastern | AKM | AK-74M | AK-12 |
| China | Type 56 | QBZ-95 | QBZ-191 |
| Europe | G3A3 | G36A2 | G95A1 |
| Export | AKM | AK-103 | M4 |

**Anti-Tank Infantry** (named by its missile).

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | M47 | FGM-148 | FGM-148F |
| Eastern | 9K111 | 9K115-2 | 9K135 |
| China | HJ-73 | HJ-9 | HJ-12 |
| Europe | LRAC F1 | NLAW | MMP |
| Export | 9M14 | HJ-8E | 9K135 |

**Special Forces** (named by the short carbine).

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | XM177E2 | Mk 18 Mod 1 | M7 |
| Eastern | AKMS | AK-105 | AK-12K ‡ |
| China | Type 56-1 | QBZ-95-1 | QBZ-192 |
| Europe | MP5 | G36KA4 | G95K |
| Export | AKMS | M4 | AK-104 |

### 3.2 Ground vehicles

**Infantry Fighting Vehicle**

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | M2A1 | M2A3 | XM30 † |
| Eastern | BMP-1 | BMP-3 | T-15 |
| China | Type 86 | ZBL-08 | ZBD-04A |
| Europe | AMX-10P | Strf 9040C | VBCI-2 |
| Export | BMP-1 | M2A2 | BMP-3M |

**Main Battle Tank**

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | M60A3 | M1 | M1A2 SEPv3 |
| Eastern | T-72 | T-90 | T-14 |
| China | Type 79 | Type 96A | Type 99A |
| Europe | AMX-30B2 | AMX-56 | KF51 † |
| Export | T-55 | T-72M1 | VT-4 |

(Europe avoids the brand names Leopard and Leclerc: AMX-56 is the Leclerc; the Challenger 1 designation FV4030/4 is kept for later; see section 6.)

**Mobile Artillery**

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | M109A2 | M109A6 | M109A7 |
| Eastern | 2S1 | 2S19 | 2S35 |
| China | Type 83 | PLZ-05 | PCL-181 |
| Europe | AuF1 | PzH 2000 | RCH 155 |
| Export | 2S1 | 2S19 | SH-15 |

**Rocket Artillery**

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | M270 | M142 | M270A2 |
| Eastern | BM-21 | BM-30 | 9K515 |
| China | Type 81 | PHL-03 | PHL-16 |
| Europe | LARS 2 | MARS II | M270A2 |
| Export | Type 63 | BM-27 | SR5 |

**Mobile SAM**

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | MIM-23B | MIM-104F | MIM-104F MSE |
| Eastern | 9K37 | S-400 | S-500 |
| China | HQ-7 | HQ-9 | HQ-9B |
| Europe | Roland 2 | SAMP/T | SAMP/T NG |
| Export | S-125 | 9K37M1 | FD-2000 |

**Mobile Jammer** (it defends against drones, so China's line uses its anti-drone gun and laser vehicles; European jamming trucks have few public designations, ‡ to find in the build)

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | AN/MLQ-34 | AN/VLQ-12 | TLS-BCT |
| Eastern | SPN-2 | 1L269 | RB-109A |
| China | Type 95 | PGL-625 | LW-30 |
| Europe | Hummel ‡ | Fuchs EloKa ‡ | name to find ‡ |
| Export | SPN-2 | Type 95 | 1L269 |

### 3.3 Aircraft

**Attack Helicopter**

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | AH-1F | AH-64D | AH-64E |
| Eastern | Mi-24V | Ka-52 | Mi-28NM |
| China | Z-9W | Z-10 | Z-10ME |
| Europe | PAH-1 | EC665 | AW249 |
| Export | Mi-24D | Mi-35M | Z-10ME |

**Interceptor**

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | F-4E | F-14D | F-15EX |
| Eastern | MiG-23 | MiG-31 | MiG-31BM |
| China | J-7 | J-10A | J-10C |
| Europe | F-104G | JAS 39C | JAS 39E |
| Export | MiG-21bis | MiG-29 | JF-17 Block III |

**Strike Fighter**

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | F-16A | F/A-18E | F-35A |
| Eastern | MiG-27 | Su-34 | Su-34M |
| China | Q-5 | J-16 | J-35A |
| Europe | PA-200 | EF-2000 T3 | F-35A |
| Export | Su-22M4 | Su-30MK2 | J-10CE |

**Air Superiority Fighter**

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | F-15A | F-22A | F-47 † |
| Eastern | Su-27 | Su-35S | Su-57 |
| China | J-11 | J-20 | J-36 † |
| Europe | F-4F | EF-2000 T1 | EF-2000 T4 |
| Export | MiG-23MF | Su-27SK | Su-35SE |

**Recon UAV** (its looks follow its generations: UAV I; UAV II-III; UAV IV, the first armed one; UAV V)

| Group | UAV I-III | UAV IV | UAV V |
| --- | --- | --- | --- |
| US/NATO | RQ-2A | MQ-9A | RQ-170 |
| Eastern | Pchela-1T | Forpost-R | S-70 |
| China | ASN-206 | GJ-2 | WZ-7 |
| Europe | CL-289 | MQ-9A | nEUROn † |
| Export | Searcher II | TB2 | CH-7 † |

**Swarm Drones**

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | Perdix | LASSO-300 ‡ | LASSO-600 ‡ |
| Eastern | KUB-BLA | Lancet-3 | Izdeliye 53 |
| China | ASN-301 | FH-901 | FH-97A |
| Europe | DAR | Warmate | HX-2 |
| Export | Harpy | KUB-BLA | Lancet-3 |

**Strike Drone**

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | MQ-1C | XQ-58A | YFQ-42A |
| Eastern | Geran-2 | Grom † | S-70B ‡ |
| China | CH-4B | CH-7 † | GJ-11 |
| Europe | MQ-9A | nEUROn † | Taranis † |
| Export | Shahed-136 | GJ-2 | TB3 |

**Maritime Patrol Aircraft**

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | P-3A | P-8A | MQ-4C |
| Eastern | Be-12 | Tu-142M3 | Il-38N |
| China | SH-5 | KQ-200 | Y-9Q ‡ |
| Europe | Br 1150 | ATL2 | P-8A |
| Export | Be-12 | Il-38 | C-295MPA |

**AWACS** (Europe flies the same NATO aircraft as the US)

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | E-2C | E-3G | E-7A |
| Eastern | Tu-126 | A-50U | A-100 † |
| China | KJ-200 | KJ-500 | KJ-500A |
| Europe | E-2C | E-3F | E-7A |
| Export | Ka-31 | EMB-145 AEW | A-50EI |

**Heavy Bomber** (Europe has no heavy bombers of its own and fields the NATO-shared American ones)

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | B-52G | B-1B | B-52J † |
| Eastern | Tu-16 | Tu-22M3 | Tu-160M |
| China | H-5 | H-6K | H-6N |
| Europe | B-52G | B-1B | B-52J † |
| Export | Tu-16 | Tu-22M3 | H-6K |

**Stealth Bomber** (only the US has flown real ones; the others use their newest bomber programmes)

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | B-2A Block 10 | B-2A Block 30 | B-21A |
| Eastern | Tu-160 | Tu-160M2 | PAK DA † |
| China | H-6N | H-20 † | H-20A † |
| Europe | B-2A Block 10 | B-2A Block 30 | B-21A |
| Export | Tu-160 | Tu-160M2 | PAK DA † |

### 3.4 Ships

Ships are named by class designation (hull number or project number), which is how navies list them.

**Frigate**

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | FF-1052 | LCS-2 | FFG-62 |
| Eastern | Project 1135 | Project 22350 | Project 22350M |
| China | Type 053H | Type 054A | Type 054B |
| Europe | Type 122 | FREMM | Type 26 |
| Export | Project 1159 | F-22P | Type 054A/P |

**Cruiser**

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | CG-26 | DDG-51 Flight III | DDG-1000 |
| Eastern | Project 956 | Project 1144 | Project 1144M |
| China | Type 051 | Type 052D | Type 055 |
| Europe | Type 42 | Horizon | Type 45 |
| Export | Project 61 | Type 051C | Type 052D |

**Attack Submarine**

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | SSN-637 | SSN-21 | SSN-774 Block V |
| Eastern | Project 641 | Project 971 | Project 885M |
| China | Type 033 | Type 039A | Type 093B |
| Europe | Type 209 | Astute | Suffren |
| Export | Project 633 | Project 636 | S26T |

**Aircraft Carrier**

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | CV-41 | CVN-68 | CVN-78 |
| Eastern | Project 1143 | Project 1143.5 | Project 23000E † |
| China | Type 001 | Type 003 | Type 004 † |
| Europe | Clemenceau | Charles de Gaulle | Queen Elizabeth |
| Export | Colossus | Project 1143.4 | Type 002 |

### 3.5 Missiles (silo menu; names only, no pictures in this plan)

Missiles have no looks in `docs/RESEARCH.md` 14.3, so their name follows the same rule on the Strategic Weapons line (1 + steps done in it; names at levels 1-3, 4-6 and 7-8). Names only, no pictures (owner, 18 November).

**Cruise Missile**

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | AGM-86B | AGM-158A | AGM-158B |
| Eastern | Kh-55 | Kh-101 | 3M22 |
| China | CJ-10 | CJ-100 | YJ-21 |
| Europe | AS-30L | KEPD 350 | FC/ASW † |
| Export | P-15M | 3M-14E | CJ-10 |

**Ballistic Missile**

| Group | Look 1 | Look 2 | Look 3 |
| --- | --- | --- | --- |
| US/NATO | MGM-31A | MGM-140B | LRHW |
| Eastern | R-17 | 9K720 | Kh-47M2 |
| China | DF-11 | DF-16 | DF-17 |
| Europe | Pluton | MGM-140B | LRHW |
| Export | R-17E | 9K720E | DF-11A |

### 3.6 Version differences (small, matching the real equipment)

Each group's version of a unit trades one stat for another: **+4% in one, -4% in another**, the same at all three looks. The trade follows the real kit: American vehicles are heavier and better protected but slower, Russian ones lighter and lower or harder-hitting with thinner armour, Chinese ones quicker, European ones accurate guns. Export versions and the infantry types have no trade (they are the baseline). The trade stacks with the group identity (section 1).

| Unit | US/NATO | Eastern | China | Europe |
|---|---|---|---|---|
| Infantry, Paratroopers, Special Forces, Anti-Tank | none | none | none | none |
| Infantry Fighting Vehicle | +def -spd | +atk -def | +spd -def | +atk -spd |
| Main Battle Tank | +def -spd | +spd -def | +atk -def | +atk -spd |
| Mobile Artillery | +def -spd | +atk -spd | +spd -def | +atk -spd |
| Rocket Artillery | +atk -def | +atk -spd | +spd -def | +def -spd |
| Mobile SAM | +atk -spd | +atk -def | +spd -def | +def -spd |
| Mobile Jammer | none | none | none | none |
| Attack Helicopter | +def -spd | +atk -def | +spd -def | +spd -atk |
| Interceptor | +atk -spd | +spd -def | +atk -def | +spd -atk |
| Strike Fighter | +def -spd | +atk -def | +atk -spd | +atk -def |
| Air Superiority Fighter | +def -spd | +spd -def | +atk -def | +atk -spd |
| Recon UAV | +def -spd | +spd -def | +spd -def | +def -spd |
| Swarm Drones | none | none | none | none |
| Strike Drone | +def -spd | +spd -def | +atk -def | +def -spd |
| Maritime Patrol Aircraft | +atk -spd | +spd -def | +atk -def | +def -spd |
| AWACS | none | none | none | none |
| Heavy Bomber | +def -spd | +spd -def | +atk -def | +def -spd |
| Stealth Bomber | +def -spd | +spd -def | +atk -def | +def -spd |
| Frigate | +def -spd | +atk -def | +spd -atk | +def -atk |
| Cruiser | +def -spd | +atk -def | +atk -spd | +def -atk |
| Attack Submarine | +def -spd | +spd -def | +atk -def | +def -spd |
| Aircraft Carrier | +def -spd | +atk -def | +spd -def | +def -spd |

**How they keep balance.** Every trade is 4% up and 4% down, so no version is better overall, only different; the attack-for-defence trades leave attack x defence unchanged (1.04 x 0.96 = 0.998). The group identity of section 1 is the only real bonus or malus. The balance run of section 1 is made with the trades in; if a group's mix of trades tips it more than 3%, the trade on its weakest-fitting unit is dropped.

---

## 4. Unique units (one per group)

Five units only one group can build, each a variant of a unit already in the game, so the rules reuse what exists. Each has one name and one picture (no looks, drawn in its group's own design), and sits in its parent unit's research column, hidden for the other groups.

| Group | Unit | Parent (research column) | What it does | Proposed numbers |
|---|---|---|---|---|
| US/NATO | **AC-130J · Gunship** | Strike Fighter (Tactical Air), day 8 | slow, heavily armed aircraft that circles over a province and shreds infantry and light vehicles; easy prey for fighters and SAMs | cost 96, atk 9, def 2, hp 14, spd 10; vs soft x2.0, armoured x1.2; SAMs and fighters hit it x1.5 |
| Eastern | **TOS-1A · Thermobaric Launcher** | Rocket Artillery, day 7 | short-range rocket launcher on a tank hull; devastating against infantry in cities and behind fortifications | cost 58, atk 9, def 3, hp 11, spd 5; vs soft x2.0; ignores half the Fortifications bonus; must stand in or next to the target province |
| China | **DF-21D · Anti-Ship Ballistic Missile** | Strategic Weapons (silo), day 9 | a ballistic missile that hits ships at sea; needs a spotter on the target (UAV, patrol aircraft, satellite) | cost 120, range 60, power 12 against ships only, x1.5 against a carrier |
| Europe | **Type 212A · Air-Independent Submarine** | Attack Submarine (Navy), day 6 | quiet non-nuclear submarine: much harder to find, a little slower | cost 54, atk 6, def 2, hp 9, spd 4.6; Maritime Patrol Aircraft and Frigates hit it 30% less |
| Export | **Technical** | Motorized Infantry (Infantry Corps), day 1 | a pickup truck with a machine gun: very cheap, very fast, fragile; good for raids and taking empty land | cost 14, mp 4, atk 3, def 1, hp 6, spd 9, build 12 h; needs only an Army Base I |

Kept to five on purpose; ideas left out for later: a tiltrotor transport (US/NATO), a hypersonic glide missile (Eastern and China), a carrier-based drone.

---

## 5. Display

**Name.** Everywhere a unit's name shows in full (research card, unit details, Mobilize list, map tooltip), it reads **model · type**, model first and bold, type in the normal weight:

> **T-90** · Main Battle Tank

The short code (MBT, STK...) stays in the army bar diamonds and counters. The name follows the owner's look: at levels 1-3 a Russian tank reads "T-72 · Main Battle Tank", at 4-6 "T-90 · Main Battle Tank", at 7-8 "T-14 · Main Battle Tank". An enemy's units show the enemy's group and level.

**Emblem stripe.** On the research card (and the column header of that unit), a 6 px vertical stripe on the card's left edge in the group colour, with the group emblem in a small white diamond at its top. The card with all three looks side by side (`docs/RESEARCH.md` 14.4) puts the model name under each look.

```
| ◆ | [picture]   T-80 · Main Battle Tank
|   |             Look 2 of 3 · level 4
|   |             Eastern · Mass
```

**Emblems** (original simple shapes, drawn in code, no real insignia):

| Group | Emblem |
|---|---|
| US/NATO | white upward double chevron on blue |
| Eastern | white six-sided shield on crimson |
| China | dark red triangle with a dot on gold |
| Europe | white open ring crossed by a bar on teal |
| Export | white globe lines on sand |

No national flags, no real military insignia: no five-pointed national star, no red star or hammer and sickle (banned in some countries), no NATO compass rose, no ring of EU stars. The research header colour of `docs/QUEUE.md` (item 10 of the research-screen job: "red for the Eastern group, blue for the Western group") takes the group colour from this table.

---

## 6. Trademark flags

The game uses **bare designations only** (the military's own type number), never a maker's logo or a product nickname. The tables in section 3 already do this. The names below are likely trademarks of the makers (some makers license them to games and have taken game studios to court) and are **not used**:

| Likely trademark | Use instead |
|---|---|
| Apache, Apache Longbow, Apache Guardian | AH-64A, AH-64D, AH-64E |
| Cobra, SuperCobra | AH-1F, AH-1W |
| Black Hawk, Chinook, Osprey | UH-60, CH-47, MV-22 (not in the game today) |
| Lightning II | F-35A |
| Fighting Falcon, Viper | F-16A, F-16C |
| Eagle, Eagle II, Raptor, Tomcat, Phantom II, Tiger II, Super Hornet | F-15A/C, F-15EX, F-22A, F-14A/D, F-4E, F-5E, F/A-18E |
| Abrams, Bradley, Paladin, Stryker, Humvee | M1, M2, M109A6, M1126, M998 |
| Patriot, Hawk, Avenger | MIM-104, MIM-23 |
| Javelin, TOW, Dragon, Stinger, Hellfire | FGM-148, BGM-71, M47, FIM-92, AGM-114 |
| Tomahawk, JASSM | BGM-109, AGM-158 |
| HIMARS, MLRS, PULS, GMARS | M142, M270, M270A2 |
| Reaper, Predator, Gray Eagle, Global Hawk, Triton, Valkyrie | MQ-9, RQ-1/MQ-1, MQ-1C, RQ-4, MQ-4C, XQ-58A |
| Hawkeye, Sentry, Wedgetail | E-2C, E-3, E-7A |
| Orion, Poseidon (US aircraft) | P-3, P-8A |
| Spirit, Raider, Lancer, Stratofortress | B-2A, B-21A, B-1B, B-52H |
| Switchblade, Coyote | no bare designation exists; the US swarm uses Perdix, LOCUST and LASSO (‡) instead |
| Leopard, Leclerc, Challenger | AMX-56 for the Leclerc, FV4030/4 for the Challenger 1; no bare designation exists for the Leopard, so Europe uses French and British tanks plus the KF51 |
| Rafale, Mirage, Typhoon, Gripen, Tornado | Rafale not used; F1C, M2000C/D; EF-2000; JAS 39C/E; PA-200 |
| Tiger, Mangusta | EC665, A129 |
| CV90, Puma, Boxer, Lynx | Strf 9040C (Swedish Army number); the others not used |
| CAESAR, Archer | not used (AuF1, PzH 2000, RCH 155 instead) |
| MILAN, HOT, Spike | not used (LRAC F1, PzF 3, NLAW, MMP) |
| Storm Shadow, Taurus, Meteor, Aster | SCALP-EG and KEPD 350 (designations; check, see question 7), SAMP/T |
| MEKO, Gowind | not used (Type 054A/P, F-22P) |
| GlobalEye, Erieye | E-7A for Europe; EMB-145 AEW for Export |
| Bayraktar | TB2, TB3 |
| Wing Loong, Sharp Sword | GJ-2, GJ-11 |
| Armata, Kurganets | T-14, T-15 |
| Iskander, Kalibr, Zircon, Kinzhal, Tochka, Scud | 9K720, 3M-14, 3M22, Kh-47M2, 9K79-1, R-17 |
| Buk, Tor, Pantsir, Triumf, Kub | 9K37, S-400, 2K12 |
| Fagot, Konkurs, Metis, Kornet | 9K111, 9K113, 9K115-2, 9K135 |
| Smerch, Uragan, Grad, Tornado-S, Solntsepyok | BM-30, BM-27, BM-21, 9K515, TOS-1A |
| Msta, Koalitsiya, Gvozdika | 2S19, 2S35, 2S1 |
| Krasukha, Leer, Bylina | 1L269, RB-341V, RB-109A |
| Okhotnik, Orion (Russian drone), Shahed / Geran | S-70; Forpost-R; Orlan-10, Grom and Geran-2 kept (state names, low risk; question 7) |
| Kalashnikov, AK-47 (Kalashnikov Concern licenses these to games) | AKM, AK-74, AK-12 kept as army designations (low to medium risk; question 7); never "Kalashnikov" |
| Ghostrider (AC-130J), Toyota (technicals) | AC-130J; "Technical", no truck brand named or drawn |

Pictures never show a maker's logo, a national marking or a squadron badge (Art Bible).

---

## 7. Research-card picture filter

**Owner's answer 18 November: yes (suggested answer). Note, same day: with the new pictures this filter may no longer be needed.** It was planned to make today's three mixed picture sources read as one set. The new unit pictures are all made in one style (`docs/UNIT-LOOKS-PROMPTS.md`), and a teal tint would hide the paint colours that tell the groups apart. Suggestion: build the filter as a switch, show the sample tanks with and without it, and let the owner pick. The filter itself, drawn in code at no picture cost:

1. **Monochrome tint.** The picture is turned to greyscale and tinted one colour for all groups: a tactical-monitor teal (dark `#0b1a1c` to bright `#9ff0e0`), close to the game's accent colour. One SVG colour-matrix filter, defined once.
2. **Scanlines.** A fine horizontal line pattern over the picture (1 px dark line every 3 px, about 15% opacity).
3. **Vignette and glow.** A soft dark edge and a faint teal glow around the unit.
4. **Corner brackets.** Four thin corner marks, like a targeting display.

The group shows through the emblem stripe and the name, not the tint, so all groups' pictures stay one set. Where: the research tree's card, the three-looks card and the column header. The map, army bar and Mobilize list keep the pictures in colour (the owner can extend the filter later). Optional: the tint in the group colour instead (one line to change).

---

## 8. Art: count and cost (rewritten 18 November 2026 to the owner's decision)

**The decision.** Every one of the five groups (US/NATO, Eastern, China, Europe, Export) has its **own design for every unit**: no shared Western or Eastern family, and Export no longer borrows. Each unit has **3 looks** (levels 1-3, 4-6, 7-8), and each look is **a new generation that replaces the old model**, drawn fresh, spread across the 8 levels. The same pictures are used on the research card, in the army bar's unit details and for the map figures (`docs/RESEARCH.md` 14.4 and 14.8). Paratroopers share the infantry pictures. Missiles have names only.

**Count (changed 18 November 2026, second decision: three pictures per look).** Every look now has **three pictures of the same vehicle**: a side view (3/4 view, cut out, for the research tree's diamond), a card scene (the unit in action in its natural setting, for the card that opens when a node is tapped; the blue monitor tint and scanlines are drawn in code) and a top-down (for the map and army bar). Side view first; the scene and the top-down are made from it, so all three show the same shape, paint and details.

| Part | Looks | Pictures |
|---|---|---|
| 24 picture sets (the 25 unit types, Paratroopers sharing the Motorized Infantry set) x 5 groups x 3 looks | 360 | 1,080 |
| Five unique units, one look each | 5 | 15 |
| **Total** | **365 looks** | **1,095 pictures** (365 x 3) |

(The 24 sets: Motorized Infantry with Paratroopers, Anti-Tank Infantry, Special Forces, Infantry Fighting Vehicle, Main Battle Tank, Mobile Artillery, Mobile SAM, Mobile Jammer, Rocket Artillery, Attack Helicopter, Interceptor, Strike Fighter, Air Superiority Fighter, Recon UAV, Swarm Drones, Strike Drone, Maritime Patrol Aircraft, AWACS, Heavy Bomber, Stealth Bomber, Frigate, Cruiser, Attack Submarine, Aircraft Carrier.) **Made so far: the Main Battle Tank, all 5 groups x 3 looks = 15 looks, 45 pictures (branch `unit-art`).**

**Cost, measured on the 45 tank pictures** (batch mode, 1K; log `assets/art-src/gen-art-log.jsonl`): a picture averaged **$0.0346** (side $0.0365, scene $0.0326, top-down $0.0348); the single check on a picture averaged **$0.0033**; the three-way check on a look averaged **$0.0082**. So a look costs 3 x ($0.0346 + $0.0033) + $0.0082 = **about $0.122**.

| | Count | Cost |
|---|---|---|
| 1,095 pictures at $0.0346 | 1,095 | about **$37.89** |
| The single check on every picture (about $0.0033) | 1,095 | about **$3.61** |
| The three-way check on every look (about $0.0082) | 365 | about **$2.99** |
| **Whole job** | | **about $44.49** |
| Already spent (the 15 tank looks: 45 pictures, 45 single checks, 15 three-way checks, plus 5 failed single checks that cost nothing and 5 repeated checks) | | about $1.83 |
| **Still to do: 350 looks, 1,050 pictures** | | **about $42.67** |

**The owner removed the $12 line** (18 November 2026, "no $12 limit, I want it perfect"). The old numbers (365 pictures, $14.60 plus $1.10 of checks, about $15.70, the 228-picture limit under the $12 line) are replaced by the table above. **Money:** the Gemini balance was $40.88 when the log stood at 255 calls and about $10.27; at the log's estimate about **$39.05** is left after the tank sets. The rest of the job needs about $42.67 plus the $5 floor gen-art keeps (it refuses a run that could take the estimated balance below $5), so about **$8.6 more** must be topped up before the last batches. The price of the check is an estimate (Google's price page could not be reached; the check model id `gemini-3.8-flash` was confirmed in Google's model list; the earlier `gemini-2.5-flash` answers 404, closed to new users).

**Order:** the tank sets first (done, shown to the owner), then the units seen most on the map (tank, infantry fighting vehicle, artillery, SAM, frigate, cruiser, submarine, strike fighter, interceptor, helicopter), all five groups of each unit, then the rest, in batches of about 30 pictures, the running total and the estimated balance reported after every batch.

**Today's pictures: none is kept as a look.** The owner wants one consistent set of quality ("so nothing has to be redone"), and today's pictures come from mixed sources: 14 older ones on black, 15 Higgsfield ones on white, and the research tree's separate `ri-u_*` scenes in a third, photographic style. They are dark, weathered photographs from above, they differ in size and framing, none is in the building style (`docs/ART-BIBLE.md`), and several look like one real product (the strike fighter, the heavy and stealth bombers, the AWACS, the tank and the SAM truck), which the family-look rule forbids. Mixing even one into the set would show on the research card and the map. They stay in the game only as the fall-back for a look not yet made, and go when the new set is complete. The research card's `ri-u_*` unit scenes are replaced by the new cut-outs (a code change, no picture cost).

**Optional savings, for the owner to decide (none is applied; the owner's answer of 18 November is "no shared designs").** Each saving gives up the owner's rule "every group has its own pictures" for that unit. The counts and dollars in this table are the earlier ones, one picture per look; multiply by three for three pictures per look.

| Option | Pictures saved | Saved |
|---|---|---|
| Soldiers (Motorized Infantry with Paratroopers, Special Forces) share one design across the five groups. Soldiers are 3D models on the map, so the pictures show in panels only | 24 | about $1.03 |
| Swarm Drones share one design (small drones look alike) | 12 | about $0.52 |
| Mobile Jammer shares one design (a truck with antennas) | 12 | about $0.52 |
| Europe shares the US/NATO Heavy Bomber, Stealth Bomber and AWACS (section 3: Europe flies the same aircraft, with the same or nearly the same names) | 9 | about $0.39 |
| Export shares the Eastern Stealth Bomber (section 3: the same names) | 3 | about $0.13 |
| **All of the above** | **60** | **about $2.58**, leaving 305 pictures, about $13.10 |

Each saved look is now three pictures: the 60 looks above are 180 pictures, about $7.3 (at about $0.122 a look). None of them is applied; with the $12 line gone they are only a way to spend less.

**Picture rule for real models.** The Art Bible says "no real-product look-alikes". With real names, a picture carries the **family look** of its group (US/NATO tank: flat, angular turret; Eastern tank: low, rounded turret and reactive armour bricks; China: its own broad arrowhead turret; Europe: long, sleek, smoothly sloped; Export: a mix of widely exported older-pattern designs; a Western jet: intakes under the body; an Eastern jet: wide-spaced engines and twin tails) without copying any one real vehicle line for line. Owner's answer 18 November: yes. The Art Bible now carries the line (section "Unit pictures") and the Gemini check looks for it on every picture.

**Sample first (the owner's rule).** The exact prompts are in `docs/UNIT-LOOKS-PROMPTS.md` (and in `tools/gen-art.py`). Sequence: the owner approves the prompts; then the Main Battle Tank for all 5 groups, 3 looks = **15 pictures, about $0.60 plus about $0.05 in checks**, in two batches (look 1 of each group, then looks 2 and 3 from it), with the check on each; shown on the research card and on the map; the rest only after the owner's OK, with the check on every picture. Nothing is redone without the owner's word.

---

## 9. Build plan sketch

1. **Owner's OK** on this plan and the answers of section 10. No code and no picture before it.
2. **Groups in the nation table.** `tools/build-nations.js` gets a `group` for each nation and rebuilds `nations.js` (the file says to change the tool, not the file). New games set `N.doc` from it; old saves set it on load from the nation's name (`N.doc` is empty in every save today, so nothing is lost; the save version does not change).
3. **Rules data** (`rules/data.js`): the five groups replace the three old `DOCTRINES` entries (same hooks: `atk`, `def`, `cost`, `build`, `res`, `home`); a new `UNIT_NAMES[group][unit]` (three names) and `UNIT_TRADE[group][unit]` (the +4/-4 trade, applied in `stRows` next to the doctrine; speed needs one new line there); the five unique units in `UNITS` with `only: '<group>'`, and their research nodes hidden for other groups. The old doctrine picker stays hidden.
4. **Balance run.** `tools/balance.js` and `tools/combat-pace.js`, every group's army against every other with the same money; adjust by a point if one leads by more than 3%. Report to the owner.
5. **Screen** (`index.html`): "model · type" names, the emblem stripe and emblems, the research header colour, the research-card filter, the unique units' cards.
6. **Art**, after the owner's OK on the sample: the 365 pictures of section 8 (all five groups, 3 looks), in batches of about 30, one try each, with the Gemini check (`--review`) on every picture, cost logged after each batch, stop and ask at the $12 line (the full set does not fit under it). Map figures use the same pictures (`docs/RESEARCH.md` 14.8).
7. **Tests**: a new `.test/doctrines.js` (68 nations, each in one group; every unit has 3 names per group; every trade is +4/-4; the uniques only for their group; old saves get their group; a missing picture falls back to the nearest look); the existing tests still pass. A line in `RELEASES.md`; the dev build only until the owner moves it to public.

---

## 10. Questions for the owner, and the owner's answers (18 November 2026)

**The owner answered all ten with the suggested answer, except question 5 (art), where every group gets its own pictures, including Export, with 3 looks per unit.** The questions are kept below as asked.

1. **The five identities and numbers** of section 1? *Suggested: yes; the balance run may move one by a point or two.*  **Answered: yes.**
2. **The groups of section 2**, in particular Ukraine in Europe, India in Eastern, Turkey/Egypt/Saudi Arabia/Morocco in US/NATO, Brazil and Chile in Europe? *Suggested: yes.*  **Answered: yes.**
3. **Replace the three old doctrines** (Precision, Mass, Defence in Depth, switched off today) with the five groups, fixed by nation and not chosen by the player? *Suggested: yes.*  **Answered: yes.**
4. **The five unique units** of section 4? *Suggested: yes, one picture each.*  **Answered: yes.**
5. **Art option B** (two families, 151 pictures, about $6.04, plus about $0.20 for the uniques), tank sample first? *(Replaced by the owner's decision: section 8.)* *Suggested: yes.*  **Answered, changed:** not option B. Every group (US/NATO, Eastern, China, Europe, Export) has its own pictures for every unit, 3 looks per unit, each a new generation; 365 pictures (section 8). Tank sample first, with the Gemini check, shown on the research card and the map; the rest after the owner's OK.
6. **Pictures show the family look of the named model** but stay original designs (an Art Bible change)? *Suggested: yes.*  **Answered: yes.**
7. **Names with a small trademark risk** that have no other designation: Kalashnikov-pattern rifle names (AKM, AK-74, AK-12), Russian state drone names (Orlan-10, Forpost-R, Grom, Geran-2), SCALP-EG and KEPD 350. Keep, or swap for older types? *Suggested: keep (they are army designations); the US and European brand names of section 6 stay out.*  **Answered: yes** (keep).
8. **The ‡ names** (mainly the European jammers and the US swarm drones): checked and replaced if needed in the build, without asking again? *Suggested: yes.*  **Answered: yes.**
9. **The research-card filter**: one shared teal monitor tint with scanlines, research tree only? *Suggested: yes; group-coloured tint as a later option.*  **Answered: yes** (see the note in section 7).
10. **Paratroopers share the infantry names and pictures**, and missiles get names but no pictures for now? *Suggested: yes.*  **Answered: yes.**
