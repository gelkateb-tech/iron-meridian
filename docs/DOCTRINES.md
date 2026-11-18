# Iron Meridian: World War III - Doctrines (nation groups)

**Status: plan only, nothing built, no picture made.** Written 18 November 2026 from the owner's brief of 15 November (`docs/QUEUE.md`, item 1). Waiting for the owner's OK and the answers in section 10.

Short version: every nation belongs to one of five groups. Each group has one small strength and one small weakness. Every unit gets a real model name per look (levels 1, 3, 5, 7: the four looks of `docs/RESEARCH.md` section 14), shown as "T-80 · Main Battle Tank" with the group's colour stripe. Versions differ by a few percent. Five unique units, one per group. Pictures: two families of shapes (Western and Eastern) plus one shared research-card filter, about **151 pictures, about $6.04**.

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

## 3. Every unit: four model names per group, and small version differences

How to read the tables: the four columns are the four looks (look 1 at levels 1-2, look 2 at 3-4, look 3 at 5-6, look 4 at 7-8; see `docs/RESEARCH.md` 14.1). Names are bare designations (section 6). A dagger (†) marks a prototype or planned type; a double dagger (‡) marks a name to be checked before the build (real designations are hard to confirm).

**Export** fields the most widely exported models of each era, from every maker; it has no pictures of its own and borrows the picture of the model its name comes from (section 8).

### 3.1 Infantry

**Motorized Infantry** (and **Paratroopers**, which share its picture and so share its names: "M4A1 · Paratroopers"). Named by the service rifle, which is what the soldier picture shows.

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | M16A1 | M16A2 | M4A1 | M7 |
| Eastern | AKM | AK-74 | AK-74M | AK-12 |
| China | Type 56 | Type 81 | QBZ-95 | QBZ-191 |
| Europe | G3A3 | FAMAS F1 | G36A2 | G95A1 |
| Export | AKM | M16A2 | AK-103 | M4 |

**Anti-Tank Infantry** (named by its missile).

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | M47 | BGM-71D | FGM-148 | FGM-148F |
| Eastern | 9K111 | 9K113 | 9K115-2 | 9K135 |
| China | HJ-73 | HJ-8 | HJ-9 | HJ-12 |
| Europe | LRAC F1 | PzF 3 | NLAW | MMP |
| Export | 9M14 | 9K111 | HJ-8E | 9K135 |

**Special Forces** (named by the short carbine).

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | XM177E2 | M4A1 | Mk 18 Mod 1 | M7 |
| Eastern | AKMS | AKS-74U | AK-105 | AK-12K ‡ |
| China | Type 56-1 | Type 81-1 | QBZ-95-1 | QBZ-192 |
| Europe | MP5 | G36K | G36KA4 | G95K |
| Export | AKMS | AKS-74U | M4 | AK-104 |

### 3.2 Ground vehicles

**Infantry Fighting Vehicle**

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | M2A1 | M2A2 ODS | M2A3 | XM30 † |
| Eastern | BMP-1 | BMP-2 | BMP-3 | T-15 |
| China | Type 86 | ZBD-04 | ZBL-08 | ZBD-04A |
| Europe | AMX-10P | Marder 1A5 | Strf 9040C | VBCI-2 |
| Export | BMP-1 | BMP-2 | M2A2 | BMP-3M |

**Main Battle Tank**

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | M60A3 | M1 | M1A2 | M1A2 SEPv3 |
| Eastern | T-72 | T-80 | T-90 | T-14 |
| China | Type 79 | Type 88B | Type 96A | Type 99A |
| Europe | AMX-30B2 | FV4030/4 | AMX-56 | KF51 † |
| Export | T-55 | M60A3 | T-72M1 | VT-4 |

(Europe avoids the brand names Leopard and Leclerc: FV4030/4 is the Challenger 1, AMX-56 is the Leclerc; see section 6.)

**Mobile Artillery**

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | M109A2 | M109A5 | M109A6 | M109A7 |
| Eastern | 2S1 | 2S3 | 2S19 | 2S35 |
| China | Type 83 | PLZ-45 | PLZ-05 | PCL-181 |
| Europe | AuF1 | M109A3G | PzH 2000 | RCH 155 |
| Export | 2S1 | M109A5 | 2S19 | SH-15 |

**Rocket Artillery**

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | M270 | M270A1 | M142 | M270A2 |
| Eastern | BM-21 | BM-27 | BM-30 | 9K515 |
| China | Type 81 | PHZ-89 | PHL-03 | PHL-16 |
| Europe | LARS 2 | M270 | MARS II | M270A2 |
| Export | Type 63 | BM-21 | BM-27 | SR5 |

