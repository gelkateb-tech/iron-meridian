#!/usr/bin/env node
// Writes nations.js: the playable nations of the nations world (scenario world64, docs/NATIONS-PLAN.md), read by rules/state.js.
//   node tools/build-nations.js            write nations.js
//   node tools/build-nations.js --check    exit 1 unless nations.js on disk is what this tool would write (and its lists are sound)
//   node tools/build-nations.js --preview  print the cities the method picks for EVERY nation of the roster (nothing is written)
// The roster (ROSTER) and the city-choice method (pickCities, section 2 of the plan) live here; nations.js is never edited by hand. A step of
// the rollout opens a region by adding it to OPEN: its nations become playable with their planned 7 to 14 cities. Until its region is open,
// one of today's 15 powers plays with the cities world.js gives it today, and every other country is independent land.
// No browser: loads world.js, lines.js and the rules files like tools/headless.js (without nations.js: the rules run without it).
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
const OUT = path.join(ROOT, 'nations.js'), MODE = process.argv[2] || '';

/* ---------- the plan ---------- */
const REGIONS = ['Europe', 'Middle East', 'Africa', 'Asia', 'Americas', 'Oceania'];
const OPEN = ['Europe', 'Middle East', 'Africa', 'Asia', 'Americas', 'Oceania'];   // regions rolled out so far (step 0, plumbing: none; step 1: Europe, with Greece and Belarus on the split map;
// step 2: the Middle East, with Israel on the split map; step 3: Africa; step 4: Asia; step 5: the Americas, with Cuba on the split map; step 6: Oceania)
// world.js country name, tier (S superpower, A major, B regional, C minor: table A of the plan, hand corrections included), region.
// split (*): the country is too small on world.js; its provinces are cut smaller on the nations world's map (owner's answer 1: Israel, Greece,
// Cuba and Belarus must be playable; 68 nations in all; tools/build-provsplit.js). It opens with its region like the others; the size of its
// smallest member does not set the scale of the city counts (TC below), so the other nations keep the cities of the plan.
const ROSTER = {
  'Europe': {'United Kingdom':'A', 'France':'A', 'Germany':'A', 'Italy':'B', 'Spain':'B', 'Poland':'B', 'Ukraine':'B', 'Romania':'C', 'Sweden':'C', 'Norway':'C', 'Finland':'C', 'Russia':'S', 'Greece':'C*', 'Belarus':'C*'},
  'Middle East': {'Turkey':'A', 'Iran':'A', 'Saudi Arabia':'B', 'Iraq':'B', 'Syria':'C', 'Yemen':'C', 'Egypt':'B', 'Israel':'C*'},
  'Africa': {'Algeria':'B', 'Morocco':'C', 'Libya':'C', 'Nigeria':'A', 'Ethiopia':'B', 'Sudan':'B', 'Dem. Rep. Congo':'B', 'Angola':'C', 'South Africa':'B', 'Kenya':'C', 'Tanzania':'B', 'Mali':'C', 'Chad':'C', 'Mozambique':'C', 'Cameroon':'C'},
  'Asia': {'China':'S', 'India':'S', 'Japan':'A', 'Pakistan':'A', 'Bangladesh':'C', 'Indonesia':'A', 'South Korea':'B', 'North Korea':'C', 'Vietnam':'B', 'Thailand':'B', 'Myanmar':'B', 'Philippines':'B', 'Malaysia':'C', 'Kazakhstan':'B', 'Uzbekistan':'C', 'Afghanistan':'B', 'Mongolia':'C'},
  'Americas': {'United States of America':'S', 'Canada':'A', 'Mexico':'A', 'Brazil':'A', 'Argentina':'B', 'Colombia':'B', 'Venezuela':'C', 'Peru':'B', 'Chile':'C', 'Bolivia':'C', 'Ecuador':'C', 'Cuba':'C*'},
  'Oceania': {'Australia':'B', 'New Zealand':'C'},
};
// the capital HQ picture of each nation (assets/art-src/ba-hq-<style>.png): one architectural style per nation, chosen by the look of its real
// government buildings, not by its region above (so Israel is western, Kazakhstan and Mongolia post-Soviet, the Philippines colonial).
const HQ = {
  'western': ['United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Sweden', 'Norway', 'Finland', 'Greece', 'United States of America', 'Canada', 'Australia', 'New Zealand', 'Israel'],
  'eastern-europe': ['Russia', 'Poland', 'Ukraine', 'Romania', 'Belarus', 'Kazakhstan', 'Mongolia'],
  'middle-east': ['Turkey', 'Iran', 'Saudi Arabia', 'Iraq', 'Syria', 'Yemen', 'Egypt', 'Algeria', 'Morocco', 'Libya', 'Afghanistan', 'Uzbekistan', 'Malaysia'],
  'east-asia': ['China', 'Japan', 'South Korea', 'North Korea', 'Vietnam', 'Thailand', 'Myanmar', 'Indonesia'],
  'south-asia': ['India', 'Pakistan', 'Bangladesh'],
  'africa': ['Nigeria', 'Ethiopia', 'Sudan', 'Dem. Rep. Congo', 'Angola', 'South Africa', 'Kenya', 'Tanzania', 'Mali', 'Chad', 'Mozambique', 'Cameroon'],
  'latin-america': ['Mexico', 'Brazil', 'Argentina', 'Colombia', 'Venezuela', 'Peru', 'Chile', 'Bolivia', 'Ecuador', 'Cuba', 'Philippines'],
};
const hqOf = new Map(); for (const st in HQ) for (const n of HQ[st]){ if (hqOf.has(n)) throw new Error('two HQ styles for ' + n); hqOf.set(n, st); }
// capitals world.js does not flag (it flags only today's 15): the city (cityName) or the province that holds the real capital
const CAPS = {Mexico:'Mexico City', Kazakhstan:'Astana', Nigeria:'Abuja', Pakistan:'Islamabad', Vietnam:'Hanoi', Spain:'Madrid', Italy:'Rome', Indonesia:'Jakarta', 'Saudi Arabia':'Riyadh',
  Philippines:'Manila', Argentina:'Buenos Aires', 'New Zealand':'Wellington', Mozambique:'Maputo', Cameroon:'Yaoundé'};
const DISPLAY = {'United States of America':'United States', 'Dem. Rep. Congo':'DR Congo'};
// today's 15 powers, in the order of the classic world (rules/state.js WORLD_POWERS): they come first in nations.js, in this order
const TODAY15 = ['United States of America', 'Canada', 'Brazil', 'United Kingdom', 'France', 'Germany', 'Russia', 'Turkey', 'Iran', 'Egypt', 'South Africa', 'India', 'China', 'Japan', 'Australia'];
// map colours. A step that opens a region adds the colours of its nations here; no two nations that share a border or face each other across
// a strait may be closer than COLOR_MIN (checked below for the nations written)
const COLORS = {'United States of America':'#3f7fe0', 'Canada':'#c8323c', 'Brazil':'#3fae5a', 'United Kingdom':'#9370e6', 'France':'#36bcc4', 'Germany':'#5672a6', 'Russia':'#a3283f', 'Turkey':'#b45aa8',
  'Iran':'#7cc04a', 'Egypt':'#c2a070', 'South Africa':'#2ea48d', 'India':'#ff8a3d', 'China':'#e8cf47', 'Japan':'#b65acc', 'Australia':'#1fa3a3',
  // step 1, Europe
  'Italy':'#5cb04a', 'Spain':'#e0a13a', 'Poland':'#d8c440', 'Ukraine':'#3a9be0', 'Romania':'#c96a2e', 'Sweden':'#4a86e0', 'Norway':'#e06a5a', 'Finland':'#6fcf97',
  'Greece':'#6aa8e8', 'Belarus':'#c05a8a',
  // step 2, the Middle East
  'Saudi Arabia':'#2f9e6b', 'Iraq':'#d8b03c', 'Syria':'#d0584a', 'Yemen':'#8a6fd6', 'Israel':'#4a7fd0',
  // step 3, Africa
  'Algeria':'#2e8b57', 'Morocco':'#c8443c', 'Libya':'#e8a03c', 'Nigeria':'#38a050', 'Ethiopia':'#d8b440', 'Sudan':'#b85a3a', 'Dem. Rep. Congo':'#4a6fc0',
  'Angola':'#d05050', 'Kenya':'#c03a3a', 'Tanzania':'#6cae3e', 'Mali':'#c8a050', 'Chad':'#6a7fd0', 'Mozambique':'#e0b030', 'Cameroon':'#c04a8a',
  // step 4, Asia
  'Pakistan':'#2f8f4e', 'Bangladesh':'#3a8fd0', 'Indonesia':'#d04040', 'South Korea':'#4a7fe0', 'North Korea':'#5a9a4a', 'Vietnam':'#d84a3a', 'Thailand':'#4a6ad0',
  'Myanmar':'#3aa070', 'Philippines':'#3a5ad0', 'Malaysia':'#a874c8', 'Kazakhstan':'#38b0c8', 'Uzbekistan':'#9a5ac0', 'Afghanistan':'#9a6a4a', 'Mongolia':'#5a7ad0',
  // step 5, the Americas
  'Mexico':'#2e9a6a', 'Argentina':'#74b4e0', 'Colombia':'#e0c03a', 'Venezuela':'#c0405a', 'Peru':'#d0603a', 'Chile':'#a050c0', 'Bolivia':'#8a9a2a', 'Ecuador':'#3a8ac8',
  'Cuba':'#c84050',
  // step 6, Oceania
  'New Zealand':'#3a5fc8'};
