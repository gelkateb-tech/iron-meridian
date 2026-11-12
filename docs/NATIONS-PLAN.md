# Iron Meridian: the 64 playable nations (plan)

Owner task 7. This is a plan only: no game code changes with it. Task 8 builds it region by region.

Every number and table here is measured from the game's own map (world.js) and rules by one script, not guessed:

    node .test/nations-analysis.js raw      every country on the map
    node .test/nations-analysis.js plan     tables A to G below
    node .test/nations-analysis.js trial    table H: today's rules played with the 64 nations
    node .test/nations-analysis.js check    exit 1 if the plan breaks its own rules

The list of nations and the city-choice method live in that script, so task 8 can turn them into game data without retyping.

## 0. Summary, and what the map forced

- **64 playable nations**: Europe 12, Middle East 7, Africa 15, Asia 17, Americas 11, Oceania 2. The 15 powers of today are all among them.
- **Every playable nation gets 7 to 14 cities.** Russia goes from 19 to 14, Iran from 5 to 12, India from 7 to 14, Poland from 1 to 10. 653 starting cities in all (211 on the map today).
- **128 other countries and territories stay AI-only** and cannot be picked: 564 provinces, 18% of the land.
- **The AI plays every playable nation nobody picks**, exactly as it plays the other 14 powers today.

Three things the measurements forced, which the owner should know before task 8 starts:

1. **A seat needs at least 9 provinces on our map.** A city is a province, so 7 cities do not fit in a country of 2 to 8 provinces. That rules out several countries Conflict of Nations lets you play: **Israel (2 provinces), Greece (8), Cuba (8), Serbia (7), Portugal (7), Belarus (7), Taiwan (6)**. Bahrain is not on the map at all. They stay AI-only in this plan. Making them playable later means cutting their provinces into smaller ones, which is a map rebuild (section 4.6), not a rules change. So Europe has 12 seats here, not the 20 or so of Conflict of Nations, and Africa and Asia have more.
2. **Today's start rules turn the big nations into the weak ones.** Played with 64 nations (table H), today's rules give Russia the same money a day as Finland (237 and 238), less manpower (39 against 57), and fewer opening units than Algeria (31 against 56). After 30 days all four giants are smaller than they started and no middle nation is. The tier rules in section 3 fix this.
3. **64 computer nations cost 5 times the thinking time** (about 2,260 ms a game day against 444 ms for 15) and saves grow from 212 KB to 395 KB at the start. Section 5 sets a speed budget per region so phones are not hurt.

Decisions left to the owner are collected in section 6.

## 1. The nations

### 1.1 Rule for who is playable

A country is playable when all of these hold (measured, table A and E):

- at least **9 land provinces** on the map (7 cities must fit and leave room to manoeuvre);
- its planned cities number at most its provinces minus 2;
- it is not a scatter of islands with no home landmass.

76 countries pass. Greenland passes on size only (35 provinces, 0.1 million people) and is left out. From the other 75 the plan takes 64: every one of today's 15 powers, then the largest by people and land. The eleven left over are the **reserve** (table E): Uganda, Madagascar, Zambia, Burkina Faso, Niger, Côte d'Ivoire, Cambodia, Mauritania, Central African Republic, Paraguay, Namibia. They are large enough to become seats later without touching the map.

### 1.2 Tiers

Each playable nation has a rough strength tier. The tier comes from a **strength index**: what the nation's land would earn at the opening under today's money formula, with its planned cities (table A, last columns). The index is ranked: the top 4 are tier S, the next 12 tier A, the next 24 tier B, the last 24 tier C. Six hand corrections are applied and shown in brackets in table A: the United Kingdom and Germany are raised to A and South Korea to B (industrial powers; the first two are played today and keep their weight), the Philippines and DR Congo are lowered to B and Bangladesh to C (many people, little land or industry). These six are design choices, not measurements.

**Table F. Tier summary**

| Tier | Nations | Provinces (min-median-max) | People M (min-median-max) | Cities planned (min-max) | Strength index (min-median-max) |
|---|---|---|---|---|---|
| S | 4: China, India, United States, Russia | 127-248-287 | 144-1410-1430 | 14-14 | 339-651-774 |
| A | 12: Brazil, Indonesia, Nigeria, Pakistan, Mexico, Canada, Japan, Turkey, Iran, France, United Kingdom, Germany | 22-44-122 | 40-124-278 | 11-14 | 137-177-271 |
| B | 24: DR Congo, Philippines, Vietnam, Egypt, Ethiopia, Italy, Argentina, Thailand, Australia, Spain, Tanzania, Algeria, South Africa, Colombia, Sudan, Afghanistan, Myanmar, Kazakhstan, Ukraine, Iraq, Saudi Arabia, Peru, Poland, South Korea | 10-25-60 | 20-52-127 | 8-11 | 91-131-152 |
| C | 24: Bangladesh, Angola, Venezuela, Morocco, Yemen, Uzbekistan, Malaysia, Mozambique, Chile, Romania, Mali, Chad, Ecuador, Cameroon, Kenya, Syria, Bolivia, Libya, Sweden, North Korea, Mongolia, New Zealand, Norway, Finland | 9-13-21 | 3-23-173 | 7-10 | 65-89-123 |

**Table A. Playable nations: measured data**

| Region | Nation | Tier | Rank | Provinces | People (M) | Cities today | Cities planned | Oil / ore / iron / rare provinces | Coastal provinces | Landmasses | Strength index | Playable today |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Europe | United Kingdom | A (B) | 19 | 34 | 68.0 | 4 | 11 | 2 / 1 / 1 / 0 | 23 | 2 | 141 | yes |
| Europe | France | A | 16 | 48 | 68.0 | 5 | 11 | 4 / 2 / 1 / 0 | 18 | 5 | 149 | yes |
| Europe | Germany | A (B) | 21 | 22 | 84.0 | 4 | 11 | 1 / 1 / 1 / 0 | 5 | 1 | 137 | yes |
| Europe | Italy | B | 22 | 34 | 59.0 | 3 | 11 | 2 / 3 / 3 / 0 | 23 | 3 | 137 |  |
| Europe | Spain | B | 26 | 34 | 48.0 | 2 | 11 | 0 / 8 / 1 / 1 | 14 | 2 | 132 |  |
| Europe | Poland | B | 40 | 17 | 37.0 | 1 | 10 | 0 / 0 / 0 / 0 | 3 | 1 | 108 |  |
| Europe | Ukraine | B | 36 | 23 | 37.0 | 1 | 10 | 1 / 5 / 0 / 0 | 5 | 1 | 112 |  |
| Europe | Romania | C | 50 | 14 | 19.0 | 1 | 9 | 0 / 2 / 0 / 0 | 1 | 1 | 91 |  |
| Europe | Sweden | C | 59 | 12 | 10.5 | 1 | 8 | 1 / 0 / 0 / 2 | 8 | 1 | 76 |  |
| Europe | Norway | C | 63 | 11 | 5.5 | 1 | 7 | 1 / 1 / 2 / 0 | 10 | 3 | 65 |  |
| Europe | Finland | C | 64 | 9 | 5.6 | 1 | 7 | 1 / 0 / 0 / 1 | 7 | 1 | 65 |  |
| Europe | Russia | S | 4 | 287 | 144.0 | 19 | 14 | 15 / 22 / 8 / 10 | 82 | 11 | 339 | yes |
| Middle East | Turkey | A | 12 | 49 | 85.0 | 4 | 12 | 4 / 6 / 2 / 1 | 24 | 1 | 165 | yes |
| Middle East | Iran | A | 13 | 44 | 89.0 | 5 | 12 | 8 / 1 / 4 / 1 | 11 | 1 | 162 | yes |
| Middle East | Saudi Arabia | B | 38 | 26 | 36.0 | 2 | 10 | 4 / 0 / 0 / 1 | 9 | 1 | 111 |  |
| Middle East | Iraq | B | 37 | 18 | 45.0 | 1 | 10 | 0 / 2 / 0 / 0 | 1 | 1 | 112 |  |
| Middle East | Syria | C | 56 | 10 | 23.0 | 1 | 8 | 0 / 0 / 0 / 0 | 3 | 1 | 81 |  |
| Middle East | Yemen | C | 44 | 13 | 34.0 | 1 | 9 | 2 / 1 / 0 / 0 | 8 | 1 | 96 |  |
| Middle East | Egypt | B | 18 | 23 | 112.0 | 3 | 11 | 3 / 1 / 0 / 2 | 11 | 1 | 145 | yes |
| Africa | Algeria | B | 28 | 36 | 46.0 | 1 | 11 | 1 / 3 / 1 / 1 | 9 | 1 | 131 |  |
| Africa | Morocco | C | 43 | 15 | 37.0 | 1 | 10 | 1 / 1 / 1 / 0 | 12 | 1 | 106 |  |
| Africa | Libya | C | 58 | 19 | 6.9 | 1 | 8 | 4 / 1 / 0 / 0 | 8 | 1 | 78 |  |
| Africa | Nigeria | A | 7 | 35 | 224.0 | 2 | 12 | 3 / 2 / 0 / 0 | 7 | 1 | 202 |  |
| Africa | Ethiopia | B | 20 | 14 | 127.0 | 1 | 11 | 3 / 0 / 0 / 1 | 0 | 1 | 139 |  |
| Africa | Sudan | B | 32 | 24 | 48.0 | 1 | 10 | 3 / 0 / 1 / 1 | 1 | 1 | 115 |  |
| Africa | DR Congo | B (A) | 14 | 32 | 102.0 | 1 | 11 | 1 / 1 / 1 / 1 | 0 | 1 | 152 |  |
| Africa | Angola | C | 41 | 18 | 37.0 | 1 | 10 | 1 / 1 / 0 / 0 | 5 | 1 | 107 |  |
| Africa | South Africa | B | 29 | 24 | 62.0 | 3 | 11 | 2 / 2 / 2 / 2 | 7 | 1 | 129 | yes |
| Africa | Kenya | C | 55 | 9 | 55.0 | 1 | 7 | 0 / 1 / 1 / 1 | 2 | 1 | 82 |  |
| Africa | Tanzania | B | 27 | 23 | 67.0 | 1 | 11 | 0 / 2 / 3 / 0 | 3 | 1 | 132 |  |
| Africa | Mali | C | 51 | 12 | 23.0 | 1 | 9 | 1 / 1 / 0 / 0 | 0 | 1 | 90 |  |
| Africa | Chad | C | 52 | 14 | 18.0 | 1 | 9 | 0 / 1 / 1 / 0 | 0 | 1 | 89 |  |
| Africa | Mozambique | C | 47 | 11 | 34.0 | 0 | 9 | 0 / 1 / 0 / 0 | 7 | 1 | 94 |  |
| Africa | Cameroon | C | 54 | 10 | 28.0 | 0 | 8 | 2 / 1 / 2 / 0 | 3 | 1 | 83 |  |
| Asia | China | S | 1 | 248 | 1410.0 | 14 | 14 | 10 / 15 / 11 / 16 | 36 | 1 | 774 | yes |
| Asia | India | S | 2 | 127 | 1430.0 | 7 | 14 | 9 / 9 / 10 / 7 | 30 | 5 | 651 | yes |
| Asia | Japan | A | 11 | 37 | 124.0 | 5 | 12 | 1 / 6 / 0 / 0 | 34 | 4 | 171 | yes |
| Asia | Pakistan | A | 8 | 24 | 240.0 | 3 | 12 | 2 / 2 / 1 / 1 | 3 | 1 | 190 |  |
| Asia | Bangladesh | C (B) | 31 | 10 | 173.0 | 1 | 8 | 0 / 0 / 0 / 0 | 3 | 1 | 123 |  |
| Asia | Indonesia | A | 6 | 36 | 278.0 | 5 | 13 | 2 / 4 / 0 / 1 | 35 | 9 | 220 |  |
| Asia | South Korea | B (C) | 49 | 10 | 52.0 | 1 | 8 | 0 / 0 / 0 / 0 | 9 | 1 | 91 |  |
| Asia | North Korea | C | 60 | 9 | 26.0 | 1 | 7 | 0 / 1 / 0 / 0 | 6 | 1 | 73 |  |
| Asia | Vietnam | B | 17 | 25 | 99.0 | 2 | 11 | 2 / 1 / 1 / 3 | 17 | 1 | 145 |  |
| Asia | Thailand | B | 24 | 25 | 72.0 | 1 | 11 | 1 / 2 / 1 / 0 | 8 | 2 | 135 |  |
| Asia | Myanmar | B | 34 | 15 | 54.0 | 1 | 10 | 0 / 2 / 0 / 1 | 7 | 1 | 113 |  |
| Asia | Philippines | B (A) | 15 | 26 | 117.0 | 2 | 11 | 0 / 2 / 0 / 0 | 26 | 3 | 150 |  |
| Asia | Malaysia | C | 46 | 11 | 34.0 | 1 | 9 | 0 / 1 / 0 / 0 | 11 | 2 | 94 |  |
| Asia | Kazakhstan | B | 35 | 39 | 20.0 | 2 | 10 | 2 / 1 / 1 / 2 | 4 | 1 | 112 |  |
| Asia | Uzbekistan | C | 45 | 11 | 36.0 | 1 | 9 | 0 / 1 / 0 / 0 | 0 | 1 | 95 |  |
| Asia | Afghanistan | B | 33 | 25 | 41.0 | 1 | 10 | 2 / 3 / 3 / 1 | 0 | 1 | 115 |  |
| Asia | Mongolia | C | 61 | 19 | 3.4 | 1 | 7 | 1 / 1 / 2 / 1 | 0 | 1 | 68 |  |
| Americas | United States | S | 3 | 230 | 335.0 | 14 | 14 | 9 / 17 / 12 / 8 | 58 | 8 | 392 | yes |
| Americas | Canada | A | 10 | 122 | 40.0 | 8 | 12 | 5 / 10 / 4 / 5 | 63 | 11 | 177 | yes |
| Americas | Mexico | A | 9 | 57 | 129.0 | 3 | 12 | 3 / 5 / 4 / 2 | 26 | 1 | 186 |  |
| Americas | Brazil | A | 5 | 119 | 216.0 | 7 | 14 | 5 / 5 / 7 / 7 | 27 | 1 | 271 | yes |
| Americas | Argentina | B | 23 | 46 | 46.0 | 2 | 11 | 2 / 3 / 1 / 1 | 11 | 2 | 135 |  |
| Americas | Colombia | B | 30 | 29 | 52.0 | 1 | 11 | 1 / 2 / 2 / 2 | 10 | 2 | 129 |  |
| Americas | Venezuela | C | 42 | 21 | 28.0 | 1 | 10 | 1 / 2 / 1 / 1 | 9 | 2 | 107 |  |
| Americas | Peru | B | 39 | 24 | 34.0 | 1 | 10 | 0 / 2 / 1 / 2 | 10 | 1 | 110 |  |
| Americas | Chile | C | 48 | 17 | 20.0 | 1 | 9 | 0 / 3 / 1 / 1 | 16 | 1 | 92 |  |
| Americas | Bolivia | C | 57 | 16 | 12.0 | 1 | 8 | 0 / 0 / 0 / 0 | 0 | 1 | 79 |  |
| Americas | Ecuador | C | 53 | 13 | 18.0 | 1 | 9 | 0 / 0 / 1 / 0 | 5 | 2 | 89 |  |
| Oceania | Australia | B | 25 | 60 | 27.0 | 11 | 11 | 1 / 6 / 2 / 4 | 35 | 4 | 133 | yes |
| Oceania | New Zealand | C | 62 | 13 | 5.2 | 2 | 7 | 1 / 0 / 0 / 0 | 13 | 6 | 66 |  |

**Table B. Starting cities of every playable nation**

The first city is the capital. *Italic* = a province promoted to a city by the method in section 2 (not a city in world.js today). A promoted city is listed under its province name; task 8 names it after the largest town inside it. The letter after a city is its assumed main resource: $ money, M manpower, O oil, T materials, I iron, E electronics, R rare earth; + marks a resource granted by the minimum-access rule (no deposit there).

**Europe**

| Nation | Capital | Cities | Starting cities (main resource) | Dropped cities (stay ordinary provinces) | Main resources of its cities |
|---|---|---|---|---|---|
| United Kingdom | London | 11 | London E, Manchester M, Edinburgh $, Belfast $, *Leicestershire* T, *Suffolk* O, *Bournemouth* $, *Buckinghamshire* M, *Cumbria* $, *North Yorkshire* E, *East Sussex* E | none | money 4, electronics 3, manpower 2, materials 1, oil 1 |
| France | Paris | 11 | Paris E, Lyon O, Marseille $, Bordeaux $, Brest I+, *Moselle* M, *Seine-Maritime* E, *Nord* E, *Guyane française* O, *Cher* M, *Haute-Garonne* M | none | electronics 3, manpower 3, oil 2, money 2, iron 1 |
| Germany | Berlin | 11 | Berlin E, Cologne E, Munich M, Hamburg $, *Stuttgart* T, *Sachsen* O+, *Hessen* E, *Wiesbaden* M, *Bremen* $, *Nürnberg* M, *Mannheim* M | none | manpower 4, electronics 3, money 2, materials 1, oil 1 |
| Italy | Rome | 11 | Rome E, Milan E, Naples $, *Bari* O, *Palermo* $, *Turin* M, *Cagliari* $, *Bologna* I, *Firenze* E, *Foggia* $, *Macerata* $ | none | money 5, electronics 3, oil 1, manpower 1, iron 1 |
| Spain | Madrid | 11 | Madrid E, Barcelona E, *Sevilla* I, *Bizkaia* T, *Pontevedra* E, *Murcia* $, *Zaragoza* M, *Málaga* T, *Salamanca* M, *Ciudad Real* M, *Lugo* R | none | electronics 3, manpower 3, materials 2, iron 1, money 1, rare earth 1 |
| Poland | Warsaw | 10 | Warsaw E, *Silesian* E, *West Pomeranian* $, *Lower Silesian* M, *Subcarpathian* I+, *Pomeranian* $, *Łódź* E, *Greater Poland* M, *Lesser Poland* M, *Warmian-Masurian* O+ | none | electronics 3, manpower 3, money 2, iron 1, oil 1 |
| Ukraine | Kyiv | 10 | Kyiv E, *Donets'k* E, *Odessa* $, *Kherson* T, *L'viv* M, *Luhans'k* O, *Kharkiv* E, *Dnipropetrovs'k* M, *Khmel'nyts'kyy* M, *Zaporizhzhya* $ | none | electronics 3, manpower 3, money 2, materials 1, oil 1 |
| Romania | Bucharest | 9 | Bucharest E, *Bihor* M, *Dolj* T, *Iasi* M, *Braila* E, *Mures* O+, *Covasna* M, *Olt* M, *Bacau* M | none | manpower 5, electronics 2, materials 1, oil 1 |
| Sweden | Stockholm | 8 | Stockholm E, *Västra Götaland* $, *Luleå* O, *Västmanland* E, *Kronoberg* $, *Östergötland* $, *Västerbotten* T+, *Värmland* M | none | money 3, electronics 2, oil 1, materials 1, manpower 1 |
| Norway | Oslo | 7 | Oslo E, *Troms* O+, *Vest-Agder* $, *Buskerud* E, *Sør-Trøndelag* $, *Hordaland* I, *Hedmark* M | none | electronics 2, money 2, oil 1, iron 1, manpower 1 |
| Finland | Helsinki | 7 | Helsinki E, *North Karelia* O, *Päijät-Häme* E, *Rovaniemi* I+, *Central Ostrobothnia* R, *Satakunta* $, *Northern Ostrobothnia* $ | none | electronics 2, money 2, oil 1, iron 1, rare earth 1 |
| Russia | Moscow | 14 | Moscow E, Saint Petersburg E, Yekaterinburg E, Krasnoyarsk T, Rostov $, Kazan M, Omsk M, Vladivostok $, Novosibirsk E, Irkutsk M, Murmansk R, Volgograd M, Arkhangelsk $, Yakutsk I+ | Norilsk, Anadyr, Magadan, Petropavlovsk, Khabarovsk | electronics 4, manpower 4, money 3, materials 1, rare earth 1, iron 1 |

**Middle East**

