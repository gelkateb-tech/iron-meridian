#!/usr/bin/env node
// Builds the two versions of the game from the same source (no dependencies):
//   dist/test/    the test build: every @DEV and @TEST block kept (developer mode, window.__im test hooks), only the marker comments removed
//   dist/public/  the public build: every @DEV and @TEST block removed. This is the one to publish.
// Each holds index.html (the page to publish), play.html (the same page wrapped in a full document, to open locally), the five map/model
// scripts and assets/.
// Markers (see BUILD.md):  JS / CSS  /*@DEV*/ ... /*@ENDDEV*/   /*@TEST*/ ... /*@ENDTEST*/
//                          HTML      <!--@DEV--> ... <!--@ENDDEV-->   <!--@TEST--> ... <!--@ENDTEST-->
// Then it verifies the public build and exits non-zero on any failure.
// Usage: node tools/build.js [--quiet]
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

const ROOT = path.join(__dirname, '..'), DIST = path.join(ROOT, 'dist');
const SCRIPTS = ['world.js', 'lines.js', 'coast.js', 'coast-hi.js', 'units3d.js'];
const QUIET = process.argv.includes('--quiet');
const SKIP_ASSETS = new Set(['art-src']);   // source art for tools/prep-art.py: never loaded by the game, so left out of both builds
// names that exist only in developer mode or the test hooks: none of them may survive in the public build
const DEV_NAMES = ['DEV', 'DEV_KEY', 'DEV_FILL', 'DEV_SPEEDS', 'DEV_TOG', 'DEVUI', 'devSave', 'devFill', 'devDone', 'devHour', 'devResearchAll', 'devSpawn', 'devSpawnOk',
  'devPanel', 'devPanelHTML', 'devRender', 'devSync', 'devTap', 'devKey', 'devbadge', 'devpanel', 'devsp', 'devpick', 'devb', 'devp', 'iron-meridian-dev', 'sp5', 'sp6', 'sp7',
  '__im', '__glog', '__dbgAll', 'TMDBG.on', 'PGHOST.push', '__BAKE = true', 'Developer mode', '@DEV', '@ENDDEV', '@TEST', '@ENDTEST'];

// a marker token: [kind, isEnd, start, end]
const TOKEN = /\/\*@(END)?(DEV|TEST)\*\/|<!--@(END)?(DEV|TEST)-->/g;
function tokens(src){ const out = []; let m; TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(src))) out.push({kind:m[2] || m[4], end:!!(m[1] || m[3]), html:!!m[4], i:m.index, j:m.index + m[0].length, text:m[0]});
  return out; }
const lineOf = (src, i) => src.slice(0, i).split('\n').length;
// pair the markers: every block opens and closes with the same kind and syntax, and blocks never nest
function blocks(src){ const T = tokens(src), B = [];
  for (let k = 0; k < T.length; k += 2){ const a = T[k], b = T[k + 1];
    if (a.end) throw new Error(`line ${lineOf(src, a.i)}: ${a.text} without an opening marker`);
    if (!b) throw new Error(`line ${lineOf(src, a.i)}: ${a.text} is never closed`);
    if (!b.end) throw new Error(`line ${lineOf(src, b.i)}: ${b.text} opens inside the block opened at line ${lineOf(src, a.i)} (blocks may not nest)`);
    if (a.kind !== b.kind || a.html !== b.html) throw new Error(`line ${lineOf(src, b.i)}: ${b.text} closes ${a.text} (line ${lineOf(src, a.i)})`);
    B.push({kind:a.kind, a, b, lines:lineOf(src, b.j) - lineOf(src, a.i) + 1}); }
  return B; }
// widen a cut to whole lines when the marker stands alone on its line (no blank lines left behind)
function lineSpan(src, i, j){ let s = i, e = j;
  while (s > 0 && (src[s - 1] === ' ' || src[s - 1] === '\t')) s--;
  while (e < src.length && (src[e] === ' ' || src[e] === '\t')) e++;
  if ((s === 0 || src[s - 1] === '\n') && (e === src.length || src[e] === '\n')) return [s, Math.min(src.length, e + 1)];
  return [i, j]; }
// keep(kind) true: drop only the two markers; false: drop the whole block
function strip(src, keep){ const B = blocks(src), cuts = [];
  for (const blk of B){
    if (keep(blk.kind)){ cuts.push(lineSpan(src, blk.a.i, blk.a.j), lineSpan(src, blk.b.i, blk.b.j)); }
    else { const [s] = lineSpan(src, blk.a.i, blk.a.j), [, e] = lineSpan(src, blk.b.i, blk.b.j);
      const whole = (s === 0 || src[s - 1] === '\n') && (e === src.length || src[e - 1] === '\n');
      cuts.push(whole ? [s, e] : [blk.a.i, blk.b.j]); } }
  cuts.sort((x, y) => x[0] - y[0]); let out = '', at = 0;
  for (const [s, e] of cuts){ if (s < at) throw new Error('overlapping cuts'); out += src.slice(at, s); at = e; }
  return {html:out + src.slice(at), B}; }
function inlineScripts(html){ const out = [], re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi; let m;
  while ((m = re.exec(html))) if (!/\bsrc\s*=/.test(m[1] || '')) out.push({code:m[2], line:lineOf(html, m.index)});
  return out; }
