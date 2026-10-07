# Digital Prompt Book — Specification

**Status:** v0.9 — 2026-10-07 — r1.1 built, not yet committed or tagged: frontmatter, front page, character page with aliases (§5.12) on top of r1.0. Checked in a simulated browser only; neither r1.0 nor r1.1 has run on the rehearsal laptop.
**Rehearsal deadline:** 2026-10-08
**Companion file:** `PLAN.md`

`[LOCKED]` = decided by the client's answers. `[ASSUMED]` = my reading, stands unless vetoed. `[OPEN]` = still blocks something.

Change from v0.1: the answers remove the need for Pandoc, Typst, Downstage, Fountain, Dataview and an Obsidian plugin. The product is now one HTML file.

Change in v0.4: §5 and §7 now describe what was built. Differences from the v0.3 design are listed in §5.9.

Change in v0.5: the client's answers to Q15–Q21 are recorded (§9). R1 is redefined as two features asked for by the client: board templates (§5.10) and cue ends (§5.11). The former R1 list becomes the backlog.

Change in v0.6: Q22 answered. Templates are no longer a separate store; a template is a board with a mark, and boards can be chained (§5.10 rewritten). Cue words are now boxed instead of underlined (§5.3, built).

Change in v0.7: Q26 answered. Templates live in the configuration, not in the script: no line in `script.md`, never on a facing page, never printed (§5.10 revised, D18 reworded, K10 added).

Change in v0.8: Q24 answered ("build it now"). R1 is built and released as r1.0. §5.10 and §5.11 each end with an "As built" list; §7 carries the test record. Releases are versioned in git (PLAN §8).

Change in v0.9: the script can start with a frontmatter block: title and other details for a front page, and a character list that speeches are checked against (§5.12, D19). Built as r1.1.

---

## 1. Problem

The script is plain text in Word (`CHARACTER: dialogue`, actions in parentheses). The stage manager (SM) annotates a printed export inside Excalidraw. Every script edit forces re-export, re-import and re-alignment. Cue lists are compiled by hand.

## 2. Goal

1. Script edits never require re-importing or re-aligning.
2. Cue lists are generated from the annotated script.
3. Cues are shown cleanly beside the line where they are called.
4. Printable.
5. Fast enough to use live in rehearsal, pen in hand.
6. Zero install, runs in a browser.

## 3. Decisions

| # | Decision | Source | Status |
|---|---|---|---|
| D1 | Obsidian is allowed but nothing depends on it. The tool is browser-native. The show folder may live inside the vault. | Q1, Q5 | `[LOCKED]` |
| D2 | Word is abandoned after a one-time move. | Q2 | `[LOCKED]` |
| D3 | The script format is the convention already in use, plus `#` headings and one cue token. No new markup language. | Q2, Q12 | `[LOCKED]` |
| D4 | A cue marks a position in the text. It can sit on a word in dialogue, on a word in an action, or stand alone between lines. No timing data. | Q3 | `[LOCKED]` |
| D5 | Standbys and warnings are out of scope for now. | Q3 | `[LOCKED]` |
| D6 | Ink over the script text is required. | Q4 | `[LOCKED]` |
| D7 | Departments are configurable. Cue numbers are free text typed by the SM, optional, never auto-changed. Renumbering is an explicit, optional command. | Q6 | `[LOCKED]` |
| D8 | Page layout per §6. | Q7 | `[LOCKED]` |
| D9 | Cue lists are documentation only. No console or playback export. | Q8 | `[LOCKED]` |
| D10 | Storage is a plain folder. Git is optional and external. | Q9 | `[LOCKED]` — amended in r1.2: the same files now live in one `.zip` show file, to make moving a show easy. Older folders still open. Git no longer sees the individual files. |
| D11 | Calling the show from the tool means a follow-along view for the stage manager alone. No synced screens. Postponed to R2. | Q11, Q16 | `[LOCKED]` |
| D12 | "Zero dependencies" means: one HTML file, no install, no server, no build step, no third-party libraries. The only third-party content is one embedded font (Inter, SIL Open Font License 1.1). | Q5 | `[ASSUMED]` |
| D13 | The editing device is a laptop with touchscreen and pen. R0 is built and tested for that device only. | Q14 | `[LOCKED]` |
| D14 | Input is split by pointer type, with no mode switch: pen draws, finger or mouse taps and scrolls (§5.7). | follows from D13 | `[ASSUMED]` |
| D15 | One editor. Script text is edited in one place at a time; no merge, no co-editing. | Q15 | `[LOCKED]` |
| D16 | Boards keep the built-in pen only (no shapes, arrows, text objects, no movable props), on condition that reusable stage backgrounds exist: board templates, §5.10. | Q18, Q22 | `[LOCKED]` |
| D18 | A template is a board in every respect but one: it is kept in the show's configuration instead of having a place in the script. Same data, same pen. A board can be based on a template, and a template can be based on another template. Based-on is a live link, not a copy. | Q22, Q26 | `[LOCKED]` |
| D19 | The script may start with a frontmatter block between two `---` lines. Its values are printed on a front page in the order written, the title larger. A `characters` list in it is the reference for checking speaker names; group names such as ALL, OTHERS, ALL BUT x are never checked. This extends D3: still no new markup inside the script body. | client, v0.9 | `[LOCKED]` in principle, details `[ASSUMED]` |
| D17 | A cue can have an end, marked at its own position in the text (§5.11). An end is a position, like the cue itself; still no timing data (D4). | client, v0.5 | `[LOCKED]` in principle, design `[ASSUMED]` |