**Mobile SAM**

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | MIM-23B | MIM-104A | MIM-104F | MIM-104F MSE |
| Eastern | 9K37 | S-300PS | S-400 | S-500 |
| China | HQ-7 | HQ-16 | HQ-9 | HQ-9B |
| Europe | Roland 2 | MIM-104C | SAMP/T | SAMP/T NG |
| Export | S-125 | 2K12 | 9K37M1 | FD-2000 |

**Mobile Jammer** (it defends against drones, so China's line uses its anti-drone gun and laser vehicles; European jamming trucks have few public designations, ‡ to find in the build)

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | AN/MLQ-34 | AN/MLQ-40 | AN/VLQ-12 | TLS-BCT |
| Eastern | SPN-2 | R-330Zh | 1L269 | RB-109A |
| China | Type 95 | PGZ-07 | PGL-625 | LW-30 |
| Europe | Hummel ‡ | Fuchs EloKa ‡ | name to find ‡ | name to find ‡ |
| Export | SPN-2 | R-330Zh | Type 95 | 1L269 |

### 3.3 Aircraft

**Attack Helicopter**

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | AH-1F | AH-64A | AH-64D | AH-64E |
| Eastern | Mi-24V | Ka-50 | Ka-52 | Mi-28NM |
| China | Z-9W | Z-19 | Z-10 | Z-10ME |
| Europe | PAH-1 | A129 | EC665 | AW249 |
| Export | Mi-24D | AH-1W | Mi-35M | Z-10ME |

**Interceptor**

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | F-4E | F-14A | F-14D | F-15EX |
| Eastern | MiG-23 | MiG-25PD | MiG-31 | MiG-31BM |
| China | J-7 | J-8II | J-10A | J-10C |
| Europe | F-104G | F1C | JAS 39C | JAS 39E |
| Export | MiG-21bis | F-5E | MiG-29 | JF-17 Block III |

**Strike Fighter**

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | F-16A | F-16C | F/A-18E | F-35A |
| Eastern | MiG-27 | Su-24M | Su-34 | Su-34M |
| China | Q-5 | JH-7A | J-16 | J-35A |
| Europe | PA-200 | M2000D | EF-2000 T3 | F-35A |
| Export | Su-22M4 | F-16A | Su-30MK2 | J-10CE |

**Air Superiority Fighter**

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | F-15A | F-15C | F-22A | F-47 † |
| Eastern | Su-27 | Su-30SM | Su-35S | Su-57 |
| China | J-11 | J-11B | J-20 | J-36 † |
| Europe | F-4F | M2000C | EF-2000 T1 | EF-2000 T4 |
| Export | MiG-23MF | MiG-29A | Su-27SK | Su-35SE |

**Recon UAV** (its looks follow its generations: UAV I; UAV II-III; UAV IV, the first armed one; UAV V)

| Group | UAV I | UAV II-III | UAV IV | UAV V |
|---|---|---|---|---|
| US/NATO | RQ-2A | RQ-1A | MQ-9A | RQ-170 |
| Eastern | Pchela-1T | Orlan-10 | Forpost-R | S-70 |
| China | ASN-206 | BZK-005 | GJ-2 | WZ-7 |
| Europe | CL-289 | Sperwer | MQ-9A | nEUROn † |
| Export | Searcher II | CH-3A | TB2 | CH-7 † |

**Swarm Drones**

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | Perdix | LOCUST | LASSO-300 ‡ | LASSO-600 ‡ |
| Eastern | KUB-BLA | Lancet-1 | Lancet-3 | Izdeliye 53 |
| China | ASN-301 | CH-901 | FH-901 | FH-97A |
| Europe | DAR | Fire Shadow | Warmate | HX-2 |
| Export | Harpy | Shahed-131 | KUB-BLA | Lancet-3 |

**Strike Drone**

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | MQ-1C | MQ-9B | XQ-58A | YFQ-42A |
| Eastern | Geran-2 | Geran-3 | Grom † | S-70B ‡ |
| China | CH-4B | GJ-2 | CH-7 † | GJ-11 |
| Europe | MQ-9A | MQ-9B | nEUROn † | Taranis † |
| Export | Shahed-136 | CH-4B | GJ-2 | TB3 |

**Maritime Patrol Aircraft**

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | P-3A | P-3C | P-8A | MQ-4C |
| Eastern | Be-12 | Il-38 | Tu-142M3 | Il-38N |
| China | SH-5 | Y-8X | KQ-200 | Y-9Q ‡ |
| Europe | Br 1150 | Nimrod MR2 | ATL2 | P-8A |
| Export | Be-12 | P-3B | Il-38 | C-295MPA |

**AWACS** (Europe flies the same NATO aircraft as the US)

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | E-2C | E-3A | E-3G | E-7A |
| Eastern | Tu-126 | A-50 | A-50U | A-100 † |
| China | KJ-200 | KJ-2000 | KJ-500 | KJ-500A |
| Europe | E-2C | E-3A | E-3F | E-7A |
| Export | Ka-31 | ZDK-03 | EMB-145 AEW | A-50EI |

**Heavy Bomber** (Europe has no heavy bombers of its own and fields the NATO-shared American ones)

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | B-52G | B-52H | B-1B | B-52J † |
| Eastern | Tu-16 | Tu-95MS | Tu-22M3 | Tu-160M |
| China | H-5 | H-6D | H-6K | H-6N |
| Europe | B-52G | B-52H | B-1B | B-52J † |
| Export | Tu-16 | H-6D | Tu-22M3 | H-6K |

**Stealth Bomber** (only the US has flown real ones; the others use their newest bomber programmes)

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | B-2A Block 10 | B-2A Block 20 | B-2A Block 30 | B-21A |
| Eastern | Tu-160 | Tu-160M | Tu-160M2 | PAK DA † |
| China | H-6N | JH-XX † | H-20 † | H-20A † |
| Europe | B-2A Block 10 | B-2A Block 20 | B-2A Block 30 | B-21A |
| Export | Tu-160 | Tu-160M | Tu-160M2 | PAK DA † |

### 3.4 Ships

Ships are named by class designation (hull number or project number), which is how navies list them.

**Frigate**

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | FF-1052 | FFG-7 | LCS-2 | FFG-62 |
| Eastern | Project 1135 | Project 11540 | Project 22350 | Project 22350M |
| China | Type 053H | Type 053H3 | Type 054A | Type 054B |
| Europe | Type 122 | Type 23 | FREMM | Type 26 |
| Export | Project 1159 | Type 053H2 | F-22P | Type 054A/P |

**Cruiser**

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | CG-26 | CG-47 | DDG-51 Flight III | DDG-1000 |
| Eastern | Project 956 | Project 1164 | Project 1144 | Project 1144M |
| China | Type 051 | Type 052C | Type 052D | Type 055 |
| Europe | Type 42 | Type 124 | Horizon | Type 45 |
| Export | Project 61 | Project 956E | Type 051C | Type 052D |

**Attack Submarine**

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | SSN-637 | SSN-688 | SSN-21 | SSN-774 Block V |
| Eastern | Project 641 | Project 877 | Project 971 | Project 885M |
| China | Type 033 | Type 035 | Type 039A | Type 093B |
| Europe | Type 209 | Trafalgar | Astute | Suffren |
| Export | Project 633 | Type 209 | Project 636 | S26T |

**Aircraft Carrier**

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | CV-41 | CV-63 | CVN-68 | CVN-78 |
| Eastern | Project 1143 | Project 1143.4 | Project 1143.5 | Project 23000E † |
| China | Type 001 | Type 002 | Type 003 | Type 004 † |
| Europe | Clemenceau | Invincible | Charles de Gaulle | Queen Elizabeth |
| Export | Colossus | Clemenceau | Project 1143.4 | Type 002 |

### 3.5 Missiles (silo menu; names only, no pictures in this plan)

Missiles have no looks in `docs/RESEARCH.md` 14.3, so their name follows the same rule on the Strategic Weapons line (1 + steps done in it, names at 1, 3, 5, 7).

**Cruise Missile**

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | AGM-86B | BGM-109C | AGM-158A | AGM-158B |
| Eastern | Kh-55 | 3M-14 | Kh-101 | 3M22 |
| China | CJ-10 | CJ-10A | CJ-100 | YJ-21 |
| Europe | AS-30L | SCALP-EG | KEPD 350 | FC/ASW † |
| Export | P-15M | C-802 | 3M-14E | CJ-10 |

**Ballistic Missile**

| Group | Look 1 | Look 2 | Look 3 | Look 4 |
|---|---|---|---|---|
| US/NATO | MGM-31A | MGM-31C | MGM-140B | LRHW |
| Eastern | R-17 | 9K79-1 | 9K720 | Kh-47M2 |
| China | DF-11 | DF-15B | DF-16 | DF-17 |
| Europe | Pluton | Hadès | MGM-140B | LRHW |
| Export | R-17E | M-11 | 9K720E | DF-11A |

### 3.6 Version differences (small, matching the real equipment)

Each group's version of a unit trades one stat for another: **+4% in one, -4% in another**, the same at all four looks. The trade follows the real kit: American vehicles are heavier and better protected but slower, Russian ones lighter and lower or harder-hitting with thinner armour, Chinese ones quicker, European ones accurate guns. Export versions and the infantry types have no trade (they are the baseline). The trade stacks with the group identity (section 1).

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

Five units only one group can build, each a variant of a unit already in the game, so the rules reuse what exists. Each has one name and one picture (no looks), and sits in its parent unit's research column, hidden for the other groups.

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

> **T-80** · Main Battle Tank

The short code (MBT, STK...) stays in the army bar diamonds and counters. The name follows the owner's look: at levels 3-4 a Russian tank reads "T-80 · Main Battle Tank", at 5-6 "T-90 · Main Battle Tank". An enemy's units show the enemy's group and level.

**Emblem stripe.** On the research card (and the column header of that unit), a 6 px vertical stripe on the card's left edge in the group colour, with the group emblem in a small white diamond at its top. The card with all four looks side by side (`docs/RESEARCH.md` 14.4) puts the model name under each look.

```
| ◆ | [picture]   T-80 · Main Battle Tank
|   |             Look 2 of 4 · level 4
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

The unit pictures come from three sources (the older ones on black, the owner's Higgsfield ones on white, Gemini ones on grey) and do not quite match. One shared filter on the research card makes them read as one set, at no picture cost (it is drawn in code):

1. **Monochrome tint.** The picture is turned to greyscale and tinted one colour for all groups: a tactical-monitor teal (dark `#0b1a1c` to bright `#9ff0e0`), close to the game's accent colour. One SVG colour-matrix filter, defined once.
2. **Scanlines.** A fine horizontal line pattern over the picture (1 px dark line every 3 px, about 15% opacity).
3. **Vignette and glow.** A soft dark edge and a faint teal glow around the unit.
4. **Corner brackets.** Four thin corner marks, like a targeting display.

The group shows through the emblem stripe and the name, not the tint, so all groups' pictures stay one set. Where: the research tree's card, the four-looks card and the column header. The map, army bar and Mobilize list keep the pictures in colour (the owner can extend the filter later). Optional: the tint in the group colour instead (one line to change).

---

## 8. Art: count and cost

Price: about **$0.04 a picture** (Gemini batch, 1K, made by editing a reference picture so the unit keeps its shape and framing; measured $0.024 to $0.061). Balance about $15; the owner's stop-and-ask line is $12 of new spending (`docs/QUEUE.md`).

Picture sets: 24 units have looks (`docs/RESEARCH.md` 14.3): 2 soldier sets (Motorized Infantry with Paratroopers, Special Forces) and 22 vehicle, aircraft and ship sets. Each set has 4 looks.

**Three ways to do it:**

| Option | What each group gets | New pictures | Cost |
|---|---|---|---|
| A. One shape for all | the generic looks of `RESEARCH.md` 14, shared by every group; groups differ in name, stripe and filter only | 71 | about $2.84 |
| **B. Two families (suggested)** | a Western set (US/NATO and Europe) and an Eastern set (Eastern and China); Export borrows | **151** | **about $6.04** |
| C. Own pictures per group | US/NATO, Eastern, China and Europe each their own 4 looks | 311 | about $12.44 (over the $12 line) |

**Option B in detail (the cheapest that still shows the groups):**

| Part | Pictures |
|---|---|
| Soldiers, shared by all groups (soldiers look alike at this size): 2 sets x 3 new looks | 6 |
| Swarm Drones and Mobile Jammer, shared by all (small drones and trucks with antennas look alike): 2 sets x 3 new looks | 6 |
| Western family: 20 sets x 4 looks | 80 |
| Eastern family: 20 sets x 4 looks | 80 |
| less today's look-1 pictures, each kept by the family it looks closest to | -20 |
| less today's armed UAV (one family's UAV IV look) | -1 |
| **Total** | **151, about $6.04** (measured range $3.62 to $9.21) |
| Unique units, one picture each | 5, about $0.20 |
| **With the uniques** | **156, about $6.24** |