function parseErrors(html){ const errs = [];
  for (const s of inlineScripts(html)){ try { new vm.Script(s.code, {filename:'inline-script-line-' + s.line}); } catch (e) { errs.push(`inline <script> at line ${s.line}: ${e.message}`); } }
  return errs; }
// copy a tree: hard links where the file system allows (no extra disk), copies otherwise
function linkTree(from, to, top = true){ let n = 0, bytes = 0; fs.mkdirSync(to, {recursive:true});
  for (const e of fs.readdirSync(from, {withFileTypes:true})){ const a = path.join(from, e.name), b = path.join(to, e.name);
    if (top && SKIP_ASSETS.has(e.name)) continue;
    if (e.isDirectory()){ const r = linkTree(a, b, false); n += r.n; bytes += r.bytes; continue; }
    if (!e.isFile()) continue;
    try { fs.linkSync(a, b); } catch (err) { fs.copyFileSync(a, b); }
    n++; bytes += fs.statSync(b).size; }
  return {n, bytes}; }
function writeBuild(name, html){ const dir = path.join(DIST, name); fs.rmSync(dir, {recursive:true, force:true}); fs.mkdirSync(dir, {recursive:true});
  fs.writeFileSync(path.join(dir, 'index.html'), html);   // the page as published (a fragment: the Artifact host adds the document skeleton)
  fs.writeFileSync(path.join(dir, 'play.html'), SKELETON[0] + html + SKELETON[1]);   // the same page as a whole document, for opening locally (not for publishing)
  for (const f of SCRIPTS){ const a = path.join(ROOT, f); if (fs.existsSync(a)){ try { fs.linkSync(a, path.join(dir, f)); } catch (e) { fs.copyFileSync(a, path.join(dir, f)); } } else throw new Error('missing ' + f); }
  const as = fs.existsSync(path.join(ROOT, 'assets')) ? linkTree(path.join(ROOT, 'assets'), path.join(dir, 'assets')) : {n:0, bytes:0};
  return {dir, assets:as}; }
// the document skeleton the Artifact host adds at publish time (the same one tools/mkpage.sh adds for the tests)
const SKELETON = ['<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>\n', '\n</body></html>\n'];
const kb = n => (n/1024).toFixed(1) + ' KB';
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function main(){
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const test = strip(src, () => true), pub = strip(src, () => false);
  const fails = [];
  // the test build: no markers left, scripts parse
  if (tokens(test.html).length) fails.push('test build: marker text left');
  for (const e of parseErrors(test.html)) fails.push('test build: ' + e);
  // the public build: no markers, no developer or test names, scripts parse, smaller than the test build
  if (tokens(pub.html).length || /@(END)?(DEV|TEST)\b/.test(pub.html)) fails.push('public build: marker text left');
  for (const n of DEV_NAMES){ const re = /^[A-Za-z_$]/.test(n) && /[A-Za-z0-9_$]$/.test(n) ? new RegExp('(^|[^A-Za-z0-9_$-])' + escRe(n) + '(?![A-Za-z0-9_$-])') : new RegExp(escRe(n));
    const m = re.exec(pub.html); if (m) fails.push(`public build: developer/test name "${n}" left (line ${lineOf(pub.html, m.index)})`); }
  for (const e of parseErrors(pub.html)) fails.push('public build: ' + e);
  if (!(pub.html.length < test.html.length)) fails.push('public build is not smaller than the test build');
  const T = writeBuild('test', test.html), P = writeBuild('public', pub.html);
  const n = k => test.B.filter(b => b.kind === k).length, nl = k => test.B.filter(b => b.kind === k).reduce((s, b) => s + b.lines, 0);
  if (!QUIET || fails.length){
    console.log(`Iron Meridian build (${new Date().toISOString().slice(0, 19)}Z)`);
    console.log(`  source     index.html ${kb(Buffer.byteLength(src))}: ${n('DEV')} @DEV blocks (${nl('DEV')} lines), ${n('TEST')} @TEST blocks (${nl('TEST')} lines)`);
    console.log(`  test       ${path.relative(ROOT, T.dir)}/index.html ${kb(Buffer.byteLength(test.html))}  (developer mode + test hooks)`);
    console.log(`  public     ${path.relative(ROOT, P.dir)}/index.html ${kb(Buffer.byteLength(pub.html))}  (${test.B.length} blocks stripped, ${kb(Buffer.byteLength(test.html) - Buffer.byteLength(pub.html))} smaller)`);
    console.log(`  each build + play.html (local run) + ${SCRIPTS.join(' ')} + assets/ without art-src (${T.assets.n} files, ${(T.assets.bytes/1048576).toFixed(1)} MB, hard-linked where possible)`);
    console.log(fails.length ? 'VERIFY FAILED\n  ' + fails.join('\n  ') : `  verify     public build OK: no markers, none of ${DEV_NAMES.length} developer/test names, ${inlineScripts(pub.html).length} inline scripts parse, smaller than test`);
    console.log('  publish    dist/public'); }
  if (fails.length){ fs.rmSync(P.dir, {recursive:true, force:true}); console.log('  dist/public removed: fix the source and build again'); process.exit(1); }   // never leave a failed public build to publish
}
try { main(); } catch (e) { console.error('BUILD FAILED: ' + e.message); process.exit(1); }
