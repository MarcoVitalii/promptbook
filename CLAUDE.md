# Promptbook

A prompt book for theatre in one self-contained HTML file. Plain JavaScript, no runtime dependencies, no bundler. Target: Chrome or Edge on a pen-and-touch laptop.

## Rules that are easy to break

- **Never edit `promptbook.html`.** It is the built release (330 KB, base64 fonts). Edit `src/`, then run `python3 build.py`. Never Read or grep it either: search `src/`.
- **Tests run against `promptbook.html`, not `src/`.** A test result is meaningless until the build has run after the last `src/` change.
- **No libraries, no npm runtime packages, no network.** The zip reader/writer, IndexedDB wrapper and CSV export are hand-written on purpose.
- `build.py` asserts that the JS contains no `</script`. Split such strings.
- The three JS files are concatenated into one `<script>` in the order `core.js`, `view.js`, `io.js`. They share one scope: no modules, no imports, `'use strict'` once at the top of `core.js`.
- User-facing text goes in `STR` at the top of `core.js` (English and Italian) and is read with `t('key')`. Add both languages.
- A show written by an older release must still open. State any exception under "Compatibility" in `CHANGELOG.md`.

## Where things are

| File | Lines | Content |
|---|---|---|
| `src/core.js` | ~1190 | `STR` strings, helpers (`h`, `sv`), constants (`PAPERS`, `GEO`, `VERSION`), state `S`, **parse** (`parseMeta`, `classify`, `parseScript`, `analyze`, `tokenize`, `reparse`, `pairCues`), text edits (`serialize`, `textWith`, `textInsertAfter`, `cutToken`), ink bookkeeping (`attachInk`, `inkFile`), undo history (`undo`, `redo`, `commitText`), compare (`lcs`, `diffBlocks`, `diffFor`), locked page numbers (`makeLock`, `lockPlan`), **layout** (`buildRow`, `measure`, `paginate`) |
| `src/view.js` | ~1440 | Page rendering, ink drawing, facing page and boards, board templates, navigation and find, pointer handling (pen, touch, palm), popovers (`openPin`, `openCueEdit`), block editor (`editGroup`), cue list and review (`collectCues`, `reviewData`, `renderDrawer`), CSV, print |
| `src/io.js` | ~1000 | Folder store (File System Access), zip (`buildZip`, `readZip`), save loop (`saveNow`), draft and IndexedDB, open and import, git history (`gPut`, `gSave`, `gCheckout`, `histSave`, `openHistory`, `openDiff`), dialogs, settings, `bindUI`, keyboard shortcuts (`KEYS`, `KEYMAP`, `openKeys`), `SAMPLE`, `init`, and the `window.PB` export on the last line |
| `src/style.css` | ~310 | All styles, including print |
| `src/index.html` | ~75 | Shell with the `/*FONTS*/`, `/*CSS*/`, `/*JS*/` placeholders |
| `build.py` | 18 | Joins `src/` and `fonts/` into `promptbook.html` |
| `test/` | | Playwright checks, one plain Node script per area. `_util.js` holds `open()`, `ok()`, `serve()` and the pen helper. `run.js` is the runner |
| `test/unit/` | | Checks that need no browser |
| `scripts/` | | `check.sh` (build and test, skips when unchanged), `hooks/` (Claude Code), `githooks/pre-commit` |

Sections inside the JS files are marked `/* ---------- name ---------- */`. Grep for a function name rather than reading a whole file.

`window.PB` is the only surface the tests use. A function a test needs must be added to that export in `src/io.js`.

## Documents

Read only the part that is needed; do not load these whole. Each capability file has the same three parts: Intent (the request, in the client's words), Requirements (one ID each, with the test files that check it), Consequences (design, limits, compatibility, not built, not verified).

- `SPEC.md`: entry point. How the specification is organised, goals G1 to G6, constraints C1 to C11, assumptions, open questions, table of releases.
- `docs/specs/`: one file per capability. `01-script-text.md` (TXT), `02-cues.md` (CUE), `03-ink.md` (INK), `04-boards.md` (BRD), `05-input.md` (INP), `06-pages-print.md` (PAG, page layout locked), `07-storage.md` (STO, data shapes in §2.3, compatibility in §2.4), `08-history.md` (HIS), `09-workbench.md` (UI).
- `docs/decisions.md`: decisions D1 to D19 and conflicts K1 to K10, with what follows from each.
- `docs/architecture.md`: C4 diagrams (context, containers, components) and the component table that maps to sections of `src/`.
- `docs/verification.md`: check record per release, test file to requirement mapping, what was never verified.
- `docs/review-2026-10-09.md`: known defects (X), refactor opportunities (F), technical debt (T).
- `CHANGELOG.md`: one entry per release, written for the user.
- `PLAN.md`: next actions, backlog, risks.
- `docs/background/syntax-comparison.md`: background on the script syntax choice. Rarely needed.

A change in behaviour starts in the capability file: quote the request under Intent, add or change the requirement rows (never renumber an ID), write the consequences. Then the code.

## Build and tests: hooks do it

Do not run the build or the tests by hand as a routine, and do not explore how to run them. Hooks in `.claude/settings.json` do it and stay silent when green:

- After every Edit or Write under `src/`, `fonts/`, `test/unit/` or to `build.py`: build, syntax check, `test/unit` (no browser, under a second). A failure comes back as a few lines.
- At the end of a turn: every check, browser included (about 25 s), only if a source or test changed since the last green run. A failure comes back once.
- Read, Edit and Write on `promptbook.html` are refused.

No hook output means the build is current and the checks pass. To run something on purpose:

```sh
sh scripts/check.sh fast            # build + syntax + test/unit
sh scripts/check.sh full            # + browser checks; add --force to run when nothing changed
node test/run.js test/x.test.js     # one file: failures only, then one line of totals
node test/x.test.js                 # one file, every PASS and FAIL line (after a build)
```

- `test/*.test.js`: Playwright. Each launches Chromium, loads `promptbook.html` from `file://` and usually starts a show with `PB.startMemory(text)`. Screenshots and PDFs go to `$OUT` (default `.cache/out`).
- `test/unit/*.test.js`: plain Node. `_core.js` loads `src/core.js` in a `vm` with `document` and the view functions stubbed, so parse, cue pairing, text edits and undo are checked without a browser. Put a check here whenever it needs no layout, pointer or storage.
- `test/KNOWN_FAILING`: files that fail for a recorded reason. They run and are named in the totals but do not fail the run. Do not add to it to get past a failure you caused.
- Node comes from fnm (`.node-version`); `scripts/env.sh` puts it on `PATH` for hooks. Playwright is pinned in `package.json`; nothing in it ships in the tool.

## Test conventions

- A check is `ok(condition, 'sentence stating the behaviour')`. No framework.
- Read state through `page.evaluate(() => PB.…)`; act through real clicks, keys and the `pen()` helper.
- A page error or a console error counts as a failure.
- New behaviour gets checks in the test file for its area, or a new `test/<area>.test.js`; in `test/unit/` when no browser is needed.

## Release

1. Change `src/`, set `VERSION` in `src/core.js`.
2. `npm test`: builds and runs every check; all pass.
3. Add the entry to `CHANGELOG.md`. Update the capability file in `docs/specs/`, the release table in `SPEC.md` §6 and the record in `docs/verification.md` §3.
4. Commit `src/` and `promptbook.html` together, tag `rX.Y`.