## 4. Conflicts in the answers

| # | Conflict | Resolution applied | Status |
|---|---|---|---|
| K1 | Rehearsal in 2 days vs. live calling (Q11), collaboration parity with Word (Q2), ink (Q4) and the full print layout (Q7). | Tiered scope, §7. Only R0 is promised for 2026-10-08. Live calling and anything beyond single-editor collaboration are not in R0. | Accepted (Q17) |
| K2 | "Equivalent flexibility in collaboration" (Q2) vs. "unversioned on the only PC that has it" (Q9). One of these does not describe reality. If the script lives on one PC, there is no concurrent collaboration today to be equivalent to. | One editor at a time (D15). | Resolved (Q15) |
| K3 | Ink is the fastest input (Q4) vs. generated cue lists (goal 2). Handwriting is not data. A cue written in ink never reaches the cue list. | Two inputs side by side: tap a word to drop a cue pin (structured, feeds the list); ink for everything else. Pinning must take under 3 seconds or the SM will ink cues instead and the list will be empty. | `[ASSUMED]` |
| K4 | Ink over text (Q4) vs. editable text (goal 1). Ink is positioned by coordinates; text reflows. | Ink belongs to one text block, not to a page (§5.4). Edits elsewhere never disturb it. Editing the inked block itself flags its ink for a look. This does not eliminate re-alignment; it shrinks it from "every page after the edit" to "the lines that changed". | `[ASSUMED]` |
| K5 | Zero dependencies (Q5) vs. the SM's current Excalidraw habit. Excalidraw is a third-party library and cannot be inside the tool under D12. | Built-in pen replaces it: pen, eraser, colours, images. No shapes, arrows, text objects or selection in R0. This is less than Excalidraw offers. | Accepted for now (Q18), with templates as the condition (D16) |
| K6 | "Any browser" vs. saving to a folder. Writing straight into a folder works only in Chrome and Edge; Firefox and Safari do not support it. | Folder mode is the R0 path (D13). Project-file mode moves to R1, needed only if a second device or another browser appears. | Resolved, given A7 |
| K7 | "Italian should not be relevant" (Q10). It is, slightly: accented capitals in names, and colons inside dialogue. | Parser is Unicode-aware; rule in §5.2. The real script is not shared (Q20); misread lines are fixed by hand in the tool, guided by the Review panel. | Accepted (Q20) |
| K8 | Cue ends (D17) vs. D7. An end has to find its start, but labels are optional, free text and may repeat. | Pairing rule in §5.11: same department and label, nearest open cue before it; with no label, nearest open cue of that department. An end that finds nothing is a hint, not an error. | `[ASSUMED]` |
| K9 | Board templates with props (Q18) vs. K5. If props must be picked up and moved on each board, that is an object layer with selection and dragging, which K5 excluded. | Props are drawn with the pen into a template. A different arrangement is another template, usually based on the first. No movable objects. | Resolved (Q22, D18) |
| K10 | "Templates as special blocks marked as template" (Q22) vs. "live in configurations so they don't appear in the final script" (Q26). A board exists by having a line in the script; a template must have none. | The mark is where it is kept. A template has the same file shape and is drawn with the same pen, but it is listed in the configuration, edited in a Templates view, and left out of script and print. A script board cannot be marked in place; it is copied to the templates. | `[ASSUMED]` |

## 5. Design

### 5.1 Files

```
show/
  promptbook.html        the tool; open in Chrome or Edge (it can also live elsewhere)
  script.md              the script; hand-editable anywhere, including Obsidian
  script.ink.json        ink strokes, keyed to text blocks
  boards/                one .json per board (ink) plus its image file
  templates/             one .json per template plus its image file (r1.0)
  config.json            title, paper size, departments, list of templates and the default one
```

The tool asks once for the show folder and offers to reopen it on the next start. Chrome and Edge refuse the top level of Desktop, Documents and Downloads; a sub-folder is fine.

Cue lists are computed on screen and exported on demand (`cues.csv`, print). Nothing generated is stored as a source.

### 5.2 Script text

What the writer types, unchanged from today:

```
# ATTO PRIMO
## Scena 1

(Buio. Si sente il mare.)

ANNA: Chi è là? (si volta) Rispondi!
MARCO: Sono io.
& ANNA: Non ti credo!
```

| Line | Meaning |
|---|---|
| `# text`, `## text` | Act, scene |
| `NAME: text` | Speech. NAME is everything before the first colon when it contains no lowercase letters other than the connectors `e`, `ed`, `and`, `&`. Unicode letters count. |
| `(text)` on its own line | Action |
| `(text)` inside a speech | Inline direction, shown in italics |
| `& NAME: text` | Spoken at the same time as the speech above. Any number may be chained. |
| any other line | Continuation of the block above |

