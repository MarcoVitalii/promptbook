# Task 3 — A light grey fine grid on boards

Read `tasks/r1.6/README.md` (section "Rules for every agent") and `CLAUDE.md` before starting. Tasks 1 and 2 should be finished first (same file, same test file).

## Problem

A board is a blank sheet or an image. Blocking is easier to draw and to read with a faint grid behind the ink.

## Wanted behaviour

- Every board and every template shows a fine light grey grid behind its ink.
- The grid is a setting of the show: **Off**, **Fine** (default), **Coarse**. It is in Settings, under "Template strength".
- It is display only: the pen and the eraser ignore it, it is not stored in any board file, and the ink does not snap to it.
- It lines up through a template chain, because all boards of a chain share coordinates and the grid starts at the top-left corner.
- It prints when it is on. It follows night mode.
- A show saved by an older release opens with the Fine grid.

## Where the code is

- `src/view.js` `fillBoard(svg, B)` (line 237): layers are, in order, the greyed chain (`g.bbase`), the board's own image, the board's ink (`g.bstrokes`). Every board and template figure is drawn here.
- `src/core.js` `defaultConfig` and `normCfg` (lines 143 to 166); `STR`.
- `src/io.js` `openSettings` (line 457): the "Template strength" select `fs2` is the pattern to copy. Its Save handler already calls `relayout(true)` and `renderTemplates()`, which redraw every figure.
- `src/style.css` near line 113.

## Implementation

### 1. Configuration

- `defaultConfig()`: add `boardGrid: 25`.
- `normCfg()`: `o.boardGrid = [0, 25, 50].includes(+o.boardGrid) ? +o.boardGrid : 25;`. Do not use `||`: 0 means off and must survive.

The value is the step in board units (a board is 1000 wide).

### 2. Drawing

In `fillBoard`, after the board's own image and before `g.bstrokes`:

```js
const st = S.cfg.boardGrid;
if (st) {
  let d = '', D = '';
  for (let x = st; x < BOARD_W; x += st) { if (x % (st * 4)) d += 'M' + x + ' 0V' + H; else D += 'M' + x + ' 0V' + H; }
  for (let y = st; y < H; y += st) { if (y % (st * 4)) d += 'M0 ' + y + 'H' + BOARD_W; else D += 'M0 ' + y + 'H' + BOARD_W; }
  svg.append(sv('path', { class: 'bgrid', d }), sv('path', { class: 'bgrid maj', d: D }));
}
```

Two paths per board, whatever the step: thin lines, and every fourth line a little stronger so distances can be counted. The grid sits over an image (a ground plan is where it is most useful) and under the ink.

```css
.bgrid{fill:none;stroke:var(--muted);stroke-width:.5px;opacity:.28;vector-effect:non-scaling-stroke;pointer-events:none}
.bgrid.maj{opacity:.5}
```

`vector-effect:non-scaling-stroke` keeps the lines hairline thin at any board size and zoom. Tune the two opacities by eye on a screenshot: the grid must be clearly lighter than a faded template (`.bbase`, 40%) and must not compete with ink. Check it in night mode and in print (`--muted` is `#666` in print).

The existing rule `.ink path,.bstrokes path,.bstatic path` does not match the grid; do not put the grid inside `.bstrokes`, the eraser and "Clear ink" work on `B.strokes` only and must stay unaware of it.

### 3. Settings

In `openSettings` add a select after `fs2`, values `0`, `25`, `50`, labels from `STR`, current value `S.cfg.boardGrid`; add `boardGrid: +sel.value` to the object passed to `normCfg` in the Save handler.

Strings:

- `gridL`: "Board grid" / "Griglia delle tavole"
- `gridOff`: "Off" / "Nessuna"
- `gridFine`: "Fine" / "Fine"
- `gridCoarse`: "Coarse" / "Larga"

## Checks

### `test/unit/`

In `test/unit/boards.test.js` (or `parse.test.js` if task 1 did not create the former): `normCfg({}).boardGrid === 25`, `normCfg({ boardGrid: 0 }).boardGrid === 0`, `normCfg({ boardGrid: 50 }).boardGrid === 50`, `normCfg({ boardGrid: 'x' }).boardGrid === 25`.

### `test/boards.test.js`

- A new board shows two `path.bgrid` elements; in the `svg` they come before `g.bstrokes` and after any `image`.
- The fine grid of a blank board (1000 × 750) has 39 vertical and 29 horizontal lines in total across the two paths (count the `M` commands).
- `getComputedStyle` of a `.bgrid` path gives `pointer-events: none`.
- A pen stroke across the board stores one stroke; the eraser over an empty part of the grid removes nothing; "Clear ink" leaves the grid.
- A board based on a template shows one grid (two paths), not one per layer.
- Settings → Board grid → Off → Save: no `.bgrid` left on the facing page; `PB.S.cfg.boardGrid === 0`. Set Coarse: 19 vertical lines.
- The setting survives a round trip: `PB.bundle(...)` then `PB.loadBundle(...)` (see how `test/zipshow.test.js` or `scale-folder.test.js` reloads a show) keeps `boardGrid`.
- The Templates view shows the grid on a template sheet.
- Screenshots to `$OUT`: `grid-day.png`, `grid-night.png` (toggle `#bNight`), and a print rendering. Look at them.

Grep `test/` for selectors that count every `path` inside a board `svg` without naming a layer; the grid adds two. The known ones (`.bbase path`, `.bstrokes path`) are scoped and safe.

## Done when

- The grid shows on boards and templates, light enough to draw over, in day, night and print.
- `sh scripts/check.sh full` is green.

## Out of scope

Snap to grid. A grid on script pages. A grid step per board. A scale in metres.
