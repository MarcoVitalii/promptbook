# Task 5 — Release r1.6

Read `tasks/r1.6/README.md` and the "Release" section of `CLAUDE.md` before starting. Run after tasks 1 to 4, or after those of them that were accepted.

## Steps

1. Read the reports of tasks 1 to 4, or `git log` and `git diff r1.5 -- src/` when there are none. Write only what was really built. Where a task departed from its file, the code wins.
2. `src/core.js`: set `VERSION = 'r1.6'`.
3. `CHANGELOG.md`: new entry on top, in the style of the r1.4 entry (written for the stage manager, no function names). Draft below; correct it against the code.
4. `SPEC.md`:
   - §5.5 Boards: add the arrangement (one column up to two boards, two columns row by row from three, 8 per page through the interface), the name under the drawing, the "⋯" button on narrow boards, the grid.
   - §5.3 Cues: add moving a cue by dragging its tag, with the rules for mouse, pen and finger.
   - §5.7 Input model: add the finger hold on a tag.
   - §5.8 Data shapes: `config.json` gains `boardGrid` (0, 25 or 50; board units).
   - New §5.14 "Changes after the first rehearsals — built in r1.6": the four requests as received (quote them from the list below) and the decisions from `tasks/r1.6/README.md`, marked `[ASSUMED]` unless the user confirmed them.
   - §7: a table "r1.6" like the r1.4 one (ID, requirement, spec, built, checked how) and a test record line with the real totals from `npm test`.
   - Do not edit §6: it is locked and still true.
5. `PLAN.md`: a row for r1.6 in the table of §4 and in the releases table of §8. Add to §7 "Next actions": try the cue drag on the laptop with finger and pen.
6. `npm test`: every check passes. Record the totals line.
7. Do not commit or tag unless the person running you asks. When asked: commit `src/`, `promptbook.html`, tests and documents together, tag `r1.6`.

## The requests as received (2026-10-08, after the first rehearsals)

1. "Adding blocks on a single page makes just a column with plenty of white space. Might be better to use fully the page by providing flexibility in their arrangements, for example limit to 8 per page in 2 columns. Would fill first a column, then moving on Z pattern with 2 columns. So 2 are 1 column, 3 are 1 - 2 / 3 - blank, 4 are 1 - 2 / 3 - 4, 5 are 1 - 2 / 3 - 4 / 5 - blank etc."
2. "Add names to the blocks that don't disappear into the options when we have many on the page, like leaving menu on top and name at the bottom."
3. "Having a light gray fine grid helps a lot when doing blockings."
4. "Moving existing cues requires copy pasting the underlying annotation, would be much better to support press with mouse or finger and move it around until release."

## Changelog draft

```markdown
## r1.6 — <date>

Boards
- A facing page with three or more boards now sets them in two columns, row by row: 1 2, then 3 4, and so on. One or two boards stay in one column.
- A page takes up to 8 boards. “+ Board” says so when the page is full.
- The name of a board is now under its drawing and is always shown. Tap it to rename the board.
- On small boards the buttons are behind one “⋯” button.
- Boards and templates have a light grey grid behind the ink. Settings → “Board grid”: Off, Fine or Coarse. The grid prints when it is on.

Cues
- A cue can be moved: press its tag in the margin, drag it to a word and release. With the mouse or the pen, just drag. With a finger, hold the tag for a moment until it lifts, then drag; a quick swipe still scrolls the page.
- The word that will receive the cue is highlighted while you drag. Near the top or bottom of the window the script scrolls, so a cue can go to another page.
- Release away from the text, or press Esc, to leave the cue where it was. A move is one undo.
- Board tags cannot be dragged yet.

Compatibility
- A show written by r1.5 opens unchanged. Its boards gain the grid and, where a page has three or more boards, the new arrangement, on screen and in print.
- r1.5 opens a show written by r1.6; it ignores the grid setting.
```
