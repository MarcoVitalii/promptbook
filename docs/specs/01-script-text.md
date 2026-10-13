# Script text — TXT

**Covers:** the script format, editing, undo, the frontmatter with its character list, comments.
**Code:** `src/core.js` (PARSE, frontmatter, comments, text edits, history), `src/view.js` (in-place text editor).
**Checks:** `test/unit/parse`, `test/parse-undo`, `test/frontmatter`, `test/notes-todos`.
**Columns and tags:** explained in `SPEC.md`, "How to read this specification".

---

## 1. Intent

The script lives in Word as plain text: `CHARACTER: dialogue`, actions in parentheses. Every edit forces a re-export, a re-import into the annotation tool and a re-alignment of every drawing (`SPEC.md` §1.1). The intent is that the writer keeps typing exactly what they type today, and that an edit to the text never costs the stage manager anything (goal G1).

Two decisions carry that intent: Word is left behind after a one-time move (D2), and the format is the convention already in use plus `#` headings and one cue token, with no new markup language (D3).

Later requests, as received:

- **Frontmatter, r1.1:** "host a frontmatter with metadata to display on the first page like title, author, company and year of the representation. display just the values on the frontpage in the order described in the frontmatter itself, title with bigger fonts, the rest smaller. Allow to define characters to validate the rest of the script and potentially define call list later on. […] some expressions are used to quickly refer to groupings of characters without explicit enumeration, like ALL BUT x, or ALL OTHERS or OTHERS, exclude this by checks." Then: "personaggi should be printed on a separate page, with name/alias - description collected in the metadata".
- **Comments, r1.4:** commented-out blocks to stage changes without losing content.
- **Change request, 2026-10-10:** "Also implement movement for blocks with the same dynamics of cues" (the whole request is quoted in `09-workbench.md`). Read as `[ASSUMED]`: a block of the script (a speech, an action, a heading, a cue or a board on its own line) is pressed, dragged and released at another place, with the gestures of CUE-25 to CUE-34. The client has also said "blocks" for boards (`04-boards.md` §1); a board is covered, because it is the line that holds its token.

## 2. Requirements

### 2.1 Format

What the writer types, unchanged from today:

```
# ATTO PRIMO
## Scena 1

(Buio. Si sente il mare.)

ANNA: Chi è là? (si volta) Rispondi!
MARCO: Sono io.
& ANNA: Non ti credo!
```

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| TXT-1 | `# text` is an act, `## text` a scene. | D3 `[LOCKED]` | r0 | unit/parse |
| TXT-2 | `NAME: text` is a speech. NAME is everything before the first colon when it contains no lowercase letters other than the connectors `e`, `ed`, `and`, `&`. Unicode letters count (accented capitals, K7). | D3 `[LOCKED]`, K7 | r0 | unit/parse, parse-undo |
| TXT-3 | `(text)` on its own line is an action. `(text)` inside a speech is an inline direction, shown in italics. | D3 `[LOCKED]` | r0 | unit/parse |
| TXT-4 | `& NAME: text` is spoken at the same time as the speech above. Any number may be chained. | D3 `[LOCKED]` | r0 | unit/parse |
| TXT-5 | Any other line continues the block above. | D3 `[LOCKED]` | r0 | parse-undo |
| TXT-6 | A line the parser cannot classify is listed for review and never dropped. The text written back is the text read: a parse followed by a save changes nothing. | D3, K7 | r0 | unit/parse, parse-undo, scale-folder |
| TXT-7 | Tolerances for a pasted Word text: a line starting with `ATTO`, `SCENA`, `PROLOGO`, `EPILOGO`, `QUADRO`, `PARTE`, `INTERVALLO`, `FINE` (and the English equivalents) is a heading without `#`; `NAME (direction): text` is a speech with the direction in italics; `NAME:text` and `NAME : text` are accepted; `10:30` inside a line is not a speaker; an action that opens with `(` and closes on a later line is one block. | as built, K7 | r0 | unit/parse, parse-undo |