Lines the parser cannot classify are listed for review, never dropped.

Tolerances added while building, to cope with a pasted Word text:

- A line starting with `ATTO`, `SCENA`, `PROLOGO`, `EPILOGO`, `QUADRO`, `PARTE`, `INTERVALLO`, `FINE` (and the English equivalents) is a heading even without `#`.
- `NAME (direction): text` is a speech; the direction is shown in italics.
- `NAME:text` and `NAME : text` are accepted. `10:30` inside a line is not mistaken for a speaker.
- An action that starts with `(` and closes on a later line is one block.
- A level-1 heading starts a new page.
- A speech longer than the space left on the page is split by lines; the second part is labelled `(segue)` (`(cont.)` in the English interface).
- The Review panel lists every character name with a count. A name that appears once is usually a typo or a misread line.

### 5.3 Cues

Stored in the text, so they survive every edit and are readable without the tool:

```
ANNA: Chi è là? {LX 12 | blackout} Rispondi!
{SND | onda lunga}
```

- `{DEPT label | description}`. Label and description are both optional.
- Attached to the word it follows, or standalone on its own line.
- The SM never types this. Tapping a word opens a pin with department buttons; number and description can be added then or later.
- Duplicate, missing and out-of-order labels are allowed and shown as hints, not errors (D7).
- Shown as a coloured tag in the right margin with a line to the word. A "clean" view hides them for the writer.
- The cue word itself is boxed in the department colour with a light tint (build R0.1; it was an underline in R0). Cues from several departments on one word give nested boxes, up to three. The line to the margin leaves from the bottom corner of the box. The box is painted without taking space, so adding a cue still moves no text and flags no ink.

### 5.4 Ink

- Each speech, action and heading is a block. A stroke belongs to the block it starts in and is stored relative to that block, in text-size units.
- The page has a fixed measure: fixed column widths and one embedded open-licence font, so line breaks are the same on screen, at any zoom and in print. Zoom scales the page; it never reflows it.
- With every inked block the file keeps a snapshot of the block's text and line count. On load: text unchanged → ink as is; text changed → ink shown with a "check" flag; block gone → ink listed as orphaned.
- Blocks are re-matched after external edits by exact text first, then by order and similarity.
- The flag is a red "!" beside the block. Tapping it offers "Ink is fine" or "Clear ink on this block".
- Orphaned ink is kept in the file and listed in the Review panel, where it can be deleted. Undoing the text deletion re-attaches it. Re-attaching by hand is R1.

### 5.5 Boards (facing page)

- A board is an image (stage photo, ground plan, or blank) with an ink layer.
- A standalone `{BOARD name}` token in the script marks where it applies.
- Up to r0.1 a ground-plan image could be set as the default background ("Use as default"). r1.0 replaces that button with templates (§5.10): "Base…" chooses what a board is drawn on, "To templates" copies a board into the templates. A default background set earlier keeps working until a default template is chosen.
- Ways to add one: "+ Board" on the facing page, "Board here" in the tap popover, or paste an image from the clipboard.
- Images over 1.5 MB are reduced to 2000 px on the long side and stored as JPEG.
- Removing a board removes its token from the script. Its file stays in `boards/`.

### 5.6 Cue list

Table computed from the tokens: department, label, description, act/scene, the words around the cue, page. Filter by department. Print and CSV.

### 5.7 Input model

The laptop reports pen, finger and mouse as different pointers. The tool uses that instead of a tool palette:

| Pointer | On a script page | On a board |
|---|---|---|
| Pen tip | Draws ink | Draws ink |
| Pen eraser end or barrel button | Erases strokes it touches | Same |
| Finger tap on a word | Opens the cue pin | — |
| Finger drag | Scrolls | Scrolls |
| Finger tap between blocks | Standalone cue or board | — |
| Mouse | As finger. A toolbar toggle lets the mouse draw, for machines without a pen. | Same |

- Touches are ignored while the pen is down and for about half a second after it lifts.
- While the pen hovers near the screen, a touch can still tap quickly to pin a cue, but it cannot scroll, long-press, or be a large contact. This is the palm rule; it is untested on real hardware.
- Because the page must not scroll under the pen, finger scrolling is done by the tool itself, not by the browser. Pinch-zoom is replaced by the zoom buttons.
- The pen can tap margin tags, the ink flag and board buttons.
- The cue pin shows one button per department. One tap creates the cue; label and description fields are there but optional.
- Double-tap, double-click or long-press on a block opens its text for editing. "Edit text" in the tap popover does the same.
- Keyboard: undo/redo, and a letter per department to pin at the last tapped word.

### 5.8 Data shapes

`config.json`

```json
{ "paper": "A4",
  "departments": [
    { "code": "LX",  "name": "Luci",  "colour": "#d9a400" },
    { "code": "SND", "name": "Audio", "colour": "#2b7de9" },
    { "code": "VID", "name": "Video", "colour": "#7a3fd1" } ] }
```

