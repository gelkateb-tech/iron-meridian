# Building Iron Meridian

One source, two builds:

```
node tools/build.js
```

| Build | Folder | What it has | Use it for |
|---|---|---|---|
| Test | `dist/test/` | the game, developer mode, and the test hooks (`window.__im` on `file://`) | playtesting and the automated tests |
| Public | `dist/public/` | the game only. Every developer and test block is removed at build time. | **publishing** |

Each folder is a complete copy: `index.html` (the page to publish), `play.html` (the same page in a full HTML document, so you can open it locally), `world.js lines.js coast.js coast-hi.js units3d.js`, the rules files `rules/*.js`, and `assets/` (without `assets/art-src`, the source art the game never loads). The assets are hard-linked to the source files where the file system allows, so they take no extra disk space. Do not edit files inside `dist/`, because a hard-linked file is the source file. `dist/` is in `.gitignore`.

**To publish, use `dist/public`:** publish `index.html` as the page, plus these files at the same relative paths. Do not publish `play.html`.

| Files | What they are |
|---|---|
| `world.js` `lines.js` `coast.js` `coast-hi.js` | map data |
| `rules/core.js` `rules/data.js` | the game rules (the list grows as the rules split goes on: publish every `.js` file in `dist/public/rules/`) |
| `units3d.js` | unit models |
| `assets/` | pictures, flags and sounds |

## Rules files

The game rules are moving out of `index.html` into plain scripts in `rules/` (owner task 5). The page loads them with `<script src="rules/x.js">` after the map data and before its own script. A rules file has no DOM, canvas, `window`, `localStorage`, sound or camera code. It reports what happened through `IM.emit(...)` (`rules/core.js`), and the page subscribes with `IM.on(...)` (the `RULES EVENTS` block next to boot in `index.html`).

- The build copies every rules file the page loads to `dist/test/rules/` and `dist/public/rules/`, strips the markers the same way as in `index.html`, and checks them like the page. A `.js` file in `rules/` that the page does not load fails the build.
- `bash tools/mkpage.sh` copies `rules/` to `.test/rules/` for the tests.
- `node tools/split-golden.js 20` plays 20 fixed-seed days and compares one hash of the whole state per day with `tools/golden-12345.txt`. A step of the split must not change it.
- `node tools/split-lint.js --report` lists what the rules files still reach in the UI (it needs the `acorn` parser: `require('acorn')` or `/opt/node-tools`). `node tools/split-plan.js` shows which declaration goes to which file, `node tools/split-move.js <file>` moves them, `node tools/split-names.js` checks that no top-level name hides a browser global, and `node tools/split-perf.js page.html` measures speed.

## Markers

Code that only the test build may contain goes between markers in `index.html`, `units3d.js` and `rules/*.js` (the build strips all of them; the other map scripts have no markers and are copied as they are):

| Kind | JS / CSS | HTML |
|---|---|---|
| Developer mode | `/*@DEV*/ ... /*@ENDDEV*/` | `<!--@DEV--> ... <!--@ENDDEV-->` |
| Test and debug hooks | `/*@TEST*/ ... /*@ENDTEST*/` | `<!--@TEST--> ... <!--@ENDTEST-->` |

- The test build removes only the marker comments and keeps everything between them.
- The public build removes the markers and everything between them. If a marker stands alone on its line, the whole line goes.
- Blocks never nest, and every block opens and closes with the same kind and syntax. The build stops with an error otherwise.
- Fence whole statements, such as `/*@DEV*/if (DEV.reveal) return true;/*@ENDDEV*/`, so the code still parses when a block is removed. Never put a marker inside an expression.
- Developer rule overrides sit next to the rules they change (`devHour` / `devDone` / `devSpawn` next to `tick()`, the reveal override in `visibleSet` / `armyVisible`). They always call the game's own rule functions: `startResearch`, `researchHour`, `consHour`, `prodHour`, `engHour`, `addArmy`. The panel sits with the UI code next to `setSpeed`.
- If you add a dev-only name, add it to `DEV_NAMES` in `tools/build.js` so the public check catches any reference left outside a block.
- Test hooks are `@TEST` blocks too: `window.__im` and its `file://` extensions, the debug collections (`TMDBG`, `PGHOST`, `LAYEV`, `window.__dbgBoxes` with `tagDbg` / `pnDbg` / `labDbg`, the layout timers `PLAY_MS` / `PLAY_N`), the `?bake` page used by `tools/bake-assets.js` (the script that sets `window.__BAKE` and every statement that reads it, in `index.html` and `units3d.js`), and the `?artall` switch (loads every optional art file). A test or debug global is named `window.__<name>`; declare and read it only inside `@TEST` blocks.

