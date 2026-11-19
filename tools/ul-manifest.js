// The unit look atlas table (see tools/ulatlas.py): assets/art-src/ul-atlas/<unit>.json says where every picture of a unit sits in its atlas files
// (assets/art/ula-<unit>-pic.webp and ula-<unit>-scene.webp). This reads those tables and gives the page's UL_MAN text (JSON, no spaces), leaving out a unit's atlas
// whose file is not in assets/art, so the page never asks for a file that is not there. tools/build.js uses it; `node tools/ul-manifest.js <page.html>` writes the table into a page
// in place of the '/*ul-atlas*/' placeholder (tools/mkpage.sh).
const fs = require('fs'), path = require('path');
function manifest(root){
  const dir = path.join(root, 'assets', 'art-src', 'ul-atlas'), art = path.join(root, 'assets', 'art'), out = {};
  if (!fs.existsSync(dir)) return '{}';
  for (const f of fs.readdirSync(dir).filter(f => /^[a-z0-9]+\.json$/.test(f)).sort()){
    const u = f.slice(0, -5), M = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')), O = {};
    for (const k of ['pic', 'scene']) if (M[k] && fs.existsSync(path.join(art, `ula-${u}-${k}.webp`))) O[k] = M[k];
    if (Object.keys(O).length) out[u] = O; }
  return JSON.stringify(out); }
const inject = (src, root) => src.replace("'/*ul-atlas*/'", () => `'${manifest(root)}'`);
module.exports = {manifest, inject};
if (require.main === module){ const f = process.argv[2], root = path.join(__dirname, '..'); fs.writeFileSync(f, inject(fs.readFileSync(f, 'utf8'), root)); }
