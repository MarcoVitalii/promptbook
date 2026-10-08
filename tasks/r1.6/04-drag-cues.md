# Task 4 — Move a cue by dragging its tag

Read `tasks/r1.6/README.md` (section "Rules for every agent") and `CLAUDE.md` before starting. This task is independent of tasks 1 to 3.

## Problem

A cue is a token in the script text, for example `Rispondi! {LX 12 | cambio luce}`. It is drawn as a box round the word and a tag in the right margin. To move it to another word today, the stage manager opens the text editor of the block, cuts the token and pastes it elsewhere.

## Wanted behaviour

- Press a cue tag in the margin, move, release on a word: the token leaves its place and lands after that word. One undo step.
- **Mouse and pen:** the drag starts once the pointer has moved 8 px with the button or tip down.
- **Finger:** hold the tag for 0.3 s; the tag lifts (visible change); then move. A finger that moves before 0.3 s scrolls the page as it does now.
- While dragging: a copy of the tag follows the pointer, the original is dimmed, and the word that would receive the cue is highlighted in the cue's colour. The target is the word under the pointer or, when the pointer is between words, the nearest word of the nearest line of text on that script page.
- Near the top or bottom edge of the work area the script scrolls, so a cue can be carried to another page.
- Release with no highlighted word (far from any text, on the facing page, outside the pages): nothing changes. Escape during a drag: nothing changes.
- Release on the word the cue already follows: nothing changes and no undo step is added.
- A press and release without movement still opens the cue editor, as today.
- What can be dragged: every tag that is not a board tag. That includes end tags (`{/SND 5}`), linking cues, to-do notes and cues on a line of their own. A cue on its own line that is dropped on a word becomes a word cue and its empty line is removed.
- All fields move with the token unchanged: number, margin text, notes, links.
- If the move breaks a pair (an end dragged above its start, a start dragged below its end), the move is kept and a message says so. Undo reverts it.

Not in this task: dragging board tags, dropping a cue onto a line of its own, dragging the boxed word instead of the tag.

## Where the code is

- `src/view.js`, part `INPUT: pen draws, finger and mouse tap and scroll` (line 556 on):
  - The state of the current pointer is the module variable `P`. `P.k` is `'tap'`, `'ink'` or `'erase'`.
  - `desk` `pointerdown` (line 568): decides between drawing and a tap. A press on `.tag` is never drawing (`ui`). It creates `P = { k: 'tap', … }` and, for a finger away from the pen, a 560 ms long-press timer `P.lp`.
  - `window` `pointermove` (line 600): for `'tap'`, sets `P.moved` after 8 px and, for a finger, scrolls the desk by hand (`touch-action` is `none`).
  - `endPtr` (line 623): a tap that did not move calls `handleTap`; a moved finger tap may start momentum scrolling.
  - Palm rules: `penUntil`, `penSeen`, `P.nearPen`. Read the comment at line 582. Do not weaken them.
