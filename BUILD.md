# Building Iron Meridian

One source, two builds:

```
node tools/build.js
```

| Build | Folder | What it has | Use it for |
|---|---|---|---|
| Test | `dist/test/` | the game, developer mode, and the test hooks (`window.__im` on `file://`) | playtesting and the automated tests |
| Public | `dist/public/` | the game only. Every developer and test block is removed at build time. | **publishing** |

Each folder is a complete copy: `index.html` (the page to publish), `play.html` (the same page in a full HTML document, so you can open it locally), `world.js lines.js coast.js coast-hi.js units3d.js`, and `assets/` (without `assets/art-src`, the source art the game never loads). The assets are hard-linked to the source files where the file system allows, so they take no extra disk space. Do not edit files inside `dist/`, because a hard-linked file is the source file. `dist/` is in `.gitignore`.

**To publish, use `dist/public`:** publish `index.html` as the page, plus the five scripts and `assets/` at the same relative paths. Do not publish `play.html`.

## Markers

Code that only the test build may contain goes between markers in `index.html` and `units3d.js` (the build strips both; the other map scripts have no markers and are copied as they are):

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
- none of the developer or test names in `DEV_NAMES` appear (`DEV`, `devPanel`, `devSpawn`, `__im`, `TMDBG`, `__BAKE`, ...), in the page or in any of the five scripts;
- no `window.__<name>` global is read or set anywhere (a generic check, so a new debug switch left outside a block fails the build even before it is added to `DEV_NAMES`);
- every inline `<script>` parses (`vm.Script`), and so does the stripped `units3d.js`;
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
