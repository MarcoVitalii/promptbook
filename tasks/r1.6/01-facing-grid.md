# Task 1 — Boards on a facing page in two columns

Read `tasks/r1.6/README.md` (section "Rules for every agent") and `CLAUDE.md` before starting.

## Problem

`renderFacing` in `src/view.js` stacks all boards of a page in one column and shrinks them until the stack fits the page height. With four boards each one is about a quarter of the page wide and the rest of the page is empty.

## Wanted behaviour

- One or two boards: one column, as today.
- Three or more: two columns, filled row by row (a Z pattern).

  | Boards | Arrangement |
  |---|---|
  | 1 | 1 |
  | 2 | 1 / 2 |
  | 3 | 1 2 / 3 – |
  | 4 | 1 2 / 3 4 |
  | 5 | 1 2 / 3 4 / 5 – |
  | 8 | 1 2 / 3 4 / 5 6 / 7 8 |

- Order is the order of the `{BOARD}` tokens on the script page (`P.boards`), unchanged.
- At most 8 boards per page through the interface. "+ Board", "Board here" and pasting an image refuse a ninth with a message. A page that already holds more, because the tokens were typed in the script text, still shows them all in two columns with more rows.
- All boards of a page are drawn at one scale, as today. Nothing may overflow the page body; the "+ Board" button stays below the boards.
- Print uses the same arrangement (it prints the same DOM).

## Where the code is

- `src/view.js`, section `/* ---------- facing page and boards ---------- */`:
  - `renderFacing(i)` (line 268): the layout to replace is lines 276 to 285.
  - `boardFig(B, w, acts)` (line 252): builds one figure of width `w`. Do not restructure it here; task 2 does.
  - `boardAction` (line 361): the `addboard` branch.
  - `addBoardOnPage`, `addBoardAfter` (lines 315, 316).
- `src/view.js` `openPin` (line 893): the "Board here" button.
- `src/io.js` paste handler (line 585).
- `src/core.js`: constants after `BOARD_W` (line 140); layout section at the end of the file; `STR` at the top.
- `src/style.css` line 122: `.fbody`.

## Implementation

### 1. Pure layout function in `src/core.js`

Add next to `BOARD_W`:

```js
const MAX_BOARDS = 8;   // per facing page, through the interface
const FIG_EXTRA = 26;   // height a board figure takes besides its drawing
const FIG_GAP = 12;
```

Add in the LAYOUT part of `core.js` (before `paginate`), so it can be unit tested:

```js
/* boards on a facing page: one column up to two boards, then two columns filled row by row.
   hs: height of each board for a width of 1. Returns the columns and the one width all boards get. */
function facingLayout(hs, availW, availH) {
  const n = hs.length, cols = n > 2 ? 2 : 1, cw = (availW - (cols - 1) * FIG_GAP) / cols;
  let sum = 0, rows = 0;
  for (let k = 0; k < n; k += cols) { sum += cw * Math.max(...hs.slice(k, k + cols)); rows++; }
  const f = sum ? Math.min(1, (availH - rows * (FIG_EXTRA + FIG_GAP)) / sum) : 1;
  return { cols, w: Math.floor(cw * f) };
}
```

A row is as tall as its taller board, so boards of different shapes still fit.

### 2. `renderFacing`

Replace the `else { … }` branch (lines 276 to 285) with:

```js
else {
  const availW = pp.w - 60, availH = pp.h - GEO.top - GEO.bot - 44;   // 44: the "+ Board" button and its gap
  const L = facingLayout(bs.map(B => effH(B) / BOARD_W), availW, availH);
  const grid = h('div', 'fgrid'); grid.style.setProperty('--cols', L.cols);
  for (const B of bs) { /* acts as today */ grid.appendChild(boardFig(B, L.w, acts)); }
  body.appendChild(grid);
}
```

Keep the `acts` list exactly as it is today. The old code subtracted the same 44 px inside its formula; keep the total equal so one and two boards come out the size they have now (check this: for one blank board on A4 the figure must still be 733 px wide).

### 3. CSS

```css
.fgrid{display:grid;grid-template-columns:repeat(var(--cols,1),max-content);gap:12px;justify-content:center;align-items:start;justify-items:center}
```

`.fbody` stays a centred flex column holding `.fempty` or `.fgrid`, then `.addboard`.

### 4. The limit of 8

Add in `view.js` near `addBoardOnPage`:

```js
function pageFull(pi) { const P = S.pages[pi]; if (!P || P.boards.length < MAX_BOARDS) return false; toast(t('boardsFull', MAX_BOARDS)); return true; }
```

Call it, and stop when it returns true, in:

- `boardAction`, branch `addboard`: `pageFull(pi)`.
- `openPin`, the "Board here" button: `pageFull(pageIndexOf(lastOfGroup(b))[0])`.
- the paste handler in `io.js`: the page of the selected block when there is one, else `currentPage()`.

A board placed after the last block of a page can land on the next page; that edge is accepted.

Strings (both languages, `{0}` is the number):

- `boardsFull`: "A page holds {0} boards at most" / "Una pagina contiene al massimo {0} tavole".

## Checks

### `test/unit/` (no browser)

Add `facingLayout` to `NAMES` in `test/unit/_core.js`. New file `test/unit/boards.test.js`, A4 numbers (`availW` 733, `availH` 966), blank boards (`0.75`):

- 1 and 2 boards give 1 column; 3, 4, 5 and 8 give 2 columns.
- 1 board: `w` is 733.
- For every count 1 to 10: rows × (`w` × 0.75 + `FIG_EXTRA` + `FIG_GAP`) ≤ 966.
- Mixed shapes (`[0.75, 1.5, 0.5]`): the sum of row heights still fits.

### `test/boards.test.js` (browser, new)

Start a show with `PB.startMemory(text)` (see another test for the call) where one short scene holds N lines `{BOARD b1}` … on the same page; change N with `PB.commitText`. Read positions with `boundingBox()` of `.page.facing .board`.

- 2 boards: same left edge, second below the first.
- 3 boards: first and second share a top edge, second is to the right; third is under the first; no fourth cell.
- 5 boards: fifth is under the third, on the left.
- 8 boards: every figure lies inside the bounding box of `.fbody`; `.addboard` is below the last figure and inside the page.
- Two boards in one row have the same width; drawing with `pen()` on the second board of a row stores the stroke on that board (`PB.S.boards.get(name).strokes.length`), and its first point is within the board's coordinates (0 to 1000).
- With 8 boards a click on `.addboard` adds nothing: `PB.S.boards.size` unchanged and `#toast` is visible.
- 9 tokens typed in the text: 9 figures drawn, all inside `.fbody`.
- Save a screenshot of the facing page with 5 boards to `$OUT/boards-5.png` and look at it.

Existing checks that touch boards must stay green: `interact`, `templates`, `scale-folder`, `frontmatter`, `parse-undo`.

## Done when

- The table under "Wanted behaviour" holds on screen for 1 to 8 boards.
- `sh scripts/check.sh full` is green.

## Out of scope

Board names and buttons (task 2), the grid drawn inside a board (task 3), dragging boards to reorder them, a different number of columns per page.
