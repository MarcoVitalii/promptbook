# Task 2 — Board names that stay visible

Read `tasks/r1.6/README.md` (section "Rules for every agent") and `CLAUDE.md` before starting. **Task 1 must be finished first**: this task changes `boardFig` and `FIG_EXTRA`, which task 1 uses.

## Problem

`boardFig` in `src/view.js` puts the name and the buttons in one row (`.bcap`, 26 px high, `overflow:hidden`, no wrap). The name is the part that shrinks, so with several boards on a page it is squeezed to nothing. In two columns (task 1) the row is about 360 px wide, or 270 px with eight boards, and the last buttons are cut off as well.

## Wanted behaviour

- Each board figure is, top to bottom: the button row, the drawing, the name.
- The name is under the drawing, centred, always shown, cut with an ellipsis only when it is wider than the drawing. It prints.
- The button row is above the drawing. When the figure is narrower than 420 px it shows one "⋯" button instead; a tap opens a popover with the same actions.
- A tap on the name opens the rename popover: `openBoardPop` for a board, `openTplName` for a template.
- The Templates view uses the same figure: name under the drawing, buttons above (they wrap there, as today).

## Where the code is

- `src/view.js`: `boardFig` (line 252), `boardAction` (line 361), `renderFacing` (line 268), `renderTemplates` (line 508), `openBoardPop` (line 970), `openTplName` (grep), `openPop` (line 771), `handleTap` (line 744, sends every `[data-act]` to `boardAction`).
- `src/view.js` pointer rule (line 571): an element with class `pbtn` or `tag` is interface, the pen does not draw on it. Anything else inside a `.board` figure starts a stroke on that board.
- `src/style.css` lines 123 to 128 and 134 to 135: `.board`, `.bcap`, `.tsheet .bcap`.
- `src/core.js`: `FIG_EXTRA` (added by task 1), `STR`.

## Implementation

### 1. `boardFig`

```js
function boardFig(B, w, acts) {
  const fig = h('figure', 'board'); /* dataset and width as today */
  const cap = h('div', 'bcap noprint');
  const few = B.tpl || w >= 420;
  if (few) for (const [act, label] of acts) { /* buttons as today */ }
  else { const bt = h('button', 'pbtn', '⋯'); bt.type = 'button'; bt.dataset.act = 'bmore'; bt.title = t('bMore'); cap.appendChild(bt); }
  fig.appendChild(cap);
  /* svg as today */
  const nm = h('button', 'bname pbtn', B.name); nm.type = 'button'; nm.dataset.act = 'bname'; fig.appendChild(nm);
  return fig;
}
```

- The name is a `button.pbtn` so that the pen does not draw when it touches it and a tap reaches `boardAction`. Style it as plain text.
- `.bcap` carries `noprint`, but it must keep its height in print so that screen and paper match: hide its content, not the box. Use `visibility:hidden` for `.bcap` in the print block of `style.css` and drop `noprint` from it if `noprint` would remove the box (`.noprint` is `display:none` in print).
- The "⋯" popover needs the actions of that figure. Keep them reachable: store the list on the figure (`fig._acts = acts`) or rebuild it from a small function `boardActs(B)` used by both `renderFacing` and the popover. Prefer `boardActs(B)`; move the list out of `renderFacing`.

### 2. Split `boardAction`

Today it finds the board with `btn.closest('.board')`, which fails for a button inside the popover. Split it:

```js
function boardAction(btn, x, y) {
  const act = btn.dataset.act;
  if (act === 'addboard') { /* as today */ return; }
  const B = figBoard(btn.closest('.board')); if (B) boardAct(act, B, x, y);
}
function boardAct(act, B, x, y) { /* the existing if-chain, plus: */ }
```

New branches in `boardAct`:

- `bmore`: `openPop(x, y, p => { … })` with a `div.pcol` of `button.btn`, one per entry of `boardActs(B)`; each does `closePop(); boardAct(act, B, x, y);`. Same pattern as `addBoardFlow` (line 485).
- `bname`: for a template `openTplName(B, x, y)`; for a board find the block and cue of its token (the two lines of the `bremove` branch do this) and call `openBoardPop(b, c, x, y)`.

### 3. Height of a figure

The name row adds height. Set `FIG_EXTRA` in `core.js` to the real sum (button row 26 + name row 20 = 46) and make the CSS heights fixed so the layout sum is exact:

```css
.board{margin:0;display:flex;flex-direction:column}
.bcap{display:flex;align-items:center;justify-content:flex-end;gap:6px;height:26px;flex-wrap:nowrap;overflow:hidden}
.bname{height:20px;line-height:20px;padding:0;border:0;background:transparent;font:inherit;font-size:12px;font-weight:700;color:var(--tx2);text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;width:100%}
```

Remove the old `.bcap b` rule. Keep `.tsheet .bcap` wrapping as it is.

`test/unit/boards.test.js` from task 1 reads `FIG_EXTRA` through the layout, so its "fits the page" checks keep holding; a single blank board on A4 stays 733 px wide (check it).

### 4. Strings

- `bMore`: "Board actions" / "Azioni della tavola".

## Checks

### Existing tests to adapt

- `test/templates.test.js` line 11: the helper finds a figure through `.bcap b`. Change the selector to `.bname`.
- `test/interact.test.js` line 117 clicks `.bcap button` "Image": still valid with one board (733 px wide). Leave it unless it fails.
- Grep `test/` for `bcap` and for button labels clicked inside a facing-page figure ("Remove", "Clear ink", "Base", "To templates"); with one or two boards on the page the buttons are still shown directly.

### Add to `test/boards.test.js`

- With 4 boards on a page: every `.bname` is visible, its text is the board's name, and its top edge is at or below the bottom edge of the figure's `svg`.
- With 4 boards: a figure shows exactly one button in `.bcap` ("⋯"). A click opens `#pop` listing Image…, To templates, Clear ink, Remove. Choosing "Clear ink" after drawing a stroke empties `PB.S.boards.get(name).strokes`; choosing "Remove" on another board removes its `{BOARD …}` token from `PB.serialize()`.
- With 1 board: the four buttons are shown directly, no "⋯".
- A click on a name opens the rename popover; typing a new name and Enter renames the token in the text and the `.bname`.
- A pen stroke that starts on a name adds no stroke to any board.
- 8 boards still lie inside `.fbody` (the task 1 check, now with the taller figure).
- In the Templates view the name is under the drawing and "Rename" still works.

## Done when

- Names are readable under every board for 1 to 8 boards on a page, on screen and in the print preview PDF (`page.pdf` is used in other tests; save one to `$OUT/boards-names.pdf` and look at it, or take a screenshot with `page.emulateMedia({ media: 'print' })`).
- `sh scripts/check.sh full` is green.

## Out of scope

The grid inside a board (task 3). New board actions. Reordering boards.