const COLOR_MIN = 60;
// hand swaps (plan 2.5): at most one city per nation, each with its reason: {country: {out:'city or province name', in:'province name', why:'...'}}
const SWAPS = {};
// names of promoted cities (the largest town inside the province): {country: {'province name': 'city name'}}. Filled in by the step that opens the region
const NAMES = {
  // step 1, Europe: the largest town inside each promoted province (Natural Earth populated places, on the nations world's map), in its usual
  // English spelling; a province already named after its town keeps that name. Moselle's largest town on the grid is Saarbrücken (Germany): its
  // own prefecture, Metz, is used. Belarus: the piece called Kobryn holds Brest itself; the Brest piece's largest town is Baranovichi.
  'United Kingdom':{'Leicestershire':'Nottingham', 'Suffolk':'Ipswich', 'Buckinghamshire':'Oxford', 'Cumbria':'Carlisle', 'North Yorkshire':'Leeds', 'East Sussex':'Brighton'},
  'France':{'Moselle':'Metz', 'Seine-Maritime':'Rouen', 'Nord':'Lille', 'Guyane française':'Cayenne', 'Cher':'Bourges', 'Haute-Garonne':'Toulouse'},
  'Germany':{'Sachsen':'Dresden', 'Hessen':'Frankfurt'},
  'Italy':{'Firenze':'Florence', 'Macerata':'Ancona'},
  'Spain':{'Sevilla':'Seville', 'Bizkaia':'Bilbao', 'Pontevedra':'Vigo'},
  'Poland':{'Silesian':'Katowice', 'West Pomeranian':'Szczecin', 'Lower Silesian':'Wrocław', 'Subcarpathian':'Rzeszów', 'Pomeranian':'Gdańsk', 'Greater Poland':'Poznań', 'Lesser Poland':'Kraków', 'Warmian-Masurian':'Olsztyn'},
  'Ukraine':{"Donets'k":'Donetsk', "L'viv":'Lviv', "Luhans'k":'Luhansk', "Dnipropetrovs'k":'Dnipro', "Khmel'nyts'kyy":'Khmelnytskyi', 'Zaporizhzhya':'Zaporizhzhia'},
  'Romania':{'Bihor':'Oradea', 'Dolj':'Craiova', 'Iasi':'Iași', 'Braila':'Galați', 'Mures':'Târgu Mureș', 'Covasna':'Brașov', 'Olt':'Pitești', 'Bacau':'Bacău'},
  'Sweden':{'Västra Götaland':'Jönköping', 'Västmanland':'Västerås', 'Kronoberg':'Växjö', 'Östergötland':'Linköping', 'Västerbotten':'Umeå', 'Värmland':'Karlstad'},
  'Norway':{'Troms':'Tromsø', 'Vest-Agder':'Kristiansand', 'Buskerud':'Drammen', 'Sør-Trøndelag':'Trondheim', 'Hordaland':'Bergen', 'Hedmark':'Hamar'},
  'Finland':{'North Karelia':'Joensuu', 'Päijät-Häme':'Lahti', 'Central Ostrobothnia':'Kokkola', 'Satakunta':'Pori', 'Northern Ostrobothnia':'Oulu'},
  'Greece':{'Kentriki Makedonia':'Thessaloniki', 'Voreio Aigaio':'Chios', 'Kriti':'Heraklion', 'Anatoliki Makedonia kai Thraki':'Kavala', 'Ipeiros':'Ioannina', 'Thessalia':'Larissa'},
  'Belarus':{'Kobryn':'Brest', 'Brest':'Baranovichi'},
  // step 2, the Middle East: the same rule. By hand: Artvin's largest town on the grid is Batumi (Georgia): the largest Turkish
  // town in it, Kars, names it; Syria's Hasaka piece holds Nusaybin (Turkey) first: Al-Hasakah itself; Yemen's Abyan
  // and Al Jawf hold no town of the data set: their seats, Zinjibar and Al Hazm. Israel's eight provinces are named after their towns already
  // (the split); its capital province, Tel Aviv, also holds Jerusalem (as Morocco's Casablanca holds Rabat)
  'Turkey':{'Eskisehir':'Eskişehir', 'Sakarya':'Adapazarı', 'Artvin':'Kars', 'Kirklareli':'Tekirdağ'},
  'Iran':{'Gilan':'Rasht', 'Markazi':'Arak', 'Hormozgan':'Bandar Abbas'},
  'Saudi Arabia':{'`Asir':'Abha', 'Halat Ammar':'Tabuk'},
  'Iraq':{'Al-Basrah':'Basra', 'Babil':'Hillah', "At-Ta'mim":'Kirkuk', 'Ar Ramadi':'Ramadi', 'As-Sulaymaniyah':'Sulaymaniyah', 'Sala ad-Din':'Samarra', 'Arbil':'Erbil', 'Wasit':'Kut'},
  'Syria':{'Hasaka (Al Haksa)':'Al-Hasakah', 'Hamah':'Hama', 'Dar`a':'Daraa', 'Ar Raqqah':'Raqqa'},
  'Yemen':{'Lahij':'Aden', 'Al Hudaydah':'Hodeidah', 'Ta`izz':'Taiz', 'Hadramawt':'Mukalla', 'Abyan':'Zinjibar', 'Al Jawf':'Al Hazm'},
  'Egypt':{'Ad Daqahliyah':'Mansoura', "Shamal Sina'":'Arish', 'Al Minufiyah':'Tanta', 'Al Minya':'Minya', 'Kafr ash Shaykh':'Rosetta', 'As Suways':'Suez', 'Ash Sharqiyah':'Zagazig'},
  // step 3, Africa: the same rule (usual English spelling: Jimma, Hawassa, Dessie, El Obeid, Tobruk, Misrata). By hand: the largest town in
  // Cameroon's Sud-Ouest on the grid is Calabar (Nigeria): the largest Cameroonian town in it, Kumba; Cabinda's is Moanda (DR Congo): Cabinda
  // itself (the province keeps its name). Grand Erg Oriental, Degehabur Zone and Afar hold no town of the data set: the town nearest the
  // province, Hassi Messaoud, and the seats, Degehabur and Semera. Near ties or a village first, the seat instead: Tigray Mekelle (Adigrat by
  // 8,000 people), Ondo Akure (the data set's Ikare counts its whole district), Angola's Cuanza Sul Sumbe, Lunda Norte Dundo, Cuanza Norte
  // Ndalatando (the data set's largest are villages). A province already named after its town keeps that name (Oran, Batna, Kano, Kolwezi,
  // Bloemfontein, Benguela and so on)
  'Algeria':{'El Tarf':'Annaba', 'Skikda':'Constantine', 'Grand Erg Oriental':'Hassi Messaoud'},
  'Morocco':{'Marrakech - Tensift - Al Haouz':'Marrakesh', 'Taza - Al Hoceima - Taounate':'Fez', 'Tanger - Tétouan':'Tangier', 'Guelmim - Es-Semara':'Guelmim', 'Oriental':'Oujda',
    'Chaouia - Ouardigha':'Settat', 'Doukkala - Abda':'Safi', 'Meknès - Tafilalet':'Errachidia', 'Gharb - Chrarda - Béni Hssen':'Ouezzane'},
  'Libya':{'Al Butnan':'Tobruk', 'Misratah':'Misrata'},
  'Nigeria':{'Rivers':'Port Harcourt', 'Delta':'Warri', 'Kwara':'Ilorin', 'Zamfara':'Gusau', 'Ondo':'Akure'},
  'Ethiopia':{'Degehabur Zone':'Degehabur', 'Jima':'Jimma', 'Tigray':'Mekelle', 'Southern Nations, Nationalities and Peoples':'Hawassa', 'Dese':'Dessie', 'Afar':'Semera'},
  'Sudan':{'Al-Ubayyid':'El Obeid', 'Southern Darfur':'Nyala', 'Gezira':'Wad Medani', 'White Nile':'Kosti'},
  'Dem. Rep. Congo':{'Nord-Kivu':'Beni'},
  'Angola':{'Cuanza Sul':'Sumbe', 'Namibe':'Moçâmedes', 'Lunda Norte':'Dundo', 'Cuanza Norte':'Ndalatando'},
  'Kenya':{'Coast':'Mombasa', 'Western':'Kisumu', 'Central':'Thika'},
  'Tanzania':{'Pwani':'Kibiti', 'Kilimanjaro':'Moshi', 'Kagera':'Bukoba'},
  'Chad':{'Mayo-Kebbi Est':'Bongor', 'Ouaddaï':'Abéché', 'Logone Oriental':'Moundou', 'Kanem':'Mao', 'Moyen-Chari':'Sarh', 'Lac':'Bol', 'Ennedi':'Fada', 'Tibesti':'Zouar'},
  'Mozambique':{'Sofala':'Beira', 'Zambezia':'Quelimane', 'Manica':'Chimoio', 'Niassa':'Lichinga', 'Cabo Delgado':'Pemba', 'Gaza':'Xai-Xai'},
  'Cameroon':{'Sud-Ouest':'Kumba', 'Nord':'Garoua', 'Littoral':'Douala', 'Ouest':'Bamenda', 'Sud':'Ebolowa', 'Est':'Bertoua', 'Adamaoua':'Ngaoundéré'},
  // step 4, Asia: the same rule. By hand: where the seat of a province falls in a sea cell of the map grid, the seat names it (Ishikawa Kanazawa,
  // the grid's largest there being Fukui of the next prefecture; Sumatera Barat Padang; Jawa Tengah Semarang; Kangwon-do Wonsan; Pahang Kuantan);
  // Mie's near tie (Otsu of Shiga 537,000, Tsu 500,000) and Gangwon's (Wonju 243,000, Chuncheon 227,000) go to the seat, Tsu and Chuncheon;
  // the data set's Saidu (1.86 million) counts the whole Swat valley: Peshawar, the province's real city; Kashkadarya's Shahrisabz counts its
  // district: the seat, Qarshi; Kedah's largest, Butterworth, belongs to Penang: the seat, Alor Setar; Mindoro Oriental and Quezon hold no town of
  // the data set: their seats, Calapan and Lucena; Paktika's Zareh Sharan is the seat Sharana. Kazakh towns in their usual English spelling
  // (Aktobe, Kostanay, Karaganda, Karazhal; Mangyshlak is the region, its town Aktau). A province already named after its town keeps that name
  // (Bhopal, Kanpur, Multan, Chattogram, Rajshahi, Palembang, Busan, Daegu, Sóc Trăng, Chiang Mai, Bago, Sibu, Shymkent, Samarkand, Kandahar and
  // so on), also in a near tie (Udon Thani against Khon Kaen, Suphan Buri against Kanchanaburi, Trang against Surat Thani, Ferghana against Namangan)
  'Japan':{'Aichi':'Nagoya', 'Ehime':'Matsuyama', 'Hyōgo':'Kobe', 'Ishikawa':'Kanazawa', 'Mie':'Tsu'},
  'Pakistan':{'F.A.T.A.':'Parachinar', 'Saidu':'Peshawar'},
  'Indonesia':{'Jawa Tengah':'Semarang', 'Sumatera Barat':'Padang', 'Nusa Tenggara Barat':'Mataram', 'Sulawesi Utara':'Manado', 'Maluku':'Ambon'},
  'South Korea':{'South Jeolla':'Gwangju', 'North Chungcheong':'Daejeon', 'Gangwon':'Chuncheon', 'South Chungcheong':'Iksan'},
  'North Korea':{'Hamgyŏng-bukto':'Chongjin', 'Hwanghae-namdo':'Haeju', "P'yŏngan-namdo":'Nampo', 'Kangwŏn-do':'Wonsan', 'Chagang-do':'Kanggye', "P'yŏngan-bukto":'Chongju'},
  'Vietnam':{'Đà Nẵng':'Da Nang', 'Đông Nam Bộ':'Biên Hòa', 'Son La':'Sơn La', 'An Giang':'Long Xuyên', 'Ninh Bình':'Nam Định', 'Nghệ An':'Vinh', 'Thái Bình':'Haiphong'},
  'Thailand':{'Songkhla':'Hat Yai', 'Buri Ram':'Surin', 'Samut Sakhon':'Nakhon Pathom', 'Chachoengsao':'Prachin Buri', 'Nakhon Nayok':'Nonthaburi'},
  'Myanmar':{'Kachin':'Myitkyina', 'Chin':'Hakha', 'Tanintharyi':'Myeik', 'Kayin':'Mawlamyine'},
  'Philippines':{'Negros Occidental':'Bacolod', 'Mindoro Oriental':'Calapan', 'Dagupan':'Baguio', 'Basilan':'Zamboanga', 'Laguna':'San Pablo', 'Albay':'Legazpi', 'Pampanga':'Angeles', 'Leyte':'Tacloban', 'Quezon':'Lucena'},
  'Malaysia':{'Sabah':'Kota Kinabalu', 'Johor':'Johor Bahru', 'Kedah':'Alor Setar', 'Terengganu':'Kuala Terengganu', 'Pahang':'Kuantan', 'Perak':'Ipoh', 'Melaka':'Malacca'},
  'Kazakhstan':{'Aqtobe':'Aktobe', 'Oostanay':'Kostanay', 'Mangyshlak':'Aktau', 'Qarazhal':'Karazhal', 'Qaraghandy':'Karaganda'},
  'Uzbekistan':{'Kashkadarya':'Qarshi', 'Ferghana':'Fergana', 'Surkhandarya':'Denau', 'Bukhoro':'Bukhara'},
  'Afghanistan':{'Hirat':'Herat', 'Nangarhar':'Jalalabad', 'Nimroz':'Zaranj', 'Paktika':'Sharana', 'Samangan':'Mazar-i-Sharif', 'Badakhshan':'Fayzabad'},
  'Mongolia':{'Bayan-Ölgiy':'Ölgii', 'Bayanhongor':'Bayankhongor', 'Dornod':'Choibalsan', 'Selenge':'Darkhan', 'Övörhangay':'Arvaikheer', 'Hövsgöl':'Mörön'},
  // step 5, the Americas: the same rule. By hand: Canada's London holds Detroit (United States) first: London itself (the province keeps its
  // name); Argentina's Misiones holds Encarnación (Paraguay) first: Posadas; Formosa's San Lorenzo is Paraguay's: Formosa keeps its name;
  // Venezuela's Táchira holds Cúcuta (Colombia) first: San Cristóbal; Peru's Oyon holds no town of the data set: Huacho, the largest of the
  // towns beside it; Bolivia's Santa Ana is a village the data set counts with its district: the seat, Trinidad. Usual short forms: Poza Rica
  // (Poza Rica de Hidalgo), Jujuy and Tucumán (their seats San Salvador de Jujuy and San Miguel de Tucumán). A province already named after its
  // town keeps that name (Torreón, Oaxaca, Puebla, Hermosillo, Belém, Curitiba, Rosario, Mendoza, Medellín, Iquitos, Arequipa, Valparaíso,
  // Cochabamba, Oruro, Camagüey, Holguín and so on), also in a near tie (Coquimbo against La Serena, Cienfuegos against Santa Clara, whose own
  // province is Villa Clara)
  'Canada':{'New Brunswick':'Moncton'},
  'Mexico':{'Yucatán':'Mérida', 'Poza Rica de Hidalgo':'Poza Rica'},
  'Brazil':{'Espírito Santo':'Vitória'},
  'Argentina':{'Misiones':'Posadas'},
  'Colombia':{'Atlántico':'Barranquilla', 'Cauca':'Cali', 'Cesar':'Valledupar', 'Chocó':'Quibdó', 'Risaralda':'Pereira', 'Magdalena':'Santa Marta', 'Tolima':'Ibagué', 'Santander':'Bucaramanga'},
  'Venezuela':{'Monagas':'Maturín', 'Carabobo':'Valencia', 'Táchira':'San Cristóbal', 'Portuguesa':'Acarigua', 'Nueva Esparta':'Porlamar', 'Anzoátegui':'Barcelona', 'Aragua':'Maracay', 'Lara':'Barquisimeto'},
  'Peru':{'Áncash':'Chimbote', 'Junín':'Huancayo', 'Oyon':'Huacho'},
  'Chile':{"Libertador General Bernardo O'Higgins":'Rancagua', 'Tarapacá':'Iquique', 'La Araucanía':'Temuco', 'Los Lagos':'Puerto Montt', 'Maule':'Talca'},
  'Bolivia':{'Santa Ana':'Trinidad', 'Chuquisaca':'Sucre'},
  'Ecuador':{'Guayas':'Guayaquil', 'Manabi':'Portoviejo', 'Chimborazo':'Ambato', 'Azuay':'Cuenca', 'Carchi':'Ibarra', 'El Oro':'Machala', 'Cotopaxi':'Latacunga', 'Morona Santiago':'Macas'},
  'Cuba':{'Granma':'Bayamo'},
  // step 6, Oceania: the same rule (Australia keeps the eleven cities world.js gives it today)
  'New Zealand':{'Otago':'Dunedin', 'Manawatu-Wanganui':'Palmerston North', 'Waikato':'Hamilton', 'Canterbury':'Christchurch', 'Bay of Plenty':'Tauranga'},
};