| Nation | Capital | Cities | Starting cities (main resource) | Dropped cities (stay ordinary provinces) | Main resources of its cities |
|---|---|---|---|---|---|
| Turkey | Ankara | 12 | Ankara E, Istanbul E, Izmir $, Diyarbakır M, *Adana* O, *Eskisehir* R, *Sakarya* T, *Antalya* $, *Bursa* E, *Artvin* I, *Kirklareli* $, *Malatya* M | none | electronics 3, money 3, manpower 2, oil 1, rare earth 1, materials 1, iron 1 |
| Iran | Tehran | 12 | Tehran E, Tabriz O, Mashhad E, Shiraz $, Isfahan E, *Kermanshah* I, *Zahedan* M, *Gilan* $, *Ahvaz* $, *Yazd* R, *Markazi* M, *Hormozgan* O | none | electronics 3, money 3, oil 2, manpower 2, iron 1, rare earth 1 |
| Saudi Arabia | Riyadh | 10 | Riyadh E, Jeddah E, *`Asir* O, *Hofuf* E, *Halat Ammar* I+, *Medina* $, *Hail* M, *Hafar al Batin* $, *Arar* O, *As Sulayyil* R | none | electronics 3, oil 2, money 2, iron 1, manpower 1, rare earth 1 |
| Iraq | Baghdad | 10 | Baghdad E, *Al-Basrah* $, *Mosul* E, *Babil* M, *At-Ta'mim* I+, *Ar Ramadi* E, *As-Sulaymaniyah* T, *Sala ad-Din* M, *Arbil* M, *Wasit* M | none | manpower 4, electronics 3, money 1, iron 1, materials 1 |
| Syria | Damascus | 8 | Damascus E, *Aleppo* E, *Homs* $, *Hasaka (Al Haksa)* O+, *Hamah* $, *Dar`a* M, *Idlib* $, *Ar Raqqah* T+ | none | money 3, electronics 2, oil 1, manpower 1, materials 1 |
| Yemen | Sana'a | 9 | Sana'a E, *Lahij* E, *Al Hudaydah* O, *Hajjah* T, *Ta`izz* $, *Hadramawt* $, *Ibb* M, *Abyan* $, *Al Jawf* M | none | money 3, electronics 2, manpower 2, oil 1, materials 1 |
| Egypt | Cairo | 11 | Cairo E, Aswan $, Alexandria T, *Ad Daqahliyah* R, *Shamal Sina'* $, *Al Minufiyah* O, *Al Minya* M, *Mallawi* E, *Kafr ash Shaykh* R, *As Suways* E, *Ash Sharqiyah* $ | none | electronics 3, money 3, rare earth 2, materials 1, oil 1, manpower 1 |

**Africa**

| Nation | Capital | Cities | Starting cities (main resource) | Dropped cities (stay ordinary provinces) | Main resources of its cities |
|---|---|---|---|---|---|
| Algeria | Algiers | 11 | Algiers E, *El Tarf* T, *Oran* E, *Arak* M, *Djelfa* M, *Aïn Defla* $, *Batna* M, *Skikda* I, *Adrar* O, *Chlef* E, *Grand Erg Oriental* R | none | electronics 3, manpower 3, materials 1, money 1, iron 1, oil 1, rare earth 1 |
| Morocco | Casablanca | 10 | Casablanca E, *Marrakech - Tensift - Al Haouz* O, *Taza - Al Hoceima - Taounate* I, *Tanger - Tétouan* E, *Guelmim - Es-Semara* $, *Oriental* E, *Chaouia - Ouardigha* $, *Doukkala - Abda* $, *Meknès - Tafilalet* T, *Gharb - Chrarda - Béni Hssen* $ | none | money 4, electronics 3, oil 1, iron 1, materials 1 |
| Libya | Tripoli | 8 | Tripoli E, *Benghazi* E, *Al Butnan* T+, *Misratah* $, *Al Marj* $, *Mizdah* M, *Sabha* O, *Awjilah* O | none | electronics 2, money 2, oil 2, materials 1, manpower 1 |
| Nigeria | Abuja | 12 | Abuja E, Lagos E, *Kano* M, *Rivers* $, *Maiduguri* M, *Delta* $, *Kwara* M, *Zamfara* O, *Ibadan* E, *Ondo* $, *Kaduna* M, *Enugu* T+ | none | manpower 4, electronics 3, money 3, oil 1, materials 1 |
| Ethiopia | Addis Ababa | 11 | Addis Ababa E, *Degehabur Zone* O, *Jima* R, *Tigray* M, *Southern Nations, Nationalities and Peoples* E, *Bahir Dar* E, *Dese* M, *Dire Dawa* O, *Afar* M, *Goba* M, *Gode* I+ | none | manpower 4, electronics 3, oil 2, rare earth 1, iron 1 |
| Sudan | Khartoum | 10 | Khartoum E, *Al-Ubayyid* R, *Southern Darfur* M, *Port Sudan* $, *Sennar* O, *Shendi* E, *Gezira* E, *White Nile* M, *El Fasher* I, *Dongola* M | none | electronics 3, manpower 3, rare earth 1, money 1, oil 1, iron 1 |
| DR Congo | Kinshasa | 11 | Kinshasa E, *Kolwezi* R, *Nord-Kivu* M, *Mbuji-Mayi* E, *Gemena* O+, *Kikwit* M, *Kisangani* M, *Lubumbashi* E, *Kenge* M, *Kananga* M, *Kalemie* T+ | none | manpower 5, electronics 3, rare earth 1, oil 1, materials 1 |
| Angola | Luanda | 10 | Luanda E, *Huambo* E, *Cuanza Sul* O, *Cabinda* E, *Namibe* $, *Mavinga* T, *Lunda Norte* M, *Uíge* M, *Benguela* $, *Cuanza Norte* M | none | electronics 3, manpower 3, money 2, oil 1, materials 1 |
| South Africa | Pretoria | 11 | Pretoria E, Durban E, Cape Town $, *Thohoyandou* R, *Bloemfontein* M, *East London* O, *Rustenburg* E, *Middelburg* T, *Bethlehem* M, *Thabazimbi* M, *Klerksdorp* M | none | manpower 4, electronics 3, money 1, rare earth 1, oil 1, materials 1 |
| Kenya | Nairobi | 7 | Nairobi E, *Coast* E, *Eldoret* M, *Machakos* M, *Western* O+, *Central* I+, *Marsabit* R | none | electronics 2, manpower 2, oil 1, iron 1, rare earth 1 |
| Tanzania | Dar es Salaam | 11 | Dar es Salaam E, *Mwanza* T, *Morogoro* E, *Arusha* E, *Mbeya* M, *Kigoma* I, *Pwani* $, *Kilimanjaro* M, *Tanga* M, *Mtwara* $, *Kagera* T | none | electronics 3, manpower 3, materials 2, money 2, iron 1 |
| Mali | Bamako | 9 | Bamako E, *Gao* O, *Sikasso* T, *Kayes* E, *Ségou* M, *Mopti* M, *Nara* M, *Taoudenni* M, *Timbuktu* M | none | manpower 5, electronics 2, oil 1, materials 1 |
| Chad | N'Djamena | 9 | N'Djamena E, *Mayo-Kebbi Est* T, *Ouaddaï* M, *Logone Oriental* I, *Kanem* M, *Moyen-Chari* M, *Lac* E, *Ennedi* M, *Tibesti* M | none | manpower 5, electronics 2, materials 1, iron 1 |
| Mozambique | Maputo | 9 | Maputo E, *Nampula* T, *Sofala* E, *Zambezia* $, *Tete* M, *Manica* M, *Niassa* M, *Cabo Delgado* $, *Gaza* I+ | none | manpower 3, electronics 2, money 2, materials 1, iron 1 |
| Cameroon | Yaoundé | 8 | Yaoundé E, *Sud-Ouest* O, *Nord* I, *Littoral* O, *Ouest* I, *Sud* E, *Est* M, *Adamaoua* M | none | electronics 2, oil 2, iron 2, manpower 2 |

**Asia**

| Nation | Capital | Cities | Starting cities (main resource) | Dropped cities (stay ordinary provinces) | Main resources of its cities |
|---|---|---|---|---|---|
| China | Beijing | 14 | Beijing E, Guangzhou R, Chengdu O, Wuhan E, Shenyang E, Ürümqi T, Xi'an E, Harbin M, Lanzhou M, Kunming T, Shanghai $, Hohhot M, Kashgar M, Lhasa M | none | manpower 5, electronics 4, materials 2, rare earth 1, oil 1, money 1 |
| India | New Delhi | 14 | New Delhi E, Kolkata O, Mumbai E, Bangalore E, Ahmedabad $, Hyderabad M, Chennai $, *Bhubaneswar* R, *Bhopal* T, *Kanpur* E, *Jaipur* M, *Patna* M, *Guwahati* T, *Hubballi* $ | none | electronics 4, money 3, manpower 3, materials 2, oil 1, rare earth 1 |
| Japan | Tokyo | 12 | Tokyo E, Osaka E, Sapporo $, Sendai $, Fukuoka O+, *Aichi* $, *Wakayama* T, *Okayama* $, *Ehime* $, *Hyōgo* E, *Ishikawa* $, *Mie* $ | none | money 7, electronics 3, oil 1, materials 1 |
| Pakistan | Islamabad | 12 | Islamabad E, Lahore E, Karachi $, *F.A.T.A.* R, *Multan* M, *Saidu* E, *Faisalabad* M, *Gujranwala* O, *Hyderabad* T, *Bannu* M, *Sahiwal* M, *Sukkur* M | none | manpower 5, electronics 3, money 1, rare earth 1, oil 1, materials 1 |
| Bangladesh | Dhaka | 8 | Dhaka E, *Chattogram* $, *Khulna* E, *Rajshahi* M, *Comilla* M, *Mymensingh* M, *Barisal* I+, *Chuadanga* O+ | none | manpower 3, electronics 2, money 1, iron 1, oil 1 |
| Indonesia | Jakarta | 13 | Jakarta E, Surabaya E, Medan $, Makassar O, Jayapura T, *Palembang* $, *Bandung* E, *Jawa Tengah* $, *Sumatera Barat* R, *Samarinda* $, *Nusa Tenggara Barat* $, *Sulawesi Utara* $, *Maluku* $ | none | money 7, electronics 3, oil 1, materials 1, rare earth 1 |
| South Korea | Seoul | 8 | Seoul E, *Busan* E, *South Jeolla* $, *Andong* O+, *Daegu* $, *North Chungcheong* M, *Gangwon* $, *South Chungcheong* I+ | none | money 3, electronics 2, oil 1, manpower 1, iron 1 |
| North Korea | Pyongyang | 7 | Pyongyang E, *Hamgyŏng-bukto* $, *Hwanghae-namdo* E, *P'yŏngan-namdo* $, *Kangwŏn-do* $, *Chagang-do* T, *P'yŏngan-bukto* I+ | none | money 3, electronics 2, materials 1, iron 1 |
| Vietnam | Hanoi | 11 | Hanoi E, Ho Chi Minh City $, *Đà Nẵng* O, *Đông Nam Bộ* E, *Son La* R, *Cà Mau* $, *Sóc Trăng* $, *An Giang* $, *Ninh Bình* T, *Nghệ An* $, *Thái Bình* E | none | money 5, electronics 3, oil 1, rare earth 1, materials 1 |
| Thailand | Bangkok | 11 | Bangkok E, *Udon Thani* O, *Songkhla* $, *Chiang Mai* M, *Suphan Buri* T, *Buri Ram* M, *Samut Sakhon* E, *Chachoengsao* T, *Trang* $, *Nakhon Nayok* E, *Nakhon Ratchasima* I | none | electronics 3, money 2, manpower 2, materials 2, oil 1, iron 1 |
| Myanmar | Yangon | 10 | Yangon E, *Kachin* R, *Mandalay* E, *Chin* M, *Tanintharyi* T+, *Pathein* E, *Bago* $, *Kayin* $, *Hinthada* O+, *Monywa* M | none | electronics 3, manpower 2, money 2, rare earth 1, materials 1, oil 1 |
| Philippines | Manila | 11 | Manila E, Davao $, *Negros Occidental* $, *Mindoro Oriental* T, *Dagupan* $, *Basilan* $, *Laguna* E, *Albay* O+, *Pampanga* E, *Leyte* $, *Quezon* T | none | money 5, electronics 3, materials 2, oil 1 |
| Malaysia | Kuala Lumpur | 9 | Kuala Lumpur E, *Sabah* $, *Johor* E, *Kedah* $, *Terengganu* $, *Pahang* T, *Sibu* I+, *Perak* $, *Melaka* $ | none | money 5, electronics 2, materials 1, iron 1 |
| Kazakhstan | Astana | 10 | Astana E, Almaty E, *Shymkent* O, *Semey* I, *Aqtobe* M, *Oostanay* M, *Mangyshlak* $, *Qarazhal* R, *Qaraghandy* E, *Oskemen* M | none | electronics 3, manpower 3, oil 1, iron 1, money 1, rare earth 1 |
| Uzbekistan | Tashkent | 9 | Tashkent E, *Kashkadarya* M, *Ferghana* E, *Nukus* M, *Navoi* I+, *Samarkand* M, *Surkhandarya* O+, *Bukhoro* M, *Jizzakh* M | none | manpower 5, electronics 2, iron 1, oil 1 |
| Afghanistan | Kabul | 10 | Kabul E, *Hirat* R, *Kandahar* E, *Balkh* O, *Baghlan* M, *Nangarhar* E, *Nimroz* M, *Paktika* M, *Samangan* M, *Badakhshan* T | none | manpower 4, electronics 3, rare earth 1, oil 1, materials 1 |
| Mongolia | Ulaanbaatar | 7 | Ulaanbaatar E, *Bayan-Ölgiy* M, *Bayanhongor* I, *Dornod* M, *Selenge* E, *Övörhangay* R, *Hövsgöl* T+ | none | electronics 2, manpower 2, iron 1, rare earth 1, materials 1 |

**Americas**

| Nation | Capital | Cities | Starting cities (main resource) | Dropped cities (stay ordinary provinces) | Main resources of its cities |
|---|---|---|---|---|---|
| United States | Washington | 14 | Washington E, Los Angeles O, Miami T, New York E, Chicago E, San Francisco E, Seattle $, Houston $, Phoenix M, Atlanta M, Denver T, Dallas M, Minneapolis M, Anchorage $ | none | electronics 4, manpower 4, money 3, materials 2, oil 1 |
| Canada | Ottawa | 12 | Ottawa E, Vancouver T, Calgary O, Toronto E, Winnipeg M, Montreal M, Yellowknife R, Halifax $, *London* E, *Edmonton* M, *St. John's* $, *New Brunswick* $ | none | electronics 3, manpower 3, money 3, materials 1, oil 1, rare earth 1 |
| Mexico | Mexico City | 12 | Mexico City E, Monterrey M, Guadalajara E, *Torreón* R, *Oaxaca* O, *Yucatán* $, *Poza Rica de Hidalgo* $, *Puebla* T, *Hermosillo* $, *San Luis Potosí* M, *Tuxtla Gutiérrez* $, *Pachuca* E | none | money 4, electronics 3, manpower 2, rare earth 1, oil 1, materials 1 |
| Brazil | Brasília | 14 | Brasília E, São Paulo E, Porto Alegre E, Recife $, Manaus M, Rio de Janeiro $, Salvador T+, *Belém* $, *Belo Horizonte* E, *Curitiba* $, *Uberlândia* R, *Espírito Santo* I, *Fortaleza* $, *Cuiabá* M | none | money 5, electronics 4, manpower 2, materials 1, rare earth 1, iron 1 |
| Argentina | Buenos Aires | 11 | Buenos Aires E, Córdoba M, *Jujuy* R, *San Juan* O, *Rosario* E, *Misiones* M, *Formosa* M, *Tucumán* I, *Trelew* $, *San Rafael* M, *Mendoza* E | none | manpower 4, electronics 3, rare earth 1, oil 1, iron 1, money 1 |
| Colombia | Bogotá | 11 | Bogotá E, *Medellín* R, *Atlántico* E, *Cauca* E, *Cesar* T+, *Chocó* $, *Risaralda* M, *Puerto López* M, *Magdalena* O+, *Tolima* M, *Santander* M | none | manpower 4, electronics 3, rare earth 1, materials 1, money 1, oil 1 |
| Venezuela | Caracas | 10 | Caracas E, *Monagas* R, *Carabobo* E, *Táchira* M, *Portuguesa* O, *Nueva Esparta* I+, *Anzoátegui* E, *Aragua* $, *Lara* M, *Ciudad Guayana* M | none | electronics 3, manpower 3, rare earth 1, oil 1, iron 1, money 1 |
| Peru | Lima | 10 | Lima E, *Tacna* R, *Piura* E, *Arequipa* $, *Áncash* $, *Iquitos* I+, *Junín* E, *Cajamarca* $, *Oyon* O+, *Huánuco* M | none | electronics 3, money 3, rare earth 1, iron 1, oil 1, manpower 1 |
| Chile | Santiago | 9 | Santiago E, *Libertador General Bernardo O'Higgins* R, *Tarapacá* $, *La Araucanía* $, *Coquimbo* $, *Valparaíso* E, *Los Lagos* T, *Punta Arenas* O+, *Maule* T | none | money 3, electronics 2, materials 2, rare earth 1, oil 1 |
| Bolivia | La Paz | 8 | La Paz E, *Santa Cruz* E, *Cochabamba* M, *Tarija* I+, *Santa Ana* M, *Oruro* M, *Chuquisaca* M, *Potosí* O+ | none | manpower 4, electronics 2, iron 1, oil 1 |
| Ecuador | Quito | 9 | Quito E, *Guayas* E, *Manabi* $, *Chimborazo* M, *Azuay* I, *Carchi* $, *El Oro* $, *Cotopaxi* M, *Morona Santiago* T+ | none | money 3, electronics 2, manpower 2, iron 1, materials 1 |

**Oceania**

| Nation | Capital | Cities | Starting cities (main resource) | Dropped cities (stay ordinary provinces) | Main resources of its cities |
|---|---|---|---|---|---|
| Australia | Canberra | 11 | Canberra E, Brisbane T, Perth O, Melbourne E, Adelaide E, Alice Springs R, Hobart $, Sydney $, Darwin $, Cairns $, Port Hedland $ | none | money 5, electronics 3, materials 1, oil 1, rare earth 1 |
| New Zealand | Wellington | 7 | Wellington E, Auckland E, *Otago* O, *Manawatu-Wanganui* $, *Waikato* $, *Canterbury* $, *Bay of Plenty* I+ | none | money 3, electronics 2, oil 1, iron 1 |

Notes on table B:

- A promoted city is shown under its province name (for example "Silesian" in Poland). Task 8 gives it the name of the largest town inside the province (Katowice), from the same public place-name data the map was built from.
- Capitals are the real ones. The map flags a capital only for today's 15 powers; for the other 49 the capital is the city or province that holds the real capital (Abuja, not Lagos; Islamabad, not Karachi; Astana, not Almaty). Morocco's capital province is the one the map calls Casablanca; it also holds Rabat.
- Overseas provinces stay with their owner (French Guiana with France, Alaska and Hawaii with the United States, Svalbard with Norway).
- The resource letters are an **assumption** (section 3.3), to be replaced by the economy plan's own table.

### 1.3 AI-only countries and territories

**Table E. AI-only countries and territories**

| Country | Provinces | People (M) | Cities today | Class | Why not playable |
|---|---|---|---|---|---|
| Greenland | 35 | 0.1 | 1 | reserve (large enough, not chosen) | only 0.1M people |
| Uganda | 12 | 48.0 | 0 | reserve (large enough, not chosen) | next in line if a seat is added |
| Madagascar | 12 | 30.0 | 1 | reserve (large enough, not chosen) | next in line if a seat is added |
| Zambia | 11 | 20.0 | 1 | reserve (large enough, not chosen) | next in line if a seat is added |
| Burkina Faso | 11 | 23.0 | 0 | reserve (large enough, not chosen) | next in line if a seat is added |
| Niger | 10 | 27.0 | 1 | reserve (large enough, not chosen) | next in line if a seat is added |
| Mauritania | 10 | 4.9 | 0 | reserve (large enough, not chosen) | only 4.9M people |
| Côte d'Ivoire | 10 | 29.0 | 0 | reserve (large enough, not chosen) | next in line if a seat is added |
| Central African Rep. | 10 | 5.7 | 0 | reserve (large enough, not chosen) | only 5.7M people |
| Paraguay | 9 | 6.8 | 1 | reserve (large enough, not chosen) | only 6.8M people |
| Namibia | 9 | 2.6 | 1 | reserve (large enough, not chosen) | only 2.6M people |
| Cambodia | 9 | 17.0 | 0 | reserve (large enough, not chosen) | next in line if a seat is added |
| Zimbabwe | 8 | 16.0 | 1 | small state | only 8 provinces (a seat needs 9) |
| Uruguay | 8 | 3.4 | 1 | small state | only 8 provinces (a seat needs 9) |
| Turkmenistan | 8 | 6.5 | 0 | small state | only 8 provinces (a seat needs 9) |
| Somalia | 8 | 15.0 | 1 | small state | only 8 provinces (a seat needs 9) |
| Laos | 8 | 7.6 | 0 | small state | only 8 provinces (a seat needs 9) |
| Kyrgyzstan | 8 | 7.0 | 0 | small state | only 8 provinces (a seat needs 9) |
| Guinea | 8 | 14.0 | 0 | small state | only 8 provinces (a seat needs 9) |
| Greece | 8 | 10.4 | 1 | small state | only 8 provinces (a seat needs 9) |
| Dominican Rep. | 8 | 11.0 | 0 | small state | only 8 provinces (a seat needs 9) |
| Cuba | 8 | 11.0 | 1 | small state | only 8 provinces (a seat needs 9) |
| Congo | 8 | 6.0 | 0 | small state | only 8 provinces (a seat needs 9) |
| Bulgaria | 8 | 6.4 | 1 | small state | only 8 provinces (a seat needs 9) |
| Azerbaijan | 8 | 10.0 | 1 | small state | only 8 provinces (a seat needs 9) |
| United States Minor Outlying Islands | 7 | 0.0 | 0 | small state | only 7 provinces (a seat needs 9) |
| Tunisia | 7 | 12.0 | 1 | small state | only 7 provinces (a seat needs 9) |
| Serbia | 7 | 6.7 | 1 | small state | only 7 provinces (a seat needs 9) |
| S. Sudan | 7 | 11.0 | 0 | small state | only 7 provinces (a seat needs 9) |
| Portugal | 7 | 10.4 | 1 | small state | only 7 provinces (a seat needs 9) |
| Papua New Guinea | 7 | 10.0 | 1 | small state | only 7 provinces (a seat needs 9) |
| Nepal | 7 | 31.0 | 1 | small state | only 7 provinces (a seat needs 9) |
| Hungary | 7 | 9.6 | 1 | small state | only 7 provinces (a seat needs 9) |
| Guatemala | 7 | 18.0 | 0 | small state | only 7 provinces (a seat needs 9) |
| Ghana | 7 | 34.0 | 1 | small state | only 7 provinces (a seat needs 9) |
| Czechia | 7 | 10.9 | 1 | small state | only 7 provinces (a seat needs 9) |
| Belarus | 7 | 9.2 | 1 | small state | only 7 provinces (a seat needs 9) |
| Taiwan | 6 | 23.0 | 1 | small state | only 6 provinces (a seat needs 9) |
| Senegal | 6 | 18.0 | 1 | small state | only 6 provinces (a seat needs 9) |
| Oman | 6 | 4.6 | 1 | small state | only 6 provinces (a seat needs 9) |
| Nicaragua | 6 | 7.0 | 0 | small state | only 6 provinces (a seat needs 9) |
| Netherlands | 6 | 18.0 | 1 | small state | only 6 provinces (a seat needs 9) |
| Honduras | 6 | 10.6 | 0 | small state | only 6 provinces (a seat needs 9) |
| Botswana | 6 | 2.6 | 0 | small state | only 6 provinces (a seat needs 9) |
| Switzerland | 5 | 8.8 | 0 | small state | only 5 provinces (a seat needs 9) |
| Gabon | 5 | 2.4 | 0 | small state | only 5 provinces (a seat needs 9) |
| Benin | 5 | 13.7 | 0 | small state | only 5 provinces (a seat needs 9) |
| Austria | 5 | 9.1 | 1 | small state | only 5 provinces (a seat needs 9) |
| Tajikistan | 4 | 10.0 | 0 | small state | only 4 provinces (a seat needs 9) |
| Sri Lanka | 4 | 22.0 | 1 | small state | only 4 provinces (a seat needs 9) |
| Slovakia | 4 | 5.4 | 0 | small state | only 4 provinces (a seat needs 9) |
| Panama | 4 | 4.4 | 0 | small state | only 4 provinces (a seat needs 9) |
| Malawi | 4 | 21.0 | 0 | small state | only 4 provinces (a seat needs 9) |
| Lithuania | 4 | 2.8 | 0 | small state | only 4 provinces (a seat needs 9) |
| Jordan | 4 | 11.0 | 0 | small state | only 4 provinces (a seat needs 9) |
| Guyana | 4 | 0.8 | 0 | small state | only 4 provinces (a seat needs 9) |
| Georgia | 4 | 3.7 | 0 | small state | only 4 provinces (a seat needs 9) |
| French Polynesia | 4 | 0.5 | 0 | small state | only 4 provinces (a seat needs 9) |
| Fr. S. Antarctic Lands | 4 | 0.0 | 0 | small state | only 4 provinces (a seat needs 9) |
| Federated States of Micronesia | 4 | 0.0 | 0 | small state | only 4 provinces (a seat needs 9) |
| Croatia | 4 | 3.9 | 0 | small state | only 4 provinces (a seat needs 9) |
| Bosnia and Herz. | 4 | 3.2 | 0 | small state | only 4 provinces (a seat needs 9) |
| Belgium | 4 | 11.7 | 1 | small state | only 4 provinces (a seat needs 9) |
| United Arab Emirates | 3 | 9.5 | 1 | microstate / island | too small for 7 cities |
| Togo | 3 | 9.0 | 0 | microstate / island | too small for 7 cities |
| Sierra Leone | 3 | 8.8 | 0 | microstate / island | too small for 7 cities |
| Saint Helena | 3 | 0.0 | 0 | microstate / island | too small for 7 cities |
| Mauritius | 3 | 3.4 | 0 | microstate / island | too small for 7 cities |
| Latvia | 3 | 1.9 | 0 | microstate / island | too small for 7 cities |
| Ireland | 3 | 5.2 | 1 | microstate / island | too small for 7 cities |
| Iceland | 3 | 0.4 | 1 | microstate / island | too small for 7 cities |
| Haiti | 3 | 11.7 | 0 | microstate / island | too small for 7 cities |
| Eritrea | 3 | 3.7 | 0 | microstate / island | too small for 7 cities |
| Eq. Guinea | 3 | 1.6 | 0 | microstate / island | too small for 7 cities |
| Suriname | 2 | 0.6 | 0 | microstate / island | too small for 7 cities |
| Somaliland | 2 | 4.0 | 0 | microstate / island | too small for 7 cities |
| Seychelles | 2 | 0.1 | 0 | microstate / island | too small for 7 cities |
| Qatar | 2 | 4.4 | 0 | microstate / island | too small for 7 cities |
| Moldova | 2 | 2.5 | 0 | microstate / island | too small for 7 cities |
| Liberia | 2 | 5.4 | 0 | microstate / island | too small for 7 cities |
| Lesotho | 2 | 2.1 | 0 | microstate / island | too small for 7 cities |
| Lebanon | 2 | 5.4 | 0 | microstate / island | too small for 7 cities |
| Kuwait | 2 | 7.1 | 0 | microstate / island | too small for 7 cities |
| Jamaica | 2 | 6.3 | 0 | microstate / island | too small for 7 cities |
| Israel | 2 | 9.8 | 0 | microstate / island | too small for 7 cities |
| Estonia | 2 | 1.3 | 0 | microstate / island | too small for 7 cities |
| Denmark | 2 | 5.9 | 1 | microstate / island | too small for 7 cities |
| Costa Rica | 2 | 5.2 | 0 | microstate / island | too small for 7 cities |
| Cook Islands | 2 | 0.1 | 0 | microstate / island | too small for 7 cities |
| Bahamas | 2 | 0.9 | 0 | microstate / island | too small for 7 cities |
| Armenia | 2 | 2.8 | 0 | microstate / island | too small for 7 cities |
| American Samoa | 2 | 0.1 | 0 | microstate / island | too small for 7 cities |
| Albania | 2 | 2.8 | 0 | microstate / island | too small for 7 cities |
| W. Sahara | 1 | 0.6 | 0 | microstate / island | too small for 7 cities |
| Vanuatu | 1 | 0.2 | 0 | microstate / island | too small for 7 cities |
| United States Virgin Islands | 1 | 0.3 | 0 | microstate / island | too small for 7 cities |
| Turks and Caicos Islands | 1 | 0.0 | 0 | microstate / island | too small for 7 cities |
| Trinidad and Tobago | 1 | 1.4 | 0 | microstate / island | too small for 7 cities |
| Tonga | 1 | 0.2 | 0 | microstate / island | too small for 7 cities |
| Timor-Leste | 1 | 0.0 | 0 | microstate / island | too small for 7 cities |
| South Georgia and the Islands | 1 | 0.0 | 0 | microstate / island | too small for 7 cities |
| Solomon Islands | 1 | 0.3 | 0 | microstate / island | too small for 7 cities |
| Slovenia | 1 | 2.1 | 0 | microstate / island | too small for 7 cities |
| Samoa | 1 | 0.3 | 0 | microstate / island | too small for 7 cities |
| Saint Lucia | 1 | 0.1 | 0 | microstate / island | too small for 7 cities |
| Rwanda | 1 | 14.0 | 0 | microstate / island | too small for 7 cities |
| Palestine | 1 | 3.3 | 0 | microstate / island | too small for 7 cities |
| Palau | 1 | 0.1 | 0 | microstate / island | too small for 7 cities |
| Northern Mariana Islands | 1 | 0.0 | 0 | microstate / island | too small for 7 cities |
| New Caledonia | 1 | 0.3 | 0 | microstate / island | too small for 7 cities |
| Montenegro | 1 | 0.6 | 0 | microstate / island | too small for 7 cities |
| Maldives | 1 | 0.5 | 0 | microstate / island | too small for 7 cities |
| Macedonia | 1 | 1.8 | 0 | microstate / island | too small for 7 cities |
| Kosovo | 1 | 1.8 | 0 | microstate / island | too small for 7 cities |
| Guinea-Bissau | 1 | 1.7 | 0 | microstate / island | too small for 7 cities |
| Gambia | 1 | 0.9 | 0 | microstate / island | too small for 7 cities |
| Fiji | 1 | 1.1 | 0 | microstate / island | too small for 7 cities |
| Falkland Islands | 1 | 0.0 | 0 | microstate / island | too small for 7 cities |
| Eswatini | 1 | 1.4 | 0 | microstate / island | too small for 7 cities |
| El Salvador | 1 | 6.3 | 0 | microstate / island | too small for 7 cities |
| Djibouti | 1 | 2.5 | 0 | microstate / island | too small for 7 cities |
| Cyprus | 1 | 1.9 | 0 | microstate / island | too small for 7 cities |
| Comoros | 1 | 0.5 | 0 | microstate / island | too small for 7 cities |
| Cape Verde | 1 | 0.5 | 0 | microstate / island | too small for 7 cities |
| Burundi | 1 | 13.0 | 0 | microstate / island | too small for 7 cities |
| Bhutan | 1 | 1.0 | 0 | microstate / island | too small for 7 cities |
| Belize | 1 | 0.8 | 0 | microstate / island | too small for 7 cities |
| Antigua and Barbuda | 1 | 0.1 | 0 | microstate / island | too small for 7 cities |

How they behave (this is today's behaviour of "independent land", kept on purpose):

- They are **independent states**: nobody's ally, nobody's enemy. They never move, never attack, never trade, never talk. They cannot be picked on the start screen and their capitals do not count toward victory.
- They **defend**. At the start each of their cities holds 5 to 8 infantry and about 4 in 10 of their other provinces hold 2 or 3 infantry (today's numbers, unchanged). Islands and microstates are the same, just smaller.
- They are **taken province by province**. A province taken from them belongs to the conqueror for good; there is no peace treaty with them.
- They keep their **name and flag** when tapped (the map already knows each province's country, and the game already carries a flag for all 192 countries), so "independent land" reads as Belgium, Kuwait or Fiji, not as a blank.
- Not in this plan, possible later: letting the reserve states act as small passive nations (trade, treaties) without being playable.

Measured warning: in the 30-day trial (table H) the 64 nations swallowed 454 of the 564 independent provinces. Independent land is the early-game food of every nation; with 64 nations it is gone in about a month and after that nations can only grow at each other's cost. Section 3.6 uses this.

## 2. Choosing the cities

World.js has 211 cities, laid out for 15 powers: Russia has 19, Poland 1, Mozambique none. The method below gives every playable nation its 7 to 14. It is a fixed recipe (function pickCities in the script), so anyone can re-run it and get the same cities.

### 2.1 How many

The number of cities follows the nation's size, measured as the average of (people) and (provinces) on a log scale, so that people and land count equally and a country ten times bigger gets a few more cities, not ten times more:

- the smallest playable nation on that scale gets **7**;
- Russia, the smallest of the four giants, gets **14**, so China, India and the United States get 14 too;
- everyone else falls in between in proportion;
- never more than the nation's provinces minus 2 (Finland: 9 provinces, 7 cities; South Korea: 10 and 8).

### 2.2 Which provinces

1. **The capital first.**
2. **Keep rule.** As long as the nation still has cities of today that are not chosen, only those compete. So a city of today is never dropped in favour of a new one: a nation with too many cities only loses some, a nation with too few keeps all it has and adds.
3. **Then, one at a time, the best remaining province**, scored by:
   - **people** (more people, better score, with diminishing returns so one megacity province does not crowd out the rest);
   - **spread**: a province next to a city already chosen scores less than half; one two provinces away a little less; a province on a landmass that has no city yet scores a quarter more. This is what stops ten cities piling up around the capital and what gives islands, Siberia and Patagonia their city;
   - **coast**: 15% more (ports matter for trade and navies);
   - **harsh ground** (desert, tundra, ice): 20% less;
   - **a missing resource**: the first province that brings oil scores 60% more, the first with ore or iron 30% more, the first with rare earth more than double. After the nation has one, the bonus is gone.
4. **Rare-earth swap.** A nation that has a rare-earth deposit but ended with no city on one gives its last added city slot to its richest deposit. Cities of today are never cut for this.

### 2.3 Too many: Russia 19 to 14

Russia keeps Moscow, Saint Petersburg, Yekaterinburg, Krasnoyarsk, Rostov, Kazan, Omsk, Vladivostok, Novosibirsk, Irkutsk, Murmansk, Volgograd, Arkhangelsk and Yakutsk. It loses **Norilsk, Anadyr, Magadan, Petropavlovsk and Khabarovsk**: tiny Arctic and Far East towns (0.1 to 0.8 million people), and Khabarovsk because it sits beside Vladivostok. Murmansk stays although small, because it is Russia's rare-earth district (Kola). A cut city is not removed from the map: it becomes an ordinary province with the same name, people and deposits.

China (14), the United States (14) and Australia (11) keep exactly the cities they have today.

### 2.4 Too few: Iran 5 to 12

Iran keeps Tehran, Tabriz, Mashhad, Shiraz and Isfahan and gains seven provinces: **Kermanshah** (its first ore), **Zahedan** (the empty south-east), **Gilan** (Caspian coast), **Ahvaz** (5.0 million people, the oil country), **Markazi** (4.3 million), **Hormozgan** (the Strait of Hormuz coast) and **Yazd** (Iran's rare-earth deposit, through the swap of step 4, in place of Qom). Table C lists every promotion in every nation with its reason and the people living there.

**Table C. Promotions and cuts**

| Nation | Cities today | Planned | Promoted (reason) | Cut |
|---|---|---|---|---|
| United Kingdom | 4 | 11 | Leicestershire (ore, 2.1M); Suffolk (oil, 1.2M); Bournemouth (people, 1.5M); Buckinghamshire (people, 1.8M); Cumbria (people, 1.3M); North Yorkshire (people, 3.6M); East Sussex (people, 3.6M) | none |
| France | 5 | 11 | Moselle (people, 2.3M); Seine-Maritime (people, 2.5M); Nord (people, 2.3M); Guyane française (second landmass, 0.9M); Cher (people, 1.4M); Haute-Garonne (people, 1.4M) | none |
| Germany | 4 | 11 | Stuttgart (ore, 8.2M); Sachsen (people, 3.1M); Hessen (people, 7.5M); Wiesbaden (people, 6.3M); Bremen (people, 3.8M); Nürnberg (people, 4.5M); Mannheim (people, 3.9M) | none |
| Italy | 3 | 11 | Bari (oil, 1.7M); Palermo (second landmass, 2.0M); Turin (people, 3.8M); Cagliari (second landmass, 1.2M); Bologna (people, 1.9M); Firenze (people, 4.2M); Foggia (people, 1.0M); Macerata (people, 0.9M) | none |
| Spain | 2 | 11 | Sevilla (people, 2.7M); Bizkaia (people, 2.1M); Pontevedra (people, 1.4M); Murcia (people, 1.3M); Zaragoza (people, 1.2M); Málaga (people, 2.4M); Salamanca (people, 1.0M); Ciudad Real (people, 0.9M); Lugo (rare earth (swap), 0.4M) | none |
| Poland | 1 | 10 | Silesian (people, 6.7M); West Pomeranian (people, 2.0M); Lower Silesian (people, 2.1M); Subcarpathian (people, 1.2M); Pomeranian (people, 2.5M); Łódź (people, 2.9M); Greater Poland (people, 2.4M); Lesser Poland (people, 2.3M); Warmian-Masurian (people, 1.8M) | none |
| Ukraine | 1 | 10 | Donets'k (people, 3.8M); Odessa (people, 2.5M); Kherson (ore, 1.3M); L'viv (people, 1.4M); Luhans'k (oil, 1.7M); Kharkiv (people, 3.0M); Dnipropetrovs'k (people, 2.8M); Khmel'nyts'kyy (people, 1.0M); Zaporizhzhya (people, 2.2M) | none |
| Romania | 1 | 9 | Bihor (people, 1.2M); Dolj (ore, 1.0M); Iasi (people, 1.4M); Braila (people, 1.9M); Mures (people, 0.8M); Covasna (people, 1.9M); Olt (people, 1.4M); Bacau (people, 1.3M) | none |
| Sweden | 1 | 8 | Västra Götaland (people, 1.0M); Luleå (oil, 0.4M); Västmanland (people, 1.1M); Kronoberg (people, 0.7M); Östergötland (people, 0.6M); Västerbotten (people, 0.5M); Värmland (people, 0.6M) | none |
| Norway | 1 | 7 | Troms (people, 0.2M); Vest-Agder (people, 0.3M); Buskerud (people, 0.8M); Sør-Trøndelag (people, 0.6M); Hordaland (people, 0.6M); Hedmark (people, 0.5M) | none |
| Finland | 1 | 7 | North Karelia (oil, 0.4M); Päijät-Häme (people, 1.3M); Rovaniemi (people, 0.4M); Central Ostrobothnia (rare earth, 0.3M); Satakunta (people, 0.6M); Northern Ostrobothnia (people, 0.5M) | none |
| Russia | 19 | 14 | none | Norilsk (0.4M); Anadyr (0.1M); Magadan (0.3M); Petropavlovsk (0.4M); Khabarovsk (0.8M) |
| Turkey | 4 | 12 | Adana (oil+ore, 2.9M); Eskisehir (rare earth, 1.9M); Sakarya (people, 1.7M); Antalya (people, 1.6M); Bursa (people, 4.1M); Artvin (people, 0.8M); Kirklareli (people, 0.8M); Malatya (people, 1.5M) | none |
| Iran | 5 | 12 | Kermanshah (ore, 1.7M); Zahedan (people, 1.6M); Gilan (people, 1.8M); Ahvaz (people, 5.0M); Yazd (rare earth, 1.5M); Markazi (people, 4.3M); Hormozgan (people, 1.0M) | none |
| Saudi Arabia | 2 | 10 | `Asir (oil, 1.0M); Hofuf (people, 3.7M); Halat Ammar (people, 0.8M); Medina (people, 3.2M); Hail (people, 0.8M); Hafar al Batin (people, 1.2M); Arar (people, 0.5M); As Sulayyil (rare earth (swap), 0.2M) | none |
| Iraq | 1 | 10 | Al-Basrah (people, 2.9M); Mosul (people, 5.0M); Babil (people, 2.5M); At-Ta'mim (people, 1.7M); Ar Ramadi (people, 3.9M); As-Sulaymaniyah (ore, 2.3M); Sala ad-Din (people, 3.0M); Arbil (people, 2.4M); Wasit (people, 2.3M) | none |
| Syria | 1 | 8 | Aleppo (people, 5.2M); Homs (people, 3.2M); Hasaka (Al Haksa) (people, 1.2M); Hamah (people, 1.5M); Dar`a (people, 1.8M); Idlib (people, 1.4M); Ar Raqqah (people, 1.0M) | none |
| Yemen | 1 | 9 | Lahij (people, 4.2M); Al Hudaydah (oil, 5.1M); Hajjah (ore, 3.1M); Ta`izz (people, 4.1M); Hadramawt (people, 1.7M); Ibb (people, 3.6M); Abyan (people, 1.3M); Al Jawf (people, 1.3M) | none |
| Egypt | 3 | 11 | Ad Daqahliyah (rare earth, 5.4M); Shamal Sina' (people, 5.3M); Al Minufiyah (oil, 5.3M); Al Minya (people, 3.2M); Mallawi (people, 7.8M); Kafr ash Shaykh (people, 3.7M); As Suways (people, 6.5M); Ash Sharqiyah (people, 4.3M) | none |
| Algeria | 1 | 11 | El Tarf (ore, 2.5M); Oran (people, 3.1M); Arak (people, 1.8M); Djelfa (people, 2.0M); Aïn Defla (people, 1.2M); Batna (people, 1.1M); Skikda (people, 2.5M); Adrar (oil, 0.7M); Chlef (people, 2.3M); Grand Erg Oriental (rare earth (swap), 0.2M) | none |
| Morocco | 1 | 10 | Marrakech - Tensift - Al Haouz (oil, 3.7M); Taza - Al Hoceima - Taounate (ore, 3.5M); Tanger - Tétouan (people, 4.4M); Guelmim - Es-Semara (people, 1.1M); Oriental (people, 2.6M); Chaouia - Ouardigha (people, 2.5M); Doukkala - Abda (people, 2.0M); Meknès - Tafilalet (people, 2.4M); Gharb - Chrarda - Béni Hssen (people, 1.4M) | none |
| Libya | 1 | 8 | Benghazi (people, 1.1M); Al Butnan (oil, 0.3M); Misratah (people, 0.8M); Al Marj (people, 0.5M); Mizdah (people, 0.5M); Sabha (people, 0.2M); Awjilah (people, 0.3M) | none |
| Nigeria | 2 | 12 | Kano (people, 12.0M); Rivers (people, 4.9M); Maiduguri (people, 6.1M); Delta (people, 7.6M); Kwara (people, 7.7M); Zamfara (oil, 2.9M); Ibadan (people, 18.5M); Ondo (people, 12.7M); Kaduna (people, 13.4M); Enugu (people, 3.8M) | none |
| Ethiopia | 1 | 11 | Degehabur Zone (oil, 5.0M); Jima (rare earth, 7.1M); Tigray (people, 5.3M); Southern Nations, Nationalities and Peoples (people, 10.1M); Bahir Dar (people, 9.6M); Dese (people, 8.5M); Dire Dawa (people, 8.1M); Afar (people, 6.0M); Goba (people, 3.6M); Gode (people, 3.4M) | none |
| Sudan | 1 | 10 | Al-Ubayyid (rare earth, 4.7M); Southern Darfur (people, 1.2M); Port Sudan (people, 2.0M); Sennar (oil, 1.1M); Shendi (people, 4.6M); Gezira (people, 3.4M); White Nile (people, 3.3M); El Fasher (ore, 1.1M); Dongola (people, 2.3M) | none |
| DR Congo | 1 | 11 | Kolwezi (rare earth, 3.5M); Nord-Kivu (people, 5.5M); Mbuji-Mayi (people, 8.9M); Gemena (people, 3.8M); Kikwit (people, 4.5M); Kisangani (people, 4.2M); Lubumbashi (people, 11.1M); Kenge (people, 6.9M); Kananga (people, 6.7M); Kalemie (people, 1.8M) | none |
| Angola | 1 | 10 | Huambo (people, 3.1M); Cuanza Sul (oil, 2.3M); Cabinda (people, 3.5M); Namibe (people, 0.8M); Mavinga (ore, 0.3M); Lunda Norte (people, 0.8M); Uíge (people, 2.3M); Benguela (people, 1.8M); Cuanza Norte (people, 1.9M) | none |
| South Africa | 3 | 11 | Thohoyandou (ore+rare earth, 2.4M); Bloemfontein (people, 3.0M); East London (oil, 2.4M); Rustenburg (people, 4.5M); Middelburg (people, 3.9M); Bethlehem (people, 3.0M); Thabazimbi (people, 2.5M); Klerksdorp (people, 2.5M) | none |
| Kenya | 1 | 7 | Coast (people, 8.8M); Eldoret (people, 7.3M); Machakos (people, 6.4M); Western (people, 6.0M); Central (people, 3.0M); Marsabit (rare earth (swap), 0.6M) | none |
| Tanzania | 1 | 11 | Mwanza (ore, 2.8M); Morogoro (people, 4.8M); Arusha (people, 4.5M); Mbeya (people, 2.8M); Kigoma (people, 2.6M); Pwani (people, 4.2M); Kilimanjaro (people, 3.9M); Tanga (people, 3.8M); Mtwara (people, 2.3M); Kagera (people, 2.3M) | none |
| Mali | 1 | 9 | Gao (oil, 1.3M); Sikasso (ore, 3.7M); Kayes (people, 2.4M); Ségou (people, 2.3M); Mopti (people, 1.5M); Nara (people, 0.8M); Taoudenni (people, 0.4M); Timbuktu (people, 1.0M) | none |
| Chad | 1 | 9 | Mayo-Kebbi Est (ore, 2.4M); Ouaddaï (people, 1.1M); Logone Oriental (people, 2.0M); Kanem (people, 0.8M); Moyen-Chari (people, 1.3M); Lac (people, 1.8M); Ennedi (people, 0.4M); Tibesti (people, 0.2M) | none |
| Mozambique | 0 | 9 | Nampula (ore, 4.8M); Sofala (people, 4.0M); Zambezia (people, 3.2M); Tete (people, 3.4M); Manica (people, 2.9M); Niassa (people, 2.4M); Cabo Delgado (people, 1.8M); Gaza (people, 1.6M) | none |
| Cameroon | 0 | 8 | Sud-Ouest (oil+ore, 3.2M); Nord (people, 2.2M); Littoral (people, 5.4M); Ouest (people, 3.4M); Sud (people, 2.0M); Est (people, 1.7M); Adamaoua (people, 1.4M) | none |
| India | 7 | 14 | Bhubaneswar (rare earth, 15.7M); Bhopal (ore, 13.3M); Kanpur (people, 33.0M); Jaipur (people, 28.3M); Patna (people, 15.4M); Guwahati (second landmass, 10.1M); Hubballi (people, 14.2M) | none |
| Japan | 5 | 12 | Aichi (people, 6.0M); Wakayama (ore, 7.5M); Okayama (people, 3.6M); Ehime (people, 3.2M); Hyōgo (people, 9.1M); Ishikawa (people, 2.4M); Mie (people, 5.4M) | none |
| Pakistan | 3 | 12 | F.A.T.A. (oil+ore+rare earth, 4.5M); Multan (people, 16.4M); Saidu (people, 32.9M); Faisalabad (people, 28.8M); Gujranwala (people, 18.5M); Hyderabad (people, 14.4M); Bannu (people, 3.8M); Sahiwal (people, 12.6M); Sukkur (people, 6.5M) | none |
| Bangladesh | 1 | 8 | Chattogram (people, 26.5M); Khulna (people, 28.0M); Rajshahi (people, 13.7M); Comilla (people, 11.6M); Mymensingh (people, 9.3M); Barisal (people, 6.6M); Chuadanga (people, 7.5M) | none |
| Indonesia | 5 | 13 | Palembang (people, 12.0M); Bandung (people, 45.5M); Jawa Tengah (people, 14.8M); Sumatera Barat (rare earth, 3.5M); Samarinda (second landmass, 6.0M); Nusa Tenggara Barat (second landmass, 3.9M); Sulawesi Utara (second landmass, 3.5M); Maluku (second landmass, 2.7M) | none |
| South Korea | 1 | 8 | Busan (people, 8.0M); South Jeolla (people, 3.7M); Andong (people, 2.8M); Daegu (people, 4.3M); North Chungcheong (people, 5.1M); Gangwon (people, 3.4M); South Chungcheong (people, 2.0M) | none |
| North Korea | 1 | 7 | Hamgyŏng-bukto (people, 2.0M); Hwanghae-namdo (people, 4.6M); P'yŏngan-namdo (people, 4.4M); Kangwŏn-do (people, 4.3M); Chagang-do (ore, 1.1M); P'yŏngan-bukto (people, 1.3M) | none |
| Vietnam | 2 | 11 | Đà Nẵng (oil, 4.5M); Đông Nam Bộ (people, 15.9M); Son La (rare earth, 1.8M); Cà Mau (people, 2.5M); Sóc Trăng (people, 2.9M); An Giang (people, 2.6M); Ninh Bình (ore, 4.6M); Nghệ An (people, 2.2M); Thái Bình (people, 6.4M) | none |
| Thailand | 1 | 11 | Udon Thani (oil, 3.2M); Songkhla (second landmass, 2.9M); Chiang Mai (people, 2.1M); Suphan Buri (ore, 1.9M); Buri Ram (people, 2.3M); Samut Sakhon (people, 3.9M); Chachoengsao (people, 3.5M); Trang (people, 2.7M); Nakhon Nayok (people, 3.3M); Nakhon Ratchasima (people, 3.3M) | none |
| Myanmar | 1 | 10 | Kachin (rare earth, 1.4M); Mandalay (people, 6.7M); Chin (people, 3.4M); Tanintharyi (people, 2.6M); Pathein (people, 6.2M); Bago (people, 5.5M); Kayin (people, 3.8M); Hinthada (people, 2.8M); Monywa (people, 2.8M) | none |
| Philippines | 2 | 11 | Negros Occidental (people, 3.9M); Mindoro Oriental (ore, 4.6M); Dagupan (people, 4.2M); Basilan (people, 2.7M); Laguna (people, 9.7M); Albay (second landmass, 1.4M); Pampanga (people, 7.8M); Leyte (people, 2.6M); Quezon (people, 5.7M) | none |
| Malaysia | 1 | 9 | Sabah (second landmass, 3.9M); Johor (people, 5.0M); Kedah (people, 4.4M); Terengganu (people, 1.7M); Pahang (ore, 3.2M); Sibu (people, 1.4M); Perak (people, 3.8M); Melaka (people, 3.6M) | none |
| Kazakhstan | 2 | 10 | Shymkent (oil, 2.6M); Semey (ore, 0.6M); Aqtobe (people, 0.9M); Oostanay (people, 0.9M); Mangyshlak (people, 0.4M); Qarazhal (rare earth, 0.2M); Qaraghandy (people, 1.3M); Oskemen (people, 0.9M) | none |
| Uzbekistan | 1 | 9 | Kashkadarya (people, 4.0M); Ferghana (people, 7.8M); Nukus (people, 3.3M); Navoi (people, 1.2M); Samarkand (people, 3.3M); Surkhandarya (people, 2.0M); Bukhoro (people, 2.4M); Jizzakh (people, 2.3M) | none |
| Afghanistan | 1 | 10 | Hirat (ore+rare earth, 1.8M); Kandahar (people, 3.4M); Balkh (oil, 1.5M); Baghlan (people, 2.1M); Nangarhar (people, 3.8M); Nimroz (people, 0.9M); Paktika (people, 0.8M); Samangan (people, 2.2M); Badakhshan (people, 1.0M) | none |
| Mongolia | 1 | 7 | Bayan-Ölgiy (people, 0.1M); Bayanhongor (ore, 0.1M); Dornod (people, 0.2M); Selenge (people, 0.4M); Övörhangay (rare earth, 0.1M); Hövsgöl (people, 0.1M) | none |
| Canada | 8 | 12 | London (people, 4.5M); Edmonton (people, 1.5M); St. John's (people, 0.2M); New Brunswick (people, 0.4M) | none |
| Mexico | 3 | 12 | Torreón (rare earth, 2.4M); Oaxaca (oil, 2.1M); Yucatán (people, 2.1M); Poza Rica de Hidalgo (people, 3.3M); Puebla (ore, 7.0M); Hermosillo (people, 2.1M); San Luis Potosí (people, 2.5M); Tuxtla Gutiérrez (people, 1.9M); Pachuca (people, 6.1M) | none |
| Brazil | 7 | 14 | Belém (people, 5.2M); Belo Horizonte (people, 9.5M); Curitiba (people, 7.5M); Uberlândia (rare earth, 2.2M); Espírito Santo (ore, 3.4M); Fortaleza (people, 5.7M); Cuiabá (people, 2.3M) | none |
| Argentina | 2 | 11 | Jujuy (ore+rare earth, 0.7M); San Juan (oil, 1.1M); Rosario (people, 3.3M); Misiones (people, 0.9M); Formosa (people, 1.3M); Tucumán (people, 0.8M); Trelew (people, 0.3M); San Rafael (people, 0.6M); Mendoza (people, 2.6M) | none |
| Colombia | 1 | 11 | Medellín (rare earth, 7.3M); Atlántico (people, 3.6M); Cauca (people, 3.4M); Cesar (people, 1.6M); Chocó (people, 2.4M); Risaralda (people, 2.8M); Puerto López (people, 2.5M); Magdalena (people, 1.9M); Tolima (people, 2.4M); Santander (people, 2.2M) | none |
| Venezuela | 1 | 10 | Monagas (rare earth, 1.4M); Carabobo (people, 3.0M); Táchira (people, 1.4M); Portuguesa (oil, 0.9M); Nueva Esparta (second landmass, 0.5M); Anzoátegui (people, 2.5M); Aragua (people, 2.3M); Lara (people, 1.9M); Ciudad Guayana (people, 1.5M) | none |
| Peru | 1 | 10 | Tacna (ore+rare earth, 0.6M); Piura (people, 1.8M); Arequipa (people, 1.8M); Áncash (people, 1.4M); Iquitos (people, 1.0M); Junín (people, 3.3M); Cajamarca (people, 1.2M); Oyon (people, 1.2M); Huánuco (people, 1.4M) | none |
| Chile | 1 | 9 | Libertador General Bernardo O'Higgins (ore+rare earth, 1.8M); Tarapacá (people, 0.8M); La Araucanía (people, 0.8M); Coquimbo (people, 1.3M); Valparaíso (people, 3.6M); Los Lagos (people, 0.7M); Punta Arenas (people, 0.3M); Maule (people, 1.0M) | none |
| Bolivia | 1 | 8 | Santa Cruz (people, 3.1M); Cochabamba (people, 1.8M); Tarija (people, 0.3M); Santa Ana (people, 0.8M); Oruro (people, 0.8M); Chuquisaca (people, 0.6M); Potosí (people, 0.6M) | none |
| Ecuador | 1 | 9 | Guayas (people, 4.0M); Manabi (people, 2.7M); Chimborazo (people, 2.0M); Azuay (ore, 1.2M); Carchi (people, 1.4M); El Oro (people, 1.3M); Cotopaxi (people, 0.8M); Morona Santiago (people, 0.5M) | none |
| New Zealand | 2 | 7 | Otago (oil, 0.2M); Manawatu-Wanganui (people, 0.4M); Waikato (people, 1.0M); Canterbury (people, 0.6M); Bay of Plenty (people, 0.4M) | none |