`script.ink.json`

```json
{ "version": 1,
  "blocks": [
    { "text": "ANNA: Chi è là? Rispondi!",
      "lines": 1,
      "strokes": [ { "colour": "#c00", "width": 0.12, "points": [[0.4,0.2],[0.9,0.25]] } ] } ] }
```

`text` is the block with cue tokens removed, so adding a cue does not flag the ink. Coordinates are in units of the text size (15 px), from the top-left corner of the block's text column.

As built, a block entry may also carry `inked` (the text as it was when the ink was drawn, present only while the ink is flagged), and the file may carry an `orphans` list of the same shape.

`boards/<name>.json` has the same stroke shape plus `name`, `image` (file name), `w` (always 1000) and `h`. Board coordinates are in those units, so ink scales with the board.

`config.json` also holds `title` and `defaultBoard` (`image`, `h`). Since r1.0: each department has `runs` (true/false); `templates` (names, in order), `defaultTemplate`, `recentTemplates` and `templateFade` (0.15–0.8). Board files may carry `base`; `templates/<name>.json` has the board shape plus `base`.

### 5.9 As built: differences from the v0.3 design

Added, because they were cheap and reduce risk on the day:

| Addition | Why |
|---|---|
| In-browser fallback with backup export / import (one `.promptbook.json` file) | The tool stays usable in any browser and before a folder is chosen. This is most of R1's "project-file mode". |
| Reopen last folder | One click to resume. |
| Outside-change guard on `script.md` | If the file is edited in Obsidian while the tool is open, the tool reloads it; if both sides changed, it asks instead of overwriting. |
| Settings: title, paper (A4 / Letter), departments | D7 says departments are configurable. |
| Review panel | R0.1 requires the list of unclassified lines; flagged ink, orphaned ink, unknown departments and character counts ride along. |
| Duplicate-number mark in the cue list | A hint only (D7). |
| Find, and jump to act / scene | Pages are drawn only when near the screen, so the browser's own find cannot see the whole script. |
| Night mode | Dark theatre. Print is always light. |
| Italian and English interface | Picked from the browser language; switchable. |

Different:

| v0.3 | As built |
|---|---|
| Embedded font unspecified | Inter, Latin subset, three faces, about 110 KB of the file |
| Folder mode only in R0 | Folder mode plus the fallback above |
| CSV | Separator follows the system locale (`;` on Italian systems) so Excel opens it directly |
| Facing page shows boards | In print the facing page is always emitted, blank when the script page has no board |

Not built: renumber command, clean-script export, re-attaching orphaned ink by hand, highlighter / line / text tools, "changed since last print" marks.

### 5.10 Board templates — R1, built in r1.0

**Request as received:** "templated backgrounds for blocks (like grayed out in the active block)"; from Q18: "a template setup to quickly draw on top of stage draws + props"; from Q22: "keep templates as special blocks marked as template. this allows to have a template depending on another template. No movable prop objects."; from Q26: "live in configurations so they don't appear in the final script".

**Reading applied** `[ASSUMED]`: "block" here means a blocking board (§5.5). A template is a board that other boards are drawn on top of; underneath, it shows greyed out.

| Point | Design | Status |
|---|---|---|
| What a template is | A board kept in the configuration. It has an image or not, it has ink, it is drawn on with the same pen. It has no `{BOARD}` line in `script.md`. | `[LOCKED]` D18 |
| Based on | A board may name one other board as its base. A template may have a base too, so templates chain: bare stage → stage with Act 1 furniture → a scene's blocking. | `[LOCKED]` D18 |
| Live link | The base is referenced, not copied. Change a template and every board built on it, at any depth, shows the change. | `[LOCKED]`, follows from "depending on" (answers Q23) |
| How it looks | The whole chain under a board is drawn first, desaturated and faded to one strength (default about 40%, one setting). The board's own image and ink sit on top at full strength. Prints grey. | `[ASSUMED]` |
| Protection | On a board, everything that comes from its chain is locked. Pen and eraser act only on that board's own ink. To change a prop, open the template it was drawn in. | `[ASSUMED]` |
| Props | Drawn with the pen into a template. No objects to select, move or rotate. | `[LOCKED]` D16 |
| Shape | A board with a base takes the base's proportions, so coordinates line up through the chain. | `[ASSUMED]` |
| Making one | In the Templates view: new blank, new from an image, or new based on another template. From the script: "Copy to templates" on any board; its image and ink become a new template and the board itself is left as it is. | `[ASSUMED]` |
| Using one | "+ Board" and "Board here" offer the templates as one-tap choices, last used first, plus "blank". One template can be the default; then adding a board stays a single tap. A board's base can be changed later without losing its ink. | `[ASSUMED]` |
| Loops | A board cannot be based on itself, directly or through the chain. The picker does not offer choices that would close a loop. | `[ASSUMED]` |
| Rename, delete | Renaming a template updates everything based on it. A template that something is based on cannot be deleted; the tool names what depends on it. | `[ASSUMED]` |
| Where a template lives | In the configuration. Settings gains "Templates", which opens a Templates view: each template on a sheet of its own, with its chain greyed beneath, drawn on with the usual pen, eraser and undo. Templates never appear on a facing page, in the cue list, or in any print. | `[LOCKED]` Q26; the view itself is `[ASSUMED]` |
| Files | `config.json` lists the templates (`templates`: names in order) and `defaultTemplate`. Each drawing is a file `templates/<name>.json` with the board file shape plus `base`, and its image beside it. `boards/<name>.json` gains `base`. Reading applied: "in configurations" means part of the show's settings, not that the strokes are written inside `config.json`, which would make that file too large to edit by hand. | `[ASSUMED]` |
| Migration | Nothing to convert. The existing "Use as default" background keeps working until a default template is chosen, which then takes its place. | `[ASSUMED]` |

