// Builds the national flag atlas assets/art/flags.webp (+ assets/art/flags.json) from the flag-icons SVGs (MIT, github.com/lipis/flag-icons).
// usage: node tools/build-flags.js <dir with downloaded <iso2>.svg from flag-icons/flags/4x3> <work dir for the PNG renders>
//   then: python3 -I tools/pack-flags.py <work dir> assets/art
// Every country in world.js (Natural Earth names) is mapped to its ISO 3166-1 alpha-2 code below; Somaliland has no code, so its real
// flag (green-white-red with the white Shahada on green and a black star on white) is drawn here as SVG.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ISO = {"Zimbabwe":"zw","Zambia":"zm","Yemen":"ye","W. Sahara":"eh","Vietnam":"vn","Venezuela":"ve","Vanuatu":"vu","Uzbekistan":"uz","Uruguay":"uy",
  "United States of America":"us","United States Virgin Islands":"vi","United States Minor Outlying Islands":"um","United Kingdom":"gb","United Arab Emirates":"ae",
  "Ukraine":"ua","Uganda":"ug","Turks and Caicos Islands":"tc","Turkmenistan":"tm","Turkey":"tr","Tunisia":"tn","Trinidad and Tobago":"tt","Tonga":"to","Togo":"tg",
  "Timor-Leste":"tl","Thailand":"th","Tanzania":"tz","Tajikistan":"tj","Taiwan":"tw","Syria":"sy","Switzerland":"ch","Sweden":"se","Suriname":"sr","Sudan":"sd",
  "Sri Lanka":"lk","Spain":"es","South Korea":"kr","South Georgia and the Islands":"gs","South Africa":"za","Somaliland":"SOMALILAND","Somalia":"so",
  "Solomon Islands":"sb","Slovenia":"si","Slovakia":"sk","Sierra Leone":"sl","Seychelles":"sc","Serbia":"rs","Senegal":"sn","Saudi Arabia":"sa","Samoa":"ws",
  "Saint Lucia":"lc","Saint Helena":"sh-hl","S. Sudan":"ss","Rwanda":"rw","Russia":"ru","Romania":"ro","Qatar":"qa","Portugal":"pt","Poland":"pl","Philippines":"ph",
  "Peru":"pe","Paraguay":"py","Papua New Guinea":"pg","Panama":"pa","Palestine":"ps","Palau":"pw","Pakistan":"pk","Oman":"om","Norway":"no",
  "Northern Mariana Islands":"mp","North Korea":"kp","Nigeria":"ng","Niger":"ne","Nicaragua":"ni","New Zealand":"nz","New Caledonia":"nc","Netherlands":"nl",
  "Nepal":"np","Namibia":"na","Myanmar":"mm","Mozambique":"mz","Morocco":"ma","Montenegro":"me","Mongolia":"mn","Moldova":"md","Mexico":"mx","Mauritius":"mu",
  "Mauritania":"mr","Mali":"ml","Maldives":"mv","Malaysia":"my","Malawi":"mw","Madagascar":"mg","Macedonia":"mk","Lithuania":"lt","Libya":"ly","Liberia":"lr",
  "Lesotho":"ls","Lebanon":"lb","Latvia":"lv","Laos":"la","Kyrgyzstan":"kg","Kuwait":"kw","Kosovo":"xk","Kenya":"ke","Kazakhstan":"kz","Jordan":"jo","Japan":"jp",
  "Jamaica":"jm","Italy":"it","Israel":"il","Ireland":"ie","Iraq":"iq","Iran":"ir","Indonesia":"id","India":"in","Iceland":"is","Hungary":"hu","Honduras":"hn",
  "Haiti":"ht","Guyana":"gy","Guinea-Bissau":"gw","Guinea":"gn","Guatemala":"gt","Greenland":"gl","Greece":"gr","Ghana":"gh","Germany":"de","Georgia":"ge",
  "Gambia":"gm","Gabon":"ga","French Polynesia":"pf","France":"fr","Fr. S. Antarctic Lands":"tf","Finland":"fi","Fiji":"fj","Federated States of Micronesia":"fm",
  "Falkland Islands":"fk","Ethiopia":"et","Eswatini":"sz","Estonia":"ee","Eritrea":"er","Eq. Guinea":"gq","El Salvador":"sv","Egypt":"eg","Ecuador":"ec",
  "Dominican Rep.":"do","Djibouti":"dj","Denmark":"dk","Dem. Rep. Congo":"cd","Côte d'Ivoire":"ci","Czechia":"cz","Cyprus":"cy","Cuba":"cu","Croatia":"hr",
  "Costa Rica":"cr","Cook Islands":"ck","Congo":"cg","Comoros":"km","Colombia":"co","China":"cn","Chile":"cl","Chad":"td","Central African Rep.":"cf",
  "Cape Verde":"cv","Canada":"ca","Cameroon":"cm","Cambodia":"kh","Burundi":"bi","Burkina Faso":"bf","Bulgaria":"bg","Brazil":"br","Botswana":"bw",
  "Bosnia and Herz.":"ba","Bolivia":"bo","Bhutan":"bt","Benin":"bj","Belize":"bz","Belgium":"be","Belarus":"by","Bangladesh":"bd","Bahamas":"bs",
  "Azerbaijan":"az","Austria":"at","Australia":"au","Armenia":"am","Argentina":"ar","Antigua and Barbuda":"ag","Angola":"ao","American Samoa":"as",
  "Algeria":"dz","Albania":"al","Afghanistan":"af"};