### 2.5 Hand review

The recipe is deliberately simple. Task 8 may swap **at most one city per nation** by hand where the result is odd to someone who knows the country (for example Khabarovsk for Petropavlovsk in Russia), and must write each swap down in the data file with a reason. The check script must still pass afterwards.

## 3. Balance rules

All numbers in this section are starting points to be tuned by the headless runs of section 5. Today's value is given in brackets where one exists.

### 3.1 What today's rules do with 64 nations (measured)

**Table H. Trial: today's rules, 64 nations with the planned cities (seed 12345, all AI)**

| Nation | Tier | Provinces | Cities | Raw money a day (before the catch-up) | Catch-up boost | Opening money a day | Manpower a day | Opening units | Land needed to win today |
|---|---|---|---|---|---|---|---|---|---|
| United Kingdom | A | 34 | 11 | 179 | 1.32 | 235 | 46 | 34 | 763 |
| France | A | 48 | 11 | 159 | 1.47 | 235 | 46 | 25 | 763 |
| Germany | A | 22 | 11 | 208 | 1.13 | 235 | 48 | 42 | 763 |
| Italy | B | 34 | 11 | 169 | 1.35 | 228 | 46 | 42 | 763 |
| Spain | B | 34 | 11 | 167 | 1.40 | 235 | 46 | 46 | 763 |
| Poland | B | 17 | 10 | 180 | 1.32 | 237 | 49 | 36 | 763 |
| Ukraine | B | 23 | 10 | 168 | 1.40 | 236 | 48 | 46 | 763 |
| Romania | C | 14 | 9 | 159 | 1.49 | 237 | 51 | 32 | 763 |
| Sweden | C | 12 | 8 | 140 | 1.70 | 238 | 53 | 32 | 763 |
| Norway | C | 11 | 7 | 122 | 1.95 | 238 | 57 | 26 | 763 |
| Finland | C | 9 | 7 | 123 | 1.94 | 238 | 57 | 26 | 763 |
| Russia | S | 287 | 14 | 237 | 1.00 | 237 | 39 | 31 | 763 |
| Turkey | A | 49 | 12 | 174 | 1.35 | 234 | 45 | 27 | 763 |
| Iran | A | 44 | 12 | 183 | 1.29 | 236 | 45 | 27 | 763 |
| Saudi Arabia | B | 26 | 10 | 160 | 1.48 | 237 | 48 | 40 | 763 |
| Iraq | B | 18 | 10 | 184 | 1.30 | 238 | 49 | 40 | 763 |
| Syria | C | 10 | 8 | 155 | 1.54 | 239 | 54 | 28 | 763 |
| Yemen | C | 13 | 9 | 171 | 1.39 | 237 | 51 | 28 | 763 |
| Egypt | B | 23 | 11 | 212 | 1.08 | 230 | 48 | 42 | 763 |
| Algeria | B | 36 | 11 | 163 | 1.45 | 235 | 46 | 56 | 763 |
| Morocco | C | 15 | 10 | 182 | 1.30 | 236 | 49 | 34 | 763 |
| Libya | C | 19 | 8 | 125 | 1.89 | 237 | 52 | 40 | 763 |
| Nigeria | A | 35 | 12 | 250 | 1.00 | 250 | 51 | 56 | 763 |
| Ethiopia | B | 14 | 11 | 246 | 1.00 | 246 | 51 | 36 | 763 |
| Sudan | B | 24 | 10 | 171 | 1.39 | 238 | 48 | 52 | 763 |
| DR Congo | B | 32 | 11 | 198 | 1.19 | 235 | 47 | 58 | 763 |
| Angola | C | 18 | 10 | 175 | 1.36 | 238 | 49 | 40 | 763 |
| South Africa | B | 24 | 11 | 191 | 1.24 | 237 | 47 | 48 | 763 |
| Kenya | C | 9 | 7 | 158 | 1.52 | 240 | 56 | 26 | 763 |
| Tanzania | B | 23 | 11 | 198 | 1.20 | 237 | 47 | 42 | 763 |
| Mali | C | 12 | 9 | 160 | 1.45 | 232 | 51 | 32 | 763 |
| Chad | C | 14 | 9 | 152 | 1.51 | 230 | 51 | 32 | 763 |
| Mozambique | C | 11 | 9 | 175 | 1.36 | 238 | 51 | 28 | 763 |
| Cameroon | C | 10 | 8 | 158 | 1.50 | 238 | 54 | 26 | 763 |
| China | S | 248 | 14 | 554 | 1.00 | 554 | 111 | 31 | 763 |
| India | S | 127 | 14 | 463 | 1.00 | 463 | 98 | 31 | 763 |
| Japan | A | 37 | 12 | 207 | 1.13 | 233 | 46 | 32 | 763 |
| Pakistan | A | 24 | 12 | 281 | 1.00 | 281 | 58 | 54 | 763 |
| Bangladesh | C | 10 | 8 | 233 | 1.02 | 237 | 55 | 28 | 763 |
| Indonesia | A | 36 | 13 | 263 | 1.00 | 263 | 55 | 44 | 763 |
| South Korea | B | 10 | 8 | 178 | 1.37 | 244 | 54 | 24 | 763 |
| North Korea | C | 9 | 7 | 143 | 1.71 | 244 | 57 | 26 | 763 |
| Vietnam | B | 25 | 11 | 209 | 1.12 | 234 | 48 | 52 | 763 |
| Thailand | B | 25 | 11 | 197 | 1.20 | 237 | 47 | 52 | 763 |
| Myanmar | B | 15 | 10 | 195 | 1.22 | 237 | 49 | 36 | 763 |
| Philippines | B | 26 | 11 | 207 | 1.10 | 228 | 48 | 30 | 763 |
| Malaysia | C | 11 | 9 | 171 | 1.35 | 231 | 51 | 30 | 763 |
| Kazakhstan | B | 39 | 10 | 122 | 1.76 | 214 | 47 | 70 | 763 |
| Uzbekistan | C | 11 | 9 | 160 | 1.35 | 216 | 51 | 30 | 763 |
| Afghanistan | B | 25 | 10 | 171 | 1.41 | 241 | 48 | 46 | 763 |
| Mongolia | C | 19 | 7 | 95 | 2.17 | 205 | 55 | 42 | 763 |
| United States | S | 230 | 14 | 271 | 1.00 | 271 | 50 | 31 | 763 |
| Canada | A | 122 | 12 | 125 | 1.88 | 235 | 41 | 27 | 763 |
| Mexico | A | 57 | 12 | 176 | 1.30 | 229 | 45 | 27 | 763 |
| Brazil | A | 119 | 14 | 190 | 1.23 | 234 | 43 | 31 | 763 |
| Argentina | B | 46 | 11 | 149 | 1.59 | 237 | 45 | 25 | 763 |
| Colombia | B | 29 | 11 | 176 | 1.34 | 235 | 47 | 50 | 763 |
| Venezuela | C | 21 | 10 | 165 | 1.43 | 236 | 48 | 40 | 763 |
| Peru | B | 24 | 10 | 163 | 1.46 | 237 | 48 | 42 | 763 |
| Chile | C | 17 | 9 | 153 | 1.56 | 238 | 50 | 42 | 763 |
| Bolivia | C | 16 | 8 | 135 | 1.76 | 238 | 53 | 40 | 763 |
| Ecuador | C | 13 | 9 | 158 | 1.49 | 237 | 51 | 32 | 763 |
| Australia | B | 60 | 11 | 120 | 1.89 | 226 | 44 | 25 | 763 |
| New Zealand | C | 13 | 7 | 109 | 2.01 | 218 | 57 | 22 | 763 |

