// Rules split (owner task 5): static check of the rules files against the UI script. No browser needed.
//   node tools/split-lint.js            report; exit 1 if a rules file reaches a UI name or a browser global, or loads in the wrong order
//   node tools/split-lint.js --report   same report, always exit 0 (while the split is in progress)
//   node tools/split-lint.js --names    list every top-level name per file
// What it reads: index.html (the main inline script, wrapped in an IIFE or not) and every <script src="rules/..."> it loads, in order.
// What it checks for each top-level declaration in a rules file:
//   1. it references no name declared in index.html (a "UI leak") and no browser global (document, window, performance, setTimeout, localStorage, Math.random is checked by text);
//   2. its top-level initialiser (code that runs while the file loads, not function bodies) only uses names declared earlier: same file above it, or an earlier file;
//   3. no name is declared in two files.
// A name that is still in index.html but that tools/split-plan.js assigns to a rules file counts as 'waiting', not as a leak.
// Parser: acorn (not a project dependency; found in /opt/node-tools on the build machine, or wherever require('acorn') resolves).
'use strict';
const fs = require('fs'), path = require('path');
let acorn; try { acorn = require('acorn'); } catch (e) { acorn = require('/opt/node-tools/node_modules/acorn'); }
const BROWSER = new Set(['document', 'window', 'performance', 'Path2D', 'setTimeout', 'setInterval', 'localStorage', 'sessionStorage', 'innerWidth', 'innerHeight', 'location', 'U3D', 'THREE', 'requestAnimationFrame', 'ImageData', 'matchMedia', 'DOMMatrix',
  'Date', 'clearTimeout', 'clearInterval', 'ResizeObserver', 'screen', 'getComputedStyle', 'Image', 'Worker', 'Blob', 'URL', 'navigator', 'addEventListener', 'MutationObserver', 'cancelAnimationFrame', 'Event', 'AudioContext', 'OffscreenCanvas', 'fetch', 'alert', 'history']);
const JS_OK = new Set(['Math', 'Object', 'Map', 'Set', 'Array', 'String', 'Number', 'Boolean', 'JSON', 'Infinity', 'NaN', 'undefined', 'isFinite', 'isNaN', 'parseInt', 'parseFloat', 'Float32Array', 'Float64Array', 'Uint8Array', 'Uint8ClampedArray',
  'Uint16Array', 'Uint32Array', 'Int8Array', 'Int16Array', 'Int32Array', 'WeakMap', 'WeakSet', 'Symbol', 'Error', 'TypeError', 'RangeError', 'Promise', 'Proxy', 'Reflect', 'globalThis', 'console', 'BigInt', 'RegExp', 'arguments']);

function patNames(p, out){ if (!p) return; switch (p.type){
  case 'Identifier': out.push(p.name); break;
  case 'ObjectPattern': for (const q of p.properties) patNames(q.type === 'RestElement' ? q.argument : q.value, out); break;
  case 'ArrayPattern': for (const q of p.elements) patNames(q, out); break;
  case 'AssignmentPattern': patNames(p.left, out); break;
  case 'RestElement': patNames(p.argument, out); break; } }
// collect declarations of a block scope (let/const/class/function at this block level) and var hoisting for function scope
function hoistVars(node, out, top = true){ if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)){ for (const n of node) hoistVars(n, out, top); return; }
  if (!node.type) return;
  if (!top && /Function/.test(node.type)){ return; }
  if (node.type === 'VariableDeclaration' && node.kind === 'var') for (const d of node.declarations) patNames(d.id, out);
  for (const k in node){ if (k === 'type' || k === 'loc' || k === 'start' || k === 'end') continue; const v = node[k]; if (v && typeof v === 'object') hoistVars(v, out, false); } }
function blockDecls(stmts, out){ for (const n of stmts){ if (!n) continue;
  if (n.type === 'VariableDeclaration' && n.kind !== 'var') for (const d of n.declarations) patNames(d.id, out);
  else if (n.type === 'FunctionDeclaration' || n.type === 'ClassDeclaration') out.push(n.id.name); } }
