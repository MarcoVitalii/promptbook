# r1.6 — fixes from the first rehearsals

Four pain points from the first rehearsals, one task file each, plus a release task. In the rehearsal notes "block" means a blocking board (SPEC §5.10 uses the same reading) and "cue" means a cue token such as `{LX 12 | text}` shown as a tag in the margin.

| # | Task file | Pain point | Size | Risk |
|---|---|---|---|---|
| 1 | `01-facing-grid.md` | Several boards on a facing page form one narrow column | Small | Low |
| 2 | `02-board-names.md` | Board names vanish behind the buttons | Small | Low |
| 3 | `03-board-grid.md` | A light grey fine grid on boards | Small | Low |
| 4 | `04-drag-cues.md` | Moving a cue means cutting and pasting its token | Medium | Medium to high |
| 5 | `05-release.md` | Version, changelog, spec, plan | Small | Low |

## Code impact

| # | `src/core.js` | `src/view.js` | `src/io.js` | `src/style.css` | Tests | Saved data |
|---|---|---|---|---|---|---|
| 1 | `MAX_BOARDS`, `facingLayout()`, 2 strings (about 20 lines) | `renderFacing` rewritten, limit check in 3 callers (about 30 lines) | limit check in the paste handler (2 lines) | `.fgrid` (3 lines) | new `test/boards.test.js`, new unit checks | none |
| 2 | 1 string, `FIG_EXTRA` value | `boardFig` restructured, `boardAction` split, "⋯" popover (about 40 lines) | none | caption and name styles (about 8 lines) | `test/boards.test.js`; selector fix in `templates.test.js` and `interact.test.js` | none |
| 3 | `boardGrid` in the configuration, 4 strings (about 8 lines) | grid layer in `fillBoard` (about 12 lines) | one select in Settings (about 6 lines) | `.bgrid` (3 lines) | `test/boards.test.js`, unit check for `normCfg` | `config.json` gains `boardGrid` |
| 4 | `textMoveCue()`, 2 strings (about 20 lines) | pointer state machine gains a `drag` state, ghost tag, drop target, edge scroll (about 100 lines) | Escape cancels a drag (2 lines) | ghost, lifted tag, drop word (about 6 lines) | new `test/cue-move.test.js`, new unit checks | none |

What needs attention:

- **Tasks 1 and 2 change the same two functions** (`renderFacing`, `boardFig`) and share the constant `FIG_EXTRA`. Run them in order, never in parallel.
- **Task 4 is the only risky one.** It changes the pointer handling that also does palm rejection and finger scrolling. `test/palm.test.js`, `test/misc.test.js` and `test/scale-folder.test.js` cover that code and must stay green. It cannot be proven without the real laptop: a finger hold and a pen drag are only simulated in the checks.
- **Existing shows look different after tasks 1 and 3**: a page with three or more boards is rearranged, and every board gains a grid, on screen and in print. Both are the request; the changelog says so. No file format changes, and an older release opens a show written by r1.6 (it ignores `boardGrid`).
- `SPEC.md` §6 is marked locked. Its sentence "One board fills the page; several share it" stays true; task 5 adds the arrangement to §5.5, not to §6.

## Order

Run 1 → 2 → 3 → 4 → 5, one agent at a time, in the same working tree, one commit per task. Task 4 does not depend on 1 to 3 but touches `STR` in `core.js` and `view.js` like the others, so running it in parallel only buys merge conflicts.

## Decisions taken here (change them before the agents start, if wrong)

1. **More than 8 boards on a page.** "+ Board", "Board here" and image paste refuse a ninth board with a message. A page that already has more (typed in the script text) still shows them all, in two columns with more rows.
2. **Board buttons in a narrow figure** collapse into one "⋯" button that opens the same actions in a popover. Without this the buttons are cut off in two columns.
3. **The grid is a show setting** (Settings: Off, Fine, Coarse; default Fine), not a toolbar button. It prints when it is on.
4. **A finger must hold a tag for 0.3 s before it drags.** A quick finger swipe that starts on a tag still scrolls the page. Mouse and pen drag at once.
5. **A dragged cue always lands after a word.** Board tags are not draggable in this release.

## Rules for every agent

Read `CLAUDE.md` first; it is short and its rules are binding. In addition:

- Edit `src/` only. Never read, grep or edit `promptbook.html`.
- A hook builds and runs the unit checks after every edit under `src/` and `test/unit/`. No hook output means green. **The end-of-turn browser check does not run for a subagent**, so before reporting run `sh scripts/check.sh full` yourself and fix what fails.
- Do not add to `test/KNOWN_FAILING`.
- Every new user-facing string goes in `STR` in `src/core.js`, English and Italian.
- A function that a browser check calls must be in the `window.PB` export on the last lines of `src/io.js`. A function that a unit check calls must be in `NAMES` in `test/unit/_core.js`.
- Line numbers in the task files are those of commit `cee5761` (r1.5). After an earlier task they will have moved: grep for the function name.
- Do not set `VERSION`, and do not edit `CHANGELOG.md`, `SPEC.md` or `PLAN.md`. Task 5 does that.
- Do not commit unless the person running you asks. Report: what changed, the totals line of `sh scripts/check.sh full`, and anything in the task file that turned out wrong or was left undone.
