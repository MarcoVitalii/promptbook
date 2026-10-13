# Cues — CUE

**Covers:** cue tokens, pinning, margin tags, ends and linking cues, the running rail, to-do notes, automatic numbers, moving a cue, the cue list and its exports.
**Code:** `src/core.js` (`mkCue`, `splitLinks`, `fmtToken`, `pairCues`, `textEdits`, `textMoveCue`, `textCueOwn`), `src/view.js` (`layoutTags`, drag, `openPin`, `openCueEdit`, `collectCues`, `cueTable`, `csvText`).
**Checks:** `test/interact`, `test/cuebox`, `test/cue-ends`, `test/notes-todos`, `test/cue-move`, `test/unit/cue-move`, `test/unit/parse`.
**Columns and tags:** explained in `SPEC.md`, "How to read this specification".

---

## 1. Intent

Cue lists were compiled by hand from an annotated printout. The intent is that the list is generated from the annotated script (goal G2) and that each cue is shown cleanly beside the line where it is called (G3).

The decisions behind it: a cue marks a position in the text and carries no timing data (D4); standbys and warnings are out of scope (D5); departments are configurable and cue numbers are free text typed by the stage manager, never changed by the tool (D7); cue lists are documentation only, with no console or playback export (D9).

One conflict shapes the whole capability (K3): ink is the fastest input, but handwriting is not data, and a cue written in ink never reaches the list. So pinning a cue must take under 3 seconds, or the stage manager will ink cues instead and the list will be empty.

Later requests, as received:

- **Ends, r1.0:** "support for end of cues (e.g. when a music should stop)". Until then a stop could only be written as another cue with "stop" in its description, which keeps the list flat: it cannot show what is running at a given line, or what was never stopped.
- **Change request, r1.3:** "not all video/audio cues need an end"; "fading can be another cue to signal the change or something an operator needs to remember"; a longer optional description shown only in the cue list; exports per department.
- **Change request, r1.8:** "cues more visible", part of a request about the look of the page (quoted in full in `09-workbench.md`). Read as: the tag and the box round the cue word must be found by colour at a glance; nothing about where a cue sits changes.
- **Change request, 2026-10-10:** "once one label for the cue is selected, cursor should be already to margin text as it's the most frequent field to fill, then tab should move to description".
- **Change request, 2026-10-10 (second):** "keep consisten the terms, now boards have remove and cues have delete. keep one and make a hotkey for it for when the cue is selected." Read as `[ASSUMED]`: "selected" is the cue whose box is open, since that is the only way a cue is picked.
- **Change request, r1.4:** quick notes to review after rehearsals; cue list printed only from its panel; separate columns for the margin text and the description; a shorter cue line with the cue word marked; a blank number becomes the last plus one.
- **After the first rehearsals, 2026-10-08, r1.6:** "Moving existing cues requires copy pasting the underlying annotation, would be much better to support press with mouse or finger and move it around until release."
- **Change request, 2026-10-11:** "bring back the feature of having a cue between lines, like blocks." Read as `[ASSUMED]`: a cue on a line of its own could always be pinned (CUE-2), but since r1.6 a dragged cue could land only on a word (CUE-32); a dragged cue must also be able to land between two blocks, at the place a line marks, as a dragged block does (TXT-28).

## 2. Requirements

### 2.1 Token and pin

```
ANNA: Chi è là? {LX 12 | blackout} Rispondi!
{SND | onda lunga}
```

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| CUE-1 | A cue is a token in the script text, `{DEPT label \| margin text \| description}`. Label, margin text and description are all optional. Being in the text, it survives every edit and is readable without the tool. | D4 `[LOCKED]` | r0; third field r1.3 | unit/parse, cue-ends |
| CUE-2 | A cue is attached to the word it follows, in dialogue or in an action, or stands alone on its own line. | D4 `[LOCKED]` | r0 | interact, unit/parse |
| CUE-3 | The stage manager never types the token. Tapping a word opens a pin with one button per department; one tap creates the cue. Label and texts can be added then or later. On a cue just pinned the cursor is already in the margin text, the field filled most often; Tab goes on to the description, Shift+Tab back to the number, Enter accepts (r1.9). With the pin open, the first letter of a department code pins from the keyboard. | K3 `[ASSUMED]` | r0 | interact |
| CUE-4 | Pinning takes the stage manager under 3 seconds. | K3 `[ASSUMED]` | r0 | not measured with a person; the tool's own part was 60 ms on a 375-page script |
| CUE-5 | Duplicate, missing and out-of-order labels are allowed. They are hints, never errors, and the tool never changes a number on its own. | D7 `[LOCKED]` | r0 | cue-ends (duplicates) |
| CUE-6 | Departments are configurable in Settings: code, name, colour. Changing a code does not rewrite cues already in the script. A cue whose department is not in the list is shown in grey and listed in Review. | D7 `[LOCKED]` | r0 | misc |

