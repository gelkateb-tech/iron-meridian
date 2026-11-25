// loader: the rules in memory (as tools/headless.js loads them), optional text patches on that copy, and an overlay appended
// (later declarations win). Read-only: no file of the game is changed.
'use strict';
const fs = require('fs'), path = require('path'), ROOT = process.env.IM_ROOT || path.join(__dirname, '../../..');
globalThis.window = globalThis; require(path.join(ROOT, 'world.js')); require(path.join(ROOT, 'nations.js')); require(path.join(ROOT, 'lines.js'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), FILES = [...html.matchAll(/<script\s[^>]*\bsrc\s*=\s*"(rules\/[^"]+\.js)"/g)].map(m => m[1]);
const RULES0 = FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
module.exports = (overlay = '', expose = '', patches = []) => { let R = RULES0;
  for (const [a, b] of patches){ if (!R.includes(a)) throw new Error('patch not found: ' + a.slice(0, 80)); R = R.replace(a, b); }
  return new Function("'use strict';\n" + R + '\n' + overlay + '\nreturn {IM, get S(){ return S; }, get G(){ return G; }' + (expose ? ', ' + expose : '') + '};')(); };