// walk collecting free references (and writes)
let EAGER = true; const eagerSet = new Set(); const eagerFns = new WeakSet();
function walk(node, scopes, free, writes){ if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)){ for (const n of node) walk(n, scopes, free, writes); return; }
  const t = node.type; if (!t) return;
  const ref = (name, w) => { for (let i = scopes.length - 1; i >= 0; i--) if (scopes[i].has(name)) return; free.add(name); if (EAGER) eagerSet.add(name); if (w) writes.add(name); };
  switch (t){
    case 'Identifier': ref(node.name); return;
    case 'MemberExpression': walk(node.object, scopes, free, writes); if (node.computed) walk(node.property, scopes, free, writes); return;
    case 'Property': if (node.computed) walk(node.key, scopes, free, writes); walk(node.value, scopes, free, writes); return;
    case 'PropertyDefinition': case 'MethodDefinition': if (node.computed) walk(node.key, scopes, free, writes); walk(node.value, scopes, free, writes); return;
    case 'LabeledStatement': walk(node.body, scopes, free, writes); return;
    case 'BreakStatement': case 'ContinueStatement': return;
    case 'AssignmentExpression': if (node.left.type === 'Identifier') ref(node.left.name, true); else walk(node.left, scopes, free, writes); walk(node.right, scopes, free, writes); return;
    case 'UpdateExpression': if (node.argument.type === 'Identifier') ref(node.argument.name, true); else walk(node.argument, scopes, free, writes); return;
    case 'CallExpression': case 'NewExpression': { if (EAGER){ if (/Function/.test(node.callee.type)) eagerFns.add(node.callee); for (const a of node.arguments) if (/Function/.test(a.type)) eagerFns.add(a); } break; }
    case 'FunctionDeclaration': case 'FunctionExpression': case 'ArrowFunctionExpression': { const was = EAGER; EAGER = was && eagerFns.has(node); try {
      const sc = new Set(); const ps = []; for (const p of node.params) patNames(p, ps); ps.forEach(x => sc.add(x));
      if (t === 'FunctionExpression' && node.id) sc.add(node.id.name);
      if (t !== 'ArrowFunctionExpression') sc.add('arguments');
      const vs = []; hoistVars(node.body, vs); vs.forEach(x => sc.add(x));
      if (node.body.type === 'BlockStatement'){ const bd = []; blockDecls(node.body.body, bd); bd.forEach(x => sc.add(x)); }
      const ns = scopes.concat([sc]);
      for (const p of node.params) walkPat(p, ns, free, writes);
      if (node.body.type === 'BlockStatement') walk(node.body.body, ns, free, writes); else walk(node.body, ns, free, writes);
      } finally { EAGER = was; } return; }
    case 'ClassDeclaration': case 'ClassExpression': walk(node.superClass, scopes, free, writes); walk(node.body, scopes, free, writes); return;
    case 'BlockStatement': case 'StaticBlock': { const sc = new Set(); const bd = []; blockDecls(node.body, bd); bd.forEach(x => sc.add(x)); walk(node.body, scopes.concat([sc]), free, writes); return; }
    case 'SwitchStatement': { walk(node.discriminant, scopes, free, writes); const sc = new Set(); for (const c of node.cases){ const bd = []; blockDecls(c.consequent, bd); bd.forEach(x => sc.add(x)); } const ns = scopes.concat([sc]); for (const c of node.cases){ walk(c.test, ns, free, writes); walk(c.consequent, ns, free, writes); } return; }
    case 'ForStatement': case 'ForInStatement': case 'ForOfStatement': { const sc = new Set(); const init = node.init || node.left;
      if (init && init.type === 'VariableDeclaration' && init.kind !== 'var') for (const d of init.declarations){ const o = []; patNames(d.id, o); o.forEach(x => sc.add(x)); }
      const ns = scopes.concat([sc]);
      if (init && init.type !== 'VariableDeclaration' && (t !== 'ForStatement')){ if (init.type === 'Identifier') ref(init.name, true); else walk(init, ns, free, writes); } else walk(init, ns, free, writes);
      walk(node.test, ns, free, writes); walk(node.update, ns, free, writes); walk(node.right, ns, free, writes); walk(node.body, ns, free, writes); return; }
    case 'CatchClause': { const sc = new Set(); const o = []; patNames(node.param, o); o.forEach(x => sc.add(x)); walk(node.body, scopes.concat([sc]), free, writes); return; }
    case 'VariableDeclaration': for (const d of node.declarations){ walkPat(d.id, scopes, free, writes); walk(d.init, scopes, free, writes); } return;
    case 'TemplateLiteral': walk(node.expressions, scopes, free, writes); return;
    case 'MetaProperty': return;
  }
  for (const k in node){ if (k === 'type' || k === 'loc' || k === 'start' || k === 'end') continue; const v = node[k]; if (v && typeof v === 'object') walk(v, scopes, free, writes); } }