// Each city's ONE main resource in the nations world (the owner's resource balance rule, docs/ECONOMY.md "Resource balance"): set here by hand for
// every playable nation, after the real geography of the region, instead of by the map method of rules/map.js cityMains (which still decides the
// classic world, independent land and every save made before this table: a save carries what it was made with, rules/state.js nationsWorld).
// The rule (checked below): all six goods (money, oil, materials, iron, electronics, rare materials) in every nation; no good in more than two
// of its cities, except that a nation of 13 or 14 cities gives its one or two cities beyond 12 the good that best fits its region, so one or two
// goods (never more than n - 12) reach three. Per nation: a short note on the geography, then 'key City, City | key City | ...'
// (keys cash oil metal iron elec rare; names as the game shows them). docs/RESOURCES-PER-NATION.md lists the result for the owner.
const MAIN_KEYS = ['cash', 'oil', 'metal', 'iron', 'elec', 'rare'], MAIN_CH = {cash:'c', oil:'o', metal:'m', iron:'i', elec:'e', rare:'r'};
const MAINS_ALL = true;    // every open nation must be in MAINS (true once the table covers them all)
const MAINS = {
  // Syria first (the owner's example: 4 of 8 cities on oil, no rare materials). Oil where Syria's fields are, the Jazira and the Euphrates (Al-Hasakah:
  // Rmelan and Suwaydiyah; Raqqa: the fields of the Euphrates valley towards Deir ez-Zor); money in the capital and in Daraa (the Nasib crossing,
  // the trade road to Jordan and the Gulf); electronics and industry in Aleppo, the industrial capital; materials in Hama (cement works and the
  // Hama steel rolling mill's heavy industry); iron in Idlib (the Rajo iron ore of the north-western hills by Afrin); rare materials in Homs (the
  // Palmyra phosphates of the Homs desert carry uranium and rare earths, recovered at the Homs phosphoric acid plant)
  'Syria':['Jazira and Euphrates oil, Aleppo industry, Palmyra phosphates (uranium, rare earths) at Homs, Rajo iron by Idlib', 'cash Damascus, Daraa | oil Al-Hasakah, Raqqa | metal Hama | iron Idlib | elec Aleppo | rare Homs'],
  // the other 67, A to Z (a short reason each; money in the capital unless the rule needs otherwise)
  'Afghanistan':['Sheberghan gas in the north, Mes Aynak copper (Logar), Hajigak iron (Bamyan), Khanneshin rare earths (Helmand), Badakhshan gems', 'cash Kabul, Herat | oil Balkh, Mazar-i-Sharif | metal Sharana, Fayzabad | iron Baghlan, Jalalabad | elec Kandahar | rare Zaranj'],
  'Algeria':['Hassi Messaoud and Hassi R\'Mel (Laghouat) oil and gas, Ouenza iron and El Hadjar steel (Annaba), Gara Djebilet iron, Hoggar uranium and rare earths, Bordj Bou Arreridj electronics', 'cash Algiers, Oran | oil Hassi Messaoud, Djelfa | metal Batna, Chlef | iron Annaba, Adrar | elec Constantine, Aïn Defla | rare Arak'],
  'Angola':['Cabinda and Kwanza basin oil, Lunda diamonds (Dundo), Kassinga iron by the Namibe railway, Cassala-Kitungo iron (Cuanza Norte), copper and timber in the north and south-east', 'cash Luanda, Benguela | oil Cabinda, Sumbe | metal Uíge, Mavinga | iron Moçâmedes, Ndalatando | elec Huambo | rare Dundo'],
  'Argentina':['Mendoza oil, Formosa\'s Palmar Largo field, Jujuy lithium, Zapla iron (Tucumán), Sierra Grande iron (Trelew), San Juan mining, Sierra Pintada uranium (San Rafael), Córdoba industry', 'cash Buenos Aires, Posadas | oil Mendoza, Formosa | metal San Juan, San Rafael | iron Trelew, Tucumán | elec Córdoba, Rosario | rare Jujuy'],
  'Australia':['Pilbara iron (Port Hedland), Whyalla iron (Adelaide), Timor Sea and Queensland gas, Weipa bauxite (Cairns), Tasmanian zinc, Nolans and Mt Weld rare earths, WA lithium', 'cash Canberra, Sydney | oil Darwin, Brisbane | metal Cairns, Hobart | iron Port Hedland, Adelaide | elec Melbourne | rare Alice Springs, Perth'],
  'Bangladesh':['Bakhrabad and Titas gas (Comilla), Barapukuria coal and Maddhapara granite (Rajshahi), Chattogram ship-breaking steel, Gazipur industry, heavy-mineral beach sands', 'cash Dhaka, Khulna | oil Comilla | metal Rajshahi, Chuadanga | iron Chattogram | elec Mymensingh | rare Barisal'],
  'Belarus':['Mozyr and Novopolotsk (Vitebsk) refineries, Soligorsk potash, Zhlobin steel (Gomel), Krichev cement (Mogilev)', 'cash Minsk | oil Mozyr, Vitebsk | metal Baranovichi, Mogilev | iron Gomel | elec Grodno | rare Brest'],
  'Bolivia':['Chaco gas (Tarija, Chuquisaca), Uyuni lithium (Potosí), Huanuni tin (Oruro), Mutún iron (Santa Cruz), Beni timber', 'cash La Paz | oil Tarija, Sucre | metal Oruro, Trinidad | iron Santa Cruz | elec Cochabamba | rare Potosí'],
  'Brazil':['pre-salt and Bahia oil, Minas Gerais and Carajás iron, Tubarão iron port (Vitória: the third iron city, Brazil\'s best fit), Araxá niobium, Mato Grosso diamonds, São Paulo and Manaus electronics (Curitiba the third)', 'cash Brasília, Fortaleza | oil Rio de Janeiro, Salvador | metal Porto Alegre, Recife | iron Belo Horizonte, Belém, Vitória | elec São Paulo, Manaus, Curitiba | rare Uberlândia, Cuiabá'],
  'Cameroon':['Rio del Rey oil (Kumba), Kribi-Mbalam iron (Ebolowa), Minim-Martap bauxite (Ngaoundéré), Figuil cement (Garoua), Nkamouna cobalt (East)', 'cash Yaoundé, Bamenda | oil Kumba | metal Ngaoundéré, Garoua | iron Ebolowa | elec Douala | rare Bertoua'],
  'Canada':['Alberta oil, Labrador iron (St. John\'s), Cape Breton steel (Halifax), BC and New Brunswick forestry, Nechalacho rare earths, Tanco lithium and caesium (Manitoba), Waterloo and Montreal tech', 'cash Ottawa, Toronto | oil Edmonton, Calgary | metal Vancouver, Moncton | iron St. John\'s, Halifax | elec London, Montreal | rare Yellowknife, Winnipeg'],
  'Chad':['Doba and Bongor basin oil, Lake Chad natron, Tibesti uranium and rare earths (Zouar), cotton industry at Sarh', 'cash N\'Djamena, Abéché | oil Moundou, Bongor | metal Bol, Mao | iron Fada | elec Sarh | rare Zouar'],
  'Chile':['Magallanes oil, Atacama lithium (Iquique), El Teniente copper (Rancagua), Coquimbo iron belt, Huachipato steel (Concepción, by Talca), southern forestry', 'cash Santiago, Temuco | oil Punta Arenas | metal Rancagua, Puerto Montt | iron Coquimbo, Talca | elec Valparaíso | rare Iquique'],
  'China':['Daqing (Harbin), Karamay and Tarim oil (Xinjiang: the third oil city), Anshan and Wuhan steel, Bayan Obo (Hohhot) and Sichuan-Yunnan rare earths, Pearl River Delta, Chengdu and Xi\'an electronics (Xi\'an the third)', 'cash Beijing, Shanghai | oil Harbin, Ürümqi, Kashgar | metal Lanzhou, Lhasa | iron Shenyang, Wuhan | elec Guangzhou, Chengdu, Xi\'an | rare Hohhot, Kunming'],
  'Colombia':['Llanos and Barrancabermeja oil, Cesar and Guajira coal, Cerro Matoso ferronickel, Chocó platinum and gold', 'cash Bogotá, Cali | oil Puerto López, Bucaramanga | metal Valledupar, Santa Marta | iron Medellín, Ibagué | elec Barranquilla, Pereira | rare Quibdó'],
  'Cuba':['Cienfuegos refinery, Jatibonico oil (Sancti Spíritus), Moa nickel and cobalt (Holguín), Mayarí iron, Nuevitas cement', 'cash Havana, Guantánamo | oil Cienfuegos, Sancti Spíritus | metal Bayamo | iron Santiago de Cuba | elec Camagüey | rare Holguín'],
  'Dem. Rep. Congo':['Katanga copper (Lubumbashi) and cobalt (Kolwezi), Kasai diamonds (Mbuji-Mayi), Lake Albert and Cuvette oil, Lukuga coal (Kalemie)', 'cash Kinshasa, Kananga | oil Beni, Gemena | metal Lubumbashi, Kalemie | iron Kisangani, Kikwit | elec Kenge | rare Kolwezi, Mbuji-Mayi'],
  'Ecuador':['Oriente oil, Zaruma-Portovelo gold (Machala), Cotopaxi and Manabí cement, Cuenca appliance industry', 'cash Quito, Guayaquil | oil Macas, Ibarra | metal Latacunga, Portoviejo | iron Ambato | elec Cuenca | rare Machala'],
  'Egypt':['Gulf of Suez oil, Delta gas, Rosetta black sands (monazite), Bahariya and Aswan iron, Sinai and Upper Egypt quarries, 10th of Ramadan industry', 'cash Cairo, Alexandria | oil Suez, Mansoura | metal Arish, Mallawi | iron Minya, Aswan | elec Zagazig, Tanta | rare Rosetta'],
  'Ethiopia':['Ogaden gas, Danakil potash (Semera), Messebo cement (Mekelle), Kenticha tantalum (Guji), Bikilal iron, industrial parks', 'cash Addis Ababa, Dire Dawa | oil Degehabur, Gode | metal Semera, Mekelle | iron Jimma, Dessie | elec Hawassa, Bahir Dar | rare Goba'],
  'Finland':['Porvoo refinery, Oulu tech, Kokkola cobalt, Tornio steel, Karelian forestry, Harjavalta smelter', 'cash Helsinki | oil Lahti | metal Joensuu, Pori | iron Rovaniemi | elec Oulu | rare Kokkola'],
  'France':['Le Havre and Fos refineries, Lorraine iron and Dunkirk steel, Toulouse aerospace, Kourou, La Rochelle rare-earth plant', 'cash Paris, Lyon | oil Rouen, Marseille | metal Bourges, Brest | iron Metz, Lille | elec Toulouse, Cayenne | rare Bordeaux'],
  'Germany':['Hamburg refineries and Emsland oil, Ruhr and Upper Palatinate steel, BASF and Dyckerhoff, Munich and Stuttgart electronics, Erzgebirge lithium and tin', 'cash Berlin, Frankfurt | oil Hamburg, Bremen | metal Mannheim, Wiesbaden | iron Cologne, Nürnberg | elec Munich, Stuttgart | rare Dresden'],
  'Greece':['Epirus oil blocks, Kavala black sands (rare earths), Parnassos bauxite, Ptolemaida lignite, Thessaloniki steel, Chios shipowners', 'cash Athens, Chios | oil Ioannina | metal Lamia, Larissa | iron Thessaloniki | elec Heraklion | rare Kavala'],
  'India':['Assam and Gujarat oil, Bellary, Jharkhand and Bhilai iron (the third iron city, India\'s best fit), Odisha and Tamil Nadu monazite, Bangalore, Hyderabad and Uttar Pradesh electronics', 'cash New Delhi, Mumbai | oil Guwahati, Ahmedabad | metal Kolkata, Jaipur | iron Hubballi, Patna, Bhopal | elec Bangalore, Hyderabad, Kanpur | rare Bhubaneswar, Chennai'],
  'Indonesia':['Kalimantan, South Sumatra and Aceh oil and gas (the third oil city, Indonesia\'s best fit), Grasberg and Maluku ores, Sulawesi and Halmahera nickel, Lombok iron sands, Java industry', 'cash Jakarta, Surabaya | oil Samarinda, Palembang, Medan | metal Jayapura, Ambon | iron Padang, Mataram | elec Bandung, Semarang | rare Makassar, Manado'],
  'Iran':['Khuzestan and Kermanshah oil, Mobarakeh and Sangan iron, Arak aluminium, Gilan forestry, Shiraz electronics (IEI), Bafq rare earths, Sistan minerals, Bandar Abbas port', 'cash Tehran, Bandar Abbas | oil Ahvaz, Kermanshah | metal Arak, Rasht | iron Isfahan, Mashhad | elec Shiraz, Tabriz | rare Yazd, Zahedan'],
  'Iraq':['Kirkuk and Basra oil, Mishraq sulphur (Mosul), Sulaymaniyah cement, Akashat phosphate and uranium (Anbar), Iskandariya industry', 'cash Baghdad, Erbil | oil Kirkuk, Basra | metal Mosul, Sulaymaniyah | iron Kut, Samarra | elec Hillah | rare Ramadi'],
  'Israel':['Golan oil (Afek), Haifa\'s tech park, Beersheba cyber park, Negev phosphates and uranium (Dimona), Makhtesh Ramon quarries', 'cash Tel Aviv | oil Tiberias | metal Mitzpe Ramon | iron Nitzana | elec Haifa, Beersheba | rare Dimona'],
  'Italy':['Basilicata and Sicily oil, Elba-Piombino and Bagnoli steel, Sassuolo ceramics, Apulian quarries, Turin and Marche industry, Sardinian fluorspar', 'cash Rome, Milan | oil Bari, Palermo | metal Bologna, Foggia | iron Florence, Naples | elec Turin, Ancona | rare Cagliari'],
  'Japan':['Yokkaichi and Wakayama refineries, Yawata and Kobe steel, Mizushima and Niihama works, Chubu and Hokuriku electronics, rare-metal recovery (Kosaka) and Hokkaido mines', 'cash Tokyo, Osaka | oil Tsu, Wakayama | metal Okayama, Matsuyama | iron Fukuoka, Kobe | elec Nagoya, Kanazawa | rare Sendai, Sapporo'],
  'Kazakhstan':['Mangystau and Aktobe oil, Rudny and Atasu iron, Karaganda coal, Ulba rare metals (Oskemen), Almaty', 'cash Astana, Shymkent | oil Aktau, Aktobe | metal Karaganda, Semey | iron Kostanay, Karazhal | elec Almaty | rare Oskemen'],
  'Kenya':['Turkana oil, Kwale titanium and Mrima rare earths (Mombasa), Konza tech city, Athi River cement, Rift timber, Homa Bay iron', 'cash Nairobi | oil Marsabit | metal Thika, Eldoret | iron Kisumu | elec Machakos | rare Mombasa'],
  'Libya':['Sirte basin and Tobruk oil, Misrata steel, Fezzan minerals, Jebel Akhdar and Nafusa cement', 'cash Tripoli | oil Awjilah, Tobruk | metal Al Marj, Mizdah | iron Misrata | elec Benghazi | rare Sabha'],
  'Malaysia':['Sabah and Sarawak oil, Bukit Besi iron (Terengganu), Kinta tin and cement, Lynas rare-earth plant (Kuantan), Kulim and Johor electronics', 'cash Kuala Lumpur, Malacca | oil Kota Kinabalu, Sibu | metal Ipoh | iron Kuala Terengganu | elec Alor Setar, Johor Bahru | rare Kuantan'],
  'Mali':['Taoudeni basin, Taoudenni salt, Tilemsi phosphate (Gao), western iron (Kayes), Goulamina lithium (Sikasso)', 'cash Bamako, Mopti | oil Timbuktu, Nara | metal Taoudenni, Gao | iron Kayes | elec Ségou | rare Sikasso'],
  'Mexico':['Veracruz and Chiapas-Tabasco oil, Monterrey and Monclova steel, Pachuca silver, Oaxaca mines, Guadalajara and Puebla industry, Sonora lithium, Las Cuevas fluorite', 'cash Mexico City, Mérida | oil Poza Rica, Tuxtla Gutiérrez | metal Pachuca, Oaxaca | iron Monterrey, Torreón | elec Guadalajara, Puebla | rare Hermosillo, San Luis Potosí'],
  'Mongolia':['Tamsagbulag oil (Dornod), Darkhan steel, Oyu Tolgoi copper, Khalzan Buregtei rare earths (west)', 'cash Ulaanbaatar | oil Choibalsan | metal Arvaikheer, Bayankhongor | iron Darkhan | elec Mörön | rare Ölgii'],
  'Morocco':['Tendrara gas (Oujda), Khouribga and Safi phosphates, Rif and Anti-Atlas iron, Bou Azzer cobalt, Tangier industry', 'cash Casablanca, Marrakesh | oil Oujda | metal Settat, Safi | iron Ouezzane, Guelmim | elec Tangier, Fez | rare Errachidia'],
  'Mozambique':['Rovuma and Pande gas, Tete coal, Niassa forestry, Manica iron, Moma mineral sands (Nampula)', 'cash Maputo, Beira | oil Pemba, Xai-Xai | metal Tete, Lichinga | iron Chimoio | elec Quelimane | rare Nampula'],
  'Myanmar':['Myanaung and offshore gas, Letpadaung copper (Monywa), Bago teak, Kachin rare earths and jade, Tanintharyi tin and tungsten', 'cash Yangon, Mandalay | oil Hinthada, Pathein | metal Monywa, Bago | iron Hakha | elec Mawlamyine | rare Myitkyina, Myeik'],
  'New Zealand':['Taranaki oil and gas, Waikato iron sands (Glenbrook steel), forestry and West Coast coal, Otago gold', 'cash Wellington | oil Palmerston North | metal Tauranga, Christchurch | iron Hamilton | elec Auckland | rare Dunedin'],
  'Nigeria':['Niger Delta oil, Itakpe and Oshogbo iron and steel, Enugu coal, Ashaka cement, Jos tin and columbite (Kaduna), Zamfara gold, Lagos tech', 'cash Abuja, Kano | oil Port Harcourt, Warri | metal Enugu, Maiduguri | iron Akure, Ilorin | elec Lagos, Ibadan | rare Kaduna, Gusau'],
  'North Korea':['West Korea Bay oil, Musan and Unnyul iron, Chagang mines, Jongju rare earths (Chongju)', 'cash Pyongyang | oil Nampo | metal Kanggye | iron Chongjin, Haeju | elec Wonsan | rare Chongju'],
  'Norway':['North Sea oil (Bergen), Rana iron and Sydvaranger, Elkem and nickel refinery, Hedmark forestry, Fen rare earths (Telemark)', 'cash Oslo | oil Bergen | metal Kristiansand, Hamar | iron Tromsø | elec Trondheim | rare Drammen'],
  'Pakistan':['Sui and lower Sindh gas, Chiniot and Kalabagh iron, Dera Ghazi Khan cement, Gujranwala electrical industry, Khyber gems and copper', 'cash Islamabad, Karachi | oil Sukkur, Hyderabad | metal Multan, Sahiwal | iron Faisalabad, Bannu | elec Lahore, Gujranwala | rare Peshawar, Parachinar'],
  'Peru':['Loreto and Talara oil, Siderperú and Aceros Arequipa (Marcona iron), La Oroya and Toquepala, Yanacocha and Pasco gold and silver', 'cash Lima | oil Iquitos, Piura | metal Huancayo, Tacna | iron Chimbote, Arequipa | elec Huacho | rare Cajamarca, Huánuco'],
  'Philippines':['Malampaya gas and Batangas refineries, Benguet mines, Bicol and Samar iron, Laguna and Clark electronics, Mindanao nickel', 'cash Manila, Zamboanga | oil Calapan, Lucena | metal Baguio, Bacolod | iron Tacloban, Legazpi | elec San Pablo, Angeles | rare Davao'],
  'Poland':['Gdańsk refinery and Wielkopolska gas, Silesian coal, Nowa Huta steel, KGHM silver and rhenium, Łódź and Aviation Valley industry', 'cash Warsaw, Szczecin | oil Gdańsk, Poznań | metal Katowice, Olsztyn | iron Kraków | elec Łódź, Rzeszów | rare Wrocław'],
  'Romania':['Argeș oil and Transylvanian gas, Galați steel, Oltenia coal, Apuseni gold and bauxite, Iași and Brașov industry', 'cash Bucharest | oil Pitești, Târgu Mureș | metal Craiova, Bacău | iron Galați | elec Iași, Brașov | rare Oradea'],
  'Russia':['Volga-Urals, West Siberian and Timan-Pechora oil (the third oil city), Urals, Taganrog and Volgograd steel (the third iron city), Norilsk and Bratsk metals, Lovozero and Tomtor rare earths', 'cash Moscow, Vladivostok | oil Kazan, Omsk, Arkhangelsk | metal Krasnoyarsk, Irkutsk | iron Yekaterinburg, Rostov, Volgograd | elec Saint Petersburg, Novosibirsk | rare Yakutsk, Murmansk'],
  'Saudi Arabia':['Ghawar and Neutral Zone oil, Al Jalamid phosphate and Az Zabirah bauxite, Wadi Sawawin iron, Arabian Shield gold (Mahd adh Dhahab, the south)', 'cash Riyadh, Jeddah | oil Hofuf, Hafar al Batin | metal Arar, Hail | iron Tabuk | elec Abha | rare Medina, As Sulayyil'],
  'South Africa':['Secunda synfuels, Thabazimbi and Sishen iron, Bushveld platinum (Rustenburg), Phalaborwa rare earths, gold and coal mining, East London and Durban car plants', 'cash Pretoria, Cape Town | oil Middelburg | metal Klerksdorp, Bethlehem | iron Thabazimbi, Bloemfontein | elec East London, Durban | rare Rustenburg, Thohoyandou'],
  'South Korea':['Ulsan refineries (Busan), Pohang and Gwangyang steel, Gumi and Daedeok electronics, Hwangdeung granite, Hongcheon rare earths', 'cash Seoul | oil Busan | metal Iksan | iron Andong, Gwangju | elec Daegu, Daejeon | rare Chuncheon'],
  'Spain':['Cartagena and Puertollano refineries, Basque and Asturian steel, Riotinto copper, Galician granite and forestry, Retortillo uranium and tungsten', 'cash Madrid, Málaga | oil Murcia, Ciudad Real | metal Seville, Vigo | iron Bilbao, Lugo | elec Barcelona, Zaragoza | rare Salamanca'],
  'Sudan':['Kordofan and Darfur oil, Atbara cement, Ingessana chromite, Red Sea hills iron, Nubian and Jebel Amer gold, the GIAD industrial complex', 'cash Khartoum, Kosti | oil El Obeid, Nyala | metal Shendi, Sennar | iron Port Sudan | elec Wad Medani | rare Dongola, El Fasher'],
  'Sweden':['Kiruna iron (Luleå), Norra Kärr rare earths (Jönköping), Boliden and Värmland forestry, ABB and Saab', 'cash Stockholm | oil Växjö | metal Umeå, Karlstad | iron Luleå | elec Västerås, Linköping | rare Jönköping'],
  'Tanzania':['Mnazi Bay and Songo Songo gas, Liganga iron, Tanga cement, Geita gold, tanzanite (Arusha), Kabanga nickel (Kagera)', 'cash Dar es Salaam, Kigoma | oil Mtwara, Kibiti | metal Tanga, Mwanza | iron Mbeya | elec Morogoro, Moshi | rare Arusha, Bukoba'],
  'Thailand':['Gulf of Thailand gas and U Thong oil, Udon potash and Mae Moh lignite, Kanchanaburi and Isan iron, Ayutthaya and Prachin Buri electronics, Phuket tin', 'cash Bangkok, Nakhon Ratchasima | oil Hat Yai, Suphan Buri | metal Udon Thani, Chiang Mai | iron Nakhon Pathom, Surin | elec Nonthaburi, Prachin Buri | rare Trang'],
  'Turkey':['Batman oil and Thrace gas, Divriği iron and Ereğli steel, Seydişehir aluminium, Kırka and Balıkesir boron, Beylikova rare earths, Manisa electronics', 'cash Ankara, Istanbul | oil Diyarbakır, Tekirdağ | metal Antalya, Kars | iron Malatya, Adapazarı | elec Izmir, Adana | rare Eskişehir, Bursa'],
  'Ukraine':['Shebelynka and Black Sea gas, Kryvyi Rih and Zaporizhstal, Donbas coal, Zhytomyr titanium, Lviv IT', 'cash Kyiv, Odessa | oil Kharkiv, Kherson | metal Donetsk, Luhansk | iron Dnipro, Zaporizhzhia | elec Lviv | rare Khmelnytskyi'],
  'United Kingdom':['North Sea oil and gas (Edinburgh, Ipswich by Bacton), Scunthorpe steel and Harland & Wolff, Nottingham coal, Cumbria, Cornish lithium and tin, Oxford and Brighton tech', 'cash London, Manchester | oil Edinburgh, Ipswich | metal Nottingham, Carlisle | iron Leeds, Belfast | elec Oxford, Brighton | rare Bournemouth'],
  'United States of America':['Texas and Alaska oil (the third oil city), Mesabi iron and Gary steel, Arizona copper and Georgia forestry, Mountain Pass and Colorado, Silicon Valley and Seattle, Miami trade (the third money city)', 'cash Washington, New York, Miami | oil Houston, Dallas, Anchorage | metal Phoenix, Atlanta | iron Minneapolis, Chicago | elec San Francisco, Seattle | rare Los Angeles, Denver'],
  'Uzbekistan':['Gazli and Ustyurt gas, Muruntau gold and uranium (Navoi), Bekabad steel, Shargun coal and Dehkanabad potash, Fergana valley industry', 'cash Tashkent, Samarkand | oil Bukhara, Nukus | metal Denau, Qarshi | iron Jizzakh | elec Fergana | rare Navoi'],
  'Venezuela':['Monagas and Barinas oil, SIDOR iron (Ciudad Guayana), Orinoco Mining Arc gold and coltan, Táchira coal and Lara cement', 'cash Caracas, Porlamar | oil Maturín, Acarigua | metal San Cristóbal, Barquisimeto | iron Ciudad Guayana | elec Valencia, Maracay | rare Barcelona'],
  'Vietnam':['Bach Ho and Ca Mau gas, Thach Khe iron and Da Nang steel, Ninh Binh and Kien Luong cement, Dong Pao rare earths (Son La), Saigon and Haiphong electronics', 'cash Hanoi, Sóc Trăng | oil Biên Hòa, Cà Mau | metal Nam Định, Long Xuyên | iron Vinh, Da Nang | elec Ho Chi Minh City, Haiphong | rare Sơn La'],
  'Yemen':['Masila and Marib-Jawf oil, Bajil cement, Al Hariqa gold (Hajjah), Taiz industry, Aden port', 'cash Sana\'a, Aden | oil Mukalla, Al Hazm | metal Hodeidah, Zinjibar | iron Ibb | elec Taiz | rare Hajjah'],
};