- `src/view.js` `layoutTags` (line 59): builds the tags. A tag has `data-b` (block id) and `data-s` (start of the token in the block's raw text); board tags have class `btag`. `handleTap` (line 745) shows how to get from a tag to its cue: `S.byId.get(+tag.dataset.b)`, then `b.cues.find(q => q.s === +tag.dataset.s)`.
- `src/view.js` `insertWordCue` (line 788): where a new cue goes after a word (after the cues already there).
- Words on the page are `span.w` with `data-i` (index into `b.tokens`) inside `.tx[data-b]`.
- `src/core.js`: `cutToken` and `textEdits` (lines 616, 622), `commitText` (line 715), `pairCues` (line 532, fills `S.pairs` and `c.b`), `cueColour` (line 756).
- `src/io.js` `keydown` handler (line 573): Escape.
- `src/style.css` lines 93 to 109: `.w`, `.w.cued` (uses the inline variable `--c`), `.tag`.

## Implementation

### 1. Text edit in `src/core.js` (after `textEdits`)

```js
/* text with cue c moved to just after word wi of block tb (after the cues already there); null when that is where it is */
function textMoveCue(c, tb, wi) {
  const w = tb.tokens[wi]; if (!w || w.k !== 'w') return null;
  const after = w.cues.filter(q => !q.before);
  if (after[after.length - 1] === c) return null;
  let pos = w.e; for (const q of after) if (q !== c) pos = Math.max(pos, q.e);
  /* the cut is listed first: when both edits start at the same place in one block it must run first */
  return textEdits([{ b: c.b, s: c.s, e: c.e, text: null }, { b: tb, s: pos, e: pos, text: ' ' + c.b.raw.slice(c.s, c.e) }]);
}
```

Why this is safe in one block: `textEdits` applies the edits of a block from the highest start to the lowest, so the earlier edit's positions are untouched by the later one. `pos` is the end of a word or of another cue, so it is never inside the moved token. The one tie is a token glued to its word (`word{LX}`), where `pos === c.s`; the sort is stable, so the cut runs first. `textEdits` already drops a line that becomes empty (a cue on its own line) and trims the line end.

Check the result of the same-word case when `c` is an after-cue of the target word but not the last: it moves behind the others. That is a reorder, not an error.

### 2. Pointer handling in `src/view.js`

Add a fourth state, `P.k === 'drag'`. Keep the additions together in one block of functions after `eraseAt`; touch the three existing handlers in as few lines as possible.

**`pointerdown`** (after `P = { k: 'tap', … }` is created):

```js
const tag = !S.editing && tg.closest('.tag:not(.btag)');
if (tag) {
  P.tag = tag;
  if (P.lp) { clearTimeout(P.lp); P.lp = 0; }                    // a long press on a tag lifts it, it does not edit
  if (e.pointerType === 'touch' && !nearPen) { const me = P; P.lp = setTimeout(() => { if (P === me && !me.moved) { me.held = true; tag.classList.add('lift'); } }, 300); }
}
```

A finger near the pen (`nearPen`) gets no timer and so can never drag: that keeps a resting hand harmless.

**`pointermove`**, `'tap'` branch, at the moment `P.moved` becomes true:

```js
if (P.tag && (P.type !== 'touch' || P.held)) { beginDrag(e); return; }
P.tag = null;   // a finger that moved before the hold scrolls
```

and add a branch `else if (P.k === 'drag') moveDrag(e);`.

**`endPtr`**: before the `'tap'` branch, `if (p.tag) p.tag.classList.remove('lift');`, and a new branch:

```js
if (p.k === 'drag') { endDrag(p, e.type !== 'pointercancel'); return; }
```

Note that `endPtr` sets `P = null` before the branches; `endDrag` takes the state as an argument.

**New functions:**

- `beginDrag(e)`: look up the cue from `P.tag` (as `handleTap` does); if it is gone, drop `P.tag` and return. Set `P.k = 'drag'`, `P.cue = c`. Close any popover. Create the ghost: `P.tag.cloneNode(true)`, class `tag ghost`, appended to `document.body` (the page clips and scales its children, so the ghost cannot live there); copy the `--c` variable; `position:fixed`. Add class `moving` to the original tag. Capture the pointer as `beginInk` does (`try { desk.setPointerCapture(e.pointerId); } catch (_) {}`). Then call `moveDrag(e)`.
- `moveDrag(e)`: place the ghost at the pointer, shifted so a finger does not cover it (`left = x + 14`, `top = y - 36`). Compute the target with `dropTarget(e.clientX, e.clientY)` and move the highlight: remove class `drop` from the previous word, add it to the new one and set the inline variable `--dc` to `cueColour(P.cue)` (do **not** set `--c`: a word that already has a cue uses `--c` for its own box). Store `P.drop = { b, wi, el }` or `null`. Then edge scrolling: if the pointer is within 48 px of the top or bottom of `desk.getBoundingClientRect()`, start a `requestAnimationFrame` loop that scrolls `desk.scrollTop` by up to 14 px per frame (faster nearer the edge) and calls `renderVisible()` and `moveDrag` again with the last pointer position; stop the loop when the pointer leaves the band or the drag ends. Keep the frame id on `P` so `endDrag` can cancel it.
- `dropTarget(x, y)`: `const el = document.elementFromPoint(x, y)` (the ghost has `pointer-events:none`). If `el.closest('.w')` exists, that is the word. Otherwise take `el.closest('.page.script')`; among its `.tx` elements pick the one whose rectangle is nearest to `y` (zero distance when `y` is inside); inside it pick the `.w` with the smallest distance from the point to its bounding rectangle. Reject when that distance is more than `70 * S.view.zoom` px. Return `{ b: S.byId.get(+tx.dataset.b), wi: +w.dataset.i, el: w }` or `null`. Skip `.tx` elements whose block is not found.
- `endDrag(p, commit)`: remove the ghost, the `moving` and `lift` classes, the `drop` class and `--dc`; cancel the scroll frame. Then, when `commit` and `p.drop`:

  ```js
  const b = S.byId.get(+p.tag.dataset.b), c = b && b.cues.find(q => q.s === +p.tag.dataset.s);
  const nt = c && textMoveCue(c, p.drop.b, p.drop.wi);
  if (nt) { const n = S.pairs.length; if (commitText(nt) && S.pairs.length < n) toast(t('moveUnpaired')); }
  ```

  Look the cue up again here instead of trusting `p.cue`: the script may have been re-parsed during the drag. Set `S.lastTap = null` so the next tap is not read as a double tap.
- `cancelDrag()`: `if (P && P.k === 'drag') { const p = P; P = null; endDrag(p, false); }`.

**`src/io.js` `keydown`**, first line of the Escape branch: `cancelDrag();` (the functions share one scope).

Also call `cancelDrag()` at the start of `undo` and `redo`? Not needed: they are reached by keyboard only while a pointer is down; leave them.

### 3. CSS

```css
.tag.lift{box-shadow:0 2px 8px rgba(0,0,0,.35)}
.tag.moving{opacity:.35}
.tag.ghost{position:fixed;z-index:28;pointer-events:none;box-shadow:0 4px 14px rgba(0,0,0,.35);opacity:.95}
.w.drop{box-shadow:0 0 0 2px var(--dc);background:color-mix(in srgb,var(--dc) 30%,transparent)}
```

`.tag.etag` uses `box-shadow` for its outline; make sure the ghost of an end tag still reads as one (combine the shadows if needed). The ghost is outside `.page`, so give it the page's font explicitly if it does not inherit it (`.tag` already sets `font`). Add `.ghost` to the elements hidden in print.

### 4. Strings

- `moveUnpaired`: "Moved. This cue and its end no longer match: check the order." / "Spostato. Il cue e la sua fine non corrispondono più: controlla l’ordine."

## Checks

### `test/unit/` (no browser)

Add `textMoveCue` to `NAMES` in `test/unit/_core.js`. New file `test/unit/cue-move.test.js`. For each case load a text with `C.load`, find the cue and the target word index in `S.blocks[k].tokens` (words have `k === 'w'`), and compare the returned text:

| Case | Before | After |
|---|---|---|
| Forward in one speech | `ANNA: uno {LX 1} due tre` → after `tre` | `ANNA: uno due tre {LX 1}` |
| Backward in one speech | `ANNA: uno due tre {LX 1 \| luce \| nota}` → after `uno` | `ANNA: uno {LX 1 \| luce \| nota} due tre` |
| To another block | cue in ANNA's line → a word in MARCO's line | token gone from the first line, present after the word in the second, nothing else changed |
| Target word already has a cue | `uno {SND 2} due {LX 1}` → after `uno` | `uno {SND 2} {LX 1} due` |
| Own-line cue | `ANNA: uno\n{VID 1}\nMARCO: due` → after `due` | `ANNA: uno\nMARCO: due {VID 1}` |
| Glued token | `ANNA: uno{LX 1} due` → after `uno` | returns `null` |
| Glued token, other word | same → after `due` | `ANNA: uno due {LX 1}` |
| Same place | `uno {LX 1} due` → after `uno` | returns `null` |
| Cue before the first word | `ANNA: {LX 1} uno due` → after `due` | `ANNA: uno due {LX 1}` (check spacing, no double space) |
| End token | `{/SND 5}` keeps its `/` | |
| Pair kept | start and end both present; move the start two words earlier | `S.pairs.length` unchanged after `C.commitText` |
| Undo | any move, then `C.undo()` | text identical to the start |

If a spacing case fails, fix `textMoveCue`, not the expectation: the result must never hold a double space, a space before the line end, or a token glued to the next word.

### `test/cue-move.test.js` (browser, new)

Use the sample scene or `PB.startMemory` with a short text. Mouse: `page.mouse.move/down/move({ steps })/up`. Finger: `cdp.send('Input.dispatchTouchEvent', …)` as in `test/palm.test.js`. Pen: the `pen()` helper.

- Mouse: drag the tag of a cue to a word two lines down; the text has the token after that word and nowhere else; the tag is drawn at the new line; no popover is open.
- During the drag (before `mouse.up`): one `.tag.ghost` exists, the original has class `moving`, exactly one `.w.drop` exists and it is the target word.
- After release: no `.ghost`, no `.moving`, no `.drop`, no `.lift` anywhere.
- One Ctrl+Z restores the text exactly; Ctrl+Y moves the cue again.
- A click on a tag without movement opens the cue editor (existing behaviour).
- Drop on the facing page: text unchanged, undo button state unchanged (`#bUndo` disabled when it was).
- Escape during a drag, then release: text unchanged.
- Drop on the cue's own word: text unchanged, no undo step.
- Drop between two lines of a speech (pointer in the line gap, a few px off any word): the nearest word receives the cue.
- Own-line cue (`{VID 1}` on its own line) dragged to a word: the line is gone from the text.
- Finger, quick: touch a tag and move at once by 200 px upward: the desk scrolled (`#desk` `scrollTop` changed) and the text is unchanged. The page must be scrollable for this: use a text long enough for two pages.
- Finger, hold: touch a tag, wait 400 ms, the tag has class `lift`; move to a word and lift: the cue moved and the desk did not scroll.
- Finger near the pen: hover the pen (a pen `mouseMoved` as in `palm.test.js`), then touch-hold a tag for 400 ms and move: nothing is dragged.
- Pen: a pen drag from a tag to a word moves the cue and adds no ink (`PB.S.ink.size` unchanged).
- A board tag (`.btag`) cannot be dragged: a mouse drag from it changes nothing.
- Paired cue: drag an end tag above its start: the move happens and `#toast` shows the message.
- Carry to another page: start a drag on page 1, hold the pointer 20 px above the bottom edge of `#desk` until `scrollTop` has grown by a page, drop on a word of page 2: the token is in that block.

`test/palm.test.js`, `test/misc.test.js`, `test/scale-folder.test.js`, `test/interact.test.js` and `test/cue-ends.test.js` exercise the same handlers and must stay green without edits. If one needs a change, say why in the report.

## Done when

- Every check above passes and `sh scripts/check.sh full` is green.
- The report lists what could not be simulated (real finger hold, real pen), for the device trial.

## Out of scope

Dragging board tags or boards. Dropping onto a line of its own. Dragging several cues at once. Copying a cue by dragging with a key held. Renumbering after a move.