### 2.2 Editing and undo

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| TXT-8 | Any block's text is edited in place: double-tap, double-click or long press on the block, or "Edit text" in the tap popover. Ctrl+Enter saves, Esc cancels. | R0.3 | r0 | interact, misc |
| TXT-9 | "Edit whole script…" in the menu opens the full text. A new show can start from pasted text. | R0.1 | r0 | — |
| TXT-10 | Every change to the text is one undo step, and undo returns the text exactly. Undo and redo: toolbar, Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z. | R0.5 | r0 | unit/parse, parse-undo, interact |
| TXT-28 | A block is moved by pressing the grip in its left gutter, dragging, and releasing between two blocks. Every row has one grip: speech, action, heading, unrecognised line, a cue or board on its own line; speeches said together move as one. None on the frontmatter, on a comment, or on the part of a block carried over from the page before. The grip is faint (shown on hover with a mouse), never printed, and the pen draws no ink on it. A board is also moved by dragging its tag in the margin. | request 2026-10-10 `[ASSUMED]` | r1.9 | block-move, cue-move |
| TXT-29 | The gestures are those of a cue tag (CUE-26, CUE-29, CUE-31, CUE-34, INP-8 to INP-10): mouse and pen drag after 8 px, a finger holds 0.3 s first and otherwise scrolls; the script scrolls near the top and bottom edge; Escape, a cancelled pointer or a release with no place marked change nothing; no drag while a text is edited. A press and release on a grip does nothing. | same | r1.9 | block-move |
| TXT-30 | While dragging, a label with the start of the block follows the pointer, the block is dimmed, and a line marks the place: the nearest edge between two blocks of the script page under the pointer. No place is marked on the facing page, above the frontmatter, inside a block that runs over two pages, or where the block already is. | as built | r1.9 | block-move |
| TXT-31 | Release: the lines of the block are cut and written at the marked place, unchanged, with their cues; ink stays on the block. One undo step. The moved block keeps the blank lines above it; the block that followed it keeps at least as many; an unrecognised line that would touch the line above gets a blank line, so that it is not read as part of it (TXT-5). A move that leaves an end above its cue is kept and a message says so (as CUE-33). | as built | r1.9 | unit/block-move, block-move |

### 2.3 Frontmatter and character list

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

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| TXT-11 | Frontmatter is recognised only as the first thing in `script.md`, between two lines holding `---`. This is the form Obsidian shows as "Properties". | D19 `[ASSUMED]` | r1.1 | frontmatter |
| TXT-12 | Fields are `key: value`, one per line. Any key is accepted; none is required. A key may hold a list, either `[A, B]` on the line or `- item` lines beneath it. Quotes around a value are dropped. Lines starting with `#` are ignored. | D19 `[ASSUMED]` | r1.1 | frontmatter, unit/parse |
| TXT-13 | `title` (or `titolo`) in the script wins over the title in Settings, which is then shown greyed. Without it, Settings applies. | D19 `[ASSUMED]` | r1.1 | frontmatter |
| TXT-14 | A character entry is `NAME` or `NAME/ALIAS`, optionally followed by ` - description`. Names are compared in capitals with spaces collapsed, and printed in capitals. The key is `characters` or `personaggi`. | D19 `[ASSUMED]` | r1.1 | frontmatter |
| TXT-15 | Aliases: `NAME/ALIAS`, several allowed (`MARCO/M/MARCHINO`). A speech typed with an alias (`M: …`, `A e M: …`) is shown, checked and listed under the full name; `script.md` keeps what was typed. A name always wins over an alias spelled the same. `E` cannot be an alias: it is read as the connector. | D19 `[ASSUMED]` | r1.1 | frontmatter, unit/parse |
| TXT-16 | The speaker check runs only when the list has at least one name. A speaker is accepted if the whole name is in the list. Otherwise it is split at `,` `/` `+` `&` and at the connectors `e`, `ed`, `and`, `y`, `et`, and each part is looked up. Parts not found are listed in Review under "Not in the character list", once per name with a count, and count toward the badge. A hint, not an error (C10). | D19 `[ASSUMED]` | r1.1 | frontmatter, unit/parse |
| TXT-17 | Group names are never checked: `ALL`, `EVERYONE`, `EVERYBODY`, `TUTTI`, `TUTTE`; `OTHERS`, `THE OTHERS`, `ALL OTHERS`, `ALL THE OTHERS`, `ALTRI`, `GLI ALTRI`, `TUTTI GLI ALTRI`, `ALTRE`, `LE ALTRE`, `TUTTE LE ALTRE`; and `ALL / EVERYONE / TUTTI / TUTTE` followed by `BUT`, `EXCEPT`, `TRANNE`, `MENO`, `ECCETTO` or `SALVO` and anything. The names after `BUT` are not checked either. | D19: `[LOCKED]` for the three forms named in the request, the rest `[ASSUMED]` | r1.1 | frontmatter |
| TXT-18 | Other collective speakers (`CORO`, `DONNE`) are ordinary names: they are added to the list. | D19 `[ASSUMED]` | r1.1 | — |
| TXT-19 | Review also shows characters in the list with no speech of their own. Not counted in the badge. | D19 `[ASSUMED]` | r1.1 | frontmatter |
| TXT-20 | The frontmatter is one block: it is edited by double-tapping the front page or the character page, or with "Edit whole script…". | D19 `[ASSUMED]` | r1.1 | — |
| TXT-21 | A `---` with no closing `---`, or with script lines such as `(action)` between the two, is not frontmatter: the lines stay in the script and appear in Review. A frontmatter without displayable values gives no front page; without characters, no character page. | D19 `[ASSUMED]` | r1.1 | frontmatter |

