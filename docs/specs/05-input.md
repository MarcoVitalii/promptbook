# Input — INP

**Covers:** what pen, finger, mouse and keyboard do; the palm rule.
**Code:** `src/view.js` (INPUT: the `pointerdown`, `pointermove`, `pointerup` handlers, `beginInk`, `eraseAt`, the cue drag, `handleTap`), `src/io.js` (keyboard, paste).
**Checks:** `test/palm`, `test/misc`, `test/interact`, `test/scale-folder`, `test/cue-move`.
**Columns and tags:** explained in `SPEC.md`, "How to read this specification".

---

## 1. Intent

The tool must be fast enough to use live in rehearsal, pen in hand (goal G5). The editing device is a laptop with touchscreen and pen, and the tool is built and tested for that device only (D13).

That laptop reports pen, finger and mouse as different pointers. The intent is to use that instead of a tool palette: no mode switch between drawing and tapping (D14).

## 2. Requirements

| Pointer | On a script page | On a board |
|---|---|---|
| Pen tip | Draws ink | Draws ink |
| Pen eraser end or barrel button | Erases the strokes it touches | Same |
| Finger tap on a word | Opens the cue pin | — |
| Finger drag | Scrolls | Scrolls |
| Finger held 0.3 s on a cue tag, then dragged | Moves the cue to the word it is released on (CUE-25), or to a line of its own between two blocks (CUE-43) | — |
| Pen or mouse dragged from a cue tag | Same, at once; the pen draws no ink | — |
| The same gestures on the grip in the left gutter of a block, or on a board tag | Move the block to the place it is released on (TXT-28) | — |
| Finger tap between blocks | Standalone cue or board | — |
| Mouse | As finger | As finger |

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| INP-1 | Input is split by pointer type as in the table above, with no mode switch. | D14 `[ASSUMED]` | r0 | interact, scale-folder |
| INP-2 | Touches are ignored while the pen is down and for about half a second after it lifts. | D14 | r0 | palm |
| INP-3 | Palm rule: while the pen hovers near the screen, a touch can still tap quickly to pin a cue, but it cannot scroll, long-press, or be a large contact. | D14 | r0 | palm |
| INP-4 | Because the page must not scroll under the pen, finger scrolling is done by the tool itself, not by the browser. Pinch-zoom is replaced by the zoom buttons. | D14 | r0 | scale-folder |
| INP-5 | The pen can tap margin tags, the ink flag, the comment marker and board buttons. | as built | r0 | misc, cue-move |
| INP-6 | A toolbar toggle, "Finger", lets finger and mouse draw, for machines without a pen. A toolbar "Eraser" makes the active drawing pointer erase. The two are never lit together: choosing one leaves the other. | D14; fix of 2026-10-09 | r0, r1.7 | misc |
| INP-7 | Double-tap, double-click or long press on a block opens its text for editing. A second pin on the same line straight after the first is not taken for a double tap. | as built | r0, r1.0 | misc |
| INP-8 | Finger hold on a tag: a finger that rests on a cue tag for 0.3 s within 8 px lifts it; only then does moving drag the cue. A finger that moves sooner scrolls and never lifts. A quick finger tap on a tag opens the cue editor. Board tags lift too since the change of 2026-10-10: they move their line (TXT-28). | `[ASSUMED]` | r1.6 | cue-move |
| INP-9 | The palm rule covers the drag: a touch that lands while the pen hovers gets no hold timer, and a tag already lifted is not dragged once the pen comes near. During a drag every other pointer is ignored, so a palm landing in mid-drag neither stops it nor starts anything. | as built | r1.6 | cue-move |
| INP-10 | Escape cancels a drag and closes the open popover or menu. A system `pointercancel` ends a drag with no change. | as built | r1.6 | cue-move |
| INP-11 | Keyboard: Ctrl+Z undo, Ctrl+Y or Ctrl+Shift+Z redo, Ctrl+F find, and with the cue pin open the first letter of a department code pins at the tapped word. The single-key shortcuts added in r1.8 are UI-9 (`09-workbench.md`); they are off while the cue pin is open, so the department letters keep their meaning. | as built | r0 | interact |
| INP-12 | In show mode (`11-show.md`) none of the editing gestures above does anything: pen and finger scroll, a double tap on a word puts the running line there (SHW-2, SHW-9), and the keyboard has its own keys (Space, Enter, arrows, `[` `]`, S to enter and to leave; SHW-30). | request r1.11 `[LOCKED]` | r1.11 | show |

## 3. Consequences

**The whole input model rests on one unverified fact (A3).** The pen must report as a pen to the browser. The client answered "yes" to Q21, read as all four device checks passing (pen draws without scrolling, resting hand stays quiet, eraser end erases, print lines up); the answer does not say which were tried. If the pen is reported as touch or mouse, pen and finger cannot be told apart; the fallback is the "Finger" toggle.

**The browser's own gestures are switched off on the page.** Scrolling, momentum, long press and double tap are re-implemented by the tool. Pinch-zoom is gone.

**All pointer handling is one state machine.** Draw, erase, tap, scroll, long press and cue drag share one state object and three event handlers. The cue drag of r1.6 changed that code, which also does palm rejection and finger scrolling; the older palm checks pass unchanged, on simulated events.

**Timing and distance thresholds as built.** Only the first two are named in the requirements; the rest are values in the code:

| Threshold | Value |
|---|---|
| Hold before a finger lifts a tag | 0.3 s |
| Movement that turns a press into a drag or a scroll | 8 px |
| Touches ignored after the pen lifts | 0.45 s |
| Pen counts as hovering after its last movement | 0.35 s |
| A touch larger than this is a palm while the pen hovers | 40 px |
| Long press on a block | 0.56 s |
| Double tap on a block | within 0.42 s |

**One letter per department.** The keyboard shortcut uses the first letter of the code. Two departments starting with the same letter share it; the first in the Settings list wins.

**Not verified:** every pen, finger and palm behaviour is checked with synthetic events in Chromium, never on the device. That covers the palm rule (INP-3, INP-9), the finger hold (INP-8) and the pen's eraser end, which could not be simulated at all. The device trial is the open gate for r1.6 (`PLAN.md`, next actions).