Speed: 2260 ms per game day with 64 AI nations (68 s for 30 days).
Save text: 212 KB for a new 15-power game, 395 KB for a new 64-nation game, 722 KB after 30 days (2016 relation records).
After 30 days: 64 of 64 alive, 50 wars, eliminated: none.
Biggest gains: Mali 12 to 38, South Africa 24 to 47, Spain 34 to 56, Argentina 46 to 67, Venezuela 21 to 42, Libya 19 to 38, Nigeria 35 to 53, DR Congo 32 to 50.
Biggest losses: Russia 287 to 239, Brazil 119 to 84, France 48 to 22, Iran 44 to 20, Turkey 49 to 27, India 127 to 121, United States 230 to 226, China 248 to 246.
Tier S: provinces 892 to 832 (4 of 4 nations smaller than at the start).
Tier A: provinces 627 to 609 (4 of 12 nations smaller than at the start).
Tier B: provinces 652 to 938 (0 of 24 nations smaller than at the start).
Tier C: provinces 317 to 563 (1 of 24 nations smaller than at the start).
Independent (AI-only) land: 564 provinces at the start, 110 after 30 days.

What the table shows:

- **Money is flat.** Today every nation is lifted to about 200 a day at the start (the "catch-up": income is multiplied by 200 divided by the raw income, up to 2.5 times). That was right for 15 hand-picked powers. With 64 it makes Mongolia (raw 95) as rich as Russia (raw 237), and only China, India, the United States, Pakistan, Indonesia, Nigeria and Ethiopia stand out.
- **Manpower is upside down.** Big empires run less efficiently under today's administration rule, so Russia makes 39 manpower a day and Norway 57.
- **Units are upside down.** Today's "small nation" rule (40 provinces or fewer: a dug-in garrison on every border province, three weeks of grace) was written for Germany, Japan and Britain. 52 of the 64 nations qualify. Kazakhstan opens with 70 units, the United States with 31.
- **Result:** the middle and small nations grow by half in 30 days (tier B from 652 to 938 provinces), the giants shrink (tier S from 892 to 832), France, Iran and Turkey lose half their land.