const SOMALILAND = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480">
  <path fill="#009a44" d="M0 0h640v160H0z"/><path fill="#fff" d="M0 160h640v160H0z"/><path fill="#d21034" d="M0 320h640v160H0z"/>
  <text x="320" y="104" fill="#fff" font-family="DejaVu Sans, FreeSerif, sans-serif" font-size="44" font-weight="bold" text-anchor="middle" textLength="500" lengthAdjust="spacingAndGlyphs" direction="rtl">لا إله إلا الله محمد رسول الله</text>
  <path fill="#000" transform="translate(320 246)" d="M0-64 14.37-19.78 60.87-19.78 23.25 7.55 37.62 51.78 0 24.45-37.62 51.78-23.25 7.55-60.87-19.78-14.37-19.78z"/></svg>`;
const SRC = process.argv[2], OUT = process.argv[3], RW = 384, RH = 288;   // rendered at 4x the 96x72 cell, downscaled with Lanczos by pack-flags.py
global.window = {}; eval(fs.readFileSync(path.join(__dirname, '..', 'world.js'), 'utf8'));
const names = window.WORLD.countries.slice().sort((a, b) => a.localeCompare(b, 'en'));
const miss = names.filter(n => !ISO[n]); if (miss.length) throw new Error('no ISO code for ' + miss.join(', '));
fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch(); const p = await b.newPage(); await p.setContent('<canvas id=c></canvas>');
  for (const [i, n] of names.entries()){ const code = ISO[n], svg = code === 'SOMALILAND' ? SOMALILAND : fs.readFileSync(path.join(SRC, code + '.svg'), 'utf8');
    const png = await p.evaluate(async ([svg, w, h]) => { const im = new Image(); im.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))); await im.decode();
      const c = document.getElementById('c'); c.width = w; c.height = h; const g = c.getContext('2d'); g.clearRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h); return c.toDataURL('image/png'); }, [svg, RW, RH]);
    fs.writeFileSync(path.join(OUT, String(i).padStart(3, '0') + '.png'), Buffer.from(png.split(',')[1], 'base64')); }
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(names.map(n => ({name:n, iso:ISO[n] === 'SOMALILAND' ? null : ISO[n]}))));
  await b.close(); console.log(names.length + ' flags rendered'); })();
