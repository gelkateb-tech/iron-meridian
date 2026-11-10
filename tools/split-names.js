// Rules split (owner task 5): which top-level names of the game script and the rules files already exist on a blank browser window (a
// declaration would override them now that the scripts share one scope), and which equal an element id (harmless: a declaration wins).
//   node tools/split-names.js
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), ROOT = process.env.IM_ROOT || path.join(__dirname, '..');
const { analyse } = require('./split-lint.js');
(async () => { const names = [...new Set(analyse(ROOT).units.flatMap(u => u.names))];
  const b = await chromium.launch(); const p = await b.newPage(); await p.goto('about:blank');
  const hit = await p.evaluate(ns => ns.filter(s => s in window), names); console.log(names.length + ' top-level names; on window already:', hit.join(' ') || 'none');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'); const ids = new Set([...html.matchAll(/\bid="([A-Za-z_$][\w$]*)"/g)].map(m => m[1]));
  console.log('same as an element id:', names.filter(s => ids.has(s)).join(' ') || 'none'); await b.close(); process.exit(hit.length ? 1 : 0); })();