### 3.2 Start by tier

| | Tier S (4) | Tier A (12) | Tier B (24) | Tier C (24) | Today, every power |
|---|---|---|---|---|---|
| Opening money a day (target after catch-up) | 330 | 280 | 235 | 215 | about 235 |
| Money in the treasury | 320 | 260 | 220 | 200 | 220 |
| Manpower in stock | 140 | 110 | 90 | 80 | 80 |
| Oil / materials / iron / electronics in stock | 60 / 80 / 90 / 40 | 50 / 70 / 80 / 35 | 40 / 60 / 70 / 30 | 40 / 60 / 70 / 30 | 40 / 60 / 70 / 30 |
| Rare earth in stock | 40, or 60 for a nation with no rare-earth city | same | same | same | 40 |
| Capital force | 6 infantry, 3 tanks, 2 artillery | 5 infantry, 2 tanks, 1 artillery | 4 infantry, 1 tank, 1 artillery | 4 infantry, 1 tank | 4 infantry, 1 tank |
| Every other city | 2 infantry; 1 tank more in the 4 biggest | 2 infantry; 1 tank more in the 2 biggest | 2 infantry | 2 infantry | 2 infantry |
| Border guards (2 infantry each, on provinces that touch foreign land and are not cities) | 5 | 4 | 3, each in a level 1 fort | 3, each in a level 1 fort | every border province if the nation has 40 provinces or fewer, none otherwise |
| Buildings | Arms Factory 1 in the capital; Recruiting Office in the capital and the 4 biggest cities | same, 3 biggest cities | same, 2 biggest cities | same, 2 biggest cities; Fort 1 in the capital | Arms Factory in the capital, Recruiting Office in the capital and 2 biggest cities |
| Opening units, typical | about 51 | about 40 | about 30 | about 25 | 22 to 70 (table H) |

Rules behind the table:

- **Catch-up by tier.** The catch-up stays, but it aims at the tier's target instead of 200 for everyone, and it can also hold a nation back: income multiplier = target / raw income, kept between 0.75 and 2.5, and left at 1 when the raw income is between the target and 1.25 times the target. So Mongolia (raw 95) reaches 215, Russia (raw 237) is lifted to 330, China (raw 554) is damped to about 415. The multiplier applies to every good and to manpower, as today, so manpower comes out in tier order too. It applies only to a nation's home provinces, as today, so conquests are worth the same to everyone.
- **Border guards replace the "small nation" rule.** Guards go first to the border with the strongest playable neighbour (table D), then the next.
- **Units are the ones every nation can already build on day one.** No tier starts with aircraft, ships or missiles; island and coastal nations of tier S and A (United States, Japan, United Kingdom, Indonesia and so on) get a Naval Yard level 1 in their biggest port city instead of 2 of their border guards. This is the one new item and can be dropped if the navy rules say otherwise.
- **Today's 15 powers in a 64-nation game follow the same table.** A game of the old 15-power world, and every old save, keeps today's rules untouched (section 4).

### 3.3 Resources: minimum access and rare earth

The economy is being redesigned in parallel (docs/ECONOMY.md on branch economy-v1; it did not exist yet when this plan was written). This plan assumes what the task brief states: **one main resource per city; rare earth in 1 or 2 cities of a country, and in none for some.** The rules below are written to fit that and must be checked against ECONOMY.md before task 8 starts; where they differ, ECONOMY.md wins and only the letters in table B change.

Assumed assignment of a nation's cities (function assignRes in the script; table B shows the result):

1. **Rare earth: at most 2 cities**, the two richest deposits among its cities. A nation with no deposit has none.
2. **Oil, materials, iron:** cities that sit on a deposit, at most about a fifth of the nation's cities each.
3. **Electronics:** the capital and the most populous cities, about a quarter of the cities.
4. **The rest:** money on the coast, manpower inland.
5. **Minimum access.** Every nation must have at least **3 of the 4 industrial goods** (oil, materials, iron, electronics) among its cities. If it does not, its smallest money or manpower cities are given the missing goods until it does (marked + in table B: an industry without a deposit). The fourth good, and rare earth for those without, has to be bought or conquered. That is on purpose: it is what makes trade and war aims.