### 2.2 On the page

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| CUE-7 | A cue shows as a tag in the right margin with a line to its word. The label of the tag (department and number) is a block filled with the department colour, its text dark or white, whichever reads better; the label of an end is outlined, not filled. The "Cues" toggle hides tags, lines and boxes: a clean view for the writer. | D8 | r0, filled label r1.8 | interact, cuebox, shortcuts |
| CUE-8 | The cue word is boxed in the department colour with a light tint. Cues from several departments on one word give nested boxes, up to three. The line to the margin leaves from the bottom corner of the box. The box takes no space: adding a cue moves no text and flags no ink. | R0.1 delivery | r0.1 | cuebox |

### 2.3 Ends and linking cues

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| CUE-9 | An end is the token `{/DEPT label \| description}`. It can stand anywhere a cue can. It has no number of its own. It stays available for what an operator does by hand. | D17; token `[ASSUMED]`, position `[LOCKED]`, plain end `[LOCKED]` | r1.0 | cue-ends, unit/parse |
| CUE-10 | Pairing: an end closes the nearest earlier cue that is still open and has the same department and label. An end without a label closes the nearest earlier open cue of that department. An end that finds nothing is a hint, not an error. | K8 `[ASSUMED]` | r1.0 | cue-ends |
| CUE-11 | A linking cue is a cue of its own that ends others: `{SND 6 / SND 5 \| text}`. Targets are separated by ` / `, in any department: `{SND 9 / SND 6 / VID 2}`. Its own label may be empty: `{SND / SND 5}`. | request r1.3 `[LOCKED]` | r1.3 | cue-ends |
| CUE-12 | A part after ` / ` is a link only if it starts with an upper-case department code; otherwise the whole text is the label (`1/2`, `5 / 6`). This does not depend on the Settings list, so changing departments never changes how a script reads. | `[ASSUMED]` | r1.3 | cue-ends |
| CUE-13 | A linking cue closes its targets first, by the rule of CUE-10 for each, then stays open itself and can be ended later. A target not found is a Review hint. | `[ASSUMED]` | r1.3 | cue-ends |
| CUE-14 | No department is expected to end. A cue with no end is simply a cue. (The "runs" switch of r1.0 is gone; a `runs` value in an old `config.json` is ignored.) | request r1.3 `[LOCKED]` | r1.3 | cue-ends, templates |
| CUE-15 | Entering an end: tap a word; the popover has a row "End:" with the open cues before that point, most recent first, at most four. Only cues an end token can actually reach under CUE-10 are offered: the latest open cue of each department, and earlier ones whose number no later open cue repeats. One tap places the end and opens the cue editor, titled with the cue it closes. | `[ASSUMED]` | r1.0 | cue-ends |
| CUE-16 | In the margin an end tag is outlined instead of filled, with a stop square before the label, and the same connector line. A linking cue is drawn the same way; hovering shows what it ends. | `[ASSUMED]` | r1.0, r1.3 | cue-ends |
| CUE-17 | Running rail: a thin line in the department colour down the outer margin, right of the tags, from the start tag to the end tag, across pages, so what is running is visible on every page in between. One lane per overlapping cue, up to six lanes; a chain of linking cues shares one lane. | "Should" | r1.0 | cue-ends, frontmatter |
| CUE-18 | Edits carry through a pair, each as one undo. Renumbering a cue or changing its department: its end token and every link to it follow. Deleting a cue: its end token goes; a cue that linked to it stays, without the link. Deleting a linking cue: its targets are open again. This is the stage manager's own edit carried through, not renumbering (D7). | `[ASSUMED]` | r1.0, r1.3 | cue-ends |
| CUE-19 | In the editor of an end, "Make it a cue" turns `{/SND 5}` into `{SND / SND 5}` ready to be numbered; on a linking cue, "Make it a plain end" does the reverse. | as built | r1.3 | cue-ends |

### 2.4 Margin text, description, to-do notes, numbers

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| CUE-20 | The short text of a cue is called "Margin" and shows on the tag. The long one is called "Description" and shows in the cue list (screen, print, CSV), never in the margin; a dot on the tag marks that it exists. One paragraph. | request r1.3; names `[LOCKED]` r1.4 | r1.3, r1.4 | cue-ends, notes-todos |
| CUE-21 | A to-do note has no syntax of its own: it is a cue of a department ticked "To do" in Settings (`review: true` in `config.json`). | request r1.4 `[LOCKED]` | r1.4 | notes-todos |
| CUE-22 | A to-do note has a margin tag like any cue. It is left out of the cue list, its count, the CSV and the cue prints; it gets no number; it is never offered as something to end. Review lists the notes first, under "To do", counted in the badge; a tick removes the note from the script (one undo). | `[ASSUMED]` | r1.4 | notes-todos |
| CUE-23 | A new show has a department `TODO`, red (`#d62828`), ticked "To do". A show that already has its own department list is not changed. | `[LOCKED]` | r1.4 | notes-todos |
| CUE-24 | On a newly pinned cue only, a number left blank becomes the last label of that department before that point with its trailing number plus one: 5 gives 6, A12 gives A13, 5.5 gives 5.6. None before gives 1. A last label with no digits gives none. The field shows the number it will get. Pinning and numbering are one undo. Ends and to-do notes get no number. Nothing is renumbered (D7 stands): a cue placed between 5 and 6 becomes a second 6. | `[ASSUMED]` | r1.4 | notes-todos, interact |