Out of scope for R1: movable or rotatable prop objects, more than one base per board, per-layer fade strengths, basing a board on another script board, printing a template sheet.

As built in r1.0:

- Way in: menu → "Templates…", or the "Templates…" button in Settings. The view replaces the script on screen and has "+ Template" and "Back to script" on a bar that stays in view.
- Each template sheet has: Rename, Base, Image…, Default (star), New based on this, Clear ink, Delete.
- Adding a board: with no templates, or with a default template, it is one tap as before. With templates and no default, a short list asks what to draw on (templates, last used first, then "Blank").
- Fade strength is a Settings choice: 25, 40, 55 or 70%.
- Delete can be undone. Files of deleted or renamed templates are left on disk; the tool never deletes a file.
- Two templates cannot have names that would be saved under the same file name.
- An image set on a board that has a base is drawn over the base and hides it. Remove the base or the image, whichever is not wanted.
- A board's shape follows the root of its chain. If that template later gets an image with other proportions, ink already drawn on boards built on it keeps its coordinates and may no longer sit where it did.
- "Use as default" on boards is gone (see §5.5).

### 5.11 Cue ends — R1, built in r1.0, extended in r1.3

**Request as received:** "support for end of cues (e.g. when a music should stop)".

Today a stop can only be written as another cue with "stop" in its description. That keeps the list flat: it cannot show what is running at a given line, or what was never stopped.

| Point | Design | Status |
|---|---|---|
| Token | `{/DEPT label \| description}`. The slash marks an end. Example: `{SND 5 \| mare}` … `{/SND 5 \| sfuma in 3s}`. | `[ASSUMED]` |
| Position | Anywhere a cue can go: after a word in dialogue or action, or on its own line (D4). | `[LOCKED]` |
| Pairing | An end closes the nearest earlier cue that is still open and has the same department and label. An end without a label closes the nearest earlier open cue of that department (K8). | `[ASSUMED]` |
| Which cues are expected to end | A per-department switch, "cues run until stopped". Default on for SND and VID, off for LX. It only affects what the popover offers first and one review hint. | `[ASSUMED]` |
| Entering one | Tap a word. The popover gains a row "End:" with the open cues before that point, most recent first, at most four. One tap places the end. The stage manager never types the token. | `[ASSUMED]` |
| In the margin | An end tag in the department colour, outlined instead of filled, with a stop square before the label. Same connector line to the word. | `[ASSUMED]` |
| Running rail | A thin line in the department colour down the cue margin from the start tag to the end tag, across pages, so what is running is visible on every page in between. | Should |
| Cue list | One row per cue. New columns: where it ends (page, cue line) and the end's description. CSV carries them. | `[ASSUMED]` |
| Editing | Changing a start cue's department or label changes its paired end in the same step (the pair would otherwise break). Deleting a start deletes its end. Both are one undo. This is the stage manager's own edit carried through, not renumbering (D7). | `[ASSUMED]` |
| Review hints | An end that closes nothing. A cue in a "runs until stopped" department that is still open at the end of the show. Hints, not errors. | `[ASSUMED]` |

Not in R1: fades with durations as data (D4), automatic "everything stops at blackout" rules.

**Change request (r1.3):** "not all video/audio cues need an end"; "fading can be another cue to signal the change or something an operator needs to remember"; a longer optional description shown only in the cue list; exports per department.