## What the build checks

After writing both folders, `tools/build.js` checks the public build and exits non-zero if any check fails:

- no marker text is left;
- none of the developer or test names in `DEV_NAMES` appear (`DEV`, `devPanel`, `devSpawn`, `__im`, `TMDBG`, `__BAKE`, ...), in the page, in any of the five scripts or in any rules file;
- no `window.__<name>` global is read or set anywhere (a generic check, so a new debug switch left outside a block fails the build even before it is added to `DEV_NAMES`);
- every inline `<script>` parses (`vm.Script`), and so do the stripped `units3d.js` and every rules file;
- the public page is smaller than the test page.

It also checks that the test build has no marker text left and that its scripts parse. At the end it prints the sizes and the number of blocks it stripped.

## Developer mode (test build only)

The **DEV** badge sits next to the speed control. Click it, or press `` ` ``, to open the panel:

- **Instant research**: any research you start completes at once. **Research all** gives you every technology for free.
- **Instant building and production**: construction, unit training, missiles and unit upgrades finish at once, even while the game is paused.
- **Unlimited resources**: all seven resources are topped up to 500,000 every game hour. **Fill stocks** tops them up once.
- **Reveal map**: no fog. Every province is in sight and every force is identified, including submerged submarines and special forces.
- **Game speed**: 16×, 50× and 100×. These buttons also appear in the top bar on wide screens. Press `9` to cycle through them.
- **Spawn unit**: pick a unit type, an owner (any living nation; you by default) and a count. Press **Place**, then click provinces on the map. Ground and air units can go on land; ships can go at sea or on a coast. Press Esc to stop placing.

The switches are saved in this browser under the localStorage key `iron-meridian-dev`. When a switch is off, its rule is unchanged.

## Tests

- `bash tools/mkpage.sh` builds `.test/page.html` from `index.html`. The markers are comments, so this page is the test build. All the existing `node .test/<name>.js` tests and `node tools/smoke.js` run on it.
- `node .test/devplay.js` loads `dist/test/play.html`, turns on every developer switch, spawns land, sea and air units for you and for an AI nation, plays at least 5 game days at 50×, and reports the checks and any console errors. It saves screenshots to `.test/dev-*.png`.
- `node .test/public-smoke.js` serves `dist/public` over http and loads it at desktop and phone sizes. It plays a game day at 8× and checks that there is no `window.__im`, no DEV badge or panel, no developer speeds and no console errors.
- Battery saver and redraw scheduling: `node .test/battery.js` prints draws per second and main-thread busy time while idle, running at 1× and panning (desktop and phone, saver off and on), checks that nothing keeps the map redrawing after a zoom out and that a pointer leaving the window clears the hover (`ONLY=stuck` runs just that part), checks the background pause, and logs the images requested at startup (`PAGE=page-before.html` measures an older page the same way). `node .test/rdstale.js on|off` forces a frame whenever the map was left undrawn and fails if it looks different (a change that did not ask for a frame). `node .test/lazyart.js` checks that building pictures load only when shown and keep their size. `node .test/rdwhy.js` lists what kept the map drawing while idle. Tests that compare screenshots of a view they jumped to can wait for `__im.mapBusy()` to turn false (no bands, detail tiles or city bakes left), as `v3r2.js` does. `node .test/anchor-check.js` runs with the Battery saver off (`SAVER=on` to try it on).