function walkPat(p, scopes, free, writes){ if (!p) return; switch (p.type){
  case 'Identifier': return;
  case 'ObjectPattern': for (const q of p.properties){ if (q.type === 'RestElement') walkPat(q.argument, scopes, free, writes); else { if (q.computed) walk(q.key, scopes, free, writes); walkPat(q.value, scopes, free, writes); } } return;
  case 'ArrayPattern': for (const q of p.elements) walkPat(q, scopes, free, writes); return;
  case 'AssignmentPattern': walkPat(p.left, scopes, free, writes); walk(p.right, scopes, free, writes); return;
  case 'RestElement': walkPat(p.argument, scopes, free, writes); return;
  default: walk(p, scopes, free, writes); } }


function unitsOf(code, file, lineOff){
  const ast = acorn.parse(code, {ecmaVersion: 'latest', locations: true, allowHashBang: true});
  let body = ast.body;
  // the UI script may be wrapped: (() => { ... })();
  const real = body.filter(n => !(n.type === 'ExpressionStatement' && n.directive));
  if (real.length === 1 && real[0].type === 'ExpressionStatement' && real[0].expression.type === 'CallExpression' && /Function/.test(real[0].expression.callee.type) && real[0].expression.callee.body.type === 'BlockStatement') body = real[0].expression.callee.body.body;
  const out = [];
  for (const st of body){ if (st.type === 'ExpressionStatement' && st.directive) continue;
    const names = []; blockDecls([st], names); if (st.type === 'VariableDeclaration' && st.kind === 'var') for (const d of st.declarations) patNames(d.id, names);
    const free = new Set(), writes = new Set(); eagerSet.clear(); EAGER = true;
    walk(st, [new Set()], free, writes); const eager = new Set(eagerSet);
    for (const n of names){ free.delete(n); eager.delete(n); }
    const text = code.slice(st.start, st.end);
    out.push({file, line: st.loc.start.line + lineOff, end: st.loc.end.line + lineOff, names, kind: st.type === 'FunctionDeclaration' ? 'f' : st.type === 'VariableDeclaration' ? st.kind[0] : st.type === 'ClassDeclaration' ? 'k' : 's',
      len: st.end - st.start, head: text.slice(0, 60).replace(/\s+/g, ' '), free: [...free], eagerAll: [...eager], writes: [...writes], random: /Math\.random/.test(text)}); }
  return out; }
function analyse(ROOT){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const files = []; const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi; let m, main = null;
  while ((m = re.exec(html))){ const src = /\bsrc\s*=\s*"([^"]+)"/.exec(m[1] || '');
    if (src){ if (/^rules\//.test(src[1])) files.push(src[1]); }
    else if (!main || m[2].length > main.code.length) main = {code: m[2], off: html.slice(0, m.index + m[0].indexOf('>') + 1).split('\n').length - 1}; }
  const units = [];
  for (const f of files) units.push(...unitsOf(fs.readFileSync(path.join(ROOT, f), 'utf8'), f, 0));
  units.push(...unitsOf(main.code, 'index.html', main.off));
  const decl = new Map(), dups = [];
  units.forEach((u, i) => u.names.forEach(n => { if (decl.has(n)) dups.push(`${n}: ${units[decl.get(n)].file} and ${u.file}`); else decl.set(n, i); }));
  for (const u of units){ u.deps = u.free.filter(n => decl.has(n)); u.eager = u.eagerAll.filter(n => decl.has(n)); u.globals = u.free.filter(n => !decl.has(n)); }
  return {files, units, decl, dups, BROWSER, JS_OK}; }