| Point | Design | Status |
|---|---|---|
| Plain end | `{/SND 5}` stays, for what an operator does by hand. It has no number and does not appear in the other software's cue numbering. | `[LOCKED]` |
| Linking cue | `{SND 6 / SND 5 \| text}`: SND 6 is a cue of its own and ends SND 5. Targets are separated by ` / `, any department: `{SND 9 / SND 6 / VID 2}`. Own label may be empty: `{SND / SND 5}`. | `[LOCKED]` |
| Reading a link | A part after ` / ` is a link only if it starts with an upper-case department code; otherwise the whole text is the label (`1/2`, `5 / 6`). Not tied to the Settings list, so changing departments never changes how a script reads. | `[ASSUMED]` |
| Pairing | Unchanged for each target: nearest earlier open cue of that department and number (no number: nearest of the department). A linking cue closes its targets first, then stays open itself. A target not found is a Review hint. | `[ASSUMED]` |
| "Runs" | Removed. No department is expected to end; Review no longer lists open cues. | `[LOCKED]` |
| Margin and rail | The linking cue is drawn exactly like a plain end: outlined tag, stop square before its number, short text as usual; hovering shows what it ends. The rail runs from the ended cue to that tag and may continue to the next; a chain shares one lane. | `[ASSUMED]` |
| Editing | Renumber or change department of a cue: its end token and every link to it follow. Delete a cue: its end token goes; a linking cue stays, without the link. Delete a linking cue: its targets reopen. One undo each. | `[ASSUMED]` |
| Notes | `{DEPT label \| short text \| notes}`. Shown in the cue list (screen, print, CSV), never in the margin; a dot marks the tag. One paragraph. | `[ASSUMED]` |
| Per department | Cue list: one CSV per department in one zip; print with one sheet per department. A cue ended by another department's cue says so on its own sheet. | `[ASSUMED]` |
| CSV | Existing columns keep their positions; "Ended by", "Ends" and "Notes" are appended. | `[ASSUMED]` |

As built in r1.0:

- The "End:" row offers only cues an end token can actually reach under the pairing rule: the latest open cue of each department, and earlier ones whose number no later open cue repeats. Departments marked "runs" come first.
- Placing an end opens the same small editor as a cue, titled with the cue it closes, so a note ("sfuma in 3s") can be added. The end has no number of its own.
- The running rail sits in the outer margin, right of the tags, one lane per overlapping cue, up to six lanes.
- Cue list on screen and in print: the end is a second line on its cue's row ("ends p. 12 — note · cue line"). The CSV has three extra columns. An end that closes nothing has its own row, marked with a square.
- Review panel: "Ends with no cue to close" counts toward the badge. "Still running at the end" lists unended cues of "runs" departments and is not counted, because one-shot effects are never ended.
- The "runs" switch is a tick box per department in Settings. Shows saved before r1.0 get it guessed from the code (SND, AUDIO, MUS, VID… on; others off).
- An end without a number re-pairs by position. If its cue's department is changed and another open cue of the new department sits between them, the end closes that one instead.

### 5.12 Frontmatter, front page and character list — built in r1.1

**Request as received:** "host a frontmatter with metadata to display on the first page like title, author, company and year of the representation. display just the values on the frontpage in the order described in the frontmatter itself, title with bigger fonts, the rest smaller. Allow to define characters to validate the rest of the script and potentially define call list later on. […] some expressions are used to quickly refer to groupings of characters without explicit enumeration, like ALL BUT x, or ALL OTHERS or OTHERS, exclude this by checks." Then: "personaggi should be printed on a separate page, with name/alias - description collected in the metadata".

```
---
title: Il mare
author: Marco Vitali
company: Compagnia del Porto
year: 2026
characters:
  - ANNA/A - la figlia
  - MARCO/M - il pescatore
  - SOLDATO 1
---
# ATTO PRIMO
```

| Point | Design | Status |
|---|---|---|
| Where | Only as the first thing in `script.md`, between two lines holding `---`. This is the form Obsidian shows as "Properties". | `[ASSUMED]` |
| Fields | `key: value`, one per line. Any key is accepted; nothing is required. A key may hold a list, either `[A, B]` on the line or `- item` lines beneath it. Quotes around a value are dropped. Lines starting with `#` are ignored. | `[ASSUMED]` |
| Front page | One page before the script. It shows the values only, never the keys, centred, in the order written. `title` (or `titolo`) is set large (38 px bold); everything else small (18 px). No running head, no page number, nothing on the facing page. | `[LOCKED]` by the request; sizes `[ASSUMED]` |
| Not on the front page | `characters` (or `personaggi`), which has its own page, and Obsidian's own `tags`, `aliases`, `cssclasses`, which are never shown. | `[ASSUMED]` |
| Character page | A page of its own after the front page, before the script. Heading: the key as typed (`Personaggi`, `Characters`). One line per character in the order written: **NAME** / ALIAS — description. No running head, no number, nothing facing it. Over 30 characters the list is set smaller in two columns. A longer list than fits one page is cut off. | `[LOCKED]` by the request; layout `[ASSUMED]` |
| Aliases | `NAME/ALIAS`, several allowed (`MARCO/M/MARCHINO`). A speech typed with an alias (`M: …`, `A e M: …`) is shown, checked and listed under the full name; `script.md` keeps what was typed. A name always wins over an alias spelled the same. `E` cannot be an alias: it is read as the connector. | `[ASSUMED]` |
| Page numbers | The front page and the character page have no number. The script still starts on page 1, so adding frontmatter to an existing show changes no page number. | `[ASSUMED]` |
| Title | `title` in the script wins over the title in Settings, which is then shown greyed. Without it, Settings applies as before. | `[ASSUMED]` |
| Character list | Each entry is `NAME`, `NAME/ALIAS`, either optionally followed by ` - description`. Names are compared in capitals with spaces collapsed, and printed in capitals. | `[ASSUMED]` |
| Check | Only when the list has at least one name. A speaker is accepted if the whole name is in the list. Otherwise it is split at `,` `/` `+` `&` and at the connectors `e`, `ed`, `and`, `y`, `et`, and each part is looked up. Parts not found are listed in Review under "Not in the character list", once per name with a count, and count toward the badge. A hint, not an error (as D7 for cues). | `[ASSUMED]` |
| Group names, never checked | `ALL`, `EVERYONE`, `EVERYBODY`, `TUTTI`, `TUTTE`; `OTHERS`, `THE OTHERS`, `ALL OTHERS`, `ALL THE OTHERS`, `ALTRI`, `GLI ALTRI`, `TUTTI GLI ALTRI`, `ALTRE`, `LE ALTRE`, `TUTTE LE ALTRE`; and `ALL / EVERYONE / TUTTI / TUTTE` followed by `BUT`, `EXCEPT`, `TRANNE`, `MENO`, `ECCETTO` or `SALVO` and anything. The names after `BUT` are not checked either. | `[LOCKED]` for the three forms named in the request; the rest `[ASSUMED]` |
| Other collective speakers | `CORO`, `DONNE` and the like are ordinary names: add them to the list. | `[ASSUMED]` |
| Listed but silent | Review also shows characters in the list with no speech of their own. Not counted in the badge. | `[ASSUMED]` |
| Editing | The frontmatter is one block: double-tap the front page or the character page, or use "Edit whole script…". Pen ink on either page belongs to that block and stays on the page it was drawn on. | `[ASSUMED]` |
| Tolerance | A `---` with no closing `---`, or with script lines such as `(action)` between the two, is not frontmatter; the lines stay in the script and appear in Review. A frontmatter without displayable values gives no front page; without characters, no character page. | `[ASSUMED]` |