/* ---------- the map and the rules ---------- */
// the province split (tools/build-provsplit.js writes tools/provsplit.json; docs/NATIONS-PLAN.md 4.6): copied into nations.js as NATIONS.map. The
// cities are chosen on that map (the nations world's), where Israel, Greece, Cuba and Belarus have their new provinces
const SPLIT = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'provsplit.json'), 'utf8'));
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
globalThis.NATIONS = {v:1, regions:[], open:[], nations:[], map:SPLIT};   // (only the map: the rules see no playable nations here)
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const IM = new Function("'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn IM;')();
IM.api.newGame(12345, 0, []);   // the classic world (rules set up)
if (IM.api.mapNew !== SPLIT.v) throw new Error('the rules did not take the province split of tools/provsplit.json');
const G = IM.api.mapOf(IM.api.mapNew), WORLD = globalThis.WORLD;   // the nations world's map: people, deposits, coasts, neighbours, the split provinces
const flag = P => G.D[P.id][2];   // bit 1: a city of today, bit 2: a capital of today
const C = G.countries.map((c, k) => ({k, name:c.name, provs:c.provs.map(id => G.P[id]).filter(P => !P.sea)})).filter(c => c.provs.length);
for (const c of C){ c.n = c.provs.length; c.cities = c.provs.filter(P => flag(P) & 1); c.cap = c.provs.find(P => flag(P) & 2) || null; c.pop = c.provs.reduce((s, P) => s + P.pop0, 0); }
const byName = new Map(C.map(c => [c.name, c]));
const all = []; for (const r of REGIONS) for (const n in ROSTER[r]){ const c = byName.get(n); if (!c) throw new Error('not in world.js: ' + n); all.push({c, region:r, tier:ROSTER[r][n][0], split:ROSTER[r][n].endsWith('*')}); }

/* ---------- the city-choice method (section 2 of the plan) ---------- */
// how many: 7 for the smallest playable nation up to 14 for the giants (people and land count equally, on a log scale), never more than the provinces minus 2
const sizeOf = c => (Math.log10(Math.max(1, c.pop)) + Math.log10(c.n))/2;
const TC = {lo:Math.min(...all.filter(e => !e.split).map(e => sizeOf(e.c))), hi:sizeOf(byName.get('Russia'))};
const targetCities = c => Math.max(7, Math.min(14, c.n - 2, Math.round(7 + (sizeOf(c) - TC.lo)/(TC.hi - TC.lo)*7)));
// land steps inside the country from the cities chosen so far; a part across the sea counts as far away
function hops(c, from){ const ids = new Set(c.provs.map(P => P.id)), d = new Map(from.map(id => [id, 0])), q = from.slice();
  for (let i = 0; i < q.length; i++) for (const v of G.P[q[i]].nbs) if (ids.has(v) && !d.has(v)){ d.set(v, d.get(q[i]) + 1); q.push(v); } return d; }
const cityScore = P => Math.pow(Math.max(0.02, P.pop0), 0.6)*((flag(P) & 1) ? 1.5 : 1)*(P.coast ? 1.15 : 1)*(P.terrain === 'desert' || P.terrain === 'tundra' || P.terrain === 'snow' ? 0.8 : 1);
// the capital first; while cities of today are left only they compete (a city of today is never passed over for a new one); then, one at a
// time, the best province: people, spread (a province next to a chosen city scores less than half), coast, harsh ground, a missing resource.
// A nation with a rare-earth deposit and no city on one gives its last promoted slot to its richest deposit
function pickCities(c, k = targetCities(c)){
  const want = CAPS[c.name], named = want && (c.provs.find(P => P.cityName === want) || c.provs.find(P => P.name === want));
  if (want && !named) throw new Error('capital not found: ' + c.name + ' ' + want);
  const cap = named || c.cap || c.cities.slice().sort((a, b) => b.pop0 - a.pop0)[0] || c.provs.slice().sort((a, b) => b.pop0 - a.pop0)[0];
  const out = [cap], have = () => ({oil:out.some(P => P.oil), ore:out.some(P => P.ore || P.iron), rare:out.some(P => P.rare > 0)});
  while (out.length < Math.min(k, c.n)){
    const d = hops(c, out.map(P => P.id)), h = have(); let best = null, bs = -1;
    const left = c.cities.filter(P => !out.includes(P)), pool = left.length ? left : c.provs;
    for (const P of pool){ if (out.includes(P)) continue; const dist = d.has(P.id) ? d.get(P.id) : 9;
      const spread = dist <= 1 ? 0.45 : dist === 2 ? 0.85 : dist >= 9 ? 1.25 : 1 + Math.min(0.3, 0.05*dist);
      const res = (!h.oil && P.oil ? 1.6 : 1)*(!h.ore && (P.ore || P.iron) ? 1.3 : 1)*(!h.rare && P.rare > 0 ? 2.2 : 1);
      const sc = cityScore(P)*spread*res; if (sc > bs){ bs = sc; best = P; } }
    if (!best) break; out.push(best); }
  if (!out.some(P => P.rare > 0)){ const R = c.provs.filter(P => P.rare > 0 && !out.includes(P)).sort((a, b) => b.rare - a.rare || b.pop0 - a.pop0)[0];
    let i = out.length - 1; while (i > 0 && (flag(out[i]) & 1)) i--;
    if (R && i > 0) out[i] = R; }
  return out; }
// a nation whose region is not open yet: the cities world.js gives it today, capital first
const todayCities = c => { const cap = c.cap || c.cities[0]; return [cap, ...c.cities.filter(P => P !== cap)]; };
const cname = P => P.cityName || P.name;

function entry(e, open){ const c = e.c, list = open ? pickCities(c) : todayCities(c), swaps = [], names = {};
  const sw = SWAPS[c.name]; if (sw && open){ const i = list.findIndex(P => cname(P) === sw.out || P.name === sw.out), Q = c.provs.find(P => P.name === sw.in || P.cityName === sw.in);
    if (i <= 0 || !Q || list.includes(Q)) throw new Error('bad swap for ' + c.name); swaps.push({out:list[i].id, in:Q.id, why:sw.why}); list[i] = Q; }
  for (const P of list){ const nm = NAMES[c.name] && NAMES[c.name][P.name]; if (nm && !(flag(P) & 1)) names[P.id] = nm; }
  if (!COLORS[c.name]) throw new Error('no colour for ' + c.name + ': add it to COLORS');
  if (!hqOf.has(c.name)) throw new Error('no HQ style for ' + c.name + ': add it to HQ');
  const out = {name:DISPLAY[c.name] || c.name, country:c.name, region:e.region, tier:e.tier, hq:hqOf.get(c.name), color:COLORS[c.name], capital:list[0].id, cities:list.map(P => P.id), names, swaps};
  // mains: one letter per city, in the order of cities (c money, o oil, m materials, i iron, e electronics, r rare materials), from MAINS
  const M = open && MAINS[c.name]; if (M){ const nm = P => names[P.id] || cname(P), at = new Map();
    for (const part of M[1].split('|')){ const s = part.trim(), k = s.split(' ')[0]; if (!MAIN_CH[k]) throw new Error(`${c.name}: unknown resource ${k}`);
      for (const city of s.slice(k.length).split(',').map(x => x.trim()).filter(Boolean)){ const P = list.find(Q => nm(Q) === city);
        if (!P) throw new Error(`${c.name}: no city ${city} (cities: ${list.map(nm).join(', ')})`); if (at.has(P.id)) throw new Error(`${c.name}: ${city} given two resources`); at.set(P.id, k); } }
    const miss = list.filter(P => !at.has(P.id)); if (miss.length) throw new Error(`${c.name}: no resource for ${miss.map(nm).join(', ')}`);
    out.mains = list.map(P => MAIN_CH[at.get(P.id)]).join(''); }
  return out; }
// the owner's resource balance rule on one nation's letters (n cities): '' when it holds, else what breaks it
function mainsRule(n, s){ const cnt = {}, bad = []; for (const ch of s) cnt[ch] = (cnt[ch] || 0) + 1;
  const three = MAIN_KEYS.filter(k => cnt[MAIN_CH[k]] === 3).length;
  for (const k of MAIN_KEYS){ const v = cnt[MAIN_CH[k]] || 0; if (!v) bad.push('no ' + k); if (v > 3 || (v === 3 && n < 13)) bad.push(`${v} ${k}`); }
  if (three > Math.max(0, n - 12)) bad.push(`${three} goods on 3 cities (at most ${Math.max(0, n - 12)})`);
  return bad.join(', '); }

if (MODE === '--preview'){
  for (const e of all){
    const L = pickCities(e.c); console.log(`${e.region.padEnd(12)} ${(DISPLAY[e.c.name] || e.c.name).padEnd(16)} ${e.tier}  ${String(L.length).padStart(2)}  ${L.map(cname).join(', ')}`); }
  process.exit(0); }
if (MODE === '--preview-ids'){   // the same, as province numbers (tab-separated: region, nation, ids): for tools that name promoted cities
  for (const e of all) console.log(`${e.region}\t${DISPLAY[e.c.name] || e.c.name}\t${pickCities(e.c).map(P => P.id).join(',')}`);
  process.exit(0); }

const isOpen = e => OPEN.includes(e.region);
for (const n of hqOf.keys()) if (!all.some(e => e.c.name === n)) throw new Error('HQ lists a nation not in the roster: ' + n);
const live = [...TODAY15.map(n => all.find(e => e.c.name === n)), ...all.filter(e => !TODAY15.includes(e.c.name) && isOpen(e))];
const nations = live.map(e => entry(e, isOpen(e)));
// checks on what is written: capital first, no province twice, cities inside the country, colours apart where nations touch
const fails = [], seen = new Set();
for (const n of nations){ const c = byName.get(n.country), ids = new Set(c.provs.map(P => P.id));
  if (n.cities[0] !== n.capital) fails.push(n.name + ': the capital is not its first city');
  for (const id of n.cities){ if (!ids.has(id)) fails.push(`${n.name}: city ${id} is not its land`); if (seen.has(id)) fails.push(`${n.name}: city ${id} listed twice`); seen.add(id); }
  if (OPEN.includes(n.region) && (n.cities.length < 7 || n.cities.length > 14)) fails.push(`${n.name}: ${n.cities.length} cities (7 to 14 wanted)`);
  // every name given for an open nation names one of its promoted cities (a typo would leave a city under its province's name)
  if (OPEN.includes(n.region)) for (const pn in NAMES[n.country] || {}) if (!n.cities.some(id => G.P[id].name === pn && n.names[id])) fails.push(`${n.name}: no promoted city in province ${pn} to name`);
  // the resource balance rule, for every nation MAINS gives its cities' resources (MAINS_ALL: all open nations must have them)
  if (n.mains){ const why = mainsRule(n.cities.length, n.mains); if (why) fails.push(`${n.name}: resource rule broken: ${why}`); }
  else if (MAINS_ALL && OPEN.includes(n.region)) fails.push(`${n.name}: no city resources in MAINS`); }
for (const k in MAINS) if (!nations.some(n => n.country === k)) fails.push(`MAINS names a nation that is not playable: ${k}`);
// the four nations of the province split (owner's answer 1) must hold 7 cities on the split map whether their region is open or not: at least 9
// provinces (Israel: 8, its one-cell provinces are the finest the map grid allows; tools/build-provsplit.js) and 7 to 14 cities with the method
for (const e of all.filter(e => e.split)){ const L = pickCities(e.c), need = e.c.name === 'Israel' ? 8 : 9;
  if (e.c.n < need) fails.push(`${e.c.name}: ${e.c.n} provinces on the split map (${need} wanted)`);
  if (L.length < 7 || L.length > 14) fails.push(`${e.c.name}: ${L.length} cities on the split map (7 to 14 wanted)`); }
{ const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), dist = (a, b) => Math.hypot(...rgb(a).map((v, i) => v - rgb(b)[i])), ofC = new Map(nations.map(n => [byName.get(n.country).k, n]));
  const pairs = new Set(); for (const P of G.P){ const a = ofC.get(P.country); if (!a || P.sea) continue; for (const v of P.nbs){ const Q = G.P[v];
      const reach = Q.sea ? Q.nbs.filter(w => !G.P[w].sea) : [v];   // by land, or across one sea zone (a strait)
      for (const w of reach){ const b = ofC.get(G.P[w].country); if (b && b !== a && (!Q.sea || G.P[w].nbs.length)) pairs.add([a.name, b.name].sort().join('|')); } } }
  for (const k of pairs){ const [x, y] = k.split('|').map(nm => nations.find(n => n.name === nm)); if (dist(x.color, y.color) < COLOR_MIN) fails.push(`colours too close: ${x.name} ${x.color} and ${y.name} ${y.color}`); } }