Per group under option B: US/NATO and Europe share about 70 new pictures, Eastern and China share about 70, all five share 12, Export needs **none** (it borrows the picture of the model its name comes from: a T-72M1 shows the Eastern T-72 look, an M60A3 the Western look 1). Under option C each of the four own-art groups would need 80.

**What keeps it cheap:**

- Export borrows every picture (saves 80+).
- Europe flies the same AWACS and bombers as the US, so it shares those for free even in option C.
- Soldiers, swarm drones and jammers are shared by everyone.
- Today's pictures are reused as look 1 of one family.
- Every picture is an edit of the family's look 1 (or of the previous look), one try each, in batches, so shapes and framing match and nothing is wasted on retries.
- The research-card filter (section 7) hides the small style differences between sources, so no old picture needs redoing.
- Missiles get no pictures now (optional later: 2 missiles x 4 looks x 2 families, 13 new, about $0.52).

**Picture rule for real models.** The Art Bible says "no real-product look-alikes". With real names, a picture should carry the **family look** of the named type (a Western tank: flat, angular turret; an Eastern tank: low, rounded turret and reactive armour bricks; a Western jet: twin or single tail with intakes under the body; an Eastern jet: wide-spaced engines and twin tails) without copying any one real vehicle line for line. This needs the owner's OK and a line in the Art Bible (question 6).

