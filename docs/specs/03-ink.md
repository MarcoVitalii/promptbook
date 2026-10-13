# Ink — INK

**Covers:** pen ink over the script text: how it is anchored, kept through edits, flagged and orphaned.
**Code:** `src/core.js` (ink bookkeeping, `reparse`), `src/view.js` (ink drawing, `beginInk`, `eraseAt`, `openFlagPop`).
**Checks:** `test/interact`, `test/misc`, `test/scale-folder`, `test/notes-todos`, `test/frontmatter`.
**Columns and tags:** explained in `SPEC.md`, "How to read this specification". Ink on boards is in `04-boards.md`; which pointer draws is in `05-input.md`.

---

## 1. Intent

The stage manager annotates by hand, and ink is the fastest input there is. Ink over the script text is required (D6).

It collides with goal G1, text that can be edited freely (K4): ink is positioned by coordinates, and text reflows. In the old workflow every script edit meant re-aligning every drawing on every page after it. The intent here is to shrink that to the lines that actually changed.

## 2. Requirements

| ID | Requirement | Basis | Checked by |
|---|---|---|---|
| INK-1 | The pen draws over script pages. The eraser removes the strokes it touches. Four colours (red, blue, green, black). Every stroke, erasure and "Clear ink" is one undo step. | D6 `[LOCKED]` | interact |
| INK-2 | Each speech, action and heading is a block. A stroke belongs to the block it starts in and is stored relative to that block, in units of the text size (15 px), from the top-left corner of the block's text column. In simultaneous speech a stroke belongs to the speech of its column. | K4 `[ASSUMED]` | interact, misc |
| INK-3 | The page has a fixed measure: fixed column widths and one embedded open-licence font, so line breaks are the same on screen, at any zoom and in print. Zoom scales the page; it never reflows it. | K4 `[ASSUMED]` | misc |
| INK-4 | With every inked block the ink file keeps a snapshot of the block's text and its line count. On load: text unchanged, ink as it is; text changed, ink shown with a "check" flag; block gone, ink listed as orphaned. | K4 `[ASSUMED]` | scale-folder |
| INK-5 | After an edit, inside or outside the tool, blocks are matched again by exact text first, then by order and similarity, and ink follows its block. Ink on an untouched block is never disturbed. | K4 `[ASSUMED]` | scale-folder, misc |
| INK-6 | The snapshot is the block's text with cue tokens removed: adding, editing, moving or deleting a cue never flags ink. | K4 | interact, cue-ends |
| INK-7 | The flag is a red "!" beside the block. Tapping it offers "Ink is fine" or "Clear ink on this block". Flagged blocks are listed in Review. | K4 `[ASSUMED]` | interact |
| INK-8 | Orphaned ink is kept in the file and listed in Review, where it can be deleted. Undoing the deletion of the text re-attaches it, with no flag. | K4 `[ASSUMED]` | misc |
| INK-9 | Ink on a block that is commented out is set aside as orphaned and comes back when the block is restored unchanged. | `[ASSUMED]` | notes-todos |
| INK-10 | Pen ink on the front page or the character page belongs to the frontmatter block and stays on the page it was drawn on. | `[ASSUMED]` | frontmatter |
| INK-11 | The "Ink" toggle hides all ink and flags on screen. | as built | — |

## 3. Consequences

**Re-alignment is not eliminated, it is contained (K4).** An edit elsewhere never disturbs ink. Editing the inked block itself flags its ink for a look. The work shrinks from "every page after the edit" to "the lines that changed".

**The whole layout is frozen to make ink hold.** Fixed column widths, a font carried inside the file (about 110 KB of it), no reflow on zoom, a page geometry that is locked (PAG-1). Anything that changes a word's width changes line breaks and so ink position: this is why emphasis (bold) is not in the format, and why adding a cue paints a box that takes no space (CUE-8).

**A flag also rises when the line count changes.** The snapshot holds text and line count; a block whose text is the same but which now breaks over a different number of lines (another paper size, for example) is flagged too.

**A stroke on a split speech belongs to one fragment.** When a speech runs over two pages, a stroke is drawn on the fragment where its first point lies.

**Ink is handwriting, not data (K3).** Nothing written with the pen is read by the tool.

**Not built:** highlighter, straight line and typed note tools; re-attaching orphaned ink by hand.

**Not verified:** nothing was tried with a real pen; the pen's eraser end could not be simulated (the barrel-button path was). Ink position on paper against the screen was never compared on a printer.