Not built: the call list itself, a character list longer than one page, layout options, checking the names after `ALL BUT`.

Older releases: r1.0 and r0.1 do not know frontmatter. They keep the text but show its lines as unrecognised at the top of page 1.

## 6. Page layout `[LOCKED]`

Left page (script):

| Name column | Text column | Cue margin |
|---|---|---|
| Character name | Dialogue; actions in italics | Cue tags with connector lines |

- Simultaneous speech: the text column splits into one sub-column per speaker, name on top, text underneath.
- Right page (facing): the boards whose `{BOARD}` tokens fall on the left page. One board fills the page; several share it.
- Page numbers are computed at render time and are never used as identifiers.

## 7. Scope tiers

### R0 — rehearsal, 2026-10-08

| ID | Requirement | Built | Checked how |
|---|---|---|---|
| R0.1 | Paste or open the script text. Tolerant parse. Review list of unclassified lines. | Yes | Automated, with deliberately messy input |
| R0.2 | Page view in the §6 layout, including simultaneous speech. | Yes | Automated + screenshots |
| R0.3 | Edit any block's text in place. | Yes | Automated |
| R0.4 | Tap a word → cue pin. Standalone cue between lines. Department, optional label, optional description. | Yes | Automated, mouse and simulated touch |
| R0.5 | Ink over script pages: pen, eraser, undo, a few colours. Block-anchored with the "check" flag. | Yes | Automated, simulated pen. Not on a real pen. |
| R0.6 | Boards on the facing page: add at a point, choose image or blank, ink on it. | Yes | Automated |
| R0.7 | Cue list view, department filter, CSV export. | Yes | Automated |
| R0.8 | Print through the browser: script page left, boards right. | Yes | PDF output: page size and page count. Not on a printer. |
| R0.9 | Save and load in folder mode (Chrome/Edge). Autosave. Export-all button as backup. | Yes | Automated against a browser-private folder through the same file interface. The real folder dialog was not exercised. |

Test record, 2026-10-06: 79 automated checks pass in Chromium 141 on Linux, no script errors. Build R0.1 (boxed cue words): the same 79 plus 5 new ones pass, including a check that no word moves when cues are added. A generated 375-page script (147,000 words, 318 cues) loads in about 0.4 s; pinning a cue takes about 60 ms. The pen eraser end could not be simulated; the barrel-button eraser path was.

### R1 — released as r1.0

| ID | Requirement | Spec | Built | Checked how |
|---|---|---|---|---|
| R1.1 | Cue ends: token, pairing, one-tap entry, margin tag, cue list columns, review hints. | §5.11 | Yes | Automated, incl. missing and repeated numbers |
| R1.2 | Running rail in the cue margin. | §5.11 | Yes | Automated across a 13-page span; screenshot; PDF |
| R1.3 | Board templates: kept in the configuration, Templates view to draw them, a base per board and per template, chains, greyed locked rendering of the chain, loop guard. | §5.10 | Yes | Automated, simulated pen; screenshots |
| R1.4 | Template picker when adding a board, default template, change a board's base, "Copy to templates", rename carries through, delete guard. | §5.10 | Yes | Automated, incl. save to a folder and reload |

