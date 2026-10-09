# Boards and templates — BRD

**Covers:** blocking boards on the facing page, their arrangement, names and grid; board templates.
**Code:** `src/view.js` (facing page and boards, templates), `src/core.js` (`facingLayout`, `normCfg`).
**Checks:** `test/boards`, `test/unit/boards`, `test/templates`, `test/interact`, `test/zipshow`.
**Columns and tags:** explained in `SPEC.md`, "How to read this specification". In the client's requests "block" means a blocking board.

---

## 1. Intent

The stage manager draws blocking on a stage plan, until now in Excalidraw. Excalidraw is a third-party library and cannot be inside the tool (C1, K5). The intent is a built-in drawing surface that is enough for blocking, placed beside the script lines it belongs to.

The client accepted a pen-only board (no shapes, arrows, text objects or movable props) on one condition: reusable stage backgrounds (D16).

Requests, as received:

- **Templates:** "templated backgrounds for blocks (like grayed out in the active block)"; from Q18: "a template setup to quickly draw on top of stage draws + props"; from Q22: "keep templates as special blocks marked as template. this allows to have a template depending on another template. No movable prop objects."; from Q26: "live in configurations so they don't appear in the final script".
- **After the first rehearsals, 2026-10-08:**
  1. "Adding blocks on a single page makes just a column with plenty of white space. Might be better to use fully the page by providing flexibility in their arrangements, for example limit to 8 per page in 2 columns. Would fill first a column, then moving on Z pattern with 2 columns. So 2 are 1 column, 3 are 1 - 2 / 3 - blank, 4 are 1 - 2 / 3 - 4, 5 are 1 - 2 / 3 - 4 / 5 - blank etc."
  2. "Add names to the blocks that don't disappear into the options when we have many on the page, like leaving menu on top and name at the bottom."
  3. "Having a light gray fine grid helps a lot when doing blockings."

**Reading applied** `[ASSUMED]`: a template is a board that other boards are drawn on top of; underneath, it shows greyed out.

## 2. Requirements

### 2.1 Boards

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| BRD-1 | A board is an image (stage photo, ground plan, or blank) with an ink layer. It is drawn on with the same pen and eraser as the script. | D16 `[LOCKED]`, R0.6 | r0 | interact |
| BRD-2 | A standalone `{BOARD name}` token in the script marks where a board applies. It is shown on the facing page of the script page its token falls on. | R0.6 | r0 | interact, scale-folder |
| BRD-3 | Ways to add one: "+ Board" on the facing page, "Board here" in the tap popover, or pasting an image from the clipboard. | R0.6 | r0 | interact, parse-undo |
| BRD-4 | Images over 1.5 MB are reduced to 2000 px on the long side and stored as JPEG. As built, so are images longer than 2600 px and images that are not JPEG, PNG or WebP. | as built | r0 | — |
| BRD-5 | Removing a board removes its token from the script. Its file stays in `boards/`. | as built | r0 | boards |
| BRD-6 | Boards have the pen only: no shapes, arrows, text objects, selection or movable props. | D16 `[LOCKED]` | r0 | — |

### 2.2 Arrangement, name, grid

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| BRD-7 | One or two boards on a facing page are stacked in one column, at the size they had before r1.6. Three or more are set in two columns, filled row by row (1 2 / 3 4 / 5 –), in the order of their tokens. All boards of a page get one width; a row is as tall as its taller board; nothing leaves the page body and "+ Board" stays below the boards. Print uses the same arrangement. | request r1.6 #1 `[LOCKED]` | r1.6 | boards, unit/boards |
| BRD-8 | At most 8 boards per page through the interface: "+ Board", "Board here" and image paste refuse a ninth with a message. A page whose text holds more `{BOARD}` tokens still shows them all, in two columns with more rows. | `[ASSUMED]` | r1.6 | boards, unit/boards |
| BRD-9 | A board figure is, top to bottom: a button row (26 px), the drawing, the name (20 px). The name is centred, always shown and printed, cut with an ellipsis when wider than the drawing; its tooltip gives the full name. A tap on the name opens the rename popover. The pen does not draw on the name. The Templates view uses the same figure. | request r1.6 #2 `[LOCKED]` | r1.6 | boards |
| BRD-10 | A facing-page figure narrower than 420 px shows one "⋯" button instead of its buttons; it opens a popover headed by the board's name with the same actions. Template sheets always show all their buttons. In print the button row is hidden but keeps its height, so paper and screen have the same layout. | `[ASSUMED]` | r1.6 | boards |
| BRD-11 | Every board and template shows a light grey grid, drawn over the board's image and the greyed template chain and under the ink; one grid per figure, not one per layer. Every fourth line is a little stronger. Lines are hairlines at any size and zoom. | request r1.6 #3 `[LOCKED]` | r1.6 | boards |
| BRD-12 | The grid step is a show setting (Settings → "Board grid"): Off, Fine (25 board units, 1/40 of the width; the default) or Coarse (50 units). It is not a toolbar button and not a setting per board. | `[ASSUMED]` | r1.6 | boards, unit/boards |
| BRD-13 | The grid is display only: not stored in any board file, ignored by the pen, the eraser and "Clear ink", and the ink does not snap to it. It prints when it is on, on boards. It has its own strength for day, night and print, always lighter than a faded template. | `[ASSUMED]` | r1.6 | boards |

