// Iron Meridian: can a person export? One nation is a seat that only keeps a standing sell offer on the Market; the AI plays the others.
//   node tools/export-lab.js                       Australia sells 60 materials at 5% under the world price, 30 days, seeds 12345, 7 and 2024
//   node tools/export-lab.js --nation Russia --res oil --qty 60 --disc 0.95 --days 30
// Prints per seed: units sold and money earned (from the sale dispatches the seat gets), the stock at the end and the day storage was full.
// Exit 1 when a seed sold less than 150 in the 30 days. IM_ROOT=<another checkout> runs an older build.
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.resolve(process.env.IM_ROOT || path.join(__dirname, '..'));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] !== undefined ? (isNaN(+process.argv[i + 1]) ? process.argv[i + 1] : +process.argv[i + 1]) : d; };
const NAME = arg('nation', 'Australia'), RES = arg('res', 'metal'), QTY = arg('qty', 60), DISC = arg('disc', 0.95), DAYS = arg('days', 30);
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const SRC = "'use strict';\n" + FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\nreturn {IM, stockCap};';
let fail = 0;
for (const seed of [12345, 7, 2024]){
  const X = new Function(SRC)(), IM = X.IM, api = IM.api, stockCap = X.stockCap; api.newGame(seed, 0, []);
  const me = api.S.nations.findIndex(N => N.name === NAME); if (me < 0){ console.log('no nation called ' + NAME); process.exit(2); }
  let sold = 0, earned = 0, capDay = 0, posts = 0;
  // every sale is reported to the seat ("X bought 40 materials from your offer for $90M.")
  IM.on('log', (...a) => { for (const e of a){ const t = e && (e.text || (typeof e === 'string' ? e : '')), m = t && /bought (\d+) .* from your offer for \$([\d.,]+)M/.exec(t); if (m){ sold += +m[1]; earned += +m[2].replace(/,/g, ''); break; } } });
  api.newGame(seed, 0, [me]); const S = api.S; S.started = true; const N = S.nations[me];
  for (let h = 0; h < DAYS*24 && !S.over; h++){
    const mine = (S.book || []).find(o => o.seller === me && o.res === RES && o.type !== 'buy');
    if (!mine && N[RES] >= QTY && S.mkt && api.postOffer(me, RES, QTY, +(S.mkt.p[RES]*DISC).toFixed(2), 'sell')) posts++;
    api.tick();
    if (!capDay && N[RES] >= stockCap(me) - 1) capDay = Math.ceil(S.hour/24);
  }
  console.log(`seed ${seed}  ${NAME} sold ${sold} ${RES} in ${DAYS} days for $${Math.round(earned)}M (${posts} listings of ${QTY})  stock ${Math.round(N[RES])} of ${Math.round(stockCap(me))}` + (capDay ? `  storage full on day ${capDay}` : '  storage never full'));
  if (sold < 150) fail++;
}
process.exit(fail ? 1 : 0);