const text = '// Generated by tools/build-nations.js (roster and city-choice method of docs/NATIONS-PLAN.md). Do not edit: change the tool and run it again.\n'
  + '// The playable nations of the nations world: tier, region, hq (the style of its capital HQ picture, assets/art-src/ba-hq-<hq>.png), capital and\n'
  + '// cities (province numbers of world.js, capital first), names of promoted\n'
  + '// cities, hand swaps, mains (each city\'s main resource, one letter per city in the order of cities: c money, o oil, m materials, i iron,\n'
  + '// e electronics, r rare materials; the resource balance rule of docs/ECONOMY.md). Every other country on the map is independent land.\n'
  + '// Regions are opened one rollout step at a time (open).\n'
  + '// map: the province split of the nations world (tools/build-provsplit.js; new provinces appended after those of world.js, each with its parent).\n'
  + 'window.NATIONS = {"v":1,"regions":' + JSON.stringify(REGIONS) + ',"open":' + JSON.stringify(OPEN) + ',"nations":[\n' + nations.map(n => JSON.stringify(n)).join(',\n') + '\n],\n"map":' + JSON.stringify(SPLIT) + '};\n';
if (fails.length){ console.log('NATIONS FAILED\n  ' + fails.join('\n  ')); process.exit(1); }
if (MODE === '--check'){ const same = fs.existsSync(OUT) && fs.readFileSync(OUT, 'utf8') === text;
  console.log(same ? `nations.js is up to date: ${nations.length} nations, regions open: ${OPEN.join(', ') || 'none'}` : 'nations.js DIFFERS from what tools/build-nations.js writes: run the tool'); process.exit(same ? 0 : 1); }
fs.writeFileSync(OUT, text);
console.log(`nations.js: ${nations.length} nations (${REGIONS.map(r => r + ' ' + nations.filter(n => n.region === r).length).join(', ')}), ${nations.reduce((s, n) => s + n.cities.length, 0)} cities, regions open: ${OPEN.join(', ') || 'none'}; roster ${all.length} (${all.filter(e => e.split).length} on split provinces: ${SPLIT.provinces.length} new provinces in the map)`);