The front page and the character page are specified in `06-pages-print.md` (PAG-7 to PAG-9).

### 2.4 Comments

| ID | Requirement | Basis | Since | Checked by |
|---|---|---|---|---|
| TXT-22 | Lines between two lines holding `%%`, or one line `%% text %%`, are a comment. It is a block of its own and ends the block above. Blank lines inside are kept. This is Obsidian's comment form. | request r1.4 `[LOCKED]` | r1.4 | notes-todos, unit/parse |
| TXT-23 | A `%%` that is never closed is not a comment. Its line is an unrecognised line; the text after it stays in the script. | `[ASSUMED]` | r1.4 | notes-todos |
| TXT-24 | On the page a comment has no text and no height: a `%%` marker in the left gutter, never printed. A tap shows the content, "Restore" and "Edit text". | `[ASSUMED]` | r1.4 | notes-todos |
| TXT-25 | "Comment out" in a block's text editor makes one; "Restore" on a comment undoes it. One undo each. | `[ASSUMED]` | r1.4 | notes-todos |
| TXT-26 | Cues inside a comment are not parsed. Ink on the block becomes orphaned and re-attaches when the same text is back. | `[ASSUMED]` | r1.4 | notes-todos, unit/parse |
| TXT-27 | A comment covers whole lines. Review lists "Commented out", not counted in the badge. | `[ASSUMED]` | r1.4 | notes-todos |

## 3. Consequences

**Moving a block is a text edit like any other.** Nothing is stored about the move; `script.md` simply has the lines in another order, so an older release opens the result. The grip takes an 18 px strip of the gutter from the pen, on the first line of each block; ink flags sit in the same gutter and cover part of the grip while they show. A block cannot be dropped between two speeches said together, nor can one of them be taken out by dragging: that is done in the text. Not built: dragging the board figure itself on the facing page, moving several blocks at once, keyboard movement. Tried: The client tried the r1.9 features on a real show and reported "all working as expected" (2026-10-10). Which machine, pointer and keyboard were used is not recorded.

**The block is the unit of everything else.** The parser turns the text into blocks of seven kinds: heading, speech, action, unrecognised line (`para`), a line holding only tokens (`mark`), comment (`note`), frontmatter (`meta`). Ink is anchored to a block (INK-2), pages are filled with blocks (PAG), two revisions are compared block by block (HIS-8), and a page lock records blocks (PAG-12).

**The text is never patched; it is replaced.** Every edit produces a new full text, which is parsed again. Blocks keep their identity when their text is unchanged at the start or the end of the script; in between they are matched by identical text, then by shared words (a similarity of at least 0.34). This is what lets ink survive an edit, including an edit made in another program.

**Tolerant by design, so some lines are read wrongly.** The price of accepting a pasted Word text:

- A colon after an all-capitals word always makes a speech. `NOTA: …` or `TITOLO: Il mare` outside the frontmatter is a speech by a character called NOTA or TITOLO. There is no way to force another reading.
- `Titolo: Il mare` in mixed case is not a speech and lands in Review as an unrecognised line.
- A name that appears once in the Review character count is usually a typo or a misread line (UI-1).
- The real script was not shared (Q20): misread lines are fixed by hand in the tool, guided by Review (K7).

**Parser limits as built.** These are thresholds in the code, not client decisions: a speaker name has at most 48 characters and 6 words and no parentheses; a heading without `#` has at most 70 characters; in a speaker name the code also accepts the connectors `y` and `et`, which TXT-2 does not list.

**Undo is a stack of 200 steps held in memory.** It is emptied when a show is opened, reloaded from disk, restored from a revision or switched to another variant. A text step stores only the span that changed.

**What the format does not have.** No emphasis, verse, lyrics or manual page break; a `%%` span inside a speech is backlog. The comparison with Fountain and Downstage, and why the native format was kept, is in `docs/background/syntax-comparison.md`.

**Compatibility.**

| Older release | What it does with newer text |
|---|---|
| r0.1, r1.0 | Do not know frontmatter: they keep the text and show its lines as unrecognised at the top of page 1. |
| r1.3 and earlier | Show `%%` text as unrecognised lines and print it. |

**Not built:** the call list from the character list; layout options for the front page; checking the names after `ALL BUT`; a clean-script export; a `%%` span inside a speech.

**Not verified:** the front page and the character page were not printed; a list of more than 30 characters was tried only in the checks (60 and 250 generated names, PAG-8), not with a real cast list; the comment marker was not tried with a real pen or finger.