Test record for r1.0, 2026-10-06: 145 automated checks pass in Chromium 141 on Linux, no script errors: the 84 from r0.1, 23 for cue ends, 38 for templates. Same limits as before: simulated pen and touch, a browser-private folder instead of the real folder dialog, PDF instead of a printer. A show folder written by r0.1 opens in r1.0; a show using ends or templates opened in r0.1 would show `{/…}` tokens as unknown cues and ignore templates.

### r1.1 — built 2026-10-07, not yet committed or tagged

| ID | Requirement | Spec | Built | Checked how |
|---|---|---|---|---|
| R1.5 | Frontmatter block, front page with values in written order, title larger, title wins over Settings. | §5.12 | Yes | Automated; screenshot |
| R1.6 | Character list, speaker check with group names excluded, Review sections. | §5.12 | Yes | Automated |
| R1.7 | Character page; aliases resolved to the full name. | §5.12 | Yes | Automated; screenshot |

Test record for r1.1, 2026-10-07: 151 automated checks pass in Chromium 153 (Playwright headless shell) on Linux, no script errors: 127 existing and 24 new. The r1.0 suite as committed runs 127 checks here, not the 145 recorded above; the difference was not investigated. Same limits as before: simulated pen, no real folder dialog, no printer. The front page and the character page were not printed, and a list of more than 30 characters was not tried.

### Backlog — ordered after the first rehearsal

A call list built from the character list (§5.12). Renumber command with an old→new log (must keep cue pairs together). Hint for out-of-order labels. Clean-script export. Re-attach orphaned ink by hand. Highlighter, straight line and typed note tools. "Changed since last print" marks. Anything the first rehearsal shows.

### R2 — later

Follow-along view for the stage manager (D11); it can use R1.1 to show what is running. Standbys and warnings. More than one device at a time is not planned (D15).

## 8. Assumptions

| # | Assumption | Breaks if wrong |
|---|---|---|
| A1 | Spoken-word play. No score. | Cue anchoring |
| A2 | One person edits at a time. | K2, storage |
| A3 | The pen reports as a pen to the browser. Client answered "yes" to Q21; read as all four device checks passing. Not itemised. | D14, R0.5 |
| A7 | That laptop runs Chrome or Edge and is the machine that holds the show folder. Not stated in the answer. | R0.9 — in another browser the tool still works, but only with the in-browser fallback and backup files |
| A4 | A4 portrait. Q19 was answered "yes", which names neither a size nor single/double-sided, so this stands. | Page model |
| A5 | 80–150 pages, a few hundred cues. | Performance |
| A6 | The old Excalidraw workflow stays available as fallback during the first rehearsals. Nothing is migrated destructively. | Risk posture |

## 9. Open questions

One at a time.

| # | Question | Blocks |
|---|---|---|
| ~~Q14~~ | Answered: laptop with touchscreen and pen → D13. Browser and "same machine" not stated → A7. | — |
| ~~Q15~~ | Answered: assume one editor → D15. | — |
| ~~Q16~~ | Answered: follow-along view, later → D11, R2. | — |
| ~~Q17~~ | Answered: "yes solid draft" → K1 accepted. | — |
| ~~Q18~~ | Answered: acceptable for now, needs templates to draw on stage plans with props → D16, §5.10. | — |
| ~~Q20~~ | Answered: "will fix manually" → the real script is not shared; K7. | — |
| Q21 | Answered "yes". Read as: pen draws without scrolling, resting hand stays quiet, eraser end erases, print lines up. The answer does not say which were tried. | A3 — correct this if any of the four was not checked |
| Q19 | Answered "yes" to a two-part question. Still unknown: paper size, and single- or double-sided printing. A4 and the built print order stand. | §6, low priority |
| ~~Q22~~ | Answered: templates are boards marked as template, a template can depend on another, no movable props → D16, D18, §5.10. | — |
| ~~Q23~~ | Resolved by Q22: "depending on" means linked. | — |
| ~~Q26~~ | Answered: "live in configurations so they don't appear in the final script" → D18, K10, §5.10. | — |
| ~~Q24~~ | Answered: "build it now" → r1.0. Which file goes into the 2026-10-08 rehearsal is still the client's choice; r0.1 remains available as a git tag. | — |
| Q25 | Cue ends were built as assumed (`{/SND 5}`, one list row per cue). Not explicitly confirmed; change requests go to the backlog. | §5.11 |
| **Q27** | **Where should the git repository live so it outlasts this session: a folder on the laptop, a GitHub repository, or only the downloadable archive?** | **PLAN §8 — ACTIVE** |

## 10. Sources

- Obsidian licence: https://obsidian.md/license
- Folder access browser support: https://web.dev/articles/files/open-a-directory
- Prompt book conventions: https://theatrecrafts.com/pages/home/topics/stage-management/the-prompt-book/
- Tools surveyed in v0.1 and now dropped: Excalidraw plugin, obsidian-fountain, Downstage, DigiScript, Pandoc. DigiScript (https://github.com/dreamteamprod/DigiScript) stays relevant as a reference for R2.