### 2.3 Templates

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| BRD-14 | A template is a board kept in the show's configuration. It has an image or not, it has ink, it is drawn on with the same pen. It has no `{BOARD}` line in `script.md`. | D18 `[LOCKED]` | r1.0 | templates |
| BRD-15 | A board may name one template as its base. A template may have a base too, so templates chain: bare stage, stage with Act 1 furniture, a scene's blocking. | D18 `[LOCKED]` | r1.0 | templates |
| BRD-16 | The base is a live link, not a copy. Change a template and every board built on it, at any depth, shows the change. | D18 `[LOCKED]`, follows from "depending on" (Q23) | r1.0 | templates |
| BRD-17 | The whole chain under a board is drawn first, desaturated and faded to one strength (Settings: 25, 40, 55 or 70%; default 40%). The board's own image and ink sit on top at full strength. It prints grey. | `[ASSUMED]` | r1.0 | templates |
| BRD-18 | On a board, everything that comes from its chain is locked. Pen and eraser act only on that board's own ink. To change a prop, open the template it was drawn in. | `[ASSUMED]` | r1.0 | templates |
| BRD-19 | Props are drawn with the pen into a template. A different arrangement is another template, usually based on the first. No objects to select, move or rotate. | D16, K9 `[LOCKED]` | r1.0 | — |
| BRD-20 | A board with a base takes the proportions of the root of its chain, so coordinates line up through the chain. | `[ASSUMED]` | r1.0 | templates |
| BRD-21 | Making a template: in the Templates view, new blank, new from an image, or new based on another template. From the script: "To templates" on any board copies its image and ink into a new template and leaves the board as it is. | `[ASSUMED]` | r1.0 | templates |
| BRD-22 | Using one: with no templates, or with a default template, adding a board is one tap. With templates and no default, a short list asks what to draw on: templates, last used first, then "Blank". A board's base can be changed later ("Base…") without losing its ink. | `[ASSUMED]` | r1.0 | templates |
| BRD-23 | A board cannot be based on itself, directly or through the chain. The picker does not offer choices that would close a loop. | `[ASSUMED]` | r1.0 | templates |
| BRD-24 | Renaming a template updates everything based on it. A template that something is based on cannot be deleted; the tool names what depends on it. Deleting an unused template can be undone. Two templates cannot have names that would be saved under the same file name. | `[ASSUMED]` | r1.0 | templates |
| BRD-25 | Templates live in the configuration and are edited in a Templates view (menu → "Templates…", or the button in Settings), which replaces the script on screen: each template on a sheet of its own, with its chain greyed beneath, the usual pen, eraser and undo, "+ Template" and "Back to script" on a bar that stays in view. Templates never appear on a facing page, in the cue list, or in any print. | Q26 `[LOCKED]`; the view itself `[ASSUMED]` | r1.0 | templates |
| BRD-26 | Each template sheet has: Rename, Base, Image…, Default (star), New based on this, Clear ink, Delete. | as built | r1.0 | templates, boards |
| BRD-27 | A default background set with "Use as default" before r1.0 keeps working until a default template is chosen, which then takes its place. Nothing is converted. | `[ASSUMED]` | r1.0 | templates |

## 3. Consequences

**Less than Excalidraw, on purpose (K5).** Pen, eraser, colours, images. No shapes, arrows, text objects or selection. Accepted for now (Q18), with templates as the condition (D16).

**Props cannot be moved (K9).** A different arrangement of furniture is another template. An object layer with selection and dragging was ruled out (Q22).

**"Marked as template" and "live in configurations" pull apart (K10).** A board exists by having a line in the script; a template must have none. So the mark is where it is kept: same file shape, same pen, but listed in `config.json`, edited in its own view, left out of script and print. A script board cannot be marked in place; it is copied to the templates.

**"In configurations" was read as "part of the show's settings"**, not as strokes written inside `config.json`, which would make that file too large to edit by hand. Each drawing is a file `templates/<name>.json`. The client has not vetoed this reading.

**A live link cuts both ways.** A change to a template shows on every board built on it, including boards finished weeks ago. To keep them, make a new template based on the old one instead of editing it.

**Shape follows the root.** If the root template later gets an image with other proportions, ink already drawn on boards built on it keeps its coordinates and may no longer sit where it did.

**An image on a board that has a base hides the base.** It is drawn over it. Remove the base or the image, whichever is not wanted.

**Files are named after the board.** A drawing is saved as `boards/<name>.json` with the name in lower case, accents and punctuation dropped, spaces as hyphens. Two templates may not share a file name (BRD-24); nothing stops two boards from doing so, and then one drawing replaces the other (`docs/review-2026-10-09.md`, X1). Files of deleted or renamed boards and templates are left behind; unused images are dropped from a show file on save (STO-9).

**r1.6 changed how existing shows look.** A page with three or more boards is rearranged, and every board gains the fine grid, on screen and in print. In two columns every figure is under 420 px wide (about 360 px on A4), so every board on such a page shows "⋯"; two boards with tall images can fall under 420 px too.

**A board added after the last block of a page can land on the next page.** That edge is accepted.

**Not built:** movable or rotatable prop objects; more than one base per board; per-layer fade strengths; basing a board on another script board; printing a template sheet; dragging board tags and reordering boards; snap to grid; a grid step per board.

**Not verified:** the grid strengths were set on screenshots by the build, lower than first planned; how they look on the real screen and on paper is not known, and hairlines may print faint on a laser printer. The two-column arrangement was never printed. The five `[ASSUMED]` decisions of r1.6 (BRD-8, BRD-10, BRD-12, and CUE-26, CUE-30) were shown to the client, who did not object and did not confirm.