**Sample first.** The Main Battle Tank for both families: Western looks 1-4 and Eastern looks 1-4, less today's look 1 and any tank sample looks already made (`docs/QUEUE.md` item 2): at most 7 pictures, about $0.28, shown side by side through the research filter. The rest waits for the owner's OK on the sample.

---

## 9. Build plan sketch

1. **Owner's OK** on this plan and the answers of section 10. No code and no picture before it.
2. **Groups in the nation table.** `tools/build-nations.js` gets a `group` for each nation and rebuilds `nations.js` (the file says to change the tool, not the file). New games set `N.doc` from it; old saves set it on load from the nation's name (`N.doc` is empty in every save today, so nothing is lost; the save version does not change).
3. **Rules data** (`rules/data.js`): the five groups replace the three old `DOCTRINES` entries (same hooks: `atk`, `def`, `cost`, `build`, `res`, `home`); a new `UNIT_NAMES[group][unit]` (four names) and `UNIT_TRADE[group][unit]` (the +4/-4 trade, applied in `stRows` next to the doctrine; speed needs one new line there); the five unique units in `UNITS` with `only: '<group>'`, and their research nodes hidden for other groups. The old doctrine picker stays hidden.
4. **Balance run.** `tools/balance.js` and `tools/combat-pace.js`, every group's army against every other with the same money; adjust by a point if one leads by more than 3%. Report to the owner.
5. **Screen** (`index.html`): "model · type" names, the emblem stripe and emblems, the research header colour, the research-card filter, the unique units' cards.
6. **Art**, after the owner's OK on the sample: option B in batches of about 30, one try each, cost logged after each batch, stop and ask at the $12 line.
7. **Tests**: a new `.test/doctrines.js` (68 nations, each in one group; every unit has 4 names per group; every trade is +4/-4; the uniques only for their group; old saves get their group; a missing picture falls back to the nearest look); the existing tests still pass. A line in `RELEASES.md`; the dev build only until the owner moves it to public.