module.exports = { analyse };
if (require.main === module){
  const ROOT = process.env.IM_ROOT || path.join(__dirname, '..'), A = analyse(ROOT), {units, decl, files} = A, order = f => f === 'index.html' ? 1e9 : files.indexOf(f);
  if (process.argv.includes('--names')){ for (const f of files.concat('index.html')) console.log(f + ': ' + units.filter(u => u.file === f).flatMap(u => u.names).join(' ')); process.exit(0); }
  let homeOf = () => 'ui'; try { homeOf = require('./split-plan.js').homeOf; } catch (e) {}   // names still in index.html but planned for a rules file are 'pending', not leaks
  const leaks = [], pend = [], brow = [], ord = [], unk = [], rnd = [];
  units.forEach((u, i) => { if (u.file === 'index.html') return; const nm = u.names[0] || u.head.slice(0, 30);
    for (const d of u.deps){ const v = units[decl.get(d)]; if (v.file === 'index.html') (homeOf(v) === 'ui' ? leaks : pend).push([d, nm, u.file, u.line]); }
    for (const g of u.globals){ if (BROWSER.has(g)) brow.push([g, nm, u.file, u.line]); else if (!JS_OK.has(g)) unk.push([g, nm, u.file, u.line]); }
    if (u.random) rnd.push([nm, u.file, u.line]);
    for (const d of u.eager){ const j = decl.get(d), v = units[j]; if (order(v.file) > order(u.file) || (v.file === u.file && j > i && v.kind !== 'f')) ord.push(`${u.file}:${u.line} ${nm} needs ${d} (${v.file}:${v.line}) while loading`); } });
  const group = L => { const g = new Map(); for (const [k, nm, f] of L) (g.get(k) || g.set(k, new Set()).get(k)).add(f.replace(/^rules\/|\.js$/g, '') + ':' + nm); return [...g].sort((a, b) => b[1].size - a[1].size).map(([k, v]) => `  ${k} <= ${[...v].join(' ')}`).join('\n'); };
  const nR = units.filter(u => u.file !== 'index.html').length;
  console.log(`rules files: ${files.join(' ') || 'none'}  (${nR} top-level declarations; index.html has ${units.length - nR})`);
  console.log(`UI names reached from rules files: ${new Set(leaks.map(l => l[0])).size}` + (leaks.length ? '\n' + group(leaks) : ''));
  console.log(`rules names still waiting in index.html (planned for a later step, fine until then): ${new Set(pend.map(l => l[0])).size}`);
  console.log(`browser globals in rules files: ${new Set(brow.map(l => l[0])).size}` + (brow.length ? '\n' + group(brow) : ''));
  console.log(`unknown globals in rules files: ${new Set(unk.map(l => l[0])).size}` + (unk.length ? '\n' + group(unk) : ''));
  console.log(`Math.random in rules files: ${rnd.length}` + (rnd.length ? '  ' + rnd.map(r => r[1].replace(/^rules\/|\.js$/g, '') + ':' + r[0]).join(' ') : ''));
  // the rules name no seat and ask the client nothing: no PLAYER constant, no IM.hook, no IM.cfg (checked by text, code and comments alike)
  const seatTxt = []; for (const f of files){ const n = (fs.readFileSync(path.join(ROOT, f), 'utf8').match(/\bPLAYER\b|\bIM\.(hook|cfg)\b/g) || []).length; if (n) seatTxt.push(`${f} (${n})`); }
  console.log(`PLAYER, IM.hook or IM.cfg in rules files: ${seatTxt.length}` + (seatTxt.length ? '  ' + seatTxt.join(' ') : ''));
  console.log(`load-order problems: ${ord.length}` + (ord.length ? '\n  ' + ord.join('\n  ') : ''));
  console.log(`names declared twice: ${A.dups.length}` + (A.dups.length ? '\n  ' + A.dups.join('\n  ') : ''));
  const bad = leaks.length + brow.length + unk.length + rnd.length + seatTxt.length + ord.length + A.dups.length;
  console.log(bad ? 'LINT: not clean yet' : 'LINT OK: the rules files stand on their own');
  process.exit(bad && !process.argv.includes('--report') ? 1 : 0);
}
