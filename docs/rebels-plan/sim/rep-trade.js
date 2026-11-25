// summary of the point-11 runs: cumulative 30-day sums for the attacker
const fs = require('fs'); const F = process.argv.slice(2);
const sum = (rows, k, d0 = 1, d1 = 99) => rows.filter(r => r.d >= d0 && r.d <= d1).reduce((s, r) => s + r[k], 0);
for (const f of F){ const o = JSON.parse(fs.readFileSync(f, 'utf8')), R = o.rows;
  const at = d => R.find(r => r.d === d) || {};
  console.log(f.padEnd(24), 'routes d1/d3/d10/d30', [1, 3, 10, 30].map(d => at(d).routes).join('/'), '| trade$ d1/d3/d10/d30', [1, 3, 10, 30].map(d => at(d).trade).join('/'),
    '| tradeVal d1..30', sum(R, 'tradeVal').toFixed(0), '| occVal d1..30', sum(R, 'occVal').toFixed(0), '| occCash', sum(R, 'occCash').toFixed(0), '| occMp', sum(R, 'occMp').toFixed(0),
    '| grossVal', sum(R, 'grossVal').toFixed(0), '| netVal', sum(R, 'netVal').toFixed(0), '| cash d30', at(30).cash, '| mor d10/d30', (at(10).mor || []).join('/'), (at(30).mor || []).join('/'), (at(30).st || []).join('/'), '| shock days', sum(R, 'shock'));
  if (process.env.V) console.log(o.note); }