### 2.5 Moving a cue

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| CUE-25 | A cue is moved by pressing its margin tag, dragging, and releasing on a word. | request r1.6 #4 `[LOCKED]` | r1.6 | cue-move |
| CUE-26 | Mouse and pen: the drag starts once the pointer has moved 8 px with the button or the tip down; the pen draws no ink. Finger: the tag must be held for 0.3 s without moving more than 8 px; it then lifts (a shadow) and can be dragged. A finger that moves earlier scrolls the page as before, also when the swipe starts on a tag. | finger hold `[ASSUMED]` | r1.6 | cue-move |
| CUE-27 | While dragging, a copy of the tag follows the pointer (14 px to the right and 36 px above it, scaled with the zoom), the tag itself is dimmed, and the target word is highlighted in the cue's colour. | as built | r1.6 | cue-move |
| CUE-28 | The target is the word under the pointer; otherwise the nearest word of the nearest line of text on that script page, if it is within 70 px at zoom 1. There is no target on the facing page, outside the pages, far from any text, or while the pointer is still over the tag being dragged. | as built | r1.6 | cue-move |
| CUE-29 | Within 48 px of the top or bottom of the work area the script scrolls, up to 14 px per frame and faster nearer the edge, so a cue can be carried to another page. | as built | r1.6 | cue-move |
| CUE-30 | Release on a target: the token is cut from its place and written after that word, behind the cues already there. Every field moves unchanged: number, margin text, description, links. One undo step. Release on the word the cue already follows as its last cue: nothing changes and no undo step is added. | "always after a word" `[ASSUMED]` | r1.6 | cue-move, unit/cue-move |
| CUE-31 | Release without a target, Escape, or a cancelled pointer: nothing changes. A press and release within 8 px still opens the cue editor. A pen or mouse tap that slips more than 8 px but stays on the tag does nothing. | as built | r1.6 | cue-move |
| CUE-32 | Every cue tag can be dragged (a board tag moves its whole line instead, TXT-28): cues, ends, linking cues, to-do notes, cues on a line of their own. A cue on its own line dropped on a word becomes a word cue and its line is removed; the blank lines above and below it merge, so no doubled blank line is left. A token written tight against the text (`uno{LX 1}due`) leaves a space where it was and gets one where it lands, so words are never joined. Until CUE-43 a cue could not be dropped onto a line of its own. | `[ASSUMED]` | r1.6 | cue-move, unit/cue-move |
| CUE-33 | A move that breaks a pair (an end above its start, a start below its end) is kept, and a message says the two no longer match. | as built | r1.6 | cue-move, unit/cue-move |
| CUE-34 | No drag while a block's text is being edited. While a drag runs, other pointers are ignored. | as built | r1.6 | cue-move |
| CUE-43 | A dragged cue can also be released between two blocks. The place is the space between two blocks of a script page, and 4 px (at zoom 1) into the text above and below it, or a line that holds only cues (its upper half: above it; its lower half: below it). There a line in the cue's colour marks the place, as for a block (TXT-30), and no word is highlighted; anywhere else CUE-28 applies. On release the token is cut from its place and written on a line of its own directly under the block above the place, every field unchanged, one undo step. A cue that has a line to itself moves as that line, with its blank lines (TXT-28). At the place where the cue already stands there is no line and a release changes nothing. Never inside speeches said together, nor inside a block that runs over two pages. CUE-33 applies. | request 2026-10-11 `[ASSUMED]` | next | cue-move, unit/cue-move |