---

## 10. Questions for the owner (with suggested answers)

1. **The five identities and numbers** of section 1? *Suggested: yes; the balance run may move one by a point or two.*
2. **The groups of section 2**, in particular Ukraine in Europe, India in Eastern, Turkey/Egypt/Saudi Arabia/Morocco in US/NATO, Brazil and Chile in Europe? *Suggested: yes.*
3. **Replace the three old doctrines** (Precision, Mass, Defence in Depth, switched off today) with the five groups, fixed by nation and not chosen by the player? *Suggested: yes.*
4. **The five unique units** of section 4? *Suggested: yes, one picture each.*
5. **Art option B** (two families, 151 pictures, about $6.04, plus about $0.20 for the uniques), tank sample first? *Suggested: yes.*
6. **Pictures show the family look of the named model** but stay original designs (an Art Bible change)? *Suggested: yes.*
7. **Names with a small trademark risk** that have no other designation: Kalashnikov-pattern rifle names (AKM, AK-74, AK-12), Russian state drone names (Orlan-10, Forpost-R, Grom, Geran-2), SCALP-EG and KEPD 350. Keep, or swap for older types? *Suggested: keep (they are army designations); the US and European brand names of section 6 stay out.*
8. **The ‡ names** (mainly the European jammers and the US swarm drones): checked and replaced if needed in the build, without asking again? *Suggested: yes.*
9. **The research-card filter**: one shared teal monitor tint with scanlines, research tree only? *Suggested: yes; group-coloured tint as a later option.*
10. **Paratroopers share the infantry names and pictures**, and missiles get names but no pictures for now? *Suggested: yes.*