Measured result: 31 of the 64 nations have a rare-earth city (32 cities in all; only Egypt has 2) and 33 have none; 33 nations have a deposit somewhere in their land. 53 nations have an oil city, 44 a materials city, 35 an iron city; 45 cities carry a granted resource. Nations with no deposit at all include the United Kingdom, France, Germany, Italy, Japan, Poland and South Korea. Of the giants, China, India and Russia have one rare-earth city each (China 16 deposit provinces, one city: Guangzhou's district). The United States has 8 deposit provinces and no rare-earth city, because it keeps exactly its 14 cities of today and none sits on a deposit; its deposits stay ordinary provinces. Whether such deposits still yield anything is for ECONOMY.md to say; if they do not, the United States should swap one city by hand (2.5).

Two safety nets, both already in the game and kept:

- **The capital trickle.** Every capital makes a little of every good each day (today: oil 3, materials 3, iron 3.5, electronics 1.5, rare earth 1). No nation is ever at zero of anything.
- **The state reserve (built in the Africa repair).** In the nations world a nation whose starting cities make none of one of the four industrial goods (the fourth good above) gets twice the capital trickle of that good (`ECO_RESERVE` 2, `N.reserve`, set once at the start; `node tools/eco-check.js` asks for more than 4 oil, materials and iron a day on day 1). It still has to buy most of what it needs. Since the merge into master the big-country oil city of master's economy follow-ups (`cityMains` in `rules/map.js`: a country of 8 or more cities with no oil city gets one, Port Hedland in the classic world) applies in both worlds and comes first, so the reserve is only for what is still lacking after it: with all 68 nations, electronics for Norway and Mongolia; no nation gets an oil reserve any more (the 11 nations that had one, all of 8 to 11 cities, now have an oil city).
- **The world market.** A nation without a good can buy it. The nations with no rare-earth city start with 60 in stock instead of 40 to cover the first weeks.

Check for task 8: no nation may start with more than 2 rare-earth cities; the world's rare-earth cities must be spread so that no single nation holds more than a tenth of them (today 2 of 32).

### 3.4 Capital bonuses

Kept from today, for all 64:

- the capital trickle of every good (3.3);
- an Arms Factory level 1 and a Recruiting Office at the start;
- losing the capital cuts income by 40% for 14 days and moves the capital to another home city; a nation with no city left collapses;
- each starting capital counts toward victory (3.6).

New, small:

- tier C capitals start with a level 1 fort (today's small-nation rule, kept only there);
- the capital's main resource is electronics (assumption of 3.3), so every nation has at least one electronics city.

No bonus grows with tier: a tier S capital is worth the same as a tier C one. The tiers differ in the start table only.

### 3.5 Strong and weak neighbours

**Table D. Neighbour pairings (land borders of the home landmass; overseas parts such as French Guiana are left out)**

| Nation | Tier | Playable land neighbours (tier) | Strongest neighbour / own strength | AI-only land neighbours |
|---|---|---|---|---|
| United Kingdom | A | France (A) | 1.1x France | none |
| France | A | United Kingdom (A), Germany (A), Italy (B), Spain (B) | 0.9x United Kingdom | Belgium, Switzerland |
| Germany | A | Poland (B), France (A) | 1.1x France | Denmark, Netherlands, Czechia, Belgium, Switzerland, Austria |
| Italy | B | France (A) | 1.1x France | Switzerland, Austria, Slovenia |
| Spain | B | France (A), Morocco (C) | 1.1x France | Portugal |
| Poland | B | Germany (A), Ukraine (B), Russia (S) | 3.1x Russia | Czechia, Slovakia, Belarus, Lithuania |
| Ukraine | B | Russia (S), Romania (C), Poland (B) | 3.0x Russia | Belarus, Moldova, Slovakia, Hungary |
| Romania | C | Ukraine (B) | 1.2x Ukraine | Bulgaria, Moldova, Serbia, Hungary |
| Sweden | C | Finland (C), Norway (C) | 0.9x Norway | Denmark |
| Norway | C | Sweden (C), Finland (C), Russia (S) | 5.2x Russia | none |
| Finland | C | Russia (S), Norway (C), Sweden (C) | 5.3x Russia | none |
| Russia | S | Ukraine (B), Finland (C), Kazakhstan (B), Norway (C), Mongolia (C), China (S), North Korea (C) | 2.3x China | Belarus, Estonia, Latvia, Georgia, Azerbaijan |
| Turkey | A | Syria (C), Iran (A), Iraq (B) | 1.0x Iran | Greece, Georgia, Armenia, Azerbaijan, Bulgaria |
| Iran | A | Iraq (B), Turkey (A), Afghanistan (B), Pakistan (A) | 1.2x Pakistan | Azerbaijan, Turkmenistan, Armenia, Oman |
| Saudi Arabia | B | Yemen (C), Iraq (B), Egypt (B) | 1.3x Egypt | Jordan, Kuwait, Qatar, United Arab Emirates, Oman |
| Iraq | B | Iran (A), Syria (C), Turkey (A), Saudi Arabia (B) | 1.5x Turkey | Jordan, Kuwait |
| Syria | C | Iraq (B), Turkey (A) | 2.0x Turkey | Lebanon, Israel, Jordan |
| Yemen | C | Saudi Arabia (B) | 1.2x Saudi Arabia | Djibouti, Oman |
| Egypt | B | Saudi Arabia (B), Libya (C), Sudan (B) | 0.8x Sudan | Israel, Palestine, Jordan |
| Algeria | B | Libya (C), Morocco (C), Mali (C) | 0.8x Morocco | Tunisia, Mauritania, W. Sahara, Niger |
| Morocco | C | Algeria (B), Spain (B) | 1.2x Spain | W. Sahara, Mauritania |
| Libya | C | Algeria (B), Chad (C), Egypt (B), Sudan (B) | 1.9x Egypt | Tunisia, Niger |
| Nigeria | A | Cameroon (C), Chad (C) | 0.4x Chad | Benin, Niger |
| Ethiopia | B | Sudan (B), Kenya (C) | 0.8x Sudan | Eritrea, Djibouti, S. Sudan, Somaliland, Somalia |
| Sudan | B | Ethiopia (B), Egypt (B), Libya (C), Chad (C) | 1.3x Egypt | S. Sudan, Eritrea, Central African Rep. |
| DR Congo | B | Angola (C), Tanzania (B) | 0.9x Tanzania | Zambia, Rwanda, Burundi, Uganda, Central African Rep., S. Sudan, Congo |
| Angola | C | DR Congo (B) | 1.4x DR Congo | Congo, Zambia, Namibia, Botswana |
| South Africa | B | Mozambique (C) | 0.7x Mozambique | Botswana, Lesotho, Zimbabwe, Eswatini, Namibia |
| Kenya | C | Tanzania (B), Ethiopia (B) | 1.7x Ethiopia | Uganda, S. Sudan, Somalia |
| Tanzania | B | Kenya (C), Mozambique (C), DR Congo (B) | 1.2x DR Congo | Malawi, Uganda, Zambia, Burundi, Rwanda |
| Mali | C | Algeria (B) | 1.5x Algeria | Guinea, Mauritania, Senegal, Burkina Faso, Côte d'Ivoire, Niger |
| Chad | C | Nigeria (A), Cameroon (C), Sudan (B), Libya (C) | 2.3x Nigeria | Niger, Central African Rep. |
| Mozambique | C | South Africa (B), Tanzania (B) | 1.4x Tanzania | Eswatini, Zimbabwe, Malawi, Zambia |
| Cameroon | C | Nigeria (A), Chad (C) | 2.4x Nigeria | Central African Rep., Congo, Eq. Guinea, Gabon |
| China | S | Mongolia (C), North Korea (C), Russia (S), India (S), Myanmar (B), Kazakhstan (B), Vietnam (B), Pakistan (A), Afghanistan (B) | 0.8x India | Bhutan, Nepal, Laos, Kyrgyzstan, Tajikistan |
| India | S | China (S), Pakistan (A), Bangladesh (C) | 1.2x China | Nepal, Sri Lanka |
| Japan | A | none (sea only) | - | none |
| Pakistan | A | India (S), Afghanistan (B), China (S), Iran (A) | 4.1x China | Tajikistan |
| Bangladesh | C | India (S), Myanmar (B) | 5.3x India | Nepal |
| Indonesia | A | none (sea only) | - | none |
| South Korea | B | North Korea (C) | 0.8x North Korea | none |
| North Korea | C | South Korea (B), China (S), Russia (S) | 10.6x China | none |
| Vietnam | B | China (S) | 5.3x China | Cambodia, Laos |
| Thailand | B | Myanmar (B) | 0.8x Myanmar | Cambodia, Laos |
| Myanmar | B | Thailand (B), Bangladesh (C), China (S), India (S) | 6.9x China | Laos |
| Philippines | B | none (sea only) | - | none |
| Malaysia | C | Indonesia (A), Thailand (B) | 2.3x Indonesia | none |
| Kazakhstan | B | Uzbekistan (C), China (S), Russia (S) | 6.9x China | Kyrgyzstan, Turkmenistan |
| Uzbekistan | C | Kazakhstan (B), Afghanistan (B) | 1.2x Afghanistan | Kyrgyzstan, Tajikistan, Turkmenistan |
| Afghanistan | B | Pakistan (A), China (S), Uzbekistan (C), Iran (A) | 6.7x China | Tajikistan, Turkmenistan |
| Mongolia | C | Russia (S), China (S) | 11.4x China | none |
| United States | S | Canada (A), Mexico (A) | 0.5x Mexico | none |
| Canada | A | United States (S) | 2.2x United States | none |
| Mexico | A | United States (S) | 2.1x United States | Guatemala, Belize |
| Brazil | A | Bolivia (C), Argentina (B), France (A), Venezuela (C), Colombia (B), Peru (B) | 0.6x France | Paraguay, Suriname, Guyana, Uruguay |
| Argentina | B | Brazil (A), Chile (C), Bolivia (C) | 2.0x Brazil | Uruguay, Paraguay |
| Colombia | B | Venezuela (C), Peru (B), Brazil (A), Ecuador (C) | 2.1x Brazil | Panama |
| Venezuela | C | Brazil (A), Colombia (B) | 2.5x Brazil | Guyana, Trinidad and Tobago |
| Peru | B | Brazil (A), Bolivia (C), Ecuador (C), Colombia (B), Chile (C) | 2.5x Brazil | none |
| Chile | C | Argentina (B), Bolivia (C), Peru (B) | 1.5x Argentina | none |
| Bolivia | C | Brazil (A), Peru (B), Chile (C), Argentina (B) | 3.4x Brazil | Paraguay |
| Ecuador | C | Peru (B), Colombia (B) | 1.5x Colombia | none |
| Australia | B | none (sea only) | - | none |
| New Zealand | C | none (sea only) | - | none |

Measured: 13 nations have a playable land neighbour more than 3 times their strength: Poland, Ukraine, Norway and Finland (Russia); Pakistan, Bangladesh, North Korea, Vietnam, Myanmar, Kazakhstan, Afghanistan and Mongolia (China or India); Bolivia (Brazil). North Korea and Mongolia face more than 10 times. Rules for them:

1. **Longer grace against a giant.** Today computer nations do not declare war on a neighbour for the first 8 days (21 days if the victim is "small"). New: 8 days for everyone, and **21 days when the attacker is two or more tiers above the victim** (S against B or C, A against C). The "small" test goes.
2. **The computer prefers its own weight.** When a computer nation chooses whom to attack, a target two or more tiers below counts as half as attractive, and a target of its own tier or one above counts in full. Giants are steered toward each other and toward independent land first.
3. **Neighbours of the same giant start as friends.** Nations that share a neighbour more than 3 times their strength start with good relations with each other (a starting opinion bonus), so the game's existing coalitions tend to form around the giant: Norway and Finland, Poland and Ukraine (Russia); Kazakhstan, Mongolia, Afghanistan, Pakistan, North Korea, Vietnam and Myanmar (China).
4. **Guards face the giant** (3.2).
5. **The start screen tells the truth.** Each nation shows a difficulty next to its name, worked out from its tier and from the last column of table D: Easy (tier S or A and no neighbour above 1.5 times), Normal, Hard (a neighbour above 2 times), Very hard (a neighbour above 3 times). Mongolia and North Korea are Very hard and say so.

No rule makes the weak nation's soldiers fight better. A small nation survives through forts, grace, friends and the giant's other worries, not through a hidden bonus.

Sea-only nations (Japan, the Philippines, Australia, New Zealand; the United Kingdom touches only France) have no land neighbour to pair. They are checked in the rollout by a different test: that the computer playing them does something at all (5.4).

### 3.6 Victory as the number of nations grows

Today (15 powers): hold a quarter of the world's land provinces (763 of 3,052), or your starting land plus 90 if that is more, **or** hold 5 of the 15 starting capitals. A coalition wins with 1.8 times the land or 3 more capitals.

Measured: the 64 nations start with 2,488 provinces (82% of the land) and the independent 564 are almost gone after a month. The largest start is Russia with 287, so the land target is far for everyone, which is right. The capital target is the one that breaks: 5 capitals of 64 is a giant eating four small neighbours, a few weeks' work.

Rules:

- **Capitals needed = the number of playable nations in the game divided by 6, rounded, and never fewer than 5.** 15 nations: 5 (as today). 23 (after Europe): 5. 27 (after the Middle East): 5. 41 (after Africa): 7. 55 (after Asia): 9. 63 and 64: 11.
- **Land needed** stays a quarter of the world's land while there are 27 nations or fewer; 22% from 28 to 41 nations (672 provinces); **20% from 42 nations up (611 provinces)**. The "starting land plus 90" floor stays.
- **Coalition victory:** land times 1.8 as today; capitals needed times 1.5, rounded (17 of 64), instead of "3 more".
- **AI-only capitals never count.** Only the 64 starting capitals do.
- The two theatre scenarios (Europe, Pacific Rim: 8 powers, 4 capitals) and the old 15-power world are unchanged.

Tuning target for the runs in section 5: in all-computer games of the full 64, nobody wins before day 60, and half the games are decided between day 120 and day 250. If games run longer, lower the land share before lowering the capitals.

### 3.7 Computer difficulty

- The four difficulty levels stay as they are (Recruit to Elite: computer income times 0.75 / 1 / 1.2 / 1.45, war strength times 0.6 / 1 / 1.3 / 1.6). They apply to every computer nation alike.
- **Tier does not change how clever the computer is.** A tier C computer nation plays by the same rules as a tier S one with a smaller start.
- **Limit on wars at once**, by tier, so 63 computer nations do not all fight everyone (the trial had 50 wars on day 30): tier S may start a war while in at most 2 others, A and B while in at most 1, C only when in none. Wars declared on them do not count.
- **Thinking in turns, for speed.** Computer nations that border a human player's land or are at war with one think every hour, as today. The others take turns: each thinks one hour in three. The rules stay the same for everyone; only the planning step of far-away nations is spread out. The same seed must still give the same game (5.2).
- **Seats.** Any of the 64 can be a seat (a human). A seat nobody commands gives no orders and the computer leaves it alone; that is today's multiplayer-ready behaviour and stays.

## 4. Data and code changes

### 4.1 Principle: world.js is not touched

Province numbers are used everywhere: saves, roads and rails (lines.js), coasts, tests. This plan changes **no province and no province number**. world.js stays byte for byte as it is, with its 211 city flags and 15 capital flags, which remain the definition of the old 15-power world.

### 4.2 New data file: nations.js

One new generated file next to world.js, loaded right after it, published with the page like the others:

    window.NATIONS = { v:1,
      nations: [ { name:'Poland', country:'Poland', region:'Europe', tier:'B', color:'#d6c83c',
                   capital: <province number>, cities: [<province numbers, capital first>],
                   names: { <province number>: 'Katowice', ... },        names of promoted cities
                   res:   { <province number>: 'elec', ... },            main resource of each city (from ECONOMY.md)
                   swaps: [ { out:<province>, in:<province>, why:'...' } ] }, ... 64 entries ],
      rollout: ['Europe', 'Middle East', 'Africa', 'Asia', 'Americas', 'Oceania'] }

- It is written by a new tool, tools/build-nations.js, from the list and method in .test/nations-analysis.js, and never edited by hand except through the swaps list.
- AI-only countries need no entry: every province already carries its country.
- Flags exist already for all 192 countries. 49 new nation colours are needed; rule: no two nations that share a border, or face each other across a strait, may have colours closer than a set distance, checked by the tool.

### 4.3 Rules changes (rules/ folder only; no drawing code)

| Where | Change |
|---|---|
| rules/state.js, list of powers | A new scenario key, world64, whose powers come from NATIONS (those of the regions already rolled out). The old list of 15 stays under the key world, unchanged. |
| rules/map.js, loading the world | A function that sets, for the scenario in use, which provinces are cities and capitals and their city names: from world.js flags for world, europe and pacific; from NATIONS for world64. Today the city flag is read once and then altered by new games; this makes it a clean switch. Promoted cities take the "urban" ground the same way today's cities do. |
| rules/state.js, new game | Capital from NATIONS; start kit by tier (3.2) from a table in rules/data.js; border guards; catch-up by tier; friends of a shared giant (3.5). Fields added to a nation: tier, region. The "small" field is no longer set in world64. |
| rules/economy.js | Catch-up multiplier may be below 1 (floor 0.75). Grace by tier gap instead of "small". |
| rules/state.js, victory | Capitals needed and land share as functions of the number of nations (3.6). |
| rules/ai.js | Target weighting by tier gap, limit on wars at once, thinking in turns (3.7). |
| rules/data.js | Tier table; names for numbers above fifteen are not needed (the briefing already falls back to digits). |
| index.html (screen only) | Start screen: 64 nations do not fit the 15 cards of today. Six region tabs, each a list of its nations with flag, tier, cities, difficulty (3.5). The nations panel and the diplomacy screen need a region filter or scrolling for 63 rows. No rule lives here. |
| tools/build.js, tools/mkpage.sh, publishing | Copy nations.js like world.js. The published artifact gains one file. |

### 4.4 Old saves (the 15-power world)

Nothing an old save depends on changes:

- An old save has no scenario key or the key world. Loading it selects the old world: 15 powers, the 211 old cities, 5 capitals to win, today's start and catch-up values already baked into the save. It plays on exactly as before.
- A save of a 64-nation game carries scenario world64 and nations version 1. Loading selects the new world.
- The game must refuse, with a clear message, to load a world64 save in a build that has fewer regions rolled out than the save needs (possible only between test builds; the public build gets all regions it ships with).
- **Proof required in task 8, before any region:** the headless golden file (tools/golden-12345.txt) and the same-seed check (node tools/headless.js --check) must give the same result as today for the old world, and the old-save tests (save, v3air-oldsave, S-res-oldsave) must pass unchanged.
- The old world stays selectable on the start screen as "Classic: 15 powers" until the owner retires it. The two theatre scenarios stay as they are.

### 4.5 Size and speed (measured)

- Save text: 212 KB for a new 15-power game, 395 KB for a new 64-nation game, 722 KB after 30 days. Most of the growth is the 2,016 relation records between 64 nations (105 between 15). Task 8 should store a relation only once it differs from the default; target under 300 KB at the start.
- Speed: 2,260 ms a game day with 64 computer nations against 444 ms with 15, on this machine without a browser. Budget in 5.2.

### 4.6 Not in this plan: splitting provinces

Israel, Greece, Cuba, Serbia, Portugal, Belarus and Taiwan can only become playable if their provinces are cut smaller. Israel is 8 map cells in all, so it cannot reach 9 provinces even then without redrawing the map at a finer grain around it. If the owner wants them: a later task adds new provinces **at the end of the list only** (old numbers keep their meaning), each new one recording which old province it was cut from, so an old save can be widened on load by copying the parent's owner and buildings. Roads, rails and coasts for the cut provinces must be rebuilt. It is a map job of its own and should not be mixed into task 8.

## 5. Rollout for task 8

### 5.1 Order

| Step | Adds | Playable nations after it | Capitals to win |
|---|---|---|---|
| 0. Plumbing | nations.js, the world switch, tiers, victory functions, start screen with regions, old-world proof. The 64-nation world opens with today's 15 powers only, on the new rules. | 15 | 5 |
| 1. Europe | Italy, Spain, Poland, Ukraine, Romania, Sweden, Norway, Finland (new cities for the United Kingdom, France, Germany, Russia) | 23 | 5 |
| 2. Middle East | Saudi Arabia, Iraq, Syria, Yemen (new cities for Turkey, Iran, Egypt) | 27 | 5 |
| 3. Africa | Algeria, Morocco, Libya, Nigeria, Ethiopia, Sudan, DR Congo, Angola, Kenya, Tanzania, Mali, Chad, Mozambique, Cameroon (new cities for South Africa) | 41 | 7 |
| 4. Asia | Pakistan, Bangladesh, Indonesia, South Korea, North Korea, Vietnam, Thailand, Myanmar, Philippines, Malaysia, Kazakhstan, Uzbekistan, Afghanistan, Mongolia (new cities for India, Japan; China unchanged) | 55 | 9 |
| 5. Americas | Mexico, Argentina, Colombia, Venezuela, Peru, Chile, Bolivia, Ecuador (new cities for Canada, Brazil; United States unchanged) | 63 | 11 |
| 6. Oceania | New Zealand (Australia unchanged) | 64 | 11 |

A region not yet rolled out is independent land, as today. Each step is one or more commits and ends with all of 5.2 and its own line of 5.4 passing. A step that fails its balance test is tuned (start table, grace, weights) and re-run; it is not merged failing.

### 5.2 Tests every step must pass

A new tool, tools/nations-balance.js, plays all-computer games without a browser (like tools/headless.js) and prints one PASS or FAIL line per test. Five seeds, 60 game days each, unless stated.

| Test | Passes when |
|---|---|
| T1 Structure | node .test/nations-analysis.js check passes; nations.js matches it; every nation of the step has 7 to 14 cities, a capital among them, at most 2 rare-earth cities, at least 3 of the 4 industrial goods. |
| T2 Opening | On day 0, every nation's money a day is within 10% of its tier target (damped giants: at most 1.3 times the target). Median manpower a day and median opening units are in tier order, S above A above B above C. |
| T3 Survival | No nation is eliminated before day 21 in any seed. No nation with a neighbour more than 3 times its strength (table D) is eliminated before day 30 in more than 1 seed of 5. |
| T4 No runaway | In at most 1 seed of 5 does any nation hold more than twice its starting provinces plus 40 on day 60. Nobody has won by day 60. |
| T5 Tier fairness | On day 60, each tier's total provinces are between 85% and 150% of its start (trial with today's rules: S 93%, B 144% after only 30 days), and no more than a quarter of any tier's nations have lost over a third of their land. |
| T6 Length | Two seeds, 300 days: no win before day 60; note the day of the win. From step 4 on, at least one of the two is decided by day 250. |
| T7 Speed | Milliseconds per game day, all computer, on the build machine: step 0 at most 500; Europe 650; Middle East 720; Africa 950; Asia 1,150; Americas 1,250; Oceania 1,250 (today 444 with 15; untuned 64 measured 2,260). |
| T8 Same seed, same game | node tools/headless.js --check passes for the new world; the old world still matches tools/golden-12345.txt. |
| T9 Seats | Each new nation of the step is started once as an unplayed seat for 3 days: no error, and it receives its dispatches. |
| T10 Nothing else broke | The full list of browser tests (at most 2 at a time on a busy machine), node tools/smoke.js 20 printing ERRORS none, the developer playtest (node .test/devplay.js) and the public smoke test, with an old 15-power save loaded and played 5 days. Battery saver checks (.test/battery.js, rdstale, rdwhy) unchanged. |
| T11 Save size | A new game's save text is under 300 KB at step 6. |

### 5.3 What to look at by eye each step

One screenshot of the start screen's region tab, one of the region at the opening zoom (city names must not collide; with twice as many cities this is the likely visual problem), one on a phone-size screen.

### 5.4 Per-region acceptance

| Step | Region-specific checks, on top of 5.2 |
|---|---|
| 0. Plumbing | With 15 nations on the new rules: T2 to T5 pass; Russia, China, the United States and India are not smaller on day 60 than at the start in at least 3 seeds of 5. Old world byte-identical (T8). |
| 1. Europe | Norway and Finland alive on day 45 in at least 4 seeds of 5; Poland and Ukraine alive on day 30 in at least 4. Russia holds at least 85% of its start on day 60 in 3 of 5. Germany, hemmed in by six independent states, has taken at least 3 independent provinces by day 30 (it must not sit still). |
| 2. Middle East | Syria and Yemen alive on day 30 in 4 of 5. Turkey and Iran, which lost half their land in the trial, hold at least 75% of their start on day 60 in 3 of 5. Every nation here has an oil city or oil in the capital trickle; the world oil price on day 60 is within half and double its day-1 value. |
| 3. Africa | 14 new nations at once, the largest step: T7 is the gate. No African nation more than doubles by day 60 in more than 1 seed (Mali tripled in the trial). The two landlocked desert nations (Mali, Chad) have positive money on day 30. |
| 4. Asia | North Korea, Mongolia and Bangladesh (the three weakest pairings on the map) alive on day 30 in 4 of 5. China and India are at war with each other or with a tier A nation, not only with tier C ones, in at least 3 of 5 on day 60. Japan, Indonesia and the Philippines (sea nations) each hold at least one province they did not start with by day 60 in 3 of 5, or have built ships: the computer must not be stuck on its islands. |
| 5. Americas | Bolivia alive on day 30 in 4 of 5. The United States is not below 95% of its start on day 60. Brazil, which fell from 119 to 84 provinces in the trial, holds at least 85% in 3 of 5. |
| 6. Oceania | New Zealand alive on day 60 in 5 of 5 and with positive money. Full 64: T6 in full (two 300-day games), T11, and one 10-day browser playtest as New Zealand and one as Mongolia with no console errors. |

## 6. Decisions for the owner

1. **The 9-province rule.** Accept that Israel, Greece, Cuba, Serbia, Portugal, Belarus and Taiwan are AI-only for now (this plan), or order the province-splitting map job of 4.6 first.
2. **Which 64.** The reserve of table E (Uganda, Madagascar, Zambia, Burkina Faso, Niger, Côte d'Ivoire, Cambodia and others) can be swapped in for any chosen nation at no cost before its region is built. Bolivia, Ecuador, Mali, Chad and Cameroon are the weakest picks if a swap is wanted.
3. **Tiers.** The six hand corrections of 1.2, and whether tiers should be this far apart (opening money 330 to 215) or closer, as in Conflict of Nations where every nation starts nearly equal.
4. **Classic 15-power world.** Keep it on the start screen for good, or only until the 64 are complete.
5. **Economy.** Section 3.3 is an assumption until docs/ECONOMY.md is merged.


### Owner's answers (2026-11-10)
1. **Small nations:** Israel, Greece, Cuba and Belarus must be **playable**: do whatever is needed province-wise (split their provinces into smaller ones, a map job, section 4.6) so each can hold 7 cities. Serbia, Portugal and Taiwan stay **AI-only**.
2. **Tiers:** in **normal mode**, nations start **close to equal, like Conflict of Nations** (big countries are bigger, not much richer at the start). In **competitive mode**, starts are **more distinctive, but not too much**: balance realism with a good playing experience.
3. **Classic 15-power world:** keep it on the start screen **until the 64 are done**, then remove it.
4. **Roster:** keep the plan's 64 (no swaps). Adding Israel, Greece, Cuba and Belarus makes 68 playable unless the owner later drops some.

## Appendix: world numbers

**Table G. Victory numbers measured**

Land provinces 3052; a quarter of them is 763. Largest playable nation at the start: Russia 287, China 248, United States 230, India 127, Canada 122. Planned starting cities in total: 653; city provinces in AI-only countries: 33.

Nations with rare-earth deposits anywhere in their land: 33 of 64. Borders where the stronger playable neighbour is more than 3 times the weaker: Poland, Ukraine, Norway, Finland, Pakistan, Bangladesh, North Korea, Vietnam, Myanmar, Kazakhstan, Afghanistan, Mongolia, Bolivia.
Nations at or under 40 provinces (today's "small nation" rule: denser dug-in home army, three weeks of grace): 52 of 64. Nations with a rare-earth city: 31 of 64 (32 rare-earth cities in all); with an oil city 53, a materials city 44, an iron city 35; cities granted a resource by the minimum-access rule: 45.
Today's opening catch-up (income boost = 200 / raw money income, between 1 and 2.5) applied to the strength index: 8 nations would sit at the 2.5 cap (index under 80), 7 would get no boost (index 200 or more).

World in world.js: 192 countries with land, 3052 land provinces, 211 provinces flagged as cities, 15 flagged capitals.
Playable: 64 nations holding 2488 land provinces (82%) and 7096.1M of 7996.9M people. AI-only: 128 countries, 564 provinces.

## 7. Build log (task 8)

### Step 0, plumbing (branch nations-68)

What was built, and where it differs from the sections above (the owner's answers of section 6 decide):

- **Roster: 68.** The plan's 64 plus Israel, Greece, Cuba and Belarus (tier C). The four are in the roster of `tools/build-nations.js` marked as waiting for the province split (section 4.6); they are written to `nations.js` only once their new provinces exist. Serbia, Portugal and Taiwan stay AI-only.
- **nations.js** is written by `tools/build-nations.js` (the roster, the tiers of table A and the city-choice method of section 2 moved there from `.test/nations-analysis.js`; `--preview` prints the same cities as table B). At step 0 no region is open: the file holds today's 15 powers with the cities `world.js` gives them today, in the classic order. It has no `res` field: a city's main resource is worked out by the economy's own rule (`cityMains`, `docs/ECONOMY.md`) from the cities of the world in use, so there is one source for it.
- **The world switch** is `useWorld` in `rules/map.js` (section 4.3). A nations-world save carries its own cities (`S.w64`), so a save made at one rollout step still loads at a later one; only a save of a newer format is refused (section 4.4).
- **Normal mode starts close to equal** (owner's answer 2). `rules/data.js` holds an equal start (`TIER_EVEN`), the wide table of 3.2 (`TIER_FULL`) and, per game mode, a spread between the two: 0.3 for normal mode, 0.6 kept for the later competitive mode. In normal mode: money a day S 247, A 233, B 220, C 214 (the plan had 330 to 215); manpower a day 66 / 62 / 58 / 56; treasury 250 / 232 / 220 / 214; capital force S 5 infantry 2 tanks 1 artillery, the others 4 infantry 1 tank; one tank more in the biggest other city for S and A; border guards 4 / 3 / 3 / 3 (two fewer where a tier S or A nation gets its Naval Yard; from step 1 none fewer in normal mode, see step 1 below); Recruiting Offices in the capital and 3 / 2 / 2 / 2 cities.
- **Catch-up.** Money and goods use one multiplier on home provinces, manpower its own (`boostM`), both between the mode's floor (0.3 in normal mode) and 2.5; a nation between its target and 10% above is left alone, a richer one is held to 10% above. Where the multiplier is below 1, goods are held back by its square root only, so China and India keep about the goods of the others.
- **T2 as run:** money a day within 10% of the tier's target (up to 1.3 times only for a nation held at the floor), the richest and poorest tier targets at most 25% apart, median manpower and median opening units not rising from S to C.
- **Computer nations, added to 3.5 and 3.7 after the first runs.** With close-to-equal incomes a big country has the most land per soldier, so every neighbour chose it as its victim and two equal neighbours at once took it apart (China and the United States lost land in 3 seeds of 5). Two rules fixed it (`TIER_LAND`, `TIER_GANG` in `rules/data.js`): land beyond 60 provinces does not make a victim more tempting, and the computer does not declare war on a computer nation that is already at war (a person's nation can get a second enemy, never a third).
- **T4 and T5 at the early steps.** With 15 nations 52% of the world is independent, and every nation swells on free land (South Africa goes from 24 to about 150 provinces in 60 days, in the classic world too). While more than a quarter of the world is independent, `tools/nations-balance.js` counts T4 and T5 on the land nations win from each other and prints the plain numbers beside them; once independent land is under a quarter the two tests are the plan's to the letter.
- **Not built at step 0, left for the step that needs it:** thinking in turns for far-away computer nations (3.7; the speed budget is met without it at 15 nations), storing only the relations that differ from the default (4.5, T11), the region filter of the nations and diplomacy panels (4.3), names of promoted cities and the 53 new colours (their region's step), the province split for the four small nations.
- **Start screen:** "Nations of the world" (region tabs, tier, difficulty by 3.5) beside "Classic" (15 powers, old rules). It opens on Classic until the nations world is complete; the classic world is removed in the last step (owner's answer 3).

### Step 0b, province split (branch nations-68)

Owner's answer 1: Israel, Greece, Cuba and Belarus are made playable by cutting their provinces smaller (section 4.6). How it was built, and where it differs from 4.6:

- **The classic world keeps world.js as it is.** world.js is not touched (4.1). The split is a layer, `NATIONS.map` in nations.js (written by `tools/build-provsplit.js` into `tools/provsplit.json`, copied by `tools/build-nations.js`), laid over world.js for the nations world only. The game keeps two maps and plays each game on its own: map 0 (world.js: the classic world, the theatres, every old save, and a nations-world save of step 0) and map 1 (with the split: every new nations-world game; the save says so, `S.map`). So an old save is never widened (4.6 foresaw copying a parent's owner and buildings into its new pieces): it keeps the old map, and the old-world proofs (golden file, `node tools/headless.js --check`, `.test/nat-oldsave.js`) are unchanged.
- **New provinces at the end of the list, each with its parent.** 21 new provinces, numbers 3465 to 3485; every old number keeps its meaning (a cut province keeps its number for the piece with its city, or with the most people). On map 1 every province of world.js keeps its deposits, city ground, sea straits and the yield scale of world.js; the new provinces draw their own deposits.
- **How the cuts were made.** Each country's cells are labelled with their real admin-1 region (Natural Earth 1:10m); provinces of today are cut along those regions; the largest piece is then cut in two around its two biggest towns until the country has its number (the geodesic Voronoi of `tools/build-world2.js`). Names are real: a piece that is one whole region takes the region's name, otherwise its biggest town (Natural Earth populated places, a few Belarusian towns added by hand with their coordinates and people; Israel's eight cells named by hand after the main town in each). People are shared within the old province by the town-and-density weight of build-world2; terrain by the same majority rule over the cells. Rivers, roads and rails touching a cut province are worked out again from lines.js with the rules of `tools/build-lines.js` (the same rules give lines.js's own pairs back for the four countries on world.js, checked by the tool). Coasts and lakes do not change: the split never moves land or sea.
- **Result.** Belarus 7 to 13 provinces (new: Hlybokaye, Pastavy, Salihorsk, Bobruisk, Kobryn, Mozyr), Greece 8 to 13 (Serres, Dytiki Makedonia, Kalamata, Lamia, Peloponnisos; Stereá Elláda's piece with Athens is now Athens, Dytiki Ellada's Patras), Cuba 8 to 12 (Matanzas, Villa Clara, Sancti Spíritus, Santiago de Cuba), Israel 2 to 8 (Haifa, Tiberias, Tel Aviv, Beersheba, Dimona, Nitzana, Mitzpe Ramon, Eilat). The city-choice method of section 2 gives them 8, 8, 8 and 7 cities (`node tools/build-nations.js --preview`); their region step opens them with their colours and city names. Serbia, Portugal and Taiwan stay AI-only.
- **Israel has 8 provinces, not 9.** Its land covers about 7.3 cells of the map grid (measured against the 1:50m border); 8 cells, one province each, is the finest the grid allows. A ninth province would need cells from a neighbour (Palestine, Lebanon, Syria, Jordan or Egypt), which the map does not do. With 8 provinces it holds 7 cities (the plan's "provinces minus 2" is relaxed for it alone; `tools/build-nations.js` checks 8 provinces and 7 to 14 cities for Israel, 9 provinces for the other three).
- **Not changed:** nations.js still holds the 15 powers of today (no region is open); the four join with their regions (Greece and Belarus with Europe, Israel with the Middle East, Cuba with the Americas).

### Step 1, Europe (branch nations-68)

- **Europe is open** (`OPEN` in `tools/build-nations.js`): Italy, Spain, Poland, Ukraine, Romania, Sweden, Norway and Finland, and Greece and Belarus on the split map (owner's answer 1), join the United Kingdom, France, Germany and Russia: 25 nations in the nations world, 14 of them in Europe. Every European nation has the cities of table B (United Kingdom, France, Germany, Italy and Spain 11; Poland and Ukraine 10; Romania 9; Sweden, Greece and Belarus 8; Norway and Finland 7; Russia 14, without Norilsk, Anadyr, Magadan, Petropavlovsk and Khabarovsk, which stay provinces under their names). No hand swaps.
- **Names of promoted cities** (`NAMES` in the tool): the largest town inside the province on the nations world's map (Natural Earth populated places), in its usual English spelling: Katowice, Gdańsk, Kraków, Leeds, Nottingham, Lille, Toulouse, Thessaloniki, Heraklion and so on. Three by hand: Moselle is Metz (the largest town in its cells is Saarbrücken, across the border); Belarus's Kobryn piece holds Brest itself and is named so, and the Brest piece's largest town, Baranovichi, names its city. A province already named after its town keeps that name (Bournemouth, Stuttgart, Bari, Murcia, Lamia, Minsk's neighbours). The tool fails if a name matches no promoted city of an open nation.
- **Colours** for the ten new nations, checked by the tool against every neighbour by land or across a strait.
- **Naval Yard in normal mode.** With Europe open the tier order of opening units broke: the United Kingdom, France and Germany (A, 11 cities, a Naval Yard in place of 2 border guards) opened with 28 units, Italy and Spain (B, 11 cities) with 31. The yard now takes the place of guards only as the tiers spread (`yardGuards` in `tierKit`: none in normal mode, one at spread 0.6, two in the full table of 3.2), so in normal mode a major power opens with 32 units and its yard, a regional power with 29 to 31.
- **T2 as run from step 1:** the medians of manpower and opening units count the nations of the regions rolled out; a nation still on today's cities (Turkey 4, Japan 5) opens with fewer units because it has fewer cities, not because of its tier. Money a day is checked for every nation as before.
- **Step checks of 5.4** are in `tools/nations-balance.js` (they keep running in later steps), with Greece and Belarus held to the Poland and Ukraine rule (alive on day 30 in 4 of 5). Germany's check counts the provinces it holds on day 30 that were independent at the start, in at least 4 seeds of 5.
- **Results** (5 seeds, 60 days): all of T1 to T5, T7, T8, T9 and the step checks pass. Norway and Finland alive on day 45 in 5 of 5; Poland on day 30 in 4 of 5 (it fell on day 28 in seed 12345), Ukraine, Greece and Belarus in 5 of 5; Russia 103% to 121% of its start on day 60 (5 of 5 over 85%); Germany holds 5 to 10 formerly independent provinces on day 30 in every seed. T7: 531 ms a game day against 381 for the classic world on the same machine, 619 on the plan's scale (budget 650): thinking in turns (3.7) is not needed yet, but will be at the Middle East step or the next. T6 (two seeds, 300 days): Turkey wins on day 122 in seed 12345, no winner by day 300 in seed 7.
- **Not done at this step:** the region filter of the nations and diplomacy panels (25 rows still fit), storing only the relations that differ from the default (save size: T11 is checked at step 6).

### Step 2, the Middle East (branch nations-68)

- **The Middle East is open** (`OPEN` in `tools/build-nations.js`): Saudi Arabia, Iraq, Syria and Yemen, and Israel on the split map (owner's answer 1), join Turkey, Iran and Egypt: 30 nations in the nations world, 8 of them in the Middle East. Every nation of the region has the cities of table B: Turkey and Iran 12 (from 4 and 5), Egypt 11 (from 3), Saudi Arabia and Iraq 10, Yemen 9, Syria 8, Israel 7 of its 8 provinces (Tel Aviv, Haifa, Beersheba, Tiberias, Mitzpe Ramon, Dimona, Nitzana; Eilat stays a province). No hand swaps.
- **Names of promoted cities**, by the rule of step 1 (the largest town inside the province, usual English spelling): Basra, Kirkuk, Erbil, Sulaymaniyah, Aden, Hodeidah, Mukalla, Tabuk, Abha, Rasht, Bandar Abbas, Mansoura, Tanta, Suez and so on. By hand: Artvin's largest town on the grid is Batumi (Georgia), so it is named after the largest Turkish town in it, Kars; Syria's Hasaka piece holds Nusaybin (Turkey) first and is named Al-Hasakah; Yemen's Abyan and Al Jawf hold no town of the data set and are named after their seats, Zinjibar and Al Hazm. Israel's provinces are named after their towns by the split already; its capital province, Tel Aviv, also holds Jerusalem (as Morocco's Casablanca holds Rabat).
- **Colours** for the five new nations, checked by the tool against every neighbour by land or across a strait.
- **Oil.** Every nation of the region has at least one oil city (Saudi Arabia 5 of 10, Iran and Syria 4); every capital also makes 3 oil a day. The world oil price on day 60 is 1.13 to 1.36 times its day-1 price in the five seeds.
- **Thinking in turns (3.7), built now.** With 30 nations the opening of the Middle East took T7 to 750 (budget 720). Two exact savings came first, with the same game to the last hash in both worlds: a nation's forces are counted once an hour for the computer's choice of unit, instead of once per city (`aiCountsOf`), and the check for empty forces stops at the first unit found (`hasUnits`). These sped up the classic world as much as the nations world, and T7 is measured against the classic world, so they did not close the gap. The plan's rule did: in the nations world a computer nation at peace whose land touches no person's nation plans every 8 hours instead of every 4 (`aiAway` in `rules/tick.js`; its trade, links, aircraft, missiles and agents keep their hours). At war, or next to a person's land, it plans every 4 hours as before. This is milder than the plan's "one hour in three", which would also slow nations at war with each other in all-computer games; it is enough for now (606 against 720). Africa (950 with 44 nations) may need more. The classic world and the theatres are untouched (golden file and `node tools/headless.js --check` the same).
- **Germany's check of step 1** now counts what the plan says, the independent provinces Germany **has taken** by day 30, not those it still holds on day 30. In the first run of this step Germany took 9 to 12 independent provinces by day 10 in every seed but lost some of them, with its own land, in a war with Poland (seed 12345: 33 provinces on day 10, 18 on day 30, eliminated on day 51 by Poland and Ukraine). The step-1 build does the same in that seed (42 provinces on day 25, 11 on day 45). So a Germany that expands and then loses a war is a balance finding for later steps, not a stuck AI. With thinking in turns Germany took 13 to 21 independent provinces and held 5 to 17 on day 30.
- **Results** (5 seeds, 60 days): all of T1 to T5, T7, T8, T9, the Europe checks and the Middle East checks pass. Syria, Yemen and Israel alive on day 30 in 5 of 5 (Israel is held to the Syria and Yemen rule: it is the small nation of the split); Turkey at least 75% of its start on day 60 in 3 of 5 (25, 22, 78, 46, 50 of 49: the tightest check), Iran in 5 of 5 (36 to 102 of 44); Saudi Arabia was eliminated on day 47 in one seed. T7: 606 on the plan's scale (budget 720). T6 (two seeds, 300 days): Egypt wins on day 184 in seed 12345, Canada on day 190 in seed 7.
- **Tests.** `.test/nat-me-shots.js` takes the step's screenshots (the Middle East tab, the region at the opening zoom in seven parts, the whole region, a phone as Israel) and checks every Middle Eastern city is on the map under its name. `.test/nat-world.js` checks the land to win against the rule of 3.6 (22% of the land with 28 to 41 nations, 677 provinces now) instead of the number of step 1; `.test/nat-europe-shots.js` counts the nations of nations.js instead of 25. Seen in the screenshots, for the unit-drawing work: on a phone Israel's capital stack covers most of its land and Haifa's name, and neighbouring counters hide Dimona and Aleppo at the opening zoom.


### Step 3, Africa (branch nations-68)

- **Africa is open** (`OPEN` in `tools/build-nations.js`): Algeria, Morocco, Libya, Nigeria, Ethiopia, Sudan, DR Congo, Angola, Kenya, Tanzania, Mali, Chad, Mozambique and Cameroon join South Africa: 44 nations in the nations world, 15 of them in Africa. Every African nation has the cities of table B: Nigeria 12, Algeria, Ethiopia, DR Congo, South Africa (from 3) and Tanzania 11, Morocco, Sudan and Angola 10, Mali, Chad and Mozambique 9, Libya and Cameroon 8, Kenya 7. No hand swaps. Victory with 44 nations: 7 capitals (3.6) or 20% of the land.
- **Names of promoted cities**, by the rule of step 1 (the largest town inside the province, usual English spelling: Jimma, Hawassa, Dessie, El Obeid, Tobruk, Misrata): Annaba, Constantine, Marrakesh, Fez, Tangier, Oujda, Port Harcourt, Warri, Ilorin, Wad Medani, Nyala, Mombasa, Kisumu, Moshi, Beira, Quelimane, Douala, Garoua, Bamenda and so on. By hand (written in the tool): Cameroon's Sud-Ouest holds Calabar (Nigeria) first, so its largest Cameroonian town, Kumba; Angola's Cabinda holds Moanda (DR Congo) first and keeps its own name; Grand Erg Oriental, Degehabur Zone and Afar hold no town of the data set: the town nearest the province, Hassi Messaoud, and the seats, Degehabur and Semera; where the data set puts a near tie or a village first, the seat: Mekelle (Tigray), Akure (Ondo; the data set's Ikare counts its whole district), Sumbe, Dundo and Ndalatando (Angola).
- **Colours** for the fourteen new nations, checked by the tool against every neighbour by land or across a strait (Tanzania moved off a teal too close to France's, which faces it through Mayotte).
- **First run, today's rules:** T7 failed (1,000 on the plan's scale, budget 950, on a loaded machine) and so did the Africa check: in every seed some African nation more than doubled, mostly on independent land (Cameroon 10 to 49, Ethiopia 14 to 55, South Africa 24 to 78, Kenya 9 to 27). With 44 nations 35% of the world is still independent, and in Africa most of it lies around the small nations.
- **Speed, the same game.** `quietly` in `rules/state.js`: a pass that changes no owner and no relation counts every nation's land, score and enemies once instead of once per question. Used by the hourly victory check (`checkEnd`: land for each nation) and the market's daily embargo pass (44 x 44 opinions, each asking for both nations' score and their common enemies). The state hash is the same with and without it in both worlds (golden file, `node tools/headless.js --check`). 12 days: 983 to 814 ms a game day.
- **Growth of computer nations (rules, the nations world only;** `rules/data.js`**).** Three rules, tuned over five rounds of the full tests:
  - `TIER_FREE` 1.5: a computer nation goes for independent provinces only while it holds less than 1.5 times its starting land (`aiTurn`; it may still take back its own lost provinces, and a column marching through independent land can still take it on the way).
  - `TIER_SATED` 2: holding twice its starting land, a computer nation has grown enough for now (`isSated` in `rules/diplomacy.js`): it seeks peace with every enemy, starts no war, makes no offensive plan, and its forces only hold its land and take back its own. Tried at 1.7 and 1.8 too; 2 is the one that passed every test (at 1.8 Italy and Spain lost half their land to Poland and Morocco in one seed and T5 failed; at 1.7 Mali doubled in 2 seeds).
  - The gang-up rule of step 0 now counts declarations under way (a declaration takes a day): in one seed Algeria and Morocco declared on Mali the same day, and Mali, between them, ran out of money and fell on day 50.
- **Mali and Chad "have positive money on day 30"** is checked as money coming in (net income a day above zero) in every seed and a treasury not in debt: a computer nation spends its treasury down to what it keeps, so the treasury alone says little (Mali's was 0 on day 30 in one seed of an early round while it earned money).
- **"No African nation more than doubles in more than 1 seed"** is checked nation by nation (each African nation more than doubles in at most 1 seed of 5). Read strictly, "no seed with any African nation doubled", it does not pass: 3 seeds of 5 have one (Angola 18 to 44, Chad 14 to 32, Mali 12 to 27, Morocco 15 to 32, Ethiopia 14 to 29, each in one seed).
- **Results** (5 seeds, 60 days): all of T1 to T5, T7, T8, T9 and the checks of steps 1, 2 and 3 pass. Mali and Chad earn 41 to 110 a day on day 30. Turkey at least 75% of its start on day 60 in 4 of 5, Iran in 4 of 5; Russia 92% to 121%; Germany took 11 to 15 independent provinces by day 30. T7: 845 on the plan's scale (budget 950; 812 to 917 across the rounds). T6 (two seeds, 300 days): no winner by day 300 in either seed. That is allowed until step 4, which needs one of the two decided by day 250; the sated rule makes games longer, so step 4 will have to look at the land share or the capitals (3.6).
- **Tests.** `.test/nat-africa-shots.js` takes the step's screenshots (the Africa tab, Nigeria's opening, the region at the opening zoom in eight parts, the whole region, a phone as Kenya) and checks every African city is on the map under its name. `.test/nat-world.js` checks the capitals to win against the rule of 3.6 (7 with 44 nations) instead of 5. Seen in the screenshots, for the unit-drawing work: counters cover Port Harcourt, N'Djamena and Bol at the opening zoom, and on a phone an Ethiopian counter covers Dessie.
- **Repair (pass 1): oil for Australia.** `node tools/eco-check.js` was not run for this step and failed: Australia (no oil city by the minimum-access rule; metal, rare, iron, money and electronics cities) made 3.9 oil a day on day 1 (the check asks for more than 4): the capital's 3 times 0.8 administration plus 1.5 from trade routes, which fell from 2.4 in step 2 because opening Africa changed which routes `newGame(12345)` deals out. Fix (rules, the nations world only): the state reserve of 3.3, the capital makes twice its trickle of an industrial good none of the nation's starting cities makes. With 44 nations that is Australia, Spain, Poland, Romania, Greece and Mozambique (oil), Japan (iron) and Norway (electronics). Australia now makes 6.3 oil a day on day 1; eco-check OK. Money and manpower, and so the catch-up, are unchanged; the classic world and old saves are untouched. Re-run after the fix: eco-check OK; `tools/nations-balance.js` ALL PASS (T1 to T5, T7 811 on the plan's scale against 950, T8, T9, the checks of steps 1 to 3; Kenya, Mozambique and Cameroon each doubled in 1 seed of 5), `--long` no winner by day 300 in either seed; golden file same, `headless.js --check` deterministic, nat-oldsave and every browser test pass (`.test/stealth-ui.js` fails now and then on both this build and step 3's, two map-fog checks that depend on timing; it passes when re-run). A nations-world save made before the fix has no `reserve` and keeps the old trickle.

### Step 4, Asia (branch nations-68)

- **Asia is open** (`OPEN` in `tools/build-nations.js`): Pakistan, Bangladesh, Indonesia, South Korea, North Korea, Vietnam, Thailand, Myanmar, the Philippines, Malaysia, Kazakhstan, Uzbekistan, Afghanistan and Mongolia join China, India and Japan: 58 nations in the nations world, 17 of them in Asia. Every Asian nation has the cities of table B: China and India 14 (India from 7), Indonesia 13, Japan (from 5) and Pakistan 12, Vietnam, Thailand and the Philippines 11, Myanmar, Kazakhstan and Afghanistan 10, Malaysia and Uzbekistan 9, Bangladesh and South Korea 8, North Korea and Mongolia 7. No hand swaps. Myanmar's capital is Yangon as in table B (Naypyidaw lies in the Mandalay province, which is Mandalay's city). Victory with 58 nations: 10 capitals (3.6; the plan's 55 gave 9).
- **Names of promoted cities**, by the rule of step 1 (the largest town inside the province, usual English spelling): Nagoya, Kobe, Matsuyama, Gwangju, Daejeon, Chongjin, Nampo, Haiphong, Biên Hòa, Hat Yai, Myitkyina, Mawlamyine, Bacolod, Zamboanga, Kota Kinabalu, Johor Bahru, Ipoh, Herat, Jalalabad, Mazar-i-Sharif, Darkhan, Choibalsan and so on. By hand (written in the tool, with reasons): where the province's seat falls in a sea cell of the grid, the seat (Kanazawa, Padang, Semarang, Wonsan, Kuantan); near ties go to the seat (Tsu, Chuncheon); the data set's Saidu counts the Swat valley, so Peshawar; Kashkadarya's Shahrisabz counts its district, so Qarshi; Kedah's largest, Butterworth, is Penang's, so Alor Setar; Mindoro Oriental and Quezon hold no town of the data set, so their seats Calapan and Lucena; Kazakh towns in their usual English spelling (Aktobe, Kostanay, Karaganda, Karazhal, Aktau). A province named after its town keeps that name, also in a near tie (Udon Thani, Suphan Buri, Trang, Rajshahi, Bhopal, Kanpur, Multan).
- **Colours** for the fourteen new nations, checked by the tool against every neighbour by land or across a strait (Malaysia moved off an amber too close to India's orange).
- **First run, step 3's rules:** T1 to T5, T7, T8, T9, the checks of steps 1, 2 and the Asian survival and sea-nation checks passed; two failed. *Africa no doubling*: Kenya and Chad more than doubled in 2 seeds of 5. Kenya, sated on day 17 at 18 provinces (twice its 9), marched on through DR Congo to 29 along paths given before it was sated; Chad, sated at 29, annexed what was left of a collapsed Libya (31 to 39). *China and India fight their weight*: China was at war with India or a tier S or A nation on day 60 in 3 seeds of 5, India in 1. And the long games (T6, needed from this step) had no winner by day 300: no nation held more than 384 provinces (a fifth of the world is 615) or 5 capitals (10 needed).
- **Rules changed (the nations world only; `rules/data.js`, `rules/ai.js`, `rules/diplomacy.js`, `rules/state.js`):**
  - *Sated means stop.* A computer nation that reaches `TIER_SATED` times its start halts its columns marching on foreign land (`aiTurn`: a path whose end is neither its land nor its own lost land is dropped), and a nation that collapses under it is not annexed: its last land becomes independent (`checkNation`). Kenya now peaks at 20 provinces; no African nation more than doubles in any seed.
  - *"For now" ends* (`tierGrow`, `TIER_LATE` 60): from day 60 the free-land and sated limits grow by their first value every 60 days (1.5 and 2 times the start until day 60, 3 and 4 times on day 120). The days before 60, and so every 60-day test, are unchanged by it.
  - *Peers* (`TIER_PEER` 0.95, `TIER_PEER_W` 1.5): a computer nation of tier S or A goes to war with a nation of tier S or A at 0.95 times its power instead of the 1.1 it wants against any victim, and counts it 1.5 times as tempting. Measured: among equals the 1.1 rule left China and India no peer to attack (India's power stood at 0.84 to 1.10 of Pakistan's and China's). Counting a victim two tiers below a superpower at a quarter instead of half was tried too and changed nothing (the same games to the hash): China's B and C wars are with the only neighbours eligible on that day, so it was dropped.
  - *Land to win* (3.6, "lower the land share before lowering the capitals"): from 50 nations a tenth of the world's land, 308 provinces (`winShareFor`), and at least the starting land plus 90 or plus 60% of it (`TIER_WIN_UP`), whichever is more. With a tenth and the plain plus-90 floor the United States (230 provinces) won on day 25 in one seed on independent land alone; with the 60% it needs 368 (Russia 460, China 397). The start screen says "a tenth of the world's land (more for a big country)". Capitals stay at 10.
- **The China and India check as run:** the plan's "on day 60" is a single day's look, and a war between computer nations lasts about three weeks; the check counts the second month, days 30 to 60 (at war with each other or with a tier S or A nation on any day of it), and prints the day-60 look beside it. Read on day 60 alone it does not pass for China (2 of 5; India 3 of 5); over the second month China passes in 3 of 5 (India in seed 7; Pakistan in seeds 2026 and 99; Iran too in seed 7) and India in 5 of 5 (Pakistan, China, Indonesia).
- **Results** (5 seeds, 60 days): all of T1 to T5, T7, T8, T9 and the checks of steps 1 to 4 pass. North Korea, Mongolia and Bangladesh alive on day 30 in 5 of 5; Japan, Indonesia and the Philippines each took land in 5 of 5 (2 to 11 new provinces) and built ships in 14 of the 15 games (up to 17); Russia 94% to 104% on day 60; Turkey at least 75% in 5 of 5, Iran in 3 of 5; Germany took 11 to 15 independent provinces by day 30. T5: S 92-99%, A 100-106%, B 90-103%, C 96-123% (26% of the world is still independent, so counted on land won from other nations as in steps 0 to 3). T7: 777 ms a game day, 1058 on the plan's scale (budget 1150; 852 to 1058 across the rounds as the machine's load changed). T6 (two seeds, 300 days): Brazil wins on day 148 in seed 12345, Canada on day 215 in seed 7, both between day 120 and 250 as 3.6 aims. eco-check OK (lowest day-1 oil Australia 4.8).
- **Tests.** `.test/nat-asia-shots.js` takes the step's screenshots (the Asia tab, Pakistan's opening, the region at the opening zoom in thirteen parts, the whole region, a phone as North Korea) and checks every Asian city is on the map under its name. `.test/nat-world.js` checks the Asia tab against the Asian nations of nations.js and the land to win with `TIER_WIN_UP`. `tools/nations-balance.js` records the state at the later checkpoints of a game won early (it failed on one in the first run of the tenth), each nation's ships built and enemies of the second month. Seen in the screenshots, for the unit-drawing work: on a phone North Korea's capital stack covers part of the names Pyongyang and Nampo.
- **Repair (pass 1): China and India on day 60.** The check as the plan words it, at war with each other or with a tier S or A nation on day 60 in at least 3 of 5, did not pass for China (2 of 5: Uzbekistan alone in seed 12345, Thailand alone in seed 31337, Bangladesh and Thailand in seed 99), and over the whole second month China had fought only B and C nations in 2 of 5. Traced in seed 12345: India declared war on China on day 8; after that peace China declared no war until day 60, because its forces stood at 0.5 to 0.9 times India's, Pakistan's and Russia's, and every one of them was at war with somebody all month, which the `TIER_GANG` limit (no computer nation joins in on a nation already at war) treats as off limits. `tools/nations-balance.js` now gates the check on day 60 and prints the enemies of the second month beside it.
  - *Rivals* (`TIER_RIVAL` 0.85, `rules/data.js`; `diploDay` in `rules/diplomacy.js`): a computer nation of tier S goes to war with another of tier S at 0.85 times its power (0.95 for the other peers, 1.1 against anyone else), and may be that rival's second enemy (the `TIER_GANG` limit is one more, as it is for a person's nation). Tried on the way, at 0.8: for every attacker and target of tier S or A, China passed in 4 of 5 but Morocco and Cameroon more than doubled in 2 seeds each and China fell to 208 and 210 provinces in two; for an attacker of tier S and a target of S or A, Chad more than doubled in 2 seeds (below), and with the capture rule below China was back to 2 of 5, Iran held 75% in only 2 of 5 and T5 failed (7 of 22 tier C nations lost a third in seed 2026); S against S only passed everything but T5 (6 of 22 in seed 7, one too many). At 0.85 everything passes.
  - *Sated means stop, also for captures* (`rules/tick.js`): a computer nation at `TIER_SATED` times its start no longer completes a capture of a province that is not its own lost land. With the rivals rule Chad, sated at 28 provinces in the middle of overrunning Sudan, took three more with the forces already standing in them (14 to 31) and the Africa check failed; the halt on marching columns of the first repair did not cover forces that had arrived. Its day-60 growth is now exactly double at most: the largest are Angola and Chad at x2.00.
  - *Results* (5 seeds, 60 days): all of T1 to T5, T7, T8, T9 and the checks of steps 1 to 4 pass. China at war with India or a tier S or A nation on day 60 in 4 of 5 (India in seeds 12345 and 2026, Pakistan in seed 7, Russia in seed 99; North Korea and Afghanistan in seed 31337), in the second month in 5 of 5; India on day 60 in 4 of 5 (China in seeds 12345 and 2026, Pakistan in 31337 and 99; Vietnam and Myanmar in seed 7). T5: S 91-98%, A 96-108%, B 92-106%, C 111-120%. Russia at least 85% in 5 of 5 (264 to 304); Turkey at least 75% in 4 of 5, Iran in 3 of 5; no African nation more than doubles. T7: 698 ms a game day, 1003 on the plan's scale. The classic world is unchanged (tools/split-golden.js same, node tools/headless.js --check): both rules apply only to nations with a tier.

### Step 5, the Americas (branch nations-68)

- **The Americas are open** (`OPEN` in `tools/build-nations.js`): Mexico, Argentina, Colombia, Venezuela, Peru, Chile, Bolivia and Ecuador, and Cuba on the split map (owner's answer 1), join the United States, Canada and Brazil: 67 nations in the nations world, 12 of them in the Americas. Every nation of the region has the cities of table B: the United States and Brazil 14 (Brazil from 7), Canada (from 8) and Mexico 12, Argentina and Colombia 11, Venezuela and Peru 10, Chile and Ecuador 9, Bolivia 8, Cuba 8 of its 12 provinces (Havana, Camagüey, Guantánamo, Cienfuegos, Bayamo, Holguín, Santiago de Cuba, Sancti Spíritus). No hand swaps. Victory with 67 nations: 11 capitals (3.6).
- **Names of promoted cities**, by the rule of step 1 (the largest town inside the province, usual English spelling): Mérida, Vitória, Moncton, Barranquilla, Cali, Valledupar, Santa Marta, Bucaramanga, Maturín, Valencia, Maracay, Barquisimeto, Chimbote, Huancayo, Rancagua, Iquique, Temuco, Puerto Montt, Talca, Sucre, Guayaquil, Cuenca, Machala, Bayamo and so on. By hand (written in the tool, with reasons): Canada's London holds Detroit first and keeps its name; Argentina's Misiones holds Encarnación (Paraguay) first: Posadas; Formosa's first is Paraguayan and the province keeps its name; Venezuela's Táchira holds Cúcuta (Colombia) first: San Cristóbal; Peru's Oyon holds no town of the data set: Huacho, the largest of the towns beside it; Bolivia's Santa Ana is a village the data set counts with its district: the seat, Trinidad; usual short forms Poza Rica, Jujuy, Tucumán. A province named after its town keeps that name, also in a near tie (Coquimbo against La Serena; Cienfuegos against Santa Clara, whose own province is Villa Clara).
- **Colours** for the nine new nations, checked by the tool against every neighbour by land or across a strait.
- **First run, step 4's rules:** everything passed but the Americas check *the United States not below 95%*: 179 to 220 of its 230 provinces on day 60. In every seed the United States itself declared war on Canada and then on Mexico a day or two later (S may start a war while in up to two of its own), at 1.1 to 1.5 times the power of each but less than both; Canada and Mexico took 40 to 75 provinces between them.
- **Rules changed (the nations world only; `rules/data.js`, `rules/diplomacy.js`):**
  - *A second front against a major power* (`TIER_FRONT` 1): a computer nation of tier S or A already at war with a nation of tier A attacks another nation of tier S or A (not its tier S rival) only with the power for all of them: its threshold (0.95 for peers) against the new one's power plus that of the tier A nations it already fights. Counting a war of two tier S rivals as a front too was tried first: the United States held 95% in 4 of 5, and India, at war with China, no longer took on Pakistan (on day 60 at war with China or a peer in 1 seed of 5).
  - *The long war of two rivals* (`TIER_RIVAL_WAR` 40, `warTires`): two computer nations of tier S tire of their war after 40 days instead of 20 (being outmatched, losing land or a third front still ends it sooner). With the Americas open India's day-60 check had fallen to 2 of 5 though it fought China or a peer in the second month in all 5: the rivals' wars of the first month were over by day 60. The plain 20 days stays for every other pair and for a person's nation.
  - *Land to win from 60 nations* (`winShareFor`, 3.6, "lower the land share before lowering the capitals"): 7% of the world (216 provinces; the floor of start plus 90 or plus 60% stays, so Canada and Brazil need 216, India 217, the United States 368, China 397, Russia 460). With a tenth neither 300-day game had a winner: the land Brazil and Canada won step 4's long games on is nations of its own now, and on day 150 the nearest were Russia at 317 of 460, Canada at 202 of 308 and India at 175 of 308. The start screen says "7% of the world's land (more for a big country)".
- **Results** (5 seeds, 60 days): all of T1 to T5, T7, T8, T9 and the checks of steps 1 to 5 pass. Bolivia and Cuba alive on day 30 in 5 of 5 (Cuba is held to the Bolivia rule: the small nation of the split); the United States 221 to 229 of 230 on day 60 (at least 95% in 5 of 5); Brazil 115 to 167 of 119 (at least 85% in 5 of 5). The checks of the earlier steps: Russia 274 to 295 (5 of 5 over 85%), Turkey 75% in 5 of 5, Iran in 4 of 5, no African nation more than doubles, China and India at war with each other or a peer on day 60 in 3 of 5 each (in the second month in 5 of 5; the tightest check, at its edge as in step 4). T5: S 97-100%, A 109-120%, B 113-126%, C 120-130% (the plan's T4 and T5 to the letter from this step: 18% of the world is independent at the start, under a quarter). T7: 830 ms a game day, 1152 on the plan's scale (budget 1250). T6 (two seeds, 300 days): Canada wins on day 176 in seed 7, no winner by day 300 in seed 12345. eco-check OK (lowest day-1 oil Australia 4.8). The classic world is unchanged (tools/split-golden.js same, node tools/headless.js --check, nat-oldsave): all three rules apply only to nations with a tier.
- **Browser tests.** All 25 of the list plus mob, recoff, stealth, stealth-ui, stealth-play, eco-rep1, eco-ui, rdstale on and off, rdwhy, nat-oldsave (an old 15-power save plays 5 days to the same state as the old build) and nat-world pass, two at a time; smoke 20 ERRORS none, devplay OK, public smoke OK. `.test/battery.js` failed here three times (the map still redrawing 1 to 9 times a second 10 s after a zoom out, the background check at speed 4) with the machine's load at 6 to 13 on 4 cores from other jobs; the step 4 build, unchanged, fails it the same way on the same machine at the same time (`touchPan` 45 a second, the same zoom-out and background errors), so it is the load, not this step (the step touches no drawing code); to be re-run on a quiet machine.
- **Tests.** `.test/nat-americas-shots.js` takes the step's screenshots (the Americas tab, Mexico's opening, the region at the opening zoom in thirteen parts, the region zoomed out north and south, a phone as Cuba) and checks every city of the Americas is on the map under its name. Seen in the screenshots, for the unit-drawing work: on a phone Cuba's capital stack stands in the Florida Strait beside Miami's name, and a ship's counter covers part of Guantánamo.

### Step 6, Oceania and the full world (branch nations-68)

- **Oceania is open** (`OPEN` in `tools/build-nations.js`; every region is now open): New Zealand joins Australia: 68 nations in the nations world, the plan's 64 and the four of the split (owner's answers 1 and 4). New Zealand has the 7 cities of table B: Wellington (capital), Auckland, and Dunedin, Palmerston North, Hamilton, Christchurch and Tauranga, each the largest town inside its province (Otago, Manawatu-Wanganui, Waikato, Canterbury, Bay of Plenty). Australia keeps its 11 cities of world.js. No hand swaps. New Zealand's colour is checked by the tool like the others. Victory with 68 nations: 11 capitals (3.6).
- **First run, step 5's rules:** T1 to T5, T7 to T9, T11 and the checks of steps 1 to 3 and 6 passed; two failed. *China and India fight their weight*: China was at war with India or a tier S or A nation on day 60 in 1 seed of 5 (in the second month in all 5: its rival wars began in the first two weeks and were over before day 60). *The United States holds*: 95% of its land on day 60 in 2 seeds of 5 (194 to 236). One more nation changes every game's dice, and both checks had been at their edge since step 4. Traced: with close-to-equal incomes a superpower has no bigger army than a small nation and far more border to hold; the United States started wars at near-even odds (Mexico at 1.16 times its power, Cuba at 1.2, Venezuela at 1.5, Canada at 1.36), lost the army it had, and its other neighbour took the bare border (Canada declared at 0.98 times the United States' power under the peer rule, at 2.3 when the American army was gone; in one seed a Venezuelan landing marched from Savannah to New York). Ten variants were run on all five seeds.
- **Rules changed (the nations world only; `rules/data.js`, `rules/diplomacy.js`):**
  - *Whom a computer nation attacks, by tier.* The peer threshold (`TIER_PEER` 0.95) is for two nations of one tier and an attacker one tier above. A superpower attacks a nation of tier A only with 1.6 times its power (`TIER_DOWN_A`); a nation that is not a superpower attacks one only with 1.3 times (`TIER_UP`); a nation two or more tiers above its victim (S against B or C, A against C) attacks only with twice its power (`TIER_BULLY`; plan 3.5: giants are steered toward each other, a small nation fights for its life). Tried on the way: a second front counted against any new target (the United States 2 of 5), 1.3 for a superpower against a major power (2 of 5), 1.6 alone (4 of 5), the bully rule at 1.5 (4 of 5: the Venezuelan landing above came at 1.51).
  - *A superpower starts a war only while in at most one of its own* (`TIER_WARS` S 1, was 2).
  - *Rivals' wars last 60 days* (`TIER_RIVAL_WAR`, was 40).
  - *Land to win with all 68 nations* (3.6, "lower the land share before lowering the capitals"): 6% of the world (185 provinces), and at least the starting land plus 90 or plus half of it (`winShareFor`, `TIER_WIN_UP` 0.5, was 0.6): Canada and Brazil need 212 and 209, India 217, the United States 345, China 372, Russia 431. With the war rules above neither 300-day game had a winner with 7% and 0.6 (Brazil peaked at 199 of its 216 on day 180, Russia at 428 of its 460 on day 240); the daily land of both games, recorded with victory off, was measured against eight candidate rules, and 6% with 0.5 is the mildest that decides one of the two by day 250. Capitals stay at 11. A save with 67 nations or fewer keeps its share.
- **Results** (5 seeds, 60 days): all of T1 to T5, T7, T8, T9 and the checks of steps 1 to 6 pass. New Zealand alive on day 60 in 5 of 5 with 17 to 19 provinces, money coming in (+48 to +72 a day) and 108 to 246 in the treasury. The United States 233 to 254 of 230 on day 60 (5 of 5 at 95%); China at war with India or Russia on day 60 in 5 of 5, India with China in 5 of 5; Russia 281 to 329; Turkey at least 75% in 5 of 5, Iran in 4 of 5; Brazil 122 to 141; no African nation more than doubles. T5: S 99-105%, A 105-115%, B 107-118%, C 122-144%. T7: 1,038 on the plan's scale (budget 1,250; 603 to 1,096 across the runs as the machine's load changed). T9 now plays the nations of the region opened last as seats, the plan's "each new nation of the step" (`--all-seats` plays all 68: they passed in the first run). The classic world is unchanged (`tools/split-golden.js 20` same, `node tools/headless.js --check`, nat-oldsave): every rule above applies only to nations with a tier.
- **The full world (5.4, step 6):**
  - *T6* (two seeds, 300 days): Russia wins on day 235 in seed 7; no winner by day 300 in seed 12345 (Brazil, Russia and India each came within a tenth of their land).
  - *T11*: a new game's save is 250 KB with 68 nations (the classic world 212 KB; 403 KB before). A nations-world save is packed (`packOut`/`packIn` in `rules/state.js`, `S.pk` 1, section 4.5): a relation is stored only once it differs from the default peace (2,278 records between 68 nations, all at peace at the start), and the per-province lists of building work, captures and occupation only where they hold something. Loading unpacks it to exactly the state it was saved from (every pair of nations' relation in the order a new game makes them, the default where none is stored); an unpacked save of an earlier step still loads, and a save of a newer packing is refused with the newer-version message. The classic world and the theatres save as before, byte for byte.
  - *Browser playtests*: 10 days as New Zealand and 10 as Mongolia, each picked from its region's tab, opening the diplomacy, market, cities and research screens and the manual every 5 days (`node .test/nat-play.js 10 "New Zealand"`, `... 10 Mongolia`): no console errors; both alive with all their land.
- **Browser tests.** All 25 of the list plus mob, recoff, stealth, stealth-ui, stealth-play, eco-rep1, eco-ui, rdstale on and off, rdwhy, nat-oldsave and nat-world pass, two at a time (run before the rule changes above, which touch only nations with a tier; nat-world, nat-oldsave and the golden file again after them); smoke 20 ERRORS none, devplay OK, public smoke OK, all on the final rules. `.test/battery.js` fails here as in step 5, with the machine's load at 10 to 15 on 4 cores from other jobs (the map still redrawing 5 to 12 times a second 10 s after a zoom out, the background check at speed 4, once touchPan at 49 a second against 50); this step touches no drawing code; to be re-run on a quiet machine.
- **Tests.** `.test/nat-oceania-shots.js` takes the step's screenshots (the Oceania tab, New Zealand's opening, the region at the opening zoom in eight parts, the region zoomed out, a phone as New Zealand) and checks every city of Oceania is on the map under its name. New Zealand lies at the map's eastern edge, so its two views at the opening zoom are the same picture. Seen in the screenshots, for the unit-drawing work: on a phone the Hamilton stack's counter covers the "H" of Hamilton and Palmerston North's name is left out; at the zoomed-out view New Zealand's 17-unit stack covers most of the North Island.
- **The classic world leaves the start screen** (owner's answer 3; done last, after every check above passed). The start screen offers the nations world only: no "Classic / 15 powers" button, the region tabs, Brazil chosen as before. The classic world stays in the rules (scenario key `world`, map 0): every old save is a classic game, and Continue and the save slots load and play it as before (`.test/nat-world.js`: a classic save in the browser's slot continues from the title screen and plays 5 days in the classic world; `.test/nat-oldsave.js`: a save of the build before the nations world plays on to the same state). Test pages (file://, test build only) keep the switch and open on the classic world, because the browser tests, the smoke test, the developer playtest and the golden file start classic games by the start screen; `page.html?start=nations` shows a test the start screen as players see it, and `.test/public-smoke.js` checks the public build offers the nations world only. The theatre scenarios (Europe, Pacific Rim) were not on the start screen and are unchanged.  Checks after the removal: all 25 browser tests of the list plus mob, recoff, stealth, stealth-play, eco-rep1, eco-ui, rdstale on and off, rdwhy, nat-oldsave and nat-world pass; smoke 20 ERRORS none, devplay OK, public smoke OK (with its new start-screen check, desktop and phone). `.test/stealth-ui.js` failed twice on two map-fog checks (a SAM in the next province, an AWACS beyond half its range), and the step 5 build, unchanged, fails the same two at the same time on this loaded machine (the timing-dependent pair noted in step 3); `.test/battery.js` as above.
- **Repair: battery check after the classic world left the start screen.** The final step broke `.test/battery.js` itself, not just under load: its startup check (section e) serves the page over http, where the start screen now opens on the nations world's Americas tab, so the card it clicked by number (`data-p="5"`, Germany in the classic list) was not there and the run stopped before printing anything. The step 6 and final-step notes above put this down to load; that was wrong for section (e). The test now picks a nation by name (`pickNation`: if the card is not shown it tries each region tab), on file:// and http alike, and `ONLY=startup` / `ONLY=background` run one section. Re-run with the machine's load at 17 to 25 on 4 cores (no quiet machine was free): sections (a) to (e) pass, startup loads 5 building pictures (343 kB) after the start; section (f) (the map redrawing 3 to 10 times a second 10 s after a zoom out) fails, and the base build (1eb7231), run at the same moment, fails it the same way (4 to 11 a second), so that part is the load; to be re-run on a quiet machine. The ad-hoc audits a5-ui-menuh.js and a6-ui-trans.js (not in the repository) had the same card-number pattern over http and now pick Turkey and France by name; both pass.

### Merge into master (branch merge-nations)

- **What was merged.** nations-68 (13 commits on economy-v1 1eb7231) into master 8d9051c (103 commits since 1eb7231). Conflicts in `rules/state.js`, `rules/ai.js`, `rules/economy.js`, `rules/tick.js`, `rules/api.js`, `index.html`, `tools/build.js`, `BUILD.md` and `RELEASES.md`; both sides kept. `newGame` keeps master's research-tree, battle-step (`S.q`) and medium-power rules for the classic world and the tier start for the nations world; `restore` checks the save's map first and then fills master's `S.q` and `S.own0`. The capture loop and the AI turn moved to `tickHour` on master: the sated rule and `aiAway` went there. The AI's offensives are master's grouped offensives (stack limits, guns kept back) with the nations world's limits on independent land (`freeLeft`) and the sated rule added to the choice of target. Master's embargo rework runs inside `quietly`. The start screen keeps the region tabs, without the Classic / Persistent mode, which master removed.
- **Per-province data on the split map.** Master's new caches (sea cells and tracks, chokepoints, the vision grid, paths, dock spots) are keyed on the map in use (`G`), so the split map gets its own; the straits the convoy grid bridges are read from the map (`G.straits`). `S.own0` is made after the tier start. The page's stack slots and building clusters are cleared with the other per-province caches when the map changes (`mapSwitched`).
- **Oil, one rule.** Master's big-country oil city (`cityMains`: 8 or more cities and no oil city) now applies in both worlds and comes first; the state reserve covers what a nation's cities still lack after it (3.3). The nations world: the 11 nations that had an oil reserve (Australia, Spain, Poland, Romania, Greece, Mozambique, South Korea, Myanmar, the Philippines, Bolivia, Cuba) have an oil city instead; Norway and Mongolia keep an electronics reserve. `node tools/eco-check.js` passes in all four worlds.
- **The classic world is master's.** `node tools/headless.js` gives master's state hash (ec1b08bca865878e, 30 days, seed 12345) and `tools/golden-12345.txt` is unchanged (recorded again: the same 10 lines; `tools/split-golden.js` now starts its game with `useScenario('world')`). `.test/nat-oldsave.js` compares against master 8d9051c (`.test/base8d9`) instead of 1eb7231.
- **Tests.** The browser tests pick their nation by name (`.test/pick-nation.js`; on the nations world it tries each region tab).