### 2.6 Cue list and exports

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| CUE-35 | The cue list is computed from the tokens, one row per cue, and never stored (C7). Columns: Dept, No., Margin, Description, Act / scene, Cue line, P. The Description column appears only when a listed cue has one. A filter narrows the list to one department. | R0.7; columns `[ASSUMED]` r1.4 | r0, r1.4 | interact, notes-todos |
| CUE-36 | "Cue line" is two words, the cue word, two words, with `…` where the speech goes on. The word is boxed in the department colour, as on the page. A cue on its own line shows `▸` between the lines around it. | `[ASSUMED]` | r1.4 | notes-todos |
| CUE-37 | An end is a second line on its cue's row: where it ends (page, cue line) and the end's note; for a linking cue, which cue ended it. An end that closes nothing has a row of its own, marked with a square. A number used more than once in a department is marked. | `[ASSUMED]` | r1.0, r1.3 | cue-ends |
| CUE-38 | CSV export. The separator follows the system locale (`;` on Italian systems) so that Excel opens it directly. Columns never change position between releases; new ones are appended: End p., End line, End note (r1.0), Ended by, Ends, Description (r1.3). The headers are in the interface language; Act and Scene were in English in either language until r1.11. The cue word is in `[brackets]`. | R0.7, D9; review 2026-10-09, X10 | r0, r1.0, r1.3, r1.11 | interact, cue-ends |
| CUE-39 | Per department: "By dept (.zip)" saves one CSV per department in one file; "Print by dept" prints one sheet per department. A cue ended by another department's cue says so on its own sheet. | request r1.3 `[ASSUMED]` | r1.3 | cue-ends |
| CUE-40 | The cue list is printed from its own panel only. The Print button in the top bar offers the book and the script pages. | request r1.4 `[LOCKED]` | r1.4 | notes-todos |
| CUE-41 | Review lists ends with no cue to close and links whose target is not found, counted in the badge. | `[ASSUMED]` | r1.0, r1.3 | cue-ends |
| CUE-42 | With the box of a cue open and the cursor in none of its fields, the Delete key deletes the cue, as the "Delete" button does (one undo; an end goes with its cue as before). With the cursor in a field Delete removes a letter. The tooltip of the button names the key. | request 2026-10-10 `[ASSUMED]` | r1.9 | shortcuts |

## 3. Consequences

**Delete acts only when no field has the cursor.** A cue just pinned opens with the cursor in the margin text (CUE-3), so there Delete edits the text; the cue is deleted with the button, or after Tab has left the fields. Backspace never deletes a cue. The client tried the r1.9 features on a real show and reported "all working as expected" (2026-10-10). Which machine, pointer and keyboard were used is not recorded.

**The cursor starts in the margin text, not the number.** Since CUE-24 a new cue numbers itself, so the number is the field typed least. The cost: whoever does type the number now presses Shift+Tab first, and a field with the focus may bring up the on-screen keyboard on a laptop used without its keys; whether it does is not recorded.

**A cue has no identity beyond its place in the text.** It is found by its block and its offset in that block. Every popover that edits a cue looks it up again after each change. Moving, renumbering and deleting are all text edits, so each is one undo step and each is saved as part of `script.md`.

**Ink is not data (K3).** A cue written with the pen never reaches the cue list. The pin has to be faster than the pen; whether it is has not been timed with the stage manager.

**No renumbering (D7).** The tool fills a blank number on a new cue and nothing else. A cue placed between 5 and 6 becomes a second 6 and is marked as a duplicate. A renumber command with an old-to-new log is backlog, and it must keep cue pairs together.

**Pairs are found by position and label, so they can break.** A move can put an end above its start; the move is kept and a message says so. An end without a number re-pairs by position: if its cue's department is changed and another open cue of the new department sits between them, the end closes that one instead.

**A word or a line: the pointer's height decides (CUE-43).** The space between two blocks is 8 px at zoom 1, 16 px with the allowance into the text. That is narrow for a finger; it has not been tried on the laptop. The cost on the other side: 4 px at the top of a block's first line and at the bottom of its last line no longer pick a word. A cue dropped between blocks is written without a blank line above it, as the pin's "On its own line" does.

**Removing a token on its own line merges the blank lines around it.** This is a shared text edit, so since r1.6 it also applies to deleting a cue or a board: one blank line is left, not two.

**Gap between requirement and build.** CUE-5 says out-of-order labels are hints. As built, duplicates are marked in the cue list; nothing marks a label that is out of order. That hint is in the backlog.

**Compatibility.**

| Older release | What it does with newer tokens |
|---|---|
| r0.1 | Shows `{/…}` as cues of an unknown department. |
| r1.2 and earlier | Show `6 / SND 5` as the label and the description as part of the margin text. |
| r1.3 and earlier | Read TODO notes as ordinary cues of a department. |

**Not built:** the renumber command; the out-of-order hint; dragging board tags; dropping a cue onto a line of its own; dragging the boxed word instead of the tag; fades with durations as data (D4); automatic "everything stops at blackout" rules; standbys and warnings (D5).

**Not verified:** the finger hold, the pen drag and the palm behaviour during a cue drag are simulated only. Whether 0.3 s and 8 px suit a real finger is not known. Cue ends were built as assumed and never explicitly confirmed (Q25).
