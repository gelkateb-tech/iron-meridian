// per-day detail of the point-11 runs: trade income, what the taken cities give, the attacker's gross value and administration factor
const fs = require('fs'); const F = process.argv.slice(2), DAYS = [1, 3, 7, 14, 21, 30];
for (const f of F){ const o = JSON.parse(fs.readFileSync(f, 'utf8')), R = o.rows, at = d => R.find(r => r.d === d) || {};
  const sum = k => R.reduce((s, r) => s + (r[k] || 0), 0);
  console.log(f);
  console.log('  day        ' + DAYS.map(d => String(d).padStart(7)).join(''));
  for (const [k, lb] of [['trade', 'trade $M'], ['tradeVal', 'trade val'], ['occVal', 'cities val'], ['occCash', 'cities $M'], ['grossVal', 'gross val'], ['netVal', 'net val'], ['eff', 'admin eff']]) console.log('  ' + lb.padEnd(11) + DAYS.map(d => String(at(d)[k] ?? '').padStart(7)).join(''));
  console.log('  sums 1-30: trade val ' + sum('tradeVal').toFixed(0) + ', cities val ' + sum('occVal').toFixed(0) + ', gross val ' + sum('grossVal').toFixed(0) + ', net val ' + sum('netVal').toFixed(0) + ', cash d30 ' + at(30).cash + ', morale d30 ' + (at(30).mor || []).join('/') + ' ' + (at(30).st || []).join('/')); }
