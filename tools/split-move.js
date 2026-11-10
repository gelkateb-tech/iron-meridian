// Rules split (owner task 5): the mechanical mover. Cuts every top-level declaration that tools/split-plan.js assigns to rules/<file>.js out of
// index.html (whole lines, with the comment lines directly above each) and appends them, in their original order, to rules/<file>.js; adds the
// <script src="rules/<file>.js"> tag before the game script (in the plan's load order) if it is missing. Nothing is rewritten: text moves verbatim.
//   node tools/split-move.js <file> [--dry] [--only name,name] [--skip name,name]
// A declaration that shares a line with one that stays behind is reported as MANUAL and left in place. Run tools/mkpage.sh and the checks after.
// IM_ROOT=<dir> works on another checkout (used to rehearse the plan on a scratch copy).
'use strict';
const fs = require('fs'), path = require('path');
const { analyse } = require('./split-lint.js'), { ORDER, homeOf } = require('./split-plan.js');
const ROOT = process.env.IM_ROOT || path.join(__dirname, '..');
const args = process.argv.slice(2), file = args.find(a => !a.startsWith('--')), dry = args.includes('--dry');
const opt = k => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? new Set(args[i + 1].split(',')) : null; }, only = opt('--only'), skip = opt('--skip');
if (!ORDER.includes(file)){ console.error('usage: node tools/split-move.js <' + ORDER.join('|') + '> [--dry] [--only a,b] [--skip a,b]'); process.exit(2); }
const A = analyse(ROOT), U = A.units.filter(u => u.file === 'index.html');
const htmlPath = path.join(ROOT, 'index.html'), L = fs.readFileSync(htmlPath, 'utf8').split('\n');   // L[i] is line i + 1
const want = u => homeOf(u) === file && (!only || u.names.some(n => only.has(n))) && !(skip && u.names.some(n => skip.has(n)));
const isEndMarker = s => /^\s*\/\*@END(DEV|TEST)\*\/\s*$/.test(s), blank = s => /^\s*$/.test(s);
// line ownership: each unit owns its own lines, the END marker lines right after it, and the non-blank comment run right above it
const spans = U.map((u, i) => { let a = u.line, b = u.end; const prevEnd = i ? U[i - 1].end : 0, nextStart = i + 1 < U.length ? U[i + 1].line : L.length + 1;
  while (b + 1 < nextStart && isEndMarker(L[b])) b++;                       // L[b] is line b + 1
  while (a - 1 > prevEnd && !blank(L[a - 2]) && !isEndMarker(L[a - 2])) a--;   // comment / marker lines above (L[a - 2] is line a - 1)
  return [a, b]; });
const take = new Set(), manual = [], moved = [];
U.forEach((u, i) => { if (!want(u)) return; const [a, b] = spans[i];
  const clash = U.some((v, j) => j !== i && !want(v) && v.line <= u.end && v.end >= u.line);   // shares a line with a unit that stays
  if (clash){ manual.push(`${u.line}: ${u.names.join(',') || u.head}`); return; }
  for (let k = a; k <= b; k++) take.add(k); moved.push(u); });
if (!moved.length){ console.log('nothing to move for ' + file + (manual.length ? '; MANUAL: ' + manual.join(' | ') : '')); process.exit(0); }
const out = [], rest = []; for (let k = 1; k <= L.length; k++) (take.has(k) ? out : rest).push(L[k - 1]);
console.log(`${file}: ${moved.length} declarations, ${out.length} lines` + (manual.length ? `\nMANUAL (share a line with code that stays): ${manual.join(' | ')}` : ''));
if (dry){ console.log(moved.map(u => u.line + ':' + (u.names[0] || 'stmt')).join(' ')); process.exit(0); }
const dir = path.join(ROOT, 'rules'), fp = path.join(dir, file + '.js'); fs.mkdirSync(dir, {recursive:true});
const head = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8').replace(/\n*$/, '\n') : `// Iron Meridian rules: ${file}. No DOM, canvas, window, storage, audio or camera in this file (node tools/rules-lint.js checks it).\n'use strict';\n`;
fs.writeFileSync(fp, head + out.join('\n') + '\n');
let html = rest.join('\n'); const tag = `<script src="rules/${file}.js"></script>`;
if (!html.includes(tag)){ const later = ORDER.slice(ORDER.indexOf(file) + 1).map(f => `<script src="rules/${f}.js"></script>`).find(t => html.includes(t));
  if (later) html = html.replace(later, tag + '\n' + later);
  else { const m = /<script>\n(\(\(\) => \{\n)?'use strict';/.exec(html); if (!m) throw new Error('game script not found'); html = html.slice(0, m.index) + tag + '\n' + html.slice(m.index); } }
fs.writeFileSync(htmlPath, html);
console.log('wrote ' + path.relative(ROOT, fp) + ' and index.html');
